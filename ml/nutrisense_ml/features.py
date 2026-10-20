"""
NutriSense AI · IDP P020: Stage 3: feature engineering.

Gap dataset (one row per user-window)
  inputs : profile (age, sex, BMI, activity, diet, goal) + the first `history_days`
           of logging: each nutrient as a share of the person's RDA, plus eating-pattern
           counts (lentils, dairy, leafy/iron foods, fruit, eggs, meat, junk, fortified).
  labels : status of iron, vitamin D, B12, calcium, protein and fiber over the NEXT
           `horizon_days` (0 adequate · 1 needs attention · 2 higher priority).

Recommender dataset (one row per suggestion shown on days 7-13)
  inputs : user habits learned from days 0-6, meal nutrition and type, how often the
           user already eats that meal, taste similarity to their usual plate, position.
  label  : accepted (1) or skipped (0).
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .common import ACTIVITY, NUTRIENT_KEYS, PROCESSED, RAW, get_logger, load_config, load_kb, status_of, targets

log = get_logger("features")

PATTERNS = {
    "lentil": lambda f: "lentil" in f["tags"] or f["id"] in {"rajma", "chole", "sambar", "sprouts", "roasted_chana", "moong_chilla", "besan_chilla", "khichdi"},
    "dairy": lambda f: "dairy" in f["allergens"],
    "iron_food": lambda f: "iron" in f["tags"],
    "fruit": lambda f: f["category"] == "fruit",
    "egg": lambda f: f["diet"] == "egg",
    "meat_fish": lambda f: f["diet"] == "nonveg",
    "junk": lambda f: f["category"] in ("junk", "dessert"),
    "fortified": lambda f: "fortified" in f["tags"],
}


def _profile_frame(profiles: pd.DataFrame) -> pd.DataFrame:
    p = profiles.copy()
    p["bmi"] = p["weight_kg"] / (p["height_cm"] / 100) ** 2
    p["male"] = (p["sex"] == "male").astype(int)
    p["activity_factor"] = p["activity"].map(ACTIVITY)
    for d in ["veg", "egg", "nonveg", "vegan"]:
        p[f"diet_{d}"] = (p["diet"] == d).astype(int)
    for g in ["lose", "maintain", "gain"]:
        p[f"goal_{g}"] = (p["goal"] == g).astype(int)
    return p


def build_gap(logs: pd.DataFrame, profiles: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    foods, _ = load_kb()
    g = cfg["gap_model"]
    H, F = g["history_days"], g["horizon_days"]
    days = cfg["simulation"]["days_per_user"]
    for name, fn in PATTERNS.items():
        flag = {fid: int(fn(f)) for fid, f in foods.items()}
        logs[f"is_{name}"] = logs["food_id"].map(flag)
    daily = logs.groupby(["user_id", "day"])[NUTRIENT_KEYS + [f"is_{n}" for n in PATTERNS]].sum()
    meals_per_day = logs.groupby(["user_id", "day"])["meal_id"].nunique().rename("meals")
    daily = daily.join(meals_per_day).reset_index()
    prof = _profile_frame(profiles).set_index("user_id")
    tgt = {u: targets(r.age, r.sex, r.height_cm, r.weight_kg, r.activity, r.goal) for u, r in profiles.set_index("user_id").iterrows()}

    rows = []
    starts = [s for s in range(0, days - H - F + 1, 4)]
    for uid, ud in daily.groupby("user_id"):
        ud = ud.set_index("day").reindex(range(days), fill_value=0)
        t = tgt[uid]
        pr = prof.loc[uid]
        for s in starts:
            hist = ud.loc[s : s + H - 1]
            fut = ud.loc[s + H : s + H + F - 1]
            row = {"user_id": uid, "window_start": s}
            for c in ["age", "male", "bmi", "activity_factor", "diet_veg", "diet_egg", "diet_nonveg", "diet_vegan", "goal_lose", "goal_maintain", "goal_gain"]:
                row[c] = pr[c]
            for k in NUTRIENT_KEYS:
                row[f"h_{k}_share"] = hist[k].mean() / t[k]
            for n in PATTERNS:
                row[f"h_{n}_per_day"] = hist[f"is_{n}"].mean()
            row["h_meals_per_day"] = hist["meals"].mean()
            row["h_junk_kcal_share"] = 0.0  # filled below
            for k in g["nutrients"]:
                row[f"y_{k}"] = status_of(fut[k].mean() / t[k], g["thresholds"])
                row[f"y_{k}_share"] = fut[k].mean() / t[k]
            rows.append(row)
    df = pd.DataFrame(rows)
    junk_kcal = logs[logs["is_junk"] == 1].groupby(["user_id", "day"])["kcal"].sum()
    all_kcal = logs.groupby(["user_id", "day"])["kcal"].sum()
    share = (junk_kcal / all_kcal).fillna(0).rename("j").reset_index()
    for i, r in df.iterrows():
        m = share[(share.user_id == r.user_id) & share.day.between(r.window_start, r.window_start + H - 1)]["j"]
        df.at[i, "h_junk_kcal_share"] = float(m.mean()) if len(m) else 0.0
    return df


def build_recommender(logs: pd.DataFrame, profiles: pd.DataFrame, feedback: pd.DataFrame) -> pd.DataFrame:
    foods, meals = load_kb()
    hist = logs[logs["day"] < 7]
    fb = feedback[feedback["day"] >= 7].copy()

    def meal_vec(mid):
        v = np.zeros(len(NUTRIENT_KEYS))
        for it in meals[mid]["items"]:
            v += np.array([foods[it["foodId"]]["n"][k] for k in NUTRIENT_KEYS]) * it["servings"]
        return v

    mids = list(meals)
    M = np.stack([meal_vec(m) for m in mids])
    scale = M.std(axis=0) + 1e-9
    unit = {m: (M[i] / scale) / (np.linalg.norm(M[i] / scale) + 1e-9) for i, m in enumerate(mids)}

    eaten = hist.groupby(["user_id", "meal_id"])["day"].nunique().rename("times_eaten")
    centroid = {}
    for uid, ud in hist.groupby("user_id"):
        ms = ud.drop_duplicates(["day", "meal_id"])["meal_id"]
        centroid[uid] = np.mean([unit[m] for m in ms], axis=0)
    user_kcal = hist.groupby(["user_id", "day"])["kcal"].sum().groupby("user_id").mean().rename("u_avg_kcal")
    user_junk = hist.assign(j=hist["category"].isin(["junk", "dessert"]) * hist["kcal"]).groupby("user_id").apply(lambda d: d["j"].sum() / d["kcal"].sum(), include_groups=False).rename("u_junk_share")

    prof = _profile_frame(profiles).set_index("user_id")
    fb = fb.join(eaten, on=["user_id", "meal_id"]).fillna({"times_eaten": 0})
    fb = fb.join(user_kcal, on="user_id").join(user_junk, on="user_id")
    fb["taste_similarity"] = [float(unit[m] @ centroid[u]) if u in centroid else 0.0 for u, m in zip(fb["user_id"], fb["meal_id"])]
    mv = {m: meal_vec(m) for m in mids}
    fb["m_kcal"] = fb["meal_id"].map(lambda m: mv[m][0])
    fb["m_protein"] = fb["meal_id"].map(lambda m: mv[m][1])
    fb["m_fiber"] = fb["meal_id"].map(lambda m: mv[m][4])
    fb["m_prep_min"] = fb["meal_id"].map(lambda m: meals[m]["prepMin"])
    for t in ["breakfast", "main", "snack"]:
        fb[f"m_type_{t}"] = fb["meal_id"].map(lambda m, t=t: int(meals[m]["type"] == t))
    for c in ["goal_lose", "goal_maintain", "goal_gain", "diet_veg", "diet_nonveg", "male", "age", "bmi"]:
        fb[c] = fb["user_id"].map(prof[c])
    fb["kcal_x_lose"] = fb["m_kcal"] * fb["goal_lose"]
    fb["protein_x_gain"] = fb["m_protein"] * fb["goal_gain"]
    return fb


def run() -> None:
    cfg = load_config()
    logs = pd.read_csv(PROCESSED / "food_logs_clean.csv")
    profiles = pd.read_csv(RAW / "user_profiles.csv")
    feedback = pd.read_csv(RAW / "suggestion_feedback.csv")
    gap = build_gap(logs, profiles, cfg)
    gap.to_csv(PROCESSED / "gap_dataset.csv", index=False)
    rec = build_recommender(logs, profiles, feedback)
    rec.to_csv(PROCESSED / "recommender_dataset.csv", index=False)
    dist = {k: gap[f"y_{k}"].value_counts(normalize=True).round(3).to_dict() for k in cfg["gap_model"]["nutrients"]}
    log.info("gap dataset %s | recommender dataset %s (accept rate %.3f)", gap.shape, rec.shape, rec["accepted"].mean())
    log.info("label balance (0 adequate / 1 attention / 2 priority): %s", dist)


if __name__ == "__main__":
    run()
