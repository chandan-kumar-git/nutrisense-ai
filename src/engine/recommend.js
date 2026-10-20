import { FOODS, FOOD_BY_ID } from '../data/foods'
import { MEALS, MEAL_BY_ID } from '../data/meals'
import { fitsDiet, sumItems, NUTRIENT_BY_KEY, pct, lc } from './nutrition'

export function rng(seed) {
  let s = (seed >>> 0) || 1
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashStr(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

export function pick(arr, r = Math.random) {
  return arr[Math.floor(r() * arr.length)]
}

export function shuffle(arr, r = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function mealTotals(meal, scale = 1) {
  return sumItems(meal.items.map((i) => ({ foodId: i.foodId, servings: i.servings * scale })))
}

// Foods that best close a nutrient gap, ranked by nutrient density per 100 kcal.
export function topFoodsFor(key, profile, { limit = 6, exclude = [] } = {}) {
  return FOODS.filter((f) => fitsDiet(f, profile) && f.category !== 'junk' && f.category !== 'dessert' && !exclude.includes(f.id) && f.n[key] > 0)
    .map((f) => ({ food: f, density: f.n[key] / Math.max(30, f.n.kcal) }))
    .sort((a, b) => b.density - a.density)
    .slice(0, limit)
    .map((x) => x.food)
}

// Score how well a meal closes the user's gaps (higher = better).
function gapScore(totals, gaps, targets) {
  let s = 0
  for (const g of gaps) {
    const share = totals[g.key] / targets[g.key]
    s += share * (g.pct < 50 ? 3 : g.pct < 80 ? 1.6 : 0.4)
  }
  return s
}

export function recommendMeals(profile, targets, gaps, { type = 'main', limit = 3, kcalBudget, focus, seed, exclude = [] } = {}) {
  const r = rng(seed ?? Date.now())
  const focusGaps = focus ? [{ key: focus, pct: 30 }] : gaps.filter((g) => g.pct < 80).slice(0, 4)
  const types = type === 'any' ? ['breakfast', 'main', 'snack'] : [type]
  const pool = MEALS.filter((m) => types.includes(m.type) && fitsDiet(m, profile) && !exclude.includes(m.id))
  const scored = pool.map((m) => {
    const t = mealTotals(m)
    let score = gapScore(t, focusGaps.length ? focusGaps : gaps.slice(0, 3), targets)
    if (kcalBudget) {
      const over = t.kcal - kcalBudget
      if (over > 0) score -= (over / kcalBudget) * 2.5
    }
    score += (t.protein / targets.protein) * 0.6
    score += r() * 0.35 // variety
    return { meal: m, totals: t, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function boostLabel(totals, key, targets) {
  const n = NUTRIENT_BY_KEY[key]
  const p = pct(totals[key], targets[key])
  return { text: `+${p}% ${n ? lc(n.label) : key}`, pct: p }
}

// Smart swap suggestions for a set of food items.
const SWAPS = [
  { from: ['rice', 'jeera_rice'], to: 'brown_rice', text: 'Brown rice instead of white adds fiber and keeps you full longer.' },
  { from: ['toast'], to: 'pb_toast', text: 'Peanut butter on whole-wheat toast adds about 5 g of protein over butter.' },
  { from: ['fries'], to: 'makhana', text: 'Roasted makhana gives the same crunch for about 70% fewer calories.' },
  { from: ['cola'], to: 'lime_water', text: 'Fresh lime water saves about 35 g of sugar and adds vitamin C.' },
  { from: ['lassi'], to: 'chaas', text: 'Chaas keeps the probiotics with about 180 fewer calories.' },
  { from: ['paneer_butter_masala', 'butter_chicken'], to: 'tandoori_chicken', text: 'A tandoori (dry) version cuts roughly 15 g of fat while keeping the protein.' },
  { from: ['aloo_paratha'], to: 'besan_chilla', text: 'Besan chilla has twice the protein and more iron than aloo paratha.' },
  { from: ['samosa'], to: 'dhokla', text: 'Dhokla is steamed, not fried, and saves about 200 kcal over two samosas.' },
  { from: ['maggi'], to: 'veg_momos', text: 'Add a boiled egg and veggies, or switch to steamed momos for less sodium.' },
  { from: ['gulab_jamun', 'ice_cream', 'kheer'], to: 'dates', text: 'Dates with almonds satisfy a sweet craving and add iron and fiber.' },
  { from: ['pizza', 'pasta_white'], to: 'pasta_red', text: 'A tomato-based, veggie-loaded version cuts saturated fat by about half.' },
  { from: ['chai'], to: 'milk', text: 'Turmeric milk instead of a second chai adds calcium and vitamin D.' },
  { from: ['veg_biryani', 'chicken_biryani'], to: 'curd', text: 'Add a bowl of raita and salad to balance a biryani and slow the carb spike.' },
  { from: ['dal_tadka'], to: 'palak_dal', text: 'Palak dal instead of plain dal adds about 50% more iron, plus folate.' },
  { from: ['poha'], to: 'sprouts', text: 'Add a handful of sprouts or peanuts to poha to double its protein.' },
  { from: ['idli', 'dosa', 'masala_dosa'], to: 'sambar', text: 'An extra bowl of sambar adds protein and fiber to a South-Indian breakfast.' },
]

export function smartSwap(items, seed = 0) {
  const ids = items.map((i) => i.foodId)
  const hits = SWAPS.filter((s) => s.from.some((f) => ids.includes(f)))
  if (hits.length) return hits[seed % hits.length]
  const generic = [
    { to: 'green_salad', text: 'Add a bowl of salad first. The fiber slows digestion and keeps you full longer.' },
    { to: 'curd', text: 'Pair this with curd for extra calcium and gut-friendly probiotics.' },
    { to: 'orange', text: 'Have a vitamin-C fruit (orange or guava) with plant-iron meals to absorb more iron.' },
  ]
  return generic[seed % generic.length]
}

// ---------- 7-day meal planner ----------
const SPLIT = { breakfast: 0.25, lunch: 0.35, snack: 0.1, dinner: 0.3 }
const SLOT_TYPE = { breakfast: 'breakfast', lunch: 'main', snack: 'snack', dinner: 'main' }

function scaleFor(meal, budget) {
  const k = mealTotals(meal).kcal
  const raw = budget / k
  return Math.min(1.5, Math.max(0.75, Math.round(raw * 4) / 4))
}

export function generatePlan(profile, targets, gaps, seed = Date.now(), days = 7) {
  const r = rng(seed)
  const recent = []
  const out = []
  const start = new Date()
  for (let d = 0; d < days; d++) {
    const date = new Date(start)
    date.setDate(start.getDate() + d)
    const slots = {}
    for (const slot of Object.keys(SPLIT)) {
      const budget = targets.kcal * SPLIT[slot]
      const pool = MEALS.filter((m) => m.type === SLOT_TYPE[slot] && fitsDiet(m, profile) && !recent.includes(m.id))
      const ranked = pool
        .map((m) => {
          const t = mealTotals(m)
          const s = gapScore(t, gaps.slice(0, 4), targets) + (t.protein / targets.protein) * 0.8 - Math.abs(t.kcal - budget) / budget + r() * 0.9
          return { m, s }
        })
        .sort((a, b) => b.s - a.s)
      const choice = ranked[Math.floor(r() * Math.min(4, ranked.length))].m
      recent.push(choice.id)
      if (recent.length > 9) recent.shift()
      slots[slot] = { mealId: choice.id, scale: scaleFor(choice, budget) }
    }
    out.push({ date: date.toISOString().slice(0, 10), slots })
  }
  return { seed, createdAt: Date.now(), days: out }
}

export function planDayTotals(day) {
  const items = []
  for (const s of Object.values(day.slots)) {
    const meal = MEAL_BY_ID[s.mealId]
    meal.items.forEach((i) => items.push({ foodId: i.foodId, servings: i.servings * s.scale }))
  }
  return sumItems(items)
}

export function swapPlanMeal(plan, dayIdx, slot, profile, targets, gaps) {
  const cur = plan.days[dayIdx].slots[slot].mealId
  const budget = targets.kcal * SPLIT[slot]
  const opts = recommendMeals(profile, targets, gaps, { type: SLOT_TYPE[slot], limit: 6, kcalBudget: budget * 1.2, exclude: [cur], seed: Date.now() })
  const choice = opts[Math.floor(Math.random() * Math.min(3, opts.length))].meal
  const days = plan.days.map((d, i) => (i !== dayIdx ? d : { ...d, slots: { ...d.slots, [slot]: { mealId: choice.id, scale: scaleFor(choice, budget) } } }))
  return { ...plan, days }
}

export function groceryList(plan) {
  const map = {}
  for (const d of plan.days) {
    for (const s of Object.values(d.slots)) {
      for (const it of MEAL_BY_ID[s.mealId].items) {
        const f = FOOD_BY_ID[it.foodId]
        map[f.id] = map[f.id] || { food: f, servings: 0 }
        map[f.id].servings += it.servings * s.scale
      }
    }
  }
  const order = ['staple', 'main', 'side', 'breakfast', 'fruit', 'snack', 'drink', 'dessert', 'junk']
  return Object.values(map).sort((a, b) => order.indexOf(a.food.category) - order.indexOf(b.food.category))
}

export const SLOTS = [
  { id: 'breakfast', label: 'Breakfast', time: '8:30 AM' },
  { id: 'lunch', label: 'Lunch', time: '1:30 PM' },
  { id: 'snack', label: 'Snack', time: '5:00 PM' },
  { id: 'dinner', label: 'Dinner', time: '8:30 PM' },
]

export function slotForNow(d = new Date()) {
  const h = d.getHours()
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  if (h < 19) return 'snack'
  return 'dinner'
}
