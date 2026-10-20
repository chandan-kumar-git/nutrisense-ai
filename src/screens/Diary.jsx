import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings2, Plus, Trash2, ScanLine, PenLine, Barcode, CalendarDays, Flame, Clock, ArrowUpDown } from 'lucide-react'
import { useApp, useNutrition, useToast, todayKey } from '../store/AppStore'
import { FoodImg, Ring, GBar } from '../components/ui'
import { SLOTS } from '../engine/recommend'
import { fmt, sumItems } from '../engine/nutrition'
import { dateKey, addDays } from '../data/history'

const SRC = { scan: ['Scanned', ScanLine], manual: ['Logged', PenLine], barcode: ['Barcode', Barcode], plan: ['From plan', CalendarDays] }

export default function Diary() {
  const nav = useNavigate()
  const { dispatch, selectedDate, setSelectedDate } = useApp()
  const { showToast } = useToast()
  const N = useNutrition(selectedDate)
  const [filter, setFilter] = useState('all')
  const [sortKcal, setSortKcal] = useState(false)

  const days = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = addDays(today, i - 5)
      return { key: dateKey(d), num: d.getDate(), wd: d.toLocaleDateString(undefined, { weekday: 'short' }) }
    })
  }, [])

  const groups = useMemo(() => {
    const map = new Map()
    for (const e of N.entries) {
      if (filter !== 'all' && e.slot !== filter) continue
      if (!map.has(e.groupId)) map.set(e.groupId, { id: e.groupId, name: e.groupName, time: e.time, slot: e.slot, source: e.source, items: [] })
      map.get(e.groupId).items.push(e)
    }
    const list = [...map.values()].map((g) => ({ ...g, t: sumItems(g.items) }))
    const order = SLOTS.map((s) => s.id)
    return sortKcal ? list.sort((a, b) => b.t.kcal - a.t.kcal) : list.sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot) || a.time.localeCompare(b.time))
  }, [N.entries, filter, sortKcal])

  return (
    <div className="screen bleed">
      <div className="dark-head">
        <div className="top-bar">
          <button className="icon-btn" aria-label="Back to home" onClick={() => nav('/')}>
            <ArrowLeft size={20} />
          </button>
          <div className="title-sm">My Meals</div>
          <button className="icon-btn" aria-label="Meal plan" onClick={() => nav('/plan')}>
            <Settings2 size={19} />
          </button>
        </div>
        <div className="date-pills">
          {days.map((d) => (
            <button key={d.key} className={`date-pill ${d.key === selectedDate ? 'on' : ''}`} onClick={() => setSelectedDate(d.key)} aria-pressed={d.key === selectedDate}>
              <b>{d.num}</b>
              <span>{d.key === todayKey() ? 'Today' : d.wd}</span>
            </button>
          ))}
        </div>
        <div className="row" style={{ alignItems: 'flex-end', gap: 10 }}>
          <span className="hero-num" style={{ fontSize: 56, color: '#fff' }}>{fmt(N.totals.kcal)}</span>
          <span style={{ color: '#a3a8a0', fontWeight: 500, paddingBottom: 4 }}>/ {fmt(N.targets.kcal)} kcal</span>
        </div>
        <div style={{ marginTop: -6 }}>
          <GBar pct={(N.totals.kcal / N.targets.kcal) * 100} small />
        </div>
      </div>

      <div className="col" style={{ padding: '18px 20px 0', gap: 14 }}>
        <div className="chips scroll-x">
          {[{ id: 'all', label: 'All' }, ...SLOTS].map((s) => (
            <button key={s.id} className={`chip ${filter === s.id ? 'lime' : ''}`} style={filter === s.id ? { boxShadow: 'inset 0 0 0 2px #121412' } : { boxShadow: 'var(--shadow)' }} onClick={() => setFilter(s.id)} aria-pressed={filter === s.id}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="between">
          <span className="bold">{filter === 'all' ? 'All meals' : SLOTS.find((s) => s.id === filter).label}</span>
          <button className="chip" style={{ boxShadow: 'none', background: 'none', padding: 0 }} onClick={() => setSortKcal(!sortKcal)}>
            <ArrowUpDown size={14} /> {sortKcal ? 'Most calorie' : 'By time'}
          </button>
        </div>

        {groups.length === 0 && (
          <div className="card empty">
            Nothing logged here yet.
            <div className="row">
              <button className="btn btn-primary sm" onClick={() => nav('/scan')}>
                <ScanLine size={16} /> Scan
              </button>
              <button className="btn btn-light sm" onClick={() => nav(`/add?date=${selectedDate}${filter !== 'all' ? `&slot=${filter}` : ''}`)}>
                <PenLine size={16} /> Search
              </button>
            </div>
          </div>
        )}

        {groups.map((g) => {
          const [srcLabel, SrcIc] = SRC[g.source] || SRC.manual
          return (
            <div key={g.id} className="meal-card" style={{ height: 200 }}>
              <FoodImg items={g.items} className="" alt={g.name} />
              <span className="scrim" />
              <span className="top">
                <span className="glass-chip">
                  <SrcIc size={13} /> {SLOTS.find((s) => s.id === g.slot).label} · {srcLabel}
                </span>
                <button
                  className="icon-btn sm glass"
                  style={{ color: 'var(--ink)' }}
                  aria-label={`Delete ${g.name}`}
                  onClick={() => {
                    dispatch({ type: 'REMOVE_GROUP', date: selectedDate, groupId: g.id })
                    showToast('Meal removed', 'info')
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </span>
              <span className="body">
                <span className="h3" style={{ color: '#fff', fontSize: 19 }}>{g.name}</span>
                <span className="row small" style={{ gap: 12, color: 'rgba(255,255,255,.85)' }}>
                  <span className="row" style={{ gap: 4 }}>
                    <Flame size={13} /> {fmt(g.t.kcal)} kcal
                  </span>
                  <span className="row" style={{ gap: 4 }}>
                    <Clock size={13} /> {g.time}
                  </span>
                </span>
                <span className="macro-dots">
                  {[
                    ['Protein', g.t.protein, N.targets.protein],
                    ['Fats', g.t.fat, N.targets.fat],
                    ['Carbs', g.t.carbs, N.targets.carbs],
                  ].map(([l, v, t]) => (
                    <span key={l} className="macro-dot">
                      <Ring size={30} stroke={4} value={(v / t) * 100 * 2.5} color="#fff" track="rgba(255,255,255,.25)" />
                      <span>
                        <b className="num">{fmt(v)}g</b>
                        {l}
                      </span>
                    </span>
                  ))}
                </span>
              </span>
            </div>
          )
        })}

        <button className="btn btn-primary block" onClick={() => nav(`/add?date=${selectedDate}${filter !== 'all' ? `&slot=${filter}` : ''}`)}>
          <Plus size={18} /> Add food
        </button>
      </div>
    </div>
  )
}
