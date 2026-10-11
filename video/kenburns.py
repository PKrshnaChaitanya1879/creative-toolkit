"""Build a background video from a shot list (clips + stills), each with a slow Ken Burns zoom and one grade.
Usage: python3 kenburns.py shots.json out.mp4 [--frames outdir]
shots.json = {"w": 1920, "h": 1080, "fps": 30, "grade": "eq=contrast=1.06:saturation=1.08",
              "shots": [{"src": "raw/a.mp4", "in": 8.0, "dur": 2.4, "zoom": 0.08, "ybias": 0.5},
                        {"src": "raw/b.jpg", "dur": 3.0, "zoom": 0.15}]}
Frame counts use int(t*fps + 0.5) on cumulative times so cuts never drift off the beat."""
import sys, json, os, subprocess
S = json.load(open(sys.argv[1])); out = sys.argv[2]; W, H, FPS = S.get('w', 1920), S.get('h', 1080), S.get('fps', 30); G = S.get('grade', 'null')
tmp = out + '.segs'; os.makedirs(tmp, exist_ok=True); lst = []; t = 0.0
def run(a):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y'] + a, capture_output=True, text=True)
    if r.returncode: sys.exit(r.stderr)
for i, s in enumerate(S['shots']):
    n = int((t + s['dur']) * FPS + .5) - int(t * FPS + .5); t += s['dur']; d = s['dur']; z = s.get('zoom', .08); yb = s.get('ybias', .5)
    kb = (f"scale=w='trunc(max({W},{H}*iw/ih)*(1+{z}*t/{d})/2)*2':h=-2:eval=frame,crop={W}:{H}:(iw-{W})/2:(ih-{H})*{yb}")
    o = os.path.join(tmp, f's{i:03d}.mp4'); lst.append(o)
    enc = ['-frames:v', str(n), '-r', str(FPS), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', o]
    still = s['src'].lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
    inp = (['-loop', '1', '-framerate', str(FPS), '-i', s['src']] if still else ['-ss', str(s.get('in', 0)), '-i', s['src']])
    pre = f'scale={int(W * 1.25)}:-2,' if still else ''
    run(inp + ['-vf', f'{pre}{kb},{G},fps={FPS}'] + enc); print(i, s['src'], n, 'frames')
open(os.path.join(tmp, 'list.txt'), 'w').write(''.join(f"file '{os.path.abspath(p)}'\n" for p in lst))
run(['-f', 'concat', '-safe', '0', '-i', os.path.join(tmp, 'list.txt'), '-c', 'copy', out])
if '--frames' in sys.argv:
    fd = sys.argv[sys.argv.index('--frames') + 1]; os.makedirs(fd, exist_ok=True); run(['-i', out, '-q:v', '3', os.path.join(fd, 'f%05d.jpg')])
print('done', out)
