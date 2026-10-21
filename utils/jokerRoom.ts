import type { JokerObstacle, JokerPoint } from './jokerAdventure'

/** Measured room.glb floor; the open front/left edges stay inside the visible floor. */
export const JOKER_FLOOR = { x0: -2, x1: 1.85, z0: -.42, z1: 2.10, y: 0 }
export const JOKER_CAR_SIZE = { halfWidth: .051, halfLength: .089, height: .095 }
export const JOKER_FLOOR_RAMP = { x0: 1.23, x1: 1.46, z0: .36, z1: .60 }
export function jokerFloorRampHeight(z: number, lifted: boolean) { return (lifted ? .0275 : .056) * Math.max(0, Math.min(1, (.60 - z) / .24)) }
export const JOKER_ROOM_BOUNDARIES: JokerObstacle[] = [
  { min: { x: -2.1, y: -.1, z: -.48 }, max: { x: 2, y: 3, z: -.42 } },
  { min: { x: -2.1, y: -.1, z: -.48 }, max: { x: -2, y: 3, z: 2.2 } },
  { min: { x: 1.85, y: -.1, z: -.48 }, max: { x: 2, y: 3, z: 2.2 } },
  { min: { x: -2.1, y: -.1, z: 2.10 }, max: { x: 2, y: 3, z: 2.2 } },
]
export function jokerFloorParking(obstacles: readonly JokerObstacle[]): JokerPoint {
  const candidates = [.1, -.65, 1.05].flatMap(x => [.7, 1.3, 1.8].map(z => ({ x, y: 0, z })))
  const point = candidates.find(p => !obstacles.some(o => o.surface !== 'floor' && p.x + .11 > o.min.x && p.x - .11 < o.max.x && p.z + .11 > o.min.z && p.z - .11 < o.max.z && o.min.y < .10 && o.max.y > .004)) ?? candidates[0]!
  return { ...point, y: Math.max(0, ...obstacles.filter(o => o.surface === 'floor' && point.x > o.min.x && point.x < o.max.x && point.z > o.min.z && point.z < o.max.z).map(o => o.max.y)) }
}
