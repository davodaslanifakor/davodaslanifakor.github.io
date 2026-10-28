<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpRight, Quote } from '@lucide/vue'
import { studioRecommendations as recommendations, studioRecommendationCopy as copy } from '~/content/portfolio'
import { useStudioRecommendations } from '~/composables/useStudioRecommendations'

const section = useTemplateRef<HTMLElement>('section')
const { active, layout, listMode, ready, goTo, onTrackScroll, toggleList } = useStudioRecommendations(section, recommendations.length)
const currentLabel = computed(() => `${String(active.value + 1).padStart(2, '0')} / ${recommendations.length}`)
const failedAvatars = shallowRef(new Set<string>())
const initials = (name: string) => name.split(' ').map(part => part[0]).join('').slice(0, 2)
function hideAvatar(id: string) {
  failedAvatars.value = new Set([...failedAvatars.value, id])
}
const dates = recommendations.map(item => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(item.date)))
</script>

<template>
  <section id="recommendations" ref="section" class="studio-recommendations" :data-layout="layout" aria-labelledby="recommendations-title">
    <div class="recommendation-frame">
      <div class="recommendation-orbit" aria-hidden="true">
        <div class="recommendation-sphere">
          <svg class="recommendation-sphere-grid" viewBox="0 0 1000 1000" fill="none">
            <circle cx="500" cy="500" r="498" />
            <g transform="rotate(-24 500 500)">
              <ellipse cx="500" cy="500" rx="170" ry="498" />
              <ellipse cx="500" cy="500" rx="360" ry="498" />
              <ellipse cx="500" cy="500" rx="498" ry="160" />
              <ellipse cx="500" cy="500" rx="498" ry="350" />
            </g>
          </svg>
        </div>
      </div>
      <header class="recommendation-heading">
        <h2 id="recommendations-title">{{ copy.title.en }}</h2>
        <p>{{ copy.intro.en }}</p>
        <a class="studio-text-link" :href="copy.url" target="_blank" rel="noopener noreferrer">{{ copy.all.en }}<ArrowUpRight :size="16" aria-hidden="true" /></a>
      </header>
      <div v-if="ready" class="recommendation-controls">
        <div v-if="layout !== 'list'" class="recommendation-step-controls">
          <button type="button" :aria-label="copy.previous.en" :disabled="active === 0" @click="goTo(active - 1)"><ArrowUp :size="20" aria-hidden="true" /></button>
          <span class="recommendation-count" role="status" aria-live="polite" aria-atomic="true">{{ currentLabel }}</span>
          <button type="button" :aria-label="copy.next.en" :disabled="active === recommendations.length - 1" @click="goTo(active + 1)"><ArrowDown :size="20" aria-hidden="true" /></button>
        </div>
        <p v-if="layout === 'wheel'" class="recommendation-hint">{{ copy.hint.en }}</p>
        <button class="recommendation-list-toggle" type="button" :aria-pressed="listMode" @click="toggleList">{{ listMode ? copy.wheel.en : copy.list.en }}</button>
      </div>
      <ol class="recommendation-track" @scroll.passive="onTrackScroll">
        <li v-for="(item, index) in recommendations" :key="item.id" class="recommendation-card" :data-recommendation="item.id">
          <figure class="recommendation-figure">
            <div class="recommendation-card-top"><Quote :size="30" :stroke-width="1.3" aria-hidden="true" /><span>{{ copy.source.en }}</span></div>
            <blockquote class="recommendation-quote" lang="en"><p>{{ item.quote.en }}</p></blockquote>
            <figcaption class="recommendation-attribution">
              <div class="recommendation-person">
                <span class="recommendation-avatar" aria-hidden="true">
                  <span>{{ initials(item.author) }}</span>
                  <img v-if="!failedAvatars.has(item.id)" :src="item.avatar" alt="" width="52" height="52" loading="lazy" decoding="async" @error="hideAvatar(item.id)">
                </span>
                <div class="recommendation-person-copy">
                  <a class="recommendation-author" :href="item.profileUrl" target="_blank" rel="noopener noreferrer">{{ item.author }}<ArrowUpRight :size="16" aria-hidden="true" /></a>
                  <p class="recommendation-role">{{ item.role.en }}</p>
                  <p class="recommendation-relationship">{{ item.relationship.en }}<span aria-hidden="true"> · </span><time :datetime="item.date">{{ dates[index] }}</time></p>
                </div>
              </div>
            </figcaption>
          </figure>
          <a class="studio-text-link recommendation-source" :href="copy.url" target="_blank" rel="noopener noreferrer">{{ copy.view.en }}<ArrowUpRight :size="15" aria-hidden="true" /></a>
        </li>
      </ol>
      <a class="studio-text-link recommendation-skip" href="#writing">{{ copy.skip.en }}<ArrowDown :size="16" aria-hidden="true" /></a>
    </div>
  </section>
</template>

