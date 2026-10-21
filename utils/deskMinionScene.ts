import { isMesh } from '~/utils/threeGuards'
import { BoxGeometry, CatmullRomCurve3, CircleGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PointLight, RingGeometry, TubeGeometry, Vector3 } from 'three'
import type { BufferGeometry, Material, Object3D } from 'three'
import { deskHeightAt, worldWithMouse } from './deskPlayground'
import type { DeskWorld, MinionId } from './deskPlayground'
import type { DeskMinionState } from '../composables/useDeskMinion'
import type { Locale } from '../content/portfolio'
import { createMinionRig, poseCurve } from './minionRig'
import { createDeskMischiefProps } from './deskMischiefProps'

/** Runtime-only transforms and effects. Source geometry, materials and authored poses stay intact. */
export function createDeskMinion(model: Object3D, character: MinionId, world: DeskWorld) {
  const object = new Group(); object.name = 'desk_minion_playground'
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>()
  const mesh = (geometry: BufferGeometry, material: Material) => {
    geometries.add(geometry); materials.add(material)
    const result = new Mesh(geometry, material); result.castShadow = true; result.receiveShadow = true
    return result
  }
  const source = model.getObjectByName(`root_${character}`), originalVisible = source?.visible ?? true
  const rig = createMinionRig(source ?? new Group(), character), actor = rig.actor
  object.add(actor)
  if (source) source.visible = false
  const props = createDeskMischiefProps(model, character)
  object.add(props.object)

  const shadowMaterial = new MeshBasicMaterial({ color: '#12180c', opacity: 0.25, transparent: true, depthWrite: false })
  const shadow = mesh(new CircleGeometry(0.026, 32), shadowMaterial)
  shadow.rotation.x = -Math.PI / 2; object.add(shadow)
  const destination = mesh(new RingGeometry(0.014, 0.017, 32), new MeshBasicMaterial({ color: '#f8d460', transparent: true, opacity: 0.75, depthWrite: false }))
  destination.rotation.x = -Math.PI / 2; destination.visible = false; object.add(destination)
  const fill = new PointLight('#fff1cc', 0.055, 0.6, 2); actor.add(fill); fill.position.set(-0.08, 0.18, 0.15)

  const socket = mesh(new BoxGeometry(0.041, 0.018, 0.035), new MeshStandardMaterial({ color: '#303936', roughness: 0.55, metalness: 0.25 }))
  socket.position.set(world.socket.x, world.socket.y, world.socket.z); socket.userData.deskAction = 'cable'; object.add(socket)
  const aperture = mesh(new BoxGeometry(0.019, 0.009, 0.001), new MeshBasicMaterial({ color: '#050907' }))
  aperture.position.copy(socket.position).add(new Vector3(0, 0, 0.018)); object.add(aperture)
  const ledMaterial = new MeshBasicMaterial({ color: '#b9e68b' })
  const led = mesh(new BoxGeometry(0.007, 0.001, 0.003), ledMaterial)
  led.position.copy(socket.position).add(new Vector3(0.01, 0.0095, -0.006)); object.add(led)
  const plug = new Group(); plug.name = 'minion_monitor_plug'; object.add(plug)
  const grip = mesh(new BoxGeometry(0.023, 0.012, 0.028), new MeshStandardMaterial({ color: '#171f1b', roughness: 0.7 }))
  grip.userData.deskAction = 'cable'; plug.add(grip)
  const pin = mesh(new BoxGeometry(0.013, 0.006, 0.013), new MeshStandardMaterial({ color: '#a2aaa3', metalness: 0.8, roughness: 0.35 }))
  pin.position.z = -0.018; pin.userData.deskAction = 'cable'; plug.add(pin)
  for (const z of [-0.006, 0, 0.006]) {
    const ridge = mesh(new BoxGeometry(0.025, 0.014, 0.0015), grip.material)
    ridge.position.z = z; plug.add(ridge)
  }
  const cableMaterial = new MeshStandardMaterial({ color: '#172019', roughness: 0.85 })
  materials.add(cableMaterial)
  const cable = new Mesh(new TubeGeometry(), cableMaterial); object.add(cable)
  let lastCablePosition = -1
  function updateCable(pull: number) {
    plug.position.set(world.socket.x, world.socket.y, world.socket.z + 0.037 + pull * 0.042)
    if (Math.abs(lastCablePosition - pull) < 0.001) return
    lastCablePosition = pull
    const a = world.monitorAnchor, end = plug.position.clone().add(new Vector3(0, -0.004, 0.019))
    const points = [new Vector3(a.x, a.y, a.z), new Vector3(a.x + 0.13, a.y, a.z + 0.035), new Vector3(world.socket.x + 0.095, a.y, a.z + 0.04), new Vector3(world.socket.x + 0.1, a.y, world.socket.z + 0.125), new Vector3(world.socket.x + 0.045, a.y, world.socket.z + 0.145), end]
    cable.geometry.dispose(); cable.geometry = new TubeGeometry(new CatmullRomCurve3(points), 40, 0.0028, 6, false)
  }
  updateCable(0)
  const off = new MeshBasicMaterial({ color: '#030706' }); materials.add(off)
  const screens = new Map<Mesh, { original: Material | Material[]; laptop: boolean }>()
  for (const name of ['int_monitor_screen', 'int_screen_left', 'int_screen_right']) {
    const screen = model.getObjectByName(name)
    if (isMesh(screen)) screens.set(screen, { original: screen.material, laptop: name === 'int_monitor_screen' })
  }
  const sensor = model.getObjectByName('static_mac_touch_id_sensor.001')
  const sensorTarget = isMesh(sensor) ? sensor : null
  const previousAction = sensorTarget?.userData.deskAction
  if (sensorTarget) sensorTarget.userData.deskAction = 'laptop'
  let pull = 0
  function update(state: DeskMinionState, reduced: boolean, delta: number, locale: Locale = 'en') {
    const body = state.body, frozen = state.phase === 'paused'
    const targetPull = state.monitorConnected ? 0 : 1
    if (!frozen) {
      pull = reduced ? targetPull : pull + (targetPull - pull) * (1 - Math.exp(-delta * 18))
      const strain = !reduced && state.action === 'cable' && state.actionTime < 1.45
        ? poseCurve(state.actionTime, [[0, 0], [0.5, 0.08], [0.7, 0], [0.95, 0.12], [1.15, 0], [1.44, 0.15]]) : 0
      updateCable(pull + (state.monitorConnected ? strain : -strain))
    }
    props.update(state, reduced, delta, locale)
    const hands: Vector3[] = []
    if (state.action === 'laptop' && sensorTarget) {
      hands.push(sensorTarget.getWorldPosition(new Vector3()).add(new Vector3(0, 0.004, 0)))
    } else if (state.action === 'speaker' && world.speakerKnob && state.actionTime < 0.85) {
      const knob = world.speakerKnob
      hands.push(new Vector3(knob.x - 0.008, knob.y, knob.z + 0.005), new Vector3(knob.x + 0.008, knob.y, knob.z + 0.005))
    } else if (state.action === 'cable') {
      hands.push(plug.position.clone().add(new Vector3(-0.012, 0.006, 0)), plug.position.clone().add(new Vector3(0.012, 0.006, 0)))
    } else if ((state.action === 'keyboard' || state.action === 'erase') && state.actionTime < 1.8) {
      const key = world.keys[state.pressedKey] ?? world.keyboard
      if (key) hands.push(new Vector3(key.x, key.y + 0.003, key.z))
    } else if (state.action === 'mouse' && state.actionTime < 1.3 && world.mouseBounds) {
      const box = world.mouseBounds
      for (const z of [-0.017, 0.017]) hands.push(new Vector3(box.min.x + state.mouseOffset, box.max.y - 0.002, body.position.z + z))
    } else if (state.phase === 'climbing' && state.climbTo) {
      const to = state.climbTo, side = new Vector3(Math.cos(body.heading), 0, -Math.sin(body.heading)).multiplyScalar(0.016)
      hands.push(new Vector3(to.x, to.y + 0.002, to.z).add(side), new Vector3(to.x, to.y + 0.002, to.z).sub(side))
    }
    rig.update(state, reduced, delta, hands)
    const floor = deskHeightAt(worldWithMouse(world, state.mouseOffset), body.position.x, body.position.z, body.position.y + 0.002).height
    shadow.position.set(body.position.x, floor + 0.0008, body.position.z)
    const height = Math.max(0, body.position.y - floor)
    shadow.scale.setScalar(1 + height * 3); shadowMaterial.opacity = 0.25 / (1 + height * 8)
    destination.visible = Boolean(state.destination || state.keyHop)
    const marker = state.keyHop?.to ?? state.destination
    if (marker) destination.position.set(marker.x, marker.y + 0.001, marker.z)
    ledMaterial.color.set(state.monitorConnected ? '#b9e68b' : '#354235')
    screens.forEach(({ original, laptop }, screen) => {
      screen.material = !(laptop ? state.laptopOn : state.monitorConnected) ? off
        : laptop && (state.typing || state.keystrokes > 0) ? props.laptopMaterial() ?? original : original
    })
    object.updateMatrixWorld(true)
  }
  return {
    object, actor, plug, rig, props, pickTargets: [...world.pickTargets.filter(mesh => mesh.name !== 'static_laptop_keycaps' && mesh.name !== 'static_mouse'), ...props.pickTargets, socket, grip, pin, ...(sensorTarget ? [sensorTarget] : [])], update,
    dispose() {
      screens.forEach(({ original }, screen) => { screen.material = original })
      if (sensorTarget) {
        if (previousAction === undefined) delete sensorTarget.userData.deskAction
        else sensorTarget.userData.deskAction = previousAction
      }
      rig.dispose(); props.dispose()
      if (source) source.visible = originalVisible
      cable.geometry.dispose(); geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose())
      object.removeFromParent()
    },
  }
}
