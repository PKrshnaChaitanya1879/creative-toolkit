// ---------- the girl (original character): long messy hair, oversized off-shoulder knit, headphones ----------
const SK = { skin: '#F3D2B8', skinS: '#DDA48C', blush: '#EE9E94', hair: '#3A2622', hairM: '#553729', hairL: '#7E5440',
  knit: '#DBA09F', knitS: '#B97C80', knitL: '#F0C2B8', hp: '#F1ECE4', hpS: '#B9B3AC', hpA: '#8DBFAE', chair: '#7A4C2E', chairL: '#9C673E' };
const GB = { x: 360, y: 700, w: 700, h: 960 };     // girl layer bbox in room coords
let GIRL = {};
function initGirl() { GIRL.c = mk(GB.w, GB.h); GIRL.a = mk(GB.w, GB.h); GIRL.r = rng(91); }

function knitRibs(q, x0, x1, y0, y1, a = .14) {
  q.save(); q.globalAlpha = a; q.strokeStyle = SK.knitS; q.lineWidth = 2.2;
  for (let x = x0; x < x1; x += 11) { q.beginPath(); q.moveTo(x, y0); for (let y = y0; y < y1; y += 12) q.lineTo(x + Math.sin(y * .05 + x) * 1.2, y); q.stroke(); }
  q.globalAlpha = a * .8; q.strokeStyle = SK.knitL; for (let x = x0 + 5; x < x1; x += 11) { q.beginPath(); q.moveTo(x, y0); q.lineTo(x, y1); q.stroke(); }
  q.restore();
}
// messy strands flicking out of a hair mass
function strands(q, pts, n, r, col, len = 50, w = 1.6) {
  q.strokeStyle = col; q.lineWidth = w; q.lineCap = 'round';
  for (let i = 0; i < n; i++) { const [x, y, dx, dy] = pts[Math.floor(r() * pts.length)]; const L = len * (.4 + r()); q.beginPath(); q.moveTo(x, y); q.quadraticCurveTo(x + dx * L * .5 + (r() - .5) * 20, y + dy * L * .5, x + dx * L + (r() - .5) * 30, y + dy * L + (r() - .5) * 10); q.stroke(); }
}
function sleeve(q, pts, w0, w1) {   // thick knit tube along a polyline, chunky cuff at the end
  const n = pts.length; const L = []; for (let i = 0; i < n; i++) L.push(lerp(w0, w1, i / (n - 1)));
  const side = s => pts.map((p, i) => { const a = pts[Math.min(i + 1, n - 1)], b = pts[Math.max(i - 1, 0)]; const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * L[i] / 2 * s, p[1] + dx / l * L[i] / 2 * s]; });
  const A = side(1), B = side(-1).reverse();
  paint(q, c => { blobPath(c, A, false); B.forEach(p => c.lineTo(p[0], p[1])); c.closePath(); }, SK.knit, { edge: .3, edgeCol: '#6A3A3E' });
  return { A, B };
}
function solveArm(sx, sy, hx2, hy, l1, l2, bend = 1) {
  const dx = hx2 - sx, dy = hy - sy, d = Math.min(Math.hypot(dx, dy), l1 + l2 - .01), a = Math.atan2(dy, dx);
  const c = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  return [sx + Math.cos(a - bend * c) * l1, sy + Math.sin(a - bend * c) * l1];
}

