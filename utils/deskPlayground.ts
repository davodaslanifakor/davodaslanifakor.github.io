import { Box3, Mesh, Raycaster, Vector3 } from 'three'
import type { Object3D } from 'three'
import { keyboardLayout, keyboardParts } from './deskKeyboard'

export const MINION_IDS = ['paratrooper', 'cards', 'robot'] as const
export type MinionId = typeof MINION_IDS[number]
export type DeskAction = 'laptop' | 'cable' | 'keyboard' | 'erase' | 'mouse' | 'speaker'
export interface Point3 { x: number; y: number; z: number }
export interface DeskSurface { id: string; bounds: Box3; walkable: boolean; mesh?: Object3D; offsetX?: number }
export interface DeskWorld {
  desk: Box3
  surfaces: DeskSurface[]
  pickTargets: Mesh[]
  spawn: Point3
  front: Point3
  laptop: Point3 | null
  cable: Point3
  keyboard: Point3 | null
  keys: Point3[]
  keyMap: Record<string, number>
  keyboardBounds: Box3 | null
  mouseBounds: Box3 | null
  mouse: Point3 | null
  joker: Point3 | null
  speaker: Point3 | null
  speakerKnob: Point3 | null
  speakerBounds: Box3 | null
  socket: Point3
  monitorAnchor: Point3
}
export const BODY_RADIUS = 0.019
export const BODY_HEIGHT = 0.085
export const JUMP_SPEED = 0.94
export const GRAVITY = 2.8
export const RUN_SPEED = 0.3
const point = (v: Vector3): Point3 => ({ x: v.x, y: v.y, z: v.z })

