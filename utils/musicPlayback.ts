import { spotifyResource } from './spotifyUrl'

export interface MusicPlayback {
  playing: boolean
  positionMs: number
  durationMs: number
  sampledAt: number
}
export interface MusicPlaybackUpdate {
  trackId: string
  playing: boolean
  positionMs: number
  durationMs: number
}
export const idleMusicPlayback = (): MusicPlayback => ({ playing: false, positionMs: 0, durationMs: 0, sampledAt: 0 })

/** Fail closed on malformed events; SDK callbacks, not iframe clicks, signal playback. */
export function parseSpotifyPlayback(data: unknown, trackId: string, spotifyUrl: string): MusicPlaybackUpdate | null {
  if (!data || typeof data !== 'object') return null
  const value = data as Record<string, unknown>
  const resource = spotifyResource(spotifyUrl)
  if (!resource) return null
  // A playlist reports the current song URI, not the playlist URI. The mounted
  // controller and selection ID already scope these callbacks to this player.
  if (value.playingURI !== undefined && value.playingURI !== resource.uri
    && !(resource.type !== 'track' && typeof value.playingURI === 'string' && /^spotify:track:[A-Za-z0-9]+$/.test(value.playingURI))) return null
  if (typeof value.isPaused !== 'boolean' || typeof value.isBuffering !== 'boolean'
    || typeof value.position !== 'number' || !Number.isFinite(value.position) || value.position < 0
    || typeof value.duration !== 'number' || !Number.isFinite(value.duration) || value.duration < 0) return null
  return {
    trackId,
    playing: !value.isPaused && !value.isBuffering && value.duration > value.position,
    positionMs: value.position,
    durationMs: value.duration,
  }
}
