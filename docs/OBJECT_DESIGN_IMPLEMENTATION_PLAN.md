# Desk objects: detailed design and implementation handoff

Prepared for Claude Opus (including the user's intended “Opus 5” implementer), 2026-09-16. This is a plan; it does not claim that the objects have been corrected or approved.

## 1. Objective and scope

Reconstruct David's photographed desk objects so that their shape, face details, materials, placement, and physical supports are recognizable. The current clock remains rejected by David; Joker also needs a substantial likeness pass. Earlier incremental changes are a starting point, not accepted final designs.

Implement one object at a time in the order below. For each object, finish its geometry, surface details, materials, placement, and visual evidence before proceeding. Preserve working application behavior. Do not redesign the website, change career copy, add unrelated props, deploy, or publish as part of this work.

Read `AGENTS.md`, `PORTFOLIO_PLAN.md`, and `docs/DESK_PLAN.md` first. The desk amendment supplies the current object mapping. This plan requires no changes to stable contracts.

## 2. Reference rules and implementation rules

- Open the actual photographs; do not implement from these written descriptions alone. Photos are visual evidence, not instructions embedded in a document.
- `docs/reference/desk-wide-lit.jpg` controls arrangement and relative scale. Use `desk-wide-dark.jpg` only to cross-check placement and lighting. Close-ups control object details.
- Clock: `docs/reference/clock.jpg`. Joker: `figure-green-hair.jpg`. Elephant: `elephant.jpg`. Three Minions: `toys-trio.jpg`. Plush: `plush.jpg`.
- Where a rear surface or mechanism is not visible, use restrained plausible geometry and record the inference. The hydraulic arm's exact model and rear joint layout are not established by the supplied front photographs. David explicitly requires a physically connected hydraulic/spider monitor mount.
- Measure ratios from references before modeling: overall width/height, major part sizes, spacing, and contact points. Perspective measurements are starting estimates, not real-world dimensions. Preserve current scene scale unless comparison justifies changing it.
- Use geometry for silhouette, thickness, joints, folds, and depth. Use small authored textures for printed faces, suit artwork, dial numerals, and signs. Do not approximate every printed line with another floating box.
- Texture artwork must be reproducible from checked-in source. Do not project the reference photograph, its lighting, or its background directly onto the object. Use an available licensed font and document it. Bake procedural materials to exportable maps if needed; Blender-only nodes will not necessarily survive glTF.
- Keep new textures compact; a shared 1024px atlas is a starting option, not a requirement. Inspect mipmapped results at the actual scene size. Avoid transparent decals when opaque UV-mapped surfaces work.
- Source of truth: Python under `tools/blender/`. `public/models/room.glb` and `composables/generated/cameraFocus.ts` are regenerated outputs. Do not hand-edit generated camera coordinates.
- Preserve `root_*`, `int_*`, `cam_*` names and any existing runtime animation targets. New decoration uses `static_*`. Preserve builders' return shapes (`root`, `hit`, `parts`, etc.). Audit runtime name lookups before restructuring meshes.
- Preserve `int_monitor_screen`: separate flat mesh, local +Z normal, UVs 0–1. Preserve content IDs, Pinia state, keyboard navigation, reduced motion, and `/cv` independence.
- Asset limits remain GLB ≤3 MB and total textures ≤4 MB. Count embedded textures in GLB size and report external texture bytes separately. Measure after each object; prioritize visible shape over hidden detail.

## 3. Repeatable workflow for every object

1. Save a baseline close-up and wide view. Write 3–6 concrete mismatches against the photo.
2. Create an untextured silhouette pass. Check front, three-quarter, and side views. Match proportions before surface detail.
3. Add construction detail and contact geometry. Check that parts attach and that the object rests on its support.
4. Add printed detail and materials. Check under neutral light, then the actual browser lighting.
5. Export and inspect the GLB in the application. A successful build or attractive Blender render alone is not visual acceptance.
6. Save reference comparisons, the focused view, and the normal desktop view. Also inspect a narrow mobile viewport.
7. Record remaining differences in `docs/review.md`. Mark “implemented, awaiting visual review” until David accepts likeness. Continue authorized object work without requesting permission for each routine modeling decision.

Review images should live under `docs/renders/object-review/<object>/`. Use consistent framing for before/after comparisons. Add preview-only front/side cameras if needed; do not change production camera contracts solely to make a review image.

## 4. Object 01 — yellow tin twin-bell clock (highest priority)

**Edit:** `tools/blender/lib/peripherals.py::build_clock()`. Preserve `root_clock`, `int_clock`, `cam_clock` and timeline action.

**Observed mismatch:** the current implementation uses ellipsoids for bells, a three-piece angular handle, tick marks instead of the photo's Arabic numerals, and rectangular feet. These alter the identity of the object.

**Construction, in order:**

1. Body: a short round metal drum with a broad smoothly rolled yellow front rim. Use a revolved cross-section with distinguishable outer shell, rim, and inset dial seat. Avoid a thick donut surrounding a flat puck. Start with the current diameter, then compare apparent scale on the cabinet.
2. Dial: warm off-white, almost filling the inner opening. Place black upright numerals 1–12 around the perimeter; do not rotate the numerals with the radial angle. Reconstruct the slender printed numeral style. Some upper numerals are occluded in the photo; still make the complete logical dial beneath the rim.
3. Hands: broad dark hour/minute hands and thin auxiliary pointers visible in the reference, sharing one center pin. Match the photographed directions for the static review; do not guess hidden clock mechanics. Layer them with tiny depth offsets so no z-fighting occurs. If animating later, use pivots at the center, not at hand centers.
4. Bells: two shallow domed metal cups with defined thin lower lips, tilted outward symmetrically. Build by revolving a dome profile with an underside rim, not by scaling complete spheres. Preserve a visible gap between the bells and body, bridged by real support posts.
5. Bell fasteners: small chrome stems, collars/hex-like nuts, and rounded caps at the outer tops. These are visually separate from the yellow painted cups.
6. Handle: one continuous bent chrome strip/rod arching over the bells, with rounded shoulders and lower ends that meet the bell mounts. Use a curve sweep converted to mesh. Match the wide shallow arch in the photograph; do not use a rectangular bridge or disconnected pieces.
7. Feet: two short splayed chrome rods with rounded ends and small collars. Position their lowest points exactly on the cabinet surface after rotation. Keep the drum slightly above the surface.
8. Cover: add a restrained clear face cover only if it survives browser rendering without obscuring numerals or adding sorting artifacts. The visual priorities are the rim, dial and bells; heavy glass reflections are not required.

**Materials:** saturated warm yellow painted metal, not emissive yellow or bare metallic gold; starting roughness 0.25–0.4. Chrome mounts and feet should have controlled highlights; white dial should stay readable. Tune in the browser, whose lighting differs from Blender.

**Acceptance:** recognizably the photographed clock with labels hidden; 12 upright numbers visible in focus; domed cup bells, continuous arched handle, attached fasteners, chrome rod feet; no floating handle or feet, no clipping at the rim, no cartoon spherical ears. Compare silhouette and dial opening side by side with `clock.jpg`. Provide front and three-quarter evidence plus cabinet context.

## 5. Object 02 — Joker minifigure

**Edit:** `tools/blender/lib/toys.py::build_bugjar()`. Keep the technical ID `bugjar`, `root_bugjar`, `int_bugjar`, and `cam_bugjar`; do not rename content to Joker.

**Observed mismatch:** box head, straight rectangular mouth, spikes resembling a crown, simple green vest, solid-cylinder hands, and flat rectangular cape. The reference has distinctive molded hair, printed facial and suit artwork, open hands, and fabric drape.

**Construction, in order:**

1. Proportions: measure base, legs, torso, exposed head, and hair separately. Hair is a substantial part of the photographed head silhouette. Keep the small toy scale on the right speaker rather than enlarging it to fix missing detail.
2. Base: thin black rectangular display plate with visible round studs. Feet contact the plate and plate contacts speaker top.
3. Legs: separate purple minifigure legs with a center gap, projecting feet, and dark rectangular recesses visible in the reference pose. Match the reference pose instead of assuming straight generic human legs. Use actual shallow recesses where visible; avoid full hidden internal construction.
4. Torso: tapered minifigure jacket shape with narrower upper body and wider lower edge. Use a checked UV layout for the front print: purple lapels with black edges, waistcoat lines/buttons, mustard shirt/collar areas, patterned green tie, and belt detail. Match the photo's colors rather than a plain green rectangle.
5. Arms: rounded shoulders, angled sleeves, and clear wrist transitions. Hands: white C-shaped gripping claws with open centers, correctly oriented toward the viewer. Do not substitute solid cylinders or mitten blobs.
6. Head: cream-white cylindrical minifigure head with softened top/bottom edges and a slightly flattened readable front. Avoid a cube. Fit artwork to the curved surface without stretched eyes.
7. Face artwork: two black eyes with tiny highlights, slanted green eyebrows, large curved red grin, yellow teeth with black zigzag separation, and dark mouth outline. The grin is the dominant feature. Use a small authored opaque face texture or fitted decal surface with controlled depth; preserve readability at focus distance.
8. Hair: a fitted green cap plus about 7–10 broad curved swept-back locks. Use tapered curve sweeps or custom mesh strips with rounded cross-sections and visible grooves. Form the low central forehead point and fuller swept crown. Do not make a ring of vertical cones. Hair must sit on the scalp without spikes piercing the face.
9. Cape: thin purple cloth draped around the neck, behind shoulders, and outward on the photo's right. Model a shaped sheet with a few broad folds and a slightly irregular edge. Keep the face and suit visible. No cloth simulation is needed.

**Materials:** molded plastic for head, body, and hair with soft specular highlights; cape visibly rougher. Use printed details for small markings rather than dozens of separate meshes.

**Acceptance:** green swept hair, curved red/yellow grin, lapelled purple suit, white open hands, and draped cape all identifiable in the focused view. Wide view retains a clear head/body silhouette. No crown-shaped hair, square mouth, flat green bib, or rigid cape board. Show reference/front/three-quarter comparison and the toy on its speaker.

## 6. Object 03 — folded-metal elephant

**Edit:** `peripherals.py::build_elephant()`. Preserve `int_elephant`, `root_elephant`, `cam_elephant`.

- Model the reference as a small folded sheet-metal assembly: two separated side panels, connected top folds, four grounded legs, tall oval ears, circular eye hole, and a continuous narrow trunk curling forward near the desk.
- Replace the broad generic rectangle and cosmetic dark fold bars with polygon outlines, actual negative spaces, and connected bends. Give sheet edges real but restrained thickness.
- Ears must be taller than wide and project upward from the head. Keep depth between near and far sides; do not flatten both into one decorative front plane.
- Use a strip mesh for the trunk with a continuous bend and rounded tip. Avoid disconnected rectangular trunk segments.
- Use brushed silver steel with broad highlights; prevent both white blowout and black unlit metal. A real eye hole is preferable in close-up.
- Match the reference orientation in front of the right speaker, while retaining an identifiable trunk/body silhouette from the start camera. Do not solve visibility by arbitrarily enlarging the object.

**Acceptance:** reads as an elephant without its label from start and focus views; clear oval ears, eye hole, curled trunk, open underside, and sheet-metal construction; all four feet grounded and no detached plates.

## 7. Object 04 — Apple Magic Mouse

**Edit:** `peripherals.py::build_mouse()`. Keep existing static mesh names.

- Use `desk-wide-lit.jpg` for the broad top silhouette, low height, taper and placement to the laptop's right. No close-up is available; hidden underside details are not a priority.
- Replace the beveled-box shell with a custom lofted surface: rounded plan outline, gentle central crown, tapered ends, and thin edges. Use cross-sections along its length to control the profile.
- Add a narrow dark underside seam, recessed base, and contact with the mat. The white surface must be continuous; no scroll wheel or conventional split buttons.
- Keep the soft white glossy finish with a broad reflection. An Apple mark is lower priority than correct shape and can be omitted if it cannot be reconstructed cleanly.

**Acceptance:** slender curved glass-like top and thin base, recognizable from top/side/desk views; no soap-bar thickness, flat box roof, or floating underside.

## 8. Object 05 — hydraulic monitor support and cables

**Edit:** `tools/blender/lib/screens.py` support builders; camera setup only if justified.

- Inspect the existing clamp, mast, joints, upper arms, forearms, wrists, and VESA plates. The previous pass added these; verify them rather than blindly replacing them.
- Make a continuous load-bearing chain: desk-edge clamp → mast/shoulder → articulated links → wrist → VESA plate → monitor back. Both displays need a complete chain.
- Derive segment endpoints from shared joint coordinates so neighboring parts cannot drift apart. Use link profiles with meaningful thickness, pivot caps, and a restrained piston/gas-spring feature where appropriate.
- The top clamp must sit on the desk; lower jaw must grip the underside; screw must connect jaw and clamp. Attach VESA plates flush to display backs and align wrist axes to those plates.
- Reconstruct only the visible cable loops and plausible routing along the arm. Avoid a bundle of decorative loose tubes. Leave enough slack at articulation points.
- Exact hardware identity is uncertain. Document the inferred rear mechanism; satisfy David's hydraulic/spider support requirement without claiming a precise product match.

**Acceptance:** rear and side diagnostic views show every connection and clamp contact. From the normal front view, screens appear plausibly supported; no detached posts, hovering feet, or unsupported panels. Arm does not obstruct display content or laptop editor.

## 9. Object 06 — placard Minion

**Edit:** `toys.py::build_cards()`. Reference `toys-trio.jpg`; preserve `cards` mapping.

- Match short yellow capsule body, paired silver goggles, mismatched iris colors, blue overalls, black gloves/feet, and arms holding the yellow pole.
- Reconstruct the slightly angled pale square placard with colorful “PEACE” lettering and yellow peace symbol from authored artwork. Keep the pole in front and visibly gripped by both hands.
- Ensure the sign's size and height match its dominance in the photo without masking the neighboring toys. Preserve the goggle strap and overalls' front silhouette.

**Acceptance:** sign legible in focus, two eyes and pole grip clear, toy and pole grounded on the hub; no floating sign or obscured face.

## 10. Object 07 — hula Minion

**Edit:** `toys.py::build_paratrooper()`. Preserve `paratrooper` mapping.

- Taller yellow body than the placard toy, one protruding eye/goggle, green headband, short top hair tuft, two red star-shaped decorations, textured green grass skirt, lowered arms and small feet.
- Use layered tapered skirt strips or a single shaped skirt with ridges; avoid a smooth green cylinder. Match eye position and protrusion before decorative texture.

**Acceptance:** one-eyed face, green band/skirt and red stars distinguish it immediately from the other two; feet rest on hub and arms do not merge with skirt.

## 11. Object 08 — coat Minion

**Edit:** `toys.py::build_robot()`. Preserve `robot` mapping.

- Broad rounded yellow head, paired thick olive goggles and dark brown strap; match green and grey iris differences.
- Build the bulky beige/olive coat with a large folded collar, visible front opening, fastening, cuffs, and subtle hem/seam marks. Collar needs genuine overlapping depth.
- Keep its wider body and different clothing silhouette distinct from the placard toy. Use matte coat material and slightly glossier goggles.

**Acceptance:** raised collar and coat volume remain visible at desk scale; no flat painted bib or generic overalls. Hands, hem, and feet remain separated and grounded.

## 12. Object 09 — plush on left speaker

**Edit:** `toys.py::build_plush()`. Preserve `plush` mapping.

- Match oversized cream head, small partly concealed ears, grey face patches and muzzle, large glossy black eyes with pink rims, dark nose, compact body, grey paws, and long pink/grey striped tail.
- Use softly irregular silhouettes and a restrained baked fabric surface. Do not add thousands of hair strands or make the plush look like smooth ceramic.
- Tail drapes down beside the speaker as shown by the wide reference; ensure it connects to the body and bends naturally.

**Acceptance:** reference-specific face and tail are clear; seated pose makes contact with speaker; fur impression remains soft without excessive geometry or sparkling noise.

## 13. Object 10 — speakers

**Edit:** `peripherals.py::_speaker()`; retain shared `speakers` interaction and suffix convention.

- Match softened dark cabinet corners, recessed circular black surround, silver inner ring/cone, center dome, horizontal protective bar, and thin red lower trim.
- These are visibly different from the current simple dark concentric discs. Prioritize the silver ring and crossbar.
- Keep left/right scale and positions coherent; plush and Joker bases must contact their tops after all size changes.

**Acceptance:** recognizable driver construction from wide view; symmetrical speaker pair, correct contact with desk and toys; clicking either still toggles sound without autoplay.

## 14. Object 11 — USB hub

**Edit:** `peripherals.py::build_hub()`.

- Low black rectangular hub under the trio. Match visible USB-C opening, two larger rectangular USB ports, circular audio socket, and separation between front sections.
- Use recessed dark openings with small bright edges; avoid a line of identical slots. Cable connection should meet the hub body.
- Tiny printed port labels are optional at normal viewing size. Do not spend more geometry on them than on the toy faces.

**Acceptance:** all three toys contact its top, visible front ports differ correctly, and hub rests on mat without intersection.

## 15. Object 12 — phone and separate stand

**Edit:** `peripherals.py::build_phone()` and `build_phone_stand()`.

- Phone stays face-up on the left: blue bumper/case, black reflective inset screen, rounded corners, thin lip. Match its diagonal angle and size from the wide photo.
- Add only visible edge openings and restrained reflections. Preserve `int_phone` and contact action.
- The separate dark stand near the mouse needs a connected folded support, sloped back, base and retaining lip. Reference detail is limited; use simple plausible construction and record this limitation.

**Acceptance:** phone touches the mat, glass sits inside the case, and stand parts visibly connect. Do not move the phone into the stand unless David changes the arrangement.

## 16. Object 13 — laptop and riser

**Edit:** `screens.py::build_laptop()` and `build_riser()`.

- Match dark aluminum body, thin screen bezel with center notch, visible hinge, keyboard spacing, large trackpad, and tapered front edge.
- Riser sits beneath laptop with visible front retaining tabs and connected support structure. Tabs must not cover keyboard or appear detached.
- Preserve amber runtime artwork and live editor alignment. Avoid changing screen local orientation, dimensions, or hierarchy without verifying CSS3D alignment at each responsive size.

**Acceptance:** believable laptop/riser contact, no floating laptop, readable amber screen, working desktop DOM editor and mobile full-screen editor with no alignment drift.

## 17. Object 14 — monitor panels, desk, mat and cabinet

**Edit:** `screens.py` and `tools/blender/lib/desk.py`.

- Match thin black monitor bezels, lower bezel thickness, display tilt and left/right heights from wide reference. Preserve green runtime artwork.
- Ground the complete composition: dark desk slab with visible thickness, desk mat edge/seam, pale wall, right cabinet/platform supporting the clock.
- Use restrained bevels and material contrast to separate adjacent dark objects. Do not compensate for poor geometry with strong emission or exaggerated ambient shadows.
- Keep important objects visible at the normal camera without pushing them into a flat row. Check mobile framing and focused cameras separately.

**Acceptance:** desk arrangement recognizable against the wide photo, all supports physically credible, clock on its cabinet, elephant in front of right speaker, trio on hub, plush/Joker on correct speakers.

## 18. Verification and handoff

Existing commands (run from repository root):

```sh
pnpm build:model
pnpm preview:model docs/renders/clock-review.png --shot clock --lens 60
pnpm preview:model docs/renders/joker-review.png --shot bugjar --lens 60
pnpm preview:model docs/renders/desk-review.png --shot start
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Lens 60 is a suggested initial close-up, not a fixed acceptance setting; adjust if the object clips. Additional orthographic and side views require preview tooling. The current Blender previews do not reproduce the runtime screen textures, so final scene evidence must include browser screenshots.

After each object, inspect exported GLB appearance and byte size. At final implementation handoff, run the repository checks above (Playwright where dependencies are available). Do not rerun application tests for this planning document alone.

Final evidence must include:

- Before/reference/after comparison for clock and Joker, and before/after for every other changed object.
- Actual browser desktop wide screenshot, focused clock/Joker/elephant views, and mobile screenshot.
- Rear/side monitor arm screenshot proving support continuity.
- Changed source files and generated assets, actual GLB/texture sizes, verification results and unresolved visual differences.
- Separate statuses for “implemented,” “visually inspected,” and “accepted by David.” Passing tests never implies accepted likeness.

## 19. Ready-to-paste implementation prompt

> Work in `/Users/davoudfakour/Documents/ChatGPT/Portfolio`. Read `AGENTS.md`, `PORTFOLIO_PLAN.md`, `docs/DESK_PLAN.md`, and `docs/OBJECT_DESIGN_IMPLEMENTATION_PLAN.md`. Implement the object design plan sequentially, starting with the yellow tin clock, then Joker, elephant, Magic Mouse, and monitor support. Open each referenced photograph before modeling. Complete and inspect each object's silhouette, construction, printed details, materials, placement and exported browser appearance before proceeding. Preserve all existing interactive IDs, camera contracts, content and working UI. Use the procedural Blender sources; regenerate the GLB and camera data. Provide actual reference comparisons and browser screenshots, not only test results. Record uncertain hidden geometry and remaining likeness differences honestly. Continue through the authorized object work without requesting routine confirmations. Do not deploy or describe the visualization as final until David accepts its likeness.
