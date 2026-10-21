<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, profile } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <header class="hero">
    <p class="availability">{{ localize(profile.cta, props.locale) }}</p>
    <h1 class="headline">{{ profile.name }}</h1>
    <p class="role">{{ localize(profile.role, props.locale) }} · {{ profile.specialties }}</p>
    <p class="tagline">{{ localize(profile.tagline, props.locale) }}</p>
  </header>
</template>

<style scoped>
.hero { display: grid; min-height: 72svh; align-content: end; padding: clamp(7rem, 14vw, 11rem) 0 clamp(4rem, 8vw, 7rem); }
.availability { width: fit-content; margin: 0 0 2rem; border: 1px solid var(--acid); border-radius: 999px; padding: 0.55rem 0.8rem; color: var(--acid); font: 0.75rem/1.2 var(--font-mono); letter-spacing: 0.05em; }
.headline { margin: 0; font: clamp(4.2rem, 13vw, 10.5rem)/0.78 var(--font-display); letter-spacing: -0.085em; }
.role { margin: 2rem 0 0; color: var(--muted); font: 0.8rem/1.4 var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; }
.tagline { max-width: 49rem; margin: 3.5rem 0 0 auto; font-size: clamp(1.45rem, 3vw, 2.55rem); line-height: 1.14; letter-spacing: -0.035em; }
</style>
