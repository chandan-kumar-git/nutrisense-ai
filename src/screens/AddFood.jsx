import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, ScanLine, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useApp, useNutrition, useToast, todayKey } from '../store/AppStore'
import { TopBar, FoodImg } from '../components/ui'
import { CATEGORIES, FOOD_BY_ID } from '../data/foods'
import { MEALS } from '../data/meals'
import { api } from '../services/api'
import { fmt, fitsDiet, NUTRIENTS, fmtNutrient, lc } from '../engine/nutrition'
import { SLOTS, slotForNow, recommendMeals, mealTotals } from '../engine/recommend'
import { mealToEntries } from '../data/history'

const SORTS = [{ key: 'relevance', label: 'Relevance' }, ...NUTRIENTS.slice(0, 6).map((n) => ({ key: n.key, label: `High ${lc(n.label)}` })), { key: 'lowcal', label: 'Low calorie' }]

export default function AddFood() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const N = useNutrition()
  const slot = sp.get('slot') || slotForNow()
  const date = sp.get('date') || todayKey()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [onlyFit, setOnlyFit] = useState(true)
  const [sort, setSort] = useState('relevance')
  const [tab, setTab] = useState('foods')

  const results = useMemo(() => {
    const r = api.searchFoods(q, { category: cat, profile: state.profile, onlyFit })
    if (sort === 'lowcal') return [...r].sort((a, b) => a.n.kcal - b.n.kcal)
    if (sort !== 'relevance') return [...r].sort((a, b) => b.n[sort] / Math.max(40, b.n.kcal) - a.n[sort] / Math.max(40, a.n.kcal))
    return r
  }, [q, cat, onlyFit, sort, state.profile])

  const recent = useMemo(() => {
    const seen = new Map()
    Object.keys(state.logs)
      .sort()
      .reverse()
      .forEach((k) => state.logs[k].forEach((e) => !seen.has(e.foodId) && seen.size < 8 && seen.set(e.foodId, FOOD_BY_ID[e.foodId])))
    return [...seen.values()].filter(Boolean)
  }, [state.logs])

  const suggested = useMemo(() => {
    const type = slot === 'breakfast' ? 'breakfast' : slot === 'snack' ? 'snack' : 'main'
    return recommendMeals(state.profile, N.targets, N.gaps, { type, limit: 4, kcalBudget: Math.max(300, N.remaining * 0.7), seed: 7 })
  }, [slot, state.profile, N.targets, N.gaps, N.remaining])

  const meals = useMemo(() => MEALS.filter((m) => fitsDiet(m, state.profile) && (!q || m.name.toLowerCase().includes(q.toLowerCase()))), [q, state.profile])

  function quickAdd(food) {
    dispatch({ type: 'ADD_ENTRIES', date, entries: mealToEntries({ name: food.name, items: [{ foodId: food.id, servings: 1 }] }, slot, { name: food.name }) })
    api.track('logs', `+ ${food.name}`)
    showToast(`${food.name} added to ${SLOTS.find((s) => s.id === slot).label}`)
  }

  const sortLabel = SORTS.find((s) => s.key === sort)

  return (
    <div className="screen no-nav">
      <TopBar
        title={`Add to ${SLOTS.find((s) => s.id === slot).label}`}
        right={
          <button className="icon-btn" aria-label="Scan instead" onClick={() => nav('/scan')}>
            <ScanLine size={20} />
          </button>
        }
      />
      <div className="search">
        <Search size={18} />
        <input className="input" placeholder="Search 100+ foods: dal, paneer, dosa…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search foods" />
      </div>

      <div className="seg">
        <button className={tab === 'foods' ? 'on' : ''} onClick={() => setTab('foods')}>
          Foods
        </button>
        <button className={tab === 'meals' ? 'on' : ''} onClick={() => setTab('meals')}>
          Meals
        </button>
        <button className={tab === 'ai' ? 'on' : ''} onClick={() => setTab('ai')}>
          For you
        </button>
      </div>

      {tab === 'foods' && (
        <>
          <div className="chips scroll-x">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`chip ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="between">
            <button className={`chip ${onlyFit ? 'dark' : ''}`} onClick={() => setOnlyFit(!onlyFit)}>
              {onlyFit ? '✓ ' : ''}Fits my diet
            </button>
            <label className="chip" style={{ position: 'relative' }}>
              <SlidersHorizontal size={13} /> {sortLabel.label}
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}>
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!q && cat === 'all' && recent.length > 0 && (
            <div>
              <div className="small bold" style={{ marginBottom: 8 }}>
                Recent
              </div>
              <div className="chips scroll-x">
                {recent.map((f) => (
                  <button key={f.id} className="chip" onClick={() => quickAdd(f)}>
                    <Plus size={12} /> {f.name.replace(/\s*\(.*\)/, '')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '4px 16px' }}>
            <div className="list">
              {results.length === 0 && <div className="empty">No foods match. Try another word or turn off “Fits my diet”.</div>}
              {results.map((f) => (
                <div key={f.id} className="list-row">
                  <button style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, background: 'none', border: 0, textAlign: 'left', padding: 0, minWidth: 0 }} onClick={() => nav(`/food/${f.id}?slot=${slot}&date=${date}`)}>
                    <FoodImg id={f.id} size={52} alt="" />
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="small bold ellipsis" style={{ display: 'block' }}>
                        {f.name}
                      </span>
                      <span className="tiny muted">
                        {f.serving} · {fmt(f.n.kcal)} kcal
                        {sort !== 'relevance' && sort !== 'lowcal' && ` · ${fmtNutrient(sort, f.n[sort])}${NUTRIENTS.find((n) => n.key === sort).unit} ${lc(NUTRIENTS.find((n) => n.key === sort).label)}`}
                        {(sort === 'relevance' || sort === 'lowcal') && ` · ${fmt(f.n.protein, 1)}g protein`}
                      </span>
                    </span>
                  </button>
                  <button className="icon-btn sm dark" aria-label={`Add ${f.name}`} onClick={() => quickAdd(f)}>
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'meals' && (
        <div className="col">
          {meals.map((m) => {
            const t = mealTotals(m)
            return (
              <button key={m.id} className="card sm row pressable" style={{ border: 0, textAlign: 'left' }} onClick={() => nav(`/meal/${m.id}?slot=${slot}&date=${date}`)}>
                <FoodImg items={m.items} size={56} alt="" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="small bold ellipsis">{m.name}</div>
                  <div className="tiny muted">
                    {fmt(t.kcal)} kcal · {fmt(t.protein)}g protein · {m.prepMin} min
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {tab === 'ai' && (
        <div className="col">
          <div className="card-lime row" style={{ gap: 10, lineHeight: 1.45 }}>
            <Sparkles size={18} />
            <div className="small">
              Ranked for your gaps (<b>{N.gaps.slice(0, 2).map((g) => g.label).join(', ')}</b>) and {fmt(N.remaining)} kcal left.
            </div>
          </div>
          {suggested.map(({ meal, totals }) => (
            <button key={meal.id} className="card sm row pressable" style={{ border: 0, textAlign: 'left' }} onClick={() => nav(`/meal/${meal.id}?slot=${slot}&date=${date}`)}>
              <FoodImg items={meal.items} size={56} alt="" />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="small bold ellipsis">{meal.name}</div>
                <div className="tiny muted">
                  {fmt(totals.kcal)} kcal · {fmt(totals.protein)}g protein
                </div>
              </div>
              <span className="badge" style={{ background: 'var(--lime)' }}>
                +{Math.round((totals[N.gaps[0].key] / N.targets[N.gaps[0].key]) * 100)}% {lc(N.gaps[0].label)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
