# Scrapbook — DESKTOP kit part 2 (cover polaroids)
Look reference: `images/skins/scrapbook/desktop/desktop-home.png` — the three tilted landscape polaroids in the cover band.
Same realistic photographed material as `images/skins/scrapbook/assets/photo-frame.webp` (aged cream polaroid card,
soft paper grain, soft shadow).
Save to `images/skins/scrapbook/kit/desktop/`:
1. `polaroid-wide.png` — 1000x860, real alpha. ONE landscape polaroid frame, straight (not rotated): thin cream border
   top/left/right (~5%), thicker bottom (~16%), soft drop shadow, a strip of beige washi tape across the top edge.
   The photo WINDOW is fully TRANSPARENT (alpha 0), a clean rectangle, aspect about 4:3. Outside the card: transparent.
   Paint on flat #00FF00 if needed and key it out with Pillow (no green fringe, the window must be clean alpha 0).
   Print the window box (left, top, width, height in px) in `polaroid-wide.txt`.
2. `polaroid-wide-b.png` — same spec, slightly different aging/tape (pink grid tape at a corner) so the three cover
   polaroids don't look identical. Print its window box in `polaroid-wide-b.txt`.
