import { onScopeDispose, readonly, shallowRef } from 'vue'
import { createJokerMotorAudio } from '~/utils/jokerMotorAudio'

export type ToyCue = 'start' | 'step' | 'jump' | 'catch' | 'miss' | 'win' | 'finish' | 'land' | 'powerOn' | 'powerOff' | 'plug' | 'unplug' | 'key' | 'keyStep' | 'erase' | 'strain' | 'push' | 'grip' | 'bass'
const tones: Record<ToyCue, readonly number[]> = {
  bass: [65.41, 130.82],
  key: [880, 440], keyStep: [310], erase: [520, 390, 260], strain: [130, 145, 160], push: [90, 110], grip: [230],
  land: [95], powerOn: [262, 392, 523], powerOff: [330, 220, 110], plug: [180, 360], unplug: [210, 90],
  start: [330, 440, 660], step: [170], jump: [240, 620], catch: [660, 880],
  miss: [190, 110], win: [523, 659, 784, 1047], finish: [440, 330, 262],
}

/** Gesture-unlocked, bounded synth voices. No external audio files or character recordings. */
export function useToyGameAudio() {
  const enabled = shallowRef(true)
  const unavailable = shallowRef(false)
  let context: AudioContext | null = null
  let disposed = false
  let generation = 0
  const voices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>()

  let motor: ReturnType<typeof createJokerMotorAudio> | null = null

  function stop() {
    generation++
    for (const { oscillator, gain } of voices) {
      try { oscillator.stop() } catch { /* A finished voice may already be stopped. */ }
      oscillator.disconnect(); gain.disconnect()
    }
    voices.clear(); motor?.stop(); motor = null
  }
  function close() {
    stop()
    const old = context
    context = null
    void old?.close().catch(() => {})
  }
  async function unlock() {
    if (disposed || !enabled.value) return false
    const request = generation
    try {
      const Audio = typeof window !== 'undefined' ? window.AudioContext : undefined
      if (!Audio) { unavailable.value = true; return false }
      context ??= new Audio()
      const active = context
      await active.resume()
      if (disposed || request !== generation || context !== active || !enabled.value) return false
      unavailable.value = active.state !== 'running'
      return !unavailable.value
    } catch { unavailable.value = true; return false }
  }
  function play(cue: ToyCue) {
    if (disposed || !enabled.value || context?.state !== 'running' || voices.size >= 12) return
    const active = context
    tones[cue].forEach((frequency, index) => {
      if (voices.size >= 12) return
      const oscillator = active.createOscillator(), gain = active.createGain()
      const start = active.currentTime + index * 0.07
      oscillator.type = cue === 'miss' ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(frequency, start)
      oscillator.frequency.exponentialRampToValueAtTime(cue === 'jump' ? frequency * 1.5 : frequency * 0.9, start + 0.13)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(cue === 'step' ? 0.014 : cue === 'land' ? 0.025 : 0.045, start + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
      oscillator.connect(gain).connect(active.destination)
      const voice = { oscillator, gain }
      voices.add(voice)
      oscillator.onended = () => { voices.delete(voice); oscillator.disconnect(); gain.disconnect() }
      oscillator.start(start); oscillator.stop(start + 0.19)
    })
  }
  function setMotor(speed: number | null, boost = false, gliding = false) {
    if (speed === null || disposed || !enabled.value || context?.state !== 'running') {
      motor?.stop(); motor = null
      return
    }
    if (!motor) {
      motor = createJokerMotorAudio(context)
    }
    motor.update(speed, boost, gliding)
  }
  function toggle() {
    enabled.value = !enabled.value
    if (!enabled.value) close()
    else void unlock()
  }
  onScopeDispose(() => { disposed = true; close() })
  return { enabled: readonly(enabled), unavailable: readonly(unavailable), unlock, play, setMotor, toggle, stop, close }
}
