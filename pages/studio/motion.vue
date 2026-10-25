<script setup lang="ts">
import { studioCopy } from '~/content/portfolio'
import StudioShell from '~/components/studio/StudioShell.vue'
import StudioMotionLab from '~/components/studio/StudioMotionLab.vue'
import StudioFooter from '~/components/studio/StudioFooter.vue'
useHead({
  title: `${studioCopy.themeLabTitle.en} / Davoud Fakour`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <StudioShell><StudioMotionLab /><StudioFooter /></StudioShell>
</template>
