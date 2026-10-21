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
onMounted(() => input.value?.focus({ preventScroll: true }))
</script>

<template>
  <label class="desk-typing">
    <span>{{ localize(copy.typeHere, props.locale) }}</span>
    <input ref="input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" :spellcheck="false" :disabled="props.disabled" :aria-label="localize(copy.typeHere, props.locale)" :placeholder="localize(copy.typePlaceholder, props.locale)" @keydown="keyboard" @input="!composing && consume()" @compositionstart="composing = true" @compositionend="composing = false; consume()">
  </label>
</template>

<style scoped>
.desk-typing { display: flex; align-items: center; gap: .6rem; flex: 1; min-width: 12rem; font: .72rem/1.4 var(--font-display); color: #f2d77d; }
.desk-typing input { min-width: 0; width: 100%; max-width: 19rem; min-height: 2.75rem; box-sizing: border-box; border: 1px solid #f2d77d80; border-radius: .5rem; background: #0d1915; color: #fff4cf; padding: .45rem .7rem; font: .9rem var(--font-display); }
.desk-typing input:focus-visible { outline: 2px solid #f2d77d; outline-offset: 2px; }
@media (max-width: 700px) { .desk-typing { flex-basis: 100%; } .desk-typing input { max-width: none; } }
</style>
