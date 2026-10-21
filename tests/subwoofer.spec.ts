import { effectScope } from 'vue'
import { Vector3 } from 'three'
import type { Mesh } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { useDeskMinion } from '../composables/useDeskMinion'
import { createSubwoofer, BASS_CONTACT } from '../utils/subwoofer'
import { createDeskMinion } from '../utils/deskMinionScene'
import { measureDeskWorld, MINION_IDS, stepDeskBody } from '../utils/deskPlayground'
import { resolveInteractiveMeshName } from '../composables/useRaycast'
import { deskModel } from './helpers/deskModel'

describe('interactive subwoofer', () => {
  it('adds visible driver detail, pulses only its own meshes and restores borrowed assets', () => {
    const asset = deskModel()
    const sourceKnob = asset.model.getObjectByName('static_subwoofer_knob')!, sourceRing = asset.model.getObjectByName('static_subwoofer_ring')!
    const materialDispose = vi.spyOn(asset.material, 'dispose'), geometryDisposals = asset.geometries.map(g => vi.spyOn(g, 'dispose'))
    const sourcePose = sourceKnob.matrixWorld.clone()
    const speaker = createSubwoofer(asset.model)!
    try {
      expect(sourceKnob.visible).toBe(false); expect(sourceRing.visible).toBe(false)
      expect(speaker.pickTargets.every(mesh => resolveInteractiveMeshName(mesh) === 'int_speakers')).toBe(true)
      const cabinet = measureDeskWorld(asset.model).speakerBounds!
      expect(speaker.driver.position.z).toBeGreaterThan(cabinet.max.z)
      const diaphragm = speaker.object.getObjectByName('static_subwoofer_detail_cone') as Mesh
      const normals = diaphragm.geometry.getAttribute('normal')
      const facing = new Vector3(normals.getX(0), normals.getY(0), normals.getZ(0)).transformDirection(diaphragm.matrixWorld)
      expect(facing.z).toBeGreaterThan(0.5)
      speaker.update(0.08, 0.8, false)
      expect(speaker.cone.position.z).not.toBe(0)
      expect(speaker.knob.rotation.z).not.toBe(0)
      expect(speaker.waves.some(wave => wave.visible)).toBe(true)
      speaker.update(0.08, 0.8, true)
      expect(speaker.cone.position.z).toBe(0)
      expect(speaker.waves.every(wave => !wave.visible)).toBe(true)
      speaker.update()
      expect(speaker.knob.rotation.z).toBeCloseTo(0)
    } finally { speaker.dispose() }
    expect(sourceKnob.visible).toBe(true); expect(sourceRing.visible).toBe(true)
    expect(sourceKnob.matrixWorld.equals(sourcePose)).toBe(true)
    expect(materialDispose).not.toHaveBeenCalled(); geometryDisposals.forEach(spy => expect(spy).not.toHaveBeenCalled())
    asset.dispose()
  })

  it('approaches the knob for every Minion, requires E, reaches it and triggers bass at contact', () => {
    const asset = deskModel()
    try {
      for (const character of MINION_IDS) {
        const world = measureDeskWorld(asset.model, character), scope = effectScope()
        const game = scope.run(() => useDeskMinion({ character: () => character, world: () => world, ready: () => true, reducedMotion: () => false }))!
        let time = 0
        const advance = (seconds: number) => { for (let i = 0; i < seconds * 120; i++) { time += 1000 / 120; game.updateFrame(time) } }
        advance(5)
        game.approach('speaker'); advance(12)
        expect(game.nearby.value).toBe('speaker')
        expect(game.state.value.speakerTime).toBe(-1)
        game.interact()
        for (let i = 0; i < 30 && game.state.value.action !== 'speaker'; i++) advance(0.1)
        expect(game.state.value.action).toBe('speaker')
        advance(BASS_CONTACT - 0.05)
        expect(game.state.value.speakerTime).toBe(-1)
        const stage = createDeskMinion(asset.model, character, world)
        try {
          const contact = { ...game.state.value, actionTime: BASS_CONTACT, body: { ...game.state.value.body, heading: Math.PI } }
          for (let i = 0; i < 30; i++) stage.update(contact, false, 0.05)
          const target = new Vector3(world.speakerKnob!.x, world.speakerKnob!.y, world.speakerKnob!.z + 0.005)
          const distances = stage.rig.limbs.filter(limb => limb.arm).map(limb => limb.end.getWorldPosition(new Vector3()).distanceTo(target))
          expect(Math.min(...distances), `${character}: ${distances}`).toBeLessThan(0.016)
        } finally { stage.dispose() }
        advance(0.1)
        expect(game.state.value.speakerTime).toBeGreaterThanOrEqual(0)
        expect(game.state.value.feedback).toBe('bassPlaying')
        const pulseTime = game.state.value.speakerTime
        game.pause(); advance(1); expect(game.state.value.speakerTime).toBe(pulseTime)
        game.resume(); advance(4)
        expect(game.state.value.feedback).toBe('bassDone')
        expect(game.state.value.speakerTime).toBe(-1)
        game.interact(); advance(0.9); game.cancel()
        expect(game.state.value.speakerTime).toBe(-1)
        game.reset(); expect(game.state.value.speakerTime).toBe(-1)
        scope.stop()
      }
    } finally { asset.dispose() }
  })

  it('blocks walking through the cabinet and does not mistake its top for a usable knob position', () => {
    const asset = deskModel(), world = measureDeskWorld(asset.model), bounds = world.speakerBounds!
    let body = { position: { x: bounds.getCenter(new Vector3()).x, y: world.desk.max.y, z: bounds.max.z + 0.08 }, velocity: { x: 0, y: 0, z: 0 }, heading: Math.PI, grounded: true, surface: 'static_desk_top' }
    for (let i = 0; i < 240; i++) body = stepDeskBody(world, body, { x: 0, z: -1 }, 1 / 120)
    expect(body.position.z).toBeGreaterThan(bounds.max.z)
    asset.dispose()
  })
})
