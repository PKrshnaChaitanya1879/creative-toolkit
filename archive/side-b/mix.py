import json, subprocess, numpy as np, wave, os
SR = 44100
TL = json.load(open('timeline.json')); TOT = TL['total']; N = int(TOT * SR) + SR
rng = np.random.default_rng(9)
def load(fn, extra=''):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', fn, '-ac', '1', '-ar', str(SR)] + (['-af', extra] if extra else []) + ['-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
def lp(x, a):
    from scipy.signal import lfilter
    return lfilter([a], [1, a - 1], x)
def hp(x, a): return x - lp(x, a)
def put(buf, sig, t, g=1.0):
    i = int(t * SR); j = min(len(buf), i + len(sig))
    if j > i: buf[i:j] += sig[:j - i] * g
env = lambda n, a, r: np.minimum(1, np.arange(n) / max(1, a * SR)) * np.minimum(1, (n - np.arange(n)) / max(1, r * SR))
voice = np.zeros(N); fx = np.zeros(N); hiss = np.zeros(N)
TAPE_FX = 'highpass=f=170,lowpass=f=6200,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,vibrato=f=0.7:d=0.004,volume=1.25'
for v in TL['vo']:
    put(voice, load(v['file'], TAPE_FX), v['t'])
# tape clicks + motor, hiss beds during tapes
def click(kind):
    n = int(SR * (.45 if kind == 'start' else .3)); t = np.arange(n) / SR
    c = hp(rng.standard_normal(n), .5) * np.exp(-t / .006) * .9
    c += np.sin(2 * np.pi * 95 * t) * np.exp(-t / .04) * .5
    if kind == 'start': c += lp(rng.standard_normal(n), .05) * np.minimum(1, t / .05) * np.exp(-t / .3) * .25
    return c
tape_spans = [(t['t0'], t['t1']) for t in TL['tapes']] + [(TL['coda'] + 1.4, TL['cut'])]
for a, b in tape_spans:
    put(fx, click('start'), a + .15, .8); put(fx, click('stop'), b, .7)
    n = int((b - a) * SR); h = hp(rng.standard_normal(n), .35) * .035 * env(n, .3, .2)
    put(hiss, h, a)
# film-wide faint projector hiss
hiss += hp(rng.standard_normal(N), .4) * .008
# ambiences
def birds(sec):
    n = int(sec * SR); out = np.zeros(n)
    for _ in range(int(sec * 3.2)):
        st = rng.uniform(0, sec - .4); d = rng.uniform(.06, .18); m = int(d * SR); tt = np.arange(m) / SR
        f0 = rng.uniform(2600, 4800); f = f0 + rng.uniform(-900, 1400) * np.sin(np.pi * tt / d) + 300 * np.sin(2 * np.pi * rng.uniform(20, 45) * tt)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2 * rng.uniform(.08, .2)
        put(out, s, st)
    return out
def bell():
    n = int(SR * 1.6); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(2093, .5), (2637, .3), (4186, .15), (5274, .08)])
    return s * np.exp(-t / .45) * .35
def kettle(sec):
    n = int(sec * SR); t = np.arange(n) / SR
    f = 2050 + 380 * np.minimum(1, t / (sec * .7)) + 18 * np.sin(2 * np.pi * 5.5 * t)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR); breath = hp(rng.standard_normal(n), .3) * .5
    e = np.minimum(1, t / (sec * .6)) ** 1.5 * np.minimum(1, (sec - t) / .25)
    return (tone * .22 + breath * .06) * e
def sea(sec):
    n = int(sec * SR); t = np.arange(n) / SR
    noise = lp(rng.standard_normal(n), .06) * 1.2 + hp(rng.standard_normal(n), .6) * .15
    swell = .35 + .65 * np.clip(np.sin(2 * np.pi * t / 4.2 - 1.2), 0, 1) ** 1.6
    return noise * swell * .5 * env(n, .8, .8)
horn = load('sfx/horn.wav', 'highpass=f=120,lowpass=f=5000')
for a in TL['amb']:
    if a['kind'] == 'morning':
        put(fx, birds(a['dur']), a['t'], .7); put(fx, bell(), a['t'] + 1.0, .6); put(fx, kettle(2.6), a['t'] + a['dur'] - 2.9, .9)
    elif a['kind'] == 'sea':
        put(fx, sea(a['dur'] + 1.5), a['t'] - .5, 1.0)
    elif a['kind'] == 'horn':
        put(fx, horn * env(len(horn), .05, .6), a['t'] + .3, .9)
# train rhythm: intro and the final crossing
def clack(sec, speed=1.0, g=.5):
    n = int(sec * SR); out = np.zeros(n); t = 0.0; k = 0
    while t < sec - .2:
        m = int(.09 * SR); tt = np.arange(m) / SR
        hit = lp(rng.standard_normal(m), .25) * np.exp(-tt / .025) + np.sin(2 * np.pi * 70 * tt) * np.exp(-tt / .05) * .6
        put(out, hit, t); t += (.16 if k % 2 == 0 else .72) / speed; k += 1
    rumble = lp(rng.standard_normal(n), .01) * 1.6
    return (out * .8 + rumble * .5) * g * env(n, 1.0, 1.2)
put(fx, clack(TL['tapes'][0]['t0'] - 2.5, 1.0, .55), 2.8)
segs = TL['segs']
blur_t = [s['t0'] for s in segs if s['clip'] == 'blur']
for bt in blur_t:
    n = int(SR * 2.4); t = np.arange(n) / SR
    put(fx, lp(rng.standard_normal(n), .18) * np.sin(np.pi * t / 2.4) ** 2 * .9, bt - 1.0)
# music with ducking under voice
mus = load('score.wav'); m = np.zeros(N); m[:min(N, len(mus))] = mus[:N]
vmask = np.zeros(N)
for v in TL['vo']:
    i = int((v['t'] - .25) * SR); j = int((v['t'] + v['dur'] + .35) * SR); vmask[i:j] = 1
from scipy.ndimage import uniform_filter1d
duck = 1 - .64 * uniform_filter1d(vmask, int(.6 * SR))
mixL = voice * 1.0 + fx * .8 + hiss + m * .62 * duck
mixL[int((TL['end_tape'] + .05) * SR):int((TL['end_title'][0]) * SR)] *= .0  # hard cut to silence when the tape runs out
pk = np.max(np.abs(mixL)); mixL = np.tanh(mixL / pk * 1.15) / np.tanh(1.15) * .9
out = (np.stack([mixL, mixL], 1) * 32767).astype(np.int16)
w = wave.open('mix.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('mix', round(len(mixL) / SR, 1), 's')
