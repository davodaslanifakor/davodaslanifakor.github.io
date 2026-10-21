"""Speakers, USB hub, phone, mouse, and the two holder-wall props.

These are the pieces DESK_PLAN.md marks "must not be omitted": the wide shot
reads as this particular desk largely because of them, not because of the
monitors, which could be anyone's.
"""

import math
from . import materials as M
from . import desk as D
from .util import (box, plane, cylinder, cone, sphere, bevel, smooth, subsurf,
                   empty, parent_to)

SPEAKER_SIZE = 0.088
SPEAKER_Z = D.DESK_TOP + SPEAKER_SIZE / 2
LEFT_SPEAKER_X = -0.470
RIGHT_SPEAKER_X = 0.530
SPEAKER_Y = 0.105

# Tops of the speakers: the plush sits on the left, the figure on the right.
SPEAKER_TOP_Z = D.DESK_TOP + SPEAKER_SIZE


def _speaker(side, x):
    """Cube satellite speaker: rounded cabinet, recessed driver with silver ring,
    cone and dome, a horizontal guard bar, and the thin red front trim."""
    from .util import lathe, revolve, tube, recalc_normals
    root = empty(f"root_speaker_{side}")
    s = SPEAKER_SIZE
    depth = s * 0.92
    front_y = -depth / 2

    # Both speakers answer to the one `speakers` id via the int_<id>__<n> suffix.
    shell_name = "int_speakers" if side == 'l' else "int_speakers__2"
    shell = box(shell_name, (s, depth, s))
    M.assign(shell, M.pbr("speaker_gloss", (0.030, 0.031, 0.034), roughness=0.28))
    bevel(shell, width=0.0075, segments=4)
    smooth(shell)
    from .util import cut_hole
    cutter = cylinder(f"_speaker_cutter_{side}", 0.0372, 0.020, segments=48,
                      location=(0.0, front_y, 0.0), rotation=(math.pi / 2, 0, 0))
    cut_hole(shell, cutter)
    parts = [shell]

    def front_part(obj, material, y=front_y):
        # Authored around +Z; Rx(+90) turns +Z to -Y so it faces the room.
        obj.location = (0.0, y, 0.0)
        obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
        M.assign(obj, material)
        parts.append(obj)
        return obj

    black = M.pbr("speaker_surround", (0.012, 0.012, 0.014), roughness=0.55)
    silver = M.pbr("speaker_ring", (0.62, 0.63, 0.65), roughness=0.3, metallic=0.85)
    cone_mat = M.pbr("speaker_cone", (0.36, 0.37, 0.38), roughness=0.55, metallic=0.3)
    # Recessed surround bowl: lip flush with the baffle, stepping in toward the cone.
    front_part(lathe(f"static_speaker_{side}_surround",
                     [(0.0375, 0.0003), (0.0345, -0.0010), (0.0300, -0.0045), (0.0265, -0.0060)],
                     segments=48), black)
    front_part(lathe(f"static_speaker_{side}_ring",
                     [(0.0266, -0.0059), (0.0240, -0.0052), (0.0212, -0.0060)], segments=48), silver)
    front_part(lathe(f"static_speaker_{side}_cone",
                     [(0.0213, -0.0061), (0.0150, -0.0092), (0.0085, -0.0112)], segments=40), cone_mat)
    dome = revolve(f"static_speaker_{side}_dome",
                   [(0.0, -0.0080), (0.0055, -0.0102), (0.0086, -0.0113)][::-1], segments=24)
    recalc_normals(dome)
    front_part(dome, silver)

    # Guard bar straight across the driver, held by two small posts.
    bar = tube(f"static_speaker_{side}_bar", [(-0.036, front_y - 0.0022, 0.0), (0.036, front_y - 0.0022, 0.0)],
               0.0011, segments=10)
    M.assign(bar, M.pbr("speaker_bar", (0.05, 0.05, 0.055), roughness=0.4))
    parts.append(bar)
    for sx in (-1, 1):
        post = cylinder(f"static_speaker_{side}_bar_post_{'l' if sx < 0 else 'r'}", 0.0016, 0.0026,
                        segments=10, location=(sx * 0.0355, front_y - 0.0011, 0.0),
                        rotation=(math.pi / 2, 0, 0))
        M.assign(post, M.pbr("speaker_bar", (0.05, 0.05, 0.055), roughness=0.4))
        parts.append(post)

    # Thin red trim framing the front baffle just inside the rounded edge.
    inset, r = s / 2 - 0.0045, 0.006
    trim_path = []
    for cx, cz, a0 in ((inset - r, inset - r, 0), (-(inset - r), inset - r, 90),
                       (-(inset - r), -(inset - r), 180), (inset - r, -(inset - r), 270)):
        for k in range(7):
            a = math.radians(a0 + 90 * k / 6)
            trim_path.append((cx + r * math.cos(a), front_y - 0.0002, cz + r * math.sin(a)))
    trim_path.append(trim_path[0])
    trim = tube(f"static_speaker_{side}_trim", trim_path, 0.0005, segments=6, caps=False)
    M.assign(trim, M.speaker_trim())
    parts.append(trim)

    for part in parts:
        parent_to(part, root)
    root.location = (x, SPEAKER_Y, SPEAKER_Z)
    return root, parts


