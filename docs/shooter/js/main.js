// ДИНО АТАКА — аркадна стрелба по динозаври с ръка пред камерата.
import { TYPES, drawDino, drawProp, hitCircles, eyePos } from './dinos.js';
import { THEMES, drawBackground, drawAmbient, drawForeground, makeAmbient } from './scenery.js';
import { initAudio, sfx, setMuted, setMusic, startMusic, stopMusic } from './audio.js';
import { HandInput } from './hand.js';
import { createTennis, LEVELS } from './tennis.js';

// ---------- настройки и рекорди (localStorage може да липсва) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('dino-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('dino-' + k, JSON.stringify(v)); } catch (e) { /* няма значение */ } },
};
const settings = Object.assign({
  players: 1, muted: false, music: true, gain: 1.7, autoFire: false, center: { x: 0.5, y: 0.5 }, tennisLevel: 'easy',
}, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);

const DEFAULT_SCORES = [
  { name: 'РЕКС', score: 60000 }, { name: 'ДИНО', score: 40000 }, { name: 'ЯЙЦ', score: 25000 },
  { name: 'ЛОВ', score: 12000 }, { name: 'ОПА', score: 5000 },
];
let highScores = store.get('scores', DEFAULT_SCORES);

// ---------- етапи ----------
const STAGES = [
  { name: 'ДЖУНГЛАТА', theme: 'jungle', duration: 40, interval: [1.7, 0.95],
    spawn: [['raptor', 6], ['compy', 3], ['ptero', 1]], boss: { hp: 18, variant: 'green', name: 'ТИРАНОЗАВЪР' } },
  { name: 'ВУЛКАНЪТ', theme: 'volcano', duration: 45, interval: [1.5, 0.85],
    spawn: [['raptor', 4], ['compy', 2], ['ptero', 3], ['trike', 2], ['dilo', 2]], boss: { hp: 26, variant: 'red', name: 'ОГНЕНИЯТ РЕКС' } },
  { name: 'НОЩТА', theme: 'night', duration: 45, interval: [1.4, 0.75],
    spawn: [['raptor', 5], ['compy', 3], ['ptero', 2], ['trike', 2], ['dilo', 3]], boss: { hp: 34, variant: 'dark', name: 'СЯНКАТА' } },
];

const Z_SPAWN = 16;
const Z_ATTACK = 1.8;
const Z_BOSS_ATTACK = 3.8;
const MAX_HEALTH = 5;
const MAX_AMMO = 6;
const PLAYER_COLORS = ['#ff4d4d', '#39b6ff'];

// ---------- DOM ----------
const $ = s => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const cursor = $('#cursor');
const cctx = cursor.getContext('2d');
const dark = document.createElement('canvas');
const dctx = dark.getContext('2d');
const video = $('#cam');
const camWrap = $('#cam-wrap');
const hand = new HandInput(video, $('#cam-overlay'));
hand.gain = settings.gain;
hand.center = { ...settings.center };
hand.autoFire = settings.autoFire;
hand.colors = PLAYER_COLORS;

const view = { W: 0, H: 0, hy: 0, focal: 0, camH: 0.9, dpr: 1 };
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth, H = window.innerHeight;
  Object.assign(view, { W, H, dpr, hy: H * 0.45, focal: Math.min(H * 0.95, W * 1.35) });
  for (const c of [canvas, cursor]) {
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    c.style.width = W + 'px'; c.style.height = H + 'px';
  }
  dark.width = Math.round(W / 2); dark.height = Math.round(H / 2);
}
window.addEventListener('resize', resize);
resize();

const tennis = createTennis({ ctx, view, hand, onEnd: tennisEnd });
const inTennis = () => game.state === 'tennis' || game.state === 'tennis-over';

// ---------- състояние ----------
const game = {
  state: 'title', stage: 0, loop: 1, t: 0, stageT: 0, travel: 0, speed: 1.4,
  health: MAX_HEALTH, dinos: [], props: [], parts: [], popups: [], slashes: [], splats: [],
  spawnT: 1, bossOut: false, boss: null, shake: 0, hurt: 0, flashes: [],
  banner: null, continueT: 0, continues: 0, inputMode: 'mouse', paused: false,
  players: [], clearInfo: null, pickupT: 12,
};
const ambient = makeAmbient(40);
let theme = THEMES.jungle;

function makePlayer(i) {
  return { i, score: 0, ammo: MAX_AMMO, reload: 0, autoReload: 0, combo: 0, hits: 0, shots: 0, color: PLAYER_COLORS[i], hitMark: 0 };
}

// Мерници: мишка/докосване + по един за всяка следена ръка
const mouse = { x: -100, y: -100, seen: -10, touch: false };
const dwell = new Map();

// ---------- проекция ----------
function proj(x, y, z) {
  const s = view.focal / z;
  return { sx: view.W / 2 + x * s, sy: view.hy + (view.camH - y) * s, s };
}
function xNear() { return (view.W / 2 * 0.72) / (view.focal / Z_ATTACK); }
function dinoX(d) {
  const k = 1 + 1.3 * Math.max(0, Math.min(1, (d.z - Z_ATTACK) / (Z_SPAWN - Z_ATTACK)));
  return d.u * xNear() * k;
}

// ---------- създаване ----------
function spawnDino(type, opts = {}) {
  const T = TYPES[type];
  const speedMul = 1 + (game.loop - 1) * 0.2 + game.stage * 0.06;
  const d = {
    type, hp: T.hp, maxHp: T.hp, z: opts.z ?? Z_SPAWN + Math.random() * 2, u: opts.u ?? (Math.random() * 2 - 1),
    y: 0, phase: Math.random() * 6, speed: T.speed * speedMul * (0.85 + Math.random() * 0.3),
    dir: Math.random() < 0.5 ? -1 : 1, zigT: Math.random() * 10, flash: 0, roar: 0, dead: false, deathT: 0,
    mouth: 0, frill: 0, stopZ: T.spits ? 5 + Math.random() * 3 : 0, spitCd: 0, spits: 0,
    baseY: 1.6 + Math.random() * 1.2, attackT: 0, retreat: 0, variant: opts.variant, id: Math.random(),
  };
  if (T.kind === 'flyer') d.y = d.baseY;
  if (T.boss) { d.hp = d.maxHp = opts.hp; d.z = 15; d.u = 0; d.name = opts.name; d.stomp = 0; d.nextRoar = 0; }
  game.dinos.push(d);
  return d;
}

function spawnGlob(from) {
  const x = dinoX(from);
  game.dinos.push({ type: 'glob', x0: x, y0: 1.0 * TYPES[from.type].size, z0: from.z, z: from.z, t: 0, hp: 1, dead: false, deathT: 0, id: Math.random() });
}

function spawnPickup() {
  const side = Math.random() < 0.5 ? -1 : 1;
  const what = game.health < MAX_HEALTH && Math.random() < 0.6 ? 'med' : 'bomb';
  game.dinos.push({ type: 'pickup', what, side, t: 0, z: 6, hp: 1, dead: false, deathT: 0, id: Math.random() });
}

function resetProps() {
  game.props = [];
  for (let i = 0; i < 14; i++) game.props.push(newProp(1 + i * 1.1));
}
function newProp(z) {
  const kinds = theme.props;
  const side = Math.random() < 0.5 ? -1 : 1;
  return { kind: kinds[Math.floor(Math.random() * kinds.length)], x: side * (1.8 + Math.random() * 3), z,
    seed: Math.random(), lean: side * (0.5 + Math.random() * 0.8), t: 0, size: 0.8 + Math.random() * 0.5 };
}

// ---------- поток на играта ----------
function setTheme(name) {
  theme = THEMES[name];
  resetProps();
}

