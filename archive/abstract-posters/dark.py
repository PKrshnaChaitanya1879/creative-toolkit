import sys, math, bpy; sys.path.insert(0, '/home/claude/creative-toolkit/blender'); import studio
s = studio.reset()
# glossy black sphere
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=128, ring_count=64, location=(0, 0, 1)); sp = bpy.context.object; bpy.ops.object.shade_smooth()
m = studio.material(sp, 'plastic_gloss', color=(0.004, 0.004, 0.005))
# black mirror-ish floor
bpy.ops.mesh.primitive_plane_add(size=60); fl = bpy.context.object
fm = bpy.data.materials.new('floor'); fm.use_nodes = True; b = fm.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value = (0.003, 0.003, 0.004, 1); b.inputs['Roughness'].default_value = 0.12; fl.data.materials.append(fm)
# warm emissive disc behind the sphere -> eclipse rim
bpy.ops.mesh.primitive_circle_add(vertices=256, radius=1.5, fill_type="NGON", location=(0.05, 6, 1.07), rotation=(math.radians(90), 0, 0)); d = bpy.context.object
dm = bpy.data.materials.new('sun'); dm.use_nodes = True; nt = dm.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (1.0, 0.42, 0.15, 1); e.inputs["Strength"].default_value = 3
nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs[0]); d.data.materials.append(dm)
# thin cool rim strip from the left for a single highlight on the sphere
L = bpy.data.lights.new('rim', 'AREA'); L.shape = 'RECTANGLE'; L.size = 0.05; L.size_y = 3; L.energy = 120; L.color = (0.75, 0.82, 1.0)
lo = bpy.data.objects.new('rim', L); bpy.context.collection.objects.link(lo); lo.location = (-2.6, 1.2, 1.6); lo.rotation_euler = (math.radians(90), 0, math.radians(-115))
w = bpy.data.worlds.new('W'); s.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); bpy.context.collection.objects.link(cam); s.camera = cam
cam.data.lens = 85; cam.location = (0, -13.5, 1.25); cam.rotation_euler = (math.radians(89.2), 0, 0); cam.data.shift_y = 0.05
s.view_settings.look = 'AgX - High Contrast'
studio.render('dark_raw.png', res=(1200, 1680), samples=96)
