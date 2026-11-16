# Vaporwave — production art traced from the approved concept (complete, one pass)

Owner: build the skin's assets FROM THE CONCEPT and match it ALMOST 1:1. Every piece must look like its counterpart in
the concept crops — same shape, proportion, colour, material. Do not invent a different style. The owner wants
EVERYTHING visible in the concept (icons, badges, frames, windows, props), so this list is the full inventory.

Material (copy the concept): 1995 desktop meets 80s synthwave.
- Page = polished WHITE/GREY MARBLE with soft lilac-grey veins.
- UI = classic 90s desktop WINDOWS: light grey (#c8c8d0) bodies with crisp raised/sunken bevels (white top-left edge,
  dark grey bottom-right edge, 2–3px each at 1x), deep NAVY-to-blue gradient title bars (#0a1a8c → #1c4fd8) with the
  three small grey title buttons (_ □ ×) on the right.
- Accent = hot PINK / magenta (#ff4fc8) filled buttons and progress segments, cyan touches.
- Scenery = synthwave sunset: big striped pink-orange sun, black/indigo palm silhouettes, neon magenta-purple
  perspective grid floor, pink-purple sky, light VHS scanlines.
Crisp, clean, high-res; bevels razor sharp (no blur, no smudge). It must look like real crafted UI art, not CSS.

References (3x crops, one per phone screen): `~/Developer/BlipVibe/prototypes/reference/vaporwave/`
home, skins, profile, groups, post, messages, chat (sheet 1) and home-full, network, notifications, search, group-page,
other-profile, comments, create-post, story (sheet 2). Full sheets: `images/skins/vaporwave/concept.png`, `concept-2.png`.

Rules: NO text, NO letters (EXCEPT the chrome wordmark + chrome page titles in section 1, which are the only lettering),
NO avatars/photos/people (the app supplies those). NO Microsoft/Windows logo anywhere (the Start button uses a small
pixel palm-sunset emblem instead). Transparent PNG (real alpha) outside every shape; frames have fully transparent
windows. Draw each piece WHOLE at the stated size. For windows/panels/rows/buttons keep detail in the corners and
title bar and keep long edges plain so they stretch as 9-slices; state nothing in the middle of panels (text sits
there). Small pieces (icons, badges, title buttons) must be razor sharp.
Save into `~/Developer/BlipVibe/images/skins/vaporwave/kit/vw/` with the exact file names. Finish with a contact sheet,
each piece beside its crop.

## 1. Page, headers, titles, bars
| file | size | from |
|---|---|---|
| background.png | 1290x2796 opaque | every screen: white/grey polished marble, soft lilac-grey veins, calm and light |
| header-home.png | 1290x600 opaque | home top: synthwave sunset — big striped pink/orange sun right of centre, palm silhouettes left + right, neon purple grid floor, pink-purple sky; bottom 80px fades to a thin pink/white horizon line |
| header-page.png | 1290x360 opaque | groups/messages/post/search/notifications/network top banner: same scene compressed (sun centre-right, palms both sides, grid floor), room on the left for the title |
| header-profile.png | 1290x620 opaque | profile top: the taller sunset with clouds, sun centred, palms both sides, grid floor at the bottom |
| wordmark.png | 900x220 | "BlipVibe" in italic CHROME lettering (silver-white metallic gradient, dark outline, pink-purple reflection), exactly as the home concept |
| title-groups / -messages / -skins / -network / -notifications / -search / -post / -comments / -create-post / -profile.png | 900x180 each | the page title in the SAME chrome italic lettering ("Groups", "Messages", "Skins", "Network", "Notifications", "Search", "Post", "Comments", "Create Post", "Profile") |
| nav-bar.png | 1290x240 | bottom: 90s TASKBAR — light grey bar with a white top highlight line and raised bevel, plain middle |
| start-btn.png | 360x140 | "Start" button: raised grey bevel button with a small PIXEL PALM-SUNSET emblem on the left (no text, app adds "Start") |
| nav-tab.png / nav-tab-active.png | 240x220 | each tab: raised grey bevel tile / PRESSED tile filled hot pink with sunken bevel |
| icon-home / icon-groups / icon-skins / icon-network / icon-messages.png | 256x256 | nav icons exactly as the concept: house, three people, the small shop-bag-with-palm icon, globe, speech bubble — navy outline, light fill with pink/cyan accents, crisp 90s icon style (NOT chunky pixel blocks) |
| top-btn.png | 240x170 | top bar: raised grey bevel square button (search / bell / compose sit in it) |
| coin-pill.png | 420x170 | top bar coins: raised grey bevel button, wider |
| coin.png | 200x200 | shiny gold coin |
| badge-count.png | 120x120 | the small hot-pink round notification badge (number added by app) |
| avatar-window.png | 330x330 | top-right avatar: tiny window with navy title bar (_ □ × buttons), grey bevel frame, transparent photo window |

## 2. Windows + controls (the core kit)
| file | size | from |
|---|---|---|
| window.png | 1200x900 | THE window: grey bevel frame, navy gradient title bar 110px tall across the top with _ □ × buttons on the right, light grey body. Used for Daily Quests, Stories, Featured Skin, Coin Goal, Connections, Timeline.exe, comments… |
| window-pink.png | 1200x900 | same window but the title bar is hot-pink-to-purple gradient (Featured Skin / active) |
| panel.png | 1200x1000 | raised grey bevel panel WITHOUT title bar (post card, list blocks) |
| inset-row.png | 1200x240 | quest rows / list rows: light grey SUNKEN bevel row |
| field.png | 1200x160 | text field (search, composer, comment, message input): white SUNKEN bevel field |
| progress-track.png | 640x80 | quest bar: sunken grey bevel track with 6 empty grey segment cells |
| progress-fill.png | 640x80 | the same bar with ALL 6 cells hot pink (app reveals part of it) |
| tab.png / tab-active.png | 420x150 | Following / Discover / My Posts, Connections…: raised grey bevel button / PRESSED hot-pink button |
| chip.png / chip-active.png | 300x110 | filters (All, Aesthetic…, My Groups…): small raised grey bevel tab / pressed pink tab |
| btn.png | 520x150 | grey raised bevel button (Edit Profile, Join, Buy, Message, Close Friend…) |
| btn-pink.png | 520x150 | hot-pink raised bevel button (Follow, Post, Get Skin, Follow Back, View Invite) |
| title-btns.png | 200x70 | the three small grey title buttons _ □ × on their own (for windows drawn by the app) |
| photo-frame.png | 1200x900 | sunken bevel frame around a post photo, transparent window |
| menu-panel.png | 520x420 | ⋯ menu (Mute / Block / Report): grey raised bevel popup panel |
| icon-more.png | 160x80 | ⋯ three black dots |

## 3. Home, quests, stories, featured
| file | size | from |
|---|---|---|
| quest-icon-react.png / quest-icon-send.png / quest-icon-like.png | 200x200 | the three quest icons: purple chat bubble with dots, navy paper plane, hot-pink heart — clean 90s icon style |
| trophy.png | 120x120 | small gold trophy in the Daily Quests title bar |
| story-ring.png / story-add.png | 400x400 | story avatar ring: pink-to-purple gradient ring with white inner edge; "Your Story": same ring with a small pink + badge |
| featured-banner.png | 1200x330 | Featured Skin: window body with the synthwave sunset + marble bust art on the left half, right half calm for the text, transparent window optional |
| coin-stack.png | 300x240 | Coin Goal window: stack of gold coins |

## 4. Profile + timeline (crop profile, other-profile)
| file | size | from |
|---|---|---|
| vhs-window.png | 760x620 | Timeline photo window: small window (navy title bar with × only), grey bevel frame, TRANSPARENT photo window (the app adds the title "01_sunset.vhs", the photo and the VHS text) |
| vhs-overlay.png | 700x480 | transparent VHS look laid over each timeline photo: faint scanlines, slight RGB glitch at the edges, a little tracking noise along the bottom (no text) |
| profile-window.png | 1200x900 | "Avatar.exe": window with navy title bar (× button), transparent square photo window on the left |
| camera-badge.png | 140x140 | white camera on a dark rounded square (photo corners) |
| stats-divider.png | 20x200 | thin grey vertical divider between Following / Followers |

## 5. Lists, chat, notifications, create post, story
| file | size | from |
|---|---|---|
| list-row.png | 1200x230 | groups / messages / network / search rows: raised grey bevel row |
| unread-dot.png | 100x100 | hot-pink round badge |
| bubble-in.png | 900x300 | chat received: white rounded speech bubble with thin grey outline and tail bottom-left |
| bubble-out.png | 900x300 | chat sent: pink (#ffc4ec) rounded speech bubble with pink outline and tail bottom-right |
| send-btn.png | 180x180 | pink square bevel button with white paper plane |
| plus-btn.png | 160x160 | grey bevel square with + |
| tool-tile.png | 300x220 | create post tools (Camera, Emoji, GIF, Poll, Schedule): raised grey bevel tile |
| add-photo.png | 520x380 | create post "Add Photo": dashed sunken tile |
| notification icons 200x200: notif-like (pink heart), notif-follow (person +), notif-comment (bubble), notif-mention (@), notif-message (envelope), notif-group (three people), notif-purchase (shopping bag) — navy outline, pink/cyan accents |
| icons 256x256 (same family): icon-search, icon-bell, icon-compose (notepad), icon-back (arrow in a grey bevel button look), icon-like (heart outline), icon-like-on (filled pink heart), icon-dislike, icon-comment, icon-share, icon-reply, icon-react (smiley), icon-camera, icon-photo, icon-gif, icon-poll, icon-schedule, icon-emoji, icon-phone, icon-check, icon-close, icon-mute, icon-block, icon-report, icon-shop, icon-chat |
