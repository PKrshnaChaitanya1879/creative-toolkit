"""Tile images into one contact sheet so a whole video/poster set can be checked in one look.
Usage: python3 contact_sheet.py out.jpg img1 img2 ... [--cols 4] [--w 480]"""
import sys
from PIL import Image, ImageDraw
a = sys.argv[1:]; cols = int(a[a.index('--cols') + 1]) if '--cols' in a else 4; w = int(a[a.index('--w') + 1]) if '--w' in a else 480
files = [x for i, x in enumerate(a[1:], 1) if not x.startswith('--') and a[i - 1] not in ('--cols', '--w')]
ims = [Image.open(f).convert('RGB') for f in files]; h = int(w * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols; S = Image.new('RGB', (cols * w, rows * (h + 22)), (20, 20, 22)); d = ImageDraw.Draw(S)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * w, (i // cols) * (h + 22); S.paste(im.resize((w, h)), (x, y)); d.text((x + 6, y + h + 5), f.split('/')[-1], fill=(200, 200, 200))
S.save(a[0], quality=88); print('saved', a[0], S.size)
