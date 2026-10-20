import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings2, Flame, CircleCheck, CircleAlert, RotateCcw } from 'lucide-react'
import { useApp, useToast } from '../store/AppStore'
import { computeTargets, fmt } from '../engine/nutrition'
import { api } from '../services/api'

const MIN = 1200
const MAX = 4000

export default function CalorieGoal() {
  const nav = useNavigate()
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const base = useMemo(() => computeTargets(state.profile), [state.profile])
  const [kcal, setKcal] = useState(base.kcal)
  const t = useMemo(() => computeTargets({ ...state.profile, kcalOverride: kcal }), [state.profile, kcal])
  const diff = kcal - base.autoKcal
  const safe = Math.abs(diff) <= 500
  const pos = ((kcal - MIN) / (MAX - MIN)) * 100

  function save() {
    dispatch({ type: 'UPDATE_PROFILE', patch: { kcalOverride: kcal === base.autoKcal ? null : kcal }, keepPlan: false })
    api.track('users/me/goal', `${kcal} kcal`)
    showToast(`Daily goal set to ${fmt(kcal)} kcal`)
    nav(-1)
  }

  return (
    <div className="screen no-nav" style={{ position: 'relative', isolation: 'isolate' }}>
      <div className="glow-bg" />
      <div className="top-bar">
        <button className="icon-btn" aria-label="Back" onClick={() => nav(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="title-sm">Calorie Goal</div>
        <button className="icon-btn" aria-label="Edit profile" onClick={() => nav('/profile/edit')}>
          <Settings2 size={19} />
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <Flame size={26} color="#ff8a4c" fill="#ff8a4c" />
        <div className="hero-num" style={{ fontSize: 88, fontWeight: 700, letterSpacing: '-0.04em', marginTop: 10 }}>{fmt(kcal)}</div>
        <div style={{ fontSize: 22, fontWeight: 500, marginTop: 6 }}>kilo calories</div>
        <div className="small muted semibold" style={{ marginTop: 6 }}>
          Recommended {fmt(base.autoKcal)} · {diff === 0 ? 'using recommendation' : `${diff > 0 ? '+' : ''}${fmt(diff)} kcal`}
        </div>
      </div>

      <div className="kslider" style={{ marginTop: 18 }}>
        <span className="ticks" />
        <span className="thumb-k" style={{ left: `calc(${pos / 100} * (100% - 64px) + 6px)` }}>
          <Flame size={20} />
        </span>
        <input type="range" min={MIN} max={MAX} step={10} value={kcal} onChange={(e) => setKcal(Number(e.target.value))} aria-label="Daily calorie goal" />
      </div>

      <div className="grid-3">
        {[
          ['Protein', t.protein, 'var(--orange)'],
          ['Carbs', t.carbs, 'var(--cyan)'],
          ['Fat', t.fat, 'var(--leaf)'],
        ].map(([l, v, c]) => (
          <div key={l} className="tile" style={{ alignItems: 'center', padding: '18px 10px', gap: 4 }}>
            <span className="num" style={{ fontSize: 24, fontWeight: 700 }}>{v}g</span>
            <span className="small muted semibold">{l}</span>
            <i style={{ width: 12, height: 12, borderRadius: 6, background: c, marginTop: 10 }} />
          </div>
        ))}
      </div>

      <div className="center" style={{ background: safe ? 'var(--lime-soft)' : 'var(--coral-soft)', borderRadius: 30, minHeight: 60, padding: '0 18px', gap: 8, fontWeight: 600, textAlign: 'center' }}>
        {safe ? <CircleCheck size={18} /> : <CircleAlert size={18} color="#f2645a" />}
        {safe ? 'You are on track!' : 'Large change from your estimate. Check with a dietitian.'}
      </div>
      {diff !== 0 && (
        <button className="chip" style={{ alignSelf: 'center', boxShadow: 'var(--shadow)' }} onClick={() => setKcal(base.autoKcal)}>
          <RotateCcw size={14} /> Reset to recommended
        </button>
      )}
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary block" style={{ height: 62, borderRadius: 31, fontSize: 16 }} onClick={save}>
        Set Calorie Goal
      </button>
    </div>
  )
}
