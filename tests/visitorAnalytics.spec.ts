import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ANALYTICS_STORAGE_KEY, createVisitorAnalytics } from '../utils/visitorAnalytics'

const options = { containerId: 'GTM-K476LTTM', measurementId: 'G-0BSYHK9K9J', siteUrl: window.location.origin, production: true }
const analyticsWindow = window as Window & { dataLayer?: unknown[] }
const pageEvents = () => (analyticsWindow.dataLayer ?? []).filter((event): event is Record<string, unknown> => typeof event === 'object' && event !== null && 'event' in event && event.event === 'portfolio_page_view')

beforeEach(() => {
  localStorage.removeItem(ANALYTICS_STORAGE_KEY)
  document.getElementById('portfolio-gtm')?.remove()
  delete analyticsWindow.dataLayer
  vi.restoreAllMocks()
})

describe('visitor analytics', () => {
  it('does not load Google or queue visits before consent, including rejection', () => {
    const tracker = createVisitorAnalytics(analyticsWindow, options)
    tracker.pageView('/studio', 'Studio')
    expect(document.getElementById('portfolio-gtm')).toBeNull()
    expect(analyticsWindow.dataLayer).toBeUndefined()
    tracker.setChoice('declined')
    tracker.pageView('/cv', 'CV')
    expect(document.getElementById('portfolio-gtm')).toBeNull()
    expect(analyticsWindow.dataLayer).toBeUndefined()
    expect(createVisitorAnalytics(analyticsWindow, options).choice).toBe('declined')
  })

  it('loads one container after acceptance and measures each distinct route once without private URL input', () => {
    const tracker = createVisitorAnalytics(analyticsWindow, options)
    tracker.setChoice('accepted')
    tracker.pageView('/studio?email=private@example.com#private', 'Studio')
    tracker.pageView('/studio?other=value', 'Studio')
    tracker.pageView('/cv', 'CV')
    tracker.pageView('/studio', 'Studio')
    expect(document.querySelectorAll('#portfolio-gtm')).toHaveLength(1)
    expect((document.getElementById('portfolio-gtm') as HTMLScriptElement).src).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-K476LTTM')
    expect(pageEvents()).toEqual([
      { event: 'portfolio_page_view', page_location: `${window.location.origin}/studio`, page_title: 'Studio', page_referrer: '' },
      { event: 'portfolio_page_view', page_location: `${window.location.origin}/cv`, page_title: 'CV', page_referrer: `${window.location.origin}/studio` },
      { event: 'portfolio_page_view', page_location: `${window.location.origin}/studio`, page_title: 'Studio', page_referrer: `${window.location.origin}/cv` },
    ])
    expect(JSON.stringify(analyticsWindow.dataLayer)).not.toContain('private')
    expect(createVisitorAnalytics(analyticsWindow, options).choice).toBe('accepted')
  })

  it('honors saved consent and expires old or malformed preferences safely', () => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify({ choice: 'accepted', at: Date.now() }))
    const tracker = createVisitorAnalytics(analyticsWindow, options)
    tracker.pageView('/cv', 'CV')
    expect(pageEvents()).toHaveLength(1)
    for (const saved of ['invalid JSON', JSON.stringify({ choice: 'accepted', at: 0 }), JSON.stringify({ choice: 'yes', at: Date.now() })]) {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, saved)
      expect(createVisitorAnalytics(analyticsWindow, options).choice).toBeNull()
    }
  })

  it.each([
    { production: false }, { siteUrl: 'https://another-site.example' }, { containerId: 'invalid' },
  ])('does not track development, preview origins or invalid containers: %j', override => {
    const tracker = createVisitorAnalytics(analyticsWindow, { ...options, ...override })
    tracker.setChoice('accepted'); tracker.pageView('/cv', 'CV')
    expect(tracker.enabled).toBe(false)
    expect(document.getElementById('portfolio-gtm')).toBeNull()
    expect(analyticsWindow.dataLayer).toBeUndefined()
  })

  it('stops collecting and reloads with a persisted rejection when consent is withdrawn', () => {
    const reload = vi.fn(), tracker = createVisitorAnalytics(analyticsWindow, { ...options, reload })
    tracker.setChoice('accepted'); tracker.pageView('/cv', 'CV')
    document.cookie = '_ga=example; path=/'
    document.cookie = '_ga_0BSYHK9K9J=example; path=/'
    document.cookie = 'portfolio-theme=dark; path=/'
    tracker.setChoice('declined'); tracker.pageView('/studio', 'Studio')
    expect(reload).toHaveBeenCalledOnce()
    expect(pageEvents()).toHaveLength(1)
    expect((window as unknown as Record<string, unknown>)['ga-disable-G-0BSYHK9K9J']).toBe(true)
    expect(document.cookie).not.toMatch(/_ga=/)
    expect(document.cookie).not.toMatch(/_ga_0BSYHK9K9J=/)
    expect(document.cookie).toContain('portfolio-theme=dark')
    expect(createVisitorAnalytics(analyticsWindow, options).choice).toBe('declined')
  })

  it('stays off if saved preferences cannot be read, and honors the current choice if storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
    const tracker = createVisitorAnalytics(analyticsWindow, options)
    expect(tracker.choice).toBeNull()
    tracker.pageView('/cv', 'CV'); expect(pageEvents()).toHaveLength(0)
    tracker.setChoice('accepted'); tracker.pageView('/cv', 'CV')
    expect(pageEvents()).toHaveLength(1)
  })
})
