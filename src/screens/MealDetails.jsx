import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, MessageCircle, Clock, Leaf, ArrowRight, ArrowUp, Sparkles } from 'lucide-react'
import { useApp, useNutrition, useToast, todayKey } from '../store/AppStore'
import { Segmented, Stepper, FoodImg, IBar, mainFoodId, foodPhoto } from '../components/ui'
import { FOOD_BY_ID } from '../data/foods'
import { MEAL_BY_ID } from '../data/meals'
import { sumItems, pct, fmt, fmtNutrient, NUTRIENTS, statusHex, fitsDiet } from '../engine/nutrition'
import { smartSwap, slotForNow, SLOTS, hashStr } from '../engine/recommend'
import { mealToEntries } from '../data/history'
import { api } from '../services/api'

const PORTIONS = [
  { id: 'Small', f: 0.75 },
  { id: 'Medium', f: 1 },
  { id: 'Large', f: 1.35 },
]
const DIET_LABEL = { vegan: 'Vegan', veg: 'Vegetarian', egg: 'Contains egg', nonveg: 'Non-veg' }

export default function MealDetailsRoute({ source }) {
  const p = useParams()
  const { state } = useApp()
  return <MealDetails key={`${source}-${p.mealId || p.foodId || state.lastDetection?.id}`} source={source} />
}

