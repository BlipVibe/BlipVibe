"""Good Witch Day: deepen the thin gold filigree on the pale frosted pieces so it doesn't bleed into the white glass
(owner, Nov 15: "see how the gold stuff bleeds into the white?").
Reads kit/gw/<name>.png, writes assets/<name>.webp. Gold = warm hue (18-58 deg) with some saturation; those pixels get
darker + more saturated, and a 1px darker halo is laid just outside each gold line so it reads against white.
usage: good_witch_gold.py <skin_dir>"""
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi

skin = sys.argv[1]
PIECES = ['stats-frame', 'edit-btn', 'list-row', 'post-panel', 'quests-frame', 'coin-pill', 'field', 'composer',
          'featured-frame', 'top-bar', 'nav-bar', 'join-btn', 'chip', 'seg-tab', 'skin-card', 'skin-card-wide',
          'bubble-in', 'comment-bubble', 'text-area', 'public-pill', 'tool-tile', 'action-tile', 'menu-panel',
          'input-bar', 'name-banner', 'photo-frame', 'coin-goal-bar', 'goal-track', 'story-ring', 'avatar-ring',
          'photo-bubble', 'nav-orb', 'story-add', 'plus-orb', 'arrow-orb']

def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0)
    return h, s, mx

for n in PIECES:
    src = os.path.join(skin, 'kit/gw', n + '.png')
    if not os.path.exists(src):
        continue
    im = np.array(Image.open(src).convert('RGBA')).astype(float)
    rgb = im[..., :3] / 255
    h, s, v = rgb_to_hsv(rgb)
    gold = (h > 18) & (h < 58) & (s > 0.22) & (im[..., 3] > 30)
    # darker, richer gold
    out = rgb.copy()
    deep = np.array([0.62, 0.43, 0.16])
    k = np.clip((s - 0.22) / 0.3, 0, 1)[..., None] * gold[..., None]
    out = out * (1 - 0.55 * k) + deep * 0.55 * k
    # thin darker halo just outside gold lines (on the glass side) for edge definition
    halo = ndi.binary_dilation(gold, iterations=1) & ~gold & (im[..., 3] > 30)
    out[halo] = out[halo] * 0.82 + np.array([0.45, 0.32, 0.5]) * 0.18
    im[..., :3] = np.clip(out, 0, 1) * 255
    Image.fromarray(im.astype(np.uint8)).save(os.path.join(skin, 'assets', n + '.webp'), 'WEBP',
                                              quality=92, method=4)
    print(n, int(gold.sum()), 'gold px')
