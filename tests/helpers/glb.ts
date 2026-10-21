import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

interface Primitive {
  attributes: Record<string, number>
  indices?: number
  extensions?: { KHR_draco_mesh_compression?: { bufferView: number, attributes: Record<string, number> } }
}
interface GlbDocument {
  scenes: { nodes: number[] }[]
  cameras?: unknown[]
  extensionsUsed?: string[]
  nodes: { name: string, mesh?: number, children?: number[], extras?: Record<string, unknown> }[]
  meshes: { primitives: Primitive[] }[]
  accessors: { bufferView?: number, byteOffset?: number, componentType: number, count: number, type: string }[]
  bufferViews: { byteOffset?: number, byteLength: number, byteStride?: number }[]
  images?: { bufferView?: number, uri?: string }[]
}
interface DracoArray { size(): number, GetValue(index: number): number }
interface DracoAttribute { num_components(): number }
interface DracoMesh { num_points(): number; num_faces(): number }
interface DracoDecoder {
  DecodeArrayToMesh(data: Uint8Array, length: number, mesh: DracoMesh): { ok(): boolean }
  GetFaceFromMesh(mesh: DracoMesh, face: number, output: DracoArray): boolean
  GetAttributeByUniqueId(mesh: DracoMesh, id: number): DracoAttribute
  GetAttributeFloatForAllPoints(mesh: DracoMesh, attribute: DracoAttribute, output: DracoArray): boolean
}
interface DracoModule {
  Decoder: new () => DracoDecoder
  Mesh: new () => DracoMesh
  DracoInt32Array: new () => DracoArray
  DracoFloat32Array: new () => DracoArray
  destroy(object: unknown): void
}
let decoderModule: Promise<DracoModule> | undefined
function decoder() {
  if (!decoderModule) {
    const source = readFileSync('public/draco/draco_wasm_wrapper.js', 'utf8')
    const factory = runInNewContext(`${source}; DracoDecoderModule`, { WebAssembly, TextDecoder, TextEncoder, console, setTimeout, clearTimeout }) as (options: { wasmBinary: Uint8Array }) => Promise<DracoModule>
    decoderModule = factory({ wasmBinary: readFileSync('public/draco/draco_decoder.wasm') })
  }
  return decoderModule
}

export function readRoomGlb() {
  const file = readFileSync('public/models/room.glb')
  const jsonLength = file.readUInt32LE(12)
  const document = JSON.parse(file.subarray(20, 20 + jsonLength).toString()) as GlbDocument
  const binary = file.subarray(28 + jsonLength)
  function primitive(name: string) {
    const node = document.nodes.find(node => node.name === name)
    if (node?.mesh === undefined) throw new Error(`Missing mesh: ${name}`)
    return document.meshes[node.mesh]!.primitives[0]!
  }
  async function attribute(name: string, semantic: string) {
    const mesh = primitive(name)
    const compressed = mesh.extensions?.KHR_draco_mesh_compression
    if (compressed) {
      const module = await decoder()
      const dec = new module.Decoder()
      const geometry = new module.Mesh()
      const values = new module.DracoFloat32Array()
      const view = document.bufferViews[compressed.bufferView]!
      const data = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
      const status = dec.DecodeArrayToMesh(data, data.length, geometry)
      try {
        if (!status.ok()) throw new Error('Draco decode failed')
        const attr = dec.GetAttributeByUniqueId(geometry, compressed.attributes[semantic]!)
        dec.GetAttributeFloatForAllPoints(geometry, attr, values)
        const size = attr.num_components()
        return Array.from({ length: geometry.num_points() }, (_, point) => Array.from({ length: size }, (_, component) => values.GetValue(point * size + component)))
      } finally {
        module.destroy(status); module.destroy(values); module.destroy(geometry); module.destroy(dec)
      }
    }
    const accessor = document.accessors[mesh.attributes[semantic]!]!
    if (!accessor || accessor.bufferView === undefined) throw new Error(`Missing ${semantic} for ${name}`)
    const view = document.bufferViews[accessor.bufferView]!
    const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type]!
    if (accessor.componentType !== 5126) throw new Error('Expected float surface attributes')
    const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    return Array.from({ length: accessor.count }, (_, index) => Array.from({ length: components }, (_, component) => binary.readFloatLE(start + index * (view.byteStride ?? components * 4) + component * 4)))
  }
  async function indices(name: string): Promise<number[]> {
    const mesh = primitive(name), compressed = mesh.extensions?.KHR_draco_mesh_compression
    if (compressed) {
      const module = await decoder(), dec = new module.Decoder(), geometry = new module.Mesh(), face = new module.DracoInt32Array()
      const view = document.bufferViews[compressed.bufferView]!
      const data = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
      const status = dec.DecodeArrayToMesh(data, data.length, geometry)
      try {
        if (!status.ok()) throw new Error('Draco decode failed')
        const result: number[] = []
        for (let i = 0; i < geometry.num_faces(); i++) {
          dec.GetFaceFromMesh(geometry, i, face)
          result.push(face.GetValue(0), face.GetValue(1), face.GetValue(2))
        }
        return result
      } finally { module.destroy(status); module.destroy(face); module.destroy(geometry); module.destroy(dec) }
    }
    if (mesh.indices === undefined) return []
    const accessor = document.accessors[mesh.indices]!, view = document.bufferViews[accessor.bufferView!]!
    const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    return Array.from({ length: accessor.count }, (_, i) => accessor.componentType === 5125 ? binary.readUInt32LE(start + i * 4) : accessor.componentType === 5123 ? binary.readUInt16LE(start + i * 2) : binary.readUInt8(start + i))
  }
  return { document, bytes: file.length, attribute, indices }
}
