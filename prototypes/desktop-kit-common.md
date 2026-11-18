# Full skins on DESKTOP — art KIT brief (read with the skin's concept brief)

The owner APPROVED the desktop concepts in `images/skins/<skin>/desktop/desktop-*.png` (home, profile, messages,
groups, skins, notifications + the other renditions). Now the app must be BUILT to look 1:1 like them. The app's real
text, photos, icons and buttons are HTML laid on top of art, so paint the ART PIECES (no text, no UI labels, no
photos, no avatars, no app icons inside them) that, placed by CSS, reproduce the concept exactly.

Rules (owner): every visual is generated art, CSS only places it. Same materials, ornaments, palette, lighting and
clutter as the concept (do NOT simplify). Nothing is stretched: pieces are painted at desktop size. Rims/corners carry
the ornament; areas where text will sit are calm and uniform. Real alpha where stated (if the generator cannot make
transparency, paint on flat #00FF00 and key it out with Pillow, no fringe).

Paint, for the FIRST rendition (from desktop-home.png and the other first-rendition screens):
1. `bg.png` 2560x1600 opaque — the whole scene/background of the concept with ALL panels, navigation and UI REMOVED
   (the world behind them: room, book, stage, sky, temple, comic page, desktop wallpaper… with its props). Where a
   structure in the concept is part of the layout (e.g. the open book, the temple columns, the opera boxes, the comic
   page gutters, the cloud islands) keep it in the background in the same place as the concept at 1536x960 scaled up.
2. The NAVIGATION art exactly as in the concept (top bar / rail / spine / pediment / taskbar / hanging tabs…), as
   separate alpha pieces: the bar/rail itself (painted at its real desktop size, 2x of the concept's 1536 px), one
   inactive tab/button, the active tab/button, the search field, the coin pill, the round avatar ring/badge,
   the small round icon button, the rendition switch track (if the skin has renditions).
3. Every PANEL shape used in the concept (side cards, the feed column/sheet, post card, quests card, people/groups
   rows, chat bubbles received + sent, input bar, chips inactive + active, primary button, list row inactive +
   active/unread) as a 9-slice PNG with real alpha: plain uniform centre, ornament only on the border zone.
4. COVER / PROFILE pieces: the cover-photo frames exactly as in the concept (one PNG per distinct frame, with a fully
   transparent photo window), the profile-picture ring/frame (transparent centre), the name plate/banner.
5. Progress pieces: bar track + fill (or the skin's quest progress icon states 0 / 50 / 100).
6. Loose decor the concept scatters over the layout (corner clusters, props in front of panels) as alpha pieces.

Then write `images/skins/<skin>/kit/desktop/manifest.json`: for every file {"file", "size":[w,h], "use": "<what it
is in the concept>", "slice":[top,right,bottom,left] for 9-slices (the border zone in px), "window":[x,y,w,h] for
frames with a photo window, "concept_box":[x,y,w,h] = where that piece sits in desktop-home.png (1536x960)}.
Save everything to `images/skins/<skin>/kit/desktop/` plus a `_sheet.png` contact sheet on a checkerboard.
Other renditions: repeat 1-6 into `images/skins/<skin>/kit/desktop/<rendition>/` using that rendition's concepts
(same file names, same sizes, recoloured/redrawn as in its concept). Paint each piece as its own image generation.
Temporary files only under /tmp.