// pose: { reach: 0..1, tug: 0..1, look: 0..1 (head lifts toward window), breathe: t }
function drawGirlSit(pose) {
  const q = GIRL.c.getContext('2d'), r = rng(91); q.setTransform(1, 0, 0, 1, -GB.x, -GB.y); q.clearRect(GB.x, GB.y, GB.w, GB.h);
  const br = Math.sin(pose.t * 1.6) * 2.2, look = pose.look || 0;
  const hx0 = 650 + look * 6, hy0 = 935 - look * 10 + br * .3;
  // body / knit (dropped shoulders, oversized)
  const body = c => { c.moveTo(626, 1040 + br); c.bezierCurveTo(560, 1052, 505, 1072, 482, 1112 + br); c.bezierCurveTo(456, 1160, 450, 1260, 446, 1395); c.lineTo(856, 1395); c.bezierCurveTo(852, 1260, 846, 1160, 822, 1110 + br); c.bezierCurveTo(800, 1072, 740, 1050, 676, 1040 + br); c.closePath(); };
  paint(q, body, vgrad(q, 1040, 1395, [[0, SK.knitL], [.35, SK.knit], [1, SK.knitS]]), { edge: .35, edgeCol: '#6A3A3E', tex: .2 });
  q.save(); q.beginPath(); body(q); q.clip(); knitRibs(q, 440, 860, 1040, 1400);
  // cable knit hints + soft fold shadows
  for (const cx of [560, 740]) { q.strokeStyle = 'rgba(150,90,95,.25)'; q.lineWidth = 3; for (let y = 1130; y < 1390; y += 26) { q.beginPath(); q.moveTo(cx - 10, y); q.quadraticCurveTo(cx, y + 13, cx + 10, y + 26); q.moveTo(cx + 10, y); q.quadraticCurveTo(cx, y + 13, cx - 10, y + 26); q.stroke(); } }
  q.fillStyle = 'rgba(120,70,80,.16)'; q.beginPath(); q.moveTo(500, 1150); q.quadraticCurveTo(520, 1270, 490, 1395); q.lineTo(456, 1395); q.lineTo(470, 1150); q.fill();
  q.beginPath(); q.moveTo(800, 1150); q.quadraticCurveTo(790, 1270, 815, 1395); q.lineTo(850, 1395); q.lineTo(835, 1150); q.fill();
  q.restore();
  // off-shoulder: bare left shoulder + collar slipping down the arm
  const sh = c => { c.moveTo(628, 1012); c.bezierCurveTo(600, 1040, 545, 1050, 508, 1078 + br); c.bezierCurveTo(492, 1092, 488, 1112, 494, 1124 + br); c.bezierCurveTo(540, 1102, 600, 1084, 642, 1070); c.closePath(); };
  paint(q, sh, vgrad(q, 1010, 1125, [[0, SK.skin], [1, SK.skinS]]), { edge: .3, edgeCol: '#8A5040', tex: .1 });
  // collar band (thick ribbed neckline)
  q.save(); q.lineCap = 'round';
  q.strokeStyle = SK.knitS; q.lineWidth = 24; q.beginPath(); q.moveTo(492, 1128 + br); q.bezierCurveTo(560, 1100, 630, 1078, 690, 1062 + br); q.bezierCurveTo(730, 1054, 760, 1060, 790, 1076 + br); q.stroke();
  q.strokeStyle = SK.knit; q.lineWidth = 17; q.stroke();
  q.globalAlpha = .4; q.strokeStyle = SK.knitL; q.lineWidth = 2; for (let i = 0; i < 26; i++) { const u = i / 25; const x = lerp(495, 788, u), y = 1126 - Math.sin(u * 2.6) * 66 + u * 10 + br; q.beginPath(); q.moveTo(x, y - 8); q.lineTo(x + 2, y + 8); q.stroke(); }
  q.restore();
  // neck
  paint(q, c => { c.moveTo(624, 990); c.lineTo(676, 990); c.lineTo(684, 1062); c.quadraticCurveTo(652, 1072, 618, 1060); c.closePath(); }, SK.skinS, { edge: .25, edgeCol: '#8A5040' });
  // headphones around the neck: cups peeking either side
  const cup = (x, y, s) => { paint(q, c => ellipse(c, x, y, 26, 34, s * .35), SK.hp, { edge: .4, edgeCol: '#5A5550' }); paint(q, c => ellipse(c, x + s * 8, y + 2, 14, 22, s * .35), SK.hpA, { edge: .2 }); };
  q.strokeStyle = SK.hpS; q.lineWidth = 9; q.beginPath(); q.moveTo(585, 1050); q.quadraticCurveTo(650, 1078, 718, 1048); q.stroke();
  cup(586, 1046 + br, -1); cup(716, 1042 + br, 1);
  // head (back of head = hair) + ear on the right
  paint(q, c => ellipse(c, hx0 + 62, hy0 + 8, 13, 20, .2), SK.skin, { edge: .3, edgeCol: '#8A5040' });
  q.fillStyle = SK.blush; q.globalAlpha = .5; q.beginPath(); ellipse(q, hx0 + 62, hy0 + 10, 6, 10, .2); q.fill(); q.globalAlpha = 1;
  // hair: one organic silhouette (wider over the shoulders, wavy edges, uneven tips) + painted locks inside
  const r2 = rng(1234), sw = Math.sin(pose.t * .8) * 2;
  const tips = []; for (let i = 0; i <= 10; i++) { const u = i / 10; tips.push([lerp(hx0 + 92, hx0 - 150, u) + (r2() - .5) * 10, (i % 2 ? 1250 : 1312) + (r2() - .5) * 30 + sw]); }
  const outline = [[hx0 - 10, hy0 - 84], [hx0 + 40, hy0 - 74], [hx0 + 68, hy0 - 36], [hx0 + 70, hy0 + 14], [hx0 + 62, hy0 + 66], [hx0 + 66, 1050], [hx0 + 86, 1110], [hx0 + 92, 1170], [hx0 + 104, 1222],
    ...tips, [hx0 - 146, 1240], [hx0 - 132, 1180], [hx0 - 136, 1120], [hx0 - 116, 1060], [hx0 - 94, hy0 + 72], [hx0 - 78, hy0 + 20], [hx0 - 70, hy0 - 34], [hx0 - 48, hy0 - 72]];
  const hair = c => blobPath(c, outline);
  paint(q, hair, vgrad(q, hy0 - 84, 1320, [[0, '#5A3A2C'], [.25, SK.hair], [1, '#251614']]), { edge: .5, edgeCol: '#120A09', edgeW: 2.4, tex: .14 });
  q.save(); q.beginPath(); hair(q); q.clip();
  // lock separations: dark grooves + warm sheen sweeps, all flowing from the crown and fanning out
  for (let i = 0; i < 16; i++) { const u = i / 15, x0 = lerp(hx0 - 56, hx0 + 52, u), x1 = lerp(hx0 - 150, hx0 + 100, u) + (r2() - .5) * 20, wav = (r2() - .5) * 26;
    q.strokeStyle = i % 2 ? 'rgba(15,8,6,.45)' : 'rgba(150,100,74,.32)'; q.lineWidth = i % 2 ? 2.6 : 4;
    q.beginPath(); q.moveTo(lerp(hx0, x0, .4), hy0 - 70); q.bezierCurveTo(x0, hy0 + 40, lerp(x0, x1, .45) + wav, 1110, x1 + wav * .4 + sw, 1320); q.stroke(); }
  // broad soft crown sheen (light from the window above)
  const g = q.createRadialGradient(hx0 + 6, hy0 - 50, 4, hx0 + 6, hy0 - 40, 70); g.addColorStop(0, 'rgba(190,140,110,.45)'); g.addColorStop(1, 'rgba(190,140,110,0)'); q.fillStyle = g; q.fillRect(hx0 - 80, hy0 - 120, 170, 160);
  q.restore();
  // a few loose locks outside the silhouette + fine flyaways
  [[hx0 - 136, 1150, -1], [hx0 + 96, 1190, 1]].forEach(([x, y, d]) => { q.strokeStyle = SK.hair; q.lineWidth = 6; q.lineCap = 'round'; q.beginPath(); q.moveTo(x, y - 60); q.quadraticCurveTo(x + d * 18, y, x + d * 6, y + 70 + sw); q.stroke(); });
  strands(q, [[hx0 - 66, hy0 - 40, -1, -.15], [hx0 + 64, hy0 - 30, 1, -.1], [hx0 - 120, 1080, -1, .4], [hx0 + 80, 1100, 1, .5]], 14, r, '#2E1E1A', 26, 1.2);
  // the chair back in front of her
  q.save(); q.lineCap = 'round';
  paint(q, c => { c.moveTo(552, 1196); c.quadraticCurveTo(650, 1176, 748, 1196); c.lineTo(748, 1226); c.quadraticCurveTo(650, 1206, 552, 1226); c.closePath(); }, SK.chairL, { edge: .45 });
  paint(q, c => rr(c, 566, 1210, 22, 200, 6), SK.chair, { edge: .45 }); paint(q, c => rr(c, 712, 1210, 22, 200, 6), SK.chair, { edge: .45 });
  paint(q, c => rr(c, 588, 1300, 124, 14, 5), SK.chair, { edge: .4 });
  paint(q, c => rr(c, 530, 1390, 240, 22, 6), SK.chairL, { edge: .45 });
  paint(q, c => rr(c, 548, 1412, 20, 228, 5), SK.chair, { edge: .45 }); paint(q, c => rr(c, 732, 1412, 20, 228, 5), SK.chair, { edge: .45 });
  q.fillStyle = 'rgba(255,230,190,.35)'; q.fillRect(560, 1196, 180, 3);
  q.restore();
  // reaching right arm (pulls the lamp cord)
  if (pose.reach > .01) {
    const e = ease(pose.reach), sx = 800, sy = 1112 + br, restX = 820, restY = 1300;
    const tx = lerp(restX, CORD.x - 4, e), ty = lerp(restY, CORD.bot + 18, e) + pose.tug * 26;
    const [ex, ey] = solveArm(sx, sy, tx, ty, 140, 140, -1);
    sleeve(q, [[sx, sy], [lerp(sx, ex, .5), lerp(sy, ey, .5)], [ex, ey], [lerp(ex, tx, .5), lerp(ey, ty, .5)], [tx, ty]], 74, 54);
    // cuff + little hand pinching the cord
    const a = Math.atan2(ty - ey, tx - ex);
    q.save(); q.translate(tx, ty); q.rotate(a);
    paint(q, c => rr(c, -14, -30, 26, 60, 10), SK.knitS, { edge: .35, edgeCol: '#6A3A3E' });
    paint(q, c => ellipse(c, 22, 0, 18, 15), SK.skin, { edge: .35, edgeCol: '#8A5040' });
    q.restore();
  }
  return { hx: hx0, hy: hy0 };
}

