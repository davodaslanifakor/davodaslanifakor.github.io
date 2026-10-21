import { onScopeDispose, watch } from 'vue'
import { HOVER_OBJECT_IDS } from './useHoverMotion'

const NOTES = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880]

/** Soft pentatonic notes, unlocked only by enabling the HUD sound control. */
export function useHoverNotes(options: { soundOn: () => boolean; hoveredId: () => string | null }) {
  let context: AudioContext | null = null
  let disposed = false
  const voices = new Set<OscillatorNode>()

  function silence() {
    for (const voice of voices) voice.stop()
    voices.clear()
    const previous = context
    context = null
    void previous?.close().catch(() => {})
  }

  watch(options.soundOn, (enabled) => {
    if (!enabled) { silence(); return }
    if (typeof window === 'undefined' || !window.AudioContext) return
    try {
      context ??= new window.AudioContext()
      void context.resume().catch(() => {})
    } catch { /* Audio can be unavailable; the room remains usable. */ }
  }, { flush: 'sync', immediate: true })

  watch(options.hoveredId, (id) => {
    if (disposed || !options.soundOn() || !context || context.state !== 'running' || !id) return
    const index = HOVER_OBJECT_IDS.findIndex(target => target === id)
    if (index < 0) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.type = 'sine'
    oscillator.frequency.value = NOTES[index]!
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    oscillator.connect(gain).connect(context.destination)
    voices.add(oscillator)
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect() }
    oscillator.start(now)
    oscillator.stop(now + 0.125)
  }, { flush: 'sync' })

  onScopeDispose(() => { disposed = true; silence() })
}
