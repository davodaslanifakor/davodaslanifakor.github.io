<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { enabledLocales, localize, profile, ui } from '~/content/portfolio'
import SkipToCv from './SkipToCv.vue'
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
      <NuxtLink class="mark" to="/" :aria-label="localize(ui.home, props.locale)">DF</NuxtLink>
      <div>
        <p class="name">{{ profile.name }}</p>
        <p class="role">{{ localize(profile.role, props.locale) }}</p>
      </div>
    </div>

    <nav class="actions" :aria-label="localize(ui.portfolioControls, props.locale)">
      <button v-if="!gameActive" class="control reset-view" type="button" @click="emit('resetView')">{{ localize(ui.resetView, props.locale) }}</button>
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
      <NuxtLink class="contact-link" to="/cv#contact">{{ localize(ui.contactLink, props.locale) }} ↗</NuxtLink>
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

.mark {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: .7rem;
  background: rgb(198 216 162 / 6%);
  color: var(--acid);
  font-family: var(--font-display);
  text-decoration: none;
}

.name,
.role { margin: 0; }
.hud--game { justify-content:flex-end; padding-block:.65rem; }
.name { font: 600 0.85rem/1.1 var(--font-display); letter-spacing: -0.01em; }
.role { margin-top: 0.25rem; color: var(--muted); font-size: 0.75rem; }

.control {
  min-height: 2.75rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.6rem 0.9rem;
  background: rgb(12 14 17 / 76%);
  color: var(--ink);
  backdrop-filter: blur(16px);
  font-size: .75rem;
  transition: border-color 180ms ease, background 180ms ease;
}

.control:hover,
.control:focus-visible { border-color: var(--acid); }

.contact-link {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(198 216 162 / 35%);
  border-radius: 999px;
  padding: .6rem .9rem;
  background: rgb(198 216 162 / 6%);
  color: var(--acid);
  font-size: .75rem;
  text-decoration: none;
}
.contact-link:hover,.contact-link:focus-visible { border-color: var(--acid); }

@media (max-width: 1100px) and (min-aspect-ratio: 1/1) {
  .role { display: none; }
  .name { white-space: nowrap; }
  .actions { gap: .4rem; }
  .control,.contact-link { min-height: 2.4rem; padding: .45rem .65rem; font-size: .68rem; white-space: nowrap; }
  .hud :deep(.skip-button) { min-height: 2.4rem; padding: .45rem .65rem; white-space: nowrap; }
}

@media (max-width: 720px) {
  .hud { padding: .75rem .7rem; gap: .3rem; }
  .role,
  .name,
  .sound-control { display: none; }
  .identity { gap: .5rem; }
  .mark { width: 2.5rem; height: 2.5rem; }
  .actions { gap: .3rem; }
  .control { min-height: 2.5rem; padding: .5rem .55rem; }
  .contact-link { min-height: 2.5rem; padding: .5rem .55rem; font-size: .67rem; white-space: nowrap; }
  .reset-view { font-size: .67rem; white-space: nowrap; }
  .hud :deep(.skip-button) { min-height: 2.5rem; padding: .5rem .6rem; gap: .25rem; font-size: .67rem; white-space: nowrap; }
}
</style>
