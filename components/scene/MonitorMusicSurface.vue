<script setup lang="ts">
import { nextTick, shallowRef, toRaw, useTemplateRef, watch } from 'vue'
import type { Object3D, PerspectiveCamera } from 'three'
import { laptopLidCorners, monitorOcclusionPath } from '~/utils/monitorOcclusion'
import { getMonitorQuad, screenTransform } from '~/utils/monitorProjection'
import type { ScreenQuad } from '~/utils/monitorProjection'
import type { MusicPlaybackUpdate } from '~/utils/musicPlayback'
import type { Locale } from '~/content/portfolio'
import { localize, ui } from '~/content/portfolio'
import MusicList from '~/components/music/MusicList.vue'
import MusicPreview from '~/components/music/MusicPreview.vue'

const props = defineProps<{
  active: boolean
  camera: PerspectiveCamera | null
  model: Object3D | null
  locale: Locale
  selectedId: string | null
}>()
const emit = defineEmits<{ select: [id: string | null]; close: []; playback: [state: MusicPlaybackUpdate] }>()
const host = useTemplateRef<HTMLDivElement>('host')
const close = useTemplateRef<HTMLButtonElement>('close')
const left = shallowRef(''), right = shallowRef('')
const occlusion = shallowRef<string | undefined>()
let lid: ReturnType<typeof laptopLidCorners> = null
let measured: Object3D | null = null
let quads: (ScreenQuad | null)[] = []
const WIDTH = 760, HEIGHT = 414

/** Called by the room's render loop, so DOM and WebGL follow the same camera. */
function updateFrame() {
  if (!props.camera || !props.model || !host.value) return
  const model = toRaw(props.model)
  if (measured !== model) {
    quads = ['int_screen_left', 'int_screen_right'].map(name => getMonitorQuad(model, name))
    lid = laptopLidCorners(model)
    measured = model
  }
  const camera = toRaw(props.camera)
  camera.updateMatrixWorld()
  const width = host.value.clientWidth, height = host.value.clientHeight
  occlusion.value = monitorOcclusionPath(lid, quads.flatMap(quad => quad ?? []), camera, width, height)
  const transforms = quads.map(quad => {
    if (!quad) return ''
    const projected = quad.map(point => point.clone().project(camera))
    if (projected.some(point => point.z < -1 || point.z > 1)) return ''
    return screenTransform(projected.map(point => ({ x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 })), WIDTH, HEIGHT) ?? ''
  })
  left.value = transforms[0] ?? ''
  right.value = transforms[1] ?? ''
}
defineExpose({ updateFrame })

watch(() => props.active, async active => {
  if (!active) return
  await nextTick()
  updateFrame()
  close.value?.focus()
}, { immediate: true })

function clearSelection() {
  const selectedButton = host.value?.querySelector<HTMLButtonElement>('.track[aria-pressed="true"]')
  emit('select', null)
  nextTick(() => selectedButton?.focus())
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.stopPropagation(); emit('close'); return }
  if (event.key !== 'Tab' || !host.value) return
  const controls = [...host.value.querySelectorAll<HTMLElement>('button, a[href], iframe')].filter(element => element.getClientRects().length > 0)
  const first = controls[0], last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
</script>

<template>
  <div ref="host" class="monitor-music" :class="{ 'monitor-music--active': props.active }" :dir="props.locale === 'fa' ? 'rtl' : 'ltr'" :inert="!props.active" :aria-hidden="!props.active" :role="props.active ? 'dialog' : undefined" :aria-modal="props.active ? true : undefined" :aria-label="localize(ui.musicTitle, props.locale)" @keydown="onKeydown">
    <div v-show="props.active" class="music-toolbar">
      <button ref="close" class="music-return" type="button" @click="emit('close')">← {{ localize(ui.back, props.locale) }}</button>
      <p>{{ localize(ui.musicReturnHint, props.locale) }}</p>
    </div>
    <div class="monitor-panels" :style="{ clipPath: occlusion }">
      <div class="monitor-panel monitor-panel--library" :class="{ 'monitor-panel--ready': left }" :style="{ transform: left || undefined }">
        <MusicList :locale="props.locale" :selected-id="props.selectedId" @select="emit('select', $event)" />
      </div>
      <div class="monitor-panel monitor-panel--preview" :class="{ 'monitor-panel--ready': right }" :style="{ transform: right || undefined }">
        <MusicPreview :locale="props.locale" :selected-id="props.selectedId" @clear="clearSelection" @playback="emit('playback', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-music { position: absolute; z-index: 8; inset: 0; overflow: hidden; pointer-events: none; }
.monitor-panels { position: absolute; inset: 0; pointer-events: none; }
.monitor-panel { position: absolute; top: 0; left: 0; width: 760px; height: 414px; transform-origin: 0 0; visibility: hidden; pointer-events: none; overflow: hidden; backface-visibility: hidden; }
.monitor-panel--ready { visibility: visible; }
.monitor-music--active .monitor-panel { pointer-events: auto; }
.music-toolbar { position: absolute; bottom: 7rem; left: 50%; transform: translateX(-50%); text-align: center; pointer-events: auto; width: max-content; max-width: calc(100% - 2rem); }
.music-return { border: 1px solid #7e9276; background: #172019; color: #e5eedc; border-radius: 6px; padding: 13px 20px; font-size: 14px; }
.music-toolbar p { margin: 10px 0 0; color: #e1e7db; font-size: 12px; line-height: 1.5; text-shadow: 0 1px 3px #000; }
@media (max-width: 760px) {
  .monitor-music--active { position: fixed; z-index: 90; inset: 0; overflow-y: auto; background: #101713; pointer-events: auto; padding: 0 0 20px; }
  .monitor-music--active .music-toolbar { position: sticky; top: 0; left: auto; bottom: auto; transform: none; z-index: 2; width: 100%; max-width: none; background: #101713; text-align: start; padding: 12px 16px; }
  .music-toolbar p { display: none; }
  .monitor-music--active .monitor-panels { position: static; clip-path: none !important; }
  .monitor-music--active .monitor-panel { position: static; width: 100%; height: auto; visibility: visible; transform: none !important; }
}
</style>
