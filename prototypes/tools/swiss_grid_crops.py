"""Swiss Grid: crop each phone screen of a concept to 402pt wide overlay refs (images/skins/blip/ref/swiss-grid/ov-<page>-<a|b>.png).
Finds the bezels (dark runs >= 5px) on a row through the middle of the image. usage: swiss_grid_crops.py page [page...]"""
import sys, os
from PIL import Image
D = 'images/skins/default/swiss-grid'; O = 'images/skins/blip/ref/swiss-grid'; os.makedirs(O, exist_ok=True)
def runs(vals):
    out = []; s = p = None
    for v in vals:
        if s is None: s = v
        elif v != p + 1: out.append((s, p)); s = v
        p = v
    if s is not None: out.append((s, p))
    return out
for page in sys.argv[1:]:
    im = Image.open(f'{D}/{page}.png').convert('RGB'); W, H = im.size
    cols = None
    for y in (380, 520, 660, 800):   # bezels are vertical: dark columns present on every row
        d = set(x for x in range(W) if sum(im.getpixel((x, y))) < 150); cols = d if cols is None else cols & d
    bez = [r for r in runs(sorted(cols)) if 3 <= r[1] - r[0] <= 14]
    phones = []; used = set()
    for i in range(len(bez)):
        for j in range(i + 1, len(bez)):
            l, r = bez[i], bez[j]
            if 400 < r[0] - l[1] < 560 and i not in used and j not in used: phones.append((l[1] + 1, r[0] - 1)); used |= {i, j}; break
    for n, (x0, x1) in enumerate(phones[:3]):
        cx = (x0 + x1) // 2; col = [yy for yy in range(H) if sum(im.getpixel((cx - 120, yy))) < 150]
        vb = [r for r in runs(col) if r[1] - r[0] >= 4]
        y0 = vb[0][1] + 1; y1 = vb[-1][0] - 1 if len(vb) > 1 else H - 1
        crop = im.crop((x0, y0, x1, y1)); s = 402 / crop.width
        crop.resize((402, round(crop.height * s)), Image.LANCZOS).save(f'{O}/ov-{page}-{"abc"[n]}.png')
        print(page, "abc"[n], (x0, y0, x1, y1), 'scale %.3f' % s)
