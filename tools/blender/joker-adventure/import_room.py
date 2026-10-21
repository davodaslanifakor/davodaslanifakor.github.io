"""Start a separate prototype scene from the website's exported geometry."""
import bpy
from pathlib import Path

root=Path(__file__).resolve().parents[3]
assert 'Joker Adventure Blockout' not in bpy.data.scenes, 'Use a fresh Blender process'
scene=bpy.data.scenes.new('Joker Adventure Blockout')
bpy.context.window.scene=scene
bpy.ops.import_scene.gltf(filepath=str(root/'public/models/room.glb'))
bpy.context.view_layer.update()
print('Imported production geometry into isolated prototype scene')
