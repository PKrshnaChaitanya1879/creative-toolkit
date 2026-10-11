// usage: node render.js preview t1,t2,... | node render.js full
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const D = __dirname;
const fontMap = Object.fromEntries(fs.readFileSync(path.join(D, 'fonts/map.txt'), 'utf8').trim().split('\n').map(l => l.split(' ')));
(async () => {
  const mode = process.argv[2];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.route('**/*', async route => {
    const u = route.request().url();
    if (u.startsWith('http://wt.local/')) {
      const p = decodeURIComponent(u.slice('http://wt.local/'.length).split('#')[0]);
      if (!fs.existsSync(p.startsWith('bgf/') ? path.join(D, '../launch', p) : path.join(D, p))) return route.abort();
      const fp = p.startsWith('bgf/') ? path.join(D, '../launch', p) : path.join(D, p);
      return route.fulfill({ contentType: fp.endsWith('.jpg') ? 'image/jpeg' : 'text/html; charset=utf-8', body: fs.readFileSync(fp) });
    }
    if (fontMap[u] && u.includes('googleapis')) return route.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(D, fontMap[u])) });
    if (fontMap[u]) return route.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(path.join(D, fontMap[u])), headers: { 'access-control-allow-origin': '*' } });
    if (u.includes('d3.min.js')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(D, 'node_modules/d3/dist/d3.min.js')) });
    if (u.includes('topojson-client')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(D, 'node_modules/topojson-client/dist/topojson-client.min.js')) });
    return route.abort();
  });
  await page.goto('http://wt.local/launch.html#export');
  await page.evaluate(() => window.WT.ready);
  const grab = async t => {
    const fr = Math.min(1439, Math.round(t * 30)); await page.evaluate(src => WT.setBG(src), 'http://wt.local/bgf/f' + String(fr + 1).padStart(4, '0') + '.jpg');
    const b64 = await page.evaluate(t => { WT.renderAt(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.94).split(',')[1]; }, t);
    return Buffer.from(b64, 'base64');
  };
  if (mode === 'preview') {
    fs.mkdirSync(path.join(D, 'previewL'), { recursive: true });
    for (const t of process.argv[3].split(',').map(Number)) fs.writeFileSync(path.join(D, `previewL/t_${t.toFixed(2)}.jpg`), await grab(t));
  } else {
    const out = path.join(D, 'framesL'); fs.mkdirSync(out, { recursive: true });
    const FPS = 30, N = 48 * FPS;
    for (let f = 0; f < N; f++) fs.writeFileSync(path.join(out, `f${String(f).padStart(4, '0')}.jpg`), await grab(f / FPS));
  }
  await browser.close();
})();
