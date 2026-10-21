import { computed, onScopeDispose, readonly, shallowRef, watch } from 'vue'
import { BASS_CONTACT, BASS_HITS } from '../utils/subwoofer'
import { keyboardKeyId } from '../utils/deskKeyboard'
import { useToyGameAudio } from './useToyGameAudio'
import { containsXZ, deskHeightAt, deskRoute, JUMP_SPEED, keyboardKeyAt, safeMouseOffset, stepDeskBody, surfaceHeightAt, worldWithMouse } from '../utils/deskPlayground'
import type { DeskAction, DeskBody, DeskWorld, MinionId, Point3 } from '../utils/deskPlayground'

export type DeskPhase = 'arriving' | 'roaming' | 'acting' | 'climbing' | 'key-hop' | 'paused'
export type DeskFeedback = 'arriving' | 'explore' | 'walking' | 'unreachable' | 'comeCloser' | 'pressing' | 'pulling' | 'connecting' | 'laptopOff' | 'laptopOn' | 'monitorOff' | 'monitorOn' | 'typing' | 'caught' | 'erasing' | 'erased' | 'pushing' | 'riding' | 'parked' | 'climbing' | 'wakeLaptop' | 'keyReady' | 'keyHopping' | 'keyUnsupported' | 'keyQueueFull' | 'bassTurning' | 'bassPlaying' | 'bassDone'
export interface DeskMinionState {
  phase: DeskPhase
  body: DeskBody
  action: DeskAction | null
  actionTime: number
  laptopOn: boolean
  monitorConnected: boolean
  destination: Point3 | null
  feedback: DeskFeedback
  landing: number
  jumpPrep: number
  travelled: number
  keystrokes: number
  typedText: string
  typing: boolean
  queuedKeys: readonly { index: number; text: string }[]
  keyHop: { from: Point3; to: Point3; index: number; text: string; time: number; duration: number } | null
  pressedKey: number
  keyPulse: number
  reaction: number
  mouseOffset: number
  speakerTime: number
  climbFrom: Point3 | null
  climbTo: Point3 | null
}
export type MoveKey = 'left' | 'right' | 'forward' | 'back'
const distance = (a: Point3, b: Point3) => Math.hypot(a.x - b.x, a.z - b.z)
const smooth = (t: number) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t) }
export const ACTION_CONTACT = 0.52
export const ACTION_DURATION = 1.12
export const CABLE_CONTACT = 1.45
export const CABLE_DURATION = 2.45
export const MOUSE_DURATION = 3.65
const mix = (a: number, b: number, t: number) => a + (b - a) * t

