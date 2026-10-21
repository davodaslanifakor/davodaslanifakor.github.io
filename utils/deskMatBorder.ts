import { AdditiveBlending, Color, DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from 'three'
import type { Box3, Object3D } from 'three'
import { createRoomColorUniforms, roomColorPalette } from './roomColorPalette'

function nativeBounds(mesh: Mesh) {
  mesh.geometry.computeBoundingBox()
  return mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld)
}

/** Bounds deliberately exclude children, runtime effects, tools and floor rug. */
export function deskMatBounds(model: Object3D): Box3 | null {
  const mat = model.getObjectByName('static_desk_mat')
  if (!(mat instanceof Mesh)) return null
  model.updateWorldMatrix(true, true)
  const bounds = nativeBounds(mat)
  const rim = model.getObjectByName('static_desk_mat_rim')
  if (rim instanceof Mesh) bounds.union(nativeBounds(rim))
  return bounds.isEmpty() ? null : bounds
}

/** Owns a thin horizontal ring, with its core and outer glow in one cheap draw. */
export function createDeskMatBorder(model: Object3D, colors = createRoomColorUniforms()) {
  const bounds = deskMatBounds(model)
  if (!bounds) return null
  const size = bounds.getSize(new Vector3())
  if (size.x <= 0 || size.z <= 0) return null
  const center = bounds.getCenter(new Vector3())
  const group = new Group()
  group.name = 'runtime_desk_mat_border'
  // Cancel the model transform: geometry below is placed in native world metres.
  group.matrixAutoUpdate = false
  group.matrix.copy(model.matrixWorld).invert()
  const padding = 0.007
  const geometry = new PlaneGeometry(size.x + padding * 2, size.z + padding * 2)
  const fade = { value: 0 }
  const material = new ShaderMaterial({
    uniforms: {
      ...colors, fade,
      halfSize: { value: new Vector2(size.x / 2 - 0.0014, size.z / 2 - 0.0014) },
      radius: { value: Math.min(0.017, size.x / 4, size.z / 4) },
      warm: { value: new Color('#ffc078') },
    },
    vertexShader: `
      varying vec2 vMatPosition;
      varying vec3 vAccentPosition;
      void main() {
        vMatPosition = position.xy;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vAccentPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: roomColorPalette + `
      uniform vec2 halfSize;
      uniform float radius;
      uniform float fade;
      uniform vec3 warm;
      varying vec2 vMatPosition;
      varying vec3 vAccentPosition;
      void main() {
        vec2 q = abs(vMatPosition) - halfSize + radius;
        float distanceToEdge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
        float aa = max(fwidth(distanceToEdge), 0.0002);
        // 2.5 mm core, 5 mm soft outer halo. Discard the entire mat interior.
        if (distanceToEdge < -0.00125 - aa || distanceToEdge > 0.0065 || fade <= 0.0) discard;
        float core = 1.0 - smoothstep(0.00125 - aa, 0.00125 + aa, abs(distanceToEdge));
        float halo = (1.0 - smoothstep(0.00125, 0.0065, distanceToEdge)) * step(0.0, distanceToEdge);
        gl_FragColor = vec4(roomAccent(vAccentPosition, warm), fade * (core * 0.86 + halo * 0.14));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true, depthTest: true, depthWrite: false,
    blending: AdditiveBlending, side: DoubleSide, toneMapped: false,
  })
  const ring = new Mesh(geometry, material)
  ring.name = 'runtime_desk_mat_ring'
  ring.rotation.x = -Math.PI / 2
  ring.position.set(center.x, bounds.max.y + 0.001, center.z)
  ring.renderOrder = 1
  group.add(ring)
  group.visible = false
  model.add(group)
  return {
    update(accents: number) {
      fade.value = Math.min(1, Math.max(0, accents))
      group.visible = fade.value > 0
    },
    dispose() {
      group.removeFromParent()
      geometry.dispose()
      material.dispose()
    },
  }
}
