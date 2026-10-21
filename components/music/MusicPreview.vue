<script setup lang="ts">
import SpotifyPlayer from './SpotifyPlayer.vue'
import type { MusicPlaybackUpdate } from '~/utils/musicPlayback'
import { computed, shallowRef } from 'vue'
import { favouriteMusic, localize, ui } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'

const props = defineProps<{ locale: Locale; selectedId: string | null }>()
const emit = defineEmits<{ clear: []; playback: [state: MusicPlaybackUpdate] }>()
const previewVersion = shallowRef(0)
const track = computed(() => favouriteMusic.find(item => item.id === props.selectedId))
</script>

<template>
  <section class="music-preview" :aria-label="localize(ui.musicPreview, props.locale)">
    <header class="preview-heading">
      <span>{{ localize(ui.musicPreview, props.locale) }}</span>
      <div v-if="track" class="preview-actions">
        <button class="reload-player" type="button" @click="previewVersion++">{{ localize(ui.musicReload, props.locale) }}</button>
        <button class="clear-player" type="button" @click="emit('clear')">{{ localize(ui.musicClear, props.locale) }} <span aria-hidden="true">×</span></button>
      </div>
    </header>
    <template v-if="track">
      <SpotifyPlayer :key="`${track.id}:${previewVersion}`" :track="track" @playback="emit('playback', $event)" />
      <a class="spotify-link" :href="track.spotifyUrl" target="_blank" rel="noopener noreferrer">{{ localize(ui.musicOpen, props.locale) }} ↗</a>
    </template>
    <div v-else class="preview-empty">
      <div class="record" aria-hidden="true"><div class="record-label">♫</div></div>
      <div class="empty-copy"><h3>{{ localize(ui.musicChoose, props.locale) }}</h3><p>{{ localize(ui.musicConsentShort, props.locale) }}</p></div>
    </div>
  </section>
</template>

<style scoped>
.music-preview { height: 100%; background: #101312; color: #eef2eb; display: flex; flex-direction: column; padding: 0 16px 6px; }
.preview-actions { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
.reload-player { border: 0; background: none; padding: 6px 0; color: #dce5d9; font-size: 13px; }
.preview-heading { display: flex; min-height: 36px; flex-shrink: 0; align-items: center; justify-content: space-between; gap: 10px; font-size: 14px; color: #c3cdc3; }
.clear-player { border: 0; background: none; padding: 6px 0 6px 10px; color: #dce5d9; font-size: 13px; }
.clear-player span { margin-inline-start: 9px; font-size: 20px; }
.spotify-link { flex-shrink: 0; align-self: end; margin-top: 5px; color: #bacbb6; font-size: 12px; text-decoration: none; }
.preview-empty { flex: 1; display: flex; align-items: center; gap: 30px; padding: 32px; }
.record { width: 210px; height: 210px; flex-shrink: 0; display: grid; place-items: center; border-radius: 50%; background: radial-gradient(circle, #171a18 34%, #313a32 35%, #171a18 36%, #171a18 51%, #29322b 52%, #171a18 53%, #171a18 65%, #303a31 66%, #171a18 67%); box-shadow: inset 0 0 0 1px #354037; }
.record-label { width: 70px; height: 70px; display: grid; place-items: center; background: #a2b991; color: #14201a; border-radius: 50%; font-size: 30px; }
.empty-copy h3 { font-size: 28px; font-weight: 500; line-height: 1.2; letter-spacing: -.025em; margin: 0 0 15px; text-wrap: balance; }
.empty-copy p { font-size: 15px; line-height: 1.6; color: #bac8b9; max-width: 28ch; margin: 0; }
@media (max-width: 760px) { .preview-heading { flex-wrap: wrap; padding-block: 8px; } .preview-actions { gap: 12px; } .music-preview { padding: 0 12px 16px; } .preview-empty { padding: 24px 12px; gap: 20px; } .record { width: 100px; height: 100px; } .record-label { width: 40px; height: 40px; font-size: 20px; } .empty-copy h3 { font-size: 23px; } .empty-copy p { font-size: 13px; } }
</style>
