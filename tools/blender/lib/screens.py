"""The two monitors and the laptop.

Screen surfaces are separate flat meshes with clean 0-1 UVs, because the runtime
replaces their material with a generated pixel-art canvas texture (DESK_PLAN.md
"Screen content"). Here they carry an emissive stand-in so Blender previews match
the reference, and so the GLB stays free of baked screen imagery.

Every part is authored in its root's LOCAL space and the root is posed last.
"""

import math
import json
import os
from mathutils import Vector
from . import materials as M
from . import desk as D
from .util import box, plane, cylinder, bevel, smooth, empty, parent_to, tube, catmull_rom

PANEL_W = 0.615
PANEL_H = 0.362
SCREEN_W = 0.578
SCREEN_H = 0.325
MONITOR_Y = D.WALL_Y - 0.150

BACK_HUMP = 0.022
VESA_Y = 0.010 + BACK_HUMP + 0.010  # local back face of the VESA plate
LEFT = {'x': -0.338, 'z': 1.124, 'yaw': math.radians(11.0)}
RIGHT = {'x': 0.372, 'z': 1.074, 'yaw': math.radians(-13.5)}


def _asus_logo_image():
    from . import texpaint as TP
    c = TP.Canvas(256, 48, background=TP.srgb(10, 10, 11))
    c.text("ASUS", (0.5, 0.5), 0.46, TP.srgb(120, 122, 128), stretch=1.25, bold=0.004)
    return c.to_image("asus_logo")


def _monitor(name_id, cfg):
    """One monitor panel: thin top and side bezels, a deeper chin carrying the
    ASUS mark, and a thicker rear housing the VESA plate mounts flush against.
    The screen plane itself is unchanged (runtime pixel-art canvas)."""
    from . import texpaint as TP
    root = empty(f"root_{name_id}")
    side, top, chin = 0.007, 0.007, 0.022
    screen_z = cfg['z'] + 0.006
    shell_w = SCREEN_W + 2 * side
    shell_h = SCREEN_H + top + chin
    shell_z = screen_z + (top - chin) / 2

    shell = box(f"static_{name_id}_shell", (shell_w, 0.020, shell_h), location=(0.0, 0.0, shell_z))
    M.assign(shell, M.bezel())
    bevel(shell, width=0.0025, segments=2)
    smooth(shell)

    hump = box(f"static_{name_id}_housing", (0.42, BACK_HUMP + 0.004, 0.25),
               location=(0.0, 0.010 + BACK_HUMP / 2 - 0.002, cfg['z']))
    M.assign(hump, M.bezel())
    bevel(hump, width=0.008, segments=3)
    smooth(hump)

    # Faces local -Y (toward the viewer): Rx(+90deg) maps local +Z onto -Y.
    screen = plane(f"int_{name_id}", (SCREEN_W, SCREEN_H),
                   location=(0.0, -0.011, screen_z),
                   rotation=(math.pi / 2, 0, 0))
    M.assign(screen, M.screen_green())

    logo = plane(f"static_{name_id}_logo", (0.040, 0.0075),
                 location=(0.0, -0.0102, screen_z - SCREEN_H / 2 - chin / 2),
                 rotation=(math.pi / 2, 0, 0))
    M.assign(logo, TP.textured("asus_logo", _ASUS_IMAGE[0] if _ASUS_IMAGE else _asus_logo_cached(), roughness=0.4))

    mount = box(f"static_{name_id}_vesa", (0.105, 0.010, 0.105),
                location=(0.0, VESA_Y - 0.005, cfg['z']))
    M.assign(mount, M.pbr("monitor_arm", (0.060, 0.062, 0.066), roughness=0.38, metallic=0.6))
    bevel(mount, width=0.004, segments=2)

    for part in (shell, hump, screen, logo, mount):
        parent_to(part, root)

    root.location = (cfg['x'], MONITOR_Y, 0.0)
    root.rotation_euler = (0.0, 0.0, cfg['yaw'])
    return root, screen, [shell, hump, logo, mount]


_ASUS_IMAGE = []


def _asus_logo_cached():
    _ASUS_IMAGE.append(_asus_logo_image())
    return _ASUS_IMAGE[0]


