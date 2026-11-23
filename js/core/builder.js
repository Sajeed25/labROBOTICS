// Procedural part library: every board and module is drawn from boxes, cylinders and canvas textures.
// Units are millimetres. Boards lie on the XZ plane, Y is up, +Z is the "front" edge.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const PITCH = 2.54;
export const T = 1.6;                      // PCB thickness

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: 0, ...o });
export const M = {
  chip: std('#18181a', { roughness: .45 }),
  plastic: std('#1d1d1f', { roughness: .7 }),
  plasticWhite: std('#ecebe4', { roughness: .6 }),
  plasticBlue: std('#2f62b8', { roughness: .5 }),
  gold: std('#d8b35a', { metalness: 1, roughness: .28 }),
  metal: std('#d9dce0', { metalness: .65, roughness: .32 }),
  metalDark: std('#8d9196', { metalness: .6, roughness: .4 }),
  solder: std('#d6d8da', { metalness: 1, roughness: .2 }),
  ceramic: std('#c8b17d', { roughness: .6 }),
  capBlue: std('#2a3e7a', { roughness: .4 }),
  white: std('#f4f3ee'),
  red: std('#c63a2f'),
  pinHit: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }),
};
for (const k in M) if (k !== 'pinHit') M[k].userData.shared = true;
export const colorMat = (c, o) => std(c, o);

export const KIND_COLORS = { pwr: '#c8402f', gnd: '#2b2823', dig: '#2f6fb5', ana: '#2e8b57', com: '#7a4fb3', ctl: '#d9822b', nc: '#9a958a' };
export const KIND_NAMES = { pwr: 'Power', gnd: 'Ground', dig: 'Digital', ana: 'Analog', com: 'Buses: UART, I²C, SPI', ctl: 'Control: RESET, EN, BOOT', nc: 'Not connected' };

/** Guess a pin's kind from its printed name. */
export function kindOf(name) {
  const n = String(name).toUpperCase().trim();
  if (/^(NC|DNC|N\/C)$/.test(n)) return 'nc';
  if (/(^|\W)A?GND(\W|$)/.test(n) || n === 'G' || n === '-' || n === 'BAT-') return 'gnd';
  if (/^(5V|3V3|3\.3V|VIN|VBUS|VSYS|VU|VCC|IOREF|AREF|3V3\(OUT\)|ADC_VREF|VBAT|VM|HV|LV|\+|BAT\+|5V0)(\W|$)/.test(n)) return 'pwr';
  if (/^(RESET|RST|EN|BOOT0|BOOT1|BOOT|RUN|3V3_EN|NRST|R)(\W|$)/.test(n)) return 'ctl';
  if (/^A\d+(\W|$)|^ADC\d|^VP$|^VN$/.test(n)) return 'ana';
  if (/(^|\W)(TXD?\d?|RXD?\d?|SDA\d?|SCL\d?|MOSI|MISO|SCK|SCLK|CS|SS|CE0|CE1)(\W|$)/.test(n)) return 'com';
  return 'dig';
}

// ───────────────────────── geometry helpers ─────────────────────────
export function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
const box = (w, h, d, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.y = h / 2; m.castShadow = true; m.receiveShadow = true; return m; };
const rbox = (w, h, d, r, mat) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mat); m.position.y = h / 2; m.castShadow = true; m.receiveShadow = true; return m; };
const cyl = (r, h, mat, seg = 24) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.y = h / 2; m.castShadow = true; return m; };
const grp = (...kids) => { const g = new THREE.Group(); kids.forEach(k => g.add(k)); return g; };
const at = (o, x, y, z) => { o.position.set(x, o.position.y + y, z); return o; };

