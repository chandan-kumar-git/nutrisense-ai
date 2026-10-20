<div align="center">

# NutriSense AI

**Snap or log a meal, find out which nutrients you're short on, and get Indian food suggestions that close the gap.**

AI Nutrition Detection and Diet Suggestion using Deep Learning · IDP P020 · Mentor: Dr. Vivek Sharma

[Download the Android APK](https://github.com/Chandankumar775/nutrisense-ai/releases/latest/download/NutriSense-AI.apk) (12.7 MB)

<img src="docs/screenshots/desktop.png" alt="NutriSense AI in presentation mode: the phone app with the live pipeline, demo navigator and API activity panels" width="100%">

</div>

## What it does

NutriSense is not a calorie counter. It turns a photo or log of a meal into a decision: it estimates your requirements from your profile, finds possible gaps (iron, vitamin D, B12, protein, calcium, fiber…) and recommends specific Indian foods that close them, with the reason shown ("+38% iron").

```
profile → scan / log meal → requirement estimation → gap analysis → recommendations → coaching
```

## Screens

<table>
  <tr>
    <td align="center" width="25%"><img src="docs/screenshots/a03-home.png" width="200" alt="Home"><br><sub><b>Home</b><br>calories, macros, 7-day check</sub></td>
    <td align="center" width="25%"><img src="docs/screenshots/a08-scanresult.png" width="200" alt="Scan result"><br><sub><b>Scan result</b><br>items, grams, confidence</sub></td>
    <td align="center" width="25%"><img src="docs/screenshots/a09-meal.png" width="200" alt="Meal details"><br><sub><b>Meal details</b><br>portions, micronutrients, swaps</sub></td>
    <td align="center" width="25%"><img src="docs/screenshots/a13-nutrients.png" width="200" alt="Nutrient gaps"><br><sub><b>Nutrient profile</b><br>11-nutrient gap analysis</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/a19-coach.png" width="200" alt="AI Coach"><br><sub><b>AI Coach</b><br>English and Hinglish</sub></td>
    <td align="center"><img src="docs/screenshots/a17-plan.png" width="200" alt="Meal plan"><br><sub><b>Meal plan</b><br>7 days, built around your gaps</sub></td>
    <td align="center"><img src="docs/screenshots/a11-progress.png" width="200" alt="Progress"><br><sub><b>Progress</b><br>day to year, score trend</sub></td>
    <td align="center"><img src="docs/screenshots/a15-diary.png" width="200" alt="Food diary"><br><sub><b>Food diary</b><br>grouped by meal</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/a20-goal.png" width="200" alt="Calorie goal"><br><sub><b>Calorie goal</b><br>slider with live macro split</sub></td>
    <td align="center"><img src="docs/screenshots/a21-profile.png" width="200" alt="Profile"><br><sub><b>Profile</b><br>targets, privacy, export</sub></td>
    <td align="center"><img src="docs/screenshots/mobile.png" width="200" alt="Mobile web"><br><sub><b>Mobile web</b><br>full screen on a phone</sub></td>
    <td></td>
  </tr>
</table>

## Install the Android app

Direct download: [NutriSense-AI.apk](https://github.com/Chandankumar775/nutrisense-ai/releases/latest/download/NutriSense-AI.apk). Allow *Install unknown apps* for your browser or file manager when the phone asks.

From the command line:

```bash
# Linux / macOS / Git Bash
curl -L -o NutriSense-AI.apk https://github.com/Chandankumar775/nutrisense-ai/releases/latest/download/NutriSense-AI.apk

# Windows PowerShell
iwr https://github.com/Chandankumar775/nutrisense-ai/releases/latest/download/NutriSense-AI.apk -OutFile NutriSense-AI.apk

# install on a phone connected over USB
adb install NutriSense-AI.apk
```

## Features

| Screen | What it does |
|---|---|
| Onboarding | Six steps: about you, body (live BMI), activity, diet and allergies, goal, consent (DPDP-style). Ends with your daily target. |
| Home | Calorie ring and macros, 7-day nutrient check, an AI meal idea for the next meal, today's meals, water tracker, weekly score |
| Scan | Food, barcode and label modes, live camera, photo upload, an animated 5-stage vision pipeline, confidence and alternatives |
| Meal details | Small/medium/large portions, 10 micronutrients, smart swaps, add to any meal slot |
| Add food | 100+ Indian foods, "fits my diet" filter, sort by nutrient density, ready-made meals |
| Nutrient profile | 11-nutrient gap analysis (adequate / needs attention / higher priority) with an action plan and food sources |
| AI Coach | Chat in English and Hinglish, 25+ intents, voice input, tappable meal cards, medical-boundary handling |
| Meal plan | 7-day plan optimised for your gaps, swap any meal, grocery list, export |
| Profile and privacy | BMR, TDEE and RDA targets, consent status, JSON data export, erase-all |
| How the AI works | Pipeline, model card, approach comparison, limitations |

## How the AI works in this build

Everything is computed on the device from a curated knowledge base, so every answer is grounded in your own data:

- `src/data/foods.js`: 116 foods × 14 nutrients (IFCT 2017 / USDA reference values)
- `src/data/meals.js`: 92 meal combinations, 28 scan plates, 12 barcode products, 6 nutrition labels
- `src/engine/nutrition.js`: Mifflin-St Jeor energy, ICMR-NIN 2020 RDAs, gap thresholds, daily score
- `src/engine/recommend.js`: gap-closing meal ranking, 7-day planner, smart swaps, grocery list
- `src/engine/coach.js`: rule-based NLU (English and Hinglish), food lookups ("2 roti"), comparisons ("paneer vs chicken"), medical and supplement guardrails
- `src/engine/detector.js`: food recognition is **simulated** in this build. Scans rotate through diet-compatible plates; uploading a photo named e.g. `biryani.jpg` returns that dish.
- `ml/`: the Python side: data simulation, cleaning, and training the gap model and recommender (see [`ml/README.md`](ml/README.md)).

`src/services/api.js` is a single mock backend whose functions mirror REST endpoints (`POST /api/v1/vision/detect`, `/coach/chat`, `/recommend/plan`, …). Replace their bodies with `fetch()` calls to connect a real FastAPI + TensorFlow service. User data stays in `localStorage` on the device.

> General guidance, not a medical diagnosis.

## Run locally

```bash
git clone https://github.com/Chandankumar775/nutrisense-ai.git
cd nutrisense-ai
npm install
npm run dev        # http://localhost:5173
```

On a desktop the app runs inside a phone frame with presentation panels (live pipeline, demo navigator, API activity). Tap **Explore with a demo profile** to load a vegetarian user with two weeks of meal history.

Build the APK yourself:

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

## Design

Light grey ground, white 28px cards, a lime calendar card, lime-to-leaf gradient bars over hatched tracks, huge hairline numerals ("256 KCAL") and a black floating scan button. Type is Urbanist, self-hosted. The 116 food photos are free-licensed images from Wikimedia Commons, credited in the app.

## Team

Interdisciplinary Design Project P020, mentor Dr. Vivek Sharma.

| CSE | Law | Management |
|---|---|---|
| Garveet Singh, Vishwas Ahuja, Chandan Kumar, Reedima | Prerna Singh, Mehak Kamboj | Kushagra Sharma |
