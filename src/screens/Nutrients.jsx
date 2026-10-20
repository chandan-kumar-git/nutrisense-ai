import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, ChevronLeft, ChevronRight, ChevronDown, Plus, ArrowRight, Sun, Sparkles } from 'lucide-react'
import { useApp, useNutrition } from '../store/AppStore'
import { Segmented, StatusBadge, FoodImg } from '../components/ui'
import { gapAnalysis, statusHex, fmtNutrient, fmt, lc } from '../engine/nutrition'
import { topFoodsFor, recommendMeals, SLOTS } from '../engine/recommend'

const PRIORITY = ['iron', 'vitD', 'b12', 'protein', 'calcium', 'fiber']
const rank = (k) => PRIORITY.indexOf(k) + 1 || 99

const TIPS = {
  iron: 'Pair with vitamin C (lemon, guava, amla). Skip tea within an hour of meals.',
  vitD: '15–20 min of morning sunlight on arms and face is the best source.',
  b12: 'Dairy and eggs for vegetarians. Vegans usually need fortified foods; ask a doctor.',
  calcium: 'Ragi, curd, paneer, tofu and sesame. Vitamin D helps absorption.',
  protein: 'Put a protein source in every meal: dal, paneer, eggs, curd, chana.',
  fiber: 'Whole grains, dals, sprouts, fruit with skin. Drink more water as fiber rises.',
  vitC: 'Amla, guava and citrus, eaten raw where possible.',
  folate: 'Leafy greens, dals and sprouts.',
  zinc: 'Pumpkin seeds, chickpeas, dairy and whole grains.',
  magnesium: 'Nuts, seeds, leafy greens and whole grains.',
  omega3: 'Walnuts, chia and flax; fatty fish if you eat it.',
}

