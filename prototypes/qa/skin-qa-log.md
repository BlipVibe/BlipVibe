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
| M | **Menus/motion** | the account menu has every item on screen with Log out reachable; liked/disliked visibly fill; the skin's own swap/equip animations play and nothing just pops in |

Automated checks run on every capture too (`qaCheck` / `qaPlace` in the QA harness): horizontal scroll, fields < 16px,
premium overlays, squished `<img>`, text clipped in or spilling out of its box.

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

## Cross-skin fixes

| Fix | Commit | Skins |
|---|---|---|
| Someone else's profile: Mute / Block / Report moved into a ⋯ menu at the cover's top right, as in every concept (`wrapPvMore` in `js/fullskins.js`) | 7d78031, 88f1231 | all |
| Old Heaven's Light premium texture (`images/skin-textures/clouds.png`, fake checkerboard painted in) switched off under full skins | 7d78031 | all |
| Chat-open rules scoped to the Messages page (Vaporwave's Start bar vanished after leaving a chat) | 7d78031 | all |
| Selects use the skin's card colour + ink | 7d78031 | all dark renditions |
| My Profile pop-up: real active skin name; photo shown where the skin has no avatar mask | 7d78031 | all |

## Simulator-only quirks (not app bugs)

- Emoji show as `[?]` boxes in the iOS 26 simulator, on any font.

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
| 17 | Nov 16 | all | profile card / profiles | long names must wrap by word, stay readable, not hit decorations or push under the cover (criterion L) | — | pass 2 |
| 18 | Nov 16 | all | everywhere | unreadable text: buttons, pop-ups, placeholders, headings, app-coloured icons (criterion U) | — | pass 2 |
