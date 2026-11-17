# Blood Moon CRIMSON — production art traced from the approved concept (complete, one pass)

Owner approved (Nov 16): `images/skins/blood-moon/concept-crimson.png` (sheet 1) + `concept-crimson-2.png` (sheet 2).
Build the skin's assets FROM THE CONCEPT and match it ALMOST 1:1: every piece must look like its counterpart in the
concept crops — same shape, proportion, ornament, material, colour. Do not invent a different style. The owner wants
EVERYTHING visible in the concept (icons, badges, frames, props), so this list is the full inventory.

References (3x crops, one per phone screen): `prototypes/reference/blood-moon-crimson/` — home, skins, profile, groups,
post, messages, chat (sheet 1) and home-full, network, notifications, search, group-page, other-profile, comments,
create-post, story (sheet 2). Open them; they are the spec.

Material (copy the concept): a gothic opera house under a HUGE BLOOD-RED MOON — deep crimson velvet, black lacquered
wood and dark wine panels, ornate antique SILVER filigree (scrolls, beading, small rose finials) with a thin dark edge
so it reads on dark, ruby jewels, red roses, candle light, red-lit night sky with crimson clouds over gothic spires.
Panels are dark wine/black with a subtle damask or velvet texture; post cards are pale aged PARCHMENT with a silver frame.
Painted, rich and crafted — NOT flat, NOT CSS-looking. Keep each piece's centre calm (text sits there: light text on the
dark panels, dark ink on parchment); ornament on rims/corners/ends.

