"""Material library, sampled from docs/reference/.

Kept to Principled BSDF only: that is what the glTF exporter understands without
a custom node walk, so what renders in Blender is what ships in the GLB.
"""

import bpy

# Sampled off desk-wide-lit.jpg / desk-wide-dark.jpg and the close-ups.
PALETTE = {
    'desk':          (0.055, 0.057, 0.060),
    'mat':           (0.042, 0.044, 0.047),
    'bezel':         (0.035, 0.036, 0.038),
    'screen_green':  (0.070, 0.840, 0.130),
    'laptop_body':   (0.145, 0.150, 0.158),
    'laptop_amber':  (0.920, 0.640, 0.055),
    'speaker':       (0.040, 0.041, 0.043),
    'speaker_trim':  (0.480, 0.045, 0.055),
    'steel':         (0.620, 0.630, 0.640),
    'chrome':        (0.780, 0.790, 0.800),
    'clock_yellow':  (0.950, 0.780, 0.020),
    'clock_face':    (0.930, 0.930, 0.920),
    'plush_cream':   (0.845, 0.815, 0.755),
    'plush_grey':    (0.470, 0.495, 0.515),
    'plush_pink':    (0.880, 0.560, 0.690),
    'toy_yellow':    (0.930, 0.720, 0.080),
    'toy_denim':     (0.150, 0.290, 0.520),
    'toy_grass':     (0.230, 0.520, 0.200),
    'toy_coat':      (0.700, 0.660, 0.440),
    'toy_purple':    (0.300, 0.150, 0.520),
    'toy_green':     (0.110, 0.560, 0.240),
    'toy_skin':      (0.930, 0.920, 0.900),
    'base_black':    (0.030, 0.030, 0.032),
    'wall':          (0.760, 0.720, 0.650),
    'shelf':         (0.180, 0.160, 0.145),
    'phone_blue':    (0.090, 0.300, 0.720),
    'phone_glass':   (0.045, 0.048, 0.052),
    'mouse_white':   (0.900, 0.900, 0.895),
}

_cache = {}


def pbr(name, color, roughness=0.6, metallic=0.0, emission=None, emission_strength=0.0):
    key = (name, color, roughness, metallic, emission, emission_strength)
    if key in _cache:
        return _cache[key]

    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    _cache[key] = mat
    return mat


def assign(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    return obj


# --- named materials used across modules ------------------------------------

def desk():        return pbr("desk", PALETTE['desk'], roughness=0.55)
def mat_surface(): return pbr("deskmat", PALETTE['mat'], roughness=0.92)
def bezel():       return pbr("bezel", PALETTE['bezel'], roughness=0.45)
def laptop_body(): return pbr("laptop_body", PALETTE['laptop_body'], roughness=0.38, metallic=0.65)
def speaker():     return pbr("speaker", PALETTE['speaker'], roughness=0.60)
def speaker_trim():return pbr("speaker_trim", PALETTE['speaker_trim'], roughness=0.40)
def steel():       return pbr("steel", PALETTE['steel'], roughness=0.42, metallic=0.85)
def chrome():      return pbr("chrome", PALETTE['chrome'], roughness=0.12, metallic=1.0)
def wall():        return pbr("wall", PALETTE['wall'], roughness=0.95)
def shelf():       return pbr("shelf", PALETTE['shelf'], roughness=0.80)


def screen_green():
    """The monitors read as light sources in both reference shots, not lit surfaces."""
    return pbr("screen_green", PALETTE['screen_green'], roughness=0.25,
               emission=PALETTE['screen_green'], emission_strength=1.15)


def screen_amber():
    return pbr("screen_amber", PALETTE['laptop_amber'], roughness=0.25,
               emission=PALETTE['laptop_amber'], emission_strength=1.05)


def srgb(r, g, b):
    """0-255 sRGB, as sampled from a photo, to the linear floats Principled expects."""
    def lin(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b))
