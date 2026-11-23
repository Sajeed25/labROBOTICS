// Builds one small static page per board at b/<id>/index.html.
// Link previews (WhatsApp, Facebook, LinkedIn, X) never run JavaScript and never see the #hash,
// so each board needs its own URL with its own Open Graph tags. People who open the link are
// sent straight on to the 3D lab at /#<id>.
//   node tools/build-share.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOARDS } from '../js/boards/index.js';

export const SITE = 'https://lab.robokalam.com';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

for (const b of BOARDS) {
  const url = `${SITE}/b/${b.id}/`;
  const title = `${b.name} in 3D | Robokalam Robotics Lab`;
  const desc = `${b.tagline}. Explore the ${b.short} in 3D: every part and pin explained, a quiz, a build-it-yourself assembly and wiring projects.`;
  const img = `${SITE}/assets/og/${b.id}.jpg`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Robokalam Robotics Lab">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(`3D model of the ${b.name}`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${img}">
  <link rel="icon" type="image/png" href="../../assets/logo-32.png">
  <meta http-equiv="refresh" content="0; url=../../#${b.id}">
  <script>location.replace('../../' + (location.search || '') + '#${b.id}');</script>
  <style>body{font:16px/1.5 system-ui,sans-serif;color:#12304d;display:grid;place-items:center;min-height:90vh;margin:0}a{color:#0f4470}</style>
</head>
<body>
  <p>Opening the <a href="../../#${b.id}">${esc(b.name)} in the Robotics Lab</a>…</p>
</body>
</html>
`;
  const file = join(root, 'b', b.id, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log('wrote', file.slice(root.length + 1));
}