// sleeping at the desk: arms folded as a pillow, head turned to the right, headphones on
function drawGirlSleep(t) {
  const q = GIRL.c.getContext('2d'), r = rng(57); q.setTransform(1, 0, 0, 1, -GB.x, -GB.y); q.clearRect(GB.x, GB.y, GB.w, GB.h);
  const br = Math.sin(t * 1.1) * 3;     // slow sleepy breathing
  // folded arms on the desk (left arm reaches across, right arm under the head)
  sleeve(q, [[470, 1222], [560, 1240], [660, 1246], [770, 1236]], 66, 70);
  sleeve(q, [[840, 1150 + br], [830, 1210], [760, 1246], [650, 1252]], 76, 66);
  paint(q, c => rr(c, 446, 1196, 34, 56, 12), SK.knitS, { edge: .35, edgeCol: '#6A3A3E' });
  // back, rounded forward
  const body = c => { c.moveTo(600, 1150 + br); c.bezierCurveTo(540, 1150, 492, 1180, 474, 1230 + br); c.bezierCurveTo(452, 1290, 450, 1350, 448, 1395); c.lineTo(858, 1395); c.bezierCurveTo(860, 1300, 860, 1210, 838, 1160 + br); c.bezierCurveTo(800, 1120, 700, 1128, 640, 1140 + br); c.closePath(); };
  paint(q, body, vgrad(q, 1130, 1395, [[0, SK.knitL], [.3, SK.knit], [1, SK.knitS]]), { edge: .35, edgeCol: '#6A3A3E', tex: .2 });
  q.save(); q.beginPath(); body(q); q.clip(); knitRibs(q, 440, 870, 1120, 1400); q.restore();
  // bare shoulder
  paint(q, c => { c.moveTo(600, 1148 + br); c.bezierCurveTo(560, 1150, 520, 1168, 500, 1196 + br); c.bezierCurveTo(540, 1186, 590, 1176, 630, 1170 + br); c.closePath(); }, SK.skin, { edge: .25, edgeCol: '#8A5040' });
  q.strokeStyle = SK.knitS; q.lineWidth = 20; q.lineCap = 'round'; q.beginPath(); q.moveTo(498, 1204 + br); q.bezierCurveTo(580, 1178, 660, 1160, 780, 1150 + br); q.stroke(); q.strokeStyle = SK.knit; q.lineWidth = 14; q.stroke();
  // head resting on the arm, face toward the right (closed eyes)
  q.save(); q.translate(735, 1172 + br * .5); q.rotate(.32);
  // face
  const face = c => blobPath(c, [[-10, -70], [40, -62], [70, -30], [80, 10], [72, 44], [50, 66], [14, 74], [-30, 60], [-60, 20], [-58, -30]]);
  paint(q, face, vgrad(q, -70, 74, [[0, SK.skin], [1, '#EDC1A6']]), { edge: .35, edgeCol: '#8A5040', tex: .08 });
  q.fillStyle = SK.blush; q.globalAlpha = .45; q.beginPath(); ellipse(q, 46, 30, 18, 10, .2); q.fill(); q.globalAlpha = 1;
  q.strokeStyle = '#4A2C24'; q.lineWidth = 3.2; q.lineCap = 'round'; q.beginPath(); q.moveTo(24, 4); q.quadraticCurveTo(42, 16, 60, 6); q.stroke();      // closed eye
  q.lineWidth = 2; for (let i = 0; i < 4; i++) { const u = .2 + i * .22, x = lerp(26, 58, u), y = 8 + Math.sin(u * Math.PI) * 6; q.beginPath(); q.moveTo(x, y); q.lineTo(x + 2, y + 6); q.stroke(); }
  q.lineWidth = 2.4; q.strokeStyle = 'rgba(70,40,32,.7)'; q.beginPath(); q.moveTo(26, -16); q.quadraticCurveTo(44, -24, 62, -16); q.stroke();             // brow
  q.strokeStyle = 'rgba(150,80,70,.6)'; q.lineWidth = 2; q.beginPath(); q.moveTo(74, 30); q.quadraticCurveTo(80, 36, 76, 40); q.stroke();                  // nose tip
  q.beginPath(); q.moveTo(58, 54); q.quadraticCurveTo(64, 58, 70, 54); q.stroke();                                                                         // tiny mouth
  // hair over the head and spilling across the arms
  const hair = c => blobPath(c, [[-80, -60], [-30, -92], [30, -88], [70, -58], [52, -38], [10, -42], [-6, -6], [-20, 40], [-10, 90], [-60, 120], [-120, 140], [-190, 120], [-230, 60], [-200, 10], [-140, -30]]);
  paint(q, hair, vgrad(q, -90, 140, [[0, SK.hairM], [.5, SK.hair], [1, '#2A1A17']]), { edge: .45, edgeCol: '#160D0B' });
  q.save(); q.beginPath(); hair(q); q.clip(); for (let i = 0; i < 10; i++) { q.strokeStyle = i % 3 ? 'rgba(20,10,8,.35)' : 'rgba(130,85,62,.45)'; q.lineWidth = 2.5; q.beginPath(); q.moveTo(20 - i * 10, -85); q.bezierCurveTo(-20 - i * 14, -20, -60 - i * 12, 60, -100 - i * 12, 130); q.stroke(); } q.restore();
  // fringe strands across the forehead
  q.strokeStyle = SK.hair; q.lineWidth = 7; q.lineCap = 'round'; q.beginPath(); q.moveTo(20, -60); q.quadraticCurveTo(40, -40, 34, -18); q.moveTo(46, -56); q.quadraticCurveTo(66, -34, 62, -12); q.stroke();
  strands(q, [[-200, 60, -1, .3], [-120, 130, -.5, 1], [60, -60, 1, -.4], [-60, -80, -.3, -1]], 16, r, SK.hair, 40, 1.4);
  // headphones on: band over the top of the head, cup on the upper ear
  q.strokeStyle = SK.hpS; q.lineWidth = 12; q.beginPath(); q.moveTo(-40, -110); q.quadraticCurveTo(-20, -40, -50, 10); q.stroke(); q.strokeStyle = SK.hp; q.lineWidth = 8; q.stroke();
  paint(q, c => ellipse(c, -34, -16, 34, 40, .3), SK.hp, { edge: .4, edgeCol: '#5A5550' }); paint(q, c => ellipse(c, -30, -14, 18, 24, .3), SK.hpA, { edge: .2 });
  q.restore();
  // chair back
  paint(q, c => { c.moveTo(552, 1236); c.quadraticCurveTo(650, 1216, 748, 1236); c.lineTo(748, 1266); c.quadraticCurveTo(650, 1246, 552, 1266); c.closePath(); }, SK.chairL, { edge: .45 });
  paint(q, c => rr(c, 566, 1250, 22, 160, 6), SK.chair, { edge: .45 }); paint(q, c => rr(c, 712, 1250, 22, 160, 6), SK.chair, { edge: .45 });
  paint(q, c => rr(c, 530, 1390, 240, 22, 6), SK.chairL, { edge: .45 });
  paint(q, c => rr(c, 548, 1412, 20, 228, 5), SK.chair, { edge: .45 }); paint(q, c => rr(c, 732, 1412, 20, 228, 5), SK.chair, { edge: .45 });
}
// light the girl layer with the room's lightmaps (lights: 1 = room lights on, 0 = only desk lamp)
function litGirl(lights, rimWarm = 0) {
  const c = GIRL.c, a = GIRL.a, q = c.getContext('2d'), qa = a.getContext('2d');
  qa.clearRect(0, 0, GB.w, GB.h); qa.drawImage(c, 0, 0);
  q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'multiply';
  if (lights > .001) { q.globalAlpha = 1; q.drawImage(ROOM.lmOn, GB.x, GB.y, GB.w, GB.h, 0, 0, GB.w, GB.h); }
  if (lights < .999) { // blend: draw dark lightmap weighted by (1-lights) on a copy
    const tmp = GIRL.tmp || (GIRL.tmp = mk(GB.w, GB.h)), tq = tmp.getContext('2d');
    tq.globalCompositeOperation = 'source-over'; tq.clearRect(0, 0, GB.w, GB.h); tq.drawImage(a, 0, 0); tq.globalCompositeOperation = 'multiply'; tq.drawImage(ROOM.lmOff, GB.x, GB.y, GB.w, GB.h, 0, 0, GB.w, GB.h);
    q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1 - lights; q.drawImage(tmp, 0, 0); q.globalAlpha = 1;
  }
  q.globalCompositeOperation = 'source-atop';
  // rim lights: cool window edge on top of hair/shoulders, warm lamp on her left side
  glow(q, 650 - GB.x, 760 - GB.y, 420, '#7FA0D8', .35 * (1 - lights), 'source-atop');
  glow(q, 470 - GB.x, 1150 - GB.y, 260, '#FFB56A', (.35 + rimWarm) * (1 - lights * .6), 'source-atop');
  q.globalCompositeOperation = 'destination-in'; q.drawImage(a, 0, 0); q.globalCompositeOperation = 'source-over';
  return c;
}
