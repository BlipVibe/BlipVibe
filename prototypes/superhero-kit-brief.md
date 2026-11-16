# Superhero — production art kit (complete inventory, BOTH renditions)

Owner approved (Nov 16) the four concept sheets:
- HEROES: `images/skins/superhero/concept-heroes.png` (sheet 1) + `concept-heroes-2.png` (sheet 2)
- VILLAINS: `images/skins/superhero/concept-villains.png` + `concept-villains-2.png`
3x crops, one per phone screen (home, skins, profile, groups, post, messages, chat, home-full, network, notifications,
search, group-page, other-profile, comments, create-post, story):
`prototypes/reference/superhero-heroes/<screen>.png` and `prototypes/reference/superhero-villains/<screen>.png`.

Build each rendition's assets FROM ITS OWN CONCEPT and match it ALMOST 1:1: every piece must look like its counterpart
in that rendition's crops — same shape, proportion, ornament, material, colour. The owner rejects anything that does not
match the concept. Each rendition is painted INDEPENDENTLY in its own style (never a recolour or filter of the other):
both kits use the SAME FILE NAMES and SAME PIXEL SIZES (one CSS places both), but the drawing inside each file follows
its own concept.

## Look per rendition (copy the concept)
**HEROES** (`kit/heroes/`): bright golden-age comic book. Cream comic paper with fine halftone dots, THICK BLACK INK
outlines, primary RED / BLUE / YELLOW, a little polished gold. Panels are square-ish comic panels with heavy black
borders and slight hand-inked wobble; red ribbon banners with yellow star bursts at the ends for titles; yellow
"plaque" buttons with black outline and a darker yellow bevel; sunny sky-blue + art-deco skyline scenery; speech
balloons. Clean, bold, hopeful, crisp ink.
**VILLAINS** (`kit/villains/`): a villain's lair. Dark GUNMETAL / black steel plates with bolts, scratches and cracks,
cracked glass, hazard stripes (yellow-black), glowing TOXIC NEON GREEN and ELECTRIC PURPLE edges, circuit traces,
skull-circuit sigils, purple smoke, green lightning. Panels have ANGULAR cut corners and sawtooth/beveled edges, never
the heroes' clean rounded panels. Active/filled pieces glow neon green; secondary accents purple.

## Rules (owner lessons from the other skins — don't repeat their rejections)
- NO text, NO letters, NO numbers, NO avatars/photos/people in UI pieces (the app supplies text and photos). The only
  exceptions are named below (fx sound-effect bursts, the store card).
- STRICTLY ORIGINAL: no existing superhero/villain, costume, logo or emblem (no "S" shield, bat, spider, star-chest
  shield, red-blue suit with red cape, etc.). Our app mark is a "BV" bolt-star (Heroes) and a skull-circuit sigil
  (Villains) — draw them as pure shapes; "BV" letters allowed only inside those two emblems.
- Real transparent alpha outside every shape (never a painted grey/white checkerboard). Frames have fully transparent
  windows. Draw each piece WHOLE at the stated size, centred, nothing cut off at the canvas edge.
- Flat frames read as CSS: rows, cards, buttons, bars must look like painted/inked objects with texture (halftone,
  ink wobble, paper grain / metal scratches, bolts, glow).
- Cards and page must CONTRAST (the page is a step deeper than the cards). Keep centres calm where text sits;
  ornament on rims/corners/ends. Text sits on: Heroes = cream (dark ink text); Villains = dark steel (light text).
- 9-SLICE: pieces marked (9s N) are stretched by CSS with corners of N px — keep all ornament inside the corners and
  make the edges between corners plain and uniform so they repeat. Same N in both renditions.
- Small pieces (icons, badges) razor sharp; icons fill ~80% of their canvas.

Save PNGs into `images/skins/superhero/kit/heroes/` and `images/skins/superhero/kit/villains/` with the exact names
below. Finish each folder with contact sheets `_sheet-a.png` (sections 1–3) and `_sheet-b.png` (sections 4–7), each
piece beside a small crop of where it appears in the concept.

