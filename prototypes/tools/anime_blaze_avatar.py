"""Anime Blaze avatar art.
 - avatar-rim.webp (600x600): the concept's sketchy WHITE ring outlined in black ink (used at inset -4% around the photo).
usage: anime_blaze_avatar.py <assets_dir>"""
import sys, glob, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
A = sys.argv[1]
rng = np.random.default_rng(7)
# ---- rim (drawn at 2x, downsampled) ----
N = 1200; c = (N - 1) / 2
y, x = np.mgrid[0:N, 0:N]; r = np.hypot(x - c, y - c); th = np.arctan2(y - c, x - c)
def wob(amp, k):  # low-frequency hand-drawn wobble
    out = np.zeros_like(th)
    for f in range(2, k):
        out += rng.normal(0, amp / f) * np.sin(f * th + rng.uniform(0, 6.28))
    return out
s = N / 600
r_in, r_wh, r_out = (270 + wob(1.2, 9) / 1) * s, (278 + wob(1.0, 9)) * s, (293 + wob(1.6, 12)) * s
r_edge = (299 + wob(0.8, 9)) * s
black = ((r >= r_in) & (r < r_wh)) | ((r >= r_out) & (r < r_edge))
white = (r >= r_wh) & (r < r_out)
# dry-brush nicks: short dark scratches across the white band
scr = np.zeros_like(r, bool)
for _ in range(26):
    a0 = rng.uniform(-np.pi, np.pi); L = rng.uniform(0.02, 0.09); w = rng.uniform(0.6, 1.6) * s
    rr = rng.uniform(281, 291) * s
    d = np.angle(np.exp(1j * (th - a0)))
    scr |= (d > 0) & (d < L) & (np.abs(r - rr - d * rng.uniform(-30, 30)) < w)
white &= ~scr
img = np.zeros((N, N, 4), np.uint8)
img[white] = (250, 248, 242, 255); img[black | (scr & ((r >= r_wh) & (r < r_out)))] = (12, 12, 12, 255)
rim = Image.fromarray(img, 'RGBA').resize((600, 600), Image.LANCZOS)
dirs = [A] + [d for d in glob.glob(A + '/*') if os.path.isdir(d)]
for d in dirs:
    rim.save(f'{d}/avatar-rim.webp', quality=92)
print('ok', len(dirs))
