"""Reference-led desk toys built from the supplied close-up photographs.

Each toy hangs off a named root empty so the runtime has an animation pivot, and
exposes one int_ mesh as its hit target.
"""

import math
from mathutils import Vector
from . import materials as M
from . import desk as D
from . import peripherals as P
from .util import (box, plane, cylinder, cone, sphere, capsule, revolve,
                   dome_profile, bevel, smooth, subsurf, empty, parent_to)

TOY_R = 0.0128
TOY_H = 0.032
TOY_BASE_Z = P.HUB_TOP_Z

# Spaced along the hub, in the reference's left-to-right order.
TOY_SLOTS = {
    'paratrooper': P.HUB_X - 0.066,
    'cards':       P.HUB_X,
    'robot':       P.HUB_X + 0.066,
}


def _toy_profile(radius=TOY_R, height=TOY_H, lift=0.0):
    """Flat base, straight sides, domed top - one continuous lathe, no seam."""
    return ([(0.0, lift), (radius * 0.72, lift), (radius, lift + 0.0045),
             (radius, height - radius * 0.55)]
            + dome_profile(radius, height - radius * 0.55, steps=8, squash=0.95))


def _toy_body(object_id, colour, radius=TOY_R, height=TOY_H, lift=0.0):
    root = empty(f"root_{object_id}")
    body = revolve(f"int_{object_id}", _toy_profile(radius, height, lift), segments=36)
    M.assign(body, M.pbr(f"{object_id}_body", colour, roughness=0.42))
    parent_to(body, root)
    return root, body


def _front(radius, x, z, out=0.0):
    """Point on a toy body's front surface (local -Y) at height z."""
    return (x, -math.sqrt(max(radius * radius - x * x, 0.0)) - out, z)


def _eye(prefix, add, centre, eye_r, iris_colour, rim=None, rim_r=None, rim_t=0.0012,
         toward=(0.0, -1.0, 0.0)):
    """Goggle eye: optional rim ring, white eyeball, iris, pupil and glint, facing `toward`."""
    from mathutils import Vector
    from .util import tube
    c = Vector(centre)
    n = Vector(toward).normalized()
    side = n.cross(Vector((0, 0, 1))).normalized()
    up = side.cross(n).normalized()
    white = M.pbr('minion_eye_white', M.srgb(244, 242, 236), roughness=0.25)
    black = M.pbr('minion_pupil', (0.01, 0.01, 0.012), roughness=0.3)
    if rim is not None:
        ring = [c + (side * math.cos(a) + up * math.sin(a)) * rim_r
                for a in [2 * math.pi * i / 40 for i in range(41)]]
        add(tube(f'{prefix}_rim', ring, rim_t, segments=10, caps=False), rim)
    ball = add(sphere(f'{prefix}_eye', eye_r, segments=24, rings=14, location=tuple(c)), white)
    ball.rotation_mode = 'QUATERNION'
    ball.rotation_quaternion = n.to_track_quat('Y', 'Z')
    ball.scale = (1.0, 0.55, 1.0)
    front = c + n * eye_r * 0.55
    for name, r, colour, depth in (('iris', eye_r * 0.46, iris_colour, 0.00035),
                                   ('pupil', eye_r * 0.21, None, 0.00065)):
        disc_obj = cylinder(f'{prefix}_{name}', r, depth, segments=20, location=tuple(front - n * 0.0002))
        disc_obj.rotation_mode = 'QUATERNION'
        disc_obj.rotation_quaternion = n.to_track_quat('Z', 'Y')
        add(disc_obj, M.pbr(f'{prefix}_iris', iris_colour, roughness=0.35) if colour else black)
    add(sphere(f'{prefix}_glint', eye_r * 0.09, segments=8, rings=6,
               location=tuple(front + n * 0.0004 + up * eye_r * 0.18 - side * eye_r * 0.14)), white)


def _band(name, radius, z0, z1, thickness=0.0009):
    from .util import lathe
    return lathe(name, [(radius - 0.0003, z0), (radius + thickness, z0 + 0.0003),
                        (radius + thickness, z1 - 0.0003), (radius - 0.0003, z1)],
                 segments=40, close_profile=True)


HULA_R, HULA_H = 0.0126, 0.049


