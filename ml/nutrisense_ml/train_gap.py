"""
NutriSense AI · IDP P020: Stage 4a: nutrient-gap model.

Task: from a person's profile and their first 3 days of logging, predict whether
each nutrient will be adequate / need attention / be a higher priority over the
next 7 days. This drives the app's "Nutrient check" and action plan.

Compared (the solution-selection table from the project review):
  rule baseline        status from the 3-day average alone (what a calculator does)
  logistic regression  linear ML
  random forest        tree ensemble
  gradient boosting    tree ensemble
  neural network (MLP) deep-learning family, 2 hidden layers

Split by USER (no person appears in both train and test). Model selection uses
3-fold grouped cross-validation on the training users; the test set is touched once.
"""

from __future__ import annotations

import json
import time

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.multioutput import MultiOutputClassifier, MultiOutputRegressor
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from .common import MODELS, PROCESSED, REPORTS, get_logger, load_config, status_of
from .estimators import ShareThenThreshold

log = get_logger("train_gap")


def candidates(seed: int) -> dict:
    return {
        "logistic_regression": make_pipeline(StandardScaler(), MultiOutputClassifier(LogisticRegression(max_iter=2000, C=0.5, class_weight="balanced"))),
        "random_forest": MultiOutputClassifier(RandomForestClassifier(n_estimators=300, min_samples_leaf=3, class_weight="balanced_subsample", n_jobs=-1, random_state=seed)),
        "gradient_boosting": MultiOutputClassifier(HistGradientBoostingClassifier(max_iter=250, learning_rate=0.06, max_leaf_nodes=15, l2_regularization=1.0, class_weight="balanced", random_state=seed)),
        "neural_network_mlp": make_pipeline(StandardScaler(), MultiOutputClassifier(MLPClassifier(hidden_layer_sizes=(64, 32), alpha=1e-3, learning_rate_init=1e-3, max_iter=600, early_stopping=True, random_state=seed))),
    }


def regressors(seed: int, thresholds: dict) -> dict:
    return {
        "ridge_share_regression": ShareThenThreshold(make_pipeline(StandardScaler(), Ridge(alpha=3.0)), thresholds),
        "gbm_share_regression": ShareThenThreshold(MultiOutputRegressor(HistGradientBoostingRegressor(max_iter=200, learning_rate=0.05, max_leaf_nodes=15, l2_regularization=1.0, random_state=seed)), thresholds),
        "mlp_share_regression": ShareThenThreshold(make_pipeline(StandardScaler(), MLPRegressor(hidden_layer_sizes=(64, 32), alpha=1e-3, max_iter=800, early_stopping=True, random_state=seed)), thresholds),
    }


def scores(Y_true: np.ndarray, Y_pred: np.ndarray, names: list[str]) -> dict:
    per = {n: {"macro_f1": round(f1_score(Y_true[:, i], Y_pred[:, i], average="macro", labels=[0, 1, 2], zero_division=0), 4),
               "accuracy": round(accuracy_score(Y_true[:, i], Y_pred[:, i]), 4)} for i, n in enumerate(names)}
    return {"mean_macro_f1": round(float(np.mean([v["macro_f1"] for v in per.values()])), 4),
            "mean_accuracy": round(float(np.mean([v["accuracy"] for v in per.values()])), 4), "per_nutrient": per}