def _link(name, start, end, width, height, material):
    """Box link spanning exactly two joint centres; its local X stays horizontal."""
    start_v, end_v = Vector(start), Vector(end)
    delta = end_v - start_v
    arm = box(name, (width, height, delta.length), location=tuple((start_v + end_v) / 2))
    arm.rotation_mode = 'QUATERNION'
    up = Vector((0, 0, 1)) if abs(delta.normalized().z) < 0.95 else Vector((0, 1, 0))
    arm.rotation_quaternion = delta.to_track_quat('Z', 'Y' if up.z == 0 else 'Y')
    # Roll so the link's height axis lies in the vertical plane of the link.
    side = delta.cross(up).normalized()
    normal = side.cross(delta).normalized()
    q = arm.rotation_quaternion
    current = q @ Vector((0, 1, 0))
    import math as _m
    angle = current.angle(normal) if current.length and normal.length else 0.0
    if current.cross(normal).dot(delta) < 0:
        angle = -angle
    from mathutils import Quaternion
    arm.rotation_quaternion = Quaternion(delta.normalized(), angle) @ q
    M.assign(arm, material)
    bevel(arm, width=min(width, height) * 0.2, segments=3)
    return arm


def _pivot(name, location, axis, radius, length, material):
    """Cylinder pivot centred on a joint, its axis along `axis`."""
    joint = cylinder(name, radius, length, segments=28, location=tuple(location))
    joint.rotation_mode = 'QUATERNION'
    joint.rotation_quaternion = Vector(axis).to_track_quat('Z', 'Y')
    M.assign(joint, material)
    bevel(joint, width=min(radius, length) * 0.15, segments=2)
    smooth(joint)
    return joint


def _vesa_frame(cfg):
    """World centre of a panel's VESA plate back face, and the panel's back/right vectors."""
    yaw = cfg['yaw']
    back = Vector((-math.sin(yaw), math.cos(yaw), 0.0))
    right = Vector((math.cos(yaw), math.sin(yaw), 0.0))
    centre = Vector((cfg['x'], MONITOR_Y, cfg['z'])) + back * VESA_Y
    return centre, back, right


POLE_Y = D.DESK_BACK_Y - 0.020
POLE_TOP = 0.905
SHOULDER_Z = {'left': 0.842, 'right': 0.878}
ELBOW_XY = {'left': (-0.215, 0.352), 'right': (0.215, 0.352)}


