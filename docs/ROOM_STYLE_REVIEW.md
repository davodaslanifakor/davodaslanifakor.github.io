# Reference room restyle — Blender review

**Current status:** the approved room is implemented in the website at `http://127.0.0.1:3000/`. Codex CLI produced the Astra integration plan and implementation. The website uses one 1.27 MB exported scene, system light/dark lighting, the shared ultrawide, refined MacBook, soft carpet and real-time wall clocks. The implementation and final verification sections below supersede the earlier Blender-only checkpoint status.

Astra planned this pass through the existing Azure profile (`gpt-6-astra` / `azure-company`). The returned plan is in `ROOM_STYLE_ASTRA_PLAN.md`.

## View the result

Open `tools/blender/review/reference-restyle/room-light-dark.blend`. The live Blender window is already showing this file. Choose **Room Light** or **Room Dark** in Blender's scene selector at the top. Both scenes use the same composition and objects, with separate lighting.

- Light render: `docs/renders/room-style/light.png`
- Dark render: `docs/renders/room-style/dark.png`
- Original references: `docs/reference/room-style/`
- Saved live baseline: `tools/blender/review/reference-restyle/room-before.blend`

## Implemented

- One continuous curved ultrawide enclosure replaces the two external monitors. Adjacent curved interaction surfaces keep `int_screen_left`, `int_screen_right`, and their roots. There is no physical screen divider.
- The laptop, its editor mesh `int_monitor_screen`, its flat UV surface, and existing camera empties are retained.
- Warm perimeter illumination surrounds an inset plaster wall panel. The floor has plank joints, and the frame and skirting provide a shadow line.
- A front-facing oak and charcoal bookcase has concealed shelf illumination, upright and stacked books, framed original line artwork, a diffuser, fabric bins, a shelf plant, and a trailing top plant.
- Three Minions, the Joker, and the metal elephant remain. The long-tailed fluffy toy on the left speaker is provisionally treated as the requested monkey and stored in the hidden **Original Layout** collection. Reopening the baseline restores the complete original room.
- Wall clocks show the existing source-data locations: Turkey, London, Stockholm, and Atlantic. Blender hand positions are a time snapshot, while continuous website time updates remain the existing runtime responsibility.
- Screen graphics are original procedural preview artwork. Name, technology labels, skills, and city labels come from `content/portfolio.ts`; the reference's job description and slogans are not imported.

## Source and follow-up

`tools/blender/style_room.py` is the safe-mode compatible recipe. It accepts a `content` dictionary and optional `clock_angles` when `apply(...)` is called. Generate the content dictionary with:

```sh
node --experimental-strip-types tools/blender/export_style_content.mjs
```

Read the generated JSON in the host process and send the recipe plus a literal `apply(content=..., remove_monkey=True, clock_angles=...)` call through Blender MCP. Create the review output directory before execution. The recipe saves the baseline before archiving anything and refuses a second layout application to an already styled scene.

The preview was applied directly through MCP with safe mode enabled. The initial attempt to load a script from disk was rejected; the final recipe uses permitted Blender operations and no runtime file reads, dynamic module loading, network requests, or security-setting changes.

This is the requested Blender-first checkpoint. `public/models/room.glb`, generated website camera data, Pinia state, and website components were not changed in this pass. Later website integration must account for curved screen UVs, the omitted plush navigation entry, shared ultrawide textures, and rendered lighting (the existing GLB exporter excludes lights). These implications are flagged here before changing any runtime contract. Do not export the archived original layout or both lighting scenes into a single website GLB.

## Verification

Both modes were rendered and inspected. Named laptop/editor surfaces, screen interaction regions, retained toy roots, screen UVs, and hidden monkey archive were checked in Blender. Shelf plants rest on the book stack, and the diffuser is separated from the books.

Lint, TypeScript checks, 16 unit tests, and production build passed. The production build still reports the existing large scene bundle warning. All 8 Playwright browser checks passed against the existing running website. The first sandboxed attempt could not reach that server; rerunning with local server access succeeded.

## Desk adjustment

