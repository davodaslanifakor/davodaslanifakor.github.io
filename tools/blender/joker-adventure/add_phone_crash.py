"""Append a reversible phone-crash ending to the isolated Blender animatic.

Run after finish_blockout.py, or pass this source to the live Blender connector.
No production room mesh or website interaction is changed.
"""
import bpy
import math
import random
from mathutils import Vector, Matrix

s=bpy.context.scene
assert s.name=='Joker Adventure Blockout'
assert 'JA_PhoneCracks' not in s.objects, 'Phone ending already installed'
s.frame_set(610)
s.frame_end=816
collection=bpy.data.collections['JA | Garage, car and traversal study']
car=s.objects['JA_Car']
actor=s.objects['JA_Joker']
phone=s.objects['root_phone']
phone.rotation_mode='XYZ'
phone_start=phone.location.copy()
phone_rotation=phone.rotation_euler.copy()

def empty(name,position=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None)
    collection.objects.link(o)
    o.parent=parent;o.location=position;o.empty_display_size=.01
    return o

def key(o,f,position=None,rotation=None):
    if position is not None:
        o.location=position;o.keyframe_insert(data_path='location',frame=f)
    if rotation is not None:
        o.rotation_euler=rotation;o.keyframe_insert(data_path='rotation_euler',frame=f)

def visibility(o,events):
    for frame,visible in events:
        o.hide_render=not visible;o.hide_viewport=not visible
        o.keyframe_insert(data_path='hide_render',frame=frame)
        o.keyframe_insert(data_path='hide_viewport',frame=frame)

