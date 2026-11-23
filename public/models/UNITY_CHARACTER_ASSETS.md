# Unity character assets used by the web/APK build

These are the same source assets copied from the preserved `unity-migration/phase-1` branch. The Unity branch itself remains untouched.

- `unity_hero_mannequin.fbx` — KinemIQ humanoid fallback mannequin used by the Unity project; dark material tint and a small backpack are applied in the browser scene.
- `unity_hero_run.fbx` — KinemIQ `Run_sprint` animation FBX from the same CC0 1.0 animation pack.
- `unity_guardian_ape.fbx` — the Unity project's dark-furred temple ape FBX, including its embedded Idle/Run/Roar/Catch/Fall actions.
- `unity_bridge_straight_18m.glb`, `unity_bridge_turn_left_90.glb`, `unity_bridge_turn_right_90.glb`, and `unity_bridge_broken_gap.glb` — exact GLB exports from Unity's generated bridge modules.

The browser/APK build now loads the Unity mannequin plus the Unity sprint animation, the Unity guardian ape, and the Unity bridge modules. It does not use the separate black-suit GLB or primitive character/monster substitutes. If a required Unity character asset fails to load, the build logs the error rather than silently displaying a different character.
