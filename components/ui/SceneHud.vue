<script setup lang="ts">
import { RotateCcw } from '@lucide/vue'
import type { Locale } from '~/content/portfolio'
import { enabledLocales, localize, profile, ui } from '~/content/portfolio'
import SkipToCv from './SkipToCv.vue'
import PortfolioBrand from './PortfolioBrand.vue'
import ScreenThemePicker from './ScreenThemePicker.vue'
import type { ScreenThemeId } from '~/utils/screenTheme'

const props = defineProps<{
  locale: Locale
  soundOn: boolean
  screenTheme: ScreenThemeId
  gameActive?: boolean
}>()

const emit = defineEmits<{
  toggleLocale: []
  toggleSound: []
  resetView: []
  selectScreenTheme: [theme: ScreenThemeId]
}>()
</script>

<template>
  <header class="hud" :class="{ 'hud--game': gameActive }">
    <div v-if="!gameActive" class="identity">
      <NuxtLink no-prefetch class="mark" to="/" :aria-label="localize(ui.home, props.locale)"><PortfolioBrand /></NuxtLink>
      <p class="role">{{ localize(profile.role, props.locale) }}</p>
    </div>

    <nav class="actions" :aria-label="localize(ui.portfolioControls, props.locale)">
      <button v-if="!gameActive" class="control reset-view" type="button" :title="localize(ui.resetView, props.locale)" @click="emit('resetView')"><RotateCcw class="reset-icon" :size="16" aria-hidden="true" /><span>{{ localize(ui.resetView, props.locale) }}</span></button>
      <button v-if="enabledLocales.length > 1" class="control" type="button" @click="emit('toggleLocale')">
        {{ props.locale === 'en' ? 'FA' : 'EN' }}
        <span class="sr-only">{{ localize(ui.language, props.locale) }}</span>
      </button>
      <button
        v-if="!gameActive"
        class="control sound-control"
        type="button"
        :aria-pressed="props.soundOn"
        @click="emit('toggleSound')"
      >
        {{ localize(ui.sound, props.locale) }}: {{ localize(props.soundOn ? ui.on : ui.off, props.locale) }}
      </button>
      <ScreenThemePicker v-if="!gameActive" :locale="props.locale" :theme="props.screenTheme" @select="emit('selectScreenTheme', $event)" />
      <NuxtLink class="contact-link" to="/cv#contact">{{ localize(ui.contactLink, props.locale) }} <span>↗</span></NuxtLink>
      <SkipToCv :locale="props.locale" />
    </nav>
  </header>
</template>

<style scoped>
.hud {
  position: absolute;
  z-index: 40;
  top: 0;
  inset-inline: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem clamp(1rem, 3vw, 2.5rem);
  pointer-events: none;
}

.identity,
.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  pointer-events: auto;
}
.identity { flex-direction: column; align-items: flex-start; gap: .3rem; }

.mark {
  --brand-width: 236px;
  --brand-size: 40px;
  --brand-symbol-filter: brightness(0) invert(1);
  --brand-color-display: none;
  --brand-white-display: block;
  display: grid;
  min-height: 2.75rem;
  place-items: center;
  text-decoration: none;
}

.hud--game { justify-content:flex-end; padding-block:.65rem; }
.role { margin: 0; color: var(--muted); font: .75rem/1.5 var(--font-body); }

.control {
  min-height: 2.75rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.6rem 0.9rem;
  background: rgb(12 14 17 / 76%);
  color: var(--ink);
  backdrop-filter: blur(16px);
  font: 500 .8125rem/1.4 var(--font-body);
  transition: border-color 180ms ease, background 180ms ease;
}

.control:hover,
.control:focus-visible { border-color: var(--acid); }
.reset-icon { display: none; }

.contact-link {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: .3rem;
  border: 1px solid rgb(198 216 162 / 35%);
  border-radius: 999px;
  padding: .6rem .9rem;
  background: rgb(198 216 162 / 6%);
  color: var(--acid);
  font: 500 .8125rem/1.4 var(--font-body);
  text-decoration: none;
}
.contact-link:hover,.contact-link:focus-visible { border-color: var(--acid); }

@media (max-width: 1100px) {
  .role { display: none; }
  .mark { --brand-width: 210px; }
  .actions { gap: .4rem; }
  .control,.contact-link { padding: .45rem .65rem; font-size: .75rem; white-space: nowrap; }
  .hud :deep(.skip-button) { padding: .45rem .65rem; white-space: nowrap; }
}

@media (max-width: 720px) {
  .hud { padding: .75rem .7rem; gap: .3rem; }
  .sound-control { display: none; }
  .identity { gap: .5rem; }
  .mark { min-width: 2.75rem; }
  .actions { gap: .3rem; }
  .control { padding: .5rem .55rem; }
  .contact-link { padding: .5rem .4rem; font-size: .75rem; white-space: nowrap; }
  .reset-view { display: grid; min-width: 2.75rem; place-items: center; }
  .reset-icon { display: block; }
  .reset-view span { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .contact-link span,.hud :deep(.skip-button > span:last-child) { display: none; }
  .hud :deep(.skip-button) { padding: .5rem .4rem; gap: 0; font-size: .75rem; white-space: nowrap; }
}
</style>
