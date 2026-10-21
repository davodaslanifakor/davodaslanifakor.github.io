import { describe, expect, it } from 'vitest'
import { Group } from 'three'
import type { Mesh } from 'three'
import { initialJokerState } from '../utils/jokerAdventure'
import { createJokerVehicleMotion } from '../utils/jokerVehicleMotion'
import { disposeJokerAsset } from '../utils/jokerAdventureScene'
import { jokerModel } from './helpers/jokerModel'

describe('car contact feedback', () => {
  it('grounds the shadow on the rug and settles a landing without moving the collision body', () => {
    const root = jokerModel(), parent = new Group(); parent.add(root)
    const motion = createJokerVehicleMotion(root, parent, [{ min: { x: -1, y: 0, z: 0 }, max: { x: 1, y: .018, z: 1 }, surface: 'floor' }])
    const body = root.getObjectByName('JA_CarBody')!, originalY = body.position.y
    const s = { ...initialJokerState(), phase: 'driving' as const, inCar: true, onFloor: true, position: { x: 0, y: .018, z: .7 } }
    try {
      motion.update({ ...s, grounded: false, vertical: -.7, position: { ...s.position, y: .025 } }, 1 / 60, false)
      motion.update(s, 1 / 60, false)
      expect(body.position.y).toBeLessThan(originalY)
      const shadow = parent.getObjectByName('JA_CarContactShadow') as Mesh
      expect(shadow.position.y).toBeCloseTo(.0195)
      const paused = body.position.y
      motion.update({ ...s, paused: true }, 0, false)
      expect(body.position.y).toBe(paused)
      for (let i = 0; i < 120; i++) motion.update(s, 1 / 60, false)
      expect(body.position.y).toBeCloseTo(originalY, 5)
      expect(s.position.y).toBe(.018)
      motion.update({ ...s, steering: 1, speed: .6 }, 1 / 60, true)
      expect(body.rotation.x).toBe(0); expect(body.rotation.z).toBe(0)
    } finally { disposeJokerAsset(parent) }
  })
})
