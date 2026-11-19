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
- `home`: **1024 x 1536** portrait. ONE iPhone portrait screen, large, centered on a plain soft backdrop, label small
  underneath: `<DIRECTION NAME> — HOME`.
- `group`: **1024 x 1536** portrait. ONE iPhone portrait screen, label `<DIRECTION NAME> — GROUP PAGE`.
- `desktop`: **1536 x 1024** landscape. ONE desktop browser window (thin generic browser chrome, URL `blipvibe.com`)
  filling most of the image, label `<DIRECTION NAME> — DESKTOP HOME`.
- Real app fields ONLY (listed below) with plausible real-looking content. NO lorem ipsum, no placeholder bars, no
  gibberish, no extra features the app does not have (no reels, no stories carousel beyond the one listed, no
  marketplace, no "trending now" widgets other than those listed). Every word readable and spelled right.
  No real brands, logos, celebrities or copyrighted characters. People's photos = generic stock-like photos.
- The mascot appears in every screen, in the direction's style: the `BlipVibe` wordmark with the mascot head, plus
  at least one bigger mascot moment (peeking from the cover, sitting on the profile card, cheering in the empty-ish
  space, as a loading/"you're all caught up" sprite, as nav active-tab indicator, etc.). Yellow sparkles are a
  recurring accent everywhere.

## Fields per screen (from index.html / js/app.js — use exactly these, nothing more)

### HOME (phone) — `#page-home`, mobile layout
1. Top bar: `BlipVibe` wordmark (mascot head + word), search icon button, bell icon (badge `3`), coin pill with coin
   icon + count (e.g. `1,240`), small round user avatar.
2. **Timeline cover** — the user's wide cover photo across the top (a real-looking photo, e.g. a beach sunset).
3. **Profile card** — profile cover strip, round **avatar** (with small camera edit badge), **name** (e.g. `Maya Rivera`),
   **title** line (`Living my best life`), **about** text (1 line, e.g. `Coffee addict, sunset chaser, part-time adventurer.`),
   two stats `Following 248` and `Followers 1,032`, link `View Profile` + a small pencil edit button.
   The profile must stay prominent on Home (never removed or tiny).
4. Two pill buttons: `People You May Know` and `Trending Groups`.
5. **Stories row**: first bubble `Your Story` (user avatar with a + badge), then 4 friends' round story bubbles with first
   names under them (ring = unseen, faded ring = seen).
6. **Post bar**: small user avatar + field text `What are we posting today?`.
7. **Daily Quests** panel: heading `Daily Quests` + small `Resets daily`; 3 quests, each = icon, label, progress bar +
   count, coin reward: `React to 5 posts` 3/5 +5 · `Send 3 messages` 2/3 +10 · `Like 5 posts` 4/5 +5.
   Then a slim **coin goal** bar: `1,240 / 300 coins` and the next skin name (e.g. `Heaven's Light`) over a progress track.
8. Feed tabs: `Following` (active) · `Discover` · `My Posts`.
9. One **post** (may be cut off by the bottom nav): author avatar, author name, time (`2h ago`), `⋯` menu, post text
   (1–2 lines), one photo, action row: like (thumbs-up, active) `128`, dislike (thumbs-down) `2`, react (smiley),
   comment `14`, share `5`.
10. **Bottom nav** (5 items, icon + label): `Home` (active) · `Groups` · `Skins` · `Network` · `Messages` (badge `2`).

### GROUP PAGE (phone) — `#page-group-view`
1. Top bar: back arrow `←`, page title = group name.
2. **Group cover** (wide banner photo) + **group picture** (its own photo, overlapping the cover).
3. **Group name** (e.g. `Weekend Hikers`) + one-line **description** (`Trails, views and trail snacks every Saturday.`).
4. Stats: `Members 12,430` · `Posts 318` · `Group Coins 2,450` (coin icon).
5. Buttons: `Join Group` (primary) · `Leave Group` (secondary, danger tint); small `Invite Link` and `Group Rules` buttons.
6. Mode tabs: `Feed` (active) · `Chat` · `Group Shop`.
7. **Members** card: heading `Members`, 6 round member avatars + `+42 more`.
8. **Post bar**: small avatar + `Post in Weekend Hikers...`.
9. Heading `Group Posts` + one group post (avatar, name, time, `⋯`, text, photo, like/dislike/comment/share counts).
10. Same bottom nav as Home, `Groups` active.

### DESKTOP HOME — `#page-home`, ≥1100px
1. **Top navbar**: `BlipVibe` wordmark with mascot, search field `Search...`, nav links with icons `Home` (active) ·
   `Groups` · `Skins` · `Network` · `Saved` · `Messages` (badge) · `Notification` (badge), coin pill `1,240`,
   user avatar + `Maya Rivera` + chevron.
2. **Timeline cover** photo banner.
3. **Left column**: the profile card (cover strip, avatar + camera badge, name, `Living my best life`, about line,
   `Following 248` / `Followers 1,032`, `View Profile`, edit pencil) and a `Photos` card (6 small photo thumbnails + `View All`).
4. **Center column**: stories row (`Your Story` + 5 friends), post bar `What are we posting today?`, the `Daily Quests`
   panel + coin goal bar (as in Home), feed tabs
   `Following` · `Discover` · `My Posts`, two posts (as in Home; one with a photo).
5. **Right column**: `Earn Coins on BlipVibe` card (subtitle `Earn coins by interacting and spend them in the Skin Shop
   to customize your profile!`, rules `Daily Login +5`, `Post +5 (5/day)`, `Comment +2 (15/day)`, `Like +1 (30/day)`);
   `People You May Know` card (3 people: avatar, name, `Follow` button, `View More`); `Trending Groups` card
   (3 groups: picture, name, member count); a `Trending Hashtags` button.
   The direction may rearrange these blocks into its OWN desktop structure (see each direction) — but keep every block.

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
- Nov 19 2026: brief written; concepts painting.
