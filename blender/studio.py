"""Apple-style studio for product shots and turntables. Blender runs as a Python module: pip install bpy (setup/bootstrap.sh).
Use from your own script:
    import sys; sys.path.insert(0, '<toolkit>/blender'); import studio
    studio.reset()
    obj = studio.rounded_box(size=(0.07, 0.15, 0.008), radius=0.01)        # metres
    studio.material(obj, 'aluminium')                                     # aluminium | glass | plastic_matte | plastic_gloss | rubber | emissive
    studio.setup(theme='light', lens=100)                                 # light | dark ; backdrop + softbox key + fill + rim strips
    studio.frame(obj, angle=(62, 0, 28))                                  # camera framing so the object fills ~55%
    studio.render('out.png', res=(1600, 1200), samples=128)               # preview: samples=16, res=(640,480)
    studio.turntable('turn', frames=180)                                   # PNG sequence -> encode with video/export.sh
"""
import bpy, math, mathutils, os

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene; s.render.engine = 'CYCLES'; s.cycles.device = 'CPU'
    s.view_settings.view_transform = 'AgX'; s.view_settings.look = 'AgX - Medium High Contrast'
    s.cycles.use_denoising = True; s.render.film_transparent = False; s.unit_settings.system = 'METRIC'
    return s

def rounded_box(size=(1, 1, 1), radius=0.05, segments=6, name='Hero'):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    b = o.modifiers.new('Bevel', 'BEVEL'); b.width = radius; b.segments = segments; b.harden_normals = True; b.limit_method = 'ANGLE'
    o.modifiers.new('WN', 'WEIGHTED_NORMAL').keep_sharp = True
    bpy.ops.object.shade_smooth(); return o

PRESETS = {
    'aluminium':     dict(base=(0.80, 0.81, 0.83), metal=1.0, rough=0.28),
    'space_grey':    dict(base=(0.18, 0.19, 0.20), metal=1.0, rough=0.32),
    'glass':         dict(base=(1, 1, 1), metal=0.0, rough=0.02, trans=1.0, ior=1.5),
    'plastic_matte': dict(base=(0.9, 0.9, 0.9), metal=0.0, rough=0.55),
    'plastic_gloss': dict(base=(0.05, 0.05, 0.06), metal=0.0, rough=0.18, coat=0.6),
    'rubber':        dict(base=(0.03, 0.03, 0.03), metal=0.0, rough=0.8),
    'emissive':      dict(base=(1.0, 0.85, 0.91), metal=0.0, rough=0.5, emit=4.0),   # Veyra white-pink by default
}
def material(obj, preset='aluminium', color=None, name=None):
    p = dict(PRESETS[preset]); m = bpy.data.materials.new(name or f'MAT_{preset}'); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']; c = color or p['base']
    bsdf.inputs['Base Color'].default_value = (*c, 1); bsdf.inputs['Metallic'].default_value = p['metal']
    bsdf.inputs['Roughness'].default_value = p['rough']
    if 'aniso' in p: bsdf.inputs['Anisotropic'].default_value = p['aniso']
    if 'trans' in p: bsdf.inputs['Transmission Weight'].default_value = p['trans']; bsdf.inputs['IOR'].default_value = p['ior']
    if 'coat' in p: bsdf.inputs['Coat Weight'].default_value = p['coat']
    if 'emit' in p: bsdf.inputs['Emission Color'].default_value = (*c, 1); bsdf.inputs['Emission Strength'].default_value = p['emit']
    # micro-roughness variation so nothing looks like flat CG
    n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 400; mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = p['rough'] * 0.9; mr.inputs['To Max'].default_value = p['rough'] * 1.1
    nt.links.new(n.outputs['Fac'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], bsdf.inputs['Roughness'])
    obj.data.materials.clear(); obj.data.materials.append(m); return m

def _area(name, loc, rot, size, power, shape='RECTANGLE', size_y=None):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = power; d.shape = shape; d.size = size
    if size_y: d.size_y = size_y
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc
    o.rotation_euler = [math.radians(a) for a in rot]; return o

