# Unity Scene & Prefab Setup

The repository now contains a Unity 6 project skeleton and an Editor tool that creates a playable greybox scene automatically. The scene uses placeholder geometry so mechanics can be tested before professional art is imported.

## A. Open and generate the project

1. Install Unity Hub and a Unity 6 LTS editor with Android Build Support (SDK, NDK and OpenJDK) on a Windows/Linux desktop or legitimate cloud workstation.
2. Open the UnityMigration folder itself as the Unity project. Let Package Manager install URP and uGUI.
3. Ensure Active Input Handling is **Input Manager (Old)** or **Both**; the current swipe script uses the legacy Input API.
4. In GitHub Actions, check **Generate Blender Track Assets**; after a successful run, the FBX modules should appear in Assets/Environment/Generated. The same files can be generated locally with Blender/generate_track_modules.py.
5. In Unity, choose **Tools > Jungle Escape > Generate Demo Scene**.
5. Open Assets/Scenes/JungleEscape_Demo.unity and press Play.
6. Keyboard test: Left/Right or A/D to change lane, Space/Up to jump, Down/S to slide. Android uses directional swipes.

The generator creates reusable straight, left/right quarter-turn and broken-gap prefabs, a connected track, a greybox explorer and guardian, camera, score HUD, main menu, gem revive overlay, coins/gems, and slide/jump tutorial hazards. If Assets/Characters/Explorer_BlackSuit.fbx exists, it imports that model and builds a basic Animator Controller from the clips found in the FBX; otherwise it uses the primitive explorer placeholder. Later spawned straight/turn modules receive extra procedural coin rows and a slide-or-jump hazard; gap modules remain clear for the jump. It also creates a mobile URP asset. These are prototype visuals, not final art.

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
- RunnerMotor handles movement and track-relative lane offsets.
- Keep character animation in-place; disable Animator Apply Root Motion.
- Connect RunnerMotor fall handler to GameBootstrap.OnRunnerCaught (the generated demo scene does this automatically).

### Guardian
- GuardianChase follows behind the runner, closes the gap after stumbles and falls back after boosts/clean movement.
- Keep the gameplay collider simple (capsule); the visual guardian can use a Generic rig.
- Connect its caught event to GameBootstrap.OnRunnerCaught (the generated demo scene does this automatically).

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

See Blender/ASSET_PIPELINE.md for skeletons, clip naming, export settings, mobile budgets and modular bridge modelling. Run Blender/convert_black_suit_to_fbx.py to prepare the repository black-suit GLB as Assets/Characters/Explorer_BlackSuit.fbx; then re-run the scene generator. Required hero clips: Idle, Run, Jump, Slide, Fall/Death and optional Stumble. Guardian clips: Idle, Run, Roar, Catch and Fall. Keep movement clips in-place and let Unity drive locomotion.

## F. Android APK build

The repository includes .github/workflows/unity-android.yml. It runs only when manually started and needs a valid Unity license file in repository Actions secret UNITY_LICENSE:
1. Activate Unity Personal in Unity Hub on a desktop/cloud workstation.
2. Add the activated .ulf file contents as repository secret UNITY_LICENSE.
3. GitHub → Actions → Unity Android APK (Unity Migration) → Run workflow on unity-migration/phase-1.
4. Download the Jungle-Escape-Unity-Android-APK artifact only after the run reports success.

The build script targets portrait ARM64 IL2CPP. If Unity licensing is not configured, the remote build cannot start successfully. Do not share passwords or commit license files.

## G. Validation order

1. Straight-only run, three lanes, jump and slide.
2. Coin/gem/boost triggers and score updates.
3. Slide/jump hazard avoidance and guardian catch distance.
4. Left and right turns; inspect camera pan, lane offsets and railing clearance.
5. Broken gap; tune take-off timing, jump velocity and landing deck.
6. Camera collision around inner/outer turn walls.
7. Repeated 5–10 minute runs; inspect GC allocations, draw calls, memory, heat and frame pacing on the target phone.

A genuine AAA-quality result requires realistic production models, skeletal animation, detailed materials, lighting, sound, level design, device profiling and extensive playtesting. Scripts and greybox primitives cannot supply that polish by themselves.
