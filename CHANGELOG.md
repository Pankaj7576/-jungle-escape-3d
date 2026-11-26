# Jungle Escape 3D — Version History

## 1.012
- Capped the active Android renderer's device-pixel ratio at 1.5 on startup and resize to reduce high-density mobile GPU fill-rate while keeping antialiasing and shadows enabled.
- Replaced the title-screen subtitle that referenced another game's title with original Jungle Escape branding.
- Added automated tests for normal, high and invalid device-pixel-ratio values.
- Clarified the README around the active `index.html` Android entry point; no runner, obstacle, coin, jump, slide or chase logic changed.
- Android build verification is pending; real-device FPS, thermal and visual checks remain required.

## 1.011
- Bundled Three.js from the existing local npm dependency instead of loading it from unpkg at runtime, removing the game's external renderer-CDN dependency from the Android APK.
- Kept the 1.010 pointer/keyboard lane-input guard and existing gameplay unchanged.
- Real-device offline launch and performance checks are still required.

## 1.010
- Connected the tested pointer/keyboard input guard to the shipped `index.html` game, so only one deliberate primary-canvas swipe or a fresh non-repeating key press can change lanes.
- Added a 36 px swipe dead zone, diagonal-gesture rejection, pointer-capture/cancel handling, and protection against HUD taps being interpreted as lane changes.
- Added automated input regression tests and made them part of the Android build workflow.
- Device gameplay and performance testing remains required.

## 1.002
- Rebuilt gameplay around a procedural modular track system that generates and recycles straight, 90-degree left/right turn, and broken-gap sections.
- Added curved world-space lane positioning, low stone guardrails, canyon/mountain scenery, and a spring-arm camera with collision checks.
- Added articulated black-suit adventurer control with available GLB animation clips plus procedural jump/slide fallback; upgraded the dark-furred guardian with articulated limbs, glowing eyes and layered fur details.
- Added lane obstacles (rocks, walls, slide arches), coin trails, magnet and speed-boost pickups, stumble/chaser catch-up, and a one-time 5-gem revive modal.
- Reworked the title screen, HUD, touch controls, pause and revive overlays for portrait mobile play.
- Verification: JavaScript syntax check, Vite production build, Android debug APK build and GitHub Pages deployment succeeded. Android APK artifact was uploaded by workflow run 43372122727; device gameplay/performance testing is still required.

## 1.001
- Restored the Temple Run-inspired ancient stone bridge: textured irregular paving and low stone parapets; removed modern steel towers, suspension cables, LED strips and lane markings.
- Restored the earlier obstacle scale and mix: large rocks, stone walls and overhead branches, with matching jump/slide collision thresholds.
- Build verification: Android APK and Pages deployment succeeded.

## 1.00
- Baseline snapshot: Himalayan valley scenery, modern suspension bridge, and refined jump/slide obstacles.
- Rollback snapshot branch: `versions/1.00`.

## Versioning rule
- Keep the current release number in the root `VERSION` file.
- Increase the final numeric part by 0.001 for every accepted game update: `1.00` → `1.001` → `1.002` → `1.003`.
- Every release must have a matching snapshot branch named `versions/<version>` pointing to that release's exact commit.
- Add a numbered changelog entry describing the update and its build status.
- Never overwrite or delete old version snapshot branches. To roll back, restore `main` to the selected snapshot commit/branch after confirming the requested version.
