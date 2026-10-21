<script setup lang="ts">
import { favouriteMusic, localize, ui } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'

const props = defineProps<{ locale: Locale; selectedId: string | null }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <section class="music-library" :aria-label="localize(ui.musicLibrary, props.locale)">
    <header class="library-heading">
      <div class="radio-symbol" aria-hidden="true">♫</div>
      <div><h2>{{ localize(ui.musicRadio, props.locale) }}</h2><p>{{ localize(ui.musicLibrary, props.locale) }} <span aria-hidden="true"> / </span> {{ favouriteMusic.length }}</p></div>
      <span class="sample-label">{{ localize(ui.musicSampleLabel, props.locale) }}</span>
    </header>
    <ol class="music-tracks">
      <li v-for="(track, index) in favouriteMusic" :key="track.id">
        <button class="track" type="button" :class="{ 'track--selected': props.selectedId === track.id }" :aria-pressed="props.selectedId === track.id" :aria-label="`${localize(ui.musicLoad, props.locale)}: ${track.title}`" @click="emit('select', track.id)">
          <span class="track-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="track-copy"><strong>{{ track.title }}</strong><span>{{ track.artist }}</span></span>
          <span class="track-action" aria-hidden="true">{{ props.selectedId === track.id ? '↗' : '▶' }}</span>
        </button>
      </li>
    </ol>
    <p class="library-footnote">{{ localize(ui.musicLibraryHint, props.locale) }}</p>
  </section>
</template>

<style scoped>
.music-library { height: 100%; padding: 30px 30px 20px; background: #15231e; color: #f0f4ed; font-family: var(--font-display); display: flex; flex-direction: column; }
.library-heading { display: flex; gap: 18px; align-items: center; margin-bottom: 18px; }
.radio-symbol { width: 62px; height: 62px; display: grid; place-items: center; border-radius: 50%; background: #c6d8a2; color: #17251c; font-size: 34px; }
.library-heading h2 { margin: 0; font-size: 34px; font-weight: 600; letter-spacing: -.035em; }
.library-heading p { margin: 3px 0 0; font-size: 16px; color: #b7c7b9; }
.sample-label { margin-inline-start: auto; padding: 5px 10px; border: 1px solid #66816d; border-radius: 5px; color: #d2decf; font-size: 13px; }
.music-tracks { list-style: none; padding: 0; margin: 0; display: grid; gap: 5px; }
.track { width: 100%; display: flex; gap: 18px; align-items: center; text-align: start; border: 0; border-radius: 7px; padding: 12px 18px; background: transparent; color: inherit; transition: background 150ms ease; }
.track:hover { background: #22392c; }
.track--selected,.track--selected:hover { background: #c6d8a2; color: #162219; }
.track-number { width: 24px; font: 14px var(--font-mono); opacity: .8; }
.track-copy { flex: 1; min-width: 0; display: grid; gap: 5px; }
.track-copy strong { font-size: 23px; font-weight: 600; }
.track-copy > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; color: #b7c7b9; }
.track--selected .track-copy > span { color: #33462e; }
.track-action { font-size: 18px; }
.library-footnote { margin: auto 0 0; padding-top: 14px; font-size: 13px; line-height: 1.5; color: #b7c7b9; }
@media (max-width: 760px) { .music-library { padding: 22px 16px; } .library-heading h2 { font-size: 27px; } .track { padding: 12px 10px; gap: 12px; } .track-copy strong { font-size: 18px; } .radio-symbol { width: 48px; height: 48px; } .sample-label { font-size: 11px; } }
@media (prefers-reduced-motion: reduce) { .track { transition: none; } }
</style>
