<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { skills, studioCopy as copy } from '~/content/portfolio'
import StudioReveal from './StudioReveal.vue'
const groups = copy.capabilityGroups.map((group) => ({
  ...group,
  skills: group.ids.map((id) => skills.find((skill) => skill.id === id)!),
}))
const active = shallowRef(skills[0]!)
const { ready } = useStudioMotion()
</script>

<template>
  <section class="studio-capabilities studio-container" aria-labelledby="studio-capabilities-title">
    <StudioReveal
      ><div class="studio-section-heading">
        <h2 id="studio-capabilities-title">{{ copy.capabilitiesTitle.en }}</h2>
        <p>{{ copy.capabilityHint.en }}</p>
      </div></StudioReveal
    >
    <div class="studio-capability-layout">
      <div class="studio-capability-groups">
        <div v-for="group in groups" :key="group.title.en">
          <h3>{{ group.title.en }}</h3>
          <div class="studio-capability-tags">
            <button
              v-for="skill in group.skills"
              :key="skill.id"
              :aria-pressed="active.id === skill.id"
              type="button"
              :disabled="!ready"
              @click="active = skill"
            >
              {{ skill.name }}<ArrowUpRight :size="14" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <div class="studio-capability-detail" aria-live="polite" aria-atomic="true">
        <span>{{ active.name }}</span>
        <p :key="active.id">{{ active.usedFor.en }}</p>
      </div>
    </div>
  </section>
</template>
