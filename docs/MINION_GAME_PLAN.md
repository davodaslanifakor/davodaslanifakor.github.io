# Minion desk exploration

Updated 2026-10-15. Replaces Banana Dash with a character that inhabits the existing room.

## Experience

Click any Minion (or use its accessible object-navigation button). The selected figure comes from its original place to the front of the desk. The camera follows it while the room remains interactive scenery. There is no separate game board, lane system, score, or start screen.

- Hold WASD or arrow keys to walk in four directions. Space jumps; E interacts with the nearby keyboard, mouse, power button or plug. A floating E hint appears beside the nearby object and can also be tapped. Global object-action buttons and K/M shortcuts are removed; X still stops an action while walking.
- Click a desk surface to walk there. The destination ring marks the target. Automatic walks route around upright obstacles and hop onto low objects; manual input immediately cancels the route.
- Touch controls support held movement and Jump, including simultaneous pointers and release/cancellation outside a button.
- Walk or click near the MacBook Touch ID button, then use its E hint. The Minion bends/reaches and turns the display off at the contact frame. Repeat to turn it on.
- Near the keyboard, E enters typing mode once the character is on the keys. Physical typing sends the Minion to the matching keycap, depresses it on landing and adds the actual character to the screen. Letters, digits, punctuation, Space, Enter and Backspace are supported, including physical Persian-layout keys. Backspace hops to Delete and removes one character. A small focused input supports touch keyboards and composition. Typing requires the laptop to be awake. Arrow movement, Stop or Escape leaves typing mode; a second Escape returns to the room. Browser modifier shortcuts are preserved.
- Key hops use measured key centers and surface heights, short anticipation and a bounded arc. A 12-key queue preserves input order; the scratchpad is bounded to 96 characters. Extra input beyond the queue reports catch-up feedback. Pause/camera transitions freeze the queue and hop; movement/reset/exit clears pending input. Reduced motion uses discrete key-to-key steps. Ordinary footsteps only depress keys and make sound. Joker and the other Minions react to key contact.
- The nearby mouse hint approaches its left side, pushes, hops aboard, coasts, and stops with the character standing on it. Its collision surface moves with the visual; walk or jump off. Travel stops before desk edges and upright obstacles.
- The subwoofer is an interactive prop: its nearby “E · Test the bass” hint walks to the front knob, reaches with both hands and triggers four short bass thumps at the contact moment. The driver, light ring and outward ripples respond; the Minion recoils and the other toys react. The cabinet blocks walking. This is a local sound check, independent of Spotify transport; sound mute, pause, reduced motion, Stop and Reset apply.
- The nearby monitor-plug hint walks to a generated desk power connector, struggles through two tugs, pulls its plug free at 1.45 seconds, recoils, and darkens both halves of the big monitor. Reconnecting reverses the action. The existing hub-to-laptop cable is preserved.
- Stop/manual movement interrupts an action while preserving completed effects. Reset restores devices, keys, scratchpad, mouse position and the character’s starting sequence. Exit restores all original toys, Joker, keycaps, mouse and screen materials and removes the generated cable. These are reversible effects inside the portfolio scene.
- A compact control strip exposes movement, jump, stop, status, sound, pause, reset, and return. Object-specific actions appear only as nearby hints. The rest of the screen stays available for the room.

## Movement and animation

`utils/deskPlayground.ts` measures the shipped GLB after runtime layout. A bounded kinematic body uses acceleration, friction, fixed 120 Hz gravity steps, solid sides, upward collisions, and downward-only landings. Support heights are raycast against actual surface geometry so feet follow the tilted laptop. Bounds prevent falling off the desk. The keyboard, trackpad, mouse, speakers, hub and monitor base are landing surfaces; upright props are obstacles. The shape approximations are intentionally limited to desk exploration, not a general rigid-body engine.

`useDeskMinion.ts` owns arrival, navigation, input, proximity, action timing and temporary device state. Failed routes return feedback; shortcuts never remotely toggle a screen. All actions pause on window blur or hidden tabs, and camera transitions freeze physics. Resume is explicit after blur. Manual movement and jumps remain available with reduced motion; automatic arrival snaps to the front, the camera stays in a fixed overview, and decorative gait/lean/reach motion is removed.

`utils/minionRig.ts` articulates runtime copies with shoulder/elbow and hip/knee bones, analytical hand targets, planted stance feet, character-specific strides/turning, jump anticipation, landing compression, climbing and action pose curves. The original eyes, clothes, gloves and shoes are retained. Peace carries its original sign and stows it for two-hand actions. Spectators blink, turn and react; Joker’s head/hair rotate together. These are procedural runtime toy rigs, not Blender-authored animation clips or a skinned-body export.

