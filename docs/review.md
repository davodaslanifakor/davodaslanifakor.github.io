# Phase 6 review

## Current status

The portfolio ships a reference-led procedural reconstruction of the desk rather than the earlier fictional room. The checked-in GLB is generated from `tools/blender/`, follows the amended mesh/camera contract, and is paired with a fast SSR `/cv` route. The visual asset is still undergoing likeness review; it should not be described as final until David approves the corrected clock, mouse, elephant, and monitor-arm pass.

Desktop editor mode mounts the real Vue DOM editor onto `int_monitor_screen` through a CSS3D renderer synchronized to the Tres camera. Mobile keeps the editor in a full-screen dialog. All 12 scene actions remain reachable through the visible accessible object navigation.

## Verified

- `public/models/room.glb`: 2.14 MB (embedded textures 79 KB), under the 3 MB model budget.
- Blender camera data is generated from the same source as the GLB.
- Wide and object-level verification renders live in `docs/renders/*-final.png`.
- Lint, strict TypeScript, unit tests, production build, and Playwright browser flows pass locally.
- Browser coverage includes all modal actions, the plush tooltip, sound default/off toggle, editor color/drag/reset/Escape, mobile editor mode, locale direction, and `/cv` navigation.
- Motion honors `prefers-reduced-motion`; toy movement occurs only while the corresponding object is highlighted.
- A 1200×630 social preview is shipped with Open Graph and Twitter card metadata on both routes.
- The latest likeness pass replaces the floating generic monitor feet with a desk-clamped dual hydraulic arm, corrects the clock silhouette and handle, gives the Magic Mouse a low two-part shell, and turns the edge-on elephant toward the viewer with readable folded-metal construction. These changes remain subject to David's visual approval.

## Blocking before publication

- **Content:** David must provide exact employment dates, contact details, the final CV PDF, architecture copy, and approved final case-study copy.
- **Permission:** confirm that the text-only description of Zoviz's editor may be published.
- **Localization:** Persian fields remain `TODO(translate)` pending native-speaker review.
- **Design inputs:** reconcile modal styling with final Figma frames when supplied.
- **Visual fidelity:** the desk is a stylized procedural reconstruction, not a scan. For near-photographic equivalence, the next asset step is photogrammetry or manually UV-textured production models.
- **Performance:** the Three/Tres scene chunk is about 1.08 MB minified / 301 kB gzip. It is isolated from `/cv`, but the 3D route should receive a final Lighthouse run on the deployment target.

## Deployment notes

The Nuxt output is compatible with Vercel's Nuxt preset. Add the custom domain after production deployment. Redirects from the existing site should be based on an inventory of its real indexed URLs rather than guessed in advance.

The amended desk uses glTF PBR materials and runtime-generated screen canvases; the original fictional-room `room_day.ktx2` requirement no longer applies. If a future photoreal texture bake is introduced, use KTX2 and retain the 4 MB texture budget.

## Object likeness pass — 2026-09-16 (implemented, awaiting David's visual review)

Implemented against `docs/OBJECT_DESIGN_IMPLEMENTATION_PLAN.md`, objects 01–14. Nothing here is "accepted by David". Evidence lives in `docs/renders/object-review/<object>/` (Blender before/after, reference comparisons for clock and Joker) and `docs/renders/object-review/browser/` (desktop wide, focused clock/Joker/elephant/plush/phone, editor, mobile, captured from the running app).

| # | Object | Implemented | Visually inspected (Blender + browser) | Accepted by David |
| - | --- | --- | --- | --- |
| 01 | Clock | yes | yes | pending |
| 02 | Joker (`bugjar`) | yes | yes | pending |
| 03 | Elephant | yes | yes | pending |
| 04 | Magic Mouse | yes | Blender; wide browser view only | pending |
| 05 | Monitor arm + cables | yes | Blender rear/side/clamp; front in browser | pending |
| 06–08 | Placard, hula, coat Minions | yes | Blender focus + trio; wide browser view | pending |
| 09 | Plush | yes | yes | pending |
| 10 | Speakers | yes | yes | pending |
| 11 | USB hub + cable | yes | Blender | pending |
| 12 | Phone + stand | yes | Blender; browser phone focus | pending |
| 13 | Laptop + riser | yes | Blender; browser editor view | pending |
| 14 | Monitor bezels, mat, side cabinet | yes | Blender + browser wide | pending |

