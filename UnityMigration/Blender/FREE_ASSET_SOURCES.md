# Free Asset Sources — Jungle Escape

All listed sources below are free at the time checked. Re-check the licence and source page before shipping; keep a copy of the licence/credits with each imported asset.

## Hero character and animations

### Existing black-suit character in this repository
- File: ../public/models/character_black_suit_rigged.glb
- Use: first inspect this model in Blender. Check the rig, material maps, scale, bind pose and animation clips; the filename alone does not prove it has the required run/jump/slide/fall actions.
- Licence: not verified in this repository metadata. Do not ship it commercially until ownership/licence is confirmed.
- Blender workflow: import GLB, repair/retarget the rig if necessary, then export FBX into Assets/Characters.

### CC0 animation library
- KinemIQ free CC0 animation pack: https://kinemiq.itch.io/free-game-animations
- The downloadable CC0 pack includes 35 game animations and a mannequin; use the CC0 FBX pack for the cleanest Unity Humanoid import.
- The wider 460-clip browser library includes CC0 and CC-BY clips. Select only clips marked CC0 if the project should avoid attribution obligations.
- Required mapping: Run/Sprint, Jump take-off/air/landing, Crouch/Slide equivalent, Fall/Death and recovery. Rename or retarget clips in Unity; keep runner locomotion in-place.

## Guardian / monster

### High-detail static gorilla source
- Grab3D Silverback Gorilla: https://grab3d.com/models/animals/gorilla/
- Licence: CC0 1.0 according to the source listing.
- Available formats include GLB, FBX and Blender source. The high-detail option is listed at about 523k triangles with 4K maps; a lighter option is listed around 262k triangles with 1K maps.
- Important: the source is a static pose, not a ready-to-use animated rig. It is too heavy to drop straight into a mobile game. Retopologize/decimate to a tested mobile budget, bake detail into normal/AO maps, create a Generic ape rig and author/retarget run, roar, catch, hit and fall clips in Blender.

### Rigged ape prototype alternative
- OpenGameArt rigged monkey: https://opengameart.org/content/monkey-3d-model-rigged-fbx
- Licence: CC0 according to its listing; one animation is included.
- It is a monkey/cartoon-style base, not a realistic gorilla. Use only as a temporary rig/animation test if the download and licence archive confirm the CC0 notice.

## Jungle and temple environment
- Gobkit free CC0 models: https://gobkit.com/freebies
  - The free collection lists rigged/animated low-poly characters and nature props (trees, rocks, cliffs) in GLB under CC0.
  - Good for distant jungle dressing and prototypes; not a replacement for close-up photorealistic temple architecture.
- Poly Haven: https://polyhaven.com/
  - CC0 environment textures, HDRIs and models. Use aged stone, rock, forest floor, moss and foliage scans; downscale maps and bake trim sheets for mobile.
- ambientCG: https://ambientcg.com/
  - CC0 PBR materials useful for limestone, moss, rock and dirt. Check each downloaded material's texture resolution and package only maps actually used.

## Integration rules

1. Keep each downloaded asset's original licence and source URL in the project.
2. Do not use scraped, ripped or extracted Temple Run assets.
3. For mobile, profile the final imported mesh, material count, texture memory and overdraw. Source quality does not equal mobile-ready quality.
4. Use one shared humanoid rig for the hero and CC0 animation clips where possible. The gorilla needs its own Generic rig; do not force the ape into Unity's Humanoid mapping.
5. Do not add a model to the APK until the licence, rig, scale, animation and Android performance are checked.

## Current status
The CC0 KinemIQ animation pack has been downloaded into Assets/Characters/Animations/KinemIQ by GitHub Actions. The current guardian pipeline generates an original procedural rigged ape using Blender/prepare_gorilla.py rather than downloading the static Grab3D reference. The black-suit hero FBX conversion remains optional and its source licence must be confirmed before shipping.
