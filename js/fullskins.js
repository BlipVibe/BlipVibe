/* BlipVibe full-skin engine.
 *
 * A "full skin" is a premium skin that also ships an image asset kit in
 * images/skins/<id>/assets/ (sliced by prototypes/tools/slice_kit.py). When such a skin
 * is applied we:
 *   1. the normal applyPremiumSkin() runs (ownership, sync, try-on, profile-view all unchanged) and
 *      then calls BlipFullSkins.onSkin(id) — app.js lives in one DOMContentLoaded closure, so it
 *      calls us at a few points (onSkin, render) rather than us wrapping its functions,
 *   2. add body classes  "fs fs-<id>"  (never containing "premium-": css uses [class*="premium-"]),
 *   3. point CSS variables at that skin's assets (images only download once a skin is applied),
 *   4. run the skin's layout renderer for pieces that need extra markup (e.g. timeline frames).
 *
 * Other shop extras: icon sets / nav styles / templates / logos are visually overridden while a
 * full skin is on; fonts, coin skins and songs still apply (see prototypes/skin-engine-spec.md).
 * Web layer only — ships via OTA, no native changes.
 */
(function () {
  'use strict';

  var ICONS = ['home', 'groups', 'skins', 'network', 'messages', 'like', 'dislike', 'comment', 'share',
    'search', 'bell', 'music', 'coin', 'camera', 'back', 'plus', 'send', 'emoji', 'edit', 'more'];
  var PARTS = ['background', 'panel-card', 'panel-card-active', 'chip', 'chip-active', 'btn-primary',
    'btn-secondary', 'btn-round', 'nav-active', 'nav-bar', 'header-bar', 'timeline-frame',
    'avatar-frame', 'avatar-mask', 'post-frame', 'quest-0', 'quest-50', 'quest-100',
    'deco-1', 'deco-2', 'deco-3', 'deco-4', 'deco-5', 'deco-6', 'thumb'];
  // extras sheet (prototypes/extras-kit-brief.md) — only for skins whose registry entry sets `extras`
  var EXTRAS = ['photo-frame', 'tile', 'tape-2', 'bar-track', 'bar-fill', 'field', 'sticker-1', 'sticker-2', 'divider'];

  /* Per-skin settings. `dark` = light text on dark surfaces. `timeline` = how many timeline photo
   * slots the profile shows. `slice` = border-image slice (percent) for stretchable panels. */
  var FULL_SKINS = {
    scrapbook: {
      name: 'Scrapbook', dark: false, ink: '#3e2d20', muted: '#75604b', accent: '#cf6f8c',
      font: "'Kalam', cursive", titleFont: "'Caveat', cursive",
      timeline: 2, avatar: 'center', slice: 16.67,
      // art swapped in for a standard part (asset file names in images/skins/<id>/assets/)
      parts: { 'background': 'background-v2', 'panel-card': 'card9-soft', 'panel-card-active': 'panel9-pink',
        'btn-secondary': 'strip9-layered', 'btn-primary': 'strip9-pink', 'header-bar': 'header9-pink',
        'nav-bar': 'strip9-layered', 'nav-active': 'tile', 'icon-coin': 'coin-stack' },
      // skin-only art, exposed as --fs-<name>
      assets: ['photo9-torn', 'tape-corner-a', 'tape-corner-b', 'flowers-spray', 'heart-sticker',
        'banner', 'navbar', 'row9-crumpled', 'chip9', 'chip9-active', 'coin-pill', 'avatar-ring',
        'row9-soft', 'label9', 'bubble9-cream', 'bubble9-pink', 'icon-circle', 'send-circle', 'field9-soft',
        'bar9-soft', 'tape-card', 'heart-doodle', 'unread-dot', 'photo-soft-edge',
        'backing9-aged', 'backing9-ledger', 'scrap-pink', 'scrap-kraft', 'scrap-blue', 'tape-beige',
        'tape-pink-grid', 'tape-sage', 'action-strip9', 'sticker-daisy', 'sticker-stamp',
        'banner-collage', 'coin-tag-small', 'icon-like-filled', 'icon-dislike-filled', 'icon-eye', 'photo-edge9', 'row9-real-a', 'row9-real-b', 'row9-real-c', 'bubble9-real-cream', 'bubble9-real-pink', 'label9-real', 'field9-real', 'bar9-real', 'circle-real', 'circle-real-rose', 'panel9-real-a', 'panel9-real-b', 'post9-real-a', 'post9-real-b', 'post9-real-c', 'button9-real', 'button9-real-rose', 'chip9-real', 'chip9-real-active', 'track-real', 'fill-real', 'tile-real'],
      edge: 16, // px: on-screen width of the 9-slice border zone (art border zone is 128px); concept edges are thin
      extras: true,
      // the app's own theme variables (style.css :root) re-pointed at this skin, so every surface the
      // engine doesn't restyle by hand (inputs, pills, rings, menus) still matches
      theme: { '--dark': '#3e2d20', '--gray': '#75604b', '--light-bg': '#fbf4e6', '--card': '#f1e4cb',
        '--border': 'rgba(62,45,32,.22)', '--nav-bg': '#e8c4c4' },
      fonts: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Kalam:wght@400;700&display=swap'
    }
  };
  FULL_SKINS['anime-blaze'] = {
    name: 'Anime Blaze', dark: true, ink: '#f5f1ea', muted: '#b9b1a6', accent: '#e8321e',
    font: "'Barlow Semi Condensed', sans-serif", titleFont: "'Barlow Semi Condensed', sans-serif",
    timeline: 1, avatar: 'center', slice: 15, edge: 16,
    // colour options (owner, Nov 15): same art recoloured offline into assets/<id>/; first = assets/ root
    variants: [
      { id: 'red', name: 'Blaze Red', accent: '#e8321e', swatch: '#e8321e' },
      { id: 'blue', name: 'Blue', accent: '#2f6dff', swatch: '#2f6dff' },
      { id: 'purple', name: 'Purple', accent: '#9a33ff', swatch: '#9a33ff' },
      { id: 'green', name: 'Green', accent: '#20c447', swatch: '#20c447' },
      { id: 'pink', name: 'Pink', accent: '#ff3f9b', swatch: '#ff3f9b' }
    ],
    assets: ['icon-like-on', 'icon-dislike-on', 'panel9', 'panel9-alt', 'row9', 'row9-hot', 'bubble9-dark', 'bubble9-red', 'label9', 'button9-red',
      'button9-dark', 'chip9', 'chip9-active', 'field9', 'banner', 'navbar', 'cover-frame', 'avatar-ring',
      'track', 'fill', 'coin-pill', 'burst', 'cover-cut', 'cover-top', 'stat9', 'avatar-rim', 'header', 'title-plate9', 'quest-row9', 'quest-tile', 'quest-track', 'quest-fill', 'reward-pill9', 'post-frame', 'action-strip9', 'nav-divider', 'stat-box', 'button-slant', 'cover-mask', 'cover-frame', 'tab', 'tab-active', 'post-panel', 'photo-frame', 'action-strip', 'quests-plate', 'quest-row', 'quest-tile', 'quest-track', 'quest-fill', 'reward-pill', 'title-plate', 'nav-bar', 'list-row', 'list-row-gold', 'join-btn', 'skin-card', 'equipped-tag', 'filter-chip', 'filter-chip-active', 'bubble-in', 'bubble-out', 'input-bar', 'field', 'round-btn', 'send-btn', 'composer', 'featured-frame', 'coin-goal-bar', 'story-ring', 'tile', 'post-btn', 'menu-panel', 'name-tag', 'photo-mask', 'skin-card-mask'],
    theme: { '--dark': '#f5f1ea', '--gray': '#b9b1a6', '--light-bg': '#1b1b1d', '--card': '#151517',
      '--border': 'rgba(255,255,255,.18)', '--nav-bg': '#141416' },
    fonts: 'https://fonts.googleapis.com/css2?family=Bangers&family=Barlow+Semi+Condensed:ital,wght@0,500;0,700;1,700&display=swap'
  };
  FULL_SKINS.witchcraft = {
    name: 'Witchcraft', dark: true, ink: '#efe4d6', muted: '#bfae9c', accent: '#c94cff',
    font: "'Cormorant Garamond', serif", titleFont: "'Cormorant Garamond', serif",
    timeline: 4, avatar: 'center', slice: 15, edge: 16,
    // traced from the approved concept (prototypes/witchcraft-redraw-brief.md → kit/redraw-a + redraw-b)
    assets: ['icon-like-on', 'icon-dislike-on', 'header', 'cobweb-corner', 'nav-glow', 'tab', 'tab-active', 'post-panel', 'photo-arch', 'quests-frame',
      'quest-card', 'potion-0', 'potion-50', 'potion-100', 'coin-goal-bar', 'goal-track', 'goal-fill', 'composer',
      'featured-frame', 'story-ring', 'story-add', 'avatar-ring', 'tarot-card', 'cover-arches', 'stats-arch',
      'plaque-btn', 'shelf-cat', 'shelf-cauldron', 'shelf-skull', 'candle', 'list-row', 'join-btn', 'gem', 'skin-card',
      'price-pill', 'equipped-pill', 'bubble-in', 'bubble-out', 'chat-window', 'field', 'input-bar', 'menu-panel',
      'name-ribbon', 'avatar-arch', 'tile', 'post-btn', 'tab-bar',
      'tarot-card-mask', 'photo-arch-mask', 'skin-card-mask', 'avatar-arch-mask', 'featured-frame-mask',
      // Part C (everything A+B missed): icons, buttons, badges, per-page shelves
      'action-btn', 'action-btn-active',
      'avatar-arch-small', 'back-badge', 'camera-badge', 'coin', 'coin-pill', 'icon-add-circle', 'icon-back', 'icon-bell',
      'icon-block', 'icon-btn', 'icon-camera', 'icon-check', 'icon-chevron', 'icon-chevron-down', 'icon-clear',
      'icon-close', 'icon-comment', 'icon-compose', 'icon-dislike', 'icon-emoji', 'icon-gif', 'icon-globe', 'icon-heart',
      'icon-like', 'icon-more', 'icon-music', 'icon-mute', 'icon-phone', 'icon-photo', 'icon-plus', 'icon-poll',
      'icon-reply', 'icon-report', 'icon-schedule', 'icon-search', 'icon-send', 'icon-share', 'ledge-candles',
      'moon-ornament', 'nav-shelf', 'notif-comment', 'notif-follow', 'notif-group', 'notif-like', 'notif-mention',
      'notif-message', 'notif-purchase', 'pentagram-medallion', 'pentagram-sigil', 'post-card', 'public-pill',
      'quests-shelf', 'react-badge', 'sconce-candle', 'seg-tab', 'seg-tab-active', 'shelf-chat', 'shelf-groups',
      'shelf-messages', 'shelf-network', 'shelf-notifications', 'shelf-post', 'shelf-rail', 'shelf-search', 'sparkle',
      'stat-box', 'text-area', 'top-bar', 'triple-moon', 'witch-hat', 'avatar-arch-small-mask'],
    theme: { '--dark': '#efe4d6', '--gray': '#bfae9c', '--light-bg': '#140f16', '--card': '#1b141d',
      '--border': 'rgba(201,160,110,.28)', '--nav-bg': '#120d13' },
    fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap'
  };
  FULL_SKINS['good-witch'] = {
    name: 'Good Witch', dark: false, ink: '#4a2c6b', muted: '#8a76a6', accent: '#a77bf0',
    font: "'Cormorant Garamond', serif", titleFont: "'Cormorant Garamond', serif",
    timeline: 3, avatar: 'center', slice: 15, edge: 16,
    // owner (Nov 15): the day art is very bright, so two renditions — Day (assets/ root) and Night (assets/night/)
    variants: [
      { id: 'day', name: 'Day', accent: '#a77bf0', swatch: '#efe4ff' },
      { id: 'night', name: 'Night', accent: '#c9a6ff', swatch: '#2a1b52', dark: true, ink: '#f1e8ff', muted: '#b9a7d9',
        theme: { '--dark': '#f1e8ff', '--gray': '#b9a7d9', '--light-bg': '#1a1236', '--card': '#241a45',
          '--border': 'rgba(214,190,140,.32)', '--nav-bg': '#171030' } }
    ],
    // traced from the approved concept (prototypes/good-witch-redraw-brief.md → kit/gw + kit/gw-night)
    assets: ['icon-like-on', 'icon-dislike-on', 'background', 'top-bar', 'corner-vine', 'nav-bar', 'nav-orb', 'nav-orb-active', 'coin', 'coin-pill',
      'icon-compose', 'icon-phone', 'icon-close', 'icon-reply', 'icon-react', 'icon-chevron', 'icon-check', 'icon-clear',
      'icon-photo', 'icon-gif', 'icon-poll', 'icon-schedule', 'icon-globe', 'icon-people-small', 'icon-mute', 'icon-block',
      'icon-report', 'icon-heart',
      'notif-like', 'notif-follow', 'notif-comment', 'notif-mention', 'notif-message', 'notif-group', 'notif-purchase',
      'quests-frame', 'constellation-a-0', 'constellation-a-50', 'constellation-a-100', 'constellation-b-0',
      'constellation-b-50', 'constellation-b-100', 'constellation-c-0', 'constellation-c-50', 'constellation-c-100',
      'tab-underline', 'post-panel', 'photo-frame', 'story-ring', 'story-add', 'composer', 'featured-frame', 'arrow-orb',
      'goal-track', 'goal-fill', 'coin-goal-bar', 'moon-frame', 'photo-bubble', 'avatar-ring', 'camera-badge',
      'stats-frame', 'edit-btn', 'owl-cloud', 'star-frame', 'follow-btn', 'action-tile', 'menu-panel', 'list-row',
      'join-btn', 'chip', 'chip-active', 'seg-tab', 'seg-tab-active', 'unread-gem', 'skin-card', 'skin-card-wide',
      'equipped-tag', 'bubble-in', 'bubble-out', 'input-bar', 'send-orb', 'plus-orb', 'field', 'text-area', 'public-pill',
      'tool-tile', 'post-btn', 'comment-bubble', 'reply-line', 'story-field', 'heart-orb', 'owl-crystal', 'moon-clouds',
      // enchantment pass (owner: more elaborate): per-page prop scenes, crest, vines, sparkle trail, name banner
      'page-deco-groups', 'page-deco-skins', 'page-deco-network', 'page-deco-notifications', 'page-deco-search',
      'page-deco-post', 'page-deco-messages', 'corner-vine-right', 'title-crest', 'sparkle-trail', 'name-banner', 'star-frame-mask', 'header', 'photo-crest', 'quest-card', 'toggle-sun', 'toggle-moon', 'photo-bubble-ornate'],
    theme: { '--dark': '#4a2c6b', '--gray': '#8a76a6', '--light-bg': '#f3ecff', '--card': '#fbf8ff',
      '--border': 'rgba(176,140,90,.35)', '--nav-bg': '#f3ecff' },
    fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap'
  };
  FULL_SKINS.vaporwave = {
    name: 'Vaporwave', dark: false, ink: '#1d1640', muted: '#5d5784', accent: '#ff4fc8',
    font: "Verdana, 'DejaVu Sans', sans-serif", titleFont: "Verdana, 'DejaVu Sans', sans-serif",
    timeline: 4, avatar: 'center', slice: 15, edge: 16,
    tlLabels: ['PLAY \u25B6\nPM 08:47\nAPR 21 1995', 'PM 11:02\nAPR 21 1995', 'PM 10:23\nAPR 21 1995', 'PM 05:17\nAPR 21 1995'],
    // owner (Nov 15): "retro then modern, keeping it semi Windows / OS themed" + a dark mode for both.
    // Retro = 1995 desktop (assets/ root, concept.png); Modern = blue frosted-glass OS (assets/modern/, concept-modern.png).
    // Dark renditions (retro-dark / modern-dark) join once their concepts are approved. Top bar: OS switch + sun/moon.
    variants: [
      { id: 'retro', name: 'Retro', accent: '#ff4fc8', swatch: '#c8c8d0' },
      { id: 'modern', name: 'Modern', accent: '#18b8ff', swatch: '#5ad1ff', ink: '#0f2a5c', muted: '#4c6a96' },
      { id: 'retro-dark', name: 'Retro Dark', accent: '#ff4fc8', swatch: '#2a2533', dark: true, ink: '#f2ecff', muted: '#b9b0cf',
        theme: { '--dark': '#f2ecff', '--gray': '#b9b0cf', '--light-bg': '#19161f', '--card': '#26222e',
          '--border': 'rgba(255,79,200,.3)', '--nav-bg': '#1d1a24' } },
      { id: 'modern-dark', name: 'Modern Dark', accent: '#3fd0ff', swatch: '#0d1f3d', dark: true, ink: '#e6f6ff', muted: '#9dbcd9',
        theme: { '--dark': '#e6f6ff', '--gray': '#9dbcd9', '--light-bg': '#0a1730', '--card': '#10264a',
          '--border': 'rgba(63,208,255,.3)', '--nav-bg': '#0b1a35' } }
    ],
    // generic engine slots → the traced pieces (prototypes/vaporwave-redraw-brief.md)
    parts: { 'panel-card': 'panel', 'panel-card-active': 'window-pink', 'btn-primary': 'btn-pink', 'btn-secondary': 'btn',
      'btn-round': 'top-btn', 'nav-active': 'nav-tab-active', 'header-bar': 'header-page', 'timeline-frame': 'vhs-window',
      'avatar-frame': 'avatar-window', 'post-frame': 'panel', 'icon-coin': 'coin', 'quest-0': 'progress-track',
      'quest-50': 'progress-track', 'quest-100': 'progress-fill', 'thumb': 'featured-banner' },
    assets: ['icon-dislike-on', 'add-photo', 'avatar-window', 'badge-count', 'btn-pink', 'btn', 'bubble-in', 'bubble-out', 'camera-badge',
      'chip-active', 'chip', 'coin-pill', 'coin-stack', 'coin', 'featured-banner', 'field', 'header-home', 'header-page',
      'header-profile', 'icon-block', 'icon-chat', 'icon-check', 'icon-close', 'icon-compose', 'icon-gif', 'icon-like-on',
      'icon-mute', 'icon-phone', 'icon-photo', 'icon-poll', 'icon-react', 'icon-reply', 'icon-report', 'icon-schedule',
      'icon-shop', 'inset-row', 'list-row', 'menu-panel', 'nav-tab-active', 'nav-tab', 'notif-comment', 'notif-follow',
      'notif-group', 'notif-like', 'notif-mention', 'notif-message', 'notif-purchase', 'panel', 'photo-frame', 'plus-btn',
      'profile-window', 'progress-fill', 'progress-track', 'quest-icon-like', 'quest-icon-react', 'quest-icon-send',
      'send-btn', 'start-btn', 'stats-divider', 'story-add', 'story-ring', 'tab-active', 'tab', 'title-btns',
      'title-comments', 'title-create-post', 'title-groups', 'title-messages', 'title-network', 'title-notifications',
      'title-post', 'title-profile', 'title-search', 'title-skins', 'tool-tile', 'top-btn', 'trophy', 'unread-dot',
      'vhs-overlay', 'vhs-window', 'window-pink', 'window', 'wordmark', 'toggle-retro', 'toggle-modern', 'toggle-sun',
      'toggle-moon'],
    theme: { '--dark': '#1d1640', '--gray': '#5d5784', '--light-bg': '#ecebf2', '--card': '#d4d4dc',
      '--border': 'rgba(40,30,90,.35)', '--nav-bg': '#d4d4dc' },
    fonts: 'https://fonts.googleapis.com/css2?family=VT323&display=swap'
  };
  FULL_SKINS['heavens-light'] = {
    name: "Heaven's Light", dark: false, ink: '#4a3416', muted: '#8a7350', accent: '#c9962e',
    font: "'Cormorant Garamond', serif", titleFont: "'Cinzel', serif",
    timeline: 3, avatar: 'center', slice: 15, edge: 16,
    // owner (Nov 16): two renditions — Day (assets/ root, concept-v1-approved.png) and Twilight (assets/twilight/,
    // concept-twilight*.png), same file names in both folders
    variants: [
      { id: 'day', name: 'Day', accent: '#c9962e', swatch: '#fff4dc' },
      { id: 'twilight', name: 'Twilight', accent: '#e8b74a', swatch: '#2c3456', dark: true, ink: '#f6ecd6', muted: '#c9bda4',
        theme: { '--dark': '#f6ecd6', '--gray': '#c9bda4', '--light-bg': '#1d2340', '--card': '#3a4260',
          '--border': 'rgba(232,183,74,.35)', '--nav-bg': '#1d2340' } }
    ],
    // traced from the approved concept (prototypes/heavens-light-redraw-brief.md → kit/hl → assets/)
    parts: { 'panel-card': 'post-panel', 'panel-card-active': 'post-panel', 'btn-primary': 'follow-btn',
      'btn-secondary': 'action-btn', 'btn-round': 'round-btn', 'header-bar': 'top-bar', 'post-frame': 'post-panel',
      'icon-coin': 'coin', 'quest-0': 'halo-0', 'quest-50': 'halo-50', 'quest-100': 'halo-100' },
    assets: ['icon-dislike-on', 'background', 'header', 'top-bar', 'title-laurel', 'wings-crest', 'nav-bar', 'nav-active',
      'icon-home-on', 'icon-groups-on', 'icon-skins-on', 'icon-network-on', 'icon-messages-on', 'coin', 'coin-pill',
      'corner-column-left', 'corner-column-right',
      'icon-compose', 'icon-phone', 'icon-close', 'icon-like-on', 'icon-reply', 'icon-react', 'icon-chevron', 'icon-check',
      'icon-clear', 'icon-photo', 'icon-gif', 'icon-poll', 'icon-schedule', 'icon-globe', 'icon-mute', 'icon-block',
      'icon-report', 'icon-heart', 'icon-star', 'icon-gift', 'badge-count',
      'notif-like', 'notif-follow', 'notif-comment', 'notif-mention', 'notif-message', 'notif-group', 'notif-purchase',
      'avatar-wings', 'quests-frame', 'quest-row', 'halo-0', 'halo-50', 'halo-100', 'goal-track', 'goal-fill',
      'reward-pill', 'tab', 'tab-active', 'story-ring', 'story-add', 'composer', 'featured-frame', 'coin-goal-frame',
      'coin-stack', 'post-panel', 'post-panel-b', 'post-panel-c', 'photo-frame', 'action-strip',
      'temple-arches', 'temple-arch-mask', 'cameo-wings', 'cameo-mask', 'camera-badge', 'laurel-sprig', 'stats-frame',
      'edit-btn', 'follow-btn', 'action-btn', 'menu-panel', 'marble-ledge',
      'list-row', 'join-btn', 'chip', 'chip-active', 'seg-tab', 'seg-tab-active', 'unread-dot', 'plus-btn', 'field',
      'skin-card', 'skin-card-mask', 'price-pill', 'equipped-tag', 'bubble-in', 'bubble-out', 'input-bar', 'send-btn',
      'round-btn', 'comment-bubble', 'text-area', 'tool-tile', 'post-btn', 'public-pill', 'story-field', 'heart-orb',
      'sun-orb', 'like-orb', 'group-avatar-frame',
      'page-deco-groups', 'page-deco-skins', 'page-deco-network', 'page-deco-notifications', 'page-deco-search',
      'page-deco-messages', 'page-deco-post', 'title-crest', 'avatar-ring', 'toggle-day', 'toggle-twilight', 'laurel-sprig-r'],
    theme: { '--dark': '#4a3416', '--gray': '#8a7350', '--light-bg': '#f7efe0', '--card': '#fffaf0',
      '--border': 'rgba(176,130,50,.35)', '--nav-bg': '#f7efe0' },
    fonts: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap'
  };
  window.FULL_SKINS = FULL_SKINS;

  // Absolute: a relative url() inside a custom property resolves against the stylesheet that
  // uses it (css/), not the page, so 'images/...' would become css/images/... and 404.
  // In the installed app the skin art is NOT in the update bundle (the OTA zip has a 50 MB limit and the art alone is
  // ~53 MB, which made the Nov 16 update fail to upload) — it loads from the website instead and the web view caches it.
  var NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  var BASE = new URL(window.FS_BASE || (NATIVE ? 'https://blipvibe.com/images/skins/' : 'images/skins/'), document.baseURI).href;
  var active = null;
  var loadedFonts = {};

  // colour option in use for the active skin (null = the skin's default art, at assets/ root)
  var variant = null;
  function url(id, part) {
    var dir = variant ? variant + '/' : '';
    return 'url("' + BASE + id + '/assets/' + dir + part + '.webp")';
  }
  // the colour option to show for skin `id`: yours, or the viewed person's while on their profile
  function pickVariant(id) {
    var cfg = FULL_SKINS[id];
    if (!cfg || !cfg.variants) return null;
    var v = data().variant ? data().variant(id) : null;
    var known = cfg.variants.map(function (x) { return x.id; });
    if (!v || known.indexOf(v) < 0) v = known[0];
    return v === known[0] ? null : v;           // first option = the art at assets/ root
  }

  function loadFonts(cfg) {
    if (!cfg.fonts || loadedFonts[cfg.fonts]) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = cfg.fonts;
    document.head.appendChild(l);
    loadedFonts[cfg.fonts] = true;
  }

  /* Shop extras a full skin overrides (spec: shop-item policy): layout templates (body.tpl-*),
   * nav styles (body.nav-*) are taken off while the skin is on and put back when it comes off. The
   * app can re-add them at any time (profile view, try-on), so an observer keeps them off. */
  // also the custom-premium-background styling (body.has-premium-bg, ~50 rules painting see-through panels):
  // a full skin brings its own background, so that class is kept off too
  var SUSPEND = /^(tpl|nav)-|^has-premium-bg$/;
  var suspended = [];
  var observer = null;
  function suspendExtras() {
    var b = document.body;
    [].slice.call(b.classList).forEach(function (c) {
      // phones always run the Cinema template — it IS the mobile layout (app.js applyTemplate), keep it
      if (c === 'tpl-cinema' && window.innerWidth <= 768) return;
      if (SUSPEND.test(c)) {
        b.classList.remove(c);
        suspended = suspended.filter(function (x) { return !SUSPEND.test(x) || x.split('-')[0] !== c.split('-')[0]; });
        suspended.push(c);
      }
    });
  }
  function startSuspending() {
    suspendExtras();
    if (!observer && window.MutationObserver) {
      observer = new MutationObserver(function () { if (active) suspendExtras(); });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }
  function restoreExtras() {
    if (observer) { observer.disconnect(); observer = null; }
    var b = document.body;
    suspended.forEach(function (c) { b.classList.add(c); });
    suspended = [];
  }

  // Day/Night toggle (skins whose variants are a 'day' + 'night' pair, e.g. Good Witch): a sun/moon button next to search
  // in the top bar. Sun = Day showing; tapping it saves Night (same path as the shop's colour swatches) and vice versa.
  function dayNightToggle(id, cfg) {
    var old = document.getElementById('fsDayNight');
    if (old) old.remove();
    var oldLamp = document.getElementById('fsLamp');
    if (oldLamp) oldLamp.remove();
    var ids = (cfg && cfg.variants || []).map(function (x) { return x.id; });
    if (ids.length < 2) return;
    var search = document.getElementById('mobileSearchBtn');
    if (!search || !search.parentNode) return;
    if (ids.indexOf('retro') >= 0 && ids.indexOf('modern') >= 0) {
      // Vaporwave: OS switch (Retro <-> Modern, keeps light/dark) + sun/moon (light <-> dark, keeps the OS) when the
      // dark renditions exist. Variant ids: retro, modern, retro-dark, modern-dark.
      var cv = variant || ids[0], os = cv.indexOf('modern') === 0 ? 'modern' : 'retro', drk = /-dark$/.test(cv);
      function vid(o, d) { var v = o + (d ? '-dark' : ''); return ids.indexOf(v) >= 0 ? v : o; }
      var osBtn = document.createElement('button');
      osBtn.id = 'fsDayNight'; osBtn.type = 'button';
      osBtn.className = 'fs-daynight fs-os-btn is-' + os;
      osBtn.setAttribute('aria-label', os === 'retro' ? 'Update to XP' : 'Roll back to 95');
      osBtn.innerHTML = '<i></i>';
      osBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation();
        vaporSwap(osBtn, id, vid(os === 'retro' ? 'modern' : 'retro', drk), 'os'); });
      search.parentNode.insertBefore(osBtn, search);
      if (ids.indexOf('retro-dark') >= 0 || ids.indexOf('modern-dark') >= 0) {
        var lm = document.createElement('button');
        lm.id = 'fsLamp'; lm.type = 'button'; lm.className = 'fs-daynight fs-lamp-btn ' + (drk ? 'is-night' : 'is-day');
        lm.setAttribute('aria-label', drk ? 'Switch to light' : 'Switch to dark');
        lm.innerHTML = '<i></i>';
        lm.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); vaporSwap(lm, id, vid(os, !drk), 'lamp'); });
        search.parentNode.insertBefore(lm, search);
      }
      return;
    }
    if (ids.indexOf('day') >= 0 && ids.indexOf('twilight') >= 0) {
      // Heaven's Light: a winged sun (Day) / winged crescent (Twilight); tap = the sun sets / the moon rises (heavenSwap)
      var tw = variant === 'twilight', hb = document.createElement('button');
      hb.id = 'fsDayNight'; hb.type = 'button'; hb.className = 'fs-daynight fs-hl-btn ' + (tw ? 'is-twilight' : 'is-day');
      hb.setAttribute('aria-label', tw ? 'Switch to Day' : 'Switch to Twilight');
      hb.innerHTML = '<i></i>';
      hb.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); heavenSwap(id, tw ? 'day' : 'twilight'); });
      search.parentNode.insertBefore(hb, search);
      return;
    }
    if (ids.indexOf('day') < 0 || ids.indexOf('night') < 0) {
      // any other skin with options (e.g. Anime Blaze colours): a swatch of the current colour; each tap = next colour
      var cur = variant || ids[0], i = ids.indexOf(cur), nxt = ids[(i + 1) % ids.length];
      var vc = cfg.variants[i] || cfg.variants[0], vn = cfg.variants[(i + 1) % ids.length];
      var sw = document.createElement('button');
      sw.id = 'fsDayNight';
      sw.type = 'button';
      sw.className = 'fs-daynight fs-swatch-btn';
      sw.style.setProperty('--sw', vc.swatch || vc.accent);
      sw.style.setProperty('--sw2', vn.swatch || vn.accent);
      sw.setAttribute('aria-label', 'Colour: ' + vc.name + '. Switch to ' + vn.name);
      sw.innerHTML = '<i></i>';
      sw.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); magicSwap(sw, id, nxt); });
      search.parentNode.insertBefore(sw, search);
      return;
    }
    var isNight = variant === 'night';
    var btn = document.createElement('button');
    btn.id = 'fsDayNight';
    btn.type = 'button';
    btn.className = 'fs-daynight ' + (isNight ? 'is-night' : 'is-day');
    btn.setAttribute('aria-label', isNight ? 'Switch to day' : 'Switch to night');
    btn.innerHTML = '<i class="fas ' + (isNight ? 'fa-moon' : 'fa-sun') + '"></i>';
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      magicSwap(btn, id, isNight ? 'day' : 'night');
    });
    search.parentNode.insertBefore(btn, search);
  }

  // The Day/Night swap (owner: "a magical swap, not a slow fade"): a burst of gold sparkles from the button and a circle
  // of the new sky sweeping out over the screen; the skin switches underneath once the new art has loaded, then the sky
  // dissolves away in a shimmer.
  var swapping = false;
  // Anime Blaze colour swap (owner, Nov 15: "super crazy", not the Good Witch reveal): manga power-up.
  // charge (speed lines rush in, screen shakes) -> IMPACT (white flash, comic burst, lightning bolt across the screen in
  // the new colour) -> the screen splits open along the bolt as a jagged band and the new colour floods out, with
  // shockwaves, halftone dots, embers and speed lines bursting outward.
  function blazeSwap(btn, id, next) {
    if (swapping) return;
    swapping = true;
    var vs = FULL_SKINS[id].variants, nv = vs.filter(function (x) { return x.id === next; })[0] || vs[0];
    var dir = next === vs[0].id ? '' : next + '/', base = BASE + id + '/assets/' + dir;
    function load(n) { return new Promise(function (ok) { var i = new Image(); i.onload = i.onerror = function () { ok(i); }; i.src = base + n + '.webp'; }); }
    var pre = ['background', 'header', 'panel9', 'navbar', 'nav-bar', 'post-panel', 'stat-box', 'cover-frame'].map(load);
    var br = btn.getBoundingClientRect(), cx = br.left + br.width / 2, cy = br.top + br.height / 2;
    var W = innerWidth, H = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2), D = Math.hypot(W, H);
    var hex = /^#[0-9a-f]{6}$/i.test(nv.accent || '') ? nv.accent : '#e8321e';
    var R = parseInt(hex.substr(1, 2), 16), G = parseInt(hex.substr(3, 2), 16), B = parseInt(hex.substr(5, 2), 16);
    function col(a) { return 'rgba(' + R + ',' + G + ',' + B + ',' + a + ')'; }
    var o = document.createElement('div');
    o.className = 'fs-swap fs-swap-blaze';
    var cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr; cv.className = 'fs-swap-canvas';
    o.appendChild(cv);
    var g = cv.getContext('2d'); g.scale(dpr, dpr);
    // the slash: from the button corner diagonally to the opposite corner, zig-zagging (same points every frame)
    var ex = cx < W / 2 ? W + 40 : -40, ey = H + 40, sx = cx, sy = cy;
    var ux = ex - sx, uy = ey - sy, L = Math.hypot(ux, uy); ux /= L; uy /= L;
    var px = -uy, py = ux, N = 14, zig = [];
    for (var i = 0; i <= N; i++) { var f = i / N, j = (i % 2 ? 1 : -1) * (i && i < N ? 18 + Math.random() * 26 : 0); zig.push([sx + ux * L * f + px * j, sy + uy * L * f + py * j]); }
    // extend the line off-screen both ways so the band covers everything when open
    zig.unshift([sx - ux * D, sy - uy * D]); zig.push([ex + ux * D, ey + uy * D]);
    function band(d) {   // polygon around the zig line, half-width d (same point count -> smooth animation)
      var up = zig.map(function (q) { return (q[0] + px * d).toFixed(1) + 'px ' + (q[1] + py * d).toFixed(1) + 'px'; });
      var dn = zig.slice().reverse().map(function (q) { return (q[0] - px * d).toFixed(1) + 'px ' + (q[1] - py * d).toFixed(1) + 'px'; });
      return 'polygon(' + up.concat(dn).join(',') + ')';
    }
    var lines = [], embers = [], k;
    for (k = 0; k < 90; k++) lines.push({ a: Math.random() * Math.PI * 2, w: 1 + Math.random() * 5, r0: .35 + Math.random() * .4, l: .2 + Math.random() * .5 });
    for (k = 0; k < 70; k++) { var an = Math.random() * Math.PI * 2, v = 4 + Math.random() * 16; embers.push({ x: cx, y: cy, vx: Math.cos(an) * v, vy: Math.sin(an) * v, s: 2 + Math.random() * 5, hot: Math.random() < .4 }); }
    function burst(x, y, r, spikes, rot) {
      g.beginPath();
      for (var i = 0; i < spikes * 2; i++) { var aa = rot + i / (spikes * 2) * Math.PI * 2, rr = i % 2 ? r * .55 : r * (0.85 + ((i * 37) % 10) / 30); g.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); }
      g.closePath();
    }
    function bolt(w, a) {   // the lightning slash itself
      g.save(); g.lineJoin = 'miter'; g.lineCap = 'round';
      var path = function () { g.beginPath(); for (var i = 1; i < zig.length - 1; i++) g.lineTo(zig[i][0], zig[i][1]); };
      g.globalAlpha = a; g.strokeStyle = col(.9); g.lineWidth = w * 3.2; g.shadowColor = col(1); g.shadowBlur = 30; path(); g.stroke();
      g.shadowBlur = 0; g.strokeStyle = '#111'; g.lineWidth = w * 1.7; path(); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = w; path(); g.stroke();
      g.restore();
    }
    var CH = 300, IMP = CH, OPEN = 900, END = CH + 1500, t0;
    function draw(now) {
      var t = now - t0; g.clearRect(0, 0, W, H);
      if (t < CH) {          // charge: lines rush INTO the button, a growing glow
        var c = t / CH;
        g.strokeStyle = 'rgba(255,255,255,.85)';
        lines.forEach(function (q) { var r1 = D * (1.1 - c * q.r0), r2 = r1 - D * q.l * .5; g.lineWidth = q.w; g.beginPath(); g.moveTo(cx + Math.cos(q.a) * r1, cy + Math.sin(q.a) * r1); g.lineTo(cx + Math.cos(q.a) * r2, cy + Math.sin(q.a) * r2); g.stroke(); });
        var rg = g.createRadialGradient(cx, cy, 0, cx, cy, 30 + 90 * c); rg.addColorStop(0, 'rgba(255,255,255,' + c + ')'); rg.addColorStop(.4, col(.8 * c)); rg.addColorStop(1, col(0));
        g.fillStyle = rg; g.fillRect(0, 0, W, H);
      } else {
        var p = t - IMP;
        // impact flash (white, then a frame of the new colour)
        if (p < 90) { g.fillStyle = 'rgba(255,255,255,' + (1 - p / 90 * .4) + ')'; g.fillRect(0, 0, W, H); }
        else if (p < 170) { g.fillStyle = col(.55 * (1 - (p - 90) / 80)); g.fillRect(0, 0, W, H); }
        // speed lines bursting OUT
        var q1 = Math.min(1, p / 700);
        if (q1 < 1) {
          g.strokeStyle = 'rgba(255,255,255,' + (1 - q1) + ')';
          lines.forEach(function (q) { var r1 = 40 + D * q1 * (q.r0 + .4), r2 = r1 + D * q.l * (1 - q1 * .5); g.lineWidth = q.w * (1.4 - q1); g.beginPath(); g.moveTo(cx + Math.cos(q.a) * r1, cy + Math.sin(q.a) * r1); g.lineTo(cx + Math.cos(q.a) * r2, cy + Math.sin(q.a) * r2); g.stroke(); });
        }
        // jagged shockwaves
        [0, 140, 280].forEach(function (dl, n) {
          var s = (p - dl) / 650; if (s <= 0 || s >= 1) return;
          burst(cx, cy, 30 + s * D * .9, 16, n + s); g.lineWidth = 10 * (1 - s) + 1; g.strokeStyle = n === 1 ? 'rgba(255,255,255,' + (1 - s) + ')' : col(1 - s); g.stroke();
        });
        // comic impact burst + halftone at the button
        var bs = Math.min(1, p / 120), bf = p < 420 ? 1 : Math.max(0, 1 - (p - 420) / 260);
        if (bf > 0) {
          g.save(); g.globalAlpha = bf;
          burst(cx, cy, 30 + 120 * bs, 12, .3); g.fillStyle = col(1); g.fill(); g.lineWidth = 5; g.strokeStyle = '#111'; g.stroke();
          burst(cx, cy, 18 + 70 * bs, 10, .1); g.fillStyle = '#fff8d8'; g.fill();
          g.fillStyle = 'rgba(17,17,17,.55)';
          for (var yy = -150; yy <= 150; yy += 11) for (var xx = -150; xx <= 150; xx += 11) { var dd = Math.hypot(xx, yy); if (dd > 60 * bs && dd < 150 * bs) { g.beginPath(); g.arc(cx + xx, cy + yy, 2.6 * (1 - dd / 160), 0, 6.283); g.fill(); } }
          g.restore();
        }
        // the lightning slash, sparking while the band opens
        var bp = Math.min(1, p / 160), ba = p < 600 ? 1 : Math.max(0, 1 - (p - 600) / 500);
        if (ba > 0) bolt(6 * bp + (p < 600 ? Math.random() * 3 : 0), ba);
        // band edges glow in the new colour while it opens
        var o2 = Math.min(1, p / OPEN);
        if (o2 < .7) { g.save(); g.globalAlpha = 1 - o2 / .7; var dd2 = D * openEase(o2); [-1, 1].forEach(function (sg) { g.beginPath(); zig.forEach(function (q) { g.lineTo(q[0] + px * dd2 * sg, q[1] + py * dd2 * sg); }); g.strokeStyle = col(1); g.lineWidth = 10; g.shadowColor = col(1); g.shadowBlur = 16; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.shadowBlur = 0; g.stroke(); }); g.restore(); }
        // embers
        embers.forEach(function (e) { e.x += e.vx; e.y += e.vy; e.vy += .25; e.vx *= .985; var fa = Math.max(0, 1 - p / 1300); if (!fa) return; g.fillStyle = e.hot ? 'rgba(255,250,220,' + fa + ')' : col(fa); g.fillRect(e.x, e.y, e.s, e.s * 2.4); });
      }
      if (t < END) requestAnimationFrame(draw); else finish();
    }
    function openEase(x) { return x < .12 ? x * .5 : .06 + Math.pow((x - .12) / .88, 2.2) * .94; }
    function finish() { o.remove(); swapping = false; }
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    Promise.all(pre).then(function () {
      if (reduce) { if (data().setVariant) data().setVariant(id, next); swapping = false; return; }
      document.documentElement.appendChild(o);
      t0 = performance.now(); requestAnimationFrame(draw);
      setTimeout(function () {   // IMPACT: swap colour behind the flash
        if (!document.startViewTransition) { if (data().setVariant) data().setVariant(id, next); return; }
        o.remove(); o.style.viewTransitionName = 'fs-swap-glow';
        var vt = document.startViewTransition(function () { if (data().setVariant) data().setVariant(id, next); document.documentElement.appendChild(o); });
        vt.ready.then(function () {
          var steps = [], n = 12;
          for (var i = 0; i <= n; i++) steps.push(band(D * openEase(i / n)));
          document.documentElement.animate({ clipPath: steps }, { duration: OPEN, easing: 'linear', fill: 'forwards', pseudoElement: '::view-transition-new(root)' });
          var sh = []; for (var s2 = 0; s2 < 10; s2++) { var m = 14 * (1 - s2 / 10); sh.push({ transform: 'translate(' + ((Math.random() - .5) * m).toFixed(1) + 'px,' + ((Math.random() - .5) * m).toFixed(1) + 'px) scale(' + (1 + .03 * (1 - s2 / 10)) + ')' }); }
          sh.push({ transform: 'none' });
          document.documentElement.animate(sh, { duration: 520, easing: 'linear', pseudoElement: '::view-transition-old(root)' });
          document.documentElement.animate(sh, { duration: 620, easing: 'linear', pseudoElement: '::view-transition-new(root)' });
        }).catch(function () {});
      }, CH);
    });
  }

  // Vaporwave swaps — owner (Nov 16): every skin's animations are its OWN, never borrowed from another skin.
  //  'lamp' (light <-> dark, same in Retro and Modern): VHS tape — a tracking band rolls down the screen with the new
  //         look behind it, "PLAY ▶" on-screen text in the corner.
  //  'os'   (Retro <-> Modern): a system-update LOADING BAR screen (loadingUpdate below).
  function vaporSwap(btn, id, next, kind) {
    if (swapping) return;
    swapping = true;
    var vs = FULL_SKINS[id].variants, nv = vs.filter(function (x) { return x.id === next; })[0] || vs[0];
    var dir = next === vs[0].id ? '' : next + '/', base = BASE + id + '/assets/' + dir;
    function load(n) { return new Promise(function (ok) { var i = new Image(); i.onload = i.onerror = function () { ok(i); }; i.src = base + n + '.webp'; }); }
    var pre = ['background', 'header-home', 'header-page', 'window', 'panel', 'nav-bar', 'nav-tab', 'list-row'].map(load);
    var W = innerWidth, H = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var o = document.createElement('div'); o.className = 'fs-swap fs-swap-vapor';
    var cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; cv.className = 'fs-swap-canvas';
    o.appendChild(cv);
    var g = cv.getContext('2d'); g.scale(dpr, dpr);
    var tint = nv.id.indexOf('modern') === 0 ? '90,210,255' : '255,79,200';
    function finish() { o.remove(); swapping = false; }
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // owner (Nov 15): Retro <-> Modern should "look like an update — glitchy pixel look". The screen glitches (RGB-split
    // slices tearing sideways), breaks into pixel blocks that fill the screen while a little update window installs,
    // the new OS loads underneath, then the blocks fall away in random order with a last glitch.
    function pixelUpdate() {
      document.documentElement.appendChild(o);
      var T = 26, cols = Math.ceil(W / T), rows = Math.ceil(H / T), n = cols * rows, order = [], i;
      for (i = 0; i < n; i++) order.push(i);
      for (i = n - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      var rank = new Array(n); order.forEach(function (c, k) { rank[c] = k / n; });
      var up = next.indexOf('modern') === 0, dark = /-dark$/.test(next);
      var pal = up ? ['#0a2a6c', '#1c4fd8', '#18b8ff', '#5ad1ff', '#e6f6ff'] : ['#1d1640', '#0a1a8c', '#ff4fc8', '#c8c8d0', '#ffffff'];
      if (dark) pal = up ? ['#05101f', '#0d1f3d', '#1c4fd8', '#3fd0ff', '#0a2a6c'] : ['#120f18', '#26222e', '#3a1257', '#ff4fc8', '#0a1a8c'];
      var tileCol = []; for (i = 0; i < n; i++) tileCol.push(pal[(Math.random() * pal.length) | 0]);
      var GL = 420, FILL = 520, HOLD = 520, DROP = 620, END = GL + FILL + HOLD + DROP, swapped = false, t0 = performance.now();
      var label = up ? 'Installing update…' : 'Restoring classic mode…';
      function win(p) {   // little update window with a progress bar (pixel font, 90s chrome for Retro / glass for Modern)
        var w = Math.min(300, W - 40), h = 92, x = (W - w) / 2, y = H / 2 - h / 2;
        g.fillStyle = up ? 'rgba(10,30,70,.92)' : '#c8c8d0'; g.fillRect(x, y, w, h);
        g.fillStyle = up ? '#18b8ff' : '#0a1a8c'; g.fillRect(x, y, w, 22);
        g.fillStyle = '#fff'; g.font = '700 12px Verdana, sans-serif'; g.textBaseline = 'middle';
        g.fillText(up ? 'System Update' : 'Setup', x + 8, y + 11);
        g.fillStyle = up ? '#e6f6ff' : '#1d1640'; g.font = '13px Verdana, sans-serif'; g.fillText(label, x + 12, y + 40);
        g.fillStyle = up ? '#0d1f3d' : '#fff'; g.fillRect(x + 12, y + 56, w - 24, 20);
        var segs = Math.floor((w - 28) / 14), on = Math.floor(segs * Math.min(1, p));
        g.fillStyle = up ? '#3fd0ff' : '#ff4fc8';
        for (var k = 0; k < on; k++) g.fillRect(x + 14 + k * 14, y + 58, 12, 16);
        g.fillStyle = up ? '#e6f6ff' : '#1d1640'; g.font = '700 11px Verdana, sans-serif';
        g.fillText(Math.floor(Math.min(1, p) * 100) + '%', x + w - 44, y + 40);
      }
      function slices(a) {   // RGB-split tears
        for (var k = 0; k < 9; k++) {
          var y = Math.random() * H, h = 4 + Math.random() * 28, dx = (Math.random() - .5) * 60;
          g.fillStyle = 'rgba(255,0,110,' + (.35 * a) + ')'; g.fillRect(dx - 4, y, W, h);
          g.fillStyle = 'rgba(0,220,255,' + (.35 * a) + ')'; g.fillRect(dx + 4, y + 2, W, h);
          g.fillStyle = 'rgba(255,255,255,' + (.25 * a) + ')'; g.fillRect(0, y + h / 2, W, 1);
        }
      }
      (function draw(now) {
        var t = now - t0; g.clearRect(0, 0, W, H);
        if (t < GL) { slices(t / GL); document.documentElement.style.transform = 'translateX(' + ((Math.random() - .5) * 8).toFixed(1) + 'px)'; }
        else document.documentElement.style.transform = '';
        var cover;   // share of tiles drawn
        if (t < GL) cover = 0;
        else if (t < GL + FILL) cover = (t - GL) / FILL;
        else if (t < GL + FILL + HOLD) cover = 1;
        else cover = 1 - (t - GL - FILL - HOLD) / DROP;
        if (cover >= 1 && !swapped) { swapped = true; if (data().setVariant) data().setVariant(id, next); }
        if (cover > 0) for (var c = 0; c < n; c++) {
          if (rank[c] < cover) { g.fillStyle = tileCol[c]; g.fillRect((c % cols) * T, ((c / cols) | 0) * T, T, T); }
        }
        if (t > GL + FILL * .4 && t < GL + FILL + HOLD + DROP * .5) win(Math.min(1, (t - GL - FILL * .4) / (FILL * .6 + HOLD)));
        if (t > GL + FILL + HOLD && t < END) slices(.6 * (1 - (t - GL - FILL - HOLD) / DROP));
        if (t < END) requestAnimationFrame(draw); else { document.documentElement.style.transform = ''; finish(); }
      })(t0);
    }
    function loadingUpdate() {
      document.documentElement.appendChild(o);
      var up = next.indexOf('modern') === 0, dark = /-dark$/.test(next);
      var IN = 260, LOAD = 1900, OUT = 520, END = IN + LOAD + OUT, swapped = false, t0 = performance.now();
      var steps = up ? ['Checking system…', 'Downloading Vaporwave Modern…', 'Installing glass windows…', 'Updating icons…', 'Finishing up…']
                     : ['Preparing setup…', 'Copying files…', 'Installing classic windows…', 'Restoring Start menu…', 'Finishing up…'];
      // uneven progress like a real installer (stalls, then jumps)
      var marks = [[0, 0], [.12, .08], [.3, .31], [.42, .34], [.55, .58], [.7, .63], [.83, .9], [.93, .97], [1, 1]];
      function prog(x) { for (var i = 1; i < marks.length; i++) if (x <= marks[i][0]) { var a = marks[i - 1], b = marks[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return 1; }
      var T = 28, cols = Math.ceil(W / T), rows = Math.ceil(H / T), n = cols * rows, rank = [], i;
      for (i = 0; i < n; i++) rank.push(Math.random());
      function screen(alphaTiles) {   // the installer screen, drawn tile by tile so it can dissolve away at the end
        g.save();
        if (alphaTiles < 1) {
          g.beginPath(); for (var c = 0; c < n; c++) if (rank[c] < alphaTiles) g.rect((c % cols) * T, ((c / cols) | 0) * T, T, T); g.clip();
        }
        var bg = g.createLinearGradient(0, 0, 0, H);
        if (up) { bg.addColorStop(0, dark ? '#04122a' : '#0a2a6c'); bg.addColorStop(1, dark ? '#020812' : '#06183f'); }
        else { bg.addColorStop(0, dark ? '#120f1c' : '#08127a'); bg.addColorStop(1, dark ? '#0a0810' : '#050b4f'); }
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        g.restore();
      }
      function panel(p, step, a) {
        g.save(); g.globalAlpha = a;
        var w = Math.min(330, W - 36), h = 150, x = (W - w) / 2, y = H / 2 - h / 2;
        if (up) {   // modern: frosted rounded card, sleek glowing bar
          g.fillStyle = 'rgba(255,255,255,.08)'; g.strokeStyle = 'rgba(90,210,255,.55)'; g.lineWidth = 1.5;
          g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, 18); else g.rect(x, y, w, h); g.fill(); g.stroke();
          g.fillStyle = '#e6f6ff'; g.font = '700 17px Verdana, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'center';
          g.fillText('Updating BlipVibe', W / 2, y + 32);
          g.font = '13px Verdana, sans-serif'; g.fillStyle = '#9dd9ff'; g.fillText(step, W / 2, y + 58);
          var bx = x + 22, bw = w - 44, by = y + 84;
          g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); if (g.roundRect) g.roundRect(bx, by, bw, 12, 6); else g.rect(bx, by, bw, 12); g.fill();
          var gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#1c4fd8'); gr.addColorStop(1, '#3fd0ff');
          g.fillStyle = gr; g.shadowColor = '#3fd0ff'; g.shadowBlur = 14;
          g.beginPath(); if (g.roundRect) g.roundRect(bx, by, Math.max(12, bw * p), 12, 6); else g.rect(bx, by, bw * p, 12); g.fill();
          g.shadowBlur = 0; g.fillStyle = '#e6f6ff'; g.font = '700 14px Verdana, sans-serif'; g.fillText(Math.floor(p * 100) + '%', W / 2, y + 122);
        } else {    // retro: 90s setup window, segmented bar
          g.fillStyle = '#c8c8d0'; g.fillRect(x, y, w, h);
          g.fillStyle = '#fff'; g.fillRect(x, y, w, 2); g.fillRect(x, y, 2, h);
          g.fillStyle = '#555'; g.fillRect(x, y + h - 2, w, 2); g.fillRect(x + w - 2, y, 2, h);
          var tb = g.createLinearGradient(x, 0, x + w, 0); tb.addColorStop(0, '#0a1a8c'); tb.addColorStop(1, '#1c4fd8');
          g.fillStyle = tb; g.fillRect(x + 3, y + 3, w - 6, 24);
          g.fillStyle = '#fff'; g.font = '700 13px Verdana, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
          g.fillText('BlipVibe Setup', x + 10, y + 15);
          g.fillStyle = '#1d1640'; g.font = '13px Verdana, sans-serif'; g.fillText(step, x + 16, y + 52);
          var bx = x + 16, bw = w - 32, by = y + 72;
          g.fillStyle = '#fff'; g.fillRect(bx, by, bw, 24); g.fillStyle = '#7a7a86'; g.fillRect(bx, by, bw, 2); g.fillRect(bx, by, 2, 24);
          var seg = 14, gap = 3, cnt = Math.floor((bw - 6) / (seg + gap)), on = Math.floor(cnt * p);
          g.fillStyle = '#ff4fc8'; for (var k = 0; k < on; k++) g.fillRect(bx + 4 + k * (seg + gap), by + 4, seg, 16);
          g.fillStyle = '#1d1640'; g.font = '700 13px Verdana, sans-serif'; g.textAlign = 'center'; g.fillText(Math.floor(p * 100) + '% complete', W / 2, y + 120);
        }
        g.restore();
      }
      (function draw(now) {
        var t = now - t0; g.clearRect(0, 0, W, H);
        if (t < IN) {           // the old look glitches out into the installer
          screen(1); g.globalAlpha = 1;
          for (var k = 0; k < 10; k++) { var y = Math.random() * H, hh = 6 + Math.random() * 30; g.clearRect(0, y, W, hh * (1 - t / IN)); }
          panel(0, steps[0], t / IN);
        } else if (t < IN + LOAD) {
          var x = (t - IN) / LOAD, p = prog(x);
          screen(1); panel(p, steps[Math.min(steps.length - 1, Math.floor(x * steps.length))], 1);
          if (p >= 1 && !swapped) { swapped = true; if (data().setVariant) data().setVariant(id, next); }
        } else {                // installed: the screen dissolves away tile by tile to show the new OS
          if (!swapped) { swapped = true; if (data().setVariant) data().setVariant(id, next); }
          var q = 1 - (t - IN - LOAD) / OUT;
          screen(q); panel(1, steps[steps.length - 1], Math.max(0, q * 1.4 - .4));
        }
        if (t < END) requestAnimationFrame(draw); else finish();
      })(t0);
    }
    function noise(y0, h, a) {
      for (var k = 0; k < 220; k++) { var y = y0 + Math.random() * h; g.fillStyle = 'rgba(255,255,255,' + (Math.random() * a) + ')';
        g.fillRect(Math.random() * W, y, 4 + Math.random() * 60, 1 + Math.random() * 2); }
    }
    function scan(a) { g.fillStyle = 'rgba(0,0,0,' + a + ')'; for (var y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); }
    Promise.all(pre).then(function () {
      if (reduce) { if (data().setVariant) data().setVariant(id, next); swapping = false; return; }
      if (kind === 'os') return loadingUpdate();
      if (!document.startViewTransition) { if (data().setVariant) data().setVariant(id, next); swapping = false; return; }
      o.style.viewTransitionName = 'fs-swap-glow';
      var OFF = 380, ON = 620, BAND = 1100, t0;
      var vt = document.startViewTransition(function () { if (data().setVariant) data().setVariant(id, next); document.documentElement.appendChild(o); });
      vt.ready.then(function () {
        var de = document.documentElement;
        if (kind === 'os') {
          de.animate([{ transform: 'scale(1,1)', filter: 'brightness(1)' }, { transform: 'scale(1,.004)', filter: 'brightness(4) saturate(0)', offset: .85 },
            { transform: 'scale(0,.004)', filter: 'brightness(6)' }], { duration: OFF, easing: 'cubic-bezier(.6,0,.9,.4)', fill: 'forwards', pseudoElement: '::view-transition-old(root)' });
          de.animate([{ transform: 'scale(0,.004)', filter: 'brightness(6)', opacity: 1 }, { transform: 'scale(1,.004)', filter: 'brightness(4)', offset: .25 },
            { transform: 'scale(1,1.04)', filter: 'brightness(1.6) contrast(1.2)', offset: .7 }, { transform: 'scale(1,1)', filter: 'none' }],
            { duration: ON, delay: OFF + 90, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards', pseudoElement: '::view-transition-new(root)' });
        } else {
          var steps = []; for (var i = 0; i <= 12; i++) { var p = i / 12; steps.push({ clipPath: 'inset(0 0 ' + (100 - p * 100).toFixed(2) + '% 0)' }); }
          de.animate(steps, { duration: BAND, easing: 'linear', fill: 'forwards', pseudoElement: '::view-transition-new(root)' });
        }
        t0 = performance.now();
        (function draw(now) {
          var t = now - t0; g.clearRect(0, 0, W, H);
          if (kind === 'os') {
            if (t < OFF + 90) {                       // collapsing to the line, then the glowing dot/line + static
              var c = Math.min(1, t / OFF), lh = Math.max(2, H * (1 - c));
              g.fillStyle = 'rgba(255,255,255,' + (c * .9) + ')'; g.fillRect(0, H / 2 - lh / 2, W, lh * (c > .8 ? 1 : 0));
              var gl = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .7);
              gl.addColorStop(0, 'rgba(' + tint + ',' + (.55 * c) + ')'); gl.addColorStop(1, 'rgba(' + tint + ',0)');
              g.fillStyle = gl; g.fillRect(0, H / 2 - 40, W, 80);
              noise(0, H, .35 * c);
            } else {
              var p = (t - OFF - 90) / ON;                // powering on: scanlines, RGB split edges, fading static
              if (p < 1) {
                scan(.28 * (1 - p)); noise(0, H, .3 * (1 - p));
                var sh = 6 * (1 - p);
                g.fillStyle = 'rgba(255,0,90,' + (.18 * (1 - p)) + ')'; g.fillRect(-sh, 0, W, H);
                g.fillStyle = 'rgba(0,220,255,' + (.14 * (1 - p)) + ')'; g.fillRect(sh, 0, W, H);
              }
            }
            if (t < OFF + 90 + ON) requestAnimationFrame(draw); else finish();
          } else {
            var q = Math.min(1, t / BAND), yb = H * q;  // tracking band riding the reveal edge
            g.fillStyle = 'rgba(' + tint + ',.22)'; g.fillRect(0, yb - 26, W, 52);
            noise(yb - 30, 60, .9);
            g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(0, yb - 1, W, 2);
            scan(.12);
            g.fillStyle = '#fff'; g.font = '26px VT323, monospace'; g.textBaseline = 'top'; g.textAlign = 'left';
            g.shadowColor = '#000'; g.shadowBlur = 0; g.fillText((q < .5 ? '◀◀ REW' : 'PLAY ▶') + '  ' + (/-dark$/.test(next) ? 'NIGHT' : 'DAY'), 18, 70);
            if (q < 1) requestAnimationFrame(draw); else finish();
          }
        })(t0 = performance.now());
      }).catch(function () { finish(); });
    });
  }

  /* ---------- Vaporwave Start button (owner, Nov 16: "Start doesn't do anything — make it fun"): a real Start button on
     the taskbar opens a themed Start menu (shortcuts, Retro/Modern + Day/Night switches, a screensaver, and a joke
     Shut Down that switches the "monitor" off and boots straight back up). ---------- */
  function removeVaporStart() {
    ['fsStart', 'fsStartMenu', 'fsSaver', 'fsShutdown'].forEach(function (i) { var e = document.getElementById(i); if (e) e.remove(); });
  }
  function closeStartMenu() { var m = document.getElementById('fsStartMenu'); if (m) m.classList.remove('is-open'); var b = document.getElementById('fsStart'); if (b) b.classList.remove('is-on'); }
  function vaporStart() {
    var bar = document.querySelector('.nav-center');
    if (!bar || document.getElementById('fsStart')) return;
    var btn = document.createElement('button');
    btn.id = 'fsStart'; btn.type = 'button'; btn.className = 'fs-start-btn'; btn.innerHTML = '<span>Start</span>';
    btn.setAttribute('aria-label', 'Start menu');
    bar.insertBefore(btn, bar.firstChild);
    var dark = /-dark$/.test(variant || ''), modern = (variant || '').indexOf('modern') === 0;
    var items = [
      ['profile', 'icon-home', 'My Profile', function () { var e = document.getElementById('dropdownViewProfile'); if (e) e.click(); }],
      ['saved', 'icon-photo', 'Saved Posts', function () { var e = document.getElementById('dropdownSaved'); if (e) e.click(); }],
      ['skins', 'icon-skins', 'Skins', function () { var e = document.querySelector('.nav-link[data-page="shop"]'); if (e) e.click(); }],
      ['settings', 'icon-compose', 'Settings', function () {
        var a = Array.prototype.filter.call(document.querySelectorAll('#userDropdownMenu a'), function (x) { return /Settings/.test(x.textContent); })[0]; if (a) a.click(); }],
      '-',
      ['os', modern ? 'toggle-retro' : 'toggle-modern', modern ? 'Roll back to 95' : 'Update to XP', function () { var e = document.getElementById('fsDayNight'); if (e) e.click(); }],
      ['lamp', dark ? 'toggle-sun' : 'toggle-moon', dark ? 'Day Mode' : 'Night Mode', function () { var e = document.getElementById('fsLamp'); if (e) e.click(); }],
      ['saver', 'toggle-sun', 'Screensaver', vaporSaver],
      '-',
      ['shutdown', 'icon-close', 'Shut Down…', vaporShutdown]
    ];
    var m = document.createElement('div');
    m.id = 'fsStartMenu'; m.className = 'fs-start-menu';
    var html = '<div class="fs-start-side"><span>BlipVibe<b>' + (modern ? 'XP' : '95') + '</b></span></div><div class="fs-start-list">';
    items.forEach(function (it, k) {
      if (it === '-') { html += '<hr>'; return; }
      html += '<button type="button" data-k="' + k + '"><i style="background-image:var(--fs-' + it[1] + ')"></i>' + it[2] + '</button>';
    });
    m.innerHTML = html + '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]'); if (!b) return;
      e.preventDefault(); e.stopPropagation(); closeStartMenu();
      var it = items[+b.getAttribute('data-k')]; setTimeout(it[3], 120);
    });
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var open = !m.classList.contains('is-open'); m.classList.toggle('is-open', open); btn.classList.toggle('is-on', open);
    });
    if (!vaporStart._doc) {
      vaporStart._doc = true;
      document.addEventListener('click', function (e) { if (!e.target.closest('#fsStartMenu, #fsStart')) closeStartMenu(); }, true);
    }
  }
  // screensaver: starry synthwave grid with the skin's own art drifting and bouncing like an old desktop saver; tap to wake
  function vaporSaver() {
    if (document.getElementById('fsSaver')) return;
    var W = innerWidth, H = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var o = document.createElement('div'); o.id = 'fsSaver'; o.className = 'fs-saver';
    var cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; o.appendChild(cv);
    var hint = document.createElement('div'); hint.className = 'fs-saver-hint'; hint.textContent = 'tap to wake'; o.appendChild(hint);
    document.body.appendChild(o);
    var g = cv.getContext('2d'); g.scale(dpr, dpr);
    var modern = (variant || '').indexOf('modern') === 0, base = BASE + 'vaporwave/assets/' + (variant && variant !== 'retro' ? variant + '/' : '');
    var names = ['toggle-sun', 'toggle-retro', 'toggle-modern', 'coin', 'quest-icon-like', 'toggle-moon', 'wordmark'];
    var sprites = names.map(function (n, k) {
      var im = new Image(); im.src = base + n + '.webp';
      var sz = n === 'wordmark' ? 150 : 56 + Math.random() * 30;
      return { im: im, w: sz, x: Math.random() * (W - sz), y: Math.random() * (H - sz), vx: (Math.random() < .5 ? -1 : 1) * (.6 + Math.random() * 1.2), vy: (Math.random() < .5 ? -1 : 1) * (.6 + Math.random() * 1.2), r: Math.random() * 6.28, vr: (Math.random() - .5) * .02 };
    });
    var stars = []; for (var k = 0; k < 90; k++) stars.push([Math.random() * W, Math.random() * H * .55, Math.random()]);
    var t0 = performance.now(), alive = true;
    (function draw(now) {
      if (!alive) return;
      var t = (now - t0) / 1000;
      var sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, modern ? '#030a1f' : '#0b0221'); sky.addColorStop(.55, modern ? '#0a2a6c' : '#3a0b5c'); sky.addColorStop(1, modern ? '#05101f' : '#12021f');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      stars.forEach(function (s) { g.fillStyle = 'rgba(255,255,255,' + (.3 + .7 * Math.abs(Math.sin(t * 1.5 + s[2] * 9))) + ')'; g.fillRect(s[0], s[1], 2, 2); });
      var hz = H * .62, col = modern ? '63,208,255' : '255,79,200';   // perspective grid rolling toward you
      g.strokeStyle = 'rgba(' + col + ',.7)'; g.lineWidth = 1.2;
      for (var i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(W / 2 + i * 14, hz); g.lineTo(W / 2 + i * 120, H); g.stroke(); }
      for (var j = 0; j < 14; j++) { var p = ((j + (t * .8) % 1) / 14); var y = hz + (H - hz) * p * p; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      sprites.forEach(function (s) {
        s.x += s.vx; s.y += s.vy; s.r += s.vr;
        if (s.x < 0 || s.x > W - s.w) s.vx *= -1; if (s.y < 0 || s.y > H - s.w * (s.im.naturalHeight / (s.im.naturalWidth || 1) || 1)) s.vy *= -1;
        if (!s.im.complete || !s.im.naturalWidth) return;
        var h = s.w * s.im.naturalHeight / s.im.naturalWidth;
        g.save(); g.translate(s.x + s.w / 2, s.y + h / 2); if (s.im.src.indexOf('wordmark') < 0) g.rotate(Math.sin(s.r) * .25);
        g.drawImage(s.im, -s.w / 2, -h / 2, s.w, h); g.restore();
      });
      requestAnimationFrame(draw);
    })(t0);
    setTimeout(function () { o.addEventListener('click', function () { alive = false; o.classList.add('is-out'); setTimeout(function () { o.remove(); }, 300); }); }, 400);
  }
  // Shut Down… (owner: "a shutting down load bar"): a themed shut-down window fills its bar while the steps tick by,
  // the monitor switches off (everything collapses to a glowing line), a moment of "It's now safe to turn off", then it
  // boots back up with the BlipVibe logo and a loading bar.
  function vaporShutdown() {
    if (document.getElementById('fsShutdown')) return;
    var modern = (variant || '').indexOf('modern') === 0;
    var steps = ['Saving your settings…', 'Closing windows…', 'Logging off…', 'Shutting down…'];
    var o = document.createElement('div'); o.id = 'fsShutdown'; o.className = 'fs-shutdown' + (modern ? ' is-modern' : '');
    o.innerHTML = '<div class="fs-sd-win"><div class="fs-sd-title">' + (modern ? 'Shutting down' : 'Shut Down BlipVibe') + '</div>' +
      '<div class="fs-sd-step">' + steps[0] + '</div><div class="fs-sd-bar"><i></i></div><div class="fs-sd-pct">0%</div></div>' +
      '<div class="fs-sd-msg">' + (modern ? '<b class="fs-sd-power"></b>' : 'It’s now safe to turn off<br>your BlipVibe.') + '</div>' +
      '<div class="fs-sd-boot"><b></b><div class="fs-sd-bar"><i></i></div><span>Starting BlipVibe…</span></div><div class="fs-sd-line"></div>';
    o.style.setProperty('--fs-wordmark', getComputedStyle(document.body).getPropertyValue('--fs-wordmark'));
    document.documentElement.appendChild(o);   // outside <body>, which collapses like a switched-off screen
    var bar = o.querySelector('.fs-sd-win .fs-sd-bar i'), pct = o.querySelector('.fs-sd-pct'), step = o.querySelector('.fs-sd-step');
    var marks = [[0, 0], [.2, .22], [.35, .26], [.55, .61], [.72, .66], [.9, .94], [1, 1]];
    function prog(x) { for (var k = 1; k < marks.length; k++) if (x <= marks[k][0]) { var a = marks[k - 1], b = marks[k]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return 1; }
    requestAnimationFrame(function () { o.classList.add('is-in'); });
    var LOAD = 2000, t0 = performance.now();
    (function tick(now) {
      var x = Math.min(1, (now - t0 - 250) / LOAD); if (x < 0) x = 0;
      var p = prog(x); bar.style.width = (p * 100) + '%'; pct.textContent = Math.floor(p * 100) + '%';
      step.textContent = steps[Math.min(steps.length - 1, Math.floor(x * steps.length))];
      if (x < 1) requestAnimationFrame(tick); else off();
    })(t0);
    function off() {
      setTimeout(function () { o.classList.add('is-off'); document.documentElement.classList.add('fs-sd-off'); }, 250);
      setTimeout(function () { o.classList.add('is-msg'); }, 1100);
      setTimeout(function () { o.classList.remove('is-msg'); o.classList.add('is-boot'); }, 2700);
      setTimeout(function () { document.documentElement.classList.remove('fs-sd-off'); o.classList.add('is-out'); }, 4500);
      setTimeout(function () { o.remove(); }, 5000);
    }
  }

  function magicSwap(btn, id, next) {
    if (id === 'anime-blaze') return blazeSwap(btn, id, next);
    if (swapping) return;
    swapping = true;
    var dir = next === (FULL_SKINS[id].variants[0].id) ? '' : next + '/';
    var base = BASE + id + '/assets/' + dir;
    function load(n) { return new Promise(function (ok) { var i = new Image(); i.onload = i.onerror = function () { ok(i); }; i.src = base + n + '.webp'; }); }
    var skyP = load('background');
    var rest = ['header', 'post-panel', 'nav-bar', 'nav-orb', 'nav-orb-active', 'stats-frame', 'edit-btn'].map(load);
    var br = btn.getBoundingClientRect(), cx = br.left + br.width / 2, cy = br.top + br.height / 2;
    var W = innerWidth, H = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 180;
    var o = document.createElement('div');
    o.className = 'fs-swap fs-swap-' + next;
    o.style.setProperty('--x', cx + 'px'); o.style.setProperty('--y', cy + 'px');
    var cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr; cv.className = 'fs-swap-canvas';
    o.appendChild(cv);
    for (var k = 0; k < 26; k++) {
      var sp = document.createElement('span');
      var ang = (k / 26) * Math.PI * 2 + Math.random() * .4, dist = 60 + Math.random() * 200;
      sp.className = 'fs-swap-spark';
      sp.textContent = k % 3 ? '\u2726' : '\u2727';
      sp.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); sp.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      sp.style.setProperty('--d', (Math.random() * 160) + 'ms'); sp.style.setProperty('--s', (0.6 + Math.random() * 0.9).toFixed(2));
      o.appendChild(sp);
    }
    document.documentElement.appendChild(o);
    requestAnimationFrame(function () { o.classList.add('is-in'); });
    var g = cv.getContext('2d'); g.scale(dpr, dpr);
    var night = next === 'night' || /-dark$/.test(next);
    var glowA = night ? 'rgba(200,160,255,' : 'rgba(255,224,150,', glowB = night ? 'rgba(255,226,170,' : 'rgba(205,165,255,';
    var nv = (FULL_SKINS[id].variants || []).filter(function (x) { return x.id === next; })[0];
    if (nv && next !== 'day' && next !== 'night' && !/-dark$/.test(next) && /^#[0-9a-f]{6}$/i.test(nv.accent || '')) {
      var h = nv.accent, rr = parseInt(h.substr(1, 2), 16), gg = parseInt(h.substr(3, 2), 16), bb = parseInt(h.substr(5, 2), 16);
      glowA = 'rgba(' + rr + ',' + gg + ',' + bb + ','; glowB = 'rgba(255,240,200,';
    }
    function cover(img) { var s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s; g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function ring(r, a) {   // the burning edge: soft gold + lilac glow band at radius r
      if (r <= 0) return;
      g.globalCompositeOperation = 'lighter';
      var rg = g.createRadialGradient(cx, cy, Math.max(0, r - 120), cx, cy, r + 70);
      rg.addColorStop(0, glowA + '0)'); rg.addColorStop(.42, glowA + (.5 * a) + ')');
      rg.addColorStop(.63, glowB + (.85 * a) + ')'); rg.addColorStop(.78, glowA + (.55 * a) + ')'); rg.addColorStop(1, glowB + '0)');
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
    }
    function frame(sky, r, mode) {     // mode 'in': sky inside r; 'out': sky outside r
      g.clearRect(0, 0, W, H);
      cover(sky);
      g.globalCompositeOperation = mode === 'in' ? 'destination-in' : 'destination-out';
      var m = g.createRadialGradient(cx, cy, Math.max(0, r - 150), cx, cy, Math.max(1, r));
      m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = m;
      if (mode === 'in') g.fillRect(0, 0, W, H); else { g.beginPath(); g.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2); g.fill(); }
      g.globalCompositeOperation = 'source-over';
      ring(r, 1);
    }
    function run(sky, mode, ms, done) {
      var t0 = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - t0) / ms);
        frame(sky, ease(t) * maxR, mode);
        if (t < 1) requestAnimationFrame(step); else done();
      })(t0);
    }
    // Preferred: the new skin is revealed right behind the pulse (View Transitions). The new page snapshot grows as a
    // circle from the button while the glowing ring rides exactly on that edge, so the ring is where Day turns Night.
    if (document.startViewTransition) {
      o.remove();
      o.style.viewTransitionName = 'fs-swap-glow';
      Promise.all(rest.concat([skyP])).then(function () {
        var vt = document.startViewTransition(function () {
          if (data().setVariant) data().setVariant(id, next);
          document.documentElement.appendChild(o);
          o.classList.add('is-in');
        });
        vt.ready.then(function () {
          var ms = 1250, ez = 'cubic-bezier(.55,0,.3,1)';
          document.documentElement.animate(
            { clipPath: ['circle(0px at ' + cx + 'px ' + cy + 'px)', 'circle(' + maxR + 'px at ' + cx + 'px ' + cy + 'px)'] },
            { duration: ms, easing: ez, fill: 'forwards', pseudoElement: '::view-transition-new(root)' });
          var t0 = performance.now();
          (function step(now) {
            var t = Math.min(1, (now - t0) / ms), r = ease(t) * maxR;
            g.clearRect(0, 0, W, H);
            ring(r, 1 - Math.max(0, t - .8) * 5 * .6);
            if (t < 1) requestAnimationFrame(step);
          })(t0);
        }).catch(function () {});
        vt.finished.then(function () { o.remove(); swapping = false; }, function () { o.remove(); swapping = false; });
      });
      return;
    }
    skyP.then(function (sky) {
      run(sky, 'in', 850, function () {
        Promise.all(rest).then(function () {
          if (data().setVariant) data().setVariant(id, next);
          setTimeout(function () {
            o.classList.add('is-out');
            run(sky, 'out', 950, function () { o.remove(); swapping = false; });
          }, 160);
        });
      });
    });
  }

  function clear() {
    var b = document.body;
    if (!b) return;
    var dn = document.getElementById('fsDayNight');
    if (dn) dn.remove();
    removeVaporStart();
    var lamp = document.getElementById('fsLamp');
    if (lamp) lamp.remove();
    var wasActive = active;
    Object.keys(FULL_SKINS).forEach(function (id) { b.classList.remove('fs-' + id); });
    b.classList.remove('fs', 'fs-dark', 'fs-light');
    b.removeAttribute('data-fs-variant');
    PARTS.concat(EXTRAS).forEach(function (p) { b.style.removeProperty('--fs-' + p); });
    ICONS.forEach(function (n) { b.style.removeProperty('--fs-icon-' + n); });
    ['--fs-ink', '--fs-muted', '--fs-accent', '--fs-font', '--fs-title-font', '--fs-slice', '--fs-edge'].forEach(function (v) {
      b.style.removeProperty(v);
    });
    if (active && FULL_SKINS[active]) {
      (FULL_SKINS[active].assets || []).forEach(function (a) { b.style.removeProperty('--fs-' + a); });
    }
    if (active && FULL_SKINS[active] && (FULL_SKINS[active].theme || FULL_SKINS[active].variants)) {
      var allTheme = Object.assign({}, FULL_SKINS[active].theme || {});
      (FULL_SKINS[active].variants || []).forEach(function (x) { Object.assign(allTheme, x.theme || {}); });
      Object.keys(allTheme).forEach(function (v) { b.style.removeProperty(v); });
    }
    removeRendered();
    active = null;
    unwatchPosts();
    if (wasActive) restoreExtras();
  }

  // SVG filters CSS can reference: fsCrispAlpha turns a picture's soft/ragged transparent edge into one smooth solid
  // silhouette, so an ink outline drawn around it (drop-shadow) stays sharp instead of smearing the soft pixels.
  function ensureFilters() {
    if (document.getElementById('fsSvgFilters')) return;
    var d = document.createElement('div');
    d.id = 'fsSvgFilters';
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    // blur the alpha, then a steep ramp = a smooth, anti-aliased silhouette (ragged/speckled edges become one clean
    // curve); dark fill inside it, the picture on top, anything outside it dropped
    d.innerHTML = '<svg width="0" height="0" aria-hidden="true"><filter id="fsCrispAlpha" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b"/>' +
      '<feComponentTransfer in="b" result="m"><feFuncA type="linear" slope="10" intercept="-4.5"/></feComponentTransfer>' +
      '<feFlood flood-color="#111" result="f"/><feComposite in="f" in2="m" operator="in" result="bg"/>' +
      '<feComposite in="SourceGraphic" in2="m" operator="in" result="fg"/>' +
      '<feMerge><feMergeNode in="bg"/><feMergeNode in="fg"/></feMerge></filter></svg>';
    document.body.appendChild(d);
  }

  function apply(id) {
    var cfg = FULL_SKINS[id];
    clear();
    if (!cfg) return;
    var b = document.body;
    loadFonts(cfg);
    ensureFilters();
    variant = pickVariant(id);
    // a variant may change more than the accent (Good Witch Day / Night): dark flag, ink, muted, theme vars
    var vcfg = cfg.variants && cfg.variants.filter(function (x) { return x.id === (variant || cfg.variants[0].id); })[0];
    var isDark = vcfg && vcfg.dark !== undefined ? vcfg.dark : cfg.dark;
    b.classList.add('fs', 'fs-' + id, isDark ? 'fs-dark' : 'fs-light');
    // status-bar text follows the rendition (Good Witch Night, Vaporwave dark): light text on dark art
    if (typeof window._updateStatusBarStyle === 'function') window._updateStatusBarStyle(!isDark);
    if (cfg.variants) b.setAttribute('data-fs-variant', variant || cfg.variants[0].id);
    var parts = cfg.extras ? PARTS.concat(EXTRAS) : PARTS;
    parts.forEach(function (p) { b.style.setProperty('--fs-' + p, url(id, (cfg.parts && cfg.parts[p]) || p)); });
    ICONS.forEach(function (n) {
      b.style.setProperty('--fs-icon-' + n, url(id, (cfg.parts && cfg.parts['icon-' + n]) || 'icon-' + n));
    });
    (cfg.assets || []).forEach(function (a) { b.style.setProperty('--fs-' + a, url(id, a)); });
    b.style.setProperty('--fs-ink', (vcfg && vcfg.ink) || cfg.ink);
    b.style.setProperty('--fs-muted', (vcfg && vcfg.muted) || cfg.muted);
    b.style.setProperty('--fs-accent', (vcfg && vcfg.accent) || cfg.accent);
    b.style.setProperty('--fs-font', cfg.font);
    b.style.setProperty('--fs-title-font', cfg.titleFont || cfg.font);
    b.style.setProperty('--fs-slice', String(cfg.slice || 18));
    b.style.setProperty('--fs-edge', (cfg.edge || 16) + 'px');
    var theme = Object.assign({}, cfg.theme || {}, (vcfg && vcfg.theme) || {});
    Object.keys(theme).forEach(function (v) { b.style.setProperty(v, theme[v]); });
    active = id;
    dayNightToggle(id, cfg);
    if (id === 'vaporwave') vaporStart(); else removeVaporStart();
    startSuspending();
    watchPosts();
    render();
  }

  /* ---------- layout renderers (extra markup a skin needs) ---------- */

  function removeRendered() {
    document.querySelectorAll('.fs-rendered').forEach(function (el) { el.remove(); });
  }

  // Timeline photo frames over the cover. Slot 1 = cover photo; extra slots = latest photos,
  // falling back to the cover again (spec: "Profile timeline photos").
  function timelinePhotos(coverEl, count) {
    var urls = [];
    // the CSS hides the original cover with !important, so read the inline style the app set
    var bg = coverEl && coverEl.style.backgroundImage;
    var m = bg && bg.match(/url\(["']?(.*?)["']?\)/);
    if (m) urls.push(m[1]);
    else if (coverEl && coverEl.id === 'timelineCover' && data().cover()) urls.push(data().cover());
    // own photos only on your own timeline: home cover, or the profile view when it's you
    // (app.js shows #pvCoverEditBtn only on your own profile)
    var editBtn = document.getElementById('pvCoverEditBtn');
    var own = coverEl && (coverEl.id === 'timelineCover' ||
      (coverEl.id === 'pvCoverBanner' && editBtn && editBtn.style.display !== 'none'));
    if (own) {
      (data().photos() || []).filter(function (p) { return p && p.src && !p.isVideo; })
        .forEach(function (p) { if (urls.length < count && urls.indexOf(p.src) < 0) urls.push(p.src); });
    }
    // photos picked for specific frames win over the defaults (yours, or the viewed person's)
    var picks = own ? (data().chosen && data().chosen()) : (coverEl && coverEl.id === 'pvCoverBanner' && data().viewed && data().viewed());
    if (picks && picks.length) {
      for (var i = 0; i < count; i++) if (picks[i]) urls[i] = picks[i];
    }
    // no photos at all (e.g. someone without a cover): empty slots render as blank photo paper
    while (urls.length < count) urls.push(urls[0] || null);
    return urls.slice(0, count);
  }

  function renderTimeline(coverEl) {
    var cfg = FULL_SKINS[active];
    if (!coverEl || !cfg) return;
    var wrap = document.createElement('div');
    wrap.className = 'fs-rendered fs-timeline fs-tl-' + cfg.timeline;
    timelinePhotos(coverEl, cfg.timeline).forEach(function (src, i) {
      var slot = document.createElement('div');
      slot.className = 'fs-tl-slot fs-tl-slot-' + (i + 1);
      if (isOwnTimeline(coverEl) && data().pick) { // tap a frame to choose its photo
        slot.className += ' fs-tl-own';
        slot.setAttribute('role', 'button');
        slot.setAttribute('aria-label', 'Choose photo ' + (i + 1));
        (function (n) { slot.addEventListener('click', function (e) { e.stopPropagation(); data().pick(n); }); })(i);
      }
      if (src) {
        var img = document.createElement('img');
        img.src = src; img.alt = ''; img.loading = 'lazy';
        slot.appendChild(img);
      } else {
        slot.className += ' fs-tl-empty';
      }
      if (cfg.tlLabels && cfg.tlLabels[i]) {   // Vaporwave: VHS on-screen text over each tape window
        var lab = document.createElement('span');
        lab.className = 'fs-tl-vhs'; lab.textContent = cfg.tlLabels[i];
        slot.appendChild(lab);
      }
      wrap.appendChild(slot);
    });
    coverEl.appendChild(wrap);
  }

  // Quest graphic state: 0 / 50 / 100 from the bar width the app already renders.
  function tagQuests() {
    document.querySelectorAll('#questPanel .quest-item').forEach(function (it) {
      var f = it.querySelector('.quest-bar-fill');
      var pct = f ? parseFloat(f.style.width) || 0 : 0;
      var done = pct >= 100 || !!it.querySelector('.quest-check');
      it.setAttribute('data-fs-q', done ? '100' : pct >= 40 ? '50' : '0');
      it.setAttribute('data-fs-started', pct > 0 || done ? '1' : '0');   // any progress at all (e.g. 1/3)
      // exact progress (0–1) for skins that fill a graphic proportionally (Witchcraft's potions)
      it.style.setProperty('--fs-q', String(done ? 1 : Math.max(0, Math.min(1, pct / 100))));
    });
  }

  /* Posts look different from each other, like a real scrapbook: each gets one of several looks
   * (data-fs-v="1".."6": paper scrap colour, tape, tilt, sticker) chosen from its id, so the same post
   * always looks the same. Posts arrive whenever the feed loads, so new ones are tagged as they appear. */
  var VARIANTS = 6;
  var postObserver = null;
  function hashStr(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function tagPosts(root) {
    (root || document).querySelectorAll('.feed-post:not([data-fs-v])').forEach(function (p) {
      var idEl = p.matches('[data-post-id]') ? p : p.querySelector('[data-post-id]');
      var key = (idEl && idEl.getAttribute('data-post-id')) ||
        ((p.querySelector('.post-username') || {}).textContent || '') + '|' +
        ((p.querySelector('.post-time') || {}).textContent || '') + '|' +
        ((p.querySelector('.post-description') || {}).textContent || '').slice(0, 60);
      p.setAttribute('data-fs-v', String(hashStr(key) % VARIANTS + 1));
    });
  }
  // Profile name + its status/bio share one paper label (concept): wrap them in .fs-namecard. The app
  // re-renders profile cards with innerHTML, so this re-runs from the same observer as the posts.
  function wrapNameCards() {
    document.querySelectorAll('.profile-card .profile-info > .profile-name').forEach(function (h) {
      if (h.parentElement.classList.contains('fs-namecard')) return;
      var info = h.parentElement, card = document.createElement('div');
      card.className = 'fs-namecard';
      info.insertBefore(card, h);
      card.appendChild(h);
      // status and bio both go on the label (Home has both; an empty one takes no space)
      // (the Profile page puts the badge row between the name and the status, so look at every child)
      [].slice.call(info.children).forEach(function (el) {
        if (el.classList.contains('profile-title') || el.classList.contains('profile-about')) card.appendChild(el);
      });
    });
  }
  // Someone else's profile: every concept shows Follow · Message · Close Friend · Invite to Group, with Mute / Block /
  // Report in a ⋯ menu at the top right. The app's own buttons stay (they carry the handlers) but are hidden; the
  // menu items click them, and are rebuilt on each open so Mute/Unmute and Block/Unblock read right.
  var PV_MENU = ['pvMuteBtn', 'pvBlockBtn', 'pvReportUserBtn'];
  function wrapPvMore() {
    var page = document.getElementById('page-profile-view'), follow = document.getElementById('pvFollowBtn');
    // most concepts put ⋯ at the cover's top right; Vaporwave's puts it in the button row
    var inRow = active === 'vaporwave', acts = follow && follow.closest('.pv-actions');
    var host = inRow ? acts : document.getElementById('pvCoverBanner');
    if (!page || !follow || !host || !page.contains(follow) || page.querySelector('.fs-pv-more')) return;
    var wrap = document.createElement('div'), btn = document.createElement('button'), menu = document.createElement('div');
    wrap.className = 'fs-pv-more';
    btn.type = 'button'; btn.className = 'fs-pv-more-btn' + (inRow ? ' btn btn-outline' : ''); btn.setAttribute('aria-label', 'More: mute, block, report');
    if (inRow) btn.innerHTML = '<i class="fas fa-ellipsis-h"></i>';
    menu.className = 'post-dropdown fs-pv-menu';
    wrap.appendChild(btn); wrap.appendChild(menu); host.appendChild(wrap);
    PV_MENU.forEach(function (id) { var b = document.getElementById(id); if (b) b.classList.add('fs-pv-hidden'); });
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.classList.contains('show')) { menu.classList.remove('show'); return; }
      menu.innerHTML = '';
      PV_MENU.forEach(function (id) {
        var b = document.getElementById(id);
        if (!b) return;
        var a = document.createElement('a');
        a.href = '#'; a.innerHTML = b.innerHTML; if (id !== 'pvMuteBtn') a.className = 'fs-pv-danger';
        a.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); menu.classList.remove('show'); b.click(); });
        menu.appendChild(a);
      });
      menu.classList.add('show');
    });
  }
  function watchPosts() {
    tagPosts();
    wrapNameCards();
    wrapPvMore();
    if (postObserver || !window.MutationObserver) return;
    postObserver = new MutationObserver(function (muts) {
      if (!active) return;
      for (var i = 0; i < muts.length; i++) if (muts[i].addedNodes.length) { tagPosts(); wrapNameCards(); wrapPvMore(); break; }
    });
    postObserver.observe(document.body, { childList: true, subtree: true });
  }
  function unwatchPosts() {
    if (postObserver) { postObserver.disconnect(); postObserver = null; }
  }

  function render() {
    if (!active) return;
    removeRendered();
    renderTimeline(document.getElementById('timelineCover'));
    renderTimeline(document.getElementById('pvCoverBanner'));
    tagQuests();
  }

  /* ---------- called from app.js ---------- */

  // end of applyPremiumSkin(): id is the applied premium skin, or null for none/default
  function onSkin(id) {
    // app.js only strips premium-<id> classes for skins in its legacy premiumSkins list, so drop any
    // left over from a full skin (e.g. after a try-on is reverted)
    Object.keys(FULL_SKINS).forEach(function (k) { if (k !== id) document.body.classList.remove('premium-' + k); });
    if (id && FULL_SKINS[id]) apply(id); else clear();
  }

  // app data the engine reads (exposed by app.js as window.BlipFullSkinsData)
  function data() {
    return window.BlipFullSkinsData || { photos: function () { return []; }, cover: function () { return null; } };
  }
  function isOwnTimeline(coverEl) {
    var editBtn = document.getElementById('pvCoverEditBtn');
    return !!coverEl && (coverEl.id === 'timelineCover' ||
      (coverEl.id === 'pvCoverBanner' && !!editBtn && editBtn.style.display !== 'none'));
  }

  /* ---------- catalog for the Skins section of the shop ---------- */

  // Every full skin with art. `ready` = wired into the engine (has a FULL_SKINS entry); the rest show
  // as "Coming soon". Ids match the legacy premium skins, so owning one carries over.
  var CATALOG = [
    ['scrapbook', 'Scrapbook', 'aesthetic'], ['basic', '#Basic', 'aesthetic'],
    ['pastel-aurora', 'Pastel Aurora', 'aesthetic'], ['heavens-light', "Heaven's Light", 'aesthetic'],
    ['sakura', 'Sakura Bloom', 'aesthetic'],
    ['kawaii-cats', 'Kawaii Cats', 'cute'], ['cotton-candy', 'Cotton Candy', 'cute'], ['good-witch', 'Good Witch', 'cute'],
    ['witchcraft', 'Witchcraft', 'mystic'], ['blood-moon', 'Blood Moon', 'mystic'], ['galaxy', 'Galaxy Swirl', 'mystic'],
    ['dark-prism', 'Dark Prism', 'mystic'],
    ['neon-wave', 'Neon Wave', 'neon'], ['vaporwave', 'Vaporwave', 'neon'], ['matrix', 'Matrix', 'neon'],
    ['toxic-green', 'Toxic Green', 'neon'], ['geo-prism', 'Geo Prism', 'neon'], ['anime-blaze', 'Anime Blaze', 'neon'],
    ['autumn-leaves', 'Autumn Leaves', 'nature'], ['ocean-tide', 'Ocean Tide', 'nature'], ['deep-wave', 'Deep Wave', 'nature'],
    ['molten-gold', 'Molten Gold', 'nature']
  ];
  var CATEGORIES = [['all', 'All'], ['aesthetic', 'Aesthetic'], ['cute', 'Cute'], ['mystic', 'Mystic'],
    ['neon', 'Neon'], ['nature', 'Nature']];
  var PRICE = 300;

  function catalog() {
    return CATALOG.map(function (c) {
      var cfg = FULL_SKINS[c[0]];
      return { id: c[0], name: c[1], cat: c[2], price: PRICE, ready: !!cfg && !cfg.wip,
        variants: cfg && cfg.variants ? cfg.variants.slice() : null,
        card: BASE + c[0] + '/card.webp' };
    }).sort(function (a, b) { return (b.ready ? 1 : 0) - (a.ready ? 1 : 0); }); // finished skins first
  }

  // premiumSkins-shaped metadata for full skins that aren't in the legacy premiumSkins list
  // (app.js applyPremiumSkin falls back to this)
  function meta(id) {
    var c = FULL_SKINS[id];
    if (!c) return null;
    return { id: id, name: c.name, accent: c.accent, accentHover: c.accentHover || c.accent, dark: !!c.dark };
  }

  /* ---------- Equip transitions (owner, Nov 16): equipping a full skin plays an animation themed to THAT skin —
     e.g. Scrapbook "putting it down piece by piece like a scrapbook". Each one covers the screen, the skin is applied
     underneath (and its main art loaded), then it reveals the new look. Every skin's is its own. ---------- */
  var equipBusy = false;
  function fxWait(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function fxImg(src) { return new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }
  function fxArt(id, n) { return fxImg(BASE + id + '/assets/' + n + '.webp'); }
  function fxCanvas(cls) {
    var W = innerWidth, H = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var o = document.createElement('div'); o.id = 'fsEquipFx'; o.className = 'fs-equip fs-equip-' + cls;
    var cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; o.appendChild(cv);
    var g = cv.getContext('2d'); g.scale(dpr, dpr);
    document.documentElement.appendChild(o);   // outside <body>: apply() restyles body underneath
    return { o: o, g: g, W: W, H: H };
  }
  function fxRun(dur, draw) {   // draw(t ms, 0..1) every frame for dur ms
    return new Promise(function (ok) {
      var t0 = performance.now();
      (function f(now) { var t = Math.min(dur, now - t0); draw(t, t / dur); if (t < dur) requestAnimationFrame(f); else ok(); })(t0);
    });
  }
  function ease(x) { return 1 - Math.pow(1 - x, 3); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  // once applied: wait for the skin's main art (page, header, panels, nav…) so the reveal shows the finished look
  function fxArtReady() {
    var b = document.body, urls = [];
    for (var i = 0; i < b.style.length; i++) {
      var p = b.style[i];
      if (p.indexOf('--fs-') !== 0 || !/background|header|panel|nav|window|post|frame|bar|wordmark/.test(p)) continue;
      var m = b.style.getPropertyValue(p).match(/url\(["']?(.*?)["']?\)/);
      if (m && urls.indexOf(m[1]) < 0) urls.push(m[1]);
    }
    return Promise.race([Promise.all(urls.slice(0, 30).map(fxImg)), fxWait(3500)]).then(function () { return fxWait(150); });
  }
  function drawRot(g, im, x, y, w, h, rot, a) {
    if (!im) return;
    g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
  }

  // SCRAPBOOK — paste-up: paper scraps are laid down one at a time with a little bounce until the page is covered,
  // washi tape is pressed over the seams, stickers pop on, then the finished collage page lifts off piece by piece.
  function equipScrapbook(id, swap) {
    var names = ['panel-paper', 'panel-paper-pink', 'scrap-pink', 'panel-paper-pink', 'panel-paper', 'scrap-pink'];
    var tapes = ['tape-pink-grid', 'tape-sage', 'tape-beige', 'tape-2'], stick = ['sticker-1', 'sticker-daisy', 'heart-sticker', 'sticker-stamp', 'sticker-2', 'deco-3'];
    return Promise.all([Promise.all(names.map(function (n) { return fxArt(id, n); })), Promise.all(tapes.map(function (n) { return fxArt(id, n); })),
      Promise.all(stick.map(function (n) { return fxArt(id, n); }))]).then(function (r) {
      var c = fxCanvas('scrapbook'), g = c.g, W = c.W, H = c.H;
      var paper = r[0], tape = r[1], st = r[2];
      // a 3x4 grid of oversized scraps (overlapping, tilted) so the page is fully covered
      var cols = 3, rows = 4, pcs = [], k = 0, i, j;
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
        pcs.push({ x: (i + .5) * W / cols + (Math.random() - .5) * 20, y: (j + .5) * H / rows + (Math.random() - .5) * 20,
          w: W / cols * 1.45, h: H / rows * 1.5, rot: (Math.random() - .5) * .22, im: paper[k++ % paper.length],
          d: 0, out: { x: (Math.random() - .5) * 2 * W, y: -H * (0.6 + Math.random() * .6), r: (Math.random() - .5) * 1.4 } });
      }
      pcs.sort(function () { return Math.random() - .5; });
      pcs.forEach(function (p, n) { p.d = n * 90; });
      var tp = [], sp = [];
      for (i = 0; i < 7; i++) tp.push({ x: W * (.12 + Math.random() * .76), y: H * (.08 + i * .13), rot: (Math.random() - .5) * 1.2, im: tape[i % tape.length], d: 1150 + i * 70 });
      for (i = 0; i < st.length; i++) sp.push({ x: W * (.2 + ((i * 37) % 60) / 100), y: H * (.15 + i * .13), s: 70 + Math.random() * 30, rot: (Math.random() - .5) * .6, im: st[i], d: 1500 + i * 80 });
      function piece(p, t, lift) {   // drop in: scale 1.25 -> 1 with a tiny bounce; lift: fly up and away
        var a = clamp01((t - p.d) / 260); if (a <= 0) return;
        var s = 1 + .25 * (1 - ease(a)) - (a > .75 ? Math.sin((a - .75) / .25 * Math.PI) * .02 : 0);
        var x = p.x, y = p.y, rot = p.rot, al = Math.min(1, a * 2);
        if (lift > 0) { var e = lift * lift; x += p.out.x * e; y += p.out.y * e; rot += p.out.r * e; al *= 1 - lift * .3; }
        g.save(); g.shadowColor = 'rgba(60,40,30,.35)'; g.shadowBlur = 14 * s; g.shadowOffsetY = 6 * s;
        drawRot(g, p.im, x, y, p.w * s, p.h * s, rot, al); g.restore();
      }
      function frame(t, lifts) {
        g.clearRect(0, 0, W, H);
        pcs.forEach(function (p, n) { piece(p, t, lifts ? lifts(n, 'p') : 0); });
        tp.forEach(function (p, n) { var a = clamp01((t - p.d) / 200); if (!a || !p.im) return; var l = lifts ? lifts(n, 't') : 0;
          drawRot(g, p.im, p.x + (l ? p.x - W / 2 : 0) * l * 2, p.y - H * l * l, W * .42, W * .42 * p.im.height / p.im.width, p.rot + l, Math.min(1, a * 1.5)); });
        sp.forEach(function (p, n) { var a = clamp01((t - p.d) / 220); if (!a || !p.im) return; var l = lifts ? lifts(n, 's') : 0;
          var s = a < .6 ? ease(a / .6) * 1.15 : 1.15 - .15 * ((a - .6) / .4);
          drawRot(g, p.im, p.x, p.y - H * l * l, p.s * s, p.s * s * p.im.height / p.im.width, p.rot + l * 2, 1 - l); });
      }
      var COVER = 2000, LIFT = 900;
      return fxRun(COVER, function (t) { frame(t); }).then(function () { return swap(); }).then(function () {
        // lift off in reverse: stickers + tape first, then the scraps one after another
        var n = pcs.length;
        return fxRun(LIFT, function (t) {
          frame(COVER, function (idx, kind) {
            var start = kind === 'p' ? 150 + (n - 1 - idx) * 45 : idx * 25;
            return clamp01((t - start) / 420);
          });
        });
      }).then(function () { c.o.remove(); });
    });
  }

  // ANIME BLAZE — manga page: slanted comic panels SLAM onto the screen one after another (halftone, speed lines,
  // thick black gutters), a comic burst lands in the middle, the page shakes, then the panels shatter outward.
  function equipBlaze(id, swap) {
    return Promise.all([fxArt(id, 'burst'), fxArt(id, 'fx-panel-speed'), fxArt(id, 'fx-panel-speed-red')]).then(function (rr) {
      var burstIm = rr[0], fillIm = rr[1], fillRed = rr[2];
      var c = fxCanvas('blaze'), g = c.g, W = c.W, H = c.H, D = Math.hypot(W, H);
      var acc = (FULL_SKINS[id].variants && FULL_SKINS[id].variants[0].accent) || FULL_SKINS[id].accent || '#e8321e';
      // panel layout (fractions of the screen), slanted cuts like a manga page
      var P = [
        [[0, 0], [.58, 0], [.5, .3], [0, .34]], [[.58, 0], [1, 0], [1, .27], [.5, .3]],
        [[0, .34], [.38, .33], [.44, .64], [0, .66]], [[.38, .33], [1, .27], [1, .6], [.44, .64]],
        [[0, .66], [.64, .63], [.6, 1], [0, 1]], [[.64, .63], [1, .6], [1, 1], [.6, 1]]
      ].map(function (q, n) {
        var pts = q.map(function (v) { return [v[0] * W, v[1] * H]; });
        var cx = 0, cy = 0; pts.forEach(function (v) { cx += v[0] / 4; cy += v[1] / 4; });
        // stretch the outer edges past the screen so no gaps show at the borders
        pts = pts.map(function (v) { return [v[0] <= 0 ? -20 : v[0] >= W ? W + 20 : v[0], v[1] <= 0 ? -20 : v[1] >= H ? H + 20 : v[1]]; });
        var ang = Math.atan2(cy - H / 2, cx - W / 2);
        return { pts: pts, cx: cx, cy: cy, d: n * 120, red: n === 1 || n === 4, fx: Math.random() * W, fy: Math.random() * H,
          vx: Math.cos(ang) * (D * .7), vy: Math.sin(ang) * (D * .7), vr: (Math.random() - .5) * 1.2 };
      });
      var lines = []; for (var k = 0; k < 40; k++) lines.push({ a: Math.random() * 6.283, w: 1 + Math.random() * 3 });
      // draw each panel ONCE into its own canvas (speed lines + halftone are heavy), then only move it per frame
      P.forEach(function (p) {
        var pc = document.createElement('canvas'); pc.width = W * 1.5; pc.height = H * 1.5;
        var q = pc.getContext('2d'); q.scale(1.5, 1.5);
        q.beginPath(); p.pts.forEach(function (v, i) { if (i) q.lineTo(v[0], v[1]); else q.moveTo(v[0], v[1]); }); q.closePath();
        q.fillStyle = p.red ? acc : '#fffaf0'; q.fill();
        q.save(); q.clip();
        var art = p.red ? fillRed : fillIm;
        if (art) {   // painted manga panel (Codex art), centred on the panel and covering it
          var xs = p.pts.map(function (v) { return v[0]; }), ys = p.pts.map(function (v) { return v[1]; });
          var side = Math.max(Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys)) * .92;
          q.drawImage(art, p.cx - side / 2, p.cy - side / 2, side, side);
        } else {
        q.strokeStyle = p.red ? 'rgba(255,255,255,.55)' : 'rgba(20,20,20,.75)';
        lines.forEach(function (l) { q.lineWidth = l.w; q.beginPath(); q.moveTo(p.cx + Math.cos(l.a) * 40, p.cy + Math.sin(l.a) * 40); q.lineTo(p.cx + Math.cos(l.a) * D, p.cy + Math.sin(l.a) * D); q.stroke(); });
        q.fillStyle = p.red ? 'rgba(0,0,0,.25)' : 'rgba(20,20,20,.22)';
        for (var y = p.cy - 160; y < p.cy + 160; y += 10) for (var x = p.cx - 220; x < p.cx + 220; x += 10) { var dd = Math.hypot(x - p.cx, y - p.cy); if (dd < 150) { q.beginPath(); q.arc(x, y, 3 * (1 - dd / 150), 0, 6.283); q.fill(); } }
        }
        q.restore();
        q.lineWidth = 10; q.strokeStyle = '#111'; q.lineJoin = 'miter'; q.stroke();
        p.img = pc;
      });
      function panel(p, t, out) {
        var a = clamp01((t - p.d) / 170); if (a <= 0) return;
        var s = 1 + .35 * (1 - ease(a)), e = out * out;
        g.save();
        g.translate(p.cx + p.vx * e, p.cy + p.vy * e); g.rotate(p.vr * e); g.scale(s, s); g.translate(-p.cx, -p.cy);
        g.drawImage(p.img, 0, 0, W, H);
        g.restore();
      }
      function burst(t, out) {
        var a = clamp01((t - 760) / 180); if (a <= 0 || !burstIm) return;
        var s = (a < .7 ? ease(a / .7) * 1.15 : 1.15 - .15 * (a - .7) / .3) * (1 + out * 1.5), w = Math.min(W * .85, 380) * s;
        drawRot(g, burstIm, W / 2, H * .47, w, w * burstIm.height / burstIm.width, -.12, 1 - out);
      }
      function shake(t) { var m = t > 760 && t < 1050 ? 10 * (1 - (t - 760) / 290) : 0; c.o.style.transform = m ? 'translate(' + ((Math.random() - .5) * m).toFixed(1) + 'px,' + ((Math.random() - .5) * m).toFixed(1) + 'px)' : ''; }
      var COVER = 1250;
      // warm-up: the first draw of each pre-made panel is slow (upload); do it unseen, then start the clock
      P.forEach(function (p) { g.globalAlpha = .01; g.drawImage(p.img, 0, 0, W, H); }); g.globalAlpha = 1; g.clearRect(0, 0, W, H);
      return new Promise(function (ok) { requestAnimationFrame(function () { requestAnimationFrame(ok); }); }).then(function () { return fxRun(COVER, function (t) { g.clearRect(0, 0, W, H); P.forEach(function (p) { panel(p, t, 0); }); burst(t, 0); shake(t); }); })
        .then(function () { c.o.style.transform = ''; return swap(); })
        .then(function () {
          // SHATTER (owner: "make it shatter, not fade"): freeze the finished page, crack it from the burst, then break it
          // into glass shards that fly out and fall — no fading
          var dpr = Math.min(window.devicePixelRatio || 1, 2), pg = document.createElement('canvas'); pg.width = W * dpr; pg.height = H * dpr;
          var pq = pg.getContext('2d'); pq.drawImage(c.o.firstChild, 0, 0);
          var ix = W / 2, iy = H * .47, S = 13, rings = [0, .1, .24, .42, 1.3].map(function (r) { return r * D; }), ang = [], i, j;
          for (i = 0; i < S; i++) ang.push((i + (Math.random() - .5) * .6) / S * 6.283);
          var pt = function (i, j) { var a = ang[i % S] + (j ? (Math.random() - .5) * .12 : 0), r = rings[j] * (j && j < 4 ? .85 + Math.random() * .3 : 1); return [ix + Math.cos(a) * r, iy + Math.sin(a) * r]; };
          var grid = []; for (j = 0; j < rings.length; j++) { grid.push([]); for (i = 0; i < S; i++) grid[j].push(pt(i, j)); }
          var shards = [];
          for (j = 0; j < rings.length - 1; j++) for (i = 0; i < S; i++) {
            var poly = j === 0 ? [[ix, iy], grid[1][i], grid[1][(i + 1) % S]] : [grid[j][i], grid[j + 1][i], grid[j + 1][(i + 1) % S], grid[j][(i + 1) % S]];
            var cx = 0, cy = 0; poly.forEach(function (v) { cx += v[0] / poly.length; cy += v[1] / poly.length; });
            var dx = cx - ix, dy = cy - iy, dl = Math.hypot(dx, dy) || 1, sp = (j === 0 ? 9 : 14 - j * 2) + Math.random() * 6;
            shards.push({ poly: poly, cx: cx, cy: cy, vx: dx / dl * sp, vy: dy / dl * sp - 4, vr: (Math.random() - .5) * .25, d: j * 40 + Math.random() * 30 });
          }
          var cracks = function (k) {   // white crack lines along every shard edge
            g.save(); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 2.2; g.shadowColor = '#fff'; g.shadowBlur = 6;
            shards.forEach(function (sh) { if (Math.hypot(sh.cx - ix, sh.cy - iy) > D * k) return; g.beginPath(); sh.poly.forEach(function (v, n) { if (n) g.lineTo(v[0], v[1]); else g.moveTo(v[0], v[1]); }); g.closePath(); g.stroke(); });
            g.restore();
          };
          return fxRun(170, function (t, x) { g.clearRect(0, 0, W, H); g.drawImage(pg, 0, 0, W, H); cracks(x); })
            .then(function () {
              return fxRun(760, function (t) {
                g.clearRect(0, 0, W, H);
                shards.forEach(function (sh) {
                  var f = Math.max(0, t - sh.d) / 16.7, x = sh.vx * f, y = sh.vy * f + .45 * f * f;
                  g.save(); g.translate(sh.cx + x, sh.cy + y); g.rotate(sh.vr * f); g.translate(-sh.cx, -sh.cy);
                  g.beginPath(); sh.poly.forEach(function (v, n) { if (n) g.lineTo(v[0], v[1]); else g.moveTo(v[0], v[1]); }); g.closePath();
                  g.save(); g.clip(); g.drawImage(pg, 0, 0, W, H); g.restore();
                  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.5; g.stroke();
                  g.restore();
                });
              });
            });
        }).then(function () { c.o.remove(); });
    });
  }

  // WITCHCRAFT — the ritual: the room goes dark, a gold rune circle is drawn, candles light one by one around it,
  // violet smoke billows out until it fills the screen; then the smoke rises away with embers into the new look.
  function equipWitchcraft(id, swap) {
    return Promise.all([fxArt(id, 'candle'), fxArt(id, 'triple-moon'), fxArt(id, 'fx-rune-circle'), fxArt(id, 'fx-smoke-1'), fxArt(id, 'fx-smoke-2'), fxArt(id, 'fx-ember')]).then(function (r) {
      var c = fxCanvas('witchcraft'), g = c.g, W = c.W, H = c.H, D = Math.hypot(W, H);
      var candle = r[0], moon = r[1], rune = r[2], smokes = [r[3], r[4]].filter(Boolean), ember = r[5], cx = W / 2, cy = H * .46, R = Math.min(W, H) * .34;
      var puffs = [], emb = [], k;
      for (k = 0; k < 30; k++) { var an = Math.random() * 6.283; puffs.push({ a: an, d: 900 + Math.random() * 700, r: 60 + Math.random() * 120, sp: .5 + Math.random() * .7, im: k % 2, rot: Math.random() * 6.283,
        col: Math.random() < .5 ? '88,30,140' : '40,12,70', wob: Math.random() * 6 }); }
      for (k = 0; k < 60; k++) emb.push({ x: Math.random() * W, y: H * (.3 + Math.random() * .8), v: 1 + Math.random() * 3, s: 1 + Math.random() * 2.5, ph: Math.random() * 6 });
      var runes = '☽✦☾✧◈☽✶☾✦◇✧☽';
      function circle(t, fade) {
        var a = clamp01((t - 250) / 650); if (a <= 0) return;
        g.save(); g.globalAlpha = 1 - fade;
        if (rune) {   // painted rune circle (Codex art), revealed by a sweeping wedge as if drawn, turning slowly
          g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R * 1.4, -Math.PI / 2, -Math.PI / 2 + a * 6.283); g.closePath(); g.clip();
          g.translate(cx, cy); g.rotate(t / 6000); var rw = R * 2.25; g.drawImage(rune, -rw / 2, -rw / 2, rw, rw); g.restore();
        } else {
        g.strokeStyle = '#e8c068'; g.shadowColor = '#ffcf6a'; g.shadowBlur = 18; g.lineWidth = 2.5;
        g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + a * 6.283); g.stroke();
        g.beginPath(); g.arc(cx, cy, R * .82, Math.PI / 2, Math.PI / 2 + a * 6.283); g.stroke();
        g.fillStyle = '#f3d68a'; g.font = '16px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (var i = 0; i < 12; i++) { if (i / 12 > a) break; var ra = -Math.PI / 2 + i / 12 * 6.283; g.fillText(runes[i], cx + Math.cos(ra) * R * .91, cy + Math.sin(ra) * R * .91); }
        }
        if (moon) { var mw = R * 1.05; g.shadowBlur = 24; g.globalAlpha = (1 - fade) * clamp01((t - 600) / 400); g.drawImage(moon, cx - mw / 2, cy - mw / 2 * moon.height / moon.width, mw, mw * moon.height / moon.width); }
        g.restore();
        // candles light around the circle
        for (var j = 0; j < 7; j++) {
          var ca = clamp01((t - 500 - j * 90) / 200); if (ca <= 0) continue;
          var aa = -Math.PI / 2 + j / 7 * 6.283, x = cx + Math.cos(aa) * R * 1.12, y = cy + Math.sin(aa) * R * 1.12;
          if (candle) { var cw = 34, ch = cw * candle.height / candle.width; g.save(); g.globalAlpha = ca * (1 - fade); g.drawImage(candle, x - cw / 2, y - ch / 2, cw, ch); g.restore(); }
          var fl = g.createRadialGradient(x, y - 14, 0, x, y - 14, 40); fl.addColorStop(0, 'rgba(255,210,120,' + (.55 * ca * (1 - fade)) + ')'); fl.addColorStop(1, 'rgba(255,160,60,0)');
          g.fillStyle = fl; g.fillRect(x - 40, y - 54, 80, 80);
        }
      }
      function smoke(t, rise) {
        puffs.forEach(function (p) {
          var a = clamp01((t - p.d) / 900); if (a <= 0) return;
          var dist = D * .55 * ease(a) * p.sp, x = cx + Math.cos(p.a) * dist + Math.sin(t / 300 + p.wob) * 10, y = cy + Math.sin(p.a) * dist - rise * H * .9 * p.sp;
          var r = p.r * (1 + a * 2.2) * (1 + rise), al = Math.min(1, a * 1.5) * (1 - rise);
          if (smokes.length) { var sm = smokes[p.im % smokes.length]; drawRot(g, sm, x, y, r * 2.4, r * 2.4, p.rot + t / 3000, al); return; }
          var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(' + p.col + ',' + (.9 * al) + ')'); gr.addColorStop(1, 'rgba(' + p.col + ',0)');
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
        });
      }
      var COVER = 2150;
      return fxRun(COVER, function (t) {
        g.clearRect(0, 0, W, H);
        g.fillStyle = 'rgba(12,4,22,' + (.8 * clamp01(t / 350)) + ')'; g.fillRect(0, 0, W, H);   // the room goes dark
        var full = clamp01((t - 1600) / 450);   // last stretch: smoke closes every gap
        smoke(t, 0); circle(t, 0);
        if (full) { g.fillStyle = 'rgba(30,8,52,' + full + ')'; g.fillRect(0, 0, W, H); circle(t, 1 - full * .3); }
      }).then(function () { return swap(); }).then(function () {
        return fxRun(1000, function (t, x) {
          g.clearRect(0, 0, W, H);
          g.fillStyle = 'rgba(30,8,52,' + (1 - ease(clamp01(x * 1.6))) + ')'; g.fillRect(0, 0, W, H);
          smoke(COVER, ease(x)); circle(COVER, clamp01(x * 2));
          emb.forEach(function (e) { var y = e.y - t * e.v * .35, al = (1 - x) * (.6 + .4 * Math.sin(t / 90 + e.ph)); if (ember) { drawRot(g, ember, e.x + Math.sin(t / 200 + e.ph) * 6, y, e.s * 7, e.s * 7, e.ph, Math.max(0, al)); return; } g.fillStyle = 'rgba(255,200,110,' + al + ')'; g.fillRect(e.x + Math.sin(t / 200 + e.ph) * 6, y, e.s, e.s); });
        });
      }).then(function () { c.o.remove(); });
    });
  }

  // GOOD WITCH — cloud roll: a sparkle trail swirls across, soft pastel clouds roll in from both sides and meet,
  // the snowy owl (owner: the skin's main animal, front view, wings spread) flies up into the middle under the crescent
  // moon with a gentle wing beat, then swoops up and away as the clouds drift apart.
  function equipGoodWitch(id, swap) {
    return Promise.all([fxArt(id, 'fx-owl-wings'), fxArt(id, 'moon-clouds'), fxArt(id, 'fx-cloud-1'), fxArt(id, 'fx-cloud-2'), fxArt(id, 'fx-cloud-3'), fxArt(id, 'fx-sparkle')].concat(['a', 'b', 'c'].reduce(function (l, c) { return l.concat(['0', '50', '100'].map(function (q) { return fxArt(id, 'constellation-' + c + '-' + q); })); }, []))).then(function (r) {
      var c = fxCanvas('good-witch'), g = c.g, W = c.W, H = c.H;
      var owl = r[0], moon = r[1], cloudIm = [r[2], r[3], r[4]].filter(Boolean), sparkIm = r[5], clouds = [], sparks = [], k;
      // constellations everywhere (owner): the skin's own constellation art lights up star by star (0 -> 50 -> 100%)
      var cons = [], cim = [[r[6], r[7], r[8]], [r[9], r[10], r[11]], [r[12], r[13], r[14]]];
      for (k = 0; k < 15; k++) cons.push({ x: W * ((k % 3) + .2 + Math.random() * .6) / 3, y: H * ((k / 3 | 0) + .15 + Math.random() * .7) / 5,
        s: 90 + Math.random() * 60, rot: (Math.random() - .5) * .8, im: cim[k % 3], d: 250 + Math.random() * 1100, ph: Math.random() * 6 });
      for (k = 0; k < 16; k++) { var left = k % 2 === 0; clouds.push({ left: left, y: (k / 16) * H * 1.1 - 30, r: 70 + Math.random() * 60, d: k * 45, tint: Math.random() < .5 ? '246,232,255' : '255,236,244', n: 4 + (k % 3), k: k }); }
      for (k = 0; k < 70; k++) sparks.push({ t: Math.random(), x: Math.random() * W, y: Math.random() * H, s: 1 + Math.random() * 3, ph: Math.random() * 6 });
      function puff(x, y, r, tint, a) {   // a fluffy cloud: overlapping soft circles with a pearly top
        g.save(); g.globalAlpha = a;
        var bumps = [[-.9, .1, .65], [-.45, -.25, .8], [0, -.35, .95], [.5, -.2, .8], [.95, .1, .62], [0, .2, 1]];
        bumps.forEach(function (b) { var gr = g.createRadialGradient(x + b[0] * r, y + b[1] * r - b[2] * r * .3, 0, x + b[0] * r, y + b[1] * r, b[2] * r);
          gr.addColorStop(0, '#ffffff'); gr.addColorStop(.7, 'rgba(' + tint + ',1)'); gr.addColorStop(1, 'rgba(' + tint + ',.0)');
          g.fillStyle = gr; g.beginPath(); g.arc(x + b[0] * r, y + b[1] * r, b[2] * r, 0, 6.283); g.fill(); });
        g.restore();
      }
      function scene(t, part) {   // part 0..1 = clouds pulling apart
        g.clearRect(0, 0, W, H);
        var bg = clamp01((t - 500) / 700) * (1 - part);
        if (bg) { var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(226,212,255,' + bg + ')'); gr.addColorStop(1, 'rgba(255,222,236,' + bg + ')'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
        clouds.forEach(function (cl) {
          var a = ease(clamp01((t - cl.d) / 900)), away = part * part;
          var from = cl.left ? -cl.r * 2 : W + cl.r * 2, to = cl.left ? W * .42 : W * .58, out = cl.left ? -W * .9 : W * 1.9;
          var x = from + (to - from) * a + (out - to) * away;
          if (cloudIm.length) {   // painted cloud banks (Codex art)
            var im = cloudIm[cl.k % cloudIm.length], w = W * (1.25 + (cl.k % 3) * .15), h = w * im.height / im.width;
            g.save(); g.translate(x + (cl.left ? -w * .25 : w * .25), cl.y); if (!cl.left) g.scale(-1, 1); g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
            return;
          }
          for (var i = 0; i < cl.n; i++) puff(x + (cl.left ? -1 : 1) * i * cl.r * 1.3, cl.y + (i % 2) * 18, cl.r, cl.tint, .97);
        });
        cons.forEach(function (cn) {
          if (!cn.im[0]) return;
          var a = clamp01((t - cn.d) / 700); if (a <= 0) return;
          var pop = a < .2 ? ease(a / .2) : 1, al = Math.min(1, a * 4) * (1 - part), y = cn.y - part * 90, w = cn.s * pop, h = w * cn.im[0].height / cn.im[0].width;
          var lit = a < .45 ? 0 : a < .75 ? 1 : 2;   // dim -> half lit -> fully glowing
          if (lit < 2) drawRot(g, cn.im[lit], cn.x, y, w, h, cn.rot, al);
          if (lit > 0) drawRot(g, cn.im[lit === 1 ? 1 : 2], cn.x, y, w, h, cn.rot, al * (lit === 2 ? .85 + .15 * Math.sin(t / 150 + cn.ph) : clamp01((a - .45) / .1)));
        });
        // sparkle trail sweeping across (a curve), then twinkles
        var sw = clamp01(t / 700);
        for (var s = 0; s < 40; s++) { var f = s / 40; if (f > sw) break; var x2 = W * (.05 + .9 * f), y2 = H * (.7 - .45 * Math.sin(f * Math.PI)) ; var al = (1 - (sw - f) * 2) * (1 - part); if (al <= 0) continue;
          g.fillStyle = 'rgba(232,180,70,' + al + ')'; star(x2, y2, 4 + (s % 3) * 1.5); }
        sparks.forEach(function (p) { var al = clamp01((t - 600) / 500) * (.5 + .5 * Math.sin(t / 120 + p.ph)) * (1 - part); if (al <= 0) return; if (sparkIm) { drawRot(g, sparkIm, p.x, p.y - part * 60, p.s * 9, p.s * 9, 0, al); return; } g.fillStyle = 'rgba(226,170,64,' + al + ')'; star(p.x, p.y - part * 60, p.s * 1.4); });
        var ca = clamp01((t - 1100) / 500) * (1 - clamp01(part * 2));
        if (moon && ca) { var mw = Math.min(W * .95, 440); g.save(); g.globalAlpha = ca; g.drawImage(moon, W / 2 - mw / 2, H * .12 - 20 * (1 - ca), mw, mw * moon.height / moon.width); g.restore(); }
        if (owl) {   // the owl flies in from below (never just appears), hovers with a wing beat, then swoops off the top
          var up = ease(clamp01((t - 750) / 900)), off = part * part;
          if (up > 0) {
            var ow = Math.min(W * .95, 440), oh = ow * owl.height / owl.width, beat = Math.sin(t / 105);
            var oy = H * 1.25 + (H * .5 - H * 1.25) * up + Math.sin(t / 260) * 8 - off * H * 1.1;
            var sc = (1 + off * .5), sx = sc * (1 + .07 * beat), sy = sc * (1 - .04 * beat);
            g.save(); g.translate(W / 2, oy); g.rotate(Math.sin(t / 340) * .04 - off * .1); g.scale(sx, sy);
            g.drawImage(owl, -ow / 2, -oh / 2, ow, oh); g.restore();
            if (sparkIm) for (var q = 0; q < 6; q++) { var ph = (t / 600 + q / 6) % 1; drawRot(g, sparkIm, W / 2 + (q % 2 ? 1 : -1) * ow * (.38 + ph * .1), oy + oh * (.1 + ph * .6), 18, 18, 0, (1 - ph) * up); }
          }
        }
      }
      function star(x, y, s) { g.beginPath(); for (var i = 0; i < 8; i++) { var a = i / 8 * 6.283, r = i % 2 ? s * .35 : s * 1.6; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); }
      var COVER = 1900;
      return fxRun(COVER, function (t) { scene(t, 0); }).then(function () { return swap(); })
        .then(function () { var t1 = COVER; return fxRun(1000, function (t, x) { scene(t1 + t, ease(x)); }); })
        .then(function () { c.o.remove(); });
    });
  }

  // VAPORWAVE — cold boot: the screen switches off to a line, a BIOS text screen types out ("Memory test… Loading
  // VAPOR.SYS"), the BlipVibe 95 boot logo fills a pink bar, then the CRT powers on from a bright centre line.
  function equipVaporwave(id, swap) {
    return fxArt(id, 'wordmark').then(function (wm) {
      var c = fxCanvas('vaporwave'), g = c.g, W = c.W, H = c.H;
      var lines = ['BlipVibe BIOS v1.995   (C) Neon Systems', '', 'CPU: Synthwave 486DX2 @ 66MHz', 'Memory Test: 640K OK', '',
        'Detecting skins..........  Vaporwave', 'Loading VAPOR.SYS ........ OK', 'Loading PALMS.DRV ........ OK', 'Loading SUNSET.FX ........ OK', '', 'Starting BlipVibe 95...'];
      function off(x) {   // old screen collapses to a bright line
        g.clearRect(0, 0, W, H); var h = (H / 2) * ease(x);
        g.fillStyle = '#000'; g.fillRect(0, 0, W, h); g.fillRect(0, H - h, W, h);
        if (x > .8) { var a = (x - .8) / .2; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,' + (1 - a) + ')'; g.fillRect(W * .5 * a, H / 2 - 1.5, W * (1 - a), 3); }
      }
      function bios(t) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        g.font = '14px Menlo, Consolas, monospace'; g.textBaseline = 'top';
        var chars = Math.floor(t / 3.8), y = 90;
        for (var i = 0; i < lines.length && chars > 0; i++) { var s = lines[i].slice(0, chars); chars -= lines[i].length + 4;
          g.fillStyle = i === 0 ? '#5ad1ff' : /OK|Vaporwave/.test(s) && s === lines[i] ? '#ff7ad9' : '#c8c8d0'; g.fillText(s, 18, y); y += 20; }
        if ((t / 300 | 0) % 2) { g.fillStyle = '#c8c8d0'; g.fillRect(18, y + 2, 9, 14); }
        scan();
      }
      function boot(x) {
        var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d0b3a'); gr.addColorStop(.6, '#52126e'); gr.addColorStop(1, '#ff4fc8');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        if (wm) { var w = Math.min(W * .78, 340); g.drawImage(wm, W / 2 - w / 2, H * .38 - w * wm.height / wm.width / 2, w, w * wm.height / wm.width); }
        var bw = Math.min(240, W * .62), bx = W / 2 - bw / 2, by = H * .52;
        g.fillStyle = '#fff'; g.fillRect(bx, by, bw, 18); g.fillStyle = '#7a7a86'; g.fillRect(bx, by, bw, 2); g.fillRect(bx, by, 2, 18);
        var segs = Math.floor((bw - 8) / 12), on = Math.floor(segs * x); g.fillStyle = '#ff4fc8';
        for (var k = 0; k < on; k++) g.fillRect(bx + 4 + k * 12, by + 4, 9, 10);
        g.fillStyle = '#fff'; g.font = '700 13px Verdana, sans-serif'; g.textAlign = 'center'; g.fillText('Starting BlipVibe 95…', W / 2, by + 30); g.textAlign = 'left';
        scan();
      }
      function scan() { g.fillStyle = 'rgba(0,0,0,.18)'; for (var y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); }
      return fxRun(420, function (t, x) { off(x); })
        .then(function () { var sw = swap(); return Promise.all([sw, fxRun(1350, function (t) { bios(t); })]); })
        .then(function () { return fxRun(700, function (t, x) { boot(ease(x)); }); })
        .then(function () {
          return fxRun(520, function (t, x) {   // power on: the picture opens out of a bright centre line
            var e = ease(x), h = (H / 2) * (1 - e);
            g.clearRect(0, 0, W, H); g.fillStyle = '#000'; g.fillRect(0, 0, W, h); g.fillRect(0, H - h, W, h);
            g.fillStyle = 'rgba(255,255,255,' + (1 - e) * .9 + ')'; g.fillRect(0, h - 2, W, 3); g.fillRect(0, H - h - 1, W, 3);
            g.fillStyle = 'rgba(255,255,255,' + (.35 * (1 - e)) + ')'; g.fillRect(0, h, W, H - 2 * h);
          });
        }).then(function () { c.o.remove(); });
    });
  }

  // Heaven's Light (owner: every skin's animations are its own).
  // Equip = the GATES OF HEAVEN: two marble-and-gold doors close over the screen, light pours through the seam while the
  // skin changes behind them, then the doors swing open onto it with god rays, sunrise clouds, feathers and sparkles.
  function equipHeaven(id, swap) {
    return Promise.all(['fx-gate-left', 'fx-gate-right', 'fx-light-rays', 'fx-cloud-1', 'fx-cloud-2', 'fx-feather', 'fx-sparkle'].map(function (n) { return fxArt(id, n); })).then(function (r) {
      var c = fxCanvas('heavens-light'), g = c.g, W = c.W, H = c.H;
      var gl = r[0], gr = r[1], rays = r[2], clouds = [r[3], r[4]], feather = r[5], spark = r[6], k;
      var feathers = [], sparks = [];
      for (k = 0; k < 18; k++) feathers.push({ x: Math.random() * W, y: -60 - Math.random() * H * .8, s: 26 + Math.random() * 26, v: .05 + Math.random() * .06, ph: Math.random() * 6, rot: Math.random() * 6 });
      for (k = 0; k < 40; k++) sparks.push({ x: W / 2 + (Math.random() - .5) * W * .9, y: Math.random() * H, s: 10 + Math.random() * 16, ph: Math.random() * 6 });
      function door(im, left, open) {   // open 0 = closed; 1 = swung fully out of view (foreshortened like a hinge)
        var w = (W / 2) * (1 - open * .92), x = left ? 0 : W - w, sk = open * .18;
        if (!im) { g.fillStyle = '#f3e3c2'; g.fillRect(x, 0, w, H); g.fillStyle = '#c9962e'; g.fillRect(left ? x + w - 4 : x, 0, 4, H); return; }
        g.save(); g.globalAlpha = 1 - open * .6;
        g.translate(left ? 0 : W, 0); g.transform(1, (left ? -1 : 1) * sk * .2, 0, 1, 0, 0);   // hinge on the outer edge
        // the right door is the LEFT door mirrored (owner: "mirror the wings") so both sides match
        if (!left) g.scale(-1, 1);
        g.drawImage(gl || im, 0, -H * .02, w, H * 1.04); g.restore();
      }
      function glow(a) {   // light pouring through the seam
        if (a <= 0) return;
        var gg = g.createLinearGradient(W / 2 - 60, 0, W / 2 + 60, 0);
        gg.addColorStop(0, 'rgba(255,236,180,0)'); gg.addColorStop(.5, 'rgba(255,250,225,' + a + ')'); gg.addColorStop(1, 'rgba(255,236,180,0)');
        g.fillStyle = gg; g.fillRect(W / 2 - 60, 0, 120, H);
      }
      function drift(t, a) {
        feathers.forEach(function (f) { var y = f.y + t * f.v * 2.2, x = f.x + Math.sin(t / 700 + f.ph) * 30; if (y > H + 60) return;
          if (feather) drawRot(g, feather, x, y, f.s, f.s * 1.6, f.rot + Math.sin(t / 500 + f.ph) * .5, a); });
        sparks.forEach(function (s) { var al = a * (.5 + .5 * Math.sin(t / 140 + s.ph)); if (spark) drawRot(g, spark, s.x, s.y, s.s, s.s, 0, al); });
      }
      return fxRun(800, function (t, x) {   // doors close
        var e = ease(x); g.clearRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,244,220,' + e * .35 + ')'; g.fillRect(0, 0, W, H);
        door(gl, true, 1 - e); door(gr, false, 1 - e); drift(t, e);
      }).then(function () {
        var sw = swap();
        return Promise.all([sw, fxRun(800, function (t, x) { g.clearRect(0, 0, W, H); door(gl, true, 0); door(gr, false, 0); glow(Math.sin(x * Math.PI / 2)); drift(800 + t, 1); })]);
      }).then(function () {
        return fxRun(1500, function (t, x) {   // doors swing open: god rays + clouds + feathers over the new skin
          var e = ease(x); g.clearRect(0, 0, W, H);
          if (rays) { g.save(); g.globalAlpha = Math.sin(Math.min(1, x * 1.3) * Math.PI) * .9; var rw = W * 1.5; g.drawImage(rays, W / 2 - rw / 2, -H * .05, rw, rw * rays.height / rays.width); g.restore(); }
          clouds.forEach(function (cl, i) { if (!cl) return; var w = W * 1.4, h = w * cl.height / cl.width, left = i === 0;
            g.save(); g.globalAlpha = 1 - e; g.translate(left ? -W * .2 - e * W * .7 : W * 1.2 + e * W * .7, H - h * .35);
            if (!left) g.scale(-1, 1); g.drawImage(cl, -w / 2, -h / 2, w, h); g.restore(); });
          glow((1 - e) * .9); door(gl, true, e); door(gr, false, e); drift(1600 + t, 1 - x * .8);
        });
      }).then(function () { c.o.remove(); });
    });
  }
  // Day <-> Twilight (Heaven's Light): a celestial dial — the sky turns, the sun sinks behind a cloud bank as the moon
  // rises out of it (and back), stars come out; the skin changes while the sky covers it, then the sky clears away.
  function heavenSwap(id, next) {
    if (swapping) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { if (data().setVariant) data().setVariant(id, next); return; }
    swapping = true;
    var toTw = next === 'twilight';
    // smooth (owner, Nov 16: "not super smooth"): preload the other rendition's main art BEFORE the sky moves, keep the
    // sky animating while anything still loads (no frozen frame), switch the skin a frame after the sky fully covers.
    var dir = BASE + id + '/assets/' + (toTw ? 'twilight/' : '');
    var main = ['background', 'header', 'top-bar', 'nav-bar', 'nav-active', 'post-panel', 'post-panel-b', 'post-panel-c',
      'temple-arches', 'cameo-wings', 'quests-frame', 'quest-row', 'list-row', 'stats-frame', 'tab', 'tab-active', 'chip',
      'chip-active', 'field', 'coin-pill', 'photo-frame', 'toggle-day', 'toggle-twilight', 'marble-ledge'];
    var preload = Promise.race([Promise.all(main.map(function (n) { return fxImg(dir + n + '.webp'); })), fxWait(4000)]);
    Promise.all(['fx-sun-disc', 'fx-moon-disc', 'fx-cloud-bank', 'fx-sparkle'].map(function (n) { return fxArt(id, n); })).then(function (r) {
      var c = fxCanvas('heavens-light-swap'), g = c.g, W = c.W, H = c.H, sun = r[0], moon = r[1], bank = r[2], spark = r[3];
      var stars = []; for (var k = 0; k < 50; k++) stars.push({ x: Math.random() * W, y: Math.random() * H * .6, s: 6 + Math.random() * 12, ph: Math.random() * 6 });
      var day = g.createLinearGradient(0, 0, 0, H); day.addColorStop(0, '#ffd99e'); day.addColorStop(.55, '#ffeccb'); day.addColorStop(1, '#fff7e6');
      var tw = g.createLinearGradient(0, 0, 0, H); tw.addColorStop(0, '#141a38'); tw.addColorStop(.55, '#3b3a6e'); tw.addColorStop(1, '#e09a7a');
      function inout(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
      var bw = Math.min(W * .62, 300), sunG = glowSprite('255,214,120'), moonG = glowSprite('230,230,255');
      function glowSprite(rgb) {   // pre-rendered glow (a radial gradient per frame was costly)
        var cv = document.createElement('canvas'), s = Math.ceil(bw * 2); cv.width = cv.height = s;
        var x = cv.getContext('2d'), gg = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        gg.addColorStop(0, 'rgba(' + rgb + ',.55)'); gg.addColorStop(1, 'rgba(' + rgb + ',0)'); x.fillStyle = gg; x.fillRect(0, 0, s, s); return cv;
      }
      // one continuous motion (owner: the sun and moon must fade INTO each other, no hard swap): progress p 0..1 drives
      // the sky colour, the sun sinking and the moon rising along the same arc, and a soft cross-fade between them.
      function sstep(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
      function frame(t, p, cover) {
        var e = inout(p), k = k0 + (k1 - k0) * e;
        g.clearRect(0, 0, W, H);
        g.globalAlpha = cover * (1 - k); g.fillStyle = day; g.fillRect(0, 0, W, H);
        g.globalAlpha = cover * k; g.fillStyle = tw; g.fillRect(0, 0, W, H);
        if (spark) stars.forEach(function (s) { var a = cover * k * (.45 + .55 * Math.sin(t / 260 + s.ph)); if (a > .02) drawRot(g, spark, s.x, s.y, s.s, s.s, 0, a); });
        var setIm = toTw ? sun : moon, riseIm = toTw ? moon : sun, setG = toTw ? sunG : moonG, riseG = toTw ? moonG : sunG;
        // original path (owner liked it): the current body sinks behind the cloud bank, the other rises back out of it —
        // with the two fading into each other where the paths meet (owner: "the sun to fade to the moon")
        var fade = sstep(.38, .62, p);
        var sy = hi + (lo - hi) * inout(Math.min(1, p / .62));
        var ry = lo + (hi - lo) * inout(Math.max(0, (p - .38) / .62));
        [[setIm, setG, sy, 1 - fade], [riseIm, riseG, ry, fade]].forEach(function (b) {
          if (!b[0] || b[3] <= .01) return; g.globalAlpha = cover * b[3];
          g.drawImage(b[1], W / 2 - bw, b[2] - bw, bw * 2, bw * 2); g.drawImage(b[0], W / 2 - bw / 2, b[2] - bw / 2, bw, bw); });
        if (bank) { var w = W * 1.15, h = w * bank.height / bank.width; g.globalAlpha = cover; g.drawImage(bank, W / 2 - w / 2, H - h * .82, w, h); }
        g.globalAlpha = 1;
      }
      var hi = H * .3, lo = H * .92, k0 = toTw ? 0 : 1, k1 = toTw ? 1 : 0, t0 = performance.now();
      return preload.then(function () {
        return fxRun(900, function (t, x) { frame(t, x * .5, inout(Math.min(1, x * 1.4))); });   // sky covers; first half of the arc
      }).then(function () {
        return new Promise(function (ok) { requestAnimationFrame(function () {   // switch under full cover, motion never stops
          if (data().setVariant) data().setVariant(id, next);
          var ready = false; fxArtReady().then(function () { ready = true; });
          var s0 = performance.now();
          (function loop(now) {
            var t = now - s0, x = Math.min(1, t / 1300);
            frame(now - t0, .5 + .5 * x, 1);
            if (x >= 1 && (ready || t > 5000)) ok(); else requestAnimationFrame(loop);
          })(s0);
        }); });
      }).then(function () {
        return fxRun(800, function (t, x) { frame(t, 1, 1 - inout(x)); });   // the sky clears onto the new rendition
      }).then(function () { c.o.remove(); swapping = false; }, function () { c.o.remove(); swapping = false; });
    });
  }
  var EQUIP_FX = { 'scrapbook': equipScrapbook, 'anime-blaze': equipBlaze, 'witchcraft': equipWitchcraft, 'good-witch': equipGoodWitch, 'vaporwave': equipVaporwave, 'heavens-light': equipHeaven };
  // app.js calls this from the Equip buttons: equipTransition(id, function () { ...apply + save... })
  function equipTransition(id, applyFn) {
    var fx = EQUIP_FX[id], reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fx || reduce || equipBusy) { applyFn(); return; }
    equipBusy = true;
    var swapP = null;
    function swap() { if (!swapP) { try { applyFn(); } catch (e) { console.error(e); } swapP = fxArtReady(); } return swapP; }
    function done() {
      swap();
      var o = document.getElementById('fsEquipFx'); if (o) o.remove();
      document.documentElement.style.transform = '';
      equipBusy = false;
    }
    var guard = setTimeout(done, 12000);   // never leave the screen covered
    fx(id, swap).then(function () { clearTimeout(guard); done(); }, function (e) { console.error(e); clearTimeout(guard); done(); });
  }

  /* ---------- account menu placement (owner, Nov 16: "some of them you can pull up the logout menu, they're out of
     screen"): every full skin moves the avatar somewhere else, so the dropdown (anchored under it) could open off the side
     or run under the bottom bar. While a full skin is on, the open menu is pinned to the viewport: on the avatar's side,
     inside the screen edges, above the bottom bar, scrolling if it is still too tall. Stays inside .nav-user so the app's
     click handlers keep working. ---------- */
  function placeUserMenu() {
    var m = document.getElementById('userDropdownMenu'), a = document.getElementById('navUserDropdown');
    if (!m || !a) return;
    var props = ['position', 'left', 'right', 'top', 'bottom', 'width', 'min-width', 'max-width', 'max-height', 'overflow-y', 'transform', 'z-index', '-webkit-overflow-scrolling', 'transition'];
    function clearIt() { props.forEach(function (p) { m.style.removeProperty(p); }); }
    if (!document.body.classList.contains('fs') || !m.classList.contains('show')) { clearIt(); return; }
    var r = a.getBoundingClientRect(), W = innerWidth, H = innerHeight, gap = 8;
    var bottomBar = H, nav = document.querySelector('.nav-center');
    if (nav) { var nr = nav.getBoundingClientRect(); if (nr.height && nr.top > H / 2) bottomBar = nr.top; }
    var w = Math.min(260, W - gap * 2);
    var left = (r.left + r.width / 2) < W / 2 ? Math.max(gap, r.left) : Math.min(W - gap, r.right) - w;
    left = Math.max(gap, Math.min(left, W - gap - w));
    var top = Math.min(Math.max(r.bottom + 6, gap), H * .5);
    var set = function (p, v) { m.style.setProperty(p, v, 'important'); };
    set('transition', 'none');   // style.css animates "all": a sliding top/left would spoil the measurement below
    set('position', 'fixed'); set('right', 'auto'); set('bottom', 'auto'); set('transform', 'none'); set('z-index', '10060');
    set('width', w + 'px'); set('min-width', '0'); set('max-width', w + 'px');
    set('max-height', Math.max(160, bottomBar - top - gap) + 'px'); set('overflow-y', 'auto'); set('-webkit-overflow-scrolling', 'touch');
    set('left', left + 'px'); set('top', top + 'px');
    // a skin may give an ancestor a transform/filter, which makes "fixed" relative to it: measure and correct
    var got = m.getBoundingClientRect();
    if (Math.abs(got.left - left) > 1 || Math.abs(got.top - top) > 1) { set('left', (2 * left - got.left) + 'px'); set('top', (2 * top - got.top) + 'px'); }
  }
  (function watchUserMenu() {
    var m = document.getElementById('userDropdownMenu');
    if (!m) { document.addEventListener('DOMContentLoaded', watchUserMenu); return; }
    new MutationObserver(placeUserMenu).observe(m, { attributes: true, attributeFilter: ['class'] });
    addEventListener('resize', placeUserMenu);
  })();

  window.BlipFullSkins = { onSkin: onSkin, apply: apply, clear: clear, render: render, meta: meta,
    catalog: catalog, categories: function () { return CATEGORIES.slice(); },
    active: function () { return active; },
    variants: function (id) { return FULL_SKINS[id] && FULL_SKINS[id].variants ? FULL_SKINS[id].variants.slice() : null; },
    variant: function () { return variant; }, equipTransition: equipTransition };
})();
