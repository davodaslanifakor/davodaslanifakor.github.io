"""Pack an optimized Poly Haven Potted Plant 02 miniature into a reusable .blend.

Run with Blender after downloading the official 1K glTF and its dependencies:
  Blender --background --python tools/blender/make_plant_asset.py -- <source.gltf> <leaves_rgba.png> <pot_diff.jpg>
"""

import os
import sys

import bpy


ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUT = os.path.join(ROOT, "tools", "blender", "assets", "potted_plant_02.blend")
args = sys.argv[sys.argv.index("--") + 1:]
if len(args) != 3:
    raise SystemExit("Expected source glTF, packed leaf color/alpha PNG, and pot color JPEG")
source_gltf, leaf_image_path, pot_image_path = args

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source_gltf)

source_names = ("potted_plant_02_pot", "potted_plant_02_leaves", "potted_plant_02_dirt")
objects = {name: bpy.data.objects.get(name) for name in source_names}
if any(obj is None or obj.type != "MESH" for obj in objects.values()):
    raise RuntimeError("The official Potted Plant 02 mesh parts were not imported")

for source_name, ratio in (("potted_plant_02_pot", 0.15),
                           ("potted_plant_02_leaves", 0.30),
                           ("potted_plant_02_dirt", 0.02)):
    obj = objects[source_name]
    decimate = obj.modifiers.new("miniature_mesh_budget", "DECIMATE")
    decimate.ratio = ratio
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=decimate.name)


def textured(name, path, roughness, transparent=False):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.use_backface_culling = False
    material.diffuse_color = (1, 1, 1, 1)
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Roughness"].default_value = roughness
    image = bpy.data.images.load(path, check_existing=False)
    image.name = f"{name}_packed_color"
    image.pack()
    texture = material.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = image
    material.node_tree.links.new(texture.outputs["Color"], principled.inputs["Base Color"])
    if transparent:
        material.surface_render_method = "DITHERED"
        material.node_tree.links.new(texture.outputs["Alpha"], principled.inputs["Alpha"])
    return material


pot = textured("potted_plant_02_pot_miniature", pot_image_path, 0.82)
leaves = textured("potted_plant_02_leaves_miniature", leaf_image_path, 0.74, transparent=True)
for name, material in (("potted_plant_02_pot", pot),
                       ("potted_plant_02_leaves", leaves),
                       ("potted_plant_02_dirt", pot)):
    obj = objects[name]
    obj.data.materials.clear()
    obj.data.materials.append(material)

collection = bpy.data.collections.new("potted_plant_02")
bpy.context.scene.collection.children.link(collection)
root = bpy.data.objects.new("root_display_plant", None)
root.location = (1.44245, -0.49473, 1.322)
root.scale = (0.27, 0.27, 0.27)
root["asset_source"] = "https://polyhaven.com/a/potted_plant_02"
root["asset_license"] = "CC0"
root["asset_author"] = "Rico Cilliers"
root["asset_original_height_m"] = 0.8
collection.objects.link(root)

for name, obj in objects.items():
    for old_collection in tuple(obj.users_collection):
        old_collection.objects.unlink(obj)
    collection.objects.link(obj)
    obj.parent = root
    obj.name = name.replace("potted_plant_02_", "static_potted_plant_")
    obj["asset_source"] = root["asset_source"]
    obj["asset_license"] = "CC0"
    print(obj.name, len(obj.data.polygons), "faces")

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=OUTPUT)
print("SAVED", OUTPUT)
