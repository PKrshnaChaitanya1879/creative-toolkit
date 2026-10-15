"""Sound design from the engine's event list: room tone + SFX synced to cuts/text. No music.
Usage: python3 sound.py spec_module events.json out.wav"""
import sys, json, importlib, numpy as np
from scipy import signal
SR = 48000
rng = np.random.default_rng(11)

def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'high', fs=SR, output='sos'), x)
def env(n, a, r, curve=3.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4) * curve / 3)
    return e
def fade(x, ms=6):
    k = int(SR * ms / 1000); w = np.linspace(0, 1, k)
    if len(x) > 2 * k: x[:k] *= w; x[-k:] *= w[::-1]
    return x
db = lambda d: 10 ** (d / 20)

def whoosh(d=0.4, f0=300, f1=3200, f2=500):
    n = int(d * SR); x = rng.standard_normal(n)
    f, tt, Z = signal.stft(x, SR, nperseg=1024, noverlap=768)
    u = np.clip(tt / d, 0, 1)
    fc = np.where(u < 0.55, f0 + (f1 - f0) * (u / 0.55) ** 2, f1 + (f2 - f1) * ((u - 0.55) / 0.45))
    G = np.exp(-(np.log((f[:, None] + 20) / fc[None, :]) / 0.55) ** 2)
    _, out = signal.istft(Z * G, SR, nperseg=1024, noverlap=768); out = out[:n]
    if len(out) < n: out = np.pad(out, (0, n - len(out)))
    t = np.linspace(0, 1, n); e = np.sin(np.pi * t) ** 1.6
    out = out / (np.abs(out).max() + 1e-9)
    return fade(lp(out, 7000) * e)

def glitch(d=0.18):
    n = int(d * SR); x = np.zeros(n); pos = 0
    while pos < n:
        L = int(rng.uniform(0.008, 0.035) * SR); seg = rng.choice(['sq', 'noise', 'gap', 'crush'])
        tt = np.arange(L) / SR
        if seg == 'sq': s = np.sign(np.sin(2 * np.pi * rng.uniform(300, 2400) * tt)) * 0.5
        elif seg == 'noise': s = rng.standard_normal(L) * 0.6
        elif seg == 'crush': s = np.round(np.sin(2 * np.pi * rng.uniform(80, 400) * tt) * 3) / 3 * 0.6
        else: s = np.zeros(L)
        x[pos:pos + L] = s[:n - pos]; pos += L
    return fade(hp(x, 120) * 0.8)

def tick(level=-34):
    n = int(0.012 * SR); x = hp(rng.standard_normal(n), 3000) * env(n, 0.0005, 0.003)
    return x * db(level)

def boom(d=2.2, f0=70, f1=34, level=-6):
    n = int(d * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 6); ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t * 2.2)
    trans = lp(rng.standard_normal(n), 900) * np.exp(-t * 28) * 0.5
    return fade((sub + trans) * db(level))

def shutter():
    out = np.zeros(int(0.16 * SR))
    for t0, lvl in ((0.0, 1.0), (0.075, 0.7)):
        n = int(0.02 * SR); c = bp(rng.standard_normal(n), 1500, 7000) * env(n, 0.0004, 0.004)
        th = lp(rng.standard_normal(n), 400) * env(n, 0.001, 0.01) * 0.8
        i = int(t0 * SR); out[i:i + n] += (c + th) * lvl
    return out * db(-12)

def blip():
    out = np.zeros(int(0.14 * SR)); t = np.arange(int(0.045 * SR)) / SR
    for i, f in enumerate((1760, 2350)):
        s = np.sin(2 * np.pi * f * t) * env(len(t), 0.002, 0.03); j = int(i * 0.06 * SR); out[j:j + len(t)] += s
    return out * db(-20)

def rewind(d=1.5):
    n = int(d * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    chirp = bp(x, 1200, 6000) * (0.6 + 0.4 * np.sin(2 * np.pi * (14 + 30 * t / d) * t))
    warble = np.sin(2 * np.pi * np.cumsum(500 + 1800 * (t / d) + 300 * np.sin(2 * np.pi * 9 * t)) / SR) * 0.25
    e = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.06)
    out = (chirp * 0.7 + warble) * e
    # clunk at the end (tape stops / play pressed)
    k = int(0.05 * SR); cl = lp(rng.standard_normal(k), 600) * env(k, 0.001, 0.02)
    out[-k:] += cl * 2
    return fade(out * db(-12))

def riser(d=1.8):
    n = int(d * SR); t = np.arange(n) / SR
    nz = hp(rng.standard_normal(n), 800) * (t / d) ** 2.5
    tone = np.sin(2 * np.pi * np.cumsum(180 + 700 * (t / d) ** 2) / SR) * (t / d) ** 2 * 0.3
    return fade((nz * 0.5 + tone) * db(-14))

def shimmer(d=0.7):
    n = int(d * SR); t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 4000) * np.sin(np.pi * t / d) ** 2
    return fade(x * db(-26))

