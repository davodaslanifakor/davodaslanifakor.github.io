<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { studioProjects, studioCopy as copy } from '~/content/portfolio'
import StudioProjectVisual from './StudioProjectVisual.vue'
import StudioReveal from './StudioReveal.vue'
import StudioEditorDemo from './StudioEditorDemo.vue'
const StudioProjectOverlay = defineAsyncComponent(
  () => import('./StudioProjectOverlay.vue'),
)
const { ready } = useStudioMotion()
const section = useTemplateRef<HTMLElement>('section')
// The flagship editor assembles as it arrives: the frame opens and the panels
// dock, so the first case reads as a working tool before any copy explains it.
useStudioScene(section, STUDIO_TABLET_UP, ({ gsap, root }) => {
  const frame = root.querySelector<HTMLElement>('.studio-project:not(.is-supporting) .studio-visual-button')
  if (!frame) return
  frame.dataset.assemble = ''
  gsap.fromTo(
    frame,
    { '--assemble': 1, clipPath: 'inset(10% 8% round 6px)' },
    {
      '--assemble': 0,
      clipPath: 'inset(0% 0% round 5px)',
      ease: 'none',
      scrollTrigger: {
        trigger: frame,
        start: 'top bottom',
        end: 'center 58%',
        scrub: STUDIO_SCRUB,
        refreshPriority: -1,
      },
    },
  )
  return () => delete frame.dataset.assemble
})
const selected = shallowRef<number | null>(null)
let opener: HTMLElement | null = null
function open(index: number, event: MouseEvent) {
  opener = event.currentTarget as HTMLElement
  selected.value = index
}
async function close() {
  selected.value = null
  await nextTick()
  opener?.focus({ preventScroll: true })
}
</script>

<template>
  <section id="work" ref="section" class="studio-work" tabindex="-1">
    <StudioReveal
      ><div class="studio-section-heading studio-container">
        <h2>{{ copy.selectedTitle.en }}</h2>
        <p>{{ copy.selectedIntro.en }}</p>
      </div></StudioReveal
    >
    <template v-for="(project, index) in studioProjects" :key="project.id">
      <article
        :id="`project-${project.id}`"
        class="studio-project studio-container"
        :class="{ 'is-supporting': index > 0 }"
        tabindex="-1"
      >
        <StudioReveal
          ><div class="studio-project-header">
            <span class="studio-project-number">0{{ index + 1 }}</span>
            <div>
              <p>{{ project.category.en }}</p>
              <h3>{{ project.title.en }}</h3>
            </div>
            <span class="studio-project-company">{{ project.company }}</span>
          </div></StudioReveal
        >
        <component
          :is="index === 0 ? 'div' : StudioReveal"
          v-bind="index === 0 ? {} : { variant: 'frame' }"
          ><button
            class="studio-visual-button"
            type="button"
            :disabled="!ready"
            :aria-label="`${copy.viewProject.en}: ${project.title.en}`"
            data-cursor="view"
            @click="open(index, $event)"
          >
            <StudioProjectVisual :project-id="project.id" interactive /><span
              class="studio-visual-open"
              ><ArrowUpRight :size="24" aria-hidden="true"
            /></span></button
        ></component>
        <div class="studio-project-bottom">
          <div>
            <p class="studio-project-summary">{{ project.summary.en }}</p>
            <p>{{ copy.visualLabel.en }}</p>
          </div>
          <button
            class="studio-text-link"
            type="button"
            :disabled="!ready"
            @click="open(index, $event)"
          >
            {{ copy.viewProject.en
            }}<ArrowUpRight :size="18" aria-hidden="true" />
          </button>
        </div>
        <div v-if="index === 0" class="studio-zo">
          <h4>{{ copy.zoTitle.en }}</h4>
          <p>{{ copy.zoBody.en }}</p>
        </div>
      </article>
      <StudioEditorDemo v-if="index === 0" />
    </template>
    <StudioProjectOverlay
      v-if="selected !== null"
      :index="selected"
      @close="close"
      @next="selected = (selected + 1) % studioProjects.length"
    />
  </section>
</template>
