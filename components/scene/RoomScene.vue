<script setup lang="ts">
import { OrbitControls, useGLTF, useProgress } from '@tresjs/cientos'
import { computed, shallowRef, toRaw, useTemplateRef, watch, watchEffect } from 'vue'
import { Box3, Color, Mesh, MeshStandardMaterial, ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace, Vector3 } from 'three'
import type { Material, Object3D, PerspectiveCamera } from 'three'
import type { MusicPlayback, MusicPlaybackUpdate } from '~/utils/musicPlayback'
import type { ScreenThemeId } from '~/utils/screenTheme'
import type { Locale, SceneObject } from '~/content/portfolio'
import { favouriteMusic, localize, ui } from '~/content/portfolio'
import { useCameraRig } from '~/composables/useCameraRig'
import { CAMERA_FOCUS_POINTS } from '~/composables/generated/cameraFocus'
import { normalizeMeshName, resolveInteractiveMeshName, useRaycast } from '~/composables/useRaycast'
import { useQuality } from '~/composables/useQuality'
import { usePointerPicking } from '~/composables/usePointerPicking'
import { useHoverMotion } from '~/composables/useHoverMotion'
import { useHoverNotes } from '~/composables/useHoverNotes'
import { useScreenTextures } from '~/composables/useScreenTextures'
import { useRoomFinish } from '~/composables/useRoomFinish'
import { useRoomLighting } from '~/composables/useRoomLighting'
import { useLightingIntro } from '~/composables/useLightingIntro'
import { useRoomColors } from '~/composables/useRoomColors'
import { frameRoom, roomFocusBounds } from '~/utils/roomFraming'
import { DESK_OFFSET_X, deskFocusNames } from '~/utils/roomLayout'
import { LIBRARY_FOCUS_POINTS } from '~/utils/libraryFrames'
import { libraryPortraitFocus } from '~/utils/libraryArtwork'
import { usePhoneScreenTexture } from '~/composables/usePhoneScreenTexture'
import { useWorldClocks } from '~/composables/useWorldClocks'
import { getMonitorQuad } from '~/utils/monitorProjection'
import MonitorMusicSurface from './MonitorMusicSurface.vue'
import MonitorEditorSurface from './MonitorEditorSurface.vue'
import RoomLightControl from './RoomLightControl.vue'
import JokerAdventure from '~/components/games/JokerAdventure.vue'
import JokerAdventureControls from '~/components/games/JokerAdventureControls.vue'
import { jokerAdventureFocus, measureJokerObstacles } from '~/utils/jokerAdventureScene'
import { useJokerAdventure } from '~/composables/useJokerAdventure'
import DeskMinion from '~/components/games/DeskMinion.vue'
import DeskInteractionHint from '~/components/games/DeskInteractionHint.vue'
import DeskMinionControls from '~/components/games/DeskMinionControls.vue'
import { useDeskMinion } from '~/composables/useDeskMinion'
import { MINION_IDS, deskMinionFocus, measureDeskWorld } from '~/utils/deskPlayground'
import type { MinionId, Point3 } from '~/utils/deskPlayground'

interface Props {
  objects: SceneObject[]
  locale: Locale
  focusedId: string | null
  editorActive?: boolean
  hoveredId?: string | null
  soundOn?: boolean
  screenTheme: ScreenThemeId
  nowPlaying?: string | null
  musicPlayback?: MusicPlayback
  clockEpoch: number
  reducedMotion: boolean
  viewResetCount: number
}

