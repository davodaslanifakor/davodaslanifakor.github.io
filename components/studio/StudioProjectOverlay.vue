<script setup lang="ts">
import { ArrowRight, ArrowUpRight, X } from '@lucide/vue'
import { studioProjects, studioCopy as copy } from '~/content/portfolio'
import StudioProjectVisual from './StudioProjectVisual.vue'
const props = defineProps<{ index: number }>()
const emit = defineEmits<{ close: []; next: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')
const project = computed(() => studioProjects[props.index]!)
const nextProject = computed(() => studioProjects[(props.index + 1) % studioProjects.length]!)
const { reduced } = useStudioMotion()
let previousOverflow = ''
let animation: Animation | undefined
let closing = false
async function close() {
  if (closing) return
  closing = true
  if (!reduced.value && dialog.value) {
    animation?.cancel()
    animation = dialog.value.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(.98)' },
      ],
      { duration: 180, easing: 'ease-out' },
    )
    await animation.finished.catch(() => {})
  }
  dialog.value?.close()
  emit('close')
}
watch(
  () => props.index,
  async () => {
    await nextTick()
    dialog.value?.scrollTo({ top: 0, behavior: 'instant' })
    closeButton.value?.focus({ preventScroll: true })
  },
)
onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
  closeButton.value?.focus()
  if (!reduced.value && dialog.value)
    animation = dialog.value.animate(
      [
        { opacity: 0, transform: 'translateY(18px) scale(.98)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' },
    )
})
onBeforeUnmount(() => {
  animation?.cancel()
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <dialog
    ref="dialog"
    class="studio-overlay"
    aria-labelledby="studio-project-title"
    @cancel.prevent="close"
  >
    <div class="studio-overlay-bar">
      <span>{{ project.company }}</span
      ><button ref="closeButton" type="button" class="studio-overlay-close" @click="close">
        {{ copy.close.en }}<X :size="20" aria-hidden="true" />
      </button>
    </div>
    <div :key="project.id" class="studio-container studio-overlay-body">
      <p class="studio-eyebrow">{{ project.category.en }}</p>
      <h2 id="studio-project-title">{{ project.title.en }}</h2>
      <dl class="studio-project-meta">
        <div>
          <dt>{{ copy.role.en }}</dt>
          <dd>{{ project.role.en }}</dd>
        </div>
        <div v-if="project.period">
          <dt>{{ copy.period.en }}</dt>
          <dd>{{ project.period }}</dd>
        </div>
        <div>
          <dt>{{ copy.platform.en }}</dt>
          <dd>{{ project.platform.en }}</dd>
        </div>
        <div>
          <dt>{{ copy.tools.en }}</dt>
          <dd>{{ project.tools.join(', ') }}</dd>
        </div>
      </dl>
      <StudioProjectVisual :project-id="project.id" />
      <p class="studio-visual-caption">{{ copy.visualLabel.en }}</p>
      <div class="studio-project-story">
        <section>
          <h3>{{ copy.challenge.en }}</h3>
          <p>{{ project.study.problem.en }}</p>
        </section>
        <section>
          <h3>{{ copy.approach.en }}</h3>
          <p>{{ project.study.action.en }}</p>
        </section>
        <section>
          <h3>{{ copy.outcome.en }}</h3>
          <p>{{ project.study.result.en }}</p>
        </section>
      </div>
      <div class="studio-project-sources">
        <a
          v-for="link in project.study.links"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          >{{ link.label }}<ArrowUpRight :size="18" aria-hidden="true"
        /></a>
      </div>
      <button type="button" class="studio-next-project" @click="emit('next')">
        <span
          >{{ copy.next.en }}<strong>{{ nextProject.title.en }}</strong></span
        ><ArrowRight :size="42" :stroke-width="1.2" aria-hidden="true" />
      </button>
    </div>
  </dialog>
</template>
