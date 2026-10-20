import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Droplet, Sparkles, Trophy, AlertTriangle, CalendarDays, ShieldCheck } from 'lucide-react'
import { useApp, useNutrition, todayKey } from '../store/AppStore'
import { TopBar } from '../components/ui'
import { streakOf } from './Home'

const ICONS = { bell: Bell, water: Droplet, ai: Sparkles, trophy: Trophy, warn: AlertTriangle, plan: CalendarDays, shield: ShieldCheck }

export function buildNotifications(state, N) {
  if (!N) return []
  const out = []
  const h = new Date().getHours()
  const today = todayKey()
  const streak = streakOf(state.logs)
  const low = N.gaps.filter((g) => g.pct < 50)
  if (low.length) out.push({ id: `gap-${today}-${low[0].key}`, icon: 'warn', title: `${low[0].label} needs attention`, body: `Your 7-day average is ${low[0].pct}% of target. Tap for food sources.`, to: '/nutrients', time: '9:00 AM' })
  if (N.water < N.targets.water / 2 && h >= 12) out.push({ id: `water-${today}`, icon: 'water', title: 'Hydration check', body: `Only ${N.water} of ${N.targets.water} glasses so far. Time for a glass of water?`, to: '/', time: '12:30 PM' })
  if (!N.entries.some((e) => e.slot === 'lunch') && h >= 14) out.push({ id: `lunch-${today}`, icon: 'bell', title: 'Did you have lunch?', body: 'Snap your plate to log it in 3 seconds.', to: '/scan', time: '2:15 PM' })
  if (streak >= 3) out.push({ id: `streak-${streak}`, icon: 'trophy', title: `${streak}-day streak! 🔥`, body: 'Consistency beats perfection. Keep logging.', to: '/progress', time: 'Today' })
  out.push({ id: `insight-${today}`, icon: 'ai', title: 'New AI insight', body: `${N.gaps[0].label} is your biggest gap this week. Ask your coach for meal ideas.`, to: '/coach', time: '8:00 AM' })
  if (!state.plan) out.push({ id: 'plan-ready', icon: 'plan', title: 'Your 7-day plan is waiting', body: 'Generate a plan tuned to your gaps and diet.', to: '/plan', time: 'Yesterday' })
  out.push({ id: 'privacy-1', icon: 'shield', title: 'Your data stays on this device', body: 'Review consent, export or delete your data anytime.', to: '/privacy', time: 'Mon' })
  return out
}

export default function Notifications() {
  const nav = useNavigate()
  const { state, dispatch } = useApp()
  const N = useNutrition()
  const list = buildNotifications(state, N)
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'READ_NOTIFS', ids: list.map((n) => n.id) }), 1200)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="screen no-nav">
      <TopBar title="Notifications" />
      <div className="col stagger">
        {list.map((n) => {
          const Ic = ICONS[n.icon]
          const unread = !state.readNotifs.includes(n.id)
          return (
            <button key={n.id} className="card sm row pressable" style={{ border: 0, textAlign: 'left', alignItems: 'flex-start' }} onClick={() => nav(n.to)}>
              <span className="list-ic" style={{ background: n.icon === 'warn' ? 'var(--coral-soft)' : n.icon === 'water' ? '#E3EEFC' : 'var(--lime)' }}>
                <Ic size={18} />
              </span>
              <div className="grow">
                <div className="between">
                  <span className="bold small">{n.title}</span>
                  <span className="tiny muted">{n.time}</span>
                </div>
                <div className="small muted" style={{ marginTop: 2, lineHeight: 1.45 }}>{n.body}</div>
              </div>
              {unread && <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--coral)', marginTop: 6, flex: 'none' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
