import { computed, onScopeDispose, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export const ROOM_LIGHTING = {
  light: { background: '#c8c0b2', exposure: 1.05, hemisphere: 1.2, key: 3.2, fill: 1.1, environment: 0.8, wall: 0.8, shelf: 0.45, led: 2.4 },
  dark: { background: '#242524', exposure: 0.95, hemisphere: 0.25, key: 0.65, fill: 0.22, environment: 0.25, wall: 1.25, shelf: 0.65, led: 4 },
} as const

/** System preference owns lighting; no duplicate scene or persistent store state. */
export function useRoomLighting(reducedMotion: MaybeRefOrGetter<boolean>) {
  const dark = shallowRef(false)
  const blend = shallowRef(0)
  let query: MediaQueryList | null = null
  let frame = 0
  const preset = computed(() => {
    const day = ROOM_LIGHTING.light
    const night = ROOM_LIGHTING.dark
    const mix = (a: number, b: number) => blend.value === 0 ? a : blend.value === 1 ? b : a + (b - a) * blend.value
    return {
      background: dark.value ? night.background : day.background,
      exposure: mix(day.exposure, night.exposure),
      hemisphere: mix(day.hemisphere, night.hemisphere),
      key: mix(day.key, night.key), fill: mix(day.fill, night.fill),
      environment: mix(day.environment, night.environment),
      wall: mix(day.wall, night.wall), shelf: mix(day.shelf, night.shelf),
      led: mix(day.led, night.led),
    }
  })
  function sync() {
    dark.value = query?.matches ?? false
    cancelAnimationFrame(frame)
    const target = dark.value ? 1 : 0
    if (toValue(reducedMotion)) { blend.value = target; return }
    const from = blend.value
    const start = performance.now()
    function step(now: number) {
      const progress = Math.min(1, (now - start) / 450)
      blend.value = from + (target - from) * progress
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }
  if (import.meta.client) {
    query = window.matchMedia('(prefers-color-scheme: dark)')
    dark.value = query.matches
    blend.value = dark.value ? 1 : 0
    query.addEventListener('change', sync)
  }
  watch(() => toValue(reducedMotion), () => { if (import.meta.client) sync() })
  onScopeDispose(() => {
    if (import.meta.client) cancelAnimationFrame(frame)
    query?.removeEventListener('change', sync)
  })
  return { preset, dark: computed(() => dark.value) }
}
