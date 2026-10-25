<script setup lang="ts">
import { ArrowUpRight, Moon, Sun } from '@lucide/vue'
import { studioCopy as copy } from '~/content/portfolio'
import PortfolioBrand from '~/components/ui/PortfolioBrand.vue'
const { theme, ready, busy, toggle } = useStudioTheme()
const sentinel = useTemplateRef<HTMLElement>('sentinel')
const scrolled = shallowRef(false)
let observer: IntersectionObserver | undefined
onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    scrolled.value = !entry?.isIntersecting
  })
  if (sentinel.value) observer.observe(sentinel.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="sentinel" class="studio-nav-sentinel" aria-hidden="true" />
  <header class="studio-navigation" :class="{ 'is-scrolled': scrolled }">
    <nav class="studio-container studio-nav-inner" :aria-label="copy.nav.en">
      <NuxtLink
        no-prefetch
        to="/studio"
        class="studio-wordmark"
        :aria-label="copy.brandHome.en"
      >
        <PortfolioBrand />
      </NuxtLink>
      <span class="studio-availability"
        ><i aria-hidden="true" />{{ copy.available.en }}</span
      >
      <div class="studio-nav-links">
        <NuxtLink no-prefetch to="/studio#work">{{ copy.work.en }}</NuxtLink>
        <NuxtLink no-prefetch class="studio-nav-writing" to="/studio#writing">{{ copy.writing.en }}</NuxtLink>
        <NuxtLink no-prefetch to="/cv">{{ copy.cv.en }}</NuxtLink>
        <NuxtLink no-prefetch to="/studio#contact"
          >{{ copy.contact.en }}<ArrowUpRight :size="15" aria-hidden="true"
        /></NuxtLink>
        <button
          class="studio-theme-toggle"
          :class="{ 'is-ready': ready }"
          type="button"
          :disabled="!ready || busy"
          :aria-label="
            theme === 'dark' ? copy.themeLight.en : copy.themeDark.en
          "
          :title="theme === 'dark' ? copy.themeLight.en : copy.themeDark.en"
          @click="toggle"
        >
          <Sun
            v-if="theme === 'dark'"
            :size="18"
            :stroke-width="1.5"
            aria-hidden="true"
          />
          <Moon v-else :size="18" :stroke-width="1.5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  </header>
</template>
