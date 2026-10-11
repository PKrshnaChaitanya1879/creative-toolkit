// ================= SCENES (footage edition) =================
let BG = null;
function bg(dark = .3) {
  if (BG) ctx.drawImage(BG, 0, 0, W, H); else { ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H); }
  if (dark) { ctx.fillStyle = `rgba(8,12,30,${dark})`; ctx.fillRect(0, 0, W, H); }
}
function gridOver(a = .14) {
  ctx.save(); ctx.lineWidth = 1;
  for (const [step, al] of [[48, a * .45], [240, a]]) {
    ctx.strokeStyle = `rgba(200,215,255,${al})`; ctx.beginPath();
    for (let x = 0; x < W; x += step) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
    for (let y = 0; y < H; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();
  }
  ctx.restore();
}
function shadeLeft(w = 1150, a = .78) {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, `rgba(8,12,30,${a})`); g.addColorStop(.6, `rgba(8,12,30,${a * .45})`); g.addColorStop(1, 'rgba(8,12,30,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, H);
}
function shadeV(y0, y1, a) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(8,12,30,${a})`); g.addColorStop(1, 'rgba(8,12,30,0)');
  ctx.fillStyle = g; ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0));
}
function letterRise(str, x, y, font, color, lt, o = {}) {
  let cx = o.align === 'center' ? x - measure(str, font) / 2 : x;
  [...str].forEach((ch, i) => {
    const p = E.outExpo(clamp((lt - i * (o.stagger || .03)) / .45));
    text(ch, cx, y - (1 - p) * (o.dy || 110), font, color, { alpha: p, glow: o.glow, blur: o.blur });
    cx += measure(ch, font);
  });
}

function sPrompt(t, lt) {
  blueprint(C.navy, '150,175,255', 0, -lt * 20);
  ctx.save(); const z = lerp(1, 1.06, lt / 1.5); ctx.translate(W/2, H/2); ctx.scale(z, z); ctx.translate(-W/2, -H/2);
  text('// prompt 01 — motion request', 260, 450, F.mono(400, 26), C.muted, { ls: 2 });
  typed('> make me a 30-second world tour', 260, 540, F.mono(600, 56), C.white, lt - .1, 28);
  const u = E.outExpo(prog(lt, 1.18, .25));
  const x0 = 260 + measure('> make me a 30-second ', F.mono(600, 56));
  ctx.fillStyle = C.orange; ctx.fillRect(x0, 566, measure('world tour', F.mono(600, 56)) * u, 6);
  ctx.restore();
  hud(t, C.white, .55 * clamp(lt / .4));
}

function sPackSlams(t, lt) {
  const k = Math.min(2, Math.floor(lt / .5)), l = lt - k * .5;
  bg(0);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = C.orange; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.fillStyle = 'rgba(255,107,61,0.35)'; ctx.fillRect(0, 0, W, H);
  gridOver(.12);
  ctx.save(); shake(l, 16);
  slam(['PACK', 'YOUR', 'BAGS.'][k], W/2, 690, F.black, 380, C.navy, l, { dir: k % 2 ? -1 : 1 });
  text(`0${k+1} / 03`, W/2, 360, F.mono(600, 26), C.navy, { align: 'center', ls: 6, alpha: .85 });
  ctx.restore();
  hud(t, C.navy, .6);
}

function sHyd(t, lt) {
  bg(.12); shadeLeft(1300, .8); gridOver(.1);
  text('ORIGIN — INDIA', 140, 330, F.mono(600, 26), C.orange, { ls: 6, alpha: clamp(lt / .2) });
  letterRise('HYDERABAD', 132, 520, F.inter(800, 190), C.white, lt, { glow: 'rgba(255,255,255,0.3)', blur: 20 });
  words([["We're", C.white], ['going', C.white], ['around', C.orange], ['the', C.orange], ['world.', C.orange]], 140, 620, F.inter(800, 74), lt - .55, { glow: true, stagger: .1 });
  typed(`${coord(CITIES.HYD)}  ·  WHEELS UP 06:00 IST`, 142, 690, F.mono(600, 26), C.white, lt - 1.0, 70, { ls: 2, cursor: false, alpha: .85 });
  hud(t);
}

function sTransit(t, lt, i, dur) {
  const L = LEGS[i];
  bg(.5); gridOver(.16);
  ctx.save(); const z = lerp(1, 1.07, lt / dur); ctx.translate(W/2, H/2); ctx.scale(z, z); ctx.translate(-W/2, -H/2);
  const A = [400, 720], B = [1520, 720], peak = 400;
  const p = E.inOutCubic(clamp(lt / (dur * .82)));
  const pt = s => [lerp(A[0], B[0], s), A[1] - peak * Math.sin(Math.PI * s)];
  ctx.setLineDash([6, 12]); ctx.strokeStyle = 'rgba(220,230,255,0.45)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let s = 0; s <= 1.0001; s += .02) { const q = pt(s); s === 0 ? ctx.moveTo(...q) : ctx.lineTo(...q); } ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); ctx.shadowColor = C.white; ctx.shadowBlur = 18; ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.beginPath();
  for (let s = 0; s <= p + 1e-4; s += .01) { const q = pt(Math.min(s, p)); s === 0 ? ctx.moveTo(...q) : ctx.lineTo(...q); } ctx.stroke(); ctx.restore();
  const h = pt(p), gl = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], 60);
  gl.addColorStop(0, 'rgba(255,107,61,0.95)'); gl.addColorStop(1, 'rgba(255,107,61,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(h[0], h[1], 60, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(h[0], h[1], 8, 0, Math.PI*2); ctx.fill();
  for (const [q, on, code] of [[A, true, L.from], [B, p > .97, L.to]]) {
    ctx.strokeStyle = on ? C.white : 'rgba(220,230,255,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(q[0], q[1], 22, 0, Math.PI*2); ctx.stroke();
    if (on) { ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(q[0], q[1], 9, 0, Math.PI*2); ctx.fill(); }
    text(code, q[0], q[1] + 110, F.inter(800, 84), C.white, { align: 'center', alpha: on ? 1 : .6, glow: on ? 'rgba(255,255,255,0.5)' : null, blur: 20 });
    text(CITIES[code].name.toUpperCase(), q[0], q[1] + 152, F.mono(600, 22), C.white, { align: 'center', ls: 4, alpha: .75 });
  }
  text(i === 5 ? 'BACK HOME' : `FLIGHT 0${i+1}`, W/2, 230, F.mono(600, 24), C.orange, { align: 'center', ls: 6 });
  text(`${fmtKm(L.km * p)} KM`, W/2, 640, F.inter(800, 76), C.white, { align: 'center' });
  text(fmtDur(L.mins) + ' IN THE AIR', W/2, 690, F.mono(600, 22), C.white, { align: 'center', ls: 4, alpha: .75 });
  ctx.restore();
  hud(t);
}

function sTokyo(t, lt) {
  bg(.1); shadeLeft(1250, .82); gridOver(.08);
  ctx.save(); ctx.translate(1450, 560); const ks = lerp(1, 1.1, lt / 2.5); ctx.scale(ks, ks);
  ctx.font = F.jp(520); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4;
  ctx.globalAlpha = .55 * clamp(lt / .3); ctx.strokeStyle = C.white; ctx.strokeText('東京', 0, 0); ctx.restore();
  ctx.save(); shake(lt - .05, 14);
  text('STOP 01 / 05 — JAPAN', 150, 330, F.mono(600, 26), C.orange, { ls: 6, alpha: clamp(lt / .2) });
  slam('TOKYO', 140, 650, F.black, 290, C.white, lt - .05, { align: 'left', glow: 'rgba(255,107,61,0.55)', blur: 30 });
  ctx.fillStyle = C.orange; ctx.fillRect(150, 690, 560 * E.outExpo(clamp((lt - .25) / .4)), 8);
  ctx.restore();
  typed(`${coord(CITIES.HND)}  ·  HND  ·  SHIBUYA CROSSING`, 150, 760, F.mono(600, 28), C.white, lt - .45, 70, { ls: 2, cursor: false });
  words([['Konnichiwa.', C.orange]], 150, 860, F.inter(800, 84, true), lt - .8, { glow: true });
  hud(t);
}

function sNewYork(t, lt) {
  bg(.12); shadeV(0, 600, .85); gridOver(.08);
  text('STOP 02 / 05 — USA', W/2, 170, F.mono(600, 24), C.orange, { align: 'center', ls: 6 });
  letterRise('NEW YORK', W/2, 370, F.inter(800, 220), C.white, lt, { align: 'center', glow: 'rgba(255,255,255,0.4)', blur: 26 });
  words([['the', C.white], ['city', C.white], ['that', C.white], ['never', C.orange], ['sleeps.', C.orange]], W/2, 460, F.inter(800, 64), lt - .45, { align: 'center', glow: true, stagger: .09 });
  const s = `${coord(CITIES.JFK)}  ·  JFK  ·  TIMES SQUARE`;
  typed(s, W/2 - measure(s, F.mono(600, 24), 2)/2, 520, F.mono(600, 24), C.white, lt - .95, 70, { ls: 2, cursor: false, alpha: .85 });
  hud(t);
}

function sRio(t, lt) {
  bg(.05); shadeV(H, 560, .7);
  const slide = E.outExpo(clamp(lt / .4));
  ctx.save(); ctx.translate(lerp(-1150, 0, slide), 0); ctx.translate(130, 150); ctx.rotate(-.025);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, 1000, 700); ctx.restore();
  ctx.strokeStyle = 'rgba(27,30,40,0.06)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x <= 1000; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, 700); } for (let y = 0; y <= 700; y += 40) { ctx.moveTo(0, y); ctx.lineTo(1000, y); } ctx.stroke();
  ctx.fillStyle = C.ink; ctx.fillRect(30, 30, 940, 84);
  text('ARRIVAL CARD', 56, 90, F.black(44), C.paper);
  text('FORM 03-GIG · BRASIL', 470, 70, F.mono(600, 16), C.paper, { ls: 3, alpha: .8 });
  text('STOP 03 / 05 · BLOCK CAPITALS', 470, 96, F.mono(400, 16), C.paper, { ls: 3, alpha: .55 });
  const rows = [['01', 'DESTINATION', 'RIO DE JANEIRO'], ['02', 'COORDINATES', coord(CITIES.GIG)], ['03', 'ARRIVING FROM', `JFK · ${fmtKm(LEGS[2].km)} KM`]];
  rows.forEach((r, i) => {
    const y = 200 + i * 80, a = clamp((lt - .2 - i * .1) / .15);
    text(r[0], 56, y, F.mono(600, 22), C.ink, { alpha: a * .45 });
    text(r[1], 110, y, F.mono(600, 22), C.ink, { alpha: a * .7, ls: 2 });
    ctx.globalAlpha = a * .35; ctx.fillStyle = C.ink; ctx.fillRect(110, y + 16, 840, 2); ctx.globalAlpha = 1;
    typed(r[2], 400, y, F.mono(600, 28), C.ink, lt - .3 - i * .15, 70, { cursor: false });
  });
  text('04', 56, 470, F.mono(600, 22), C.ink, { alpha: .45 }); text('PURPOSE OF VISIT', 110, 470, F.mono(600, 22), C.ink, { alpha: .7, ls: 2 });
  [['BUSINESS', false], ['SUNSHINE', true], ['SAMBA', true]].forEach(([lab, on], i) => {
    const x = 110 + i * 290, y = 545, a = clamp((lt - .6 - i * .08) / .15);
    ctx.globalAlpha = a; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(x, y - 30, 36, 36); ctx.globalAlpha = 1;
    text(lab, x + 54, y, F.mono(600, 26), C.ink, { alpha: a });
    if (on && lt > .95 + i * .1) {
      const q = E.outCubic(clamp((lt - .95 - i * .1) / .12));
      ctx.strokeStyle = C.red; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(x + 6, y - 12); ctx.lineTo(x + 6 + 10 * q, y - 12 + 12 * q); if (q > .5) ctx.lineTo(x + 16 + 30 * (q - .5) * 2, y - 2 - 40 * (q - .5) * 2); ctx.stroke();
    }
    if (!on) { const q = E.outExpo(clamp((lt - 1.15) / .3)); ctx.fillStyle = C.red; ctx.fillRect(x - 8, y - 12, (measure(lab, F.mono(600, 26)) + 80) * q, 6); }
  });
  ctx.save(); shake(lt - 1.45, 20); stamp('GIG', 760, 560, -.2, lt - 1.45, .72); ctx.restore();
  ctx.restore();
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30;
  slam('OLÁ,', W - 130, 840, F.black, 150, C.white, lt - .5, { align: 'right' });
  slam('RIO.', W - 130, 990, F.black, 150, C.orange, lt - .62, { align: 'right', dir: -1 });
  ctx.restore();
  hud(t);
}

function sParis(t, lt) {
  bg(.08); shadeLeft(1200, .8); gridOver(.07);
  text('STOP 04 / 05 — FRANCE', 140, 360, F.mono(600, 24), C.orange, { ls: 6 });
  const jit = Math.max(1 - clamp(lt / .45), (Math.floor(lt * 10) % 7 === 0) ? .5 : 0, lt > 1.25 && lt < 1.4 ? .8 : 0);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const pf = F.inter(800, 250), dx = 18 * jit + 2;
  text('PARIS', 130 - dx, 600 + (hash(Math.floor(lt*30))-.5)*10*jit, pf, 'rgba(255,60,60,0.85)');
  text('PARIS', 130 + dx, 600, pf, 'rgba(60,220,255,0.85)');
  ctx.restore();
  text('PARIS', 130, 600, pf, C.white, { glow: 'rgba(255,255,255,0.35)', blur: 22, alpha: 1 - jit * .4 });
  words([['Bonjour.', C.orange]], 140, 700, F.inter(800, 80, true), lt - .45, { glow: true });
  typed(`${coord(CITIES.CDG)}  ·  CDG  ·  TOUR EIFFEL`, 140, 770, F.mono(600, 26), C.white, lt - .8, 70, { ls: 2, cursor: false, alpha: .85 });
  hud(t);
}

function sCairo(t, lt) {
  bg(.08); shadeLeft(1200, .78); gridOver(.07);
  const g = ctx.createLinearGradient(0, H, 0, H * .55); g.addColorStop(0, 'rgba(255,107,61,0.35)'); g.addColorStop(1, 'rgba(255,107,61,0)');
  ctx.fillStyle = g; ctx.fillRect(0, H * .55, W, H * .45);
  ctx.save(); shake(lt - .05, 14);
  text('STOP 05 / 05 — EGYPT', 140, 330, F.mono(600, 24), C.orange, { ls: 6 });
  slam('CAIRO', 130, 540, F.black, 230, C.white, lt - .05, { align: 'left', glow: 'rgba(255,107,61,0.7)', blur: 36 });
  ctx.restore();
  words([['Ahlan.', C.orange]], 140, 645, F.inter(800, 76, true), lt - .45, { glow: true });
  typed(`${coord(CITIES.CAI)}  ·  CAI  ·  GIZA PLATEAU`, 140, 705, F.mono(600, 26), C.white, lt - .8, 70, { ls: 2, cursor: false, alpha: .85 });
  hud(t);
}

function sTotals(t, lt) {
  bg(0);
  const codes = ['HYD', 'HND', 'JFK', 'GIG', 'CDG', 'CAI'];
  codes.forEach((c, i) => {
    const x = (i % 3) * 640, y = Math.floor(i / 3) * 540, a = clamp((lt - i * .08) / .2);
    ctx.fillStyle = `rgba(8,12,30,${1 - a})`; ctx.fillRect(x, y, 640, 540);
    text(c, x + 28, y + 52, F.mono(600, 26), C.white, { ls: 4, alpha: a });
  });
  ctx.strokeStyle = C.navy; ctx.lineWidth = 8; ctx.beginPath();
  ctx.moveTo(640, 0); ctx.lineTo(640, H); ctx.moveTo(1280, 0); ctx.lineTo(1280, H); ctx.moveTo(0, 540); ctx.lineTo(W, 540); ctx.stroke();
  const dim = E.outCubic(clamp((lt - .5) / .4));
  ctx.fillStyle = `rgba(8,12,30,${.62 * dim})`; ctx.fillRect(0, 0, W, H);
  if (lt > .55) {
    const l = lt - .55;
    ctx.save(); shake(l, 12, .2);
    text('TOTAL DISTANCE', W/2, 380, F.mono(600, 26), C.orange, { align: 'center', ls: 6 });
    const n = fmtKm(TOTAL_KM * E.outExpo(clamp(l / 1.4)));
    slam(n + ' KM', W/2, 610, F.black, 210, C.white, l, { glow: 'rgba(255,255,255,0.35)', blur: 30, from: 1.25 });
    ctx.restore();
    words([['06 cities', C.white], ['·', C.white], ['05 continents', C.white], ['·', C.white], ['1 planet', C.orange]], W/2, 720, F.inter(800, 56), l - .6, { align: 'center', glow: false, stagger: .14 });
  }
  hud(t);
}

function sPlanetSlams(t, lt) {
  const k = Math.min(3, Math.floor(lt / .5)), l = lt - k * .5;
  const wds = ['ONE', 'PLANET.', 'ZERO', 'KEYFRAMES.'];
  const orange = k % 2 === 1;
  if (orange) blueprint(C.orange, '13,23,54', 0, 0, .8); else { bg(.45); gridOver(.1); }
  ctx.save(); shake(l, 18);
  const size = fitSize(wds[k], F.black, 380, 1640);
  slam(wds[k], W/2, 540 + size * .36, F.black, size, orange ? C.navy : C.white, l, { dir: k % 2 ? -1 : 1, glow: orange ? null : 'rgba(255,255,255,0.35)', blur: 30 });
  ctx.restore();
  hud(t, orange ? C.navy : C.white, .6);
}

function sEnd(t, lt) {
  bg(.25); shadeV(H, 600, .85); shadeV(0, 300, .6); gridOver(.07);
  ctx.save(); shake(lt, 18, .3);
  const push = lerp(1, 1.05, lt / 4); ctx.translate(W/2, 560); ctx.scale(push, push); ctx.translate(-W/2, -560);
  slam('WORLD', W/2, 500, F.black, 300, C.white, lt, { glow: 'rgba(255,255,255,0.5)', blur: 40, from: 1.6 });
  slam('TOUR', W/2, 790, F.black, 300, C.orange, lt - .12, { glow: 'rgba(255,107,61,0.85)', blur: 50, from: 1.6, dir: -1 });
  const sp = prog(lt, .9, .7);
  if (sp > 0 && sp < 1) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const sx = lerp(-300, W + 300, sp), g = ctx.createLinearGradient(sx - 160, 0, sx + 160, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,0.2)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 200, W, 640); ctx.restore();
  }
  ctx.restore();
  const cap = 'around the world & back home · 06 cities · ' + fmtKm(TOTAL_KM) + ' km';
  typed(cap, W/2 - measure(cap, F.mono(600, 28), 3)/2, 900, F.mono(600, 28), C.white, lt - .6, 55, { ls: 3 });
  ctx.save(); shake(lt - 1.5, 16); stamp('END', 1530, 270, .14, lt - 1.5, .78); ctx.restore();
  const ca = clamp((lt - 2.0) / .4);
  text('FOOTAGE: THE DRONALIST (CC BY 3.0) · BASILE MORIN (CC BY-SA 4.0) · QUAHADI (CC BY-SA 3.0)', W/2, 968, F.mono(400, 15), C.white, { align: 'center', ls: 1.5, alpha: .7 * ca });
  text('PHOTOS: RASHID JORVEE, THEAAFI (CC BY-SA 4.0) · ACEDISCOVERY (CC BY 4.0) · RICARDO LIBERATO (CC BY-SA 2.0) · VIA WIKIMEDIA COMMONS', W/2, 992, F.mono(400, 15), C.white, { align: 'center', ls: 1.5, alpha: .7 * ca });
  hud(t, C.white, .6 * (1 - prog(lt, 1.8, .3)));
  const fo = prog(lt, 3.45, .55); if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, W, H); }
}

