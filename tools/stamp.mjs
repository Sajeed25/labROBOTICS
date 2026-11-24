// Cache busting for the static host. The host tells browsers to keep CSS and JS for a week, so after a
// deploy a visitor can get the new index.html with an old stylesheet or old modules. This adds a short
// content hash (?v=…) to every local CSS/JS URL in index.html. The import map does the same for modules
// that are imported from other modules, so a changed file gets a new URL and unchanged files stay cached.
//   node tools/stamp.mjs        (run before each deploy; `npm run build` does it)
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hash = (p) => createHash('sha1').update(readFileSync(join(root, p))).digest('hex').slice(0, 8);
const walk = (dir) => readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(`${dir}/${e.name}`) : e.name.endsWith('.js') ? [`${dir}/${e.name}`] : []);

const files = walk('js').sort();
const v = Object.fromEntries([...files, 'css/style.css'].map((f) => [f, `${f}?v=${hash(f)}`]));

const imports = {
  three: './vendor/three/build/three.module.js',
  'three/addons/': './vendor/three/examples/jsm/',
  ...Object.fromEntries(files.map((f) => [`./${f}`, `./${v[f]}`])),
};
const map = `<script type="importmap">\n  ${JSON.stringify({ imports }, null, 2).replace(/\n/g, '\n  ')}\n  </script>`;

const file = join(root, 'index.html');
let html = readFileSync(file, 'utf8');
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, map);
html = html.replace(/(href|src)="((?:css|js)\/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"/g, (m, attr, p) => (v[p] ? `${attr}="${v[p]}"` : m));
writeFileSync(file, html);
console.log(`stamped ${files.length + 1} files in ${relative(root, file)}`);