def setup(theme='light', lens=100, scale=1.0):
    """Cyclorama backdrop + softbox key, fill, two rim strips. scale = rough size of the subject in metres / 0.2."""
    s = bpy.context.scene; k = scale
    bg = (0.62, 0.63, 0.66) if theme == 'light' else (0.006, 0.006, 0.008)
    # curved backdrop
    bpy.ops.mesh.primitive_plane_add(size=1); p = bpy.context.object; p.name = 'Cyc'; p.scale = (6 * k, 6 * k, 1)
    bpy.ops.object.transform_apply(scale=True); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.subdivide(number_cuts=40)
    bpy.ops.object.mode_set(mode='OBJECT')
    for v in p.data.vertices:
        if v.co.y > 0.4 * k: d = v.co.y - 0.4 * k; v.co.z = d * d / (0.9 * k); v.co.y = 0.4 * k + d * 0.7
    bpy.ops.object.shade_smooth(); mat = bpy.data.materials.new('MAT_Cyc'); mat.use_nodes = True
    b = mat.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (*bg, 1); b.inputs['Roughness'].default_value = 0.6
    p.data.materials.append(mat)
    w = bpy.data.worlds.new('W'); s.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.05 if theme == 'light' else 0.0
    pw = 1.0 if theme == 'light' else 0.6
    _area('Key', (-0.9 * k, -0.7 * k, 1.1 * k), (50, 0, -50), 1.2 * k, 45 * k * k * pw)
    _area('Fill', (1.1 * k, -0.6 * k, 0.5 * k), (70, 0, 60), 1.5 * k, 10 * k * k * pw)
    _area('RimL', (-0.7 * k, 0.6 * k, 0.4 * k), (70, 0, -140), 0.08 * k, 30 * k * k, "RECTANGLE", 1.4 * k)
    _area('RimR', (0.7 * k, 0.6 * k, 0.4 * k), (70, 0, 140), 0.08 * k, 30 * k * k, "RECTANGLE", 1.4 * k)
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); bpy.context.collection.objects.link(cam)
    cam.data.lens = lens; s.camera = cam; return cam

def frame(obj, angle=(65, 0, 30), fill=0.55, dof=True):
    s = bpy.context.scene; cam = s.camera; bpy.context.view_layer.update()
    pts = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]; ctr = sum(pts, mathutils.Vector()) / 8
    rad = max((p - ctr).length for p in pts)
    cam.rotation_euler = [math.radians(a) for a in angle]
    fov = 2 * math.atan(18 / cam.data.lens); dist = rad / math.tan(fov / 2) / fill
    cam.location = ctr + cam.rotation_euler.to_matrix() @ mathutils.Vector((0, 0, dist))
    if dof: cam.data.dof.use_dof = True; cam.data.dof.focus_object = obj; cam.data.dof.aperture_fstop = 5.6
    # put the object on the floor
    obj.location.z -= min(p.z for p in pts)
    return dist

def render(path, res=(1600, 1200), samples=128):
    s = bpy.context.scene; s.render.resolution_x, s.render.resolution_y = res; s.render.resolution_percentage = 100
    s.cycles.samples = samples; s.render.image_settings.file_format = 'PNG'; s.render.image_settings.color_depth = '16'
    s.render.filepath = os.path.abspath(path); bpy.ops.render.render(write_still=True); print('rendered', path)

def turntable(prefix, frames=180, res=(1280, 960), samples=48, target=None):
    """Rotates the camera around the subject with ease-in/out. Writes prefix0001.png..."""
    s = bpy.context.scene; cam = s.camera; e = bpy.data.objects.new('Pivot', None); bpy.context.collection.objects.link(e)
    if target: e.location = target.location
    cam.parent = e; e.rotation_euler = (0, 0, 0); e.keyframe_insert('rotation_euler', frame=1)
    e.rotation_euler = (0, 0, math.radians(360)); e.keyframe_insert('rotation_euler', frame=frames)
    s.frame_start, s.frame_end = 1, frames; s.render.resolution_x, s.render.resolution_y = res; s.cycles.samples = samples
    s.render.image_settings.file_format = 'PNG'; s.render.filepath = os.path.abspath(prefix); bpy.ops.render.render(animation=True)
