// Следене на ръката през камерата (MediaPipe Hand Landmarker).
// Ръката е „пистолет“: показалецът се цели, свалянето на палеца стреля.
// Модулът дава за всеки играч позиция на мерника (0..1 от екрана) и събития
// onFire / onReload — точно както ще ги дава по-късно и Wii контролерът.

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];

// One Euro филтър: гладък мерник при бавно движение, бърз при рязко.
class OneEuro {
  constructor(minCutoff = 1.4, beta = 3.5, dCutoff = 1) {
    this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff;
    this.x = null; this.dx = 0; this.t = 0;
  }
  static alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }
  filter(x, t) {
    if (this.x === null) { this.x = x; this.t = t; return x; }
    const dt = Math.max(1e-3, t - this.t);
    this.t = t;
    const dx = (x - this.x) / dt;
    this.dx += OneEuro.alpha(this.dCutoff, dt) * (dx - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += OneEuro.alpha(cutoff, dt) * (x - this.x);
    return this.x;
  }
  reset() { this.x = null; this.dx = 0; }
}

const dist3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));

export class HandInput {
  constructor(video, overlay) {
    this.video = video;
    this.overlay = overlay;
    this.octx = overlay.getContext('2d');
    this.numHands = 1;
    this.gain = 1.7;
    this.center = { x: 0.5, y: 0.5 };
    this.autoFire = false;
    this.tracks = [];      // по един за всеки играч (slot)
    this.onFire = null;    // (slot, x, y) — x, y в 0..1 от екрана
    this.onReload = null;  // (slot)
    this.running = false;
    this.lastVideoTime = -1;
    this.lastResult = null;
    this.fps = 0;
    this.colors = ['#ff4d4d', '#39b6ff'];
  }