**Tooling added.** `tools/blender/lib/texpaint.py` rasterises printed artwork (clock dial, Joker torso/face, PEACE placard, plush mask, keyboard, ASUS mark) from code with numpy, using Blender's built-in Inter font (SIL OFL). No photo pixels are used. `util.py` gained `tube`, `prism`, `disc`, `sheet`, `ribbon`, `lathe`, `cut_hole`, `rounded_rect`, `thicken_polyline`. `pnpm preview:model` accepts `--eye x,y,z --target x,y,z` for review-only angles.

**Fix with scene-wide effect.** `util.box()` had inward-facing faces. It now winds outward. This made box boolean cutters work (hub ports) and corrects normals on every box.

**Composition changes.** The mat now runs from under the phone to past the phone stand, with its back edge in front of the hub and speakers, which stand on the bare desk. The side cabinet now stands on the floor right of the desk (`desk-wide-dark.jpg`), so the clock moved from x 0.79 to 0.907 and `cam_clock` moved with it. The phone and elephant are re-angled.

**Inferred, not visible in references.** Rear arm mechanism and clamp (plausible gas-spring dual arm, not a product match); phone-stand fold geometry; riser legs; monitor rear housing; hub internals; hidden backs of the toys.

**Known remaining differences.**
- Coat Minion: open collar/flap edges are single-sheet thin.
- Joker: the neck band is a ring, not the photo's diagonal strap.
- Hula skirt lumps are regular.
- Plush fur is a painted streak texture, not a pile.
- Tail stripe joins show slight zig-zag seams up close.
- PEACE lettering is Inter-bold, not the hand-drawn bubble face.
- Mat logo omitted.
- Speaker ring size is approximate.

**Pre-existing, not caused by this pass (fixed 2026-09-25, see below).** In headless Chromium the desktop CSS3D editor renders mirrored and tilted above the laptop screen. The baseline GLB (`docs/renders/room-baseline.glb`) produces the identical overlay, and the e2e editor test still passes. It needs a separate investigation in a real browser.

**Verification (2026-09-16).** `pnpm build:model` OK; lint OK; typecheck OK; unit tests 9/9; production build OK; Playwright 5/5. All `int_*`, `root_*`, `cam_*` contract names are present in the GLB.

**Next session.** Get David's review of the renders. Then fix whichever differences above he prioritises, look into the editor overlay, and consider trimming `docs/renders/object-review` (≈79 MB of PNGs) before the first commit.

## Follow-up pass — 2026-09-25 (implemented, awaiting David's visual review)

**Editor overlay fixed.** It also reproduced in a real browser (the app's browser pane): the DOM editor lay 90° off the laptop screen and upside-down. Cause: the Y-up glTF export maps `int_monitor_screen`'s Blender +Z normal to local +Y in three.js, while a `CSS3DObject` faces its own +Z. `components/scene/MonitorEditorSurface.vue` now applies a constant −90° X correction after copying the screen's world quaternion. The mesh contract (flat, Blender local +Z, UVs 0–1) is unchanged. Checked at 1024×768 (browser pane: pointer hit-testing lands on the editor's own elements) and 1440×900 headless (`browser/editor-aligned.png`); the mobile full-screen editor path is unaffected (the CSS3D host is hidden below 760 px). The amber tint on the laptop body in focus is the runtime selection highlight, not the material.

