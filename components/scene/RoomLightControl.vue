<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, ui } from '~/content/portfolio'
import type { LightPhase } from '~/composables/useLightingIntro'

const props = defineProps<{
  phase: LightPhase
  locale: Locale
}>()
const emit = defineEmits<{
  activate: [event: MouseEvent]
  replay: [event: MouseEvent]
}>()
</script>

<template>
  <button
    class="room-light-control"
    type="button"
    data-light-control
    :data-light-replay="props.phase !== 'off' ? '' : undefined"
    @click="props.phase === 'off' ? emit('activate', $event) : emit('replay', $event)"
  >
    <span aria-hidden="true">{{ props.phase === 'off' ? '☀' : '↻' }}</span>
    {{ localize(props.phase === 'off' ? ui.turnOnRoomLights : ui.replayRoomLights, props.locale) }}
  </button>
</template>

<style scoped>
.room-light-control {
  position: absolute;
  z-index: 7;
  inset-inline-start: clamp(1rem, 3vw, 2.5rem);
  inset-block-end: 7.5rem;
  max-inline-size: calc(100% - 6rem);
  box-sizing: border-box;
  min-block-size: 44px;
  min-inline-size: 44px;
  display: flex;
  align-items: center;
  gap: .55rem;
  padding: .55rem .7rem;
  border: 1px solid rgb(255 217 164 / 45%);
  border-radius: 999px;
  background: #151714;
  color: #ffe1b6;
  font: .72rem/1.4 var(--font-mono);
  text-align: start;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.room-light-control:focus-visible { outline: 2px solid #ffe1b6; outline-offset: 4px; }
@media (hover: hover) and (pointer: fine) {
  .room-light-control:hover { background: #27291f; }
}
@media (max-width: 760px) {
  .room-light-control { inset-block-end: 6.1rem; inset-inline-start: .7rem; font-size: .65rem; padding-inline: .55rem; }
}
</style>
