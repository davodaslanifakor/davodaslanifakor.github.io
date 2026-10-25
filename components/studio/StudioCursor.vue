<script setup lang="ts">
import { studioCopy as copy } from '~/content/portfolio'
const element = useTemplateRef<HTMLElement>('element')
const { pointer } = useStudioMotion()
const label = shallowRef('')
const visible = shallowRef(false)
const spring = useStudioSpring((x, y) => {
  if (element.value) element.value.style.transform = `translate3d(${x + 16}px,${y + 16}px,0)`
})
function move(event: PointerEvent) {
  if (!pointer.value || event.pointerType !== 'mouse') {
    visible.value = false
    return
  }
  const target = event.target instanceof Element ? event.target : null
  const action = target?.closest<HTMLElement>('[data-cursor],a,button')
  if (target?.closest('input,textarea,dialog')) {
    hide()
    return
  }
  const mode = action?.dataset.cursor
  label.value =
    mode === 'play'
      ? copy.cursorPlay.en
      : mode === 'view'
      ? copy.cursorView.en
      : mode === 'drag'
        ? copy.cursorDrag.en
        : action
          ? copy.cursorOpen.en
          : ''
  if (visible.value) spring.move(event.clientX, event.clientY)
  else spring.snap(event.clientX, event.clientY)
  visible.value = true
}
function hide() {
  visible.value = false
  spring.reset()
}
watch(pointer, (value) => {
  if (!value) hide()
})
onMounted(() => {
  window.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerleave', hide)
  window.addEventListener('blur', hide)
  window.addEventListener('keydown', hide)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', move)
  document.removeEventListener('pointerleave', hide)
  window.removeEventListener('blur', hide)
  window.removeEventListener('keydown', hide)
})
</script>

<template>
  <div
    ref="element"
    class="studio-cursor"
    :class="{ 'is-visible': visible && pointer, 'has-label': label }"
    aria-hidden="true"
  >
    {{ label }}<span v-if="label">↗</span>
  </div>
</template>