interface Emits {
  activate: [object: SceneObject]
  hover: [objectId: string | null]
  musicPlayback: [state: MusicPlaybackUpdate]
  closeMusic: []
  selectMusic: [id: string | null]
  closeEditor: []
  closeGame: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const camera = useTemplateRef<PerspectiveCamera>('camera')
const root = useTemplateRef<HTMLDivElement>('root')
const surface = computed(() => root.value?.querySelector('canvas') ?? null)
const localHoveredId = shallowRef<string | null>(null)
const { pixelRatio, shadowsEnabled } = useQuality()
const aspect = shallowRef(1.5)
const viewportHeight = shallowRef(800)
const musicBounds = shallowRef(new Box3())
const musicSurface = useTemplateRef<InstanceType<typeof MonitorMusicSurface>>('musicSurface')
const musicActive = computed(() => props.focusedId === 'speakers')
const roomBounds = shallowRef(new Box3())
const openingBounds = shallowRef(new Box3())
const preparedModel = shallowRef<Object3D | null>(null)
const jokerActive = computed(() => props.focusedId === 'bugjar')
const jokerScene = useTemplateRef<InstanceType<typeof JokerAdventure>>('jokerScene')
const joker = useJokerAdventure({ active: () => jokerActive.value, reducedMotion: () => props.reducedMotion, obstacles: () => jokerObstacles.value })
const jokerState = joker.state
const jokerStarted = joker.started
const jokerAction = joker.action
const jokerSound = joker.soundOn
const jokerAudioUnavailable = joker.audioUnavailable
const jokerLoaded = shallowRef(false), jokerError = shallowRef(false), jokerGeneration = shallowRef(0)
const jokerControls = useTemplateRef<InstanceType<typeof JokerAdventureControls>>('jokerControls')
const jokerObstacles = computed(() => preparedModel.value ? measureJokerObstacles(preparedModel.value) : [])
function retryJoker() { jokerLoaded.value = false; jokerError.value = false; jokerGeneration.value++; joker.reset() }
watch(jokerActive, () => { jokerLoaded.value = false; jokerError.value = false })
const minionCharacter = computed(() => MINION_IDS.includes(props.focusedId as MinionId) ? props.focusedId as MinionId : null)
const minionHint = useTemplateRef<InstanceType<typeof DeskInteractionHint>>('minionHint')
const minionScene = useTemplateRef<InstanceType<typeof DeskMinion>>('minionScene')
const deskWorld = computed(() => measureDeskWorld(preparedModel.value, minionCharacter.value ?? 'paratrooper'))
const minion = useDeskMinion({ character: () => minionCharacter.value, world: () => deskWorld.value, reducedMotion: () => props.reducedMotion, ready: () => Boolean(preparedModel.value) && !isMoving.value })
const minionNearby = minion.nearby
const minionState = minion.state
const minionSoundOn = minion.soundOn
const minionAudioUnavailable = minion.audioUnavailable
function interactWithMinion() {
  minion.interact()
  root.value?.querySelector<HTMLElement>('.desk-minion')?.focus({ preventScroll: true })
}
// Fit the desk and library at entry/reset, retaining the authored camera direction.
const focusPoints = computed(() => CAMERA_FOCUS_POINTS.map((point) => {
  if (deskFocusNames.has(point.name)) {
    const position = point.position.clone()
    const target = point.target.clone()
    position.x += DESK_OFFSET_X
    target.x += DESK_OFFSET_X
    return { ...point, position, target }
  }
  if (point.name !== 'cam_start') return point
  return { ...point, position: frameRoom(point.position, point.target, openingBounds.value, aspect.value) }
}).concat(LIBRARY_FOCUS_POINTS, libraryPortraitFocus(preparedModel.value, aspect.value), [jokerAdventureFocus(aspect.value), deskMinionFocus(deskWorld.value, aspect.value, viewportHeight.value, deskWorld.value.front, props.reducedMotion)], (() => {
  const bounds = musicBounds.value
  const target = bounds.isEmpty() ? new Vector3(-0.25, 1.125, -0.2) : bounds.getCenter(new Vector3())
  const size = bounds.isEmpty() ? new Vector3(1.34, 0.364, 0.1) : bounds.getSize(new Vector3())
  // Reserve room around the physical monitor for the HUD and return control.
  const distance = Math.max(size.x / (2 * Math.tan(19 * Math.PI / 180) * aspect.value * 0.88), size.y / (2 * Math.tan(19 * Math.PI / 180) * 0.55)) + size.z / 2
  return [{ name: 'cam_music' as const, target, position: target.clone().add(new Vector3(0, 0, distance)) }]
})()))
const { prepare, lightStudio, applyLighting, updateColors, updateLocale, updateHover: updateFrameHover, updateSpeaker } = useRoomFinish()
const { preset: systemLighting, dark } = useRoomLighting(() => props.reducedMotion)
const { phase: lightPhase, progress: lightProgress, illumination, accents, activate: activateLights, replay: replayLights } = useLightingIntro(() => props.reducedMotion)
const { mode: colorMode, motion: colorMotion, musicPulse, musicDrive, updateFrame: updateColorFrame } = useRoomColors({
  reducedMotion: () => props.reducedMotion,
  phase: lightPhase,
  focused: () => Boolean(props.focusedId || props.editorActive),
  music: () => props.musicPlayback,
})
watch(colorMode, mode => updateColors(mode), { immediate: true, flush: 'sync' })
const lighting = computed(() => {
  const preset = systemLighting.value
  return {
    ...preset,
    background: new Color('#090b0c').lerp(new Color(preset.background), illumination.value).getStyle(),
    hemisphere: 0.02 + (preset.hemisphere - 0.02) * illumination.value,
    key: preset.key * illumination.value,
    fill: preset.fill * illumination.value,
    environment: preset.environment * illumination.value,
    wall: preset.wall * illumination.value,
    shelf: preset.shelf * accents.value,
  }
})
function syncLighting() {
  applyLighting(lighting.value.environment, lighting.value.led, accents.value, lightProgress.value)
}
function readyStudio(context: Parameters<typeof lightStudio>[0]) {
  lightStudio(context)
  syncLighting()
  applyHighlight()
}
const { focus, isMoving, reducedMotion: motionReduced, reset } = useCameraRig({
  camera,
  focusPoints,
})

const { state: gltf, isLoading } = useGLTF('/models/room.glb', { draco: true, decoderPath: '/draco/' })
const { progress } = await useProgress()
const { textures: screenTextures, build: buildScreens, updateTime: updateScreenTime } = useScreenTextures({
  theme: () => props.screenTheme,
  locale: () => props.locale,
})
const phoneScreenTexture = usePhoneScreenTexture()
const model = computed(() => gltf.value?.scene ?? null)
useWorldClocks(model, () => props.clockEpoch, () => props.reducedMotion)

// Camera placement is authored in Blender and generated into cameraFocus.ts;
// cam_start is the resting shot the orbit controls return to.
const startPoint = CAMERA_FOCUS_POINTS.find(point => point.name === 'cam_start')
const cameraStart = computed(() => focusPoints.value.find(point => point.name === 'cam_start')?.position ?? new Vector3(0.16, 1.45, 1.88))
const roomCameraPosition = computed<Vector3>(previous => jokerActive.value && previous ? previous : cameraStart.value)
const orbitTarget = startPoint?.target ?? new Vector3(0.16, 1.02, -0.16)
const maxOrbitDistance = computed(() => Math.max(4,
  frameRoom(startPoint?.position ?? cameraStart.value, orbitTarget, roomBounds.value, aspect.value).distanceTo(orbitTarget) * 1.5))
const minOrbitDistance = 0.75

function zoomRoom(direction: 'in' | 'out') {
  if (props.focusedId || !camera.value) return
  const activeCamera = toRaw(camera.value)
  const offset = activeCamera.position.clone().sub(orbitTarget)
  const distance = Math.min(maxOrbitDistance.value, Math.max(minOrbitDistance,
    offset.length() * (direction === 'in' ? 0.8 : 1.25)))
  activeCamera.position.copy(orbitTarget).add(offset.setLength(distance))
  activeCamera.lookAt(orbitTarget)
  activeCamera.updateMatrixWorld()
}
const toneMapping = ACESFilmicToneMapping
const outputColorSpace = SRGBColorSpace
const keyLight = new Vector3(1.6, 2.6, 1.4)
const fillLight = new Vector3(-1.5, 1.5, 1.4)
const wallLight = new Vector3(-0.15, 1.7, 0.45)
const shelfLight = new Vector3(1.51, 1.25, -0.075)
// Tres uses hyphen-separated paths with the original Three.js property casing.
const shadowSettings = {
  'shadow-mapSize-width': 2048,
  'shadow-mapSize-height': 2048,
  'shadow-camera-left': -3,
  'shadow-camera-right': 3,
  'shadow-camera-top': 3,
  'shadow-camera-bottom': -3,
  'shadow-camera-near': 0.1,
  'shadow-camera-far': 8,
  'shadow-normalBias': 0.002,
  'shadow-bias': -0.0001,
  'shadow-radius': 3,
}

/** Pickable meshes, including desk clock descendants, keyed by their object id. */
const interactiveMeshes = shallowRef<Map<string, Mesh[]>>(new Map())
const baseEmissive = new WeakMap<Material, Color>()

function collectInteractive(root: Object3D) {
  const byObjectId = new Map<string, Mesh[]>()

  root.traverse((child) => {
    if (!(child instanceof Mesh) || !child.visible || child.name.includes('static_subwoofer_detail_wave_')) return
    const meshName = resolveInteractiveMeshName(child)
    if (!meshName) return

    const contractMesh = normalizeMeshName(meshName)
    const owner = props.objects.find(object => object.mesh === contractMesh)
    if (!owner) return

    // Static clock parts are pickable but retain their shared material finish.
    if (child.name.startsWith('int_')) {
      for (const material of toMaterials(child)) {
        if (material instanceof MeshStandardMaterial) baseEmissive.set(material, material.emissive.clone())
      }
    }

    const existing = byObjectId.get(owner.id)
    if (existing) existing.push(child)
    else byObjectId.set(owner.id, [child])
  })

  interactiveMeshes.value = byObjectId
}

function toMaterials(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}

// Three.js raycasting does not skip invisible groups; hidden frames must not intercept clicks.
const pickTargets = computed(() => jokerActive.value
  ? []
  : minionCharacter.value
    ? (minionState.value.phase !== 'paused' && minionState.value.phase !== 'acting' && !isMoving.value ? minionScene.value?.pickTargets ?? [] : [])
    : [...interactiveMeshes.value.values()].flat().filter(mesh =>
  !mesh.parent?.name.startsWith('root_library_frame_') || accents.value > 0,
))

const HIGHLIGHT = new Color('#f4bd61')

function applyHighlight() {
  for (const [objectId, meshes] of interactiveMeshes.value) {
    const active = lightPhase.value !== 'off' && (objectId === localHoveredId.value || objectId === props.hoveredId || objectId === props.focusedId)
    for (const mesh of meshes) {
      for (const material of toMaterials(mesh)) {
        if (!(material instanceof MeshStandardMaterial)) continue
        const base = baseEmissive.get(material)
        if (!base) continue
        // Screens are already emissive; adding to their glow would blow them out,
        // so the highlight only lifts surfaces that were not emitting.
        const isEmissiveSurface = base.r + base.g + base.b > 0.01
        if (active && !isEmissiveSurface) material.emissive.copy(HIGHLIGHT).multiplyScalar(0.09)
        else material.emissive.copy(base)
        material.emissiveIntensity = (active && isEmissiveSurface ? 1.08 : 1) * accents.value
      }
    }
  }
}

/**
 * Paint the generated pixel art onto the screen meshes.
 *
 * The screens are emissive in the model, so the texture is applied as both map
 * and emissiveMap: without the emissive copy the art would be lit only by the
 * room lights and the screens would stop reading as light sources.
 */
function applyScreenTextures(root: Object3D) {
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return
    const texture = child.name === 'int_phone__2' ? phoneScreenTexture : screenTextures.value.get(child.name)
    if (!texture) return

    for (const material of toMaterials(child)) {
      if (!(material instanceof MeshStandardMaterial)) continue
      material.map = texture
      material.emissiveMap = texture
      material.emissive.setRGB(1, 1, 1)
      material.emissiveIntensity = accents.value
      // Emit the artwork once, without adding diffuse lighting on top of it.
      material.color.setRGB(0, 0, 0)
      material.toneMapped = false
      material.needsUpdate = true
      baseEmissive.set(material, material.emissive.clone())
    }
  })
}

