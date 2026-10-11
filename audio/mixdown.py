"""Simple multitrack mixer with ducking. Usage: python3 mixdown.py mix.json out.wav
mix.json = {"dur": 30, "music": {"file": "song.wav", "start": 90.4, "gain_db": 0, "fade_out": 2},
            "voice": [{"file": "vo/l01.wav", "t": 3.2}], "sfx": [{"file": "whoosh.wav", "t": 1.0, "gain_db": -6}],
            "duck_db": -10}
Music ducks under voice (150 ms attack, 400 ms release). Output 48 kHz stereo, peak-safe; run loudness.sh after."""
import sys, json, numpy as np, soundfile as sf, librosa
SR = 48000; M = json.load(open(sys.argv[1])); N = int(M['dur'] * SR)
def load(f, off=0.0):
    a, sr = librosa.load(f, sr=SR, mono=False, offset=off); a = np.atleast_2d(a)
    return np.vstack([a, a]) if a.shape[0] == 1 else a[:2]
db = lambda d: 10 ** (d / 20)
out = np.zeros((2, N)); vo = np.zeros((2, N))
def place(buf, a, t, g):
    i = int(t * SR); j = min(N, i + a.shape[1]);
    if j > i: buf[:, i:j] += a[:, :j - i] * g
for v in M.get('voice', []): place(vo, load(v['file']), v['t'], db(v.get('gain_db', 0)))
for s in M.get('sfx', []): place(out, load(s['file']), s['t'], db(s.get('gain_db', 0)))
if 'music' in M:
    m = M['music']; mu = np.zeros((2, N)); place(mu, load(m['file'], m.get('start', 0)), 0, db(m.get('gain_db', 0)))
    env = (np.abs(vo).max(0) > 0.01).astype(float); k = lambda ms: int(ms / 1000 * SR)
    sm = np.minimum(1, np.convolve(env, np.ones(k(400)) / k(400), 'same') * 2)   # ~150 ms rise, ~400 ms release
    mu *= 1 - (1 - db(M.get('duck_db', -10))) * sm
    fo = m.get('fade_out', 2); n = int(fo * SR); mu[:, N - n:] *= np.linspace(1, 0, n)
    out += mu
out += vo; pk = np.abs(out).max(); out *= min(1, 0.89 / pk) if pk else 1
sf.write(sys.argv[2], out.T, SR); print('wrote', sys.argv[2], 'peak', round(pk, 3))
