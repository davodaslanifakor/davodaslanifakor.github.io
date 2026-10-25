<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { studioCopy as copy, studioOpenSource } from '~/content/portfolio'
</script>

<template>
  <section
    class="studio-open-source studio-container"
    aria-labelledby="open-source-title"
  >
    <h2 id="open-source-title">{{ copy.openSourceTitle.en }}</h2>
    <div v-for="project in studioOpenSource" :key="project.href">
      <h3>
        <a :href="project.href" target="_blank" rel="noopener noreferrer"
          >{{ project.name.en }}<ArrowUpRight :size="19" aria-hidden="true"
        /></a>
      </h3>
      <p>{{ project.description.en }}</p>
    </div>
  </section>
</template>

<style scoped>
.studio-open-source {
  display: grid;
  grid-template-columns: 0.8fr 1fr 1fr;
  gap: 6vw;
  padding-top: var(--st-space);
}
h2 {
  font-size: 38px;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0;
}
h3 {
  font-size: 19px;
  margin: 0 0 16px;
}
a {
  display: flex;
  gap: 14px;
  align-items: center;
  text-decoration: none;
}
a:hover {
  color: var(--st-accent);
}
p {
  color: var(--st-muted);
  font-size: 15px;
  line-height: 1.75;
  margin: 0;
}
@media (max-width: 767px) {
  .studio-open-source {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
