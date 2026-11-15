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

  /* Per-skin settings. `dark` = light text on dark surfaces. `timeline` = how many timeline photo
   * slots the profile shows. `slice` = border-image slice (percent) for stretchable panels. */
  var FULL_SKINS = {
    scrapbook: {
      name: 'Scrapbook', dark: false, ink: '#3e2d20', muted: '#75604b', accent: '#cf6f8c',
      font: "'Kalam', cursive", titleFont: "'Caveat', cursive",
      timeline: 2, avatar: 'center', slice: 18,
      // the app's own theme variables (style.css :root) re-pointed at this skin, so every surface the
      // engine doesn't restyle by hand (inputs, pills, rings, menus) still matches
      theme: { '--dark': '#3e2d20', '--gray': '#75604b', '--light-bg': '#fbf4e6', '--card': '#f1e4cb',
        '--border': 'rgba(62,45,32,.22)', '--nav-bg': '#e8c4c4' },
      fonts: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Kalam:wght@400;700&display=swap'
    }
  };
  window.FULL_SKINS = FULL_SKINS;

  // Absolute: a relative url() inside a custom property resolves against the stylesheet that
  // uses it (css/), not the page, so 'images/...' would become css/images/... and 404.
  var BASE = new URL(window.FS_BASE || 'images/skins/', document.baseURI).href;
  var active = null;
  var loadedFonts = {};

  function url(id, part) { return 'url("' + BASE + id + '/assets/' + part + '.webp")'; }

  function loadFonts(cfg) {
    if (!cfg.fonts || loadedFonts[cfg.fonts]) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = cfg.fonts;
    document.head.appendChild(l);
    loadedFonts[cfg.fonts] = true;
  }

  /* Shop extras a full skin overrides (spec: shop-item policy): layout templates (body.tpl-*) and
   * nav styles (body.nav-*) are taken off while the skin is on and put back when it comes off. The
   * app can re-add them at any time (profile view, try-on), so an observer keeps them off. */
  var SUSPEND = /^(tpl|nav)-/;
  var suspended = [];
  var observer = null;
  function suspendExtras() {
    var b = document.body;
    [].slice.call(b.classList).forEach(function (c) {
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
    PARTS.forEach(function (p) { b.style.removeProperty('--fs-' + p); });
    ICONS.forEach(function (n) { b.style.removeProperty('--fs-icon-' + n); });
    ['--fs-ink', '--fs-muted', '--fs-accent', '--fs-font', '--fs-title-font', '--fs-slice'].forEach(function (v) {
      b.style.removeProperty(v);
    });
    if (active && FULL_SKINS[active] && FULL_SKINS[active].theme) {
      Object.keys(FULL_SKINS[active].theme).forEach(function (v) { b.style.removeProperty(v); });
    }
    removeRendered();
    active = null;
    if (wasActive) restoreExtras();
  }

  function apply(id) {
    var cfg = FULL_SKINS[id];
    clear();
    if (!cfg) return;
    var b = document.body;
    loadFonts(cfg);
    b.classList.add('fs', 'fs-' + id, cfg.dark ? 'fs-dark' : 'fs-light');
    PARTS.forEach(function (p) { b.style.setProperty('--fs-' + p, url(id, p)); });
    ICONS.forEach(function (n) { b.style.setProperty('--fs-icon-' + n, url(id, 'icon-' + n)); });
    b.style.setProperty('--fs-ink', cfg.ink);
    b.style.setProperty('--fs-muted', cfg.muted);
    b.style.setProperty('--fs-accent', cfg.accent);
    b.style.setProperty('--fs-font', cfg.font);
    b.style.setProperty('--fs-title-font', cfg.titleFont || cfg.font);
    b.style.setProperty('--fs-slice', String(cfg.slice || 18));
    if (cfg.theme) Object.keys(cfg.theme).forEach(function (v) { b.style.setProperty(v, cfg.theme[v]); });
    active = id;
    startSuspending();
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
    while (urls.length < count) urls.push(urls[0] || 'images/default-avatar.svg');
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
      var img = document.createElement('img');
      img.src = src; img.alt = ''; img.loading = 'lazy';
      slot.appendChild(img);
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
    if (id && FULL_SKINS[id]) apply(id); else clear();
  }

  // app data the engine reads (exposed by app.js as window.BlipFullSkinsData)
  function data() {
    return window.BlipFullSkinsData || { photos: function () { return []; }, cover: function () { return null; } };
  }

  // premiumSkins-shaped metadata for full skins that aren't in the legacy premiumSkins list
  // (app.js applyPremiumSkin falls back to this)
  function meta(id) {
    var c = FULL_SKINS[id];
    if (!c) return null;
    return { id: id, name: c.name, accent: c.accent, accentHover: c.accentHover || c.accent, dark: !!c.dark };
  }

  window.BlipFullSkins = { onSkin: onSkin, apply: apply, clear: clear, render: render, meta: meta,
    active: function () { return active; } };
})();
