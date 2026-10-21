import type { MeshStandardMaterial, Object3D, Texture } from 'three'
import { isMesh, isMeshStandardMaterial } from './threeGuards'

/** Bind artwork to both PBR channels so screens remain legible independent of room lights. */
export function bindRoomScreens(root: Object3D, textures: ReadonlyMap<string, Texture>, intensity: number) {
  const bound: MeshStandardMaterial[] = []
  root.traverse((child) => {
    if (!isMesh(child)) return
    const texture = textures.get(child.name)
    if (!texture) return
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      if (!isMeshStandardMaterial(material)) continue
      material.map = texture
      material.emissiveMap = texture
      material.emissive.setRGB(1, 1, 1)
      material.emissiveIntensity = intensity
      material.color.setRGB(0, 0, 0)
      material.toneMapped = false
      material.needsUpdate = true
      bound.push(material)
    }
  })
  return bound
}
