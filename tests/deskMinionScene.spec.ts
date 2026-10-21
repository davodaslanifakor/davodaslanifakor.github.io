import type { Mesh } from 'three'
import { PerspectiveCamera, Vector3 } from 'three'
import { effectScope } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useDeskMinion } from '../composables/useDeskMinion'
import { createDeskMinion } from '../utils/deskMinionScene'
import { deskMinionFocus, measureDeskWorld, MINION_IDS } from '../utils/deskPlayground'
import { deskModel } from './helpers/deskModel'

describe('desk Minion rendering', () => {
  it('clones each figure, visibly separates the plug, blacks out the correct screen, and restores shared assets', () => {
    const asset = deskModel(), scope = effectScope()
    const geometryDisposals = asset.geometries.map(g => vi.spyOn(g, 'dispose'))
    const materialDispose = vi.spyOn(asset.material, 'dispose')
    try {
      for (const id of MINION_IDS) {
        const world = measureDeskWorld(asset.model, id)
        const game = scope.run(() => useDeskMinion({ character: () => id, world: () => world, ready: () => true, reducedMotion: () => true }))!
        const source = asset.model.getObjectByName(`root_${id}`)!, pose = source.matrix.clone()
        const screen = asset.model.getObjectByName('int_monitor_screen') as Mesh
        const monitor = asset.model.getObjectByName('int_screen_left') as Mesh
        const original = screen.material, monitorOriginal = monitor.material
        const scene = createDeskMinion(asset.model, id, world)
        expect(source.visible).toBe(false)
        scene.update(game.state.value, true, 0)
        const connectedZ = scene.plug.position.z
        scene.update({ ...game.state.value, laptopOn: false, monitorConnected: false }, true, 0)
        expect(scene.plug.position.z).toBeGreaterThan(connectedZ + 0.035)
        expect(screen.material).not.toBe(original)
        expect(monitor.material).not.toBe(monitorOriginal)
        scene.update({ ...game.state.value, laptopOn: true, monitorConnected: false }, true, 0)
        expect(screen.material).toBe(original)
        expect(monitor.material).not.toBe(monitorOriginal)
        scene.dispose()
        expect(screen.material).toBe(original)
        expect(monitor.material).toBe(monitorOriginal)
        expect(source.visible).toBe(true)
        expect(source.matrix.equals(pose)).toBe(true)
      }
      expect(materialDispose).not.toHaveBeenCalled()
      geometryDisposals.forEach(spy => expect(spy).not.toHaveBeenCalled())
    } finally { scope.stop(); asset.dispose() }
  })

  it('frames the actor and its jump above controls on desktop, portrait, and landscape', () => {
    const world = measureDeskWorld(null)
    for (const [width, height] of [[1280, 800], [390, 844], [667, 375]] as const) {
      for (const position of [world.front, world.cable]) {
        const frame = deskMinionFocus(world, width / height, height, position)
        const camera = new PerspectiveCamera(38, width / height, 0.05, 50)
        camera.position.copy(frame.position); camera.lookAt(frame.target); camera.updateMatrixWorld()
        for (const y of [0, 0.25]) {
          const point = new Vector3(position.x, position.y + y, position.z).project(camera)
          expect(Math.abs(point.x)).toBeLessThan(0.9)
          expect(Math.abs(point.y)).toBeLessThan(0.9)
          const bottom = height - (height < 500 ? 145 : width < 700 ? 240 : 175)
          expect((1 - point.y) * height / 2).toBeLessThan(bottom)
        }
      }
    }
  })
})
