"""Cinematic -> cyberpunk grade for GUM's Hyderabad film.
Modes: day (teal/orange cinematic), warm (interiors, partial WB), golden (sunset), night (cyberpunk), bw (neon duotone).
grade_image(path, mode, ev=0) -> float32 RGB [0,1];  export_cube(mode, path) writes a Resolve-ready .cube of the pointwise look."""
import numpy as np, cv2

def srgb2lin(x): return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)
def lin2srgb(x): x = np.clip(x, 0, None); return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)
def luma(c): return c[..., 0] * 0.2126 + c[..., 1] * 0.7152 + c[..., 2] * 0.0722

def rgb2hsv(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    mx = c.max(-1); mn = c.min(-1); d = mx - mn + 1e-8
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6.0
    s = np.where(mx > 1e-6, (mx - mn) / (mx + 1e-8), 0)
    return h % 1.0, s, mx
def hsv2rgb(h, s, v):
    i = np.floor(h * 6) % 6; f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.stack([np.choose(i.astype(int), [v, q, p, p, t, v]), np.choose(i.astype(int), [t, v, v, q, p, p]),
                    np.choose(i.astype(int), [p, p, t, v, v, q])], -1)
    return out

def scurve(x, k=5.0, p=0.42):
    sig = lambda z: 1 / (1 + np.exp(-z))
    a, b = sig(-k * p), sig(k * (1 - p))
    return (sig(k * (x - p)) - a) / (b - a)

def hue_bump(h, center, width):
    d = (h - center + 0.5) % 1.0 - 0.5
    return np.exp(-(d / width) ** 2)

LOOKS = {
    # tone: k (contrast), black lift, white;  split: shadow tint, highlight tint;  hue shifts (center, width, shift); sat
    'day':    dict(k=5.0, black=0.035, white=0.965, sh=(-0.034, 0.012, 0.045), hl=(0.030, 0.010, -0.028),
                   hues=[(0.31, 0.07, 0.055), (0.16, 0.05, -0.018), (0.58, 0.07, -0.025)], sat=0.90, satboost=0.0),
    'warm':   dict(k=4.8, black=0.035, white=0.965, sh=(-0.035, 0.010, 0.050), hl=(0.035, 0.010, -0.025),
                   hues=[(0.31, 0.07, 0.06), (0.12, 0.05, -0.012)], sat=0.92, satboost=0.0),
    'golden': dict(k=5.0, black=0.035, white=0.97, sh=(-0.035, 0.005, 0.055), hl=(0.050, 0.008, -0.030),
                   hues=[(0.31, 0.07, 0.06), (0.14, 0.05, -0.025)], sat=1.0, satboost=0.10),
    'night':  dict(k=5.4, black=0.038, white=0.97, sh=(-0.030, 0.010, 0.065), hl=(0.040, -0.020, 0.040),
                   hues=[(0.08, 0.045, -0.045), (0.0, 0.035, -0.035), (0.16, 0.05, -0.055), (0.33, 0.09, 0.14), (0.60, 0.07, 0.055)],
                   sat=1.0, satboost=0.30),
}

def look(c, mode):
    """Pointwise creative look (sRGB in, sRGB out). Same function is baked into the .cube."""
    if mode == 'bw':
        L = np.clip(luma(c), 0, 1)[..., None]
        stops = np.array([0.0, 0.18, 0.45, 0.75, 1.0])
        cols = np.array([[0.030, 0.030, 0.060], [0.07, 0.07, 0.17], [0.31, 0.22, 0.42], [0.62, 0.71, 0.80], [0.95, 0.97, 1.0]])
        Ls = scurve(L[..., 0], 4.6, 0.42)
        out = np.stack([np.interp(Ls, stops, cols[:, j]) for j in range(3)], -1)
        return np.clip(out, 0, 1)
    P = LOOKS[mode]
    c = np.clip(c, 0, 1)
    # tone curve per channel
    c = P['black'] + (P['white'] - P['black']) * scurve(c, P['k'])
    L = luma(c)[..., None]
    ws, wh = (1 - L) ** 2.2, L ** 2.0
    c = c + ws * np.array(P['sh']) * 1.6 + wh * np.array(P['hl']) * 1.6
    c = np.clip(c, 0, 1)
    h, s, v = rgb2hsv(c)
    for (cen, wid, sh) in P['hues']:
        h = (h + sh * hue_bump(h, cen, wid) * np.clip(s * 3, 0, 1)) % 1.0
    s = s * P['sat']
    if P['satboost']:
        s = np.clip(s * (1 + P['satboost'] * np.clip((s - 0.15) * 3, 0, 1)) - 0.04 * (1 - np.clip(s * 4, 0, 1)), 0, 1)
    c = hsv2rgb(h, np.clip(s, 0, 1), v)
    return np.clip(c, 0, 1)

def normalize(c, mode, ev=0.0, wb=None, fixed_gain=None):
    lin = srgb2lin(c)
    L = luma(lin)
    if mode == 'bw':
        lo, hi = np.percentile(L, 1.5), np.percentile(L, 99.3)
        lin = np.clip((lin - lo) / (hi - lo + 1e-6), 0, None) * 0.62
    else:
        wbs = {'day': 0.45, 'warm': 0.30, 'golden': 0.0, 'night': 0.0}[mode] if wb is None else wb
        if wbs:
            m = (L > np.percentile(L, 20)) & (L < np.percentile(L, 95))
            means = lin[m].mean(0); g = means.mean() / (means + 1e-6)
            lin = lin * (1 + wbs * (g - 1))
            L = luma(lin)
        if mode == 'night':
            p = np.percentile(L, 99.5); gain = np.clip(0.75 / (p + 1e-6), 0.6, 2.2)
        elif mode == 'golden':
            p = np.percentile(L, 99.0); gain = np.clip(0.80 / (p + 1e-6), 0.45, 1.5)
        else:
            med = np.median(L); tgt = {'day': 0.125, 'warm': 0.10}[mode]
            gain = np.clip(tgt / (med + 1e-6), 0.5, 2.5)
        if fixed_gain is not None: gain = fixed_gain
        normalize.last_gain = gain
        lin = lin * gain
    lin = lin * (2.0 ** ev)
    # soft shoulder so highlights roll instead of clip
    lin = lin / (1 + np.clip(lin - 0.55, 0, None) * 1.3)
    return np.clip(lin2srgb(lin), 0, 1)

def halation(c, mode, strength=None):
    if mode not in ('night', 'golden', 'bw'): return c
    s = {'night': 0.42, 'golden': 0.28, 'bw': 0.22}[mode] if strength is None else strength
    L = luma(c)
    m = np.clip((L - 0.68) / 0.3, 0, 1)[..., None] * c
    k = max(3, int(c.shape[1] * 0.012) | 1)
    b1 = cv2.GaussianBlur(m, (0, 0), k * 0.5); b2 = cv2.GaussianBlur(m, (0, 0), k * 2.0)
    tint = np.array({'night': (1.0, 0.30, 0.55), 'golden': (1.0, 0.45, 0.25), 'bw': (0.6, 0.85, 1.0)}[mode])
    glow = (b1 * 0.5 + b2 * 0.8) * tint
    return np.clip(c + glow * s, 0, 1)

def grade_array(c, mode, ev=0.0, wb=None, fixed_gain=None):
    c = normalize(c, mode, ev, wb, fixed_gain)
    c = look(c, mode)
    c = halation(c, mode)
    return c.astype(np.float32)

def load(path, long_side=3000):
    im = cv2.imread(path, cv2.IMREAD_COLOR)[:, :, ::-1]
    h, w = im.shape[:2]; sc = long_side / max(h, w)
    if sc < 1: im = cv2.resize(im, (int(w * sc + .5), int(h * sc + .5)), interpolation=cv2.INTER_AREA)
    return im.astype(np.float32) / 255.0

def grade_image(path, mode, ev=0.0, wb=None, long_side=3000):
    return grade_array(load(path, long_side), mode, ev, wb)

def export_cube(mode, path, n=33, title=None):
    g = np.linspace(0, 1, n, dtype=np.float32)
    b, gg, r = np.meshgrid(g, g, g, indexing='ij')   # .cube order: R fastest
    rgb = np.stack([r, gg, b], -1).reshape(-1, 3)
    out = look(rgb, mode)
    with open(path, 'w') as f:
        f.write(f'TITLE "{title or mode}"\nLUT_3D_SIZE {n}\nDOMAIN_MIN 0.0 0.0 0.0\nDOMAIN_MAX 1.0 1.0 1.0\n')
        for v in out: f.write(f'{v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n')

if __name__ == '__main__':
    import sys
    src, mode, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    ev = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
    out = grade_image(src, mode, ev)
    cv2.imwrite(dst, (out[:, :, ::-1] * 255 + 0.5).clip(0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
