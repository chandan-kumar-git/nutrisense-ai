import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, ZapOff, Apple, ScanBarcode, Tag, Images, Check, X, Camera, CameraOff, Loader2, ArrowRight, RotateCcw, ScanSearch } from 'lucide-react'
import { useApp, useNutrition, useToast, todayKey } from '../store/AppStore'
import { FoodImg, foodPhoto, mainFoodId } from '../components/ui'
import { api } from '../services/api'
import { FOOD_BY_ID } from '../data/foods'
import { MEAL_BY_ID } from '../data/meals'
import { fmt, sumItems } from '../engine/nutrition'
import { slotForNow } from '../engine/recommend'
import { pickScenario } from '../engine/detector'
import { mealToEntries } from '../data/history'

const VERDICT = { good: ['Good pick', '#e6f6d6', '#2f6b17'], ok: ['Okay in moderation', '#fff0dc', '#94530f'], limit: ['Limit this', '#fde1de', '#9f2a21'] }

export default function Scan() {
  const nav = useNavigate()
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const N = useNutrition()
  const [mode, setMode] = useState('food')
  const [phase, setPhase] = useState('idle')
  const [stage, setStage] = useState(-1)
  const [det, setDet] = useState(null)
  const [product, setProduct] = useState(null)
  const [label, setLabel] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [flash, setFlash] = useState(false)
  const [live, setLive] = useState(false)
  const [camMsg, setCamMsg] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)
  const counter = useRef(state.scanCount)

  // The plate "in front of the camera" when no live feed or upload is used.
  const preview = useMemo(() => {
    const s = pickScenario({ scanIndex: counter.current, profile: state.profile })
    return foodPhoto(mainFoodId(MEAL_BY_ID[s.mealId].items))
  }, [state.profile, det]) // eslint-disable-line react-hooks/exhaustive-deps

  // Open the camera as soon as the scanner opens, like a normal camera app.
  useEffect(() => {
    startCamera(true)
    return () => stopCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function startCamera(quiet = false) {
    if (streamRef.current) return
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamMsg('Camera not supported here. Showing a sample plate.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      streamRef.current = stream
      setLive(true)
      setPhoto(null)
      setCamMsg('')
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
    } catch {
      setCamMsg('Camera permission denied. Showing a sample plate.')
      if (!quiet) showToast('Allow camera access to scan your own plate', 'info')
    }
  }

  async function toggleTorch() {
    const next = !flash
    setFlash(next)
    const track = streamRef.current?.getVideoTracks()[0]
    try {
      if (track?.getCapabilities?.().torch) await track.applyConstraints({ advanced: [{ torch: next }] })
    } catch {
      /* torch not supported: the button still brightens the preview */
    }
  }

  function retake() {
    reset()
    setPhoto(null)
    startCamera(true)
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setLive(false)
  }

  function captureFrame() {
    const v = videoRef.current
    if (!v || !v.videoWidth) return null
    const c = document.createElement('canvas')
    c.width = 720
    c.height = Math.round((720 * v.videoHeight) / v.videoWidth)
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.82)
  }

  function reset() {
    setPhase('idle')
    setStage(-1)
    setDet(null)
    setProduct(null)
    setLabel(null)
  }

  async function shoot(nameHint = '', m = mode, opts = {}) {
    if (phase === 'scanning') return
    let image = opts.image || photo
    if (live) {
      const v = videoRef.current
      for (let i = 0; i < 20 && v && v.videoWidth < 32; i++) await new Promise((r) => setTimeout(r, 50))
      const shot = captureFrame()
      if (shot) {
        setPhoto(shot)
        image = shot
      }
      stopCamera()
    }
    setDet(null)
    setProduct(null)
    setLabel(null)
    setPhase('scanning')
    const idx = counter.current++
    if (m === 'food') {
      const d = await api.detectFood({ scanIndex: idx, fileName: nameHint, image, force: opts.force, profile: state.profile, onStage: setStage })
      if (d.noFood) {
        setPhase('nofood')
        return
      }
      setStage(api.PIPELINE.length)
      setDet(d)
      dispatch({ type: 'SCAN_DONE', detection: d })
    } else if (m === 'barcode') {
      setProduct(await api.scanBarcode(idx))
    } else {
      setLabel(await api.readLabel(idx))
    }
    setPhase('result')
  }

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    stopCamera()
    setMode('food')
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(reader.result)
      setTimeout(() => shoot(f.name, 'food', { image: reader.result }), 120)
    }
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  function acceptFood() {
    dispatch({ type: 'SET_DETECTION', detection: { ...det, photo } })
    nav('/meal')
  }

  function acceptProduct() {
    const slot = slotForNow()
    dispatch({ type: 'ADD_ENTRIES', date: todayKey(), entries: mealToEntries({ name: product.name, items: [{ foodId: product.foodId, servings: product.servings }] }, slot, { source: 'barcode', name: product.name }) })
    api.track('logs', `+ ${product.name}`)
    showToast(`Added to ${slot}`)
    reset()
  }

  const changeMode = (m) => {
    setMode(m)
    reset()
    if (m !== 'food') stopCamera()
  }

  const totals = det ? sumItems(det.items) : null
  const pTotals = product ? sumItems([{ foodId: product.foodId, servings: product.servings }]) : null
  const bgSrc = photo || (det ? foodPhoto(mainFoodId(det.items)) : preview)
  const dim = mode !== 'food'

  return (
    <div className="scanner">
      {mode === 'food' && live ? <video ref={videoRef} className="bg" autoPlay playsInline muted /> : <img className={`bg ${phase === 'scanning' ? 'zoom' : ''}`} src={bgSrc} alt="" style={{ filter: dim ? 'blur(14px) brightness(.55)' : flash ? 'brightness(1.12)' : undefined }} />}
      <div className="shade" />

      <div className="bar-top">
        <button className="icon-btn" aria-label="Back" onClick={() => nav(-1)}>
          <ArrowLeft size={20} />
        </button>
        <span className="title-sm" style={{ color: '#fff' }}>
          Scanner
        </span>
        <button className="icon-btn" aria-label={live ? 'Stop camera' : 'Start camera'} onClick={live ? stopCamera : () => { reset(); setPhoto(null); startCamera() }} disabled={mode !== 'food' || phase === 'scanning'}>
          {live ? <CameraOff size={19} /> : <Camera size={19} />}
        </button>
      </div>

      <div className={`frame ${phase === 'scanning' ? 'run' : ''}`}>
        <i className="tl" />
        <i className="tr" />
        <i className="bl" />
        <i className="br" />
        {mode === 'food' && phase !== 'result' && (
          <>
            <span className="veil" />
            <span className={`split ${phase === 'scanning' ? 'run' : ''}`} />
          </>
        )}
      </div>

      {camMsg && !live && mode === 'food' && phase === 'idle' && !photo && (
        <div className="cam-msg">
          <span>{camMsg}</span>
          <button className="chip" onClick={() => startCamera()}>
            <Camera size={14} /> Retry
          </button>
        </div>
      )}

      {mode === 'barcode' && phase !== 'result' && <BarcodeArt />}
      {mode === 'label' && phase !== 'result' && <LabelArt />}

      {phase === 'result' && det && (
        <div className="det-list" aria-label="Detected foods">
          {det.items.map((it, i) => (
            <div key={i} className="scan-tag" style={{ animationDelay: `${i * 0.12}s` }}>
              <i />
              {FOOD_BY_ID[it.foodId].name.replace(/\s*\(.*\)/, '')} · {it.grams} g
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{Math.round(it.conf * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {phase === 'scanning' && mode === 'food' && (
        <div className="stages" aria-live="polite">
          {api.PIPELINE.map((s, i) => (
            <div key={s.id} className={`stage ${i === stage ? 'on' : i < stage ? 'done' : ''}`}>
              <span className="sd">{i < stage && <Check size={11} strokeWidth={3} />}</span>
              <span className="grow">{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.8 }}>{i <= stage ? s.detail.split('·')[0] : ''}</span>
            </div>
          ))}
        </div>
      )}
      {phase === 'scanning' && mode !== 'food' && (
        <div className="stages" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 size={16} className="spin" /> <span className="small bold">{mode === 'barcode' ? 'Looking up product' : 'Reading label with OCR'}</span>
        </div>
      )}

      {(phase === 'idle' || phase === 'scanning') && (
        <>
          {phase === 'idle' && (
            <div className="modes" role="tablist" aria-label="Scan mode">
              {[
                ['food', 'Scan Food', Apple],
                ['barcode', 'Barcode', ScanBarcode],
                ['label', 'Food label', Tag],
              ].map(([id, l, Ic]) => (
                <button key={id} role="tab" aria-selected={mode === id} className={`mode ${mode === id ? 'on' : ''}`} onClick={() => changeMode(id)}>
                  <Ic size={20} />
                  {l}
                </button>
              ))}
              <button className="mode" onClick={() => fileRef.current?.click()}>
                <Images size={20} />
                Library
              </button>
            </div>
          )}
          <div className="shutter-row">
            <button className="side-btn" aria-label="Open diary" onClick={() => nav('/diary')}>
              <Images size={20} />
            </button>
            <button className="shutter" aria-label="Capture" onClick={() => shoot()} disabled={phase === 'scanning'}>
              <span />
            </button>
            <button className="side-btn" aria-label={flash ? 'Flash on' : 'Flash off'} onClick={toggleTorch}>
              {flash ? <Zap size={20} /> : <ZapOff size={20} />}
            </button>
          </div>
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      {phase === 'nofood' && (
        <div className="result-sheet">
          <div className="grab" />
          <div className="row" style={{ gap: 14 }}>
            <span className="list-ic" style={{ width: 52, height: 52, borderRadius: 26, background: 'var(--amber-soft)' }}>
              <ScanSearch size={22} />
            </span>
            <div className="grow">
              <div className="h3">No plate found</div>
              <div className="small muted">The frame looks empty or too dark. Fill the frame with your food and keep it well lit.</div>
            </div>
          </div>
          <div className="row">
            <button className="btn btn-light grow" onClick={() => shoot('', 'food', { force: true })}>
              Analyse anyway
            </button>
            <button className="btn btn-primary grow" onClick={retake}>
              <RotateCcw size={17} /> Retake
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && det && (
        <div className="result-sheet">
          <div className="grab" />
          <div className="row">
            <div className="grow">
              <div className="h2">{det.name}</div>
              <div className="small muted semibold">
                {det.items.length} foods · {Math.round(det.conf * 100)}% match · {det.latencyMs} ms
              </div>
            </div>
            <span className="tag-lime num">{fmt(totals.kcal)} kcal</span>
          </div>
          <div className="grid-3" style={{ gap: 8 }}>
            {[
              ['Protein', totals.protein, 'var(--orange)'],
              ['Carbs', totals.carbs, 'var(--cyan)'],
              ['Fat', totals.fat, 'var(--leaf)'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ background: 'var(--ground)', borderRadius: 18, padding: '10px 12px' }}>
                <div className="row" style={{ gap: 6 }}>
                  <i style={{ width: 8, height: 8, borderRadius: 4, background: c }} />
                  <span className="tiny muted bold">{l}</span>
                </div>
                <div className="num" style={{ fontSize: 20, fontWeight: 700 }}>{fmt(v)}g</div>
              </div>
            ))}
          </div>
          {det.alt?.length > 0 && (
            <div className="tiny muted">
              Also considered: {det.alt.map(([n, p]) => `${n} ${Math.round(p * 100)}%`).join(' · ')}
            </div>
          )}
          <div className="row">
            <button className="icon-btn ghost" aria-label="Retake photo" onClick={retake}>
              <X size={20} />
            </button>
            <button className="btn btn-primary grow" onClick={acceptFood}>
              Review & add <span className="go"><ArrowRight size={18} /></span>
            </button>
          </div>
          <div className="disclaimer">Portion sizes are estimates (±15%). {fmt(N.remaining)} kcal left today.</div>
        </div>
      )}

      {phase === 'result' && product && (
        <div className="result-sheet">
          <div className="grab" />
          <div className="row">
            <FoodImg id={product.foodId} size={64} alt="" />
            <div className="grow">
              <div className="h3">{product.name}</div>
              <div className="small muted">
                {product.brand} · {product.servingLabel} · {product.code}
              </div>
            </div>
          </div>
          <div className="between small">
            {[
              ['kcal', pTotals.kcal],
              ['protein', pTotals.protein],
              ['carbs', pTotals.carbs],
              ['fat', pTotals.fat],
            ].map(([l, v]) => (
              <span key={l} className="muted semibold">
                <b className="num" style={{ color: 'var(--ink)', fontSize: 20 }}>{fmt(v)}{l === 'kcal' ? '' : 'g'}</b> {l}
              </span>
            ))}
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <span className="badge" style={{ background: VERDICT[product.verdict][1], color: VERDICT[product.verdict][2] }}>
              {VERDICT[product.verdict][0]}
            </span>
            <span className="small muted">{product.note}</span>
          </div>
          <div className="row">
            <button className="icon-btn ghost" aria-label="Discard" onClick={reset}>
              <X size={20} />
            </button>
            <button className="btn btn-primary grow" onClick={acceptProduct}>
              Add to {slotForNow()}
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && label && (
        <div className="result-sheet">
          <div className="grab" />
          <div>
            <div className="h3">{label.name}</div>
            <div className="small muted">Per {label.per} · extracted by OCR</div>
          </div>
          <div className="grid-2" style={{ gap: 8 }}>
            {[
              ['Energy', `${label.kcal} kcal`],
              ['Sugar', `${label.sugar} g`],
              ['Protein', `${label.protein} g`],
              ['Sodium', `${label.sodium} mg`],
              ['Sat. fat', `${label.satFat} g`],
              ['Fiber', `${label.fiber} g`],
            ].map(([k, v]) => (
              <div key={k} className="between" style={{ background: 'var(--ground)', borderRadius: 14, padding: '10px 12px' }}>
                <span className="small muted semibold">{k}</span>
                <span className="bold num">{v}</span>
              </div>
            ))}
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <span className="badge" style={{ background: VERDICT[label.verdict][1], color: VERDICT[label.verdict][2] }}>
              {VERDICT[label.verdict][0]}
            </span>
            <span className="small muted">{label.note}</span>
          </div>
          <button className="btn btn-primary block" onClick={reset}>
            Scan another
          </button>
        </div>
      )}
    </div>
  )
}

function BarcodeArt() {
  const code = '8901030865278'
  const widths = code.split('').flatMap((d, i) => [1 + (Number(d) % 3), 1 + ((Number(d) + i) % 2)])
  return (
    <div className="barcode-art">
      <div className="barcode-bars">
        {widths.map((w, i) => (
          <i key={i} style={{ width: w * 2, opacity: i % 2 ? 0 : 1 }} />
        ))}
      </div>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, letterSpacing: 3 }}>{code}</div>
    </div>
  )
}

function LabelArt() {
  return (
    <div className="label-art">
      <div style={{ fontWeight: 900, fontSize: 16, borderBottom: '6px solid #121412', paddingBottom: 2 }}>Nutrition Facts</div>
      {['Energy', 'Protein', 'Carbohydrate', '  of which sugars', 'Total fat', 'Sodium'].map((a) => (
        <div key={a} className="lrow">
          <span>{a}</span>
          <b>▮▮.▮</b>
        </div>
      ))}
    </div>
  )
}
