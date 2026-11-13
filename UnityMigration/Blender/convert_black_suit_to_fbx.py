# Blender 4.x: convert the repository's existing black-suit GLB to a Unity-friendly FBX.
# Run this file from Blender's Text Editor after opening it from the repository.
# It does not alter the source GLB. Inspect the exported clips and retarget missing actions separately.

import bpy
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
SOURCE_GLB = os.path.join(REPO_ROOT, "public", "models", "character_black_suit_rigged.glb")
OUTPUT_DIR = os.path.join(REPO_ROOT, "UnityMigration", "Assets", "Characters")
OUTPUT_FBX = os.path.join(OUTPUT_DIR, "Explorer_BlackSuit.fbx")

if not os.path.isfile(SOURCE_GLB):
    raise FileNotFoundError("Black-suit GLB not found: " + SOURCE_GLB)

os.makedirs(OUTPUT_DIR, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# Import the original GLB and keep the mesh, armature, materials and imported actions.
bpy.ops.import_scene.gltf(filepath=SOURCE_GLB)

imported = list(bpy.context.selected_objects)
armatures = [obj for obj in imported if obj.type == "ARMATURE"]
meshes = [obj for obj in imported if obj.type == "MESH"]

if not armatures or not meshes:
    raise RuntimeError(
        "The GLB did not import both a mesh and an armature. Inspect the model manually before exporting."
    )

# Apply transforms to mesh objects only; preserve the armature hierarchy.
for obj in meshes:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.select_set(False)

bpy.ops.object.select_all(action="DESELECT")
for obj in armatures + meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = armatures[0]

print("Imported armatures:", [a.name for a in armatures])
print("Imported meshes:", [m.name for m in meshes])
print("Imported actions:", [a.name for a in bpy.data.actions])

bpy.ops.export_scene.fbx(
    filepath=OUTPUT_FBX,
    use_selection=True,
    object_types={"ARMATURE", "MESH"},
    apply_unit_scale=True,
    apply_scale_options="FBX_SCALE_UNITS",
    axis_forward="-Z",
    axis_up="Y",
    add_leaf_bones=False,
    bake_anim=True,
    bake_anim_use_all_bones=True,
    bake_anim_use_nla_strips=True,
    bake_anim_use_all_actions=True,
    bake_anim_force_startend_keying=True,
    bake_anim_simplify_factor=0.0,
    path_mode="COPY",
    embed_textures=True
)

print("FBX exported:", OUTPUT_FBX)
print("Next: import into Unity, inspect Rig/Animation tabs, set Avatar mapping, and test every clip.")
