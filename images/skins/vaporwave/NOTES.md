# Vaporwave — build notes

Status: IN PROGRESS (started Nov 15 2026).

## Targets
- Retro (approved concept): `concept.png` (home, skins, profile, groups, post, messages, chat) and `concept-2.png`
  (home-full, network, notifications, search, group page, other profile, comments, create post, story).
  3x crops per screen: `prototypes/reference/vaporwave/`.
- Modern (approved Nov 15, blue-led): `concept-modern.png` / `concept-modern-2.png`; crops `prototypes/reference/vaporwave-modern/`.
- Dark modes (approved Nov 15): `concept-retro-dark*.png`, `concept-modern-dark*.png`; crops `prototypes/reference/vaporwave-{retro,modern}-dark/`.

## Owner direction
- Nov 15: "let's do the retro one" → Vaporwave (1995 desktop + 80s synthwave).
- Nov 15: two renditions like Good Witch Day/Night — "retro then modern, keeping it semi Windows / OS themed".
  Retro = the approved concept (grey bevel windows, navy title bars, Start taskbar, marble). Modern = same world as a
  sleek present-day OS (frosted rounded windows, floating dock). Switched from a toggle in the top bar (like the
  sun/moon), saved per account (fsVariants), with its own swap animation (not the Good Witch reveal).
- Standing rules from the other skins apply (see scrapbook/NOTES.md, good-witch/NOTES.md): match the concept almost
  1:1, generated art for every visual, readable text, nothing stretched, every page QA'd in both renditions.

## Art
- Old generic kit (`kit/*.png` sheets → `assets/`) predates the concept; being replaced by `kit/vw/` (Retro) from
  `prototypes/vaporwave-redraw-brief.md`. Modern art set follows once its concept is approved.
- No Windows/Apple logos: the Start button uses a pixel palm-sunset emblem.

## Log
- Nov 15: concept crops made; brief written; Codex Part A (sections 1–2: page, headers, chrome wordmark + page titles,
  taskbar, windows/controls) started; Modern concept requested in parallel.
- Nov 15: owner asked for more blue in Modern (approved), then a dark mode for both (approved). Four renditions:
  retro (assets/), modern (assets/modern/), retro-dark (assets/retro-dark/), modern-dark (assets/modern-dark/) — same file
  names in every folder. Top bar: CRT/flat-monitor switch (Retro↔Modern, CRT power-cycle swap) + sun/moon (light↔dark,
  VHS tracking swap) once the dark art is in.
- Nov 15: owner: "focus on solid backgrounds, the upgrades can be a gradient but nothing crazy" → Retro page = solid
  colour, Modern page = soft two-tone gradient; the marble art is not used.
- Status: Retro + Modern art done and wired (Home, posts, quests, groups list); Retro Dark + Modern Dark art in Codex.
  Still to do: remaining pages (messages, chat, network, notifications, search, skins, profile view, comments, create
  post), dark renditions, QA all four, then remove `wip`.
- Nov 15 (late): Retro Dark art in (assets/retro-dark/). Owner: light↔dark uses the SAME animation as Good Witch
  (magicSwap); Retro↔Modern = "update, glitchy pixel look" (pixelUpdate: RGB tears → pixel blocks + "System Update"
  window → blocks fall away). Chat/messages/notifications/network/search styled. Fixes: 16px fields (iOS zoom), every
  full skin drops body padding while a chat is open (input bar was lost).
  Left: Modern Dark art (in Codex) → convert + register; Skins page, other profile, comments, create post; QA all four.
- Nov 16: Modern Dark art in → all four renditions live in the engine. Owner: "animations shouldn't borrow other skin
  animations, they should all be unique and themed by skin" → light/dark (same in Retro and Modern) = VHS tape: tracking
  band rolls down with "◀◀ REW / PLAY ▶  DAY|NIGHT" on-screen text; Retro↔Modern = loading-bar system update
  (loadingUpdate: 90s "BlipVibe Setup" window with pink segmented bar / Modern frosted card with glowing cyan bar,
  uneven installer progress + status lines, then the installer screen dissolves tile by tile into the new OS).
  Skins page = window cards (name in title bar, same size). Pop-ups: title bar now INSIDE the window (× was untappable).
- Nov 16: owner: profile card was tucked under the top bar → #profileCard margin-top 30px. Start button made real
  (js/fullskins.js vaporStart): opens a themed Start menu (BlipVibe 95 / XP side strip) — My Profile, Saved Posts,
  Skins, Settings, Switch to Modern/Retro, Night/Day Mode, Screensaver (starry synthwave grid with the skin's icons
  bouncing; tap to wake), Shut Down… (owner: "a shutting down load bar") = Shut Down window with a stepped bar →
  screen collapses to a line → "It's now safe to turn off your BlipVibe." → boot screen with logo + bar.