Lessons from the other skins (the owner rejected these, don't repeat them):
- Flat frames read as CSS. Feature pieces (quests, featured skin, page props) must be painted illustrations.
- Cards and page must CONTRAST: the page background is darker than the panels; parchment posts pop.
- Every post sits inside an ornate frame on ALL FOUR sides, and every post photo has its own frame.
- 9-slice pieces: corners hold the ornament, long edges plain and uniform so they can stretch/repeat; state the
  corner size you used in px in the contact sheet.

Rules: NO text, NO letters, NO avatars/photos/people (the app supplies those). Transparent PNG (real alpha) outside every
shape; frames have fully transparent windows. Draw each piece WHOLE at the stated size. Small pieces (icons, badges)
razor sharp. Save into `images/skins/blood-moon/kit/crimson/` with the exact file names. Finish with contact sheets
`_sheet-a.png`, `_sheet-b.png` (each piece beside its crop).

## 1. Page + bars
| file | size | from |
|---|---|---|
| background.png | 1290x2796 opaque | every screen: dark crimson damask/velvet wall, red velvet curtain folds at the far left/right edges, faint red moonlight at the top; calm dark middle |
| header.png | 1290x1100 opaque | home top: the big blood moon over the opera house dome (left) and gothic castle spires (right), crimson clouds, stars; dark calm band at the very top for the bar icons; fades darker at the bottom where the profile card sits |
| top-bar.png | 1290x420 opaque | other pages (Skins, Groups, Messages, Network…): crimson sky with the moon partly showing, gothic spires silhouette, velvet curtain swag at the top corners; calm middle for the title |
| title-flourish.png | 900x140 | the silver scroll flourishes either side of page titles ("Daily Quests", "People You May Know", profile name) — left + right scrolls, empty middle |
| nav-bar.png | 1290x300 | bottom bar: black lacquer slab with a silver filigree crest along the top edge (scroll arches between the tabs, a small red moon jewel at the centre) |
| nav-active.png | 260x240 | active tab: glowing crimson velvet arched tile with silver rim (Home/Skins/Groups active in the concept) |
| icon-home / icon-groups / icon-skins / icon-network / icon-messages.png | 256x256 | nav icons exactly as the concept: house, three people, layered stack, three connected nodes, envelope — antique silver line-and-fill |
| icon-home-on … icon-messages-on.png | 256x256 | same icons in bright white-silver for the crimson active tile |
| coin.png | 200x200 | gold coin |
| coin-pill.png | 460x140 | "2,450 +": dark wine pill with silver rim |
| curtain-left.png / curtain-right.png | 300x1200 | red velvet curtain drape with gold tassel tie-back for page side edges |

## 2. Icons (256x256, transparent; antique silver line icons, same family as the nav icons)
icon-search, icon-bell, icon-music, icon-back (arrow), icon-plus, icon-compose (pen on square), icon-phone, icon-more,
icon-close, icon-like (outline heart), icon-like-on (SOLID crimson heart with silver rim, as the liked post in the concept),
icon-dislike (thumb down outline), icon-dislike-on (same thumb filled solid crimson), icon-comment, icon-share (curved
arrow), icon-reply, icon-react (theatre masks), icon-chevron, icon-check, icon-clear, icon-photo, icon-camera, icon-emoji,
icon-gif, icon-poll, icon-schedule, icon-globe, icon-mute (bell), icon-block, icon-report (flag), icon-heart, icon-star
(Close Friend, gold star), icon-gift, icon-settings (gear).
Notification icons 200x200 (notifications crop, left of each row): notif-like (red heart), notif-follow (person +),
notif-comment (bubble), notif-mention (@), notif-message (envelope), notif-group (people), notif-purchase (layered stack) — silver.
badge-count.png 120x120: small round crimson badge with silver rim (number added by app).

## 3. Home (crops home + home-full)
| file | size | from |
|---|---|---|
| avatar-ring.png | 600x600 | profile picture frame: round antique-silver filigree ring with red roses clustered at the lower left, transparent round window |
| avatar-ring-small.png | 300x300 | thin silver ring for SMALL avatars (posts, rows, chat, stories), ~7% of the width, transparent window |
| profile-card.png | 1100x360 | the name/bio/stats card beside the avatar: dark wine panel with ornate silver scroll frame, roses at the right end |
| quests-frame.png | 1200x900 | Daily Quests: painted dark panel framed in silver filigree with roses at the top corners and a silver crest for the title; calm centre for the title + 3 quest rows |
| quest-row.png | 1100x200 | each quest row: dark velvet inset with a thin silver edge |
| moon-0 / moon-50 / moon-100.png | 240x240 | quest progress icon = the MOON filling: 0 = dark new moon with a faint red rim, 50 = half red moon, 100 = full glowing blood moon |
| goal-track.png / goal-fill.png | 900x60 | progress: black track with silver edge / glowing crimson fill |
| reward-pill.png | 300x120 | "+5" with coin: dark pill with silver rim |
| tab.png / tab-active.png | 420x140 | Following / Discover / My Posts: dark pill with silver rim / filled crimson velvet pill |
| story-ring.png / story-add.png | 400x400 | story ring: silver filigree ring with a tiny rose; Your Story: dark circle with silver + |
| composer.png | 1200x160 | "What are we posting today?": dark pill field with silver rim and room for the pen icon at the right |
| featured-frame.png | 1200x300 | Featured Skin ("Blood Moon / The Opera Returns"): ornate silver frame with a chandelier crest on top, transparent window |
| coin-goal-frame.png | 1200x110 | "Coin Goal: 2,450 / 3,000": slim dark bar frame with silver scroll ends |
| post-panel.png | 1200x1100 | POST CARD: pale aged parchment framed on ALL FOUR sides by an ornate antique SILVER moulding (scroll corners, beaded rim, thin dark outer edge), soft painted shadow. 9-slice: corners ~160px, plain uniform edges between |
| post-panel-b / post-panel-c.png | 1200x1100 | two more post looks in the same family (b: silver frame with small red roses at the corners; c: frame with a gothic arch crest at the top centre and candle finials) — posts vary |
| photo-frame.png | 1200x900 | post photo: thin ornate silver frame with beaded inner rim, transparent window, 9-slice corners ~100px |
| action-strip.png | 1200x150 | post action row (like · dislike · comment · share): faint parchment strip with a thin silver top line |

## 4. Profile (crop profile) + other profile (crop other-profile)
| file | size | from |
|---|---|---|
| gothic-windows.png | 1290x1100 | the THREE gothic stained-glass ARCHED WINDOWS at the top of the profile = the 3 timeline photos (`timeline: 3`): black iron + silver tracery, pointed arches, ruby glass accents, roses at the base; the three windows TRANSPARENT (left, middle, right, side by side like other-profile; middle slightly taller); the profile picture will sit in front of the middle-bottom |
| gothic-windows-mask.png | 1290x1100 | white = the three windows, black elsewhere (same canvas) |
| cameo-frame.png | 700x700 | the big profile picture: round ornate silver frame with red roses at the lower left and a silver crest on top, transparent round window |
| cameo-mask.png | 700x700 | white round window, black elsewhere |
| camera-badge.png | 160x160 | small round dark badge with silver rim and white camera |
| candelabra.png | 300x700 | silver candelabra with three lit red candles (left of the name; app mirrors for right) |
| stats-frame.png | 1100x220 | 428 Following | 2,971 Followers: transparent centre, silver scroll divider in the middle and small flourishes at both ends |
| edit-btn.png | 900x170 | Edit Profile: crimson velvet pill with thick silver rim and scroll tips at both ends |
| follow-btn.png | 520x150 | Follow: filled crimson velvet pill, silver rim |
| action-btn.png | 520x150 | Message / Close Friend / Invite to Group: dark pill with silver rim |
| menu-panel.png | 520x420 | ⋯ menu (Mute / Block / Report): pale parchment popup with silver rim, soft shadow |
| rose-ledge.png | 1290x360 | bottom of profile: red roses and silver filigree with a ruby moon jewel at the centre |

## 5. Lists, Skins, Chat, Comments, Create post, Story
| file | size | from |
|---|---|---|
| list-row.png | 1200x240 | groups/messages/network/search/notifications rows: dark wine velvet row with a thin silver frame and small corner scrolls |
| join-btn.png | 380x140 | Join / Follow / Follow Back / View Invite: crimson velvet pill with silver rim |
| chip.png / chip-active.png | 400x130 | filters (All, Aesthetic… / My Groups…): dark pill with silver rim / filled crimson pill |
| seg-tab.png / seg-tab-active.png | 520x140 | Connections / People-Groups-Posts / Feed-Chat-Group Shop: same as chip, wider |
| unread-dot.png | 100x100 | crimson round badge with silver rim (count added by app) |
| plus-btn.png | 160x160 | groups "+": dark round button with silver rim and silver + |
| field.png | 1100x150 | search / comment / message fields: dark pill with thin silver rim |
| skin-card.png | 640x760 | skins shop card: ornate silver frame, window on top for the art, price pill area along the bottom |
| skin-card-mask.png | 640x760 | white = the card's art window |
| price-pill.png / equipped-tag.png | 360x120 | "300" dark pill with silver rim / "Equipped" filled crimson pill |
| bubble-in.png | 900x300 | chat received: pale parchment bubble with silver rim |
| bubble-out.png | 900x300 | chat sent: crimson velvet bubble with silver rim |
| input-bar.png | 1290x220 | chat bottom: black lacquer bar with silver top line |
| send-btn.png / round-btn.png | 180x180 | crimson round send button with white paper plane / dark round button with silver rim (+, emoji) |
| comment-bubble.png | 1000x300 | comments: parchment comment card with silver edge (replies indented, same card) |
| text-area.png | 1100x420 | create post text box: parchment panel with ornate silver frame |
| tool-tile.png | 300x260 | create post tools (Add Photo, Camera, Emoji, GIF, Poll, Schedule): dark tile with silver rim |
| post-btn.png | 1200x170 | Post: big crimson velvet pill with ornate silver scroll ends |
| story-field.png | 1100x150 | story reply: translucent dark pill with silver outline |
| heart-orb.png / mask-orb.png / rose-orb.png | 180x180 | story reactions: crimson orb with white heart / dark orb with silver theatre masks / dark orb with a red rose |
| group-avatar-frame.png | 420x420 | group page: round silver filigree frame around the group picture, transparent window |
| group-banner.png | 1290x700 opaque | group page header: the opera house facade lit red under the blood moon (behind the group name) |

## 6. Page decoration (painted props, each page different)
page-deco-groups / -skins / -network / -notifications / -search / -messages / -post.png, 1290x520 each: bottom scenes
of gothic opera props — red roses, silver candelabras with lit candles, a small red moon jewel set in silver filigree,
velvet curtain swags, opera masks, a silver rose vase. Transparent above the props.
moon-crest.png 420x140: small blood moon in a silver filigree crest (centre of the nav bar / page dividers).
