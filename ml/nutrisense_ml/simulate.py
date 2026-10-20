"""
NutriSense AI · IDP P020: Stage 1: synthetic cohort simulator.

No real user data exists yet, so this stage generates a SYNTHETIC cohort that
behaves like app users: each person has a profile, a set of habitual Indian
meals, a junk-food tendency and portion habits. It writes:

  data/raw/user_profiles.csv        one row per user
  data/raw/food_logs.csv            one row per logged food item (14 days)
  data/raw/suggestion_feedback.csv  meal suggestions shown and whether they were accepted

Real-world logging noise is injected on purpose (duplicate taps, typos in food
names, missing or absurd portions, foods not in the database) so that the
cleaning stage has real work to do. Every file is labelled synthetic.
"""

from __future__ import annotations

import json
from datetime import date, timedelta

import numpy as np
import pandas as pd

from .common import RAW, NUTRIENT_KEYS, fits_diet, get_logger, load_config, load_kb, seed_everything

log = get_logger("simulate")

UNKNOWN_FOODS = ["Ghar ka khana", "Mom's special sabzi", "Canteen thali", "Hostel mess curry", "Leftover pulao", "Roadside chaat"]
TYPE_OF_SLOT = {"breakfast": "breakfast", "lunch": "main", "snack": "snack", "dinner": "main"}


def _typo(name: str, rng: np.random.Generator) -> str:
    s = list(name)
    kind = rng.integers(0, 5)
    if kind == 0 and len(s) > 4:  # swap two letters
        i = rng.integers(1, len(s) - 2)
        s[i], s[i + 1] = s[i + 1], s[i]
        return "".join(s)
    if kind == 1 and len(s) > 4:  # drop a letter
        i = rng.integers(1, len(s) - 1)
        return "".join(s[:i] + s[i + 1 :])
    if kind == 2:
        return name.upper()
    if kind == 3:
        return f"  {name.lower()} "
    return name.replace(" ", "  ")


def _meal_vector(meal: dict, foods: dict) -> np.ndarray:
    v = np.zeros(len(NUTRIENT_KEYS))
    for it in meal["items"]:
        v += np.array([foods[it["foodId"]]["n"][k] for k in NUTRIENT_KEYS]) * it["servings"]
    return v


