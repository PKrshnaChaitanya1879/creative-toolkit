// ================= SCENES (LAUNCH) =================
let BG = null;
function bg(dark = .3) {
  if (BG) ctx.drawImage(BG, 0, 0, W, H); else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  if (dark) { ctx.fillStyle = `rgba(4,6,16,${dark})`; ctx.fillRect(0, 0, W, H); }
}
function gridOver(a = .1) {
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
  g.addColorStop(0, `rgba(4,6,16,${a})`); g.addColorStop(.6, `rgba(4,6,16,${a * .45})`); g.addColorStop(1, 'rgba(4,6,16,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, H);
}
function vignette(a = .6) {
  const v = ctx.createRadialGradient(W/2, H/2, H*.35, W/2, H/2, H*1.0);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
function flash(lt, a = .9, d = .25) { const k = 1 - clamp(lt / d); if (k > 0) { ctx.fillStyle = `rgba(255,240,220,${a * k * k})`; ctx.fillRect(0, 0, W, H); } }
function clockStr(t) {
  const d = t - IGN, s = Math.abs(d);
  return `T${d < 0 ? '–' : '+'} 00:00:${String(Math.floor(s)).padStart(2, '0')}.${String(Math.floor((s % 1) * 100)).padStart(2, '0')}`;
}
function hud(t, ink = C.white, a = .75) {
  ctx.save(); ctx.globalAlpha = a;
  const m = 56, L = 26;
  ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.beginPath();
  for (const [x, y, dx, dy] of [[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]]) { ctx.moveTo(x, y + dy*L); ctx.lineTo(x, y); ctx.lineTo(x + dx*L, y); }
  ctx.stroke();
  text('LAUNCH — RENDER 02', m + 40, m + 22, F.mono(600, 17), ink, { ls: 3 });
  text(clockStr(t), W - m - 40, m + 22, F.mono(600, 17), t < IGN ? ink : C.orange, { align: 'right', ls: 3 });
  let cur = 0; STAGE_AT.forEach((k, i) => { if (t >= BT[k] && (k > 0 || true)) cur = i; });
  if (t < BT[26]) cur = 0;
  let x = m + 40;
  STAGES.forEach((s, i) => {
    text(s, x, H - m - 12, F.mono(600, 17), i === cur ? C.orange : ink, { ls: 2, alpha: i === cur ? 1 : (i < cur ? .9 : .45) });
    x += measure(s, F.mono(600, 17), 2) + 12;
    if (i < STAGES.length - 1) { text('→', x, H - m - 12, F.mono(400, 17), ink, { alpha: .45 }); x += 34; }
  });
  text('NASA FOOTAGE · PUBLIC DOMAIN · 30 FPS', W - m - 40, H - m - 12, F.mono(600, 17), ink, { align: 'right', ls: 3 });
  ctx.restore();
}
function letterRise(str, x, y, font, color, lt, o = {}) {
  let cx = o.align === 'center' ? x - measure(str, font) / 2 : x;
  [...str].forEach((ch, i) => {
    const p = E.outExpo(clamp((lt - i * (o.stagger || .03)) / .45));
    text(ch, cx, y - (1 - p) * (o.dy || 110), font, color, { alpha: p, glow: o.glow, blur: o.blur });
    cx += measure(ch, font);
  });
}

function sIntro(t, lt) {
  bg(.45); gridOver(.08); vignette(.7);
  typed('// prompt 02 — launch', 140, 200, F.mono(400, 26), C.muted, lt, 30, { ls: 2, cursor: false });
  const W5 = [['Ten', C.white], ['seconds', C.white], ['to', C.white], ['leave', C.orange], ['Earth.', C.orange]];
  const font = F.inter(800, 132);
  const space = measure(' ', font), ws = W5.map(w => measure(w[0], font));
  let x = W/2 - (ws.reduce((a, b) => a + b, 0) + space * 4) / 2;
  W5.forEach((w, i) => {
    const p = E.outBack(clamp((t - BT[i]) / .3));
    if (p > 0) { ctx.save(); ctx.translate(x + ws[i]/2, 600 + (1 - clamp(p)) * 30); const s = lerp(.7, 1, clamp(p)); ctx.scale(s, s);
      text(w[0], 0, 0, font, w[1], { align: 'center', alpha: clamp(p * 1.4), glow: w[1] === C.orange ? 'rgba(255,107,61,0.5)' : 'rgba(255,255,255,0.3)', blur: 18 }); ctx.restore(); }
    x += ws[i] + space;
  });
  const s = 'KENNEDY SPACE CENTER · LC-39B · ARTEMIS I · SPACE LAUNCH SYSTEM';
  typed(s, W/2 - measure(s, F.mono(600, 24), 3) / 2, 700, F.mono(600, 24), C.white, t - BT[1], 55, { ls: 3, cursor: false, alpha: .8 });
  hud(t, C.white, .55 * clamp(lt / .5));
}

const STATUS = ['TERMINAL COUNT', 'GO FOR LAUNCH', 'ORION ON INTERNAL POWER', 'CORE STAGE PRESSURISED', 'ACCESS ARM CLEAR', 'RS-25 START SEQUENCE', 'ENGINES RUNNING', 'THRUST BUILDING', 'BOOSTERS ARMED', 'MAIN ENGINE START'];
function sCount(t, lt) {
  const k = Math.min(9, Math.max(0, BT.findIndex(b => b > t) - 1 - 5)), b0 = BT[5 + k], l = t - b0, n = 10 - k;
  bg(.38); gridOver(.07);
  const heat = k / 9;
  const g = ctx.createRadialGradient(W/2, H, 50, W/2, H, H * 1.2);
  g.addColorStop(0, `rgba(255,107,61,${.45 * heat})`); g.addColorStop(1, 'rgba(255,107,61,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  vignette(.6);
  ctx.save(); shake(l, 6 + 14 * heat, .3);
  const size = 560;
  slam(String(n), W/2 + 60, 540 + size * .36, F.black, size, C.white, l, { glow: n <= 3 ? 'rgba(255,107,61,0.8)' : 'rgba(255,255,255,0.35)', blur: 40, from: 1.5, dir: k % 2 ? -1 : 1 });
  text('T–', W/2 - measure(String(n), F.black(size)) / 2 - 40, 360, F.mono(600, 64), C.orange, { align: 'right', alpha: clamp(l / .1) });
  ctx.restore();
  typed(STATUS[k], W/2 - measure(STATUS[k], F.mono(600, 26), 4) / 2, 880, F.mono(600, 26), C.white, l, 60, { ls: 4, cursor: false });
  hud(t);
}

function sIgnition(t, lt) {
  bg(.12); vignette(.55);
  ctx.save(); shake(lt, 26, .9);
  slam('IGNITION', W/2, 600, F.black, 250, C.white, lt - .02, { glow: 'rgba(255,107,61,0.95)', blur: 60, from: 1.8 });
  ctx.restore();
  words([['4 × RS-25', C.white], ['·', C.white], ['2 × BOOSTERS', C.white], ['·', C.white], ['8.8 MILLION LBF', C.orange]], W/2, 700, F.mono(600, 30), lt - .5, { align: 'center', stagger: .1 });
  flash(lt, 1, .35);
  hud(t);
}

function sLiftoff(t, lt) {
  bg(.08); shadeLeft(1000, .6); vignette(.45);
  ctx.save(); shake(lt, 12, 2);
  slam('LIFTOFF', 130, 560, F.black, 230, C.white, lt, { align: 'left', glow: 'rgba(255,107,61,0.7)', blur: 40 });
  ctx.restore();
  const tp = t - IGN;
  text(`MISSION ELAPSED  ${tp.toFixed(2)} S`, 140, 640, F.mono(600, 28), C.orange, { ls: 3, alpha: clamp(lt / .2) });
  if (t > BT[21]) typed('CLEARED THE TOWER', 140, 700, F.mono(600, 28), C.white, t - BT[21], 50, { ls: 3, cursor: false });
  hud(t);
}

function sClimb(t, lt) {
  bg(.15); shadeLeft(1100, .65); vignette(.5);
  const v = Math.round(28000 * E.outExpo(clamp(lt / 2.0)) / 10) * 10;
  ctx.save(); shake(lt, 8, .3);
  slam(v.toLocaleString('en-US'), 130, 560, F.black, 220, C.white, lt, { align: 'left', glow: 'rgba(255,255,255,0.35)', blur: 30, from: 1.3 });
  ctx.restore();
  text('KM/H', 140 + measure('28,000', F.black(220)) + 24, 560, F.inter(800, 90), C.orange, { glow: 'rgba(255,107,61,0.6)', blur: 20 });
  typed('ORBITAL SPEED · ABOUT 8 MINUTES AFTER LIFTOFF', 140, 640, F.mono(600, 26), C.white, lt - .3, 60, { ls: 3, cursor: false });
  hud(t);
}

const WORLDS = {
  earth:   { n: '01', name: 'EARTH ORBIT', l1: 'ALTITUDE 400 KM · INTERNATIONAL SPACE STATION', l2: 'ONE LAP OF THE PLANET EVERY 92 MINUTES', src: 'ISS · 4K EARTH VIEWS' },
  moon:    { n: '02', name: 'THE MOON', key: 'Moon', src: 'ORION CAMERA · ARTEMIS I · 2022' },
  jupiter: { n: '04', name: 'JUPITER', key: 'Jupiter', src: 'JUNO · THE GREAT RED SPOT' },
  saturn:  { n: '05', name: 'SATURN', key: 'Saturn', src: 'CASSINI · BACKLIT BY THE SUN' },
};
function sWorld(t, lt, id) {
  const w = WORLDS[id];
  bg(.06); shadeLeft(1150, .78); gridOver(.06);
  text(`${w.n} / 06 — ${w.src}`, 140, 330, F.mono(600, 24), C.orange, { ls: 5, alpha: clamp(lt / .2) });
  letterRise(w.name, 132, 520, F.inter(800, w.name.length > 9 ? 170 : 200), C.white, lt, { glow: 'rgba(255,255,255,0.3)', blur: 22 });
  let l1 = w.l1, l2 = w.l2;
  if (w.key) {
    const j = JPL[w.key];
    const km = j.km * E.outExpo(clamp((lt - .25) / 1.2));
    l1 = `${fmtBig(km)} AWAY TODAY`;
    l2 = `LIGHT TAKES ${lightStr(j.light_min)} TO GET HERE`;
  }
  text(l1, 140, 600, F.inter(800, 56), C.white, { alpha: clamp((lt - .2) / .2), glow: 'rgba(255,255,255,0.25)', blur: 14 });
  typed(l2, 142, 660, F.mono(600, 26), C.orange, lt - .55, 60, { ls: 3, cursor: false });
  hud(t);
}

function sMars(t, lt) {
  bg(0);
  const px = 820, py = 143, pw = 1000, ph = 795;
  ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.globalAlpha = .9; ctx.strokeRect(px - 8, py - 8, pw + 16, ph + 16); ctx.globalAlpha = 1;
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(px + 22, py + 30, 8 * (Math.floor(lt * 3) % 2 ? 1 : .6), 0, Math.PI * 2); ctx.fill();
  text('LIVE FEED // PERSEVERANCE DESCENT CAM · 18 FEB 2021', px + 40, py + 38, F.mono(600, 18), C.white, { ls: 2 });
  shadeLeft(900, .7);
  text('03 / 06 — JEZERO CRATER', 140, 330, F.mono(600, 24), C.orange, { ls: 5, alpha: clamp(lt / .2) });
  ctx.save(); shake(lt, 10, .25);
  slam('MARS', 130, 520, F.black, 220, C.white, lt, { align: 'left', glow: 'rgba(255,107,61,0.7)', blur: 36 });
  ctx.restore();
  const j = JPL.Mars, km = j.km * E.outExpo(clamp((lt - .25) / 1.2));
  text(fmtBig(km), 140, 600, F.inter(800, 54), C.white, { alpha: clamp((lt - .2) / .2) });
  text('AWAY TODAY', 140, 650, F.inter(800, 40), C.white, { alpha: .8 * clamp((lt - .3) / .2) });
  typed(`LIGHT: ${lightStr(j.light_min)}`, 142, 710, F.mono(600, 24), C.orange, lt - .6, 60, { ls: 3, cursor: false });
  hud(t);
}

function sWebb(t, lt) {
  bg(.1); vignette(.55);
  text('06 / 06 — WEBB · SMACS 0723 · FIRST DEEP FIELD', W/2, 330, F.mono(600, 24), C.orange, { align: 'center', ls: 5, alpha: clamp(lt / .2) });
  const wd = [['Every', C.white], ['dot', C.white], ['is', C.white], ['a', C.white], ['galaxy.', C.orange]];
  const font = F.inter(800, 120), space = measure(' ', font), ws = wd.map(w => measure(w[0], font));
  let x = W/2 - (ws.reduce((a, b) => a + b, 0) + space * 4) / 2;
  const at = [0, 0, 1, 1, 2];
  wd.forEach((w, i) => {
    const p = E.outBack(clamp((t - BT[45 + at[i]] - (i % 2) * .12) / .3));
    if (p > 0) { ctx.save(); ctx.translate(x + ws[i]/2, 580 + (1 - clamp(p)) * 30); const s = lerp(.7, 1, clamp(p)); ctx.scale(s, s);
      text(w[0], 0, 0, font, w[1], { align: 'center', alpha: clamp(p * 1.4), glow: w[1] === C.orange ? 'rgba(255,107,61,0.6)' : 'rgba(255,255,255,0.35)', blur: 20 }); ctx.restore(); }
    x += ws[i] + space;
  });
  typed('THE LIGHT IN THIS IMAGE LEFT SOME OF THEM OVER 13 BILLION YEARS AGO', W/2 - measure('THE LIGHT IN THIS IMAGE LEFT SOME OF THEM OVER 13 BILLION YEARS AGO', F.mono(600, 24), 3)/2, 680, F.mono(600, 24), C.white, t - BT[47], 70, { ls: 3, cursor: false });
  hud(t);
}

function sCliffs(t, lt) {
  bg(.08); vignette(.5);
  const k = Math.min(2, Math.max(0, BT.findIndex(b => b > t) - 1 - 49)), l = t - BT[49 + k];
  const wds = ['AND', "WE'RE", 'JUST GETTING STARTED.'];
  ctx.save(); shake(l, 14, .25);
  const size = fitSize(wds[k], F.black, 300, 1700);
  slam(wds[k], W/2, 540 + size * .36, F.black, size, k === 2 ? C.orange : C.white, l, { glow: k === 2 ? 'rgba(255,107,61,0.8)' : 'rgba(255,255,255,0.4)', blur: 40, from: 1.5, dir: k % 2 ? -1 : 1 });
  ctx.restore();
  text('WEBB · COSMIC CLIFFS · CARINA NEBULA', W/2, 880, F.mono(600, 22), C.white, { align: 'center', ls: 4, alpha: .75 });
  hud(t);
}

function sHome(t, lt) {
  bg(0);
  const blk = 1 - clamp((lt - .25) / 1.8);
  if (blk > 0) { ctx.fillStyle = `rgba(0,0,0,${blk})`; ctx.fillRect(0, 0, W, H); }
  // ring around Earth (frame centre)
  const ra = clamp((lt - 1.6) / .6) * (1 - clamp((lt - 6.6) / .6));
  if (ra > 0) {
    const r = 46 + 6 * Math.sin(lt * 3);
    ctx.strokeStyle = `rgba(255,107,61,${ra})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(W/2, H/2, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2 + r * .71, H/2 - r * .71); ctx.lineTo(W/2 + 150, H/2 - 150); ctx.lineTo(W/2 + 330, H/2 - 150); ctx.stroke();
    text('YOU ARE HERE', W/2 + 160, H/2 - 166, F.mono(600, 22), C.orange, { ls: 4, alpha: ra });
  }
  const vj = JPL['Voyager 1'];
  typed(`VOYAGER 1 · ${(vj.km / 1e9).toFixed(1)} BILLION KM FROM HOME · ${lightStr(vj.light_min)} AWAY`, 140, 860, F.mono(600, 22), C.white, lt - 1.2, 45, { ls: 3, cursor: false, alpha: .8 * (1 - clamp((lt - 6.6) / .6)) });
  const a1 = clamp((lt - 3.0) / .9) * (1 - clamp((lt - 6.6) / .6)), a2 = clamp((lt - 4.4) / .9) * (1 - clamp((lt - 6.6) / .6));
  text('That pixel is Earth.', 140, 200, F.inter(800, 64), C.white, { alpha: a1 });
  text('Everyone who ever looked up started there.', 140, 268, F.inter(600, 40, true), C.white, { alpha: a2 * .9 });
  const fa = clamp((lt - 6.3) / .5) * (1 - clamp((lt - 7.55) / .5));
  if (fa > 0) {
    text('LAUNCH', W/2, 560, F.black(150), C.white, { align: 'center', alpha: fa, glow: 'rgba(255,255,255,0.35)', blur: 30 });
    text('FOOTAGE & IMAGES: NASA · NASA/JPL-CALTECH · NASA/ESA/CSA/STScI · PUBLIC DOMAIN', W/2, 660, F.mono(400, 18), C.white, { align: 'center', ls: 2, alpha: fa * .75 });
    text('MUSIC: HANS ZIMMER — “FLIGHT” · DISTANCES: NASA JPL HORIZONS, 9 OCT 2026', W/2, 692, F.mono(400, 18), C.white, { align: 'center', ls: 2, alpha: fa * .75 });
  }
  hud(t, C.white, .5 * (1 - clamp(lt / .5)));
}

