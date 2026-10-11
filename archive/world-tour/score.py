import numpy as np, wave, sys
SR = 44100; DUR = 30.0; N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
def at(t): return int(t * SR)
def add(sig, t, gain=1.0, pan=0.0):
    i = at(t); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[:j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))
def env(n, attack, decay):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)
def lp(x, a):  # one-pole lowpass, a in (0,1] (vectorised via cumulative approx loop)
    y = np.empty_like(x); acc = 0.0
    for k in range(len(x)):
        acc += a * (x[k] - acc); y[k] = acc
    return y
def lp_var(x, alist):
    y = np.empty_like(x); acc = 0.0
    for k in range(len(x)):
        acc += alist[k] * (x[k] - acc); y[k] = acc
    return y

# --- instruments ---
def kick(big=False):
    n = int(SR * (0.9 if big else 0.45)); t = np.arange(n) / SR
    f = 42 + (150 if big else 115) * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / (0.35 if big else 0.16))
    click = rng.standard_normal(n) * np.exp(-t / 0.004) * 0.3
    return np.tanh((s + click) * 1.6)
def clap():
    n = int(SR * 0.25); t = np.arange(n) / SR
    no = rng.standard_normal(n); no = no - lp(no, 0.15)
    e = np.exp(-t / 0.07) + 0.6 * np.exp(-np.maximum(0, t - 0.012) / 0.01) * (t > 0.012)
    return no * e * 0.6
def hat(open_=False):
    n = int(SR * (0.18 if open_ else 0.05)); t = np.arange(n) / SR
    no = rng.standard_normal(n); no = no - lp(no, 0.5)
    return no * np.exp(-t / (0.06 if open_ else 0.015)) * 0.35
def tick():
    n = int(SR * 0.012); t = np.arange(n) / SR
    no = rng.standard_normal(n); no = no - lp(no, 0.4)
    return no * np.exp(-t / 0.002) * 0.5
def boom(size=1.0):
    n = int(SR * 1.6 * size); t = np.arange(n) / SR
    f = 34 + 70 * np.exp(-t / 0.08)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.55 * size))
    no = rng.standard_normal(n); crack = lp(no, 0.25) * np.exp(-t / 0.06) * 0.9
    return np.tanh((s * 1.2 + crack) * 1.5)
def whoosh(length=0.65, peak=0.55):
    n = int(SR * length); t = np.arange(n) / SR
    no = rng.standard_normal(n)
    x = t / length; shape = np.where(x < peak, (x / peak) ** 2, ((1 - x) / (1 - peak)) ** 1.5)
    a = 0.01 + 0.35 * shape
    return lp_var(no, a) * shape * 1.4
def riser(length=1.0):
    n = int(SR * length); t = np.arange(n) / SR
    f = 180 * (7 ** (t / length))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    no = lp_var(rng.standard_normal(n), 0.02 + 0.5 * (t / length) ** 2) * 0.8
    return (s + no) * (t / length) ** 2.2
def stamp_thud():
    n = int(SR * 0.35); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (70 + 60 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.08)
    slap = lp(rng.standard_normal(n), 0.35) * np.exp(-t / 0.02)
    return np.tanh((s + slap) * 2)

BEAT = 0.5
# chords per 2-s bar, starting at 3.0: Am F C G
CH = [(220.0, [220.0, 261.63, 329.63]), (174.61, [174.61, 220.0, 261.63]), (130.81, [196.0, 261.63, 329.63]), (196.0, [196.0, 246.94, 293.66])]
def chord_at(t):
    k = int(np.floor((t - 3.0) / 2.0)) % 4 if t >= 3.0 else 0
    return CH[k]

# --- pad: whole track, filtered detuned saws ---
tt = np.arange(N) / SR
pad = np.zeros(N)
for b in range(-2, 14):
    t0 = 3.0 + b * 2.0; t1 = t0 + 2.0
    i0, i1 = max(0, at(t0)), min(N, at(t1))
    if i1 <= i0: continue
    _, notes = CH[b % 4]
    seg_t = tt[i0:i1]
    for f in notes:
        for det in (-0.12, 0.0, 0.13):
            ph = (seg_t * f * (1 + det / 100 * 10)) % 1.0
            pad[i0:i1] += (2 * ph - 1) * 0.05
