"""
NutriSense AI · IDP P020: Stage 4b: meal-suggestion acceptance model.

Task: given a meal the app is about to suggest and what we know about the user
(habits from their first week of logs, goal, diet), predict whether they will
accept it. Used to re-rank the gap-closing candidates so suggestions are both
nutritious and something the person will actually eat.

Trained on suggestions shown on days 7-13 using features from days 0-6 only
(no look-ahead). Split by user.

Compared:
  popularity baseline  meal's acceptance rate in the training users
  logistic regression
  gradient boosting
  neural network (MLP)
"""

from __future__ import annotations

import json
import time

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from .common import MODELS, PROCESSED, REPORTS, get_logger, load_config

log = get_logger("train_rec")

FEATURES = ["position", "times_eaten", "taste_similarity", "u_avg_kcal", "u_junk_share", "m_kcal", "m_protein", "m_fiber", "m_prep_min",
            "m_type_breakfast", "m_type_main", "m_type_snack", "goal_lose", "goal_maintain", "goal_gain", "diet_veg", "diet_nonveg",
            "male", "age", "bmi", "kcal_x_lose", "protein_x_gain"]


def hit_at_1(df: pd.DataFrame, score: np.ndarray) -> float:
    """Share of slots where the top-ranked of the 3 suggestions was accepted."""
    d = df.assign(score=score)
    top = d.loc[d.groupby(["user_id", "day", "slot"])["score"].idxmax()]
    return float(top["accepted"].mean())


def run() -> dict:
    cfg = load_config()
    df = pd.read_csv(PROCESSED / "recommender_dataset.csv")
    X, y, groups = df[FEATURES].to_numpy(float), df["accepted"].to_numpy(), df["user_id"].to_numpy()
    tr, te = next(GroupShuffleSplit(n_splits=1, test_size=cfg["recommender"]["test_size"], random_state=cfg["seed"]).split(X, y, groups))
    log.info("recommender: %d features | train %d impressions | test %d impressions | accept rate %.3f", len(FEATURES), len(tr), len(te), y.mean())

    pop = df.iloc[tr].groupby("meal_id")["accepted"].mean()
    p_pop = df.iloc[te]["meal_id"].map(pop).fillna(y[tr].mean()).to_numpy()
    results = {"popularity_baseline": {"auc": round(roc_auc_score(y[te], p_pop), 4), "log_loss": round(log_loss(y[te], np.clip(p_pop, 1e-4, 1 - 1e-4)), 4), "hit_at_1": round(hit_at_1(df.iloc[te], p_pop), 4)}}
    results["random_pick"] = {"hit_at_1": round(float(y[te].mean()), 4)}
    log.info("popularity_baseline  AUC %.3f | hit@1 %.3f (random pick %.3f)", results["popularity_baseline"]["auc"], results["popularity_baseline"]["hit_at_1"], results["random_pick"]["hit_at_1"])

    models = {
        "logistic_regression": make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000)),
        "gradient_boosting": HistGradientBoostingClassifier(max_iter=300, learning_rate=0.06, max_leaf_nodes=31, random_state=cfg["seed"]),
        "neural_network_mlp": make_pipeline(StandardScaler(), MLPClassifier(hidden_layer_sizes=(64, 32), alpha=1e-3, max_iter=200, early_stopping=True, random_state=cfg["seed"])),
    }
    fitted = {}
    for name, m in models.items():
        t0 = time.time()
        m.fit(X[tr], y[tr])
        p = m.predict_proba(X[te])[:, 1]
        fitted[name] = m
        results[name] = {"auc": round(roc_auc_score(y[te], p), 4), "log_loss": round(log_loss(y[te], p), 4), "hit_at_1": round(hit_at_1(df.iloc[te], p), 4), "fit_seconds": round(time.time() - t0, 1)}
        log.info("%-20s AUC %.3f | log-loss %.3f | hit@1 %.3f | fit %.1fs", name, results[name]["auc"], results[name]["log_loss"], results[name]["hit_at_1"], results[name]["fit_seconds"])

    best = max(fitted, key=lambda n: results[n]["auc"])
    importance = {}
    if best == "logistic_regression":
        coef = fitted[best][-1].coef_[0]
        importance = dict(sorted(zip(FEATURES, np.round(coef, 3).tolist()), key=lambda kv: -abs(kv[1])))
    else:
        from sklearn.inspection import permutation_importance

        sub = np.random.default_rng(cfg["seed"]).choice(te, size=min(6000, len(te)), replace=False)
        pi = permutation_importance(fitted[best], X[sub], y[sub], scoring="roc_auc", n_repeats=3, random_state=cfg["seed"])
        importance = dict(sorted(zip(FEATURES, np.round(pi.importances_mean, 4).tolist()), key=lambda kv: -kv[1]))
    MODELS.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": fitted[best], "features": FEATURES}, MODELS / "recommender_model.joblib")
    summary = {"task": "P(user accepts a suggested meal)", "selected_model": best, "selection_metric": "test ROC-AUC", "features": FEATURES,
               "n_train": int(len(tr)), "n_test": int(len(te)), "results": results, "feature_importance": importance}
    (REPORTS / "recommender_metrics.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log.info("selected %s -> models/recommender_model.joblib | top features: %s", best, list(importance)[:5])
    return summary


if __name__ == "__main__":
    run()
