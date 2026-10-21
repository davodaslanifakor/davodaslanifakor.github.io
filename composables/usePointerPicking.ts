import { onScopeDispose, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { Raycaster, Vector2 } from 'three'
import type { Camera, Object3D, Vector3 } from 'three'

interface UsePointerPickingOptions {
  /** The element the renderer draws into. */
  surface: MaybeRefOrGetter<HTMLElement | null | undefined>
  camera: MaybeRefOrGetter<Camera | null | undefined>
  /** Only these objects are tested, so static scenery never costs a ray. */
  targets: MaybeRefOrGetter<readonly Object3D[]>
  onHover: (object: Object3D | null) => void
  onActivate: (object: Object3D, point?: Vector3) => void
}

/**
 * Pointer picking against an explicit list of objects.
 *
 * TresJS dispatches pointer events to the component that declares the handler,
 * and a `<primitive>` wrapping a loaded glTF scene does not receive events for
 * its descendants — so hovering a mesh inside the model never fires. Raycasting
 * here keeps hit-testing independent of that, and lets the caller decide exactly
 * which meshes are interactive.
 */
export function usePointerPicking(options: UsePointerPickingOptions) {
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  let frame = 0
  let attached: HTMLElement | null = null
  let lastHit: Object3D | null = null

  function intersection(event: PointerEvent | MouseEvent) {
    const surface = toValue(options.surface)
    const camera = toValue(options.camera)
    const targets = toValue(options.targets)
    if (!surface || !camera || !targets.length) return null

    const rect = surface.getBoundingClientRect()
    if (!rect.width || !rect.height) return null

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)

    return raycaster.intersectObjects(targets as Object3D[], true)[0] ?? null
  }

  function pick(event: PointerEvent | MouseEvent): Object3D | null { return intersection(event)?.object ?? null }

  function onPointerMove(event: PointerEvent) {
    if (frame) return
    // Coalesce to one ray per frame; pointermove fires far more often than that.
    frame = requestAnimationFrame(() => {
      frame = 0
      const hit = pick(event)
      if (hit === lastHit) return
      lastHit = hit
      options.onHover(hit)
    })
  }

  function onPointerLeave() {
    lastHit = null
    options.onHover(null)
  }

  function onClick(event: MouseEvent) {
    const hit = intersection(event)
    if (hit) options.onActivate(hit.object, hit.point)
  }

  function detach() {
    if (!attached) return
    attached.removeEventListener('pointermove', onPointerMove)
    attached.removeEventListener('pointerleave', onPointerLeave)
    attached.removeEventListener('click', onClick)
    attached = null
  }

  watch(() => toValue(options.surface), (surface) => {
    detach()
    if (!surface) return
    attached = surface
    surface.addEventListener('pointermove', onPointerMove)
    surface.addEventListener('pointerleave', onPointerLeave)
    surface.addEventListener('click', onClick)
  }, { immediate: true, flush: 'post' })

  onScopeDispose(() => {
    if (frame) cancelAnimationFrame(frame)
    detach()
  })

  return { pick }
}
