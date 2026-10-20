"""
NutriSense AI · IDP P020: inference demo with the trained models.

    python -m nutrisense_ml.predict                 # a random test user
    python -m nutrisense_ml.predict --user U00042

Loads models/gap_model.joblib and models/recommender_model.joblib, predicts next
week's nutrient status for one person from their first 3 days, then ranks the
meals the app could suggest by how likely they are to accept them.
"""

from __future__ import annotations

import argparse

import joblib
import numpy as np
import pandas as pd

from .common import MODELS, PROCESSED, STATUS_NAMES, load_kb


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--user", default=None)
    args = ap.parse_args()
    gap = joblib.load(MODELS / "gap_model.joblib")
    rec = joblib.load(MODELS / "recommender_model.joblib")
    _, meals = load_kb()

    gd = pd.read_csv(PROCESSED / "gap_dataset.csv")
    uid = args.user or gd["user_id"].sample(1, random_state=7).iloc[0]
    row = gd[(gd.user_id == uid) & (gd.window_start == 0)]
    if row.empty:
        raise SystemExit(f"unknown user {uid}")
    X = row[gap["features"]].to_numpy()
    shares = gap["model"].predict_share(X)[0] if hasattr(gap["model"], "predict_share") else None
    status = gap["model"].predict(X)[0]
    print(f"\nUser {uid} - next 7 days (model: {type(gap['model']).__name__})")
    for i, n in enumerate(gap["nutrients"]):
        seen = row[f"h_{n}_share"].iloc[0]
        pred = f"{shares[i]:.0%}" if shares is not None else "–"
        actual = row[f"y_{n}_share"].iloc[0]
        print(f"  {n:8s} first 3 days {seen:5.0%} -> forecast {pred:>5} ({STATUS_NAMES[status[i]]:9s}) | actual {actual:5.0%}")

    rd = pd.read_csv(PROCESSED / "recommender_dataset.csv")
    cand = rd[rd.user_id == uid].drop_duplicates("meal_id")
    p = rec["model"].predict_proba(cand[rec["features"]].to_numpy(float))[:, 1]
    top = cand.assign(p=p).sort_values("p", ascending=False).head(5)
    print("\n  Meals most likely to be accepted:")
    for _, r in top.iterrows():
        print(f"    {meals[r.meal_id]['name']:34s} P(accept) {r.p:.2f}  (eaten {int(r.times_eaten)}x in week 1)")
    print()


if __name__ == "__main__":
    np.set_printoptions(precision=3)
    main()
