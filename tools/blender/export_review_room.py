"""Export the approved visible checkpoint in background Blender; never save a blend.

Run `pnpm export:room`. All conversion, UV generation and font batching happen
in an isolated in-memory export scene. Stage and validate before replacing GLB.
"""
import hashlib
import json
import math
import struct
from collections import defaultdict
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT = ROOT / 'tools/blender/review/reference-restyle/room-light-dark.blend'
OUTPUT = ROOT / 'public/models/room.glb'
GLB_LIMIT = 3_000_000
IMAGE_LIMIT = 4_000_000
SCREEN_TEXT = ('static_style_display_', 'static_style_screen_name',
               'static_style_screen_stack', 'static_style_screen_skill')


def forbidden(name):
    return any(word in name.lower() for word in ('archive', 'original layout', 'original_', 'plush'))


def allowed_collections(collection, blocked=False):
    blocked = blocked or collection.hide_render or collection.hide_viewport or forbidden(collection.name)
    result = set() if blocked else {o for o in collection.objects}
    for child in collection.children:
        result.update(allowed_collections(child, blocked))
    return result


def yup(v):
    return [round(v.x, 7), round(v.z, 7), round(-v.y, 7)]


def corners(obj):
    return [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]


def camera_data(scene, objects):
    bounds = [p for o in objects if o.type in {'MESH', 'CURVE', 'FONT'} for p in corners(o)]
    lower = Vector(tuple(min(p[i] for p in bounds) for i in range(3)))
    upper = Vector(tuple(max(p[i] for p in bounds) for i in range(3)))
    center = (lower + upper) / 2
    points = []
    for empty in sorted((o for o in scene.objects if o.type == 'EMPTY' and o.name.startswith('cam_')), key=lambda o: o.name):
        source = scene.camera if empty.name == 'cam_start' else empty
        eye = source.matrix_world.translation
        direction = source.matrix_world.to_quaternion() @ Vector((0, 0, -1))
        object_id = empty.name[4:]
        root = next((o for o in objects if o.name in (f'root_{object_id}', f'int_{object_id}')), None)
        target_empty = scene.objects.get(f'target_{object_id}')
        if target_empty:
            target = target_empty.matrix_world.translation
        else:
            aim = root.matrix_world.translation if root else center
            distance = max(0.1, (aim - eye).dot(direction))
            target = eye + direction * distance
        points.append(dict(name=empty.name, position=yup(eye), target=yup(target)))
    assert any(p['name'] == 'cam_start' for p in points)
    # Bounds are expressed in website Y-up coordinates.
    converted = [yup(p) for p in bounds]
    return points, [[min(p[i] for p in converted) for i in range(3)],
                    [max(p[i] for p in converted) for i in range(3)]]


def validate_screen(screen):
    assert len(screen.data.vertices) == 4, 'Laptop must stay a separate flat quad'
    assert all(abs(v.co.z) < 1e-6 for v in screen.data.vertices)
    assert all(p.normal.z > 0.99 for p in screen.data.polygons)
    uv = screen.data.uv_layers.active
    assert uv and {tuple(round(v, 5) for v in p.uv) for p in uv.data} == {(0, 0), (0, 1), (1, 0), (1, 1)}
    assert screen.parent is not None


def inspect_glb(path):
    data = path.read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20 + size])
    embedded = sum(doc['bufferViews'][im['bufferView']]['byteLength'] for im in doc.get('images', []) if 'bufferView' in im)
    external = sum(p.stat().st_size for p in (ROOT / 'public/textures').rglob('*') if p.is_file()) if (ROOT / 'public/textures').exists() else 0
    assert not any('uri' in im for im in doc.get('images', [])), 'GLB images must be embedded'
    return doc, len(data), embedded, external


