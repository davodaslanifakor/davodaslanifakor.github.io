# Demo readiness — 18 October 2026

Ready for a guided playable demo. No known failing scenario remains in the tested Chromium/WebKit coverage. A physical iPhone/Safari check is still outstanding; Playwright WebKit and a touch viewport are not a real device test.

## Completed

- Floor → call lift → board lift → desk return loop, repeatable after the first desk landing. Approach the glowing floor marker by the garage, stop, and press E. The carriage folds its ramp before descending, and cannot be recalled over a car parked beneath it.
- Compact game navigation retaining one-click Contact and CV. Relevant active controls stay visible; recovery, reset and sound settings live in Pause. The camera accommodates actual HUD dimensions.
- Camera clearance near walls and beneath the desk, soft ground contact shadows, acceleration/steering reactions and landing suspension. Reduced motion retains gameplay without decorative movement.
- Reusable engine harmonics, boost airflow and umbrella wind. Pause, mute and exit stop audio.
- Light, the supplied Spotify playlist, replaces all samples. Verified the actual Spotify embed visually. Playlist song changes feed the existing RGB playback bridge, and the fallback iframe uses the correct playlist URL.
- Supplied portrait packed in the existing Blender checkpoint and exported into the shelf frame with a cream mat, preserving the full square image.
- Regenerated the room export and its source checksum. Before changing the portrait, the fresh export retained the previous inventory, camera poses, bounds and byte counts.
- Same fonts served locally, with OFL licenses, removing the external stylesheet dependency from initial loading.
- Minion proximity hints no longer cover nearby clickable props on narrow screens.

## Verification

- Lint: pass.
- Nuxt/Vue type checks: pass.
- Unit suite: 158 passed across 41 files.
- Production build: pass.
- Production browser coverage: 52 distinct Chromium/WebKit scenarios verified across runs. The full run had 49 passing and three Minion failures. After fixing hint overlap and waiting for camera readiness in the test, the focused 10-scenario rerun passed, covering all three previous failures, both browser engines, Minion movement/typing, Joker keyboard playthroughs and room visuals. The prior full run passed normal-motion/touch Joker routes, missing-asset retry, playlist playback/return, editor, CV navigation and lighting.
- Room + adventure GLBs: 1,907,884 bytes, under the 3 MB contract. Embedded room images: 121,820 bytes.
- Room screenshot: `docs/renders/joker-adventure/finished-room-chromium.png`.

## Before a public portfolio launch

- Check the production URL on a physical iPhone, including sound unlock, touch driving, rotation and returning from another app.
- The downloadable CV PDF is still `TODO(David)` in content; the existing HTML CV is available. Persian remains outside the current English-only release. Missing personal facts have not been invented.
- This work changes the local project and Blender checkpoint; it does not deploy a public site.
