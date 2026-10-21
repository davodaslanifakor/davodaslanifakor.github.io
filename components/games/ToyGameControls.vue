<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue'
import type { Locale } from '~/content/portfolio'
import { jokerGameCopy as copy, localize, ui } from '~/content/portfolio'
import type { JokerGameState } from '~/composables/useJokerCardGame'

const props = defineProps<{ state: JokerGameState; locale: Locale; ready: boolean; reducedMotion: boolean }>()
const emit = defineEmits<{ start: []; shuffle: []; pick: [slot: number]; memory: [value: boolean]; close: [] }>()
const panel = useTemplateRef<HTMLElement>('panel')
const won = computed(() => props.state.selected !== null && props.state.slots[props.state.selected] === props.state.winner)
const status = computed(() => {
  if (!props.ready) return localize(copy.arriving, props.locale)
  const phase = props.state.phase
  if (phase === 'intro') return localize(props.state.memory ? copy.memoryIntro : copy.intro, props.locale)
  if (phase === 'showing') return localize(copy.remember, props.locale).replace('{card}', String(props.state.slots.indexOf(props.state.winner) + 1))
  if (phase === 'hiding' || phase === 'shuffling') return localize(copy.shuffling, props.locale)
  if (phase === 'picking') return localize(copy.pick, props.locale)
  return localize(won.value ? copy.win : copy.lose, props.locale).replace('{card}', String(props.state.slots.indexOf(props.state.winner) + 1))
})
const canStart = computed(() => ['intro', 'result'].includes(props.state.phase))
const choices = computed(() => props.state.slots.map((card, slot) => ({
  slot,
  label: localize(copy.card, props.locale).replace('{card}', String(slot + 1)),
  face: ['showing', 'result'].includes(props.state.phase) ? (card === props.state.winner ? '★' : '◆') : null,
  winning: props.state.phase === 'result' && card === props.state.winner,
  selected: props.state.selected === slot,
})))
function keyboard(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
  if (props.ready && props.state.phase === 'picking' && /^[1-3]$/.test(event.key)) {
    event.preventDefault()
    emit('pick', Number(event.key) - 1)
  }
}
async function focusAction() {
  await nextTick()
  panel.value?.querySelector<HTMLElement>('[data-primary]:not(:disabled)')?.focus({ preventScroll: true })
}
onMounted(() => {
  if (props.ready) void focusAction()
  else panel.value?.focus({ preventScroll: true })
})
watch([() => props.ready, () => props.state.phase], () => {
  if (props.ready && !['hiding', 'shuffling'].includes(props.state.phase)) void focusAction()
})
</script>

<template>
  <section ref="panel" class="toy-game" :data-phase="props.state.phase" :data-memory="props.state.memory" tabindex="-1" role="region" :aria-label="localize(copy.title, props.locale)" @keydown="keyboard">
    <header class="toy-game__header">
      <div>
        <p class="toy-game__eyebrow">{{ localize(copy.eyebrow, props.locale) }}</p>
        <h2 class="toy-game__title">{{ localize(copy.title, props.locale) }}</h2>
      </div>
      <button class="toy-game__back" type="button" @click="emit('close')">← {{ localize(ui.back, props.locale) }}</button>
    </header>
    <p class="toy-game__status" role="status" aria-live="polite" aria-atomic="true">{{ status }}</p>
    <div class="toy-game__choices" dir="ltr" :aria-label="localize(copy.cards, props.locale)" role="group">
      <button v-for="choice in choices" :key="choice.slot" class="toy-game__choice" :class="{ 'is-winning': choice.winning, 'is-selected': choice.selected }" type="button" :disabled="!props.ready || props.state.phase !== 'picking'" :aria-label="choice.label" :data-primary="choice.slot === 0 ? '' : undefined" @click="emit('pick', choice.slot)">
        <span class="toy-game__symbol" aria-hidden="true">{{ choice.face ?? '◇' }}</span>
        <span>{{ choice.label }}</span>
      </button>
    </div>
    <footer class="toy-game__footer">
      <label v-if="canStart" class="toy-game__memory">
        <input type="checkbox" :checked="props.state.memory" :disabled="props.reducedMotion || !props.ready" @change="emit('memory', ($event.target as HTMLInputElement).checked)">
        {{ localize(copy.memory, props.locale) }}
      </label>
      <p v-else class="toy-game__hint">{{ localize(copy.keyboard, props.locale) }}</p>
      <button v-if="canStart" type="button" class="toy-game__primary" data-primary :disabled="!props.ready" @click="emit('start')">{{ localize(props.state.phase === 'result' ? copy.replay : copy.start, props.locale) }} <span aria-hidden="true">↗</span></button>
      <button v-else-if="props.state.phase === 'showing'" type="button" class="toy-game__primary" data-primary :disabled="!props.ready" @click="emit('shuffle')">{{ localize(props.state.memory ? copy.hide : copy.shuffle, props.locale) }} <span aria-hidden="true">→</span></button>
    </footer>
  </section>
