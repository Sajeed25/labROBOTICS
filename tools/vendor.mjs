// Copies the few Three.js files the site uses from node_modules into vendor/ (run after `npm install`).
import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['build/three.module.js', 'examples/jsm/controls/OrbitControls.js', 'examples/jsm/geometries/RoundedBoxGeometry.js', 'examples/jsm/environments/RoomEnvironment.js'];
for (const f of files) {
  const to = join(root, 'vendor/three', f); mkdirSync(dirname(to), { recursive: true });
  copyFileSync(join(root, 'node_modules/three', f), to); console.log('vendored', f);
}
