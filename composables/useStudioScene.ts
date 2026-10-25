import type { Ref } from 'vue'

type StudioMotionModules = {
  gsap: typeof import('gsap')['gsap']
  ScrollTrigger: typeof import('gsap/ScrollTrigger')['ScrollTrigger']
}
export type StudioSceneContext = StudioMotionModules & { root: HTMLElement }

/** Shared smoothing for decorative scrubs. The career rail stays exactly scroll-linked. */
export const STUDIO_SCRUB = 0.35
export const STUDIO_DESKTOP =
  '(min-width: 1100px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)'
export const STUDIO_TABLET_UP =
  '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

let loader: Promise<StudioMotionModules | null> | undefined
/** One lazy motion chunk for every Studio section; failure keeps the static page. */
export function loadStudioMotion() {
  loader ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    .then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger)
      return { gsap, ScrollTrigger }
    })
    .catch(() => {
      loader = undefined
      return null
    })
  return loader
}

// Trigger positions go stale when content above them changes height
// (the practice disclosure, late fonts). One observer serves every scene.
let watchers = 0
let observer: ResizeObserver | undefined
let frame = 0
function watchLayout(ScrollTrigger: StudioMotionModules['ScrollTrigger']) {
  const main = document.getElementById('studio-main')
  if (watchers++ === 0 && main) {
    let height = main.offsetHeight
    observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (main.offsetHeight === height) return
        height = main.offsetHeight
        ScrollTrigger.refresh()
      })
    })
    observer.observe(main)
  }
  return () => {
    if (--watchers > 0) return
    observer?.disconnect()
    observer = undefined
    cancelAnimationFrame(frame)
  }
}

/**
 * Scroll-linked choreography for one section. `build` runs whenever `media`
 * matches; everything it creates is scoped to `target` and reverted when the
 * query stops matching or the component unmounts.
 */
export function useStudioScene(
  target: Readonly<Ref<HTMLElement | null>>,
  media: string,
  build: (scene: StudioSceneContext) => (() => void) | undefined,
) {
  let disposed = false
  let cleanup: (() => void) | undefined
  onMounted(async () => {
    // Font metrics determine every measured start and end position.
    await document.fonts.ready
    if (disposed || !target.value) return
    const motion = await loadStudioMotion()
    if (!motion || disposed || !target.value) return
    const root = target.value
    const matcher = motion.gsap.matchMedia()
    matcher.add(media, () => build({ ...motion, root }), root)
    const unwatch = watchLayout(motion.ScrollTrigger)
    cleanup = () => {
      unwatch()
      matcher.revert()
    }
  })
  onBeforeUnmount(() => {
    disposed = true
    cleanup?.()
  })
}
