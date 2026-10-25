<script setup lang="ts">
import { ArrowUpRight, Download } from '@lucide/vue'
import { profile, studioResume, studioCopy as copy, ui } from '~/content/portfolio'
import StudioMagnetic from './StudioMagnetic.vue'
import StudioReveal from './StudioReveal.vue'
const section = useTemplateRef<HTMLElement>('section')
// The closing line arrives last: the first words rise, then the script line
// writes on from left to right like a signature.
useStudioScene(section, STUDIO_TABLET_UP, ({ gsap }) => {
  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: 'h2',
        start: 'top 88%',
        end: 'top 38%',
        scrub: STUDIO_SCRUB,
        refreshPriority: -1,
      },
    })
    .fromTo(
      'h2 > span:first-child',
      { yPercent: 60, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.45 },
    )
    .fromTo(
      'h2 > span:last-child',
      { clipPath: 'inset(-30% 100% -45% -4%)' },
      { clipPath: 'inset(-30% -4% -45% -4%)', duration: 0.55 },
      0.35,
    )
})
</script>

<template>
  <section id="contact" ref="section" class="studio-contact studio-container">
    <h2>
      <span v-for="line in copy.contactLines" :key="line.en">{{ line.en }}</span>
    </h2>
    <StudioReveal
      ><p>{{ copy.contactBody.en }}</p>
      <div class="studio-contact-actions">
      <a class="studio-primary" :href="studioResume" download="Davoud_Aslani_Fakour_Resume.pdf">{{ copy.downloadCv.en }}<Download :size="20" aria-hidden="true" /></a>
      <StudioMagnetic
        ><a
          class="studio-contact-cta"
          :href="profile.calendly"
          target="_blank"
          rel="noopener noreferrer"
          ><span class="studio-contact-label"
            ><span>{{ copy.contact.en }}</span
            ><span aria-hidden="true">{{ copy.contactHover.en }}</span></span
          ><ArrowUpRight :size="34" :stroke-width="1.4" aria-hidden="true" /></a
      ></StudioMagnetic>
      </div>
      <div class="studio-socials">
        <a :href="`mailto:${profile.email}`">{{ ui.emailLabel.en }}</a
        ><a :href="profile.linkedin" target="_blank" rel="noopener noreferrer">{{
          ui.linkedinLabel.en
        }}</a
        ><a :href="profile.github" target="_blank" rel="noopener noreferrer">{{
          ui.githubLabel.en
        }}</a
        ><a :href="profile.medium" target="_blank" rel="noopener noreferrer">{{
          ui.mediumLabel.en
        }}</a>
      </div></StudioReveal
    >
  </section>
</template>