def build_paratrooper():
    """One-eyed hula Minion: protruding eye tube, lime headband, dark tuft,
    red starfish, lumpy grass skirt, arms lowered beside the skirt (toys-trio.jpg)."""
    from .util import tube, prism, catmull_rom, lathe
    from mathutils import Vector
    R, H = HULA_R, HULA_H
    root, body = _toy_body('paratrooper', M.srgb(248, 206, 52), R, H, lift=0.0015)
    yellow = body.data.materials[0]
    parts = [body]

    def add(obj, material):
        M.assign(obj, material)
        parts.append(obj)
        return obj

    lime = M.pbr('hula_band', M.srgb(196, 206, 70), roughness=0.5)
    grass = M.pbr('hula_grass', M.srgb(104, 160, 72), roughness=0.85)
    grass_dark = M.pbr('hula_grass_dark', M.srgb(66, 120, 50), roughness=0.9)
    red = M.pbr('hula_star', M.srgb(200, 30, 36), roughness=0.5)
    tuft = M.pbr('hula_tuft', M.srgb(70, 60, 36), roughness=0.6)

    # Single eye: a skin-coloured tube standing off the face, eyeball at its end.
    eye_z, eye_x = 0.0365, 0.0012
    base = Vector(_front(R, eye_x, eye_z, -0.001))
    tip = base + Vector((0, -0.0058, 0))
    add(tube('static_paratrooper_eye_tube', [base, tip], 0.0062, segments=28), yellow)
    _eye('static_paratrooper', add, tip + Vector((0, 0.0012, 0)), 0.0052, M.srgb(120, 60, 36))

    add(_band('static_paratrooper_headband', R, 0.0400, 0.0445), lime)

    # Short dark tuft of hair sprouting from the crown.
    top = Vector((0, 0, H + R * 0.4))
    for i in range(8):
        a = 2 * math.pi * i / 8
        end = top + Vector((math.cos(a) * 0.0028, math.sin(a) * 0.0028, 0.0042 + 0.0008 * (i % 2)))
        add(tube(f'static_paratrooper_tuft_{i}', [top + Vector((0, 0, -0.001)), end], 0.00055,
                 segments=6, radius_scale=lambda t: 1.0 - 0.6 * t), tuft)

    # Flat five-point starfish on the chest, tangent to the body.
    star = []
    for i in range(10):
        a = math.pi / 2 + math.pi * i / 5
        r = 0.0040 if i % 2 == 0 else 0.0017
        star.append((r * math.cos(a), r * math.sin(a)))
    for sx in (-1, 1):
        x = sx * 0.0060
        phi = math.asin(x / R)
        loc = _front(R, x, 0.0255, 0.0002)
        add(prism(f"static_paratrooper_star_{'l' if sx < 0 else 'r'}", star, 0.0011,
                  location=loc, rotation=(math.pi / 2, sx * math.radians(12), phi)), red)

    # Grass skirt: flared band carrying three rows of leafy lumps.
    add(lathe('static_paratrooper_skirt', [(R * 1.00, 0.0195), (R * 1.08, 0.0150),
                                            (R * 1.14, 0.0080), (R * 1.16, 0.0045),
                                            (R * 1.02, 0.0040)], segments=36), grass)
    for row, (z, rr) in enumerate(((0.0175, 1.05), (0.0140, 1.10), (0.0105, 1.14), (0.0068, 1.17))):
        for i in range(22):
            # Fixed pseudo-random jitter (no RNG state) so tufts read hand-made yet rebuild identically.
            j1, j2, j3 = (math.sin(12.9898 * (i + 1) + 78.233 * (row + 1) * n) for n in (1, 2, 3))
            a = 2 * math.pi * (i + 0.5 * row + 0.35 * j1) / 22
            lump = add(sphere(f'static_paratrooper_grass_{row}_{i}', 0.0017 * (1 + 0.18 * j2),
                              segments=8, rings=6,
                              location=(R * (rr + 0.02 * j3) * math.cos(a),
                                        R * (rr + 0.02 * j3) * math.sin(a), z + 0.0007 * j2)),
                       grass if (i + row) % 3 else grass_dark)
            lump.scale = (0.9, 0.9, 1.45 + 0.25 * j3)
            lump.rotation_euler = (0.25 * j1, 0.25 * j2, a)

    for sx in (-1, 1):
        side = 'l' if sx < 0 else 'r'
        path = catmull_rom([(sx * R * 0.92, 0.0005, 0.0300), (sx * R * 1.16, -0.0005, 0.0240),
                            (sx * R * 1.36, -0.0010, 0.0185)], 4)
        add(tube(f'static_paratrooper_arm_{side}', path, 0.0020, segments=10), yellow)
        add(sphere(f'static_paratrooper_hand_{side}', 0.0023, segments=10, rings=8,
                   location=(sx * R * 1.38, -0.0012, 0.0172)), yellow)
        foot = add(sphere(f'static_paratrooper_foot_{side}', 0.0028, segments=12, rings=8,
                          location=(sx * 0.0048, -0.0030, 0.0014)), yellow)
        foot.scale = (1.0, 1.5, 0.55)

    for part in parts[1:]:
        parent_to(part, root)
    root.location = (TOY_SLOTS['paratrooper'], P.HUB_Y, TOY_BASE_Z)
    root.rotation_euler = (0, 0, math.radians(-10))
    return {'root': root, 'hit': body, 'parts': parts}


def _peace_sign_image():
    """Hand-lettered PEACE placard, drawn from shapes rather than a photo crop."""
    from . import texpaint as TP
    c = TP.Canvas(512, 384, background=TP.srgb(236, 232, 218))
    green, blue, red = TP.srgb(30, 140, 84), TP.srgb(38, 84, 176), TP.srgb(214, 44, 48)
    yellow = TP.srgb(246, 214, 20)
    edge = TP.srgb(196, 190, 176)
    for inset, colour in ((0.0, edge), (0.018, TP.srgb(236, 232, 218))):
        c.rect(inset, inset * 1.33, 1 - inset, 1 - inset * 1.33, colour)
    # Bubble lettering: heavy rounded dilation makes Inter's strokes fat and
    # soft-cornered like the photo's hand-drawn hippie face; letters nearly touch.
    letters = [('P', 0.155, 0.52, 0.56, green, 6), ('E', 0.36, 0.72, 0.27, blue, -4),
               ('A', 0.52, 0.73, 0.29, red, 3), ('C', 0.68, 0.72, 0.27, green, -6),
               ('E', 0.85, 0.70, 0.27, blue, 5)]
    for ch, x, y, h, colour, deg in letters:
        c.text(ch, (x, y), h, colour, rotation=math.radians(deg), stretch=0.95, bold=0.025)
    cx, cy, r = 0.46, 0.28, 0.24
    c.ellipse((cx, cy), (r * 0.75, r), yellow)
    c.ellipse((cx, cy), (r * 0.75 * 0.62, r * 0.62), TP.srgb(236, 232, 218))
    w = 0.05
    c.line((cx, cy + r * 0.8), (cx, cy - r * 0.8), w, yellow)
    c.line((cx, cy), (cx - r * 0.44, cy - r * 0.58), w, yellow)
    c.line((cx, cy), (cx + r * 0.44, cy - r * 0.58), w, yellow)
    c.text('C', (0.82, 0.30), 0.31, blue, rotation=math.radians(-8), bold=0.030)
    return c.to_image('cards_sign')


