import type { InjectionKey, Ref } from 'vue'

export type StudioTheme = 'dark' | 'light'
export type StudioReveal = 'iris' | 'sweep'
interface StudioThemeState {
  theme: Readonly<Ref<StudioTheme>>
  ready: Readonly<Ref<boolean>>
  busy: Readonly<Ref<boolean>>
  reveal: Ref<StudioReveal>
  toggle: (event?: MouseEvent) => Promise<void>
}
const themeKey: InjectionKey<StudioThemeState> = Symbol('studio-theme')
const storageKey = 'portfolio-studio-theme'
const revealKey = 'portfolio-studio-reveal'

export function provideStudioTheme(reduced: Readonly<Ref<boolean>>) {
  const theme = shallowRef<StudioTheme>('dark')
  const ready = shallowRef(false)
  const busy = shallowRef(false)
  const reveal = shallowRef<StudioReveal>('iris')
  let transition: ViewTransition | undefined
  let animation: Animation | undefined
  let disposed = false

  useHead({
    htmlAttrs: { class: 'studio-document' },
    script: [
      {
        key: 'studio-theme-init',
        tagPriority: 'critical',
        innerHTML: `try{var studioTheme=localStorage.getItem('${storageKey}');if(studioTheme==='light')document.documentElement.setAttribute('data-studio-theme','light')}catch{}`,
      },
    ],
  })
  useHead(() => ({
    meta: [
      {
        name: 'theme-color',
        content: theme.value === 'dark' ? '#17171f' : '#f7f6f2',
      },
    ],
  }))

  function apply(next: StudioTheme) {
    theme.value = next
    document.documentElement.setAttribute('data-studio-theme', next)
  }

  async function toggle(event?: MouseEvent) {
    if (busy.value || disposed) return
    const next = theme.value === 'dark' ? 'light' : 'dark'
    const update = async () => {
      if (disposed) return
      apply(next)
      try {
        localStorage.setItem(storageKey, next)
      } catch {
        /* The page still switches without storage. */
      }
      await nextTick()
    }
    if (reduced.value || !document.startViewTransition) {
      await update()
      return
    }
    const target =
      event?.currentTarget instanceof HTMLElement
        ? event.currentTarget.getBoundingClientRect()
        : null
    const x = event?.detail
      ? event.clientX
      : target
        ? target.x + target.width / 2
        : innerWidth / 2
    const y = event?.detail
      ? event.clientY
      : target
        ? target.y + target.height / 2
        : innerHeight / 2
    const radius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    )
    busy.value = true
    document.documentElement.dataset.studioTransition = 'active'
    try {
      transition = document.startViewTransition(update)
      await transition.ready
      if (disposed) return
      const frames =
        reveal.value === 'iris'
          ? [
              { clipPath: `circle(0px at ${x}px ${y}px)` },
              { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
            ]
          : [
              {
                clipPath: 'polygon(-12% 0, -12% 0, 0 100%, -12% 100%)',
                transform: 'translateX(-12px)',
              },
              {
                clipPath: 'polygon(-12% 0, 100% 0, 112% 100%, -12% 100%)',
                transform: 'translateX(0)',
              },
            ]
      animation = document.documentElement.animate(frames, {
        duration: reveal.value === 'iris' ? 760 : 650,
        easing: 'cubic-bezier(.22,1,.36,1)',
        pseudoElement: '::view-transition-new(root)',
      })
      await animation.finished
      await transition.finished
    } catch {
      transition?.skipTransition()
      if (!disposed && theme.value !== next) await update()
    } finally {
      busy.value = false
      delete document.documentElement.dataset.studioTransition
      transition = undefined
      animation = undefined
    }
  }

  function sync(event: StorageEvent) {
    if (event.key === revealKey) {
      reveal.value = event.newValue === 'sweep' ? 'sweep' : 'iris'
      return
    }
    if (event.key !== storageKey && event.key !== null) return
    transition?.skipTransition()
    animation?.cancel()
    apply(event.newValue === 'light' ? 'light' : 'dark')
  }
  watch(reduced, (value) => {
    if (value) {
      transition?.skipTransition()
      animation?.cancel()
    }
  })
  watch(reveal, (value) => {
    if (ready.value) {
      try {
        localStorage.setItem(revealKey, value)
      } catch {
        /* Session choice still works. */
      }
    }
  })
  onMounted(() => {
    try {
      apply(localStorage.getItem(storageKey) === 'light' ? 'light' : 'dark')
    } catch {
      apply('dark')
    }
    try {
      reveal.value =
        localStorage.getItem(revealKey) === 'sweep' ? 'sweep' : 'iris'
    } catch {
      /* Default to the iris. */
    }
    ready.value = true
    window.addEventListener('storage', sync)
  })
  onBeforeUnmount(() => {
    disposed = true
    transition?.skipTransition()
    animation?.cancel()
    window.removeEventListener('storage', sync)
    document.documentElement.removeAttribute('data-studio-theme')
    delete document.documentElement.dataset.studioTransition
  })
  const state = {
    theme: readonly(theme),
    ready: readonly(ready),
    busy: readonly(busy),
    reveal,
    toggle,
  }
  provide(themeKey, state)
  return state
}

export function useStudioTheme() {
  const state = inject(themeKey)
  if (!state) throw new Error('Studio theme requires StudioShell')
  return state
}
