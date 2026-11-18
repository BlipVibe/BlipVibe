# #Basic — build notes

Status: SHIPPED Nov 17 2026 (owner approved). Two renditions: Rosé + Pumpkin Spice.

## Targets
- Approved Nov 16 2026 ("Approved, go"): `concept-rose.png`, `concept-rose-2.png`, `concept-rose-barista.png`,
  `concept-pumpkin.png`, `concept-pumpkin-2.png`, `concept-pumpkin-barista.png` (local only).
- 3x crops of every phone: `prototypes/reference/basic-rose/`, `prototypes/reference/basic-pumpkin/` (local only).
- Concept brief: `prototypes/basic-concept-brief.md`; production brief: `prototypes/basic-kit-brief.md`.

## Owner direction
- Look = CLEAN-GIRL NEUTRALS (cream bouclé, oat linen, travertine, light oak, soft daylight). Interaction = the
  BARISTA BAR. Renditions = ROSÉ (blush) + PUMPKIN SPICE (caramel), switched by the season drink in the top bar.
- Owner rule "these should all look way different than each other": no arches/columns/laurels/gold ornament/all-caps
  (Heaven's Light is the closest in colour). #Basic is the "shelfie": 3 oak-framed prints of different sizes leaning on a
  floating oak shelf (= the 3 timeline photos), round ribbed-ceramic avatar dish, tent place-card for name/bio/stats;
  lowercase rounded sans (Quicksand) + Lora italic accents; thin espresso line icons; linen/bouclé squircle cards; a
  FLOATING oak tray bottom nav with a ceramic saucer under the active tab (label shown only on the active tab);
  "daily routine" checklist quests with latte-cup progress icons.
- Standing rules (scrapbook/NOTES.md, memory skin-qa-checklist): match the concept almost 1:1, generated art for every
  visual, 16px fields, profile card always on Home, liked/disliked visibly filled, menus readable, own simulator.

## Signature interaction — Barista Bar (`basicBar` in js/fullskins.js)
Cup-on-saucer button in the top bar → café menu card drops from the bar (notch at the cup), items written like a café
menu with dotted leaders: my profile · saved posts · skins · settings · switch season · latte break · last call.
- Latte Break (`basicLatte`): latte scene; pitcher tips in, milk stream pours, latte art blooms from the pour point
  (heart → rosetta → tulip, looping), steam; mini cups show the current pour; tap = a sip, the art swirls away.
- Last Call (`basicLastCall`): takeaway cup slides onto the counter, a marker writes your name misspelled
  (`baristaName`: Dane → Daynee, Grace → Graycee), the striped awning unrolls with "closed — see you tomorrow", then
  rolls back up and the app is open again.

## Animations (all #Basic's own)
- Equip (`equipBasic`): "flat-lay snap" — travertine surface slides up, props glide in and settle into a flat-lay,
  a camera viewfinder focuses, snap (flash), the photo shrinks into a camera-roll thumbnail.
- Season swap (`basicSwap`): a gust of blush petals (→ Rosé) or autumn leaves (→ Pumpkin Spice) sweeps the screen while
  the iced latte melts into the steaming mug (or back); the season changes under the gust.

## Art
`kit/rose` → `assets/`, `kit/pumpkin` → `assets/pumpkin/`, `kit/fx` → `assets/` (shared FX);
convert with `prototypes/tools/basic_convert.py images/skins/basic`.

## Log
- Nov 16: concept brief → 6 sheets (Codex) → approved. Crops + production brief; kit painting in 4 Codex jobs.
  Engine entry, Barista Bar, Latte Break, Last Call, equip + season FX and the #BASIC css written.
- Nov 16 (later): Rosé kit + Barista/FX art in (assets/ local, not whitelisted yet — whitelist on ship). Own simulator
  "BlipVibe Basic" (B94F4BD8…). Rosé QA'd so far: Home (shelfie/place card/featured/quests/tabs/posts), Groups, Messages,
  Chat, Skins, Network, Notifications, Search; Barista Bar menu, Latte Break, Last Call and the season gust all working.
  Left: Profile page, post view, comments, create post, story, group page, other profile; Pumpkin kit (still painting in
  Codex: kit/pumpkin → convert) + full Pumpkin QA; equip transition check; then owner approval → remove wip, whitelist assets.
- Nov 17: merged main (QA read-only guard 81fd23c). Every QA launch: app stopped, all bundles patched with
  __BV_QA_READONLY, "[QA read-only] ON" confirmed (green RO chip) — the app's updater can drop an unguarded bundle while it
  runs, so always stop the app before syncing. Pumpkin kit converted (assets/pumpkin/). Finished Rosé: own profile, other
  profile (place card, linen action pills), group page (rounded cover + ceramic square frame, no place card), post, comments,
  create post, story. Pumpkin geometry (own frame windows, thicker dish, wider place-card flap, skin-card window) and
  Pumpkin QA: Home, Groups, Skins, Messages, Barista Bar, account menu. Removed cloned Heaven's Light Twilight dark rules
  (navy modals/menus) that had been renamed to Pumpkin. Equip "flat-lay snap" checked in the app (look-only trigger).
  Known: this fresh simulator draws some emoji as "?" boxes (no emoji font) — not a skin issue.
  Left: owner approval → remove wip, whitelist assets in .gitignore, ask before merging to main.
- Nov 17 (owner feedback): "icons need to be bigger and chunkier" → all icon/notif/menu art repainted ~2.5x heavier
  (prototypes/basic-icons-chunky-brief.md) and sized up. "the name folded card … floating mid air" → it now stands on its
  own oak ledge (card-ledge art, prototypes/basic-card-ledge-brief.md), name + bio left, stats stacked right (concept).
  "use this navbar" → the concept nav: slimmer inset oak tray, active tab = ceramic disc centred in the tray. Shelf kept.
- Nov 17: owner "not as close or cluttered as the concept" → shelf-scene repainted in the concept arrangement (prototypes/basic-shelf-v2-brief.md), windows re-measured, dish nests on the tall frame, name card leans right on the shelf.
- Nov 17: full QA pass, every page in Rosé + Pumpkin (read-only). Fixed: other-profile dish height, Pumpkin chat sent-bubble contrast, equipped tag (now a tick on the picture), quest reward chip centring, Pumpkin quests header inside the notepad, modal square corners + dark rules, post avatar touching card edge, name card stats inside the card.
- Nov 17: owner "everything is too spaced out" → tighter rhythm everywhere (home blocks, card/ledge empty space reclaimed, compact photos card, lists, headers, chips, skins grid, posts); Pumpkin art pieces had 60–120px transparent margins (notepad, post cards, place card, bubbles…) → trimmed in kit/ to their painted edge + 14px like Rosé.
- Nov 17: owner "Yes, ship it" → wip removed, store card from the painted Rosé store-card, assets/ whitelisted, merged + pushed to main.
- Nov 17 (owner: "redesign the layout and everything … it literally doesn't look good"): full redesign → v2 "AESTHETIC
  WIDGETS" (owner picked it; kept palette, Rosé + Pumpkin, Barista Bar, equip + season FX). Concepts
  `concept-w-{rose,pumpkin}[-2|-barista].png` (local), crops `prototypes/reference/basic-w-*/`, briefs
  `prototypes/basic-widgets-concept-brief.md` + `prototypes/basic-widgets-kit-brief.md`. New kit: wallpaper, widget (9-slice,
  every card), widget-inner, top-bar, dock, tile/tile-on (icon tiles), pill/pill-on, field, avatar-ring, bubbles, send-btn,
  white dock icons, barista-card, store card. timeline: 4 (frame 1 = the cover on the profile widget, 2-4 = photo widgets).
  Home + profile view are a CSS grid (wrappers display:contents). Old shelf CSS removed; old art names alias to the kit.
  QA'd read-only in own simulator: Home, Groups, Skins, Messages, Chat, Barista menu, profile pop-up, profile view, Pumpkin.
  Not seen (data didn't load on the test device): Network list, feed posts, notifications, search, group page.