def build_speakers():
    left_root, left_parts = _speaker("l", LEFT_SPEAKER_X)
    right_root, right_parts = _speaker("r", RIGHT_SPEAKER_X)
    return {'roots': [left_root, right_root], 'parts': left_parts + right_parts}


HUB_X = -0.470
HUB_Y = -0.030
HUB_TOP_Z = D.DESK_TOP + 0.019


def build_hub():
    """USB-C hub the toys stand on (toys-trio.jpg).

    Front reads left to right: USB-C port, two USB-A ports with dark tongues,
    and a ringed round audio socket, in four sections split by shallow grooves.
    Ports are real openings cut into the body, not a row of identical slots.
    """
    from .util import cut_hole, tube, catmull_rom
    w, d, h = 0.205, 0.058, 0.019
    cz = D.DESK_TOP + h / 2
    front = HUB_Y - d / 2
    body = box("static_hub", (w, d, h), location=(HUB_X, HUB_Y, cz))
    material = M.pbr("hub", (0.030, 0.031, 0.034), roughness=0.45)
    M.assign(body, material)
    bevel(body, width=0.0015, segments=2)

    def cutter_box(name, size, x):
        return box(name, (size[0], 0.016, size[1]), location=(HUB_X + x, front, cz))

    usb_c_x, usb_a_x, audio_x = -0.083, (-0.031, 0.029), 0.080
    cut_hole(body, cutter_box("_c_cut", (0.0080, 0.0024), usb_c_x))
    for i, x in enumerate(usb_a_x):
        cut_hole(body, cutter_box(f"_a_cut_{i}", (0.0122, 0.0048), x))
    cut_hole(body, cylinder("_audio_cut", 0.0019, 0.016, segments=20,
                            location=(HUB_X + audio_x, front, cz), rotation=(math.pi / 2, 0, 0)))
    # Section grooves between the port panels.
    for i, x in enumerate((-0.058, -0.001, 0.056)):
        cut_hole(body, box(f"_groove_{i}", (0.0008, 0.0016, h * 1.2), location=(HUB_X + x, front, cz)))
    parts = [body]

    port_dark = M.pbr("port", (0.008, 0.008, 0.009), roughness=0.5)
    tongue_mat = M.pbr("port_tongue", (0.05, 0.05, 0.055), roughness=0.4)
    for name, size, x in (("c", (0.0080, 0.0024), usb_c_x),) + tuple(
            (f"a_{i}", (0.0122, 0.0048), ax) for i, ax in enumerate(usb_a_x)):
        back = box(f"static_hub_port_{name}", (size[0], 0.001, size[1]),
                   location=(HUB_X + x, front + 0.0065, cz))
        M.assign(back, port_dark)
        parts.append(back)
    for i, x in enumerate(usb_a_x):
        tongue = box(f"static_hub_port_a_{i}_tongue", (0.0098, 0.0060, 0.0015),
                     location=(HUB_X + x, front + 0.0035, cz + 0.0008))
        M.assign(tongue, tongue_mat)
        parts.append(tongue)
    ring_path = [(HUB_X + audio_x + 0.0027 * math.cos(a), front - 0.0002, cz + 0.0027 * math.sin(a))
                 for a in [2 * math.pi * i / 24 for i in range(25)]]
    ring = tube("static_hub_audio_ring", ring_path, 0.00045, segments=6, caps=False)
    M.assign(ring, M.pbr("hub_ring", (0.85, 0.85, 0.86), roughness=0.3))
    parts.append(ring)

    # Braided lead leaving the right end and running to the laptop's left side.
    plug_x = HUB_X + w / 2 + 0.006
    plug = box("static_hub_plug", (0.012, 0.009, 0.006), location=(plug_x, HUB_Y + 0.008, cz))
    M.assign(plug, M.pbr("hub_plug", (0.05, 0.05, 0.055), roughness=0.35, metallic=0.4))
    bevel(plug, 0.0012, 2)
    parts.append(plug)
    from . import screens as S
    lap_left = S.LAPTOP_X - S.BASE_W / 2
    lead = [(plug_x + 0.006, HUB_Y + 0.008, cz), (plug_x + 0.030, HUB_Y + 0.004, D.DESK_TOP + 0.0027),
            (plug_x + 0.075, HUB_Y - 0.020, D.MAT_TOP + 0.0027),
            (lap_left - 0.028, -0.095, D.MAT_TOP + 0.006),
            (lap_left - 0.010, -0.100, S.LAPTOP_BASE_Z + 0.004),
            (lap_left + 0.001, -0.100, S.LAPTOP_BASE_Z + 0.006)]
    cable = tube("static_hub_cable", catmull_rom(lead, 8), 0.0026, segments=8)
    M.assign(cable, M.pbr("braided_cable", (0.035, 0.036, 0.040), roughness=0.8))
    parts.append(cable)
    return parts


