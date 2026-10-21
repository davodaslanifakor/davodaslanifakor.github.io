<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useSpotifyPlayer } from '~/composables/useSpotifyPlayer'
import type { MusicTrack } from '~/content/portfolio'
import type { MusicPlaybackUpdate } from '~/utils/musicPlayback'
import { spotifyResource } from '~/utils/spotifyUrl'

const props = defineProps<{ track: MusicTrack }>()
const emit = defineEmits<{ playback: [state: MusicPlaybackUpdate] }>()
const host = useTemplateRef<HTMLElement>('host')
const { fallback } = useSpotifyPlayer({
  host, trackId: props.track.id, spotifyUrl: props.track.spotifyUrl,
  title: `${props.track.title} — ${props.track.artist}`,
  onPlayback: state => emit('playback', state),
})
</script>

<template>
  <div class="spotify-player">
    <div ref="host" class="spotify-host" />
    <iframe v-if="fallback" :src="spotifyResource(props.track.spotifyUrl)?.embed" :title="`${props.track.title} — ${props.track.artist}`" height="352" allowfullscreen loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
  </div>
</template>

<style scoped>
.spotify-player { width: 100%; min-height: 352px; height: 352px; flex-shrink: 0; border-radius: 12px; overflow: hidden; background: #202423; }
.spotify-player :deep(iframe) { display: block; width: 100%; height: 352px; border: 0; }
</style>
