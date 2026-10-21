# Desk clock interaction

## Current behavior correction

Clicking the small desk clock opens the career timeline again: its label is “Career timeline” and its modal content is `timeline`. The hands still show live Istanbul time, and whole-clock picking remains in place. The earlier world-clock dialog mapping described below is superseded by this correction.

Plan: reuse the existing world-clock dialog and shared epoch, animate the desk hands in `useWorldClocks`, and include the whole clock in existing pointer picking.

- `clock` retains `int_clock` / `cam_clock`; its localized label is now “Desk clock” and its modal content is `world-clocks`. Pointer activation and the accessible navigation button open the existing “Around the world” dialog with Istanbul, London, Stockholm, and Atlantic readings. Existing Escape and focus restoration remain in use; the World clocks control keeps its action.
- The hour, minute, and second nodes beneath `root_clock` are cached on binding. Their local Y rotations use the shared epoch and `getHandAngles` for `screenContent.cities[0].timeZone` (Istanbul). Reduced motion hides the second hand. Original desk-hand rotations and visibility are restored on rebind and scope disposal; the alarm hand stays decorative.
- `root_clock` descendants resolve to `int_clock` without asset renaming. Only native `int_` meshes enter the emissive highlight cache, keeping the desk face highlight while static hands, bells, and case retain their shared materials. World-clock meshes outside this root keep their existing behavior.
- Career roles remain available at `/cv#experience`, and the timeline modal renderer is preserved. Mesh/camera/Pinia/content schemas, GLB/Blender assets, material clone/disposal ownership, and the shared timer are unchanged.

Review: inspected the scoped source diff and updated the existing modal action expectation; no new tests were added. Tests, build, and browser were not run, as requested. Parent handles lint/typecheck and keyboard/visual preview of the dialog and dial hands.

Parent follow-up: lint, typecheck and diff whitespace checks passed after guarding the optional first city. The keyboard preview opened Desk clock and displayed all four current city times without page errors. Screenshot: `docs/renders/room-style/desk-clock-time.png`. Tests and build were not run for this change.
