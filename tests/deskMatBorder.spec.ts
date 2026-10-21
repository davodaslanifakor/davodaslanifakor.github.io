import { effectScope } from 'vue'
import { AdditiveBlending, BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import type { PlaneGeometry, ShaderMaterial, WebGLRenderer } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { createDeskMatBorder, deskMatBounds } from '../utils/deskMatBorder'
import { useRoomColors } from '../composables/useRoomColors'
import { roomColorPalette } from '../utils/roomColorPalette'
import { useRoomFinish } from '../composables/useRoomFinish'

describe('desk mat lighting border', () => {
  it('uses native mat/rim world bounds, ignores children and carpet, and removes only owned resources', () => {
    const model = new Group()
    model.position.set(0.3, 0.1, -0.2)
    model.scale.set(1.2, 1.1, 0.8)
    const original = new MeshStandardMaterial()
    const mat = new Mesh(new BoxGeometry(1.38, 0.004, 0.267), original)
    mat.name = 'static_desk_mat'
    mat.position.set(0.05, 0.752, 0.1785)
    const rim = new Mesh(new BoxGeometry(1.38, 0.002, 0.267), original)
    rim.name = 'static_desk_mat_rim'
    rim.position.set(0.05, 0.754, 0.1785)
    const rug = new Mesh(new BoxGeometry(8, 0.1, 8), original)
    rug.name = 'static_style_rug'
    model.add(mat, rim, rug)
    const unrelatedChild = new Mesh(rug.geometry, original)
    mat.add(unrelatedChild)
    model.updateWorldMatrix(true, true)
    const transform = mat.matrix.clone()
    const bounds = deskMatBounds(model)!
    const border = createDeskMatBorder(model)!
    try {
      expect(bounds.getSize(new Vector3()).x).toBeCloseTo(1.38 * 1.2)
      expect(bounds.getSize(new Vector3()).z).toBeCloseTo(0.267 * 0.8)
      expect(bounds.max.y).toBeCloseTo(0.755 * 1.1 + 0.1)
      const group = model.getObjectByName('runtime_desk_mat_border')!
      const ring = group.children[0] as Mesh<PlaneGeometry, ShaderMaterial>
      expect(group.visible).toBe(false)
      expect(ring.position.y).toBeCloseTo(bounds.max.y + 0.001)
      model.updateWorldMatrix(true, true)
      expect(ring.getWorldPosition(new Vector3()).distanceTo(ring.position)).toBeLessThan(1e-10)
      expect(ring.rotation.x).toBe(-Math.PI / 2)
      expect(ring.geometry.parameters.width).toBeCloseTo(1.38 * 1.2 + 0.014)
      expect(ring.geometry.parameters.height).toBeCloseTo(0.267 * 0.8 + 0.014)
      expect(ring.material.depthTest).toBe(true)
      expect(ring.material.depthWrite).toBe(false)
      expect(ring.material.blending).toBe(AdditiveBlending)
      expect(ring.material.uniforms.fade!.value).toBe(0)
      border.update(0.35)
      expect(ring.material.uniforms.fade!.value).toBe(0.35)
      expect(group.visible).toBe(true)
      border.update(0)
      expect(group.visible).toBe(false)
      const disposeGeometry = vi.spyOn(ring.geometry, 'dispose')
      const disposeMaterial = vi.spyOn(ring.material, 'dispose')
      const disposeNative = vi.spyOn(original, 'dispose')
      border.dispose()
      expect(model.children).toEqual([mat, rim, rug])
      expect(disposeGeometry).toHaveBeenCalledOnce()
      expect(disposeMaterial).toHaveBeenCalledOnce()
      expect(disposeNative).not.toHaveBeenCalled()
      expect(mat.material).toBe(original)
      expect(mat.matrix.equals(transform)).toBe(true)
    } finally { mat.geometry.dispose(); rim.geometry.dispose(); rug.geometry.dispose(); original.dispose() }
  })

  it('does not substitute the floor rug when a desk mat is absent', () => {
    const model = new Group()
    const rug = new Mesh(new BoxGeometry(3, 0.02, 3), new MeshStandardMaterial())
    rug.name = 'static_style_rug'
    model.add(rug)
    expect(createDeskMatBorder(model)).toBeNull()
    expect(model.children).toEqual([rug])
    rug.geometry.dispose(); rug.material.dispose()
  })

  it('shares wall/core/halo uniforms, preserves native mat materials, fades with accents and cleans up on scope disposal', () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
      putImageData() {},
      clearRect() {}, fillRect() {}, save() {}, restore() {}, beginPath() {}, roundRect() {}, stroke() {}, fillText() {},
      measureText: (label: string) => ({ width: label.length * 80 }),
      createLinearGradient: () => ({ addColorStop() {} }),
      drawImage() {},
    } as unknown as CanvasRenderingContext2D)
    const scope = effectScope()
    const model = new Group()
    const native = new MeshStandardMaterial()
    const mat = new Mesh(new BoxGeometry(1.38, 0.004, 0.267), native)
    mat.name = 'static_desk_mat'
    const led = new MeshStandardMaterial({ emissive: '#ffc078', emissiveIntensity: 4 })
    const strip = new Mesh(new BoxGeometry(0.008, 2, 0.006), led)
    strip.name = 'static_style_wall_led_left'
    const shelf = new Mesh(strip.geometry, led)
    shelf.name = 'static_style_shelf_led'
    model.add(mat, strip, shelf)
    try {
      const finish = scope.run(useRoomFinish)!
      finish.prepare(model)
      finish.prepare(model)
      expect(model.children.filter(child => child.name === 'runtime_desk_mat_border')).toHaveLength(1)
      expect(mat.material).toBe(native)
      const ring = model.getObjectByName('runtime_desk_mat_ring') as Mesh<PlaneGeometry, ShaderMaterial>
      const halo = model.getObjectByName('runtime_halo_static_style_wall_led_left') as Mesh<PlaneGeometry, ShaderMaterial>
      const shader = {
        uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader: '#include <emissivemap_fragment>',
      } as Parameters<MeshStandardMaterial['onBeforeCompile']>[0]
      strip.material.onBeforeCompile(shader, {} as WebGLRenderer)
      expect(shader.uniforms.colorTime).toBe(ring.material.uniforms.colorTime)
      expect(halo.material.uniforms.colorTime).toBe(ring.material.uniforms.colorTime)
      expect(shader.uniforms.colorRgb).toBe(ring.material.uniforms.colorRgb)
      expect(shader.uniforms.musicDrive).toBe(ring.material.uniforms.musicDrive)
      expect(shader.uniforms.musicDrive).toBe(halo.material.uniforms.musicDrive)
      expect(shader.uniforms.musicPulse).toBe(halo.material.uniforms.musicPulse)
      expect(strip.material.customProgramCacheKey()).toContain(roomColorPalette)
      const colorClock = scope.run(() => useRoomColors({ phase: 'on', focused: false, reducedMotion: false,
        music: { playing: true, positionMs: 0, durationMs: 30000, sampledAt: 1000 },
      }))!
      for (let time = 1000; time <= 2000; time += 25) {
        finish.updateColors('rgb', colorClock.updateFrame(time), colorClock.musicPulse.value, colorClock.musicDrive.value)
      }
      expect(shader.uniforms.colorTime!.value).toBeCloseTo(9)
      expect(shader.uniforms.musicDrive!.value).toBeGreaterThan(0.98)
      expect(shader.uniforms.musicPulse!.value).toBeCloseTo(1.095)
      colorClock.setMode('warm')
      finish.updateColors('warm', colorClock.updateFrame(2025), colorClock.musicPulse.value, colorClock.musicDrive.value)
      expect(shader.uniforms.musicDrive!.value).toBe(0)
      expect(shader.uniforms.musicPulse!.value).toBe(1)
      finish.updateColors('rgb', 12)
      expect(shader.uniforms.colorTime!.value).toBe(12)
      expect(shader.uniforms.colorRgb!.value).toBe(1)
      finish.updateColors('rgb', 12, 1, 0, 0.75)
      expect(shader.uniforms.jokerGlow).toBe(ring.material.uniforms.jokerGlow)
      expect(shader.uniforms.jokerGlow).toBe(halo.material.uniforms.jokerGlow)
      expect(shader.uniforms.jokerGlow!.value).toBe(0.75)
      expect(shader.fragmentShader).toContain('roomJoker(vRevealPosition) * emissionStrength')
      finish.updateColors('rgb', 12)
      expect(shader.uniforms.jokerGlow!.value).toBe(0)
      const shelfColor = shelf.material.emissive.clone()
      finish.applyLighting(0.2, 4, 0.25, 0.5)
      expect(ring.material.uniforms.fade!.value).toBe(0.25)
      expect(halo.material.uniforms.revealProgress!.value).toBe(0.5)
      finish.updateColors('warm')
      expect(shader.uniforms.colorRgb!.value).toBe(0)
      expect(shader.uniforms.colorTime!.value).toBe(12)
      expect(shelf.material.emissive.equals(shelfColor)).toBe(true)
      finish.applyLighting(0, 4, 0, 0)
      expect(ring.material.uniforms.fade!.value).toBe(0)
      expect(halo.material.uniforms.revealProgress!.value).toBe(0)
      const geometryDispose = vi.spyOn(ring.geometry, 'dispose')
      const materialDispose = vi.spyOn(ring.material, 'dispose')
      scope.stop()
      expect(model.children).toEqual([mat, strip, shelf])
      expect(geometryDispose).toHaveBeenCalledOnce()
      expect(materialDispose).toHaveBeenCalledOnce()
      expect(mat.material).toBe(native)
      expect(strip.material).toBe(led)
    } finally {
      scope.stop(); canvas.mockRestore()
      mat.geometry.dispose(); strip.geometry.dispose(); native.dispose(); led.dispose()
    }
  })
})
