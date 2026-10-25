import type { InjectionKey, Ref } from 'vue'

interface StudioMotion {
  reduced: Readonly<Ref<boolean>>
  pointer: Readonly<Ref<boolean>>
  ready: Readonly<Ref<boolean>>
}
const motionKey: InjectionKey<StudioMotion> = Symbol('studio-motion')

export function provideStudioMotion() {
  const reduced = shallowRef(true)
  const pointer = shallowRef(false)
  const ready = shallowRef(false)
  let queries: MediaQueryList[] = []
  function update() {
    reduced.value = queries[0]?.matches ?? true
    pointer.value =
      !reduced.value && (queries[1]?.matches ?? false) && document.visibilityState === 'visible'
  }
  onMounted(() => {
    queries = [
      matchMedia('(prefers-reduced-motion: reduce)'),
      matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)'),
    ]
    queries.forEach((query) => query.addEventListener('change', update))
    document.addEventListener('visibilitychange', update)
    update()
    ready.value = true
  })
  onBeforeUnmount(() => {
    queries.forEach((query) => query.removeEventListener('change', update))
    document.removeEventListener('visibilitychange', update)
  })
  const motion = { reduced: readonly(reduced), pointer: readonly(pointer), ready: readonly(ready) }
  provide(motionKey, motion)
  return motion
}

export function useStudioMotion() {
  const motion = inject(motionKey)
  if (!motion) throw new Error('Studio motion requires StudioShell')
  return motion
}