def _build_monitor_arms():
    """Dual gas-spring arm on one pole, clamped to the rear desk edge.

    The exact product is not identifiable from the front photographs; this is a
    restrained, plausible spider/hydraulic arm. Every part is placed from shared
    joint coordinates (clamp -> pole -> shoulder -> elbow -> wrist -> VESA), so no
    segment can drift away from its neighbour.
    """
    dark = M.pbr("monitor_arm", (0.060, 0.062, 0.066), roughness=0.38, metallic=0.6)
    chrome = M.pbr("monitor_arm_chrome", (0.55, 0.56, 0.58), roughness=0.22, metallic=0.95)
    cable = M.pbr("monitor_cable", (0.018, 0.018, 0.020), roughness=0.55)
    parts = []
    up = Vector((0, 0, 1))
    desk_under = D.DESK_TOP - 0.026

    # C-clamp: top plate on the desk, spine down the back edge, jaw under the
    # desk, and a screw driving a pressure pad against the underside.
    spine_y = D.DESK_BACK_Y + 0.009
    top_plate = box("static_monitor_arm_clamp_upper", (0.075, D.DESK_BACK_Y + 0.015 - (POLE_Y - 0.045), 0.012),
                    location=(0.0, (D.DESK_BACK_Y + 0.015 + POLE_Y - 0.045) / 2, D.DESK_TOP + 0.006))
    spine = box("static_monitor_arm_clamp_spine", (0.060, 0.012, 0.012 + 0.026 + 0.034),
                location=(0.0, spine_y, D.DESK_TOP + 0.012 - (0.012 + 0.026 + 0.034) / 2))
    jaw_z = desk_under - 0.028
    jaw = box("static_monitor_arm_clamp_lower", (0.060, 0.075, 0.012),
              location=(0.0, spine_y + 0.006 - 0.0375, jaw_z))
    pad = cylinder("static_monitor_arm_clamp_pad", 0.017, 0.004, segments=24,
                   location=(0.0, POLE_Y - 0.010, desk_under - 0.002))
    screw = cylinder("static_monitor_arm_clamp_screw", 0.0055, (desk_under - 0.004) - (jaw_z - 0.006),
                     segments=16, location=(0.0, POLE_Y - 0.010,
                                            ((desk_under - 0.004) + (jaw_z - 0.006)) / 2))
    knob = cylinder("static_monitor_arm_clamp_knob", 0.016, 0.010, segments=20,
                    location=(0.0, POLE_Y - 0.010, jaw_z - 0.011))
    for part in (top_plate, spine, jaw, knob):
        M.assign(part, dark)
        bevel(part, width=0.002, segments=2)
    for part in (pad, screw):
        M.assign(part, chrome)
    parts += [top_plate, spine, jaw, pad, screw, knob]

    pole = cylinder("static_monitor_arm_mast", 0.019, POLE_TOP - (D.DESK_TOP + 0.012), segments=32,
                    location=(0.0, POLE_Y, (POLE_TOP + D.DESK_TOP + 0.012) / 2))
    M.assign(pole, dark)
    smooth(pole)
    cap = cylinder("static_monitor_arm_hub", 0.021, 0.008, segments=32,
                   location=(0.0, POLE_Y, POLE_TOP + 0.004))
    M.assign(cap, chrome)
    base_collar = cylinder("static_monitor_arm_base_collar", 0.030, 0.014, segments=32,
                           location=(0.0, POLE_Y, D.DESK_TOP + 0.019))
    M.assign(base_collar, dark)
    parts += [pole, cap, base_collar]

    pole_axis = Vector((0.0, POLE_Y, 0.0))
    for side, cfg in (("left", LEFT), ("right", RIGHT)):
        vesa, back, right = _vesa_frame(cfg)
        wrist_tilt = vesa + back * 0.020
        wrist_swivel = vesa + back * 0.048
        elbow = Vector((*ELBOW_XY[side], wrist_swivel.z))
        collar_c = pole_axis + Vector((0, 0, SHOULDER_Z[side]))
        horizontal = (elbow - collar_c)
        horizontal.z = 0
        heading = horizontal.normalized()
        shoulder = collar_c + heading * 0.034

        parts.append(_pivot(f"static_monitor_arm_{side}_collar", collar_c, up, 0.028, 0.030, dark))
        parts.append(_link(f"static_monitor_arm_{side}_shoulder_block", collar_c, shoulder + heading * 0.004,
                           0.034, 0.030, dark))
        tilt_axis = heading.cross(up).normalized()
        parts.append(_pivot(f"static_monitor_arm_{side}_shoulder", shoulder, tilt_axis, 0.016, 0.040, chrome))

        # Parallelogram upper arm: two bars plus a gas spring between them.
        lift = elbow - shoulder
        normal = tilt_axis.cross(lift).normalized()
        if normal.z < 0:
            normal = -normal
        for offset, tag in ((0.011, 'upper'), (-0.011, 'lower')):
            parts.append(_link(f"static_monitor_arm_{side}_{tag}", shoulder + normal * offset,
                               elbow + normal * offset, 0.030, 0.008, dark))
        s0 = shoulder + lift * 0.18
        s1 = shoulder + lift * 0.80
        spring_body = _link(f"static_monitor_arm_{side}_spring", s0, s0 + (s1 - s0) * 0.58, 0.010, 0.010, dark)
        spring_rod = tube(f"static_monitor_arm_{side}_spring_rod", [s0 + (s1 - s0) * 0.55, s1], 0.0028, segments=10)
        M.assign(spring_rod, chrome)
        parts += [spring_body, spring_rod]
        parts.append(_pivot(f"static_monitor_arm_{side}_elbow_tilt", elbow, tilt_axis, 0.016, 0.040, chrome))
        parts.append(_pivot(f"static_monitor_arm_{side}_elbow", elbow + Vector((0, 0, -0.004)), up,
                            0.018, 0.046, dark))

        parts.append(_link(f"static_monitor_arm_{side}_forearm", elbow, wrist_swivel, 0.028, 0.022, dark))
        parts.append(_pivot(f"static_monitor_arm_{side}_wrist", wrist_swivel, up, 0.015, 0.040, dark))
        parts.append(_link(f"static_monitor_arm_{side}_wrist_neck", wrist_swivel, wrist_tilt, 0.022, 0.018, dark))
        parts.append(_pivot(f"static_monitor_arm_{side}_tilt", wrist_tilt, right, 0.011, 0.056, chrome))
        parts.append(_link(f"static_monitor_arm_{side}_plate_neck", wrist_tilt, vesa, 0.040, 0.030, dark))

        # Cable: from the panel's lower ports, clipped under the arm, with slack
        # at the elbow, down the back of the pole to the desk.
        port = Vector((cfg['x'], MONITOR_Y, cfg['z'] - 0.120)) + back * 0.004 + right * 0.03
        path = [
            port, port + back * 0.022 + Vector((0, 0, 0.004)),
            wrist_swivel + Vector((0, 0, -0.030)),
            (elbow + wrist_swivel) / 2 + Vector((0, 0, -0.022)),
            elbow + Vector((0, 0, -0.038)),
            shoulder + lift * 0.5 - normal * 0.028,
            collar_c + Vector((0, 0.030, -0.030)),
            Vector((0, POLE_Y + 0.026, (collar_c.z + D.DESK_TOP) / 2)),
            Vector((0.02 * (-1 if side == 'left' else 1), POLE_Y + 0.030, D.DESK_TOP + 0.006)),
            Vector((0.12 * (-1 if side == 'left' else 1), D.DESK_BACK_Y - 0.006, D.DESK_TOP + 0.0035)),
        ]
        wire = tube(f"static_monitor_arm_{side}_cable", catmull_rom(path, 6), 0.0032, segments=8)
        M.assign(wire, cable)
        parts.append(wire)

    return parts


