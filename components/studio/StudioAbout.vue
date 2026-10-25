<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { studioCopy as copy, vueCertificate } from '~/content/portfolio'
import StudioPortrait from './StudioPortrait.vue'
import StudioReveal from './StudioReveal.vue'
const section = useTemplateRef<HTMLElement>('section')
// The portrait settles from a steeper tilt with slight depth as it passes.
useStudioScene(section, STUDIO_TABLET_UP, ({ gsap }) => {
  gsap.fromTo(
    '.studio-about-portrait',
    { rotation: -7, y: 60 },
    {
      rotation: -2,
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.studio-about-portrait',
        start: 'top bottom',
        end: 'bottom top',
        scrub: STUDIO_SCRUB,
        refreshPriority: -1,
      },
    },
  )
})
</script>

<template>
  <section id="about" ref="section" class="studio-about studio-container">
    <StudioReveal
      ><div class="studio-about-portrait">
        <StudioPortrait /></div
    ></StudioReveal>
    <StudioReveal :delay="70"
      ><div class="studio-about-copy">
        <h2>{{ copy.aboutTitle.en }}</h2>
        <p>{{ copy.aboutBody.en }}</p>
        <p>{{ copy.aboutSecond.en }}</p>
        <NuxtLink no-prefetch class="studio-text-link" to="/cv"
          >{{ copy.cv.en }}<ArrowUpRight :size="18" aria-hidden="true" /></NuxtLink
        ><a
          class="studio-credential"
          :href="vueCertificate.verifyUrl"
          target="_blank"
          rel="noopener noreferrer"
          ><span>{{ vueCertificate.qualification.en }}</span
          ><ArrowUpRight :size="17" aria-hidden="true"
        /></a></div
    ></StudioReveal>
  </section>
</template>
