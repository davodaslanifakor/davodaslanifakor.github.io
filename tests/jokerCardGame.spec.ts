import { effectScope, shallowRef } from 'vue'
import { describe, expect, it } from 'vitest'
import { useJokerCardGame } from '../composables/useJokerCardGame'
import { jokerCardPose, JOKER_CARD_SPACING } from '../utils/jokerGameScene'

function fixture(reduced = false) {
  const scope = effectScope(), active = shallowRef(true), motion = shallowRef(reduced)
  const game = scope.run(() => useJokerCardGame({ active: () => active.value, reducedMotion: () => motion.value, random: () => 0.4 }))!
  let time = 0
  game.updateFrame(time)
  function advance(ms: number, visible = true) { for (let i = 0; i < ms; i += 16) game.updateFrame(time += 16, visible) }
  return { scope, game, active, motion, advance }
}

describe('Joker fair three-card game', () => {
  it('tracks every swap, blocks early/repeated picks and keeps the final geometry in agreement', () => {
    const { game, advance, scope } = fixture()
    try {
      game.pick(0)
      expect(game.state.value.phase).toBe('intro')
      game.start()
      const winner = game.state.value.winner
      const expected = [0, 1, 2]
      for (const [a, b] of game.state.value.swaps) [expected[a], expected[b]] = [expected[b]!, expected[a]!]
      game.shuffle()
      game.pick(0)
      game.start()
      expect(game.state.value.phase).toBe('hiding')
      advance(5000)
      expect(game.state.value.phase).toBe('picking')
      expect(game.state.value.slots).toEqual(expected)
      expect(new Set(game.state.value.slots).size).toBe(3)
      expected.forEach((card, slot) => expect(jokerCardPose(game.state.value, card, false).x).toBeCloseTo((slot - 1) * JOKER_CARD_SPACING))
      game.pick(-1); game.pick(1.5); game.pick(3)
      expect(game.state.value.phase).toBe('picking')
      game.pick(expected.indexOf(winner))
      expect(game.won.value).toBe(true)
      const choice = game.state.value.selected
      game.pick((choice! + 1) % 3)
      expect(game.state.value.selected).toBe(choice)
      advance(2000)
      const settled = game.state.value
      advance(2000)
      expect(game.state.value).toBe(settled)
      game.start()
      expect(game.state.value.phase).toBe('showing')
      expect(game.state.value.slots).toEqual([0, 1, 2])
      expect(game.state.value.selected).toBeNull()
    } finally { scope.stop() }
  })

  it('offers a fair memory alternative with no invisible shuffling or flip animation', () => {
    const { game, advance, scope } = fixture(true)
    try {
      game.setMemory(false)
      game.start()
      const winner = game.state.value.winner
      advance(60000)
      expect(game.state.value.phase).toBe('showing')
      game.shuffle()
      expect(game.state.value.phase).toBe('picking')
      expect(game.state.value.slots).toEqual([0, 1, 2])
      expect(jokerCardPose(game.state.value, winner, true).flip).toBe(Math.PI)
      game.pick(winner)
      expect(game.won.value).toBe(true)
      expect(jokerCardPose(game.state.value, winner, true).flip).toBe(0)
    } finally { scope.stop() }
  })

  it('pauses unseen shuffles and resets on exit or a changed motion preference', () => {
    const { game, active, motion, advance, scope } = fixture()
    try {
      game.start(); game.shuffle(); advance(700)
      const before = game.state.value
      advance(60000, false)
      expect(game.state.value).toBe(before)
      motion.value = true
      expect(game.state.value.phase).toBe('intro')
      expect(game.state.value.memory).toBe(true)
      game.start(); game.shuffle()
      game.pick((game.state.value.winner + 1) % 3)
      expect(game.won.value).toBe(false)
      active.value = false
      advance(10000)
      game.start()
      expect(game.state.value.phase).toBe('intro')
      active.value = true
      expect(game.state.value.phase).toBe('intro')
    } finally { scope.stop() }
  })
})
