// Lofi background music, synthesised in the browser (Web Audio, no audio files): Dm9 – G13 – Cmaj9 – Am9 at 74 bpm,
// Rhodes-style chords, soft kick / snare / hats, bass, a sparse melody and vinyl crackle.
// Usage: import { toggleLofi, setLofi, isLofiOn } from './lofi.js'  ·  dispatches window 'lofi:change' { on }.
// On pages with the site header it mounts its own "Lofi music" button there.

const BPM = 74, STEP = 60 / BPM / 4;                 // 16th-note length
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = [                                       // voicings (MIDI) + bass root
  { notes: [53, 57, 60, 64, 65], bass: 38 },           // Dm9  (F A C E F over D)
  { notes: [53, 57, 59, 64, 65], bass: 43 },           // G13  (F A B E over G)
  { notes: [52, 55, 59, 62, 64], bass: 36 },           // Cmaj9 (E G B D over C)
  { notes: [55, 59, 60, 64, 67], bass: 45 },           // Am9  (G B C E G over A)
];
const SCALE = [62, 64, 65, 67, 69, 72, 74, 76];        // D dorian-ish pentatonic for the melody
const A = { ctx: null, on: false, timer: null, nextT: 0, step: 0, out: null, mus: null, noise: null, crackle: null };

function setup() {
  const ctx = A.ctx = new (window.AudioContext || window.webkitAudioContext)();
  A.out = ctx.createGain(); A.out.gain.value = 0; A.out.connect(ctx.destination);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = .3; lp.connect(A.out);
  A.mus = ctx.createGain(); A.mus.gain.value = .9; A.mus.connect(lp);
  // shared noise buffer
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  A.noise = buf;
  // vinyl crackle: sparse clicks + quiet hiss, looped
  const cbuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), cd = cbuf.getChannelData(0);
  for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * .012 + (Math.random() < .0004 ? (Math.random() - .5) * .9 : 0);
  const src = ctx.createBufferSource(); src.buffer = cbuf; src.loop = true; const cg = ctx.createGain(); cg.gain.value = .35; src.connect(cg).connect(lp); src.start();
  A.crackle = src;
}

function rhodes(t, f, dur, vel = .06) {
  const ctx = A.ctx, o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), trem = ctx.createOscillator(), tg = ctx.createGain();
  o1.type = 'sine'; o1.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 2.001;
  const g2 = ctx.createGain(); g2.gain.value = .18;
  trem.frequency.value = 4.2; tg.gain.value = .25; trem.connect(tg).connect(g.gain);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .02); g.gain.exponentialRampToValueAtTime(vel * .35, t + .6); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o1.connect(g); o2.connect(g2).connect(g); g.connect(A.mus);
  [o1, o2, trem].forEach((o) => { o.start(t); o.stop(t + dur + .05); });
}
function bass(t, f, dur) {
  const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(A.mus); o.start(t); o.stop(t + dur + .05);
}
function kick(t) {
  const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
  g.gain.setValueAtTime(.32, t); g.gain.exponentialRampToValueAtTime(.0001, t + .35);
  o.connect(g).connect(A.mus); o.start(t); o.stop(t + .4);
}
function noiseHit(t, { f = 1800, type = 'bandpass', q = .8, vol = .1, dur = .18 }) {
  const ctx = A.ctx, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = A.noise; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl).connect(g).connect(A.mus); s.start(t, Math.random()); s.stop(t + dur + .02);
}

function schedule() {
  const ctx = A.ctx;
  while (A.nextT < ctx.currentTime + .25) {
    const t = A.nextT, s = A.step % 64, bar = Math.floor(s / 16), beat16 = s % 16;
    const swing = beat16 % 2 ? STEP * .18 : 0, tt = t + swing;
    const ch = CHORDS[bar];
    if (beat16 === 0) ch.notes.forEach((n, i) => rhodes(tt + i * .012, midi(n), STEP * 15, .045));
    if (beat16 === 10) ch.notes.slice(1, 4).forEach((n) => rhodes(tt, midi(n), STEP * 6, .03));
    if (beat16 === 0 || beat16 === 7 || beat16 === 10) bass(tt, midi(ch.bass), STEP * (beat16 === 0 ? 6 : 3));
    if (beat16 === 0 || beat16 === 9) kick(tt);
    if (beat16 === 4 || beat16 === 12) noiseHit(tt, { f: 1600, vol: .09, dur: .2 });
    if (beat16 % 2 === 0) noiseHit(tt, { f: 8000, type: 'highpass', q: .5, vol: beat16 % 4 ? .018 : .03, dur: .05 });
    if (beat16 % 4 === 2 && Math.random() < .35) rhodes(tt, midi(SCALE[Math.floor(Math.random() * SCALE.length)] + 12), STEP * 3, .03);
    A.nextT += STEP; A.step++;
  }
}

export function isLofiOn() { return A.on; }
export function setLofi(on) {
  on = !!on; if (on === A.on) return;
  try {
    if (!A.ctx) setup();
    A.on = on; const ctx = A.ctx, now = ctx.currentTime;
    if (on) {
      ctx.resume(); A.nextT = now + .1; A.step = 0;
      A.out.gain.cancelScheduledValues(now); A.out.gain.setValueAtTime(A.out.gain.value, now); A.out.gain.linearRampToValueAtTime(.55, now + 1.5);
      clearInterval(A.timer); A.timer = setInterval(schedule, 60); schedule();
    } else {
      A.out.gain.cancelScheduledValues(now); A.out.gain.setValueAtTime(A.out.gain.value, now); A.out.gain.linearRampToValueAtTime(0, now + .8);
      setTimeout(() => { if (!A.on) { clearInterval(A.timer); ctx.suspend(); } }, 900);
    }
  } catch (e) { A.on = false; console.warn('Lofi unavailable', e); }
  window.dispatchEvent(new CustomEvent('lofi:change', { detail: { on: A.on } }));
  try { window.dispatchEvent(new CustomEvent('site:track', { detail: { k: 'lofi', on: A.on } })); } catch { /* ignore */ }
}
export function toggleLofi() { setLofi(!A.on); }

// mount the header button
const tools = document.getElementById('header-tools');
if (tools && !document.getElementById('lofi-btn')) {
  const b = document.createElement('button');
  b.id = 'lofi-btn'; b.type = 'button'; b.className = 'lofi-btn'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Lofi music');
  b.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-music"/></svg><span>Lofi</span>';
  b.addEventListener('click', toggleLofi); tools.prepend(b);
  window.addEventListener('lofi:change', (e) => b.setAttribute('aria-pressed', String(e.detail.on)));
}
