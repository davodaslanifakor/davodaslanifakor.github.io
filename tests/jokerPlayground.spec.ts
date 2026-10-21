import { describe, expect, it } from 'vitest'
import { continueJoker, initialJokerState, interactJoker, jokerAction, jokerCarBounds, jumpJoker, recoverJoker, stepJoker } from '../utils/jokerAdventure'
import type { JokerInput, JokerState } from '../utils/jokerAdventure'
import { jokerCrashRest } from '../utils/jokerDesk'
import { measureJokerObstacles } from '../utils/jokerAdventureScene'
import { deskModel } from './helpers/deskModel'

function run(s: JokerState, seconds: number, held: JokerInput[] = [], obstacles = [] as ReturnType<typeof measureJokerObstacles>) {
  for (let i = 0; i < seconds * 120; i++) s = stepJoker(s, new Set(held), 1 / 120, obstacles)
  return s
}
function landedJoker(obstacles: ReturnType<typeof measureJokerObstacles> = []): JokerState {
  return run({ ...initialJokerState(), phase: 'driving', inCar: true, lifted: true, garageOpen: true, grounded: false, position: { x: .48, y: .78, z: .30 }, yaw: -Math.PI / 2 }, .2, [], obstacles)
}
describe('Joker desk exploration after the jump', () => {
  it('keeps exploration locked through the lift and unlocks on landing without phone damage', () => {
    let s: JokerState = { ...initialJokerState(), phase: 'driving', inCar: true, garageOpen: true, lifted: true, position: { x: 1.345, y: .946, z: .245 }, yaw: -Math.PI / 2 }
    s = run(s, .75, ['forward', 'boost'])
    expect(s.freePlay).toBe(false)
    s = run(jumpJoker(s), .25, ['forward', 'boost'])
    expect(s.freePlay).toBe(false)
    // Release the throttle above the desk; land short of the optional phone stunt.
    s = run(s, .8)
    expect(s.freePlay && s.onDesk && s.grounded).toBe(true)
    expect(s.phase).toBe('driving'); expect(s.damage).toBe(false)
    expect(s.falls).toBe(0)
    expect(jokerAction(s)).toBe('exit')
    const reset = initialJokerState()
    expect(reset.freePlay || reset.inCar || reset.garageOpen).toBe(false)
  })
  it('steers off the ramp into free play beside the real speaker and phone', () => {
    const room = deskModel()
    try {
      const obstacles = measureJokerObstacles(room.model)
      let s: JokerState = { ...initialJokerState(), phase: 'driving', inCar: true, garageOpen: true, lifted: true, position: { x: 1.345, y: .946, z: .245 }, yaw: -Math.PI / 2 }
      s = run(s, .75, ['forward', 'boost'], obstacles)
      s = run(jumpJoker(s), .6, ['forward', 'boost', 'right'], obstacles)
      s = run(s, .6, ['brake'], obstacles)
      expect(s.phase).toBe('driving')
      expect(s.freePlay && s.grounded && s.onDesk).toBe(true)
      expect(s.damage).toBe(false)
      expect(s.falls).toBe(0)
      expect(jokerAction(s, obstacles)).toBe('exit')
    } finally { room.dispose() }
  })
  it('unlocks on a clear landing on the shipped desk with a supported dismount', () => {
    const room = deskModel()
    try {
      const obstacles = measureJokerObstacles(room.model), s = landedJoker(obstacles)
      expect(s.onDesk && s.freePlay && s.inCar && s.garageOpen).toBe(true)
      expect(s.phase).toBe('driving')
      const body = jokerCarBounds(s.position, s.yaw)
      expect(obstacles.some(o => body.min.x < o.max.x && body.max.x > o.min.x && body.min.z < o.max.z && body.max.z > o.min.z && body.min.y < o.max.y - .004 && body.max.y > o.min.y)).toBe(false)
      expect(jokerAction(s, obstacles)).toBe('exit')
      const onFoot = run(interactJoker(s, obstacles), .2, [], obstacles)
      expect(onFoot.inCar).toBe(false); expect(onFoot.falls).toBe(0)
      expect(jokerAction(onFoot, obstacles)).toBe('enter')
    } finally { room.dispose() }
  })
  it('allows running and jumping onto low objects without moving the parked car', () => {
    const s = { ...landedJoker(), inCar: false, phase: 'walking' as const, position: { x: -.50, y: .754, z: 0 } }
    const walking = run(s, .2, ['right']), running = run(s, .2, ['right', 'boost'])
    expect(running.position.x - s.position.x).toBeGreaterThan((walking.position.x - s.position.x) * 1.5)
    expect(running.carPosition).toEqual(s.carPosition)
    const shelf = [{ min: { x: -.42, y: .754, z: -.1 }, max: { x: -.15, y: .83, z: .1 } }]
    let hop = run(jumpJoker(s), .6, ['right'], shelf)
    hop = run(hop, .2, [], shelf)
    expect(hop.grounded).toBe(true); expect(hop.position.y).toBeCloseTo(.83)
  })
  it('can cross the actual tabletop, jumping onto and driving off the laptop deck', () => {
    const room = deskModel()
    try {
      const obstacles = measureJokerObstacles(room.model)
      let s = run(landedJoker(obstacles), 1.05, ['forward'], obstacles)
      s = run(jumpJoker(s), .65, ['forward'], obstacles)
      expect(s.grounded).toBe(true)
      expect(s.position.y).toBeGreaterThan(.78)
      s = run(s, 1.6, ['forward'], obstacles)
      expect(s.position.x).toBeLessThan(-.7)
      expect(s.position.y).toBeCloseTo(.754)
      expect(s.falls).toBe(0)
    } finally { room.dispose() }
  })
  it('bumps the underside of a display rather than jumping through it', () => {
    const s = { ...landedJoker(), inCar: false, phase: 'walking' as const, position: { x: -.50, y: .754, z: 0 } }
    const screen = [{ min: { x: -.7, y: .85, z: -.1 }, max: { x: -.3, y: 1.1, z: .1 } }]
    let hop = jumpJoker(s), highest = hop.position.y
    for (let i = 0; i < 120; i++) { hop = stepJoker(hop, new Set(), 1 / 120, screen); highest = Math.max(highest, hop.position.y) }
    expect(highest + .067).toBeLessThanOrEqual(.85001)
    expect(hop.grounded).toBe(true)
  })
  it('dismounts and reboards when the car is supported on an object', () => {
    const obstacles = [{ min: { x: -.6, y: .754, z: -.25 }, max: { x: 0, y: .82, z: .2 } }]
    const s = { ...landedJoker(), position: { x: -.3, y: .82, z: 0 }, carPosition: { x: -.3, y: .82, z: 0 } }
    expect(jokerAction(s, obstacles)).toBe('exit')
    const exit = interactJoker(s, obstacles)
    expect(exit.position.y).toBe(.82)
    expect(run(interactJoker(exit, obstacles), 5, [], obstacles).inCar).toBe(true)
  })
  it('returns a fallen Joker near his parked car, and preserves damage', () => {
    const s = { ...landedJoker(), inCar: false, phase: 'walking' as const, damage: true, carPosition: { x: -.6, y: .754, z: .1 }, position: { x: 1, y: -.12, z: .5 } }
    const recovered = recoverJoker(s)
    expect(recovered.carPosition).toEqual(s.carPosition)
    expect(Math.hypot(recovered.position.x - s.carPosition.x, recovered.position.z - s.carPosition.z)).toBeLessThan(.14)
    expect(recovered.damage).toBe(true); expect(recovered.freePlay).toBe(true)
    expect(jokerAction(recovered)).toBe('enter')
  })
  it('lets the adventure ending continue from the actual impact position', () => {
    const origin = { x: .5, y: .83, z: .19 }
    const finished: JokerState = { ...initialJokerState(), phase: 'finished', damage: true, lifted: true, garageOpen: true, inCar: true, crashOrigin: origin, crashYaw: -Math.PI / 2 }
    const continued = continueJoker(finished)
    expect(continued.position).toEqual(jokerCrashRest(origin, finished.crashYaw))
    expect(continued.carPosition).toEqual(continued.position)
    expect(continued.freePlay && continued.onDesk && continued.damage).toBe(true)
    const reversed = run(continued, .5, ['back'])
    expect(reversed.position.x).toBeGreaterThan(continued.position.x)
    expect(reversed.phase).toBe('driving')
  })
  it('returns control automatically after a playground crash and never triggers it twice', () => {
    const s = { ...landedJoker(), position: { x: .7, y: .754, z: .185 } }
    const impact = run(s, 1, ['forward'])
    expect(impact.phase).toBe('crashing')
    const playing = run(impact, 8)
    expect(playing.phase).toBe('driving'); expect(playing.damage).toBe(true)
    expect(run(playing, .4, ['forward']).phase).toBe('driving')
  })
})
