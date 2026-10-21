import { mount } from '@vue/test-utils'
import { effectScope } from 'vue'
import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import DeskInteractionHint from '../components/games/DeskInteractionHint.vue'
import DeskTypingInput from '../components/games/DeskTypingInput.vue'
import { useDeskMinion } from '../composables/useDeskMinion'
import { deskMinionFocus, measureDeskWorld } from '../utils/deskPlayground'
import { deskModel } from './helpers/deskModel'

describe('contextual Minion hints', () => {
  it('appears at nearby props, exposes a keyboard/touch action and hides during typing or transitions', async () => {
    const asset = deskModel(), world = measureDeskWorld(asset.model), scope = effectScope()
    const game = scope.run(() => useDeskMinion({ character: () => 'robot', world: () => world, reducedMotion: () => true, ready: () => true }))!
    const host = document.createElement('div'); document.body.append(host)
    const wrapper = mount(DeskInteractionHint, { attachTo: host, props: { state: game.state.value, nearby: null, world, locale: 'en', ready: true } })
    Object.defineProperties(wrapper.element.parentElement!, { clientWidth: { value: 390 }, clientHeight: { value: 844 } })
    Object.defineProperties(wrapper.element, { offsetWidth: { value: 180 }, offsetHeight: { value: 44 } })
    try {
      expect((wrapper.element as HTMLElement).style.display).toBe('none')
      await wrapper.setProps({ nearby: 'mouse' })
      expect((wrapper.element as HTMLElement).style.display).not.toBe('none')
      const frame = deskMinionFocus(world, 390 / 844, 844, world.front, true), camera = new PerspectiveCamera(38, 390 / 844, 0.05, 50)
      camera.position.copy(frame.position); camera.lookAt(frame.target); camera.updateMatrixWorld()
      wrapper.vm.updateFrame(camera)
      expect((wrapper.element as HTMLElement).style.transform).toContain('translate3d')
      await wrapper.setProps({ nearby: 'cable' })
      wrapper.vm.updateFrame(camera)
      const [x, y] = (wrapper.element as HTMLElement).style.transform.match(/-?\d+(?:\.\d+)?px/g)!.map(Number.parseFloat)
      const speaker = new Vector3(world.speaker!.x, world.speaker!.y, world.speaker!.z).project(camera)
      const sx = (speaker.x + 1) * 195, sy = (1 - speaker.y) * 422
      expect(Math.abs(sx - x!) < 90 && sy > y! - 44 && sy < y!).toBe(false)
      await wrapper.get('button').trigger('click')
      await wrapper.get('button').trigger('keydown', { key: 'e' })
      expect(wrapper.emitted('interact')).toHaveLength(2)
      await wrapper.setProps({ nearby: 'keyboard', state: { ...game.state.value, laptopOn: false } })
      expect(wrapper.get('button').attributes('disabled')).toBeDefined()
      await wrapper.setProps({ state: { ...game.state.value, typing: true } })
      expect((wrapper.element as HTMLElement).style.display).toBe('none')
      await wrapper.setProps({ state: game.state.value, ready: false })
      expect((wrapper.element as HTMLElement).style.display).toBe('none')
      await wrapper.setProps({ ready: true, locale: 'fa' })
      expect(wrapper.attributes('dir')).toBe('rtl')
    } finally { wrapper.unmount(); host.remove(); scope.stop(); asset.dispose() }
  })

  it('handles mobile input, paste and composition once without swallowing browser shortcuts', async () => {
    const wrapper = mount(DeskTypingInput, { attachTo: document.body, props: { locale: 'en', disabled: false } })
    try {
      const input = wrapper.get('input')
      await input.setValue('hi')
      expect(wrapper.emitted('type')).toEqual([['h'], ['i']])
      expect((input.element as HTMLInputElement).value).toBe('')
      await input.trigger('compositionstart')
      await input.setValue('ش')
      expect(wrapper.emitted('type')).toHaveLength(2)
      await input.trigger('compositionend')
      await input.trigger('input')
      expect(wrapper.emitted('type')).toEqual([['h'], ['i'], ['ش']])
      await input.trigger('keydown', { key: 'r', code: 'KeyR', metaKey: true })
      await input.trigger('keydown', { key: 'q', code: 'KeyQ', repeat: true })
      expect(wrapper.emitted('type')).toHaveLength(3)
      await input.trigger('keydown', { key: 'Escape' })
      expect(wrapper.emitted('exit')).toEqual([[]])
    } finally { wrapper.unmount() }
  })
})
