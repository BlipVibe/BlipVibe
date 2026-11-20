# Full-skin QA log

One place for every QA finding on the live full skins. Other sessions and the owner send findings to the QA session,
which fixes them, re-checks them in the simulator and records them here.

## How a screen passes

Each screen × skin × rendition is compared with its approved concept crop (`prototypes/reference/<skin>[-<rendition>]/`,
kept on this machine only), `images/skins/README.md` and the skin's `NOTES.md`. A screen passes only if all of these hold:

| # | Criterion | What fails it |
|---|---|---|
| P | **Pictures in frames** | profile photo, cover/banner, timeline photos, avatar rings/wreaths, story rings, post photos and store-card art each sit exactly in their frame or window: no offset, no spill, no gaps, nothing squished or stretched |
| T | **Text in boxes** | text overflows, clips, wraps out of its button/pill/tab/title bar/bubble art, overlaps an icon, or isn't centred where the concept centres it |
| D | **Decoration where the concept puts it** | a badge, icon, sticker or ornament is missing or misplaced compared with the concept |
| B | **Bars clear** | anything overlaps the top banner or the bottom bar (scrolling content passing under the bars is fine) |
| A | **Art, not CSS** | a CSS-drawn frame, gradient or ring stands in for art; fake checkerboard painted into art; old premium overlays (spinning ring, `.premium-border`) |
| R | **Readable** | text is hard to read over its background (menus included); text fields under 16px |
| L | **Long names** | a long display name (test: "Alexandria Montgomery") on Home's profile card, my Profile or someone else's profile breaks mid-word, becomes unreadable, collides with or hides behind decorations (flourishes, laurels, frames, candelabras), or pushes the layout under the cover art |
| U | **Unreadable text** | any text too close in colour to what's behind it — button labels (Free / Buy / Join / Follow / tabs, active and inactive), pop-up titles, names and placeholders, field placeholders and typed text, card headings, app-coloured icons left unthemed. Pass ≈ WCAG 4.5:1 body, 3:1 large titles. Also grep for CSS variables used but never defined (they fall back silently) |
| V | **Profile view = Home** (owner, Nov 17) | someone's profile shows its pictures differently from the Home profile of the same skin (cover / timeline frames, art, layout, and the profile photo's themed frame — taken from the concept art), or the profile photo doesn't fill its frame on either |
| M | **Menus/motion** | the account menu has every item on screen with Log out reachable; liked/disliked visibly fill; the skin's own swap/equip animations play and nothing just pops in |

**Every pass also checks:** the owner's phone (and the QA install) runs the current OTA version, not the App Store builtin bundle. Any new `skin_data` key the July App Store copy doesn't know is added to the `preserve_new_skin_keys` list (supabase/app-store-copy-compat.sql).

**Before any pass:** the QA install injects `window.__BV_QA_READONLY=true;` next to `window.FS_BASE` in `<head>`, uses `js/supabase.js` from main, and the console shows `[QA read-only] ON`. No pass runs without it.

Automated checks run on every capture too (`qaCheck` / `qaPlace` in the QA harness): horizontal scroll, fields < 16px,
premium overlays, squished `<img>`, text clipped in or spilling out of its box, and (since pass 4) `qaOverflow`: every
element on the page, on- or off-screen, is checked for a child sticking out sideways past its parent's content box or text
clipped by a hidden overflow — screenshots alone missed rows that ran a few px past their frames.

