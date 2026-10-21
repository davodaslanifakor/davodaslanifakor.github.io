<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, ui, writing } from '~/content/portfolio'
import ArticleList from '~/components/story/ArticleList.vue'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <section v-if="writing.articles.length" id="writing" class="section">
    <p class="section-number">05</p>
    <div class="section-body">
      <h2 class="section-title">{{ localize(ui.writing, props.locale) }}</h2>
      <ArticleList :locale="props.locale" />
    </div>
  </section>
</template>
