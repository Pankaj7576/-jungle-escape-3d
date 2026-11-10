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

## Visual redesign milestone — 2026-11-10

The first live-device review found that the original procedural scene read as cartoon-like. The art direction has therefore been rebuilt around a grounded ancient Indian stone-temple ruin rather than adding more decorative primitives.

- Replaced the pale, uniformly lit atmosphere with a darker forest palette, restrained ambient fill and warm directional sunlight.
- Rebuilt the temple silhouette around a Nagara-inspired shrine: raised jagati, mandapa columns, deep sanctum doorway, carved facade niches, stepped shikhara, amalaka/kalasha finial, weathered side walls and fallen stone blocks.
- Reworked the causeway with raised kerbs, irregular flagstones, dark joints, retaining walls and broken masonry.
- Reworked trees with tapered trunks, exposed roots, branching limbs, irregular canopy clusters, hanging vines and undergrowth.
- Improved the procedural runner silhouette and guardian with expedition gear, face details, a hunched creature profile, tusks, claws and mane ridges.
- Added multi-scale mottling, mineral streaks, pits and damp weathering to generated surface textures.
- Kept the three-lane path and obstacle silhouettes readable; the runner and near path remain the primary focus.

### Verification status

- Source changes are committed to `game-updates-test`; `main` has not been modified.
- Android build workflow fix: explicitly request only `platform-tools` from `android-actions/setup-android@v3`, because the action's old default also requests Google's retired `tools` package. Platform/build-tools are installed separately with `sdkmanager`.
- A fresh build against the corrected workflow is still required. Do not treat the APK as ready until the workflow completes and its APK artifact is present.
- This milestone is a procedural visual-art pass, not scanned photogrammetry or final AAA art. Character GLBs remain optional and are not bundled.
