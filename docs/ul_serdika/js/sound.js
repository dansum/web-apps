// Quiet city sounds, made in the browser with Web Audio (no sound files):
// a low hum of the city, traffic that swells and fades, birds by day, footsteps,
// the rumble and the bell of the trams, and rain. Shared by the three styles of the walk.

const KEY = 'serdika20-sound';

function noiseBuffer(ctx, kind) {
  const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0, b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else if (kind === 'pink') { b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; d[i] = (b0 + b1 + b2 + w * 0.02) * 0.9; }
    else d[i] = w;
  }
  return buf;
}

export function createSound() {
  let ctx = null, master = null, on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch { /* storage blocked */ }
  const g = {};
  let birdT = 3, stepPhase = 0;

  function loop(buf, filters, gain) {
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    let node = src;
    for (const f of filters) { node.connect(f); node = f; }
    const gn = ctx.createGain(); gn.gain.value = gain; node.connect(gn); gn.connect(master);
    src.start(0, Math.random() * 2);
    return gn;
  }
  function filter(type, freq, q = 0.7) { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; }

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? 0.6 : 0; master.connect(ctx.destination);
    const brown = noiseBuffer(ctx, 'brown'), pink = noiseBuffer(ctx, 'pink'), white = noiseBuffer(ctx, 'white');
    g.hum = loop(brown, [filter('lowpass', 160)], 0.05);
    g.traffic = loop(pink, [filter('bandpass', 420, 0.6), filter('lowpass', 1400)], 0.02);
    g.rain = loop(white, [filter('highpass', 900), filter('lowpass', 5200)], 0);
    g.tram = loop(brown, [filter('lowpass', 110, 1.2)], 0);
    g.screech = loop(white, [filter('bandpass', 3100, 18)], 0);
    return true;
  }
  const t = () => ctx.currentTime;
  const ramp = (gn, v, tc = 0.4) => gn.gain.setTargetAtTime(v, t(), tc);

  function chirp(pan) {
    const n = 2 + Math.floor(Math.random() * 4), f0 = 2600 + Math.random() * 1400;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) { p.pan.value = pan; p.connect(master); }
    for (let k = 0; k < n; k++) {
      const o = ctx.createOscillator(), gn = ctx.createGain(), s = t() + k * 0.13;
      o.type = 'sine'; o.frequency.setValueAtTime(f0, s); o.frequency.exponentialRampToValueAtTime(f0 * 1.45, s + 0.07);
      gn.gain.setValueAtTime(0, s); gn.gain.linearRampToValueAtTime(0.025, s + 0.01); gn.gain.exponentialRampToValueAtTime(0.0005, s + 0.09);
      o.connect(gn); gn.connect(p || master); o.start(s); o.stop(s + 0.1);
    }
  }
  function step(wet) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer.cache || (noiseBuffer.cache = noiseBuffer(ctx, 'white'));
    const f = filter('bandpass', wet ? 1800 : 700 + Math.random() * 300, 1.2), gn = ctx.createGain(), s = t();
    gn.gain.setValueAtTime(0.06, s); gn.gain.exponentialRampToValueAtTime(0.001, s + (wet ? 0.12 : 0.07));
    src.connect(f); f.connect(gn); gn.connect(master); src.start(s, Math.random() * 2, 0.15);
  }

  return {
    get on() { return on; },
    // must be called from a click or a key press: browsers start audio only after the user acts
    start() {
      if (!ctx && !init()) return;
      if (ctx.state === 'suspended') ctx.resume();
    },
    set(value) {
      on = !!value;
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* ignore */ }
      if (master) ramp(master, on ? 0.6 : 0, 0.2);
    },
    // the tram bell: two bright strikes
    bell(dist = 20) {
      if (!ctx || !on) return;
      const v = Math.min(0.12, 2.5 / Math.max(dist, 8));
      for (const k of [0, 0.32]) for (const f of [1180, 2360, 3540]) {
        const o = ctx.createOscillator(), gn = ctx.createGain(), s = t() + k;
        o.type = 'sine'; o.frequency.value = f * (1 + Math.random() * 0.003);
        gn.gain.setValueAtTime(v / (f / 1180), s); gn.gain.exponentialRampToValueAtTime(0.0001, s + 0.9);
        o.connect(gn); gn.connect(master); o.start(s); o.stop(s + 1);
      }
    },
    // day, night and rain from 0 to 1; tram: { d, v } or null; walking speed in m/s; inside: under a roof
    update(dt, { day = 1, night = 0, rain = 0, tram = null, speed = 0, bob = 0 } = {}) {
      if (!ctx || ctx.state !== 'running') return;
      ramp(g.hum, 0.04 + 0.02 * day);
      g.traffic.gain.setTargetAtTime((0.012 + 0.03 * day) * (0.7 + 0.3 * Math.sin(t() * 0.21) * Math.sin(t() * 0.07)), t(), 1.5);
      ramp(g.rain, 0.16 * rain, 0.8);
      const near = tram ? Math.max(0, 1 - tram.d / 90) : 0;
      ramp(g.tram, 0.35 * near * near * Math.min(1, tram ? tram.v / 6 : 0), 0.3);
      ramp(g.screech, near > 0.6 && tram && tram.v > 2 && tram.v < 4.5 ? 0.004 : 0, 0.2);
      // birds by day, when it is dry
      birdT -= dt;
      if (birdT <= 0) { birdT = 2 + Math.random() * 7; if (day > 0.3 && rain < 0.3) chirp(Math.random() * 1.6 - 0.8); }
      // a footstep every half turn of the walking sway
      if (speed > 0.3) {
        const ph = Math.floor(bob / Math.PI);
        if (ph !== stepPhase) { stepPhase = ph; step(rain > 0.4); }
      }
    },
  };
}
