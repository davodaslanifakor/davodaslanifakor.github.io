<script setup lang="ts">
import '~/assets/css/studio.css'
import { studioCopy as copy } from '~/content/portfolio'
import StudioNavigation from './StudioNavigation.vue'
import StudioCursor from './StudioCursor.vue'

const { reduced } = provideStudioMotion()
provideStudioTheme(reduced)
const main = useTemplateRef<HTMLElement>('main')
useStudioStack(main)
useHead({
  link: [
    {
      rel: 'preload',
      href: '/fonts/bilbo-swash-caps-latin.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous',
    },
  ],
})
</script>

<template>
  <div class="studio-page">
    <a class="studio-skip" href="#studio-main">{{ copy.skip.en }}</a>
    <StudioNavigation />
    <main id="studio-main" ref="main" class="studio-stack"><slot /></main>
    <StudioCursor />
  </div>
</template>
