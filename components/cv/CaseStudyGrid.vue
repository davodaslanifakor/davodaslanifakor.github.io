<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { caseStudies, localize, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
</script>

<template>
  <section id="work" class="section">
    <p class="section-number">04</p>
    <div class="section-body">
      <h2 class="section-title">{{ localize(ui.selectedWork, props.locale) }}</h2>
      <div class="cases">
        <article v-for="(item, index) in caseStudies" :key="item.id" class="case-card">
          <p class="case-index">{{ String(index + 1).padStart(2, '0') }}</p>
          <h3 class="case-title">{{ localize(item.title, props.locale) }}</h3>
          <dl class="case-details">
            <div>
              <dt>{{ localize(ui.problem, props.locale) }}</dt>
              <dd>{{ localize(item.problem, props.locale) }}</dd>
            </div>
            <div>
              <dt>{{ localize(ui.action, props.locale) }}</dt>
              <dd>{{ localize(item.action, props.locale) }}</dd>
            </div>
            <div>
              <dt>{{ localize(ui.result, props.locale) }}</dt>
              <dd>{{ localize(item.result, props.locale) }}</dd>
            </div>
          </dl>
          <p v-for="link in item.links ?? []" :key="link.href" class="case-link">
            <a :href="link.href" rel="noopener" target="_blank">{{ link.label }} ↗</a>
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cases { display: grid; gap: 1rem; }
.case-card { display: grid; grid-template-columns: 4rem minmax(12rem, 0.75fr) 1.5fr; gap: 1.5rem; border-top: 1px solid var(--line); padding: 1.5rem 0 2.5rem; }
.case-index { margin: 0; color: var(--acid); font: 0.72rem/1 var(--font-mono); }
.case-title { margin: 0; font: clamp(1.4rem, 2.3vw, 2.2rem)/1.05 var(--font-display); }
.case-details { display: grid; gap: 1.3rem; margin: 0; }
.case-details div { display: grid; grid-template-columns: 5rem 1fr; gap: 1rem; }
.case-details dt { color: var(--muted); font: 0.68rem/1.4 var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; }
.case-details dd { margin: 0; line-height: 1.55; }
.case-link { grid-column: 3; margin: 0; }
.case-link a { border-bottom: 1px solid var(--acid); color: var(--ink); text-decoration: none; }
.case-link a:hover { color: var(--acid); }
@media (max-width: 760px) { .case-card { grid-template-columns: 2rem 1fr; } .case-details,.case-link { grid-column: 2; } .case-details div { grid-template-columns: 1fr; gap: 0.4rem; } }
</style>
