<script setup lang="ts">
import { studioBrandMark } from '~/content/studioBrandMark'

const root = useTemplateRef<HTMLElement>('root')
useStudioScene(root, '(prefers-reduced-motion: no-preference)', ({ gsap, root }) => {
  const paths = root.querySelectorAll<SVGPathElement>('path')
  paths.forEach(path => {
    const length = path.getTotalLength()
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, strokeOpacity: 1, fillOpacity: 0 })
  })
  gsap.timeline({ scrollTrigger: { trigger: root, start: 'top bottom', once: true } })
    .to(paths, { strokeDashoffset: 0, duration: 1.6, stagger: { amount: 0.6 }, ease: 'power2.inOut' })
    .to(paths, { fillOpacity: 1, strokeOpacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.35')
  return undefined
})
</script>

<template>
  <span ref="root" class="studio-footer-mark" aria-hidden="true">
    <svg viewBox="0 0 392 400" width="64" height="64" focusable="false">
      <path v-for="(path, index) in studioBrandMark" :key="index" :d="path.d" :style="{ '--path-ink': path.color }" />
    </svg>
  </span>
</template>

<style scoped>
.studio-footer-mark { display: inline-flex; width: 64px; color: #fff; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
path { fill: var(--footer-mark-ink, var(--path-ink)); stroke: var(--footer-mark-ink, var(--path-ink)); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; stroke-opacity: 0; }
</style>
