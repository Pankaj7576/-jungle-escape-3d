# Jungle Escape — Unity Migration

This is a separate Unity project track. It does not replace the Three.js Android release or modify main. The latest verified Three.js Android release is 1.005 on release/1.005-render-loop-efficiency; main remains on the older 1.002 baseline.

## Current project contents
- A Unity 6 project skeleton is included in this folder: Assets, Packages, runtime scripts, Editor tools and ProjectSettings/ProjectVersion.txt.
- ProjectSettings/ProjectSettings.asset is not present yet. The Unity Cloud Project link is therefore not confirmed in this repository; see UNITY_AUTH_SETUP.md before attempting an online login build.
- Assets/Editor/ProjectBootstrap.cs generates a playable greybox scene, straight/left-turn/right-turn/broken-gap track prefabs, URP settings, basic UI, coins/gems and tutorial hazards. In Unity, run **Tools > Jungle Escape > Generate Demo Scene**.
- Assets/Editor/AndroidBuild.cs is the repeatable Android APK build entry point; its Unity compilation and Android output have not yet been verified.
- .github/workflows/blender-assets.yml runs Blender headlessly in GitHub Actions and has generated four FBX/GLB bridge modules (straight, left turn, right turn and broken gap) under Assets/Environment/Generated.
- .github/workflows/unity-android.yml provides an optional manual GameCI build, but it requires a supported Unity CI license and the UNITY_LICENSE, UNITY_EMAIL and UNITY_PASSWORD secrets. Those secrets are not present or verified.

## Target toolchain and licensing
- Unity 6000.0.60f1 with Android Build Support (SDK, NDK and OpenJDK)
- Universal Render Pipeline (URP), uGUI and the legacy Input Manager (or Both)
- Blender 4.x for character/guardian rigging and environment art
- FBX for skeletal characters; GLB for modular environment interchange after axis validation

Scripts and generators are free. Unity Personal is free for eligible creators subject to Unity's current terms; external asset licences must also be checked. No paid asset is required by this source scaffold.

## Android-only limitation and APK workflow
Unity Editor and Blender are desktop authoring applications. A normal Android phone can install/test an APK but cannot author, rig or build this Unity project. Unity Build Automation may build remotely after the target, project link and hook are configured. GitHub Actions' optional Unity workflow has a separate CI licensing requirement. Do not commit license files, passwords or secrets to the repository.

**Important version note:** ProjectSettings/ProjectVersion.txt pins this project to Unity 6000.0.60f1 (Unity 6.0). The Unity Hub app version 3.22.6 is not the Editor version, and the Unity 6.6 Editor shown in Hub is not the version currently pinned by this project. Do not upgrade this branch unless the project is deliberately upgraded and validated.

### Preferred APK route: Unity Build Automation
Use official Unity Build Automation rather than trying to export a Personal .ulf file to GitHub Actions. Read UNITY_CLOUD_BUILD.md for the exact configuration. The project subfolder is UnityMigration, the branch is unity-migration/phase-1, the editor version should be auto-detected from ProjectVersion.txt, and the target should output an APK rather than an AAB. Keep auto-build off until the first manual build is verified.

### Optional GitHub Actions route
The existing .github/workflows/unity-android.yml is retained for a future supported CI license arrangement. It checks for UNITY_LICENSE, UNITY_EMAIL and UNITY_PASSWORD secrets without printing their values. Do not create these by guessing or share passwords/license data in chat. A Unity Hub Personal Activation Date is not itself a GitHub Actions license secret.

## Start here
1. Open this UnityMigration folder as the Unity project on a desktop or supported cloud workstation.
2. Let Unity resolve packages. The Generate Blender Track Assets workflow has generated the FBX bridge modules under Assets/Environment/Generated.
3. In Unity, choose **Tools > Jungle Escape > Generate Demo Scene**.
4. Open Assets/Scenes/JungleEscape_Demo.unity and press Play. Keyboard: arrows/A-D, Space/Up, Down/S. On Android: swipe left/right/up/down.
5. Read UNITY_SETUP.md for scene systems and validation.
6. Read UNITY_AUTH_SETUP.md for Player Accounts, Cloud Save and the missing project-link step.
7. Read UNITY_CLOUD_BUILD.md for the mobile-friendly cloud APK build.
8. Read Blender/ASSET_PIPELINE.md and Blender/FREE_ASSET_SOURCES.md for the art pipeline and licence checks.

## Character and environment status
- The current Unity hero is the CC0 KinemIQ mannequin, recoloured as a dark expedition outfit with a backpack. It is a temporary animation-ready placeholder, not the requested finished black-suit explorer.
- The black-suit GLB used by the separate Three.js release is not a Unity-ready asset. Its licence is not verified in repository metadata and its hierarchy previously exceeded the Blender glTF importer's recursion limit. No black-suit-to-FBX conversion script is included; do not run a referenced script unless it is actually added and validated.
- Guardian_Ape.fbx is an original Blender-generated procedural ape blockout with a Generic rig and prototype clips. It is not a photorealistic final gorilla.
- The generated bridge modules are reusable prototypes. Detailed stone art, final character models, animation QA, VFX, audio and device profiling remain.

## Implemented source systems
- TrackSegment Entry/Exit anchors and ordered centerline path nodes for curved modules.
- TrackDirector connected track generation with straight, left/right turn and gap prefab pools, ahead spawning, behind cleanup and reusable segment pools.
- TrackContentSpawner adds coins and slide/jump hazards to newly spawned non-gap segments.
- Track-aware three-lane RunnerMotor with explicit input-driven lane changes, jump, slide, fall detection, safe-position revive and replay reset.
- SwipeInput touch gestures and keyboard testing. Its Editor pre-export classifier checks cover short taps, left/right, jump/slide and ambiguous diagonals; these are source checks, not a Unity or device test.
- RunnerCamera smooth third-person follow with sphere-cast obstruction handling.
- GuardianChase with dynamic gap, stumble/boost response and caught event.
- RunProgress, PickupItem, ObstacleHazard, GameBootstrap and UIFlow for score, pickups, hazards, menu, HUD, revive and game-over.
- CC0 KinemIQ animation imports and automatic Animator setup for the mannequin fallback.
- Blender bridge generator and procedural guardian generator.
- Editor-generated greybox scene and repeatable Android build entry point.

## Not finished / not claimed
- The Unity login code has not yet been compiled in Unity Editor or verified in an Android APK.
- The Unity Cloud project link is unconfirmed because ProjectSettings/ProjectSettings.asset has not been generated by the Editor.
- Unity Editor compilation, a successful Unity Android APK, device FPS, thermal/memory profiling and gameplay QA remain unverified.
- Production black-suit hero, photorealistic gorilla, detailed Himalayan valley/temple art, VFX and audio remain art-production tasks.
- Online economy, secure gem wallet, ads or real-money purchases are not included. Gems are local PlayerPrefs prototype currency.

This is a playable vertical-slice foundation, not an AAA-finished game or a Temple Run 2 equivalent yet. Treat gameplay and visuals as unvalidated until Unity compilation and repeated Android playtests pass.