`utils/deskMinionScene.ts` coordinates the active rig, cable and screen ownership. `utils/deskMischiefProps.ts` owns the 78 recovered keycaps, moving mouse, spectator rigs, Joker head pivot and localized scratchpad texture. `utils/deskKeyboard.ts` splits the disconnected key batch without modifying the shared geometry. A contact shadow grounds the figure. Only the active clone is normalized in size; original model transforms and shared resources are never disposed. Black screen materials cannot be brightened by room highlights or lighting updates. Generated plug separation and cable curvature show the connection state.

`useToyGameAudio.ts` synthesizes footsteps, jumps, landings, key clicks, erasing, mouse pushes, gripping, cable strain, power tones and plug sounds. Audio unlocks on the first movement/action gesture; it does not autoplay on arrival. Mute is independent of room ambience. The existing voice limit and stale-resume cleanup apply. No external recordings or new dependencies.

## Integration and contracts

- `utils/subwoofer.ts`: room-wide driver/rim/screw detail and marked knob, owned by `useRoomFinish`. Idle music response uses the existing verified playback-driven pulse; the game has a bounded bass-test envelope. Shared source geometry/materials stay intact; original knob/ring visibility restores on disposal. In room exploration, clicking the subwoofer uses the existing music interaction.
- `DeskMinion.vue`: scene presentation and owned-resource cleanup.
- `DeskMinionControls.vue`: localized movement/session controls and stable focus.
- `DeskInteractionHint.vue`: a projected E/touch hint beside the nearest eligible object.
- `DeskTypingInput.vue`: physical/touch keyboard input and composition handling; emits input intent without owning game state.
- `RoomScene.vue`: scene composition, follow camera and actual surface picking. During actions the camera settles on a fixed action anchor; mouse framing includes the travel ahead; typing holds the camera over the keyboard. `usePointerPicking` preserves its object callback while also exposing the intersection point.
- Existing `paratrooper`, `cards`, `robot`, `play-game`, `minion-game`, authored cameras and Blender mesh names remain unchanged. Runtime `cam_minion_game` supplies the framing.
- No GLB or global Pinia schema changes. Existing `focusedId` and mode own entry/exit. Original case studies stay available on the independent CV route. Joker’s card game is preserved.
- English and Persian copy lives in `content/portfolio.ts`; no new portfolio facts.

## Verification and limits

Unit/component checks cover all three native arrival paths, MacBook/cable routes against both the native bounds and decoded GLB surface triangles, jump/landing collisions, desk edges, blocked paths, proximity and contact timing, manual interruption, double-jump prevention, pause, screen/asset restoration, held controls, pointer cancellation, stable focus, audio lifecycle and responsive framing. Playwright scenarios cover desktop/mobile device interactions, reset, live movement, pause and return focus.

Lint, typecheck and production build pass. 90 tests pass, including all Minion checks. The unit suite has one pre-existing failure: the Blender checkpoint hash mismatch in `tests/roomAsset.spec.ts`, outside this feature.

Additional checks validate all 78 decoded keys and triangle preservation, actual-surface typing/erasing/riding routes, mouse boarding cancellation and safe travel, spectator restoration, finite rig poses, constant limb lengths, and hand contact at the sensor/plug for all three Minions.

Live interaction/audio review remains unverified. Port 3000 on IPv4 serves a different local project; the portfolio runs on IPv6 localhost. The shell sandbox cannot connect to that server or bind a new test port. The in-app browser previously loaded the current portfolio. Automatic approval review previously blocked the authorized Playwright run on port 3101. In the contextual-hint/typing pass it again blocked opening the localhost browser tab with an HTTP 404 deployment/service error before execution. Updated Playwright coverage projects actual room points and clicks the nearby hints; it remains unexecuted. No live interaction or Playwright pass is claimed.

`playwright.config.ts` accepts `PORTFOLIO_E2E_BASE_URL` for a known running portfolio server, or `PORTFOLIO_E2E_PORT` for a separate test server, so tests need not target a different project occupying the default address.

The typing/hint checks cover real key-row mapping, correct landing endpoints, shifted and Persian input, ordered typing/deletion/newlines, queue bounds, pause/resize freeze, movement cancellation, reduced motion, power gating, focus, touch input and composition.

Subwoofer checks cover all three approach paths and hand contact, contact-time triggering, pause/reset/cancellation, cabinet collisions, outward cone normals, reduced-motion visuals, pick ownership and shared-resource restoration. The latest live subwoofer review was blocked before opening localhost by the same automatic-approval HTTP 404 service error.
