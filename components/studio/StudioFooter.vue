<script setup lang="ts">
import { studioCopy as copy } from '~/content/portfolio'
import StudioFooterMark from './StudioFooterMark.vue'
</script>

<template>
  <footer class="studio-footer studio-container">
    <div class="studio-footer-signature">
      <NuxtLink no-prefetch to="/studio" :aria-label="copy.brandHome.en"
        ><StudioFooterMark /></NuxtLink>
      <p>{{ copy.footer.en }}</p>
    </div>
    <nav :aria-label="copy.previewLabel.en">
      <NuxtLink no-prefetch to="/studio/motion">{{
        copy.motionLink.en
      }}</NuxtLink
      ><NuxtLink no-prefetch to="/cv">{{ copy.cv.en }}</NuxtLink
      ><NuxtLink no-prefetch to="/">{{ copy.room.en }}</NuxtLink>
    </nav>
  </footer>
</template>
