import { afterEach, describe, expect, it, vi } from 'vitest'
import { Group } from 'three'
import { createLibraryFrames } from '../utils/libraryFrames'

function mockCanvas() {
  const fillText = vi.fn()
  const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect() {}, fillRect() {}, save() {}, restore() {}, beginPath() {}, roundRect() {}, stroke() {}, drawImage() {}, fillText,
    measureText: (label: string) => ({ width: label.length * 80 }),
    createLinearGradient: () => ({ addColorStop() {} }),
  } as unknown as CanvasRenderingContext2D)
  return { spy, fillText }
}

describe('library frame stamp and wave', () => {
  afterEach(() => vi.restoreAllMocks())

  it('lifts only the hovered frame, then settles back to the flat stamp with no tilt', () => {
    const { fillText } = mockCanvas()
    const model = new Group()
    const frames = createLibraryFrames(model, 'en')
    frames.update(1)
    const about = model.getObjectByName('root_library_frame_about')!
    const story = model.getObjectByName('root_library_frame_story')!

    frames.animate('library_about', 0, false)
    frames.animate('library_about', 600, false)
    expect(about.rotation.x).toBeGreaterThan(0)
    expect(story.rotation.x).toBe(0)

    frames.animate(null, 700, false)
    frames.animate(null, 1100, false)
    expect(about.rotation.x).toBe(0)

    // Settled frames stop repainting on later idle ticks.
    const calls = fillText.mock.calls.length
    frames.animate(null, 2000, false)
    expect(fillText.mock.calls.length).toBe(calls)
    frames.dispose()
  })

  it('never lifts or tilts with reduced motion', () => {
    mockCanvas()
    const model = new Group()
    const frames = createLibraryFrames(model, 'en')
    frames.update(1)
    frames.animate('library_about', 0, true)
    frames.animate('library_about', 600, true)
    expect(model.getObjectByName('root_library_frame_about')!.rotation.x).toBe(0)
    frames.dispose()
  })
})
