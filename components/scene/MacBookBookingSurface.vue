<script setup lang="ts">
import { computed, nextTick, shallowRef, toRaw, useTemplateRef, watch } from 'vue'
import type { Object3D, PerspectiveCamera } from 'three'
import type { Locale } from '~/content/portfolio'
import { localize, profile, ui } from '~/content/portfolio'
import { getMonitorQuad, screenTransform } from '~/utils/monitorProjection'
import type { ScreenQuad } from '~/utils/monitorProjection'
import CalendlyBooking from '~/components/booking/CalendlyBooking.vue'

const props = defineProps<{ active: boolean; camera: PerspectiveCamera | null; model: Object3D | null; locale: Locale }>()
const emit = defineEmits<{ close: [] }>()
const host = useTemplateRef<HTMLDivElement>('host')
const close = useTemplateRef<HTMLButtonElement>('close')
const transform = shallowRef('')
const screenHeight = shallowRef(474)
const started = shallowRef(false)
// Once open, resize-driven camera adjustments must not make the iframe inert
// again: WebKit drops keyboard focus when its focused subtree becomes inert.
const visible = computed(() => props.active || started.value)
let measured: Object3D | null = null
let quad: ScreenQuad | null = null
const WIDTH = 720

/** Shares the room frame loop so the calendar never drifts away from its mesh. */
function updateFrame() {
  if (!props.camera || !props.model || !host.value) return
  const model = toRaw(props.model)
  if (model !== measured) {
    quad = getMonitorQuad(model, 'int_monitor_screen')
    if (quad) screenHeight.value = WIDTH * quad[0].distanceTo(quad[3]) / quad[0].distanceTo(quad[1])
    measured = model
  }
  if (!quad) { transform.value = ''; return }
  const camera = toRaw(props.camera)
  camera.updateMatrixWorld()
  const points = quad.map(point => point.clone().project(camera))
  transform.value = points.some(point => point.z < -1 || point.z > 1) ? '' : screenTransform(points.map(point => ({
    x: (point.x + 1) * host.value!.clientWidth / 2,
    y: (1 - point.y) * host.value!.clientHeight / 2,
  })), WIDTH, screenHeight.value) ?? ''
}
defineExpose({ updateFrame })

watch([() => props.active, close], async ([active, button]) => {
  if (!active || !button) return
  const firstOpen = !started.value
  started.value = true
  await nextTick()
  updateFrame()
  if (firstOpen) button.focus({ preventScroll: true })
}, { immediate: true, flush: 'post' })

function focusCalendar() { host.value?.querySelector('iframe')?.focus() }
</script>

<template>
  <div
    ref="host"
    class="macbook-booking"
    :class="{ 'macbook-booking--active': visible }"
    role="dialog"
    :aria-label="localize(ui.bookingTitle, props.locale)"
    :aria-modal="visible ? true : undefined"
    :aria-hidden="!visible"
    :inert="!visible"
    :dir="props.locale === 'fa' ? 'rtl' : 'ltr'"
    @keydown.esc.stop="emit('close')"
  >
    <span class="focus-guard" tabindex="0" @focus="focusCalendar" />
    <div class="booking-toolbar">
      <button ref="close" class="booking-back" type="button" @click="emit('close')">← {{ localize(ui.bookingBack, props.locale) }}</button>
      <a class="booking-external" :href="profile.calendly" target="_blank" rel="noopener noreferrer">{{ localize(ui.bookingExternal, props.locale) }} ↗</a>
    </div>
    <div class="booking-screen" :class="{ 'booking-screen--ready': transform }" :style="{ transform: transform || undefined, height: `${screenHeight}px` }">
      <CalendlyBooking v-if="started" :locale="props.locale" />
    </div>
    <span class="focus-guard" tabindex="0" @focus="close?.focus()" />
  </div>
</template>

<style scoped>
/* Use display so inherited visibility transitions cannot delay keyboard focus. */
.macbook-booking { display: none; position: absolute; z-index: 8; inset: 0; overflow: hidden; pointer-events: none; }
.macbook-booking--active { display: block; }
.booking-screen { position: absolute; top: 0; left: 0; width: 720px; transform-origin: 0 0; overflow: hidden; visibility: hidden; background: #fff; }
.macbook-booking--active .booking-screen--ready { visibility: visible; pointer-events: auto; }
.booking-toolbar { position: absolute; z-index: 1; bottom: 6rem; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 1rem; width: max-content; max-width: calc(100% - 2rem); pointer-events: auto; }
.booking-back { min-height: 44px; border: 1px solid #7e9276; background: #172019; color: #e5eedc; border-radius: 6px; padding: .75rem 1rem; cursor: pointer; font: 14px/1.2 var(--font-display); }
.booking-external { display: flex; align-items: center; min-height: 44px; color: #f2efe8; font: 13px/1.2 var(--font-display); text-decoration: none; text-shadow: 0 1px 3px #000; }
.booking-external:hover { text-decoration: underline; }
.booking-back:focus-visible, .booking-external:focus-visible { outline: 2px solid #c6d8a2; outline-offset: 4px; }
.focus-guard { position: absolute; width: 1px; height: 1px; overflow: hidden; }
@media (max-width: 760px), (max-height: 520px) {
  .macbook-booking { position: fixed; z-index: 90; background: #111814; }
  .macbook-booking--active { display: flex; flex-direction: column; pointer-events: auto; }
  .booking-toolbar { position: static; flex-shrink: 0; transform: none; width: 100%; max-width: none; justify-content: space-between; padding: .75rem; gap: .5rem; }
  .booking-back { font-size: 13px; padding: .65rem .75rem; }
  .booking-external { font-size: 12px; }
  .booking-screen { position: relative; flex: 1; min-height: 0; width: 100%; height: auto !important; transform: none !important; }
  .macbook-booking--active .booking-screen { visibility: visible; pointer-events: auto; }
}
</style>
