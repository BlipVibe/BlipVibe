# Scrapbook skin — master mockup vs. real app fields

The master mockup is the visual target. Where its text/fields differ from what BlipVibe
actually has, the build uses the real app's fields (checked against index.html / js/app.js).

## Matches the app (keep as-is)
- Daily quests: React to 5 posts (+5), Send 3 messages (+10), Like 5 posts (+5)
- Feed tabs: Following / Discover / My Posts
- Profile stats: Following / Followers
- Mobile bottom nav: Home / Groups / Skins / Network / Messages
  (Saved and Notification are hidden on mobile already)
- Header: logo, search, notification bell, music, coin balance, avatar

## Corrections
| Screen | Master shows | Real app has | Build uses |
|---|---|---|---|
| Post action bar | like · dislike · emoji · repost · views | like · dislike · react (emoji) · comment · share · view count | all six real actions (the master's emoji + views were RIGHT; only "repost" → share) |
| Groups tabs | My Groups · Trending · Discover | My Groups · Moderating · Joined · Discover | real four tabs |
| Skins grid | Scrapbook Journal (Free), Vintage Diary 500, Cottagecore Book 500, Y2K Sticker Book 750, Travel Journal 750 | 19 premium skins at 300 coins (Witchcraft … Heaven's Light) | the real premium skins + Scrapbook, at real prices |
| Skins filter tabs | All · Aesthetic · Realistic · Scrapbook · Animated | (new section — no existing tabs) | keep as the new category filter; each skin gets a category |
| Placeholder data | Rion, "I'm cool", 35/21, 3209 coins, LunaMae, PixelJay, Crystal Lovers 12.4K, dates | live user/profile/group/message data | live data, never hard-coded |

## Home feed — elements the master left out (real app order, top to bottom)
1. Stories bar (your story + friends' stories)
2. "What are we posting today?" composer (avatar + fake input → opens create-post)
3. Featured skin banner (when active)
4. Daily quest panel
5. Coin goal bar (when set)
6. Feed tabs Following / Discover / My Posts (Discover adds Popular / Newest sort)
7. Posts

## Fields for the remaining screens (sheet 2), from the live app
- **Network:** tabs Connections / Not Following Back / People You May Know
- **Notifications:** like, follow, reply, mention, message, post, image/video, cover/profile photo, skin/purchase, system, group
- **Search:** tabs People / Groups / Posts
- **Group page:** cover, name, members, join/leave; tabs Feed / Chat / Group Shop
- **Other user's profile:** cover + avatar, name, bio, stats; buttons Follow/Following, Message, Close Friend,
  Invite to Group, Mute, Block, Report; Photos card, posts feed, their equipped skin card
- **Feed post actions (all screens):** like, dislike, react (emoji), comment, share, view count
- **Comments:** like, dislike, react, reply, GIF, emoji (edit/delete on your own)
- **Create post:** text, camera/photo, emoji, GIF, poll, schedule
  - The character counter IS real (`#cpmCharCounter`) — keep it.
  - Invented by the concepts (omit unless the owner wants it added): a "Public"/audience picker — the app has a
    Close Friends *list* but no per-post audience setting.

## Unique-to-Scrapbook flourishes (not copied to other skins)
- Two polaroid photos behind the profile picture
- Pink gingham bow on the quest card, paper-heart stickers, washi tape, pressed flowers
- Spiral-bound quest card edge
