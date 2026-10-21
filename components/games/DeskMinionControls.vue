<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { deskMinionCopy as copy, deskMischiefCopy as mischief, localize, ui } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'
import type { DeskMinionState, MoveKey } from '~/composables/useDeskMinion'
import DeskTypingInput from './DeskTypingInput.vue'
const props = defineProps<{ state: DeskMinionState; locale: Locale; ready: boolean; soundOn: boolean; audioUnavailable: boolean }>()
const emit = defineEmits<{ move: [key: MoveKey, down: boolean]; clear: []; cancel: []; jump: []; type: [key: string, code?: string]; interact: []; reset: []; pause: []; resume: []; sound: []; close: [] }>()
const panel = useTemplateRef<HTMLElement>('panel')
const enabled = computed(() => props.ready && props.state.phase !== 'paused')
const busy = computed(() => props.state.typing || props.state.phase === 'acting' || props.state.phase === 'climbing' || Boolean(props.state.destination))
const actionEnabled = computed(() => enabled.value && props.state.phase !== 'acting' && props.state.phase !== 'climbing' && props.state.phase !== 'key-hop')
const status = computed(() => localize(!props.ready ? copy.arriving : props.state.phase === 'paused' ? copy.paused : copy[props.state.feedback], props.locale))
const directions = [{ key: 'left', symbol: '←' }, { key: 'forward', symbol: '↑' }, { key: 'back', symbol: '↓' }, { key: 'right', symbol: '→' }] as const
const keys: Record<string, MoveKey> = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'forward', w: 'forward', arrowdown: 'back', s: 'back' }
const pointers = new Map<number, MoveKey>()
const timers = new Set<ReturnType<typeof setTimeout>>()
function clear() { pointers.clear(); timers.forEach(clearTimeout); timers.clear(); emit('clear') }
function keyboard(event: KeyboardEvent, down: boolean) {
  const key = event.key.toLowerCase()
  if (!down && keys[key]) { emit('move', keys[key], false); return }
  if (event.altKey || event.metaKey || event.ctrlKey || !enabled.value || !down) return
  if (props.state.typing && key === 'escape') { event.preventDefault(); event.stopPropagation(); emit('cancel'); return }
  if (props.state.typing && (event.key.length === 1 || ['Enter', 'Backspace'].includes(event.key)) && !(event.target instanceof HTMLButtonElement && [' ', 'Enter'].includes(event.key))) {
    event.preventDefault(); if (!event.repeat) emit('type', event.key, event.code); return
  }
  if (keys[key] && (!props.state.typing || key.startsWith('arrow'))) {
    event.preventDefault()
    if (!event.repeat) { emit('move', keys[key], true); panel.value?.focus({ preventScroll: true }) }
  } else if (key === 'x') {
    event.preventDefault(); if (!event.repeat) emit('cancel')
  } else if ((key === ' ' && !(event.target instanceof HTMLButtonElement)) || key === 'e') {
    event.preventDefault()
    if (!event.repeat) { if (key === 'e') emit('interact'); else emit('jump') }
  }
}
function hold(event: PointerEvent, key: MoveKey) {
  if (!enabled.value) return
  event.preventDefault()
  const button = event.currentTarget as HTMLButtonElement
  button.setPointerCapture?.(event.pointerId)
  pointers.set(event.pointerId, key); emit('move', key, true)
}
function release(event: PointerEvent) {
  const key = pointers.get(event.pointerId)
  if (key) { pointers.delete(event.pointerId); emit('move', key, false) }
}
function tap(event: MouseEvent, key: MoveKey) {
  if (event.detail !== 0 || !enabled.value) return
  emit('move', key, true)
  const timer = setTimeout(() => { emit('move', key, false); timers.delete(timer) }, 160)
  timers.add(timer)
}
function leave(event: FocusEvent) {
  if (!panel.value?.contains(event.relatedTarget as Node | null)) clear()
}
watch(() => enabled.value, value => { if (!value) clear() })
watch(() => props.state.typing, async (typing, previous) => { if (previous && !typing) { await nextTick(); panel.value?.focus({ preventScroll: true }) } })
watch(() => props.state.phase, async (phase, previous) => {
  if (phase === 'paused') { clear(); await nextTick(); panel.value?.querySelector<HTMLButtonElement>('[data-resume]')?.focus({ preventScroll: true }) }
  else if ((previous === 'paused' || previous === 'acting') && (document.activeElement === document.body || panel.value?.contains(document.activeElement))) {
    await nextTick(); (props.state.typing ? panel.value?.querySelector<HTMLInputElement>('input') : panel.value)?.focus({ preventScroll: true })
  }
})
onMounted(() => { panel.value?.focus({ preventScroll: true }); window.addEventListener('blur', clear) })
onBeforeUnmount(() => { clear(); window.removeEventListener('blur', clear) })
</script>

