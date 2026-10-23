<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { localize, roles, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <section id="experience" class="section">
    <p class="section-number">02</p>
    <div class="section-body">
      <h2 class="section-title">{{ localize(ui.experience, props.locale) }}</h2>
      <ol class="timeline">
        <li v-for="role in roles" :key="role.id" class="role-row">
          <div class="company-block">
            <h3 class="company">{{ role.company }}</h3>
            <p v-if="role.period !== 'TODO(David)'" class="period">{{ role.period }}</p>
          </div>
          <div>
            <p class="title">{{ localize(role.title, props.locale) }}</p>
            <p class="receipt">{{ localize(role.receipt, props.locale) }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.timeline { margin: 0; padding: 0; list-style: none; }
.role-row { display: grid; grid-template-columns: minmax(9rem, 0.7fr) minmax(0, 1.5fr); gap: 2rem; border-top: 1px solid var(--line); padding: 1.75rem 0 2rem; }
.company,.title,.receipt,.period { margin: 0; }
.company { color: var(--cv-heading-ink); font: 600 1.125rem/1.4 var(--font-display); }
.period { margin-top: .5rem; color: var(--muted); font: .8125rem/1.5 var(--font-display); }
.title { color: var(--ink); font: 500 .9375rem/1.6 var(--font-display); text-wrap: pretty; }
.receipt { max-width: 58ch; margin-top: .75rem; color: var(--muted); font-size: 1rem; line-height: 1.65; }
@media (max-width: 640px) { .role-row { grid-template-columns: 1fr; gap: .75rem; } }
</style>
