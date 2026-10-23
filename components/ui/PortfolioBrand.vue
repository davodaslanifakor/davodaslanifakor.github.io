<script setup lang="ts">
import { portfolioBrand } from '~/content/portfolio'

withDefaults(defineProps<{ variant?: 'lockup' | 'mark' }>(), {
  variant: 'lockup',
})
</script>

<template>
  <span
    class="portfolio-brand"
    :class="`portfolio-brand--${variant}`"
    aria-hidden="true"
  >
    <img
      class="portfolio-brand-symbol"
      :src="portfolioBrand.symbol"
      alt=""
      width="48"
      height="48"
    >
    <template v-if="variant === 'lockup'">
      <img
        class="portfolio-brand-color"
        :src="portfolioBrand.lockup"
        alt=""
        width="236"
        height="50"
      >
      <img
        class="portfolio-brand-white"
        :src="portfolioBrand.lockupWhite"
        alt=""
        width="236"
        height="50"
      >
    </template>
  </span>
</template>

<style scoped>
.portfolio-brand { display: grid; align-items: center; flex-shrink: 0; }
.portfolio-brand img { grid-area: 1 / 1; display: block; max-width: 100%; height: auto; }
.portfolio-brand--lockup { width: var(--brand-width, 236px); }
.portfolio-brand--mark { width: var(--brand-size, 46px); }
.portfolio-brand-symbol { filter: var(--brand-symbol-filter, none); }
.portfolio-brand--lockup .portfolio-brand-symbol { display: none; }
.portfolio-brand .portfolio-brand-color { display: var(--brand-color-display, none); }
.portfolio-brand .portfolio-brand-white { display: var(--brand-white-display, block); }
@media (max-width: 767px) {
  .portfolio-brand--lockup { width: var(--brand-size, 44px); }
  .portfolio-brand--lockup .portfolio-brand-symbol { display: block; }
  .portfolio-brand--lockup .portfolio-brand-color,
  .portfolio-brand--lockup .portfolio-brand-white { display: none; }
}
</style>
