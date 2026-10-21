# Joker’s three-card game

Implemented 2026-10-15. Click Joker or choose “Joker’s card game” in the room navigation. The camera frames his existing LEGO figure and a generated card tray.

## Visitor flow

1. “Deal me in” shows three faces. Remember the purple star; there is no timer on this clue.
2. “Shuffle the cards” turns them over and performs five visible swaps. Input is locked until the last swap finishes.
3. Click a physical card, choose a numbered button, or press 1–3 while the game controls have focus.
4. Reveal all cards. Joker bows on a correct answer or shakes his head on a miss. A win briefly blends wall/desk lights into purple and green and adds local toy lighting.
5. Replay, press Escape, use Back to the room, or leave through the persistent CV/contact links.

Memory mode is available without changing any device setting. Reduced motion selects it automatically: the visitor memorizes the star’s location, hides the faces, and picks a stationary card. No shuffle, flip, character movement, or color celebration runs. Changing the motion preference mid-round resets to the introduction so the challenge stays fair.

## Components and ownership

- `composables/useJokerCardGame.ts`: round phases, shuffled mapping, guarded actions, memory preference, frame timing. Hidden/moving views pause progression. Exit resets the round.
- `components/games/JokerCardGame.vue`: runtime tray, generated card textures, pickable meshes, local lighting, toy reactions, and resource/pose cleanup. Uses the room’s existing animation loop.
- `components/games/ToyGameControls.vue`: localized instructions, accessible clue/result announcements, numbered choices, keyboard input, next-action focus, replay and exit events. This is a nonmodal region so CV/contact remain available.
- `utils/jokerGameScene.ts`: camera framing and card poses derived from the same mapping used for the answer.
- `components/scene/RoomScene.vue`: composes controls and 3D presentation, routes picking, pauses during camera transitions, and applies the temporary color effect.
- `pages/index.vue`: keeps the existing scene focus/return behavior; hides introduction and object navigation while playing and restores the original trigger on exit.

## Contract extension

Flagged before implementation and recorded in `PORTFOLIO_PLAN.md` §4.2: add `play-game` to `SceneObject.action`. The original `bugjar` ID, `int_bugjar`, `root_bugjar`, and `cam_bugjar` are preserved. Static Joker descendants resolve to the same interaction. Runtime `cam_joker_game` fits the tray and figure responsively without editing Blender cameras or the GLB.

The existing `focusedId: 'bugjar'` and `mode: 'focused'` coordinate the feature; no new global state or dependencies. Android debugging remains in case-study content and the CV. All game copy is in `content/portfolio.ts`, including Persian strings. The `/cv` route stays independent of 3D/game code.

## Verification

Tests cover mapping through every swap, invalid/early/repeated input, replay, no-shuffle memory mode, hidden-tab pause, motion changes, exit, accessible controls and focus, static Joker-part picking, camera bounds on desktop/portrait/landscape, geometry cleanup, authored-pose restoration, and shared light uniforms returning to normal.

Playwright scenarios cover normal shuffle, interruption, replay, reduced-motion memory play on desktop/mobile, restored keyboard focus, and CV navigation. Live browser execution remains blocked by sandbox localhost restrictions; the server escalation failed automatic approval review with HTTP 404. Do not claim visual browser verification.

Known unrelated test failure: `tests/roomAsset.spec.ts:28` finds a checkpoint hash mismatch against `tools/blender/review/website-export.json`. This feature does not change the checkpoint or exported GLB.
