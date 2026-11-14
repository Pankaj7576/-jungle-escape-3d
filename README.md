# Jungle Escape 3D — The Lost Temple

A mobile-first 3D endless runner built with Three.js, Vite and Capacitor.

**Current game release: `1.004`** — see [`VERSION`](VERSION) and [`CHANGELOG.md`](CHANGELOG.md). Each accepted update increments the release by `0.001` and gets a permanent rollback snapshot branch (`versions/<version>`). Previous snapshots are preserved.

## Gameplay systems
- Procedural modular track with straight sections, 90-degree left/right curves and broken bridge gaps; instanced stone parapet posts reduce repeated draw calls.
- Three-lane movement, jumpable rocks/walls, slide arches, coin trails and canyon scenery.
- Spring-arm third-person camera with collision checks and turn-aware follow.
- Bundled black-suit GLB runner with any available animation clips, plus articulated procedural animation fallback.
- Procedural articulated temple guardian, coin magnet, speed boost and one-time gem revive.
- Portrait-first touch controls with single-pointer swipe filtering, keyboard repeat protection, pause, HUD and main menu.

## Free asset policy
The project uses Three.js and the existing bundled character model. Environment, obstacles, guardian, pickups and fallback animations are generated in code; no paid asset dependency is required.

## Run locally
`npm install` then `npm run dev`.

## Build Android
`npm run build`, `npx cap add android` (first time), then `npx cap sync android`.
Open Android Studio with `npx cap open android`.

GitHub Actions builds a portrait Android debug APK and deploys the web build to GitHub Pages.
