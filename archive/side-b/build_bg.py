import json, subprocess, os, sys
from concurrent.futures import ThreadPoolExecutor
D = os.path.dirname(os.path.abspath(__file__)); FPS = 24
TL = json.load(open(os.path.join(D, 'timeline.json'))); CL = TL['clips']
O = os.path.join(D, 'seg'); os.makedirs(O, exist_ok=True)
def mixer(w, colour):
    if colour:
        s = .25 + .75 * w
        return f"eq=saturation={s:.2f}:contrast=1.04,colorbalance=rs={.06*w:.3f}:gs={.02*w:.3f}:bs={-.06*w:.3f}:rm={.05*w:.3f}:bm={-.05*w:.3f}"
    cold = [(.28, .55, .10), (.30, .58, .11), (.33, .64, .13)]
    sep = [(.393, .769, .189), (.349, .686, .168), (.272, .534, .131)]
    r = [[(1 - w) * c + w * s for c, s in zip(cr, sr)] for cr, sr in zip(cold, sep)]
    return "colorchannelmixer=" + ":".join(f"{a:.3f}" for row in r for a in (*row, 0)).rstrip(':0') if False else \
        "colorchannelmixer=rr={:.3f}:rg={:.3f}:rb={:.3f}:gr={:.3f}:gg={:.3f}:gb={:.3f}:br={:.3f}:bg={:.3f}:bb={:.3f}".format(*r[0], *r[1], *r[2])
FILM = ("crop=640:360:0:60,scale=1920:1080:flags=lanczos,unsharp=5:5:0.4,"
        "eq=brightness='0.012*sin(t*41)+0.008*sin(t*13.7)':contrast=1.06:eval=frame,"
        "noise=alls=13:allf=t+u,vignette=angle=PI/4.6")
segs = TL['segs']; jobs = []
for i, s in enumerate(segs):
    f0 = int(s['t0'] * FPS + .5); f1 = int((s['t0'] + s['dur']) * FPS + .5); n = f1 - f0
    out = os.path.join(O, f's{i:03d}.mp4')
    enc = ['-frames:v', str(n), '-r', str(FPS), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', out]
    if s['clip'] == 'black':
        cmd = ['-f', 'lavfi', '-i', f'color=c=black:s=1920x1080:r={FPS}'] + enc
    else:
        film, a, b, colour = CL[s['clip']]
        avail = b - a; d = s['dur']
        slow = max(1.0, d / avail)
        start = a if slow > 1 else a + (avail - d) * .3
        vf = f"setpts={slow:.4f}*(PTS-STARTPTS),fps={FPS},{mixer(s['warm'], colour)},{FILM}"
        cmd = ['-ss', f'{start:.3f}', '-t', f'{min(avail, d) + .2:.3f}', '-i', os.path.join(D, 'raw', film + '.mp4'), '-vf', vf] + enc
    jobs.append((i, cmd, out, n))
def run(job):
    i, cmd, out, n = job
    if os.path.exists(out) and os.path.getsize(out) > 1000 and '--force' not in sys.argv: return i, 'cached'
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y'] + cmd, capture_output=True, text=True)
    return i, (r.stderr[-300:] if r.returncode else 'ok')
with ThreadPoolExecutor(6) as ex:
    for i, res in ex.map(run, jobs):
        if res not in ('ok', 'cached'): print('FAIL', i, res); sys.exit(1)
print('segments', len(jobs), 'frames', sum(j[3] for j in jobs))
with open(os.path.join(O, 'list.txt'), 'w') as f:
    for j in jobs: f.write(f"file '{j[2]}'\n")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', os.path.join(O, 'list.txt'), '-c', 'copy', os.path.join(D, 'bg.mp4')], check=True)
bf = os.path.join(D, 'bgf'); os.makedirs(bf, exist_ok=True)
for x in os.listdir(bf): os.remove(os.path.join(bf, x))
subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(D, 'bg.mp4'), '-fps_mode', 'passthrough', '-q:v', '3', os.path.join(bf, 'f%05d.jpg')], check=True)
print('frames', len(os.listdir(bf)))
