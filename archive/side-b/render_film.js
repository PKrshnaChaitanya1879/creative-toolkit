// node render_film.js preview t1,t2,...   |   node render_film.js range <startFrame> <endFrame>
const { chromium } = require('/tmp/claude-0/-home-claude/90e23ac5-3cb5-5676-b10a-a3ccd53d36e8/scratchpad/wt/node_modules/playwright');
const fs = require('fs'), path = require('path');
const D = __dirname, FPS = 24;
const fontMap = Object.fromEntries(fs.readFileSync(path.join(D, 'fonts/map.txt'), 'utf8').trim().split('\n').map(l => l.split(' ')));
const TL = JSON.parse(fs.readFileSync(path.join(D, 'timeline.json'), 'utf8'));
const html = fs.readFileSync(path.join(D, 'overlay.html'), 'utf8').replace('/*TL*/{}', JSON.stringify({ tapes: TL.tapes, caps: TL.caps, title: TL.title, end_title: TL.end_title, credits: TL.credits }));
const NF = fs.readdirSync(path.join(D, 'bgf')).length;
(async () => {
  const mode = process.argv[2];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.route('**/*', async route => {
    const u = route.request().url();
    if (u.startsWith('http://film.local/')) {
      const p = decodeURIComponent(u.slice('http://film.local/'.length));
      if (p === 'index.html') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
      const fp = path.join(D, p); if (!fs.existsSync(fp)) return route.abort();
      return route.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync(fp) });
    }
    if (fontMap[u] && u.includes('googleapis')) return route.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(D, fontMap[u])) });
    if (fontMap[u]) return route.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(path.join(D, fontMap[u])), headers: { 'access-control-allow-origin': '*' } });
    return route.abort();
  });
  await page.goto('http://film.local/index.html');
  await page.evaluate(() => window.F.ready);
  const grab = async f => {
    const t = f / FPS, bf = Math.min(NF, f + 1);
    await page.evaluate(src => F.setBG(src), `http://film.local/bgf/f${String(bf).padStart(5, '0')}.jpg`);
    const b64 = await page.evaluate(t => { F.renderAt(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.92).split(',')[1]; }, t);
    return Buffer.from(b64, 'base64');
  };
  if (mode === 'preview') {
    fs.mkdirSync(path.join(D, 'prev'), { recursive: true });
    for (const t of process.argv[3].split(',').map(Number)) fs.writeFileSync(path.join(D, `prev/t_${t.toFixed(2).padStart(7, '0')}.jpg`), await grab(Math.round(t * FPS)));
  } else {
    const a = +process.argv[3], b = +process.argv[4], out = path.join(D, 'frames'); fs.mkdirSync(out, { recursive: true });
    for (let f = a; f < b; f++) {
      const fn = path.join(out, `f${String(f).padStart(5, '0')}.jpg`);
      if (fs.existsSync(fn)) continue;
      fs.writeFileSync(fn, await grab(f));
    }
  }
  await browser.close();
})();
