// Robotics Lab — site UI: 3D board stage, labels, lesson, "find the part" quiz, assembly, comparison table.
import * as THREE from 'three';
import { Viewer, boardThumb } from './core/viewer.js';
import { buildBoard, KIND_COLORS, KIND_NAMES, setLed, T, PITCH } from './core/builder.js';
import { BOARDS, byId } from './boards/index.js';
import { Assembly } from './core/assembly.js';
import { progress, saveProgress, track, toast, get, set } from './core/store.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const icon = (n) => `<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const motion = () => !mqReduce.matches;
const params = new URLSearchParams(location.search);

const state = { def: null, board: null, labels: true, rotate: false, mode: 'view', sel: null, hl: null, kindShow: null, lab: null, labLoading: null };

// ───────────────────────── glossary ─────────────────────────
const GLOSSARY = {
  PWM: 'Pulse-width modulation: switching a pin on and off very fast. The share of “on” time sets an LED’s brightness or a motor’s speed.',
  ADC: 'Analog-to-digital converter: turns a voltage into a number your code can read.',
  'I²C': 'A two-wire bus (SDA data, SCL clock) that lets many sensors share the same pins, each with its own address.',
  UART: 'Serial port: two wires, TX (transmit) and RX (receive). One board’s TX goes to the other’s RX.',
  SPI: 'A fast bus with separate data-in, data-out and clock lines, plus a chip-select per device.',
  GPIO: 'General-purpose input/output: a pin your program can read or switch.',
  bootloader: 'A small program that runs first and lets you upload new sketches over USB without a special programmer.',
  regulator: 'A part that turns a higher, rougher voltage into a steady lower one (e.g. 9 V → 5 V).',
  'level shifter': 'A small board that safely translates signals between 5 V and 3.3 V devices.',
  'pull-up': 'A resistor that keeps an input HIGH until something (like a button) pulls it LOW.',
};
function gloss(text) {
  let out = esc(text); const used = new Set();
  for (const [term, def] of Object.entries(GLOSSARY)) {
    const re = new RegExp(`(^|[^\\w>])(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^\\w]|$)`, 'i');
    if (used.has(term)) continue;
    out = out.replace(re, (m, a, b) => { used.add(term); return `${a}<span class="term" tabindex="0" data-def="${esc(def)}">${b}</span>`; });
  }
  return out;
}

// ───────────────────────── stage ─────────────────────────
const stageEl = $('#sec-stage');
const viewer = new Viewer($('#stage-canvas'), { motion, offset: (w, h) => (w > 860 ? [-w * .13, h * .02] : [0, h * .06]) });
const labelsEl = $('#labels');
const tipEl = $('#pin-tip');
const cardEl = $('#part-card');
let hintT = 0;
viewer.onPlainWheel = () => { const h = $('#zoom-hint'); if (performance.now() - hintT < 1500) return; hintT = performance.now(); h.classList.add('flash'); setTimeout(() => h.classList.remove('flash'), 1400); };

function buildPicker() {
  const pk = $('#picker');
  pk.innerHTML = BOARDS.map((b, i) => `<button class="pick" type="button" role="option" data-id="${b.id}" aria-selected="false" aria-label="${esc(b.name)}: ${esc(b.tagline)}">
    <span class="thumb" data-thumb="${b.id}"></span><span><b>${esc(b.name)}</b><small>${esc(b.tagline)}</small></span></button>`).join('');
  pk.addEventListener('click', (e) => { const b = e.target.closest('.pick'); if (b) loadBoard(b.dataset.id); });
  // thumbnails render one per idle slot
  let i = 0; const next = () => {
    if (i >= BOARDS.length) { fillLabThumbs(); return; }
    const b = BOARDS[i++]; try { const url = boardThumb(b); $$(`[data-thumb="${b.id}"]`).forEach((el) => { el.outerHTML = `<img src="${url}" alt="" data-thumb="${b.id}">`; }); } catch (e) { console.warn(e); }
    if (window.requestIdleCallback) requestIdleCallback(() => next(), { timeout: 400 }); else setTimeout(next, 30);
  };
  setTimeout(next, 400);
}
function fillLabThumbs() { state.lab?.refreshThumbs?.(); }

