<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, profile, ui } from '~/content/portfolio'

interface ElementState {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

const props = withDefaults(defineProps<{
  locale: Locale
  compact?: boolean
}>(), {
  compact: false,
})

const initial = (): ElementState => ({ x: 112, y: 64, width: 190, height: 56, rotation: -2 })
const textBox = reactive(initial())
const brandColor = shallowRef('#d8ff3e')
const interaction = reactive({ mode: '' as '' | 'drag' | 'resize' | 'rotate', startX: 0, startY: 0, origin: initial() })

const elementStyle = computed(() => ({
  left: `${textBox.x}px`,
  top: `${textBox.y}px`,
  width: `${textBox.width}px`,
  height: `${textBox.height}px`,
  transform: `rotate(${textBox.rotation}deg)`,
}))

const objectLabel = computed(() => `${localize(ui.editorObjectLabel, props.locale)} — ${localize(ui.editorKeyboardHint, props.locale)}`)

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/** Keyboard parity for the pointer-only drag/resize/rotate handles. */
function onKeydown(event: KeyboardEvent) {
  const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
  if (!isArrow && event.key !== '[' && event.key !== ']') return
  event.preventDefault()
  const nudge = event.shiftKey ? 2 : 8
  const rotStep = event.shiftKey ? 5 : 1

  if (event.ctrlKey || event.metaKey) {
    if (event.key === 'ArrowLeft') textBox.width = clamp(textBox.width - nudge, 120, 330)
    if (event.key === 'ArrowRight') textBox.width = clamp(textBox.width + nudge, 120, 330)
    if (event.key === 'ArrowUp') textBox.height = clamp(textBox.height - nudge, 42, 100)
    if (event.key === 'ArrowDown') textBox.height = clamp(textBox.height + nudge, 42, 100)
    return
  }

  if (event.key === '[') { textBox.rotation = clamp(textBox.rotation - rotStep, -25, 25); return }
  if (event.key === ']') { textBox.rotation = clamp(textBox.rotation + rotStep, -25, 25); return }

  const dx = event.key === 'ArrowLeft' ? -nudge : event.key === 'ArrowRight' ? nudge : 0
  const dy = event.key === 'ArrowUp' ? -nudge : event.key === 'ArrowDown' ? nudge : 0
  textBox.x = clamp(textBox.x + dx, 8, 410 - textBox.width)
  textBox.y = clamp(textBox.y + dy, 8, 246 - textBox.height)
}

function begin(event: PointerEvent, mode: 'drag' | 'resize' | 'rotate') {
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  interaction.mode = mode
  interaction.startX = event.clientX
  interaction.startY = event.clientY
  interaction.origin = { ...textBox }
}

function move(event: PointerEvent) {
  if (!interaction.mode) return
  const dx = event.clientX - interaction.startX
  const dy = event.clientY - interaction.startY
  if (interaction.mode === 'drag') {
    textBox.x = Math.max(8, Math.min(410 - textBox.width, interaction.origin.x + dx))
    textBox.y = Math.max(8, Math.min(246 - textBox.height, interaction.origin.y + dy))
  } else if (interaction.mode === 'resize') {
    textBox.width = Math.max(120, Math.min(330, interaction.origin.width + dx))
    textBox.height = Math.max(42, Math.min(100, interaction.origin.height + dy))
  } else {
    textBox.rotation = Math.max(-25, Math.min(25, interaction.origin.rotation + dx / 3))
  }
}

function end() {
  interaction.mode = ''
}

function reset() {
  Object.assign(textBox, initial())
  brandColor.value = '#d8ff3e'
}

function exportPng() {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 700
  const context = canvas.getContext('2d')
  if (!context) return

  context.fillStyle = '#f2efe8'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = brandColor.value
  context.fillRect(70, 70, 170, 170)
  context.fillStyle = '#101114'
  context.font = '700 54px system-ui'
  context.fillText('DF', 112, 175)
  context.save()
  context.translate((textBox.x + textBox.width / 2) * 2.75, (textBox.y + textBox.height / 2) * 2.75)
  context.rotate((textBox.rotation * Math.PI) / 180)
  context.fillStyle = '#101114'
  context.font = '700 48px system-ui'
  context.textAlign = 'center'
  context.fillText(profile.name.toUpperCase(), 0, 0)
  context.font = '24px monospace'
  context.fillText(localize(profile.role, props.locale).toUpperCase(), 0, 42)
  context.restore()
  context.fillStyle = brandColor.value
  context.fillRect(880, 500, 240, 90)

  const anchor = document.createElement('a')
  anchor.download = 'davoud-aslani-fakour-editor-demo.png'
  anchor.href = canvas.toDataURL('image/png')
  anchor.click()
}
</script>

<template>
  <section class="editor-shell" :class="{ 'editor-shell--compact': props.compact }" aria-labelledby="editor-title">
    <div class="editor-toolbar">
      <div>
        <p class="editor-label">{{ localize(ui.editorTechnology, props.locale) }}</p>
        <h2 id="editor-title" class="editor-title">{{ localize(ui.editorTitle, props.locale) }}</h2>
      </div>
      <div class="editor-actions">
        <label class="color-control">
          <span>{{ localize(ui.brandColor, props.locale) }}</span>
          <input v-model="brandColor" type="color">
        </label>
        <button type="button" @click="reset">{{ localize(ui.reset, props.locale) }}</button>
        <button class="export" type="button" @click="exportPng">{{ localize(ui.exportPng, props.locale) }}</button>
      </div>
    </div>

