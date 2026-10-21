import { effectScope, nextTick, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { LIGHT_REVEAL_DURATION, useLightingIntro } from '../composables/useLightingIntro'

describe('scene lighting intro', () => {
  it('preserves clicks, owns one frame chain across replay, and cleans up its listener', () => {
    const frames = new Map<number, FrameRequestCallback>()
    let nextFrame = 0
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frames.set(++nextFrame, callback)
      return nextFrame
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id) })
    const now = vi.spyOn(performance, 'now').mockReturnValue(100)
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const button = document.createElement('button')
    document.body.append(button)
    const originalAction = vi.fn()
    button.addEventListener('click', originalAction)
    const scope = effectScope()
    function advance(time: number) {
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach(callback => callback(time))
    }
    try {
      const intro = scope.run(() => useLightingIntro(false))!
      expect(intro.phase.value).toBe('off')
      expect(intro.illumination.value).toBe(0)
      expect(intro.accents.value).toBe(0)
      const click = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })
      expect(button.dispatchEvent(click)).toBe(true)
      expect(click.defaultPrevented).toBe(false)
      expect(originalAction).toHaveBeenCalledOnce()
      expect(intro.phase.value).toBe('revealing')
      advance(100 + LIGHT_REVEAL_DURATION / 2)
      expect(intro.progress.value).toBe(0.5)
      expect(intro.illumination.value).toBeGreaterThan(intro.accents.value)

      intro.replay(click)
      expect(intro.progress.value).toBe(0)
      expect(frames.size).toBe(1)
      advance(100 + LIGHT_REVEAL_DURATION)
      expect(intro.phase.value).toBe('on')
      expect(intro.progress.value).toBe(1)
      expect(frames.size).toBe(0)
      button.dispatchEvent(click)
      expect(intro.phase.value).toBe('on')
      expect(frames.size).toBe(0)

      intro.replay(click)
      scope.stop()
      expect(frames.size).toBe(0)
      const registration = add.mock.calls.find(([type]) => type === 'click')!
      expect(add.mock.calls.filter(([type]) => type === 'click')).toHaveLength(1)
      expect(remove).toHaveBeenCalledWith('click', registration[1], true)
      button.dispatchEvent(click)
      expect(frames.size).toBe(0)
    } finally {
      scope.stop(); button.remove()
      request.mockRestore(); cancel.mockRestore(); now.mockRestore(); add.mockRestore(); remove.mockRestore()
    }
  })

  it('excludes replay/control clicks from the document starter and snaps keyboard/reduced motion', async () => {
    const scope = effectScope()
    const reduced = shallowRef(false)
    const control = document.createElement('button')
    control.setAttribute('data-light-replay', '')
    document.body.append(control)
    const request = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42)
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    try {
      const intro = scope.run(() => useLightingIntro(reduced))!
      const pointer = new MouseEvent('click', { bubbles: true, detail: 1 })
      control.dispatchEvent(pointer)
      expect(intro.phase.value).toBe('off')
      control.removeAttribute('data-light-replay')
      control.setAttribute('data-light-control', '')
      control.dispatchEvent(pointer)
      expect(intro.phase.value).toBe('off')
      intro.activate(new MouseEvent('click', { detail: 0 }))
      expect(intro.phase.value).toBe('on')
      expect(request).not.toHaveBeenCalled()
      intro.replay(pointer)
      expect(intro.phase.value).toBe('revealing')
      reduced.value = true
      await nextTick()
      expect(intro.phase.value).toBe('on')
      expect(intro.progress.value).toBe(1)
      expect(cancel).toHaveBeenCalledWith(42)
      request.mockClear()
      intro.replay(pointer)
      expect(intro.phase.value).toBe('on')
      expect(intro.accents.value).toBe(1)
      expect(request).not.toHaveBeenCalled()
    } finally { scope.stop(); control.remove(); request.mockRestore(); cancel.mockRestore() }
  })
})
