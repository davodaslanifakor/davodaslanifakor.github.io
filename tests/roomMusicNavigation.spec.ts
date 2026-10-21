import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import RoomPage from '../pages/index.vue'
import { useSceneStore } from '../stores/scene'
import { favouriteMusic } from '../content/portfolio'

mockNuxtImport('useQuality', () => () => ({
  recommendedQuality: computed(() => 'high' as const),
  shouldUseCvFallback: computed(() => false),
}))

describe('music during room navigation', () => {
  it('preserves playback through content, editor and game navigation, and honors explicit stop', async () => {
    const wrapper = await mountSuspended(RoomPage, {
      global: {
        stubs: {
          RoomScene: true, SceneHud: true, ObjectModal: true, MiniEditor: true,
          ClientOnly: { template: '<slot />' },
        },
      },
    })
    const scene = useSceneStore()
    const room = wrapper.getComponent({ name: 'RoomScene' })
    const track = favouriteMusic[0]!
    try {
      room.vm.$emit('selectMusic', track.id)
      room.vm.$emit('musicPlayback', { trackId: track.id, playing: true, positionMs: 42000, durationMs: 180000 })
      await nextTick()
      const snapshot = { ...scene.musicPlayback }
      for (const id of ['speakers', 'clock', 'library_about', 'screen_right', 'monitor', 'bugjar']) {
        await wrapper.get(`[data-object-id="${id}"]`).trigger('click')
        expect(scene.focusedId).toBe(id)
        expect(scene.nowPlaying).toBe(track.id)
        expect(scene.musicPlayback).toEqual(snapshot)
        expect(room.props('nowPlaying')).toBe(track.id)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        await nextTick()
        expect(scene.focusedId).toBeNull()
        expect(scene.musicPlayback).toEqual(snapshot)
      }
      room.vm.$emit('musicPlayback', { trackId: track.id, playing: false, positionMs: 45000, durationMs: 180000 })
      await wrapper.get('[data-object-id="library_about"]').trigger('click')
      expect(scene.musicPlayback.playing).toBe(false)
      expect(scene.musicPlayback.positionMs).toBe(45000)
      room.vm.$emit('selectMusic', null)
      await nextTick()
      expect(scene.nowPlaying).toBeNull()
      expect(room.props('nowPlaying')).toBeNull()
    } finally { wrapper.unmount() }
  })
})
