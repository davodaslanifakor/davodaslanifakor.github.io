# Joker garage adventure — Blender study

2026-10-18. **Blender blockout and authored animatic. Not implemented as browser gameplay.**

The user approved a Blender study of Joker discovering a hidden LEGO-style car, climbing inside, switching to his eye view, riding a lift and jumping onto the desk. Keyboard typing and monitor-cable interactions are explicitly excluded for Joker.

## Open and review

- Blender file: `tools/blender/joker-adventure/joker-adventure.blend`
- Active scene: **Joker Adventure Blockout**.
- Timeline: frames **1–816**, **24 fps**, 34 seconds. Return to frame 1 and play.
- Camera markers follow Joker, reveal the garage, move into the cockpit, and show the lift, landing and phone crash. The saved scene opens with the crash aftermath. Rewind to watch the complete route.
- Renders and animation preview: `docs/renders/joker-adventure/`.
- Geometry/contact checks: `docs/renders/joker-adventure/validation.json`.

## What exists

The actual room GLB was imported into a new scene. Its desktop objects received the website's -0.25 m X offset. The source GLB and original Blender checkpoint were not edited. Runtime website screen artwork and RGB effects are not part of this Blender import, so display surfaces appear blank in the study.

The current exported bookcase differs from the earlier library construction brief: it occupies X 1.166–1.854 m, Y -0.075–0.345 m, with shelf tops at Z 0.047, 0.442, 0.852, 1.257, 1.672 and 2.092 m. Two lower storage bins exist. The left bin and its handle are hidden only in the study and replaced by a hollow garage. This avoids assuming usable space beyond the room's right wall.

Built assets:

- Violet/lime LEGO-style car with studs, grin grille, headlights, rear fins, exhausts, seat, dashboard, gauges, steering wheel, windshield frame, separately pivoted doors, front steering and four spinning wheels.
- Joker cloned from the existing geometry, with rigid hip and shoulder pivots. His original display figure is hidden in this study only.
- Grapple ring and animated cable; folding eight-panel umbrella for the descent.
- Book latch, hollow garage, sliding false front and threshold apron.
- External lift with rails and pulleys, folding ramp and landing pad. The original six breakable bricks are hidden in the updated ending.
- Phone-crash ending: car steers into the actual phone stand, recoils, the support detaches, and the phone topples and bounces face-up. Twelve branching crack paths, a missing glass corner, two flickering display lines and six flying glass pieces appear on desk impact. Rewinding restores the intact phone and hides the damage.
- Overview, traversal, garage, car detail, entry, cockpit and jump cameras.

The car's local forward axis is -Y. Blender is Z-up. All new objects use a study-only `JA_` prefix. There are **no changes to section 4's production mesh, camera, content or Pinia contracts**.

## Sequence

| Frames | Action |
| --- | --- |
| 1–59 | Joker leaves the speaker and lands on the desk |
| 59–148 | Walk toward the library and grapple to the shelf |
| 149–198 | Open the umbrella and descend to the lower storage bay |
| 198–248 | Tilt the book latch and reveal the car |
| 257–340 | Open the left car door, climb in and move the camera to Joker's eye position |
| 340–390 | Drive across the garage apron onto the lift |
| 390–490 | Lift the car above desk height |
| 490–568 | Deploy the ramp, turn and accelerate toward the desk |
| 568–610 | Jump, land and settle the car body |
| 610–654 | Steer toward the phone and strike its stand |
| 654–692 | Car recoils, stand breaks away and phone falls onto the desk mat |
| 692–722 | Screen fractures, glass pieces scatter, phone bounces and settles |
| 722–816 | Hold the damaged phone and Joker's reaction in view |

## Prototype limits and next implementation work

This animatic validates composition, scale, moving-part ownership and a readable route. Keyframes author the vehicle and actor paths. There is no live steering, character controller, gravity simulation, general collision system, interaction hint UI, sound implementation or browser hookup yet. The keyframed jump is not evidence of a physically simulated trajectory. Close hand/foot contacts and the car-entry pose need a further animation pass; the existing Joker cape is still rigid.

The garage door opens in front of the shelf fascia so it does not pass through the shelf board. The lift is outside the shelves, with a small apron bridging the garage exit. Cockpit framing places the wheel and hands below the forward view; the windshield header was raised after visual inspection.

Next: turn this route into a playable vertical slice using the existing room lifecycle. Export a dedicated game asset only after deciding its loading/performance budget; do not silently add this entire study to `public/models/room.glb`. Implement contextual E prompts, movement and gadget controls, vehicle enter/exit and camera ownership, checkpoints/reset, synthesized or licensed sound, reduced-motion camera behavior and touch controls. Keep CV/contact reachable. Do not reuse Minion keyboard or monitor-cable actions for Joker.

## Reproduce

In a fresh background Blender process, run these scripts in order with `--python`: `import_room.py`, `build_blockout.py`, `finish_blockout.py`, then `add_phone_crash.py` from `tools/blender/joker-adventure/`. The final script appends the phone ending and saves the study to its dedicated file; it guards against duplicate application. In the live Blender connector, pass the build/finish/crash source directly; safe mode does not permit external Python execution or linking external .blend libraries. The study uses the allowed GLB import instead.

Render the saved file with `render_study.py`. It writes five stills, measured validation results and 816 640×400 PNG frames. Encode them at 24 fps into the preview MP4. Render exports never save over the Blender source.

## Verification

- Inspected the room overview, car close-up, cockpit view and eight moments across the animation using Blender's viewport.
- Authored-scene checks include garage/wheel height, sampled lift contact, landing region and height, eye height, door clearance and required animated objects. The phone ending adds checks for no premature cracks, bumper proximity at stand impact, visible damage after impact, a face-up landing on the mat and rewind restoration. These validate the keyframed scene, not a live collision solver.
- Project lint, typecheck and production build pass.
- Unit tests: **90 pass; one pre-existing checkpoint SHA mismatch fails** in `tests/roomAsset.spec.ts:28`. The checkpoint and metadata were not changed.
- Existing Joker-card browser checks: an initial concurrent run timed out in all three tests. A serial retry after rendering finished passed mobile memory play, but desktop memory play still timed out and normal shuffle remained in `shuffling` beyond its 12-second expectation. **1 passed, 2 failed.** No website runtime or test files were changed in this study; these failures remain unresolved. Browser verification results are not evidence of a playable new adventure.
- Phone-ending verification: all **26 scene checks pass**, including rewind restoration. Lint, typecheck and build pass again; unit tests remain 90 pass / one existing checkpoint mismatch. The existing mobile Joker-card browser test was rerun and timed out clicking “Hide the star” on replay. That test remains unreliable; no website code was edited for the phone ending.
- The updated export contains five stills and a 34-second H.264 preview at 640×400, 24 fps. The preview is silent. Raw render frames are ignored by Git and can be regenerated.

Source scripts, assets and renders for this study are separate from pre-existing workspace changes.