def material(name,color,emission=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    bsdf=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value=(*color,1)
    bsdf.inputs['Roughness'].default_value=.3
    if emission:
        bsdf.inputs['Emission Color'].default_value=(*color,1)
        bsdf.inputs['Emission Strength'].default_value=emission
    return m

def line(name,points,radius,mat,parent):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D'
    data.bevel_depth=radius;data.bevel_resolution=1
    spline=data.splines.new('POLY');spline.points.add(len(points)-1)
    for p,v in zip(spline.points,points):p.co=(*v,1)
    obj=bpy.data.objects.new(name,data);collection.objects.link(obj)
    obj.parent=parent;data.materials.append(mat)
    return obj

# Replace only the old final driving segment, keeping the library route and jump.
for obj in (car,actor):
    for frame in (650,720):
        for path in ('location','rotation_euler'):
            obj.keyframe_delete(data_path=path,frame=frame)
for o in s.objects:
    if o.name.startswith('JA_BreakableBrick_'):
        o.hide_render=True;o.hide_set(True)

path=[(610,(.635,-.245,.756),-math.pi/2),
      (630,(.604,-.217,.756),-1.34),
      (644,(.560,-.194,.754),-1.48),
      (650,(.541,-.189,.754),-math.pi/2),
      (654,(.533,-.189,.754),-math.pi/2),
      (660,(.545,-.189,.754),-1.62),
      (675,(.588,-.194,.754),-1.65),
      (700,(.602,-.197,.754),-1.65),
      (816,(.602,-.197,.754),-1.65)]
for f,p,a in path:key(car,f,p,(0,0,a))
body=s.objects['JA_CarBody']
for f,z,pitch in [(610,0,0),(650,0,0),(655,-.003,.13),(661,.002,-.075),(673,0,0),(816,0,0)]:
    key(body,f,(0,0,z),(pitch,0,0))
# Keep Joker seated through the skid and recoil, with body-weight reaction.
for frame in range(610,817,2):
    s.frame_set(frame)
    yaw=car.rotation_euler.z
    offset=Matrix.Rotation(yaw,4,'Z')@Vector((0,.020,.025+body.location.z))
    key(actor,frame,car.location+offset,(body.rotation_euler.x*.6,0,yaw))
for name in ('JA_Joker_shoulder_l','JA_Joker_shoulder_r'):
    arm=s.objects[name]
    for f,a in [(645,-.75),(657,-1.05),(675,-.75),(721,-.75),(743,-1.25),(775,-.75),(816,-.75)]:
        key(arm,f,rotation=(a,0,0))
for o in s.objects:
    if o.name.startswith('JA_WheelSpin_'):
        for frame in (650,720):o.keyframe_delete(data_path='rotation_euler',frame=frame)
        for f,a in [(610,-59),(650,-64.8),(654,-65.2),(675,-62.2),(700,-61.4),(816,-61.4)]:
            key(o,f,rotation=(a,0,0))
    if o.name.startswith('JA_WheelSteer_') and o.name.endswith('_-1'):
        for f,a in [(610,-.24),(633,-.24),(650,0),(654,0),(660,.12),(700,0),(816,0)]:
            key(o,f,rotation=(0,0,a))

# Actual phone geometry topples, bounces and settles face-up on the desktop.
for f,p,rx,rz in [
    (1,phone_start,65,-13),(650,phone_start,65,-13),(654,phone_start,65,-13),
    (663,(.392,-.176,.846),57,-24),(674,(.363,-.153,.841),36,-39),
    (685,(.324,-.126,.804),16,-57),(692,(.302,-.116,.7541),0,-65),
    (699,(.291,-.111,.773),-4,-68),(711,(.280,-.108,.7541),0,-70),
    (722,(.276,-.107,.7541),0,-70),(816,(.276,-.107,.7541),0,-70),
]:key(phone,f,p,(math.radians(rx),0,math.radians(rz)))

# Stand skids on impact. The support detaches instead of bending as a solid block.
s.frame_set(1)
stand=empty('JA_PhoneStandImpact',(.405,-.185,.754))
for name in ('static_phone_stand','static_phone_stand_lip'):
    o=s.objects[name];world=o.matrix_world.copy();o.parent=stand;o.matrix_world=world
for f,p,a in [(1,(.405,-.185,.754),0),(654,(.405,-.185,.754),0),
              (666,(.382,-.181,.754),.14),(683,(.372,-.179,.754),.21),(816,(.372,-.179,.754),.21)]:
    key(stand,f,p,(0,0,a))
support=s.objects['static_phone_stand_back']
support_pivot=empty('JA_PhoneSupportBreak',(.405,-.185,.790))
world=support.matrix_world.copy();support.parent=support_pivot;support.matrix_world=world
for f,p,r in [(1,(.405,-.185,.790),(0,0,0)),(654,(.405,-.185,.790),(0,0,0)),
              (670,(.390,-.125,.840),(0,.7,-.2)),(685,(.396,-.07,.808),(0,1.45,-.35)),
              (711,(.399,-.056,.78),(0,1.57,-.35)),(816,(.399,-.056,.78),(0,1.57,-.35))]:
    key(support_pivot,f,p,r)
    if f>=711:
        bpy.context.view_layer.update()
        bottom=min((support.matrix_world@Vector(v)).z for v in support.bound_box)
        support_pivot.location.z+=.754-bottom
        support_pivot.keyframe_insert(data_path='location',frame=f)

# Crack paths lie just above the original screen's local z=0.0081 plane.
cracks=empty('JA_PhoneCracks',parent=phone)
glass=material('JA_FracturedGlass',(.62,.83,.87),.14)
dead=material('JA_DeadPixels',(.07,.65,.34),.7)
black=material('JA_ExposedScreenCorner',(.003,.008,.011))
paths=[[(.023,-.042),(.011,-.029),(-.006,-.007),(-.023,.018),(-.032,.055)],
       [(.023,-.042),(.014,-.012),(.024,.014),(.011,.039),(.018,.068)],
       [(.023,-.042),(-.001,-.043),(-.014,-.057),(-.031,-.066)],
       [(.023,-.042),(.029,-.019),(.032,.003)],
       [(.023,-.042),(.019,-.057),(.027,-.071)],
       [(.011,-.029),(-.012,-.030),(-.031,-.022)],
       [(-.006,-.007),(-.023,-.006),(-.032,.008)],
       [(.024,.014),(.006,.021),(-.006,.044),(-.025,.070)],
       [(.011,.039),(.031,.050)],
       [(-.023,.018),(-.008,.031),(.006,.021)],
       [(.014,-.012),(.011,-.029),(-.001,-.043)],
       [(.019,-.057),(.004,-.059),(-.014,-.057)]]
for i,points in enumerate(paths):
    obj=line('JA_PhoneCrack_'+str(i),[(x,y,.00865) for x,y in points],.00022 if i<5 else .00013,glass,cracks)
    visibility(obj,[(1,False),(691,False),(692,True),(816,True)])
for i,x in enumerate((-.017,.005)):
    obj=line('JA_PhoneDeadColumn_'+str(i),[(x,-.068,.0085),(x,.068,.0085)],.00016,dead,phone)
    visibility(obj,[(1,False),(691,False),(692,True),(695,False),(697,True),(700,False),(702,True),(816,True)])
mesh=bpy.data.meshes.new('JA_ScreenCornerChip')
mesh.from_pydata([(.022,-.042,.0088),(.033,-.040,.0088),(.033,-.065,.0088)],[],[(0,1,2)])
chip=bpy.data.objects.new('JA_ScreenCornerChip',mesh);collection.objects.link(chip);chip.parent=phone;mesh.materials.append(black)
visibility(chip,[(1,False),(691,False),(692,True),(816,True)])

# Six lightweight glass fragments arc out from the screen corner at the desk impact.
s.frame_set(692);bpy.context.view_layer.update()
origin=phone.matrix_world@Vector((.025,-.05,.009))
rng=random.Random(18)
for i in range(6):
    size=rng.uniform(.003,.006)
    mesh=bpy.data.meshes.new('JA_PhoneShardMesh_'+str(i))
    mesh.from_pydata([(-size,0,0),(size*.6,-size*.5,0),(size*.4,size,0),(-size,0,.0008),(size*.6,-size*.5,.0008),(size*.4,size,.0008)],[],[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)])
    mesh.materials.append(glass)
    obj=bpy.data.objects.new('JA_PhoneShard_'+str(i),mesh);collection.objects.link(obj)
    target=origin+Vector((rng.uniform(-.065,.025),rng.uniform(-.055,.060),0));target.z=.7548
    mid=(origin+target)/2;mid.z+=rng.uniform(.018,.042)
    for f,p,r in [(692,origin,(0,0,0)),(701,mid,(i*.4,i*.6,i*.8)),(719,target,(0,0,i*.8)),(816,target,(0,0,i*.8))]:key(obj,f,p,r)
    visibility(obj,[(1,False),(691,False),(692,True),(816,True)])

