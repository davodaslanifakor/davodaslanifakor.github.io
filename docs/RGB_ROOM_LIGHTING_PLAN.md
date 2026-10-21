# RGB room lighting

## Current behavior

Color configuration CTAs (Warm, RGB, Pause colors and Resume colors) have been removed. RGB remains the default wall/mat effect, with a single localized Turn on room lights / Replay room lights button controlling the reveal. Dark start, instant keyboard activation, static reduced-motion colors, and hidden/focused animation pausing remain unchanged. The parent passed lint, typecheck and diff whitespace checks and visually inspected the simplified preview (`docs/renders/room-style/room-rgb-default.png`). Existing control/browser test expectations were updated; tests and build were not rerun for this removal. The notes and verification below describe the earlier configuration UI.

## Plan

- Use a restrained, slow spatial spectrum wave across native wall strips, their halos, and the desk-mat rim. Inspiration: [Razer Chroma](https://www.razer.com/chroma) and [Wave / spectrum cycling](https://mysupport.razer.com/app/answers/detail/a_id/13713); visual reference only, no hardware integration.
- Preserve dark start and the existing upward reveal. RGB is the default; warm mode restores the authored wall effect. Keep screens readable and shelf lighting warm.
- `RoomLightControl` owns localized native Warm/RGB and Pause/Resume buttons beside replay, emitting typed intent. `useRoomColors` owns transient mode, pause and a nonreactive clock. `RoomScene` supplies its existing toy RAF and hides controls during focus/editor.
- `useRoomFinish` owns one shared palette uniform set and all added resources. A rounded horizontal shader ring follows native `static_desk_mat` plus rim bounds, independently of the floor rug and camera framing.

## Implementation notes

- One world-space GLSL palette creates positional gradients and a 36-second cycle. Wall emission and halos share uniforms with the desk ring; reveal progress remains independent. The native wall shader has a new program cache key.
- Desk core is approximately 2.5 mm wide with a gentle 5 mm outer halo, at the higher mat/rim surface + 1 mm. Its center is discarded, depth testing stays enabled, and depth writing stays disabled. Native mat/rim materials, geometry and transforms are preserved. Added group, geometry and material are removed/disposed by the finish scope.
- No color time advances while off, paused, warm, focused/in the editor, hidden, or reduced motion. Timestamp invalidation prevents resume jumps; no per-frame Vue mutations or new RAF loop. Reduced motion retains a static spectrum and the existing immediate reveal completion.
- Lighting-control clicks are excluded through the existing `data-light-control` ancestor guard. Mode/pause actions explicitly activate lights only while off; only replay restarts the reveal. Buttons expose pressed/disabled states, focus-visible styling, 44 px targets and wrapping mobile layout. New labels have English/Persian entries in `content/portfolio.ts`.
- Runtime attributes: `data-color-mode="rgb|warm"` and `data-color-motion="running|paused|static"`. Original Pinia, camera, Blender/GLB and content-fact contracts are unchanged; no packages, remote assets, lights or postprocessing added.

## Parent verification

Focused tests added in `tests/deskMatBorder.spec.ts`, `tests/roomColors.spec.ts` and `tests/roomLightControl.spec.ts` cover native bounds, fades, shared uniforms, resource ownership, clock freezing, control activation and reduced motion. Existing unit/browser workflows remain intact. Tests, lint, typecheck, build and browser preview were **not run**, as requested; parent runs verification.

Inspect full-room and close desk views: thin continuous rounded border follows the mat beneath laptop/phone/mouse, respects tool occlusion, and never outlines the floor carpet. Check wall/core/halo color coherence, warm restoration, dark start and upward replay, paused/static colors, screen readability and warm shelf ambience. Check 360 px mobile and Persian layout, keyboard controls, reduced motion, focus/editor hiding and hidden-tab resume.

## Completed verification

Parent checks passed lint, typecheck, 39 unit tests and production build; the existing large scene bundle warning remains. Browser coverage includes all 17 workflows: the full run passed 16 and exposed an overly strict test locator for the numbered Visual editor button; after correcting that locator, all three RGB browser tests passed. Existing 14 room/reveal workflows passed in the full run. The new workflows cover keyboard mode switching, pause/resume without replay, editor hiding, static reduced-motion colors, and 360 px EN/FA controls without horizontal overflow.

The parent visually inspected the live running RGB preview and captured `docs/renders/room-style/room-rgb-overview.png` and `room-rgb-mat.png`. The border follows the actual mat beneath laptop, phone and mouse with device occlusion intact. No page or console errors were recorded during capture. The live preview is left illuminated in RGB mode with the color wave running and the mat visible.
