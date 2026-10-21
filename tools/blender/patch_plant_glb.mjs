// Temporary sandbox-safe export of the procedural shelf plant. The Blender
// builder remains the source of truth and will replace this patch on a full run.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const modelPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/models/room.glb')
const source = fs.readFileSync(modelPath)
if (source.toString('utf8', 0, 4) !== 'glTF') throw new Error('Expected a GLB')
const jsonLength = source.readUInt32LE(12)
const gltf = JSON.parse(source.toString('utf8', 20, 20 + jsonLength))
if (gltf.nodes.some(node => node.name === 'root_display_plant')) {
  console.log('Shelf plant already present; no patch needed')
  process.exit(0)
}

const existingBinOffset = 20 + jsonLength + 8
const existingBin = source.subarray(existingBinOffset, existingBinOffset + gltf.buffers[0].byteLength)
const groups = new Map()
const tau = Math.PI * 2
const addTriangle = (material, a, b, c) => {
  const ab = b.map((v, i) => v - a[i])
  const ac = c.map((v, i) => v - a[i])
  const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]]
  const magnitude = Math.hypot(...cross) || 1
  const normal = cross.map(v => v / magnitude)
  const group = groups.get(material) ?? { positions: [], normals: [] }
  for (const vertex of [a, b, c]) {
    group.positions.push(vertex[0], vertex[2], -vertex[1])
    group.normals.push(normal[0], normal[2], -normal[1])
  }
  groups.set(material, group)
}
const quad = (m, a, b, c, d) => {
  addTriangle(m, a, b, c)
  addTriangle(m, a, c, d)
}
const lathe = (material, profile, segments = 28) => {
  for (let j = 0; j < profile.length; j++) {
    const [r0, z0] = profile[j]
    const [r1, z1] = profile[(j + 1) % profile.length]
    for (let i = 0; i < segments; i++) {
      const a = tau * i / segments, b = tau * (i + 1) / segments
      quad(material,
        [r0 * Math.cos(a), r0 * Math.sin(a), z0],
        [r0 * Math.cos(b), r0 * Math.sin(b), z0],
        [r1 * Math.cos(b), r1 * Math.sin(b), z1],
        [r1 * Math.cos(a), r1 * Math.sin(a), z1])
    }
  }
}
const tube = (material, a, b, radius, segments = 6) => {
  const axis = b.map((v, i) => v - a[i])
  const axisLength = Math.hypot(...axis)
  const n = axis.map(v => v / axisLength)
  const tangent = [-n[1], n[0], 0]
  const tangentLength = Math.hypot(...tangent) || 1
  const u = tangent.map(v => v / tangentLength)
  const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]]
  const ring = (origin, angle) => origin.map((coord, i) => coord + radius * (u[i] * Math.cos(angle) + v[i] * Math.sin(angle)))
  for (let i = 0; i < segments; i++) {
    const first = tau * i / segments, second = tau * (i + 1) / segments
    quad(material, ring(a, first), ring(a, second), ring(b, second), ring(b, first))
  }
}

lathe('clay', [[.034,.002],[.039,.006],[.049,.070],[.050,.079],[.043,.079],[.040,.067]])
lathe('rim', [[.048,.068],[.054,.071],[.055,.084],[.052,.088],[.045,.088],[.043,.084],[.043,.076]])
for (let i = 0; i < 28; i++) {
  const a = tau * i / 28, b = tau * (i + 1) / 28
  addTriangle('soil', [0,0,.078], [.043*Math.cos(a),.043*Math.sin(a),.078], [.043*Math.cos(b),.043*Math.sin(b),.078])
}
const outline = [[0,0],[-.29,.04],[-.48,.20],[-.50,.40],[-.38,.65],[-.18,.86],[0,1],[.18,.86],[.38,.65],[.50,.40],[.48,.20],[.29,.04]]
for (let i = 0; i < 13; i++) {
  const angle = i * tau / 13 + .18
  const reach = .052 + (i % 4) * .006
  const crown = [.004*Math.cos(angle),.004*Math.sin(angle),.079]
  const base = [reach*Math.cos(angle),reach*Math.sin(angle),.128+(i%5)*.009]
  const middle = [base[0]*.56,base[1]*.56,base[2]*.83]
  tube('stem',crown,middle,.0017)
  tube('stem',middle,base,.0017)
  const direction = [Math.cos(angle),Math.sin(angle),.30+(i%3)*.11]
  const side = [-Math.sin(angle),Math.cos(angle),0]
  const length = .064+(i%4)*.006, width = .055+(i%3)*.005
  const center = [base[0]+direction[0]*length*.51-.002,base[1]+direction[1]*length*.51,base[2]+direction[2]*length*.51+.004]
  const perimeter = outline.map(([across,along]) => [
    base[0]+direction[0]*length*along+side[0]*width*across,
    base[1]+direction[1]*length*along+side[1]*width*across,
    base[2]+direction[2]*length*along+.004*Math.sin(Math.PI*along),
  ])
  for (let p = 0; p < perimeter.length; p++) {
    const next = (p+1)%perimeter.length
    addTriangle(`leaf${i%3}`,center,perimeter[p],perimeter[next])
    addTriangle(`leaf${i%3}`,center,perimeter[next],perimeter[p])
  }
}

