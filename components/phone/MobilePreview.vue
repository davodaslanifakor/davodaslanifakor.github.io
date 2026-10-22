<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <div class="mobile-preview">
    <div class="copy">
      <p class="intro">{{ localize(ui.mobilePreviewIntro, props.locale) }}</p>
      <p class="on-phone">{{ localize(ui.mobilePreviewOnPhone, props.locale) }}</p>
      <NuxtLink class="open-cv" to="/cv">{{ localize(ui.openCv, props.locale) }} ↗</NuxtLink>
    </div>
    <!-- A real mobile viewport. Keep a readable scale and let short modals scroll. -->
    <div class="device">
      <div class="notch" aria-hidden="true" />
      <div class="screen">
        <iframe src="/cv" :title="localize(ui.mobilePreviewFrame, props.locale)" loading="lazy" width="390" height="740" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-preview { --scale: 0.7; display: grid; grid-template-columns: minmax(12rem, 1fr) auto; gap: clamp(1.5rem, 4vw, 3.5rem); align-items: start; }
.copy { padding-top: 1rem; }
.open-cv { border-bottom: 1px solid var(--acid); color: var(--ink); text-decoration: none; }
.open-cv:hover { color: var(--acid); }
.intro { max-width: 25ch; margin: 0 0 1.5rem; font-size: 1.125rem; line-height: 1.6; }
.on-phone { display: none; margin: 0 0 1.5rem; color: var(--muted); }
.device { position: relative; width: calc(390px * var(--scale) + 20px); border: 1px solid var(--line); border-radius: 34px; padding: 24px 10px 10px; background: #050607; box-shadow: 0 30px 60px rgb(0 0 0 / 0.45), inset 0 0 0 2px #1d2226; }
.notch { position: absolute; top: 11px; left: 50%; width: 22%; height: 5px; border-radius: 999px; background: #252b2b; transform: translateX(-50%); }
.screen { width: calc(390px * var(--scale)); height: calc(740px * var(--scale)); overflow: hidden; border-radius: 26px; background: var(--canvas); }
.screen iframe { display: block; width: 390px; height: 740px; border: 0; transform: scale(var(--scale)); transform-origin: top left; }
@media (max-height: 900px) { .mobile-preview { --scale: 0.6; } }
@media (max-height: 760px) { .mobile-preview { --scale: 0.55; } }
@media (max-width: 700px) {
  .mobile-preview { grid-template-columns: 1fr; }
  .device { display: none; }
  .on-phone { display: block; }
}
</style>
