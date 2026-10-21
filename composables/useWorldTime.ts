import { onMounted, onScopeDispose, readonly, shallowRef } from 'vue'

/** One wall-clock source for the room scene, screen artwork and clock dialog. */
export function useWorldTime() {
  const epochMs = shallowRef(0)
  const reducedMotion = shallowRef(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  let media: MediaQueryList | undefined

  const clear = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  const sync = () => { epochMs.value = Date.now() }
  const schedule = () => {
    clear()
    if (document.visibilityState === 'hidden') return
    sync()
    const now = Date.now()
    const interval = reducedMotion.value ? 60_000 : 1_000
    timer = setTimeout(schedule, interval - (now % interval) + 8)
  }
  const visibility = () => document.visibilityState === 'hidden' ? clear() : schedule()
  const focus = () => { if (document.visibilityState !== 'hidden') schedule() }
  const motion = (event: MediaQueryListEvent) => {
    reducedMotion.value = event.matches
    schedule()
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.value = media.matches
    media.addEventListener('change', motion)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('focus', focus)
    schedule()
  })
  onScopeDispose(() => {
    clear()
    media?.removeEventListener('change', motion)
    document.removeEventListener('visibilitychange', visibility)
    window.removeEventListener('focus', focus)
  })

  return { epochMs: readonly(epochMs), reducedMotion: readonly(reducedMotion) }
}
