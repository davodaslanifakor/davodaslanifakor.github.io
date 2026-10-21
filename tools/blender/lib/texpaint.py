"""Tiny deterministic 2D painter for printed artwork (dial numerals, toy prints).

Printed details are authored here from code, never cropped from the reference
photographs, so every texture is reproducible from checked-in source. Shapes are
rasterised with numpy on a supersampled grid and box-filtered down for
antialiasing. Text uses Blender's built-in vector font (Inter, SIL Open Font
License): glyph outlines are triangulated by Blender and filled here.

Canvas coordinates are UV-like: (0, 0) bottom-left, (1, 1) top-right.
"""

import math
import bpy
import numpy as np


class Canvas:
    def __init__(self, width, height=None, background=(1.0, 1.0, 1.0), supersample=4):
        self.w = width
        self.h = height or width
        self.ss = supersample
        self.W = self.w * supersample
        self.H = self.h * supersample
        self.rgb = np.empty((self.H, self.W, 3), dtype=np.float32)
        self.rgb[:, :] = background

    # --- coverage helpers -----------------------------------------------------

    def _bbox(self, xs, ys):
        x0 = max(int(math.floor(min(xs) * self.W)) - 1, 0)
        x1 = min(int(math.ceil(max(xs) * self.W)) + 1, self.W)
        y0 = max(int(math.floor(min(ys) * self.H)) - 1, 0)
        y1 = min(int(math.ceil(max(ys) * self.H)) + 1, self.H)
        if x1 <= x0 or y1 <= y0:
            return None
        px = (np.arange(x0, x1, dtype=np.float32) + 0.5) / self.W
        py = (np.arange(y0, y1, dtype=np.float32) + 0.5) / self.H
        gx, gy = np.meshgrid(px, py)
        return (x0, x1, y0, y1), gx, gy

    def _paint(self, box, mask, color):
        x0, x1, y0, y1 = box
        region = self.rgb[y0:y1, x0:x1]
        region[mask] = color

    # --- primitives -----------------------------------------------------------

    def polygon(self, points, color):
        """Even-odd fill, so concave outlines and holes both work."""
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        hit = self._bbox(xs, ys)
        if hit is None:
            return
        box, gx, gy = hit
        inside = np.zeros(gx.shape, dtype=bool)
        n = len(points)
        for i in range(n):
            ax, ay = points[i]
            bx, by = points[(i + 1) % n]
            if ay == by:
                continue
            crosses = (ay > gy) != (by > gy)
            xint = ax + (gy - ay) * (bx - ax) / (by - ay)
            inside ^= crosses & (gx < xint)
        self._paint(box, inside, color)

    def triangles(self, tris, color):
        for a, b, c in tris:
            hit = self._bbox((a[0], b[0], c[0]), (a[1], b[1], c[1]))
            if hit is None:
                continue
            box, gx, gy = hit
            d1 = (gx - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (gy - b[1])
            d2 = (gx - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (gy - c[1])
            d3 = (gx - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (gy - a[1])
            neg = (d1 < 0) | (d2 < 0) | (d3 < 0)
            pos = (d1 > 0) | (d2 > 0) | (d3 > 0)
            self._paint(box, ~(neg & pos), color)

    def ellipse(self, center, radii, color, rotation=0.0):
        cx, cy = center
        rx, ry = radii
        r = max(rx, ry)
        hit = self._bbox((cx - r, cx + r), (cy - r, cy + r))
        if hit is None:
            return
        box, gx, gy = hit
        c, s = math.cos(-rotation), math.sin(-rotation)
        dx, dy = gx - cx, gy - cy
        lx, ly = dx * c - dy * s, dx * s + dy * c
        self._paint(box, (lx / rx) ** 2 + (ly / ry) ** 2 <= 1.0, color)

    def rect(self, x0, y0, x1, y1, color):
        self.polygon([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], color)

    def line(self, a, b, width, color):
        """Thick segment with square ends."""
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / length * width / 2, dx / length * width / 2
        self.polygon([(a[0] + nx, a[1] + ny), (b[0] + nx, b[1] + ny),
                      (b[0] - nx, b[1] - ny), (a[0] - nx, a[1] - ny)], color)

    def polyline(self, points, width, color, round_joints=True):
        for a, b in zip(points, points[1:]):
            self.line(a, b, width, color)
            if round_joints:
                self.ellipse(b, (width / 2, width / 2), color)
        if round_joints and points:
            self.ellipse(points[0], (width / 2, width / 2), color)

    def text(self, string, center, height, color, rotation=0.0, stretch=1.0, bold=0.0):
        """Draw text centred at `center`; `height` is the cap height in canvas units."""
        tris, (minx, miny, maxx, maxy) = _glyph_triangles(string)
        cap = maxy - miny or 1.0
        scale = height / cap
        mx, my = (minx + maxx) / 2, (miny + maxy) / 2
        c, s = math.cos(rotation), math.sin(rotation)

        def xf(p):
            # Rotate in pixel space so non-square canvases do not shear glyphs.
            x = (p[0] - mx) * scale * stretch * self.h
            y = (p[1] - my) * scale * self.h
            return (center[0] + (x * c - y * s) / self.w, center[1] + (x * s + y * c) / self.h)

        out = [(xf(a), xf(b), xf(cc)) for a, b, cc in tris]
        self.triangles(out, color)
        if bold > 0:
            # Heavy dilation needs denser rings or the outline turns scalloped.
            rings, count = ((0.5, 1.0), 12) if bold <= 0.02 else ((0.34, 0.67, 1.0), 24)
            steps = [(math.cos(a) * bold * r, math.sin(a) * bold * r * self.w / self.h)
                     for r in rings for a in [2 * math.pi * i / count for i in range(count)]]
            for ox, oy in steps:
                self.triangles([tuple((p[0] + ox, p[1] + oy) for p in t) for t in out], color)

    # --- output ---------------------------------------------------------------

    def to_image(self, name):
        """Box-filter down and return a packed Blender image the glTF exporter embeds."""
        small = self.rgb.reshape(self.h, self.ss, self.w, self.ss, 3).mean(axis=(1, 3))
        # Painted colours are authored in sRGB; the image is tagged sRGB as well.
        rgba = np.ones((self.h, self.w, 4), dtype=np.float32)
        rgba[:, :, :3] = small
        image = bpy.data.images.new(name, self.w, self.h, alpha=False)
        image.colorspace_settings.name = 'sRGB'
        image.pixels.foreach_set(rgba.ravel())
        image.file_format = 'PNG'
        image.pack()
        return image


_glyph_cache = {}


def _glyph_triangles(string):
    """Triangulated outline of `string` in the built-in font, in font units."""
    if string in _glyph_cache:
        return _glyph_cache[string]
    curve = bpy.data.curves.new(f"_glyph_{string}", type='FONT')
    curve.body = string
    curve.fill_mode = 'BOTH'
    curve.resolution_u = 6
    obj = bpy.data.objects.new(curve.name, curve)
    bpy.context.scene.collection.objects.link(obj)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    verts = [(v.co.x, v.co.y) for v in mesh.vertices]
    tris = [tuple(verts[i] for i in tri.vertices) for tri in mesh.loop_triangles]
    xs = [v[0] for v in verts] or [0.0]
    ys = [v[1] for v in verts] or [0.0]
    bounds = (min(xs), min(ys), max(xs), max(ys))
    evaluated.to_mesh_clear()
    bpy.data.objects.remove(obj)
    bpy.data.curves.remove(curve)
    _glyph_cache[string] = (tris, bounds)
    return _glyph_cache[string]


def srgb(r, g, b):
    """Hex-ish 0-255 sRGB triple to the 0-1 floats painted into the canvas."""
    return (r / 255.0, g / 255.0, b / 255.0)


def textured(name, image, roughness=0.5, metallic=0.0):
    """Principled material driven by an image texture on the default UV map."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes["Principled BSDF"]
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.interpolation = 'Linear'
    mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat
