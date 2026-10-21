import { describe, expect, it } from 'vitest'
import { Box3, PerspectiveCamera, Ray, Vector3 } from 'three'
import { createJokerCamera, jokerCameraPose } from '../utils/jokerAdventureCamera'
import { initialJokerState } from '../utils/jokerAdventure'
import type { JokerState } from '../utils/jokerAdventure'
const car = { x: 1.345, y: .056, z: -.12 }
const state: JokerState = { ...initialJokerState(), phase: 'driving', inCar: true, garageOpen: true, position: car, carPosition: car }
describe('gameplay camera', () => {
  it('finds room around the car when reversing against a wall instead of crowding the driver', () => {
    const wall = new Box3(new Vector3(-2, 0, -.48), new Vector3(2, 3, -.42))
    const camera = new PerspectiveCamera(46, .46, .003), rig = createJokerCamera([wall])
    const p = { x: .5, y: 0, z: -.30 }
    const s = { ...state, freePlay: true, onFloor: true, position: p, carPosition: p, yaw: 0 }
    for (let i = 0; i < 120; i++) rig.update(s, p, p, camera, 1 / 60, false)
    expect(camera.position.z).toBeGreaterThan(-.42)
    expect(camera.position.distanceTo(new Vector3(p.x, p.y + .045, p.z))).toBeGreaterThan(.25)
    rig.dispose()
  })
  it('keeps the car framed below the desk when the overhead chase view is blocked', () => {
    const desk = new Box3(new Vector3(-1.2, .71, -.4), new Vector3(.86, .754, .36))
    const camera = new PerspectiveCamera(46, 1.5, .003), rig = createJokerCamera([desk])
    const p = { x: -.5, y: .42, z: -.1 }
    const s = { ...state, freePlay: true, onFloor: true, grounded: false, position: p, carPosition: p, yaw: Math.PI }
    for (let i = 0; i < 120; i++) rig.update(s, p, p, camera, 1 / 60, false)
    expect(desk.containsPoint(camera.position)).toBe(false)
    expect(camera.position.y).toBeLessThan(.71)
    const carOnScreen = new Vector3(p.x, p.y + .03, p.z).project(camera)
    expect(Math.abs(carOnScreen.x)).toBeLessThan(.8)
    expect(Math.abs(carOnScreen.y)).toBeLessThan(.8)
    rig.dispose()
  })
  it('keeps the whole garage entrance ahead of the camera while walking and driving', () => {
    for (const phase of ['garage', 'driving'] as const) for (const aspect of [.46, 1.77]) {
      const pose = jokerCameraPose({ ...state, phase }, car, car, aspect, false)
      expect(pose.position.z).toBeGreaterThan(.60)
      expect(pose.position.y).toBeGreaterThan(.15)
      expect(pose.target.x).toBeCloseTo(1.30)
    }
  })
  it('frames boarding from the open side with a clear view through the garage entrance', () => {
    for (const aspect of [.46, 1.77]) {
      const s = { ...state, phase: 'entering' as const, inCar: false, transitionFrom: { x: 1.27, y: .056, z: -.1 } }
      const pose = jokerCameraPose(s, s.transitionFrom, car, aspect, false)
      expect(pose.position.z).toBeGreaterThan(.20)
      expect(pose.position.x).toBeLessThan(car.x)
      const entrance = pose.target.clone().lerp(pose.position, (.10 - pose.target.z) / (pose.position.z - pose.target.z))
      expect(entrance.x).toBeGreaterThan(1.21); expect(entrance.x).toBeLessThan(1.48)
      expect(entrance.y).toBeLessThan(.30)
      const camera = new PerspectiveCamera(pose.fov, aspect, .003)
      camera.position.copy(pose.position); camera.lookAt(pose.target); camera.updateMatrixWorld()
      for (const p of [car, s.transitionFrom]) {
        const projected = new Vector3(p.x, p.y + .03, p.z).project(camera)
        expect(Math.abs(projected.x)).toBeLessThan(.85)
        expect(Math.abs(projected.y)).toBeLessThan(.85)
      }
      expect(jokerCameraPose(s, s.transitionFrom, car, aspect, true).position.z).toBeGreaterThan(.60)
    }
  })
  it('keeps both boarding views clear of the tall lift rails', () => {
    for (const side of [-1, 1]) for (const aspect of [.46, 1.77]) {
      const actor = { x: car.x + side * .10, y: .09, z: car.z }
      const s = { ...state, phase: 'entering' as const, inCar: false, transitionFrom: actor }
      const pose = jokerCameraPose(s, actor, car, aspect, false)
      for (const subject of [actor, car]) {
        const target = new Vector3(subject.x, subject.y + .025, subject.z)
        const ray = new Ray(pose.position, target.clone().sub(pose.position).normalize())
        for (const x of [1.225, 1.465]) {
          const rail = new Box3(new Vector3(x - .007, .05, .121), new Vector3(x + .007, .99, .139))
          const hit = ray.intersectBox(rail, new Vector3())
          expect(hit && hit.distanceTo(pose.position) < target.distanceTo(pose.position)).toBeFalsy()
        }
      }
    }
  })
  it('fits both Joker at the latch and the parked car on a narrow screen', () => {
    const actor = { x: 1.165, y: .09, z: .17 }
    const camera = new PerspectiveCamera(46, .46, .003), rig = createJokerCamera([])
    rig.update({ ...state, phase: 'garage', inCar: false }, actor, car, camera, .016, true)
    for (const p of [actor, car]) {
      const projected = new Vector3(p.x, p.y + .03, p.z).project(camera)
      expect(Math.abs(projected.x)).toBeLessThan(.85)
      expect(Math.abs(projected.y)).toBeLessThan(.85)
    }
  })

  it('eases a cockpit switch without teleporting or snapping FOV', () => {
    const camera = new PerspectiveCamera(46, 1.6, .05)
    const rig = createJokerCamera([])
    camera.position.set(1.3, .29, .65); camera.lookAt(1.3, .12, .04)
    rig.update(state, car, car, camera, 1 / 60, false)
    const previous = camera.position.clone(), fov = camera.fov
    rig.update({ ...state, cockpit: true }, car, car, camera, 1 / 60, false)
    expect(camera.position.distanceTo(previous)).toBeLessThan(.12)
    expect(camera.fov - fov).toBeLessThan(4)
    rig.dispose(); expect(camera.near).toBe(.05); expect(camera.fov).toBe(46)
  })
  it('keeps the optical centre above controls and restores projection on exit', () => {
    const camera = new PerspectiveCamera(38, .5, .05), rig = createJokerCamera([])
    const s = { ...state, inCar: false, phase: 'walking' as const, position: { x: .5, y: .754, z: .1 } }
    const pose = jokerCameraPose(s, s.position, car, .5, true)
    rig.update(s, s.position, car, camera, .016, true, { width: 400, height: 800, top: 150, bottom: 240 })
    const projected = pose.target.clone().project(camera)
    const y = (1 - projected.y) * 400
    expect(y).toBeGreaterThan(150); expect(y).toBeLessThan(560)
    rig.dispose(); expect(camera.view).toBeNull()
  })
  it('keeps a clear sightline around a solid object instead of placing the camera inside it', () => {
    const blocker = new Box3(new Vector3(.3, .8, .32), new Vector3(.7, 1.3, .5))
    const camera = new PerspectiveCamera(46, 1, .05), rig = createJokerCamera([blocker])
    const s = { ...state, phase: 'walking' as const, inCar: false, position: { x: .5, y: .754, z: .1 } }
    rig.update(s, s.position, car, camera, .016, true)
    expect(blocker.containsPoint(camera.position)).toBe(false)
    const target = new Vector3(s.position.x, s.position.y + .04, s.position.z)
    const ray = new Ray(target, camera.position.clone().sub(target).normalize())
    const hit = ray.intersectBox(blocker, new Vector3())
    expect(hit && hit.distanceTo(target) < camera.position.distanceTo(target)).toBeFalsy()
  })
  it('does not force a minimum camera distance through a nearby screen', () => {
    const screen = new Box3(new Vector3(.3, .78, .16), new Vector3(.7, 1.3, .25))
    const camera = new PerspectiveCamera(46, 1, .05), rig = createJokerCamera([screen])
    const s = { ...state, phase: 'walking' as const, inCar: false, position: { x: .5, y: .754, z: .1 } }
    rig.update(s, s.position, car, camera, .016, true)
    expect(camera.position.z).toBeLessThan(.16)
    expect(screen.containsPoint(camera.position)).toBe(false)
  })
})
