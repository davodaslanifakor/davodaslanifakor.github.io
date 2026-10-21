import { isMesh } from '~/utils/threeGuards'
import { Bone, Box3, CapsuleGeometry, CircleGeometry, Group, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three'
import type { BufferGeometry, Material, Object3D } from 'three'
import type { DeskMinionState } from '../composables/useDeskMinion'
import { BODY_HEIGHT } from './deskPlayground'
import type { MinionId } from './deskPlayground'

const down = new Vector3(0, -1, 0)
const clamp = (x: number) => Math.max(0, Math.min(1, x))
const blend = (a: number, b: number, t: number) => a + (b - a) * clamp(t)
export function poseCurve(time: number, frames: readonly (readonly [number, number])[]) {
  if (time <= frames[0]![0]) return frames[0]![1]
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1]!, b = frames[i]!
    if (time <= b[0]) { const t = clamp((time - a[0]) / (b[0] - a[0])); return blend(a[1], b[1], t * t * (3 - 2 * t)) }
  }
  return frames.at(-1)![1]
}
/** Analytic two-bone solve: joints bend toward the pole and keep their lengths. */
export function limbElbow(shoulder: Vector3, target: Vector3, upper: number, lower: number, pole: Vector3) {
  const axis = target.clone().sub(shoulder), distance = Math.max(0.00001, Math.min(upper + lower - 0.00001, axis.length()))
  axis.normalize()
  const side = pole.clone().addScaledVector(axis, -pole.dot(axis))
  if (side.lengthSq() < 0.00001) side.set(1, 0, 0).addScaledVector(axis, -axis.x)
  if (side.lengthSq() < 0.00001) side.set(0, 0, 1)
  side.normalize()
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
  return shoulder.clone().addScaledVector(axis, along).addScaledVector(side, Math.sqrt(Math.max(0, upper * upper - along * along)))
}

