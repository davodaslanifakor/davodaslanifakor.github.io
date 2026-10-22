<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { SceneObject } from '~/content/portfolio'
import { localize, profile, sceneObjects, ui } from '~/content/portfolio'
import MiniEditor from '~/components/editor/MiniEditor.vue'
import RoomScene from '~/components/scene/RoomScene.vue'
import RoomRecovery from '~/components/scene/RoomRecovery.vue'
import RoomLightControl from '~/components/scene/RoomLightControl.vue'
import AccessibleObjectNav from '~/components/ui/AccessibleObjectNav.vue'
import ObjectModal from '~/components/ui/ObjectModal.vue'
import SceneHud from '~/components/ui/SceneHud.vue'
import { useWorldTime } from '~/composables/useWorldTime'

const scene = useSceneStore()
const { focusedId, hoveredId, mode, soundOn, nowPlaying, musicPlayback, screenTheme } = storeToRefs(scene)
const { locale, direction, toggleLocale } = usePortfolioLocale()
const { setEnabled: setAmbientEnabled } = useAmbientSound()
const { epochMs, reducedMotion } = useWorldTime()
const { recommendedQuality, shouldUseCvFallback } = useQuality()
const editorClose = useTemplateRef<HTMLButtonElement>('editorClose')
const isReady = shallowRef(false)
const viewResetCount = ref(0)
const siteUrl = useRuntimeConfig().public.siteUrl
const socialImage = new URL('/og-portfolio.jpg', siteUrl).href
const pageTitle = computed(() => `${profile.name} — ${localize(ui.roomTitle, locale.value)}`)

const activeObject = computed(() => sceneObjects.find((object) => object.id === focusedId.value) ?? null)
const modalContent = computed(() => activeObject.value?.action === 'modal' && activeObject.value.contentRef !== 'music' ? activeObject.value.contentRef ?? '' : '')
let returnFocus: HTMLElement | null = null
useHead(() => ({
  title: pageTitle.value,
  link: [{ rel: 'canonical', href: new URL('/', siteUrl).href }],
  meta: [
    { name: 'description', content: 'Explore the work of senior Vue.js engineer and technical lead Davoud Fakour through an interactive room.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: profile.tagline.en },
    { property: 'og:image', content: socialImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: pageTitle.value },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle.value },
    { name: 'twitter:description', content: profile.tagline.en },
    { name: 'twitter:image', content: socialImage },
  ],
}))

function activate(object: SceneObject) {
  if (object.action === 'toggle-sound') {
    void toggleSound()
    return
  }
  if (object.action === 'tooltip') {
    scene.$patch({ hoveredId: object.id })
    return
  }
  returnFocus = document.querySelector<HTMLElement>(`[data-object-id="${object.id}"]`)
  scene.$patch({
    focusedId: object.id,
    mode: object.action === 'zoom-editor' ? 'editor' : 'focused',
  })
  nextTick(() => document.querySelector<HTMLElement>('.modal .close')?.focus())
}

function closeLayer() {
  scene.$patch({ focusedId: null, mode: 'explore' })
  const target = returnFocus
  returnFocus = null
  nextTick(() => target?.focus())
}

function resetView() {
  if (focusedId.value) closeLayer()
  viewResetCount.value++
}

function setHovered(objectId: string | null) {
  scene.$patch({ hoveredId: objectId })
}

async function toggleSound() {
  const next = !soundOn.value
  scene.$patch({ soundOn: next })
  await setAmbientEnabled(next)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && (mode.value === 'focused' || mode.value === 'editor')) {
    closeLayer()
    return
  }
  if (event.key !== 'Tab' || mode.value !== 'editor') return
  const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]:not([aria-hidden="true"])')
  if (!dialog) return
  const controls = [...dialog.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')]
    .filter(control => control.getClientRects().length > 0)
  const first = controls[0]
  const last = controls.at(-1)
  if (!first || !last) return
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (mode.value === 'loading' || mode.value === 'intro') scene.$patch({ mode: 'explore' })
  isReady.value = true
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  scene.setNowPlaying(null)
})

