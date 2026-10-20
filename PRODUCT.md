# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Indian college students and young adults (the IDP P020 review panel is the first audience) who eat home food, mess food and street food, and want to know whether what they eat actually meets their body's needs. They use it on a phone, at meal times, often mid-meal, and the panel sees it on a laptop during a presentation.

## Product Purpose
NutriSense AI turns a photo or log of a meal into a decision: it estimates the person's requirements from their profile, finds possible nutrient gaps (iron, vitamin D, B12, protein, calcium, fiber…), and recommends specific Indian foods and meals that close them. Success: a user can answer "am I meeting my needs, and what should I eat next?" in seconds.

## Positioning
Not a calorie counter. The full loop of profile → recognition → requirement estimation → gap analysis → personalised recommendation sits in one workflow, grounded in Indian foods (IFCT 2017) and ICMR-NIN 2020 RDAs, with explainable suggestions ("+38% iron").

## Operating Context
Interdisciplinary Design Project, first review 2026. Team: 4 CSE (Garveet Singh, Vishwas Ahuja, Chandan Kumar, Reedima), 2 Law (Prerna Singh, Mehak Kamboj), 1 Management (Kushagra Sharma); mentor Dr. Vivek Sharma. Demonstrated live on a laptop; the desktop view frames the phone app with presentation panels.

## Capabilities and Constraints
- React + Vite SPA, fully offline; backend is a hard-coded mock (`src/services/api.js`) that must answer varied queries across 20+ iterations.
- Features: onboarding + consent, home dashboard, food/barcode/label scan, meal details, diary, food search, progress, nutrient profile, AI coach (English + Hinglish), 7-day meal plan, profile, privacy, how-it-works, about.
- Food recognition is simulated in this build; this must be stated honestly on the How-it-works page.

## Brand Commitments
- Name: NutriSense AI.
- Visual direction pinned by the user: the lime nutrition app references (white cards, lime calendar card, gradient ingredient bars, hatched bar chart, real-photo scanner) and the yellow-lime "Monica" app (huge thin numerals, "256 KCAL"), with Gilroy-style geometric sans typography; purple app's dark date-pill header and photo meal cards may be borrowed as components.
- Real food photography (free-licensed, stored locally).

## Evidence on Hand
Project slides (problem, objectives, architecture, team). No real users, accuracy benchmarks, or testimonials exist; never fabricate them.

## Product Principles
1. Turn data into a next decision, never just a number.
2. Explain why: every suggestion names the gap it closes.
3. Stay inside the medical boundary: estimates and general guidance, not diagnosis.
4. Indian food first: dal, roti, poha, not quinoa bowls by default.
5. Privacy by default: data stays on the device, consent is explicit.
