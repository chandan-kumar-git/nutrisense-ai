import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useToast, todayKey } from '../store/AppStore'
import { TopBar, Stepper } from '../components/ui'
import { ACTIVITY, GOALS, DIETS, ALLERGENS, computeTargets, fmt } from '../engine/nutrition'
import { api } from '../services/api'

export default function EditProfile() {
  const nav = useNavigate()
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const [p, setP] = useState(state.profile)
  const set = (patch) => setP((x) => ({ ...x, ...patch }))
  const before = computeTargets(state.profile)
  const after = computeTargets(p)

  function save() {
    dispatch({ type: 'UPDATE_PROFILE', patch: { ...p, name: p.name.trim() || state.profile.name } })
    if (p.weightKg !== state.profile.weightKg) dispatch({ type: 'ADD_WEIGHT', date: todayKey(), kg: p.weightKg })
    api.track('users/me', 'profile updated')
    showToast('Profile saved · targets recalculated')
    nav('/profile')
  }

  return (
    <div className="screen no-nav">
      <TopBar title="Edit profile" />
      <div className="field">
        <label htmlFor="ename">Name</label>
        <input id="ename" className="input" value={p.name} maxLength={24} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="grid-2">
        <div className="field">
          <span className="lbl">Age</span>
          <Stepper value={p.age} step={1} min={13} max={90} onChange={(v) => set({ age: v })} />
        </div>
        <div className="field">
          <span className="lbl">Sex</span>
          <div className="seg">
            {['female', 'male'].map((g) => (
              <button key={g} className={p.gender === g ? 'on' : ''} onClick={() => set({ gender: g })}>
                {g === 'female' ? 'Female' : 'Male'}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="lbl">Height (cm)</span>
          <Stepper value={p.heightCm} step={1} min={120} max={220} onChange={(v) => set({ heightCm: v })} />
        </div>
        <div className="field">
          <span className="lbl">Weight (kg)</span>
          <Stepper value={p.weightKg} step={0.5} min={30} max={200} onChange={(v) => set({ weightKg: v })} />
        </div>
      </div>
      <div className="field">
        <span className="lbl">Activity</span>
        <div className="chips">
          {ACTIVITY.map((a) => (
            <button key={a.id} className={`chip ${p.activity === a.id ? 'active' : ''}`} onClick={() => set({ activity: a.id })}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="lbl">Diet</span>
        <div className="chips">
          {DIETS.map((d) => (
            <button key={d.id} className={`chip ${p.diet === d.id ? 'active' : ''}`} onClick={() => set({ diet: d.id })}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="lbl">Goal</span>
        <div className="chips">
          {GOALS.map((g) => (
            <button key={g.id} className={`chip ${p.goal === g.id ? 'active' : ''}`} onClick={() => set({ goal: g.id })}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="lbl">Allergies</span>
        <div className="chips">
          {ALLERGENS.map((a) => {
            const on = p.allergies?.includes(a.id)
            return (
              <button key={a.id} className={`chip ${on ? 'dark' : ''}`} onClick={() => set({ allergies: on ? p.allergies.filter((x) => x !== a.id) : [...(p.allergies || []), a.id] })}>
                {a.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="card-lime between">
        <div>
          <div className="tiny bold" style={{ color: 'var(--primary)' }}>NEW DAILY TARGET</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{fmt(after.kcal)} kcal</div>
          <div className="tiny">Protein {after.protein} g · Iron {after.iron} mg</div>
        </div>
        {after.kcal !== before.kcal && (
          <span className="badge" style={{ background: '#fff' }}>
            {after.kcal > before.kcal ? '+' : ''}
            {after.kcal - before.kcal} kcal
          </span>
        )}
      </div>
      <button className="btn btn-primary block" onClick={save}>
        Save changes
      </button>
      <div className="disclaimer">Changing diet or goal resets your 7-day plan so it can be regenerated.</div>
    </div>
  )
}
