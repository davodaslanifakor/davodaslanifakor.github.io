import { readFileSync } from 'node:fs'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PropertyBinding } from 'three'
import type { Object3D } from 'three'

/** Authored hierarchy and mesh bounds, including real hand/hip pivots, without WebGL. */
export function jokerModel() {
  const file = readFileSync('public/models/joker-adventure.glb')
  const doc = JSON.parse(file.subarray(20, 20 + file.readUInt32LE(12)).toString()) as {
    nodes: { name: string; mesh?: number; children?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }[]
    meshes: { primitives: { attributes: { POSITION: number } }[] }[]
    accessors: { min: number[]; max: number[] }[]
    scenes: { nodes: number[] }[]
  }
  const material = new MeshStandardMaterial()
  const nodes = doc.nodes.map(n => {
    let node: Object3D = new Group()
    if (n.mesh !== undefined) {
      const { min, max } = doc.accessors[doc.meshes[n.mesh]!.primitives[0]!.attributes.POSITION]!
      const geometry = new BoxGeometry(max[0]! - min[0]!, max[1]! - min[1]!, max[2]! - min[2]!)
      geometry.translate((max[0]! + min[0]!) / 2, (max[1]! + min[1]!) / 2, (max[2]! + min[2]!) / 2)
      node = new Mesh(geometry, material)
    }
    node.name = PropertyBinding.sanitizeNodeName(n.name)
    if (n.translation) node.position.fromArray(n.translation)
    if (n.rotation) node.quaternion.fromArray(n.rotation)
    if (n.scale) node.scale.fromArray(n.scale)
    return node
  })
  doc.nodes.forEach((n, i) => n.children?.forEach(c => nodes[i]!.add(nodes[c]!)))
  const root = new Group()
  doc.scenes[0]!.nodes.forEach(i => root.add(nodes[i]!))
  return root
}
