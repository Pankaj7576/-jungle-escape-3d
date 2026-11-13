# Unity Scene & Prefab Setup

This guide turns the source scripts in this folder into a playable vertical slice. The repository contains scripts and Blender generators, not a ready-made Unity project or finished art assets.

## A. Create the Unity project

1. Install Unity Hub on a Windows/Linux desktop or a legitimate cloud workstation. Install a Unity 6 LTS editor with Android Build Support (SDK, NDK and OpenJDK).
2. Create a 3D URP project. Install/enable Unity UI (uGUI) if it is not included in the template.
3. Copy UnityMigration/Assets/Scripts into the project's Assets/Scripts folder.
4. Set Package Name to com.jungleescape.losttemple, orientation Portrait, scripting backend IL2CPP for release, and ARM64 architecture.
5. Set Active Input Handling to Input Manager (Old) or Both. The swipe script uses the legacy Input API.
6. Create a scene and save it as Assets/Scenes/Run.unity.

## B. Build the track prefabs

Every module root needs TrackSegment. Make these child transforms:
- Entry: exact beginning connection point; its local +Z points into the module.
- Exit: exact end connection point; its local +Z points out in the next travel direction.
- Path Nodes: optional ordered centerline transforms between Entry and Exit. Essential for curved 90-degree turns; order them from Entry to Exit.

Create at least:
- Start segment (straight, safe).
- One or more straight modules.
- Left and right quarter-turn modules. Exit heading must be rotated exactly 90 degrees relative to Entry.
- Broken-gap module. Remove the floor mesh AND floor collider across the gap; retain colliders on take-off and landing decks.

Set the module root pivot consistently. Use the Blender generator as a blockout source, then import and orient each prefab so Unity local +Z is forward and +Y is up. Assign Entry, Exit and Path Nodes in the TrackSegment Inspector.

## C. Scene objects and references

### Runner
- Create Runner GameObject at the center lane on the start module.
- Add CharacterController (height about 1.8, radius 0.35, center Y about 0.9).
- Add RunnerMotor and RunnerAnimationDriver.
- Assign TrackDirector to RunnerMotor after creating the director.
- Add a rigged explorer mesh with Animator as a child. Disable Apply Root Motion.
- Assign Animator and RunnerMotor to RunnerAnimationDriver.

### Track
- Add an empty TrackDirector object at the first module's Entry pose.
- Add TrackDirector component; assign Runner, Start Segment Prefab, Straight Prefabs, Left Turn Prefabs, Right Turn Prefabs and Gap Prefabs.
- Start with 8 segments ahead, 2 kept behind, 0.10–0.12 turn chance and 0.08–0.10 gap chance. Lower these until the modules are validated.
- Add the TrackDirector reference to RunnerMotor.

### Guardian
- Add Guardian GameObject behind the start runner, with a simplified capsule collider and the guardian mesh as a child.
- Add GuardianChase, assign Runner Transform.
- In GuardianChase On Caught UnityEvent, add GameBootstrap.OnRunnerCaught.
- Use a Generic Animator for a non-human guardian rig. Keep its run clip in-place.

### Camera
- Add RunnerCamera to the Main Camera and assign Runner target (GameBootstrap can also assign it at runtime).
- Set Obstruction Mask to environment-only layers; exclude Runner and Guardian layers to prevent the camera sphere cast from hitting the characters.
- Tune offset around (0, 4.2, -7.5), collision radius around 0.22 and look height around 1.25.

### Game state and UI
- Add GameBootstrap to a GameManager object. Assign Runner, Guardian, RunnerCamera, RunProgress, TrackDirector and UIFlow.
- Add RunProgress to GameManager and assign Runner Transform.
- Create Canvas (Screen Space - Overlay) with MainMenu, HUD, ReviveModal and GameOver panels.
- Add Text fields for score, distance, coins, gems and revive message; add PLAY, REVIVE, GIVE UP and RESTART buttons.
- Add UIFlow to Canvas. Assign panels, text fields, buttons, GameBootstrap and RunProgress.
- Add SwipeInput to GameManager and assign RunnerMotor.
- Wire RunnerMotor On Fall UnityEvent to GameBootstrap.OnRunnerCaught.
- On GameBootstrap start, main menu appears and runner is paused. PLAY starts a fresh run. The revive modal spends one locally stored gem; one revive is allowed per run. GIVE UP ends the run. Gems are local PlayerPrefs prototype currency, not purchases or a secure online wallet.

## D. Obstacles and pickups

- Obstacle prefab: add trigger collider and ObstacleHazard; assign GameBootstrap. The trigger closes the guardian gap and then recovers.
- Coin prefab: add trigger collider and PickupItem; set Kind = Coin and assign RunProgress.
- Gem prefab: set Kind = Gem and assign UIFlow.
- Boost prefab: set Kind = Boost and assign GameBootstrap.
- Keep trigger volumes narrow enough to avoid collecting adjacent lanes.

## E. Animator Controller

Hero Animator parameters (exact case):
- MoveSpeed (float)
- Grounded (bool)
- Sliding (bool)
- Stumbling (bool)
- Dead (bool)
- Jump (trigger)
- Fall (trigger)

Use Idle/Run blend, Jump state, Slide state, Stumble overlay and Fall/Death state. The RunnerAnimationDriver updates the parameters; connect its PlayFall method to the RunnerMotor On Fall event if you want a dedicated fall clip before the revive modal.

Guardian: use a separate Generic Animator controller with Idle, Run, Roar, Catch and Fall clips. Drive locomotion from the chase movement; add a small driver or animation events for Roar/Catch.

## F. Validation order

1. Straight-only run, three lanes, jump and slide.
2. Coin/gem/boost triggers and score updates.
3. Obstacle stumble and guardian catch distance.
4. One left turn, then one right turn; verify every Path Node and Exit orientation.
5. One short gap; tune jump speed, gravity and gap length.
6. Camera collision around inner/outer turn walls.
7. Repeated 5–10 minute runs; inspect GC allocations, draw calls, memory, heat and frame pacing on the target phone.

Do not raise segment variety or visual quality until the previous step is stable. A real AAA-quality result requires professional modelling, animation, lighting, sound, level design, device profiling and repeated playtesting; scripts alone cannot supply that polish.
