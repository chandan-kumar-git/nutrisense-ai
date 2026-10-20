import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { computeTargets, sumEntries, averageTotals, gapAnalysis, dailyScore } from '../engine/nutrition'
import { seedHistory, seedWater, seedWeights, dateKey, addDays } from '../data/history'

const STORAGE_KEY = 'nutrisense.v1'

const initial = {
  onboarded: false,
  profile: null,
  consent: null,
  logs: {},
  water: {},
  weights: [],
  plan: null,
  chat: [],
  scanCount: 0,
  lastDetection: null,
  readNotifs: [],
  settings: { reminders: true, hinglish: true, units: 'metric', shareAnalytics: false },
  createdAt: null,
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initial
    return { ...initial, ...JSON.parse(raw) }
  } catch {
    return initial
  }
}

function reducer(state, a) {
  switch (a.type) {
    case 'ONBOARD': {
      const p = a.profile
      return {
        ...initial,
        onboarded: true,
        profile: p,
        consent: a.consent,
        logs: a.demo ? seedHistory(p) : {},
        water: a.demo ? seedWater() : {},
        weights: a.demo ? seedWeights(p) : [{ date: dateKey(new Date()), kg: p.weightKg }],
        createdAt: Date.now(),
        settings: state.settings,
      }
    }
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...a.patch }, plan: a.keepPlan ? state.plan : null }
    case 'ADD_ENTRIES': {
      const cur = state.logs[a.date] || []
      return { ...state, logs: { ...state.logs, [a.date]: [...cur, ...a.entries] } }
    }
    case 'REMOVE_ENTRY':
      return { ...state, logs: { ...state.logs, [a.date]: (state.logs[a.date] || []).filter((e) => e.id !== a.id) } }
    case 'REMOVE_GROUP':
      return { ...state, logs: { ...state.logs, [a.date]: (state.logs[a.date] || []).filter((e) => e.groupId !== a.groupId) } }
    case 'UPDATE_ENTRY':
      return { ...state, logs: { ...state.logs, [a.date]: (state.logs[a.date] || []).map((e) => (e.id === a.id ? { ...e, ...a.patch } : e)) } }
    case 'SET_WATER':
      return { ...state, water: { ...state.water, [a.date]: Math.max(0, Math.min(20, a.value)) } }
    case 'ADD_WEIGHT': {
      const rest = state.weights.filter((w) => w.date !== a.date)
      return { ...state, weights: [...rest, { date: a.date, kg: a.kg }].sort((x, y) => x.date.localeCompare(y.date)), profile: { ...state.profile, weightKg: a.kg } }
    }
    case 'SET_PLAN':
      return { ...state, plan: a.plan }
    case 'CHAT_PUSH':
      return { ...state, chat: [...state.chat, a.msg].slice(-60) }
    case 'CHAT_CLEAR':
      return { ...state, chat: [] }
    case 'SCAN_DONE':
      return { ...state, scanCount: state.scanCount + 1, lastDetection: a.detection }
    case 'SET_DETECTION':
      return { ...state, lastDetection: a.detection }
    case 'READ_NOTIFS':
      return { ...state, readNotifs: [...new Set([...state.readNotifs, ...a.ids])] }
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...a.patch } }
    case 'CONSENT':
      return { ...state, consent: { ...state.consent, ...a.patch } }
    case 'IMPORT':
      return { ...initial, ...a.data }
    case 'RESET':
      return { ...initial }
    default:
      return state
  }
}

const Ctx = createContext(null)
const ToastCtx = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()))
  const [toast, setToast] = useState(null)
  const timer = useRef()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable: app still works in memory */
    }
  }, [state])

  const showToast = useCallback((text, icon = 'check') => {
    clearTimeout(timer.current)
    setToast({ text, icon, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), 2400)
  }, [])

  const value = useMemo(() => ({ state, dispatch, selectedDate, setSelectedDate }), [state, selectedDate])
  const toastValue = useMemo(() => ({ toast, showToast }), [toast, showToast])
  return (
    <Ctx.Provider value={value}>
      <ToastCtx.Provider value={toastValue}>{children}</ToastCtx.Provider>
    </Ctx.Provider>
  )
}

export function useApp() {
  return useContext(Ctx)
}

export function useToast() {
  return useContext(ToastCtx)
}

export function todayKey() {
  return dateKey(new Date())
}

// Derived nutrition state for any date (defaults to today).
export function useNutrition(date) {
  const { state } = useApp()
  const key = date || todayKey()
  return useMemo(() => {
    if (!state.profile) return null
    const targets = computeTargets(state.profile)
    const entries = state.logs[key] || []
    const totals = sumEntries(entries)
    const week = []
    const pastScores = []
    for (let i = 6; i >= 0; i--) {
      const k = dateKey(addDays(new Date(`${key}T00:00:00`), -i))
      if (state.logs[k]?.length) {
        week.push(state.logs[k])
        if (i > 0) pastScores.push(dailyScore(sumEntries(state.logs[k]), targets))
      }
    }
    const avg = averageTotals(week.length ? week : [entries])
    const gaps = gapAnalysis(avg, targets)
    const gapMap = Object.fromEntries(gaps.map((g) => [g.key, g.pct]))
    const gapStatus = Object.fromEntries(gaps.map((g) => [g.key, g.status.id]))
    return {
      key,
      targets,
      entries,
      totals,
      avg,
      gaps,
      gapMap,
      gapStatus,
      score: dailyScore(totals, targets),
      weekScore: pastScores.length ? Math.round(pastScores.reduce((a, b) => a + b, 0) / pastScores.length) : dailyScore(totals, targets),
      remaining: Math.round(targets.kcal - totals.kcal),
      water: state.water[key] || 0,
      daysLogged: week.length,
    }
  }, [state.profile, state.logs, state.water, key])
}
