import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Plus, Minus, ArrowLeft, ArrowRight, MoreVertical, Droplet, Trophy, Sparkles, Coffee, Sun, Cookie, Moon, ChevronRight } from 'lucide-react'
import { useApp, useNutrition, todayKey, useToast } from '../store/AppStore'
import { GBar, IBar, FoodImg, ArrowBtn } from '../components/ui'
import { fmt, statusHex, status, lc } from '../engine/nutrition'
import { recommendMeals, slotForNow, SLOTS, hashStr } from '../engine/recommend'
import { focusGap } from '../engine/coach'
import { FOOD_BY_ID } from '../data/foods'
import { dateKey, addDays } from '../data/history'
import { buildNotifications } from './Notifications'

const SLOT_ICON = { breakfast: Coffee, lunch: Sun, snack: Cookie, dinner: Moon }
const SLOT_SHARE = { breakfast: 0.25, lunch: 0.35, snack: 0.1, dinner: 0.3 }
const ING = [
  ['var(--orange)', 'var(--orange-soft)'],
  ['var(--cyan)', 'var(--cyan-soft)'],
  ['var(--leaf)', 'var(--lime-soft)'],
]

export function greeting(d = new Date()) {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function streakOf(logs) {
  let s = 0
  let d = new Date()
  if (!logs[dateKey(d)]?.length) d = addDays(d, -1)
  while (logs[dateKey(d)]?.length) {
    s++
    d = addDays(d, -1)
  }
  return s
}

function foodKcal(e) {
  return (FOOD_BY_ID[e.foodId]?.n.kcal || 0) * e.servings
}

export default function Home() {
  const nav = useNavigate()
  const { state, dispatch, selectedDate, setSelectedDate } = useApp()
  const { showToast } = useToast()
  const N = useNutrition(selectedDate)
  const isToday = selectedDate === todayKey()
  const { profile } = state
  const [weekOffset, setWeekOffset] = useState(0)
  const unread = buildNotifications(state, N).filter((n) => !state.readNotifs.includes(n.id)).length

  const week = useMemo(() => {
    const now = new Date()
    const sunday = addDays(now, -now.getDay() + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(sunday, i)
      return { d, key: dateKey(d), label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], num: d.getDate(), future: dateKey(d) > todayKey() }
    })
  }, [weekOffset])
  const monthLabel = week[3].d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const slot = isToday ? slotForNow() : 'lunch'
  const slotMeta = SLOTS.find((s) => s.id === slot)
  const slotEntries = N.entries.filter((e) => e.slot === slot)
  const slotKcal = slotEntries.reduce((a, e) => a + foodKcal(e), 0)
  const slotTarget = Math.round(N.targets.kcal * SLOT_SHARE[slot])

  const topGap = focusGap(N.gaps, profile)
  const idea = useMemo(() => {
    const type = slot === 'breakfast' ? 'breakfast' : slot === 'snack' ? 'snack' : 'main'
    return recommendMeals(profile, N.targets, N.gaps, { type, limit: 1, focus: topGap.key, kcalBudget: Math.max(300, N.remaining * 0.7), seed: hashStr(selectedDate + slot) })[0]
  }, [profile, N.targets, N.gaps, N.remaining, topGap.key, slot, selectedDate])

  const keyNutrients = ['iron', 'vitD', 'b12', 'calcium'].map((k) => N.gaps.find((g) => g.key === k))
  const setWater = (v) => {
    dispatch({ type: 'SET_WATER', date: selectedDate, value: v })
    if (v === N.targets.water) showToast('Hydration goal reached')
  }
  const kcalPct = (N.totals.kcal / N.targets.kcal) * 100

  return (
    <div className="screen stagger">
      <div className="row" style={{ gap: 12 }}>
        <div className="grow">
          <div className="small muted semibold">{greeting()} 👋</div>
          <div className="h1 ellipsis" style={{ fontSize: 28 }}>
            {profile.name}
          </div>
        </div>
        <button className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => nav('/notifications')}>
          <Bell size={20} />
          {unread > 0 && <span className="dot" />}
        </button>
      </div>

      <div className="cal">
        <div className="cal-head">
          <span className="m">{monthLabel}</span>
          <div className="cal-nav">
            <button aria-label="Previous week" onClick={() => setWeekOffset((w) => w - 1)}>
              <ArrowLeft size={15} />
            </button>
            <button aria-label="Next week" disabled={weekOffset >= 0} style={{ opacity: weekOffset >= 0 ? 0.35 : 1 }} onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
        <div className="cal-days">
          {week.map((w) => (
            <span key={w.label} className="wd" style={w.key === selectedDate ? { color: 'var(--ink)', fontWeight: 800 } : undefined}>
              {w.label}
            </span>
          ))}
          {week.map((w) => (
            <button key={w.key} className={`cal-day ${w.key === selectedDate ? 'on' : ''} ${w.future ? 'future' : ''}`} disabled={w.future} onClick={() => setSelectedDate(w.key)} aria-label={w.d.toDateString()} aria-pressed={w.key === selectedDate}>
              {w.num}
              {state.logs[w.key]?.length > 0 && w.key !== selectedDate && <span className="tick" />}
            </button>
          ))}
        </div>
      </div>

      <div className="card pressable" onClick={() => nav('/diary')}>
        <div className="between">
          <span className="h3">{isToday ? 'Today' : new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' })}</span>
          <span className="icon-btn sm ghost" aria-hidden="true">
            <MoreVertical size={16} />
          </span>
        </div>
        <div className="row" style={{ alignItems: 'flex-end', gap: 8, margin: '8px 0 12px' }}>
          <span className="hero-num">{fmt(N.totals.kcal)}</span>
          <span className="muted" style={{ fontSize: 20, fontWeight: 500, paddingBottom: 6 }}>
            / {fmt(N.targets.kcal)} kcal
          </span>
        </div>
        <GBar pct={kcalPct} color={N.remaining < 0 ? 'linear-gradient(90deg,#ffd9c4,#ff8a4c)' : undefined} />
        <div className="between small" style={{ marginTop: 10 }}>
          <span className="muted semibold">{N.remaining >= 0 ? `${fmt(N.remaining)} kcal left` : `${fmt(-N.remaining)} kcal over`}</span>
          <span className="muted semibold num">Score {N.score}</span>
        </div>
        <div className="grid-3" style={{ marginTop: 14, gap: 14 }}>
          {[
            ['Protein', N.totals.protein, N.targets.protein, ING[0]],
            ['Carbs', N.totals.carbs, N.targets.carbs, ING[1]],
            ['Fat', N.totals.fat, N.targets.fat, ING[2]],
          ].map(([l, v, t, [c, s]]) => (
            <div key={l}>
              <div className="small semibold">{l}</div>
              <IBar pct={(v / t) * 100} color={c} soft={s} />
              <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>
                {fmt(v)}
                <span className="muted" style={{ fontWeight: 500, fontSize: 12 }}>/{t}g</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="tile" style={{ minHeight: 168 }}>
          <span className="tl">
            Drink
            <br />
            water
          </span>
          <span className="corner-btn icon-btn sm ghost" aria-hidden="true">
            <Droplet size={16} />
          </span>
          <span className="tv">
            {N.water}
            <span className="tu"> / {N.targets.water} glass</span>
          </span>
          <div className="row" style={{ gap: 6, marginTop: 6 }}>
            <button className="icon-btn sm ghost" aria-label="Remove a glass" onClick={() => setWater(N.water - 1)}>
              <Minus size={14} />
            </button>
            <button className="btn btn-primary sm grow" style={{ height: 34 }} onClick={() => setWater(N.water + 1)}>
              <Plus size={14} /> Glass
            </button>
          </div>
        </div>
        <button className="tile pressable" style={{ minHeight: 168 }} onClick={() => nav('/progress')}>
          <span className="tl">
            Weekly
            <br />
            score
          </span>
          <span className="corner-btn icon-btn sm ghost" aria-hidden="true">
            <Trophy size={16} />
          </span>
          <span className="tv">
            {N.weekScore}
            <span className="tu"> / 100</span>
          </span>
          <GBar pct={N.weekScore} small />
        </button>
      </div>

      <div className="card">
        <div className="between">
          <span className="h3">{slotMeta.label}</span>
          <button className="icon-btn sm ghost" aria-label={`Add to ${slotMeta.label}`} onClick={() => nav(`/add?slot=${slot}&date=${selectedDate}`)}>
            <Plus size={16} />
          </button>
        </div>
        <div className="row" style={{ alignItems: 'baseline', gap: 6, margin: '12px 0' }}>
          <span className="mid-num" style={{ fontSize: 30 }}>{fmt(slotKcal)}</span>
          <span className="muted" style={{ fontSize: 18, fontWeight: 500 }}>/ {fmt(slotTarget)} kcal</span>
        </div>
        <GBar pct={(slotKcal / slotTarget) * 100} />
        {slotEntries.length > 0 ? (
          <>
            <div className="small muted semibold" style={{ margin: '14px 0 2px' }}>
              {slotEntries.length} ingredient{slotEntries.length === 1 ? '' : 's'}
            </div>
            <div className="grid-3" style={{ gap: 14 }}>
              {slotEntries.slice(0, 3).map((e, i) => (
                <div key={e.id}>
                  <div className="small semibold ellipsis">{FOOD_BY_ID[e.foodId].name.replace(/\s*\(.*\)/, '')}</div>
                  <IBar pct={Math.min(100, (foodKcal(e) / slotTarget) * 160)} color={ING[i][0]} soft={ING[i][1]} />
                  <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>
                    {fmt(foodKcal(e))}
                    <span className="muted" style={{ fontWeight: 500, fontSize: 12 }}> kcal</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <button className="btn btn-primary sm block" style={{ marginTop: 14 }} onClick={() => nav('/scan')}>
            Scan your {slotMeta.label.toLowerCase()}
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <span className="t">Nutrient check</span>
          <ArrowBtn label="Open nutrient profile" onClick={() => nav('/nutrients')} />
        </div>
        <div className="col" style={{ gap: 14 }}>
          {keyNutrients.map((g) => (
            <div key={g.key} className="row" style={{ gap: 12 }}>
              <span className="small semibold" style={{ width: 70 }}>{g.label}</span>
              <div className="grow ibar" style={{ background: 'var(--hatch)', height: 10, borderRadius: 5, margin: 0 }}>
                <div style={{ width: `${Math.min(100, g.pct)}%`, background: statusHex(g.pct), borderRadius: 5 }} />
              </div>
              <span className="num bold" style={{ width: 40, textAlign: 'right' }}>{g.pct}%</span>
              <span className="tiny bold" style={{ width: 40, color: statusHex(g.pct) }}>{status(g.pct).label}</span>
            </div>
          ))}
        </div>
        <div className="tiny muted" style={{ marginTop: 12 }}>7-day average across {N.daysLogged} logged days</div>
      </div>

      {idea && (
        <button className="meal-card pressable" onClick={() => nav(`/meal/${idea.meal.id}`)}>
          <FoodImg items={idea.meal.items} className="" alt={idea.meal.name} />
          <span className="scrim" />
          <span className="top">
            <span className="glass-chip">
              <Sparkles size={13} /> {slotMeta.label} idea
            </span>
            <span className="glass-chip num">{fmt(idea.totals.kcal)} kcal</span>
          </span>
          <span className="body">
            <span className="h2" style={{ color: '#fff' }}>{idea.meal.name}</span>
            <span className="row" style={{ gap: 8 }}>
              <span className="tag-lime">+{Math.round((idea.totals[topGap.key] / N.targets[topGap.key]) * 100)}% {lc(topGap.label)}</span>
              <span className="small" style={{ color: 'rgba(255,255,255,.85)' }}>closes your biggest gap</span>
            </span>
          </span>
        </button>
      )}

      <div className="card">
        <div className="card-head">
          <span className="t">{isToday ? 'Today’s meals' : 'Meals'}</span>
          <button className="link" onClick={() => nav('/diary')}>
            Diary
          </button>
        </div>
        <div className="list">
          {SLOTS.map((s) => {
            const items = N.entries.filter((e) => e.slot === s.id)
            const names = [...new Set(items.map((e) => e.groupName))]
            const kcal = items.reduce((a, e) => a + foodKcal(e), 0)
            const Ic = SLOT_ICON[s.id]
            return (
              <button key={s.id} className="list-row" onClick={() => nav(items.length ? '/diary' : `/add?slot=${s.id}&date=${selectedDate}`)}>
                {items.length ? (
                  <FoodImg items={items} size={46} round alt="" />
                ) : (
                  <span className="list-ic" style={{ width: 46, height: 46, borderRadius: 23 }}>
                    <Ic size={18} />
                  </span>
                )}
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="bold">{s.label}</div>
                  <div className="small muted ellipsis">{names.length ? names.join(', ') : `Suggested around ${s.time}`}</div>
                </div>
                {items.length > 0 ? (
                  <span className="bold num">
                    {fmt(kcal)}
                    <span className="tiny muted"> kcal</span>
                  </span>
                ) : (
                  <Plus size={18} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <button className="card-dark row pressable" style={{ gap: 14, border: 0, textAlign: 'left' }} onClick={() => nav('/coach')}>
        <span className="orb" style={{ width: 52, height: 52, borderRadius: 26, boxShadow: '0 0 30px 4px rgba(215,242,107,.45)', flex: 'none' }}>
          <Sparkles size={20} color="#121412" />
        </span>
        <span className="grow">
          <span className="bold" style={{ display: 'block', fontSize: 16 }}>Ask your coach</span>
          <span className="small" style={{ color: 'rgba(255,255,255,.7)' }}>“Dinner me kya khau? Mera {lc(topGap.label)} low hai”</span>
        </span>
        <ChevronRight size={20} />
      </button>
      <div className="disclaimer">General guidance, not a medical diagnosis</div>
    </div>
  )
}
