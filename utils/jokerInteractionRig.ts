import { BoxGeometry, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { JokerState } from './jokerAdventure'
import { jokerEntryPose, jokerPullPose, jokerCarPoint, jokerLiftPose, JOKER_SEAT } from './jokerInteractionPose'

/** Contact poses use the exported rigid LEGO parts; no duplicated avatar or stretched arms. */
export function createJokerInteractionRig(root: Object3D) {
  const actor = root.getObjectByName('JA_Joker')!, car = root.getObjectByName('JA_Car')!
  const latch = root.getObjectByName('JA_BookLatch'), garageDoor = root.getObjectByName('JA_GarageDoor')
  const lift = root.getObjectByName('JA_Lift'), ramp = root.getObjectByName('JA_RampHinge')
  const doors = [-1, 1].map(side => ({ side, node: root.getObjectByName(`JA_CarDoor_${side}`) }))
  const wheel = root.getObjectByName('JA_Steering')
  const cushion = root.getObjectByName('JA_Seat_cushion')
  if (cushion) cushion.position.y += .0034 // Hip underside meets the cushion; feet clear the chassis.
  for (const name of ['JA_Steering', 'JA_Steering_spoke']) {
    const node = root.getObjectByName(name)
    if (node) node.position.z -= .017
  }
  const column = root.getObjectByName('JA_Steering_column')
  if (column) {
    const from = new Vector3(0, .040, .023), to = new Vector3(0, .056, -.008)
    column.position.copy(from).lerp(to, .5)
    column.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), to.clone().sub(from).normalize())
    column.scale.y = from.distanceTo(to) / Math.hypot(.014, .016)
  }
  for (const { side } of doors) {
    const handle = root.getObjectByName(`JA_CarDoor_handle_${side}`)
    if (handle) handle.position.set(side * .010, .010, -.052)
  }
  if (latch) {
    const grip = new Mesh(new BoxGeometry(.016, .004, .006), new MeshStandardMaterial({ color: '#bdd66a', metalness: .55, roughness: .3 }))
    grip.name = 'JA_BookLatch_grip'; grip.position.set(0, .026, .011); latch.add(grip)
  }
  root.updateMatrixWorld(true)
  const arms = (['l', 'r'] as const).flatMap(side => {
    let pivot: Object3D | undefined
    actor.traverse(node => { if (node.name.startsWith(`JA_Joker_shoulder_${side}`) && !(node instanceof Mesh)) pivot = node })
    const hand = actor.getObjectByName(`JA_Joker_hand_${side}`)
    if (!pivot || !(hand instanceof Mesh)) return []
    hand.geometry.computeBoundingBox()
    const centre = hand.geometry.boundingBox!.getCenter(new Vector3())
    const rest = pivot.worldToLocal(hand.localToWorld(centre)).normalize()
    return [{ side, pivot, rest }]
  })
  const hips = ['l', 'r'].map(side => actor.getObjectByName(`JA_Joker_hip_${side}`))
  const direction = new Vector3(), desired = new Quaternion()
  function aim(side: 'l' | 'r', target: Vector3, weight: number) {
    const arm = arms.find(a => a.side === side)
    if (!arm || weight <= 0) return
    actor.updateWorldMatrix(true, true)
    direction.copy(target); arm.pivot.parent!.worldToLocal(direction); direction.sub(arm.pivot.position).normalize()
    desired.setFromUnitVectors(arm.rest, direction)
    arm.pivot.quaternion.slerp(desired, weight)
  }
  function pose(hip: number, stride = 0, step = 0) {
    hips.forEach((node, i) => node?.rotation.set(hip + (i ? -stride : stride) - (i ? step : 0), 0, 0))
    arms.forEach(({ pivot, side }) => pivot.rotation.set(side === 'l' ? -stride : stride, 0, 0))
  }
  function handsOnWheel(weight: number) {
    if (!wheel) return
    wheel.updateWorldMatrix(true, false)
    aim('l', wheel.localToWorld(new Vector3(-.010, 0, 0)), weight)
    aim('r', wheel.localToWorld(new Vector3(.010, 0, 0)), weight)
  }
  function update(s: JokerState, reduced: boolean) {
    // Persistent prop state is independent of whichever authored clip supplies other movement.
    if (latch) latch.rotation.set(s.garageOpen ? .49 : 0, 0, 0)
    if (garageDoor) garageDoor.position.y = s.garageOpen ? .294 : .012
    if (lift) lift.position.y = s.lifted ? .940 : .050
    if (ramp) ramp.rotation.set(0, 0, s.lifted ? 0 : -Math.PI / 2)
    if (s.phase === 'lifting' || s.phase === 'lowering') {
      const p = jokerLiftPose(s)
      if (lift) lift.position.y = p.platformY
      if (ramp) ramp.rotation.z = p.rampAngle
      if (s.phase === 'lifting') { car.position.copy(p.position); car.rotation.set(0, p.yaw, 0) }
    }
    doors.forEach(({ node }) => node?.rotation.set(0, 0, 0))
    if (s.phase === 'opening' || s.phase === 'entering') {
      car.position.set(s.carPosition.x, s.carPosition.y, s.carPosition.z); car.rotation.set(0, s.carYaw, 0)
    }
    if (s.phase === 'opening') {
      const p = jokerPullPose(s)
      actor.position.copy(p.position); actor.rotation.set(0, p.yaw, 0)
      pose(Math.PI / 2, reduced ? 0 : p.stride)
      if (latch) latch.rotation.x = p.latchAngle
      if (garageDoor) garageDoor.position.y = .012 + p.doorLift
      aim('r', p.grip, p.contact)
    } else if (s.phase === 'entering') {
      const p = jokerEntryPose(s)
      actor.position.copy(p.position); actor.rotation.set(0, p.yaw, 0)
      pose(Math.PI / 2 * (1 - p.seated), reduced ? 0 : p.stride, p.step)
      doors.forEach(({ node, side }) => { if (node && side === p.side) node.rotation.y = p.doorAngle })
      aim(p.side < 0 ? 'r' : 'l', p.handle, p.contact)
      handsOnWheel(p.wheelGrip)
    } else if (s.inCar) {
      actor.position.copy(jokerCarPoint(JOKER_SEAT, car.position, car.rotation.y)); actor.rotation.set(0, car.rotation.y, 0)
      pose(0); handsOnWheel(1)
    }
  }
  return { update }
}
