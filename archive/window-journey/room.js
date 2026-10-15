// ---------- the cozy room (world 1300 x 2200), painted once into albedo + two lightmaps ----------
const RW = 1300, RH = 2200;
const WIN = { x0: 400, x1: 900, y0: 430, y1: 1150, mx: 650, ty: 640 };   // glass opening
const CORD = { x: 940, top: 405, bot: 860 };
const PAL = { terra: '#C2643F', mustard: '#D9A441', teal: '#3E7F86', cream: '#EDE0C4', rose: '#C98A8F', navy: '#2F3E61', sage: '#8BA67C', plum: '#7B4A6B', wood: '#A8703F', woodD: '#6E4428' };
const BOOKC = [PAL.terra, PAL.mustard, PAL.teal, PAL.cream, PAL.rose, PAL.navy, PAL.sage, PAL.plum, '#5C8A6A', '#E3B86B'];

function drawBooks(q, x0, x1, yBase, r, maxH = 170) {
  let x = x0;
  while (x < x1 - 16) {
    const w = 16 + r() * 22, h = maxH * (.62 + r() * .38), c = BOOKC[Math.floor(r() * BOOKC.length)];
    if (r() < .12 && x + h < x1) { // a book lying flat
      paint(q, c2 => c2.rect(x, yBase - w, h, w), c, { edge: .3, edgeW: 1.5 });
      q.fillStyle = 'rgba(255,240,210,.35)'; q.fillRect(x + 8, yBase - w + 4, h - 16, 3); x += h + 4; continue;
    }
    const lean = r() < .1 ? (r() - .5) * .18 : 0;
    q.save(); q.translate(x + w / 2, yBase); q.rotate(lean);
    paint(q, c2 => rr(c2, -w / 2, -h, w, h, 2), c, { edge: .35, edgeW: 1.4, tex: .2 });
    q.fillStyle = 'rgba(255,245,220,.45)'; q.fillRect(-w / 2 + 2, -h + 14, w - 4, 3); q.fillRect(-w / 2 + 2, -26, w - 4, 3);
    q.fillStyle = 'rgba(0,0,0,.12)'; q.fillRect(w / 2 - 4, -h, 4, h);
    q.restore(); x += w + 1 + r() * 2;
  }
}
function pottedPlant(q, x, y, s, r, potCol = PAL.terra, kind = 'round') {
  // leaves
  if (kind === 'round') { clump(q, x, y - 52 * s, 46 * s, r, { n: 70, dab: .3, dark: '#2E5B3A', mid: '#4F8A4E', light: '#9CC46A' }); }
  if (kind === 'spiky') { for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .22; q.beginPath(); q.moveTo(x, y - 18 * s); q.quadraticCurveTo(x + Math.cos(a) * 40 * s, y - 18 * s + Math.sin(a) * 40 * s, x + Math.cos(a) * 70 * s, y - 18 * s + Math.sin(a) * 78 * s); q.lineWidth = 8 * s; q.strokeStyle = i % 2 ? '#4C8650' : '#6FA25A'; q.lineCap = 'round'; q.stroke(); } }
  if (kind === 'trail') { clump(q, x, y - 30 * s, 34 * s, r, { n: 40, dab: .3 }); for (let k = 0; k < 4; k++) { let px = x + (k - 1.5) * 18 * s, py = y; for (let i = 0; i < 14; i++) { px += (r() - .5) * 8 * s; py += 16 * s; q.fillStyle = i % 2 ? '#4F8A4E' : '#7DB05E'; q.beginPath(); ellipse(q, px, py, 9 * s, 6 * s, r() * 3); q.fill(); } } }
  paint(q, c => { c.moveTo(x - 30 * s, y - 34 * s); c.lineTo(x + 30 * s, y - 34 * s); c.lineTo(x + 23 * s, y); c.lineTo(x - 23 * s, y); c.closePath(); }, potCol, { edge: .35, edgeW: 1.5 });
  q.fillStyle = 'rgba(255,230,200,.3)'; q.fillRect(x - 31 * s, y - 36 * s, 62 * s, 7 * s);
}

