<script setup lang="ts">
import { useId, useTemplateRef } from 'vue'
import { localize, ui } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'
import { SCREEN_THEMES } from '~/utils/screenTheme'
import type { ScreenThemeId } from '~/utils/screenTheme'

defineProps<{ locale: Locale; theme: ScreenThemeId }>()
const emit = defineEmits<{ select: [theme: ScreenThemeId] }>()
const groupName = useId()
const disclosure = useTemplateRef<HTMLDetailsElement>('disclosure')

function close(event: KeyboardEvent) {
  if (!disclosure.value?.open) return
  event.stopPropagation()
  disclosure.value.open = false
  disclosure.value.querySelector('summary')?.focus()
}

function navigateThemes(event: KeyboardEvent) {
  if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  if (!(event.target instanceof HTMLInputElement)) return
  const radios = [...(event.currentTarget as HTMLFieldSetElement).querySelectorAll<HTMLInputElement>('input[type="radio"]')]
  const index = radios.indexOf(event.target)
  if (index < 0) return
  const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? radios.length - 1 : (index + direction + radios.length) % radios.length
  // WebKit's native radios stop at the last item; keep all four directions consistent.
  event.preventDefault()
  radios[next]?.focus()
  radios[next]?.click()
}
</script>

<template>
  <details ref="disclosure" class="screen-preview" @keydown.esc="close">
    <summary class="preview-toggle" :title="localize(ui.screenStylePreview, locale)">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
        <rect x="2" y="3" width="20" height="14" rx="3" />
        <path d="m4 14 5-5 4 4 3-3 4 4M8 21h8m-4-4v4" />
      </svg>
      <span class="sr-only">{{ localize(ui.screenStylePreview, locale) }}</span>
    </summary>
    <fieldset class="theme-options" @keydown="navigateThemes">
      <legend class="sr-only">{{ localize(ui.screenTheme, locale) }}</legend>
      <label v-for="option in SCREEN_THEMES" :key="option.id" class="theme-option">
        <input
          class="sr-only"
          type="radio"
          :name="groupName"
          :value="option.id"
          :checked="theme === option.id"
          @change="emit('select', option.id)"
        >
        <span class="segment">
          <span class="swatch" :style="{ backgroundColor: option.base, color: option.accent }" aria-hidden="true">{{ theme === option.id ? '✓' : '' }}</span>
          {{ localize(ui.screenThemes[option.id], locale) }}
        </span>
      </label>
    </fieldset>
  </details>
</template>

<style scoped>
.screen-preview { position: relative; }
.preview-toggle {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: rgb(12 14 17 / 86%);
  color: var(--ink);
  cursor: pointer;
  list-style: none;
}
.preview-toggle::-webkit-details-marker { display: none; }
.preview-toggle:hover,
.preview-toggle:focus-visible,
.screen-preview[open] .preview-toggle { border-color: var(--acid); }
.preview-toggle:focus-visible { outline: 2px solid var(--acid); outline-offset: 3px; }
.theme-options {
  position: absolute;
  inset-block-start: calc(100% + .5rem);
  inset-inline-end: 0;
  display: flex;
  width: max-content;
  margin: 0;
  border: 1px solid var(--line);
  border-radius: .85rem;
  padding: .3rem;
  background: #171c1b;
  box-shadow: 0 8px 24px rgb(0 0 0 / 24%);
}
.theme-option { position: relative; cursor: pointer; }
.segment {
  display: flex;
  min-width: 3.7rem;
  min-height: 3.4rem;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: .3rem;
  border: 1px solid transparent;
  border-radius: .55rem;
  padding: .4rem;
  color: var(--ink);
  font-size: .68rem;
}
.swatch { display: grid; width: 1.1rem; height: 1.1rem; border: 1px solid currentColor; border-radius: 50%; place-items: center; font-size: .6rem; }
.theme-option input:checked + .segment { border-color: var(--acid); background: rgb(198 216 162 / 9%); }
.theme-option input:focus-visible + .segment { outline: 2px solid var(--ink); outline-offset: 1px; }
.theme-option:hover .segment { background: rgb(255 255 255 / 7%); }
@media (max-width: 720px) {
  .screen-preview { position: static; }
  .preview-toggle { width: 2.5rem; height: 2.5rem; }
  .theme-options { inset-block-start: calc(100% - .25rem); inset-inline-end: .7rem; }
}
</style>
