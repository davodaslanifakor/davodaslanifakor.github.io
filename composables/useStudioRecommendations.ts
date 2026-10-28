import type { Ref } from 'vue'
import type { ScrollTrigger as ScrollTriggerInstance } from 'gsap/ScrollTrigger'

/** Native scrolling is the input; the wheel never captures wheel/touch events. */
export function useStudioRecommendations(root: Readonly<Ref<HTMLElement | null>>, count: number) {
  const active = shallowRef(0)
  const layout = shallowRef<'list' | 'slider' | 'wheel'>('list')
  const listMode = shallowRef(false)
  const ready = shallowRef(false)
  let rail: ScrollTriggerInstance | undefined
  let dispose: (() => void) | undefined
  let disposed = false

  function goTo(index: number) {
    const next = Math.max(0, Math.min(count - 1, index))
    if (rail) {
      // Controls share exactly the same timeline as native scrolling.
      window.scrollTo({ top: rail.start + (rail.end - rail.start) * next / (count - 1), behavior: 'instant' })
    } else {
      const track = root.value?.querySelector<HTMLElement>('.recommendation-track')
      const card = track?.children[next] as HTMLElement | undefined
      if (track && card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' })
    }
    active.value = next
  }
  function onTrackScroll() {
    if (layout.value !== 'slider') return
    const track = root.value?.querySelector<HTMLElement>('.recommendation-track')
    if (!track) return
    let closest = Infinity
    Array.from(track.children).forEach((child, index) => {
      const distance = Math.abs((child as HTMLElement).offsetLeft - track.offsetLeft - track.scrollLeft)
      if (distance < closest) { closest = distance; active.value = index }
    })
  }
  function toggleList() {
    listMode.value = !listMode.value
    nextTick(() => root.value?.scrollIntoView({ block: 'start', behavior: 'instant' }))
  }

  onMounted(async () => {
    await document.fonts.ready
    if (disposed || !root.value) return
    const motion = await loadStudioMotion()
    if (disposed || !root.value) return
    const section = root.value
    const frame = section.querySelector<HTMLElement>('.recommendation-frame')!
    const sphereGrid = section.querySelector<SVGElement>('.recommendation-sphere-grid')
    const cards = Array.from(section.querySelectorAll<HTMLElement>('.recommendation-card'))
    const desktop = matchMedia('(min-width: 1100px) and (min-height: 740px)')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let context: ReturnType<NonNullable<typeof motion>['gsap']['context']> | undefined
    let resizeFrame = 0
    let lastWidth = innerWidth
    let lastHeight = innerHeight
    const reset = () => {
      context?.revert()
      context = undefined
      rail = undefined
      cards.forEach(card => { card.inert = false; card.removeAttribute('aria-hidden') })
    }
    function setup() {
      reset()
      if (listMode.value || reduced.matches || !motion) { layout.value = 'list'; return }
      layout.value = desktop.matches ? 'wheel' : 'slider'
      if (layout.value !== 'wheel') return
      // Apply the enhanced layout before measuring. GSAP context owns all styles.
      section.dataset.layout = 'wheel'
      if (cards.some(card => card.scrollHeight > frame.clientHeight * 0.7)) {
        layout.value = 'list'
        section.dataset.layout = 'list'
        return
      }
      const { gsap, ScrollTrigger } = motion
      context = gsap.context(() => {
        const position = { value: active.value }
        const paint = () => {
          const current = Math.round(position.value)
          if (active.value !== current) active.value = current
          const radius = frame.clientWidth * 0.46
          const centerX = -frame.clientWidth * 0.1
          const centerY = frame.clientHeight * 0.56
          if (sphereGrid) gsap.set(sphereGrid, { rotation: -position.value * 8, transformOrigin: '50% 50%' })
          cards.forEach((card, index) => {
            const distance = index - position.value
            const angle = Math.max(-3, Math.min(3, distance)) * 0.82
            const recession = 1 - Math.cos(angle)
            const visible = Math.abs(distance) < 2.2
            gsap.set(card, {
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius * 0.84 - card.offsetHeight / 2,
              // Shared camera projection supplies the scale: cards turn away and
              // recede behind the front plane as they travel around the volume.
              z: -radius * recession * 1.15 - Math.abs(distance) * 90,
              rotationX: -Math.sin(angle) * 42,
              rotationY: -Math.min(1, Math.abs(distance)) * 24,
              rotationZ: Math.sin(angle) * 9,
              scale: 1,
              filter: `blur(${Math.min(2.2, Math.abs(distance) * 1.3)}px)`,
              '--card-light': `${100 - Math.min(1, Math.abs(distance)) * 28}%`,
              opacity: visible ? 1 - Math.min(1, Math.abs(distance) / 2.2) * 0.85 : 0,
              visibility: visible ? 'visible' : 'hidden',
              zIndex: Math.abs(distance) < 0.5 ? 2 : 1,
            })
            card.inert = index !== current
            card.setAttribute('aria-hidden', String(index !== current))
          })
        }
        gsap.fromTo(position, { value: 0 }, {
          value: count - 1, ease: 'none', onUpdate: paint,
          scrollTrigger: {
            id: 'studio-recommendations', trigger: frame, start: 'top 68px',
            end: () => `+=${(count - 1) * Math.min(460, innerHeight * 0.55)}`,
            pin: true, pinSpacing: true, scrub: 0.45, invalidateOnRefresh: true,
            snap: { snapTo: 1 / (count - 1), duration: { min: 0.15, max: 0.3 }, delay: 0.15, inertia: false },
            onRefresh: paint,
          },
        })
        rail = ScrollTrigger.getById('studio-recommendations')
        paint()
      }, section)
    }
    function resize() {
      if (innerWidth === lastWidth && innerHeight === lastHeight) return
      lastWidth = innerWidth; lastHeight = innerHeight
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => { setup(); motion?.ScrollTrigger.refresh() })
    }
    function preferenceChanged() { setup(); motion?.ScrollTrigger.refresh() }
    const stop = watch(listMode, preferenceChanged, { flush: 'post' })
    setup()
    ready.value = true
    motion?.ScrollTrigger.refresh()
    reduced.addEventListener('change', preferenceChanged)
    window.addEventListener('resize', resize)
    dispose = () => {
      stop(); reset(); cancelAnimationFrame(resizeFrame)
      reduced.removeEventListener('change', preferenceChanged)
      window.removeEventListener('resize', resize)
    }
  })
  onBeforeUnmount(() => { disposed = true; dispose?.() })
  return { active: readonly(active), layout: readonly(layout), listMode: readonly(listMode), ready: readonly(ready), goTo, onTrackScroll, toggleList }
}
