import { isMesh } from '~/utils/threeGuards'
import { Box3, CanvasTexture, Group, Mesh, MeshBasicMaterial, SRGBColorSpace, Vector3 } from 'three'
import type { BufferGeometry, Material, Object3D } from 'three'
import type { DeskMinionState } from '../composables/useDeskMinion'
import { deskMischiefCopy, localize } from '../content/portfolio'
import type { Locale } from '../content/portfolio'
import { keyGeometry, keyboardParts } from './deskKeyboard'
import { createMinionRig } from './minionRig'
import { BODY_HEIGHT, MINION_IDS } from './deskPlayground'
import type { MinionId } from './deskPlayground'

/** Session-owned prop copies and character reactions; dispose restores every source visibility. */
export function createDeskMischiefProps(model: Object3D, active: MinionId) {
  const object = new Group(), originals = new Map<Object3D, boolean>(), geometries: BufferGeometry[] = []
  const hide = (source: Object3D) => { originals.set(source, source.visible); source.visible = false }
  const pickTargets: Mesh[] = [], keys: Mesh[] = []
  const sourceKeys = model.getObjectByName('static_laptop_keycaps')
  if (isMesh(sourceKeys)) {
    const group = new Group(); group.applyMatrix4(sourceKeys.matrixWorld); object.add(group)
    keyboardParts(sourceKeys).forEach((part, index) => {
      const geometry = keyGeometry(sourceKeys.geometry, part), key = new Mesh(geometry, sourceKeys.material)
      geometries.push(geometry); key.name = `minion_key_${index}`; key.userData.deskAction = 'keyboard'; key.castShadow = true; key.receiveShadow = true
      group.add(key); keys.push(key); pickTargets.push(key)
    })
    hide(sourceKeys)
  }
  const sourceMouse = model.getObjectByName('root_mouse'), mouse = sourceMouse?.clone(true) ?? new Group()
  if (sourceMouse) {
    mouse.position.set(0, 0, 0); mouse.rotation.set(0, 0, 0); mouse.scale.setScalar(1); mouse.applyMatrix4(sourceMouse.matrixWorld); mouse.visible = true; hide(sourceMouse)
    mouse.traverse(child => { if (isMesh(child)) { child.userData.deskAction = 'mouse'; pickTargets.push(child) } })
  }
  const mouseRest = mouse.position.clone(); object.add(mouse)
  const watchers = MINION_IDS.filter(id => id !== active).flatMap(id => {
    const source = model.getObjectByName(`root_${id}`)
    if (!source) return []
    const bounds = new Box3().setFromObject(source), position = source.getWorldPosition(new Vector3())
    // Sign height is excluded when matching the original figure's size.
    const main = source.getObjectByName(`int_${id}`), mainBounds = main ? new Box3().setFromObject(main) : bounds
    const rig = createMinionRig(source, id)
    const sourceHeight = id === 'cards' ? mainBounds.max.y - bounds.min.y : bounds.max.y - bounds.min.y
    rig.actor.scale.setScalar(sourceHeight / BODY_HEIGHT)
    position.y = bounds.min.y
    const heading = source.rotation.y
    object.add(rig.actor); hide(source)
    return [{ rig, position, heading }]
  })
  const sourceJoker = model.getObjectByName('root_bugjar'), joker = sourceJoker?.clone(true) ?? new Group(), head = new Group()
  if (sourceJoker) {
    joker.position.set(0, 0, 0); joker.rotation.set(0, 0, 0); joker.scale.setScalar(1); joker.applyMatrix4(sourceJoker.matrixWorld); joker.visible = true; object.add(joker); hide(sourceJoker)
    object.updateMatrixWorld(true)
    const headMesh = joker.getObjectByName('static_bugjar_head'), parts: Object3D[] = []
    joker.traverse(child => { if (/static_bugjar_(head|hair)/.test(child.name)) parts.push(child) })
    if (headMesh) {
      const box = new Box3().setFromObject(headMesh), center = box.getCenter(new Vector3()); center.y = box.min.y
      head.position.copy(joker.worldToLocal(center)); joker.add(head); object.updateMatrixWorld(true)
      parts.forEach(part => head.attach(part))
    }
  }
  let context: CanvasRenderingContext2D | null = null, texture: CanvasTexture | null = null, screenMaterial: Material | null = null
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 640; context = canvas.getContext('2d')
    if (context) { texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.flipY = false; screenMaterial = new MeshBasicMaterial({ map: texture, toneMapped: false }) }
  }
  let lastScreen = '', lastPressed = -1
  function update(s: DeskMinionState, reduced: boolean, delta: number, locale: Locale = 'en') {
    mouse.position.copy(mouseRest); mouse.position.x += s.mouseOffset
    if (lastPressed !== s.pressedKey && lastPressed >= 0 && keys[lastPressed]) keys[lastPressed]!.position.y = 0
    if (keys[s.pressedKey]) keys[s.pressedKey]!.position.y = s.keyPulse < 0.18 ? -Math.sin(s.keyPulse / 0.18 * Math.PI) * 0.0014 : 0
    lastPressed = s.pressedKey
    const screenKey = `${s.typedText}:${locale}`
    if (screenKey !== lastScreen && context && texture) {
      lastScreen = screenKey
      context.fillStyle = '#f5eed8'; context.fillRect(0, 0, 1024, 640)
      context.fillStyle = '#24382b'; context.fillRect(0, 0, 1024, 78)
      context.textAlign = locale === 'fa' ? 'right' : 'left'; context.direction = locale === 'fa' ? 'rtl' : 'ltr'
      context.font = '24px monospace'; context.fillStyle = '#d9e3ca'; context.fillText(localize(deskMischiefCopy.scratchpad, locale), locale === 'fa' ? 970 : 54, 49)
      context.fillStyle = '#527454'; context.font = '27px sans-serif'; context.fillText(localize(deskMischiefCopy.screenHeading, locale), locale === 'fa' ? 970 : 54, 159)
      context.fillStyle = '#213b27'; context.font = 'bold 42px monospace'
      const lines = s.typedText.split('\n').flatMap(line => line ? Array.from({ length: Math.ceil(Array.from(line).length / 28) }, (_, i) => Array.from(line).slice(i * 28, (i + 1) * 28).join('')) : [''])
      lines.slice(-6).forEach((line, index) => context!.fillText(line, locale === 'fa' ? 970 : 54, 224 + index * 49, 915))
      context.fillStyle = '#6b765b'; context.font = '24px sans-serif'; context.fillText(localize(deskMischiefCopy.screenFooter, locale), locale === 'fa' ? 970 : 54, 595)
      texture.needsUpdate = true
    }
    const reaction = reduced || s.reaction < 0 ? 0 : Math.sin(Math.min(1, s.reaction / 3.6) * Math.PI)
    for (const watcher of watchers) {
      const desired = Math.atan2(s.body.position.x - watcher.position.x, s.body.position.z - watcher.position.z)
      const heading = watcher.heading + reaction * Math.atan2(Math.sin(desired - watcher.heading), Math.cos(desired - watcher.heading))
      watcher.rig.update({ ...s, action: null, actionTime: 0, jumpPrep: -1, keyPulse: 1, landing: 1, travelled: 0, phase: s.phase === 'paused' ? 'paused' : 'roaming', body: { ...s.body, position: watcher.position, grounded: true, heading, velocity: { x: 0, y: 0, z: 0 } } }, reduced, delta, [], true)
    }
    if (s.phase !== 'paused') {
      const position = joker.getWorldPosition(new Vector3())
      const look = Math.atan2(s.body.position.x - position.x, s.body.position.z - position.z)
      head.rotation.y = reaction * Math.max(-1.2, Math.min(1.2, look - joker.rotation.y))
      head.rotation.z = reaction * -0.12
    }
    object.updateMatrixWorld(true)
  }
  return { object, keys, mouse, head, pickTargets, update, laptopMaterial: () => screenMaterial,
    dispose() { originals.forEach((visible, source) => { source.visible = visible }); geometries.forEach(geometry => geometry.dispose()); watchers.forEach(watcher => watcher.rig.dispose()); texture?.dispose(); screenMaterial?.dispose(); object.removeFromParent() },
  }
}
