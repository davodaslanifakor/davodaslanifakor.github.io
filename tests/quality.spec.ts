import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { supportsWebGL, useQuality } from '../composables/useQuality'

describe('room graphics compatibility', () => {
  it('rejects WebGL 1 instead of attempting a renderer that requires WebGL 2', () => {
    vi.stubGlobal('WebGLRenderingContext', vi.fn())
    vi.stubGlobal('WebGL2RenderingContext', vi.fn())
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(kind => kind === 'webgl' ? {} as WebGLRenderingContext : null)
    try { expect(supportsWebGL()).toBe(false) }
    finally { context.mockRestore(); vi.unstubAllGlobals() }
  })

  it('releases the capability probe instead of accumulating graphics contexts', () => {
    vi.stubGlobal('WebGL2RenderingContext', vi.fn())
    const loseContext = vi.fn()
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      getExtension: (name: string) => name === 'WEBGL_lose_context' ? { loseContext } : null,
    } as unknown as WebGL2RenderingContext)
    try { expect(supportsWebGL()).toBe(true); expect(loseContext).toHaveBeenCalledOnce() }
    finally { context.mockRestore(); vi.unstubAllGlobals() }
  })
})

describe('room resolution during browser zoom', () => {
  it('automatically limits work on large displays and software graphics', async () => {
    vi.stubGlobal('WebGL2RenderingContext', vi.fn())
    vi.stubGlobal('innerWidth', 3840)
    vi.stubGlobal('innerHeight', 2160)
    vi.stubGlobal('devicePixelRatio', 2)
    let renderer = 'Hardware GPU'
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      getExtension: (name: string) => name === 'WEBGL_debug_renderer_info' ? { UNMASKED_RENDERER_WEBGL: 1 } : null,
      getParameter: () => renderer,
    } as unknown as WebGL2RenderingContext)
    const cores = vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(8)
    let quality!: ReturnType<typeof useQuality>
    const component = defineComponent({ setup() { quality = useQuality(); return () => h('div') } })
    let wrapper = mount(component)
    try {
      expect(quality.pixelRatio.value ** 2 * 3840 * 2160).toBeCloseTo(4_000_000)
      wrapper.unmount()
      renderer = 'ANGLE (Google, Vulkan SwiftShader Device)'
      wrapper = mount(component)
      expect(quality.recommendedQuality.value).toBe('low')
      expect(quality.shadowsEnabled.value).toBe(false)
      expect(quality.pixelRatio.value ** 2 * 3840 * 2160).toBeCloseTo(2_000_000)
    } finally { wrapper.unmount(); context.mockRestore(); cores.mockRestore(); vi.unstubAllGlobals() }
  })

  it('updates rendering density on resize, retains its cap, and cleans up', async () => {
    let density = 1
    const original = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio')
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => density })
    vi.stubGlobal('WebGL2RenderingContext', vi.fn())
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as unknown as WebGL2RenderingContext)
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
