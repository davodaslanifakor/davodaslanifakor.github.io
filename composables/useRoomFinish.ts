import { isMesh, isMeshStandardMaterial, isMeshPhysicalMaterial, isWebGLRenderer } from '~/utils/threeGuards'
import { onScopeDispose } from 'vue'
import { CanvasTexture, PMREMGenerator, RepeatWrapping } from 'three'
import type { Material, Object3D, Scene, WebGLRenderTarget, Mesh, MeshStandardMaterial } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createWallLightReveal } from '~/utils/wallLightReveal'
import { createDeskMatBorder } from '~/utils/deskMatBorder'
import { createRoomColorUniforms } from '~/utils/roomColorPalette'
import { applyRoomLayout } from '~/utils/roomLayout'
import { createSubwoofer } from '~/utils/subwoofer'
import { createLibraryFrames } from '~/utils/libraryFrames'
import type { Locale } from '~/content/portfolio'
import type { RoomColorMode } from '~/utils/roomColorPalette'

/** Runtime surface finish and local studio reflections; no remote HDR download. */
export function useRoomFinish() {
  const materials = new Set<Material>()
  const textures: CanvasTexture[] = []
  const originals = new Map<Mesh, Material | Material[]>()
  const emissiveIntensity = new Map<MeshStandardMaterial, number>()
  const wallMaterials = new Set<Material>()
  const wallReveals: ReturnType<typeof createWallLightReveal>[] = []
  const colors = createRoomColorUniforms()
  let deskBorder: ReturnType<typeof createDeskMatBorder> = null
  let libraryFrames: ReturnType<typeof createLibraryFrames> | null = null
  let subwoofer: ReturnType<typeof createSubwoofer> = null
  let environment: WebGLRenderTarget | null = null
  let activeScene: Scene | null = null
  let prepared = false
  let restoreLayout: (() => void) | null = null

  function grain(repeat: number, wood = false) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const context = canvas.getContext('2d')!
    const pixels = context.createImageData(128, 128)
    let seed = 19
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const value = 115 + (seed >>> 28) * 2 + (wood ? Math.sin(Math.floor(i / 4 / 128) * 0.7) * 12 : 0)
      pixels.data.set([value, value, value, 255], i)
    }
    context.putImageData(pixels, 0, 0)
    const texture = new CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.set(wood ? 2 : repeat, repeat)
    textures.push(texture)
    return texture
  }

  function prepare(model: Object3D, locale: Locale = 'en') {
    if (prepared) return
    prepared = true
    restoreLayout = applyRoomLayout(model)
    const plaster = grain(10)
    const fabric = grain(32)
    const wood = grain(6, true)
    const clones = new Map<Material, Material>()
    const wallStrips: Mesh[] = []
    model.traverse((child) => {
      if (!isMesh(child) || originals.has(child)) return
      // The border is an independent effect; keep native mat/rim assets intact.
      if (child.name === 'static_desk_mat' || child.name === 'static_desk_mat_rim') {
        child.castShadow = true
        child.receiveShadow = true
        return
      }
      originals.set(child, child.material)
      const wallStrip = child.name.startsWith('static_style_wall_led_')
      const wallInset = child.name === 'static_style_wall_inset'
      if (wallStrip) wallStrips.push(child)
      const finish = (original: Material) => {
        const interactive = child.name.startsWith('int_')
        const independent = interactive || wallStrip || wallInset
        const cached = independent ? undefined : clones.get(original)
        if (cached) return cached
        const material = original.clone()
        if (!independent) clones.set(original, material)
        materials.add(material)
        if (wallStrip) wallMaterials.add(material)
        if (!isMeshStandardMaterial(material)) return material
        emissiveIntensity.set(material, material.emissiveIntensity)
        if (wallInset) material.color.set('#252b2f')
        // Keep the existing surface detail while refining the desk, floor and rug.
        if (/plaster/.test(material.name) || child.name === 'static_wall' || child.name === 'static_wall_right') {
          material.bumpMap = plaster
          material.bumpScale = 0.0012
          material.roughness = 0.96
        }
        if (/oak|floor_wood/.test(material.name)) {
          material.bumpMap = wood
          material.bumpScale = 0.0005
        }
        if (/floor_wood/.test(material.name)) material.color.set('#71695e')
        if (material.name === 'desk') {
          material.color.set('#30363a')
          material.roughness = 0.82
        }
        if (/soft_wool/.test(material.name)) {
          // Blender's procedural color graph cannot export as glTF PBR.
          material.color.set(material.name.includes('binding') ? '#797c73' : '#96988f')
          material.bumpMap = fabric
          material.bumpScale = 0.00065
          material.roughness = 0.96
          if (isMeshPhysicalMaterial(material)) {
            material.sheen = 0.32
            material.sheenColor.set('#b7b9ae')
            material.sheenRoughness = 0.8
          }
        }
        return material
      }
      child.material = Array.isArray(child.material) ? child.material.map(finish) : finish(child.material)
      child.castShadow = !/wall|floor|rug|led/.test(child.name)
      child.receiveShadow = true
    })
    if (wallStrips.length) wallReveals.push(createWallLightReveal(model, wallStrips, colors))
    deskBorder = createDeskMatBorder(model, colors)
    libraryFrames = createLibraryFrames(model, locale)
    subwoofer = createSubwoofer(model)
  }

  function applyLighting(environmentIntensity: number, ledIntensity: number, accents = 1, wallProgress = 1) {
    if (activeScene) activeScene.environmentIntensity = environmentIntensity
    for (const material of materials) {
      if (!isMeshStandardMaterial(material)) continue
      const authoredLed = /style_(warm|shelf)_led/.test(material.name)
      material.emissiveIntensity = wallMaterials.has(material)
        ? (wallProgress > 0 ? ledIntensity : 0)
        : (authoredLed ? ledIntensity : emissiveIntensity.get(material) ?? 1) * accents
    }
    wallReveals.forEach(reveal => reveal.update(wallProgress, ledIntensity))
    deskBorder?.update(accents)
    libraryFrames?.update(accents)
  }

  function updateHover(hoveredId: string | null, time: number, reducedMotion: boolean) {
    libraryFrames?.animate(hoveredId, time, reducedMotion)
  }

  function updateLocale(locale: Locale) {
    libraryFrames?.updateLocale(locale)
  }

  function updateColors(mode: RoomColorMode, seconds?: number, pulse = 1, drive = 0, jokerGlow = 0) {
    colors.colorRgb.value = mode === 'rgb' ? 1 : 0
    colors.musicPulse.value = pulse
    colors.musicDrive.value = drive
    colors.jokerGlow.value = jokerGlow
    if (seconds !== undefined) colors.colorTime.value = seconds
  }

  function lightStudio(context: { scene: { value: Scene }, renderer: { instance: unknown } }) {
    if (!isWebGLRenderer(context.renderer.instance)) return
    environment?.dispose()
    const studio = new RoomEnvironment()
    const generator = new PMREMGenerator(context.renderer.instance)
    environment = generator.fromScene(studio, 0.06, 0.1, 100, { size: 128 })
    activeScene = context.scene.value
    activeScene.environment = environment.texture
    activeScene.environmentIntensity = 0
    studio.dispose()
    generator.dispose()
  }

  onScopeDispose(() => {
    if (activeScene?.environment === environment?.texture && activeScene) activeScene.environment = null
    environment?.dispose()
    wallReveals.forEach(reveal => reveal.dispose())
    subwoofer?.dispose()
    deskBorder?.dispose()
    libraryFrames?.dispose()
    for (const [mesh, original] of originals) mesh.material = original
    for (const material of materials) material.dispose()
    for (const texture of textures) texture.dispose()
    restoreLayout?.()
  })

  return { prepare, lightStudio, applyLighting, updateColors, updateLocale, updateHover, updateSpeaker: (time: number, actionTime: number | null, reduced: boolean, music = 0) => subwoofer?.update(time, actionTime, reduced, music) }
}