<template>
  <section ref="panel" class="desk-minion" tabindex="-1" role="region" :aria-label="localize(copy.title, props.locale)" :dir="props.locale === 'fa' ? 'rtl' : 'ltr'" :data-phase="props.state.phase" :data-typing="props.state.typing" :data-text="props.state.typedText" :data-laptop-on="props.state.laptopOn" :data-monitor-connected="props.state.monitorConnected" :data-grounded="props.state.body.grounded" :data-keystrokes="props.state.keystrokes" :data-mouse-offset="props.state.mouseOffset" @keydown="keyboard($event, true)" @keyup="keyboard($event, false)" @focusout="leave">
    <div class="desk-minion__top">
      <strong>{{ localize(copy.title, props.locale) }}</strong>
      <p role="status" aria-live="polite" aria-atomic="true">{{ status }}</p>
      <button type="button" class="desk-minion__back" @click="emit('close')">{{ localize(ui.back, props.locale) }} ↗</button>
    </div>
    <div class="desk-minion__controls">
      <div class="desk-minion__pad" dir="ltr" role="group" :aria-label="localize(copy.movement, props.locale)">
        <button v-for="direction in directions" :key="direction.key" type="button" :disabled="!enabled" :aria-label="localize(copy[direction.key], props.locale)" @pointerdown="hold($event, direction.key)" @pointerup="release" @pointercancel="release" @lostpointercapture="release" @click="tap($event, direction.key)">{{ direction.symbol }}</button>
        <button type="button" class="desk-minion__jump" :disabled="!actionEnabled || !props.state.body.grounded || props.state.jumpPrep >= 0" @click="emit('jump')">{{ localize(copy.jump, props.locale) }}</button>
      </div>
      <DeskTypingInput v-if="props.state.typing" :locale="props.locale" :disabled="!enabled" @type="(key, code) => emit('type', key, code)" @exit="emit('cancel')" />
      <button type="button" :disabled="!enabled || !busy" :aria-label="localize(mischief.stop, props.locale)" @click="emit('cancel')">{{ localize(mischief.stopShort, props.locale) }}</button>
      <button v-if="props.state.phase === 'paused'" type="button" data-resume :disabled="!props.ready" @click="emit('resume')">{{ localize(copy.resume, props.locale) }}</button>
      <button v-else type="button" @click="emit('pause')">{{ localize(copy.pause, props.locale) }}</button>
      <button type="button" :aria-pressed="props.soundOn" :aria-label="localize(props.soundOn ? copy.soundOn : copy.soundOff, props.locale)" @click="emit('sound')">{{ localize(props.soundOn ? copy.sound : copy.muted, props.locale) }}</button>
      <button type="button" @click="emit('reset')">{{ localize(copy.reset, props.locale) }}</button>
    </div>
    <div class="desk-minion__bottom">
      <p>{{ localize(props.state.typing ? mischief.typingHelp : copy.keyboard, props.locale) }}</p>

      <p v-if="props.audioUnavailable && props.soundOn">{{ localize(copy.audioUnavailable, props.locale) }}</p>
    </div>
  </section>
</template>

<style scoped>
.desk-minion { position: absolute; z-index: 12; inset-inline: 1rem; inset-block-end: max(.8rem, env(safe-area-inset-bottom)); max-width: 61rem; margin-inline: auto; padding: .7rem 1rem; border: 1px solid #ffffff26; border-radius: 1rem; color: #eeeedd; background: #14201bef; box-shadow: 0 8px 32px #0005; outline: none; }
.desk-minion__top { display: flex; align-items: center; gap: .8rem; }
.desk-minion__top strong { font: 600 .95rem/1.2 var(--font-display); white-space: nowrap; color: #f2d77d; }
.desk-minion p { margin: 0; font: .73rem/1.45 var(--font-display); color: #c4d0c5; }
.desk-minion__top p { flex: 1; }
.desk-minion button { min-height: 2.75rem; border: 1px solid #ffffff24; border-radius: .5rem; background: #ffffff08; color: #eeeedd; padding: .35rem .65rem; font: .72rem/1.2 var(--font-display); cursor: pointer; }
.desk-minion button:focus-visible { outline: 2px solid #f2d77d; outline-offset: 3px; }
.desk-minion button:hover:not(:disabled) { background: #ffffff15; }
.desk-minion button:disabled { opacity: .42; cursor: default; }
.desk-minion__controls { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; }
.desk-minion__pad { display: flex; gap: .25rem; }
.desk-minion__pad button { touch-action: none; user-select: none; min-width: 2.75rem; font-size: 1rem; }
.desk-minion__pad .desk-minion__jump { font-size: .75rem; background: #f2d77d; color: #17251d; border-color: #f2d77d; }
.desk-minion .desk-minion__back { border: 0; background: transparent; font-size: .65rem; }
.desk-minion__bottom { display: flex; gap: .5rem; align-items: center; margin-top: .4rem; min-height: 1.35rem; }
.desk-minion__bottom p { font-size: .65rem; }
@media (max-width: 700px) {
  .desk-minion { inset-inline: .5rem; padding: .5rem .65rem; }
  .desk-minion__top { flex-wrap: wrap; gap: .2rem .5rem; margin-bottom: .4rem; }
  .desk-minion__top p { order: 3; flex-basis: 100%; min-height: 2.1em; }
  .desk-minion__back { margin-inline-start: auto; }
  .desk-minion__controls { gap: .3rem; }
  .desk-minion__pad { width: 100%; }
  .desk-minion__pad button { flex: 1; }
  .desk-minion__bottom { flex-wrap: wrap; }
  .desk-minion__bottom p { font-size: .6rem; }
}
@media (max-height: 500px) and (min-width: 600px) {
  .desk-minion { padding-block: .35rem; }
  .desk-minion__top { flex-wrap: nowrap; }
  .desk-minion__top p { order: initial; flex-basis: auto; min-height: 0; font-size: .65rem; }
  .desk-minion__controls { flex-wrap: wrap; }
  .desk-minion__pad { width: auto; }
  .desk-minion__pad button { flex: initial; }
  .desk-minion__bottom { display: none; }
}
</style>
