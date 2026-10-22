import { mount } from '@vue/test-utils'
import { defineComponent, effectScope, h, nextTick, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import RoomLightControl from '../components/scene/RoomLightControl.vue'
import { useLightingIntro } from '../composables/useLightingIntro'
import { useRoomColors } from '../composables/useRoomColors'
import { ui } from '../content/portfolio'

const global = { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }

describe('room light control', () => {
  it('offers a CV link while the room loads and enables entry when ready', async () => {
    const wrapper = mount(RoomLightControl, { global, props: { phase: 'off', locale: 'en', ready: false } })
    try {
      expect(wrapper.get('button').attributes('disabled')).toBeDefined()
      expect(wrapper.get('a').attributes('href')).toBe('/cv')
      expect(wrapper.get('a').text()).toContain(ui.viewMyCv.en)
      expect(wrapper.get('[role="status"]').text()).toBe(ui.loadingRoom.en)
      await wrapper.setProps({ ready: true })
      expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      await wrapper.get('button').trigger('click')
      expect(wrapper.emitted('activate')).toHaveLength(1)
      await wrapper.setProps({ phase: 'on' })
      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.find('h2').exists()).toBe(false)
    } finally { wrapper.unmount() }
  })

  it('activates and replays the default RGB reveal with one button and respects reduced motion', async () => {
    const request = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42)
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const reduced = shallowRef(false)
    let intro!: ReturnType<typeof useLightingIntro>
    let colors!: ReturnType<typeof useRoomColors>
    const host = defineComponent({
      setup() {
        intro = useLightingIntro(reduced)
        colors = useRoomColors({ phase: intro.phase, reducedMotion: reduced, focused: false })
        return () => h(RoomLightControl, {
          phase: intro.phase.value, locale: 'en',
          onActivate: intro.activate, onReplay: intro.replay,
        })
      },
    })
    const wrapper = mount(host, { global, attachTo: document.body })
    const button = wrapper.get('button')
    try {
      expect(wrapper.findAll('button')).toHaveLength(1)
      expect(button.text()).toContain(ui.enterRoom.en)
      expect(intro.phase.value).toBe('off')
      expect(intro.progress.value).toBe(0)
      expect(colors.mode.value).toBe('rgb')
      expect(request).not.toHaveBeenCalled()
      await button.trigger('click', { detail: 1 })
      expect(intro.phase.value).toBe('revealing')
      expect(request).toHaveBeenCalledOnce()
      expect(button.text()).toContain(ui.replayRoomLights.en)
      await button.trigger('click', { detail: 0 })
      expect(intro.phase.value).toBe('on')
      expect(intro.progress.value).toBe(1)
      expect(request).toHaveBeenCalledOnce()
      await button.trigger('click', { detail: 1 })
      expect(intro.phase.value).toBe('revealing')
      expect(intro.progress.value).toBe(0)
      expect(request).toHaveBeenCalledTimes(2)
      reduced.value = true
      await nextTick()
      expect(intro.phase.value).toBe('on')
      expect(colors.mode.value).toBe('rgb')
      expect(colors.motion.value).toBe('static')
      await button.trigger('click', { detail: 1 })
      expect(intro.phase.value).toBe('on')
      expect(intro.progress.value).toBe(1)
      expect(request).toHaveBeenCalledTimes(2)
      expect(wrapper.findAll('button')).toHaveLength(1)
    } finally { wrapper.unmount(); request.mockRestore(); cancel.mockRestore() }
  })

  it('localizes the native button and routes nested clicks past the document starter', async () => {
    const scope = effectScope()
    const intro = scope.run(() => useLightingIntro(true))!
    const wrapper = mount(RoomLightControl, { global, props: { phase: 'off', locale: 'fa' }, attachTo: document.body })
    try {
      const button = wrapper.get('button')
      expect(wrapper.findAll('button')).toHaveLength(1)
      expect(button.text()).toContain(ui.enterRoom.fa)
      expect(button.attributes('type')).toBe('button')
      expect(button.attributes('data-light-control')).toBe('')
      expect(button.attributes('data-light-replay')).toBeUndefined()
      await button.get('span').trigger('click', { detail: 1 })
      expect(intro.phase.value).toBe('off')
      expect(wrapper.emitted('activate')).toHaveLength(1)
      expect(wrapper.emitted('replay')).toBeUndefined()
      await wrapper.setProps({ phase: 'on' })
      expect(button.text()).toContain(ui.replayRoomLights.fa)
      expect(button.attributes('data-light-replay')).toBe('')
      await button.trigger('click')
      expect(wrapper.emitted('replay')).toHaveLength(1)
      await wrapper.setProps({ locale: 'en' })
      expect(button.text()).toContain(ui.replayRoomLights.en)
    } finally { wrapper.unmount(); scope.stop() }
  })
})
