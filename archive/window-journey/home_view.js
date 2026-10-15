// ---------- rain on glass + the quiet rainy-dusk view from the room (before the journey) ----------
let RAIN = {};
function initRain() {
  const r = rng(404);
  RAIN.drops = []; for (let i = 0; i < 420; i++) RAIN.drops.push({ x: r(), y: r(), s: .5 + r() * 1.2, k: r() });          // sitting droplets
  RAIN.runs = []; for (let i = 0; i < 34; i++) RAIN.runs.push({ x: r(), y0: r(), sp: .25 + r() * .5, s: .7 + r() * .8, k: r() }); // rivulets
  RAIN.fall = []; for (let i = 0; i < 260; i++) RAIN.fall.push({ x: r(), y: r(), sp: .8 + r() * .6, l: .03 + r() * .04, a: .2 + r() * .4 }); // falling rain outside
}
// falling rain outside the glass. slant = sideways drift (train motion), amt 0..1
function fallingRain(q, x0, y0, w, h, t, amt, slant = 0, col = '200,215,240') {
  if (amt <= 0) return; q.save(); q.lineCap = 'round';
  RAIN.fall.forEach((d, i) => { if (i / RAIN.fall.length > amt) return;
    const y = ((d.y + t * d.sp * 1.4) % 1) * (h + 200) - 100 + y0, x = ((d.x - slant * t * .9 + 10) % 1) * w + x0, L = d.l * h;
    q.strokeStyle = `rgba(${col},${d.a * .7})`; q.lineWidth = 1.4; q.beginPath(); q.moveTo(x, y); q.lineTo(x - slant * L * 1.6, y + L); q.stroke(); });
  q.restore();
}
// droplets + rivulets on the glass.  wind: 0 = still (run down), 1 = train speed (streak sideways-back)
function glassRain(q, x0, y0, w, h, t, amt, wind = 0, src = null, sun = 0) {
  if (amt <= 0) return; q.save();
  RAIN.drops.forEach((d, i) => { if (i / RAIN.drops.length > amt) return;
    const x = x0 + d.x * w, y = y0 + d.y * h, s = d.s * 4.2;
    q.fillStyle = 'rgba(20,30,50,.22)'; q.beginPath(); ellipse(q, x, y + s * .25, s, s * 1.1); q.fill();
    q.fillStyle = `rgba(230,240,255,${.28 + sun * .3})`; q.beginPath(); ellipse(q, x - s * .3, y - s * .35, s * .4, s * .3); q.fill();
    q.fillStyle = `rgba(255,255,255,${.5 + sun * .4})`; q.beginPath(); q.arc(x - s * .35, y - s * .4, s * .18 + .4, 0, 7); q.fill();
  });
  RAIN.runs.forEach((d, i) => { if (i / RAIN.runs.length > amt) return;
    const life = ((t * d.sp + d.y0) % 1); const dir = [-wind * 1.0, 1 - wind * .55];
    const hx2 = x0 + ((d.x + dir[0] * life * .9 + 5) % 1) * w, hy = y0 + (life * (h + 80)) - 40;
    const tl = 40 + 90 * d.s + wind * 120;
    const g = q.createLinearGradient(hx2, hy, hx2 - dir[0] * tl, hy - dir[1] * tl);
    g.addColorStop(0, `rgba(235,242,255,${.38 + sun * .3})`); g.addColorStop(1, 'rgba(235,242,255,0)');
    q.strokeStyle = g; q.lineWidth = 1.7 * d.s; q.lineCap = 'round'; q.beginPath(); q.moveTo(hx2 - dir[0] * tl, hy - dir[1] * tl); q.lineTo(hx2, hy); q.stroke();
    q.fillStyle = `rgba(245,250,255,${.55 + sun * .3})`; q.beginPath(); q.arc(hx2, hy, 2.2 * d.s, 0, 7); q.fill();
  });
  q.restore();
}
// quiet rainy dusk town (painted once), shown through the room window
function buildHomeView() {
  const w = 600, h = 800, c = mk(w, h), q = c.getContext('2d'), r = rng(77);
  q.fillStyle = vgrad(q, 0, h, [[0, '#2D3A63'], [.55, '#4B5E8C'], [.8, '#7487AE'], [1, '#55658E']]); q.fillRect(0, 0, w, h);
  texture(q, 0, 0, w, h, .25, 'wash', 'multiply');
  for (let i = 0; i < 5; i++) cloud(q, r() * w, 120 + r() * 200, 300 + r() * 200, 90, r, { lit: '#6A79A3', mid: '#55638F', shade: '#3E4A75', alpha: .7 });
  // two rows of soft rooftops with lit windows
  [[540, '#3A4772', .55], [640, '#2B355A', 1]].forEach(([base, col, sc]) => {
    let x = -20; while (x < w + 20) { const bw = (60 + r() * 70) * sc + 20, bh = (60 + r() * 90) * sc;
      q.fillStyle = col; q.beginPath(); q.moveTo(x, base); q.lineTo(x, base - bh); q.lineTo(x + bw / 2, base - bh - 30 * sc); q.lineTo(x + bw, base - bh); q.lineTo(x + bw, base); q.fill();
      for (let k = 0; k < 3; k++) if (r() < .55) { const wx = x + 10 + r() * (bw - 26), wy = base - bh + 14 + r() * (bh - 30); q.fillStyle = '#F6C77A'; q.fillRect(wx, wy, 10 * sc + 4, 13 * sc + 4); glow(q, wx + 6, wy + 7, 30, '#F3B060', .5); }
      x += bw + 4; } q.fillStyle = col; q.fillRect(0, base - 2, w, h - base + 2);
  });
  // tree tops, a street lamp glow
  clump(q, 80, 690, 70, r, { n: 70, dark: '#1C2440', mid: '#26304F', light: '#33405F', dab: .25 });
  clump(q, 520, 700, 80, r, { n: 70, dark: '#1C2440', mid: '#26304F', light: '#33405F', dab: .25 });
  glow(q, 300, 650, 90, '#F5C06C', .7); q.fillStyle = '#FFF0C8'; q.beginPath(); q.arc(300, 650, 5, 0, 7); q.fill();
  // blur it a little: rainy glass softens everything
  const b = mk(w, h), bq = b.getContext('2d'); bq.filter = 'blur(3px)'; bq.drawImage(c, 0, 0); return b;
}
