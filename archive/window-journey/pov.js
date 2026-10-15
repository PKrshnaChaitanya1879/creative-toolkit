// ---------- first-person view: one pane of the window, sill, desk, sweater paws around a mug ----------
const OP = { x: 80, y: 110 };            // opening top-left on screen (opening size OW x OH)
let POV = {};
function buildPOV() {
  const c = mk(W, H), q = c.getContext('2d'), r = rng(88);
  // dim wall, warm from the lamp at lower left
  paint(q, x => x.rect(0, 0, W, H), vgrad(q, 0, H, [[0, '#2A2A44'], [.7, '#3A3450'], [1, '#4A3A44']]), { edge: 0, tex: .25 });
  // frame: mullion (left), frame (right), transom (top), sill
  paint(q, x => x.rect(0, 40, 80, 1600), '#5E3C28', { edge: .4 });
  paint(q, x => x.rect(1000, 40, 80, 1600), '#5E3C28', { edge: .4 });
  paint(q, x => x.rect(0, 40, W, 70), '#6A4430', { edge: .4 });
  q.fillStyle = 'rgba(255,220,180,.15)'; q.fillRect(74, 110, 6, 1440); q.fillRect(1000, 110, 5, 1440); q.fillRect(80, 104, 920, 6);
  q.clearRect(OP.x, OP.y, OW, OH);
  paint(q, x => { x.moveTo(30, 1550); x.lineTo(1050, 1550); x.lineTo(1080, 1622); x.lineTo(0, 1622); x.closePath(); }, '#8A5A38', { edge: .45 });
  paint(q, x => x.rect(0, 1622, W, 26), '#5A3A26', { edge: 0 });
  // the round plant from the room's sill (continuity), and the little glass bottle
  pottedPlant(q, 860, 1560, 1.9, r, '#E9DDC3', 'round');
  paint(q, x => { x.moveTo(960, 1560); x.lineTo(960, 1460); x.quadraticCurveTo(960, 1420, 980, 1405); x.lineTo(980, 1370); x.lineTo(1000, 1370); x.lineTo(1000, 1405); x.quadraticCurveTo(1020, 1420, 1020, 1460); x.lineTo(1020, 1560); x.closePath(); }, 'rgba(120,180,170,.7)', { edge: .3 });
  // desk
  paint(q, x => x.rect(0, 1648, W, H - 1648), vgrad(q, 1648, H, [[0, '#9C6A40'], [1, '#B07848']]), { edge: 0, tex: .2 });
  for (let i = 0; i < 6; i++) { q.strokeStyle = 'rgba(80,50,30,.18)'; q.lineWidth = 2; q.beginPath(); q.moveTo(0, 1680 + i * 42); q.bezierCurveTo(300, 1670 + i * 44, 700, 1690 + i * 40, W, 1676 + i * 43); q.stroke(); }
  // notebook + pencil on the desk
  paint(q, x => { x.moveTo(60, 1700); x.lineTo(330, 1690); x.lineTo(350, 1900); x.lineTo(40, 1910); x.closePath(); }, '#F1E7D2', { edge: .3 });
  q.strokeStyle = 'rgba(120,140,170,.35)'; q.lineWidth = 2; for (let i = 0; i < 7; i++) { q.beginPath(); q.moveTo(70, 1730 + i * 24); q.lineTo(332, 1722 + i * 24); q.stroke(); }
  q.strokeStyle = '#D9A441'; q.lineWidth = 10; q.lineCap = 'round'; q.beginPath(); q.moveTo(120, 1880); q.lineTo(300, 1760); q.stroke();
  // lamp light
  const lamp = mk(W, H), lq = lamp.getContext('2d'); lq.fillStyle = '#6A6488'; lq.fillRect(0, 0, W, H);
  glow(lq, 120, 1750, 1100, '#FFC27A', 1, 'lighter'); glow(lq, 200, 1700, 500, '#FFD9A0', .6, 'lighter');
  const cp0 = mk(W, H); cp0.getContext('2d').drawImage(c, 0, 0);
  q.globalCompositeOperation = 'multiply'; q.drawImage(lamp, 0, 0); q.globalCompositeOperation = 'destination-in'; q.drawImage(cp0, 0, 0); q.globalCompositeOperation = 'source-over';
  POV.bg = c;
  // mug + sweater paws (drawn separately so they can breathe)
  const m = mk(W, 520), mq = m.getContext('2d'); mq.translate(0, -1400);
  paint(mq, x => { x.moveTo(460, 1700); x.lineTo(660, 1700); x.lineTo(650, 1860); x.quadraticCurveTo(560, 1880, 470, 1860); x.closePath(); }, '#EDE2CC', { edge: .45 });
  paint(mq, x => ellipse(x, 560, 1700, 100, 22), '#5A3424', { edge: .3 }); paint(mq, x => ellipse(x, 560, 1704, 86, 15), '#7A4A30', { edge: 0 });
  mq.fillStyle = '#C2643F'; mq.fillRect(466, 1760, 190, 22);
  const paw = (pts, cuffAt, ang) => { sleeve(mq, pts, 150, 120); mq.save(); mq.translate(...cuffAt); mq.rotate(ang); paint(mq, x => rr(x, -30, -66, 60, 132, 22), SK.knitS, { edge: .4, edgeCol: '#6A3A3E' });
    for (let i = 0; i < 4; i++) paint(mq, x => ellipse(x, 44, -36 + i * 24, 20, 12), SK.skin, { edge: .4, edgeCol: '#8A5040' }); mq.restore(); };
  paw([[60, 2000], [220, 1900], [400, 1800]], [420, 1792], -.25);
  mq.save(); mq.translate(W, 0); mq.scale(-1, 1); paw([[60, 2000], [220, 1900], [400, 1800]], [420, 1792], -.25); mq.restore();
  const lamp2 = mk(W, 520), l2 = lamp2.getContext('2d'); l2.drawImage(lamp, 0, 1400, W, 520, 0, 0, W, 520);
  mq.setTransform(1, 0, 0, 1, 0, 0); mq.globalCompositeOperation = 'source-atop'; mq.globalAlpha = 1;
  const cp = mk(W, 520); cp.getContext('2d').drawImage(m, 0, 0); mq.globalCompositeOperation = 'multiply'; mq.drawImage(lamp2, 0, 0); mq.globalCompositeOperation = 'destination-in'; mq.drawImage(cp, 0, 0);
  POV.mug = m;
}
function steam(q, t, a) { q.save(); q.lineCap = 'round'; for (let i = 0; i < 3; i++) { q.strokeStyle = `rgba(255,245,230,${.18 * a})`; q.lineWidth = 14; q.beginPath(); const x0 = 520 + i * 40; for (let k = 0; k < 12; k++) { const y = 1680 - k * 22, x = x0 + Math.sin(k * .6 - t * 2 + i * 2) * 14; k ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke(); } q.restore(); }
// what the world outside looks like right now (home view, the five worlds with mist between, or night)
function outsideAt(q, t) {
  if (t < T.journey) { // still at "home", then the view starts sliding as the house becomes a train
    const s = S(t) * .18, sw = OH * ROOM.home.width / ROOM.home.height; q.drawImage(ROOM.home, -s % sw, 0, sw, OH); q.drawImage(ROOM.home, -s % sw + sw, 0, sw, OH);
    return { rain: 1, slantOut: S(t) > 1 ? .6 : 0, glass: 1, tint: '#5A6EA8', tintA: .15, fallCol: '200,215,240' };
  }
  let idx = Math.min(4, Math.floor((t - T.journey) / T.scene));
  drawWorld(q, SCN[idx], t);
  return SCN[idx].weather;
}
function mistAt(t) { // soft fog peaks on every scene boundary
  let m = 0; for (let i = 0; i <= 4; i++) { const b = T.journey + i * T.scene; m = Math.max(m, 1 - Math.abs(t - b) / .75); }
  return smooth(clamp(m));
}
function povView(q, t) {
  const z = lerp(1.0, 1.1, ease(prog(t, T.pov, 5))), cx = 540, cy = lerp(1000, 880, ease(prog(t, T.pov, 5)));
  const moving = clamp(S(t) / 400), bob = moving * (Math.sin(t * 9.3) * 2.2 + Math.max(0, Math.sin(t * Math.PI * 2 / .55)) ** 12 * 5), roll = moving * Math.sin(t * .9) * .0035;
  q.save(); q.translate(W / 2, H / 2 + bob); q.rotate(roll); q.scale(z, z); q.translate(-cx, -cy);
  // outside
  q.save(); q.beginPath(); q.rect(OP.x, OP.y, OW, OH); q.clip(); q.translate(OP.x, OP.y + bob * .6);
  const wx = outsideAt(q, t);
  fallingRain(q, 0, 0, OW, OH, t, wx.rain, (wx.slantOut || 0) * moving, wx.fallCol);
  const mist = mistAt(t); if (mist > 0) { q.fillStyle = `rgba(226,232,238,${mist * .96})`; q.fillRect(0, 0, OW, OH); for (let i = 0; i < 4; i++) glow(q, ((i * 300 - S(t) * .9) % 1400 + 1400) % 1400 - 200, 300 + i * 320, 500, '#F4F6F8', mist * .8, 'source-over'); }
  q.translate(0, -bob * .6);
  if (wx.frost) { const g = q.createRadialGradient(OW / 2, OH / 2, OH * .3, OW / 2, OH / 2, OH * .75); g.addColorStop(0, 'rgba(240,246,255,0)'); g.addColorStop(1, 'rgba(240,246,255,.7)'); q.fillStyle = g; q.fillRect(0, 0, OW, OH); }
  glassRain(q, 0, 0, OW, OH, t, wx.glass, moving, null, wx.sun || 0);
  glow(q, 140, OH - 160, 260, '#FFB868', .18);      // lamp reflected in the glass
  q.restore();
  q.drawImage(POV.bg, 0, 0);
  // window light spilling onto the sill + frame (tinted by the world outside)
  glow(q, 540, 1560, 700, wx.tint, wx.tintA * (1 - mistAt(t) * .5));
  const breathe = Math.sin(t * 1.6) * 3; q.drawImage(POV.mug, 0, 1400 + breathe); steam(q, t, 1);
  q.restore();
}