/** Text sprite-free label texture for chip tops etc. */
function textTexture(lines, { w = 256, h = 128, bg = null, fg = '#d8d4c8', font = 'bold 34px system-ui' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  const L = [].concat(lines);
  L.forEach((t, i) => g.fillText(t, w / 2, h / 2 + (i - (L.length - 1) / 2) * (parseInt(font.match(/\d+/)) * 1.15)));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
function labelTop(w, d, text, y, fg = '#cfcac0') {
  if (!text) return null;
  const tex = textTexture(String(text).split('\n'), { w: 256, h: Math.max(32, Math.round(256 * d / w)), fg, font: `bold ${Math.max(16, Math.min(44, Math.round(200 / Math.max(4, String(text).length))))}px system-ui` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * .92, d * .92), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = y + .02; return m;
}

/** A soft additive glow sprite (LED light). */
export function glowSprite(color = '#ffb020', size = 10) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); return s;
}

// ───────────────────────── component library ─────────────────────────
// Every factory returns a Group whose origin is the centre of its footprint on the board surface.
export const PARTS = {
  qfp({ w = 7, d = 7, h = 1.2, label = '' }) {
    const g = grp(box(w, h, d, M.chip));
    const n = Math.max(4, Math.round(w / .8));
    const lead = new THREE.BoxGeometry(.25, .2, 1);
    const inst = new THREE.InstancedMesh(lead, M.metal, n * 4); let k = 0; const o = new THREE.Object3D();
    for (let s = 0; s < 4; s++) for (let i = 0; i < n; i++) {
      const t = -w / 2 + (i + .5) * (w / n);
      if (s < 2) { o.position.set(t, .1, (s ? 1 : -1) * (d / 2 + .4)); o.rotation.y = 0; }
      else { o.position.set((s === 2 ? 1 : -1) * (w / 2 + .4), .1, t * d / w); o.rotation.y = Math.PI / 2; }
      o.updateMatrix(); inst.setMatrixAt(k++, o.matrix);
    }
    g.add(inst); const l = labelTop(w, d, label, h); if (l) g.add(l);
    return g;
  },
  qfn({ w = 5, d = 5, h = .9, label = '' }) { const g = grp(box(w, h, d, M.chip)); const l = labelTop(w, d, label, h); if (l) g.add(l); return g; },
  soic({ w = 5, d = 4, h = 1.5, pins = 8, label = '' }) {
    const g = grp(at(box(w, h, d, M.chip), 0, .2, 0)); const n = pins / 2;
    for (let s = -1; s <= 1; s += 2) for (let i = 0; i < n; i++) { const p = box(.35, .3, 1.2, M.metal); at(p, -w / 2 + (i + .5) * (w / n), 0, s * (d / 2 + .3)); g.add(p); }
    const l = labelTop(w, d, label, h + .2); if (l) g.add(l); return g;
  },
  dip({ pins = 28, label = '', socket = true }) {
    const n = pins / 2, len = n * PITCH + 1, wid = 7.6;
    const g = new THREE.Group(); let y = 0;
    if (socket) { const s = box(len + 1, 3, wid + 2.6, M.plastic); g.add(s); y = 3; }
    const body = at(box(len, 3.4, 6.4, M.chip), 0, y + .5, 0); g.add(body);
    for (let sd = -1; sd <= 1; sd += 2) for (let i = 0; i < n; i++) { const p = box(.5, 3, .3, M.metal); at(p, -len / 2 + .5 + (i + .5) * PITCH, y - .5, sd * 3.35); g.add(p); }
    const notch = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .2, 16, 1, false, 0, Math.PI), M.plastic); notch.position.set(-len / 2 + .2, y + 4, 0); notch.rotation.y = -Math.PI / 2; g.add(notch);
    const l = labelTop(len - 2, 5, label, y + 3.9); if (l) g.add(l); return g;
  },
  usbB() { const g = grp(box(12, 11, 16, M.metal)); const hole = at(box(8.5, 7.5, .5, M.plastic), 0, 1.7, 8.05); g.add(hole); return g; },
  usbMini() { return grp(box(7.7, 4, 9, M.metal)); },
  usbMicro() { const g = grp(box(7.5, 2.6, 5.5, M.metal)); g.add(at(box(6, 1.2, .3, M.plastic), 0, .7, 2.8)); return g; },
  usbC() { const g = grp(rbox(9, 3.2, 7.4, 1.4, M.metal)); g.add(at(rbox(7, 2, .4, .8, M.plastic), 0, .6, 3.6)); return g; },
  usbA2() { const g = grp(box(14.5, 16, 17.5, M.metal)); for (const y of [2.5, 9.5]) g.add(at(box(11, 4.5, .4, M.plasticBlue), 0, y, 8.8)); return g; },
  usbA2black() { const g = grp(box(14.5, 16, 17.5, M.metal)); for (const y of [2.5, 9.5]) g.add(at(box(11, 4.5, .4, M.plastic), 0, y, 8.8)); return g; },
  rj45() { const g = grp(box(16, 13.5, 21, M.metal)); g.add(at(box(11, 8, .4, M.plastic), 0, 3, 10.6)); return g; },
  microHdmi() { return grp(box(7.2, 3.4, 7.6, M.metal)); },
  audio() { const g = grp(box(7, 6, 12, M.plastic)); const c = cyl(3, 2.5, M.plastic); c.rotation.x = Math.PI / 2; c.position.set(0, 3, 6.5); g.add(c); return g; },
  jack() { const g = grp(box(9, 11, 14, M.plastic)); const r = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, .6, 24), M.chip); r.rotation.x = Math.PI / 2; r.position.set(0, 6.5, 7.1); g.add(r); const p = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .7, 12), M.metal); p.rotation.x = Math.PI / 2; p.position.set(0, 6.5, 7.15); g.add(p); return g; },
  sot223({ label = '' }) { const g = grp(box(6.5, 1.6, 3.5, M.chip)); g.add(at(box(3, .2, 2.4, M.metal), 0, 0, -2.6)); for (const x of [-2.3, 0, 2.3]) g.add(at(box(.7, .2, 1.6, M.metal), x, 0, 2.4)); const l = labelTop(6, 3, label, 1.6); if (l) g.add(l); return g; },
  sot23() { const g = grp(box(3, 1, 1.5, M.chip)); for (const x of [-1, 1]) g.add(at(box(.4, .2, .6, M.metal), x, 0, .9)); g.add(at(box(.4, .2, .6, M.metal), 0, 0, -.9)); return g; },
  crystal({ w = 11, d = 4.6, h = 3.6 }) { return grp(rbox(w, h, d, Math.min(d, h) / 2 - .05, M.metal)); },
  smdCrystal({ w = 3.2, d = 2.5 }) { const g = grp(box(w, .8, d, M.metal)); return g; },
  resonator() { const g = grp(box(3.2, 1, 1.3, M.ceramic)); return g; },
  cap({ r = 3.15, h = 5.5 }) {
    const g = grp(cyl(r, h, M.metal, 28));
    const top = new THREE.Mesh(new THREE.CircleGeometry(r * .98, 28), M.capBlue); top.rotation.x = -Math.PI / 2; top.position.y = h + .01; g.add(top);
    const sleeve = cyl(r * 1.01, h * .9, std('#1b1b1b', { roughness: .4 }), 28); sleeve.material.side = THREE.DoubleSide; g.add(sleeve);
    return g;
  },
  smd({ w = 1.6, d = .8, color = '#7a6a52' }) { const g = grp(box(w, .5, d, std(color))); g.add(at(box(.3, .52, d * 1.02, M.metal), -w / 2 + .15, 0, 0)); g.add(at(box(.3, .52, d * 1.02, M.metal), w / 2 - .15, 0, 0)); return g; },
  led({ color = '#ffb020', w = 1.6, d = .8 }) {
    const lens = new THREE.MeshStandardMaterial({ color: '#f6f2e6', emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: .2, transparent: true, opacity: .92 });
    const g = grp(box(w, .6, d, lens)); g.userData.led = { mat: lens, color };
    return g;
  },
  button({ s = 6, cap = 'round', color = '#1d1d1f' }) {
    const g = grp(box(s, 1.6, s, M.metal));
    const c = cap === 'round' ? cyl(s * .28, 1.5, std(color, { roughness: .4 })) : box(s * .5, 1.5, s * .5, std(color));
    c.position.y += 1.6; g.add(c); return g;
  },
  smallButton({ color = '#ecebe4' }) { const g = grp(box(4.2, 1.2, 3.2, M.metal)); const c = box(2, 1, 1.2, std(color)); c.position.y += 1.2; g.add(c); return g; },
  module({ w = 18, d = 25.5, can = 15.5, label = 'ESP-WROOM-32' }) {
    const g = grp(box(w, .8, d, std('#1d2733')));
    const shield = at(box(w - 1, 2.4, can, M.metal), 0, .8, d / 2 - can / 2 - .3); g.add(shield);
    const l = labelTop(w - 3, can - 3, label, 3.2, '#4c4f53'); if (l) { l.position.z = d / 2 - can / 2 - .3; g.add(l); }
    // antenna trace
    const ant = new THREE.Mesh(new THREE.PlaneGeometry(w - 3, d - can - 2), new THREE.MeshBasicMaterial({ map: antennaTex(), transparent: true }));
    ant.rotation.x = -Math.PI / 2; ant.position.set(0, .82, -d / 2 + (d - can) / 2); g.add(ant);
    return g;
  },
  esp12({ label = 'ESP8266MOD' }) { return PARTS.module({ w: 16, d: 24, can: 15, label }); },
  sd() { return grp(box(14, 1.8, 15, M.metal)); },
  ram({ label = 'LPDDR4' }) { return PARTS.qfn({ w: 14, d: 12, h: 1, label }); },
  heatsinkChip({ label = 'BCM2711' }) { const g = PARTS.qfn({ w: 15, d: 15, h: 1.6, label }); return g; },
  shroud({ fw = 5, fd = 2.5 }) { const g = grp(box(fw, 4.5, fd, M.plasticWhite)); g.add(at(box(fw * .9, .2, fd * .4, M.plastic), 0, 4.5, 0)); return g; },
  inductor({ s = 4 }) { return grp(box(s, 2, s, std('#3a3a3c'))); },
  bootJumper() { const g = grp(box(5.1, 2.5, 7.6, M.plastic)); for (const x of [-1.27, 1.27]) for (const z of [-2.54, 0, 2.54]) g.add(at(box(.64, 6, .64, M.gold), x, 0, z)); g.add(at(box(2.4, 4, 5, std('#f1c21b')), 0, 2.5, -1.27)); return g; },
};

function antennaTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
  g.strokeStyle = '#c9a85a'; g.lineWidth = 5; g.beginPath(); g.moveTo(10, 56);
  for (let i = 0; i < 6; i++) { const x = 14 + i * 18; g.lineTo(x, 10); g.lineTo(x + 9, 10); g.lineTo(x + 9, 50); }
  g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ───────────────────────── headers ─────────────────────────
/** Header row. type: 'female' (socket), 'male' (posts up), 'down' (pins below for a breadboard), 'pad' (castellated/pads only). */
function header(type, n, rows = 1) {
  const g = new THREE.Group(); const L = n * PITCH, W = rows * PITCH;
  if (type === 'female') { const b = box(L, 8.5, W, M.plastic); g.add(b); }
  if (type === 'male') { g.add(box(L, 2.5, W, M.plastic)); }
  if (type === 'down') { const b = box(L, 2.5, W, M.plastic); b.position.y = -T - 1.25; g.add(b); }
  const pinGeo = new THREE.BoxGeometry(.64, 1, .64);
  const count = n * rows; const o = new THREE.Object3D();
  if (type === 'male' || type === 'down') {
    const inst = new THREE.InstancedMesh(pinGeo, M.gold, count); let k = 0;
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const x = -L / 2 + (i + .5) * PITCH, z = -W / 2 + (r + .5) * PITCH;
      if (type === 'male') { o.position.set(x, 2.5 + 3, z); o.scale.set(1, 8.5, 1); }
      else { o.position.set(x, -T - 4.2, z); o.scale.set(1, 8.5, 1); }
      o.updateMatrix(); inst.setMatrixAt(k++, o.matrix);
    }
    inst.castShadow = true; g.add(inst);
  }
  if (type === 'female') {
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .05, 1), std('#050505'), count); let k = 0;
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) { o.position.set(-L / 2 + (i + .5) * PITCH, 8.53, -W / 2 + (r + .5) * PITCH); o.updateMatrix(); inst.setMatrixAt(k++, o.matrix); }
    g.add(inst);
  }
  if (type === 'down' || type === 'pad') {
    const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(.85, .85, .06, 14), M.gold, count); let k = 0;
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) { o.position.set(-L / 2 + (i + .5) * PITCH, .03, -W / 2 + (r + .5) * PITCH); o.scale.set(1, 1, 1); o.updateMatrix(); inst.setMatrixAt(k++, o.matrix); }
    g.add(inst);
  }
  return g;
}
const HEADER_TOP = { female: 8.5, male: 8.5, down: .2, pad: .2 };

