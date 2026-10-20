"""
NutriSense AI · IDP P020: Stage 2: data cleaning.

Turns the raw food logs into a trustworthy table:
  1. normalise food names (case, spacing)
  2. resolve each name to a knowledge-base food (exact, then fuzzy match)
  3. drop foods that cannot be resolved
  4. remove double-tap duplicates
  5. impute missing portions (user median for that food → global median → 1)
  6. repair impossible portions (≤ 0 or > 6 servings)
  7. attach nutrient values per row (IFCT 2017 / USDA reference values)

Writes data/processed/food_logs_clean.csv and reports/data_quality.json.
"""

from __future__ import annotations

import difflib
import json

import numpy as np
import pandas as pd

from .common import NUTRIENT_KEYS, PROCESSED, RAW, REPORTS, get_logger, load_kb

log = get_logger("clean")


def _norm(s: str) -> str:
    return " ".join(str(s).strip().lower().split())


def run() -> None:
    foods, _ = load_kb()
    PROCESSED.mkdir(parents=True, exist_ok=True)
    raw = pd.read_csv(RAW / "food_logs.csv")
    q = {"rows_in": len(raw)}

    by_name = {_norm(f["name"]): fid for fid, f in foods.items()}
    names = list(by_name)
    cache: dict[str, str | None] = {}

    def resolve(name: str):
        n = _norm(name)
        if n in cache:
            return cache[n]
        hit = by_name.get(n)
        if hit is None:
            # short names need a looser cutoff: one swapped letter in "chole" is already 20% of it
            close = difflib.get_close_matches(n, names, n=1, cutoff=0.85 if len(n) > 8 else 0.72)
            hit = by_name[close[0]] if close else None
        cache[n] = hit
        return hit

    df = raw.copy()
    exact = df["food_name"].map(_norm).isin(by_name)
    df["food_id"] = df["food_name"].map(resolve)
    q["names_fixed_by_fuzzy_match"] = int((~exact & df["food_id"].notna()).sum())
    q["unresolved_dropped"] = int(df["food_id"].isna().sum())
    q["unresolved_examples"] = sorted(df.loc[df["food_id"].isna(), "food_name"].map(_norm).unique().tolist())[:10]
    df = df[df["food_id"].notna()]

    before = len(df)
    df = df.drop_duplicates(subset=["user_id", "logged_at", "slot", "food_id", "servings"])
    q["duplicates_removed"] = before - len(df)

    q["missing_servings"] = int(df["servings"].isna().sum())
    bad = (df["servings"] <= 0) | (df["servings"] > 6)
    q["impossible_servings"] = int(bad.sum())
    df.loc[bad, "servings"] = np.nan
    user_med = df.groupby(["user_id", "food_id"])["servings"].transform("median")
    food_med = df.groupby("food_id")["servings"].transform("median")
    df["servings"] = df["servings"].fillna(user_med).fillna(food_med).fillna(1.0).round(2)
    df["servings_imputed"] = df["log_id"].isin(raw.loc[raw["servings"].isna() | (raw["servings"] <= 0) | (raw["servings"] > 6), "log_id"])

    for k in NUTRIENT_KEYS:
        df[k] = df["food_id"].map(lambda f: foods[f]["n"][k]) * df["servings"]
    df["category"] = df["food_id"].map(lambda f: foods[f]["category"])
    df["food_diet"] = df["food_id"].map(lambda f: foods[f]["diet"])
    df = df.drop(columns=["food_name"]).sort_values(["user_id", "day", "logged_at"]).reset_index(drop=True)

    q["rows_out"] = len(df)
    q["rows_removed_total"] = q["rows_in"] - q["rows_out"]
    q["users"] = int(df["user_id"].nunique())
    q["scan_confidence_mean"] = round(float(df["scan_confidence"].mean()), 3)
    df.to_csv(PROCESSED / "food_logs_clean.csv", index=False)
    (REPORTS / "data_quality.json").write_text(json.dumps(q, indent=2), encoding="utf-8")
    log.info(
        "rows %d -> %d | fuzzy-fixed %d | unresolved %d | duplicates %d | missing portions %d | impossible portions %d",
        q["rows_in"], q["rows_out"], q["names_fixed_by_fuzzy_match"], q["unresolved_dropped"], q["duplicates_removed"], q["missing_servings"], q["impossible_servings"],
    )


if __name__ == "__main__":
    run()
