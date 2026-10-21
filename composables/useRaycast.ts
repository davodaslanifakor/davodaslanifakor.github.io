import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import type { Object3D } from 'three'
import type { SceneObject } from '~/content/portfolio'

export interface ScenePointerEvent {
  object?: Object3D
  intersections?: { object: Object3D }[]
  stopPropagation?: () => void
}

interface UseRaycastOptions {
  objects: MaybeRefOrGetter<readonly SceneObject[]>
  onActivate?: (object: SceneObject) => void
  onHover?: (objectId: string | null) => void
}

const MONITOR_SCREEN_MESH = 'int_monitor_screen'

/** `int_<id>__<n>` lets one object own several meshes; `__` because ids contain `_`. */
const MESH_SUFFIX = /__\d+$/

export function normalizeMeshName(meshName: string): string {
  if (meshName === MONITOR_SCREEN_MESH) return 'int_monitor'
  return meshName.replace(MESH_SUFFIX, '')
}

export function resolveInteractiveMeshName(object: Object3D | null | undefined): string | null {
  let current = object ?? null

  while (current) {
    if (current.name === 'static_subwoofer' || current.name.startsWith('static_subwoofer_')) return 'int_speakers'
    if (current.name.startsWith('int_')) return current.name
    if (['root_paratrooper', 'root_cards', 'root_robot'].includes(current.name)) return current.name.replace('root_', 'int_')
    if (current.name === 'root_bugjar') return 'int_bugjar'
    if (current.name === 'root_clock') return 'int_clock'
    current = current.parent
  }

  return null
}

export function useRaycast(options: UseRaycastOptions) {
  function resolveObject(event: ScenePointerEvent, fallback?: SceneObject): SceneObject | undefined {
    // Tres reports the handler's object; when the handler sits on a whole model
    // the hit child only appears in intersections, so both are consulted.
    const hit = event.object ?? event.intersections?.[0]?.object
    const meshName = resolveInteractiveMeshName(hit)
    if (!meshName) return fallback

    const contractMesh = normalizeMeshName(meshName)
    return toValue(options.objects).find(object => object.mesh === contractMesh) ?? fallback
  }

  function handlePointerEnter(event: ScenePointerEvent, fallback?: SceneObject) {
    event.stopPropagation?.()
    const object = resolveObject(event, fallback)
    options.onHover?.(object?.id ?? null)
  }

  function handlePointerLeave(event?: ScenePointerEvent) {
    event?.stopPropagation?.()
    options.onHover?.(null)
  }

  function handleActivate(event: ScenePointerEvent, fallback?: SceneObject) {
    event.stopPropagation?.()
    const object = resolveObject(event, fallback)
    if (object) options.onActivate?.(object)
  }

  return {
    handleActivate,
    handlePointerEnter,
    handlePointerLeave,
    resolveObject,
  }
}
