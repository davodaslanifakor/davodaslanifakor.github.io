import { onScopeDispose, toRaw, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Euler, Object3D } from 'three'
import { getHandAngles } from '~/utils/worldTime'
import { screenContent } from '~/content/portfolio'

/** Cache GLB clock hand pivots once; time changes never traverse the model. */
export function useWorldClocks(
  scene: MaybeRefOrGetter<Object3D | null>,
  epochMs: MaybeRefOrGetter<number>,
  reducedMotion: MaybeRefOrGetter<boolean>,
) {
  const pivots = new Map<string, Object3D>()
  const hands = ['hour', 'minute', 'second'] as const
  const deskHands = new Map<typeof hands[number], { node: Object3D; rotation: Euler; visible: boolean }>()

  function restoreDeskHands() {
    for (const { node, rotation, visible } of deskHands.values()) {
      node.rotation.copy(rotation)
      node.visible = visible
    }
    deskHands.clear()
  }

  function bind(object: Object3D | null) {
    restoreDeskHands()
    pivots.clear()
    if (!object) return
    const model = toRaw(object)
    const deskClock = model.getObjectByName('root_clock')
    for (const hand of hands) {
      const node = deskClock?.getObjectByName(`static_clock_hand_${hand}`)
      if (node) {
        const raw = toRaw(node)
        deskHands.set(hand, { node: raw, rotation: raw.rotation.clone(), visible: raw.visible })
      }
    }
    for (const city of screenContent.cities) {
      for (const hand of hands) {
        const name = `static_world_clock_${city.id}_${hand}_pivot`
        // The reviewed Blender checkpoint names the Atlantic dial by its city.
        // Keep both existing asset identities and the content's stable Atlantic id.
        const checkpointName = city.id === 'atlantic'
          ? `static_world_clock_reykjavik_${hand}_pivot`
          : name
        const pivot = model.getObjectByName(name) ?? model.getObjectByName(checkpointName)
        if (pivot) pivots.set(`${city.id}:${hand}`, toRaw(pivot))
      }
    }
    update()
  }

  function update() {
    const epoch = toValue(epochMs)
    if (!epoch) return
    const reduced = toValue(reducedMotion)
    const deskAngles = getHandAngles(epoch, screenContent.deskClockTimeZone)
    for (const [hand, { node }] of deskHands) {
      // Centered hands point along local -Z at zero; the frame's 90° X
      // rotation makes local Y the face normal, just like the wall pivots.
      node.rotation.y = -deskAngles[hand] * Math.PI / 180
      if (hand === 'second') node.visible = !reduced
    }
    for (const city of screenContent.cities) {
      const angles = getHandAngles(epoch, city.timeZone)
      for (const hand of hands) {
        const pivot = pivots.get(`${city.id}:${hand}`)
        if (!pivot) continue
        // glTF converts Blender's clock-up rod to local -Z; the dial normal
        // is local +Y on these exported pivots. Rotate about Y to move hands
        // across the visible clock face, rather than spinning along the rod.
        pivot.rotation.y = -angles[hand] * Math.PI / 180
        if (hand === 'second') pivot.visible = !reduced
      }
    }
  }

  watch(() => toValue(scene), bind, { immediate: true, flush: 'post' })
  watch([() => toValue(epochMs), () => toValue(reducedMotion)], update, { flush: 'post' })
  onScopeDispose(restoreDeskHands)
  return { bind, update }
}
