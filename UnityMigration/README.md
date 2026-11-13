# Jungle Escape — Unity Migration (Phase 1)

This is a **separate Unity source track**. It does not replace the existing Three.js game or modify `main`. The original release 1.002 remains available on `main` and `versions/1.002`.

## Target toolchain
- Unity 6 LTS-compatible project, Universal Render Pipeline (URP)
- Android Build Support (SDK, NDK, OpenJDK) through Unity Hub
- Blender 4.x for procedural environment assets
- glTF/GLB export for art interchange

All source scripts and the Blender generator are free. Unity Personal and any third-party asset licenses must be checked before use. No paid asset is required by this source scaffold.

## Important: Android-only development limitation
Unity Editor and Blender are desktop applications. They cannot be run as full authoring tools on a normal Android phone. A phone can test an exported APK, but it cannot create/import/rig the complete Unity project. This branch therefore provides the source architecture and a Blender generation script; it does **not** claim to contain a built Unity APK. A Windows/Linux PC or a trusted cloud workstation with a valid Unity license is needed to open, author, and build this project.

GitHub Actions alone is not a free Unity build machine: Unity licensing and editor installation/activation must be configured lawfully. Do not add license files or secrets to the repository.

## Import into Unity
1. On a PC, install Unity Hub and a Unity 6 editor with Android Build Support.
2. Create a new **3D (URP)** project named `JungleEscapeUnity`.
3. Copy `UnityMigration/Assets/Scripts` into the new project's `Assets/Scripts`.
4. In Project Settings > Player, set package identifier to `com.jungleescape.losttemple`, orientation to Portrait, and minimum API level to a device-supported Android version.
5. Create a scene with a Plane/ground, a Runner GameObject with CharacterController, a Camera, a Guardian GameObject, and a TrackDirector.
6. Assign the references in Inspector. Create a segment prefab with a BoxCollider/ground collider and optional visual mesh, then assign it to TrackDirector.
7. Add SwipeInput to a scene object and assign RunnerMotor. Set Active Input Handling to Input Manager (Old) or Both.
8. Run the Blender script in Blender 4.x to generate the first bridge module; export/import the resulting GLB and replace the placeholder segment visuals.
9. Build and test on an Android device. Tune quality only after profiling on the target phone.

## Phase 1 scope
- Three-lane runner movement, jump, slide, touch swipes and keyboard test input
- Reusable track segment spawning and cleanup
- Guardian gap/chase response to stumble and boost
- Smooth follow camera
- Procedural Blender bridge starter asset

## Not yet implemented / not claimed
- Production-quality character or beast models and their skeletal animation clips
- Authored 90-degree junction/turn prefabs and path-following around corners
- Finished obstacles, coins, powerups, menu/HUD, audio, save system and revive flow
- Verified Android build, device FPS, heat, memory or gameplay test

These are explicit next milestones, not completed features.
