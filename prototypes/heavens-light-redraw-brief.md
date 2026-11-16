# Heaven's Light — production art traced from the approved concept (complete, one pass)

Owner approved (Nov 16): `images/skins/heavens-light/concept-v1-approved.png` (sheet 1) + `concept-2.png` (sheet 2).
Build the skin's assets FROM THE CONCEPT and match it ALMOST 1:1: every piece must look like its counterpart in the
concept crops — same shape, proportion, ornament, material, colour. Do not invent a different style. The owner wants
EVERYTHING visible in the concept (icons, badges, frames, props), so this list is the full inventory.

Material (copy the concept): a classical HEAVENLY SKY TEMPLE at sunrise — polished warm IVORY/WHITE MARBLE with soft
grey-gold veins, fluted marble columns with Ionic/Corinthian capitals, rich polished GOLD trim (warm, saturated, with
highlights and a thin dark-bronze edge so it never melts into the white), golden laurel wreaths, feathered golden
WINGS, sunrise clouds in peach / cream / soft gold, warm high-key glow and light rays. Painted, rich and crafted —
NOT flat, NOT CSS-looking. Keep each piece's centre calm and light (text sits there); ornament on rims/corners/ends.

Lessons from the other skins (the owner rejected these, don't repeat them):
- Flat frames read as CSS. Feature pieces (quests, featured skin, page props) must be painted illustrations.
- Cards and page must CONTRAST: the page background is a step deeper/warmer (sunrise sky + marble) than the
  creamy-white cards, so cards pop.
- OWNER (Nov 16): **"make the posts have something around them"** — every post sits inside an ornate GOLD +
  MARBLE FRAME on ALL FOUR sides (see post-panel), and every post photo has its own gold frame.
- 9-slice pieces: corners hold the ornament, long edges plain and uniform so they can stretch/repeat; state the
  corner size you used in px in the contact sheet.

References (3x crops, one per phone screen): `~/Developer/BlipVibe/prototypes/reference/heavens-light/`
home, skins, profile, groups, post, messages, chat (sheet 1) and home-full, network, notifications, search, group-page,
other-profile, comments, create-post, story (sheet 2). Full sheets: `images/skins/heavens-light/concept-v1-approved.png`,
`images/skins/heavens-light/concept-2.png`.

Rules: NO text, NO letters, NO avatars/photos/people (the app supplies those). Transparent PNG (real alpha) outside every
shape; frames have fully transparent windows. Draw each piece WHOLE at the stated size. Small pieces (icons, badges)
razor sharp. Save into `~/Developer/BlipVibe/images/skins/heavens-light/kit/hl/` with the exact file names. Finish with
contact sheets `_sheet-a.png`, `_sheet-b.png` (each piece beside its crop).

## 1. Page + bars
| file | size | from |
|---|---|---|
| background.png | 1290x2796 opaque | every screen: warm ivory marble wall with faint columns at the far left/right edges and soft sunrise clouds/peach glow at the top; calm middle; a step deeper/warmer than the cards |
| header.png | 1290x520 opaque | home top banner: sunrise sky, clouds, marble colonnade tops at both sides, golden light rays, laurel garland along the bottom edge; calm band in the middle for the bar icons |
| top-bar.png | 1290x260 | other pages: ivory marble strip with a thin gold moulding along the bottom and small column capitals at both ends |
| title-laurel.png | 900x180 | the gold LAUREL branches either side of every page title ("BLIPVIBE", "SKINS", "GROUPS"…) — left + right branches, empty middle |
| wings-crest.png | 1000x220 | the pair of big golden wings flanking the top of the screen (sheet title) — decoration above the home logo |
| nav-bar.png | 1290x300 | bottom bar: ivory marble slab with a gold moulding on top, rounded top corners |
| nav-active.png | 260x240 | active tab: glowing GOLD rounded tile (Home/Skins/Groups active in the concept) |
| icon-home / icon-groups / icon-skins / icon-network / icon-messages.png | 256x256 | nav icons exactly as the concept: gold temple (columns + pediment), three people, a pair of golden WINGS, three connected nodes, envelope — gold line-and-fill with bronze edge |
| icon-home-on … icon-messages-on.png | 256x256 | same icons in WHITE/cream for the gold active tile |
| coin.png | 200x200 | gold coin with embossed laurel |
| coin-pill.png | 460x140 | "2,450": ivory marble pill with gold rim |
| corner-column-left.png / corner-column-right.png | 300x900 | page side deco: a slim marble column with capital + a curl of cloud at its base (groups/messages/profile edges) |

## 2. Icons (256x256, transparent; gold/bronze line icons, same family as the nav icons)
icon-search, icon-bell, icon-music, icon-back (thin arrow), icon-plus, icon-compose (pen on square), icon-phone, icon-more,
icon-close, icon-like, icon-like-on (filled gold heart), icon-dislike, icon-comment, icon-share, icon-reply, icon-react
(gold sun-burst), icon-chevron, icon-check, icon-clear, icon-photo, icon-camera, icon-emoji, icon-gif, icon-poll,
icon-schedule, icon-globe, icon-mute, icon-block, icon-report, icon-heart, icon-star (Close Friend), icon-gift.
Notification icons 200x200 (notifications crop, left of each row): notif-like (heart), notif-follow (person +),
notif-comment (bubble), notif-mention (@), notif-message (envelope), notif-group (three people), notif-purchase (gift box) — gold.
badge-count.png 120x120: the small red-gold round notification badge (number added by app).

## 3. Home (crops home + home-full)
| file | size | from |
|---|---|---|
| avatar-wings.png | 600x600 | home top-left: round gold laurel-wreath frame with golden wings below it around the profile photo, transparent window |
| quests-frame.png | 1200x820 | Daily Quests: a PAINTED marble temple tablet — ivory marble slab with gold moulding, small columns at both sides, laurel crest at the top centre, cloud wisps at the base. Calm centre for the title + 3 quest rows |
| quest-row.png | 1100x200 | each quest row: soft marble inset with a thin gold edge |
| halo-0 / halo-50 / halo-100.png | 240x240 | the quest progress ring = a golden HALO filling with light: 0 = faint unlit gold ring, 50 = half the ring glowing, 100 = full radiant halo with rays |
| goal-track.png / goal-fill.png | 900x60 | quest/coin progress: marble track / glowing gold fill |
| reward-pill.png | 300x120 | "+5" with coin: small ivory pill with gold rim |
| tab.png / tab-active.png | 420x140 | FOLLOWING / DISCOVER / MY POSTS: ivory marble pill with gold rim / filled glowing gold pill |
| story-ring.png / story-add.png | 400x400 | story avatar ring: gold ring with tiny laurel; "Add Story": ivory circle with gold + |
| composer.png | 1200x200 | "What are we posting today?": ivory pill field with gold rim, little laurel at each end |
| featured-frame.png | 1200x340 | Featured Skin: ornate gold frame with laurel corners and tiny wings at the top centre, transparent window |
| coin-goal-frame.png | 520x600 | COIN GOAL: marble tablet with gold moulding (sits beside the quests on home-full) |
| coin-stack.png | 300x240 | stack of gold coins |
| post-panel.png | 1200x1100 | **POST FRAME (owner):** creamy white marble card framed on ALL FOUR sides by an ornate GOLD moulding — corner ornaments of laurel leaves + small feathered wings, a sunburst/halo crest at the top centre, beaded gold rim, thin dark-bronze outer edge, soft painted drop shadow. 9-slice-safe: corners ~180px, plain uniform edges between |
| post-panel-b / post-panel-c.png | 1200x1100 | two more post frame looks in the same family (b: marble columns as the left/right edges with capitals at the corners; c: laurel garland running around all four sides with a wing crest) — posts vary |
| photo-frame.png | 1200x900 | post photo: rich gold frame (beaded inner rim, laurel corner clusters), transparent window, 9-slice corners ~140px |
| action-strip.png | 1200x150 | post action row (like · dislike · comment · share): faint marble strip with a thin gold top line |

## 4. Profile (crop profile) + other profile (crop other-profile)
| file | size | from |
|---|---|---|
| temple-arches.png | 1290x1000 | the 3 ARCHED TEMPLE WINDOWS between marble columns at the top of the profile = the 3 timeline photos (`timeline: 3`): columns, capitals, round-topped arches with TRANSPARENT windows, clouds at the base |
| temple-arch-mask.png | 1290x1000 | white = the three arch windows, black elsewhere (same canvas as temple-arches) |
| cameo-wings.png | 700x760 | the profile photo: OVAL gold cameo frame with laurel crown on top and big golden WINGS spreading from the bottom, transparent oval window |
| cameo-mask.png | 700x760 | white oval window, black elsewhere |
| camera-badge.png | 160x160 | small round dark-gold badge with white camera |
| laurel-sprig.png | 260x200 | the gold laurel sprigs left/right of the bio text (left; app mirrors for right) |
| stats-frame.png | 1100x260 | 312 FOLLOWING | 2,048 FOLLOWERS: marble panel with gold rim and a thin gold vertical divider in the middle |
| edit-btn.png | 900x170 | EDIT PROFILE: ivory pill with thick gold rim, laurel tips at both ends |
| follow-btn.png | 520x150 | FOLLOW: filled glowing gold pill |
| action-btn.png | 520x150 | MESSAGE / CLOSE FRIEND / INVITE TO GROUP: ivory pill with gold rim |
| menu-panel.png | 520x420 | ⋯ menu (Mute / Block / Report): ivory marble popup with gold rim, soft shadow |
| marble-ledge.png | 1290x300 | bottom of profile: marble ledge with gold trim and white lilies/clouds at the corners |

## 5. Lists, Skins, Chat, Comments, Create post, Story
| file | size | from |
|---|---|---|
| list-row.png | 1200x240 | groups/messages/network/search/notifications rows: ivory marble row, thin gold edge, rounded |
| join-btn.png | 380x140 | JOIN / FOLLOW: ivory pill with gold rim, gold-tinted |
| chip.png / chip-active.png | 400x130 | filters (ALL, AESTHETIC… / MY GROUPS…): ivory marble pill with gold rim / filled glowing gold pill |
| seg-tab.png / seg-tab-active.png | 520x140 | CONNECTIONS / PEOPLE-GROUPS-POSTS / FEED-CHAT-GROUP SHOP: same as chip, wider |
| unread-dot.png | 100x100 | gold round badge (count added by app) |
| plus-btn.png | 160x160 | groups "+": gold rounded square with white + |
| field.png | 1100x170 | search / comment / message fields: ivory pill with thin gold rim |
| skin-card.png | 640x760 | skins shop card: ornate gold frame with laurel corners, window on top for the art, name in the art, price pill along the bottom |
| skin-card-mask.png | 640x760 | white = the card's art window |
| price-pill.png / equipped-tag.png | 360x120 | "300" ivory pill with gold rim / "EQUIPPED" filled gold pill |
| bubble-in.png | 900x300 | chat received: ivory marble bubble, thin gold rim |
| bubble-out.png | 900x300 | chat sent: soft GOLD gradient bubble with a tiny sparkle |
| input-bar.png | 1290x220 | chat bottom: marble bar with gold top line |
| send-btn.png / round-btn.png | 180x180 | gold round send button with white paper plane / ivory round button with gold rim (+, emoji) |
| comment-bubble.png | 1000x300 | comments: ivory marble comment card with gold edge |
| text-area.png | 1100x420 | create post text box: marble panel with gold rim |
| tool-tile.png | 300x260 | create post tools (Add Photo, Camera, Emoji, GIF, Poll, Schedule): ivory tile with gold rim |
| post-btn.png | 1200x170 | POST: big glowing gold pill |
| public-pill.png | 360x110 | "Public ▾": small ivory pill |
| story-field.png | 1100×150 | story reply: translucent ivory pill with white outline |
| heart-orb.png / sun-orb.png / like-orb.png | 180x180 | story reactions: ivory orb with gold heart / gold sun-sparkle orb / ivory orb with gold thumbs-up |
| group-avatar-frame.png | 420x420 | group page: rounded-square gold frame around the group picture, transparent window |

## 6. Page decoration (painted props, each page different — like Good Witch's page-deco scenes)
page-deco-groups / -skins / -network / -notifications / -search / -messages / -post.png, 1290x520 each: bottom scenes of
heavenly temple props on clouds — marble column fragments, a golden harp, a small winged statue, laurel wreath,
white lilies and roses, a gold lyre, doves, an urn with flowers, sun rays. Transparent above the props.
title-crest.png 420x120: small gold halo-sunburst with tiny wings (above page titles where the concept shows one).
