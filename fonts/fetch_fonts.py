"""Download Google Fonts (latin subset) into this folder and append @font-face rules to fonts.css.
Usage: python3 fetch_fonts.py "Geist:wght@400;700" "Space Grotesk:wght@500;700" ...
Then in HTML: <link rel="stylesheet" href="<toolkit>/fonts/fonts.css">  (or /tk/fonts/fonts.css via render_canvas.js)"""
import sys, re, os, hashlib, urllib.request
D = os.path.dirname(os.path.abspath(__file__)); UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': UA})).read()
css_path = os.path.join(D, 'fonts.css'); have = open(css_path).read() if os.path.exists(css_path) else ''; out = []
for fam in sys.argv[1:]:
    css = get('https://fonts.googleapis.com/css2?family=' + fam.replace(' ', '+') + '&display=swap').decode()
    for sub, block in re.findall(r'/\* (\S+) \*/\s*(@font-face \{.*?\})', css, re.S):
        if sub != 'latin': continue
        u = re.search(r'url\((https://[^)]+)\)', block).group(1); fn = hashlib.md5(u.encode()).hexdigest()[:10] + '.woff2'
        if not os.path.exists(os.path.join(D, fn)): open(os.path.join(D, fn), 'wb').write(get(u))
        b = block.replace(u, fn)
        if b not in have: out.append(b)
open(css_path, 'a').write('\n' + '\n'.join(out)); print('added', len(out), 'faces')
