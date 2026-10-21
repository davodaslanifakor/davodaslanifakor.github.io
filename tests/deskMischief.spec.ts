import { effectScope } from 'vue'
import { Box3, BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'
import type { Mesh } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { useDeskMinion } from '../composables/useDeskMinion'
import { createDeskMinion } from '../utils/deskMinionScene'
import { createMinionRig, limbElbow } from '../utils/minionRig'
import { keyGeometry, keyboardParts } from '../utils/deskKeyboard'
import { deskHeightAt, measureDeskWorld, MINION_IDS, safeMouseOffset, worldWithMouse } from '../utils/deskPlayground'
import { deskModel } from './helpers/deskModel'
import { readRoomGlb } from './helpers/glb'

describe('desk mischief props and articulation', () => {
  it('recovers actual keycaps without losing triangles, and moves only the pressed key', async () => {
    const asset = deskModel(), document = readRoomGlb(), scope = effectScope()
    const source = asset.model.getObjectByName('static_laptop_keycaps') as Mesh
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute((await document.attribute(source.name, 'POSITION')).flat(), 3))
    geometry.setIndex(await document.indices(source.name)); source.geometry = geometry
    asset.model.updateMatrixWorld(true)
    const parts = keyboardParts(source)
    expect(parts).toHaveLength(78)
    expect(parts.reduce((count, part) => count + part.indices.length, 0)).toBe(geometry.index!.count)
    for (const part of parts) {
      const key = keyGeometry(geometry, part); key.computeBoundingBox()
      expect(key.boundingBox!.equals(part.bounds)).toBe(true); key.dispose()
    }
    const world = measureDeskWorld(asset.model), game = scope.run(() => useDeskMinion({ character: () => 'paratrooper', world: () => world, reducedMotion: () => false, ready: () => true }))!
    const stage = createDeskMinion(asset.model, 'paratrooper', world)
    try {
      const before = new Box3().setFromObject(stage.props.keys[3]!).getCenter(new Vector3())
      stage.update({ ...game.state.value, phase: 'roaming', pressedKey: 3, keyPulse: 0.09 }, false, 0.02)
      const after = new Box3().setFromObject(stage.props.keys[3]!).getCenter(new Vector3())
      expect(after.y).toBeLessThan(before.y - 0.001)
      expect(stage.props.keys.filter(key => key.position.y !== 0)).toHaveLength(1)
      stage.update({ ...game.state.value, phase: 'roaming', pressedKey: 4, keyPulse: 0.09 }, false, 0.02)
      expect(stage.props.keys[3]!.position.y).toBe(0)
      expect(stage.pickTargets).not.toContain(source)
      const screen = asset.model.getObjectByName('int_monitor_screen') as Mesh, original = screen.material
      stage.update({ ...game.state.value, phase: 'roaming', keystrokes: 4 }, false, 0.02)
      // The canvas backend is optional in headless tests; the source screen must always be restorable.
      if (stage.props.laptopMaterial()) expect(screen.material).toBe(stage.props.laptopMaterial())
      stage.update({ ...game.state.value, phase: 'roaming' }, true, 0)
      expect(screen.material).toBe(original)
    } finally { stage.dispose(); scope.stop(); geometry.dispose(); asset.dispose() }
  })

  it('restores all spectators, keycaps, mouse and Joker without disposing borrowed resources', () => {
    const asset = deskModel(), scope = effectScope(), world = measureDeskWorld(asset.model)
    const game = scope.run(() => useDeskMinion({ character: () => 'robot', world: () => world, reducedMotion: () => false, ready: () => true }))!
    const names = [...MINION_IDS.map(id => `root_${id}`), 'root_bugjar', 'root_mouse', 'static_laptop_keycaps']
    const sources = names.map(name => asset.model.getObjectByName(name)!)
    const originalMatrices = sources.map(source => source.matrixWorld.clone())
    const sharedDispose = vi.spyOn(asset.material, 'dispose')
    const stage = createDeskMinion(asset.model, 'robot', world)
    try {
      sources.forEach(source => expect(source.visible).toBe(false))
      const state = { ...game.state.value, phase: 'roaming' as const, reaction: 1.8, mouseOffset: 0.1 }
      const oldMouseX = stage.props.mouse.position.x
      stage.update(state, false, 0.05)
      expect(stage.props.mouse.position.x).toBeCloseTo(oldMouseX + 0.1)
      expect(Math.abs(stage.props.head.rotation.y)).toBeGreaterThan(0.2)
      const headAngle = stage.props.head.rotation.y
      stage.update({ ...state, phase: 'paused' }, false, 0.05)
      expect(stage.props.head.rotation.y).toBe(headAngle)
      stage.update(game.state.value, true, 0)
      expect(stage.props.head.rotation.y).toBeCloseTo(0)
      expect(stage.props.mouse.position.x).toBeCloseTo(oldMouseX)
    } finally { stage.dispose(); scope.stop() }
    sources.forEach((source, i) => { expect(source.visible).toBe(true); expect(source.matrixWorld.equals(originalMatrices[i]!)).toBe(true) })
    expect(sharedDispose).not.toHaveBeenCalled(); asset.dispose()
  })

  it('preserves bone lengths and finite poses for every character, retaining the Peace sign', () => {
    const asset = deskModel(), scope = effectScope(), world = measureDeskWorld(asset.model)
    const game = scope.run(() => useDeskMinion({ character: () => 'robot', world: () => world, reducedMotion: () => false, ready: () => true }))!
    try {
      for (const id of MINION_IDS) {
        const rig = createMinionRig(asset.model.getObjectByName(`root_${id}`)!, id)
        expect(rig.limbs).toHaveLength(4)
        if (id === 'cards') expect(rig.sign.children.length).toBeGreaterThan(0)
        for (const action of [null, 'laptop', 'cable', 'mouse', 'keyboard'] as const) {
          for (const time of [0, 0.25, 0.52, 1.44, 1.6, 2.2]) {
            rig.update({ ...game.state.value, phase: action ? 'acting' : 'roaming', action, actionTime: time, travelled: time * 0.1 }, false, 0.05, [new Vector3(world.front.x, 0.76, world.front.z - 0.03)])
            rig.actor.traverse(object => expect(object.matrixWorld.elements.every(Number.isFinite)).toBe(true))
            for (const limb of rig.limbs) {
              const shoulder = limb.upper.getWorldPosition(new Vector3()), elbow = limb.lower.getWorldPosition(new Vector3()), hand = limb.end.getWorldPosition(new Vector3())
              expect(shoulder.distanceTo(elbow)).toBeCloseTo(limb.length, 5)
              expect(elbow.distanceTo(hand)).toBeCloseTo(limb.length, 5)
            }
          }
        }
        rig.dispose()
      }
      const elbow = limbElbow(new Vector3(), new Vector3(0, -0.03, 0), 0.02, 0.02, new Vector3(1, 0, 0))
      expect(elbow.length()).toBeCloseTo(0.02, 6)
      expect(elbow.distanceTo(new Vector3(0, -0.03, 0))).toBeCloseTo(0.02, 6)
    } finally { scope.stop(); asset.dispose() }
  })

  it('places hands on the power sensor and plug at their contact frames', () => {
    const asset = deskModel(), scope = effectScope(), world = measureDeskWorld(asset.model)
    const game = scope.run(() => useDeskMinion({ character: () => 'paratrooper', world: () => world, reducedMotion: () => false, ready: () => true }))!
    try {
      for (const character of MINION_IDS) {
        const stage = createDeskMinion(asset.model, character, world)
        for (const action of ['laptop', 'cable'] as const) {
          const position = { ...world[action]! }
          position.y = deskHeightAt(world, position.x, position.z).height
          const state = { ...game.state.value, phase: 'acting' as const, action, actionTime: action === 'laptop' ? 0.52 : 1.44, body: { ...game.state.value.body, position, heading: Math.PI } }
          for (let i = 0; i < 30; i++) stage.update(state, false, 0.05)
          const target = action === 'laptop' ? asset.model.getObjectByName('static_mac_touch_id_sensor.001')!.getWorldPosition(new Vector3()).add(new Vector3(0, 0.004, 0)) : stage.plug.position.clone().add(new Vector3(0, 0.006, 0))
          const distances = stage.rig.limbs.filter(limb => limb.arm).map(limb => limb.end.getWorldPosition(new Vector3()).distanceTo(target))
          expect(Math.min(...distances), `${character} ${action}: ${distances}`).toBeLessThan(action === 'laptop' ? 0.008 : 0.019)
        }
        stage.dispose()
      }
    } finally { scope.stop(); asset.dispose() }
  })

  it('stops the mouse before obstacles and desk edges and translates its collision surface', () => {
    const world = measureDeskWorld(null)
    world.mouseBounds = new Box3(new Vector3(0, 0.75, 0), new Vector3(0.08, 0.78, 0.12))
    world.surfaces = [{ id: 'static_mouse', walkable: true, bounds: world.mouseBounds.clone() }, { id: 'blocker', walkable: false, bounds: new Box3(new Vector3(0.2, 0.75, 0), new Vector3(0.3, 0.9, 0.1)) }]
    const offset = safeMouseOffset(world, 0, 0.3)
    expect(offset).toBeGreaterThan(0.08); expect(offset).toBeLessThan(0.11)
    const shifted = worldWithMouse(world, offset)
    expect(shifted.surfaces[0]!.bounds.min.x).toBeCloseTo(offset)
    expect(world.surfaces[0]!.bounds.min.x).toBe(0)
    world.surfaces.pop()
    expect(safeMouseOffset(world, 0, 2)).toBeLessThan(world.desk.max.x - 0.08)
  })
})
