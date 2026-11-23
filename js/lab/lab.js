// The Lab: a 3D workbench where boards and modules are placed, wired pin-to-pin, checked and run.
import * as THREE from 'three';
import { Viewer, boardThumb, groupThumb, disposeDeep } from '../core/viewer.js';
import { buildBoard, KIND_COLORS, setLed, glowSprite } from '../core/builder.js';
import { MODULES, MODULE_IDS, buildModule } from './modules.js';
import { MISSIONS, missionById } from './missions.js';
import { toggleLofi, isLofiOn } from '../lofi.js';
import { progress, saveProgress, track, toast, get, set } from '../core/store.js';

const WIRE = { red: '#d3302b', black: '#1c1c1e', yellow: '#f1c21b', green: '#2e9e4f', blue: '#1f6fd6', orange: '#ee7a1c', white: '#ecebe6', purple: '#8a48b8' };
const SIGNAL_COLORS = ['yellow', 'green', 'blue', 'orange', 'white', 'purple'];
const BENCH = { w: 440, d: 300 };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (n) => `<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const BB_H = 8.5;

// ───────────── pin roles on boards ─────────────
function boardPinRole(name, def) {
  const n = name.toUpperCase();
  if (/^(5V|VBUS|VU)$/.test(n)) return { role: 'supply', v: 5 };
  if (/^(3V3|3V3\(OUT\)|3\.3V)$/.test(n)) return { role: 'supply', v: 3.3 };
  if (n === 'VIN' && (def.id === 'esp32' || def.id === 'nodemcu')) return { role: 'supply', v: 5 };   // 5 V from USB on these boards
  if (n === 'VIN' || n === 'VSYS') return { role: 'vin' };
  if (/GND/.test(n)) return { role: 'gnd' };
  if (/^(AREF|IOREF|ADC_VREF|VB|NC|RSV|RESET|RST|EN|RUN|3V3_EN|R|CLK|SD0|CMD|SD1|SD2|SD3|ID_SD|ID_SC|SWCLK|SWDIO|SWIO)$/.test(n)) return { role: 'other' };
  return { role: 'io', v: def.lab.logic };
}

function matTexture() {
  const S = 3, c = document.createElement('canvas'); c.width = BENCH.w * S; c.height = BENCH.d * S;
  const g = c.getContext('2d'); g.fillStyle = '#1d5a87'; g.fillRect(0, 0, c.width, c.height);
  for (let x = 0; x <= BENCH.w; x += 10) { g.strokeStyle = x % 50 ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.16)'; g.lineWidth = x % 50 ? 1 : 2; g.beginPath(); g.moveTo(x * S, 0); g.lineTo(x * S, c.height); g.stroke(); }
  for (let z = 0; z <= BENCH.d; z += 10) { g.strokeStyle = z % 50 ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.16)'; g.lineWidth = z % 50 ? 1 : 2; g.beginPath(); g.moveTo(0, z * S); g.lineTo(c.width, z * S); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.4)'; g.font = `600 ${4 * S}px system-ui`; g.fillText('ESD-SAFE WORK MAT · 1 SQUARE = 10 MM', 8 * S, (BENCH.d - 6) * S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function breadboard(w, d) {
  const g = new THREE.Group(); const S = 6;
  const c = document.createElement('canvas'); c.width = Math.round(w * S); c.height = Math.round(d * S);
  const x = c.getContext('2d'); x.fillStyle = '#f2efe6'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#d9d4c6'; x.fillRect(0, c.height / 2 - 1.5 * S, c.width, 3 * S);
  x.fillStyle = '#4a463c';
  for (let px = 2.54; px < w - 1; px += 2.54) for (let pz = 2.54; pz < d - 1; pz += 2.54) { if (Math.abs(pz - d / 2) < 2) continue; x.fillRect(px * S - S * .45, pz * S - S * .45, S * .9, S * .9); }
  x.strokeStyle = '#d3302b'; x.lineWidth = S * .4; x.beginPath(); x.moveTo(0, 1 * S); x.lineTo(c.width, 1 * S); x.stroke();
  x.strokeStyle = '#1f6fd6'; x.beginPath(); x.moveTo(0, c.height - 1 * S); x.lineTo(c.width, c.height - 1 * S); x.stroke();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const side = new THREE.MeshStandardMaterial({ color: '#ece8dc', roughness: .8 });
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: .8 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, BB_H, d), [side, side, top, side, side, side]);
  m.position.y = BB_H / 2; m.castShadow = m.receiveShadow = true; g.add(m); return g;
}

export class Lab {
  constructor(root, { boards, beep, initial = 'uno', highlight = esc } = {}) {
    this.root = root; this.boards = boards; this.beep = beep || (() => {}); this.hl = highlight;
    this.items = new Map(); this.wires = []; this.seq = 0; this.mission = null; this.pending = null; this.sel = null;
    this.sim = null; this.drive = new Map(); this.flags = new Set(); this.audio = null;
    this.buildDom(); this.initScene(); this.renderSide('boards');
    const qb = new URLSearchParams(location.search).get('bench');
    let restored = false;
    if (qb) { try { this.load(JSON.parse(decodeURIComponent(escape(atob(qb.replace(/-/g, '+').replace(/_/g, '/')))))); restored = true; toast('Loaded a shared circuit onto the bench.'); } catch (e) { console.warn(e); } }
    if (!restored) { try { const s = JSON.parse(get('rl.bench', 'null')); if (s && s.items?.length) { this.load(s); restored = true; this.status('Welcome back! Your last Free build is on the bench.'); } } catch { /* ignore */ } }
    if (!restored) this.sandbox(initial);
  }

  // ───────────────────────── DOM ─────────────────────────
  buildDom() {
    this.root.innerHTML = `<div class="lab" tabindex="-1">
      <div class="lab-toolbar" role="toolbar" aria-label="Workbench">
        <button class="btn small" data-a="missions">${icon('target')} Missions</button>
        <button class="btn small run-btn" data-a="run">${icon('play')} <span>Run</span></button>
        <button class="btn small" data-a="autowire">Wire it for me</button>
        <button class="btn small" data-a="unwire">Remove wires</button>
        <span class="sep"></span>
        <button class="btn small ghost" data-a="top">${icon('eye')} Top view</button>
        <button class="btn small ghost" data-a="sound" aria-pressed="true">${icon('sound')} <span>Sound on</span></button>
        <button class="btn small ghost" data-a="lofi" aria-pressed="false">${icon('music')} Lofi</button>
        <button class="btn small ghost" data-a="share">${icon('share')} Share</button>
        <button class="btn small ghost" data-a="export">Save</button>
        <button class="btn small ghost" data-a="import">Load</button>
        <input type="file" accept="application/json" hidden data-file>
        <span class="grow"></span>
        <span class="mode" data-mode>Free build</span>
        <button class="btn small ghost" data-a="clear">${icon('trash')} Clear the bench</button>
        <button class="btn small" data-a="full">${icon('full')} <span>Full screen</span></button>
      </div>
      <div class="lab-body">
        <aside class="lab-side"><div class="lab-tabs" role="tablist"><button class="on" data-tab="boards" role="tab">Boards</button><button data-tab="parts" role="tab">Parts</button></div><div class="lab-list" data-list></div></aside>
        <div class="lab-view" data-view>
          <div class="lab-status frost" data-status role="status" aria-live="polite"><span class="msg">Pick boards and parts on the left, then click a pin to start a wire.</span></div>
          <div class="lab-controls frost" data-controls></div>
          <div class="lab-sel frost" data-sel hidden><button class="tb" data-a="rotate">${icon('rotate')}<span>Rotate 90° (R)</span></button><button class="tb" data-a="remove">${icon('trash')}<span>Remove (Del)</span></button></div>
          <div class="pin-tip" data-tip hidden></div>
        </div>
        <div class="lab-panes">
          <div class="mission-card" data-mcard></div>
          <div class="code-pane"><div class="code-tabs" data-ctabs></div><pre data-code></pre></div>
          <div class="serial" data-serial><div class="hd"><span>Serial monitor</span><button type="button" data-a="clrserial">clear</button></div><div data-lines>Press Run to see what the boards print.</div></div>
        </div>
      </div></div>`;
    const q = (s) => this.root.querySelector(s);
    this.el = { lab: q('.lab'), list: q('[data-list]'), view: q('[data-view]'), status: q('[data-status]'), controls: q('[data-controls]'), sel: q('[data-sel]'), tip: q('[data-tip]'), mcard: q('[data-mcard]'), ctabs: q('[data-ctabs]'), code: q('[data-code]'), lines: q('[data-lines]'), mode: q('[data-mode]'), run: q('[data-a="run"]'), file: q('[data-file]') };
    this.root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]'); if (t) { this.renderSide(t.dataset.tab); return; }
      const add = e.target.closest('[data-add]'); if (add) { this.addFromSide(add.dataset.add, add.dataset.kind); return; }
      const a = e.target.closest('[data-a]'); if (a) this.action(a.dataset.a, a);
      const ms = e.target.closest('[data-mission]'); if (ms) { this.closeDialog(); ms.dataset.mission === 'free' ? this.sandbox(this.firstBoardId() || 'uno') : this.startMission(ms.dataset.mission); }
      const ct = e.target.closest('[data-ctab]'); if (ct) this.showCode(+ct.dataset.ctab);
    });
    this.el.file.addEventListener('change', async () => { const f = this.el.file.files[0]; if (!f) return; try { this.load(JSON.parse(await f.text())); toast('Circuit loaded.'); } catch { toast('That file is not a Robotics Lab circuit.'); } this.el.file.value = ''; });
    this.el.lab.addEventListener('pointerenter', () => { this.hover = true; });
    this.el.lab.addEventListener('pointerleave', () => { this.hover = false; this.el.tip.hidden = true; });
    document.addEventListener('keydown', (e) => this.onKey(e));
    this.sound = get('rl.sound', '1') === '1'; this.syncSoundBtn();
    window.addEventListener('lofi:change', (e) => this.root.querySelector('[data-a="lofi"]').setAttribute('aria-pressed', String(e.detail.on)));
    this.root.querySelector('[data-a="lofi"]').setAttribute('aria-pressed', String(isLofiOn()));
  }
  syncSoundBtn() { const b = this.root.querySelector('[data-a="sound"]'); b.setAttribute('aria-pressed', String(this.sound)); b.querySelector('span').textContent = this.sound ? 'Sound on' : 'Sound off'; }

  renderSide(tab) {
    this.tab = tab;
    this.root.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const thumb = (k, fn) => { try { return `<img alt="" src="${fn()}">`; } catch { return '<span class="sw">▢</span>'; } };
    this.el.list.innerHTML = tab === 'boards'
      ? this.boards.map((b) => `<button class="lab-item" data-add="${b.id}" data-kind="board" title="Add ${esc(b.name)}">${thumb(b.id, () => boardThumb(b))}<span><b>${esc(b.name)}</b><small>${b.lab.logic} V · ${esc(b.lab.plug === 'bread' ? 'on a breadboard' : b.lab.plug === 'post' ? 'header pins' : 'socket headers')}</small></span></button>`).join('')
      : MODULE_IDS.map((id) => `<button class="lab-item" data-add="${id}" data-kind="mod" title="${esc(MODULES[id].desc)}">${thumb(id, () => groupThumb('mod-' + id, () => buildModule(id).group, 120, 90))}<span><b>${esc(MODULES[id].name)}</b><small>${esc(MODULES[id].desc.slice(0, 60))}${MODULES[id].desc.length > 60 ? '…' : ''}</small></span></button>`).join('');
  }
  refreshThumbs() { this.renderSide(this.tab); }

  // ───────────────────────── scene ─────────────────────────
  initScene() {
    const v = this.v = new Viewer(this.el.view, { motion: () => !matchMedia('(prefers-reduced-motion: reduce)').matches });
    v.el.querySelector('canvas').setAttribute('aria-label', '3D workbench');
    v.controls.maxPolarAngle = Math.PI * .47; v.controls.enablePan = true; v.controls.minDistance = 60; v.controls.maxDistance = 900;
    v.scene.background = new THREE.Color('#0f2a43');
    v.ground.visible = false;
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(BENCH.w, BENCH.d), new THREE.MeshStandardMaterial({ map: matTexture(), roughness: .95 }));
    mat.rotation.x = -Math.PI / 2; mat.receiveShadow = true; v.scene.add(mat); this.mat = mat;
    const table = new THREE.Mesh(new THREE.BoxGeometry(BENCH.w + 80, 12, BENCH.d + 60), new THREE.MeshStandardMaterial({ color: '#8a6a48', roughness: .8 }));
    table.position.y = -6.05; table.receiveShadow = true; v.scene.add(table);
    const key = v.scene.children.find((c) => c.isDirectionalLight); key.shadow.camera.left = -260; key.shadow.camera.right = 260; key.shadow.camera.top = 200; key.shadow.camera.bottom = -200; key.position.set(80, 300, 160); key.shadow.camera.far = 800; key.shadow.camera.updateProjectionMatrix();
    v.camera.position.set(0, 330, 300); v.controls.target.set(0, 0, 15);
    this.wireGroup = new THREE.Group(); v.scene.add(this.wireGroup);
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const cv = v.renderer.domElement;
    cv.addEventListener('pointerdown', (e) => this.onDown(e));
    cv.addEventListener('pointermove', (e) => this.onMove(e));
    cv.addEventListener('pointerup', (e) => this.onUp(e));
    v.onFrame((dt, now) => this.frame(dt, now));
  }

  // ───────────────────────── instances ─────────────────────────
  firstBoardId() { for (const it of this.items.values()) if (it.kind === 'board') return it.ref; return null; }
  nextSpot() {
    const spots = [[-60, -20], [90, 70], [30, 80], [-30, 85], [130, 0], [150, 75], [-120, 85], [-150, -70], [140, -80], [0, -100], [-170, 10]];
    for (const [x, z] of spots) { let free = true; for (const it of this.items.values()) if (Math.hypot(it.group.position.x - x, it.group.position.z - z) < 40) free = false; if (free) return [x, z]; }
    return [(Math.random() - .5) * 300, (Math.random() - .5) * 200];
  }
  addFromSide(ref, kind) {
    if (this.sim) this.stop();
    const at = this.nextSpot();
    const it = kind === 'board' ? this.addBoard(ref, { at }) : this.addModule(ref, { at });
    if (this.mission && !this.mission.free) { this.mission = { free: true }; this.el.mode.textContent = 'Free build'; this.renderMission(); }
    this.select({ inst: it }); this.status(`Added ${it.label}. Click a pin to start a wire.`); this.changed();
    track({ k: 'bench-add', p: ref });
  }
  addBoard(defId, { id, at = [0, 0], rot = 0 } = {}) {
    const def = this.boards.find((b) => b.id === defId); if (!def) return null;
    const group = new THREE.Group(); const board = buildBoard(def);
    if (def.lab.plug === 'bread') {
      const bbW = Math.max(82, def.pcb.w + 16), bbD = Math.max(55, def.pcb.d + 24);
      group.add(breadboard(bbW, bbD)); board.position.y = BB_H + 2.5;
    } else board.position.y = def.id === 'rpi4' ? 5 : 3.5;
    group.add(board);
    if (def.lab.plug !== 'bread') for (const [hx, hz] of def.pcb.holes || []) { const s = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, board.position.y, 10), new THREE.MeshStandardMaterial({ color: '#cbb26a', metalness: .6, roughness: .3 })); s.position.set(hx, board.position.y / 2, hz); group.add(s); }
    const iid = id || this.uid(def.id);
    const pins = board.userData.pins.map((p, i) => ({ ...boardPinRole(p.name, def), name: p.name, kind: p.kind, funcs: p.funcs, mesh: p.mesh, dy: .9, idx: i, inst: null }));
    const it = { id: iid, kind: 'board', ref: def.id, def, group, board, pins, state: {}, label: def.short };
    pins.forEach((p) => { p.inst = it; p.mesh.userData.pin = p; });
    board.userData.leds.forEach((l) => setLed(l, 0));
    return this.place(it, at, rot);
  }
  addModule(type, { id, at = [0, 0], rot = 0 } = {}) {
    if (!MODULES[type]) return null;
    const m = buildModule(type);
    const iid = id || this.uid(type);
    const n = [...this.items.values()].filter((x) => x.ref === type).length + 1;
    const SHORT = { led: 'LED', rgb: 'RGB LED', button: 'Button', pot: 'Knob', buzzer: 'Buzzer', servo: 'Servo', motor: 'Motor', 'motor-driver': 'Motor driver', battery: 'Battery', ultrasonic: 'Ultrasonic', oled: 'OLED', dht11: 'DHT11', ldr: 'Light sensor', 'level-shifter': 'Level shifter' };
    const it = { id: iid, kind: 'mod', ref: type, mod: m, group: m.group, pins: [], state: {}, label: `${SHORT[type] || type}${n > 1 ? ' ' + n : ''}` };
    it.pins = m.pins.map((p, i) => ({ name: p.name, role: p.role, kind: p.kind, funcs: '', mesh: p.mesh, dy: .6, idx: i, inst: it }));
    it.pins.forEach((p) => { p.mesh.userData.pin = p; });
    it.state = { pressed: false, value: .5, light: .7, dist: 120, temp: 23, hum: 45 };
    return this.place(it, at, rot);
  }
  uid(base) { let i = 1, id = base; while (this.items.has(id)) id = `${base}${++i}`; return id; }
  place(it, [x, z], rot) {
    it.group.position.set(x, 0, z); it.group.rotation.y = rot * Math.PI / 2; it.rot = rot;
    it.group.traverse((o) => { o.userData.inst = it; });
    this.v.scene.add(it.group); this.items.set(it.id, it); it.group.updateMatrixWorld(true);
    return it;
  }
  removeInst(it) {
    this.wires.filter((w) => w.a.inst === it || w.b.inst === it).forEach((w) => this.removeWire(w, false));
    this.v.scene.remove(it.group); disposeDeep(it.group); this.items.delete(it.id);
    if (this.sel?.inst === it) this.select(null);
    this.changed();
  }
  pinTop(p) { const v = p.mesh.getWorldPosition(new THREE.Vector3()); v.y -= p.dy; return v; }
  findPin(ref) { const [iid, ...rest] = ref.split(':'); const name = rest.join(':'); const it = this.items.get(iid); return it?.pins.find((p) => p.name === name) || null; }
  pinLabel(p) { return `${p.inst.label} ${p.name}`; }

  // ───────────────────────── wires ─────────────────────────
  wireColor(a, b) {
    const r = [a.role, b.role];
    if (r.includes('gnd')) return 'black';
    if (r.some((x) => ['supply', 'src', 'vcc', 'vin', 'lv', 'hv'].includes(x))) return 'red';
    return SIGNAL_COLORS[this.wires.filter((w) => w.color !== 'red' && w.color !== 'black').length % SIGNAL_COLORS.length];
  }
  addWire(a, b, { animate = false } = {}) {
    if (a === b) return null;
    if (this.wires.some((w) => (w.a === a && w.b === b) || (w.a === b && w.b === a))) return null;
    const w = { a, b, color: this.wireColor(a, b) }; this.wires.push(w); this.drawWire(w);
    if (animate) { w.mesh.scale.set(1, .001, 1); this.v.tween(260, (k) => w.mesh.scale.set(1, Math.max(.001, k), 1)); }
    if (this.sim) this.stop();
    this.changed(); return w;
  }
  drawWire(w) {
    if (w.mesh) { this.wireGroup.remove(w.mesh); disposeDeep(w.mesh); }
    const p1 = this.pinTop(w.a), p2 = this.pinTop(w.b), d = p1.distanceTo(p2), h = 10 + d * .2;
    const mid = p1.clone().lerp(p2, .5); mid.y = Math.max(p1.y, p2.y) + h;
    const up = new THREE.Vector3(0, 7, 0);
    const curve = new THREE.CatmullRomCurve3([p1.clone().add(new THREE.Vector3(0, 3, 0)), p1.clone().add(up), mid, p2.clone().add(up), p2.clone().add(new THREE.Vector3(0, 3, 0))]);
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: WIRE[w.color], roughness: .45, emissive: new THREE.Color('#000') });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 56, .62, 8), mat); tube.castShadow = true; g.add(tube);
    for (const p of [p1, p2]) { const plug = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6, 2.2), new THREE.MeshStandardMaterial({ color: '#141414', roughness: .5 })); plug.position.copy(p).add(new THREE.Vector3(0, 2.6, 0)); g.add(plug); }
    g.traverse((o) => { o.userData.wire = w; });
    w.mesh = g; w.mat = mat; this.wireGroup.add(g);
  }
  removeWire(w, notify = true) { this.wireGroup.remove(w.mesh); disposeDeep(w.mesh); this.wires = this.wires.filter((x) => x !== w); if (this.sel?.wire === w) this.select(null); if (notify) { if (this.sim) this.stop(); this.changed(); } }
  redrawWiresOf(it) { this.wires.filter((w) => w.a.inst === it || w.b.inst === it).forEach((w) => this.drawWire(w)); }

  // ───────────────────────── nets & checks ─────────────────────────
  nets() {
    const parent = new Map(); const key = (p) => `${p.inst.id}:${p.idx}`;
    const find = (k) => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k); } return k; };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    const all = []; for (const it of this.items.values()) for (const p of it.pins) { parent.set(key(p), key(p)); all.push(p); }
    for (const it of this.items.values()) {
      const groups = new Map();
      for (const p of it.pins) {
        const g = p.role === 'gnd' ? 'GND' : (p.role === 'supply' || p.role === 'vin') ? 'S:' + p.name : null;
        if (!g) continue; if (groups.has(g)) union(key(p), groups.get(g)); else groups.set(g, key(p));
      }
    }
    for (const w of this.wires) union(key(w.a), key(w.b));
    const byRoot = new Map(); for (const p of all) { const r = find(key(p)); if (!byRoot.has(r)) byRoot.set(r, []); byRoot.get(r).push(p); }
    const netOf = new Map(); for (const [r, ps] of byRoot) for (const p of ps) netOf.set(p, ps);
    return { same: (a, b) => find(key(a)) === find(key(b)), netOf, list: [...byRoot.values()] };
  }
  wired(p) { return this.wires.some((w) => w.a === p || w.b === p); }

  check() {
    const { netOf, list, same } = this.nets(); const errors = [], warnings = [];
    const isTx = (p) => p.inst.kind === 'board' && p.role === 'io' && /\bTXD?\d?\b|TX\d|\bTX/.test(`${p.name} ${p.funcs}`);
    const isRx = (p) => p.inst.kind === 'board' && p.role === 'io' && /\bRXD?\d?\b|RX\d|\bRX/.test(`${p.name} ${p.funcs}`);
    for (const net of list) {
      if (net.length < 2 || !net.some((p) => this.wired(p))) continue;
      const sup = net.filter((p) => p.role === 'supply' || p.role === 'src');
      const gnd = net.filter((p) => p.role === 'gnd');
      if (sup.length && gnd.length) errors.push({ msg: `Short circuit: ${this.pinLabel(sup[0])} is wired straight to ${this.pinLabel(gnd[0])}.`, pins: [sup[0], gnd[0]] });
      const volts = new Set(sup.map((p) => p.role === 'src' ? 6 : p.v));
      if (volts.size > 1) errors.push({ msg: `Two different supplies are joined (${[...new Set(sup.map((p) => this.pinLabel(p)))].join(', ')}).`, pins: sup });
      const tx = net.filter(isTx), rx = net.filter(isRx);
      if (new Set(tx.map((p) => p.inst)).size > 1) errors.push({ msg: `Two TX pins are tied together (${tx.map((p) => this.pinLabel(p)).join(' + ')}). UART crosses over: TX → RX.`, pins: tx });
      if (new Set(rx.map((p) => p.inst)).size > 1) errors.push({ msg: `Two RX pins are tied together (${rx.map((p) => this.pinLabel(p)).join(' + ')}). UART crosses over: TX → RX.`, pins: rx });
      const io5 = net.filter((p) => p.role === 'io' && p.v === 5), io3 = net.filter((p) => p.role === 'io' && p.v === 3.3);
      if (io5.length && io3.length) {
        const safe = io5.every(isRx) && io3.every(isTx);
        if (safe) warnings.push({ msg: `${this.pinLabel(io3[0])} → ${this.pinLabel(io5[0])} works: 3.3 V counts as HIGH for a 5 V board (never the other way round).`, pins: [...io3, ...io5] });
        else errors.push({ msg: `5 V meets 3.3 V: ${this.pinLabel(io5[0])} (5 V logic) is wired to ${this.pinLabel(io3[0])} (3.3 V). Add a level shifter.`, pins: [io5[0], io3[0]] });
      }
      const motor = net.filter((p) => p.role === 'motor'), io = net.filter((p) => p.role === 'io' || p.role === 'supply');
      if (motor.length && io.length) errors.push({ msg: `${this.pinLabel(motor[0])} is wired straight to ${this.pinLabel(io[0])}. A motor needs far more current than a pin gives, so go through the motor driver.`, pins: [motor[0], io[0]] });
    }
    for (const it of this.items.values()) {
      if (it.kind !== 'mod') continue;
      const used = it.pins.filter((p) => this.wired(p)); if (!used.length) continue;
      const net = (p) => netOf.get(p) || [p];
      const grounded = (p) => net(p).some((q) => q.inst !== it && q.role === 'gnd');
      const gPins = it.pins.filter((p) => p.role === 'gnd');
      if (gPins.length && !gPins.some(grounded) && it.ref !== 'battery') errors.push({ msg: `${it.label} has no ground connection. Wire its GND to the board’s GND.`, pins: gPins });
      for (const p of it.pins.filter((q) => ['vcc', 'lv', 'hv'].includes(q.role))) {
        const s = net(p).filter((q) => q.role === 'supply' || q.role === 'src');
        const needed = it.pins.some((q) => q.role === 'sig' && this.wired(q));
        if (!s.length && needed) { errors.push({ msg: `${it.label} has no power: wire its ${p.name} to a supply pin.`, pins: [p] }); continue; }
        const v = s[0] ? (s[0].role === 'src' ? 6 : s[0].v) : null; if (v == null) continue;
        if (p.role === 'hv' && v !== 5) errors.push({ msg: `The level shifter’s HV side must go to 5 V (it is on ${v} V).`, pins: [p, s[0]] });
        if (p.role === 'lv' && v !== 3.3) errors.push({ msg: `The level shifter’s LV side must go to 3.3 V (it is on ${v} V).`, pins: [p, s[0]] });
        if (it.ref === 'ultrasonic' && v !== 5) warnings.push({ msg: 'The HC-SR04 is a 5 V sensor; on 3.3 V it may not measure reliably.', pins: [p] });
        if (it.ref === 'servo' && s[0].inst.kind === 'board') warnings.push({ msg: `${it.label} borrows the board’s ${s[0].name}. Fine for one small servo; give bigger ones their own supply.`, pins: [p] });
        if (it.ref === 'motor-driver' && p.name === 'VM' && s[0].inst.kind === 'board') errors.push({ msg: 'The motor supply (VM) is on a board pin. Motors need their own battery, because the board can’t give that much current.', pins: [p] });
        if (p.role === 'vcc' && v === 6 && it.ref !== 'motor-driver') errors.push({ msg: `${it.label} is powered straight from the 6 V battery, which is too much for it.`, pins: [p] });
        if (p.role === 'vcc' && v === 5) {
          const sig3 = it.pins.filter((q) => q.role === 'sig').flatMap((q) => net(q)).filter((q) => q.role === 'io' && q.v === 3.3);
          if (sig3.length && ['ultrasonic', 'pot', 'ldr', 'dht11'].includes(it.ref)) errors.push({ msg: `${it.label} runs on 5 V, so its signal reaches ${this.pinLabel(sig3[0])} at 5 V. Power it from 3V3 or use a level shifter.`, pins: [p, sig3[0]] });
        }
      }
    }
    // boards connected by signals must share ground
    const boards = [...this.items.values()].filter((i) => i.kind === 'board');
    for (let i = 0; i < boards.length; i++) for (let j = i + 1; j < boards.length; j++) {
      const A = boards[i], B = boards[j];
      const linked = A.pins.some((p) => p.role === 'io' && (netOf.get(p) || []).some((q) => q.inst === B || (q.inst.ref === 'level-shifter' && this.shifterLinks(q, B, netOf))));
      if (!linked) continue;
      const gA = A.pins.find((p) => p.role === 'gnd'), gB = B.pins.find((p) => p.role === 'gnd');
      if (gA && gB && !same(gA, gB)) errors.push({ msg: `${A.label} and ${B.label} talk to each other but don’t share GND. Join their grounds.`, pins: [gA, gB] });
    }
    return { errors, warnings };
  }
  shifterLinks(lsPin, board, netOf) { const ls = lsPin.inst; const m = /^(LV|HV)(\d)$/.exec(lsPin.name); if (!m) return false; const other = ls.pins.find((p) => p.name === (m[1] === 'LV' ? 'HV' : 'LV') + m[2]); return (netOf.get(other) || []).some((q) => q.inst === board); }

  missionProgress() {
    const m = this.mission; if (!m || m.free) return null;
    const { same } = this.nets();
    return m.wires.map(([a, b]) => { const pa = this.findPin(a), pb = this.findPin(b); return { a, b, pa, pb, done: !!(pa && pb && same(pa, pb) && (this.wired(pa) || this.wired(pb))) }; });
  }

  // ───────────────────────── modes ─────────────────────────
  clearBench() { if (this.sim) this.stop(); [...this.items.values()].forEach((it) => this.removeInst(it)); this.wires.forEach((w) => this.removeWire(w, false)); this.wires = []; this.pending = null; this.select(null); this.drive.clear(); }
  sandbox(defId, { keep = false } = {}) {
    if (keep && [...this.items.values()].some((i) => i.ref === defId)) return;
    if (!keep) this.clearBench();
    this.mission = { free: true }; this.el.mode.textContent = 'Free build';
    if (!keep || !this.firstBoardId()) this.addBoard(defId, { at: keep ? this.nextSpot() : [-60, -20] }); else this.addBoard(defId, { at: this.nextSpot() });
    this.renderMission(); this.status('Pick boards and parts on the left, then click a pin to start a wire.');
    this.home(); this.changed();
  }
  startMission(id) {
    const m = missionById(id); if (!m) return;
    this.clearBench(); this.mission = m; this.el.mode.textContent = `Mission ${MISSIONS.indexOf(m) + 1} / ${MISSIONS.length}`;
    for (const s of m.setup) s.board ? this.addBoard(s.board, { id: s.id, at: s.at, rot: s.rot || 0 }) : this.addModule(s.mod, { id: s.id, at: s.at, rot: s.rot || 0 });
    this.renderMission(); this.home(); this.status('Click a glowing pin, then the pin it should connect to.');
    this.el.lines.textContent = 'Press Run to see what the boards print.';
    track({ k: 'mission', m: id });
  }
  renderMission() {
    const m = this.mission;
    if (!m || m.free) {
      const done = Object.keys(progress().missions).length;
      this.el.mcard.innerHTML = `<p class="kicker">Free build</p><h4>Wire anything</h4><p class="goal">Add boards and parts, connect pins, then press Run. Outputs get a “Drive this pin” switch; inputs report to the serial monitor.</p><p class="meta" style="margin-top:6px">${done} of ${MISSIONS.length} missions done · <button class="btn small ghost" data-a="missions">Browse missions</button></p>`;
      this.el.ctabs.innerHTML = ''; this.el.code.textContent = 'No code for this one.\n\nIn Free build the bench simulates the electricity itself:\n• outputs (LEDs, buzzer, servo, motor driver) get a\n  "Drive this pin" switch or slider while running\n• inputs (button, knob, light sensor) are reported\n  in the serial monitor\n• every wire is checked before power-up.';
      return;
    }
    const prog = this.missionProgress(); const left = prog.filter((p) => !p.done).length;
    this.el.mcard.innerHTML = `<p class="kicker">${esc(m.level)} · ${m.minutes} min</p><h4>${esc(m.title)}</h4><p class="goal">${esc(m.goal)}</p><p class="muted" style="font-size:13px;margin-top:4px">${esc(m.intro)}</p>
      <ul class="chk">${prog.map((p) => `<li class="${p.done ? 'done' : ''}">${esc(this.refLabel(p.a))} → ${esc(this.refLabel(p.b))}</li>`).join('')}</ul>
      <div class="bar-actions"><button class="btn small" data-a="showme" ${left ? '' : 'disabled'}>Show me</button><button class="btn small" data-a="autowire" ${left ? '' : 'disabled'}>Wire it for me</button></div>
      <p class="kicker" style="margin-top:10px">What you learn</p><ul class="learn">${m.learn.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
    const codes = Array.isArray(m.code) ? m.code : [{ title: 'Sketch', ...m.code }];
    this.codes = codes;
    this.el.ctabs.innerHTML = codes.length > 1 ? codes.map((c, i) => `<button type="button" data-ctab="${i}">${esc(c.title)}</button>`).join('') : `<button type="button" class="on" data-ctab="0">${esc(codes[0].lang)}</button>`;
    this.showCode(this.codeTab && this.codeTab < codes.length ? this.codeTab : 0);
  }
  refLabel(ref) { const [iid, ...r] = ref.split(':'); const it = this.items.get(iid); return `${it ? it.label : iid} ${r.join(':')}`; }
  showCode(i) { this.codeTab = i; const c = this.codes?.[i]; if (!c) return; this.el.ctabs.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); this.el.code.innerHTML = this.hl(c.src, c.lang); }

  openMissions() {
    const done = progress().missions;
    const d = document.createElement('div'); d.className = 'lab-dialog'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Missions');
    d.innerHTML = `<div><div style="display:flex;justify-content:space-between;align-items:start;gap:10px"><div><p class="kicker">Guided missions, easiest first</p><h3>Browse missions</h3></div><button class="btn small" data-a="closedlg">Close</button></div>
      <div class="mgrid">${MISSIONS.map((m, i) => `<button class="mcard ${done[m.id] ? 'done' : ''}" data-mission="${m.id}"><span class="top"><span>${String(i + 1).padStart(2, '0')} · ${esc(m.level)}</span><span>${done[m.id] ? '✓ Done' : m.minutes + ' min'}</span></span><b>${esc(m.title)}</b><p>${esc(m.goal)}</p></button>`).join('')}
      <button class="mcard free" data-mission="free"><span class="top"><span>Sandbox</span><span>All 8 boards</span></span><b>Free build</b><p>No instructions. Wire anything and press Run.</p></button></div></div>`;
    d.addEventListener('click', (e) => { if (e.target === d) this.closeDialog(); });
    this.el.view.appendChild(d); this.dialog = d; d.querySelector('.mcard')?.focus();
  }
  closeDialog() { this.dialog?.remove(); this.dialog = null; }

  // ───────────────────────── actions ─────────────────────────
  action(a, btn) {
    switch (a) {
      case 'missions': this.openMissions(); break;
      case 'closedlg': this.closeDialog(); break;
      case 'run': this.sim ? this.stop() : this.run(); break;
      case 'autowire': this.autowire(); break;
      case 'unwire': if (this.sim) this.stop(); [...this.wires].forEach((w) => this.removeWire(w, false)); this.changed(); this.status('All wires removed.'); break;
      case 'top': this.v.flyTo(new THREE.Vector3(0, 520, 40), new THREE.Vector3(0, 0, 10), 800); break;
      case 'sound': this.sound = !this.sound; set('rl.sound', this.sound ? '1' : '0'); this.syncSoundBtn(); if (!this.sound) this.stopTone(); break;
      case 'lofi': toggleLofi(); break;
      case 'full': this.toggleFull(); break;
      case 'clear': this.clearBench(); this.mission = { free: true }; this.el.mode.textContent = 'Free build'; this.renderMission(); this.status('The bench is empty. Pick boards and parts on the left.'); this.changed(); break;
      case 'rotate': if (this.sel?.inst) this.rotateInst(this.sel.inst); break;
      case 'remove': if (this.sel?.inst) this.removeInst(this.sel.inst); else if (this.sel?.wire) this.removeWire(this.sel.wire); break;
      case 'showme': this.showMe(); break;
      case 'clrserial': this.el.lines.textContent = ''; break;
      case 'share': this.share(); break;
      case 'export': this.exportFile(); break;
      case 'import': this.el.file.click(); break;
      case 'next': { const i = MISSIONS.indexOf(this.mission); if (MISSIONS[i + 1]) this.startMission(MISSIONS[i + 1].id); else this.openMissions(); break; }
      case 'showerr': this.flashPins(this.lastErr?.pins || [], '#ff3b2f'); break;
    }
    void btn;
  }
  toggleFull() {
    this.full = !this.full; this.el.lab.classList.toggle('full', this.full); this.v.wheelAlways = this.full;
    const b = this.root.querySelector('[data-a="full"] span'); b.textContent = this.full ? 'Exit full screen' : 'Full screen';
    document.body.style.overflow = this.full ? 'hidden' : '';
    setTimeout(() => this.v.resize(), 30);
  }
  home() { const k = Math.max(1, 1.4 / Math.max(.5, this.v.camera.aspect)); this.v.flyTo(new THREE.Vector3(0, 300 * k, 290 * k), new THREE.Vector3(0, 0, 15), 700); }
  rotateInst(it) { it.rot = (it.rot + 1) % 4; it.group.rotation.y = it.rot * Math.PI / 2; it.group.updateMatrixWorld(true); this.redrawWiresOf(it); this.changed(); }
  onKey(e) {
    if (!(this.hover || this.full || this.el.lab.contains(document.activeElement))) return;
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'Escape') { if (this.dialog) this.closeDialog(); else if (this.pending) { this.pending = null; this.paintPins(); this.status('Wire cancelled.'); } else if (this.full) this.toggleFull(); else this.select(null); e.preventDefault(); }
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) { this.toggleFull(); e.preventDefault(); }
    if ((e.key === 'r' || e.key === 'R') && this.sel?.inst && !e.ctrlKey) { this.rotateInst(this.sel.inst); e.preventDefault(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.sel) { this.action('remove'); e.preventDefault(); }
  }
  status(msg, kind = '', extra = '') {
    this.el.status.className = `lab-status frost ${kind}`;
    this.el.status.innerHTML = `<span class="msg">${msg}</span>${extra}`;
  }

  // ───────────────────────── pointer ─────────────────────────
  hit(e) {
    const objs = [...[...this.items.values()].map((i) => i.group), this.wireGroup];
    const hits = this.v.pick(e, objs);
    for (const h of hits) {
      const o = h.object;
      if (o.userData.pin) return { pin: o.userData.pin, point: h.point };
      if (o.userData.wire) return { wire: o.userData.wire, point: h.point };
      if (o.userData.inst && o.material && o.material.opacity !== 0) return { inst: o.userData.inst, point: h.point };
    }
    return null;
  }
  planePoint(e, y = 0) {
    const rect = this.v.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.v.raycaster.setFromCamera(ndc, this.v.camera); this.plane.constant = -y;
    const p = new THREE.Vector3(); return this.v.raycaster.ray.intersectPlane(this.plane, p) ? p : null;
  }
  onDown(e) {
    this.downAt = { x: e.clientX, y: e.clientY };
    const h = this.hit(e);
    if (h?.inst && !h.pin) {
      const p = this.planePoint(e); if (!p) return;
      this.drag = { it: h.inst, off: h.inst.group.position.clone().sub(p), moved: false };
      this.v.controls.enabled = false;
    }
    const hold = h?.inst?.ref === 'button' && this.sim;
    if (hold) { h.inst.state.pressed = true; this.flags.add('pressed'); this.holding = h.inst; }
  }
  onMove(e) {
    if (this.drag) {
      const p = this.planePoint(e); if (!p) return;
      if (Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y) > 4) this.drag.moved = true;
      if (!this.drag.moved) return;
      const it = this.drag.it; p.add(this.drag.off);
      it.group.position.set(THREE.MathUtils.clamp(p.x, -BENCH.w / 2 + 10, BENCH.w / 2 - 10), 0, THREE.MathUtils.clamp(p.z, -BENCH.d / 2 + 10, BENCH.d / 2 - 10));
      it.group.updateMatrixWorld(true);
      const now = performance.now(); if (!this.lastRedraw || now - this.lastRedraw > 50) { this.redrawWiresOf(it); this.lastRedraw = now; }
      return;
    }
    if (e.buttons) return;
    const h = this.hit(e); const cv = this.v.renderer.domElement;
    const hot = h?.pin || null; if (hot !== this.hot) { this.hot = hot; this.paintPins(); }
    if (hot) {
      const r = this.el.view.getBoundingClientRect();
      this.el.tip.innerHTML = `<i style="background:${KIND_COLORS[hot.kind]}"></i><b>${esc(this.pinLabel(hot))}</b>${hot.funcs ? '<br>' + esc(hot.funcs) : ''}`;
      this.el.tip.style.left = `${e.clientX - r.left}px`; this.el.tip.style.top = `${e.clientY - r.top}px`; this.el.tip.hidden = false; cv.style.cursor = 'crosshair';
    } else { this.el.tip.hidden = true; cv.style.cursor = h?.inst ? 'move' : h?.wire ? 'pointer' : 'grab'; }
  }
  onUp(e) {
    if (this.holding) { this.holding.state.pressed = false; this.holding = null; }
    const moved = this.downAt && Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y) > 4;
    if (this.drag) { const d = this.drag; this.drag = null; this.v.controls.enabled = true; if (d.moved) { this.redrawWiresOf(d.it); this.changed(); return; } }
    if (moved) return;
    const h = this.hit(e);
    if (h?.pin) { this.clickPin(h.pin); return; }
    if (h?.wire) { this.select({ wire: h.wire }); return; }
    if (h?.inst) { this.select({ inst: h.inst }); return; }
    this.select(null); if (this.pending) { this.pending = null; this.paintPins(); this.status('Wire cancelled.'); }
  }
  clickPin(p) {
    if (!this.pending) { this.pending = p; this.paintPins(); this.status(`From <b>${esc(this.pinLabel(p))}</b>. Now click the pin it should connect to. Esc cancels.`); this.beep(660, .05); return; }
    if (p === this.pending) { this.pending = null; this.paintPins(); this.status('Wire cancelled.'); return; }
    const a = this.pending; this.pending = null;
    const w = this.addWire(a, p);
    this.paintPins(); this.beep(880, .06);
    if (!w) { this.status('Those two pins are already connected.'); return; }
    const prog = this.missionProgress();
    if (prog) { const left = prog.filter((x) => !x.done).length; this.status(left ? `Connected. Click another pin to add the next wire. ${left} to go.` : 'Wiring complete. Press Run to power it up.', left ? '' : 'ok'); }
    else this.status(`Connected ${esc(this.pinLabel(a))} → ${esc(this.pinLabel(p))}. Click another pin to add the next wire.`);
  }
  select(s) {
    if (this.sel?.wire) this.sel.wire.mat.emissive.set('#000');
    this.sel = s; this.el.sel.hidden = !s;
    if (s?.wire) { s.wire.mat.emissive.set('#555'); this.el.sel.querySelector('[data-a="rotate"]').hidden = true; }
    else this.el.sel.querySelector('[data-a="rotate"]').hidden = false;
  }
  paintPins() {
    const pend = this.pending;
    for (const it of this.items.values()) for (const p of it.pins) {
      const m = p.mesh.material; const show = p === this.hot || p === pend || (pend && p.inst !== pend.inst) || p.flash;
      m.color.set(p.flash || KIND_COLORS[p.kind]); m.opacity = !show ? 0 : (p === pend || p === this.hot || p.flash) ? .9 : .35;
    }
  }
  flashPins(pins, color = '#ffb020', ms = 2600) {
    pins.forEach((p) => { p.flash = color; }); this.paintPins();
    clearTimeout(this.flashT); this.flashT = setTimeout(() => { pins.forEach((p) => { p.flash = null; }); this.paintPins(); }, ms);
    const c = pins[0] && this.pinTop(pins[0]); if (c) this.v.flyTo(c.clone().add(new THREE.Vector3(0, 180, 160)), c, 600);
  }
  showMe() {
    const next = this.missionProgress()?.find((p) => !p.done); if (!next) return;
    this.flashPins([next.pa, next.pb].filter(Boolean)); this.status(`Next: <b>${esc(this.refLabel(next.a))}</b> → <b>${esc(this.refLabel(next.b))}</b>.`);
  }
  async autowire() {
    const prog = this.missionProgress(); if (!prog) { this.status('“Wire it for me” works in missions. Pick one under Missions.'); return; }
    const todo = prog.filter((p) => !p.done && p.pa && p.pb); if (!todo.length) return;
    if (this.sim) this.stop();
    for (const p of todo) { this.addWire(p.pa, p.pb, { animate: true }); this.beep(700 + Math.random() * 200, .04); await new Promise((r) => setTimeout(r, 160)); }
    this.status('Wiring complete. Press Run to power it up.', 'ok');
  }

  // ───────────────────────── run / simulation ─────────────────────────
  run() {
    const m = this.mission;
    const prog = this.missionProgress();
    if (prog && prog.some((p) => !p.done)) { const n = prog.filter((p) => !p.done).length; this.status(`Finish the wiring first: ${n} connection(s) to go.`, 'err', '<button class="btn small" data-a="showme">Show me</button>'); return; }
    if (!this.items.size) { this.status('The bench is empty. Add a board first.'); return; }
    const { errors, warnings } = this.check();
    if (errors.length) {
      this.lastErr = errors[0];
      this.status(`${icon('warn')} ${esc(errors[0].msg)}${errors.length > 1 ? ` <span class="muted">(+${errors.length - 1} more)</span>` : ''}`, 'err', '<button class="btn small" data-a="showerr">Show me</button>');
      errors[0].pins.forEach((p) => this.wires.filter((w) => w.a === p || w.b === p).forEach((w) => w.mat.emissive.set('#a01010')));
      setTimeout(() => this.wires.forEach((w) => w.mat.emissive.set('#000')), 2500);
      this.beep(180, .25, 'sawtooth', .05); track({ k: 'bench-error', m: m?.id }); return;
    }
    this.flags.clear(); this.el.lines.textContent = ''; this.serialFrom = new Set();
    const sim = this.sim = { t: 0, timers: [], loops: [], start: performance.now(), ok: false };
    const api = {
      get t() { return sim.t; },
      every: (ms, fn) => sim.timers.push({ ms, next: sim.t * 1000 + ms, fn, rep: true }),
      after: (ms, fn) => sim.timers.push({ ms, next: sim.t * 1000 + ms, fn, rep: false }),
      loop: (fn) => sim.loops.push(fn),
      set: (id, patch) => { const it = this.items.get(id); if (it) Object.assign(it.state, patch); },
      get: (id) => this.items.get(id)?.state,
      input: (id) => this.readInput(this.items.get(id)),
      serial: (text, from) => this.serial(text, from),
      boardLed: (id, on, pin) => { const it = this.items.get(id); if (!it?.board) return; const leds = it.board.userData.leds; const l = pin ? leds.find((x) => x.pinLed === pin) : leds.find((x) => !x.always && !['TX', 'RX'].includes(x.pinLed)); if (l) setLed(l, on ? 1 : 0); },
      flag: (f) => this.flags.has(f),
    };
    this.api = api;
    for (const it of this.items.values()) { if (it.kind === 'board') it.board.userData.leds.forEach((l) => setLed(l, l.always ? 1 : 0)); }
    this.buildControls();
    try { if (m && !m.free) m.run(api); else this.freeRun(api); } catch (err) { this.stop(); this.status(`Script error: ${esc(err.message)}`, 'err'); return; }
    this.el.run.classList.add('running'); this.el.run.innerHTML = `${icon('stop')} <span>Stop</span>`;
    const warn = warnings.length ? ` <span class="muted">Note: ${esc(warnings[0].msg)}</span>` : '';
    this.status(`No electrical problems found. Running. Try the controls at the bottom left.${warn}`, 'ok');
    this.beep(523, .08); setTimeout(() => this.beep(784, .1), 90);
    track({ k: 'run', m: m?.id || 'free' });
  }
  stop() {
    if (!this.sim) return;
    this.sim = null; this.stopTone();
    for (const it of this.items.values()) {
      if (it.kind === 'board') it.board.userData.leds.forEach((l) => setLed(l, 0));
      else { Object.assign(it.state, { b: 0, rgb: [0, 0, 0], freq: 0, speed: 0, on: false, powered: false }); it.mod.update(it.state, 0, 0); }
    }
    this.el.controls.innerHTML = ''; this.el.run.classList.remove('running'); this.el.run.innerHTML = `${icon('play')} <span>Run</span>`;
    this.status('Stopped. Change the wiring or press Run again.');
  }
  readInput(it) {
    if (!it) return 0; const s = it.state;
    switch (it.ref) { case 'pot': return s.value; case 'ldr': return s.light; case 'ultrasonic': return s.dist; case 'dht11': return { temp: s.temp, hum: s.hum }; case 'button': return s.pressed; default: return 0; }
  }
  serial(text, from) {
    const L = this.el.lines; const div = document.createElement('div');
    div.textContent = from ? `[${from}] ${text}` : text; L.appendChild(div);
    while (L.childElementCount > 200) L.firstChild.remove();
    L.parentElement.scrollTop = L.parentElement.scrollHeight;
  }
  buildControls() {
    const c = this.el.controls; const rows = [];
    for (const it of this.items.values()) {
      if (it.kind !== 'mod') continue; const s = it.state;
      if (it.ref === 'button') rows.push(`<button class="btn small hold" data-hold="${it.id}">Hold to press · ${esc(it.label)}</button>`);
      if (it.ref === 'pot') rows.push(`<label>${esc(it.label)} knob <input type="range" min="0" max="1" step=".01" value="${s.value}" data-in="${it.id}:value"></label>`);
      if (it.ref === 'ldr') rows.push(`<label>Light on ${esc(it.label)} <input type="range" min="0" max="1" step=".01" value="${s.light}" data-in="${it.id}:light"></label>`);
      if (it.ref === 'ultrasonic') rows.push(`<label>Obstacle distance: <b data-out="${it.id}:dist">${s.dist}</b> cm <input type="range" min="2" max="300" step="1" value="${s.dist}" data-in="${it.id}:dist"></label>`);
      if (it.ref === 'dht11') rows.push(`<label>Temperature: <b data-out="${it.id}:temp">${s.temp}</b> °C <input type="range" min="0" max="50" step="1" value="${s.temp}" data-in="${it.id}:temp"></label><label>Humidity: <b data-out="${it.id}:hum">${s.hum}</b> % <input type="range" min="20" max="90" step="1" value="${s.hum}" data-in="${it.id}:hum"></label>`);
    }
    if (this.mission?.free) {
      const { netOf } = this.nets(); const seen = new Set();
      for (const it of this.items.values()) if (it.kind === 'board') for (const p of it.pins) {
        if (p.role !== 'io' || !this.wired(p) || seen.has(p.name + it.id)) continue;
        const outs = (netOf.get(p) || []).filter((q) => q.inst.kind === 'mod' && q.role === 'sig' && ['led', 'rgb', 'buzzer', 'servo', 'motor-driver', 'level-shifter'].includes(q.inst.ref));
        if (!outs.length) continue; seen.add(p.name + it.id);
        const pwm = outs.some((q) => q.inst.ref === 'servo' || q.name === 'ENA');
        const key = `${it.id}:${p.idx}`;
        rows.push(pwm ? `<label>Drive this pin · ${esc(this.pinLabel(p))} <input type="range" min="0" max="1" step=".01" value="${this.drive.get(key) ?? 0}" data-drive="${key}"></label>`
          : `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-drive="${key}" ${this.drive.get(key) ? 'checked' : ''}> Drive this pin · ${esc(this.pinLabel(p))} HIGH</label>`);
      }
    }
    c.innerHTML = rows.join('');
    c.oninput = (e) => {
      const i = e.target.dataset.in, d = e.target.dataset.drive;
      if (i) { const [id, k] = i.split(':'); const it = this.items.get(id); it.state[k] = +e.target.value; this.flags.add('moved:' + id); const o = c.querySelector(`[data-out="${i}"]`); if (o) o.textContent = e.target.value; }
      if (d) this.drive.set(d, e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : +e.target.value);
    };
    c.querySelectorAll('[data-hold]').forEach((b) => {
      const it = this.items.get(b.dataset.hold);
      const on = (v) => (e) => { e.preventDefault(); it.state.pressed = v; b.classList.toggle('down', v); if (v) this.flags.add('pressed'); };
      b.addEventListener('pointerdown', on(true)); b.addEventListener('pointerup', on(false)); b.addEventListener('pointerleave', on(false));
      b.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') on(true)(e); }); b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') on(false)(e); });
    });
  }

  /** Free build: a simple electrical simulation from the netlist. */
  freeRun(api) {
    const last = new Map();
    api.loop(() => {
      const { netOf } = this.nets();
      const volt = (p) => {
        const net = netOf.get(p) || [p]; let v = null;
        for (const q of net) {
          if (q.role === 'supply') v = q.v; else if (q.role === 'src') v = 6; else if (q.role === 'gnd') return 0;
          else if (q.role === 'io' && this.drive.has(`${q.inst.id}:${q.idx}`)) v = this.drive.get(`${q.inst.id}:${q.idx}`) * q.v;
          else if (q.inst.kind === 'mod' && q.role === 'sig') {
            const it = q.inst, vcc = it.pins.find((x) => x.role === 'vcc'), vv = vcc ? supplyV(vcc) : 0;
            if (it.ref === 'pot') v = it.state.value * vv; if (it.ref === 'ldr') v = it.state.light * vv;
            if (it.ref === 'button' && it.state.pressed && grounded(it)) return 0;
          }
        }
        return v;
      };
      const supplyV = (p) => { for (const q of netOf.get(p) || []) { if (q.role === 'supply') return q.v; if (q.role === 'src') return 6; } return 0; };
      const grounded = (it) => it.pins.some((p) => p.role === 'gnd' && (netOf.get(p) || []).some((q) => q.role === 'gnd' && q.inst !== it));
      const duty = (p) => { for (const q of netOf.get(p) || []) { const k = `${q.inst.id}:${q.idx}`; if (q.role === 'io' && this.drive.has(k)) return this.drive.get(k); } return null; };
      for (const it of this.items.values()) {
        if (it.kind !== 'mod') continue; const s = it.state, pin = (n) => it.pins.find((p) => p.name === n);
        if (it.ref === 'led') s.b = grounded(it) ? Math.min(1, (volt(pin('SIG')) || 0) / 3.3) : 0;
        if (it.ref === 'rgb') s.rgb = ['R', 'G', 'B'].map((n) => grounded(it) ? Math.min(1, (volt(pin(n)) || 0) / 3.3) : 0);
        if (it.ref === 'buzzer') s.freq = grounded(it) && (volt(pin('SIG')) || 0) > 1.5 ? 1500 : 0;
        if (it.ref === 'servo') { const d = duty(pin('SIG')); if (d != null && supplyV(pin('VCC')) && grounded(it)) s.angle = d * 180; }
        if (it.ref === 'motor-driver') {
          s.powered = supplyV(pin('VM')) > 0 && grounded(it);
          const ena = duty(pin('ENA')) ?? ((volt(pin('ENA')) || 0) > 2 ? 1 : 0), in1 = (volt(pin('IN1')) || 0) > 1.6, in2 = (volt(pin('IN2')) || 0) > 1.6;
          s.out = s.powered ? (in1 && !in2 ? ena : in2 && !in1 ? -ena : 0) : 0;
        }
      }
      for (const it of this.items.values()) {
        if (it.ref !== 'motor') continue; const mp = it.pins.find((p) => p.name === 'M+'), mm = it.pins.find((p) => p.name === 'M-');
        const drv = (netOf.get(mp) || []).find((q) => q.inst.ref === 'motor-driver' && /OUT/.test(q.name));
        const drv2 = (netOf.get(mm) || []).find((q) => q.inst.ref === 'motor-driver' && /OUT/.test(q.name));
        it.state.speed = drv && drv2 && drv.inst === drv2.inst ? (drv.name === 'OUT1' ? 1 : -1) * (drv.inst.state.out || 0) : 0;
      }
      // report board inputs that changed
      for (const it of this.items.values()) if (it.kind === 'board') for (const p of it.pins) {
        if (p.role !== 'io' || !this.wired(p)) continue;
        const net = netOf.get(p) || []; if (!net.some((q) => q.inst.kind === 'mod' && q.role === 'sig' && ['pot', 'ldr', 'button'].includes(q.inst.ref))) continue;
        let v = volt(p); const analog = net.some((q) => ['pot', 'ldr'].includes(q.inst.ref));
        const txt = analog ? `${p.name} = ${Math.round(((v ?? 0) / p.v) * (p.v === 5 ? 1023 : 4095))}` : `${p.name} = ${v === 0 ? 'LOW' : 'HIGH'}`;
        const k = it.id + p.idx; if (last.get(k) !== txt) { last.set(k, txt); this.serial(txt, it.label); }
      }
      for (const it of this.items.values()) if (it.kind === 'board') for (const p of it.pins) { const k = `${it.id}:${p.idx}`; if (this.drive.has(k)) api.boardLed(it.id, this.drive.get(k) > .5, p.name); }
    });
  }

  frame(dt, now) {
    const sim = this.sim;
    if (sim) {
      sim.t += dt;
      const ms = sim.t * 1000;
      for (const t of sim.timers.slice()) if (ms >= t.next) { try { t.fn(); } catch (e) { this.stop(); this.status(`Script error: ${esc(e.message)}`, 'err'); return; } if (t.rep) t.next += t.ms; else sim.timers.splice(sim.timers.indexOf(t), 1); }
      for (const f of sim.loops) { try { f(dt); } catch (e) { this.stop(); this.status(`Script error: ${esc(e.message)}`, 'err'); return; } }
      // mission success after a few seconds of running (and any required interaction)
      const m = this.mission;
      if (m && !m.free && !sim.ok && sim.t > 3 && (!m.check || m.check(this.api))) {
        sim.ok = true; const first = !progress().missions[m.id];
        saveProgress((p) => { p.missions[m.id] = Date.now(); });
        const i = MISSIONS.indexOf(m);
        this.status(`${icon('check')} It works. ${first ? 'Mission complete!' : ''}`, 'ok', MISSIONS[i + 1] ? '<button class="btn small primary" data-a="next">Next mission</button>' : '<button class="btn small primary" data-a="missions">All missions done! Browse</button>');
        [523, 659, 784].forEach((f, k) => setTimeout(() => this.beep(f, .12), k * 110)); track({ k: 'mission-done', m: m.id });
      }
      if (m && !m.free && !sim.ok && sim.t > 4 && m.check && !sim.hinted) { sim.hinted = true; this.status('Running. Try the controls at the bottom left.', 'ok'); }
    }
    let tone = 0;
    for (const it of this.items.values()) if (it.kind === 'mod') { it.mod.update(it.state, now / 1000, dt); if (it.state.freq) tone = it.state.freq; }
    this.setTone(sim ? tone : 0);
  }
  setTone(f) {
    if (!this.sound) f = 0;
    if (f === (this.toneF || 0)) return; this.toneF = f;
    try {
      this.actx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (!f) { if (this.osc) { this.osc.stop(); this.osc = null; } return; }
      if (!this.osc) { this.osc = this.actx.createOscillator(); const g = this.actx.createGain(); g.gain.value = .04; this.osc.type = 'square'; this.osc.connect(g).connect(this.actx.destination); this.osc.start(); }
      this.osc.frequency.value = f;
    } catch { /* no audio */ }
  }
  stopTone() { this.setTone(0); }

  // ───────────────────────── save / share ─────────────────────────
  serialize() {
    return { v: 1, mission: this.mission && !this.mission.free ? this.mission.id : null, items: [...this.items.values()].map((it) => ({ id: it.id, kind: it.kind, ref: it.ref, x: Math.round(it.group.position.x), z: Math.round(it.group.position.z), rot: it.rot || 0 })), wires: this.wires.map((w) => [`${w.a.inst.id}:${w.a.name}`, `${w.b.inst.id}:${w.b.name}`]) };
  }
  load(data) {
    if (!data || !Array.isArray(data.items)) throw new Error('bad file');
    const mission = data.mission && missionById(data.mission);
    this.clearBench();
    this.mission = mission || { free: true }; this.el.mode.textContent = mission ? `Mission ${MISSIONS.indexOf(mission) + 1} / ${MISSIONS.length}` : 'Free build';
    for (const i of data.items) i.kind === 'board' ? this.addBoard(i.ref, { id: i.id, at: [i.x, i.z], rot: i.rot }) : this.addModule(i.ref, { id: i.id, at: [i.x, i.z], rot: i.rot });
    for (const [a, b] of data.wires || []) { const pa = this.findPin(a), pb = this.findPin(b); if (pa && pb) this.addWire(pa, pb); }
    this.renderMission(); this.home();
  }
  changed() {
    if (this.mission && !this.mission.free) this.renderMission();
    if (this.mission?.free) { try { set('rl.bench', JSON.stringify(this.serialize())); } catch { /* ignore */ } }
  }
  async share() {
    const json = JSON.stringify(this.serialize());
    const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = new URL(location.href); url.search = `?bench=${b64}`; url.hash = 'lab';
    try { await navigator.clipboard.writeText(url.toString()); toast('Link to this circuit copied to the clipboard.'); } catch { prompt('Copy this link:', url.toString()); }
    track({ k: 'share' });
  }
  exportFile() {
    const blob = new Blob([JSON.stringify(this.serialize(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'robotics-lab-circuit.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}
export { glowSprite };
