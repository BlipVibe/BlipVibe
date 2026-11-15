# Extras kit brief (per skin)

The standard kit (asset-kit-brief.md) left some surfaces to CSS. The owner wants art for every visual
piece and CSS only for placement, so each skin also gets an extras sheet.

## Deliverable
`images/skins/<ID>/kit/extras.png` — 2048x2048 PNG, fully transparent background, a 3x3 grid
(each cell ~682x682), ONE item per cell, centered, nothing touching the cell edges:

| row | col 1 | col 2 | col 3 |
|---|---|---|---|
| 1 | **photo-frame** — empty photo frame for post photos (Scrapbook: white vintage polaroid, thicker bottom border, soft baked shadow). The window is FULLY transparent. Even border on left/right/top so it can 9-slice. | **tile** — blank square icon tile (Scrapbook: pink paper square, slightly torn edges, baked soft shadow). No icon on it. | **tape-2** — a second tape/sticker strip in a different pattern from the kit's tape (Scrapbook: pink polka-dot washi tape, torn ends, slightly translucent look but opaque pixels). |
| 2 | **bar-track** — empty progress bar track, long horizontal capsule/strip, ~600x60 (Scrapbook: faded paper groove). Plain middle so it can stretch. | **bar-fill** — matching progress fill, same shape/height (Scrapbook: dusty-rose paper strip). Plain middle. | **field** — text input field, long horizontal strip ~600x110 (Scrapbook: light cream lined/blank paper strip with torn edges). Plain middle, no text, no icon. |
| 3 | **sticker-1** — small theme sticker (Scrapbook: pressed pink flower). | **sticker-2** — small theme sticker (Scrapbook: "xoxo" or star paper sticker). | **divider** — thin horizontal divider, ~600x24 (Scrapbook: torn paper strip or stitched line). |

## Quality rules
- Same art style, palette and lighting as the skin's approved concept and existing kit.
- Stretchable parts (photo-frame borders, bar-track, bar-fill, field, divider) must have clean, even
  middles — no blotches, gradients or texture changes in the stretch zone.
- Fully transparent background (real alpha, not a checkerboard drawn in).
- No text anywhere except a sticker that is meant to be text.
