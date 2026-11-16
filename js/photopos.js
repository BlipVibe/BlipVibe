/* BlipVibe — photo positioner for full skins (owner, Nov 16 2026):
 * "we have so many unique shapes for photos that are skin dependent, can we make it so when selecting a picture you can
 * zoom and move it around within the shape for the photo you're putting in it?"
 *
 * How it works
 * - A position is { s: photo url (no query), x, y: centre of the view in the photo (0..1), z: zoom (1 = fills the frame) },
 *   saved per skin and per frame in skin_data.fsPhotoPos = { "<skin>": { avatar: {...}, tl0: {...}, tl1: {...} } }.
 *   It only applies while the frame still shows that same photo, so a new photo starts centred again.
 * - Drawing: the photo is cropped (canvas) to exactly what the frame should show, at the frame's own shape, and the
 *   frame's <img> shows the crop. Every skin keeps its own CSS (masks, arches, padding rings) untouched.
 * - Editor: opens in the app modal (already dressed by every skin). The preview is a magnified, style-frozen copy of the
 *   real frame from the page — the skin's own frame / mask art — with a live canvas in place of the photo, so what you
 *   see is what you get. Drag / pinch / wheel / slider; Save, Reset, Cancel.
 */
(function () {
  'use strict';

  var ZMAX = 5;
  var cache = {};          // crop key -> object URL
  var srcCache = {};       // src -> Promise<Image|null>

  function fs() { return window.BlipFullSkins; }
  function dat() { return window.BlipFullSkinsData || {}; }
  function skin() { return fs() && fs().active ? fs().active() : null; }
  function base(u) { return u ? String(u).split('?')[0].split('#')[0] : ''; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function isOwnPv() {
    var b = document.getElementById('pvCoverEditBtn');
    return !!b && b.style.display !== 'none';
  }

  /* ---------- saved positions ---------- */

  // whose positions a frame shows: yours (home, your own profile) or the viewed person's
  function table(own) {
    var all = own ? (dat().photoPos ? dat().photoPos() : null) : (dat().viewedPhotoPos ? dat().viewedPhotoPos() : null);
    var t = all && skin() && all[skin()];
    return t && typeof t === 'object' ? t : null;
  }
  function posFor(own, key, src) {
    var t = table(own), p = t && t[key];
    if (!p || typeof p !== 'object' || !src || base(p.s) !== base(src)) return null;
    var z = +p.z, x = +p.x, y = +p.y;
    if (!(z >= 1) || !(x >= 0 && x <= 1) || !(y >= 0 && y <= 1)) return null;
    return { x: x, y: y, z: Math.min(z, ZMAX) };
  }

  /* ---------- crop maths (shared by the editor and the renderer) ---------- */

  // part of a W x H photo shown in a frame of aspect A (w/h) at position p — "cover" at z = 1
  function cropRect(W, H, A, p) {
    var cw, ch;
    if (W / H > A) { ch = H; cw = H * A; } else { cw = W; ch = W / A; }
    cw /= p.z; ch /= p.z;
    var cx = clamp(p.x * W, cw / 2, W - cw / 2), cy = clamp(p.y * H, ch / 2, H - ch / 2);
    return { sx: cx - cw / 2, sy: cy - ch / 2, sw: cw, sh: ch, cx: cx / W, cy: cy / H };
  }

  function loadSrc(src) {
    if (srcCache[src]) return srcCache[src];
    srcCache[src] = new Promise(function (ok) {
      function attempt(u, retry) {
        var im = new Image();
        if (!/^(data|blob):/.test(u)) im.crossOrigin = 'anonymous';
        im.onload = function () {
          // a copy cached without CORS headers taints the canvas: fetch it once more, uncached
          try { var c = document.createElement('canvas'); c.width = c.height = 1; c.getContext('2d').drawImage(im, 0, 0); c.toDataURL(); ok(im); }
          catch (e) { if (retry) attempt(u + (u.indexOf('?') < 0 ? '?' : '&') + 'bvpp=1', false); else ok(null); }
        };
        im.onerror = function () { if (retry && !/^(data|blob):/.test(u)) attempt(u + (u.indexOf('?') < 0 ? '?' : '&') + 'bvpp=1', false); else ok(null); };
        im.src = u;
      }
      attempt(src, true);
    });
    return srcCache[src];
  }

  // the <img>'s content box (where the photo is drawn; some skins pad the img to show a ring behind it)
  function contentBox(img) {
    var cs = getComputedStyle(img);
    var w = img.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var h = img.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    return { w: w, h: h };
  }

  function cropUrl(im, A, p, maxSide, type) {
    var r = cropRect(im.naturalWidth, im.naturalHeight, A, p);
    var key = im.src + '|' + A.toFixed(3) + '|' + p.x.toFixed(4) + '|' + p.y.toFixed(4) + '|' + p.z.toFixed(3) + '|' + maxSide;
    if (cache[key]) return Promise.resolve(cache[key]);
    var s = Math.min(1, maxSide / Math.max(r.sw, r.sh));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(r.sw * s)); c.height = Math.max(1, Math.round(r.sh * s));
    var g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(im, r.sx, r.sy, r.sw, r.sh, 0, 0, c.width, c.height);
    return new Promise(function (ok) {
      c.toBlob(function (b) {
        if (!b) { ok(null); return; }
        cache[key] = URL.createObjectURL(b); ok(cache[key]);
      }, type, .92);
    });
  }

  // show photo `src` in frame <img> `img` at position p (null = centred, as before)
  function applyTo(img, src, p) {
    if (!img) return;
    img.dataset.fsOrig = src;
    var token = String(Math.random());
    img.dataset.fsPpTok = token;
    if (!p) { if (img.getAttribute('src') !== src) img.src = src; return; }
    loadSrc(src).then(function (im) {
      if (img.dataset.fsPpTok !== token) return;
      if (!im) { if (img.getAttribute('src') !== src) img.src = src; return; }
      var tryIt = function (n) {
        var b = contentBox(img);
        if (!(b.w > 2 && b.h > 2)) { if (n < 20) setTimeout(function () { if (img.dataset.fsPpTok === token) tryIt(n + 1); }, 150); return; }
        var dpr = Math.min(window.devicePixelRatio || 1, 3);
        var png = /\.png$|^data:image\/(png|webp|gif)/i.test(base(src));
        cropUrl(im, b.w / b.h, p, Math.min(1600, Math.ceil(Math.max(b.w, b.h) * dpr * 1.25)), png ? 'image/png' : 'image/jpeg')
          .then(function (u) { if (u && img.dataset.fsPpTok === token) { img.dataset.fsPpUrl = u; img.src = u; } });
      };
      tryIt(0);
    });
  }

  /* ---------- frames on the page ---------- */

  function slotInfo(slot) {
    var wrap = slot && slot.closest('.fs-timeline');
    var cover = wrap && wrap.parentElement;
    var n = slot ? +slot.getAttribute('data-fs-slot') : -1;
    var own = !!cover && (cover.id === 'timelineCover' || (cover.id === 'pvCoverBanner' && isOwnPv()));
    return { n: n, own: own, key: 'tl' + n, img: slot && slot.querySelector('img'), src: slot && slot.getAttribute('data-fs-src') };
  }

  // called by fullskins.js renderTimeline for each photo slot
  function timelineSlot(slot, img, src, n, coverEl) {
    slot.setAttribute('data-fs-slot', n);
    if (src) slot.setAttribute('data-fs-src', src);
    var own = coverEl.id === 'timelineCover' || (coverEl.id === 'pvCoverBanner' && isOwnPv());
    applyTo(img, src, posFor(own, 'tl' + n, src));
  }

  function avatarImgs() {
    var l = [];
    var h = document.getElementById('profileAvatarImg'); if (h) l.push({ img: h, own: true, wrap: h.closest('.profile-avatar-wrap') });
    var pv = document.querySelector('#pvProfileCard .profile-avatar');
    if (pv) l.push({ img: pv, own: isOwnPv(), wrap: pv.closest('.profile-avatar-wrap') });
    return l;
  }
  // the photo url behind an avatar <img> (ours may be showing a crop)
  function origOf(img) {
    var cur = img.getAttribute('src') || '';
    if (img.dataset.fsOrig && (cur === img.dataset.fsPpUrl || cur === img.dataset.fsOrig)) return img.dataset.fsOrig;
    return cur;
  }
  var avObs = null;
  function avatars() {
    var on = !!skin();
    avatarImgs().forEach(function (a) {
      var src = origOf(a.img);
      if (!src || /default-avatar/.test(src)) { if (a.img.dataset.fsOrig) { delete a.img.dataset.fsOrig; } return; }
      applyTo(a.img, src, on ? posFor(a.own, 'avatar', src) : null);
      if (window.MutationObserver && !a.img._fsPpObs) {   // the app swapped the photo: re-apply for the new one
        a.img._fsPpObs = true;
        (avObs = avObs || new MutationObserver(function (ms) {
          ms.forEach(function (m) {
            var im = m.target, cur = im.getAttribute('src');
            if (!cur || cur === im.dataset.fsPpUrl) return;   // our own crop going in
            if (cur !== im.dataset.fsOrig) { delete im.dataset.fsOrig; delete im.dataset.fsPpUrl; }
            avatars();   // a new photo, or the app put the plain one back: apply the saved position again
          });
        })).observe(a.img, { attributes: true, attributeFilter: ['src'] });
      }
    });
  }
  // fullskins.js render() / clear()
  function render() { avatars(); }

  /* ---------- the editor ---------- */

  // copy every computed style of `src` (and its ::before/::after, as real spans) onto `dst`, so the copy keeps the
  // skin's look outside its page context
  function freeze(src, dst) {
    var out = {};
    var cs = getComputedStyle(src);
    for (var i = 0; i < cs.length; i++) dst.style.setProperty(cs[i], cs.getPropertyValue(cs[i]), cs.getPropertyPriority(cs[i]));
    dst.style.transition = 'none'; dst.style.animation = 'none'; dst.style.pointerEvents = 'none';
    ['before', 'after'].forEach(function (w) {
      var ps = getComputedStyle(src, '::' + w), ct = ps.getPropertyValue('content');
      if (!ct || ct === 'none' || ct === 'normal') return;
      var sp = document.createElement('span');
      for (var j = 0; j < ps.length; j++) sp.style.setProperty(ps[j], ps.getPropertyValue(ps[j]));
      sp.style.transition = 'none'; sp.style.animation = 'none'; sp.style.pointerEvents = 'none';
      var m = ct.match(/^"(.*)"$/);
      if (m && m[1]) sp.textContent = m[1].replace(/\\a /g, '\n');
      out[w] = sp;
    });
    return out;
  }
  // `target` set: `el` is an ancestor of the frame (e.g. the cover, whose art draws the polaroid paper / arches) — copy
  // only the branch that leads to the frame, then the frame in full
  function frozenCopy(el, photoImg, target) {
    var path = !!target && el !== target;
    var tgt = el === target ? null : undefined;
    var copy = document.createElement(el.tagName === 'IMG' ? 'span' : el.tagName === 'A' || el.tagName === 'BUTTON' ? 'span' : el.tagName), canvas = null;
    // no classes / ids: the page's skin rules (some !important) must not reach the copy; it carries its own styles
    var ps = freeze(el, copy);
    if (ps.before) copy.appendChild(ps.before);
    [].slice.call(el.childNodes).forEach(function (ch) {
      if (ch.nodeType === 3) { if (!path) copy.appendChild(document.createTextNode(ch.nodeValue)); return; }
      if (ch.nodeType !== 1) return;
      if (path && ch !== target && !ch.contains(target)) return;
      if (ch.matches('button, input, .avatar-edit-btn, .fs-pv-more')) return;
      if (ch === photoImg) {
        canvas = document.createElement('canvas');
        freeze(ch, canvas);
        copy.appendChild(canvas);
        return;
      }
      if (ch.tagName === 'IMG') {   // another picture inside the frame (sticker, ornament): keep it as a picture
        var pic = document.createElement('img'); pic.src = ch.currentSrc || ch.src; pic.alt = '';
        freeze(ch, pic); copy.appendChild(pic); return;
      }
      var r = frozenCopy(ch, photoImg, path ? target : null);
      copy.appendChild(r.el);
      if (r.canvas) canvas = r.canvas;
      if (r.tgt) tgt = r.tgt;
    });
    if (ps.after) copy.appendChild(ps.after);
    return { el: copy, canvas: canvas, tgt: tgt === null ? copy : tgt };
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* opts: { frame: element showing the frame, context: ancestor whose art surrounds it (optional), img: its photo <img>,
   *         src: photo url, key: 'avatar'|'tlN', title } */
  function open(opts) {
    var id = skin();
    if (!id || !opts.frame || !opts.img || !opts.src || typeof window.showModal !== 'function') return;
    var rect = opts.frame.getBoundingClientRect();
    if (!(rect.width > 4 && rect.height > 4)) return;
    var ctx = opts.context && opts.context.contains(opts.frame) ? opts.context : opts.frame;
    var crect = ctx.getBoundingClientRect();
    // copy the frame without its "tap to change" camera badge
    var ownCls = opts.frame.classList.contains('fs-tl-own');
    if (ownCls) opts.frame.classList.remove('fs-tl-own');
    var made = frozenCopy(ctx, opts.img, ctx === opts.frame ? null : opts.frame);
    if (ownCls) opts.frame.classList.add('fs-tl-own');
    if (!made.canvas) return;
    var box = contentBox(opts.img);
    var fw = ctx.offsetWidth, fh = ctx.offsetHeight;
    // centre of the frame as drawn (a tilted polaroid keeps its tilt), from the copy's top-left
    var fcx = rect.left + rect.width / 2 - crect.left, fcy = rect.top + rect.height / 2 - crect.top;
    var start = posFor(true, opts.key, opts.src) || { x: .5, y: .5, z: 1 };
    var p = { x: start.x, y: start.y, z: start.z };

    window.showModal('<div class="modal-header"><h3>' + esc(opts.title || 'Move & zoom') + '</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>' +
      '<div class="modal-body fs-pp-body"><div class="fs-pp-stage" aria-label="Photo preview — drag to move"><div class="fs-pp-scale"></div></div>' +
      '<p class="fs-pp-hint">Drag to move · pinch or scroll to zoom</p>' +
      '<label class="fs-pp-zoom"><span class="fs-pp-zl">Zoom</span><span class="fs-pp-track"><span class="fs-pp-fill"></span>' +
      '<input type="range" class="fs-pp-range" min="1" max="' + ZMAX + '" step="0.01" value="' + p.z + '" aria-label="Zoom"></span></label>' +
      '<div class="fs-pp-btns"><button class="btn btn-outline fs-pp-reset" type="button">Reset</button>' +
      '<button class="btn btn-outline fs-pp-cancel" type="button">Cancel</button>' +
      '<button class="btn btn-primary fs-pp-save" type="button">Save</button></div></div>');
    var mc = document.getElementById('modalContent');
    if (mc) mc.classList.add('fs-pp-modal');
    var stage = mc.querySelector('.fs-pp-stage'), scaler = mc.querySelector('.fs-pp-scale');
    var range = mc.querySelector('.fs-pp-range'), fill = mc.querySelector('.fs-pp-fill');
    var root = made.el, cv = made.canvas;
    [['position', 'relative'], ['inset', 'auto'], ['margin', '0'], ['flex', 'none'], ['translate', 'none'],
      ['width', fw + 'px'], ['height', fh + 'px'], ['max-width', 'none'], ['max-height', 'none']].forEach(function (q) { root.style.setProperty(q[0], q[1], 'important'); });
    scaler.appendChild(root);

    var k = 1, im = null;
    function layout() {
      // fit the frame as drawn (its bounding box), with a little of the art around it when it sits in a bigger picture
      var sw = stage.clientWidth, sh = Math.min(window.innerHeight * .46, 420), room = ctx === opts.frame ? 24 : 56;
      k = Math.min((sw - room) / rect.width, (sh - room) / rect.height, 6);
      var stH = Math.min(sh, Math.ceil(rect.height * k + room));
      stage.style.height = stH + 'px';
      scaler.style.width = fw + 'px'; scaler.style.height = fh + 'px';
      scaler.style.transform = 'scale(' + k + ')';
      scaler.style.left = (sw / 2 - fcx * k) + 'px';
      scaler.style.top = (stH / 2 - fcy * k) + 'px';
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      cv.width = Math.max(1, Math.round(box.w * k * dpr)); cv.height = Math.max(1, Math.round(box.h * k * dpr));
      draw();
    }
    function draw() {
      fill.style.width = ((p.z - 1) / (ZMAX - 1) * 100) + '%';
      if (!im) return;
      var r = cropRect(im.naturalWidth, im.naturalHeight, box.w / box.h, p);
      p.x = r.cx; p.y = r.cy;   // keep the centre where it can actually be (photo always fills the frame)
      var g = cv.getContext('2d');
      g.clearRect(0, 0, cv.width, cv.height);
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, r.sx, r.sy, r.sw, r.sh, 0, 0, cv.width, cv.height);
    }
    function setZoom(z, fx, fy) {   // zoom around a point of the frame (fx, fy in 0..1 of the frame), default the centre
      if (!im) return;
      z = clamp(z, 1, ZMAX);
      var A = box.w / box.h, a = cropRect(im.naturalWidth, im.naturalHeight, A, p);
      fx = fx == null ? .5 : fx; fy = fy == null ? .5 : fy;
      var px = (a.sx + a.sw * fx) / im.naturalWidth, py = (a.sy + a.sh * fy) / im.naturalHeight;
      p.z = z;
      var b = cropRect(im.naturalWidth, im.naturalHeight, A, { x: .5, y: .5, z: z });
      p.x = px + (.5 - fx) * b.sw / im.naturalWidth; p.y = py + (.5 - fy) * b.sh / im.naturalHeight;
      range.value = z; draw();
    }
    function moveBy(dx, dy) {   // screen pixels
      if (!im) return;
      var r = cropRect(im.naturalWidth, im.naturalHeight, box.w / box.h, p);
      var perPx = r.sw / (box.w * k);
      p.x -= dx * perPx / im.naturalWidth; p.y -= dy * perPx / im.naturalHeight; draw();
    }
    function framePoint(cx, cy) {
      var b = cv.getBoundingClientRect();
      return { x: clamp((cx - b.left) / b.width, 0, 1), y: clamp((cy - b.top) / b.height, 0, 1) };
    }

    // pointers: one = drag, two = pinch (+ drag by the midpoint)
    var pts = {}, last = null;
    function snap() {
      var l = Object.keys(pts).map(function (i) { return pts[i]; });
      if (!l.length) return null;
      if (l.length === 1) return { x: l[0].x, y: l[0].y, d: 0 };
      return { x: (l[0].x + l[1].x) / 2, y: (l[0].y + l[1].y) / 2, d: Math.hypot(l[0].x - l[1].x, l[0].y - l[1].y) };
    }
    stage.addEventListener('pointerdown', function (e) {
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      last = snap(); e.preventDefault();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var s = snap();
      if (last && s) {
        if (s.d && last.d) { var f = framePoint(s.x, s.y); setZoom(p.z * s.d / last.d, f.x, f.y); }
        moveBy(s.x - last.x, s.y - last.y);
      }
      last = s; e.preventDefault();
    });
    function up(e) { delete pts[e.pointerId]; last = snap(); }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var f = framePoint(e.clientX, e.clientY);
      setZoom(p.z * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0015)), f.x, f.y);
    }, { passive: false });
    // Safari trackpad pinch
    var gz = 1;
    stage.addEventListener('gesturestart', function (e) { e.preventDefault(); gz = p.z; });
    stage.addEventListener('gesturechange', function (e) { e.preventDefault(); setZoom(gz * e.scale); });
    range.addEventListener('input', function () { setZoom(+range.value); });
    stage.tabIndex = 0;
    stage.addEventListener('keydown', function (e) {
      var st = 12, m = { ArrowLeft: [st, 0], ArrowRight: [-st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[e.key];
      if (m) { e.preventDefault(); moveBy(m[0], m[1]); }
      else if (e.key === '+' || e.key === '=') setZoom(p.z * 1.1);
      else if (e.key === '-') setZoom(p.z / 1.1);
    });

    mc.querySelector('.fs-pp-reset').addEventListener('click', function () { p = { x: .5, y: .5, z: 1 }; range.value = 1; draw(); });
    mc.querySelector('.fs-pp-cancel').addEventListener('click', function () { window.closeModal(); });
    mc.querySelector('.fs-pp-save').addEventListener('click', function () {
      var r = function (v, n) { return Math.round(v * n) / n; };
      var val = (Math.abs(p.z - 1) < .005 && Math.abs(p.x - .5) < .002 && Math.abs(p.y - .5) < .002) ? null :
        { s: base(opts.src), x: r(p.x, 10000), y: r(p.y, 10000), z: r(p.z, 1000) };
      if (dat().setPhotoPos) dat().setPhotoPos(id, opts.key, val);
      window.closeModal();
      if (fs()) fs().render();
      if (typeof window.showToast === 'function') window.showToast('Photo position saved');
    });

    window.addEventListener('resize', layout);
    var obs = new MutationObserver(function () { if (!document.body.contains(stage)) { window.removeEventListener('resize', layout); obs.disconnect(); if (mc) mc.classList.remove('fs-pp-modal'); } });
    obs.observe(mc, { childList: true });
    requestAnimationFrame(layout);
    loadSrc(opts.src).then(function (x) {
      im = x;
      if (!im) { if (typeof window.showToast === 'function') window.showToast('Could not load this photo'); return; }
      draw();
    });
  }

  function editSlot(n, coverId) {
    var cover = document.getElementById(coverId || 'timelineCover');
    if (!cover || !cover.offsetParent) cover = document.getElementById(coverId === 'timelineCover' ? 'pvCoverBanner' : 'timelineCover') || cover;
    var slot = cover && cover.querySelector('.fs-tl-slot[data-fs-slot="' + n + '"]');
    var info = slotInfo(slot);
    if (!slot || !info.img || !info.src) return;
    open({ frame: slot, context: cover, img: info.img, src: info.src, key: info.key, title: 'Move & zoom photo' });
  }
  function editAvatar() {
    var a = avatarImgs().filter(function (x) { return x.own && x.img.offsetParent; })[0] || avatarImgs()[0];
    if (!a || !a.wrap) return;
    var src = origOf(a.img);
    if (!src || /default-avatar/.test(src)) return;
    open({ frame: a.img, context: a.wrap.parentElement || a.wrap, img: a.img, src: src, key: 'avatar', title: 'Move & zoom profile picture' });
  }

  // tap on your own timeline frame: Move & zoom / Change photo
  function slotMenu(slot, n, e) {
    var info = slotInfo(slot);
    if (!info.src || !info.img) { if (dat().pick) dat().pick(n); return; }
    closeMenu();
    var m = document.createElement('div');
    m.className = 'post-dropdown show fs-pp-menu';
    m.innerHTML = '<a href="#" data-a="move"><i class="fas fa-up-down-left-right"></i> Move &amp; zoom</a><a href="#" data-a="pick"><i class="fas fa-image"></i> Change photo</a>';
    document.body.appendChild(m);
    var r = slot.getBoundingClientRect();
    var top = r.top + window.scrollY + Math.min(r.height / 2, 60), left = r.left + window.scrollX + r.width / 2 - m.offsetWidth / 2;
    left = clamp(left, window.scrollX + 8, window.scrollX + document.documentElement.clientWidth - m.offsetWidth - 8);
    m.style.top = top + 'px'; m.style.left = left + 'px';
    m.addEventListener('click', function (ev) {
      var a = ev.target.closest('a'); if (!a) return;
      ev.preventDefault(); ev.stopPropagation(); closeMenu();
      var cover = slot.closest('.fs-timeline').parentElement;
      if (a.dataset.a === 'move') editSlot(n, cover.id);
      else if (dat().pick) dat().pick(n);
    });
    setTimeout(function () { document.addEventListener('click', closeMenu, { once: true }); }, 0);
  }
  function closeMenu() { var m = document.querySelector('.fs-pp-menu'); if (m) m.remove(); }

  // the zoom-slider knob, painted per skin (kit/pp → assets/pp-knob.webp, in every colour / rendition folder)
  ['scrapbook', 'anime-blaze', 'witchcraft', 'good-witch', 'vaporwave', 'heavens-light'].forEach(function (id) {
    var c = window.FULL_SKINS && window.FULL_SKINS[id];
    if (c && c.assets && c.assets.indexOf('pp-knob') < 0) c.assets.push('pp-knob');
  });

  window.BlipPhotoPos = { timelineSlot: timelineSlot, render: render, open: open, editSlot: editSlot,
    editAvatar: editAvatar, slotMenu: slotMenu, posFor: posFor, cropRect: cropRect };
  if (fs() && fs().active && fs().active()) { fs().apply(fs().active()); }   // a skin went on before this file loaded
})();