</template>

<style scoped>
.toy-game { position: absolute; z-index: 12; inset-inline: 1rem; inset-block-end: max(1rem, env(safe-area-inset-bottom)); max-inline-size: 35rem; margin-inline: auto; padding: 1.2rem 1.4rem; border: 1px solid #645270; border-radius: 1rem; background: #1b1422f5; color: #f1ecdf; box-shadow: 0 16px 55px #0006; outline: none; }
.toy-game__header { display: flex; justify-content: space-between; align-items: start; gap: 1rem; }
.toy-game__eyebrow { margin: 0 0 .35rem; color: #baa4ca; font: .62rem/1.2 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; }
.toy-game__title { margin: 0; font: 500 clamp(1.25rem, 2.5vw, 1.7rem)/1.1 var(--font-display); }
.toy-game__back { border: 0; background: transparent; color: #d5c8dd; min-height: 2.75rem; padding: .4rem; font-size: .7rem; }
.toy-game__status { min-height: 2.8em; margin: .85rem 0 .7rem; font-size: .85rem; line-height: 1.5; color: #ddd3e1; }
.toy-game__choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .6rem; }
.toy-game__choice { min-height: 3.5rem; display: flex; justify-content: center; align-items: center; gap: .65rem; padding: .5rem; border: 1px solid #80688c; border-radius: .5rem; background: #302039; color: #f1ecdf; font-size: .8rem; }
.toy-game__choice:disabled { cursor: default; opacity: .72; }
.toy-game__choice:not(:disabled):hover { background: #513262; border-color: #d2b3e8; }
.toy-game__choice.is-winning { border-color: #a3d283; background: #303e29; opacity: 1; }
.toy-game__choice.is-selected { outline: 2px solid #e7decf; outline-offset: 2px; }
.toy-game__symbol { font-size: 1.4rem; }
.toy-game__footer { display: flex; align-items: center; justify-content: space-between; gap: .8rem; min-height: 2.75rem; margin-top: .8rem; }
.toy-game__primary { display: flex; justify-content: space-between; gap: 1.5rem; min-height: 2.75rem; align-items: center; border: 0; border-radius: .4rem; padding: .7rem 1rem; background: #c9dba8; color: #222b1c; font-size: .8rem; }
.toy-game__primary:disabled { opacity: .5; }
.toy-game__memory, .toy-game__hint { display: flex; align-items: center; gap: .45rem; color: #c6b8d0; font-size: .68rem; line-height: 1.5; margin: 0; }
.toy-game__memory { min-height: 2.75rem; }
.toy-game__memory input { accent-color: #c9dba8; width: 1rem; height: 1rem; }
.toy-game button:focus-visible, .toy-game input:focus-visible { outline: 2px solid #dbedae; outline-offset: 3px; }
@media (max-width: 600px) { .toy-game { padding: .9rem; inset-inline: .6rem; } .toy-game__footer { gap: .5rem; } .toy-game__primary { gap: .7rem; padding-inline: .7rem; } .toy-game__back { max-width: 8rem; } }
@media (max-height: 560px) and (min-aspect-ratio: 1/1) { .toy-game { inset-inline-start: auto; width: 19rem; padding: .8rem; } .toy-game__status { margin-block: .5rem; } .toy-game__header { gap: .5rem; } .toy-game__title { font-size: 1.2rem; } }
</style>
