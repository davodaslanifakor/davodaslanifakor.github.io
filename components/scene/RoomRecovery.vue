<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'
import { localize, ui } from '~/content/portfolio'
import type { Locale } from '~/content/portfolio'

defineProps<{ locale: Locale }>()
const emit = defineEmits<{ retry: [] }>()
const failed = ref(false)
const generation = ref(0)

function fail(error?: unknown) {
  if (failed.value) return
  console.error('[Room] Rendering stopped', error)
  failed.value = true
}
function retry() {
  emit('retry')
  generation.value++
  failed.value = false
}
onErrorCaptured((error) => { fail(error); return false })
</script>

<template>
  <div class="room-recovery">
    <div v-if="failed" class="room-recovery__message" role="alert">
      <p>{{ localize(ui.roomUnavailable, locale) }}</p>
      <p>{{ localize(ui.roomRecoveryHint, locale) }}</p>
      <div>
        <button type="button" @click="retry">{{ localize(ui.reloadRoom, locale) }}</button>
        <NuxtLink to="/cv">{{ localize(ui.skipToCv, locale) }}</NuxtLink>
      </div>
    </div>
    <slot v-else :key="generation" :fail="fail" />
  </div>
</template>

<style scoped>
.room-recovery { position: absolute; inset: 0; }
.room-recovery__message { position: absolute; inset: 42% auto auto 50%; translate: -50% -50%; width: min(28rem, calc(100% - 3rem)); padding: 1.5rem; border: 1px solid #59604f; border-radius: 1rem; background: #171b17; color: #f2efe8; }
.room-recovery__message p:first-child { font-size: 1.2rem; font-weight: 700; }
.room-recovery__message p + p { margin-block: .8rem 1.4rem; color: #b9bcb2; line-height: 1.5; }
.room-recovery__message div { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
.room-recovery__message button { padding: .7rem 1rem; border: 1px solid #d4dea0; border-radius: 2rem; color: #171b17; background: #d4dea0; cursor: pointer; font: inherit; }
.room-recovery__message a { color: #d4dea0; }
.room-recovery__message :is(button, a):focus-visible { outline: 2px solid white; outline-offset: 4px; }
</style>
