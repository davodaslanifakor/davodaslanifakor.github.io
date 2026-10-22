import { Vector3 } from 'three'
import type { Object3D } from 'three'
import type { CameraFocusPoint } from '~/composables/useCameraRig'
import { getMonitorQuad } from '~/utils/monitorProjection'

/** Face the existing laptop panel and leave room for navigation and the return control. */
export function bookingCamera(model: Object3D | null, aspect: number, height: number): CameraFocusPoint {
  const quad = model && getMonitorQuad(model, 'int_monitor_screen')
  if (!quad) return { name: 'cam_booking', target: new Vector3(-0.23, 1, 0.1), position: new Vector3(-0.23, 1.2, 0.7) }
  const target = quad.reduce((sum, point) => sum.add(point), new Vector3()).multiplyScalar(0.25)
  const right = quad[1].clone().sub(quad[0])
  const up = quad[0].clone().sub(quad[3])
  const normal = right.clone().cross(up).normalize()
  const verticalShare = Math.max(0.35, Math.min(0.76, (height - 300) / height))
  const tangent = Math.tan(19 * Math.PI / 180)
  const distance = Math.max(right.length() / (2 * tangent * aspect * 0.84), up.length() / (2 * tangent * verticalShare))
  return { name: 'cam_booking', target, position: target.clone().addScaledVector(normal, distance) }
}
