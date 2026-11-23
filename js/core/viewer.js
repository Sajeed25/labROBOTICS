// Viewer: one Three.js scene with a studio look, a board, camera flights, picking and label projection.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBoard } from './builder.js';

const ENV = new WeakMap();
export function studioEnv(renderer) {
  if (ENV.has(renderer)) return ENV.get(renderer);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(new RoomEnvironment(), .04).texture; pm.dispose();
  ENV.set(renderer, tex); return tex;
}
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const VIEWS = {
  '34': { dir: [0.55, 0.75, 1.0] },
  top: { dir: [0.001, 1, 0.02] },
  bottom: { dir: [0.001, -1, 0.15] },
  front: { dir: [0, 0.22, 1] },
};

export class Viewer {
  constructor(el, { motion = () => true, offset = null } = {}) {
    this.el = el; this.motion = motion; this.frameCbs = []; this.tweens = []; this.offset = offset;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(r.domElement);
    this.scene = new THREE.Scene(); this.scene.environment = studioEnv(r);
    this.camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
    this.camera.position.set(80, 110, 160);
    const key = new THREE.DirectionalLight('#fff6e8', 1.6); key.position.set(60, 140, 80); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 10, far: 400 }); key.shadow.radius = 6; key.shadow.bias = -.0004;
    this.scene.add(key, new THREE.HemisphereLight('#fffaf0', '#8a7a60', .35));
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.ShadowMaterial({ opacity: .18 }));
    this.ground.rotation.x = -Math.PI / 2; this.ground.receiveShadow = true; this.scene.add(this.ground);
    this.pivot = new THREE.Group(); this.scene.add(this.pivot);

    const c = this.controls = new OrbitControls(this.camera, r.domElement);
    c.enableDamping = true; c.dampingFactor = .08; c.enableZoom = false; c.enablePan = false;
    c.minDistance = 40; c.maxDistance = 600; c.rotateSpeed = .8; c.autoRotateSpeed = 1.2;
    c.addEventListener('start', () => { this.interacting = true; this.stopTweens(); });
    c.addEventListener('end', () => { this.interacting = false; });
    r.domElement.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    this.raycaster = new THREE.Raycaster(); this.ndc = new THREE.Vector2();
    this.visible = true; this.dirty = true;
    new ResizeObserver(() => this.resize()).observe(el); this.resize();
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(el);
    document.addEventListener('visibilitychange', () => { this.hidden = document.hidden; });
    this.clock = new THREE.Clock();
    r.setAnimationLoop(() => this.tick());
  }
  onWheel(e) {
    if (!e.ctrlKey && !e.metaKey && !this.wheelAlways) { this.onPlainWheel?.(); return; }       // plain wheel scrolls the page
    e.preventDefault();
    const k = Math.exp(e.deltaY * .0025);
    const off = this.camera.position.clone().sub(this.controls.target).multiplyScalar(k);
    const len = THREE.MathUtils.clamp(off.length(), this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(off.setLength(len));
  }
  resize() {
    const w = this.el.clientWidth || 1, h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
    // shift the picture so the board sits right of the title on wide screens, above the picker on narrow ones
    if (this.offset) { const [ox, oy] = this.offset(w, h); if (ox || oy) this.camera.setViewOffset(w, h, ox, oy, w, h); else this.camera.clearViewOffset(); }
    this.camera.updateProjectionMatrix();
    this.w = w; this.h = h;
  }
  tick() {
    if (!this.visible || this.hidden) return;
    const dt = Math.min(.05, this.clock.getDelta()); const now = performance.now();
    this.tweens = this.tweens.filter((t) => { const k = Math.min(1, (now - t.t0) / t.dur); t.step(ease(k)); if (k >= 1) t.done?.(); return k < 1; });
    this.controls.update();
    for (const cb of this.frameCbs) cb(dt, now);
    this.renderer.render(this.scene, this.camera);
  }
  onFrame(cb) { this.frameCbs.push(cb); }
  stopTweens() { this.tweens = this.tweens.filter(t => !t.camera); }
  tween(dur, step, done, camera = false) {
    if (!this.motion()) { step(1); done?.(); return; }
    this.tweens.push({ t0: performance.now(), dur, step, done, camera });
  }

  /** Swap in a board (Group from buildBoard). */
  setBoard(group, { animate = true } = {}) {
    const old = this.board;
    if (old) { this.pivot.remove(old); disposeDeep(old); }
    this.board = group; this.pivot.add(group);
    const bb = new THREE.Box3().setFromObject(group);
    group.position.y = -bb.min.y; this.restY = group.position.y;      // rest on the ground
    this.ground.position.y = 0;
    this.size = bb.getSize(new THREE.Vector3());
    this.radius = Math.max(this.size.x, this.size.z) * .62 + 6;
    this.controls.minDistance = this.radius * .7; this.controls.maxDistance = this.radius * 8;
    if (animate && this.motion()) {
      group.position.y += 30; group.rotation.y = -.6; const y0 = group.position.y;
      this.tween(650, (k) => { group.position.y = y0 - 30 * k; group.rotation.y = -.6 * (1 - k); });
    }
  }
  /** World position of a board-local point. */
  toWorld(v) { return this.board ? new THREE.Vector3(v.x, v.y + (this.restY ?? this.board.position.y), v.z) : v.clone(); }   // board rests unrotated
  view(name, dur = 900) {
    const v = VIEWS[name] || VIEWS['34'];
    const target = new THREE.Vector3(0, (this.size?.y || 10) * .35, 0);
    const fit = Math.max(1, 1.25 / Math.max(.4, this.camera.aspect));       // keep wide boards inside tall viewports
    const dist = this.radius * (name === 'top' || name === 'bottom' ? 3.3 : 3.7) * fit * (this.w < 860 ? 1.15 : 1);
    const pos = new THREE.Vector3(...v.dir).normalize().multiplyScalar(dist).add(target);
    this.flyTo(pos, target, dur);
  }
  flyTo(pos, target, dur = 900) {
    this.stopTweens();
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone();
    // keep the camera's up sensible when passing under the board
    this.tween(dur, (k) => { this.camera.position.lerpVectors(p0, pos, k); this.controls.target.lerpVectors(t0, target, k); }, null, true);
  }
  /** Fly to a point on the board (board-local), keeping the current viewing direction mostly. */
  focus(localPoint, distMul = 1.4) {
    const target = this.toWorld(localPoint);
    let dir = this.camera.position.clone().sub(this.controls.target).normalize();
    if (localPoint.y < 0 && dir.y > 0) dir.y = -Math.abs(dir.y) - .4;            // underside parts: look from below
    if (localPoint.y >= 0 && dir.y < .2) dir.y = .6;
    dir.normalize();
    this.flyTo(target.clone().add(dir.multiplyScalar(this.radius * distMul)), target, 800);
  }
  pick(ev, objects) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }
  /** Screen position of a world point; facing = whether it is on the camera's side of the board. */
  project(world) {
    const v = world.clone().project(this.camera);
    return { x: (v.x + 1) / 2 * this.w, y: (1 - v.y) / 2 * this.h, behind: v.z > 1 };
  }
}

