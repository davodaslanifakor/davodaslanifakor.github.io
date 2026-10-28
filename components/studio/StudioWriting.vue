<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { studioCopy as copy, studioWriting } from '~/content/portfolio'
</script>

<template>
  <section id="writing" class="studio-writing" aria-labelledby="writing-title">
    <div class="studio-container">
      <div class="studio-writing-heading">
        <h2 id="writing-title">{{ copy.writingTitle.en }}</h2>
        <p>{{ copy.writingIntro.en }}</p>
        <a
          class="studio-text-link"
          :href="copy.publicationUrl"
          target="_blank"
          rel="noopener noreferrer"
          >{{ copy.publication.en }}<ArrowUpRight :size="18" aria-hidden="true"
        /></a>
      </div>
      <div class="studio-writing-entries">
        <article v-for="article in studioWriting" :key="article.id">
          <p class="studio-writing-meta">
            {{ article.source.en
            }}<time :datetime="article.published">{{
              article.dateLabel.en
            }}</time>
          </p>
          <h3>
            <a :href="article.href" target="_blank" rel="noopener noreferrer"
              >{{ article.title.en
              }}<ArrowUpRight :size="22" aria-hidden="true"
            /></a>
          </h3>
          <p>{{ article.summary.en }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.studio-writing {
  /* Adjacent opaque chapters must meet: margins expose the sticky Work layer. */
  margin-top: 0;
  padding-block: var(--st-space);
  background: var(--st-surface);
}
.studio-writing > div {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 9vw;
}
/* The heading holds its place while the entries pass beside it. */
@media (min-width: 901px) {
  .studio-writing-heading {
    position: sticky;
    top: 120px;
    align-self: start;
  }
}
.studio-writing-heading h2 {
  margin: 0;
  font-size: clamp(46px, 5.4vw, 78px);
  line-height: 1.05;
  letter-spacing: -0.04em;
}
.studio-writing-heading > p {
  color: var(--st-muted);
  line-height: 1.7;
  margin: 28px 0 12px;
  max-width: 34ch;
}
.studio-writing-entries article {
  padding-block: 30px;
  border-top: 1px solid var(--st-line);
}
.studio-writing-entries article:first-child {
  padding-top: 0;
  border-top: 0;
}
.studio-writing-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  color: var(--st-accent);
  font: 11px/1.7 var(--st-mono);
  margin: 0 0 18px;
}
.studio-writing-entries h3 {
  font-family: var(--st-heading);
  font-size: clamp(25px, 2.6vw, 36px);
  line-height: 1.25;
  letter-spacing: -0.025em;
  margin: 0;
}
.studio-writing-entries h3 a {
  text-decoration: none;
}
.studio-writing-entries h3 a:hover {
  color: var(--st-accent);
}
.studio-writing-entries h3 svg {
  display: inline;
  margin-left: 10px;
}
.studio-writing-entries article > p:last-child {
  color: var(--st-muted);
  font-size: 15px;
  line-height: 1.75;
  max-width: 55ch;
  margin: 18px 0 0;
}
@media (max-width: 900px) {
  .studio-writing > div {
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .studio-writing-heading {
    max-width: 560px;
  }
}
</style>