<style scoped>
.studio-recommendations { padding-top: var(--st-space); scroll-margin-top: 68px; }
.recommendation-frame { position: relative; padding: 64px var(--st-gutter); border-block: 1px solid var(--st-line); }
.recommendation-heading { max-width: 520px; }
.recommendation-heading h2 { margin: 0; font-size: clamp(42px, 5vw, 68px); line-height: 1.06; letter-spacing: -0.035em; text-wrap: balance; }
.recommendation-heading > p { margin: 22px 0 8px; color: var(--st-muted); line-height: 1.6; }
.recommendation-heading > a { color: var(--st-accent); font-size: 12px; }
.recommendation-orbit { display: none; }
.recommendation-track { list-style: none; margin: 48px 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.recommendation-card { padding: clamp(24px, 3vw, 40px); background: var(--st-surface); border-radius: var(--st-radius); min-width: 0; }
.recommendation-figure { margin: 0; }
.recommendation-card-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: var(--st-accent); }
.recommendation-card-top > span { font-size: 10px; color: var(--st-muted); }
.recommendation-quote { margin: 24px 0 28px; }
.recommendation-quote p { margin: 0; font: 400 clamp(22px, 2vw, 30px)/1.35 var(--st-heading); letter-spacing: -0.02em; }
.recommendation-attribution { padding-top: 20px; border-top: 1px solid var(--st-line); }
.recommendation-person { display: flex; align-items: flex-start; gap: 14px; }
.recommendation-person-copy { min-width: 0; }
.recommendation-avatar { position: relative; display: grid; place-items: center; flex: 0 0 52px; width: 52px; height: 52px; overflow: hidden; border-radius: 50%; background: var(--st-soft); color: var(--st-accent); font-size: 15px; }
.recommendation-avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.recommendation-author { display: inline-flex; align-items: center; gap: 12px; min-height: 32px; text-decoration: none; font-size: 15px; }
.recommendation-author:hover { color: var(--st-accent); }
.recommendation-role { margin: 4px 0 10px; font-size: 12px; line-height: 1.5; }
.recommendation-relationship { margin: 0; color: var(--st-muted); font-size: 10px; line-height: 1.6; }
.recommendation-source { margin-top: 14px; font-size: 11px; color: var(--st-accent); }
.recommendation-controls { margin-top: 28px; }
.recommendation-step-controls { display: flex; align-items: center; gap: 20px; }
.recommendation-step-controls > button { display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid var(--st-line); border-radius: 50%; background: var(--st-bg); }
.recommendation-step-controls > button:hover:enabled { background: var(--st-accent); color: var(--st-on-accent); border-color: var(--st-accent); }
.recommendation-step-controls > button:disabled { opacity: 0.35; cursor: default; }
.recommendation-count { font-size: 13px; font-variant-numeric: tabular-nums; color: var(--st-muted); }
.recommendation-hint { color: var(--st-muted); font-size: 11px; margin: 18px 0 0; }
.recommendation-list-toggle { border: 0; background: transparent; padding: 14px 0; min-height: 44px; font-size: 12px; text-decoration: underline; text-underline-offset: 5px; color: var(--st-muted); }
.recommendation-list-toggle:hover { color: var(--st-accent); }
.recommendation-skip { font-size: 12px; }
/* Enhancement only: the complete server-rendered list remains the baseline. */
[data-layout="wheel"] .recommendation-frame { height: calc(100svh - 68px); min-height: 672px; padding: 0; overflow: clip; }
[data-layout="wheel"] .recommendation-heading { position: absolute; left: var(--st-gutter); top: 64px; width: 24%; max-width: 350px; z-index: 3; }
[data-layout="wheel"] .recommendation-heading h2 { font-size: clamp(40px, 4vw, 60px); }
[data-layout="wheel"] .recommendation-heading > p { max-width: 24ch; font-size: 14px; }
[data-layout="wheel"] .recommendation-heading > a { max-width: 27ch; }
/* The shaded volume sits behind the typography and the projected card scene. */
[data-layout="wheel"] .recommendation-orbit { display: block; position: absolute; width: 92vw; height: 92vw; left: -56vw; top: 56%; transform: translateY(-50%); pointer-events: none; }
.recommendation-sphere { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; background: radial-gradient(circle at 72% 28%, color-mix(in srgb, var(--st-accent) 17%, var(--st-bg)), var(--st-bg) 73%); box-shadow: inset -32px -48px 96px color-mix(in srgb, var(--st-bg) 88%, transparent); }
.recommendation-sphere::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset -2px 1px 2px color-mix(in srgb, var(--st-accent) 25%, transparent); }
.recommendation-sphere-grid { width: 100%; height: 100%; stroke: var(--st-accent); stroke-width: 0.8; opacity: 0.2; mask-image: radial-gradient(circle at 80% 35%, #000 10%, transparent 72%); }
[data-layout="wheel"] .recommendation-track { display: block; margin: 0; position: absolute; inset: 0; perspective: 1100px; perspective-origin: 52% 56%; mask-image: linear-gradient(to right, transparent 26%, #000 37%); }
[data-layout="wheel"] .recommendation-card { position: absolute; top: 0; left: 0; width: min(48vw, 690px); transform-origin: center; backface-visibility: hidden; will-change: transform, opacity; background: color-mix(in srgb, var(--st-surface) var(--card-light, 100%), var(--st-bg)); box-shadow: 16px 28px 56px -24px rgb(0 0 0 / 38%); }
[data-layout="wheel"] .recommendation-controls { position: absolute; z-index: 3; left: var(--st-gutter); bottom: 90px; margin: 0; }
[data-layout="wheel"] .recommendation-skip { position: absolute; z-index: 3; bottom: 22px; left: var(--st-gutter); }
[data-layout="slider"] .recommendation-track { display: flex; gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: thin; scrollbar-color: var(--st-accent) var(--st-surface); padding-bottom: 20px; }
[data-layout="slider"] .recommendation-card { flex: 0 0 min(78vw, 600px); scroll-snap-align: start; }
@media (max-width: 700px) {
  .recommendation-frame { padding: 48px var(--st-gutter); }
  .recommendation-track { grid-template-columns: 1fr; }
  .recommendation-quote p { font-size: 23px; }
  .recommendation-heading h2 { max-width: 12ch; }
  [data-layout="slider"] .recommendation-card { flex-basis: 100%; }
  [data-layout="slider"] .recommendation-step-controls svg { transform: rotate(-90deg); }
}
</style>
