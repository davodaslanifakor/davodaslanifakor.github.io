import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { ROOM_LIGHTING, useRoomLighting } from '../composables/useRoomLighting'

describe('system room lighting', () => {
  it('applies the initial preference, follows changes without motion and removes its listener', async () => {
    let listener: (() => void) | undefined
    const remove = vi.fn()
    const query = { matches: true, addEventListener: vi.fn((_event, callback) => { listener = callback }), removeEventListener: remove }
    const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue(query as unknown as MediaQueryList)
    const scope = effectScope()
    const reduced = ref(true)
    try {
      const lighting = scope.run(() => useRoomLighting(reduced))!
      expect(lighting.dark.value).toBe(true)
      expect(lighting.preset.value).toEqual(ROOM_LIGHTING.dark)
      query.matches = false
      listener!()
      await nextTick()
      expect(lighting.dark.value).toBe(false)
      expect(lighting.preset.value).toEqual(ROOM_LIGHTING.light)
      scope.stop()
      expect(remove).toHaveBeenCalledWith('change', listener)
    } finally { scope.stop(); matchMedia.mockRestore() }
  })
})