watch(model, (scene) => {
  if (!scene) return
  prepare(scene, props.locale)
  roomBounds.value = new Box3().setFromObject(scene)
  openingBounds.value = roomFocusBounds(scene)
  preparedModel.value = scene
  const corners = ['int_screen_left', 'int_screen_right'].flatMap(name => getMonitorQuad(scene, name) ?? [])
  musicBounds.value = new Box3().setFromPoints(corners)
  collectInteractive(scene)
  buildScreens(new Date(props.clockEpoch || Date.now()))
  applyScreenTextures(scene)
  syncLighting()
  applyHighlight()
}, { immediate: true })

watch(() => props.locale, locale => updateLocale(locale))

watch(() => Math.floor(props.clockEpoch / 60_000), (minute, previous) => {
  if (minute && minute !== previous) updateScreenTime(new Date(props.clockEpoch))
})

watchEffect(() => {
  syncLighting()
  applyHighlight()
})

const hoveredObject = computed(() =>
  lightPhase.value === 'off' ? undefined : props.objects.find(object => object.id === (localHoveredId.value ?? props.hoveredId)),
)
const tooltip = computed(() =>
  hoveredObject.value ? localize(hoveredObject.value.label, props.locale) : '',
)

const { handleActivate, handlePointerEnter, handlePointerLeave } = useRaycast({
  objects: () => props.objects,
  onActivate: object => emit('activate', object),
  onHover: (objectId) => {
    localHoveredId.value = objectId
    emit('hover', objectId)
  },
})