## 1. Page + bars
| file | size | what (Heroes / Villains) |
|---|---|---|
| background.png | 1290x2796 opaque | page behind everything. H: cream comic paper with soft halftone dots, a pale sky-blue wash at the very top, calm middle. V: dark cracked gunmetal wall with faint purple smoke and dim green circuit glow at the edges, calm dark middle |
| header.png | 1290x520 opaque | home top banner behind the top bar. H: blue sky with sun rays and white clouds, art-deco skyline along the bottom. V: storm sky with green lightning over the dark fortress spires, purple clouds |
| top-bar.png | 1290x260 | other pages' top bar strip. H: sky-blue band with a thick black ink line along the bottom. V: dark steel strip with bolts, hazard-stripe ends and a glowing green line along the bottom |
| title-banner.png | 900x200 (9s 200 left/right) | the plaque every page TITLE sits on ("BLIPVIBE", "SKINS", "GROUPS"…). H: red ribbon banner with black outline, folded tails and a yellow star burst at each end, blank centre. V: angular gunmetal plate with a green skull-circuit sigil at the left end and hazard stripes at the right end, glowing green rim, blank centre |
| nav-bar.png | 1290x300 | bottom bar. H: cream paper bar with a thick black ink top edge and halftone. V: dark riveted steel bar with purple-glowing seams |
| nav-active.png | 260x240 | active tab tile. H: bright yellow rounded panel with red/black ink outline. V: hexagonal steel plate glowing neon green |
| icon-home / icon-groups / icon-skins / icon-network / icon-messages.png | 256x256 | nav icons exactly as the concept. H: black-ink outline icons with colour fill — house, three people, lightning bolt (skins), three connected nodes, envelope. V: purple-lilac glowing line icons — house, three people, a domino MASK (skins), connected nodes, envelope |
| icon-home-on … icon-messages-on.png | 256x256 | the same icons for the active tile. H: black ink on yellow (bolder). V: neon green glowing |
| coin.png | 200x200 | gold coin (H: with a yellow star; V: with a tiny skull) |
| coin-pill.png | 460x140 (9s 70) | "2,450 +" pill. H: cream pill, black ink outline, yellow plus end. V: dark steel pill, green rim, green plus end |
| toggle-heroes.png | 200x200 | top-bar rendition button shown while HEROES is on: round gold-and-red winged "BV" bolt-star badge |
| toggle-villains.png | 200x200 | button shown while VILLAINS is on: green glowing skull-circuit sigil badge on dark steel |
(Each kit draws BOTH toggle files in its own style, so either button looks right on its own page.)

## 2. Icons (256x256, transparent; same family as the nav icons; -on = filled state)
icon-search, icon-bell, icon-music, icon-back, icon-plus, icon-compose (pen on square), icon-phone, icon-more,
icon-close, icon-like, icon-like-on, icon-dislike, icon-dislike-on, icon-comment, icon-share, icon-reply, icon-react
(H: small red-yellow comic starburst; V: green spark burst), icon-chevron, icon-check, icon-clear, icon-photo,
icon-camera, icon-emoji, icon-gif, icon-poll, icon-schedule, icon-globe, icon-mute, icon-block, icon-report,
icon-heart, icon-star (Close Friend), icon-gift, icon-shop.
- icon-like-on: H = solid YELLOW thumbs-up on a RED comic starburst (as on the home post "427"). V = solid glowing
  neon-GREEN thumbs-up. icon-dislike-on: H = solid RED thumbs-down with black ink; V = solid glowing PURPLE thumbs-down.
  These MUST look clearly filled/lit compared with icon-like / icon-dislike (outline).
Notification icons 200x200: notif-like (heart), notif-follow (person +), notif-comment (bubble), notif-mention (@),
notif-message (envelope), notif-group (three people), notif-purchase (gift box). H: red/blue/yellow ink icons. V: purple
glowing line icons.
badge-count.png 120x120: round notification badge (H: red with black outline; V: green glowing).
unread-dot.png 100x100: unread badge in message rows (H: red; V: green).

