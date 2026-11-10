# Rigged GLB character integration

The runtime expects these optimized files:

- `hero.glb` — one skinned humanoid mesh plus at least one animation clip. Preferred clip names include `run`, `jog`, `sprint`, `jump`, `slide`, and `idle`.
- `guardian.glb` — one skinned creature mesh plus at least one animation clip. `run` or `walk` is preferred.

The loader automatically normalizes each model to a target height, grounds it at Y=0, centers X/Z, cross-fades named clips, and leaves the procedural fallback visible if the model is missing, static, or invalid. If the imported character faces away from the track, change `rotationY` in the two `attachAnimatedGLB(...)` calls in `src/main.js` to `Math.PI`.

## Verified CC0 candidates researched on 2026-11-09 (not bundled)

### Hero rig candidate

**Innerscene — “Locomotion collection - Sam 3D Person, Animated”**
- Source: https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-sam-3d-person-animated-dc23800f
- License: CC0 1.0, public domain; commercial use and redistribution allowed without attribution.
- Page metadata: 20.9 MB GLB; skinned adult male; seven looping clips including idle, relaxed walk, brisk walk, jog, run, carry walk and sit/stand.
- This is a technical rig/animation candidate, not a final Indian adventurer design. Customize clothing, hair, gear and materials before treating it as the finished hero.

Download the GLB from the source page and save it as `hero-source.glb` in this folder.

### Guardian rig candidate

**Grab3D — “Werewolf”**
- Source: https://grab3d.com/models/creatures/werewolf/
- License: CC0 1.0, public domain; commercial use allowed without attribution.
- Page metadata: separate rigged GLB export (listed as 14 MB) with walk/run animation; a separate lightweight model tier is listed as 400k triangles and 1K maps. Confirm the selected rigged export's actual geometry in the inspector before shipping.
- This is a werewolf-style technical candidate, not a final Indian mythic guardian design.

Download the rigged GLB from the source page and save it as `guardian-source.glb` in this folder.

## Optimize and inspect

```bash
npm install
npm run assets:inspect:hero
npm run assets:inspect:guardian
npm run assets:optimize:all
npm run assets:check
```

The optimization commands quantize vertex data, convert textures to WebP and cap texture dimensions at 1024 px. They intentionally do **not** simplify rigged meshes automatically, to avoid silently damaging skin weights or animation. Inspect triangle counts and run a visual animation test on Android before deciding whether to create a separate LOD.

## Texture candidate

**ambientCG — Rock 024** is a scanned stone surface, CC0 1.0. Official asset page: https://ambientcg.com/view?id=Rock024. The page lists a 1K JPG archive (8 MB). It is not bundled; the current runtime uses small original procedural PBR textures until a downloaded and verified map set is added.