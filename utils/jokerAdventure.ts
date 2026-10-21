import { JOKER_ENTRY_SECONDS, JOKER_LATCH_EXIT, JOKER_PULL_SECONDS, JOKER_LIFT_SECONDS, jokerLiftPose } from './jokerInteractionPose'
import { JOKER_DESK, jokerCrashRest, jokerDeskParking } from './jokerDesk'
import { JOKER_CAR_SIZE, JOKER_FLOOR, JOKER_FLOOR_RAMP, JOKER_ROOM_BOUNDARIES, jokerFloorParking, jokerFloorRampHeight } from './jokerRoom'

/** Arcade movement in the room's Y-up coordinates. No DOM, timers or renderer. */
export interface JokerPoint { x: number; y: number; z: number }
export interface JokerObstacle { min: JokerPoint; max: JokerPoint; surface?: 'floor' }
export type JokerAdventurePhase = 'intro' | 'walking' | 'grappling' | 'garage' | 'opening' | 'entering' | 'driving' | 'lifting' | 'lowering' | 'crashing' | 'finished'
export type JokerInput = 'forward' | 'back' | 'left' | 'right' | 'boost' | 'brake'
export type JokerAction = 'grapple' | 'open' | 'enter' | 'lift' | 'recall' | 'exit' | null
export interface JokerState {
  phase: JokerAdventurePhase
  time: number
  position: JokerPoint
  yaw: number
  speed: number
  vertical: number
  grounded: boolean
  garageOpen: boolean
  lifted: boolean
  onDesk: boolean
  inCar: boolean
  carPosition: JokerPoint
  carYaw: number
  paused: boolean
  cockpit: boolean
  travelled: number
  falls: number
  damage: boolean
  crashOrigin: JokerPoint | null
  crashYaw: number
  steering: number
  blocked: boolean
  wheelTravel: number
  transitionFrom: JokerPoint | null
  transitionYaw: number
  coyote: number
  jumpBuffer: number
  freePlay: boolean
  onFloor: boolean
  boosting: boolean
  gliding: boolean
  canopy: number
}
export const JOKER_SPAWN: JokerPoint = { x: .37, y: .754, z: .11 }
export const JOKER_GRAPPLE: JokerPoint = { x: .825, y: .754, z: .115 }
export const JOKER_LATCH: JokerPoint = { x: 1.19, y: .060, z: .125 }
export const JOKER_CAR: JokerPoint = { x: 1.345, y: .056, z: -.12 }
export const JOKER_LIFT: JokerPoint = { x: 1.345, y: .056, z: .245 }
export const JOKER_LIFT_CALL: JokerPoint = { x: 1.345, y: .012, z: .52 }
export const JOKER_PHONE: JokerObstacle = { min: { x: .352, y: .754, z: .133 }, max: { x: .459, y: .895, z: .237 } }
export const JOKER_TRANSITIONS = { intro: [1, 59], grappling: [107, 198], opening: [200, 248], entering: [279, 340], lifting: [390, 526], lowering: [526, 390], crashing: [654, 816] } as const
export const jokerDistance = (a: JokerPoint, b: JokerPoint) => Math.hypot(a.x - b.x, a.z - b.z)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const jokerTransition = (phase: JokerAdventurePhase) => JOKER_TRANSITIONS[phase as keyof typeof JOKER_TRANSITIONS]
export function jokerTransitionDuration(phase: JokerAdventurePhase) {
  const frames = jokerTransition(phase)
  return phase === 'opening' ? JOKER_PULL_SECONDS : phase === 'entering' ? JOKER_ENTRY_SECONDS : phase === 'lifting' || phase === 'lowering' ? JOKER_LIFT_SECONDS : frames ? (frames[1] - frames[0]) / 24 : 0
}
export function initialJokerState(): JokerState {
  return { phase: 'intro', time: 0, position: { ...JOKER_SPAWN }, yaw: 0, speed: 0, vertical: 0, grounded: true, garageOpen: false, lifted: false, onDesk: false, inCar: false, carPosition: { ...JOKER_CAR }, carYaw: 0, paused: false, cockpit: false, travelled: 0, falls: 0, damage: false, crashOrigin: null, crashYaw: 0, steering: 0, blocked: false, wheelTravel: 0, transitionFrom: null, transitionYaw: 0, coyote: .10, jumpBuffer: 0, freePlay: false, onFloor: false, boosting: false, gliding: false, canopy: 0 }
}
export function continueJoker(s: JokerState): JokerState {
  if (s.phase !== 'finished') return s
  const position = jokerCrashRest(s.crashOrigin ?? s.position, s.crashYaw)
  return { ...s, phase: 'driving', freePlay: true, paused: false, time: 0, inCar: true, onDesk: true, position, carPosition: { ...position }, yaw: s.crashYaw, carYaw: s.crashYaw, speed: 0, vertical: 0, steering: 0, blocked: false, cockpit: false, grounded: true, transitionFrom: null }
}
export function jokerFrame(s: JokerState): number {
  if (s.phase === 'lowering') return 340
  const transition = jokerTransition(s.phase)
  if (transition) return Math.min(transition[1] - .01, transition[0] + s.time / jokerTransitionDuration(s.phase) * (transition[1] - transition[0]))
  if (s.phase === 'finished') return 815
  if (s.inCar) return s.lifted ? 526 : 340
  if (s.phase === 'garage') return s.garageOpen ? 248 : 198
  return s.lifted ? 526 : 59
}
export function jokerAction(s: JokerState, obstacles: readonly JokerObstacle[] = []): JokerAction {
  if (s.paused || !s.grounded || jokerTransition(s.phase) || s.phase === 'finished') return null
  // Stand clear of the carriage while recalling it; works on foot and in the car.
  const parkedUnderLift = !s.inCar && Math.abs(s.carPosition.x - JOKER_LIFT.x) < .20 && Math.abs(s.carPosition.z - JOKER_LIFT.z) < .20 && s.carPosition.y < .15
  if (s.freePlay && s.lifted && s.onFloor && !parkedUnderLift && s.position.z > .46 && jokerDistance(s.position, JOKER_LIFT_CALL) < .16 && Math.abs(s.speed) < .06) return 'recall'
  if (!s.inCar) {
    if (s.phase === 'walking' && !s.garageOpen && jokerDistance(s.position, JOKER_GRAPPLE) < .105) return 'grapple'
    if (s.phase === 'garage' && !s.garageOpen && jokerDistance(s.position, JOKER_LATCH) < .075) return 'open'
    if (s.garageOpen && jokerDistance(s.position, s.carPosition) < .135 && Math.abs(s.position.y - s.carPosition.y) < .09) return 'enter'
  } else {
    if (!s.lifted && Math.abs(s.position.y - JOKER_LIFT.y) < .025 && jokerDistance(s.position, JOKER_LIFT) < .070 && Math.abs(s.speed) < .06) return 'lift'
    if (Math.abs(s.speed) < .015 && (s.freePlay || s.onDesk || !s.lifted) && jokerExitPoint(s, obstacles)) return 'exit'
  }
  return null
}
export function jokerHintTarget(s: JokerState, action = jokerAction(s)): JokerPoint | null {
  if (action === 'grapple') return { ...JOKER_GRAPPLE, y: .82 }
  if (action === 'open') return { ...JOKER_LATCH, y: .14 }
  if (action === 'enter') return { ...s.carPosition, y: s.carPosition.y + .10 }
  if (action === 'recall') return { ...JOKER_LIFT_CALL, y: .12 }
  if (action === 'lift' || action === 'exit') return { ...s.position, y: s.position.y + .13 }
  return null
}
export function interactJoker(s: JokerState, obstacles: readonly JokerObstacle[] = []): JokerState {
  const action = jokerAction(s, obstacles)
  if (!action) return s
  const next = { ...s, time: 0, speed: 0, vertical: 0, steering: 0, blocked: false, boosting: false, gliding: false, canopy: 0, transitionFrom: { ...s.position }, transitionYaw: s.yaw }
  if (action === 'grapple') next.phase = 'grappling'
  if (action === 'open') next.phase = 'opening'
  if (action === 'enter') {
    next.phase = 'entering'; next.cockpit = false
  }
  if (action === 'lift') next.phase = 'lifting'
  if (action === 'recall') { next.phase = 'lowering'; next.cockpit = false }
  if (action === 'exit') {
    next.inCar = false; next.cockpit = false; next.phase = s.onDesk || s.freePlay ? 'walking' : 'garage'
    next.carPosition = { ...s.position }; next.carYaw = s.yaw
    next.position = jokerExitPoint(s, obstacles)!; next.grounded = true
  }
  return next
}
export function jumpJoker(s: JokerState): JokerState {
  if (s.paused || jokerTransition(s.phase) || s.phase === 'finished') return s
  if (!s.grounded && s.coyote <= 0) return { ...s, jumpBuffer: .12 }
  return { ...s, grounded: false, vertical: s.inCar ? 1.12 : s.onDesk ? 1.08 : .86, coyote: 0, jumpBuffer: 0 }
}
interface Surface { x0: number; x1: number; z0: number; z1: number; y: number }
export function jokerSurfaces(s: JokerState): Surface[] {
  return [
    JOKER_DESK,
    JOKER_FLOOR,
    { ...JOKER_FLOOR_RAMP, y: jokerFloorRampHeight(s.position.z, s.lifted) },
    { x0: 1.202, x1: 1.487, z0: -.29, z1: .05, y: .056 },
    { x0: 1.14, x1: 1.30, z0: .10, z1: .23, y: .056 },
    { x0: 1.26, x1: 1.43, z0: .04, z1: .144, y: .056 },
    { x0: 1.23, x1: 1.46, z0: .13, z1: .36, y: s.lifted ? .946 : .056 },
    ...(s.lifted ? [{ x0: 1.205, x1: 1.485, z0: .07, z1: .36, y: .0275 }] : []),
    ...(s.lifted ? [{ x0: .975, x1: 1.235, z0: .18, z1: .31, y: .951 }] : []),
  ]
}
export function jokerGarageWalls(open: boolean): JokerObstacle[] {
  return [
    { min: { x: 1.19, y: .06, z: -.30 }, max: { x: 1.203, y: .33, z: .05 } },
    { min: { x: 1.487, y: .06, z: -.30 }, max: { x: 1.50, y: .33, z: .05 } },
    { min: { x: 1.20, y: .06, z: -.31 }, max: { x: 1.49, y: .33, z: -.29 } },
    { min: { x: 1.199, y: .3275, z: -.30 }, max: { x: 1.491, y: .3365, z: .05 } },
    ...(!open ? [{ min: { x: 1.20, y: .06, z: .087 }, max: { x: 1.49, y: .33, z: .100 } }] : []),
  ]
}
export function jokerCarBounds(position: JokerPoint, yaw: number): JokerObstacle {
  const x = Math.abs(Math.cos(yaw)) * JOKER_CAR_SIZE.halfWidth + Math.abs(Math.sin(yaw)) * JOKER_CAR_SIZE.halfLength
  const z = Math.abs(Math.sin(yaw)) * JOKER_CAR_SIZE.halfWidth + Math.abs(Math.cos(yaw)) * JOKER_CAR_SIZE.halfLength
  return { min: { x: position.x - x, y: position.y, z: position.z - z }, max: { x: position.x + x, y: position.y + .095, z: position.z + z } }
}
function footCarContact(p: JokerPoint, car: JokerPoint, yaw: number, radius = .014, height = .067) {
  const dx = p.x - car.x, dz = p.z - car.z, c = Math.cos(yaw), s = Math.sin(yaw)
  return Math.abs(c * dx - s * dz) < JOKER_CAR_SIZE.halfWidth + radius && Math.abs(s * dx + c * dz) < JOKER_CAR_SIZE.halfLength + radius && p.y < car.y + .091 && p.y + height > car.y + .006
}
export function jokerRampReady(s: JokerState) {
  return s.inCar && s.lifted && !s.onDesk && !s.onFloor && s.grounded && s.phase === 'driving' && s.position.x < 1.125 && s.position.x > .985 && s.position.y > .9 && s.speed > .25
}
export function jokerExitPoint(s: JokerState, obstacles: readonly JokerObstacle[] = []): JokerPoint | null {
  const blockers = [...obstacles, ...JOKER_ROOM_BOUNDARIES, ...jokerGarageWalls(s.garageOpen), ...(!s.damage ? [JOKER_PHONE] : [])]
  for (const [side, forward] of [[-.095, 0], [.095, 0], [0, .13], [0, -.13]]) {
    const p = { x: s.position.x + Math.cos(s.yaw) * side! + Math.sin(s.yaw) * forward!, y: s.position.y, z: s.position.z - Math.sin(s.yaw) * side! + Math.cos(s.yaw) * forward! }
    const supports = [...jokerSurfaces(s), ...obstacles.map(o => ({ x0: o.min.x, x1: o.max.x, z0: o.min.z, z1: o.max.z, y: o.max.y }))]
    const surface = supports.filter(f => Math.abs(f.y - p.y) < .03 && p.x > f.x0 + .016 && p.x < f.x1 - .016 && p.z > f.z0 + .016 && p.z < f.z1 - .016).sort((a, b) => b.y - a.y)[0]
    if (surface && !footCarContact(p, s.position, s.yaw, .014, .055) && !blockers.some(o => overlaps(p, .014, o, .055))) return { ...p, y: surface.y }
  }
  return null
}
export function recoverJoker(s: JokerState, obstacles: readonly JokerObstacle[] = []): JokerState {
  const onDesk = s.onDesk
  const parking = s.onFloor ? jokerFloorParking(obstacles) : jokerDeskParking([...obstacles, ...(!s.damage ? [JOKER_PHONE] : [])])
  const besideCar = !s.inCar && (onDesk || s.onFloor) ? jokerExitPoint({ ...s, position: s.carPosition, yaw: s.carYaw }, obstacles) : null
  const p = onDesk || s.onFloor ? besideCar ?? parking : s.inCar ? s.lifted ? { x: 1.345, y: .946, z: .245 } : { ...JOKER_CAR } : s.garageOpen || s.phase === 'garage' ? { ...JOKER_LATCH } : { ...JOKER_SPAWN }
  const yaw = s.inCar && s.lifted ? -Math.PI / 2 : 0
  return { ...s, position: p, carPosition: s.inCar ? { ...p } : s.carPosition, carYaw: s.inCar ? yaw : s.carYaw, yaw, speed: 0, steering: 0, blocked: false, boosting: false, gliding: false, canopy: 0, vertical: 0, grounded: true, coyote: .10, jumpBuffer: 0, onDesk, falls: s.falls + 1 }
}
export function jokerObjective(s: JokerState): { id: 'grapple' | 'latch' | 'car' | 'lift' | 'recall' | 'ramp' | 'phone' | 'complete' | 'explore' | 'floor' | 'parkedCar'; point: JokerPoint; step: number } {
  if (s.freePlay && s.onFloor && jokerDistance(s.position, JOKER_LIFT_CALL) < .65) return { id: s.lifted ? 'recall' : 'lift', point: s.lifted ? JOKER_LIFT_CALL : JOKER_LIFT, step: 3 }
  if (s.freePlay && s.inCar && s.lifted && !s.onDesk && !s.onFloor && s.grounded) return { id: 'ramp', point: { x: 1.025, y: .951, z: .245 }, step: 3 }
  if (s.freePlay && s.phase !== 'crashing') return { id: s.inCar ? s.onFloor ? 'floor' : 'explore' : 'parkedCar', point: s.inCar ? s.position : s.carPosition, step: 4 }
  if (s.damage || s.phase === 'crashing') return { id: 'complete', point: { x: .30, y: .77, z: .11 }, step: 4 }
  if (!s.garageOpen) return s.phase === 'walking' || s.phase === 'intro' || s.phase === 'grappling'
    ? { id: 'grapple', point: JOKER_GRAPPLE, step: 1 } : { id: 'latch', point: JOKER_LATCH, step: 2 }
  if (!s.inCar && s.phase !== 'entering') return { id: 'car', point: s.carPosition, step: 2 }
  if (!s.lifted) return { id: 'lift', point: JOKER_LIFT, step: 3 }
  if (!s.onDesk) return { id: 'ramp', point: { x: 1.025, y: .951, z: .245 }, step: 3 }
  return { id: 'explore', point: s.position, step: 4 }
}
function overlaps(p: JokerPoint, radius: number, obstacle: JokerObstacle, height: number) {
  return p.x + radius > obstacle.min.x && p.x - radius < obstacle.max.x && p.z + radius > obstacle.min.z && p.z - radius < obstacle.max.z && p.y < obstacle.max.y - .004 && p.y + height > obstacle.min.y + .006
}
/** Oriented car footprint: empty corners of its bounding box must not catch props. */
function carPenetration(p: JokerPoint, yaw: number, o: JokerObstacle) {
  if (p.y >= o.max.y - .004 || p.y + .095 <= o.min.y + .006) return 0
  const c = Math.cos(yaw), s = Math.sin(yaw)
  const x = p.x - (o.min.x + o.max.x) / 2, z = p.z - (o.min.z + o.max.z) / 2
  const hx = (o.max.x - o.min.x) / 2, hz = (o.max.z - o.min.z) / 2
  let depth = Infinity
  for (const [ax, az] of [[1, 0], [0, 1], [c, -s], [s, c]] as [number, number][]) {
    const overlap = JOKER_CAR_SIZE.halfWidth * Math.abs(c * ax - s * az) + JOKER_CAR_SIZE.halfLength * Math.abs(s * ax + c * az) + hx * Math.abs(ax) + hz * Math.abs(az) - Math.abs(x * ax + z * az)
    if (overlap <= 0) return 0
    depth = Math.min(depth, overlap)
  }
  return depth
}
/** Caller supplies a bounded fixed timestep so jumps/collision do not depend on monitor refresh rate. */
export function stepJoker(s: JokerState, held: ReadonlySet<JokerInput>, dt: number, obstacles: readonly JokerObstacle[] = [], reduced = false): JokerState {
  if (s.paused || s.phase === 'finished') return s
  dt = clamp(dt, 0, 1 / 30)
  let n: JokerState = { ...s, position: { ...s.position }, time: s.time + dt, blocked: false, boosting: false, coyote: s.grounded ? .10 : Math.max(0, s.coyote - dt), jumpBuffer: Math.max(0, s.jumpBuffer - dt) }
  const transition = jokerTransition(s.phase)
  if (transition) {
    // Motion preference shortens decorative travel; controls/physics stay available.
    if (reduced) n.time += dt * 5
    if (s.phase === 'lifting') {
      const pose = jokerLiftPose(n)
      n.position = { x: pose.position.x, y: pose.position.y, z: pose.position.z }; n.yaw = pose.yaw
      n.carPosition = { ...n.position }; n.carYaw = n.yaw
    }
    if (s.phase === 'crashing' && n.time >= (692 - 654) / 24) n.damage = true
    if (n.time >= jokerTransitionDuration(s.phase)) {
      n.time = 0
      if (s.phase === 'intro') { n.phase = 'walking'; n.position = { ...JOKER_SPAWN } }
      if (s.phase === 'grappling') { n.phase = 'garage'; n.position = { x: 1.165, y: .060, z: .17 } }
      if (s.phase === 'opening') { n.phase = 'garage'; n.garageOpen = true; n.position = { ...JOKER_LATCH_EXIT }; n.yaw = Math.PI }
      if (s.phase === 'entering') { n.phase = 'driving'; n.inCar = true; n.position = { ...s.carPosition }; n.yaw = s.carYaw; n.cockpit = false }
      if (s.phase === 'lifting') { n.phase = 'driving'; n.lifted = true; n.onFloor = false; n.position = { x: 1.345, y: .946, z: .245 }; n.yaw = -Math.PI / 2 }
      if (s.phase === 'lowering') { n.phase = s.inCar ? 'driving' : 'walking'; n.lifted = false }
      if (s.phase === 'crashing') { n.phase = 'finished'; n.damage = true; n = continueJoker(n) }
      n.grounded = true
      n.transitionFrom = null
      if (n.inCar) { n.carPosition = { ...n.position }; n.carYaw = n.yaw }
    }
    return n
  }
  let dx: number, dz: number
  if (s.inCar) {
    n.boosting = held.has('boost') && !held.has('brake') && !s.gliding
    const throttle = Number(held.has('forward')) - Number(held.has('back'))
    const braking = held.has('brake') || (throttle !== 0 && throttle * s.speed < -.02)
    const targetSpeed = held.has('brake') ? 0 : throttle > 0 ? s.gliding ? .38 : held.has('boost') ? .78 : .40 : throttle < 0 ? -.19 : 0
    const acceleration = braking ? 2.4 : throttle ? .80 : 1.05
    n.speed = s.speed + clamp(targetSpeed - s.speed, -acceleration * dt, acceleration * dt)
    const steering = Number(held.has('left')) - Number(held.has('right'))
    n.steering = s.steering + (steering - s.steering) * (1 - Math.exp(-dt * 12))
    n.yaw = s.yaw + n.steering * dt * 2.2 * clamp(n.speed / .12, -1, 1) * (s.grounded ? 1 : s.gliding ? .80 : .30)
    dx = Math.sin(n.yaw) * n.speed * dt; dz = Math.cos(n.yaw) * n.speed * dt
  } else {
    dx = Number(held.has('right')) - Number(held.has('left'))
    dz = Number(held.has('back')) - Number(held.has('forward'))
    const length = Math.hypot(dx, dz)
    const pace = held.has('boost') ? .36 : .22
    if (length) { dx = dx / length * pace * dt; dz = dz / length * pace * dt; n.yaw = Math.atan2(dx, dz) }
    n.speed = length ? pace : 0
  }
  const previousY = s.position.y
  n.vertical -= 3.4 * dt
  const clearOfDesk = n.position.x < JOKER_DESK.x0 - .025 || n.position.x > JOKER_DESK.x1 + .025 || n.position.z > JOKER_DESK.z1 + .025
  if (s.freePlay && s.inCar && !s.onFloor && clearOfDesk && n.vertical < -.05 && n.position.y > .12 && n.position.y < .88) n.gliding = true
  if (n.gliding) { n.vertical = Math.max(-.30, n.vertical); n.boosting = false }
  n.position.y += n.vertical * dt
  n.grounded = false
  const radius = s.inCar ? .037 : .014, height = s.inCar ? .095 : .067
  const blockers = [...obstacles, ...JOKER_ROOM_BOUNDARIES, ...jokerGarageWalls(s.garageOpen)]
  if (!s.inCar && !s.damage) blockers.push(JOKER_PHONE)
  const sideBlockers = blockers.filter(o => o.surface !== 'floor' && !(previousY >= o.max.y - .003 && n.vertical <= 0))
  // Turning must not leave the body embedded in a prop before translation begins.
  // Existing shallow contacts may separate, including after a landing or recovery.
  if (s.inCar) {
    if (sideBlockers.some(o => carPenetration(n.position, n.yaw, o) > carPenetration(n.position, s.yaw, o) + 1e-9)) n.yaw = s.yaw
    dx = Math.sin(n.yaw) * n.speed * dt; dz = Math.cos(n.yaw) * n.speed * dt
  }
  for (const axis of ['x', 'z'] as const) {
    const old = { ...n.position }
    n.position[axis] += axis === 'x' ? dx : dz
    const collision = (o: JokerObstacle) => s.inCar
      ? carPenetration(n.position, n.yaw, o) > carPenetration(old, n.yaw, o) + 1e-9
      : overlaps(n.position, radius, o, height)
    if (sideBlockers.some(collision) || (!s.inCar && footCarContact(n.position, s.carPosition, s.carYaw))) {
      n.position[axis] = old[axis]
      if (s.inCar) n.blocked = true
    }
  }
  if (s.inCar && n.blocked) n.speed *= clamp(Math.hypot(n.position.x - s.position.x, n.position.z - s.position.z) / Math.max(1e-9, Math.hypot(dx, dz)), 0, 1)
  const floorCovers = obstacles.filter(o => o.surface === 'floor').map(o => ({ x0: o.min.x, x1: o.max.x, z0: o.min.z, z1: o.max.z, y: o.max.y }))
  for (const surface of [...jokerSurfaces(n), ...floorCovers]) {
    if (n.position.x < surface.x0 || n.position.x > surface.x1 || n.position.z < surface.z0 || n.position.z > surface.z1) continue
    const floorCover = floorCovers.includes(surface)
    if (n.vertical <= 0 && (previousY >= surface.y - .012 || (floorCover && s.grounded && surface.y - previousY <= .03)) && n.position.y <= surface.y + .005) {
      n.position.y = surface.y; n.vertical = 0; n.grounded = true
      if (surface === JOKER_FLOOR || floorCover) { n.onFloor = true; n.onDesk = false }
      if (s.inCar && s.lifted && surface === JOKER_DESK) { n.onDesk = true; n.onFloor = false }
    }
  }
  if (n.vertical > 0) for (const o of blockers) {
    const footprint = s.inCar ? jokerCarBounds(n.position, n.yaw) : { min: { x: n.position.x - radius, z: n.position.z - radius }, max: { x: n.position.x + radius, z: n.position.z + radius } }
    if (footprint.max.x > o.min.x && footprint.min.x < o.max.x && footprint.max.z > o.min.z && footprint.min.z < o.max.z && previousY + height <= o.min.y + .003 && n.position.y + height >= o.min.y) {
      n.position.y = o.min.y - height; n.vertical = 0
    }
  }
  // Jumping onto a low desktop object is supported, while its sides remain solid.
  if (n.vertical <= 0) for (const o of [...obstacles, ...(!s.inCar ? [jokerCarBounds(s.carPosition, s.carYaw)] : [])]) {
    const footprint = s.inCar ? jokerCarBounds(n.position, n.yaw) : { min: n.position, max: n.position }
    if (footprint.max.x > o.min.x && footprint.min.x < o.max.x && footprint.max.z > o.min.z && footprint.min.z < o.max.z && previousY >= o.max.y - .003 && n.position.y <= o.max.y) {
      n.position.y = o.max.y; n.vertical = 0; n.grounded = true
      if (s.lifted && o.max.y >= JOKER_DESK.y && n.position.x > JOKER_DESK.x0 && n.position.x < JOKER_DESK.x1 && n.position.z > JOKER_DESK.z0 && n.position.z < JOKER_DESK.z1) { n.onDesk = true; n.onFloor = false }
    }
  }
  if (n.inCar && n.lifted && n.onDesk && n.grounded) n.freePlay = true
  if (n.grounded) n.gliding = false
  n.canopy += ((n.gliding ? 1 : 0) - n.canopy) * (1 - Math.exp(-dt * 14))
  if (n.grounded && n.jumpBuffer > 0) n = jumpJoker(n)
  n.travelled += Math.hypot(n.position.x - s.position.x, n.position.z - s.position.z)
  if (s.inCar) {
    n.wheelTravel += n.speed * dt
    n.carPosition = { ...n.position }; n.carYaw = n.yaw
    const bumper = { x: n.position.x + Math.sin(n.yaw) * .078, y: n.position.y + .025, z: n.position.z + Math.cos(n.yaw) * .078 }
    if (!s.damage && n.lifted && n.speed > .13 && overlaps(bumper, .020, JOKER_PHONE, .03)) {
      n = { ...n, phase: 'crashing', time: 0, speed: 0, crashOrigin: { ...n.position }, crashYaw: n.yaw, cockpit: false }
    } else if (!s.damage && overlaps(bumper, .012, JOKER_PHONE, .03)) {
      n.position = { ...s.position }; n.carPosition = { ...n.position }; n.speed = -Math.abs(n.speed) * .15
    }
  }
  if (n.onFloor && n.inCar && n.lifted && !n.freePlay) n = recoverJoker({ ...n, onFloor: false }, obstacles)
  if (n.position.y < -.10 || Math.abs(n.position.x) > 2.2 || n.position.z > 2.3 || n.position.z < -.6) n = recoverJoker(n, obstacles)
  return n
}
