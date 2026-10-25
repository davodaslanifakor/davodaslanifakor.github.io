<script setup lang="ts">
/** Copy rises; visuals open from an inset frame. Plays once, only for content that starts below the fold. */
const props = withDefaults(
  defineProps<{ delay?: number; variant?: 'rise' | 'frame' }>(),
  { delay: 0, variant: 'rise' },
)
const element = useTemplateRef<HTMLElement>('element')
const { reduced } = useStudioMotion()
const frames: Record<'rise' | 'frame', Keyframe[]> = {
  rise: [
    { opacity: 0, transform: 'translateY(32px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  frame: [
    { clipPath: 'inset(9% 7% round 6px)', transform: 'scale(1.02)' },
    { clipPath: 'inset(0% 0% round 0px)', transform: 'scale(1)' },
  ],
}
let observer: IntersectionObserver | undefined
let animation: Animation | undefined
let settled = false
function settle() {
  settled = true
  observer?.disconnect()
  if (element.value) delete element.value.dataset.reveal
}
function observe() {
  observer?.disconnect()
  if (!element.value || reduced.value || settled) return
  let first = true
  observer = new IntersectionObserver(
    ([entry]) => {
      const el = element.value
      if (!entry || !el) return
      // Already on screen at mount: never hide what the visitor can see.
      if (first && entry.isIntersecting) return settle()
      first = false
      if (!entry.isIntersecting) {
        el.dataset.reveal = props.variant
        return
      }
      settle()
      animation = el.animate(frames[props.variant], {
        duration: props.variant === 'frame' ? 1100 : 800,
        delay: props.delay,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'backwards',
      })
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  observer.observe(element.value)
}
onMounted(observe)
// The provider reads media preferences after its children mount.
watch(reduced, (value) => {
  if (!value) return observe()
  observer?.disconnect()
  animation?.cancel()
  if (element.value) delete element.value.dataset.reveal
})
onBeforeUnmount(() => {
  observer?.disconnect()
  animation?.cancel()
})
</script>

<template>
  <div ref="element" class="studio-reveal"><slot /></div>
</template>
