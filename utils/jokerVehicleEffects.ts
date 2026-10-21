import { AdditiveBlending, BufferGeometry, ConeGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, PointLight, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { JokerState } from './jokerAdventure'

/** Owned effects attach to the authored exhausts and umbrella; no frame-time asset work. */
export function createJokerVehicleEffects(root: Object3D) {
  const car = root.getObjectByName('JA_Car')!, body = root.getObjectByName('JA_CarBody') ?? car
  const nitro = new Group(); nitro.name = 'JA_Nitro'; body.add(nitro)
  const geometry = new ConeGeometry(1, 1, 9)
  const hot = new MeshBasicMaterial({ color: '#e8faff', transparent: true, opacity: .95, depthWrite: false, toneMapped: false, blending: AdditiveBlending })
  const outer = new MeshBasicMaterial({ color: '#ff8029', transparent: true, opacity: .8, depthWrite: false, toneMapped: false, blending: AdditiveBlending })
  const blue = new MeshBasicMaterial({ color: '#9c6dff', transparent: true, opacity: .8, depthWrite: false, toneMapped: false, blending: AdditiveBlending })
  const flames = [-1, 1].map(side => {
    const jet = new Group(); jet.position.set(side * .023, .025, -.089); nitro.add(jet)
    return [outer, blue, hot].map((material, layer) => {
      const mesh = new Mesh(geometry, material); mesh.rotation.x = -Math.PI / 2; jet.add(mesh)
      return { mesh, layer, side }
    })
  }).flat()
  // Keep the light in the render list even at zero intensity. Toggling its parent
  // would change every lit material's shader variant on the first boost.
  const glow = new PointLight('#ffac66', 0, .35, 2); glow.position.set(0, .055, -.105); body.add(glow)
  const umbrella = root.getObjectByName('JA_Umbrella')
  const rest = umbrella ? { p: umbrella.position.clone(), q: umbrella.quaternion.clone(), s: umbrella.scale.clone() } : null
  const ropes = new LineSegments(new BufferGeometry().setFromPoints([
    new Vector3(-.034, .050, -.042), new Vector3(-.10, .190, -.04),
    new Vector3(.034, .050, -.042), new Vector3(.10, .190, -.04),
  ]), new LineBasicMaterial({ color: '#c1cda8' }))
  ropes.name = 'JA_UmbrellaTethers'; car.add(ropes)
  let power = 0
  function update(s: JokerState, dt: number, reduced: boolean) {
    const active = s.inCar && s.phase === 'driving' && s.boosting && !s.gliding
    power += ((active ? 1 : 0) - power) * (1 - Math.exp(-Math.max(0, dt) * (active ? 18 : 28)))
    nitro.visible = power > .015
    glow.intensity = reduced ? 0 : power * .09
    for (const { mesh, side, layer } of flames) {
      const pulse = reduced ? 1 : 1 + .12 * Math.sin(s.time * 39 + side * 2 + layer)
      const length = (.066 - layer * .018) * power * pulse * (.75 + Math.abs(s.speed) / .78 * .5)
      mesh.scale.set(.009 - layer * .0023, length, .009 - layer * .0023)
      mesh.position.z = -length / 2
    }
    ropes.visible = s.canopy > .6 && s.inCar
    if (!umbrella || !rest || s.phase === 'grappling') return
    if (s.canopy > .005 && s.inCar) {
      umbrella.visible = true
      umbrella.position.set(0, .19, .02); umbrella.rotation.set(0, 0, 0)
      umbrella.scale.set(2.9 * s.canopy, 2.9 * (.3 + .7 * s.canopy), 2.9 * s.canopy)
    } else {
      umbrella.visible = false
      umbrella.position.copy(rest.p); umbrella.quaternion.copy(rest.q); umbrella.scale.copy(rest.s)
    }
  }
  return { update }
}
