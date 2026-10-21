import { Box3, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { JokerGameState } from '../composables/useJokerCardGame'
import { JOKER_HIDE_MS, JOKER_SWAP_MS } from '../composables/useJokerCardGame'

export const JOKER_CARD_SPACING = 0.078
export function jokerStage(model: Object3D | null) {
  const toy = model?.getObjectByName('root_bugjar')
  const anchor = toy ? toy.getWorldPosition(new Vector3()) : new Vector3(0.28, 0.838, -0.105)
  const bounds = toy ? new Box3().setFromObject(toy) : null
  const top = bounds?.max.y ?? anchor.y + 0.07
  return { anchor, tray: new Vector3(anchor.x, anchor.y + 0.005, anchor.z + 0.12), top }
}

/** Frame both the figure and tray above the controls, including narrow viewports. */
export function jokerFocus(model: Object3D | null, aspect: number, height = 800) {
  const stage = jokerStage(model)
  const target = new Vector3(stage.anchor.x, stage.anchor.y - 0.025, stage.tray.z)
  if (height <= 560 && aspect > 1) target.x += 0.16
  const distance = Math.max(0.53, 0.34 / (2 * Math.tan(19 * Math.PI / 180) * Math.max(0.3, aspect) * 0.8))
  return { name: 'cam_joker_game' as const, target, position: target.clone().add(new Vector3(0, distance * 0.48, distance)) }
}

/** Same mapping drives the geometry and the numbered controls. */
export function jokerCardPose(state: JokerGameState, card: number, reduced: boolean) {
  const slot = state.slots.indexOf(card)
  let x = (slot - 1) * JOKER_CARD_SPACING
  let z = 0
  let lift = 0
  if (state.phase === 'shuffling') {
    const [a, b] = state.swaps[state.swapIndex]!
    if (slot === a || slot === b) {
      const progress = Math.min(1, state.elapsed / JOKER_SWAP_MS)
      const eased = progress * progress * (3 - 2 * progress)
      const destination = slot === a ? b : a
      x += (destination - slot) * JOKER_CARD_SPACING * eased
      z = Math.sin(progress * Math.PI) * (slot === a ? -0.028 : 0.028)
      lift = Math.sin(progress * Math.PI) * 0.008
    }
  }
  const faceUp = state.phase === 'showing' || state.phase === 'result'
  let flip = faceUp ? 0 : Math.PI
  if (!reduced && state.phase === 'hiding') flip = Math.PI * Math.min(1, state.elapsed / JOKER_HIDE_MS)
  if (!reduced && state.phase === 'result') flip = Math.PI * (1 - Math.min(1, state.elapsed / JOKER_HIDE_MS))
  return { x, y: 0.005 + lift + Math.sin(flip) * 0.028, z, flip }
}
