<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef } from 'vue'
import { analyticsCopy as copy, localize } from '~/content/portfolio'
import type { AnalyticsChoice } from '~/utils/visitorAnalytics'

const { locale, direction } = usePortfolioLocale()
const { choice, ready, enabled } = useAnalyticsConsent()
const editing = shallowRef(false)
const preferences = useTemplateRef<HTMLButtonElement>('preferences')
const visible = computed(() => ready.value && enabled.value && (!choice.value || editing.value))
async function choose(value: AnalyticsChoice) {
  choice.value = value
  editing.value = false
  await nextTick()
  preferences.value?.focus({ preventScroll: true })
}
</script>

<template>
  <aside v-if="visible" class="analytics-consent" :dir="direction" :aria-label="localize(copy.title, locale)">
    <strong>{{ localize(copy.title, locale) }}</strong>
    <p>{{ localize(copy.description, locale) }} <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">{{ localize(copy.privacy, locale) }}</a></p>
    <p v-if="choice === 'accepted'" class="analytics-consent__note">{{ localize(copy.withdrawal, locale) }}</p>
    <div>
      <button type="button" @click="choose('declined')">{{ localize(copy.reject, locale) }}</button>
      <button type="button" @click="choose('accepted')">{{ localize(copy.accept, locale) }}</button>
    </div>
  </aside>
  <button v-else-if="ready && enabled" ref="preferences" type="button" class="analytics-preferences" @click="editing = true">{{ localize(copy.settings, locale) }}</button>
</template>

<style scoped>
.analytics-consent { position: fixed; z-index: 200; inset-inline-end: 1rem; bottom: 1rem; width: min(28rem, calc(100vw - 2rem)); box-sizing: border-box; padding: 1.15rem; border: 1px solid #b6bea9; border-radius: .75rem; background: #f5f4ee; color: #242a24; box-shadow: 0 .5rem 2rem #0002; font: 400 .85rem/1.55 var(--font-display, system-ui); }
.analytics-consent strong { font-weight: 650; }
.analytics-consent p { margin: .5rem 0 .85rem; }
.analytics-consent a { color: inherit; text-decoration: underline; text-underline-offset: .15em; }
.analytics-consent__note { font-size: .78rem; }
.analytics-consent div { display: flex; gap: .65rem; }
.analytics-consent button { flex: 1; min-height: 44px; padding: .5rem .7rem; border: 1px solid #66725b; border-radius: .35rem; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.analytics-consent button:last-child { background: #303f2e; color: #fff; }
.analytics-preferences { position: fixed; z-index: 30; inset-inline-start: .5rem; bottom: .25rem; min-height: 44px; padding: .4rem .6rem; border: 1px solid #86907855; border-radius: .35rem; background: #f5f4ee; color: #303a2e; font: 400 .7rem/1.4 var(--font-display, system-ui); cursor: pointer; }
.analytics-consent button:focus-visible, .analytics-consent a:focus-visible, .analytics-preferences:focus-visible { outline: 2px solid #668541; outline-offset: 3px; }
</style>
