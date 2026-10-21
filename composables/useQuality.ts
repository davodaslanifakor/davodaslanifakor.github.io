import { computed, onMounted, onScopeDispose, readonly, shallowRef } from 'vue'
import type { SceneQuality } from '~/stores/scene'

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number
}

function probeGraphics() {
  if (typeof document === 'undefined') return { supported: true, software: false }
  let context: WebGL2RenderingContext | null = null
  try {
    const canvas = document.createElement('canvas')
    // Three r163+ requires WebGL 2, even when a WebGL 1 context is available.
    context = window.WebGL2RenderingContext ? canvas.getContext('webgl2') : null
    const info = context?.getExtension?.('WEBGL_debug_renderer_info')
    const renderer = info ? String(context?.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    return { supported: Boolean(context), software: /swiftshader|llvmpipe|software|basic render/i.test(renderer) }
  }
  catch {
    return { supported: false, software: false }
  }
  finally {
    context?.getExtension?.('WEBGL_lose_context')?.loseContext()
  }
}

export function supportsWebGL(): boolean {
  return probeGraphics().supported
}

export function useQuality() {
  const webglSupported = shallowRef(true)
  const isWeakDevice = shallowRef(false)
  const devicePixelRatio = shallowRef(1)
  const viewportPixels = shallowRef(1)
  function syncPixelRatio() {
    devicePixelRatio.value = window.devicePixelRatio || 1
    viewportPixels.value = Math.max(1, window.innerWidth * window.innerHeight)
  }

  const recommendedQuality = computed<SceneQuality>(() =>
    webglSupported.value && !isWeakDevice.value ? 'high' : 'low',
  )
  const pixelRatio = computed(() => {
    const density = recommendedQuality.value === 'high'
      ? Math.min(devicePixelRatio.value, 2)
      : 1
    // OS display scaling and large Windows monitors can otherwise multiply GPU work.
    const budget = recommendedQuality.value === 'high' ? 4_000_000 : 2_000_000
    return Math.min(density, Math.sqrt(budget / viewportPixels.value))
  })
  const shadowsEnabled = computed(() => recommendedQuality.value === 'high')
  const shouldUseCvFallback = computed(() => !webglSupported.value)

  onMounted(() => {
    syncPixelRatio()
    window.addEventListener('resize', syncPixelRatio)
    const graphics = probeGraphics()
    webglSupported.value = graphics.supported
    const navigatorWithMemory = navigator as NavigatorWithDeviceMemory
    const hasLowMemory = (navigatorWithMemory.deviceMemory ?? 8) <= 4
    const hasFewCores = (navigator.hardwareConcurrency ?? 8) <= 4
    isWeakDevice.value = hasLowMemory || hasFewCores || graphics.software
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