function buildRoomAlbedo(seed = 3) {
  const c = mk(RW, RH), r = rng(seed); let q = c.getContext('2d');
  // wall
  paint(q, x => x.rect(0, 0, RW, 1650), vgrad(q, 0, 1650, [[0, '#9DB09A'], [.6, '#A9B99C'], [1, '#93A58C']]), { tex: .22, edge: 0, grain: .1 });
  for (let i = 0; i < 260; i++) { q.fillStyle = `rgba(${r() < .5 ? '255,250,230' : '60,80,60'},${.025 + r() * .03})`; q.fillRect(r() * RW, r() * 1650, 3 + r() * 6, 40 + r() * 140); }
  // wainscot rail + lower wall
  paint(q, x => x.rect(0, 1380, RW, 270), '#C9B48E', { tex: .15, edge: 0 });
  for (let x = 0; x < RW; x += 56) { q.fillStyle = 'rgba(80,55,35,.18)'; q.fillRect(x, 1390, 3, 260); q.fillStyle = 'rgba(255,245,220,.18)'; q.fillRect(x + 3, 1390, 2, 260); }
  paint(q, x => x.rect(0, 1370, RW, 22), PAL.wood, { edge: .3 });
  // ceiling beam + plank ceiling edge
  paint(q, x => x.rect(0, 0, RW, 120), vgrad(q, 0, 120, [[0, '#5A3A26'], [1, '#7A5032']]), { edge: 0 });
  paint(q, x => x.rect(0, 112, RW, 22), '#8A5C3A', { edge: .3 });
  // floor
  paint(q, x => x.rect(0, 1650, RW, RH - 1650), vgrad(q, 1650, RH, [[0, '#7A4F33'], [1, '#9A6842']]), { edge: 0, tex: .2 });
  for (let y = 1650, k = 0; y < RH; k++) { const hgt = 44 + k * 10; q.fillStyle = 'rgba(40,22,12,.35)'; q.fillRect(0, y, RW, 2); for (let x = (k * 137) % 300; x < RW; x += 260 + r() * 140) q.fillRect(x, y, 2, hgt); y += hgt; }
  paint(q, x => x.rect(0, 1636, RW, 18), '#5E3B25', { edge: 0 });
  // rug
  q.save(); q.translate(650, 1960); paint(q, x => ellipse(x, 0, 0, 470, 150), '#B45E43', { edge: .25 });
  paint(q, x => ellipse(x, 0, 0, 410, 122), '#E3C79A', { edge: 0 }); paint(q, x => ellipse(x, 0, 0, 340, 96), '#3E7F86', { edge: 0 }); paint(q, x => ellipse(x, 0, 0, 260, 70), '#E9D4A6', { edge: 0 });
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; q.fillStyle = PAL.terra; q.beginPath(); ellipse(q, Math.cos(a) * 300, Math.sin(a) * 84, 12, 6, a); q.fill(); }
  q.restore();

  // ---- window: frame, sill (glass left transparent-ish; outside painted live)
  paint(q, x => x.rect(370, 400, 560, 790), '#7A4C2E', { edge: .4 });
  paint(q, x => x.rect(380, 410, 540, 770), '#9C673E', { edge: .3 });
  q.clearRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  paint(q, x => x.rect(WIN.mx - 11, WIN.y0, 22, WIN.y1 - WIN.y0), '#93603A', { edge: .35 });
  paint(q, x => x.rect(WIN.x0, WIN.ty - 10, WIN.x1 - WIN.x0, 20), '#93603A', { edge: .35 });
  paint(q, x => { x.moveTo(340, 1170); x.lineTo(960, 1170); x.lineTo(975, 1200); x.lineTo(325, 1200); x.closePath(); }, '#B07B4A', { edge: .4 });
  paint(q, x => x.rect(325, 1200, 650, 14), '#7E5132', { edge: 0 });
  // sill plants + bottle
  pottedPlant(q, 450, 1172, .9, r, '#D98C5F', 'spiky');
  pottedPlant(q, 850, 1172, .8, r, '#E9DDC3', 'round');
  paint(q, x => { x.moveTo(905, 1172); x.lineTo(905, 1120); x.quadraticCurveTo(905, 1100, 915, 1092); x.lineTo(915, 1072); x.lineTo(925, 1072); x.lineTo(925, 1092); x.quadraticCurveTo(935, 1100, 935, 1120); x.lineTo(935, 1172); x.closePath(); }, 'rgba(120,180,170,.75)', { edge: .3 });
  // curtain rod + curtains
  paint(q, x => x.rect(270, 372, 760, 12), '#5A3A26', { edge: 0 });
  q.fillStyle = '#5A3A26'; q.beginPath(); q.arc(270, 378, 12, 0, 7); q.arc(1030, 378, 12, 0, 7); q.fill();
  const curtain = (xo, xi, side) => {   // xo = outer edge, xi = inner edge at the rod; gathered to the outer side at the tie
    const tie = 930, tx = xo - side * 0, tw = 46;
    const path = x => { x.moveTo(xo, 380); x.lineTo(xi, 380); x.bezierCurveTo(xi, 560, tx + side * -tw * 1.4, tie - 160, tx - side * tw, tie);
      x.bezierCurveTo(tx - side * tw * 1.3, tie + 120, xi - side * 10, 1250, xi + side * 20, 1340); x.lineTo(xo + side * 18, 1340); x.bezierCurveTo(xo + side * 8, 1150, xo, tie + 60, xo, tie); x.lineTo(xo, 380); x.closePath(); };
    paint(q, path, vgrad(q, 380, 1340, [[0, '#F1E4C6'], [1, '#E2CDA2']]), { edge: .28, tex: .14 });
    q.save(); q.beginPath(); path(q); q.clip();
    for (let i = 0; i < 7; i++) { const u = (i + .5) / 7, top = lerp(xo, xi, u), bot = lerp(xo + side * 10, xi + side * 18, u), mid = lerp(xo, tx - side * tw, u);
      q.strokeStyle = 'rgba(140,100,60,.16)'; q.lineWidth = 7; q.beginPath(); q.moveTo(top, 380); q.quadraticCurveTo(mid, tie - 100, mid, tie); q.quadraticCurveTo(mid, tie + 120, bot, 1340); q.stroke();
      q.strokeStyle = 'rgba(255,250,235,.25)'; q.lineWidth = 3; q.beginPath(); q.moveTo(top + 6, 380); q.quadraticCurveTo(mid + 5, tie - 100, mid + 5, tie); q.quadraticCurveTo(mid + 5, tie + 120, bot + 6, 1340); q.stroke(); }
    q.restore();
    paint(q, x => rr(x, Math.min(xo, tx - side * tw) - 6, tie - 12, Math.abs(tw) + 16, 24, 10), PAL.terra, { edge: .35 });
  };
  curtain(285, 435, -1); curtain(1015, 865, 1);

  // ---- bookshelf (left)
  paint(q, x => x.rect(0, 500, 280, 1150), '#7A4C2E', { edge: .3 });
  paint(q, x => x.rect(0, 515, 262, 1120), '#5B3923', { edge: 0 });
  for (let s = 0; s < 5; s++) { const yb = 720 + s * 220; drawBooks(q, 8, s === 1 ? 160 : 254, yb, r, s === 4 ? 150 : 180); paint(q, x => x.rect(0, yb, 280, 20), '#8E5C36', { edge: .3 }); }
  pottedPlant(q, 210, 940, .9, r, '#E9DDC3', 'trail');
  paint(q, x => rr(x, 180, 1080, 70, 82, 3), '#E8D9B8', { edge: .3 }); paint(q, x => x.rect(188, 1088, 54, 54), '#6E9AB0', { edge: 0 }); clump(q, 215, 1125, 16, r, { n: 20, dab: .4 });
  pottedPlant(q, 80, 500, 1.2, r, PAL.terra, 'trail');

  // ---- right wall: framed paintings, shelf, monstera
  const frame = (x, y, w, h, fn) => { paint(q, c2 => c2.rect(x, y, w, h), '#6E4428', { edge: .35 }); q.save(); q.beginPath(); q.rect(x + 10, y + 10, w - 20, h - 20); q.clip(); fn(x + 10, y + 10, w - 20, h - 20); q.restore(); };
  frame(1030, 450, 170, 220, (x, y, w, h) => { q.fillStyle = vgrad(q, y, y + h, [[0, '#9CC6DA'], [1, '#F2DEB0']]); q.fillRect(x, y, w, h); q.fillStyle = '#7C9AB4'; q.beginPath(); q.moveTo(x, y + h * .7); q.lineTo(x + w * .4, y + h * .35); q.lineTo(x + w * .7, y + h * .6); q.lineTo(x + w, y + h * .45); q.lineTo(x + w, y + h); q.lineTo(x, y + h); q.fill(); q.fillStyle = '#5E8A5A'; q.fillRect(x, y + h * .8, w, h * .2); });
  frame(1110, 700, 120, 120, (x, y, w, h) => { q.fillStyle = '#F2D59A'; q.fillRect(x, y, w, h); q.fillStyle = PAL.terra; q.beginPath(); q.arc(x + w / 2, y + h / 2, w * .28, 0, 7); q.fill(); });
  paint(q, x => x.rect(1000, 880, 260, 16), '#8E5C36', { edge: .3 });
  paint(q, x => rr(x, 1030, 820, 36, 60, 6), PAL.cream, { edge: .3 }); paint(q, x => rr(x, 1078, 842, 30, 38, 5), PAL.mustard, { edge: .3 });
  pottedPlant(q, 1190, 880, .8, r, PAL.teal, 'trail');
  // monstera
  const leaf = (x, y, a, s, col) => {
    q.save(); q.translate(x, y); q.rotate(a); q.scale(s, s);
    paint(q, c2 => { c2.moveTo(0, 0); c2.bezierCurveTo(70, -20, 120, -90, 100, -170); c2.bezierCurveTo(60, -200, -60, -200, -100, -170); c2.bezierCurveTo(-120, -90, -70, -20, 0, 0); }, col, { edge: .35, edgeCol: '#16331F', tex: .18 });
    q.strokeStyle = 'rgba(200,230,150,.45)'; q.lineWidth = 3; q.beginPath(); q.moveTo(0, 0); q.quadraticCurveTo(5, -90, 0, -185); q.stroke();
    q.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { q.beginPath(); q.ellipse(sd * (40 + i * 6), -40 - i * 34, 26, 7, sd * -.5, 0, 7); q.fill(); }
    q.restore();
  };
  const leafs = mk(RW, RH), lq = leafs.getContext('2d');
  { const qq = q; q = lq; // draw leaves on own layer so the cut-outs only cut leaves
    for (let i = 0; i < 8; i++) { const a = -.75 + i * .2 + (r() - .5) * .15; const L = 190 + r() * 120; const sx = 1200, sy = 1455; const ex = sx + Math.sin(a) * L, ey = sy - Math.cos(a) * L;
      lq.strokeStyle = '#3C6B3C'; lq.lineWidth = 7; lq.beginPath(); lq.moveTo(sx, sy); lq.quadraticCurveTo(sx + Math.sin(a) * L * .4, sy - L * .6, ex, ey); lq.stroke();
      leaf(ex, ey, a * .9, .62 + r() * .25, ['#2F6B3E', '#3F7E47', '#4E8E4E', '#2A5C38'][i % 4]); }
    q = qq; }
  q.drawImage(leafs, 0, 0);
  paint(q, x => { x.moveTo(1080, 1450); x.lineTo(1290, 1450); x.lineTo(1265, 1645); x.lineTo(1105, 1645); x.closePath(); }, PAL.terra, { edge: .35 });
  q.fillStyle = 'rgba(255,220,180,.3)'; q.fillRect(1078, 1445, 214, 14);

  // ---- desk
  paint(q, x => { x.moveTo(300, 1232); x.lineTo(1000, 1232); x.lineTo(1030, 1288); x.lineTo(270, 1288); x.closePath(); }, vgrad(q, 1232, 1288, [[0, '#B88250'], [1, '#C99260']]), { edge: .35 });
  paint(q, x => x.rect(270, 1288, 760, 36), '#93603A', { edge: .35 });
  q.fillStyle = 'rgba(255,235,200,.35)'; q.fillRect(270, 1288, 760, 3);
  paint(q, x => x.rect(285, 1324, 30, 316), '#7E5132', { edge: .3 }); paint(q, x => x.rect(985, 1324, 30, 316), '#7E5132', { edge: .3 });
  // drawer unit right
  paint(q, x => x.rect(830, 1324, 155, 200), '#A06A40', { edge: .3 }); paint(q, x => x.rect(842, 1340, 131, 80), '#B07849', { edge: .25 }); paint(q, x => x.rect(842, 1430, 131, 80), '#B07849', { edge: .25 });
  q.fillStyle = '#E4C27E'; q.beginPath(); q.arc(907, 1380, 6, 0, 7); q.arc(907, 1470, 6, 0, 7); q.fill();
  // desk lamp (left)
  paint(q, x => ellipse(x, 360, 1262, 46, 12), '#3F6A4E', { edge: .35 });
  q.strokeStyle = '#3B4A42'; q.lineWidth = 8; q.lineCap = 'round'; q.beginPath(); q.moveTo(360, 1258); q.lineTo(330, 1140); q.lineTo(420, 1075); q.stroke();
  q.fillStyle = '#3B4A42'; q.beginPath(); q.arc(330, 1140, 9, 0, 7); q.fill();
  paint(q, x => { x.moveTo(400, 1050); x.lineTo(450, 1068); x.lineTo(500, 1150); x.quadraticCurveTo(450, 1172, 405, 1140); x.closePath(); }, '#4E7A5A', { edge: .4 });
  // books stack + mug + notebook on the desk
  [[880, 1250, 120, 22, PAL.navy], [890, 1228, 104, 22, PAL.mustard], [884, 1208, 112, 20, PAL.rose]].forEach(([x, y, w, h, cc]) => { paint(q, c2 => rr(c2, x, y - h, w, h, 3), cc, { edge: .35 }); q.fillStyle = 'rgba(255,245,220,.5)'; q.fillRect(x + 6, y - h + 3, w - 12, 3); });
  paint(q, x => { x.moveTo(790, 1210); x.lineTo(830, 1210); x.lineTo(826, 1258); x.lineTo(794, 1258); x.closePath(); }, '#E9DDC3', { edge: .35 });
  q.strokeStyle = '#E9DDC3'; q.lineWidth = 6; q.beginPath(); q.arc(834, 1232, 12, -1.2, 1.2); q.stroke(); q.fillStyle = PAL.terra; q.fillRect(794, 1226, 33, 8);
  paint(q, x => { x.moveTo(470, 1240); x.lineTo(590, 1236); x.lineTo(600, 1268); x.lineTo(465, 1272); x.closePath(); }, '#F1E7D2', { edge: .3 });
  pottedPlant(q, 540, 1238, .55, r, '#E9DDC3', 'round');

  // ---- pendant lamp (right) + cord
  q.strokeStyle = '#3A2A20'; q.lineWidth = 3; q.beginPath(); q.moveTo(940, 120); q.lineTo(940, 330); q.stroke();
  paint(q, x => { x.moveTo(870, 400); x.quadraticCurveTo(875, 330, 940, 325); x.quadraticCurveTo(1005, 330, 1010, 400); x.closePath(); }, '#E2B76A', { edge: .4 });
  for (let i = 0; i < 9; i++) { q.strokeStyle = 'rgba(120,80,40,.35)'; q.lineWidth = 2; q.beginPath(); q.moveTo(880 + i * 15, 398); q.quadraticCurveTo(900 + i * 8, 350, 940, 330); q.stroke(); }
  return c;
}

