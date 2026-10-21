import { effectScope, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useRoomColors } from '../composables/useRoomColors'
import { idleMusicPlayback } from '../utils/musicPlayback'
import type { LightPhase } from '../composables/useLightingIntro'

describe('scene color clock', () => {
  it('freezes while off, paused, warm, focused, reduced or hidden without a resume jump', () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    const remove = vi.spyOn(document, 'removeEventListener')
    const phase = shallowRef<LightPhase>('off')
    const focused = shallowRef(false)
    const reducedMotion = shallowRef(false)
    const scope = effectScope()
    try {
      const colors = scope.run(() => useRoomColors({ phase, focused, reducedMotion }))!
      expect(colors.mode.value).toBe('rgb')
      expect(colors.motion.value).toBe('paused')
      expect(colors.updateFrame(1000)).toBe(0)
      phase.value = 'revealing'
      expect(colors.updateFrame(5000)).toBe(0)
      expect(colors.updateFrame(6000)).toBe(1)
      colors.togglePaused()
      expect(colors.updateFrame(9000)).toBe(1)
      colors.togglePaused()
      expect(colors.updateFrame(10000)).toBe(1)
      expect(colors.updateFrame(11000)).toBe(2)

      colors.setMode('warm')
      expect(colors.motion.value).toBe('static')
      expect(colors.canPause.value).toBe(false)
      expect(colors.updateFrame(20000)).toBe(2)
      colors.setMode('rgb')
      expect(colors.updateFrame(21000)).toBe(2)
      focused.value = true
      expect(colors.motion.value).toBe('paused')
      focused.value = false
      expect(colors.updateFrame(30000)).toBe(2)
      reducedMotion.value = true
      expect(colors.motion.value).toBe('static')
      expect(colors.canPause.value).toBe(false)
      expect(colors.updateFrame(40000)).toBe(2)
      reducedMotion.value = false
      expect(colors.updateFrame(41000)).toBe(2)

      hidden.mockReturnValue(true)
      document.dispatchEvent(new Event('visibilitychange'))
      expect(colors.motion.value).toBe('paused')
      // No frames arrive while the tab is suspended.
      hidden.mockReturnValue(false)
      document.dispatchEvent(new Event('visibilitychange'))
      expect(colors.updateFrame(100000)).toBe(2)
      expect(colors.updateFrame(101000)).toBe(3)
      phase.value = 'off'
      expect(colors.updateFrame(200000)).toBe(3)
      scope.stop()
      expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    } finally { scope.stop(); hidden.mockRestore(); remove.mockRestore() }
  })
})


it('pulses only during confirmed playback and stops for pause, buffering, ending and reduced motion', () => {
  const scope = effectScope()
  const music = shallowRef(idleMusicPlayback())
  const focused = shallowRef(true), reducedMotion = shallowRef(false)
  const colors = scope.run(() => useRoomColors({ phase: 'on', focused, reducedMotion, music }))!
  try {
    colors.updateFrame(1000)
    expect(colors.musicPulse.value).toBe(1)
    expect(colors.motion.value).toBe('paused')
    music.value = { playing: true, positionMs: 0, durationMs: 30000, sampledAt: 1000 }
    colors.updateFrame(1000)
    colors.updateFrame(1375)
    expect(colors.musicPulse.value).toBeCloseTo(1.22)
    expect(colors.motion.value).toBe('running')
    music.value = { ...music.value, playing: false }
    colors.updateFrame(1400)
    expect(colors.musicPulse.value).toBe(1)
    music.value = { playing: true, positionMs: 750, durationMs: 30000, sampledAt: 2000 }
    colors.updateFrame(2000)
    expect(colors.musicPulse.value).toBeCloseTo(0.72)
    colors.updateFrame(2375)
    expect(colors.musicPulse.value).toBeCloseTo(1.22)
    reducedMotion.value = true
    colors.updateFrame(2400)
    expect(colors.musicPulse.value).toBe(1)
    expect(colors.motion.value).toBe('static')
    reducedMotion.value = false
    music.value = { playing: true, positionMs: 29990, durationMs: 30000, sampledAt: 3000 }
    colors.updateFrame(3100)
    expect(colors.musicPulse.value).toBe(1)
    colors.setMode('warm')
    colors.updateFrame(3200)
    expect(colors.musicPulse.value).toBe(1)
  } finally { scope.stop() }
})

it('makes the wall spectrum travel visibly within one second of playback', () => {
  const scope = effectScope()
  const colors = scope.run(() => useRoomColors({
    phase: 'on', focused: false, reducedMotion: false,
    music: { playing: true, positionMs: 1000, durationMs: 30000, sampledAt: 1000 },
  }))!
  try {
    const before = colors.updateFrame(1000)
    const after = colors.updateFrame(2000)
    // The shared wall shader has a 36-unit color cycle: at least a sixth of
    // the spectrum per second is visibly different at the resting camera.
    expect(after - before).toBeGreaterThanOrEqual(6)
  } finally { scope.stop() }
})
