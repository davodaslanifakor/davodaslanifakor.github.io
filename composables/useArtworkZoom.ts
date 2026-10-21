import { computed, onBeforeUnmount, onMounted, readonly, shallowRef, watch } from 'vue'
import type { ShallowRef } from 'vue'

interface Point { x: number; y: number }
interface ArtworkZoomOptions {
  viewport: Readonly<ShallowRef<HTMLElement | null>>
  width: () => number
  height: () => number
}

export function useArtworkZoom(options: ArtworkZoomOptions) {
  const zoom = shallowRef(1)
  const pan = shallowRef<Point>({ x: 0, y: 0 })
  const viewportSize = shallowRef({ width: 0, height: 0 })
  const dragging = shallowRef(false)
  const pointers = new Map<number, Point>()
  const fit = computed(() => Math.min(viewportSize.value.width / options.width(), viewportSize.value.height / options.height(), 1))
  const imageSize = computed(() => ({ width: options.width() * fit.value * zoom.value, height: options.height() * fit.value * zoom.value }))
  const imageStyle = computed(() => ({
    width: `${imageSize.value.width}px`, height: `${imageSize.value.height}px`,
    transform: `translate(calc(-50% + ${pan.value.x}px), calc(-50% + ${pan.value.y}px))`,
  }))
  let observer: ResizeObserver | undefined

  function moveTo(point: Point) {
    const limitX = Math.max(0, (imageSize.value.width - viewportSize.value.width) / 2)
    const limitY = Math.max(0, (imageSize.value.height - viewportSize.value.height) / 2)
    pan.value = { x: Math.max(-limitX, Math.min(limitX, point.x)), y: Math.max(-limitY, Math.min(limitY, point.y)) }
  }

  function zoomTo(value: number, anchor: Point = { x: 0, y: 0 }) {
    const next = Math.max(1, Math.min(4, value))
    const ratio = next / zoom.value
    zoom.value = next
    moveTo({ x: anchor.x - (anchor.x - pan.value.x) * ratio, y: anchor.y - (anchor.y - pan.value.y) * ratio })
  }

  function clearPointers() {
    for (const id of pointers.keys()) {
      if (options.viewport.value?.hasPointerCapture(id)) options.viewport.value.releasePointerCapture(id)
    }
    pointers.clear()
    dragging.value = false
  }

  function reset() { clearPointers(); zoom.value = 1; pan.value = { x: 0, y: 0 } }
  function point(event: { clientX: number; clientY: number }): Point {
    const bounds = options.viewport.value!.getBoundingClientRect()
    return { x: event.clientX - bounds.left - bounds.width / 2, y: event.clientY - bounds.top - bounds.height / 2 }
  }

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || pointers.size >= 2) return
    event.preventDefault()
    options.viewport.value?.focus({ preventScroll: true })
    options.viewport.value?.setPointerCapture(event.pointerId)
    pointers.set(event.pointerId, point(event))
    dragging.value = true
  }

  function pointerMove(event: PointerEvent) {
    const previous = pointers.get(event.pointerId)
    if (!previous) return
    const next = point(event)
    const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)?.[1]
    if (other) {
      const before = Math.hypot(previous.x - other.x, previous.y - other.y)
      const after = Math.hypot(next.x - other.x, next.y - other.y)
      if (before > 0) zoomTo(zoom.value * after / before, { x: (previous.x + other.x) / 2, y: (previous.y + other.y) / 2 })
    }
    const factor = other ? 0.5 : 1
    moveTo({ x: pan.value.x + (next.x - previous.x) * factor, y: pan.value.y + (next.y - previous.y) * factor })
    pointers.set(event.pointerId, next)
  }

  function pointerUp(event: PointerEvent) {
    pointers.delete(event.pointerId)
    if (options.viewport.value?.hasPointerCapture(event.pointerId)) options.viewport.value.releasePointerCapture(event.pointerId)
    dragging.value = pointers.size > 0
  }

  function wheel(event: WheelEvent) {
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportSize.value.height : 1)
    zoomTo(zoom.value * Math.exp(-delta * 0.002), point(event))
  }

  function doubleClick(event: MouseEvent) { zoomTo(zoom.value > 1 ? 1 : 2.5, point(event)) }
  function keyboard(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (['+', '=', '-', '_', '0', 'Home'].includes(event.key)) {
      event.preventDefault()
      if (['0', 'Home'].includes(event.key)) reset()
      else zoomTo(zoom.value + (['+', '='].includes(event.key) ? 0.5 : -0.5))
    } else if (zoom.value > 1 && event.key.startsWith('Arrow')) {
      event.preventDefault()
      moveTo({ x: pan.value.x + (event.key === 'ArrowLeft' ? 48 : event.key === 'ArrowRight' ? -48 : 0), y: pan.value.y + (event.key === 'ArrowUp' ? 48 : event.key === 'ArrowDown' ? -48 : 0) })
    }
  }

  onMounted(() => {
    const viewport = options.viewport.value
    if (!viewport) return
    const measure = () => {
      viewportSize.value = { width: viewport.clientWidth, height: viewport.clientHeight }
      moveTo(pan.value)
    }
    measure()
    observer = new ResizeObserver(measure)
    observer.observe(viewport)
    window.addEventListener('blur', clearPointers)
  })
  watch(() => [options.width(), options.height()], reset)
  onBeforeUnmount(() => { observer?.disconnect(); clearPointers(); window.removeEventListener('blur', clearPointers) })

  return { zoom: readonly(zoom), dragging: readonly(dragging), imageStyle, zoomTo, reset, pointerDown, pointerMove, pointerUp, wheel, doubleClick, keyboard }
}
