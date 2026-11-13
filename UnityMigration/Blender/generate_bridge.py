# Blender 4.x: run with Blender > Scripting > Run Script.
# Generates a modular ancient stone bridge starter mesh. This is a procedural blockout,
# not a finished photorealistic asset; add sculpted damage, UV textures, moss decals,
# collision simplification and LODs before shipping.
import bpy
import math
from mathutils import Vector

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, roughness=0.92):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.roughness = roughness
    return mat

stone = material("Weathered limestone", (0.34, 0.32, 0.27))
dark = material("Deep carved stone", (0.19, 0.18, 0.15))
moss = material("Jungle moss", (0.12, 0.20, 0.09))

def cube(name, loc, scale, mat, bevel=0.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Worn softened edges", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return obj

# 18m long, 5.4m wide bridge module. Local forward axis is +Y.
cube("Bridge foundation", (0, 9, -0.32), (5.4, 18, 0.55), dark, 0.12)
for row in range(18):
    y = row + 0.5
    for col in range(5):
        x = -2.16 + col * 1.08
        cube(f"Paving_{row:02d}_{col}", (x, y, 0.03),
             (1.02, 0.94, 0.18), stone, 0.045)

for side in (-1, 1):
    x = side * 2.48
    cube("Parapet lower course", (x, 9, 0.42), (0.42, 18, 0.72), dark, 0.08)
    cube("Carved parapet cap", (x, 9, 0.86), (0.55, 18, 0.18), stone, 0.07)
    for i in range(10):
        y = 0.9 + i * 1.8
        cube("Carved railing pillar", (x, y, 1.18), (0.58, 0.62, 1.0), stone, 0.07)
        cube("Pillar inset", (x - side * 0.012, y, 1.20),
             (0.60, 0.12, 0.42), dark, 0.025)

# Broken edge stones and moss accents add silhouette variation.
for i in range(22):
    x = (-1 if i % 2 else 1) * (2.12 + (i % 3) * 0.12)
    y = (i * 0.79) % 17.0 + 0.5
    cube("Mossy edge fragment", (x, y, 0.20), (0.28, 0.45, 0.09),
         moss if i % 3 else dark, 0.035)

# Export selected scene as glTF binary.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath="//ancient_bridge_module.glb",
    export_format='GLB', use_selection=True)
print("Exported ancient_bridge_module.glb beside this script.")
