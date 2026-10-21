"""Display bicycle and sourced miniature collectibles."""

import math
import bpy
from . import materials as M
from .util import box, cylinder, empty, parent_to, tube, sheet, bevel, smooth, lathe

CASE_CENTRE = (1.430, -0.470)


def _bike_ring(name, x, cy, cz, radius, material):
    path = [(x, cy + math.cos(a) * radius, cz + math.sin(a) * radius)
            for a in [i * math.tau / 32 for i in range(33)]]
    obj = tube(name, path, 0.0034, segments=6, caps=False)
    M.assign(obj, material)
    return obj


def build_bicycle():
    root = empty("root_display_bicycle", (CASE_CENTRE[0], CASE_CENTRE[1], 0.470))
    cream = M.pbr("bicycle_enamel", (0.74, 0.70, 0.56), roughness=0.32, metallic=0.42)
    tire = M.pbr("bicycle_tire", (0.022, 0.024, 0.022), roughness=0.82)
    chrome = M.pbr("bicycle_chrome", (0.62, 0.65, 0.62), roughness=0.24, metallic=0.92)
    leather = M.pbr("bicycle_saddle", (0.34, 0.20, 0.11), roughness=0.58)
    parts = []

    def add(obj, mat):
        M.assign(obj, mat)
        parent_to(obj, root)
        parts.append(obj)
        return obj

    rear_y, front_y, axle_z, radius = -0.155, 0.155, 0.155, 0.132
    for wheel_index, cy in enumerate((rear_y, front_y)):
        for side in (-1, 1):
            x = side * 0.011
            add(_bike_ring(f"static_bicycle_tire_{wheel_index}_{side}", x, cy, axle_z, radius, tire), tire)
            add(_bike_ring(f"static_bicycle_rim_{wheel_index}_{side}", x * 0.78, cy, axle_z,
                           radius * 0.88, chrome), chrome)
    # Twelve thin spokes per wheel: enough to read at room scale without a dense mesh.
    for wheel_index, cy in enumerate((rear_y, front_y)):
        for spoke in range(12):
            a = spoke * math.tau / 12
            end = (cy + math.cos(a) * radius * 0.88, axle_z + math.sin(a) * radius * 0.88)
            spoke_obj = tube(f"static_bicycle_spoke_{wheel_index}_{spoke}",
                             [(-0.006, cy, axle_z), (0.0, end[0], end[1])], 0.00065,
                             segments=4)
            add(spoke_obj, chrome)

    # Axles and two connected triangular frames in the visible YZ side plane.
    crank_y, crank_z = -0.018, 0.155
    seat_y, seat_z = -0.060, 0.355
    head_y, head_z = 0.086, 0.345
    frame_paths = [
        [(0, rear_y, axle_z), (0, seat_y, seat_z), (0, crank_y, crank_z), (0, rear_y, axle_z)],
        [(0, crank_y, crank_z), (0, head_y, head_z), (0, seat_y, seat_z)],
        [(0, head_y, head_z), (0, front_y, axle_z)],
        [(0, seat_y, seat_z), (0, front_y, axle_z)],
    ]
    for i, path in enumerate(frame_paths):
        add(tube(f"static_bicycle_frame_{i}", path, 0.0035, segments=7), cream)
    add(tube("static_bicycle_fork", [(0, head_y, head_z), (0, front_y, axle_z)], 0.0030, segments=7), chrome)
    add(tube("static_bicycle_seatpost", [(0, seat_y, seat_z), (0, seat_y - 0.010, 0.388)], 0.0023, segments=6), chrome)
    saddle = box("static_bicycle_saddle", (0.016, 0.057, 0.009),
                 (0, seat_y - 0.018, 0.391))
    bevel(saddle, 0.004, 3)
    add(saddle, leather)
    # Drop bars and stem.
    add(tube("static_bicycle_stem", [(0, head_y, head_z), (0, head_y + 0.006, 0.385)],
             0.0025, segments=6), chrome)
    bar = [(0, head_y + 0.006, 0.385), (0, head_y + 0.032, 0.385),
           (0, head_y + 0.040, 0.373), (0, head_y + 0.032, 0.357)]
    add(tube("static_bicycle_drop_bars", bar, 0.0022, segments=6), chrome)
    add(tube("static_bicycle_grips", [(0, head_y + 0.030, 0.383), (0, head_y + 0.034, 0.360)],
             0.0032, segments=6), leather)
    # Crank, pedals, chain and sprockets.
    add(cylinder("static_bicycle_chainring", 0.022, 0.003, segments=20,
                 location=(0.012, crank_y, crank_z), rotation=(0, math.pi / 2, 0)), chrome)
    add(tube("static_bicycle_chain", [(0.014, rear_y, axle_z), (0.014, crank_y, crank_z)],
             0.0011, segments=4), M.pbr("bicycle_chain", (0.20, 0.21, 0.19), metallic=0.75, roughness=0.38))
    for side in (-1, 1):
        add(box(f"static_bicycle_pedal_{side}", (0.008, 0.025, 0.004),
                (side * 0.019, crank_y + side * 0.012, crank_z)), chrome)
    # A real display cradle touches the axle area and rests on the shelf.
    stand_mat = M.pbr("bicycle_display_stand", (0.19, 0.22, 0.18), roughness=0.54, metallic=0.58)
    add(box("static_bicycle_display_base", (0.072, 0.355, 0.008), (0.020, 0, 0.014)), stand_mat)
    for y in (rear_y, front_y):
        add(tube(f"static_bicycle_display_upright_{y}",
                 [(0.020, y, 0.018), (0.020, y, axle_z - 0.012)], 0.0024, segments=6), stand_mat)
    return root


