import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Sparkles, Send, Mic, Square, Trash2, Plus, Lightbulb, ShieldAlert, ArrowRight } from 'lucide-react'
import { useApp, useNutrition, useToast, todayKey } from '../store/AppStore'
import { FoodImg, Rich } from '../components/ui'
import { api } from '../services/api'
import { STARTER_CHIPS } from '../engine/coach'
import { startDictation, voiceSupported } from '../services/voice'
import { MEAL_BY_ID } from '../data/meals'
import { slotForNow } from '../engine/recommend'
import { mealToEntries } from '../data/history'

export default function Coach() {
  const nav = useNavigate()
  const loc = useLocation()
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const N = useNutrition()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const endRef = useRef(null)
  const asked = useRef(false)
  const stopRef = useRef(null)
  useEffect(() => () => stopRef.current?.(), [])
  const chat = state.chat
  const name = state.profile.name.split(' ')[0]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chat.length, busy])

  useEffect(() => {
    if (loc.state?.ask && !asked.current) {
      asked.current = true
      send(loc.state.ask)
      nav('.', { replace: true, state: null })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function send(msg) {
    const m = (msg ?? text).trim()
    if (!m || busy) return
    if (listening) stopRef.current?.()
    setText('')
    dispatch({ type: 'CHAT_PUSH', msg: { role: 'user', text: m, ts: Date.now() } })
    setBusy(true)
    const ctx = {
      profile: state.profile,
      targets: N.targets,
      today: N.totals,
      todayEntries: N.entries,
      remaining: N.remaining,
      gaps: N.gaps,
      gapMap: N.gapMap,
      gapStatus: N.gapStatus,
      score: N.score,
      weekScore: N.weekScore,
      water: N.water,
      turn: chat.length,
      allowHinglish: state.settings.hinglish,
      lastOffer: lastAi?.offer,
      lastIntent: lastAi?.intent,
      lastUserText: lastAi?.query,
      lastCardIds: (lastAi?.cards || []).map((c) => c.id),
    }
    const reply = await api.askCoach(m, ctx)
    dispatch({ type: 'CHAT_PUSH', msg: { role: 'ai', ...reply, ts: Date.now() } })
    setBusy(false)
  }

  async function toggleMic() {
    if (listening) {
      stopRef.current?.()
      return
    }
    setListening(true)
    stopRef.current = await startDictation({
      base: text,
      onText: setText,
      onEnd: () => setListening(false),
      onError: (m) => showToast(m, 'info'),
    })
  }

  function addCard(card) {
    const items = card.kind === 'meal' ? MEAL_BY_ID[card.id].items : [{ foodId: card.id, servings: 1 }]
    const slot = slotForNow()
    dispatch({ type: 'ADD_ENTRIES', date: todayKey(), entries: mealToEntries({ name: card.title, items }, slot, { source: 'plan', name: card.title }) })
    api.track('logs', `+ ${card.title} (from coach)`)
    showToast(`${card.title} added to ${slot}`)
  }

  function doAction(a) {
    if (a.to) nav(a.to)
    if (a.do === 'water+1') {
      dispatch({ type: 'SET_WATER', date: todayKey(), value: N.water + 1 })
      showToast(`Water: ${N.water + 1}/${N.targets.water} glasses`)
    }
  }

  const lastAi = [...chat].reverse().find((c) => c.role === 'ai')
  const chips = lastAi?.chips || ['Dinner me kya khau? Mera iron low hai', ...STARTER_CHIPS]

  return (
    <div className="screen no-nav" style={{ paddingBottom: 180 }}>
      <div className="top-bar coach-head">
        <button className="icon-btn" aria-label="Back" onClick={() => nav('/')}>
          <ChevronLeft size={22} />
        </button>
        {chat.length > 0 && (
          <div className="row" style={{ gap: 8 }}>
            <div className="orb" style={{ width: 34, height: 34, borderRadius: 17, boxShadow: '0 0 16px 2px rgba(215,242,107,.8)', animation: 'none' }}>
              <Sparkles size={14} color="#12372A" />
            </div>
            <div>
              <div className="bold small">NutriSense Coach</div>
              <div className="tiny" style={{ color: 'var(--leaf-deep)', fontWeight: 700 }}>{busy ? 'typing…' : 'online'}</div>
            </div>
          </div>
        )}
        {chat.length > 0 ? (
          <button className="icon-btn" aria-label="Clear chat" onClick={() => dispatch({ type: 'CHAT_CLEAR' })}>
            <Trash2 size={18} />
          </button>
        ) : (
          <span style={{ width: 42 }} />
        )}
      </div>

      {chat.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div className="orb">
            <Sparkles size={34} color="#12372A" />
          </div>
          <div className="h1" style={{ marginTop: 18 }}>Hello {name}!</div>
          <div className="small muted semibold">Ask anything about your meals or nutrition</div>
          <div className="card sm" style={{ marginTop: 14, width: '100%' }}>
            <div className="small bold" style={{ marginBottom: 10 }}>
              What I know about you
            </div>
            <div className="chips" style={{ gap: 6 }}>
              <span className="chip soft">{state.profile.diet === 'veg' ? 'Vegetarian' : state.profile.diet === 'vegan' ? 'Vegan' : state.profile.diet === 'egg' ? 'Eggetarian' : 'Non-veg'}</span>
              <span className="chip soft">{N.targets.kcal} kcal goal</span>
              <span className="chip soft">{N.remaining} kcal left</span>
              <span className="chip" style={{ background: 'var(--coral-soft)' }}>
                {N.gaps[0].label} {N.gaps[0].pct}%
              </span>
            </div>
          </div>
        </div>
      )}

      {chat.map((m, i) =>
        m.role === 'user' ? (
          <div key={i} className="msg-user">
            {m.text}
          </div>
        ) : (
          <div key={i} className="msg-ai">
            <div>
              <Rich text={m.text} />
            </div>
            {m.cards?.map((c) => (
              <div key={c.kind + c.id} className="food-row">
                <button onClick={() => nav(c.kind === 'meal' ? `/meal/${c.id}` : `/food/${c.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, background: 'none', border: 0, padding: 0, textAlign: 'left', minWidth: 0 }}>
                  <FoodImg items={c.items || (c.kind === 'food' ? [{ foodId: c.id }] : MEAL_BY_ID[c.id]?.items || [])} size={48} alt="" />
                  <div className="grow" style={{ fontSize: 12, fontWeight: 700, minWidth: 0 }}>
                    <div style={{ lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 500 }}>{c.sub}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--leaf-deep)', whiteSpace: 'nowrap', background: 'var(--lime-soft)', padding: '4px 8px', borderRadius: 10 }}>{c.badge}</span>
                </button>
                <button className="icon-btn sm" aria-label={`Log ${c.title}`} onClick={() => addCard(c)} style={{ width: 28, height: 28 }}>
                  <Plus size={14} />
                </button>
              </div>
            ))}
            {m.tips?.map((t, j) => (
              <div key={j} className={`tip ${m.boundary ? 'warn' : ''}`}>
                {m.boundary ? <ShieldAlert size={14} style={{ flex: 'none' }} /> : <Lightbulb size={14} style={{ flex: 'none' }} />} <span>{t}</span>
              </div>
            ))}
            {m.actions?.length > 0 && (
              <div className="chips">
                {m.actions.map((a) => (
                  <button key={a.label} className="chip dark" onClick={() => doAction(a)}>
                    {a.label} <ArrowRight size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ),
      )}
      {busy && (
        <div className="typing" aria-label="Coach is typing">
          <span />
          <span />
          <span />
        </div>
      )}
      <div ref={endRef} />

      <div className="chip-dock" />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 86, zIndex: 29, padding: '0 16px' }}>
        <div className="chips scroll-x" style={{ margin: 0, padding: '4px 0' }}>
          {chips.map((c) => (
            <button key={c} className="chip" style={{ boxShadow: 'var(--shadow)' }} onClick={() => send(c)} disabled={busy}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={listening ? 'Listening… speak now' : 'Ask anything...'} aria-label="Message" />
        {voiceSupported() && (
          <button type="button" className={`mic-btn ${listening ? 'on' : ''}`} aria-label={listening ? 'Stop dictation' : 'Start dictation'} aria-pressed={listening} onClick={toggleMic}>
            {listening ? <Square size={14} fill="currentColor" /> : <Mic size={17} />}
          </button>
        )}
        <button type="submit" className="icon-btn dark" style={{ width: 46, height: 46 }} aria-label="Send" disabled={!text.trim() || busy}>
          <Send size={17} />
        </button>
      </form>
    </div>
  )
}
