import { isMesh } from '~/utils/threeGuards'
import { Box3, Matrix4, Vector3 } from 'three'
import type { Object3D, PerspectiveCamera } from 'three'

export interface ScreenPoint { x: number; y: number }

/** Bounds in the lid's own axes stay tight when the laptop is tilted. */
export function laptopLidCorners(model: Object3D): { root: Object3D; points: Vector3[] } | null {
  const root = model.getObjectByName('root_laptop_lid')
  if (!root) return null
  root.updateWorldMatrix(true, true)
  const inverse = new Matrix4().copy(root.matrixWorld).invert()
  const bounds = new Box3()
  root.traverse(child => {
    if (!isMesh(child) || !child.visible) return
    child.geometry.computeBoundingBox()
    if (!child.geometry.boundingBox) return
    const transform = new Matrix4().multiplyMatrices(inverse, child.matrixWorld)
    bounds.union(child.geometry.boundingBox.clone().applyMatrix4(transform))
  })
  if (bounds.isEmpty()) return null
  const points: Vector3[] = []
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) points.push(new Vector3(x, y, z))
  return { root, points }
}

export function convexScreenHull(points: ScreenPoint[]): ScreenPoint[] {
  const sorted = points.toSorted((a, b) => a.x - b.x || a.y - b.y)
  const cross = (a: ScreenPoint, b: ScreenPoint, c: ScreenPoint) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  const half = (items: ScreenPoint[]) => {
    const hull: ScreenPoint[] = []
    for (const point of items) {
      while (hull.length >= 2 && cross(hull.at(-2)!, hull.at(-1)!, point) <= 0) hull.pop()
      hull.push(point)
    }
    return hull.slice(0, -1)
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

/** Cut a hole in the HTML overlay where the nearer 3D laptop must remain visible. */
export function monitorOcclusionPath(lid: ReturnType<typeof laptopLidCorners>, screen: Vector3[], camera: PerspectiveCamera, width: number, height: number): string | undefined {
  if (!lid || !screen.length || width <= 0 || height <= 0 || !lid.root.visible) return undefined
  lid.root.updateWorldMatrix(true, false)
  const points = lid.points.map(point => point.clone().applyMatrix4(lid.root.matrixWorld).project(camera))
  const screenDepth = Math.min(...screen.map(point => point.clone().project(camera).z))
  // Never hide the monitor for an object behind it or crossing the near plane.
  if (points.some(point => point.z <= -1 || point.z >= screenDepth)) return undefined
  const hull = convexScreenHull(points.map(point => ({ x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 })))
  if (hull.length < 3) return undefined
  const hole = hull.map(point => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')
  return `path(evenodd, "M 0 0 H ${width} V ${height} H 0 Z M ${hole} Z")`
}