def build_phone():
    """Standard iPhone 16 silhouette seated upright on the right-hand stand."""
    from .util import prism, rounded_rect, cylinder
    root = empty("root_phone")
    # Apple's standard 6.1-inch iPhone 16 dimensions: 147.6 × 71.6 × 7.8 mm.
    L, W, T = 0.1476, 0.0716, 0.0078
    body = prism("int_phone", rounded_rect(W / 2, L / 2, 0.009, steps=8), T)
    M.assign(body, M.pbr("phone_frame", (0.105, 0.125, 0.128), roughness=0.32, metallic=0.72))
    bevel(body, width=0.0018, segments=3)
    smooth(body)
    glass = plane("int_phone__2", (W - 0.0052, L - 0.0052),
                  location=(0, 0, T + 0.0003))
    M.assign(glass, M.pbr("phone_glass", (0.008, 0.012, 0.010), roughness=0.12, metallic=0.1))
    island = prism("static_phone_dynamic_island",
                   rounded_rect(0.011, 0.0032, 0.003, steps=6), 0.0012,
                   location=(0, L * 0.415, T + 0.0007))
    M.assign(island, M.pbr("phone_island", (0.006, 0.007, 0.006), roughness=0.15))
    camera_lens = cylinder("static_phone_camera_lens", 0.0058, 0.0017, segments=20,
                           location=(-W * 0.30, L * 0.405, -0.0007))
    M.assign(camera_lens, M.pbr("phone_camera_glass", (0.015, 0.034, 0.045), roughness=0.17, metallic=0.25))
    camera_lens_2 = cylinder("static_phone_camera_lens_2", 0.0058, 0.0017, segments=20,
                             location=(-W * 0.30, L * 0.325, -0.0007))
    M.assign(camera_lens_2, M.pbr("phone_camera_glass", (0.015, 0.034, 0.045), roughness=0.17, metallic=0.25))
    # Side controls and bottom speaker/USB-C openings are simple original geometry.
    buttons = [
        box("static_phone_action_button", (0.0018, 0.018, 0.003), (-W / 2 - 0.001, L * 0.30, T * 0.62)),
        box("static_phone_volume_up", (0.0018, 0.011, 0.003), (-W / 2 - 0.001, L * 0.19, T * 0.62)),
        box("static_phone_volume_down", (0.0018, 0.011, 0.003), (-W / 2 - 0.001, L * 0.09, T * 0.62)),
        box("static_phone_power_button", (0.0018, 0.025, 0.003), (W / 2 + 0.001, L * 0.25, T * 0.62)),
        box("static_phone_usb_c", (0.012, 0.0015, 0.002), (0, -L / 2, T * 0.50)),
    ]
    for item in buttons:
        M.assign(item, M.pbr("phone_detail", (0.026, 0.031, 0.031), roughness=0.42, metallic=0.68))
    from .desk import MAT_TOP
    # Align the phone with the stand. Its lower edge sits on the small front
    # lip; the phone's back meets the sloped support instead of hanging behind
    # the stand or leaving the stand's lip across the screen.
    for part in (body, glass, island, camera_lens, camera_lens_2, *buttons):
        parent_to(part, root)
    root.location = (0.655, -0.185, MAT_TOP + 0.069)
    # Turn 35° left from the prior 22° library-facing yaw so the display faces
    # the room centre while remaining aligned with its cradle.
    root.rotation_euler = (math.radians(65.0), 0.0, math.radians(-13.0))
    return {'root': root, 'hit': body, 'screen': glass, 'parts': [body, glass, island, *buttons]}


