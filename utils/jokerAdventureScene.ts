import { AnimationClip, AnimationMixer, Box3, BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, LineSegments, Mesh, MeshStandardMaterial, PointLight, RingGeometry, MeshBasicMaterial, DoubleSide, Vector3 } from 'three'
import type { Object3D, PerspectiveCamera, Texture } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { JOKER_SPAWN, jokerFrame, jokerTransition, jokerObjective } from './jokerAdventure'
import type { JokerObstacle, JokerState } from './jokerAdventure'
import { createJokerCamera } from './jokerAdventureCamera'
import type { JokerViewport } from './jokerAdventureCamera'
import { createJokerInteractionRig } from './jokerInteractionRig'
import { createJokerVehicleEffects } from './jokerVehicleEffects'
import { createJokerVehicleMotion } from './jokerVehicleMotion'

export function jokerAdventureFocus(aspect: number) {
  const target = new Vector3(JOKER_SPAWN.x, JOKER_SPAWN.y + .045, JOKER_SPAWN.z)
  const distance = Math.max(.55, .40 / Math.max(.3, aspect))
  return { name: 'cam_joker_game' as const, target, position: target.clone().add(new Vector3(0, distance * .7, distance)) }
}

export function disposeJokerAsset(root: Object3D) {
  const textures = new Set<Texture>()
  root.traverse(node => {
    if (!(node instanceof Mesh) && !(node instanceof LineSegments)) return
    node.geometry.dispose()
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      for (const value of Object.values(material)) if (value && typeof value === 'object' && 'isTexture' in value) textures.add(value as Texture)
      material.dispose()
    }
  })
  textures.forEach(texture => texture.dispose())
}
export function measureJokerObstacles(room: Object3D): JokerObstacle[] {
  // Keep the laptop deck separate from its upright display so toys can jump onto it.
  const laptop = room.getObjectByName('static_laptop_keyboard')
    ? ['int_monitor', 'int_monitor__2', 'static_laptop_keyboard', 'static_laptop_trackpad', 'static_laptop_bezel'] : ['root_laptop']
  const structure: string[] = []
  room.traverse(node => { if (/^(static_(wall$|wall_right$|desk_top$|desk_leg_|style_library_post_|style_shelf_\d$|style_storage_bin_1$))/.test(node.name)) structure.push(node.name) })
  return [...laptop, ...structure, 'static_style_rug', 'root_speaker_l', 'root_speaker_r', 'static_subwoofer', 'root_elephant', 'root_mouse', 'static_hub', 'static_style_monitor_base', 'static_style_monitor_stem', 'static_style_ultrawide_housing', 'root_screen_left', 'root_screen_right', 'root_clock', 'root_paratrooper', 'root_cards', 'root_robot'].flatMap(name => {
    const node = room.getObjectByName(name)
    if (!node) return []
    const box = new Box3().setFromObject(node)
    // The authored rear wall is a plane; give it thickness for contact/camera rays.
    if (name === 'static_wall') box.expandByScalar(.008)
    return box.isEmpty() ? [] : [{ min: { x: box.min.x, y: box.min.y, z: box.min.z }, max: { x: box.max.x, y: box.max.y, z: box.max.z }, ...(name === 'static_style_rug' ? { surface: 'floor' as const } : {}) }]
  })
}
export function createJokerScene(asset: GLTF, room: Object3D) {
  const root = asset.scene, group = new Group()
  // The component can mount while the entry camera still gates update().
  // Never render authored damage or unscaled effects before their first pose.
  group.visible = false
  group.add(root)
  const light = new PointLight('#fff1dc', .8, 3, 2)
  group.add(light)
  // A small landing ledge connects the book latch to the garage entrance.
  const ledge = new Mesh(new BoxGeometry(.16, .012, .13), new MeshStandardMaterial({ color: '#372b44', roughness: .8 }))
  ledge.position.set(1.22, .05, .165); group.add(ledge)
  // A shallow apron joins the garage/lift base to the actual room floor.
  const apronGeometry = new BufferGeometry()
  apronGeometry.setAttribute('position', new Float32BufferAttribute([
    -.115, 1, 0, .115, 0, .24, .115, 1, 0, -.115, 1, 0, -.115, 0, .24, .115, 0, .24,
    -.115, 1, 0, -.115, 0, 0, -.115, 0, .24, .115, 1, 0, .115, 0, .24, .115, 0, 0,
  ], 3)); apronGeometry.computeVertexNormals()
  const apron = new Mesh(apronGeometry, new MeshStandardMaterial({ color: '#302c39', roughness: .75 }))
  apron.name = 'JA_FloorApron'; apron.position.set(1.345, .001, .36); apron.scale.y = .056; group.add(apron)
  const mixer = new AnimationMixer(root)
  const clip = new AnimationClip('adventure', -1, asset.animations.flatMap(animation => animation.tracks))
  mixer.clipAction(clip).play()
  const actor = root.getObjectByName('JA_Joker')!, car = root.getObjectByName('JA_Car')!
  if (!actor || !car) { disposeJokerAsset(group); throw new Error('Missing adventure rig') }
  const hidden: { node: Object3D; visible: boolean }[] = []
  for (const name of ['root_bugjar', 'root_phone', 'static_phone_stand', 'static_phone_stand_back', 'static_phone_stand_lip', 'static_style_storage_bin_0', 'static_style_bin_handle_0']) {
    const node = room.getObjectByName(name)
    if (node) hidden.push({ node, visible: node.visible })
  }
  mixer.setTime(1 / 24)
  const phoneNodes = new Set<Object3D>()
  for (const name of ['JA_PhoneStandImpact', 'JA_PhoneSupportBreak', 'root_phone']) root.getObjectByName(name)?.traverse(node => phoneNodes.add(node))
  const damage: Object3D[] = [], limbs: { node: Object3D; angle: number; side: number }[] = []
  root.traverse(node => {
    if (/^JA_(PhoneCrack|PhoneDeadColumn|ScreenCornerChip|PhoneShard)/.test(node.name)) damage.push(node)
    if (/^JA_Joker_hip_[lr]$/.test(node.name) || (node.name.startsWith('JA_Joker_shoulder_') && !(node instanceof Mesh))) limbs.push({ node, angle: node.name.includes('_hip_') ? Math.PI / 2 : 0, side: node.name.includes('_l') ? 1 : -1 })
    if (node instanceof Mesh) { node.castShadow = true; node.receiveShadow = true }
  })
  damage.forEach(node => phoneNodes.add(node))
  const snapshotPhone = () => [...phoneNodes].map(node => ({ node, p: node.position.clone(), q: node.quaternion.clone(), s: node.scale.clone() }))
  const phoneRest = snapshotPhone()
  mixer.setTime(Math.min(815 / 24, clip.duration - .0001))
  const phoneBroken = snapshotPhone()
  mixer.setTime(1 / 24)
  const wheelSpins: Object3D[] = [], wheelSteering: Object3D[] = []
  const carBody = root.getObjectByName('JA_CarBody')
  const interactionRig = createJokerInteractionRig(root)
  const effects = createJokerVehicleEffects(root)
  const motion = createJokerVehicleMotion(root, group, measureJokerObstacles(room))
  root.traverse(node => { if (node.name.startsWith('JA_WheelSpin_')) wheelSpins.push(node); if (node.name.startsWith('JA_WheelSteer_') && node.name.endsWith('_-1')) wheelSteering.push(node) })
  const cable = root.getObjectByName('JA_GrappleCable'), umbrella = root.getObjectByName('JA_Umbrella')
  const target = new Vector3(), offset = new Vector3(), up = new Vector3(0, 1, 0)
  const cameraRig = createJokerCamera(measureJokerObstacles(room).map(o => new Box3(new Vector3(o.min.x, o.min.y, o.min.z), new Vector3(o.max.x, o.max.y, o.max.z))))
  const beacon = new Mesh(new RingGeometry(.027, .032, 40), new MeshBasicMaterial({ color: '#d0e69f', side: DoubleSide, transparent: true, opacity: .85, depthWrite: false, toneMapped: false }))
  beacon.rotation.x = -Math.PI / 2; group.add(beacon)
  let last = 0, sampledFrame = -1
  function update(s: JokerState, camera: PerspectiveCamera, time: number, reduced: boolean, viewport?: JokerViewport) {
    const dt = last ? Math.min(.05, (time - last) / 1000) : .05
    last = time
    actor.visible = true
    const frame = jokerFrame(s), crashed = s.phase === 'crashing' || s.phase === 'finished'
    const sampleFrame = s.phase === 'opening' ? 198 : s.phase === 'entering' ? 248 : s.phase === 'lifting' || s.phase === 'lowering' ? 340 : frame
    if (sampleFrame !== sampledFrame) { mixer.setTime(Math.min(sampleFrame / 24, clip.duration - .0001)); sampledFrame = sampleFrame }
    if (!crashed) for (const rest of s.damage ? phoneBroken : phoneRest) { rest.node.position.copy(rest.p); rest.node.quaternion.copy(rest.q); rest.node.scale.copy(rest.s) }
    damage.forEach(node => { node.visible = s.damage || (crashed && frame >= 692) })
    if (cable) cable.visible = s.phase === 'grappling' && frame >= 112 && frame <= 146
    if (umbrella) umbrella.visible = s.phase === 'grappling' && frame >= 159 && frame <= 190
    const free = !jokerTransition(s.phase) && s.phase !== 'finished'
    if (carBody && !(free && s.inCar)) carBody.rotation.set(0, 0, 0)
    if (free || crashed || s.phase === 'lowering') {
      const p = crashed && s.crashOrigin ? s.crashOrigin : s.inCar ? s.position : s.carPosition
      const yaw = crashed ? s.crashYaw : s.inCar ? s.yaw : s.carYaw
      car.position.set(p.x, p.y, p.z); car.rotation.set(0, yaw, 0)
      if (crashed) {
        const settle = Math.min(1, s.phase === 'finished' ? 1 : s.time * 3)
        car.position.add(offset.set(0, 0, -.025 * settle).applyAxisAngle(up, yaw))
        car.position.y += (.754 - car.position.y) * settle
      }
      if (s.inCar || crashed) {
        actor.position.copy(car.position).add(offset.set(0, .025, -.020).applyAxisAngle(up, yaw)); actor.rotation.set(0, yaw, 0)
      } else {
        actor.position.set(s.position.x, s.position.y, s.position.z); actor.rotation.set(0, s.yaw, 0)
        limbs.forEach(({ node, angle, side }) => { node.rotation.set(angle + (reduced ? 0 : Math.sin(s.travelled * 90) * .45 * side * Math.min(1, s.speed / .22)), 0, 0) })
      }
    }
    if (free && s.inCar) {
      wheelSpins.forEach(wheel => { wheel.rotation.x = -s.wheelTravel / .017 })
      wheelSteering.forEach(wheel => { wheel.rotation.y = s.steering * .38 })
    }
    // Blend an authored interaction from the actual approach position, avoiding a teleport on E.
    if (s.transitionFrom && jokerTransition(s.phase) && !['crashing', 'opening', 'entering', 'lifting', 'lowering'].includes(s.phase)) {
      const blend = Math.min(1, s.time / .38)
      const moving = s.phase === 'lifting' ? car : actor
      moving.position.lerp(new Vector3(s.transitionFrom.x, s.transitionFrom.y, s.transitionFrom.z), 1 - blend)
    }
    interactionRig.update(s, reduced)
    motion.update(s, s.paused ? 0 : dt, reduced)
    apron.scale.y = s.lifted ? .0275 : .056
    effects.update(s, s.paused ? 0 : dt, reduced)
    const objective = jokerObjective(s)
    beacon.visible = !jokerTransition(s.phase) && s.phase !== 'finished' && (!(s.freePlay && s.inCar) || ['recall', 'lift', 'ramp'].includes(objective.id))
    beacon.position.set(objective.point.x, objective.point.y + .004, objective.point.z)
    root.updateMatrixWorld(true)
    const subject = s.inCar ? car : actor
    subject.getWorldPosition(target)
    light.position.copy(target).add(offset.set(.1, .45, .20))
    const inCockpit = cameraRig.update(s, actor.position, car.position, camera, dt, reduced, viewport)
    // The eye camera sits inside the rigid head mesh; hide the owned avatar only in first person.
    actor.visible = !inCockpit
    if (!group.visible) {
      hidden.forEach(({ node }) => { node.visible = false })
      group.visible = true
    }
  }

  function dispose() {
    hidden.forEach(({ node, visible }) => { node.visible = visible })
    cameraRig.dispose()
    mixer.stopAllAction(); mixer.uncacheRoot(root); disposeJokerAsset(group)
  }
  return { group, update, dispose }
}
