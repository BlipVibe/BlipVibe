# Bubble Pop — art kit for the Blip Vibe look `bubble-pop` (variant of the default skin `blip`)

Nov 19 2026. Bubble Pop is a LOOK of the default skin (picked from the Blip menu), so it uses exactly the same part
names and canvas sizes as the Logo Classic kit (`prototypes/blip-kit-brief.md`, files in `images/skins/blip/kit/*.png`).
Every Bubble Pop piece is a repaint of the Logo Classic piece with the same name, same canvas size, same placement of
the shape inside the canvas (so the same CSS 9-slice numbers keep working), in the Bubble Pop look.

Style truth: `images/skins/default/bubble-pop/*.png` (per-page concepts; the `-v1` files show the original look, but
their waving mascot arm is WRONG). Open `home.png`, `group.png`, `network.png` and the Logo Classic piece of the same
name before painting each piece.

## Look
- Page: SUNSHINE YELLOW `#FFD23F` (slightly deeper `#FFC92E` at the edges) with soft floating soap bubbles.
- Cards: puffy, inflated cream-white `#FFF8E6` speech bubbles, soft 3D shading (light top-left highlight, gentle warm
  shadow `#E8B520` under them), NO dark outline (the edge is formed by the shading + a faint warm rim `#F0D9A0`).
  Corner radius like Logo Classic's card (same canvas geometry), slightly softer/rounder.
- Pills/buttons: glossy JELLY pills (bright top highlight strip, deeper bottom). Primary = mascot blue `#1E5BDB`
  (light `#3C82F6` top). Secondary = mint `#4ADBA8`. Neutral = cream `#FFF8E6` jelly. Danger = cream with coral `#FF5A5F`
  rim. Disabled = soft grey `#D9D6CC` jelly. Liked = coral `#FF5A5F` filled jelly.
- Icons: rounded line icons, dark navy `#14215A`, slightly chunkier stroke than Logo Classic, soft round caps.
  `-on` nav icons: WHITE line icons (they sit on the blue jelly pill).
- Text colour (app supplies text): dark navy `#14215A`.
- Sparkles: yellow 4-point stars `#FFE45C` with a soft white glint.
- Mascot: the ORIGINAL logo mascot (`images/blipvibe-logo.png`) rendered glossy/3D like a toy, same face/headphones/tail.
  **NO ARMS, NO HANDS, NO BODY, NO LEGS** — only the speech-bubble head with headphones (owner rule). Zoom-check each.

## Rules (all parts)
- NO text, letters or numbers. NO photos/people.
- REAL transparent alpha outside every shape. NEVER a painted checkerboard. Check corners are alpha 0.
- Same canvas size as the Logo Classic file of the same name (read it with PIL first); same inset of the shape from the
  canvas edge (9-slice pieces: corners hold the rounded shape, edges plain and uniform).
- Frames keep fully transparent windows in the same place as Logo Classic's.
- Liked/disliked ON states clearly FILLED.
- Save as PNG into `images/skins/blip/kit/bubble-pop/<same file name>.png`.
- Finish each part with `images/skins/blip/kit/bubble-pop/_sheet-<part>.png`: each new piece beside the Logo Classic
  piece of the same name, on mid-grey.
