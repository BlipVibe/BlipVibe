# Like / dislike "on" icons for every full skin (owner, Nov 16)

Owner: "if you liked or disliked it, it should fill or change — some skins do it, some don't."
Scrapbook already has it (`images/skins/scrapbook/assets/icon-like-filled.webp` = the outline thumb filled solid rose).
Paint the missing ON states for the other skins. Each ON icon is the SAME drawing as its OFF icon (open it — same
silhouette, same size and position in the canvas, same outline weight) but clearly FILLED / ACTIVATED in that skin's
style, so a tapped button reads as "on" at a glance. 256x256 transparent PNG unless noted, real alpha, no text.

Open the OFF icon first: `images/skins/<skin>/assets/<rendition>/icon-like.webp` / `icon-dislike.webp`
(rendition folder is empty for the default one).

| skin / rendition folder | files to paint | ON look |
|---|---|---|
| anime-blaze (root, red) | icon-like-on, icon-dislike-on (187x192 / 183x192, same as OFF) | the comic hand filled with the skin's red, white highlight, bigger flame/energy streaks, black ink outline |
| anime-blaze/blue, /green, /pink, /purple | same two files each | same, recoloured to that variant's colour (look at that folder's OFF icon) |
| witchcraft (root) | icon-like-on, icon-dislike-on | the gold outline thumb filled with glowing violet/magenta, antique-gold rim, soft glow |
| good-witch (root, Day) | icon-like-on, icon-dislike-on | the plum outline thumb filled with soft lavender-to-pink pearly gradient, tiny gold sparkle |
| good-witch/night | icon-like-on, icon-dislike-on | the lilac outline thumb filled with glowing lilac/violet, tiny gold sparkle |
| vaporwave (root), /modern, /retro-dark, /modern-dark | icon-dislike-on only | the dislike thumb filled with the same hot-pink gradient as that folder's `icon-like-on` heart (modern: same), keep the cuff colour |
| heavens-light (root), /twilight | icon-dislike-on only | the gold fist glowing: brighter polished gold with a warm halo, matching that folder's `icon-like-on` heart |

Save as PNG into `images/skins/<skin>/kit/likes/<rendition or root>/<file>.png` (e.g.
`images/skins/anime-blaze/kit/likes/blue/icon-like-on.png`, `images/skins/witchcraft/kit/likes/root/icon-like-on.png`),
plus one `images/skins/_likes-sheet.png` showing every OFF icon next to its ON icon.
