import { DataTexture, LinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry, RGBAFormat, Vector3 } from 'three'
import type { Object3D } from 'three'
import { jokerSurfaces } from './jokerAdventure'
import type { JokerObstacle, JokerState } from './jokerAdventure'

/** Small physical reactions and a cheap contact shadow, without an extra render pass. */
export function createJokerVehicleMotion(root: Object3D, parent: Object3D, obstacles: readonly JokerObstacle[]) {
  const body = root.getObjectByName('JA_CarBody')
  const actor = root.getObjectByName('JA_Joker')!
  const restY = body?.position.y ?? 0
  const pixels = new Uint8Array(64 * 64 * 4)
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const radius = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5)
    pixels[(y * 64 + x) * 4 + 3] = Math.round(Math.max(0, 1 - radius) ** 1.6 * 170)
  }
  const texture = new DataTexture(pixels, 64, 64, RGBAFormat)
  texture.minFilter = LinearFilter; texture.magFilter = LinearFilter; texture.needsUpdate = true
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })
  const shadow = new Mesh(new PlaneGeometry(.19, .29), material)
  shadow.name = 'JA_CarContactShadow'; shadow.rotation.x = -Math.PI / 2; parent.add(shadow)
  const up = new Vector3(0, 1, 0), offset = new Vector3(), seat = new Vector3(0, .025, -.020)
  let previous: JokerState | null = null, compression = 0, springVelocity = 0, pitch = 0, roll = 0
  function update(s: JokerState, dt: number, reduced: boolean) {
    const car = s.inCar ? s.position : s.carPosition
    const support = [...jokerSurfaces(s), ...obstacles.map(o => ({ x0: o.min.x, x1: o.max.x, z0: o.min.z, z1: o.max.z, y: o.max.y }))]
      .filter(f => car.x >= f.x0 && car.x <= f.x1 && car.z >= f.z0 && car.z <= f.z1 && f.y <= car.y + .012)
      .sort((a, b) => b.y - a.y)[0]
    const height = support ? Math.max(0, car.y - support.y) : 1
    shadow.visible = !!support && !['intro', 'grappling', 'lifting', 'crashing'].includes(s.phase)
    shadow.position.set(car.x, (support?.y ?? 0) + .0015, car.z)
    shadow.rotation.z = -(s.inCar ? s.yaw : s.carYaw)
    shadow.scale.setScalar(1 + Math.min(.8, height))
    material.opacity = Math.max(.06, .8 / (1 + height * 8))
    if (!body) return
    const moving = s.inCar && s.phase === 'driving'
    if (moving && !reduced && !s.paused && dt > 0) {
      if (s.grounded && previous && !previous.grounded) springVelocity = -Math.min(.07, Math.abs(previous.vertical) * .06)
      // Bounded substeps keep the suspension stable after a slow frame.
      const steps = Math.max(1, Math.ceil(dt * 120)), h = dt / steps
      for (let i = 0; i < steps; i++) {
        springVelocity += (-compression * 200 - springVelocity * 16) * h
        compression += springVelocity * h
      }
      compression = Math.max(-.0045, Math.min(.0025, compression))
      const acceleration = previous ? (s.speed - previous.speed) / Math.max(dt, .008) : 0
      const targetPitch = s.grounded ? Math.max(-.045, Math.min(.045, -acceleration * .028)) : Math.max(-.1, Math.min(.1, s.vertical * .085))
      const blend = 1 - Math.exp(-dt * 12)
      pitch += (targetPitch - pitch) * blend
      roll += (-s.steering * Math.min(.065, Math.abs(s.speed) * .12) - roll) * blend
    } else if (!moving || reduced) { compression = 0; springVelocity = 0; pitch = 0; roll = 0 }
    body.position.y = restY + compression
    if (moving) {
      body.rotation.set(pitch, 0, roll)
      // Keep the seated figure connected to the moving chassis.
      offset.copy(seat).applyEuler(body.rotation).sub(seat).applyAxisAngle(up, s.yaw)
      actor.position.add(offset); actor.position.y += compression
      actor.rotation.x = pitch; actor.rotation.z = roll
    }
    previous = s
  }
  return { update }
}
