import { FOOD_BY_ID } from '../data/foods'

export const NUTRIENTS = [
  { key: 'protein', label: 'Protein', unit: 'g', weight: 2, why: 'Builds and repairs muscle, skin, enzymes and hormones. Keeps you full longer.' },
  { key: 'fiber', label: 'Fiber', unit: 'g', weight: 1, why: 'Supports digestion and steady blood sugar, and feeds healthy gut bacteria.' },
  { key: 'iron', label: 'Iron', unit: 'mg', weight: 1.5, why: 'Carries oxygen in your blood. Low intake can show up as tiredness and poor focus.' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', weight: 1, why: 'Keeps bones and teeth strong and helps muscles and nerves work.' },
  { key: 'vitD', label: 'Vitamin D', unit: 'µg', weight: 1, why: 'Helps your body absorb calcium and supports immunity. Few foods contain it naturally.' },
  { key: 'b12', label: 'B12', unit: 'µg', weight: 1, why: 'Needed for nerves and red blood cells. Mostly found in animal foods, so vegetarians often fall short.' },
  { key: 'vitC', label: 'Vitamin C', unit: 'mg', weight: 0.5, why: 'Supports immunity and boosts iron absorption from plant foods.' },
  { key: 'folate', label: 'Folate', unit: 'µg', weight: 0.5, why: 'Important for cell growth and red blood cell formation.' },
  { key: 'zinc', label: 'Zinc', unit: 'mg', weight: 0.5, why: 'Supports immunity, wound healing and taste.' },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', weight: 0.5, why: 'Involved in 300+ reactions, including muscle and nerve function and sleep quality.' },
  { key: 'omega3', label: 'Omega-3', unit: 'g', weight: 0.5, why: 'Healthy fats that support heart and brain health.' },
]

export const NUTRIENT_BY_KEY = Object.fromEntries(NUTRIENTS.map((n) => [n.key, n]))

export const ACTIVITY = [
  { id: 'sedentary', label: 'Sedentary', hint: 'Desk job, little exercise', factor: 1.2 },
  { id: 'light', label: 'Lightly active', hint: 'Walks, 1–3 workouts/week', factor: 1.375 },
  { id: 'moderate', label: 'Moderately active', hint: '3–5 workouts/week', factor: 1.55 },
  { id: 'active', label: 'Very active', hint: 'Hard training 6–7 days', factor: 1.725 },
]

export const GOALS = [
  { id: 'lose', label: 'Lose weight', delta: -450, proteinPerKg: 1.2 },
  { id: 'maintain', label: 'Eat healthier', delta: 0, proteinPerKg: 1.0 },
  { id: 'gain', label: 'Build muscle', delta: 300, proteinPerKg: 1.6 },
]

export const DIETS = [
  { id: 'veg', label: 'Vegetarian', hint: 'Dairy OK, no egg/meat' },
  { id: 'egg', label: 'Eggetarian', hint: 'Veg + eggs' },
  { id: 'nonveg', label: 'Non-vegetarian', hint: 'Everything' },
  { id: 'vegan', label: 'Vegan', hint: 'Plant-based only' },
]

export const ALLERGENS = [
  { id: 'dairy', label: 'Dairy / lactose' },
  { id: 'gluten', label: 'Gluten' },
  { id: 'nuts', label: 'Nuts / peanuts' },
  { id: 'egg', label: 'Egg' },
  { id: 'seafood', label: 'Seafood' },
  { id: 'soy', label: 'Soy' },
]

const DIET_ALLOWS = {
  vegan: ['vegan'],
  veg: ['vegan', 'veg'],
  egg: ['vegan', 'veg', 'egg'],
  nonveg: ['vegan', 'veg', 'egg', 'nonveg'],
}

export function fitsDiet(item, profile) {
  if (!profile) return true
  if (!DIET_ALLOWS[profile.diet || 'nonveg'].includes(item.diet)) return false
  const allergies = profile.allergies || []
  return !item.allergens.some((a) => allergies.includes(a))
}

export function bmi(profile) {
  const m = profile.heightCm / 100
  return profile.weightKg / (m * m)
}

export function bmiCategory(v) {
  // Asian-Indian cut-offs (WHO expert consultation, 2004)
  if (v < 18.5) return { label: 'Underweight', color: 'var(--orange)' }
  if (v < 23) return { label: 'Healthy range', color: 'var(--leaf-deep)' }
  if (v < 25) return { label: 'Overweight', color: 'var(--orange)' }
  return { label: 'Obese range', color: 'var(--coral)' }
}

// Requirement estimation: Mifflin-St Jeor BMR × activity, then goal adjustment.
// Micronutrient targets follow ICMR-NIN 2020 RDAs for Indian adults.
export function computeTargets(profile) {
  const { age, gender, heightCm, weightKg } = profile
  const male = gender !== 'female'
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (male ? 5 : -161)
  const act = ACTIVITY.find((a) => a.id === profile.activity) || ACTIVITY[1]
  const tdee = bmr * act.factor
  const goal = GOALS.find((g) => g.id === profile.goal) || GOALS[1]
  const floor = male ? 1500 : 1200
  const auto = Math.round(Math.max(floor, tdee + goal.delta) / 10) * 10
  const kcal = profile.kcalOverride ? Math.round(profile.kcalOverride) : auto
  const protein = Math.round(weightKg * goal.proteinPerKg)
  const fat = Math.round((kcal * 0.27) / 9)
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4))
  const older = age > 50
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    autoKcal: auto,
    kcal,
    protein,
    carbs,
    fat,
    fiber: Math.round((kcal / 1000) * 14),
    iron: male || older ? 19 : 29,
    calcium: older ? 1200 : 1000,
    vitD: age > 70 ? 20 : 15,
    b12: 2.5,
    vitC: male ? 80 : 65,
    folate: 300,
    zinc: male ? 17 : 13,
    magnesium: male ? 440 : 370,
    omega3: male ? 1.6 : 1.1,
    water: Math.round((weightKg * 35) / 250),
  }
}

