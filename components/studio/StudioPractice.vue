<script setup lang="ts">
import { studioCopy as copy } from '~/content/portfolio'
import StudioProcess from './StudioProcess.vue'
import StudioCapabilities from './StudioCapabilities.vue'
</script>

<template>
  <details class="studio-practice studio-container">
    <summary>{{ copy.practiceTitle.en }}</summary>
    <StudioProcess />
    <StudioCapabilities />
  </details>
</template>

<style scoped>
.studio-practice {
  margin-top: 70px;
  border-block: 1px solid var(--st-line);
}
summary {
  cursor: pointer;
  padding-block: 12px;
  font-family: var(--st-heading);
  font-size: clamp(22px, 2vw, 28px);
  letter-spacing: -0.02em;
}
.studio-practice :deep(.studio-container) {
  width: 100%;
}
.studio-practice :deep(.studio-process),
.studio-practice :deep(.studio-capabilities) {
  padding-block: 40px;
}
</style>