watch(mode, async (nextMode) => {
  if (nextMode !== 'editor') return
  await nextTick()
  if (window.matchMedia('(max-width: 760px)').matches) editorClose.value?.focus()
})

watch(recommendedQuality, quality => scene.$patch({ quality }), { immediate: true })
watch(shouldUseCvFallback, (shouldFallback) => {
  if (shouldFallback) navigateTo('/cv')
})
</script>

<template>
  <main class="room-page" :dir="direction" :data-ready="isReady">
    <SceneHud
      :locale="locale"
      :sound-on="soundOn"
      :screen-theme="screenTheme"
      :game-active="activeObject?.action === 'play-game'"
      @toggle-locale="toggleLocale"
      @toggle-sound="toggleSound"
      @reset-view="resetView"
      @select-screen-theme="scene.setScreenTheme($event)"
    />

    <section v-show="activeObject?.action !== 'play-game'" class="room-intro" aria-labelledby="room-title">
      <p class="intro-label">{{ localize(ui.portfolioLabel, locale) }}</p>
      <h1 id="room-title" class="intro-title">{{ localize(ui.roomTitle, locale) }}</h1>
      <p class="intro-copy">{{ localize(profile.tagline, locale) }}</p>
      <p class="intro-hint">{{ localize(ui.roomNavigationHint, locale) }}</p>
    </section>

    <ClientOnly>
      <RoomRecovery v-slot="{ fail }" :locale="locale" @retry="resetView">
        <RoomScene
          :objects="sceneObjects"
          :locale="locale"
          :focused-id="focusedId"
          :hovered-id="hoveredId"
          :sound-on="soundOn"
          :screen-theme="screenTheme"
          :now-playing="nowPlaying"
          :music-playback="musicPlayback"
          :editor-active="mode === 'editor'"
          :clock-epoch="epochMs"
          :reduced-motion="reducedMotion"
          :view-reset-count="viewResetCount"
          @activate="activate"
          @hover="setHovered"
          @close-editor="closeLayer"
          @close-music="closeLayer"
          @close-game="closeLayer"
          @select-music="scene.setNowPlaying($event)"
          @music-playback="scene.setMusicPlayback($event)"
          @failed="fail"
        />
      </RoomRecovery>
      <template #fallback>
        <div class="scene-fallback">
          <RoomLightControl phase="off" :locale="locale" :ready="false" />
        </div>
      </template>
    </ClientOnly>

    <AccessibleObjectNav v-show="activeObject?.action !== 'play-game'" :locale="locale" :objects="sceneObjects" :active-id="focusedId" @activate="activate" />

    <Transition name="layer">
      <ObjectModal
        v-if="modalContent"
        :content-ref="modalContent"
        :locale="locale"
        :epoch-ms="epochMs"
        @close="closeLayer"
      />
    </Transition>

    <Transition name="layer">
      <div v-if="mode === 'editor'" class="editor-overlay" role="dialog" aria-modal="true" :aria-label="localize(ui.editorTitle, locale)">
        <button ref="editorClose" class="editor-close" type="button" @click="closeLayer">← {{ localize(ui.back, locale) }}</button>
        <MiniEditor class="editor-mobile" :locale="locale" />
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.room-page {
  --acid: #c6d8a2;
  --muted: #a4aaa0;
  position: relative;
  min-height: 100svh;
  height: 100svh;
  overflow: hidden;
  background: radial-gradient(ellipse at 70% 30%, #292d25 0, #181c18 50%, #121612 100%);
}
.room-intro {
  position: absolute;
  z-index: 4;
  inset-block-start: 5.5rem;
  inset-inline-start: clamp(1rem, 3vw, 2.5rem);
  padding: 0;
  display: grid;
  gap: .45rem;
  pointer-events: none;
}
/* The day scene needs dark copy; the focused editor retains the dark-scene HUD. */
.room-page:has(.room-scene[data-lighting="light"]):not(:has(.editor-close)) .room-intro,
.room-page:has(.room-scene[data-lighting="light"]):not(:has(.editor-close)) :deep(.hud .identity) {
  --ink: #222822;
  --muted: #414a41;
  --acid: #435326;
  --line: rgb(34 40 34 / 24%);
  color: var(--ink);
}
.room-page:has(.room-scene[data-lighting="light"]):not(:has(.editor-close)) :deep(.hud .contact-link) {
  border-color: rgb(50 66 31 / 40%);
  background: rgb(255 255 255 / 22%);
  color: #32421f;
}
/* Keep copy readable while the day scene's background is still warming up. */
.room-page:has(.room-scene[data-light-backdrop="dark"]):not(:has(.editor-close)) .room-intro,
.room-page:has(.room-scene[data-light-backdrop="dark"]):not(:has(.editor-close)) :deep(.hud .identity) {
  --ink: #f2efe8;
  --muted: #a4aaa0;
  --acid: #c6d8a2;
  color: var(--ink);
}
.room-page:has(.room-scene[data-light-backdrop="dark"]):not(:has(.editor-close)) :deep(.hud .contact-link) {
  border-color: rgb(242 239 232 / 32%);
  background: rgb(12 16 14 / 76%);
  color: #f2efe8;
}
.intro-label { grid-column: 1 / -1; }
.intro-label,.intro-title,.intro-copy,.intro-hint { margin: 0; }
.intro-label { color: var(--acid); font: .68rem/1 var(--font-mono); letter-spacing: .13em; text-transform: uppercase; }
.intro-title { margin-top: .3rem; font: 500 clamp(1.5rem, 2.2vw, 2rem)/1.1 var(--font-display); letter-spacing: -.04em; }
.intro-title em { color: transparent; font-style: normal; -webkit-text-stroke: 1px rgb(242 239 232 / 62%); }
.intro-copy { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); }
.intro-hint { max-inline-size: 21rem; padding-bottom: .25rem; color: var(--muted); font: .7rem/1.7 var(--font-mono); text-wrap: balance; }
.scene-fallback { position: absolute; inset: 0; background: #090b0c; }
.editor-overlay { display: none; position: fixed; z-index: 90; inset: auto auto 1.5rem 50%; transform: translateX(-50%); border: 1px solid var(--line); background: #0c0e11; box-shadow: 0 20px 60px #000; }
.editor-close { justify-self: start; min-height: 2.8rem; border: 0; padding: .7rem 1rem; background: #0c0e11; color: var(--acid); font: .74rem/1 var(--font-mono); }
.editor-mobile { display: none; }
.layer-enter-active,.layer-leave-active { transition: opacity 220ms ease, transform 220ms ease; }
.layer-enter-from,.layer-leave-to { opacity: 0; transform: translateY(12px) scale(.985); }
@media (max-width: 760px) {
  .room-intro { inset-block-start: 5.4rem; gap: .2rem; }
  .intro-title { margin-top: .25rem; }
  .intro-hint { max-inline-size: 17rem; font-size: .62rem; }
  .editor-overlay { display: grid; inset: .5rem; min-height: 0; grid-template-rows: auto 1fr; transform: none; }
  .editor-mobile { display: grid; }
}
@media (max-width: 1100px) and (min-aspect-ratio: 1/1) {
  .room-intro { inset-block-start: 4.2rem; max-inline-size: 10rem; gap: .2rem; }
  .intro-label { font-size: .5rem; letter-spacing: .08em; }
  .intro-title { font-size: 1rem; line-height: 1.12; overflow-wrap: anywhere; }
  .intro-hint { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); }
}
@media (max-width: 760px) and (min-aspect-ratio: 1/1) {
  .room-intro { max-inline-size: 7.5rem; }
  .intro-title { font-size: .8rem; }
  .intro-label { font-size: .42rem; }
}
</style>