def build_monitors():
    left_root, left_screen, left_static = _monitor("screen_left", LEFT)
    right_root, right_screen, right_static = _monitor("screen_right", RIGHT)
    supports = _build_monitor_arms()
    return {
        'roots': [left_root, right_root],
        'screens': [left_screen, right_screen],
        'static': left_static + right_static + supports,
    }


BASE_W = 0.355
BASE_D = 0.248
BASE_T = 0.017
LAPTOP_OPEN_ANGLE_DEG = 110.0
# The authored lid points along +Y while the base-front ray points along -Y,
# so the interior physical opening is 180° minus this hinge rotation.
LID_ANGLE = math.radians(180.0 - LAPTOP_OPEN_ANGLE_DEG)
RISER_TILT = math.radians(5.5)
LAPTOP_X = 0.020
LAPTOP_FRONT_Y = -0.285
LAPTOP_CENTRE_Y = LAPTOP_FRONT_Y + BASE_D / 2
LAPTOP_BASE_Z = D.DESK_TOP + 0.045


def _keyboard_image():
    """Legended ANSI keyboard texture sourced from portfolio.ts and exported JSON."""
    from . import texpaint as TP
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generated", "room-content.json")
    with open(json_path, "r", encoding="utf-8") as source:
        rows = json.load(source)["keyboardRows"]
    width, height = 1024, 448
    c = TP.Canvas(width, height, background=TP.srgb(43, 45, 47))
    key = TP.srgb(18, 20, 21)
    edge = TP.srgb(73, 77, 78)
    legend = TP.srgb(174, 180, 174)
    gap, row_gap = 0.018, 0.018
    row_heights = [0.57, 1, 1, 1, 1, 1, 0.58, 0.48]
    unit_h = (1 - row_gap * (len(rows) + 1)) / sum(row_heights)
    base_unit_w = (1 - gap * (len(rows[1]) + 1)) / sum(item["width"] for item in rows[1])
    rects = {}
    top = 1 - row_gap
    for ri, row in enumerate(rows):
        rh = row_heights[ri]
        bottom = top - unit_h * rh
        sum_width = sum(item["width"] for item in row)
        unit_w = (1 - gap * (len(row) + 1)) / sum_width
        x = gap
        for item in row:
            kw = item["width"] * (base_unit_w if "at" in item else unit_w)
            if "at" in item:
                cx = item["at"]
                x0, x1 = cx - kw / 2, cx + kw / 2
            else:
                x0, x1 = x, x + kw
                x = x1 + gap
            y0, y1 = bottom + row_gap * 0.25, top - row_gap * 0.25
            key_color = TP.srgb(57, 60, 55) if item["id"] == "touch-id" else key
            c.rect(x0, y0, x1, y1, key_color)
            c.line((x0, y1 - 0.002), (x1, y1 - 0.002), 0.0018, edge)
            c.line((x0 + 0.002, y0 + 0.003), (x0 + 0.002, y1 - 0.003), 0.0013, edge)
            if item.get("legend"):
                small = item["legend"] in ("caps lock", "return", "delete", "shift", "tab")
                c.text(item["legend"], ((x0 + x1) / 2, (y0 + y1) / 2),
                       0.015 if small else (0.022 if ri == 0 else 0.028), legend)
            rects[item["id"]] = (x0, y0, x1, y1)
        top = bottom - row_gap
    return c.to_image("laptop_keyboard"), rects