def reverb(x, rt=1.1, mix=0.18):
    n = int(rt * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 6.9 / rt)
    ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
    wet = signal.fftconvolve(x, ir)[:len(x)]
    return x * (1 - mix) + wet * mix

def ambience(T, day_ranges, night_ranges, quiet):
    n = int(T * SR) + SR
    w = rng.standard_normal(n)
    pink = lp(w, 900, 1) * 1.0 + lp(w, 200, 1) * 1.5
    air = hp(rng.standard_normal(n), 2500) * 0.08
    rumble = lp(rng.standard_normal(n), 120, 2) * 2.2
    t = np.arange(n) / SR
    night = np.zeros(n)
    for a, b in night_ranges: night = np.maximum(night, np.clip((t - a) / 1.5, 0, 1) * np.clip((b - t) / 1.5, 0, 1))
    amb = pink * (0.6 + 0.4 * (1 - night)) + air * (1 - night) + rumble * night
    amb *= 1 + 0.15 * np.sin(2 * np.pi * 0.07 * t)
    g = np.ones(n)
    for a, b in quiet: g *= 1 - np.clip((t - a) / 0.05, 0, 1) * np.clip((b - t) / 0.05, 0, 1)
    amb = amb / np.sqrt(np.mean(amb ** 2)) * db(-36) * g
    return amb

def build(spec, ev, out):
    T = ev['T']; n = int((T + 0.5) * SR)
    L = np.zeros(n); R = np.zeros(n)
    def add(x, t, pan=0.0, rev=False):
        if rev: x = reverb(np.concatenate([x, np.zeros(int(0.9 * SR))]))
        i = int(t * SR); j = min(n, i + len(x))
        if i >= n or j <= max(i, 0): return
        x = x[:j - i]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        L[i:j] += x * l * 1.414; R[i:j] += x * r * 1.414
    quiet = []
    for e in ev['events']:
        k = e['kind']; t = e['t']
        if k == 'cut':
            tin = e['tin']
            if tin == 'whip': add(whoosh(0.42) * db(-14), t - 0.21, pan=0.0, rev=True)
            elif tin == 'zoom': add(whoosh(0.45, 200, 2500, 900) * db(-15), t - 0.25, rev=True); add(boom(0.6, 90, 50, -16), t)
            elif tin in ('glitch',): add(glitch(0.16) * db(-20), t - 0.08, pan=rng.uniform(-0.4, 0.4))
            elif tin == 'night': add(glitch(0.3) * db(-17), t - 0.15)
            elif tin == 'flash': add(shimmer(0.8), t - 0.4, rev=True); add(whoosh(0.6, 150, 1200, 300) * db(-22), t - 0.3, rev=True)
            elif tin == 'dissolve': add(shimmer(1.2) * 0.8, t - 0.6, rev=True)
        elif k == 'rewind':
            add(rewind(e['d']), t); quiet.append((t, t + e['d']))
        elif k == 'text':
            ty = e['type']
            if ty == 'boot':
                for li, ln in enumerate(e.get('lines') or []):
                    for c in range(len(ln)): add(tick(-30), t + li * 0.5 + c / 38)
            elif ty == 'chapter':
                add(boom(1.4, 80, 45, -14), t, rev=True); add(tick(-24), t)
                for c in range(5): add(tick(-32), t + c / 30)
            elif ty == 'title':
                add(glitch(0.2) * db(-16), t - 0.02)
            elif ty == 'center':
                add(blip(), t + 0.05)
            elif ty == 'end':
                add(boom(3.0, 60, 32, -12), t, rev=True)
            if ty in ('caption',):
                for w in range(e['words']): add(tick(-38), t + w * 0.065)
            a = e.get('aside')
            if a:
                st = t + (e.get('aside_delay', 0.85) if ty == 'caption' else (1.7 if ty == 'title' else 0))
                for c in range(len(a)):
                    if a[c] != ' ': add(tick(-35), st + c / 34)
        elif k == 'shutter': add(shutter(), t)
        elif k == 'blip': add(blip(), t)
        elif k == 'boom': add(boom(2.4, 72, 33, -8), t, rev=True)
        elif k == 'riser': add(riser(e['d']), t)
    quiet.append((0, 0.25))
    amb = ambience(T, [getattr(spec, 'DAY', (0, 0))], [(0, getattr(spec, 'DAY', (0, 0))[0]), getattr(spec, 'NIGHT', (0, 0))], quiet)
    L += amb[:n]; R += np.roll(amb, 2400)[:n]
    # end: fade out over the final 1.5 s
    fo = int(1.5 * SR); w = np.linspace(1, 0, fo) ** 2
    end = int(T * SR); L[end - fo:end] *= w; R[end - fo:end] *= w; L[end:] = 0; R[end:] = 0
    x = np.stack([L, R], 1)
    x = x / max(1e-9, np.abs(x).max()) * 0.89
    import wave
    with wave.open(out, 'wb') as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((x * 32767).astype(np.int16).tobytes())

if __name__ == '__main__':
    spec = importlib.import_module(sys.argv[1]); ev = json.load(open(sys.argv[2]))
    build(spec, ev, sys.argv[3]); print('wrote', sys.argv[3])