Removed the side cabinet between the desk and bookcase. The desk is now 2.05 m wide (previously 1.70 m) and 0.76 m deep, with its legs and modesty panel fitted to the new size. The small yellow clock and the speaker/subwoofer sit on the main desktop; their lowest points were verified at the 0.75 m desk surface. Both lighting scenes and renders were updated. Scene datablocks are marked for retention when the file is saved. A backup before this adjustment is `room-before-desk-adjustment.blend` in the review directory.

Trim correction: the back baseboard now ends inside the illuminated wall frame. The overlapping original back trim is hidden, and the side trim is aligned with the moved right wall. Both scenes and preview renders were checked and saved.

## MacBook refinement

The laptop in both scenes now follows Apple's [MacBook Pro (16-inch, 2024) Space Black reference](https://support.apple.com/en-us/121554). Published closed dimensions are 355.7 × 248.1 × 16.8 mm. The model uses a 12.2 mm rounded base and 4.6 mm lid; this thickness split, trackpad size, grille pattern, and port positions are visual modeling estimates rather than published engineering dimensions.

Replaced the tapered chassis and distorted keyboard with a rounded aluminium enclosure, 78 properly spaced keycaps in six rows, full-height function keys, Touch ID, and half-height inverted-T arrows. Added dense speaker grilles, a flush matte trackpad with a fine perimeter seam, side port openings, a front thumb recess, and a notch camera. The screen has a 344.5 × 223.3 mm face, retaining its exact interactive object name, flat local +Z orientation, 0–1 UVs, and existing hinge hierarchy. It is still the procedural portfolio preview display.

The saved checkpoint remains `tools/blender/review/reference-restyle/room-light-dark.blend`. A pre-edit backup is `room-before-macbook.blend`; a close-up is `macbook-detail.png` in that directory (also copied to `docs/renders/room-style/`).

To repeat the laptop pass, regenerate `tools/blender/generated/room-content.json` with `export_room_content.mjs`, read it in the host process, and send the literal source of `tools/blender/update_macbook.py` through MCP followed by `update_macbook(keyboard_rows=...)` with the exported `keyboardRows` value and `render_macbook_previews()`. Run it after the room restyle recipe. It replaces its own generated details on subsequent runs and does not lower the laptop twice. No external module loading or file reads occur in Blender. Both lighting modes were rendered and checked; keyboard count and the flat screen/UV contract were asserted in Blender. The website GLB is still the previous asset pending room-style integration.

Verification was rerun after this refinement: lint, typecheck, 16 unit tests, Python syntax, diff whitespace checks, and production build passed. The build retains its existing large scene bundle warning. The first browser invocation lacked access to the local server; with local access the parallel run passed seven checks but timed out on Contact navigation. A full rerun with one worker passed all eight browser checks, including Contact. No website code was changed during this laptop refinement.

## Soft minimal carpet

The rug in both lighting scenes is now a light oatmeal wool finish with subtle color variation, fine low-pile bump shading, and soft sheen. Its 2.55 × 0.90 m rounded outline has a 14 mm cushion profile and a narrow tonal edge binding. The former dark coarse noise and thin rectangular slab were replaced. No patterned motif or fringe was added. `soften_rug()` in the room recipe reproduces this update. The live viewport frames the room and rug; wider review renders are `carpet-light.png` and `carpet-dark.png` in `docs/renders/room-style/`. The original scene camera is retained. The backup is `room-before-soft-carpet.blend`. This remains a Blender preview update, with website integration pending.


## Approved website integration decisions (before implementation)

The website asset source is now the visible **Room Light** checkpoint, exported in a background Blender process without saving or overwriting the checkpoint. `build:model` is not the integration workflow. The approved plush omission removes only its active navigation/animation entry; historical content and camera identity remain. The ultrawide shares one canvas with left/right half UVs and separate click targets.

The existing embedded-image path plus deterministic runtime wool, plaster and wood grain is retained instead of introducing `public/textures/room_day.ktx2` solely for simple grain. This is an explicit texture-path deviation from §4.1; shipped embedded/external image bytes and generated texture memory are accounted separately. There is no change to the flat local +Z laptop screen, camera identities, content types, or Pinia schema.


