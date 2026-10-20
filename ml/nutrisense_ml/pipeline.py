"""
NutriSense AI · IDP P020: end-to-end pipeline runner.

    python -m nutrisense_ml.pipeline            # all stages
    python -m nutrisense_ml.pipeline --from train_gap

Stages: simulate → clean → features → train_gap → train_recommender → report
"""

from __future__ import annotations

import argparse
import time

from . import clean, features, report, simulate, train_gap, train_recommender
from .common import get_logger, load_config, seed_everything

STAGES = [("simulate", simulate.run), ("clean", clean.run), ("features", features.run), ("train_gap", train_gap.run), ("train_recommender", train_recommender.run), ("report", report.run)]


def main() -> None:
    ap = argparse.ArgumentParser(description="NutriSense AI ML pipeline")
    ap.add_argument("--from", dest="start", default="simulate", choices=[s for s, _ in STAGES])
    args = ap.parse_args()
    log = get_logger("pipeline")
    cfg = load_config()
    seed_everything(cfg["seed"])
    log.info("=" * 70)
    log.info("NutriSense AI pipeline · seed %d · starting at '%s'", cfg["seed"], args.start)
    t_all = time.time()
    run = False
    for name, fn in STAGES:
        run = run or name == args.start
        if not run:
            continue
        t0 = time.time()
        log.info("--- %s ---", name)
        fn()
        log.info("--- %s done in %.1fs ---", name, time.time() - t0)
    log.info("pipeline finished in %.1fs", time.time() - t_all)


if __name__ == "__main__":
    main()
