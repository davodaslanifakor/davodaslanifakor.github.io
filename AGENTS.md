# Portfolio workspace guide

Read `README.md` before changing the project. Existing Blender mesh names, authored cameras, content types and scene state are stable contracts; flag any required change before making it.

## Commands

- `pnpm dev` — local development
- `pnpm lint` — ESLint
- `pnpm typecheck` — Nuxt/Vue TypeScript checks
- `pnpm test` — Vitest
- `pnpm test:e2e` — Playwright
- `pnpm build` — production build

## Conventions

- Vue 3 Composition API with `<script setup lang="ts">`.
- Route files are composition surfaces. Feature presentation lives under `components/`; reusable stateful behavior lives in `composables/`.
- Shared scene/UI state belongs in `stores/scene.ts`; derive display values with computed state.
- All portfolio copy comes from `content/portfolio.ts`. Missing facts use `TODO(David)` and are never invented.
- Components use typed props and emits. Interactive controls must be keyboard accessible and respect reduced motion.
- Keep the 2D `/cv` route SSR-first and independent from the 3D bundle.
- Preserve existing Blender mesh, camera, content, and Pinia contracts.

## Component map

- `pages/index.vue`: composes the scene, HUD, accessible object navigation, and modal/editor layers.
- `components/scene/RoomScene.vue`: owns the responsive placeholder room and emits object activation/hover events.
- `components/ui/SceneHud.vue`: persistent navigation, locale/sound/quality controls; emits user intent.
- `components/ui/ObjectModal.vue`: accessible modal shell and content renderer; emits close.
- `components/ui/AccessibleObjectNav.vue`: keyboard/screen-reader alternative to 3D interaction; emits activation.
- `components/cv/*`: focused presentation components for profile, timeline, skills, case studies, and contact.
- `components/editor/MiniEditor.vue`: standalone interactive editor demo with typed internal state and reset/export actions.
- `composables/useCameraRig.ts`: focused-scene transition state and reduced-motion-aware timing.
- `composables/useQuality.ts`: WebGL/device capability assessment.
- `stores/scene.ts`: single source of truth for scene mode and selection.

## Verification

Before handoff, run lint, typecheck, unit tests, and build. Run Playwright where browser dependencies are available.
