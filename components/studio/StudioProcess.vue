<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { studioCopy as copy } from '~/content/portfolio'
import StudioReveal from './StudioReveal.vue'
const active = shallowRef(0)
const { pointer, ready } = useStudioMotion()
function hover(index: number) {
  if (pointer.value) active.value = index
}
</script>

<template>
  <section class="studio-process studio-container" aria-labelledby="studio-process-title">
    <StudioReveal
      ><div class="studio-section-heading">
        <h2 id="studio-process-title">{{ copy.processTitle.en }}</h2>
        <p>{{ copy.processIntro.en }}</p>
      </div></StudioReveal
    >
    <div class="studio-process-layout">
      <div class="studio-process-steps">
        <button
          v-for="(step, index) in copy.process"
          :key="step.title.en"
          type="button"
          :disabled="!ready"
          :aria-pressed="active === index"
          aria-controls="studio-process-detail"
          @click="active = index"
          @focus="active = index"
          @pointerenter="hover(index)"
        >
          <span>0{{ index + 1 }}</span
          ><strong>{{ step.title.en }}</strong
          ><ArrowUpRight :size="24" aria-hidden="true" />
        </button>
      </div>
      <div
        id="studio-process-detail"
        class="studio-process-detail"
        aria-live="polite"
        aria-atomic="true"
      >
        <div :key="active" class="studio-process-copy">
          <p>{{ copy.process[active]!.body.en }}</p>
          <div class="studio-process-fragments">
            <span v-for="(fragment, index) in copy.process[active]!.fragment" :key="fragment"
              ><i>0{{ index + 1 }}</i
              >{{ fragment }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
