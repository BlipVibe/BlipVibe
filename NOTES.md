# My Notes

## Project Info
- **Name:** BlipVibe (formerly Dabble)
- **Repo:** https://github.com/BlipVibe/BlipVibe
- **Work folder:** `C:\Users\Jason\Desktop\Website`

## Workflow Rules
- **Always push** every commit to `origin main` immediately after committing
- **Always update this file** (`NOTES.md`) whenever something changes — new features, bug fixes, structural changes
- **Always update `changelog.json`** when adding features, fixing bugs, or making changes — this feeds the in-app Developer Updates viewer
- **Always commit** after each meaningful change (don't batch unrelated changes)
- Title this file "My Notes" — no "claude" in the filename
- When starting a new session, **read this file first** to understand the full project state
- Use concise but complete descriptions so any future session can pick up where this left off

## Tech Stack
- **Frontend:** Vanilla JS, single `index.html` shell, `js/app.js` (all logic), `css/style.css` (all styling)
- **Backend:** Supabase (PostgreSQL, Auth, Storage) via `js/supabase.js`
- **Routing:** Hash-based (`#home`, `#photos`, `#shop`, etc.) with localStorage fallback for mobile
- **State:** In-memory `state` object, persisted to localStorage + Supabase `skin_data` column
- **Styling:** CSS custom properties (`--primary`, `--card`, etc.), skin/theme system, premium skins with background images
- **Pill tab pattern:** `.search-tabs` container + `.search-tab` buttons — used in Skin Shop, My Skins, Group Shop, Created Albums, Saved Posts

## Saved Posts Page (updated 2026-02-19)
- **Restructured to pill tab system** — same `.search-tab` / `.search-tabs` as Skin Shop and Created Albums
- **"All" tab** (default) shows all saved posts across all folders
- Each folder = pill button with post count badge
- Delete folder via X icon on pill (same `.album-del-x` class), Favorites cannot be deleted
- Smooth fade/slide transition between folder tabs
- Unsaving a post updates pill count badges inline without full re-render
- "New Folder" button remains in page header (existing HTML)
- `_currentSavedTab` tracks active tab, `_renderSavedTabPosts()` renders content
- `_bindSavedPageEvents()` handles tab clicks + deletes, `_bindSavedPostEvents()` handles unsave + view more

## Mobile Bottom Nav Bar (added 2026-02-19)
- Nav links (`.nav-center`) pinned to bottom of screen on all mobile/tablet (≤768px breakpoint)
- Previously only applied at ≤640px (phones), now covers tablets too
- `position:fixed;bottom:0;` with safe-area-inset for iPhone notch
- All nav styles (metro, rail, mirror, dock, pill, etc.) properly handled
- Page padding-bottom set to 72px for bottom nav clearance
- Premium nav backgrounds apply to bottom bar
- Comment button visible on each nav link with icon + label

### Comment Modal Scroll Fix (2026-02-19)
- Added `overscroll-behavior:contain` to `.comment-modal-scroll` and `.comment-post-embed`
- Prevents background page from scrolling when scrolling inside comment popup on mobile/iOS

## Per-Photo Comments (added 2026-02-19)

### Overview
- Every photo in the lightbox viewer has its own comment thread
- **Desktop:** Comment panel displayed to the right of the photo (340px wide)
- **Mobile:** Tap comment button (bottom-right) to slide up a comment sheet from the bottom

### Database
```sql
-- photo_comments: id (UUID PK), photo_url (TEXT), post_id (FK posts), author_id (FK profiles),
--   content (TEXT), parent_comment_id (FK photo_comments), created_at
-- Indexed on photo_url and author_id
```

### Supabase Functions (js/supabase.js)
- `sbGetPhotoComments(photoUrl, sortBy)` — fetch comments for a photo URL
- `sbCreatePhotoComment(photoUrl, postId, authorId, content, parentId)` — add comment
- `sbDeletePhotoComment(commentId)` — delete comment
- `sbEditPhotoComment(commentId, content)` — edit comment content (added 2026-03-18)

### Lightbox Comment Features (updated 2026-03-18)
- **Full feature parity** with post comment modal:
  - Emoji picker button (opens emoji panel above input)
  - GIF search button (opens Klipy-powered GIF search modal)
  - @mention autocomplete (via `initMentionAutocomplete('lbCommentInput')`)
  - Comment likes and dislikes (toggle, same `likedComments`/`dislikedComments` state)
  - Edit button for own comments (repurposes input + post button in edit mode)
  - Delete button for own comments
  - Clickable @mention links (open user profile, close lightbox)
  - GIF comments rendered inline as images
  - `renderMentionsInText()` + `escapeHtmlNl()` applied to all comment text

### Lightbox Restructure
- New HTML: `.lightbox-layout` wraps `.lightbox-media` + `.lightbox-comments`
- `.lightbox-media` contains image, arrows, counter, and mobile comment toggle button
- `.lightbox-comments` has header, scrollable comment list, and input area
- Touch swipe confined to `.lightbox-media` (doesn't trigger on comment panel)
- Post ID passed through from feed posts for photo-post association
- `buildLbComment()` renders individual comments with reply/delete/like/dislike/edit buttons
- `loadPhotoComments()` called on show and photo navigation
- Escape key closes comment panel first (if open), then lightbox

### Mobile Behavior
- `.lightbox-comment-toggle` button visible only on mobile (≤768px)
- Comment panel slides up from bottom with `transform:translateY` transition
- `.lb-open` class toggles the panel
- Close button in comment panel header dismisses it
- Panel has `max-height:70vh`, rounded top corners

### Migration
- Run `supabase/add-photo-comments.sql` in Supabase SQL Editor

## Per-Photo Likes/Dislikes (added 2026-02-19)

### Overview
- Like and dislike buttons in the lightbox bottom bar for every photo
- Optimistic UI — instant visual feedback, reverts on error
- Toggle: tap same reaction to remove it, tap opposite to switch

### Database
```sql
-- photo_likes: id (UUID PK), photo_url (TEXT), user_id (FK profiles),
--   reaction TEXT ('like' or 'dislike'), created_at
-- UNIQUE(photo_url, user_id) — one reaction per user per photo
```

### Supabase Functions (js/supabase.js)
- `sbTogglePhotoReaction(photoUrl, userId, reaction)` — insert/switch/remove
- `sbGetPhotoReactionCounts(photoUrl)` — returns `{likes, dislikes}`
- `sbGetUserPhotoReaction(photoUrl, userId)` — returns user's current reaction or null

### UI
- `.lightbox-bar` at bottom of `.lightbox-media` — gradient overlay for readability
- Contains: counter, like button, dislike button, comment toggle (mobile)
- Active like = primary color + filled icon, active dislike = red + filled icon
- Counts update instantly on click

### Migration
- Run `supabase/add-photo-likes.sql` in Supabase SQL Editor

## Coin System Fix (2026-02-19)
- **No coins for interacting with your own content**
- `isOwnPost(postId)` helper checks if post belongs to current user via `feedPosts`
- Covers: post likes/dislikes (feed, profile view, groups), comment likes/dislikes (modal + inline), commenting/replying on own posts
- `data-aid` attribute added to comment like/dislike buttons for author-level checking
- You can still like/dislike your own stuff — it just won't award coins

## Polls in Posts (added 2026-03-18)
- Poll button in post creation footer — toggle to show/hide poll options
- 2-6 text options, validated on publish (must have at least 2)
- Poll data stored as `[poll]{...}[/poll]` tag in post content
- `renderPollInPost(text, postId)` extracts poll JSON and renders vote buttons or results
- Votes stored in `localStorage` per post per device (`blipvibe_poll_*`, `blipvibe_pollvotes_*`)
- After voting: animated progress bars with percentages, highlighted user's choice
- `bindPollVotes()` handles click → save vote → re-render inline
- CSS: `.poll-container`, `.poll-option`, `.poll-vote-btn`, `.poll-bar`, `.poll-voted`, `.poll-my-vote`

## Hashtags (added 2026-03-18)
- `#tag` patterns in posts/comments now rendered as clickable links (`.hashtag-link`)
- Added to `renderMentionsInText()` — processes both @mentions and #hashtags
- `bindHashtagClicks()` attached in feed, profile posts, group posts, comments, search, saved posts
- `showHashtagFeed(tag)` opens modal showing all posts containing that hashtag
- CSS: `.hashtag-link` styled like mentions (primary color, bold, pointer)

## Copy Link to Post (added 2026-03-18)
- "Copy Link" option in post dropdown menu
- `copyPostLink(pid)` generates URL as `{origin}{path}#post/{postId}`
- Uses `navigator.clipboard.writeText` with `execCommand('copy')` fallback
- Shows toast confirmation

## Pin Posts to Profile (added 2026-03-18)
- "Pin to Profile" / "Unpin" option in own post dropdown menu
- Max 3 pinned posts, stored in `state.pinnedPosts` (saved to localStorage + Supabase skin_data)
- `togglePinPost(pid)` manages pin state with limit enforcement

## Mute Users (added 2026-03-18)
- "Mute" button on profile view (separate from Block)
- `mutedUsers` object stored in localStorage (`blipvibe_muted`)
- `muteUser()` / `unmuteUser()` with confirmation modal
- Muted users filtered from Following and Discover feed tabs
- Unlike blocking: doesn't unfollow, doesn't remove from groups — just hides their posts

## Report Users (added 2026-03-18)
- "Report" button on profile view for non-self users
- `showReportUserModal(person)` — modal with reasons: Spam, Harassment, Impersonation, Inappropriate Content, Other
- Reports stored alongside post reports via `reportedPosts` array
- Separate from post reporting (includes `type:'user'` and `userId` fields)

## Edit Profile from Profile View (added 2026-03-18)
- "Edit Profile" button shown on own profile view card
- Opens `showMyProfileModal()` directly — eliminates Settings → Edit Profile navigation

## Escape Key Closes Modals (fixed 2026-03-18)
- `keydown` listener for Escape key added globally
- Closes any open modal (same as clicking the X button)

## Performance & Stability Fixes (2026-03-18)

### initApp() Parallelization
- **Before:** 15-25 sequential API calls on every page load (3-8 second waterfall)
- **After:** 7 independent calls run concurrently via `Promise.allSettled()`: post likes, comment likes, avatar history, cover history, user posts, follow counts, friends-of-friends
- Estimated **50-70% reduction** in page load time

### N+1 Group Membership Fix
- **Before:** `initApp()` looped through every group calling `sbGetGroupMembers(groupId)` individually to check if user was a member — potentially 50+ queries
- **After:** Single `sbGetUserGroupIds(userId)` query returns all group IDs the user belongs to (1 query)
- New function in supabase.js: `sbGetUserGroupIds(userId)` — queries `group_members` table filtered by `user_id`

### Realtime Subscription Cleanup
- All 5 realtime channels (posts, follows, likes, notifications, messages) now stored in `_realtimeSubs` array
- `handleLogout()` calls `sb.removeChannel()` on all stored subscriptions
- Prevents duplicate WebSocket listeners accumulating on re-login

### saveState Interval Cleanup
- `setInterval(saveState, 10000)` now stored in `_saveStateInterval` variable
- Cleared on logout via `clearInterval(_saveStateInterval)`
- Prevents orphaned timer writing state for wrong user after logout

### XSS Fix — Error Messages
- `e.message` in `innerHTML` contexts now wrapped with `escapeHtml()`
- Prevents potential XSS via crafted Supabase error messages

## Comment Modal Image Auto-Fit (fixed 2026-03-18)
- **Cause:** `.comment-post-embed` had `overflow-y:auto` and images inside could be any height, making the post preview scrollable
- **Fix:** Changed to `overflow:hidden`, added `max-height:25vh` with `object-fit:contain` on images so they scale down to fit without scrolling

## @Mention Dropdown Direction Fix (fixed 2026-03-18)
- **Cause:** Dropdown always appeared above the input (used `bottom` positioning), which was wrong for comment/post modals where input is in the middle of the screen
- **Fix:** Smart positioning — if input is in the bottom half of the viewport, dropdown appears above; if in the top half, dropdown appears below
- Box shadow direction also adapts

## Bug Fixes

### Tablet/iPad swipe jumping to wrong category (fixed 2026-02-19)
- **Cause:** Swipe-to-switch-tab handlers on Skin Shop, My Skins, Group Shop, and Group View fired on any horizontal swipe > 50px, conflicting with scrolling through cards in `.shop-scroll-row`
- **Fix:** Removed all four swipe-to-switch handlers — tabs are easily tappable, the gesture caused more harm than good on wider screens
- Affected: `renderShop()`, `renderMySkins()`, `renderGroupShop()`, `showGroupView()`

### Groups page defaults to My Groups tab (fixed 2026-02-19)
- `navigateTo('groups')` now resets `currentGroupTab='yours'` before rendering
- Falls back to first available tab if user has no created groups

### Mobile refresh goes to home screen (fixed 2026-02-19)
- **Cause:** iOS Safari / mobile browsers can lose URL hash on refresh, pull-to-refresh, or memory-pressure tab reload
- **Fix:** `navigateTo()` now saves current page to `localStorage` key `blipvibe_lastPage`. Three fallback points read it when hash is empty/home:
  1. Inline `index.html` flash-prevention script
  2. `history.replaceState` init (top-level code)
  3. `initApp()` hash-based navigation
- Cleared on logout (`localStorage.removeItem`) to prevent cross-account leakage

### Photos disappearing on reload (fixed 2026-02-19)
- **Cause:** `navigateTo('photos')` called `renderPhotoAlbum()` before Supabase photo data finished loading (race condition in `initApp`)
- **Fix:** After photo loading completes (line ~337), check if `_navCurrent==='photos'` and re-render the photos page
- Only affects users who reload while already on the `#photos` page

### Cross-device sync not working on mobile (fixed 2026-02-19)
- **Cause:** `syncSkinDataToSupabase()` uses a 2s debounce, and `beforeunload` is unreliable on mobile (iOS Safari doesn't always fire it when switching/closing tabs)
- **Fix:** Added `visibilitychange` event listener with two-way sync:
  - **Page hidden** → immediately push settings to Supabase (replaces unreliable `beforeunload`)
  - **Page visible** → pull latest settings from Supabase + `reapplyCustomizations()` (picks up changes from other devices)
- Covers: skins, fonts, nav styles, templates, logos, icon sets, coin skins, premium backgrounds, settings, etc.

### Saved posts not showing up (fixed 2026-02-19)
- **Cause:** Saved posts page looked up post IDs in `feedPosts` (only the last 50 feed posts). Any saved post not in the current feed was silently skipped.
- **Fix:** `renderSavedPage()` now async — collects all saved post IDs, fetches any missing ones from Supabase via `sbGetPostsByIds()`, caches in `_savedPostCache`
- `_renderSavedTabPosts()` checks both `feedPosts` and `_savedPostCache`
- Also fixed null badge crash in `renderSavedPostCard` and improved timestamps to use real `created_at` dates

### Premium transparency bleeding into group view (fixed 2026-02-19)
- **Cause:** When entering a group, only the premium bg layer div was hidden but `has-premium-bg` class and `--card-opacity` CSS variable remained on the body, causing card transparency to affect navbar and other elements
- **Fix:** Fully reset `premiumBgImage`/overlay/darkness/transparency to defaults and call `updatePremiumBg()` to properly remove all premium bg state when entering group view. Personal settings restored from `_gvSaved` when leaving.

### Group rules moved to modal (2026-02-19)
- Rules no longer displayed inline in the right sidebar
- "Group Rules" button in right sidebar opens a modal
- **Non-owners:** read-only numbered list of rules
- **Owners:** editable inputs with add/delete/save (same as before, just in the modal)
- Members preview card remains in the sidebar below the rules button

### Group skins bleeding between groups (fixed 2026-02-19)
- **Cause:** No explicit reset of body-level skin state (CSS vars, theme vars) between groups.
- **Fix:** `applyGroupSkin()` now does a complete body-level reset before applying each group's skin: removes ALL skin/premium classes from body, resets CSS variables to defaults, resets theme vars.

### Guild skins removed (2026-02-19)
- Emptied `guildSkins` array and removed all guild skin data (colors, backgrounds, banners)
- Removed guild shop tab, buy/apply handlers, and all references
- Groups now only use basic skins and premium skins

### Premium nav transparency fix (2026-02-19)
- Added `nav-split` to the list of nav styles that get explicit `--ps-nav` backgrounds when premium skins are active (alongside dock, pill, island)
- Premium bg state is fully reset in group view to prevent card transparency bleeding into nav

### Mobile group view fixes (fixed 2026-02-19)
- **Group profile pic not centered:** Added `margin:0 auto` to `.gv-icon-wrap` so icon-based group avatars center on all screen sizes
- **Rules+members buried after posts on mobile:** Added `.gv-mobile-right` container inside `gv-center` (between profile card and post bar). On ≤768px, `.gv-right` is hidden and `.gv-mobile-right` shown instead. Rules button + members preview now appear right after the profile card on phones.
- Both rules buttons share `.gv-rules-btn` class; members previews share `.gv-members-preview` class for unified event binding

## Report / Feedback (added 2026-02-19)
- **Settings → Report / Feedback → Send** button opens a modal with Subject + Message fields
- Submit opens `mailto:hello@blipvibe.com` with pre-filled subject and body
- Validates that at least one field is filled before opening mail client
- `_showFeedbackModal()` function in app.js

## Album System (added 2026-02-19)

### Schema
```sql
-- albums: id (UUID PK), user_id (FK profiles), title (TEXT), created_at
-- album_photos: id (UUID PK), album_id (FK albums), photo_url (TEXT), created_at
-- UNIQUE constraint on (album_id, photo_url) prevents duplicates
-- Photos stay in posts table — album_photos just references URLs
```

### Supabase Functions (js/supabase.js)
- `sbGetAlbums(userId)` — returns albums with nested album_photos for any user
- `sbCreateAlbum(userId, title)` — creates album, returns row
- `sbDeleteAlbum(albumId)` — cascade deletes album + photos
- `sbRenameAlbum(albumId, title)` — updates title
- `sbAddPhotoToAlbum(albumId, photoUrl)` — upsert (no duplicate error)
- `sbRemovePhotoFromAlbum(albumPhotoId)` — deletes junction row

### RLS Policies
- Albums + album_photos: public SELECT, owner-only INSERT/UPDATE/DELETE
- album_photos INSERT/DELETE checks album ownership via subquery

### Profile View Changes
- Albums tab shown for ALL users (own + others), not just isMe
- `_pvAlbums` loaded via `sbGetAlbums(userId)` on profile load
- `_pvPostPhotos` loaded from Supabase posts for other users
- Default tab changed to "Albums" (was "Photos")

### Album Cards (profile sidebar)
- Cover image = first photo in album
- Shows title + photo count
- Click opens album view modal
- Drag photo onto card → inserts album_photos record (no duplication)
- Visual hover feedback: border highlight + slight scale

### Photo "..." Menu (updated 2026-02-19)
- **All photos on My Photos page** (profile, cover, post) have "..." overlay button (top-right, visible on hover)
- Options: "Add to Album" (opens album selector modal)
- Album tab photos show "Remove from Album" instead
- Album selector lists all user's albums, with "Create New Album" option
- Adding/removing photos auto-refreshes album tab content inline (no full page re-render)
- `_bindPhotoAlbumMenus()` helper binds menu buttons, re-called on album tab switch
- Old drag-and-drop onto album cards removed (album cards replaced by pill tabs)

### Upload Photos to Albums (added 2026-02-19)
- Each album tab shows an **"Upload Photos"** button above the photo grid
- Opens multi-file picker (`accept="image/*" multiple`)
- Uploads to Supabase Storage via `sbUploadPostImage`, then adds URL to album via `sbAddPhotoToAlbum`
- Shows spinner during upload, auto-refreshes album content on completion
- `_bindAlbumUpload()` helper binds upload button, re-called on tab switch and content refresh

### Layout (updated 2026-02-19)
- Albums tab appears FIRST (left) in the tabs, Photos tab second
- **My Photos page section order:** Profile Pictures → Cover Photos → Created Albums → Post Photos
- Old album card grid (horizontal scroll of cover images) removed
- **Created Albums uses pill tab system** — same `.search-tab` / `.search-tabs` classes as Skin Shop
  - Each pill = album name, click to show that album's photos below
  - Horizontal overflow scroll with drag-scroll on tab row
  - Active pill uses primary accent color
  - Small X icon on each pill for individual album deletion
  - Create + Delete All buttons in section header
- **Album photos display in 2-row horizontal scroll grid**
  - 150px photos (130px tablet, 120px mobile)
  - Drag-scroll + shift+scroll on desktop, native touch on mobile
  - Smooth fade/slide transition (0.25s) when switching album tabs
  - Empty state: "No albums created yet." / "No photos in this album."
- CSS classes added: `.album-photo-scroll`, `.album-del-x`, `#albumTabContent` transition
- JS helpers added: `_renderAlbumTabPhotos()`, `_bindAlbumPhotoScroll()`, `currentAlbumTab` state var

### Migration
- Run `supabase/add-albums.sql` in Supabase SQL Editor for existing deployments
- Full schema also updated in `supabase/schema.sql`

## My Posts Feed Tab (added 2026-02-23)
- New **"My Posts"** pill tab added to the main feed alongside Following and Discover
- Filters `feedPosts` to show only posts where `person.id === currentUser.id`
- Icon: `fa-user`, empty state: "You haven't posted anything yet!"
- No database changes — purely client-side filtering of already-loaded feed data
- Tab button in `index.html` `#feedTabs`, filter logic in `renderFeed()` in `app.js`

## Inline Media Embeds (added 2026-02-23, updated 2026-02-23)
- Media URLs in posts, messages, and comments embed inline instead of opening in a new tab
- All embeds use **official embed methods** from each platform (no unofficial/internal endpoints)
- **YouTube** (watch, shorts, embed, youtu.be) → official `/embed/` iframe
- **Vimeo** → official `player.vimeo.com` iframe
- **TikTok** (`tiktok.com/@user/video/ID`) → official blockquote + `embed.js` SDK
- **Twitter/X** (`twitter.com` or `x.com` status URLs) → official blockquote + `widgets.js` SDK
- **Instagram** (posts, reels, TV) → official blockquote + `embed.js` SDK (no API key needed for this method)
- **Spotify** (tracks, albums, playlists, episodes, shows) → official `/embed/` iframe
- **SoundCloud** (any track/set URL) → official widget player iframe
- **Direct video files** (.mp4, .webm, .ogg) → native HTML5 `<video>` element with controls
- Third-party embed scripts (TikTok, Twitter, Instagram) load once and re-render via `_reloadThirdPartyEmbeds(url)`
- `getVideoEmbedHtml(url, mini)` helper returns embed HTML or null for non-embeddable URLs
- Integrated into `autoFetchLinkPreviews()` (feed), `autoFetchLinkPreviewsMini()` (messages/comments), and post creation link preview
- Mini embeds (messages/comments) use smaller heights for all platforms
- CSS: `.video-embed` / `.video-embed-mini` in style.css
- Raw URL is hidden from post text when embed is shown (same as link previews)
- No database changes — purely client-side rendering using official embed endpoints
- Covered in TOS section 3 (Embedded & Third-Party Media): BlipVibe uses official embed tools, does not host/redistribute third-party content

## Updated Terms of Use & TOS Acceptance System (added 2026-02-23)

### TOS Content Update (v3 — Feb 23 2026)
- Expanded from 12 sections to 19 sections
- New sections: Eligibility & Age Requirement (13+ / COPPA), Virtual Currency (Coins), Direct Messages (not E2E encrypted), Location Features (opt-in), expanded Privacy & Data (all data categories + third-party services disclosed), Dispute Resolution (binding arbitration, class action waiver), Governing Law, Changes to Terms
- Content license now ends when user deletes content/account
- Liability cap added ($100 USD)
- Account deletion contact added (hello@blipvibe.com)
- Third-party tracking disclosure added for embedded media
- Both signup form and splash modal contain identical terms

### Code Changes for Legal Compliance
- YouTube embeds switched to `youtube-nocookie.com` (privacy-enhanced mode, reduces Google tracking)
- Location sharing changed from **opt-out** to **opt-in** (default `showLocation: false`)

### Version-Based Acceptance System
- `TOS_VERSION` constant in app.js — bump this number whenever TOS changes to force all users to re-accept
- Current version: `3` (Feb 23 2026 comprehensive update)
- **New signups:** Accept via checkbox during signup, version stored to localStorage + skin_data immediately
- **Existing users:** On login/page load, `checkTosAccepted()` runs in `initApp()` after loading skin_data
  - If TOS not accepted (or older version), full-screen modal shown with scrollable terms
  - "I Agree" → stores acceptance to localStorage + Supabase `skin_data.tosAcceptedVersion`
  - "Decline" → immediately logged out via `handleLogout()`
  - Modal is blocking — user cannot interact with the app until they accept
- Acceptance persists cross-device via `skin_data.tosAcceptedVersion` in Supabase
- localStorage fallback: `blipvibe_tos_v_<userId>` for instant local checks
- `_buildSkinData()` includes `tosAcceptedVersion` field for sync
- CSS: `.tos-splash-overlay` / `.tos-splash-modal` / `.tos-splash-scroll` in style.css

## Cookie Consent Banner (added 2026-02-23, updated 2026-02-23)
- `_cookieConsent` variable gates ALL third-party embed scripts and iframes
- Banner shows at bottom of screen via `showCookieConsent()` called in `initApp()`
- "Accept All" sets `_cookieConsent=true` + saves to localStorage, reloads page to activate embeds
- "Essential Only" dismisses banner without enabling third-party scripts
- **All embeds gated:** TikTok, Twitter, Instagram script loaders + YouTube, Vimeo, Spotify, SoundCloud iframes
- Blocked embeds show `_embedConsentPlaceholder()` with "Allow & Load" button
- **Manage Cookies in Settings:** Shows current consent status, click to toggle accept/revoke + page reload
- Delegated click handler on `.embed-consent-btn` calls `grantCookieConsent()` + reload
- CSS: `#cookieConsentBanner` / `.cookie-banner-inner` / `.cookie-banner-btns`

## Delete My Account (added 2026-02-23, updated 2026-02-23)
- Red "Delete My Account" button in Settings modal (below blocked users, above Done)
- Double confirmation: first modal warns about permanent deletion, second "Delete Forever" button
- `sbDeleteAccount()` now: (1) cleans up storage files (avatars + posts buckets), (2) calls `delete_own_account` SECURITY DEFINER RPC to delete profile + auth.users, (3) falls back to client-side profile delete if RPC not deployed, (4) signs out
- `profiles_delete` RLS policy added to allow users to delete their own profile row
- Profile has `ON DELETE CASCADE` from `auth.users` so all posts, comments, likes, follows, notifications, albums cascade

## Profile RLS Fix (added 2026-02-23)
- **SQL migration:** `supabase/fix-profile-rls.sql`
- Revokes SELECT on `skin_data`, `birthday`, `email` columns from `authenticated` and `anon` roles
- Creates `get_own_profile()` SECURITY DEFINER RPC that returns the current user's full profile as JSONB
- **Client changes:** `sbGetOwnProfile()` added to supabase.js (calls the RPC), used in `initApp()` for loading own profile
- `sbUpdateProfile()` no longer calls `.select()` after update (avoids reading revoked columns)
- Other users' profiles fetched via `sbGetProfile()` simply won't include sensitive columns (PostgREST skips them)
- **Action required:** Run `supabase/fix-profile-rls.sql` in Supabase SQL Editor

## Embedded Video Link Hiding (updated 2026-02-23)
- When a video/media embed is rendered, the raw URL text is stripped from the post
- `autoFetchLinkPreviews()` and `autoFetchLinkPreviewsMini()` already strip URLs via regex replacement
- Post creation flow now also strips `linkUrl` from display text when an embed is used (line ~4137 in app.js)

## People You May Know Fix (updated 2026-02-23)
- Moved suggestions card from left-sidebar to right-sidebar in index.html
- Every template's CSS had `.left-sidebar .suggestions-card{display:none}` — all 17 removed
- Now shows in the right sidebar for all templates that display the right sidebar
- Templates that hide right-sidebar entirely (duo, focus, wing) naturally won't show it — these are minimal layouts by design

## XSS Sanitization (added 2026-02-23)
- `escapeHtml()` function added (escapes `& < > " '`) — applied to 45+ user-content injection points
- Covers: post content, display names, bios, comment text, message content, group names/descriptions, notification text, link preview titles, album titles, profile cards, shared post content, location badges
- `autoFetchLinkPreviews()` URL replacement uses `escapeHtml(url)` for innerHTML matching (handles `&amp;` encoding)

## Geolocation Opt-In Fix (added 2026-02-23)
- `detectUserLocation()` now only fires when `settings.showLocation` is true (was firing unconditionally)

## Legal & Compliance Updates (added 2026-02-23)
- **Privacy Policy:** Added GDPR section (Section 11) — legal basis for processing, EEA user rights, breach notification (72hr), international transfer basis. Renumbered subsequent sections.
- **TOS:** Added indemnification (Section 17), severability (Section 19) clauses. Governing law now names **State of Tennessee** (Fayette County venue) specifically. Renumbered to 21 sections total.
- **Search injection fix:** `sbSearchProfiles()` now sanitizes query by stripping PostgREST filter-injection characters (`,`, `(`, `)`, `.`) before use in `.or()` filter

## Super Admin Panel (added 2026-02-23)

### Overview
- Admin users can view all users, suspend/unsuspend accounts, and permanently delete user accounts
- All admin actions enforced **server-side** via SECURITY DEFINER functions that check `is_admin` flag
- Client-side `_isAdmin` flag only controls UI visibility — cannot be spoofed to bypass server checks

### Database
- `is_admin BOOLEAN DEFAULT false` column on `profiles` — set manually in Supabase dashboard or SQL
- `is_suspended BOOLEAN DEFAULT false` column on `profiles` — toggled by admin functions
- `REVOKE UPDATE (is_admin)` from `authenticated`/`anon` — prevents privilege escalation from client
- **SQL migration:** `supabase/admin-setup.sql`

### RPC Functions (SECURITY DEFINER, all check is_admin)
- `is_current_user_admin()` → returns boolean (lightweight UI check)
- `admin_get_users(search_query, page_size, page_offset)` → returns JSONB array with user info + post counts
- `admin_user_count(search_query)` → returns total matching user count for pagination
- `admin_delete_user(target_id)` → deletes profile (cascade) + auth.users record. Cannot delete other admins.
- `admin_toggle_suspend(target_id)` → toggles `is_suspended`, returns new status. Cannot suspend admins.

### Supabase Client Functions (js/supabase.js)
- `sbIsAdmin()` — calls `is_current_user_admin` RPC
- `sbAdminGetUsers(search, pageSize, pageOffset)` — calls `admin_get_users` RPC
- `sbAdminUserCount(search)` — calls `admin_user_count` RPC
- `sbAdminDeleteUser(targetId)` — calls `admin_delete_user` RPC
- `sbAdminToggleSuspend(targetId)` — calls `admin_toggle_suspend` RPC

### UI (js/app.js + index.html)
- **Admin Panel page** (`#page-admin`): searchable, paginated user table with avatar, name, email, posts, joined date, status badges
- **Dropdown link** (`#dropdownAdmin`): hidden by default, shown via `sbIsAdmin()` check in `initApp()`
- **Profile view buttons**: Admin users see Suspend + Delete buttons below the block button when viewing other users' profiles
- **Confirmation modals**: Both suspend and delete require confirmation before executing
- **Safety**: Cannot delete or suspend other admin accounts (server-side check)
- **Action required:** Run `supabase/admin-setup.sql` then set yourself as admin: `UPDATE public.profiles SET is_admin = true WHERE username = 'your_username';`

## Video Embed Aspect Ratio Fix (updated 2026-02-23)
- YouTube and Vimeo iframes were stretching tall because of fixed `height` attribute + 100% width
- Changed `.video-embed` CSS to use `aspect-ratio: 16/9` with `max-width: 560px`
- Iframes now positioned absolutely within the aspect-ratio container
- Removed inline `width`/`height`/`style` from YouTube and Vimeo iframe HTML in app.js
- Mini embeds capped at `max-width: 360px`

## Social Embed Class Split (updated 2026-02-23)
- `.video-embed` (16:9 aspect-ratio, absolute positioning) for YouTube, Vimeo, direct video
- `.social-embed` (natural sizing, no forced aspect ratio) for Instagram, TikTok, Twitter, Spotify, SoundCloud
- Instagram switched from blockquote + embed.js SDK to direct `/embed/captioned/` iframe for reliable mobile playback
- Cookie consent gating added for Instagram iframe

## Suggestion Name Overflow Fix (updated 2026-02-23)
- `.suggestion-info` gets `overflow:hidden`
- `.suggestion-info h4` and `.suggestion-info p` get `white-space:nowrap;overflow:hidden;text-overflow:ellipsis`
- Prevents long display names from cutting into neighboring suggestion cards

## Newline Preservation (added 2026-02-23)
- `escapeHtmlNl()` function converts `\n` to `<br>` after HTML-escaping
- Applied to all multiline content: feed posts, search results, profile view posts, group posts, comment modal text, inline comments + replies, messages, shared post text, new post creation display, saved posts

## Full Legal & Security Audit (completed 2026-02-23)

### Overall Risk: LOW-MODERATE (safe for public repo)

### 1. API Keys & Secrets
- **Only key in codebase:** Supabase anon/publishable key (`sb_publishable_...`) in `supabase.js:7-8` — designed to be public, gated by RLS
- **No service_role key** found anywhere (searched `service_role`, `SERVICE_ROLE`, `eyJ...` JWT prefix pattern)
- **No `.env` files**, no `config.json`, no private keys, no hardcoded passwords, no bearer tokens
- `schema.sql:454` has a comment mentioning service_role as a future recommendation — no actual key

### 2. Copyrighted Third-Party Code
- **None found** — entire codebase (app.js, supabase.js, style.css, index.html) is original hand-written code
- No vendor-bundled libraries, no minified third-party JS included locally

### 3. Licensed Assets
- **Font Awesome 6.5.1** (CDN) — SIL OFL icons / MIT code — free for commercial use, no attribution required
- **Google Fonts** (CDN) — SIL Open Font License — free for commercial use
- **SVG images** (premium-*.svg, default-avatar.svg, logo) — original BlipVibe branding
- No stock photos or third-party images requiring attribution

### 4. External Libraries
- **@supabase/supabase-js@2** (jsdelivr CDN) — MIT license
- **Font Awesome 6.5.1** (cdnjs CDN) — MIT / SIL OFL
- **Google Fonts** — SIL OFL
- No GPL, AGPL, or copyleft libraries used

### 5. Third-Party Embed TOS Compliance
- YouTube (privacy-enhanced `youtube-nocookie.com`) — compliant
- Vimeo, TikTok, Twitter/X, Instagram, Spotify, SoundCloud — all use official embed methods
- **Microlink** (link previews, `api.microlink.io`) — free tier, 100 req/day limit; monitor usage at scale
- **FormSubmit.co** (feedback form) — free tier AJAX, no API key needed
- All embeds gated behind cookie consent — GDPR compliant

### 6. Scraping / External Requests
- **No scraping** — all external data via official APIs/embeds
- **Nominatim** (OpenStreetMap reverse geocoding, `app.js:937`) — low-volume browser-side requests are acceptable; at scale, consider paid geocoding
- **Recommended:** Add OpenStreetMap attribution text somewhere visible (e.g., footer) per OSM license

### 7. Attribution Requirements
- All CDN libraries (MIT/SIL OFL) used via standard CDN links — no attribution legally required
- **OpenStreetMap:** Should add "Map data from OpenStreetMap contributors" attribution per their terms
- No other missing attributions

### 8. Personal Data Exposure
- Sensitive columns (email, birthday, skin_data) revoked from client SELECT via SQL migration
- Own profile data accessed via SECURITY DEFINER RPC (`get_own_profile`)
- Admin functions enforced server-side with `is_admin` check
- `is_admin` column cannot be set by client (REVOKE UPDATE)
- XSS sanitization (`escapeHtml`) on 45+ user-content injection points
- Search query injection prevention (PostgREST filter chars stripped)
- DMs not E2E encrypted — disclosed in TOS + Privacy Policy
- Storage images publicly accessible by URL — disclosed in Privacy Policy

### Action Items
1. Add OpenStreetMap attribution text (required by OSM license)
2. Verify both SQL migrations deployed (`fix-profile-rls.sql` + `admin-setup.sql`)
3. Monitor Microlink free tier usage — upgrade or self-host if traffic grows

### Reference Document
- Full legal coverage summary: `LEGAL-COVERAGE.txt` (covers all 21 TOS sections, 14 Privacy Policy sections, technical security measures, SQL migrations)

## Security Hardening Phase 2 (added 2026-02-23)

### Rate Limiting
- **Auth (login/signup/password reset):** Frontend cooldown helper `checkCooldown(key, ms)` prevents rapid-fire attempts (3s login, 5s signup, 10s reset). HTTP 429 / "rate" error messages caught and shown as friendly toast.
- **Direct messages:** Server-side RPC `send_message_ratelimited` — counts messages by sender in last 60s, rejects if >= 30. `sbSendMessage()` now calls this RPC instead of direct insert.
- **Post creation:** 5-second frontend cooldown via `checkCooldown('post', 5000)` in publish handler. Defense-in-depth alongside Supabase's own API rate limiting.

### File Upload Hardening
- `validateUploadFile(file, opts)` in supabase.js — MIME whitelist (JPEG, PNG, WebP, GIF), blocks SVG/HTML/JS, configurable size limit, extension-MIME match validation
- Applied to: `sbUploadAvatar` (5MB), `sbUploadCover` (5MB), `sbUploadPostImage` (10MB), premium background upload (5MB), message image send (10MB)
- Errors shown via `showToast()` or caught by existing try/catch blocks

### Admin Action Logging
- `admin_logs` table: id, admin_id, target_user_id, action, details (JSONB), created_at
- RLS: SELECT for admins only, no client INSERT/UPDATE/DELETE (logging done inside SECURITY DEFINER RPCs)
- `admin_delete_user` logs BEFORE delete (preserves FK), `admin_toggle_suspend` logs AFTER toggle
- `admin_get_logs(p_limit, p_offset)` RPC returns logs with admin/target usernames via JOINs
- Admin panel UI: log table shown below user list with date, admin, action, target columns

### RLS Gap Fixes
- `notifications` DELETE: `auth.uid() = user_id`
- `messages` DELETE: `auth.uid() = sender_id`
- `user_skins` DELETE: `auth.uid() = user_id`
- `group_skins` DELETE: owner check via groups subquery
- `storage.objects` (posts bucket) DELETE: authenticated users

### Search Injection Hardening
- `search_profiles(p_query, p_limit)` SECURITY DEFINER RPC — uses `ILIKE` with parameterized `v_pattern` variable (no string interpolation)
- `sbSearchProfiles()` now calls this RPC instead of using `.or()` string interpolation
- Sanitizes LIKE wildcards (`%`, `_`, `\`) server-side

### SQL Migration
- **File:** `supabase/security-hardening-phase2.sql` — self-contained (includes prerequisite column additions), safe to run standalone
- Contains: send_message_ratelimited RPC, admin_logs table + RLS, modified admin RPCs, admin_get_logs RPC, RLS gap fixes, search_profiles RPC

## Video Auto-Play / Pause on Scroll (added 2026-02-23)

### Overview
- Videos automatically **pause** when scrolled out of view (>75% off-screen)
- HTML5 `<video>` elements resume (muted) when scrolled back into view
- YouTube and Vimeo iframes auto-pause via postMessage API when scrolled away (user must click play to restart)
- Prevents multiple videos playing simultaneously when scrolling through feed

### Implementation
- `IntersectionObserver` with 25% threshold watches `.video-embed` containers and standalone `<video>` elements
- `MutationObserver` automatically picks up new embeds as they're dynamically added to the DOM
- YouTube iframes get `?enablejsapi=1` for postMessage control
- Vimeo iframes get `?api=1` for postMessage control
- `data-vobs` attribute marks elements already being observed (prevents duplicate observers)
- `data-was-playing` tracks whether a video was playing before being paused by scroll (only resumes if it was)
- Also observes `.social-embed` containers (Instagram, TikTok, Spotify, SoundCloud)
- Iframes without postMessage API paused by blanking `src`, restored on scroll-back
- No database changes — purely client-side behavior

## Developer Updates / Changelog Viewer (added 2026-02-23)

### Overview
- "Developer Updates" button in Settings modal opens a changelog viewer
- Shows version history with date, version number, and collapsible details
- Each entry has Added / Changed / Fixed sections (accordion style)
- Newest entry at top with "NEW" badge
- Only one entry expanded at a time, smooth expand/collapse animation

### Data Source
- `changelog.json` in project root — simple JSON array, no DB needed
- Fetched once and cached in `_changelogData` for the session
- **Workflow rule:** Update `changelog.json` alongside `NOTES.md` when making changes

### Format
```json
{
  "version": "0.2.5",
  "date": "2026-02-23",
  "added": ["..."],
  "changed": ["..."],
  "fixed": ["..."]
}
```

### UI
- Chevron icon rotates on expand/collapse
- Color-coded sections: green (Added), amber (Changed), blue (Fixed)
- Consistent with existing modal styling
- `showDevUpdatesModal()` function in app.js

## Group Bug Fixes (v0.2.6 — 2026-02-23)

### Group photos disappearing (fixed)
- **Cause:** Profile/cover images were only stored as base64 in JS memory — never uploaded to Supabase Storage or persisted to DB
- **Fix:** Added `sbUploadGroupImage(groupId, file, type)` in supabase.js to upload to `avatars/groups/{id}/` path
- Crop confirmation handler now: canvas → blob → File → `sbUploadGroupImage()` → `sbUpdateGroup(group.id, {avatar_url})` or `{cover_photo_url}`
- GIF uploads go directly without crop
- "Select from previous" handlers also call `sbUpdateGroup()` to persist

### Group posts on personal profile (fixed)
- **Cause:** `sbGetUserPosts()` didn't filter out group posts
- **Fix:** Added `.is('group_id', null)` to the query

### Group layout off to side on tablet (fixed)
- **Cause:** Tablet CSS had 2-column grid but 3 grid children (gv-left, gv-center, gv-right)
- **Fix:** Hide `.gv-left` on tablet breakpoint instead of just making it static

### Group coins showing 0 (fixed)
- **Cause:** `coin_balance` from DB wasn't mapped in `loadGroups()` or synced to `state.groupCoins` in `showGroupView()`
- **Fix:** Map `coin_balance` in `loadGroups()` and sync in `showGroupView()`

### Feedback modal — screenshot attachment (added)
- Optional file input with drag-drop area and image preview
- Accepts any image type (`accept="image/*"`)
- Uploads to `posts` bucket under `feedback/` path via `sbUploadFile()`
- Screenshot URL appended to email body, along with user email + ID for context
- Remove button (red X) clears the selected image

## Group Coin System Fix (v0.2.7 — 2026-02-23)

### Overview
Group coins are **shared** — they belong to the group, not individual users. All members see the same balance. You earn both personal coins AND group coins when interacting in groups (but not on your own content).

### Coin Awards
| Action | Personal Coins | Group Coins |
|---|---|---|
| Like/dislike someone's group post | +1 | +1 |
| Comment on someone's group post | +2 | +2 |
| Reply on someone's group post | +2 | +2 |
| Post in group | +5 | +5 |
| Like/comment on **own** post | 0 | 0 |

### What was fixed
- **Group like/dislike coins broken:** Old regex `pid.match(/^gvp?-(\d+)-/)` never matched UUID post IDs → group coins never awarded. Now uses `_activeGroupId` variable
- **No group coins for comments/replies:** `showComments()` only awarded personal coins. Now also calls `addGroupCoins()` with tracking via `canEarnGroupCommentCoin`/`canEarnGroupReplyCoin`
- **Own post check broken in groups:** `isOwnPost()` only checked `feedPosts` (main feed). Extended to check DOM `data-author-id` attribute on group feed posts
- **Group likes not synced to DB:** `sbToggleLike()` calls were missing from group like/dislike handlers
- **Coins only in localStorage:** `addGroupCoins()` now calls `sbAddGroupCoins()` RPC which atomically increments `groups.coin_balance` in DB. Returns server truth to update local state
- **Shop purchases not synced:** Group shop buy handlers now use `addGroupCoins(-price)` which syncs to DB

### Database
- **New RPC:** `add_group_coins(p_group_id, p_amount)` — SECURITY DEFINER, checks auth + membership, atomically updates `coin_balance` (floored at 0)
- **Migration:** Run `supabase/fix-group-coins.sql` in Supabase SQL Editor

### Code Changes
- `_activeGroupId` variable: set in `showGroupView()`, cleared in `navigateTo()`
- `addGroupCoins()` now calls `sbAddGroupCoins()` RPC (fire-and-forget with server truth update)
- `sbAddGroupCoins(groupId, amount)` wrapper in supabase.js
- `isOwnPost()` extended with DOM `data-author-id` fallback
- Group post HTML includes `data-author-id` attribute
- Group like/dislike handlers: fixed coin logic + added `sbToggleLike` calls + `saveState()`
- Comment/reply submit handler: awards group coins when `_activeGroupId` is set
- Shop purchase handlers: use `addGroupCoins(-price)` instead of direct `state.groupCoins` mutation

### Group post dropdown menu (added)
- Group posts now have the same three-dot menu as main feed posts
- Options: **Save Post**, **Report**, **Hide** (hides from view)
- Own posts also get: **Edit**, **Delete** (with confirmation modal)
- **No Share** option (group posts stay in the group)
- `showEditGroupPostModal(pid)` — reads current text from DOM, calls `sbEditPost`
- `confirmDeleteGroupPost(pid)` — confirmation modal, calls `sbDeletePost`, removes card from DOM
- Menu toggle and action handlers wired in `bindGvPostEvents()`

## Combined Skins Page (v0.2.9 — 2026-02-23)

### Overview
- Skin Shop and My Skins merged into a single "Skins" page (`#shop`) with a pill toggle
- Nav bar has one "Skins" link (palette icon) instead of two separate links
- Top-level toggle pills: "Skin Shop" (default) / "My Skins"
- `_skinPageView` variable (`'shop'` or `'mine'`) tracks active view, persists during session
- Re-entering the page remembers the last active view

### Backward Compatibility
- Old `#skins` hash URLs redirect to `#shop` with My Skins view active
- Dropdown "My Skins" link sets `_skinPageView='mine'` before navigating
- Inline flash-prevention script handles `skins` → `shop` redirect
- `_initHash` and `popstate` both redirect `skins` → `shop`

### Empty State
- "Visit Shop" button in My Skins empty state switches the toggle to Skin Shop (no page navigation)

### Code Changes
- `renderSkinPage()` — wrapper that shows/hides `#skinShopView` / `#mySkinView` and binds toggle pills
- `navigateTo()` redirects `page==='skins'` to `shop` with `_skinPageView='mine'`
- Removed `'skins'` from nav icon set updater array (no longer a separate nav link)
- `#page-skins` HTML container removed, content moved into `#page-shop` with toggle structure

## GIF Search in Comments (added 2026-02-23)

### Overview
- Users can post GIFs as comments via a Klipy-powered search picker
- GIF button in comment input bar (between text input and Post button)
- Opens a panel with search input and 2-column grid of GIF thumbnails
- Trending GIFs load on open, debounced search (400ms) for queries
- Clicking a GIF auto-submits it as a comment

### API
- **Provider:** Klipy (licensed GIF service used by WhatsApp/Canva/Figma)
- `searchKlipyGifs(query, perPage)` — search endpoint, returns `{preview, full, title}`
- `getKlipyTrending(perPage)` — trending endpoint
- Results cached in `_gifCache` to avoid repeated requests
- "Powered by KLIPY" attribution in picker footer (required)

### Storage
- GIF URLs stored in existing `content` field as `[gif]URL[/gif]`
- No database changes — GIFs hotlinked from Klipy CDN
- `buildCommentHtml()` detects `[gif]...[/gif]` pattern and renders as `<img class="comment-gif">`

### CSS
- `.comment-gif-btn` — pill button style for GIF trigger
- `.gif-picker-panel` — flex column panel with border-top, max-height 320px
- `.gif-picker-grid` — 2-column CSS grid with overflow scroll
- `.comment-gif` — max-width 280px, max-height 200px, rounded corners

## "Try On" Preview Button — Skin Shop (added 2026-02-23)

### Overview
- Every unowned shop card has a "Try On" button next to the Buy button
- Clicking "Try On" live-previews the item (skin, font, logo, icons, coins, template, nav style, premium skin) without saving to state or database
- Click again to toggle off; auto-reverts when switching to My Skins tab or navigating away
- Purchasing while trying on keeps the item applied permanently

### State
- `_tryOnSnapshot` — saved copy of all active customization state before first try-on
- `_tryOnActive` — `{ type, id }` of the currently previewed item, or null

### Key Functions
- `doTryOn(type, id)` — takes snapshot, applies item with `silent=true`, restores leaked state values, updates button visuals
- `revertTryOn()` — re-applies all saved values from snapshot, clears try-on state
- Called from: `navigateTo()`, `renderSkinPage()` (mine tab switch), toggle-off click

### Leaked State Handling
- `applyLogo`, `applyIconSet`, `applyCoinSkin`, `applyNavStyle` always mutate `state.*` even with `silent=true`
- After every try-on apply, these 4 values are restored from `_tryOnSnapshot`

### CSS
- `.shop-card-actions` — flex row for Try On + Buy buttons
- `.try-on-btn` — small outline button (12px font, 4px 12px padding)
- `.try-on-btn.trying` — filled with `var(--primary)` to indicate active preview

## Group Premium Skin Background Fix (fixed 2026-02-24)
- **Cause:** `applyGroupSkin()` set `gvPage.style.background` to hardcoded `#f0f0f0` (light) or `#0f172a` (dark) before checking for uploaded background images. This opaque inline background on `#page-group-view` (z-index:1) covered the `#premiumBgLayer` (z-index:0), so uploaded background images never showed through.
- **Fix:** When a group has a premium background image, `gvPage.style.background` is set to `'transparent'` after `updatePremiumBg()` so the layer shows through. Without a background image, it uses `var(--ps-bg)` instead of hardcoded colors so each skin's actual theme color is applied (e.g., Geo Prism gets `#f0f4ff` instead of grey).

## Cross-Tab Skin Bleeding Fix (fixed 2026-02-24)
- **Cause:** `visibilitychange` handler called `reapplyCustomizations()` unconditionally when a tab became visible. If you were in a group view, switching tabs would pull personal skin from Supabase and overwrite the group's active skin.
- **Fix:** Skip `reapplyCustomizations()` when `_activeGroupId` is set (i.e., in group view). Still syncs data from Supabase and saves to localStorage, just doesn't re-apply skin visuals.

## Twitter/X Link Preview Fix (fixed 2026-02-26)
- **Cause:** Twitter/X used the `blockquote.twitter-tweet` + `widgets.js` approach for embeds. The script was unreliable — blockquote was injected and URL stripped from post text, but `widgets.js` failed to process it, leaving posts completely blank. Microlink also can't scrape X (blocked by Twitter).
- **Fix:** Removed broken `widgets.js` blockquote embed. Added `_fetchXPreview()` helper that uses **FxTwitter API** (`api.fxtwitter.com`) to get tweet data (author, text, photos, video thumbnails). Rich preview cards now show in feed posts, messages/comments (mini), and post creation live preview. Videos show thumbnail (inline playback not possible — X limitation). Falls back to basic link if API fails.
- **Three integration points:** `autoFetchLinkPreviews()` (feed), `autoFetchLinkPreviewsMini()` (messages/comments), `detectAndFetchLink()` (post creation)
- TikTok had same issue — removed broken blockquote + `embed.js` approach. Added `_fetchTikTokPreview()` helper using TikTok's official oEmbed API (`tiktok.com/oembed`) for thumbnail, title, and author. Same 3 integration points as X.

## Default Page Fix (fixed 2026-02-26)
- **Cause:** `blipvibe_lastPage` was stored in `localStorage`, which persists across sessions. Opening the app in a new tab/window would restore the last visited page (e.g. groups) instead of home.
- **Fix:** Switched from `localStorage` to `sessionStorage` for `blipvibe_lastPage`. Session storage clears when the tab/window closes, so refreshes within a session still restore the page, but new visits always start at home. Changed in 5 places: index.html inline script, initApp(), navigateTo(), logout handler, and _initHash setup.

## Display Name System (added 2026-02-26)
- **New columns:** `first_name`, `last_name`, `nickname`, `display_mode` ('real_name' | 'nickname') on `profiles`
- **`display_name` stays as a synced/computed column** — recomputed client-side via `computeDisplayName()` whenever source fields change, then saved alongside them. All 70+ existing `display_name || username` patterns in app.js and 20+ Supabase query selects need zero changes.
- **Signup form** now collects first name + last name (required) above the username field
- **Edit Profile modal** replaced single "Name" input with: radio toggle (First & Last vs Nickname), first/last name inputs side-by-side, nickname input (optional), live preview showing computed display name
- **`computeDisplayName(firstName, lastName, nickname, displayMode, username)`** — pure helper in supabase.js encoding all fallback rules: nickname mode uses nickname if available, otherwise falls back to real name, then username
- **Migration** (`supabase/add-display-name-fields.sql`): adds columns, backfills existing display_name into first/last, updates `handle_new_user` trigger, updates `search_profiles` and `admin_get_users` RPCs to search new fields
- **Search** now matches first_name, last_name, and nickname in addition to username/display_name/bio

## Legal Compliance Audit & TOS/Privacy Policy Update (v0.2.18 — 2026-03-03)

### Terms of Use (21 → 26 sections, TOS_VERSION bumped to 4)
- **Binding contract formation language** added to intro — explicitly states Terms are a legally binding agreement
- **Sub-policy incorporation by reference** — intro now incorporates Privacy Policy, Acceptable Use Policy, DMCA Policy, and Arbitration Agreement
- **Section 1 (Eligibility):** Added parental consent requirement for minors 13–17
- **Section 2 (Account Registration & Security):** NEW — accurate info, credential security, no account transfer, unauthorized access notification
- **Section 3 (Free Expression):** Now references Acceptable Use Policy for complete prohibited conduct list
- **Section 4 (User Content):** Added sublicensable license right (needed for CDN/Supabase distribution); retention exception for law
- **Section 5 (Embedded Media):** Added general third-party links disclaimer
- **Section 6 (DMCA):** Added penalty of perjury statement, detailed counter-notification procedure with Fayette County jurisdiction, § 512(f) misrepresentation warning
- **Section 8 (Virtual Currency):** Added license-not-ownership language, no investment/speculative value, coins forfeited on account deletion, refund exception for applicable law, Apple App Store purchase compliance
- **Section 13 (Platform Status):** Merged beta notice + explicit no-uptime-guarantee
- **Section 14 (Section 230 Safe Harbor):** NEW — 47 U.S.C. § 230 protection, not publisher of user content, good-faith moderation defense
- **Section 15 (No Warranty):** Strengthened to ALL CAPS conspicuous disclaimer per Tennessee UCC § 2-316 — merchantability, fitness for purpose, title, non-infringement
- **Section 16 (Limitation of Liability):** Strengthened to ALL CAPS — indirect/incidental/special/consequential/exemplary/punitive damages disclaimed regardless of theory of liability
- **Section 18 (Account Termination):** Expanded to sole discretion, any reason or no reason, with or without notice
- **Section 19 (Dispute Resolution & Arbitration):** Complete rewrite — Federal Arbitration Act (9 U.S.C. § 1), 30-day informal resolution, binding individual arbitration (AAA Consumer Rules), Fayette County venue, fee allocation, explicit class action + jury trial waiver (ALL CAPS), small claims exception, 30-day opt-out window, arbitration-specific severability
- **Section 21 (Export Compliance):** NEW — OFAC sanctions/embargo representation
- **Section 23 (Waiver):** NEW — failure to enforce ≠ waiver
- **Section 24 (Entire Agreement):** NEW — TOS + incorporated policies = full agreement
- **Section 26 (Acceptance):** Updated with parental consent for 13–17

### Privacy Policy (20 → 21 sections, Version 3.0)
- **Section 1a:** Added first_name, last_name, nickname to collected account info
- **Section 1b:** Added photo albums, group memberships, group posts, group content
- **Section 1c:** Added in-app notifications, group coin balances, group skin purchases
- **Section 3:** Updated advertising opt-out cross-reference to include TIPA section
- **Section 14 (Tennessee Residents — TIPA):** NEW — Tennessee Information Protection Act acknowledgment with know/delete/correct/portability/opt-out rights, 45-day response, appeal process
- Sections 15–21 renumbered (was 14–20)
- Cross-references updated (Section 17→18 for changes notification, Sections 12/13→12/13/14 for opt-out)

### Both Documents (index.html + app.js modal)
- TOS updated in both index.html signup form and app.js modal (kept in sync)
- TOS_VERSION bumped from 3 → 4 (forces all existing users to re-accept)
- Effective dates updated to March 3, 2026
- Governing law: State of Tennessee, venue: Fayette County, Tennessee (confirmed in both)

## @Mention Tagging System (updated 2026-03-17)
- `@username` autocomplete works in post textareas, comment inputs, and group chat — triggered by typing `@`, shows dropdown with avatar + username + display name
- Group posts restrict autocomplete to group members only
- `notifyMentionedUsers(text, postId, context)` sends mention notifications — now called from posts, group posts, comments, photo comments, and group chat messages
- `'mention'` is a proper DB enum value in `notification_type` — no longer mapped to `'system'`
- Migration: `supabase/add-mention-notification-type.sql` adds `'mention'` to existing databases
- Mentions tab in notifications page — `<i class="fas fa-at"></i>` icon, filters to `type==='mention'`
- `renderMentionsInText(html)` converts `@username` to clickable purple links
- **Clicking @mention links opens the tagged user's profile** — `bindMentionClicks()` now called in feed, profile posts, group posts, comments modal, group chat messages, search results, and saved posts
- Notification messages include context: "mentioned you in a post", "a comment", "a photo comment", "a group chat message"
- **Autocomplete prioritizes followers/following** — connections loaded once per autocomplete instance, cached; matched connections shown first, remaining slots filled by global search; max 5 results
- **Search fallback:** `sbSearchProfiles` falls back to direct table query if `search_profiles` RPC is not deployed
- **Resilient autocomplete:** If global search fails, still shows matching connections
- `viewProfile(userId)` helper added — fetches profile and opens `showProfileView`
- Group context still restricts to group members only

## Invite to Group (added 2026-03-17)

### Overview
- "Invite to Group" button appears on every profile view (non-self users) alongside Follow, Message, and Block buttons
- Opens modal listing all groups the current user belongs to or owns
- Each group row shows icon/avatar, name, member count, and an Invite button
- Checks if the person is already a member before sending invite
- Sends a `group_invite` notification to the invited user

### Notifications
- `group_invite` type mapped to `system` in DB enum, but preserved as `group_invite` via `data.originalType`
- Notification icon: `fa-envelope-open-text` with group styling
- Clickable: opens a join confirmation modal with group name
- Accepting joins the group and navigates to the group view
- Shows in "All" notification tab (not filtered as system)
- `sbCreateNotification` updated to map `group_invite` → `system` for DB compatibility

### Code Changes
- `showInviteToGroupModal(person)` — new function in app.js
- "Invite to Group" button added to `showProfileView` action buttons
- `getNotifIcon` map updated with `group_invite` entry
- Notification rendering adds `data-group-id` attribute for group invite notifications
- Click handler on group invite notifications: loads group, shows join modal, navigates to group on accept

## Major Feature Update (v0.3.0 — 2026-04-02)

### Infinite Scroll / Feed Pagination
- Feed now loads 20 posts at a time instead of 50
- Scroll-based loading triggers at 600px from bottom
- `_feedOffset`, `_feedLimit`, `_feedHasMore` control pagination state
- `_loadMorePosts()` appends new posts without full re-render
- `_buildFeedPost()` and `_buildPostHtml()` extracted as reusable helpers
- End-of-feed message shown when no more posts

### Skeleton Loading States
- `showFeedSkeleton()` renders 3 shimmer placeholder cards while feed loads
- CSS: `.skeleton`, `.skeleton-post`, `.skeleton-avatar`, `.skeleton-line`, `.skeleton-image`
- `@keyframes skeletonPulse` animation

### Post Draft Auto-Save
- `saveDraft()` / `loadDraft()` / `clearDraft()` — localStorage-backed
- `initDraftAutoSave(textareaId)` — binds to textarea with 1s debounce
- Draft restored when reopening post creation modal
- Draft cleared on successful publish

### Notification Grouping
- `groupNotifications(notifs)` — groups same-type notifications by post/action
- Like notifications grouped: "X and 4 others liked your post"
- Follow notifications grouped: "X and 3 others followed you"
- Integrated into `renderNotifications()`

### Full-Text Post Search
- **Migration:** `supabase/add-post-search.sql` — adds `search_vector` tsvector column, GIN index, auto-update trigger, `search_posts` RPC
- `sbSearchPosts(query, limit)` in supabase.js calls RPC
- Search results page posts tab now queries DB first, falls back to local feed filter

### Group Invite Links
- `generateInviteLink(groupId)` creates shareable URL (`#join:groupId`)
- `showInviteLinkModal(group)` — modal with copyable link
- "Invite Link" button added to group view right sidebar
- `checkJoinLink()` handles `#join:` URLs on page load — shows join confirmation modal

### Quote Posts
- "Quote Post" option in post dropdown menu
- `showQuotePostModal(postId)` — modal with commentary textarea + embedded original post preview
- Creates new post with `shared_post_id` reference
- CSS: `.quote-post-embed` styling

### Multi-Person DMs
- "New Group Chat" button at top of message contact list
- `showCreateGroupDmModal()` — search and add people, name the chat
- Group DMs stored in localStorage (`blipvibe_group_dms`)

### Image Optimization
- `_optimizeImage(file, maxW, maxH, quality)` in supabase.js — resizes and converts to WebP
- Applied to: `sbUploadAvatar` (400x400), `sbUploadCover` (1400x600), `sbUploadPostImage` (1200x1200)
- GIFs pass through unchanged
- Reduces bandwidth and storage usage

### Comment Pinning
- `_pinnedComments` object — maps postId to pinned commentId
- `togglePinComment(postId, commentId)` — pin/unpin
- Persisted to localStorage (`blipvibe_pinned_comments`)

### Post Analytics Dashboard
- `showPostAnalytics()` — modal with analytics grid
- Shows: total posts, total likes, total views, total comments, followers, following
- Top 5 posts ranked by likes with bar chart visualization
- CSS: `.analytics-grid`, `.analytics-card`, `.analytics-bar`
- Accessible from Settings → Post Analytics

### Daily Login Rewards (server-side, cheat-proof)
- `checkDailyLoginReward()` — runs 2s after app init, calls `sbClaimDailyReward()` RPC
- Awards **5 coins** per day, once every **24 hours** (enforced by server timestamp via `now()`)
- Streak tracked server-side in `profiles.daily_login_streak` column
- `claim_daily_reward()` SECURITY DEFINER RPC: checks `last_daily_reward` timestamp, enforces 24h cooldown, continues streak if within 48h, resets if beyond
- Returns `{ awarded, coins, streak, new_balance, next_available }` — client updates from server truth
- **Cheat-proof:** Uses Postgres `now()` — device clock manipulation has no effect
- Animated popup with coin bounce animation
- **Migration:** `supabase/daily-login-reward.sql` — adds columns + RPC
- CSS: `.login-reward-popup`, `.login-reward-backdrop`, `@keyframes coinBounce`

### Rich Text in Posts
- `renderRichText(text)` — parses markdown-style formatting after HTML escaping
- Supports: `**bold**`, `*italic*`, `~~strikethrough~~`, `` `inline code` ``
- Applied in `_buildPostHtml()` feed rendering

### Video Trimming
- `showVideoTrimModal(file, onTrimmed)` — modal with video preview and start/end time inputs
- "Use Full Video" skip button and "Trim & Use" confirmation
- Trim metadata attached to file object (`_trimStart`, `_trimEnd`)

### Light Mode Toggle
- `toggleLightMode()` — toggles `body.light-mode` class
- Full CSS theme: `body.light-mode` overrides all CSS variables for light appearance
- Persisted in `settings.lightMode`, syncs to Supabase via skin_data
- Toggle in Settings modal

### Shareable Bookmark Collections
- `showShareCollectionModal(folderId)` — generates shareable link for saved post folders
- Link format: `#collection:userId:folderId`
- Copy button with clipboard API

### Push Notifications (Capacitor)
- `initPushNotifications()` — requests permission, registers device, stores FCM token
- Listens for received notifications and action performed
- Token saved to profile via `sbUpdateProfile`
- Only runs on native platforms (Capacitor)

### Service Worker
- `sw.js` — caches static assets (HTML, CSS, JS, images)
- Network-first strategy for same-origin assets, cache-first for CDN resources
- Registered in index.html
- Enables faster repeat loads and basic offline support

## UX & Performance Refinements (v0.3.1 — 2026-04-02)

### Scroll-to-Top Button
- Floating button (bottom-right, `#scrollToTopBtn`) appears after scrolling 400px
- Smooth scroll to top on click
- RAF-throttled visibility toggle for performance

### Character Counter on Posts
- `initCharCounter(textareaId, counterEl)` — live count, 5000 char limit
- Yellow warning at <200 remaining, red at over limit
- Shown in post creation footer (`#cpmCharCounter`)

### Double-Tap to Like
- Touch: `touchend` listener detects double-tap within 300ms on `.feed-post`
- Desktop: `dblclick` listener for same behavior
- Skips buttons, links, inputs, media to avoid conflicts
- Shows animated heart overlay on the post via `_showDoubleTapHeart()`

### Animated Like Feedback
- `animateLikeBtn(btn)` — burst scale animation on the like button icon
- Floating thumbs-up that drifts upward and fades out
- CSS: `@keyframes likeBurst`, `@keyframes likeFloat`

### Unsend Message (5s window)
- `showUnsendOption(msgEl, messageId)` — shows "Undo" bar below sent message
- 5-second window to click Undo before bar disappears
- Calls `sbDeleteMessage(messageId)` on undo

### Confirm Before Leaving Draft
- `confirmDraftLeave(callback)` — modal asking to keep or discard draft
- Shown when closing post modal with unsaved text

### Share Your Profile
- "Share Profile" in user dropdown menu
- `showShareProfileModal()` — modal with avatar, name, copyable profile link
- Link format: `#profile:username`

### Suggested Follows After Following
- `showSuggestedFollows(justFollowedId)` — fetches who they follow
- Filters out people you already follow + yourself
- Shows up to 3 suggestions with quick-follow buttons
- Appends to the active modal

### Lazy Loading Images
- `MutationObserver` automatically adds `loading="lazy"` to all new images
- Skips navbar, profile card, and login page images (above-the-fold)

### Debounced Infinite Scroll
- Scroll handler now uses `requestAnimationFrame` throttling instead of firing on every pixel
- `{passive: true}` for better scroll performance

### Feed Cache (sessionStorage)
- `cacheFeedData()` — saves first 50 posts to sessionStorage after load
- `loadCachedFeed()` — instant render from cache while fresh data fetches
- Tab switches show cached content immediately instead of skeleton

## Bug Fixes & Polish (v0.3.2 — 2026-04-02)

### Email Consolidation
- All `copyright@blipvibe.com` references replaced with `hello@blipvibe.com` (the copyright@ email didn't exist)
- Updated in: index.html (TOS), js/app.js (TOS modal), dmca.html, LEGAL-COVERAGE.txt

### DMCA Registration Number
- Added `DMCA-1070726` to all DMCA references: dmca.html designated agent section, index.html TOS, app.js TOS modal, LEGAL-COVERAGE.txt

### @Mention Autocomplete Improvements
- Search now matches against ALL name fields: `username`, `display_name`, `first_name`, `last_name`, `nickname`
- So `@Dane`, `@Rion`, or `@dmuller` all find the same person
- Dropdown shows the user's **preferred display name** based on `display_mode`: nickname mode shows nickname, real name mode shows first+last
- `_mentionMatchesQuery(u, ql)` helper consolidates name matching logic
- `sbGetFollowing`/`sbGetFollowers` now fetch `first_name`, `last_name`, `nickname`, `display_mode` fields
- Fallback `sbSearchProfiles` query also searches `first_name`, `last_name`, `nickname` columns

### Emoji Picker Restyle
- Changed from full-width bottom sheet to 320px wide floating popout
- Rounded corners on all sides, smaller emoji grid (20px instead of 22px)
- Fixes weird overflow in comment edit modals and reply inputs

### View More Word Merge Fix
- `safeWordSplit()` was stripping the leading space from the hidden portion
- When expanded, last visible word and first hidden word merged (e.g. "putit")
- Fix: re-add leading space to remainder so words stay separated

### Modal Close Button Fix
- `.modal-close` changed from padding-based sizing to fixed 36x36px with flexbox centering
- Hover circle is now always a perfect circle instead of an elongated oval

### Embed Fix for Infinite Scroll Posts
- `_appendFeedPosts()` was missing `autoFetchLinkPreviews()` call
- Posts loaded via infinite scroll had no YouTube/TikTok/Instagram embeds
- Initial feed load restored to 50 posts (was reduced to 20)

## DMCA Policy Strengthening (v0.3.3 — 2026-04-02)

### Email Change
- DMCA-specific email changed from `hello@blipvibe.com` to `dmca@blipvibe.com`
- General contact remains `hello@blipvibe.com`
- Updated in: dmca.html, index.html (TOS + Privacy Policy), app.js (TOS modal), LEGAL-COVERAGE.txt

### New DMCA Sections
- **Section 3: No Prior Screening** — "BlipVibe does not pre-screen user content but reserves the right to remove content that violates this policy" (legal protection)
- **Section 7: Audio & Music Content** — Users responsible for music rights, unauthorized use prohibited (protects against music copyright claims)
- **Section 8: Standard Technical Measures** — BlipVibe accommodates § 512(i) standard technical measures (safe harbor requirement)

### Strengthened Language
- **Designated Agent Registration** — Added "BlipVibe has registered its designated agent with the U.S. Copyright Office" (reinforces safe harbor)
- **Repeat Infringer Policy** — Changed from "more than one valid notice" to "at its sole discretion" (more flexible, not locked into strike count)
- DMCA page now has 11 sections (was 7)

## DMCA Federal Compliance Hardening (v0.3.4 — 2026-04-02)

### Changes to dmca.html
- **Counter-notification jurisdiction** — changed from "Knox County, Tennessee" to "United States District Court for the Eastern District of Tennessee" (matches § 512(g) statutory language)
- **Substantial compliance shield** — added: "BlipVibe reserves the right to reject or ignore any notification that does not substantially comply with 17 U.S.C. § 512(c)(3)" (protects against sloppy/abusive takedowns)
- **No liability for good faith removal** — added: "BlipVibe shall not be liable to any user for removal in response to a good faith DMCA notice" (reinforces § 512(g))
- **Restoration timing** — changed from "10 to 14 business days" to "not less than ten (10) nor more than fourteen (14) business days" (matches statutory language exactly)
- **Repeat infringer flexibility** — added "Determinations are made based on multiple valid infringement notices and other relevant factors" (avoids being locked into fixed strike count)
- **Fair use neutrality** — new Section 9: "BlipVibe does not make determinations regarding fair use and acts in accordance with the DMCA framework upon receipt of facially valid notices"
- **Effective date** updated to April 2, 2026
- DMCA page now has 11 sections

### Changes to index.html TOS
- Counter-notification jurisdiction updated to "Eastern District of Tennessee"

## Profile Music System (v0.6.0 — 2026-04-07)

### Music Library
- 22 BlipVibe original songs from Suno stored in Supabase Music bucket
- `music_library` table with title, artist, file_url, genre, price (40 coins)
- `user_songs` table tracks ownership per user
- `profile_song_id` column on profiles

### Song Shop
- Songs tab in Skin Shop — browse, preview with play/pause, buy for 40 coins
- Songs tab in My Skins — set owned songs as profile song
- Songs tab in Group Shop — groups can buy songs with group coins
- Infinity users see "Free" button instead of price
- Preview audio shared across shop tabs

### Global Mini Player
- Sticky bar at bottom of screen, visible on ALL pages
- Play/pause, volume slider, mute, close controls
- Shows song title and artist
- Pulse animation when playing
- Close pauses audio, music note icon in nav to reopen

### Audio Behavior
- Your profile song plays as background music while you browse
- Visiting someone else's profile crossfades to their song (800ms)
- Leaving their profile crossfades back to your song (1000ms)
- If they have no song, your music keeps playing
- Songs loop with 3-second fade-out and 1-second fade-in
- Auto-starts after first user interaction (click/tap) on the page

### Crossfade System
- `_fadeAudio(audio, fromVol, toVol, duration, callback)` — smooth volume transitions
- `switchToProfileSong(song)` — fades out yours, loads theirs
- `resumeMyMusic()` — fades out theirs, fades yours back in from where it left off
- `_setupFadeLoop(audio)` — auto fade-out/in at song boundaries

## Security, Accessibility & Admin Features (v0.3.5 — 2026-04-02)

### Change Password In-App
- `showChangePasswordModal()` — Settings → Account Security → Change Password
- Uses `sb.auth.updateUser({password})` — Supabase handles validation

### Change Email In-App
- `showChangeEmailModal()` — Settings → Account Security → Change Email
- Sends confirmation to new email via `sb.auth.updateUser({email})`

### Two-Factor Authentication (2FA/TOTP)
- `showSetup2FAModal()` — Settings → Account Security → 2FA
- Uses Supabase MFA: `sb.auth.mfa.enroll()`, `challenge()`, `verify()`
- Shows QR code + manual secret for authenticator app setup
- Can disable via `sb.auth.mfa.unenroll()`

### Alt Text on Post Images
- "ALT" button overlay on each image thumbnail in post creation
- Opens modal with textarea for image description
- Stored in `mediaList[i].altText` — persists through grid re-renders
- Button turns purple when alt text is set

### Skip-to-Content Link (Accessibility)
- `<a href="#main-content" class="skip-to-content">Skip to content</a>` added to index.html
- Hidden off-screen, appears on focus (keyboard navigation)
- `#main-content` anchor above feed container

### ARIA Labels
- MutationObserver auto-adds `aria-label` to icon-only buttons
- Covers: like, dislike, comment, share, react, post menu, modal close, scroll-to-top
- Re-runs on DOM changes for dynamically added content

### Link in Bio
- `website_url` column on profiles (migration in `add-post-edit-history.sql`)
- `showEditLinkInBio()` — Settings → Link in Bio
- Displays on profile view as clickable link with domain name
- Added to `profileToPerson()` mapping

### Post Edit History
- `post_edits` table with auto-trigger on content change (migration: `add-post-edit-history.sql`)
- `showEditHistory(postId)` — view previous versions of a post
- Trigger logs old content before each edit via SECURITY DEFINER function

### Seen By on Group Posts
- `group_post_views` table (migration: `add-post-edit-history.sql`)
- `trackGroupPostView(postId)` — upserts view record when viewing group posts
- `showSeenByModal(postId)` — shows who viewed a group post with avatars and timestamps

### Scheduled Posts Calendar View
- `showScheduledCalendar()` — Settings → Scheduled Posts → Calendar
- Visual month grid with dots on days that have scheduled posts
- Today highlighted with border
- Cancel button on each scheduled post
- Replaces old flat list view

### DMCA Notice Log
- `dmca_notices` table (migration: `add-dmca-log.sql`)
- Tracks: notice type, status, complainant, target content, timestamps
- Admin-only RLS (SELECT, INSERT, UPDATE)
- Supports takedown + counter-notification tracking

### Admin Report Queue
- `showAdminReportQueue()` — Settings → Report Queue (admin only)
- Lists all user/post reports with type badges (spam, harassment, inappropriate)
- Dismiss button removes reports
- Only visible to admin users

## Social Features Update (v0.3.6 — 2026-04-02)

### Message Reactions
- React to any message with emoji (❤️ 😂 😮 😢 👍 👎)
- Hover over message to see smiley button, click to open picker
- Reactions shown as badges below message, highlighted if yours
- Stored in localStorage per message ID (`blipvibe_msg_reactions`)
- `showMsgReactionPicker()`, `renderMsgReactions()`, `bindMsgReactions()`

### Reply to Specific Message
- Hover over message to see reply arrow button
- Click to set reply context — preview bar appears above input
- Reply includes quoted text with left border indicator
- Reply reference stored as `[reply:mid]` prefix in message content
- `setReplyToMessage()`, `clearReplyTo()`, `bindMsgReplyBtns()`

### Trending Hashtags Page
- `showTrendingHashtags()` — modal showing top 20 hashtags ranked by post count
- Collects hashtags from loaded feed posts
- Click any hashtag to open its feed
- "Trending Hashtags" button in home right sidebar

### Search History
- Recent searches remembered in localStorage (up to 15 entries)
- Shown on search page when input is empty or on focus
- Each entry clickable to re-search, removable with X
- "Clear All" button
- `addToSearchHistory()`, `removeFromSearchHistory()`, `showSearchHistory()`

### Mutual Followers on Profiles
- `getMutualFollowers(userId)` — finds people who follow them that you also follow
- `renderMutualFollowers()` — avatar stack with "Followed by X and 3 others"
- Loaded async after profile card renders (non-blocking)
- Shows up to 3 avatars + count text

### Privacy Policy Updates
- Message reactions added to activity data disclosure
- Search history disclosed as localStorage data (not sent to servers)

## Gamification System (v0.5.0 — 2026-04-07)

### Daily Quest System
- Like 3 posts (+20 coins), Follow 2 users (+20 coins), Create 1 post (+35 coins)
- Server-side tracking via `get_daily_quests` and `update_quest_progress` RPCs
- Local fallback if RPCs not deployed
- Quest panel renders above feed with progress bars and check marks
- Resets daily, prevents double rewards
- Migration: `supabase/add-daily-quests.sql`

### Coin Progress Bar
- Shows progress toward next premium skin (300 coin goal)
- Gradient fill bar with current/target display
- Hidden for infinity users

### Featured Skin (Daily Rotation)
- Rotates premium skins based on day of year
- Gold-accented banner with countdown timer until midnight
- Buy button (or Free for infinity users)

### Tiered Streak Rewards
- Upgraded from flat 5 coins to: Day 1: +10, Day 3: +20, Day 7: +50, Day 14: +100
- Shows next tier in reward popup
- Updated `claim_daily_reward` RPC

### Coin Earn Animation
- `showCoinEarnAnimation(el, amount)` — floating coin icon on earn/lose
- Uses user's equipped coin skin (diamond, fire, crown, etc.)
- 5 random float directions for variety
- Red drop animation for coin loss (-1 on unlike)
- 500ms debounce prevents multiple animations

## Economy Rebalance (v0.5.0 — 2026-04-07)

### New Shop Prices
- Fonts: 25, Logos: 35, Icon Sets: 35, Coin Skins: 50
- Nav Styles: 60, Basic Skins: 75, Templates: 100, Premium Skins: 300, Songs: 40
- New users start with 100 coins

### Daily Earning Caps
- Posts: 5/day (25 max), Comments: 15/day (30 max), Replies: 15/day (30 max)
- Post likes: 30/day (30 max), Comment likes: 20/day (20 max)
- Daily login: tiered (10-100), Quests: +75/day
- Max daily: ~310 coins

### Infinity Status (Early Adopters)
- `infinityCoins` flag in `skin_data` — grants unlimited purchasing
- Shows ∞ symbol (28px) in nav coin display
- Shop shows "Free" button, no coin deduction
- Preserved in `_buildSkinData()` sync
- Migration: `supabase/grant-infinity-early-adopters.sql`

## Profile Music System (v0.6.0 — 2026-04-07)

### Music Library
- 22 BlipVibe original songs from Suno in Supabase Music bucket
- `music_library` table, `user_songs` ownership, `profile_song_id` on profiles
- Songs cost 40 coins (free for infinity users)
- Migration: `supabase/add-profile-music.sql`

### Songs in Skin Shop
- "Songs" tab in shop — browse, preview (15s limit), buy, set as profile song
- "Songs" in My Skins — set owned songs as profile song
- Preview pauses global player, resumes on stop
- Preview stops on tab switch and page navigation

### Songs in Group Shop
- Groups can buy songs with group coins
- Apply tab → Songs pill shows owned songs with "Set as Group Song" / "Applied"
- Group active song saved in group `skin_data`
- Song plays when entering group view

### Global Sticky Mini Player
- Fixed bar at bottom of screen, visible on all pages
- Play/pause, volume slider, mute, close controls
- Close pauses audio, music note icon in nav to reopen
- Pulse animation when playing

### Seamless Audio Transitions
- Your profile song plays as background while browsing
- Visiting someone's profile or group crossfades to their song (800ms fade out → 500ms pause → 800ms fade in)
- Leaving crossfades back to your song from where it left off (1000ms fade in)
- `switchToProfileSong()` / `resumeMyMusic()` / `refreshMyProfileMusic()`
- `_setupFadeLoop()` — 3-second fade-out at song end, 1-second fade-in on restart
- Auto-starts after first user interaction (click/tap)

### Group Shop Redesign
- Apply tab is first tab with sub-filter icon pills: 🎨 Skins, 💎 Premium, 🔤 Fonts, 🎵 Songs
- Premium background controls show on Apply → Premium filter
- Group cards show profile picture as circle thumbnail

## Bug Fixes (v0.6.0 — 2026-04-07)

- Infinity coins being wiped by `_buildSkinData` sync — now preserved
- Unfollowed users still showing in Following feed — feed re-renders on follow/unfollow
- Profile view likes desyncing with DB — uses server truth now
- Like counts resetting to 0 on refresh — fixed cached feed overwriting fresh data
- Shared post images showing full size — proper layout with thumbnails
- Shared post author not clickable — now navigates to their profile
- View All photos on other profiles going to own photos — opens modal instead
- View More button not working — added preventDefault/stopPropagation
- View More cutting words — `safeWordSplit()` breaks at word boundaries
- Modal close button oval shape — fixed to 36x36px circle
- Mobile feed not centered — removed left border, forced width on mobile
- YouTube not playing on mobile — thumbnail + play button fallback
- Own posts in Discover tab — explicit exclusion
- Discover showing only friends-of-friends — now shows all non-followed by engagement
- Multiple coin animations firing — 500ms debounce
- Song preview pause button not working — unified handler
- Group song purchases not persisting — added to syncGroupSkinData
- Profile song reverting to old one — refreshMyProfileMusic() on all set actions
- Lightbox video not displaying — three root causes fixed:
  1. CSS: added `.lightbox-media video` rules + `min-width:300px` on media container + `width:100%` on video
  2. JS: `showAllMedia()` filtered to images only, dropping all videos — now includes both types
  3. JS: video thumbnails have `#t=0.5` fragment in src, but `_media_` list stores clean URLs — `indexOf()` always returned -1 for videos. Added `cleanSrc()` helper to strip fragment before lookup
- Playlist manager showing all songs for infinity users — removed `_hasInfinity()` bypass so only owned songs appear
- YouTube/URLs with underscores broken in feed — `renderRichText()` italic regex `_text_` was matching underscores inside URLs (e.g. `v=2R_qDghqVxg` → `v=2RqDghqVxg`), stripping them. Fix: protect `<a>` tags from formatting by extracting them before applying markdown, restoring after
- Feed URL not hidden after embed — `linkifyText()` wraps URLs in `<a>` tags but old regex only matched raw text. Added `_hideUrlFromText()` helper that strips the full `<a>` tag
- Story avatar/name click now opens profile — closes story viewer and navigates to user's profile page
- Templates not applying on other profiles — `applyTemplate()` was never called when viewing others. Added to: profile view apply (line ~2903), navigateTo restore (line ~1279), and profile-to-profile restore (line ~2886)
- Profile card cover gradient too large — reduced from 70px to 30px, avatar wrap shrunk from 200px max to 160px, negative margin adjusted so avatar overlaps cover banner properly
- Other users' skins/fonts/templates not loading — `skin_data` column is revoked from SELECT for other users. Created `get_public_skin_data` RPC that returns only visual customization fields. `showProfileView()` now calls `sbGetPublicSkinData(userId)` to fetch skin/font/template/premium bg before applying. Migration: run `supabase/get-public-skin-data.sql`
- Post dropdown menu cut off — `.feed-post` and `.card` had `overflow:hidden` which clipped the absolutely-positioned dropdown. Changed `.feed-post` to `overflow:visible`
- Daily quests not tracking progress — `sb.rpc()` returns `{data, error}` but code used raw return value and didn't throw on error, so the local fallback never ran. Fixed to properly destructure and throw on RPC errors
- Admin delete posts — admins see "Admin Delete" option on all posts (feed + groups). Uses `admin_delete_post` SECURITY DEFINER RPC that verifies `is_admin` before deleting. Migration: run `supabase/admin-delete-post.sql`
- Profile music pauses when videos play — direct `<video>` elements trigger pause on `play` event, resume on `pause`/`ended`. YouTube/Vimeo iframes pause music on click. Skips muted thumbnails. Checks no other videos still playing before resuming.