export function useDeskMinion(options: { character: () => MinionId | null; world: () => DeskWorld; reducedMotion: () => boolean; ready: () => boolean }) {
  const initial = (): DeskMinionState => {
    const world = options.world(), position = { ...(options.reducedMotion() ? world.front : world.spawn) }
    position.y = deskHeightAt(world, position.x, position.z, position.y + 0.02).height
    return { phase: options.reducedMotion() ? 'roaming' : 'arriving', body: { position, velocity: { x: 0, y: 0, z: 0 }, grounded: true, surface: 'static_desk_top', heading: 0 }, action: null, actionTime: 0, laptopOn: true, monitorConnected: true, destination: null, feedback: options.reducedMotion() ? 'explore' : 'arriving', landing: 1, jumpPrep: -1, travelled: 0, keystrokes: 0, typedText: '', typing: false, queuedKeys: [], keyHop: null, pressedKey: -1, keyPulse: 1, reaction: -1, mouseOffset: 0, speakerTime: -1, climbFrom: null, climbTo: null }
  }
  const state = shallowRef<DeskMinionState>(initial()), audio = useToyGameAudio(), held = new Set<MoveKey>()
  let route: Point3[] = [], pendingAction: DeskAction | null = null
  let previous: number | null = null, accumulator = 0, stalled = 0, footstep = 0
  let actionOrigin: Point3 = { x: 0, y: 0, z: 0 }, mouseStart = 0, mouseGoal = 0
  let resumePhase: Exclude<DeskPhase, 'paused'> = 'roaming'
  const playable = () => Boolean(options.character()) && options.ready() && state.value.phase !== 'paused'
  const currentWorld = computed(() => worldWithMouse(options.world(), state.value.mouseOffset))
  const targetFor = (action: DeskAction) => {
    const world = options.world()
    if (action === 'erase') return world.keyboard
    if (action === 'mouse') return world.mouse ? { ...world.mouse, x: world.mouse.x + state.value.mouseOffset } : null
    return world[action]
  }
  const nearby = computed<DeskAction | null>(() => {
    const s = state.value, body = s.body, world = currentWorld.value
    if (!body.grounded || s.typing || !['roaming', 'arriving'].includes(s.phase)) return null
    const candidates: { action: DeskAction; distance: number }[] = []
    for (const action of ['laptop', 'cable', 'mouse'] as const) {
      const target = targetFor(action)
      if (target && distance(body.position, target) < 0.065 && Math.abs(body.position.y - target.y) < 0.035) candidates.push({ action, distance: distance(body.position, target) })
    }
    if (world.speakerBounds && containsXZ(world.speakerBounds, body.position.x, body.position.z, 0.06) && Math.abs(body.position.y - world.desk.max.y) < 0.035) candidates.push({ action: 'speaker', distance: 0.03 })
    // The whole keyboard is an affordance, not just a tiny point in its middle.
    if (world.keyboardBounds && containsXZ(world.keyboardBounds, body.position.x, body.position.z, 0.025)
      && Math.abs(body.position.y - world.keyboardBounds.max.y) < 0.055) candidates.push({ action: 'keyboard', distance: 0.045 })
    return candidates.sort((a, b) => a.distance - b.distance)[0]?.action ?? null
  })
  function clearInput() { held.clear() }
  function cancelWalk() { route = []; pendingAction = null; stalled = 0 }
  function reset() {
    audio.close(); clearInput(); cancelWalk(); previous = null; accumulator = 0; footstep = 0
    state.value = initial()
    if (options.character() && !options.reducedMotion()) {
      route = deskRoute(options.world(), state.value.body.position, options.world().front)
      state.value = { ...state.value, destination: options.world().front }
    }
  }
  function cancel() {
    clearInput(); cancelWalk(); audio.stop()
    state.value = { ...state.value, phase: 'roaming', action: null, actionTime: 0, typing: false, queuedKeys: [], keyHop: null, speakerTime: -1, destination: null, climbFrom: null, climbTo: null, jumpPrep: -1, feedback: 'explore', body: { ...state.value.body, grounded: false, velocity: { x: 0, y: 0, z: 0 } } }
  }
  function press(key: MoveKey, down: boolean) {
    if (!down) { held.delete(key); return }
    if (!playable()) return
    if (state.value.typing || state.value.phase === 'acting' || state.value.phase === 'climbing') cancel()
    void audio.unlock(); cancelWalk(); held.add(key)
    state.value = { ...state.value, phase: 'roaming', feedback: 'explore', destination: null }
  }
  function jump() {
    if (!playable() || ['acting', 'climbing', 'key-hop'].includes(state.value.phase) || !state.value.body.grounded || state.value.jumpPrep >= 0) return
    void audio.unlock()
    state.value = { ...state.value, typing: false, queuedKeys: [], keyHop: null, jumpPrep: 0 }
  }
  function walkTo(destination: Point3, action: DeskAction | null = null) {
    if (!playable()) return
    if (state.value.typing || state.value.phase === 'acting' || state.value.phase === 'climbing') cancel()
    clearInput(); cancelWalk(); void audio.unlock()
    const world = currentWorld.value, target = { ...destination, y: deskHeightAt(world, destination.x, destination.z).height }
    route = deskRoute(world, state.value.body.position, target)
    pendingAction = route.length ? action : null
    state.value = { ...state.value, phase: 'roaming', destination: route.length ? target : null, feedback: route.length ? 'walking' : 'unreachable' }
  }
  function requestAction(action: DeskAction) {
    if (!playable()) return
    if ((action === 'keyboard' || action === 'erase') && !state.value.laptopOn) { state.value = { ...state.value, feedback: 'wakeLaptop' }; return }
    const target = targetFor(action)
    if (target) walkTo(target, action)
  }
  function approach(action: DeskAction) {
    const target = targetFor(action)
    if (target) walkTo(target)
  }
  function startTyping() {
    if (!playable() || !state.value.laptopOn) { state.value = { ...state.value, feedback: 'wakeLaptop' }; return }
    const world = options.world(), body = state.value.body
    if (!world.keyboardBounds || !containsXZ(world.keyboardBounds, body.position.x, body.position.z, 0.003)
      || Math.abs(body.position.y - world.keyboardBounds.max.y) > 0.035 || !body.grounded) { requestAction('keyboard'); return }
    if (!Object.keys(world.keyMap).length) { state.value = { ...state.value, feedback: 'keyUnsupported' }; return }
    clearInput(); cancelWalk(); void audio.unlock()
    state.value = { ...state.value, typing: true, phase: 'roaming', action: null, destination: null, feedback: 'keyReady', jumpPrep: -1, body: { ...body, velocity: { x: 0, y: 0, z: 0 } } }
  }
  function typeKey(key: string, code = '') {
    const s = state.value
    if (!playable() || !s.typing || !s.laptopOn) return
    const id = keyboardKeyId(key, code), index = id ? options.world().keyMap[id] : undefined
    if (index === undefined || (key.length !== 1 && !['Enter', 'Backspace'].includes(key))) { state.value = { ...s, feedback: 'keyUnsupported' }; return }
    if (s.queuedKeys.length >= 12) { state.value = { ...s, feedback: 'keyQueueFull' }; return }
    void audio.unlock()
    state.value = { ...s, queuedKeys: [...s.queuedKeys, { index, text: key === 'Enter' ? '\n' : key === 'Backspace' ? '\b' : key }], feedback: 'keyHopping' }
  }
  function stepTyping(s: DeskMinionState, dt: number) {
    let hop = s.keyHop
    if (!hop) {
      const next = s.queuedKeys[0]
      if (!next) { state.value = { ...s, landing: Math.min(1, s.landing + dt), feedback: 'keyReady' }; return }
      const key = options.world().keys[next.index]!
      const to = { ...key, y: deskHeightAt(options.world(), key.x, key.z).height }
      hop = { from: { ...s.body.position }, to, index: next.index, text: next.text, time: 0, duration: options.reducedMotion() ? 0.18 : 0.3 + Math.min(0.4, distance(s.body.position, to) * 1.6) }
      s = { ...s, queuedKeys: s.queuedKeys.slice(1), phase: 'key-hop', jumpPrep: 0 }
      audio.play('jump')
    }
    const time = hop.time + dt, t = Math.min(1, Math.max(0, (time - 0.08) / hop.duration))
    const height = options.reducedMotion() ? 0 : 0.025 + Math.min(0.035, distance(hop.from, hop.to) * 0.2)
    const position = options.reducedMotion() && t < 1 ? { ...hop.from } : { x: mix(hop.from.x, hop.to.x, t), y: mix(hop.from.y, hop.to.y, t) + 4 * height * t * (1 - t), z: mix(hop.from.z, hop.to.z, t) }
    const heading = distance(hop.from, hop.to) > 0.002 ? Math.atan2(hop.to.x - hop.from.x, hop.to.z - hop.from.z) : s.body.heading
    const velocity = { x: 0, y: t > 0 && t < 1 ? (hop.to.y - hop.from.y + 4 * height * (1 - 2 * t)) / hop.duration : 0, z: 0 }
    let next: DeskMinionState = { ...s, keyHop: { ...hop, time }, jumpPrep: t === 0 ? time : -1, body: { ...s.body, position, heading, velocity, grounded: t === 1 || t === 0 } }
    if (t === 1) {
      next = { ...next, phase: 'roaming', keyHop: null, landing: 0, body: { ...next.body, surface: 'static_laptop_keycaps' } }
      next = hitKey(next, hop.index, hop.text)
    }
    state.value = next
  }
  function beginAction(action: DeskAction) {
    if (action === 'keyboard') { startTyping(); return }
    const target = targetFor(action), body = state.value.body
    if (action === 'speaker' && target && body.grounded && distance(body.position, target) > 0.018) { walkTo(target, action); return }
    if (!target || !body.grounded || distance(body.position, target) > 0.06 || Math.abs(body.position.y - target.y) > 0.03) return
    if (action === 'erase' && !state.value.laptopOn) return
    if (distance(body.position, target) > 0.018) { walkTo(target, action); return }
    clearInput(); cancelWalk()
    actionOrigin = { ...body.position }; mouseStart = state.value.mouseOffset
    mouseGoal = safeMouseOffset(options.world(), mouseStart, mouseStart + 0.155)
    if (action === 'mouse' && mouseGoal - mouseStart < 0.04) { state.value = { ...state.value, feedback: 'parked' }; return }
    const feedback = action === 'speaker' ? 'bassTurning' : action === 'erase' ? 'erasing' : action === 'mouse' ? 'pushing' : action === 'laptop' ? 'pressing' : state.value.monitorConnected ? 'pulling' : 'connecting'
    state.value = { ...state.value, phase: 'acting', action, actionTime: 0, jumpPrep: -1, destination: null, feedback, body: { ...body, heading: action === 'mouse' ? Math.PI / 2 : Math.PI, velocity: { x: 0, y: 0, z: 0 } } }
  }
  function interact() {
    if (!playable() || state.value.phase === 'acting' || state.value.phase === 'climbing') return
    void audio.unlock()
    if (nearby.value) beginAction(nearby.value)
    else state.value = { ...state.value, feedback: 'comeCloser' }
  }
  function pause() {
    clearInput(); audio.stop(); previous = null; accumulator = 0
    if (state.value.phase === 'paused') return
    resumePhase = state.value.phase; state.value = { ...state.value, phase: 'paused' }
  }
  function resume() {
    if (!options.character() || !options.ready() || state.value.phase !== 'paused') return
    previous = null; void audio.unlock(); state.value = { ...state.value, phase: resumePhase }
  }
  function hitKey(s: DeskMinionState, key: number, text?: string) {
    if (!s.laptopOn || key < 0) return s
    audio.play('key')
    const typedText = text === '\b' ? Array.from(s.typedText).slice(0, -1).join('') : text ? Array.from(s.typedText + text).slice(0, 96).join('') : s.typedText
    return { ...s, typedText, keystrokes: Array.from(typedText).length, pressedKey: key, keyPulse: 0, reaction: s.reaction < 0 ? 0 : s.reaction }
  }
  function act(s: DeskMinionState, dt: number) {
    const time = s.actionTime + dt, action = s.action
    const next = { ...s, actionTime: time }
    const crossed = (mark: number) => s.actionTime < mark && time >= mark
    let duration = ACTION_DURATION
    if (action === 'laptop') {
      if (crossed(ACTION_CONTACT)) { next.laptopOn = !s.laptopOn; audio.play(next.laptopOn ? 'powerOn' : 'powerOff') }
      if (time >= duration) next.feedback = next.laptopOn ? 'laptopOn' : 'laptopOff'
    } else if (action === 'speaker') {
      duration = 2.8
      if (crossed(BASS_CONTACT)) { next.speakerTime = 0; next.reaction = 0; next.feedback = 'bassPlaying' }
      for (const beat of BASS_HITS) if (crossed(BASS_CONTACT + beat)) audio.play('bass')
      const recoil = !options.reducedMotion() && time > BASS_CONTACT ? Math.sin(Math.min(1, (time - BASS_CONTACT) / 0.7) * Math.PI) * 0.015 : 0
      next.body = { ...s.body, position: { ...actionOrigin, z: actionOrigin.z + recoil } }
      if (time >= duration) next.feedback = 'bassDone'
    } else if (action === 'cable') {
      duration = CABLE_DURATION
      if (crossed(0.5) || crossed(0.95)) audio.play('strain')
      if (crossed(CABLE_CONTACT)) { next.monitorConnected = !s.monitorConnected; next.reaction = 0; audio.play(next.monitorConnected ? 'plug' : 'unplug') }
      // A short recoil stays within the free approach space in front of the socket.
      const recoil = s.feedback === 'pulling' && time > CABLE_CONTACT ? Math.sin(Math.min(1, (time - CABLE_CONTACT) / 0.65) * Math.PI) * 0.024 : 0
      next.body = { ...s.body, position: { ...actionOrigin, z: actionOrigin.z + recoil } }
      if (time >= duration) next.feedback = next.monitorConnected ? 'monitorOn' : 'monitorOff'
    } else if (action === 'erase') {
      duration = 1.25
      if (crossed(0.6)) { next.keystrokes = 0; next.typedText = ''; audio.play('erase') }
      if (time >= duration) next.feedback = 'erased'
    } else if (action === 'mouse' && options.world().mouseBounds) {
      duration = MOUSE_DURATION
      const box = options.world().mouseBounds!, pushEnd = mouseStart + (mouseGoal - mouseStart) * 0.32
      const push = smooth((time - 0.35) / 0.8), coast = smooth((time - 1.85) / 1.35)
      next.mouseOffset = time < 1.85 ? mix(mouseStart, pushEnd, push) : mix(pushEnd, mouseGoal, coast)
      const board = smooth((time - 1.2) / 0.65), centerX = (box.min.x + box.max.x) / 2
      next.body = { ...s.body, grounded: time < 1.2 || time >= 1.85, surface: time >= 1.85 ? 'static_mouse' : s.body.surface, position: { x: mix(actionOrigin.x + next.mouseOffset - mouseStart, centerX + next.mouseOffset, board), y: mix(actionOrigin.y, box.max.y, board) + (options.reducedMotion() ? 0 : Math.sin(board * Math.PI) * 0.025), z: actionOrigin.z } }
      if (crossed(0.4)) audio.play('push')
      if (crossed(1.2)) audio.play('jump')
      if (crossed(1.85)) audio.play('land')
      next.feedback = time > 1.85 ? 'riding' : 'pushing'
      if (time >= duration) next.feedback = 'parked'
    }
    if (time >= duration) { next.phase = 'roaming'; next.action = null }
    state.value = next
  }
  function step(dt: number) {
    let s = state.value
    s = { ...s, speakerTime: s.speakerTime >= 0 && s.speakerTime < 2.1 ? s.speakerTime + dt : -1, keyPulse: Math.min(1, s.keyPulse + dt), reaction: s.reaction >= 0 && s.reaction < 4 ? s.reaction + dt : -1 }
    if (s.typing) { stepTyping(s, dt); return }
    if (s.phase === 'acting') { act(s, dt); return }
    if (s.phase === 'climbing' && s.climbFrom && s.climbTo) {
      const t = s.actionTime + dt, lift = smooth(t / 0.48), across = smooth((t - 0.25) / 0.5)
      const position = { x: mix(s.climbFrom.x, s.climbTo.x, across), y: mix(s.climbFrom.y, s.climbTo.y + 0.003, lift), z: mix(s.climbFrom.z, s.climbTo.z, across) }
      const done = t >= 0.78
      if (done) { while (route.length > 1 && distance(route[0]!, position) < 0.07) route.shift(); audio.play('land') }
      state.value = { ...s, actionTime: t, phase: done ? 'roaming' : 'climbing', feedback: done ? 'walking' : 'climbing', climbFrom: done ? null : s.climbFrom, climbTo: done ? null : s.climbTo, body: { ...s.body, position, grounded: done }, landing: done ? 0 : s.landing }
      return
    }
    let body = s.body
    if (s.jumpPrep >= 0) {
      s.jumpPrep += dt
      if (s.jumpPrep >= 0.12) { body = { ...body, grounded: false, velocity: { ...body.velocity, y: JUMP_SPEED } }; s.jumpPrep = -1; audio.play('jump') }
    }
    const direction = { x: Number(held.has('right')) - Number(held.has('left')), z: Number(held.has('back')) - Number(held.has('forward')) }
    let waypoint = route[0]
    if (waypoint && distance(body.position, waypoint) < 0.013) { route.shift(); waypoint = route[0] }
    if (waypoint) {
      const length = distance(body.position, waypoint)
      direction.x = (waypoint.x - body.position.x) / Math.max(length, 0.022); direction.z = (waypoint.z - body.position.z) / Math.max(length, 0.022)
      const ahead = { x: body.position.x + direction.x * 0.055, z: body.position.z + direction.z * 0.055 }
      const stepAhead = currentWorld.value.surfaces.some(surface => surface.walkable && containsXZ(surface.bounds, ahead.x, ahead.z, 0.019) && (surfaceHeightAt(surface, ahead.x, ahead.z) ?? surface.bounds.max.y) > body.position.y + 0.009)
      if (body.grounded && stepAhead) {
        const support = deskHeightAt(currentWorld.value, ahead.x, ahead.z)
        if (support.height > body.position.y + 0.012 && support.height < body.position.y + 0.11 && !currentWorld.value.surfaces.some(surface => !surface.walkable && containsXZ(surface.bounds, ahead.x, ahead.z, 0.02))) {
          state.value = { ...s, phase: 'climbing', actionTime: 0, feedback: 'climbing', climbFrom: { ...body.position }, climbTo: { ...ahead, y: support.height }, body: { ...body, heading: Math.atan2(direction.x, direction.z), velocity: { x: 0, y: 0, z: 0 } } }; audio.play('grip'); return
        }
        body = { ...body, grounded: false, velocity: { ...body.velocity, y: JUMP_SPEED } }; audio.play('jump')
      }
    }
    const nextBody = stepDeskBody(currentWorld.value, body, direction, dt), landed = !body.grounded && nextBody.grounded
    const travelled = distance(nextBody.position, body.position)
    footstep += travelled
    if (landed) audio.play('land')
    if (nextBody.grounded && footstep > 0.045) { footstep = 0; audio.play(nextBody.surface.includes('laptop') || nextBody.surface === 'int_monitor' ? 'keyStep' : 'step') }
    const key = keyboardKeyAt(options.world(), nextBody.position)
    if (nextBody.grounded && s.keyPulse > 0.22 && key >= 0 && (landed || (key !== s.pressedKey && travelled > 0.0001))) s = hitKey(s, key)
    stalled = waypoint && travelled < 0.00015 && nextBody.grounded ? stalled + dt : 0
    if (stalled > 2) { cancelWalk(); state.value = { ...s, body: nextBody, phase: 'roaming', destination: null, feedback: 'unreachable' }; return }
    const arrived = !route.length && Boolean(s.destination) && nextBody.grounded
    state.value = { ...s, body: nextBody, travelled: s.travelled + travelled, landing: landed ? 0 : Math.min(1, s.landing + dt), phase: arrived ? 'roaming' : s.phase, destination: arrived ? null : s.destination, feedback: arrived ? 'explore' : s.feedback }
    if (arrived && pendingAction) { const action = pendingAction; pendingAction = null; beginAction(action) }
  }
  function updateFrame(time: number, visible = true) {
    const delta = previous === null ? 0 : Math.max(0, Math.min(0.05, (time - previous) / 1000)); previous = time
    if (!options.character()) return
    if (!visible) { pause(); return }
    if (!options.ready() || state.value.phase === 'paused') { clearInput(); accumulator = 0; return }
    accumulator += delta
    while (accumulator >= 1 / 120) { step(1 / 120); accumulator -= 1 / 120 }
  }
  watch([options.character, options.world], reset, { immediate: true, flush: 'sync' })
  const hidden = () => { if (document.hidden) pause() }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', hidden)
  if (typeof window !== 'undefined') window.addEventListener('blur', pause)
  onScopeDispose(() => { clearInput(); audio.close(); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', hidden); if (typeof window !== 'undefined') window.removeEventListener('blur', pause) })
  return { state: readonly(state), nearby, press, clearInput, jump, walkTo, approach, requestAction, interact, typeKey, reset, cancel, pause, resume, updateFrame, soundOn: audio.enabled, audioUnavailable: audio.unavailable, toggleSound: audio.toggle }
}
