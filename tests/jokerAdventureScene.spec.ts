import { describe, expect, it, vi } from 'vitest'
import { AnimationClip, AnimationMixer, Group, Object3D, PerspectiveCamera, VectorKeyframeTrack } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { createJokerScene } from '../utils/jokerAdventureScene'
import { initialJokerState } from '../utils/jokerAdventure'
function fixture() {
  const room = new Group(), scene = new Group()
  for (const name of ['root_bugjar', 'root_phone', 'static_phone_stand']) { const node = new Object3D(); node.name = name; room.add(node) }
  room.getObjectByName('static_phone_stand')!.visible = false
  for (const name of ['JA_Joker', 'JA_Car', 'root_phone', 'JA_PhoneCrack_0', 'JA_GrappleCable', 'JA_Umbrella']) { const node = new Object3D(); node.name = name; scene.add(node) }
  const track = new VectorKeyframeTrack('root_phone.position', [1 / 24, 815 / 24], [.405, .823, .185, .276, .7541, .107])
  const asset = { scene, animations: [new AnimationClip('fall', -1, [track])] } as GLTF
  return { room, scene, game: createJokerScene(asset, room) }
}
describe('adventure scene ownership', () => {
  it.each([false, true])('keeps the room intact until the first prepared game frame (reduced motion: %s)', reduced => {
    const { room, scene, game } = fixture(), camera = new PerspectiveCamera(38, 1.5, .05)
    const visible: Object3D[] = []
    try {
      // Loading can finish while the room camera is still moving and update is gated.
      game.group.traverseVisible(node => visible.push(node))
      expect(visible).toHaveLength(0)
      expect(room.getObjectByName('root_bugjar')!.visible).toBe(true)
      expect(room.getObjectByName('root_phone')!.visible).toBe(true)
      expect(camera.fov).toBe(38)
      expect(camera.near).toBe(.05)

      game.update(initialJokerState(), camera, 100, reduced)
      expect(game.group.visible).toBe(true)
      expect(room.getObjectByName('root_bugjar')!.visible).toBe(false)
      expect(room.getObjectByName('root_phone')!.visible).toBe(false)
      expect(scene.getObjectByName('root_phone')!.position.x).toBeCloseTo(.405)
      for (const name of ['JA_PhoneCrack_0', 'JA_GrappleCable', 'JA_Umbrella', 'JA_Nitro', 'JA_UmbrellaTethers']) {
        expect(scene.getObjectByName(name)!.visible, name).toBe(false)
      }
    } finally { game.dispose() }
    expect(room.getObjectByName('root_bugjar')!.visible).toBe(true)
    expect(room.getObjectByName('root_phone')!.visible).toBe(true)
    expect(room.getObjectByName('static_phone_stand')!.visible).toBe(false)
  })
  it('can leave before the first game frame without presenting props or hiding room objects', () => {
    const { room, game } = fixture()
    try {
      expect(game.group.visible).toBe(false)
      expect(room.getObjectByName('root_bugjar')!.visible).toBe(true)
    } finally { game.dispose() }
    expect(room.getObjectByName('root_bugjar')!.visible).toBe(true)
    expect(room.getObjectByName('root_phone')!.visible).toBe(true)
    expect(room.getObjectByName('static_phone_stand')!.visible).toBe(false)
  })
  it('does not resample the entire authored animation every frame during runtime movement', () => {
    const { game } = fixture(), camera = new PerspectiveCamera()
    const sample = vi.spyOn(AnimationMixer.prototype, 'setTime')
    try {
      for (let i = 0; i < 10; i++) game.update({ ...initialJokerState(), phase: 'driving', inCar: true, time: i / 60 }, camera, i * 1000 / 60, false)
      expect(sample).toHaveBeenCalledTimes(1)
    } finally { sample.mockRestore(); game.dispose() }
  })
  it('keeps phone damage while Joker and the car move independently in free play', () => {
    const { scene, game } = fixture(), camera = new PerspectiveCamera()
    const s = { ...initialJokerState(), freePlay: true, lifted: true, onDesk: true, garageOpen: true, damage: true, inCar: false, phase: 'walking' as const, position: { x: -.8, y: .754, z: .1 }, carPosition: { x: -.3, y: .754, z: .1 } }
    try {
      game.update(s, camera, 100, false)
      expect(scene.getObjectByName('root_phone')!.position.x).toBeCloseTo(.276, 3)
      expect(scene.getObjectByName('JA_PhoneCrack_0')!.visible).toBe(true)
      expect(scene.getObjectByName('JA_Joker')!.position.x).toBe(-.8)
      expect(scene.getObjectByName('JA_Car')!.position.x).toBe(-.3)
      game.update({ ...s, phase: 'entering', time: 2 }, camera, 200, false)
      expect(scene.getObjectByName('root_phone')!.position.x).toBeCloseTo(.276, 3)
      game.update(initialJokerState(), camera, 300, false)
      expect(scene.getObjectByName('root_phone')!.position.x).toBeCloseTo(.405)
      expect(scene.getObjectByName('JA_PhoneCrack_0')!.visible).toBe(false)
    } finally { game.dispose() }
  })
  it('holds the final phone pose instead of looping to an upright phone', () => {
    const { room, scene, game } = fixture(), camera = new PerspectiveCamera(38, 1.5, .05)
    game.update({ ...initialJokerState(), phase: 'finished', damage: true }, camera, 100, false)
    expect(scene.getObjectByName('root_phone')!.position.x).toBeCloseTo(.276, 3)
    expect(scene.getObjectByName('JA_PhoneCrack_0')!.visible).toBe(true)
    game.update(initialJokerState(), camera, 200, false)
    expect(scene.getObjectByName('root_phone')!.position.x).toBeCloseTo(.405)
    expect(scene.getObjectByName('JA_PhoneCrack_0')!.visible).toBe(false)
    expect(room.getObjectByName('root_phone')!.visible).toBe(false)
    game.dispose()
    expect(room.getObjectByName('root_phone')!.visible).toBe(true)
    expect(room.getObjectByName('static_phone_stand')!.visible).toBe(false)
    expect(camera.fov).toBe(38); expect(camera.near).toBe(.05)
  })
})
