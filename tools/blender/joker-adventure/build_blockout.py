"""Run in the imported-room prototype scene using Blender's Python API.

Independent Blender study, not the production room export. Coordinates are Z-up.
The live connector accepts this file's source directly (no eval or file execution).
"""
import bpy
import math
from mathutils import Vector, Matrix

scene = bpy.context.scene
assert scene.name.startswith('Joker Adventure Blockout'), 'Use the isolated prototype scene'
assert 'JA_Car' not in scene.objects, 'Blockout already built; use a fresh imported scene'
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 720

# Match utils/roomLayout.ts once, in this imported copy only.
desk_names = {'root_bugjar', 'root_cards', 'root_clock', 'root_elephant',
              'root_laptop', 'root_mouse', 'root_paratrooper', 'root_phone',
              'root_robot', 'root_screen_left', 'root_screen_right',
              'root_speaker_l', 'root_speaker_r', 'static_style_ultrawide_housing',
              'static_style_monitor_base', 'static_style_monitor_stem', 'static_style_monitor_vesa'}
desk_prefixes = ('static_desk_', 'static_hub', 'static_phone_stand', 'static_riser_',
                 'static_subwoofer', 'static_style_desk_plant')
for obj in scene.objects:
    if not obj.parent and (obj.name in desk_names or obj.name.startswith(desk_prefixes)):
        obj.location.x -= .25
    if obj.name.startswith(('root_world_clock_', 'static_world_clock_', 'static_style_clock_city_', 'static_style_clock_label_')) or obj.name == 'static_lettering_batch_1':
        obj.hide_render = True
        obj.hide_set(True)
for name in ('static_style_storage_bin_0', 'static_style_bin_handle_0'):
    scene.objects[name].hide_render = True
    scene.objects[name].hide_set(True)
bpy.context.view_layer.update()

collection = bpy.data.collections.new('JA | Garage, car and traversal study')
scene.collection.children.link(collection)

def put(obj):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)
    return obj

