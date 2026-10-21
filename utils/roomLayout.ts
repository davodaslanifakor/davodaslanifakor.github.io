import type { Object3D, Vector3 } from 'three'

export const DESK_OFFSET_X = -0.25

export const deskFocusNames = new Set([
  'cam_bugjar',
  'cam_cards',
  'cam_clock',
  'cam_elephant',
  'cam_monitor',
  'cam_paratrooper',
  'cam_phone',
  'cam_plush',
  'cam_robot',
  'cam_screen_left',
  'cam_screen_right',
  'cam_speakers',
])

const deskNodeNames = new Set([
  'root_bugjar',
  'root_cards',
  'root_clock',
  'root_elephant',
  'root_laptop',
  'root_mouse',
  'root_paratrooper',
  'root_phone',
  'root_robot',
  'root_screen_left',
  'root_screen_right',
  'root_speaker_l',
  'root_speaker_r',
  'static_style_ultrawide_housing',
  'static_style_monitor_base',
  'static_style_monitor_stem',
  'static_style_monitor_vesa',
])

const deskNodePrefixes = [
  'static_desk_',
  'static_hub',
  'static_phone_stand',
  'static_riser_',
  'static_subwoofer',
  'static_style_desk_plant',
]

/** Adjust direct scene nodes once; descendants inherit their parent's offset. */
export function applyRoomLayout(model: Object3D): () => void {
  const originals = new Map<Object3D, { position: Vector3, scale: Vector3 }>()
  const visibilitySnapshots = new Map<Object3D, boolean>()

  for (const child of model.children) {
    if (child.name.startsWith('root_world_clock_')
      || child.name.startsWith('static_world_clock_')
      || child.name.startsWith('static_style_clock_city_')
      || child.name.startsWith('static_style_clock_label_')
      || child.name === 'static_lettering_batch_1') {
      visibilitySnapshots.set(child, child.visible)
      child.visible = false
    }

    const isDeskNode = deskNodeNames.has(child.name)
      || deskNodePrefixes.some(prefix => child.name.startsWith(prefix))
    const isRug = child.name === 'static_style_rug'
    if (!isDeskNode && !isRug) continue

    originals.set(child, { position: child.position.clone(), scale: child.scale.clone() })
    if (isDeskNode) child.position.x += DESK_OFFSET_X
    if (isRug) {
      // glTF is Y-up: resize the footprint without changing height or thickness.
      child.scale.x *= 3.56 / 2.55
      child.scale.z *= 2.30 / 0.9
      child.position.x = -0.03
      child.position.z = 0.82
    }
  }
  model.updateMatrixWorld(true)

  return () => {
    for (const [child, visible] of visibilitySnapshots) {
      child.visible = visible
    }
    for (const [child, original] of originals) {
      child.position.copy(original.position)
      child.scale.copy(original.scale)
    }
    model.updateMatrixWorld(true)
  }
}
