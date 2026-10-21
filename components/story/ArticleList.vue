<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, profile, ui, writing } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <div class="writing">
    <p class="intro">{{ localize(writing.intro, props.locale) }}</p>
    <ul class="articles">
      <li v-for="article in writing.articles" :key="article.id">
        <a :href="article.href" rel="noopener" target="_blank" lang="en">{{ article.title }} <span aria-hidden="true">↗</span></a>
        <p>{{ localize(article.summary, props.locale) }}</p>
        <p class="date">{{ article.published }}</p>
      </li>
    </ul>
    <a class="all" :href="profile.medium" rel="noopener" target="_blank">{{ localize(ui.allArticles, props.locale) }} ↗</a>
  </div>
</template>

<style scoped>
.writing { display: grid; gap: 1.5rem; max-width: 52rem; }
.intro { margin: 0; color: var(--muted); line-height: 1.55; }
.articles { display: grid; margin: 0; padding: 0; list-style: none; }
.articles li { border-top: 1px solid var(--line); padding: 1.1rem 0; }
.articles a,.all { color: var(--ink); font: 1.1rem/1.35 var(--font-display); text-decoration: none; }
.articles a:hover,.all:hover { color: var(--acid); }
.articles p { margin: 0.45rem 0 0; color: var(--muted); line-height: 1.5; }
.date { font: 0.7rem/1.3 var(--font-mono); text-transform: uppercase; }
.all { width: fit-content; border-bottom: 1px solid var(--acid); }
</style>
