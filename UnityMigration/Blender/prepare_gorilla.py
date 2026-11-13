# Blender 4.x/5.x: generate an original rigged dark-furred temple ape.
# The mesh is procedural and uses no ripped game assets or external model downloads.
# Run headless with Blender's FBX exporter enabled and NumPy available.

import bpy
import os
import math
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
OUTPUT_DIR = os.path.join(REPO_ROOT, "UnityMigration", "Assets", "Characters")
OUTPUT_FBX = os.path.join(OUTPUT_DIR, "Guardian_Ape.fbx")
os.makedirs(OUTPUT_DIR, exist_ok=True)

try:
    bpy.ops.preferences.addon_enable(module="io_scene_fbx")
except Exception:
    pass

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

def make_material(name, color, roughness=0.88, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled:
        principled.inputs["Base Color"].default_value = (*color, 1.0)
        principled.inputs["Roughness"].default_value = roughness
        principled.inputs["Metallic"].default_value = metallic
    return material

fur = make_material("Guardian_Dark_Brown_Fur", (0.055, 0.035, 0.025), 0.96)
fur_light = make_material("Guardian_Mane_Highlights", (0.12, 0.075, 0.045), 0.95)
face = make_material("Guardian_Facial_Skin", (0.075, 0.055, 0.05), 0.88)
muzzle = make_material("Guardian_Muzzle", (0.025, 0.022, 0.02), 0.72)
eye = make_material("Guardian_Amber_Eyes", (0.9, 0.36, 0.035), 0.28)
pupil = make_material("Guardian_Pupils", (0.008, 0.006, 0.004), 0.25)
ivory = make_material("Guardian_Tusks", (0.78, 0.68, 0.48), 0.55)

# Create a compact Generic armature. The ape is in a forward-leaning knuckle-walk pose.
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
armature = bpy.context.object
armature.name = "Guardian_Ape_Armature"
armature.data.name = "Guardian_Ape_Rig"
edit_bones = armature.data.edit_bones
root_bone = edit_bones[0]
root_bone.name = "root"
root_bone.head = (0, 0, 0)
root_bone.tail = (0, 0, 0.28)

def add_bone(name, head, tail, parent):
    bone = edit_bones.new(name)
    bone.head = head
    bone.tail = tail
    bone.parent = edit_bones[parent] if parent else root_bone
    bone.use_connect = False
    return bone

bones = {
    "pelvis": ((0, -0.18, 0.78), (0, -0.10, 1.00), "root"),
    "spine": ((0, -0.08, 1.00), (0, 0.02, 1.20), "pelvis"),
    "chest": ((0, 0.02, 1.20), (0, 0.10, 1.40), "spine"),
    "neck": ((0, 0.16, 1.34), (0, 0.30, 1.45), "chest"),
    "head": ((0, 0.30, 1.45), (0, 0.48, 1.58), "neck"),
    "jaw": ((0, 0.48, 1.38), (0, 0.61, 1.34), "head"),
    "shoulder.L": ((-0.38, 0.02, 1.28), (-0.48, 0.22, 1.10), "chest"),
    "upperarm.L": ((-0.48, 0.22, 1.10), (-0.58, 0.48, 0.72), "shoulder.L"),
    "forearm.L": ((-0.58, 0.48, 0.72), (-0.62, 0.76, 0.30), "upperarm.L"),
    "hand.L": ((-0.62, 0.76, 0.30), (-0.62, 0.92, 0.15), "forearm.L"),
    "shoulder.R": ((0.38, 0.02, 1.28), (0.48, 0.22, 1.10), "chest"),
    "upperarm.R": ((0.48, 0.22, 1.10), (0.58, 0.48, 0.72), "shoulder.R"),
    "forearm.R": ((0.58, 0.48, 0.72), (0.62, 0.76, 0.30), "upperarm.R"),
    "hand.R": ((0.62, 0.76, 0.30), (0.62, 0.92, 0.15), "forearm.R"),
    "thigh.L": ((-0.22, -0.20, 0.80), (-0.28, -0.36, 0.46), "pelvis"),
    "shin.L": ((-0.28, -0.36, 0.46), (-0.28, -0.48, 0.16), "thigh.L"),
    "foot.L": ((-0.28, -0.48, 0.16), (-0.28, -0.65, 0.08), "shin.L"),
    "thigh.R": ((0.22, -0.20, 0.80), (0.28, -0.36, 0.46), "pelvis"),
    "shin.R": ((0.28, -0.36, 0.46), (0.28, -0.48, 0.16), "thigh.R"),
    "foot.R": ((0.28, -0.48, 0.16), (0.28, -0.65, 0.08), "shin.R"),
}
for name, data in bones.items():
    add_bone(name, data[0], data[1], data[2])

bpy.ops.object.mode_set(mode="OBJECT")
armature.show_in_front = True
armature.data.display_type = "OCTAHEDRAL"

mesh_parts = []

def add_sphere(name, location, scale, material, bone_name, rotation=None, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    if rotation is not None:
        obj.rotation_mode = "QUATERNION"
        obj.rotation_quaternion = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    world = obj.matrix_world.copy()
    obj.parent = armature
    obj.matrix_world = world
    group = obj.vertex_groups.new(name=bone_name)
    group.add([vertex.index for vertex in obj.data.vertices], 1.0, "REPLACE")
    modifier = obj.modifiers.new("Guardian_Skeleton", "ARMATURE")
    modifier.object = armature
    modifier.use_deform_preserve_volume = True
    mesh_parts.append(obj)
    return obj

def add_limb(name, start, end, radius, material, bone_name):
    start_v, end_v = Vector(start), Vector(end)
    direction = end_v - start_v
    rotation = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    return add_sphere(name, (start_v + end_v) * 0.5,
        (radius, radius, direction.length * 0.62 + radius * 0.35),
        material, bone_name, rotation, 24, 16)

# Core body mass, chest and shoulder mantle.
add_sphere("Pelvis_Mass", (0, -0.18, 0.82), (0.43, 0.48, 0.32), fur, "pelvis")
add_sphere("Long_Torso", (0, -0.01, 1.08), (0.48, 0.64, 0.43), fur, "spine")
add_sphere("Heavy_Chest", (0, 0.10, 1.25), (0.58, 0.47, 0.37), fur_light, "chest")
add_sphere("Shoulder_Mantle", (0, 0.05, 1.29), (0.68, 0.42, 0.34), fur, "chest")
add_sphere("Neck_Mass", (0, 0.24, 1.39), (0.32, 0.32, 0.28), fur, "neck")

# Head, brow, muzzle, jaw and facial details.
add_sphere("Head_Skull", (0, 0.38, 1.50), (0.36, 0.34, 0.34), fur, "head")
add_sphere("Heavy_Brow", (0, 0.62, 1.58), (0.34, 0.18, 0.13), fur_light, "head")
add_sphere("Face_Plane", (0, 0.63, 1.48), (0.29, 0.16, 0.23), face, "head")
add_sphere("Muzzle", (0, 0.75, 1.42), (0.23, 0.17, 0.14), muzzle, "head")
add_sphere("Lower_Jaw", (0, 0.65, 1.31), (0.22, 0.16, 0.11), face, "jaw")
add_sphere("Nose", (0, 0.89, 1.47), (0.13, 0.07, 0.08), muzzle, "head")
for side in (-1, 1):
    add_sphere("Nostril", (side * 0.075, 0.946, 1.48), (0.035, 0.022, 0.025), pupil, "head", segments=16, rings=12)
    add_sphere("EyeSocket", (side * 0.18, 0.68, 1.57), (0.09, 0.055, 0.075), muzzle, "head")
    add_sphere("AmberEye", (side * 0.18, 0.725, 1.57), (0.047, 0.028, 0.047), eye, "head", segments=16, rings=12)
    add_sphere("EyePupil", (side * 0.18, 0.749, 1.57), (0.018, 0.012, 0.03), pupil, "head", segments=12, rings=8)
    add_sphere("Ear", (side * 0.36, 0.34, 1.49), (0.11, 0.10, 0.14), face, "head")
    add_sphere("Tusk", (side * 0.13, 0.77, 1.30), (0.035, 0.05, 0.10), ivory, "jaw", segments=12, rings=8)

# Long muscular arms and broad knuckle hands.
for side, suffix in ((-1, "L"), (1, "R")):
    add_sphere("Shoulder_Joint_" + suffix, (side * 0.45, 0.08, 1.17),
        (0.28, 0.31, 0.30), fur_light, "shoulder." + suffix)
    add_limb("Upper_Arm_" + suffix, (side * 0.47, 0.18, 1.10),
        (side * 0.58, 0.48, 0.72), 0.23, fur, "upperarm." + suffix)
    add_sphere("Elbow_" + suffix, (side * 0.58, 0.48, 0.72),
        (0.21, 0.23, 0.21), fur_light, "forearm." + suffix)
    add_limb("Long_Forearm_" + suffix, (side * 0.58, 0.49, 0.72),
        (side * 0.62, 0.76, 0.30), 0.19, fur, "forearm." + suffix)
    add_sphere("Knuckle_Hand_" + suffix, (side * 0.62, 0.88, 0.18),
        (0.23, 0.24, 0.14), face, "hand." + suffix)
    for digit in range(4):
        dx = (digit - 1.5) * 0.095
        add_sphere("Knuckle_" + suffix + "_" + str(digit),
            (side * 0.62 + dx, 1.02, 0.12), (0.06, 0.10, 0.055),
            muzzle, "hand." + suffix, segments=12, rings=8)

    # Short powerful hind legs, heel and broad feet.
    add_sphere("Hip_" + suffix, (side * 0.24, -0.22, 0.78),
        (0.27, 0.31, 0.29), fur, "thigh." + suffix)
    add_limb("Thigh_" + suffix, (side * 0.24, -0.23, 0.78),
        (side * 0.28, -0.37, 0.46), 0.19, fur_light, "thigh." + suffix)
    add_sphere("Knee_" + suffix, (side * 0.28, -0.37, 0.44),
        (0.18, 0.19, 0.18), fur, "shin." + suffix)
    add_limb("Shin_" + suffix, (side * 0.28, -0.38, 0.44),
        (side * 0.28, -0.49, 0.16), 0.15, fur, "shin." + suffix)
    add_sphere("Foot_" + suffix, (side * 0.28, -0.61, 0.12),
        (0.19, 0.28, 0.12), face, "foot." + suffix)

# Join all skinned parts into one renderer while preserving per-bone vertex groups/material slots.
bpy.ops.object.select_all(action="DESELECT")
for obj in mesh_parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = mesh_parts[0]
bpy.ops.object.join()
body_mesh = bpy.context.object
body_mesh.name = "Guardian_Ape_Mesh"

# Author in-place procedural actions for the Generic rig.
def reset_pose():
    for pose_bone in armature.pose.bones:
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = (0.0, 0.0, 0.0)
        pose_bone.location = (0.0, 0.0, 0.0)

def create_action(name, frames, pose_callback, loop=False):
    action = bpy.data.actions.new(name)
    armature.animation_data_create()
    armature.animation_data.action = action
    for frame in frames:
        bpy.context.scene.frame_set(frame)
        reset_pose()
        pose_callback(frame)
        for pose_bone in armature.pose.bones:
            pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=pose_bone.name)
            if pose_bone.name == "pelvis":
                pose_bone.keyframe_insert(data_path="location", frame=frame, group=pose_bone.name)
    action.frame_range = (frames[0], frames[-1])
    if loop:
        for curve in action.fcurves:
            curve.modifiers.new("CYCLES")
    return action

def idle_pose(frame):
    phase = (frame - 1) / 60.0 * math.tau
    armature.pose.bones["chest"].rotation_euler[0] = math.sin(phase) * 0.025
    armature.pose.bones["head"].rotation_euler[1] = math.sin(phase * 0.5) * 0.018
    armature.pose.bones["pelvis"].location.z = abs(math.sin(phase)) * 0.012

def run_pose(frame):
    phase = (frame - 1) / 32.0 * math.tau
    swing = math.sin(phase)
    for suffix, sign in (("L", 1), ("R", -1)):
        armature.pose.bones["upperarm." + suffix].rotation_euler[0] = swing * sign * 0.38
        armature.pose.bones["forearm." + suffix].rotation_euler[0] = 0.18 + max(0.0, swing * sign) * 0.22
        armature.pose.bones["thigh." + suffix].rotation_euler[0] = -swing * sign * 0.20
        armature.pose.bones["shin." + suffix].rotation_euler[0] = max(0.0, swing * sign) * 0.16
    armature.pose.bones["chest"].rotation_euler[1] = swing * 0.035
    armature.pose.bones["pelvis"].location.z = abs(math.sin(phase * 2.0)) * 0.035

def roar_pose(frame):
    t = (frame - 1) / 24.0
    intensity = math.sin(math.pi * t)
    armature.pose.bones["chest"].rotation_euler[0] = -0.22 * intensity
    armature.pose.bones["head"].rotation_euler[0] = -0.28 * intensity
    armature.pose.bones["jaw"].rotation_euler[0] = 0.55 * intensity
    for suffix, sign in (("L", 1), ("R", -1)):
        armature.pose.bones["upperarm." + suffix].rotation_euler[1] = sign * 0.40 * intensity
        armature.pose.bones["forearm." + suffix].rotation_euler[0] = -0.25 * intensity

def catch_pose(frame):
    t = (frame - 1) / 20.0
    intensity = math.sin(math.pi * t)
    armature.pose.bones["chest"].rotation_euler[0] = 0.30 * intensity
    armature.pose.bones["head"].rotation_euler[0] = 0.18 * intensity
    for suffix in ("L", "R"):
        armature.pose.bones["upperarm." + suffix].rotation_euler[0] = -0.65 * intensity
        armature.pose.bones["forearm." + suffix].rotation_euler[0] = -0.45 * intensity

def fall_pose(frame):
    t = (frame - 1) / 30.0
    intensity = math.sin(math.pi * t)
    armature.pose.bones["pelvis"].rotation_euler[0] = 0.55 * intensity
    armature.pose.bones["chest"].rotation_euler[0] = -0.45 * intensity
    armature.pose.bones["head"].rotation_euler[1] = 0.35 * intensity
    for suffix, sign in (("L", 1), ("R", -1)):
        armature.pose.bones["upperarm." + suffix].rotation_euler[1] = sign * 0.55 * intensity
        armature.pose.bones["thigh." + suffix].rotation_euler[0] = -0.25 * intensity

bpy.context.view_layer.objects.active = armature
bpy.ops.object.mode_set(mode="POSE")
create_action("Guardian_Idle", [1, 30, 60], idle_pose, loop=True)
create_action("Guardian_Run", [1, 9, 17, 25, 33], run_pose, loop=True)
create_action("Guardian_Roar", [1, 8, 16, 24], roar_pose)
create_action("Guardian_Catch", [1, 7, 14, 20], catch_pose)
create_action("Guardian_Fall", [1, 10, 20, 30], fall_pose)
bpy.ops.object.mode_set(mode="OBJECT")

# Export one skinned mesh, one armature and all five actions.
bpy.ops.object.select_all(action="DESELECT")
armature.select_set(True)
body_mesh.select_set(True)
bpy.context.view_layer.objects.active = armature

fbx_operator = bpy.ops.export_scene.fbx
available = {prop.identifier for prop in fbx_operator.get_rna_type().properties}
fbx_options = {
    "filepath": OUTPUT_FBX,
    "use_selection": True,
    "object_types": {"ARMATURE", "MESH"},
    "apply_unit_scale": True,
    "axis_forward": "-Z",
    "axis_up": "Y",
    "add_leaf_bones": False,
    "bake_anim": True,
    "bake_anim_use_all_actions": True,
    "bake_anim_use_nla_strips": False,
    "bake_anim_simplify_factor": 0.0,
    "path_mode": "COPY",
    "embed_textures": True
}
fbx_operator(**{key: value for key, value in fbx_options.items() if key in available})

with open(os.path.join(OUTPUT_DIR, "Guardian_Ape_SOURCE.txt"), "w", encoding="utf-8") as file:
    file.write("Original procedural dark-furred temple ape created for Jungle Escape.\n")
    file.write("Mesh, Generic armature and Idle/Run/Roar/Catch/Fall actions are generated by prepare_gorilla.py.\n")
    file.write("No third-party mesh, texture, rig or animation is included.\n")

print("Exported rigged Guardian_Ape.fbx with Idle, Run, Roar, Catch and Fall actions.")
