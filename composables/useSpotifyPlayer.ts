import { onScopeDispose, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { loadSpotifyIframeApi } from '~/utils/spotifyIframeApi'
import type { SpotifyController } from '~/utils/spotifyIframeApi'
import { parseSpotifyPlayback } from '~/utils/musicPlayback'
import { spotifyResource } from '~/utils/spotifyUrl'
import type { MusicPlaybackUpdate } from '~/utils/musicPlayback'

export function useSpotifyPlayer(options: {
  host: Ref<HTMLElement | null>
  trackId: string
  spotifyUrl: string
  title: string
  onPlayback: (state: MusicPlaybackUpdate) => void
}) {
  const fallback = shallowRef(false)
  let disposed = false
  let controller: SpotifyController | null = null
  let timeout: ReturnType<typeof setTimeout> | undefined

  function fail() {
    if (disposed) return
    fallback.value = true
    controller?.destroy()
    controller = null
    options.host.value?.replaceChildren()
  }

  watch(options.host, async host => {
    if (!host || disposed) return
    try {
      const api = await loadSpotifyIframeApi()
      if (disposed) return
      const target = document.createElement('div')
      host.replaceChildren(target)
      timeout = setTimeout(fail, 10_000)
      const resource = spotifyResource(options.spotifyUrl)
      if (!resource) { clearTimeout(timeout); fail(); return }
      api.createController(target, { url: `${resource.url}?theme=0`, width: '100%', height: 352 }, next => {
        if (disposed || fallback.value) { next.destroy(); return }
        clearTimeout(timeout)
        controller = next
        const iframe = host.querySelector('iframe')
        if (iframe) iframe.title = options.title
        next.addListener('playback_update', event => {
          if (disposed || fallback.value) return
          const snapshot = parseSpotifyPlayback(event.data, options.trackId, options.spotifyUrl)
          if (snapshot) options.onPlayback(snapshot)
        })
      })
    } catch { clearTimeout(timeout); fail() }
  }, { immediate: true })

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timeout)
    controller?.destroy()
    options.onPlayback({ trackId: options.trackId, playing: false, positionMs: 0, durationMs: 0 })
  })
  return { fallback }
}
