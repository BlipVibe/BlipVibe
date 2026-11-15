"""Rebuild Anime Blaze frame art with SMOOTH black ink defining the content space (no column/stair artefacts).
usage: frames.py <skin_dir> <out_dir>
 - cover-frame.png (1290x1105): both zigzags on one canvas; transparent photo window traced from the strokes;
   black ink = an 8px round outline of the strokes + everything outside the window (fading far from it).
 - cover-mask.png: window grown 4px (photo runs under the ink outline).
 - photo-frame.png: the post frame with a smooth 12px black band inside its window.
 - photo-mask.png: that window grown 4px.
"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi

skin, out = sys.argv[1], sys.argv[2]
def load(p): return np.array(Image.open(p).convert('RGBA')).astype(float)
def aa(mask_bool, r=1.0):
    return ndi.gaussian_filter(mask_bool.astype(float), r)

# ---------- cover ----------
W, H = 1290, 1105
canvas = np.zeros((H, W, 4))
top = load(f'{skin}/kit/redraw-a/cover-top.png'); bot = load(f'{skin}/kit/redraw-a/cover-cut.png')
def paste(img, y):
    h = img.shape[0]; a = img[..., 3:4] / 255.0
    region = canvas[y:y + h]
    ra = region[..., 3:4] / 255.0
    oa = a + ra * (1 - a)
    rgb = (img[..., :3] * a + region[..., :3] * ra * (1 - a)) / np.maximum(oa, 1e-6)
    canvas[y:y + h, :, :3] = rgb; canvas[y:y + h, :, 3:4] = oa * 255
paste(top, 0); paste(bot, H - bot.shape[0])
stroke = canvas[..., 3] > 40
d_stroke = ndi.distance_transform_edt(~stroke)          # distance to nearest stroke pixel
outline = d_stroke <= 1                                  # just the stroke itself (no band on the photo side)
free = ~outline
lab, _ = ndi.label(free)
window = lab == lab[H // 2, W // 2]                      # the photo band between the two lines
d_win = ndi.distance_transform_edt(~window)              # distance from the window (0 inside)
# ink alpha: solid near the window, fading after 150px out (blends into page / hides under the bar)
ink = np.clip(1 - (d_win - 150) / 150, 0, 1) * (~window)
# (no extra outline: the photo meets the white line directly)
ink = np.where(window, 0, ink)
ink = np.minimum(1, ink)
sa = canvas[..., 3] / 255.0
oa = sa + ink * (1 - sa)
bg = np.array([14, 14, 15.0])
rgb = (canvas[..., :3] * sa[..., None] + bg * (ink * (1 - sa))[..., None]) / np.maximum(oa[..., None], 1e-6)
Image.fromarray(np.dstack([rgb, oa * 255]).clip(0, 255).astype(np.uint8), 'RGBA').save(f'{out}/cover-frame.png')
mask = aa(ndi.distance_transform_edt(~window) <= 6, 1.0)   # photo runs ~6px UNDER the white line
m = Image.new('RGBA', (W, H), (0, 0, 0, 0)); m.putalpha(Image.fromarray((mask * 255).astype(np.uint8)))
m.save(f'{out}/cover-mask.png')

# ---------- post photo frame ----------
pf = load(f'{skin}/kit/redraw-a/photo-frame.png'); h, w = pf.shape[:2]
opaque = pf[..., 3] > 60
lab, _ = ndi.label(~opaque)
win = lab == lab[h // 2, w // 2]
d_in = ndi.distance_transform_edt(win)                   # inside distance to the frame line
band = np.zeros_like(d_in)   # photo flush to the frame line, no inner band
a = pf[..., 3] / 255.0
oa = a + band * (1 - a)
rgb = (pf[..., :3] * a[..., None] + bg * (band * (1 - a))[..., None]) / np.maximum(oa[..., None], 1e-6)
Image.fromarray(np.dstack([rgb, oa * 255]).clip(0, 255).astype(np.uint8), 'RGBA').save(f'{out}/photo-frame.png')
pm = aa(ndi.distance_transform_edt(~win) <= 6, 1.0)
m = Image.new('RGBA', (w, h), (0, 0, 0, 0)); m.putalpha(Image.fromarray((pm * 255).astype(np.uint8)))
m.save(f'{out}/photo-mask.png')
print('frames ok', W, H, w, h)
