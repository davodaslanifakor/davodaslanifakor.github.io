<script setup lang="ts">
import { localize, profile, ui, writing } from '~/content/portfolio'
import CaseStudyGrid from '~/components/cv/CaseStudyGrid.vue'
import ContactCard from '~/components/cv/ContactCard.vue'
import ProfileHero from '~/components/cv/ProfileHero.vue'
import SkillsGrid from '~/components/cv/SkillsGrid.vue'
import StorySection from '~/components/cv/StorySection.vue'
import WritingSection from '~/components/cv/WritingSection.vue'
import TimelineList from '~/components/cv/TimelineList.vue'

const { locale, direction, toggleLocale, canSwitchLocale } = usePortfolioLocale()
const isReady = shallowRef(false)
const siteUrl = useRuntimeConfig().public.siteUrl
const socialImage = new URL('/og-portfolio.jpg', siteUrl).href

onMounted(() => {
  isReady.value = true
})

useHead({
  title: `${profile.name} — Senior Frontend Engineer & Technical Lead`,
  link: [{ rel: 'canonical', href: new URL('/cv/', siteUrl).href }],
  meta: [
    { name: 'description', content: 'Senior Vue.js and TypeScript engineer and technical lead building editors, design systems, and scalable AI SaaS products.' },
    { property: 'og:type', content: 'profile' },
    { property: 'og:title', content: `${profile.name} — Senior Frontend Engineer & Technical Lead` },
    { property: 'og:description', content: profile.tagline.en },
    { property: 'og:image', content: socialImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: `${profile.name} — Senior Frontend Engineer & Technical Lead` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: `${profile.name} — Senior Frontend Engineer & Technical Lead` },
    { name: 'twitter:description', content: profile.tagline.en },
    { name: 'twitter:image', content: socialImage },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        alternateName: profile.alternateNames,
        jobTitle: profile.role.en,
        address: { '@type': 'PostalAddress', addressLocality: profile.location.en },
        knowsAbout: ['Vue.js', 'Nuxt', 'TypeScript', 'Frontend architecture', 'Visual editors', 'AI SaaS'],
      }),
    },
  ],
})
</script>

<template>
  <div class="cv-page" :dir="direction" :data-ready="isReady">
    <nav class="cv-nav" :aria-label="localize(ui.cvNavigation, locale)">
      <NuxtLink class="cv-mark" to="/">DF</NuxtLink>
      <div class="cv-nav-links">
        <a href="#story">{{ localize(ui.lifeStory, locale) }}</a>
        <a href="#experience">{{ localize(ui.experience, locale) }}</a>
        <a href="#work">{{ localize(ui.selectedWork, locale) }}</a>
        <a v-if="writing.articles.length" href="#writing">{{ localize(ui.writing, locale) }}</a>
        <a href="#contact">{{ localize(ui.contact, locale) }}</a>
        <button v-if="canSwitchLocale" type="button" @click="toggleLocale">{{ locale === 'en' ? 'FA' : 'EN' }}</button>
      </div>
    </nav>

    <main class="cv-main">
      <ProfileHero :locale="locale" />
      <StorySection :locale="locale" />
      <TimelineList :locale="locale" />
      <SkillsGrid :locale="locale" />
      <CaseStudyGrid :locale="locale" />
      <WritingSection :locale="locale" />
      <ContactCard :locale="locale" />
    </main>
  </div>
</template>

<style scoped>
.cv-page { min-height: 100svh; background: var(--canvas); }
.cv-nav { position: fixed; z-index: 20; top: 0; inset-inline: 0; display: flex; align-items: center; justify-content: space-between; padding: 1.25rem clamp(1rem,4vw,3.5rem); background: linear-gradient(to bottom, var(--canvas) 20%, transparent); }
.cv-mark { display: grid; width: 2.8rem; height: 2.8rem; place-items: center; border: 1px solid var(--line); color: var(--acid); font: 1rem/1 var(--font-display); text-decoration: none; }
.cv-nav-links { display: flex; align-items: center; gap: clamp(.7rem,2vw,1.5rem); }
.cv-nav-links a,.cv-nav-links button { border: 0; background: transparent; color: var(--muted); font: .72rem/1 var(--font-mono); text-decoration: none; text-transform: uppercase; }
.cv-nav-links a:hover,.cv-nav-links button:hover { color: var(--acid); }
.cv-main { width: min(92rem, calc(100% - 2rem)); margin: 0 auto; }
@media (max-width: 600px) { .cv-nav-links a { display: none; } }
</style>
