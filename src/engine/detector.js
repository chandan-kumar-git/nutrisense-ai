import { MEAL_BY_ID, SCAN_SCENARIOS, PACKAGED, LABELS } from '../data/meals'
import { FOOD_BY_ID } from '../data/foods'
import { rng, shuffle, hashStr } from './recommend'
import { fitsDiet } from './nutrition'

// Stages of the (simulated) on-device vision pipeline. Durations drive the UI animation.
export const PIPELINE = [
  { id: 'pre', label: 'Preprocessing', detail: 'Resize 224×224 · normalise · denoise', ms: 450 },
  { id: 'detect', label: 'Food detection', detail: 'Region proposals for each item on the plate', ms: 650 },
  { id: 'classify', label: 'Classification', detail: 'CNN, transfer-learned on Indian + Food-101 classes', ms: 700 },
  { id: 'portion', label: 'Portion estimation', detail: 'Plate-relative area → grams', ms: 500 },
  { id: 'lookup', label: 'Nutrient mapping', detail: 'IFCT 2017 + USDA knowledge base', ms: 400 },
]

// Positions (relative to the 230px plate stage) for item tags.
const TAG_SPOTS = [
  { left: 6, top: 26 },
  { left: 58, top: 34 },
  { left: 14, top: 68 },
  { left: 56, top: 70 },
  { left: 34, top: 8 },
]

// first scan always shows the reference plate (dal tadka + jeera rice), then a fixed shuffle
const ORDER = [0, ...shuffle(SCAN_SCENARIOS.map((_, i) => i).slice(1), rng(2026))]

export function pickScenario({ scanIndex = 0, fileName = '', profile }) {
  const name = fileName.toLowerCase()
  if (name) {
    const hit = SCAN_SCENARIOS.find((s) => s.keys.some((k) => name.includes(k)))
    if (hit) return hit
  }
  // walk a fixed shuffled order of diet-compatible plates so consecutive scans always differ
  const pool = ORDER.map((i) => SCAN_SCENARIOS[i]).filter((s) => !profile || fitsDiet(MEAL_BY_ID[s.mealId], profile))
  const list = pool.length ? pool : SCAN_SCENARIOS
  return list[scanIndex % list.length]
}

// Plates grouped by the dominant colour family of the dish, so a real photo
// lands on a plausible result (green → saag/palak, yellow → dal/poha, …).
const COLOR_BUCKETS = {
  green: ['m_palak_paneer', 'm_quinoa', 's_fruit', 'm_thali'],
  red: ['m_rajma', 'm_butter_chicken', 'j_pizza', 'j_pav_bhaji', 'm_tandoori', 'j_burger'],
  yellow: ['m_dal_roti', 'm_dal_rice', 'm_kadhi', 'b_poha', 'b_omelette', 'm_fish_curry', 'j_maggi', 'b_masala_dosa'],
  white: ['b_idli', 'j_momos', 'b_oats', 'm_thali', 'j_pani_puri'],
  brown: ['m_chole', 'm_chicken_biryani', 'b_aloo_paratha', 'j_samosa', 'j_chole_bhature', 'j_gulab', 'm_salmon'],
}

// Colour statistics of the centre of an image (the part inside the scan frame).
export function analyzeImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const n = 48
      const c = document.createElement('canvas')
      c.width = n
      c.height = n
      const s = Math.min(img.naturalWidth, img.naturalHeight) * 0.7
      c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, n, n)
      const d = c.getContext('2d').getImageData(0, 0, n, n).data
      const count = { green: 0, red: 0, yellow: 0, white: 0, brown: 0 }
      let sum = 0
      let grey = 0
      let sumSq = 0
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] / 255
        const g = d[i + 1] / 255
        const b = d[i + 2] / 255
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const l = (max + min) / 2
        const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
        let h = 0
        if (max !== min) {
          if (max === r) h = ((g - b) / (max - min)) % 6
          else if (max === g) h = (b - r) / (max - min) + 2
          else h = (r - g) / (max - min) + 4
          h *= 60
          if (h < 0) h += 360
        }
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        sum += lum
        sumSq += lum * lum
        if (l > 0.78 && sat < 0.35) count.white++
        else if (sat < 0.18 || l < 0.12) {
          grey++
          continue
        }
        else if (h >= 70 && h < 170) count.green++
        else if (h < 18 || h >= 330) count.red++
        else if (h >= 35 && h < 70 && l > 0.42) count.yellow++
        else if (l < 0.45) count.brown++
        else count.yellow++
      }
      const px = d.length / 4
      const mean = sum / px
      const std = Math.sqrt(Math.max(0, sumSq / px - mean * mean))
      const bucket = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0]
      const foodiness = 1 - (count.white * 0.5) / px
      resolve({ bucket, std, mean, foodiness, count, greyRatio: grey / px, whiteRatio: count.white / px })
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export function pickByColor(stats, scanIndex, profile) {
  const ids = COLOR_BUCKETS[stats.bucket] || COLOR_BUCKETS.yellow
  const pool = ids.map((id) => SCAN_SCENARIOS.find((s) => s.mealId === id)).filter((s) => s && (!profile || fitsDiet(MEAL_BY_ID[s.mealId], profile)))
  const list = pool.length ? pool : SCAN_SCENARIOS.filter((s) => !profile || fitsDiet(MEAL_BY_ID[s.mealId], profile))
  return list[scanIndex % list.length]
}

// A near-uniform, low-contrast frame (wall, desk, ceiling) is not a plate.
export function looksEmpty(stats) {
  return !!stats && (stats.mean < 22 || stats.std < 6 || (stats.std < 16 && stats.greyRatio + stats.whiteRatio > 0.7))
}

export function buildDetection(scenario, scanIndex = 0) {
  const meal = MEAL_BY_ID[scenario.mealId]
  const r = rng(hashStr(scenario.mealId) + scanIndex * 31)
  const jitter = [0.9, 1, 1, 1.1, 1.2][Math.floor(r() * 5)]
  const items = meal.items.map((it, i) => {
    const f = FOOD_BY_ID[it.foodId]
    const servings = Math.round(it.servings * jitter * 100) / 100
    return {
      foodId: it.foodId,
      servings,
      grams: Math.round(f.grams * servings),
      conf: Math.min(0.99, scenario.conf + (r() - 0.6) * 0.08),
      spot: TAG_SPOTS[i % TAG_SPOTS.length],
    }
  })
  const conf = Math.max(0.6, Math.min(0.99, scenario.conf + (r() - 0.5) * 0.04))
  return {
    id: `scan_${Date.now()}`,
    mealId: meal.id,
    name: meal.name,
    conf,
    alt: scenario.alt,
    items,
    colors: items.map((i) => FOOD_BY_ID[i.foodId].color),
    latencyMs: Math.round(180 + r() * 140),
  }
}

export function lookupBarcode(index) {
  return PACKAGED[index % PACKAGED.length]
}

export function readLabel(index) {
  return LABELS[index % LABELS.length]
}
