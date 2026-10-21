# Wall light reveal

1. Add `useLightingIntro`: scene-local off/revealing/on state, one scoped document click listener and one cancellable 1.8-second animation frame chain. Keyboard and reduced-motion activation finish immediately; replay restarts safely.
2. Add `RoomLightControl`: localized native button with typed phase/locale props and activate/replay events. Keep navigation available and hide the control during focus/editor use.
3. Compose the intro with unchanged `useRoomLighting` in `RoomScene`. Start at `#090b0c`, zero environment/key/fill/accent emission and tiny silhouette moonlight; gate highlights while off. Derive delayed illumination and screen/shelf fades from progress.
4. Extend runtime finish with independent native wall-strip material uniforms and four inexpensive warm 3D halo planes. Reveal the side strips upward, then the top across; restore original materials and remove/dispose only owned resources on teardown.
5. Add focused lifecycle/browser coverage and update the existing lighting workflow to activate by keyboard before checking day mode. Document changes; parent runner owns all verification and preview.

No section 4 contract, camera/editor coordinate, cached geometry, GLB or Blender checkpoint changes. Preserve existing dirty work and page day-contrast selectors.

## Implemented

- `useLightingIntro.ts` owns progress, phase, a delayed illumination multiplier and a later accent multiplier. One passive document capture listener observes the first click without cancelling its original action. The light button handles its own click so neither switch nor replay starts twice. Replay cancels the previous frame; scope disposal cancels frames and removes the listener. Enter/Space-generated clicks and reduced motion go directly to the final state, including preference changes during the reveal.
- `RoomLightControl.vue` is a native, focus-visible button. Both labels use the existing `content/portfolio.ts` UI localization convention. RoomScene hides it while focused or editing; the HUD and accessible object actions stay available throughout.
- `RoomScene.vue` composes the unchanged system-lighting composable with the intro. Background starts at `#090b0c`; environment, key/fill, wall/shelf lights and authored emission start at zero, with hemisphere intensity 0.02 for silhouettes. Screens/phone and highlights use the accent multiplier so hovering cannot illuminate them while off. Material lighting and highlight updates run together, including system preference changes.
- `useRoomFinish.ts` clones wall-strip materials independently and manages the reveal helper. `utils/wallLightReveal.ts` computes native strip bounds, masks each strip's emission in its shader, and adds four warm additive halo planes attached to the model. Side strips rise over the first 70% of 1.8 seconds, then the top fills left-to-right; the bottom establishes the starting edge. No postprocessing, new package, remote asset, or extra lights were added.
- Room bounds are measured before adding halos, preserving camera framing. Native geometry/transforms stay untouched. Teardown removes the halo group, disposes owned plane geometry/materials, and restores original native materials through the existing finish cleanup.
- State is exposed as `data-light-phase`, numeric `data-light-progress`, and `data-lighting` (dark while off, then system preference). An additional backdrop attribute keeps copy readable during the early day-mode fade. `pages/index.vue` has only additive contrast CSS and a dark fallback color; its existing day-mode selectors and route composition remain intact.

## Verification handoff

Added `tests/lightingIntro.spec.ts` for click preservation, replay, reduced motion and cleanup; `tests/roomFinishReveal.spec.ts` for emission, per-strip material isolation, endpoints and resource restoration; and `e2e/wallLightReveal.spec.ts` for off → revealing → on, original click actions, replay, keyboard, reduced motion, editor independence and mobile navigation/overflow. Updated the existing system-lighting E2E to activate the switch by keyboard before asserting day mode.

No lint, typecheck, tests, build, browser preview or visual verification was run in this invocation, as requested. The parent runner should run the checks and visually inspect the native rising edges/halo depth, early day-mode text contrast, and desktop/mobile framing. All preexisting dirty work was retained; the public GLB and Blender checkpoint were not edited.

## Completed verification

The parent runner passed lint, typecheck, all 31 unit tests, production build and all 14 Playwright workflows. The existing large scene bundle warning remains. Captured previews are `docs/renders/room-style/wall-light-off.png`, `wall-light-rising.png` and `wall-light-on.png`; the rising frame was captured with the browser clock paused at progress 0.328 to visually confirm that both side strips illuminate from the bottom while the top remains dark. No browser page or console errors were recorded. The interactive localhost preview is left at its dark starting state, ready for the first click; Replay room lights restarts the effect.