Cell values: **pass**, **fixed** (commit), **open** (what's wrong).

## Screens

home-top (top bar, profile card, timeline) · home-stories (stories, composer) · home-quests (featured skin, quests, coin
goal) · home-feed (feed posts) · liked (liked/disliked buttons) · groups · group page · messages · chat (keyboard open) ·
network · notifications · search · shop (cards, Owned tag, Coming soon, Equip/Take off) · other-profile (buttons) ·
other ⋯ menu · my profile · comments · create post · story viewer · account menu · settings · modals ·
rendition toggle + swap animation · equip transition

## Results

Columns: SB Scrapbook · AB Anime Blaze (Red, Blue, Purple, Green, pinK) · WC Witchcraft · GW Good Witch (Day, Night) ·
VW Vaporwave (Retro, Modern, Retro Dark, Modern Dark) · HL Heaven's Light (Day, Twilight).

Pass 1 (Nov 16): every screen captured in all 15 renditions on a dedicated simulator ("BlipVibe Skin QA"), compared with
the concept crops. Fixes were re-checked in the rendition where the defect showed plus one other; CSS-only fixes that
apply to every rendition (selects, ⋯ menu colours) were spot-checked, not re-captured in all 15.
Commits: 7d78031, 88f1231, 94e8360.

| Screen | SB | AB-R | AB-B | AB-P | AB-G | AB-K | WC | GW-D | GW-N | VW-R | VW-M | VW-RD | VW-MD | HL-D | HL-T | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home: top bar, profile card, timeline | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | profile card/cover/photo shown everywhere; photos in frames |
| Home: stories, composer | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |  |
| Home: featured skin, quests, coin goal | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | coin goal hidden by design with ∞ coins |
| Home: feed posts | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |  |
| Liked / disliked | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | every skin fills or swaps the icon |
| Groups list | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |  |
| Group page | open | open | open | open | open | open | fixed · open | open | open | fixed · open | fixed · open | fixed · open | fixed · open | fixed · open | fixed · open | fixed: Witchcraft stats/buttons, HL stats, Vaporwave title. **Open (every skin):** concept is a compact header (banner, picture, name, members, Join, ⋯) + Feed/Chat/Group Shop tabs; ours is the big profile-style card with stacked buttons — needs a group-page rework per skin |
| Messages | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |  |
| Chat (keyboard open) | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | fixed | fixed | HL bottom bar covered the message box; HL + button art |
| Network | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |  |
| Notifications | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |  |
| Search | fixed | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | Scrapbook field was a thin strip + stray blank label |
| Skins store (cards, Owned, Equip/Take off) | pass | pass | pass | pass | pass | pass | fixed | pass | pass | pass | pass | pass | pass | pass | pass | Witchcraft Owned tag hidden by the arch; Try On/Buy overflow |
| Someone else's profile (buttons) | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | Mute/Block/Report → ⋯ menu (concept); Anime Blaze Follow label; checkerboard behind bars when the viewed person uses Heaven's Light |
| Someone else's profile (⋯ menu) | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | new; readable in every rendition; Vaporwave puts it in the button row |
| My profile (pop-up) | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | fixed | "Active Skin" showed Default; photo missing in VW/HL, shards in AB |
| Comments | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | fixed | pass | fixed | pass | pass | Vaporwave Modern pop-ups were see-through |
| Create post | pass | pass | pass | pass | pass | pass | fixed | pass | pass | pass | fixed | pass | fixed | pass | pass | Witchcraft tool icons were empty boxes |
| Story viewer | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | matches the concepts (full-bleed media, header, reply field) |
| Account menu | pass | pass | pass | pass | pass | pass | fixed | pass | pass | pass | pass | pass | pass | pass | pass | all items on screen, Log out reachable (pinned by placeUserMenu); Witchcraft menu art had painted divider bars |
| Settings + pop-ups | pass | fixed | fixed | fixed | fixed | fixed | fixed | pass | fixed | pass | pass | fixed | fixed | pass | fixed | selects were white-on-white on dark renditions; Witchcraft pop-up panel scattered dots |
| Bottom bar / Start bar | pass | pass | pass | pass | pass | pass | pass | pass | pass | fixed | fixed | fixed | fixed | pass | pass | Vaporwave Start bar vanished on every page after leaving a chat any way but Back |
| Rendition toggle + swap | n/a | pass | pass | pass | pass | pass | n/a | pass | pass | pass | pass | pass | pass | pass | pass | AB lightning, GW day→night sweep, VW "Updating BlipVibe" pixel swap, HL sun→moon (one white flash frame at the start — by design?) |
| Equip transition | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | Scrapbook paper collage, AB comic burst, WC moon ring + smoke, GW owl + constellations, VW BIOS boot, HL temple gates |

## Pass 7 (Nov 19, owner: retro group card "3 lines through it", then Home profile card, "don't forget the XP version")
Cause: Vaporwave panel art (panel.webp, every variant) fades light→dark top to bottom. The generic `.profile-card` /
`.profile-card-item` rule draws it with `border-image … round`, so a card taller than the art repeated the fade 2–3 times and
each restart was a hard line (owner's screenshot: fade resets at y 816 and 996). Hit: Home #profileCard, #pvProfileCard
(someone's / own profile, settings), the old group card. Fix: every Vaporwave element stretches its border art once
(`border-image-repeat: stretch`) — Vaporwave is plain Windows panels, nothing in it needs tiling.
Checked: retro, modern (XP), retro-dark, modern-dark × 23 screens with a probe for any tiled border art or tiled skin
backgrounds → none left (store featured banner = one picture + colour layer, no seam); pixel scan down each profile card →
no steps; screenshots sent. The new group page (group-concepts build, 930db60) already stretches its art.

## Pass 6 (Nov 18, owner: "I'm still finding stuff … I feel like you're not looking at everything")

What pass 5 missed and why: it checked fixed screens with automatic measurements, and treated sideways-scrolling tab rows
as fine ("they scroll"). It never opened the People You May Know / Trending pop-ups, never scrolled down a group page,
never looked at the store's lower rows, and never opened the profile ⋯ menu after a look change. Pass 6 adds those
screens (pills, pymk, trending, network-discover, group-mid, group-low, shop-mid, shop-low, the My Profile pop-up,
someone's profile top/middle/bottom and its ⋯ menu) and every capture was looked at by eye, not only measured.

| Found | Skins | Fix |
|---|---|---|
| Profile ⋯ menu (Mute/Block/Report): tapping showed nothing — the ⋯ was built for the skin active when the profile first drew (Vaporwave puts it in the button row, the rest at the cover's corner); after a look change (someone else's skin on their profile, a skin switch) that skin's CSS hid it | every skin except the one it was built for | fullskins.js rebuilds the ⋯ wherever the current skin wants it |
| Profile ⋯ menu hung 84 px off the left edge ("rt" of Report showing) | Vaporwave (all 4) | drops down from the button's left edge |
| Tab / chip rows cut off at the right edge: Network "People Y…", store "Premium Skins / Font Styles", filter chips "Natur…" | most skins | rows wrap onto a second line, centred, nothing cut |
| Group page: odd panels — tall window with coins on its own row, three stacked buttons of different widths, composer and posts inset deeper than the panels above | Vaporwave (all 4) | one header window, stats in one row, actions in one row, Rules / Invite side by side, one Feed / Chat / Group Shop bar, every panel on the same 8 px gutter |
| Group page Feed / Chat / Group Shop showed as bare words, no tab art | Good Witch, Heaven's Light, Blood Moon | the skin's own tab art |
| Group posts showed "undefined" under the poster's name (the time) | all skins and the default look | real post time (app.js used the demo-index timer on a date) |
| #Basic store card: a vignette cut-out on black / blob edges instead of a full picture | #Basic (seen in every skin's store) | new full-bleed Rosé + Pumpkin store art (Codex), same scene |
| Someone's "● Online" sat on the bottom edge of the profile-card frame | Superhero Villains | in the name column under the bio |
| Someone's longer name cut with "…" on their profile ("VIDEOGAMES B…", "JENNIFER HUB…") | Superhero (both) | name steps down in size and wraps between words, never cut |
| Home pill "People You May Know": the "w" ran into the pill's right bevel | Vaporwave retro + retro-dark | same fit as modern |
| Network → People You May Know: the mutuals badge took the button's column, Follow dropped to a 46 px box ("F…") | Vaporwave (all 4) | mutuals under the name, Follow on the right |
| People You May Know "+" clipped to a sliver (16 px painted sides in a 36 px button) | #Basic (both) | pill wide enough for its icon |
| Group page "Leave Group" cut to "Leave Grou" | Vaporwave (all 4) | buttons size to their words |
| Group page Feed / Chat / Group Shop bare words | #Basic (both) | the skin's chip art |
| Group post text near-invisible — a group with a dark group theme forced #e2e8f0 on post paragraphs | every skin with light cards | post paragraphs follow the post's ink |
| Group composer "Post in …" dark ink on dark field; "You" badge dark on dark | Blood Moon (both) | light title ink |
| Store "Coming soon" left-aligned over the plate's frame ("ming soon") | Blood Moon (both) | centred in the plate |
| Store chips: words stuck to the left edge of the stretched chip | Superhero (both) | centred |
| Profiles checked with four different people (with and without timeline photos / cover) × every skin: every photo inside its frame | all | — |

## Pass 5 (Nov 18, owner: "do the full things … all the pictures where they're supposed to be, no out of bounds")

Every page × 21 renditions, 23 screens (pass 4's 18 plus Home stories, Home quests, the store top, the **story viewer**
and the **account menu**), three full sweeps. New automatic checks: `qaFrames` (photo spills past / gaps inside its
frame, broken images) and `qaBtnFit` (a button / tab / pill's words inside its *painted* frame, not just its outer box).
The story viewer is opened on a display-only test story (QA build only). Profile screens now run last: viewing someone
else's profile can leave the look-only QA switch on their look, which hid the store / groups screens in sweep 1.

| Found | Skins | Fix |
|---|---|---|
| Story viewer: the reply field and send button pushed off the right edge by the six reactions | all without their own story layout | reactions on their own centred row above the field |
| Story viewer: the caption sat under the reply bar | all | caption rides above the bar (above Views/delete on your own story) |
| Story viewer: poster's name cut to "STORY" and the ✕ under the clock / camera cutout | Superhero | header starts below the safe area |
| Account menu text unreadable (pale pink / lilac on parchment, silver, light windows) — a real equip adds the legacy `premium-<id>` theme whose `--ps-text` painted the links | Blood Moon (both), Vaporwave retro + modern | dark ink on the light panels, Logout red; same for the post ⋯ menu |
| "DAILY QUESTS" ran under the drone (S hidden) | Superhero Villains | title centred left of the drone, sized to fit |
| Store: the Equipped tag was hidden under the button plate and had no word on it | Superhero (both) | tag with "EQUIPPED" under Take off |
| Group page: "Group Coins" broke over the plaque's frame | Witchcraft | one line, coins plaque a little wider |
| Network: "Bboy_Kooaid" broke mid-name | Superhero (both) | names size down so one word stays whole |
| Comment box: "Write a comment…" cut by the frame | Blood Moon (both) | thinner frame sides, smaller placeholder (typed text stays 16 px) |
| Profile ⋯ menu dropped down behind the taskbar | Vaporwave (all 4) | opens upward |
| "ADD CLOSE FRIEND" cut to "FRIENI" | Superhero Villains | profile buttons sized to their plaques |
| Home pill "People You May Know" cut to "…Knov" | Vaporwave modern + modern-dark | pill text sized to its frame |
| Settings "Done" squeezed into a 36 px square ("Donı"), pushed left (it also carries the ✕ button's class) | Vaporwave (all 4); size reset on every skin | text button sizes to its word, centred |

Checked and left as designed: Witchcraft view count touches its button padding (0 px past); the Witchcraft search field
fills the header under the side ornaments; the reaction row's "?" boxes run wide only because the simulator has no emoji
font (owner confirmed emoji show on phones).

## Pass 4 (Nov 17, owner: "stuff is still out of bounds … like, dislike stuff on the posts. Did you really do QA?")

Screenshots alone missed overflows of a few px, so pass 4 added the automatic `qaOverflow` check (every element, whole
page) and ran it over 18 screens × all 21 renditions, twice (before and after the fixes), plus screenshots.

| Found | Skins | Fix |
|---|---|---|
| Post like/dislike row ran out of the post (views "52" past the frame; up to 41 px) | Witchcraft, Good Witch, Heaven's Light, Blood Moon, Superhero, #Basic (Vaporwave once posts were narrowed) | the row's inner button group took 10 px gaps from the phone layout; it now fills the row and spreads its buttons evenly, all skins; liked-by avatars only take room when there are some |
| Constellation charm on every 5th post sat on top of the like button | Good Witch | moved to the post's top-right corner (top-left covered the poster's photo) |
| Notifications: 8 tabs ran off the screen, "All" pill overlapped "Mentions" | Blood Moon | bar scrolls sideways inside its frame |
| Network: "Not Following Back" broke into 3 lines and spilled out of the tab frame | Blood Moon | 14 px, two lines |
| Group page: "Group Coins" ran out of the stats box (owner screenshot) | Scrapbook | box widened, stats share it evenly, labels wrap between words only |
| Framed cards (sidebar cards, group "Post in…" bar, profile skin/photo cards) 4 px off both screen edges | all (owner's account uses the "Cinema" layout template, which pulls cards 12 px wide) | full skins drop the template's card pull |
| Posts 8 px past the right edge, frame cut off | Vaporwave (Scrapbook 4 px = its intended tilt) | base `#feedContainer .card {width:100%}` overrode the skin's side margins → width auto |

Confirmation sweep caught one regression: the all-skins row rule squashed Scrapbook's buttons to 4 px on posts with
liked-by avatars (Scrapbook puts those on their own line) → Scrapbook keeps its own row layout. Re-checked clean.

Checked and left as designed: Good Witch's quest book and Vaporwave's quest header art bleed a few px past the panel;
Superhero's liked thumb pops to 34 px; Scrapbook posts tilt; Blood Moon's active tab pill overlaps the bar's end caps.

## Pass 3 (Nov 17, owner: "qa all of the skins each page"): every page × 21 renditions, own profile page added

Kept QA simulator "BlipVibe Skin QA" (owner: keep it signed in for QA), `[QA read-only] ON`. New screen in the sweep:
own-profile (my profile page) compared with Home and someone else's profile for rule V.

| Fix | Commit | Skins |
|---|---|---|
| Group names + network names wrap by whole words (were "…") | this commit | all |
| Own profile page: Edit Profile was a 77px box on the left of the 4-column grid → wide plaque centred (concept profile) | this commit | Witchcraft |
| ⋯ on someone's profile: re-placed after the page lays out (#Basic's was under the top bar again); moves under the bar only when the bar actually covers it | this commit | all cover-mode skins |

Rule V check (Home ↔ own profile page ↔ someone's profile): pictures (cover / timeline frames, layout) and the profile
photo's themed frame match in all 21 renditions. Known deviation: Superhero's concept puts ⋯ inside the title bar, but the
top bar stacks above the page, so ⋯ sits at the cover's top right just under it (visible, works).

## Pass 2 (Nov 17): every rendition incl. Blood Moon, Superhero, #Basic

Own simulator "BlipVibe Skin QA", `[QA read-only] ON`, OTA bundle on the sim = main (not builtin). 21 renditions × 18 screens
+ an avatar-fit sweep (Home top bar, Home profile, profile view) + Home-vs-profile-view comparison.

| Fix | Commit | Skins |
|---|---|---|
| Top-bar photo centred in the winged wreath's gold ring (owner 26) | 063fa13 | HL Day + Twilight |
| Profile view shows the Home grid (big panel + two stacked) instead of a row of three (owner 27) | 063fa13 | Superhero Heroes |
| "Followed by …" stacked 2–5 times when the profile re-rendered mid-lookup (app.js `renderMutualFollowers` replaces) | 063fa13 | all |
| Bottom bar covered the chat's message box | 063fa13 | Blood Moon, Superhero |
| My Profile pop-up photo: invisible (BM has no avatar-mask art), torn arch (Witchcraft), frameless star (Good Witch) → round in the skin's own ring | 063fa13, this commit | Blood Moon, Witchcraft, Good Witch |
| Group page name ran over the group picture + cover | 063fa13 | Superhero |
| Names cut with "…" → wrap by words (network, groups) | 063fa13 | Superhero, #Basic |
| Publish clipped in Create Post; comment placeholder cut off; Villains sort tabs off the pop-up | 063fa13 | Superhero (both) |
| ⋯ on someone's profile hid under the top bar (placed from offsetTop → now from its on-screen position) | 063fa13 | #Basic (all cover-mode skins) |
| Store "Owned" → green ✓ dot in a corner (owner, Nov 16); Witchcraft above the name plaque, Anime Blaze top-left | 063fa13, this commit | all |
| Create Post placeholder under the field's gold crest | this commit | HL |
| Comment placeholder cut off | this commit | #Basic |

Checked and passing after fixes: Home, feed, my profile, other profile + ⋯ menu, store, groups, group page, messages, chat,
network, notifications, search, comments, create post, settings — all 21 renditions. Scrolling tab rows (store, notifications,
network) are horizontal scrollers by design. No story to open on the QA account (story viewer not re-checked).

## Cross-skin fixes

| Fix | Commit | Skins |
|---|---|---|
| Someone else's profile: Mute / Block / Report moved into a ⋯ menu at the cover's top right, as in every concept (`wrapPvMore` in `js/fullskins.js`) | 7d78031, 88f1231 | all |
| Old Heaven's Light premium texture (`images/skin-textures/clouds.png`, fake checkerboard painted in) switched off under full skins | 7d78031 | all |
| Chat-open rules scoped to the Messages page (Vaporwave's Start bar vanished after leaving a chat) | 7d78031 | all |
| Selects use the skin's card colour + ink | 7d78031 | all dark renditions |
| My Profile pop-up: real active skin name; photo shown where the skin has no avatar mask | 7d78031 | all |

## Simulator-only quirks (not app bugs)

- Emoji show as `[?]` boxes in the iOS 26 simulator, on any font (owner confirmed Nov 17: they show on phones).

## Open

| Item | Skins | Next step |
|---|---|---|
| Group page layout doesn't match the concept (compact header + Feed / Chat / Group Shop tabs) | all | rework per skin, keeping Edit / Leave / Rules / Invite in the ⋯ menu; needs the owner's OK on where those go |
| Heaven's Light rendition swap starts with one plain white frame | HL | confirm with the owner whether the flash is intended |

## Owner-reported findings

Every finding the owner reports (directly or through another session) gets a row here and is re-tested on every QA pass
so nothing comes back. Re-check column: date of the last pass that confirmed it.

| # | Date | Skin / rendition | Screen | What the owner saw | Fix | Re-check |
|---|---|---|---|---|---|---|
| 1 | Nov 16 | Vaporwave | store | "Coming soon" on the phone — the app update failed (54 MB bundle over the 50 MB limit) | 951906b (skin art loads from blipvibe.com) | pending: needs an OTA upload with HTTP 200 + Equip showing on the phone |
| 2 | Nov 16 | Vaporwave | Home / profile | Avatar.exe label covered the profile photo (premium ::before ring) | 7cc1616 | Nov 16 pass 1 ✓ |
| 3 | Nov 16 | all | avatars | old premium spinning avatar ring must never show on full skins | — | Nov 16 pass 1 ✓ (no ring in any capture) |
| 4 | Nov 16 | Vaporwave | Start menu | Start menu transparent (now solid); label "Update to XP" / "Roll back to 95" | — | pending |
| 5 | Nov 16 | Vaporwave Retro (+ every skin) | Home profile card | profile card tucked under / bleeding into the top banner | margin fix | Nov 16 pass 1 ✓ all 15 renditions |
| 6 | Nov 16 | Vaporwave | someone else's profile | needed rebuilding to the concept | — | Nov 16 pass 1 ✓ (⋯ menu added 7d78031) |
| 7 | Nov 16 | Vaporwave Retro / Modern | Start button | emblem squished | 46e9b97 (9-slice) | Nov 16 pass 1 ✓ |
| 8 | Nov 16 | all | equip transition | must be themed per skin; Anime Blaze shatters, not fades; nothing pops in | — | Nov 16 pass 1 ✓ (all 6 recorded) |
| 9 | Nov 16 | Good Witch Day / Night | Home, equip | owl replaces the cat; wings-spread owl flies in, constellations everywhere | 9a808c2, b7769c9 | Nov 16 pass 1 ✓ |
| 10 | Nov 16 | all | feed | liked/disliked must visibly fill or change | 98b8b61 | Nov 16 pass 1 ✓ |
| 11 | Nov 16 | Witchcraft | Skins header, equip | triple moon needs a full middle moon | 26d56dc | Nov 16 pass 1 ✓ |
| 12 | Nov 16 | Heaven's Light Day / Twilight | menu, Home, transition | Logout unreachable; banner/profile/timeline photos misaligned; wings mirrored; Twilight checkerboard on banner + navbar; profile bleeding into banner; wordmark hidden; "Coming soon" off-centre | e51302b + later | Nov 16 pass 1 ✓ (menu, photos, banner, wordmark, store); re-check after the HL session's next push |
| 13 | Nov 16 | all | account menu | off screen; text unreadable over the page (frosted OK if readable; Vaporwave solid) | e191467 | Nov 16 pass 1 ✓ (Witchcraft menu bars fixed 88f1231) |
| 14 | Nov 16 | all | store | "Owned · Coming soon" too big → small Owned tag on the picture; cards same size; options in the top bar | e191467 | Nov 16 pass 1 ✓ (Witchcraft tag fixed 7d78031) |
| 15 | Nov 16 | Good Witch | chat, fields, pop-ups | chat input hidden while chat open; iOS zoom on fields < 16px; pop-up × untappable; Night pop-ups | — | Nov 16 pass 1 ✓ |
| 16 | Nov 16 | Anime Blaze (any skin viewing a Heaven's Light user) | bottom bar | grey checkerboard + clouds behind the bars | 7d78031 | Nov 16 ✓ |
| 17 | Nov 16 | all | profile card / profiles | long names must wrap by word, stay readable, not hit decorations or push under the cover (criterion L) | 063fa13 (Superhero network/group names, #Basic group names, Witchcraft ribbon shrink-to-fit) | ✓ Nov 17 pass 2 |
| 18 | Nov 16 | all | everywhere | unreadable text: buttons, pop-ups, placeholders, headings, app-coloured icons (criterion U) | — | pass 2 |
| 19 | Nov 16 | all (live accounts) | — | test simulators changed live account settings | 81fd23c (QA read-only mode: `window.__BV_QA_READONLY=true` in the QA install's `<head>` + main's `js/supabase.js` swallow every live write) | every QA install must show `[QA read-only] ON` in the console before a pass |
| 20 | Nov 17 | all (owner's iPhone) | whole app | plain pre-skins default look: no Skins tab, default colours, plain like buttons, profile counts 0 (account data intact: 14 skins owned, Scrapbook equipped). **Root cause:** the App Store copy (1.0.3, July) crashed in applyPremiumSkin on skins it doesn't know (scrapbook, good-witch, superhero, basic), and its update check only ran after startup, so the phone could never update, even after a reinstall. Contributing: the Nov 16 OTA cleanup in initLiveUpdates deleted the updater's fallback bundle, so a slow-start rollback dropped the phone to that copy | 353ba3e (notifyAppReady first in `<head>`; cleanup waits 60 s, never runs from builtin, keeps the running, queued and 3 newest good bundles); 395a82b (js/ota.js: update check runs first and standalone; verified on a fresh sim with app.js deliberately broken); 67ff9ac + live SQL supabase/app-store-copy-compat.sql (get_own_profile hides unknown skins from the July copy; current code reads get_own_profile_v2; trigger keeps fsPhotoPos) | ✓ Nov 17: July copy reaches its update check with Superhero equipped; owner's phone has its skins back |
| 21 | Nov 17 | #Basic (Rosé + Pumpkin Spice) | icons | icons too thin / small → chunkier and bigger | fixed before ship (7a4477e) | ✓ Nov 17 pass 2 |
| 22 | Nov 17 | #Basic (Rosé + Pumpkin Spice) | Home profile card | name card floating → stands on an oak ledge | fixed before ship (7a4477e) | ✓ Nov 17 pass 2 |
| 23 | Nov 17 | #Basic (Rosé + Pumpkin Spice) | bottom bar | nav → the concept's inset tray with a centred ceramic disc | fixed before ship (7a4477e) | ✓ Nov 17 pass 2 |
| 24 | Nov 17 | #Basic (Rosé + Pumpkin Spice) | Home shelf | shelf not cosy like the concept → repainted shelf scene | fixed before ship (7a4477e) | ✓ Nov 17 pass 2 |
| 25 | Nov 17 | #Basic (Rosé + Pumpkin Spice) | all screens | everything too spaced out → tightened; Pumpkin art had 60–120 px transparent margins (trimmed) | fixed before ship (7a4477e) | ✓ Nov 17 pass 2 |

| 26 | Nov 17 | Heaven's Light (Day + Twilight) | Home top bar | profile picture doesn't fill its little space (photo hung out of the wreath's gold ring on the left, gap on the right) | 063fa13 (wreath re-centred on the ring measured in avatar-wings) | ✓ Nov 17 pass 2 |
| 27 | Nov 17 | all | profile view | rule: the profile view's picture area must match the Home profile view (criterion V) | 063fa13 (Superhero Heroes: big + two stacked grid on profiles too) | ✓ Nov 17 pass 2: Scrapbook, Good Witch, Vaporwave, HL, Blood Moon, Superhero, #Basic match; Anime Blaze + Witchcraft profile photos made round in their Home rings (owner: "make them round" — round where the concept's profile screen is round, themed otherwise; always per the concept art) |
| 28 | Nov 17 | all | every screen | check everything is aligned and matches the concept art; fix what doesn't | 063fa13 + this pass | ✓ Nov 17 pass 2 (fixes below) |
| 29 | Nov 17 | all | posts | like/dislike row and other text/boxes still flow out of bounds | pass 4 (this commit) | ✓ Nov 17 pass 4 (qaOverflow clean on the post rows in all 21 renditions) |
| 30 | Nov 17 | Scrapbook | group page | "Group Coins" runs out of the stats box (screenshot) | pass 4 (this commit) | ✓ Nov 17 pass 4 |
| 31 | Nov 17 | all | every page incl. story viewer + account menu | "do the full things … pictures where they're supposed to be, no out of bounds" | pass 5 | ✓ Nov 18 pass 5 (3 sweeps) |
| 32 | Nov 18 | all (seen on Vaporwave) | Home pill / Network tab "People You May Know" | "out of alignment and being cut off" | pass 6 | ✓ Nov 18 pass 6 |
| 33 | Nov 18 | Vaporwave retro | group page | "odd panneling issue and spacing issue" | pass 6 | ✓ Nov 18 pass 6 |
| 34 | Nov 18 | #Basic | skin store | "the #basic art for the skin shop is weird" (vignette cut-out on black) | pass 6, new art | ✓ Nov 18 pass 6 |
| 35 | Nov 18 | all | someone's profile | "some of the pictures are out of their frame when you go to view profile" | pass 6 | ✓ Nov 18 pass 6 (21 renditions, top/mid/bottom) |
| 36 | Nov 18 | Scrapbook + others | someone's profile ⋯ menu | "the little pop up under the options … sometimes nothing shows up" | pass 6 (fullskins.js) | ✓ Nov 18 pass 6 (21 renditions) |
| 37 | Nov 19 | Vaporwave Retro + XP (all 4) | group card, Home profile card | "3 lines through it … it should be one solid color" (panel fade tiled 2–3×) | pass 7 (fullskins.css) | ✓ Nov 19 pass 7 (4 variants × 23 screens) |
| 38 | Nov 19 | BlipVibe default + #Basic | Skins shop / My Skins store cards | "the picture for #basic and blipvibe don't match the others in the skins store" (both were app screenshots; the rest are full-bleed painted scenes) | new painted cards (Codex): BlipVibe = mascot in a blue sky, #Basic = cream "basic girl" flat-lay | ✓ Nov 19 on the 390pt phone (Skins shop + My Skins) |

## Queued for the next pass

Nothing queued (Blood Moon + #Basic swept in pass 2). Not yet re-checked on device: Barista Bar / Latte Break / Last Call,
season gust, flat-lay equip, bloodSwap animation (animations need a real equip, which QA read-only mode doesn't do).