# A wide impact view preserves cause/effect; then linger on the broken phone and Joker.
data=bpy.data.cameras.new('JA_Camera_PhoneCrash')
cam=bpy.data.objects.new('JA_Camera_PhoneCrash',data);collection.objects.link(cam)
data.lens=43;data.clip_start=.002;data.clip_end=100
for f,eye,target,lens in [(612,(.84,-.64,1.08),(.43,-.17,.80),43),
                          (690,(.77,-.57,1.12),(.40,-.13,.79),43),
                          (742,(.73,-.57,1.12),(.43,-.15,.80),42),
                          (816,(.73,-.57,1.12),(.43,-.15,.80),42)]:
    rotation=(Vector(target)-Vector(eye)).to_track_quat('-Z','Y').to_euler()
    key(cam,f,eye,rotation)
    data.lens=lens;data.keyframe_insert(data_path='lens',frame=f)
marker=s.timeline_markers.new('08 PHONE CRASH',frame=612);marker.camera=cam
s.timeline_markers.new('BUMPER HITS STAND',frame=654)
s.timeline_markers.new('SCREEN BREAKS ON DESK',frame=692)
s['prototype_note']='34-second authored Blender animation; phone crash ending; not live collision gameplay.'
s['readme']='Play frames 1-816. Phone impact starts at 654, glass cracks at 692. Rewind to frame 1 to restore. No keyboard or monitor-cable action.'
s.frame_set(744);s.camera=cam
bpy.ops.wm.save_as_mainfile(filepath='/Users/davoudfakour/Documents/ChatGPT/Portfolio/tools/blender/joker-adventure/joker-adventure.blend')
print('Phone crash ending saved. Impact 654; fracture 692; end 816.')
