# Development report — 2026-11-09

## Completed in this milestone

- Added original runtime-generated tileable surface maps for soil, stone, bark and moss, including bump detail. No external texture files are bundled.
- Reworked the optional GLB loader to require a skinned mesh plus animation clips, normalize model height and grounding, log download progress, and preserve procedural fallbacks on missing/invalid files.
- Added animation state cross-fades and one-shot jump/slide playback when those clips exist.
- Replaced per-coin mesh creation with one InstancedMesh coin field and reused primitive geometries to reduce draw calls and geometry churn.
- Added GLB inspect/optimization scripts using glTF Transform and an asset header checker.
- Removed a duplicate graphics-quality event registration in game-over handling.
- Updated Android build and portrait-lock instructions.

## Asset research (not bundled)

- Verified a CC0 male locomotion GLB candidate from Innerscene with seven named clips.
- Verified a CC0 rigged Werewolf GLB candidate from Grab3D with walk/run clips.
- Verified ambientCG Rock 024 as a CC0 scanned stone PBR candidate.
- No model binary was downloaded into this archive. The download endpoints were inaccessible from this build environment, so the runtime keeps procedural fallbacks.

## Verification

- `node --check src/main.js`: passed.
- `node --check src/pbr-textures.js`: passed.
- `node --check scripts/check-assets.mjs`: passed.
- `python -m json.tool package.json`: passed.
- `python -m json.tool capacitor.config.json`: passed.
- `npm run check`: passed.
- `npm run assets:check`: passed with expected warnings that optional `hero.glb` and `guardian.glb` are absent.
- `npm install --ignore-scripts --no-audit --no-fund`: timed out; dependencies were not installed.
- Vite production build and Android APK build: not run. Android SDK/adb/Android Studio are not installed in this environment.

## Next milestone

Acquire and optimize the CC0 hero/guardian GLBs on a machine with network access, validate their animation clips and orientation in Three.js, then add a verified Indian temple/environment model or modular CC0 temple set. Follow with Android device FPS, memory and touch-control tests.