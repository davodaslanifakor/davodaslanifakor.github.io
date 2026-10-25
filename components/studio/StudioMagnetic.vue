<script setup lang="ts">
const element = useTemplateRef<HTMLElement>('element')
const { pointer } = useStudioMotion()
const spring = useStudioSpring((x, y) => {
  if (element.value) element.value.style.transform = `translate(${x}px, ${y}px)`
})
function move(event: PointerEvent) {
  if (!pointer.value || event.pointerType !== 'mouse') return
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  spring.move(
    Math.max(-10, Math.min(10, (event.clientX - bounds.x - bounds.width / 2) * 0.1)),
    Math.max(-8, Math.min(8, (event.clientY - bounds.y - bounds.height / 2) * 0.14)),
  )
}
watch(pointer, (value) => {
  if (!value) spring.reset()
})
</script>

<template>
  <span class="studio-magnetic" @pointermove="move" @pointerleave="pointer && spring.move(0, 0)"
    ><span ref="element" class="studio-magnetic-inner"><slot /></span
  ></span>
</template>
