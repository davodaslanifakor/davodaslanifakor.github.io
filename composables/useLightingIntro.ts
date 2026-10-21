import { computed, onScopeDispose, readonly, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export type LightPhase = 'off' | 'revealing' | 'on'
export const LIGHT_REVEAL_DURATION = 1800

function ramp(progress: number, start: number, end: number) {
  const value = Math.min(1, Math.max(0, (progress - start) / (end - start)))
  return value * value * (3 - 2 * value)
}

/** Transient, scene-owned intro; never consumes the click's original action. */
export function useLightingIntro(reducedMotion: MaybeRefOrGetter<boolean>) {
  const phase = shallowRef<LightPhase>('off')
  const progress = shallowRef(0)
  let frame = 0

  function finish() {
    cancelAnimationFrame(frame)
    frame = 0
    progress.value = 1
    phase.value = 'on'
  }

  function start(event: MouseEvent) {
    cancelAnimationFrame(frame)
    frame = 0
    if (event.detail === 0 || toValue(reducedMotion)) { finish(); return }
    progress.value = 0
    phase.value = 'revealing'
    const started = performance.now()
    function step(now: number) {
      progress.value = Math.min(1, (now - started) / LIGHT_REVEAL_DURATION)
      if (progress.value === 1) finish()
      else frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }

  function activate(event: MouseEvent) {
    if (phase.value === 'off') start(event)
  }

  function firstClick(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest('[data-light-control], [data-light-replay]')) return
    activate(event)
  }

  // Capture also observes clicks whose editor/modal handlers stop propagation.
  // It never prevents default, stops propagation, or changes navigation/focus.
  if (import.meta.client) document.addEventListener('click', firstClick, { capture: true, passive: true })
  watch(() => toValue(reducedMotion), (reduce) => {
    if (reduce && phase.value === 'revealing') finish()
  })
  onScopeDispose(() => {
    if (import.meta.client) {
      cancelAnimationFrame(frame)
      document.removeEventListener('click', firstClick, true)
    }
  })

  return {
    phase: readonly(phase), progress: readonly(progress), activate, replay: start,
    illumination: computed(() => ramp(progress.value, 0.12, 1)),
    accents: computed(() => ramp(progress.value, 0.46, 1)),
  }
}
