// Dictation: streams what the user says into the text box and never sends on its own.
// Uses the native speech recogniser inside the Android app (WebView has no Web Speech API)
// and the browser's SpeechRecognition on the web.
import { Capacitor } from '@capacitor/core'

export function voiceSupported() {
  return Capacitor.isNativePlatform() || !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export async function startDictation({ base = '', onText, onEnd, onError }) {
  const join = (said) => [base.trim(), said.trim()].filter(Boolean).join(' ')

  if (Capacitor.isNativePlatform()) {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition')
    const perm = await SpeechRecognition.requestPermissions()
    if (perm.speechRecognition !== 'granted') {
      onError?.('Microphone permission denied')
      onEnd?.()
      return () => {}
    }
    const avail = await SpeechRecognition.available()
    if (!avail.available) {
      onError?.('Speech recognition is not available on this phone')
      onEnd?.()
      return () => {}
    }
    const partial = await SpeechRecognition.addListener('partialResults', (d) => {
      if (d.matches?.[0]) onText(join(d.matches[0]))
    })
    const state = await SpeechRecognition.addListener('listeningState', (d) => {
      if (d.status === 'stopped') {
        partial.remove()
        state.remove()
        onEnd?.()
      }
    })
    SpeechRecognition.start({ language: 'en-IN', partialResults: true, popup: false, maxResults: 1 }).catch(() => onEnd?.())
    return () => SpeechRecognition.stop().catch(() => {})
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    onError?.('Voice input is not supported in this browser')
    onEnd?.()
    return () => {}
  }
  const rec = new SR()
  rec.lang = 'en-IN'
  rec.continuous = true
  rec.interimResults = true
  let finalText = ''
  let stopped = false
  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += `${t} `
      else interim += t
    }
    onText(join(finalText + interim))
  }
  rec.onerror = (e) => {
    if (e.error === 'not-allowed') onError?.('Microphone permission denied')
  }
  // Chrome ends a session after a pause; keep listening until the user taps stop.
  rec.onend = () => {
    if (stopped) onEnd?.()
    else {
      try {
        rec.start()
      } catch {
        onEnd?.()
      }
    }
  }
  rec.start()
  return () => {
    stopped = true
    rec.stop()
  }
}
