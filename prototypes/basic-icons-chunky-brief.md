# #Basic — chunkier icons (owner, Nov 17: "The icons need to be bigger and chunkier")

Repaint EVERY line icon of the #Basic kit with a much heavier, chunkier stroke. Same subjects and same layout as the
existing files (look at each one first), same canvas sizes, same file names — only the drawing changes.

Style: soft, rounded, CHUNKY line icons — stroke about 2.5x the current weight (roughly 18–22px on a 256px canvas),
fully rounded caps and joins, slightly simplified shapes so they stay readable when bold, generous inner spaces.
Think friendly, plush, clean-girl stationery icons — not thin hairlines, not filled glyphs.
Colour: deep espresso brown (#4a3426) on transparent. The "-on" nav icons stay in the rendition's deep accent tone
(Rosé #9c5f57, Pumpkin #8a4a26). icon-like-on / icon-dislike-on stay FILLED with the accent and a chunky outline.
Fill the canvas better: the icon should occupy ~80% of the canvas (current ones are small inside their canvas).
Real transparent alpha, never a painted checkerboard. No text.

Files to repaint, in BOTH `images/skins/basic/kit/rose/` and `images/skins/basic/kit/pumpkin/` (overwrite in place):
- every `icon-*.png` (nav icons, their `-on` versions, top bar search/bell/music, post actions, tools, menus)
- every `notif-*.png` (keep the linen disc behind, make the line glyph chunky and larger in the disc)
- every `menu-*.png` (Barista Bar menu icons; Rosé rose-gold line colour, Pumpkin gold line colour — chunkier)
Finish with `_sheet-icons.png` in each folder (all repainted icons on one sheet).
