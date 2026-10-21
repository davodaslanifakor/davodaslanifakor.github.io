import { effectScope } from 'vue'
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'
import { describe, expect, it } from 'vitest'
import { useHoverMotion } from '../composables/useHoverMotion'

function setup() {
  const model = new Group()
  const toy = new Group()
  toy.name = 'root_robot'
  toy.scale.set(0.7, 1.2, 0.9)
  model.add(toy)
  const frame = new Group()
  frame.name = 'root_library_frame_about'
  const material = new MeshBasicMaterial({ color: 0xffffff })
  const face = new Mesh(new PlaneGeometry(), material)
  face.name = 'int_library_about'
  frame.add(face)
  model.add(frame)
  const state = { hovered: null as string | null, reduced: false, music: false }
  const scope = effectScope()
  const motion = scope.run(() => useHoverMotion({ model: () => model, hoveredId: () => state.hovered, reducedMotion: () => state.reduced, musicSelected: () => state.music, accents: () => 1 }))!
  motion.updateFrame(0)
  return { toy, material, state, scope, motion }
}

describe('hover motion', () => {
  it('settles at 1.08 and restores nonuniform authored scales exactly on leave and disposal', () => {
    const { toy, state, scope, motion } = setup()
    const original = toy.scale.clone()
    state.hovered = 'robot'
    motion.updateFrame(10)
    motion.updateFrame(260)
    expect(toy.scale.toArray()).toEqual(original.clone().multiplyScalar(1.08).toArray())
    state.hovered = null
    motion.updateFrame(270)
    motion.updateFrame(520)
    expect(toy.scale.equals(original)).toBe(true)
    state.hovered = 'robot'
    motion.updateFrame(530)
    motion.updateFrame(630)
    scope.stop()
    expect(toy.scale.equals(original)).toBe(true)
  })

  it('suppresses spring, pulse and flicker immediately when reduced motion is enabled', () => {
    const { toy, state, scope, motion, material } = setup()
    const original = toy.scale.clone()
    state.hovered = 'robot'
    state.music = true
    motion.updateFrame(10)
    motion.updateFrame(100)
    expect(toy.scale.equals(original)).toBe(false)
    state.reduced = true
    motion.updateFrame(110)
    expect(toy.scale.equals(original)).toBe(true)
    state.hovered = 'library_about'
    motion.updateFrame(120)
    motion.updateFrame(210)
    expect(material.color.r).toBe(1)
    scope.stop()
  })

  it('briefly dims a hovered frame then restores its brightness', () => {
    const { state, scope, motion, material } = setup()
    state.hovered = 'library_about'
    motion.updateFrame(10)
    motion.updateFrame(100)
    expect(material.color.r).toBeCloseTo(0.8)
    motion.updateFrame(260)
    expect(material.color.r).toBe(1)
    scope.stop()
  })
})