function startGame() {
  initAudio();
  document.body.classList.remove('mode-tennis');
  if (hand.landmarker) hand.setNumHands(settings.players);
  game.players = [];
  const n = game.inputMode === 'hand' ? settings.players : 1;
  for (let i = 0; i < n; i++) game.players.push(makePlayer(i));
  game.loop = 1;
  game.continues = 0;
  game.health = MAX_HEALTH;
  showScreen(null);
  sfx.coin();
  startStage(0);
}

function startStage(i) {
  game.stage = i;
  const S = STAGES[i];
  setTheme(S.theme);
  game.dinos = []; game.parts = []; game.popups = []; game.slashes = []; game.splats = [];
  game.stageT = 0; game.spawnT = 2.5; game.bossOut = false; game.boss = null; game.pickupT = 10 + Math.random() * 6;
  for (const p of game.players) { p.ammo = MAX_AMMO; p.reload = 0; p.stageHits = 0; p.stageShots = 0; }
  game.state = 'intro';
  game.banner = { t: 0, dur: 3, title: `ЕТАП ${i + 1}${game.loop > 1 ? ' · ЦИКЪЛ ' + game.loop : ''}`, sub: S.name };
  sfx.stage();
  startMusic(S.theme);
}

function stageClear() {
  game.state = 'clear';
  stopMusic();
  sfx.stage();
  const info = game.players.map(p => {
    const acc = p.stageShots ? p.stageHits / p.stageShots : 0;
    const accBonus = Math.round(acc * 3000 / 10) * 10;
    const hpBonus = game.health * 500;
    p.score += accBonus + hpBonus;
    return { acc, accBonus, hpBonus };
  });
  game.clearInfo = { t: 0, info };
}

function nextStage() {
  let i = game.stage + 1;
  if (i >= STAGES.length) { i = 0; game.loop++; }
  startStage(i);
}

function playerDown() {
  game.state = 'continue';
  game.continueT = 10.99;
  stopMusic();
  sfx.over();
}

function doContinue() {
  game.continues++;
  game.health = MAX_HEALTH;
  game.state = 'play';
  for (const p of game.players) { p.ammo = MAX_AMMO; p.reload = 0; p.combo = 0; }
  // отблъсни близките динозаври
  for (const d of game.dinos) if (!d.dead && d.z < 6 && TYPES[d.type]) d.z += 5;
  game.dinos = game.dinos.filter(d => d.type !== 'glob');
  sfx.coin();
  startMusic(game.bossOut ? 'boss' : STAGES[game.stage].theme);
}

function gameOver() {
  game.state = 'over';
  stopMusic();
  const best = Math.max(...game.players.map(p => p.score));
  $('#over-score').textContent = game.players.map((p, i) => (game.players.length > 1 ? `P${i + 1}: ` : '') + fmt(p.score)).join('   ');
  const rank = highScores.findIndex(h => best > h.score);
  const qualifies = rank >= 0 || highScores.length < 5;
  $('#initials').hidden = !qualifies;
  $('#over-table-wrap').hidden = qualifies;
  if (qualifies) { initials = ['А', 'А', 'А']; slot = 0; renderInitials(); pendingScore = best; }
  else renderScores($('#over-table'));
  showScreen('scr-over');
}

// ---------- стрелба ----------
function fire(pi, x, y, source) {
  if (game.state === 'continue') { doContinue(); return; }
  if (game.state === 'clear' && game.clearInfo && game.clearInfo.t > 1.5) { nextStage(); return; }
  if (game.state !== 'play') return;
  const p = game.players[pi];
  if (!p) return;
  if (p.reload > 0) return;
  if (p.ammo <= 0) {
    sfx.empty();
    game.popups.push({ x, y: y - 30, text: 'ПРЕЗАРЕДИ!', t: 0, col: '#ffe14d', small: true });
    return;
  }
  p.ammo--; p.shots++; p.stageShots++;
  sfx.shot();
  game.shake = Math.max(game.shake, 4);
  game.flashes.push({ x, y, t: 0, r: 120 });
  const tol = source === 'hand' ? 22 : source === 'touch' ? 18 : 10;
  const hit = hitTest(x, y, tol);
  if (hit) {
    damage(hit.d, hit.head, p, x, y);
    p.hits++; p.stageHits++;
    p.combo++;
    p.hitMark = 0.25;
  } else {
    if (p.combo >= 5) game.popups.push({ x, y: y - 20, text: 'КОМБО ИЗГУБЕНО', t: 0, col: '#bbb', small: true });
    p.combo = 0;
    puff(x, y, y > view.hy ? '#b8a27a' : '#ffffff', 6, 0.5);
  }
  if (p.ammo === 0) p.autoReload = 1.1;
}

function reload(pi) {
  const p = game.players[pi];
  if (!p || game.state !== 'play' || p.reload > 0 || p.ammo === MAX_AMMO) return;
  p.reload = 0.45;
  p.autoReload = 0;
  sfx.reload();
}

function comboMult(p) { return Math.min(5, 1 + Math.floor(p.combo / 5)); }

// Намира най-близкия (най-малко z) обект под мерника
function hitTest(px, py, tol) {
  const list = game.dinos.filter(d => !d.dead).sort((a, b) => a.z - b.z);
  for (const d of list) {
    if (d.type === 'glob') {
      const q = globPos(d);
      if (Math.hypot(px - q.sx, py - q.sy) < 0.22 * q.s + tol) return { d, head: false };
      continue;
    }
    if (d.type === 'pickup') {
      const q = pickupPos(d);
      if (Math.hypot(px - q.sx, py - q.sy) < 0.45 * q.s + tol) return { d, head: false };
      continue;
    }
    const T = TYPES[d.type];
    const q = dinoScreen(d);
    const lx = (px - q.sx) / (q.s * T.size * q.dir);
    const ly = (py - q.sy) / (q.s * T.size);
    const tl = tol / (q.s * T.size);
    for (const [cx, cy, r, head] of hitCircles(d)) {
      if (Math.hypot(lx - cx, ly - cy) < r + tl) return { d, head: !!head };
    }
  }
  return null;
}

function damage(d, head, p, x, y) {
  if (d.type === 'glob') {
    d.dead = true;
    sfx.splat();
    puff(x, y, '#9be34a', 14, 1);
    award(p, 50, x, y);
    return;
  }
  if (d.type === 'pickup') {
    d.dead = true;
    sfx.pickup();
    if (d.what === 'med') {
      if (game.health < MAX_HEALTH) { game.health++; game.popups.push({ x, y, text: '+1 ЖИВОТ', t: 0, col: '#ff6b8a' }); }
      else award(p, 1000, x, y);
    } else {
      bomb(p);
    }
    puff(x, y, '#ffffff', 16, 1.2);
    return;
  }
  const T = TYPES[d.type];
  const dmg = head ? 2 : 1;
  d.hp -= dmg;
  d.flash = 0.08;
  if (T.boss) {
    sfx.hit();
    award(p, head ? 100 : 50, x, y, head ? 'В ГЛАВАТА!' : null);
    d.hurtPush = (d.hurtPush || 0) + 0.15;
    if (d.hp <= 0) killBoss(d, p);
    return;
  }
  if (d.hp <= 0) {
    kill(d, p, head, x, y);
  } else {
    sfx.hit();
    d.z += 0.4;
    award(p, 10, x, y);
  }
}

function kill(d, p, head, x, y) {
  const T = TYPES[d.type];
  d.dead = true;
  d.deathT = 0;
  if (head) sfx.head(); else sfx.kill();
  const pts = Math.round(T.points * comboMult(p) * (head ? 1.5 : 1));
  award(p, pts, x, y, head ? 'В ГЛАВАТА!' : null);
  puff(x, y, '#fff6d8', 12, 1);
  stars(x, y);
}

