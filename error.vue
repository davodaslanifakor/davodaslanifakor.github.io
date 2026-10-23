<script setup lang="ts">
import type { NuxtError } from '#app'
import { localize, ui } from '~/content/portfolio'
import PortfolioBrand from '~/components/ui/PortfolioBrand.vue'

const props = defineProps<{ error: NuxtError }>()
const { locale } = usePortfolioLocale()

function returnHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <main class="error-page">
    <NuxtLink no-prefetch class="error-brand" to="/" :aria-label="localize(ui.home, locale)"><PortfolioBrand /></NuxtLink>
    <p class="code">{{ props.error.statusCode }}</p>
    <h1>{{ localize(ui.errorTitle, locale) }}</h1>
    <p>{{ localize(ui.errorBody, locale) }}</p>
    <button type="button" @click="returnHome">{{ localize(ui.returnHome, locale) }}</button>
  </main>
</template>

<style scoped>
.error-page { display: grid; min-height: 100svh; place-content: center; padding: 2rem; background: var(--canvas); color: var(--ink); text-align: center; }
.error-brand { justify-self: center; display: flex; align-items: center; min-height: 44px; margin-bottom: 2rem; }
.code { margin: 0; color: var(--acid); font: .75rem/1 var(--font-mono); }
h1 { margin: 1rem 0; font: 400 clamp(3rem,10vw,8rem)/1.08 var(--font-heading); letter-spacing: -.035em; }
p { color: var(--muted); }
button { justify-self: center; margin-top: 1.5rem; border: 1px solid var(--acid); border-radius: 999px; padding: .8rem 1rem; background: transparent; color: var(--acid); }
</style>
