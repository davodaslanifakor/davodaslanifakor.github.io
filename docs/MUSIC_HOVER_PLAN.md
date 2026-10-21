# Music speakers and hover motion plan

Status: revised and implemented (2026-10-13). Clicking the speakers now brings the camera to the ultrawide monitor: the music library occupies its left half, and the selected Spotify preview occupies its right half. Temporary sample tracks remain until David provides his list.

Implementation notes:
- The speakers open the monitor music interface, not `ObjectModal`. Ambient hum and hover notes remain controlled by the HUD sound button.
- One selected iframe stays mounted when returning to the room or opening another room object. Stop and clear or leaving the room removes it and clears selection. Navigation never pauses or restarts playback; the visitor controls playback through Spotify or Stop and clear.
- A 1.08 spring settles in 250 ms, with an 80 BPM visual pulse gated by confirmed playback. Frame faces get one gentle dim-and-return; reduced motion disables all three effects.
- `nowPlaying: string | null` is the additive §4.3 state contract extension, flagged before implementation and recorded in the main plan.
- Sample track metadata and bilingual music copy live in `content/portfolio.ts`. TODO(David): replace `favouriteMusic` entries and notes with the final selections.
- Monitor animation is limited to 10 updates per second and stops with reduced motion; textures retain their identity.

## 1. Hover motion (toys, desk clock, wall frames)

- Targets: `paratrooper`, `robot`, `bugjar`, `cards`, `elephant`, `clock`, `library_*` frames.
- Motion: whole `root_*` group (or `root_library_frame_*`) scales to 1.08 with a spring (slight overshoot, ~250 ms settle); returns to its exact original scale on leave. Frames add a short neon flicker on the face material.
- Sound: when Ambient sound is on, a ~120 ms soft sine "tick" through Web Audio, one pentatonic note per object so sweeping the desk plays a short phrase. Silent when sound is off.
- Music pulse: while the Spotify API reports active playback, hovered objects breathe on a fixed tempo. RGB strips, halos and the desk border share a gentle brightness pulse anchored to playback position.
- Reduced motion: no scale, no pulse; the existing emissive highlight remains.
- Code: new `composables/useHoverMotion.ts` (caches original scales, animates in the existing render loop, restores on dispose) and `composables/useHoverNotes.ts`; `RoomScene.vue` passes `localHoveredId`.
- Tests: scale restored exactly after leave and on scope dispose; no notes when sound is off; reduced motion skips animation.

## 2. Speakers open the monitor player

- The existing `speakers` scene object and `contentRef: 'music'` identify the music interaction. No new Pinia state or Blender mesh contract is required.
- `MusicList.vue` renders the left-hand library; `MusicPreview.vue` renders the right-hand empty state or the real 352 px Spotify embed (artwork and playback controls). Only one selected iframe exists at a time, and none loads before track selection.
- `MonitorMusicSurface.vue` owns the projected panels, keyboard focus, return control and responsive layout. It emits selection/close intent to `RoomScene.vue`, which forwards it to the route/store.
- `utils/monitorProjection.ts` locates the native screen corners from glTF UVs and maps each HTML rectangle to its projected quad. The two HTML panels follow the curved screen halves as flat chords; their shared seam matches. A DOM iframe cannot bend continuously with the underlying curved geometry.
- Camera framing uses a runtime-only `cam_music` point derived from the screen bounds and viewport aspect. Authored cameras and GLB assets remain unchanged.
- On narrow screens, the same library/player stack vertically into a scrollable interface; the selected iframe is preserved during resizing.
- Selecting a track updates `nowPlaying`. Returning to the room keeps both DOM panels and the iframe visible on the physical monitor while restoring the room camera. The return toolbar hides and the panels become inert, so room navigation keeps working. The old canvas “Now playing” card is no longer used. Opening another object preserves the same iframe and playback position. Stop and clear or leaving the route removes the iframe.
- Music stays on the projected panels in focused and room views, including on mobile after returning. The canvas music animation is no longer called, avoiding the previous style switch and redundant texture uploads.

## Limits

- Spotify’s iframe API reports play/pause, buffering and playback position. It does not expose raw audio or measured beat data: the RGB pulse is a fixed 80 BPM visual rhythm anchored to playback position, not waveform analysis.
- Spotify determines playback availability and preview length based on account, region and track.
- Embeds load third-party cookies; the iframe is created only after the visitor picks a track.

## Needed from David

1. Spotify links for the favourite tracks (or one playlist link) and a one-line note for each.
2. Review the monitor library and Spotify preview layout.


## Verification — 2026-10-13

- `pnpm lint`, `pnpm typecheck`, and `pnpm build`: passed.
- Full Vitest run: 56 passed, 1 failed. Spotify playback events, stale-event rejection, API fallback, RGB playback response, music, screen projection (including native GLB corners), hover, and screen texture checks pass. The unrelated failure is `tests/roomAsset.spec.ts:28`: the Blender checkpoint hash differs from the existing export report. No Blender assets or export metadata were changed for this feature.
- Updated `e2e/music.spec.ts` for desktop monitor alignment, mobile layout, explicit embed loading, replacement, returning to the room, focus restoration, and clearing. Browser execution remains blocked: localhost binding failed in the sandbox, and the approval service returned HTTP 404 on escalation attempts (including with David’s prior approval), and also blocked opening the static visual proof in Chrome. No browser or live Spotify playback verification is claimed.


## Playback-aware RGB — 2026-10-13

- `SpotifyPlayer.vue` and `useSpotifyPlayer.ts` create the official iframe API controller after track selection and forward validated `playback_update` events. API failure falls back to the normal embed, with no assumed playback state.
- The additive §4.3 `musicPlayback` snapshot holds `playing`, `positionMs`, `durationMs`, and `sampledAt`. Changing tracks resets the snapshot; stale events from another track are rejected.
- While playing, RGB hue travel runs at nine times the idle speed (a four-second spectrum cycle). Broad saturated color bands replace the full spatial rainbow, and shared strip/halo/desk brightness varies from 0.72 to 1.22. Pause, buffering, clearing, end of playback, hidden tabs, warm mode and reduced motion suppress the pulse. Other ambient lighting behavior is preserved.
- Playback position anchors the visual rhythm across seeks and resumes. This is playback synchronization, not beat detection. No microphone, account token or audio capture is used.
- Official reference: https://developer.spotify.com/documentation/embeds/references/iframe-api


### Wall RGB visibility correction

The previous 18-second cycle and brighter-only pulse were too restrained at the resting camera. A regression now requires at least a sixth of a color cycle per second during playback, and an integration test checks that the real wall core, halo and desk border share the changing uniforms. Shader cache keys include the GLSL source to prevent old effects being reused during live updates. Runtime browser inspection is still unavailable because automatic approval review returns HTTP 404; whether the user's player is emitting events or their OS requests reduced motion remains unconfirmed.


## Laptop layering and preview recovery

- The projected HTML panel layer now excludes the nearer MacBook lid silhouette. `monitorOcclusion.ts` measures native lid bounds in its own axes (including bezel), projects them with the current camera, and applies an even-odd clip path. It updates during focus/return/orbit/resize; objects behind the monitor do not cut a hole in it. The mobile full-screen player disables this scene mask.
- The return toolbar stays outside the clipped panel layer. Passive panels remain inert, and the native 3D laptop is visible through the cutout without moving any Blender assets.
- Spotify owns its promotional overlay. Its full 352 px player stays contained in the monitor; “Reload preview” outside the iframe recreates exactly one player for the selected track, clearing the old playback state and allowing recovery without leaving the room. The external Spotify link stays available below it.
