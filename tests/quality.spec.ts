import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useQuality } from '../composables/useQuality'

describe('room resolution during browser zoom', () => {
  it('updates rendering density on resize, retains its cap, and cleans up', async () => {
    let density = 1
    const original = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio')
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => density })
    vi.stubGlobal('WebGL2RenderingContext', vi.fn())
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as WebGL2RenderingContext)
    const cores = vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(8)
    const remove = vi.spyOn(window, 'removeEventListener')
    let quality!: ReturnType<typeof useQuality>
    const wrapper = mount(defineComponent({
      setup() {
        quality = useQuality()
        return () => h('div')
      },
    }))
    try {
      expect(quality.pixelRatio.value).toBe(1)
      density = 1.5
      window.dispatchEvent(new Event('resize'))
      await nextTick()
      expect(quality.pixelRatio.value).toBe(1.5)
      density = 3
      window.dispatchEvent(new Event('resize'))
      await nextTick()
      expect(quality.pixelRatio.value).toBe(2)
      wrapper.unmount()
      expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
      density = 1
      window.dispatchEvent(new Event('resize'))
      expect(quality.pixelRatio.value).toBe(2)
    } finally {
      wrapper.unmount()
      context.mockRestore()
      cores.mockRestore()
      remove.mockRestore()
      vi.unstubAllGlobals()
      if (original) Object.defineProperty(window, 'devicePixelRatio', original)
      else Reflect.deleteProperty(window, 'devicePixelRatio')
    }
  })
})
