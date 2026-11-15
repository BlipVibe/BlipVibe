#!/usr/bin/env python3
"""QA the sliced assets in images/skins/<id>/assets/ without re-slicing.

Checks
- stretchable parts (panels, chips, buttons): the central area is stretched horizontally by 9-slice,
  so we measure variation ACROSS each row of the centre (a smooth top-to-bottom gloss passes; a blotch,
  smudge or texture blob fails).
- nav/header strips: often have intentional built-in slots/buttons -> reported as REVIEW, not FAIL.
- avatar mask: must be a solid shape (little partial alpha).
- background: the middle (where cards sit) must be calm.
Usage: python qa_assets.py [skin ...] | all
"""
import sys
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SKINS = ROOT / "images" / "skins"

STRETCH = ["panel-card", "panel-card-active", "chip", "chip-active", "btn-primary", "btn-secondary"]
STRIPS = ["nav-bar", "header-bar"]
ROW_MAX = 12.0      # mean per-row luminance std allowed in a stretchable centre
BG_MAX = 38.0


def row_noise(img: Image.Image) -> float:
    w, h = img.size
    c = img.crop((int(w * .25), int(h * .3), int(w * .75), int(h * .7)))
    # light blur so single-pixel paper grain doesn't count, blotches still do
    lum = c.convert("L").filter(ImageFilter.GaussianBlur(1.2))
    alpha = c.getchannel("A")
    W, H = c.size
    L, A = lum.load(), alpha.load()
    stds = []
    for y in range(H):
        row = [L[x, y] for x in range(W) if A[x, y] > 200]
        if len(row) < 8:
            continue
        m = sum(row) / len(row)
        stds.append((sum((p - m) ** 2 for p in row) / len(row)) ** .5)
    return sum(stds) / len(stds) if stds else 0.0


def mask_softness(img: Image.Image) -> float:
    a = img.getchannel("A")
    hist = a.histogram()
    return sum(hist[21:235]) / max(1, sum(hist))


def bg_busy(img: Image.Image) -> float:
    w, h = img.size
    mid = img.crop((w // 6, h // 4, w * 5 // 6, h * 3 // 4)).convert("L").resize((90, 120))
    px = list(mid.getdata())
    m = sum(px) / len(px)
    return (sum((p - m) ** 2 for p in px) / len(px)) ** .5


def qa(skin: str):
    d = SKINS / skin / "assets"
    if not d.is_dir():
        return [f"{skin}: no assets"]
    out = []
    for n in STRETCH:
        p = d / f"{n}.webp"
        if p.exists():
            v = row_noise(Image.open(p).convert("RGBA"))
            if v > ROW_MAX:
                out.append(f"FAIL {n} (row noise {v:.1f})")
    for n in STRIPS:
        p = d / f"{n}.webp"
        if p.exists():
            v = row_noise(Image.open(p).convert("RGBA"))
            if v > ROW_MAX:
                out.append(f"REVIEW {n} (built-in detail {v:.1f})")
    p = d / "avatar-mask.webp"
    if p.exists():
        s = mask_softness(Image.open(p).convert("RGBA"))
        if s > .08:
            out.append(f"FAIL avatar-mask (soft {s:.0%})")
    else:
        out.append("FAIL avatar-mask missing")
    p = d / "background.webp"
    if p.exists():
        b = bg_busy(Image.open(p))
        if b > BG_MAX:
            out.append(f"FAIL background (busy middle {b:.1f})")
    icons = len(list(d.glob("icon-*.webp")))
    if icons < 20:
        out.append(f"FAIL icons ({icons}/20)")
    return out


if __name__ == "__main__":
    ids = sys.argv[1:] or ["all"]
    if ids == ["all"]:
        ids = sorted(p.parent.name for p in SKINS.glob("*/assets"))
    for s in ids:
        r = qa(s)
        print(f"{s}: {'PASS' if not r else '; '.join(r)}")