def build_cards():
    """Two-eyed Minion in blue overalls gripping the PEACE placard pole (toys-trio.jpg).

    Front is local -Y. The placard carries authored artwork on an opaque face.
    """
    import bpy
    from .util import tube as sweep
    from . import texpaint as TP
    root, body = _toy_body('cards', M.srgb(248, 206, 52))
    parts = [body]
    yellow = body.data.materials[0]
    denim = M.pbr('cards_denim', M.srgb(70, 130, 200), roughness=0.54)
    black = M.pbr('cards_rubber', (0.012, 0.013, 0.015), roughness=0.48)
    silver = M.pbr('cards_goggles', (0.52, 0.55, 0.58), metallic=0.65, roughness=0.3)

    def add(obj, mat):
        M.assign(obj, mat)
        parts.append(obj)
        return obj

    def tube(name, points, radius, mat):
        return add(sweep(name, points, radius, segments=10), mat)

    add(sphere('static_cards_overalls', 0.013, segments=32, rings=20,
               location=(0, 0, 0.010), scale=(1.065, 1.10, 0.72)), denim)
    bib = add(box('static_cards_bib', (0.017, 0.002, 0.010),
                  location=(0, -0.0115, 0.016)), denim)
    bevel(bib, 0.001, 3)
    for side in (-1, 1):
        add(sphere(f'static_cards_boot_{side}', 0.0044,
                   location=(side * 0.006, -0.001, 0.002), scale=(1, 1.45, 0.65)), black)
        tube(f'static_cards_strap_{side}',
             [(side * 0.010, 0.007, 0.023), (side * 0.011, -0.005, 0.022),
              (side * 0.007, -0.0128, 0.018)], 0.0015, denim)
        add(sphere(f'static_cards_button_{side}', 0.00085,
                   location=(side * 0.007, -0.014, 0.018)), black)
        tube(f'static_cards_arm_{side}',
             [(side * 0.012, -0.001, 0.021), (side * 0.014, -0.009, 0.014),
              (side * 0.004, -0.018, 0.011)], 0.0020, yellow)
        add(sphere(f'static_cards_glove_{side}', 0.0032,
                   location=(side * 0.003, -0.018, 0.011), scale=(1.25, 0.8, 0.75)), black)

    tube('static_cards_goggle_strap',
         [(0.0129 * math.cos(a), 0.0129 * math.sin(a), 0.029)
          for a in [2 * math.pi * i / 64 for i in range(65)]], 0.0017, black)
    for side, colour in [(-1, M.srgb(120, 150, 60)), (1, M.srgb(130, 80, 50))]:
        x = side * 0.0065
        _eye(f'static_cards_{"l" if side < 0 else "r"}', add, _front(0.0129, x, 0.029, 0.0004),
             0.0055, colour, rim=silver, rim_r=0.0064, rim_t=0.00135)

    # Placard: tilted board behind the top of the pole, artwork on its front face.
    pole_y = -0.019
    sign_w, sign_h, sign_z = 0.035, 0.027, 0.0525
    tilt = math.radians(-5)
    sign_y = pole_y + 0.0024
    add(cylinder('static_cards_pole', 0.0012, sign_z - sign_h / 2 + 0.004, segments=20,
                 location=(0, pole_y, (sign_z - sign_h / 2 + 0.004) / 2)), yellow)
    board = add(box('int_cards__2', (sign_w, 0.0016, sign_h), location=(0, sign_y, sign_z),
                    rotation=(0, tilt, 0)), M.pbr('cards_board', M.srgb(226, 222, 208), roughness=0.7))
    bevel(board, width=0.0004, segments=2)
    face = plane('static_cards_sign_print', (sign_w - 0.0004, sign_h - 0.0004),
                 location=(0, sign_y - 0.00082, sign_z), rotation=(math.pi / 2, tilt, 0))
    add(face, TP.textured('cards_sign', _peace_sign_image(), roughness=0.7))

    for part in parts[1:]:
        parent_to(part, root)
    root.location = (TOY_SLOTS['cards'], P.HUB_Y, TOY_BASE_Z)
    root.rotation_euler = (0, 0, math.radians(-3))
    return {'root': root, 'hit': body, 'parts': parts}


COAT_R, COAT_H = 0.0160, 0.046


def build_robot():
    """Wide Minion in the belted beige coat: raised folded collar, open front
    with toggle, olive goggles with green and dark irises (toys-trio.jpg)."""
    from .util import tube, lathe, catmull_rom, thick_profile
    R, H = COAT_R, COAT_H
    root, body = _toy_body('robot', M.srgb(248, 206, 52), R, H, lift=0.0015)
    parts = [body]

    def add(obj, material):
        M.assign(obj, material)
        parts.append(obj)
        return obj

    coat = M.pbr('robot_coat', M.srgb(178, 162, 110), roughness=0.85)
    collar_mat = M.pbr('robot_collar', M.srgb(196, 182, 130), roughness=0.95)
    seam = M.pbr('robot_seam', M.srgb(120, 104, 64), roughness=0.9)
    olive = M.pbr('robot_goggles', M.srgb(150, 140, 72), roughness=0.4)
    strap = M.pbr('robot_strap', M.srgb(96, 58, 38), roughness=0.6)
    boot = M.pbr('robot_boot', M.srgb(90, 70, 50), roughness=0.7)

    # Coat shell with an open front: the gap is filled by the overlapping flap.
    front = -math.pi / 2
    gap = math.radians(14)
    coat_profile = [(R * 1.16, 0.0020), (R * 1.15, 0.0050), (R * 1.10, 0.0160),
                    (R * 1.06, 0.0235), (R * 1.03, 0.0265)]
    # Real cloth thickness so the open front edges read as fabric, not a sheet.
    add(lathe('static_robot_coat', thick_profile(coat_profile, 0.0009), a0=front + gap,
              a1=front + 2 * math.pi - gap, segments=44, close_profile=True), coat)
    flap_profile = [(r + 0.0010, z) for r, z in coat_profile]
    add(lathe('static_robot_coat_flap', thick_profile(flap_profile, 0.0008),
              a0=front - math.radians(26), a1=front + math.radians(22), segments=10,
              close_profile=True), coat)
    add(tube('static_robot_flap_edge', [(R * 1.12 * math.cos(front + math.radians(22)) + 0.0003,
                                          R * 1.12 * math.sin(front + math.radians(22)) - 0.0006, z)
                                         for z in (0.003, 0.016, 0.027)], 0.00045, segments=6), seam)
    # Toggle fastening on the flap.
    tog = cylinder('static_robot_toggle', 0.0009, 0.0055, segments=10,
                   location=(0.0042, -R * 1.18, 0.0135), rotation=(0, math.pi / 2, math.radians(8)))
    add(tog, M.pbr('robot_toggle', M.srgb(150, 120, 70), roughness=0.55))
    add(tube('static_robot_toggle_loop', [(0.0010, -R * 1.17, 0.0145), (0.0030, -R * 1.19, 0.0138),
                                           (0.0068, -R * 1.18, 0.0132)], 0.00035, segments=6), seam)
    # Hem stitch line.
    add(_band('static_robot_hem_seam', R * 1.155, 0.0046, 0.0054, thickness=0.0003), seam)

    # Folded fur collar: rises from the neckline, rolls over and droops outward,
    # open at the front beneath the goggles.
    collar_profile = [(R * 1.03, 0.0250), (R * 1.10, 0.0290), (R * 1.24, 0.0306),
                      (R * 1.34, 0.0290), (R * 1.36, 0.0256), (R * 1.30, 0.0238)]
    add(lathe('static_robot_collar', thick_profile(collar_profile, 0.0011),
              a0=front + math.radians(18), a1=front + 2 * math.pi - math.radians(18),
              segments=40, close_profile=True), collar_mat)
    # Olive goggles, strap, and mismatched irises.
    eye_z = 0.0355
    for sx, iris in ((-1, M.srgb(40, 150, 60)), (1, M.srgb(64, 52, 46))):
        centre = _front(R, sx * 0.0071, eye_z, 0.0012)
        _eye(f"static_robot_{'l' if sx < 0 else 'r'}", add, centre, 0.0056, iris,
             rim=olive, rim_r=0.0066, rim_t=0.0017)
    add(box('static_robot_goggle_bridge', (0.004, 0.0022, 0.0024),
            location=_front(R, 0.0, eye_z, 0.0016)), olive)
    add(_band('static_robot_strap', R, eye_z - 0.0019, eye_z + 0.0019, thickness=0.0006), strap)

    # Sleeves hanging at the sides with cuffs and gloved hands, boots below.
    for sx in (-1, 1):
        side = 'l' if sx < 0 else 'r'
        path = catmull_rom([(sx * R * 1.00, 0.0010, 0.0262), (sx * R * 1.22, 0.0000, 0.0180),
                            (sx * R * 1.30, -0.0012, 0.0085)], 4)
        add(tube(f'static_robot_sleeve_{side}', path, 0.0030, segments=12,
                 radius_scale=lambda t: 0.9 + 0.15 * t), coat)
        add(sphere(f'static_robot_glove_{side}', 0.0024, segments=10, rings=8,
                   location=(sx * R * 1.31, -0.0014, 0.0058)), M.pbr('robot_glove', M.srgb(150, 130, 90), roughness=0.75))
        b = add(sphere(f'static_robot_boot_{side}', 0.0033, segments=12, rings=8,
                       location=(sx * 0.0058, -0.0030, 0.0016)), boot)
        b.scale = (1.0, 1.4, 0.55)

    for part in parts[1:]:
        parent_to(part, root)
    root.location = (TOY_SLOTS['robot'], P.HUB_Y, TOY_BASE_Z)
    root.rotation_euler = (0, 0, math.radians(8))
    return {'root': root, 'hit': body, 'parts': parts}