export default function Nutrients() {
  const nav = useNavigate()
  const { state } = useApp()
  const N = useNutrition()
  const [view, setView] = useState('7-day avg')
  const [idx, setIdx] = useState(0)
  const [open, setOpen] = useState(null)
  const [slot, setSlot] = useState('lunch')

  const gaps = useMemo(() => (view === 'Today' ? gapAnalysis(N.totals, N.targets) : N.gaps), [view, N.totals, N.targets, N.gaps])
  const ordered = useMemo(() => [...gaps].sort((a, b) => rank(a.key) - rank(b.key) || a.pct - b.pct), [gaps])
  const plan = ordered.filter((g) => g.pct < 80).slice(0, 4)
  const cur = ordered[((idx % ordered.length) + ordered.length) % ordered.length]
  const focus = plan.find((g) => g.key !== 'vitD') || ordered[0]

  const slotIdea = useMemo(() => {
    const type = slot === 'breakfast' ? 'breakfast' : slot === 'snack' ? 'snack' : 'main'
    return recommendMeals(state.profile, N.targets, N.gaps, { type, limit: 1, focus: focus.key, seed: slot.length * 13 })[0]
  }, [slot, state.profile, N.targets, N.gaps, focus.key])

  return (
    <div className="screen stagger">
      <div className="top-bar">
        <button className="icon-btn" aria-label="Back" onClick={() => nav(-1)}>
          <ChevronLeft size={22} />
        </button>
        <div className="title-sm">Nutrient profile</div>
        <button className="icon-btn" aria-label="How is this calculated?" onClick={() => nav('/how-it-works')}>
          <Info size={19} />
        </button>
      </div>
      <Segmented options={['Today', '7-day avg']} value={view} onChange={setView} />

      <div className="card-glow" style={{ textAlign: 'center', paddingTop: 26, paddingBottom: 26 }}>
        <div className="between">
          <button className="icon-btn sm ghost" aria-label="Previous nutrient" onClick={() => setIdx((i) => i - 1)}>
            <ChevronLeft size={18} />
          </button>
          <div key={cur.key} style={{ animation: 'rise .45s var(--ease)' }}>
            <div className="hero-num" style={{ fontSize: 108 }}>
              {Math.min(cur.pct, 999)}
              <span style={{ fontSize: 40, fontWeight: 300 }}>%</span>
            </div>
            <div className="unit" style={{ fontSize: 14, marginTop: 8 }}>{cur.label} · {view === 'Today' ? 'today' : 'this week'}</div>
            <div className="small muted semibold num" style={{ marginTop: 4 }}>
              {fmtNutrient(cur.key, cur.value)} of {fmtNutrient(cur.key, cur.target)} {cur.unit}
            </div>
          </div>
          <button className="icon-btn sm ghost" aria-label="Next nutrient" onClick={() => setIdx((i) => i + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <StatusBadge status={cur.status} long />
        </div>
        <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline sm" style={{ height: 50, borderRadius: 25 }} onClick={() => nav(`/food/${topFoodsFor(cur.key, state.profile, { limit: 1 })[0]?.id}`)}>
            <Plus size={16} /> Best food source
          </button>
          <button className="icon-btn dark" style={{ width: 50, height: 50, borderRadius: 25 }} aria-label={`Ask coach about ${cur.label}`} onClick={() => nav('/coach', { state: { ask: `How do I get more ${lc(cur.label)}?` } })}>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid-2">
        {ordered.map((g, i) => (
          <button key={g.key} className="tile pressable" style={{ gap: 10, padding: 14, outline: g.key === cur.key ? '2px solid var(--ink)' : 'none' }} onClick={() => setIdx(i)} aria-pressed={g.key === cur.key}>
            <span className="between">
              <span className="small bold">{g.label}</span>
              <span className="tiny bold" style={{ color: statusHex(g.pct) }}>{g.status.label}</span>
            </span>
            <span className="num" style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.04em' }}>{Math.min(g.pct, 999)}%</span>
            <span className="ibar" style={{ background: 'var(--hatch)', height: 8, margin: 0 }}>
              <span style={{ display: 'block', height: '100%', width: `${Math.min(100, g.pct)}%`, background: statusHex(g.pct), borderRadius: 4 }} />
            </span>
          </button>
        ))}
      </div>

      <div className="between" style={{ marginTop: 6 }}>
        <span className="h2">My action plan</span>
        <span className="tiny muted semibold">{plan.length} to fix</span>
      </div>
      {plan.length === 0 && <div className="card small">Everything is at least 80% of target. Keep your current mix of foods.</div>}
      {plan.map((g) => {
        const isOpen = open === g.key
        const foods = topFoodsFor(g.key, state.profile, { limit: 5 })
        return (
          <div key={g.key} className="card sm">
            <button className="between" style={{ width: '100%', background: 'none', border: 0, padding: 0 }} onClick={() => setOpen(isOpen ? null : g.key)} aria-expanded={isOpen}>
              <span className="row" style={{ gap: 10 }}>
                <span className="h3">{g.label}</span>
                <span className="small muted semibold num">{g.pct}%</span>
              </span>
              <span className="row" style={{ gap: 6 }}>
                <span className="badge" style={{ background: g.pct < 50 ? 'var(--coral-soft)' : '#fff0dc', color: g.pct < 50 ? '#9f2a21' : '#94530f' }}>{g.pct < 50 ? 'Fix first' : 'Watch'}</span>
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .3s var(--ease)' }} />
              </span>
            </button>
            <div className="chips scroll-x" style={{ marginTop: 12, marginLeft: -14, marginRight: -14, paddingLeft: 14, paddingRight: 14 }}>
              {foods.map((f) => (
                <button key={f.id} className="chip soft" style={{ paddingLeft: 5 }} onClick={() => nav(`/food/${f.id}`)}>
                  <FoodImg id={f.id} size={26} round alt="" />
                  {f.name.replace(/\s*\(.*\)/, '')}
                </button>
              ))}
            </div>
            {isOpen && (
              <div className="col" style={{ gap: 8, marginTop: 14, animation: 'rise .35s var(--ease)' }}>
                <div className="small" style={{ lineHeight: 1.5 }}>
                  <b>Why it matters.</b> {g.why}
                </div>
                <div className="kv">
                  <span>{view === 'Today' ? 'Today' : 'Your average'}</span>
                  <span>
                    {fmtNutrient(g.key, g.value)} {g.unit}
                  </span>
                </div>
                <div className="kv">
                  <span>Estimated need</span>
                  <span>
                    {fmtNutrient(g.key, g.target)} {g.unit}/day
                  </span>
                </div>
                <div className="row small" style={{ background: 'var(--lime-soft)', borderRadius: 14, padding: '10px 12px', gap: 8, lineHeight: 1.45 }}>
                  {g.key === 'vitD' ? <Sun size={15} style={{ flex: 'none' }} /> : <Sparkles size={15} style={{ flex: 'none' }} />} {TIPS[g.key]}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="h2" style={{ marginTop: 6 }}>Spread it across the day</div>
      <div className="chips">
        {SLOTS.map((s) => (
          <button key={s.id} className={`chip ${slot === s.id ? 'dark' : ''}`} style={{ boxShadow: slot === s.id ? 'none' : 'var(--shadow)' }} onClick={() => setSlot(s.id)} aria-pressed={slot === s.id}>
            {s.label}
          </button>
        ))}
      </div>
      {slotIdea && (
        <button className="meal-card pressable" onClick={() => nav(`/meal/${slotIdea.meal.id}?slot=${slot}`)}>
          <FoodImg items={slotIdea.meal.items} className="" alt={slotIdea.meal.name} />
          <span className="scrim" />
          <span className="top">
            <span className="glass-chip">For your {lc(focus.label)}</span>
            <span className="glass-chip num">{fmt(slotIdea.totals.kcal)} kcal</span>
          </span>
          <span className="body">
            <span className="h2" style={{ color: '#fff' }}>{slotIdea.meal.name}</span>
            <span>
              <span className="tag-lime">+{Math.round((slotIdea.totals[focus.key] / N.targets[focus.key]) * 100)}% {lc(focus.label)}</span>
            </span>
          </span>
        </button>
      )}

      <div className="disclaimer">General guidance, not a medical diagnosis. {N.daysLogged} logged day(s) · ICMR-NIN 2020 RDAs.</div>
    </div>
  )
}
