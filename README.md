# Jungle Escape 3D — The Lost Temple

A mobile-first original 3D endless runner built with Three.js, Vite and Capacitor.

**Current Android release: `1.013`** — see [`VERSION`](VERSION) and [`CHANGELOG.md`](CHANGELOG.md). Every accepted release has a permanent rollback snapshot branch named `versions/<version>`.

## Active Android game
The Android build uses the root `index.html` entry point. It imports the locally installed Three.js package and the explicit pointer/keyboard input guard in `src/input-system.js`. The separate modular scene prototype in `src/main.js` is not the active entry point for the current APK.

- Procedurally generated jungle bridge sections, 90-degree turn junctions and broken gaps, with a two-bridge recovery stretch between gaps.
- Three-lane movement with deliberate left/right swipes, jump and slide actions.
- Obstacles, coin collection, distance/best-score tracking and a pursuing temple monster.
- Portrait-first touch controls, keyboard testing and synthesized sound effects.
- Mobile renderer pixel ratio capped at 1.5 to limit GPU fill-rate on high-density displays.
- Generated track, tree, coin and obstacle geometries are disposed when recycled or when a run restarts; shared materials remain cached for reuse.

The current character and environment are procedural prototypes. Final production character models, detailed stone-temple art, real-device FPS/thermal profiling and gameplay QA remain future work; this is not yet an AAA-finished game.

## Run locally
`npm install` then `npm run dev`.

## Build Android
`npm run build`, `npx cap add android` (first time), then `npx cap sync android`.
Open Android Studio with `npx cap open android`.

GitHub Actions runs syntax checks, input and renderer-budget tests, a Vite production build, Capacitor sync and a portrait Android debug APK build.

## Unity migration
The separate `unity-migration/phase-1` branch contains the Unity 6 migration and login prototype. Its Player Accounts dashboard configuration, Cloud Project link, Unity Editor compilation and Unity Android APK are not yet verified. See `UnityMigration/UNITY_AUTH_SETUP.md` on that branch.
