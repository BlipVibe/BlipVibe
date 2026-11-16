"""Witchcraft: kit/redraw-a + redraw-b PNGs -> assets/*.webp, plus photo masks for the framed pieces.
usage: witchcraft_convert.py <skin_dir> [parts, default abc]
For each frame with a transparent window (tarot-card, photo-arch, skin-card, avatar-arch, featured-frame) it writes
<name>-mask.webp (the window grown 6px, so the photo runs just under the frame line) and prints the window's box as
percentages of the art (left top right bottom) for the CSS."""
import sys, os, glob, numpy as np
from PIL import Image
from scipy import ndimage as ndi

skin = sys.argv[1]
out = os.path.join(skin, 'assets')
WINDOWED = ['tarot-card', 'photo-arch', 'skin-card', 'avatar-arch', 'featured-frame', 'avatar-arch-small']
parts = sys.argv[2] if len(sys.argv) > 2 else 'abc'
for f in sorted(glob.glob(os.path.join(skin, 'kit/redraw-[' + parts + ']/*.png'))):
    name = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f).convert('RGBA')
    if name == 'background':
        im = im.convert('RGB')
    im.save(os.path.join(out, name + '.webp'), 'WEBP', quality=86, method=4)
    if name in WINDOWED:
        a = np.array(im)[..., 3] > 60
        lab, _ = ndi.label(~a)
        h, w = a.shape
        win = lab == lab[int(h * .55), w // 2]
        if win[0, 0] or win.sum() > .9 * w * h:      # window leaked to the outside: frame not closed
            print(name, 'WINDOW NOT CLOSED'); continue
        ys, xs = np.where(win)
        print(f'{name}: window {xs.min()/w*100:.1f}% {ys.min()/h*100:.1f}% {100-xs.max()/w*100:.1f}% {100-ys.max()/h*100:.1f}% (l t r b insets)')
        m = ndi.gaussian_filter((ndi.distance_transform_edt(~win) <= 6).astype(float), 1.0)
        mk = Image.new('RGBA', (w, h), (0, 0, 0, 0)); mk.putalpha(Image.fromarray((m * 255).astype(np.uint8)))
        mk.save(os.path.join(out, name + '-mask.webp'), 'WEBP', quality=90)
print('converted')
