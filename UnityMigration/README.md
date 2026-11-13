# Jungle Escape — Unity Migration

This is a separate Unity source track. It does not replace the existing Three.js game or modify main. The original release 1.002 remains available on main and versions/1.002.

## Target toolchain
- Unity 6 LTS-compatible project with Universal Render Pipeline (URP)
- Android Build Support (SDK, NDK, OpenJDK) through Unity Hub
- Blender 4.x for procedural environment assets and character rig/animation authoring
- FBX for skeletal characters; GLB for modular environment interchange after axis validation

All scripts and procedural generators in this branch are free. Unity Personal eligibility/terms and every external asset licence must be checked before use. No paid asset is required by this source scaffold.

## Android-only development limitation
Unity Editor and Blender are desktop applications. They cannot be run as full authoring tools on a normal Android phone. A phone can test an exported APK, but it cannot create/import/rig/build the complete Unity project. This branch contains Unity source scripts and Blender generators/guides; it does not contain a ready-to-open complete Unity project, finished character/guardian assets, or a built Android APK. A Windows/Linux PC or trusted cloud workstation with a valid Unity license is required to author and build it.

GitHub Actions alone is not a free Unity build machine: Unity licensing and editor installation/activation must be configured lawfully. Do not add license files or secrets to the repository.

## Start here
1. Read [UNITY_SETUP.md](UNITY_SETUP.md) for exact scene, prefab, Inspector and UI wiring.
2. Read [Blender/ASSET_PIPELINE.md](Blender/ASSET_PIPELINE.md) for explorer/guardian rigging, animation clips, modular bridge art and mobile budgets.
3. Run [Blender/generate_track_modules.py](Blender/generate_track_modules.py) in Blender 4.x to generate straight, left-turn, right-turn and broken-gap blockout modules.
4. Import the GLBs into Unity, verify orientation, create prefabs, add TrackSegment and assign Entry/Exit/Path Nodes.
5. Build the scene and test each gameplay system in the validation order in UNITY_SETUP.md.

## Implemented source systems
- TrackSegment entry/exit anchors and ordered centerline path nodes for curved modules.
- TrackDirector connected modular track generation with straight, left-turn, right-turn and gap prefab pools, ahead spawning and old-segment cleanup.
- Track-aware three-lane RunnerMotor with smooth lane correction, jump, slide, fall detection, start/replay reset and safe-position revive.
- SwipeInput for touch gestures and keyboard testing.
- RunnerCamera smooth third-person follow with sphere-cast obstruction handling.
- GuardianChase gap control, stumble/boost response and caught UnityEvent.
- RunProgress distance, score and coin tracking.
- PickupItem coin, gem and boost triggers; ObstacleHazard stumble/recovery triggers.
- GameBootstrap main-menu start, game-over, once-per-run gem revive and replay reset.
- UIFlow uGUI controller for PLAY menu, live HUD, revive overlay and game-over panel.
- RunnerAnimationDriver Animator parameter bridge for run/jump/slide/stumble/fall.
- Blender straight/turn/gap environment blockout generator and character/guardian asset pipeline guide.

## Not finished / not claimed
- Production-quality hero and guardian meshes, skeletal rigs, fur, textures or animation clips.
- Final carved bridge art, polished temple/jungle biome, props, particles, lighting, audio or authored obstacle layouts.
- Verified Unity compilation, Android APK, device FPS, thermal/memory profiling or gameplay QA.
- Online economy, secure gem wallet, ads or real-money purchases. Current gems are local PlayerPrefs prototype currency.

This is a gameplay architecture and source-code milestone, not an AAA-finished game. Treat every segment and animation as unvalidated until it has been imported and tested in Unity.
