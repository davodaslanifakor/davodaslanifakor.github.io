<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import type { Locale } from '~/content/portfolio'
import { localize, profile, ui } from '~/content/portfolio'

const props = defineProps<{ locale: Locale }>()
const src = shallowRef('')
const attempt = shallowRef(0)
const loaded = shallowRef(false)
const slow = shallowRef(false)
let timeout: ReturnType<typeof setTimeout> | undefined

function ready() { loaded.value = true; slow.value = false; clearTimeout(timeout) }
function retry() {
  clearTimeout(timeout)
  loaded.value = false
  slow.value = false
  attempt.value++
  timeout = setTimeout(() => { slow.value = true }, 15000)
}
onMounted(() => {
  const url = new URL(profile.calendly)
  url.searchParams.set('embed_domain', window.location.hostname)
  url.searchParams.set('embed_type', 'Inline')
  url.searchParams.set('hide_event_type_details', '1')
  src.value = url.href
  retry()
})
onBeforeUnmount(() => clearTimeout(timeout))
</script>

<template>
  <div class="booking-calendar" :aria-busy="!loaded">
    <div v-if="!loaded" class="booking-status" role="status">
      <p>{{ localize(slow ? ui.bookingSlow : ui.bookingLoading, props.locale) }}</p>
      <button v-if="slow" class="booking-retry" type="button" @click="retry">{{ localize(ui.bookingRetry, props.locale) }}</button>
    </div>
    <iframe
      v-if="src"
      :key="attempt"
      class="booking-frame"
      :src="src"
      :title="localize(ui.bookingFrame, props.locale)"
      referrerpolicy="strict-origin-when-cross-origin"
      @load="ready"
      @error="slow = true"
    />
  </div>
</template>

<style scoped>
.booking-calendar { position: relative; width: 100%; height: 100%; min-height: 0; background: #fff; color: #253328; }
.booking-frame { position: relative; display: block; width: 100%; height: 100%; border: 0; }
.booking-status { position: absolute; z-index: 1; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 2rem; text-align: center; background: #f5f7f2; pointer-events: none; font: 16px/1.5 var(--font-display); }
.booking-status p { max-width: 28rem; margin: 0; }
.booking-retry { pointer-events: auto; min-height: 44px; border: 1px solid #6c7f5c; border-radius: 6px; padding: .6rem 1rem; background: #dce8cd; color: #1b2c1e; cursor: pointer; }
.booking-retry:focus-visible { outline: 2px solid #435b30; outline-offset: 3px; }
</style>
