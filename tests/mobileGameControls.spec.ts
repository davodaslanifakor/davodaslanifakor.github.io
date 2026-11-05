import { mount } from '@vue/test-utils'
import { effectScope } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import JokerMovementPad from '../components/games/JokerMovementPad.vue'
import DeskMinionControls from '../components/games/DeskMinionControls.vue'
import { useDeskMinion } from '../composables/useDeskMinion'
import { measureDeskWorld } from '../utils/deskPlayground'

for (const gameName of ['Minion', 'Joker'] as const) {
  describe(`${gameName} simultaneous touch controls`, () => {
    it('jumps with the second finger without releasing movement or jumping twice', async () => {
      const scope = effectScope()
      const game = scope.run(() => useDeskMinion({ character: () => 'robot', world: () => measureDeskWorld(null), reducedMotion: () => true, ready: () => true }))!
      const wrapper = gameName === 'Minion'
        ? mount(DeskMinionControls, { props: { state: game.state.value, locale: 'en', ready: true, soundOn: false, audioUnavailable: false } })
        : mount(JokerMovementPad, { props: { inCar: false, disabled: false, locale: 'en' } })
      try {
        const right = wrapper.get(gameName === 'Minion' ? '[aria-label="Move right"]' : '[aria-label="Right"]')
        const jump = wrapper.get(gameName === 'Minion' ? '.desk-minion__jump' : '.pad-jump')
        Object.assign(right.element, { setPointerCapture: vi.fn() })
        await right.trigger('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true })
        await jump.trigger('pointerdown', { pointerId: 2, pointerType: 'touch', isPrimary: false })
        expect(wrapper.emitted('jump')).toEqual([[]])
        expect(wrapper.emitted('move')).toEqual([['right', true]])
        await jump.trigger('pointerup', { pointerId: 2, pointerType: 'touch', isPrimary: false })
        await jump.trigger('click', { detail: 1 })
        expect(wrapper.emitted('jump')).toHaveLength(1)
        expect(wrapper.emitted('move')).toHaveLength(1)
        await right.trigger('pointercancel', { pointerId: 1 })
        expect(wrapper.emitted('move')?.at(-1)).toEqual(['right', false])
        // Native keyboard and assistive activation have no pointer click count.
        await jump.trigger('click', { detail: 0 })
        expect(wrapper.emitted('jump')).toHaveLength(2)
      } finally { wrapper.unmount(); scope.stop() }
    })
  })
}
