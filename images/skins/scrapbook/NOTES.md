# Scrapbook — build notes

Status (Nov 15 2026): **shipped, owner-approved on his phone.** Ready = true in the Skins catalog, price 300.
Master skin: every later skin follows the process and the rules learned here (see `../README.md`).

---

## 1. Visual targets (what "done" means)

| File | What it is |
|---|---|
| `prototypes/reference/scrapbook-master-v2.png` (+ `.webp`) | **Owner's master**: 7 phones — Home, Skins, Profile, Groups, Post, Messages, Chat |
| `prototypes/reference/scrapbook-profile-master.webp` | Profile screen close-up |
| `prototypes/reference/concept-post.png` | A post card close-up (layered paper, tape, photo, action row) |
| `prototypes/reference/concept-messages.png` | Messages list close-up |
| `prototypes/reference/concept-chat.png` | Chat close-up (torn-note bubbles, input bar) |
| `prototypes/scrapbook-field-corrections.md` | Where the master's text/fields differ from the real app |

**The concepts are the spec. Match them almost 1:1 — but the concepts are NOT the app:**
- The concepts leave out the app's **top bar** — the app always keeps it, on every page (owner).
- The concept Profile has a back arrow — **no "Back to Home"** link under Scrapbook (owner: an artifact of the concept).
- The concept Home has no profile block — **Home ALWAYS shows the cover polaroids, profile picture and
  profile card** (owner: "That shouldn't be a thing ever" when I hid them). Match concepts by
  RESTYLING, never by removing a feature.
- Wrong text in the concept → keep the look, use the real field (`scrapbook-field-corrections.md`).

## 2. Owner rules learned on this skin (apply to every skin)

1. "Minimally use CSS for anything." Every visual is **generated art**; CSS only places it.
2. "It must look like the concept art even if you have to make graphics to get it there."
3. **REALISTIC** art: "these look a bit too much like CSS" — rows, bubbles, cards, buttons must look like
   PHOTOGRAPHED material (here: torn paper with fibrous edges, soft crinkle, stains, offset shadow,
   a second sheet peeking out). Tidy deckled rectangles read as CSS. Ask Codex for "realistic" explicitly.