export function sumEntries(entries) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0, calcium: 0, vitD: 0, b12: 0, vitC: 0, folate: 0, zinc: 0, magnesium: 0, omega3: 0 }
  for (const e of entries || []) {
    const f = FOOD_BY_ID[e.foodId]
    if (!f) continue
    for (const k in t) t[k] += f.n[k] * e.servings
  }
  return t
}

export function sumItems(items) {
  return sumEntries(items)
}

export function averageTotals(days) {
  const sums = days.map(sumEntries)
  const avg = {}
  const n = Math.max(1, sums.length)
  for (const k of Object.keys(sums[0] || sumEntries([]))) avg[k] = sums.reduce((a, s) => a + s[k], 0) / n
  return avg
}

export function pct(value, target) {
  if (!target) return 0
  return Math.round((value / target) * 100)
}

export function status(p) {
  if (p >= 80) return { id: 'good', label: 'Good', long: 'Adequate', color: 'var(--leaf-deep)', bg: '#e6f6d6' }
  if (p >= 50) return { id: 'watch', label: 'Watch', long: 'Needs attention', color: 'var(--orange)', bg: '#fff0dc' }
  return { id: 'low', label: 'Low', long: 'Higher priority', color: 'var(--coral)', bg: 'var(--coral-soft)' }
}

export function statusHex(p) {
  if (p >= 80) return '#7CC242'
  if (p >= 50) return '#FF8A4C'
  return '#F2645A'
}

// Gap analysis across all tracked micronutrients, worst first.
export function gapAnalysis(avg, targets) {
  return NUTRIENTS.map((n) => {
    const p = pct(avg[n.key], targets[n.key])
    return { ...n, value: avg[n.key], target: targets[n.key], pct: p, status: status(p) }
  }).sort((a, b) => a.pct - b.pct)
}

// Daily nutrition score 0–100: nutrient adequacy (70%) + calorie fit (30%).
export function dailyScore(totals, targets) {
  if (!totals || totals.kcal < 50) return 0
  let wsum = 0
  let acc = 0
  for (const n of NUTRIENTS) {
    wsum += n.weight
    acc += n.weight * Math.min(100, pct(totals[n.key], targets[n.key]))
  }
  const adequacy = acc / wsum
  const dev = Math.abs(totals.kcal - targets.kcal) / targets.kcal
  const calFit = Math.max(0, 100 - dev * 160)
  return Math.round(adequacy * 0.7 + calFit * 0.3)
}

export function fmt(n, digits = 0) {
  if (n == null || Number.isNaN(n)) return '0'
  const v = Number(n)
  if (digits === 0) return Math.round(v).toLocaleString('en-IN')
  return v.toFixed(digits).replace(/\.0+$/, '')
}

export function fmtNutrient(key, value) {
  if (key === 'vitD' || key === 'b12' || key === 'omega3') return fmt(value, 1)
  if (key === 'iron' || key === 'zinc') return fmt(value, 1)
  return fmt(value)
}

// Lower-case a nutrient label for use mid-sentence, keeping B12 and the 'D' in vitamin D.
export function lc(label) {
  if (label === 'B12') return label
  return label.replace(/^Vitamin /, 'vitamin ').replace(/^Omega/, 'omega').replace(/^(Protein|Fiber|Iron|Calcium|Zinc|Magnesium|Folate)$/, (m) => m.toLowerCase())
}