def material(name, color, metal=0, rough=.32, glow=0):
    mat = bpy.data.materials.new('JA_' + name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    node = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Metallic'].default_value = metal
    node.inputs['Roughness'].default_value = rough
    if glow:
        node.inputs['Emission Color'].default_value = (*color, 1)
        node.inputs['Emission Strength'].default_value = glow
    return mat

purple = material('Violet ABS', (.24, .025, .52))
green = material('Lime ABS', (.40, .85, .035))
black = material('Graphite', (.016, .021, .032), .25)
rubber = material('Rubber', (.009, .011, .015), 0, .72)
chrome = material('Brushed metal', (.34, .40, .46), .8)
ivory = material('Ivory', (.88, .85, .68))
oak = material('Garage oak', (.30, .18, .09), 0, .64)
lightmat = material('Headlights', (.7, 1, .5), 0, .25, 3)
amber = material('Amber', (1, .20, .025), 0, .25, 2)

def empty(name, location=(0, 0, 0), parent=None):
    obj = bpy.data.objects.new('JA_' + name, None)
    collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.empty_display_size = .02
    return obj

def finish(obj, name, location, mat, parent=None):
    obj.name = 'JA_' + name
    put(obj)
    obj.parent = parent
    obj.location = location
    if mat:
        obj.data.materials.append(mat)
    return obj

def box(name, size, location, mat, parent=None, bevel=.001):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.data.transform(Matrix.Diagonal(Vector((*size, 1))))
    finish(obj, name, location, mat, parent)
    if bevel:
        mod = obj.modifiers.new('Soft toy edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
    return obj

def cylinder(name, radius, depth, location, mat, parent=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=radius, depth=depth)
    obj = finish(bpy.context.object, name, location, mat, parent)
    obj.rotation_euler = rotation
    bevel = obj.modifiers.new('Rounded rim', 'BEVEL')
    bevel.width = .0007
    bevel.segments = 2
    return obj

def bar(name, a, b, radius, mat, parent=None):
    a, b = Vector(a), Vector(b)
    obj = cylinder(name, radius, (b-a).length, (a+b)/2, mat, parent)
    obj.rotation_euler = (b-a).to_track_quat('Z', 'Y').to_euler()
    return obj

def torus(name, major, minor, location, mat, parent=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=24, minor_segments=8, major_radius=major, minor_radius=minor)
    obj = finish(bpy.context.object, name, location, mat, parent)
    obj.rotation_euler = rotation
    return obj

def key(obj, frame, location=None, rotation=None):
    if location is not None:
        obj.location = location
        obj.keyframe_insert(data_path='location', frame=frame)
    if rotation is not None:
        obj.rotation_euler = rotation
        obj.keyframe_insert(data_path='rotation_euler', frame=frame)

# One lower bin becomes a hollow garage. The neighbouring bin stays intact.
garage = empty('Garage', (1.345, .125, .047))
garage['role'] = 'Hidden garage inside the left storage bay'
for name, size, loc in [
    ('Floor', (.292, .35, .009), (0, 0, .0045)),
    ('Back', (.292, .008, .28), (0, .171, .145)),
    ('Side_L', (.008, .35, .28), (-.142, 0, .145)),
    ('Side_R', (.008, .35, .28), (.142, 0, .145)),
    ('Roof', (.292, .35, .009), (0, 0, .285)),
]:
    box('Garage_' + name, size, loc, oak if name != 'Floor' else black, garage)
door = empty('GarageDoor', (0, -.219, .012), garage)
box('Garage_false_front', (.276, .010, .265), (0, 0, .1325), oak, door)
box('Garage_pull', (.047, .009, .009), (0, -.010, .19), black, door)
for sx in (-1, 1):
    box('Garage_light_' + str(sx), (.005, .29, .004), (sx*.09, 0, .23), lightmat, garage)
for f,z in [(1,.012),(208,.012),(248,.294),(720,.294)]:
    key(door,f,(0,-.219,z))
box('Garage_apron',(.17,.10,.009),(1.345,-.094,.0515),black)
# A mechanical book switch beside the garage, with a pivot for later interaction.
switch = empty('BookLatch', (1.185, -.105, .07))
box('BookLatch_cover', (.033,.017,.072),(0,0,.036),purple,switch)
box('BookLatch_pages', (.026,.016,.064),(.002,0,.036),ivory,switch)
key(switch,1,rotation=(0,0,0)); key(switch,200,rotation=(0,0,0))
key(switch,219,rotation=(math.radians(-28),0,0))

# Elevator is forward of the shelves; no path passes through a shelf board.
lift = empty('Lift', (1.345, -.245, .050))
box('Lift_platform',(.23,.23,.012),(0,0,0),black,lift)
for sx in (-1,1):
    box('Lift_lip_'+str(sx),(.008,.23,.018),(sx*.111,0,.009),green,lift)
    box('Lift_rail_'+str(sx),(.014,.018,.94),(1.345+sx*.12,-.13,.52),chrome)
    cylinder('Lift_pulley_'+str(sx),.021,.012,(1.345+sx*.12,-.135,.99),purple,rotation=(math.pi/2,0,0))
box('Lift_base',(.28,.29,.025),(1.345,-.215,.015),black)
for f,z in [(1,.050),(390,.050),(490,.940),(720,.940)]:
    key(lift,f,(1.345,-.245,z))

# Ramp deploys sideways from the lift, then ends before the desk edge.
ramp = empty('RampHinge',(1.23,-.245,.946))
box('Ramp_deck',(.255,.13,.010),(-.1275,0,0),purple,ramp)
for sy in (-1,1):
    box('Ramp_guard_'+str(sy),(.255,.008,.025),(-.1275,sy*.065,.010),green,ramp)
for j in range(7):
    box('Ramp_grip_'+str(j),(.008,.11,.002),(-.02-j*.035,0,.006),black,ramp)
for f,a in [(1,math.pi/2),(480,math.pi/2),(522,0),(720,0)]:
    key(ramp,f,rotation=(0,a,0))
box('Landing_pad',(.25,.16,.004),(.65,-.245,.752),black)
for sx in (-1,1):
    box('Landing_edge_'+str(sx),(.25,.008,.005),(.65,-.245+sx*.078,.755),green)

# Car local forward is -Y. All moving parts have separate pivots.
car = empty('Car',(1.345,.12,.056))
car['forward_axis'] = '-Y'
car['role'] = 'Animated route preview; live driving physics not implemented'
body = empty('CarBody',(0,0,0),car)
box('Car_chassis',(.073,.143,.014),(0,0,.023),black,body)
box('Car_hood',(.070,.052,.019),(0,-.046,.038),purple,body)
box('Car_trunk',(.072,.032,.021),(0,.056,.040),purple,body)
box('Car_bumper',(.086,.013,.012),(0,-.078,.028),chrome,body)
box('Car_grille',(.056,.003,.017),(0,-.079,.042),black,body)
for i in range(7):
    tooth=box('Grin_tooth_'+str(i),(.004,.002,.009),(i*.007-.021,-.081,.043-abs(i-3)*.001),ivory,body)
    tooth.rotation_euler.y = (i-3)*.075
for sx in (-1,1):
    box('Headlight_'+str(sx),(.013,.006,.010),(sx*.030,-.074,.051),lightmat,body)
    box('Rear_light_'+str(sx),(.014,.004,.009),(sx*.025,.074,.038),amber,body)
    for y in (-.05,.05):
        box('Fender_'+str(sx)+str(y),(.015,.042,.008),(sx*.039,y,.042),purple,body)
    fin=box('Tail_fin_'+str(sx),(.006,.047,.027),(sx*.029,.061,.060),green,body)
    fin.rotation_euler.x=math.radians(-18)
    cylinder('Exhaust_'+str(sx),.008,.017,(sx*.023,.079,.025),chrome,body,(math.pi/2,0,0))
    cylinder('Exhaust_core_'+str(sx),.005,.018,(sx*.023,.080,.025),black,body,(math.pi/2,0,0))
for x in (-.022,0,.022):
    for y in (-.059,-.035,.059):
        cylinder('Stud_'+str(x)+str(y),.0048,.003,(x,y,.049 if y<0 else .052),purple,body)
for sx in (-1,1):
    doorpivot=empty('CarDoor_'+str(sx),(sx*.037,-.026,.028),body)
    box('CarDoor_panel_'+str(sx),(.006,.063,.027),(0,.0315,.009),purple,doorpivot)
    box('CarDoor_stripe_'+str(sx),(.007,.058,.005),(0,.0315,.013),green,doorpivot)
    box('CarDoor_handle_'+str(sx),(.010,.012,.004),(sx*.003,.052,.020),chrome,doorpivot)
    for f,a in [(1,0),(257,0),(275,sx*1.05),(317,sx*1.05),(336,0),(720,0)]:
        key(doorpivot,f,rotation=(0,0,a if sx==-1 else 0))
box('Seat_cushion',(.030,.025,.006),(0,.027,.030),black,body)
seat=box('Seat_back',(.031,.008,.030),(0,.045,.045),black,body)
seat.rotation_euler.x=math.radians(-9)
box('Dashboard',(.062,.011,.017),(0,-.022,.050),black,body)
for x in (-.016,.012):
    cylinder('Gauge_'+str(x),.006,.002,(x,-.015,.052),ivory,body,(math.pi/2,0,0))
bar('Steering_column',(0,-.023,.040),(0,-.009,.056),.002,chrome,body)
wheel=torus('Steering',.011,.0017,(0,-.009,.056),green,body,(math.radians(62),0,0))
bar('Steering_spoke',(-.010,-.009,.056),(.010,-.009,.056),.0015,chrome,body)
for sx in (-1,1):
    bar('Windscreen_post_'+str(sx),(sx*.033,-.031,.047),(sx*.031,-.021,.091),.002,chrome,body)
bar('Windscreen_top',(-.031,-.021,.091),(.031,-.021,.091),.002,chrome,body)
tires=[]
for sx in (-1,1):
    for sy in (-1,1):
        steer=empty('WheelSteer_'+str(sx)+'_'+str(sy),(sx*.043,sy*.047,.018),car)
        spin=empty('WheelSpin_'+str(sx)+'_'+str(sy),(0,0,0),steer)
        cylinder('Tire_'+str(sx)+'_'+str(sy),.018,.014,(0,0,0),rubber,spin,(0,math.pi/2,0))
        cylinder('Rim_'+str(sx)+'_'+str(sy),.011,.0148,(0,0,0),green,spin,(0,math.pi/2,0))
        cylinder('Hub_'+str(sx)+'_'+str(sy),.004,.016,(0,0,0),purple,spin,(0,math.pi/2,0))
        tires.append(spin)
        if sy==-1:
            for f,a in [(1,0),(365,0),(385,-.40),(401,0),(493,-.36),(520,0),(720,0)]:
                key(steer,f,rotation=(0,0,a))
car_path=[(1,(1.345,.12,.056),0),(340,(1.345,.12,.056),0),
          (382,(1.345,-.245,.056),0),(390,(1.345,-.245,.056),0),
          (490,(1.345,-.245,.946),0),(526,(1.345,-.245,.946),-math.pi/2),
          (559,(1.065,-.245,.951),-math.pi/2),(568,(.975,-.245,.954),-math.pi/2),
          (578,(.865,-.245,.988),-math.pi/2),(592,(.704,-.245,.767),-math.pi/2),
          (599,(.665,-.245,.756),-math.pi/2),(610,(.635,-.245,.756),-math.pi/2),
          (650,(.50,-.245,.756),-math.pi/2),(720,(.50,-.245,.756),-math.pi/2)]
for f,loc,yaw in car_path:
    key(car,f,loc,(0,0,yaw))
for tire in tires:
    for f,angle in [(1,0),(340,0),(382,-20),(526,-20),(592,-56),(650,-65),(720,-65)]:
        key(tire,f,rotation=(angle,0,0))
for f,z,pitch in [(1,0,0),(558,0,0),(570,.002,-.10),(583,.002,.08),(594,-.006,.09),(601,.003,-.035),(610,0,0),(720,0,0)]:
    key(body,f,(0,0,z),(pitch,0,0))

# Clone the original Joker's actual parts; original figure is retained but hidden in this study.
source=scene.objects['root_bugjar']
actor=empty('Joker')
actor['rig_type']='Rigid LEGO part pivots; no deforming skin needed for this blockout'
copies={}
for original in source.children_recursive:
    if original.type!='MESH' or original.name in ('static_bugjar_base','static_bugjar_stud_l','static_bugjar_stud_r'):
        continue
    clone=original.copy()
    collection.objects.link(clone)
    clone.name='JA_Joker_'+original.name.replace('static_bugjar_','').replace('int_bugjar','torso')
    clone.parent=actor
    clone.matrix_parent_inverse=Matrix.Identity(4)
    clone.matrix_basis=source.matrix_world.inverted()@original.matrix_world
    copies[original.name]=clone
for original in source.children_recursive:
    original.hide_render=True
    original.hide_set(True)
joints={}
for side,sx in [('l',-1),('r',1)]:
    hip=empty('Joker_hip_'+side,(sx*.0059,.005,.0156),actor)
    shoulder=empty('Joker_shoulder_'+side,(sx*.0093,.0042,.0355),actor)
    for name,part in copies.items():
        target=hip if name=='static_bugjar_leg_'+side else shoulder if name in ['static_bugjar_'+k+'_'+side for k in ('arm','shoulder','wrist','hand')] else None
        if target:
            matrix=part.matrix_basis.copy()
            part.parent=target
            part.matrix_basis=Matrix.Translation(-target.location)@matrix
    joints['hip_'+side]=hip
    joints['shoulder_'+side]=shoulder
# Root foot clearance in upright pose is approximately +.0034 m.
actor_path=[(1,(.28,.105,.838),-.14),(24,(.28,.105,.838),-.14),
            (43,(.32,-.01,.88),0),(59,(.37,-.11,.754),0),
            (89,(.63,-.23,.754),math.pi/2),(110,(.74,-.23,.79),math.pi/2),
            (142,(1.105,-.13,.995),math.pi/2),(161,(1.135,-.125,.86),math.pi/2),
            (181,(1.135,-.17,.43),0),(198,(1.165,-.17,.06),0),
            (235,(1.19,-.125,.06),0),(258,(1.245,-.12,.06),0),
            (279,(1.279,.10,.072),0),(301,(1.306,.123,.12),0),
            (323,(1.345,.140,.081),0),(340,(1.345,.140,.081),0)]
for f,loc,yaw in actor_path:
    key(actor,f,loc,(0,0,yaw))
# The same actor sits in the car without a duplicate or a teleport between shots.
for f,loc,yaw in car_path:
    if f>340:
        offset=Matrix.Rotation(yaw,4,'Z')@Vector((0,.020,.025))
        key(actor,f,Vector(loc)+offset,(0,0,yaw))
for side,phase in [('l',1),('r',-1)]:
    hip=joints['hip_'+side]
    shoulder=joints['shoulder_'+side]
    for f in [1,24,43,59,68,77,86,95,110,142,161,181,198,208,218,235,246,258,269,279,290,301,323,340,720]:
        walking=59<=f<=110 or 198<=f<=279
        seated=f<=24 or f>=323
        swing=math.sin(f*.40)*.32*phase if walking else 0
        key(hip,f,rotation=(0 if seated else math.pi/2+swing,0,0))
        arm=-.75 if f>=323 else -1.7 if 110<=f<=181 else -swing
        key(shoulder,f,rotation=(arm,0,0))

# Grapple anchor, rope and folding umbrella communicate the traversal tools.
anchor=empty('GrappleAnchor',(1.165,-.13,1.12))
torus('GrappleRing',.012,.003,(0,0,0),green,anchor,(math.pi/2,0,0))
bar('GrappleMount',(1.165,-.13,1.12),(1.18,-.055,1.12),.004,chrome)
rope=bar('GrappleCable',(.74,-.23,.835),(1.165,-.13,1.12),.001,black)
for f,v in [(1,.001),(107,.001),(112,1),(143,1),(148,.001),(720,.001)]:
    rope.scale=(v,v,v);rope.keyframe_insert(data_path='scale',frame=f)
umbrella=empty('Umbrella',(0,.006,.073),actor)
bar('UmbrellaShaft',(0,0,-.037),(0,0,.002),.0012,chrome,umbrella)
for i in range(8):
    a=i*math.tau/8;b=(i+1)*math.tau/8
    vertices=[(0,0,.012),(.041*math.cos(a),.041*math.sin(a),-.009),(.041*math.cos(b),.041*math.sin(b),-.009)]
    mesh=bpy.data.meshes.new('JA_UmbrellaPanel');mesh.from_pydata(vertices,[],[(0,1,2)])
    obj=bpy.data.objects.new('JA_Umbrella_panel_'+str(i),mesh);collection.objects.link(obj)
    obj.parent=umbrella;mesh.materials.append(purple if i%2==0 else green)
    bar('UmbrellaRib_'+str(i),vertices[0],vertices[1],.0006,chrome,umbrella)
for f,v in [(1,.001),(149,.001),(159,1),(190,1),(201,.001),(720,.001)]:
    umbrella.scale=(v,v,v);umbrella.keyframe_insert(data_path='scale',frame=f)

# Small, separately authored breakable bricks at the end of the driving route.
for i in range(6):
    p=Vector((.47+(i%2)*.025,-.245+(i//2-1)*.021,.763))
    brick=box('BreakableBrick_'+str(i),(.023,.020,.015),p,green if i%2 else purple)
    for f,offset,rotation in [(1,(0,0,0),(0,0,0)),(633,(0,0,0),(0,0,0)),(646,(-.04-i*.009,(i-2.5)*.027,.07),(i*.4,i*.7,i)),(676,(-.10-i*.009,(i-2.5)*.040,-.003),(0,0,i*.8)),(720,(-.10-i*.009,(i-2.5)*.040,-.003),(0,0,i*.8))]:
        key(brick,f,p+Vector(offset),rotation)

def camera(name,eye,target,lens=40,parent=None):
    data=bpy.data.cameras.new('JA_'+name)
    obj=bpy.data.objects.new('JA_'+name,data);collection.objects.link(obj)
    obj.parent=parent;obj.location=eye
    obj.rotation_euler=(Vector(target)-Vector(eye)).to_track_quat('-Z','Y').to_euler()
    data.lens=lens;data.clip_start=.002;data.clip_end=100
    return obj

overview=camera('Camera_Overview',(-1.5,-3.3,2.1),(.45,0,.83),42)
garage_cam=camera('Camera_Garage',(1.29,-.43,.24),(1.345,.04,.15),48)
car_cam=camera('Camera_CarDetail',(1.32,-.22,.20),(1.345,.105,.102),52)
cockpit=camera('Camera_Cockpit',(0,.016,.073),(0,-.25,.046),18,car)
route_cam=camera('Camera_Jump',(.15,-1.3,1.20),(1.04,-.245,.84),44)
entrance=camera('Camera_Enter',(1.06,-.12,.20),(1.345,.10,.10),35)
for f,eye,target,lens in [(279,(1.32,-.16,.19),(1.33,.12,.10),35),(310,(1.32,.10,.18),(1.345,.09,.11),28),(340,(1.345,.136,.129),(1.345,-.13,.102),18)]:
    entrance.location=eye;entrance.rotation_euler=(Vector(target)-Vector(eye)).to_track_quat('-Z','Y').to_euler()
    entrance.keyframe_insert(data_path='location',frame=f);entrance.keyframe_insert(data_path='rotation_euler',frame=f)
    entrance.data.lens=lens;entrance.data.keyframe_insert(data_path='lens',frame=f)
for f,name,cam in [(1,'01 WAKE AND TRAVERSE',overview),(195,'02 SECRET GARAGE',garage_cam),(279,'03 CLIMB INTO CAR',entrance),(340,'04 JOKER EYE VIEW',cockpit),(490,'05 LIFT AND RAMP',route_cam),(555,'06 DRIVE AND JUMP',cockpit),(570,'07 LANDING STUDY',route_cam)]:
    marker=scene.timeline_markers.new(name,frame=f);marker.camera=cam
scene.camera=overview
scene['prototype_note']='30-second Blender animatic. Not live gameplay. Keyboard and monitor cable excluded.'
scene['source_room']='public/models/room.glb with runtime desk offset -0.25m applied'
scene['car_controls_planned']='Move, steer, boost, hop, enter/exit, cockpit/chase, reset'

# Lighting for the imported website room, which has no exported lights.
world=bpy.data.worlds.new('JA_World');world.use_nodes=True
next(n for n in world.node_tree.nodes if n.type=='BACKGROUND').inputs['Color'].default_value=(.13,.16,.22,1)
next(n for n in world.node_tree.nodes if n.type=='BACKGROUND').inputs['Strength'].default_value=.4
scene.world=world
for name,loc,power,size,color,target in [
    ('Key',(.3,-1.5,2.9),170,3,(1,.86,.68),(.4,0,.7)),
    ('Fill',(-1.3,-.5,1.5),85,2,(.62,.76,1),(.7,0,.6)),
    ('Garage',(1.34,-.01,.26),1,.10,(.70,1,.36),(1.34,.10,.08)),
]:
    data=bpy.data.lights.new('JA_'+name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    obj=bpy.data.objects.new('JA_'+name,data);collection.objects.link(obj);obj.location=loc
    obj.rotation_euler=(Vector(target)-Vector(loc)).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.frame_set(1)
bpy.context.view_layer.update()
print('Blockout complete:',len(collection.objects),'study objects; 720 frames; original GLB unchanged')
