# Jungle Escape — Unity Migration

This is a separate Unity project track. It does not replace the existing Three.js game or modify main. The original release 1.002 remains available on main and versions/1.002.

## Current project contents
- A Unity 6 project skeleton is now included in this folder (ProjectSettings, Packages, runtime scripts and Editor tools).
- Assets/Editor/ProjectBootstrap.cs generates a playable greybox scene, straight/left-turn/right-turn/broken-gap track prefabs, URP settings, basic UI, coins/gems and tutorial hazards. In Unity, run **Tools > Jungle Escape > Generate Demo Scene**.
- Assets/Editor/AndroidBuild.cs generates the demo scene and builds an ARM64 portrait APK.
- .github/workflows/blender-assets.yml runs Blender headlessly in GitHub Actions and has successfully generated and committed four FBX/GLB modules (straight, left turn, right turn and broken gap) to Assets/Environment/Generated.
- .github/workflows/unity-android.yml provides a manual GitHub Actions build. It now checks for UNITY_LICENSE, UNITY_EMAIL and UNITY_PASSWORD secrets before starting, without printing their values.

## Target toolchain and licensing
- Unity 6 LTS-compatible editor with Android Build Support (SDK, NDK, OpenJDK)
- Universal Render Pipeline (URP), uGUI and the legacy Input Manager (or Both)
- Blender 4.x for character/guardian rigging and environment art
- FBX for skeletal characters; GLB for modular environment interchange after axis validation

Scripts, generators and the demo scene are free. Unity Personal is free for eligible creators subject to Unity's current terms; external asset licences must also be checked. No paid asset is required by this source scaffold.

## Android-only limitation and APK workflow
Unity Editor and Blender are desktop authoring applications. A normal Android phone can install/test an APK but cannot author, rig or build this Unity project. GitHub Actions can run the build remotely, but Unity CI licensing is a separate requirement. Do not commit license files, passwords or secrets to the repository.

**Important version note:** `UnityMigration/ProjectSettings/ProjectVersion.txt` pins this project to Unity `6000.0.60f1` (Unity 6.0). The Unity Hub app version `3.22.6` is not the Editor version, and the Unity 6.6 Editor shown in Hub is not the version currently pinned by this project. Do not download Unity 6.6 for this branch unless the project is deliberately upgraded and validated.

### Preferred APK route: Unity Build Automation
Use the official Unity Build Automation service rather than trying to export a Personal `.ulf` file to GitHub Actions. Read [`UNITY_CLOUD_BUILD.md`](UNITY_CLOUD_BUILD.md) for the exact configuration. The free Unity Cloud Personal tier currently includes 200 Windows build minutes per month and 5 GB DevOps storage; monitor usage and do not opt into paid overages. Configure the project subfolder as `UnityMigration`, branch as `unity-migration/phase-1`, auto-detect the editor version from `ProjectVersion.txt`, and choose Android APK.

### Optional GitHub Actions route (not the current recommended path)
The existing `.github/workflows/unity-android.yml` is retained for a future supported CI license arrangement. It checks for `UNITY_LICENSE`, `UNITY_EMAIL`, and `UNITY_PASSWORD` secrets. Do not create these by guessing, do not use browser developer-tools workarounds, and never share passwords or license data in chat. Unity's current documentation says Unity Personal is activated through Unity Hub sign-in and does not support the legacy manual activation flow. A Hub Personal Activation Date is not itself a GitHub Actions license secret. Do not expect this optional workflow to build until a supported CI license has been verified.

## Start here
1. Open this UnityMigration folder as the Unity project on a desktop/cloud workstation.
2. Let Unity resolve packages. Check the **Generate Blender Track Assets** workflow; if successful, FBX modules are committed under Assets/Environment/Generated.
3. Run **Tools > Jungle Escape > Generate Demo Scene** in Unity.
4. Open Assets/Scenes/JungleEscape_Demo.unity and press Play. Keyboard: arrows/A-D, Space/Up, Down/S. On Android: swipe left/right/up/down.
5. Read UNITY_SETUP.md for scene systems and validation.
6. Read UNITY_CLOUD_BUILD.md for the recommended free cloud APK build.
6. Read Blender/ASSET_PIPELINE.md for explorer/guardian rigging, animation clips, modular bridge art and mobile budgets.
7. Read Blender/FREE_ASSET_SOURCES.md for free CC0 models, animation packs and PBR texture sources.
8. Run Blender/convert_black_suit_to_fbx.py to convert the existing repository GLB into a Unity FBX after confirming its licence; re-run the scene generator to use it.

## Implemented source systems
- TrackSegment Entry/Exit anchors and ordered centerline path nodes for curved modules.
- TrackDirector connected track generation with straight, left/right turn and gap prefab pools, ahead spawning, behind cleanup and reusable segment pools.
- TrackContentSpawner adds coins and slide/jump hazards to each newly spawned non-gap segment and reuses that content when pooled modules return.
- Track-aware three-lane RunnerMotor with smooth lane correction, jump, slide, fall detection, safe-position revive and replay reset.
- SwipeInput touch gestures and keyboard testing.
- RunnerCamera smooth third-person follow with sphere-cast obstruction handling.
- GuardianChase with dynamic gap, stumble/boost response, menu pause and caught event.
- RunProgress distance, score and coin tracking.
- PickupItem coin/gem/boost triggers; ObstacleHazard supports slide/jump avoidance and recovery.
- GameBootstrap main-menu start, game-over, once-per-run gem revive and replay reset.
- UIFlow uGUI controller for PLAY menu, HUD, revive overlay and game-over panel.
- RunnerAnimationDriver Animator parameter bridge.
- Blender straight/turn/gap environment generator; a procedural rigged guardian generator; automatic hero Animator setup from the imported black-suit FBX and CC0 animation pack.
- Editor-generated greybox scene and repeatable Android build entry point.

## Not finished / not claimed
- The generated hero and guardian are primitive greybox placeholders, not finished realistic rigged models.
- Production skeletal rigs, fur, textures, animation clips, detailed temple/jungle biome, VFX, audio and polished level art remain to be produced.
- Unity Editor compilation, successful Android APK, device FPS, thermal/memory profiling and gameplay QA have not yet been verified in this environment.
- Online economy, secure gem wallet, ads or real-money purchases are not included. Gems are local PlayerPrefs prototype currency.

This is a playable vertical-slice foundation, not an AAA-finished game or a Temple Run 2 equivalent yet. Treat all gameplay and visuals as unvalidated until Unity compilation and repeated Android playtests pass.
