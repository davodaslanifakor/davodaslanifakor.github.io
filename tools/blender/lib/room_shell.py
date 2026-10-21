"""Two-wall room extension; the desk wall remains authored in desk.py."""

from . import materials as M
from .util import box


def build_right_wall():
    wall = box("static_wall_right", (0.060, 1.570, 2.250),
               location=(1.620, -0.365, 1.125))
    M.assign(wall, M.pbr("wall_right", (0.300, 0.345, 0.275), roughness=0.96))

    back_skirt = box("static_skirting_back", (3.220, 0.018, 0.065),
                     location=(-0.030, 0.410, 0.0325))
    side_skirt = box("static_skirting_right", (0.018, 1.520, 0.065),
                     location=(1.585, -0.365, 0.0325))
    trim = M.pbr("room_skirting", (0.20, 0.22, 0.18), roughness=0.68)
    M.assign(back_skirt, trim)
    M.assign(side_skirt, trim)
    return [wall, back_skirt, side_skirt]
