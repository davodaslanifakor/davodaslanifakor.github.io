import type { Ref } from 'vue'

/**
 * Stacked chapters: each `[data-stack]` layer scrolls until its last viewport is
 * on screen, then holds while the next layer slides up over it. Plain CSS
 * `position: sticky`; this only supplies each layer's height and keeps
 * ScrollTrigger measuring the unstuck layout.
 */
export function useStudioStack(container: Readonly<Ref<HTMLElement | null>>) {
  let disposed = false
  let teardown: (() => void) | undefined
  onMounted(async () => {
    const root = container.value
    if (!root) return
    const layers = [...root.querySelectorAll<HTMLElement>('[data-stack]')]
    if (!layers.length) return
    const setHeight = (layer: HTMLElement) =>
      layer.style.setProperty('--stack-h', `${layer.offsetHeight}px`)
    const observer = new ResizeObserver((entries) =>
      entries.forEach((entry) => setHeight(entry.target as HTMLElement)),
    )
    layers.forEach((layer) => {
      setHeight(layer)
      observer.observe(layer)
    })
    // Sticky is enabled only once heights exist, so no-JS reading stays linear.
    root.dataset.stacked = ''
    const detach: (() => void)[] = []
    teardown = () => {
      observer.disconnect()
      detach.forEach((stop) => stop())
      delete root.dataset.stacked
      delete root.dataset.measuring
      layers.forEach((layer) => layer.style.removeProperty('--stack-h'))
    }
    // A stuck layer reports an offset position; triggers must measure the flow.
    const motion = await loadStudioMotion()
    if (!motion || disposed) return
    const { ScrollTrigger } = motion
    const measure = () => {
      root.dataset.measuring = ''
    }
    const settle = () => {
      delete root.dataset.measuring
    }
    ScrollTrigger.addEventListener('refreshInit', measure)
    ScrollTrigger.addEventListener('refresh', settle)
    detach.push(() => {
      ScrollTrigger.removeEventListener('refreshInit', measure)
      ScrollTrigger.removeEventListener('refresh', settle)
    })
    ScrollTrigger.refresh()
  })
  onBeforeUnmount(() => {
    disposed = true
    teardown?.()
  })
}
