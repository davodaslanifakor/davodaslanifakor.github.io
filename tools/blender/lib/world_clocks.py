"""Reusable station clocks with named, independently driven hand pivots."""

import math
import json
from pathlib import Path
from . import materials as M
from .util import box, cylinder, empty, parent_to

CONTENT = Path(__file__).resolve().parents[1] / "generated" / "room-content.json"


def clock_cities():
    """Use the same ordered city data that drives the website clocks."""
    with CONTENT.open(encoding="utf-8") as source:
        cities = json.load(source)["cities"]
    if len(cities) != 4:
        raise ValueError("The wall clock layout requires exactly four cities")
    return [(city["id"], city["label"].upper(), x)
            for city, x in zip(cities, (-0.615, -0.205, 0.205, 0.615))]


def build_world_clocks():
    case_mat = M.pbr("world_clock_case", (0.055, 0.064, 0.058), roughness=0.34, metallic=0.72)
    dial_mat = M.pbr("world_clock_dial", (0.83, 0.79, 0.69), roughness=0.83)
    ink = M.pbr("world_clock_ink", (0.065, 0.075, 0.067), roughness=0.55)
    second_ink = M.pbr("world_clock_second", (0.46, 0.15, 0.11), roughness=0.45)
    plaque_mat = M.pbr("world_clock_plaque", (0.15, 0.18, 0.15), roughness=0.64)
    for i, (city, label, x) in enumerate(clock_cities()):
        root = empty(f"root_world_clock_{city}", (x, 0, 1.655))
        # Clock plane is XZ, on the back wall, facing into the room (-Y).
        case = cylinder("int_world_clocks" if i == 0 else f"int_world_clocks__{i+1}",
                        0.119, 0.024, segments=48, location=(0, 0.385, 0),
                        rotation=(math.pi / 2, 0, 0))
        M.assign(case, case_mat)
        dial = cylinder(f"static_world_clock_{city}_dial", 0.108, 0.002, segments=48,
                        location=(0, 0.3715, 0), rotation=(math.pi / 2, 0, 0))
        M.assign(dial, dial_mat)
        parent_to(case, root)
        parent_to(dial, root)

        # Twelve prominent minute/hour indices; shared construction, low draw count.
        for tick in range(12):
            a = tick * math.tau / 12
            length = 0.012 if tick % 3 == 0 else 0.007
            marker = box(f"static_world_clock_{city}_index_{tick:02d}",
                         (0.0025 if tick % 3 == 0 else 0.0014, 0.0012, length),
                         location=(math.sin(a) * 0.091, 0.3698,
                                   math.cos(a) * 0.091))
            M.assign(marker, ink)
            parent_to(marker, root)

        hub = cylinder(f"static_world_clock_{city}_hub", 0.0042, 0.002,
                       segments=12, location=(0, 0.3693, 0), rotation=(math.pi / 2, 0, 0))
        M.assign(hub, ink)
        parent_to(hub, root)

        for hand, length, width, material in (
            ("hour", 0.045, 0.0045, ink),
            ("minute", 0.071, 0.0030, ink),
            ("second", 0.083, 0.0012, second_ink),
        ):
            pivot = empty(f"static_world_clock_{city}_{hand}_pivot", (0, 0.3693, 0))
            # The glTF export maps the rod to pivot-local -Z and the dial
            # normal to pivot-local +Y. Runtime hand motion uses local Y.
            pivot.rotation_euler = (math.pi / 2, 0, 0)
            rod = box(f"static_world_clock_{city}_{hand}", (width, length, 0.0013),
                      location=(0, length / 2, 0))
            M.assign(rod, material)
            parent_to(rod, pivot)
            parent_to(pivot, root)

        plaque = box(f"static_world_clock_{city}_plaque", (0.166, 0.012, 0.030),
                     location=(0, 0.392, -0.163))
        M.assign(plaque, plaque_mat)
        parent_to(plaque, root)
        # English Latin labels are physical artwork; localized names are spoken
        # in the accessible modal and remain data in content/portfolio.ts.
        from . import texpaint as TP
        label_canvas = TP.Canvas(256, 64, background=(0.15, 0.18, 0.15))
        label_canvas.text(label, (0.5, 0.5), 0.25, (0.86, 0.84, 0.75))
        from . import materials as Materials
        from .util import plane
        nameplate = plane(f"static_world_clock_{city}_nameplate", (0.150, 0.020),
                          location=(0, 0.385, -0.163), rotation=(math.pi / 2, 0, 0))
        Materials.assign(nameplate, TP.textured(f"clock_label_{city}", label_canvas.to_image(f"clock_label_{city}")))
        parent_to(nameplate, root)
    return True
