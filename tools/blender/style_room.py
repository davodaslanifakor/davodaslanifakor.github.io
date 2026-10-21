"""Reference room restyle, compatible with Blender MCP safe mode.

Pass content exported from content/portfolio.ts to apply(content, ...).
Send the source as literal Python through MCP, with apply(...) appended.
No file reads, module loading, network requests, or GLB export are performed.
Save locations must exist before execution. The live baseline is saved first.
"""
import bpy
import math
from mathutils import Vector
REVIEW = '/Users/davoudfakour/Documents/ChatGPT/Portfolio/tools/blender/review/reference-restyle'
PREFIX = 'static_style_'

def srgb(r,g,b):
    return tuple(c/255/12.92 if c/255<=0.04045 else ((c/255+0.055)/1.055)**2.4 for c in (r,g,b))

def pbr(name,color,roughness=0.6,metallic=0.0,emission=None,emission_strength=0):
    mat=bpy.data.materials.new(name)
    mat.use_nodes=True
    node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value=(*color,1)
    node.inputs['Roughness'].default_value=roughness
    node.inputs['Metallic'].default_value=metallic
    if emission:
        node.inputs['Emission Color'].default_value=(*emission,1)
        node.inputs['Emission Strength'].default_value=emission_strength
    mat.diffuse_color=(*color,1)
    return mat

