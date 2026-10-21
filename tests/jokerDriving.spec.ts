import { describe, expect, it } from 'vitest'
import { initialJokerState, interactJoker, jumpJoker, stepJoker } from '../utils/jokerAdventure'
import type { JokerInput, JokerObstacle, JokerState } from '../utils/jokerAdventure'
function run(s: JokerState, seconds: number, keys: JokerInput[] = [], obstacles: JokerObstacle[] = []) {
  for (let i = 0; i < seconds * 120; i++) s = stepJoker(s, new Set(keys), 1 / 120, obstacles)
  return s
}
function garage(): JokerState { return { ...initialJokerState(), phase: 'garage', garageOpen: true, position: { x: 1.345, y: .056, z: .03 } } }
describe('driving and dismount regressions', () => {
  const speaker = { min: { x: .642, y: .754, z: .175 }, max: { x: .792, y: .89, z: .335 } }
  it('can reverse away after steering alongside the speaker without recovery', () => {
    const start: JokerState = { ...initialJokerState(), phase: 'driving', inCar: true, garageOpen: true, lifted: true, onDesk: true, position: { x: .5999, y: .754, z: .245 }, speed: .1 }
    const contact = run(start, .2, ['forward', 'left'], [speaker])
    const reversed = run(contact, 1, ['back'], [speaker])
    expect(reversed.position.z).toBeLessThan(contact.position.z - .08)
    expect(reversed.falls).toBe(0)
  })
  it('lets a shallow existing contact separate instead of locking both axes', () => {
    const contact: JokerState = { ...initialJokerState(), phase: 'driving', inCar: true, garageOpen: true, lifted: true, onDesk: true, position: { x: .601, y: .754, z: .245 }, yaw: .08 }
    const reversed = run(contact, 1.2, ['back'], [speaker])
    expect(reversed.position.z).toBeLessThan(.12)
    expect(reversed.position.x).toBeLessThan(.595)
    expect(reversed.falls).toBe(0)
  })
  it('keeps a walking Joker outside the parked car body', () => {
    const s = run(garage(), .6, ['forward'])
    expect(s.position.z).toBeGreaterThanOrEqual(-.026)
  })
  it('finds a supported exit beside a car parked against the garage wall', () => {
    const s: JokerState = { ...garage(), inCar: true, phase: 'driving', position: { x: 1.24, y: .056, z: -.12 }, carPosition: { x: 1.24, y: .056, z: -.12 } }
    const exited = run(interactJoker(s), 1.5)
    expect(exited.inCar).toBe(false); expect(exited.falls).toBe(0)
  })
  it('releases boost without instantly halving car speed', () => {
    const s: JokerState = { ...garage(), phase: 'driving', inCar: true, lifted: true, onDesk: true, position: { x: -.5, y: .754, z: 0 }, speed: .78 }
    const next = stepJoker(s, new Set(['forward']), 1 / 120)
    expect(s.speed - next.speed).toBeLessThan(.03)
  })
  it('recovers on the desk after falling on foot, without abandoning a parked car', () => {
    const s: JokerState = { ...garage(), phase: 'walking', lifted: true, onDesk: true, position: { x: .9, y: -.11, z: .2 }, carPosition: { x: .3, y: .754, z: -.15 } }
    const recovered = stepJoker(s, new Set(), 1 / 120)
    expect(recovered.position.y).toBeCloseTo(.754)
    expect(recovered.onDesk).toBe(true)
  })
  it('clears the speaker with a ramp jump and can hit the phone during landing', () => {
    let s: JokerState = { ...garage(), phase: 'driving', inCar: true, lifted: true, position: { x: 1.345, y: .946, z: .245 }, yaw: -Math.PI / 2 }
    const speaker = { min: { x: .642, y: .754, z: .175 }, max: { x: .792, y: .89, z: .335 } }
    for (let i = 0; i < 90; i++) s = stepJoker(s, new Set(['forward', 'boost']), 1 / 120, [speaker])
    s = jumpJoker(s)
    for (let i = 0; i < 180; i++) s = stepJoker(s, new Set(['forward', 'boost']), 1 / 120, [speaker])
    expect(s.phase).toBe('crashing')
  })

  it('brakes promptly and steers progressively rather than snapping', () => {
    const s: JokerState = { ...garage(), phase: 'driving', inCar: true, lifted: true, onDesk: true, position: { x: -.4, y: .754, z: -.2 }, speed: .4 }
    const turning = stepJoker(s, new Set(['forward', 'left']), 1 / 120)
    expect(turning.steering).toBeGreaterThan(0); expect(turning.steering).toBeLessThan(.2)
    const stopped = run(s, .2, ['brake'])
    expect(stopped.speed).toBe(0)
    const reverse = run(stopped, .2, ['back'])
    expect(reverse.speed).toBeLessThan(0)
  })
  it('allows a brief late jump and buffers a press just before landing', () => {
    const airborne: JokerState = { ...garage(), phase: 'walking', position: { x: .1, y: .76, z: .1 }, grounded: false, coyote: .06, vertical: -.1 }
    expect(jumpJoker(airborne).vertical).toBeGreaterThan(0)
    let landing = jumpJoker({ ...airborne, coyote: 0 })
    expect(landing.jumpBuffer).toBeGreaterThan(0)
    landing = run(landing, .06)
    expect(landing.vertical).toBeGreaterThan(0); expect(landing.grounded).toBe(false)
  })

})
