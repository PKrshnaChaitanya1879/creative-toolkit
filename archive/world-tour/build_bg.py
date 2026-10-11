import subprocess, os, sys
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(D, 'raw'); O = os.path.join(D, 'seg'); os.makedirs(O, exist_ok=True)
FPS = 30
GRADE = "eq=contrast=1.07:saturation=1.12:brightness=-0.02,colorbalance=rs=-0.04:bs=0.05:rh=0.05:bh=-0.04"
# (t0, t1, kind, src, offset, zoom, ybias)
SEG = [
    (0.0, 1.5, 'none'),
    (1.5, 2.0, 'img', 'img2.jpg', 0, .06, .3),
    (2.0, 2.5, 'vid', 'shibuya_full.mp4', 30, .05, .5),
    (2.5, 3.0, 'vid', 'pa_b.mp4', 0, .05, .5),
    (3.0, 5.0, 'img', 'img3.jpg', 0, .10, .3),
    (5.0, 5.5, 'vid', 'cdg_full.mp4', 0.0, .04, .5),
    (5.5, 6.75, 'vid', 'shibuya_full.mp4', 20, .06, .5),
    (6.75, 8.0, 'vid', 'shibuya_full.mp4', 50, .06, .5),
    (8.0, 8.5, 'vid', 'cdg_full.mp4', 1.0, .04, .5),
    (8.5, 9.75, 'vid', 'ny_a.mp4', 0, .05, .5),
    (9.75, 11.0, 'vid', 'ny_b.mp4', 0.5, .05, .5),
    (11.0, 11.5, 'vid', 'cdg_full.mp4', 2.0, .04, .5),
    (11.5, 14.0, 'img', 'img4.jpg', 0, .12, .45),
    (14.0, 14.5, 'vid', 'cdg_full.mp4', 3.0, .04, .5),
    (14.5, 15.75, 'vid', 'pa_c.mp4', 0, .05, .5),
    (15.75, 17.0, 'vid', 'pa_a.mp4', 0, .05, .5),
    (17.0, 17.5, 'vid', 'cdg_full.mp4', 4.0, .04, .5),
    (17.5, 20.0, 'img', 'img1.jpg', 0, .12, .5),
    (20.0, 21.0, 'vid', 'cdg_full.mp4', 4.4, .05, .5),
    (21.0, 24.0, 'wall'),
    (24.0, 24.5, 'vid', 'pa_d.mp4', 0, .05, .5),
    (24.5, 25.0, 'none'),
    (25.0, 25.5, 'vid', 'ny_b.mp4', 2.0, .05, .5),
    (25.5, 26.0, 'none'),
    (26.0, 30.0, 'img', 'img3.jpg', 0, .08, .32),
]
def kb(dur, zoom, yb, w=1920, h=1080, sw=None):
    sw = sw or w
    return (f"scale=w='trunc({sw}*(1+{zoom}*t/{dur})/2)*2':h=-2:eval=frame,"
            f"crop={w}:{h}:(iw-{w})/2:(ih-{h})*{yb}")
def run(args):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args, capture_output=True, text=True)
    if r.returncode: print(r.stderr); sys.exit(1)
lst = []
for i, s in enumerate(SEG):
    t0, t1, kind = s[:3]; n = int(t1 * FPS + .5) - int(t0 * FPS + .5); dur = t1 - t0
    out = os.path.join(O, f's{i:02d}.mp4'); lst.append(out)
    enc = ['-frames:v', str(n), '-r', str(FPS), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', out]
    if os.path.exists(out) and os.path.getsize(out) > 1000 and kind != 'wall': print(i,'cached'); continue
    if kind == 'none':
        run(['-f', 'lavfi', '-i', f'color=c=0x0D1736:s=1920x1080:r={FPS}'] + enc)
    elif kind == 'img':
        _, _, _, src, off, z, yb = s
        run(['-loop', '1', '-framerate', str(FPS), '-i', os.path.join(R, src), '-vf', f"scale=2400:-2,{kb(dur, z, yb)},{GRADE},fps={FPS}"] + enc)
    elif kind == 'vid':
        _, _, _, src, off, z, yb = s
        run(['-ss', str(off), '-i', os.path.join(R, src), '-vf', f"{kb(dur, z, yb)},{GRADE},fps={FPS}"] + enc)
    elif kind == 'wall':
        ins = []
        srcs = [('img', 'img3.jpg', 0), ('vid', 'shibuya_full.mp4', 24), ('vid', 'ny_a.mp4', 1), ('img', 'img4.jpg', 0), ('vid', 'pa_b.mp4', 1), ('img', 'img1.jpg', 0)]
        fc = []
        for k, (kk, src, off) in enumerate(srcs):
            if kk == 'img': ins += ['-loop', '1', '-framerate', str(FPS), '-i', os.path.join(R, src)]
            else: ins += ['-ss', str(off), '-i', os.path.join(R, src)]
            fc.append(f"[{k}:v]scale=1000:-2,{kb(dur, .08, .4, 640, 540, 980)},{GRADE},fps={FPS},setsar=1[v{k}]")
        fc.append("".join(f"[v{k}]" for k in range(6)) + "xstack=inputs=6:layout=0_0|640_0|1280_0|0_540|640_540|1280_540[out]")
        run(ins + ['-filter_complex', ";".join(fc), '-map', '[out]'] + enc)
    print(i, kind, n, flush=True)
with open(os.path.join(O, 'list.txt'), 'w') as f:
    for p in lst: f.write(f"file '{p}'\n")
run(['-f', 'concat', '-safe', '0', '-i', os.path.join(O, 'list.txt'), '-c', 'copy', os.path.join(D, 'bg.mp4')])
os.makedirs(os.path.join(D, 'bgf'), exist_ok=True)
run(['-i', os.path.join(D, 'bg.mp4'), '-fps_mode', 'passthrough', '-q:v', '3', os.path.join(D, 'bgf', 'f%04d.jpg')])
print('frames', len(os.listdir(os.path.join(D, 'bgf'))))
