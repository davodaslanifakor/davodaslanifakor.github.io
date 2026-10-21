import { describe, expect, it } from 'vitest'
import { Box3, PerspectiveCamera, Vector3 } from 'three'
import { frameRoom, roomFocusBounds } from '../utils/roomFraming'
import { deskModel } from './helpers/deskModel'

describe('room framing', () => {
  it.each([0.45, 1, 1.5, 2.4])('keeps the full room and rug inside the viewport at aspect %s', (aspect) => {
    const bounds = new Box3(new Vector3(-1.8, 0, -0.5), new Vector3(1.9, 2.4, 1.5))
    const target = new Vector3(0.25, 1.15, -0.1)
    const eye = new Vector3(0.22, 1.62, 3.45)
    const camera = new PerspectiveCamera(38, aspect, 0.05, 50)
    camera.position.copy(frameRoom(eye, target, bounds, aspect))
    camera.lookAt(target)
    camera.updateMatrixWorld()
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const point = new Vector3(x, y, z).project(camera)
      expect(Math.abs(point.x)).toBeLessThanOrEqual(0.901)
      expect(Math.abs(point.y)).toBeLessThanOrEqual(aspect < 1 ? 0.661 : 0.781)
    }
    expect(camera.position.clone().sub(target).normalize().distanceTo(eye.sub(target).normalize())).toBeLessThan(1e-6)
  })

  it.each([0.45, 1, 1.5, 2.4])('opens closer to the shipped desk and library without clipping them at aspect %s', (aspect) => {
    const fixture = deskModel()
    try {
      const bounds = roomFocusBounds(fixture.model)
      const room = new Box3().setFromObject(fixture.model)
      const target = new Vector3(0.2439494, 1.2447935, 0.6159904)
      const eye = new Vector3(0.22, 1.62, 3.45)
      const opening = frameRoom(eye, target, bounds, aspect)
      expect(opening.distanceTo(target)).toBeLessThan(frameRoom(eye, target, room, aspect).distanceTo(target) * 0.85)

      const camera = new PerspectiveCamera(38, aspect, 0.05, 50)
      camera.position.copy(opening)
      camera.lookAt(target)
      camera.updateMatrixWorld()
      for (const name of ['static_desk_top', 'static_style_shelf_0', 'static_style_shelf_5', 'static_style_top_trailing_plant_pot', 'int_screen_left', 'int_screen_right', 'int_monitor_screen']) {
        const object = fixture.model.getObjectByName(name)
        expect(object, name).toBeDefined()
        const item = new Box3().setFromObject(object!)
        for (const x of [item.min.x, item.max.x]) for (const y of [item.min.y, item.max.y]) for (const z of [item.min.z, item.max.z]) {
          const point = new Vector3(x, y, z).project(camera)
          expect(Math.abs(point.x), name).toBeLessThanOrEqual(0.901)
          expect(Math.abs(point.y), name).toBeLessThanOrEqual(aspect < 1 ? 0.661 : 0.781)
        }
      }

      // Decorative floor size must not push the opening view away again.
      fixture.model.getObjectByName('static_style_rug')!.scale.multiplyScalar(10)
      expect(roomFocusBounds(fixture.model).equals(bounds)).toBe(true)
    } finally { fixture.dispose() }
  })
})
