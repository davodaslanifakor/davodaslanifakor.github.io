import { BufferGeometry, Float32BufferAttribute, Group, Mesh, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { getMonitorQuad, screenTransform } from '../utils/monitorProjection'
import { readRoomGlb } from './helpers/glb'

function apply(transform: string, x: number, y: number) {
  const m = transform.slice(9, -1).split(',').map(Number)
  const w = m[3]! * x + m[7]! * y + m[15]!
  return [(m[0]! * x + m[4]! * y + m[12]!) / w, (m[1]! * x + m[5]! * y + m[13]!) / w]
}

describe('monitor surface projection', () => {
  it('maps all four HTML corners to a perspective trapezoid without drift', () => {
    const target = [{ x: 70, y: 40 }, { x: 690, y: 90 }, { x: 690, y: 390 }, { x: 70, y: 445 }]
    const matrix = screenTransform(target, 760, 414)!
    for (const [i, point] of [[0, 0], [760, 0], [760, 414], [0, 414]].entries()) {
      const projected = apply(matrix, point[0]!, point[1]!)
      expect(projected[0]).toBeCloseTo(target[i]!.x, 6)
      expect(projected[1]).toBeCloseTo(target[i]!.y, 6)
    }
    expect(screenTransform([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], 760, 414)).toBeNull()
  })

  it('finds both native screen halves from UVs and preserves their shared seam after desk placement', async () => {
    const asset = readRoomGlb(), model = new Group()
    model.position.x = -0.25
    for (const name of ['int_screen_left', 'int_screen_right']) {
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new Float32BufferAttribute((await asset.attribute(name, 'POSITION')).flat(), 3))
      geometry.setAttribute('uv', new Float32BufferAttribute((await asset.attribute(name, 'TEXCOORD_0')).flat(), 2))
      const mesh = new Mesh(geometry)
      mesh.name = name
      model.add(mesh)
    }
    const left = getMonitorQuad(model, 'int_screen_left')!, right = getMonitorQuad(model, 'int_screen_right')!
    expect(left[1].distanceTo(right[0])).toBeLessThan(0.0001)
    expect(left[2].distanceTo(right[3])).toBeLessThan(0.0001)
    expect(left[0].x).toBeLessThan(left[1].x)
    expect(left[0].y).toBeGreaterThan(left[3].y)
    expect(left[0].distanceTo(left[3])).toBeCloseTo(0.364, 3)
    expect(left[1].x).toBeCloseTo(-0.25, 3)
    expect(getMonitorQuad(model, 'missing')).toBeNull()
    expect(left.every(point => point instanceof Vector3)).toBe(true)
  })
})
