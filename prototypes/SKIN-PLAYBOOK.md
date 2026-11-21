# BlipVibe skin playbook — the one way to make a skin

Owner, Nov 21 2026: "come up with a definitive way of making skins … there is a ton of the same errors I have been having
to tell you to fix in the other chats. We will use this list when making new skins."

Every new skin, look, rendition or Vibe follows this file from step 1 to step 8. Every skin session brief links it.
It was built from the owner's corrections across all skin chats (Nov 15–21) and `prototypes/qa/skin-qa-log.md`.

**What works:** the Logo Classic default was the easiest build because every page concept was painted from that page's
real field list ("it's actually making the screen concept art with only the fields needed"). So every skin starts there.

---

## 1. Style truth: one Home concept

- Paint ONE Home concept first (two phones: top and scrolled). The owner approves it before anything else. It is the
  style truth for every later page.
- **It must look different from every other skin**, not just in colour. Change the Home/profile layout, the frame and
  panel shapes, the materials, the nav style, the icon style, the type, the timeline-photo treatment and the animations.
  "these should all look way different than each other"; "the profile picture doesn't always need to be in the same
  spot". Open `images/skins/default/_ref/existing-skins.jpg`, write down how yours differs, and watch near neighbours
  (comic vs comic, dark-moon vs dark-moon).
- Theme everything. Timeline photos become part of the theme (polaroids for Scrapbook only, tarot cards for Witchcraft,
  and so on). Nothing generic or untouched by the theme.
- Material follows the concept. Realistic where the concept is realistic ("looks too much like CSS" → photoreal paper);
  clean illustration where it is not.
- Day/Night or colour renditions are a real redraw from their own approved concept, never a recolour filter.

## 2. Concepts page by page, real fields only

Owner rule (Nov 19): "do it by page and fields that are actually available on those pages."

- Before prompting, read `index.html` + `js/app.js` for that page and write its field list: every field, button, tab,
  badge and count the page really renders at that width. Feed ONLY that list. Nothing from other pages, nothing
  invented, no lorem, no placeholder bars. Template: the `<!-- PAGE:… -->` sections of
  `prototypes/default-redesign-concept-brief.md`. Keep each page's list in your skin's brief.
- 1536x1024, **two phones per page**: Phone A scrolled to the top, Phone B scrolled down, so every field fits.
- Realistic values (names, counts, times), spelled right. No real brands or people.
- **All 16 pages, each its own concept:** Home, Group, Groups, Notifications, Network, Search, My Profile,
  Other Profile, Messages, Chat, Comments, Create a Post, Skins shop, the skin's own menu (Start/Blip-style), Desktop
  Home, Desktop Groups. Plus the store card and the equip animation frames.
