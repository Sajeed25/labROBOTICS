// Small persistent store for per-viewer progress (missions done, quiz bests, assembly times).
// Everything is wrapped in try/catch: private windows and blocked storage must never break the page.
const KEY = 'rl.progress';
let cache = null;
export function progress() {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { cache = {}; }
  cache.missions ||= {}; cache.quiz ||= {}; cache.asm ||= {};
  return cache;
}
export function saveProgress(mut) {
  const p = progress(); mut(p);
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('rl:progress', { detail: p }));
  return p;
}
export function get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } }
export function set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
export function track(detail) { try { window.dispatchEvent(new CustomEvent('site:track', { detail })); } catch { /* never break the UI */ } }
export function toast(msg, ms = 2600) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
}
