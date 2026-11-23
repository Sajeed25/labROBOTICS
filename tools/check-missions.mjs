// Validates mission data: every instance exists, every wired pin exists on its board/module, ids are unique,
// and each mission has code and a run() function.  Usage: node tools/check-missions.mjs
import { MISSIONS } from '../js/lab/missions.js';
import { BOARDS } from '../js/boards/index.js';
import { MODULE_PINS } from '../js/lab/modules.js';

const boardPins = (def) => new Set((def.headers || []).flatMap((h) => [...h.pins, ...(h.pins2 || [])]).filter((p) => p && p !== '—'));
let problems = 0; const ids = new Set();
const fail = (m, msg) => { problems++; console.error(`✗ ${m.id}: ${msg}`); };
for (const m of MISSIONS) {
  if (ids.has(m.id)) fail(m, 'duplicate mission id'); ids.add(m.id);
  if (typeof m.run !== 'function') fail(m, 'missing run()');
  if (!m.code) fail(m, 'missing code');
  const inst = new Map();
  for (const s of m.setup) {
    if (inst.has(s.id)) fail(m, `duplicate instance ${s.id}`);
    if (s.board) { const def = BOARDS.find((b) => b.id === s.board); if (!def) fail(m, `unknown board ${s.board}`); else inst.set(s.id, boardPins(def)); }
    else if (MODULE_PINS[s.mod]) inst.set(s.id, new Set(MODULE_PINS[s.mod]));
    else fail(m, `unknown module ${s.mod}`);
  }
  for (const pair of m.wires) for (const ref of pair) {
    const [iid, ...rest] = ref.split(':'); const name = rest.join(':');
    if (!inst.has(iid)) fail(m, `wire uses unknown instance "${iid}"`);
    else if (!inst.get(iid).has(name)) fail(m, `"${iid}" has no pin "${name}"`);
  }
  if (!problems) console.log(`✓ ${m.id} — ${m.title}`);
}
for (const b of BOARDS) { const pins = boardPins(b); for (const p of b.parts) if (!b.comps.some((c) => c.part === p.id) && !(b.headers || []).some((h) => h.part === p.id)) { problems++; console.error(`✗ board ${b.id}: part "${p.id}" has no 3D component`); } void pins; }
console.log(problems ? `\n${problems} problem(s) found.` : `\nAll ${MISSIONS.length} missions and ${BOARDS.length} boards look good.`);
process.exit(problems ? 1 : 0);
