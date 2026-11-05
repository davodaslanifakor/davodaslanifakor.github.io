import { nextTick, watch } from 'vue'
import { createVisitorAnalytics } from '~/utils/visitorAnalytics'

export default defineNuxtPlugin(nuxtApp => {
  const config = useRuntimeConfig().public
  const router = useRouter()
  const head = injectHead()
  const preference = useAnalyticsConsent()
  const tracker = createVisitorAnalytics(window, {
    containerId: config.gtmContainerId,
    measurementId: config.gaMeasurementId,
    siteUrl: config.siteUrl,
    production: !import.meta.dev,
  })
  const visit = () => tracker.pageView(router.currentRoute.value.path, document.title)
  let frame = 0, navigating = false
  const scheduleVisit = () => {
    if (!tracker.enabled || navigating || !preference.ready.value) return
    cancelAnimationFrame(frame)
    // Nuxt can finish a page before its head entries settle. Measure the rendered title.
    frame = requestAnimationFrame(visit)
  }
  head?.hooks?.hook('dom:rendered', scheduleVisit)
  nuxtApp.hook('page:start', () => { navigating = true; cancelAnimationFrame(frame) })
  nuxtApp.hook('app:mounted', async () => {
    // Restore after hydration so the SSR-first CV remains identical on the client.
    preference.choice.value = tracker.choice
    preference.enabled.value = tracker.enabled
    preference.ready.value = true
    watch(preference.choice, value => {
      if (!value) return
      tracker.setChoice(value)
      if (value === 'accepted') scheduleVisit()
    }, { flush: 'post' })
    await nextTick()
    scheduleVisit()
  })
  // Nuxt resumes its debounced head renderer at page:finish. Its dom:rendered
  // callback measures the navigation after the new title is actually committed.
  nuxtApp.hook('page:finish', () => { navigating = false })
})
