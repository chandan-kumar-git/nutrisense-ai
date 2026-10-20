import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { dateKey, addDays } from '../data/history'
import { LayoutGrid, Settings2, Zap, ChevronLeft, Plus, ArrowRight, Flame, Pencil, CalendarDays, Utensils, Activity, Bell, ShieldCheck, Cpu, Users, ChevronRight, LogOut, Languages, AlarmClock } from 'lucide-react'
import { useApp, useNutrition } from '../store/AppStore'
import { Toggle } from '../components/ui'
import { bmi, bmiCategory, ACTIVITY, GOALS, DIETS, ALLERGENS, fmt, sumEntries } from '../engine/nutrition'
import { streakOf } from './Home'

export default function Profile() {
  const nav = useNavigate()
  const { state, dispatch } = useApp()
  const N = useNutrition()
  const p = state.profile
  const b = bmi(p)
  const bc = bmiCategory(b)
  const weekAvg = useMemo(() => {
    const days = []
    for (let i = 1; i <= 7; i++) {
      const e = state.logs[dateKey(addDays(new Date(), -i))]
      if (e?.length) days.push(sumEntries(e).kcal)
    }
    return days.length ? days.reduce((a, x) => a + x, 0) / days.length : N.totals.kcal
  }, [state.logs, N.totals.kcal])
  const menu = [
    { Icon: Pencil, label: 'Edit profile', to: '/profile/edit' },
    { Icon: Flame, label: 'Calorie goal', to: '/goal' },
    { Icon: CalendarDays, label: '7-day meal plan', to: '/plan' },
    { Icon: Utensils, label: 'Food diary', to: '/diary' },
    { Icon: Activity, label: 'Nutrient profile', to: '/nutrients' },
    { Icon: Bell, label: 'Notifications', to: '/notifications' },
  ]
  const more = [
    { Icon: ShieldCheck, label: 'Privacy, consent & data', to: '/privacy' },
    { Icon: Cpu, label: 'How the AI works', to: '/how-it-works' },
    { Icon: Users, label: 'About the project', to: '/about' },
  ]
  return (
    <div className="screen stagger">
      <div className="top-bar">
        <button className="icon-btn" aria-label="Edit profile" onClick={() => nav('/profile/edit')}>
          <LayoutGrid size={19} />
        </button>
        <span />
        <button className="icon-btn" aria-label="Calorie goal" onClick={() => nav('/goal')}>
          <Settings2 size={19} />
        </button>
      </div>
      <div className="row" style={{ gap: 16, marginTop: 6 }}>
        <div className="avatar" style={{ width: 92, height: 92, borderRadius: 26, fontSize: 40, fontWeight: 300 }}>
          {p.name[0]?.toUpperCase()}
          <span className="online" />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="small muted semibold">Hello again!</div>
          <div className="ellipsis" style={{ fontSize: 40, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1.05 }}>{p.name}</div>
          <div className="row unit" style={{ gap: 6, marginTop: 6, fontSize: 10 }}>
            <Zap size={13} /> {GOALS.find((g) => g.id === p.goal)?.label} · {DIETS.find((d) => d.id === p.diet)?.label}
          </div>
        </div>
      </div>

      <div className="card-glow" style={{ textAlign: 'center', padding: '24px 18px' }}>
        <div className="between">
          <span className="muted" aria-hidden="true"><ChevronLeft size={20} /></span>
          <div>
            <div className="hero-num" style={{ fontSize: 96 }}>{fmt(weekAvg)}</div>
            <div className="unit" style={{ fontSize: 15, marginTop: 8 }}>kcal</div>
            <div className="caps" style={{ marginTop: 2 }}>a day, this week</div>
          </div>
          <span className="muted" aria-hidden="true"><ChevronRight size={20} /></span>
        </div>
        <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline sm" style={{ height: 50, borderRadius: 25 }} onClick={() => nav('/progress')}>
            Weekly report <ArrowRight size={16} />
          </button>
          <button className="icon-btn dark" style={{ width: 50, height: 50, borderRadius: 25 }} aria-label="Log a meal" onClick={() => nav('/add')}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="grid-3">
        <div className="tile" style={{ padding: 14 }}>
          <span className="num" style={{ fontSize: 26, fontWeight: 600, color: bc.color }}>{b.toFixed(1)}</span>
          <span className="tiny muted semibold">BMI · {bc.label}</span>
        </div>
        <div className="tile" style={{ padding: 14 }}>
          <span className="num" style={{ fontSize: 26, fontWeight: 600 }}>{fmt(N.targets.kcal)}</span>
          <span className="tiny muted semibold">kcal goal</span>
        </div>
        <div className="tile" style={{ padding: 14 }}>
          <span className="num" style={{ fontSize: 26, fontWeight: 600 }}>{streakOf(state.logs)}</span>
          <span className="tiny muted semibold">day streak</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="t">Your daily targets</span>
          <span className="tiny muted">ICMR-NIN 2020</span>
        </div>
        <div className="grid-2" style={{ gap: 0, columnGap: 16 }}>
          {[
            ['BMR', `${fmt(N.targets.bmr)} kcal`],
            ['TDEE', `${fmt(N.targets.tdee)} kcal`],
            ['Protein', `${N.targets.protein} g`],
            ['Carbs', `${N.targets.carbs} g`],
            ['Fat', `${N.targets.fat} g`],
            ['Fiber', `${N.targets.fiber} g`],
            ['Iron', `${N.targets.iron} mg`],
            ['Calcium', `${N.targets.calcium} mg`],
            ['Vitamin D', `${N.targets.vitD} µg`],
            ['Water', `${N.targets.water} glasses`],
          ].map(([k, v]) => (
            <div key={k} className="kv">
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <div className="tiny muted" style={{ marginTop: 8 }}>
          Activity: {ACTIVITY.find((a) => a.id === p.activity)?.label}
          {p.allergies?.length ? ` · Avoiding: ${p.allergies.map((a) => ALLERGENS.find((x) => x.id === a)?.label).join(', ')}` : ''}
        </div>
      </div>

      <Menu items={menu} nav={nav} />

      <div className="card" style={{ padding: '4px 16px' }}>
        <div className="list">
          <div className="list-row">
            <span className="list-ic">
              <AlarmClock size={18} />
            </span>
            <span className="grow small bold">Meal reminders</span>
            <Toggle on={state.settings.reminders} onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { reminders: v } })} label="Meal reminders" />
          </div>
          <div className="list-row">
            <span className="list-ic">
              <Languages size={18} />
            </span>
            <span className="grow small bold">Hinglish replies in coach</span>
            <Toggle on={state.settings.hinglish} onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { hinglish: v } })} label="Hinglish replies" />
          </div>
        </div>
      </div>

      <Menu items={more} nav={nav} />

      <button
        className="btn btn-danger block"
        onClick={() => {
          dispatch({ type: 'RESET' })
          nav('/welcome')
        }}
      >
        <LogOut size={17} /> Sign out & clear device data
      </button>
      <div className="disclaimer">NutriSense AI v1.0 · IDP P020 · General guidance, not a medical diagnosis</div>
    </div>
  )
}

function Menu({ items, nav }) {
  return (
    <div className="card" style={{ padding: '4px 16px' }}>
      <div className="list">
        {items.map((m) => (
          <button key={m.to} className="list-row" onClick={() => nav(m.to)}>
            <span className="list-ic">
              <m.Icon size={18} />
            </span>
            <span className="grow small bold">{m.label}</span>
            <ChevronRight size={18} color="#62786D" />
          </button>
        ))}
      </div>
    </div>
  )
}