/** A reversible toy rig: articulated elbows/knees, planted shoes and the original face/clothes. */
export function createMinionRig(source: Object3D, character: MinionId) {
  const actor = new Group(), spine = new Bone(), avatar = source.clone(true)
  actor.name = `animated_${character}`; spine.name = 'minion_spine'; spine.position.y = 0.022; actor.add(spine)
  avatar.position.set(0, 0, 0); avatar.rotation.set(0, 0, 0); avatar.scale.setScalar(1); avatar.visible = true
  const sign = new Group(); sign.name = 'minion_peace_sign'
  const signParts: Object3D[] = []
  avatar.traverse(child => { if (/sign|pole|int_cards__2/.test(child.name)) signParts.push(child) })
  signParts.forEach(child => { child.visible = false })
  avatar.updateMatrixWorld(true)
  const bounds = new Box3()
  avatar.traverseVisible(child => { if (isMesh(child)) bounds.union(new Box3().setFromObject(child)) })
  const scale = bounds.isEmpty() ? 1 : BODY_HEIGHT / Math.max(0.035, bounds.max.y - bounds.min.y)
  avatar.scale.setScalar(scale); avatar.position.y = bounds.isEmpty() ? 0 : -bounds.min.y * scale
  actor.add(avatar); actor.updateMatrixWorld(true); spine.attach(avatar)
  actor.add(sign); actor.updateMatrixWorld(true)
  signParts.forEach(child => { child.visible = true; sign.attach(child) })
  const geometries = new Set<BufferGeometry>(), ownedMaterials = new Set<Material>()
  const madeMesh = (geometry: BufferGeometry, material: Material) => { geometries.add(geometry); const mesh = new Mesh(geometry, material); mesh.castShadow = true; return mesh }
  const fallback = new MeshBasicMaterial({ color: '#edc739' }); ownedMaterials.add(fallback)
  interface Limb { upper: Bone; lower: Bone; end: Bone; length: number; rest: Vector3; shoulder: Vector3; side: number; arm: boolean; plant: Vector3; wasStance: boolean }
  const limbs: Limb[] = []
  for (const side of [-1, 1]) {
    const suffix = character === 'cards' ? side < 0 ? '_-1' : '_1' : side < 0 ? '_l' : '_r'
    for (const arm of [true, false]) {
      const parts: Mesh[] = []
      avatar.traverse(child => { if (isMesh(child) && child.name.endsWith(suffix) && (arm ? /_(arm|sleeve|hand|glove)_/.test(child.name) : /_(foot|boot)_/.test(child.name))) parts.push(child) })
      const extremity = parts.find(part => arm ? /hand|glove/.test(part.name) : /foot|boot/.test(part.name))
      if (!extremity) continue
      const rest = new Box3().setFromObject(extremity).getCenter(new Vector3())
      const armMesh = parts.find(part => /arm|sleeve/.test(part.name))
      const shoulder = armMesh ? new Box3().setFromObject(armMesh).getCenter(new Vector3()) : new Vector3(side * 0.012, 0.022, 0)
      if (armMesh) { shoulder.y = new Box3().setFromObject(armMesh).max.y - 0.002; shoulder.z = 0 }
      const upper = new Bone(), lower = new Bone(), end = new Bone()
      upper.name = `minion_${arm ? 'shoulder' : 'hip'}_${side}`; lower.name = `minion_${arm ? 'elbow' : 'knee'}_${side}`; end.name = `minion_${arm ? 'hand' : 'shoe'}_${side}`
      const length = arm ? Math.max(0.02, shoulder.distanceTo(rest) * 0.58) : 0.014
      actor.add(upper); upper.add(lower); lower.add(end); lower.position.y = -length; end.position.y = -length
      const material = armMesh ? Array.isArray(armMesh.material) ? armMesh.material[0]! : armMesh.material : Array.isArray(extremity.material) ? extremity.material[0]! : extremity.material
      for (const bone of [upper, lower]) {
        const tube = madeMesh(new CapsuleGeometry(arm ? 0.0032 : 0.003, length - 0.0064, 3, 8), material ?? fallback)
        tube.position.y = -length / 2; bone.add(tube)
      }
      lower.add(madeMesh(new SphereGeometry(arm ? 0.0033 : 0.0031, 8, 6), material ?? fallback))
      parts.forEach(part => { if (part !== extremity) part.visible = false })
      upper.position.copy(shoulder)
      const elbow = limbElbow(shoulder, rest, length, length, new Vector3(side, 0, arm ? -0.3 : 1))
      upper.quaternion.setFromUnitVectors(down, elbow.clone().sub(shoulder).normalize())
      lower.quaternion.setFromUnitVectors(down, rest.clone().sub(elbow).normalize().applyQuaternion(upper.quaternion.clone().invert()))
      end.quaternion.copy(upper.quaternion).multiply(lower.quaternion).invert()
      actor.updateMatrixWorld(true); end.attach(extremity)
      limbs.push({ upper, lower, end, length, rest, shoulder: arm ? spine.worldToLocal(shoulder.clone()) : shoulder, side, arm, plant: new Vector3(), wasStance: false })
    }
  }
  const eyes: { object: Object3D; scale: Vector3; position: Vector3 }[] = []
  avatar.traverse(child => { if (/_eye$|_iris$|_pupil$|_glint$/.test(child.name)) eyes.push({ object: child, scale: child.scale.clone(), position: child.position.clone() }) })
  const mouthMaterial = new MeshBasicMaterial({ color: '#372310' }); ownedMaterials.add(mouthMaterial)
  const mouth = madeMesh(new CircleGeometry(0.0022, 16), mouthMaterial)
  const bodyMesh = avatar.getObjectByName(`int_${character}`)
  const bodyBounds = bodyMesh ? new Box3().setFromObject(bodyMesh) : new Box3(new Vector3(-0.02, 0, -0.02), new Vector3(0.02, 0.08, 0.02))
  mouth.position.set(0, 0.047, bodyBounds.max.z + 0.0007); actor.add(mouth); actor.updateMatrixWorld(true); spine.attach(mouth)
  let clock = 0, angle = 0, lastHeading = 0
  function update(state: DeskMinionState, reduced: boolean, delta: number, handTargets: Vector3[] = [], spectator = false) {
    const s = state, body = s.body
    if (s.phase === 'paused') return
    clock += delta
    const speed = Math.min(1, Math.hypot(body.velocity.x, body.velocity.z) / 0.3), reaction = s.reaction >= 0 ? Math.sin(clamp(s.reaction / 3.5) * Math.PI) : 0
    const turn = Math.atan2(Math.sin(body.heading - angle), Math.cos(body.heading - angle)); angle = reduced ? body.heading : angle + turn * (1 - Math.exp(-delta * (character === 'robot' ? 9 : 14)))
    actor.position.set(body.position.x, body.position.y, body.position.z); actor.rotation.y = angle
    let lean = 0, crouch = 0
    if (!reduced) {
      const stride = s.travelled / (character === 'cards' ? 0.065 : 0.077) * Math.PI * 2
      lean = speed * (character === 'robot' ? 0.12 : 0.06)
      crouch = speed * (1 - Math.cos(stride * 2)) * 0.001
      if (s.jumpPrep >= 0) crouch += Math.sin(clamp(s.jumpPrep / 0.12) * Math.PI / 2) * 0.01
      if (!body.grounded) lean += -body.velocity.y * 0.13
      crouch += Math.sin(clamp(s.landing / 0.23) * Math.PI) * 0.009
      if (s.phase === 'climbing') { lean = poseCurve(s.actionTime, [[0, 0], [0.15, 0.65], [0.5, 0.45], [0.78, 0]]); crouch = 0.005 }
      if (s.action === 'speaker') {
        lean = poseCurve(s.actionTime, [[0, 0], [0.35, 0.28], [0.72, 0.28], [0.92, -0.32], [1.35, -0.08], [2.8, 0]])
        crouch = poseCurve(s.actionTime, [[0, 0], [0.35, -0.008], [0.72, -0.008], [0.95, 0.006], [2.8, 0]])
      } else if (s.action === 'cable') {
        lean = poseCurve(s.actionTime, [[0, 0], [0.3, 0.62], [0.64, 0.2], [0.9, 0.52], [1.22, 0.12], [1.44, 0.5], [1.58, -0.34], [1.9, 0.12], [2.45, 0]])
        crouch = 0.008 * Math.max(0, Math.sin(Math.min(1, s.actionTime / 2.45) * Math.PI))
      } else if (s.action === 'mouse') {
        lean = poseCurve(s.actionTime, [[0, 0], [0.35, 0.72], [1.2, 0.6], [1.8, 0.1], [2.25, -0.14], [3.0, -0.3], [3.65, 0]])
        crouch = 0.005
      } else if (s.action === 'keyboard' || s.action === 'erase') {
        lean = s.actionTime < 1.8 ? 0.2 : -0.12
        crouch = s.keyPulse < 0.16 ? Math.sin(s.keyPulse / 0.16 * Math.PI) * 0.005 : 0
      } else if (s.action === 'laptop') { lean = Math.sin(clamp(s.actionTime / 1.12) * Math.PI) * 0.62; crouch = 0.008 * Math.sin(clamp(s.actionTime / 1.12) * Math.PI) }
      if (spectator && character === 'paratrooper') { lean += Math.sin(clock * 17) * reaction * 0.1; crouch += Math.abs(Math.sin(clock * 12)) * reaction * 0.002 }
    }
    spine.position.y = 0.022 - crouch; spine.rotation.set(lean, 0, reduced ? 0 : Math.sin(clock * 3) * 0.009 * (1 - speed))
    sign.position.set(0, spectator ? reaction * 0.025 : 0, 0)
    sign.rotation.set(0, 0, reduced ? 0 : Math.sin(clock * 3) * 0.035)
    const stowed = !spectator && Boolean(s.action || s.phase === 'climbing')
    if (stowed) { sign.position.z = -0.055; sign.rotation.y = Math.PI }
    actor.updateMatrixWorld(true)
    const headingChange = Math.abs(Math.atan2(Math.sin(angle - lastHeading), Math.cos(angle - lastHeading)))
    for (const limb of limbs) {
      const { side, arm, upper, lower, length } = limb
      const shoulder = arm ? actor.worldToLocal(spine.localToWorld(limb.shoulder.clone())) : limb.shoulder.clone().add(new Vector3(0, -crouch, 0))
      let goal = limb.rest.clone()
      const phase = (s.travelled / (character === 'cards' ? 0.065 : 0.077) + (side > 0 ? 0.5 : 0)) % 1
      if (arm) {
        if (!reduced && handTargets.length) {
          const weight = s.phase === 'climbing' ? poseCurve(s.actionTime, [[0, 0], [0.13, 1], [0.5, 1], [0.78, 0]])
            : poseCurve(s.actionTime, [[0, 0], [0.3, 1], [s.action === 'cable' ? 1.9 : s.action === 'mouse' ? 1 : 0.8, 1], [s.action === 'cable' ? 2.45 : s.action === 'mouse' ? 1.3 : 1.12, 0]])
          goal.lerp(actor.worldToLocal(handTargets[side < 0 ? 0 : Math.min(1, handTargets.length - 1)]!.clone()), weight)
        }
        else if (character === 'cards' && !stowed) goal.add(new Vector3(0, sign.position.y, 0))
        else if (!reduced) { goal.z += Math.sin(phase * Math.PI * 2) * speed * 0.016; if (!body.grounded) { goal.x += side * 0.013; goal.y += 0.018 } }
      } else if (!reduced && body.grounded && speed > 0.05 && !s.action) {
        const stance = phase < 0.58
        if (stance) {
          if (!limb.wasStance || headingChange > 0.12) limb.plant.copy(actor.localToWorld(goal.clone().add(new Vector3(0, 0, 0.014))))
          goal = actor.worldToLocal(limb.plant.clone()); goal.y = limb.rest.y
        } else { const flight = (phase - 0.58) / 0.42; goal.z += blend(-0.019, 0.014, flight); goal.y += Math.sin(flight * Math.PI) * 0.01 }
        limb.wasStance = stance
      } else { limb.wasStance = false; if (!reduced && !body.grounded) { goal.y += 0.006; goal.z += side * 0.007 } }
      const reach = goal.clone().sub(shoulder)
      if (reach.length() > length * 2 - 0.0001) goal.copy(shoulder).add(reach.setLength(length * 2 - 0.0001))
      const elbow = limbElbow(shoulder, goal, length, length, new Vector3(arm ? side : 0, 0, arm ? -0.3 : 1))
      upper.position.copy(shoulder); upper.quaternion.setFromUnitVectors(down, elbow.clone().sub(shoulder).normalize())
      const inverse = upper.quaternion.clone().invert()
      lower.quaternion.setFromUnitVectors(down, goal.clone().sub(elbow).normalize().applyQuaternion(inverse))
      limb.end.quaternion.copy(upper.quaternion).multiply(lower.quaternion).invert()
    }
    lastHeading = angle
    const blinkClock = clock % (character === 'robot' ? 3.7 : 4.3), blink = !reduced && blinkClock > 3.3 && blinkClock < 3.46 ? 0.12 : 1
    eyes.forEach(eye => { eye.object.scale.copy(eye.scale); eye.object.scale.y *= blink; eye.object.position.copy(eye.position); if (!reduced && /iris|pupil|glint/.test(eye.object.name)) eye.object.position.x += Math.max(-0.001, Math.min(0.001, turn * 0.001)) })
    mouth.scale.set(1, reduced ? 0.35 : reaction > 0.4 ? 1.3 : 0.3, 1)
    actor.updateMatrixWorld(true)
  }
  return { actor, spine, sign, limbs, update, dispose() { geometries.forEach(geometry => geometry.dispose()); ownedMaterials.forEach(material => material.dispose()); actor.removeFromParent() } }
}
