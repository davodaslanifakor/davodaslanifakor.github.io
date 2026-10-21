<script setup lang="ts">
import { markRaw, onBeforeUnmount } from 'vue'
import type { Object3D } from 'three'
import type { Locale } from '~/content/portfolio'
import type { DeskMinionState } from '~/composables/useDeskMinion'
import type { DeskWorld, MinionId } from '~/utils/deskPlayground'
import { createDeskMinion } from '~/utils/deskMinionScene'
const props = defineProps<{ model: Object3D; world: DeskWorld; character: MinionId; state: DeskMinionState; reducedMotion: boolean; ready: boolean; locale: Locale }>()
const stage = createDeskMinion(props.model, props.character, props.world)
const object = markRaw(stage.object)
stage.update(props.state, true, 0, props.locale)
let previous: number | null = null
function updateFrame(time: number) {
  const delta = previous === null ? 0 : Math.min(0.05, Math.max(0, time - previous) / 1000)
  previous = time
  stage.update(props.state, props.reducedMotion, props.ready && props.state.phase !== 'paused' ? delta : 0, props.locale)
}
onBeforeUnmount(stage.dispose)
defineExpose({ updateFrame, pickTargets: stage.pickTargets })
</script>

<template>
  <primitive :object="object" />
</template>
