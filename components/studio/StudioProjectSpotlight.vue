<script setup lang="ts">
import { ArrowUpRight, ArrowDownRight, Pause, Play } from '@lucide/vue'
import { studioSpotlight as copy } from '~/content/portfolio'

const root = useTemplateRef<HTMLElement>('root')
const { selected, paused, hovered, focused, select, focusOut, toggle } = useStudioProjectRotation(root, copy.projects.length)
const project = computed(() => copy.projects[selected.value]!)
const { ready, reduced } = useStudioMotion()
</script>

<template>
  <div
ref="root" class="studio-spotlight"
    @pointerenter="(event: PointerEvent) => { if (event.pointerType === 'mouse') hovered = true }"
    @pointerleave="hovered = false"
    @focusin="focused = true"
    @focusout="focusOut"
  >
    <Transition name="spotlight" mode="out-in">
      <article
        :key="project.id"
        class="spotlight-panel"
        :class="`spotlight-${project.id}`"
        :data-product="project.id"
        :aria-label="project.name"
      >
        <a
          :href="project.href"
          target="_blank"
          rel="noopener noreferrer"
          class="spotlight-image-link"
          :aria-label="`${copy.visit.en}: ${project.domain}`"
          data-cursor="open"
        >
          <div class="spotlight-product-heading">
            <span class="spotlight-brand">{{ project.name }}</span>
            <span class="spotlight-domain">{{ project.domain }}<ArrowUpRight :size="16" aria-hidden="true" /></span>
          </div>
          <div class="spotlight-stage">
            <div class="spotlight-product-image visual-main">
              <svg
                v-if="project.id === 'zoviz'"
                viewBox="98 305 1724 684"
                role="img"
                :aria-label="project.imageAlt.en"
                class="spotlight-dashboard"
              >
                <image :href="project.image" width="1920" height="1080" />
              </svg>
              <img
                v-else
                :src="project.image"
                :alt="project.imageAlt.en"
                :width="project.id === 'sarmayex' ? 592 : 1900"
                :height="project.id === 'sarmayex' ? 834 : 780"
                class="spotlight-product-shot"
              >
            </div>
          </div>
          <span class="spotlight-category">{{ project.category.en }}</span>
        </a>
        <p class="spotlight-image-note">{{ project.imageNote.en }}</p>
        <div class="spotlight-project-meta">
          <span>{{ project.role.en }}</span><span>{{ project.period }}</span>
        </div>
        <h2 class="spotlight-project-title">{{ project.title.en }}</h2>
        <p class="spotlight-summary">{{ project.summary.en }}</p>
        <div class="spotlight-bottom">
          <div class="spotlight-tags">
            <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
          </div>
          <a :href="project.anchor" class="spotlight-work-link">{{ copy.story.en }}<ArrowDownRight :size="16" aria-hidden="true" /></a>
        </div>
      </article>
    </Transition>
    <div role="group" :aria-label="copy.choose.en" class="spotlight-switcher">
      <button
        v-for="(item, index) in copy.projects"
        :key="item.id"
        type="button"
        :disabled="!ready"
        :aria-pressed="selected === index"
        @click="select(index)"
      >
        {{ item.name }}<ArrowUpRight :size="14" aria-hidden="true" />
      </button>
    </div>
    <button v-if="ready && !reduced" type="button" class="spotlight-playback" :aria-label="paused ? copy.resume.en : copy.pause.en" @click="toggle">
      <Play v-if="paused" :size="13" aria-hidden="true" /><Pause v-else :size="13" aria-hidden="true" />
      {{ paused ? copy.resume.en : copy.pause.en }}
    </button>
  </div>
</template>

