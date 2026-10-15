// ---------- timeline + camera ----------
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const BAR = 2.74;   // musical bar (87.6 bpm, 4/4): every scene = 2 bars, cuts land on downbeats
const T = { lightsOff: 13.5, toShoulder: 17, wipe: 21.0, pov: 21.5, trainGo: 22.4, journey: 9 * BAR, scene: 2 * BAR, sleep: 19 * BAR, end: 60 };
function camKeys(t) {
  // [time, cx, cy, zoom] keyframes in room space, eased between
  const K = [[0, 640, 800, 1.75], [10.5, 660, 1060, 1.06], [17, 650, 1010, 1.12], [21.0, 680, 880, 2.7], [21.5, 655, 945, 4.6]];
  for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) { const u = ease(prog(t, K[i][0], K[i + 1][0] - K[i][0])); return [lerp(K[i][1], K[i + 1][1], u), lerp(K[i][2], K[i + 1][2], u), lerp(K[i][3], K[i + 1][3], u)]; }
  return K[K.length - 1].slice(1);
}
function roomView(q, t, { cam, lights, sleep = false, pose = {}, outside, rainAmt = 1, wind = 0 }) {
  const [cx, cy, z] = cam;
  q.save(); q.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z);
  // outside through the glass
  q.save(); q.beginPath(); q.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); q.clip();
  outside(q, WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, t);
  q.fillStyle = `rgba(20,25,45,${.25 * lights})`; q.fillRect(WIN.x0, WIN.y0, 500, 720);   // bright room -> window reads darker
  glassRain(q, WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, t, rainAmt, wind);
  if (lights < 1) glow(q, 470, 1110, 160, '#FFC27A', .22 * (1 - lights));                     // lamp reflection in the glass
  q.restore();
  // room, crossfading lit -> lamp-only
  q.drawImage(ROOM.off, 0, 0); if (lights > .001) { q.globalAlpha = lights; q.drawImage(ROOM.on, 0, 0); q.globalAlpha = 1; }
  drawFairy(q, lights, t);
  // pendant cord (tugged)
  const tug = pose.tug || 0; q.strokeStyle = lights > .5 ? '#6A4A30' : '#2A2433'; q.lineWidth = 2.2; q.beginPath(); q.moveTo(CORD.x, CORD.top); q.lineTo(CORD.x, CORD.bot + tug * 26); q.stroke();
  q.fillStyle = mix('#3A3045', '#B9864E', lights); q.beginPath(); ellipse(q, CORD.x, CORD.bot + 10 + tug * 26, 8, 11); q.fill();
  // girl
  if (sleep) drawGirlSleep(t); else drawGirlSit({ ...pose, t });
  q.drawImage(litGirl(lights), GB.x, GB.y);
  if (lights > .01) glow(q, 940, 420, 200, '#FFE8B0', .35 * lights);
  glow(q, 455, 1120, 70, '#FFE6B0', .6);           // desk lamp bulb
  for (let i = 0; i < 28; i++) { const r2 = rng(i * 31 + 3), x = 380 + r2() * 360 + Math.sin(t * .3 + i) * 20, y = 1000 + r2() * 300 - ((t * (6 + r2() * 8)) % 120); glow(q, x, y, 5 + r2() * 4, '#FFD9A0', .35 * (.5 + .5 * Math.sin(t * 1.3 + i))); }
  q.restore();
}
function nightOutside(q, x, y, w, h, t) { q.save(); q.translate(x, y); const k = w / OW; q.scale(k, k); drawWorld(q, ROOM.night, t); fallingRain(q, 0, 0, OW, OH, t, ROOM.night.weather.rain * (1 - prog(t, T.sleep, 6)), .3, '200,215,240'); q.restore(); }
function homeOutside(q, x, y, w, h, t) { q.drawImage(ROOM.home, x, y, w, h); fallingRain(q, x, y, w, h, t, .7, .05); }
// post: bloom (bright areas glow), colour grade (purple shadows, amber highlights), soft vignette, fine grain
const BL1 = mk(270, 480), BL2 = mk(135, 240);
function finish(q, t, vig = .38) {
  q.setTransform(1, 0, 0, 1, 0, 0); q.globalAlpha = 1;
  const b1 = BL1.getContext('2d'), b2 = BL2.getContext('2d');
  b1.filter = 'brightness(.78) contrast(3.4) saturate(1.6) blur(5px)'; b1.clearRect(0, 0, 270, 480); b1.drawImage(cv, 0, 0, 270, 480);
  b2.filter = 'blur(9px)'; b2.clearRect(0, 0, 135, 240); b2.drawImage(BL1, 0, 0, 135, 240);
  q.save(); q.imageSmoothingQuality = 'high'; q.globalCompositeOperation = 'screen'; q.globalAlpha = .38; q.drawImage(BL1, 0, 0, W, H); q.globalAlpha = .42; q.drawImage(BL2, 0, 0, W, H); q.restore();
  q.save(); q.globalCompositeOperation = 'soft-light'; q.globalAlpha = .32; q.fillStyle = vgrad(q, 0, H, [[0, '#5B3FA0'], [.55, '#8A5AA8'], [1, '#E08A5A']]); q.fillRect(0, 0, W, H); q.restore();
  const g = q.createRadialGradient(W / 2, H * .48, H * .3, W / 2, H / 2, H * .78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(20,10,40,${vig})`); q.fillStyle = g; q.fillRect(0, 0, W, H);
  const f = Math.floor(t * 24); q.save(); q.globalCompositeOperation = 'overlay'; q.globalAlpha = .045; q.fillStyle = q.createPattern(TEX.brush, 'repeat'); q.translate((f * 97) % 256, (f * 61) % 256); q.fillRect(-256, -256, W + 512, H + 512); q.restore();
}
function renderAt(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#0E0D16'; ctx.fillRect(0, 0, W, H);
  if (t < T.pov) {
    const lights = 1 - smooth(prog(t, T.lightsOff, .35));
    const reach = prog(t, 11.8, 1.5) - prog(t, 14.2, 1.4), tug = Math.sin(clamp((t - 13.2) / .5) * Math.PI);
    roomView(ctx, t, { cam: camKeys(t), lights, pose: { reach: clamp(reach), tug, look: smooth(prog(t, 15.5, 2)) }, outside: homeOutside });
  }
  else if (t < T.sleep) {
    povView(ctx, t);
    // camera passing beside her head: dark hair sweeps off to the right
    const w = prog(t, T.pov, .42); if (w < 1) { ctx.save(); ctx.filter = 'blur(18px)'; ctx.globalAlpha = 1 - smooth(prog(t, T.pov + .2, .22)); ctx.fillStyle = '#1A1014'; ctx.beginPath(); ellipse(ctx, lerp(500, 2300, easeOut(w)), 1100, 1100, 1500); ctx.fill(); ctx.restore(); }
    const fo = smooth(prog(t, T.sleep - .5, .5)); if (fo > 0) { ctx.fillStyle = `rgba(10,10,20,${fo})`; ctx.fillRect(0, 0, W, H); }
  } else {
    const u = ease(prog(t, T.sleep, 7)); const cam = [lerp(730, 660, u), lerp(1150, 1060, u), lerp(2.2, 1.12, u)];
    roomView(ctx, t, { cam, lights: 0, sleep: true, outside: nightOutside, rainAmt: lerp(.8, .35, prog(t, T.sleep, 6)) });
    const fi = 1 - smooth(prog(t, T.sleep, .9)); if (fi > 0) { ctx.fillStyle = `rgba(10,10,20,${fi})`; ctx.fillRect(0, 0, W, H); }
    const fe = smooth(prog(t, T.end - 1.1, 1.0)); if (fe > 0) { ctx.fillStyle = `rgba(8,8,14,${fe})`; ctx.fillRect(0, 0, W, H); }
  }
  finish(ctx, t);
}
window.F = { renderAt, ready: document.fonts.ready.then(() => { initTextures(); initRoom(); initGirl(); initRain(); ROOM.home = buildHomeView(); initWorlds(); buildPOV(); }) };
