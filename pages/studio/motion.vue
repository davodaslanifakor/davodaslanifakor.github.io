<script setup lang="ts">
import { studioCopy } from '~/content/portfolio'
import StudioShell from '~/components/studio/StudioShell.vue'
import StudioMotionLab from '~/components/studio/StudioMotionLab.vue'
import StudioFooter from '~/components/studio/StudioFooter.vue'
usePortfolioIdentity()
useHead({
  title: `${studioCopy.themeLabTitle.en} / Davoud Aslani Fakour`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <StudioShell><StudioMotionLab /><StudioFooter /></StudioShell>
</template>
