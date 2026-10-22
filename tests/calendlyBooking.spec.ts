import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CalendlyBooking from '../components/booking/CalendlyBooking.vue'

afterEach(() => vi.useRealTimers())

describe('Calendly loading', () => {
  it('embeds the supplied booking page and offers retry after a slow load', async () => {
    vi.useFakeTimers()
    const wrapper = mount(CalendlyBooking, { props: { locale: 'en' } })
    try {
      await wrapper.vm.$nextTick()
      const frame = wrapper.get('iframe')
      const url = new URL(frame.attributes('src')!)
      expect(url.origin + url.pathname).toBe('https://calendly.com/davodaslanifakor/request-call')
      expect(url.searchParams.get('embed_type')).toBe('Inline')
      expect(url.searchParams.get('embed_domain')).toBe(window.location.hostname)
      expect(frame.attributes('title')).toContain('Davoud')
      await vi.advanceTimersByTimeAsync(15000)
      expect(wrapper.get('[role="status"]').text()).toContain('Calendar taking a while?')
      await wrapper.get('button').trigger('click')
      expect(wrapper.get('iframe').element).not.toBe(frame.element)
      await wrapper.get('iframe').trigger('load')
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.attributes('aria-busy')).toBe('false')
    } finally { wrapper.unmount() }
    expect(vi.getTimerCount()).toBe(0)
  })
})
