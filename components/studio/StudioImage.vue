<script setup lang="ts">
import { ui } from '~/content/portfolio'
const props = withDefaults(
  defineProps<{ src: string; alt: string; width: number; height: number; pixelated?: boolean }>(),
  { pixelated: false },
)
const failed = shallowRef(false)
const loaded = shallowRef(false)
watch(
  () => props.src,
  () => {
    failed.value = false
    loaded.value = false
  },
)
</script>

<template>
  <div
    class="studio-image"
    :class="{ 'is-loaded': loaded, 'is-pixelated': pixelated }"
    :style="{ aspectRatio: `${width} / ${height}` }"
  >
    <img
      v-if="!failed"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      loading="lazy"
      decoding="async"
      @load="loaded = true"
      @error="failed = true"
    ><span v-else role="img" :aria-label="alt">{{ ui.unavailable.en }}</span>
  </div>
</template>
