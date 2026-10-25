import type { Ref } from 'vue'

export function useStudioPortraitLens(target: Readonly<Ref<HTMLElement | null>>) {
  const { ready, reduced } = useStudioMotion()
  const selected = shallowRef(0)
  const supported = shallowRef(false)
  // Capability must remain stable when the browser hides a tab.
  const finePointer = shallowRef(false)
  const fullImage = computed(() => !finePointer.value || reduced.value || !supported.value)
  let query: MediaQueryList | undefined
  let needsIntent = false
  function updatePointer() { finePointer.value = query?.matches ?? false }
  function suspend() {
    needsIntent = true
    hovering = false
    center()
    target.value?.style.setProperty('--lens-radius', '0')
  }
  function visibility() { if (document.hidden) suspend() }
  function intent() { needsIntent = false }
  let disposed = false
  let hovering = false
  let motion: Awaited<ReturnType<typeof loadStudioMotion>>
  let context: ReturnType<NonNullable<typeof motion>['gsap']['context']> | undefined
  let xTo: ((value: number) => unknown) | undefined
  let yTo: ((value: number) => unknown) | undefined
  function center() {
    if (!target.value) return
    motion?.gsap.killTweensOf(target.value)
    target.value.style.setProperty('--lens-x', '50%')
    target.value.style.setProperty('--lens-y', '50%')
  }
  function reveal(event?: PointerEvent) {
    if (event?.pointerType === 'mouse') hovering = true
    if (needsIntent || document.hidden || fullImage.value || !target.value) return
    motion?.gsap.to(target.value, { '--lens-radius': 105, duration: 0.3, ease: 'power3.out', overwrite: 'auto' })
  }
  function move(event: PointerEvent) {
    if (fullImage.value || event.pointerType !== 'mouse' || !target.value) return
    const wasSuspended = needsIntent
    needsIntent = false
    if (wasSuspended || !hovering) reveal(event)
    const rect = target.value.getBoundingClientRect()
    xTo?.(Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)))
    yTo?.(Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)))
  }
  function leave() {
    hovering = false
    if (!target.value || fullImage.value) return
    motion?.gsap.to(target.value, { '--lens-radius': 0, duration: 0.25, ease: 'power3.out', overwrite: 'auto' })
  }
  function focus() { if (needsIntent) return; if (!hovering) center(); reveal() }
  watch(fullImage, () => { center(); target.value?.style.setProperty('--lens-radius', '0') })
  onMounted(async () => {
    query = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)')
    updatePointer()
    query.addEventListener('change', updatePointer)
    window.addEventListener('blur', suspend)
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('keydown', intent, true)
    document.addEventListener('pointerdown', intent, true)
    supported.value = CSS.supports('mask-image', 'radial-gradient(black, transparent)')
    motion = await loadStudioMotion()
    if (disposed || !target.value) return
    if (!motion) { supported.value = false; return }
    const root = target.value
    context = motion.gsap.context(() => {
      xTo = motion!.gsap.quickTo(root, '--lens-x', { duration: 0.28, ease: 'power3.out' })
      yTo = motion!.gsap.quickTo(root, '--lens-y', { duration: 0.28, ease: 'power3.out' })
    }, root)
  })
  onBeforeUnmount(() => {
    disposed = true
    query?.removeEventListener('change', updatePointer)
    window.removeEventListener('blur', suspend)
    document.removeEventListener('visibilitychange', visibility)
    document.removeEventListener('keydown', intent, true)
    document.removeEventListener('pointerdown', intent, true)
    if (target.value) motion?.gsap.killTweensOf(target.value)
    context?.revert()
  })
  return { ready, selected, fullImage, reveal, move, leave, focus, cycle: () => { selected.value = (selected.value + 1) % 3 } }
}
