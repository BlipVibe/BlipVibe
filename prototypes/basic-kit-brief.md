# #Basic — production art traced from the approved concepts (complete, one pass per part)

Owner approved (Nov 16): the six #Basic concept sheets in `images/skins/basic/`:
ROSÉ `concept-rose.png`, `concept-rose-2.png`, `concept-rose-barista.png` and
PUMPKIN SPICE `concept-pumpkin.png`, `concept-pumpkin-2.png`, `concept-pumpkin-barista.png`.
3x crops of every phone screen: `prototypes/reference/basic-rose/` and `prototypes/reference/basic-pumpkin/`
(home, skins, profile, groups, post, messages, chat, home-full, network, notifications, search, group-page,
other-profile, comments, create-post, story, barista-menu, latte-break, last-call).

Build the skin's assets FROM THE CONCEPTS and match them ALMOST 1:1: every piece must look like its counterpart in the
crops — same shape, proportion, material, colour, softness. Do not invent a different style. The owner rejects anything
that is not extremely close to the concept.

## Material (copy the concept)
Clean-girl neutrals, photographed-real but soft: cream BOUCLÉ / oat LINEN fabric with a visible fine weave and a tiny
stitched seam just inside the edge, honed TRAVERTINE with small pits, light natural OAK with a soft grain, RIBBED matte
ceramic, warm limewash wall, soft window-light shadows. Rounded squircle shapes. Calm centres where text sits.
Thin single-weight LINE icons with rounded ends in deep espresso brown (#4a3426-ish). NOT flat, NOT CSS-looking, NOT
ornate — no gold filigree, no arches, no columns, no laurels.
- ROSÉ accents: dusty blush (#e2b8b0-ish) with a soft rose-gold hairline; cream/oat neutrals.
- PUMPKIN SPICE accents: caramel / muted pumpkin (#b8754a-ish) with a warm gold hairline; camel/oat/toffee neutrals.
Each rendition is painted on its own (never a recolour of the other) and copies ITS OWN concept crops.

## Rules (from the owner's rejections on other skins)
- NO text, NO letters, NO numbers, NO avatars/photos/people in any piece (the app supplies those). The only glyph allowed
  is the "@" line icon (notif-mention); even the "closed" sign and the menu card are blank.
- REAL transparent alpha outside every shape. NEVER paint a grey/white checkerboard to fake transparency.
- Frames have fully transparent windows. Masks: white = window, black = everything else, same canvas as their frame.
- 9-slice pieces: rounded corners hold the shape, long edges plain and uniform so they can stretch; keep the stitched
  seam a constant distance from the edge. State the corner size used (px) on the contact sheet.
- Draw each piece WHOLE at the stated size, centred, nothing cut off. Icons razor sharp, consistent line weight.
- Liked/disliked ON states must be clearly FILLED/solid so the change is obvious.

---------------------------------------------------------------------------------------------------------------------
## PART A — one full kit PER RENDITION
Save ROSÉ into `images/skins/basic/kit/rose/` and PUMPKIN SPICE into `images/skins/basic/kit/pumpkin/`, with the SAME
file names in both folders. Finish each folder with contact sheets `_sheet-a.png` and `_sheet-b.png` (each piece beside
its concept crop).

### A1. Page + bars
| file | size | from |
|---|---|---|
| background.png | 1290x2796 opaque | every screen: warm cream limewash / linen wall, very soft window-light shadow at the top corner, calm and plain; a half-step deeper than the cards so cards pop |
| top-bar.png | 1290x300 | top bar on every page: soft cream linen band with a faint stitched seam and a soft shadow along its bottom edge |
| nav-tray.png | 1200x230 | the FLOATING bottom nav: a rounded light-oak tray (pill / stadium shape) with soft grain, a slightly raised lip and a soft contact shadow under it. 9-slice-safe: ends ~110px |
| nav-saucer.png | 260x260 | active tab: a round ribbed ceramic saucer/dish (Rosé blush ceramic, Pumpkin cream ceramic with caramel glaze rim) sitting on the tray, soft shadow, calm centre for the icon |
| icon-home.png | 256x256 | "#" hashtag drawn as a thin rounded line icon |
| icon-groups / icon-skins / icon-network / icon-messages.png | 256x256 | exactly the concept's thin line icons: two people, stacked layers, three connected nodes, a speech bubble (concept nav) |
| icon-home-on … icon-messages-on.png | 256x256 | same five icons slightly bolder, in the accent's deep tone, for inside the saucer |
| icon-search, icon-bell, icon-music | 256x256 | top bar thin line icons |
| coin.png | 200x200 | small cream ceramic coin with a subtle embossed "#"-free ring motif and the accent rim |
| coin-pill.png | 460x140 | "2,450 +": cream linen pill with stitched seam (9-slice, ends ~60px) |
| barista-btn.png | 256x256 | top bar Barista Bar button: a small ribbed ceramic coffee cup on a saucer, three-quarter view, soft shadow |
| toggle-rose.png | 256x256 | season button in Rosé: a clear glass ICED LATTE with ice and a straw |
| toggle-pumpkin.png | 256x256 | season button in Pumpkin Spice: a ribbed ceramic mug with a foam leaf and a curl of steam |
| avatar-ring.png | 300x300 | small top-bar avatar ring: round ribbed ceramic ring, transparent window |

### A2. Icons (256x256, transparent, thin espresso line icons, same family)
icon-back (thin chevron arrow), icon-plus, icon-compose (pen on square), icon-phone, icon-video, icon-more (three dots),
icon-close, icon-like (heart outline), icon-like-on (heart FILLED with the accent, deep outline), icon-dislike (thumb down
outline), icon-dislike-on (thumb down FILLED with the accent), icon-comment, icon-share, icon-send (paper plane),
icon-reply, icon-chevron, icon-check, icon-clear, icon-photo, icon-camera, icon-emoji, icon-gif, icon-poll,
icon-schedule, icon-globe, icon-location, icon-mute (bell with slash), icon-block (circle slash), icon-report (flag),
icon-heart, icon-star, icon-gift, icon-edit (pencil), icon-calendar, icon-bookmark, icon-settings (gear), icon-user.
Notification icons 200x200 (notifications crop, left of each row): notif-like (heart), notif-follow (person +),
notif-comment (bubble), notif-mention (@ drawn as a line glyph — the one allowed glyph), notif-message, notif-group,
notif-purchase (gift/layers) — line icon inside a small round linen disc.
badge-count.png 120x120: small round accent-coloured ceramic badge (number added by the app).

### A3. Home (crops home + home-full) — the "SHELFIE"
| file | size | from |
|---|---|---|
| shelf-scene.png | 1290x900 | the cover area: limewash wall, a floating light-OAK shelf across the lower third, and on it THREE thin light-oak picture frames with wide white mats, leaning and slightly overlapping exactly like the concept — frame 1 TALL portrait (left-centre), frame 2 SQUARE-ish (middle, a little lower), frame 3 SMALL landscape (right) — plus the props the concept shows (Rosé: ribbed vase with peonies / pampas, a lit pillar candle; Pumpkin: vase with dried orange leaves, a candle, a mini white pumpkin). The mats' PHOTO WINDOWS are fully TRANSPARENT. Leave the left ~30% of the shelf free (the avatar dish stands there). |
| shelf-mask.png | 1290x900 | white = the three photo windows of shelf-scene, black elsewhere (pixel-exact, same canvas) |
| avatar-dish.png | 640x640 | the profile picture frame: a thick round RIBBED CERAMIC ring/dish (cream, Rosé with a blush tint, Pumpkin cream) with soft shadow, transparent round window |
| avatar-mask.png | 640x640 | white round window of avatar-dish, black elsewhere |
| place-card.png | 1100x460 | the folded tent PLACE CARD that holds name, bio, following/followers: thick cream card stock standing up, a soft fold line + back flap visible along the top, a slight shadow at its base. Calm, plain face. 9-slice-safe: corners ~70px |
| camera-badge.png | 160x160 | small round cream ceramic badge with a thin camera line icon |
| story-ring.png | 400x400 | story avatar ring: thin ribbed ceramic ring in the accent tone, transparent window |
| story-add.png | 400x400 | "+ story": cream linen circle with a thin + |
| composer.png | 1200x180 | "what's on your mind?": cream linen pill field, stitched seam, 9-slice ends ~80px |
| featured-frame.png | 1200x330 | Featured Skin card: linen squircle card with a rounded transparent photo window on the left third |
| quests-panel.png | 1200x800 | daily quests/daily routine: a linen NOTEPAD card (cream bouclé, stitched seam, rounded corners), calm centre. 9-slice corners ~90px |
| tick-0.png / tick-100.png | 120x120 | routine tick circle: empty thin ring / ring filled with the accent and a white check |
| cup-0 / cup-50 / cup-100.png | 160x200 | latte-cup progress icon (Rosé: clear glass iced latte; Pumpkin: ribbed ceramic mug): empty / half full / full with foam |
| reward-chip.png | 220x110 | "+5": small round-ended ceramic chip in the accent tone |
| goal-track.png / goal-fill.png | 900x50 | coin goal: linen track / soft accent fill with rounded ends |
| tab.png / tab-active.png | 420x130 | following / discover / my posts: plain linen pill / FILLED accent pill (soft, ceramic-matte) |
| coin-stack.png | 240x200 | small stack of cream ceramic coins |
| post-card.png | 1200x1100 | POST card: soft cream linen squircle card with stitched seam and soft shadow. 9-slice corners ~90px, plain edges |
| post-card-b.png | 1200x1100 | second look: oat bouclé card (slightly deeper tone, chunkier texture) |
| post-card-c.png | 1200x1100 | third look: pale honed travertine card with soft pits |
| photo-frame.png | 1200x900 | post photo inset: very thin linen rim with soft rounded corners and a tiny inner shadow, transparent window. 9-slice corners ~60px |

### A4. Profile (crop profile) + someone else's profile (crop other-profile)
Uses shelf-scene, avatar-dish, place-card, camera-badge (above), plus:
| file | size | from |
|---|---|---|
| edit-btn.png | 900x160 | edit profile: linen pill with stitched seam (Pumpkin: oat pill with a thin pencil space on the left — no text) |
| follow-btn.png | 520x140 | follow: FILLED accent ceramic-matte pill |
| action-btn.png | 520x140 | message / close friend / invite to group: plain linen pill |
| btn-round.png | 180x180 | round linen button for "⋯" |
| menu-panel.png | 600x500 | ⋯ menu (mute / block / report): solid cream linen card with stitched seam and soft shadow (must be opaque so text stays readable). 9-slice corners ~70px |

### A5. Lists, Skins, Chat, Comments, Create post, Story
| file | size | from |
|---|---|---|
| list-row.png | 1200x230 | groups/messages/network/search/notification rows: linen squircle row, stitched seam. 9-slice corners ~70px |
| join-btn.png | 360x130 | join / follow / following: filled accent pill |
| ghost-btn.png | 360x130 | "following" (already following): plain linen pill |
| chip.png / chip-active.png | 400x120 | filters (all, aesthetic… / my groups…): linen pill / filled accent pill |
| seg-tab.png / seg-tab-active.png | 520x130 | connections / people-groups-posts / feed-chat-group shop / posts-media: same family, wider |
| unread-dot.png | 100x100 | accent round badge (count added by app) |
| plus-btn.png | 180x180 | groups "+": round filled accent ceramic button with a thin white + |
| field.png | 1100x160 | search / comment / message fields: linen pill, stitched seam, 9-slice ends ~80px |
| skin-card.png | 640x760 | skins shop card: linen squircle card with a big rounded transparent art window on top and a calm strip below for the name + price |
| skin-card-mask.png | 640x760 | white = the art window |
| price-pill.png / equipped-tag.png | 340x110 | "300" cream ceramic pill / "equipped ✓" filled accent pill (no text) |
| bubble-in.png | 900x280 | chat received: soft oat linen pebble bubble, 9-slice corners ~80px |
| bubble-out.png | 900x280 | chat sent: soft accent (Rosé blush / Pumpkin caramel) linen pebble bubble |
| input-bar.png | 1290x200 | chat bottom: cream linen band with a soft top shadow |
| send-btn.png | 180x180 | round filled accent button with a thin white paper plane |
| round-btn.png | 180x180 | round linen button (+, emoji) |
| comment-bubble.png | 1000x280 | comments: linen squircle comment card |
| text-area.png | 1100x420 | create post text box: linen card |
| tool-tile.png | 300x260 | create post tools: small linen squircle tile |
| add-tile.png | 360x360 | create post "+ add photo" tile: dashed-stitch linen square |
| post-btn.png | 1200x160 | post: big filled accent pill |
| public-pill.png | 360x110 | "public ▾": small linen pill |
| story-field.png | 1100x150 | story reply: translucent cream pill with a thin white outline |
| heart-orb.png | 180x180 | story like: translucent cream orb with a thin white heart |
| group-avatar-frame.png | 420x420 | group page picture: rounded-square ribbed ceramic frame, transparent window |
| store-card.png | 1024x1024 | the skin's shop card picture: a calm shelfie / flat-lay moment for this rendition (Rosé: iced latte, peonies, bouclé; Pumpkin: ribbed mug, plaid, mini pumpkin, candle). No text. |

---------------------------------------------------------------------------------------------------------------------
## PART B — the Barista Bar, the equip transition and the season swap (both renditions)
Save into `images/skins/basic/kit/fx/` (shared pieces) and `images/skins/basic/kit/rose/` + `kit/pumpkin/` (pieces
marked "per rendition", same names in both). Contact sheet `kit/fx/_sheet.png`.

### B1. Barista Bar menu (crop barista-menu) — per rendition
| file | size | from |
|---|---|---|
| barista-card.png | 900x1100 | the café MENU CARD that slides down from the top bar: Rosé = thick cream letterpress card with a blush edge and a pointer notch at the top right (pointing at the cup button); Pumpkin = rich caramel/brown leather-look card with a thin gold edge and the notch. Opaque, soft shadow, calm centre. 9-slice-safe (corners ~90px, notch inside the top-right corner zone) |
| barista-emblem.png | 300x200 | the small cup-with-steam emblem above "barista bar", with two thin rule lines either side (Rosé rose-gold line art; Pumpkin gold line art) |
| menu-dots.png | 600x30 | the dotted leader line between an item and its icon (tileable horizontally) |
| menu-profile, menu-saved, menu-skins, menu-settings, menu-season, menu-latte, menu-lastcall.png | 160x160 | the right-hand menu icons in the card's line colour: person, bookmark, layers, gear, season (Rosé card: a pumpkin = "switch to pumpkin spice"; Pumpkin card: a flower = "switch to rosé"), latte cup, takeaway cup |

### B2. Latte Break screensaver (crop latte-break) — per rendition
| file | size | from |
|---|---|---|
| latte-bg.png | 1290x2796 opaque | the whole scene WITHOUT latte art: top-down-ish view of a ribbed cream cup on a round travertine coaster, linen napkin, soft window shadow (Rosé blush peony at the corner; Pumpkin knit throw). The coffee surface shows plain caramel crema only. Cup centre at x=645, y=1160, crema radius ~330px. Lower third calm (the app writes "latte break" / "tap to sip" there) |
| art-heart.png / art-rosetta.png / art-tulip.png | 800x800 | ONLY the white milk-foam latte-art pattern (heart / rosetta / tulip), transparent everywhere else, centred, sized to fit inside a 660px circle; soft realistic foam edges |
| pitcher.png | 700x900 | a cream ceramic milk pitcher tilted to pour from the top right, spout at the bottom-left corner of the canvas (around x=40, y=860) |
| milk-stream.png | 60x600 | the thin falling milk stream (vertical, tileable), soft white |
| steam.png | 500x700 | a soft wisp of rising steam, white, transparent |
| mini-cup.png | 260x260 | small top-down cup with plain crema (the three mini cups along the bottom of the screen; the app puts the art on top) |

### B3. Last Call (crop last-call) — per rendition
| file | size | from |
|---|---|---|
| lastcall-bg.png | 1290x2796 opaque | café counter at closing time: travertine counter in the lower third, a blurred café behind (warm bokeh, shelves), a vase of flowers at the left (Rosé ranunculus; Pumpkin dried flowers + candle). Empty space centre-right on the counter for the cup (cup base around x=760, y=2050) |
| takeaway-cup.png | 640x860 | a matte cream takeaway cup with lid (Pumpkin: with a kraft sleeve), front-facing, plain blank face for the name |
| marker.png | 520x120 | a black marker pen lying diagonally, cap off, tip at the left end |
| awning.png | 1290x760 | the café AWNING that lowers from the top: striped linen (Rosé blush + cream stripes; Pumpkin caramel + cream stripes) with a scalloped bottom edge, seen straight on, soft folds |
| closed-sign.png | 1100x520 | the blank linen banner hanging under the awning with a scalloped bottom edge (app writes "closed — see you tomorrow") |

### B4. Equip transition — "flat-lay snap" (shared, kit/fx/)
The equip animation: props slide in from the edges onto a travertine surface and arrange into a flat-lay, a phone
camera viewfinder appears, *snap* (white flash), and the photo becomes the new skin.
| file | size | from |
|---|---|---|
| fx-surface.png | 1290x2796 opaque | top-down honed travertine + a draped oat linen cloth, soft window shadow |
| fx-iced-latte.png | 500x700 | top-down iced latte in a clear glass with a straw |
| fx-mug.png | 500x500 | top-down ribbed ceramic latte with heart art |
| fx-claw-clip.png | 420x300 | blush tortoiseshell claw clip, top-down |
| fx-hoops.png | 360x260 | a pair of thin gold hoop earrings, top-down |
| fx-candle.png | 380x380 | top-down ribbed glass candle, lit |
| fx-sunglasses.png | 600x260 | cream tortoiseshell sunglasses, top-down |
| fx-peony.png | 460x460 | a single blush peony, top-down |
| fx-pumpkin.png | 420x400 | a mini white pumpkin, top-down |
| fx-book.png | 520x680 | a closed cream linen-bound book, top-down |
| fx-viewfinder.png | 1290x2796 | phone camera viewfinder overlay: thin white corner brackets, a small focus square in the centre, a faint grid — transparent elsewhere |

### B5. Season swap (Rosé ↔ Pumpkin Spice) (shared, kit/fx/)
A gust sweeps across the screen: to Pumpkin = autumn leaves, to Rosé = blush petals, dense enough to cover the screen
for a moment; in the centre the iced latte glass turns into the steaming mug (or back).
| file | size | from |
|---|---|---|
| fx-leaf-1 … fx-leaf-4.png | 300x300 | single falling leaves (maple, oak, birch, a curled one) in caramel / rust / ochre, realistic, transparent |
| fx-petal-1 … fx-petal-4.png | 240x240 | single blush peony / rose petals, soft, realistic, transparent |
| fx-glass.png | 600x800 | front view iced latte glass (ice, straw) — big, for the centre |
| fx-hot-mug.png | 700x700 | front view ribbed ceramic mug with foam and steam — big, for the centre |
