import { Vector3 } from 'three'
import type { JokerPoint, JokerState } from './jokerAdventure'

export const JOKER_PULL_SECONDS = 2.8
export const JOKER_ENTRY_SECONDS = 4.8
export const JOKER_LIFT_SECONDS = 3.6
export const JOKER_LATCH_EXIT = { x: 1.185, y: .056, z: .163 }
export const JOKER_SEAT = { x: 0, y: .025, z: -.020 }
const up = new Vector3(0, 1, 0)
export const interactionEase = (t: number, start: number, end: number) => {
  const p = Math.max(0, Math.min(1, (t - start) / (end - start)))
  return p * p * (3 - 2 * p)
}
const point = (p: JokerPoint) => new Vector3(p.x, p.y, p.z)
const turn = (a: number, b: number, t: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t
/** One carriage pose drives the platform, seated car and gameplay handoff. */
export function jokerLiftPose(s: JokerState) {
  const t = s.time / JOKER_LIFT_SECONDS
  if (s.phase === 'lowering') {
    const rise = 1 - interactionEase(t, .18, .94)
    return { position: point(s.position), platformY: .05 + .89 * rise, yaw: s.yaw, rampAngle: -Math.PI / 2 * interactionEase(t, 0, .18) }
  }
  const rise = interactionEase(t, .10, .80)
  const from = s.transitionFrom ?? { x: 1.345, y: .056, z: .245 }
  const position = point(from).lerp(new Vector3(1.345, .056, .245), interactionEase(t, 0, .10))
  position.y = .056 + .89 * rise
  return { position, platformY: .05 + .89 * rise, yaw: turn(s.transitionYaw, -Math.PI / 2, interactionEase(t, .80, 1)), rampAngle: -Math.PI / 2 * (1 - interactionEase(t, .78, .98)) }
}
export function jokerCarPoint(p: JokerPoint, car: JokerPoint, yaw: number) { return point(p).applyAxisAngle(up, yaw).add(point(car)) }
export function jokerEntrySide(s: JokerState) {
  const local = point(s.transitionFrom ?? s.position).sub(point(s.carPosition)).applyAxisAngle(up, -s.carYaw)
  return local.x > .001 ? 1 : -1
}

/** The hand-sized grip sits on the front of the book, within the rigid arm's reach. */
export function jokerLatchGrip(angle: number) {
  return new Vector3(0, .026, .011).applyAxisAngle(new Vector3(1, 0, 0), angle).add(new Vector3(1.185, .070, .105))
}
export function jokerPullPose(s: JokerState) {
  const t = s.time / JOKER_PULL_SECONDS
  const pull = interactionEase(t, .40, .65), release = interactionEase(t, .75, .94)
  const latchAngle = .49 * pull, grip = jokerLatchGrip(latchAngle)
  // Plant the feet while the arm follows the tilting book; a small backward step supplies the tug.
  const reach = Math.sqrt(Math.max(0, .0171 ** 2 - (grip.y - .0915) ** 2))
  const stance = new Vector3(grip.x + .0093, .056, grip.z + reach - .0042)
  const approach = interactionEase(t, 0, .25)
  const position = point(s.transitionFrom ?? s.position).lerp(stance, approach).lerp(point(JOKER_LATCH_EXIT), release)
  return { position, yaw: turn(s.transitionYaw, Math.PI, approach), latchAngle,
    doorLift: .282 * interactionEase(t, .64, .96), grip,
    contact: interactionEase(t, .25, .37) * (1 - release),
    stride: Math.sin(approach * Math.PI * 4) * .24 * (1 - approach) + Math.sin(release * Math.PI * 2) * .18 }
}

/** Waypoints go around the front/rear bumper before approaching either hinged door. */
export function jokerEntryPath(s: JokerState) {
  const side = jokerEntrySide(s)
  const from = point(s.transitionFrom ?? s.position).sub(point(s.carPosition)).applyAxisAngle(up, -s.carYaw)
  const handoff = new Vector3(side * .060, 0, -.0167)
  const path = [from]
  if (Math.abs(from.x) < .060) {
    const z = from.z >= 0 ? Math.max(.108, from.z) : Math.min(-.108, from.z)
    path.push(new Vector3(from.x, 0, z), new Vector3(side * .074, 0, z))
  }
  path.push(new Vector3(side * .074, 0, handoff.z), handoff)
  return path
}
function alongPath(path: Vector3[], progress: number) {
  const lengths = path.slice(1).map((p, i) => p.distanceTo(path[i]!))
  let remaining = progress * lengths.reduce((sum, d) => sum + d, 0)
  for (let i = 0; i < lengths.length; i++) {
    const length = lengths[i]!
    if (remaining <= length && length > 0) return path[i]!.clone().lerp(path[i + 1]!, remaining / length)
    remaining -= length
  }
  return path[path.length - 1]!.clone()
}
export function jokerEntryPose(s: JokerState) {
  const t = s.time / JOKER_ENTRY_SECONDS, side = jokerEntrySide(s)
  const approach = interactionEase(t, 0, .26)
  const open = interactionEase(t, .33, .47), close = interactionEase(t, .83, .97)
  // Positive Y opens the left door outward; the right hinge is its mirror.
  const doorAngle = -side * 1.15 * open * (1 - close)
  const handle = new Vector3(side * .010, .010, -.052).applyAxisAngle(up, doorAngle).add(new Vector3(side * .037, .028, .026))
  const path = jokerEntryPath(s), local = alongPath(path, approach)
  const direction = alongPath(path, Math.min(1, approach + .06)).sub(alongPath(path, Math.max(0, approach - .06)))
  const followHandle = new Vector3(handle.x + side * .013, 0, handle.z + .0093)
  local.lerp(followHandle, interactionEase(t, .26, .33))
  local.lerp(new Vector3(side * .067, 0, -.026), interactionEase(t, .47, .55))
  local.lerp(new Vector3(side * .029, .022, -.024), interactionEase(t, .55, .69))
  local.lerp(new Vector3(0, .034, -.020), interactionEase(t, .69, .80))
  local.lerp(point(JOKER_SEAT), interactionEase(t, .80, .87))
  const facingDoor = -side * Math.PI / 2
  const walkingYaw = s.carYaw + Math.atan2(direction.x, direction.z)
  const approachYaw = turn(s.transitionYaw, walkingYaw, interactionEase(t, 0, .06))
  const doorYaw = turn(approachYaw, s.carYaw + facingDoor, interactionEase(approach, .70, 1))
  const yaw = turn(doorYaw, s.carYaw, interactionEase(t, .65, .81))
  return { position: jokerCarPoint(local, s.carPosition, s.carYaw), yaw, side, doorAngle,
    handle: jokerCarPoint(handle, s.carPosition, s.carYaw),
    contact: interactionEase(t, .26, .33) * (1 - interactionEase(t, .47, .53)),
    seated: interactionEase(t, .64, .83), wheelGrip: interactionEase(t, .77, .89),
    stride: Math.sin(approach * Math.PI * 8) * .35 * (1 - interactionEase(t, .20, .26)),
    step: Math.sin(interactionEase(t, .55, .72) * Math.PI) * .85 }
}
