/* BlipVibe full skins — DESKTOP layouts (blipvibe.com in a wide browser window).
 *
 * The phone layouts live in css/fullskins.css under @media (max-width: 768px) and are untouched.
 * On a wide window a full skin gets its own desktop layout (css/fullskins-desktop.css) instead of the app's
 * standard three white columns. This file only:
 *   1. tags <body> with fsd (+ fsd-<skin>) while a full skin is on and the window is desktop-wide,
 *   2. moves a few panels into the concept's columns (quests → left, featured skin → right, profile card →
 *      the cover band) and puts every one back exactly where it was when the window turns narrow or the skin
 *      goes away (app.js finds them by id, so moving is safe),
 *   3. scales the whole desktop layout with the window (designed at 1440 px) so the art never stretches,
 *   4. re-renders the cover frames when the frame count differs between phone and desktop (cfg.deskTimeline).
 * Web layer only.
 */
(function () {
  'use strict';

  var DESK = '(min-width: 1100px)';     // full desktop spread; 769–1099 keeps the standard layout for now
  var DESIGN_W = 1440;                   // concepts are painted at 1440 wide
  var mq = window.matchMedia ? window.matchMedia(DESK) : { matches: false, addListener: function () {} };
  var moved = [];                        // [node, placeholder comment]
  // desktop-only art per skin → --fsd-<name> = images/skins/<id>/assets/desktop/[<variant>/]<name>.webp
  // (the root rendition has no variant folder, like the phone kit)
  var ART = {
    scrapbook: ['polaroid-wide', 'polaroid-wide-b', 'desk-bg', 'topbar-wide', 'hero-wide', 'sheet9-tall', 'notepad9',
      'tab-paper', 'tab-paper-active', 'corner-flowers-l', 'corner-flowers-r'],
    // Heaven's Light: symmetrical temple (desktop concepts images/skins/heavens-light/desktop/, kit/desktop/day + twilight)
    'heavens-light': ['bg', 'nav-pediment', 'nav-tab', 'nav-tab-active', 'search-field', 'coin-pill', 'avatar-ring',
      'icon-button', 'rendition-track', 'profile-frame', 'name-plate', 'side-altar', 'side-card', 'quests-card',
      'post-card', 'feed-sheet', 'chip', 'chip-active', 'primary-button', 'input-bar', 'people-row', 'list-row',
      'list-row-active', 'progress-track', 'progress-fill', 'halo-0', 'halo-50', 'halo-100', 'photo-frame-square',
      'photo-frame-portrait', 'photo-frame-wide', 'chat-panel', 'chat-header', 'bubble-received', 'bubble-sent',
      'notification-row', 'group-card-frame', 'skin-card-frame', 'search-dropdown', 'decor-laurels', 'decor-coins',
      'decor-floral-corner', 'bg-groups', 'bg-skins'],
    // Witchcraft: an open spell book on a candlelit altar, one screen (desktop concepts images/skins/witchcraft/desktop/)
    witchcraft: ['bg', 'wordmark-plate', 'search-field', 'icon-button', 'coin-pill', 'avatar-ring', 'nav-tab', 'nav-tab-active',
      'tarot-frame', 'tarot-frame-star', 'profile-ring', 'nameplate', 'primary-button', 'primary-button-active', 'quests-card',
      'progress-track', 'progress-fill', 'decor-candles', 'decor-crystals', 'decor-flourish', 'thumbnail-frame', 'photo-frame',
      'parchment-note', 'parchment-tall', 'parchment-wide', 'people-row', 'story-seal', 'composer', 'feed-tab', 'feed-tab-active',
      'post-card', 'feed-panel', 'chip', 'chip-active', 'side-card', 'list-row', 'list-row-active', 'chat-backdrop', 'chat-header',
      'chat-received', 'chat-sent', 'input-bar', 'search-dropdown', 'group-frame', 'group-frame-star', 'skin-frame', 'skin-frame-star'],
    // Blood Moon: an opera house stage, one screen (desktop concepts images/skins/blood-moon/desktop/, Crimson + silver/)
    'blood-moon': ['bg', 'nav-valance', 'nav-cartouche', 'nav-tab', 'nav-tab-active', 'search-field', 'icon-button', 'coin-pill',
      'avatar-ring', 'rendition-switch', 'rendition-moon', 'side-panel', 'panel-title', 'quests-panel', 'quest-moon-0', 'quest-moon-50',
      'quest-moon-100', 'progress-track', 'progress-fill', 'chip', 'chip-active', 'gallery-frame', 'featured-frame', 'name-plate',
      'cover-left', 'cover-center', 'cover-right', 'profile-frame', 'primary-button', 'composer-panel', 'feed-panel', 'post-card',
      'photo-frame', 'people-row', 'candelabra', 'rose-cluster', 'rose-vine', 'chat-panel', 'conversation-panel', 'bubble-received',
      'bubble-sent', 'input-bar', 'list-row', 'list-row-active', 'notification-row', 'page-title', 'group-card', 'skin-card', 'search-dropdown']
  };
  // where each skin's concept puts the side panels (default: quests + coin goal top-left, featured skin top-right)
  var PLACE = { 'heavens-light': { featured: 'left-end' } };
  // one-screen skins (an open book, a stage, a desktop of windows): the whole 1440x900 design fits the window
  // (scale by width AND height, centred), and the feed scrolls inside its panel instead of the page
  var FIT = { witchcraft: true, 'blood-moon': true };
  var DESIGN_H = 900;
  var NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  var BASE = new URL(window.FS_BASE || (NATIVE ? 'https://blipvibe.com/images/skins/' : 'images/skins/'), document.baseURI).href;
  var artSet = [];
  var CSS_V = String(Date.now());      // same cache-busting as the other skin files (index.html)
  // each skin's desktop layout lives in css/desktop/<skin>.css and is only fetched while that skin is on
  function ensureCSS(id) {
    if (!id || !ART[id] || document.getElementById('fsdCSS-' + id)) return;
    var l = document.createElement('link');
    l.id = 'fsdCSS-' + id; l.rel = 'stylesheet';
    l.href = 'css/desktop/' + id + '.css?t=' + CSS_V;
    var main = document.getElementById('fullSkinsDeskCSS');
    if (main && main.parentNode) main.parentNode.insertBefore(l, main.nextSibling); else document.head.appendChild(l);
  }
  var on = false, skin = null, lastVariant = null;

  function activeSkin() {
    var b = document.body;
    if (!b || !b.classList.contains('fs')) return null;
    var m = b.className.match(/(?:^|\s)fs-(?!dark\b|light\b)([a-z0-9-]+)/);
    return m ? m[1] : null;
  }

  function moveTo(node, parent, before) {
    if (!node || !parent) return;
    var ph = document.createComment('fsd:' + (node.id || node.className));
    node.parentNode.insertBefore(ph, node);
    moved.push([node, ph]);
    parent.insertBefore(node, before || null);
  }

  function restore() {
    for (var i = moved.length - 1; i >= 0; i--) {
      var n = moved[i][0], ph = moved[i][1];
      if (ph.parentNode) { ph.parentNode.insertBefore(n, ph); ph.remove(); }
    }
    moved = [];
    var hero = document.getElementById('fsdHeroCard');
    if (hero) hero.remove();
  }

  function $(id) { return document.getElementById(id); }

  function arrange() {
    var home = $('page-home');
    if (!home) return;
    var left = home.querySelector('.left-sidebar'), right = home.querySelector('.right-sidebar');
    // the profile card sits in the cover band beside the cover frames (Home always shows cover + photo + card)
    var slot = document.createElement('div');
    slot.id = 'fsdHeroCard';
    slot.className = 'fsd-hero-card';
    var cover = $('timelineCover');
    if (cover) cover.parentNode.insertBefore(slot, cover.nextSibling);
    moveTo($('profileCard'), slot);
    // left column: quests, coin goal, then photos (already there)
    if (left) {
      var first = left.firstElementChild;
      moveTo($('questPanel'), left, first);
      moveTo($('coinGoalBar'), left, first);
    }
    var place = PLACE[skin] || {};
    if (place.featured === 'left-end' && left) moveTo($('featuredSkinBanner'), left, null);
    else if (right) moveTo($('featuredSkinBanner'), right, right.firstElementChild);   // featured skin top-right
  }

  function setArt(id) {
    var b = document.body;
    artSet.forEach(function (n) { b.style.removeProperty('--fsd-' + n); });
    artSet = [];
    if (!id || !ART[id]) return;
    var v = b.getAttribute('data-fs-variant');
    var vs = window.BlipFullSkins && window.BlipFullSkins.variants ? window.BlipFullSkins.variants(id) : null;
    var sub = v && vs && vs[0] && vs[0].id !== v ? v + '/' : '';
    ART[id].forEach(function (n) {
      b.style.setProperty('--fsd-' + n, 'url("' + BASE + id + '/assets/desktop/' + sub + n + '.webp")');
      artSet.push(n);
    });
  }

  function scale() {
    var z = on ? Math.min(window.innerWidth / DESIGN_W, 1.5) : 1;
    if (on && FIT[skin]) z = Math.min(z, window.innerHeight / DESIGN_H);
    if (on) z = Math.max(0.6, z);
    document.documentElement.style.setProperty('--fsd-z', String(Math.round(z * 1000) / 1000));
  }

  function sync() {
    var id = activeSkin();
    var want = !!id && !!ART[id] && mq.matches;   // only skins whose desktop layout is built
    var variant = document.body.getAttribute('data-fs-variant');
    if (want === on && id === skin && variant === lastVariant) { scale(); return; }
    lastVariant = variant;
    var b = document.body;
    var hadFrames = on;
    if (on) { restore(); b.classList.remove('fsd'); if (skin) b.classList.remove('fsd-' + skin); }
    on = want; skin = want ? id : null;
    b.classList.remove('fsd-fit');
    if (on) { ensureCSS(skin); b.classList.add('fsd', 'fsd-' + skin); if (FIT[skin]) b.classList.add('fsd-fit'); arrange(); clearHomePad(); }
    else if (hadFrames && typeof window.syncNavPadding === 'function') window.syncNavPadding();
    setArt(on ? skin : null);
    scale();
    // phone and desktop may show a different number of cover frames: redraw them
    if ((on || hadFrames) && window.BlipFullSkins && window.BlipFullSkins.render) window.BlipFullSkins.render();
  }

  // app.js syncNavPadding() writes the measured navbar height inline on #page-home (!important); desktop layouts
  // size their own bar, so drop that while a desktop layout is on, and let the app measure again when it turns off
  function clearHomePad() {
    var h = $('page-home');
    if (on && h && h.style.getPropertyValue('padding-top')) h.style.removeProperty('padding-top');
  }

  // fit skins scroll the feed inside its panel; app.js loads more posts on WINDOW scroll, so forward the panel's
  // scroll to the same loader (_loadMorePosts guards against double loads itself)
  function onFeedScroll(e) {
    if (!on || !FIT[skin]) return;
    var el = e.target;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 600 && typeof window._loadMorePosts === 'function') window._loadMorePosts();
  }

  window.BlipFullSkinsDesk = { on: function () { return on; }, sync: sync };

  function start() {
    sync();
    // the engine adds / removes body.fs + fs-<id> classes when a skin is applied or cleared
    new MutationObserver(function () { sync(); }).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-fs-variant'] });
    if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
    window.addEventListener('resize', scale);
    var feed = $('feedContainer');
    if (feed) feed.addEventListener('scroll', onFeedScroll, { passive: true });
    var home = $('page-home');
    if (home) new MutationObserver(clearHomePad).observe(home, { attributes: true, attributeFilter: ['style'] });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
