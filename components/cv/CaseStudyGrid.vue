<script setup lang="ts">
import type { Locale } from '~/content/portfolio'
import { caseStudies, cvPresentation, localize, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
const orderedCases = [...caseStudies].sort((a, b) => Number(b.id === 'monitor') - Number(a.id === 'monitor'))
</script>

<template>
  <section id="work" class="section">
    <p class="section-number">01</p>
    <div class="section-body">
      <h2 class="section-title">{{ localize(ui.selectedWork, props.locale) }}</h2>
      <div class="cases">
        <details v-for="(item, index) in orderedCases" :key="item.id" class="case-card">
          <summary class="case-summary">
            <span class="case-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="case-overview">
              <span class="case-title">{{ localize(item.title, props.locale) }}</span>
              <span class="case-excerpt">{{ localize(cvPresentation.caseSummaries[item.id] ?? item.problem, props.locale) }}</span>
            </span>
            <span class="case-toggle" aria-hidden="true">+</span>
          </summary>
          <div class="case-expanded">
          <h3 class="sr-only">{{ localize(item.title, props.locale) }}</h3>
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
          </div>
        </details>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cases { border-top: 1px solid var(--line); }
.case-card { border-bottom: 1px solid var(--line); }
.case-summary { display: grid; grid-template-columns: 2rem minmax(0, 1fr) 1.5rem; align-items: start; gap: 1.25rem; padding-block: 1.75rem; list-style: none; cursor: pointer; }
.case-summary::-webkit-details-marker { display: none; }
.case-index { padding-top: .4rem; color: var(--muted); font: .75rem/1.5 var(--font-display); font-variant-numeric: tabular-nums; }
.case-overview { display: grid; gap: .6rem; }
.case-title { font: 600 clamp(1.125rem, 1.8vw, 1.5rem)/1.35 var(--font-display); letter-spacing: -.015em; text-wrap: pretty; }
.case-excerpt { max-width: 58ch; color: var(--muted); font-size: .9375rem; line-height: 1.6; }
.case-toggle { color: var(--acid); font: 400 1.5rem/1.2 var(--font-display); transition: transform 180ms ease; }
.case-card[open] .case-toggle { transform: rotate(45deg); }
.case-card[open] { border-color: var(--cv-accent-border); }
.case-summary:hover .case-title,.case-summary:focus-visible .case-title,.case-card[open] .case-title { color: var(--acid); }
.case-expanded { padding: 1.5rem 2.75rem 2rem 3.25rem; background: var(--cv-detail-surface); color: var(--cv-detail-ink); }
.case-details { display: grid; gap: 1.25rem; margin: 0; }
.case-details div { display: grid; grid-template-columns: 4.5rem minmax(0, 1fr); gap: 1rem; }
.case-details dt { color: var(--acid); font: 500 .8125rem/1.6 var(--font-display); }
.case-details dd { max-width: 62ch; margin: 0; font-size: 1rem; line-height: 1.65; }
.case-link { margin: 1.5rem 0 0; font-size: .875rem; line-height: 1.6; }
.case-link a { border-bottom: 1px solid var(--acid); color: var(--acid); text-decoration: none; }
.case-link a:hover { color: var(--acid); }
@media (max-width: 640px) {
  .case-summary { grid-template-columns: minmax(0, 1fr) 1.25rem; gap: .75rem; padding-block: 1.5rem; }
  .case-index { display: none; }
  .case-excerpt { font-size: .9375rem; }
  .case-expanded { padding: 1.25rem 1rem 1.75rem; }
  .case-details div { grid-template-columns: 1fr; gap: .4rem; }
}
</style>
