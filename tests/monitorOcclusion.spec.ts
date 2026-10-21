import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { convexScreenHull, laptopLidCorners, monitorOcclusionPath } from '../utils/monitorOcclusion'
import { readRoomGlb } from './helpers/glb'

describe('monitor DOM depth masking', () => {
  it('cuts only the nearer laptop silhouette out of the monitor overlay and follows camera movement', () => {
    const model = new Group(), lid = new Group()
    lid.name = 'root_laptop_lid'
    lid.add(new Mesh(new BoxGeometry(1, 1, 0.02)))
    model.add(lid)
    const cached = laptopLidCorners(model)
    const camera = new PerspectiveCamera(40, 2, 0.1, 100)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    const screen = [new Vector3(-2, 1, -1), new Vector3(2, 1, -1), new Vector3(2, -1, -1), new Vector3(-2, -1, -1)]
    const before = monitorOcclusionPath(cached, screen, camera, 1000, 500)
    expect(before).toMatch(/^path\(evenodd, "M 0 0 H 1000 V 500 H 0 Z M /)
    camera.position.x = 1
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    expect(monitorOcclusionPath(cached, screen, camera, 1000, 500)).not.toBe(before)
    // A laptop behind the big monitor must never erase its UI.
    lid.position.z = -3
    expect(monitorOcclusionPath(cached, screen, camera, 1000, 500)).toBeUndefined()
    expect(monitorOcclusionPath(null, screen, camera, 1000, 500)).toBeUndefined()
  })

  it('uses a convex silhouette without internal points or a self-intersecting cutout', () => {
    const hull = convexScreenHull([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 5, y: 5 }, { x: 10, y: 0 }, { x: 0, y: 0 }])
    expect(hull).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }])
  })

  it('keeps tight bounds around the shipped tilted MacBook lid, including its bezel', async () => {
    const asset = readRoomGlb(), model = new Group()
    const lidNode = asset.document.nodes.find(node => node.name === 'root_laptop_lid')!
    const laptopNode = asset.document.nodes.find(node => node.name === 'root_laptop')!
    function applyPose(group: Group | Mesh, node: unknown) {
      const pose = node as { translation?: [number, number, number]; rotation?: [number, number, number, number]; scale?: [number, number, number] }
      if (pose.translation) group.position.fromArray(pose.translation)
      if (pose.rotation) group.quaternion.fromArray(pose.rotation)
      if (pose.scale) group.scale.fromArray(pose.scale)
    }
    const laptop = new Group(), lid = new Group()
    lid.name = lidNode.name
    applyPose(laptop, laptopNode)
    laptop.position.x -= 0.25
    applyPose(lid, lidNode)
    model.add(laptop); laptop.add(lid)
    for (const index of lidNode.children!) {
      const node = asset.document.nodes[index]!
      if (node.mesh === undefined) continue
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new Float32BufferAttribute((await asset.attribute(node.name, 'POSITION')).flat(), 3))
      const mesh = new Mesh(geometry)
      mesh.name = node.name
      applyPose(mesh, node)
      lid.add(mesh)
    }
    const cached = laptopLidCorners(model)!
    expect(cached.points).toHaveLength(8)
    const xs = cached.points.map(point => point.x), ys = cached.points.map(point => point.y)
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(0.3557, 2)
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.02)
    const camera = new PerspectiveCamera(38, 1.8, 0.05, 50)
    camera.position.set(-0.25, 1.125, 1.1)
    camera.lookAt(-0.25, 1.125, -0.2)
    camera.updateMatrixWorld()
    expect(monitorOcclusionPath(cached, [new Vector3(-0.25, 1.1, -0.158)], camera, 1200, 700)).toMatch(/^path\(evenodd/)
  })
})