**Likeness differences addressed.**
- Joker: the neck ring is replaced by a flat ribbon strap (`_strap`) that follows the cape line at the back and crosses the front diagonally, from beside the chin on the left to the right shoulder, as in `figure-green-hair.jpg`. Evidence: `bugjar/after-strap-close.png`.
- Coat Minion: the coat, flap and collar are now closed-profile solids with 0.8–1.1 mm cloth thickness and end caps (`util.thick_profile` + capped partial `lathe`). Evidence: `robot/after-collar-thickness.png`.
- Hula skirt: tufts get fixed pseudo-random jitter in angle, height, size and tilt, identical on every build. Evidence: `paratrooper/after-irregular-skirt.png`.
- PEACE placard: heavier, rounded dilation gives fatter, nearly touching bubble letters. `texpaint` uses denser offset rings when bold > 0.02, and the other textures are unaffected. Evidence: `cards/after-bubble-lettering.png`.
- Plush tail: one continuous tube, striped per face ring with a soft puff per stripe; no seams at stripe joins. Evidence: `plush/after-continuous-tail.png`.

**Still open.** Plush fur remains a painted texture (the plan allows a restrained baked fabric look); mat logo omitted; speaker ring size approximate; PEACE letters are dilated Inter, not a true hand-drawn face.

**Verification (2026-09-25).** `pnpm build:model` OK; GLB 2,142,940 bytes (79 KB embedded textures); no `int_*`/`root_*`/`cam_*` name missing against `room-baseline.glb`; lint OK; typecheck OK; unit tests 9/9; production build OK (3.98 MB / 980 kB gzip); Playwright 5/5.

## Room presentation pass — 2026-09-25 (implemented; browser review pending)

The existing browser evidence showed a uniformly lit wall, nearly flat dark objects, overly bright screens, and navigation covering the desk. This pass changes runtime presentation without changing the GLB, authored focus points, object IDs, content types, or Pinia contracts.

- `useRoomFinish.ts` owns cloned materials, deterministic plaster/fabric bump textures, and a locally generated 128px studio reflection environment. Allocations are disposed when the scene is removed. No external HDR asset or new dependency is needed.
- Meshes now cast and receive shadows, with a tightly bounded 2048px shadow map on capable devices. Hemisphere fill, a warm key, and restrained wall/screen lights replace uniform ambient lighting. ACES tone mapping applies to physical surfaces; screen artwork emits its intended color once, without additive diffuse overexposure.
- The scene sits inside a warm charcoal page with a framed viewport, clearer title hierarchy, and object navigation below the scene. Mobile navigation wraps. Responsive start-camera distance derives from the authored camera and viewport aspect; object focus cameras and CSS3D screen alignment are retained.
- The loading message and navigation hint come from localized portfolio content. Reduced motion and the existing low-quality shadow fallback are retained.

**Checks for this pass:** lint clean; typecheck passed; unit tests 9/9 passed; production build passed (scene chunk 1,083 kB / 303 kB gzip; existing bundle-size warning remains); `git diff --check` clean.

**Unverified:** desktop/mobile appearance, live pointer interactions, editor alignment after the viewport changes, and Playwright. Starting the local preview server and accessing the browser were blocked by the automatic approval review service returning HTTP 404 (missing API deployment), including after the user explicitly enabled access. No new screenshots were captured. Do not treat earlier browser screenshots or Playwright results as verification of this pass. Resume with live desktop/mobile inspection and `pnpm test:e2e` once the approval service works.

Branch creation was also blocked by the filesystem restriction on `.git`; these edits remain uncommitted on the existing branch.

## Room extension — 2026-09-29 (source implemented; generated-model verification pending)

The implementation follows `docs/ROOM_EXTENSION_PLAN.md` and its schematic. Contract amendments are recorded in `docs/DESK_PLAN.md`: the new `world_clocks` grouped object, phone demo mapping, live `/cv#contact` link, and 13 selectable objects. Portfolio facts were not invented; the selected bike/car/library are procedural display objects, and the phone content describes an educational simulation.

