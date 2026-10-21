import { mount } from '@vue/test-utils'
import { effectScope } from 'vue'
import { BoxGeometry, Group, Mesh, PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it, vi } from 'vitest'
import JokerCardGame from '../components/games/JokerCardGame.vue'
import { useJokerCardGame } from '../composables/useJokerCardGame'
import { jokerFocus, jokerStage } from '../utils/jokerGameScene'
import { readRoomGlb } from './helpers/glb'

function modelFixture() {
  const model = new Group(), toy = new Group()
  const node = readRoomGlb().document.nodes.find(node => node.name === 'root_bugjar')! as unknown as { name: string; translation: [number, number, number]; rotation: [number, number, number, number] }
  toy.name = node.name
  toy.position.fromArray(node.translation)
  toy.position.x -= 0.25
  toy.quaternion.fromArray(node.rotation)
  const geometry = new BoxGeometry(0.048, 0.07, 0.048)
  const body = new Mesh(geometry)
  body.position.y = 0.035
  toy.add(body); model.add(toy)
  model.updateMatrixWorld(true)
  return { model, toy, geometry }
}

describe('Joker scene presentation', () => {
  it('frames the shipped toy location and tray inside desktop and portrait viewports', () => {
    const { model, geometry } = modelFixture()
    try {
      for (const [width, height] of [[1280, 800], [390, 844], [667, 375]]) {
        const focus = jokerFocus(model, width! / height!, height)
        const camera = new PerspectiveCamera(38, width! / height!, 0.05, 50)
        camera.position.copy(focus.position); camera.lookAt(focus.target); camera.updateMatrixWorld()
        const stage = jokerStage(model)
        const points = [stage.anchor.clone().setY(stage.top), ...[-0.136, 0.136].flatMap(x => [-0.063, 0.063].map(z => stage.tray.clone().add(new Vector3(x, 0, z))))]
        for (const point of points) {
          point.project(camera)
          expect(Math.abs(point.x)).toBeLessThan(0.98)
          expect(Math.abs(point.y)).toBeLessThan(0.98)
          expect(point.z).toBeGreaterThan(-1)
          expect(point.z).toBeLessThan(1)
          if (height! > 560) expect((1 - point.y) * height! / 2).toBeLessThan(height! - 280)
          else expect((point.x + 1) * width! / 2).toBeLessThan(width! - 336)
        }
      }
    } finally { geometry.dispose() }
  })

  it('animates the existing figure, restores its authored pose and disposes game resources', async () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect() {}, strokeRect() {}, beginPath() {}, rect() {}, clip() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, closePath() {}, save() {}, restore() {},
    } as unknown as CanvasRenderingContext2D)
    const { model, toy, geometry } = modelFixture()
    const scope = effectScope()
    const game = scope.run(() => useJokerCardGame({ active: () => true, reducedMotion: () => false }))!
    const original = toy.quaternion.clone(), position = toy.position.clone()
    const wrapper = mount(JokerCardGame, { props: { model, state: game.state.value, reducedMotion: false, ready: true }, global: { stubs: { primitive: true } } })
    const dispose = vi.spyOn(wrapper.vm.pickTargets[0]!.geometry, 'dispose')
    try {
      wrapper.vm.updateFrame(0)
      wrapper.vm.updateFrame(100)
      expect(toy.quaternion.equals(original)).toBe(false)
      await wrapper.setProps({ reducedMotion: true })
      wrapper.vm.updateFrame(200)
      expect(toy.quaternion.equals(original)).toBe(true)
      expect(toy.position.equals(position)).toBe(true)
    } finally {
      wrapper.unmount(); scope.stop(); canvas.mockRestore(); geometry.dispose()
    }
    expect(toy.quaternion.equals(original)).toBe(true)
    expect(toy.position.equals(position)).toBe(true)
    expect(dispose).toHaveBeenCalledOnce()
  })
})
