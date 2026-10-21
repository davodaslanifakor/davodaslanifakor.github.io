<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, profile, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
const hasCv = !profile.cvPath.startsWith('TODO')
const hasContact = computed(() => !profile.email.startsWith('TODO') && !profile.linkedin.startsWith('TODO'))
</script>

<template>
  <section id="contact" class="contact-section">
    <p class="section-number">06</p>
    <div>
      <p class="contact-kicker">{{ localize(profile.cta, props.locale) }}</p>
      <h2 class="contact-title">{{ localize(ui.contact, props.locale) }}</h2>
      <div v-if="hasContact" class="contact-links">
        <a :href="`mailto:${profile.email}`">{{ localize(ui.emailLabel, props.locale) }}</a>
        <a :href="profile.linkedin" rel="noopener" target="_blank">{{ localize(ui.linkedinLabel, props.locale) }}</a>
        <a :href="profile.github" rel="noopener" target="_blank">{{ localize(ui.githubLabel, props.locale) }}</a>
        <a :href="profile.medium" rel="noopener" target="_blank">{{ localize(ui.mediumLabel, props.locale) }}</a>
        <a v-if="hasCv" :href="profile.cvPath" download>{{ localize(ui.downloadCv, props.locale) }}</a>
      </div>
      <p v-else class="pending">{{ localize(ui.unavailable, props.locale) }}</p>
    </div>
  </section>
</template>

<style scoped>
.contact-section { display: grid; grid-template-columns: minmax(3rem, 0.25fr) 1fr; gap: 2rem; min-height: 70svh; align-items: center; border-top: 1px solid var(--line); padding: 5rem 0; }
.contact-kicker { color: var(--acid); font: 0.76rem/1.4 var(--font-mono); letter-spacing: 0.06em; text-transform: uppercase; }
.contact-title { margin: 1rem 0 2rem; font: clamp(4rem, 11vw, 9rem)/0.8 var(--font-display); letter-spacing: -0.07em; }
.contact-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.contact-links a { border-bottom: 1px solid var(--acid); padding: 0.5rem 0; color: var(--ink); text-decoration: none; }
.pending { max-width: 32rem; color: var(--muted); }
</style>
