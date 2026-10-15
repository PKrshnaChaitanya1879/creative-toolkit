"""photofilm.py — photo-film engine (first used for the Hyderabad film, Oct 2026).
Spec = a python module with SIZE, FPS, LETTERBOX, SHOTS, TEXTS, CLOCK, hud_state(t), EXTRA_SFX (see archive/hyderabad-film/spec16.py).
Stills are read from ./cache/<src>.jpg (pre-graded with video/grade_looks.py; run from the project dir or set PHOTOFILM_CACHE_ROOT); clips from ./cache/<src>/*.jpg.
Fonts: Geist/GeistMono/Inter TTFs in $PHOTOFILM_FONTS (auto-converted from the repo's woff2 on first run).
Then: python3 audio/sfx_design.py spec <out>_events.json sfx.wav  (sound design synced to cuts/text).
Photo-film engine: Ken Burns / tilt / split-screen shots, AE-style transitions (whip, zoom-through, glitch,
light leak, dissolve, VHS rewind), kinetic type, cyberpunk HUD, grain. Renders raw RGB to ffmpeg.
Usage: python3 engine.py spec_module out.mp4 [--preview t1,t2,...] [--from t] [--to t]"""
import sys, os, math, json, subprocess, importlib, time
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

HERE = os.environ.get('PHOTOFILM_CACHE_ROOT', os.getcwd())
TK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.environ.get('PHOTOFILM_FONTS', os.path.join(TK, 'fonts', 'ttf'))
def _ensure_fonts():
    if os.path.exists(f'{FONT_DIR}/Geist.ttf'): return
    from fontTools.ttLib import TTFont   # needs: pip install fonttools brotli
    os.makedirs(FONT_DIR, exist_ok=True)
    for src, name in [('e09adcd0ca', 'Geist'), ('b291d87cd7', 'GeistMono'), ('567244088c', 'Inter')]:
        f = TTFont(os.path.join(TK, 'fonts', src + '.woff2')); f.flavor = None; f.save(f'{FONT_DIR}/{name}.ttf')
_fonts = {}
def F(name, size, w):
    k = (name, size, w)
    if k not in _fonts:
        _ensure_fonts(); f = ImageFont.truetype(f'{FONT_DIR}/{name}.ttf', size); f.set_variation_by_axes([w]); _fonts[k] = f
    return _fonts[k]

clip01 = lambda x: max(0.0, min(1.0, x))
def e_out(x): x = clip01(x); return 1 - (1 - x) ** 4          # ~cubic-bezier(.16,1,.3,1)
def e_in(x): x = clip01(x); return x ** 3
def e_io(x): x = clip01(x); return 0.5 - 0.5 * math.cos(math.pi * x)
def drift(x): x = clip01(x); return 0.55 * x + 0.45 * e_io(x)
lerp = lambda a, b, u: a + (b - a) * u

PINK = (255, 61, 139); CYAN = (53, 224, 255); WHITE = (244, 244, 246); DIM = (225, 225, 232)

class Img:
    cache = {}
    @classmethod
    def get(cls, key):
        if key not in cls.cache:
            if len(cls.cache) > 8: cls.cache.pop(next(iter(cls.cache)))
            cls.cache[key] = cv2.imread(f'{HERE}/cache/{key}.jpg')[:, :, ::-1].copy()
        return cls.cache[key]

