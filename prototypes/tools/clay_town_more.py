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
# Masks, like Pixel Pal ships its own (pixel_pal_convert.py): Clay Town's are soft rounded clay slabs measured from the
# concepts (cover 11pt radius on a ~396pt cover, photos 9pt on 116pt, store cards ~10pt), avatar-mask = the clay
# avatar-frame's round window. Same canvases as Logo Classic's masks.
from PIL import ImageDraw
def round_mask(w, h, r, name):
    m = Image.new('L', (w * 4, h * 4), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), r * 4, fill=255)
    o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(m.resize((w, h), Image.LANCZOS)); o.save(A + name + '.webp', 'WEBP', lossless=True)
round_mask(1290, 560, 36, 'cover-mask'); round_mask(300, 300, 23, 'photo-mask'); round_mask(600, 600, 40, 'skin-card-mask')
fr = Image.open(A + 'avatar-frame.webp').convert('RGBA'); w, h = fr.size
bw = fr.getchannel('A').point(lambda v: 255 if v > 60 else 0); ImageDraw.floodfill(bw, (w // 2, h // 2), 128)
l, t, r, b = bw.point(lambda v: 255 if v == 128 else 0).getbbox()
m = Image.new('L', (w * 2, h * 2), 0); ImageDraw.Draw(m).ellipse((l * 2 - 4, t * 2 - 4, r * 2 + 4, b * 2 + 4), fill=255)
o = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o.putalpha(m.resize((w, h), Image.LANCZOS)); o.save(A + 'avatar-mask.webp', 'WEBP', lossless=True)
print('masks done; avatar window', (l, t, r, b))
