<script setup lang="ts">
import { profile } from '~/content/portfolio'
import CvNavigation from '~/components/cv/CvNavigation.vue'
import CaseStudyGrid from '~/components/cv/CaseStudyGrid.vue'
import ContactCard from '~/components/cv/ContactCard.vue'
import ProfileHero from '~/components/cv/ProfileHero.vue'
import SkillsGrid from '~/components/cv/SkillsGrid.vue'
import StorySection from '~/components/cv/StorySection.vue'
import WritingSection from '~/components/cv/WritingSection.vue'
import TimelineList from '~/components/cv/TimelineList.vue'

const { locale, direction, toggleLocale, canSwitchLocale } = usePortfolioLocale()
const { theme, themeReady, toggleTheme } = useCvTheme()
const isReady = shallowRef(false)
const siteUrl = useRuntimeConfig().public.siteUrl
const socialImage = new URL('/og-portfolio.jpg', siteUrl).href

onMounted(() => {
  isReady.value = true
})

usePortfolioIdentity()
useHead({
  htmlAttrs: { class: 'cv-document' },
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

})
</script>

<template>
  <div class="cv-page" :dir="direction" :data-ready="isReady">
    <CvNavigation :locale="locale" :can-switch-locale="canSwitchLocale" :theme="theme" :theme-ready="themeReady" @toggle-locale="toggleLocale" @toggle-theme="toggleTheme" />
    <main class="cv-main">
      <ProfileHero :locale="locale" />
      <CaseStudyGrid :locale="locale" />
      <TimelineList :locale="locale" />
      <SkillsGrid :locale="locale" />
      <StorySection :locale="locale" />
      <WritingSection :locale="locale" />
      <ContactCard :locale="locale" />
    </main>
  </div>
</template>

<style scoped>
.cv-page { min-height: 100svh; background: var(--canvas); color: var(--ink); font-kerning: normal; text-rendering: optimizeLegibility; }
.cv-main { width: min(76rem, calc(100% - 4rem)); margin-inline: auto; }
.cv-main :deep(section[id]) { scroll-margin-top: 6.5rem; }
@media (max-width: 640px) { .cv-main { width: calc(100% - 2.5rem); } }
@media (max-width: 350px) { .cv-main { width: calc(100% - 2rem); } }
</style>
