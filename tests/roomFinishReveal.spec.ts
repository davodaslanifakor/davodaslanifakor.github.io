import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { effectScope } from 'vue'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from 'three'
import type { PlaneGeometry, ShaderMaterial } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { bindRoomScreens } from '../utils/roomScreens'
import { useRoomFinish } from '../composables/useRoomFinish'

// Evaluate the actual Three core in a second module scope, as a stale loader can after HMR.
const source = readFileSync(join(dirname(createRequire(import.meta.url).resolve('three')), 'three.core.js'), 'utf8')
const separateThree = runInNewContext(source.replace(/export \{[^}]+\};?\s*$/, '') + ';({ BoxGeometry, Group, Mesh, MeshStandardMaterial })') as typeof import('three')

describe('runtime wall light finish', () => {
  it.each([['same module', { BoxGeometry, Group, Mesh, MeshStandardMaterial }], ['separate module', separateThree]] as const)('finishes and restores loader objects from %s', (_label, constructors) => {
    const { BoxGeometry, Group, Mesh: LoaderMesh, MeshStandardMaterial } = constructors
    if (_label === 'separate module') expect(LoaderMesh).not.toBe(Mesh)
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
      const mesh = new LoaderMesh(geometry, shared)
      mesh.name = `static_style_wall_led_${index}`
      mesh.position.set(x, y, -0.363)
      mesh.scale.set(width, height, 0.006)
      model.add(mesh)
      return mesh
    })
    const screenMaterial = new MeshStandardMaterial({ emissive: '#ffffff', emissiveIntensity: 2 })
    const screen = new LoaderMesh(geometry, screenMaterial)
    screen.name = 'int_monitor_screen'
    model.add(screen)
    model.updateMatrixWorld(true)
    const wall = new LoaderMesh(geometry, new MeshStandardMaterial({ color: '#b59e7d' }))
    wall.name = 'static_style_wall_inset'
    model.add(wall)
    const transforms = strips.map(strip => strip.matrix.clone())
    const geometryDispose = vi.spyOn(geometry, 'dispose')
    const originalDispose = vi.spyOn(shared, 'dispose')
    try {
      const finish = scope.run(useRoomFinish)!
      finish.prepare(model)
      expect(wall.material.color.getHexString()).toBe('252b2f')
      const artwork = new Texture()
      const bound = bindRoomScreens(model, new Map([['int_monitor_screen', artwork]]), 1)
      expect(bound).toEqual([screen.material])
      expect(screen.material.map).toBe(artwork)
      expect(screen.material.emissiveMap).toBe(artwork)
      artwork.dispose()
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
      expect(model.children).toEqual([...strips, screen, wall])
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