| Checkpoint | Implemented | Verified | Pending |
| --- | --- | --- | --- |
| Baseline/contracts | Existing polish edits preserved; contract amendment recorded | `git diff --check` clean | Browser baseline capture |
| Room blockout | Right wall/skirting, shelf, clocks, bike, Mustang, phone placement, room camera authored in Blender source | Python syntax check | Blender export; desktop/mobile evidence |
| MacBook | 110° physical opening calculation/assertion, keycap/legend atlas, transformed screen dimensions | Source and type checks | Blender angle assertion, keyboard close-up, editor/browser alignment |
| Library/collectibles | Oak/charcoal bookcase, books, cream road bike and green 1967 Mustang authored | Source inspection | GLB size, geometry/clearance and visual inspection |
| Time system | IANA timezone data, shared aligned scheduler, clock pivots/panel and laptop sync | DST/midnight/angles/scheduler unit coverage | Live model hand motion/resume in browser |
| Phone demo | iPhone 16 dimensions, persistent display canvas, shared deterministic scenario, host viewport metrics and reset, contact link | Unit/content/raycast and passing targeted Playwright assertions in initial run | Generated model and real iPhone Safari check |
| Integration | Locale/accessibility wiring and regression coverage | lint, typecheck, 16 unit tests, production build passed | Complete Playwright rerun; model/browser evidence and performance budget |

**Build blocker.** `pnpm build:model` runs the content exporter, then Blender 5.2.1 exits with SIGSEGV in its Metal backend initialization before executing the room scripts. Factory startup and an explicit Metal backend did not avoid the crash. Therefore neither the GLB nor generated camera-focus module was regenerated. Do not treat existing `public/models/room.glb` or screenshots as evidence for the extension. The authored 110° assertion, camera composition, GLB/texture budgets, draw calls, and actual browser visuals remain unverified until Blender starts successfully.

**Checks (2026-09-29).** `pnpm lint`, `pnpm typecheck`, `pnpm test` (16/16), and `pnpm build` pass. Production client build reports the existing large 3D chunk warning (1,095.59 kB minified; 306.39 kB gzip; total output 4.01 MB / 988 kB gzip). The content exporter succeeds. Playwright passes 7/7 with one worker, including RTL document direction, modal close, clock/phone demo, persistent Contact, and editor flows. No new screenshots were captured and nothing was deployed.

## Full viewport and clock follow-up — 2026-09-29

The room now fills the browser viewport; its object navigation sits in a compact bottom dock. Orbit and zoom limits are wider, with a visible Reset view control. The mobile start camera has a capped retreat so the desk and clocks remain legible. The desktop editor becomes interactive after its camera move and exposes a keyboard reachable dialog and close control. Closing a layer returns focus to its object button.

Per David's later city request, the four clocks now use Turkey/Istanbul, London, Stockholm, and Atlantic/Reykjavík in that order. A compact live time strip makes all four times readable even when wall plaques are small. The same IANA zone data drives the strip, modal, laptop artwork, and physical hand pivots. Blender now reads its plaque labels from the generated content JSON.

**Verified:** `pnpm build:model` exported a 2,617,124-byte GLB, below the 3 MB budget; `room_extension.blend` was saved. Live browser inspection found distinct hour-hand rotations and all four second hands advancing after a one-second interval. Desktop 1440×900, mobile 390×844, and narrow mobile 360×800 captures were inspected. `pnpm lint`, `pnpm typecheck`, `pnpm test` (16/16), `pnpm build`, and Playwright Chromium (8/8) pass. The Playwright flow includes keyboard clock activation, modal focus return, editor drag/reset/Escape, CV/contact access, and narrow mobile overflow. Screenshots are in `docs/renders/room-extension/06-final/`.

**Still pending at this pass:** the shelf plant was absent from the generated scene. Inspection found that the bundled asset contained no mesh objects. See the recovery update below for the repaired asset and remaining export work. A real iPhone Safari run, native-speaker Persian review, final CV/contact facts, permission for the editor description, and final performance audit remain pending before publication. No deployment occurred.

