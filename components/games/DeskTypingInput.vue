<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'
import { deskMischiefCopy as copy, localize } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'
const props = defineProps<{ locale: Locale; disabled: boolean }>()
const emit = defineEmits<{ type: [key: string, code?: string]; exit: [] }>()
const input = useTemplateRef<HTMLInputElement>('input'), composing = ref(false)
function consume() {
  const value = input.value?.value ?? ''
  if (input.value) input.value.value = ''
  if (!props.disabled) Array.from(value).slice(0, 96).forEach(key => emit('type', key))
}
function keyboard(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); emit('exit'); return }
  if (event.isComposing || composing.value || event.altKey || event.ctrlKey || event.metaKey) { event.stopPropagation(); return }
  if (event.key.length === 1 || ['Enter', 'Backspace'].includes(event.key)) {
    event.preventDefault(); event.stopPropagation()
    if (!props.disabled && !event.repeat) emit('type', event.key, event.code)
  }
}
function focus() { input.value?.focus({ preventScroll: true }) }
onMounted(focus)
</script>

<template>
  <div class="desk-typing">
    <button type="button" :disabled="props.disabled" @click="focus">{{ localize(copy.typeHere, props.locale) }}</button>
    <input ref="input" class="sr-only" tabindex="-1" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" :spellcheck="false" :disabled="props.disabled" :aria-label="localize(copy.typeHere, props.locale)" @keydown="keyboard" @input="!composing && consume()" @compositionstart="composing = true" @compositionend="composing = false; consume()">
  </div>
</template>

<style scoped>
.desk-typing { position: relative; }
.desk-typing button { min-height: 2.75rem; border: 1px solid #ffffff24; border-radius: .5rem; background: #ffffff08; color: #eeeedd; padding: .35rem .65rem; font: .72rem/1.2 var(--font-display); cursor: pointer; }
.desk-typing button:hover:not(:disabled) { background: #ffffff15; }
.desk-typing button:disabled { opacity: .42; cursor: default; }
.desk-typing:focus-within button { outline: 2px solid #f2d77d; outline-offset: 3px; }
</style>