class Layer:
    """One image (or clip frame list) placed into a rw x rh region with zoom/pan/rotate motion."""
    def __init__(self, frames, rw, rh, m):
        self.rw, self.rh = rw, rh
        self.z = m.get('z', (1.04, 1.12)); self.fx = m.get('fx', (0.5, 0.5)); self.fy = m.get('fy', (0.5, 0.5))
        self.rot = m.get('rot', (0, 0)); self.ease = {'drift': drift, 'io': e_io, 'lin': lambda x: clip01(x), 'out': e_out}[m.get('ease', 'drift')]
        zmax = max(self.z) * 1.0
        ih, iw = frames[0].shape[:2]
        cover = max(rw / iw, rh / ih)
        self.s = cover * zmax; self.zmax = zmax
        size = (max(rw, int(round(iw * self.s))), max(rh, int(round(ih * self.s))))
        self.pre = [cv2.resize(f, size, interpolation=cv2.INTER_AREA) for f in frames]
    def render(self, u, fi=0):
        e = self.ease(u)
        k = lerp(*self.z, e) / self.zmax
        pre = self.pre[min(fi, len(self.pre) - 1)]
        ph, pw = pre.shape[0] * k, pre.shape[1] * k
        ox = (self.rw - pw) * lerp(*self.fx, e); oy = (self.rh - ph) * lerp(*self.fy, e)
        M = np.array([[k, 0, ox], [0, k, oy], [0, 0, 1]], np.float64)
        r = lerp(*self.rot, e)
        if r:
            R = cv2.getRotationMatrix2D((self.rw / 2, self.rh / 2), r, 1.0); M = np.vstack([R, [0, 0, 1]]) @ M
        return cv2.warpAffine(pre, M[:2], (self.rw, self.rh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

class Film:
    def __init__(self, spec):
        self.S = spec; self.W, self.H = spec.SIZE; self.FPS = spec.FPS; self.LB = getattr(spec, 'LETTERBOX', 0)
        self.shots = spec.SHOTS; t = 0.0
        for s in self.shots:
            s['f0'] = int(t * self.FPS + .5); t += s['dur']; s['f1'] = int(t * self.FPS + .5)
            s['t0'] = s['f0'] / self.FPS; s['t1'] = s['f1'] / self.FPS
        self.T = t; self.NF = self.shots[-1]['f1']
        self.texts = spec.TEXTS; self.sfx = []
        self.rng = np.random.default_rng(7)
        H, W = self.H, self.W
        g = np.random.default_rng(3).standard_normal((6, H, W)).astype(np.float32)
        self.grain = [cv2.GaussianBlur(x, (0, 0), 0.65) for x in g]; self.grain = [x / x.std() for x in self.grain]
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 1.414
        self.vig = (1 - 0.30 * np.clip(r, 0, 1) ** 2.2)[..., None]
        # scrim for captions (bottom-left)
        cx, cy = W * 0.18, H * (0.86 if W > H else 0.70)
        d = np.sqrt(((xx - cx) / (W * (0.55 if W > H else 0.95))) ** 2 + ((yy - cy) / (H * (0.32 if W > H else 0.22))) ** 2)
        self.scrim = np.clip(1 - d, 0, 1)[..., None] ** 1.4
        self.hist = []; self.layers = {}
        self.prep_texts()

    # ---------- shots ----------
    def layer(self, si, key, frames_fn, rw, rh, m):
        k = (si, key)
        if k not in self.layers:
            for kk in list(self.layers):
                if kk[0] < si - 1: self.layers.pop(kk)
            self.layers[k] = Layer(frames_fn(), rw, rh, m)
        return self.layers[k]

    def shot_frame(self, si, lt):
        s = self.shots[si]; W, H, LB = self.W, self.H, self.LB
        u = lt / s['dur']
        kind = s['kind']
        if kind == 'black':
            return np.zeros((H, W, 3), np.uint8)
        if kind in ('img', 'clip'):
            if kind == 'img':
                L = self.layer(si, 0, lambda: [Img.get(s['src'])], W, H, s)
                return L.render(u)
            def frames():
                import glob
                fs = sorted(glob.glob(f"{HERE}/cache/{s['src']}/*.jpg"))
                return [cv2.imread(f)[:, :, ::-1].copy() for f in fs[s.get('in', 0):]]
            L = self.layer(si, 0, frames, W, H, s)
            fi = int(lt * self.FPS * s.get('speed', 1.0) * 29.97 / self.FPS)
            return L.render(u, fi)
        if kind == 'split':
            n = len(s['srcs']); gap = s.get('gap', 10)
            if s.get('vertical'):  # stacked panels (for 9:16)
                ph = (H - (n - 1) * gap) // n; out = np.zeros((H, W, 3), np.uint8)
                for j, src in enumerate(s['srcs']):
                    m = dict(z=(1.03, 1.10) if j % 2 == 0 else (1.10, 1.03), fy=(0.5, 0.5), fx=(0.35, 0.65) if j % 2 else (0.65, 0.35))
                    L = self.layer(si, j, lambda src=src: [Img.get(src)], W, ph, m)
                    a = e_out((lt - j * 0.1) / 0.5); dx = int((1 - a) * W * 0.25) * (1 if j % 2 else -1)
                    p = L.render(u); y = j * (ph + gap)
                    pane = np.zeros_like(p);
                    if dx >= 0: pane[:, dx:] = p[:, :W - dx]
                    else: pane[:, :W + dx] = p[:, -dx:]
                    out[y:y + ph] = (pane.astype(np.float32) * a).astype(np.uint8)
                return out
            ih = H - 2 * LB; pw = (W - (n - 1) * gap) // n; out = np.zeros((H, W, 3), np.uint8)
            for j, src in enumerate(s['srcs']):
                m = dict(z=(1.03, 1.10) if j % 2 == 0 else (1.10, 1.03), fx=(0.5, 0.5), fy=(0.42, 0.58) if j % 2 == 0 else (0.58, 0.42))
                L = self.layer(si, j, lambda src=src: [Img.get(src)], pw, ih, m)
                a = e_out((lt - j * 0.12) / 0.55); dy = int((1 - a) * ih * 0.18)
                p = L.render(u); x = j * (pw + gap)
                pane = np.zeros_like(p); pane[dy:] = p[:ih - dy] if dy else p
                out[LB:LB + ih, x:x + pw] = (pane.astype(np.float32) * a).astype(np.uint8)
            if s.get('fill_right'): out[LB:LB + ih, n * (pw + gap) - gap:] = 0
            return out
        if kind == 'rewind':
            if not self.hist: return np.zeros((H, W, 3), np.uint8)
            idx = int((1 - e_io(u)) * (len(self.hist) - 1))
            fr = cv2.resize(self.hist[idx], (W, H), interpolation=cv2.INTER_LINEAR)
            return self.vhs(fr, lt)
        raise ValueError(kind)

    # ---------- effects ----------
    def vhs(self, fr, lt):
        H, W = fr.shape[:2]; rng = self.rng
        f = fr.astype(np.float32)
        g = f.mean(2, keepdims=True); f = f * 0.6 + g * 0.4
        yy = np.arange(H, dtype=np.float32)
        shift = 6 * np.sin(yy * 0.045 + lt * 40) + 3 * np.sin(yy * 0.31 + lt * 90)
        band = (lt * 1.7 % 1.0) * H
        inb = np.exp(-((yy - band) / (H * 0.04)) ** 2)
        shift += inb * rng.uniform(40, 120)
        mx = (np.arange(W, dtype=np.float32)[None, :] + shift[:, None]).astype(np.float32)
        my = np.repeat(yy[:, None], W, 1).astype(np.float32)
        f = cv2.remap(f, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        f[..., 0] = np.roll(f[..., 0], 7, 1); f[..., 2] = np.roll(f[..., 2], -5, 1)
        f += (inb[:, None, None] * rng.uniform(0, 90, (H, 1, 1))).astype(np.float32)
        f[::2] *= 0.82
        f += rng.normal(0, 10, (H // 4, W // 4, 1)).repeat(4, 0).repeat(4, 1).astype(np.float32)
        return np.clip(f, 0, 255).astype(np.uint8)

    def glitch(self, img, amt):
        if amt <= 0.01: return img
        rng = self.rng; H, W = img.shape[:2]; out = img.copy()
        dx = int(4 + amt * 26)
        out[..., 0] = np.roll(img[..., 0], dx, 1); out[..., 2] = np.roll(img[..., 2], -dx, 1)
        for _ in range(int(2 + amt * 12)):
            y0 = int(rng.integers(0, H)); h = int(rng.integers(6, int(20 + amt * 90)))
            out[y0:y0 + h] = np.roll(out[y0:y0 + h], int(rng.choice([-1, 1]) * rng.integers(20, int(40 + amt * 260))), 1)
        cols = [PINK, CYAN, (255, 255, 255)]
        for _ in range(int(amt * 7)):
            w, h = int(rng.integers(40, 340)), int(rng.integers(6, 40)); x, y = int(rng.integers(0, W - w)), int(rng.integers(0, H - h))
            c = np.array(cols[int(rng.integers(0, 3))], np.float32)
            out[y:y + h, x:x + w] = (out[y:y + h, x:x + w] * 0.35 + c * 0.65).astype(np.uint8)
        out[::3] = (out[::3] * (1 - 0.3 * amt)).astype(np.uint8)
        return out

    def whip(self, img, amt, direction):
        if amt <= 0.01: return img
        W = img.shape[1]
        out = np.roll(img, int(direction * amt * W * 0.45), 1)
        k = int(1 + amt * W * 0.16) | 1
        return cv2.blur(out, (k, 1))

    def zoomfx(self, img, scale, blur):
        H, W = img.shape[:2]; acc = np.zeros((H, W, 3), np.float32); n = 4 if blur > 0.02 else 1
        for i in range(n):
            s = scale * (1 + blur * 0.06 * i)
            M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, s)
            acc += cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        return (acc / n).astype(np.uint8)

    def leak(self, f, amt, t):
        if amt <= 0.01: return f
        H, W = f.shape[:2]
        if not hasattr(self, '_leak'):
            yy, xx = np.mgrid[0:H // 4, 0:W // 4].astype(np.float32); self._lk = (yy, xx)
        yy, xx = self._lk; h4, w4 = yy.shape
        cx = (0.2 + 0.6 * ((t * 0.7) % 1)) * w4
        b1 = np.exp(-(((xx - cx) / (w4 * 0.35)) ** 2 + ((yy - h4 * 0.3) / (h4 * 0.6)) ** 2))
        b2 = np.exp(-(((xx - (w4 - cx)) / (w4 * 0.25)) ** 2 + ((yy - h4 * 0.8) / (h4 * 0.5)) ** 2))
        lk = b1[..., None] * np.array([1.0, 0.55, 0.25], np.float32) + b2[..., None] * np.array([1.0, 0.25, 0.55], np.float32)
        lk = cv2.resize(lk, (W, H))
        return 1 - (1 - f) * (1 - np.clip(lk * amt * 1.1 + amt * 0.25, 0, 1))  # screen

    # ---------- text ----------
    def prep_texts(self):
        for tx in self.texts:
            tx.setdefault('d', 2.0)
            self.sfx.append(dict(t=tx['t'], kind='text_' + tx['kind']))

    def draw_words(self, d, x, y, text, font, t, t0, t1, color, rgbsplit=True, stagger=0.065, rise=26, shadow=None):
        words = text.split(' '); px = x
        alpha_layer = []
        for i, w in enumerate(words):
            pre = ' '.join(words[:i]) + (' ' if i else '')
            wx = x + font.getlength(pre)
            a = e_out((t - t0 - i * stagger) / 0.5)
            q = e_in((t - (t1 - 0.28)) / 0.28)
            al = a * (1 - q)
            if al <= 0.01: continue
            yy = y + (1 - a) * rise + q * 8
            if rgbsplit and a < 0.45:
                k = 1 - a / 0.45; dx = 7 * k
                d.text((wx + dx, yy), w, font=font, fill=PINK + (int(170 * k * al),))
                d.text((wx - dx, yy), w, font=font, fill=CYAN + (int(170 * k * al),))
            d.text((wx, yy), w, font=font, fill=color + (int(255 * al),))

    def text_layer(self, t):
        W, H, LB = self.W, self.H, self.LB; land = W > H
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        scrim = 0.0
        for tx in self.texts:
            t0, t1 = tx['t'], tx['t'] + tx['d']
            if not (t0 - 0.01 <= t <= t1 + 0.05): continue
            k = tx['kind']
            if k == 'caption':
                fs = 64 if land else 66
                f = F('Geist', fs, 720)
                x0 = 112 if land else 84
                lines = tx['main'].split('\n')
                has_aside = bool(tx.get('aside'))
                base = (H - LB - (150 if has_aside else 104)) if land else int(H * 0.71)
                for li, ln in enumerate(lines):
                    y = base - (len(lines) - 1 - li) * int(fs * 1.12) - fs
                    self.draw_words(d, x0, y, ln, f, t, t0 + li * 0.25, t1, WHITE)
                if has_aside:
                    ad = tx.get('aside_delay', 0.85); fa = F('GeistMono', 32 if land else 36, 540)
                    ta = t - t0 - ad
                    if ta > 0:
                        n = int(ta * 34); s = tx['aside'][:n]
                        q = e_in((t - (t1 - 0.25)) / 0.25); al = int(255 * (1 - q))
                        y = base + 22 if land else base + 26
                        col = tx.get('aside_color', PINK) + (al,)
                        sl = s.split('\n'); lh = 44 if land else 48
                        for k2, ln in enumerate(sl): d.text((x0 + 3, y + k2 * lh), ln, font=fa, fill=col)
                        if n < len(tx['aside']) or (int(t * 2) % 2 == 0 and ta < 2.2):
                            cx = x0 + 3 + fa.getlength(sl[-1]) + 4; cy = y + (len(sl) - 1) * lh
                            d.rectangle([cx, cy + 4, cx + 14, cy + (30 if land else 34)], fill=col)
                scrim = max(scrim, e_out((t - t0) / 0.4) * (1 - e_in((t - (t1 - 0.3)) / 0.3)))
            elif k == 'aside_only':
                fa = F('GeistMono', 32 if land else 36, 540); ta = t - t0
                n = int(ta * 34); s = tx['text'][:n]; q = e_in((t - (t1 - 0.25)) / 0.25); al = int(255 * (1 - q))
                x0 = 112 if land else 84; y = tx.get('y', (H - LB - 128) if land else int(H * 0.71) + 26)
                for k2, ln in enumerate(s.split('\n')): d.text((x0 + 3, y + k2 * (44 if land else 48)), ln, font=fa, fill=tx.get('color', PINK) + (al,))
                scrim = max(scrim, 0.7 * (1 - q))
            elif k == 'chapter':
                fn = F('GeistMono', 26 if land else 30, 520); ft = F('Geist', 124 if land else 128, 800)
                x0 = 112 if land else 84; y0 = int(H * 0.38) if land else int(H * 0.40)
                a = e_out((t - t0) / 0.4); q = e_in((t - (t1 - 0.3)) / 0.3); al = a * (1 - q)
                n = int((t - t0) * 30); d.text((x0 + 4, y0), tx['num'][:n], font=fn, fill=CYAN + (int(255 * al),))
                lw = int(e_out((t - t0 - 0.1) / 0.6) * (360 if land else 300))
                d.rectangle([x0 + 4, y0 + 46, x0 + 4 + lw, y0 + 48], fill=CYAN + (int(200 * al),))
                self.draw_words(d, x0, y0 + 56, tx['title'], ft, t, t0 + 0.15, t1, WHITE, stagger=0.08, rise=40)
                scrim = max(scrim, al)
            elif k == 'title':
                sz = 210 if land else 170; ft = F('Geist', sz, 800); text = tx['text']
                while ft.getlength(text) > W * 0.86: sz -= 6; ft = F('Geist', sz, 800)
                tw = ft.getlength(text); x = (W - tw) / 2; y = H * 0.36 if land else H * 0.40
                a = e_out((t - t0) / 0.3); q = e_in((t - (t1 - 0.35)) / 0.35); al = int(255 * a * (1 - q))
                gl = clip01(1 - (t - t0) / 0.35)
                if gl > 0:
                    dx = 18 * gl
                    d.text((x + dx, y), text, font=ft, fill=PINK + (int(al * 0.8),)); d.text((x - dx, y), text, font=ft, fill=CYAN + (int(al * 0.8),))
                d.text((x, y), text, font=ft, fill=WHITE + (al,))
                if tx.get('sub'):
                    fs = F('Geist', 46 if land else 48, 560); sw = fs.getlength(tx['sub'])
                    self.draw_words(d, (W - sw) / 2, y + (250 if land else 210), tx['sub'], fs, t, t0 + 0.6, t1, WHITE)
                if tx.get('aside'):
                    fa = F('GeistMono', 30 if land else 32, 520); ta = t - t0 - 1.7
                    if ta > 0:
                        s = tx['aside'][:int(ta * 30)]; full = fa.getlength(tx['aside'])
                        d.text(((W - full) / 2, y + (330 if land else 290)), s, font=fa, fill=PINK + (al,))
                scrim = max(scrim, 0)
            elif k == 'boot':
                fb = F('GeistMono', 32 if land else 34, 500); x0 = 112 if land else 84; y0 = H * 0.42
                tt = t - t0; acc = 0
                for i, ln in enumerate(tx['lines']):
                    st = i * tx.get('gap', 0.55); n = int((tt - st) * 38)
                    if n <= 0: continue
                    col = CYAN if i == len(tx['lines']) - 1 else DIM
                    q = e_in((t - (t1 - 0.15)) / 0.15)
                    d.text((x0, y0 + i * 52), ln[:n], font=fb, fill=col + (int(255 * (1 - q)),))
            elif k == 'center':
                f = F(tx.get('font', 'GeistMono'), tx.get('size', 64), tx.get('w', 600))
                gl = clip01(1 - (t - t0) / 0.4); flick = (self.rng.random() > 0.35) if gl > 0 else True
                q = e_in((t - (t1 - 0.2)) / 0.2); al = int(255 * (1 - q)) if flick else 0
                tw = f.getlength(tx['text']); x = (W - tw) / 2; y = tx.get('y', H * 0.45)
                if gl > 0:
                    d.text((x + 12 * gl, y), tx['text'], font=f, fill=PINK + (al,)); d.text((x - 12 * gl, y), tx['text'], font=f, fill=CYAN + (al,))
                d.text((x, y), tx['text'], font=f, fill=tx.get('color', WHITE) + (al,))
            elif k == 'end':
                ft = F('Geist', 150 if land else 140, 800); fm = F('GeistMono', 24 if land else 28, 500); fl = F('Geist', 40 if land else 44, 520)
                a = e_out((t - t0) / 0.8); al = int(255 * a)
                y = H * 0.33 if land else H * 0.36
                tw = ft.getlength(tx['title']); d.text(((W - tw) / 2, y), tx['title'], font=ft, fill=WHITE + (al,))
                s = tx['credit']; sw = fm.getlength(s)
                d.text(((W - sw) / 2, y + (190 if land else 180)), s, font=fm, fill=CYAN + (int(255 * e_out((t - t0 - 0.6) / 0.6)),))
                lines = tx['line'].split('\n')
                for li, ln in enumerate(lines):
                    lw = fl.getlength(ln)
                    self.draw_words(d, (W - lw) / 2, y + (270 if land else 270) + li * 58, ln, fl, t, t0 + 1.3 + li * 0.3, t1 + 5, WHITE)
        return im, scrim

    # ---------- HUD ----------
    def clock(self, t):
        ks = self.S.CLOCK
        for (ta, ca), (tb, cb) in zip(ks[:-1], ks[1:]):
            if ta <= t <= tb:
                c = lerp(ca, cb, (t - ta) / (tb - ta + 1e-9)); break
        else: c = ks[-1][1] if t > ks[-1][0] else ks[0][1]
        c = int(c) % 86400
        return f'{c // 3600:02d}:{c % 3600 // 60:02d}:{c % 60:02d}'

    def hud(self, d, t, f):
        if not getattr(self.S, 'HUD', True): return
        W, H, LB = self.W, self.H, self.LB; land = W > H
        fm = F('GeistMono', 19 if land else 26, 520)
        hs = self.S.hud_state(t) if hasattr(self.S, 'hud_state') else {}
        if hs.get('off'): return
        a = int(255 * hs.get('alpha', 1.0))
        if land:
            yt = (LB - 19) // 2 - 2; yb = H - LB + (LB - 19) // 2 - 2; xl, xr = 40, W - 40
        else:
            yt = 132; yb = 132 + 40; xl, xr = 56, W - 56
        rec_on = (int(t * 1.6) % 2 == 0)
        if rec_on: d.ellipse([xl, yt + 4, xl + 14, yt + 18], fill=PINK + (a,))
        lab = 'REC' + ('   ' + hs['chapter'] if hs.get('chapter') else '')
        d.text((xl + 24, yt), lab, font=fm, fill=DIM + (int(a * 0.85),))
        cnt = hs.get('counter', 'HUMANS DETECTED: 0'); col = hs.get('counter_color', CYAN)
        cw = fm.getlength(cnt); d.text((xr - cw, yt), cnt, font=fm, fill=col + (a,))
        tc = self.clock(t)
        d.text((xl, yb), tc, font=fm, fill=DIM + (int(a * 0.85),))
        if land:
            r = '17.3850°N  78.4867°E   ·   FUJIFILM X-M5'; d.text((xr - fm.getlength(r), yb), r, font=fm, fill=DIM + (int(a * 0.6),))
        else:
            r = '17.385°N 78.487°E'; d.text((xr - fm.getlength(r), yb), r, font=fm, fill=DIM + (int(a * 0.6),))
        if hs.get('rew'):
            x, y = (xl, LB + 30) if land else (xl, yb + 60)
            for o in (0, 22): d.polygon([(x + o + 20, y), (x + o + 20, y + 26), (x + o, y + 13)], fill=WHITE + (230,))
            d.text((x + 56, y - 2), 'REW', font=F('GeistMono', 28, 600), fill=WHITE + (230,))

    # ---------- frame ----------
    def frame(self, fidx):
        t = fidx / self.FPS
        si = next(i for i, s in enumerate(self.shots) if s['f0'] <= fidx < s['f1'])
        s = self.shots[si]; lt = t - s['t0']
        img = self.shot_frame(si, lt)
        nxt = self.shots[si + 1] if si + 1 < len(self.shots) else None
        # dissolve into next
        if nxt and nxt.get('tin', ('cut',))[0] == 'dissolve':
            D = nxt['tin'][1]
            if t > s['t1'] - D:
                p = (t - (s['t1'] - D)) / D
                b = self.shot_frame(si + 1, 0.0)
                img = cv2.addWeighted(img, 1 - e_io(p), b, e_io(p), 0)
        # outgoing fx
        if nxt:
            T, D = (nxt.get('tin', ('cut', 0)) + (0,))[:2]
            if D and t > s['t1'] - D / 2:
                p = (t - (s['t1'] - D / 2)) / (D / 2)
                if T == 'whip': img = self.whip(img, e_in(p), -nxt.get('dir', 1))
                elif T == 'zoom': img = self.zoomfx(img, 1 + e_in(p) * 0.6, e_in(p))
                elif T in ('glitch', 'night'): img = self.glitch(img, e_in(p))
        T, D = (s.get('tin', ('cut', 0)) + (0,))[:2]
        if D and lt < D / 2:
            p = lt / (D / 2)
            if T == 'whip': img = self.whip(img, 1 - e_out(p), s.get('dir', 1))
            elif T == 'zoom': img = self.zoomfx(img, 1 + (1 - e_out(p)) * 0.35, 1 - e_out(p))
            elif T in ('glitch', 'night'): img = self.glitch(img, 1 - e_out(p))
        if s.get('glitch_hold'):
            for (a, b) in s['glitch_hold']:
                if a <= lt <= b: img = self.glitch(img, 0.6)
        f = img.astype(np.float32) / 255.0
        # light leak flash
        for ss in (s, nxt):
            if ss and ss.get('tin', ('cut',))[0] == 'flash':
                D = ss['tin'][1]; dt = t - ss['t0']
                if abs(dt) < D / 2: f = self.leak(f, 1 - abs(dt) / (D / 2), t)
        if s.get('leak'):
            f = self.leak(f, s['leak'] * (0.6 + 0.4 * math.sin(t * 2.1)), t)
        f *= self.vig
        tl, scrim = self.text_layer(t)
        if scrim > 0: f *= (1 - 0.55 * scrim * self.scrim)
        if s.get('dim'): f *= (1 - s['dim'])
        # composite text with soft shadow
        ta = np.asarray(tl, dtype=np.float32) / 255.0
        a = ta[..., 3:4]
        if a.max() > 0:
            sh = cv2.resize(cv2.GaussianBlur(cv2.resize(a[..., 0], (self.W // 4, self.H // 4), interpolation=cv2.INTER_AREA), (0, 0), 3), (self.W, self.H))[..., None]
            f *= (1 - 0.45 * sh)
            f = f * (1 - a) + ta[..., :3] * a
        # grain (mid-weighted)
        L = f.mean(2, keepdims=True)
        gp = self.grain[fidx % 6]; ox, oy = int(self.rng.integers(0, 64)), int(self.rng.integers(0, 64))
        gp = np.roll(gp, (oy, ox), (0, 1))
        f += gp[..., None] * (0.010 + 0.016 * 4 * L * (1 - L))
        f = np.clip(f, 0, 1)
        if s.get('hist'): self.hist.append(cv2.resize((f * 255).astype(np.uint8), (self.W // 2, self.H // 2), interpolation=cv2.INTER_AREA))
        out = (f * 255 + 0.5).astype(np.uint8)
        if self.LB: out[:self.LB] = 0; out[-self.LB:] = 0
        hudim = Image.new('RGBA', (self.W, self.H), (0, 0, 0, 0)); self.hud(ImageDraw.Draw(hudim), t, fidx)
        ha = np.asarray(hudim, dtype=np.float32) / 255.0
        if ha[..., 3].max() > 0:
            hf = out.astype(np.float32) / 255; al = ha[..., 3:4]; hf = hf * (1 - al) + ha[..., :3] * al
            out = (hf * 255 + .5).astype(np.uint8)
        fade = getattr(self.S, 'FADE_OUT', 0)
        if fade and t > self.T - fade: out = (out * (1 - e_io((t - (self.T - fade)) / fade))).astype(np.uint8)
        return out

    def run(self, out, f0=0, f1=None):
        f1 = f1 or self.NF
        # warm history frames needed by rewind if starting late
        cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{self.W}x{self.H}', '-r', str(self.FPS), '-i', '-',
               '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-tune', 'grain', out]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE); t0 = time.time()
        for i in range(f0, f1):
            p.stdin.write(self.frame(i).tobytes())
            if i % 150 == 0: print(f'{i}/{f1} {time.time() - t0:.0f}s', flush=True)
        p.stdin.close(); p.wait()
        self.dump_events(out)

    def dump_events(self, out):
        ev = []
        for i, s in enumerate(self.shots):
            ev.append(dict(t=s['t0'], kind='cut', tin=s.get('tin', ('cut', 0))[0], shot=s.get('src', s['kind'])))
            if s['kind'] == 'rewind': ev.append(dict(t=s['t0'], kind='rewind', d=s['dur']))
        for tx in self.texts:
            ev.append(dict(t=tx['t'], kind='text', type=tx['kind'], d=tx['d'],
                           words=len((tx.get('main') or tx.get('title') or tx.get('text') or '').split()),
                           aside=tx.get('aside') or (tx.get('text') if tx['kind'] == 'aside_only' else None), aside_delay=tx.get('aside_delay', 0.85),
                           lines=tx.get('lines')))
        ev += getattr(self.S, 'EXTRA_SFX', [])
        json.dump(dict(T=self.T, events=sorted(ev, key=lambda e: e['t'])), open(out.rsplit('.', 1)[0] + '_events.json', 'w'), indent=1)

if __name__ == '__main__':
    spec = importlib.import_module(sys.argv[1]); out = sys.argv[2]  # run from the project dir (spec module + cache/)
    film = Film(spec)
    print(f'duration {film.T:.2f}s  frames {film.NF}')
    if '--preview' in sys.argv:
        ts = [float(x) for x in sys.argv[sys.argv.index('--preview') + 1].split(',')]
        os.makedirs(out, exist_ok=True)
        need_hist = any(film.shots[next(i for i, s in enumerate(film.shots) if s['f0'] <= int(t * film.FPS) < s['f1'])]['kind'] == 'rewind' for t in ts)
        if need_hist:
            for i in range(film.NF):
                s = next(s for s in film.shots if s['f0'] <= i < s['f1'])
                if s['kind'] == 'rewind': break
                if s.get('hist'): film.frame(i)
        for t in ts:
            fr = film.frame(int(t * film.FPS)); cv2.imwrite(f'{out}/p_{t:07.2f}.jpg', fr[:, :, ::-1], [cv2.IMWRITE_JPEG_QUALITY, 90])
        print('previews', len(ts))
    else:
        f0 = int(float(sys.argv[sys.argv.index('--from') + 1]) * film.FPS) if '--from' in sys.argv else 0
        f1 = int(float(sys.argv[sys.argv.index('--to') + 1]) * film.FPS) if '--to' in sys.argv else None
        film.run(out, f0, f1)
