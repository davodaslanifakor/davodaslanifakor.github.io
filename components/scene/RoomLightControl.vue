<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, ui } from '~/content/portfolio'
import type { LightPhase } from '~/composables/useLightingIntro'

const props = withDefaults(defineProps<{
  phase: LightPhase
  locale: Locale
  ready?: boolean
}>(), { ready: true })
const emit = defineEmits<{
  activate: [event: MouseEvent]
  replay: [event: MouseEvent]
}>()
</script>

<template>
  <div
    class="room-welcome"
    :class="{ 'room-welcome--entry': props.phase === 'off' }"
    :role="props.phase === 'off' ? 'region' : undefined"
    :aria-label="props.phase === 'off' ? localize(ui.roomEntryLabel, props.locale) : undefined"
  >
    <div v-if="props.phase === 'off'" class="room-welcome__copy">
      <h2>{{ localize(ui.roomEntryTitle, props.locale) }}</h2>
      <p>{{ localize(ui.roomEntryDescription, props.locale) }}</p>
    </div>
    <div class="room-welcome__actions">
      <button
        class="room-light-control"
        type="button"
        data-light-control
        :disabled="!props.ready"
        :data-light-replay="props.phase !== 'off' ? '' : undefined"
        @click="props.phase === 'off' ? emit('activate', $event) : emit('replay', $event)"
      >
        <span v-if="props.phase !== 'off'" aria-hidden="true">↻</span>
        {{ localize(props.phase === 'off' ? ui.enterRoom : ui.replayRoomLights, props.locale) }}
        <span v-if="props.phase === 'off'" aria-hidden="true">→</span>
      </button>
      <NuxtLink v-if="props.phase === 'off'" class="room-welcome__cv" to="/cv">
        {{ localize(ui.viewMyCv, props.locale) }} <span aria-hidden="true">↗</span>
      </NuxtLink>
    </div>
    <p v-if="props.phase === 'off' && !props.ready" class="room-welcome__loading" role="status">{{ localize(ui.loadingRoom, props.locale) }}</p>
  </div>
</template>

<style scoped>
.room-welcome {
  position: absolute;
  z-index: 7;
  inset-inline-start: clamp(1rem, 3vw, 2.5rem);
  inset-block-end: 7.5rem;
  max-inline-size: calc(100% - 6rem);
}
.room-welcome__actions { display: flex; align-items: center; gap: 1.3rem; }
.room-light-control {
  box-sizing: border-box;
  min-block-size: 44px;
  min-inline-size: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
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
.room-welcome--entry {
  inset: 48% auto auto 50%;
  transform: translate(-50%, -50%);
  inline-size: min(34rem, calc(100% - 3rem));
  max-inline-size: none;
  text-align: center;
  color: #f2efe8;
}
.room-welcome__copy h2 { margin: 0; font: 500 clamp(2rem, 4.2vw, 3.5rem)/1.08 var(--font-display); letter-spacing: -.045em; text-wrap: balance; }
.room-welcome__copy p { max-inline-size: 26rem; margin: 1rem auto 1.8rem; color: #b5b9af; font: .95rem/1.65 var(--font-display); text-wrap: balance; }
.room-welcome--entry .room-welcome__actions { justify-content: center; }
.room-welcome--entry .room-light-control { min-block-size: 50px; padding: .8rem 1.35rem; gap: .85rem; background: #c6d8a2; border-color: #c6d8a2; color: #192018; font: 600 .88rem/1.3 var(--font-display); }
.room-welcome--entry .room-light-control:disabled { opacity: .55; cursor: wait; }
.room-welcome__cv { display: inline-flex; align-items: center; gap: .6rem; min-block-size: 48px; color: #eeeee6; font: 500 .88rem/1.3 var(--font-display); text-decoration: none; text-underline-offset: .3em; }
.room-welcome__loading { position: absolute; inset: 100% 0 auto; margin: 1rem 0 0; color: #a4aaa0; font: .68rem/1.5 var(--font-mono); }
.room-light-control:focus-visible, .room-welcome__cv:focus-visible { outline: 2px solid #c6d8a2; outline-offset: 5px; }
@media (hover: hover) and (pointer: fine) {
  .room-light-control:hover:not(:disabled) { background: #27291f; }
  .room-welcome--entry .room-light-control:hover:not(:disabled) { background: #d9e7be; }
  .room-welcome__cv:hover { text-decoration: underline; }
}
@media (max-width: 760px) {
  .room-welcome:not(.room-welcome--entry) { inset-block-end: 6.1rem; inset-inline-start: .7rem; }
  .room-light-control { font-size: .65rem; padding-inline: .55rem; }
  .room-welcome__copy p { font-size: .85rem; margin-block: .85rem 1.4rem; }
  .room-welcome__actions { gap: 1rem; }
}
@media (max-height: 500px) and (min-aspect-ratio: 1/1) {
  .room-welcome--entry { inset-block-start: 46%; inline-size: min(32rem, calc(100% - 16rem)); }
  .room-welcome__copy h2 { font-size: 1.7rem; }
  .room-welcome__copy p { font-size: .75rem; margin-block: .5rem .75rem; }
  .room-welcome--entry .room-light-control { min-block-size: 44px; padding-block: .6rem; }
}
</style>