def run() -> None:
    cfg = load_config()
    sim = cfg["simulation"]
    rng = seed_everything(cfg["seed"])
    foods, meals = load_kb()
    RAW.mkdir(parents=True, exist_ok=True)

    # nutrient profile of each meal, scaled per feature, for taste similarity
    meal_ids = list(meals)
    mat = np.stack([_meal_vector(meals[m], foods) for m in meal_ids])
    mat = mat / (mat.std(axis=0) + 1e-9)
    mvec = {m: mat[i] / (np.linalg.norm(mat[i]) + 1e-9) for i, m in enumerate(meal_ids)}

    profiles, logs, feedback, latent = [], [], [], {}
    start = date(2026, 9, 1)
    log_id = 0
    for u in range(sim["n_users"]):
        uid = f"U{u:05d}"
        sex = rng.choice(["female", "male"])
        age = int(np.clip(rng.normal(22, 4.5), 17, 45))
        height = float(np.round(rng.normal(171 if sex == "male" else 158, 7), 1))
        bmi = float(np.clip(rng.normal(22.5, 3.6), 16.5, 36))
        weight = float(np.round(bmi * (height / 100) ** 2, 1))
        activity = rng.choice(["sedentary", "light", "moderate", "active"], p=[0.3, 0.4, 0.22, 0.08])
        diet = rng.choice(["veg", "egg", "nonveg", "vegan"], p=[0.45, 0.2, 0.3, 0.05])
        goal = rng.choice(["lose", "maintain", "gain"], p=[0.35, 0.45, 0.2])
        profiles.append(dict(user_id=uid, age=age, sex=sex, height_cm=height, weight_kg=weight, activity=activity, diet=diet, goal=goal))

        compatible = {t: [m for m in meal_ids if meals[m]["type"] == t and fits_diet(meals[m]["diet"], diet)] for t in ["breakfast", "main", "snack", "junk"]}
        habits = {}
        for t, k in [("breakfast", 4), ("main", 6), ("snack", 3)]:
            pool = compatible[t]
            chosen = list(rng.choice(pool, size=min(k, len(pool)), replace=False))
            habits[t] = (chosen, rng.dirichlet(np.ones(len(chosen)) * 1.5))
        p_junk = float(rng.beta(2, 6))
        skip_breakfast = float(rng.beta(2, 8))
        portion = float(np.clip(rng.normal(1.0, 0.12), 0.7, 1.4))
        habit_ids = [m for t in habits for m in habits[t][0]]
        centroid = np.mean([mvec[m] for m in habit_ids], axis=0)
        latent[uid] = dict(p_junk=p_junk, portion=portion, habits=habit_ids)

        for d in range(sim["days_per_user"]):
            day = start + timedelta(days=d)
            for slot, hour in [("breakfast", 8), ("lunch", 13), ("snack", 17), ("dinner", 20)]:
                if slot == "breakfast" and rng.random() < skip_breakfast:
                    continue
                if slot == "snack" and rng.random() < 0.35:
                    continue
                t = TYPE_OF_SLOT[slot]
                if slot in ("snack", "dinner") and rng.random() < p_junk and compatible["junk"]:
                    meal_id = rng.choice(compatible["junk"])
                elif rng.random() < sim["explore_rate"]:
                    meal_id = rng.choice(compatible[t])
                else:
                    ids, w = habits[t]
                    meal_id = rng.choice(ids, p=w)
                source = rng.choice(["scan", "manual", "barcode"], p=[0.55, 0.4, 0.05])
                mult = portion * float(np.clip(rng.normal(1, 0.15), 0.5, 1.6))
                ts = f"{day.isoformat()} {hour:02d}:{int(rng.integers(0, 60)):02d}"
                for it in meals[meal_id]["items"]:
                    f = foods[it["foodId"]]
                    logs.append(dict(log_id=log_id, user_id=uid, day=d, date=day.isoformat(), logged_at=ts, slot=slot, meal_id=meal_id,
                                     food_name=f["name"], servings=round(it["servings"] * mult * 4) / 4 or 0.25, source=source,
                                     scan_confidence=round(float(np.clip(rng.normal(0.9, 0.05), 0.55, 0.99)), 3) if source == "scan" else np.nan))
                    log_id += 1

                # three suggestions shown for this slot, and the user's reaction
                shown = rng.choice(compatible[t], size=min(cfg["recommender"]["suggestions_per_day"], len(compatible[t])), replace=False)
                for pos, sm in enumerate(shown):
                    mv = _meal_vector(meals[sm], foods)
                    goal_fit = (1 if mv[0] < 450 else -0.5) if goal == "lose" else (1 if mv[1] > 22 else -0.3) if goal == "gain" else 0.3
                    util = (1.6 * (sm in habit_ids) + 1.4 * float(mvec[sm] @ centroid) + 0.7 * goal_fit
                            - 0.015 * meals[sm]["prepMin"] - 0.35 * pos + rng.normal(0, 0.8) - 1.3)
                    feedback.append(dict(impression_id=len(feedback), user_id=uid, day=d, slot=slot, meal_id=sm, position=pos,
                                         accepted=int(rng.random() < 1 / (1 + np.exp(-util)))))

    df = pd.DataFrame(logs)
    n = len(df)
    noise = sim["noise"]
    # typos and casing in food names
    idx = rng.choice(n, int(n * noise["typo_rate"]), replace=False)
    df.loc[idx, "food_name"] = [_typo(x, rng) for x in df.loc[idx, "food_name"]]
    # missing and absurd portions
    df.loc[rng.choice(n, int(n * noise["missing_servings_rate"]), replace=False), "servings"] = np.nan
    out = rng.choice(n, int(n * noise["outlier_rate"]), replace=False)
    df.loc[out, "servings"] = df.loc[out, "servings"].map(lambda s: -1.0 if rng.random() < 0.3 else (s or 1) * 12)
    # foods that are not in the knowledge base
    unk = df.sample(int(n * noise["unknown_food_rate"]), random_state=cfg["seed"]).copy()
    unk["food_name"] = rng.choice(UNKNOWN_FOODS, len(unk))
    unk["log_id"] = np.arange(n, n + len(unk))
    # double-tap duplicates
    dup = df.sample(int(n * noise["duplicate_rate"]), random_state=cfg["seed"] + 1)
    df = pd.concat([df, unk, dup], ignore_index=True).sample(frac=1, random_state=cfg["seed"]).reset_index(drop=True)

    pd.DataFrame(profiles).to_csv(RAW / "user_profiles.csv", index=False)
    df.to_csv(RAW / "food_logs.csv", index=False)
    pd.DataFrame(feedback).to_csv(RAW / "suggestion_feedback.csv", index=False)
    (RAW / "_simulator_latent.json").write_text(json.dumps(latent), encoding="utf-8")
    (RAW / "README.md").write_text(
        "# Raw data (SYNTHETIC)\n\nGenerated by `nutrisense_ml/simulate.py` (seed in config.yaml). "
        "These are simulated users, not real people. Noise is injected on purpose for the cleaning stage. "
        "`_simulator_latent.json` holds the simulator's hidden parameters and is never used for training.\n",
        encoding="utf-8",
    )
    log.info("users=%d  food_log_rows=%d (incl. %d unknown, %d duplicate)  suggestions=%d", len(profiles), len(df), len(unk), len(dup), len(feedback))


if __name__ == "__main__":
    run()
