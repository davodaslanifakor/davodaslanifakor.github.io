import type { Ref } from 'vue'
import type { ScrollTrigger as ScrollTriggerInstance } from 'gsap/ScrollTrigger'

/** A native-scroll enhancement. The server renders a complete vertical reading order. */
export function useStudioScroll(section: Readonly<Ref<HTMLElement | null>>) {
  let disposed = false
  let teardown: (() => void) | undefined

  onMounted(async () => {
    // Font metrics determine the real travel and whether the chapter fits vertically.
    await document.fonts.ready
    if (disposed || !section.value) return
    // A failed optional motion chunk must leave the readable baseline intact.
    const modules = await loadStudioMotion()
    if (!modules || disposed || !section.value) return
    const { gsap, ScrollTrigger } = modules
    const root = section.value
    const frame = root.querySelector<HTMLElement>('.studio-career-frame')!
    const viewport = root.querySelector<HTMLElement>('.studio-career-viewport')!
    const track = root.querySelector<HTMLElement>('.studio-career-track')!
    const chapters = [
      ...track.querySelectorAll<HTMLElement>('[data-career-chapter]'),
    ]
    const indexLinks = [
      ...root.querySelectorAll<HTMLAnchorElement>('.studio-career-index a'),
    ]
    const progressBar = root.querySelector<HTMLElement>(
      '.studio-career-progress',
    )
    const query = matchMedia(
      '(min-width: 1100px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)',
    )
    let context: ReturnType<typeof gsap.context> | undefined
    let rail: ScrollTriggerInstance | undefined
    let refreshFrame = 0
    let anchorFrame = 0
    let anchorFollowup = 0
    let lastWidth = innerWidth
    let lastHeight = innerHeight
    const travel = () => Math.max(0, track.scrollWidth - viewport.clientWidth)
    const headerOffset = () =>
      root.querySelector<HTMLElement>('.studio-career-controls')!.offsetHeight +
      68

    function revealChapter(chapter: HTMLElement, focus = false) {
      if (!rail) return
      const offset = Math.min(
        chapter.offsetLeft - chapters[0]!.offsetLeft,
        travel(),
      )
      // Instant movement for focus and anchors; no scroll hijacking or tween lag.
      window.scrollTo({ top: rail.start + offset, behavior: 'instant' })
      viewport.scrollLeft = 0
      ScrollTrigger.update()
      if (focus) chapter.focus({ preventScroll: true })
    }
    function syncHash() {
      cancelAnimationFrame(anchorFrame)
      cancelAnimationFrame(anchorFollowup)
      anchorFrame = requestAnimationFrame(() => {
        anchorFollowup = requestAnimationFrame(() => {
          if (disposed) return
          let id: string
          try {
            id = decodeURIComponent(location.hash.slice(1))
          } catch {
            return
          }
          const target = document.getElementById(id)
          if (!target || !root.closest('main')?.contains(target)) return
          const chapter = target.closest<HTMLElement>('[data-career-chapter]')
          if (chapter && rail) revealChapter(chapter, true)
          else target.scrollIntoView({ behavior: 'instant', block: 'start' })
        })
      })
    }
    function onFocus(event: FocusEvent) {
      const target = event.target as HTMLElement
      const chapter = target.closest<HTMLElement>('[data-career-chapter]')
      if (chapter && rail) revealChapter(chapter)
    }
    function restoreCareerFocus() {
      const target = document.activeElement
      if (!(target instanceof HTMLElement)) return
      const chapter = target.closest<HTMLElement>('[data-career-chapter]')
      if (!chapter || !root.contains(chapter)) return
      if (rail) revealChapter(chapter)
      else target.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }
    function onIndexClick(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        '.studio-career-index a',
      )
      if (
        !link ||
        !rail ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      event.preventDefault()
      if (location.hash !== link.hash) history.pushState(null, '', link.hash)
      const chapter = document.getElementById(link.hash.slice(1))
      if (chapter) revealChapter(chapter, true)
    }
    // The current chapter leads; the next one stays legible but recedes.
    function markCurrent(progress: number) {
      const offset = progress * travel()
      let current = 0
      chapters.forEach((chapter, index) => {
        if (
          chapter.offsetLeft - chapters[0]!.offsetLeft <=
          offset + viewport.clientWidth * 0.3
        )
          current = index
      })
      chapters.forEach((chapter, index) =>
        chapter.toggleAttribute('data-current', index === current),
      )
      indexLinks.forEach((link, index) => {
        if (index === current) link.setAttribute('aria-current', 'step')
        else link.removeAttribute('aria-current')
      })
      progressBar?.style.setProperty('transform', `scaleX(${progress})`)
    }
    function reset() {
      rail = undefined
      context?.revert()
      context = undefined
      delete root.dataset.layout
      track.style.removeProperty('transform')
      viewport.scrollLeft = 0
      indexLinks.forEach((link) => link.removeAttribute('aria-current'))
      chapters.forEach((chapter) => chapter.removeAttribute('data-current'))
      progressBar?.style.removeProperty('transform')
    }
    function setup() {
      reset()
      if (!query.matches) return
      root.dataset.layout = 'horizontal'
      // Content-size guard also handles enlarged text and future copy changes.
      if (frame.scrollHeight > innerHeight - headerOffset() || travel() < 1) {
        delete root.dataset.layout
        return
      }
      context = gsap.context(() => {
        const tween = gsap.to(track, {
          x: () => -travel(),
          ease: 'none',
          scrollTrigger: {
            trigger: frame,
            start: () => `top ${headerOffset()}`,
            end: () => `+=${travel()}`,
            pin: true,
            pinSpacing: true,
            scrub: true,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate(self) {
              markCurrent(self.progress)
            },
          },
        })
        rail = tween.scrollTrigger
      }, root)
      markCurrent(rail?.progress ?? 0)
    }
    function rebuild() {
      const active = rail?.isActive
      const progress = rail?.progress ?? 0
      const chapter =
        chapters[
          Math.min(
            chapters.length - 1,
            Math.round(progress * (chapters.length - 1)),
          )
        ]!
      setup()
      ScrollTrigger.refresh()
      if (active) {
        if (rail)
          window.scrollTo({
            top: rail.start + progress * travel(),
            behavior: 'instant',
          })
        else chapter.scrollIntoView({ block: 'start', behavior: 'instant' })
      }
    }
    function refresh() {
      if (disposed) return
      cancelAnimationFrame(refreshFrame)
      refreshFrame = requestAnimationFrame(() => {
        if (innerWidth !== lastWidth || innerHeight !== lastHeight) {
          lastWidth = innerWidth
          lastHeight = innerHeight
          rebuild()
        } else ScrollTrigger.refresh()
      })
    }
    setup()
    if (location.hash) syncHash()
    // Observe intrinsic track metrics, not the pin spacer that refresh itself changes.
    const observer = new ResizeObserver(refresh)
    observer.observe(track)
    document.addEventListener('focusin', onFocus)
    // A queued browser resize refresh can run after focus moves (notably WebKit).
    // Keep that focused chapter visible after the layout has finished reverting.
    ScrollTrigger.addEventListener('refresh', restoreCareerFocus)
    root.addEventListener('click', onIndexClick)
    window.addEventListener('hashchange', syncHash)
    window.addEventListener('popstate', syncHash)
    document.fonts.addEventListener('loadingdone', rebuild)
    window.addEventListener('resize', refresh)
    query.addEventListener('change', rebuild)
    const images = [...(root.parentElement?.querySelectorAll('img') ?? [])]
    images.forEach((img) => img.addEventListener('load', refresh))
    refresh()
    teardown = () => {
      observer.disconnect()
      cancelAnimationFrame(refreshFrame)
      cancelAnimationFrame(anchorFrame)
      cancelAnimationFrame(anchorFollowup)
      document.removeEventListener('focusin', onFocus)
      ScrollTrigger.removeEventListener('refresh', restoreCareerFocus)
      root.removeEventListener('click', onIndexClick)
      window.removeEventListener('hashchange', syncHash)
      window.removeEventListener('popstate', syncHash)
      document.fonts.removeEventListener('loadingdone', rebuild)
      window.removeEventListener('resize', refresh)
      query.removeEventListener('change', rebuild)
      images.forEach((img) => img.removeEventListener('load', refresh))
      reset()
    }
  })
  onBeforeUnmount(() => {
    disposed = true
    teardown?.()
  })
}
