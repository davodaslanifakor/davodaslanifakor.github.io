<script setup lang="ts">
import type { Locale, Skill } from '~/content/portfolio'
import { localize, skillGroups, skills, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
const groups: Skill['group'][] = ['core', 'fullstack', 'quality', 'ai']
</script>

<template>
  <section id="skills" class="section">
    <p class="section-number">03</p>
    <div class="section-body">
      <h2 class="section-title">{{ localize(ui.skills, props.locale) }}</h2>
      <div class="skill-groups">
        <article v-for="group in groups" :key="group" class="skill-group">
          <h3 class="group-title">{{ localize(skillGroups[group], props.locale) }}</h3>
          <ul class="skill-list">
            <li v-for="skill in skills.filter((item) => item.group === group)" :key="skill.id" class="skill-item">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-use">{{ localize(skill.usedFor, props.locale) }}</span>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.skill-groups { display: grid; grid-template-columns: repeat(2, 1fr); border-top: 1px solid var(--line); border-inline-start: 1px solid var(--line); }
.skill-group { padding: 1.5rem; border-inline-end: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.group-title { margin: 0 0 2rem; color: var(--acid); font: 0.75rem/1.3 var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; }
.skill-list { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }
.skill-item { display: grid; gap: 0.3rem; }
.skill-name { font-size: 1.08rem; }
.skill-use { color: var(--muted); font-size: 0.88rem; line-height: 1.45; }
@media (max-width: 640px) { .skill-groups { grid-template-columns: 1fr; } }
</style>