def build_phone_stand():
    """Low-profile cradle with a flat foot, sloped back and short front lip."""
    from .util import sheet
    from .desk import MAT_TOP
    width = 0.070
    finish = M.pbr('phone_stand', (0.022, 0.023, 0.027), roughness=0.5, metallic=0.3)
    origin = (0.655, -0.185, MAT_TOP)
    yaw = math.radians(-13.0)

    # A shallow, broad foot keeps the holder planted on the desk. The device
    # mesh retains the stable static_phone_stand name used by the scene.
    base = box("static_phone_stand", (0.090, 0.086, 0.004),
               location=(0.0, 0.0, 0.002))
    M.assign(base, finish)
    bevel(base, width=0.0012, segments=2)

    # This thin panel follows the phone's back plane and is set just behind it.
    # The small foot lip catches only the bottom edge, leaving the screen clear.
    back = sheet("static_phone_stand_back",
                 [(-0.014, 0.021), (-0.011, 0.023), (0.022, 0.092), (0.019, 0.093)],
                 0.070, 'YZ', offset=-width / 2)
    lip = box("static_phone_stand_lip", (0.074, 0.010, 0.009),
              location=(0.0, -0.029, 0.0065))
    for part in (base, back, lip):
        if part != base:
            M.assign(part, finish)
        if part == lip:
            bevel(part, width=0.0010, segments=2)
        part.location.x += origin[0]
        part.location.y += origin[1]
        part.location.z += origin[2]
        part.rotation_euler.z = yaw
    return [base, back, lip]


def _superellipse_mesh(name, half_w, half_l, height_fn, rings=16, segments=128, p=2.8):
    """Radial loft over a superellipse plan: r=0 is the crown pole, r=1 the rim."""
    import bpy
    verts, faces = [], []
    verts.append((0.0, 0.0, height_fn(0.0, 0.0, 0.0)))
    for ri in range(1, rings + 1):
        r = ri / rings
        r = 1 - (1 - r) ** 1.6  # denser rings toward the rim where curvature is
        for si in range(segments):
            a = 2 * math.pi * si / segments
            ca, sa = math.cos(a), math.sin(a)
            x = half_w * r * math.copysign(abs(ca) ** (2 / p), ca)
            y = half_l * r * math.copysign(abs(sa) ** (2 / p), sa)
            verts.append((x, y, height_fn(x, y, r)))
    for si in range(segments):
        faces.append((0, 1 + si, 1 + (si + 1) % segments))
    for ri in range(rings - 1):
        a0, a1 = 1 + ri * segments, 1 + (ri + 1) * segments
        for si in range(segments):
            j = (si + 1) % segments
            faces.append((a0 + si, a1 + si, a1 + j, a0 + j))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    from .util import link, recalc_normals
    link(obj)
    return recalc_normals(obj)


