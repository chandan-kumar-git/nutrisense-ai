import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Check, ShoppingCart, Download, Sparkles, Loader2, Shuffle, Flame, Clock, ArrowRight } from 'lucide-react'
import { useApp, useNutrition, useToast } from '../store/AppStore'
import { Sheet, Checkbox, FoodImg, GBar } from '../components/ui'
import { MEAL_BY_ID } from '../data/meals'
import { api } from '../services/api'
import { planDayTotals, swapPlanMeal, groceryList, mealTotals, SLOTS } from '../engine/recommend'
import { fmt, pct, statusHex, NUTRIENT_BY_KEY, lc } from '../engine/nutrition'
import { mealToEntries } from '../data/history'

const COVER = ['protein', 'iron', 'calcium', 'fiber', 'b12', 'vitD']

export default function Plan() {
  const nav = useNavigate()
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const N = useNutrition()
  const [busy, setBusy] = useState(false)
  const [dayIdx, setDayIdx] = useState(0)
  const [groceries, setGroceries] = useState(false)
  const [got, setGot] = useState({})
  const plan = state.plan
  const gapsLow = N.gaps.filter((g) => g.pct < 80).slice(0, 3)

  async function generate() {
    setBusy(true)
    const p = await api.generatePlan(state.profile, N.targets, N.gaps, Date.now() % 100000)
    dispatch({ type: 'SET_PLAN', plan: p })
    setDayIdx(0)
    setBusy(false)
    showToast('New 7-day plan ready')
  }

  if (!plan) {
    return (
      <div className="screen">
        <div className="top-bar">
          <button className="icon-btn" aria-label="Back" onClick={() => nav(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div className="title-sm">Meal plan</div>
          <span style={{ width: 44 }} />
        </div>
        <div className="card-glow col" style={{ gap: 14 }}>
          <div className="row" style={{ marginBottom: 6 }}>
            {['idli', 'palak_paneer', 'rajma', 'sprouts', 'dal_tadka'].map((id, i) => (
              <FoodImg key={id} id={id} size={58} round alt="" style={{ marginLeft: i ? -14 : 0, border: '3px solid #fff', boxShadow: 'var(--shadow)' }} />
            ))}
          </div>
          <div>
            <span className="hero-num" style={{ fontSize: 96 }}>{fmt(N.targets.kcal)}</span>
            <div className="unit" style={{ marginTop: 6 }}>kcal per day · 7 days</div>
          </div>
          <div className="small" style={{ lineHeight: 1.5 }}>
            Built around your gaps: <b>{gapsLow.map((g) => lc(g.label)).join(', ') || 'overall balance'}</b>. Every meal is scored on how much of each gap it closes per calorie.
          </div>
          <button className="btn btn-primary block" onClick={generate} disabled={busy} style={{ justifyContent: 'space-between', paddingLeft: 26 }}>
            {busy ? (
              <>
                Optimising meals… <Loader2 size={18} className="spin" />
              </>
            ) : (
              <>
                Generate my plan
                <span className="go">
                  <ArrowRight size={18} />
                </span>
              </>
            )}
          </button>
        </div>
        <div className="card col small" style={{ gap: 10, lineHeight: 1.5 }}>
          <div className="h3">How the planner works</div>
          {['Splits calories 25% breakfast · 35% lunch · 10% snack · 30% dinner', 'Scores 90+ Indian meal combinations against your gaps', 'Filters by diet and allergies, avoids repeats within two days', 'Scales portions to each meal’s calorie budget'].map((t, i) => (
            <div key={t} className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <span className="badge" style={{ background: 'var(--lime)', minWidth: 22, justifyContent: 'center' }}>{i + 1}</span>
              <span className="muted">{t}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const day = plan.days[dayIdx]
  const totals = planDayTotals(day)
  const list = groceryList(plan)

  function logMeal(slot) {
    const s = day.slots[slot]
    const meal = MEAL_BY_ID[s.mealId]
    dispatch({ type: 'ADD_ENTRIES', date: day.date, entries: mealToEntries(meal, slot, { scale: s.scale, source: 'plan' }) })
    api.track('logs', `+ ${meal.name} (plan)`)
    showToast(`Logged ${meal.name}`)
  }

  function exportPlan() {
    const lines = [`NutriSense AI · 7-day meal plan for ${state.profile.name}`, `Target: ${N.targets.kcal} kcal/day · Protein ${N.targets.protein} g`, '']
    plan.days.forEach((d) => {
      lines.push(new Date(`${d.date}T00:00:00`).toDateString())
      SLOTS.forEach((s) => {
        const m = MEAL_BY_ID[d.slots[s.id].mealId]
        lines.push(`  ${s.label.padEnd(10)} ${m.name}${d.slots[s.id].scale !== 1 ? ` (×${d.slots[s.id].scale})` : ''} · ${fmt(mealTotals(m, d.slots[s.id].scale).kcal)} kcal`)
      })
      lines.push(`  Total: ${fmt(planDayTotals(d).kcal)} kcal`, '')
    })
    lines.push('General guidance, not a medical diagnosis.')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    a.download = 'nutrisense-meal-plan.txt'
    a.click()
    URL.revokeObjectURL(a.href)
    api.track('exports', 'meal plan .txt')
  }

  return (
    <div className="screen bleed">
      <div className="dark-head">
        <div className="top-bar">
          <button className="icon-btn" aria-label="Back" onClick={() => nav(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div className="title-sm">Meal Plan</div>
          <button className="icon-btn" aria-label="Regenerate plan" onClick={generate} disabled={busy}>
            <RefreshCw size={18} className={busy ? 'spin' : ''} />
          </button>
        </div>
        <div className="date-pills" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {plan.days.map((d, i) => {
            const dt = new Date(`${d.date}T00:00:00`)
            return (
              <button key={d.date} className={`date-pill ${i === dayIdx ? 'on' : ''}`} style={{ flex: '0 0 50px' }} onClick={() => setDayIdx(i)} aria-pressed={i === dayIdx}>
                <b>{dt.getDate()}</b>
                <span>{i === 0 ? 'Today' : dt.toLocaleDateString(undefined, { weekday: 'short' })}</span>
              </button>
            )
          })}
        </div>
        <div className="row" style={{ alignItems: 'flex-end', gap: 10 }}>
          <span className="hero-num" style={{ fontSize: 56, color: '#fff' }}>{fmt(totals.kcal)}</span>
          <span style={{ color: '#a3a8a0', fontWeight: 500, paddingBottom: 4 }}>kcal · {fmt(totals.protein)} g protein</span>
        </div>
      </div>

      <div className="col" style={{ padding: '18px 20px 0', gap: 14 }}>
        {SLOTS.map((s) => {
          const ps = day.slots[s.id]
          const meal = MEAL_BY_ID[ps.mealId]
          const t = mealTotals(meal, ps.scale)
          return (
            <div key={s.id} className="meal-card" style={{ height: 176 }}>
              <FoodImg items={meal.items} className="" alt={meal.name} />
              <span className="scrim" />
              <span className="top">
                <span className="glass-chip">
                  {s.label} · {s.time}
                </span>
                <span className="row" style={{ gap: 6 }}>
                  <button className="icon-btn sm glass" style={{ color: 'var(--ink)' }} aria-label={`Swap ${s.label}`} onClick={() => dispatch({ type: 'SET_PLAN', plan: swapPlanMeal(plan, dayIdx, s.id, state.profile, N.targets, N.gaps) })}>
                    <Shuffle size={14} />
                  </button>
                  <button className="icon-btn sm lime" aria-label={`Log ${s.label}`} onClick={() => logMeal(s.id)}>
                    <Check size={15} />
                  </button>
                </span>
              </span>
              <button className="body" style={{ background: 'none', border: 0, color: '#fff', textAlign: 'left', padding: 0 }} onClick={() => nav(`/meal/${meal.id}?slot=${s.id}&date=${day.date}`)}>
                <span className="h3" style={{ color: '#fff', fontSize: 19 }}>{meal.name}</span>
                <span className="row small" style={{ gap: 12, color: 'rgba(255,255,255,.85)' }}>
                  <span className="row" style={{ gap: 4 }}>
                    <Flame size={13} /> {fmt(t.kcal)} kcal
                  </span>
                  <span className="row" style={{ gap: 4 }}>
                    <Clock size={13} /> {meal.prepMin} min
                  </span>
                  {ps.scale !== 1 && <span>×{ps.scale} portion</span>}
                </span>
              </button>
            </div>
          )
        })}

        <div className="card">
          <div className="card-head">
            <span className="t">Day coverage</span>
            <span className="tiny muted semibold">vs your targets</span>
          </div>
          <div className="col" style={{ gap: 12 }}>
            {COVER.map((k) => {
              const p = pct(totals[k], N.targets[k])
              return (
                <div key={k} className="row" style={{ gap: 12 }}>
                  <span className="small semibold" style={{ width: 74 }}>{NUTRIENT_BY_KEY[k].label}</span>
                  <div className="grow ibar" style={{ background: 'var(--hatch)', height: 10, borderRadius: 5, margin: 0 }}>
                    <div style={{ width: `${Math.min(100, p)}%`, background: statusHex(p), borderRadius: 5 }} />
                  </div>
                  <span className="small bold num" style={{ width: 44, textAlign: 'right' }}>{p}%</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid-2">
          <button className="btn btn-light" onClick={() => setGroceries(true)}>
            <ShoppingCart size={17} /> Groceries
          </button>
          <button className="btn btn-light" onClick={exportPlan}>
            <Download size={17} /> Export
          </button>
        </div>
        <div className="card-lime row small" style={{ gap: 10, lineHeight: 1.45 }}>
          <Sparkles size={18} style={{ flex: 'none' }} />
          Tap ⇄ to swap a meal for another that targets the same gaps, or ✓ to log it.
        </div>
      </div>

      <Sheet open={groceries} onClose={() => setGroceries(false)} label="Grocery list">
        <div className="between">
          <div className="h2">Grocery list</div>
          <span className="small muted semibold num">
            {Object.values(got).filter(Boolean).length}/{list.length}
          </span>
        </div>
        <GBar pct={(Object.values(got).filter(Boolean).length / list.length) * 100} small />
        <div className="card" style={{ padding: '4px 16px' }}>
          <div className="list">
            {list.map(({ food, servings }) => (
              <button key={food.id} className="list-row" onClick={() => setGot((g) => ({ ...g, [food.id]: !g[food.id] }))}>
                <Checkbox on={!!got[food.id]} />
                <FoodImg id={food.id} size={36} round alt="" />
                <span className="grow small bold" style={{ textDecoration: got[food.id] ? 'line-through' : 'none', opacity: got[food.id] ? 0.45 : 1 }}>
                  {food.name}
                </span>
                <span className="tiny muted num">
                  {Math.round(servings * 10) / 10} × {food.serving}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  )
}
