<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import type { Object3D, PerspectiveCamera } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { createJokerScene, disposeJokerAsset } from '~/utils/jokerAdventureScene'
import type { JokerViewport } from '~/utils/jokerAdventureCamera'
import type { JokerState } from '~/utils/jokerAdventure'
const props = defineProps<{ model: Object3D; state: JokerState; reducedMotion: boolean; ready: boolean }>()
const emit = defineEmits<{ loaded: []; failed: [] }>()
const scene = shallowRef<ReturnType<typeof createJokerScene> | null>(null)
const draco = new DRACOLoader().setDecoderPath('/draco/')
let disposed = false
onMounted(async () => {
  let asset
  try {
    asset = await new GLTFLoader().setDRACOLoader(draco).loadAsync('/models/joker-adventure.glb')
    if (disposed) { disposeJokerAsset(asset.scene); return }
    scene.value = markRaw(createJokerScene(asset, props.model)); emit('loaded')
  } catch { if (asset) disposeJokerAsset(asset.scene); if (!disposed) emit('failed') }
  finally { draco.dispose() }
})
function updateFrame(time: number, camera: PerspectiveCamera, viewport?: JokerViewport) { if (props.ready) scene.value?.update(props.state, camera, time, props.reducedMotion, viewport) }
onBeforeUnmount(() => { disposed = true; scene.value?.dispose() })
defineExpose({ updateFrame })
</script>
<template><primitive v-if="scene" :object="scene.group" /></template>
