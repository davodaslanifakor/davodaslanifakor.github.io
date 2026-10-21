import { effectScope, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { Box3, BufferGeometry, Float32BufferAttribute, Mesh, Vector3 } from 'three'
import { useDeskMinion } from '../composables/useDeskMinion'
import { BODY_RADIUS, deskRoute, JUMP_SPEED, measureDeskWorld, MINION_IDS, stepDeskBody } from '../utils/deskPlayground'
import type { DeskBody } from '../utils/deskPlayground'
import { deskModel } from './helpers/deskModel'
import { readRoomGlb } from './helpers/glb'

function session(reduced = true) {
  const asset = deskModel(), world = measureDeskWorld(asset.model)
  const active = ref<'paratrooper' | null>('paratrooper'), ready = ref(true), scope = effectScope()
  const game = scope.run(() => useDeskMinion({ character: () => active.value, world: () => world, reducedMotion: () => reduced, ready: () => ready.value }))!
  let time = 0
  game.updateFrame(0)
  const advance = (seconds: number) => { for (let i = 0; i < seconds * 120; i++) { time += 1000 / 120; game.updateFrame(time) } }
  return { game, world, active, ready, advance, dispose() { scope.stop(); asset.dispose() } }
}

describe('desk exploration', () => {
  it('walks each native Minion from its real shelf to the front of the desk', () => {
    const asset = deskModel()
    try {
      for (const character of MINION_IDS) {
        const world = measureDeskWorld(asset.model, character), scope = effectScope()
        const game = scope.run(() => useDeskMinion({ character: () => character, world: () => world, reducedMotion: () => false, ready: () => true }))!
        expect(game.state.value.body.position.x).toBeCloseTo(world.spawn.x)
        for (let time = 0; time < 5000; time += 1000 / 120) game.updateFrame(time)
        expect(game.state.value.phase).toBe('roaming')
        expect(game.state.value.body.position.z).toBeCloseTo(world.front.z, 1)
        scope.stop()
      }
    } finally { asset.dispose() }
  })

  it('walks and jumps onto the real MacBook before pressing power, then reaches the cable', () => {
    const s = session()
    try {
      expect(s.world.laptop).not.toBeNull()
      s.game.requestAction('laptop')
      expect(s.game.state.value.laptopOn).toBe(true)
      s.advance(12)
      expect(s.game.state.value.feedback).toBe('laptopOff')
      expect(s.game.state.value.laptopOn).toBe(false)
      expect(s.game.state.value.body.position.y).toBeGreaterThan(s.world.desk.max.y + 0.03)
      s.game.requestAction('laptop'); s.advance(2)
      expect(s.game.state.value.laptopOn).toBe(true)
      s.game.requestAction('cable'); s.advance(8)
      expect(s.game.state.value.feedback).toBe('monitorOff')
      expect(s.game.state.value.monitorConnected).toBe(false)
      s.game.interact(); s.advance(0.4)
      expect(s.game.state.value.monitorConnected).toBe(false)
      s.advance(1.15)
      expect(s.game.state.value.monitorConnected).toBe(true)
    } finally { s.dispose() }
  })

  it('completes both interactions against the decoded exported surface triangles', async () => {
    const asset = deskModel(), document = readRoomGlb(), geometries: BufferGeometry[] = []
    const meshNames = measureDeskWorld(asset.model).pickTargets.map(mesh => mesh.name)
    for (const name of meshNames) {
      const mesh = asset.model.getObjectByName(name)
      if (!(mesh instanceof Mesh)) continue
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new Float32BufferAttribute((await document.attribute(name, 'POSITION')).flat(), 3))
      const indices = await document.indices(name)
      if (indices.length) geometry.setIndex(indices)
      geometry.computeBoundingBox(); geometry.computeBoundingSphere()
      geometries.push(geometry); mesh.geometry = geometry
    }
    asset.model.updateMatrixWorld(true)
    const world = measureDeskWorld(asset.model), scope = effectScope()
    const game = scope.run(() => useDeskMinion({ character: () => 'paratrooper', world: () => world, reducedMotion: () => true, ready: () => true }))!
    let time = 0
    const advance = (seconds: number) => { for (let i = 0; i < seconds * 120; i++) { time += 1000 / 120; game.updateFrame(time) } }
    try {
      game.requestAction('laptop'); advance(12)
      expect(game.state.value.feedback).toBe('laptopOff')
      game.requestAction('cable'); advance(8)
      expect(game.state.value.feedback).toBe('monitorOff')
      expect(world.keys.length).toBeGreaterThan(40)
      game.requestAction('keyboard'); advance(12)
      expect(game.state.value.feedback).toBe('wakeLaptop')
      game.requestAction('laptop'); advance(12)
      game.requestAction('keyboard'); advance(8)
      expect(game.state.value.typing).toBe(true)
      for (const key of 'Hello!') game.typeKey(key)
      advance(5)
      expect(game.state.value.typedText).toBe('Hello!')
      game.typeKey('Backspace'); advance(1)
      expect(game.state.value.typedText).toBe('Hello')
      game.requestAction('erase'); advance(4)
      expect(game.state.value.keystrokes).toBe(0)
      expect(game.state.value.feedback).toBe('erased')
      game.requestAction('mouse'); advance(10)
      expect(game.state.value.feedback).toBe('parked')
      expect(game.state.value.mouseOffset).toBeGreaterThan(0.1)
      expect(game.state.value.body.surface).toBe('static_mouse')
      game.jump(); advance(0.2)
      expect(game.state.value.body.grounded).toBe(false)
      game.press('back', true); advance(0.7); game.press('back', false); advance(0.3)
      expect(game.state.value.body.grounded).toBe(true)
      expect(game.state.value.body.surface).not.toBe('static_mouse')
      game.requestAction('cable'); advance(10)
      expect(game.state.value.monitorConnected).toBe(true)
      game.reset()
      expect(game.state.value.mouseOffset).toBe(0)
      expect(game.state.value.keystrokes).toBe(0)
    } finally { scope.stop(); geometries.forEach(geometry => geometry.dispose()); asset.dispose() }
  })

  it('cancels walks on manual input, gates actions by proximity, prevents double jumps, and restores devices', () => {
    const s = session()
    try {
      s.game.interact(); expect(s.game.state.value.feedback).toBe('comeCloser')
      s.game.requestAction('laptop'); s.advance(0.2)
      s.game.press('back', true)
      expect(s.game.state.value.destination).toBeNull()
      s.advance(2); s.game.press('back', false)
      expect(s.game.state.value.body.position.z).toBeLessThanOrEqual(s.world.desk.max.z - BODY_RADIUS)
      s.game.jump(); s.advance(0.16)
      const velocity = s.game.state.value.body.velocity.y
      s.game.jump(); expect(s.game.state.value.body.velocity.y).toBe(velocity)
      s.advance(1); expect(s.game.state.value.body.grounded).toBe(true)
      s.game.requestAction('cable'); s.advance(12)
      expect(s.game.state.value.monitorConnected).toBe(false)
      s.game.reset(); expect(s.game.state.value.monitorConnected).toBe(true)
      s.active.value = null
      const before = s.game.state.value.body.position
      s.advance(2); expect(s.game.state.value.body.position).toEqual(before)
    } finally { s.dispose() }
  })

  it('can stop during mouse boarding and cable strain without losing completed effects', () => {
    const s = session()
    try {
      s.game.requestAction('mouse')
      for (let i = 0; i < 100 && s.game.state.value.action !== 'mouse'; i++) s.advance(0.1)
      expect(s.game.state.value.action).toBe('mouse')
      s.advance(1.5)
      expect(s.game.state.value.body.grounded).toBe(false)
      const offset = s.game.state.value.mouseOffset
      s.game.pause(); s.advance(2)
      expect(s.game.state.value.mouseOffset).toBe(offset)
      s.game.resume(); s.game.cancel(); s.advance(1)
      expect(s.game.state.value.body.grounded).toBe(true)
      expect(s.game.state.value.mouseOffset).toBe(offset)
      s.game.requestAction('cable')
      for (let i = 0; i < 100 && s.game.state.value.action !== 'cable'; i++) s.advance(0.1)
      expect(s.game.state.value.action).toBe('cable')
      s.advance(0.9); s.game.press('back', true)
      expect(s.game.state.value.action).toBeNull()
      expect(s.game.state.value.monitorConnected).toBe(true)
      s.game.press('back', false); s.game.reset()
      expect(s.game.state.value.mouseOffset).toBe(0)
    } finally { s.dispose() }
  })

  it('pauses on blur and camera transitions do not advance physics', () => {
    const s = session()
    try {
      s.game.press('right', true); s.advance(0.1)
      window.dispatchEvent(new Event('blur'))
      expect(s.game.state.value.phase).toBe('paused')
      const position = { ...s.game.state.value.body.position }
      s.advance(2); expect(s.game.state.value.body.position).toEqual(position)
      s.game.resume(); s.advance(0.5)
      expect(s.game.state.value.body.position.x - position.x).toBeLessThan(0.03)
      s.ready.value = false
      const held = { ...s.game.state.value.body.position }
      s.advance(2); expect(s.game.state.value.body.position).toEqual(held)
    } finally { s.dispose() }
  })
})