def run() -> dict:
    cfg = load_config()
    g = cfg["gap_model"]
    names = g["model_nutrients"]
    df = pd.read_csv(PROCESSED / "gap_dataset.csv")
    feats = [c for c in df.columns if c.startswith("h_") or c in ["age", "male", "bmi", "activity_factor", "diet_veg", "diet_egg", "diet_nonveg", "diet_vegan", "goal_lose", "goal_maintain", "goal_gain"]]
    X, Y, groups = df[feats].to_numpy(), df[[f"y_{n}" for n in names]].to_numpy(), df["user_id"].to_numpy()
    S = df[[f"y_{n}_share" for n in names]].to_numpy()
    H = df[[f"h_{n}_share" for n in names]].to_numpy()

    tr, te = next(GroupShuffleSplit(n_splits=1, test_size=g["test_size"], random_state=cfg["seed"]).split(X, Y, groups))
    log.info("gap model: %d features | train %d rows (%d users) | test %d rows (%d users)", len(feats), len(tr), len(set(groups[tr])), len(te), len(set(groups[te])))

    # rule baseline: classify the 3-day share directly
    base = np.stack([[status_of(s, g["thresholds"]) for s in df[f"h_{n}_share"]] for n in names], axis=1)
    results = {"rule_baseline": {"cv": None, "test": scores(Y[te], base[te], names), "fit_seconds": 0}}
    log.info("rule_baseline        test mean macro-F1 %.3f", results["rule_baseline"]["test"]["mean_macro_f1"])

    gkf = GroupKFold(n_splits=3)
    fitted = {}
    for name, model in candidates(cfg["seed"]).items():
        cv = []
        for k, (a, b) in enumerate(gkf.split(X[tr], Y[tr], groups[tr])):
            m = candidates(cfg["seed"])[name].fit(X[tr][a], Y[tr][a])
            cv.append(scores(Y[tr][b], m.predict(X[tr][b]), names)["mean_macro_f1"])
        t0 = time.time()
        model.fit(X[tr], Y[tr])
        secs = round(time.time() - t0, 2)
        fitted[name] = model
        results[name] = {"cv_mean_macro_f1": round(float(np.mean(cv)), 4), "cv_std": round(float(np.std(cv)), 4), "test": scores(Y[te], model.predict(X[te]), names), "fit_seconds": secs}
        log.info("%-20s cv macro-F1 %.3f ± %.3f | test %.3f | fit %.1fs", name, np.mean(cv), np.std(cv), results[name]["test"]["mean_macro_f1"], secs)

    for name, model in regressors(cfg["seed"], g["thresholds"]).items():
        cv = []
        for a, b in gkf.split(X[tr], Y[tr], groups[tr]):
            m = regressors(cfg["seed"], g["thresholds"])[name].fit(X[tr][a], S[tr][a])
            cv.append(scores(Y[tr][b], m.predict(X[tr][b]), names)["mean_macro_f1"])
        t0 = time.time()
        model.fit(X[tr], S[tr])
        secs = round(time.time() - t0, 2)
        fitted[name] = model
        mae = float(np.mean(np.abs(model.predict_share(X[te]) - S[te])))
        results[name] = {"cv_mean_macro_f1": round(float(np.mean(cv)), 4), "cv_std": round(float(np.std(cv)), 4), "test": scores(Y[te], model.predict(X[te]), names), "test_share_mae": round(mae, 4), "fit_seconds": secs}
        log.info("%-20s cv macro-F1 %.3f ± %.3f | test %.3f | share MAE %.3f | fit %.1fs", name, np.mean(cv), np.std(cv), results[name]["test"]["mean_macro_f1"], mae, secs)
    results["rule_baseline"]["test_share_mae"] = round(float(np.mean(np.abs(H[te] - S[te]))), 4)
    log.info("rule_baseline        share MAE %.3f (3-day average used as the forecast)", results["rule_baseline"]["test_share_mae"])

    best = max(fitted, key=lambda n: results[n]["cv_mean_macro_f1"])
    Yp = fitted[best].predict(X[te])
    cms = {n: confusion_matrix(Y[te][:, i], Yp[:, i], labels=[0, 1, 2]).tolist() for i, n in enumerate(names)}
    MODELS.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": fitted[best], "features": feats, "nutrients": names, "classes": ["adequate", "attention", "priority"], "config": g}, MODELS / "gap_model.joblib")
    summary = {"task": "7-day nutrient gap status from 3 days of logs + profile", "selected_model": best, "selection_metric": "grouped 3-fold CV mean macro-F1",
               "features": feats, "n_train_rows": int(len(tr)), "n_test_rows": int(len(te)), "results": results, "confusion_matrices_best": cms,
               "vitD_note": "vitamin D is 'higher priority' for ~98% of the synthetic cohort (food alone rarely meets 15 µg); the app uses a rule + sunlight advice instead of a model"}
    (REPORTS / "gap_model_metrics.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    gain = results[best]["test"]["mean_macro_f1"] - results["rule_baseline"]["test"]["mean_macro_f1"]
    log.info("selected %s | test macro-F1 %.3f (%+.3f vs rule baseline) -> models/gap_model.joblib", best, results[best]["test"]["mean_macro_f1"], gain)
    return summary


if __name__ == "__main__":
    run()