function killBoss(d, p) {
  d.dead = true;
  d.deathT = 0;
  sfx.roar(true);
  setTimeout(() => sfx.boom(), 400);
  game.shake = 20;
  const q = dinoScreen(d);
  award(p, TYPES.trex.points * game.loop, q.sx, q.sy - q.s * 1.2, 'ПОБЕДА!');
  for (let i = 0; i < 5; i++) setTimeout(() => puff(q.sx + (Math.random() - 0.5) * q.s, q.sy - Math.random() * q.s * 2, '#ffe9b0', 20, 2), i * 150);
  for (const o of game.dinos) if (!o.dead && o !== d) { o.dead = true; o.deathT = 0; }
  setTimeout(() => { if (game.state === 'play') stageClear(); }, 2200);
}

function bomb(p) {
  sfx.boom();
  game.shake = 16;
  game.flashes.push({ x: view.W / 2, y: view.H / 2, t: 0, r: Math.max(view.W, view.H), big: true });
  for (const d of game.dinos) {
    if (d.dead || d.type === 'pickup') continue;
    if (d.type === 'glob') { d.dead = true; continue; }
    const T = TYPES[d.type];
    const q = dinoScreen(d);
    if (T.boss) {
      d.hp -= 5; d.flash = 0.2;
      if (d.hp <= 0) killBoss(d, p);
    } else {
      kill(d, p, false, q.sx, q.sy - q.s * T.size * 0.6);
    }
  }
}

function award(p, pts, x, y, label) {
  p.score += pts;
  game.popups.push({ x, y, text: (label ? label + ' ' : '') + '+' + pts, t: 0, col: label ? '#ffe14d' : '#ffffff' });
  if (p.combo > 0 && p.combo % 5 === 0 && p.combo <= 20) {
    game.popups.push({ x, y: y - 34, text: `КОМБО x${comboMult(p)}`, t: 0, col: '#ff9f1a' });
  }
}

function hurtPlayer(n = 1) {
  if (game.state !== 'play') return;
  game.health -= n;
  game.hurt = 0.6;
  game.shake = 14;
  sfx.hurt();
  for (const p of game.players) p.combo = 0;
  if (game.health <= 0) { game.health = 0; setTimeout(() => { if (game.health <= 0 && game.state === 'play') playerDown(); }, 500); }
}

// ---------- ефекти ----------
function puff(x, y, col, n, size) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 180 * size;
    game.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: 0.4 + Math.random() * 0.4, r: (4 + Math.random() * 8) * size, col, kind: 'puff' });
  }
}
function stars(x, y) {
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.5;
    game.parts.push({ x, y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 200, t: 0, life: 0.8, r: 9, col: '#ffe14d', kind: 'star', g: 400 });
  }
}

// ---------- обновяване ----------
function update(dt) {
  game.t += dt;
  const playing = game.state === 'play';
  const moving = game.state === 'play' || game.state === 'intro' || game.state === 'title' || game.state === 'clear';
  const spd = moving && !game.bossOut ? game.speed : (game.bossOut ? 0.15 : 0);
  game.travel += spd * dt;
  for (const pr of game.props) {
    pr.z -= spd * dt;
    pr.t += dt;
    if (pr.z < 0.6) Object.assign(pr, newProp(pr.z + 15.4));
  }

  if (game.state === 'intro') {
    game.banner.t += dt;
    if (game.banner.t > game.banner.dur) { game.state = 'play'; game.banner = null; }
  }
  if (game.state === 'clear') {
    game.clearInfo.t += dt;
    if (game.clearInfo.t > 8) nextStage();
  }
  if (game.state === 'continue') {
    const before = Math.floor(game.continueT);
    game.continueT -= dt;
    if (Math.floor(game.continueT) !== before && game.continueT > 0) sfx.tick();
    if (game.continueT <= 0) gameOver();
  }
  if (game.state === 'title') attractSpawn(dt);

  if (playing) {
    game.stageT += dt;
    const S = STAGES[game.stage];
    if (!game.bossOut) {
      game.spawnT -= dt;
      const prog = Math.min(1, game.stageT / S.duration);
      const alive = game.dinos.filter(d => !d.dead && TYPES[d.type]).length;
      const cap = 4 + game.stage + game.loop + (game.players.length - 1) * 2;
      if (game.spawnT <= 0 && alive < cap) {
        const iv = S.interval[0] + (S.interval[1] - S.interval[0]) * prog;
        game.spawnT = iv * (0.7 + Math.random() * 0.6) / (1 + (game.players.length - 1) * 0.5) / (1 + (game.loop - 1) * 0.15);
        const type = pick(S.spawn);
        if (type === 'compy') {
          const u = Math.random() * 1.6 - 0.8;
          for (let i = 0; i < 3; i++) spawnDino('compy', { u: u + (i - 1) * 0.18, z: Z_SPAWN + i * 0.6 });
        } else spawnDino(type);
      }
      game.pickupT -= dt;
      if (game.pickupT <= 0) { spawnPickup(); game.pickupT = 14 + Math.random() * 8; }
      if (game.stageT > S.duration) {
        const left = game.dinos.filter(d => !d.dead && TYPES[d.type]).length;
        if (left === 0 || game.stageT > S.duration + 8) {
          game.bossOut = true;
          game.boss = spawnDino('trex', { hp: Math.round(S.boss.hp * (1 + (game.loop - 1) * 0.5) * (1 + (game.players.length - 1) * 0.6)), variant: S.boss.variant, name: S.boss.name });
          game.banner = { t: 0, dur: 2.5, title: 'ВНИМАНИЕ!', sub: S.boss.name, warn: true };
          sfx.roar(true);
          startMusic('boss');
        }
      }
    }
    if (game.banner && game.banner.warn) { game.banner.t += dt; if (game.banner.t > game.banner.dur) game.banner = null; }
    for (const p of game.players) {
      if (p.reload > 0) { p.reload -= dt; if (p.reload <= 0) { p.reload = 0; p.ammo = MAX_AMMO; } }
      if (p.autoReload > 0) { p.autoReload -= dt; if (p.autoReload <= 0 && p.ammo === 0) reload(p.i); }
      p.hitMark = Math.max(0, p.hitMark - dt);
    }
  }

  for (const d of game.dinos) updateDino(d, dt, playing);
  game.dinos = game.dinos.filter(d => !(d.dead && d.deathT > 1.2) && !d.gone);

  for (const p of game.parts) {
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += (p.g || 60) * dt; p.vx *= 0.96;
  }
  game.parts = game.parts.filter(p => p.t < p.life);
  for (const p of game.popups) p.t += dt;
  game.popups = game.popups.filter(p => p.t < 1.1);
  for (const s of game.slashes) s.t += dt;
  game.slashes = game.slashes.filter(s => s.t < 1);
  for (const s of game.splats) s.t += dt;
  game.splats = game.splats.filter(s => s.t < 2);
  for (const f of game.flashes) f.t += dt;
  game.flashes = game.flashes.filter(f => f.t < (f.big ? 0.6 : 0.12));
  game.shake = Math.max(0, game.shake - dt * 40);
  game.hurt = Math.max(0, game.hurt - dt);
}

function pick(table) {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [t, w] of table) { r -= w; if (r <= 0) return t; }
  return table[0][0];
}

function attractSpawn(dt) {
  game.spawnT -= dt;
  if (game.spawnT <= 0 && game.dinos.length < 5) {
    game.spawnT = 1.5 + Math.random() * 1.5;
    const d = spawnDino(pick([['raptor', 3], ['trike', 1], ['ptero', 2], ['compy', 1], ['dilo', 1]]));
    d.attract = true;
    d.z = 6 + Math.random() * 6;
    d.u = Math.random() < 0.5 ? -3 : 3;
    d.dir = d.u < 0 ? 1 : -1;
  }
}

