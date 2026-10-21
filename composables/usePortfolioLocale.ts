import type { Locale } from '~/content/portfolio'
import { enabledLocales } from '~/content/portfolio'

export function usePortfolioLocale() {
  const locale = useState<Locale>('portfolio-locale', () => 'en')
  const direction = computed(() => (locale.value === 'fa' ? 'rtl' : 'ltr'))

  function setLocale(next: Locale) {
    locale.value = next
    if (import.meta.client) {
      localStorage.setItem('portfolio-locale', next)
      document.documentElement.lang = next
      document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr'
    }
  }

  function toggleLocale() {
    setLocale(locale.value === 'en' ? 'fa' : 'en')
  }

  onMounted(() => {
    const saved = localStorage.getItem('portfolio-locale') as Locale | null
    setLocale(saved && enabledLocales.includes(saved) ? saved : enabledLocales[0] ?? 'en')
  })

  const canSwitchLocale = enabledLocales.length > 1

  return { locale, direction, setLocale, toggleLocale, canSwitchLocale }
}
