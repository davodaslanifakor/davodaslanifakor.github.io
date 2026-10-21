"""Blender MCP safe-mode recipe for the Space Black 16-inch MacBook Pro.

Reference: https://support.apple.com/en-us/121554 (2024 enclosure).
Overall dimensions are published; small detail dimensions are visual estimates.
Send this source literally through MCP, then update_macbook(keyboard_rows).
Preserves interaction object identities, hinge parenting and screen UV contract.
"""
import bpy
import math
from mathutils import Vector

MAC_REVIEW = '/Users/davoudfakour/Documents/ChatGPT/Portfolio/tools/blender/review/reference-restyle'

def mac_material(name, rgb, metallic=0, roughness=0.4):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    color = tuple(v/255/12.92 if v/255 <= 0.04045 else ((v/255+0.055)/1.055)**2.4 for v in rgb)
    node = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Metallic'].default_value = metallic
    node.inputs['Roughness'].default_value = roughness
    mat.diffuse_color = (*color, 1)
    return mat

def mac_slab_geometry(w, h, t, radius, center=(0,0,0), steps=6):
    points = []
    for x,y,start in ((w/2-radius,h/2-radius,0),(-w/2+radius,h/2-radius,90),(-w/2+radius,-h/2+radius,180),(w/2-radius,-h/2+radius,270)):
        for i in range(steps+1):
            a = math.radians(start+i*90/steps)
            points.append((x+radius*math.cos(a),y+radius*math.sin(a)))
    count = len(points)
    verts = [(x+center[0],y+center[1],z+center[2]) for z in (-t/2,t/2) for x,y in points]
    faces = [tuple(reversed(range(count))),tuple(range(count,count*2))]
    faces += [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    return verts, faces

def mac_mesh(name, verts, faces, parent, mat, existing=None):
    mesh = bpy.data.meshes.new(name+'_mesh')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = existing or bpy.data.objects.new(name, mesh)
    if existing:
        obj.data = mesh
        obj.modifiers.clear()
    else:
        bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = (0,0,0)
    obj.rotation_euler = (0,0,0)
    obj.scale = (1,1,1)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj

def mac_slab(name, size, center, parent, mat, existing=None, radius=0.001, edge=0.0002):
    verts, faces = mac_slab_geometry(*size, radius, center)
    obj = mac_mesh(name, verts, faces, parent, mat, existing)
    if edge:
        mod = obj.modifiers.new('Manufactured edge', 'BEVEL')
        mod.width = edge
        mod.segments = 3
    return obj

def mac_disk(name, radius, position, parent, mat, rotation=(0,0,0)):
    verts = [(radius*math.cos(i*math.tau/24),radius*math.sin(i*math.tau/24),0) for i in range(24)]
    obj = mac_mesh(name,verts,[tuple(range(24))],parent,mat)
    obj.location = position
    obj.rotation_euler = rotation
    return obj

def update_macbook(keyboard_rows):
    body = mac_material('mac_space_black_aluminium',(49,50,52),0.78,0.34)
    pad = mac_material('mac_space_black_trackpad',(45,46,48),0.52,0.43)
    keys = mac_material('mac_keycaps',(18,19,21),0,0.55)
    black = mac_material('mac_recess',(4,5,6),0,0.4)
    rim = mac_material('mac_machined_rim',(68,69,72),0.85,0.3)
    legend_mat = mac_material('mac_key_legends',(183,185,190),0,0.6)
    for scene in bpy.data.scenes:
        if not scene.name.startswith('Room '):
            continue
        bpy.context.window.scene = scene
        root = next(o for o in scene.objects if o.name.split('.')[0] == 'root_laptop')
        parts = {o.name.split('.')[0]:o for o in root.children_recursive}
        # Rerunning replaces the generated details, rather than stacking them.
        for obj in list(root.children_recursive):
            if obj.name.startswith('static_mac_'):
                bpy.data.objects.remove(obj,do_unlink=True)
        if not root.get('macbook_refined'):
            root.location.z -= 0.0024
        root['macbook_refined'] = True
        root['reference'] = 'Apple MacBook Pro (16-inch, 2024), Space Black'
        root['closed_dimensions_m'] = (0.3557,0.2481,0.0168)
        mac_slab('int_monitor',(0.3557,0.2481,0.0122),(0,0,0),root,body,parts['int_monitor'],0.008,0.00065)
        mac_slab('static_laptop_keyboard',(0.281,0.109,0.00025),(0,0.0415,0.0062),root,black,parts['static_laptop_keyboard'],0.004,0)
        mac_slab('static_laptop_trackpad',(0.159,0.098,0.0002),(0,-0.068,0.00635),root,pad,parts['static_laptop_trackpad'],0.004,0.00005)
        # Fine engraved perimeter beneath the flush trackpad.
        mac_slab('static_mac_trackpad_seam',(0.160,0.099,0.00012),(0,-0.068,0.0062),root,black, radius=0.0045,edge=0)
        mac_slab('static_mac_thumb_recess',(0.021,0.002,0.002),(0,-0.1235,0.0054),root,black,radius=0.0007,edge=0)
        hinge = parts['static_laptop_hinge']
        hinge.data = hinge.data.copy()
        hinge.data.materials.clear()
        hinge.data.materials.append(black)
        hinge.location = (0,0.1195,0.0068)
        lid_root = parts['root_laptop_lid']
        lid_root.location = (0,0.12405,0.0059)
        mac_slab('int_monitor__2',(0.3557,0.2481,0.0046),(0,0.12405,0),lid_root,body,parts['int_monitor__2'],0.008,0.0004)
        mac_slab('static_laptop_bezel',(0.351,0.241,0.00015),(0,0.12405,0.00235),lid_root,black,parts['static_laptop_bezel'],0.006,0)
        screen = parts['int_monitor_screen']
        screen.data = screen.data.copy()
        screen.scale = (1,1,1)
        screen.dimensions = (0.3445,0.2233,0)
        screen.location = (0,0.1275,0.00255)
        mac_slab('static_laptop_notch',(0.028,0.0078,0.0002),(0,0.2356,0.0028),lid_root,black,parts['static_laptop_notch'],0.0018,0)
        mac_disk('static_mac_camera',0.00085,(0,0.2367,0.00293),lid_root,rim)
        mac_disk('static_mac_camera_glass',0.0005,(0,0.2367,0.00295),lid_root,black)
        # Six full-height rows; half-height arrows share the final row.
        verts, faces, key_positions = [],[],[]
        panel_w, pitch = 0.275,0.0176
        for row_i,row in enumerate(keyboard_rows[:6]):
            total = sum(k['width'] for k in row)
            # Bottom modifiers and spacebar leave three key pitches for arrows.
            row_width = panel_w if row_i < 5 else panel_w-0.055
            unit = row_width/total
            x = -panel_w/2
            y = 0.0855-row_i*pitch
            for key in row:
                width = key['width']*unit
                pos = (x+width/2,y,0.0069)
                v,f = mac_slab_geometry(width-0.0015,0.0157,0.0012,0.0018,pos,3)
                offset = len(verts)
                verts.extend(v)
                faces.extend(tuple(index+offset for index in face) for face in f)
                key_positions.append((key['id'],key['legend'],pos))
                x += width
        for i,(key_id,label,x,y) in enumerate((('left','←',0.0935,-0.0067),('down','↓',0.1115,-0.0067),('right','→',0.1295,-0.0067),('up','↑',0.1115,0.0014))):
            pos = (x,y,0.0069)
            v,f = mac_slab_geometry(0.0165,0.0068,0.0012,0.0012,pos,3)
            offset = len(verts)
            verts.extend(v)
            faces.extend(tuple(index+offset for index in face) for face in f)
            key_positions.append((key_id,label,pos))
        caps = mac_mesh('static_laptop_keycaps',verts,faces,root,keys,parts['static_laptop_keycaps'])
        caps['key_count'] = len(key_positions)
        assert len(key_positions) == 78
        for key_id,label,pos in key_positions:
            if key_id == 'touch-id':
                mac_disk('static_mac_touch_id_ring',0.0053,(pos[0],pos[1],0.00755),root,rim)
                mac_disk('static_mac_touch_id_sensor',0.0049,(pos[0],pos[1],0.00757),root,black)
            elif label:
                curve = bpy.data.curves.new('Mac legend','FONT')
                curve.body = label
                curve.size = 0.0024 if len(label)>2 else 0.003
                curve.align_x = 'CENTER'
                curve.align_y = 'CENTER'
                obj = bpy.data.objects.new('static_mac_key_'+key_id,curve)
                bpy.context.collection.objects.link(obj)
                obj.parent = root
                obj.location = (pos[0],pos[1],0.00755)
                curve.materials.append(legend_mat)
        # Dense grilles are one mesh, keeping detail draw calls low.
        dots, dot_faces = [],[]
        for side in (-1,1):
            for col in range(9):
                for row in range(50):
                    cx,cy = side*(0.148+col*0.0025),-0.014+row*0.0023
                    offset = len(dots)
                    dots.extend((cx+0.0004*math.cos(i*math.tau/6),cy+0.0004*math.sin(i*math.tau/6),0.00618) for i in range(6))
                    dot_faces.append(tuple(range(offset,offset+6)))
        mac_mesh('static_mac_speaker_grilles',dots,dot_faces,root,black)
        # Port openings lie on each vertical side, positioned from Apple's photos.
        for side,ports in ((-1,(('magsafe',0.091,0.012,0.003),('usb_c_1',0.067,0.009,0.003),('usb_c_2',0.043,0.009,0.003),('headphone',0.017,0.0035,0.0035))),(1,(('hdmi',0.085,0.014,0.004),('usb_c_3',0.054,0.009,0.003),('sdxc',0.022,0.024,0.002)))):
            for name,y,w,h in ports:
                port = mac_slab('static_mac_port_'+name,(w,h,0.00012),(0,0,0),root,black,radius=min(h/3,0.0008),edge=0)
                port.location = (side*0.17788,y,-0.0003)
                port.rotation_euler = (math.pi/2,0,side*math.pi/2)
        scene.use_fake_user = True
        bpy.context.view_layer.update()
        assert screen.data.uv_layers.active and len(screen.data.vertices)==4
        assert all(abs(v.co.z)<0.000001 for v in screen.data.vertices)
        print(scene.name,'Space Black MacBook updated:',len(key_positions),'keys, flat editor surface retained')
    bpy.context.window.scene = bpy.data.scenes['Room Light']

def render_macbook_previews():
    for name,filename in (('Room Light','room-light.png'),('Room Dark','room-dark.png')):
        scene = bpy.data.scenes[name]
        bpy.context.window.scene = scene
        scene.render.filepath = MAC_REVIEW+'/'+filename
        bpy.ops.render.render(write_still=True)
    scene = bpy.data.scenes['Room Light']
    bpy.context.window.scene = scene
    camera = scene.camera
    camera_data = bpy.data.cameras.new('MacBook detail camera')
    detail = bpy.data.objects.new('MacBook detail camera',camera_data)
    scene.collection.objects.link(detail)
    root = next(o for o in scene.objects if o.name == 'root_laptop')
    detail.location = root.matrix_world @ Vector((0.34,-0.53,0.35))
    target = root.matrix_world @ Vector((0,0.025,0.085))
    detail.rotation_euler = (target-detail.location).to_track_quat('-Z','Y').to_euler()
    camera_data.lens = 42
    scene.camera = detail
    scene.render.filepath = MAC_REVIEW+'/macbook-detail.png'
    bpy.ops.render.render(write_still=True)
    scene.camera = camera
    bpy.data.objects.remove(detail,do_unlink=True)
    bpy.ops.wm.save_as_mainfile(filepath=MAC_REVIEW+'/room-light-dark.blend')
