// ---------- the five worlds outside the train window (window-local space: OW x OH) ----------
const OW = 920, OH = 1440, V = 620, ACC = 2.6;
function S(t) {  // train distance travelled (px at parallax 1.0), smooth start at T.trainGo
  const t0 = T.trainGo; if (t <= t0) return 0; const u = clamp((t - t0) / ACC);
  return V * ACC * (u * u * u - u * u * u * u / 2) + (t > t0 + ACC ? V * (t - t0 - ACC) : 0);
}
const SCN = [];  // filled by initWorlds: { t0, t1, layers:[{c,f,y}], sky, front(q,s,t), weather }
function strip(f, t0, t1, h, fn) {
  const len = Math.ceil(OW + f * (S(t1) - S(t0)) + 80), c = mk(len, h), q = c.getContext('2d'); fn(q, len, h); return { c, f, len };
}
function bands(q, w, y0, y1, cols) { cols.forEach((c, i) => { q.fillStyle = c; q.fillRect(0, lerp(y0, y1, i / cols.length), w, (y1 - y0) / cols.length + 1); }); }
function pine(q, x, y, h, col, snow = null, r = Math.random) {
  const tiers = 5; q.fillStyle = col;
  for (let i = 0; i < tiers; i++) { const u = i / tiers, ty = y - h + u * h * .85, w = h * (.12 + u * .26); q.beginPath(); q.moveTo(x, ty - h * .05); q.lineTo(x + w, ty + h * .2); q.lineTo(x - w, ty + h * .2); q.closePath(); q.fill();
    if (snow) { q.fillStyle = snow; q.beginPath(); q.moveTo(x, ty - h * .05); q.lineTo(x + w * .55, ty + h * .09); q.quadraticCurveTo(x, ty + h * .06 + r() * 4, x - w * .7, ty + h * .1); q.closePath(); q.fill(); q.fillStyle = col; } }
  q.fillRect(x - h * .025, y - h * .1, h * .05, h * .1);
}
function litWindows(q, x, y, w, h, r, { cols = 4, rows = 6, warm = '#F6C77A', on = .55, dark = 'rgba(20,20,40,.55)' } = {}) {
  const gw = w / cols, gh = h / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const wx = x + i * gw + gw * .22, wy = y + j * gh + gh * .2, ww = gw * .56, wh = gh * .55;
    if (r() < on) { q.fillStyle = warm; q.fillRect(wx, wy, ww, wh); q.fillStyle = 'rgba(255,240,200,.5)'; q.fillRect(wx, wy, ww, wh * .3); } else { q.fillStyle = dark; q.fillRect(wx, wy, ww, wh); } }
}

