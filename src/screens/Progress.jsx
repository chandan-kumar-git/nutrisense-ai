import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Plus, TrendingUp, TrendingDown, MoreHorizontal, ArrowUpRight } from 'lucide-react'
import { useApp, useNutrition, useToast, todayKey } from '../store/AppStore'
import { Segmented, GBar, Sheet, Stepper, ArrowBtn } from '../components/ui'
import { computeTargets, sumEntries, dailyScore, fmt, pct } from '../engine/nutrition'
import { dateKey, addDays, syntheticSeries } from '../data/history'
import { SLOTS } from '../engine/recommend'
import { api } from '../services/api'

const W = 310

export default function Progress() {
  const nav = useNavigate()
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const N = useNutrition()
  const [period, setPeriod] = useState('Week')
  const [range, setRange] = useState('30 Days')
  const [sel, setSel] = useState(null)
  const [weighOpen, setWeighOpen] = useState(false)
  const [kg, setKg] = useState(state.profile.weightKg)
  const targets = useMemo(() => computeTargets(state.profile), [state.profile])

  const dayStats = useMemo(() => {
    const out = {}
    for (const [k, e] of Object.entries(state.logs)) {
      if (!e.length) continue
      const t = sumEntries(e)
      out[k] = { t, score: dailyScore(t, targets) }
    }
    return out
  }, [state.logs, targets])

  const series = useMemo(() => {
    const today = new Date()
    if (period === 'Day') {
      return SLOTS.map((s) => {
        const t = sumEntries(N.entries.filter((e) => e.slot === s.id))
        return { label: s.label.slice(0, 5), kcal: t.kcal, target: targets.kcal * { breakfast: 0.25, lunch: 0.35, snack: 0.1, dinner: 0.3 }[s.id] }
      })
    }
    if (period === 'Week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = addDays(today, i - 6)
        const r = dayStats[dateKey(d)]
        return { label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], kcal: r?.t.kcal || 0, score: r?.score ?? null, target: targets.kcal, partial: i === 6 }
      })
    }
    if (period === 'Month') {
      const syn = syntheticSeries(targets, 4, 31)
      return Array.from({ length: 4 }, (_, i) => {
        const vals = []
        for (let d = 0; d < 7; d++) {
          const r = dayStats[dateKey(addDays(today, -(3 - i) * 7 - d))]
          if (r) vals.push(r)
        }
        const kcal = vals.length ? vals.reduce((a, v) => a + v.t.kcal, 0) / vals.length : syn[i].kcal
        const score = vals.length ? vals.reduce((a, v) => a + v.score, 0) / vals.length : syn[i].score
        return { label: `Wk ${i + 1}`, kcal, score: Math.round(score), target: targets.kcal }
      })
    }
    const syn = syntheticSeries(targets, 6, 12)
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1)
      return { label: d.toLocaleDateString(undefined, { month: 'short' }), kcal: syn[i].kcal, score: syn[i].score, target: targets.kcal }
    })
  }, [period, dayStats, targets, N.entries])

  const lastFull = period === 'Week' ? 5 : series.length - 1
  const active = sel ?? lastFull
  const a = series[active]
  const complete = series.filter((s) => s.score != null && s.kcal > 0 && !s.partial)
  const avgScore = complete.length ? Math.round(complete.reduce((x, s) => x + s.score, 0) / complete.length) : N.score
  const prevAvg = useMemo(() => {
    const vals = []
    for (let i = 7; i < 14; i++) {
      const r = dayStats[dateKey(addDays(new Date(), -i))]
      if (r) vals.push(r.score)
    }
    return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : avgScore - 4
  }, [dayStats, avgScore])
  const delta = Math.round(((avgScore - prevAvg) / Math.max(1, prevAvg)) * 100)
  const maxK = Math.max(targets.kcal * 1.25, ...series.map((s) => s.kcal))

  const trend = useMemo(() => {
    const n = range === '30 Days' ? 30 : range === '3 Months' ? 90 : 365
    const syn = syntheticSeries(targets, n, n)
    return Array.from({ length: n - 1 }, (_, i) => dayStats[dateKey(addDays(new Date(), i - n + 1))]?.score ?? syn[i].score)
  }, [range, dayStats, targets])

  const hits = useMemo(() => {
    const keys = Array.from({ length: 7 }, (_, i) => dateKey(addDays(new Date(), -i)))
    const count = (fn) => keys.filter((k) => dayStats[k] && fn(dayStats[k].t)).length
    return {
      protein: count((t) => t.protein >= targets.protein * 0.9),
      iron: count((t) => t.iron >= targets.iron * 0.9),
      fiber: count((t) => t.fiber >= targets.fiber * 0.9),
      kcal: count((t) => Math.abs(t.kcal - targets.kcal) <= targets.kcal * 0.1),
      water: keys.filter((k) => (state.water[k] || 0) >= targets.water).length,
    }
  }, [dayStats, state.water, targets])

  const weights = state.weights.slice(-12)
  const wMin = Math.min(...weights.map((w) => w.kg)) - 0.6
  const wMax = Math.max(...weights.map((w) => w.kg)) + 0.6
  const wy = (v) => 74 - ((v - wMin) / (wMax - wMin)) * 64
  const wPath = weights.map((w, i) => `${i ? 'L' : 'M'}${(i / Math.max(1, weights.length - 1)) * W} ${wy(w.kg)}`).join(' ')
  const wDelta = weights.length > 1 ? weights[weights.length - 1].kg - weights[0].kg : 0

  return (
    <div className="screen stagger">
      <div className="top-bar">
        <span style={{ width: 44 }} />
        <div className="title-sm">Statistic</div>
        <button className="icon-btn" aria-label="Nutrient profile" onClick={() => nav('/nutrients')}>
          <MoreHorizontal size={20} />
        </button>
      </div>
      <Segmented options={['Day', 'Week', 'Month', 'Year']} value={period} onChange={(p) => { setPeriod(p); setSel(null) }} />

      <div className="card">
        <div className="between">
          <span className="row" style={{ gap: 6, alignItems: 'baseline' }}>
            <Flame size={20} style={{ alignSelf: 'center' }} />
            <span className="mid-num">{fmt(a.kcal)}</span>
            <span className="muted semibold">kcal</span>
          </span>
          <span className="small muted semibold">
            Target: <b style={{ color: 'var(--ink)' }} className="num">{fmt(a.target)}</b> kcal
          </span>
        </div>
        <div className="chart-bars" style={{ marginTop: 38 }} role="group" aria-label="Calories per period">
          {series.map((s, i) => {
            const h = Math.max(14, (s.kcal / maxK) * 100)
            const on = i === active
            const p = pct(s.kcal, s.target)
            return (
              <button key={i} className={`cbar ${on ? 'on' : ''} ${on && p > 108 ? 'over' : ''}`} onClick={() => setSel(i)} aria-label={`${s.label}: ${fmt(s.kcal)} kcal, ${p}% of target`} aria-pressed={on}>
                <span className="col-b">
                  <span className="fill" style={{ height: `${s.kcal > 0 ? h : 0}%` }}>{on && <span className="tooltip">{p}%</span>}</span>
                </span>
                <span className="lbl">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="h3">Nutrition score</div>
            <div className="small muted semibold">{delta >= 0 ? 'Higher' : 'Lower'} than last week</div>
          </div>
          <ArrowBtn label="Nutrient profile" onClick={() => nav('/nutrients')} />
        </div>
        <div className="row" style={{ alignItems: 'flex-end', gap: 14, marginTop: 8 }}>
          <div style={{ flex: 'none' }}>
            <span className="big-num" style={{ fontSize: 56 }}>{period === 'Day' ? N.score : avgScore}</span>
            <div className="small semibold" style={{ color: delta >= 0 ? 'var(--leaf-deep)' : 'var(--coral)' }}>
              {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {delta >= 0 ? '+' : ''}
              {delta}% vs last week
            </div>
          </div>
          <TrendLine values={trend} />
        </div>
        <div className="row" style={{ gap: 4, marginTop: 12 }}>
          {['30 Days', '3 Months', '1 Year'].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`chip ${range === r ? 'lime' : 'soft'}`} style={{ padding: '7px 12px', fontSize: 12 }} aria-pressed={range === r}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {[
          ['Protein goal', hits.protein, 'days hit', '/nutrients'],
          ['Iron goal', hits.iron, 'days hit', '/nutrients'],
          ['Calories on target', hits.kcal, '±10%', '/diary'],
          ['Water goal', hits.water, 'days hit', '/'],
        ].map(([l, v, u, to]) => (
          <button key={l} className="tile pressable" style={{ minHeight: 150 }} onClick={() => nav(to)}>
            <span className="tl" style={{ paddingRight: 40 }}>{l}</span>
            <span className="corner-btn arrow-btn" aria-hidden="true">
              <ArrowUpRight size={16} />
            </span>
            <span className="tv">
              {v}
              <span className="tu">/7 {u}</span>
            </span>
            <GBar pct={(v / 7) * 100} small />
          </button>
        ))}
      </div>

      <div className="card">
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="h3">Weight</div>
            <div className="small muted semibold">
              {wDelta > 0 ? '+' : ''}
              {wDelta.toFixed(1)} kg in {weights.length} weeks
            </div>
          </div>
          <span>
            <span className="big-num" style={{ fontSize: 44 }}>{state.profile.weightKg}</span>
            <span className="muted semibold"> kg</span>
          </span>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} 80`} style={{ marginTop: 12, overflow: 'visible' }} role="img" aria-label="Weight trend">
          <path d={wPath} fill="none" stroke="#121412" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {weights.map((w, i) => {
            const last = i === weights.length - 1
            return <circle key={w.date} cx={(i / Math.max(1, weights.length - 1)) * W} cy={wy(w.kg)} r={last ? 7 : 3} fill={last ? '#d7f26b' : '#121412'} stroke="#121412" strokeWidth={last ? 2.5 : 0} />
          })}
        </svg>
        <button className="btn btn-light sm block" style={{ marginTop: 14 }} onClick={() => setWeighOpen(true)}>
          <Plus size={16} /> Log today’s weight
        </button>
      </div>

      <Sheet open={weighOpen} onClose={() => setWeighOpen(false)} label="Log weight">
        <div className="h2">Log weight</div>
        <div className="range-num">{kg.toFixed(1)}</div>
        <div className="center">
          <Stepper value={kg} step={0.1} min={30} max={200} onChange={setKg} label="weight" format={() => 'kg'} />
        </div>
        <div className="small muted" style={{ textAlign: 'center' }}>Weigh in the morning before breakfast for consistent readings.</div>
        <button
          className="btn btn-primary block"
          onClick={() => {
            dispatch({ type: 'ADD_WEIGHT', date: todayKey(), kg: Math.round(kg * 10) / 10 })
            api.track('weights', `${kg.toFixed(1)} kg`)
            showToast('Weight saved · targets updated')
            setWeighOpen(false)
          }}
        >
          Save
        </button>
      </Sheet>
    </div>
  )
}

function TrendLine({ values }) {
  const w = 190
  const h = 70
  const buckets = 12
  const size = Math.max(1, Math.floor(values.length / buckets))
  const pts = []
  for (let i = 0; i < values.length; i += size) {
    const c = values.slice(i, i + size)
    pts.push(c.reduce((a, b) => a + b, 0) / c.length)
  }
  const min = Math.min(...pts) - 4
  const max = Math.max(...pts) + 4
  const xy = pts.map((v, i) => [(i / Math.max(1, pts.length - 1)) * w, h - ((v - min) / (max - min)) * h])
  let d = `M${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1]
    const [x1, y1] = xy[i]
    const cx = ((x0 + x1) / 2).toFixed(1)
    d += ` C${cx} ${y0.toFixed(1)} ${cx} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  const last = xy[xy.length - 1]
  return (
    <svg className="grow" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', height: 70 }} role="img" aria-label="Score trend line">
      <path d={d} fill="none" stroke="#f2645a" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="4.5" fill="#fff" stroke="#f2645a" strokeWidth="2.5" />
    </svg>
  )
}
