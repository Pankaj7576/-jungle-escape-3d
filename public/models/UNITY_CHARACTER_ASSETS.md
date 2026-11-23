# Unity character assets used by the web prototype

This folder contains character assets copied from the preserved `unity-migration/phase-1` branch. That Unity branch was not modified.

- `unity_hero_mannequin.fbx` — KinemIQ humanoid fallback mannequin from the Unity project. The Unity character README identifies the animation pack as CC0 1.0.
- `unity_hero_run.fbx` — KinemIQ `Run_sprint` animation FBX from the same CC0 1.0 animation pack.
- `unity_guardian_ape.fbx` — original procedural dark-furred temple ape generated for Jungle Escape by `prepare_gorilla.py`; the Unity source note says it contains no third-party mesh, texture, rig, or animation.

The browser build loads these FBX files with Three.js FBXLoader. If the Unity hero FBX cannot load, it falls back to the existing black-suit GLB and then to the built-in placeholder. If the ape FBX cannot load, the built-in guardian remains visible.

The Unity hero asset is the mannequin fallback, not the black-suit explorer. The existing black-suit GLB is retained as a fallback and has not been replaced.
