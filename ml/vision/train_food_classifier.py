"""
NutriSense AI · IDP P020: food image classifier (transfer learning).

Project : AI Nutrition Detection and Diet Suggestion using Deep Learning
Mentor  : Dr. Vivek Sharma
Team    : Garveet Singh, Vishwas Ahuja, Chandan Kumar, Reedima (CSE)
          Prerna Singh, Mehak Kamboj (Law) · Kushagra Sharma (Management)

STATUS: NOT TRAINED YET. This script is ready to run once a labelled photo dataset is
available (see vision/README.md). The app currently uses curated scan results.

Approach
  backbone : MobileNetV3-Large pretrained on ImageNet (small enough for phones)
  stage 1  : freeze backbone, train the new classifier head (5 epochs)
  stage 2  : unfreeze the last blocks, fine-tune with a lower learning rate
  input    : 224×224, ImageNet normalisation, train-time augmentation
  output   : models/food_classifier.pt, models/food_classifier.onnx, reports/vision_metrics.json

Dataset layout expected (ImageFolder):
  data/images/train/<class_name>/*.jpg
  data/images/val/<class_name>/*.jpg
  data/images/test/<class_name>/*.jpg

Usage
  pip install torch torchvision
  python vision/train_food_classifier.py --data data/images --epochs-head 5 --epochs-finetune 10
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build_loaders(data_dir: Path, batch_size: int):
    import torch
    from torchvision import datasets, transforms

    mean, std = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.6, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.25, 0.25, 0.2, 0.03),  # kitchens and canteens have very different lighting
        transforms.RandomRotation(12),
        transforms.ToTensor(),
        transforms.Normalize(mean, std),
    ])
    eval_tf = transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(), transforms.Normalize(mean, std)])
    sets = {
        "train": datasets.ImageFolder(data_dir / "train", train_tf),
        "val": datasets.ImageFolder(data_dir / "val", eval_tf),
        "test": datasets.ImageFolder(data_dir / "test", eval_tf),
    }
    loaders = {k: torch.utils.data.DataLoader(v, batch_size=batch_size, shuffle=(k == "train"), num_workers=2) for k, v in sets.items()}
    return sets, loaders


def build_model(n_classes: int):
    import torch.nn as nn
    from torchvision import models

    m = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.IMAGENET1K_V2)
    for p in m.features.parameters():
        p.requires_grad = False
    m.classifier[3] = nn.Linear(m.classifier[3].in_features, n_classes)
    return m


def run_epoch(model, loader, device, optimizer=None, criterion=None):
    import torch

    train = optimizer is not None
    model.train(train)
    total, correct, top3, loss_sum = 0, 0, 0, 0.0
    with torch.set_grad_enabled(train):
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            out = model(x)
            loss = criterion(out, y)
            if train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
            loss_sum += loss.item() * len(y)
            total += len(y)
            correct += (out.argmax(1) == y).sum().item()
            top3 += (out.topk(3, 1).indices == y[:, None]).any(1).sum().item()
    return {"loss": loss_sum / total, "top1": correct / total, "top3": top3 / total}


def main() -> None:
    ap = argparse.ArgumentParser(description="Train the NutriSense food classifier")
    ap.add_argument("--data", type=Path, default=ROOT / "data" / "images")
    ap.add_argument("--epochs-head", type=int, default=5)
    ap.add_argument("--epochs-finetune", type=int, default=10)
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--seed", type=int, default=2026)
    args = ap.parse_args()

    if not (args.data / "train").exists():
        raise SystemExit(f"No dataset at {args.data}. See vision/README.md for how to prepare it.")

    import torch
    import torch.nn as nn

    torch.manual_seed(args.seed)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    sets, loaders = build_loaders(args.data, args.batch_size)
    classes = sets["train"].classes
    model = build_model(len(classes)).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    history, best_val, best_state = [], 0.0, None

    phases = [("head", args.epochs_head, 1e-3), ("finetune", args.epochs_finetune, 1e-4)]
    for phase, epochs, lr in phases:
        if phase == "finetune":
            for p in model.features[-4:].parameters():  # unfreeze the last blocks
                p.requires_grad = True
        opt = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=lr, weight_decay=1e-4)
        sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=max(1, epochs))
        for ep in range(epochs):
            t0 = time.time()
            tr = run_epoch(model, loaders["train"], device, opt, criterion)
            va = run_epoch(model, loaders["val"], device, criterion=criterion)
            sched.step()
            history.append({"phase": phase, "epoch": ep + 1, "train": tr, "val": va, "seconds": round(time.time() - t0, 1)})
            print(f"[{phase} {ep + 1}/{epochs}] train loss {tr['loss']:.3f} top1 {tr['top1']:.3f} | val top1 {va['top1']:.3f} top3 {va['top3']:.3f}")
            if va["top1"] > best_val:
                best_val, best_state = va["top1"], {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}

    model.load_state_dict(best_state)
    test = run_epoch(model, loaders["test"], device, criterion=criterion)
    (ROOT / "models").mkdir(exist_ok=True)
    torch.save({"state_dict": model.state_dict(), "classes": classes}, ROOT / "models" / "food_classifier.pt")
    model.eval().cpu()
    torch.onnx.export(model, torch.randn(1, 3, 224, 224), ROOT / "models" / "food_classifier.onnx", input_names=["image"], output_names=["logits"], opset_version=17)
    report = {"backbone": "mobilenet_v3_large (ImageNet)", "classes": classes, "n_train": len(sets["train"]), "n_val": len(sets["val"]), "n_test": len(sets["test"]),
              "best_val_top1": best_val, "test": test, "history": history}
    (ROOT / "reports").mkdir(exist_ok=True)
    (ROOT / "reports" / "vision_metrics.json").write_text(json.dumps(report, indent=2))
    print(f"test top-1 {test['top1']:.3f} | top-3 {test["top3"]:.3f} -> models/food_classifier.pt, .onnx")


if __name__ == "__main__":
    main()
