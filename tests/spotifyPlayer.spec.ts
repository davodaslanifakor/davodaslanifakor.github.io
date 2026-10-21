import { effectScope, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSpotifyPlayer } from '../composables/useSpotifyPlayer'
import { loadSpotifyIframeApi } from '../utils/spotifyIframeApi'
import type { SpotifyController, SpotifyIframeApi } from '../utils/spotifyIframeApi'
import SpotifyPlayer from '../components/music/SpotifyPlayer.vue'
import { useSceneStore } from '../stores/scene'
import { favouriteMusic } from '../content/portfolio'
import { parseSpotifyPlayback } from '../utils/musicPlayback'

vi.mock('../utils/spotifyIframeApi', () => ({ loadSpotifyIframeApi: vi.fn() }))
const track = { ...favouriteMusic[0]!, id: 'fixture-song', spotifyUrl: 'https://open.spotify.com/track/69kOkLUCkxIZYexIgSG8rq' }
const uri = `spotify:track:${track.spotifyUrl.split('/track/')[1]}`
afterEach(() => { vi.clearAllMocks(); vi.useRealTimers() })

describe('Spotify playback bridge', () => {
  it('accepts song changes inside the selected playlist and retains its selection ID', () => {
    const playlist = favouriteMusic[0]!
    for (const playingURI of ['spotify:playlist:6RgbkiGSEMtH5lYyGfrggE', 'spotify:track:0ofHAoxe9vBkTCp2UQIavz', 'spotify:track:69kOkLUCkxIZYexIgSG8rq']) {
      expect(parseSpotifyPlayback({ playingURI, isPaused: false, isBuffering: false, position: 10, duration: 1000 }, playlist.id, playlist.spotifyUrl)).toEqual({ trackId: playlist.id, playing: true, positionMs: 10, durationMs: 1000 })
    }
    expect(parseSpotifyPlayback({ playingURI: 'spotify:playlist:unrelated', isPaused: false, isBuffering: false, position: 10, duration: 1000 }, playlist.id, playlist.spotifyUrl)).toBeNull()
  })
  it('uses the supplied playlist embed when the Spotify API is unavailable', async () => {
    vi.mocked(loadSpotifyIframeApi).mockRejectedValue(new Error('offline'))
    const wrapper = mount(SpotifyPlayer, { props: { track: favouriteMusic[0]! } })
    try {
      await flushPromises()
      expect(wrapper.get('iframe').attributes('src')).toBe('https://open.spotify.com/embed/playlist/6RgbkiGSEMtH5lYyGfrggE?theme=0')
    } finally { wrapper.unmount() }
  })
  it('reports real play/pause, buffering and ending while ignoring another track and late events', async () => {
    let listener!: (event: { data: unknown }) => void
    const destroy = vi.fn()
    vi.mocked(loadSpotifyIframeApi).mockResolvedValue({ createController(_element, _options, callback) {
      callback({ addListener(_event, callback) { listener = callback }, destroy })
    } })
    const onPlayback = vi.fn(), scope = effectScope()
    scope.run(() => useSpotifyPlayer({ host: shallowRef(document.createElement('div')), trackId: track.id, spotifyUrl: track.spotifyUrl, title: track.title, onPlayback }))
    await flushPromises()
    const state = { playingURI: uri, isPaused: false, isBuffering: false, position: 1000, duration: 30000 }
    listener({ data: state })
    expect(onPlayback).toHaveBeenLastCalledWith({ trackId: track.id, playing: true, positionMs: 1000, durationMs: 30000 })
    for (const change of [{ isPaused: true }, { isBuffering: true }, { position: 30000 }]) {
      listener({ data: { ...state, ...change } })
      expect(onPlayback.mock.lastCall![0].playing).toBe(false)
    }
    const count = onPlayback.mock.calls.length
    listener({ data: { ...state, playingURI: 'spotify:track:unrelated' } })
    listener({ data: { ...state, position: NaN } })
    expect(onPlayback).toHaveBeenCalledTimes(count)
    scope.stop()
    expect(destroy).toHaveBeenCalledOnce()
    expect(onPlayback.mock.lastCall![0].playing).toBe(false)
    listener({ data: state })
    expect(onPlayback).toHaveBeenCalledTimes(count + 1)
  })

  it('does not create a player if the track is cleared while the API is loading', async () => {
    let resolve!: (api: SpotifyIframeApi) => void
    vi.mocked(loadSpotifyIframeApi).mockReturnValue(new Promise(done => { resolve = done }))
    const scope = effectScope(), createController = vi.fn()
    scope.run(() => useSpotifyPlayer({ host: shallowRef(document.createElement('div')), trackId: track.id, spotifyUrl: track.spotifyUrl, title: track.title, onPlayback() {} }))
    scope.stop()
    resolve({ createController })
    await flushPromises()
    expect(createController).not.toHaveBeenCalled()
  })

  it('retains a normal Spotify preview if the API is blocked, without inventing playback', async () => {
    vi.mocked(loadSpotifyIframeApi).mockRejectedValue(new Error('blocked'))
    const wrapper = mount(SpotifyPlayer, { props: { track } })
    try {
      await flushPromises()
      expect(wrapper.findAll('iframe')).toHaveLength(1)
      expect(wrapper.get('iframe').attributes('src')).toContain('/embed/track/')
      expect(wrapper.emitted('playback')).toBeUndefined()
    } finally { wrapper.unmount() }
  })

  it('destroys a controller that arrives after the fallback timeout', async () => {
    vi.useFakeTimers()
    let callback!: (controller: SpotifyController) => void
    vi.mocked(loadSpotifyIframeApi).mockResolvedValue({ createController(_element, _options, done) { callback = done } })
    const scope = effectScope()
    const player = scope.run(() => useSpotifyPlayer({ host: shallowRef(document.createElement('div')), trackId: track.id, spotifyUrl: track.spotifyUrl, title: track.title, onPlayback() {} }))!
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(10001)
    expect(player.fallback.value).toBe(true)
    const destroy = vi.fn(), addListener = vi.fn()
    callback({ destroy, addListener })
    expect(destroy).toHaveBeenCalledOnce()
    expect(addListener).not.toHaveBeenCalled()
    scope.stop()
  })

  it('resets playback on track change and rejects stale controller updates in the store', () => {
    setActivePinia(createPinia())
    const scene = useSceneStore()
    scene.setNowPlaying(track.id)
    scene.setMusicPlayback({ trackId: track.id, playing: true, positionMs: 1000, durationMs: 30000 })
    expect(scene.musicPlayback.playing).toBe(true)
    scene.setNowPlaying(favouriteMusic[0]!.id)
    expect(scene.musicPlayback.playing).toBe(false)
    scene.setMusicPlayback({ trackId: track.id, playing: true, positionMs: 2000, durationMs: 30000 })
    expect(scene.musicPlayback.playing).toBe(false)
    scene.setNowPlaying(null)
    expect(scene.musicPlayback.positionMs).toBe(0)
  })
})
