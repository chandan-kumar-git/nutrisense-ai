import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Trash2, ShieldCheck, Lock, Eye, FileText } from 'lucide-react'
import { useApp, useToast } from '../store/AppStore'
import { TopBar, Toggle, Sheet } from '../components/ui'
import { api } from '../services/api'

export function PolicyText() {
  return (
    <div className="legal">
      <h4>1. What we collect</h4>
      <p>Profile details (age, sex, height, weight, activity, diet, allergies), meals you log or photograph, water intake and weight entries. We collect only what is needed to estimate nutrition (data minimisation).</p>
      <h4>2. Why we use it</h4>
      <p>To estimate your energy and nutrient requirements, identify possible gaps and suggest foods and meals. We do not sell your data or use it for advertising.</p>
      <h4>3. Where it is stored</h4>
      <p>In this prototype, all data stays in your browser’s local storage on this device. Food photos are processed for the scan and are not uploaded or kept.</p>
      <h4>4. Your rights (DPDP Act, 2023)</h4>
      <p>You can access, correct, export and erase your data at any time, and withdraw consent. Withdrawing consent stops processing; optional analytics can be switched off independently.</p>
      <h4>5. Medical disclaimer</h4>
      <p>NutriSense AI provides general nutrition information for healthy adults. It is <b>not</b> a medical device, does not diagnose, treat or prevent any disease, and does not replace advice from a doctor or registered dietitian. Do not change medication or a prescribed diet based on this app. If you are pregnant, breastfeeding, under 18, or managing a medical condition, consult a professional.</p>
      <h4>6. Responsible AI</h4>
      <p>Food recognition and portion estimates can be wrong. Every AI result shows a confidence score and can be corrected. Recommendations are explainable: the app shows which nutrient gap each suggestion targets.</p>
      <h4>7. Children</h4>
      <p>The app is intended for users aged 13+. Users under 18 should use it with a parent or guardian.</p>
      <h4>8. Contact</h4>
      <p>Grievance officer (project team, Law): privacy@nutrisense.example</p>
    </div>
  )
}

export default function Privacy() {
  const nav = useNavigate()
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const [confirm, setConfirm] = useState(false)
  const [policy, setPolicy] = useState(false)
  const c = state.consent || {}

  function exportData() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...state }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `nutrisense-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    api.track('users/me/export', 'data portability request')
    showToast('Your data was exported')
  }

  const meals = Object.values(state.logs).flat().length

  return (
    <div className="screen no-nav">
      <TopBar title="Privacy & data" />
      <div className="card-dark row" style={{ gap: 12 }}>
        <span className="list-ic" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
          <Lock size={18} />
        </span>
        <div className="small" style={{ lineHeight: 1.5 }}>
          <b>Your data stays on this device.</b> No account, no cloud upload, no ads. You’re in control.
        </div>
      </div>

      {state.onboarded && (
        <>
          <div className="card">
            <div className="card-head">
              <span>Consent</span>
              <span className="tiny muted">v{c.version || '1.0'} · {c.at ? new Date(c.at).toLocaleDateString() : '—'}</span>
            </div>
            {[
              ['terms', 'Terms of use', true],
              ['processing', 'Health & food data processing', true],
              ['medical', 'Medical disclaimer acknowledged', true],
              ['analytics', 'Anonymous usage analytics', false],
            ].map(([k, l, req]) => (
              <div key={k} className="list-row">
                <span className="grow small bold">
                  {l}
                  {req && <span className="tiny muted" style={{ fontWeight: 600 }}> · required</span>}
                </span>
                {req ? (
                  <span className="badge" style={{ background: 'var(--green-soft)', color: '#1d6b41' }}>Given</span>
                ) : (
                  <Toggle on={!!c.analytics} label={l} onChange={(v) => { dispatch({ type: 'CONSENT', patch: { analytics: v } }); showToast(v ? 'Analytics enabled' : 'Analytics disabled', 'info') }} />
                )}
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <span>Data we hold</span>
              <Eye size={16} />
            </div>
            <div className="kv"><span>Profile fields</span><span>8</span></div>
            <div className="kv"><span>Logged food items</span><span>{meals}</span></div>
            <div className="kv"><span>Days with data</span><span>{Object.keys(state.logs).length}</span></div>
            <div className="kv"><span>Weight entries</span><span>{state.weights.length}</span></div>
            <div className="kv"><span>Coach messages</span><span>{state.chat.length}</span></div>
            <div className="kv"><span>Food photos stored</span><span>0</span></div>
          </div>

          <div className="grid-2">
            <button className="btn btn-light" onClick={exportData}>
              <Download size={17} /> Export
            </button>
            <button className="btn btn-danger" onClick={() => setConfirm(true)}>
              <Trash2 size={17} /> Delete all
            </button>
          </div>
        </>
      )}

      <div className="boundary" style={{ fontSize: 12.5 }}>
        <b>Medical boundary:</b> the system estimates requirements and identifies possible nutritional gaps. It is not a medical diagnosis system and does not replace clinical diagnosis or professional medical advice.
      </div>

      <button className="card sm row pressable" style={{ border: 0, textAlign: 'left' }} onClick={() => setPolicy(true)}>
        <span className="list-ic"><FileText size={18} /></span>
        <span className="grow small bold">Privacy policy & terms</span>
      </button>
      <button className="card sm row pressable" style={{ border: 0, textAlign: 'left' }} onClick={() => nav('/how-it-works')}>
        <span className="list-ic"><ShieldCheck size={18} /></span>
        <span className="grow small bold">Responsible AI & model card</span>
      </button>

      <Sheet open={policy} onClose={() => setPolicy(false)}>
        <div className="title-sm">Privacy policy & terms</div>
        <PolicyText />
      </Sheet>

      <Sheet open={confirm} onClose={() => setConfirm(false)}>
        <div className="title-sm">Delete all data?</div>
        <div className="small muted" style={{ lineHeight: 1.5 }}>
          This permanently erases your profile, {meals} logged items, weights, plan and chat from this device. This cannot be undone. Consider exporting first.
        </div>
        <button
          className="btn btn-danger block"
          onClick={() => {
            dispatch({ type: 'RESET' })
            api.track('users/me/erase', 'right to erasure')
            setConfirm(false)
            nav('/welcome')
          }}
        >
          Yes, erase everything
        </button>
        <button className="btn btn-light block" onClick={() => setConfirm(false)}>
          Cancel
        </button>
      </Sheet>
    </div>
  )
}