usePointerPicking({
  surface,
  camera,
  targets: pickTargets,
  onHover: object => (object && lightPhase.value !== 'off' && !jokerActive.value && !minionCharacter.value ? handlePointerEnter({ object }) : handlePointerLeave()),
  onActivate: (object, point) => {
    if (jokerActive.value) {
      return
    } else if (minionCharacter.value) {
      const action = object.name.startsWith('static_subwoofer') ? 'speaker' : object.userData.deskAction
      if (action === 'laptop' || action === 'cable' || action === 'keyboard' || action === 'mouse' || action === 'speaker') minion.approach(action)
      else if (point) minion.walkTo(point)
      root.value?.querySelector<HTMLElement>('.desk-minion')?.focus({ preventScroll: true })
    } else handleActivate({ object })
  },
})

watch(
  () => [camera.value, props.focusedId] as const,
  ([activeCamera, objectId]) => {
    if (!activeCamera) return
    if (objectId) focus(objectId === 'speakers' ? 'music' : objectId === 'bugjar' ? 'joker_game' : minionCharacter.value ? 'minion_game' : objectId)
    else reset()
  },
  { immediate: true },
)

let introPlayed = false
watch(camera, (activeCamera) => {
  if (!activeCamera || introPlayed) return
  introPlayed = true
  if (motionReduced.value) return
  const rawCamera = toRaw(activeCamera)
  rawCamera.position.y += 0.14
  rawCamera.position.z += 0.42
  reset()
}, { flush: 'post' })

