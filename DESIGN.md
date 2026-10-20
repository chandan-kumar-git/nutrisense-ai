---
name: NutriSense AI
description: Food-first nutrition app where the plate photo and one huge thin number lead every screen.
colors:
  ink: "#121412"
  ink-2: "#2b2e2a"
  muted: "#868b84"
  muted-2: "#a9ada6"
  ground: "#f3f4f0"
  card: "#ffffff"
  line: "#ebede7"
  lime: "#d7f26b"
  lime-soft: "#e6f5b3"
  lime-pale: "#f4fadf"
  leaf: "#7cc242"
  leaf-deep: "#4f9a2a"
  orange: "#ff8a4c"
  orange-soft: "#ffe3d3"
  cyan: "#38c6e8"
  cyan-soft: "#d6f3fb"
  coral: "#f2645a"
  coral-soft: "#fde1de"
  amber: "#f5b53b"
  amber-soft: "#fdf0d2"
  dark-raised: "#2a2d29"
  dark-pill: "#232622"
typography:
  display-xl:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "96px"
    fontWeight: 200
    lineHeight: 0.9
    letterSpacing: "-0.05em"
    fontFeature: "\"tnum\" 1"
  display:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "76px"
    fontWeight: 200
    lineHeight: 0.88
    letterSpacing: "-0.045em"
    fontFeature: "\"tnum\" 1"
  numeral-lg:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  numeral-md:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  body-sm:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.45
  unit:
    fontFamily: "Urbanist Variable, Urbanist, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.14em"
rounded:
  xs: "8px"
  sm: "14px"
  md: "18px"
  lg: "22px"
  xl: "28px"
  sheet: "34px"
  hero: "40px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  gutter: "20px"
  card: "18px"
  card-sm: "14px"
  screen-top: "56px"
  nav-clearance: "124px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    height: "56px"
    padding: "0 24px"
  button-lime:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "56px"
    padding: "0 24px"
  button-light:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "56px"
    padding: "0 24px"
  button-sm:
    rounded: "21px"
    height: "42px"
    padding: "0 18px"
  icon-button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "44px"
  icon-button-on-dark:
    backgroundColor: "{colors.dark-raised}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    size: "44px"
  scan-fab:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    size: "62px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card}"
  card-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card}"
  tile:
    backgroundColor: "{colors.card}"
    rounded: "26px"
    padding: "16px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "20px"
    padding: "9px 15px"
  chip-active:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "54px"
    padding: "0 18px"
  segmented-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "19px"
  date-pill:
    backgroundColor: "{colors.dark-pill}"
    textColor: "{colors.card}"
    rounded: "{rounded.lg}"
    height: "66px"
  date-pill-on:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
  bottom-nav:
    backgroundColor: "{colors.card}"
    rounded: "38px"
    height: "74px"
---

# Design System: NutriSense AI

## Overview

**Creative North Star: "The Plate and the Number"**

Every screen is led by one of two things: a real photograph of Indian food, or one enormous hairline numeral ("360 / 2,280 kcal", "506 KCAL"). Everything else is quiet support: pure white 28px-radius cards floating on a cool off-white ground, near-black ink for text and decisive controls, and a single lime accent that means "progress, today, selected". The world replaced an older green ring-dashboard look; progress is now told with horizontal lime-to-leaf gradient bars running over diagonal-hatched remainders, so what is left reads as texture, not as an empty ring.

Density is phone-native and generous: 20px side gutters, 16px vertical rhythm between cards, 18px inside them, and a floating white pill nav with a black scan disc punched up out of its centre. Dark surfaces are reserved for two jobs only: the rounded dark header that carries date pills above meal lists, and the scrims that make type legible over food photography. Motion is a single long-tailed ease-out (cubic-bezier(0.16, 1, 0.3, 1)) used for bar fills, press-scale feedback, sheet rises and staggered card entry, and it all collapses under reduced motion.