// lightmaps (multiplied over albedo).  on: overhead + fairy warm ; off: night blue + desk lamp pool + window spill
function buildLightmap(on) {
  const c = mk(RW, RH), q = c.getContext('2d');
  if (on) {
    q.fillStyle = '#E8CFA8'; q.fillRect(0, 0, RW, RH);
    const pools = [[940, 430, 800, '#FFF2D6', .6], [650, 260, 900, '#FFE7BE', .45], [360, 1150, 420, '#FFE2B0', .4], [650, 800, 460, '#E8EEF5', .25]];
    pools.forEach(([x, y, rad, col, a]) => glow(q, x, y, rad, col, a, 'lighter'));
    // corners darker (painted vignette)
    const g = q.createRadialGradient(650, 1000, 500, 650, 1100, 1400); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,50,40,.45)'); q.fillStyle = g; q.fillRect(0, 0, RW, RH);
  } else {
    q.fillStyle = '#3A4068'; q.fillRect(0, 0, RW, RH);
    glow(q, 560, 1230, 520, '#E89A4A', .85, 'lighter');    // desk lamp pool
    glow(q, 520, 1180, 230, '#FFD08A', .8, 'lighter');
    glow(q, 650, 800, 620, '#3E5888', .55, 'lighter');     // cool window spill
    glow(q, 650, 1190, 360, '#5470A0', .35, 'lighter');
    const g = q.createRadialGradient(600, 1150, 300, 650, 1100, 1300); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,10,30,.55)'); q.fillStyle = g; q.fillRect(0, 0, RW, RH);
  }
  return c;
}
function litComposite(albedo, lm, extra) {
  const c = mk(RW, RH), q = c.getContext('2d');
  q.drawImage(albedo, 0, 0); q.globalCompositeOperation = 'multiply'; q.drawImage(lm, 0, 0);
  q.globalCompositeOperation = 'destination-in'; q.drawImage(albedo, 0, 0); q.globalCompositeOperation = 'source-over';
  if (extra) extra(q);
  return c;
}
let ROOM = {};
function initRoom() {
  ROOM.albedo = buildRoomAlbedo();
  ROOM.lmOn = buildLightmap(true); ROOM.lmOff = buildLightmap(false);
  ROOM.on = litComposite(ROOM.albedo, ROOM.lmOn, q => { glow(q, 940, 405, 260, '#FFE9B8', .55); q.globalCompositeOperation = 'source-over'; });
  ROOM.off = litComposite(ROOM.albedo, ROOM.lmOff, q => { glow(q, 450, 1110, 120, '#FFE2A8', .9); glow(q, 470, 1200, 300, '#F0A050', .25); });
  // fairy light bulb positions (two catenaries + a drop along the shelf)
  const bulbs = []; const cat = (x0, y0, x1, y1, sag, n) => { for (let i = 0; i <= n; i++) { const u = i / n; bulbs.push([lerp(x0, x1, u), lerp(y0, y1, u) + sag * 4 * u * (1 - u), bulbs.length]); } };
  cat(20, 150, 640, 170, 110, 15); cat(640, 170, 1290, 150, 120, 15); cat(270, 520, 270, 1300, 0, 0);
  for (let i = 0; i < 12; i++) bulbs.push([268 + Math.sin(i) * 6, 540 + i * 62, bulbs.length]);
  ROOM.bulbs = bulbs;
}
function drawFairy(q, on, t) {
  const B = ROOM.bulbs;
  q.strokeStyle = on > .5 ? 'rgba(70,50,30,.7)' : 'rgba(20,20,35,.8)'; q.lineWidth = 1.6;
  q.beginPath(); for (let i = 0; i < 32; i++) { const [x, y] = B[i]; i ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke();
  q.beginPath(); for (let i = 33; i < B.length; i++) { const [x, y] = B[i]; i > 33 ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke();
  B.forEach(([x, y, k], i) => {
    if (i === 32) return;
    // each bulb switches off at its own moment (a quick ripple)
    const tw = .85 + .15 * Math.sin(t * 2.3 + k * 1.7);
    const b = clamp(on * 1.6 - (k % 7) * .09) * tw;
    q.fillStyle = mix('#3A3A40', '#FFE6A0', b); q.beginPath(); ellipse(q, x, y + 6, 5, 7); q.fill();
    if (b > .02) { glow(q, x, y + 6, 70, '#FFB85A', .45 * b); glow(q, x, y + 6, 12, '#FFF6D8', .9 * b); }
  });
}
