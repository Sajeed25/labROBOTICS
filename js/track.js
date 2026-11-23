// Anonymous usage tracker for Robotics Lab. No imports, no cookies, no personal data.
//
// What leaves the browser: a random visitor id (localStorage `bd.v`), a random per-tab session id,
// the referring page (without its query string), browser language, viewport width, time spent with
// the tab visible, and a list of small events such as { k: 'part', b: 'uno', p: 'mcu', t: 5300 }.
// Batches go to POST /api/track every ~15 s, when 40 events are waiting, and when the tab is hidden.
// On localhost nothing is sent (events are kept in window.__trackLog for debugging).
//
// SENDING IS SWITCHED OFF: the site is on static hosting with no /api/track endpoint.
// To turn it back on, set ENDPOINT to '/api/track' (needs a host that runs api/track.js, e.g. Vercel)
// or to another collector's URL.
const ENDPOINT = null;
//
// Other modules report what happens with:
//   window.dispatchEvent(new CustomEvent('site:track', { detail: { k: 'quiz-done', b: 'uno', s: 5 } }))
(() => {
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  let v; try { v = localStorage.getItem('bd.v'); if (!v) { v = rid(); localStorage.setItem('bd.v', v); } } catch { v = 'anon'; }
  const s = rid(), t0 = performance.now(); let visibleMs = 0, visSince = document.hidden ? null : performance.now();
  const q = []; const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  window.__trackLog = [];
  const ref = (() => { try { const u = new URL(document.referrer); return u.origin + u.pathname; } catch { return ''; } })();

  function flush(final = false) {
    if (!q.length) return;
    const now = performance.now(); const vis = visibleMs + (visSince != null ? now - visSince : 0);
    const body = JSON.stringify({ v, s, ref, lang: navigator.language, w: innerWidth, vis: Math.round(vis), e: q.splice(0, 40) });
    if (local || !ENDPOINT) return;
    try {
      if (final && navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      else fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    } catch { /* analytics must never break the page */ }
  }
  window.addEventListener('site:track', (e) => {
    try {
      const ev = { ...(e.detail || {}), t: Math.round(performance.now() - t0) };
      q.push(ev); window.__trackLog.push(ev); if (window.__trackLog.length > 200) window.__trackLog.shift();
      if (q.length >= 40) flush();
    } catch { /* ignore */ }
  });
  setInterval(() => flush(), 15000);
  document.addEventListener('visibilitychange', () => {
    const now = performance.now();
    if (document.hidden) { if (visSince != null) visibleMs += now - visSince; visSince = null; flush(true); } else visSince = now;
  });
  window.addEventListener('pagehide', () => flush(true));
})();
