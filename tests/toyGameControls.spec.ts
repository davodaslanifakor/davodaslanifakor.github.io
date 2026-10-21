import { flushPromises, mount } from '@vue/test-utils'
import { effectScope } from 'vue'
import { describe, expect, it } from 'vitest'
import ToyGameControls from '../components/games/ToyGameControls.vue'
import { useJokerCardGame } from '../composables/useJokerCardGame'

describe('Joker keyboard and touch controls', () => {
  it('gates input, announces the clue/result and focuses the next action', async () => {
    const scope = effectScope()
    const game = scope.run(() => useJokerCardGame({ active: () => true, reducedMotion: () => true, random: () => 0.4 }))!
    const wrapper = mount(ToyGameControls, { attachTo: document.body, props: { state: game.state.value, locale: 'en', ready: false, reducedMotion: true } })
    try {
      expect(wrapper.get('button[data-primary]').attributes('disabled')).toBeDefined()
      await wrapper.setProps({ ready: true })
      await flushPromises()
      expect(document.activeElement?.textContent).toContain('Deal me in')
      await wrapper.get('button[data-primary]:not(:disabled)').trigger('click')
      expect(wrapper.emitted('start')).toEqual([[]])
      game.start()
      await wrapper.setProps({ state: game.state.value })
      expect(wrapper.get('[role="status"]').text()).toContain('card 2')
      expect(wrapper.findAll('.toy-game__choice').filter(button => button.text().includes('★'))).toHaveLength(1)
      await wrapper.get('button[data-primary]:not(:disabled)').trigger('click')
      expect(wrapper.emitted('shuffle')).toEqual([[]])
      game.shuffle()
      await wrapper.setProps({ state: game.state.value })
      await flushPromises()
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Card 1')
      expect(wrapper.text()).not.toContain('★')
      expect(wrapper.get('[role="status"]').text()).not.toContain('card 2')
      await wrapper.trigger('keydown', { key: '2' })
      expect(wrapper.emitted('pick')).toEqual([[1]])
      game.pick(1)
      await wrapper.setProps({ state: game.state.value })
      await flushPromises()
      expect(wrapper.get('[role="status"]').text()).toContain('You caught me!')
      expect(document.activeElement?.textContent).toContain('Play again')
      await wrapper.trigger('keydown', { key: '1' })
      expect(wrapper.emitted('pick')).toHaveLength(1)
      await wrapper.get('.toy-game__back').trigger('click')
      expect(wrapper.emitted('close')).toEqual([[]])
    } finally { wrapper.unmount(); scope.stop() }
  })

  it('uses Persian labels and lets visitors choose memory mode themselves', async () => {
    const scope = effectScope()
    const game = scope.run(() => useJokerCardGame({ active: () => true, reducedMotion: () => false }))!
    const wrapper = mount(ToyGameControls, { props: { state: game.state.value, locale: 'fa', ready: true, reducedMotion: false } })
    try {
      expect(wrapper.attributes('aria-label')).toBe('کارت من را پیدا کن')
      await wrapper.get('input').setValue(true)
      expect(wrapper.emitted('memory')).toEqual([[true]])
      expect(wrapper.get('[role="group"]').attributes('dir')).toBe('ltr')
    } finally { wrapper.unmount(); scope.stop() }
  })
})