def build_mouse():
    """Magic Mouse right of the laptop: one continuous glossy shell on a thin dark base.

    Real proportions (113.5 x 57.1 x 21.6 mm). The shell is a loft whose crown
    peaks behind the middle and thins to a knife edge at the rim, so it cannot
    read as a soap bar or a bevelled box. No wheel, no split buttons.
    """
    half_w, half_l = 0.0286, 0.0568
    base_h = 0.0024
    crown = 0.0185

    def shell_height(x, y, r):
        s = y / half_l                      # -1 front (toward viewer) .. +1 back
        along = max(1 - ((s - 0.18) / 1.2) ** 2, 0.0) ** 0.55
        edge = max(1 - r ** 2.2, 0.0) ** 0.85
        return base_h + crown * along * edge

    root = empty("root_mouse")
    shell = _superellipse_mesh("static_mouse", half_w, half_l, shell_height)
    M.assign(shell, M.pbr("mouse", M.PALETTE['mouse_white'], roughness=0.16))
    parent_to(shell, root)

    # Dark aluminium base, inset under the rim, closed underneath.
    base = _superellipse_mesh("static_mouse_base", half_w * 0.955, half_l * 0.965,
                              lambda x, y, r: 0.0 if r < 0.999 else base_h * 0.98, rings=6)
    # Lift the rim ring to form a thin wall: the outermost ring stays at base_h,
    # everything inside sits on the mat.
    M.assign(base, M.pbr("mouse_base", (0.20, 0.21, 0.22), roughness=0.35, metallic=0.6))
    parent_to(base, root)

    # Keep the mouse to the laptop's right with a clear hand-width gap; the
    # previous x=0.495 placement left it detached from the workstation.
    root.location = (0.300, -0.175, D.MAT_TOP)
    root.rotation_euler = (0.0, 0.0, math.radians(16.0))
    return [shell, base]


def _clock_dial_image():
    """Dial artwork for clock.jpg: warm white face, slender upright Arabic numerals."""
    from . import texpaint as TP
    canvas = TP.Canvas(512, background=TP.srgb(242, 241, 236))
    ink = TP.srgb(24, 24, 26)
    for hour in range(1, 13):
        angle = 2 * math.pi * hour / 12
        # Numerals stay upright rather than following the radius, as printed.
        centre = (0.5 + 0.372 * math.sin(angle), 0.5 + 0.372 * math.cos(angle))
        canvas.text(str(hour), centre, 0.082, ink, stretch=0.9)
    return canvas.to_image("clock_dial")


# Measured off clock.jpg in units of the drum radius; see docs/review.md.
CLOCK_RADIUS = 0.036
CLOCK_DEPTH = 0.028
CLOCK_OPENING = 0.775      # dial opening / drum radius
CLOCK_BELL_ANGLE = 44.0    # bell mount, degrees from vertical
CLOCK_BELL_TILT = 31.0     # bell axis lean outward