function updateDino(d, dt, playing) {
  if (d.dead) {
    d.deathT += dt;
    if (d.type !== 'glob' && d.type !== 'pickup' && TYPES[d.type].kind === 'flyer') d.y -= dt * 4 * d.deathT;
    return;
  }
  if (d.type === 'glob') {
    d.t += dt;
    d.z = d.z0 - d.t * 4.2;
    if (d.z < 0.9 && playing) {
      d.gone = true;
      hurtPlayer(1);
      sfx.splat();
      game.splats.push({ x: Math.random() * view.W * 0.6 + view.W * 0.2, y: Math.random() * view.H * 0.5 + view.H * 0.2, t: 0, r: Math.min(view.W, view.H) * (0.15 + Math.random() * 0.1) });
    }
    return;
  }
  if (d.type === 'pickup') {
    d.t += dt;
    if (d.t > 6) d.gone = true;
    return;
  }
  const T = TYPES[d.type];
  d.flash = Math.max(0, d.flash - dt);
  d.roar = Math.max(0, d.roar - dt);

  if (d.attract) {
    d.u += d.dir * dt * 0.35 * T.speed;
    d.phase += dt * 7 * Math.min(1.4, T.speed);
    if (Math.abs(d.u) > 3.5) d.gone = true;
    if (T.kind === 'flyer') d.y = d.baseY + Math.sin(game.t * 2 + d.id * 10) * 0.2;
    return;
  }
  if (!playing) return;

  if (T.boss) return updateBoss(d, dt);

  let moving = true;
  if (T.spits && d.spits < 2 && d.z <= d.stopZ) {
    moving = false;
    d.spitCd += dt;
    d.frill = Math.min(1, d.spitCd * 2);
    d.mouth = d.spitCd > 0.7 ? 0.08 : 0;
    if (d.spitCd > 1.0) {
      sfx.spit();
      spawnGlob(d);
      d.spits++;
      d.spitCd = 0;
      d.stopZ = d.z - 2.5;
      d.frill = 0;
      d.mouth = 0;
    }
  }
  if (moving) {
    d.z -= d.speed * dt;
    d.zigT += dt;
    const du = Math.sin(d.zigT * (1.2 + T.zig)) * T.zig * 0.35 * dt;
    d.u = Math.max(-1, Math.min(1, d.u + du));
    if (Math.abs(du) > 0.0005) d.dir = du > 0 ? 1 : -1;
    d.phase += dt * 7 * Math.min(1.5, d.speed);
  }
  if (T.kind === 'flyer') {
    const near = Math.max(0, Math.min(1, (d.z - Z_ATTACK) / 6));
    d.y = view.camH + (d.baseY - view.camH) * near + Math.sin(game.t * 2.5 + d.id * 10) * 0.25 * near;
    d.mouth = d.z < Z_ATTACK + 1.2 ? 0.1 : 0;
  }
  if (d.z < Z_ATTACK + 0.8 && !d.roared) { d.roared = true; d.roar = 0.5; sfx.roar(false); }
  if (d.z <= Z_ATTACK) {
    d.gone = true;
    attackFx();
    hurtPlayer(1);
  }
}

function updateBoss(d, dt) {
  d.hurtPush = Math.max(0, (d.hurtPush || 0) - dt);
  if (d.retreat > 0) {
    d.retreat -= dt;
    d.z += dt * 2.4;
    d.phase -= dt * 4;
    return;
  }
  d.nextRoar -= dt;
  if (d.nextRoar <= 0 && d.z > 6) { d.roar = 1.0; d.nextRoar = 5 + Math.random() * 3; sfx.roar(true); game.shake = 8; return; }
  if (d.roar > 0) return;
  d.z -= d.speed * dt * (1 - Math.min(0.8, d.hurtPush * 2));
  d.zigT += dt;
  d.u = Math.sin(d.zigT * 0.6) * 0.35;
  d.dir = Math.cos(d.zigT * 0.6) > 0 ? 1 : -1;
  const ph = d.phase;
  d.phase += dt * 4;
  if (Math.floor(ph / Math.PI) !== Math.floor(d.phase / Math.PI) && d.z < 9) game.shake = Math.max(game.shake, 3);
  if (d.z <= Z_BOSS_ATTACK) {
    d.roar = 0.6;
    attackFx();
    hurtPlayer(2);
    d.retreat = 1.6;
  }
}

function attackFx() {
  game.slashes.push({ t: 0, x: view.W * (0.3 + Math.random() * 0.4), y: view.H * (0.3 + Math.random() * 0.3), a: -0.6 + Math.random() * 0.3 });
}

// ---------- рисуване ----------
function dinoScreen(d) {
  const T = TYPES[d.type];
  const q = proj(dinoX(d), T.kind === 'flyer' ? d.y : 0, d.z);
  q.dir = d.dir;
  return q;
}
function globPos(d) {
  const f = Math.max(0, Math.min(1, (d.z0 - d.z) / (d.z0 - 0.9)));
  return proj(d.x0 * (1 - f), d.y0 + (view.camH - d.y0) * f + Math.sin(f * Math.PI) * 0.5, Math.max(0.9, d.z));
}
function pickupPos(d) {
  const x = d.side * (3 - d.t);
  return proj(x, 1.6 - d.t * 0.1 + Math.sin(d.t * 3) * 0.08, d.z);
}

