import { gsap } from 'gsap'
import { onScopeDispose, readonly, shallowRef, toRaw, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { Vector3, Camera  } from 'three'

export interface CameraFocusPoint {
  name: `cam_${string}`
  position: Vector3
  target: Vector3
}

interface OrbitControlsLike {
  enabled: boolean
  target: { x: number, y: number, z: number }
  update: () => void
}

interface UseCameraRigOptions {
  camera: MaybeRefOrGetter<Camera | null | undefined>
  controls?: MaybeRefOrGetter<OrbitControlsLike | null | undefined>
  focusPoints: MaybeRefOrGetter<readonly CameraFocusPoint[]>
  duration?: number
}

export function useCameraRig(options: UseCameraRigOptions) {
  const isMoving = shallowRef(false)
  const activePoint = shallowRef<CameraFocusPoint['name']>('cam_start')
  const reducedMotion = shallowRef(false)
  let timeline: gsap.core.Timeline | null = null
  let mediaQuery: MediaQueryList | null = null

  function syncReducedMotion() {
    reducedMotion.value = mediaQuery?.matches ?? false
  }

  if (import.meta.client) {
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    syncReducedMotion()
    mediaQuery.addEventListener('change', syncReducedMotion)
  }

  function moveTo(pointName: CameraFocusPoint['name']): boolean {
    const camera = toValue(options.camera)
    const point = toValue(options.focusPoints).find(candidate => candidate.name === pointName)
    if (!camera || !point) return false

    timeline?.kill()
    const rawCamera = toRaw(camera)
    const controls = options.controls ? toValue(options.controls) : undefined
    const cameraPosition = {
      x: rawCamera.position.x,
      y: rawCamera.position.y,
      z: rawCamera.position.z,
    }
    const target = controls
      ? { x: controls.target.x, y: controls.target.y, z: controls.target.z }
      : { x: point.target.x, y: point.target.y, z: point.target.z }
    const duration = reducedMotion.value ? 0 : (options.duration ?? 0.85)

    isMoving.value = true
    activePoint.value = pointName
    if (controls) controls.enabled = false

    timeline = gsap.timeline({
      defaults: { duration, ease: 'power2.inOut' },
      onUpdate: () => {
        rawCamera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
        if (controls) {
          controls.target.x = target.x
          controls.target.y = target.y
          controls.target.z = target.z
        }
        rawCamera.lookAt(target.x, target.y, target.z)
        controls?.update()
      },
      onComplete: () => {
        isMoving.value = false
        if (controls) controls.enabled = pointName === 'cam_start'
      },
    })
    timeline.to(cameraPosition, {
      x: point.position.x,
      y: point.position.y,
      z: point.position.z,
    }, 0)
    timeline.to(target, {
      x: point.target.x,
      y: point.target.y,
      z: point.target.z,
    }, 0)

    return true
  }

  function focus(objectId: string) {
    return moveTo(`cam_${objectId}`)
  }

  function reset() {
    return moveTo('cam_start')
  }

  onScopeDispose(() => {
    timeline?.kill()
    mediaQuery?.removeEventListener('change', syncReducedMotion)
  })

  return {
    activePoint: readonly(activePoint),
    focus,
    isMoving: readonly(isMoving),
    reducedMotion: readonly(reducedMotion),
    reset,
  }
}
