import { computed, onMounted, onScopeDispose, shallowRef, watch } from 'vue'
import { initialJokerState, interactJoker, jokerAction, jumpJoker, stepJoker, recoverJoker, jokerTransition, continueJoker } from '~/utils/jokerAdventure'
import type { JokerInput, JokerObstacle } from '~/utils/jokerAdventure'
import { useToyGameAudio } from './useToyGameAudio'

export function useJokerAdventure(options: { active: () => boolean; reducedMotion: () => boolean; obstacles?: () => readonly JokerObstacle[] }) {
  const state = shallowRef(initialJokerState()), started = shallowRef(false)
  const audio = useToyGameAudio(), held = new Set<JokerInput>()
  let previous = 0, accumulator = 0
  const clear = () => { held.clear(); previous = 0; accumulator = 0 }
  const pause = () => { if (started.value) state.value = { ...state.value, paused: true }; clear(); audio.stop() }
  const reset = () => { clear(); audio.stop(); state.value = initialJokerState(); started.value = false }
  const start = () => { started.value = true; state.value = { ...state.value, paused: false }; previous = 0; void audio.unlock().then(ok => { if (ok) audio.play('start') }) }
  const explore = () => { const next = continueJoker(state.value); if (next === state.value) return; clear(); state.value = next; start() }
  function press(input: JokerInput, down: boolean) { if (down && started.value && !state.value.paused) held.add(input); else held.delete(input) }
  function interact() { const next = interactJoker(state.value, options.obstacles?.()); if (next !== state.value) { audio.play('grip'); state.value = next; held.clear() } }
  function jump() { const next = jumpJoker(state.value); if (next !== state.value) { if (next.vertical > state.value.vertical) audio.play('jump'); state.value = next } }
  function updateFrame(time: number, ready: boolean, obstacles: readonly JokerObstacle[]) {
    if (!options.active() || !ready || !started.value || state.value.paused || document.hidden) { previous = 0; accumulator = 0; return }
    // Authored interactions are cheap to advance and must not become slow motion
    // when rendering drops frames. Driving keeps its bounded physics catch-up.
    accumulator += previous ? Math.min(jokerTransition(state.value.phase) ? .25 : .08, Math.max(0, (time - previous) / 1000)) : 0
    previous = time
    let next = state.value
    while (accumulator >= 1 / 120) { next = stepJoker(next, held, 1 / 120, obstacles, options.reducedMotion()); accumulator -= 1 / 120 }
    audio.setMotor(next.inCar && next.phase === 'driving' ? Math.abs(next.speed) / .78 : null, next.boosting, next.gliding)
    if (next.blocked && !state.value.blocked) audio.play('bass')
    if (next.boosting && !state.value.boosting) audio.play('push')
    if (next.gliding && !state.value.gliding) audio.play('catch')
    if (next.inCar && !state.value.inCar) audio.play('powerOn')
    if (next.phase === 'crashing' && state.value.phase !== 'crashing') audio.play('miss')
    if (next.damage && !state.value.damage) { audio.play('land'); audio.play('catch') }
    if (next.falls !== state.value.falls) { clear(); audio.play('miss') }
    if (next.grounded && !state.value.grounded) audio.play('land')
    state.value = next
  }
  const hidden = () => { if (document.hidden) pause() }
  onMounted(() => { window.addEventListener('blur', pause); document.addEventListener('visibilitychange', hidden) })
  onScopeDispose(() => { clear(); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', hidden) })
  watch(options.active, reset)
  return { state, started, action: computed(() => jokerAction(state.value, options.obstacles?.())), soundOn: audio.enabled, audioUnavailable: audio.unavailable,
    start, explore, reset, pause, resume: start, press, clear, interact, jump, updateFrame, toggleSound: audio.toggle,
    recover: () => { if (!started.value || jokerTransition(state.value.phase) || state.value.phase === 'finished') return; clear(); state.value = recoverJoker(state.value, options.obstacles?.()); audio.play('start') },
    camera: () => { if (!state.value.inCar || state.value.paused || state.value.phase !== 'driving') return; state.value = { ...state.value, cockpit: !state.value.cockpit } } }
}