// ---------------- 1. rainy New York at night ----------------
function buildNYC(t0, t1) {
  const r = rng(101), sc = { t0, t1, layers: [], haze: '#7A4E9A' };
  sc.sky = mk(OW, OH); { const q = sc.sky.getContext('2d');
    q.fillStyle = vgrad(q, 0, OH, [[0, '#15183A'], [.35, '#2C2A5E'], [.62, '#6B4378'], [.75, '#C2707A'], [1, '#3A2848']]); q.fillRect(0, 0, OW, OH); texture(q, 0, 0, OW, OH, .22);
    for (let i = 0; i < 6; i++) cloud(q, r() * OW, 160 + r() * 420, 360 + r() * 260, 110, r, { lit: '#5E5590', mid: '#463F78', shade: '#C77E86', alpha: .75 }); }
  // far skyline (art-deco spires, blue-violet, sparse lights)
  sc.layers.push({ y: 420, ...strip(.06, t0, t1, 1020, (q, w, h) => { let x = 0; while (x < w) { const bw = 50 + r() * 90, bh = 200 + r() * 420; q.fillStyle = mix('#3E3A70', '#4E4680', r());
      q.fillRect(x, h - 340 - bh, bw, bh + 340); if (r() < .35) { q.fillRect(x + bw * .2, h - 340 - bh - 60, bw * .6, 60); q.beginPath(); q.moveTo(x + bw * .4, h - 400 - bh); q.lineTo(x + bw * .5, h - 520 - bh - r() * 80); q.lineTo(x + bw * .6, h - 400 - bh); q.fill(); }
      for (let k = 0; k < bh / 9; k++) if (r() < .5) { q.fillStyle = `rgba(250,200,130,${.25 + r() * .4})`; q.fillRect(x + 4 + r() * (bw - 10), h - 340 - bh + r() * bh, 3, 4); q.fillStyle = mix('#3E3A70', '#4E4680', .5); }
      x += bw + r() * 10; } q.fillStyle = '#433D74'; q.fillRect(0, h - 340, w, 340); }) });
  // mid: brick walk-ups with fire escapes + water towers
  sc.layers.push({ y: 560, ...strip(.3, t0, t1, 880, (q, w, h) => { let x = -20; while (x < w) { const bw = 170 + r() * 110, bh = 380 + r() * 300, top = h - 160 - bh, col = ['#6E3A43', '#58354A', '#7A4A48', '#4A3A5C'][Math.floor(r() * 4)];
      paint(q, c => c.rect(x, top, bw, bh + 160), col, { edge: .35, tex: .2 }); paint(q, c => c.rect(x - 6, top - 14, bw + 12, 16), mix(col, '#000000', .3), { edge: 0 });
      litWindows(q, x + 10, top + 20, bw - 20, bh - 30, r, { cols: Math.round(bw / 52), rows: Math.round(bh / 70), on: .45 });
      if (r() < .6) { q.strokeStyle = 'rgba(25,20,35,.9)'; q.lineWidth = 3; const fx = x + bw * .3; for (let y = top + 60; y < top + bh - 40; y += 70) { q.strokeRect(fx, y + 40, bw * .4, 4); q.beginPath(); q.moveTo(fx + 6, y + 44); q.lineTo(fx + bw * .4 - 6, y + 110); q.stroke(); } }
      if (r() < .55) { const tx = x + 30 + r() * (bw - 100); q.strokeStyle = '#2A2030'; q.lineWidth = 4; q.beginPath(); q.moveTo(tx + 8, top - 14); q.lineTo(tx + 14, top - 60); q.moveTo(tx + 52, top - 14); q.lineTo(tx + 46, top - 60); q.stroke();
        paint(q, c => rr(c, tx, top - 130, 60, 76, 6), '#6A4A3E', { edge: .4 }); paint(q, c => { c.moveTo(tx - 4, top - 128); c.lineTo(tx + 30, top - 168); c.lineTo(tx + 64, top - 128); c.closePath(); }, '#3E2C30', { edge: .4 }); }
      x += bw + 4; } }) });
  // near: street level: shopfronts with glowing awnings + wet road
  sc.layers.push({ y: 1080, ...strip(.75, t0, t1, 360, (q, w, h) => {
    q.fillStyle = '#2A2238'; q.fillRect(0, 0, w, 150); let x = 0; const neon = ['#F27BA0', '#6FD3D0', '#F6C26A', '#9C8CF0'];
    while (x < w) { const sw = 160 + r() * 120, nc = neon[Math.floor(r() * 4)]; q.fillStyle = '#F2C27C'; q.fillRect(x + 14, 46, sw - 28, 92); q.fillStyle = 'rgba(80,40,40,.4)'; q.fillRect(x + 14, 46, sw - 28, 18);
      paint(q, c => { c.moveTo(x + 8, 40); c.lineTo(x + sw - 8, 40); c.lineTo(x + sw, 70); c.lineTo(x, 70); c.closePath(); }, nc, { edge: .3 }); glow(q, x + sw / 2, 60, sw * .7, nc, .45); x += sw + 12; }
    q.fillStyle = vgrad(q, 150, h, [[0, '#3A3150'], [1, '#191628']]); q.fillRect(0, 150, w, h - 150);
    // reflections in the wet road
    for (let i = 0; i < w / 14; i++) { const rx = r() * w; q.fillStyle = `rgba(${r() < .5 ? '242,190,120' : '240,130,170'},${.12 + r() * .2})`; q.fillRect(rx, 160, 4 + r() * 10, 60 + r() * 140); }
    q.fillStyle = 'rgba(255,255,255,.25)'; for (let x2 = 0; x2 < w; x2 += 120) q.fillRect(x2, 270, 60, 5);
  }) });
  sc.cabs = []; for (let i = 0; i < 6; i++) sc.cabs.push({ x: r() * 3000, v: 260 + r() * 200, lane: r() < .5 ? 0 : 1 });
  sc.front = (q, s, t, lt) => {
    // yellow cabs on their own motion (headlights glowing)
    sc.cabs.forEach(cb => { const x = ((cb.x - s * .75 - cb.v * lt * (cb.lane ? -1 : 1)) % 3000 + 3000) % 3000 - 400, y = cb.lane ? 1305 : 1350;
      if (x < -200 || x > OW + 200) return; paint(q, c => { c.moveTo(x, y); c.lineTo(x + 30, y - 34); c.lineTo(x + 120, y - 36); c.lineTo(x + 150, y); c.lineTo(x + 160, y + 26); c.lineTo(x - 6, y + 26); c.closePath(); }, '#F2C230', { edge: .4 });
      q.fillStyle = 'rgba(40,50,80,.85)'; q.fillRect(x + 36, y - 28, 34, 22); q.fillRect(x + 76, y - 28, 36, 22); q.fillStyle = '#1A1A22'; q.beginPath(); q.arc(x + 30, y + 26, 13, 0, 7); q.arc(x + 124, y + 26, 13, 0, 7); q.fill();
      glow(q, cb.lane ? x - 6 : x + 160, y + 10, 70, '#FFE9B0', .7); q.fillStyle = 'rgba(255,220,120,.25)'; q.fillRect(x, y + 40, 150, 50); });
    // elevated-track iron columns rushing past (motion blurred)
    const P = 760; for (let k = -1; k < 3; k++) { const x = (((-s * 1.8) % P) + P) % P + k * P - 120; for (let m = 0; m < 4; m++) { q.globalAlpha = m ? .22 : 1; q.fillStyle = '#16121F'; q.fillRect(x + m * 12, 0, 70, OH); } q.globalAlpha = 1; q.fillStyle = 'rgba(120,110,150,.35)'; q.fillRect(x + 8, 0, 4, OH); }
  };
  sc.bokeh = Array.from({ length: 26 }, () => ({ x: r() * 4000, y: 700 + r() * 700, rad: 20 + r() * 50, c: ['#F27BA0', '#6FD3D0', '#F6C26A', '#FFB070'][Math.floor(r() * 4)], f: .9 + r() * .8 }));
  const front0 = sc.front; sc.front = (q, s, t, lt) => { front0(q, s, t, lt); sc.bokeh.forEach(b => { const x = ((b.x - s * b.f) % 4000 + 4000) % 4000 - 300; if (x > -100 && x < OW + 100) glow(q, x, b.y, b.rad, b.c, .35); }); };
  sc.weather = { rain: 1, slantOut: .9, glass: 1, tint: '#7C6AB8', tintA: .25, fallCol: '220,200,240' };
  return sc;
}
// ---------------- 2. misty rainforest ----------------
function buildForest(t0, t1) {
  const r = rng(202), sc = { t0, t1, layers: [], haze: '#E4F2DA' };
  sc.sky = mk(OW, OH); { const q = sc.sky.getContext('2d'); q.fillStyle = vgrad(q, 0, OH, [[0, '#E8F2D6'], [.4, '#BFDDB8'], [1, '#8FBF98']]); q.fillRect(0, 0, OW, OH); texture(q, 0, 0, OW, OH, .2); }
  const layer = (f, y, h, col, trunk, density, rad) => strip(f, t0, t1, h, (q, w) => {
    for (let x = -60; x < w + 60; x += density * (.6 + r() * .8)) { const tx = x, th = h * (.55 + r() * .4); q.fillStyle = trunk; q.fillRect(tx - rad * .08, h - th * .7, rad * .16, th);
      clump(q, tx, h - th * .75, rad * (.8 + r() * .5), r, { n: 50, dark: mix(col, '#0E2A1A', .45), mid: col, light: mix(col, '#E8F5C0', .35), dab: .3 }); }
    q.fillStyle = mix(col, '#0E2A1A', .2); q.fillRect(0, h * .78, w, h * .22); });
  sc.layers.push({ y: 160, ...layer(.05, 0, 1280, '#A9CBA6', '#97B596', 70, 120) });
  sc.layers.push({ y: 300, ...layer(.18, 0, 1140, '#78A784', '#5E8466', 120, 150) });
  sc.layers.push({ y: 420, ...strip(.42, t0, t1, 1020, (q, w, h) => {   // big trunks with vines + ferns
    for (let x = 0; x < w; x += 240 + r() * 200) { const tw = 34 + r() * 50, bend = (r() - .5) * 60, col = ['#3E5E44', '#4A6648', '#55704A'][Math.floor(r() * 3)];
      const path = c => { c.moveTo(x - tw * .4, 0); c.lineTo(x + tw * .4, 0); c.bezierCurveTo(x + tw * .5 + bend, h * .35, x + tw * .55 - bend * .5, h * .7, x + tw * 1.3, h); c.lineTo(x - tw * 1.1, h); c.bezierCurveTo(x - tw * .55 - bend * .5, h * .7, x - tw * .5 + bend, h * .35, x - tw * .4, 0); c.closePath(); };
      paint(q, path, hgrad(q, x - tw, x + tw, [[0, mix(col, '#1E3626', .4)], [.45, col], [1, mix(col, '#B8D69A', .25)]]), { edge: .4, tex: .25 });
      q.save(); q.beginPath(); path(q); q.clip(); q.strokeStyle = 'rgba(30,50,35,.35)'; q.lineWidth = 2; for (let k = 0; k < 6; k++) { const bx = x + (r() - .5) * tw * .6; q.beginPath(); q.moveTo(bx, 0); q.bezierCurveTo(bx + bend, h * .35, bx - bend * .5, h * .7, bx + (r() - .5) * tw, h); q.stroke(); }
      for (let k = 0; k < 5; k++) clump(q, x + (r() - .5) * tw, r() * h * .8, 18 + r() * 14, r, { n: 14, dark: '#4E7A3A', mid: '#6E9A48', light: '#A8C870', dab: .4 }); q.restore();
      for (let v = 0; v < 2; v++) { q.strokeStyle = '#2E5A36'; q.lineWidth = 3; q.beginPath(); const vx = x + (r() - .5) * tw; q.moveTo(vx, 0); for (let y = 0; y < h * .75; y += 40) q.lineTo(vx + Math.sin(y * .03 + v) * 18 + bend * y / h, y); q.stroke(); for (let y = 40; y < h * .75; y += 60) { q.fillStyle = '#4E8A48'; q.beginPath(); ellipse(q, vx + Math.sin(y * .03 + v) * 18 + bend * y / h + 8, y, 10, 6, .6); q.fill(); } } }
    for (let x = 0; x < w; x += 60) clump(q, x, h - 60 - r() * 50, 70 + r() * 40, r, { n: 40, dark: '#24502F', mid: '#3F7A45', light: '#79AE5A', dab: .3 });
  }) });
  sc.layers.push({ y: 0, ...strip(.95, t0, t1, OH, (q, w, h) => {      // giant leaves framing top & bottom
    const big = (x, y, a, s, col) => { q.save(); q.translate(x, y); q.rotate(a); q.scale(s, s);
      paint(q, c => { c.moveTo(0, 0); c.bezierCurveTo(90, -30, 130, -160, 0, -300); c.bezierCurveTo(-130, -160, -90, -30, 0, 0); }, col, { edge: .45, edgeCol: '#0C2214', tex: .2 });
      q.strokeStyle = 'rgba(190,230,150,.5)'; q.lineWidth = 4; q.beginPath(); q.moveTo(0, 0); q.lineTo(0, -290); q.stroke(); for (let i = 1; i < 7; i++) { q.lineWidth = 2; q.beginPath(); q.moveTo(0, -i * 40); q.lineTo(-60, -i * 40 - 30); q.moveTo(0, -i * 40); q.lineTo(60, -i * 40 - 30); q.stroke(); } q.restore(); };
    for (let x = 0; x < w; x += 140 + r() * 160) { big(x, h + 40, (r() - .5) * 1.2, .9 + r() * .6, ['#1F4A2E', '#2C5E36', '#173D26'][Math.floor(r() * 3)]); if (r() < .5) big(x + 60, -40, Math.PI + (r() - .5) * 1, .8 + r() * .6, '#1A4228'); }
  }) });
  sc.front = (q, s, t) => {
    // god rays + drifting mist
    q.save(); q.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const x = 120 + i * 230 - ((s * .05) % 230); q.fillStyle = hgrad(q, x, x + 120, [[0, 'rgba(255,250,210,0)'], [.5, 'rgba(255,250,210,.13)'], [1, 'rgba(255,250,210,0)']]); q.beginPath(); q.moveTo(x, 0); q.lineTo(x + 120, 0); q.lineTo(x + 420, OH); q.lineTo(x + 300, OH); q.fill(); } q.restore();
    for (let i = 0; i < 3; i++) { const y = 500 + i * 300, x = -((s * (.1 + i * .08) + i * 300) % (OW + 800)) + OW + 200; glow(q, x, y, 420, '#EEF6E4', .35, 'source-over'); }
  };
  sc.weather = { rain: .8, slantOut: .7, glass: .9, tint: '#7FC08A', tintA: .22, fallCol: '230,245,230' };
  return sc;
}
// ---------------- 3. farmland in soft rain (telegraph poles + wires) ----------------
function buildFarm(t0, t1) {
  const r = rng(303), sc = { t0, t1, layers: [], haze: '#DDE0E4', hazeA: .45 };
  sc.sky = mk(OW, OH); { const q = sc.sky.getContext('2d'); q.fillStyle = vgrad(q, 0, OH, [[0, '#7F90AA'], [.45, '#B4BFCF'], [.56, '#E9DDBE'], [1, '#C9CDBF']]); q.fillRect(0, 0, OW, OH); texture(q, 0, 0, OW, OH, .2);
    for (let i = 0; i < 7; i++) cloud(q, r() * OW, 160 + r() * 500, 380 + r() * 300, 120, r, { lit: '#D9DCE4', mid: '#B3B9C8', shade: '#8A92A8', alpha: .85 }); }
  sc.layers.push({ y: 700, ...strip(.04, t0, t1, 140, (q, w, h) => { q.fillStyle = '#8197A9'; q.beginPath(); q.moveTo(0, h); for (let x = 0; x <= w; x += 40) q.lineTo(x, 60 + Math.sin(x * .006) * 30 + Math.sin(x * .017) * 14); q.lineTo(w, h); q.fill(); }) });
  sc.layers.push({ y: 780, ...strip(.2, t0, t1, 360, (q, w, h) => {
    const cols = ['#D6B45C', '#86A95C', '#A7894F', '#9BB866', '#E1C26E', '#6E9450']; bands(q, w, 0, h, cols);
    for (let i = 0; i < 6; i++) { const y = i * h / 6; q.strokeStyle = 'rgba(80,60,30,.18)'; q.lineWidth = 1.5; for (let x = 0; x < w; x += 22) { q.beginPath(); q.moveTo(x, y + 4); q.lineTo(x + 30, y + h / 6); q.stroke(); } }
    texture(q, 0, 0, w, h, .2);
    for (let x = 0; x < w; x += 70 + r() * 120) clump(q, x, 30 + r() * 20, 26 + r() * 20, r, { n: 30, dark: '#3C5A36', mid: '#57794A', light: '#86A56A', dab: .32 });
    for (let x = 300; x < w; x += 900 + r() * 500) { // red barn + farmhouse with a lit window + haystacks
      paint(q, c => { c.moveTo(x, 150); c.lineTo(x, 80); c.lineTo(x + 50, 40); c.lineTo(x + 100, 80); c.lineTo(x + 100, 150); c.closePath(); }, '#A8453A', { edge: .4 }); q.strokeStyle = '#F4EAD8'; q.lineWidth = 3; q.strokeRect(x + 34, 100, 32, 50);
      paint(q, c => { c.moveTo(x + 130, 150); c.lineTo(x + 130, 100); c.lineTo(x + 175, 70); c.lineTo(x + 220, 100); c.lineTo(x + 220, 150); c.closePath(); }, '#EEE3CC', { edge: .4 }); paint(q, c => { c.moveTo(x + 124, 104); c.lineTo(x + 175, 64); c.lineTo(x + 226, 104); c.lineTo(x + 220, 108); c.lineTo(x + 175, 74); c.lineTo(x + 130, 108); c.closePath(); }, '#5E4A5A', { edge: .3 });
      q.fillStyle = '#F6C77A'; q.fillRect(x + 150, 112, 18, 18); glow(q, x + 159, 121, 40, '#F6C77A', .5);
      for (let k = 0; k < 3; k++) paint(q, c => ellipse(c, x + 280 + k * 60, 220 + k * 12, 22, 16), '#D9B86A', { edge: .35 });
    }
  }) });
  sc.layers.push({ y: 1080, ...strip(.62, t0, t1, 360, (q, w, h) => {   // grassy embankment, wildflowers, fence
    q.fillStyle = vgrad(q, 0, h, [[0, '#6E9A52'], [1, '#3F6A3A']]); q.beginPath(); q.moveTo(0, h); for (let x = 0; x <= w; x += 30) q.lineTo(x, 40 + Math.sin(x * .01) * 16); q.lineTo(w, h); q.fill(); texture(q, 0, 0, w, h, .25);
    for (let i = 0; i < w / 6; i++) { const x = r() * w, y = 60 + r() * (h - 60); q.strokeStyle = r() < .5 ? '#88B262' : '#4E7E42'; q.lineWidth = 2; q.beginPath(); q.moveTo(x, y); q.lineTo(x + (r() - .5) * 8, y - 18 - r() * 14); q.stroke(); }
    for (let i = 0; i < w / 18; i++) { q.fillStyle = ['#F4EFE2', '#F2D35C', '#E9A0B4'][Math.floor(r() * 3)]; q.beginPath(); q.arc(r() * w, 70 + r() * (h - 80), 3 + r() * 2, 0, 7); q.fill(); }
    for (let x = 0; x < w; x += 110) { q.fillStyle = '#6A5038'; q.fillRect(x, 20, 8, 70); } q.fillRect(0, 40, w, 4); q.fillRect(0, 66, w, 4);
  }) });
  sc.front = (q, s, t) => {   // telegraph poles + sagging wires (the Ghibli train shot)
    const P = 640, xs = []; for (let k = -1; k < 4; k++) xs.push((((-s * 1.5) % P) + P) % P + k * P - 100);
    q.strokeStyle = 'rgba(40,40,50,.75)'; q.lineWidth = 2;
    for (let w = 0; w < 3; w++) { q.beginPath(); for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], b = xs[i + 1], y = 250 + w * 26; q.moveTo(a, y); q.quadraticCurveTo((a + b) / 2, y + 110, b, y); } q.stroke(); }
    xs.forEach(x => { for (let m = 0; m < 4; m++) { q.globalAlpha = m ? .2 : 1; q.fillStyle = '#4A3828'; q.fillRect(x - 13 + m * 10, 200, 26, OH); q.fillRect(x - 80 + m * 10, 236, 160, 12); } q.globalAlpha = 1; q.fillStyle = 'rgba(200,180,150,.35)'; q.fillRect(x - 9, 200, 4, OH); });
  };
  sc.weather = { rain: .7, slantOut: .8, glass: .85, tint: '#C9C3A4', tintA: .18, fallCol: '225,230,240' };
  return sc;
}
// ---------------- 4. snow ----------------
function buildSnow(t0, t1) {
  const r = rng(404), sc = { t0, t1, layers: [], haze: '#DCE4F2', hazeA: .45 };
  sc.sky = mk(OW, OH); { const q = sc.sky.getContext('2d'); q.fillStyle = vgrad(q, 0, OH, [[0, '#33507E'], [.32, '#6E88B5'], [.5, '#C8B4CC'], [.58, '#F0CFC6'], [1, '#D9E2EF']]); q.fillRect(0, 0, OW, OH); texture(q, 0, 0, OW, OH, .18);
    for (let i = 0; i < 4; i++) cloud(q, r() * OW, 160 + r() * 320, 420 + r() * 200, 100, r, { lit: '#E9D7E0', mid: '#B8B4CE', shade: '#7C88AE', alpha: .7 }); }
  sc.layers.push({ y: 380, ...strip(.04, t0, t1, 460, (q, w, h) => {   // snowy mountains, blue shadow sides
    for (let x = -100; x < w; x += 260 + r() * 200) { const pw = 300 + r() * 260, ph = 220 + r() * 200, px = x + pw / 2;
      paint(q, c => { c.moveTo(x, h); c.lineTo(px, h - ph); c.lineTo(x + pw, h); c.closePath(); }, '#E6ECF6', { edge: .2, edgeCol: '#6E7FA6' });
      q.fillStyle = 'rgba(120,140,190,.45)'; q.beginPath(); q.moveTo(px, h - ph); q.lineTo(x + pw, h); q.lineTo(px + pw * .05, h); q.lineTo(px + 20, h - ph * .5); q.closePath(); q.fill();
      q.strokeStyle = 'rgba(110,130,180,.5)'; q.lineWidth = 2; for (let k = 0; k < 5; k++) { const sx2 = px + (r() - .5) * pw * .3, sy2 = h - ph * (.3 + r() * .5); q.beginPath(); q.moveTo(sx2, sy2); q.lineTo(sx2 + (r() - .3) * 60, sy2 + 50 + r() * 60); q.stroke(); }
      q.fillStyle = 'rgba(255,255,255,.55)'; q.beginPath(); q.moveTo(px, h - ph); q.lineTo(px - pw * .12, h - ph * .75); q.lineTo(px - pw * .04, h - ph * .78); q.lineTo(px + pw * .03, h - ph * .7); q.lineTo(px + pw * .08, h - ph * .82); q.closePath(); q.fill(); } }) });
  sc.layers.push({ y: 700, ...strip(.2, t0, t1, 520, (q, w, h) => {
    q.fillStyle = '#E8EEF7'; q.fillRect(0, 300, w, h - 300);
    for (let x = 0; x < w; x += 18 + r() * 22) pine(q, x, 310 + r() * 30, 120 + r() * 120, mix('#2E4A66', '#3E5E7E', r()), '#F2F6FC', r);
    for (let x = 500; x < w; x += 1000 + r() * 400) { // little cabin, warm windows, smoke
      paint(q, c => c.rect(x, 330, 130, 80), '#6E4A3A', { edge: .4 }); paint(q, c => { c.moveTo(x - 16, 334); c.lineTo(x + 65, 270); c.lineTo(x + 146, 334); c.closePath(); }, '#F2F6FC', { edge: .3, edgeCol: '#6E7FA6' });
      q.fillStyle = '#F6C77A'; q.fillRect(x + 20, 350, 26, 24); q.fillRect(x + 80, 350, 26, 24); glow(q, x + 60, 362, 90, '#F6B86A', .55);
      for (let k = 0; k < 6; k++) { q.fillStyle = `rgba(230,230,240,${.4 - k * .05})`; q.beginPath(); q.arc(x + 104 + k * 10, 262 - k * 26, 12 + k * 5, 0, 7); q.fill(); } }
    for (let x = 0; x < w; x += 14 + r() * 18) pine(q, x, 440 + r() * 60, 90 + r() * 60, '#22394F', '#F4F7FC', r);
    q.fillStyle = '#EDF2F9'; q.fillRect(0, 470, w, h - 470);
  }) });
  sc.layers.push({ y: 1100, ...strip(.6, t0, t1, 340, (q, w, h) => { q.fillStyle = vgrad(q, 0, h, [[0, '#F4F7FC'], [1, '#C6D3E8']]); q.beginPath(); q.moveTo(0, h); for (let x = 0; x <= w; x += 30) q.lineTo(x, 60 + Math.sin(x * .008) * 30); q.lineTo(w, h); q.fill();
    for (let x = 0; x < w; x += 200 + r() * 300) pine(q, x, 120, 260 + r() * 120, '#1E3348', '#F4F7FC', r); }) });
  RAIN.flakes = RAIN.flakes || Array.from({ length: 240 }, (_, i) => { const r2 = rng(9000 + i); return { x: r2(), y: r2(), s: 2 + r2() * 5, sp: .2 + r2() * .35, z: r2() }; });
  sc.front = (q, s, t) => {
    for (let x0 = 0; x0 < 2; x0++) { const P = 1500, x = (((-s * 1.7) % P) + P) % P + x0 * P - 400; pine(q, x, OH + 60, 760, '#13202F', '#C9D6E8', rng(77)); }
    RAIN.flakes.forEach(f => { const y = ((f.y + t * f.sp) % 1) * (OH + 100) - 50, x = ((f.x - t * (.4 + f.z * .9) % 1 + 2) % 1) * (OW + 200) - 100; const rad = f.s * (.5 + f.z * .7); q.fillStyle = `rgba(255,255,255,${.45 + f.z * .5})`; q.beginPath(); q.arc(x, y, rad, 0, 7); q.fill(); if (f.z > .6) glow(q, x, y, rad * 3, '#FFFFFF', .25, 'source-over'); });
  };
  sc.weather = { rain: 0, slantOut: 0, glass: .45, tint: '#9DB6E8', tintA: .25, frost: 1, fallCol: '240,245,255' };
  return sc;
}
// ---------------- 5. coastline, the rain clearing (sun, rainbow) ----------------
function buildCoast(t0, t1) {
  const r = rng(505), sc = { t0, t1, layers: [], haze: '#EAF3F7', hazeA: .45 };
  sc.sky = mk(OW, OH); { const q = sc.sky.getContext('2d'); q.fillStyle = vgrad(q, 0, OH, [[0, '#4F92D2'], [.35, '#8FC4EA'], [.53, '#F6E3BA'], [.56, '#F8E8C8'], [1, '#6FB6D2']]); q.fillRect(0, 0, OW, OH); texture(q, 0, 0, OW, OH, .15);
    glow(q, 760, 300, 520, '#FFF2C8', .8, 'source-over');
    cloud(q, 260, 520, 620, 230, r, { lit: '#FFFFFF', mid: '#F1EDF2', shade: '#B8C2D8', rim: '#FFE7A8' }); cloud(q, 820, 650, 420, 150, r, { lit: '#FFFFFF', mid: '#F2EEF2', shade: '#BAC4D8', rim: '#FFE7A8' });
    cloud(q, 120, 200, 360, 110, r, { lit: '#FFFFFF', mid: '#EEF0F6', shade: '#B2C0DA', alpha: .9 });
    // rainbow arc
    const rb = ['#E86A6A', '#F2A65A', '#F2DA6A', '#7FC77A', '#6AA8E8', '#9A82D6']; q.save(); q.globalAlpha = .28; rb.forEach((c, i) => { q.strokeStyle = c; q.lineWidth = 16; q.beginPath(); q.arc(380, 820, 520 - i * 15, Math.PI * 1.05, Math.PI * 1.75); q.stroke(); }); q.restore(); }
  sc.layers.push({ y: 770, ...strip(.03, t0, t1, 320, (q, w, h) => { q.fillStyle = vgrad(q, 0, h, [[0, '#4C93C0'], [1, '#78BCD3']]); q.fillRect(0, 0, w, h); q.fillStyle = '#7FA0B8'; for (let x = 200; x < w; x += 700) { q.beginPath(); q.moveTo(x, 4); q.quadraticCurveTo(x + 60, -26, x + 140, 4); q.fill(); q.fillStyle = '#F4EFE6'; q.fillRect(x + 100, -30, 8, 30); q.fillStyle = '#C95A4A'; q.fillRect(x + 99, -36, 10, 8); q.fillStyle = '#7FA0B8'; }
    texture(q, 0, 0, w, h, .2); }) });
  sc.layers.push({ y: 980, ...strip(.3, t0, t1, 460, (q, w, h) => {   // green headlands, little white houses
    q.fillStyle = vgrad(q, 0, h, [[0, '#7FB361'], [1, '#4E8A48']]); q.beginPath(); q.moveTo(0, h); for (let x = 0; x <= w; x += 30) q.lineTo(x, 120 + Math.sin(x * .004) * 60 + Math.sin(x * .013) * 20); q.lineTo(w, h); q.fill(); texture(q, 0, 0, w, h, .22);
    q.fillStyle = '#C9B48A'; for (let x = 0; x < w; x += 30) { const y = 150 + Math.sin(x * .004) * 60 + Math.sin(x * .013) * 20; q.fillRect(x, y + 20, 30, 10); }
    for (let x = 140; x < w; x += 260 + r() * 300) { const y = 140 + Math.sin(x * .004) * 60; paint(q, c => c.rect(x, y + 20, 46, 34), '#F6F1E6', { edge: .35 }); paint(q, c => { c.moveTo(x - 6, y + 22); c.lineTo(x + 23, y - 2); c.lineTo(x + 52, y + 22); c.closePath(); }, '#C9584A', { edge: .35 }); q.fillStyle = '#5E86A8'; q.fillRect(x + 16, y + 30, 12, 12); }
    for (let x = 0; x < w; x += 90 + r() * 140) clump(q, x, 220 + r() * 120, 30 + r() * 26, r, { n: 30, dark: '#2E6036', mid: '#4E8A48', light: '#9CC66A', dab: .3 });
  }) });
  sc.layers.push({ y: 1250, ...strip(.72, t0, t1, 190, (q, w, h) => { q.fillStyle = '#4E8A42'; q.beginPath(); q.moveTo(0, h); for (let x = 0; x <= w; x += 20) q.lineTo(x, 30 + Math.sin(x * .02) * 12); q.lineTo(w, h); q.fill();
    for (let i = 0; i < w / 4; i++) { const x = r() * w; q.strokeStyle = r() < .5 ? '#8CC062' : '#3E7A3A'; q.lineWidth = 2.4; q.beginPath(); q.moveTo(x, h); q.lineTo(x + (r() - .5) * 14, 20 + r() * 40); q.stroke(); }
    for (let i = 0; i < w / 10; i++) { q.fillStyle = ['#FFFFFF', '#F6D45A', '#F2A0B8', '#B9A6F0'][Math.floor(r() * 4)]; q.beginPath(); q.arc(r() * w, 40 + r() * (h - 50), 4 + r() * 3, 0, 7); q.fill(); } }) });
  sc.front = (q, s, t) => {
    // sea sparkle
    for (let i = 0; i < 70; i++) { const r2 = rng(i * 13 + 5), x = r2() * OW, y = 780 + r2() * 190, tw = Math.max(0, Math.sin(t * 3 + i * 1.7)); if (tw > .6) { q.fillStyle = `rgba(255,252,235,${(tw - .6) * 2})`; q.fillRect(x - 6, y, 12, 2); q.fillRect(x - 1, y - 4, 2, 10); } }
    // sun rays
    q.save(); q.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const a = 1.9 + i * .22 + Math.sin(t * .3 + i) * .02; q.fillStyle = 'rgba(255,240,200,.06)'; q.beginPath(); q.moveTo(760, 300); q.lineTo(760 + Math.cos(a) * 1600, 300 + Math.sin(a) * 1600); q.lineTo(760 + Math.cos(a + .08) * 1600, 300 + Math.sin(a + .08) * 1600); q.fill(); } q.restore();
  };
  sc.weather = { rain: 0, slantOut: 0, glass: .55, sun: 1, tint: '#FFD99A', tintA: .3, fallCol: '255,255,255' };
  return sc;
}
// quiet night countryside for the ending (seen from the room window, still travelling, rain easing)
function buildNight(t0, t1) {
  const r = rng(606), sc = { t0, t1, layers: [], haze: '#2E3A6A' };
  sc.sky = mk(OW, OH); { const q = sc.sky.getContext('2d'); q.fillStyle = vgrad(q, 0, OH, [[0, '#121A3A'], [.6, '#2C3E6E'], [1, '#1C2546']]); q.fillRect(0, 0, OW, OH); texture(q, 0, 0, OW, OH, .2);
    for (let i = 0; i < 120; i++) { q.fillStyle = `rgba(255,255,240,${r() * .7})`; q.beginPath(); q.arc(r() * OW, r() * 700, r() * 1.8 + .3, 0, 7); q.fill(); }
    glow(q, 640, 520, 260, '#DDE6FF', .5, 'source-over'); q.fillStyle = '#F4F2E4'; q.beginPath(); q.arc(640, 520, 46, 0, 7); q.fill(); q.fillStyle = '#2A3B6A'; q.beginPath(); q.arc(660, 508, 42, 0, 7); q.fill(); }
  sc.layers.push({ y: 800, ...strip(.08, t0, t1, 640, (q, w, h) => { q.fillStyle = '#1A2444'; q.beginPath(); q.moveTo(0, h); for (let x = 0; x <= w; x += 30) q.lineTo(x, 80 + Math.sin(x * .005) * 50); q.lineTo(w, h); q.fill();
    for (let x = 0; x < w; x += 40 + r() * 140) { q.fillStyle = '#F6C77A'; q.fillRect(x, 150 + r() * 120, 5, 5); glow(q, x + 2, 270, 20, '#F6C77A', .4); } }) });
  sc.layers.push({ y: 1050, ...strip(.35, t0, t1, 390, (q, w, h) => { q.fillStyle = '#0F1630'; q.beginPath(); q.moveTo(0, h); for (let x = 0; x <= w; x += 20) q.lineTo(x, 60 + Math.sin(x * .011) * 30); q.lineTo(w, h); q.fill(); for (let x = 0; x < w; x += 70 + r() * 90) clump(q, x, 70, 36 + r() * 30, r, { n: 30, dark: '#0B1126', mid: '#121A36', light: '#1C2748', dab: .3 }); }) });
  sc.front = () => {}; sc.weather = { rain: .25, slantOut: .3, glass: .55, tint: '#5A6EA8', tintA: .15, fallCol: '200,215,240' };
  return sc;
}
// boundaries: home -> NYC at T.journey, then every T.scene
function sceneTimes(i) { const a = T.journey + i * T.scene; return [a - .9, a + T.scene + .9]; }
function initWorlds() {
  [buildNYC, buildForest, buildFarm, buildSnow, buildCoast].forEach((b, i) => { const [a, z] = sceneTimes(i); SCN.push(b(a, z)); });
  ROOM.night = buildNight(T.sleep - 1, T.end + 1);
}
// draw one world into the window opening (local coords already translated)
function drawWorld(q, sc, t) {
  const s = S(t), s0 = S(sc.t0); q.drawImage(sc.sky, 0, 0);
  sc.layers.forEach((L, i) => { const off = (s - s0) * L.f; const blur = L.f * (S(t) - S(t - 1 / 30)); const n = blur > 6 ? 3 : 1;
    for (let k = 0; k < n; k++) { q.globalAlpha = k ? .3 : 1; q.drawImage(L.c, -off + k * blur * .35, L.y); } q.globalAlpha = 1;
    if (i < sc.layers.length - 1 && sc.haze) { q.fillStyle = vgrad(q, 0, OH, [[0, rgba(sc.haze, .03 * (sc.hazeA || 1))], [.6, rgba(sc.haze, .18 * (sc.hazeA || 1))], [1, rgba(sc.haze, .08 * (sc.hazeA || 1))]]); q.fillRect(0, 0, OW, OH); } });
  sc.front(q, s - s0, t, t - sc.t0);
}