def _build_keycaps(root, image_rects, keyboard_material):
    """Build one lightweight keycap mesh with atlas UVs.

    Blender's object-join operator is unavailable from the MCP console context.
    Combine the local mesh data directly so the keys cannot be left behind on
    the desk when the laptop root is posed.
    """
    import bpy
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generated", "room-content.json")
    with open(json_path, "r", encoding="utf-8") as source:
        rows = json.load(source)["keyboardRows"]
    vertices, faces, loop_uvs = [], [], []
    panel_w, panel_h = 0.300, 0.128
    for row in rows:
        for item in row:
            x0, y0, x1, y1 = image_rects[item["id"]]
            cap = box(f"_laptop_key_{item['id']}", ((x1 - x0) * panel_w, (y1 - y0) * panel_h, 0.0012),
                      ((x0 + x1 - 1) * panel_w / 2,
                       0.040 + (y0 + y1 - 1) * panel_h / 2, BASE_T / 2 + 0.0006))
            uv = cap.data.uv_layers.new(name="UVMap")
            for poly in cap.data.polygons:
                for li in poly.loop_indices:
                    vi = cap.data.loops[li].vertex_index
                    vert = cap.data.vertices[vi].co
                    if poly.normal.z > 0.9:
                        u = x0 + (vert.x / ((x1 - x0) * panel_w) + 0.5) * (x1 - x0)
                        v = y0 + (vert.y / ((y1 - y0) * panel_h) + 0.5) * (y1 - y0)
                    else:
                        u, v = 0.5, 0.5
                    uv.data[li].uv = (u, v)
            offset = len(vertices)
            vertices.extend(tuple(cap.matrix_local @ vert.co) for vert in cap.data.vertices)
            uv_layer = cap.data.uv_layers.active
            for poly in cap.data.polygons:
                faces.append(tuple(offset + cap.data.loops[li].vertex_index for li in poly.loop_indices))
                loop_uvs.extend(tuple(uv_layer.data[li].uv) for li in poly.loop_indices)
            bpy.data.objects.remove(cap, do_unlink=True)
    mesh = bpy.data.meshes.new("static_laptop_keycaps")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(keyboard_material)
    uv = mesh.uv_layers.new(name="UVMap")
    for li, coords in enumerate(loop_uvs):
        uv.data[li].uv = coords
    joined = bpy.data.objects.new("static_laptop_keycaps", mesh)
    bpy.context.collection.objects.link(joined)
    bevel(joined, width=0.00035, segments=1)
    smooth(joined)
    parent_to(joined, root)
    return joined


def _laptop_to_world(p):
    """Laptop-root local point to world, matching build_laptop's root pose."""
    x, y, z = p
    ct, st = math.cos(RISER_TILT), math.sin(RISER_TILT)
    return Vector((LAPTOP_X + x, LAPTOP_CENTRE_Y + y * ct - z * st, LAPTOP_BASE_Z + y * st + z * ct))


def measure_laptop_opening_deg(root, lid_root):
    """Measure the physical angle between the base-front and lid-top rays."""
    from math import degrees
    import bpy
    bpy.context.view_layer.update()
    hinge = root.matrix_world @ Vector((0.0, BASE_D / 2, 0.0))
    base_front = root.matrix_world @ Vector((0.0, -BASE_D / 2, 0.0))
    lid_top = lid_root.matrix_world @ Vector((0.0, BASE_D / 2, 0.0))
    base_ray = (base_front - hinge).normalized()
    lid_ray = (lid_top - hinge).normalized()
    return degrees(math.acos(max(-1.0, min(1.0, base_ray.dot(lid_ray)))))


