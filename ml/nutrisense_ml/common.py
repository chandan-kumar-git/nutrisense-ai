"""
NutriSense AI · IDP P020: shared paths, config, logging and nutrition maths.

The requirement formulas mirror the app (src/engine/nutrition.js):
Mifflin-St Jeor BMR × activity factor ± goal, and ICMR-NIN 2020 RDAs.
"""

from __future__ import annotations

import json
import logging
import random
from pathlib import Path

import numpy as np
import yaml

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
KB = DATA / "knowledge_base"
RAW = DATA / "raw"
PROCESSED = DATA / "processed"
MODELS = ROOT / "models"
REPORTS = ROOT / "reports"
FIGURES = REPORTS / "figures"

NUTRIENT_KEYS = ["kcal", "protein", "carbs", "fat", "fiber", "iron", "calcium", "vitD", "b12", "vitC", "folate", "zinc", "magnesium", "omega3"]
ACTIVITY = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}
GOAL_DELTA = {"lose": -450, "maintain": 0, "gain": 300}
PROTEIN_PER_KG = {"lose": 1.2, "maintain": 1.0, "gain": 1.6}
DIET_ALLOWS = {"vegan": {"vegan"}, "veg": {"vegan", "veg"}, "egg": {"vegan", "veg", "egg"}, "nonveg": {"vegan", "veg", "egg", "nonveg"}}


def load_config() -> dict:
    with open(ROOT / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def seed_everything(seed: int) -> np.random.Generator:
    random.seed(seed)
    np.random.seed(seed)
    return np.random.default_rng(seed)


def get_logger(name: str) -> logging.Logger:
    REPORTS.mkdir(parents=True, exist_ok=True)
    log = logging.getLogger(name)
    if not log.handlers:
        fmt = logging.Formatter("%(asctime)s | %(name)-11s | %(levelname)s | %(message)s", "%Y-%m-%d %H:%M:%S")
        for h in (logging.StreamHandler(), logging.FileHandler(REPORTS / "training_log.txt", encoding="utf-8")):
            h.setFormatter(fmt)
            log.addHandler(h)
        log.setLevel(logging.INFO)
    return log


def load_kb():
    foods = json.loads((KB / "foods.json").read_text(encoding="utf-8"))
    meals = json.loads((KB / "meals.json").read_text(encoding="utf-8"))
    return {f["id"]: f for f in foods}, {m["id"]: m for m in meals}


def fits_diet(item_diet: str, user_diet: str) -> bool:
    return item_diet in DIET_ALLOWS[user_diet]


def targets(age: float, sex: str, height: float, weight: float, activity: str, goal: str) -> dict:
    """Daily requirements for one person (same rules as the app)."""
    male = sex == "male"
    bmr = 10 * weight + 6.25 * height - 5 * age + (5 if male else -161)
    tdee = bmr * ACTIVITY[activity]
    kcal = round(max(1500 if male else 1200, tdee + GOAL_DELTA[goal]) / 10) * 10
    protein = round(weight * PROTEIN_PER_KG[goal])
    fat = round(kcal * 0.27 / 9)
    older = age > 50
    return {
        "kcal": kcal, "protein": protein, "fat": fat,
        "carbs": max(50, round((kcal - protein * 4 - fat * 9) / 4)),
        "fiber": round(kcal / 1000 * 14),
        "iron": 19 if (male or older) else 29,
        "calcium": 1200 if older else 1000,
        "vitD": 20 if age > 70 else 15,
        "b12": 2.5, "vitC": 80 if male else 65, "folate": 300,
        "zinc": 17 if male else 13, "magnesium": 440 if male else 370,
        "omega3": 1.6 if male else 1.1,
    }


def status_of(share: float, thresholds: dict) -> int:
    """0 = adequate, 1 = needs attention, 2 = higher priority."""
    if share >= thresholds["adequate"]:
        return 0
    if share >= thresholds["attention"]:
        return 1
    return 2


STATUS_NAMES = ["adequate", "attention", "priority"]
