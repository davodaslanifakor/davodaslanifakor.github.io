<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { Vector3 } from 'three'
import type { Camera } from 'three'
import { jokerHintTarget, jokerObjective, jokerTransition, jokerTransitionDuration, jokerRampReady } from '~/utils/jokerAdventure'
import type { JokerState, JokerInput, JokerAction } from '~/utils/jokerAdventure'
import { jokerAdventureCopy as copy, localize } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'
import JokerMovementPad from './JokerMovementPad.vue'
const props = defineProps<{ state: JokerState; action: JokerAction; locale: Locale; ready: boolean; error: boolean; started: boolean; soundOn: boolean; audioUnavailable: boolean }>()
const emit = defineEmits<{ start: []; explore: []; retry: []; reset: []; recover: []; pause: []; resume: []; camera: []; jump: []; interact: []; sound: []; close: []; clear: []; move: [input: JokerInput, down: boolean] }>()
const panel = useTemplateRef<HTMLElement>('panel'), mission = useTemplateRef<HTMLElement>('mission'), footer = useTemplateRef<HTMLElement>('footer'), hint = useTemplateRef<HTMLElement>('hint'), point = new Vector3()
const objective = computed(() => jokerObjective(props.state))
const scripted = computed(() => Boolean(jokerTransition(props.state.phase)))
const progress = computed(() => Math.min(1, props.state.time / Math.max(.001, jokerTransitionDuration(props.state.phase))))
const finished = computed(() => props.state.phase === 'finished')
const enabled = computed(() => props.ready && props.started && !props.state.paused && !scripted.value && !finished.value)
const jumpReady = computed(() => enabled.value && jokerRampReady(props.state))
const worldAction = computed(() => enabled.value && props.action !== 'exit' ? props.action : null)
const status = computed(() => props.error ? copy.error : !props.ready ? copy.loading : props.state.paused ? copy.paused : props.state.gliding ? copy.gliding : props.state.blocked ? copy.blocked
  : props.state.freePlay && !scripted.value ? props.state.inCar ? props.state.onFloor ? copy.floorDriving : copy.roamDriving : copy.roamWalking
    : props.state.phase === 'garage' && props.state.garageOpen ? copy.garageOpen
    : props.state.phase === 'driving' && props.state.lifted ? props.state.onDesk ? copy.desk : copy.ramp : copy.phases[props.state.phase])
