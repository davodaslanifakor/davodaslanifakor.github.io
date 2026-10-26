<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { contactEmailCopy as copy, localize, profile, ui } from '~/content/portfolio'

const props = withDefaults(defineProps<{ locale?: Locale }>(), { locale: 'en' })
const ready = shallowRef(false)
const status = shallowRef('')
const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(profile.email)}`
onMounted(() => { ready.value = true })
async function copyAddress() {
  try {
    await navigator.clipboard.writeText(profile.email)
    status.value = localize(copy.copied, props.locale)
  } catch {
    status.value = localize(copy.selectAddress, props.locale)
  }
}
</script>

<template>
  <details class="contact-email">
    <summary>{{ localize(ui.emailLabel, props.locale) }}</summary>
    <div class="email-options">
      <span class="email-address" dir="ltr">{{ profile.email }}</span>
      <a :href="`mailto:${profile.email}`">{{ localize(copy.mailApp, props.locale) }}</a>
      <a :href="gmail" target="_blank" rel="noopener noreferrer">{{ localize(copy.gmail, props.locale) }}</a>
      <button v-if="ready" type="button" @click="copyAddress">{{ localize(copy.copy, props.locale) }}</button>
      <span role="status" aria-live="polite">{{ status }}</span>
    </div>
  </details>
</template>

<style scoped>
.contact-email { color: inherit; font-size: inherit; }
summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; list-style: none; }
summary::-webkit-details-marker { display: none; }
summary:hover { text-decoration: underline; text-underline-offset: 5px; }
.email-options {
  display: flex; flex-direction: column; gap: 4px; padding: 16px;
  width: min(320px, calc(100vw - 56px)); max-width: 100%;
  border: 1px solid var(--st-line, var(--line)); border-radius: 5px;
  background: var(--st-surface, var(--panel)); color: var(--st-fg, var(--ink));
}
.email-address { font-size: 14px; user-select: all; overflow-wrap: anywhere; }
.email-options a, .email-options button {
  display: inline-flex; align-items: center; min-height: 44px; padding: 0;
  color: inherit; font: inherit; text-align: start; background: transparent; border: 0;
  cursor: pointer; text-decoration: underline; text-underline-offset: 4px;
}
.email-options [role='status']:empty { display: none; }
.email-options [role='status'] { font-size: 12px; line-height: 1.5; }
summary:focus-visible, .email-options button:focus-visible { outline: 2px solid var(--st-accent, var(--acid)); outline-offset: 3px; }
</style>