## Plant asset recovery — 2026-09-29

The empty bundled plant library was replaced with an optimized, self-contained Blender file made from Poly Haven's official 1K Potted Plant 02 glTF. The source downloads matched the hashes in Poly Haven's asset manifest. A separate Blender library load confirmed that `potted_plant_02` now contains `static_potted_plant_pot`, `static_potted_plant_leaves`, `static_potted_plant_dirt`, and `root_display_plant`. `tools/blender/lib/collectibles.py` now raises an error if the collection is empty, preventing another silent missing object.

**Pending:** the website GLB and room `.blend` still contain the earlier empty shelf. `pnpm build:model` was not executed: automatic approval review rejected the outside-sandbox Blender command because the workspace owner's spend cap was reached. The action was not judged unsafe. After the cap is increased, run `pnpm build:model`, save the rebuilt `tools/blender/room_extension.blend`, check the GLB stays below 3 MB, and inspect the shelf in Blender and the browser. The restored asset itself is ready.

## Procedural shelf plant — 2026-09-29

At David's request, the bookcase plant is now authored as a terracotta pot with soil, stems, and broad leaves in `tools/blender/lib/collectibles.py`. It replaces the Poly Haven mesh dependency. A normal sandboxed `pnpm build:model` was attempted, but Blender 5.2.1 again crashed during startup before executing the script (exit 139). The earlier outside-sandbox attempt remains blocked by the workspace owner's spend cap, so it was not repeated.

`tools/blender/patch_plant_glb.mjs` applies the same lightweight plant geometry to the current GLB without starting Blender. The resulting website asset is 2,720,632 bytes, below the 3 MB contract. A live browser reload shows the pot and leaves on the bookcase shelf. The saved `tools/blender/room_extension.blend` has not been updated; a future full Blender build will regenerate both it and the GLB from the Python source.

**Checks:** Python syntax, GLB header/root/budget, `git diff --check`, lint, typecheck, 16 unit tests, and production build pass. Playwright could not start its separate dev server while the existing preview was running on port 3001; a retry with the Nuxt lock override failed to allocate another port in the sandbox. The live browser check covers the plant's presence but does not replace the full Playwright suite.

## Wall clock presentation — 2026-09-30

David asked for the real time to appear on the physical wall clocks instead of in a floating time strip. The strip and its mobile variant were removed. The analog hands now rotate around the exported GLB pivots' local Y axis; the prior local Z rotation spun along each rod, leaving every visible hand at 12 despite correct time calculations. The shared IANA timezone data still drives Istanbul, London, Stockholm, and Atlantic/Reykjavík. The keyboard-accessible World clocks dialog retains precise digital readings and dates.

Live browser inspection confirmed distinct hand positions on all four clocks and no floating strip. The dialog opened from keyboard-accessible navigation and showed four current readings. Lint, typecheck, 16 unit tests, and production build passed. Playwright's headless Chromium could not launch in the sandbox (`MachPortRendezvousServer` permission denied), so full browser automation remains unverified for this pass.

## Browser zoom and room controls — 2026-09-30

Chrome page zoom at 150% and 200% made the title and navigation much larger than the 3D room, covering the wall clocks. The room now has keyboard-accessible +/− controls that move the scene camera within the same OrbitControls distance limits. The hint points to those controls. Compact landscape rules shorten the header, intro and object dock when browser zoom reduces the effective CSS viewport, while portrait mobile keeps its own layout. Chrome page zoom remains available for accessibility.

The +/− controls were exercised in the live in-app browser: zooming in changed the camera framing, and zooming out restored it. The Chrome overlap was observed before the CSS change; the user switched Chrome windows before a post-change Chrome screenshot could be captured, so the exact 150%/200% visual result still needs review. Lint, typecheck, 16 unit tests and the production build pass.
