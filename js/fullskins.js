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
    assets: ['panel9', 'panel9-alt', 'row9', 'row9-hot', 'bubble9-dark', 'bubble9-red', 'label9', 'button9-red',
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
    assets: ['header', 'cobweb-corner', 'nav-glow', 'tab', 'tab-active', 'post-panel', 'photo-arch', 'quests-frame',
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
    name: 'Good Witch', wip: true, dark: false, ink: '#4a2c6b', muted: '#8a76a6', accent: '#a77bf0',
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
    assets: ['background', 'top-bar', 'corner-vine', 'nav-bar', 'nav-orb', 'nav-orb-active', 'coin', 'coin-pill',
      'icon-compose', 'icon-phone', 'icon-close', 'icon-reply', 'icon-react', 'icon-chevron', 'icon-check', 'icon-clear',
      'icon-photo', 'icon-gif', 'icon-poll', 'icon-schedule', 'icon-globe', 'icon-people-small', 'icon-mute', 'icon-block',
      'icon-report', 'icon-heart',
      'notif-like', 'notif-follow', 'notif-comment', 'notif-mention', 'notif-message', 'notif-group', 'notif-purchase',
      'quests-frame', 'constellation-a-0', 'constellation-a-50', 'constellation-a-100', 'constellation-b-0',
      'constellation-b-50', 'constellation-b-100', 'constellation-c-0', 'constellation-c-50', 'constellation-c-100',
      'tab-underline', 'post-panel', 'photo-frame', 'story-ring', 'story-add', 'composer', 'featured-frame', 'arrow-orb',
      'goal-track', 'goal-fill', 'coin-goal-bar', 'moon-frame', 'photo-bubble', 'avatar-ring', 'camera-badge',
      'stats-frame', 'edit-btn', 'cat-cloud', 'star-frame', 'follow-btn', 'action-tile', 'menu-panel', 'list-row',
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
  window.FULL_SKINS = FULL_SKINS;

  // Absolute: a relative url() inside a custom property resolves against the stylesheet that
  // uses it (css/), not the page, so 'images/...' would become css/images/... and 404.
  var BASE = new URL(window.FS_BASE || 'images/skins/', document.baseURI).href;
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
    var ids = (cfg && cfg.variants || []).map(function (x) { return x.id; });
    if (ids.indexOf('day') < 0 || ids.indexOf('night') < 0) return;
    var search = document.getElementById('mobileSearchBtn');
    if (!search || !search.parentNode) return;
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
  function magicSwap(btn, id, next) {
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
    var night = next === 'night';
    var glowA = night ? 'rgba(200,160,255,' : 'rgba(255,224,150,', glowB = night ? 'rgba(255,226,170,' : 'rgba(205,165,255,';
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
  function watchPosts() {
    tagPosts();
    wrapNameCards();
    if (postObserver || !window.MutationObserver) return;
    postObserver = new MutationObserver(function (muts) {
      if (!active) return;
      for (var i = 0; i < muts.length; i++) if (muts[i].addedNodes.length) { tagPosts(); wrapNameCards(); break; }
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

  window.BlipFullSkins = { onSkin: onSkin, apply: apply, clear: clear, render: render, meta: meta,
    catalog: catalog, categories: function () { return CATEGORIES.slice(); },
    active: function () { return active; },
    variants: function (id) { return FULL_SKINS[id] && FULL_SKINS[id].variants ? FULL_SKINS[id].variants.slice() : null; },
    variant: function () { return variant; } };
})();
