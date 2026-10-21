import { computed, onScopeDispose, readonly, shallowRef, watch } from 'vue'

export type JokerPhase = 'intro' | 'showing' | 'hiding' | 'shuffling' | 'picking' | 'result'
export interface JokerGameState {
  phase: JokerPhase
  slots: readonly number[]
  winner: number
  selected: number | null
  swaps: readonly (readonly [number, number])[]
  swapIndex: number
  elapsed: number
  memory: boolean
}
export const JOKER_SWAP_MS = 720
export const JOKER_HIDE_MS = 350
const initial = (memory: boolean): JokerGameState => ({ phase: 'intro', slots: [0, 1, 2], winner: 0, selected: null, swaps: [], swapIndex: 0, elapsed: 0, memory })

/** One round owns its mapping; input cannot change it during a shuffle or reveal. */
export function useJokerCardGame(options: { active: () => boolean; reducedMotion: () => boolean; random?: () => number }) {
  const memoryPreference = shallowRef(false)
  const state = shallowRef<JokerGameState>(initial(options.reducedMotion()))
  const random = options.random ?? Math.random
  const won = computed(() => state.value.phase === 'result' && state.value.slots[state.value.selected!] === state.value.winner)
  let previousTime: number | null = null

  function reset() {
    previousTime = null
    state.value = initial(options.reducedMotion() || memoryPreference.value)
  }
  function setMemory(value: boolean) {
    if (!['intro', 'result'].includes(state.value.phase)) return
    memoryPreference.value = value
    reset()
  }
  function start() {
    if (!options.active() || !['intro', 'result'].includes(state.value.phase)) return
    const pairs = [[0, 1], [1, 2], [0, 2]] as const
    const swaps: (readonly [number, number])[] = []
    let last = -1
    for (let i = 0; i < 5; i++) {
      const choices = [0, 1, 2].filter(index => index !== last)
      last = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))]!
      swaps.push(pairs[last]!)
    }
    state.value = { ...initial(options.reducedMotion() || memoryPreference.value), phase: 'showing', winner: Math.min(2, Math.floor(random() * 3)), swaps }
  }
  function shuffle() {
    if (!options.active() || state.value.phase !== 'showing') return
    state.value = { ...state.value, phase: state.value.memory ? 'picking' : 'hiding', elapsed: 0 }
  }
  function pick(slot: number) {
    if (!options.active() || state.value.phase !== 'picking' || !Number.isInteger(slot) || slot < 0 || slot > 2) return
    state.value = { ...state.value, phase: 'result', selected: slot, elapsed: 0 }
  }
  function updateFrame(time: number, visible = true) {
    const delta = previousTime === null ? 0 : Math.min(64, Math.max(0, time - previousTime))
    previousTime = time
    if (!options.active() || !visible) return
    const current = state.value
    if (!['hiding', 'shuffling', 'result'].includes(current.phase)) return
    if (current.phase === 'result' && current.elapsed >= 1600) return
    const next = { ...current, elapsed: current.elapsed + delta }
    if (next.phase === 'hiding' && next.elapsed >= JOKER_HIDE_MS) {
      next.phase = 'shuffling'
      next.elapsed = 0
    } else if (next.phase === 'shuffling' && next.elapsed >= JOKER_SWAP_MS) {
      const [a, b] = next.swaps[next.swapIndex]!
      const slots = [...next.slots]
      ;[slots[a], slots[b]] = [slots[b]!, slots[a]!]
      next.slots = slots
      next.swapIndex++
      next.elapsed = 0
      if (next.swapIndex === next.swaps.length) next.phase = 'picking'
    }
    state.value = next
  }
  // A changed OS preference cancels the round rather than hiding a shuffle from the player.
  watch([options.active, options.reducedMotion], reset, { flush: 'sync' })
  onScopeDispose(() => { previousTime = null })
  return { state: readonly(state), won, start, shuffle, pick, setMemory, updateFrame }
}
