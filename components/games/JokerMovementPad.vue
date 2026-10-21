<script setup lang="ts">
import { computed } from 'vue'
import type { JokerInput } from '~/utils/jokerAdventure'
import type { Locale } from '~/content/portfolio'
import { jokerAdventureCopy as copy, localize } from '~/content/portfolio'
const props = defineProps<{ inCar: boolean; disabled: boolean; locale: Locale }>()
const emit = defineEmits<{ move: [input: JokerInput, held: boolean]; jump: [] }>()
const inputs = computed<JokerInput[]>(() => props.inCar ? ['left', 'forward', 'back', 'right', 'brake', 'boost'] : ['left', 'forward', 'back', 'right', 'boost'])
const glyphs: Record<JokerInput, string> = { left: '←', forward: '↑', back: '↓', right: '→', brake: 'B', boost: '⇧' }
function hold(event: PointerEvent, input: JokerInput) { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); emit('move', input, true) }
</script>
<template>
  <div class="joker-pad">
    <button v-for="input in inputs" :key="input" type="button" class="pad-key" :disabled="disabled" :aria-label="localize(input === 'back' ? copy.backMove : input === 'boost' && !inCar ? copy.run : copy[input], locale)" @pointerdown="hold($event, input)" @pointerup="emit('move', input, false)" @lostpointercapture="emit('move', input, false)" @pointercancel="emit('move', input, false)" @keydown.enter.prevent="emit('move', input, true)" @keyup.enter="emit('move', input, false)" @keydown.space.prevent="emit('move', input, true)" @keyup.space.prevent="emit('move', input, false)" @blur="emit('move', input, false)">{{ glyphs[input] }}</button>
    <button type="button" class="pad-key pad-jump" :aria-label="localize(copy.jump, locale)" :disabled="disabled" @click="emit('jump')">{{ localize(copy.jumpShort, locale) }}</button>
  </div>
</template>
<style scoped>
.joker-pad { display:flex; gap:.35rem; align-items:center; justify-content:center; }
.pad-key { min-width:44px; min-height:44px; border:1px solid #b7a7d44d; background:#ffffff08; border-radius:.6rem; color:#eee8f7; font:600 .85rem var(--font-display); touch-action:none; user-select:none; cursor:pointer; }
.pad-key:active { background:#d0e69f; color:#28341a; transform:translateY(1px); }
.pad-key:disabled { opacity:.3; cursor:default; }
.pad-key:focus-visible { outline:2px solid #d0e69f; outline-offset:2px; }
.pad-jump { padding:0 .6rem; font-size:.7rem; }
@media (max-width:420px) { .joker-pad { gap:.2rem; flex-wrap:wrap; } .pad-key { min-width:40px; } }
</style>