describe('desk physics', () => {
  it('blocks solid sides, lands from above and rejects blocked/out-of-bounds destinations', () => {
    const world = measureDeskWorld(null)
    world.surfaces = [{ id: 'speaker', walkable: true, bounds: new Box3(new Vector3(-0.1, 0.75, -0.1), new Vector3(0.1, 0.84, 0.1)) }]
    let body: DeskBody = { position: { x: -0.2, y: 0.75, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, grounded: true, surface: 'desk', heading: 0 }
    for (let i = 0; i < 120; i++) body = stepDeskBody(world, body, { x: 1, z: 0 }, 1 / 120)
    expect(body.position.x).toBeLessThan(-0.1)
    body = { ...body, grounded: false, velocity: { ...body.velocity, y: JUMP_SPEED } }
    for (let i = 0; i < 72; i++) body = stepDeskBody(world, body, { x: 1, z: 0 }, 1 / 120)
    expect(body.grounded).toBe(true)
    expect(body.position.y).toBeCloseTo(0.84)
    expect(deskRoute(world, body.position, { x: 10, y: 0, z: 0 })).toEqual([])
    world.surfaces[0]!.walkable = false
    expect(deskRoute(world, body.position, { x: 0, y: 0.84, z: 0 })).toEqual([])
  })
})
