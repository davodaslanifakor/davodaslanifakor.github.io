# Joker playable slice

Approved next step after the Blender prototype and phone-crash ending, 2026-10-18.

Component boundaries:
- `utils/jokerAdventure.ts`: pure fixed-step character/car movement, surfaces, collision gates, checkpoint recovery and interaction states.
- `composables/useJokerAdventure.ts`: session ownership, input, pause/reset and gesture-unlocked sound.
- `utils/jokerAdventureScene.ts`: owned GLB lifecycle, authored interaction playback, actor/car overrides, camera framing and restoration of source objects.
- `components/games/JokerAdventure.vue`: thin 3D lifecycle wrapper, reports load/error and exposes a frame update.
- `components/games/JokerAdventureControls.vue`: localized keyboard/touch controls and one nearby world-anchored interaction hint.
- `RoomScene.vue`: composes these pieces within the existing room loop and selection lifecycle.

The continuous walking/driving/jumps are runtime-controlled. Short authored transitions handle leaving the speaker, grappling/gliding to the garage, operating the lift and the phone crash aftermath. Contact choreography handles the book latch and boarding. E prompts are gated by proximity. Driving into the phone at speed triggers the crash; merely waiting does not. Falling resets to a safe checkpoint. Exit restores source object visibility and camera settings; returning opens a fresh session. Character keyboard typing and monitor-cable actions remain excluded.

All visible copy belongs to `content/portfolio.ts`. `/cv` stays independent. Reduced motion uses a stable third-person overview and short/direct interaction transitions; it does not remove movement controls. Touch controls, paused-tab behavior, loading/retry, sound mute, reset and exit are part of the slice.

## Playing this version

Open Joker in the room, then choose **Start adventure**. WASD or arrow keys move on foot. Space jumps. Move toward the right desk edge; the E hint appears near the grapple point. Pull the nearby book latch after landing at the bookcase, then approach the car and enter it.

In the car, W/S accelerate/reverse, A/D steer, Shift boosts, Space jumps and C switches cockpit/chase views. Drive onto the lift, release the throttle and use E when stopped. At the top, accelerate toward the desk and jump from the ramp to clear the speaker. A moving bumper collision knocks over the phone, breaks its support and reveals cracked glass. Slow bumps do not trigger the crash. Landing on the desk unlocks free exploration; the phone stunt is optional and returns control after its aftermath. Touch buttons provide the same movement, boost, jump and nearby actions. P pauses; Escape returns to the room.

The car uses arcade acceleration, gravity and bounded collision geometry, not a vehicle rigid-body engine. The garage, car and Joker are the Blender blockout assets. The phone aftermath follows the authored fall, while its collision trigger and the car’s contact/recoil position come from gameplay. Sound effects are lightweight synthesized cues. Further model detail, engine audio, destructible objects and additional missions remain future work.

## Verification

Movement/proximity/jump/fall/impact tests cover the route. Scene tests verify the final broken phone pose, reset, preservation of pre-existing visibility and camera restoration. Browser tests exercise keyboard/touch controls, cockpit switching, garage/lift traversal, ramp-to-phone collision, pause/reset, exit/re-entry and failed-load retry. Both normal and reduced-motion modes are covered.

The existing room-asset test has an unrelated checkpoint SHA mismatch between its metadata and the Blender source. This slice does not update that source or its metadata.

## Handling and camera refinement

The camera now lives in `utils/jokerAdventureCamera.ts`: it uses a front view of the garage, a wide grapple shot, lift framing, eased chase/cockpit changes and obstacle clearance. Its optical centre accounts for the HUD; it restores projection on exit. The room camera stops writing its overview position during game resize.

`JokerAdventureControls.vue` receives the measured interaction action from the session and presents the current objective, destination hint, view/drive state and session controls. `JokerMovementPad.vue` owns held pointer/keyboard movement buttons and emits movement/jump intent. Physics stays in `utils/jokerAdventure.ts`; the session coordinates recovery, collision-aware dismounts and sound.

B brakes, R returns to the current area's safe checkpoint, and C changes view. Initial boarding uses the exterior view so the lift route is visible. The parked car is solid to Joker. Dismounts choose a supported, unobstructed side; desk falls keep the player near the parked car. Boost release decelerates gradually. Destination rings and stage-specific instructions point out the car, lift and ramp without requiring memorized timing. The motor tone follows speed and stops on pause/exit/mute.

Refinement validation: 112 unit tests pass; the existing source/checkpoint hash assertion remains the sole failure. Lint, typecheck, production build and all four adventure browser scenarios pass. Regression coverage includes parked-car collisions, supported exits, boost deceleration, late/buffered jumps, full-car speaker clearance, camera easing/obstruction, portrait garage framing, projection restoration, focus-loss pause and motor cleanup. Browser coverage also exercises dismount/re-entry, braking onto the lift, cockpit resize and recovery.