## Website integration implementation

`tools/blender/export_review_room.py` now exports an isolated in-memory copy of the visible Room Light checkpoint. It excludes archived/hidden objects, the other scene, cameras, lights, and runtime-replaced screen lettering. It retains necessary parents and camera identities, adds carpet UVs, merges remaining FONT geometry by parent, and stages/validates before replacing the website GLB. Camera data comes from the checkpoint camera and oriented empties/targets, never the old build constants. The original `.blend` SHA-256 is checked before/after export and again by the asset tests.

Repeat with:

```sh
pnpm export:room
# expands to:
/Applications/Blender.app/Contents/MacOS/Blender --background tools/blender/review/reference-restyle/room-light-dark.blend --python-exit-code 1 --python tools/blender/export_review_room.py
```

The resulting `public/models/room.glb` is **1,269,420 bytes**, with **58,521 embedded image bytes**, **0 external texture bytes**, 716 nodes and 671 meshes. Both 3,000,000-byte geometry/container and 4,000,000-byte shipped-image limits pass. The exporter tried the plain asset first and used Draco to meet the GLB budget. `RoomScene` uses Cientos' documented Draco option with local decoder files under `public/draco/`; no external decoder service or new package is needed. `tools/blender/review/website-export.json` records source membership, exclusions, camera values, exact accounting and checkpoint SHA-256.

`useRoomFinish` preserves approved aluminium, oak and plaster colors and applies local deterministic plaster/wood/wool grain. The carpet keeps its rounded cushion and binding geometry, oatmeal tint and fine bump; the physical material retains soft sheen. The three grain maps are 128×128 RGBA. The shared ultrawide is 2048×576, the laptop 960×632, and the existing phone 240×480. Combined generated canvas storage is **7,802,880 base-level bytes**, **10,403,400 bytes (about 10.4 MB) including ultrawide/laptop and grain/phone mipmaps**, up from the prior approximately 8.0 MB; base-level storage is unchanged. These are GPU texture allocations, not shipped image bytes. The 128-pixel local PMREM reflection environment adds approximately 1.5 MiB, separately from the framebuffer and decoded embedded-image memory.

`useRoomLighting` follows system light/dark changes with cleanup and immediate reduced-motion updates. RoomScene composes exposure, environment strength, a hemisphere light, two directional lights, a wall glow and a high-quality shelf light; emissive LED geometry also works in low quality. `utils/roomFraming.ts` fits the entire room/rug bounds while preserving the authored camera direction on desktop and mobile. `useScreenTextures` shares one continuous profile/project/skills canvas across the half-UV ultrawide surfaces and retains the separate laptop fallback.

Only plush is removed from active content and hover animation. Other content/navigation, mobile phone scenarios, EN/FA, focus restoration, and the independent SSR CV route remain. The checkpoint calls the Atlantic clock's pivots `reykjavik`, while content retains `atlantic`; `useWorldClocks` accepts either mesh identity without changing the content catalog, IANA zone, or clock geometry.

### Verification during implementation

- Lint and Nuxt TypeScript checks passed.
- **27 unit tests passed**, including decoded Draco geometry, required mesh/camera identities, flat laptop normals and UVs/hierarchy, 78-key metadata and grilles, curved half UVs, carpet UVs, retained toys, all clock pivots, archive omission, asset/image budgets, unchanged checkpoint hash, responsive framing, system lighting and cleanup, shared ultrawide texture lifetime, and both Atlantic/Reykjavík pivot identities.
- Production build passed. The existing >500 kB scene chunk warning remains (scene chunk approximately 1.10 MB / 308 kB gzip).
- Python syntax passed using in-memory compilation; the initial `py_compile` invocation could not write the system Python cache in the sandbox.
- Final integration browser checks passed: the primary runner completed **all 9 Playwright tests** against `localhost:3000`. Both the desktop room and CSS3D laptop editor were visually inspected. The earlier CLI sandbox access failure and approval-service API deployment 404 are historical, resolved execution issues.
- The supplied `/tmp/portfolio-before-room-integration.diff` exactly matched the recorded start diff. Incremental file hashes confirm only integration files changed; the live Blender checkpoint is byte-identical. No reset, stash, clean, commit, PR, worktree or agent was used.

