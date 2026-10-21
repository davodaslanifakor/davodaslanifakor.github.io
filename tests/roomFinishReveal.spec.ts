import { effectScope } from 'vue'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import type { PlaneGeometry, ShaderMaterial } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { useRoomFinish } from '../composables/useRoomFinish'

describe('runtime wall light finish', () => {
  it('isolates shared strip materials, dims all emitters, and restores native assets on teardown', () => {
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
    const geometry = new BoxGeometry(1, 1, 1)
    const shared = new MeshStandardMaterial({ name: 'style_warm_led', emissive: '#ffc078', emissiveIntensity: 4 })
    const stripPositions = [[-0.17, 0.08, 2.735, 0.008], [1.199, 1.12, 0.008, 2.115], [-0.17, 2.161, 2.735, 0.008], [-1.539, 1.12, 0.008, 2.115]] as const
    const strips = stripPositions.map(([x, y, width, height], index) => {
      const mesh = new Mesh(geometry, shared)
      mesh.name = `static_style_wall_led_${index}`
      mesh.position.set(x, y, -0.363)
      mesh.scale.set(width, height, 0.006)
      model.add(mesh)
      return mesh
    })
    const screenMaterial = new MeshStandardMaterial({ emissive: '#ffffff', emissiveIntensity: 2 })
    const screen = new Mesh(geometry, screenMaterial)
    screen.name = 'int_monitor_screen'
    model.add(screen)
    model.updateMatrixWorld(true)
    const transforms = strips.map(strip => strip.matrix.clone())
    const geometryDispose = vi.spyOn(geometry, 'dispose')
    const originalDispose = vi.spyOn(shared, 'dispose')
    try {
      const finish = scope.run(useRoomFinish)!
      finish.prepare(model)
      const owned = strips.map(strip => strip.material)
      expect(new Set(owned).size).toBe(4)
      expect(owned).not.toContain(shared)
      finish.applyLighting(0, 4, 0, 0)
      expect(strips.every(strip => strip.material.emissiveIntensity === 0)).toBe(true)
      expect(screen.material.emissiveIntensity).toBe(0)
      expect(shared.emissiveIntensity).toBe(4)
      const halos = model.getObjectByName('runtime_wall_light_halos')!
      expect(halos.children).toHaveLength(4)
      const halo = halos.children[1] as Mesh<PlaneGeometry, ShaderMaterial>
      expect(halo.material.uniforms.revealProgress!.value).toBe(0)
      expect(halo.material.uniforms.revealAxis!.value.y).toBe(1)
      expect(halo.material.uniforms.revealMin!.value).toBeCloseTo(1.12 - 2.115 / 2)
      const top = halos.children[2] as Mesh<PlaneGeometry, ShaderMaterial>
      expect(top.material.uniforms.revealStart!.value).toBe(0.7)
      expect(top.material.uniforms.revealAxis!.value.x).toBe(1)
      finish.applyLighting(0.2, 4, 0.25, 0.5)
      expect(screen.material.emissiveIntensity).toBe(0.5)
      expect(halo.material.uniforms.revealProgress!.value).toBe(0.5)
      finish.applyLighting(0, 4, 0, 0)
      expect(halo.material.uniforms.revealProgress!.value).toBe(0)
      expect(halos.children).toHaveLength(4)
      const haloDispose = vi.spyOn(halo.geometry, 'dispose')
      const materialDisposes = owned.map(material => vi.spyOn(material, 'dispose'))
      scope.stop()
      expect(model.children).toEqual([...strips, screen])
      strips.forEach((strip, index) => {
        expect(strip.material).toBe(shared)
        expect(strip.geometry).toBe(geometry)
        expect(strip.matrix.equals(transforms[index]!)).toBe(true)
      })
      expect(screen.material).toBe(screenMaterial)
      expect(geometryDispose).not.toHaveBeenCalled()
      expect(originalDispose).not.toHaveBeenCalled()
      expect(haloDispose).toHaveBeenCalledOnce()
      materialDisposes.forEach(dispose => expect(dispose).toHaveBeenCalledOnce())
    } finally {
      scope.stop(); canvas.mockRestore()
      geometry.dispose(); shared.dispose(); screenMaterial.dispose()
    }
  })
})