## Physical latch and boarding interactions

The garage pull and car entry now use deterministic contact choreography on the exported LEGO rig. `jokerInteractionPose.ts` owns timing, approach paths, the book grip and car-relative seat/door anchors; `jokerInteractionRig.ts` applies the rigid hip/shoulder poses and persistent prop state. Other transitions still use the Blender animation. No room mesh IDs, room cameras or shared Pinia contracts change.

The book has a reachable grip. Joker turns toward it, reaches, steps backward while pulling it toward himself, then releases as the garage rises. The final rendered position matches the gameplay position. Boarding chooses the nearer door, approaches around the bumper, pulls the hinge outward with hand contact, steps through the doorway, turns into the seat and places both hands on the wheel before the door finishes closing. The cushion and steering column fit the actual figure. Re-entry uses the same sequence at the parked car's current position and heading, including on the desk; it preserves the raised lift and garage. Pause freezes the interaction clock, and reduced motion keeps the stable area camera and shorter transitions.

Interaction views show the pulling hand and keep the car visible between the lift rails. Regression tests use the shipped model's real mesh bounds and pivots to check hand contact, seat contact, approach clearance, endpoint continuity, both hinges, parked-car transforms, pause/reduced motion and rail clearance. Browser captures show the book grip, open car door and seated driver.

Validation for this pass: lint, typecheck and production build pass; 123 unit tests pass, with the same pre-existing room-checkpoint checksum failure. All four adventure browser scenarios pass, including pauses during the book pull and boarding, re-entry, the full driving/crash route and reduced motion.

## Free exploration after the escape

Start at Joker, reach the garage, pull the book latch, board the car and raise the lift. Jump from the ramp onto the tabletop to unlock free play automatically. There is no direct-to-desk start button. The landing preserves the car's position, heading and momentum; it does not teleport to a parking space or require phone damage. Steering away from the phone during the jump leaves it intact. Driving into it remains an optional stunt, with control returning automatically after the aftermath.

Once on the desk, drive, boost and jump, stop to get out with E, run with Shift, jump onto low objects, and return to the parked car. On foot, the ring and screen marker stay attached to the actual car. R recovers a fallen character near that car; recovering while driving finds a clear desk parking space. Reset starts the escape again and locks free play.

Car collision uses an oriented footprint. Steering cannot rotate the body into props, contact only removes the blocked part of movement, and shallow existing overlaps can separate. This fixes the speaker-side trap where a turn expanded the old bounding box into the cabinet and permanently blocked forward and reverse. Regression tests reproduce that trap and verify reverse escape without R, while garage and desk obstacles remain solid.

`utils/jokerDesk.ts` owns desktop recovery parking and the settled crash position. All state remains local to the game, with no room mesh, camera or Pinia contract changes. Damage transforms are preserved independently from the actor's animation, so walking and re-entry do not restore the phone. Reset/exit still restore the original scene.

The laptop deck is measured separately from its upright display so Joker and the car can land on it. Other toys, the large monitor and its stand are solid obstacles. Jumping stops at solid undersides; dismounting supports both the desktop and the top of an object. The camera checks measured obstructions and does not push through nearby screens to maintain a minimum distance. Reduced-motion and touch modes retain the same movement abilities.

Browser coverage follows the complete adventure with desktop, touch and normal-motion controls, plus failed-load retry. It checks the absence of a direct desk shortcut, landing before phone damage, optional crash continuation, running/jumping, dismount/re-entry, pause/reset and room return. Unit coverage includes steering beside the speaker, separating existing contact, real-mesh ramp landings, tabletop traversal over the laptop, recovery near the car, independent phone damage and camera clearance.

Validation: lint, typecheck and production build pass. All four browser scenarios pass, including full tabletop entry on keyboard/touch and automatic continuation after the optional phone crash. The unit suite has 137 passing tests and the same pre-existing room-checkpoint checksum failure.

## Room driving, nitro and umbrella descent

The car now collides with the rear wall, room boundaries, desk legs/underside and bookcase structure. Collision dimensions include the visible tyres and exhausts. A rotated parked car uses its actual footprint for walking and side exits, so its empty bounding-box corners no longer block Joker. The floor and raised rug both support driving, jumping and dismounts; a sloped apron connects the lower lift/garage to the floor. Floor recovery stays on the floor.

The first escape still requires collecting the car and reaching the desk. A nearby **Space · Jump to the desk** prompt gives a launch cue. Missing that first jump returns the car to the raised lift. After a successful desk landing, leaving the front or side edge deploys the car's umbrella automatically. Descent speed is capped, steering and braking remain available, and the canopy folds on landing. The player can then drive, jump, get out and reboard on the floor. Nitro does not propel the car during an umbrella descent.

