import { BufferGeometry, Float32BufferAttribute, PerspectiveCamera } from 'three'
import type { Mesh } from 'three'
import { describe, expect, it } from 'vitest'
import { bookingCamera } from '../utils/bookingScreen'
import { getMonitorQuad } from '../utils/monitorProjection'
import { deskModel } from './helpers/deskModel'
import { readRoomGlb } from './helpers/glb'

describe('MacBook calendar framing', () => {
  it('faces the real laptop screen and keeps its four corners clear of desktop controls', async () => {
    const asset = deskModel(), glb = readRoomGlb()
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute((await glb.attribute('int_monitor_screen', 'POSITION')).flat(), 3))
    geometry.setAttribute('uv', new Float32BufferAttribute((await glb.attribute('int_monitor_screen', 'TEXCOORD_0')).flat(), 2))
    const screen = asset.model.getObjectByName('int_monitor_screen') as Mesh
    screen.geometry = geometry
    try {
      const quad = getMonitorQuad(asset.model, 'int_monitor_screen')!
      expect(quad[0].y).toBeGreaterThan(quad[3].y)
      expect(quad[0].x).toBeLessThan(quad[1].x)
      for (const [width, height] of [[1280, 720], [906, 944], [1920, 1080], [820, 600]]) {
        const frame = bookingCamera(asset.model, width! / height!, height!)
        const camera = new PerspectiveCamera(38, width! / height!, 0.05, 50)
        camera.position.copy(frame.position); camera.lookAt(frame.target); camera.updateMatrixWorld()
        const projected = quad.map(point => point.clone().project(camera))
        for (const point of projected) {
          expect(Math.abs(point.x)).toBeLessThan(0.85)
          expect(point.z).toBeGreaterThan(-1)
          expect(point.z).toBeLessThan(1)
          const y = (1 - point.y) * height! / 2
          expect(y).toBeGreaterThan(110)
          expect(y).toBeLessThan(height! - 130)
        }
        expect(projected[0]!.x).toBeLessThan(projected[1]!.x)
        expect(projected[0]!.y).toBeGreaterThan(projected[3]!.y)
      }
    } finally { geometry.dispose(); asset.dispose() }
  })
})
