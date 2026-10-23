<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, profile, ui, writing } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
const hasCv = !profile.cvPath.startsWith('TODO')
const hasContact = computed(() => !profile.email.startsWith('TODO') && !profile.linkedin.startsWith('TODO'))
</script>

<template>
  <section id="contact" class="contact-section section">
    <p class="section-number">{{ writing.articles.length ? '06' : '05' }}</p>
    <div>
      <p class="contact-kicker">{{ localize(profile.cta, props.locale) }}</p>
      <h2 class="contact-title">{{ localize(ui.contact, props.locale) }}</h2>
      <div v-if="hasContact" class="contact-links">
        <a class="booking-link" :href="profile.calendly" rel="noopener noreferrer" target="_blank">{{ localize(ui.bookCall, props.locale) }} ↗</a>
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
.contact-section { padding-bottom: clamp(4rem, 8vw, 7rem); }
.contact-kicker { max-width: 48ch; margin: 0; color: var(--muted); font: 1rem/1.6 var(--font-display); }
.contact-title { margin: 1.5rem 0; font: 400 clamp(2rem, 4vw, 3.25rem)/1.15 var(--font-heading, var(--font-display)); letter-spacing: -.035em; }
.contact-links { display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; }
.contact-links a { display: inline-flex; align-items: center; min-height: 44px; border-bottom: 1px solid var(--line); padding-block: .6rem; color: var(--ink); font-size: .9375rem; text-decoration: none; }
.contact-links a:hover { color: var(--acid); border-color: var(--acid); }
.contact-links .booking-link { padding-inline: 1rem; border: 1px solid transparent; border-radius: 4px; background: var(--cv-sunlight); color: var(--cv-on-sunlight); font-weight: 600; transition: background-color 160ms ease; }
.contact-links .booking-link:hover { background: var(--cv-sunlight-hover); color: var(--cv-on-sunlight); border-color: transparent; }
.pending { max-width: 32rem; color: var(--muted); }
</style>
