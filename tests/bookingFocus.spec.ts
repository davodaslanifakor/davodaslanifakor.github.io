import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import MacBookBookingSurface from '../components/scene/MacBookBookingSurface.vue'

describe('booking keyboard focus', () => {
  for (const readyAtMount of [true, false]) {
    it(`focuses the return control when ready ${readyAtMount ? 'at mount' : 'after the camera moves'}`, async () => {
      const wrapper = mount(MacBookBookingSurface, {
        props: { active: readyAtMount, camera: null, model: null, locale: 'en' },
        attachTo: document.body,
        global: { stubs: { CalendlyBooking: { template: '<input aria-label="Calendar selection">' } } },
      })
      try {
        if (!readyAtMount) await wrapper.setProps({ active: true })
        await nextTick(); await nextTick()
        expect(document.activeElement).toBe(wrapper.get('.booking-back').element)
        const input = wrapper.get('input').element as HTMLInputElement
        input.focus()
        await wrapper.setProps({ active: false })
        expect(wrapper.attributes('inert')).toBeUndefined()
        await wrapper.setProps({ active: true })
        await nextTick()
        expect(document.activeElement).toBe(input)
      } finally { wrapper.unmount() }
    })
  }
})
