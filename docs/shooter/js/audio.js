// Звуци, синтезирани с Web Audio — без аудио файлове.

let ctx = null;
let master = null;
let musicBus = null;
let noiseBuf = null;
let muted = false;
let musicOn = true;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = musicOn ? 0.22 : 0;
    musicBus.connect(master);
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) {
    ctx = null;
  }
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.7, ctx.currentTime, 0.02);
}
export function setMusic(on) {
  musicOn = on;
  if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.22 : 0, ctx.currentTime, 0.05);
}

function noise(t, dur, { type = 'lowpass', f0 = 2000, f1 = f0, q = 1, gain = 0.5, out = master } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

function tone(t, dur, { type = 'square', f0 = 440, f1 = f0, gain = 0.2, attack = 0.004, out = master, vib = 0 } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  if (vib) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 18;
    lg.gain.value = vib;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function play(fn) {
  if (!ctx || muted) return;
  try { fn(ctx.currentTime); } catch (e) { /* звукът не е критичен */ }
}

export const sfx = {
  shot: () => play(t => {
    noise(t, 0.18, { f0: 5000, f1: 300, gain: 0.8 });
    tone(t, 0.14, { type: 'sine', f0: 160, f1: 40, gain: 0.7 });
  }),
  empty: () => play(t => {
    tone(t, 0.03, { type: 'square', f0: 1400, gain: 0.12 });
    noise(t, 0.03, { type: 'highpass', f0: 3000, gain: 0.2 });
  }),
  reload: () => play(t => {
    [0, 0.11, 0.26].forEach((d, i) => {
      noise(t + d, 0.04, { type: 'bandpass', f0: 2500 - i * 600, q: 4, gain: 0.6 });
      tone(t + d, 0.03, { type: 'square', f0: 900 - i * 200, gain: 0.08 });
    });
  }),
  hit: () => play(t => {
    tone(t, 0.07, { type: 'square', f0: 520, f1: 900, gain: 0.12 });
  }),
  head: () => play(t => {
    tone(t, 0.06, { type: 'square', f0: 1200, gain: 0.12 });
    tone(t + 0.06, 0.1, { type: 'square', f0: 1800, gain: 0.12 });
  }),
  kill: () => play(t => {
    tone(t, 0.3, { type: 'sawtooth', f0: 420, f1: 70, gain: 0.18 });
    noise(t, 0.25, { type: 'bandpass', f0: 900, f1: 200, q: 1.5, gain: 0.5 });
  }),
  roar: (big = false) => play(t => {
    const d = big ? 1.4 : 0.6;
    tone(t, d, { type: 'sawtooth', f0: big ? 110 : 220, f1: big ? 45 : 90, gain: big ? 0.35 : 0.15, attack: 0.08, vib: big ? 12 : 20 });
    tone(t, d, { type: 'square', f0: big ? 75 : 160, f1: big ? 38 : 70, gain: big ? 0.15 : 0.06, attack: 0.1 });
    noise(t, d, { type: 'bandpass', f0: big ? 500 : 1200, f1: big ? 180 : 400, q: 2, gain: big ? 0.6 : 0.3 });
  }),
  hurt: () => play(t => {
    tone(t, 0.35, { type: 'sine', f0: 140, f1: 35, gain: 0.8 });
    noise(t, 0.3, { f0: 800, f1: 100, gain: 0.6 });
    tone(t, 0.2, { type: 'square', f0: 110, f1: 60, gain: 0.12 });
  }),
  splat: () => play(t => {
    noise(t, 0.25, { f0: 1500, f1: 200, q: 3, gain: 0.6 });
  }),
  spit: () => play(t => {
    noise(t, 0.2, { type: 'bandpass', f0: 3000, f1: 800, q: 3, gain: 0.4 });
  }),
  coin: () => play(t => {
    tone(t, 0.08, { type: 'square', f0: 988, gain: 0.15 });
    tone(t + 0.08, 0.45, { type: 'square', f0: 1319, gain: 0.15 });
  }),
  pickup: () => play(t => {
    [523, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.06, 0.12, { type: 'square', f0: f, gain: 0.12 }));
  }),
  boom: () => play(t => {
    noise(t, 1.0, { f0: 1200, f1: 60, gain: 1 });
    tone(t, 0.8, { type: 'sine', f0: 90, f1: 25, gain: 0.9 });
  }),
  stage: () => play(t => {
    [392, 523, 659, 784, 659, 784].forEach((f, i) =>
      tone(t + i * 0.12, i === 5 ? 0.5 : 0.14, { type: 'square', f0: f, gain: 0.13 }));
  }),
  over: () => play(t => {
    [392, 330, 262, 196].forEach((f, i) => tone(t + i * 0.25, 0.3, { type: 'triangle', f0: f, gain: 0.3 }));
  }),
  tick: () => play(t => tone(t, 0.05, { type: 'square', f0: 700, gain: 0.08 })),
  select: () => play(t => {
    tone(t, 0.05, { type: 'square', f0: 660, gain: 0.1 });
    tone(t + 0.05, 0.08, { type: 'square', f0: 990, gain: 0.1 });
  }),
};

// --- Музика: племенни барабани и бас, различни за всеки етап ---
const SONGS = {
  jungle: { bpm: 124, bass: [45, 0, 45, 48, 0, 45, 52, 50], lead: [69, 0, 72, 0, 74, 72, 69, 0, 67, 0, 69, 0, 64, 0, 0, 0] },
  volcano: { bpm: 140, bass: [40, 40, 0, 43, 40, 0, 46, 45], lead: [64, 0, 67, 70, 0, 67, 64, 0, 63, 0, 64, 0, 58, 0, 0, 0] },
  night: { bpm: 112, bass: [38, 0, 0, 38, 41, 0, 36, 0], lead: [62, 0, 0, 65, 0, 0, 69, 0, 68, 0, 0, 65, 0, 0, 0, 0] },
  boss: { bpm: 150, bass: [36, 36, 48, 36, 39, 36, 46, 36], lead: [60, 63, 0, 60, 66, 0, 65, 63, 60, 0, 63, 0, 58, 0, 0, 0] },
};
let musicTimer = null;
let step = 0;
let nextTime = 0;
let song = null;

const mtof = n => 440 * Math.pow(2, (n - 69) / 12);

export function startMusic(name) {
  if (!ctx) return;
  stopMusic();
  song = SONGS[name] || SONGS.jungle;
  step = 0;
  nextTime = ctx.currentTime + 0.1;
  musicTimer = setInterval(schedule, 50);
}
export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

function schedule() {
  if (!ctx || !song) return;
  const s16 = 60 / song.bpm / 4;
  while (nextTime < ctx.currentTime + 0.2) {
    const t = nextTime;
    const i = step % 16;
    if (i % 4 === 0) tone(t, 0.18, { type: 'sine', f0: 120, f1: 40, gain: 0.9, out: musicBus });
    if (i === 6 || i === 14) tone(t, 0.12, { type: 'triangle', f0: 220, f1: 140, gain: 0.5, out: musicBus });
    if (i % 2 === 1) noise(t, 0.03, { type: 'highpass', f0: 7000, gain: 0.12, out: musicBus });
    if (i % 2 === 0) {
      const b = song.bass[(i / 2) % song.bass.length];
      if (b) tone(t, s16 * 1.8, { type: 'square', f0: mtof(b), gain: 0.18, out: musicBus });
    }
    const bar = Math.floor(step / 16) % 4;
    if (bar >= 2) {
      const l = song.lead[i];
      if (l) tone(t, s16 * 1.6, { type: 'triangle', f0: mtof(l), gain: 0.12, out: musicBus });
    }
    nextTime += s16;
    step++;
  }
}
