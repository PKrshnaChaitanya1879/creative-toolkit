// Generic frame renderer for canvas motion graphics.
// The page must expose: window.F = { ready: Promise, renderAt(t), setBG?(src) } and a <canvas id="cv">.
// Pages are served from a fake origin (http://studio.local/) so canvas is never tainted.
// Usage:
//   node render_canvas.js <dir> <page.html> --w 1920 --h 1080 --fps 30 --dur 30 [--bg bgf/f%04d.jpg] [--preview 1,5.5,12] [--out frames]
// Then: ffmpeg -framerate 30 -i frames/f%05d.jpg -i mix.wav -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 320k -shortest out.mp4
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const a = process.argv.slice(2), dir = path.resolve(a[0]), pageFile = a[1];
const opt = k => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : null; };
const W = +(opt('w') || 1920), H = +(opt('h') || 1080), FPS = +(opt('fps') || 30), DUR = +(opt('dur') || 10);
const BG = opt('bg'), PREV = opt('preview'), OUT = path.join(dir, opt('out') || (PREV ? 'preview' : 'frames'));
const TK = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  await page.route('**/*', route => {
    const u = route.request().url();
    if (!u.startsWith('http://studio.local/')) return route.abort();
    let p = decodeURIComponent(u.slice(20).split(/[?#]/)[0]);
    // /tk/... maps to the toolkit itself (fonts, shared js)
    const fp = p.startsWith('tk/') ? path.join(TK, p.slice(3)) : path.join(dir, p);
    if (!fs.existsSync(fp)) { console.log('404', p); return route.abort(); }
    return route.fulfill({ contentType: types[path.extname(fp).toLowerCase()] || 'application/octet-stream', body: fs.readFileSync(fp),
      headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto('http://studio.local/' + pageFile);
  await page.evaluate(() => window.F.ready);
  fs.mkdirSync(OUT, { recursive: true });
  const grab = async t => {
    if (BG) { const fr = Math.floor(t * FPS + .5) + 1; await page.evaluate(s => F.setBG(s), 'http://studio.local/' + BG.replace(/%0(\d)d/, (_, n) => String(fr).padStart(+n, '0'))); }
    const b64 = await page.evaluate(t => { F.renderAt(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.95).split(',')[1]; }, t);
    return Buffer.from(b64, 'base64');
  };
  if (PREV) for (const t of PREV.split(',').map(Number)) fs.writeFileSync(path.join(OUT, `t_${t.toFixed(2)}.jpg`), await grab(t));
  else { const N = Math.round(DUR * FPS); for (let f = 0; f < N; f++) { fs.writeFileSync(path.join(OUT, `f${String(f).padStart(5, '0')}.jpg`), await grab(f / FPS)); if (f % 150 === 0) console.log(f, '/', N); } }
  await browser.close();
})();
