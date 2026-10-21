import { isMesh } from '~/utils/threeGuards'
import { Vector3 } from 'three'
import type { Object3D } from 'three'

export type ScreenQuad = [Vector3, Vector3, Vector3, Vector3]

/** UV order is top-left, top-right, bottom-right, bottom-left in the shipped glTF. */
export function getMonitorQuad(model: Object3D, name: string): ScreenQuad | null {
  const mesh = model.getObjectByName(name)
  if (!isMesh(mesh)) return null
  const position = mesh.geometry.getAttribute('position')
  const uv = mesh.geometry.getAttribute('uv')
  if (!position || !uv) return null
  let min = Infinity, max = -Infinity
  for (let i = 0; i < uv.count; i++) { min = Math.min(min, uv.getX(i)); max = Math.max(max, uv.getX(i)) }
  mesh.updateWorldMatrix(true, false)
  return [[min, 0], [max, 0], [max, 1], [min, 1]].map(([u, v]) => {
    let index = 0, distance = Infinity
    for (let i = 0; i < uv.count; i++) {
      const next = Math.hypot(uv.getX(i) - u!, uv.getY(i) - v!)
      if (next < distance) { index = i; distance = next }
    }
    return mesh.localToWorld(new Vector3().fromBufferAttribute(position, index))
  }) as ScreenQuad
}

/** Homography mapping an HTML rectangle onto the four projected screen corners. */
export function screenTransform(points: { x: number; y: number }[], width: number, height: number): string | null {
  const [a, b, c, d] = points
  if (!a || !b || !c || !d || width <= 0 || height <= 0) return null
  const dx1 = b.x - c.x, dx2 = d.x - c.x, dx3 = a.x - b.x + c.x - d.x
  const dy1 = b.y - c.y, dy2 = d.y - c.y, dy3 = a.y - b.y + c.y - d.y
  const denominator = dx1 * dy2 - dx2 * dy1
  if (Math.abs(denominator) < 1e-8) return null
  const g = (dx3 * dy2 - dx2 * dy3) / denominator
  const h = (dx1 * dy3 - dx3 * dy1) / denominator
  const values = [
    (b.x - a.x + g * b.x) / width, (b.y - a.y + g * b.y) / width, 0, g / width,
    (d.x - a.x + h * d.x) / height, (d.y - a.y + h * d.y) / height, 0, h / height,
    0, 0, 1, 0,
    a.x, a.y, 0, 1,
  ]
  return values.every(Number.isFinite) ? `matrix3d(${values.join(',')})` : null
}