def assign(obj,mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj

def bevel(obj,width=0.002,segments=3):
    mod=obj.modifiers.new('Edge rounding','BEVEL')
    mod.width=width
    mod.segments=segments
    return obj

def box(name,size,location=(0,0,0),rotation=(0,0,0)):
    sx,sy,sz=(v/2 for v in size)
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([(-sx,-sy,-sz),(sx,-sy,-sz),(sx,sy,-sz),(-sx,sy,-sz),(-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)],[],[(3,2,1,0),(4,5,6,7),(1,5,4,0),(2,6,5,1),(3,7,6,2),(0,4,7,3)])
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.location=location
    obj.rotation_euler=rotation
    return obj

def cylinder(name,radius,depth,segments=24,location=(0,0,0),rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments,radius=radius,depth=depth,location=location,rotation=rotation)
    obj=bpy.context.object
    obj.name=name
    return obj

def sphere(name,radius,segments=16,rings=10,location=(0,0,0),scale=(1,1,1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=radius,location=location)
    obj=bpy.context.object
    obj.name=name
    obj.scale=scale
    for poly in obj.data.polygons:poly.use_smooth=True
    return obj

def tube(name,path,radius,segments=8):
    curve=bpy.data.curves.new(name,'CURVE')
    curve.dimensions='3D'
    curve.bevel_depth=radius
    curve.bevel_resolution=2
    spline=curve.splines.new('POLY')
    spline.points.add(len(path)-1)
    for point,pos in zip(spline.points,path):point.co=(*pos,1)
    obj=bpy.data.objects.new(name,curve)
    bpy.context.collection.objects.link(obj)
    return obj

def look_at(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

def lettering(name,text,pos,size,mat):
    data=bpy.data.curves.new(name,'FONT')
    data.body=text
    data.size=size
    data.align_x='CENTER'
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.location=pos
    obj.rotation_euler=(math.pi/2,0,0)
    assign(obj,mat)
    return obj

CONTENT = {}
CLOCK_ANGLES = {}

def refresh_clocks():
    for city,x in (('istanbul',-0.615),('london',-0.205),('stockholm',0.205),('tehran',0.615)):
        root=bpy.data.objects.get('root_world_clock_'+city)
        if root:root.location.x=x
    root=bpy.data.objects.get('root_world_clock_tehran')
    if root:
        for obj in [root,*root.children_recursive]:obj.name=obj.name.replace('tehran','reykjavik')
    ink=material('clock_label',(220,215,194),0.8)
    for city,label in [(c['id'],c['label'].upper()) for c in CONTENT['cities']]:
        old=bpy.data.objects.get('static_world_clock_'+city+'_nameplate')
        if old:archive([old])
        root=bpy.data.objects.get('root_world_clock_'+city)
        if root:
            text=lettering(PREFIX+'clock_label_'+city,label,(root.location.x,0.383,root.location.z-0.168),0.008,ink)

def material(name, rgb, roughness=0.6, metallic=0.0):
    return pbr("style_" + name, srgb(*rgb), roughness, metallic)


def block(name, size, pos, mat, radius=0.002):
    obj = box(PREFIX + name, size, pos)
    assign(obj, mat)
    if radius:
        bevel(obj, radius, 3)
    return obj


def archive(objects):
    col = bpy.data.collections.get("Original Layout")
    if col is None:
        col = bpy.data.collections.new("Original Layout")
        bpy.context.scene.collection.children.link(col)
    for obj in set(objects):
        for owner in list(obj.users_collection):
            owner.objects.unlink(obj)
        col.objects.link(obj)
        obj.hide_render = True
        obj.hide_set(True)
        obj.name = "archive_" + obj.name
    col.hide_render = True
    col.hide_viewport = True


def hierarchy(name):
    obj = bpy.data.objects.get(name)
    return [obj, *obj.children_recursive] if obj else []


def area(name, pos, target, energy, size, color=(1.0, 0.67, 0.34), size_y=None):
    data = bpy.data.lights.new("style_" + name, 'AREA')
    data.energy, data.size, data.color = energy, size, color
    if size_y is not None:
        data.shape, data.size_y = 'RECTANGLE', size_y
    obj = bpy.data.objects.new(PREFIX + "light_" + name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    look_at(obj, target)
    obj["light_energy"] = energy
    return obj


def screen_art():
    image=bpy.data.images.new('style_ultrawide_art',width=1024,height=288)
    pixels=[]
    for y in range(288):
        v=y/288
        for x in range(1024):
            u=x/1024
            rgb=(15,23,32)
            if 0.01<u<0.44:
                rgb=(42+int(v*20),58+int(v*18),76+int(v*20))
                for k,col in enumerate(((71,88,101),(46,65,78),(25,43,57))):
                    ridge=0.47-k*0.13+0.13*math.sin(u*29+k*0.6)+0.06*math.sin(u*81)
                    if v<ridge:rgb=col
            for i in range(4):
                cx,cy=0.475+(i%2)*0.18,0.48-(i//2)*0.34
                if cx<u<cx+0.155 and cy<v<cy+0.25:
                    rgb=(44+i*4,59+i*4,70+i*4)
                    if v<cy+0.12+0.055*math.sin((u-cx)*76):rgb=(91,109,112)
            if 0.825<u<0.95 and any(abs(v-(0.74-i*0.11))<0.008 for i in range(6)):rgb=(151,168,165)
            pixels.extend((rgb[0]/255,rgb[1]/255,rgb[2]/255,1))
    image.pixels.foreach_set(pixels)
    image.pack()
    mat=pbr('style_ultrawide_display',(0.1,0.12,0.14),0.32)
    node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image=image
    mat.node_tree.links.new(tex.outputs['Color'],node.inputs['Base Color'])
    mat.node_tree.links.new(tex.outputs['Color'],node.inputs['Emission Color'])
    node.inputs['Emission Strength'].default_value=0.7
    ink=pbr('style_screen_ink',(0.8,0.83,0.8),emission=(0.8,0.83,0.8),emission_strength=0.35)
    lettering(PREFIX+'screen_name',CONTENT['profile']['name'],(-0.36,0.229,1.23),0.027,ink)
    lettering(PREFIX+'screen_stack',CONTENT['profile']['specialties'],(-0.36,0.229,1.19),0.016,ink)
    for i,skill in enumerate(CONTENT['skills'][:6]):
        lettering(PREFIX+'screen_skill_'+str(i),skill['name'],(0.53,0.195,1.235-i*0.036),0.011,ink)
    return mat

def curved_surface(name, width, height, depth_offset, mat, u0=0.0, u1=1.0):
    verts, faces, uv = [], [], []
    for i in range(49):
        u = u0 + (u1-u0)*i/48
        x = (u-0.5)*width
        # Centre is farther from the viewer; edges wrap toward the viewer.
        y = 0.265 - 0.105*(2*x/width)**2 + depth_offset
        verts.extend(((x, y, 1.125-height/2), (x, y, 1.125+height/2)))
        uv.extend(((u, 0), (u, 1)))
        if i:
            faces.append((2*i-2, 2*i, 2*i+1, 2*i-1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    layer = mesh.uv_layers.new(name='UVMap')
    for face in mesh.polygons:
        for li in face.loop_indices:
            layer.data[li].uv = uv[mesh.loops[li].vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, mat)
    return obj


def ultrawide():
    archive(hierarchy('root_screen_left') + hierarchy('root_screen_right') +
            [o for o in bpy.data.objects if o.name.startswith('static_monitor_arm')])
    bezel = material('bezel', (22, 23, 25), 0.3, 0.35)
    shell = curved_surface(PREFIX+'ultrawide_housing', 1.36, 0.385, 0.0, bezel)
    solid = shell.modifiers.new('Rear enclosure', 'SOLIDIFY')
    solid.thickness = 0.022
    solid.offset = -1
    art = screen_art()
    # One uninterrupted physical screen, with existing project/skills hit IDs.
    for name, start, end in (('screen_left', 0.0, 0.5), ('screen_right', 0.5, 1.0)):
        root = bpy.data.objects.new('root_'+name, None)
        bpy.context.collection.objects.link(root)
        surf = curved_surface('int_'+name, 1.34, 0.364, -0.0015, art, start, end)
        surf.parent = root
    block('monitor_vesa', (0.12, 0.045, 0.12), (0, 0.31, 1.125), bezel)
    block('monitor_stem', (0.035, 0.04, 0.275), (0, 0.34, 0.89), bezel)
    block('monitor_base', (0.23, 0.10, 0.012), (0, 0.33, 0.757), bezel)


def wall():
    plaster = material('plaster', (157, 145, 127), 0.94)
    graphite = material('wall_frame', (45, 44, 40), 0.8)
    oak = material('oak', (177, 142, 100), 0.55)
    glow = pbr('style_warm_led', (1.0, 0.57, 0.19), emission=(1.0, 0.57, 0.19), emission_strength=4)
    old = bpy.data.objects.get('static_wall')
    if old:
        assign(old, graphite)
        old.scale.x=1.12
    side=bpy.data.objects.get('static_wall_right')
    if side:
        side.location.x=1.88
        assign(side,graphite)
    block('wall_inset', (2.75, 0.023, 2.1), (-0.17, 0.394, 1.12), plaster, 0.003)
    for x in (-1.565, 1.225):
        block('wall_edge_'+str(x), (0.038, 0.047, 2.22), (x, 0.376, 1.12), graphite)
        block('wall_led_'+str(x), (0.008, 0.006, 2.115), (x+(0.026 if x<0 else -0.026), 0.363, 1.12), glow, 0)
        area('wall_wash_'+str(x), (x, 0.30, 1.13), (x*0.8, 0.395, 1.13), 11, 1.95, size_y=0.12)
    for z in (0.056, 2.185):
        block('wall_header_'+str(z), (2.80, 0.045, 0.037), (-0.17, 0.378, z), graphite)
        block('wall_led_'+str(z), (2.735, 0.006, 0.008), (-0.17, 0.363, z+(0.024 if z<1 else -0.024)), glow, 0)
    area('wall_top', (-0.17, 0.29, 2.13), (-0.17, 0.38, 1.6), 18, 2.6, size_y=0.10)
    area('desk_wash', (0, 0.28, 0.91), (0, 0.39, 0.64), 9, 1.45, size_y=0.06)
    block('skirting', (2.79, 0.016, 0.058), (-0.17, 0.396, 0.029), oak)
    floor = bpy.data.objects.get('static_floor')
    if floor:
        wood = material('floor_wood', (104, 94, 79), 0.66)
        assign(floor, wood)
    seam = material('floor_seam', (65, 58, 46), 0.88)
    for i in range(17):
        block('floor_join_'+str(i), (0.0015, 2.9, 0.001), (-1.95+i*0.24, -0.6, 0.001), seam, 0)
    rug = material('rug', (120, 110, 94), 1)
    block('rug', (2.55, 0.63, 0.006), (0, -1.00, 0.004), rug, 0.012)
    # Fine loop-pile noise gives plaster/wood/textile a readable surface.
    for mat, scale, strength in ((plaster, 190, 0.10), (rug, 320, 0.65), (oak, 8, 0.18)):
        nodes = mat.node_tree.nodes
        bsdf = next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
        noise, bump = nodes.new('ShaderNodeTexNoise'), nodes.new('ShaderNodeBump')
        noise.inputs['Scale'].default_value = scale
        bump.inputs['Strength'].default_value = strength
        bump.inputs['Distance'].default_value = 0.0015
        mat.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        mat.node_tree.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])


def plant(name,pos,size=1.0,trailing=False):
    ceramic=material('ceramic',(218,209,184),0.35)
    leafmat=material('leaf',(71,104,43),0.72)
    soilmat=material('soil',(48,39,27),0.99)
    bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=0.035*size,radius2=0.049*size,depth=0.075*size,location=(pos[0],pos[1],pos[2]+0.0375*size))
    pot=bpy.context.object
    pot.name=PREFIX+name+'_pot'
    assign(pot,ceramic)
    bevel(pot,0.003,3)
    assign(cylinder(PREFIX+name+'_soil',0.044*size,0.002,32,(pos[0],pos[1],pos[2]+0.074*size)),soilmat)
    for i in range(16):
        a=i*math.tau/16
        tip=(pos[0]+math.cos(a)*(0.065+(i%3)*0.008)*size,pos[1]+math.sin(a)*(0.065+(i%3)*0.008)*size,pos[2]+(0.11+(i%5)*0.018)*size)
        assign(tube(PREFIX+name+'_stem_'+str(i),[(pos[0],pos[1],pos[2]+0.074*size),tip],0.0015*size),leafmat)
        leaf=sphere(PREFIX+name+'_leaf_'+str(i),0.021*size,12,8,tip,scale=(1.6,0.17,0.8))
        leaf.rotation_euler=(0.35,0.35,a)
        assign(leaf,leafmat)
    if trailing:
        for vine in range(4):
            points=[]
            for j in range(20):
                t=j/19
                p=(pos[0]+0.04*math.sin(t*10+vine)+vine*0.027,pos[1]-0.16-0.03*math.sin(t*6),pos[2]+0.06-t*(0.46+vine*0.075))
                points.append(p)
                if j%2:
                    leaf=sphere(PREFIX+name+f'_trail_leaf_{vine}_{j}',0.018,12,8,p,scale=(1.1,0.25,1.35))
                    leaf.rotation_euler=(0.2,0.65,0.35)
                    assign(leaf,leafmat)
            assign(tube(PREFIX+name+f'_vine_{vine}',points,0.0013),leafmat)
    return pot

def library():
    archive(hierarchy('root_library'))
    black=material('shelf_frame',(28,30,27),0.35,0.6)
    oak=material('shelf_oak',(184,151,109),0.58)
    cloth=material('bin_fabric',(131,126,114),0.96)
    cream=material('book_pages',(211,203,182),0.85)
    leds=pbr('style_shelf_led',(1,0.60,0.23),emission=(1,0.60,0.23),emission_strength=3.5)
    cx, cy, width, depth = 1.51, 0.135, 0.66, 0.40
    for x in (cx-width/2,cx+width/2):
        for y in (cy-depth/2,cy+depth/2):
            block('library_post_'+str(x)+str(y),(0.018,0.018,2.12),(x,y,1.06),black)
    heights=(0.035,0.43,0.84,1.245,1.66,2.08)
    for i,z in enumerate(heights):
        block('shelf_'+str(i),(width+0.027,depth+0.02,0.024),(cx,cy,z),oak)
        if i:
            block('shelf_led_'+str(i),(width-0.05,0.006,0.004),(cx,cy-0.12,z-0.014),leds,0)
            area('shelf_'+str(i),(cx,cy-0.06,z-0.022),(cx,cy,z-0.22),4.0,width-0.05,size_y=0.12)
    for i in range(2):
        x=cx-0.165+i*0.33
        block('storage_bin_'+str(i),(0.298,0.35,0.295),(x,cy,0.196),cloth,0.008)
        block('bin_handle_'+str(i),(0.047,0.003,0.012),(x,cy-0.177,0.245),black,0.004)
    covers=[material('book_'+str(i),rgb,0.83) for i,rgb in enumerate(((201,193,167),(67,78,65),(117,98,76),(50,51,46)))]
    for i in range(11):
        h=0.18+(i%4)*0.021
        x=cx-0.28+i*0.036
        block('upright_book_'+str(i),(0.029,0.145,h),(x,cy+0.035,1.672+h/2),covers[i%4],0.001)
        for dz in (-h*0.3,h*0.3):
            block('book_band_'+str(i)+str(dz),(0.022,0.001,0.002),(x,cy-0.039,1.672+h/2+dz),cream,0)
    for shelf,z in enumerate((0.442,0.852,1.257)):
        for i in range(3):
            x=cx+(-0.16 if shelf!=1 else 0.14)
            block('stack_cover_'+str(shelf)+str(i),(0.225-i*0.018,0.155,0.025),(x,cy-0.015,z+0.014+i*0.032),covers[(i+shelf)%4],0.001)
            block('stack_pages_'+str(shelf)+str(i),(0.212-i*0.018,0.15,0.019),(x,cy-0.018,z+0.015+i*0.032),cream,0)
    # Front-facing frame, paper and original geometric mountain artwork.
    block('art_frame',(0.175,0.013,0.205),(cx+0.19,cy+0.08,1.36),black)
    block('art_paper',(0.149,0.002,0.179),(cx+0.19,cy+0.072,1.36),cream,0)
    art=tube(PREFIX+'art_mountains',[(cx+0.12,cy+0.070,1.31),(cx+0.165,cy+0.070,1.38),(cx+0.20,cy+0.070,1.33),(cx+0.25,cy+0.070,1.41)],0.002,segments=6)
    assign(art,black)
    diffuser=cylinder(PREFIX+'diffuser',0.026,0.072,32,(cx+0.21,cy-0.05,0.888))
    assign(diffuser,black)
    for i in range(7):
        a=i*math.tau/7
        assign(tube(PREFIX+'reed_'+str(i),[(cx+0.21,cy-0.05,0.92),(cx+0.21+0.032*math.cos(a),cy-0.05+0.02*math.sin(a),1.05)],0.0011,segments=5),black)
    plant('shelf_plant',(cx-0.18,cy,1.257),1.05)
    plant('top_trailing_plant',(cx+0.14,cy,2.092),1.3,True)
    plant('desk_plant',(-0.62,0.09,0.752),0.75)


def setup_scene(scene, dark=False):
    scene.use_fake_user=True
    scene.name='Room Dark' if dark else 'Room Light'
    scene['room_mode']='dark' if dark else 'light'
    # Keep the connected Blender's existing render engine.
    scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage=1400,1050,100
    scene.render.image_settings.file_format='PNG'
    scene.view_settings.view_transform='AgX'
    scene.view_settings.exposure=0.35 if dark else 0.5
    scene.world=bpy.data.worlds.new(scene.name+' World')
    scene.world.use_nodes=True
    bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND')
    bg.inputs['Color'].default_value=(0.13,0.15,0.18,1)
    bg.inputs['Strength'].default_value=0.07 if dark else 0.35
    for obj in scene.objects:
        if obj.type!='LIGHT':continue
        obj.data=obj.data.copy()
        obj.data.energy=obj.get('light_energy',obj.data.energy)*(0.15 if dark and 'daylight' in obj.name else 1)
    scene.render.filepath=REVIEW+('/room-dark.png' if dark else '/room-light.png')


def _apply_layout(remove_monkey=False):
    if bpy.data.objects.get(PREFIX+'wall_inset'):
        raise RuntimeError('Restyle is already applied. Open the saved baseline before rerunning.')
    scene=bpy.context.scene
    bpy.ops.wm.save_as_mainfile(filepath=REVIEW+'/room-before.blend',copy=True)
    archive([o for o in scene.objects if o.type=='LIGHT'])
    if remove_monkey:
        archive(hierarchy('root_plush'))
    ultrawide()
    wall()
    library()
    # Regenerate source-data plaques and set hands to actual local times.
    refresh_clocks()
    for city,values in CLOCK_ANGLES.items():
        for hand,angle in zip(('hour','minute','second'),values):
            obj=bpy.data.objects.get(f'static_world_clock_{city}_{hand}_pivot')
            if obj:obj.rotation_euler[1]=-angle
    area('daylight',(-1.8,-1.4,2.5),(0,0.1,1),180,2.4,(1,0.90,0.76))
    area('daylight_fill',(0.8,-2,1.65),(0,0.2,1),35,2.2,(0.79,0.86,1))
    camdata=bpy.data.cameras.new('Room Review Camera')
    cam=bpy.data.objects.new('Room Review Camera',camdata)
    scene.collection.objects.link(cam)
    cam.location=(0.0,-3.3,1.62)
    look_at(cam,(0.20,0.12,1.08))
    camdata.lens=38
    scene.camera=cam
    setup_scene(scene)
    dark=scene.copy()
    # Independent light objects and data; all geometry stays identical.
    # scene.copy shares collection objects: give dark its own collection tree.
    for col in list(dark.collection.children):
        dark.collection.children.unlink(col)
    for obj in list(dark.collection.objects):
        dark.collection.objects.unlink(obj)
    mapping={}
    for obj in scene.objects:
        if obj.hide_render:continue
        duplicate=obj.copy()
        if obj.type=='LIGHT':duplicate.data=obj.data.copy()
        dark.collection.objects.link(duplicate)
        mapping[obj]=duplicate
    for original,duplicate in mapping.items():
        if original.parent in mapping:duplicate.parent=mapping[original.parent]
    dark.camera=mapping[cam]
    setup_scene(dark,True)
    bpy.context.window.scene=scene
    for screen in bpy.data.screens:
        for a in screen.areas:
            if a.type=='VIEW_3D':
                a.spaces.active.region_3d.view_perspective='CAMERA'
                a.spaces.active.shading.type='RENDERED'
                a.spaces.active.overlay.show_overlays=False
    for image in bpy.data.images:
        if image.source=='GENERATED' and image.has_data:image.pack()
    bpy.ops.wm.save_as_mainfile(filepath=REVIEW+'/room-light-dark.blend')
    print({'file':bpy.data.filepath,'scenes':[scene.name,dark.name],'monkey_removed':remove_monkey,'website_exported':False})




def refine():
    white=bpy.data.materials.new('style_display_type')
    white.use_nodes=True
    node=next(n for n in white.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value=(0.85,0.9,0.88,1)
    node.inputs['Emission Color'].default_value=(0.85,0.9,0.88,1)
    node.inputs['Emission Strength'].default_value=0.2
    ink=bpy.data.materials.new('style_clock_type')
    ink.diffuse_color=(0.85,0.83,0.74,1)
    ink.use_nodes=True
    next(n for n in ink.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Base Color'].default_value=(0.85,0.83,0.74,1)
    source=bpy.data.images.get('style_ultrawide_art')
    laptop=bpy.data.images.new('style_laptop_landscape',width=448,height=288)
    src=list(source.pixels)
    pixels=[]
    for y in range(288):
        for x in range(448):
            a=(y*1024+x)*4
            pixels.extend(src[a:a+4])
    laptop.pixels.foreach_set(pixels)
    laptop.pack()
    laptopmat=bpy.data.materials.new('style_laptop_display')
    laptopmat.use_nodes=True
    node=next(n for n in laptopmat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    tex=laptopmat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image=laptop
    for channel in ('Base Color','Emission Color'):laptopmat.node_tree.links.new(tex.outputs['Color'],node.inputs[channel])
    node.inputs['Emission Strength'].default_value=0.6
    node.inputs['Roughness'].default_value=0.3
    for scene in (bpy.data.scenes['Room Light'],bpy.data.scenes['Room Dark']):
        bpy.context.window.scene=scene
        cam=scene.camera
        cam.location=(0.22,-3.45,1.62)
        cam.rotation_euler=(Vector((0.25,0.10,1.15))-cam.location).to_track_quat('-Z','Y').to_euler()
        cam.data.lens=37
        for obj in list(scene.objects):
            if obj.name.startswith(('static_style_screen_name','static_style_screen_stack','static_style_screen_skill','static_style_clock_label','static_style_display_','static_style_clock_city_')):
                bpy.data.objects.remove(obj,do_unlink=True)
                continue
            if obj.name.startswith('static_style_shelf_plant_') and not obj.get('style_supported',False):
                obj.location.z+=0.096
                obj['style_supported']=True
            if obj.name.startswith(('static_style_diffuser','static_style_reed_')) and not obj.get('style_supported',False):
                obj.location.x-=0.40
                obj['style_supported']=True
            if obj.name.startswith('root_world_clock'):
                obj.location.y=-0.027
            if obj.name.startswith('int_monitor_screen'):
                obj.data=obj.data.copy()
                obj.data.materials.clear()
                obj.data.materials.append(laptopmat)
            if obj.type=='LIGHT':
                if 'wall_wash' in obj.name:obj.data.energy=2.5
                if 'wall_top' in obj.name:obj.data.energy=5
                if 'desk_wash' in obj.name:obj.data.energy=3
                if 'daylight' in obj.name and scene.name=='Room Dark':
                    obj.data.energy=16 if 'fill' not in obj.name else 8
                    obj.data.color=(1,0.76,0.50) if 'fill' not in obj.name else (0.76,0.83,1)
        def text(name,value,pos,size,mat):
            data=bpy.data.curves.new(name,'FONT')
            data.body=value
            data.size=size
            data.align_x='CENTER'
            obj=bpy.data.objects.new(name,data)
            scene.collection.objects.link(obj)
            obj.location=pos
            obj.rotation_euler=(math.pi/2,0,0)
            data.materials.append(mat)
            return obj
        def screen_text(name,value,cx,z,size):
            spacing=size*0.60
            for i,char in enumerate(value):
                x=cx+(i-(len(value)-1)/2)*spacing
                y=0.265-0.105*(2*x/1.34)**2-0.0035
                obj=text('static_style_display_'+name+'_'+str(i),char,(x,y,z),size,white)
                obj.rotation_euler.z=math.atan(-0.84*x/(1.34**2))
        screen_text('name',CONTENT['profile']['name'],-0.36,1.23,0.023)
        screen_text('stack',CONTENT['profile']['specialties'],-0.36,1.19,0.013)
        for i,skill in enumerate(CONTENT['skills'][:6]):
            screen_text('skill_'+str(i),skill['name'],0.54,1.24-i*0.036,0.009)
        for city,label in [(c['id'],c['label'].upper()) for c in CONTENT['cities']]:
            roots=[o for o in scene.objects if o.name.startswith('root_world_clock_'+city)]
            if roots:
                root=roots[0]
                text('static_style_clock_city_'+city,label,(root.location.x,0.354,root.location.z-0.168),0.008,ink)
        if scene.name=='Room Dark':
            next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs['Strength'].default_value=0.15
        scene.view_settings.exposure=0.2 if scene.name=='Room Dark' else 0.45
        scene.render.resolution_x=1400
        scene.render.resolution_y=1050
    bpy.context.window.scene=bpy.data.scenes['Room Light']
    bpy.ops.wm.save_as_mainfile(filepath='/Users/davoudfakour/Documents/ChatGPT/Portfolio/tools/blender/review/reference-restyle/room-light-dark.blend')
    print('Refined screen alignment, clock plaques, camera framing and both lighting modes')


def enlarge_desk():
    """Remove the side cabinet and widen the desk while preserving its props."""
    for scene in bpy.data.scenes:
        if not scene.name.startswith('Room '):
            continue
        for obj in scene.objects:
            if obj.name.startswith('static_side_cabinet'):
                obj.hide_render=True
                obj.hide_set(True,view_layer=scene.view_layers[0])
            if obj.name.startswith('static_desk_top'):
                obj.dimensions=(2.05,0.76,0.026)
                obj.location.x=0.08
                obj.location.y=0.02
            if obj.name.startswith('static_desk_panel'):
                obj.dimensions.x=1.99
                obj.location.x=0.08
            if obj.name.startswith('static_desk_leg_l'):
                obj.location.x=-0.890
                obj.location.y=0.02
                obj.dimensions.y=0.67
            if obj.name.startswith('static_desk_leg_r'):
                obj.location.x=1.050
                obj.location.y=0.02
                obj.dimensions.y=0.67
            if obj.name.startswith('static_subwoofer') and not obj.get('style_on_desk',False):
                obj.location.x-=0.065
                obj.location.z-=0.065
                obj['style_on_desk']=True
            if obj.name.startswith('root_clock') and not obj.get('style_on_desk',False):
                obj.location.y-=0.090
                obj.location.z-=0.065
                obj['style_on_desk']=True
        scene.use_fake_user=True


def fix_wall_trim():
    """End the back baseboard inside the illuminated frame, without duplicates."""
    for scene in bpy.data.scenes:
        if not scene.name.startswith('Room '):
            continue
        edges=[obj.location.x for obj in scene.objects
               if obj.name.startswith('static_style_wall_edge_') and not obj.hide_render]
        if len(edges)!=2:
            raise RuntimeError('Expected two illuminated wall frame edges')
        left,right=min(edges),max(edges)
        for obj in scene.objects:
            if obj.name.startswith('static_skirting_back'):
                obj.hide_render=True
                obj.hide_set(True,view_layer=scene.view_layers[0])
            elif obj.name.startswith('static_skirting_right'):
                obj.location.x=1.845
            elif obj.name.startswith('static_style_skirting'):
                obj.dimensions=(right-left,0.016,0.058)
                obj.location=((left+right)/2,0.396,0.029)


def soften_rug():
    """Light oatmeal wool, restrained low pile and rounded, softly bound edges."""
    wool = bpy.data.materials.get('style_soft_wool')
    if wool is None:
        wool = pbr('style_soft_wool', srgb(207,199,183), 0.96)
        nodes, links = wool.node_tree.nodes, wool.node_tree.links
        bsdf = next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
        bsdf.inputs['Sheen Weight'].default_value = 0.32
        bsdf.inputs['Sheen Roughness'].default_value = 0.8
        bsdf.inputs['Specular IOR Level'].default_value = 0.18
        coord = nodes.new('ShaderNodeTexCoord')
        fine = nodes.new('ShaderNodeTexNoise')
        fine.inputs['Scale'].default_value = 430
        fine.inputs['Detail'].default_value = 2
        links.new(coord.outputs['Object'], fine.inputs['Vector'])
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.36
        bump.inputs['Distance'].default_value = 0.0012
        links.new(fine.outputs['Fac'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        broad = nodes.new('ShaderNodeTexNoise')
        broad.inputs['Scale'].default_value = 7
        broad.inputs['Detail'].default_value = 2
        links.new(coord.outputs['Object'], broad.inputs['Vector'])
        tint = nodes.new('ShaderNodeMixRGB')
        tint.inputs[1].default_value = (*srgb(199,190,173),1)
        tint.inputs[2].default_value = (*srgb(213,205,190),1)
        links.new(broad.outputs['Fac'], tint.inputs[0])
        links.new(tint.outputs[0], bsdf.inputs['Base Color'])
    binding = bpy.data.materials.get('style_soft_wool_binding')
    if binding is None:
        binding = pbr('style_soft_wool_binding',srgb(186,177,159),0.98)
    for scene in bpy.data.scenes:
        if not scene.name.startswith('Room '):
            continue
        rug = next((o for o in scene.objects if o.name.startswith('static_style_rug')),None)
        if rug is None:
            continue
        verts, faces = [], []
        # Rounded corners and a raised cushion profile rather than a thin box.
        for w,d,r,z in ((2.55,0.9,0.04,0.001),(2.55,0.9,0.04,0.006),(2.536,0.886,0.047,0.014)):
            for x,y,start in ((w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)):
                for i in range(13):
                    a = math.radians(start+i*90/12)
                    verts.append((x+r*math.cos(a),y+r*math.sin(a),z))
        count = 52
        faces.append(tuple(reversed(range(count))))
        for ring in range(2):
            for i in range(count):
                j=(i+1)%count
                faces.append((ring*count+i,ring*count+j,(ring+1)*count+j,(ring+1)*count+i))
        faces.append(tuple(range(count*2,count*3)))
        mesh = bpy.data.meshes.new('Soft wool carpet')
        mesh.from_pydata(verts,[],faces)
        mesh.materials.append(wool)
        mesh.materials.append(binding)
        for poly in mesh.polygons:
            poly.material_index = 1 if poly.index <= count else 0
            poly.use_smooth = poly.index not in (0,len(faces)-1)
        rug.data = mesh
        rug.modifiers.clear()
        rug.location = (0,-1.02,0)
        rug.scale = (1,1,1)
        rug['finish'] = 'Minimal oatmeal wool; soft low pile; narrow tonal binding'
        scene.use_fake_user = True


def apply(content, remove_monkey=False, clock_angles=None):
    global CONTENT, CLOCK_ANGLES
    CONTENT=content
    CLOCK_ANGLES=clock_angles or {}
    _apply_layout(remove_monkey)
    refine()
    enlarge_desk()
    fix_wall_trim()
    soften_rug()
    bpy.ops.wm.save_as_mainfile(filepath=REVIEW+'/room-light-dark.blend')
