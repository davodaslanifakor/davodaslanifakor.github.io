export function useAmbientSound() {
  let context: AudioContext | null = null
  let gain: GainNode | null = null
  let oscillator: OscillatorNode | null = null

  async function setEnabled(enabled: boolean) {
    if (!import.meta.client) return
    if (!enabled) {
      gain?.gain.exponentialRampToValueAtTime(0.0001, (context?.currentTime ?? 0) + 0.25)
      window.setTimeout(() => {
        oscillator?.stop()
        oscillator = null
        context?.close()
        context = null
      }, 300)
      return
    }

    context = new AudioContext()
    gain = context.createGain()
    oscillator = context.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = 52
    gain.gain.value = 0.0001
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(0.018, context.currentTime + 0.5)
  }

  onBeforeUnmount(() => {
    oscillator?.stop()
    context?.close()
  })

  return { setEnabled }
}
