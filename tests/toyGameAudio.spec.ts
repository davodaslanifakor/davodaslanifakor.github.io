import { effectScope } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useToyGameAudio } from '../composables/useToyGameAudio'

function audioFixture(resume = vi.fn().mockResolvedValue(undefined)) {
  const stop = vi.fn(), start = vi.fn(), disconnect = vi.fn(), connect = vi.fn().mockReturnThis()
  const param = () => ({ setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() })
  const createOscillator = vi.fn(() => ({ frequency: param(), connect, disconnect, start, stop }))
  const close = vi.fn().mockResolvedValue(undefined)
  const Audio = vi.fn(function () { return { state: 'running', currentTime: 0, sampleRate: 48000, destination: {}, createBuffer: () => ({ getChannelData: () => new Float32Array(48000) }), createBufferSource: () => ({ connect, disconnect, start, stop }), createBiquadFilter: () => ({ frequency: param(), Q: param(), connect, disconnect }), resume, close, createOscillator, createGain: () => ({ gain: param(), connect, disconnect }) } })
  vi.stubGlobal('AudioContext', Audio)
  return { Audio, close, start, stop, createOscillator }
}

describe('toy sound effects', () => {
  it('waits for a gesture unlock, bounds voices, and stops everything when muted', async () => {
    const { Audio, close, start, stop, createOscillator } = audioFixture()
    const scope = effectScope(), audio = scope.run(useToyGameAudio)!
    try {
      audio.play('start')
      expect(Audio).not.toHaveBeenCalled()
      expect(await audio.unlock()).toBe(true)
      audio.play('jump')
      expect(start).toHaveBeenCalledTimes(2)
      for (let i = 0; i < 20; i++) audio.play('win')
      expect(createOscillator).toHaveBeenCalledTimes(12)
      audio.toggle()
      expect(audio.enabled.value).toBe(false)
      expect(close).toHaveBeenCalledOnce()
      expect(stop).toHaveBeenCalledTimes(24)
      audio.play('catch')
      expect(start).toHaveBeenCalledTimes(12)
      expect(await audio.unlock()).toBe(false)
    } finally { scope.stop(); vi.unstubAllGlobals() }
  })

  it('reuses the driving audio graph and releases every source on pause or mute', async () => {
    const { createOscillator, stop } = audioFixture()
    const scope = effectScope(), audio = scope.run(useToyGameAudio)!
    try {
      audio.setMotor(.5); expect(createOscillator).not.toHaveBeenCalled()
      await audio.unlock()
      for (let i = 0; i < 100; i++) audio.setMotor(i / 100)
      expect(createOscillator).toHaveBeenCalledTimes(2)
      audio.setMotor(null); expect(stop).toHaveBeenCalledTimes(3)
      audio.setMotor(.3); audio.toggle(); expect(stop).toHaveBeenCalledTimes(6)
      audio.setMotor(.7); expect(createOscillator).toHaveBeenCalledTimes(4)
    } finally { scope.stop(); vi.unstubAllGlobals() }
  })

  it('does not play a late unlock after leaving, and gracefully handles unavailable audio', async () => {
    let resolve!: () => void
    audioFixture(vi.fn(() => new Promise<void>(done => { resolve = done })))
    const scope = effectScope(), audio = scope.run(useToyGameAudio)!
    const pending = audio.unlock()
    scope.stop(); resolve()
    expect(await pending).toBe(false)
    vi.stubGlobal('AudioContext', undefined)
    const nextScope = effectScope(), unavailable = nextScope.run(useToyGameAudio)!
    try {
      expect(await unavailable.unlock()).toBe(false)
      expect(unavailable.unavailable.value).toBe(true)
      expect(() => unavailable.play('catch')).not.toThrow()
    } finally { nextScope.stop(); vi.unstubAllGlobals() }
  })
})
