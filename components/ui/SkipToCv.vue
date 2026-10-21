<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
const label = computed(() => localize(ui.skipToCv, props.locale))
</script>

<template>
  <NuxtLink class="skip-button" to="/cv">
    <span>{{ label }}</span>
    <span aria-hidden="true">↗</span>
  </NuxtLink>
</template>

<style scoped>
.skip-button {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  background: rgb(12 14 17 / 76%);
  color: var(--ink);
  text-decoration: none;
  backdrop-filter: blur(16px);
  transition: border-color 180ms ease, transform 180ms ease;
}

.skip-button:hover,
.skip-button:focus-visible {
  border-color: var(--acid);
  transform: translateY(-2px);
}
</style>
