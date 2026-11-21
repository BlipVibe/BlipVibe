"""Clay Town kit fix-ups after the Codex pass (run from repo root, then clay_town_convert.py):
- profile medal ribbons blue -> terracotta (no blue in Clay Town);
- icon-font / icon-gif keep Logo Classic's letter shapes ("Aa", "GIF"), recoloured clay brown;
- background recoloured to the concept's terracotta clay page;
- chip-active = butter clay pill (every active tab in the concepts is butter yellow);
- tile-butter / tile-sage / tile-cream (nav + top-bar tiles) made from the clay nav-active tile."""
import glob, colorsys
from PIL import Image, ImageOps
K = 'images/skins/blip/kit/clay-town/'
def colorize(src, lo, hi, keep_alpha=True):
    im = Image.open(src).convert('RGBA'); a = im.getchannel('A')
    g = ImageOps.autocontrast(ImageOps.grayscale(im.convert('RGB')), cutoff=2)
    o = ImageOps.colorize(g, lo, hi).convert('RGBA'); o.putalpha(a); return o
for f in glob.glob(K + 'badge-*.png'):
    if 'count' in f: continue
    im = Image.open(f).convert('RGBA'); px = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 10: continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.55 < hh < 0.72 and s > 0.35:
                r2, g2, b2 = colorsys.hsv_to_rgb(0.045, min(1, s * .75), min(1, v * .95 + .08))
                px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    im.save(f)
for n in ['icon-font', 'icon-gif']:
    a = Image.open(f'images/skins/blip/kit/{n}.png').convert('RGBA').getchannel('A')
    o = Image.new('RGBA', a.size, (0x6b, 0x2f, 0x1c, 0)); o.putalpha(a); o.save(K + n + '.png')
bg = Image.open(K + 'background.png').convert('RGB')
if bg.getpixel((600, 1400))[1] > 140:   # still the pale peach Codex painted
    g = ImageOps.autocontrast(ImageOps.grayscale(bg), cutoff=1)
    o = Image.blend(ImageOps.colorize(g, (0xb9, 0x58, 0x3a), (0xe4, 0x7d, 0x5c)), Image.new('RGB', bg.size, (0xd6, 0x6c, 0x48)), .45)
    o.save(K + 'background.png')
colorize(K + 'chip-active.png', (0xd9, 0xa4, 0x38), (0xfb, 0xe0, 0x8a)).save(K + 'chip-active.png')
for n, lo, hi in [('tile-butter', (0xd9, 0xa4, 0x38), (0xfb, 0xe0, 0x8a)), ('tile-sage', (0x6c, 0x9e, 0x5e), (0xb8, 0xdc, 0xa8)),
                  ('tile-cream', (0xd8, 0xbf, 0x98), (0xfd, 0xf0, 0xda))]:
    colorize(K + 'nav-active.png', lo, hi).save(K + n + '.png')
print('fixups done')
# Home concept: Trending Groups is a sage pill; Following / Followers are soft cream-butter pills (no outline)
for n, lo, hi in [('pill-sage', (0x6c, 0x9e, 0x5e), (0xb8, 0xdc, 0xa8)), ('pill-cream', (0xd8, 0xb8, 0x80), (0xfa, 0xea, 0xc4))]:
    colorize(K + 'btn-primary.png', lo, hi).save(K + n + '.png')
