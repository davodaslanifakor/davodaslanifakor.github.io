import { describe, expect, it } from 'vitest'
import { AnimationClip, Box3, PerspectiveCamera, Vector3, VectorKeyframeTrack } from 'three'
import type { Mesh } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { initialJokerState, interactJoker, stepJoker } from '../utils/jokerAdventure'
import type { JokerState } from '../utils/jokerAdventure'
import { JOKER_ENTRY_SECONDS, JOKER_LATCH_EXIT, JOKER_PULL_SECONDS, JOKER_SEAT, jokerCarPoint, jokerEntryPose, jokerPullPose } from '../utils/jokerInteractionPose'
import { createJokerScene, disposeJokerAsset } from '../utils/jokerAdventureScene'
import { createJokerInteractionRig } from '../utils/jokerInteractionRig'
import { jokerModel } from './helpers/jokerModel'

function opening(): JokerState {
  return interactJoker({ ...initialJokerState(), phase: 'garage', position: { x: 1.165, y: .056, z: .17 }, yaw: .8 })
}
function entering(yaw = 0, side = -1): JokerState {
  const car = { x: .05, y: .754, z: -.12 }
  return interactJoker({ ...initialJokerState(), phase: 'walking', lifted: true, onDesk: true, garageOpen: true,
    position: jokerCarPoint({ x: side * .085, y: 0, z: .02 }, car, yaw), carPosition: car, carYaw: yaw, yaw: 2.1 })
}
function finish(s: JokerState, seconds: number, reduced = false) {
  for (let i = 0; i < Math.ceil(seconds * 120); i++) s = stepJoker(s, new Set(), 1 / 120, [], reduced)
  return s
}
function hand(root: ReturnType<typeof jokerModel>, side: string) {
  const mesh = root.getObjectByName(`JA_Joker_hand_${side}`) as Mesh
  mesh.geometry.computeBoundingBox(); root.updateMatrixWorld(true)
  return mesh.localToWorld(mesh.geometry.boundingBox!.getCenter(new Vector3()))
}