def main():
    assert Path(bpy.data.filepath).resolve() == CHECKPOINT.resolve(), 'Open the approved checkpoint explicitly'
    checksum = hashlib.sha256(CHECKPOINT.read_bytes()).hexdigest()
    source = bpy.data.scenes['Room Light']
    bpy.context.window.scene = source
    layer = source.view_layers[0]
    allowed = allowed_collections(source.collection)
    selected = {o for o in source.objects if o in allowed and o.visible_get(view_layer=layer)
                and not o.hide_render and not o.hide_viewport and not o.hide_get(view_layer=layer)
                and not forbidden(o.name) and not o.name.startswith(SCREEN_TEXT)
                and o.type in {'MESH', 'FONT', 'CURVE', 'EMPTY'}}
    # Camera identities may be hidden viewport helpers, never archived geometry.
    selected.update(o for o in source.objects if o.type == 'EMPTY' and o.name.startswith('cam_'))
    for obj in list(selected):
        parent = obj.parent
        while parent:
            assert parent.type == 'EMPTY' and parent in allowed and not parent.hide_render and not forbidden(parent.name), f'Hidden parent: {parent.name}'
            selected.add(parent)
            parent = parent.parent
    assert not any(o.name == 'root_plush' for o in selected)
    validate_screen(source.objects['int_monitor_screen'])
    assert source.objects['static_laptop_keycaps'].get('key_count') == 78
    points, bounds = camera_data(source, selected)
    inventory = sorted(o.name for o in selected)
    omitted = sorted(o.name for o in source.objects if o not in selected)

    export_scene = bpy.data.scenes.new('Website Export')
    copies = {}
    for original in sorted(selected, key=lambda o: o.name):
        name = original.name
        copy = original.copy()
        if original.data:
            copy.data = original.data.copy()
        # Exact contract names, even while originals still exist in memory.
        original.name = '__source__' + name
        copy.name = name
        export_scene.collection.objects.link(copy)
        copies[original] = copy
    for original, copy in copies.items():
        copy.parent = copies.get(original.parent)
        copy.matrix_world = original.matrix_world.copy()
        copy.hide_render = copy.hide_viewport = copy.hide_select = False
    bpy.context.window.scene = export_scene
    bpy.context.view_layer.update()
    fonts = defaultdict(list)
    for copy in copies.values():
        if copy.type == 'FONT':
            copy.data.resolution_u = 2
            fonts[copy.parent].append(copy)
        if copy.type == 'MESH' and copy.name.startswith('static_style_rug'):
            uv = copy.data.uv_layers.new(name='UVMap') if not copy.data.uv_layers else copy.data.uv_layers.active
            for loop in copy.data.loops:
                co = copy.data.vertices[loop.vertex_index].co
                uv.data[loop.index].uv = (co.x / 2.55 + 0.5, co.y / 0.90 + 0.5)
        # Avoid exporting preview image pixels that runtime canvases replace.
        if copy.name in ('int_screen_left', 'int_screen_right', 'int_monitor_screen'):
            mat = bpy.data.materials.new(copy.name + '_runtime')
            mat.diffuse_color = (0.025, 0.035, 0.045, 1)
            copy.data.materials.clear()
            copy.data.materials.append(mat)
    # Preserve physical legends with one draw group per parent/material, rather
    # than thousands of independent glyph objects. Never merge interaction meshes.
    for index, (parent, group) in enumerate(fonts.items()):
        bpy.ops.object.select_all(action='DESELECT')
        for obj in group:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = group[0]
        bpy.ops.object.convert(target='MESH')
        bpy.ops.object.join()
        bpy.context.object.name = f'static_lettering_batch_{index}'
    bpy.ops.object.select_all(action='SELECT')
    stage = OUTPUT.with_name('room.staging.glb')
    try:
        args = dict(filepath=str(stage), export_format='GLB', use_active_scene=True,
                    use_selection=True, export_apply=True, export_cameras=False,
                    export_lights=False, export_yup=True, export_extras=True)
        bpy.ops.export_scene.gltf(**args)
        doc, size, embedded, external = inspect_glb(stage)
        compressed = size > GLB_LIMIT
        if compressed:
            bpy.ops.export_scene.gltf(**args, export_draco_mesh_compression_enable=True,
                export_draco_mesh_compression_level=6, export_draco_position_quantization=16,
                export_draco_texcoord_quantization=14, export_draco_normal_quantization=10)
            doc, size, embedded, external = inspect_glb(stage)
        assert size <= GLB_LIMIT, f'GLB {size} exceeds {GLB_LIMIT}; do not ship'
        assert embedded + external <= IMAGE_LIMIT, f'Images {embedded + external} exceed {IMAGE_LIMIT}'
        names = {n.get('name') for n in doc['nodes']}
        for required in ('int_monitor_screen', 'int_screen_left', 'int_screen_right', 'static_laptop_keycaps', 'static_style_rug'):
            assert required in names, f'Missing {required}'
        assert any(name.startswith('static_mac_speaker_grilles') for name in names)
        assert not doc.get('cameras') and len(doc['scenes']) == 1
        assert hashlib.sha256(CHECKPOINT.read_bytes()).hexdigest() == checksum
        report = dict(checkpoint=str(CHECKPOINT.relative_to(ROOT)), checkpointSha256=checksum,
                      scene='Room Light', bytes=size, embeddedImageBytes=embedded,
                      externalImageBytes=external, compressed=compressed, keycaps=78,
                      sourceObjects=inventory, omittedObjects=omitted, cameraFocus=points,
                      bounds=bounds, exportedNodes=len(doc['nodes']), exportedMeshes=len(doc.get('meshes', [])))
        lines = ["// Generated by tools/blender/export_review_room.py from the approved checkpoint.",
                 "import { Vector3 } from 'three'", "import type { CameraFocusPoint } from '~/composables/useCameraRig'", '',
                 'export const ROOM_BOUNDS = ' + json.dumps(bounds) + ' as const', '',
                 'export const CAMERA_FOCUS_POINTS: readonly CameraFocusPoint[] = [']
        for p in points:
            pos = ', '.join(map(str, p['position']))
            target = ', '.join(map(str, p['target']))
            lines.append(f"  {{ name: '{p['name']}', position: new Vector3({pos}), target: new Vector3({target}) }},")
        lines.extend([']', ''])
        stage.replace(OUTPUT)
        (ROOT / 'composables/generated/cameraFocus.ts').write_text('\n'.join(lines))
        (ROOT / 'tools/blender/review/website-export.json').write_text(json.dumps(report, indent=2) + '\n')
        print('WEBSITE_EXPORT', json.dumps({k: report[k] for k in ('bytes', 'embeddedImageBytes', 'externalImageBytes', 'compressed', 'exportedMeshes')}))
    finally:
        stage.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
