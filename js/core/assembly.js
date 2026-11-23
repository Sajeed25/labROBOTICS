// Assembly mode: the board is taken apart into a kit laid out on a tray; the learner picks every part,
// drops it on its footprint and solders it (press and hold). Parts never change parents: they are moved
// in board space and put back exactly on stop(). Everything created here lives in one `fx` group.
import * as THREE from 'three';
import { T, glowSprite } from './builder.js';

const SOLDER_MS = 900;

export class Assembly {
  constructor(viewer, opts) { this.v = viewer; this.o = opts; this.active = false; }

  start() {
    const board = this.o.getBoard(); if (!board || this.active) return;
    this.o.onStart?.(); this.active = true; this.board = board;
    this.v.tweens = this.v.tweens.filter((t) => t.camera);           // finish any intro animation first
    board.rotation.y = 0; if (this.v.restY != null) board.position.y = this.v.restY; board.updateMatrixWorld(true);
    this.groundY = -board.position.y;
    const inv = board.matrixWorld.clone().invert();
    const def = board.userData.def;
    this.pieces = [];
    for (const [id, objs] of board.userData.parts) {
      if (id === 'pcb') continue;
      const bb = new THREE.Box3(); objs.forEach((o) => bb.expandByObject(o)); bb.applyMatrix4(inv);
      this.pieces.push({ id, objs, home: objs.map((o) => o.position.clone()), bb, c: bb.getCenter(new THREE.Vector3()), s: bb.getSize(new THREE.Vector3()), off: new THREE.Vector3(), placed: false, soldered: false, bottom: bb.max.y < T * .5 });
    }
    // tray layout in front of the board
    const n = this.pieces.length, cols = Math.min(n, def.pcb.w > 60 ? 7 : 5), rows = Math.ceil(n / cols);
    const cell = Math.min(def.pcb.w > 60 ? 24 : 18, Math.max(14, ...this.pieces.map((p) => Math.max(p.s.x, p.s.z) * .6 + 4)));
    const tz = def.pcb.d / 2 + 12 + cell / 2;
    this.fx = new THREE.Group(); this.fx.userData.fx = true; board.add(this.fx);
    const trayW = cols * cell + 8, trayD = rows * cell + 8;
    const tray = new THREE.Mesh(new THREE.BoxGeometry(trayW, 1.2, trayD), new THREE.MeshStandardMaterial({ color: '#c3d3e0', roughness: .85 }));
    tray.position.set(0, this.groundY + .6, tz + (rows - 1) * cell / 2); tray.receiveShadow = true; this.fx.add(tray);
    const shuffled = this.pieces.slice().sort(() => Math.random() - .5);
    shuffled.forEach((p, i) => {
      const cx = (i % cols - (cols - 1) / 2) * cell, cz = tz + Math.floor(i / cols) * cell;
      const lift = this.groundY + 1.2 - p.bb.min.y;
      p.tray = new THREE.Vector3(cx - p.c.x, lift, cz - p.c.z);
      this.animateTo(p, p.tray, 500 + i * 40);
      // footprint on the bare board
      const fpGeo = new THREE.PlaneGeometry(Math.max(2, p.s.x), Math.max(2, p.s.z));
      const fp = new THREE.Mesh(fpGeo, new THREE.MeshBasicMaterial({ color: '#1bb4e3', transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide }));
      fp.rotation.x = -Math.PI / 2; fp.position.set(p.c.x, p.bottom ? -.06 : T + .06, p.c.z);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(fpGeo), new THREE.LineBasicMaterial({ color: '#1bb4e3' })); fp.add(edge);
      fp.userData.piece = p; p.fp = fp; this.fx.add(fp);
    });
    this.iron = this.makeIron(); this.iron.visible = false; this.fx.add(this.iron);
    this.smoke = glowSprite('#e8e4da', 10); this.smoke.visible = false; this.fx.add(this.smoke);
    this.held = null; this.solder = null; this.t0 = performance.now(); this.done = false;
    // camera: see board and tray
    const span = tz + rows * cell + def.pcb.d / 2;
    const target = new THREE.Vector3(0, 0, (-def.pcb.d / 2 + tz + rows * cell) / 2 - 4); board.localToWorld(target);
    const dist = Math.max(def.pcb.w * 1.15, trayW, span) * 2.5 * Math.max(1, 1.2 / this.v.camera.aspect);
    this.v.flyTo(target.clone().add(new THREE.Vector3(0, dist * .93, dist * .38)), target, 900);
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.render('Pick a part from the tray, then click its footprint on the board.');
  }

  makeIron() {
    const g = new THREE.Group();
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.6, 6, 12), new THREE.MeshStandardMaterial({ color: '#c0c3c6', metalness: .7, roughness: .3 }));
    tip.rotation.x = Math.PI; tip.position.y = 3;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 14, 12), new THREE.MeshStandardMaterial({ color: '#9a9ea3', metalness: .7, roughness: .35 })); shaft.position.y = 13;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2, 24, 16), new THREE.MeshStandardMaterial({ color: '#1f6fd6', roughness: .6 })); handle.position.y = 32;
    g.add(tip, shaft, handle); g.rotation.z = .5; return g;
  }

  animateTo(p, off, dur = 450) {
    const from = p.off.clone();
    this.v.tween(dur, (k) => { p.off.lerpVectors(from, off, k); this.apply(p); }, null);
  }
  apply(p) { p.objs.forEach((o, i) => o.position.copy(p.home[i]).add(p.off)); }

  ray(e, y) {
    const local = this.board.position.y + y;
    this.plane.constant = -local;
    const rect = this.v.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.v.raycaster.setFromCamera(ndc, this.v.camera);
    const pt = new THREE.Vector3(); return this.v.raycaster.ray.intersectPlane(this.plane, pt) ? this.board.worldToLocal(pt) : null;
  }
  pieceAt(e) {
    const objs = this.pieces.flatMap((p) => p.objs);
    const hits = this.v.pick(e, objs);
    for (const h of hits) { let o = h.object; while (o && !objs.includes(o)) o = o.parent; const p = this.pieces.find((q) => q.objs.includes(o)); if (p) return p; }
    return null;
  }

  pointerDown(e) {
    if (!this.active || this.held || this.done) return;
    const p = this.pieceAt(e);
    if (p && p.placed && !p.soldered) {
      this.v.controls.enabled = false;
      this.solder = { p, t0: performance.now(), last: 0 };
      this.iron.visible = true; this.smoke.visible = true;
      this.iron.position.set(p.c.x + p.s.x / 2, p.bb.max.y, p.c.z);
      this.smoke.position.set(p.c.x + p.s.x / 2, p.bb.max.y + 4, p.c.z);
    }
  }
  pointerUp() {
    this.v.controls.enabled = true;
    if (this.solder && !this.solder.p.soldered) this.render('Keep holding until the joint shines — about a second.');
    this.solder = null; if (this.iron) { this.iron.visible = false; this.smoke.visible = false; }
  }
  pointerMove(e) {
    if (!this.held) { const p = this.active && this.pieceAt(e); this.v.renderer.domElement.style.cursor = p ? (p.placed && !p.soldered ? 'crosshair' : p.placed ? 'default' : 'grab') : 'default'; return; }
    const pt = this.ray(e, T + 6); if (!pt) return;
    const p = this.held; p.off.set(pt.x - p.c.x, T + 6 - p.bb.min.y + .5, pt.z - p.c.z); this.apply(p);
  }
  click(e) {
    if (!this.active || this.done) return;
    if (!this.held) {
      const p = this.pieceAt(e);
      if (!p) return;
      if (p.placed) { if (!p.soldered) this.render(`Press and hold on the ${this.o.partName(p.id)} to solder it.`); return; }
      this.held = p; p.fp.material.opacity = .45; this.o.beep(520, .05);
      this.render(`Holding: ${this.o.partName(p.id)}. Click its footprint on the board.`);
      this.pointerMove(e); return;
    }
    const p = this.held; const pt = this.ray(e, T);
    const { w, d } = this.board.userData.def.pcb;
    const onBoard = pt && Math.abs(pt.x) < w / 2 + 4 && Math.abs(pt.z) < d / 2 + 4;
    p.fp.material.opacity = .22; this.held = null;
    if (onBoard) {
      const dist = Math.hypot(pt.x - p.c.x, pt.z - p.c.z);
      const tol = Math.max(5, Math.min(p.s.x, p.s.z) * .6 + 2);
      const inside = Math.abs(pt.x - p.c.x) < p.s.x / 2 + 2 && Math.abs(pt.z - p.c.z) < p.s.z / 2 + 2;
      if (dist < tol || inside) {
        p.placed = true; this.animateTo(p, new THREE.Vector3(), 260); p.fp.visible = false; this.o.beep(760, .08);
        this.render(`Placed. Now press and hold on the ${this.o.partName(p.id)} to solder it.`); return;
      }
      const other = this.pieces.find((q) => q !== p && !q.placed && Math.abs(pt.x - q.c.x) < q.s.x / 2 + 1 && Math.abs(pt.z - q.c.z) < q.s.z / 2 + 1);
      this.render(other ? `That footprint belongs to the ${this.o.partName(other.id)}. Try another spot.` : 'Not there — look for the outline that matches its shape.', true);
      this.o.beep(200, .12);
    }
    this.animateTo(p, p.tray, 300);
  }

  frame(dt, now) {
    if (!this.active) return;
    const s = this.solder;
    if (s && !s.p.soldered) {
      const k = Math.min(1, (now - s.t0) / SOLDER_MS);
      this.iron.position.y = s.p.bb.max.y + Math.sin(now / 40) * .3;
      this.smoke.position.y += dt * 8; if (this.smoke.position.y > s.p.bb.max.y + 14) this.smoke.position.y = s.p.bb.max.y + 3;
      this.smoke.material.opacity = .5 * (1 - (this.smoke.position.y - s.p.bb.max.y) / 14);
      if (now - s.last > 110) { s.last = now; this.o.beep(1800 + Math.random() * 900, .04, 'square', .012); }
      const bar = this.o.bar.querySelector('.progress i'); if (bar) bar.style.width = `${k * 100}%`;
      if (k >= 1) {
        s.p.soldered = true; this.solder = null; this.iron.visible = false; this.smoke.visible = false; this.o.beep(1046, .12);
        this.v.controls.enabled = true;
        const left = this.pieces.filter((p) => !p.soldered).length;
        if (!left) this.finish(); else this.render(`Soldered! ${left} part${left === 1 ? '' : 's'} to go.`, false, true);
      }
    }
    const secs = Math.round((now - this.t0) / 1000); const tEl = this.o.bar.querySelector('[data-time]'); if (tEl && !this.done) tEl.textContent = `${secs} s`;
  }

  render(msg, bad = false, good = false) {
    const placed = this.pieces.filter((p) => p.placed).length, sold = this.pieces.filter((p) => p.soldered).length, n = this.pieces.length;
    const bar = this.o.bar; bar.hidden = false;
    bar.innerHTML = `<div class="bar-top"><span>Assembly · placed ${placed}/${n} · soldered ${sold}/${n}</span><span data-time>0 s</span></div>
      <div class="progress"><i style="width:0%"></i></div>
      <p class="feedback ${bad ? 'bad' : good ? 'good' : ''}">${msg}</p>
      <div class="bar-actions"><button class="btn small" type="button" data-a="stop">Stop and restore</button></div>`;
    bar.querySelector('[data-a="stop"]').onclick = () => this.stop();
  }

  finish() {
    this.done = true; const secs = Math.round((performance.now() - this.t0) / 1000);
    this.o.onDone?.(secs);
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.o.beep(f, .15), i * 120));
    this.o.bar.innerHTML = `<div class="bar-top"><span>Assembly complete</span><span>${secs} s</span></div>
      <p class="q" style="font-family:var(--serif);font-size:19px;margin:6px 0">The board is whole again — ${this.pieces.length} parts in ${secs} seconds.</p>
      <div class="bar-actions"><button class="btn small primary" type="button" data-a="again">Take it apart again</button><button class="btn small" type="button" data-a="stop">Close</button></div>`;
    this.o.bar.querySelector('[data-a="again"]').onclick = () => { this.stop(); this.start(); };
    this.o.bar.querySelector('[data-a="stop"]').onclick = () => this.stop();
  }

  stop() {
    if (!this.active) return;
    this.active = false; this.held = null; this.solder = null; this.v.controls.enabled = true;
    this.v.tweens = this.v.tweens.filter((t) => t.camera);
    for (const p of this.pieces) { p.off.set(0, 0, 0); this.apply(p); }
    this.fx.parent?.remove(this.fx);
    this.fx.traverse((m) => { m.geometry?.dispose(); if (m.material) { m.material.map?.dispose(); m.material.dispose(); } });
    this.o.bar.hidden = true; this.v.renderer.domElement.style.cursor = '';
    this.o.onStop?.();
  }
}
