# Blender 4.x script: generate straight, left/right 90-degree and broken-gap bridge modules.
# Run from Blender > Scripting. Exports four GLB files beside this script.
# Local Blender convention: +Y forward, +Z up. Reorient/verify anchors in Unity after import.
import bpy
import math
import random
import os
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
OUT_DIR = os.path.join(REPO_ROOT, "UnityMigration", "Assets", "Environment", "Generated")
os.makedirs(OUT_DIR, exist_ok=True)
OUT = OUT_DIR + os.sep
WIDTH = 5.4
DECK_WIDTH = 4.7
STONE = (0.34, 0.32, 0.27, 1)
DARK = (0.17, 0.16, 0.14, 1)
MOSS = (0.10, 0.18, 0.07, 1)
STONE_LIGHT = (0.43, 0.40, 0.34, 1)
STONE_COOL = (0.27, 0.29, 0.28, 1)
WOOD = (0.20, 0.12, 0.07, 1)
random.seed(27)
print("Generating Jungle Escape modules with Blender", bpy.app.version_string)
# Unity imports the FBX versions directly; GLB export remains a portable interchange copy when available.
# The CI workflow patches the runner FBX exporter when Blender 5 omits its legacy space-transform property.

# Enable the bundled interchange exporters when Blender ships them as add-ons.
for addon_name in ("io_scene_gltf2", "io_scene_fbx",
                   "bl_ext.blender_org.io_scene_gltf2", "bl_ext.blender_org.io_scene_fbx"):
    try:
        bpy.ops.preferences.addon_enable(module=addon_name)
    except Exception:
        pass

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        # Keep materials if another module is still exporting; scene is reset each time.
        pass

def mat(name, rgba):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.roughness = 0.92
    return m

stone = mat("Aged limestone", STONE)
dark = mat("Deep stone", DARK)
moss = mat("Jungle moss", MOSS)
stone_light = mat("Limestone variation light", STONE_LIGHT)
stone_cool = mat("Limestone variation cool", STONE_COOL)
wood = mat("Broken support timber", WOOD)