**Shift** fires two animated exhaust jets, including when revving at a stop. The existing Blender umbrella expands above the car with suspension tethers. `jokerVehicleEffects.ts` owns these effects; `jokerRoom.ts` owns floor dimensions, boundary protection, recovery and apron heights. The nitro light stays in the render list at zero intensity when idle, avoiding a lighting shader change on each boost. Reduced motion preserves the visible jets and canopy while removing rapid flicker and light pulses. Pause freezes both movement and effects.

`jokerLiftPose` supplies a single continuous position for the platform, car and gameplay state. Its 3.6-second rise includes alignment, ascent, ramp deployment and a turn toward the desk, with matching endpoints. Door/lift progress is visible in the HUD. The authored animation is sampled only when its required pose changes; custom door, boarding and lift motion no longer resamples unrelated tracks every rendered frame. Scripted transitions can catch up through a dropped frame without becoming slow motion, while driving retains bounded fixed-step physics.

Movement reference: [Levi's basic movement guide](https://devlog.levi.dev/2021/09/building-platformer-ai-part-1-basic.html), especially air control, speed limits, friction and forgiving jump timing. The named search-service connector exposed no callable search tool in this session; the reference was found and read through the browser. The umbrella deployment and garage route are project-specific designs validated against the actual room assets.

Regression coverage includes wall contact/reversing, floor/rug support, safe descent and folding, floor jumping/dismounts/re-entry, garage apron continuity, missed-launch recovery, rotated-car side exits, exact tyre/platform contact, animation sampling, ten-FPS interaction timing, exhaust alignment and effect pause/release. Browser playthroughs cover these additions on keyboard and touch alongside the existing full-animation phone route and failed-load retry.

Validation for the room-driving pass: lint/typecheck pass; the full unit suite has 150 passing tests and the same pre-existing room-checkpoint checksum failure. All four adventure browser scenarios pass, including desktop and touch nitro/glide/floor playthroughs. The final cleanup was additionally checked with all 64 Joker unit tests, including tether disposal and immediate dismount after landing.

## Demo finishing pass — 2026-10-18

After reaching the tabletop, return to the glowing call marker in front of the garage. Stop and press **E / Call lift**. The ramp folds before the empty carriage descends; Joker and the parked car stay in place. Drive onto the lowered carriage, press **E / Raise the lift**, and use the ramp again. The jump prompt is available on every trip. The call interaction works on foot and in the car, and refuses to lower over a parked car beneath the platform. Unit tests follow the return route against the measured room geometry.

During games the portfolio HUD retains Contact and CV links while hiding identity, room-reset and ambient controls. Recovery, restart and sound settings live in Pause. Scripted interactions hide the movement pad, and the camera uses the measured mission/footer sizes when framing gameplay. The mobile mission card becomes smaller in free play.

`jokerVehicleMotion.ts` adds a soft contact shadow on the actual supporting surface, damped acceleration/steering reactions, and a settling suspension on landing. It moves the seated figure with the chassis, keeps collision physics unchanged, freezes on Pause, and removes decorative movement for reduced motion. `jokerMotorAudio.ts` supplies a bounded reusable motor/airflow graph, with engine harmonics, boost exhaust and umbrella wind; pause, mute and exit dispose its sources. Close camera obstructions now try alternate clear angles before settling beside a wall; regression cases cover reversing by the rear wall and jumping beneath the desk.

The supplied Spotify **Light** playlist replaces all sample songs. Resource parsing accepts track/playlist/album URLs, fallback uses the proper playlist embed, and current-song playback events remain associated with the mounted playlist selection for RGB synchronization. Track-specific and stale-controller checks remain intact. Its title was verified with Spotify oEmbed.

David's supplied square portrait is packed into the Blender checkpoint and exported on `static_style_art_portrait`, inside the existing shelf frame with a cream mat. Reapply using `tools/blender/set_library_portrait.py` against the checkpoint, then `pnpm export:room`. The former mountain illustration is hidden. The source/export checksum mismatch was reproduced and resolved with a fresh export: before the portrait was applied, node inventory, cameras, bounds and export byte counts matched the previous export exactly. No §4 room mesh/camera/content/Pinia contracts changed.

Manrope and DM Mono are now served locally, with their OFL license files, so remote font stylesheets cannot delay the demo. Playwright supports production-server checks and WebKit alongside Chromium; macOS Chromium uses Metal consistently for all scene tests.

The broader browser pass also exposed a Minion callout covering another prop on small screens. Hints now keep nearby click destinations clear, and the browser test waits for the camera-dependent movement controls to become ready before clicking a projected 3D point. A regression test protects the speaker destination from the cable callout.

Finishing-pass verification: lint, typecheck, production build, and all 158 unit tests pass. All 52 distinct Chromium/WebKit production browser scenarios were verified across the full run and the focused rerun after the Minion hint fixes (10/10 passed). See `docs/DEMO_READINESS.md` for exact run coverage and remaining real-device/public-launch items.
