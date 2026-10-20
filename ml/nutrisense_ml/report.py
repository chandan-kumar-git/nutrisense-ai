"""
NutriSense AI · IDP P020: Stage 5: evaluation report.

Reads the metrics written by the training stages and produces:
  reports/figures/*.png   model comparisons, confusion matrices, feature importance,
                          data-cleaning funnel, label balance
  models/MODEL_CARD.md    what each model does, how it was trained, how well it
                          does, and what it must not be used for
  models/gap_model_export.json  linear coefficients of the gap model, so the app
                          can run it in JavaScript without Python
Every number in these files comes from the latest pipeline run.
"""

from __future__ import annotations

import json
from datetime import datetime

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .common import FIGURES, MODELS, PROCESSED, REPORTS, get_logger, load_config

log = get_logger("report")
INK, LIME, LEAF, ORANGE, GREY = "#121412", "#d7f26b", "#7cc242", "#ff8a4c", "#c9ccc4"
plt.rcParams.update({"font.size": 10, "axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": "#888", "figure.dpi": 140})


def _bar(names, values, title, xlabel, path, highlight, baseline=None):
    fig, ax = plt.subplots(figsize=(7, 0.55 * len(names) + 1.2))
    colors = [LEAF if n == highlight else (GREY if "baseline" in n or "random" in n else LIME) for n in names]
    ax.barh(names, values, color=colors, edgecolor=INK, linewidth=0.6)
    for i, v in enumerate(values):
        ax.text(v + max(values) * 0.01, i, f"{v:.3f}", va="center")
    if baseline is not None:
        ax.axvline(baseline, color=ORANGE, ls="--", lw=1)
    ax.set_title(title, loc="left", fontweight="bold")
    ax.set_xlabel(xlabel)
    ax.invert_yaxis()
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def run() -> None:
    cfg = load_config()
    FIGURES.mkdir(parents=True, exist_ok=True)
    gap = json.loads((REPORTS / "gap_model_metrics.json").read_text())
    rec = json.loads((REPORTS / "recommender_metrics.json").read_text())
    dq = json.loads((REPORTS / "data_quality.json").read_text())

    # 1. gap model comparison
    gr = gap["results"]
    names = list(gr)
    _bar(names, [gr[n]["test"]["mean_macro_f1"] for n in names], "Nutrient-gap model · test macro-F1 (5 nutrients)", "macro-F1 (higher is better)",
         FIGURES / "gap_model_comparison.png", gap["selected_model"], gr["rule_baseline"]["test"]["mean_macro_f1"])
    mae_names = [n for n in names if "test_share_mae" in gr[n]]
    _bar(mae_names, [gr[n]["test_share_mae"] for n in mae_names], "Forecast error of next week's intake (share of RDA)", "mean absolute error (lower is better)",
         FIGURES / "gap_forecast_error.png", gap["selected_model"])

    # 2. confusion matrices for the selected gap model
    cms = gap["confusion_matrices_best"]
    fig, axes = plt.subplots(1, len(cms), figsize=(3.1 * len(cms), 3.2))
    for ax, (n, cm) in zip(axes, cms.items()):
        cm = np.array(cm)
        ax.imshow(cm, cmap="YlGn")
        for (i, j), v in np.ndenumerate(cm):
            ax.text(j, i, v, ha="center", va="center", color=INK)
        ax.set_xticks(range(3), ["ok", "watch", "prio"])
        ax.set_yticks(range(3), ["ok", "watch", "prio"])
        ax.set_title(n, fontweight="bold")
        ax.set_xlabel("predicted")
    axes[0].set_ylabel("actual")
    fig.suptitle(f"Confusion matrices · {gap['selected_model']} (test users)", x=0.01, ha="left", fontweight="bold")
    fig.tight_layout()
    fig.savefig(FIGURES / "gap_confusion_matrices.png")
    plt.close(fig)

    # 3. recommender comparison + importance
    rr = rec["results"]
    rn = [n for n in rr if "hit_at_1" in rr[n]]
    _bar(rn, [rr[n]["hit_at_1"] for n in rn], "Recommender · top suggestion accepted (hit@1)", "share of slots", FIGURES / "recommender_comparison.png", rec["selected_model"], rr["random_pick"]["hit_at_1"])
    imp = list(rec["feature_importance"].items())[:10]
    _bar([k for k, _ in imp], [abs(v) for _, v in imp], f"What drives acceptance · {rec['selected_model']}", "permutation importance (AUC drop)", FIGURES / "recommender_feature_importance.png", None)

    # 4. data cleaning funnel and label balance
    steps = [("raw rows", dq["rows_in"]), ("after unknown foods", dq["rows_in"] - dq["unresolved_dropped"]), ("after duplicates", dq["rows_in"] - dq["unresolved_dropped"] - dq["duplicates_removed"]), ("clean rows", dq["rows_out"])]
    fig, ax = plt.subplots(figsize=(7, 2.6))
    ax.barh([s for s, _ in steps], [v for _, v in steps], color=[GREY, LIME, LIME, LEAF], edgecolor=INK, linewidth=0.6)
    for i, (_, v) in enumerate(steps):
        ax.text(v, i, f" {v:,}", va="center")
    ax.invert_yaxis()
    ax.set_title(f"Data cleaning · {dq['names_fixed_by_fuzzy_match']:,} names repaired, {dq['missing_servings'] + dq['impossible_servings']:,} portions imputed", loc="left", fontweight="bold")
    fig.tight_layout()
    fig.savefig(FIGURES / "data_cleaning_funnel.png")
    plt.close(fig)

    gd = pd.read_csv(PROCESSED / "gap_dataset.csv")
    nuts = cfg["gap_model"]["nutrients"]
    shares = np.array([[(gd[f"y_{n}"] == c).mean() for c in range(3)] for n in nuts])
    fig, ax = plt.subplots(figsize=(7, 3))
    left = np.zeros(len(nuts))
    for c, (lab, col) in enumerate([("adequate", LEAF), ("needs attention", ORANGE), ("higher priority", "#f2645a")]):
        ax.barh(nuts, shares[:, c], left=left, color=col, label=lab, edgecolor="white")
        left += shares[:, c]
    ax.legend(ncol=3, loc="lower center", bbox_to_anchor=(0.5, -0.45), frameon=False)
    ax.set_title("Next-week nutrient status across the synthetic cohort", loc="left", fontweight="bold")
    ax.invert_yaxis()
    fig.tight_layout()
    fig.savefig(FIGURES / "label_balance.png")
    plt.close(fig)

    # 5. export the linear gap model for the app
    bundle = joblib.load(MODELS / "gap_model.joblib")
    model = bundle["model"]
    if hasattr(model, "regressor") and hasattr(model.regressor, "named_steps"):
        sc, rg = model.regressor.named_steps["standardscaler"], model.regressor.named_steps["ridge"]
        export = {"type": "ridge_share_regression", "features": bundle["features"], "nutrients": bundle["nutrients"], "mean": sc.mean_.round(6).tolist(),
                  "scale": sc.scale_.round(6).tolist(), "coef": rg.coef_.round(6).tolist(), "intercept": rg.intercept_.round(6).tolist(), "thresholds": cfg["gap_model"]["thresholds"]}
        (MODELS / "gap_model_export.json").write_text(json.dumps(export), encoding="utf-8")

    # 6. model card
    best_g = gr[gap["selected_model"]]["test"]
    base_g = gr["rule_baseline"]["test"]
    best_r = rr[rec["selected_model"]]
    per = "\n".join(f"| {n} | {best_g['per_nutrient'][n]['macro_f1']:.3f} | {base_g['per_nutrient'][n]['macro_f1']:.3f} | {best_g['per_nutrient'][n]['accuracy']:.3f} |" for n in best_g["per_nutrient"])
    gap_rows = "\n".join(f"| {n} | {gr[n].get('cv_mean_macro_f1', '–')} | {gr[n]['test']['mean_macro_f1']:.3f} | {gr[n].get('test_share_mae', '–')} |" for n in names)
    rec_rows = "\n".join(f"| {n} | {rr[n].get('auc', '–')} | {rr[n].get('log_loss', '–')} | {rr[n]['hit_at_1']:.3f} |" for n in rr)
    card = f"""# Model card: NutriSense AI

*IDP P020 · AI Nutrition Detection and Diet Suggestion using Deep Learning · Mentor: Dr. Vivek Sharma*
*Team: Garveet Singh, Vishwas Ahuja, Chandan Kumar, Reedima (CSE) · Prerna Singh, Mehak Kamboj (Law) · Kushagra Sharma (Management)*
*Generated by `nutrisense_ml/report.py` on {datetime.now():%Y-%m-%d %H:%M}. Every number below comes from that run.*

> **Data provenance.** All training data is **synthetic**, produced by `simulate.py` from the app's food knowledge base
> (IFCT 2017 / USDA values) and ICMR-NIN 2020 RDAs. No real users exist yet. These results show the pipeline works
> end to end and how models compare under controlled conditions; they are **not** evidence of real-world accuracy.

## 1. Nutrient-gap model
**Task.** From a person's profile and their first {cfg['gap_model']['history_days']} days of logs, predict whether iron, B12, calcium,
protein and fiber will be *adequate* (≥80% of RDA), *need attention* (50–79%) or be a *higher priority* (<50%) over the next {cfg['gap_model']['horizon_days']} days.
**Data.** {gap['n_train_rows']} train / {gap['n_test_rows']} test windows, split by user (no person in both sets). {len(gap['features'])} features.
**Selected:** `{gap['selected_model']}` (best grouped 3-fold CV macro-F1).

| model | CV macro-F1 | test macro-F1 | next-week intake MAE |
|---|---|---|---|
{gap_rows}

| nutrient | macro-F1 (selected) | macro-F1 (rule baseline) | accuracy (selected) |
|---|---|---|---|
{per}

**Reading the result honestly.** The selected model forecasts next week's intake more precisely than simply trusting the 3-day average
(MAE {gr[gap['selected_model']].get('test_share_mae', 0):.3f} vs {gr['rule_baseline']['test_share_mae']:.3f}), but after thresholding into three classes it is roughly level with the
rule baseline (macro-F1 {best_g['mean_macro_f1']:.3f} vs {base_g['mean_macro_f1']:.3f}). Flexible models (gradient boosting, MLP) did not help on this dataset size,
which matches the project's stated decision: model complexity is not a guarantee of accuracy.
**Vitamin D** is excluded: {gap['vitD_note']}.

## 2. Meal-suggestion acceptance model
**Task.** Predict whether a user accepts a suggested meal, to re-rank gap-closing suggestions.
**Data.** {rec['n_train']:,} train / {rec['n_test']:,} test impressions; features from days 0–6, labels from days 7–13; split by user.
**Selected:** `{rec['selected_model']}` (best test ROC-AUC).

| model | ROC-AUC | log-loss | hit@1 (top pick accepted) |
|---|---|---|---|
{rec_rows}

The selected model raises the chance that the first suggestion is accepted from {rr['random_pick']['hit_at_1']:.1%} (random) and
{rr['popularity_baseline']['hit_at_1']:.1%} (most popular meals) to **{best_r['hit_at_1']:.1%}**. Strongest signals: {', '.join(list(rec['feature_importance'])[:4])}.

## 3. Food image recognition
Not trained yet. `vision/train_food_classifier.py` holds the transfer-learning setup (MobileNetV3, ImageNet weights) for the
{len(json.loads((MODELS.parent / 'data' / 'knowledge_base' / 'scan_classes.json').read_text()))} plate classes the app recognises. It needs a labelled Indian food photo dataset (see `vision/README.md`).
The app's scanner currently uses curated results, as disclosed on its *How the AI works* screen.

## 4. Intended use and limits
- General nutrition guidance for healthy adults; **not** a medical device and not for diagnosis.
- Not validated for pregnancy, children, athletes or clinical conditions.
- Synthetic data cannot capture real behaviour: retrain and re-evaluate on consented real logs before any claim of accuracy.
- Fairness check needed on real data across sex, diet and region before deployment.
"""
    (MODELS / "MODEL_CARD.md").write_text(card, encoding="utf-8")
    log.info("figures -> reports/figures (%d files) | model card -> models/MODEL_CARD.md", len(list(FIGURES.glob("*.png"))))


if __name__ == "__main__":
    run()
