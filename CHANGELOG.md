# Jungle Escape 3D — Version History

## 1.002
- Rebuilt gameplay around a procedural modular track system that generates and recycles straight, 90-degree left/right turn, and broken-gap sections.
- Added curved world-space lane positioning, low stone guardrails, canyon/mountain scenery, and a spring-arm camera with collision checks.
- Added articulated black-suit adventurer control with available GLB animation clips plus procedural jump/slide fallback; upgraded the dark-furred guardian with articulated limbs, glowing eyes and layered fur details.
- Added lane obstacles (rocks, walls, slide arches), coin trails, magnet and speed-boost pickups, stumble/chaser catch-up, and a one-time 5-gem revive modal.
- Reworked the title screen, HUD, touch controls, pause and revive overlays for portrait mobile play.
- Verification: JavaScript syntax check and Vite production build passed. Android APK build is running for the final release commit; device gameplay/performance testing is still required.

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