export function disposeDeep(o) {
  o.traverse((m) => {
    if (m.geometry) m.geometry.dispose();
    const mats = m.material ? [].concat(m.material) : [];
    for (const mt of mats) { if (mt.map && mt.map.isCanvasTexture) mt.map.dispose(); if (!mt.userData?.shared) mt.dispose?.(); }
  });
}

// ───────────── thumbnails (rendered once per board type, cached as data URLs) ─────────────
let thumbR = null; const THUMBS = new Map();
export function boardThumb(def, w = 160, h = 120) { return groupThumb(def.id, () => buildBoard(def), w, h); }
export function groupThumb(key, build, w = 160, h = 120) {
  if (THUMBS.has(key)) return THUMBS.get(key);
  if (!thumbR) {
    thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    thumbR.outputColorSpace = THREE.SRGBColorSpace; thumbR.toneMapping = THREE.ACESFilmicToneMapping;
  }
  thumbR.setSize(w, h);
  const scene = new THREE.Scene(); scene.environment = studioEnv(thumbR);
  const light = new THREE.DirectionalLight('#fff', 1.4); light.position.set(50, 100, 60); scene.add(light, new THREE.AmbientLight('#fff', .3));
  const g = build(); scene.add(g);
  const bb = new THREE.Box3().setFromObject(g); const s = bb.getSize(new THREE.Vector3()); const c = bb.getCenter(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(30, w / h, 1, 3000);
  const dist = Math.max(s.x, s.z) * 1.65 + 20;
  cam.position.set(c.x + dist * .35, c.y + dist * .9, c.z + dist * .6); cam.lookAt(c);
  thumbR.render(scene, cam);
  const url = thumbR.domElement.toDataURL('image/png');
  disposeDeep(g); THUMBS.set(key, url); return url;
}
