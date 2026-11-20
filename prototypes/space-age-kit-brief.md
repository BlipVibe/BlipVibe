# Space-Age Pop (Blip Vibe `space-age`) — production art kit

A Blip Vibe = a look of the default BlipVibe skin (`blip`), picked from the Blip menu. Its art replaces Logo Classic's
part by part (same file names), so the app's CSS only places it. Build every piece FROM THE CONCEPTS and match them
almost 1:1 — shape, proportion, colour, outline weight, softness.

Concepts (style truth, local only): `images/skins/default/space-age/*.png` (home, group, desktop + every page).
Logo Classic's kit (shape reference for each part, local only): `images/skins/blip/kit-lc/` and `_sheet-*.png` there.

## Look (copy the concept)
Mid-century atomic-age / 1960s "space-pop" on warm cream. Palette:
cream page `#FBEBD3`, card cream `#FFF4E2` (inner bevel `#FCE6C8`), ORANGE `#EE7A1E` (outlines, active, headings; deep
`#C85A0E`), TEAL `#1E8C86` (secondary outlines, bars, pills; deep `#13625E`), gold `#F6B21A` (coins), ink `#2A2233`
(dark navy-brown: text + line icons), rivet brass `#C9A46A`, red `#D7352B` (danger, badges).
- Cards: chunky retro-console cards — cream fill, a THICK orange outline (~10px at 768) with a thin cream inner bevel
  line and a soft warm drop shadow; corners round (~60px at 768). Plain calm centres.
- Teal card: the same card with a teal outline (Photos card, Group Posts frame, secondary panels).
- Heading tab: a solid orange pill with a faint top highlight (white italic bold heading text is added by the app).
- Buttons: glossy orange pill (primary), glossy teal pill (teal), cream pill with orange outline (secondary).
- Round buttons: cream domed circles with a warm tan rim and soft shadow (top-bar icon buttons, nav tabs).
- Atomic starbursts: thin-line asterisk stars with dot tips, orange or teal.
- Line icons: chunky rounded line icons, ink `#2A2233`, ~10% stroke, some with a teal or orange fill accent.
- NOT glassy, NOT neon, no purple, no blue screens, no comic halftone, no beige café wood (keeps it apart from other skins).

## Rules
- NO text, letters or numbers in any piece. NO photos or people.
- REAL transparent alpha outside every shape. NEVER paint a grey/white checkerboard.
- Frames have fully transparent windows. 9-slice pieces: corners hold the shape, long edges plain and uniform.
- Draw each piece WHOLE at the stated size, centred, nothing cut off. Icons razor sharp.
- Mascot: the ORIGINAL BlipVibe logo character (`images/skins/blip/kit-lc/mascot.png`): glossy blue speech-bubble head,
  white headphones, navy outline, face, bubble tail, yellow sparkles. OWNER RULE: NO ARMS, NO HANDS, NO BODY, NO LEGS,
  no astronaut suit. Space-age props allowed: a clear glass helmet dome over the head, sitting in a little retro rocket
  cockpit (only the head shows), a planet orbit ring around it.

Save PNGs into `images/skins/blip/kit/space-age/` with exactly these names. Convert: `prototypes/tools/space_age_convert.py`.

## PART A — chrome
| file | size | piece |
|---|---|---|
| background.png | 1290x2796 opaque | cream page #FBEBD3, very faint scattered small atomic starbursts, soft orange + teal boomerang blobs low in the corners, calm middle |
| header-bar.png | 1256x260 | top bar: plain cream band #FBEBD3 with a very soft warm shadow along its bottom edge |
| nav-bar.png | 1290x300 | bottom nav console: a cream bar whose top edge is a gentle upward curve with an orange rim line, a teal band along the bottom, teal starburst "wing" fins at BOTH ends (concept nav). Plain (buttons added by the app) |
| nav-btn.png | 220x220 | inactive nav tab: cream domed round button, warm tan rim, soft shadow |
| nav-active.png | 220x220 | active nav tab: glowing orange domed round button with a gold rim and soft orange glow |
| panel-card.png | 768x768 | THE card (see Look) |
| panel-card-active.png | 768x768 | same card with a pale peach fill #FFE6CC (unread / highlighted) |
| panel-teal.png | 768x768 | same card with a TEAL outline |
| card-tail.png | 768x840 | the profile card: the card drawn as a retro TV console, two short rounded orange feet under its bottom edge (left and right, bottom 72px) |
| heading-tab.png | 600x150 | orange heading pill |
| chip.png | 600x160 | cream pill, teal outline |
| chip-active.png | 600x160 | solid orange pill |
| btn-primary.png | 600x160 | glossy orange pill, faint top highlight, soft shadow |
| btn-teal.png | 600x160 | glossy teal pill |
| btn-secondary.png | 600x160 | cream pill, orange outline |
| btn-danger.png | 600x160 | cream pill, red #D7352B outline |
| btn-disabled.png | 600x160 | soft grey #D9D3CB pill, no outline |
| btn-round.png | 200x200 | cream domed circle, warm tan rim, soft shadow |
| btn-square.png | 200x200 | gold-cream domed circle with a thin ink outline (pencil button) |
| field.png | 900x140 | cream pill with a teal outline |
| tabs-track.png | 1200x140 | cream pill with a thin tan outline |
| bar-track.png | 900x60 | pale tan #EAD9C0 rounded bar |
| bar-fill.png | 900x60 | teal rounded bar, faint highlight |
| coin.png | 200x200 | gold coin with a star embossed, amber rim, shine |
| coin-stack.png | 300x260 | three stacked gold coins |
| coin-pill.png | 460x140 | gold-cream pill with a warm tan rim |
| reward-chip.png | 260x140 | gold #FFD45A rounded chip |
| badge-count.png | 120x120 | red circle with a thin cream ring |
| divider.png | 900x12 | thin teal line |
| unread-dot.png | 60x60 | orange dot |
| orbit-teal.png | 420x170 | a thin teal tilted elliptical orbit ring with a small dot riding it (Following stat) |
| orbit-orange.png | 420x170 | same, orange (Followers stat) |