def build_potted_plant():
    """A compact terracotta pot and leafy plant for the bookcase's middle shelf."""
    root = empty("root_display_plant", (1.395, -0.215, 1.322))
    clay = M.pbr("plant_terracotta", (0.43, 0.22, 0.13), roughness=0.9)
    rim_clay = M.pbr("plant_terracotta_rim", (0.51, 0.28, 0.17), roughness=0.86)
    soil = M.pbr("plant_soil", (0.15, 0.12, 0.09), roughness=1.0)
    stem_mat = M.pbr("plant_stems", (0.20, 0.31, 0.14), roughness=0.9)
    leaf_mats = [
        M.pbr("plant_leaf_sage", (0.27, 0.43, 0.20), roughness=0.81),
        M.pbr("plant_leaf_olive", (0.22, 0.35, 0.13), roughness=0.83),
        M.pbr("plant_leaf_light", (0.36, 0.49, 0.23), roughness=0.82),
    ]

    def add(obj, material):
        M.assign(obj, material)
        parent_to(obj, root)
        return obj

    # The open, tapered body and rolled lip give the miniature a real pot
    # silhouette. Its base sits directly on the shelf top at z=1.322.
    add(lathe("static_potted_plant_pot", [
        (0.034, 0.002), (0.039, 0.006), (0.049, 0.070),
        (0.050, 0.079), (0.043, 0.079), (0.040, 0.067),
    ], segments=32, close_profile=True), clay)
    add(lathe("static_potted_plant_rim", [
        (0.048, 0.068), (0.054, 0.071), (0.055, 0.084),
        (0.052, 0.088), (0.045, 0.088), (0.043, 0.084),
        (0.043, 0.076),
    ], segments=32, close_profile=True), rim_clay)
    add(cylinder("static_potted_plant_soil", 0.043, 0.0025,
                 segments=32, location=(0, 0, 0.077)), soil)

    # Broad leaves with a slight central ridge resemble the heart-shaped
    # reference foliage at the small scale used in this room. Geometry is
    # double-sided, so the plant still reads as the camera orbits the shelf.
    def leaf(name, base, direction, length, width):
        dx, dy, dz = direction
        xy_length = math.hypot(dx, dy) or 1.0
        side = (-dy / xy_length, dx / xy_length, 0.0)
        outline = [
            (0.0, 0.00), (-0.29, 0.04), (-0.48, 0.20),
            (-0.50, 0.40), (-0.38, 0.65), (-0.18, 0.86),
            (0.0, 1.00), (0.18, 0.86), (0.38, 0.65),
            (0.50, 0.40), (0.48, 0.20), (0.29, 0.04),
        ]
        verts = [
            (base[0] + dx * length * 0.51 - 0.002,
             base[1] + dy * length * 0.51,
             base[2] + dz * length * 0.51 + 0.004)
        ]
        for across, along in outline:
            verts.append((base[0] + dx * length * along + side[0] * width * across,
                          base[1] + dy * length * along + side[1] * width * across,
                          base[2] + dz * length * along + 0.004 * math.sin(math.pi * along)))
        faces = []
        for i in range(len(outline)):
            a, b = i + 1, (i + 1) % len(outline) + 1
            faces.extend(((0, a, b), (0, b, a)))
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(verts, [], faces)
        mesh.validate()
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        return obj

    for i in range(13):
        angle = i * math.tau / 13 + 0.18
        reach = 0.052 + (i % 4) * 0.006
        crown = (0.004 * math.cos(angle), 0.004 * math.sin(angle), 0.079)
        base = (reach * math.cos(angle), reach * math.sin(angle),
                0.128 + (i % 5) * 0.009)
        add(tube(f"static_potted_plant_stem_{i:02d}",
                 [crown, (base[0] * 0.56, base[1] * 0.56, base[2] * 0.83), base],
                 0.0017, segments=5), stem_mat)
        direction = (math.cos(angle), math.sin(angle), 0.30 + (i % 3) * 0.11)
        add(leaf(f"static_potted_plant_leaf_{i:02d}", base, direction,
                 0.064 + (i % 4) * 0.006, 0.055 + (i % 3) * 0.005),
            leaf_mats[i % len(leaf_mats)])
    return root