export function measureDeskWorld(model: Object3D | null, character: MinionId = 'paratrooper'): DeskWorld {
  model?.updateMatrixWorld(true)
  const bounds = (name: string) => {
    const object = model?.getObjectByName(name)
    return object ? new Box3().setFromObject(object) : null
  }
  const desk = bounds('static_desk_top') ?? new Box3(new Vector3(-1.195, 0.724, -0.4), new Vector3(0.855, 0.75, 0.36))
  const surfaces: DeskSurface[] = []
  const pickTargets: Mesh[] = []
  const names = ['static_desk_top', 'static_desk_mat', 'static_hub', 'int_monitor', 'int_monitor__2', 'static_laptop_keyboard', 'static_laptop_trackpad', 'static_laptop_keycaps', 'static_mouse', 'int_speakers', 'int_speakers__2', 'static_style_monitor_base', 'static_laptop_bezel', 'static_style_monitor_stem', 'static_subwoofer']
  for (const name of names) {
    const object = model?.getObjectByName(name)
    if (!object) continue
    const box = new Box3().setFromObject(object)
    if (box.isEmpty()) continue
    surfaces.push({ id: name, bounds: box, mesh: object, walkable: !['static_laptop_bezel', 'static_style_monitor_stem', 'static_subwoofer'].includes(name) })
    object.traverse(child => { if (child instanceof Mesh) pickTargets.push(child) })
  }
  // Keep the other collectibles and upright objects solid while this toy is roaming.
  for (const name of ['root_phone', 'root_clock', 'root_bugjar', 'root_elephant', ...MINION_IDS.filter(id => id !== character).map(id => `root_${id}`)]) {
    const object = model?.getObjectByName(name)
    if (!object) continue
    const box = new Box3().setFromObject(object)
    if (!box.isEmpty()) surfaces.push({ id: name, bounds: box, mesh: object, walkable: false })
  }
  model?.getObjectByName('runtime_subwoofer_detail')?.traverse(child => { if (child instanceof Mesh && child.userData.deskAction === 'speaker' && !child.name.includes('_wave_')) pickTargets.push(child) })
  const source = model?.getObjectByName(`root_${character}`)?.getWorldPosition(new Vector3()) ?? new Vector3(-0.75, desk.max.y + 0.019, 0.03)
  const front = { x: Math.max(desk.min.x + 0.08, Math.min(desk.max.x - 0.08, source.x)), y: desk.max.y, z: desk.max.z - 0.075 }
  const sensor = model?.getObjectByName('static_mac_touch_id_sensor.001')?.getWorldPosition(new Vector3())
  const keyboard = bounds('static_laptop_keyboard')
  const laptop = sensor && keyboard ? { x: sensor.x, y: keyboard.max.y + 0.002, z: sensor.z + 0.03 } : null
  const mouse = bounds('static_mouse')
  const socket = { x: Math.min(desk.max.x - 0.1, (mouse?.max.x ?? 0.1) + 0.095), y: desk.max.y + 0.009, z: 0.09 }
  const base = bounds('static_style_monitor_base')
  const monitorAnchor = base ? point(base.getCenter(new Vector3()).setY(desk.max.y + 0.008)) : { x: -0.25, y: desk.max.y + 0.008, z: -0.33 }
  const keyMesh = model?.getObjectByName('static_laptop_keycaps')
  const keys = keyMesh instanceof Mesh ? keyboardParts(keyMesh).map(part => point(part.center.clone().applyMatrix4(keyMesh.matrixWorld))) : []
  const keyboardTarget = keyboard ? { x: (keyboard.min.x + keyboard.max.x) / 2, y: keyboard.max.y, z: keyboard.max.z - 0.017 } : null
  const mouseTarget = mouse ? { x: mouse.min.x - 0.028, y: desk.max.y + 0.004, z: (mouse.min.z + mouse.max.z) / 2 } : null
  const speakerKnob = model?.getObjectByName('static_subwoofer_knob')?.getWorldPosition(new Vector3())
  const speaker = speakerKnob ? { x: speakerKnob.x, y: desk.max.y, z: speakerKnob.z + 0.042 } : null
  const joker = model?.getObjectByName('root_bugjar')?.getWorldPosition(new Vector3())
  return { desk, surfaces, pickTargets, spawn: point(source), front, laptop, keyboard: keyboardTarget, keys, keyMap: keyboardLayout(keys), keyboardBounds: keyboard, mouseBounds: mouse, mouse: mouseTarget, speaker, speakerBounds: bounds('static_subwoofer'), speakerKnob: speakerKnob ? point(speakerKnob) : null, joker: joker ? point(joker) : null, socket, cable: { x: socket.x, y: desk.max.y, z: socket.z + 0.08 }, monitorAnchor }
}

export function containsXZ(box: Box3, x: number, z: number, padding = 0) {
  return x >= box.min.x - padding && x <= box.max.x + padding && z >= box.min.z - padding && z <= box.max.z + padding
}
const surfaceRay = new Raycaster()
surfaceRay.ray.direction.set(0, -1, 0)
export function surfaceHeightAt(surface: DeskSurface, x: number, z: number) {
  if (!surface.mesh) return surface.bounds.max.y
  surfaceRay.ray.origin.set(x - (surface.offsetX ?? 0), surface.bounds.max.y + 0.02, z)
  return surfaceRay.intersectObject(surface.mesh, true)[0]?.point.y ?? null
}
export function deskHeightAt(world: DeskWorld, x: number, z: number, ceiling = Infinity) {
  let height = world.desk.max.y, id = 'static_desk_top'
  for (const surface of world.surfaces) {
    if (!containsXZ(surface.bounds, x, z)) continue
    const top = surfaceHeightAt(surface, x, z)
    if (top !== null && top <= ceiling && top > height) { height = top; id = surface.id }
  }
  return { height, id }
}
export interface DeskBody { position: Point3; velocity: Point3; grounded: boolean; surface: string; heading: number }