## PART B — icons (256x256, transparent, one family: chunky rounded ink line icons with teal/orange accents)
Nav: icon-home (house, orange roof accent), icon-groups (two people, teal), icon-skins (t-shirt, teal), icon-network
(ringed planet), icon-messages (envelope). `-on` versions for the orange active button: same icons with cream fill:
icon-home-on, icon-groups-on, icon-skins-on, icon-network-on, icon-messages-on. icon-hanger (coat hanger).
Top bar: icon-search, icon-bell, icon-music. Actions: icon-like (thumbs-up outline), icon-like-on (thumbs-up FILLED
teal), icon-dislike, icon-dislike-on (FILLED teal), icon-emoji, icon-comment, icon-share, icon-more, icon-camera,
icon-edit, icon-plus, icon-back, icon-send, icon-close, icon-check, icon-chevron, icon-photo, icon-settings, icon-user,
icon-user-plus, icon-bookmark, icon-compose, icon-video, icon-phone, icon-heart, icon-star, icon-gift, icon-flag,
icon-flag-red, icon-globe, icon-calendar, icon-bag, icon-logout, icon-scroll, icon-link, icon-exit (red), icon-people,
icon-info, icon-mute, icon-block, icon-gif, icon-mic, icon-poll, icon-font, icon-seen, icon-reply, icon-image,
icon-fire, icon-envelope, icon-crown, icon-compass, icon-clock, icon-coin (the coin at 256).
Quest icons 200x200 (two-tone, concept quest rows): quest-react (teal speech bubble with dots), quest-message (orange
envelope), quest-like (red heart), quest-comment, quest-post, quest-save, quest-view, quest-share.
Notification icons 200x200 (cream line icon in a teal disc): notif-like, notif-follow, notif-comment, notif-message,
notif-group, notif-purchase.

## PART C — mascot + Blip button + menu
| mascot.png | 800x800 | the original mascot in a clear glass helmet dome |
| mascot-head.png | 256x256 | original mascot head, tight crop (wordmark mark) |
| mascot-head-plain.png | 400x400 | original mascot, no helmet |
| mascot-wave.png | 900x900 | mascot in helmet dome tilted in greeting, small orange starburst + sparkles. NO arms |
| mascot-peek.png | 900x900 | mascot peeking out of a retro cream/orange rocket's round cockpit window (only the head), flame tail |
| mascot-jump.png | 900x900 | mascot in helmet dome mid-bounce, happy ^ ^ eyes, a planet orbit ring around it |
| mascot-sleep.png | 800x800 | mascot asleep (closed eyes, zzz), drifting on a small crescent moon |
| mascot-page-smile.png / mascot-page-wink.png / mascot-page-happy.png | 900x560 | page-header mascots: smile in helmet beside a ringed planet / wink in rocket / happy with stars |
| sparkle-1.png | 200x200 | orange atomic starburst |
| sparkle-2.png | 200x200 | teal atomic starburst |
| burst.png | 300x300 | three short yellow burst lines |
| planet.png | 300x200 | teal ringed planet with an orange ring |
| blip-btn.png | 220x220 | the Blip start button: teal domed round button, gold rim (mascot head added by the app) |
| blip-btn-on.png | 220x220 | pressed: deeper teal, inset |
| menu-panel.png | 900x1300 | Blip menu: cream rounded panel, thick orange outline, a teal vertical strip down its left ~170px |
| menu-row-on.png | 700x130 | equipped row: pale peach rounded bar |
| menu-check.png | 120x120 | orange disc with a cream check |
| swatch-ring.png | 160x160 | brass porthole ring, transparent window |
| sheet.png | 300x300 | cream rounded sheet with orange top rim (9-slice) |
| bubble-in.png | 600x300 | incoming chat bubble: cream, teal outline, tail bottom-left |
| bubble-out.png | 600x300 | outgoing chat bubble: orange, tail bottom-right |

## PART D — profile + frames
| avatar-frame.png | 640x640 | porthole: brass ring with rivets, cream outer bevel, transparent round window |
| avatar-ring.png | 300x300 | small avatar ring: cream ring, tan outline, transparent window |
| story-ring.png | 400x400 | unseen story: orange→magenta ring, cream gap, transparent window |
| story-ring-seen.png | 400x400 | seen story: thin tan ring |
| story-add.png | 160x160 | teal round "+" badge with cream ring |
| camera-badge.png | 160x160 | teal disc with a cream camera line icon |
| group-avatar-frame.png | 640x640 | porthole, same as avatar-frame |

## PART E — badges (200x250): retro enamel medal pins, cream/orange/teal, one symbol each
badge-early_adopter (rocket), badge-first_post (pen), badge-social_butterfly (butterfly), badge-popular (star),
badge-commenter (bubble), badge-group_leader (crown), badge-skin_collector (t-shirt), badge-streak_master (flame),
badge-photographer (camera), badge-generous (gift).

## PART F — store / menu card
card.png 256x256 full-bleed painted scene: the cream space-pop room with the mascot (in helmet) beside a ringed planet,
orange + teal starbursts → `images/skins/blip/space-age/card.webp`.
