# Character assets in this branch

- `Guardian_Ape.fbx`: original Blender-generated dark temple ape with a Generic armature and Idle, Run, Roar, Catch and Fall actions. It is procedural prototype art, not a photorealistic AAA creature.
- `Explorer_BlackSuit.fbx`: converted from the existing `public/models/character_black_suit_rigged.glb` when the hero conversion workflow succeeds. The source asset's licence/ownership is not recorded in repository metadata; verify rights before public or commercial distribution.
- `Animations/KinemIQ/`: CC0 humanoid animation pack. Unity imports the FBX clips without the pack's unused mannequin meshes and retargets the selected clips to the hero Avatar.

The Unity Editor import postprocessor configures Android-oriented compression and rig settings. Always inspect the Avatar and animation preview after importing; a successful Blender FBX export does not replace in-Unity animation QA.
