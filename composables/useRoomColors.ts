import { computed, onScopeDispose, readonly, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { MusicPlayback } from '~/utils/musicPlayback'
import type { LightPhase } from './useLightingIntro'
import type { RoomColorMode } from '~/utils/roomColorPalette'

/** Scene-local preferences and clock; the existing scene RAF supplies frames. */
export function useRoomColors(options: {
  reducedMotion: MaybeRefOrGetter<boolean>
  phase: MaybeRefOrGetter<LightPhase>
  focused: MaybeRefOrGetter<boolean>
  music?: MaybeRefOrGetter<MusicPlayback | undefined>
}) {
  const musicPulse = shallowRef(1)
  const musicDrive = shallowRef(0)
  const playing = computed(() => Boolean(toValue(options.music)?.playing))
  const mode = shallowRef<RoomColorMode>('rgb')
  const paused = shallowRef(false)
  const hidden = shallowRef(import.meta.client && document.hidden)
  const motion = computed<'running' | 'paused' | 'static'>(() => {
    if (mode.value === 'warm' || toValue(options.reducedMotion)) return 'static'
    return paused.value || hidden.value || toValue(options.phase) === 'off' || (toValue(options.focused) && !playing.value)
      ? 'paused' : 'running'
  })
  let seconds = 0
  let previousTime: number | null = null
  // Invalidate the timestamp on both edges, including when the browser suspends
  // RAF completely. Resume never accumulates time spent paused or out of view.
  watch(motion, () => { previousTime = null }, { flush: 'sync' })
  function visibilityChanged() { hidden.value = document.hidden }
  if (import.meta.client) document.addEventListener('visibilitychange', visibilityChanged)
  onScopeDispose(() => {
    if (import.meta.client) document.removeEventListener('visibilitychange', visibilityChanged)
  })

  function updateFrame(time: number) {
    const music = toValue(options.music)
    musicPulse.value = 1
    let reactiveMusic = false
    if (motion.value === 'running') {
      if (music?.playing) {
        const position = music.positionMs + Math.max(0, time - music.sampledAt)
        if (position < music.durationMs) {
          // Dim as well as brighten: brighter-only pulses disappear in the LED cores.
          musicPulse.value = 0.72 + 0.5 * (0.5 - 0.5 * Math.cos(position / 750 * Math.PI * 2))
          reactiveMusic = true
        }
      }
      if (previousTime !== null) seconds += Math.max(0, time - previousTime) / 1000 * (reactiveMusic ? 9 : 1)
      // Ease into coherent traveling color bands, without a sudden palette jump.
      const delta = previousTime === null ? 0 : Math.min(100, Math.max(0, time - previousTime))
      musicDrive.value += ((reactiveMusic ? 1 : 0) - musicDrive.value) * (1 - Math.exp(-delta / 220))
      previousTime = time
    } else { previousTime = null; musicDrive.value = 0 }
    return seconds
  }

  return {
    musicPulse: readonly(musicPulse), musicDrive: readonly(musicDrive),
    mode: readonly(mode), paused: readonly(paused), motion,
    canPause: computed(() => mode.value === 'rgb' && !toValue(options.reducedMotion)),
    setMode(value: RoomColorMode) { mode.value = value },
    togglePaused() { paused.value = !paused.value },
    updateFrame,
  }
}