def build_laptop():
    """Laptop on its riser, lid open to the reference angle.

    The lid hangs off its own empty so the runtime has a named hinge pivot to
    animate; int_monitor_screen rides with it and is left exactly as the CSS3D
    editor expects (size, local +Z normal, 0-1 UVs, hierarchy).
    """
    from .util import sheet
    from . import texpaint as TP
    root = empty("root_laptop")
    half_t = BASE_T / 2

    # Base: flat underside, top chamfering down over the last few millimetres
    # at the front so the leading edge reads thinner, as on the real machine.
    fy, by = -BASE_D / 2, BASE_D / 2
    profile = [(fy, -half_t), (by, -half_t), (by, half_t - 0.001), (by - 0.002, half_t),
               (fy + 0.010, half_t), (fy + 0.001, half_t - 0.0045), (fy, half_t - 0.0065)]
    base = sheet("int_monitor", profile, BASE_W, 'YZ', offset=-BASE_W / 2)
    M.assign(base, M.laptop_body())
    bevel(base, width=0.0022, segments=3)
    smooth(base)

    keyboard = plane("static_laptop_keyboard", (0.300, 0.128), location=(0.0, 0.040, half_t + 0.0003))
    keyboard_image, key_rects = _keyboard_image()
    keyboard_material = TP.textured("laptop_keyboard", keyboard_image, roughness=0.7)
    M.assign(keyboard, keyboard_material)
    keycaps = _build_keycaps(root, key_rects, keyboard_material)

    trackpad = box("static_laptop_trackpad", (0.160, 0.094, 0.0008),
                   location=(0.0, -0.066, half_t + 0.0002))
    M.assign(trackpad, M.pbr("trackpad", (0.060, 0.062, 0.066), roughness=0.16, metallic=0.2))
    bevel(trackpad, width=0.0003, segments=1)

    hinge = cylinder("static_laptop_hinge", 0.0042, BASE_W - 0.070, segments=20,
                     location=(0.0, BASE_D / 2 - 0.004, half_t + 0.0005), rotation=(0, math.pi / 2, 0))
    M.assign(hinge, M.pbr("laptop_hinge", (0.03, 0.03, 0.033), roughness=0.4, metallic=0.5))

    lid_root = empty("root_laptop_lid", location=(0.0, BASE_D / 2, 0.0))
    lid_root.rotation_euler = (LID_ANGLE, 0.0, 0.0)

    lid = box("int_monitor__2", (BASE_W, BASE_D, 0.006),
              location=(0.0, BASE_D / 2, 0.0))
    M.assign(lid, M.laptop_body())
    bevel(lid, width=0.0018, segments=3)
    smooth(lid)

    # Thin black bezel between the aluminium edge and the panel, with the notch.
    bezel = plane("static_laptop_bezel", (BASE_W - 0.008, BASE_D - 0.008),
                  location=(0.0, BASE_D / 2, 0.0031))
    M.assign(bezel, M.pbr("laptop_bezel", (0.008, 0.008, 0.009), roughness=0.2))
    notch = box("static_laptop_notch", (0.030, 0.0065, 0.0008),
                location=(0.0, BASE_D - 0.015 - 0.0032, 0.0037))
    M.assign(notch, M.pbr("laptop_bezel", (0.008, 0.008, 0.009), roughness=0.2))

    # Contract mesh: flat, faces local +Z, UVs 0-1, hosts the CSS3D editor.
    screen = plane("int_monitor_screen", (BASE_W - 0.024, BASE_D - 0.030),
                   location=(0.0, BASE_D / 2, 0.0035))
    M.assign(screen, M.screen_amber())

    for part in (lid, bezel, notch, screen):
        parent_to(part, lid_root)
    parent_to(lid_root, root)
    for part in (base, keyboard, trackpad, hinge):
        parent_to(part, root)

    root.location = (LAPTOP_X, LAPTOP_CENTRE_Y, LAPTOP_BASE_Z)
    root.rotation_euler = (RISER_TILT, 0.0, 0.0)
    measured_angle = measure_laptop_opening_deg(root, lid_root)
    if abs(measured_angle - LAPTOP_OPEN_ANGLE_DEG) > 0.5:
        raise AssertionError(f"Laptop physical opening is {measured_angle:.3f}°, expected 110°")
    return {
        'root': root,
        'lid_root': lid_root,
        'screen': screen,
        'opening_angle_deg': measured_angle,
        'static': [base, keyboard, trackpad, hinge, lid, bezel, notch],
    }