const colors = {
  clay: [.43,.22,.13,1], rim: [.51,.28,.17,1], soil: [.15,.12,.09,1], stem: [.20,.31,.14,1],
  leaf0: [.27,.43,.20,1], leaf1: [.22,.35,.13,1], leaf2: [.36,.49,.23,1],
}
const mesh = { name: 'static_potted_plant', primitives: [] }
const appended = []
let nextOffset = existingBin.length
const align = () => {
  const pad = (4-nextOffset%4)%4
  if (pad) { appended.push(Buffer.alloc(pad)); nextOffset += pad }
}
for (const [name, data] of groups) {
  const attributes = {}
  for (const [semantic, numbers] of [['POSITION',data.positions],['NORMAL',data.normals]]) {
    align()
    const bytes = Buffer.from(new Float32Array(numbers).buffer)
    const view = gltf.bufferViews.push({ buffer: 0, byteOffset: nextOffset, byteLength: bytes.length, target: 34962 })-1
    nextOffset += bytes.length
    appended.push(bytes)
    const accessor = { bufferView: view, componentType: 5126, count: numbers.length/3, type: 'VEC3' }
    if (semantic === 'POSITION') {
      accessor.min = [0,1,2].map(axis => Math.min(...numbers.filter((_,index)=>index%3===axis)))
      accessor.max = [0,1,2].map(axis => Math.max(...numbers.filter((_,index)=>index%3===axis)))
    }
    attributes[semantic] = gltf.accessors.push(accessor)-1
  }
  const material = gltf.materials.push({ name: `plant_${name}`, pbrMetallicRoughness: {
    baseColorFactor: colors[name], metallicFactor: 0, roughnessFactor: name === 'soil' ? 1 : .85,
  }, doubleSided: true })-1
  mesh.primitives.push({ attributes, material, mode: 4 })
}
const meshIndex = gltf.meshes.push(mesh)-1
const nodeIndex = gltf.nodes.push({ name: 'root_display_plant', mesh: meshIndex, translation: [1.395,1.322,.215] })-1
gltf.scenes[gltf.scene ?? 0].nodes.push(nodeIndex)
const binary = Buffer.concat([existingBin,...appended])
gltf.buffers[0].byteLength = binary.length
const pad = (buffer, byte) => Buffer.concat([buffer,Buffer.alloc((4-buffer.length%4)%4,byte)])
const json = pad(Buffer.from(JSON.stringify(gltf)),0x20)
const bin = pad(binary,0)
const output = Buffer.alloc(12+8+json.length+8+bin.length)
output.write('glTF',0)
output.writeUInt32LE(2,4)
output.writeUInt32LE(output.length,8)
output.writeUInt32LE(json.length,12)
output.write('JSON',16)
json.copy(output,20)
const binHeader = 20+json.length
output.writeUInt32LE(bin.length,binHeader)
output.write('BIN\0',binHeader+4)
bin.copy(output,binHeader+8)
fs.writeFileSync(modelPath,output)
console.log(`Added procedural plant to ${modelPath} (${output.length} bytes)`)
