import { effectScope, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useSceneStore } from '../stores/scene'
import { SCREEN_THEMES } from '../utils/screenTheme'
import { describe, expect, it, vi } from 'vitest'
import { LinearFilter, LinearMipmapLinearFilter } from 'three'
import { favouriteMusic, profile } from '../content/portfolio'
import { useScreenTextures } from '../composables/useScreenTextures'

describe('continuous ultrawide artwork', () => {
  it('keeps both screens in sync through themes, time, music and reduced motion without replacing textures', async () => {
    const scale = vi.fn<(this: CanvasRenderingContext2D, x: number, y: number) => void>()
    const drawImage = vi.fn()
    const fillText = vi.fn()
    const baseFills: string[] = []
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      return {
        canvas: this,
        scale(this: CanvasRenderingContext2D, x: number, y: number) { if (x === 4 && y === 4) scale.call(this, x, y) },
        drawImage,
        fillRect(this: CanvasRenderingContext2D, x: number, y: number, w: number) {
          if (x === 0 && y === 0 && (w === 512 || w === 240)) baseFills.push(String(this.fillStyle))
        },
        clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, arc() {}, stroke() {}, fill() {}, fillText,
        save() {}, restore() {}, strokeRect() {}, translate() {}, setTransform() {},
        createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData() {}, createPattern: () => null,
        createRadialGradient: () => ({ addColorStop() {} }),
        measureText: (text: string) => ({ width: text.length * 3 }),
        createLinearGradient: () => ({ addColorStop() {} }),
      } as unknown as CanvasRenderingContext2D
    })
    const scope = effectScope()
    try {
      setActivePinia(createPinia())
      const scene = useSceneStore()
      expect(scene.screenTheme).toBe('slate')
      const screens = scope.run(() => useScreenTextures({ theme: () => scene.screenTheme }))!
      screens.build(new Date('2026-10-08T09:00:00Z'))
      const left = screens.textures.value.get('int_screen_left')!
      const right = screens.textures.value.get('int_screen_right')!
      const laptop = screens.textures.value.get('int_monitor_screen')!
      expect(left).toBe(right)
      expect(left).not.toBe(laptop)
      expect(left.image.width).toBe(2048)
      expect(left.image.height).toBe(576)
      expect(laptop.image.width).toBe(960)
      expect(laptop.image.height).toBe(632)
      for (const texture of [left, laptop]) {
        expect(texture.flipY).toBe(false)
        expect(texture.magFilter).toBe(LinearFilter)
        expect(texture.minFilter).toBe(LinearMipmapLinearFilter)
        expect(texture.generateMipmaps).toBe(true)
        expect(texture.anisotropy).toBe(4)
      }
      expect(scale).toHaveBeenCalledTimes(2)
      for (const [index, texture] of [left, laptop].entries()) {
        expect(scale).toHaveBeenNthCalledWith(index + 1, 4, 4)
        expect(scale.mock.contexts[index]!.canvas).toBe(texture.image)
        expect(scale.mock.contexts[index]!.imageSmoothingEnabled).toBe(true)
      }
      expect(drawImage).not.toHaveBeenCalled()
      expect(left.image.width / left.image.height).toBeCloseTo(512 / 144)
      const dispose = vi.spyOn(left, 'dispose')
      const disposeLaptop = vi.spyOn(laptop, 'dispose')
      const laptopImage = laptop.image
      const laptopVersion = laptop.version
      expect(fillText).toHaveBeenCalledWith('Istanbul 12:00', 29, 117)
      fillText.mockClear()
      screens.updateTime(new Date('2026-10-08T21:01:00Z'))
      expect(fillText).toHaveBeenCalledWith('Istanbul 00:01', 29, 117)
      expect(fillText).toHaveBeenCalledWith('9', 197, 74)
      expect(screens.textures.value.get('int_monitor_screen')).toBe(laptop)
      expect(laptop.image).toBe(laptopImage)
      expect(laptop.version).toBe(laptopVersion + 1)
      expect(scale).toHaveBeenCalledTimes(4)
      expect(scale).toHaveBeenNthCalledWith(4, 4, 4)
      const updatedContext = scale.mock.contexts[3]!
      expect(updatedContext.canvas.width).toBe(960)
      expect(updatedContext.canvas.height).toBe(632)
      expect(updatedContext.imageSmoothingEnabled).toBe(true)
      expect(drawImage).toHaveBeenCalledTimes(2)
      expect(drawImage).toHaveBeenLastCalledWith(updatedContext.canvas, 0, 0)
      expect(laptop.image.width).toBe(960)
      expect(laptop.image.height).toBe(632)
      expect(dispose).not.toHaveBeenCalled()
      expect(disposeLaptop).not.toHaveBeenCalled()
      const screenVersion = left.version
      screens.updateMusic(favouriteMusic[0]!, 'en', 1000, false)
      expect(fillText).toHaveBeenCalledWith(favouriteMusic[0]!.title, 282, 48, 198)
      expect(screens.textures.value.get('int_screen_left')).toBe(left)
      expect(screens.textures.value.get('int_screen_right')).toBe(left)
      expect(left.version).toBe(screenVersion + 1)
      screens.updateMusic(favouriteMusic[0]!, 'en', 1050, false)
      expect(left.version).toBe(screenVersion + 1)
      screens.updateMusic(favouriteMusic[0]!, 'en', 1100, true)
      const reducedVersion = left.version
      screens.updateMusic(favouriteMusic[0]!, 'en', 2000, true)
      expect(left.version).toBe(reducedVersion)
      for (const theme of Object.values(SCREEN_THEMES)) {
        const versions = [left.version, laptop.version]
        baseFills.length = 0
        scene.setScreenTheme(theme.id)
        await nextTick()
        if (theme.id !== 'slate') {
          expect(baseFills.filter(color => color === theme.base)).toHaveLength(2)
          expect(left.version).toBe(versions[0]! + 1)
          expect(laptop.version).toBe(versions[1]! + 1)
        }
        expect(screens.textures.value.get('int_screen_left')).toBe(left)
        expect(screens.textures.value.get('int_screen_right')).toBe(left)
        expect(screens.textures.value.get('int_monitor_screen')).toBe(laptop)
        expect(fillText).toHaveBeenCalledWith(favouriteMusic[0]!.title, 282, 48, 198)
      }
      fillText.mockClear()
      screens.updateTime(new Date('2026-10-08T21:02:00Z'))
      expect(fillText).toHaveBeenCalledWith('Istanbul 00:02', 29, 117)
      expect(fillText).toHaveBeenCalledWith(favouriteMusic[0]!.title, 282, 48, 198)
      fillText.mockClear()
      screens.updateMusic(null, 'en', 2100, true)
      expect(fillText).toHaveBeenCalledWith(profile.name, 20, 19)
      expect(fillText).not.toHaveBeenCalledWith(favouriteMusic[0]!.title, 282, 48, 198)
      expect(dispose).not.toHaveBeenCalled()
      scope.stop()
      expect(dispose).toHaveBeenCalledOnce()
      expect(disposeLaptop).toHaveBeenCalledOnce()
    } finally { scope.stop(); canvas.mockRestore() }
  })
})
