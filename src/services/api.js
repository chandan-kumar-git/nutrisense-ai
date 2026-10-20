// Mock backend. Every function is async and mirrors the REST endpoint it would call
// in production (FastAPI service, see README). Data comes from the in-app knowledge base,
// so the app runs fully offline; swap these bodies for fetch() calls to go live.
import { PIPELINE, pickScenario, buildDetection, lookupBarcode, readLabel, analyzeImage, pickByColor, looksEmpty } from '../engine/detector'
import { SCAN_SCENARIOS } from '../data/meals'
import { coachReply } from '../engine/brain'
import { generatePlan } from '../engine/recommend'
import { FOODS } from '../data/foods'
import { fitsDiet } from '../engine/nutrition'

const listeners = new Set()
const log = []

export function onApiLog(fn) {
  listeners.add(fn)
  fn([...log])
  return () => listeners.delete(fn)
}

function record(method, path, status, ms, note) {
  log.unshift({ id: Math.random().toString(36).slice(2), method, path, status, ms, note, at: new Date() })
  if (log.length > 12) log.pop()
  listeners.forEach((fn) => fn([...log]))
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function call(method, path, fn, { min = 250, max = 650, note } = {}) {
  const t0 = performance.now()
  await wait(min + Math.random() * (max - min))
  const out = await fn()
  record(method, path, 200, Math.round(performance.now() - t0), typeof note === 'function' ? note(out) : note)
  return out
}

export const api = {
  PIPELINE,

  async detectFood({ scanIndex, fileName, image, force, profile, onStage }) {
    const t0 = performance.now()
    const statsP = image ? analyzeImage(image) : Promise.resolve(null)
    for (let i = 0; i < PIPELINE.length; i++) {
      onStage?.(i)
      await wait(PIPELINE[i].ms)
      if (i === 1 && !force && looksEmpty(await statsP)) {
        record('POST', '/api/v1/vision/detect', 200, Math.round(performance.now() - t0), 'no food region found')
        return { noFood: true }
      }
    }
    const stats = await statsP
    const named = fileName && SCAN_SCENARIOS.find((s) => s.keys.some((k) => fileName.toLowerCase().includes(k)))
    const scenario = named || (stats ? pickByColor(stats, scanIndex, profile) : pickScenario({ scanIndex, fileName, profile }))
    const det = buildDetection(scenario, scanIndex)
    record('POST', '/api/v1/vision/detect', 200, Math.round(performance.now() - t0), `${det.name} · ${(det.conf * 100).toFixed(0)}%`)
    return det
  },

  scanBarcode(index) {
    return call('GET', `/api/v1/products/barcode`, () => lookupBarcode(index), { min: 700, max: 1200, note: (p) => p.code })
  },

  readLabel(index) {
    return call('POST', '/api/v1/vision/ocr-label', () => readLabel(index), { min: 1200, max: 1800, note: (l) => l.name })
  },

  askCoach(message, ctx) {
    return call('POST', '/api/v1/coach/chat', () => coachReply(message, ctx), { min: 600, max: 1300, note: (r) => `intent=${r.intent}` })
  },

  generatePlan(profile, targets, gaps, seed) {
    return call('POST', '/api/v1/recommend/plan', () => generatePlan(profile, targets, gaps, seed), { min: 900, max: 1500, note: '7 days' })
  },

  searchFoods(q, { category = 'all', profile, onlyFit = false } = {}) {
    const s = q.trim().toLowerCase()
    const res = FOODS.filter((f) => (category === 'all' || f.category === category) && (!s || f.name.toLowerCase().includes(s) || f.tags.some((t) => t.includes(s))) && (!onlyFit || fitsDiet(f, profile)))
    if (s) record('GET', `/api/v1/foods?q=${encodeURIComponent(s)}`, 200, Math.round(20 + Math.random() * 40), `${res.length} results`)
    return res
  },

  track(event, note) {
    record('POST', `/api/v1/${event}`, 201, Math.round(40 + Math.random() * 90), note)
  },
}
