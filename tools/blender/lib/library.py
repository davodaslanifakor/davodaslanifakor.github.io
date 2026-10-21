"""Right-wall oak-and-charcoal bookcase, assembled in its own local frame."""

from . import materials as M
from .util import box, empty, bevel, parent_to


def build_library():
    root = empty("root_library", (1.430, -0.470, 0.0))
    black = M.pbr("library_graphite", (0.075, 0.085, 0.073), roughness=0.48, metallic=0.65)
    oak = M.pbr("library_oak", (0.38, 0.28, 0.16), roughness=0.62)
    dark_oak = M.pbr("library_oak_shadow", (0.24, 0.19, 0.12), roughness=0.72)
    parts = []

    def part(obj, material, bevel_width=0.0):
        M.assign(obj, material)
        if bevel_width:
            bevel(obj, bevel_width, 2)
        parent_to(obj, root)
        parts.append(obj)
        return obj

    depth, width = 0.300, 1.020
    # Front is toward -X/open room. Uprights and rear cross braces give each
    # shelf real thickness and keep all displayed objects supported.
    for x in (-0.140, 0.140):
        for y in (-0.500, 0.500):
            part(box(f"static_library_upright_{x}_{y}", (0.022, 0.022, 1.840),
                     (x, y, 0.920)), black, 0.003)
    for z, name in ((0.045, "base"), (0.445, "lower"), (0.980, "bike"),
                    (1.310, "car"), (1.620, "upper"), (1.825, "top")):
        part(box(f"static_library_shelf_{name}", (depth, width, 0.024),
                 (0.0, 0.0, z)), oak, 0.003)
        # A dark fascia gives the shelf a visible, solid front edge.
        part(box(f"static_library_fascia_{name}", (0.012, width, 0.034),
                 (-depth / 2 - 0.004, 0.0, z)), dark_oak, 0.002)
    for y in (-0.486, 0.486):
        part(box(f"static_library_backrail_{y}", (0.014, 0.018, 1.72),
                 (0.130, y, 0.910)), black)

    # Lower compartments; drawer fronts sit flush behind the shelf fascia.
    for y in (-0.245, 0.245):
        part(box(f"static_library_cabinet_{y}", (0.225, 0.440, 0.295),
                 (0.005, y, 0.215)), dark_oak, 0.004)
        part(box(f"static_library_door_{y}", (0.012, 0.424, 0.270),
                 (-0.114, y, 0.215)), oak, 0.003)
        part(box(f"static_library_pull_{y}", (0.008, 0.038, 0.006),
                 (-0.124, y, 0.220)), black, 0.002)

    # Restrained unlettered spines, in three gentle color families.
    spine_mats = [
        M.pbr("book_spine_cream", (0.69, 0.63, 0.50), roughness=0.86),
        M.pbr("book_spine_olive", (0.25, 0.31, 0.22), roughness=0.82),
        M.pbr("book_spine_ochre", (0.48, 0.32, 0.15), roughness=0.80),
        M.pbr("book_spine_stone", (0.48, 0.47, 0.39), roughness=0.85),
    ]
    heights = [0.105, 0.132, 0.118, 0.145, 0.112, 0.136, 0.126, 0.108,
               0.140, 0.116, 0.132, 0.104, 0.128, 0.145]
    y = -0.445
    for i, h in enumerate(heights):
        w = 0.031 + (i % 3) * 0.004
        if y + w > 0.05:
            break
        obj = box(f"static_library_book_{i:02d}", (0.105, w, h),
                  (-0.065, y + w / 2, 1.632 + h / 2))
        obj.rotation_euler[0] = (0.025 if i % 2 else -0.018)
        part(obj, spine_mats[i % len(spine_mats)], 0.0012)
        y += w + 0.006

    # A small original line drawing in a plain graphite frame.
    frame = part(box("static_library_art_frame", (0.012, 0.205, 0.140),
                      (-0.112, 0.285, 1.715)), black, 0.002)
    paper = part(box("static_library_art_paper", (0.003, 0.184, 0.119),
                      (-0.104, 0.285, 1.715)),
                 M.pbr("library_art_paper", (0.76, 0.72, 0.60), roughness=0.9))
    from .util import tube
    line = tube("static_library_art_line", [(-0.100, 0.225, 1.704), (-0.100, 0.265, 1.739),
                                              (-0.100, 0.315, 1.696), (-0.100, 0.354, 1.729)],
                0.0018, segments=6)
    part(line, black)
    return root
