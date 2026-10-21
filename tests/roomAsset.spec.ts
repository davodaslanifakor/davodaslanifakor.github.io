// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { sceneObjects, screenContent } from '../content/portfolio'
import { readRoomGlb } from './helpers/glb'

const asset = readRoomGlb()
const names = asset.document.nodes.map(node => node.name)
function report() { return JSON.parse(readFileSync('tools/blender/review/website-export.json', 'utf8')) }

describe('approved checkpoint GLB', () => {
  it('ships one visible scene, its interactions and retained toys, without archives or review lights', () => {
    expect(asset.document.scenes).toHaveLength(1)
    expect(asset.document.cameras ?? []).toHaveLength(0)
    expect(asset.document.extensionsUsed ?? []).not.toContain('KHR_lights_punctual')
    // Library wall frames and their cameras are runtime-owned (utils/libraryFrames.ts), not GLB nodes.
    for (const object of sceneObjects.filter(object => !object.id.startsWith('library_'))) {
      expect(names).toContain(object.mesh)
      expect(names).toContain(object.camera)
    }
    for (const name of ['root_laptop', 'root_laptop_lid', 'root_screen_left', 'root_screen_right', 'root_paratrooper', 'root_cards', 'root_robot', 'root_bugjar', 'static_style_rug', 'static_style_ultrawide_housing']) expect(names).toContain(name)
    expect(names.some(name => /archive|original|root_plush|int_plush|static_style_display_|static_style_screen_(name|stack|skill)/i.test(name))).toBe(false)
    const exported = report()
    expect(exported.scene).toBe('Room Light')
    expect(exported.omittedObjects.some((name: string) => name.includes('archive_'))).toBe(true)
    expect(exported.sourceObjects.filter((name: string) => /plush/i.test(name))).toEqual(['cam_plush'])
    expect(exported.checkpointSha256).toBe(createHash('sha256').update(readFileSync(exported.checkpoint)).digest('hex'))
  })

  it('preserves the laptop flat +Z Blender surface, full UVs, hierarchy and physical keyboard', async () => {
    const positions = await asset.attribute('int_monitor_screen', 'POSITION')
    // glTF Y-up conversion maps Blender-local +Z to local +Y.
    expect(Math.max(...positions.map(p => p[1]!)) - Math.min(...positions.map(p => p[1]!))).toBeLessThan(1e-5)
    const normals = await asset.attribute('int_monitor_screen', 'NORMAL')
    expect(normals.every(n => n[1]! > 0.99)).toBe(true)
    const uv = await asset.attribute('int_monitor_screen', 'TEXCOORD_0')
    for (const axis of [0, 1]) {
      expect(Math.min(...uv.map(p => p[axis]!))).toBeCloseTo(0, 4)
      expect(Math.max(...uv.map(p => p[axis]!))).toBeCloseTo(1, 4)
    }
    const screenIndex = names.indexOf('int_monitor_screen')
    expect(asset.document.nodes.find(n => n.name === 'root_laptop_lid')?.children).toContain(screenIndex)
    expect(asset.document.nodes.find(n => n.name === 'static_laptop_keycaps')?.extras?.key_count).toBe(78)
    expect(names.some(name => name.startsWith('static_mac_speaker_grilles'))).toBe(true)
  })

  it('preserves curved half UVs, carpet UVs and all real-time hand pivots', async () => {
    for (const [name, min, max] of [['int_screen_left', 0, 0.5], ['int_screen_right', 0.5, 1]] as const) {
      const uv = await asset.attribute(name, 'TEXCOORD_0')
      expect(Math.min(...uv.map(p => p[0]!))).toBeCloseTo(min, 4)
      expect(Math.max(...uv.map(p => p[0]!))).toBeCloseTo(max, 4)
      const positions = await asset.attribute(name, 'POSITION')
      expect(new Set(positions.map(p => p[2]!.toFixed(4))).size).toBeGreaterThan(10)
    }
    expect((await asset.attribute('static_style_rug', 'TEXCOORD_0')).length).toBeGreaterThan(4)
    for (const city of screenContent.cities) for (const hand of ['hour', 'minute', 'second']) {
      const meshId = city.id === 'atlantic' ? 'reykjavik' : city.id
      const pivot = asset.document.nodes.find(n => n.name === `static_world_clock_${meshId}_${hand}_pivot`)
      expect(pivot?.children?.length).toBeGreaterThan(0)
    }
  })

  it('enforces exact byte budgets including embedded and external images', () => {
    expect(asset.bytes).toBeLessThanOrEqual(3_000_000)
    const embedded = (asset.document.images ?? []).reduce((sum, image) => sum + (image.bufferView === undefined ? 0 : asset.document.bufferViews[image.bufferView]!.byteLength), 0)
    expect((asset.document.images ?? []).some(image => image.uri)).toBe(false)
    let external = 0
    try {
      for (const entry of readdirSync('public/textures', { recursive: true, withFileTypes: true })) if (entry.isFile()) external += statSync(`${entry.parentPath}/${entry.name}`).size
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    expect(embedded + external).toBeLessThanOrEqual(4_000_000)
    expect(report()).toMatchObject({ bytes: asset.bytes, embeddedImageBytes: embedded, externalImageBytes: external })
  })
})
