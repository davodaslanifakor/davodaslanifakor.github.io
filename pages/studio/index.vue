<script setup lang="ts">
import { studioCopy } from '~/content/portfolio'
import StudioShell from '~/components/studio/StudioShell.vue'
import StudioHero from '~/components/studio/StudioHero.vue'
import StudioWork from '~/components/studio/StudioWork.vue'
import StudioCareer from '~/components/studio/StudioCareer.vue'
import StudioWriting from '~/components/studio/StudioWriting.vue'
import StudioOpenSource from '~/components/studio/StudioOpenSource.vue'
import StudioPractice from '~/components/studio/StudioPractice.vue'
import StudioAbout from '~/components/studio/StudioAbout.vue'
import StudioContact from '~/components/studio/StudioContact.vue'
import StudioFooter from '~/components/studio/StudioFooter.vue'
const siteUrl = useRuntimeConfig().public.siteUrl
usePortfolioIdentity()
useHead({
  title: studioCopy.title.en,
  link: [{ rel: 'canonical', href: new URL('/studio/', siteUrl).href }],
  meta: [
    { name: 'description', content: studioCopy.heroIntro.en },
  ],
})
</script>

<template>
  <StudioShell>
    <!-- Each data-stack layer holds while the next chapter slides over it. -->
    <div class="studio-opening" data-stack>
      <StudioHero data-stack /><StudioCareer />
    </div>
    <StudioWork data-stack />
    <StudioWriting data-stack />
    <div class="studio-closing" data-stack>
      <StudioOpenSource /><StudioPractice /><StudioAbout />
    </div>
    <div class="studio-finale"><StudioContact /><StudioFooter /></div>
  </StudioShell>
</template>
