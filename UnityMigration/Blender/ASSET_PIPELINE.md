# Blender Asset Pipeline — Jungle Escape

This document is the production asset checklist for the original Jungle Escape art direction. Do not use ripped Temple Run meshes, textures, rigs, sounds or animations.

## 1. Explorer hero

The repository already includes a black-suit rigged GLB at `../public/models/character_black_suit_rigged.glb`. Import it into Blender first, inspect its skeleton and animation clips, confirm its asset licence/ownership, then export an FBX copy into UnityMigration/Assets/Characters. Do not overwrite the original GLB. If the rig or clips are unsuitable, use the following checklist to repair or replace it.

Target: readable athletic adventurer silhouette, dark/neutral expedition clothing, backpack, boots and restrained high-contrast details. Keep the silhouette clean at a portrait mobile camera distance.

### Recommended Blender setup
1. Model in real-world scale: character height about 1.7–1.85 m; apply object scale before rigging.
2. Use separate objects/material slots for body, clothing, boots, backpack and accessories. Keep moving accessories lightweight.
3. Use a deform rig with a clean hierarchy:
   - root (world locomotion)
   - pelvis, spine_01, spine_02, chest, neck, head
   - clavicle.L/R, upper_arm.L/R, lower_arm.L/R, hand.L/R
   - thigh.L/R, calf.L/R, foot.L/R, toe.L/R
4. Add IK controls for feet and hands while authoring; bake final animation to deform bones before export.
5. Keep deformation weights clean around shoulders, elbows, hips and knees. Test extreme jump and slide poses before export.

### Required clips
Create separate actions, all in-place (root motion disabled; Unity controller moves the character):
- Idle: 1.5–3 s loop, subtle breathing.
- Run: 0.65–0.85 s loop, consistent foot contacts, no forward root translation.
- Jump: 0.65–0.95 s, anticipation, take-off, airborne pose, landing recovery.
- Slide: 0.7–0.9 s, low profile, feet forward, hands clear of floor.
- Fall: 0.6–1.0 s, loss of balance and fall.
- Death: 1.0–1.8 s, readable final pose; no gore.
- Optional Stumble: 0.35–0.6 s, recoverable stagger.

Export one FBX for rig + mesh + actions, or GLB if the Unity importer pipeline is already validated. Use 30 fps, bake animation, export only deform bones, apply transforms, and verify clip names and frame ranges in Unity.

## 2. Temple gorilla guardian

Target: original intimidating dark-furred temple guardian with broad shoulders, long forearms, heavy hands, powerful legs, expressive brow and readable face. Avoid an over-detailed silhouette that becomes noisy on a phone.

- Use a dedicated humanoid-like quadruped/biped hybrid rig; do not force a human Humanoid avatar if bone proportions do not fit.
- Suggested bones: root, pelvis, spine, chest, neck, head, paired clavicle/upper-arm/forearm/hand and thigh/shin/foot chains.
- Use fur cards or a restrained shader/normal detail rather than millions of individual strands.
- Required clips: Run, Roar, Attack/Catch, Stumble, Fall, Idle.
- Make the guardian's feet contact the ground. Keep the run cycle in-place; let Unity chase code drive translation.
- Use a low-cost shadow proxy or simplified collision capsule; do not use the detailed skinned mesh as gameplay collision.

## 3. Modular environment and anchor convention

Build each bridge module in a consistent local coordinate system. In Unity, standardize local +Z as forward, +Y as up, +X as right after import. Place an Entry empty at the start and an Exit empty at the end. Their forward axes must point in the direction of travel at each end.

### Straight bridge
- Recommended module length: 18 m; width: 5.4 m; playable deck about 4.2 m.
- Separate low-poly collision deck from decorative stone paving.
- Use layered limestone blocks, chipped bevels, carved parapets, occasional pillars, moss decals and restrained debris.
- Keep railings outside the three-lane collision envelope.

### 90-degree turns
- Make separate left and right quarter-turn modules.
- Use a smooth quarter-circle centerline or 4–8 ordered path guide empties. Assign these empties to TrackSegment Path Nodes in travel order.
- Entry points into the module; Exit is rotated 90 degrees to the new heading.
- Keep the playable deck width constant through the bend. Add outer parapet and inner wall collision separately.
- Test the lane offsets along the full curve; do not build a sharp corner that clips the player.

### Broken bridge / jump gap
- Use a dedicated module with a visible gap and no ground collider across the opening.
- Add safe take-off and landing decks; keep the gap width within the tested jump range.
- Set TrackSegment Is Gap Segment for debugging/analytics. Physics is driven by the actual missing floor collider, not this flag.
- Add clear visual warning (broken stones, exposed beams, particles) before the edge.

## 4. Materials, LOD and mobile budgets

- Prefer 1–2 material sets per modular kit; use atlases where practical.
- Use 1K–2K textures for hero and environment hero assets; 512–1K for small props. Profile actual device memory.
- Create LOD0/LOD1/LOD2 for hero environment pieces; use simpler collision meshes.
- Bake high-poly sculpt detail into normal/AO maps. Use trim sheets for repeating carved stone.
- Keep real-time lights limited; bake static lighting where possible. Use URP, mobile-friendly shaders and GPU instancing for repeated stones.
- Avoid transparent fur cards overdraw. Test thermal throttling and frame pacing on the target Android phone.

## 5. Unity import checklist

- Set model scale consistently; inspect axis orientation before creating prefabs.
- Rigged hero: Avatar Definition = Create From This Model only if a valid humanoid mapping exists; otherwise Generic.
- Set clips to Loop Time for Idle and Run; keep Jump/Slide/Fall/Death non-looping.
- Disable root motion because RunnerMotor controls movement.
- Add TrackSegment to each track prefab; assign Entry, Exit and optional ordered Path Nodes.
- Add colliders as separate low-poly objects. Mark pickup/hazard colliders as triggers.
- Validate every segment seam, lane width, collider and turn direction in a simple test scene before art polish.

## 6. Current repository asset status

Blender/generate_bridge.py is a starter procedural straight bridge generator only. It is not a finished photorealistic asset and has not been executed in Blender in this environment. The hero and guardian models, rigs and animation clips are still art-production tasks.
