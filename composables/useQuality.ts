import { computed, onMounted, onScopeDispose, readonly, shallowRef } from 'vue'
import type { SceneQuality } from '~/stores/scene'

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number
}

export function supportsWebGL(): boolean {
  if (typeof document === 'undefined') return true

  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGL2RenderingContext && canvas.getContext('webgl2')
      || window.WebGLRenderingContext && canvas.getContext('webgl'),
    )
  }
  catch {
    return false
  }
}

export function useQuality() {
  const webglSupported = shallowRef(true)
  const isWeakDevice = shallowRef(false)
  const devicePixelRatio = shallowRef(1)
  function syncPixelRatio() {
    devicePixelRatio.value = window.devicePixelRatio || 1
  }

  const recommendedQuality = computed<SceneQuality>(() =>
    webglSupported.value && !isWeakDevice.value ? 'high' : 'low',
  )
  const pixelRatio = computed(() => {
    return recommendedQuality.value === 'high'
      ? Math.min(devicePixelRatio.value, 2)
      : 1
  })
  const shadowsEnabled = computed(() => recommendedQuality.value === 'high')
  const shouldUseCvFallback = computed(() => !webglSupported.value)

  onMounted(() => {
    syncPixelRatio()
    window.addEventListener('resize', syncPixelRatio)
    webglSupported.value = supportsWebGL()
    const navigatorWithMemory = navigator as NavigatorWithDeviceMemory
    const hasLowMemory = (navigatorWithMemory.deviceMemory ?? 8) <= 4
    const hasFewCores = (navigator.hardwareConcurrency ?? 8) <= 4
    isWeakDevice.value = hasLowMemory || hasFewCores
  })
  onScopeDispose(() => {
    if (typeof window !== 'undefined') window.removeEventListener('resize', syncPixelRatio)
  })

  return {
    isWeakDevice: readonly(isWeakDevice),
    pixelRatio,
    recommendedQuality,
    shadowsEnabled,
    shouldUseCvFallback,
    webglSupported: readonly(webglSupported),
  }
}
