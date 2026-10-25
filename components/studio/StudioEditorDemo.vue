<script setup lang="ts">
import { Download, RotateCcw } from '@lucide/vue'
import { portfolioBrand, studioCopy as copy } from '~/content/portfolio'
import StudioReveal from './StudioReveal.vue'
const { ready } = useStudioMotion()
const canvas = useTemplateRef<HTMLElement>('canvas')
const name = shallowRef(copy.demoName.en)
const color = shallowRef(0)
const position = reactive({ x: 0, y: 0 })
const palette = portfolioBrand.palette
const selectedColor = computed(() => palette[color.value]!)
let drag: {
  id: number
  x: number
  y: number
  originX: number
  originY: number
} | null = null
function clamp(value: number, limit: number) {
  return Math.max(-limit, Math.min(limit, value))
}
function start(event: PointerEvent) {
  if (event.button !== 0 || drag) return
  const target = event.currentTarget as HTMLElement
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    originX: position.x,
    originY: position.y,
  }
  target.setPointerCapture(event.pointerId)
}
function move(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id || !canvas.value) return
  const bounds = canvas.value.getBoundingClientRect()
  position.x = clamp(
    drag.originX + ((event.clientX - drag.x) / bounds.width) * 100,
    15,
  )
  position.y = clamp(
    drag.originY + ((event.clientY - drag.y) / bounds.height) * 100,
    24,
  )
}
function stop() {
  drag = null
}
function keyboard(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
    return
  event.preventDefault()
  const step = event.shiftKey ? 0.5 : 2
  position.x = clamp(
    position.x +
      (event.key === 'ArrowLeft'
        ? -step
        : event.key === 'ArrowRight'
          ? step
          : 0),
    15,
  )
  position.y = clamp(
    position.y +
      (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0),
    24,
  )
}
function reset() {
  name.value = copy.demoName.en
  color.value = 0
  position.x = position.y = 0
}
async function save() {
  await document.fonts.ready
  if (!canvas.value) return
  const image = document.createElement('canvas')
  image.width = 1200
  image.height = 800
  const context = image.getContext('2d')
  if (!context) return
  context.fillStyle = selectedColor.value.background
  context.fillRect(0, 0, 1200, 800)
  // Read line positions from the real card so wrapped text and dragged positions
  // export as shown at every viewport size. No DOM-to-image dependency required.
  const bounds = canvas.value.getBoundingClientRect()
  const scale = image.width / bounds.width
  const labels = canvas.value.querySelectorAll<HTMLElement>(
    '.studio-canvas-label,.studio-editable-text>span,.studio-canvas-subline',
  )
  for (const label of labels) {
    const style = getComputedStyle(label)
    const node = label.firstChild
    if (!node || node.nodeType !== Node.TEXT_NODE) continue
    const range = document.createRange()
    const lines: { text: string; x: number; y: number; height: number }[] = []
    Array.from(node.textContent ?? '').reduce((offset, char) => {
      range.setStart(node, offset)
      range.setEnd(node, offset + char.length)
      const rect = range.getBoundingClientRect()
      const previous = lines.at(-1)
      if (previous && Math.abs(previous.y - rect.y) < 1) previous.text += char
      else lines.push({ text: char, x: rect.x, y: rect.y, height: rect.height })
      return offset + char.length
    }, 0)
    context.fillStyle = style.color
    context.font = `${style.fontWeight} ${parseFloat(style.fontSize) * scale}px ${style.fontFamily}`
    context.letterSpacing = `${(parseFloat(style.letterSpacing) || 0) * scale}px`
    context.textBaseline = 'middle'
    context.textAlign = 'left'
    for (const line of lines)
      context.fillText(
        line.text,
        (line.x - bounds.x) * scale,
        (line.y - bounds.y + line.height / 2) * scale,
      )
  }
  image.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'davoud-fakour-studio.png'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
}
</script>

<template>
  <section id="playground" class="studio-playground studio-container">
    <StudioReveal
      ><div class="studio-section-heading">
        <h2>{{ copy.demoTitle.en }}</h2>
        <p>{{ copy.demoIntro.en }}</p>
      </div></StudioReveal
    >
    <StudioReveal variant="frame"
      ><div class="studio-editor">
        <div class="studio-editor-canvas-wrap">
          <div
            ref="canvas"
            class="studio-editor-canvas"
            :style="{
              backgroundColor: selectedColor.background,
              color: selectedColor.foreground,
            }"
          >
            <span class="studio-canvas-label">{{ copy.studioLabel.en }}</span>
            <div
              class="studio-editable-text"
              tabindex="0"
              role="group"
              :aria-label="copy.canvasHint.en"
              data-cursor="drag"
              :style="{
                transform: `translate(${position.x}cqw, ${(position.y * 2) / 3}cqw)`,
              }"
              @pointerdown="start"
              @pointermove="move"
              @pointerup="stop"
              @pointercancel="stop"
              @lostpointercapture="stop"
              @keydown="keyboard"
            >
              <span>{{ name || copy.demoName.en }}</span
              ><i /><i /><i /><i />
            </div>
            <span class="studio-canvas-subline">{{ copy.demoSubline.en }}</span>
          </div>
          <p class="studio-demo-hint">{{ copy.canvasHint.en }}</p>
        </div>
        <div class="studio-editor-controls">
          <label for="studio-name">{{ copy.nameLabel.en }}</label
          ><input
            id="studio-name"
            v-model="name"
            maxlength="24"
            type="text"
            autocomplete="off"
            :disabled="!ready"
          >
          <fieldset>
            <legend>{{ copy.colorLabel.en }}</legend>
            <div class="studio-swatches">
              <button
                v-for="(swatch, index) in palette"
                :key="swatch.background"
                type="button"
                :disabled="!ready"
                :style="{ '--swatch': swatch.background }"
                :aria-label="swatch.name.en"
                :aria-pressed="color === index"
                @click="color = index"
              >
                <span />
              </button>
            </div>
          </fieldset>
          <div class="studio-editor-buttons">
            <button type="button" :disabled="!ready" @click="reset">
              <RotateCcw :size="17" aria-hidden="true" />{{
                copy.reset.en
              }}</button
            ><button type="button" :disabled="!ready" @click="save">
              <Download :size="17" aria-hidden="true" />{{ copy.export.en }}
            </button>
          </div>
          <p>{{ copy.demoCaption.en }}</p>
        </div>
      </div></StudioReveal
    >
  </section>
</template>