def build_clock():
    """Yellow tin twin-bell clock on the low right cabinet (clock.jpg).

    Built in a local frame where +Z is the drum axis pointing out of the dial,
    then turned so the dial faces the room (-Y). The drum and bells are lathed
    profiles, the handle and feet are single swept rods, so nothing is a stack
    of primitives that can drift apart.
    """
    from mathutils import Vector
    from .util import revolve, tube, prism, disc, catmull_rom, recalc_normals

    R = CLOCK_RADIUS
    half = CLOCK_DEPTH / 2
    root = empty("root_clock")
    # Turns the authored +Z (dial normal) toward -Y, keeping +Y as up.
    body_frame = empty("static_clock_frame")
    body_frame.rotation_euler = (math.pi / 2, 0.0, 0.0)
    parent_to(body_frame, root)

    yellow = M.pbr("clock_paint", (0.80, 0.68, 0.030), roughness=0.34)
    chrome = M.pbr("clock_chrome", (0.86, 0.87, 0.88), roughness=0.16, metallic=1.0)
    ink = M.pbr("clock_ink", (0.016, 0.016, 0.018), roughness=0.45)
    parts = []

    def local(obj, material):
        M.assign(obj, material)
        parent_to(obj, body_frame)
        parts.append(obj)
        return obj

    # Drum: back plate, straight side, broad rolled front rim, inner wall to the dial seat.
    o = CLOCK_OPENING * R
    roll, lip = 0.0052, 0.0030
    profile = [(0.0, -half), (R - 0.004, -half), (R - 0.0012, -half + 0.0006),
               (R, -half + 0.0022)]
    for i in range(9):  # outer roll: side wall curling onto the broad front rim
        t = (math.pi / 2) * i / 8
        profile.append((R - roll + roll * math.cos(t), half - roll + roll * math.sin(t)))
    for i in range(1, 4):  # the rim face itself stays gently crowned, not flat
        u = i / 4
        profile.append((R - roll - (R - roll - o - lip) * u, half - 0.0004 * math.sin(math.pi * u)))
    for i in range(9):  # inner lip rolling down into the dial opening
        t = (math.pi / 2) * i / 8
        profile.append((o + lip - lip * math.sin(t), half - lip + lip * math.cos(t)))
    profile += [(o, half - 0.0105), (0.0, half - 0.0105)]
    drum = revolve("static_clock_case", profile, segments=72)
    # Weighted normals draw a dark crease where the narrow roll meets the wide
    # rim face; the densely sampled arcs shade smoothly on their own.
    for mod in list(drum.modifiers):
        drum.modifiers.remove(mod)
    recalc_normals(drum)
    local(drum, yellow)

    dial_z = half - 0.0100
    dial = disc("int_clock", o + 0.0003, segments=64, location=(0, 0, dial_z))
    from . import texpaint as TP
    local(dial, TP.textured("clock_dial", _clock_dial_image(), roughness=0.55))

    # Hands, measured from the photo: thick hour to 9, long minute toward 1,
    # thin second near 12, thin alarm pointer toward 10. One shared centre pin.
    def hand(name, angle_deg, length, width, tail, z, tip=0.35):
        a = math.radians(angle_deg)
        outline = [(-width / 2, -tail), (width / 2, -tail),
                   (width * tip / 2, length), (-width * tip / 2, length)]
        obj = prism(f"static_clock_hand_{name}", outline, 0.0004,
                    location=(0, 0, dial_z + z), rotation=(0, 0, -a))
        return local(obj, ink)

    hand("alarm", -50, 0.60 * o, 0.0010, 0.0, 0.0004, tip=0.6)
    hand("hour", -90, 0.60 * o, 0.0029, 0.0018, 0.0010, tip=0.8)
    hand("minute", 37, 0.74 * o, 0.0021, 0.0018, 0.0016, tip=0.55)
    hand("second", 5, 0.72 * o, 0.0007, 0.0060, 0.0022, tip=0.8)
    cap = revolve("static_clock_hand_cap", [(0.0, 0.0), (0.0024, 0.0), (0.0024, 0.0009),
                                            (0.0012, 0.0016), (0.0, 0.0018)], segments=20,
                  location=(0, 0, dial_z + 0.0026))
    recalc_normals(cap)
    local(cap, ink)

    # Bells: shallow painted cups on chrome stems, with hex nut and acorn cap on top.
    def bell_frame(sx):
        mount = math.radians(CLOCK_BELL_ANGLE)
        tilt = math.radians(CLOCK_BELL_TILT)
        axis = Vector((sx * math.sin(tilt), math.cos(tilt), 0.0))
        surface = Vector((sx * math.sin(mount) * R, math.cos(mount) * R, -0.0015))
        lip_centre = surface + axis * 0.0042
        return axis, surface, lip_centre

    bell_r, bell_h, shell = 0.0135, 0.0098, 0.0009
    cup_profile = [(0.0, bell_h - shell)]
    for i in range(1, 8):
        t = (math.pi / 2) * i / 8
        cup_profile.append(((bell_r - shell) * math.sin(t), (bell_h - shell) * math.cos(t)))
    cup_profile += [(bell_r - shell, 0.0), (bell_r, 0.0), (bell_r, 0.0012)]
    for i in range(7, -1, -1):
        t = (math.pi / 2) * i / 8
        cup_profile.append((bell_r * math.sin(t) if i else 0.0,
                            0.0012 + (bell_h - 0.0012) * math.cos(t)))
    cup_profile[-1] = (0.0, bell_h)

    nut_tops = {}
    for sx in (-1, 1):
        side = 'l' if sx < 0 else 'r'
        axis, surface, lip = bell_frame(sx)
        rot = axis.to_track_quat('Z', 'Y').to_euler()
        cup = revolve(f"static_clock_bell_{side}", cup_profile, segments=40, location=lip)
        cup.rotation_euler = rot
        recalc_normals(cup)
        local(cup, yellow)

        stem_end = lip + axis * (bell_h + 0.0036)
        stem = tube(f"static_clock_bell_stem_{side}", [surface - axis * 0.001, stem_end],
                    0.0011, segments=12)
        local(stem, chrome)
        nut = cylinder(f"static_clock_bell_nut_{side}", 0.0026, 0.0022, segments=6,
                       location=lip + axis * (bell_h + 0.0017))
        nut.rotation_euler = rot
        local(nut, chrome)
        acorn = revolve(f"static_clock_bell_acorn_{side}",
                        [(0.0, 0.0), (0.0021, 0.0), (0.0021, 0.0010), (0.0017, 0.0025),
                         (0.0009, 0.0034), (0.0, 0.0037)], segments=16,
                        location=lip + axis * (bell_h + 0.0028))
        acorn.rotation_euler = rot
        recalc_normals(acorn)
        local(acorn, chrome)
        # Handle ends wrap the stem just under the nut.
        nut_tops[sx] = lip + axis * (bell_h + 0.0004)

    # Handle: one bent chrome strip, steep sides, rounded shoulders, wide shallow top.
    zl = nut_tops[-1]
    zr = nut_tops[1]
    back = 0.0016
    ctrl = [
        (zl.x, zl.y, back), (zl.x + 0.10 * R, zl.y + 0.30 * R, back),
        (-0.66 * R, 1.62 * R, back), (-0.44 * R, 1.73 * R, back),
        (0.0, 1.75 * R, back),
        (0.44 * R, 1.73 * R, back), (0.66 * R, 1.62 * R, back),
        (zr.x - 0.10 * R, zr.y + 0.30 * R, back), (zr.x, zr.y, back),
    ]
    handle = tube("static_clock_handle", catmull_rom(ctrl, samples=6), 0.0011,
                  segments=10, profile_scale=(1.0, 1.9))
    local(handle, chrome)

    # Feet: two splayed chrome rods with a collar at the drum and a ball end.
    foot_ends = []
    for sx in (-1, 1):
        side = 'l' if sx < 0 else 'r'
        a = math.radians(150)
        start = Vector((sx * math.sin(a) * R * 0.98, math.cos(a) * R * 0.98, -0.004))
        end = Vector((sx * 0.80 * R, -1.19 * R, 0.002))
        rod = tube(f"static_clock_foot_{side}", [start, end], 0.0012, segments=10,
                   radius_scale=lambda t: 1.15 - 0.3 * t)
        local(rod, chrome)
        collar = tube(f"static_clock_foot_collar_{side}",
                      [start + (end - start) * 0.10, start + (end - start) * 0.22],
                      0.0019, segments=12)
        local(collar, chrome)
        ball = sphere(f"static_clock_foot_ball_{side}", 0.0021, segments=14, rings=8,
                      location=end)
        local(ball, chrome)
        foot_ends.append(end)

    # Rest the ball ends on the cabinet: frame local +Y is world +Z after the turn.
    lowest = min(e.y for e in foot_ends) - 0.0021
    root.location = (D.CABINET_X0 + 0.045, 0.110, D.CABINET_TOP - lowest)
    root.rotation_euler = (0.0, 0.0, math.radians(-4.0))
    return {'root': root, 'hit': dial, 'parts': parts}


