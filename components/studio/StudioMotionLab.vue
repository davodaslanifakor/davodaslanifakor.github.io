<script setup lang="ts">
import { ArrowLeft, ArrowUpRight, Moon, Sun } from '@lucide/vue'
import { studioCopy as copy } from '~/content/portfolio'
import StudioMagnetic from './StudioMagnetic.vue'
const { theme, reveal, ready, busy, toggle } = useStudioTheme()
</script>

<template>
  <section class="studio-motion-lab studio-container">
    <NuxtLink class="studio-text-link" to="/studio"
      ><ArrowLeft :size="18" aria-hidden="true" />{{ copy.backStudio.en }}</NuxtLink
    >
    <div class="studio-motion-heading">
      <h1>{{ copy.themeLabTitle.en }}</h1>
      <p>{{ copy.themeLabIntro.en }}</p>
    </div>
    <div class="studio-motion-controls">
      <fieldset>
        <legend>{{ copy.themeLabControl.en }}</legend>
        <label v-for="(title, key) in copy.themeStyles" :key="key"
          ><input v-model="reveal" type="radio" name="reveal" :value="key" ><span>{{
            title.en
          }}</span></label
        >
      </fieldset>
      <StudioMagnetic
        ><button class="studio-primary" type="button" :disabled="!ready || busy" @click="toggle">
          <Sun v-if="theme === 'dark'" :size="20" aria-hidden="true" /><Moon
            v-else
            :size="20"
            aria-hidden="true"
          />{{ copy.themeReplay.en }}
        </button></StudioMagnetic
      >
    </div>
    <div class="studio-motion-specimen">
      <p>{{ copy.themeLabQuote.en }}</p>
      <div>
        <span>Aa</span><span>{{ copy.themeLabDetail.en }}</span
        ><ArrowUpRight :size="50" :stroke-width="1" aria-hidden="true" />
      </div>
    </div>
    <p class="studio-motion-note">{{ copy.themeLabNote.en }}</p>
  </section>
</template>