function render(dt) {
  const { W, H, dpr } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.save();
  if (game.shake > 0) ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  const bob = Math.sin(game.travel * 5) * 2;
  ctx.translate(0, bob);
  drawBackground(ctx, view, theme, game.t, game.travel);

  const items = [];
  for (const pr of game.props) items.push({ z: pr.z, draw: () => drawPropAt(pr) });
  for (const d of game.dinos) items.push({ z: d.z, draw: () => drawEntity(d) });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.draw();

  drawAmbient(ctx, view, theme, ambient, game.t, dt);
  drawForeground(ctx, view, theme, game.t);
  ctx.restore();

  if (theme.dark && game.state !== 'title') drawDarkness();

  // отблясъци от изстрели
  for (const f of game.flashes) {
    if (f.big) {
      ctx.fillStyle = `rgba(255,240,200,${0.8 * (1 - f.t / 0.6)})`;
      ctx.fillRect(0, 0, W, H);
    } else {
      const a = 1 - f.t / 0.12;
      ctx.fillStyle = `rgba(255,230,120,${a})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, 14 + (1 - a) * 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const an = i * Math.PI / 3 + f.x;
        ctx.beginPath(); ctx.moveTo(f.x + Math.cos(an) * 10, f.y + Math.sin(an) * 10);
        ctx.lineTo(f.x + Math.cos(an) * 30, f.y + Math.sin(an) * 30); ctx.stroke();
      }
    }
  }
  for (const p of game.parts) {
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col;
    if (p.kind === 'star') drawStar(ctx, p.x, p.y, p.r, p.t * 8);
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t * 2), 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;

  // пръски киселина от дилофозаврите
  for (const s of game.splats) {
    const a = Math.min(1, 2 - s.t) * 0.75;
    ctx.fillStyle = `rgba(140,220,60,${a})`;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const an = i / 12 * Math.PI * 2;
      const rr = s.r * (0.6 + 0.4 * Math.sin(i * 7.3 + s.r));
      ctx.lineTo(s.x + Math.cos(an) * rr, s.y + Math.sin(an) * rr + s.t * 30);
    }
    ctx.fill();
  }
  // следи от нокти
  for (const s of game.slashes) {
    const a = 1 - s.t;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.a);
    ctx.strokeStyle = `rgba(160,0,0,${a * 0.85})`;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(-W * 0.2, i * 50); ctx.quadraticCurveTo(0, i * 50 + 20, W * 0.2, i * 50 - 10); ctx.stroke();
    }
    ctx.restore();
  }
  if (game.hurt > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(255,0,0,0)');
    g.addColorStop(1, `rgba(255,0,0,${game.hurt})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  for (const p of game.popups) {
    const a = 1 - Math.max(0, p.t - 0.6) / 0.5;
    ctx.globalAlpha = a;
    text(p.text, p.x, p.y - p.t * 50, p.small ? 12 : 16, p.col, 'center');
  }
  ctx.globalAlpha = 1;

  if (game.state !== 'title' && game.state !== 'over') drawHud();
  if (game.banner) drawBanner();
  if (game.state === 'clear') drawClear();
  if (game.state === 'continue') drawContinue();
}

function drawPropAt(pr) {
  const q = proj(pr.x, 0, pr.z);
  if (q.sx < -q.s * 4 || q.sx > view.W + q.s * 4) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (16 - pr.z) / 3);
  ctx.translate(q.sx, q.sy);
  const sc = q.s * pr.size;
  ctx.scale(sc, sc);
  drawProp(ctx, pr, theme);
  ctx.restore();
}

function drawEntity(d) {
  if (d.type === 'glob') {
    const q = globPos(d);
    const a = d.dead ? 1 - d.deathT * 3 : 1;
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const r = 0.18 * q.s;
    const g = ctx.createRadialGradient(q.sx - r * 0.3, q.sy - r * 0.3, r * 0.1, q.sx, q.sy, r);
    g.addColorStop(0, '#e8ff9a'); g.addColorStop(1, '#4caf1a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(q.sx, q.sy, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  if (d.type === 'pickup') {
    if (d.dead) return;
    const q = pickupPos(d);
    const s = q.s;
    ctx.save();
    ctx.translate(q.sx, q.sy);
    // парашут
    ctx.fillStyle = d.what === 'med' ? '#ffffff' : '#ffcf33';
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.02 * s;
    ctx.beginPath(); ctx.arc(0, -0.55 * s, 0.4 * s, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.4 * s, -0.55 * s); ctx.lineTo(-0.15 * s, -0.15 * s); ctx.moveTo(0.4 * s, -0.55 * s); ctx.lineTo(0.15 * s, -0.15 * s); ctx.stroke();
    ctx.fillStyle = d.what === 'med' ? '#e8e8e8' : '#8a5a2a';
    ctx.fillRect(-0.18 * s, -0.18 * s, 0.36 * s, 0.34 * s);
    ctx.strokeRect(-0.18 * s, -0.18 * s, 0.36 * s, 0.34 * s);
    if (d.what === 'med') {
      ctx.fillStyle = '#e53935';
      ctx.fillRect(-0.04 * s, -0.12 * s, 0.08 * s, 0.22 * s);
      ctx.fillRect(-0.11 * s, -0.05 * s, 0.22 * s, 0.08 * s);
    } else {
      ctx.fillStyle = '#d32f2f';
      ctx.font = `bold ${Math.round(0.14 * s)}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('TNT', 0, 0);
    }
    ctx.restore();
    return;
  }
  const T = TYPES[d.type];
  const q = dinoScreen(d);
  if (q.sx < -q.s * 3 || q.sx > view.W + q.s * 3) return;
  const sc = q.s * T.size;
  ctx.save();
  let alpha = Math.min(1, (Z_SPAWN + 2 - d.z) / 2.5);
  // сянка
  if (T.kind !== 'flyer') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(q.sx, q.sy, sc * 0.6, sc * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    const g = proj(dinoX(d), 0, d.z);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(g.sx, g.sy, sc * 0.4, sc * 0.05, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.translate(q.sx, q.sy);
  if (d.dead) {
    const k = Math.min(1, d.deathT / 0.5);
    alpha *= 1 - Math.max(0, d.deathT - 0.6) / 0.6;
    ctx.rotate(-k * 1.3 * d.dir);
    ctx.translate(0, k * sc * 0.1);
  }
  if (T.boss && d.roar > 0) ctx.translate(Math.sin(game.t * 60) * sc * 0.01, 0);
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.scale(sc * d.dir, sc);
  drawDino(ctx, d);
  ctx.restore();
  if (T.boss && d.dead && d.deathT < 0.05) game.shake = 20;
}

function drawDarkness() {
  const { W, H } = view;
  const k = 0.5;
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.globalCompositeOperation = 'source-over';
  dctx.clearRect(0, 0, dark.width, dark.height);
  dctx.fillStyle = 'rgba(2,4,18,0.88)';
  dctx.fillRect(0, 0, dark.width, dark.height);
  dctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, s = 1) => {
    const g = dctx.createRadialGradient(x * k, y * k, 0, x * k, y * k, r * k);
    g.addColorStop(0, `rgba(0,0,0,${s})`);
    g.addColorStop(0.6, `rgba(0,0,0,${s * 0.7})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g;
    dctx.beginPath(); dctx.arc(x * k, y * k, r * k, 0, Math.PI * 2); dctx.fill();
  };
  const R = Math.min(W, H) * 0.26;
  for (const c of crosshairs()) if (c.visible) hole(c.x, c.y, R);
  for (const f of game.flashes) hole(f.x, f.y, f.big ? Math.max(W, H) : R * 2.2);
  for (const p of game.parts) if (p.kind === 'puff' && p.t < 0.2) hole(p.x, p.y, 60, 0.5);
  hole(W / 2, H, R * 1.4, 0.4);
  ctx.drawImage(dark, 0, 0, W, H);
  // светещи очи
  for (const d of game.dinos) {
    if (d.dead || !TYPES[d.type]) continue;
    const T = TYPES[d.type];
    const q = dinoScreen(d);
    const [ex, ey] = eyePos(d);
    const sc = q.s * T.size;
    const x = q.sx + ex * sc * d.dir, y = q.sy + ey * sc;
    const r = Math.max(2, sc * 0.035);
    ctx.fillStyle = 'rgba(255,220,60,0.35)';
    ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe14d';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawStar(c, x, y, r, rot) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath(); c.fill();
}

function text(s, x, y, size, col, align = 'left', c = ctx) {
  c.font = `${size}px "Press Start 2P", monospace`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = '#000';
  c.fillText(s, x + Math.max(2, size / 8), y + Math.max(2, size / 8));
  c.fillStyle = col;
  c.fillText(s, x, y);
}
const fmt = n => String(n).padStart(6, '0');

function drawHud() {
  const { W, H } = view;
  const sm = W < 560;
  const fs = sm ? 10 : 14;
  const top = sm ? 22 : 28;
  game.players.forEach((p, i) => {
    const right = i === 1;
    const x = right ? W - 16 : 16;
    const al = right ? 'right' : 'left';
    text(`${i + 1}UP`, x, top, fs, p.color, al);
    text(fmt(p.score), x, top + fs + 8, fs, '#ffffff', al);
    if (p.combo >= 5) text(`x${comboMult(p)} КОМБО`, x, top + fs * 2 + 16, fs * 0.8, '#ff9f1a', al);
    // патрони
    const bw = sm ? 9 : 12, bh = sm ? 22 : 30, gap = sm ? 5 : 7;
    for (let k = 0; k < MAX_AMMO; k++) {
      const bx = right ? W - 16 - (k + 1) * (bw + gap) : 16 + k * (bw + gap);
      const by = H - 16 - bh;
      const full = k < p.ammo;
      ctx.fillStyle = full ? '#d4a017' : 'rgba(255,255,255,0.18)';
      ctx.fillRect(bx, by + bh * 0.3, bw, bh * 0.7);
      ctx.fillStyle = full ? '#b87333' : 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.moveTo(bx, by + bh * 0.3); ctx.lineTo(bx + bw / 2, by); ctx.lineTo(bx + bw, by + bh * 0.3); ctx.fill();
    }
    if (p.ammo === 0 && p.reload <= 0 && Math.floor(game.t * 3) % 2 === 0) {
      const hint = game.inputMode === 'hand' ? 'ИЗВЕДИ РЪКАТА ИЗВЪН ЕКРАНА' : (mouse.touch ? 'ДОКОСНИ ↻' : 'ДЕСЕН БУТОН');
      text('ПРЕЗАРЕДИ! ' + hint, right ? W - 16 : 16, H - 30 - bh - 12, sm ? 8 : 11, '#ffe14d', al);
    }
  });
  if (game.players.length === 1) {
    const hi = Math.max(highScores[0] ? highScores[0].score : 0, game.players[0].score);
    text('РЕКОРД', W - 16, top, fs, '#ffe14d', 'right');
    text(fmt(hi), W - 16, top + fs + 8, fs, '#ffffff', 'right');
  }
  // животи
  const hs = sm ? 16 : 22;
  const hx0 = W / 2 - (MAX_HEALTH * (hs + 6)) / 2;
  for (let k = 0; k < MAX_HEALTH; k++) heart(hx0 + k * (hs + 6) + hs / 2, top + 4, hs, k < game.health);
  // шефът
  if (game.boss && !game.boss.dead) {
    const b = game.boss;
    const bw = Math.min(W * 0.5, 420), bx = W / 2 - bw / 2, by = top + hs + 8;
    text(b.name, W / 2, by + 6, sm ? 8 : 10, '#ff6b6b', 'center');
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, by + 16, bw, 12);
    ctx.fillStyle = '#e53935'; ctx.fillRect(bx + 2, by + 18, (bw - 4) * Math.max(0, b.hp / b.maxHp), 8);
  } else if (game.state === 'play' && !game.bossOut) {
    const S = STAGES[game.stage];
    const prog = Math.min(1, game.stageT / S.duration);
    const bw = Math.min(W * 0.3, 200), bx = W / 2 - bw / 2, by = top + hs + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx, by, bw, 6);
    ctx.fillStyle = '#ffe14d'; ctx.fillRect(bx, by, bw * prog, 6);
    ctx.font = `${hs * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🦖', bx + bw + 14, by + 4);
  }
  if (!sm) text('СВОБОДНА ИГРА', W / 2, H - 14, 8, 'rgba(255,255,255,0.6)', 'center');
}

function heart(x, y, s, full) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 20, s / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-12, -2, -8, -12, 0, -5);
  ctx.bezierCurveTo(8, -12, 12, -2, 0, 6);
  ctx.fillStyle = full ? '#ff3b5c' : 'rgba(0,0,0,0.45)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = full ? '#fff' : 'rgba(255,255,255,0.4)';
  ctx.stroke();
  ctx.restore();
}

function drawBanner() {
  const b = game.banner;
  const { W, H } = view;
  const a = Math.min(1, b.t * 4, (b.dur - b.t) * 4);
  ctx.globalAlpha = Math.max(0, a);
  ctx.fillStyle = b.warn ? 'rgba(120,0,0,0.55)' : 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, H * 0.36, W, H * 0.24);
  const big = Math.min(40, W / 14);
  if (!b.warn || Math.floor(b.t * 4) % 2 === 0) text(b.title, W / 2, H * 0.44, big, b.warn ? '#ff4d4d' : '#ffe14d', 'center');
  text(b.sub, W / 2, H * 0.53, big * 0.55, '#ffffff', 'center');
  ctx.globalAlpha = 1;
}

function drawClear() {
  const { W, H } = view;
  const c = game.clearInfo;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  const big = Math.min(34, W / 16);
  text('ЕТАПЪТ Е ИЗЧИСТЕН!', W / 2, H * 0.28, big, '#ffe14d', 'center');
  c.info.forEach((inf, i) => {
    const y = H * 0.42 + i * big * 3.4;
    const pre = game.players.length > 1 ? `P${i + 1}  ` : '';
    text(`${pre}ТОЧНОСТ ${Math.round(inf.acc * 100)}%  +${inf.accBonus}`, W / 2, y, big * 0.5, game.players[i].color, 'center');
    text(`ЖИВОТИ ${game.health} x 500  +${inf.hpBonus}`, W / 2, y + big * 1.2, big * 0.5, '#fff', 'center');
  });
  if (c.t > 1.5 && Math.floor(c.t * 2) % 2 === 0) text('СТРЕЛЯЙ, ЗА ДА ПРОДЪЛЖИШ', W / 2, H * 0.8, big * 0.5, '#fff', 'center');
}

function drawContinue() {
  const { W, H } = view;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);
  const big = Math.min(44, W / 12);
  text('ПРОДЪЛЖАВАШ ЛИ?', W / 2, H * 0.32, big * 0.7, '#ffe14d', 'center');
  text(String(Math.max(0, Math.floor(game.continueT))), W / 2, H * 0.5, big * 2, '#ff4d4d', 'center');
  if (Math.floor(game.t * 2) % 2 === 0) text('СТРЕЛЯЙ!', W / 2, H * 0.7, big * 0.6, '#ffffff', 'center');
}

// ---------- мерници ----------
function crosshairs() {
  const list = [];
  if (inTennis() && !menuOpen()) return list;
  if (game.inputMode === 'hand') {
    for (const p of hand.pointers()) {
      if (p.slot >= (game.state === 'title' || menuOpen() ? 2 : Math.max(1, game.players.length))) continue;
      list.push({ id: 'h' + p.slot, slot: p.slot, x: p.x * view.W, y: p.y * view.H, visible: p.visible && !p.offscreen, trigger: p.trigger, source: 'hand' });
    }
  }
  if (performance.now() / 1000 - mouse.seen < 4 && !mouse.touch) list.push({ id: 'm', slot: 0, x: mouse.x, y: mouse.y, visible: true, trigger: 0, source: 'mouse' });
  return list;
}

function drawCursor() {
  const { W, H, dpr } = view;
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cctx.clearRect(0, 0, W, H);
  const inMenu = menuOpen();
  for (const c of crosshairs()) {
    if (!c.visible) continue;
    if (c.source === 'mouse' && inMenu) continue;
    const col = PLAYER_COLORS[c.slot] || '#fff';
    const p = game.players[c.slot];
    const r = 22 - c.trigger * 8;
    cctx.lineWidth = 3;
    cctx.strokeStyle = '#000';
    ring(c.x, c.y, r + 1.5);
    cctx.strokeStyle = col;
    cctx.lineWidth = 3;
    ring(c.x, c.y, r);
    cctx.beginPath();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      cctx.moveTo(c.x + dx * (r - 6), c.y + dy * (r - 6));
      cctx.lineTo(c.x + dx * (r + 10), c.y + dy * (r + 10));
    }
    cctx.stroke();
    cctx.fillStyle = col;
    cctx.beginPath(); cctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2); cctx.fill();
    if (p && p.hitMark > 0) {
      cctx.strokeStyle = '#fff';
      cctx.lineWidth = 3;
      cctx.beginPath();
      for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        cctx.moveTo(c.x + dx * 8, c.y + dy * 8); cctx.lineTo(c.x + dx * 16, c.y + dy * 16);
      }
      cctx.stroke();
    }
    if (p && p.reload > 0 && game.state === 'play') {
      cctx.strokeStyle = '#ffe14d';
      cctx.lineWidth = 4;
      cctx.beginPath(); cctx.arc(c.x, c.y, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p.reload / 0.45)); cctx.stroke();
    }
    const dw = dwell.get(c.id);
    if (dw && dw.el && inMenu) {
      cctx.strokeStyle = '#ffffff';
      cctx.lineWidth = 5;
      cctx.beginPath(); cctx.arc(c.x, c.y, r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, dw.t / DWELL)); cctx.stroke();
    }
    if (game.players.length > 1 || (inMenu && c.source === 'hand' && settings.players > 1)) text(`P${c.slot + 1}`, c.x + r + 6, c.y - r - 4, 9, col, 'left', cctx);
  }
}
function ring(x, y, r) { cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.stroke(); }

// ---------- менюта и насочване с ръка ----------
const DWELL = 1.4;
function menuOpen() { return !!document.querySelector('.screen.active'); }

function shootable(el) {
  if (!el) return null;
  const b = el.closest('button, [data-shoot]');
  if (!b || b.disabled || b.closest('[hidden]')) return null;
  return b;
}

function updateDwell(dt) {
  const inMenu = menuOpen();
  const seen = new Set();
  for (const c of crosshairs()) {
    if (c.source !== 'hand') continue;
    seen.add(c.id);
    let d = dwell.get(c.id);
    if (!d) { d = { el: null, t: 0 }; dwell.set(c.id, d); }
    const el = inMenu && c.visible ? shootable(document.elementFromPoint(c.x, c.y)) : null;
    if (el !== d.el) {
      if (d.el) d.el.classList.remove('aim-hover');
      d.el = el; d.t = 0;
      if (el) el.classList.add('aim-hover');
    } else if (el) {
      d.t += dt;
      if (d.t >= DWELL) { d.t = -1.2; activate(el, c); }
    }
  }
  for (const [id, d] of dwell) if (!seen.has(id)) { if (d.el) d.el.classList.remove('aim-hover'); dwell.delete(id); }
}

function activate(el, c) {
  initAudio();
  if (el.hasAttribute('data-calibrate') && c) {
    const raw = hand.tracks.find(t => t.slot === c.slot);
    const r = el.getBoundingClientRect();
    const target = { x: (r.left + r.width / 2) / view.W, y: (r.top + r.height / 2) / view.H };
    const src = (raw && raw.lastFireRaw) || (raw && { x: raw.rawX, y: raw.rawY });
    if (src) {
      hand.calibrate(src, target.x, target.y);
      settings.center = { ...hand.center };
      saveSettings();
    }
  }
  sfx.shot();
  el.classList.add('shot');
  setTimeout(() => el.classList.remove('shot'), 200);
  el.click();
}

hand.onFire = (slot, nx, ny) => {
  const x = nx * view.W, y = ny * view.H;
  if (menuOpen()) {
    const el = shootable(document.elementFromPoint(x, y));
    const c = { slot };
    if (el) activate(el, c); else sfx.shot();
    game.flashes.push({ x, y, t: 0, r: 80 });
    return;
  }
  fire(slot, x, y, 'hand');
};
hand.onReload = slot => {
  if (!menuOpen()) reload(slot);
};

// ---------- мишка и докосване ----------
canvas.addEventListener('pointermove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = performance.now() / 1000;
  mouse.touch = e.pointerType === 'touch';
  if (game.state === 'tennis') tennis.feedPointer(e.clientX / view.W, e.clientY / view.H);
});
window.addEventListener('pointermove', e => {
  if (e.pointerType !== 'touch') { mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = performance.now() / 1000; mouse.touch = false; }
});
canvas.addEventListener('pointerdown', e => {
  initAudio();
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = performance.now() / 1000;
  mouse.touch = e.pointerType === 'touch';
  document.body.classList.toggle('touch', mouse.touch);
  if (e.button === 2) { reload(0); return; }
  fire(0, e.clientX, e.clientY, mouse.touch ? 'touch' : 'mouse');
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
// браузърите пускат звук само след жест на потребителя — отключи при всяко докосване или клавиш
for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, () => initAudio(), { passive: true });
$('#reloadBtn').addEventListener('pointerdown', e => { e.stopPropagation(); reload(0); });
$('#pauseBtn').addEventListener('click', () => togglePause());

window.addEventListener('keydown', e => {
  if (!$('#initials').hidden && $('#scr-over').classList.contains('active')) {
    if (initialsKey(e)) return;
  }
  if (game.state === 'tennis' && !game.paused && tennis.key(e)) { e.preventDefault(); return; }
  const k = e.key.toLowerCase();
  if (k === 'r' || k === 'к') reload(0);
  else if (k === 'p' || k === 'escape' || k === 'п') togglePause();
  else if (k === 'm' || k === 'м') toggleMute();
  else if (k === ' ' && (game.state === 'continue' || game.state === 'clear')) fire(0, view.W / 2, view.H / 2, 'key');
});
document.addEventListener('visibilitychange', () => { if (document.hidden && (game.state === 'play' || game.state === 'tennis') && !game.paused) togglePause(); });

function togglePause() {
  if (game.state === 'title' || game.state === 'over' || game.state === 'tennis-over') return;
  if (game.paused) { game.paused = false; showScreen(null); }
  else { game.paused = true; showScreen('scr-pause'); }
}
function toggleMute() {
  settings.muted = !settings.muted;
  setMuted(settings.muted);
  saveSettings();
  syncButtons();
}

// ---------- екрани ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('in-menu', !!id);
  document.body.classList.toggle('in-play', !id);
  if (id === 'scr-setup') placeCam('setup'); else placeCam('mini');
}

function placeCam(where) {
  const slot = where === 'setup' ? $('#cam-slot') : $('#cam-dock');
  if (camWrap.parentElement !== slot) {
    slot.appendChild(camWrap);
    if (video.srcObject) video.play().catch(() => {});
  }
  camWrap.hidden = game.inputMode !== 'hand' && where !== 'setup';
}

function goTitle() {
  game.state = 'title';
  document.body.classList.remove('mode-tennis');
  game.paused = false;
  game.players = [];
  game.dinos = [];
  game.bossOut = false;
  game.boss = null;
  game.banner = null;
  game.spawnT = 0;
  setTheme('jungle');
  stopMusic();
  showScreen('scr-title');
}

function syncButtons() {
  document.querySelectorAll('[data-players]').forEach(b => b.classList.toggle('on', +b.dataset.players === settings.players));
  $('#soundBtn').textContent = settings.muted ? 'ЗВУК: ИЗКЛ' : 'ЗВУК: ВКЛ';
  $('#musicBtn').textContent = settings.music ? 'МУЗИКА: ВКЛ' : 'МУЗИКА: ИЗКЛ';
  $('#triggerBtn').textContent = settings.autoFire ? 'СПУСЪК: АВТОМАТИЧНО' : 'СПУСЪК: ПАЛЕЦ';
  $('#gain').value = settings.gain;
  $('#gainVal').textContent = settings.gain.toFixed(1);
  document.querySelectorAll('[data-level]').forEach(b => b.classList.toggle('on', b.dataset.level === settings.tennisLevel));
  const hs = highScores[0];
  $('#title-hi').textContent = hs ? `РЕКОРД ${fmt(hs.score)} · ${hs.name}` : '';
}

function renderScores(el) {
  el.innerHTML = highScores.map((h, i) =>
    `<tr><td>${i + 1}.</td><td>${escapeHtml(h.name)}</td><td>${fmt(h.score)}</td></tr>`).join('');
}
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// инициали за таблицата
const ALPHA = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЮЯ0123456789'.split('');
let initials = ['А', 'А', 'А'];
let slot = 0;
let pendingScore = 0;
function renderInitials() {
  document.querySelectorAll('.ini-letter').forEach((el, i) => {
    el.textContent = initials[i];
    el.classList.toggle('cur', i === slot);
  });
}
function stepLetter(i, d) {
  const k = ALPHA.indexOf(initials[i]);
  initials[i] = ALPHA[(k + d + ALPHA.length) % ALPHA.length];
  slot = i;
  sfx.select();
  renderInitials();
}
function initialsKey(e) {
  if (e.key === 'Enter') { saveInitials(); return true; }
  if (e.key === 'Backspace') { slot = Math.max(0, slot - 1); renderInitials(); return true; }
  const ch = e.key.toUpperCase();
  const map = { A: 'А', B: 'Б', V: 'В', G: 'Г', D: 'Д', E: 'Е', Z: 'З', I: 'И', K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П', R: 'Р', S: 'С', T: 'Т', U: 'У', F: 'Ф', H: 'Х', C: 'Ц' };
  const letter = ALPHA.includes(ch) ? ch : map[ch];
  if (letter && e.key.length === 1) {
    initials[slot] = letter;
    slot = Math.min(2, slot + 1);
    sfx.select();
    renderInitials();
    return true;
  }
  return false;
}
function saveInitials() {
  highScores.push({ name: initials.join(''), score: pendingScore });
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 5);
  store.set('scores', highScores);
  $('#initials').hidden = true;
  $('#over-table-wrap').hidden = false;
  renderScores($('#over-table'));
  sfx.coin();
}

// ---------- бутони ----------
document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  initAudio();
  const a = b.dataset.action;
  if (a !== 'fire-start') sfx.select();
  switch (a) {
    case 'hand': game.inputMode = 'hand'; showScreen('scr-setup'); startHand(); break;
    case 'mouse': game.inputMode = 'mouse'; startGame(); break;
    case 'fire-start': startGame(); break;
    case 'players': settings.players = +b.dataset.players; saveSettings(); syncButtons(); if (hand.landmarker) hand.setNumHands(settings.players); break;
    case 'sound': toggleMute(); break;
    case 'music': settings.music = !settings.music; setMusic(settings.music); saveSettings(); syncButtons(); break;
    case 'trigger': settings.autoFire = !settings.autoFire; hand.autoFire = settings.autoFire; saveSettings(); syncButtons(); break;
    case 'recenter': settings.center = { x: 0.5, y: 0.5 }; hand.center = { x: 0.5, y: 0.5 }; saveSettings(); break;
    case 'how': showScreen('scr-how'); break;
    case 'scores': renderScores($('#scores-table')); showScreen('scr-scores'); break;
    case 'back': showScreen(game.paused ? 'scr-pause' : 'scr-title'); break;
    case 'resume': togglePause(); break;
    case 'setup': showScreen('scr-setup'); startHand(); break;
    case 'quit': goTitle(); break;
    case 'up': stepLetter(+b.dataset.i, -1); break;
    case 'down': stepLetter(+b.dataset.i, 1); break;
    case 'ini-ok': saveInitials(); break;
    case 'again': startGame(); break;
    case 'title': goTitle(); break;
    case 'tennis': syncButtons(); showScreen('scr-tennis'); break;
    case 'tlevel': settings.tennisLevel = b.dataset.level; saveSettings(); syncButtons(); break;
    case 'tennis-hand': startTennisHand(); break;
    case 'tennis-mouse': startTennis('mouse'); break;
    case 'tennis-again': startTennis(game.inputMode === 'hand' ? 'hand' : 'mouse'); break;
    default: break;
  }
});

$('#gain').addEventListener('input', e => {
  settings.gain = +e.target.value;
  hand.gain = settings.gain;
  $('#gainVal').textContent = settings.gain.toFixed(1);
  saveSettings();
});

async function startHand() {
  const st = $('#setup-status');
  st.classList.remove('err');
  $('#setup-go').disabled = true;
  try {
    await hand.start(settings.players, msg => { st.textContent = msg; });
    $('#setup-go').disabled = false;
    $('#title-hand').textContent = '✋ ИГРАЙ С РЪКА';
  } catch (err) {
    st.classList.add('err');
    const name = err && err.name;
    if (name === 'NotAllowedError') st.textContent = 'Няма разрешение за камерата. Разреши я от иконата в адресната лента и опитай пак — или играй с мишка.';
    else if (name === 'NotFoundError') st.textContent = 'Не намирам камера. Играй с мишка или с пръст по екрана.';
    else st.textContent = 'Нещо не стана: ' + (err && err.message ? err.message : err) + ' Провери интернета или играй с мишка.';
    game.inputMode = 'mouse';
  }
}

function updateSetupMeter() {
  if (!$('#scr-setup').classList.contains('active')) return;
  const ps = hand.pointers();
  const meters = $('#meters');
  let html = '';
  for (let i = 0; i < settings.players; i++) {
    const p = ps.find(q => q.slot === i);
    const seen = p && p.visible;
    const lvl = seen ? Math.round(p.trigger * 100) : 0;
    html += `<div class="meter"><span style="color:${PLAYER_COLORS[i]}">P${i + 1}</span>
      <span class="m-state">${seen ? (p.trigger > 0.95 ? 'ПАФ!' : 'виждам ръката') : 'не виждам ръка'}</span>
      <span class="m-bar"><i style="width:${lvl}%"></i></span></div>`;
  }
  if (meters.innerHTML !== html) meters.innerHTML = html;
  $('#fps').textContent = hand.running ? `${Math.round(hand.fps)} кадъра/с` : '';
}

// ---------- тенис ----------
function startTennis(input) {
  initAudio();
  stopMusic();
  game.inputMode = input === 'hand' ? 'hand' : 'mouse';
  game.paused = false;
  game.state = 'tennis';
  game.players = [];
  document.body.classList.add('mode-tennis');
  showScreen(null);
  sfx.coin();
  tennis.start(settings.tennisLevel, input);
}

async function startTennisHand() {
  const st = $('#tennis-status');
  st.classList.remove('err');
  st.textContent = 'Пускам камерата…';
  try {
    await hand.start(1, msg => { st.textContent = msg; });
    await hand.setNumHands(1);
    st.textContent = '';
    startTennis('hand');
  } catch (err) {
    st.classList.add('err');
    const name = err && err.name;
    st.textContent = name === 'NotAllowedError' ? 'Няма разрешение за камерата. Разреши я и опитай пак — или играй с мишка.'
      : name === 'NotFoundError' ? 'Не намирам камера. Играй с мишка, пръст или стрелките.'
      : 'Нещо не стана: ' + (err && err.message ? err.message : err);
  }
}

function tennisEnd(score, stats) {
  game.state = 'tennis-over';
  const won = score.gMe > score.gAi;
  won ? sfx.stage() : sfx.over();
  $('#tover-title').textContent = won ? 'ПОБЕДА!' : 'ЗАГУБИ';
  $('#tover-score').textContent = `ГЕЙМОВЕ ${score.gMe} : ${score.gAi}`;
  $('#tover-stats').textContent = `${LEVELS[settings.tennisLevel].name} · удари ${stats.hits} от ${stats.swings} замаха · печеливши ${stats.winners}`;
  showScreen('scr-tover');
}

// ---------- главен цикъл ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (inTennis()) {
    if (!game.paused && game.state === 'tennis') tennis.update(dt);
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    tennis.render();
  } else {
    if (!game.paused) update(dt);
    render(game.paused ? 0 : dt);
  }
  updateDwell(dt);
  drawCursor();
  updateSetupMeter();
  requestAnimationFrame(frame);
}

// шрифтът трябва да е зареден, преди canvas да пише с него
(document.fonts ? document.fonts.load('16px "Press Start 2P"').catch(() => {}) : Promise.resolve()).finally(() => {
  setMuted(settings.muted);
  setMusic(settings.music);
  syncButtons();
  goTitle();
  requestAnimationFrame(frame);
});

// за тестове от конзолата
window.__dino = {
  game, hand, settings, tennis,
  aim() {
    const d = game.dinos.filter(o => !o.dead && o.type !== 'pickup').sort((x, y) => x.z - y.z)[0];
    if (!d) return null;
    if (d.type === 'glob') { const q = globPos(d); return { x: q.sx, y: q.sy }; }
    const T = TYPES[d.type], q = dinoScreen(d), [cx, cy] = hitCircles(d)[1];
    return { x: q.sx + cx * q.s * T.size * q.dir, y: q.sy + cy * q.s * T.size };
  },
};
