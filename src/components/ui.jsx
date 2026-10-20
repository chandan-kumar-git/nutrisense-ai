import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, House, ChartColumn, ScanLine, MessageCircle, User, Check, Minus, Plus, Info, ArrowUpRight } from 'lucide-react'
import { useToast } from '../store/AppStore'
import { FOOD_BY_ID } from '../data/foods'

const BASE = import.meta.env.BASE_URL

export function foodPhoto(foodId) {
  return `${BASE}food/${foodId}.jpg`
}

// The photo for a meal is its most calorie-dense item (the dish, not the side).
export function mainFoodId(items) {
  let best = items[0]
  let max = -1
  for (const it of items) {
    const f = FOOD_BY_ID[it.foodId]
    const sideWeight = ['staple', 'side', 'drink', 'fruit'].includes(f?.category) ? 0.3 : 1
    const k = (f?.n.kcal || 0) * (it.servings || 1) * sideWeight
    if (k > max) {
      max = k
      best = it
    }
  }
  return best?.foodId
}

export function FoodImg({ id, items, src, size, alt = '', className = 'thumb', style, round }) {
  const fid = id || (items && mainFoodId(items))
  const [failed, setFailed] = useState(false)
  const s = size ? { width: size, height: size, ...style } : style
  if (failed || (!src && !fid)) return <span className={`${className} ${round ? 'round' : ''}`} style={{ ...s, background: FOOD_BY_ID[fid]?.color || 'var(--lime-soft)' }} aria-hidden="true" />
  return <img src={src || foodPhoto(fid)} alt={alt} className={`${className} ${round ? 'round' : ''}`} style={s} loading="lazy" decoding="async" onError={() => setFailed(true)} />
}

function useAnimated(value) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setV(value))
    return () => cancelAnimationFrame(id)
  }, [value])
  return v
}

