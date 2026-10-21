# Your desk — approved direction

## Room extension amendment — implementation scope (2026-09-29)

Per `docs/ROOM_EXTENSION_PLAN.md`, extend the desk into a two-wall studio. This amendment intentionally updates the original §3 object map and “no decorative filler” constraint: the requested library, bicycle, Mustang, and framed line drawing are decorative room elements without implied ownership or career stories. Keep the yellow desk `clock` mapped to the timeline and add one grouped `world_clocks` interaction. Remap `phone` from contact to the educational `phone-debug` modal while preserving `int_phone`, `root_phone`, and `cam_phone`; expose `/cv#contact` in the HUD. Add IANA timezone data and localized labels without changing the `SceneObject` interface or Pinia mode union. Correct the MacBook to a measured 110° physical opening while preserving its mesh/root/screen names and original editor.

The recommended station clocks, olive-grey right wall, oak/charcoal bookcase, cream road bike, green 1967 Mustang Fastback, and standard iPhone 16 follow the implementation brief. Static objects remain non-interactive. The 13-entry map is deliberate; all original desk objects and toys remain.

The user approved replacing the fictional room with a stylized, interactive reconstruction of their own desk on 2026-09-15. Seven supplied reference photographs show two green monitors, a yellow-screen laptop, black desk, speakers, three Minions, a white/grey plush with a pink tail, metal elephant, Joker figure, phone, mouse, and yellow clock.

## Contract amendment

This approved desk direction supersedes the fictional room object map in PORTFOLIO_PLAN.md section 3. Keep the typed localized content and Pinia mode contracts. Add `toggle-sound` to SceneObject.action. Use these interactive IDs and matching int_ / cam_ names:

| ID | Physical object | Action/content |
| --- | --- | --- |
| monitor | Laptop | zoom-editor / original editor demo |
| screen_left | Left green monitor | modal / selected work |
| screen_right | Right green monitor | modal / skills |
| clock | Yellow alarm clock (on low right cabinet) | modal / timeline |
| elephant | Folded-metal elephant (in front of right speaker) | modal / architecture |
| bugjar | Green-haired figure | modal / bugjar |
| paratrooper | Skirted toy | modal / paratrooper |
| robot | Coated toy | modal / robot |
| cards | Placard toy | modal / cards |
| plush | Plush toy on left speaker | tooltip / welcome |
| speakers | Speaker pair | toggle-sound |
| phone | iPhone on right stand | modal / viewport-debug demo; contact remains in HUD at `/cv#contact` |
| world_clocks | Four station wall clocks | modal / IANA timezone clocks |

Hit meshes follow `int_<id>`, plus `int_<id>__<n>` when one object needs several (both speakers, the laptop base and lid). The double underscore matters: ids contain single underscores, so `int_screen_left` must not be parsed as id `screen` with suffix `left`. `int_monitor_screen` stays a distinct contract mesh, not a suffix of `monitor`.

Renamed on 2026-09-15 while no GLB existed: `projects`→`screen_left`, `pegboard`→`screen_right`, `door`→`phone`. Mesh and camera names follow (`int_screen_left`, `cam_phone`, …). Content refs are unchanged, so no copy moves.

`int_monitor_screen` remains the laptop's separate flat screen facing local +Z. Existing case-study IDs stay stable. Certification remains available through CV/skills content. Locale is a persistent UI control. Geometry is procedurally authored in Blender 5.2 via headless Python scripts under `tools/blender/`, exported to `public/models/room.glb`. The scripts are the source of truth and are committed; the GLB is a build artifact. It is a Blender-authored model, not a photogrammetric scan — describe it that way and no other. `pnpm build:model` regenerates the GLB and `composables/generated/cameraFocus.ts`; `pnpm preview:model <file.png> [--shot <id>] [--lens <mm>]` renders a still from any `cam_` empty for comparison against `docs/reference/`. Camera focus points are generated, never hand-edited — Blender is the only place they are authored. The GLB is committed so the site builds without Blender installed. No new career facts.

The desk map replaces the original physical language sign, so `toggle-locale` is no longer a scene-object action; language remains permanently reachable in the HUD. `toggle-sound` is the one desk-specific addition to `SceneObject.action`.

## Likeness correction — approved after preview feedback

The user rejected the generic appearance and approved a reference-led likeness pass. This supersedes the earlier direction to remove the toys' identifying features. Reconstruct the photographed objects, including goggles, eyes, clothing, sign artwork, and the figure's actual proportions. Do not call this an automatic image conversion or an exact scan.

- First checkpoint: the placard-holding Minion (`cards`) plus corrected desk composition. Review a still before extending the treatment to every toy or adding motion.
- Existing IDs and career-content mappings remain stable.
- The placard, hula and coat Minions, Joker figure, and plush are reconstructed from the supplied close-ups. Their procedural geometry is intentionally stylized but preserves the identifying silhouette, colors, faces, clothing, and props.

## Scene composition amendment

Follow the real arrangement. The invented holder wall is removed from the build. The elephant sits in front of the right speaker; the clock sits on the low right-hand cabinet/platform shown in the wider photograph. Match the closer camera framing and rear-mounted monitors. Keep page headings outside the rendered scene.

Static, non-interactive geometry that makes the scene recognizable and must not be omitted: USB-C hub under the toys, laptop riser, Magic Mouse, desk mat, phone stand, wall, and the two speaker satellites.

## Screen content

Both monitors show flat two-colour green pixel art; the laptop shows amber pixel art with widget cards. These are generated as canvas textures at runtime, not photo crops — cheap, sharp at any resolution, and they carry the scene's visual identity. The laptop's world-clock widget (Tehran, Istanbul, Stockholm, London) is where `location` content lives; no separate window object is needed.

Reference photographs are committed at `docs/reference/` (downscaled from originals in `~/content-creating/Image Data/MyDesk/`). `desk-wide-lit.jpg` is the arrangement authority; `desk-wide-dark.jpg` is the night-lighting reference.

## Work split

- Scene agent: desk, side cabinet, screens, peripherals, `cam_` empties, lighting, responsive composition, animation runtime, CSS3D editor host.
- Toy agent: Blender Python modules for the reference-led toys, with named animation pivots.
- Main agent: concept reference, content mapping, UI, editor, accessibility, integration and QA.

## Acceptance

- Desk and object arrangement recognizable from `docs/reference/desk-wide-lit.jpg`.
- All 13 objects have pointer and keyboard access; toys respond without constant distracting loops.
- Laptop opens the original DOM editor; desktop screen integration and mobile full-screen mode.
- No autoplay audio; reduced motion and low-quality/device fallback supported.
- Contact/CV remains available; unpublished contact values remain explicit.
- Lint, typecheck, unit tests, browser tests and production build checked; actual remaining limitations documented honestly.


## Approved room checkpoint integration

The Room Light checkpoint in `tools/blender/review/reference-restyle/room-light-dark.blend` supersedes the earlier desk reconstruction. Export with `pnpm export:room`; never run `build:model` to deliver this room. The live checkpoint is unchanged. Active objects now number 12: only plush/Welcome is omitted; historical copy and `cam_plush` remain.

`int_screen_left` and `int_screen_right` are curved halves of one ultrawide canvas (U 0–0.5 / 0.5–1), retaining separate interactions. `int_monitor_screen` remains a separate flat local +Z plane with full 0–1 UVs. Embedded image assets plus deterministic runtime wool, plaster and wood grain explicitly replace the planned `room_day.ktx2` path for this integration. Lighting follows system preference without a Pinia schema change.
