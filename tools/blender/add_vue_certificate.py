"""Add the real Vue certificate as a freestanding frame below the shelf portrait.

Run against reference-restyle/room-light-dark.blend, then run pnpm export:room.
The original certificate artwork is shared with the website's readable preview.
"""
from pathlib import Path
import json
import math

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT = ROOT / 'tools/blender/review/reference-restyle/room-light-dark.blend'
assert Path(bpy.data.filepath).resolve() == CHECKPOINT.resolve()
scene = bpy.data.scenes['Room Light']
bpy.context.window.scene = scene

# Retain the published framing exactly. Without explicit targets, the exporter
# can pick either a root or its interaction mesh while iterating an unordered set.
report = json.loads((ROOT / 'tools/blender/review/website-export.json').read_text())
for focus in report['cameraFocus']:
    name = 'target_' + focus['name'][4:]
    if name == 'target_certificate' or scene.objects.get(name):
        continue
    target = bpy.data.objects.new(name, None)
    scene.collection.objects.link(target)
    x, y, z = focus['target']
    target.location = (x, -z, y)

# Re-running replaces only this frame and its focus helpers.
old = bpy.data.objects.get('root_certificate')
if old:
    for child in list(old.children_recursive):
        bpy.data.objects.remove(child, do_unlink=True)
    bpy.data.objects.remove(old, do_unlink=True)
for name in ('cam_certificate', 'target_certificate'):
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)

collection = bpy.data.collections.get('Library Certificate')
if not collection:
    collection = bpy.data.collections.new('Library Certificate')
for room in bpy.data.scenes:
    if room.name in ('Room Light', 'Room Dark') and collection.name not in room.collection.children:
        room.collection.children.link(collection)


def finish(name, rgb, roughness, metallic=0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    linear = tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*linear, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    material.diffuse_color = (*linear, 1)
    return material


root = bpy.data.objects.new('root_certificate', None)
collection.objects.link(root)
tilt, width, height, depth = math.radians(6), .316, .240, .018
root.location = (1.65, .13, .442 + height / 2 * math.cos(tilt) + depth / 2 * math.sin(tilt))
root.rotation_euler.x = -tilt
charcoal = finish('certificate_frame_charcoal', (.13, .15, .15), .42)
mat = finish('certificate_warm_mat', (.92, .90, .84), .94)
brass = finish('certificate_inner_lip', (.47, .43, .32), .4, .5)


def box(name, size, position, material, bevel=0):
    x, y, z = (value / 2 for value in size)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(-x,-y,-z), (x,-y,-z), (x,y,-z), (-x,y,-z),
                     (-x,-y,z), (x,-y,z), (x,y,z), (-x,y,z)], [],
                    [(3,2,1,0), (4,5,6,7), (1,5,4,0), (2,6,5,1), (3,7,6,2), (0,4,7,3)])
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.parent = root
    obj.location = position
    mesh.materials.append(material)
    if bevel:
        modifier = obj.modifiers.new('Soft frame edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 3
    return obj


box('int_certificate__1', (width, depth, height), (0, 0, 0), charcoal, .0015)
box('int_certificate__2', (.299, .003, .223), (0, -.010, 0), mat, .0005)

image = bpy.data.images.load(str(ROOT / 'public/images/vue-certificate.jpg'), check_existing=True)
image.pack()
art_width = .276
art_height = art_width * image.size[1] / image.size[0]
for side in (-1, 1):
    box(f'int_certificate__{3 if side < 0 else 4}', (art_width + .003, .001, .0015),
        (0, -.012, side * (art_height + .0015) / 2), brass)
    box(f'int_certificate__{5 if side < 0 else 6}', (.0015, .001, art_height),
        (side * (art_width + .0015) / 2, -.012, 0), brass)

mesh = bpy.data.meshes.new('certificate_artwork_plane')
x, z = art_width / 2, art_height / 2
mesh.from_pydata([(-x, -.0126, -z), (x, -.0126, -z), (x, -.0126, z), (-x, -.0126, z)], [], [(0,1,2,3)])
uv = mesh.uv_layers.new(name='UVMap')
for loop, coord in zip(mesh.loops, [(0,0), (1,0), (1,1), (0,1)]):
    uv.data[loop.index].uv = coord
artwork = bpy.data.objects.new('int_certificate', mesh)
collection.objects.link(artwork)
artwork.parent = root
paper = finish('certificate_artwork', (1,1,1), .88)
shader = paper.node_tree.nodes.get('Principled BSDF')
texture = next((n for n in paper.node_tree.nodes if n.type == 'TEX_IMAGE'), None) or paper.node_tree.nodes.new('ShaderNodeTexImage')
texture.image = image
texture.interpolation = 'Linear'
paper.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])
mesh.materials.append(paper)

bpy.context.view_layer.update()
target = bpy.data.objects.new('target_certificate', None)
collection.objects.link(target)
target.location = root.matrix_world @ Vector((0, -.013, 0))
camera = bpy.data.objects.new('cam_certificate', None)
collection.objects.link(camera)
camera.location = target.location + Vector((.01, -.78, .08))
camera.rotation_euler = (target.location - camera.location).to_track_quat('-Z', 'Y').to_euler()

# The source checkpoint was backed up before this task; keep existing .blend1 files.
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(CHECKPOINT))
print('VUE_CERTIFICATE_FRAME_SAVED', tuple(root.location), tuple(image.size))
