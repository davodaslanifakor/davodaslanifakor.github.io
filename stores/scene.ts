import { idleMusicPlayback } from '~/utils/musicPlayback'
import type { MusicPlayback, MusicPlaybackUpdate } from '~/utils/musicPlayback'
import type { ScreenThemeId } from '~/utils/screenTheme'

export type SceneMode = 'loading' | 'intro' | 'explore' | 'focused' | 'editor'
export type SceneQuality = 'high' | 'low'

export interface SceneState {
  mode: SceneMode
  focusedId: string | null
  hoveredId: string | null
  musicPlayback: MusicPlayback
  nowPlaying: string | null
  soundOn: boolean
  quality: SceneQuality
  screenTheme: ScreenThemeId
}

export const useSceneStore = defineStore('scene', {
  state: (): SceneState => ({
    mode: 'loading',
    focusedId: null,
    hoveredId: null,
    nowPlaying: null,
    musicPlayback: idleMusicPlayback(),
    soundOn: false,
    quality: 'high',
    screenTheme: 'slate',
  }),
  actions: {
    setMode(mode: SceneMode) {
      this.mode = mode
    },
    focus(objectId: string, mode: Extract<SceneMode, 'focused' | 'editor'> = 'focused') {
      this.focusedId = objectId
      this.hoveredId = null
      this.mode = mode
    },
    clearFocus() {
      this.focusedId = null
      this.hoveredId = null
      this.mode = 'explore'
    },
    setHovered(objectId: string | null) {
      this.hoveredId = objectId
    },
    setNowPlaying(trackId: string | null) {
      if (this.nowPlaying !== trackId) this.musicPlayback = idleMusicPlayback()
      this.nowPlaying = trackId
    },
    setMusicPlayback(update: MusicPlaybackUpdate) {
      if (update.trackId !== this.nowPlaying) return
      this.musicPlayback = { playing: update.playing, positionMs: update.positionMs, durationMs: update.durationMs, sampledAt: performance.now() }
    },
    setSound(enabled: boolean) {
      this.soundOn = enabled
    },
    setQuality(quality: SceneQuality) {
      this.quality = quality
    },
    setScreenTheme(theme: ScreenThemeId) {
      this.screenTheme = theme
    },
  },
})