## 3. Home (crops home + home-full)
| file | size | what |
|---|---|---|
| avatar-frame.png | 600x600 | top-left profile photo frame, transparent round window. H: thick gold ring with black ink outline. V: cracked purple steel ring with green glow |
| cover-frame.png | 1290x560 (9s 60) | the home cover picture border (the skyline area): H: thick black comic-panel border with a thin white inner line. V: angular steel frame with bolts and a green glowing inner edge. Transparent window |
| profile-card.png | 1200x420 (9s 90) | home profile card (name, bio, following/followers). H: cream panel, thick black + yellow double border, halftone corners. V: dark steel plate with cut corners, purple rim, faint circuit lines |
| stats-divider.png | 20x120 | the thin vertical line between following/followers (H: black ink; V: green) |
| quests-frame.png | 1200x760 (9s 140) | DAILY MISSIONS / DAILY QUESTS panel. H: cream comic panel with thick black/yellow border and a red ribbon title tab at the top centre (blank). V: steel plate with hazard-stripe bands at both top corners and an angular title plate at the top centre (blank) |
| quest-0 / quest-50 / quest-100.png | 240x240 | quest progress icon (count written by the app on top). H: a 5-point comic STAR — 0 = empty white star with black ink, 50 = half yellow, 100 = full bright yellow star with little action lines. V: an angular hexagon POWER CELL badge — 0 = dark, 50 = half green, 100 = full glowing green |
| goal-track.png / goal-fill.png | 900x60 (9s 30) | progress bar. H: cream track with black ink outline / yellow fill with halftone. V: dark steel track / segmented neon-green fill (segments like the concept) |
| reward-coin.png | 120x120 | the small coin before "+5" (H: gold star coin; V: gold skull coin) |
| tab.png / tab-active.png | 420x140 (9s 60) | FOLLOWING / DISCOVER / MY POSTS. H: cream slanted comic tab with black outline / bright yellow tab. V: dark steel angular tab / neon-green glowing tab |
| story-ring.png / story-add.png | 400x400 | story avatar ring (transparent centre) / "Add Story" circle with +. H: yellow-gold ink ring / yellow circle with black +. V: green glowing ring / dark circle with green + |
| composer.png | 1200x200 (9s 90) | "What are we posting today?" field. H: cream pill with black ink outline. V: dark steel bar with purple rim |
| featured-frame.png | 1200x340 (9s 90) | Featured Skin banner frame, transparent window. H: thick comic panel border with yellow star accents. V: jagged steel frame with green glow |
| coin-goal-frame.png | 520x600 (9s 90) | COIN GOAL / CHARGED ENERGY side panel. H: cream comic panel. V: steel plate |
| coin-stack.png | 300x240 | stack of gold coins (V: darker gold, faint green glint) |
| post-panel.png | 1200x1100 (9s 150) | POST card, frame on all four sides. H: cream halftone comic page, THICK black ink border with slight wobble, a second offset yellow edge peeking out bottom-right. V: dark gunmetal plate with cut corners, bolts at corners, purple glowing rim, scratches |
| post-panel-b.png / post-panel-c.png | 1200x1100 (9s 150) | two more post looks in the same rendition so posts vary. H: b = blue-tinted halftone panel with red corner star bursts; c = cream panel with a speech-burst corner. V: b = cracked-glass screen panel with green glow; c = hazard-stripe-cornered steel panel |
| photo-frame.png | 1200x900 (9s 60) | post photo border, transparent window. H: thick black comic panel border with white inner line. V: angular steel frame with green glowing inner edge |
| action-strip.png | 1200x150 (9s 60) | post action row backing (like · dislike · comment · share). H: thin black ink top line on transparent/cream. V: faint steel strip with a thin green top line |

