# Minion discovery — a living desk

2026-10-15. Discovery findings, followed by the approved implementation scope.

Implemented in the application: nearby E/touch hints, physical-key typing and Backspace hops, mouse push/boarding/coasting, a detailed interactive subwoofer with a knob/bass sound check, two-stage cable struggle and recoil, articulated runtime character rigs, retained Peace sign, spectator/Joker reactions, and reversible prop/screen effects. See `MINION_GAME_PLAN.md` for behavior, verification and limits. No Blender/GLB changes. The object ideas below remain proposals unless listed here; plant, clock, phone, music dance, shelf routes and dedicated spacebar tricks remain later work.

## Evidence reviewed

- Current `public/models/room.glb`: hierarchy, named parts, animation and skin inventory.
- `docs/renders/room-style/website-sharp-screens.png` and `room-rgb-overview.png`: saved room composition.
- `docs/renders/object-review/cards/after-trio.png`: three character designs.
- `docs/renders/object-review/bugjar/after-three-quarter.png`: Joker construction and seated pose.
- Blender builders for toys and laptop; current desk movement, action and rendering code.

These are saved renders and exported/source assets. Live browser and Blender inspection were blocked by automatic approval review returning HTTP 404. No fresh live visual review is claimed.

## What the room offers

The trio starts on the USB hub at the left of the desk, close to a speaker and plant. The central MacBook provides a low platform, trackpad, keyboard and hinged lid. Across the mouse sits the right speaker with Joker above it; the phone, elephant and alarm clock extend the scene to the right. This is already a useful progression from a familiar home base to larger obstacles and another character.

The room-wide camera makes the toys small. Play should use a stable, closer three-quarter view that shows the character and its next destination together. Camera movement should settle during an action so hand contact and object reactions remain readable. Preserve easy access to CV/contact and an immediate exit.

## Character direction (proposed)

| Character | Personality | Distinct behavior |
|---|---|---|
| Hula Minion | Eager performer | Quick little steps, broad anticipation before jumps, skirt follow-through, dances when music is actually playing. |
| Peace-sign Minion | Earnest mediator | Carefully carries the sign, uses it to balance, raises it when the others cause trouble. A reversible sign flip could reveal an “oops” drawing. |
| Coat Minion | Cautious instigator | Checks over its shoulder, tiptoes toward controls, needs a two-handed tug on a stubborn plug, freezes when caught. |

Shared abilities should still work for all three. Personality changes timing, poses and reactions without forcing players to select a particular character to complete an action. Keep the Peace sign available as a prop; the current runtime hides it to free the hands.

## Interactions grounded in existing objects

| Object | Proposed action and payoff | Asset/behavior work |
|---|---|---|
| MacBook keyboard | Hop onto the keyboard, land on a key, hear a click and see an accidental character appear. Try to erase it and make the mess worse. | The keycaps are currently joined into one mesh. Add a small set of movable keys/contact regions and a reversible screen overlay. |
| Spacebar | Crouch, press it with both feet, release into a short hop, then catch balance on landing. | Movable spacebar plus a designed animation; tiny physical travel, not a huge trampoline. |
| Mouse | Lean both hands into it, push with visible effort, climb aboard and coast a short distance. Lean back to stop. | Mouse has its own root; add constrained sliding, friction, collision and a safe travel area. |
| MacBook lid | Reach up to the edge, tug it partly closed, peek around it, then reopen it. | Separate lid root exists. Add hand-contact anchors and a collision-aware hinge limit. |
| Monitor plug | Grip, brace feet, pull unsuccessfully once, then pop it free and stumble back. Look up at the dark screen; other toys react. | Upgrade the existing action with authored struggle/recoil and precisely attached hands. Keep unplugging/reconnection reversible. |
| Speakers | Climb onto one, balance on top, and perform while the other toys watch. | Speaker parts are separated. Use small visual vibration and playback-clock timing. Current music ownership clears playback when another object opens, so continuing Spotify during Minion play requires a flagged change to §4.3 behavior. |
| Joker on the right speaker | Sneak toward him, reach for a generated card, and freeze when he turns his head. Return the card or retreat behind the mouse. | A small Joker reaction rig, visible card prop, and shared action timing. Keep his existing card game available. |
| Phone | Climb to the stand’s lip, pose toward the screen, and see a playful reflection/selfie preview of the scene. | Existing phone/stand; add a local scene preview or authored image. No device-camera permission needed. |
| Alarm clock | Touch the bell, startle at the ring, then use both hands to quiet it. | Clock parts exist. Add a short bell animation and sound cue; preserve actual time display. |
| Desk plant | Hide behind the pot, peek out with one eye, then brush a leaf while escaping. | Pot, stems and leaves exist separately. Use limited leaf flex; avoid costly plant physics. |

## Recommended first scene: “Who touched my keyboard?”

A short, interruptible comic sequence inside free desk exploration:

1. Click the Coat Minion. It looks at the user, looks toward the laptop, crouches, then hops from the hub onto the mat.
2. Direct it to the keyboard. It plants its hands on the edge and climbs rather than passing through the chassis.
3. Jump on a key. A click and a visible screen change establish cause and effect.
4. Joker notices the noise and turns. The Minion stops mid-action, then slowly looks back.
5. The Peace Minion raises its sign; the Hula Minion reacts with a small laugh/body shake.
6. The player chooses to continue exploring, undo the mischief, or return to the hub.

This sequence teaches movement and interaction while demonstrating personality, contact and consequences. Build the keyboard scene first, then mouse riding and the improved plug gag. Shelf climbing can follow once desk movement and recovery are convincing; it requires new reachable routes and ledge-grab animation.

## What makes it feel alive

The exported GLB has **zero skins and zero animation clips**. The current implementation animates rigid mesh groups procedurally. The arms are modeled in fixed bent shapes; no elbow/knee deformation is exported. A lightweight character rig and authored clips will improve the result more than adding more actions to the current gait.

- Start with idle/look, walk, run/stop, jump/land, climb, push, two-handed pull and startled recovery clips.
- Plant feet during the support phase. Turn the gaze/body toward a target before changing direction.
- Give jumps a crouch, takeoff, airborne pose and settling step. Small obstacles need different motion from tall ledges.
- Adjust hands to actual object contact points at runtime. Attach the plug/card to the hand during the correct part of the action, then release it.
- Add simple blinking/eye direction and a few readable facial-expression options where the current geometry permits; add minimal facial parts where needed.
- Use surface-specific footstep sounds, grip squeaks, key clicks, cable tension and a short recoil sound. Keep ambient music and action sounds controllable.
- Let nearby toys watch and react at meaningful moments. Avoid constant synchronized bobbing.
- Retain user-controlled movement with reduced motion, omit extra camera/idle flourishes, and keep every action cancellable with a clean reset.

## Suggested implementation order

1. Rig and polish one character; prove grounded walking, one jump, a ledge climb and precise hand contact.
2. Build the keyboard/Joker scene with reversible consequences and spectator reactions.
3. Add mouse push/ride and improve the existing plug action.
4. Apply distinct poses/timing to all three Minions and restore the Peace sign as an interactive prop.
5. Expand to music, phone, plant and clock interactions; treat shelf travel as a later expansion.

Preserve the existing object/root IDs and authored cameras. Any export budget, content/state contract, or music ownership changes must be flagged before implementation.
