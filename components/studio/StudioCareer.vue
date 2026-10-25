<script setup lang="ts">
import { ArrowDown, ArrowUpRight } from '@lucide/vue'
import { studioCareer, studioCopy as copy } from '~/content/portfolio'
const section = useTemplateRef<HTMLElement>('section')
useStudioScroll(section)
</script>

<template>
  <section
    id="career"
    ref="section"
    class="studio-career"
    aria-labelledby="career-title"
  >
    <!-- Chapter navigation stays outside the pinned frame and transformed track. -->
    <div class="studio-career-controls">
      <div class="studio-container">
        <nav class="studio-career-index" :aria-label="copy.careerIndex.en">
          <a
            v-for="(chapter, index) in studioCareer"
            :key="chapter.id"
            :href="`#career-${chapter.id}`"
          >
            <span aria-hidden="true">{{
              String(index + 1).padStart(2, '0')
            }}</span
            >{{ chapter.company }}
          </a>
        </nav>
        <a class="studio-text-link" href="#work"
          >{{ copy.skipCareer.en }}<ArrowDown :size="16" aria-hidden="true"
        /></a>
      </div>
      <span class="studio-career-progress" aria-hidden="true" />
    </div>
    <div class="studio-career-frame">
      <div class="studio-container studio-career-heading">
        <h2 id="career-title">{{ copy.careerTitle.en }}</h2>
        <p>{{ copy.careerIntro.en }}</p>
      </div>
      <div class="studio-career-viewport">
        <ol class="studio-career-track">
          <li
            v-for="(chapter, index) in studioCareer"
            :id="`career-${chapter.id}`"
            :key="chapter.id"
            data-career-chapter
            tabindex="-1"
          >
            <div class="studio-career-meta">
              <span>{{ chapter.period.en }}</span
              ><span aria-hidden="true">{{
                String(index + 1).padStart(2, '0')
              }}</span>
            </div>
            <h3>{{ chapter.company }}</h3>
            <p class="studio-career-role">{{ chapter.role.en }}</p>
            <p class="studio-career-contribution">
              {{ chapter.contribution.en }}
            </p>
            <a class="studio-text-link" tabindex="0" :href="chapter.link.href"
              >{{ chapter.link.label.en
              }}<ArrowUpRight :size="18" aria-hidden="true"
            /></a>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.studio-career {
  position: relative;
  z-index: 2;
  background: var(--st-surface);
  border-top: 4px solid var(--st-brand);
}
.studio-career-controls {
  position: relative;
  z-index: 3;
  background: var(--st-surface);
  border-bottom: 1px solid var(--st-line);
}
.studio-career-controls > div {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-block: 12px;
}
.studio-career-index {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 24px;
}
.studio-career-index a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  color: var(--st-muted);
  font-size: 12px;
  text-decoration: none;
}
.studio-career-index a:hover,
.studio-career-index a[aria-current] {
  color: var(--st-fg);
}
.studio-career-index span {
  color: var(--st-accent);
  font: 11px var(--st-mono);
}
.studio-career-controls .studio-text-link {
  white-space: nowrap;
}
.studio-career-frame {
  padding-block: 46px 58px;
}
.studio-career-heading h2 {
  font-size: clamp(36px, 4vw, 60px);
  line-height: 1.1;
  letter-spacing: -0.035em;
  margin: 0;
  max-width: 20ch;
  text-wrap: balance;
}
.studio-career-heading > p {
  font-size: 15px;
  line-height: 1.65;
  color: var(--st-muted);
  margin: 18px 0 0;
}
.studio-career-track {
  padding: 0;
  margin: 42px var(--st-gutter) 0;
  list-style: none;
}
.studio-career-track li {
  position: relative;
  padding: 30px 0;
  border-top: 1px solid var(--st-line);
}
.studio-career-meta {
  display: flex;
  justify-content: space-between;
  color: var(--st-accent);
  font: 12px var(--st-mono);
}
.studio-career-track h3 {
  font-family: var(--st-heading);
  font-size: clamp(32px, 3.8vw, 56px);
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 30px 0 14px;
}
.studio-career-role {
  font-size: 13px;
  color: var(--st-accent);
  line-height: 1.6;
  margin: 0;
}
.studio-career-contribution {
  font-size: clamp(16px, 1.4vw, 20px);
  line-height: 1.65;
  max-width: 48ch;
  margin: 24px 0 18px;
}
[data-layout='horizontal'] .studio-career-controls {
  position: sticky;
  top: 68px;
}
[data-layout='horizontal'] .studio-career-frame {
  padding-block: 30px;
}
[data-layout='horizontal'] .studio-career-viewport {
  overflow: hidden;
}
[data-layout='horizontal'] .studio-career-track {
  display: flex;
  width: max-content;
  gap: 5vw;
  margin: 32px 0 0;
  padding-inline: var(--st-gutter);
}
[data-layout='horizontal'] .studio-career-track li {
  flex: 0 0 65vw;
  width: 65vw;
  padding: 24px 4vw 8px 0;
  border-right: 1px solid var(--st-line);
  border-top: 0;
}
[data-layout='horizontal'] .studio-career-track li:last-child {
  border-right: 0;
}
[data-layout='horizontal'] .studio-career-contribution {
  min-height: 6.6em;
}
/* Scroll-linked: one line that fills as the rail travels. */
.studio-career-progress {
  display: none;
}
[data-layout='horizontal'] .studio-career-progress {
  display: block;
  position: absolute;
  inset: auto 0 -1px;
  height: 2px;
  background: var(--st-accent);
  transform: scaleX(0);
  transform-origin: left;
}
[data-layout='horizontal'] [data-career-chapter] > * {
  transition: opacity 450ms var(--st-ease-out);
}
[data-layout='horizontal'] [data-career-chapter]:not([data-current]) > * {
  opacity: 0.5;
}
@media (max-width: 767px) {
  .studio-career-controls > div {
    display: block;
  }
  .studio-career-index {
    gap: 0 16px;
  }
  .studio-career-index a {
    font-size: 11px;
  }
  .studio-career-frame {
    padding-top: 32px;
  }
  .studio-career-heading h2 {
    max-width: 17ch;
  }
  .studio-career-track {
    margin-top: 30px;
  }
}
</style>
