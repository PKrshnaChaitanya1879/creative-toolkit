"""Export the current scene's selected meshes for Unity (URP).
Use: import export_unity; export_unity.fbx('Iris_Sword.fbx', objects=[obj])
- Applies transforms, metres, forward -Z / up Y so it imports at the right size and faces forward.
- Report: tris per object (check against game-finish budgets)."""
import bpy
def tris(o):
    dg = bpy.context.evaluated_depsgraph_get(); m = o.evaluated_get(dg).to_mesh(); n = sum(len(p.vertices) - 2 for p in m.polygons); o.evaluated_get(dg).to_mesh_clear(); return n
def fbx(path, objects=None):
    objs = objects or [o for o in bpy.context.scene.objects if o.type in ('MESH', 'ARMATURE')]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for o in objs:
        if o.type == 'MESH': print(f'{o.name}: {tris(o)} tris')
    bpy.ops.export_scene.fbx(filepath=path, use_selection=True, apply_unit_scale=True, apply_scale_options='FBX_SCALE_UNITS',
        axis_forward='-Z', axis_up='Y', use_mesh_modifiers=True, mesh_smooth_type='FACE', add_leaf_bones=False,
        bake_anim=any(o.type == 'ARMATURE' for o in objs), path_mode='COPY', embed_textures=False)
    print('exported', path)
