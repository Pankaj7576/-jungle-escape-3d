# Unity Scene & Prefab Setup

The repository contains a Unity 6 project skeleton and an Editor tool that creates a playable greybox scene. The scene is a mechanics prototype, not finished production art.

## A. Open and generate the project

1. Install Unity Hub and Unity 6000.0.60f1 with Android Build Support (SDK, NDK and OpenJDK) on a Windows/Linux desktop or supported cloud workstation.
2. Open the UnityMigration folder itself as the Unity project. Let Package Manager install URP and uGUI.
3. Ensure Active Input Handling is **Input Manager (Old)** or **Both**; the current swipe script uses the legacy Input API.
4. The Generate Blender Track Assets workflow has generated FBX modules under Assets/Environment/Generated. If regenerating locally, use Blender/generate_track_modules.py.
5. In Unity, choose **Tools > Jungle Escape > Generate Demo Scene**.
6. Open Assets/Scenes/JungleEscape_Demo.unity and press Play.
7. Keyboard test: Left/Right or A/D to change lane, Space/Up to jump, Down/S to slide. Android uses directional swipes.

The generator creates reusable straight, left/right quarter-turn and broken-gap prefabs, a connected track, an explorer placeholder and guardian, camera, score HUD, main menu, gem revive overlay, coins/gems, and slide/jump tutorial hazards. The current hero is the CC0 KinemIQ mannequin recoloured dark with a backpack; it is not the finished black-suit hero. Later spawned straight/turn modules receive procedural coin rows and a slide-or-jump hazard; gap modules remain clear for the jump. The generator also creates a mobile URP asset. These are prototype visuals, not final art.

## B. Track module authoring

Every module root needs TrackSegment and these child transforms:
- Entry: exact beginning connection point; local +Z points into the module.
- Exit: exact end connection point; local +Z points out in the next travel direction.
- Path Nodes: ordered centerline transforms between Entry and Exit. Required for smooth 90-degree turns.

Module types:
- Straight: 18 m long, 5.4 m overall width.
- Left/right turns: quarter-circle centerline, exact 90-degree Exit orientation.
- Broken gap: safe take-off and landing decks with a 5 m collider-free gap. Tune jump physics against actual device frame rate and speed.

Keep a separate low-poly deck collider from decorative stone art. Railings must stay outside the three-lane collision envelope. Align all prefabs to the same scale and local axes.

## C. Runner, guardian and camera

### Runner
- CharacterController: height about 1.8 m, radius about 0.34 m, center Y about 0.9 m.
- RunnerMotor handles movement and track-relative lane offsets. Lane changes are requested through MoveLane; its Update loop only corrects toward the selected lane and does not choose a new lane by itself.
- Keep character animation in-place; disable Animator Apply Root Motion.
- Connect RunnerMotor fall handler to GameBootstrap.OnRunnerCaught (the generated demo scene does this automatically).

### Guardian
- GuardianChase follows behind the runner, closes the gap after stumbles and falls back after boosts/clean movement.
- Keep the gameplay collider simple (capsule); the visual guardian can use a Generic rig.
- Guardian_Ape.fbx is a procedural prototype rig, not a photorealistic gorilla. Connect its caught event to GameBootstrap.OnRunnerCaught (the generated demo scene does this automatically).

### Camera
- RunnerCamera uses a smoothed follow arm and SphereCast obstruction checks.
- Exclude Runner and Guardian layers from the obstruction mask; use environment-only collision layers in production.
- Tune around offset (0, 4.2, -7.5), collision radius 0.22 and look height 1.25.

## D. UI, revive, obstacles and pickups

- Main menu: PLAY starts a fresh run.
- HUD: score, distance, coins and local prototype gems.
- Revive: one gem can be spent once per run. If no gem is available, the revive button is disabled.
- Game over: Give Up or Run Again.
- Slide hazard: configure HazardAvoidance.Slide.
- Jump hazard: configure HazardAvoidance.Jump.
- PickupItem kinds: Coin, Gem and Boost. Assign RunProgress, UIFlow and GameBootstrap references as applicable.

The gem count is local PlayerPrefs prototype currency. It is not an online wallet, secure economy or payment integration.

## E. Blender character and guardian pipeline

See Blender/ASSET_PIPELINE.md for skeletons, clip naming, export settings, mobile budgets and modular bridge modelling.

**Current hero limitation:** Assets/Characters/Explorer_BlackSuit.fbx is not present in this branch. The current Unity scene uses the CC0 KinemIQ mannequin from Assets/Characters/Animations/KinemIQ/KinemIQ_Mannequin.fbx, recoloured as a dark expedition outfit with a backpack. The black-suit GLB belongs to the separate Three.js release at ../../public/models/character_black_suit_rigged.glb (relative to UnityMigration); its licence is not verified in this repository and its deep node hierarchy has not been safely imported into Blender. No Blender/convert_black_suit_to_fbx.py script exists in this branch. Do not treat that script as available or ship the GLB until licence, hierarchy, rig, scale and animation are verified. Only then add a tested Explorer_BlackSuit.fbx and rerun the scene generator.

Required hero clips: Idle, Run, Jump, Slide, Fall/Death and optional Stumble. Guardian clips: Idle, Run, Roar, Catch and Fall. Keep movement clips in-place and let Unity drive locomotion. The procedural Guardian_Ape.fbx is a prototype Generic rig, not final creature art.

## F. Android APK cloud build

Preferred route: use official Unity Build Automation, not a manually exported Personal .ulf file. See UNITY_CLOUD_BUILD.md for mobile-friendly instructions.

Key configuration:
- Unity Dashboard → DevOps → Build Automation.
- GitHub repository: Pankaj7576/-jungle-escape-3d.
- Branch: unity-migration/phase-1.
- Project subfolder path: UnityMigration.
- Unity version: auto-detect from ProjectSettings/ProjectVersion.txt (currently 6000.0.60f1).
- Platform: Android.
- Output: APK, not AAB, for direct phone testing.
- Keep auto-build off initially to conserve the free monthly build minutes.

**Project-link blocker:** ProjectSettings/ProjectSettings.asset is absent from the repository. Open UnityMigration in the Unity Editor, link the existing Cloud Project ID documented in UNITY_AUTH_SETUP.md, and save the project before expecting Unity Gaming Services login to initialize. Do not fabricate the generated settings file or create a second Cloud Project.

Unity Cloud quotas can change. Check live usage and do not opt into paid overages. A successful build and downloadable APK artifact are required before claiming a Unity APK exists.

Unity Personal is activated by signing in to Unity Hub. The optional .github/workflows/unity-android.yml remains for a future supported CI license arrangement; it is not the recommended route for this free Personal setup. Do not share passwords, tokens or license data.

## G. Validation order

1. Straight-only run, three lanes, jump and slide.
2. Coin/gem/boost triggers and score updates.
3. Slide/jump hazard avoidance and guardian catch distance.
4. Left and right turns; inspect camera pan, lane offsets and railing clearance.
5. Broken gap; tune take-off timing, jump velocity and landing deck.
6. Camera collision around inner/outer turn walls.
7. Repeated 5–10 minute runs; inspect GC allocations, draw calls, memory, heat and frame pacing on the target phone.

A genuine AAA-quality result requires realistic production models, skeletal animation, detailed materials, lighting, sound, level design, device profiling and extensive playtesting. Scripts and greybox primitives cannot supply that polish by themselves.
