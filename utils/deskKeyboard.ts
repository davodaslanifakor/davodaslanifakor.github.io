import { Box3, BufferAttribute, BufferGeometry, Vector3 } from 'three'
import type { Mesh } from 'three'
import { keyboardRows } from '../content/portfolio'

export interface KeyboardPart { vertices: number[]; indices: number[]; center: Vector3; bounds: Box3 }
/** Recover each disconnected keycap from the exported batch without changing the GLB. */
export function keyboardParts(mesh: Mesh): KeyboardPart[] {
  const geometry = mesh.geometry, position = geometry.getAttribute('position')
  if (!position) return []
  const parents = Array.from({ length: position.count }, (_, i) => i)
  const find = (i: number): number => { while (parents[i] !== i) { parents[i] = parents[parents[i]!]!; i = parents[i]! } return i }
  const join = (a: number, b: number) => { parents[find(a)] = find(b) }
  const welded = new Map<string, number>()
  for (let i = 0; i < position.count; i++) {
    const key = [position.getX(i), position.getY(i), position.getZ(i)].map(v => Math.round(v * 1e6)).join(',')
    const previous = welded.get(key)
    if (previous !== undefined) join(i, previous)
    else welded.set(key, i)
  }
  const index = geometry.index, count = index?.count ?? position.count
  const vertex = (i: number) => index ? index.getX(i) : i
  for (let i = 0; i < count; i += 3) { join(vertex(i), vertex(i + 1)); join(vertex(i), vertex(i + 2)) }
  const parts = new Map<number, KeyboardPart>()
  for (let i = 0; i < position.count; i++) {
    const root = find(i)
    let part = parts.get(root)
    if (!part) { part = { vertices: [], indices: [], center: new Vector3(), bounds: new Box3() }; parts.set(root, part) }
    part.vertices.push(i)
    part.bounds.expandByPoint(new Vector3(position.getX(i), position.getY(i), position.getZ(i)))
  }
  for (let i = 0; i < count; i++) parts.get(find(vertex(i)))!.indices.push(vertex(i))
  return [...parts.values()].map(part => { part.bounds.getCenter(part.center); return part }).sort((a, b) => a.center.z - b.center.z || a.center.x - b.center.x)
}
export function keyGeometry(source: BufferGeometry, part: KeyboardPart) {
  const geometry = new BufferGeometry(), mapping = new Map(part.vertices.map((vertex, index) => [vertex, index]))
  for (const name of Object.keys(source.attributes)) {
    const attribute = source.getAttribute(name), values: number[] = []
    for (const index of part.vertices) for (let component = 0; component < attribute.itemSize; component++) values.push(attribute.getComponent(index, component))
    geometry.setAttribute(name, new BufferAttribute(new Float32Array(values), attribute.itemSize))
  }
  geometry.setIndex(part.indices.map(index => mapping.get(index)!))
  return geometry
}

/** Match physical rows to the same legends used by the Blender keyboard builder. */
export function keyboardLayout(centers: readonly { x: number; z: number }[]) {
  const groups: { index: number; x: number; z: number }[][] = []
  for (const key of centers.map((center, index) => ({ ...center, index })).sort((a, b) => a.z - b.z)) {
    const row = groups.at(-1)
    if (row && Math.abs(row[0]!.z - key.z) < 0.002) row.push(key)
    else groups.push([key])
  }
  const map: Record<string, number> = {}
  for (let row = 0; row < 6; row++) {
    const expected = keyboardRows[row]!
    const keys = row < 5 ? groups[row] : groups.slice(5).find(group => group.length === expected.length)
    // A different or incomplete export must not silently target the wrong keys.
    if (!keys || keys.length !== expected.length) return {}
    keys.sort((a, b) => a.x - b.x).forEach((key, column) => { map[expected[column]!.id] = key.index })
  }
  return map
}

export function keyboardKeyId(key: string, code = ''): string | null {
  let legend = key.length === 1 ? key.toUpperCase() : key
  if (/^Key[A-Z]$/.test(code)) legend = code.slice(3)
  else if (/^Digit\d$/.test(code)) legend = code.slice(5)
  else if (code in codeLegends) legend = codeLegends[code]!
  else if (key in persianLegends) legend = persianLegends[key]!
  else if (key in shiftedLegends) legend = shiftedLegends[key]!
  if (legend === ' ' || key === 'Spacebar') return 'space'
  if (legend === 'Enter') return 'return'
  if (legend === 'Backspace') return 'num-13'
  const found = keyboardRows.slice(0, 6).flat().find(item => item.legend === legend)
  return found?.id ?? null
}
const codeLegends: Record<string, string> = { Backquote: '~', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Space: ' ', Enter: 'Enter', Backspace: 'Backspace' }
const shiftedLegends: Record<string, string> = { '`': '~', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/' }

const persianLegends: Record<string, string> = Object.fromEntries([...'ضصثقفغعهخحجچپشسیبلاتنمکگظطزرذدئو'].map((letter, index) => [letter, [..."QWERTYUIOP[]\\ASDFGHJKL;'ZXCVBNM,"][index]!]))