## 4. Profile (crop profile) + other profile (crop other-profile)
| file | size | what |
|---|---|---|
| timeline-frame.png | 1290x860 | the 3 TIMELINE PHOTO frames at the top of the profile (`timeline: 3`), transparent windows. H: three tilted white-bordered comic panels (left tilted −6°, middle straight & slightly higher, right +6°) with thick black ink edges, on transparent. V: three cracked surveillance MONITORS mounted on the lair wall with cables, green-glowing bezels |
| timeline-mask.png | 1290x860 | white = the three windows exactly, black elsewhere (same canvas) |
| cameo.png | 760x760 | the big profile photo frame, transparent round window. H: thick gold ring with golden WINGS spreading from both sides and sun rays behind. V: cracked neon-green ring with spikes and a purple hood-shaped shadow behind |
| cameo-mask.png | 760x760 | white round window, black elsewhere |
| camera-badge.png | 160x160 | round camera badge (H: black with white camera; V: dark steel, green camera) |
| name-banner.png | 1000x220 (9s 220 left/right) | profile name plaque. H: red ribbon banner with black outline and folded tails (blank). V: angular steel title plate with green rim (blank) |
| laurel-sprig.png | 260x200 | the sprig left of the bio (app mirrors for the right). H: gold laurel. V: green circuit-branch |
| stats-frame.png | 1100x260 (9s 90) | following | followers panel. H: cream panel with black ink border. V: steel plate with purple rim |
| edit-btn.png | 900x170 (9s 85) | EDIT PROFILE: H: big yellow plaque button with black outline and darker yellow bevel. V: neon-green glowing angular button |
| follow-btn.png | 520x150 (9s 75) | FOLLOW (primary). H: yellow plaque. V: green glowing angular |
| action-btn.png | 520x150 (9s 75) | MESSAGE / CLOSE FRIEND / INVITE (secondary). H: cream button with black outline. V: dark steel button with purple rim |
| menu-panel.png | 520x420 (9s 80) | ⋯ menu (Mute / Block / Report). H: cream comic panel with black border + drop shadow. V: dark steel panel with purple rim |
| profile-scene.png | 1290x900 | backdrop behind the profile top. H: sun rays and art-deco skyline under a blue sky. V: lair wall with cables, purple pipes and green lights |
| skyline-deco.png | 1290x520 | bottom page decoration (network, notifications, search, create post). H: sunny art-deco skyline with clouds, transparent above. V: dark wall section with a glowing skull-circuit emblem, pipes and a hazard stripe, transparent above |

