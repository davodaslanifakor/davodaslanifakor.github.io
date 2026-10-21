<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { lifeStory, localize, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <div class="life-story">
    <p class="intro">{{ localize(lifeStory.intro, props.locale) }}</p>

    <ol class="chapters">
      <li v-for="chapter in lifeStory.chapters" :key="chapter.id" class="chapter">
        <p class="marker">{{ localize(chapter.marker, props.locale) }}</p>
        <div>
          <h3 class="chapter-title">{{ localize(chapter.title, props.locale) }}</h3>
          <p class="chapter-body">{{ localize(chapter.body, props.locale) }}</p>
        </div>
      </li>
    </ol>

    <section class="lessons" :aria-label="localize(ui.lessons, props.locale)">
      <h3 class="subhead">{{ localize(ui.lessons, props.locale) }}</h3>
      <blockquote v-for="(lesson, index) in lifeStory.lessons" :key="index">
        {{ localize(lesson, props.locale) }}
      </blockquote>
    </section>

    <section class="keepsakes" :aria-label="localize(ui.keepsakes, props.locale)">
      <h3 class="subhead">{{ localize(ui.keepsakes, props.locale) }}</h3>
      <dl>
        <div v-for="item in lifeStory.keepsakes" :key="item.id">
          <dt>{{ localize(item.title, props.locale) }}</dt>
          <dd>{{ localize(item.body, props.locale) }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.life-story { display: grid; gap: 2.5rem; max-width: 52rem; }
.intro { margin: 0; font-size: clamp(1.2rem, 2.2vw, 1.6rem); line-height: 1.35; }
.chapters { display: grid; margin: 0; padding: 0; list-style: none; }
.chapter { display: grid; grid-template-columns: minmax(7rem, 0.3fr) 1fr; gap: 1.5rem; border-top: 1px solid var(--line); padding: 1.25rem 0; }
.marker,.subhead,dt { margin: 0; color: var(--acid); font: 0.72rem/1.35 var(--font-mono); letter-spacing: 0.05em; text-transform: uppercase; }
.chapter-title { margin: 0; font: 1.2rem/1.25 var(--font-display); }
.chapter-body { margin: 0.6rem 0 0; color: var(--muted); line-height: 1.6; }
.lessons,.keepsakes { display: grid; gap: 1rem; }
blockquote { margin: 0; border-inline-start: 2px solid var(--acid); padding-inline-start: 1rem; font-size: 1.1rem; line-height: 1.5; }
dl { display: grid; gap: 1rem; margin: 0; }
dd { margin: 0.3rem 0 0; color: var(--muted); line-height: 1.5; }
@media (max-width: 640px) { .chapter { grid-template-columns: 1fr; gap: 0.5rem; } }
</style>
