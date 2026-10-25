<script setup lang="ts">
import { Download, ArrowUpRight } from '@lucide/vue'
import { studioCopy as copy, studioResume } from '~/content/portfolio'
import StudioMagnetic from './StudioMagnetic.vue'
import StudioProjectSpotlight from './StudioProjectSpotlight.vue'
import StudioHeadline from './StudioHeadline.vue'
const hero = useTemplateRef<HTMLElement>('hero')
const layer = useTemplateRef<HTMLElement>('layer')
const { pointer } = useStudioMotion()
// The hero holds (sticky stack) while the career surface rises over it; it steps
// back, the copy recedes, and the editor card lifts faster than the copy.
useStudioScene(
  hero,
  '(prefers-reduced-motion: no-preference)',
  ({ gsap, root }) => {
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: STUDIO_SCRUB,
          refreshPriority: -1,
        },
      })
      .to(root, { scale: 0.94, transformOrigin: '50% 0%' }, 0)
      .to(
        ['.studio-eyebrow', 'h1', '.studio-hero-intro'],
        { y: -56, opacity: 0.25, stagger: 0.04 },
        0,
      )
      .to('.studio-hero-preview', { y: -150 }, 0)
  },
)
const spring = useStudioSpring((x, y) => {
  const layers =
    layer.value?.querySelectorAll<HTMLElement>(
      '.visual-main,.visual-satellite',
    ) ?? []
  layers.forEach((element, index) => {
    const factor = [0.65, 1.1, 1.5][index] ?? 1
    element.style.transform = `translate3d(${x * factor}px,${y * factor}px,0) rotate(${[-3, 4, 5][index] ?? 0}deg)`
  })
})
function move(event: PointerEvent) {
  if (!pointer.value || event.pointerType !== 'mouse') return
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  spring.move(
    (event.clientX - bounds.x - bounds.width / 2) * 0.025,
    (event.clientY - bounds.y - bounds.height / 2) * 0.025,
  )
}
watch(pointer, (value) => {
  if (!value) spring.reset()
})
</script>

<template>
  <section
    ref="hero"
    class="studio-hero studio-container"
    @pointermove="move"
    @pointerleave="pointer && spring.move(0, 0)"
  >
    <p class="studio-eyebrow">{{ copy.heroEyebrow.en }}</p>
    <StudioHeadline />
    <div class="studio-hero-bottom">
      <div class="studio-hero-intro">
        <p>{{ copy.heroIntro.en }}</p>
        <div class="studio-hero-actions">
          <StudioMagnetic
            ><a class="studio-primary" :href="studioResume" download="Davoud_Aslani_Fakour_Resume.pdf"
              >{{ copy.downloadCv.en
              }}<Download :size="20" aria-hidden="true" /></a
          ></StudioMagnetic>
          <a class="studio-text-link" href="#contact"
            >{{ copy.contact.en }}<ArrowUpRight :size="18" aria-hidden="true"
          /></a>
        </div>
      </div>
      <div ref="layer" class="studio-hero-preview studio-hero-layer">
        <StudioProjectSpotlight />
      </div>
    </div>
  </section>
</template>
