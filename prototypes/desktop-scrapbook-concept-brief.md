# Scrapbook — DESKTOP concept screens (pilot for all full skins)

BlipVibe is a social app. Its "full skins" repaint every screen with generated art. The Scrapbook skin is already
built and approved FOR PHONES. Now paint how the SAME skin looks on a DESKTOP web browser (blipvibe.com), 1440 px wide.

## What the owner wants
- Desktop must look like the same Scrapbook world as the phone version: realistic PHOTOGRAPHED craft paper, soft torn
  fibrous edges, washi tape, polaroids, pressed flowers (pink, white daisies, lilac), lace, ledger/map paper, a
  hand-lettered script font for titles, pink-rose accents. Same art, same materials, same icons.
- It must NOT look like a generic website / the plain default "three white columns" layout with a little skin art
  sprinkled on. The whole browser window is one big scrapbook: an OPEN SCRAPBOOK SPREAD / craft desk filling the wide
  screen, with the app's panels as pieces of paper taped onto it. Use the extra width for real desktop layout
  (sidebars, multi-column), but every panel, row, button, field, pill and bar is painted paper art, never flat CSS.
- REALISTIC: rows, cards, buttons and bubbles look like photographed material (torn paper with fibrous edges, soft
  crinkle, light stains, offset shadow, a second sheet peeking out). Paper is SOFT, not crumpled. Text stays readable
  and sits inside its paper.
- Photos are never cropped: whole picture, the paper/polaroid edge hugs the photo.

## Look references (read these images first; copy the LOOK and the features, not the phone proportions)
- `/Users/danemuller/Developer/BlipVibe/prototypes/reference/scrapbook-master-v2.png` — approved phone master
  (7 phones: Home, Skins, Profile, Groups, Post, Messages, Chat).
- `/Users/danemuller/Developer/BlipVibe/prototypes/reference/scrapbook-profile-master.webp` — profile close-up.
- `/Users/danemuller/Developer/BlipVibe/prototypes/reference/concept-post.png`, `concept-messages.png`,
  `concept-chat.png` (same folder) — post card, messages list, chat close-ups.
- Shipped art kit to reuse visually: `/Users/danemuller/Developer/BlipVibe/images/skins/scrapbook/assets/*.webp`
  (icons, tapes, stickers, polaroid timeline frame, avatar ring, nav bar, quests notepad, banner collage, background).

## Paint SIX desktop screens
Each is ONE landscape image of a desktop browser viewport, 1536x960 (16:10, = a 1440x900 screen), no browser chrome,
no phone frames. Save to `images/skins/scrapbook/desktop/` (repo-relative):

1. `desktop-home.png` — HOME.
   - Top bar across the full width (a long torn pink/cream paper strip with tape, the phone's navbar art widened):
     "BlipVibe" script wordmark at left, a paper search field "Search..." with magnifier, then the page tabs as
     paper tabs with the Scrapbook icons + labels: Home (active = rose paper tab), Groups, Skins, Network, Saved,
     Messages (badge 2), Notifications (badge 1); at right a music-note button, coin pill "3,209", round avatar.
   - Under the bar, a wide cover area: the 3 tilted polaroid cover photos (landscapes) taped across a ledger/map
     paper collage with flowers, and the round profile picture IN FRONT of them in its paper/avatar ring, next to a
     torn-paper name card: "Rion", bio "I'm cool . . . .", 35 Following / 21 Followers, "View Profile" button.
     (Home ALWAYS shows cover + profile picture + profile card.)
   - Below, three columns as paper pinned on the spread:
     LEFT (~300px): Daily Quests on a spiral notepad (React to 5 posts 3/5 +5, Send 3 messages 1/3 +10,
     Like 5 posts 4/5 +5, each with a coin and a pink progress bar), Coin Goal, a Photos card (a small grid of
     taped mini polaroids).
     CENTER (~640px): story circles row (Your Story +, 3 friends), "What are we posting today?" composer paper
     strip with photo/emoji buttons, tabs Following (active) / Discover / My Posts as paper tabs, then post cards:
     author row (avatar, name, date, ⋯), text, photo taped on layered paper, action row 👍 👎 💬 ↻ 👁 with counts.
     Show one post LIKED (solid rose thumb) and one DISLIKED (solid thumb-down) so both on-states show.
     RIGHT (~300px): "Featured Skin" card, "Earn Coins on BlipVibe" card (Daily Login +5, Post +5, Comment +2,
     Like +1 as paper chips), "People You May Know" (3 people with a + button), "Trending Groups" (3 groups).
2. `desktop-profile.png` — PROFILE (own). Same top bar (no tab active or Home). A big hero spread: the 3 polaroid
   cover/timeline photos large across the top with flowers and tape, the profile picture in front (camera badge),
   name "Rion" in script on a torn paper label, bio, 35 Following / 21 Followers, Edit Profile button with pencil.
   Below: left column = About + Photos polaroid grid; center = the person's posts (same post cards); right = the
   equipped skin card + Skins collection.
3. `desktop-messages.png` — MESSAGES with a chat OPEN. Two panes side by side on the spread: left (~400px) the
   conversation list (paper rows with avatar, name, last line, time, pink unread dot: LunaMae, PixelJay,
   CrystalCrew, NatureVibes, + 3 more), a search field and a compose (pencil) button; right = the open chat with
   LunaMae: header (avatar, name, phone, ⋯), torn-note bubbles (received cream on left, sent pink on right, times),
   a heart doodle, and the input bar (+, "Type a message...", emoji, rose send circle) at the bottom.
4. `desktop-groups.png` — GROUPS. Page title "Groups" in script, chips My Groups / Trending (active) / Discover,
   search + "+" create. A 3-column grid of group cards (cover photo taped on paper, name, members, Join button):
   Crystal Lovers 12.4K, Nature & Outdoors 8.1K, Gaming Vibes 24.9K, Anime World 18.3K, + 2 more.
   A right sidebar with "Your Groups" list.
5. `desktop-skins.png` — SKINS store. Title "Skins", coin pill, chips All / Aesthetic / Realistic / Scrapbook
   (active) / Animated, tabs Shop / My Skins. A 4-column grid of skin cards like the phone (picture on layered
   paper, name, price with coin): Scrapbook Journal (Equipped, check sticker), Witchcraft 300, Good Witch 300,
   Anime Blaze 300, Heaven's Light 300, Vaporwave 300, Blood Moon 300, Superhero 300.
6. `desktop-notifications.png` — NOTIFICATIONS with the SEARCH dropdown open. Notifications list as paper rows
   (avatar, "LunaMae liked your post", time, small post thumbnail), filter chips All / Likes / Comments / Follows,
   "Mark all read". The top-bar search field is focused with a paper dropdown under it showing results:
   People (2), Groups (1), Posts (1).

Also save `images/skins/scrapbook/desktop/_sheet.png`: the 6 screens in a 3x2 grid, small, labelled.

Rules: real readable English text exactly as given. Realistic placeholder photos are fine. Same Scrapbook icons
(hand-drawn ink doodle icons) as the phone. Nothing generic, nothing flat. Every screen clearly the same world.
