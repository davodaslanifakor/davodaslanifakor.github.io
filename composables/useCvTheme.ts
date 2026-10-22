export type CvTheme = 'light' | 'dark'

const storageKey = 'portfolio-cv-theme'

function parseTheme(value: string | null): CvTheme | null {
  return value === 'light' || value === 'dark' ? value : null
}

/** CV-only preference: keep the document theme independent of the room store. */
export function useCvTheme() {
  const preference = shallowRef<CvTheme | null>(null)
  const systemDark = shallowRef(false)
  const themeReady = shallowRef(false)
  const theme = computed<CvTheme>(() => preference.value ?? (systemDark.value ? 'dark' : 'light'))
  let media: MediaQueryList | undefined

  // Static hosting cannot read localStorage during SSR. Apply an explicit choice
  // before paint; CSS follows the system when no choice exists or JS is disabled.
  useHead({
    script: [{
      key: 'cv-theme-init',
      tagPriority: 'critical',
      innerHTML: `try{var cvTheme=localStorage.getItem(${JSON.stringify(storageKey)});if(cvTheme==='light'||cvTheme==='dark')document.documentElement.setAttribute('data-cv-theme',cvTheme)}catch{}`,
    }],
  })

  function applyPreference() {
    if (preference.value) document.documentElement.setAttribute('data-cv-theme', preference.value)
    else document.documentElement.removeAttribute('data-cv-theme')
  }

  function toggleTheme() {
    preference.value = theme.value === 'dark' ? 'light' : 'dark'
    applyPreference()
    try { localStorage.setItem(storageKey, preference.value) } catch { /* Still usable when storage is blocked. */ }
  }

  function updateSystem(event: MediaQueryListEvent) {
    systemDark.value = event.matches
  }

  function syncPreference(event: StorageEvent) {
    if (event.key !== storageKey && event.key !== null) return
    preference.value = parseTheme(event.newValue)
    applyPreference()
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = media.matches
    try { preference.value = parseTheme(localStorage.getItem(storageKey)) } catch { /* Use the system theme. */ }
    applyPreference()
    media.addEventListener('change', updateSystem)
    window.addEventListener('storage', syncPreference)
    themeReady.value = true
  })

  onBeforeUnmount(() => {
    media?.removeEventListener('change', updateSystem)
    window.removeEventListener('storage', syncPreference)
    document.documentElement.removeAttribute('data-cv-theme')
  })

  return { theme, themeReady: readonly(themeReady), toggleTheme }
}
