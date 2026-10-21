import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { useJokerAdventure } from '../composables/useJokerAdventure'
it('pauses on focus loss, clears held movement and never catches up hidden time', () => {
  let game!: ReturnType<typeof useJokerAdventure>
  const wrapper = mount(defineComponent({ setup() { game = useJokerAdventure({ active: () => true, reducedMotion: () => true }); return () => h('div') } }))
  let clock = 100
  function advance(seconds: number, ready = true) { for (let i = 0; i < seconds * 120; i++) game.updateFrame(clock += 1000 / 120, ready, []) }
  try {
    game.start(); advance(1)
    game.press('right', true); advance(.2)
    window.dispatchEvent(new Event('blur'))
    expect(game.state.value.paused).toBe(true)
    const stopped = { ...game.state.value.position }
    advance(2); expect(game.state.value.position).toEqual(stopped)
    game.resume(); advance(.5)
    expect(game.state.value.position.x).toBeCloseTo(stopped.x)
    advance(10, false); game.press('right', true)
    game.updateFrame(clock += 10000, true, [])
    expect(game.state.value.position.x).toBeCloseTo(stopped.x)
    game.reset()
    expect(game.started.value).toBe(false); expect(game.state.value.phase).toBe('intro')
  } finally { wrapper.unmount() }
})
it('finishes the garage opening on time at ten rendered frames per second', () => {
  let game!: ReturnType<typeof useJokerAdventure>
  const wrapper = mount(defineComponent({ setup() { game = useJokerAdventure({ active: () => true, reducedMotion: () => false }); return () => h('div') } }))
  try {
    game.start()
    game.state.value = { ...game.state.value, phase: 'opening', position: { x: 1.185, y: .056, z: .163 } }
    for (let i = 1; i <= 31; i++) game.updateFrame(i * 100, true, [])
    expect(game.state.value.phase).toBe('garage')
    expect(game.state.value.garageOpen).toBe(true)
  } finally { wrapper.unmount() }
})
