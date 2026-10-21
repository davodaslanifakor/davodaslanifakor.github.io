<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { Vector3 } from 'three'
import type { Camera } from 'three'
import type { DeskMinionState } from '~/composables/useDeskMinion'
import type { DeskAction, DeskWorld } from '~/utils/deskPlayground'
import { deskMinionCopy, deskMischiefCopy as copy, localize } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'
const props = defineProps<{ state: DeskMinionState; nearby: DeskAction | null; world: DeskWorld; locale: Locale; ready: boolean }>()
const emit = defineEmits<{ interact: [] }>()
const hint = useTemplateRef<HTMLElement>('hint'), point = new Vector3()
const visible = computed(() => props.ready && Boolean(props.nearby) && !props.state.typing && props.state.phase !== 'paused')
const label = computed(() => props.nearby === 'speaker' ? copy.testBass : props.nearby === 'keyboard' ? props.state.laptopOn ? copy.playKeyboard : deskMinionCopy.wakeLaptop
  : props.nearby === 'mouse' ? copy.mouseAction
    : props.nearby === 'laptop' ? props.state.laptopOn ? copy.powerOffPrompt : copy.powerOnPrompt
      : props.state.monitorConnected ? deskMinionCopy.unplug : deskMinionCopy.plug)
const disabled = computed(() => props.nearby === 'keyboard' && !props.state.laptopOn)
function updateFrame(camera: Camera) {
  const element = hint.value, action = props.nearby
  if (!element || !visible.value || !action) return
  const world = props.world
  const anchor = action === 'speaker' ? world.speakerKnob : action === 'cable' ? world.socket : action === 'mouse' && world.mouseBounds ? world.mouseBounds.getCenter(point) : action === 'erase' ? world.keyboard : world[action]
  if (!anchor) return
  point.set(anchor.x + (action === 'mouse' ? props.state.mouseOffset : 0), anchor.y + 0.085, anchor.z).project(camera)
  const parent = element.parentElement, width = parent?.clientWidth ?? 0, height = parent?.clientHeight ?? 0
  const offscreen = !width || !height || point.z < -1 || point.z > 1 || Math.abs(point.x) > 1.15 || Math.abs(point.y) > 1.15
  element.style.visibility = offscreen ? 'hidden' : 'visible'
  if (offscreen) return
  const half = element.offsetWidth / 2 + 12
  const controls = parent?.querySelector('.desk-minion')?.getBoundingClientRect().height ?? 150
  const x = Math.max(half, Math.min(width - half, (point.x + 1) * width / 2))
  let y = Math.max(72, Math.min(height - controls - element.offsetHeight - 20, (1 - point.y) * height / 2))
  // At room scale on a phone, a callout can cover a different prop. Keep those
  // click destinations clear so moving toward it cannot trigger this action.
  const destinations = [world.keyboard, world.laptop, world.cable, world.speaker, world.mouse && { ...world.mouse, x: world.mouse.x + props.state.mouseOffset }].flatMap(target => {
    if (!target) return []
    point.set(target.x, target.y, target.z).project(camera)
    return [{ x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 }]
  })
  for (let i = 0; i < 5; i++) {
    if (!destinations.some(p => Math.abs(p.x - x) < half + 8 && p.y > y - element.offsetHeight - 12 && p.y < y + 12)) break
    y = Math.max(72 + element.offsetHeight, y - element.offsetHeight - 18)
  }
  element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`
}
defineExpose({ updateFrame })
</script>

<template>
  <div v-show="visible" ref="hint" class="desk-hint" :dir="props.locale === 'fa' ? 'rtl' : 'ltr'" role="status" aria-live="polite">
    <button type="button" :disabled="disabled" @click="emit('interact')" @keydown.e.prevent="emit('interact')"><kbd v-if="!disabled">E</kbd><span>{{ localize(label, props.locale) }}</span></button>
  </div>
</template>

<style scoped>
.desk-hint { position: absolute; inset: 0 auto auto 0; z-index: 13; max-width: min(18rem, calc(100% - 2rem)); width: max-content; visibility: hidden; filter: drop-shadow(0 6px 12px #0006); }
.desk-hint::after { content: ''; position: absolute; bottom: -5px; left: calc(50% - 5px); width: 10px; height: 10px; background: #f3df95; transform: rotate(45deg); }
.desk-hint button { display: flex; gap: .55rem; align-items: center; min-height: 2.75rem; padding: .45rem .75rem; border: 1px solid #fff3bc; border-radius: .6rem; background: #f3df95; color: #233523; font: 600 .76rem/1.4 var(--font-display); cursor: pointer; }
.desk-hint button:disabled { cursor: default; }
.desk-hint kbd { display: grid; place-items: center; min-width: 1.5rem; height: 1.5rem; border: 1px solid #31462a66; border-bottom-width: 3px; border-radius: .3rem; font: 600 .75rem var(--font-mono); }
.desk-hint button:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
</style>