# Joker minifigure (figure-green-hair.jpg), authored in LEGO millimetres and
# scaled by JOKER_K so it keeps the scene's established toy size.
JOKER_K = 0.0015
_HEAD_R, _HEAD_H = 4.8, 8.8
_TORSO_WB, _TORSO_WT, _TORSO_H, _TORSO_D = 15.6, 12.0, 12.8, 8.0


def _joker_atlas():
    """One 512px atlas: torso front print (upper-left), head wrap (bottom half).

    Everything is painted from shapes measured off the photo, never sampled
    from it. Head coordinates are arc-length millimetres around the head.
    """
    from . import texpaint as TP
    c = TP.Canvas(512, background=TP.srgb(238, 235, 226))
    circ = 2 * math.pi * _HEAD_R

    # ---- torso front, u 0..0.5, v 0.5..1, in torso mm (x from centre, z from bottom)
    def T(x, z):
        return ((x + _TORSO_WB / 2) / _TORSO_WB * 0.5, 0.5 + z / _TORSO_H * 0.5)

    def tpoly(pts, colour):
        c.polygon([T(*p) for p in pts], colour)

    def tline(a, b, w, colour):
        c.line(T(*a), T(*b), w / _TORSO_WB * 0.5, colour)

    jacket = TP.srgb(92, 50, 142)
    lapel = TP.srgb(158, 128, 206)
    outline = TP.srgb(28, 14, 40)
    mustard = TP.srgb(196, 152, 44)
    tie = TP.srgb(58, 128, 60)
    vest = TP.srgb(104, 58, 150)
    stripe = TP.srgb(150, 104, 196)
    c.rect(0.0, 0.5, 0.5, 1.0, jacket)
    tpoly([(-3.7, 1.4), (3.7, 1.4), (3.5, 7.2), (-3.5, 7.2)], vest)
    for i in range(-3, 4):
        tline((i * 0.95, 1.5), (i * 0.95, 7.0), 0.22, stripe)
    tpoly([(-3.4, 12.8), (3.4, 12.8), (0.0, 6.2)], mustard)
    tpoly([(-0.75, 12.3), (0.75, 12.3), (1.15, 8.3), (0.0, 7.0), (-1.15, 8.3)], tie)
    for x, z in ((0.0, 11.2), (-0.4, 9.8), (0.45, 9.0), (-0.2, 8.2), (0.3, 10.5)):
        c.ellipse(T(x, z), (0.18 / _TORSO_WB, 0.18 / _TORSO_H * 0.5), TP.srgb(214, 190, 60))
    for sx in (-1, 1):
        pts = [(sx * 6.4, 12.8), (sx * 3.4, 12.8), (sx * 1.1, 6.8), (sx * 3.7, 4.6),
               (sx * 4.7, 8.4), (sx * 6.6, 9.3), (sx * 5.4, 10.5)]
        # Black edge: draw a slightly swollen copy underneath.
        cx = sum(p[0] for p in pts) / len(pts)
        cz = sum(p[1] for p in pts) / len(pts)
        tpoly([(cx + (x - cx) * 1.1, cz + (z - cz) * 1.08) for x, z in pts], outline)
        tpoly(pts, lapel)
        tline((sx * 3.7, 4.6), (sx * 3.6, 1.4), 0.35, outline)
        tline((sx * 6.8, 4.3), (sx * 4.6, 4.0), 0.30, outline)
    for z in (5.6, 4.0, 2.5):
        c.ellipse(T(0.9, z), (0.42 / _TORSO_WB * 0.5, 0.42 / _TORSO_H * 0.5),
                  TP.srgb(206, 170, 58))
    tpoly([(-7.8, 0.0), (7.8, 0.0), (7.8, 1.4), (-7.8, 1.4)], TP.srgb(66, 34, 102))
    tpoly([(-1.0, 0.2), (1.0, 0.2), (1.0, 1.2), (-1.0, 1.2)], TP.srgb(206, 170, 58))

    # ---- head wrap, u 0..1 around the head (front at 0.5), v 0..0.5 over its height
    def H(x, z):
        return (0.5 + x / circ, z / _HEAD_H * 0.5)

    def hpoly(pts, colour):
        c.polygon([H(*p) for p in pts], colour)

    red = TP.srgb(196, 28, 40)
    teeth = TP.srgb(236, 206, 52)
    ink = TP.srgb(20, 16, 18)
    green = TP.srgb(52, 140, 62)

    def grin(xs, top_sag, bottom_drop, corner_z, width):
        top = [(x, corner_z - top_sag * (1 - (x / width) ** 2)) for x in xs]
        bottom = [(x, corner_z - bottom_drop * (1 - (x / width) ** 2) ** 0.65) for x in reversed(xs)]
        return top + bottom

    xs = [(-1 + 2 * i / 20) * 4.1 for i in range(21)]
    hpoly(grin(xs, 0.9, 3.4, 4.7, 4.1), red)
    xs_in = [(-1 + 2 * i / 20) * 3.55 for i in range(21)]
    hpoly(grin(xs_in, 0.75, 2.75, 4.35, 3.55), teeth)
    # Zigzag gap between upper and lower teeth, plus tooth separators.
    zig = []
    for i in range(15):
        x = (-1 + 2 * i / 14) * 3.2
        base = 4.35 - 1.55 * (1 - (x / 3.55) ** 2) ** 0.8
        zig.append(H(x, base + (0.28 if i % 2 else -0.28)))
    c.polyline(zig, 0.16 / _HEAD_H * 0.5, ink)
    # Smile creases curling up past the corners.
    for sx in (-1, 1):
        c.polyline([H(sx * 4.0, 4.8), H(sx * 4.5, 5.3), H(sx * 4.6, 5.9)], 0.22 / _HEAD_H * 0.5, red)
    for sx in (-1, 1):
        c.ellipse(H(sx * 1.55, 5.95), (0.55 / circ, 0.62 / _HEAD_H * 0.5), ink)
        c.ellipse(H(sx * 1.55 + 0.18, 6.15), (0.16 / circ, 0.17 / _HEAD_H * 0.5), TP.srgb(250, 250, 250))
        # Slanted eyebrows: inner ends raised.
        c.polyline([H(sx * 0.55, 7.35), H(sx * 1.6, 7.25), H(sx * 2.7, 6.75)], 0.55 / _HEAD_H * 0.5, green)
        c.polyline([H(sx * 1.0, 5.2), H(sx * 2.1, 5.05)], 0.12 / _HEAD_H * 0.5, TP.srgb(170, 150, 150))
    return c.to_image("bugjar_print")


