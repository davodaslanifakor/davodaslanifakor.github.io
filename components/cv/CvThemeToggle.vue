<script setup lang="ts">
import type { CvTheme } from '~/composables/useCvTheme'
import type { Locale } from '~/content/portfolio'
import { cvPresentation, localize } from '~/content/portfolio'

const props = defineProps<{ locale: Locale; theme: CvTheme; ready: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
const label = computed(() => localize(props.theme === 'dark' ? cvPresentation.useLightMode : cvPresentation.useDarkMode, props.locale))
</script>

<template>
  <button
    class="cv-theme-toggle"
    :class="{ 'is-ready': props.ready }"
    type="button"
    :disabled="!props.ready"
    :aria-label="label"
    :title="label"
    @click="emit('toggle')"
  >
    <svg v-if="props.theme === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.5 13.2A8.5 8.5 0 0 1 10.8 3.5a8.5 8.5 0 1 0 9.7 9.7Z" />
    </svg>
  </button>
</template>

<style scoped>
.cv-theme-toggle { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 44px; width: 44px; height: 44px; padding: 0; border: 1px solid var(--line); border-radius: 50%; background: transparent; color: var(--ink); visibility: hidden; }
.cv-theme-toggle.is-ready { visibility: visible; }
.cv-theme-toggle:hover { background: var(--panel); color: var(--acid); }
.cv-theme-toggle svg { width: 19px; height: 19px; }
</style>
