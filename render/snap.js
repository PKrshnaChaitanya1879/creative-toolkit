// Screenshot any HTML page or poster to PNG (2x by default).
// Usage: node snap.js page.html out.png --w 1200 --h 1680 [--scale 2] [--full]
// Poster HTML can reference the toolkit fonts with <link rel="stylesheet" href="../../fonts/fonts.css"> or an absolute file path.
const { chromium } = require('playwright'); const path = require('path');
const a = process.argv.slice(2), opt = k => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : null; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: +(opt('w') || 1200), height: +(opt('h') || 1680) }, deviceScaleFactor: +(opt('scale') || 2) });
  await p.goto('file://' + path.resolve(a[0])); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const over = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth); if (over) console.log('WARNING: horizontal overflow');
  await p.screenshot({ path: a[1], fullPage: a.includes('--full') }); await b.close(); console.log('saved', a[1]);
})();
