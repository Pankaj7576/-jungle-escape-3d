# Jungle Escape 3D — Version History

## 1.009
- Map the repository VERSION (for example 1.009) to Android `versionName` and a monotonically increasing `versionCode` (1009) after Capacitor generates the Gradle project; fail the build if the expected Gradle fields are missing or duplicated.
- Verify the built APK's package ID, versionName, versionCode, portrait manifest flag, DEX/manifest contents, ZIP integrity and Android signature before uploading it.
- Include `build-info.txt` and `SHA256SUMS` beside the APK in the workflow artifact so each download has a reproducible identity and integrity check.
- Added Node regression tests for release-version parsing and safe Gradle metadata patching. The bundled black-suit GLB's creator/source/license are not documented in the repository; it is marked unverified in ASSET_CREDITS.md rather than being represented as a confirmed free asset.
- Verification: local metadata-script syntax check and 5 focused Node tests passed. GitHub Actions run 45139073935 passed all 28 Node tests, Vite production build, Capacitor sync, Android version metadata preparation, portrait manifest setup, Gradle assembleDebug, APK package/version/orientation/signature/ZIP checks, and artifact upload. Artifact 14801227192 was downloaded and checked: ZIP integrity passed; app-debug.apk is a valid Android package (4,304,420 bytes) with versionName 1.009, versionCode 1009, applicationId com.jungleescape.losttemple, portrait orientation, verified debug signature, and SHA-256 d7cbbd92a2301dc3bc42e852874165529e2c3f07b7218be4e7b79702bd76fe8e. Real-device installation, upgrade behavior, and FPS testing remain required.

## 1.008
- Cancel incomplete canvas swipe gestures when the app loses focus, is hidden, or begins page navigation; release pointer capture defensively so a stale pointer-up cannot move the runner after resume.
- Added regression tests for blur, pagehide, hidden visibility, and a fresh gesture after the app resumes.
- Verification: GitHub Actions run 44999970978 passed JavaScript syntax checks, all 23 Node tests (0 failures), Vite production build, Capacitor Android sync, portrait manifest setup, Gradle assembleDebug and artifact upload. Artifact 14745457278 was downloaded and checked: ZIP integrity passed and app-debug.apk is a valid Android package (4,304,423 bytes; SHA-256 598f7fdfdd034bc75f1f1e8503fe893d637047be4ef9397a165e5e61e8f554d1). Real-device installation, interrupted-touch and FPS testing remain required.

## 1.007
- Added explicit GPU-resource cleanup for obstacles, coins and power-ups when collected, pruned behind the runner, or removed during a run reset. Shared scene materials remain alive; only power-up-owned materials are disposed.
- Added unit coverage for geometry de-duplication, owned-versus-shared material handling and idempotent cleanup.
- Verification: GitHub Actions run 44881713514 passed JavaScript syntax checks, all 21 Node tests (0 failures), Vite production build, Capacitor Android sync, portrait manifest setup, Gradle assembleDebug and artifact upload. Artifact 14697639751 was downloaded and checked: ZIP integrity passed and app-debug.apk is a valid Android package (4,304,302 bytes; SHA-256 c97aeb263d557eac3c684ba5d478e83acd6a17e769e3c0d94d30e9e29afdd528). Real-device FPS, long-session memory and gameplay testing remain required.

## 1.006
- Centralized the three-lane transition in a small, tested helper so only explicit left or right input can change the lane; all other actions preserve the current lane and movement clamps at the outer lanes.
- Added regression coverage for left/right movement, lane boundaries, non-lane actions and invalid lane state.
- Verification: GitHub Actions run 44699669453 passed JavaScript syntax checks, all 17 Node tests (0 failures), Vite production build, Capacitor Android sync, portrait manifest setup, Gradle assembleDebug and artifact upload. Artifact 14612561049 was downloaded; ZIP integrity passed and app-debug.apk is a valid Android package (4,304,133 bytes; SHA-256 6466112861d0ae20059b12302d91457394328a8716397f8b9a01cc91ca71dee4). Real-device installation, input and FPS testing remain required.

## 1.005
- Added a visibility-aware render loop that stops scheduling animation frames when the app is backgrounded or navigated away, then resumes cleanly without a large catch-up simulation step.
- Added deterministic regression tests for single-frame scheduling, bounded delta time, stop/resume and disposal.
- Verification: GitHub Actions run 43689238765 passed JavaScript syntax checks, all 13 Node regression tests, Vite production build, Capacitor Android sync, portrait manifest setup, Gradle assembleDebug and artifact upload. Artifact 14151398292 was downloaded; ZIP integrity passed and app-debug.apk is a valid Android package (4,304,058 bytes). On-device install, background/resume and FPS testing remain.

## 1.004
- Reduced repeated track geometry draw calls by batching the 26 stone parapet posts on each straight or curved segment into one InstancedMesh while preserving their positions, materials and shadows.
- Added automated regression tests for straight and curved track post counts and mesh batching.
- Verification: GitHub Actions run 43569786547 passed JavaScript checks, all Node regression tests, Vite production build, Capacitor Android sync, portrait manifest setup and Android debug APK build. The APK artifact was downloaded and validated as an Android package; on-device gameplay and frame-rate testing remain.

## 1.003
- Hardened lane input: canvas swipes are handled as one primary-pointer gesture with a 36 px dead zone and ambiguous-diagonal rejection.
- Isolated on-screen control presses from canvas swipes and ignored keyboard auto-repeat so holding a direction cannot continuously move lanes.
- Added automated Node regression tests for tap jitter, left/right swipes, jump/slide swipes and ambiguous diagonals.
- Android workflow now runs the input regression tests before building the portrait debug APK.

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
- Rollback snapshot branch: versions/1.00.

## Versioning rule
- Keep the current release number in the root VERSION file.
- Increase the final numeric part by 0.001 for every accepted game update: 1.00 → 1.001 → 1.002 → 1.003.
- Every release must have a matching snapshot branch named versions/<version> pointing to that release's exact commit.
- Add a numbered changelog entry describing the update and its build status.
- Never overwrite or delete old version snapshot branches. To roll back, restore main to the selected snapshot commit/branch after confirming the requested version.
