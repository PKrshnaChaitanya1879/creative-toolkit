import subprocess, os, sys, json
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(D, 'raw'); O = os.path.join(D, 'seg'); os.makedirs(O, exist_ok=True)
FPS = 30
S = 90.40                      # song start
END = 48.0                     # video length (s)
g = json.load(open(os.path.join(D, 'song', 'flight_grid.json')))
B = list(g['beats'])
while len(B) < 53: B.append(B[-1] + 0.762)
tau = lambda k: B[k] - S
json.dump({'S': S, 'END': END, 'beats': [b - S for b in B]}, open(os.path.join(D, 'timeline.json'), 'w'))
GRADE = "eq=contrast=1.06:saturation=1.08"
# (from_beat_or_time, kind, src, offset, zoom, ybias)
P = [
    (0,  'vid', 'artemis_recap.mp4', 8.0, .12, .5),
    (5,  'vid', 'artemis_recap.mp4', 10.5, .08, .5),
    (6,  'vid', 'artemis_recap.mp4', 15.5, .08, .5),
    (7,  'vid', 'artemis_recap.mp4', 13.0, .08, .5),
    (8,  'vid', 'artemis_recap.mp4', 35.5, .08, .5),
    (9,  'vid', 'artemis_recap.mp4', 38.0, .08, .5),
    (10, 'vid', 'artemis_recap.mp4', 58.0, .08, .5),
    (11, 'vid', 'artemis_recap.mp4', 33.0, .08, .5),
    (12, 'vid', 'artemis_recap.mp4', 53.0, .08, .5),
    (13, 'vid', 'artemis_recap.mp4', 55.5, .08, .5),
    (14, 'vid', 'rs25.mp4', 60.0, .06, .5),
    (15, 'vid', 'rs25.mp4', 75.0, .10, .5),
    (18, 'vid', 'artemis_cu.mp4', 49.0, .06, .5),
    (20, 'vid', 'artemis_recap.mp4', 60.5, .06, .5),
    (21, 'vid', 'artemis_cu.mp4', 57.0, .08, .5),
    (23, 'vid', 'artemis_recap.mp4', 75.5, .08, .5),
    (24, 'vid', 'artemis_recap.mp4', 78.0, .08, .5),
    (26, 'vid', 'earth.mp4', 300.0, .06, .5),
    (28, 'vid', 'earth.mp4', 2700.0, .06, .5),
    (30, 'vid', 'orion.mp4', 600.0, .08, .5),
    (34, 'mars', 'mars.mp4', 86.0, 0, 0),
    (38, 'img', 'jup_21775.jpg', 0, .15, .5),
    (41, 'img', 'sat_splendor.jpg', 0, .10, .5),
    (43, 'img', 'sat_portrait.jpg', 0, .10, .5),
    (45, 'img', 'webb_deep.png', 0, .30, .5),
    (49, 'img', 'carina.png', 0, .25, .45),
    (52, 'pbd', 'pbd.jpg', 0, 0, 0),
]
def kb(dur, zoom, yb, w=1920, h=1080, sw=1920):
    return (f"scale=w='trunc(max({sw},{h}*iw/ih)*(1+{zoom}*t/{dur})/2)*2':h=-2:eval=frame,"
            f"crop={w}:{h}:(iw-{w})/2:(ih-{h})*{yb}")
def run(args):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args, capture_output=True, text=True)
    if r.returncode: print(' '.join(args)); print(r.stderr); sys.exit(1)
lst = []; total = 0
for i, (k, kind, src, off, z, yb) in enumerate(P):
    t0 = tau(k) if k else 0.0
    t1 = tau(P[i+1][0]) if i + 1 < len(P) else END
    n = int(t1 * FPS + .5) - int(t0 * FPS + .5); total += n; dur = t1 - t0
    out = os.path.join(O, f's{i:02d}.mp4'); lst.append(out)
    enc = ['-frames:v', str(n), '-r', str(FPS), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', out]
    if os.path.exists(out) and os.path.getsize(out) > 1000 and '--force' not in sys.argv: print(i, 'cached'); continue
    srcp = os.path.join(R, src)
    if kind == 'vid':
        run(['-ss', str(off), '-i', srcp, '-vf', f"{kb(dur, z, yb)},{GRADE},fps={FPS}"] + enc)
    elif kind == 'img':
        run(['-loop', '1', '-framerate', str(FPS), '-i', srcp, '-vf', f"scale=2400:-2,{kb(dur, z, yb)},{GRADE},fps={FPS}"] + enc)
    elif kind == 'mars':
        fc = (f"[0:v]crop=1120:890:424:4,fps={FPS},split[a][b];"
              f"[a]scale=1920:-2,crop=1920:1080,gblur=sigma=40,eq=brightness=-0.18:saturation=1.2[bg];"
              f"[b]scale=1000:-2[p];[bg][p]overlay=x=820:y=(H-h)/2[out]")
        run(['-ss', str(off), '-i', srcp, '-filter_complex', fc, '-map', '[out]'] + enc)
    elif kind == 'pbd':
        vf = (f"scale=w='trunc(1920*(1+1.6*t/{dur})/2)*2':h=-2:eval=frame,"
              f"crop=1920:1080:'min(max(1141*iw/1920-960,0),iw-1920)':'min(max(986*iw/1920-540,0),ih-1080)',{GRADE},fps={FPS}")
        run(['-loop', '1', '-framerate', str(FPS), '-i', srcp, '-vf', vf] + enc)
    print(i, kind, src, round(t0, 3), n, flush=True)
print('total frames', total)
with open(os.path.join(O, 'list.txt'), 'w') as f:
    for p in lst: f.write(f"file '{p}'\n")
run(['-f', 'concat', '-safe', '0', '-i', os.path.join(O, 'list.txt'), '-c', 'copy', os.path.join(D, 'bg.mp4')])
bf = os.path.join(D, 'bgf'); os.makedirs(bf, exist_ok=True)
for f in os.listdir(bf): os.remove(os.path.join(bf, f))
run(['-i', os.path.join(D, 'bg.mp4'), '-fps_mode', 'passthrough', '-q:v', '3', os.path.join(bf, 'f%04d.jpg')])
print('frames', len(os.listdir(bf)))
