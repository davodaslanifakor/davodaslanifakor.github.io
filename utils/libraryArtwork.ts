import { Box3, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { CameraFocusPoint } from '~/composables/useCameraRig'

// The supplied portrait keeps its authored Blender names; its frame and mat share the click target.
export const PORTRAIT_MESH_NAMES = ['static_style_art_frame', 'static_style_art_paper', 'static_style_art_portrait']

export function libraryPortraitFocus(model: Object3D | null, aspect: number): CameraFocusPoint[] {
  const frame = model?.getObjectByName('static_style_art_frame')
  if (!frame) return []
  const bounds = new Box3().setFromObject(frame)
  const target = bounds.getCenter(new Vector3()), size = bounds.getSize(new Vector3())
  const distance = Math.max(size.x / (2 * Math.tan(19 * Math.PI / 180) * Math.max(aspect, .1) * .8), size.y / (2 * Math.tan(19 * Math.PI / 180) * .7)) + size.z / 2
  return [{ name: 'cam_library_portrait', target, position: target.clone().add(new Vector3(0, 0, distance)) }]
}
