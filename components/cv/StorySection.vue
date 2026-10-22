<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { cvPresentation, localize, ui } from '~/content/portfolio'
import LifeStoryContent from '~/components/story/LifeStoryContent.vue'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <section id="story" class="section">
    <p class="section-number">04</p>
    <div class="section-body">
      <h2 class="section-title">{{ localize(ui.lifeStory, props.locale) }}</h2>
      <p class="story-preview">{{ localize(cvPresentation.storyPreview, props.locale) }}</p>
      <details class="story-details">
        <summary>{{ localize(cvPresentation.readStory, props.locale) }} <span aria-hidden="true">+</span></summary>
        <LifeStoryContent :locale="props.locale" />
      </details>
    </div>
  </section>
</template>

<style scoped>
.story-preview { max-width: 45ch; margin: 0; color: var(--muted); font-size: 1.125rem; line-height: 1.6; }
.story-details summary { display: flex; align-items: center; justify-content: space-between; min-height: 48px; margin-block: 1.5rem; border-bottom: 1px solid var(--line); padding-block: .75rem; color: var(--ink); font-size: .9375rem; list-style: none; cursor: pointer; }
.story-details summary::-webkit-details-marker { display: none; }
.story-details summary span { color: var(--acid); font-size: 1.5rem; transition: transform 180ms ease; }
.story-details[open] summary span { transform: rotate(45deg); }
.story-details summary:hover { color: var(--acid); }
.story-details :deep(.marker),.story-details :deep(.subhead) { font-family: var(--font-display); }
</style>