export function Ring({ size = 64, stroke = 8, value = 0, color = 'var(--leaf)', track = 'var(--ground)', label, sub, fontSize, subSize, labelColor = 'var(--ink)' }) {
  const r = (size - stroke) / 2 - 1
  const c = 2 * Math.PI * r
  const v = useAnimated(value)
  const len = Math.max(0, Math.min(1, v / 100)) * c
  const fs = fontSize || Math.round(size * 0.22)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ?? ''} ${sub ?? ''}`.trim()}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${len} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray 1s cubic-bezier(.16,1,.3,1)' }} />
      {label != null && (
        <text x={size / 2} y={sub ? size / 2 + fs * 0.05 : size / 2 + fs * 0.36} textAnchor="middle" fontSize={fs} fontWeight="700" fill={labelColor} fontFamily="inherit">
          {label}
        </text>
      )}
      {sub && (
        <text x={size / 2} y={size / 2 + fs * 1.25} textAnchor="middle" fontSize={subSize || fs * 0.6} fill="var(--muted)" fontFamily="inherit">
          {sub}
        </text>
      )}
    </svg>
  )
}

// Lime gradient progress over a hatched track (reference: "456 / 512 kcal").
export function GBar({ pct, small, color, instant }) {
  const anim = useAnimated(Math.min(100, Math.max(0, pct)))
  const w = instant ? Math.min(100, Math.max(0, pct)) : anim
  return (
    <div className={`gbar ${small ? 'sm' : ''}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${w}%`, ...(color ? { background: color } : null), ...(instant ? { transition: 'none' } : null) }} />
    </div>
  )
}

// Thin coloured ingredient bar on a pale track of the same hue.
export function IBar({ pct, color, soft }) {
  const w = useAnimated(Math.min(100, Math.max(0, pct)))
  return (
    <div className="ibar" style={{ background: soft }}>
      <div style={{ width: `${w}%`, background: color }} />
    </div>
  )
}

export function Bar({ label, right, pct, color = 'var(--leaf)' }) {
  const w = useAnimated(Math.min(100, Math.max(0, pct)))
  return (
    <div>
      {(label || right) && (
        <div className="bar-label">
          <span>{label}</span>
          <span className="muted num">{right}</span>
        </div>
      )}
      <div className="bar">
        <div style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}

export function ArrowBtn({ onClick, label = 'Open', dark }) {
  return (
    <button className="arrow-btn" aria-label={label} onClick={onClick} style={dark ? { background: 'transparent', borderColor: 'rgba(255,255,255,.3)', color: '#fff' } : undefined}>
      <ArrowUpRight size={16} />
    </button>
  )
}

export function TopBar({ title, right, back = true, onBack, dark }) {
  const nav = useNavigate()
  return (
    <div className="top-bar">
      {back ? (
        <button className="icon-btn" aria-label="Back" onClick={onBack || (() => (window.history.length > 1 ? nav(-1) : nav('/')))} style={dark ? { background: '#2a2d29', color: '#fff', boxShadow: 'none' } : undefined}>
          <ChevronLeft size={22} />
        </button>
      ) : (
        <span style={{ width: 44 }} />
      )}
      <div className="title-sm">{title}</div>
      {right || <span style={{ width: 44 }} />}
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => {
        const id = typeof o === 'string' ? o : o.id
        const label = typeof o === 'string' ? o : o.label
        return (
          <button key={id} role="tab" aria-selected={value === id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function Sheet({ open, onClose, children, label = 'Dialog' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={label}>
        <div className="grab" />
        {children}
      </div>
    </div>
  )
}

export function Toast() {
  const { toast } = useToast()
  if (!toast) return null
  return (
    <div className="toast" key={toast.id} role="status">
      {toast.icon === 'info' ? <Info size={16} /> : <Check size={16} />}
      {toast.text}
    </div>
  )
}

export function Stepper({ value, onChange, step = 0.25, min = 0.25, max = 5, format, label = 'amount' }) {
  return (
    <div className="stepper">
      <button aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, Math.round((value - step) * 100) / 100))}>
        <Minus size={15} />
      </button>
      <div className="v">{format ? format(value) : value}</div>
      <button aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(max, Math.round((value + step) * 100) / 100))}>
        <Plus size={15} />
      </button>
    </div>
  )
}

export function Toggle({ on, onChange, label }) {
  return <button className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />
}

export function Checkbox({ on }) {
  return <span className={`checkbox ${on ? 'on' : ''}`}>{on && <Check size={14} strokeWidth={3} />}</span>
}

// Renders **bold** and line breaks from coach/engine text.
export function Rich({ text }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <div key={i}>{line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith('**') ? <b key={j}>{part.slice(2, -2)}</b> : <span key={j}>{part}</span>))}</div>
      ))}
    </>
  )
}

const NAV = [
  { to: '/', label: 'Home', Icon: House },
  { to: '/progress', label: 'Progress', Icon: ChartColumn },
  { to: '/scan', fab: true },
  { to: '/coach', label: 'Coach', Icon: MessageCircle },
  { to: '/profile', label: 'Profile', Icon: User },
]

export function BottomNav() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav className="bottom-nav" aria-label="Main">
      {NAV.map((n) =>
        n.fab ? (
          <button key={n.to} className="scan-fab" aria-label="Scan food" onClick={() => nav('/scan')}>
            <ScanLine size={26} strokeWidth={2} />
          </button>
        ) : (
          <button key={n.to} className={`nav-item ${pathname === n.to ? 'on' : ''}`} onClick={() => nav(n.to)} aria-current={pathname === n.to ? 'page' : undefined} aria-label={n.label} title={n.label}>
            <n.Icon size={22} strokeWidth={pathname === n.to ? 2.3 : 1.9} />
          </button>
        ),
      )}
    </nav>
  )
}

const STATUS_TONE = { good: ['#e6f6d6', '#2f6b17'], watch: ['#fff0dc', '#94530f'], low: ['#fde1de', '#9f2a21'] }

export function StatusBadge({ status, long }) {
  const [bg, fg] = STATUS_TONE[status.id]
  return (
    <span className="badge" style={{ background: bg, color: fg }}>
      {long ? status.long : status.label}
    </span>
  )
}