def build_elephant():
    """Folded sheet-metal elephant in front of the right speaker (elephant.jpg).

    Authored along local +X (head forward), +Z up, width across Y, at final size.
    Every plate is a real outline with thickness: two side panels with leg
    cut-outs, a slotted roof folded over them, cheek plates with a punched eye
    hole, and one continuous strip running down the forehead into the trunk.
    """
    import bpy
    from .util import sheet, cut_hole, ribbon, prism, catmull_rom, tube

    root = empty("root_elephant")
    parts = []
    steel = M.pbr("elephant_steel", (0.70, 0.71, 0.72), roughness=0.36, metallic=0.55)
    t = 0.0006          # sheet thickness
    half_w = 0.0092     # body half-width between the side panels
    top = 0.030

    def add(obj):
        M.assign(obj, steel)
        parent_to(obj, root)
        parts.append(obj)
        return obj

    # Side panels: rear leg, belly notch, front leg, shoulder, tail step.
    side_outline = [
        (-0.031, 0.0), (-0.0205, 0.0), (-0.0185, 0.0105), (-0.0080, 0.0105),
        (-0.0045, 0.0), (0.0065, 0.0), (0.0065, top), (-0.0275, top),
        (-0.0275, 0.0265), (-0.0315, 0.0235), (-0.0315, 0.0185), (-0.0295, 0.0165),
    ]
    near = add(sheet("int_elephant", side_outline, t, 'XZ', offset=-half_w - t))
    far = add(sheet("int_elephant__2", side_outline, t, 'XZ', offset=half_w))

    # Roof: two tabs folded in from each side with the slot between them, plus
    # rounded bends along the top edges so the fold reads as one sheet.
    for sy, name in ((-1, 'l'), (1, 'r')):
        inner = 0.0014
        add(sheet(f"static_elephant_roof_{name}",
                  [(-0.0275, 0.0), (0.0065, 0.0), (0.0065, t), (-0.0275, t)], half_w - inner, 'XZ',
                  offset=min(sy * inner, sy * half_w) if sy < 0 else inner))
        parts[-1].location.z = top - t
        add(tube(f"static_elephant_fold_{name}",
                 [(-0.0275, sy * (half_w + t / 2), top - t / 2), (0.0065, sy * (half_w + t / 2), top - t / 2)],
                 t * 0.9, segments=8))
    # Leg bridges: short U folds joining each leg pair at the bottom inside.
    for x0, x1, name in ((-0.031, -0.0205, 'rear'), (-0.0045, 0.0065, 'front')):
        bridge = add(sheet(f"static_elephant_bridge_{name}",
                           [(-half_w, 0.0005), (half_w, 0.0005), (half_w, 0.0070), (-half_w, 0.0070)],
                           t, 'YZ', offset=x0 + 0.0008 if name == 'rear' else x1 - 0.0008 - t))

    # Cheeks: the head plates between shoulder and forehead, eye hole punched through.
    cheek_outline = [(0.0060, 0.0115), (0.0125, 0.0105), (0.0135, top), (0.0060, top)]
    for sy, name in ((-1, 'l'), (1, 'r')):
        offset = -half_w - t if sy < 0 else half_w
        cheek = add(sheet(f"static_elephant_cheek_{name}", cheek_outline, t, 'XZ', offset=offset))
        cutter = cylinder(f"_eye_cutter_{name}", 0.0011, 0.01, segments=16,
                          location=(0.0098, offset, 0.0205), rotation=(math.pi / 2, 0, 0))
        cut_hole(cheek, cutter)

    # Forehead strip folding into the trunk, which curls forward along the ground.
    ctrl = [(0.0138, top), (0.0142, 0.020), (0.0150, 0.011), (0.0185, 0.0045),
            (0.0250, 0.0016), (0.0320, 0.0014), (0.0365, 0.0030)]
    path = [(p.x, p.y) for p in catmull_rom([(x, z, 0) for x, z in ctrl], 6)]
    n = len(path)
    widths = []
    for i in range(n):
        u = i / (n - 1)
        w = 2 * half_w + 0.0012 - (2 * half_w - 0.0055) * min(u / 0.55, 1.0)
        if u > 0.9:  # rounded tip
            w *= math.sqrt(max(1 - ((u - 0.9) / 0.1) ** 2, 0.08))
        widths.append(w)
    add(ribbon("int_elephant__3", path, widths, t))
    # The two long slits either side of the trunk strip on the forehead.
    for sy in (-1, 1):
        add(box(f"static_elephant_slit_{'l' if sy < 0 else 'r'}", (0.0016, 0.0009, 0.018),
                location=(0.0140, sy * 0.0036, 0.0205)))
        parts[-1].data.materials.clear()
        M.assign(parts[-1], M.pbr("elephant_slit", (0.02, 0.02, 0.022), roughness=0.7))

    # Ears: tall ovals standing up beside the head, turned slightly outward.
    ear_outline = [(0.0078 * math.cos(2 * math.pi * i / 32), 0.0135 * math.sin(2 * math.pi * i / 32))
                   for i in range(32)]
    for sy, name in ((-1, 'l'), (1, 'r')):
        ear = add(prism(f"static_elephant_ear_{name}", ear_outline, t,
                        location=(0.0105, sy * (half_w + 0.0062), top + 0.0035),
                        rotation=(math.pi / 2, 0.0, math.pi / 2 + sy * math.radians(24))))

    root.location = (0.520, 0.000, D.DESK_TOP)
    # Head toward the laptop and viewer, body angled so trunk and legs both read.
    root.rotation_euler = (0.0, 0.0, math.radians(-150.0))
    return {'root': root, 'hit': near, 'parts': parts}
