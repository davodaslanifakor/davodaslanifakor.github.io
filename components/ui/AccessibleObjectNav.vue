<script setup lang="ts">
import type { Locale, SceneObject } from '~/content/portfolio'
import { localize, ui } from '~/content/portfolio'

const props = defineProps<{
  locale: Locale
  objects: SceneObject[]
  activeId?: string | null
}>()

const emit = defineEmits<{ activate: [object: SceneObject] }>()
</script>

<template>
  <nav class="object-nav" :aria-label="localize(ui.objectNav, props.locale)">
    <p class="eyebrow">{{ localize(ui.objectNav, props.locale) }}</p>
    <div class="object-list">
      <button
        v-for="(object, index) in props.objects"
        :key="object.id"
        class="object-link"
        type="button"
        :data-object-id="object.id"
        :aria-current="props.activeId === object.id ? 'true' : undefined"
        @click="emit('activate', object)"
      >
        <span class="index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span>{{ localize(object.label, props.locale) }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.object-nav {
  position: absolute;
  z-index: 6;
  inset-inline: 0;
  inset-block-end: 0;
  padding: 1.2rem clamp(1rem, 3vw, 2.5rem) max(1rem, env(safe-area-inset-bottom));
  background: linear-gradient(transparent, rgb(10 14 12 / 88%) 27%, rgb(10 14 12 / 95%));
}
.eyebrow { margin: 0 0 .8rem; color: var(--muted); font: .62rem/1.2 var(--font-mono); letter-spacing: .12em; text-transform: uppercase; }
.object-list { display: flex; gap: .45rem; overflow-x: auto; padding: .25rem .25rem .7rem; scrollbar-width: thin; scrollbar-color: #66745b transparent; }
.object-link { display: flex; flex: 0 0 auto; align-items: center; gap: .65rem; min-height: 2.75rem; border: 1px solid rgb(217 225 205 / 12%); border-radius: .5rem; padding: .65rem .9rem; background: rgb(218 231 204 / 3%); color: var(--ink); font-size: .75rem; transition: background 180ms ease, border-color 180ms ease, transform 180ms ease; }
.object-link:hover,
.object-link:focus-visible,
.object-link[aria-current="true"] { border-color: rgb(198 216 162 / 55%); background: rgb(198 216 162 / 9%); color: var(--acid); }
.object-link:active { transform: translateY(1px); }
.index { color: var(--muted); font: .6rem/1 var(--font-mono); font-variant-numeric: tabular-nums; }
@media (max-width: 760px) {
  .object-nav { padding: .7rem .6rem max(.6rem, env(safe-area-inset-bottom)); }
  .eyebrow { margin-bottom: .35rem; }
  .object-list { gap: .35rem; padding-bottom: .2rem; }
  .object-link { font-size: .68rem; padding-inline: .65rem; }
}
@media (max-width: 1100px) and (min-aspect-ratio: 1/1) {
  .object-nav { padding-block: .65rem max(.5rem, env(safe-area-inset-bottom)); }
  .eyebrow { margin-bottom: .35rem; }
  .object-link { min-height: 2.35rem; padding: .45rem .65rem; font-size: .67rem; }
}
</style>
