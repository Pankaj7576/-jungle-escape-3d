# Jungle Escape — Unity Migration

This is a separate Unity project track. It does not replace the existing Three.js game or modify main. The original release 1.002 remains available on main and versions/1.002.

## Current project contents
- A Unity 6 project skeleton is now included in this folder (ProjectSettings, Packages, runtime scripts and Editor tools).
- Assets/Editor/ProjectBootstrap.cs generates a playable greybox scene, straight/left-turn/right-turn/broken-gap track prefabs, URP settings, basic UI, coins/gems and tutorial hazards. In Unity, run **Tools > Jungle Escape > Generate Demo Scene**.
- Assets/Editor/AndroidBuild.cs generates the demo scene and builds an ARM64 portrait APK.
- .github/workflows/blender-assets.yml runs Blender headlessly in GitHub Actions and is configured to commit generated bridge FBX/GLB files to this branch when the generator changes; its first successful run is still pending.
- .github/workflows/unity-android.yml provides a manual GitHub Actions build. It requires a valid Unity Personal/Pro license file stored as the repository Actions secret UNITY_LICENSE.

## Target toolchain and licensing
- Unity 6 LTS-compatible editor with Android Build Support (SDK, NDK, OpenJDK)
- Universal Render Pipeline (URP), uGUI and the legacy Input Manager (or Both)
- Blender 4.x for character/guardian rigging and environment art
- FBX for skeletal characters; GLB for modular environment interchange after axis validation

Scripts, generators and the demo scene are free. Unity Personal is free for eligible creators subject to Unity's current terms; external asset licences must also be checked. No paid asset is required by this source scaffold.

## Android-only limitation and APK workflow
Unity Editor and Blender are desktop authoring applications. A normal Android phone can install/test an APK but cannot author, rig or build this Unity project. GitHub Actions can run the build remotely, but Unity still requires a valid license activation. Do not commit license files, passwords or secrets to the repository.

To enable the APK workflow:
1. Activate Unity Personal (or another valid Unity license) in Unity Hub on a supported desktop/cloud workstation.
2. Copy the activated Unity license file contents into GitHub repository Settings → Secrets and variables → Actions → New repository secret. Name it exactly UNITY_LICENSE.
3. Open the repository Actions tab, choose **Unity Android APK (Unity Migration)**, and tap **Run workflow** on branch unity-migration/phase-1.
4. If the run succeeds, download the artifact named **Jungle-Escape-Unity-Android-APK** and install JungleEscape.apk on Android.

Without a valid UNITY_LICENSE secret, the workflow will fail before compilation. A GitHub Actions workflow file is not itself proof that an APK has built.

## Start here
1. Open this UnityMigration folder as the Unity project on a desktop/cloud workstation.
2. Let Unity resolve packages, then run **Tools > Jungle Escape > Generate Demo Scene**.
3. Open Assets/Scenes/JungleEscape_Demo.unity and press Play. Keyboard: arrows/A-D, Space/Up, Down/S. On Android: swipe left/right/up/down.
4. Read UNITY_SETUP.md for scene systems and validation.
5. Read Blender/ASSET_PIPELINE.md for explorer/guardian rigging, animation clips, modular bridge art and mobile budgets.
6. Read Blender/FREE_ASSET_SOURCES.md for free CC0 models, animation packs and PBR texture sources; licences and mobile optimization requirements are documented there.
6. Run Blender/generate_track_modules.py in Blender 4.x to generate standalone straight, turn and broken-gap blockout modules.
7. Run Blender/convert_black_suit_to_fbx.py to convert the existing repository GLB into a Unity FBX without modifying the original.

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
- Blender straight/turn/gap environment blockout generator and character/guardian asset pipeline guide.
- Editor-generated greybox scene and repeatable Android build entry point.

## Not finished / not claimed
- The generated hero and guardian are primitive greybox placeholders, not finished realistic rigged models.
- Production skeletal rigs, fur, textures, animation clips, detailed temple/jungle biome, VFX, audio and polished level art remain to be produced.
- Unity Editor compilation, successful Android APK, device FPS, thermal/memory profiling and gameplay QA have not yet been verified in this environment.
- Online economy, secure gem wallet, ads or real-money purchases are not included. Gems are local PlayerPrefs prototype currency.

This is a playable vertical-slice foundation, not an AAA-finished game or a Temple Run 2 equivalent yet. Treat all gameplay and visuals as unvalidated until Unity compilation and repeated Android playtests pass.
