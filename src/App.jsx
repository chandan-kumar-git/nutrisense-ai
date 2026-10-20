import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Home as HomeIc, ScanLine, Utensils, BarChart3, Activity, MessageCircle, CalendarDays, User, Cpu, ShieldCheck, RotateCcw, Signal, Wifi, BatteryFull } from 'lucide-react'
import { AppProvider, useApp } from './store/AppStore'
import { onApiLog } from './services/api'
import { BottomNav, Toast } from './components/ui'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
const Scan = lazy(() => import('./screens/Scan'))
const MealDetails = lazy(() => import('./screens/MealDetails'))
const Diary = lazy(() => import('./screens/Diary'))
const AddFood = lazy(() => import('./screens/AddFood'))
const Progress = lazy(() => import('./screens/Progress'))
const Nutrients = lazy(() => import('./screens/Nutrients'))
const Coach = lazy(() => import('./screens/Coach'))
const Plan = lazy(() => import('./screens/Plan'))
const Profile = lazy(() => import('./screens/Profile'))
const EditProfile = lazy(() => import('./screens/EditProfile'))
const Privacy = lazy(() => import('./screens/Privacy'))
const HowItWorks = lazy(() => import('./screens/HowItWorks'))
const Notifications = lazy(() => import('./screens/Notifications'))
const About = lazy(() => import('./screens/About'))
const CalorieGoal = lazy(() => import('./screens/CalorieGoal'))

const PIPELINE = [
  { n: 1, t: 'User input', d: 'Age, body, activity, diet, habits, meals', routes: ['/welcome', '/profile', '/profile/edit', '/diary', '/add'] },
  { n: 2, t: 'Preprocessing', d: 'Clean, normalise, encode, resize images', routes: ['/scan'] },
  { n: 3, t: 'AI / deep learning', d: 'Food recognition + requirement patterns', routes: ['/scan', '/how-it-works'] },
  { n: 4, t: 'Requirement + gap analysis', d: 'Adequate · needs attention · higher priority', routes: ['/nutrients', '/progress'] },
  { n: 5, t: 'Recommendation engine', d: 'Knowledge base + preferences + constraints', routes: ['/plan', '/coach'] },
  { n: 6, t: 'Personalised output', d: 'What, why, food sources, meal ideas', routes: ['/', '/meal', '/food', '/coach'] },
]

const JUMPS = [
  { to: '/', label: 'Home', Icon: HomeIc },
  { to: '/scan', label: 'Scan', Icon: ScanLine },
  { to: '/diary', label: 'Food diary', Icon: Utensils },
  { to: '/progress', label: 'Progress', Icon: BarChart3 },
  { to: '/nutrients', label: 'Nutrients', Icon: Activity },
  { to: '/coach', label: 'AI Coach', Icon: MessageCircle },
  { to: '/plan', label: 'Meal plan', Icon: CalendarDays },
  { to: '/profile', label: 'Profile', Icon: User },
  { to: '/how-it-works', label: 'How AI works', Icon: Cpu },
  { to: '/privacy', label: 'Privacy', Icon: ShieldCheck },
]

const NAV_ROUTES = ['/', '/progress', '/profile', '/nutrients', '/diary', '/plan']

