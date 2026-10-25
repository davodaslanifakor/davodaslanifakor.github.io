<script setup lang="ts">
import { libraryPortrait as portrait, studioPortrait as copy } from '~/content/portfolio'

const image = useTemplateRef<HTMLElement>('image')
const { ready, selected, fullImage, reveal, move, leave, focus, cycle } = useStudioPortraitLens(image)
const filterId = `portrait-${useId().replace(/:/g, '')}`
const failed = shallowRef(false)
</script>

<template>
  <div class="studio-portrait" :data-filter="copy.filters[selected]!.id" :data-full-image="fullImage">
    <svg class="portrait-filter-defs" aria-hidden="true" width="0" height="0" focusable="false">
      <defs><filter :id="filterId" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.18 0.65" />
          <feFuncG type="table" tableValues="0.17 0.67" />
          <feFuncB type="table" tableValues="0.35 1" />
        </feComponentTransfer>
      </filter></defs>
    </svg>
    <button
      ref="image" data-cursor="play" type="button" class="portrait-playground" :disabled="!ready || failed"
      :aria-label="`${copy.cycle.en}: ${copy.filters[selected]!.label.en}`"
      :style="{ '--duotone-filter': `url(#${filterId})` }"
      @pointerenter="reveal" @pointermove="move" @pointerleave="leave"
      @focus="focus" @blur="leave" @click="cycle"
    >
      <img v-if="!failed" class="portrait-base" :src="portrait.image" :alt="portrait.imageAlt.en" :width="portrait.width" :height="portrait.height" loading="lazy" decoding="async" @error="failed = true">
      <span v-else>{{ portrait.imageAlt.en }}</span>
      <img v-if="ready && !failed" class="portrait-reveal" :src="portrait.image" alt="" aria-hidden="true" :width="portrait.width" :height="portrait.height" loading="lazy" decoding="async">
    </button>
    <template v-if="ready && !failed">
      <div class="portrait-filters" role="group" :aria-label="copy.label.en" @focusin="focus" @focusout="leave">
        <button v-for="(filter, index) in copy.filters" :key="filter.id" type="button" :aria-pressed="selected === index" @click="selected = index">{{ filter.label.en }}</button>
      </div>
      <p class="portrait-hint">{{ fullImage ? copy.tapHint.en : copy.hoverHint.en }}</p>
    </template>
  </div>
</template>

<style scoped>
.studio-portrait { width: 100%; }
.portrait-filter-defs { position: absolute; pointer-events: none; }
.portrait-playground {
  --lens-x: 50%; --lens-y: 50%; --lens-radius: 0;
  position: relative; display: block; width: 100%; aspect-ratio: 1;
  padding: 0; border: 0; background: var(--st-soft); overflow: hidden; cursor: crosshair;
}
.portrait-playground:disabled { cursor: default; }
.portrait-playground img { display: block; width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
.portrait-reveal {
  position: absolute; inset: 0;
  mask-image: radial-gradient(circle at var(--lens-x) var(--lens-y), #000 0, #000 calc(var(--lens-radius) * 0.72px), transparent calc(var(--lens-radius) * 1px + 1px));
}
[data-full-image='false'] .portrait-base { filter: saturate(0.55) brightness(0.93); }
[data-filter='duotone'] .portrait-reveal { filter: var(--duotone-filter); }
[data-filter='mono'] .portrait-reveal { filter: grayscale(1); }
[data-full-image='true'] .portrait-reveal { mask-image: none; }
.portrait-filters { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 8px; }
.portrait-filters button { min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--st-muted); font-size: 12px; cursor: pointer; }
.portrait-filters button[aria-pressed='true'] { color: var(--st-fg); text-decoration: underline; text-decoration-color: var(--st-accent); text-underline-offset: 6px; }
.portrait-filters button:hover { color: var(--st-fg); }
.portrait-playground:focus-visible,
.portrait-filters button:focus-visible { outline: 2px solid var(--st-accent); outline-offset: 4px; }
.portrait-hint { margin: 0; color: var(--st-muted); font-size: 11px; line-height: 1.5; }
</style>