function loadBoard(id, { view = '34', animate = true, replace = false } = {}) {
  const def = byId(id) || BOARDS[0];
  if (state.def === def && state.board) return;
  if (state.mode === 'quiz') quiz.stop(); if (state.mode === 'asm') asm.stop();
  state.def = def; state.sel = null; clearHighlight(); hidePartCard();
  const g = buildBoard(def); state.board = g;
  viewer.setBoard(g, { animate });
  viewer.view(view, animate ? 1000 : 0);
  g.userData.leds.forEach((l) => setLed(l, l.always ? 1 : 0));
  const idx = BOARDS.indexOf(def);
  $('#st-maker').textContent = `${def.maker.split(' ·')[0]} · ${def.year}`;
  $('#st-count').textContent = `${String(idx + 1).padStart(2, '0')} / ${String(BOARDS.length).padStart(2, '0')}`;
  $('#st-name').textContent = def.name; $('#st-tag').textContent = def.tagline;
  const lv = $('#st-level'); lv.textContent = def.level; lv.className = `chip lvl-${def.level}`;
  $$('.pick').forEach((p) => p.setAttribute('aria-selected', String(p.dataset.id === def.id)));
  $(`.pick[data-id="${def.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: motion() ? 'smooth' : 'auto' });
  $$('.bname').forEach((s) => (s.textContent = def.name));
  $('#asm-count').textContent = `${def.parts.length} labelled parts`;
  document.title = `${def.name} | Robokalam Robotics Lab`;
  const url = new URL(location.href); url.hash = def.id; url.search = '';
  history[replace ? 'replaceState' : 'replaceState'](null, '', url);
  $$('.seg button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
  buildLabels(); renderLesson(); markTable(); updateBests();
  track({ k: 'board', b: def.id });
}

function buildLabels() {
  const def = state.def, anchors = state.board.userData.anchors;
  labelsEl.innerHTML = def.parts.map((p, i) => anchors.has(p.id) ? `<button class="lbl" type="button" data-part="${p.id}" style="opacity:0">${i + 1}<span>${esc(p.name)}</span></button>` : '').join('');
  labelsEl.classList.toggle('labels-off', !state.labels);
}
labelsEl.addEventListener('click', (e) => { const b = e.target.closest('.lbl'); if (b) onPartClick(b.dataset.part, true); });

const tmpV = new THREE.Vector3();
viewer.onFrame((dt, now) => {
  const g = state.board; if (!g) return;
  // labels follow their anchors
  if (state.labels && state.mode !== 'asm') {
    const camBelow = viewer.camera.position.y < g.position.y;
    for (const el of labelsEl.children) {
      const a = g.userData.anchors.get(el.dataset.part); if (!a) continue;
      tmpV.copy(a); g.localToWorld(tmpV);
      const p = viewer.project(tmpV);
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
      const under = a.y < 0;
      el.style.opacity = p.behind ? 0 : '';
      el.classList.toggle('hidden-side', under !== camBelow);
    }
  }
  if (state.hl) { const k = .5 + .5 * Math.sin(now / 220); state.hl.fill.material.opacity = .08 + .16 * k; }
  if (state.mode === 'asm') asm.frame(dt, now);
});

// highlight box around a part
function highlight(partId, color = '#1bb4e3') {
  clearHighlight();
  const g = state.board, objs = g.userData.parts.get(partId); if (!objs) return;
  const bb = new THREE.Box3(); objs.forEach((o) => bb.expandByObject(o));
  const inv = g.matrixWorld.clone().invert(); bb.applyMatrix4(inv);
  const size = bb.getSize(new THREE.Vector3()).addScalar(1.6), c = bb.getCenter(new THREE.Vector3());
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .2, depthWrite: false }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .9 }));
  const grp = new THREE.Group(); grp.add(fill, edges); grp.position.copy(c); grp.renderOrder = 5; grp.userData.fx = true;
  grp.traverse((m) => { m.raycast = () => {}; });
  g.add(grp); state.hl = { grp, fill };
}
function clearHighlight() { if (state.hl) { state.hl.grp.parent?.remove(state.hl.grp); state.hl.grp.traverse((m) => { m.geometry?.dispose(); m.material?.dispose(); }); state.hl = null; } }

function onPartClick(id, fly = true) {
  if (state.mode === 'quiz') { quiz.answer(id); return; }
  if (state.mode === 'asm') return;
  selectPart(id, fly);
}
function selectPart(id, fly = true) {
  const def = state.def, p = def.parts.find((x) => x.id === id); if (!p) return;
  state.sel = id; highlight(id);
  if (fly) { const a = state.board.userData.anchors.get(id); if (a) viewer.focus(a, 1.25); }
  const n = def.parts.indexOf(p) + 1;
  cardEl.innerHTML = `<button class="x" type="button" aria-label="Close">×</button><span class="n">${String(n).padStart(2, '0')} · ${esc(def.short)}</span><h3>${esc(p.name)}</h3><p>${gloss(p.desc)}</p>`;
  cardEl.hidden = false;
  $$('.lbl').forEach((l) => l.classList.toggle('on', l.dataset.part === id));
  $$('.parts button').forEach((b) => b.classList.toggle('on', b.dataset.part === id));
  track({ k: 'part', b: def.id, p: id });
}
function hidePartCard() { cardEl.hidden = true; state.sel = null; $$('.lbl.on, .parts button.on').forEach((l) => l.classList.remove('on')); }
cardEl.addEventListener('click', (e) => { if (e.target.closest('.x')) { hidePartCard(); clearHighlight(); } });

// pointer: hover pins, click parts (ignore drags)
const canvas = viewer.renderer.domElement;
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; if (state.mode === 'asm') asm.pointerDown(e); });
canvas.addEventListener('pointerup', (e) => {
  if (state.mode === 'asm') { asm.pointerUp(e); }
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
  if (moved > 6) return;
  if (state.mode === 'asm') { asm.click(e); return; }
  const hit = pickPart(e);
  if (hit) onPartClick(hit, state.mode !== 'quiz'); else if (state.mode === 'view') { hidePartCard(); clearHighlight(); }
});
canvas.addEventListener('pointermove', (e) => {
  if (state.mode === 'asm') { asm.pointerMove(e); tipEl.hidden = true; return; }
  if (e.buttons) { tipEl.hidden = true; return; }
  const pins = state.board?.userData.pins; if (!pins) return;
  const hits = viewer.pick(e, pins.map((p) => p.mesh));
  pins.forEach((p) => { if (p.mesh.userData.hot) { p.mesh.userData.hot = false; paintPin(p); } });
  if (hits.length && state.mode === 'view') {
    const pin = pins.find((p) => p.mesh === hits[0].object);
    pin.mesh.userData.hot = true; paintPin(pin);
    const r = stageEl.getBoundingClientRect();
    tipEl.innerHTML = `<i style="background:${KIND_COLORS[pin.kind]}"></i><b>${esc(pin.name)}</b><br>${esc(pin.funcs || KIND_NAMES[pin.kind])}`;
    tipEl.style.left = `${e.clientX - r.left}px`; tipEl.style.top = `${e.clientY - r.top}px`; tipEl.hidden = false;
    canvas.style.cursor = 'help';
  } else {
    tipEl.hidden = true;
    canvas.style.cursor = pickPart(e) ? 'pointer' : 'grab';
  }
});
canvas.addEventListener('pointerleave', () => { tipEl.hidden = true; });
function pickPart(e) {
  if (!state.board) return null;
  const hits = viewer.pick(e, [state.board]);
  for (const h of hits) { let o = h.object; while (o && !o.userData.part && o !== state.board) o = o.parent; const id = o?.userData.part; if (id && id !== 'pcb' && !o.userData.fx) return id; if (id === 'pcb') return null; }
  return null;
}
function paintPin(p) {
  const m = p.mesh.material, show = p.mesh.userData.hot || (state.kindShow && state.kindShow.has(p.kind));
  m.opacity = show ? (p.mesh.userData.hot ? .85 : .6) : 0; m.color.set(KIND_COLORS[p.kind]);
}

// toolbar
$$('.seg button').forEach((b) => b.addEventListener('click', () => { $$('.seg button').forEach((x) => x.classList.toggle('on', x === b)); viewer.view(b.dataset.view); track({ k: 'view', v: b.dataset.view }); }));
$('#vb-rotate').addEventListener('click', (e) => { state.rotate = !state.rotate; viewer.controls.autoRotate = state.rotate && motion(); e.currentTarget.setAttribute('aria-pressed', String(state.rotate)); });
$('#vb-labels').addEventListener('click', (e) => { state.labels = !state.labels; labelsEl.classList.toggle('labels-off', !state.labels); e.currentTarget.setAttribute('aria-pressed', String(state.labels)); e.currentTarget.querySelector('span').textContent = state.labels ? 'Labels' : 'Labels off'; });
$('#vb-quiz').addEventListener('click', () => quiz.start());
$('#vb-asm').addEventListener('click', () => asm.start());
$('#try-quiz').addEventListener('click', () => { stageEl.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto' }); quiz.start(); });
$('#try-asm').addEventListener('click', () => { stageEl.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto' }); asm.start(); });
$('#st-open').addEventListener('click', () => openOnBench(state.def.id));

document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select, [contenteditable], .lab')) return;
  if (e.key === 'Escape') { if (state.mode === 'quiz') quiz.stop(); else if (state.mode === 'asm') asm.stop(); else { hidePartCard(); clearHighlight(); } return; }
  if (state.mode !== 'view') return;
  const r = stageEl.getBoundingClientRect(); if (r.bottom < 80 || r.top > innerHeight * .6) return;      // only while the stage is on screen
  const i = BOARDS.indexOf(state.def);
  if (e.key === 'ArrowRight') { loadBoard(BOARDS[(i + 1) % BOARDS.length].id); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { loadBoard(BOARDS[(i - 1 + BOARDS.length) % BOARDS.length].id); e.preventDefault(); }
});
window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (byId(id) && id !== state.def?.id) loadBoard(id); });

// ───────────────────────── lesson ─────────────────────────
const KW = new Set('void int long float double char bool boolean const unsigned byte if else while for return true false include define HIGH LOW INPUT OUTPUT INPUT_PULLUP INPUT_PULLDOWN LED_BUILTIN A0 A1 A2 A3 A4 A5 A6 A7 PC13 import from as def True False None while in not and or Serial Serial1 WiFi'.split(' '));
function highlightCode(src, lang) {
  const py = /python/i.test(lang);
  const re = py
    ? /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(\d+(?:\.\d+)?)\b|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/gm
    : /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|<\w+\.h>)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/gm;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index)); last = re.lastIndex;
    const [t, c, s, n, f, w] = m;
    if (c) out += `<span class="tok-c">${esc(c)}</span>`;
    else if (s) out += `<span class="tok-s">${esc(s)}</span>`;
    else if (n) out += `<span class="tok-n">${esc(n)}</span>`;
    else if (f) out += KW.has(f) ? `<span class="tok-k">${esc(f)}</span>` : `<span class="tok-f">${esc(f)}</span>`;
    else out += KW.has(w) ? `<span class="tok-k">${esc(w)}</span>` : esc(w);
  }
  return out + esc(src.slice(last));
}

function pinoutSVG(def) {
  const { w, d } = def.pcb; const S = 9, pad = 70;
  const W = w * S + pad * 2, H = d * S + pad * 2;
  const X = (x) => pad + (x + w / 2) * S, Z = (z) => pad + (z + d / 2) * S;
  let s = `<svg class="pinout-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pinout diagram of the ${esc(def.name)}">`;
  s += `<rect x="${X(-w / 2)}" y="${Z(-d / 2)}" width="${w * S}" height="${d * S}" rx="${(def.pcb.r || 1) * S}" fill="${def.pcb.color}" opacity=".9"/>`;
  for (const c of def.comps) if (c.side !== 'b' && c.part && c.fw) s += `<rect x="${X(c.x - c.fw / 2)}" y="${Z(c.z - c.fd / 2)}" width="${c.fw * S}" height="${c.fd * S}" rx="3" fill="rgba(0,0,0,.35)"/>`;
  s += `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="#fff" font-size="22" opacity=".85">${esc(def.short)}</text>`;
  for (const h of def.headers || []) {
    const rows = h.rows || 1, dx = h.dir === 'z' ? 0 : 1, dz = 1 - dx;
    for (let r = 0; r < rows; r++) h.pins.forEach((p0, i) => {
      const name = r ? (h.pins2 || h.pins)[i] : p0; if (!name || name === '—') return;
      const x = h.x + i * PITCH * dx + (dz ? r * PITCH : 0), z = h.z + i * PITCH * dz + (dx ? r * PITCH : 0);
      const pin = state.board?.userData.pins.find((q) => q.name === name);
      const kind = pin?.kind || 'dig';
      const px = X(x), pz = Z(z);
      s += `<g class="pp" data-kind="${kind}"><title>${esc(name)}: ${esc(pin?.funcs || KIND_NAMES[kind])}</title><circle cx="${px}" cy="${pz}" r="${S * .9}" fill="${KIND_COLORS[kind]}" stroke="#fff" stroke-width="1.5"/>`;
      if (!h.noLabels) {
        const out = dx ? (z < 0 ? -1 : 1) : (x < 0 ? -1 : 1);
        const edgeRow = rows === 1 || (dx ? (z < 0 ? r === 0 : r === rows - 1) : (x < 0 ? r === 0 : r === rows - 1));
        if (edgeRow) {
          if (dx) s += `<text x="${px}" y="${pz + out * 14}" font-size="10.5" fill="currentColor" text-anchor="${out < 0 ? 'start' : 'end'}" transform="rotate(-90 ${px} ${pz + out * 14})">${esc(name)}</text>`;
          else s += `<text x="${px + out * 14}" y="${pz + 4}" font-size="10.5" fill="currentColor" text-anchor="${out < 0 ? 'end' : 'start'}">${esc(name)}</text>`;
        }
      }
      s += '</g>';
    });
  }
  return s + '</svg>';
}

function renderLesson() {
  const def = state.def;
  const statOrder = [['Clock', 'clock'], ['Flash', 'flash'], ['RAM', 'ram'], ['GPIO pins', 'gpio'], ['Logic level', 'logic'], ['Price', 'price']];
  const kinds = ['pwr', 'gnd', 'dig', 'ana', 'com', 'ctl', 'nc'];
  $('#lesson-root').innerHTML = `
    <p class="sec-eyebrow">Lesson</p>
    <div class="lesson-head">
      <div><h2>${esc(def.name)}: what you need to know</h2>
        <p class="kicker">In short · ${esc(def.makerLong)} · ${def.year}</p>
        <p class="intro">${gloss(def.intro)}</p></div>
      <div class="stats">${statOrder.map(([l, k]) => `<div class="stat"><small>${l}</small><b>${esc(def.stats[k])}</b></div>`).join('')}</div>
    </div>
    <div class="block"><h3>Specs</h3><p class="sub">The full data sheet in plain words.</p>
      <dl class="specs">${def.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>
    <div class="block"><h3>What’s on the board</h3><p class="sub">${def.parts.length} parts, numbered like the labels on the 3D model. Click one and the camera flies to it.</p>
      <ol class="parts">${def.parts.map((p, i) => `<li><button type="button" data-part="${p.id}"><span class="n">${i + 1}</span><span><b>${esc(p.name)}</b><span class="d">${gloss(p.desc)}</span></span></button></li>`).join('')}</ol></div>
    <div class="block"><h3>Strengths and pitfalls</h3><p class="sub">Why people love this board, and where beginners usually slip.</p>
      <div class="sp"><div class="good"><h4>Strengths</h4><ul>${def.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div class="warn"><h4>Watch out</h4><ul>${def.pitfalls.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div></div></div>
    <div class="block"><h3>Pins</h3><p class="sub">The contacts where sensors, motors and power connect.</p>
      <div class="pin-notes">${def.pinNotes.map(([h, t]) => `<div><h4>${esc(h)}</h4><p>${gloss(t)}</p></div>`).join('')}</div>
      <p class="sub" style="margin-top:18px">Hover over any pin on the 3D board to see its name and function. Click a colour to light up those pins on the model.</p>
      <div class="legend" role="group" aria-label="Pin colours">${kinds.map((k) => `<button type="button" data-kind="${k}" aria-pressed="${state.kindShow ? String(state.kindShow.has(k)) : 'true'}"><i style="background:${KIND_COLORS[k]}"></i>${esc(KIND_NAMES[k])}</button>`).join('')}</div>
      ${pinoutSVG(def)}</div>
    <div class="block"><h3>First code</h3><p class="sub">Copy it, upload it to the board and check that everything works.</p>
      <div class="code"><div class="code-head"><span>${esc(def.code.title)}<span class="lang">${esc(def.code.lang)}</span></span><button type="button" class="copy">${icon('copy')}<span>Copy</span></button></div>
      <pre><code>${highlightCode(def.code.src, def.code.lang)}</code></pre></div></div>
    <div class="block"><h3>Where it shines</h3><p class="sub">Project ideas this board suits best.</p><ul class="ideas">${def.ideas.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
    <div class="block"><h3>Facts</h3><div class="facts">${def.facts.map((s) => `<p>${esc(s)}</p>`).join('')}</div></div>`;
}
$('#lesson-root').addEventListener('click', async (e) => {
  const pb = e.target.closest('.parts button');
  if (pb) { stageEl.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto' }); setTimeout(() => selectPart(pb.dataset.part), motion() ? 450 : 0); return; }
  const cp = e.target.closest('.copy');
  if (cp) { try { await navigator.clipboard.writeText(state.def.code.src); } catch { /* ignore */ } cp.querySelector('span').textContent = 'Copied'; cp.querySelector('use').setAttribute('href', '#i-check'); setTimeout(() => { cp.querySelector('span').textContent = 'Copy'; cp.querySelector('use').setAttribute('href', '#i-copy'); }, 1600); track({ k: 'copy', b: state.def.id }); return; }
  const lg = e.target.closest('.legend button');
  if (lg) {
    const all = ['pwr', 'gnd', 'dig', 'ana', 'com', 'ctl', 'nc'];
    if (!state.kindShow) state.kindShow = new Set();
    const k = lg.dataset.kind; state.kindShow.has(k) ? state.kindShow.delete(k) : state.kindShow.add(k);
    if (!state.kindShow.size) state.kindShow = null;
    $$('.legend button').forEach((b) => b.setAttribute('aria-pressed', String(!state.kindShow || state.kindShow.has(b.dataset.kind))));
    $$('.pinout-svg .pp').forEach((g) => { g.style.opacity = !state.kindShow || state.kindShow.has(g.dataset.kind) ? 1 : .15; });
    state.board.userData.pins.forEach(paintPin);
    void all;
  }
});

// ───────────────────────── quiz ─────────────────────────
const quizBar = $('#quiz-bar');
const quiz = {
  qs: [], i: 0, results: [], tries: 0, hinted: false, t0: 0, lock: false,
  start() {
    if (state.mode === 'asm') asm.stop();
    const pool = state.def.parts.filter((p) => state.board.userData.parts.has(p.id));
    this.qs = pool.map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).slice(0, 6).map((x) => x[1]);
    this.i = 0; this.results = []; this.t0 = performance.now(); state.mode = 'quiz'; hidePartCard(); clearHighlight();
    stageEl.classList.add('interactive'); this.ask(); track({ k: 'quiz-start', b: state.def.id });
  },
  ask() {
    const q = this.qs[this.i]; this.tries = 0; this.hinted = false; this.lock = false; clearHighlight();
    quizBar.hidden = false;
    quizBar.innerHTML = `<div class="bar-top"><span>Find the part · ${esc(state.def.short)}</span><span>${this.i + 1} / ${this.qs.length}</span></div>
      <div class="progress"><i style="width:${(this.i / this.qs.length) * 100}%"></i></div>
      <p class="q">${esc(q.quiz || `Find the ${q.name}.`)}</p>
      <p class="feedback" id="qfb">Click the part on the 3D model. Drag to rotate, Ctrl + scroll to zoom, Bottom to flip it.</p>
      <div class="bar-actions"><button class="btn small" type="button" data-q="hint">Hint</button><button class="btn small" type="button" data-q="skip">Skip</button><button class="btn small ghost" type="button" data-q="stop">Stop</button></div>`;
  },
  answer(id) {
    if (this.lock) return;
    const q = this.qs[this.i], fb = $('#qfb');
    if (id === q.id) {
      const first = this.tries === 0 && !this.hinted;
      this.results.push({ p: q, ok: first }); highlight(q.id, '#8cc63e');
      fb.className = 'feedback good'; fb.textContent = first ? 'Right on the first try!' : 'Found it.'; beep(880, .12);
      this.lock = true; setTimeout(() => this.next(), 1100);
    } else {
      this.tries++; const other = state.def.parts.find((p) => p.id === id);
      fb.className = 'feedback bad'; fb.textContent = other ? `That’s the ${other.name}. Try again.` : 'Not quite. Try again.'; beep(220, .15);
      quizBar.classList.remove('shake'); void quizBar.offsetWidth; quizBar.classList.add('shake');
    }
  },
  hint() { const q = this.qs[this.i]; this.hinted = true; highlight(q.id, '#f6a71c'); const a = state.board.userData.anchors.get(q.id); if (a) viewer.focus(a, 2.2); $('#qfb').className = 'feedback'; $('#qfb').textContent = 'It’s in the glowing box.'; },
  skip() { const q = this.qs[this.i]; this.results.push({ p: q, ok: false, skipped: true }); highlight(q.id, '#c8412b'); const a = state.board.userData.anchors.get(q.id); if (a) viewer.focus(a, 2); this.lock = true; $('#qfb').className = 'feedback bad'; $('#qfb').textContent = `Here it is: the ${q.name}.`; setTimeout(() => this.next(), 1700); },
  next() { this.i++; if (this.i >= this.qs.length) this.finish(); else this.ask(); },
  finish() {
    const score = this.results.filter((r) => r.ok).length, secs = Math.round((performance.now() - this.t0) / 1000);
    const best = Math.max(score, progress().quiz[state.def.id] ?? 0);
    saveProgress((p) => { p.quiz[state.def.id] = best; });
    clearHighlight(); viewer.view('34');
    quizBar.innerHTML = `<div class="bar-top"><span>Result · ${esc(state.def.short)}</span><span>${secs} s</span></div>
      <p class="q">${score} of ${this.qs.length} on the first try ${score === this.qs.length ? 'Perfect!' : ''}</p>
      <div class="result-grid">${this.results.map((r) => `<span class="${r.ok ? 'ok' : 'no'}">${r.ok ? '✓' : '✗'} ${esc(r.p.name)}</span>`).join('')}</div>
      <p class="meta">Best for this board: ${best} / 6</p>
      <div class="bar-actions"><button class="btn small primary" type="button" data-q="again">Play again</button><button class="btn small" type="button" data-q="lesson">Back to the lesson</button></div>`;
    track({ k: 'quiz-done', b: state.def.id, s: score }); updateBests();
  },
  stop() { state.mode = 'view'; quizBar.hidden = true; clearHighlight(); stageEl.classList.remove('interactive'); },
};
quizBar.addEventListener('click', (e) => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  ({ hint: () => quiz.hint(), skip: () => quiz.skip(), stop: () => quiz.stop(), again: () => quiz.start(), lesson: () => { quiz.stop(); $('#lesson').scrollIntoView({ behavior: motion() ? 'smooth' : 'auto' }); } })[b.dataset.q]?.();
});

let actx = null;
export function beep(freq = 660, dur = .1, type = 'sine', vol = .08) {
  if (get('rl.sound', '1') !== '1') return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, actx.currentTime); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + dur + .02);
  } catch { /* audio unavailable */ }
}

// ───────────────────────── assembly ─────────────────────────
const asmBar = $('#asm-bar');
const asm = new Assembly(viewer, {
  getBoard: () => state.board,
  bar: asmBar,
  beep,
  onStart: () => { if (state.mode === 'quiz') quiz.stop(); state.mode = 'asm'; hidePartCard(); clearHighlight(); labelsEl.style.display = 'none'; stageEl.classList.add('interactive', 'asm'); track({ k: 'asm-start', b: state.def.id }); },
  onStop: () => { state.mode = 'view'; labelsEl.style.display = ''; stageEl.classList.remove('interactive', 'asm'); viewer.view('34'); },
  onDone: (secs) => {
    const prev = progress().asm[state.def.id];
    saveProgress((p) => { if (!prev || secs < prev) p.asm[state.def.id] = secs; });
    track({ k: 'asm-done', b: state.def.id, s: secs }); updateBests();
  },
  partName: (id) => state.def.parts.find((p) => p.id === id)?.name || id,
});

// ───────────────────────── compare ─────────────────────────
const COLS = [['Board', 'name'], ['MCU', 'mcu'], ['Clock', 'clockHz'], ['Flash', 'flashKB'], ['RAM', 'ramKB'], ['GPIO', 'gpioN'], ['Analog in', 'analogN'], ['Wireless', 'wireless'], ['Logic', 'logic'], ['Price', 'priceUSD']];
const sortState = { key: null, dir: 1 }; const filters = new Set();
function renderTable() {
  let rows = BOARDS.slice();
  if (sortState.key) rows.sort((a, b) => { const k = sortState.key; const va = k === 'name' ? a.name : a.table[k], vb = k === 'name' ? b.name : b.table[k]; return (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))) * sortState.dir; });
  const pass = (b) => [...filters].every((f) => ({ wifi: !['—', 'none'].includes(b.table.wireless.toLowerCase()), '5v': b.lab.logic === 5, cheap: b.table.priceUSD < 10, linux: !!b.table.linux })[f]);
  $('#compare-table').innerHTML = `<thead><tr>${COLS.map(([l, k]) => `<th scope="col"><button type="button" data-sort="${k}" ${sortState.key === k ? `data-dir="${sortState.dir > 0 ? 'asc' : 'desc'}"` : ''}>${l}</button></th>`).join('')}</tr></thead>
    <tbody>${rows.map((b) => `<tr data-id="${b.id}" tabindex="0" class="${pass(b) ? '' : 'dim'}"><td><b>${esc(b.name)}</b><small>${esc(b.makerLong)}</small></td><td>${esc(b.table.mcu)}</td><td>${esc(b.table.clock)}</td><td>${esc(b.table.flash)}</td><td>${esc(b.table.ram)}</td><td>${esc(b.table.gpio)}</td><td>${esc(b.table.analog)}</td><td>${esc(b.table.wireless)}</td><td>${esc(b.table.logic)}</td><td>${esc(b.table.price)}</td></tr>`).join('')}</tbody>`;
  markTable();
}
function markTable() { $$('#compare-table tbody tr').forEach((tr) => tr.classList.toggle('on', tr.dataset.id === state.def?.id)); }
$('#compare-table').addEventListener('click', (e) => {
  const s = e.target.closest('[data-sort]');
  if (s) { const k = s.dataset.sort; sortState.dir = sortState.key === k ? -sortState.dir : 1; sortState.key = k; renderTable(); return; }
  const tr = e.target.closest('tbody tr'); if (tr) chooseFromTable(tr.dataset.id);
});
$('#compare-table').addEventListener('keydown', (e) => { const tr = e.target.closest('tbody tr'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); chooseFromTable(tr.dataset.id); } });
function chooseFromTable(id) { loadBoard(id); stageEl.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto' }); if (state.lab) state.lab.sandbox(id, { keep: true }); }
$$('.fchip').forEach((b) => b.addEventListener('click', () => { const f = b.dataset.filter; filters.has(f) ? filters.delete(f) : filters.add(f); b.setAttribute('aria-pressed', String(filters.has(f))); renderTable(); }));

// "which board" wizard
const WZ = [
  ['wifi', 'Does the project need Wi-Fi or Bluetooth?', [['yes', 'Yes'], ['no', 'No']]],
  ['linux', 'Will it run a camera, computer vision or Linux programs?', [['yes', 'Yes'], ['no', 'No']]],
  ['pins', 'How many sensors, motors and LEDs?', [['few', 'A few (under 10 pins)'], ['some', 'A normal robot'], ['lots', 'Lots (30+ pins)']]],
  ['level', 'How much experience do you have?', [['new', 'First project'], ['some', 'Some'], ['pro', 'Comfortable with datasheets']]],
];
function renderWizard() {
  $('#wizard-body').innerHTML = WZ.map(([k, q, opts]) => `<div class="wz-q"><p>${esc(q)}</p>${opts.map(([v, l]) => `<label><input type="radio" name="wz-${k}" value="${v}"> ${esc(l)}</label>`).join('')}</div>`).join('') + '<div class="wz-out" id="wz-out">Answer the questions to get a recommendation.</div>';
}
$('#wizard-body')?.addEventListener('change', () => {
  const a = Object.fromEntries(WZ.map(([k]) => [k, $(`input[name="wz-${k}"]:checked`)?.value]));
  let id, why;
  if (a.linux === 'yes') { id = 'rpi4'; why = 'Cameras and vision need a real computer. Pair it with an Arduino for motors.'; }
  else if (a.wifi === 'yes') { id = a.pins === 'few' && a.level !== 'pro' ? 'nodemcu' : 'esp32'; why = id === 'esp32' ? 'Wi-Fi and Bluetooth, two fast cores and plenty of pins.' : 'The cheapest way to get Wi-Fi for a small gadget.'; }
  else if (a.pins === 'lots') { id = 'mega'; why = '54 digital pins and 4 serial ports, with the forgiving 5 V Arduino logic.'; }
  else if (a.level === 'pro') { id = a.pins === 'few' ? 'pico' : 'bluepill'; why = id === 'pico' ? 'Fast, cheap and wonderfully documented, with PIO for custom tricks.' : '32-bit speed and motor-control timers for the price of a clone.'; }
  else if (a.level === 'new' || !a.level) { id = 'uno'; why = 'The friendliest start: sturdy 5 V pins, endless tutorials, no soldering.'; }
  else { id = a.pins === 'few' ? 'nano' : 'pico'; why = id === 'nano' ? 'Uno power in a breadboard-friendly strip.' : 'Two cores, MicroPython and drag-and-drop uploads.'; }
  const b = byId(id);
  $('#wz-out').innerHTML = `Try the <b>${esc(b.name)}</b>. ${esc(why)} <button class="btn small" type="button" data-wz="${id}">Show me ${icon('arrow')}</button>`;
});
$('#wizard-body')?.addEventListener('click', (e) => { const b = e.target.closest('[data-wz]'); if (b) chooseFromTable(b.dataset.wz); });

// ───────────────────────── workbench (lazy) ─────────────────────────
async function ensureLab() {
  if (state.lab) return state.lab;
  state.labLoading ||= import('./lab/lab.js').then(({ Lab }) => {
    state.lab = new Lab($('#lab-root'), { boards: BOARDS, beep, initial: state.def.id, highlight: highlightCode });
    return state.lab;
  });
  return state.labLoading;
}
async function openOnBench(id) {
  $('#lab').scrollIntoView({ behavior: motion() ? 'smooth' : 'auto' });
  const lab = await ensureLab(); lab.sandbox(id); track({ k: 'bench-open', b: id });
}
new IntersectionObserver((ents, io) => { if (ents.some((e) => e.isIntersecting)) { ensureLab(); io.disconnect(); } }, { rootMargin: '300px' }).observe($('#lab'));

// ───────────────────────── nav, theme, progress ─────────────────────────
const navLinks = $$('.nav a');
new IntersectionObserver((ents) => {
  for (const e of ents) if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('on', a.dataset.sec === e.target.id));
}, { rootMargin: '-45% 0px -50% 0px' }).observe($('#sec-stage'));
['lab', 'lesson', 'quiz', 'compare'].forEach((id) => {
  new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('on', a.dataset.sec === id)); }, { rootMargin: '-45% 0px -50% 0px' }).observe(document.getElementById(id));
});
navLinks.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); document.getElementById(a.dataset.sec)?.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto' }); }));
$('.brand').addEventListener('click', (e) => { e.preventDefault(); stageEl.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto' }); });

function applyThemeIcon() {
  const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const b = $('#theme-btn'); b.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon'); b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  $('meta[name=theme-color]').setAttribute('content', dark ? '#0b1a2a' : '#ffffff');
  viewer.ground.material.opacity = dark ? .4 : .18;
}
if (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';
$('#theme-btn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next; set('rl.theme', next); applyThemeIcon(); state.lab?.onTheme?.();
});

function updateBests() {
  const p = progress(), id = state.def?.id;
  $('#quiz-best').textContent = p.quiz[id] != null ? `your best: ${p.quiz[id]} / 6` : '';
  $('#asm-best').textContent = p.asm[id] ? `your best: ${p.asm[id]} s` : '';
  const m = Object.keys(p.missions).length, q = Object.keys(p.quiz).length, a = Object.keys(p.asm).length;
  const badges = [];
  if (m >= 1) badges.push('🔌 First circuit'); if (m >= 5) badges.push('🛠 Bench regular'); if (m >= 11) badges.push('🤖 Robot builder');
  if (Object.values(p.quiz).some((s) => s >= 6)) badges.push('🎯 Sharp eye'); if (q >= 8) badges.push('🧭 Board scholar'); if (a >= 1) badges.push('🔥 Solderer');
  $('#badges').textContent = (m || q || a) ? `Your progress: ${m} mission${m === 1 ? '' : 's'} done · ${q} board quiz${q === 1 ? '' : 'zes'} · ${a} board${a === 1 ? '' : 's'} assembled ${badges.length ? '· ' + badges.join('  ') : ''}` : '';
}
window.addEventListener('rl:progress', updateBests);

// ───────────────────────── boot ─────────────────────────
buildPicker(); renderTable(); renderWizard(); applyThemeIcon();
const startId = params.get('board') || (byId(location.hash.slice(1)) ? location.hash.slice(1) : 'uno');
loadBoard(startId, { view: params.get('view') || '34', animate: true });
if (params.get('part')) setTimeout(() => selectPart(params.get('part')), 1100);
const go = params.get('go');
if (go === 'quiz') setTimeout(() => quiz.start(), 1100);
if (go === 'assemble') setTimeout(() => asm.start(), 1100);
if (go === 'lab') setTimeout(() => openOnBench(state.def.id), 300);
window.RoboticsLab = { state, viewer, loadBoard, quiz, asm, ensureLab };       // handy for debugging
