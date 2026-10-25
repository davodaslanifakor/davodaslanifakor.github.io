<script setup lang="ts">
import { Pause, Play } from "@lucide/vue";
import { studioCopy as copy } from "~/content/portfolio";
import { studioLettering } from "~/content/studioLettering";

const root = useTemplateRef<HTMLElement>("root");
const { active, paused, enhanced, reduced, select, toggle } =
  useStudioLettering(root, copy.heroPhrases.length);
</script>

<template>
  <div
    ref="root"
    class="studio-headline"
    :class="{ 'is-drawn': enhanced }"
    :data-phrase-index="active"
  >
    <h1 :aria-label="`${copy.heroLines[0]!.en} ${copy.heroPhrases[0]!.en}`">
      <span>{{ copy.heroLines[0]!.en }}</span>
      <span
        class="studio-hero-second studio-script studio-lettering"
        aria-hidden="true"
      >
        <span class="studio-lettering-fallback">{{
          copy.heroPhrases[0]!.en
        }}</span>
        <svg
          class="studio-lettering-svg"
          :viewBox="studioLettering.viewBox"
          preserveAspectRatio="xMinYMid meet"
          focusable="false"
        >
          <g
            v-for="(phrase, index) in studioLettering.phrases"
            :key="index"
            data-phrase
          >
            <path
              v-for="(path, glyph) in phrase.paths"
              :key="glyph"
              :d="path"
            />
          </g>
          <path
            data-flourish
            class="studio-lettering-flourish"
            d="M 50 1150 C 900 1080 2900 1090 4320 1130 C 4530 1135 4590 1180 4380 1190"
          />
        </svg>
      </span>
    </h1>
    <div class="studio-headline-control-space">
      <div
        v-if="enhanced && !reduced"
        class="studio-headline-controls"
        role="group"
        :aria-label="copy.heroPhraseLabel.en"
      >
        <button
          v-for="(phrase, index) in copy.heroPhrases"
          :key="phrase.en"
          type="button"
          :aria-label="`${copy.heroShowPhrase.en}: ${phrase.en}`"
          :aria-pressed="active === index"
          @click="select(index)"
        >
          <span aria-hidden="true">0{{ index + 1 }}</span
          ><i aria-hidden="true" />
        </button>
        <button
          type="button"
          :aria-label="paused ? copy.heroPlay.en : copy.heroPause.en"
          @click="toggle"
        >
          <Play v-if="paused" :size="13" aria-hidden="true" /><Pause
            v-else
            :size="13"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.studio-headline {
  position: relative;
}
.studio-lettering {
  position: relative;
  width: min(100%, 5.3em);
  height: 1.3em;
}
.studio-lettering-fallback {
  white-space: nowrap;
}
.studio-lettering-svg {
  display: none;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.is-drawn .studio-lettering-fallback {
  visibility: hidden;
}
.is-drawn .studio-lettering-svg {
  display: block;
  position: absolute;
  inset: 0;
}
.studio-lettering-svg [data-phrase] {
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.studio-lettering-flourish {
  fill: none;
  stroke: currentColor;
  stroke-width: 6;
  stroke-linecap: round;
}
.studio-headline-control-space {
  height: 36px;
}
.studio-headline-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 36px;
}
.studio-headline-controls button {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--st-muted);
  font-family: var(--st-mono);
  font-size: 10px;
  cursor: pointer;
}
.studio-headline-controls button[aria-pressed="true"] {
  color: var(--st-script-ink);
}
.studio-headline-controls i {
  width: 12px;
  height: 1px;
  background: currentColor;
  opacity: 0.4;
}
.studio-headline-controls button[aria-pressed="true"] i {
  opacity: 1;
}
@media (max-width: 767px) {
  .studio-lettering {
    width: 100%;
    height: 1.35em;
  }
}
</style>
