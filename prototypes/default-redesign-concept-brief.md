# New DEFAULT BlipVibe look — 5 mascot-led concept directions (brief for Codex image generation)

Goal: a completely new look for the plain **default** BlipVibe style (what everyone sees with no premium/full skin).
It must look NOTHING like today's default (dark navy slate background, violet #8b5cf6 accents, flat Roboto cards,
three-column web layout). Every direction is built around the BlipVibe **mascot**: the smiling glossy blue
speech-bubble character with white headphones and two small yellow sparkles (reference: `images/blipvibe-logo.png`,
open it first and keep the character on-model — same face, headphones, bubble tail, sparkles; it may be redrawn in
the direction's art style and posed: waving, peeking, listening, sleeping, cheering).

Concept art only. Nothing is built from this pass until the owner picks a direction.

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
7. Feed tabs: `Following` (active) · `Discover` · `My Posts`.
8. One **post** (may be cut off by the bottom nav): author avatar, author name, time (`2h ago`), `⋯` menu, post text
   (1–2 lines), one photo, action row: like (thumbs-up, active) `128`, dislike (thumbs-down) `2`, react (smiley),
   comment `14`, share `5`.
9. **Bottom nav** (5 items, icon + label): `Home` (active) · `Groups` · `Skins` · `Network` · `Messages` (badge `2`).

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
4. **Center column**: stories row (`Your Story` + 5 friends), post bar `What are we posting today?`, feed tabs
   `Following` · `Discover` · `My Posts`, two posts (as in Home; one with a photo).
5. **Right column**: `Earn Coins on BlipVibe` card (subtitle `Earn coins by interacting and spend them in the Skin Shop
   to customize your profile!`, rules `Daily Login +5`, `Post +5 (5/day)`, `Comment +2 (15/day)`, `Like +1 (30/day)`);
   `People You May Know` card (3 people: avatar, name, `Follow` button, `View More`); `Trending Groups` card
   (3 groups: picture, name, member count); a `Trending Hashtags` button.
   The direction may rearrange these blocks into its OWN desktop structure (see each direction) — but keep every block.

## The 5 directions (each must look clearly different from the other four AND from all premium skins:
no scrapbook paper/tape, no witch/magic, no anime, no clouds/temples/gold laurels, no gothic, no comic halftone,
no vaporwave neon grids/Windows-95, no beige café neutrals)

### 1. `bubble-pop` — "BUBBLE POP"
Mood: sunny, bouncy, toy-like. Palette: bright sky blue #3BA3FF, deep mascot blue #1E5BDB, sunshine yellow #FFD23F,
white, soft mint accents. Light background (pale blue with big soft polka bubbles).
Shapes: everything is a glossy, inflated 3D speech bubble — cards are puffy bubbles with little tails, buttons are
jelly pills with highlights, avatars sit in glossy bubble rings. Rounded chunky font (like a heavy rounded sans).
Mascot: big glossy 3D mascot floats out of the timeline cover waving; tiny mascot is the active-tab dot in the nav.
Phone layout: profile card is a giant speech bubble whose tail points at the avatar; stats are two little bubbles.
Desktop structure: three floating bubble columns over a sky of bubbles; navbar is a floating jelly pill.

### 2. `lofi-room` — "LO-FI LISTENING ROOM"
Mood: cozy late-night listening session, calm, warm. Palette: deep ink blue #121A33, warm lamp amber #FFB547,
cream #F6EBD9, mascot blue glow, muted coral for likes. Dark but WARM (not neon, not purple).
Shapes: soft felt/fabric panels, rounded speaker-grille textures, sound-wave lines, vinyl and knob details,
small equalizer bars. Friendly rounded serif headings + clean sans body.
Mascot: wearing its headphones, curled up on a beanbag with a lamp beside it in the cover; it "listens" next to the
post bar; sleeping mascot = feed end.
Phone layout: profile shown as a "Now Playing" card — avatar is centered on a vinyl record, name is the track title,
title line is the artist line, Following/Followers as two knob-style dials; bottom nav is a radio-dial strip.
Desktop structure: LEFT vertical nav rail styled like a tall speaker cabinet (icons + labels), center feed,
right column as a stacked hi-fi unit (coins card = cassette deck, People You May Know = playlist, Trending Groups = stations).

### 3. `clay-town` — "CLAY TOWN"
Mood: handmade claymation, playful and tactile. Palette: matte clay pastels — mascot blue, butter yellow, peach,
mint, lilac, on a warm off-white clay table. Visible thumbprints/soft clay edges, everything slightly wobbly 3D.
Font: chunky soft display (like it was cut from clay) + friendly sans body.
Mascot: a clay figurine of the mascot (same design), standing on the profile card holding a sign / building posts.
Phone layout: the profile card is a little clay stage/platform with the avatar in a clay frame; stories are clay
pebbles; the bottom nav is a row of clay buttons, the active one pressed in.
Desktop structure: a clay diorama table seen from the front — top navbar is a clay shelf, columns are clay slabs of
different heights, decorative clay sparkles and a clay mascot walking along the top.

### 4. `glass-aurora` — "GLASS AURORA"
Mood: sleek, premium, calm tech. Palette: deep ocean-to-electric-blue gradient background with soft aurora ribbons
(blue → cyan → a touch of yellow sparkle light — NO pink/magenta, NO grid lines), frosted white glass panels, white text.
Shapes: frosted translucent glass cards with thin bright edges and soft blur, floating with depth; tiny star sparkles.
Clean geometric sans font.
Mascot: a softly glowing translucent glass mascot hovering beside the profile card, sparkles drifting off it.
Phone layout: timeline cover fades into the aurora; the profile card floats overlapping the cover, centered avatar;
the bottom nav is a floating frosted glass capsule detached from the edge.
Desktop structure: a centered feed column with glass panels floating at different depths on both sides; navbar is a
slim floating glass bar; a big glowing mascot sits low in the background aurora.

### 5. `bold-poster` — "BOLD POSTER"
Mood: confident graphic-design poster, flat and punchy. Palette: electric mascot blue #1F4DFF, signal yellow #FFE14A,
paper white, ink black. FLAT colour blocks, thick black outlines, no gradients, no glossy.
Font: huge heavy grotesk headlines (name in very large type), small mono labels for times/counts.
Mascot: flat vector mascot in thick outlines, used big and cropped (peeking from the edge of the cover), plus small
mascot stickers/badges; sparkles as flat yellow 4-point stars.
Phone layout: name set huge across a yellow block under the cover, Following/Followers as giant numerals;
cards are hard-edged blocks with thick outlines and offset black shadows; bottom nav is a solid blue bar with
square tabs, active tab yellow.
Desktop structure: a magazine/poster grid — masthead navbar with the huge wordmark, asymmetric blocks
(profile block tall on the left, feed in the middle, coins/people/groups as stacked colour blocks on the right).

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
| glass-aurora-home | home | images/skins/default/glass-aurora/home.png |
| glass-aurora-group | group | images/skins/default/glass-aurora/group.png |
| glass-aurora-desktop | desktop | images/skins/default/glass-aurora/desktop.png |
| bold-poster-home | home | images/skins/default/bold-poster/home.png |
| bold-poster-group | group | images/skins/default/bold-poster/group.png |
| bold-poster-desktop | desktop | images/skins/default/bold-poster/desktop.png |

Raw PNGs stay local (git-ignored under images/skins/**). Contact sheets: images/skins/default/_sheets/ (local).

## Status
- Nov 19 2026: brief written; concepts painting.
