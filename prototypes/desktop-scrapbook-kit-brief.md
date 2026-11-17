# Scrapbook — DESKTOP art kit (from the approved desktop concept)

Target look: `images/skins/scrapbook/desktop/desktop-home.png` (approved) and the other `desktop-*.png` in that folder.
Same material as the shipped phone kit (`images/skins/scrapbook/assets/*.webp`): REALISTIC photographed craft paper,
soft torn fibrous edges, washi tape, map/ledger paper, pressed flowers (pink, white daisies, lilac), lace, warm light,
soft offset shadows. Paper is soft, not crumpled. Nothing flat or CSS-looking. No text in any piece.

OWNER: the desktop must look EXACTLY as cluttered and busy as the concept — layered map/ledger scraps, torn pink
paper, lace, tape, pressed flowers, stickers and ephemera everywhere around and between the panels, just like
desktop-home.png. Do NOT simplify into calm empty paper. (Only directly under text keep the paper readable.)

The phone pieces are portrait / 1290 wide and look stretched on wide screens. Paint these DESKTOP pieces.
Save PNGs (real alpha where stated) to `images/skins/scrapbook/kit/desktop/`, plus `_sheet.png` (contact sheet on a
checkerboard so alpha shows). Paint each piece as its own image generation; then crop/resize with Pillow to the exact
size given. If the generator can't make transparency, paint on flat pure green #00FF00 and key it out cleanly
(no green fringe) with Pillow.

1. `desk-bg.png` — 2560x1600, opaque. The page background behind everything: a scrapbook desk/spread of aged cream
   craft paper with faint map and ledger-line scraps, layered map and ledger-line scraps, torn pink paper pieces, lace
   doilies, washi tape, pressed flowers, envelopes and stamps scattered ALL OVER like the concept's background
   between the panels. Busy and rich like the concept, sharp, never blurry.
2. `topbar-wide.png` — 2560x120, real alpha. The full-width top bar: a long strip of torn PINK + cream paper layered
   over a strip of map paper, torn fibrous bottom edge, a bit of washi tape at both ends. Calm middle (wordmark,
   search, tabs and buttons sit on it). The left 300px and right 300px may carry a small flower; the middle is
   plain paper texture. Must tile/stretch horizontally without visible smearing: keep the middle 1960px a uniform
   texture with no distinct features.
3. `hero-wide.png` — 2560x560, real alpha around a torn bottom edge. The Home/Profile cover band: a collage of
   map/ledger papers with lace edges, flower bunches (pink cosmos, white daisies at the LEFT end; lilac/purple
   flowers + lace at the RIGHT end), soft tape. As busy as the concept's cover band all the way across (map
   paper, lace, tape, scraps); polaroids, profile picture and name card are laid on top of it. Torn fibrous bottom edge.
4. `sheet9-tall.png` — 1000x1400, real alpha. A big torn cream paper sheet with a second pink sheet peeking out
   behind the bottom-left corner, soft shadow. Used as a 9-slice for column panels: keep a 140px border zone on
   every side carrying the torn edges/shadow, and the inner area a uniform soft paper texture.
5. `notepad9.png` — 1000x1400, real alpha. A spiral-bound cream notepad page (metal spiral rings down the LEFT edge,
   ruled faint lines), a pink gingham bow at top right corner. 9-slice: left border 150px (spiral), other borders
   110px; inner area uniform paper.
6. `tab-paper.png` and `tab-paper-active.png` — 360x120 each, real alpha. Top-bar page tabs: a small torn cream
   paper tag (inactive) and the same tag in ROSE pink paper (active), slight shadow. 9-slice border 40px.
7. `corner-flowers-l.png` and `corner-flowers-r.png` — 700x900 each, real alpha. Big pressed-flower + lace clusters
   that sit at the bottom-left / bottom-right of the window over the background (mirror-ish but not identical).

Also save `images/skins/scrapbook/kit/desktop/_sheet.png`.
