# Logo Classic ("blip") — production art kit for the new BlipVibe default

Owner approved Nov 19 2026 ("Yes, build it"): the **Logo Classic** concept is the new default look.
Concept paintings: `images/skins/default/logo-classic/{home,group,desktop,menu}.png` (local only).
Reference crops (2x): `images/skins/blip/ref/` — home-top, home-scrolled, group-top, group-scrolled, desktop,
menu-phone, menu-switching, menu-desktop, logo-original (the untouched BlipVibe logo).

Build every piece FROM THE CONCEPT and match it almost 1:1 — same shape, proportion, colour, outline weight, softness.
The app's CSS only places these pieces; nothing is drawn by CSS, so every surface you see in the crops needs its art.

## Look (copy the concept)
Clean, friendly, bright. The palette is taken from the logo:
royal blue `#2669E4` (primary), deep logo blue `#1E51CA`, bright blue `#409AF9`, sky highlight `#7FCDFD`,
outline navy `#00008B` (outlines, line icons), bubble white `#FDFEFA` (cards), sparkle yellow `#FDF26D` (coins,
sparkles). Page = airy blue-white `#EEF5FF`.
- Cards: white, rounded (~18px on a 400pt-wide phone → radius ≈ 6% of a 768 tile), a THIN navy outline (like the
  logo's outline, ~2.5px at phone scale) and a soft blue drop shadow under them. Calm, plain centres.
- Buttons: solid royal-blue pills with a faint top highlight; secondary = white pill with royal-blue outline.
- Icons: rounded line icons, navy `#00008B`-ish stroke, consistent weight (like the concept's nav + action icons).
- NOT glassy, NOT neon, no cyan/pink gradients, no grid floors (keeps it far from Vaporwave). No purple.

## Rules (from the owner's rejections on other skins)
- NO text, letters or numbers in any piece (the app supplies them). NO photos or people.
- REAL transparent alpha outside every shape. NEVER paint a grey/white checkerboard to fake transparency.
- Frames have fully transparent windows. Masks: white = window, black = everything else, same canvas as their frame.
- 9-slice pieces: corners hold the rounded shape, long edges plain and uniform so they stretch cleanly.
- Draw each piece WHOLE at the stated size, centred, nothing cut off. Icons razor sharp.
- Liked/disliked ON states are clearly FILLED so the change is obvious.
- The mascot is the ORIGINAL logo character (`ref/logo-original.png`): same glossy blue bubble, white headphones,
  deep navy outline, face, bubble tail, two yellow sparkles. Do not restyle it. New poses keep it on-model.
- OWNER RULE (Nov 19): the mascot has NO ARMS, NO HANDS, NO BODY, NO LEGS — it is ONLY the speech-bubble head with
  headphones, exactly the logo's silhouette. Never draw a waving arm or anything trailing below the bubble tail. Poses
  come only from tilt, bounce, squash, expression (eyes/mouth), burst lines and sparkles.

Save every file as PNG into `images/skins/blip/kit/` with exactly the file names below. Finish each part with a
contact sheet `_sheet-<part>.png` (pieces on a mid-grey background, each beside its concept crop).

---------------------------------------------------------------------------------------------------------------------
## PART A — chrome (page, bars, cards, buttons, bars)
| file | size | from |
|---|---|---|
| background.png | 1290x2796 opaque | page behind everything: airy blue-white #EEF5FF, very faint scattered 4-point yellow sparkles, soft pale-blue cloud shapes low in the corners (concept backdrop), calm in the middle |
| header-bar.png | 1290x330 | phone top bar: royal-blue band (deep #1E51CA at top → #2669E4), a soft shadow along its bottom edge. Plain (wordmark/icons are added by the app) |
| nav-bar.png | 1290x250 | phone bottom nav: white bar with a thin pale-blue top hairline and a soft upward shadow, plain |
| nav-active.png | 240x210 | active bottom-nav tab: royal-blue rounded tile (radius ~40px), faint top highlight, soft shadow |
| panel-card.png | 768x768 | THE card: white rounded rectangle (corner radius ~48px), thin navy outline (~6px at this size), soft blue drop shadow under it (inside the canvas). 9-slice: keep the outline a constant distance from the edge |
| panel-card-active.png | 768x768 | same card with a very light blue fill #E8F1FF (highlighted row / unread) |
| card-tail.png | 768x840 | the profile card variant: same card plus a small speech-bubble tail at the bottom-RIGHT (concept profile card, "View Profile" corner) — bottom 72px holds the tail |
| chip.png | 600x160 | white pill with thin royal-blue outline (Following/Followers chips, inactive tabs) |
| chip-active.png | 600x160 | solid royal-blue pill (active feed tab / mode tab) |
| btn-primary.png | 600x160 | royal-blue pill button with a faint top highlight + soft shadow (View Profile, Buy, Group Rules, pills) |
| btn-secondary.png | 600x160 | white pill, royal-blue outline (outline buttons) |
| btn-danger.png | 600x160 | white pill, red #D93025 outline (Leave Group) |
| btn-disabled.png | 600x160 | light grey #D5DBE5 pill, no outline (Joined) |
| btn-round.png | 200x200 | small white circle, thin navy outline, soft shadow (camera button on the cover) |
| field.png | 900x140 | text field: white pill with a thin pale-blue #9CC2F5 outline ("What are we posting today?") |
| tabs-track.png | 1200x140 | feed tab strip: white pill with thin navy outline (three tabs sit inside) |
| bar-track.png | 900x60 | progress track: pale grey-blue #DCE6F5 rounded bar |
| bar-fill.png | 900x60 | progress fill: royal → bright-blue → sky gradient rounded bar, faint highlight |
| coin.png | 200x200 | gold coin: yellow #FDF26D → amber edge, thin darker rim, small shine |
| coin-stack.png | 300x260 | three stacked gold coins (coin goal) |
| coin-pill.png | 460x140 | white pill (top-bar coin count) |
| reward-chip.png | 260x140 | pale yellow #FFF6B8 rounded chip (quest "+5" reward) |
| badge-count.png | 120x120 | red #E53935 circle with a thin white ring (number added by the app) |
| divider.png | 900x12 | thin pale-blue line |
| unread-dot.png | 60x60 | royal-blue dot |

## PART B — icons (256x256 unless noted, transparent, rounded navy line icons, one family)
Nav (concept bottom nav): icon-home (house), icon-groups (three people), icon-skins (stacked layers), icon-network
(three connected nodes), icon-messages (speech bubble). Same five as WHITE line icons for the active blue tile:
icon-home-on, icon-groups-on, icon-skins-on, icon-network-on, icon-messages-on.
Top bar (WHITE line icons on the blue bar): icon-search, icon-bell, icon-music.
Actions (concept post rows): icon-like (thumbs-up outline), icon-like-on (thumbs-up FILLED royal blue, navy outline),
icon-dislike (thumbs-down outline), icon-dislike-on (FILLED royal blue), icon-emoji (smiley), icon-comment (bubble),
icon-share (curved arrow out), icon-more (three dots), icon-camera, icon-edit (pencil), icon-plus, icon-back (arrow
left), icon-send (paper plane), icon-close, icon-check, icon-chevron (right), icon-photo, icon-settings (gear),
icon-user, icon-bookmark, icon-compose (pen on square), icon-video, icon-phone, icon-heart, icon-star, icon-gift,
icon-flag, icon-globe, icon-calendar, icon-bag (shopping bag), icon-logout (door + arrow), icon-scroll (rules scroll),
icon-link (chain link), icon-exit (Leave: door with arrow, drawn in red #D93025), icon-people (two people + count).
Quest icons (royal-blue line icons, 200x200): quest-like (heart), quest-comment (bubble), quest-post (pen),
quest-react (thumbs-up), quest-save (bookmark), quest-view (eye), quest-message (paper plane), quest-share (share nodes).
Notification icons (200x200: white line icon inside a small royal-blue disc): notif-like, notif-follow, notif-comment,
notif-message, notif-group, notif-purchase.
icon-coin.png = a copy of the gold coin at 256 (Part A style).

## PART C — mascot + Blip button + menu
| file | size | from |
|---|---|---|
| mascot.png | 800x800 | the ORIGINAL logo mascot, clean, on transparent (redraw from ref/logo-original.png at full quality, unchanged) |
| mascot-head.png | 256x256 | the original mascot, small, tight crop (used as wordmark mark, nav marker, Blip button icon) |
| mascot-wave.png | 900x900 | the original mascot TILTED ~12° in a friendly greeting, with three short yellow "hi" burst lines beside it and two sparkles. NO arms |
| mascot-peek.png | 900x900 | the original mascot rising up into view, cheerful, bottom edge of the bubble cut by a soft pale-blue cloud puff, burst lines. NO arms |
| mascot-jump.png | 900x900 | the original mascot mid-bounce, eyes closed in a happy smile (^ ^), squash-and-stretch kept subtle, sparkles around. NO arms |
| mascot-sleep.png | 800x800 | the original mascot with eyes closed, calm, tiny sparkle (empty states). NO arms |
| sparkle-1.png | 200x200 | 4-point yellow sparkle star (logo sparkle) |
| sparkle-2.png | 200x200 | smaller pair of sparkles |
| burst.png | 300x300 | three short yellow burst lines (the "hi!" lines) |
| blip-btn.png | 420x170 | the Blip button: royal-blue pill with a thin white outline, slightly raised (Start-button feel), soft shadow, the left ~150px holds the mascot head (app adds the word "Blip") — plain, no mascot drawn in it |
| blip-btn-on.png | 420x170 | pressed: deeper blue #1E51CA, inset |
| menu-panel.png | 900x1300 | the Blip menu: white rounded panel (radius ~48px) with thin navy outline and soft blue shadow, a royal-blue vertical strip down its LEFT ~170px (rounded on the outer corners), plain (app writes "BlipVibe" vertically + rows) |
| menu-row-on.png | 700x130 | equipped row highlight: very light blue #E3EEFF rounded bar |
| menu-check.png | 120x120 | royal-blue circle with a white check (equipped skin) |
| swatch-ring.png | 160x160 | round thin white ring with navy outline (frames each skin's preview thumbnail) |

## PART D — profile + cover + group frames
| file | size | from |
|---|---|---|
| avatar-frame.png | 640x640 | profile picture frame: thick white ring with a soft sky-blue halo and thin navy outer line, transparent round window |
| avatar-mask.png | 640x640 | white round window of avatar-frame, black elsewhere |
| avatar-ring.png | 300x300 | small top-bar / post avatar ring: thin white ring + navy outline, transparent window |
| story-ring.png | 400x400 | unseen story ring: royal → sky gradient ring, white gap, transparent window |
| story-ring-seen.png | 400x400 | seen story ring: pale grey-blue thin ring, transparent window |
| story-add.png | 160x160 | royal-blue round "+" badge with white ring (plus drawn as a shape) |
| camera-badge.png | 160x160 | small white circle with navy outline + navy camera line icon |
| cover-mask.png | 1290x560 | white rounded-rectangle (top corners ~40px, bottom corners ~40px) on black — cover photo shape |
| photo-mask.png | 300x300 | white rounded square (radius ~30px) on black — photo thumbnails |
| group-avatar-frame.png | 640x640 | group picture frame: same as avatar-frame |
| skin-card-mask.png | 600x600 | white rounded square (radius ~48px) on black — Featured Skin preview |