/** Small kinematic body with fixed-step gravity, solid sides and downward-only landings. */
export function stepDeskBody(world: DeskWorld, body: DeskBody, direction: { x: number; z: number }, dt: number): DeskBody {
  const position = { ...body.position }, velocity = { ...body.velocity }
  const length = Math.hypot(direction.x, direction.z)
  const blend = 1 - Math.exp(-dt * (length ? 15 : 22))
  const desired = length > 1 ? 1 / length : 1
  velocity.x += (direction.x * desired * RUN_SPEED - velocity.x) * blend
  velocity.z += (direction.z * desired * RUN_SPEED - velocity.z) * blend
  for (const axis of ['x', 'z'] as const) {
    const candidate = { ...position, [axis]: position[axis] + velocity[axis] * dt }
    candidate[axis] = Math.max(world.desk.min[axis] + BODY_RADIUS, Math.min(world.desk.max[axis] - BODY_RADIUS, candidate[axis]))
    const blocked = world.surfaces.some(surface => {
      const { id, bounds } = surface
      if (id === 'static_desk_top' || !containsXZ(bounds, candidate.x, candidate.z, BODY_RADIUS)
        || position.y + BODY_HEIGHT <= bounds.min.y + 0.002
        || containsXZ(bounds, position.x, position.z, BODY_RADIUS - 0.001)) return false
      // Use the top at the contacted edge, not the far/high end of a tilted keyboard.
      const top = surface.walkable ? surfaceHeightAt(surface,
        Math.max(bounds.min.x + 0.001, Math.min(bounds.max.x - 0.001, candidate.x)),
        Math.max(bounds.min.z + 0.001, Math.min(bounds.max.z - 0.001, candidate.z))) ?? bounds.max.y : bounds.max.y
      return position.y < top - 0.009
    })
    if (!blocked) position[axis] = candidate[axis]
    else velocity[axis] = 0
  }
  const beforeY = position.y
  velocity.y -= GRAVITY * dt
  position.y += velocity.y * dt
  const support = deskHeightAt(world, position.x, position.z, beforeY + (body.grounded ? 0.009 : 0.002))
  let grounded = false
  if (velocity.y <= 0 && position.y <= support.height) { position.y = support.height; velocity.y = 0; grounded = true }
  // Stop upward motion at solid undersides; never teleport onto a shelf from below.
  if (velocity.y > 0) for (const { bounds, id } of world.surfaces) {
    if (id !== 'static_desk_top' && containsXZ(bounds, position.x, position.z, BODY_RADIUS)
      && beforeY + BODY_HEIGHT <= bounds.min.y && position.y + BODY_HEIGHT >= bounds.min.y) {
      position.y = bounds.min.y - BODY_HEIGHT; velocity.y = 0
    }
  }
  const speed = Math.hypot(velocity.x, velocity.z)
  const heading = speed > 0.01 ? Math.atan2(velocity.x, velocity.z) : body.heading
  return { position, velocity, grounded, surface: grounded ? support.id : body.surface, heading }
}

/** A small surface grid routes automatic walks around the lid and monitor support. */
export function deskRoute(world: DeskWorld, from: Point3, to: Point3): Point3[] {
  const cell = 0.025, margin = BODY_RADIUS + 0.006
  if (!containsXZ(world.desk, to.x, to.z, -margin)
    || world.surfaces.some(surface => !surface.walkable && containsXZ(surface.bounds, to.x, to.z, margin))
    || deskHeightAt(world, to.x, to.z).height > world.desk.max.y + 0.15) return []
  const minX = world.desk.min.x + margin, minZ = world.desk.min.z + margin
  const cols = Math.floor((world.desk.max.x - minX - margin) / cell) + 1
  const rows = Math.floor((world.desk.max.z - minZ - margin) / cell) + 1
  const index = (p: Point3) => Math.max(0, Math.min(rows - 1, Math.round((p.z - minZ) / cell))) * cols + Math.max(0, Math.min(cols - 1, Math.round((p.x - minX) / cell)))
  const at = (i: number) => ({ x: minX + i % cols * cell, z: minZ + Math.floor(i / cols) * cell, y: world.desk.max.y })
  const allowed = (i: number) => {
    const p = at(i)
    return !world.surfaces.some(surface => !surface.walkable && containsXZ(surface.bounds, p.x, p.z, margin))
      && deskHeightAt(world, p.x, p.z).height < world.desk.max.y + 0.15
  }
  const start = index(from), goal = index(to)
  if (!allowed(goal)) return []
  const queue = [start], previous = new Map<number, number>([[start, -1]])
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head]!
    if (current === goal) break
    const x = current % cols, z = Math.floor(current / cols)
    for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
      if (nx! < 0 || nx! >= cols || nz! < 0 || nz! >= rows) continue
      const next = nz! * cols + nx!
      if (!previous.has(next) && allowed(next)) { previous.set(next, current); queue.push(next) }
    }
  }
  if (!previous.has(goal)) return []
  const route: Point3[] = []
  for (let i = goal; i !== start; i = previous.get(i)!) route.unshift(at(i))
  route.push({ ...to })
  return route
}

