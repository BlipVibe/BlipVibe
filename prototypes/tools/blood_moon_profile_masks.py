"""Blood Moon: per-window masks for the profile composition (profile-windows.png → assets[/silver]/profile-mask-1..3.webp).
Mask = every transparent area INSIDE the frame's silhouette (the 3 openings + the little pockets between bars, roses and the
bottom arch, so no hole ever shows the sky), split by nearest window (1 = left arch, 2 = bottom arch, 3 = right arch), minus
specks in the spire tips. Prints each window's box (l t w h, %) for the CSS. usage: blood_moon_profile_masks.py <skin_dir>"""
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
skin = sys.argv[1]; st = np.ones((3, 3), bool); geo = {}
for r, out in (('crimson', 'assets'), ('silver', 'assets/silver')):
    a = np.array(Image.open(f'{skin}/kit/{r}/profile-windows.png').convert('RGBA'))[..., 3]; h, w = a.shape
    frame = a > 40
    interior = ndi.binary_fill_holes(ndi.binary_closing(frame, structure=st, iterations=6))
    m = ~frame & interior
    core = ndi.binary_erosion(m, structure=st, iterations=34); l2, k = ndi.label(core)
    sz = ndi.sum(core, l2, range(1, k + 1)); keep = list(np.argsort(sz)[::-1][:3] + 1)
    cen = {c: ndi.center_of_mass(l2 == c) for c in keep}
    sides = sorted([c for c in keep if cen[c][0] <= h * .6], key=lambda c: cen[c][1]); bottom = [c for c in keep if cen[c][0] > h * .6]
    slots = {1: sides[0], 3: sides[1], 2: bottom[0]}
    owner = np.argmin(np.stack([ndi.distance_transform_edt(l2 != slots[i]) for i in (1, 2, 3)]), axis=0) + 1
    full = ndi.binary_dilation(m, structure=st, iterations=8) & (frame | m)   # grow only UNDER the opaque frame, never into sky
    for i in (1, 2, 3):
        mi = full & (owner == i); lab, n = ndi.label(mi)
        for j in range(1, n + 1):
            ys, xs = np.where(lab == j)
            if len(ys) < 1500 and ys.mean() < h * .25: mi[lab == j] = False   # spire-tip specks
        img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); img.putalpha(Image.fromarray((mi * 255).astype(np.uint8)))
        img.save(f'{skin}/{out}/profile-mask-{i}.webp', 'WEBP', quality=90)
        ys, xs = np.where(mi)
        geo[f'{r}-{i}'] = [round(xs.min() / w * 100, 2), round(ys.min() / h * 100, 2), round((xs.max() - xs.min() + 1) / w * 100, 2), round((ys.max() - ys.min() + 1) / h * 100, 2)]
print(json.dumps(geo))