let resizeObserver: ResizeObserver | null = null
let animationFrame = 0
const activeHover = computed(() => lightPhase.value === 'off' || props.focusedId ? null : localHoveredId.value ?? props.hoveredId ?? null)
const selectedTrack = computed(() => favouriteMusic.find(track => track.id === props.nowPlaying) ?? null)
const { updateFrame: updateHoverFrame } = useHoverMotion({
  model: () => model.value,
  hoveredId: () => activeHover.value,
  reducedMotion: () => props.reducedMotion,
  musicSelected: () => Boolean(selectedTrack.value && props.musicPlayback?.playing),
  accents: () => accents.value,
})
useHoverNotes({ soundOn: () => Boolean(props.soundOn), hoveredId: () => activeHover.value })

let cameraTime = 0
let minionActionAnchor: Point3 | null = null
const minionLookAt = new Vector3()
function animateInteractiveToy(time: number) {
  joker.updateFrame(time, jokerLoaded.value && !isMoving.value, jokerObstacles.value)
  minion.updateFrame(time, !document.hidden)
  updateColors(colorMode.value, updateColorFrame(time), musicPulse.value, musicDrive.value, 0)
  if (camera.value) {
    jokerScene.value?.updateFrame(time, toRaw(camera.value), jokerControls.value?.getViewport())
    jokerControls.value?.updateFrame(toRaw(camera.value))
  }
  minionScene.value?.updateFrame(time)
  updateSpeaker(minionCharacter.value ? minionState.value.speakerTime : -1, minionCharacter.value && minionState.value.action === 'speaker' ? minionState.value.actionTime : null, props.reducedMotion, musicDrive.value > 0 ? Math.max(0, musicPulse.value - 0.6) * musicDrive.value : 0)
  if (minionCharacter.value && camera.value && !isMoving.value && minionState.value.phase !== 'paused' && !props.reducedMotion) {
    const state = minionState.value
    if (state.phase === 'acting') minionActionAnchor ??= { ...state.body.position }
    else minionActionAnchor = null
    const companion = state.action === 'keyboard' ? deskWorld.value.joker
      : state.action === 'mouse' && minionActionAnchor ? { ...minionActionAnchor, x: minionActionAnchor.x + 0.2 } : null
    const framing = deskMinionFocus(deskWorld.value, aspect.value, viewportHeight.value, state.typing ? deskWorld.value.keyboard ?? state.body.position : minionActionAnchor ?? state.body.position, false, companion)
    const blend = 1 - Math.exp(-Math.min(0.05, (time - cameraTime) / 1000) * 5)
    const activeCamera = toRaw(camera.value)
    activeCamera.getWorldDirection(minionLookAt).multiplyScalar(activeCamera.position.distanceTo(framing.target)).add(activeCamera.position)
    activeCamera.position.lerp(framing.position, blend)
    minionLookAt.lerp(framing.target, blend)
    activeCamera.lookAt(minionLookAt)
    activeCamera.updateMatrixWorld()
  }
  if (!minionCharacter.value) minionActionAnchor = null
  if (camera.value) minionHint.value?.updateFrame(toRaw(camera.value))
  cameraTime = time
  musicSurface.value?.updateFrame()
  updateHoverFrame(time)
  updateFrameHover(activeHover.value, time, props.reducedMotion)
  animationFrame = requestAnimationFrame(animateInteractiveToy)
}