function MealDetails({ source }) {
  const nav = useNavigate()
  const params = useParams()
  const [sp] = useSearchParams()
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const N = useNutrition()

  const base = useMemo(() => {
    if (source === 'scan') {
      const d = state.lastDetection
      if (!d) return null
      return { name: d.name, items: d.items.map((i) => ({ foodId: i.foodId, servings: i.servings })), match: Math.round(d.conf * 100), photo: d.photo, src: 'scan' }
    }
    if (source === 'meal') {
      const m = MEAL_BY_ID[params.mealId]
      if (!m) return null
      return { name: m.name, items: m.items.map((i) => ({ ...i })), src: 'manual', prep: m.prepMin, diet: m.diet }
    }
    const f = FOOD_BY_ID[params.foodId]
    if (!f) return null
    return { name: f.name, items: [{ foodId: f.id, servings: 1 }], src: 'manual', diet: f.diet, serving: `${f.serving} · ~${f.grams} g` }
  }, [source, params.mealId, params.foodId, state.lastDetection])

  const [items, setItems] = useState(base?.items || [])
  const [portion, setPortion] = useState('Medium')
  const [slot, setSlot] = useState(sp.get('slot') || slotForNow())
  const [showAll, setShowAll] = useState(false)

  if (!base) {
    return (
      <div className="screen no-nav">
        <div className="empty">
          Nothing to show yet.
          <button className="btn btn-primary sm" onClick={() => nav('/scan')}>
            Scan a meal
          </button>
        </div>
      </div>
    )
  }

  const factor = PORTIONS.find((p) => p.id === portion).f
  const scaled = items.map((i) => ({ ...i, servings: i.servings * factor }))
  const t = sumItems(scaled)
  const swap = smartSwap(items, hashStr(base.name))
  const swapFood = FOOD_BY_ID[swap.to]
  const date = sp.get('date') || todayKey()
  const fits = items.every((i) => fitsDiet(FOOD_BY_ID[i.foodId], state.profile))
  const micro = NUTRIENTS.filter((n) => n.key !== 'protein')
    .map((n) => ({ ...n, p: pct(t[n.key], N.targets[n.key]) }))
    .sort((a, b) => b.p - a.p)
  const microShown = showAll ? micro : micro.slice(0, 4)
  const [title, ...restParts] = base.name.split(/\s\+\s/)
  const subtitle = restParts.length ? `with ${restParts.join(' & ')}` : base.serving || (base.match ? 'Scanned plate' : 'Single serving')
  const slotLabel = SLOTS.find((s) => s.id === slot).label

  function add() {
    dispatch({ type: 'ADD_ENTRIES', date, entries: mealToEntries({ name: base.name, items: scaled }, slot, { source: base.src, name: base.name }) })
    api.track('logs', `+ ${base.name} · ${fmt(t.kcal)} kcal`)
    showToast(`Added to ${slotLabel}`)
    nav(date === todayKey() ? '/' : '/diary')
  }

  function addSwap() {
    if (items.some((i) => i.foodId === swapFood.id)) return
    setItems((cur) => [...cur, { foodId: swapFood.id, servings: 1 }])
    showToast(`${swapFood.name} added to plate`)
  }

  return (
    <div className="screen bleed no-nav" style={{ paddingBottom: 32 }}>
      <div className="hero-photo">
        <img src={base.photo || foodPhoto(mainFoodId(items))} alt={base.name} />
        <div className="scrim" />
        <div className="bar-top">
          <button className="icon-btn glass" aria-label="Back" onClick={() => nav(-1)}>
            <ArrowLeft size={20} />
          </button>
          <button className="icon-btn glass" aria-label="Add another food" onClick={() => nav(`/add?slot=${slot}`)}>
            <Plus size={20} />
          </button>
        </div>
        <div className="copy">
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{title}</div>
          <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.02em', opacity: 0.85, marginTop: 2 }}>{subtitle}</div>
          <div className="row" style={{ alignItems: 'flex-end', gap: 12, marginTop: 14 }}>
            <span className="hero-num" style={{ fontSize: 84 }}>{fmt(t.kcal)}</span>
            <span style={{ paddingBottom: 8, lineHeight: 1.1 }}>
              <span className="unit" style={{ display: 'block', fontSize: 14 }}>kcal</span>
              <span className="unit" style={{ display: 'block', opacity: 0.7 }}>calories</span>
            </span>
            <span className="grow" />
            {base.match ? (
              <span className="tag-lime" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '9px 12px', marginBottom: 6 }}>
                <span className="row" style={{ gap: 4, fontSize: 20 }}>
                  {base.match}% <ArrowUp size={16} />
                </span>
                <span className="unit" style={{ fontSize: 10 }}>match</span>
              </span>
            ) : (
              <span className="tag-lime" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '9px 12px', marginBottom: 6 }}>
                <span style={{ fontSize: 20 }} className="num">{pct(t.kcal, N.targets.kcal)}%</span>
                <span className="unit" style={{ fontSize: 10 }}>of day</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="col" style={{ padding: '18px 20px 0', gap: 16 }}>
        <div className="chips">
          {base.diet && (
            <span className="chip">
              <Leaf size={13} /> {DIET_LABEL[base.diet]}
            </span>
          )}
          {base.prep && (
            <span className="chip">
              <Clock size={13} /> {base.prep} min
            </span>
          )}
          {!fits && <span className="chip" style={{ background: 'var(--coral-soft)' }}>Doesn’t match your diet</span>}
          <span className="chip">Approximate estimate</span>
        </div>

        <Segmented options={PORTIONS.map((p) => p.id)} value={portion} onChange={setPortion} />

        <div className="card">
          <div className="grid-3" style={{ gap: 14 }}>
            {[
              ['Protein', t.protein, N.targets.protein, 'var(--orange)', 'var(--orange-soft)'],
              ['Carbs', t.carbs, N.targets.carbs, 'var(--cyan)', 'var(--cyan-soft)'],
              ['Fat', t.fat, N.targets.fat, 'var(--leaf)', 'var(--lime-soft)'],
            ].map(([l, v, tg, c, s]) => (
              <div key={l}>
                <div className="small semibold">{l}</div>
                <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 4 }}>
                  {fmt(v)}
                  <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>g</span>
                </div>
                <IBar pct={(v / tg) * 100} color={c} soft={s} />
                <div className="tiny muted semibold num">{pct(v, tg)}% of day</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span className="t">Micronutrients</span>
            <span className="tiny muted semibold">% of your daily need</span>
          </div>
          <div className="col" style={{ gap: 14 }}>
            {microShown.map((n) => (
              <div key={n.key} className="row" style={{ gap: 12 }}>
                <span className="small semibold" style={{ width: 78 }}>{n.label}</span>
                <div className="grow ibar" style={{ background: 'var(--hatch)', height: 10, borderRadius: 5, margin: 0 }}>
                  <div style={{ width: `${Math.min(100, n.p)}%`, background: statusHex(Math.min(100, n.p * 2.5)), borderRadius: 5 }} />
                </div>
                <span className="small bold num" style={{ width: 74, textAlign: 'right' }}>
                  {fmtNutrient(n.key, t[n.key])} {n.unit}
                </span>
              </div>
            ))}
          </div>
          <button className="link" style={{ marginTop: 14 }} onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show less' : `Show all ${micro.length}`}
          </button>
        </div>

        <div className="card-lime row" style={{ gap: 14, alignItems: 'center' }}>
          {swapFood && <FoodImg id={swapFood.id} size={56} round alt="" />}
          <div className="grow small" style={{ lineHeight: 1.45 }}>
            <div className="row bold" style={{ gap: 6, marginBottom: 2 }}>
              <Sparkles size={14} /> Smart swap
            </div>
            {swap.text}
          </div>
          {swapFood && !items.some((i) => i.foodId === swapFood.id) && (
            <button className="icon-btn sm dark" aria-label={`Add ${swapFood.name}`} onClick={addSwap}>
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <span className="t">On the plate</span>
            <span className="tiny muted semibold">{items.length} items</span>
          </div>
          <div className="list">
            {items.map((it, i) => {
              const f = FOOD_BY_ID[it.foodId]
              return (
                <div key={it.foodId + i} className="list-row">
                  <FoodImg id={f.id} size={48} alt="" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small bold ellipsis">{f.name}</div>
                    <div className="tiny muted num">
                      {Math.round(f.grams * it.servings * factor)} g · {fmt(f.n.kcal * it.servings * factor)} kcal
                    </div>
                  </div>
                  <Stepper value={it.servings} step={0.25} min={0.25} max={4} label={f.name} format={(v) => `×${v}`} onChange={(v) => setItems((cur) => cur.map((x, j) => (j === i ? { ...x, servings: v } : x)))} />
                  {items.length > 1 && (
                    <button className="icon-btn sm ghost" aria-label={`Remove ${f.name}`} onClick={() => setItems((cur) => cur.filter((_, j) => j !== i))}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="chips">
          {SLOTS.map((s) => (
            <button key={s.id} className={`chip ${slot === s.id ? 'dark' : ''}`} onClick={() => setSlot(s.id)} aria-pressed={slot === s.id}>
              {s.label}
            </button>
          ))}
          <button className="chip line" onClick={() => nav('/coach', { state: { ask: `Is ${base.name} good for me?` } })}>
            <MessageCircle size={13} /> Ask coach
          </button>
        </div>

        <button className="btn btn-primary block" onClick={add} style={{ justifyContent: 'space-between', paddingLeft: 26 }}>
          Add to {slotLabel}
          <span className="go">
            <ArrowRight size={18} />
          </span>
        </button>
        <div className="disclaimer">Values are approximate (IFCT 2017 / USDA). Not a medical assessment.</div>
      </div>
    </div>
  )
}
