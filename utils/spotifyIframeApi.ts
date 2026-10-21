export interface SpotifyController {
  addListener(event: 'playback_update', callback: (event: { data: unknown }) => void): void
  destroy(): void
}
export interface SpotifyIframeApi {
  createController(element: HTMLElement, options: { url: string; width: string; height: number }, callback: (controller: SpotifyController) => void): void
}
declare global {
  interface Window { onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void }
}
let pending: Promise<SpotifyIframeApi> | null = null

/** Called only after a visitor chooses a track; no Spotify requests on page load. */
export function loadSpotifyIframeApi(): Promise<SpotifyIframeApi> {
  if (pending) return pending
  pending = new Promise<SpotifyIframeApi>((resolve, reject) => {
    const script = document.createElement('script')
    const previous = window.onSpotifyIframeApiReady
    const timeout = window.setTimeout(() => fail(), 10_000)
    function restore() {
      window.clearTimeout(timeout)
      if (previous) window.onSpotifyIframeApiReady = previous
      else delete window.onSpotifyIframeApiReady
    }
    function fail() {
      restore()
      script.remove()
      reject(new Error('Spotify iframe API unavailable'))
    }
    window.onSpotifyIframeApiReady = api => {
      restore()
      resolve(api)
      previous?.(api)
    }
    script.src = 'https://open.spotify.com/embed/iframe-api/v1'
    script.async = true
    script.onerror = fail
    document.head.append(script)
  }).catch(error => { pending = null; throw error })
  return pending
}