watch([aspect, viewportHeight, openingBounds, musicBounds, preparedModel], () => {
  if (minionCharacter.value) focus('minion_game')
  else if (jokerActive.value) { if (!jokerLoaded.value) focus('joker_game') }
  else if (musicActive.value) focus('music')
  else if (!props.focusedId) reset()
})
watch(() => props.reducedMotion, () => { if (minionCharacter.value) focus('minion_game') })
watch(() => props.viewResetCount, () => {
  if (!props.focusedId) reset()
})

onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry && entry.contentRect.height) {
      aspect.value = entry.contentRect.width / entry.contentRect.height
      viewportHeight.value = entry.contentRect.height
    }
  })
  if (root.value) resizeObserver.observe(root.value)
  animationFrame = requestAnimationFrame(animateInteractiveToy)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="root"
    class="room-scene"
    :class="{ 'room-scene--interactive': lightPhase !== 'off' && (localHoveredId || minionCharacter) }"
    :data-lighting="lightPhase === 'off' || dark ? 'dark' : 'light'"
    :data-light-phase="lightPhase"
    :data-light-progress="lightProgress"
    :data-color-mode="colorMode"
    :data-color-motion="colorMotion"
    :data-music-playing="Boolean(props.musicPlayback?.playing)"
    :data-light-backdrop="illumination < 0.4 ? 'dark' : 'light'"
    :style="{ backgroundColor: lighting.background }"
  >
    <TresCanvas
      class="room-scene__canvas"
      :clear-color="lighting.background"
      :dpr="pixelRatio"
      :shadows="shadowsEnabled"
      :shadow-map-type="PCFShadowMap"
      :tone-mapping-exposure="lighting.exposure"
      :tone-mapping="toneMapping"
      :output-color-space="outputColorSpace"
      @ready="readyStudio"
    >
      <TresPerspectiveCamera
        ref="camera"
        :position="roomCameraPosition"
        :fov="38"
        :near="0.05"
        :far="50"
      />
      <OrbitControls
        :key="props.viewResetCount"
        make-default
        :enabled="!props.focusedId"
        :enable-pan="false"
        :min-distance="minOrbitDistance"
        :max-distance="maxOrbitDistance"
        :min-polar-angle="0.48"
        :max-polar-angle="1.56"
        :min-azimuth-angle="-0.95"
        :max-azimuth-angle="0.95"
        :target="orbitTarget"
      />

      <!-- Lights live here, not in the GLB: the runtime tunes them per quality tier. -->
      <TresHemisphereLight :args="['#ece6d9', '#645b4b', lighting.hemisphere]" />
      <TresDirectionalLight
        :position="keyLight"
        :intensity="lighting.key"
        :color="'#ffe4ba'"
        :cast-shadow="shadowsEnabled"
        v-bind="shadowSettings"
      />
      <TresDirectionalLight
        :position="fillLight"
        :intensity="lighting.fill"
        :color="'#d6e3e1'"
      />

      <TresPointLight :position="wallLight" color="#ffc982" :intensity="lighting.wall" :distance="3" :decay="2" />
      <TresPointLight v-if="shadowsEnabled" :position="shelfLight" color="#ffd49b" :intensity="lighting.shelf" :distance="1.6" />
      <primitive v-if="model" :object="model" />
      <JokerAdventure
        v-if="jokerActive && model"
        :key="jokerGeneration"
        ref="jokerScene"
        :model="model"
        :state="jokerState"
        :reduced-motion="props.reducedMotion"
        :ready="!isMoving"
        @loaded="jokerLoaded = true"
        @failed="jokerError = true"
      />
      <DeskMinion
        v-if="minionCharacter && model"
        :key="minionCharacter"
        ref="minionScene"
        :model="model"
        :world="deskWorld"
        :character="minionCharacter"
        :locale="props.locale"
        :state="minionState"
        :reduced-motion="props.reducedMotion"
        :ready="!isMoving"
      />
    </TresCanvas>

    <DeskInteractionHint
      v-if="minionCharacter"
      ref="minionHint"
      :state="minionState"
      :nearby="minionNearby"
      :world="deskWorld"
      :locale="props.locale"
      :ready="Boolean(model) && !isMoving"
      @interact="interactWithMinion"
    />
    <DeskMinionControls
      v-if="minionCharacter"
      :state="minionState"
      :locale="props.locale"
      :ready="Boolean(model) && !isMoving"
      :sound-on="minionSoundOn"
      :audio-unavailable="minionAudioUnavailable"
      @move="minion.press"
      @clear="minion.clearInput"
      @cancel="minion.cancel"
      @type="minion.typeKey"
      @interact="interactWithMinion"
      @reset="minion.reset"
      @jump="minion.jump"
      @pause="minion.pause"
      @resume="minion.resume"
      @sound="minion.toggleSound"
      @close="emit('closeGame')"
    />
    <JokerAdventureControls
      v-if="jokerActive"
      ref="jokerControls"
      :state="jokerState"
      :action="jokerAction"
      :locale="props.locale"
      :ready="jokerLoaded && !isMoving"
      :error="jokerError"
      :started="jokerStarted"
      :sound-on="jokerSound"
      :audio-unavailable="jokerAudioUnavailable"
      @start="joker.start"
      @explore="joker.explore"
      @retry="retryJoker"
      @reset="joker.reset"
      @recover="joker.recover"
      @pause="joker.pause"
      @resume="joker.resume"
      @camera="joker.camera"
      @jump="joker.jump"
      @interact="joker.interact"
      @sound="joker.toggleSound"
      @move="joker.press"
      @clear="joker.clear"
      @close="emit('closeGame')"
    />
    <RoomLightControl
      v-if="!props.focusedId && !props.editorActive"
      :phase="lightPhase"
      :locale="props.locale"
      @activate="activateLights"
      @replay="replayLights"
    />

    <div v-if="!props.focusedId" class="room-zoom" role="group" :aria-label="localize(ui.roomZoomControls, props.locale)">
      <button type="button" :aria-label="localize(ui.roomZoomIn, props.locale)" @click="zoomRoom('in')">+</button>
      <button type="button" :aria-label="localize(ui.roomZoomOut, props.locale)" @click="zoomRoom('out')">−</button>
    </div>

    <p v-if="isLoading" class="room-scene__status" role="status">{{ localize(ui.loadingRoom, props.locale) }} {{ Math.round(progress) }}%</p>
    <p v-else-if="tooltip" class="room-scene__tooltip">{{ tooltip }}</p>
    <MonitorMusicSurface
      v-if="musicActive || props.nowPlaying"
      ref="musicSurface"
      :active="musicActive && !isMoving"
      :camera="camera"
      :model="model"
      :locale="props.locale"
      :selected-id="props.nowPlaying ?? null"
      @select="emit('selectMusic', $event)"
      @close="emit('closeMusic')"
      @playback="emit('musicPlayback', $event)"
    />
    <MonitorEditorSurface
      :active="Boolean(props.editorActive) && !isMoving"
      :camera="camera"
      :locale="props.locale"
      :model="model"
      @close="emit('closeEditor')"
    />
  </div>
