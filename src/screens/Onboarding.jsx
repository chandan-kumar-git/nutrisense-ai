import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Sparkles, Flame, ShieldCheck, Activity, Droplet } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { Checkbox, Toggle, Sheet, GBar, foodPhoto } from '../components/ui'
import { PolicyText } from './Privacy'
import { ACTIVITY, GOALS, DIETS, ALLERGENS, computeTargets, bmi, bmiCategory, fmt } from '../engine/nutrition'
import { api } from '../services/api'

const DEMO = { name: 'Aarav', age: 21, gender: 'male', heightCm: 172, weightKg: 68, activity: 'light', diet: 'veg', goal: 'maintain', allergies: [] }
const STEPS = 7

export default function Onboarding() {
  const { dispatch } = useApp()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [p, setP] = useState({ name: '', age: 21, gender: 'female', heightCm: 162, weightKg: 58, activity: 'light', diet: 'veg', goal: 'maintain', allergies: [] })
  const [consent, setConsent] = useState({ terms: false, processing: false, medical: false, analytics: false })
  const [demo, setDemo] = useState(true)
  const [policy, setPolicy] = useState(false)
  const set = (patch) => setP((x) => ({ ...x, ...patch }))
  const targets = useMemo(() => computeTargets(p), [p])
  const b = bmi(p)
  const bc = bmiCategory(b)

  const finish = (profile = p, withDemo = demo, c = consent) => {
    dispatch({ type: 'ONBOARD', profile: { ...profile, name: profile.name.trim() || 'Friend' }, consent: { ...c, at: new Date().toISOString(), version: '1.0' }, demo: withDemo })
    api.track('users', `profile created · ${profile.diet} · ${profile.goal}`)
    nav('/', { replace: true })
  }

  const canNext = [true, p.name.trim().length > 0, true, true, true, true, consent.terms && consent.processing && consent.medical, true][step]

  if (step === 0) {
    return (
      <div className="screen no-nav" style={{ justifyContent: 'space-between', position: 'relative' }}>
        <div className="welcome-photo">
          <img src={foodPhoto('masala_dosa')} alt="Masala dosa with chutney and sambar" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,.35))' }} />
          <div className="float-chip" style={{ left: 18, top: 92 }}>
            <i style={{ width: 9, height: 9, borderRadius: 5, background: 'var(--coral)' }} /> Iron 40%
          </div>
          <div className="float-chip" style={{ right: 18, top: 170, animationDelay: '1.2s' }}>
            <Flame size={15} color="#ff8a4c" /> 380 kcal
          </div>
          <div className="float-chip" style={{ left: 40, bottom: 34, animationDelay: '2.4s' }}>
            <Sparkles size={15} color="#4f9a2a" /> Masala Dosa · 95%
          </div>
        </div>
        <div className="col" style={{ gap: 10, marginTop: 6 }}>
          <div className="row" style={{ gap: 8 }}>
            <span className="avatar" style={{ width: 30, height: 30, fontSize: 14 }}>N</span>
            <span className="bold">NutriSense AI</span>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.035em' }}>
            Know what you eat.
            <br />
            <span style={{ fontWeight: 300 }}>Learn what you need.</span>
          </div>
          <div className="muted semibold" style={{ lineHeight: 1.5 }}>Snap a plate, find your nutrient gaps, and get Indian meals that fit your body.</div>
        </div>
        <div className="col">
          <button className="btn btn-primary block" onClick={() => setStep(1)} style={{ justifyContent: 'space-between', paddingLeft: 26 }}>
            Get started
            <span className="go">
              <ArrowRight size={18} />
            </span>
          </button>
          <button className="btn btn-outline block" onClick={() => finish(DEMO, true, { terms: true, processing: true, medical: true, analytics: false })}>
            Explore with a demo profile
          </button>
          <div className="disclaimer">General guidance, not a medical diagnosis</div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen no-nav" style={{ position: 'relative', isolation: 'isolate' }}>
      <div className="glow-bg" />
      <div className="row">
        <button className="icon-btn" aria-label="Back" onClick={() => setStep(step - 1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="ob-progress grow">
          {Array.from({ length: STEPS - 1 }).map((_, i) => (
            <i key={i} className={i < step ? 'on' : ''} />
          ))}
        </div>
        <span className="small bold num">
          {Math.min(step, STEPS - 1)}/{STEPS - 1}
        </span>
      </div>

      <div className="col stagger" style={{ gap: 16, flex: 1 }} key={step}>
        {step === 1 && (
          <>
            <Head t="Let’s get to know you" d="Your profile changes what “enough” means." />
            <div className="field">
              <label htmlFor="name">First name</label>
              <input id="name" className="input" value={p.name} placeholder="e.g. Riya" onChange={(e) => set({ name: e.target.value })} autoFocus maxLength={24} autoComplete="given-name" />
            </div>
            <div className="field">
              <span className="lbl">Sex (for energy and RDA estimates)</span>
              <div className="seg">
                {['female', 'male'].map((g) => (
                  <button key={g} className={p.gender === g ? 'on' : ''} onClick={() => set({ gender: g })}>
                    {g === 'female' ? 'Female' : 'Male'}
                  </button>
                ))}
              </div>
            </div>
            <Big label="Age" value={p.age} unit="years" min={13} max={80} onChange={(v) => set({ age: v })} />
          </>
        )}

        {step === 2 && (
          <>
            <Head t="Height & weight" d="Used to estimate energy and protein needs." />
            <Big label="Height" value={p.heightCm} unit="cm" min={130} max={210} onChange={(v) => set({ heightCm: v })} />
            <Big label="Weight" value={p.weightKg} unit="kg" min={35} max={150} onChange={(v) => set({ weightKg: v })} />
            <div className="card row" style={{ gap: 14 }}>
              <span className="big-num" style={{ color: bc.color }}>{b.toFixed(1)}</span>
              <div className="grow">
                <div className="bold">BMI · {bc.label}</div>
                <div className="tiny muted">Asian-Indian cut-offs. A rough screen, not a diagnosis.</div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Head t="How active are you?" d="Activity multiplies your base metabolism." />
            {ACTIVITY.map((a) => (
              <button key={a.id} className={`option ${p.activity === a.id ? 'on' : ''}`} onClick={() => set({ activity: a.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <span className="list-ic" style={{ background: p.activity === a.id ? 'var(--lime)' : 'var(--ground)' }}>
                  <Activity size={18} />
                </span>
                <span className="grow">
                  <span className="o-t" style={{ display: 'block' }}>{a.label}</span>
                  <span className="o-d">{a.hint}</span>
                </span>
                <span className="small bold muted num">×{a.factor}</span>
              </button>
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <Head t="What do you eat?" d="Suggestions only use foods that match." />
            <div className="option-grid">
              {DIETS.map((d) => (
                <button key={d.id} className={`option ${p.diet === d.id ? 'on' : ''}`} onClick={() => set({ diet: d.id })}>
                  <span className="o-t">{d.label}</span>
                  <span className="o-d">{d.hint}</span>
                </button>
              ))}
            </div>
            <div className="field">
              <span className="lbl">Allergies or intolerances</span>
              <div className="chips">
                {ALLERGENS.map((a) => {
                  const on = p.allergies.includes(a.id)
                  return (
                    <button key={a.id} className={`chip ${on ? 'dark' : ''}`} style={{ boxShadow: on ? 'none' : 'var(--shadow)' }} onClick={() => set({ allergies: on ? p.allergies.filter((x) => x !== a.id) : [...p.allergies, a.id] })} aria-pressed={on}>
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <Head t="What’s your goal?" d="We adjust calories and protein to match." />
            {GOALS.map((g) => (
              <button key={g.id} className={`option ${p.goal === g.id ? 'on' : ''}`} onClick={() => set({ goal: g.id })}>
                <span className="o-t">{g.label}</span>
                <span className="o-d">
                  {g.delta === 0 ? 'Maintenance calories' : g.delta > 0 ? `+${g.delta} kcal surplus` : `${g.delta} kcal deficit`} · {g.proteinPerKg} g protein per kg
                </span>
              </button>
            ))}
          </>
        )}

        {step === 6 && (
          <>
            <Head t="Your data, your choice" d="Data-minimisation under India’s DPDP Act, 2023." />
            {[
              ['terms', 'I accept the Terms of Use', 'You are 13+ and use the app for general wellness.', true],
              ['processing', 'Process my health & food data', 'Profile, meals and photos are used only to estimate nutrition, on this device.', true],
              ['medical', 'I understand this is not medical advice', 'Results are estimates and do not replace a doctor or dietitian.', true],
              ['analytics', 'Share anonymous usage analytics', 'Optional. You can change this anytime.', false],
            ].map(([k, t, d, req]) => (
              <button key={k} className="check-row" onClick={() => setConsent((c) => ({ ...c, [k]: !c[k] }))} aria-pressed={consent[k]}>
                <Checkbox on={consent[k]} />
                <span>
                  <span className="bold small" style={{ display: 'block' }}>
                    {t} {req && <span style={{ color: 'var(--coral)' }}>*</span>}
                  </span>
                  <span className="tiny muted">{d}</span>
                </span>
              </button>
            ))}
            <button className="chip" style={{ alignSelf: 'flex-start', boxShadow: 'var(--shadow)' }} onClick={() => setPolicy(true)}>
              <ShieldCheck size={14} /> Read full privacy policy
            </button>
          </>
        )}

        {step === 7 && (
          <>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div className="hero-num" style={{ fontSize: 132, marginTop: 14 }}>{fmt(targets.kcal)}</div>
              <div className="unit" style={{ fontSize: 15, marginTop: 10 }}>kcal · your daily target</div>
              <div className="small muted semibold" style={{ marginTop: 4 }}>
                BMR {fmt(targets.bmr)} × activity = {fmt(targets.tdee)}
                {targets.kcal !== targets.tdee && ` · ${targets.kcal > targets.tdee ? '+' : ''}${fmt(targets.kcal - targets.tdee)} for goal`}
              </div>
            </div>
            <div className="grid-3" style={{ marginTop: 8 }}>
              {[
                ['Protein', targets.protein, 'var(--orange)'],
                ['Carbs', targets.carbs, 'var(--cyan)'],
                ['Fat', targets.fat, 'var(--leaf)'],
              ].map(([l, v, c]) => (
                <div key={l} className="tile" style={{ alignItems: 'center', padding: 14 }}>
                  <span className="num" style={{ fontSize: 26, fontWeight: 600 }}>{v}g</span>
                  <span className="small muted semibold">{l}</span>
                  <i style={{ width: 10, height: 10, borderRadius: 5, background: c }} />
                </div>
              ))}
            </div>
            <div className="card sm row">
              <Droplet size={20} />
              <span className="grow small">
                <b>{targets.water} glasses</b> of water a day
              </span>
              <span className="tiny muted num">
                Iron {targets.iron} mg · Ca {targets.calcium} mg
              </span>
            </div>
            <div className="check-row" style={{ alignItems: 'center' }}>
              <div className="grow">
                <div className="bold small">Load 2 weeks of sample meals</div>
                <div className="tiny muted">Recommended for demos: fills charts and gap analysis.</div>
              </div>
              <Toggle on={demo} onChange={setDemo} label="Load sample history" />
            </div>
          </>
        )}
      </div>

      <button className="btn btn-primary block" disabled={!canNext} onClick={() => (step === 7 ? finish() : setStep(step + 1))} style={{ justifyContent: 'space-between', paddingLeft: 26 }}>
        {step === 7 ? 'Start my journey' : 'Continue'}
        <span className="go">
          <ArrowRight size={18} />
        </span>
      </button>
      <Sheet open={policy} onClose={() => setPolicy(false)} label="Privacy policy">
        <div className="h2">Privacy & terms</div>
        <PolicyText />
        <button className="btn btn-primary block" onClick={() => setPolicy(false)}>
          Got it
        </button>
      </Sheet>
    </div>
  )
}

function Head({ t, d }) {
  return (
    <div className="col" style={{ gap: 6, marginTop: 8 }}>
      <div className="h1" style={{ fontSize: 32 }}>{t}</div>
      <div className="muted semibold">{d}</div>
    </div>
  )
}

function Big({ label, value, unit, min, max, onChange }) {
  return (
    <div className="card" style={{ padding: '18px 18px 20px' }}>
      <div className="between">
        <span className="bold">{label}</span>
        <span className="unit muted">{unit}</span>
      </div>
      <div className="range-num" style={{ margin: '10px 0 14px' }}>{value}</div>
      <div style={{ position: 'relative' }}>
        <GBar pct={((value - min) / (max - min)) * 100} instant />
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }} />
      </div>
      <div className="between tiny muted semibold num" style={{ marginTop: 6 }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