def build_riser():
    """Aluminium laptop stand under the base (desk-wide-lit.jpg).

    Authored in the laptop's own tilted frame so the platform meets the base's
    underside exactly; legs are then dropped to the mat in world space. Front
    retaining tabs rise just in front of the base, below the keyboard deck.
    """
    from .util import tube, sheet, thicken_polyline
    from .desk import MAT_TOP
    parts = []
    alu = M.pbr("riser", (0.30, 0.31, 0.33), roughness=0.4, metallic=0.8)
    silver = M.pbr("riser_tab", (0.72, 0.73, 0.75), roughness=0.28, metallic=0.9)
    dark = M.pbr("riser_dark", (0.06, 0.062, 0.066), roughness=0.5)
    bottom = -BASE_T / 2
    tilt = RISER_TILT

    def local_box(name, size, centre, material):
        obj = box(name, size, location=tuple(_laptop_to_world(centre)), rotation=(tilt, 0, 0))
        M.assign(obj, material)
        bevel(obj, width=min(size) * 0.3, segments=2)
        parts.append(obj)
        return obj

    plate_t = 0.004
    local_box("static_riser_plate", (0.260, 0.200, plate_t), (0.0, -0.010, bottom - plate_t / 2), alu)

    # Front retaining tabs: L-hooks wrapping the plate edge and rising 6 mm.
    front = -BASE_D / 2
    for sx, name, material in ((-1, 'l', silver), (1, 'r', silver), (0, 'c', dark)):
        width = 0.034 if sx else 0.050
        hook = [(front + 0.022, bottom - plate_t - 0.0015), (front - 0.0035, bottom - plate_t - 0.0015),
                (front - 0.0035, bottom + 0.006)]
        outline = thicken_polyline(hook, 0.003)
        tab = sheet(f"static_riser_tab_{name}", outline, width, 'YZ', offset=-width / 2)
        tab.location = (LAPTOP_X + sx * 0.105, LAPTOP_CENTRE_Y, LAPTOP_BASE_Z)
        tab.rotation_euler = (tilt, 0, 0)
        M.assign(tab, material)
        parts.append(tab)

    # Legs: front posts onto a ribbed foot bar, rear struts splaying to rubber feet.
    under = bottom - plate_t
    foot_bar_y = front + 0.030
    bar = box("static_riser_foot_bar", (0.230, 0.040, 0.004),
              location=(LAPTOP_X, _laptop_to_world((0, foot_bar_y, under)).y, MAT_TOP + 0.002))
    M.assign(bar, alu)
    bevel(bar, 0.0012, 2)
    parts.append(bar)
    for i in range(7):
        rib = box(f"static_riser_rib_{i}", (0.006, 0.036, 0.003),
                  location=(LAPTOP_X + (i - 3) * 0.022, bar.location.y, MAT_TOP + 0.0055))
        M.assign(rib, dark)
        parts.append(rib)
    for sx in (-1, 1):
        side = 'l' if sx < 0 else 'r'
        top_front = _laptop_to_world((sx * 0.090, foot_bar_y, under))
        parts.append(tube(f"static_riser_post_{side}",
                          [top_front, Vector((top_front.x, top_front.y, MAT_TOP + 0.007))], 0.0045, segments=12))
        M.assign(parts[-1], alu)
        top_back = _laptop_to_world((sx * 0.115, 0.080, under))
        foot = Vector((top_back.x + sx * 0.006, top_back.y + 0.030, MAT_TOP + 0.003))
        parts.append(tube(f"static_riser_strut_{side}", [top_back, foot], 0.0040, segments=12))
        M.assign(parts[-1], alu)
        pad = cylinder(f"static_riser_pad_{side}", 0.007, 0.003, segments=16,
                       location=(foot.x, foot.y, MAT_TOP + 0.0015))
        M.assign(pad, dark)
        parts.append(pad)
    return parts