**Key Characteristics:**
- Cool off-white ground, white cards, near-black ink, one lime accent.
- Hairline (200) giant numerals as the hero of a screen; headings at 700.
- Progress = lime gradient bar over a hatched track, never a ring.
- Real food photography, full-bleed under dark gradient scrims.
- Fully rounded geometry: pills, discs, 22–28px cards, 34–40px sheet and hero bottoms.
- Black for commitment (primary button, scan, selected segment), lime for state.

## Colors

A near-monochrome ground of cool greys and white, spent on one lime voice, with three food-ingredient hues reserved for macro data.

### Primary
- **Fresh Lime** (lime): the single brand accent. Active nav disc, calendar card, active chips, the `go` disc inside buttons, toggle thumbs, scan-tag dots, selection highlight, link underlines (3px). Means "today / selected / on track".
- **Lime-to-Leaf Gradient** (#f1fbc8 → #c9ec5f → #7cc242, horizontal; vertical variant for chart columns): the progress fill on every gradient bar and on the selected day's chart column. Pairs with Leaf (leaf) and Deep Leaf (leaf-deep).
- **Deep Leaf** (leaf-deep): focus rings, input caret, calendar log ticks, "good" text; the only green dark enough to carry meaning on white.

### Secondary
- **Ink Black** (ink): all body text, primary buttons, the scan FAB, selected segment, dark header and dark cards, chat user bubbles, tooltips and toasts. Black is the commitment colour; lime is the state colour.

### Tertiary (ingredient data hues)
- **Masala Orange** (orange, soft orange-soft): protein bars; over-target chart columns.
- **Clear Cyan** (cyan, soft cyan-soft): carbohydrate bars.
- **Leaf** (leaf, soft lime-soft): fat bars and on-track micronutrients.
- **Chilli Coral** (coral, soft coral-soft): notification dot, "low" status, destructive actions (text #9f2a21 on coral-soft).
- **Turmeric Amber** (amber, soft amber-soft): "watch" status and coach warning tips.

Each data hue appears as a thin full-strength fill on a pale track of the same hue.

### Neutral
- **Cool Paper** (ground): app background, ghost icon buttons, soft chips, food-row and stepper wells, sheet background.
- **Pure White** (card): every card, tile, pill, input, nav and light button.
- **Hairline Sage** (line): list dividers, outlined chips, arrow-button strokes, toggle off track, grab handles.
- **Sage Grey** (muted) and **Pale Sage** (muted-2): secondary text and placeholders.
- **Graphite** (ink-2): long-form legal text.
- **Dark Raised** (dark-raised) and **Dark Pill** (dark-pill): icon buttons and unselected date pills inside the dark header.

### Named Rules
**The One Lime Rule.** Lime is the only accent. It marks state (today, selected, done, progress) and never decorates.
**The Black Commits Rule.** The action a screen exists for is ink-black (primary button, scan FAB); secondary actions are white or lime.
**The Hatched Remainder Rule.** What is left of a goal is drawn as a diagonal hatch (-45deg, 2px #e3e6df lines every 7px on #f2f3ef), never as an empty grey track or an open ring.

## Typography

**Display Font:** Urbanist Variable (with Urbanist, system-ui, -apple-system, Segoe UI, sans-serif)
**Body Font:** Urbanist Variable (same stack)

**Character:** One geometric sans across the full weight range. The weight contrast is the system: hairline 200 for the giant number, 600–700 for everything that labels it.

### Hierarchy
- **Display XL** (200, 96px, 0.9): onboarding target and weekly-average heroes; may scale to 132px on the single onboarding result.
- **Display** (200, 76px, 0.88, tabular): the screen's hero numeral (Today kcal, meal kcal, diary total). The target follows in muted 18–20px ("/ 2,280 kcal").
- **Numeral LG / MD** (300 at 44px; 600 at 28px; tile value 600 at 34px): secondary figures in tiles and macro cards.
- **Headline** (700, 30px, 1.05): page titles and greeting name.
- **Title** (700, 22px) and **Title SM** (700, 18px): section and card headers, top-bar titles.
- **Body** (500–600, 13–15px, 1.45–1.5): copy, list rows, chat.
- **Unit** (700, 11px, 0.14em, uppercase): units that trail a hero numeral ("KCAL", "MATCH"). Never smaller than 11px.

### Named Rules
**The Hairline Hero Rule.** The largest number on a screen is weight 200 with negative tracking and tabular figures; nothing else on the screen is that light.
**The Number-First Rule.** The numeral leads and the unit trails; a label never sits above a hero numeral as a kicker.

## Layout

Single-column phone layout inside a 390×844 frame on desktop (phone bezel with presentation side panels, collapsing to one side panel under 1180px and to a full-bleed app under 820px). Screens pad 56px top (safe-area on mobile), 20px sides and 124px bottom to clear the floating nav; cards stack with 16px gaps. Two- and three-up grids use 12px and 10px gaps. Bleed screens (meal details, scanner) drop padding so photography runs edge to edge, with content resuming below a 380px hero rounded off at 40px. Horizontal chip rails scroll edge to edge by negating the gutter. The bottom nav and chat composer float 16px from the sides and 18px from the bottom.

## Elevation & Depth

Soft and ambient. White surfaces lift off the ground with one composite shadow; nothing has a hard edge or an offset shadow. Dark surfaces (header, dark cards, FAB) carry no ambient shadow except the FAB's own drop. Depth over photography comes from gradient scrims and backdrop blur, not borders.

### Shadow Vocabulary
- **Card float** (`0 1px 2px rgba(18,20,18,0.03), 0 14px 34px -16px rgba(30,44,16,0.16)`): cards, tiles, inputs, pills, light buttons, segmented control.
- **Lifted** (`0 24px 48px -18px rgba(18,20,18,0.35)`): toasts, floating chips, scanner prop art.
- **Dock** (`0 18px 40px -16px rgba(18,20,18,0.28)`): bottom nav and chat composer.
- **FAB** (`0 14px 26px -8px rgba(18,20,18,0.55), 0 0 0 6px #f3f4f0`): the scan disc, with a ground-coloured ring that cuts it out of the nav.

### Named Rules
**The Tinted Shadow Rule.** Shadows are tinted toward ink/olive and use large negative spread; never neutral grey blur at 0 spread.

## Shapes

Everything is round. Controls are full pills or discs (44px icon buttons, 56px buttons with 28px radius, 62px scan disc, 50px nav targets). Cards are 28px (22px small, 26px tiles, 30px calendar, 32px glow card); inputs 18px; thumbnails 18px or circular. Large panels open on one side only: the dark header and photo heroes round their bottom corners (36–40px), sheets round their top corners (34px). The only square-ish shapes are deliberate props (the 6px nutrition-label art on the scanner). Chat bubbles are 24px with one 8px tail corner.

## Components

### Buttons
Confident, tall, pill-shaped.
- **Shape:** full pill (56px tall, 28px radius; small 42px / 21px).
- **Primary:** ink background, white 15px/700 text, 24px side padding; may carry a 40px lime `go` disc with an arrow tucked against its right edge.
- **Lime / Light / Outline / Danger:** lime on ink text; white with card float; transparent with 1.5px ink stroke; coral-soft with #9f2a21 text.
- **Press:** scale 0.98 (icon buttons 0.92) on the standard ease; disabled at 35% opacity.
- **Icon buttons:** 44px white discs with card float; ghost (ground), dark (ink), lime and glass (92% white + 12px blur over photos) variants. **Arrow buttons** are 34px white discs with a 1.5px line stroke holding an up-right arrow.

### Chips
- **Style:** 20px-radius pills, 13px/600, white by default; soft (ground), line (1.5px stroke) and dark variants.
- **State:** active is lime with ink text. Glass chips (20% white, 12px blur) label photo cards.

### Cards / Containers
- **Corner Style:** 28px (small 22px, tile 26px).
- **Background:** white; lime-soft for highlight cards; ink for dark cards; a radial lime glow card for a single celebratory figure.
- **Shadow Strategy:** card float (see Elevation).
- **Border:** none.
- **Internal Padding:** 18px (small 14px, tiles 16px); card head 18px/700 title with a link or icon button right.

### Inputs / Fields
- **Style:** 54px white field, 18px radius, 1.5px transparent stroke, card float, 16px/600 text; search fields indent 46px for a muted icon.
- **Focus:** stroke turns ink; global focus-visible is a 2px deep-leaf outline at 2px offset.
- **Option tiles:** 22px white tiles; selected gets a 2px ink stroke on lime-pale. Checkboxes are 24px/8px squares that fill ink with a lime check. Toggles: 50×30, ink track with a lime thumb when on.

### Navigation
- **Bottom nav:** floating white pill (74px tall, 38px radius, dock shadow) with four 50px icon targets and the black 62px scan disc raised 34px above centre. The active item is a lime radial disc (#effb9a → #a9da4a); icons go from 1.9 to 2.3 stroke when active. Labels are screen-reader only.
- **Top bar:** back disc, centred 18px/700 title, optional right disc.
- **Segmented control:** white 24px pill with 5px inset; selected segment is ink with white text.

### Gradient Bar (signature)
The progress primitive. 26px tall (14px small), fully rounded track filled with the hatch pattern; the fill is the lime-to-leaf gradient and animates width over 1s on the standard ease. Thin 6px ingredient bars and 8px nutrient bars use a single data hue on a same-hue pale track. Weekly chart columns are 34px-wide hatched capsules filled pale lime, the selected day in the vertical gradient and over-target days in orange.

### Lime Calendar Card (signature)
30px card on a lime gradient (#e5f6a6 → #d5ef86) holding the month title, two 32px outlined arrow discs and seven 40px white day bubbles; today is a leaf-stroked bubble with a soft green drop, future days fade to 45% white, logged days carry a 5px deep-leaf tick.

### Dark Header with Date Pills (signature)
Ink panel rounded 36px at the bottom, holding dark-raised icon discs, a row of 66px dark date pills (selected pill turns white) and the day's hero numeral with its gradient bar.

### Photo Meal Card (signature)
190px card, 28px radius, real food photo with a 0→78% black bottom scrim; glass chip top-left, action disc top-right, white 700 dish name and macro figures bottom-left. The photo scales 1.04 on hover over 0.8s. Meal details use the same treatment as a 380px hero with the hero numeral set in white over the scrim.

## Do's and Don'ts

### Do:
- **Do** lead each screen with either a real food photograph or one hairline (200) numeral, and keep everything else at 600–700.
- **Do** draw progress as the lime-to-leaf gradient bar over the hatched track.
- **Do** use ink for the single committing action and lime for state.
- **Do** keep macro colour fixed: protein orange, carbs cyan, fat leaf, each on a pale same-hue track.
- **Do** put text over photos only on a dark gradient scrim, with glass (blurred white) chips and discs.
- **Do** use the one ease, cubic-bezier(0.16, 1, 0.3, 1), and honour prefers-reduced-motion.

### Don't:
- **Don't** reintroduce the ring dashboard: no circular progress rings for calories, macros or scores.
- **Don't** add a second accent colour; coral, amber, orange and cyan are data and status colours only.
- **Don't** use abstract plate illustrations or blobs where a real food photo belongs.
- **Don't** put an uppercase eyebrow label above a hero numeral; units trail the number.
- **Don't** set unit labels below 11px.
- **Don't** use hard offset shadows, borders on cards, or square corners on interactive controls.
