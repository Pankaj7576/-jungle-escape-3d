# Jungle Escape 3D — The Lost Temple (Android-ready source)

A portrait 9:16 Three.js endless-runner prototype with an original Indian jungle-temple theme and a Capacitor Android wrapper.

## What changed in this milestone

- Added small, original, tileable procedural PBR-like textures for soil, stone, bark and moss (no third-party image files).
- Added a normalized GLB character loader that checks for a skinned mesh and animation clips, centers/grounds the model, and cross-fades matching run/jump/slide/idle clips.
- Kept procedural characters as fallbacks if a GLB is missing, static or invalid.
- Added instanced coin rendering (one draw call for the coin field) and shared primitive geometries to reduce draw calls and avoid repeated geometry allocation.
- Added Low/Balanced/High render presets and reduced default shadow casting to the hero, guardian, temple and selected obstacles.
- Added GLB inspection/optimization scripts and an asset validation script.

## Requirements

- Node.js 20+
- Android Studio and Android SDK for native Android builds
- A real Android phone or emulator for performance testing

## Run in browser

```bash
npm install
npm run dev
```

## Static checks

```bash
npm run check
npm run assets:check
```

The asset check reports missing optional character GLBs; missing files are not a build failure because procedural fallbacks remain available.

## Add the optional character models

Read `public/assets/models/GLB_INTEGRATION.md`. It lists the individually verified CC0 candidate pages, exact expected filenames, and model preparation commands. The models are **not bundled** in this source archive because the external binary downloads were not accessible in this build environment. Do not assume a candidate is integrated until the file exists and `npm run assets:check` reports it.

## Optimize character models

After saving source files as `public/assets/models/hero-source.glb` and `guardian-source.glb`:

```bash
npm install
npm run assets:inspect:hero
npm run assets:inspect:guardian
npm run assets:optimize:all
npm run assets:check
```

Optimization uses glTF Transform to quantize geometry and convert/cap textures at 1024 px while leaving rigged mesh simplification off by default. Test every animation after processing.

## Build Android project

```bash
npm install
npm run build
npx cap add android       # run only once
npx cap sync android
npx cap open android
```

In Android Studio, wait for Gradle sync, connect a device, then Run. To create an APK use **Build > Build Bundle(s) / APK(s) > Build APK(s)**. For Play Store distribution, configure a signing key and build a signed Android App Bundle.

For a strict portrait lock, add `android:screenOrientation="portrait"` to the main activity in `android/app/src/main/AndroidManifest.xml`, then run `npx cap sync android` and rebuild.

## Controls

- Swipe left/right: change lanes
- Swipe up: jump
- Swipe down: slide
- On-screen controls are included
- Desktop testing: arrow keys / WASD, Space to jump, Escape to pause

## Honest current limitations

- No external hero, guardian, temple GLB, or scanned PBR image has been downloaded into this archive yet. See `ASSET_CREDITS.md` and `public/assets/models/GLB_INTEGRATION.md` for researched candidates and exact licensing notes.
- The current environment remains procedural geometry, now with surface texture detail; it is not photogrammetry or AAA realism.
- The rigged GLB runtime path is implemented but cannot be verified until the model files are supplied.
- A Vite production build and Android APK were not run in this environment. Install dependencies and test on the target phone before treating this as release-ready.