<style scoped>
.studio-spotlight { width: 100%; position: relative; padding-bottom: 36px; }
.spotlight-playback {
  position: absolute; right: 0; bottom: 0; display: inline-flex;
  align-items: center; gap: 8px; min-height: 36px; padding: 0;
  border: 0; background: transparent; color: var(--st-muted); font-size: 11px; cursor: pointer;
}
.spotlight-playback:hover { color: var(--st-fg); }
.spotlight-playback:focus-visible { outline: 2px solid var(--st-accent); outline-offset: 4px; }
.spotlight-image-link {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: var(--st-radius);
  background: var(--st-soft);
  text-decoration: none;
}
.spotlight-product-heading {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 0;
}
.spotlight-brand {
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.035em;
}
.spotlight-domain {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--st-muted);
}
.spotlight-stage {
  position: relative;
  height: 190px;
  display: grid;
  align-items: center;
  padding: 0 28px;
  overflow: hidden;
}
.spotlight-product-image {
  position: relative;
  transform: rotate(-3deg);
}
.spotlight-dashboard,
.spotlight-product-shot {
  display: block;
  width: 100%;
  height: auto;
  max-height: 190px;
  object-fit: contain;
  border-radius: var(--st-radius);
  box-shadow: 0 12px 28px rgb(0 0 0 / 18%);
}
.spotlight-sarmayex .spotlight-stage {
  height: 190px;
  padding: 0;
}
.spotlight-sarmayex .spotlight-product-image {
  width: 134px;
  margin-inline: auto;
  margin-top: 0;
  align-self: center;
}
.spotlight-sarmayex .spotlight-product-shot { box-shadow: none; }
.spotlight-category {
  position: relative;
  z-index: 2;
  display: block;
  padding: 0 24px 18px;
  font-size: 12px;
  color: var(--st-muted);
}
.spotlight-image-note {
  font-size: 10px;
  line-height: 1.5;
  color: var(--st-muted);
  margin: 6px 0 6px;
}
.spotlight-project-meta {
  display: flex;
  justify-content: space-between;
  align-items: start;
  min-height: 3em;
  gap: 18px;
  font-size: 11px;
  color: var(--st-muted);
}
.spotlight-project-meta span:last-child { white-space: nowrap; }
.studio-page .spotlight-project-title {
  font-family: var(--st-heading);
  font-weight: 400;
  font-size: clamp(24px, 2.2vw, 30px);
  letter-spacing: -0.035em;
  line-height: 1.15;
  margin: 10px 0;
  text-wrap: balance;
  min-height: 2.3em;
}
.spotlight-summary {
  font-size: 13px;
  line-height: 1.6;
  color: var(--st-muted);
  min-height: 4.8em;
  margin: 0;
}
.spotlight-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.spotlight-tags { display: flex; gap: 12px; font-size: 10px; color: var(--st-muted); }
.spotlight-work-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  gap: 8px;
  font-size: 12px;
  text-underline-offset: 4px;
  text-decoration-color: var(--st-line);
}
.spotlight-switcher {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 8px;
  border-top: 1px solid var(--st-line);
}
.spotlight-switcher button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 12px;
  border: 0;
  border-top: 2px solid transparent;
  margin-top: -1px;
  background: transparent;
  color: var(--st-muted);
  font-size: 12px;
  cursor: pointer;
  transition: color 180ms ease-out, background-color 180ms ease-out;
}
.spotlight-switcher button:first-child { padding-left: 0; }
.spotlight-switcher button:last-child { padding-right: 0; }
.spotlight-switcher button svg { opacity: 0; }
.spotlight-switcher button[aria-pressed='true'] { border-color: var(--st-accent); color: var(--st-fg); }
.spotlight-switcher button[aria-pressed='true'] svg { opacity: 1; }
.spotlight-switcher button:hover { color: var(--st-fg); }
.spotlight-switcher button:disabled { cursor: default; }
.spotlight-switcher button:focus-visible,
.spotlight-image-link:focus-visible,
.spotlight-work-link:focus-visible { outline: 2px solid var(--st-accent); outline-offset: 4px; }
.spotlight-enter-active,
.spotlight-leave-active { transition: opacity 180ms ease-out, translate 180ms ease-out; }
.spotlight-enter-from { opacity: 0; translate: 0 8px; }
.spotlight-leave-to { opacity: 0; translate: 0 -8px; }
@media (prefers-reduced-motion: reduce) {
  .spotlight-enter-active,
  .spotlight-leave-active { transition: none; }
}
@media (max-width: 767px) {
  .spotlight-product-heading { padding: 18px 18px 0; }
  .spotlight-brand { font-size: 24px; }
  .spotlight-domain { font-size: 11px; }
  .spotlight-stage { height: 180px; padding: 0 18px; }
  .spotlight-category { padding: 0 18px 16px; }
  .spotlight-sarmayex .spotlight-stage { height: 180px; }
  .spotlight-sarmayex .spotlight-product-image { width: 126px; }
  .spotlight-summary { min-height: 84px; }
  .spotlight-project-meta { font-size: 10px; }
}
</style>
