"""Polish and save the isolated study; run after build_blockout.py."""
import bpy
from mathutils import Vector

scene=bpy.context.scene
assert scene.name.startswith('Joker Adventure Blockout')
collection=bpy.data.collections['JA | Garage, car and traversal study']
actor=scene.objects['JA_Joker']
rope=scene.objects['JA_GrappleCable']
rope.animation_data_clear()
original_length=rope.dimensions.z
# The cylinder geometry was authored along local Z, before object rotation.
original_length=max(v.co.z for v in rope.data.vertices)-min(v.co.z for v in rope.data.vertices)
for frame in range(107,149):
    scene.frame_set(frame)
    start=actor.matrix_world@Vector((0,-.008,.041))
    end=Vector((1.165,-.13,1.12))
    rope.location=(start+end)/2
    rope.rotation_euler=(end-start).to_track_quat('Z','Y').to_euler()
    rope.scale=(1,1,(end-start).length/original_length)
    for path in ('location','rotation_euler','scale'):
        rope.keyframe_insert(data_path=path,frame=frame)
for frame,hidden in [(1,True),(107,True),(112,False),(146,False),(148,True),(720,True)]:
    rope.hide_render=hidden;rope.hide_viewport=hidden
    rope.keyframe_insert(data_path='hide_render',frame=frame)
    rope.keyframe_insert(data_path='hide_viewport',frame=frame)
lift=scene.objects['JA_Lift']
lift.animation_data_clear()
for frame,z in [(1,.05),(390,.05),(490,.94),(720,.94)]:
    lift.location=(1.345,-.245,z);lift.keyframe_insert(data_path='location',frame=frame)

data=bpy.data.cameras.new('JA_Camera_Traversal')
cam=bpy.data.objects.new('JA_Camera_Traversal',data)
collection.objects.link(cam);data.lens=36;data.clip_start=.002;data.clip_end=100
for frame in range(24,199,3):
    scene.frame_set(frame)
    target=actor.matrix_world.translation+Vector((0,0,.028))
    cam.location=target+Vector((-.16,-.27,.15))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.keyframe_insert(data_path='location',frame=frame)
    cam.keyframe_insert(data_path='rotation_euler',frame=frame)
marker=scene.timeline_markers.new('01b FOLLOW JOKER',frame=24);marker.camera=cam

# Fixed framing for study exports; timeline markers still drive animation playback.
scene.render.resolution_x=1440
scene.render.resolution_y=900
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.frame_set(270)
scene.camera=scene.objects['JA_Camera_CarDetail']
for area in (bpy.context.screen.areas if bpy.context.screen else []):
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.shading.type='MATERIAL'
scene['readme']='Blender blockout / animatic only. Play frames 1-720. Camera markers cut between traversal, reveal, entry, cockpit and landing. Read docs/JOKER_ADVENTURE_BLOCKOUT.md.'
bpy.ops.wm.save_as_mainfile(filepath='/Users/davoudfakour/Documents/ChatGPT/Portfolio/tools/blender/joker-adventure/joker-adventure.blend')
print('Saved isolated Joker adventure study.')