def build_mustang():
    root = empty("root_display_mustang", (CASE_CENTRE[0], CASE_CENTRE[1], 1.322))
    green = M.pbr("mustang_forest_green", (0.055, 0.205, 0.105), roughness=0.25, metallic=0.55)
    dark = M.pbr("mustang_glazing", (0.020, 0.046, 0.052), roughness=0.21, metallic=0.18)
    rubber = M.pbr("mustang_tires", (0.018, 0.019, 0.020), roughness=0.78)
    chrome = M.pbr("mustang_chrome", (0.72, 0.73, 0.68), roughness=0.19, metallic=0.92)
    red = M.pbr("mustang_tail_lamps", (0.52, 0.045, 0.025), roughness=0.26, emission=(0.30, 0.018, 0.008), emission_strength=0.18)

    def add(obj, mat, bevel_width=0):
        M.assign(obj, mat)
        if bevel_width:
            bevel(obj, bevel_width, 2)
        parent_to(obj, root)
        return obj

    # X is the car's length: the nose points into the open room (-X).
    add(box("static_mustang_lower_body", (0.278, 0.116, 0.046), (0, 0, 0.068)), green, 0.018)
    add(box("static_mustang_hood", (0.112, 0.112, 0.015), (-0.078, 0, 0.096)), green, 0.010)
    add(box("static_mustang_rear_deck", (0.058, 0.112, 0.013), (0.108, 0, 0.097)), green, 0.008)
    # Fastback side profile: long roof tapering down over the rear window.
    side_profile = [(-0.052, 0.090), (-0.018, 0.139), (0.050, 0.139),
                    (0.116, 0.091), (0.110, 0.085), (-0.045, 0.085)]
    for y in (-0.057, 0.055):
        add(sheet(f"static_mustang_cabin_side_{y}", side_profile, 0.003,
                  plane='XZ', offset=y), green)
    roof = box("static_mustang_roof", (0.075, 0.105, 0.008), (0.028, 0, 0.139))
    add(roof, green, 0.003)
    # Dark inset front/rear glass accents on the sloping fastback silhouette.
    add(sheet("static_mustang_rear_glass", [(0.055, 0.135), (0.111, 0.094),
                                               (0.085, 0.095), (0.045, 0.132)],
              0.0015, plane='XZ', offset=-0.059), dark)
    add(sheet("static_mustang_windshield", [(-0.048, 0.095), (-0.013, 0.135),
                                               (0.007, 0.135), (-0.025, 0.095)],
              0.0015, plane='XZ', offset=-0.059), dark)

    # Four recessed wheels, with inset metal hubs.
    for x in (-0.089, 0.092):
        for y in (-0.060, 0.060):
            wheel = cylinder(f"static_mustang_wheel_{x}_{y}", 0.026, 0.014, segments=24,
                             location=(x, y, 0.044), rotation=(0, math.pi / 2, 0))
            add(wheel, rubber)
            hub = cylinder(f"static_mustang_hub_{x}_{y}", 0.011, 0.015, segments=16,
                           location=(x, y * 1.04, 0.044), rotation=(0, math.pi / 2, 0))
            add(hub, chrome)
    # Thin bumpers, door seams and restrained chrome sill strips.
    for y in (-0.060, 0.060):
        add(box(f"static_mustang_sill_{y}", (0.205, 0.003, 0.006), (0.005, y, 0.062)), chrome)
        add(box(f"static_mustang_door_seam_{y}", (0.0015, 0.0015, 0.040),
                (0.018, y, 0.091)), dark)
    add(box("static_mustang_front_bumper", (0.009, 0.126, 0.012), (-0.141, 0, 0.068)), chrome, 0.004)
    add(box("static_mustang_rear_bumper", (0.009, 0.126, 0.012), (0.141, 0, 0.067)), chrome, 0.004)
    for y in (-0.040, 0.040):
        add(cylinder(f"static_mustang_headlamp_{y}", 0.009, 0.003, segments=16,
                     location=(-0.144, y, 0.084), rotation=(0, math.pi / 2, 0)), chrome)
    # Three vertical tail-light lenses on each rear quarter.
    for y in (-0.048, -0.035, -0.022, 0.022, 0.035, 0.048):
        add(box(f"static_mustang_tail_lamp_{y}", (0.002, 0.006, 0.014),
                (0.142, y, 0.081)), red)
    # Low matte plinth makes the collectible visibly supported on the shelf.
    plinth = box("static_mustang_plinth", (0.304, 0.145, 0.012), (0.0, 0, 0.012))
    add(plinth, M.pbr("mustang_plinth", (0.060, 0.068, 0.060), roughness=0.38, metallic=0.25), 0.004)
    return root
