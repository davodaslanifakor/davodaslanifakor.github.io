<script setup lang="ts">
import { computed } from 'vue'
import { localize, screenContent } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'
import { getWorldClockReading } from '~/utils/worldTime'

const props = defineProps<{ epochMs: number; locale: Locale }>()
const clocks = computed(() => screenContent.cities.map(city => ({
  city,
  reading: getWorldClockReading(props.epochMs || Date.now(), city, props.locale),
})))
</script>

<template>
  <div class="clock-grid">
    <article v-for="{ city, reading } in clocks" :key="city.id" class="clock-card">
      <p>{{ localize(city.displayName, props.locale) }}</p>
      <strong>{{ reading.time }}</strong>
      <time :datetime="`${reading.parts.year}-${String(reading.parts.month).padStart(2, '0')}-${String(reading.parts.day).padStart(2, '0')}`">
        {{ reading.date }}
      </time>
      <span>{{ city.timeZone }}</span>
    </article>
  </div>
</template>

<style scoped>
.clock-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .8rem; }
.clock-card { display: grid; gap: .6rem; min-height: 9rem; border: 1px solid var(--line); padding: 1.1rem; background: rgb(198 216 162 / 4%); }
.clock-card p,.clock-card time,.clock-card span { margin: 0; color: var(--muted); }
.clock-card p { font: .72rem/1.2 var(--font-mono); letter-spacing: .07em; text-transform: uppercase; }
.clock-card strong { font: 500 clamp(2rem, 4vw, 3.3rem)/1 var(--font-display); font-variant-numeric: tabular-nums; }
.clock-card time { font-size: .82rem; }
.clock-card span { font: .62rem/1.3 var(--font-mono); opacity: .7; }
@media (max-width: 700px) { .clock-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
