import { isMeshStandardMaterial } from '~/utils/threeGuards'
import { AdditiveBlending, Box3, Color, DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three'
import type { Object3D } from 'three'
import { createRoomColorUniforms, roomColorPalette } from './roomColorPalette'

// Shared by the native strip and its halo: both follow the authored world-space
// endpoints, regardless of the strip's local rotation or nonuniform scale.
const revealDeclarations = `
  uniform float revealProgress;
  uniform float revealStart;
  uniform float revealEnd;
  uniform float revealMin;
  uniform float revealLength;
  uniform vec3 revealAxis;
  varying vec3 vRevealPosition;
  float wallReveal() {
    float travel = clamp((revealProgress - revealStart) / (revealEnd - revealStart), 0.0, 1.0);
    float along = clamp((dot(vRevealPosition, revealAxis) - revealMin) / revealLength, 0.0, 1.0);
    float edge = mix(-0.035, 1.035, travel);
    return 1.0 - smoothstep(edge - 0.025, edge + 0.025, along);
  }
`

/** Owns only added halos/uniforms. Materials belong to useRoomFinish. */
export function createWallLightReveal(model: Object3D, strips: Mesh[], colors = createRoomColorUniforms()) {
  const halos = new Group()
  halos.name = 'runtime_wall_light_halos'
  model.updateWorldMatrix(true, true)
  // Keep planes in authored world coordinates without touching native nodes.
  halos.matrixAutoUpdate = false
  halos.matrix.copy(model.matrixWorld).invert()
  const progress = { value: 0 }
  const strength = { value: 0 }
  const geometry = new PlaneGeometry(1, 1)
  const haloMaterials: ShaderMaterial[] = []
  const allBounds = new Box3()
  const bounds = strips.map(strip => new Box3().setFromObject(strip))
  bounds.forEach(box => allBounds.union(box))

  strips.forEach((strip, index) => {
    const box = bounds[index]!
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const vertical = size.y > size.x
    const top = !vertical && center.y > allBounds.getCenter(new Vector3()).y
    const uniforms = {
      ...colors,
      revealProgress: progress,
      revealStart: { value: top ? 0.7 : 0 },
      revealEnd: { value: top ? 1 : vertical ? 0.7 : 0.12 },
      revealMin: { value: vertical ? box.min.y : box.min.x },
      revealLength: { value: Math.max(0.001, vertical ? size.y : size.x) },
      revealAxis: { value: vertical ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0) },
    }
    const materials = Array.isArray(strip.material) ? strip.material : [strip.material]
    for (const material of materials) {
      if (!isMeshStandardMaterial(material)) continue
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms)
        shader.vertexShader = `varying vec3 vRevealPosition;\n${shader.vertexShader}`
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRevealPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;')
        shader.fragmentShader = roomColorPalette + revealDeclarations + shader.fragmentShader
        shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
          #include <emissivemap_fragment>
          float reveal = wallReveal();
          // Replace only the strip's emission, preserving the authored warm mode.
          float emissionStrength = max(max(totalEmissiveRadiance.r, totalEmissiveRadiance.g), totalEmissiveRadiance.b);
          totalEmissiveRadiance = mix(totalEmissiveRadiance, roomSpectrum(vRevealPosition) * emissionStrength, colorRgb);
          totalEmissiveRadiance = mix(totalEmissiveRadiance, roomJoker(vRevealPosition) * emissionStrength, jokerGlow);
          totalEmissiveRadiance *= reveal;
          diffuseColor.rgb *= 0.02 + 0.98 * reveal;
        `)
      }
      // Include the GLSL source so live updates cannot reuse an older color shader.
      material.customProgramCacheKey = () => `${roomColorPalette}${revealDeclarations}${material.onBeforeCompile.toString()}`
      material.needsUpdate = true
    }

    const haloMaterial = new ShaderMaterial({
      uniforms: { ...uniforms, strength, warm: { value: new Color('#ffc078') }, vertical: { value: vertical ? 1 : 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vRevealPosition;
        void main() {
          vUv = uv;
          vec4 world = modelMatrix * vec4(position, 1.0);
          vRevealPosition = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: roomColorPalette + revealDeclarations + `
        uniform float strength;
        uniform float vertical;
        uniform vec3 warm;
        varying vec2 vUv;
        void main() {
          float across = mix(vUv.y, vUv.x, vertical);
          float along = mix(vUv.x, vUv.y, vertical);
          float halo = pow(max(0.0, 1.0 - abs(across - 0.5) * 2.0), 2.5);
          float ends = smoothstep(0.0, 0.04, along) * (1.0 - smoothstep(0.96, 1.0, along));
          gl_FragColor = vec4(roomAccent(vRevealPosition, warm), halo * ends * wallReveal() * strength);
        }
      `,
      transparent: true, depthTest: true, depthWrite: false, blending: AdditiveBlending,
      side: DoubleSide, toneMapped: false,
    })
    haloMaterials.push(haloMaterial)
    const halo = new Mesh(geometry, haloMaterial)
    halo.name = `runtime_halo_${strip.name}`
    halo.position.copy(center)
    halo.position.z = box.max.z + 0.006
    halo.scale.set(vertical ? 0.18 : size.x + 0.08, vertical ? size.y + 0.08 : 0.18, 1)
    halo.renderOrder = 1
    halos.add(halo)
  })
  model.add(halos)

  return {
    update(value: number, ledIntensity: number) {
      progress.value = value
      strength.value = ledIntensity * 0.12
    },
    dispose() {
      halos.removeFromParent()
      geometry.dispose()
      haloMaterials.forEach(material => material.dispose())
    },
  }
}