### Small runtime refinements

The laptop fallback now uses a dark-blue/slate base (`#243646`) and light ink (`#d8e1e7`), with original layered slate mountain silhouettes drawn before menus, cards and text. Date, calendar, clocks, source copy, texture dimensions and CanvasTexture reuse/update/disposal remain unchanged. The wall fill moves to `(-0.15, 1.7, 0.45)` for broader warm illumination, preserving lighting presets, light counts and state contracts.

The asset remains **1,269,420 bytes**, and the original Blender checkpoint remains byte-identical; neither was modified by these refinements. Only the source diff was reviewed for this small pass. The parent runner will perform final checks after these edits; no new tests or build were run in this pass.

### Final website review

The primary runner verified the refined light/dark room, laptop editor alignment, clock dialog and mobile framing, with no browser page errors. Final website previews are `docs/renders/room-style/website-light.png`, `website-dark.png`, `website-editor.png`, `website-clocks.png`, and `website-mobile.png`. Day-mode intro/profile/contact copy now uses dark foregrounds on the light background; dark mode and the focused editor retain their existing light text. The canvas mock was updated for the mountain drawing's `closePath` operation. Lint, typecheck, all 27 unit checks and build passed after the refinements; the browser suite covers the light/dark title contrast as well as the existing nine workflows. The existing large scene bundle warning remains.

### Native screen rendering

Ultrawide and laptop artwork now rasterizes directly at 2048×576 and 960×632. A 4× canvas context scale preserves all logical coordinates, font sizes, wrapping and artwork while rendering native detail. Canvas smoothing, linear magnification, trilinear mipmap minification and 4× anisotropy smooth zooming and angled views. Laptop updates copy native pixels 1:1 into the existing texture canvas, preserving image identity; shared ultrawide identity, disposal, glTF `flipY=false`, clocks and content remain unchanged. No shipped asset bytes or GLB changed.

Rendering density now reacts to browser resize events, including Chrome zoom changes. High quality retains its 2× pixel-ratio cap and low quality retains 1×; the resize listener is removed on disposal. The quality test covers density changes, the cap and cleanup. The primary runner passed lint, typecheck, all 28 unit checks, production build and all 9 Playwright workflows. The zoomed preview is `docs/renders/room-style/website-sharp-screens.png`. The existing large scene bundle warning remains.

### Shared screen themes — 21 October 2026

Both procedural screens consume `ScreenTheme` in `utils/screenTheme.ts`: base, ink, accent and three landscape colors. Slate is the default; Forest, Amber and Mono are session choices in `stores/scene.ts`. The screen icon in the HUD opens a collapsed-by-default segmented radio group. Arrow keys select a theme, and Escape closes the picker and returns focus. The picker fits narrow phones and stays out of the gameplay HUD.

The ultrawide now leads with the name and role, followed by two padded case cards and an Istanbul time chip. The duplicate skills column is removed. Both screens share the same mountain composition, deterministic grain, soft vignette and inner glow. The Mac clocks use smooth faces and minute-aware hour hands, full city labels fit their cells, and the keyboard sketch stays inside its panel.

The existing room clock refreshes both textures each minute and on return to the tab, including with reduced motion enabled. Theme and time changes retain the existing CanvasTexture/image identities and ultrawide half-UV bindings. Screen dimensions and GPU texture allocations are unchanged; the reusable grain tile is composited into the canvases rather than uploaded as another GPU texture. Spotify's embed remains a separate live surface.

Preview: `docs/renders/room-style/screen-theme-preview.png`. Lint, typecheck, all 167 unit tests across 44 files, and the production build passed. All 16 targeted production browser checks passed in Chromium and WebKit, covering native canvas theme changes, keyboard and phone controls, Istanbul midnight rollover, Spotify and editor flows. Explicit arrow-key wrapping plus Home/End handling resolves WebKit's native radio-group behavior at the last theme.