    <div class="workspace">
      <div class="page" :style="{ '--brand': brandColor }">
        <div class="logo">DF</div>
        <div
          class="editable"
          :style="elementStyle"
          tabindex="0"
          role="group"
          :aria-label="objectLabel"
          @keydown="onKeydown"
          @pointerdown="begin($event, 'drag')"
          @pointermove="move"
          @pointerup="end"
          @pointercancel="end"
        >
          <strong>{{ profile.name.toUpperCase() }}</strong>
          <span>{{ localize(profile.role, props.locale).toUpperCase() }}</span>
          <button class="handle resize" type="button" tabindex="-1" aria-hidden="true" @pointerdown.stop="begin($event, 'resize')" @pointermove="move" @pointerup="end" />
          <button class="handle rotate" type="button" tabindex="-1" aria-hidden="true" @pointerdown.stop="begin($event, 'rotate')" @pointermove="move" @pointerup="end">↻</button>
        </div>
        <div class="brand-shape" />
      </div>
      <aside class="editor-note">
        <p>{{ localize(ui.editorIntro, props.locale) }}</p>
        <p class="note-meta">{{ localize(ui.editorInstructions, props.locale) }}</p>
        <p class="note-meta note-keys">{{ localize(ui.editorKeyboardHint, props.locale) }}</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.editor-shell { display: grid; min-height: 0; height: 100%; grid-template-rows: auto 1fr; background: #14171b; color: #f4f1e9; }
.editor-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #333940; padding: 0.9rem 1rem; }
.editor-label,.editor-title { margin: 0; }
.editor-label { color: #8c949d; font: 0.62rem/1.2 var(--font-mono); letter-spacing: 0.1em; }
.editor-title { margin-top: 0.25rem; font: 1rem/1.2 var(--font-display); }
.editor-actions { display: flex; align-items: center; gap: 0.5rem; }
.editor-actions button,.color-control { min-height: 2.4rem; border: 1px solid #3b424a; border-radius: 0.4rem; padding: 0.55rem 0.75rem; background: #1b1f24; color: #f4f1e9; font-size: 0.75rem; }
.editor-actions .export { border-color: var(--brand, #d8ff3e); background: #d8ff3e; color: #101114; }
.color-control { display: flex; align-items: center; gap: 0.5rem; }
.color-control input { width: 1.35rem; height: 1.35rem; border: 0; padding: 0; background: transparent; }
.workspace { display: grid; min-height: 0; grid-template-columns: 1fr minmax(12rem, 18rem); align-items: center; gap: 1.5rem; overflow: auto; padding: 2rem; background: #0c0e11; }
.page { position: relative; width: 420px; height: 246px; margin: auto; overflow: hidden; background: #f2efe8; color: #101114; box-shadow: 0 24px 80px rgb(0 0 0 / 44%); touch-action: none; }
.logo { position: absolute; top: 22px; left: 22px; display: grid; width: 56px; height: 56px; place-items: center; background: var(--brand); font: 700 1.2rem/1 var(--font-display); }
.editable { position: absolute; display: grid; place-content: center; border: 1px solid #246bfe; text-align: center; cursor: move; user-select: none; touch-action: none; }
.editable:focus-visible { outline: 2px solid #246bfe; outline-offset: 3px; }
.editable strong { font: 700 1.05rem/1 var(--font-display); letter-spacing: 0.02em; }
.editable span { margin-top: 0.45rem; font: 0.48rem/1 var(--font-mono); letter-spacing: 0.1em; }
.handle { position: absolute; display: grid; width: 18px; height: 18px; place-items: center; border: 1px solid #246bfe; border-radius: 50%; padding: 0; background: #fff; color: #246bfe; font-size: 0.68rem; touch-action: none; }
.resize { right: -9px; bottom: -9px; border-radius: 0; cursor: nwse-resize; }
.rotate { top: -28px; left: calc(50% - 9px); cursor: grab; }
.brand-shape { position: absolute; right: -34px; bottom: -42px; width: 150px; height: 120px; transform: rotate(-12deg); background: var(--brand); }
.editor-note { align-self: stretch; border-inline-start: 1px solid #30343a; padding: 1rem 0 1rem 1.5rem; color: #c4c8cc; line-height: 1.55; }
.editor-note p { margin: 0; }
.note-meta { margin-top: 1.2rem !important; color: #7f878f; font-size: 0.78rem; }
.note-keys { color: #9aa3ac; }
.editor-shell--compact .editor-toolbar { padding: .65rem .8rem; }
.editor-shell--compact .workspace { grid-template-columns: 1fr 13rem; gap: .8rem; padding: .8rem; }
.editor-shell--compact .editor-note { padding: .7rem 0 .7rem 1rem; font-size: .78rem; }
@media (max-width: 760px) { .editor-toolbar { align-items: flex-start; flex-direction: column; } .workspace { grid-template-columns: 1fr; padding: 1rem; } .page { transform: scale(.78); margin: -1.5rem auto; } .editor-note { border-inline-start: 0; border-top: 1px solid #30343a; padding: 1rem 0; } .color-control span { display: none; } }
</style>