def _joker_torso(k, material_print, material_side):
    """Tapered minifig torso with the print UV-mapped onto its front face only."""
    import bpy
    wb, wt, h, d = _TORSO_WB * k / 2, _TORSO_WT * k / 2, _TORSO_H * k, _TORSO_D * k / 2
    verts = [(-wb, -d, 0), (wb, -d, 0), (wt, -d * 0.9, h), (-wt, -d * 0.9, h),
             (-wb, d, 0), (wb, d, 0), (wt, d * 0.9, h), (-wt, d * 0.9, h)]
    faces = [(0, 1, 2, 3), (5, 4, 7, 6), (4, 0, 3, 7), (1, 5, 6, 2), (3, 2, 6, 7), (4, 5, 1, 0)]
    mesh = bpy.data.meshes.new("int_bugjar")
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    uv = mesh.uv_layers.new(name="UVMap")
    inset = (1 - _TORSO_WT / _TORSO_WB) / 2 * 0.5
    front_uv = [(0.0, 0.5), (0.5, 0.5), (0.5 - inset, 1.0), (inset, 1.0)]
    for poly in mesh.polygons:
        front = poly.index == 0
        poly.material_index = 0 if front else 1
        for n, li in enumerate(poly.loop_indices):
            uv.data[li].uv = front_uv[n] if front else (0.25, 0.75)
    obj = bpy.data.objects.new("int_bugjar", mesh)
    from .util import link, bevel as _bevel
    link(obj)
    obj.data.materials.append(material_print)
    obj.data.materials.append(material_side)
    _bevel(obj, width=0.4 * k, segments=2)
    return obj


def _joker_head(k, material):
    """Cylindrical minifig head with softened rims and a wrap-around UV."""
    import bpy
    rings = [(0.0, 0.0), (4.1, 0.0), (4.65, 0.35), (4.8, 0.9), (4.8, 7.9), (4.65, 8.45),
             (4.1, 8.8), (0.0, 8.8)]
    seg = 40
    verts, uvs_by_vert, faces = [], [], []
    ring_starts = []
    for r, z in rings:
        start = len(verts)
        if r == 0.0:
            verts.append((0.0, 0.0, z * k))
            uvs_by_vert.append((0.02, 0.02))
        else:
            for i in range(seg + 1):  # duplicated seam column at the back
                a = -math.pi / 2 + 2 * math.pi * (i / seg - 0.5)
                verts.append((r * k * math.cos(a), r * k * math.sin(a), z * k))
                uvs_by_vert.append((i / seg, min(max(z / 8.8, 0.0), 1.0) * 0.5))
        ring_starts.append((start, r == 0.0))
    for (a, pole_a), (b, pole_b) in zip(ring_starts, ring_starts[1:]):
        for i in range(seg):
            if pole_a:
                faces.append((a, b + i + 1, b + i))
            elif pole_b:
                faces.append((a + i, a + i + 1, b))
            else:
                faces.append((a + i, a + i + 1, b + i + 1, b + i))
    mesh = bpy.data.meshes.new("static_bugjar_head")
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    uv = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        poly.use_smooth = True
        for li in poly.loop_indices:
            uv.data[li].uv = uvs_by_vert[mesh.loops[li].vertex_index]
    obj = bpy.data.objects.new(mesh.name, mesh)
    from .util import link, recalc_normals
    link(obj)
    recalc_normals(obj)
    obj.data.materials.append(material)
    return obj


def _recessed_leg(name, size, location, recess_depth, frame):
    """Seated minifig leg: a block whose hollow underside faces the viewer."""
    import bmesh
    obj = box(name, size, location=location)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    front = min(bm.faces, key=lambda f: f.calc_center_median().y)
    inset = bmesh.ops.inset_region(bm, faces=[front], thickness=frame, depth=0.0)
    bmesh.ops.translate(bm, vec=(0.0, recess_depth, 0.0), verts=front.verts)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj


def build_bugjar():
    """Seated Joker minifigure on its display plate, on the right speaker."""
    import bpy
    from mathutils import Vector
    from .util import tube, catmull_rom, recalc_normals, link
    from . import texpaint as TP

    k = JOKER_K
    root = empty("root_bugjar")
    parts = []
    purple = M.pbr('bugjar_purple', M.srgb(104, 56, 160), roughness=0.34)
    leg_purple = M.pbr('bugjar_leg', M.srgb(112, 52, 196), roughness=0.34)
    recess = M.pbr('bugjar_recess', M.srgb(34, 16, 58), roughness=0.6)
    hip = M.pbr('bugjar_hip', M.srgb(72, 38, 112), roughness=0.36)
    white = M.pbr('bugjar_hand', M.srgb(232, 230, 226), roughness=0.3)
    hair = M.pbr('bugjar_hair', M.srgb(40, 140, 62), roughness=0.3)
    cape_cloth = M.pbr('bugjar_cape', M.srgb(92, 50, 190), roughness=0.88)
    plate_black = M.pbr('bugjar_plate', (0.012, 0.012, 0.014), roughness=0.18)
    atlas = TP.textured('bugjar_print', _joker_atlas(), roughness=0.32)

    def add(obj, material=None):
        if material is not None:
            M.assign(obj, material)
        parts.append(obj)
        return obj

    # Display plate: 4x4 black plate with two exposed studs at the front.
    plate_t = 3.2 * k
    plate = add(box("static_bugjar_base", (32 * k, 32 * k, plate_t), location=(0, 0, plate_t / 2)),
                plate_black)
    bevel(plate, width=0.3 * k, segments=2)
    for sx in (-1, 1):
        add(cylinder(f"static_bugjar_stud_{'l' if sx < 0 else 'r'}", 2.4 * k, 1.8 * k, segments=20,
                     location=(sx * 12.0 * k, -9.0 * k, plate_t + 0.9 * k)), plate_black)

    z0 = plate_t
    hy = 3.0  # figure centre line (mm), behind the plate centre so legs reach forward

    # Seated legs pointing at the viewer, hollow ends showing, with a centre gap.
    for sx in (-1, 1):
        leg = _recessed_leg(f"static_bugjar_leg_{'l' if sx < 0 else 'r'}",
                            (7.5 * k, 12.0 * k, 7.2 * k),
                            (sx * 3.95 * k, (hy - 5.5) * k, z0 + 3.6 * k),
                            recess_depth=4.0 * k, frame=1.1 * k)
        leg.data.materials.append(leg_purple)
        leg.data.materials.append(recess)
        add(leg)
    for poly_leg in parts[-2:]:
        # Only faces inside the recess (not the outer frame or sides) get the dark material.
        for poly in poly_leg.data.polygons:
            local = poly.center
            inside = (abs(local.x) < 2.65 * k and abs(local.z) < 2.5 * k
                      and local.y > -6.0 * k + 0.2 * k)
            poly.material_index = 1 if inside else 0
    add(box("static_bugjar_hips", (15.6 * k, 8.0 * k, 5.2 * k),
            location=(0, (hy + 1.0) * k, z0 + 7.0 * k)), hip)

    torso_z = z0 + 9.6 * k
    torso = _joker_torso(k, atlas, purple)
    torso.location = (0, hy * k, torso_z)
    add(torso)

    top_z = torso_z + _TORSO_H * k
    add(cylinder("static_bugjar_neck", 3.0 * k, 1.4 * k, segments=16,
                 location=(0, hy * k, top_z + 0.7 * k)), white)
    head_z = top_z + 1.2 * k
    head = _joker_head(k, atlas)
    head.location = (0, hy * k, head_z)
    add(head)

    # Arms: rounded shoulder, angled sleeve, wrist, open C-shaped hand.
    for sx in (-1, 1):
        side = 'l' if sx < 0 else 'r'
        shoulder = Vector((sx * 6.2, hy - 0.2, 10.9))
        elbow = Vector((sx * 8.4, hy - 1.8, 6.6))
        wrist = Vector((sx * 9.0, hy - 4.2, 3.6))
        path = [p * k + Vector((0, 0, torso_z)) for p in catmull_rom([shoulder, elbow, wrist], 4)]
        add(tube(f"static_bugjar_arm_{side}", path, 2.35 * k, segments=12,
                 radius_scale=lambda t: 1.0 - 0.28 * t), purple)
        add(sphere(f"static_bugjar_shoulder_{side}", 2.6 * k, segments=14, rings=10,
                   location=shoulder * k + Vector((0, 0, torso_z))), purple)
        wrist_end = wrist + Vector((sx * 0.2, -1.4, -0.9))
        add(tube(f"static_bugjar_wrist_{side}", [wrist * k + Vector((0, 0, torso_z)),
                                                 wrist_end * k + Vector((0, 0, torso_z))],
                 1.2 * k, segments=10), white)
        centre = wrist_end + Vector((sx * 0.1, -1.9, -0.6))
        axis = Vector((0.0, -0.35, 1.0)).normalized()
        gap = Vector((0.0, -1.0, 0.0))
        e1 = (gap - axis * gap.dot(axis)).normalized()
        e2 = axis.cross(e1)
        arc = []
        for i in range(17):
            a = math.radians(50 + 260 * i / 16)
            arc.append((centre + (e1 * math.cos(a) + e2 * math.sin(a)) * 2.0) * k
                       + Vector((0, 0, torso_z)))
        add(tube(f"static_bugjar_hand_{side}", arc, 0.95 * k, segments=10,
                 profile_scale=(1.0, 1.35)), white)

    # Hair: a clipped ellipsoid mass with broad locks laid over it, swept up and
    # back from the forehead and flaring out at both sides (strongest on the right).
    head_top = Vector((0, hy, 0)) * k + Vector((0, 0, head_z + 8.8 * k))
    centre = head_top + Vector((0.4, 0.8, 2.4)) * k
    radii = Vector((7.2, 6.6, 5.4))
    cap_profile = []
    for i in range(10):
        el = math.radians(-38 + 128 * i / 9)
        cap_profile.append((max(math.cos(el), 0.0) * k, math.sin(el) * k))
    cap_profile[-1] = (0.0, 1.0 * k)
    cap = revolve("static_bugjar_hair", cap_profile, segments=36, location=centre)
    cap.scale = tuple(radii)
    recalc_normals(cap)
    add(cap, hair)

    def on_mass(az, el, lift=1.0):
        az, el = math.radians(az), math.radians(el)
        return centre + Vector((radii.x * math.sin(az) * math.cos(el),
                                -radii.y * math.cos(az) * math.cos(el),
                                radii.z * math.sin(el))) * k * lift

    locks = [
        [(-8, -30), (0, 15), (22, 52), (62, 70)],
        [(-38, -22), (-32, 22), (-12, 58), (35, 80)],
        [(22, -28), (32, 12), (56, 42), (92, 50)],
        [(46, -34), (62, 2), (86, 24), (108, 22)],
        [(72, -46), (88, -22), (106, -6), (124, -10)],
        [(-58, -30), (-76, -6), (-96, 6), (-118, -2)],
        [(-82, -46), (-98, -32), (-112, -24), (-130, -34)],
        [(2, 38), (40, 72), (118, 70), (160, 48)],
        [(-50, 30), (-62, 62), (-120, 66), (-160, 44)],
        [(118, 26), (148, 38), (174, 24), (196, 4)],
        [(-128, 18), (-160, 26), (-186, 8), (-200, -8)],
        [(96, -2), (122, 8), (142, -4), (156, -22)],
        [(78, -60), (94, -48), (110, -42), (126, -54)],
        [(-78, -60), (-94, -52), (-110, -46), (-126, -56)],
    ]
    for index, ctrl in enumerate(locks):
        pts = [on_mass(az, el, 1.0 + 0.22 * (n / 3) ** 2) for n, (az, el) in enumerate(ctrl)]
        add(tube(f"static_bugjar_hair_lock_{index}", catmull_rom(pts, 5), 2.3 * k, segments=10,
                 radius_scale=lambda t: 1.0 - 0.8 * t ** 1.6, profile_scale=(1.0, 0.55)), hair)

    # Cape: a ribbon strap, then a draped sheet behind the shoulders flaring right.
    # The strap follows the cape's top edge round the back, then crosses the
    # front diagonally, from beside the chin on the left down to the right shoulder.
    neck_z = top_z + 0.2 * k
    strap = [(6.6 * math.cos(math.radians(a)), 4.6 * math.sin(math.radians(a)), 0.2)
             for a in range(20, 161, 20)]
    strap += [(-6.4, 0.2, 1.3), (-4.4, -4.6, 2.1), (-1.6, -5.1, 1.3), (1.4, -4.6, 0.4),
              (4.0, -4.1, 0.05), (6.4, -1.4, 0.2)]
    strap = [Vector((x * k, (hy + y) * k, neck_z + z * k)) for x, y, z in strap]
    add(_strap("static_bugjar_cape_band", strap, Vector((0, hy * k, 0)), 1.6 * k, 0.28 * k),
        cape_cloth)

    nu, nv = 26, 9
    verts, faces = [], []
    for j in range(nv + 1):
        v = j / nv
        for i in range(nu + 1):
            u = i / nu
            a = math.radians(168 - 156 * u)
            right = max(math.cos(a), 0.0)
            grow = 1.0 + 0.36 * v
            fold = 0.55 * math.sin(7 * a) * v
            x = (6.6 * grow + fold) * math.cos(a) + 8.5 * v * right ** 1.4
            y = hy + (4.7 * grow + fold) * math.sin(a) - 2.0 * v * right
            length = 16.5 + 5.0 * right + 0.7 * math.sin(11 * u)
            z = -length * v
            verts.append((x * k, y * k, neck_z + z * k))
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            faces.append((a, a + 1, a + nu + 2, a + nu + 1))
    mesh = bpy.data.meshes.new("static_bugjar_cape")
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    for poly in mesh.polygons:
        poly.use_smooth = True
    cape = bpy.data.objects.new(mesh.name, mesh)
    link(cape)
    add(cape, cape_cloth)

    for part in parts:
        parent_to(part, root)
    root.location = (P.RIGHT_SPEAKER_X, P.SPEAKER_Y, P.SPEAKER_TOP_Z)
    root.rotation_euler = (0, 0, math.radians(-8))
    return {'root': root, 'hit': torso, 'parts': parts}