4. Textures preserved: 9-slice with `round` (repeat), not stretched. Exception: thin bars use `stretch`.
5. Paper should be **soft**, not crumpled (set 3's crumpled row was rejected).
6. **Posts differ** like a real scrapbook (6 looks, picked per post).
7. **Spacing matches the concept**; page titles centred.
8. **Background static** (doesn't scroll) and **sharp** (not blurry) on iPhone.
9. **Photos are never cropped** — whole picture, scaled to fit the post; the paper edge hugs the photo,
   **no gap** between photo and border ("they should just look like pictures being tapped on").
10. **Profile picture must be in FRONT of the polaroids**, and photos must sit inside the polaroid windows
    (nothing poking out).
11. Liked/disliked must look different: **solid rose thumb** (concept), not just a glow.
12. Bars must be **vertically centred** (top bar content was too low, bottom tabs too high).
13. Search boxes: text must clear the magnifier.
14. Send the owner **pictures** at each step, not just text.

## 3. Art — where everything came from

All art: Codex (ChatGPT desktop app, bundle `com.openai.codex`), one chat per set, from a brief file.
Raw PNGs live in `kit/` (local only, git-ignored); shipped WebPs in `assets/`.

| Set | Brief | Pieces (→ `assets/*.webp`) | Status |
|---|---|---|---|
| base kit | `prototypes/asset-kit-brief.md` | background, icons(20), panels, buttons, nav, frames(+avatar mask), quests(0/50/100), deco 1–6, thumb | icons + frames + quests still used |
| extras 1 | `prototypes/extras-kit-brief.md` | photo-frame, tile, tape-2, bar-track, bar-fill, field, sticker-1/2, divider | partly replaced |
| extras 2 | `scrapbook-extras-2-brief.md` | strip9-*, panel9-*, header9-pink, photo9-torn, tape-corner-a/b, flowers-spray, heart-sticker, coin-stack, timeline-frame… | timeline-frame, tapes, stickers in use |
| extras 3 | `scrapbook-extras-3-brief.md` | background-v2, banner, navbar, row9-crumpled, chip9(-active), coin-pill, avatar-ring | background-v2, navbar, avatar-ring in use (crumpled row rejected) |
| extras 4 | `scrapbook-extras-4-brief.md` | card9-soft, row9-soft, label9, bubble9-cream/pink, icon-circle, send-circle, field9-soft, bar9-soft, tape-card, heart-doodle, unread-dot, photo-soft-edge | mostly superseded by 8/9 |
| extras 5 | `scrapbook-extras-5-brief.md` | backing9-aged/ledger, scrap-pink/kraft/blue, tape-beige/pink-grid/sage, action-strip9, sticker-daisy/stamp | scraps, tapes, stickers in use |
| extras 6 | `scrapbook-banner-brief.md` | **banner-collage** (header), coin-tag-small | in use |
| extras 7 | `scrapbook-extras-7-brief.md` | icon-like-filled, icon-dislike-filled, icon-eye, **photo-edge9** | in use |
| extras 8 | `scrapbook-extras-8-brief.md` | **REALISTIC**: row9-real-a/b/c, bubble9-real-cream/pink, label9-real, field9-real, bar9-real, circle-real(-rose) | in use |
| extras 9 | `scrapbook-extras-9-brief.md` | **REALISTIC**: panel9-real-a/b, post9-real-a/b/c, button9-real(-rose), chip9-real(-active), track-real, fill-real, tile-real | in use |

Conversion (no cwebp/PIL on the Mac by default): `python3 -m venv <scratch>/venv && <scratch>/venv/bin/pip install pillow`,
then `Image.open(png).convert('RGBA').save(webp, 'WEBP', quality=84–86, method=6)`. Icons/circles downsized
(128–160px); 9-slice art kept at full size. Total realistic sets ≈ 1.3 MB.

## 4. Engine wiring

- `js/fullskins.js` → `FULL_SKINS.scrapbook`: ink `#3e2d20`, muted `#75604b`, accent `#cf6f8c`,
  fonts Kalam (body) / Caveat (titles), `timeline: 2`, `slice: 16.67`, `edge: 16`, `extras: true`,
  `parts` overrides (background → background-v2, panel-card → card9-soft, …), `assets` list (every
  extra piece becomes `--fs-<name>`), `theme` (re-points app vars `--dark`, `--card`, …).
- **Every new asset must be added to `assets`** or its `--fs-*` var is undefined (silently blank).
- Catalog: `ready: true` only for scrapbook; cards at `images/skins/*/card.webp`.
- Timeline: 2 slots in `timeline-frame.webp` (872×848). Windows measured from the art's alpha:
  slot 1 centre 28.2%/31.1%, 45.4×45.5%, −13.3°; slot 2 centre 69.7%/47.2%, 44.7×45%, 11.4°.
  CSS uses them +1% so edges tuck under the frame. **Measure windows from the art; never eyeball.**
- Per-post variety: `data-fs-v` 1–6 from a hash of the post id (engine tags posts as they're added).
- `.fs-namecard` wrapper: name + **every** `.profile-title`/`.profile-about` child (Profile page puts the
  badge row between name and status — only checking the next sibling broke it).

## 5. CSS map (`css/fullskins.css`, Scrapbook blocks, later blocks win)

| Area | How |
|---|---|
| Background | painted on `#premiumBgLayer` (fixed layer) — iOS ignores `background-attachment: fixed`; q90 WebP |
| Top bar | `--fs-banner-collage` 100%×100%, height 58px+safe, `padding-bottom:16px` so content centres above the torn edge |
| Bottom bar | `--fs-navbar`, `padding-top:22px; padding-bottom: safe−6px`; active tab on `nav-active` tile, all tabs same invisible border so the bar doesn't shift |
| Big cards | `panel9-real-a/b` slice 140 fill / 22px round |
| Posts | `post9-real-a/b/c` by `data-fs-v`; torn scrap strip `::before`, corner tape `::after`, stickers per look |
| Post photos | flex, whole photo `object-fit: contain`, max 520px single / 260px grid; `photo-edge9` 30 / 6px / outset 3px (hugs the photo) |
| Shared post | lighter paper card inside the post; single-photo row `minmax(0,1fr)` so tall photos can't spill |
| Action row | 6 buttons `space-between`, gap 0; solid thumbs via `icon-like-filled` / `icon-dislike-filled`; eye icon art; likers row hidden when empty |
| Rows (messages, notifs, groups, people) | `row9-real-a/b/c` mixed by `nth-child(3n…)`, slice 90 120 |
| Chat | `bubble9-real-cream/pink` slice 100; `bar9-real` input bar; `circle-real` media buttons; `circle-real-rose` send |
| Labels (titles, name tag, stats) | `label9-real` slice 80 |
| Fields / search | `field9-real` slice 80; input `padding-left:30px`, magnifier `left:8px` |
| Buttons | `button9-real` / `button9-real-rose` slice 80 |
| Tabs | `chip9-real` / `chip9-real-active` slice 70 |
| Quests | `track-real` / `fill-real` (stretch), `tile-real` icon tiles, spiral binding `deco-6` mirrored outward |
| Profile block (phones) | cover 250px, polaroids `min(74%,300px)`, avatar 124px `margin:-78px auto 4px`, ring `overflow:visible` on the wrap (it was clipped flat), name tag 62% with tape, stats one strip + vertical divider |
| Pages | `padding-top: 62px + safe`; Messages box `height: 100vh − 172px` (else the page scrolls and iOS stops drawing the chat's bottom) |

## 6. Saving & the server (cross-skin, but found on this skin)

- **Look keys change ONLY through `set_skin_look()`** (live DB rule, `supabase/guard-stale-look-writes.sql`):
  activePremiumSkin, activeSkin, activeFont, activeTemplate, activeNavStyle, activeIconSet, activeLogo,
  activeCoinSkin, premiumBg*, fsTimelinePhotos. Plain `skin_data` saves keep them. Reason: an old app
  session (stale Mac tab / other device) wrote neon-wave + empty timeline back every ~15s.
  New look-type settings → add to BOTH lists in that SQL and to `LOOK` in `app.js syncSkinDataToSupabase`.
- Other skin_data saves **merge**: read server copy, write only keys this device changed.
- Owned items can only be added, never removed (`preserve_owned_items` trigger).
- Viewing **your own** profile must not set `_pvSaved` (it blocked saves → timeline picks were lost).
- `get_public_skin_data` exposes `fsTimelinePhotos` so others see your polaroids.

## 7. QA method that worked

- **Real app in the iPhone 17 Pro simulator** (UDID `D8C893D4-A1B5-4457-9BBA-C16B67434CD9`): the July debug
  build has no OTA logic, so copy local files into `$(xcrun simctl get_app_container <udid> com.blipvibe.app app)/public/`
  and relaunch.
- **Look-only switch** (never commit; remove after): append to the simulator's `public/index.html`
  `setInterval(()=>{ if(window.BlipFullSkins && !document.body.classList.contains('fs-scrapbook')) BlipFullSkins.apply('scrapbook') },1500)`.
  It changes visuals only — nothing is saved. Its leftover theme vars show some mint text in screenshots.
- **Probes**: a fixed `<div>` overlay logging `elementFromPoint`, rects, or wrapped `sbUpdateProfile`
  payloads — this is how the hidden chat bar and the neon-wave writer were found.
- Chrome harness `prototypes/engine-harness.html?skin=scrapbook[&page=profile-view]` for layout math
  (add `tpl-cinema` to body to mimic phones).
- Simulator-only quirks: emoji render as [?]; the chat input bar isn't drawn without the keyboard (fine on device).
- Supabase SQL editor: set text with `monaco.editor.getModels()[n].setValue(sql)`; read results from zoomed
  screenshots; test writes as the user in a **rolled-back** transaction
  (`set_config('request.jwt.claims', …); set local role authenticated; …; rollback;`).
- Live DB changes and purchases need the owner's explicit OK each time.

## 8. Known leftovers / ideas
- Comments modal, story viewer, create-post and settings were themed earlier with the older (tidier) art;
  worth a pass with the realistic sets.
- People rows on Network are tall (empty space under names).
- The Mac desktop / Android sign-ins on the owner's account may still run an old build — harmless now.
