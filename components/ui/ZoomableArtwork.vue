<script setup lang="ts">
import { useId, useTemplateRef, watch } from 'vue'
import { artworkViewerCopy as copy, localize } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'
import { useArtworkZoom } from '~/composables/useArtworkZoom'

const props = defineProps<{ src: string; alt: string; width: number; height: number; locale: Locale; pixelated?: boolean }>()
const viewport = useTemplateRef<HTMLElement>('viewport')
const helpId = useId()
const { zoom, dragging, imageStyle, zoomTo, reset, pointerDown, pointerMove, pointerUp, wheel, doubleClick, keyboard } = useArtworkZoom({ viewport, width: () => props.width, height: () => props.height })
watch(() => props.src, reset)
</script>

<template>
  <div class="artwork-viewer">
    <div class="artwork-tools" role="group" :aria-label="localize(copy.controls, props.locale)">
      <button type="button" :disabled="zoom <= 1" :aria-label="localize(copy.zoomOut, props.locale)" @click="zoomTo(zoom - .5)">−</button>
      <span class="artwork-scale" aria-live="off">{{ Math.round(zoom * 100) }}%</span>
      <button type="button" :disabled="zoom >= 4" :aria-label="localize(copy.zoomIn, props.locale)" @click="zoomTo(zoom + .5)">+</button>
      <button type="button" @click="reset">{{ localize(copy.fit, props.locale) }}</button>
      <a class="artwork-original" :href="props.src" target="_blank" rel="noopener noreferrer">{{ localize(copy.original, props.locale) }} ↗</a>
    </div>
    <div
      ref="viewport" class="artwork-viewport" :class="{ 'artwork-viewport--zoomed': zoom > 1, 'artwork-viewport--dragging': dragging }"
      tabindex="0" role="region" :aria-label="props.alt" :aria-describedby="helpId" :data-zoom="zoom" dir="ltr"
      @keydown="keyboard" @wheel.prevent="wheel" @dblclick.prevent="doubleClick"
      @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" @lostpointercapture="pointerUp"
    >
      <img class="artwork-image" :class="{ 'artwork-image--pixelated': props.pixelated }" :src="props.src" :alt="props.alt" :width="props.width" :height="props.height" :style="imageStyle" draggable="false">
    </div>
    <p :id="helpId" class="artwork-help">{{ localize(copy.help, props.locale) }}</p>
  </div>
</template>

<style scoped>
.artwork-tools { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem; padding-bottom: .65rem; }
.artwork-tools button,.artwork-original { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: .4rem; padding: .55rem .8rem; background: transparent; color: var(--ink); font: .8rem/1.2 var(--font-display); cursor: pointer; }
.artwork-tools button:first-child,.artwork-tools button:nth-of-type(2) { min-width: 44px; font-size: 1.2rem; }
.artwork-tools button:disabled { opacity: .35; cursor: default; }
.artwork-tools button:hover:not(:disabled),.artwork-original:hover { border-color: var(--acid); }
.artwork-original { margin-inline-start: auto; text-decoration: none; }
.artwork-scale { min-width: 3.2em; text-align: center; color: var(--muted); font: .75rem/1.2 var(--font-body); }
.artwork-viewport { position: relative; height: min(56svh, 40rem); overflow: hidden; background: #080c0d; border: 1px solid var(--line); border-radius: .3rem; touch-action: none; overscroll-behavior: contain; cursor: zoom-in; }
.artwork-viewport--zoomed { cursor: grab; }
.artwork-viewport--dragging { cursor: grabbing; }
.artwork-image { position: absolute; left: 50%; top: 50%; max-width: none; max-height: none; user-select: none; pointer-events: none; }
.artwork-image--pixelated { image-rendering: pixelated; }
.artwork-help { margin: .65rem 0 0; color: var(--muted); font-size: .75rem; line-height: 1.5; }
.artwork-tools button:focus-visible,.artwork-original:focus-visible,.artwork-viewport:focus-visible { outline: 2px solid var(--acid); outline-offset: 2px; }
@media (max-width: 500px) { .artwork-tools { gap: .3rem; } .artwork-tools button,.artwork-original { padding-inline: .6rem; font-size: .72rem; } }
</style>