</template>

<style scoped>
.room-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #090b0c;
}

.room-scene::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 42%, transparent 48%, rgb(16 20 16 / 24%) 100%);
  pointer-events: none;
}

.room-scene--interactive canvas {
  cursor: pointer;
}

.room-scene__canvas {
  inline-size: 100%;
  block-size: 100%;
}

.room-zoom {
  position: absolute;
  z-index: 7;
  inset-inline-end: clamp(1rem, 3vw, 2.5rem);
  inset-block-end: 7.5rem;
  display: grid;
  gap: .3rem;
}
.room-zoom button {
  display: grid;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  place-items: center;
  border: 1px solid rgb(242 239 232 / 32%);
  border-radius: 50%;
  background: rgb(12 16 14 / 76%);
  color: #f2efe8;
  font: 1.3rem/1 var(--font-display);
  cursor: pointer;
}
.room-zoom button:hover,.room-zoom button:focus-visible { border-color: var(--acid); color: var(--acid); }
@media (max-width: 760px) { .room-zoom { inset-inline-end: .7rem; inset-block-end: 6.1rem; } }

.room-scene__tooltip,
.room-scene__status {
  position: absolute;
  inset-block-end: 1.5rem;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 999px;
  background: rgb(23 21 18 / 84%);
  backdrop-filter: blur(0.8rem);
  box-shadow: 0 0.5rem 2rem rgb(0 0 0 / 30%);
  color: #fff7eb;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .room-scene__tooltip,
  .room-scene__status {
    backdrop-filter: none;
  }
}
</style>
