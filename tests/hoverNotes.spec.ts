import { effectScope, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useHoverNotes } from '../composables/useHoverNotes'

describe('hover notes', () => {
  it('requires sound opt-in, plays once per hover, and stops voices on mute/dispose', () => {
    const start = vi.fn(), stop = vi.fn(), close = vi.fn().mockResolvedValue(undefined)
    const connect = vi.fn().mockReturnThis()
    const createOscillator = vi.fn(() => ({ frequency: { value: 0 }, connect, start, stop, disconnect: vi.fn() }))
    const Audio = vi.fn(function () {
      return { state: 'running', currentTime: 0, destination: {}, resume: vi.fn().mockResolvedValue(undefined), close, createOscillator,
        createGain: () => ({ connect, gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } }) }
    })
    vi.stubGlobal('AudioContext', Audio)
    const sound = shallowRef(false), hovered = shallowRef<string | null>(null)
    const scope = effectScope()
    try {
      scope.run(() => useHoverNotes({ soundOn: () => sound.value, hoveredId: () => hovered.value }))
      hovered.value = 'robot'
      expect(Audio).not.toHaveBeenCalled()
      sound.value = true
      hovered.value = 'cards'
      expect(start).toHaveBeenCalledOnce()
      hovered.value = 'cards'
      expect(start).toHaveBeenCalledOnce()
      sound.value = false
      hovered.value = 'clock'
      expect(start).toHaveBeenCalledOnce()
      expect(close).toHaveBeenCalledOnce()
      expect(stop).toHaveBeenCalledTimes(2)
      sound.value = true
      scope.stop()
      expect(close).toHaveBeenCalledTimes(2)
    } finally { scope.stop(); vi.unstubAllGlobals() }
  })
})
