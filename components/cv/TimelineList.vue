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
            <p class="period">{{ role.period === 'TODO(David)' ? localize(ui.periodPending, props.locale) : role.period }}</p>
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
.role-row { display: grid; grid-template-columns: minmax(10rem, 0.7fr) 1.5fr; gap: 2rem; border-top: 1px solid var(--line); padding: 1.5rem 0 2.5rem; }
.company,.title,.receipt,.period { margin: 0; }
.company { font: 1.25rem/1.2 var(--font-display); }
.period { margin-top: 0.5rem; color: var(--muted); font: 0.7rem/1.3 var(--font-mono); text-transform: uppercase; }
.title { color: var(--acid); font: 0.74rem/1.35 var(--font-mono); letter-spacing: 0.05em; text-transform: uppercase; }
.receipt { max-width: 43rem; margin-top: 0.85rem; font-size: 1.1rem; line-height: 1.55; }
@media (max-width: 640px) { .role-row { grid-template-columns: 1fr; gap: 1.1rem; } }
</style>
