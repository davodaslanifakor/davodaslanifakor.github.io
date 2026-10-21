"""Background-only exports of the saved prototype. Never saves or changes the source blend."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/renders/joker-adventure'
OUT.mkdir(parents=True,exist_ok=True)
scene=bpy.data.scenes['Joker Adventure Blockout']
bpy.context.window.scene=scene
scene.render.image_settings.file_format='PNG'
scene.render.resolution_x=1280
scene.render.resolution_y=800
scene.render.resolution_percentage=100
# The scene uses its existing EEVEE engine; Blender owns its supported identifier.
if hasattr(scene,'eevee'):
    scene.eevee.taa_render_samples=64
camera_markers=[(m,m.camera) for m in scene.timeline_markers]
for marker,_ in camera_markers:
    marker.camera=None
shots=[('garage',270,'JA_Camera_CarDetail'),('cockpit',555,'JA_Camera_Cockpit'),
       ('jump',578,'JA_Camera_Jump'),('room-route',526,'JA_Camera_Overview')]
if 'JA_Camera_PhoneCrash' in scene.objects:
    shots.append(('phone-crash',744,'JA_Camera_PhoneCrash'))
for name,frame,cam in shots:
    scene.frame_set(frame)
    scene.camera=scene.objects[cam]
    scene.render.filepath=str(OUT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
for marker,cam in camera_markers:
    marker.camera=cam

# Measured checks on authored contacts/clearance, not a claim of physics simulation.
report={'scene':scene.name,'frames':scene.frame_end,'fps':24,'checks':[],'scope':'Blender animatic, not browser gameplay'}
def check(name,condition,details):
    report['checks'].append({'name':name,'passed':bool(condition),'details':details})
    assert condition,(name,details)
car=scene.objects['JA_Car']
scene.frame_set(340)
check('garage tire contact',abs(car.location.z-.056)<.001,round(car.location.z,5))
for f in (390,410,450,490):
    scene.frame_set(f)
    # Car and elevator use matching Bezier timing between the same endpoints.
    error=car.location.z-(scene.objects['JA_Lift'].location.z+.006)
    check('lift contact '+str(f),abs(error)<.001,round(error,6))
scene.frame_set(610)
check('landing inside pad',.525<car.location.x<.775 and abs(car.location.y+.245)<.04, list(car.location))
check('landing tire height',abs(car.location.z-.756)<.002,round(car.location.z,5))
scene.frame_set(340)
eye=scene.objects['JA_Camera_Cockpit'].matrix_world.translation
check('eye above dashboard',eye.z>car.location.z+.058,list(eye))
check('door opens outside shelf',scene.objects['JA_GarageDoor'].matrix_world.translation.y+.005<-.075,scene.objects['JA_GarageDoor'].matrix_world.translation.y)
for n in ('JA_Car','JA_Joker','JA_GarageDoor','JA_Lift','JA_RampHinge','JA_Camera_Enter'):
    check('animated '+n,scene.objects[n].animation_data is not None,n)
check('no source model overwrite',Path(bpy.data.filepath).name=='joker-adventure.blend',bpy.data.filepath)
if 'JA_PhoneCracks' in scene.objects:
    phone=scene.objects['root_phone']
    cracks=[o for o in scene.objects if o.name.startswith('JA_PhoneCrack_')]
    shards=[o for o in scene.objects if o.name.startswith('JA_PhoneShard_')]
    for frame in (1,650,691):
        scene.frame_set(frame)
        check('no cracks before impact '+str(frame),all(o.hide_render for o in cracks),len(cracks))
    scene.frame_set(654)
    bumper=scene.objects['JA_Car_bumper']
    edge=min((bumper.matrix_world@Vector(p)).x for p in bumper.bound_box)
    check('bumper reaches stand',abs(edge-.45852)<.015,edge)
    scene.frame_set(744)
    check('cracks visible after impact',all(not o.hide_render for o in cracks),len(cracks))
    check('glass pieces visible',all(not o.hide_render for o in shards),len(shards))
    normal=phone.matrix_world.to_quaternion()@Vector((0,0,1))
    check('phone settles screen up',normal.z>.99,normal.z)
    housing=scene.objects['int_phone']
    bottom=min((housing.matrix_world@Vector(p)).z for p in housing.bound_box)
    check('phone rests on desk',.752<bottom<.757,bottom)
    scene.frame_set(1)
    check('replay restores phone',abs(phone.location.z-.823)<.001 and abs(phone.rotation_euler.x-math.radians(65))<.001,list(phone.location))
    check('replay hides all damage',all(o.hide_render for o in cracks+shards),len(cracks+shards))
(OUT/'validation.json').write_text(json.dumps(report,indent=2))
print('STUDY_VALIDATION',json.dumps(report))

# Small 24 fps animatic for reviewing the route and camera timing.
scene.render.resolution_x=640
scene.render.resolution_y=400
if hasattr(scene,'eevee'):
    scene.eevee.taa_render_samples=8
frames=OUT/'frames'
frames.mkdir(exist_ok=True)
for index,frame in enumerate(range(1,scene.frame_end+1)):
    scene.frame_set(frame)
    # Explicit marker resolution makes the export independent of previous still-camera overrides.
    marker=max((m for m in scene.timeline_markers if m.camera and m.frame<=frame),key=lambda m:m.frame)
    scene.camera=marker.camera
    scene.render.filepath=str(frames/f'{index:04d}.png')
    bpy.ops.render.render(write_still=True)
print('STUDY_FRAMES_COMPLETE')
