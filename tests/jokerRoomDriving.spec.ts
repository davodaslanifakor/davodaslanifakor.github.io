import { describe, expect, it } from 'vitest'
import { initialJokerState, interactJoker, jokerAction, jokerCarBounds, jumpJoker, stepJoker, JOKER_LIFT_CALL, jokerRampReady } from '../utils/jokerAdventure'
import { jokerLiftPose } from '../utils/jokerInteractionPose'
import type { JokerInput, JokerObstacle, JokerState } from '../utils/jokerAdventure'
import { measureJokerObstacles } from '../utils/jokerAdventureScene'
import { deskModel } from './helpers/deskModel'

function driver(position = { x: -.95, y: .754, z: -.25 }): JokerState {
  return { ...initialJokerState(), phase: 'driving', inCar: true, garageOpen: true, lifted: true, onDesk: true, freePlay: true, position, carPosition: { ...position } }
}
function run(s: JokerState, seconds: number, keys: JokerInput[], obstacles: JokerObstacle[] = []) {
  for (let i = 0; i < seconds * 120; i++) s = stepJoker(s, new Set(keys), 1 / 120, obstacles)
  return s
}
describe('Joker room driving', () => {
  it('recalls the lift from the floor, rides up again and restores the ramp jump cue', () => {
    const room = deskModel()
    try {
      const obstacles = measureJokerObstacles(room.model)
      let s = { ...driver({ ...JOKER_LIFT_CALL, y: 0 }), onDesk: false, onFloor: true, yaw: Math.PI }
      expect(jokerAction(s, obstacles)).toBe('recall')
      s = interactJoker(s, obstacles)
      expect(s.phase).toBe('lowering')
      const waiting = { ...s.position }
      s = run(s, 1.8, ['forward', 'boost'], obstacles)
      expect(s.position).toEqual(waiting)
      expect(jokerLiftPose(s).platformY).toBeGreaterThan(.05)
      expect(jokerLiftPose(s).platformY).toBeLessThan(.94)
      s = run(s, 2, [], obstacles)
      expect(s.lifted).toBe(false)
      expect(s.onFloor && s.freePlay).toBe(true)
      s = run(s, .92, ['forward'], obstacles)
      s = run(s, .25, ['brake'], obstacles)
      expect(jokerAction(s, obstacles)).toBe('lift')
      s = run(interactJoker(s, obstacles), 3.8, [], obstacles)
      expect(s.lifted && s.freePlay && !s.onFloor).toBe(true)
      s = run(s, .75, ['forward', 'boost'], obstacles)
      expect(jokerRampReady(s)).toBe(true)
      s = run(jumpJoker(s), .6, ['forward', 'boost', 'right'], obstacles)
      s = run(s, .6, ['brake'], obstacles)
      expect(s.onDesk && s.freePlay).toBe(true)
      expect(s.falls).toBe(0)
    } finally { room.dispose() }
  })
  it('recalls on foot without moving the parked car and ignores repeat actions while lowering', () => {
    const s = { ...driver({ ...JOKER_LIFT_CALL, y: 0 }), phase: 'walking' as const, inCar: false, onDesk: false, onFloor: true, carPosition: { x: 1.6, y: 0, z: .7 } }
    const lowering = interactJoker(s)
    expect(jokerAction(lowering)).toBeNull()
    const next = run(lowering, 4, [])
    expect(next.phase).toBe('walking')
    expect(next.carPosition).toEqual(s.carPosition)
    expect(next.position.x).toBe(s.position.x)
    expect(next.lifted).toBe(false)
    expect(jokerAction({ ...s, carPosition: { x: 1.345, y: .0275, z: .245 } })).toBeNull()
  })
  it('keeps the whole car in front of the real rear wall, including while boosting', () => {
    const room = deskModel()
    try {
      const obstacles = measureJokerObstacles(room.model)
      let s = { ...driver(), yaw: Math.PI }
      for (let i = 0; i < 240; i++) {
        s = stepJoker(s, new Set(['forward', 'boost']), 1 / 120, obstacles)
        expect(jokerCarBounds(s.position, s.yaw).min.z).toBeGreaterThan(-.422)
      }
      expect(s.falls).toBe(0)
      expect(run(s, 1, ['back'], obstacles).position.z).toBeGreaterThan(s.position.z + .10)
    } finally { room.dispose() }
  })
  it('drives across the room floor without resetting to the table or garage', () => {
    const s = run({ ...driver({ x: .1, y: 0, z: .6 }), onDesk: false }, 2, ['forward'])
    expect(s.position.y).toBeCloseTo(0)
    expect(s.position.z).toBeGreaterThan(1.2)
    expect(s.falls).toBe(0)
  })
  it('updates the physical car position continuously with the elevator', () => {
    const parked = { ...driver({ x: 1.34, y: .056, z: .23 }), onDesk: false, freePlay: false, lifted: false }
    const lifting = interactJoker(parked)
    const middle = run(lifting, 1.8, [])
    expect(middle.phase).toBe('lifting')
    expect(middle.position.y).toBeGreaterThan(.3)
    expect(middle.position.y).toBeLessThan(.946)
    expect(middle.carPosition).toEqual(middle.position)
  })
  it('opens the umbrella after a desk jump, lands on the floor, then jumps and reboards there', () => {
    const room = deskModel()
    try {
      const obstacles = measureJokerObstacles(room.model)
      let s = jumpJoker(driver({ x: .48, y: .754, z: .30 }))
      let opened = false
      for (let i = 0; i < 600; i++) {
        s = stepJoker(s, new Set(i < 160 ? ['forward', 'boost'] : ['brake']), 1 / 120, obstacles)
        if (s.gliding) { opened = true; expect(s.vertical).toBeGreaterThanOrEqual(-.301); expect(s.boosting).toBe(false) }
      }
      expect(opened).toBe(true)
      expect(s.onFloor && s.freePlay && s.grounded).toBe(true)
      expect(s.position.y).toBeCloseTo(obstacles.find(o => o.surface === 'floor')!.max.y)
      expect(s.gliding).toBe(false); expect(s.canopy).toBeLessThan(.01)
      expect(s.falls).toBe(0)
      s = run(jumpJoker(s), .15, ['forward'], obstacles)
      expect(s.position.y).toBeGreaterThan(.09)
      expect(s.gliding).toBe(false)
      s = run(s, 1, ['brake'], obstacles)
      expect(jokerAction(s, obstacles)).toBe('exit')
      s = interactJoker({ ...s, canopy: .8 }, obstacles)
      expect(s.canopy).toBe(0)
      expect(s.phase).toBe('walking'); expect(s.position.y).toBeCloseTo(obstacles.find(o => o.surface === 'floor')!.max.y)
      expect(jokerAction(s, obstacles)).toBe('enter')
      s = run(interactJoker(s, obstacles), 5, [], obstacles)
      expect(s.inCar && s.onFloor).toBe(true)
      expect(s.falls).toBe(0)
    } finally { room.dispose() }
  })
  it('can leave the first desk landing in reverse and reach the floor without recovery', () => {
    const room = deskModel()
    try {
      const obstacles = measureJokerObstacles(room.model)
      let s = { ...driver({ x: 1.345, y: .946, z: .245 }), onDesk: false, freePlay: false, yaw: -Math.PI / 2 }
      s = run(s, .75, ['forward', 'boost'], obstacles)
      s = run(jumpJoker(s), .6, ['forward', 'boost', 'right'], obstacles)
      s = run(s, .6, ['brake'], obstacles)
      s = run(s, 6, ['back'], obstacles)
      expect(s.onFloor).toBe(true)
      expect(s.falls).toBe(0)
    } finally { room.dispose() }
  })
  it('drives smoothly down the garage apron onto the floor', () => {
    let s = { ...driver({ x: 1.345, y: .056, z: .245 }), lifted: false, onDesk: false, freePlay: false }
    let lastY = s.position.y
    for (let i = 0; i < 240; i++) {
      s = stepJoker(s, new Set(['forward']), 1 / 120)
      expect(Math.abs(lastY - s.position.y)).toBeLessThan(.004)
      lastY = s.position.y
    }
    expect(s.position.z).toBeGreaterThan(.65)
    expect(s.position.y).toBe(0)
    expect(s.falls).toBe(0)
  })
  it('returns a missed first ramp jump to the raised lift, while keeping floor free play unlocked later', () => {
    const missed = { ...driver({ x: .95, y: .12, z: .5 }), onDesk: false, freePlay: false, grounded: false, vertical: -.5 }
    const recovered = run(missed, 1, [])
    expect(recovered.falls).toBe(1)
    expect(recovered.position).toEqual({ x: 1.345, y: .946, z: .245 })
    expect(recovered.onFloor || recovered.freePlay).toBe(false)
    const landed = run({ ...missed, freePlay: true }, 1, [])
    expect(landed.falls).toBe(0)
    expect(landed.onFloor && landed.freePlay).toBe(true)
  })
  it('uses the real rotated car sides for dismounting instead of empty bounding-box corners', () => {
    const s = { ...driver({ x: .55, y: .754, z: .128 }), yaw: -1.97 }
    const exit = interactJoker(s)
    const dx = exit.position.x - s.position.x, dz = exit.position.z - s.position.z
    expect(exit.inCar).toBe(false)
    expect(Math.abs(Math.cos(s.yaw) * dx - Math.sin(s.yaw) * dz)).toBeCloseTo(.095)
    expect(jokerAction(exit)).toBe('enter')
  })
})