export function deskMinionFocus(world: DeskWorld, aspect: number, height: number, position = world.front, reduced = false, companion?: Point3 | null) {
  const target = new Vector3(position.x, position.y + 0.045, position.z - 0.015)
  let distance = Math.max(0.88, 0.5 / (2 * Math.tan(19 * Math.PI / 180) * Math.max(0.3, aspect)))
  if (reduced) {
    target.copy(world.desk.getCenter(new Vector3())).setY(world.desk.max.y + 0.06)
    const fit = Math.max(distance, world.desk.getSize(new Vector3()).x / (2 * Math.tan(19 * Math.PI / 180) * Math.max(0.3, aspect) * 0.84))
    return { name: 'cam_minion_game' as const, target, position: target.clone().add(new Vector3(0, fit * 0.6, fit)) }
  }
  if (companion && !reduced) {
    const span = Math.abs(position.x - companion.x) + 0.24
    target.x = (position.x + companion.x) / 2
    target.z = (position.z + companion.z) / 2
    distance = Math.max(distance, span / (2 * Math.tan(19 * Math.PI / 180) * Math.max(0.3, aspect) * 0.82))
  }
  // The small bottom controls leave the scene open, including on phones.
  if (height < 500) target.y += 0.025
  return { name: 'cam_minion_game' as const, target, position: target.clone().add(new Vector3(0, distance * 0.62, distance)) }
}

/** Moving props use translated collision bounds while the original asset stays untouched. */
export function worldWithMouse(world: DeskWorld, offsetX: number): DeskWorld {
  if (!offsetX) return world
  return { ...world, surfaces: world.surfaces.map(surface => surface.id === 'static_mouse' ? { ...surface, offsetX, bounds: surface.bounds.clone().translate(new Vector3(offsetX, 0, 0)) } : surface) }
}
export function safeMouseOffset(world: DeskWorld, from: number, desired: number) {
  if (!world.mouseBounds) return from
  let offset = from
  for (let candidate = from + 0.002; candidate <= desired + 0.001; candidate += 0.002) {
    const box = world.mouseBounds.clone().translate(new Vector3(candidate, 0, 0))
    box.expandByScalar(0.012)
    if (!containsXZ(world.desk, box.max.x, box.max.z, -0.018)) break
    if (world.surfaces.some(surface => surface.id !== 'static_mouse' && surface.bounds.max.y > world.mouseBounds!.min.y + 0.009 && surface.bounds.intersectsBox(box))) break
    offset = candidate
  }
  return offset
}
export function keyboardKeyAt(world: DeskWorld, position: Point3) {
  if (!world.keyboardBounds || !containsXZ(world.keyboardBounds, position.x, position.z, 0.003)) return -1
  let closest = -1, distance = 0.025
  world.keys.forEach((key, index) => { const d = Math.hypot(key.x - position.x, key.z - position.z); if (d < distance) { distance = d; closest = index } })
  return closest
}
