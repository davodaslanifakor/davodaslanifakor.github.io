import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ZoomableArtwork from '../components/ui/ZoomableArtwork.vue'

afterEach(() => vi.restoreAllMocks())

function viewer() {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300)
  const wrapper = mount(ZoomableArtwork, { props: { src: '/images/vue-certificate.jpg', alt: 'Certificate', width: 2048, height: 1449, locale: 'en' } })
  const viewport = wrapper.get('.artwork-viewport'), element = viewport.element as HTMLElement
  const captured = new Set<number>()
  element.setPointerCapture = id => { captured.add(id) }
  element.hasPointerCapture = id => captured.has(id)
  element.releasePointerCapture = id => { captured.delete(id) }
  element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 300 } as DOMRect)
  return { wrapper, viewport }
}

describe('artwork zoom', () => {
  it('supports keyboard zoom and pan, clamps its limits, and fits the image again', async () => {
    const { wrapper, viewport } = viewer()
    try {
      await flushPromises()
      const image = wrapper.get('img')
      expect((image.element as HTMLImageElement).style.width).toBe('400px')
      await viewport.trigger('keydown', { key: '+' })
      expect(viewport.attributes('data-zoom')).toBe('1.5')
      await viewport.trigger('keydown', { key: 'ArrowRight' })
      expect(image.attributes('style')).toContain('-48px')
      for (let i = 0; i < 10; i++) await viewport.trigger('keydown', { key: '+' })
      expect(viewport.attributes('data-zoom')).toBe('4')
      expect(wrapper.get('[aria-label="Zoom in"]').attributes('disabled')).toBeDefined()
      await viewport.trigger('keydown', { key: '0' })
      expect(viewport.attributes('data-zoom')).toBe('1')
      expect(image.attributes('style')).toContain('calc(-50% + 0px)')
      await viewport.trigger('keydown', { key: '-', ctrlKey: true })
      expect(viewport.attributes('data-zoom')).toBe('1')
      expect(wrapper.get('[aria-label="Zoom out"]').attributes('disabled')).toBeDefined()
    } finally { wrapper.unmount() }
  })

  it('pinches and drags with two touch points, cancels capture, and resets for a different image', async () => {
    const { wrapper, viewport } = viewer()
    const touch = { button: 0, pointerType: 'touch' }
    try {
      await viewport.trigger('pointerdown', { ...touch, pointerId: 1, clientX: 150, clientY: 150 })
      await viewport.trigger('pointerdown', { ...touch, pointerId: 2, clientX: 250, clientY: 150 })
      await viewport.trigger('pointermove', { ...touch, pointerId: 2, clientX: 350, clientY: 150 })
      expect(viewport.attributes('data-zoom')).toBe('2')
      await viewport.trigger('pointercancel', { ...touch, pointerId: 2 })
      await viewport.trigger('pointermove', { ...touch, pointerId: 1, clientX: -2000, clientY: 150 })
      expect(wrapper.get('img').attributes('style')).toContain('-200px')
      await viewport.trigger('pointerup', { ...touch, pointerId: 1 })
      expect(viewport.classes()).not.toContain('artwork-viewport--dragging')
      const previous = wrapper.get('img').attributes('style')
      await viewport.trigger('pointermove', { ...touch, pointerId: 1, clientX: 3000, clientY: 150 })
      expect(wrapper.get('img').attributes('style')).toBe(previous)
      await viewport.trigger('wheel', { deltaY: -10000, clientX: 200, clientY: 150 })
      expect(viewport.attributes('data-zoom')).toBe('4')
      await wrapper.setProps({ src: '/images/library-portrait.jpeg', width: 512, height: 512 })
      expect(viewport.attributes('data-zoom')).toBe('1')
      expect(wrapper.get('img').attributes('style')).toContain('300px')
    } finally { wrapper.unmount() }
  })
})
