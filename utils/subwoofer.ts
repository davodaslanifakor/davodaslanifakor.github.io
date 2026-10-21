import { isMesh } from '~/utils/threeGuards'
import { Box3, BoxGeometry, CircleGeometry, Group, LatheGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, SphereGeometry, TorusGeometry, Vector2, Vector3 } from 'three'
import type { BufferGeometry, Material, Object3D } from 'three'

export const BASS_CONTACT = 0.72
export const BASS_HITS = [0, 0.32, 0.64, 0.96] as const
export function bassPulse(time: number) {
  if (time < 0) return 0
  return Math.min(1, BASS_HITS.reduce<number>((total, hit) => total + (time >= hit ? Math.exp(-(time - hit) * 15) : 0), 0))
}

/** Permanent room detail, with session-driven motion; only owned resources are disposed. */
export function createSubwoofer(model: Object3D) {
  const cabinet = model.getObjectByName('static_subwoofer'), sourceKnob = model.getObjectByName('static_subwoofer_knob')
  if (!cabinet || !isMesh(sourceKnob)) return null
  model.updateMatrixWorld(true)
  const box = new Box3().setFromObject(cabinet), size = box.getSize(new Vector3()), center = box.getCenter(new Vector3())
  const object = new Group(); object.name = 'runtime_subwoofer_detail'
  const materials = new Set<Material>(), geometries = new Set<BufferGeometry>(), pickTargets: Mesh[] = []
  const mesh = (name: string, geometry: BufferGeometry, material: Material, parent: Object3D = object) => {
    geometries.add(geometry); materials.add(material)
    const result = new Mesh(geometry, material); result.name = `static_subwoofer_detail_${name}`; result.userData.deskAction = 'speaker'
    result.castShadow = true; result.receiveShadow = true; parent.add(result); pickTargets.push(result); return result
  }
  const matte = new MeshStandardMaterial({ color: '#202629', roughness: 0.84 })
  const rubber = new MeshStandardMaterial({ color: '#11181c', roughness: 0.75 })
  const metal = new MeshStandardMaterial({ color: '#7d898d', metalness: 0.75, roughness: 0.36 })
  const coneMaterial = new MeshStandardMaterial({ color: '#35434a', metalness: 0.22, roughness: 0.66 })
  const radius = size.x * 0.245, driver = new Group()
  driver.position.set(center.x - size.x * 0.17, center.y - size.y * 0.035, box.max.z + 0.004)
  object.add(driver)
  const baffle = mesh('baffle', new CircleGeometry(radius + 0.003, 48), matte, driver); baffle.position.z = -0.003
  mesh('rim', new TorusGeometry(radius, 0.0013, 8, 48), metal, driver)
  mesh('surround', new TorusGeometry(radius - 0.0045, 0.0032, 10, 48), rubber, driver)
  const cone = new Group(); driver.add(cone)
  const diaphragm = mesh('cone', new LatheGeometry([new Vector2(0.007, -0.002), new Vector2(radius * 0.4, -0.0018), new Vector2(radius * 0.76, 0), new Vector2(radius * 0.86, 0.001)].reverse(), 48), coneMaterial, cone)
  diaphragm.rotation.x = Math.PI / 2
  const cap = mesh('dustcap', new SphereGeometry(0.008, 24, 12), matte, cone); cap.scale.z = 0.32; cap.position.z = -0.0002
  // Four recessed fixings make the driver read as mounted hardware at close range.
  for (const angle of [45, 135, 225, 315]) {
    const screw = mesh(`screw_${angle}`, new CircleGeometry(0.0011, 10), metal, driver)
    screw.position.set(Math.cos(angle * Math.PI / 180) * (radius + 0.001), Math.sin(angle * Math.PI / 180) * (radius + 0.001), 0.0005)
  }
  const knob = new Group(), knobCenter = new Box3().setFromObject(sourceKnob).getCenter(new Vector3())
  knob.position.copy(knobCenter); object.add(knob)
  const knobCopy = sourceKnob.clone(true); knobCopy.name = 'static_subwoofer_detail_knob'; knobCopy.userData.deskAction = 'speaker'
  knobCopy.position.set(0, 0, 0); knobCopy.rotation.set(0, 0, 0); knobCopy.scale.setScalar(1); knobCopy.applyMatrix4(sourceKnob.matrixWorld)
  object.add(knobCopy); object.updateMatrixWorld(true); knob.attach(knobCopy); pickTargets.push(knobCopy)
  const mark = mesh('knob_mark', new BoxGeometry(0.0014, 0.0048, 0.0008), new MeshBasicMaterial({ color: '#e1edf0' }), knob)
  mark.position.set(0, 0.0063, 0.005)
  const ringMaterial = new MeshBasicMaterial({ color: '#90ccee', transparent: true, opacity: 0.55, toneMapped: false })
  const ring = mesh('light_ring', new TorusGeometry(0.0132, 0.00085, 6, 48), ringMaterial)
  ring.position.copy(knobCenter); ring.position.z = box.max.z + 0.002
  const waves = [0, 1, 2].map(i => {
    const material = new MeshBasicMaterial({ color: '#98d5ed', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
    const wave = mesh(`wave_${i}`, new RingGeometry(radius, radius + 0.0008, 48), material)
    wave.position.copy(driver.position); wave.visible = false; wave.castShadow = false; wave.receiveShadow = false; wave.raycast = () => {}
    // Transient visual waves must never become invisible click blockers.
    pickTargets.splice(pickTargets.indexOf(wave), 1)
    return wave
  })
  const hidden = [sourceKnob, model.getObjectByName('static_subwoofer_ring')].filter((part): part is Object3D => Boolean(part)).map(part => ({ part, visible: part.visible }))
  hidden.forEach(({ part }) => { part.visible = false })
  model.add(object); model.updateMatrixWorld(true)
  function update(time = -1, actionTime: number | null = null, reduced = false, music = 0) {
    const pulse = Math.max(bassPulse(time), Math.max(0, Math.min(1, music)))
    cone.position.z = reduced ? 0 : time >= 0 ? Math.sin(time * 75) * pulse * 0.0018 : Math.max(0, music) * 0.0012
    ringMaterial.opacity = reduced ? time >= 0 ? 1 : 0.55 : 0.55 + pulse * 0.45
    ringMaterial.color.set(time >= 0 ? '#b8e9fa' : '#90ccee')
    knob.rotation.z = actionTime === null || reduced ? 0 : -Math.sin(Math.min(1, actionTime / 2.8) * Math.PI) * 0.8
    waves.forEach((wave, index) => {
      const age = time - index * 0.18
      wave.visible = !reduced && age >= 0 && age < 0.95
      if (!wave.visible) return
      wave.scale.setScalar(1 + age * 0.85); wave.position.z = driver.position.z + 0.01 + age * 0.04
      ;(wave.material as MeshBasicMaterial).opacity = (1 - age / 0.95) * 0.2
    })
    object.updateMatrixWorld(true)
  }
  update()
  return { object, cone, driver, knob, ring, waves, pickTargets, update,
    dispose() { hidden.forEach(({ part, visible }) => { part.visible = visible }); object.removeFromParent(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) },
  }
}
