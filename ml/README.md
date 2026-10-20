# NutriSense AI: machine-learning pipeline

**IDP P020 · AI Nutrition Detection and Diet Suggestion using Deep Learning**
Mentor: Dr. Vivek Sharma
Team: Garveet Singh, Vishwas Ahuja, Chandan Kumar, Reedima (CSE) · Prerna Singh, Mehak Kamboj (Law) · Kushagra Sharma (Management)

This folder holds the data and modelling work behind the app: cleaning food logs, estimating requirements, predicting nutrient gaps and ranking meal suggestions. Everything here runs, and every number in `reports/` and `models/MODEL_CARD.md` is produced by the code.

> **Honest scope.** No real users exist yet, so the training data is a **synthetic cohort** built from the app's food knowledge base and ICMR-NIN 2020 RDAs. The results show that the pipeline works and how methods compare. They are not evidence of real-world accuracy. The food-photo classifier is written but **not trained** (it needs a labelled image dataset; see `vision/README.md`).

## Pipeline
```
data/knowledge_base   116 foods × 14 nutrients, 93 meals (exported from the app)
        │  simulate.py   1,200 synthetic users × 14 days, with realistic logging noise
        ▼
data/raw              user_profiles · food_logs (121k rows) · suggestion_feedback (174k)
        │  clean.py      fuzzy-fix food names, drop unknown foods, de-duplicate, impute portions
        ▼
data/processed        food_logs_clean · gap_dataset · recommender_dataset
        │  features.py   profile + 3-day eating pattern → next-week labels; user×meal features
        ▼
   train_gap.py           rule baseline vs logistic regression, random forest, gradient boosting,
                          neural network (MLP) and share-regression variants
   train_recommender.py   popularity baseline vs logistic regression, gradient boosting, MLP
        │  report.py
        ▼
models/   gap_model.joblib · recommender_model.joblib · gap_model_export.json · MODEL_CARD.md
reports/  data_quality.json · *_metrics.json · training_log.txt · figures/*.png
```

## Run it
```bash
cd ml
python -m venv .venv && .venv\Scripts\activate      # or: uv venv .venv
pip install -r requirements.txt
node scripts/export_knowledge_base.mjs               # from the project root, refreshes data/knowledge_base
python -m nutrisense_ml.pipeline                     # all stages, about 5 minutes on a laptop
python -m nutrisense_ml.predict --user U00042        # inference demo for one person
```
Settings (seed, cohort size, noise rates, thresholds) live in `config.yaml`. Same seed, same results.

## Results (latest run)
**Data cleaning:** 121,217 raw rows → 116,545 clean. 1,809 misspelt food names repaired, 3,496 duplicate taps removed, 1,176 unknown foods dropped, 3,041 missing or impossible portions imputed.

**Nutrient-gap model** (iron, B12, calcium, protein, fiber; test = 240 unseen users)
| model | test macro-F1 | next-week intake error (MAE) |
|---|---|---|
| rule baseline (3-day average) | 0.614 | 0.131 |
| **ridge share-regression (selected)** | 0.610 | **0.103** |
| random forest | 0.603 | – |
| neural network (MLP) | 0.578 | – |

The selected model forecasts next week's intake **21% more precisely** than the 3-day average, but after sorting into three classes it ties the rule. Bigger models did not help at this data size. This is the review's point: *model complexity is not a guarantee of accuracy*. Vitamin D is left to a rule because 98% of the cohort falls short (food alone rarely reaches 15 µg).

**Meal-suggestion acceptance** (test = 17,316 impressions from unseen users)
| model | ROC-AUC | top suggestion accepted |
|---|---|---|
| random pick | – | 44.5% |
| popularity baseline | 0.556 | 47.4% |
| **gradient boosting (selected)** | **0.647** | **55.6%** |

Strongest signals: how often the person already eats that meal, calories × weight-loss goal, the suggestion's position, and preparation time.

Full tables, confusion matrices and limits are in `models/MODEL_CARD.md`. Charts are in `reports/figures/`.

## Folder map
| path | what it is |
|---|---|
| `nutrisense_ml/common.py` | paths, config, logging, Mifflin-St Jeor + ICMR RDA maths (mirrors the app) |
| `nutrisense_ml/simulate.py` | synthetic cohort and noise injection |
| `nutrisense_ml/clean.py` | data cleaning with a quality report |
| `nutrisense_ml/features.py` | feature engineering for both models |
| `nutrisense_ml/train_gap.py`, `estimators.py` | gap model training and model selection |
| `nutrisense_ml/train_recommender.py` | acceptance model training |
| `nutrisense_ml/report.py` | figures, model card, JSON export for the app |
| `nutrisense_ml/predict.py` | inference demo |
| `vision/` | food-photo classifier (MobileNetV3 transfer learning), not trained yet |

## Next steps
1. Collect consented real logs from a pilot group; re-run the pipeline on them.
2. Build or borrow a labelled Indian-food photo set and train `vision/`.
3. Load `models/gap_model_export.json` in the app to replace the rule-based gap status.
