import { describe, expect, it } from 'vitest'
import { initialJokerState, interactJoker, JOKER_GRAPPLE, JOKER_LATCH, JOKER_LIFT, jokerAction, jumpJoker, stepJoker } from '../utils/jokerAdventure'
import type { JokerInput, JokerState } from '../utils/jokerAdventure'
function run(state: JokerState, seconds: number, input: JokerInput[] = []) {
  for (let i = 0; i < seconds * 120; i++) state = stepJoker(state, new Set(input), 1 / 120)
  return state
}
function driver(): JokerState { return { ...initialJokerState(), phase: 'driving', inCar: true, garageOpen: true, lifted: true, onDesk: true, position: { x: .70, y: .754, z: .185 }, yaw: -Math.PI / 2 } }
describe('Joker adventure', () => {
  it('requires proximity before using the grapple and the book latch', () => {
    let s = run(initialJokerState(), 3)
    expect(s.phase).toBe('walking'); expect(jokerAction(s)).toBeNull()
    s.position = { ...JOKER_GRAPPLE }
    expect(jokerAction(s)).toBe('grapple')
    s = run(interactJoker(s), 4)
    expect(s.phase).toBe('garage'); expect(jokerAction(s)).toBe('open')
    s = run(interactJoker(s), 3)
    expect(s.garageOpen).toBe(true)
    s = run(s, 2)
    expect(s.falls).toBe(0)
    expect(s.position.y).toBeCloseTo(.056)
  })
  it('moves with throttle, stops without input and pauses exactly', () => {
    const s = driver(); s.position.z = -.1
    const moving = run(s, .3, ['forward'])
    expect(moving.position.x).toBeLessThan(s.position.x)
    const stopped = run(moving, 1)
    expect(stopped.speed).toBeLessThan(.001)
    const paused = { ...moving, paused: true }
    expect(run(paused, 1, ['forward'])).toBe(paused)
  })
  it('requires a real, fast bumper collision for damage', () => {
    expect(run(driver(), 10).damage).toBe(false)
    const collision = run(driver(), 1, ['forward'])
    expect(collision.phase).toBe('crashing')
    expect(collision.crashOrigin).not.toBeNull()
    const finished = run(collision, 8)
    expect(finished.phase).toBe('driving'); expect(finished.damage).toBe(true)
    expect(finished.freePlay).toBe(true)
    expect(initialJokerState().damage).toBe(false)
  })
  it('bounces off the phone at low speed without shattering it', () => {
    const s = driver(); s.position.x = .545; s.speed = .06
    const bumped = run(s, .2)
    expect(bumped.damage).toBe(false); expect(bumped.phase).toBe('driving')
    expect(bumped.carPosition).toEqual(bumped.position)
  })
  it('jumps and begins a safe descent after driving off the table', () => {
    const s = driver(); s.position.z = -.2
    const airborne = run(jumpJoker(s), .1)
    expect(airborne.position.y).toBeGreaterThan(.754); expect(airborne.grounded).toBe(false)
    expect(run(airborne, 1).grounded).toBe(true)
    s.position.x = -1.18
    const recovered = run(s, 1.5, ['forward', 'boost'])
    expect(recovered.falls).toBe(0); expect(recovered.damage).toBe(false)
    expect(recovered.gliding).toBe(true)
  })
  it('gates the lift by position and stopped speed', () => {
    const s = { ...driver(), lifted: false, onDesk: false, position: { ...JOKER_LIFT } }
    expect(jokerAction(s)).toBe('lift')
    expect(jokerAction({ ...s, speed: .1 })).toBeNull()
    const lifted = run(interactJoker(s), 6)
    expect(lifted.lifted).toBe(true); expect(lifted.yaw).toBeCloseTo(-Math.PI / 2)
  })
  it('can traverse the garage approach and drive from ramp to desk', () => {
    let walker = { ...initialJokerState(), phase: 'garage' as const, garageOpen: true, position: { ...JOKER_LATCH } } as JokerState
    walker = run(walker, .70, ['right']); walker = run(walker, .95, ['forward'])
    expect(walker.falls).toBe(0); expect(jokerAction(walker)).toBe('enter')
    let car = { ...driver(), onDesk: false, position: { x: 1.345, y: .946, z: .245 } }
    car = run(car, 1.3, ['forward', 'boost'])
    expect(car.onDesk).toBe(true); expect(car.falls).toBe(0)
  })
})