// ───────────────────────── PCB silkscreen ─────────────────────────
function silkscreen(def, side) {
  const { w, d } = def.pcb; const S = 12;              // px per mm
  const c = document.createElement('canvas'); c.width = Math.round(w * S); c.height = Math.round(d * S);
  const g = c.getContext('2d');
  const base = new THREE.Color(def.pcb.color);
  g.fillStyle = '#' + base.getHexString(); g.fillRect(0, 0, c.width, c.height);
  // copper traces (lighter shade of the mask colour)
  const tr = base.clone().offsetHSL(0, 0, .07); g.strokeStyle = '#' + tr.getHexString(); g.lineWidth = .35 * S; g.lineCap = 'round';
  let seed = [...def.id].reduce((a, ch) => a + ch.charCodeAt(0), side === 'b' ? 99 : 7);
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    let x = rnd() * c.width, y = rnd() * c.height; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 3; s++) { if (rnd() > .5) x += (rnd() - .5) * 26 * S; else y += (rnd() - .5) * 26 * S; g.lineTo(x, y); }
    g.stroke();
  }
  g.fillStyle = '#' + tr.offsetHSL(0, 0, .05).getHexString();
  for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(rnd() * c.width, rnd() * c.height, .35 * S, 0, 7); g.fill(); }
  const ink = def.pcb.silk || '#f3f1ea';
  g.fillStyle = ink; g.strokeStyle = ink; g.textBaseline = 'middle';
  const px = (x) => (x + w / 2) * S, pz = (z) => (side === 'b' ? (d / 2 - z) : (z + d / 2)) * S;
  if (side === 't') {
    // pin names beside every header
    for (const h of def.headers || []) {
      if (h.side === 'b' || h.noLabels) continue;
      const dx = h.dir === 'z' ? 0 : 1, dz = h.dir === 'z' ? 1 : 0;
      const off = (h.labelOff ?? 2.6) * (h.rows === 2 ? 1.6 : 1);
      g.font = `600 ${1.15 * S}px system-ui`;
      h.pins.forEach((p, i) => {
        if (!p || p === '—') return;
        const x = h.x + i * PITCH * dx, z = h.z + i * PITCH * dz;
        const short = String(p).split(/[ ·/]/)[0].slice(0, 6);
        g.save();
        if (dx) { g.translate(px(x), pz(z + off)); g.rotate(-Math.PI / 2); g.textAlign = off > 0 ? 'right' : 'left'; g.fillText(short, 0, 0); }
        else { g.translate(px(x + off), pz(z)); g.textAlign = off > 0 ? 'left' : 'right'; g.fillText(short, 0, 0); }
        g.restore();
      });
    }
    for (const t of def.silk || []) { g.font = `${t.b ? 700 : 600} ${(t.s || 2.4) * S}px ${t.serif ? 'Georgia, serif' : 'system-ui'}`; g.textAlign = 'center'; g.save(); g.translate(px(t.x), pz(t.z)); if (t.r) g.rotate(t.r); g.fillText(t.t, 0, 0); g.restore(); }
    // component outlines (white boxes) under parts
    g.lineWidth = .18 * S;
    for (const p of def.comps) if (p.side !== 'b' && p.outline !== false && p.fw) g.strokeRect(px(p.x - p.fw / 2 - .4), pz(p.z - p.fd / 2 - .4), (p.fw + .8) * S, (p.fd + .8) * S);
  } else {
    g.font = `700 ${3 * S}px system-ui`; g.textAlign = 'center';
    g.save(); g.translate(px(0), pz(0)); g.scale(-1, 1); g.fillText(def.backText || def.name, 0, 0); g.restore();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  tex.repeat.set(1 / w, 1 / d); tex.offset.set(.5, .5);
  return tex;
}

