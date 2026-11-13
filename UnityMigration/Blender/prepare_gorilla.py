# Prepare the free CC0 silverback gorilla model for mobile Unity.
# The source is a static pose; this script decimates it and exports a compact FBX.
# A separate Unity procedural body-sway component supplies placeholder motion until a real rig is authored.

# Cloud asset commits rebase against the latest migration branch before pushing.
import bpy
import os
import math

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
SOURCE_FBX = os.environ.get("GORILLA_SOURCE",
    os.path.join(SCRIPT_DIR, "downloads", "gorilla-light.fbx"))
OUTPUT_DIR = os.path.join(REPO_ROOT, "UnityMigration", "Assets", "Characters")
OUTPUT_FBX = os.path.join(OUTPUT_DIR, "Guardian_Ape.fbx")
MAX_TRIANGLES = 50000
# CI runs this script with the CC0 light FBX and system NumPy installed.

try:
    bpy.ops.preferences.addon_enable(module="io_scene_fbx")
except Exception:
    pass

if not os.path.isfile(SOURCE_FBX):
    raise FileNotFoundError("Gorilla source FBX not found: " + SOURCE_FBX)
os.makedirs(OUTPUT_DIR, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# Import source FBX.
import_operator = bpy.ops.import_scene.fbx
import_props = {p.identifier for p in import_operator.get_rna_type().properties}
import_options = {"filepath": SOURCE_FBX, "use_anim": False}
import_operator(**{k: v for k, v in import_options.items() if k in import_props})

meshes = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
if not meshes:
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
if not meshes:
    raise RuntimeError("The downloaded gorilla FBX contains no mesh objects.")

# Join static mesh parts while retaining their material slots.
bpy.ops.object.select_all(action="DESELECT")
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
mesh = bpy.context.object
mesh.name = "Guardian_Ape_Mobile"

mesh.data.calc_loop_triangles()
triangles_before = len(mesh.data.loop_triangles)
if triangles_before > MAX_TRIANGLES:
    decimate = mesh.modifiers.new("Mobile_Triangle_Budget", "DECIMATE")
    decimate.decimate_type = "COLLAPSE"
    decimate.ratio = max(0.01, min(1.0, MAX_TRIANGLES / float(triangles_before)))
    decimate.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.modifier_apply(modifier=decimate.name)

mesh.data.calc_loop_triangles()
triangles_after = len(mesh.data.loop_triangles)
print("Guardian triangles:", triangles_before, "->", triangles_after)

# A named root makes the model easy to attach beneath the Unity GuardianChase object.
root = bpy.data.objects.new("Guardian_Ape_Root", None)
bpy.context.collection.objects.link(root)
mesh.parent = root
mesh.matrix_parent_inverse = root.matrix_world.inverted()

bpy.ops.object.select_all(action="DESELECT")
root.select_set(True)
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh

fbx_operator = bpy.ops.export_scene.fbx
available = {prop.identifier for prop in fbx_operator.get_rna_type().properties}
fbx_options = {
    "filepath": OUTPUT_FBX,
    "use_selection": True,
    "object_types": {"MESH", "EMPTY"},
    "apply_unit_scale": True,
    "axis_forward": "-Z",
    "axis_up": "Y",
    "add_leaf_bones": False,
    "bake_anim": False,
    "path_mode": "COPY",
    "embed_textures": True
}
fbx_operator(**{key: value for key, value in fbx_options.items() if key in available})

with open(os.path.join(OUTPUT_DIR, "Guardian_Ape_SOURCE.txt"), "w", encoding="utf-8") as file:
    file.write("Source: https://grab3d.com/models/animals/gorilla/\n")
    file.write("Download: https://grab3d.com/dl/gorilla/gorilla-light.fbx\n")
    file.write("Licence: CC0 1.0, public domain dedication.\n")
    file.write("Source is a static pose without a rig.\n")
    file.write("Triangle count: %d -> %d (target maximum %d).\n" %
               (triangles_before, triangles_after, MAX_TRIANGLES))

print("Mobile guardian FBX exported:", OUTPUT_FBX)
