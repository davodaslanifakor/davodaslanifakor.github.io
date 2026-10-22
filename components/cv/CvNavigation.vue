<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { cvPresentation, localize, ui, writing } from '~/content/portfolio'

const props = defineProps<{ locale: Locale; canSwitchLocale: boolean }>()
const emit = defineEmits<{ toggleLocale: [] }>()
</script>

<template>
  <nav class="cv-nav" :aria-label="localize(ui.cvNavigation, props.locale)">
    <NuxtLink class="cv-mark" to="/" :aria-label="localize(ui.home, props.locale)">DF<span class="room-link"> / {{ localize(cvPresentation.room, props.locale) }}</span></NuxtLink>
    <div class="cv-nav-links">
      <a href="#work">{{ localize(cvPresentation.work, props.locale) }}</a>
      <a href="#experience">{{ localize(ui.experience, props.locale) }}</a>
      <a class="secondary" href="#story">{{ localize(ui.lifeStory, props.locale) }}</a>
      <a v-if="writing.articles.length" class="secondary" href="#writing">{{ localize(ui.writing, props.locale) }}</a>
      <a class="nav-contact" href="#contact">{{ localize(ui.contact, props.locale) }} <span aria-hidden="true">↗</span></a>
      <button v-if="props.canSwitchLocale" type="button" @click="emit('toggleLocale')">{{ props.locale === 'en' ? 'FA' : 'EN' }}</button>
    </div>
  </nav>
</template>

<style scoped>
.cv-nav { position: sticky; z-index: 20; top: 0; display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: min(76rem, calc(100% - 4rem)); margin-inline: auto; padding-block: 1rem; border-bottom: 1px solid var(--line); background: var(--canvas); }
.cv-mark { display: flex; align-items: center; flex-shrink: 0; min-height: 44px; color: var(--ink); font-size: 1rem; font-weight: 650; text-decoration: none; }
.room-link { color: var(--muted); font-weight: 400; white-space: pre; }
.cv-nav-links { display: flex; flex-wrap: wrap; align-items: center; justify-content: end; gap: .5rem 1.5rem; }
.cv-nav-links a,.cv-nav-links button { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; border: 0; background: transparent; color: var(--muted); font: 500 .875rem/1.4 var(--font-display); text-decoration: none; }
.cv-nav-links a:hover,.cv-nav-links button:hover,.cv-mark:hover { color: var(--acid); }
.cv-nav-links .nav-contact { color: var(--ink); }
@media (max-width: 640px) {
  .cv-nav { width: calc(100% - 2.5rem); gap: .75rem; padding-block: .5rem; }
  .cv-nav-links { gap: .75rem; }
  .cv-nav-links a,.cv-nav-links button { font-size: .8125rem; }
  .secondary,.room-link { display: none !important; }
}
@media (max-width: 350px) { .cv-nav { width: calc(100% - 2rem); } .cv-nav-links { gap: .6rem; } }
</style>
