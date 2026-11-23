// Workbench modules: small breakout boards, each drawn in code with named header pins and a visual state.
//   build() → { group, pins: [{ name, role, local: Vector3 }], update(state, t) }
// Pin roles: 'vcc' (needs power), 'gnd', 'sig' (signal), 'src' (a power source, e.g. battery +), 'motor', 'lv'/'hv' (level shifter supplies).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, glowSprite, PITCH } from '../core/builder.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .55, ...o });
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; return m; };
const rbox = (w, h, d, r, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mat); m.position.set(x, y + h / 2, z); m.castShadow = true; return m; };
const cyl = (r, h, mat, x = 0, y = 0, z = 0, seg = 24) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y + h / 2, z); m.castShadow = true; return m; };
const PCB_H = 1.6;

function silk(w, d, text, color = '#f3f1ea', size = 34) {
  const c = document.createElement('canvas'); c.width = 256; c.height = Math.max(32, Math.round(256 * d / w));
  const g = c.getContext('2d'); g.fillStyle = color; g.font = `700 ${size}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
  String(text).split('\n').forEach((t, i, a) => g.fillText(t, 128, c.height / 2 + (i - (a.length - 1) / 2) * size * 1.1));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; return m;
}

/** A breakout PCB with a male header row along its front edge. */
function breakout(w, d, color, pinNames, { label = '', labelZ = 0, pinZ = null, pinX0 = null } = {}) {
  const g = new THREE.Group();
  g.add(box(w, PCB_H, d, std(color, { roughness: .45 })));
  const n = pinNames.length, z = pinZ ?? d / 2 - 2, x0 = pinX0 ?? -(n - 1) * PITCH / 2;
  g.add(box(n * PITCH, 2.5, PITCH, M.plastic, x0 + (n - 1) * PITCH / 2, PCB_H, z));
  const pins = pinNames.map((nm, i) => {
    const x = x0 + i * PITCH; g.add(box(.64, 8, .64, M.gold, x, PCB_H + .5, z));
    return { name: nm, local: new THREE.Vector3(x, PCB_H + 8.5, z) };
  });
  // pin names
  const lab = silk(n * PITCH + 2, 3.2, pinNames.map((p) => p.padEnd(1)).join('  '), '#f3f1ea', 22);
  lab.position.set(x0 + (n - 1) * PITCH / 2, PCB_H + .02, z - 3.2); g.add(lab);
  if (label) { const l = silk(w * .9, Math.min(8, d * .35), label, '#f3f1ea', 40); l.position.set(0, PCB_H + .02, labelZ); g.add(l); }
  return { g, pins };
}

const ROLES = { VCC: 'vcc', GND: 'gnd', 'BAT+': 'src', 'BAT-': 'gnd', 'M+': 'motor', 'M-': 'motor', VM: 'vcc', LV: 'lv', HV: 'hv', '5V': 'vcc' };
const role = (n) => ROLES[n] || 'sig';

export const MODULES = {
  led: {
    name: 'LED (with resistor)', desc: 'A 5 mm red LED with its resistor already on the board.', icon: '💡',
    build() {
      const { g, pins } = breakout(14, 12, '#1f5fae', ['SIG', 'GND'], { label: '220Ω' , labelZ: -3.5 });
      const lens = new THREE.MeshStandardMaterial({ color: '#e8473b', emissive: new THREE.Color('#ff3a20'), emissiveIntensity: 0, roughness: .2, transparent: true, opacity: .9 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), lens); dome.position.set(0, PCB_H + 5, -1.5);
      const body = cyl(2.5, 5, lens, 0, PCB_H, -1.5); g.add(body, dome);
      const glow = glowSprite('#ff4a2a', 26); glow.position.set(0, PCB_H + 6, -1.5); glow.material.opacity = 0; g.add(glow);
      return { group: g, pins, update(s) { const b = s.b || 0; lens.emissiveIntensity = b * 2.2; glow.material.opacity = b * .9; } };
    },
  },
  rgb: {
    name: 'RGB LED', desc: 'Three LEDs (red, green, blue) in one dome, common ground.', icon: '🌈',
    build() {
      const { g, pins } = breakout(16, 12, '#1d1d1f', ['R', 'G', 'B', 'GND']);
      const lens = new THREE.MeshStandardMaterial({ color: '#f2f0ea', emissive: new THREE.Color('#000'), emissiveIntensity: 1, roughness: .25, transparent: true, opacity: .92 });
      g.add(cyl(2.5, 5, lens, 0, PCB_H, -1.5)); const dome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), lens); dome.position.set(0, PCB_H + 5, -1.5); g.add(dome);
      const glow = glowSprite('#ffffff', 26); glow.position.set(0, PCB_H + 6, -1.5); glow.material.opacity = 0; g.add(glow);
      return { group: g, pins, update(s) { const [r = 0, gg = 0, b = 0] = s.rgb || []; lens.emissive.setRGB(r, gg, b); glow.material.color.setRGB(r || .01, gg || .01, b || .01); glow.material.opacity = Math.max(r, gg, b) * .9; } };
    },
  },
  button: {
    name: 'Push button', desc: 'A tactile switch: SIG is joined to GND while pressed. Use INPUT_PULLUP.', icon: '🔘',
    build() {
      const { g, pins } = breakout(14, 14, '#1d1d1f', ['SIG', 'GND']);
      g.add(box(6, 3.4, 6, M.metal, 0, PCB_H, -2));
      const cap = cyl(1.8, 2, std('#d3302b'), 0, PCB_H + 3.4, -2); g.add(cap); const y0 = cap.position.y;
      return { group: g, pins, update(s) { cap.position.y = y0 - (s.pressed ? 1.1 : 0); }, input: 'button' };
    },
  },
  pot: {
    name: 'Potentiometer', desc: 'A knob: SIG gives a voltage between GND and VCC depending on how far it is turned.', icon: '🎛️',
    build() {
      const { g, pins } = breakout(18, 18, '#1f5fae', ['VCC', 'SIG', 'GND']);
      g.add(box(10, 6, 10, std('#2a62c4'), 0, PCB_H, -2.5));
      const knob = new THREE.Group(); knob.position.set(0, PCB_H + 6, -2.5);
      knob.add(cyl(3.2, 9, std('#ecebe6', { roughness: .4 }), 0, 0, 0, 20)); knob.add(box(.8, .4, 3, std('#1d1b16'), 0, 9, -1.4)); g.add(knob);
      return { group: g, pins, update(s) { knob.rotation.y = -((s.value ?? .5) - .5) * Math.PI * 1.5; }, input: 'pot' };
    },
  },
  buzzer: {
    name: 'Piezo buzzer', desc: 'Makes a tone when its SIG pin is toggled — tone(pin, freq).', icon: '🔊',
    build() {
      const { g, pins } = breakout(14, 14, '#1d1d1f', ['SIG', 'GND']);
      const b = cyl(5.5, 7, std('#141416', { roughness: .35 }), 0, PCB_H, -2); g.add(b);
      const hole = cyl(1, .2, std('#000'), 0, PCB_H + 7, -2); g.add(hole);
      return { group: g, pins, update(s, t) { b.scale.setScalar(s.freq ? 1 + Math.sin(t * 90) * .012 : 1); } };
    },
  },
  servo: {
    name: 'Hobby servo (SG90)', desc: 'Turns its horn to an angle from 0° to 180° set by the SIG pulse.', icon: '⚙️',
    build() {
      const g = new THREE.Group();
      g.add(box(23, 22, 12.5, std('#2f62b8', { roughness: .5 }), 0, 0, -6));
      g.add(box(32, 2.4, 12.5, std('#2f62b8'), 0, 15.5, -6));
      g.add(cyl(6, 4, std('#2f62b8'), -5.5, 22, -6));
      const horn = new THREE.Group(); horn.position.set(-5.5, 26, -6);
      horn.add(cyl(3, 2.2, std('#f2f0ea'))); horn.add(box(3.6, 1.6, 18, std('#f2f0ea'), 0, .3, -7)); g.add(horn);
      // lead with a 3-pin connector on a little pad
      const pad = breakout(10, 6, '#3a3a3c', ['SIG', 'VCC', 'GND'], { pinZ: 0 }); pad.g.position.set(0, 0, 10); g.add(pad.g);
      pad.pins.forEach((p) => p.local.add(pad.g.position));
      const lead = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(11.5, 6, -6), new THREE.Vector3(16, 3, 0), new THREE.Vector3(6, 2, 8)]), 20, .9, 8), std('#c46a1d')); g.add(lead);
      return { group: g, pins: pad.pins, update(s) { horn.rotation.y = THREE.MathUtils.degToRad((s.angle ?? 90) - 90); } };
    },
  },
  motor: {
    name: 'DC gear motor + wheel', desc: 'A yellow TT motor. Needs far more current than a pin — drive it through the motor driver.', icon: '🛞',
    build() {
      const g = new THREE.Group();
      g.add(rbox(22, 22, 37, 2, std('#f1c21b', { roughness: .5 }), 0, 0, -8));
      g.add(cyl(9, 12, std('#cfd2d6', { metalness: .6, roughness: .3 }), 0, 0, 16).rotateX(0));
      const wheel = new THREE.Group(); wheel.position.set(17, 11, -8);
      const tire = new THREE.Mesh(new THREE.TorusGeometry(26, 6, 14, 40), std('#1b1b1d', { roughness: .9 })); tire.rotation.y = Math.PI / 2;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(21, 21, 8, 32), std('#f1c21b')); hub.rotation.z = Math.PI / 2;
      wheel.add(tire, hub); for (let i = 0; i < 6; i++) { const sp = box(4, 2, 30, std('#e0b012')); sp.position.set(4.2, 0, 0); sp.rotation.x = i * Math.PI / 3; wheel.add(sp); }
      g.add(wheel); wheel.scale.setScalar(.62);
      const pad = breakout(8, 6, '#3a3a3c', ['M+', 'M-'], { pinZ: 0 }); pad.g.position.set(-15, 0, 12); g.add(pad.g); pad.pins.forEach((p) => p.local.add(pad.g.position));
      return { group: g, pins: pad.pins, update(s, t, dt) { wheel.rotation.x += (s.speed || 0) * dt * 14; } };
    },
  },
  'motor-driver': {
    name: 'Motor driver (L298N)', desc: 'Lets a 5 V signal switch a big motor current. IN1/IN2 set direction, ENA sets speed (PWM).', icon: '🔌',
    build() {
      const { g, pins } = breakout(43, 43, '#c8302a', ['ENA', 'IN1', 'IN2', 'VCC', 'GND', 'VM'], { label: 'L298N', labelZ: 4 });
      const hs = new THREE.Group(); hs.position.set(0, PCB_H, -9);
      for (let i = 0; i < 9; i++) hs.add(box(1.2, 22, 15, std('#1b1b1d', { metalness: .4 }), -9 + i * 2.25, 0, 0)); g.add(hs);
      g.add(box(15, 9, 4, std('#2b2b2d'), 0, PCB_H, 10.5));
      const out = breakout(10, 6, '#c8302a', ['OUT1', 'OUT2'], { pinZ: 0 }); out.g.position.set(-25, 0, -8); out.g.rotation.y = Math.PI / 2; g.add(out.g);
      out.pins.forEach((p) => { p.local.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2).add(out.g.position); });
      const led = new THREE.MeshStandardMaterial({ color: '#ffe3dc', emissive: new THREE.Color('#ff2a10'), emissiveIntensity: 0 }); g.add(box(1.6, .6, .8, led, 14, PCB_H, 6));
      return { group: g, pins: [...pins, ...out.pins], update(s) { led.emissiveIntensity = s.powered ? 2 : 0; } };
    },
  },
  battery: {
    name: 'Battery pack (4 × AA, 6 V)', desc: 'A separate 6 V supply for motors. Its minus must join the board’s GND.', icon: '🔋',
    build() {
      const g = new THREE.Group(); g.add(box(62, 15, 58, std('#1b1b1d'), 0, 0, -6));
      for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 50, 20), std(i % 2 ? '#2d6cdf' : '#1f4fb0', { metalness: .3 })); c.rotation.x = Math.PI / 2; c.position.set(-22.5 + i * 15, 14, -6); g.add(c); }
      const pad = breakout(10, 6, '#3a3a3c', ['BAT+', 'BAT-'], { pinZ: 0 }); pad.g.position.set(24, 0, 29); g.add(pad.g); pad.pins.forEach((p) => p.local.add(pad.g.position));
      return { group: g, pins: pad.pins, update() {} };
    },
  },
  ultrasonic: {
    name: 'Ultrasonic sensor (HC-SR04)', desc: 'Sends a 40 kHz ping on TRIG and times the echo on ECHO: distance from 2 to 400 cm. Runs on 5 V.', icon: '🦇',
    build() {
      const { g, pins } = breakout(45, 20, '#1f5fae', ['VCC', 'TRIG', 'ECHO', 'GND'], { label: 'HC-SR04', labelZ: 0 });
      for (const x of [-13, 13]) { g.add(cyl(8, 12, M.metal, x, PCB_H, -2.5, 28)); g.add(cyl(6.5, .3, std('#2a2a2a'), x, PCB_H + 12, -2.5)); }
      g.add(box(6, 3, 4, M.metal, 0, PCB_H, -7));
      g.rotation.order = 'YXZ';
      return { group: g, pins, update() {}, input: 'distance' };
    },
  },
  oled: {
    name: 'OLED display 0.96″ (SSD1306)', desc: '128 × 64 pixels over I²C (address 0x3C). Works on 3.3 V or 5 V.', icon: '🖥️',
    build() {
      const { g, pins } = breakout(27, 28, '#1f5fae', ['GND', 'VCC', 'SCL', 'SDA'], { pinZ: -11.5 });
      const c = document.createElement('canvas'); c.width = 128; c.height = 64; const cx = c.getContext('2d');
      cx.fillStyle = '#000'; cx.fillRect(0, 0, 128, 64);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
      g.add(box(25, 1.4, 16, std('#0a0a0a', { roughness: .15 }), 0, PCB_H, 3));
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map: tex })); scr.rotation.x = -Math.PI / 2; scr.position.set(0, PCB_H + 1.42, 3); g.add(scr);
      let last = '';
      return {
        group: g, pins, canvas: c,
        update(s) {
          const key = JSON.stringify(s.lines || null) + (s.on ? 1 : 0); if (key === last) return; last = key;
          cx.fillStyle = '#000'; cx.fillRect(0, 0, 128, 64);
          if (s.on && s.lines) {
            cx.fillStyle = '#7fd4ff'; cx.textBaseline = 'top';
            s.lines.forEach((ln, i) => { const big = typeof ln === 'object'; cx.font = big ? 'bold 20px monospace' : '10px monospace'; cx.fillText(big ? ln.big : ln, 2, i === 0 ? 2 : (big ? 22 : 14 + i * 12)); });
          }
          tex.needsUpdate = true;
        },
      };
    },
  },
  dht11: {
    name: 'Temperature & humidity (DHT11)', desc: 'Reports temperature (0–50 °C) and humidity over one DATA wire.', icon: '🌡️',
    build() {
      const { g, pins } = breakout(14, 22, '#1f5fae', ['VCC', 'DATA', 'GND']);
      const body = box(12, 5.5, 15.5, std('#3f86d8', { roughness: .6 }), 0, PCB_H, -3); g.add(body);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.add(box(2.2, .3, 2.2, std('#13324f'), -3.5 + c * 3.5, PCB_H + 5.5, -8 + r * 3.4));
      return { group: g, pins, update() {}, input: 'dht' };
    },
  },
  ldr: {
    name: 'Light sensor (LDR)', desc: 'A light-dependent resistor in a divider: SIG rises with brightness.', icon: '☀️',
    build() {
      const { g, pins } = breakout(14, 14, '#1d1d1f', ['VCC', 'SIG', 'GND']);
      const disc = cyl(2.6, 1.6, std('#d9a441'), 0, PCB_H + 3, -2); g.add(disc); g.add(cyl(.3, 3, M.metal, -1.2, PCB_H, -2)); g.add(cyl(.3, 3, M.metal, 1.2, PCB_H, -2));
      const face = new THREE.Mesh(new THREE.CircleGeometry(2.4, 20), new THREE.MeshBasicMaterial({ color: '#b5492a' })); face.rotation.x = -Math.PI / 2; face.position.set(0, PCB_H + 4.65, -2); g.add(face);
      return { group: g, pins, update() {}, input: 'light' };
    },
  },
  'level-shifter': {
    name: 'Logic level shifter', desc: 'Translates signals between a 3.3 V side (LV) and a 5 V side (HV). Both sides share GND.', icon: '↕️',
    build() {
      const g = new THREE.Group(); g.add(box(16, PCB_H, 14, std('#c8302a')));
      const mk = (names, z) => {
        const n = names.length, x0 = -(n - 1) * PITCH / 2; g.add(box(n * PITCH, 2.5, PITCH, M.plastic, 0, PCB_H, z));
        return names.map((nm, i) => { g.add(box(.64, 8, .64, M.gold, x0 + i * PITCH, PCB_H + .5, z)); return { name: nm, local: new THREE.Vector3(x0 + i * PITCH, PCB_H + 8.5, z) }; });
      };
      const pins = [...mk(['LV', 'LV1', 'LV2', 'GND'], 5), ...mk(['HV', 'HV1', 'HV2', 'GND2'], -5)];
      const l = silk(14, 3, '3.3V   ↔   5V', '#f3f1ea', 26); l.position.set(0, PCB_H + .02, 0); g.add(l);
      return { group: g, pins, update() {} };
    },
  },
};
export const MODULE_IDS = Object.keys(MODULES);
/** Pin names per module (used by tools/check-missions.mjs, which runs without a DOM). */
export const MODULE_PINS = {
  led: ['SIG', 'GND'], rgb: ['R', 'G', 'B', 'GND'], button: ['SIG', 'GND'], pot: ['VCC', 'SIG', 'GND'], buzzer: ['SIG', 'GND'],
  servo: ['SIG', 'VCC', 'GND'], motor: ['M+', 'M-'], 'motor-driver': ['ENA', 'IN1', 'IN2', 'VCC', 'GND', 'VM', 'OUT1', 'OUT2'],
  battery: ['BAT+', 'BAT-'], ultrasonic: ['VCC', 'TRIG', 'ECHO', 'GND'], oled: ['GND', 'VCC', 'SCL', 'SDA'], dht11: ['VCC', 'DATA', 'GND'],
  ldr: ['VCC', 'SIG', 'GND'], 'level-shifter': ['LV', 'LV1', 'LV2', 'GND', 'HV', 'HV1', 'HV2', 'GND2'],
};

/** Instantiate a module: tags pins with roles and adds invisible hit boxes. */
export function buildModule(type) {
  const spec = MODULES[type]; const m = spec.build();
  m.pins.forEach((p) => {
    p.role = type === 'level-shifter' && p.name === 'GND2' ? 'gnd' : role(p.name);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.4), M.pinHit.clone()); hit.position.copy(p.local).add(new THREE.Vector3(0, .6, 0));
    hit.userData.pinName = p.name; m.group.add(hit); p.mesh = hit;
    p.kind = p.role === 'gnd' ? 'gnd' : ['vcc', 'src', 'lv', 'hv'].includes(p.role) ? 'pwr' : p.role === 'motor' ? 'ctl' : 'dig';
  });
  m.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  m.type = type; m.spec = spec; return m;
}
