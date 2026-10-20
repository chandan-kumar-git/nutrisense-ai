import { MEAL_BY_ID } from './meals'
import { fitsDiet } from '../engine/nutrition'
import { rng } from '../engine/recommend'

// Typical "before the app" eating pattern used to seed a realistic history.
// Deliberately light on iron, vitamin D and B12, which is the common pattern
// in Indian vegetarian diets and gives the gap analysis something real to find.
const HABITS = {
  breakfast: ['b_poha', 'b_aloo_paratha', 'b_idli', 'b_upma', 'b_paneer_paratha', 'b_eggs', 'b_bhurji', 'b_thepla', 'b_masala_dosa', 'b_milk_oats'],
  lunch: ['m_dal_rice', 'm_rajma', 'm_kadhi', 'm_chole', 'm_thali', 'm_aloo_gobi', 'm_curd_rice', 'm_veg_biryani', 'm_chicken_curry', 'm_egg_curry', 'm_tofu'],
  snack: ['j_samosa', 's_bhel', 'j_vada_pav', 's_fruit', 's_makhana', 'j_maggi', 's_chikki', 's_dhokla', 's_milk', 's_yogurt'],
  dinner: ['m_pbm', 'm_aloo_gobi', 'm_bhindi', 'm_dal_rice', 'm_pulao', 'j_pizza', 'm_khichdi', 'm_butter_chicken', 'm_chicken_biryani', 'j_hakka', 'm_soya'],
}

const TIMES = { breakfast: '08:40', lunch: '13:35', snack: '17:10', dinner: '20:45' }

export function dateKey(d) {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

let uid = 0
export function newId(prefix = 'e') {
  uid += 1
  return `${prefix}_${Date.now().toString(36)}_${uid}_${Math.random().toString(36).slice(2, 6)}`
}

export function mealToEntries(meal, slot, { scale = 1, time, source = 'manual', name } = {}) {
  const groupId = newId('g')
  return meal.items.map((it) => ({
    id: newId(),
    foodId: it.foodId,
    servings: Math.round(it.servings * scale * 100) / 100,
    slot,
    time: time || new Date().toTimeString().slice(0, 5),
    source,
    groupId,
    groupName: name || meal.name,
  }))
}

export function seedHistory(profile, days = 13) {
  const r = rng(424242)
  const logs = {}
  const today = new Date()
  for (let d = days; d >= 1; d--) {
    const key = dateKey(addDays(today, -d))
    const entries = []
    for (const slot of ['breakfast', 'lunch', 'snack', 'dinner']) {
      if (slot === 'snack' && r() < 0.3) continue
      const options = HABITS[slot].map((id) => MEAL_BY_ID[id]).filter((m) => fitsDiet(m, profile))
      const meal = options.length ? options[Math.floor(r() * options.length)] : null
      if (!meal) continue
      const scale = [0.75, 1, 1, 1, 1.25][Math.floor(r() * 5)]
      entries.push(...mealToEntries(meal, slot, { scale, time: TIMES[slot], source: r() < 0.55 ? 'scan' : 'manual' }))
    }
    logs[key] = entries
  }
  // today: breakfast already logged so the dashboard has something to show
  const bOpts = HABITS.breakfast.map((id) => MEAL_BY_ID[id]).filter((m) => fitsDiet(m, profile))
  logs[dateKey(today)] = mealToEntries(bOpts[0], 'breakfast', { time: '08:30', source: 'scan' })
  return logs
}

export function seedWater(days = 13) {
  const r = rng(99)
  const out = {}
  const today = new Date()
  for (let d = days; d >= 1; d--) out[dateKey(addDays(today, -d))] = 4 + Math.floor(r() * 6)
  out[dateKey(today)] = 3
  return out
}

export function seedWeights(profile) {
  const r = rng(7)
  const out = []
  const today = new Date()
  const dir = profile.goal === 'lose' ? 1 : profile.goal === 'gain' ? -1 : 0
  for (let w = 11; w >= 0; w--) {
    const kg = profile.weightKg + dir * w * 0.35 + (r() - 0.5) * 0.6
    out.push({ date: dateKey(addDays(today, -w * 7)), kg: Math.round(kg * 10) / 10 })
  }
  out[out.length - 1].kg = profile.weightKg
  return out
}

// Long-range synthetic trend (for Month / Year views beyond the logged history).
export function syntheticSeries(targets, count, seed, { improve = true } = {}) {
  const r = rng(seed)
  const out = []
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1)
    const base = improve ? 58 + t * 18 : 70
    const score = Math.round(Math.max(35, Math.min(96, base + (r() - 0.5) * 18)))
    const kcal = Math.round(targets.kcal * (0.82 + r() * 0.36))
    out.push({ score, kcal, protein: Math.round(targets.protein * (0.6 + r() * 0.5)), iron: Math.round(35 + t * 25 + r() * 20) })
  }
  return out
}