// ───────────────────────── board factory ─────────────────────────
const FOOT = { qfp: (o) => [o.w || 7, o.d || 7], qfn: (o) => [o.w || 5, o.d || 5], dip: (o) => [(o.pins || 28) / 2 * PITCH + 2, 10], usbB: () => [12, 16], usbMini: () => [7.7, 9], usbMicro: () => [7.5, 5.5], usbC: () => [9, 7.4], usbA2: () => [14.5, 17.5], usbA2black: () => [14.5, 17.5], rj45: () => [16, 21], microHdmi: () => [7.2, 7.6], audio: () => [7, 12], jack: () => [9, 14], sot223: () => [6.5, 6], sot23: () => [3, 2.5], crystal: (o) => [o.w || 11, o.d || 4.6], smdCrystal: (o) => [o.w || 3.2, o.d || 2.5], resonator: () => [3.2, 1.3], cap: (o) => [(o.r || 3.15) * 2, (o.r || 3.15) * 2], smd: (o) => [o.w || 1.6, o.d || .8], led: (o) => [o.w || 1.6, o.d || .8], button: (o) => [o.s || 6, o.s || 6], smallButton: () => [4.2, 3.2], module: (o) => [o.w || 18, o.d || 25.5], esp12: () => [16, 24], sd: () => [14, 15], ram: () => [14, 12], heatsinkChip: () => [15, 15], soic: (o) => [o.w || 5, (o.d || 4) + 1], shroud: () => [5, 2.5], inductor: (o) => [o.s || 4, o.s || 4], bootJumper: () => [5.1, 7.6] };

