"""Sound design + mix: rain, cord click, train clacks + rumble, mist whooshes, sea wash; mixed under the score."""
import numpy as np, soundfile as sf, scipy.signal as sg
SR = 48000; DUR = 60.0; n = int(SR * DUR); t = np.arange(n) / SR; rng = np.random.default_rng(7)
BAR = 2.74; JOURNEY = 9 * BAR; SCENE = 2 * BAR; SLEEP = 19 * BAR; TRAIN = 22.4; LIGHTS = 13.5
def env(points):  # piecewise-linear gain curve [(time, gain), ...]
    p = np.array(points); return np.interp(t, p[:, 0], p[:, 1])
def lp(x, f, o=2): return sg.sosfilt(sg.butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sg.sosfilt(sg.butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sg.sosfilt(sg.butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def place(dst, src, at, g=1.0):
    i = int(at * SR); j = min(n, i + len(src)); dst[i:j] += src[:j - i] * g
st = lambda: np.zeros((n, 2))
# ---- rain: soft broadband hiss + patter of drops on glass (stereo)
pink = np.cumsum(rng.standard_normal((n, 2)), axis=0); pink = hp(pink, 120); pink /= np.abs(pink).max()
hiss = bp(rng.standard_normal((n, 2)), 900, 7000) * .5 + lp(pink, 1800) * .8
drops = np.zeros((n, 2)); k = np.arange(int(.012 * SR)); tick = np.sin(2 * np.pi * 3200 * k / SR) * np.exp(-k / (.0018 * SR))
for _ in range(9000): pos = rng.uniform(0, DUR - .02); c = rng.integers(0, 2); place(drops[:, c:c + 1], (tick * rng.uniform(.2, 1))[:, None], pos)
scenes = [JOURNEY + i * SCENE for i in range(6)]
rain_g = env([(0, .0), (1.5, .55), (21, .6), (24, .9), (scenes[3] - .5, .9), (scenes[3] + .3, .25), (scenes[4] - .5, .25), (scenes[4] + 1.5, .08),
              (SLEEP - .3, .05), (SLEEP + .6, .7), (57, .35), (60, .0)])
rain = (hiss * .11 + drops * .2) * rain_g[:, None]
# ---- room tone / lamp hum (very low), only in the room
room = lp(rng.standard_normal((n, 2)), 300) * .05 * env([(0, 1), (21.5, 1), (22, .3), (SLEEP, .3), (SLEEP + 1, 1), (60, 1)])[:, None]
# ---- pull-cord click + lights off
fx = st(); k = np.arange(int(.05 * SR))
click = (np.sin(2 * np.pi * 1700 * k / SR) * np.exp(-k / (.004 * SR)) + .5 * rng.standard_normal(len(k)) * np.exp(-k / (.002 * SR)))
place(fx, np.stack([click, click * .8], 1), LIGHTS - .2, .35); place(fx, np.stack([click * .7, click], 1), LIGHTS - .05, .3)
# ---- train: rumble + clack pairs on the beat (accelerating from TRAIN to full speed)
mv = np.clip((t - TRAIN) / 2.6, 0, 1); mv = mv * mv * (3 - 2 * mv)
rumble = lp(rng.standard_normal((n, 2)), 110, 4) * 2.2 + bp(rng.standard_normal((n, 2)), 180, 600) * .25
rum_g = mv * env([(0, 1), (SLEEP - .3, 1), (SLEEP + .5, .45), (60, .35)])
k = np.arange(int(.09 * SR)); thump = (np.sin(2 * np.pi * 70 * k / SR) * np.exp(-k / (.025 * SR)) + .6 * bp(rng.standard_normal(len(k)), 1500, 5000) * np.exp(-k / (.006 * SR)))
clacks = st(); BEAT = BAR / 4; tt = TRAIN + .4; gap = BEAT * 4
while tt < DUR - .3:
    g = .55 if tt < SLEEP else .28
    place(clacks, np.stack([thump, thump * .85], 1), tt, g); place(clacks, np.stack([thump * .8, thump], 1), tt + .13, g * .8)
    gap = max(BEAT * 2, gap * .82); tt += gap
train = rumble * .07 * rum_g[:, None] + clacks * .35
# ---- mist whooshes into every world (swell into the downbeat)
wh = st()
for b in scenes[:5]:
    L = int(1.6 * SR); k = np.arange(L); e = np.sin(np.pi * k / L) ** 2; nz = bp(rng.standard_normal((L, 2)), 300, 3000) * e[:, None]
    sweep = np.linspace(0, 1, L); nz[:, 0] *= 1 - .4 * sweep; nz[:, 1] *= .6 + .4 * sweep; place(wh, nz, b - .9, .12)
# ---- snow hush (wind) and coast (sea wash + gentle chimes of light)
wind = bp(rng.standard_normal((n, 2)), 400, 1400) * .06 * env([(scenes[3] - .5, 0), (scenes[3] + .5, 1), (scenes[4] - .3, 1), (scenes[4] + .5, 0)])[:, None]
sea_l = lp(rng.standard_normal((n, 2)), 900) * (0.6 + .4 * np.sin(2 * np.pi * t / 3.2))[:, None]
sea = sea_l * .12 * env([(scenes[4] - .6, 0), (scenes[4] + .6, 1), (SLEEP - .4, 1), (SLEEP, 0)])[:, None]
sfx = rain + room + fx + train + wh + wind + sea
# ---- score: duck slightly under the cord click, fade the tail
music, sr = sf.read('score.wav'); music = music[:n] if len(music) >= n else np.pad(music, ((0, n - len(music)), (0, 0)))
music *= env([(0, .0), (.4, 1), (57.5, 1), (59.8, 0)])[:, None]
mix = music * 1.0 + sfx * .9
fade = np.ones(n); fe = int(.02 * SR); fade[:fe] = np.linspace(0, 1, fe); fade[-int(.3 * SR):] = np.linspace(1, 0, int(.3 * SR))
mix *= fade[:, None]; mix /= max(1e-6, np.abs(mix).max()) / .9
sf.write('mix_raw.wav', mix.astype(np.float32), SR)
print('mix_raw.wav', mix.shape)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for a in range(0, 60, 4):
    s0, s1 = a * SR, (a + 4) * SR
    print(f'{a:2d}s  music {db(music[s0:s1]):6.1f}  rain {db(rain[s0:s1] * .9):6.1f}  train {db(train[s0:s1] * .9):6.1f}  sfx {db(sfx[s0:s1] * .9):6.1f}')