- Desktop gets its own structure, never the shared 3-column template and never the phone layout stretched ("these don't
  scale well with the desktop version").
- Send the owner one contact sheet of all pages, then keep going unless they object.
- **Mascot:** the BlipVibe bubble head NEVER has arms, hands, body or legs. Never write "waving", "arms up" or "peek"
  in a prompt (say "tilted greeting", "bounce"). Zoom in on every mascot before accepting art.

## 3. Element inventory → kit list

For every page concept, list every visual piece: panels, cards, pills, tabs, fields, buttons, icons (each state),
badges, frames, rings, dividers, tape, stickers, bars, nav, backgrounds, decorations, mascots. Each one gets art in the
kit. If it is in the concept, it is painted, not drawn in CSS. ("There's so much detail gone.")

## 4. Art kit rules

- Paint with Codex imagegen: `codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox -C <repo>
  "<use the imagegen skill, read brief X, save PNGs + _sheet.png>" < /dev/null`. It hangs without `< /dev/null`.
- **Geometry rule** (from Pixel Pal) when a look reuses an existing skin's CSS: same canvas size, same outline position,
  padding, corner size, window and tail position as the base part of the same name. Only the style changes.
- **Real transparent alpha.** Never a painted grey/white checkerboard. Check every piece on mid-grey.
- No text, letters or numbers baked into art. Frames and rings keep a fully transparent window.
- **Trim transparent margins.** Untrimmed 60–120px margins made everything "too spaced out".
- Icons chunky and big enough to read ("icons too thin / small"). Liked/disliked icons get a FILLED "on" state.
- Store card: 1024x1024 full-bleed painted scene (no app screenshot, no text), 256x256 webp. Every store card must
  match the others.
- Each job ends with a `_sheet` of every new piece. Convert to webp, never commit raw PNG concepts or kits.

## 5. Build page by page, 1:1

"it must look 1 to 1 to the concept no exceptions"; "spacing too"; "almost no CSS visuals".

- Overlay the concept crop (402pt wide, ~45% opacity) on the live page and match every top, height and gap to it.
  Read positions from the overlay, not by eye.
- CSS only places and sizes art. No CSS-drawn frames, gradients, shadows, rings or fills standing in for art.
- **Never stretch art into another shape.** 9-slice panels (pill ends = half height), contain for pictures, separate
  pieces placed on top.
- Kill effects the concept doesn't have: backdrop blur, template `::before` overlays, the old premium spinning ring /
  `.premium-border` / legacy `premium-<id>` body styles.
- After each page, send a side-by-side (concept | build, top and scrolled) with SendUserFile. Say which differences are
  only the account's real data.

## 6. The recurring-errors gate — check EVERY page, EVERY rendition, before showing anything

These are the errors the owner kept having to report. A page is not done until every line passes.

**Pictures**
- [ ] Every photo sits exactly in its frame: no offset, spill, gap or squish. Avatar fills its ring.
- [ ] Profile picture and timeline/cover photos show up and never disappear after a while.
- [ ] The profile picture never covers a timeline photo or decoration.
- [ ] Someone else's profile and the My Profile pop-up use the SAME frames and layout as Home, with the border art
      (not a bare photo). Profile pictures actually load there.
- [ ] Profile card always on Home, never hidden; restyle, never remove a feature. Ask before removing anything.

**Text and bounds**
- [ ] Every text fits inside its box, button, pill, tab or bubble. Nothing clips or runs out ("Group Coins" in stats,
      like/dislike row on posts, "People You May Know" pill).
- [ ] Shared posts and post action rows stay inside the post.
- [ ] Long names wrap by word and stay readable.
- [ ] Text readable everywhere, including highlighted tabs, placeholders, pop-ups and buttons.
- [ ] Fields are 16px (iOS zooms on smaller).

**Layout**
- [ ] Spacing matches the concept, not "too spaced out" and not cluttered.
- [ ] Top bar and bottom nav vertically centred. The profile card doesn't bleed under the top banner. The wordmark
      isn't hidden behind icons.
- [ ] Things are centred where the concept centres them (not justified left). Search glass correct on every search.
- [ ] Nothing floats in mid-air that sits on something in the concept (the #Basic name card on its shelf).
- [ ] Panels are one clean piece, no tiled seams or "3 lines through it".
- [ ] Message bar centred; messages only drag up and down.

**Every width and device**
- [ ] Phone pages checked at 375, 390/393, 402 and 430. Never hardcode 402px; use fr, `calc(100vw - …)`,
      `min(px, vw)`. Right-anchored decorations scale with vw.
- [ ] Icons tinted with a mask, never `filter: hue-rotate` (purple on a real iPhone).
- [ ] Background crisp on the real app, not blurry (check the device, not just the preview).
- [ ] Desktop checked against its own desktop concept.

**Menus and controls**
- [ ] Account menu (Log out) fully on screen and reachable. Menu text readable: solid, or frosted only if still
      readable. A menu the owner called solid stays solid.
- [ ] Liked/disliked visibly fill or change. React button works on other people's pages.
- [ ] Pop-up × buttons tappable; chat input visible while chat is open.
- [ ] The skin's own menu (Start/Blip) items work and the picture in it isn't blank.

**Art defects**
- [ ] No painted checkerboard anywhere. No old premium overlays leaking in.
- [ ] Mascot zoom-check: no arms or body; same size and quality as in the concept.
- [ ] Emoji "?" boxes in the simulator are a sim font gap. Not a defect.

**Saving and availability**
- [ ] Equipping saves and sticks after reload (look keys go only through `set_skin_look`; new look keys go into
      `supabase/guard-stale-look-writes.sql` AND app.js `LOOK`). Renditions (day/night, colour) save too.
- [ ] The skin is actually pickable on the PHONE: in the shop / My Skins / its menu, with its card. ("it's not
      available to pick on phone in the skin shop … why wasn't this caught in QA?")

## 7. Animations

- A themed equip/switch animation per skin, painted with Codex, never borrowed ("Scrapbook puts it down piece by piece";
  "I don't like how the cat just pops up"). 1.5–3s, respects reduced motion, never leaves the screen covered.
- Nothing pops in. Send the owner a short recording or frame strip.

## 8. QA setup, ship, follow-up

- **Own simulator** per session (`xcrun simctl create`), app bundle only, the owner signs in once and you keep it signed
  in. Every test install injects `window.FS_BASE="images/skins/";window.__BV_QA_READONLY=true;` and the console must
  show `[QA read-only] ON`. Never tap Equip, Buy, Follow or Publish on a live account. Confirm each screenshot shows
  YOUR skin. Don't touch the kept QA phones A6D4ADC8 / B034A950. Delete your sim at the end (with the owner's OK) and
  prune `ionic_built_snapshots`.
- Run the section 6 gate on every page × rendition × width yourself before telling the owner it is done. "did you
  really do QA?" must never come up.
- Ship as `ready:false` / wip until the owner approves, then flip it and push to main (standing OK). Web-only, never
  native code. New skin ids must not crash old store builds (`js/ota.js` first; see the OTA fallback memory).
- Check it live on blipvibe.com and in the phone app after the OTA.
- **Every owner finding** goes in as a row in `prototypes/qa/skin-qa-log.md` "Owner-reported findings", re-tested on
  every pass. If the same kind of error shows up twice, add it to section 6 of this file.
- Notes per skin in `images/skins/<id>/NOTES.md`.
