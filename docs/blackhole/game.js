/* Дупката — черна дупка на пода зарежда сферите над нея.
   Всичко се рисува и озвучава в кода: без картинки и звукови файлове. */
(() => {
  'use strict';

  // ---------- помощни ----------
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* няма място — без значение */ } },
  };
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* няма вибрация */ } };

  // Цветове по ниво (1..8)
  const LEVEL_COLORS = [
    null,
    ['#7dd3fc', '#0e7490'], // 1 син
    ['#6ee7b7', '#047857'], // 2 зелен
    ['#fde047', '#a16207'], // 3 жълт
    ['#fdba74', '#c2410c'], // 4 оранжев
    ['#fb7185', '#be123c'], // 5 червен
    ['#f0abfc', '#a21caf'], // 6 розов
    ['#c4b5fd', '#6d28d9'], // 7 виолетов
    ['#ffffff', '#64748b'], // 8 бял
  ];
  const MAX_LEVEL = 8;

  // ---------- платно ----------
  const cv = $('c');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, S = 1, floorY = 0, G = 0;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    S = clamp(Math.min(W / 420, H / 820), 0.65, 1.7);
    floorY = H - Math.round(110 * S);
    G = 0.62 * floorY; // гравитация, пиксели/с²
    makeStars();
    if (hole) { hole.x = clamp(hole.x, hole.r, W - hole.r); hole.tx = hole.x; }
  }

  // ---------- звезден фон ----------
  let stars = [];
  function makeStars() {
    const n = Math.round((W * H) / 2600);
    stars = [];
    for (let i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6.28 });
  }

  // ---------- звук (синтезиран) ----------
  let actx = null;
  let soundOn = store.get('bh.sound', true);
  function audio() {
    if (!soundOn) return null;
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, type = 'sine', vol = 0.15, slideTo = 0, delay = 0) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(); const g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.3, cutoff = 900) {
    const a = audio(); if (!a) return;
    const len = Math.round(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = a.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(a.destination); src.start();
  }
  const sfx = {
    kick(l) { tone(220 + l * 55, 0.09, 'triangle', 0.18, 330 + l * 70); },
    level(l) { tone(330 * Math.pow(1.12246, l * 2), 0.18, 'sine', 0.13, 0, 0); tone(330 * Math.pow(1.12246, l * 2 + 4), 0.22, 'sine', 0.1, 0, 0.07); },
    bank(l) { [0, 4, 7, 12].forEach((s, i) => tone(392 * Math.pow(2, s / 12) * (1 + l * 0.04), 0.16, 'square', 0.06, 0, i * 0.05)); },
    swallow() { tone(180, 0.6, 'sawtooth', 0.12, 30); },
    crack() { tone(500, 0.12, 'square', 0.07, 120); },
    shatter() { noise(0.25, 0.22, 2500); tone(140, 0.3, 'triangle', 0.15, 50); },
    boom(p) { noise(0.5 + p * 0.1, 0.45, 600 + p * 150); tone(90, 0.5, 'sine', 0.3, 30); },
    feed() { tone(120, 0.35, 'sine', 0.2, 60); tone(700, 0.2, 'triangle', 0.06, 1400, 0.05); },
    nova() { [0, 3, 7, 10, 14, 19].forEach((s, i) => tone(262 * Math.pow(2, s / 12), 0.4, 'sine', 0.09, 0, i * 0.06)); },
    life() { tone(523, 0.12, 'sine', 0.12); tone(784, 0.2, 'sine', 0.12, 0, 0.1); },
    over() { [0, -3, -7, -12].forEach((s, i) => tone(330 * Math.pow(2, s / 12), 0.35, 'triangle', 0.12, 0, i * 0.18)); },
  };

  // ---------- състояние ----------
  let state = 'menu'; // menu | play | pause | over
  let hole = null;
  let things = []; // сфери, бомби, звезди, сърца
  let parts = [];  // частици
  let popups = []; // плаващи надписи
  let rings = [];  // ударни вълни
  let beamMotes = [];
  let score = 0, lives = 3, wave = 1, t = 0, spawnT = 0, waveT = 0;
  let combo = 1, comboT = 0, banked = 0, bestLevel = 1, shake = 0;
  let best = store.get('bh.best', 0);

  function newGame() {
    hole = { x: W / 2, tx: W / 2, r: 38 * S, spin: 0, pulse: 0 };
    things = []; parts = []; popups = []; rings = []; beamMotes = [];
    score = 0; lives = 3; wave = 1; t = 0; spawnT = 0.6; waveT = 0;
    combo = 1; comboT = 0; banked = 0; bestLevel = 1; shake = 0;
    spawn('orb', W * 0.3); // първата сфера пада встрани от дупката
    updateHud();
    toast('Вълна 1', 'Ритни сферата, преди да падне');
  }

  // ---------- обекти ----------
  function radiusFor(kind, level) {
    if (kind === 'orb') return (17 + level * 1.6) * S;
    if (kind === 'bomb') return (16 + level * 1.5) * S;
    return 17 * S;
  }
  function spawn(kind, x) {
    const r = radiusFor(kind, 1);
    const o = {
      kind, level: 1, charge: 0, r,
      x: x != null ? x : rand(r + 10, W - r - 10),
      y: -r - 4, vx: rand(-40, 40) * S, vy: rand(40, 90) * S,
      spin: rand(0, 6.28), flash: 0, inBeam: 0, dead: false, age: 0,
    };
    // Не пускай нови неща точно над дупката
    if (x == null && hole && Math.abs(o.x - hole.x) < hole.r * 2.2) o.x = (o.x + W / 2) % (W - 2 * r) + r;
    things.push(o);
    return o;
  }

  function beamHalf() { return hole.r * 1.55; }

  // ---------- вход ----------
  const pointers = new Map(); // id -> 'hole' | 'tap'
  function onDown(e) {
    if (state !== 'play') return;
    e.preventDefault();
    const x = e.clientX, y = e.clientY;
    if (y > floorY - 34 * S) {
      pointers.set(e.pointerId, 'hole');
      hole.tx = clamp(x, hole.r, W - hole.r);
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* без значение */ }
      return;
    }
    pointers.set(e.pointerId, 'tap');
    kickAt(x, y);
  }
  function onMove(e) {
    if (pointers.get(e.pointerId) === 'hole' && state === 'play') {
      hole.tx = clamp(e.clientX, hole.r, W - hole.r);
    }
  }
  function onUp(e) { pointers.delete(e.pointerId); }
  cv.addEventListener('pointerdown', onDown, { passive: false });
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);

  function kickAt(x, y) {
    let bestO = null, bestD = Infinity;
    for (const o of things) {
      if (o.dead) continue;
      const reach = o.r + 30 * S;
      const d = Math.hypot(o.x - x, o.y - y);
      if (d < reach && d < bestD) { bestD = d; bestO = o; }
    }
    if (!bestO) { burst(x, y, '#ffffff', 5, 60, 0.25); return; }
    const o = bestO;
    const reach = o.r + 30 * S;
    // Посока: от пръста към центъра, с наклон нагоре
    let dx = (o.x - x) / reach, dy = (o.y - y) / reach - 0.55;
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const lvl = o.kind === 'orb' || o.kind === 'bomb' ? o.level : 1;
    const h = 0.42 * floorY * (1 + 0.22 * (lvl - 1)); // заредените отскачат по-високо
    let v = Math.sqrt(2 * G * h);
    if (dy > 0) v *= 0.45; // ритник надолу е по-мек
    o.vx = dx * v * 0.75 + o.vx * 0.15;
    o.vy = dy * v;
    o.flash = 1;
    sfx.kick(lvl);
    buzz(12);
    burst(x, y, LEVEL_COLORS[Math.min(lvl, MAX_LEVEL)][0], 6, 120, 0.3);
  }

  // ---------- ефекти ----------
  function burst(x, y, color, n, speed, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(0.3, 1) * speed * S;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color, r: rand(1.5, 3.5) * S });
    }
  }
  function popup(x, y, text, color) { popups.push({ x, y, text, color, life: 1.1 }); }
  function ring(x, y, maxR, color) { rings.push({ x, y, r: 4, maxR, color, life: 0.5, max: 0.5 }); }

  let toastTimer = 0;
  function toast(text, small) {
    const el = $('toast');
    el.innerHTML = '';
    el.appendChild(document.createTextNode(text));
    if (small) { const s = document.createElement('small'); s.textContent = small; el.appendChild(s); }
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1700);
  }

  // ---------- HUD ----------
  function updateHud() {
    $('score').textContent = score.toLocaleString('bg-BG');
    $('lives').textContent = '♥'.repeat(lives) + '♡'.repeat(Math.max(0, 5 - lives));
    $('lives').setAttribute('aria-label', 'Животи: ' + lives);
    $('wave').textContent = 'Вълна ' + wave;
    $('combo').textContent = combo > 1 ? 'Серия ×' + combo : '';
  }

  function loseLife(x, y) {
    lives--;
    shake = Math.max(shake, 10);
    buzz([40, 30, 60]);
    popup(x, Math.min(y, floorY - 20 * S), '−♥', '#ff5d8f');
    combo = 1; comboT = 0;
    updateHud();
    if (lives <= 0) gameOver();
  }

  function explode(o) {
    o.dead = true;
    const R = (70 + o.level * 28) * S;
    ring(o.x, o.y, R, '#ffb547');
    burst(o.x, o.y, '#ffb547', 30 + o.level * 6, 380, 0.7);
    burst(o.x, o.y, '#ff5d8f', 16, 260, 0.6);
    shake = Math.max(shake, 8 + o.level * 3);
    sfx.boom(o.level);
    buzz(80);
    for (const p of things) {
      if (p === o || p.dead) continue;
      if (Math.hypot(p.x - o.x, p.y - o.y) < R + p.r) {
        if (p.kind === 'bomb') { p.fuse = 0.15; continue; } // верижна реакция
        p.dead = true;
        burst(p.x, p.y, p.kind === 'orb' ? LEVEL_COLORS[p.level][0] : '#ffffff', 14, 220, 0.5);
      }
    }
  }

  // ---------- игрови цикъл ----------
  function update(dt) {
    t += dt;
    waveT += dt;
    if (waveT > 32) {
      waveT = 0; wave++;
      toast('Вълна ' + wave, wave === 2 ? 'Идват бомби' : wave === 3 ? 'Дупката расте' : 'По-бързо');
      if (wave >= 3) hole.r = Math.min(hole.r * 1.06, 56 * S);
      updateHud();
    }

    // дупката следва пръста
    hole.x = lerp(hole.x, hole.tx, 1 - Math.pow(0.0005, dt));
    hole.spin += dt * 2.4;
    hole.pulse = Math.max(0, hole.pulse - dt * 2);

    // появяване
    spawnT -= dt;
    const alive = things.filter((o) => !o.dead && o.kind === 'orb').length;
    const maxOrbs = Math.min(2 + wave, 7);
    if (spawnT <= 0) {
      spawnT = Math.max(1.1, 3.4 - wave * 0.3) * rand(0.8, 1.2);
      const roll = Math.random();
      if (wave >= 2 && roll < Math.min(0.12 + wave * 0.03, 0.3)) spawn('bomb');
      else if (roll > 0.955) spawn('star');
      else if (roll > 0.925 && lives < 5) spawn('heart');
      else if (alive < maxOrbs) spawn('orb');
    }
    if (alive === 0 && spawnT > 0.8) spawnT = 0.8; // празен екран — бързо нова сфера

    // серия
    if (comboT > 0) { comboT -= dt; if (comboT <= 0) { combo = 1; updateHud(); } }

    const bh = beamHalf();
    for (const o of things) {
      if (o.dead) continue;
      o.age += dt;
      o.spin += dt * (1 + o.level * 0.4);
      o.flash = Math.max(0, o.flash - dt * 4);

      if (o.fuse != null) { o.fuse -= dt; if (o.fuse <= 0) { explode(o); continue; } }

      let ay = G;
      let ax = 0;
      const dxh = o.x - hole.x;
      const height = floorY - o.y;
      const prox = clamp(1 - height / (floorY * 0.95), 0, 1); // 1 = до пода
      o.inBeam = 0;
      if (Math.abs(dxh) < bh + o.r * 0.5 && o.y > 0) {
        o.inBeam = 1;
        const p2 = prox * prox;
        ay += G * 0.55 * p2;                       // дърпа надолу
        ax += -dxh * (2.5 + 9 * p2);               // и към центъра
        if (o.kind === 'orb' || o.kind === 'bomb') {
          if (o.level < MAX_LEVEL) {
            const rate = (0.26 + 1.5 * p2) * (1 + (wave - 1) * 0.04);
            o.charge += dt * rate;
            if (o.charge >= 1) {
              o.charge = 0; o.level++;
              o.r = radiusFor(o.kind, o.level);
              o.flash = 1; hole.pulse = 1;
              ring(o.x, o.y, o.r * 3, o.kind === 'bomb' ? '#ff5d8f' : LEVEL_COLORS[o.level][0]);
              burst(o.x, o.y, o.kind === 'bomb' ? '#ff5d8f' : LEVEL_COLORS[o.level][0], 14, 200, 0.5);
              if (o.kind === 'orb') { sfx.level(o.level); bestLevel = Math.max(bestLevel, o.level); popup(o.x, o.y - o.r - 8 * S, 'Ниво ' + o.level, LEVEL_COLORS[o.level][0]); }
              else { tone(200 + o.level * 40, 0.15, 'square', 0.08); }
            }
          }
        }
      }

      o.vx += ax * dt;
      o.vy += ay * dt;
      o.vx *= Math.pow(0.85, dt);
      o.x += o.vx * dt;
      o.y += o.vy * dt;

      // стени
      if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx) * 0.8; }
      if (o.x > W - o.r) { o.x = W - o.r; o.vx = -Math.abs(o.vx) * 0.8; }

      // излезе отгоре → прибрано
      if (o.y < -o.r * 1.2 && o.vy < 0 && o.age > 0.6) { bank(o); continue; }

      // пода и дупката
      if (o.y + o.r >= floorY) {
        if (Math.abs(o.x - hole.x) < hole.r * 0.95) { swallow(o); continue; }
        hitFloor(o);
      }
    }

    things = things.filter((o) => !o.dead);

    // частици
    for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += G * 0.4 * dt; p.vx *= 0.98; }
    parts = parts.filter((p) => p.life > 0);
    for (const p of popups) { p.life -= dt; p.y -= 40 * S * dt; }
    popups = popups.filter((p) => p.life > 0);
    for (const r of rings) { r.life -= dt; r.r = lerp(r.r, r.maxR, 1 - Math.pow(0.001, dt)); }
    rings = rings.filter((r) => r.life > 0);

    // искри, които се издигат в лъча
    if (Math.random() < dt * 30) beamMotes.push({ x: hole.x + rand(-bh, bh) * 0.9, y: floorY - 4, v: rand(60, 160) * S, life: rand(0.8, 1.6) });
    for (const m of beamMotes) { m.life -= dt; m.y -= m.v * dt; m.x += (hole.x - m.x) * 0.2 * dt; }
    beamMotes = beamMotes.filter((m) => m.life > 0 && m.y > 0);

    shake = Math.max(0, shake - dt * 30);
  }

  function bank(o) {
    o.dead = true;
    if (o.kind === 'orb') {
      const value = 10 * Math.pow(2, o.level - 1) * combo;
      score += value; banked++;
      popup(clamp(o.x, 40 * S, W - 40 * S), 70 * S, '+' + value, LEVEL_COLORS[o.level][0]);
      sfx.bank(o.level);
      if (o.level >= 2) { combo = Math.min(combo + 1, 5); comboT = 3.5; }
      buzz(10);
    } else if (o.kind === 'heart') {
      if (lives < 5) { lives++; sfx.life(); popup(clamp(o.x, 40 * S, W - 40 * S), 70 * S, '+♥', '#ff5d8f'); }
    } else if (o.kind === 'star') {
      score += 100 * combo; popup(clamp(o.x, 40 * S, W - 40 * S), 70 * S, '+' + 100 * combo, '#ffe27a'); sfx.bank(4);
    }
    // бомба, изстреляна нагоре, просто изчезва
    updateHud();
  }

  function swallow(o) {
    o.dead = true;
    hole.pulse = 1;
    ring(hole.x, floorY, hole.r * 2.5, '#8b5cf6');
    burst(hole.x, floorY - 4, '#8b5cf6', 18, 160, 0.6);
    if (o.kind === 'orb') {
      sfx.swallow();
      loseLife(hole.x, floorY);
    } else if (o.kind === 'bomb') {
      const bonus = 25 * o.level * combo;
      score += bonus; sfx.feed();
      popup(hole.x, floorY - 40 * S, 'Нахранена +' + bonus, '#c4b5fd');
      updateHud();
    } else if (o.kind === 'star') {
      sfx.nova(); buzz([20, 30, 20]);
      ring(hole.x, floorY, Math.max(W, H), '#ffe27a');
      popup(hole.x, floorY - 40 * S, 'Свръхнова!', '#ffe27a');
      for (const p of things) {
        if (!p.dead && p.kind === 'orb' && p.level < MAX_LEVEL) {
          p.level++; p.r = radiusFor('orb', p.level); p.flash = 1;
          bestLevel = Math.max(bestLevel, p.level);
          burst(p.x, p.y, LEVEL_COLORS[p.level][0], 12, 180, 0.5);
        }
      }
    } else {
      sfx.swallow();
    }
  }

  function hitFloor(o) {
    o.y = floorY - o.r;
    if (o.kind === 'bomb') { explode(o); loseLife(o.x, o.y); return; }
    if (o.kind === 'orb' && o.level > 1) {
      o.level--; o.charge = 0; o.r = radiusFor('orb', o.level); o.y = floorY - o.r;
      const vmin = Math.sqrt(2 * G * 0.2 * floorY);
      o.vy = -Math.max(Math.abs(o.vy) * 0.55, vmin);
      sfx.crack(); buzz(20);
      burst(o.x, floorY, LEVEL_COLORS[o.level][0], 8, 140, 0.4);
      popup(o.x, o.y - o.r - 6 * S, '−1 ниво', '#a69fc4');
      return;
    }
    o.dead = true;
    if (o.kind === 'orb') {
      sfx.shatter();
      burst(o.x, floorY - 4, LEVEL_COLORS[1][0], 22, 260, 0.6);
      loseLife(o.x, floorY);
    } else {
      burst(o.x, floorY - 4, '#ffffff', 10, 140, 0.4);
    }
  }

  // ---------- рисуване ----------
  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate(rand(-shake, shake) * 0.6, rand(-shake, shake) * 0.6);

    // небе
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#07060f'); sky.addColorStop(0.7, '#120c2a'); sky.addColorStop(1, '#1d1240');
    ctx.fillStyle = sky; ctx.fillRect(-20, -20, W + 40, H + 40);
    const now = performance.now() / 1000;
    for (const s of stars) {
      // звездите в лъча се изкривяват към дупката
      let sx = s.x;
      if (hole) { const d = s.x - hole.x; const k = Math.exp(-(d * d) / (2 * Math.pow(hole.r * 2, 2))); sx -= d * 0.35 * k * (s.y / floorY); }
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(now * 1.5 + s.p);
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    if (hole) drawBeam();
    drawFloor();
    if (hole) drawHole();

    for (const o of things) drawThing(o);

    // частици
    for (const p of parts) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const r of rings) {
      ctx.globalAlpha = clamp(r.life / r.max, 0, 1);
      ctx.strokeStyle = r.color; ctx.lineWidth = 3 * S;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of popups) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.font = `900 ${Math.round(20 * S)}px Rubik, system-ui, sans-serif`;
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawBeam() {
    const bh = beamHalf();
    const pulse = 0.18 + hole.pulse * 0.25;
    const g = ctx.createLinearGradient(0, floorY, 0, 0);
    g.addColorStop(0, `rgba(139, 92, 246, ${pulse + 0.2})`);
    g.addColorStop(0.35, `rgba(139, 92, 246, ${pulse * 0.6})`);
    g.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(hole.x - hole.r * 0.9, floorY);
    ctx.lineTo(hole.x - bh, 0);
    ctx.lineTo(hole.x + bh, 0);
    ctx.lineTo(hole.x + hole.r * 0.9, floorY);
    ctx.closePath(); ctx.fill();
    // ръбове
    ctx.strokeStyle = 'rgba(196, 181, 253, .18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hole.x - hole.r * 0.9, floorY); ctx.lineTo(hole.x - bh, 0);
    ctx.moveTo(hole.x + hole.r * 0.9, floorY); ctx.lineTo(hole.x + bh, 0); ctx.stroke();
    ctx.fillStyle = '#c4b5fd';
    for (const m of beamMotes) {
      ctx.globalAlpha = clamp(m.life, 0, 1) * 0.7;
      ctx.fillRect(m.x, m.y, 2 * S, 6 * S);
    }
    ctx.globalAlpha = 1;
  }

  function drawFloor() {
    const g = ctx.createLinearGradient(0, floorY, 0, H);
    g.addColorStop(0, '#2a1d52'); g.addColorStop(0.08, '#1a1236'); g.addColorStop(1, '#0b0819');
    ctx.fillStyle = g; ctx.fillRect(-20, floorY, W + 40, H - floorY + 20);
    ctx.fillStyle = 'rgba(196, 181, 253, .35)'; ctx.fillRect(-20, floorY, W + 40, 2);
    // решетка на пода
    ctx.strokeStyle = 'rgba(139, 92, 246, .15)'; ctx.lineWidth = 1;
    const cx = hole ? hole.x : W / 2;
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * 40 * S, floorY); ctx.lineTo(cx + i * 120 * S, H); ctx.stroke();
    }
    for (let k = 1; k < 5; k++) {
      const y = floorY + (H - floorY) * Math.pow(k / 5, 1.6);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    if (state === 'play' && t < 8) {
      ctx.globalAlpha = clamp((8 - t) / 2, 0, 1) * 0.8;
      ctx.fillStyle = '#c4b5fd';
      ctx.font = `600 ${Math.round(13 * S)}px Rubik, system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('◀  плъзни по пода, за да местиш дупката  ▶', W / 2, floorY + (H - floorY) * 0.72);
      ctx.globalAlpha = 1;
    }
  }

  function drawHole() {
    const x = hole.x, y = floorY + 6 * S, r = hole.r * (1 + hole.pulse * 0.08);
    const ry = r * 0.36;
    // сияние
    const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.4);
    glow.addColorStop(0, 'rgba(255, 181, 71, .35)');
    glow.addColorStop(0.4, 'rgba(139, 92, 246, .25)');
    glow.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.ellipse(x, y, r * 2.4, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    // акреционен диск
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i === 0 ? 'rgba(255, 200, 103, .9)' : i === 1 ? 'rgba(255, 93, 143, .6)' : 'rgba(139, 92, 246, .5)';
      ctx.lineWidth = (3 - i * 0.7) * S;
      const rr = r * (1.05 + i * 0.22);
      const a0 = hole.spin * (1 + i * 0.3);
      ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.36, 0, a0, a0 + Math.PI * 1.4); ctx.stroke();
    }
    // хоризонт
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 220, 160, .9)'; ctx.lineWidth = 1.5 * S;
    ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2); ctx.stroke();
  }

  function drawThing(o) {
    const { x, y, r } = o;
    if (o.kind === 'orb') {
      const [c1, c2] = LEVEL_COLORS[o.level];
      // ореол
      ctx.globalAlpha = 0.25 + o.flash * 0.4 + o.inBeam * 0.15;
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.arc(x, y, r * (1.5 + o.level * 0.06), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, '#fff'); g.addColorStop(0.35, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      // заряд
      if (o.charge > 0 && o.level < MAX_LEVEL) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * S; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, y, r + 5 * S, -Math.PI / 2, -Math.PI / 2 + o.charge * Math.PI * 2); ctx.stroke();
      }
      // орбитални точки = ниво
      for (let i = 0; i < o.level - 1; i++) {
        const a = o.spin + (i / (o.level - 1)) * Math.PI * 2;
        ctx.fillStyle = c1;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * (r + 10 * S), y + Math.sin(a) * (r + 10 * S) * 0.5, 2.2 * S, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(10, 6, 25, .85)';
      ctx.font = `900 ${Math.round(r * 0.95)}px Rubik, system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(o.level), x, y + r * 0.05);
    } else if (o.kind === 'bomb') {
      const hot = o.level - 1;
      ctx.globalAlpha = 0.2 + hot * 0.08 + o.flash * 0.4;
      ctx.fillStyle = '#ff5d8f';
      ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, '#6b6b7a'); g.addColorStop(1, '#141420');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      // фитил
      ctx.strokeStyle = '#d6b88a'; ctx.lineWidth = 2.5 * S;
      ctx.beginPath(); ctx.moveTo(x + r * 0.4, y - r * 0.8); ctx.quadraticCurveTo(x + r * 0.9, y - r * 1.4, x + r * 0.5, y - r * 1.6); ctx.stroke();
      const blink = (Math.sin(performance.now() / (120 - Math.min(hot, 5) * 15)) + 1) / 2;
      ctx.fillStyle = blink > 0.5 ? '#ffe27a' : '#ff5d8f';
      ctx.beginPath(); ctx.arc(x + r * 0.5, y - r * 1.6, 3.5 * S, 0, Math.PI * 2); ctx.fill();
      if (o.charge > 0 && o.level < MAX_LEVEL) {
        ctx.strokeStyle = '#ff5d8f'; ctx.lineWidth = 3 * S; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, y, r + 5 * S, -Math.PI / 2, -Math.PI / 2 + o.charge * Math.PI * 2); ctx.stroke();
      }
      if (o.level > 1) {
        ctx.fillStyle = '#ff9db8';
        ctx.font = `900 ${Math.round(r * 0.8)}px Rubik, system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(o.level), x, y + 1);
      }
    } else if (o.kind === 'star') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.spin * 0.6);
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#ffe27a';
      ctx.beginPath(); ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffe27a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * S;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 ? r * 0.45 : r * 1.1;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if (o.kind === 'heart') {
      ctx.save(); ctx.translate(x, y);
      const k = r / 16 * (1 + Math.sin(o.age * 6) * 0.06);
      ctx.scale(k, k);
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#ff5d8f';
      ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ff5d8f';
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.bezierCurveTo(-24, -2, -14, -22, 0, -10);
      ctx.bezierCurveTo(14, -22, 24, -2, 0, 14);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- главен цикъл ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (state === 'play') update(dt);
    else if (state === 'menu') demo(dt);
    draw();
    requestAnimationFrame(frame);
  }

  // Фоново демо в менюто: дупката бавно плува
  function demo(dt) {
    if (!hole) hole = { x: W / 2, tx: W / 2, r: 38 * S, spin: 0, pulse: 0 };
    hole.spin += dt * 2.4;
    hole.x = W / 2 + Math.sin(performance.now() / 1600) * W * 0.25;
    if (Math.random() < dt * 30) beamMotes.push({ x: hole.x + rand(-1, 1) * beamHalf() * 0.9, y: floorY - 4, v: rand(60, 160) * S, life: rand(0.8, 1.6) });
    for (const m of beamMotes) { m.life -= dt; m.y -= m.v * dt; }
    beamMotes = beamMotes.filter((m) => m.life > 0 && m.y > 0);
  }

  // ---------- екрани ----------
  function show(id) {
    for (const s of ['scrStart', 'scrPause', 'scrOver']) $(s).hidden = s !== id;
    $('hud').hidden = !(id === null || id === 'scrPause');
  }
  function start() {
    audio();
    newGame();
    state = 'play';
    last = performance.now();
    show(null);
  }
  function pause() {
    if (state !== 'play') return;
    state = 'pause';
    show('scrPause');
  }
  function resume() {
    state = 'play';
    last = performance.now();
    show(null);
  }
  function gameOver() {
    state = 'over';
    sfx.over();
    const isBest = score > best;
    if (isBest) { best = score; store.set('bh.best', best); }
    $('finalScore').textContent = score.toLocaleString('bg-BG');
    $('finalStats').textContent = `Вълна ${wave} · изстреляни сфери: ${banked} · най-високо ниво: ${bestLevel}`;
    $('newBest').hidden = !isBest || score === 0;
    setTimeout(() => show('scrOver'), 700);
  }
  function home() {
    state = 'menu';
    things = []; parts = []; popups = []; rings = [];
    showBest();
    show('scrStart');
  }
  function showBest() { $('bestStart').textContent = best > 0 ? 'Рекорд: ' + best.toLocaleString('bg-BG') : ''; }
  function syncSound() {
    const label = 'Звук: ' + (soundOn ? 'вкл.' : 'изкл.');
    $('btnSound').textContent = label; $('btnSound2').textContent = label;
  }
  function toggleSound() { soundOn = !soundOn; store.set('bh.sound', soundOn); syncSound(); if (soundOn) sfx.kick(1); }

  $('btnPlay').addEventListener('click', start);
  $('btnAgain').addEventListener('click', start);
  $('btnPause').addEventListener('click', pause);
  $('btnResume').addEventListener('click', resume);
  $('btnQuit').addEventListener('click', home);
  $('btnHome').addEventListener('click', home);
  $('btnSound').addEventListener('click', toggleSound);
  $('btnSound2').addEventListener('click', toggleSound);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'p') { if (state === 'play') pause(); else if (state === 'pause') resume(); }
  });
  window.addEventListener('resize', resize);
  // Android „Назад“ по време на игра → пауза, вместо да затвори приложението
  window.addEventListener('popstate', () => { if (state === 'play') { pause(); history.pushState(null, ''); } });
  try { history.pushState(null, ''); } catch (e) { /* без значение */ }

  // ---------- инсталиране (PWA) ----------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    $('btnInstall').hidden = false; $('installHint').hidden = true;
  });
  $('btnInstall').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) { /* отказ */ }
    deferredPrompt = null; $('btnInstall').hidden = true;
  });
  if (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) $('installHint').hidden = true;
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* офлайн режимът е по желание */ });
  }

  // ?debug — достъп до състоянието за автоматични тестове
  if (/[?&]debug\b/.test(location.search)) window.__dupka = () => ({ things, hole, floorY, state, score, lives, wave, W, H });

  resize();
  syncSound();
  showBest();
  requestAnimationFrame(frame);
})();