const gear = computed(() => props.state.gliding ? copy.glide : props.state.boosting ? copy.nitro : !props.state.grounded ? copy.airborne : Math.abs(props.state.speed) < .01 ? copy.park : props.state.speed < 0 ? copy.reverse : copy.drive)
const speedPercent = computed(() => Math.min(100, Math.abs(props.state.speed) / .78 * 100))
const mapping: Record<string, JokerInput> = { KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', ShiftLeft: 'boost', ShiftRight: 'boost', KeyB: 'brake' }
function key(event: KeyboardEvent, down: boolean) {
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return
  if (event.code === 'Escape' && down) { event.preventDefault(); event.stopPropagation(); emit('close'); return }
  if (!props.ready || !props.started) return
  if (mapping[event.code]) { event.preventDefault(); if (!down || enabled.value) emit('move', mapping[event.code]!, down); return }
  if (!down || event.repeat) return
  if (event.code === 'KeyP') { if (props.state.paused) emit('resume'); else emit('pause'); return }
  if (!enabled.value) return
  if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); emit('jump') }
  if (event.code === 'KeyE') { event.preventDefault(); emit('interact') }
  if (event.code === 'KeyC' && props.state.inCar) emit('camera')
  if (event.code === 'KeyR') emit('recover')
}
const down = (event: KeyboardEvent) => key(event, true), up = (event: KeyboardEvent) => key(event, false)
onMounted(() => { window.addEventListener('keydown', down); window.addEventListener('keyup', up); focusGame() })
onBeforeUnmount(() => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); emit('clear') })
function focusGame() { panel.value?.focus({ preventScroll: true }) }
function getViewport() {
  return { width: panel.value?.clientWidth ?? 1, height: panel.value?.clientHeight ?? 1, top: (mission.value?.offsetTop ?? 64) + (mission.value?.offsetHeight ?? 85) + 12, bottom: (footer.value?.offsetHeight ?? 120) + 24 }
}
function updateFrame(camera: Camera) {
  const element = hint.value
  if (!element) return
  const anchor = jumpReady.value ? props.state.position : worldAction.value ? jokerHintTarget(props.state, worldAction.value) : objective.value.point
  if (!anchor) return
  point.set(anchor.x, anchor.y + .055, anchor.z).project(camera)
  const { width: w, height: h, bottom, top } = getViewport()
  const half = element.offsetWidth / 2 + 12
  if ((worldAction.value || jumpReady.value) && props.state.inCar) {
    element.style.visibility = 'visible'
    element.style.transform = `translate(${w / 2}px, ${h - bottom - 12}px) translate(-50%, -100%)`
    return
  }
  element.style.visibility = point.z < -1 || point.z > 1 ? 'hidden' : 'visible'
  element.style.transform = `translate(${Math.max(half, Math.min(w - half, (point.x + 1) * w / 2))}px, ${Math.max(top + 30, Math.min(h - bottom - 20, (1 - point.y) * h / 2))}px) translate(-50%, -100%)`
}
defineExpose({ updateFrame, getViewport })
</script>
<template>
  <section ref="panel" class="joker-adventure" role="region" :aria-label="localize(copy.title, locale)" tabindex="-1" :dir="locale === 'fa' ? 'rtl' : 'ltr'" :data-phase="state.phase" :data-paused="state.paused" :data-ready="ready" :data-falls="state.falls" :data-view="state.cockpit ? 'cockpit' : 'chase'" :data-free-play="state.freePlay" :data-in-car="state.inCar" :data-damaged="state.damage" :data-gliding="state.gliding" :data-boosting="state.boosting" :data-on-floor="state.onFloor">
    <header ref="mission" class="joker-mission" :class="{ 'joker-mission--roaming': state.freePlay && enabled && !state.blocked && !state.gliding }">
      <div class="mission-heading"><span class="mission-number">{{ state.freePlay ? localize(copy.freePlay, locale) : `0${objective.step} / 04` }}</span><strong>{{ localize(state.freePlay ? copy.playground : copy.title, locale) }}</strong><button type="button" class="mission-close" :aria-label="localize(copy.back, locale)" @click="emit('close')">×</button></div>
      <p class="mission-objective">{{ localize(copy.objectives[objective.id], locale) }}</p>
      <p class="mission-status" role="status" aria-live="polite">{{ localize(status, locale) }}</p>
      <progress v-if="started && scripted" class="interaction-progress" :value="progress" max="1" :aria-label="localize(copy.phases[state.phase], locale)" />
    </header>
    <div v-if="enabled && (worldAction || jumpReady || !state.freePlay || !state.inCar || ['recall', 'lift', 'ramp'].includes(objective.id))" ref="hint" class="joker-hint">
      <button v-if="jumpReady" type="button" class="world-action" @click="emit('jump'); focusGame()"><kbd>Space</kbd> {{ localize(copy.jumpRamp, locale) }}</button>
      <button v-else-if="worldAction" type="button" class="world-action" @click="emit('interact'); focusGame()"><kbd>E</kbd> {{ localize(copy.actions[worldAction], locale) }}</button>
      <span v-else class="world-destination"><span class="destination-dot" />{{ localize(copy.objectives[objective.id], locale) }}</span>
    </div>
    <div ref="footer" class="joker-footer">
      <div v-if="state.inCar && !finished" class="drive-strip">
        <span>{{ localize(gear, locale) }}</span><span class="drive-meter" aria-hidden="true"><i :style="{ width: `${speedPercent}%` }" /></span>
        <span>{{ localize(state.cockpit ? copy.cockpit : copy.chase, locale) }}</span>
      </div>
      <div class="joker-actions">
        <button v-if="error" type="button" class="game-button primary" @click="emit('retry')">{{ localize(copy.retry, locale) }}</button>
        <template v-else-if="!started">
          <button type="button" class="game-button primary" :disabled="!ready" @click="emit('start'); focusGame()">{{ localize(copy.start, locale) }}</button>
        </template>
        <template v-else>
          <template v-if="finished">
            <button type="button" class="game-button primary" @click="emit('explore'); focusGame()">{{ localize(copy.keepPlaying, locale) }}</button>
            <button type="button" class="game-button" @click="emit('reset'); focusGame()">{{ localize(copy.reset, locale) }}</button>
          </template>
          <template v-else>
            <button type="button" class="game-button" @click="state.paused ? emit('resume') : emit('pause'); focusGame()">{{ localize(state.paused ? copy.resume : copy.pause, locale) }}</button>
            <button v-if="state.paused" type="button" class="game-button" @click="emit('reset'); focusGame()">{{ localize(copy.reset, locale) }}</button>
            <button v-if="state.paused && !scripted" type="button" class="game-button" @click="emit('recover'); focusGame()">{{ localize(copy.recover, locale) }}</button>
            <button v-if="state.inCar && enabled" type="button" class="game-button" :aria-pressed="state.cockpit" @click="emit('camera'); focusGame()">{{ localize(copy.camera, locale) }}</button>
            <button v-if="enabled && action === 'exit'" type="button" class="game-button" @click="emit('interact'); focusGame()">{{ localize(copy.exitCar, locale) }}</button>
          </template>
          <button v-if="state.paused" type="button" class="game-button sound-button" :aria-label="localize(audioUnavailable ? copy.unavailable : copy.sound, locale)" :aria-pressed="soundOn" @click="emit('sound'); focusGame()">{{ localize(copy.sound, locale) }} {{ soundOn ? '♪' : '♪̸' }}</button>
        </template>
      </div>
      <template v-if="enabled">
        <p class="keyboard-help">{{ localize(scripted ? copy.inScene : state.inCar ? copy.driveControls : copy.controls, locale) }}</p>
        <div class="movement-controls"><JokerMovementPad :in-car="state.inCar" :disabled="!enabled" :locale="locale" @move="(input, held) => emit('move', input, held)" @jump="emit('jump'); focusGame()" /></div>
      </template>
    </div>
  </section>
