import { effectScope, ref } from 'vue'
import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'
import type { Mesh } from 'three'
import { describe, expect, it } from 'vitest'
import { useDeskMinion } from '../composables/useDeskMinion'
import { measureDeskWorld } from '../utils/deskPlayground'
import { keyboardKeyId, keyboardParts } from '../utils/deskKeyboard'
import { deskModel } from './helpers/deskModel'
import { readRoomGlb } from './helpers/glb'

async function typingSession(reduced = false) {
  const asset = deskModel(), document = readRoomGlb(), mesh = asset.model.getObjectByName('static_laptop_keycaps') as Mesh
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute((await document.attribute(mesh.name, 'POSITION')).flat(), 3))
  geometry.setIndex(await document.indices(mesh.name)); mesh.geometry = geometry; asset.model.updateMatrixWorld(true)
  const world = measureDeskWorld(asset.model), scope = effectScope(), ready = ref(true)
  const game = scope.run(() => useDeskMinion({ character: () => 'robot', world: () => world, ready: () => ready.value, reducedMotion: () => reduced }))!
  let time = 0
  const advance = (seconds: number) => { for (let i = 0; i < seconds * 120; i++) { time += 1000 / 120; game.updateFrame(time) } }
  advance(5)
  return { world, game, mesh, ready, advance, dispose() { scope.stop(); geometry.dispose(); asset.dispose() } }
}

describe('physical keyboard play', () => {
  it('maps actual QWERTY rows and preserves shifted or non-Latin input on the physical key', async () => {
    const s = await typingSession()
    try {
      const map = s.world.keyMap, keys = s.world.keys
      expect(Object.keys(map)).toHaveLength(74)
      expect(keyboardKeyId('w', 'KeyW')).toBe('q-1')
      expect(keyboardKeyId('!', 'Digit1')).toBe('num-1')
      expect(keyboardKeyId('ش', 'KeyA')).toBe('a-0')
      expect(keyboardKeyId('Backspace')).toBe('num-13')
      expect(keys[map['q-0']!]!.x).toBeLessThan(keys[map['q-9']!]!.x)
      expect(keys[map['q-0']!]!.z).toBeLessThan(keys[map['a-0']!]!.z)
      expect(keys[map['a-0']!]!.z).toBeLessThan(keys[map['z-0']!]!.z)
      const parts = keyboardParts(s.mesh)
      expect(parts[map.space!]!.bounds.getSize(new Vector3()).x).toBeGreaterThan(parts[map['q-0']!]!.bounds.getSize(new Vector3()).x * 4)
      s.game.requestAction('keyboard'); s.advance(10)
      expect(s.game.state.value.typing).toBe(true)
      const start = { ...s.game.state.value.body.position }
      s.game.typeKey('w', 'KeyW'); s.advance(0.2)
      expect(s.game.state.value.phase).toBe('key-hop')
      expect(s.game.state.value.body.grounded).toBe(false)
      expect(s.game.state.value.typedText).toBe('')
      expect(s.game.state.value.body.position.y).toBeGreaterThan(start.y)
      s.advance(1)
      expect(s.game.state.value.body.position.x).toBeCloseTo(keys[map['q-1']!]!.x, 5)
      expect(s.game.state.value.body.position.z).toBeCloseTo(keys[map['q-1']!]!.z, 5)
      expect(s.game.state.value.typedText).toBe('w')
      s.game.typeKey('!', 'Digit1'); s.game.typeKey('ش', 'KeyA'); s.advance(2)
      expect(s.game.state.value.typedText).toBe('w!ش')
      s.game.typeKey('Backspace'); s.advance(1)
      expect(s.game.state.value.typedText).toBe('w!')
      expect(s.game.state.value.body.position.x).toBeCloseTo(keys[map['num-13']!]!.x, 5)
    } finally { s.dispose() }
  })

  it('queues fast typing in order, freezes on pause/resize, and cancels pending hops on movement/reset', async () => {
    const s = await typingSession()
    try {
      s.game.typeKey('q'); s.advance(1)
      expect(s.game.state.value.typedText).toBe('')
      s.game.approach('keyboard'); s.advance(10)
      expect(s.game.state.value.typing).toBe(false)
      expect(s.game.nearby.value).toBe('keyboard')
      s.game.interact()
      for (const key of 'Hello world!') s.game.typeKey(key)
      expect(s.game.state.value.queuedKeys).toHaveLength(12)
      s.game.typeKey('x'); expect(s.game.state.value.queuedKeys).toHaveLength(12)
      s.advance(0.2); s.game.pause()
      const position = { ...s.game.state.value.body.position }
      s.advance(2); expect(s.game.state.value.body.position).toEqual(position)
      s.game.resume(); s.ready.value = false; s.advance(2)
      expect(s.game.state.value.body.position).toEqual(position)
      s.ready.value = true; s.advance(10)
      expect(s.game.state.value.typedText).toBe('Hello world!')
      s.game.typeKey('F5'); expect(s.game.state.value.queuedKeys).toHaveLength(0)
      s.game.typeKey('Enter'); s.game.typeKey('a'); s.advance(2)
      expect(s.game.state.value.typedText).toBe('Hello world!\na')
      s.game.typeKey('b'); s.game.typeKey('c'); s.advance(0.1)
      s.game.press('back', true); s.advance(0.4); s.game.press('back', false); s.advance(1)
      expect(s.game.state.value.typing).toBe(false)
      expect(s.game.state.value.keyHop).toBeNull()
      expect(s.game.state.value.queuedKeys).toHaveLength(0)
      expect(s.game.state.value.typedText).toBe('Hello world!\na')
      expect(s.game.state.value.body.grounded).toBe(true)
      s.game.reset(); expect(s.game.state.value.typedText).toBe('')
    } finally { s.dispose() }
  })

  it('keeps reduced-motion typing functional and refuses to type with the MacBook asleep', async () => {
    const s = await typingSession(true)
    try {
      s.game.requestAction('keyboard'); s.advance(10)
      s.game.typeKey('a'); s.advance(1)
      expect(s.game.state.value.typedText).toBe('a')
      expect(s.game.state.value.body.grounded).toBe(true)
      s.game.cancel(); s.game.requestAction('laptop'); s.advance(10)
      expect(s.game.state.value.laptopOn).toBe(false)
      s.game.requestAction('keyboard'); s.advance(1); s.game.typeKey('b')
      expect(s.game.state.value.typing).toBe(false)
      expect(s.game.state.value.typedText).toBe('a')
    } finally { s.dispose() }
  })
})
