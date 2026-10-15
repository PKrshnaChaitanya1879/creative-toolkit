// ---------- shared painting helpers (Ghibli-ish painted look in canvas 2D) ----------
const W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, d) => clamp((t - a) / d);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;       // in-out cubic
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeIn = x => x * x * x;
const smooth = x => x * x * (3 - 2 * x);
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// hex <-> rgb mixing
function hx(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mix(a, b, t) { const A = typeof a === 'string' ? hx(a) : a, B = typeof b === 'string' ? hx(b) : b; return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
function rgba(h, a) { const c = hx(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

// ---- tileable value noise (fbm) -> grey texture canvas, used as paper / brush grain
function noiseTex(size, cells, oct, seed) {
  const r = rng(seed), c = mk(size, size), x = c.getContext('2d'), id = x.createImageData(size, size), d = id.data;
  const grids = []; for (let o = 0; o < oct; o++) { const n = cells << o, g = new Float32Array(n * n); for (let i = 0; i < n * n; i++) g[i] = r(); grids.push([n, g]); }
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    let v = 0, amp = 1, tot = 0;
    for (const [n, g] of grids) {
      const fx = px / size * n, fy = py / size * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = smooth(fx - ix), ty = smooth(fy - iy);
      const a = g[(iy % n) * n + ix % n], b = g[(iy % n) * n + (ix + 1) % n], cc = g[((iy + 1) % n) * n + ix % n], dd = g[((iy + 1) % n) * n + (ix + 1) % n];
      v += amp * lerp(lerp(a, b, tx), lerp(cc, dd, tx), ty); tot += amp; amp *= .55;
    }
    const k = (py * size + px) * 4, g8 = Math.round(v / tot * 255); d[k] = d[k + 1] = d[k + 2] = g8; d[k + 3] = 255;
  }
  x.putImageData(id, 0, 0); return c;
}
let TEX = {};
function initTextures() {
  TEX.paper = noiseTex(512, 6, 6, 7);       // soft blotchy paper
  TEX.brush = noiseTex(256, 16, 3, 11);     // fine brush grain
  TEX.wash = noiseTex(512, 3, 5, 23);       // large watercolor blooms
}
// smooth lofi look: soft edges, very light texture (raise these for a rougher painted look)
const STYLE = { edge: .28, tex: .3 };
// overlay grain/blooms inside the current clip
function texture(ctx, x, y, w, h, amt = .18, kind = 'wash', mode = 'multiply') {
  ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = amt * STYLE.tex;
  const p = ctx.createPattern(TEX[kind], 'repeat'); ctx.fillStyle = p;
  ctx.translate((x * 0.37) % 512, (y * 0.29) % 512); ctx.fillRect(x - 600, y - 600, w + 1200, h + 1200); ctx.restore();
}
// painted fill: base colour, vertical gradient option, inner bloom texture, slightly darker edge
function paint(ctx, pathFn, fill, { tex = .16, edge = .22, edgeW = 2.5, edgeCol = null, grain = .08 } = {}) {
  ctx.save(); ctx.beginPath(); pathFn(ctx); ctx.fillStyle = fill; ctx.fill();
  ctx.clip(); const b = 2400; if (tex) texture(ctx, -b, -b, 2 * b, 2 * b, tex, 'wash'); if (grain) texture(ctx, -b, -b, 2 * b, 2 * b, grain, 'brush');
  ctx.restore();
  if (edge) { ctx.save(); ctx.beginPath(); pathFn(ctx); ctx.strokeStyle = edgeCol || 'rgba(40,25,20,1)'; ctx.globalAlpha = edge * STYLE.edge; ctx.lineWidth = edgeW; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }
}
function vgrad(ctx, y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function hgrad(ctx, x0, x1, stops) { const g = ctx.createLinearGradient(x0, 0, x1, 0); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function glow(ctx, x, y, r, col, a = 1, mode = 'lighter') {
  ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}
function ellipse(c, x, y, rx, ry, rot = 0) { c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
function rr(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
// smooth closed blob through points (catmull-rom -> bezier)
function blobPath(c, pts, closed = true) {
  const n = pts.length; c.moveTo(pts[0][0], pts[0][1]);
  const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) c.closePath();
}
// cumulus cloud: stacked lobes, lit top, shaded belly, soft painterly edge
function cloud(ctx, x, y, w, h, r, { lit = '#FFF8EC', mid = '#E9E4E8', shade = '#A9AFC4', alpha = 1, rim = null } = {}) {
  const lobes = []; const n = 7 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) { const u = i / (n - 1); const lx = x + (u - .5) * w * .9 + (r() - .5) * w * .1; const up = Math.sin(u * Math.PI); const rad = h * (.28 + .35 * up) * (.8 + r() * .4); lobes.push([lx, y - up * h * .35 - r() * h * .15, rad]); }
  for (let i = 0; i < 5; i++) lobes.push([x + (r() - .5) * w * .4, y - h * (.45 + r() * .25), h * (.25 + r() * .2)]);
  ctx.save(); ctx.globalAlpha = alpha;
  const c2 = mk(Math.ceil(w * 1.4), Math.ceil(h * 2.2)), q = c2.getContext('2d'), ox = x - w * .7, oy = y - h * 1.6;
  q.translate(-ox, -oy);
  q.fillStyle = vgrad(q, y - h * 1.1, y + h * .3, [[0, lit], [.55, mid], [1, shade]]);
  q.beginPath(); lobes.forEach(([lx, ly, lr]) => { q.moveTo(lx + lr, ly); q.arc(lx, ly, lr, 0, Math.PI * 2); }); q.rect(x - w * .48, y - h * .1, w * .96, h * .3); q.fill();
  // inner lobe shading for volume
  q.globalCompositeOperation = 'source-atop';
  lobes.forEach(([lx, ly, lr]) => { const g = q.createRadialGradient(lx - lr * .3, ly - lr * .45, lr * .05, lx - lr * .2, ly - lr * .3, lr * .9); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(lx - lr * 1.3, ly - lr * 1.4, lr * 2.6, lr * 2.6); });
  q.globalAlpha = .25; q.fillStyle = q.createPattern(TEX.wash, 'repeat'); q.globalCompositeOperation = 'source-atop'; q.fillRect(ox, oy, c2.width, c2.height);
  if (rim) { q.globalAlpha = .9; q.globalCompositeOperation = 'source-atop'; const g = q.createLinearGradient(0, y - h * 1.2, 0, y - h * .5); g.addColorStop(0, rim); g.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = g; q.fillRect(ox, oy, c2.width, c2.height); }
  ctx.drawImage(c2, ox, oy); ctx.restore();
}
// foliage clump: many small overlapping leaves/dabs with light from upper-left
function clump(ctx, x, y, rad, r, { dark = '#1F4A33', mid = '#3E7A45', light = '#8DBA5A', n = 60, dab = .22, lightDir = [-.6, -.8] } = {}) {
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .85;
    const lit = clamp(.5 - ((px - x) * lightDir[0] + (py - y) * lightDir[1]) / rad * -.5 + (r() - .5) * .3);
    ctx.fillStyle = lit > .66 ? light : lit > .38 ? mid : dark; ctx.globalAlpha = .85 + r() * .15;
    const s = rad * dab * (.6 + r() * .7); ctx.beginPath(); ellipse(ctx, px, py, s, s * (.6 + r() * .3), r() * 3); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
