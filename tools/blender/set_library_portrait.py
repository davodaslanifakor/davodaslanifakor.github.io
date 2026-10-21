"""Put David's supplied portrait inside the existing shelf frame, then save.

Run on the reference-restyle/room-light-dark.blend checkpoint, then export:room.
The full square image sits inside the portrait paper with a cream mat.
"""
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT = ROOT / 'tools/blender/review/reference-restyle/room-light-dark.blend'
assert Path(bpy.data.filepath).resolve() == CHECKPOINT.resolve()
scene = bpy.data.scenes['Room Light']
paper = scene.objects['static_style_art_paper']
mountains = scene.objects.get('static_style_art_mountains')
if mountains:
    mountains.hide_render = True
    mountains.hide_viewport = True
old = bpy.data.objects.get('static_style_art_portrait')
if old:
    bpy.data.objects.remove(old, do_unlink=True)

# Front of the paper faces Blender -Y. Keep the whole image, without stretching.
x, y, z = paper.matrix_world.translation
half = .0695
mesh = bpy.data.meshes.new('library_portrait_plane')
mesh.from_pydata([(x-half, y-.0012, z-half), (x+half, y-.0012, z-half),
                 (x+half, y-.0012, z+half), (x-half, y-.0012, z+half)], [], [(0, 1, 2, 3)])
uv = mesh.uv_layers.new(name='UVMap')
for loop, coord in zip(mesh.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
    uv.data[loop.index].uv = coord
portrait = bpy.data.objects.new('static_style_art_portrait', mesh)
for collection in paper.users_collection:
    collection.objects.link(portrait)
material = bpy.data.materials.get('library_portrait') or bpy.data.materials.new('library_portrait')
material.use_nodes = True
nodes = material.node_tree.nodes
nodes.clear()
output = nodes.new('ShaderNodeOutputMaterial')
shader = nodes.new('ShaderNodeBsdfPrincipled')
shader.inputs['Roughness'].default_value = 1
image = bpy.data.images.load(str(ROOT / 'tools/blender/assets/library-portrait.jpeg'), check_existing=True)
image.pack()
texture = nodes.new('ShaderNodeTexImage')
texture.image = image
texture.interpolation = 'Closest'
material.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])
material.node_tree.links.new(shader.outputs['BSDF'], output.inputs['Surface'])
mesh.materials.append(material)
# A task backup is retained before running this script; preserve existing .blend1.
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(CHECKPOINT))
print('LIBRARY_PORTRAIT_SAVED', portrait.name)
