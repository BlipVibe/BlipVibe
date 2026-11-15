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
    name: 'Anime Blaze', wip: true, dark: true, ink: '#f5f1ea', muted: '#b9b1a6', accent: '#e8321e',
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

  function clear() {
    var b = document.body;
    if (!b) return;
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
    if (active && FULL_SKINS[active] && FULL_SKINS[active].theme) {
      Object.keys(FULL_SKINS[active].theme).forEach(function (v) { b.style.removeProperty(v); });
    }
    removeRendered();
    active = null;
    unwatchPosts();
    if (wasActive) restoreExtras();
  }

  function apply(id) {
    var cfg = FULL_SKINS[id];
    clear();
    if (!cfg) return;
    var b = document.body;
    loadFonts(cfg);
    variant = pickVariant(id);
    b.classList.add('fs', 'fs-' + id, cfg.dark ? 'fs-dark' : 'fs-light');
    if (cfg.variants) b.setAttribute('data-fs-variant', variant || cfg.variants[0].id);
    var parts = cfg.extras ? PARTS.concat(EXTRAS) : PARTS;
    parts.forEach(function (p) { b.style.setProperty('--fs-' + p, url(id, (cfg.parts && cfg.parts[p]) || p)); });
    ICONS.forEach(function (n) {
      b.style.setProperty('--fs-icon-' + n, url(id, (cfg.parts && cfg.parts['icon-' + n]) || 'icon-' + n));
    });
    (cfg.assets || []).forEach(function (a) { b.style.setProperty('--fs-' + a, url(id, a)); });
    b.style.setProperty('--fs-ink', cfg.ink);
    b.style.setProperty('--fs-muted', cfg.muted);
    var vcfg = cfg.variants && cfg.variants.filter(function (x) { return x.id === (variant || cfg.variants[0].id); })[0];
    b.style.setProperty('--fs-accent', (vcfg && vcfg.accent) || cfg.accent);
    b.style.setProperty('--fs-font', cfg.font);
    b.style.setProperty('--fs-title-font', cfg.titleFont || cfg.font);
    b.style.setProperty('--fs-slice', String(cfg.slice || 18));
    b.style.setProperty('--fs-edge', (cfg.edge || 16) + 'px');
    if (cfg.theme) Object.keys(cfg.theme).forEach(function (v) { b.style.setProperty(v, cfg.theme[v]); });
    active = id;
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
      it.setAttribute('data-fs-q', pct >= 100 || it.querySelector('.quest-check') ? '100' : pct >= 40 ? '50' : '0');
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
