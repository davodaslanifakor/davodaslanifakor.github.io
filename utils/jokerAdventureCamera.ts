import { MathUtils, Ray, Vector3 } from 'three'
import type { Box3, PerspectiveCamera } from 'three'
import type { JokerPoint, JokerState } from './jokerAdventure'
import { jokerCarPoint, jokerEntrySide } from './jokerInteractionPose'

export interface JokerViewport { width: number; height: number; top: number; bottom: number }
export interface JokerCameraPose { position: Vector3; target: Vector3; fov: number; cockpit: boolean }
const point = (p: JokerPoint) => new Vector3(p.x, p.y, p.z)
/** Area framing keeps the garage entrance in view instead of following the car through its back wall. */
export function jokerCameraPose(s: JokerState, actor: JokerPoint, car: JokerPoint, aspect: number, reduced: boolean, heading = s.yaw): JokerCameraPose {
  const cockpit = s.inCar && s.cockpit && s.phase === 'driving'
  const target = point(s.inCar ? car : actor), position = new Vector3()
  if (cockpit) {
    const up = new Vector3(0, 1, 0)
    position.copy(point(car)).add(new Vector3(0, .080, .005).applyAxisAngle(up, s.yaw))
    target.copy(point(car)).add(new Vector3(0, .060, .35).applyAxisAngle(up, s.yaw))
    return { position, target, fov: 68, cockpit }
  }
  if (s.phase === 'opening' && !reduced) {
    target.set(1.225, .108, .115)
    position.set(1.08, .21, .115 + Math.max(.36, .30 / aspect))
  } else if (s.phase === 'entering' && !reduced) {
    const side = jokerEntrySide(s)
    target.copy(jokerCarPoint({ x: side * .025, y: .048, z: .010 }, car, s.carYaw))
    position.copy(jokerCarPoint({ x: side * .075, y: .175, z: Math.max(.34, .30 / aspect) }, car, s.carYaw))
    // Stay between the tall lift rails when boarding inside the shelf bay.
    if (car.y < .5) { position.x = MathUtils.clamp(position.x, 1.265, 1.425); position.z = Math.max(.22, position.z) }
  } else if (s.phase === 'grappling') {
    target.set(1.04, .58, .13); position.set(1.05, .99, .13 + Math.max(1.4, .98 / aspect))
  } else if (s.phase === 'lowering') {
    target.set(1.345, .22, .30)
    position.set(1.345, .48, .30 + Math.max(.70, .50 / aspect))
  } else if (s.phase === 'lifting') {
    target.copy(point(car)).add(new Vector3(-.09, .10, .02))
    position.copy(target).add(new Vector3(.22, .24, Math.max(.60, .38 / aspect)))
  } else if (target.y < .5 && !s.onDesk && !s.freePlay) {
    target.set(1.30, .12, .04)
    position.set(1.30, .29, .04 + Math.max(.70, .58 / aspect))
  } else if (s.phase === 'crashing' || s.phase === 'finished') {
    target.copy(point(car)).lerp(new Vector3(.29, .76, .11), .55).y += .025
    position.copy(target).add(new Vector3(.20, .36, Math.max(.43, .31 / aspect)))
  } else if (s.gliding) {
    const forward = new Vector3(Math.sin(heading), 0, Math.cos(heading))
    target.y += .10
    position.copy(point(car)).addScaledVector(forward, -Math.max(.55, .30 / aspect)).add(new Vector3(0, .40, 0))
  } else if (s.inCar && !reduced) {
    const forward = new Vector3(Math.sin(heading), 0, Math.cos(heading))
    target.addScaledVector(forward, .115).y += .045
    position.copy(point(car)).addScaledVector(forward, -Math.max(.43, .26 / aspect)).add(new Vector3(0, .34, 0))
  } else {
    target.y += .04
    position.copy(target).add(new Vector3(0, .36, Math.max(.47, .27 / aspect)))
  }
  return { position, target, fov: 46, cockpit }
}

export function createJokerCamera(blockers: readonly Box3[]) {
  let saved: { camera: PerspectiveCamera; near: number; fov: number; view: PerspectiveCamera['view'] } | null = null
  const look = new Vector3(), ray = new Ray(), direction = new Vector3(), hit = new Vector3()
  let heading = 0, initialized = false
  const candidate = new Vector3(), best = new Vector3(), offset = new Vector3()
  function avoidObstacles(origin: Vector3, desired: Vector3) {
    const distance = origin.distanceTo(desired)
    direction.copy(desired).sub(origin).normalize(); ray.set(origin, direction)
    let limit = distance
    for (const bounds of blockers) {
      if (bounds.containsPoint(origin)) continue
      if (ray.intersectBox(bounds, hit)) limit = Math.min(limit, Math.max(.012, origin.distanceTo(hit) - .025))
    }
    if (limit < distance) desired.copy(origin).addScaledVector(direction, limit)
  }
  function update(s: JokerState, actor: JokerPoint, car: JokerPoint, camera: PerspectiveCamera, dt: number, reduced: boolean, viewport?: JokerViewport) {
    if (!saved) {
      saved = { camera, near: camera.near, fov: camera.fov, view: camera.view ? { ...camera.view } : null }
      camera.getWorldDirection(look).multiplyScalar(.55).add(camera.position)
    }
    if (!initialized) { heading = s.yaw; initialized = true }
    const blend = reduced ? 1 : 1 - Math.exp(-Math.max(0, dt) * 7)
    heading += Math.atan2(Math.sin(s.yaw - heading), Math.cos(s.yaw - heading)) * blend
    const pose = jokerCameraPose(s, actor, car, camera.aspect, reduced, heading)
    const focus = point(s.inCar ? car : actor).add(new Vector3(0, .04, 0))
    if (blockers.some(bounds => bounds.containsPoint(pose.target) && !bounds.containsPoint(focus))) pose.target.copy(focus)
    if (!pose.cockpit) {
      offset.copy(pose.position).sub(pose.target)
      avoidObstacles(pose.target, pose.position)
      // A close wall should turn the view around Joker, not push it into his head.
      if (pose.position.distanceTo(pose.target) < .22 || pose.position.distanceTo(focus) < .26) {
        best.copy(pose.position)
        let clearance = best.distanceTo(pose.target)
        for (const height of [offset.y, .10]) for (const angle of [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI]) {
          candidate.copy(offset).applyAxisAngle(new Vector3(0, 1, 0), angle); candidate.y = height; candidate.add(pose.target)
          avoidObstacles(pose.target, candidate)
          const distance = candidate.distanceTo(pose.target)
          if (distance > clearance + .04) { best.copy(candidate); clearance = distance }
          if (clearance > .32) break
        }
        pose.position.copy(best)
      }
    }
    camera.position.lerp(pose.position, blend)
    look.lerp(pose.target, blend)
    if (!pose.cockpit) avoidObstacles(look, camera.position)
    camera.near = .003
    camera.fov = MathUtils.lerp(camera.fov, pose.fov, blend)
    if (viewport && viewport.width > 0 && viewport.height > 0) {
      // Move the optical centre into the playable area above the footer.
      camera.setViewOffset(viewport.width, viewport.height, 0, (viewport.bottom - viewport.top) / 2, viewport.width, viewport.height)
    }
    camera.lookAt(look); camera.updateProjectionMatrix(); camera.updateMatrixWorld()
    return pose.cockpit
  }
  function dispose() {
    if (!saved) return
    saved.camera.near = saved.near; saved.camera.fov = saved.fov; saved.camera.view = saved.view
    saved.camera.updateProjectionMatrix()
  }
  return { update, dispose }
}
