import type { JokerObstacle, JokerPoint } from './jokerAdventure'

export const JOKER_DESK = { x0: -1.195, x1: .855, z0: -.40, z1: .36, y: .754 }
/** A clear parking space with room to dismount, chosen from the measured desktop props. */
export function jokerDeskParking(obstacles: readonly JokerObstacle[]): JokerPoint {
  const candidates = [.48, -.65, -1.02, .12, -.25].flatMap(x => [.30, .13, -.23].map(z => ({ x, y: JOKER_DESK.y, z })))
  return candidates.find(p => !obstacles.some(o => p.x + .10 > o.min.x && p.x - .10 < o.max.x && p.z + .060 > o.min.z && p.z - .060 < o.max.z && p.y < o.max.y - .004 && p.y + .10 > o.min.y)) ?? candidates[0]!
}

export function jokerCrashRest(origin: JokerPoint, yaw: number): JokerPoint {
  return { x: origin.x - Math.sin(yaw) * .025, y: JOKER_DESK.y, z: origin.z - Math.cos(yaw) * .025 }
}