describe('Joker physical interactions', () => {
  it('preserves the approach and hands off the latch endpoint without a position jump', () => {
    const s = opening()
    expect(jokerPullPose(s).position.distanceTo(new Vector3(s.position.x, s.position.y, s.position.z))).toBe(0)
    expect(jokerPullPose(s).yaw).toBeCloseTo(s.yaw)
    const end = jokerPullPose({ ...s, time: JOKER_PULL_SECONDS })
    expect(end.position).toMatchObject(JOKER_LATCH_EXIT)
    const done = finish(s, JOKER_PULL_SECONDS + .01)
    expect(done.phase).toBe('garage'); expect(done.position).toEqual(JOKER_LATCH_EXIT)
    expect(done.yaw).toBeCloseTo(Math.PI)
  })
  it('keeps the hand on the book through the pull, and raises the door only after release of the latch', () => {
    const root = jokerModel(), rig = createJokerInteractionRig(root), s = opening()
    try {
      for (const progress of [.40, .48, .60, .72]) {
        const state = { ...s, time: progress * JOKER_PULL_SECONDS }, pose = jokerPullPose(state)
        rig.update(state, false)
        expect(hand(root, 'r').distanceTo(pose.grip)).toBeLessThan(.001)
        if (progress < .64) expect(pose.doorLift).toBe(0)
      }
      rig.update({ ...s, time: JOKER_PULL_SECONDS }, false)
      expect(root.getObjectByName('JA_GarageDoor')!.position.y).toBeCloseTo(.294)
    } finally { disposeJokerAsset(root) }
  })
  it.each([-1, 1])('opens side %s outward with the hand following its handle', side => {
    const root = jokerModel(), rig = createJokerInteractionRig(root), s = entering(.7, side)
    try {
      for (const progress of [.33, .40, .47]) {
        const state = { ...s, time: progress * JOKER_ENTRY_SECONDS }, pose = jokerEntryPose(state)
        rig.update(state, false)
        expect(hand(root, side < 0 ? 'r' : 'l').distanceTo(pose.handle)).toBeLessThan(.001)
        expect(pose.doorAngle * side).toBeLessThanOrEqual(0)
      }
    } finally { disposeJokerAsset(root) }
  })
  it('walks around the bumper, then climbs through the doorway before sitting', () => {
    const s = entering(); s.transitionFrom = jokerCarPoint({ x: 0, y: 0, z: .105 }, s.carPosition, 0)
    for (let i = 0; i <= 26; i++) {
      const pose = jokerEntryPose({ ...s, time: i / 100 * JOKER_ENTRY_SECONDS })
      const local = pose.position.sub(new Vector3(s.carPosition.x, s.carPosition.y, s.carPosition.z))
      expect(Math.abs(local.x) >= .060 - .001 || Math.abs(local.z) >= .103).toBe(true)
    }
    const step = jokerEntryPose({ ...s, time: .69 * JOKER_ENTRY_SECONDS })
    expect(step.position.y).toBeGreaterThan(s.carPosition.y + .02)
    expect(step.seated).toBeLessThan(1)
    expect(jokerEntryPose({ ...s, time: JOKER_ENTRY_SECONDS }).doorAngle).toBe(0)
  })
  it.each([false, true])('boards the actual rotated parked car, including reduced motion = %s', reduced => {
    const s = entering(-1.3)
    expect(s.phase).toBe('entering'); expect(s.inCar).toBe(false)
    const end = jokerEntryPose({ ...s, time: JOKER_ENTRY_SECONDS })
    expect(end.position.distanceTo(jokerCarPoint(JOKER_SEAT, s.carPosition, s.carYaw))).toBeLessThan(.00001)
    const paused = { ...s, paused: true, time: 1.8 }
    expect(finish(paused, 1, reduced)).toBe(paused)
    const done = finish(s, reduced ? 1 : 4.81, reduced)
    expect(done.phase).toBe('driving'); expect(done.position).toEqual(s.carPosition)
    expect(done.yaw).toBe(s.carYaw); expect(done.cockpit).toBe(false)
  })
  it('fits the seated hips and hands to the actual exported seat and steering wheel', () => {
    const root = jokerModel(), rig = createJokerInteractionRig(root)
    const s = finish(entering(.9), 4.81), car = root.getObjectByName('JA_Car')!
    car.position.copy(new Vector3(s.position.x, s.position.y, s.position.z)); car.rotation.set(0, s.yaw, 0)
    try {
      rig.update(s, false); root.updateMatrixWorld(true)
      const hips = new Box3().setFromObject(root.getObjectByName('JA_Joker_hips')!)
      const seat = new Box3().setFromObject(root.getObjectByName('JA_Seat_cushion')!)
      expect(Math.abs(hips.min.y - seat.max.y)).toBeLessThan(.0002)
      const wheel = root.getObjectByName('JA_Steering')!
      for (const [side, x] of [['l', -.01], ['r', .01]] as const) expect(hand(root, side).distanceTo(wheel.localToWorld(new Vector3(x, 0, 0)))).toBeLessThan(.001)
    } finally { disposeJokerAsset(root) }
  })
  it('keeps the garage/lift open during re-entry and resets both doors on replay', () => {
    const root = jokerModel(), room = jokerModel()
    const track = new VectorKeyframeTrack('JA_Car.position', [0, 34], [1.345, .056, -.12, 1.345, .056, -.12])
    const game = createJokerScene({ scene: root, animations: [new AnimationClip('test', 34, [track])] } as GLTF, room)
    const camera = new PerspectiveCamera(), s = entering()
    try {
      game.update({ ...s, time: 2.2 }, camera, 100, false)
      expect(root.getObjectByName('JA_GarageDoor')!.position.y).toBeCloseTo(.294)
      expect(root.getObjectByName('JA_Lift')!.position.y).toBeCloseTo(.940)
      expect(root.getObjectByName('JA_Car')!.position).toMatchObject(s.carPosition)
      game.update(initialJokerState(), camera, 200, false)
      expect(root.getObjectByName('JA_GarageDoor')!.position.y).toBeCloseTo(.012)
      expect(root.getObjectByName('JA_CarDoor_-1')!.rotation.y).toBe(0)
    } finally { game.dispose(); disposeJokerAsset(room) }
  })
  it('keeps the car tyres exactly on the lift throughout the ascent', () => {
    const root = jokerModel(), rig = createJokerInteractionRig(root)
    let s = interactJoker({ ...initialJokerState(), phase: 'driving', inCar: true, garageOpen: true, position: { x: 1.33, y: .056, z: .24 } })
    try {
      for (let i = 0; i < 430; i++) {
        s = stepJoker(s, new Set(), 1 / 120)
        rig.update(s, false); root.updateMatrixWorld(true)
        const platform = new Box3().setFromObject(root.getObjectByName('JA_Lift_platform')!)
        const car = root.getObjectByName('JA_Car')!
        expect(Math.abs(car.position.y - platform.max.y)).toBeLessThan(.00001)
        expect(car.position.distanceTo(new Vector3(s.position.x, s.position.y, s.position.z))).toBeLessThan(.00001)
      }
    } finally { disposeJokerAsset(root) }
  })
})