/**
 * Build a board from its data definition.
 * Returns a Group with userData = { def, parts: Map(partId → Object3D[]), pins: [{ name, kind, funcs, mesh, local }], anchors: Map(partId → Vector3) }.
 */
export function buildBoard(def) {
  const root = new THREE.Group(); root.name = def.id;
  const { w, d, r = 2, holes = [], color } = def.pcb;
  const shape = rrShape(w, d, r);
  for (const [hx, hz, hr = 1.6] of holes) { const p = new THREE.Path(); p.absarc(hx, -hz, hr, 0, Math.PI * 2, true); shape.holes.push(p); }
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 10 }), std(new THREE.Color(color).offsetHSL(0, 0, -.06), { roughness: .5 }));
  body.rotation.x = -Math.PI / 2; body.castShadow = true; body.receiveShadow = true; body.userData.part = 'pcb'; root.add(body);
  const topGeo = new THREE.ShapeGeometry(shape, 10);
  const top = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ map: silkscreen(def, 't'), roughness: .42, metalness: .05 }));
  top.rotation.x = -Math.PI / 2; top.position.y = T + .01; top.receiveShadow = true; top.userData.part = 'pcb'; root.add(top);
  const bot = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ map: silkscreen(def, 'b'), roughness: .42 }));
  bot.rotation.x = Math.PI / 2; bot.position.y = -.01; bot.userData.part = 'pcb'; root.add(bot);

  const parts = new Map(); const add = (id, o) => { if (!id) return; if (!parts.has(id)) parts.set(id, []); parts.get(id).push(o); };
  const leds = [];
  for (const c of def.comps) {
    const f = PARTS[c.type]; if (!f) { console.warn('unknown part', c.type); continue; }
    const o = f(c);
    const [fw, fd] = (FOOT[c.type] || (() => [4, 4]))(c); c.fw = c.fw ?? fw; c.fd = c.fd ?? fd;
    if (c.rot) o.rotation.y = c.rot;
    if (c.side === 'b') { o.rotation.x = Math.PI; o.position.set(c.x, -.01, c.z); }
    else o.position.set(c.x, T + (c.lift || 0), c.z);
    o.traverse((m) => { m.userData.part = c.part || null; if (m.isMesh) { m.castShadow = true; } });
    o.userData.comp = c; root.add(o); add(c.part, o);
    if (o.userData.led) leds.push({ ...o.userData.led, obj: o, part: c.part, pinLed: c.ledPin, always: c.always });
  }

  const pins = [];
  for (const h of def.headers || []) {
    const n = h.pins.length, rows = h.rows || 1;
    const hd = header(h.type, n, rows);
    const dx = h.dir === 'z' ? 0 : 1, dz = h.dir === 'z' ? 1 : 0;
    const L = n * PITCH;
    hd.position.set(h.x + dx * (L / 2 - PITCH / 2), h.side === 'b' ? 0 : T, h.z + dz * (L / 2 - PITCH / 2) + (rows - 1) * PITCH / 2 * (dx ? 1 : 0));
    if (h.dir === 'z') hd.rotation.y = -Math.PI / 2;
    if (h.dir === 'z' && rows > 1) hd.position.x += (rows - 1) * PITCH / 2;
    if (h.side === 'b') hd.rotation.x = Math.PI;
    hd.traverse((m) => { m.userData.part = h.part || null; }); root.add(hd); add(h.part, hd);
    const yTop = (h.side === 'b' ? -1 : 1) * (HEADER_TOP[h.type] ?? 1) + (h.side === 'b' ? 0 : T);
    for (let r = 0; r < rows; r++) h.pins.forEach((raw, i) => {
      const name = rows > 1 ? (h.pins2 ? (r ? h.pins2[i] : raw) : raw) : raw;
      if (!name || name === '—') return;
      const x = h.x + i * PITCH * dx + (h.dir === 'z' ? r * PITCH : 0), z = h.z + i * PITCH * dz + (h.dir === 'z' ? 0 : r * PITCH);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 2.2), M.pinHit.clone());
      hit.position.set(x, yTop + .9, z); hit.userData.pinName = name; hit.userData.part = h.part || null;
      root.add(hit);
      const meta = (def.pinInfo && def.pinInfo[name]) || {};
      pins.push({ name, kind: meta.kind || kindOf(name), funcs: meta.f || '', mesh: hit, local: new THREE.Vector3(x, yTop, z), header: h });
    });
  }

  // label anchors = top-centre of each part's bounding box (in board space)
  root.updateMatrixWorld(true);
  const anchors = new Map();
  for (const [id, objs] of parts) {
    const bb = new THREE.Box3(); objs.forEach(o => bb.expandByObject(o));
    const c = bb.getCenter(new THREE.Vector3()); const pd = def.parts.find(p => p.id === id);
    const below = objs[0]?.userData?.comp?.side === 'b' || pd?.bottom;
    anchors.set(id, new THREE.Vector3(c.x, below ? bb.min.y - 1 : bb.max.y + 1.2, c.z));
  }
  root.userData = { def, parts, pins, anchors, leds };
  return root;
}

/** Set an on-board LED (or all LEDs with matching part) brightness 0..1. */
export function setLed(led, v) { led.mat.emissiveIntensity = v * 2.4; led.mat.color.set(v > .05 ? led.color : '#f6f2e6'); }
