import { describe, expect, it, vi } from 'vitest'
import { Box3, Vector3 } from 'three'
import type { LineSegments, Material } from 'three'
import { initialJokerState } from '../utils/jokerAdventure'
import { createJokerVehicleEffects } from '../utils/jokerVehicleEffects'
import { disposeJokerAsset } from '../utils/jokerAdventureScene'
import { jokerModel } from './helpers/jokerModel'

describe('Joker nitro and umbrella', () => {
  it('fires from both exhausts, follows a rotated car and fades on release', () => {
    const root = jokerModel(), effects = createJokerVehicleEffects(root), car = root.getObjectByName('JA_Car')!
    const s = { ...initialJokerState(), phase: 'driving' as const, inCar: true, boosting: true, speed: .6 }
    try {
      car.position.set(0, .754, 0); car.rotation.set(0, Math.PI / 2, 0)
      for (let i = 0; i < 20; i++) effects.update(s, 1 / 60, false)
      root.updateMatrixWorld(true)
      const nitro = root.getObjectByName('JA_Nitro')!
      expect(nitro.visible).toBe(true)
      expect(nitro.children.filter(node => node.type === 'Group')).toHaveLength(2)
      const bounds = new Box3().setFromObject(nitro)
      expect(bounds.max.x).toBeLessThan(-.085)
      expect(bounds.getSize(new Vector3()).x).toBeGreaterThan(.06)
      const paused = bounds.clone()
      effects.update({ ...s, paused: true }, 0, false); root.updateMatrixWorld(true)
      expect(new Box3().setFromObject(nitro).equals(paused)).toBe(true)
      for (let i = 0; i < 20; i++) effects.update({ ...s, boosting: false }, 1 / 60, false)
      expect(nitro.visible).toBe(false)
      const visibleLights: string[] = []
      root.traverseVisible(node => { if (node.type === 'PointLight') visibleLights.push(node.uuid) })
      expect(visibleLights).toHaveLength(1)
    } finally { disposeJokerAsset(root) }
  })
  it('opens a car-sized canopy above the seat and folds it after landing', () => {
    const root = jokerModel(), effects = createJokerVehicleEffects(root)
    const actor = root.getObjectByName('JA_Joker')!, canopy = root.getObjectByName('JA_Umbrella')!
    const tethers = root.getObjectByName('JA_UmbrellaTethers') as LineSegments
    const geometryDisposed = vi.spyOn(tethers.geometry, 'dispose'), materialDisposed = vi.spyOn(tethers.material as Material, 'dispose')
    actor.position.set(0, .45, 0); actor.rotation.set(0, 0, 0)
    const s = { ...initialJokerState(), phase: 'driving' as const, inCar: true, gliding: true, canopy: 1 }
    try {
      effects.update(s, .02, false); root.updateMatrixWorld(true)
      expect(canopy.visible).toBe(true)
      const bounds = new Box3().setFromObject(canopy)
      expect(bounds.getSize(new Vector3()).x).toBeGreaterThan(.23)
      expect(bounds.min.y).toBeGreaterThan(actor.position.y + .07)
      expect(root.getObjectByName('JA_UmbrellaTethers')!.visible).toBe(true)
      effects.update({ ...s, gliding: false, canopy: 0 }, .02, false)
      expect(canopy.visible).toBe(false)
      expect(root.getObjectByName('JA_UmbrellaTethers')!.visible).toBe(false)
    } finally { disposeJokerAsset(root); expect(geometryDisposed).toHaveBeenCalledOnce(); expect(materialDisposed).toHaveBeenCalledOnce() }
  })
})