  async start(numHands, onStatus = () => {}) {
    this.numHands = numHands;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Браузърът не дава достъп до камера. Отвори страницата през https:// в Chrome, Edge или Safari.');
    }
    if (!this.stream) {
      onStatus('Разреши достъп до камерата…');
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      this.video.srcObject = this.stream;
    }
    await this.video.play().catch(() => {});
    if (!this.landmarker) {
      onStatus('Зареждам модела за ръката (около 8 MB)…');
      const { FilesetResolver, HandLandmarker } = await import(`${VISION}/vision_bundle.mjs`);
      const fileset = await FilesetResolver.forVisionTasks(`${VISION}/wasm`);
      const opts = delegate => ({
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: 'VIDEO',
        numHands,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      try {
        this.landmarker = await HandLandmarker.createFromOptions(fileset, opts('GPU'));
      } catch (e) {
        this.landmarker = await HandLandmarker.createFromOptions(fileset, opts('CPU'));
      }
    } else {
      await this.landmarker.setOptions({ numHands });
    }
    onStatus('Готово! Покажи ръка като пистолет.');
    if (!this.running) {
      this.running = true;
      this.loop();
    }
  }

  async setNumHands(n) {
    this.numHands = n;
    this.tracks = this.tracks.filter(t => t.slot < n);
    if (this.landmarker) await this.landmarker.setOptions({ numHands: n });
  }

  stop() {
    this.running = false;
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  loop() {
    if (!this.running) return;
    const next = () => this.loop();
    if (this.video.requestVideoFrameCallback) this.video.requestVideoFrameCallback(next);
    else requestAnimationFrame(next);
    const v = this.video;
    if (v.readyState < 2 || v.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = v.currentTime;
    const now = performance.now();
    let res;
    try {
      res = this.landmarker.detectForVideo(v, now);
    } catch (e) {
      return;
    }
    if (this.lastDetect) this.fps += (1000 / Math.max(1, now - this.lastDetect) - this.fps) * 0.1;
    this.lastDetect = now;
    this.lastResult = res;
    this.process(res, now / 1000);
    this.drawOverlay(res);
  }

  // Свързва откритите ръце с играчи по най-близка позиция на китката.
  process(res, t) {
    const hands = (res.landmarks || []).map((lm, i) => ({ lm, wl: (res.worldLandmarks || [])[i] || lm }));
    const free = this.tracks.slice();
    const used = new Set();
    for (const h of hands) {
      let best = null;
      let bd = 0.35;
      for (const tr of free) {
        if (used.has(tr)) continue;
        const d = Math.hypot(tr.wx - h.lm[0].x, tr.wy - h.lm[0].y);
        if (d < bd) { bd = d; best = tr; }
      }
      if (!best) {
        const taken = new Set(this.tracks.map(tr => tr.slot));
        let slot = -1;
        for (let s = 0; s < this.numHands; s++) if (!taken.has(s)) { slot = s; break; }
        if (slot < 0) {
          // всички слотове са заети от стари следи — вземи най-отдавна невидяната
          const stale = this.tracks.filter(tr => !used.has(tr)).sort((a, b) => a.lastSeen - b.lastSeen)[0];
          if (!stale) continue;
          best = stale;
          best.fx.reset(); best.fy.reset();
        } else {
          best = this.newTrack(slot);
          this.tracks.push(best);
        }
      }
      used.add(best);
      best.hand = h;
      this.updateTrack(best, h, t);
    }
    for (const tr of this.tracks) {
      if (!used.has(tr)) {
        tr.hand = null;
        if (t - tr.lastSeen > 0.25 && tr.visible) {
          // ръката излезе от кадъра — също презарежда
          tr.visible = false;
          if (this.onReload) this.onReload(tr.slot);
        }
      }
    }
    this.tracks = this.tracks.filter(tr => t - tr.lastSeen < 2);
  }

  newTrack(slot) {
    return {
      slot, wx: 0, wy: 0, lastSeen: 0, visible: false,
      fx: new OneEuro(), fy: new OneEuro(),
      x: 0.5, y: 0.5, rawX: 0.5, rawY: 0.5,
      history: [], palm: [], openRef: 0.55, armed: false, trigger: 0, lastShot: 0,
      offscreen: false, autoT: 0,
    };
  }

  updateTrack(tr, h, t) {
    const lm = h.lm;
    const wl = h.wl;
    tr.wx = lm[0].x; tr.wy = lm[0].y;
    const dt = Math.min(0.2, t - (tr.lastSeen || t));
    tr.lastSeen = t;
    tr.visible = true;
    // Мерникът: смес от върха и основата на показалеца (по-стабилно при стрелба).
    // Картината е огледална, затова x = 1 - x.
    const ax = 1 - (lm[8].x * 0.6 + lm[5].x * 0.4);
    const ay = lm[8].y * 0.6 + lm[5].y * 0.4;
    tr.rawX = ax; tr.rawY = ay;
    const sx = 0.5 + (ax - this.center.x) * this.gain;
    const sy = 0.5 + (ay - this.center.y) * this.gain;
    tr.x = tr.fx.filter(sx, t);
    tr.y = tr.fy.filter(sy, t);
    tr.history.push({ t, x: tr.x, y: tr.y, rx: ax, ry: ay });
    while (tr.history.length && t - tr.history[0].t > 0.4) tr.history.shift();
    // Сурова позиция на дланта (без усилване и филтър) — за засичане на замах в тениса.
    tr.palm.push({ t, x: 1 - (lm[0].x + lm[9].x) / 2, y: (lm[0].y + lm[9].y) / 2 });
    while (tr.palm.length && t - tr.palm[0].t > 0.6) tr.palm.shift();

    // Извън екрана = презареждане (като истински аркаден пистолет).
    const out = tr.x < -0.03 || tr.x > 1.03 || tr.y < -0.03 || tr.y > 1.03;
    if (out && !tr.offscreen && this.onReload) this.onReload(tr.slot);
    tr.offscreen = out;

    // Спусък: колко далеч е върхът на палеца от основата на показалеца,
    // спрямо размера на дланта. Използваме 3D координатите в метри,
    // за да не зависи от завъртането на ръката.
    const palm = dist3(wl[0], wl[5]) || 1;
    const d = Math.min(dist3(wl[4], wl[5]), dist3(wl[4], wl[6])) / palm;
    tr.openRef = Math.max(d, tr.openRef - 0.08 * dt, 0.42);
    const fireAt = tr.openRef * 0.6;
    const armAt = tr.openRef * 0.8;
    tr.trigger = Math.max(0, Math.min(1, (tr.openRef - d) / (tr.openRef - fireAt)));
    if (d > armAt) tr.armed = true;

    if (this.autoFire) {
      if (!out && t - tr.lastShot > 0.38) this.fire(tr, t, false);
    } else if (tr.armed && d < fireAt && t - tr.lastShot > 0.12) {
      tr.armed = false;
      this.fire(tr, t, true);
    }
  }

  // При изстрел вземаме позицията отпреди ~0.1 s — свалянето на палеца
  // леко мести ръката и без това изстрелът би отишъл встрани.
  fire(tr, t, compensate) {
    tr.lastShot = t;
    let p = tr.history[tr.history.length - 1] || tr;
    if (compensate) {
      for (let i = tr.history.length - 1; i >= 0; i--) {
        if (t - tr.history[i].t >= 0.1) { p = tr.history[i]; break; }
      }
    }
    tr.lastFireRaw = { x: p.rx ?? tr.rawX, y: p.ry ?? tr.rawY };
    if (this.onFire) this.onFire(tr.slot, p.x, p.y);
  }

  // Центрира: суровата позиция raw трябва да сочи към точка (tx, ty) от екрана.
  calibrate(raw, tx, ty) {
    this.center.x = raw.x - (tx - 0.5) / this.gain;
    this.center.y = raw.y - (ty - 0.5) / this.gain;
    for (const tr of this.tracks) { tr.fx.reset(); tr.fy.reset(); }
  }

  pointers() {
    return this.tracks.map(tr => ({
      slot: tr.slot, x: tr.x, y: tr.y, visible: tr.visible, trigger: tr.trigger,
      offscreen: tr.offscreen, lastFireRaw: tr.lastFireRaw,
    }));
  }

  drawOverlay(res) {
    const c = this.overlay;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = this.octx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    // видеото е с object-fit: cover — сметни изрязването
    const vw = this.video.videoWidth || 640;
    const vh = this.video.videoHeight || 480;
    const sc = Math.max(w / vw, h / vh);
    const ox = (w - vw * sc) / 2;
    const oy = (h - vh * sc) / 2;
    const P = p => [w - (ox + p.x * vw * sc), oy + p.y * vh * sc];
    (res.landmarks || []).forEach(lm => {
      const tr = this.tracks.find(t => t.hand && t.hand.lm === lm);
      const col = tr ? this.colors[tr.slot] : '#ffffff';
      g.strokeStyle = col;
      g.lineWidth = 2;
      g.beginPath();
      for (const [a, b] of BONES) {
        const [x1, y1] = P(lm[a]);
        const [x2, y2] = P(lm[b]);
        g.moveTo(x1, y1); g.lineTo(x2, y2);
      }
      g.stroke();
      g.fillStyle = '#fff';
      for (const p of lm) { const [x, y] = P(p); g.fillRect(x - 1.5, y - 1.5, 3, 3); }
      const [ix, iy] = P(lm[8]);
      g.fillStyle = col;
      g.beginPath(); g.arc(ix, iy, 6, 0, Math.PI * 2); g.fill();
      const [tx, ty] = P(lm[4]);
      g.fillStyle = tr && tr.trigger > 0.95 ? '#ffe14d' : '#ffffff';
      g.beginPath(); g.arc(tx, ty, 5, 0, Math.PI * 2); g.fill();
    });
  }
}