## 5. Lists, Skins, Chat, Comments, Create post, Story
| file | size | what |
|---|---|---|
| list-row.png | 1200x240 (9s 70) | groups/messages/network/search/notifications rows. H: cream panel row with black ink border. V: dark steel row, cut corners, thin purple rim |
| join-btn.png | 380x140 (9s 60) | JOIN / FOLLOW in rows. H: yellow plaque with black outline. V: green glowing angular button |
| chip.png / chip-active.png | 400x130 (9s 60) | filter chips. H: cream pill with black outline / yellow pill. V: dark steel angular pill / green glowing pill |
| seg-tab.png / seg-tab-active.png | 520x140 (9s 60) | CONNECTIONS / PEOPLE-GROUPS-POSTS / FEED-CHAT-GROUP SHOP. Same as chips, wider |
| plus-btn.png | 160x160 | groups "+" / compose button. H: yellow square with black outline. V: dark square with green + glow |
| field.png | 1100x170 (9s 85) | search / comment / message fields. H: cream pill with black outline. V: dark steel bar with purple rim |
| skin-card.png | 640x760 | Skins shop card frame, transparent art window filling the top ~80%, a strip along the bottom for the price/name. H: thick comic panel with black ink border and halftone. V: jagged steel frame with purple rim |
| skin-card-mask.png | 640x760 | white = the card's art window |
| price-pill.png / equipped-tag.png | 360x120 (9s 60) | "300" pill / "EQUIPPED" tag. H: cream pill with black outline / yellow tag. V: dark steel pill / neon-green tag |
| bubble-in.png | 900x300 (9s 100) | chat received. H: white comic SPEECH BALLOON with black ink outline and a tail at the bottom-left. V: dark purple-grey glass bubble with purple rim, tail bottom-left |
| bubble-out.png | 900x300 (9s 100) | chat sent. H: yellow speech balloon, black outline, tail bottom-right. V: dark green glass bubble with glowing green rim, tail bottom-right |
| input-bar.png | 1290x220 | chat input bar backing. H: cream bar with black ink top edge. V: steel bar with green top seam |
| send-btn.png / round-btn.png | 180x180 | send button / round button (+, emoji). H: red triangular paper-plane badge / yellow circle with black outline. V: green glowing circle with dark plane / dark steel circle with purple rim |
| comment-bubble.png | 1000x300 (9s 90) | comments card. H: cream panel with black ink edge. V: steel plate |
| text-area.png | 1100x420 (9s 90) | create post text box. H: white speech-balloon-like panel with black border. V: dark glass terminal panel with green rim |
| tool-tile.png | 300x260 (9s 60) | create post tools (Add Photo, Camera, Emoji, GIF, Poll, Schedule). H: cream tile with black outline. V: dark steel tile with purple rim |
| post-btn.png | 1200x170 (9s 85) | POST: H: big yellow plaque. V: neon-green glowing angular bar |
| public-pill.png | 360x110 (9s 55) | "Public ▾": small pill (H cream / V steel) |
| story-field.png | 1100x150 (9s 75) | story reply field: translucent pill (H white with black outline / V dark with purple rim) |
| heart-orb.png / like-orb.png / react-orb.png | 180x180 | story reactions: heart / thumbs-up / spark. H: white circle with red heart / yellow circle with thumb / red-yellow starburst. V: dark circle with purple heart / green circle with thumb / green spark |
| group-avatar-frame.png | 420x420 | group page picture frame (rounded square, transparent window). H: thick comic border. V: steel with green glow |
| group-cover-frame.png | 1290x520 (9s 60) | group page cover border, transparent window (H comic panel / V steel) |

## 6. Store card
card.png 512x512 opaque: the shop preview card for the skin. H kit: our ORIGINAL hero (a woman in a teal-and-gold suit
with a short gold cape and our gold winged BV bolt-star emblem on her chest — NOT a red/blue suit, NOT a red cape)
flying over the sunny art-deco skyline, comic-ink style. V kit: our ORIGINAL villain (hooded figure with a glowing green
visor and spiked purple cloak) before the stormy fortress with green lightning. No text.

## 7. Animation art (transparent unless stated; drawn in each rendition's style)
| file | size | what |
|---|---|---|
| fx-page.png | 1290x2796 opaque | a full-screen comic PAGE of 4 blank panels (2x2, thick gutters). H: cream panels with halftone, sky scenes. V: dark steel panels with cracked glass and green glow |
| fx-sfx.png | 900x700 | a comic SOUND-EFFECT burst WITH LETTERS. H: "POW!" in yellow-red block letters on a jagged white/yellow burst. V: "KRAKK!" in acid-green jagged letters on a purple-black shattered burst |
| fx-speedlines.png | 1290x1290 | radial action lines converging to a transparent centre (H black ink; V green-purple) |
| fx-burst.png | 1290x1290 | H: radiant yellow-white sunburst rays. V: green electric shock burst |
| fx-spark.png | 160x160 | H: small yellow comic star. V: small green electric spark |
| fx-bolt.png | 600x2796 | H: a gold-yellow comic lightning bolt with black outline. V: a jagged neon-green lightning bolt with purple glow |
| fx-crack.png | 1290x2796 | full-screen shattered-glass crack pattern radiating from the centre (H: black ink comic cracks; V: glowing green cracks) |
| fx-shard.png | 300x300 | a single glass shard (H: comic-inked blue-white; V: dark glass with green edge) |
| fx-cloud.png | 1400x700 | H: puffy white comic cloud bank. V: billowing purple smoke cloud |
