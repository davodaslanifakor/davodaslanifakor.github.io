<script setup lang="ts">
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { Quaternion, Scene, Vector3 } from 'three'
import type { Mesh, Object3D, PerspectiveCamera } from 'three'
import type { Locale } from '~/content/portfolio'
import { localize, ui } from '~/content/portfolio'
import MiniEditor from '~/components/editor/MiniEditor.vue'

interface Props {
  active: boolean
  camera: PerspectiveCamera | null
  locale: Locale
  model: Object3D | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()
const mount = useTemplateRef<HTMLDivElement>('mount')
const surface = useTemplateRef<HTMLDivElement>('surface')
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')

watch(() => props.active, async (active) => {
  if (!active) return
  await nextTick()
  closeButton.value?.focus()
})

let renderer: CSS3DRenderer | null = null
let cssObject: CSS3DObject | null = null
let cssScene: Scene | null = null
let frame = 0
let resizeObserver: ResizeObserver | null = null

const SURFACE_WIDTH = 840
const GLTF_PLANE_TO_CSS = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)
let measuredScreen: Object3D | null = null
let surfaceRatio = 840 / 492
let worldWidth = 0

function syncObject() {
  if (!cssObject || !props.model) return
  const screen = props.model.getObjectByName('int_monitor_screen')
  if (!screen) return

  screen.updateWorldMatrix(true, false)
  screen.getWorldPosition(cssObject.position)
  screen.getWorldQuaternion(cssObject.quaternion)
  // The Y-up glTF export maps the plane's Blender +Z normal to local +Y (and its
  // up edge to local -Z); turn the CSS plane, which faces its own +Z, to match.
  cssObject.quaternion.multiply(GLTF_PLANE_TO_CSS)

  if (measuredScreen !== screen) {
    const geometry = (screen as Mesh).geometry
    geometry.computeBoundingBox()
    const bounds = geometry.boundingBox
    if (bounds) {
      const lowerLeft = screen.localToWorld(new Vector3(bounds.min.x, bounds.min.y, bounds.min.z))
      const lowerRight = screen.localToWorld(new Vector3(bounds.max.x, bounds.min.y, bounds.min.z))
      const upperLeft = screen.localToWorld(new Vector3(bounds.min.x, bounds.max.y, bounds.max.z))
      worldWidth = lowerLeft.distanceTo(lowerRight)
      const worldHeight = lowerLeft.distanceTo(upperLeft)
      if (worldWidth > 0 && worldHeight > 0) surfaceRatio = worldWidth / worldHeight
      const desiredHeight = SURFACE_WIDTH / surfaceRatio
      if (surface.value && Math.abs(surface.value.clientHeight - desiredHeight) > 0.5) {
        surface.value.style.height = `${desiredHeight}px`
      }
    }
    measuredScreen = screen
  }
  const scale = worldWidth / SURFACE_WIDTH
  cssObject.scale.setScalar(scale)

  // Sit a hair in front of the emissive plane to prevent visual z-fighting.
  const normal = new Vector3(0, 0, 1).applyQuaternion(cssObject.quaternion)
  cssObject.position.addScaledVector(normal, 0.0015)
}

function resize() {
  const element = mount.value
  if (!renderer || !element) return
  renderer.setSize(element.clientWidth, element.clientHeight)
}

function render() {
  if (renderer && cssScene && props.camera) {
    syncObject()
    renderer.render(cssScene, props.camera)
  }
  frame = requestAnimationFrame(render)
}

onMounted(() => {
  if (!mount.value || !surface.value) return
  renderer = new CSS3DRenderer()
  renderer.domElement.className = 'monitor-editor-renderer'
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.inset = '0'
  mount.value.appendChild(renderer.domElement)

  cssScene = new Scene()
  cssObject = new CSS3DObject(surface.value)
  cssObject.name = 'monitor-editor-dom'
  cssScene.add(cssObject)

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(mount.value)
  resize()
  render()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  renderer?.domElement.remove()
  cssObject?.removeFromParent()
})
</script>

<template>
  <div
    ref="mount"
    class="monitor-editor-host"
    :class="{ 'monitor-editor-host--active': props.active }"
    :aria-hidden="!props.active"
    :inert="!props.active"
    :role="props.active ? 'dialog' : undefined"
    :aria-modal="props.active ? true : undefined"
    :aria-label="props.active ? localize(ui.editorTitle, props.locale) : undefined"
  >
    <button v-if="props.active" ref="closeButton" class="monitor-editor-close" type="button" @click="emit('close')">← {{ localize(ui.back, props.locale) }}</button>
  </div>
  <div ref="surface" class="monitor-editor-surface">
    <MiniEditor :locale="props.locale" compact />
  </div>
</template>

<style scoped>
.monitor-editor-host {
  position: absolute;
  z-index: 4;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 180ms ease;
}

.monitor-editor-host--active {
  pointer-events: auto;
  opacity: 1;
}
.monitor-editor-close { position: absolute; z-index: 2; inset-block-end: 7rem; inset-inline-end: 2rem; min-height: 2.75rem; border: 1px solid #c6d8a2; border-radius: .5rem; padding: .65rem .9rem; background: #111814; color: #c6d8a2; font: .75rem/1 var(--font-mono); pointer-events: auto; }

.monitor-editor-surface {
  width: 840px;
  height: 553px;
  overflow: hidden;
  background: #0c0e11;
  backface-visibility: hidden;
}

@media (max-width: 760px) {
  .monitor-editor-host,
  .monitor-editor-surface {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .monitor-editor-host { transition: none; }
}
</style>
