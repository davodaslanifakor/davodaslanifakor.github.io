"""Desk, wall, and the holder wall that carries the off-desk objects.

World axes (Blender, Z-up): +X right, +Y toward the back wall, +Z up.
The desk surface sits at Z = DESK_TOP so every other module can place objects
by simply resting them on that height.
"""

import math
from . import materials as M
from .util import box, plane, bevel, smooth

DESK_TOP = 0.750
DESK_WIDTH = 1.700
DESK_DEPTH = 0.720
DESK_CENTER_Y = 0.040
DESK_BACK_Y = DESK_CENTER_Y + DESK_DEPTH / 2      # 0.400
DESK_FRONT_Y = DESK_CENTER_Y - DESK_DEPTH / 2     # -0.320
WALL_Y = DESK_BACK_Y + 0.020                      # 0.420

HOLDER_SHELF_Z = 1.190
HOLDER_TOP_Z = HOLDER_SHELF_Z + 0.011
HOLDER_CENTER_X = 1.010
HOLDER_Y = WALL_Y - 0.085


def build_wall():
    wall = plane("static_wall", (3.400, 2.700),
                 location=(0.0, WALL_Y, 1.350),
                 rotation=(math.pi / 2, 0, 0))
    M.assign(wall, M.wall())
    return wall


def build_floor():
    floor = plane("static_floor", (4.000, 3.000), location=(0.0, -0.600, 0.0))
    M.assign(floor, M.pbr("floor", (0.085, 0.080, 0.075), roughness=0.90))
    return floor


def build_desk():
    top = box("static_desk_top", (DESK_WIDTH, DESK_DEPTH, 0.026),
              location=(0.0, DESK_CENTER_Y, DESK_TOP - 0.013))
    M.assign(top, M.desk())
    bevel(top, width=0.0025, segments=2)
    smooth(top)

    # Modesty panel rather than four legs: that is what reads in the reference,
    # and it keeps the silhouette clean from the orbit camera's low angles.
    panel = box("static_desk_panel", (DESK_WIDTH - 0.060, 0.022, 0.380),
                location=(0.0, DESK_BACK_Y - 0.080, DESK_TOP - 0.230))
    M.assign(panel, M.desk())

    legs = []
    for sx in (-1, 1):
        leg = box(f"static_desk_leg_{'l' if sx < 0 else 'r'}",
                  (0.045, DESK_DEPTH - 0.090, DESK_TOP - 0.026),
                  location=(sx * (DESK_WIDTH / 2 - 0.055), DESK_CENTER_Y,
                            (DESK_TOP - 0.026) / 2))
        M.assign(leg, M.desk())
        legs.append(leg)

    return [top, panel, *legs]


MAT_TOP = DESK_TOP + 0.004
MAT_X0, MAT_X1 = -0.640, 0.740
MAT_Y0, MAT_Y1 = -0.312, -0.045   # back edge runs in front of the hub and speakers


def build_mat():
    """Desk mat from under the phone to past the phone stand (desk-wide-lit.jpg).

    Rounded corners with a slightly raised stitched rim; its back edge stops in
    front of the hub and speakers, which stand on the bare desk.
    """
    from .util import prism, rounded_rect, tube
    w, d = MAT_X1 - MAT_X0, MAT_Y1 - MAT_Y0
    cx, cy = (MAT_X0 + MAT_X1) / 2, (MAT_Y0 + MAT_Y1) / 2
    mat = prism("static_desk_mat", rounded_rect(w / 2, d / 2, 0.018, steps=6), 0.004,
                location=(cx, cy, DESK_TOP))
    M.assign(mat, M.mat_surface())
    bevel(mat, width=0.0012, segments=2)
    rim = [(cx + x, cy + y, MAT_TOP - 0.0006) for x, y in rounded_rect(w / 2 - 0.0012, d / 2 - 0.0012, 0.017, steps=6)]
    rim.append(rim[0])
    stitch = tube("static_desk_mat_rim", rim, 0.0011, segments=6, caps=False)
    M.assign(stitch, M.pbr("deskmat_rim", (0.028, 0.029, 0.031), roughness=0.7))
    return [mat, stitch]


