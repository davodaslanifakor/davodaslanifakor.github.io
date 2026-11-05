import { nextTick, watch } from 'vue'
import { createVisitorAnalytics } from '~/utils/visitorAnalytics'

export default defineNuxtPlugin(nuxtApp => {
  const config = useRuntimeConfig().public
  const router = useRouter()
  const preference = useAnalyticsConsent()
  const tracker = createVisitorAnalytics(window, {
    containerId: config.gtmContainerId,
    measurementId: config.gaMeasurementId,
    siteUrl: config.siteUrl,
    production: !import.meta.dev,
  })
  const visit = () => tracker.pageView(router.currentRoute.value.path, document.title)
  nuxtApp.hook('app:mounted', async () => {
    // Restore after hydration so the SSR-first CV remains identical on the client.
    preference.choice.value = tracker.choice
    preference.enabled.value = tracker.enabled
    preference.ready.value = true
    watch(preference.choice, value => {
      if (!value) return
      tracker.setChoice(value)
      if (value === 'accepted') void nextTick(visit)
    }, { flush: 'post' })
    await nextTick()
    visit()
  })
  nuxtApp.hook('page:finish', async () => { await nextTick(); visit() })
})
