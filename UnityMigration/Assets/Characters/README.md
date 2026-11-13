# Character assets in this branch

- `Guardian_Ape.fbx`: original Blender-generated dark temple ape with a Generic armature and Idle, Run, Roar, Catch and Fall actions. It is procedural prototype art, not a photorealistic AAA creature.
- `Animations/KinemIQ/KinemIQ_Mannequin.fbx`: CC0 humanoid fallback mesh. If a licensed `Explorer_BlackSuit.fbx` is added later, the scene generator will prefer it. The fallback mannequin is recoloured dark and given a backpack for the prototype.
- `Animations/KinemIQ/FBX/`: CC0 humanoid animation pack. Unity imports the animation clips without the unused mannequin meshes and retargets the selected clips to the hero Avatar.
- The legacy black-suit GLB in `public/models/` has an extremely deep node hierarchy that exceeds Blender's glTF importer recursion limit; it is not included in this Unity milestone. Its distribution licence is also unverified.

The Unity Editor import postprocessor configures Android-oriented compression and rig settings. Always inspect the Avatar and animation preview after importing; a successful Blender FBX export does not replace in-Unity animation QA.
