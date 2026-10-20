# Food image classifier: NutriSense AI (IDP P020)

**Status: not trained yet.** `train_food_classifier.py` is complete transfer-learning code. It needs a labelled photo dataset to run. Until then the app's scanner shows curated results, and its *How the AI works* screen says so.

## Classes
The app recognises the 29 plates listed in `../data/knowledge_base/scan_classes.json` (dal tadka + roti, rajma chawal, idli sambar, masala dosa, biryani, and others).

## Getting data
Use one or more of these, and check each licence before use:
- **Indian Food Images Dataset** (Kaggle, ~80 classes): community-collected Indian dishes.
- **Food-101** (ETH Zürich, 101 classes, 101k images): covers pizza, burger, fries and other global items.
- **Your own photos**: the team photographs canteen and home plates. This needs a consent form, which the Law members own.

Aim for at least 150 images per class. Split by source photo session into train/val/test (70/15/15) so near-duplicate shots never leak across splits. Arrange the files as `data/images/{train,val,test}/<class>/*.jpg`.

## Train
```bash
pip install torch torchvision
python vision/train_food_classifier.py --data data/images
```
Outputs: `models/food_classifier.pt` (PyTorch), `models/food_classifier.onnx` (for on-device or web inference), and `reports/vision_metrics.json` (top-1/top-3 per epoch plus the final test score).

## Target
Top-1 ≥ 85% on the held-out test split (project goal; not yet measured).
