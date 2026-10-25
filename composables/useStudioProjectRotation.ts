import type { Ref } from 'vue'

/** One reading interval per project; never replace a link while it is in use. */
export function useStudioProjectRotation(root: Readonly<Ref<HTMLElement | null>>, count: number, interval = 7000) {
  const { ready, reduced } = useStudioMotion()
  const selected = shallowRef(0)
  const paused = shallowRef(false)
  const hovered = shallowRef(false)
  const focused = shallowRef(false)
  const visible = shallowRef(false)
  const documentVisible = shallowRef(false)
  const playing = computed(() => ready.value && !reduced.value && !paused.value && !hovered.value && !focused.value && visible.value && documentVisible.value && count > 1)
  let timer: ReturnType<typeof setTimeout> | undefined
  let observer: IntersectionObserver | undefined
  function clear() {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  function schedule() {
    clear()
    if (playing.value) timer = setTimeout(() => {
      selected.value = (selected.value + 1) % count
      schedule()
    }, interval)
  }
  function select(index: number) {
    selected.value = index
    schedule()
  }
  function focusOut(event: FocusEvent) {
    focused.value = event.relatedTarget instanceof Node && !!root.value?.contains(event.relatedTarget)
  }
  function visibility() { documentVisible.value = document.visibilityState === 'visible' }
  watch(playing, schedule)
  onMounted(() => {
    visibility()
    document.addEventListener('visibilitychange', visibility)
    observer = new IntersectionObserver(([entry]) => {
      visible.value = !!entry?.isIntersecting && entry.intersectionRatio >= 0.25
    }, { threshold: [0, 0.25] })
    if (root.value) observer.observe(root.value)
  })
  onBeforeUnmount(() => {
    clear()
    observer?.disconnect()
    document.removeEventListener('visibilitychange', visibility)
  })
  return { selected, paused, playing, hovered, focused, select, focusOut, toggle: () => { paused.value = !paused.value } }
}
