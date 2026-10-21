import { isMesh } from '~/utils/threeGuards'
import { Box3, Vector3 } from 'three'
import type { Object3D } from 'three'

const openingSubjects = ['int_', 'static_desk_', 'static_style_library_', 'static_style_shelf_', 'static_style_top_trailing_plant_']

/** The opening shot fits the furniture and interactions, without the empty floor/wall margins. */
export function roomFocusBounds(model: Object3D) {
  const bounds = new Box3()
  model.updateMatrixWorld(true)
  model.traverseVisible((object) => {
    if (!isMesh(object)) return
    if (openingSubjects.some(prefix => object.name.startsWith(prefix))) {
      bounds.union(new Box3().setFromObject(object))
    }
  })
  return bounds
}

/** Fit the supplied composition while preserving the checkpoint camera direction. */
export function frameRoom(position: Vector3, target: Vector3, bounds: Box3, aspect: number, fov = 38) {
  if (bounds.isEmpty()) return position.clone()
  const backward = position.clone().sub(target).normalize()
  const right = new Vector3(0, 1, 0).cross(backward).normalize()
  const up = backward.clone().cross(right).normalize()
  const tangent = Math.tan(fov * Math.PI / 360)
  // Reserve space for the persistent HUD and navigation on both form factors.
  const safeHeight = aspect < 1 ? 0.66 : 0.78
  let distance = 0
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new Vector3(x, y, z).sub(target)
        const depth = corner.dot(backward)
        distance = Math.max(distance,
          depth + Math.abs(corner.dot(right)) / (tangent * Math.max(0.1, aspect) * 0.9),
          depth + Math.abs(corner.dot(up)) / (tangent * safeHeight))
      }
    }
  }
  return target.clone().addScaledVector(backward, distance)
}
