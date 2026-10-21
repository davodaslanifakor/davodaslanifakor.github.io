<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, ui } from '~/content/portfolio'
import LifeStoryContent from '~/components/story/LifeStoryContent.vue'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <section id="story" class="section">
    <p class="section-number">01</p>
    <div class="section-body">
      <h2 class="section-title">{{ localize(ui.lifeStory, props.locale) }}</h2>
      <LifeStoryContent :locale="props.locale" />
    </div>
  </section>
</template>