def _strap(name, controls, axis, width, thickness, samples=6):
    """Closed flat ribbon through `controls`, lying against a vertical axis.

    Its face points radially away from `axis` (a point on the vertical line),
    so it wraps round a neck instead of twisting like a swept tube.
    """
    import bpy
    from .util import link, recalc_normals
    n = len(controls)
    path = []
    for i in range(n):
        p0, p1, p2, p3 = (controls[(i + j) % n] for j in (-1, 0, 1, 2))
        for s in range(samples):
            t = s / samples
            path.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                               + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t))
    m = len(path)
    verts, faces = [], []
    for i, p in enumerate(path):
        tangent = (path[(i + 1) % m] - path[i - 1]).normalized()
        out = Vector((p.x - axis.x, p.y - axis.y, 0.0)).normalized()
        across = tangent.cross(out).normalized() * (width / 2)
        out = across.cross(tangent).normalized() * (thickness / 2)
        for side in (-1, 1):
            for w in (-1, 1):
                verts.append(p + out * side + across * w)
    for i in range(m):
        a, b = 4 * i, 4 * ((i + 1) % m)
        faces += [(a + 0, a + 1, b + 1, b + 0), (a + 2, b + 2, b + 3, a + 3),
                  (a + 0, b + 0, b + 2, a + 2), (a + 1, a + 3, b + 3, b + 1)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    mesh.validate()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    recalc_normals(obj)
    return obj


def _fuzzy_ball(name, radii, centre, fuzz=0.035, seed=0.0, rings=18, segments=36, flatten_front=0.0):
    """Irregular fur-ball with equirectangular UVs; front (-Y) sits at u = 0.5.

    Deterministic sine noise breaks the perfect sphere so the silhouette reads
    as soft plush rather than ceramic, without any hair geometry.
    """
    import bpy
    from .util import link, recalc_normals
    rx, ry, rz = radii
    verts, uvs, faces = [], [], []
    cols = segments + 1
    for j in range(rings + 1):
        el = -math.pi / 2 + math.pi * j / rings
        for i in range(cols):
            az = -math.pi + 2 * math.pi * i / segments   # az 0 = front
            n = (1 + fuzz * math.sin(7 * az + 3 * el + seed) * math.cos(5 * el + 2 * az + seed * 1.7)
                 + fuzz * 0.6 * math.sin(13 * az - 9 * el + seed * 2.3))
            if abs(j - rings / 2) < rings / 2 - 0.5 and flatten_front:
                front = max(math.cos(az) * math.cos(el), 0.0)
                n *= 1 - flatten_front * front ** 4
            if j in (0, rings):
                n = 1.0
            x = rx * n * math.cos(el) * math.sin(az)
            y = -ry * n * math.cos(el) * math.cos(az)
            z = rz * n * math.sin(el)
            verts.append((centre[0] + x, centre[1] + y, centre[2] + z))
            uvs.append((i / segments, j / rings))
    for j in range(rings):
        for i in range(segments):
            a0 = j * cols + i
            faces.append((a0, a0 + 1, a0 + cols + 1, a0 + cols))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate(clean_customdata=False)
    uv = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        poly.use_smooth = True
        for li in poly.loop_indices:
            uv.data[li].uv = uvs[mesh.loops[li].vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    return recalc_normals(obj)


def _plush_face_image():
    """Head fur print: cream fur streaks and the grey eye/muzzle mask.

    Coordinates are degrees: azimuth (0 front, + to the plush's left as seen
    by the viewer's right) and elevation.
    """
    from . import texpaint as TP
    c = TP.Canvas(512, 256, background=TP.srgb(236, 230, 212))

    def P(az, el):
        return (0.5 + az / 360.0, 0.5 + el / 180.0)

    streak = TP.srgb(224, 217, 198)
    for i in range(160):
        az = (i * 47.3) % 360 - 180
        el = ((i * 29.7) % 150) - 75
        length = 6 + (i * 7) % 8
        c.line(P(az, el), P(az + length * 0.3, el - length), 0.0016, streak)
    grey = TP.srgb(138, 138, 148)
    for sx in (-1, 1):
        c.ellipse(P(sx * 23, 0), (24 / 360, 21 / 180), grey, rotation=math.radians(sx * -28))
    c.polygon([P(-16, 4), P(16, 4), P(13, -22), P(5, -34), P(-5, -34), P(-13, -22)], grey)
    # Soft cream wedge down the forehead splitting the two patches.
    c.polygon([P(-6, 34), P(6, 34), P(1.5, 6), P(-1.5, 6)], TP.srgb(236, 230, 212))
    return c.to_image('plush_face')


def build_plush():
    """YooHoo-style plush on the left speaker (plush.jpg): big fuzzy cream head,
    grey mask, glossy pink-rimmed eyes, grey paws and feet, striped tail
    draped down beside the speaker."""
    from .util import tube, catmull_rom
    from . import texpaint as TP
    from mathutils import Vector
    root = empty("root_plush")
    parts = []
    cream = M.pbr("plush_cream", M.srgb(236, 230, 212), roughness=0.95)
    grey = M.pbr("plush_grey", M.srgb(140, 140, 150), roughness=0.95)
    pink = M.pbr("plush_pink", M.srgb(226, 150, 190), roughness=0.95)
    pink_rim = M.pbr("plush_eye_rim", M.srgb(190, 120, 160), roughness=0.4)
    glossy = M.pbr("plush_eye", M.srgb(40, 26, 36), roughness=0.08)
    nose_mat = M.pbr("plush_nose", (0.02, 0.018, 0.02), roughness=0.3)

    def add(obj, material):
        if material is not None:
            M.assign(obj, material)
        parent_to(obj, root)
        parts.append(obj)
        return obj

    body = add(_fuzzy_ball("int_plush", (0.031, 0.028, 0.030), (0, 0, 0.030), fuzz=0.05, seed=1.3), cream)
    head_c = Vector((0, -0.004, 0.079))
    head_r = (0.038, 0.034, 0.036)
    head = add(_fuzzy_ball("int_plush__2", head_r, tuple(head_c), fuzz=0.04, seed=4.1,
                           flatten_front=0.10),
               TP.textured("plush_face", _plush_face_image(), roughness=0.95))

    def on_head(az, el, lift=0.0):
        az, el = math.radians(az), math.radians(el)
        d = Vector((head_r[0] * math.cos(el) * math.sin(az), -head_r[1] * math.cos(el) * math.cos(az),
                    head_r[2] * math.sin(el)))
        n = d.normalized()
        return head_c + d * (1 - 0.10 * max(math.cos(az) * math.cos(el), 0) ** 4) + n * lift, n

    # Eyes: glossy domes in pink rims, tilted down at the outer corners.
    from .util import tube as sweep
    for sx in (-1, 1):
        side = 'l' if sx < 0 else 'r'
        centre, n = on_head(sx * 22, 1, 0.001)
        right = n.cross(Vector((0, 0, 1))).normalized()
        up = right.cross(n).normalized()
        tilt = math.radians(sx * 22)
        ex = right * math.cos(tilt) + up * math.sin(tilt)
        ey = -right * math.sin(tilt) + up * math.cos(tilt)
        ring = [centre + ex * math.cos(a) * 0.0094 + ey * math.sin(a) * 0.0080
                for a in [2 * math.pi * i / 36 for i in range(37)]]
        add(sweep(f"static_plush_eyering_{side}", ring, 0.0016, segments=8, caps=False), pink_rim)
        eye = add(sphere(f"static_plush_eye_{side}", 0.0088, segments=20, rings=12,
                         location=tuple(centre - n * 0.002)), glossy)
        eye.rotation_mode = 'QUATERNION'
        eye.rotation_quaternion = n.to_track_quat('Z', 'Y') @ __import__('mathutils').Quaternion((0, 0, 1), tilt)
        eye.scale = (1.0, 0.86, 0.5)
        glint_pos, _ = on_head(sx * 22 - 3, 4, 0.0035)
        add(sphere(f"static_plush_glint_{side}", 0.0012, segments=8, rings=6,
                   location=tuple(glint_pos)), M.pbr("plush_glint", (0.9, 0.9, 0.92), roughness=0.2))

    nose_pos, n = on_head(0, -17, 0.001)
    nose = add(sphere("static_plush_nose", 0.0048, segments=14, rings=10, location=tuple(nose_pos)), nose_mat)
    nose.scale = (1.1, 0.8, 0.85)

    for sx in (-1, 1):
        side = 'l' if sx < 0 else 'r'
        ear_pos, _ = on_head(sx * 80, 26, -0.007)
        ear = add(sphere(f"static_plush_ear_{side}", 0.0085, segments=12, rings=8, location=tuple(ear_pos)), grey)
        ear.scale = (0.6, 1.0, 1.2)
        # Paws reach forward off the chest; feet peek out at the base.
        path = catmull_rom([(sx * 0.019, -0.020, 0.038), (sx * 0.023, -0.031, 0.033),
                            (sx * 0.023, -0.037, 0.026)], 4)
        add(tube(f"static_plush_paw_{side}", path, 0.0068, segments=12,
                 radius_scale=lambda t: 0.85 + 0.2 * t), grey)
        foot = add(sphere(f"static_plush_foot_{side}", 0.0080, segments=12, rings=8,
                          location=(sx * 0.013, -0.024, 0.005)), grey)
        foot.scale = (1.0, 1.35, 0.62)

    # Tail: from behind the body, over the speaker's left edge, hanging down its side.
    ctrl = [(-0.012, 0.018, 0.020), (-0.034, 0.016, 0.016), (-0.052, 0.006, 0.006),
            (-0.058, -0.008, -0.014), (-0.058, -0.020, -0.040), (-0.055, -0.030, -0.060)]
    # One continuous tube, striped by face ring, so stripe joins cannot seam.
    # Each stripe puffs out slightly (pink a little more), like a stuffed tail.
    stripes = 9
    path = catmull_rom(ctrl, 18)
    n_rings = len(path) - 1

    def puff(t):
        pos = t * stripes
        stripe, frac = min(int(pos), stripes - 1), pos - int(pos)
        swell = 0.10 + (0.07 if stripe % 2 == 0 else 0.0)
        return (1.0 + 0.3 * t) * (1.0 + swell * math.sin(math.pi * min(frac, 1.0)))

    tail = add(tube("static_plush_tail", path, 0.0095, segments=16, radius_scale=puff), pink)
    tail.data.materials.append(grey)
    segs = 16
    for poly in tail.data.polygons:
        ring = poly.index // segs
        if ring < n_rings:
            poly.material_index = 0 if int(ring / n_rings * stripes) % 2 == 0 else 1
    tip = add(_fuzzy_ball("static_plush_tail_tip", (0.014, 0.014, 0.016), tuple(path[-1] + Vector((0, -0.002, -0.006))),
                          fuzz=0.08, seed=2.2, rings=10, segments=18), pink)

    root.location = (P.LEFT_SPEAKER_X, P.SPEAKER_Y - 0.008, P.SPEAKER_TOP_Z)
    root.rotation_euler = (0, 0, math.radians(8))
    return {'root': root, 'hit': body, 'parts': parts}


def build_all():
    return {
        'paratrooper': build_paratrooper(),
        'cards': build_cards(),
        'robot': build_robot(),
        'bugjar': build_bugjar(),
        'plush': build_plush(),
    }
