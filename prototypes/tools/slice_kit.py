#!/usr/bin/env python3
"""Slice a skin's generated asset-kit sprite sheets into individual web assets.

Usage:  python slice_kit.py <skin-id> [<skin-id> ...]      (or "all")
Reads   images/skins/<id>/kit/*.png   (layout defined in prototypes/asset-kit-brief.md)
Writes  images/skins/<id>/assets/*.webp  + manifest.json

Each grid cell is cropped, trimmed to its visible pixels, padded slightly, capped to a max size,
and saved as WebP so the OTA bundle stays small.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]          # repo root
SKINS = ROOT / "images" / "skins"

ICON_NAMES = ["home", "groups", "skins", "network", "messages",
              "like", "dislike", "comment", "share", "search",
              "bell", "music", "coin", "camera", "back",
              "plus", "send", "emoji", "edit", "more"]

# sheet -> (cols, rows, names, max_px, lossless)
GRIDS = {
    "icons":   (5, 4, [f"icon-{n}" for n in ICON_NAMES], 192, False),
    "panels":  (2, 2, ["panel-card", "panel-card-active", "chip", "chip-active"], 900, False),
    "buttons": (2, 2, ["btn-primary", "btn-secondary", "btn-round", "nav-active"], 700, False),
    "nav":     (1, 2, ["nav-bar", "header-bar"], 1400, False),
    "frames":  (2, 2, ["timeline-frame", "avatar-frame", "avatar-mask", "post-frame"], 1000, False),
    "quests":  (3, 1, ["quest-0", "quest-50", "quest-100"], 420, False),
    "deco":    (3, 2, [f"deco-{i}" for i in range(1, 7)], 520, False),
    # optional extras sheet (prototypes/extras-kit-brief.md)
    "extras":  (3, 3, ["photo-frame", "tile", "tape-2", "bar-track", "bar-fill", "field",
                       "sticker-1", "sticker-2", "divider"], 700, False),
}
OPTIONAL = {"extras"}
LOSSLESS = {"avatar-mask"}          # masks must stay crisp
ALPHA_MIN = 10                      # pixels fainter than this count as empty
PAD = 6


def trim(img: Image.Image) -> Image.Image | None:
    a = img.getchannel("A").point(lambda v: 255 if v > ALPHA_MIN else 0)
    box = a.getbbox()
    if not box:
        return None
    l, t, r, b = box
    l, t = max(0, l - PAD), max(0, t - PAD)
    r, b = min(img.width, r + PAD), min(img.height, b + PAD)
    return img.crop((l, t, r, b))


STRETCH_PARTS = {"panel-card", "panel-card-active", "chip", "chip-active",
                 "btn-primary", "btn-secondary", "nav-bar", "header-bar",
                 "bar-track", "bar-fill", "field"}
CENTER_MAX_STD = 14.0     # luminance std-dev allowed in the middle of a stretchable part
BG_MAX_STD = 38.0         # luminance std-dev allowed in the middle of the app background


def qa_center(img: Image.Image) -> float:
    """Std-dev of luminance in the central 40% of an RGBA part (opaque pixels only)."""
    w, h = img.size
    c = img.crop((int(w * .3), int(h * .3), int(w * .7), int(h * .7)))
    lum, alpha = c.convert("L"), c.getchannel("A")
    px = [l for l, a in zip(lum.getdata(), alpha.getdata()) if a > 200]
    if len(px) < 20:
        return 0.0
    m = sum(px) / len(px)
    return (sum((p - m) ** 2 for p in px) / len(px)) ** .5


def qa_mask(img: Image.Image) -> float:
    """Fraction of pixels that are neither ~transparent nor ~opaque (should be edges only)."""
    a = list(img.getchannel("A").getdata())
    return sum(1 for v in a if 20 < v < 235) / max(1, len(a))


def cap(img: Image.Image, max_px: int) -> Image.Image:
    if max(img.size) <= max_px:
        return img
    s = max_px / max(img.size)
    return img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)


def save(img: Image.Image, path: Path, lossless: bool):
    img.save(path, "WEBP", lossless=lossless, quality=82, method=4)


def slice_skin(skin: str) -> dict:
    kit, out = SKINS / skin / "kit", SKINS / skin / "assets"
    if not kit.is_dir():
        return {"skin": skin, "error": "no kit folder"}
    out.mkdir(exist_ok=True)
    manifest, warnings = {"skin": skin, "assets": {}}, []

    bg = kit / "background.png"
    if bg.exists():
        im = Image.open(bg).convert("RGB")
        # cover-fit to 1080x1920 portrait
        tw, th = 1080, 1920
        s = max(tw / im.width, th / im.height)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        l, t = (im.width - tw) // 2, (im.height - th) // 2
        im = im.crop((l, t, l + tw, t + th))
        # QA: the middle third (where cards sit) must be calm / low-contrast
        mid = im.crop((tw // 6, th // 4, tw * 5 // 6, th * 3 // 4)).convert("L").resize((90, 120))
        px = list(mid.getdata())
        m = sum(px) / len(px)
        sd = (sum((p - m) ** 2 for p in px) / len(px)) ** .5
        if sd > BG_MAX_STD:
            warnings.append(f"QA FAIL background: busy middle (std {sd:.1f})")
        im.save(out / "background.webp", "WEBP", quality=90, method=6)
        manifest["assets"]["background"] = {"file": "background.webp", "w": tw, "h": th}
    else:
        warnings.append("missing background.png")

    for sheet, (cols, rows, names, max_px, _) in GRIDS.items():
        src = kit / f"{sheet}.png"
        if not src.exists():
            if sheet not in OPTIONAL:
                warnings.append(f"missing {sheet}.png")
            continue
        im = Image.open(src).convert("RGBA")
        cw, ch = im.width / cols, im.height / rows
        for i, name in enumerate(names):
            c, r = i % cols, i // cols
            cell = im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
            t = trim(cell)
            if t is None:
                warnings.append(f"{sheet}: empty cell {name}")
                continue
            t = cap(t, max_px)
            if name in STRETCH_PARTS:
                sd = qa_center(t)
                if sd > CENTER_MAX_STD:
                    warnings.append(f"QA FAIL {name}: noisy center (std {sd:.1f})")
            if name == "avatar-mask":
                frac = qa_mask(t)
                if frac > 0.08:
                    warnings.append(f"QA FAIL avatar-mask: soft/partial alpha {frac:.0%}")
            save(t, out / f"{name}.webp", name in LOSSLESS)
            manifest["assets"][name] = {"file": f"{name}.webp", "w": t.width, "h": t.height}

    thumb_src = kit / "thumb.png"
    if not thumb_src.exists():
        thumb_src = SKINS / "thumbs" / f"{skin}.png"
    if thumb_src.exists():
        t = cap(Image.open(thumb_src).convert("RGB"), 512)
        t.save(out / "thumb.webp", "WEBP", quality=80, method=4)
        manifest["assets"]["thumb"] = {"file": "thumb.webp", "w": t.width, "h": t.height}

    manifest["warnings"] = warnings
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2))
    size = sum(p.stat().st_size for p in out.glob("*.webp"))
    manifest["total_kb"] = round(size / 1024)
    return manifest


def main(argv):
    ids = argv or ["all"]
    if ids == ["all"]:
        ids = sorted(p.parent.name for p in SKINS.glob("*/kit") if p.is_dir())
    for skin in ids:
        m = slice_skin(skin)
        if "error" in m:
            print(f"{skin}: {m['error']}")
            continue
        print(f"{skin}: {len(m['assets'])} assets, {m['total_kb']} KB" +
              (f"  WARN: {'; '.join(m['warnings'])}" if m["warnings"] else ""))


if __name__ == "__main__":
    main(sys.argv[1:])