def cube(name, loc, dims, material, yaw=0.0, bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = dims
    o.rotation_euler[2] = yaw
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bevel:
        b = o.modifiers.new("Soft chipped edges", "BEVEL")
        b.width = bevel
        b.segments = 2
        o.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return o

def path_straight(length=18.0, step=0.75):
    count = int(length / step)
    return [(Vector((0, i * step, 0)), Vector((0, 1, 0))) for i in range(count + 1)]

def path_turn(left=True, radius=8.5, steps=18):
    points = []
    sign = -1 if left else 1
    for i in range(steps + 1):
        a = (math.pi * 0.5) * i / steps
        center = Vector((sign * radius * (1 - math.cos(a)), radius * math.sin(a), 0))
        tangent = Vector((sign * math.sin(a), math.cos(a), 0))
        points.append((center, tangent.normalized()))
    return points

def add_deck_mesh(name, points, gap=None):
    verts, faces = [], []
    half = DECK_WIDTH * 0.5
    for i, (center, tangent) in enumerate(points):
        right = Vector((tangent.y, -tangent.x, 0)).normalized()
        left_edge = center - right * half
        right_edge = center + right * half
        verts.extend([
            (left_edge.x, left_edge.y, -0.05),
            (right_edge.x, right_edge.y, -0.05),
            (left_edge.x, left_edge.y, 0.12),
            (right_edge.x, right_edge.y, 0.12)
        ])
        if i == 0:
            continue
        prev_center = points[i - 1][0]
        mid = (prev_center + center) * 0.5
        if gap and gap[0] <= mid.y <= gap[1]:
            continue
        a = (i - 1) * 4
        b = i * 4
        faces.extend([
            (a + 2, a + 3, b + 3, b + 2),
            (a, b, b + 1, a + 1),
            (a, a + 2, b + 2, b),
            (a + 1, b + 1, b + 3, a + 3)
        ])
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(stone)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj

def add_paving(points, gap=None):
    palette = (stone, stone_light, stone_cool, dark)
    for i in range(0, len(points) - 1, 2):
        center, tangent = points[i]
        if gap and gap[0] <= center.y <= gap[1]:
            continue
        right = Vector((tangent.y, -tangent.x, 0)).normalized()
        yaw = math.atan2(-tangent.x, tangent.y) + random.uniform(-0.012, 0.012)
        for row in range(-2, 3):
            offset = center + right * (row * 0.92)
            jittered = offset + tangent * random.uniform(-0.035, 0.035)
            dims = (random.uniform(0.82, 0.90), 0.13, random.uniform(1.28, 1.40))
            cube("Hand_cut_paving_stone", (jittered.x, jittered.y, 0.20),
                 dims, random.choice(palette), yaw, 0.045)

def add_broken_supports(points, gap, material):
    if not gap:
        return
    for i in range(0, len(points), 3):
        center, tangent = points[i]
        if gap[0] - 1.2 <= center.y <= gap[0] + 0.3 or gap[1] - 0.3 <= center.y <= gap[1] + 1.2:
            yaw = math.atan2(-tangent.x, tangent.y)
            cube("Exposed_broken_crossbeam", (center.x, center.y, -0.48),
                 (0.28, 4.9, 0.24), material, yaw, 0.04)
    for edge_y in (gap[0], gap[1]):
        for side in (-1, 1):
            cube("Broken_stone_chunk",
                 (side * (DECK_WIDTH * 0.5 - 0.28), edge_y, 0.18),
                 (0.55, 0.42, 0.22), dark, random.uniform(-0.15, 0.15), 0.08)

def add_rails(points, gap=None):
    for side in (-1, 1):
        for i in range(0, len(points), 3):
            center, tangent = points[i]
            if gap and gap[0] < center.y < gap[1]:
                continue
            right = Vector((tangent.y, -tangent.x, 0)).normalized()
            pos = center + right * side * (WIDTH * 0.5 - 0.15)
            yaw = math.atan2(-tangent.x, tangent.y)
            cube("Parapet block", (pos.x, pos.y, 0.55), (0.42, 1.8, 0.62), dark, yaw, 0.07)
            cube("Carved rail cap", (pos.x, pos.y, 0.91), (0.55, 1.8, 0.18), stone, yaw, 0.05)
            cube("Pillar", (pos.x, pos.y, 1.22), (0.58, 0.58, 0.78), stone, yaw, 0.06)
            cube("Moss detail", (pos.x, pos.y + 0.1, 1.62), (0.34, 0.25, 0.035), moss, yaw, 0.02)

def add_anchors(points, name):
    start, start_tangent = points[0]
    end, end_tangent = points[-1]
    entry = bpy.data.objects.new("Entry", None)
    bpy.context.collection.objects.link(entry)
    entry.location = start
    entry.rotation_euler[2] = math.atan2(-start_tangent.x, start_tangent.y)
    exit_obj = bpy.data.objects.new("Exit", None)
    bpy.context.collection.objects.link(exit_obj)
    exit_obj.location = end
    exit_obj.rotation_euler[2] = math.atan2(-end_tangent.x, end_tangent.y)
    for i in range(1, len(points) - 1, max(1, len(points) // 6)):
        guide = bpy.data.objects.new("PathNode_%02d" % i, None)
        bpy.context.collection.objects.link(guide)
        guide.location = points[i][0]
    return entry, exit_obj

def export_module(name, points, gap=None):
    clear_scene()
    deck = add_deck_mesh(name + "_Deck", points, gap)
    add_paving(points, gap)
    add_rails(points, gap)
    add_broken_supports(points, gap, wood)
    add_anchors(points, name)

    # Join decorative stone/rail meshes into one multi-material mesh to reduce
    # renderer count. Keep the walkable deck separate for a simple Unity collider.
    decorative = [obj for obj in bpy.context.scene.objects
                  if obj.type == 'MESH' and obj != deck]
    for obj in decorative:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        for modifier in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(False)

    if decorative:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in decorative:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = decorative[0]
        bpy.ops.object.join()
        bpy.context.object.name = name + "_Decoration"

    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type in {'MESH', 'EMPTY'}:
            obj.select_set(True)
    try:
        import numpy  # The Blender glTF exporter requires NumPy in some packaged builds.
        if hasattr(bpy.ops.export_scene, "gltf"):
            bpy.ops.export_scene.gltf(filepath=OUT + name + ".glb",
                export_format='GLB', use_selection=True)
    except Exception as error:
        print("Optional GLB export skipped for", name, ":", error)

    if not hasattr(bpy.ops.export_scene, "fbx"):
        raise RuntimeError("Blender FBX exporter is unavailable; cannot create Unity-native modules.")

    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type in {'MESH', 'EMPTY'}:
            obj.select_set(True)
    fbx_operator = bpy.ops.export_scene.fbx
    available = {prop.identifier for prop in fbx_operator.get_rna_type().properties}
    fbx_options = {
        "filepath": OUT + name + ".fbx",
        "use_selection": True,
        "object_types": {'MESH', 'EMPTY'},
        "apply_unit_scale": True,
        "axis_forward": "-Z",
        "axis_up": "Y",
        "add_leaf_bones": False,
        "bake_anim": False,
        "path_mode": "COPY",
        "embed_textures": True
    }
    # Blender exporter options vary between LTS and newer releases.
    fbx_operator(**{key: value for key, value in fbx_options.items() if key in available})
    print("Exported", name + ".fbx (GLB is optional)")

export_module("Bridge_Straight_18m", path_straight(18.0))
export_module("Bridge_Turn_Left_90", path_turn(True))
export_module("Bridge_Turn_Right_90", path_turn(False))
export_module("Bridge_Broken_Gap", path_straight(18.0), gap=(7.0, 11.0))
print("Done. Import GLBs into Unity, verify axes, add TrackSegment and colliders.")
