/* BlipVibe live updates (OTA) — loaded FIRST in <head>, on its own, before Supabase and app.js.
   Nov 17 2026: the App Store copy only checked for updates at the END of its startup, after loading the user's data.
   An account wearing a skin that copy had never heard of (Scrapbook) crashed startup first, so the phone could never
   download the update — reinstalling didn't help. Keep this file tiny, dependency-free and independent of login, data
   or skins, so an update can always arrive even if everything else on the page breaks.
   Safety: notifyAppReady() marks the running bundle healthy right away; if a bundle fails to boot, the updater rolls
   back to the last good one (we keep the 3 newest good downloads so it always has one). */
(function () {
  if (window.__bvOtaStarted) return;
  window.__bvOtaStarted = true;
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  var U = C.Plugins && C.Plugins.CapacitorUpdater;
  if (!U) return;
  var MANIFEST = 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/ota/manifest.json';
  function warn(t, e) { try { console.warn('[OTA] ' + t, e); } catch (x) {} }

  try { U.notifyAppReady().catch(function (e) { warn('notifyAppReady', e); }); } catch (e) { warn('notifyAppReady', e); }

  function check() {
    var curVer = 'builtin';
    U.current().then(function (cur) {
      curVer = (cur && cur.bundle && cur.bundle.version) || 'builtin';
      return fetch(MANIFEST + '?t=' + Date.now(), { cache: 'no-store' });
    }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(function (m) {
      if (!m || !m.version || !m.url || m.version === curVer) return null;
      // skip a version that is already downloaded and queued
      return (U.getNextBundle ? U.getNextBundle().catch(function () { return null; }) : Promise.resolve(null)).then(function (nx) {
        if (nx && nx.version === m.version && nx.status !== 'error') return null;
        return U.download({ url: m.url, version: m.version }).then(function (b) {
          if (b && b.id && b.status !== 'error') return U.next({ id: b.id });
        });
      });
    }).catch(function (e) { warn('check failed', e); });
  }

  // Clean up old downloads a minute after start (every update leaves a copy behind). Never from the App Store copy;
  // keep the running bundle, the queued one and the 3 newest good downloads so a rollback always has somewhere to go.
  function cleanup() {
    var keep = { builtin: 1 };
    U.current().then(function (cur) {
      if (!cur || !cur.bundle || !cur.bundle.id || cur.bundle.id === 'builtin') return null;
      keep[cur.bundle.id] = 1;
      return (U.getNextBundle ? U.getNextBundle().catch(function () { return null; }) : Promise.resolve(null)).then(function (nx) {
        if (nx && nx.id) keep[nx.id] = 1;
        return U.list();
      }).then(function (lst) {
        var all = ((lst && lst.bundles) || []).filter(function (b) { return b && b.id && b.id !== 'builtin'; });
        all.filter(function (b) { return b.status === 'success'; })
          .sort(function (a, b) { return String(b.downloaded || '').localeCompare(String(a.downloaded || '')); })
          .slice(0, 3).forEach(function (b) { keep[b.id] = 1; });
        all.forEach(function (b) { if (!keep[b.id] && b.status !== 'downloading') U.delete({ id: b.id }).catch(function () {}); });
      });
    }).catch(function (e) { warn('cleanup', e); });
  }

  check();
  setTimeout(cleanup, 60000);
  // check again when the app comes back to the foreground (people rarely cold-start an app)
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') check(); });
})();
