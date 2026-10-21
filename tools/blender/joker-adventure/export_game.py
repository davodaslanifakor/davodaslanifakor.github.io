"""Export only the adventure props/rig and authored transitions, never the whole room."""
import bpy
import json
import struct
from pathlib import Path

root=Path(__file__).resolve().parents[3]
scene=bpy.data.scenes['Joker Adventure Blockout']
bpy.context.window.scene=scene
scene.frame_set(1)
objects=set(o for o in scene.objects if o.name.startswith('JA_')
            and o.type not in {'CAMERA','LIGHT'} and not o.name.startswith('JA_BreakableBrick_'))
phone=scene.objects['root_phone']
objects.update([phone,*phone.children_recursive])
objects.update(o for o in scene.objects if o.name.startswith('static_phone_stand'))
# Curve cracks must be visible when geometry is exported; runtime owns visibility.
for obj in objects:
    obj.hide_set(False);obj.hide_viewport=False;obj.hide_render=False
    if obj.animation_data:
        action=obj.animation_data.action
        if action:
            for layer in action.layers:
                for strip in layer.strips:
                    for bag in strip.channelbags:
                        for curve in list(bag.fcurves):
                            if curve.data_path in {'hide_render','hide_viewport'}:
                                bag.fcurves.remove(curve)
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:obj.select_set(True)
output=root/'public/models/joker-adventure.glb'
bpy.ops.export_scene.gltf(filepath=str(output),use_selection=True,export_format='GLB',
                         export_animations=True,export_animation_mode='SCENE',
                         export_frame_range=True,export_frame_step=2,
                         export_optimize_animation_size=True,
                         export_draco_mesh_compression_enable=True,
                         export_draco_mesh_compression_level=6,export_cameras=False,export_lights=False)
data=output.read_bytes();length=struct.unpack_from('<I',data,12)[0]
doc=json.loads(data[20:20+length])
assert len(data)<1_500_000, 'Adventure asset budget exceeded'
assert len(data)+(root/'public/models/room.glb').stat().st_size<3_000_000, 'Combined geometry budget exceeded'
assert doc.get('animations'), 'Missing transition animation'
print('GAME_EXPORT',len(data),'bytes',len(doc['nodes']),'nodes',len(doc['animations']),'clips')
