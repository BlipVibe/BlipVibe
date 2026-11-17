# Superhero — profile pop-up redesign (both renditions)

Owner (Nov 16): "I would like the profile modal to be redesigned for the super heros and the villians they should both
look different and not be so plain but keep the same style."

The pop-up (tapping a profile card) shows: a close ✕, the round profile photo, the name, a short bio, Following / Followers
counts, "Active Skin: <name>", and buttons (View Profile; on someone else's: Follow, Message, View Profile, Block).
Today it is a plain panel. Paint a dedicated set so it becomes a showpiece of each rendition.

Match each rendition's finished kit exactly (open and copy its material, line weight, colours):
- HEROES kit: `images/skins/superhero/kit/heroes/` (concept `images/skins/superhero/concept-heroes*.png`) — golden-age
  comic: cream halftone paper, thick black ink, primary red / blue / yellow, gold, sunny art-deco skyline, starbursts.
  Theme for the pop-up: a comic-book **HERO FILE** — like the inside cover / character card of a golden-age comic.
- VILLAINS kit: `images/skins/superhero/kit/villains/` (concept `images/skins/superhero/concept-villains*.png`) — lair:
  gunmetal plates, bolts, cracks, hazard stripes, neon toxic green + electric purple, storm, skull-circuit sigil, angular
  cut corners. Theme: a **CLASSIFIED VILLAIN DOSSIER** — a steel case / surveillance terminal.
The two must look MUCH different from each other (owner rule) — different shapes, not a recolour.

Rules: NO text/letters/numbers (the app writes them), NO people/faces. Real transparent alpha outside shapes (never a
painted checkerboard), frames with fully transparent windows. Same FILE NAMES and SIZES in both folders. 9-slice pieces:
ornament only in the corners (N px stated), plain uniform edges between. Calm centres where text sits
(Heroes: cream, dark ink text; Villains: dark, light text).

Save to `images/skins/superhero/kit/heroes/` and `images/skins/superhero/kit/villains/` + a `_sheet-modal.png` in each.

| file | size | HEROES | VILLAINS |
|---|---|---|---|
| modal-panel.png | 1200x1700 (9s 200) | the whole pop-up: a comic page with a THICK black ink border, a red-and-yellow double rim, halftone corners, a small blue starburst in the top-left corner and rivet-like ink dots; calm cream centre | a heavy gunmetal case: cut corners with big bolts, hazard-stripe strips in two corners, glowing purple seam all round, a tiny green status light top-right; calm dark centre |
| modal-header.png | 1200x560 | the top of the pop-up behind the photo: a comic SPLASH panel — sunburst rays (yellow/white) over a blue sky with the art-deco skyline along the bottom, clouds; thick ink border with rounded-off bottom corners | the top: a SURVEILLANCE screen — dark storm sky with green lightning over the fortress, scan lines, a green crosshair reticle faintly in the middle, cracked glass in one corner, steel bezel |
| photo-ring.png | 600x600 | big round photo frame with a transparent round window (~62% of the canvas, centred): gold ring with thick ink outline, two small golden wings and a red star at the bottom | spiked neon-green ring with purple steel collar and a small glowing skull sigil at the bottom; transparent round window ~62% |
| bio-box.png | 1000x320 (9s 100) | the bio in a white comic SPEECH BALLOON with thick ink outline, tail pointing up (toward the photo) at the top centre | the bio on a dark green TERMINAL SCREEN panel with a thin glowing green border and faint scan lines, a small tab at the top centre |
| stat-badge.png | 420x420 | one counter (Following / Followers each get one): a yellow comic STARBURST with thick ink outline and a red inner burst ring, calm centre for a number + label | a hexagon POWER-CELL readout: dark steel hex with a glowing green inner hex screen, calm centre |
| skin-tag.png | 700x150 (9s 75) | "Active Skin: …" caption: a yellow comic CAPTION BOX with ink outline (tilted ink corners) | a hazard-stripe-edged steel tag with purple glow |
| close-btn.png | 180x180 | round red comic badge with a white ✕ drawn as a bold ink cross | angular steel badge with a glowing green ✕ |
| modal-deco.png | 1200x300 | bottom decoration of the pop-up: small art-deco skyline silhouette with a flying caped figure SILHOUETTE (tiny, original, no emblem) and two yellow stars; transparent above | bottom decoration: pipes, a hazard stripe and a small skull-circuit emblem glowing green; transparent above |
