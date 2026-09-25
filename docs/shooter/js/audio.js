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
    // мек край: срязва острите високи честоти и изравнява силата
    const soft = ctx.createBiquadFilter();
    soft.type = 'lowpass';
    soft.frequency.value = 6500;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    master.connect(soft).connect(comp).connect(ctx.destination);
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

// Меки звуци: синусоиди и триъгълни вълни, приглушен шум, кратки и тихи.
// pluck — нежна „камбанка“ (основен тон + октава, бързо затихване).
function pluck(t, f, { dur = 0.25, gain = 0.12, type = 'sine' } = {}) {
  tone(t, dur, { type, f0: f, gain, attack: 0.006 });
  tone(t, dur * 0.6, { type: 'sine', f0: f * 2, gain: gain * 0.3, attack: 0.006 });
}

export const sfx = {
  // изстрел: приглушено „пуф“ с меко басово тупване
  shot: () => play(t => {
    noise(t, 0.12, { f0: 1800, f1: 250, gain: 0.28 });
    tone(t, 0.12, { type: 'sine', f0: 190, f1: 70, gain: 0.35, attack: 0.003 });
  }),
  empty: () => play(t => tone(t, 0.04, { type: 'sine', f0: 900, f1: 700, gain: 0.08 })),
  reload: () => play(t => {
    [0, 0.12, 0.26].forEach((d, i) => {
      noise(t + d, 0.035, { type: 'bandpass', f0: 1600 - i * 250, q: 3, gain: 0.25 });
      tone(t + d, 0.04, { type: 'sine', f0: 520 + i * 90, gain: 0.06 });
    });
  }),
  // попадение: кратка приятна нотка
  hit: () => play(t => pluck(t, 660, { dur: 0.14, gain: 0.1 })),
  // в главата: две нотки нагоре
  head: () => play(t => {
    pluck(t, 784, { dur: 0.18, gain: 0.11 });
    pluck(t + 0.07, 1175, { dur: 0.3, gain: 0.1 });
  }),
  // повален динозавър: меко „поф“ и весела низходяща маримба
  kill: () => play(t => {
    noise(t, 0.22, { f0: 1100, f1: 180, gain: 0.22 });
    pluck(t, 523, { dur: 0.16, gain: 0.1, type: 'triangle' });
    pluck(t + 0.06, 659, { dur: 0.16, gain: 0.09, type: 'triangle' });
    pluck(t + 0.12, 784, { dur: 0.26, gain: 0.09, type: 'triangle' });
  }),
  // рев: нисък и приглушен, без стържене
  roar: (big = false) => play(t => {
    const d = big ? 1.2 : 0.5;
    tone(t, d, { type: 'triangle', f0: big ? 120 : 210, f1: big ? 55 : 110, gain: big ? 0.22 : 0.08, attack: 0.1, vib: big ? 6 : 10 });
    noise(t, d, { f0: big ? 700 : 900, f1: big ? 200 : 300, q: 1.5, gain: big ? 0.28 : 0.12 });
  }),
  hurt: () => play(t => {
    tone(t, 0.3, { type: 'sine', f0: 150, f1: 55, gain: 0.35 });
    noise(t, 0.2, { f0: 500, f1: 120, gain: 0.2 });
  }),
  splat: () => play(t => {
    noise(t, 0.18, { f0: 900, f1: 200, q: 2, gain: 0.25 });
    tone(t, 0.12, { type: 'sine', f0: 300, f1: 120, gain: 0.12 });
  }),
  spit: () => play(t => noise(t, 0.16, { type: 'bandpass', f0: 1400, f1: 700, q: 2, gain: 0.15 })),
  coin: () => play(t => {
    pluck(t, 988, { dur: 0.12, gain: 0.1 });
    pluck(t + 0.09, 1319, { dur: 0.4, gain: 0.1 });
  }),
  pickup: () => play(t => {
    [523, 659, 784, 1047].forEach((f, i) => pluck(t + i * 0.07, f, { dur: 0.22, gain: 0.09 }));
  }),
  boom: () => play(t => {
    noise(t, 0.8, { f0: 700, f1: 60, gain: 0.45 });
    tone(t, 0.7, { type: 'sine', f0: 80, f1: 30, gain: 0.45 });
  }),
  stage: () => play(t => {
    [392, 523, 659, 784, 659, 784].forEach((f, i) =>
      pluck(t + i * 0.13, f, { dur: i === 5 ? 0.6 : 0.2, gain: 0.1, type: 'triangle' }));
  }),
  over: () => play(t => {
    [392, 330, 262, 196].forEach((f, i) => pluck(t + i * 0.25, f, { dur: 0.4, gain: 0.12, type: 'triangle' }));
  }),
  // тенис: мек замах на ракетата — въздушно „фшшт“
  whoosh: () => play(t => noise(t, 0.2, { type: 'bandpass', f0: 400, f1: 1300, q: 0.9, gain: 0.14 })),
  // удар по топката: топло „ток“ (дърво/струни), по-силно при силен удар
  pok: (power = 0.5) => play(t => {
    tone(t, 0.08, { type: 'sine', f0: 480 + power * 120, f1: 220, gain: 0.3 + power * 0.1, attack: 0.002 });
    tone(t, 0.05, { type: 'triangle', f0: 1200, f1: 900, gain: 0.05, attack: 0.002 });
    noise(t, 0.03, { f0: 2500, f1: 800, gain: 0.12 });
  }),
  bounce: () => play(t => tone(t, 0.06, { type: 'sine', f0: 260, f1: 150, gain: 0.14, attack: 0.002 })),
  net: () => play(t => noise(t, 0.15, { f0: 500, f1: 150, gain: 0.2 })),
  // аплодисменти: много кратки меки пляскания
  cheer: () => play(t => {
    for (let i = 0; i < 40; i++) {
      const d = Math.random() * 1.3;
      noise(t + d, 0.04, { type: 'bandpass', f0: 1200 + Math.random() * 1200, q: 1.2, gain: 0.06 + Math.random() * 0.05 * (1 - d / 1.3) });
    }
  }),
  aww: () => play(t => {
    tone(t, 0.7, { type: 'sine', f0: 330, f1: 247, gain: 0.07, attack: 0.08 });
    tone(t, 0.7, { type: 'sine', f0: 415, f1: 311, gain: 0.04, attack: 0.08 });
  }),
  tick: () => play(t => pluck(t, 880, { dur: 0.08, gain: 0.06 })),
  select: () => play(t => {
    pluck(t, 660, { dur: 0.1, gain: 0.07 });
    pluck(t + 0.05, 990, { dur: 0.14, gain: 0.07 });
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
    if (i % 4 === 0) tone(t, 0.18, { type: 'sine', f0: 110, f1: 45, gain: 0.6, out: musicBus });
    if (i === 6 || i === 14) tone(t, 0.12, { type: 'sine', f0: 200, f1: 140, gain: 0.3, out: musicBus });
    if (i % 4 === 2) noise(t, 0.025, { type: 'highpass', f0: 6000, gain: 0.05, out: musicBus });
    if (i % 2 === 0) {
      const b = song.bass[(i / 2) % song.bass.length];
      if (b) tone(t, s16 * 1.8, { type: 'triangle', f0: mtof(b), gain: 0.22, out: musicBus });
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
