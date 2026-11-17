"""Superhero: print (slot 1 = the biggest window) the CSS custom properties for the profile timeline slots + skin-card window of one rendition,
measured from its timeline-mask / skin-card-mask (run superhero_convert.py first; it prints the same boxes)."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
d = sys.argv[1]  # e.g. images/skins/superhero/kit/villains
def boxes(f, n):
    g = np.array(Image.open(f).convert('L')) > 128; h, w = g.shape; lab, k = ndi.label(g)
    s = ndi.sum(g, lab, range(1, k + 1)); out = []
    for i in np.argsort(s)[::-1][:n]:
        ys, xs = np.where(lab == i + 1); out.append((xs.min() / w * 100, ys.min() / h * 100, (xs.max() - xs.min() + 1) / w * 100, (ys.max() - ys.min() + 1) / h * 100))
    out.sort(key=lambda b: -b[2] * b[3]); return out[:1] + sorted(out[1:])   # biggest window = slot 1 (the cover photo), the rest left to right
for i, (l, t, w, h) in enumerate(boxes(d + '/timeline-mask.png', 3)):
    print(f'.fs-tl-slot-{i+1} {{ --sh-l: {l:.2f}%; --sh-t: {t:.2f}%; --sh-w: {w:.2f}%; --sh-h: {h:.2f}%; --sh-msx: {10000/w:.1f}%; --sh-msy: {10000/h:.1f}%; --sh-mx: {l/(100-w)*100:.2f}%; --sh-my: {t/(100-h)*100:.2f}%; }}')
l, t, w, h = boxes(d + '/skin-card-mask.png', 1)[0]
print(f'.fsk-card {{ --sh-cl: {l:.2f}%; --sh-ct: {t:.2f}%; --sh-cw: {w:.2f}%; --sh-ch: {h:.2f}%; }}')