def build_holder_wall():
    """Wall-mounted shelf, clear to the right of the monitors.

    Replaces the real side cabinet per DESK_PLAN.md: it carries the clock and
    the elephant, and gives the composition vertical range the desk alone lacks.
    A single board with two brackets, not a bookcase - it should read as a ledge.
    """
    parts = []
    board = box("static_holder_shelf", (0.520, 0.170, 0.022),
                location=(HOLDER_CENTER_X, HOLDER_Y, HOLDER_SHELF_Z))
    M.assign(board, M.shelf())
    bevel(board, width=0.002, segments=2)
    parts.append(board)

    for sx in (-1, 1):
        bracket = box(f"static_holder_bracket_{'l' if sx < 0 else 'r'}",
                      (0.016, 0.120, 0.090),
                      location=(HOLDER_CENTER_X + sx * 0.205, HOLDER_Y + 0.020,
                                HOLDER_SHELF_Z - 0.056))
        M.assign(bracket, M.shelf())
        parts.append(bracket)

    return parts


CABINET_X0, CABINET_X1 = 0.862, 1.132
CABINET_Y = 0.200
CABINET_TOP = DESK_TOP + 0.065


def build_side_cabinet():
    """Low dark side cabinet standing on the floor right of the desk
    (desk-wide-dark.jpg), carrying the clock and the microlab subwoofer."""
    from .util import cylinder, tube
    w = CABINET_X1 - CABINET_X0
    cx = (CABINET_X0 + CABINET_X1) / 2
    d = 0.35
    body = box('static_side_cabinet_body', (w, d, CABINET_TOP - 0.022),
               location=(cx, CABINET_Y, (CABINET_TOP - 0.022) / 2))
    M.assign(body, M.desk())
    bevel(body, 0.002, 2)
    top = box('static_side_cabinet', (w + 0.010, d + 0.010, 0.022),
              location=(cx, CABINET_Y, CABINET_TOP - 0.011))
    M.assign(top, M.desk())
    bevel(top, 0.002, 2)
    # Door seam and a small handle so the carcass reads as furniture.
    seam = box('static_side_cabinet_seam', (w - 0.03, 0.002, 0.002),
               location=(cx, CABINET_Y - d / 2 - 0.0005, CABINET_TOP - 0.06))
    M.assign(seam, M.pbr("cabinet_seam", (0.02, 0.02, 0.022), roughness=0.7))

    sub_x, sub_y = cx + 0.035, 0.255
    subwoofer = box('static_subwoofer', (0.15, 0.16, 0.14),
                    location=(sub_x, sub_y, CABINET_TOP + 0.070))
    M.assign(subwoofer, M.pbr("subwoofer", (0.035, 0.034, 0.033), roughness=0.35))
    bevel(subwoofer, 0.004, 3)
    knob = cylinder('static_subwoofer_knob', 0.011, 0.008, segments=28,
                    location=(sub_x + 0.030, sub_y - 0.080 - 0.004, CABINET_TOP + 0.080),
                    rotation=(math.pi / 2, 0, 0))
    M.assign(knob, M.pbr("subwoofer_knob", (0.30, 0.31, 0.33), roughness=0.3, metallic=0.8))
    ring = [(sub_x + 0.030 + 0.0135 * math.cos(a), sub_y - 0.0802, CABINET_TOP + 0.080 + 0.0135 * math.sin(a))
            for a in [2 * math.pi * i / 32 for i in range(33)]]
    glow = tube('static_subwoofer_ring', ring, 0.0012, segments=6, caps=False)
    M.assign(glow, M.pbr("subwoofer_ring", (0.05, 0.25, 1.0), roughness=0.3,
                         emission=(0.05, 0.25, 1.0), emission_strength=1.5))
    return [body, top, seam, subwoofer, knob, glow]
