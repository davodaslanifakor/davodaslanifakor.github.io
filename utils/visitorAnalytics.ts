export type AnalyticsChoice = 'accepted' | 'declined'
export const ANALYTICS_STORAGE_KEY = 'portfolio-analytics-consent-v1'
const MAX_AGE = 180 * 24 * 60 * 60 * 1000

interface AnalyticsOptions {
  containerId: string
  measurementId: string
  siteUrl: string
  production: boolean
  reload?: () => void
}
type AnalyticsWindow = Window & { dataLayer?: unknown[] }

/** Basic opt-in analytics. No Google script or queued visit exists before acceptance. */
export function createVisitorAnalytics(win: AnalyticsWindow, options: AnalyticsOptions) {
  const enabled = options.production && /^GTM-[A-Z0-9]+$/.test(options.containerId)
    && new URL(options.siteUrl).origin === win.location.origin
  let loaded = false, previousPage = ''
  let choice: AnalyticsChoice | null = null
  try {
    const saved = JSON.parse(win.localStorage.getItem(ANALYTICS_STORAGE_KEY) ?? 'null')
    if (saved && ['accepted', 'declined'].includes(saved.choice) && typeof saved.at === 'number'
      && Date.now() - saved.at >= 0 && Date.now() - saved.at < MAX_AGE) choice = saved.choice
  } catch { /* A blocked storage API leaves analytics off. */ }

  function load() {
    if (!enabled || loaded || choice !== 'accepted') return
    win.dataLayer ??= []
    win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    const script = win.document.createElement('script')
    script.id = 'portfolio-gtm'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${options.containerId}`
    win.document.head.append(script)
    loaded = true
  }

  function setChoice(next: AnalyticsChoice) {
    choice = next
    try { win.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify({ choice, at: Date.now() })) } catch { /* The current visit still honors the choice. */ }
    if (next === 'accepted') load()
    else if (loaded) {
      // Disable collection immediately, then unload the running Google code with a fresh document.
      ;(win as unknown as Record<string, unknown>)[`ga-disable-${options.measurementId}`] = true
      for (const cookie of win.document.cookie.split(';')) {
        const name = cookie.split('=')[0]?.trim() ?? ''
        if (!/^(_ga(?:_|$)|_gid$)/.test(name)) continue
        const expired = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
        win.document.cookie = expired
        const parts = win.location.hostname.split('.')
        for (let i = 0; i < parts.length - 1; i++) win.document.cookie = `${expired}; domain=${parts.slice(i).join('.')}`
      }
      ;(options.reload ?? (() => win.location.reload()))()
    }
  }

  function pageView(path: string, title: string) {
    if (!enabled || choice !== 'accepted') return
    const url = new URL(path, options.siteUrl)
    if (url.origin !== win.location.origin) return
    // Portfolio routes identify pages; query strings and fragments may contain private input.
    const page = `${url.origin}${url.pathname}`
    if (page === previousPage) return
    load()
    let referrer = previousPage
    if (!referrer && win.document.referrer) {
      try { referrer = new URL(win.document.referrer).origin } catch { /* Ignore malformed referrers. */ }
    }
    win.dataLayer!.push({ event: 'portfolio_page_view', page_location: page, page_title: title, page_referrer: referrer })
    previousPage = page
  }
  return { enabled, get choice() { return choice }, setChoice, pageView }
}
