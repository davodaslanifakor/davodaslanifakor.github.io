# Room extension — implementation brief for Opus 5.5

Prepared 2026-09-25. Status: **implementation source and Blender model updated; Blender viewport verified; browser verification pending** (2026-09-29). The saved scene and GLB are current. The local Nuxt preview server could not bind to `127.0.0.1` in this environment.

## 1. Outcome and decisions

Extend David's desk into a believable two-wall studio. Keep the current desk and recognizable objects as the focal point. Add four working timezone clocks above the monitors, a **right-hand wall** with a small library/bookcase and a potted plant, an iPhone 16 on the existing right-hand holder, and a MacBook with a physically measured 110° opening and readable keyboard lettering. David later asked to remove both the Mustang and bicycle from the bookcase display.

The user requested the extension, but asked for style suggestions. The choices below are **recommended implementation defaults**, not claimed personal preferences or approved final designs. If David selects alternatives, update this brief before detailing those objects. Do not block the basic layout on a style decision.

| Element | Recommended default | Alternatives offered |
| --- | --- | --- |
| Wall clocks | Four matching station-style clocks: ivory face, thin graphite rim, dark hands, a muted red seconds hand, city plaque underneath | Braun-inspired rounded squares in warm white; amber digital clocks in a shared charcoal rail |
| Cities | Turkey (Istanbul), London, Stockholm, Atlantic (Reykjavík), per David's later request | Use IANA zones and the same order in wall plaques, laptop art, and UI |
| Right wall | Muted olive-grey plaster, slightly darker than the back wall | Warm limestone plaster for a brighter room |
| Library | Slim charcoal frame, oak shelves, a few closed lower compartments | Entirely oak; walnut with black uprights for a darker vintage feel |
| Collectibles | Initially a cream road bicycle and green Mustang; David later requested both be removed and selected [Poly Haven Potted Plant 02](https://polyhaven.com/a/potted_plant_02) for the bookcase | Keep the remaining shelves clear |
| iPhone | Standard iPhone 16, black or muted ultramarine, portrait on the existing stand | No Pro/Pro Max substitution without changing the spec |
| Additional wall detail | No bicycle or car illustration | A narrow rail with original wireframe sketches; a small adjustable picture light |

Use the station clocks + oak/charcoal library + potted plant as one coherent direction. The plant is a CC0 model, scaled to fit the former car shelf. Keep the other collectible shelves clear. Do not build all alternatives. “Library” is interpreted as a physical bookcase; “keyword word” as the MacBook's keyboard/key legends. These assumptions can be corrected independently.

See [the room layout and clock-style sketch](ROOM_EXTENSION_CONCEPT.svg). It is a schematic proposal, not a render, accurate perspective projection, or evidence that the changes are implemented. The displayed clock times are illustrative; implemented clocks must show live time.

Visual hierarchy: green monitors and amber laptop first; clocks second; bookcase and collectible silhouettes third. The right wall should create depth, not become a second competing dashboard. Avoid additional neon lighting, floating UI panels, arbitrary trophies, or more character figures in this pass.

## 2. Read first and preserve the existing work

Read `AGENTS.md`, `PORTFOLIO_PLAN.md`, `docs/DESK_PLAN.md`, `docs/review.md`, and this brief. Existing desk references remain authoritative for the original objects, except where this request explicitly changes the arrangement or MacBook angle.

The prior room-polish edits are currently uncommitted. They include `useRoomFinish.ts`, lighting/shadows, screen colors, responsive framing, and navigation layout. Inspect `git status` and preserve them. Do not reset the worktree or copy a previous GLB over it.

Latest code checks passed, but the polish pass was **not visually verified**: the preview server and browser were blocked by an approval-service HTTP 404, even after user permission. Retry the normal approved preview workflow. If the service still fails, record the blocker; do not present old screenshots as current evidence.

Use branch `phase-5-room-extension` if repository permissions permit. Do not deploy or publish as part of this implementation.

## 3. Contract changes to flag before implementation

This brief flags the following narrowly scoped changes. Record them in `docs/DESK_PLAN.md` and the PR description at the first implementation checkpoint. Do not silently modify the stable contracts.

| Contract | Planned change | What stays stable |
| --- | --- | --- |
| Room scope | Add a right wall, library, and decorative collectibles | Original desk arrangement except the phone move; all original toys remain |
| Original “no decorative filler” rule | The requested library and plant are intentional decoration | Do not invent career stories or personal ownership claims for them |
| Object map | Add one grouped interactive object, `world_clocks` | Original `clock` remains the yellow alarm clock and still opens the career timeline |
| Phone story | Existing `phone` now opens the Safari layout/debugging demo | Preserve `int_phone`, `root_phone`, `cam_phone`; preserve contact access through a visible `/cv#contact` HUD link |
| Content data | Add IANA timezone IDs and localized clock/demo labels | Keep the existing `SceneObject`, role, skill and case-study interfaces; do not add a Safari career case study |
| Monitor | Correct its physical opening to 110° and regenerate its camera | Preserve `int_monitor`, `int_monitor__2`, `int_monitor_screen`, `root_laptop`, `root_laptop_lid`, and the original editor |

Keep `SceneObject.action` and the Pinia mode union unchanged. Both new interactions use the existing `modal` action. `world_clocks` has `contentRef: 'world-clocks'`; `phone` has `contentRef: 'phone-debug'`. Expected selectable object count becomes **13**. Decorative books and the plant use `static_` names and do not create empty modals.

The GLB path stays `public/models/room.glb`. Author cameras in Blender and regenerate `composables/generated/cameraFocus.ts`; never edit that generated file by hand. Keep the existing amended PBR pipeline and budgets: GLB ≤3 MB, textures ≤4 MB, counting embedded and external textures without counting the same bytes twice. Do not increase budgets silently.

## 4. Spatial composition — the new wall is on the RIGHT

Blender coordinates: +X is right, +Y is toward the existing back wall, +Z is up. Three.js export conversion remains `(x, y, z) → (x, z, -y)`. The new side wall is a YZ plane on positive X. Its interior face points toward **−X**. The back wall stays behind the monitors at approximately `Y=0.420`, facing −Y.

Proposed blockout bounds, in metres; these are layout starting points, not measurements of David's real room:

| Element | Placement / bounds |
| --- | --- |
| Existing desk | Keep width 1.700, top Z=0.750, front Y=−0.320 |
| Right wall | Interior X≈1.62; Y from −1.15 to +0.42; height ≈2.25; thickness ≈0.06 |
| Back wall | Extend to meet right wall cleanly; no gap, z-fighting or overlapping front faces |
| Bookcase | X≈1.29–1.59; Y≈−0.98–0.04; top Z≈1.90; front faces −X |
| Existing side cabinet | Retain X≈0.862–1.132 and Y≈0.025–0.375; keep its yellow clock visible |
| Four wall clocks | Back wall; centre Z≈1.66; centre X≈−0.62, −0.21, +0.20, +0.61; diameter ≈0.23 |
| Phone + holder | Start from holder location X=0.655, Y=−0.185, on the mat; adjust together for clearance |

The bookcase is **against the right wall and perpendicular to the monitor wall**, not another shelf behind the screens. Keep a visible corner seam and a shallow skirting/baseboard. Do not add a ceiling or front wall: they obscure the interactive desk and complicate the camera.

Bookcase arrangement, top to bottom:

1. Top shelf: one short standing group of books and the optional framed line drawing above it.
2. Display shelf: Poly Haven Potted Plant 02 on the former car shelf. Keep its pot seated on the shelf and leave negative space around the leaves.
3. Keep the remaining display bays open around the potted plant; no bicycle or car model.
4. Lower shelf: two horizontal book stacks; partially closed bottom storage anchors the furniture.

Use around 12–18 books with varied heights, a few leaning against real supports, and restrained cream/olive/ochre spines. Start with unlettered decorative spines. If labels are added, use generic subject labels from `content/portfolio.ts`, not invented book titles, endorsements, reading history, or employer awards.

## 5. Working wall clocks

### Appearance

For the recommended style: thin matte graphite casing with real depth, warm ivory dial, bold hour marks, thinner minute ticks, compact dark hour/minute hands, and one muted red seconds hand. Add a small city plaque below each clock. Keep all four the same size; let different hand positions provide visual variation. The yellow desk clock remains a separate photographed object.

The square alternative uses a softly rounded housing and minimal cardinal numerals. The digital alternative uses four amber HH:MM readouts with city labels and no flip animation. Pick one family for the whole row.

### Names and geometry

Create `tools/blender/lib/world_clocks.py`. Build one reusable clock and instantiate it four times. Shared dial geometry/material is preferred; separate hand pivots are required.

- Group roots: `root_world_clock_istanbul`, `root_world_clock_london`, `root_world_clock_stockholm`, `root_world_clock_atlantic`.
- Clickable cases/faces: `int_world_clocks`, `int_world_clocks__2`, `int_world_clocks__3`, `int_world_clocks__4`.
- Hand pivots per city: `static_world_clock_<city>_hour_pivot`, `_minute_pivot`, `_second_pivot`.
- One focus empty: `cam_world_clocks`, framed to show the full row.
- Author all hands pointing to 12 in the neutral pose. Each pivot sits at the face centre. Store/derive its dial-normal axis after export; do not assume Blender local Z is Three local Z.

The existing raycast normalizer supports the double-underscore numeric suffix. Do not introduce `int_world_clocks_tehran` unless also introducing an explicitly mapped object; it would be a different unresolved ID.

### Correct time, not a visual loop

Existing `ScreenCity.utcOffsetMinutes` hardcodes summertime offsets for London and Stockholm, and `useScreenTextures()` paints the laptop clocks only once. Replace this source of clock calculations with IANA zones:

| City | IANA timezone |
| --- | --- |
| Istanbul | `Europe/Istanbul` |
| London | `Europe/London` |
| Stockholm | `Europe/Stockholm` |
| Atlantic (Reykjavík) | `Atlantic/Reykjavik` |

Add `timeZone` to the city data and migrate all consumers together; remove `utcOffsetMinutes` after migration. Add localized display labels alongside the existing Latin decorative screen labels. Update the old comments claiming Canvas2D never supports Persian: browser text rendering can support it; localized layout/fonts must be verified rather than assumed impossible.

Create `utils/worldTime.ts`: cache `Intl.DateTimeFormat` instances using explicit timezone, numeric date/time parts, `hourCycle: 'h23'`, Gregorian calendar and Latin numeric parts for calculations. Use `formatToParts()` on the same epoch for every city. Use localized formatting separately for visible labels. Do not add/subtract the viewer's timezone offset.

Hand angles clockwise from 12:

```text
hour   = 30 × ((hour24 % 12) + minute/60 + second/3600)
minute = 6 × (minute + second/60)
second = 6 × second
```

Apply these to the exported pivot's local dial-normal axis with the correct sign. Verify 03:00, 06:00 and 09:00 visually. Store neutral transforms and set absolute angles; never increment rotations indefinitely.

Create one `useWorldTime()` instance in the room route's composition wiring. It supplies a readonly epoch to the scene and clock dialog, starts after mount, and cleans up its timer/listeners. Update once a second from `Date.now()`, aligned to the next second. Pause while hidden; resync immediately on visibility/focus. In reduced motion, omit/freeze the seconds hands and update hour/minute hands and text on minute boundaries. Time must remain accurate on low-quality devices, without smooth ticking or audio.

“Real” here means the visitor's device time interpreted correctly in each zone; it is not an externally synchronized time service. No API, location permission, or network polling is needed.

`useWorldClocks.ts` binds the model pivots to this epoch. Cache mesh references once. Do not traverse the model or rebuild clock textures every frame. If laptop clock widgets remain, update their existing canvas texture once per minute from the same data, and use an explicit timezone for the calendar too. Reuse textures instead of allocating new ones each tick.

Add `WorldClocksPanel.vue` to the existing accessible modal shell: four localized city names, current HH:MM, and local date. No `aria-live` every second. The clock group has one keyboard-accessible navigation entry; users need not click a tiny hand.

## 6. Bookcase and plant

Create `tools/blender/lib/library.py` and `collectibles.py`. Build assemblies in local coordinates, then parent them under a single root for placement. Keep the new assembly separate from the existing character toys module.

**Bookcase:** 20–25 mm shelf thickness, bevelled edges, rear supports, charcoal metal uprights, oak-toned wood. Use real thickness and contact points. Use one restrained reusable wood texture/normal map if needed, not many unique materials. Keep the shelves uncluttered around the plant.

**Potted Plant 02:** use the user-selected [Poly Haven CC0 asset](https://polyhaven.com/a/potted_plant_02), credited to Rico Cilliers. Its source height is 0.8 m; scale it to 0.27 in the car's former shelf position. The checked-in Blender asset under `tools/blender/assets/` keeps the rebuild self-contained. At miniature size, use 256 px diffuse maps and leaf alpha; omit normal and roughness maps and decimate the hidden soil mesh to meet the GLB budget.

Before detailing either collectible, inspect legitimate front/side/three-quarter references and record their source links in `docs/reference/room-extension/sources.md`. These models are visual proposals, not possessions or hobbies attributed to David. If an external model is used instead of authored geometry, record its redistribution license and source and optimize it to the existing budget; do not import an unverified asset.

The plant is static in this pass. Keep the other bookcase display bays empty; do not add unrequested decoration.

## 7. iPhone 16 on the right holder + Safari debugging demo

### Physical phone

Move and rebuild the **existing phone** onto the existing right-hand stand. Remove the old face-up phone from the left side of the mat; do not accidentally leave two phones. Move phone and stand as an assembly if clearance requires it.

Use the standard 6.1-inch iPhone 16 proportions. Starting uncased dimensions: approximately 147.6 × 71.6 × 7.8 mm; verify against Apple's model-specific technical specifications before final geometry. Include rounded frame corners, Dynamic Island, a vertical dual-camera arrangement, USB-C opening, and simple side-button details. Do not give it the Pro's three-camera square cluster.

Keep `root_phone` and `int_phone`. Make the visible display `int_phone__2`, with UVs 0–1 and a consistent orientation; map its screen texture by exact mesh name. This follows the existing suffix contract and avoids a new special-case `int_phone_screen` normalizer. Use a solid chassis as `int_phone` for reliable picking.

Seat the bottom edge on the holder lip and support the back against its sloped rest. Start around 65–70° above the desk and a slight yaw toward the main camera. The phone may extend above the small stand; it must not float, intersect the lip, cover the elephant, or overlap the mouse. Regenerate `cam_phone` to target the new right-hand location.

### What appears on the display

Recommend **a Safari viewport/safe-area debugging lab**. This is relevant and visually understandable: a small web form's bottom action is obscured when the mobile browser toolbar/keyboard reduces the visible area, then becomes reachable in the corrected layout.

The idle phone screen shows a legible Safari-like address bar, a small “Viewport lab” page, a bottom action, and a restrained viewport boundary. Use original UI artwork. The address can be a clearly fictional `.example` demo URL stored in content. No fake production error logs, invented performance numbers, or credentials.

Clicking the phone opens `PhoneDebugDemo.vue` inside `ObjectModal.vue` with:

1. A labeled simulated device viewport, with toolbar expanded/collapsed and keyboard shown/hidden controls.
2. A “Fixed-height layout / Viewport-aware layout” switch.
3. A visible action that is occluded in the simulated broken state and reachable in the corrected state.
4. A short explanation of `100dvh`, safe-area insets and `visualViewport` where needed; acknowledge that keyboard behavior needs its own handling/testing.
5. A separate live panel showing **this browser's** viewport measurements, updated from actual `window`/`visualViewport` resize events. Mark `visualViewport` unsupported when absent.

The device stage is an educational simulation. Do not label Chrome/WebKit desktop emulation as a connected iPhone or claim that Safari's native Web Inspector runs on the phone. Actual iPhone Safari remote inspection is performed from Safari on a Mac with a connected device and appropriate settings. The existing Android FileReader story stays Android and stays under `bugjar`.

Implementation boundary: use plain Vue/CSS in a focused modal, with `usePhoneDebugDemo.ts` managing typed scenario state and event cleanup. Keep simulated dimensions distinct from measured host-browser values. Do not use bare `100dvh` inside a small div and pretend it refers to the div; compute the constrained simulated stage layout explicitly. If a live CSS viewport reproduction is later required, isolate it in a correctly sized iframe as a separate enhancement.

Instantiate this feature state once in the room route and pass its readonly scenario to both `RoomScene` and the modal's `PhoneDebugDemo`; route the demo's typed update/reset events back to that instance. Do not create separate composable instances in the phone renderer and dialog, which would let the two screens disagree. Measure the host browser only after mount and dispose resize/visualViewport listeners on teardown.

`usePhoneScreenTexture.ts` paints the idle/selected scenario onto one persistent small canvas. It should update only when the scenario changes. Do not build a second CSS3D renderer for the phone. Mobile gets the same accessible modal demo at full usable width. Reset returns to a documented deterministic initial state. All controls work with keyboard and touch.

Add a visible Contact link to `SceneHud.vue` using the existing `/cv#contact` target, with text from portfolio content, because the phone now demonstrates debugging instead of being the contact shortcut. Keep Skip to CV visible too.

## 8. MacBook: physical 110° opening and proper keyboard

### Correct angle — do not blindly change 101 to 110

Current source: `tools/blender/lib/screens.py`, `LID_ANGLE = radians(101.0)` and `RISER_TILT = radians(5.5)`. The current lid extends along local +Y before X rotation, while the ray from hinge toward the keyboard's front extends along −Y. Under that construction the physical interior opening is **180° minus the hinge rotation**: the existing 101° constant appears to produce a 79° interior opening, despite its comment.

Define `LAPTOP_OPEN_ANGLE_DEG = 110.0` as the desired physical interior angle. With the existing geometry convention, the initial derived rotation is `radians(180.0 - LAPTOP_OPEN_ANGLE_DEG)`, or **70°**. Verify this against the actual parent transforms and vertex positions; helper parenting semantics can change the result. The whole-laptop riser tilt is separate and must not be added to the opening angle.

Verify using normalized vectors from the hinge toward the base front and toward the lid top: `degrees(acos(clamp(dot(baseRay, lidRay), -1, 1))) == 110`, tolerance ≤0.5°. Save a side-view proof image with the measured angle. This definition makes the laptop lean naturally away from the user, with its display facing the viewer.

Keep all lid pieces under `root_laptop_lid`, including the screen and notch. Keep the physical hinge connected. Moving only the screen would leave the bezel and camera behind.

### Keyboard

`_keyboard_image()` currently paints rows of blank rectangles at 512×224. Replace the anonymous rows with one explicit ANSI US MacBook key-layout table: key ID, legend, row, width, and any special shape. Include QWERTY rows, number/punctuation row, Escape/function keys, Tab/Caps/Shift/Return/Delete, fn/control/option/command, a wide spacebar, and inverted-T arrows. Include a visually distinct Touch ID/power key. Do not invent a “keyword” word across the keyboard.

Keep the current MacBook Pro 16-inspired body for scope control. Verify that the selected reference/layout has the appropriate function-row proportions and speaker-grille placement. Use shallow raised keycap geometry for real edge highlights, with a shared texture atlas for legends. Put the key legends/layout data in a named export in `content/portfolio.ts`; extend the build's content-export step so Blender consumes that data rather than duplicating text in Python. Physical Latin key legends are hardware artwork; explanatory labels remain localized.

Use approximately 1024×448 for the atlas as a starting maximum; inspect readability before increasing it. No floating text meshes per glyph, exaggerated neon backlight, random blank full-width keys or stretched arrow keys. Reuse the existing licensed font/artwork tooling and document any replacement font.

### Keep the original editor aligned

Retain the screen's local flat geometry, UVs and naming. The current CSS3D host applies a −90° X correction for the Y-up glTF export; preserve this correction unless measured export geometry proves a change is necessary.

The current host sizes itself from a world-axis-aligned bounding box and a fixed 840×492 DOM surface. Audit this while changing the angle: use the screen's **local planar dimensions and world scale**, or transformed corner distances, rather than a world bounding-box approximation that changes with orientation. Derive the DOM aspect ratio from the screen; do not stretch the editor or hide misalignment with offsets. Regenerate `cam_monitor` based on the corrected display centre and normal so the editor is legible.

## 9. File ownership and component boundaries

| File | Responsibility |
| --- | --- |
| `tools/blender/lib/room_shell.py` (new) | Joined back/right walls, floor extension and skirting; replace shell calls in build orchestrator |
| `tools/blender/lib/world_clocks.py` (new) | Shared clock geometry, pivots, plaques and placements |
| `tools/blender/lib/library.py` (new) | Bookcase and books |
| `tools/blender/lib/collectibles.py` (new) | Sourced potted plant; earlier bicycle geometry is not called by the room builder |
| `tools/blender/lib/peripherals.py` | Move/rebuild phone and stand; retain original desk objects |
| `tools/blender/lib/screens.py` | Measured MacBook hinge, keycaps/atlas, connected screen geometry |
| `tools/blender/build_room.py` | Compose modules, author cameras, export model/camera data |
| `tools/blender/export_room_content.mjs` (new) | Serialize selected portfolio artwork/clock/keyboard text to deterministic JSON before Blender runs; use the installed TypeScript transpiler to load the pure TS content module on supported Node versions, no new framework |
| `content/portfolio.ts` | City zones/labels, keyboard legends, demo copy, object mapping |
| `utils/worldTime.ts` (new) | Pure timezone/time-to-hand calculations |
| `composables/useWorldTime.ts` (new) | Single visible-page clock scheduler and cleanup |
| `composables/useWorldClocks.ts` (new) | Bind existing GLB hand pivots to supplied epoch; no own timer |
| `composables/usePhoneDebugDemo.ts` (new) | Simulated scenario state and actual host viewport measurement |
| `composables/usePhoneScreenTexture.ts` (new) | Persistent canvas artwork for the phone |
| `components/ui/WorldClocksPanel.vue` (new) | Accessible current city times; typed `epochMs` and `locale` props |
| `components/phone/PhoneDebugDemo.vue` (new) | Debugging demo controls/stage; typed state props and update/reset emits |
| `components/scene/RoomScene.vue` | Compose rendering and bind model/time/phone state; keep business/demo logic in composables |
| `components/scene/MonitorEditorSurface.vue` | Keep CSS3D display transform and dimensions accurate |
| `components/ui/ObjectModal.vue` | Reuse shell/focus handling; route new contentRefs to focused components |
| `pages/index.vue` | Instantiate shared composables and wire props/emits only |
| `components/ui/SceneHud.vue` | Preserve CV and expose Contact after phone remapping |

Create the data export only when text is needed in Blender; emit one small generated JSON with clock labels and keyboard artwork data. Add it to both `build:model` and `preview:model` commands so previews and the shipped model cannot drift. Keep JSON generation away from Nuxt-only imports. Use localized runtime labels where a 3D plaque cannot reliably display the active locale.

Demo state and clock epoch are ephemeral feature state shared through route wiring, not new scene modes. Selection, hover and scene mode continue to use `stores/scene.ts`. `/cv` must not import a clock renderer, phone demo or Three.js as a consequence of this work.

## 10. Camera, light and interaction requirements

- Author a front-left three-quarter room camera so the right wall's interior face and shelves are visible. A blockout trial eye around `(-1.2, -2.05, 1.85)` looking at `(0.25, 0, 1.05)` is a starting point only. Refine in the actual browser aspect ratio; do not accept coordinates without a preview.
- Keep the desk dominant. At 1440×900 the display contents, phone silhouette, clock row and potted plant should all be recognizable. Avoid pulling the camera so far back that every object becomes a dot. Prefer showing the upper bookcase clearly over showing excessive empty floor.
- Fit the new bounds responsively; the polish pass's constant aspect multiplier was tuned for a single desk and needs review. On narrow screens, retain an intelligible desk and access to every functional object through navigation, even if decorative shelf details are small.
- Check the entire allowed orbit sweep. The right wall must not conceal the desk, and the camera must not cross walls or the bookcase. Adjust orbit limits and min/max distance for the new shell.
- Retain soft warm key light and restrained fill. Give shelves a gentle warm wash; use one broad source rather than a shadow-casting light per shelf. Keep the right wall slightly darker than the back wall.
- Extend `useRoomFinish.ts` deliberately: it currently textures only the exact `static_wall` mesh. Apply a consistent finish to the new shell names as well. Refit the key-light shadow volume to new bounds and keep low-quality shadows disabled.
- Use existing material/environment disposal patterns. Do not recompute PMREM, upload screen textures or traverse the entire model on each frame.
- Text labels, focus rings, reduced motion, visible Contact/CV and modal focus return must work in EN and FA. Do not use ticking as ambient sound or add autoplay audio.

## 11. Implementation sequence and review checkpoints

Work in this order. Each checkpoint has a bounded outcome and evidence requirement. Review your own evidence before proceeding; user approval is needed only if an undecided preference materially changes the next task. Do not keep requesting approval for the defaults in this brief.

| Checkpoint | Work | Exit condition |
| --- | --- | --- |
| 0. Baseline | Preserve current edits; record contracts/object list; run current app if access works | Current desktop/mobile evidence, known blockers, selected style defaults recorded |
| 1. Room blockout | Right wall, untextured bookcase, clock discs, collectible silhouettes, phone on stand; new room camera | Desktop and mobile screenshots prove right-hand placement and readable hierarchy before detailed modeling |
| 2. MacBook | Correct measured opening, connected hinge/lid, keyboard layout and screen alignment | Side angle proof, keyboard close-up, original DOM editor works at desktop/tablet/mobile |
| 3. Physical library | Finish shelves/books and plant; keep other bays clear | Close-ups show silhouettes/materials/supports; model stays within asset budget |
| 4. Time system | Clock pivots, IANA source, shared scheduler, clock dialog, laptop synchronization | Fixed-date DST tests and hand-angle tests pass; live clocks advance/resume correctly |
| 5. Phone demo | iPhone likeness, phone texture, deterministic demo, real host metrics, contact link | Phone navigation opens working demo; reset/touch/keyboard and fallback metrics pass |
| 6. Integration | Final camera/shadows/material tuning, localization/accessibility, performance | Required checks pass; final real-browser evidence matches the shipped model/code |

Checkpoint directories: `docs/renders/room-extension/00-baseline/` through `06-final/`. Prefer a small curated set of images, not dozens of near-duplicates. Keep a progress table in `docs/review.md` with implemented/verified/pending columns. “Implemented” never means “accepted by David.”

## 12. Verification and acceptance

**Required commands:** `pnpm build:model`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` when local browser access works. Use `pnpm preview:model <path> --shot <id>` for object evidence; browser rendering remains the final authority for runtime lighting, clock motion, canvas textures and CSS3D alignment.

Add meaningful regression tests for the new behavior:

- For `2026-01-15T12:00:00Z`: Turkey 15:00, London 12:00, Stockholm 13:00, Atlantic 12:00. For `2026-07-15T12:00:00Z`: Turkey 15:00, London 13:00, Stockholm 14:00, Atlantic 12:00. Also cover midnight date rollover and the spring/autumn DST transition boundaries; results must not depend on test runner timezone.
- Test timer pause/resume, cleanup, and a fixed epoch's hand angles without waiting real seconds. No cumulative time drift.
- Test all 13 scene mappings and unique IDs, including suffix normalization for clock faces and phone display. Replace the old hardcoded 12-object expectation with the explicitly required ID set plus uniqueness checks.
- Test the actual base/lid vector angle after scene generation, not just a constant named “110”.
- Test phone scenario/reset and distinguish simulated values from measured `visualViewport`/fallback values.
- Update Playwright's contact/phone expectations after remapping. Exercise clocks, phone demo, original editor drag/color/reset/Escape, other original modals, locale, Contact and CV.

Capture desktop (1440×900), tablet (1024×768), mobile (390×844) and narrow mobile (360×800). Include whole room, right wall, clocks, phone/holder, keyboard, and editor alignment. Check phone and library clearance from a side view, not only the flattering front shot.

Use Playwright Chromium and WebKit where installed. WebKit automation is useful but is not proof of real iPhone 16 Safari behavior. If claiming real-device compatibility for the viewport demonstration, record an actual iPhone Safari test; otherwise label that check pending. The educational simulated scenario should work in all supported browsers.

Budget gate: baseline GLB was 2,142,940 bytes, leaving roughly 0.85 MB under a conservative 3,000,000-byte ceiling. Measure the actual baseline first. Prioritize shared clock geometry, low-poly book spines, a single key atlas and a low-detail plant texture/mesh. Track draw calls/triangles and frame timing before/after at the same viewport; do not hide expensive additions behind the fact that a compressed file is small. Keep the standalone `/cv` build free of the room's imports.

Done means: the right wall visibly completes the studio; clocks show correct changing local time; the selected plant reads as an intentional miniature and other display bays remain clear; the iPhone is supported on its holder with an honest working demo; the MacBook measures 110° and has readable key legends; original content/editor access works; tests and actual preview evidence are recorded. Any unavailable browser/service/device verification is explicitly pending.

## 13. Copy-paste kickoff for Opus 5.5

> Read AGENTS.md, PORTFOLIO_PLAN.md, docs/DESK_PLAN.md, docs/review.md and docs/ROOM_EXTENSION_PLAN.md. Implement the room extension in the checkpoint order in the new plan. Preserve the existing uncommitted polish work. Use the selected directions: station-style live clocks, oak/charcoal bookcase on the RIGHT wall, Poly Haven Potted Plant 02 as the only bookcase collectible, standard iPhone 16 on the existing holder, and a physically measured 110° MacBook opening with a labeled keyboard. Keep the other display bays clear. Flag the documented contract amendments before editing them. Keep Blender as the geometry/camera source of truth. First complete the room blockout and inspect it in the browser, then detail the objects. Use IANA timezones and a shared clock scheduler. Build the Safari viewport lab as an explicitly labeled educational demo; never invent a Safari production incident or a connected device. Preserve the original DOM editor and keep Contact/CV accessible. Run the required checks, save a small set of current preview images, and update docs/review.md with honest implemented/verified/pending status. Do not deploy.
