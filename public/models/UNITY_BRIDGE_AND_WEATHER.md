# Unity bridge and atmosphere port in the web game

## What was copied from Unity

These are the original Unity-generated Blender GLB exports, copied byte-for-byte from `unity-migration/phase-1`:
- `unity_bridge_straight_18m.glb`
- `unity_bridge_turn_left_90.glb`
- `unity_bridge_turn_right_90.glb`
- `unity_bridge_broken_gap.glb`

## What is now playable in Three.js / Capacitor

The web game does not run Unity. The Unity bridge assets and track rules have been ported to Three.js:
- Each module is connected using its exported `Entry` and `Exit` anchors, matching Unity `TrackDirector.GetSegment` placement.
- Ordered `PathNode_XX` anchors are sampled for turns, matching Unity `TrackSegment.EvaluateFrame` and `SamplePath`.
- The generator maintains eight modules ahead, keeps two behind, and pools the same module types conceptually.
- Left and right 90-degree turn modules are selected procedurally; the camera follows the current track direction.
- Broken-gap modules are inserted procedurally. The missing-deck interval is treated as a jump hazard.
- Three-lane movement uses 2 metre lane spacing, matching Unity `RunnerMotor`.
- Segment content (coins and jump/slide hazards) is generated along the actual curved path rather than on a separate straight scrolling lane.
- Runner distance and speed progression use the Unity movement model's 9.5 m/s starting speed and 14.5 m/s cap.

The Three.js port uses the same source geometry and equivalent connection/path logic, but it is not a Unity runtime or a byte-for-byte copy of C# execution.

## Atmosphere

Unity `ProjectBootstrap` configures directional sun intensity 1.15, ambient light, fog colour (0.28, 0.32, 0.29), and fog density 0.008. The web scene reproduces the fog colour/density and directional light intensity. The Unity project does not define a dynamic rain/snow/cloud weather system or separate cloud/skybox assets in `ProjectBootstrap`, so this port does not invent those effects.

## Source protection

Unity source branch: `unity-migration/phase-1`. It is read-only for this work; all playable changes are on `web-character-import-1`.
