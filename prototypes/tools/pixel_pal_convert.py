"""Pixel Pal (Blip Vibe look of the default skin): images/skins/blip/kit/pixel-pal/*.png -> assets/pixel-pal/*.webp.
usage: python3 prototypes/tools/pixel_pal_convert.py   (repo root). Prints the parts list for FULL_SKINS.blip.variants art.
- masks are stepped (pixel corners) like the concept's photos/cover; avatar-mask = avatar-frame's round window."""
import os, glob, json
from PIL import Image, ImageDraw
K = 'images/skins/blip/kit/pixel-pal'; O = 'images/skins/blip/assets/pixel-pal'; os.makedirs(O, exist_ok=True)
def step_mask(w, h, step, n, name):
    # rectangle whose corners are cut in n pixel steps of `step` px (the concept's notched pixel corners)
    m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m); d.rectangle((0, 0, w - 1, h - 1), fill=255)
    for i in range(n):
        c = (n - i) * step; y0 = i * step; y1 = (i + 1) * step - 1
        for x0, x1 in ((0, c - 1), (w - c, w - 1)):
            d.rectangle((x0, y0, x1, y1), fill=0); d.rectangle((x0, h - 1 - y1, x1, h - 1 - y0), fill=0)
    o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(m); o.save(f'{O}/{name}.webp', 'WEBP', lossless=True)
step_mask(1290, 560, 9, 3, 'cover-mask'); step_mask(300, 300, 6, 2, 'photo-mask'); step_mask(600, 600, 10, 3, 'skin-card-mask')
# icons Codex re-subjected: pixelate the Logo Classic shape in forest green
for n in ('icon-font', 'icon-gif'):
    src = Image.open(f'images/skins/blip/kit/{n}.png').convert('RGBA'); a = src.getchannel('A')
    g = Image.new('RGBA', src.size, (31, 59, 45, 255)); g.putalpha(a)
    w, h = g.size; px = g.resize((w // 6, h // 6), Image.BOX)
    px.putalpha(px.getchannel('A').point(lambda v: 255 if v > 90 else 0))
    px.resize((w, h), Image.NEAREST).save(f'{K}/{n}.png')
WINDOWED = ['avatar-frame', 'avatar-ring', 'group-avatar-frame', 'story-ring', 'story-ring-seen', 'swatch-ring']
art = ['cover-mask', 'photo-mask', 'skin-card-mask']
for f in sorted(glob.glob(f'{K}/*.png')):
    name = os.path.splitext(os.path.basename(f))[0]
    if name.startswith('_') or name == 'card': continue
    im = Image.open(f).convert('RGBA'); dst = f'{O}/{name}.webp'
    if name == 'background': im.convert('RGB').save(dst, 'WEBP', quality=88, method=6)
    else: im.save(dst, 'WEBP', lossless=True, method=6)   # pixel art: lossless keeps the hard steps
    art.append(name)
    if name == 'avatar-frame':
        w, h = im.size; bw = im.getchannel('A').point(lambda v: 255 if v > 60 else 0)
        ImageDraw.floodfill(bw, (w // 2, h // 2), 128); win = bw.point(lambda v: 255 if v == 128 else 0); l, t, r, b = win.getbbox()
        print(f'avatar-frame window {l/w*100:.1f}% {t/h*100:.1f}% {100-r/w*100:.1f}% {100-b/h*100:.1f}%')
        m = Image.new('L', (w * 2, h * 2), 0); ImageDraw.Draw(m).ellipse((l * 2 - 4, t * 2 - 4, r * 2 + 4, b * 2 + 4), fill=255)
        o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(m.resize((w, h), Image.LANCZOS)); o.save(f'{O}/avatar-mask.webp', 'WEBP', lossless=True)
        art.append('avatar-mask')
print(json.dumps(sorted(set(art))))
print('converted', len(os.listdir(O)), 'MB', round(sum(os.path.getsize(f'{O}/{x}') for x in os.listdir(O)) / 1e6, 2))
