"""Clay Town: extra recoloured pieces made from the shipped clay webp art (run from repo root).
- pill-terra: terracotta clay pill (active feed tab in the Home concept: cream text on terracotta);
- panel-card-sage: the clay card in sage green (Featured Skin card in the Home concept)."""
from PIL import Image, ImageOps
A = 'images/skins/blip/assets/clay-town/'
def colorize(src, lo, hi):
    im = Image.open(A + src + '.webp').convert('RGBA'); a = im.getchannel('A')
    g = ImageOps.autocontrast(ImageOps.grayscale(im.convert('RGB')), cutoff=2)
    o = ImageOps.colorize(g, lo, hi).convert('RGBA'); o.putalpha(a); return o
colorize('btn-primary', (0x86, 0x26, 0x10), (0xe0, 0x62, 0x40)).save(A + 'pill-terra.webp', 'WEBP', quality=88, method=6)
colorize('panel-card', (0x7f, 0xa8, 0x77), (0xdd, 0xee, 0xd2)).save(A + 'panel-card-sage.webp', 'WEBP', quality=88, method=6)
print('more done')
