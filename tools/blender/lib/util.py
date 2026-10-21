"""Shared Blender helpers for the desk build.

Every mesh the runtime touches is named with the ``int_`` / ``static_`` prefixes
from DESK_PLAN.md. Nothing here reaches for bpy.ops where a direct data API call
works, because ops depend on context and make the scripts fragile to run headless.
"""

import bpy
from mathutils import Vector

UNIT = 1.0  # metres


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.length_unit = 'METERS'
    return scene


def link(obj):
    bpy.context.collection.objects.link(obj)
    return obj


def box(name, size, location=(0, 0, 0), rotation=(0, 0, 0)):
    """Axis-aligned box whose origin sits at its own centre."""
    sx, sy, sz = (s / 2 for s in size)
    verts = [
        (-sx, -sy, -sz), (sx, -sy, -sz), (sx, sy, -sz), (-sx, sy, -sz),
        (-sx, -sy, sz), (sx, -sy, sz), (sx, sy, sz), (-sx, sy, sz),
    ]
    # Counter-clockwise seen from outside, so normals point outward (booleans
    # and back-face culling both depend on it).
    faces = [(3, 2, 1, 0), (4, 5, 6, 7), (1, 5, 4, 0),
             (2, 6, 5, 1), (3, 7, 6, 2), (0, 4, 7, 3)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    return link(obj)


def plane(name, size, location=(0, 0, 0), rotation=(0, 0, 0)):
    """Single quad in local XY, facing local +Z, with UVs 0-1.

    The UVs matter: screens are re-textured at runtime with a generated canvas,
    and a mesh exported without TEXCOORD_0 silently ignores any map applied to it.
    u runs along local +X, v along local +Y, so the image sits upright.
    """
    sx, sy = (s / 2 for s in size)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(
        [(-sx, -sy, 0), (sx, -sy, 0), (sx, sy, 0), (-sx, sy, 0)],
        [], [(0, 1, 2, 3)],
    )
    mesh.validate()
    mesh.update()

    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop_index, uv in enumerate(((0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0))):
        uv_layer.data[loop_index].uv = uv
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    return link(obj)


def cylinder(name, radius, depth, segments=24, location=(0, 0, 0), rotation=(0, 0, 0)):
    import math
    verts, faces = [], []
    half = depth / 2
    for i in range(segments):
        a = 2 * math.pi * i / segments
        x, y = radius * math.cos(a), radius * math.sin(a)
        verts.append((x, y, -half))
        verts.append((x, y, half))
    for i in range(segments):
        a, b = 2 * i, 2 * ((i + 1) % segments)
        faces.append((a, b, b + 1, a + 1))
    verts.append((0, 0, -half))
    verts.append((0, 0, half))
    bottom, top = len(verts) - 2, len(verts) - 1
    for i in range(segments):
        a, b = 2 * i, 2 * ((i + 1) % segments)
        faces.append((bottom, b, a))
        faces.append((top, a + 1, b + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    return link(obj)


def bevel(obj, width=0.002, segments=2):
    mod = obj.modifiers.new(name="bevel", type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = 0.6
    mod.harden_normals = True
    return obj


def smooth(obj, angle=0.9):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    mod = obj.modifiers.new(name="weighted_normal", type='WEIGHTED_NORMAL')
    mod.keep_sharp = True
    return obj


def subsurf(obj, levels=2):
    mod = obj.modifiers.new(name="subsurf", type='SUBSURF')
    mod.levels = levels
    mod.render_levels = levels
    return obj


def empty(name, location=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = 'PLAIN_AXES'
    obj.empty_display_size = 0.05
    obj.location = location
    return link(obj)


def parent_to(child, parent):
    """Parent without touching the child's local transform.

    Children are authored in the parent's local space and the parent is posed
    afterwards, so there is no world transform to preserve. Deliberately avoids
    matrix_parent_inverse: it reads parent.matrix_world, which is stale until the
    depsgraph updates and silently mis-places everything in a headless run.
    """
    child.parent = parent
    return child


def join(name, objects):
    """Join meshes into one object so the runtime raycasts a single mesh per id."""
    target = objects[0]
    target.name = name
    target.data.name = name
    view_layer = bpy.context.view_layer
    view_layer.objects.active = target
    for obj in view_layer.objects:
        obj.select_set(False)
    for obj in objects:
        obj.select_set(True)

    # Building from Blender's Python Console can lack a VIEW_3D operator
    # context. Keep component meshes as separate objects in that case; glTF
    # exports them all and they remain visible as one logical model.
    try:
        bpy.context.view_layer.objects.active = target
        for obj in objects:
            obj.select_set(True)
        if bpy.ops.object.join.poll():
            bpy.ops.object.join()
    except RuntimeError:
        pass
    finally:
        for obj in objects:
            if obj.name in bpy.data.objects:
                obj.select_set(False)
    return target


def look_at(obj, target):
    """Point an empty's -Z at a world-space target, +Y up. Matches three.js camera convention."""
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return obj


def sphere(name, radius, segments=20, rings=12, location=(0, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=segments,
                                         ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name
    obj.scale = scale
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def capsule(name, radius, height, segments=20, location=(0, 0, 0)):
    """Rounded-top cylinder. The base body shape for the stylized toys."""
    body = cylinder(f"{name}_body", radius, height, segments=segments,
                    location=(location[0], location[1], location[2] + height / 2))
    cap = sphere(f"{name}_cap", radius, segments=segments, rings=10,
                 location=(location[0], location[1], location[2] + height))
    cap.scale = (1.0, 1.0, 0.82)
    base = sphere(f"{name}_base", radius, segments=segments, rings=10,
                  location=(location[0], location[1], location[2]))
    base.scale = (1.0, 1.0, 0.45)
    merged = join(name, [body, cap, base])
    smooth(merged)
    return merged


def cone(name, radius_bottom, radius_top, depth, segments=20,
         location=(0, 0, 0), rotation=(0, 0, 0)):
    """Truncated cone. Used for flared shapes a plain cylinder cannot express."""
    import math
    verts, faces = [], []
    half = depth / 2
    for i in range(segments):
        a = 2 * math.pi * i / segments
        ca, sa = math.cos(a), math.sin(a)
        verts.append((radius_bottom * ca, radius_bottom * sa, -half))
        verts.append((radius_top * ca, radius_top * sa, half))
    for i in range(segments):
        a, b = 2 * i, 2 * ((i + 1) % segments)
        faces.append((a, b, b + 1, a + 1))
    verts.append((0, 0, -half))
    verts.append((0, 0, half))
    bottom, top = len(verts) - 2, len(verts) - 1
    for i in range(segments):
        a, b = 2 * i, 2 * ((i + 1) % segments)
        faces.append((bottom, b, a))
        faces.append((top, a + 1, b + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    return link(obj)


def revolve(name, profile, segments=24, location=(0, 0, 0), rotation=(0, 0, 0)):
    """Lathe a 2D (radius, z) profile around the Z axis.

    Preferred over joining primitives for anything round: joined caps leave a
    shading seam at the junction, and a revolved surface has continuous normals
    all the way up. Profile points with radius 0 become poles.
    """
    import math
    verts, faces = [], []
    rings = []
    for radius, z in profile:
        if abs(radius) < 1e-9:
            verts.append((0.0, 0.0, z))
            rings.append(('pole', len(verts) - 1))
        else:
            start = len(verts)
            for i in range(segments):
                a = 2 * math.pi * i / segments
                verts.append((radius * math.cos(a), radius * math.sin(a), z))
            rings.append(('ring', start))

    for (kind_a, a), (kind_b, b) in zip(rings, rings[1:]):
        if kind_a == 'ring' and kind_b == 'ring':
            for i in range(segments):
                j = (i + 1) % segments
                faces.append((a + i, a + j, b + j, b + i))
        elif kind_a == 'pole' and kind_b == 'ring':
            for i in range(segments):
                j = (i + 1) % segments
                faces.append((a, b + j, b + i))
        elif kind_a == 'ring' and kind_b == 'pole':
            for i in range(segments):
                j = (i + 1) % segments
                faces.append((a + i, a + j, b))

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    link(obj)
    smooth(obj)
    return obj


def dome_profile(radius, height, steps=7, squash=1.0):
    """Quarter-arc from (radius, height) up to the pole, for capsule tops."""
    import math
    points = []
    for i in range(1, steps + 1):
        a = (math.pi / 2) * i / steps
        points.append((radius * math.cos(a), height + radius * squash * math.sin(a)))
    return points


def recalc_normals(obj):
    """Make faces point outward; lathed and swept meshes are built without caring."""
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj


def catmull_rom(points, samples=6):
    """Smooth path through control points (endpoints included)."""
    pts = [Vector(p) for p in points]
    if len(pts) < 3:
        return pts
    padded = [pts[0] * 2 - pts[1], *pts, pts[-1] * 2 - pts[-2]]
    out = []
    for i in range(1, len(padded) - 2):
        p0, p1, p2, p3 = padded[i - 1], padded[i], padded[i + 1], padded[i + 2]
        for s in range(samples):
            t = s / samples
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t
                              + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(pts[-1])
    return out


def tube(name, path, radius, segments=10, caps=True, location=(0, 0, 0),
         radius_scale=None, profile_scale=(1.0, 1.0)):
    """Sweep a circle along a polyline with parallel-transport frames.

    One continuous mesh, so bent rods (clock handle, feet, trunk, hair locks,
    cables) cannot come apart at joints. `radius_scale(t)` tapers along the path;
    `profile_scale` flattens the section into a strip.
    """
    import math
    pts = [Vector(p) for p in path]
    n = len(pts)
    tangents = []
    for i in range(n):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, n - 1)]
        tangents.append((b - a).normalized())
    ref = Vector((0, 0, 1)) if abs(tangents[0].z) < 0.9 else Vector((1, 0, 0))
    normal = tangents[0].cross(ref).normalized()
    verts, faces = [], []
    for i in range(n):
        if i > 0:
            axis = tangents[i - 1].cross(tangents[i])
            if axis.length > 1e-8:
                angle = tangents[i - 1].angle(tangents[i])
                from mathutils import Matrix
                normal = (Matrix.Rotation(angle, 3, axis.normalized()) @ normal).normalized()
        binormal = tangents[i].cross(normal).normalized()
        t = i / (n - 1) if n > 1 else 0.0
        r = radius * (radius_scale(t) if radius_scale else 1.0)
        for s in range(segments):
            a = 2 * math.pi * s / segments
            offset = normal * (math.cos(a) * r * profile_scale[0]) + binormal * (math.sin(a) * r * profile_scale[1])
            verts.append(tuple(pts[i] + offset))
    for i in range(n - 1):
        for s in range(segments):
            j = (s + 1) % segments
            faces.append((i * segments + s, i * segments + j,
                          (i + 1) * segments + j, (i + 1) * segments + s))
    if caps:
        verts.append(tuple(pts[0]))
        verts.append(tuple(pts[-1]))
        c0, c1 = len(verts) - 2, len(verts) - 1
        last = (n - 1) * segments
        for s in range(segments):
            j = (s + 1) % segments
            faces.append((c0, j, s))
            faces.append((c1, last + s, last + j))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    link(obj)
    recalc_normals(obj)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def prism(name, outline, depth, location=(0, 0, 0), rotation=(0, 0, 0)):
    """Extrude a convex-or-star-shaped 2D outline (local XY) along +Z from 0 to depth.

    The fan is centred on the outline's centroid, so star shapes and tapered
    hands triangulate correctly as long as the centroid can see every edge.
    """
    n = len(outline)
    cx = sum(p[0] for p in outline) / n
    cy = sum(p[1] for p in outline) / n
    verts = [(x, y, 0.0) for x, y in outline] + [(x, y, depth) for x, y in outline]
    verts += [(cx, cy, 0.0), (cx, cy, depth)]
    bottom, top = 2 * n, 2 * n + 1
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
        faces.append((bottom, j, i))
        faces.append((top, n + i, n + j))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    link(obj)
    return recalc_normals(obj)


def disc(name, radius, segments=48, location=(0, 0, 0), rotation=(0, 0, 0)):
    """Flat disc facing local +Z with planar UVs filling 0-1, for printed faces."""
    import math
    verts = [(0.0, 0.0, 0.0)]
    for i in range(segments):
        a = 2 * math.pi * i / segments
        verts.append((radius * math.cos(a), radius * math.sin(a), 0.0))
    faces = [(0, 1 + i, 1 + (i + 1) % segments) for i in range(segments)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    uv = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            co = verts[mesh.loops[li].vertex_index]
            uv.data[li].uv = (co[0] / (2 * radius) + 0.5, co[1] / (2 * radius) + 0.5)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    return link(obj)


def sheet(name, outline, thickness, plane='XZ', offset=0.0):
    """Flat plate from a (possibly concave) 2D outline, given real thickness.

    `plane='XZ'` places outline (a, b) at (a, offset, b) and thickens along +Y;
    `plane='YZ'` places it at (offset, a, b) and thickens along +X.
    """
    import bmesh
    bm = bmesh.new()
    if plane == 'XZ':
        verts = [bm.verts.new((a, offset, b)) for a, b in outline]
        direction = (0.0, thickness, 0.0)
    else:
        verts = [bm.verts.new((offset, a, b)) for a, b in outline]
        direction = (thickness, 0.0, 0.0)
    face = bm.faces.new(verts)
    extruded = bmesh.ops.extrude_face_region(bm, geom=[face])
    moved = [g for g in extruded['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=direction, verts=moved)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4],
                          quad_method='BEAUTY', ngon_method='EAR_CLIP')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    return link(obj)


def cut_hole(obj, cutter):
    """Boolean-difference `cutter` out of `obj`, bake the result, delete the cutter."""
    mod = obj.modifiers.new(name="hole", type='BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.solver = 'EXACT'
    mod.object = cutter
    depsgraph = bpy.context.evaluated_depsgraph_get()
    baked = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
    old = obj.data
    # The baked mesh already contains every modifier's result; drop them all
    # so bevels and normals are not applied a second time on export.
    for existing in list(obj.modifiers):
        obj.modifiers.remove(existing)
    obj.data = baked
    baked.name = obj.name
    bpy.data.meshes.remove(old)
    bpy.data.objects.remove(cutter)
    return obj


def ribbon(name, path_xz, widths, thickness, y_centre=0.0):
    """Bent strip in the XZ plane: width across Y, thickness along the path normal.

    Used for the elephant's head-and-trunk fold: one continuous piece of sheet
    whose width tapers along its length.
    """
    import math
    pts = [Vector((p[0], p[1])) for p in path_xz]
    n = len(pts)
    verts, faces = [], []
    for i in range(n):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, n - 1)]
        t = (b - a).normalized()
        normal = Vector((-t.y, t.x)) * (thickness / 2)
        w = widths[i] / 2
        for side in (-1, 1):
            for yy in (-w, w):
                p = pts[i] + normal * side
                verts.append((p.x, y_centre + yy, p.y))
    for i in range(n - 1):
        a, b = 4 * i, 4 * (i + 1)
        # verts per section: 0 (-n,-w) 1 (-n,+w) 2 (+n,-w) 3 (+n,+w)
        faces += [(a + 0, a + 1, b + 1, b + 0), (a + 2, b + 2, b + 3, a + 3),
                  (a + 0, b + 0, b + 2, a + 2), (a + 1, a + 3, b + 3, b + 1)]
    last = 4 * (n - 1)
    faces += [(0, 2, 3, 1), (last, last + 1, last + 3, last + 2)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    return recalc_normals(obj)


def lathe(name, profile, a0=0.0, a1=None, segments=48, close_profile=False,
          location=(0, 0, 0)):
    """Revolve a (radius, z) profile over an angular range, optionally partial.

    `revolve` only makes full, pole-capped solids; this also makes open arcs
    (a coat collar with a gap at the front) and closed bands (a headband).
    A closed profile revolved over a partial range gets flat end caps, so a
    `thick_profile` arc has visible edge thickness where it stops.
    """
    import math
    full = a1 is None
    if full:
        a1 = a0 + 2 * math.pi
    cols = segments if full else segments + 1
    pts = list(profile) + ([profile[0]] if close_profile else [])
    verts, faces = [], []
    for r, z in pts:
        for i in range(cols):
            a = a0 + (a1 - a0) * i / segments
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for j in range(len(pts) - 1):
        for i in range(segments):
            i2 = (i + 1) % cols if full else i + 1
            faces.append((j * cols + i, j * cols + i2, (j + 1) * cols + i2, (j + 1) * cols + i))
    if close_profile and not full:
        loop = len(pts) - 1  # the repeated first point is not part of the cap
        faces.append(tuple(j * cols for j in range(loop)))
        faces.append(tuple(j * cols + segments for j in reversed(range(loop))))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    link(obj)
    return recalc_normals(obj)


def thick_profile(profile, thickness):
    """Open (radius, z) profile -> closed outline `thickness` deep on its inner side.

    The offset follows each point's 2D normal, so rolled shapes such as a
    collar keep an even wall instead of thinning where the profile turns flat.
    Pass the result to lathe(..., close_profile=True).
    """
    import math
    n = len(profile)
    inner = []
    for i, (r, z) in enumerate(profile):
        (ra, za), (rb, zb) = profile[max(i - 1, 0)], profile[min(i + 1, n - 1)]
        dr, dz = rb - ra, zb - za
        length = math.hypot(dr, dz) or 1.0
        # Normal pointing to the inside of the outline (left of the path direction).
        inner.append((r - dz / length * thickness, z + dr / length * thickness))
    return list(profile) + list(reversed(inner))


def rounded_rect(half_w, half_h, radius, steps=6):
    """Convex rounded-rectangle outline, counter-clockwise, for prism()/sheet()."""
    import math
    pts = []
    for cx, cy, a0 in ((half_w - radius, half_h - radius, 0), (-(half_w - radius), half_h - radius, 90),
                       (-(half_w - radius), -(half_h - radius), 180), (half_w - radius, -(half_h - radius), 270)):
        for k in range(steps + 1):
            a = math.radians(a0 + 90 * k / steps)
            pts.append((cx + radius * math.cos(a), cy + radius * math.sin(a)))
    return pts


def thicken_polyline(points, thickness):
    """Closed outline of a bent strip whose centreline is `points` (2D)."""
    pts = [Vector(p) for p in points]
    n = len(pts)
    left, right = [], []
    for i in range(n):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, n - 1)]
        t = (b - a).normalized()
        normal = Vector((-t.y, t.x))
        if 0 < i < n - 1:
            t1 = (pts[i] - pts[i - 1]).normalized()
            t2 = (pts[i + 1] - pts[i]).normalized()
            n1, n2 = Vector((-t1.y, t1.x)), Vector((-t2.y, t2.x))
            miter = (n1 + n2).normalized()
            normal = miter / max(miter.dot(n1), 0.3)
        left.append(tuple(pts[i] + normal * thickness / 2))
        right.append(tuple(pts[i] - normal * thickness / 2))
    return left + right[::-1]
