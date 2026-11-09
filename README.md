# JUNGLE ESCAPE 3D — THE LOST TEMPLE

A procedural 3D endless runner with an Indian adventure / ancient lost-temple theme. The project is designed for modern Android and desktop browsers.

## Run
1. Extract `JUNGLE_ESCAPE_3D.zip`.
2. Serve the folder over HTTP (recommended; ES modules may be blocked from `file://` URLs): `python -m http.server 8000`
3. Open `http://localhost:8000` in Chrome or another modern WebGL browser.
4. On Android, upload the folder to static hosting or use a local HTTP server app, then open the hosted `index.html` URL in Chrome.

Three.js 0.160.0 is loaded from jsDelivr at runtime, so an internet connection is required for the library.

## Controls
- Swipe left/right: change lane
- Swipe up: jump
- Swipe down: slide
- On-screen controls: same actions
- Desktop: Arrow keys or WASD; Space to jump; Escape to pause

## Adventure additions
- Indian-inspired ancient shrines, stepped temple towers, stone statues, torches, ruined structures, wooden bridges and waterfall accents
- Original treasure hunter with adventure jacket, trousers, boots and backpack
- Original jungle guardian with chase motion and procedural roar effect
- Golden keys, rare diamonds, locked chests and a key-gated secret temple vault
- Shield, coin magnet and speed boost power-ups
- Coin, key, diamond and treasure rewards contribute to score
- Existing three-lane runner, obstacles, swipe/button controls, pause/restart, difficulty progression and LocalStorage scores

## Audio
Sound effects are synthesized with Web Audio. There are no downloaded recordings or music tracks. Browser audio starts after the player taps Play.

## Performance
Low/Medium/High quality controls pixel ratio, antialiasing and shadow settings. The game uses procedural low-poly geometry to keep the asset footprint small. Actual performance varies by device and browser.

## Limitations / honest status
- Character and guardian are procedural mesh characters with code-driven motion, not imported skeletal animation rigs.
- The waterfall, bridges, temple facades and ruins are stylized procedural scenery, not photogrammetry or historically exact reconstructions.
- The hidden vault is represented as a rare locked gate/treasure encounter on a lane, rather than a separate streamed interior level.
- Audio is synthesized; no recorded birds, waterfall ambience, temple bells or licensed soundtrack are bundled.
- This project has been source-checked, but has not been physically play-tested on a range of Android devices. WebGL, ES modules and network access to the Three.js CDN are required.

See `ASSET_CREDITS.md` for dependency and asset provenance.
