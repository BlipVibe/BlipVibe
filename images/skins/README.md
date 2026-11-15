# Full skins — playbook

Each skin's folder has a `NOTES.md` (targets, art sets, wiring, CSS map, owner feedback, leftovers).
Read `scrapbook/NOTES.md` first: it is the master and records every rule the owner set.
Older decisions/plan for all 22 skins: `prototypes/skin-engine-spec.md`.

## Folder layout (per skin `<id>`)
- `concept*.png` — approved concept sheets (local only, git-ignored)
- `kit/` — raw Codex PNGs (local only)
- `assets/*.webp` — shipped art (must be whitelisted in `.gitignore` when the skin ships)
- `card.webp` — 256px shop card (shipped)
- `NOTES.md` — this skin's build notes (shipped in git)

## Build loop (what worked on Scrapbook)
1. **Targets**: approved concept sheets + close-up crops of single screens. Write a field-corrections
   table (concept text vs real app fields). Concepts omit the top bar and invent things — the app keeps
   its top bar and every real feature; never remove a feature to match a concept.
2. **Art from Codex, from briefs** (`prototypes/<id>-extras-N-brief.md`): one chat per set; describe the
   concept's own material (realistic paper for Scrapbook, clean comic art for Anime Blaze…), real alpha,
   9-slice border zones stated in px, seamless edge tiling, a contact sheet. Review the contact sheet
   before wiring anything.
3. **Convert** PNG → WebP (Pillow in a scratch venv), add every piece to the skin's `assets` list in
   `js/fullskins.js`, reference it as `var(--fs-<name>)`.
4. **CSS only places art**: `border-image: var(--fs-x) <slice> fill / <width> round`. Measure windows/slots
   from the art's alpha, never eyeball.
5. **QA in the real app** (iPhone simulator with the look-only switch), page by page, compare with the
   concept, send the owner screenshots at each step, push (site + OTA publish on push to main).
6. Owner checks on his phone (close/reopen the app twice for OTA), fix, repeat.

## Non-negotiables (owner)
- Minimal CSS; generated art for every visual; never "CSS-looking". Match the CONCEPT's material:
  Scrapbook = realistic photographed paper; Anime Blaze = clean comic illustration (owner: not realistic).
- Home always shows cover + profile picture + profile card; top bar on every page; no "Back to Home".
- Photos never cropped; profile picture in front of cover frames; liked state visibly solid.
- Bars vertically centred — EVERY skin: top-bar content sits ABOVE the banner art's bottom edge (padding-bottom
  ≈ the edge's height), bottom-bar tabs pushed DOWN toward the home indicator (padding-bottom ≈ safe-area − 6px).
  The owner has flagged this on two skins. Search text clears the icon; static sharp background on iPhone.
- REJECT anything that doesn't match the concept exactly or extremely close (owner rule). Only exception: the
  concept's fake/made-up fields — QA those against the real app fields.
- Each concept window is the literal spec ("no room for interpretation"), down to how a post is presented.
- Skins are web-only (no native/Capacitor changes); look keys save only via `set_skin_look`.
