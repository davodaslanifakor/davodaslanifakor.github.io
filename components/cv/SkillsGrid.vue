<script setup lang="ts">
import type { Locale, Skill } from '~/content/portfolio'
import { localize, skillGroups, skills, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
const groupIds: Skill['group'][] = ['core', 'fullstack', 'quality', 'ai']
const groups = groupIds.map(id => {
  const items = skills.filter(item => item.group === id)
  return { id, items, overview: items.map(item => item.name).join(' · ') }
})
</script>

<template>
  <section id="skills" class="section">
    <p class="section-number">03</p>
    <div class="section-body">
      <h2 class="section-title">{{ localize(ui.skills, props.locale) }}</h2>
      <div class="skill-groups">
        <details v-for="group in groups" :key="group.id" class="skill-group">
          <summary class="group-summary">
            <span class="group-title">{{ localize(skillGroups[group.id], props.locale) }} <span aria-hidden="true">+</span></span>
            <span class="skill-overview">{{ group.overview }}</span>
          </summary>
          <ul class="skill-list">
            <li v-for="skill in group.items" :key="skill.id" class="skill-item">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-use">{{ localize(skill.usedFor, props.locale) }}</span>
            </li>
          </ul>
        </details>
      </div>
    </div>
  </section>
</template>

<style scoped>
.skill-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 0 2rem; }
.skill-group { border-top: 1px solid var(--line); }
.group-summary { padding-block: 1.5rem; list-style: none; cursor: pointer; }
.group-summary::-webkit-details-marker { display: none; }
.group-title { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: var(--ink); font: 600 1rem/1.5 var(--font-display); }
.group-title span { color: var(--acid); font-weight: 400; font-size: 1.4rem; transition: transform 180ms ease; }
.skill-group[open] .group-title span { transform: rotate(45deg); }
.skill-overview { display: block; margin-top: .75rem; color: var(--muted); font-size: .9375rem; line-height: 1.8; }
.skill-list { display: grid; gap: 1.25rem; margin: 0; padding: 0 0 1.5rem; list-style: none; }
.skill-item { display: grid; gap: 0.3rem; }
.skill-name { font-size: 1rem; }
.skill-use { color: var(--muted); font-size: .9375rem; line-height: 1.6; }
@media (max-width: 640px) { .skill-groups { grid-template-columns: 1fr; } }
</style>
