# Pixel Pal — art kit for the Blip Vibe look `pixel-pal` (variant of the default skin `blip`)

Owner (Nov 19 2026): the Blip Vibes are looks INSIDE the default skin, picked from the Blip menu. Pixel Pal must look
1:1 like its concepts: `images/skins/default/pixel-pal/<page>.png` (local only, 1536x1024, two phones per page).
The engine swaps art by PART NAME: every file here replaces the Logo Classic file of the same name
(`images/skins/blip/kit/<name>.png`), and the Logo Classic CSS slices/places it with the SAME numbers.

## THE GEOMETRY RULE (most important)
For every part, open the Logo Classic file of the same name in `images/skins/blip/kit/` and keep:
- the SAME canvas size (exactly, e.g. panel-card-tight.png = 721x712),
- the shape in the SAME place (same outer bounds, same padding / transparent margin, same outline distance from the
  edge, same corner size, same window position and size for frames/rings, same tail position for tails),
- the same role (what is transparent, what is filled).
Only the STYLE changes, to Pixel Pal. This lets the existing 9-slice numbers work unchanged.

## Pixel Pal style (copy the concepts)
Cosy 8-bit handheld game, warm and friendly.
- Page: pea green `#E4F2C4` (sample the exact value from the concept), faint pixel clouds/grass only near edges.
- Cards: cream `#FFF8E6` dialog boxes, stepped pixel corners (2-3 pixel "steps" instead of a round radius, same overall
  corner size as Logo Classic), forest-green `#1F3B2D` outline of the same visual weight as Logo Classic's outline,
  a 1-step darker green pixel drop edge on the bottom/right (no soft blurred shadow).
- Primary pills / active tab / active nav tile / Blip button: pumpkin `#FF8A3D` with a darker orange `#D9661F` bottom
  pixel edge and a light top pixel highlight, forest-green outline. Secondary: cream with forest-green outline.
  Disabled: light grey-green `#D7DCCB`. Danger: cream with red `#D93025` outline.
- Progress: bar-track = cream track with forest-green outline; bar-fill = segmented orange pixel blocks.
- Coins: gold pixel coins. Sparkles: yellow pixel 4-point stars. Badge count: red pixel circle, white ring.
- Icons: chunky pixel line icons, forest green `#1F3B2D` (the `-on` nav icons WHITE for the orange tile; top-bar
  search/bell/music forest green). Like-on / dislike-on = FILLED orange `#FF8A3D` with green outline.
- Mascot: the BlipVibe bubble head as a PIXEL SPRITE: glossy blue speech-bubble head, white headphones, smiling
  face, bubble tail, yellow pixel sparkles — exactly like the concepts. OWNER RULE: NO arms, NO hands, NO body,
  NO legs, NO feet. Only the bubble head with headphones. Poses = tilt, bounce, expression, sparkles.
- Pixel edges must be CRISP (hard steps, no blur, no anti-alias smear). You may draw chrome pieces with code (PIL)
  using colours sampled from the concepts, and use image generation for illustrated pieces (mascots, icons, badges,
  background, store card). Either way the result must match the concept.

## Rules
- NO text, letters or numbers in any piece. NO photos or people.
- REAL transparent alpha. NEVER a painted grey/white checkerboard.
- Frames/rings keep a fully transparent window. Icons razor sharp, centred.
- Save PNGs to `images/skins/blip/kit/pixel-pal/<name>.png` (same names as Logo Classic).
- Finish each job with `images/skins/blip/kit/pixel-pal/_sheet-<job>.png`: every new piece on mid grey beside the
  Logo Classic piece of the same name.

## Store / menu card
`card.png` 1024x1024: full-bleed painted pixel-art scene (cosy pea-green meadow, pixel clouds, the pixel mascot head
floating with sparkles; no text, no UI, no phone). 256x256 webp goes to `images/skins/blip/pixel-pal/card.webp`.