function LeftPanel() {
  const { pathname } = useLocation()
  const base = '/' + (pathname.split('/')[1] || '')
  return (
    <aside className="side left">
      <div className="side-card">
        <h1>AI Nutrition Detection & Diet Suggestion</h1>
        <p>Interdisciplinary Design Project P020, 2026. Personalised nutrition guidance through deep learning. Mentor: Dr. Vivek Sharma · 4 CSE · 2 Law · 1 Management.</p>
      </div>
      <div className="side-card">
        <div className="side-label">Live pipeline</div>
        <div className="pipe">
          {PIPELINE.map((s) => (
            <div key={s.n} className={`pipe-step ${s.routes.includes(pathname) || s.routes.includes(base) ? 'on' : ''}`}>
              <span className="num">{s.n}</span>
              <div>
                <div className="t">{s.t}</div>
                <div className="d">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="boundary">
        <b>Medical boundary:</b> the system estimates requirements and flags possible nutritional gaps. It is not a medical diagnosis system and does not replace professional advice.
      </div>
    </aside>
  )
}

function RightPanel() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { state, dispatch } = useApp()
  const [log, setLog] = useState([])
  useEffect(() => onApiLog(setLog), [])
  return (
    <aside className="side right">
      <div className="side-card">
        <div className="side-label">Jump to a screen</div>
        <div className="jump">
          {JUMPS.map((j) => (
            <button key={j.to} className={pathname === j.to ? 'on' : ''} onClick={() => nav(state.onboarded ? j.to : '/welcome')}>
              <j.Icon size={14} />
              {j.label}
            </button>
          ))}
        </div>
      </div>
      <div className="side-card">
        <div className="between">
          <div className="side-label">Backend calls</div>
          <span className="tiny muted">mock FastAPI</span>
        </div>
        <div className="api-log">
          {log.length === 0 && <div className="tiny muted" style={{ padding: '6px 2px' }}>Scan a meal or ask the coach to see requests here.</div>}
          {log.slice(0, 6).map((l) => (
            <div key={l.id} className="api-row">
              <span className="m">{l.method}</span>
              <span className="p">{l.path}</span>
              <span className="s">
                {l.status} · {l.ms}ms
              </span>
              {l.note && <span className="n">{l.note}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="side-card">
        <div className="side-label">Demo session</div>
        <p style={{ marginTop: 6 }}>
          {state.onboarded ? (
            <>
              Signed in as <b>{state.profile.name}</b> · {Object.keys(state.logs).length} days logged · {state.scanCount} scans
            </>
          ) : (
            'No profile yet. Complete onboarding.'
          )}
        </p>
        <button
          className="btn btn-outline sm"
          style={{ marginTop: 10 }}
          onClick={() => {
            dispatch({ type: 'RESET' })
            nav('/welcome')
          }}
        >
          <RotateCcw size={14} /> Reset demo
        </button>
      </div>
    </aside>
  )
}

const DARK_TOP = ['/scan', '/diary', '/plan', '/meal', '/food']

function StatusBar() {
  const { pathname } = useLocation()
  const { state } = useApp()
  const dark = DARK_TOP.some((r) => pathname === r || pathname.startsWith(`${r}/`)) && !(pathname === '/plan' && !state.plan)
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className={`status-bar ${dark ? 'dark' : ''}`}>
      <span>{time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '')}</span>
      <span className="status-icons">
        <Signal size={14} strokeWidth={2.6} />
        <Wifi size={14} strokeWidth={2.6} />
        <BatteryFull size={18} strokeWidth={2.2} />
      </span>
    </div>
  )
}

function Guard({ children }) {
  const { state } = useApp()
  if (!state.onboarded) return <Navigate to="/welcome" replace />
  return children
}

function PhoneApp() {
  const { pathname } = useLocation()
  const { state } = useApp()
  const showNav = state.onboarded && NAV_ROUTES.includes(pathname)
  return (
    <div className="phone">
      <div className="phone-inner">
        <div className="notch" />
        <StatusBar />
        <div className="app">
          <div className="scroll" id="scroller">
            <ScrollTop />
            <Suspense fallback={<div className="screen" aria-busy="true" />}>
            <Routes>
              <Route path="/welcome" element={state.onboarded ? <Navigate to="/" replace /> : <Onboarding />} />
              <Route path="/" element={<Guard><Home /></Guard>} />
              <Route path="/scan" element={<Guard><Scan /></Guard>} />
              <Route path="/meal" element={<Guard><MealDetails source="scan" /></Guard>} />
              <Route path="/meal/:mealId" element={<Guard><MealDetails source="meal" /></Guard>} />
              <Route path="/food/:foodId" element={<Guard><MealDetails source="food" /></Guard>} />
              <Route path="/diary" element={<Guard><Diary /></Guard>} />
              <Route path="/add" element={<Guard><AddFood /></Guard>} />
              <Route path="/progress" element={<Guard><Progress /></Guard>} />
              <Route path="/nutrients" element={<Guard><Nutrients /></Guard>} />
              <Route path="/coach" element={<Guard><Coach /></Guard>} />
              <Route path="/plan" element={<Guard><Plan /></Guard>} />
              <Route path="/profile" element={<Guard><Profile /></Guard>} />
              <Route path="/profile/edit" element={<Guard><EditProfile /></Guard>} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
              <Route path="/about" element={<About />} />
              <Route path="/goal" element={<Guard><CalorieGoal /></Guard>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </div>
          {showNav && <BottomNav />}
          <Toast />
        </div>
      </div>
    </div>
  )
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.getElementById('scroller')?.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="shell">
          <LeftPanel />
          <PhoneApp />
          <RightPanel />
        </div>
      </HashRouter>
    </AppProvider>
  )
}
