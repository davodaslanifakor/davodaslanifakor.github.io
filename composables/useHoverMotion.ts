import { onScopeDispose, toRaw } from 'vue'
import { Mesh, MeshBasicMaterial } from 'three'
import type { Color, Object3D, Vector3 } from 'three'

export const HOVER_OBJECT_IDS = ['paratrooper', 'robot', 'bugjar', 'cards', 'elephant', 'clock', 'library_about', 'library_story', 'library_career', 'library_contact'] as const

interface HoverTarget {
  root: Object3D
  scale: Vector3
  factor: number
  from: number
  target: number
  started: number
  face: MeshBasicMaterial | undefined
  faceColor: Color | undefined
}

/** Driven by the room's existing render loop; never adds a second animation loop. */
export function useHoverMotion(options: {
  model: () => Object3D | null
  hoveredId: () => string | null
  reducedMotion: () => boolean
  musicSelected: () => boolean
  accents: () => number
}) {
  let model: Object3D | null = null
  const targets = new Map<string, HoverTarget>()

  function restore() {
    for (const entry of targets.values()) {
      entry.root.scale.copy(entry.scale)
      if (entry.face && entry.faceColor) entry.face.color.copy(entry.faceColor)
    }
    targets.clear()
  }

  function updateFrame(time: number) {
    const nextModel = options.model() ? toRaw(options.model()) : null
    if (model !== nextModel) {
      restore()
      model = nextModel
      for (const id of HOVER_OBJECT_IDS) {
        const root = model?.getObjectByName(id.startsWith('library_') ? `root_library_frame_${id.slice(8)}` : `root_${id}`)
        if (!root) continue
        const mesh = root.getObjectByName(`int_${id}`)
        const face = mesh instanceof Mesh && mesh.material instanceof MeshBasicMaterial ? mesh.material : undefined
        targets.set(id, { root, scale: root.scale.clone(), factor: 1, from: 1, target: 1, started: time, face, faceColor: face?.color.clone() })
      }
    }
    const reduced = options.reducedMotion()
    for (const [id, entry] of targets) {
      const active = options.hoveredId() === id
      const target = active && !reduced ? 1.08 : 1
      if (target !== entry.target) {
        entry.from = entry.factor
        entry.target = target
        entry.started = time
      }
      const elapsed = Math.max(0, time - entry.started)
      // Damped spring with a small overshoot and a finite, exact endpoint.
      const spring = 1 - Math.exp(-elapsed / 48) * Math.cos(elapsed / 36)
      entry.factor = reduced || elapsed >= 250 ? target : entry.from + (target - entry.from) * spring
      const pulse = active && !reduced && options.musicSelected() ? Math.sin(time * Math.PI * 2 / 750) * 0.012 : 0
      entry.root.scale.copy(entry.scale).multiplyScalar(entry.factor + pulse)
      if (entry.face) {
        // One gentle dim-and-return, not a repeating flash; room lighting owns the baseline.
        const flicker = active && !reduced && elapsed < 180 ? 1 - Math.sin(elapsed / 180 * Math.PI) * 0.2 : 1
        entry.face.color.setScalar(options.accents() * flicker)
      }
    }
  }

  onScopeDispose(restore)
  return { updateFrame }
}
