// Vercel serverless endpoint for anonymous usage batches (see js/track.js).
// Accepts small JSON batches, validates their shape and logs a compact summary. No cookies, no IPs stored.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body || typeof body.v !== 'string' || !Array.isArray(body.e) || body.e.length > 200) { res.status(400).end(); return; }
    const counts = {};
    for (const ev of body.e) { const k = String(ev && ev.k || '?').slice(0, 24); counts[k] = (counts[k] || 0) + 1; }
    console.log(JSON.stringify({ v: body.v.slice(0, 40), s: String(body.s || '').slice(0, 40), lang: body.lang, w: body.w, counts }));
    res.status(204).end();
  } catch { res.status(400).end(); }
}
