# New DEFAULT BlipVibe look — 5 mascot-led concept directions (brief for Codex image generation)

Goal: a completely new look for the plain **default** BlipVibe style (what everyone sees with no premium/full skin).
It must look NOTHING like today's default (dark navy slate background, violet #8b5cf6 accents, flat Roboto cards,
three-column web layout). Every direction is built around the BlipVibe **mascot**: the smiling glossy blue
speech-bubble character with white headphones and two small yellow sparkles (reference: `images/blipvibe-logo.png`,
open it first and keep the character on-model — same face, headphones, bubble tail, sparkles; it may be redrawn in
the direction's art style and posed: waving, peeking, listening, sleeping, cheering).

Concept art only. Nothing is built from this pass until the owner picks a direction.

**Owner rule: it must look different from ALL other skins too.** Open `images/skins/default/_ref/existing-skins.jpg`
(Home screens of every premium skin: Vaporwave light + dark, Good Witch night + day, Heaven's Light, Anime Blaze,
#Basic, Superhero, Blood Moon, Witchcraft, Vaporwave retro, Scrapbook) and make sure your screen shares NONE of their
palettes, textures, frame styles, fonts or layouts. In particular: no glossy sky-blue/cyan glass panels or neon
(Vaporwave), no pastel lilac/purple fairy glow (Good Witch), no gold/marble/laurels (Heaven's Light), no flame/speed
streaks or black-red (Anime Blaze), no beige café neutrals or oak shelves (#Basic), no comic yellow-red-blue with
thick outlines/halftone/bursts (Superhero), no dark navy + silver filigree (Blood Moon), no dark purple candles/potions
(Witchcraft), no torn paper/tape/florals (Scrapbook). The mascot's blue is an ACCENT, not a whole blue-screen theme.

## Output (one image per job)
- Use your image generation tool (gpt-image). Save as PNG to the path the job names (relative to this worktree).
- `home` and `group`: **1536 x 1024** landscape, plain soft backdrop, **two iPhone portrait screens side by side** of the
  SAME page — Phone A scrolled to the top, Phone B scrolled down — so every field of that page fits. Labels small
  underneath: `<DIRECTION> — HOME (TOP)` / `<DIRECTION> — HOME (SCROLLED)` (or `GROUP PAGE`).
- `desktop`: **1536 x 1024** landscape. ONE desktop browser window (thin generic browser chrome, URL `blipvibe.com`)
  filling most of the image, label `<DIRECTION> — DESKTOP HOME`.
- Content: plausible real-looking values. NO lorem ipsum, no placeholder bars, no gibberish, every word readable and
  spelled right. No real brands, logos, celebrities or copyrighted characters. People = generic stock-like photos.
- The mascot appears on every screen in the direction's style: the `BlipVibe` wordmark with the mascot head, plus at
  least one bigger mascot moment (decoration only — it never adds a feature or text field). Yellow sparkles recur.

## Page-by-page fields (owner rule: "do it by page and fields that are actually available on those pages")
Each job is fed ONLY its own page's list below (prompt files are built per job from these sections). Lists were read
from index.html + js/app.js (+ css/style.css for what the phone layout shows/hides). Nothing from other pages, nothing invented.

<!-- PAGE:home -->
### PAGE: HOME (phone) — `#page-home` at phone width
Top bar (global navbar, phone): `BlipVibe` wordmark (mascot head + word) · search icon button · bell icon (badge `3`) ·
coin pill (coin icon + `1,240`) · small round user avatar. (No search field, no username on phone.)
Phone A (top):
1. **Timeline cover** — wide cover photo (e.g. beach sunset) with a small round camera button (change cover).
2. **Profile card** — profile cover strip · round **avatar** + small camera edit badge · **name** `Maya Rivera` ·
   **title** `Living my best life` · **about** `Coffee addict, sunset chaser, part-time adventurer.` ·
   stats `Following 248` and `Followers 1,032` · link `View Profile` · small pencil edit button. Prominent, never tiny.
3. **Photos** card — heading `Photos`, a row/grid of 6 small photo thumbnails, link `View All`.
4. Two pill buttons: `People You May Know` · `Trending Groups`.
5. **Stories** row — `Your Story` (user avatar + `+` badge), then 4 friends' round story bubbles with first names
   (bright ring = unseen, faded ring = seen).
Phone B (scrolled):
6. **Post bar** — small user avatar + field text `What are we posting today?`.
7. **Featured Skin** banner — heading `Featured Skin` + timer `5h 12m left`; a small skin preview picture, skin name
   `Good Witch`, one-line skin description, button `Buy · 300` (coin icon).
8. **Daily Quests** panel — heading `Daily Quests` + `Resets daily`; 3 quests, each = icon, label, progress bar, count,
   coin reward: `React to 5 posts` 3/5 +5 · `Send 3 messages` 2/3 +10 · `Like 5 posts` 4/5 +5.
9. **Coin goal** bar — `180 / 300 coins` + next skin name `Heaven's Light` over a progress track.
10. Feed tabs: `Following` (active) · `Discover` · `My Posts`.
11. One **post**: author avatar · author name · `2h ago` · `⋯` menu · 1–2 lines of text · one photo · action row:
    like (thumbs-up, active) `128` · dislike (thumbs-down) `2` · react (smiley) · comment `14` · share `5`.
Both phones: **bottom nav** (icon + label) `Home` (active) · `Groups` · `Skins` · `Network` · `Messages` (badge `2`).
(The `Earn Coins` card and `Trending Hashtags` button render only after the whole feed on phone — leave them out.)
<!-- /PAGE -->

<!-- PAGE:group -->
### PAGE: GROUP PAGE (phone) — `#page-group-view` at phone width, viewer is a MEMBER of the group
Top bar: the same global navbar as Home (wordmark · search icon · bell · coin pill · avatar). There is no separate
page-title bar.
Phone A (top):
1. **Group cover** — wide banner photo of the group's topic (e.g. a mountain trail).
2. **Group card** — cover strip · round **group picture** (the group's own photo) · **group name** `Weekend Hikers` ·
   **description** `Trails, views and trail snacks every Saturday.` · three stats `12,430 Members` · `318 Posts` ·
   `2,450 Group Coins` (coin icon) · buttons `Joined` (greyed/disabled, already a member) and `Leave Group`
   (outline, red/danger tint, exit icon) · small link `← Back to Groups`.
3. `Group Rules` button (scroll icon) and `Invite Link` button (link icon), full width, stacked.
4. **Members** card — heading `Members`, 6 round member avatars + `+42 more`.
Phone B (scrolled):
5. Mode tabs: `Feed` (active) · `Chat`.
6. **Post bar** — small user avatar + field text `Post in Weekend Hikers...`.
7. Heading card `Group Posts`.
8. Two group **posts**: author avatar · author name · time (`3h ago`) · `⋯` menu · 1–2 lines of on-topic text ·
   one post with a photo · action row: like (thumbs-up, active on one) `86` · dislike `1` · comment `12`
   (group posts have NO react and NO share buttons).
Both phones: bottom nav `Home` · `Groups` (active) · `Skins` · `Network` · `Messages` (badge `2`).
<!-- /PAGE -->

<!-- PAGE:desktop -->
### PAGE: DESKTOP HOME — `#page-home` on a wide screen
1. **Top navbar**: `BlipVibe` wordmark with mascot · search field `Search...` · nav links (icon + label) `Home` (active) ·
   `Groups` · `Skins` · `Network` · `Saved` · `Messages` (badge `2`) · `Notification` (badge `3`) · coin pill `1,240` ·
   user avatar + `Maya Rivera` + chevron.
2. **Timeline cover** — wide cover photo banner (small `Add Cover Photo` camera button).
3. **Profile card**: cover strip · avatar + camera badge · `Maya Rivera` · `Living my best life` · about line ·
   `Following 248` / `Followers 1,032` · `View Profile` · pencil edit button.
4. **Photos** card: heading `Photos`, 6 small thumbnails, `View All`.
5. **Stories** row: `Your Story` + 5 friends (first names).
6. **Post bar**: avatar + `What are we posting today?`.
7. **Featured Skin** banner (`Featured Skin`, `5h 12m left`, preview picture, `Good Witch`, description, `Buy · 300`).
8. **Daily Quests** panel (as on Home: 3 quests with progress + rewards, `Resets daily`) + **coin goal** bar
   (`180 / 300 coins`, `Heaven's Light`).
9. Feed tabs `Following` · `Discover` · `My Posts`, then two posts (as on Home; one with a photo; like · dislike ·
   react · comment · share).
10. **Earn Coins on BlipVibe** card: subtitle `Earn coins by interacting and spend them in the Skin Shop to customize
    your profile!`, rules `Daily Login +5` · `Post +5 (5/day)` · `Comment +2 (15/day)` · `Like +1 (30/day)`.
11. **People You May Know** card: 3 people (avatar, name, `Follow` button) + `View More`.
12. **Trending Groups** card: 3 groups (picture, name, member count).
13. `Trending Hashtags` button (fire icon).
Standard placement is 3 columns (left: 3–4 · center: 5–9 · right: 10–13) under the navbar and cover; the direction
may rearrange the blocks into its own desktop structure, but every block stays.
<!-- /PAGE -->

## The 5 directions (each clearly different from the other four AND from every premium skin — see rule above)

### 1. `bubble-pop` — "BUBBLE POP"
Mood: sunny, bouncy, toy-like. Palette: SUNSHINE YELLOW #FFD23F background with cream-white bubbles, mascot blue
#1E5BDB only for accents/active states, fresh mint #4ADBA8 secondary, warm coral for likes. NOT a sky-blue screen.
Shapes: everything is an inflated, squishy speech bubble — cards are puffy white bubbles with little tails, buttons are
jelly pills, avatars sit in fat white bubble rings. Rounded heavy font (bubbly rounded sans), dark navy text.
Mascot: big 3D mascot pops out of the timeline cover waving; a tiny mascot is the active-tab marker in the nav.
Phone layout: profile card = giant speech bubble whose tail points at the avatar; stats are two small bubbles.
Desktop structure: three floating bubble columns on a yellow field of soft bubbles; navbar is a floating white jelly pill.

### 2. `lofi-room` — "WALNUT HI-FI"
Mood: cozy record-room / listening session, calm and warm. Palette: warm walnut wood #6B4226, cream #F6EBD9,
burnt orange #E8742A, olive #7A8B4A, mascot blue as the glowing VU-meter/indicator light. Warm mid-tones, not dark navy,
not purple, not neon.
Shapes: walnut wood cabinet panels, woven speaker-grille cloth cards, brushed aluminium knobs and toggle switches,
analogue VU meters, vinyl records. Friendly rounded serif headings + clean sans body.
Mascot: wearing its headphones, nodding to a turntable in the cover; it "listens" next to the post bar; Daily Quests
progress shown as little VU meters.
Phone layout: profile shown as a "Now Playing" card — avatar centered on a vinyl record label, name = track title,
title line = artist line, Following/Followers as two knob dials; bottom nav = a row of aluminium push-buttons in a wood strip.
Desktop structure: LEFT vertical nav rail = tall walnut speaker cabinet (icons + labels), center feed on grille cloth,
right column = stacked hi-fi components (coins card = cassette deck, People You May Know = playlist, Trending Groups = radio stations).

### 3. `clay-town` — "CLAY TOWN"
Mood: handmade claymation, playful and tactile. Palette: matte clay — terracotta table #D9825B, butter yellow, peach,
mint green, mascot blue; NO lilac/purple. Visible thumbprints, soft wobbly 3D clay edges, matte (never glossy).
Font: chunky soft display (as if cut from clay) + friendly sans body.
Mascot: a clay figurine of the mascot (same design) standing on the profile card holding a little sign.
Phone layout: profile card = little clay stage/platform, avatar in a clay frame; stories are clay pebbles; quests are
clay jars filling up; the bottom nav is a row of clay buttons, the active one pressed in.
Desktop structure: a clay diorama seen from the front — navbar is a clay shelf, columns are clay slabs of different
heights, clay sparkles, a clay mascot walking along the top.

### 4. `space-age` — "SPACE-AGE POP"
Mood: optimistic 1960s atomic/space-age, mid-century modern. Palette: warm cream #F4E9D4, tangerine #F28C28,
teal #2A9D8F, mustard, mascot blue accents, charcoal text. Light and warm.
Shapes: boomerang and kidney shapes, rounded "TV-screen" cards, atomic starbursts (the mascot's yellow sparkles become
starbursts), orbit rings, tiny rocket and planet doodles, mid-century geometric patterns. Font: retro space-age display
headings (wide, rounded) + clean sans body. No neon, no grids, no pixel art, no palm trees.
Mascot: in a clear bubble space helmet, flying a little rocket around the cover; mascot astronaut floats in empty space.
Phone layout: avatar in a porthole window on the profile card, stats on orbit rings; bottom nav = a curved control
console with round dial buttons.
Desktop structure: a mid-century "mission control" console — top navbar is a curved console strip, profile card is a
big porthole on the left, feed in TV-screen cards in the middle, right column as stacked boomerang panels.

### 5. `swiss-grid` — "SWISS GRID"
Mood: minimal international typographic style, calm and confident. Palette: mostly paper white #FAFAF7 and ink black,
with ONE electric mascot blue #1F4DFF for blocks/active states and tiny yellow sparkle stars. No red, no thick
cartoon outlines, no offset shadows, no halftone, no italics, no bursts.
Shapes: strict modular grid, thin black rules, sharp rectangles, generous white space, big flush-left headlines.
Font: huge clean neo-grotesk headlines (name set very large), small monospace labels for times and counts.
Mascot: flat geometric line-art version of the mascot (thin strokes, solid blue fill), used large in one grid cell and
small as the logo mark.
Phone layout: name set huge under the cover, Following/Followers as big numerals in a 2-column grid; quests as a
clean table with thin progress lines; bottom nav = thin-ruled tab row with the active tab as a blue block.
Desktop structure: an editorial grid — masthead navbar with the wordmark, asymmetric columns separated by thin rules
(profile tall on the left, feed center, coins/people/groups as rule-separated lists on the right).

## Jobs (id → output)
| id | screen | Output |
|---|---|---|
| bubble-pop-home | home | images/skins/default/bubble-pop/home.png |
| bubble-pop-group | group | images/skins/default/bubble-pop/group.png |
| bubble-pop-desktop | desktop | images/skins/default/bubble-pop/desktop.png |
| lofi-room-home | home | images/skins/default/lofi-room/home.png |
| lofi-room-group | group | images/skins/default/lofi-room/group.png |
| lofi-room-desktop | desktop | images/skins/default/lofi-room/desktop.png |
| clay-town-home | home | images/skins/default/clay-town/home.png |
| clay-town-group | group | images/skins/default/clay-town/group.png |
| clay-town-desktop | desktop | images/skins/default/clay-town/desktop.png |
| space-age-home | home | images/skins/default/space-age/home.png |
| space-age-group | group | images/skins/default/space-age/group.png |
| space-age-desktop | desktop | images/skins/default/space-age/desktop.png |
| swiss-grid-home | home | images/skins/default/swiss-grid/home.png |
| swiss-grid-group | group | images/skins/default/swiss-grid/group.png |
| swiss-grid-desktop | desktop | images/skins/default/swiss-grid/desktop.png |

Raw PNGs stay local (git-ignored under images/skins/**). Contact sheets: images/skins/default/_sheets/ (local).

## Status
- Nov 19 2026: brief written. Rev 2: differ from every premium skin. Rev 3: page-by-page field lists (owner rule), each job fed only its page list via per-job prompt files; Home + Group = two phones (top + scrolled) so every field fits. Painting.
- Nov 19 2026: all 15 painted; reviewed against each page list + every skin. 5 repainted (space-age group: invented
  sticky header; swiss desktop: worded action buttons + "Stories" label; clay desktop: "Stories"/"Rules" labels;
  bubble-pop desktop: cartoon people + heart likes; walnut desktop: cover photo replaced by room art).
  Known nits left: Clay Town phone Home shows a small "Stories" heading; Swiss desktop shows a react count.
  Sheets images/skins/default/_sheets/{_overview,<dir>}.jpg (local) sent to owner. Waiting on the pick. No CSS yet.

## Round 2 (Nov 19 2026) — owner: "make 2 more, 1 should have the original BlipVibe logo and the color scheme the logo uses" + "the one that uses the logo color scheme should be the default one"
6. `logo-classic` "LOGO CLASSIC" — **owner's pick for the new default.** Original logo mascot used unchanged; palette sampled
   from `images/blipvibe-logo.png`: royal blue #2669E4, deep blue #1E51CA, bright blue #409AF9, sky #7FCDFD, outline navy
   #00008B (text), bubble white #FDFEFA (cards), sparkle yellow #FDF26D (coins/badges). Airy blue-white page #EEF5FF,
   white rounded cards with thin navy outline, royal-blue pills. No glass/neon/cyan-pink gradients (keeps it off Vaporwave).
7. `pixel-pal` "PIXEL PAL" — cosy 8-bit handheld: pea green #E4F2C4, forest green #1F3B2D, pumpkin #FF8A3D, cream cards,
   pixel dialog-box cards, pixel-sprite mascot. No neon/CRT/scanlines.
Same page field lists as above; jobs `<dir>-<home|group|desktop>`.

### Build requirement — animations (owner: "make sure to make animations for the switches and changes")
The built default animates every switch and state change: toggle switches slide (knob + track color), feed/group/mode tabs
and the bottom nav get a sliding active indicator, page changes fade/slide in, cards stagger in, like/dislike/react pop,
Join/Joined and follow buttons morph, coin goal + quest bars fill, badges bounce in, the mascot reacts (wave/bounce).
Short (150–300 ms), eased, and disabled under `prefers-reduced-motion`.

### Build requirement — "Blip" button + menu (owner, Nov 19)
"Make a little start like the retro button but name it Blip … popup menu similar to retro but in the corresponding blip
style. The options will be all the blip styles." → owner clarified: options = **every skin the user owns**.
- Default (Logo Classic) gets a small `Blip` button (mascot head + "Blip") in the navbar, the same way Vaporwave Retro has
  its `Start` button (`vaporStart()` in js/fullskins.js ~846, CSS css/fullskins.css ~4222).
- Tap → popup menu in Logo Classic style (white card, navy outline, royal-blue side strip with mascot + "BlipVibe"),
  listing `Default` + each owned skin (owned basic skins + owned premium/full skins: Scrapbook, Witchcraft, Vaporwave …)
  with a small preview swatch and a check on the equipped one. Tap → equips that skin through the app's normal equip path
  (look changes only via set_skin_look — never a raw skin_data write), with a switch animation. Closes on outside tap.
- Only on the default look (each full skin keeps its own chrome). Read-only QA never equips anything.

### Round 2 status (Nov 19 2026)
Painted: logo-classic home/group/desktop (with the Blip button: phone = first item of the bottom nav, desktop = pill
after the search field) + `logo-classic/menu.png` (phone menu open with owned skins, phone mid-switch circular wipe +
mascot jump + "Switching to Scrapbook…" toast, desktop drop-down). Pixel Pal home/group/desktop. Repaints done: group
coin pill/bell badge (both), desktop heart likes + about line (Logo Classic), duplicate Earn Coins card (Pixel Pal).
Known nit: the desktop crop in menu.png reuses the old about line + heart likes (background only).
Sheets sent: _sheets/logo-classic.jpg, pixel-pal.jpg, _overview.jpg (7 rows).