</template>
<style scoped>
.joker-adventure { position:absolute; inset:0; z-index:14; pointer-events:none; color:#eee8f7; font:500 .76rem/1.45 var(--font-display); outline:none; }
.joker-mission { position:absolute; top:4rem; inset-inline-start:1rem; max-width:min(23rem, calc(100% - 2rem)); box-sizing:border-box; padding:.7rem 1rem; background:#191521ed; border:1px solid #ac93cf40; border-radius:.8rem; box-shadow:0 8px 28px #0002; }
.mission-heading { display:flex; align-items:center; gap:.65rem; font-size:.68rem; color:#b5a8c3; }
.interaction-progress { display:block; width:100%; height:3px; margin-top:.6rem; accent-color:#cde59e; border:0; }
.mission-close { pointer-events:auto; cursor:pointer; margin-inline-start:auto; width:30px; height:30px; border:0; border-radius:5px; background:#ffffff08; color:#c8c0d2; font:400 1.3rem/1 var(--font-display); }
.mission-close:focus-visible { outline:2px solid #d0e69f; outline-offset:2px; }
.mission-number { color:#c8e499; font:600 .65rem var(--font-mono); }
.mission-objective { font-size:.94rem; font-weight:600; margin:.3rem 0; color:#edf5db; }
.mission-status { font-size:.7rem; margin:0; color:#c0b7ce; }
.joker-footer { pointer-events:auto; position:absolute; bottom:1rem; left:50%; transform:translateX(-50%); width:max-content; max-width:calc(100% - 2rem); box-sizing:border-box; padding:.65rem; background:#1b1724ee; border:1px solid #bba5d747; border-radius:.8rem; box-shadow:0 8px 30px #0003; }
.joker-actions { display:flex; align-items:center; justify-content:center; gap:.35rem; flex-wrap:wrap; }
.game-button { min-height:36px; border:1px solid #b9a5ce44; border-radius:.45rem; padding:.4rem .65rem; color:inherit; background:#ffffff06; font:inherit; cursor:pointer; }
.game-button:hover { background:#ffffff18; } .game-button:disabled { opacity:.4; cursor:default; }
.game-button:focus-visible,.world-action:focus-visible { outline:2px solid #d0e69f; outline-offset:3px; }
.primary { background:#cde59e; color:#223314; }
.sound-button { min-width:36px; }
.keyboard-help { font-size:.66rem; color:#b5a8c3; text-align:center; margin:.45rem 0 0; }
.movement-controls { display:none; padding-top:.55rem; }
.drive-strip { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:0 .35rem .55rem; text-transform:uppercase; letter-spacing:.06em; font-size:.6rem; color:#cee5a4; }
.drive-meter { height:3px; min-width:60px; flex:1; background:#cde59e22; border-radius:3px; overflow:hidden; }
.drive-meter i { display:block; height:100%; background:#cde59e; }
.joker-hint { position:absolute; inset:0 auto auto 0; width:max-content; max-width:calc(100% - 2rem); visibility:hidden; }
.world-action { pointer-events:auto; min-height:40px; background:#d0e69f; color:#233214; padding:.5rem .75rem; border:1px solid #eeffd0; border-radius:.5rem; box-shadow:0 4px 16px #0004; font:600 .76rem var(--font-display); cursor:pointer; }
.world-destination { display:flex; align-items:center; gap:.5rem; padding:.35rem .65rem; background:#20182ce8; border:1px solid #cde59e55; border-radius:20px; color:#e0eecb; font-size:.65rem; }
.destination-dot { width:6px; height:6px; background:#d0e69f; border-radius:50%; }
kbd { padding:.1rem .3rem; border:1px solid #485934; border-radius:3px; }
@media (max-width:700px), (pointer:coarse) { .movement-controls { display:block; } .joker-footer { width:calc(100% - 1.2rem); max-width:560px; bottom:.6rem; } .game-button { min-height:44px; font-size:.68rem; padding:.35rem .55rem; } .joker-mission--roaming .mission-status { display:none; } .keyboard-help { display:none; } .joker-mission { top:3.9rem; inset-inline-start:.6rem; padding:.55rem .75rem; } .mission-status { max-width:30ch; } }
@media (max-height:560px) { .joker-mission { top:3.6rem; max-width:230px; padding:.4rem .6rem; } .mission-status { display:none; } .joker-footer { bottom:.4rem; } .keyboard-help { display:none; } }
</style>

