import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import type { Object3D } from 'three'
import { readRoomGlb } from './glb'
import { applyRoomLayout } from '../../utils/roomLayout'

/** Shipped mesh bounds and full node hierarchy, without a browser WebGL context. */
export function deskModel() {
  const document = readRoomGlb().document as unknown as {
    nodes: { name: string; mesh?: number; children?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }[]
    meshes: { primitives: { attributes: { POSITION: number } }[] }[]
    accessors: { min: number[]; max: number[] }[]
    scenes: { nodes: number[] }[]
  }
  const material = new MeshStandardMaterial(), geometries: BoxGeometry[] = []
  const nodes = document.nodes.map(node => {
    let object: Object3D = new Group()
    if (node.mesh !== undefined) {
      const accessor = document.accessors[document.meshes[node.mesh]!.primitives[0]!.attributes.POSITION]!
      const min = accessor.min, max = accessor.max
      const geometry = new BoxGeometry(max[0]! - min[0]!, max[1]! - min[1]!, max[2]! - min[2]!)
      geometry.translate((max[0]! + min[0]!) / 2, (max[1]! + min[1]!) / 2, (max[2]! + min[2]!) / 2)
      geometries.push(geometry); object = new Mesh(geometry, material)
    }
    object.name = node.name
    if (node.translation) object.position.fromArray(node.translation)
    if (node.rotation) object.quaternion.fromArray(node.rotation)
    if (node.scale) object.scale.fromArray(node.scale)
    return object
  })
  document.nodes.forEach((node, i) => node.children?.forEach(child => nodes[i]!.add(nodes[child]!)))
  const model = new Group()
  document.scenes[0]!.nodes.forEach(index => model.add(nodes[index]!))
  applyRoomLayout(model)
  return { model, material, geometries, dispose() { material.dispose(); geometries.forEach(g => g.dispose()) } }
}