pad = lp(pad, 0.06)
pad *= np.clip(tt / 1.2, 0, 1)  # fade in

# sidechain envelope from kicks
side = np.ones(N)
kick_times = [3.0 + k * BEAT for k in range(int((24.0 - 3.0) / BEAT))] + [26.0 + k * BEAT for k in range(int((29.5 - 26.0) / BEAT))]
for kt in kick_times:
    i = at(kt); n = int(SR * 0.4); j = min(N, i + n)
    d = 1 - 0.75 * np.exp(-np.arange(j - i) / SR / 0.12)
    side[i:j] = np.minimum(side[i:j], d)

# --- bass: 8th-note pumping saw on chord root, low ---
bass = np.zeros(N)
for k in range(int((24.0 - 3.0) / 0.25)):
    t0 = 3.0 + k * 0.25
    root = chord_at(t0)[0] / 4
    n = int(SR * 0.23); t = np.arange(n) / SR
    ph = (t * root) % 1.0
    note = ((2 * ph - 1) * 0.6 + np.sin(2 * np.pi * root * t) * 0.8) * np.exp(-t / 0.18)
    i = at(t0); bass[i:i + n] += note[:max(0, min(n, N - i))]
for k in range(int((29.5 - 26.0) / 0.5)):
    t0 = 26.0 + k * 0.5; root = chord_at(t0)[0] / 4
    n = int(SR * 0.48); t = np.arange(n) / SR
    note = np.sin(2 * np.pi * root * t) * np.exp(-t / 0.4)
    i = at(t0); bass[i:i + n] += note[:max(0, min(n, N - i))]
bass = lp(bass, 0.08) * 0.55

L += pad * side * 0.9; R += pad * side * 0.9
L += bass * side; R += bass * side

# --- drums ---
for kt in kick_times: add(kick(), kt, 0.9)
for k in range(int((24.0 - 5.0) / 1.0)): add(clap(), 5.5 + k * 1.0, 0.45)
for k in range(int((24.0 - 3.0) / BEAT)): add(hat(), 3.25 + k * BEAT, 0.5, pan=0.3)
for k in range(int((24.0 - 7.0) / 0.25)):
    t0 = 7.0 + k * 0.25
    if abs((t0 - 3.0) % 0.5) > 1e-6: continue
for k in range(int((29.5 - 26.0) / BEAT)): add(hat(open_=True), 26.25 + k * BEAT, 0.35, pan=-0.3)

# typing clicks
for k in range(32): add(tick(), 0.1 + k / 28 + rng.uniform(-.004, .004), 0.6, pan=rng.uniform(-.4, .4))

# slams / impacts
for st in [1.5, 2.0, 2.5]: add(boom(0.7), st, 0.8); add(kick(), st, 0.7)
for st in [5.5, 17.5, 21.0]: add(boom(0.8), st, 0.55)
for st in [24.0, 24.5, 25.0]: add(boom(0.7), st, 0.85); add(kick(), st, 0.7)
add(boom(0.7), 25.5, 0.6)
add(riser(1.0), 25.0, 0.55)
add(boom(1.4), 26.0, 1.1); add(kick(big=True), 26.0, 1.0)
add(stamp_thud(), 11.5 + 1.45, 0.9); add(stamp_thud(), 26.0 + 1.5, 0.9)

# whooshes into each transit and out
for tr in [3.0, 5.0, 8.0, 11.0, 14.0, 17.0, 20.0]:
    add(whoosh(0.7, 0.6), tr - 0.42, 0.5, pan=-0.2)
add(whoosh(0.9, 0.7), 21.0 - 0.63, 0.45, pan=0.2)

# master: fade out, soft clip, normalise
fade = np.clip((DUR - tt) / 0.6, 0, 1)
L *= fade; R *= fade
m = max(np.abs(L).max(), np.abs(R).max())
L = np.tanh(L / m * 1.3) / np.tanh(1.3); R = np.tanh(R / m * 1.3) / np.tanh(1.3)
out = (np.stack([L, R], 1) * 0.89 * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok', out.shape)
