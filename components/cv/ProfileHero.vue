<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { cvPresentation, localize, profile, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <header class="hero">
    <div class="hero-identity">
      <p class="hero-location">{{ localize(profile.location, props.locale) }}</p>
      <h1 class="headline">{{ profile.name }}</h1>
      <p class="role">{{ localize(profile.role, props.locale) }}</p>
      <p class="specialties">{{ profile.specialties }}</p>
    </div>
    <div class="hero-intro">
      <p class="tagline">{{ localize(cvPresentation.introduction, props.locale) }}</p>
      <div class="hero-actions">
        <a class="work-link" href="#work">{{ localize(ui.viewWork, props.locale) }} <span aria-hidden="true">↘</span></a>
        <a :href="profile.calendly" target="_blank" rel="noopener noreferrer">{{ localize(ui.bookCall, props.locale) }} <span aria-hidden="true">↗</span></a>
      </div>
      <p class="availability"><span aria-hidden="true" />{{ localize(cvPresentation.availability, props.locale) }}</p>
    </div>
  </header>
</template>

<style scoped>
.hero { display: grid; grid-template-columns: 1.1fr 1fr; align-items: end; gap: clamp(2.5rem, 7vw, 7rem); padding-block: clamp(4rem, 8vw, 7rem) clamp(4rem, 7vw, 6rem); }
.hero-identity,.hero-intro { min-width: 0; }
.hero-location { margin: 0 0 1.75rem; color: var(--muted); font: 500 .8125rem/1.5 var(--font-display); }
.headline { max-width: 8ch; margin: 0; font: 400 clamp(4rem, 8.2vw, 7.25rem)/1.04 var(--font-heading, var(--font-display)); letter-spacing: -.055em; }
.role { max-width: 30ch; margin: 1.5rem 0 0; font-size: 1rem; line-height: 1.5; text-wrap: balance; }
.specialties { margin: .45rem 0 0; color: var(--muted); font-size: .875rem; line-height: 1.5; }
.tagline { max-width: 29ch; margin: 0; font-size: clamp(1.25rem, 2.1vw, 1.75rem); line-height: 1.5; letter-spacing: -.015em; text-wrap: pretty; }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1.5rem; margin-top: 2rem; }
.hero-actions a { display: inline-flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 44px; color: var(--ink); font-size: .875rem; font-weight: 600; text-decoration: none; }
.hero-actions a:hover { color: var(--acid); }
.hero-actions .work-link { padding-block: .8rem; border-bottom: 1px solid var(--ink); }
.hero-actions .work-link:hover { color: var(--acid); border-color: var(--acid); }
.availability { display: flex; align-items: center; gap: .6rem; margin: 1.75rem 0 0; color: var(--muted); font-size: .8125rem; line-height: 1.5; }
.availability span { flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; background: var(--acid); }
@media (max-width: 700px) {
  .hero { grid-template-columns: 1fr; gap: 2rem; padding-block: 2.75rem 3.25rem; }
  .hero-location { margin-bottom: 1.25rem; }
  .headline { font-size: clamp(3.5rem, 15vw, 4.75rem); }
  .role { margin-top: 1.25rem; }
  .tagline { max-width: 34ch; font-size: 1.125rem; line-height: 1.5; letter-spacing: 0; }
  .hero-actions { margin-top: 1.5rem; gap: .75rem 1.25rem; }
  .hero-actions a { font-size: .8125rem; }
  .availability { margin-top: 1.25rem; }
}
</style>
