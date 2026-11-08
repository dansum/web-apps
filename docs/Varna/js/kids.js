// ВЕСЕЛО ГРАДЧЕ — много проста версия за деца на около 6 години.
// Няма пари, пътища и менюта. Къщата се усмихва, когато наблизо има всичко,
// от което хората имат нужда. Задачите са с малко думи и могат да се чуят на глас.
import { HW, HH, proj, poly, diamond, DRAW, TERRAIN } from './render.js';
import { EN, langSwitch, localizeDom } from './i18n.js';

localizeDom();

const K = 9; // картата е 9 × 9 квадратчета
const NEAR = 2.5; // „близо“ — до 2 квадратчета разстояние
const SAVE_KEY = 'varna-malki';

// Морето е на изток, както във Варна; до него има плаж.
const terrainAt = (i, j) => (i >= K - 2 + (j % 4 === 0 ? 1 : 0) ? 'sea' : i === K - 3 ? 'beach' : 'grass');

const PIECES = {
  house: { icon: '🏠', label: ['КЪЩА', 'HOUSE'] },
  school: { icon: '🏫', label: ['УЧИЛИЩЕ', 'SCHOOL'] },
  park: { icon: '🌳', label: ['ПАРК', 'PARK'] },
  shop: { icon: '🏪', label: ['МАГАЗИН', 'SHOP'] },
  clinic: { icon: '🏥', label: ['ЛЕКАР', 'DOCTOR'] },
  cathedral: { icon: '⛪', label: ['КАТЕДРАЛА', 'CATHEDRAL'] },
  erase: { icon: '🧽', label: ['МАХНИ', 'REMOVE'] },
};
const NEED_NAMES = {
  school: ['училище', 'a school'], park: ['парк', 'a park'], shop: ['магазин', 'a shop'], clinic: ['лекар', 'a doctor'],
};

// Седем задачи. show е краткият надпис, say — изречението, което се чете на глас.
const LEVELS = [
  { tools: ['house'], needs: [], icons: '🏠🏠🏠',
    show: ['СЛОЖИ 3 КЪЩИ', 'PUT 3 HOUSES'],
    say: ['Сложи три къщи. В тях ще живеят хора.', 'Put down three houses. People will live in them.'],
    done: c => c.houses >= 3 },
  { tools: ['house', 'school'], needs: ['school'], icons: '🏫',
    show: ['СЛОЖИ УЧИЛИЩЕ', 'PUT A SCHOOL'],
    say: ['Децата искат да учат. Сложи училище близо до къщите.', 'The children want to learn. Put a school close to the houses.'],
    done: c => c.houses >= 3 && c.happy === c.houses },
  { tools: ['house', 'school', 'park'], needs: ['school', 'park'], icons: '🌳',
    show: ['СЛОЖИ ПАРК', 'PUT A PARK'],
    say: ['Децата искат да играят. Сложи парк близо до къщите.', 'The children want to play. Put a park close to the houses.'],
    done: c => c.houses >= 3 && c.happy === c.houses },
  { tools: ['house', 'school', 'park', 'shop'], needs: ['school', 'park', 'shop'], icons: '🏪',
    show: ['СЛОЖИ МАГАЗИН', 'PUT A SHOP'],
    say: ['Хората искат да си купят хляб. Сложи магазин близо до къщите.', 'People want to buy bread. Put a shop close to the houses.'],
    done: c => c.houses >= 3 && c.happy === c.houses },
  { tools: ['house', 'school', 'park', 'shop', 'clinic'], needs: ['school', 'park', 'shop', 'clinic'], icons: '🏥',
    show: ['СЛОЖИ ЛЕКАР', 'PUT A DOCTOR'],
    say: ['Когато сме болни, ни трябва лекар. Сложи лекар близо до къщите.', 'When we are ill, we need a doctor. Put a doctor close to the houses.'],
    done: c => c.houses >= 3 && c.happy === c.houses },
  { tools: ['house', 'school', 'park', 'shop', 'clinic'], needs: ['school', 'park', 'shop', 'clinic'], icons: '😀😀😀😀😀😀',
    show: ['6 ВЕСЕЛИ КЪЩИ', '6 HAPPY HOUSES'],
    say: ['Сложи още къщи. Нека шест къщи да се усмихват.', 'Put down more houses. Make six houses smile.'],
    done: c => c.houses >= 6 && c.happy === c.houses },
  { tools: ['house', 'school', 'park', 'shop', 'clinic', 'cathedral'], needs: ['school', 'park', 'shop', 'clinic'], icons: '⛪',
    show: ['СЛОЖИ КАТЕДРАЛАТА', 'PUT THE CATHEDRAL'],
    say: ['Във Варна има голяма катедрала със златни кубета. Сложи я в твоя град!', 'Varna has a big cathedral with golden domes. Put it in your town!'],
    done: c => c.cathedral },
];
const FINAL = {
  show: ['БРАВО! ГРАДЪТ Е ВЕСЕЛ.', 'WELL DONE! THE TOWN IS HAPPY.'],
  say: ['Браво! Всички в твоя град са щастливи. Можеш да строиш още.', 'Well done! Everyone in your town is happy. You can keep building.'],
};
const L = pair => (EN ? pair[1] : pair[0]);

// ---------- състояние ----------
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } },
  set(v) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(v)); } catch (e) { /* няма значение */ } },
};
const fresh = () => ({ b: new Array(K * K).fill(null), level: 0, muted: false });
let s = fresh();
const saved = store.get();
if (saved && Array.isArray(saved.b) && saved.b.length === K * K) {
  s = { b: saved.b.map(t => (t && PIECES[t] && t !== 'erase' ? t : null)), level: Math.min(+saved.level || 0, LEVELS.length), muted: !!saved.muted };
}
const save = () => store.set(s);

let tool = 'house';
let hover = null;
const born = new Map(); // кога е сложена сградата — за анимацията
const idx = (i, j) => j * K + i;
const inside = (i, j) => i >= 0 && j >= 0 && i < K && j < K;

const level = () => LEVELS[Math.min(s.level, LEVELS.length - 1)];
const needs = () => (s.level >= LEVELS.length ? LEVELS[LEVELS.length - 1].needs : level().needs);
const tools = () => [...(s.level >= LEVELS.length ? LEVELS[LEVELS.length - 1].tools : level().tools), 'erase'];

function missing(i, j) {
  return needs().filter(n => !s.b.some((t, k) => t === n && Math.hypot(k % K - i, ((k / K) | 0) - j) <= NEAR));
}

function counts() {
  let houses = 0, happy = 0;
  s.b.forEach((t, k) => {
    if (t !== 'house') return;
    houses++;
    if (!missing(k % K, (k / K) | 0).length) happy++;
  });
  return { houses, happy, cathedral: s.b.includes('cathedral') };
}

// ---------- звук и глас ----------
let audio = null;
function beep(notes, type = 'triangle', len = 0.08) {
  if (s.muted) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach((f, n) => {
      const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + n * len;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.14, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + len * 1.8);
      o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + len * 2);
    });
  } catch (e) { /* без звук */ }
}

// Четем на глас само ако устройството има глас на нужния език — иначе българският текст
// би се прочел с английско произношение.
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const want = EN ? 'en' : 'bg';
  voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(want)) || null;
  document.getElementById('say').hidden = !voice;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener('voiceschanged', pickVoice);
} else document.getElementById('say').hidden = true;

function speak(pair) {
  if (s.muted || !voice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(L(pair));
  u.voice = voice; u.lang = voice.lang; u.rate = 0.9;
  speechSynthesis.speak(u);
}

// ---------- екран ----------
const canvas = document.getElementById('town');
const ctx = canvas.getContext('2d');
let cam = { x: 0, y: 0, z: 1 }, dpr = 1, W = 0, H = 0;

function fit() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const top = document.getElementById('task').getBoundingClientRect().bottom + 8;
  const bottom = document.getElementById('tools').getBoundingClientRect().top - 8;
  const mapW = K * HW * 2, mapH = K * HH * 2 + 60;
  // Част от морето може да излезе извън екрана — така квадратчетата на тесен телефон са по-големи.
  const z = Math.max(0.5, Math.min((W - 16) / (mapW * 0.84), (bottom - top) / mapH, 2.4));
  const [cx, cy] = proj(K / 2 - 1.3, K / 2);
  cam = { z, x: W / 2 - cx * z, y: (top + bottom) / 2 + 24 * z - cy * z };
}

function tileAt(e) {
  const r = canvas.getBoundingClientRect();
  const a = (e.clientX - r.left - cam.x) / cam.z / HW, b = (e.clientY - r.top - cam.y) / cam.z / HH;
  return { i: Math.floor((a + b) / 2), j: Math.floor((b - a) / 2) };
}

function bubble(x, y, text, size) {
  ctx.font = `${size}px sans-serif`;
  const w = ctx.measureText(text).width + 10, h = size + 8;
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = '#c9d0d6'; ctx.stroke();
  ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

function draw(now) {
  const t = now / 1000;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#2a86c4'; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * cam.x, dpr * cam.y);

  for (let j = 0; j < K; j++) {
    for (let i = 0; i < K; i++) {
      const ter = terrainAt(i, j);
      poly(ctx, diamond(i, j), TERRAIN[ter][(i + j) & 1], ter === 'sea' ? null : 'rgba(0,0,0,.06)');
      if (ter === 'sea' && (i * 7 + j * 3) % 4 === 0) {
        const [x, y] = proj(i + 0.5, j + 0.5), o = Math.sin(t * 1.5 + i + j) * 4;
        ctx.strokeStyle = 'rgba(255,255,255,.4)';
        ctx.beginPath(); ctx.moveTo(x - 9 + o, y); ctx.quadraticCurveTo(x - 4 + o, y - 3, x + o, y); ctx.stroke();
      }
    }
  }

  // Около избраната сграда светва кръгът „близо“, за да се види докъде стига.
  if (hover && inside(hover.i, hover.j) && tool !== 'erase' && tool !== 'house' && tool !== 'cathedral') {
    for (let j = 0; j < K; j++) {
      for (let i = 0; i < K; i++) {
        if (Math.hypot(i - hover.i, j - hover.j) <= NEAR) poly(ctx, diamond(i, j), 'rgba(255,255,255,.28)');
      }
    }
  }
  if (hover && inside(hover.i, hover.j)) {
    ctx.lineWidth = 3;
    poly(ctx, diamond(hover.i, hover.j), null, canPlace(tool, hover.i, hover.j) ? '#ffffff' : '#e03a3a');
    ctx.lineWidth = 1;
  }

  // Лодка, която плава по морето.
  const by = ((t * 0.35) % (K + 2)) - 1;
  const [bx, byy] = proj(K - 0.6, by);
  ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⛵', bx, byy - 6 + Math.sin(t * 2) * 2);

  for (let sum = 0; sum <= 2 * K - 2; sum++) {
    for (let i = Math.max(0, sum - K + 1); i <= Math.min(K - 1, sum); i++) {
      const j = sum - i, k = idx(i, j), b = s.b[k];
      if (!b) continue;
      const [x, y] = proj(i + 0.5, j + 0.5);
      const age = born.has(k) ? (now - born.get(k)) / 250 : 1;
      ctx.save();
      if (age < 1) {
        const sc = 0.4 + 0.6 * (1 - Math.pow(1 - age, 3)) + Math.sin(age * Math.PI) * 0.15;
        ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
      }
      DRAW[b](ctx, x, y, t, i, j);
      ctx.restore();
    }
  }

  // Лицата над къщите и какво им липсва.
  s.b.forEach((b, k) => {
    if (b !== 'house') return;
    const i = k % K, j = (k / K) | 0, [x, y] = proj(i + 0.5, j + 0.5);
    const miss = missing(i, j);
    const face = !miss.length ? '😀' : miss.length === needs().length ? '😟' : '🙂';
    const bob = Math.sin(t * 3 + k) * 1.5;
    ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(face, x, y - 44 + bob);
    if (miss.length) bubble(x + 6 + miss.length * 8, y - 66 + bob, miss.map(n => PIECES[n].icon).join(''), 13);
  });
}

function loop(now) { draw(now); requestAnimationFrame(loop); }

// ---------- задачи и бутони ----------
function renderTask() {
  const done = s.level >= LEVELS.length;
  document.getElementById('task-icons').textContent = done ? '🎉' : level().icons;
  document.getElementById('task-text').textContent = L(done ? FINAL.show : level().show);
  document.getElementById('stars').innerHTML = LEVELS.map((_, n) => `<span class="${n < s.level ? 'on' : ''}">⭐</span>`).join('');
  document.getElementById('sound').textContent = s.muted ? '🔇' : '🔊';
}

function renderTools() {
  if (!tools().includes(tool)) tool = 'house';
  const el = document.getElementById('tools');
  el.innerHTML = tools().map(id => {
    // Новата сграда в тази задача пулсира, за да се забележи.
    const prev = s.level > 0 && s.level < LEVELS.length ? LEVELS[s.level - 1].tools : ['house'];
    const p = PIECES[id], fresh = id !== 'erase' && s.level < LEVELS.length && !prev.includes(id);
    return `<button class="k-tool${id === tool ? ' on' : ''}${fresh ? ' new' : ''}" data-t="${id}"><span class="ic">${p.icon}</span><span class="nm">${L(p.label)}</span></button>`;
  }).join('');
  el.querySelectorAll('.k-tool').forEach(b => b.onclick = () => {
    tool = b.dataset.t; beep([660], 'sine', 0.05); renderTools();
  });
}

function canPlace(t, i, j) {
  if (!inside(i, j)) return false;
  if (t === 'erase') return !!s.b[idx(i, j)];
  return terrainAt(i, j) === 'grass' && !s.b[idx(i, j)] && !(t === 'cathedral' && s.b.includes('cathedral'));
}

function tap(i, j) {
  if (!inside(i, j)) return;
  const k = idx(i, j), here = s.b[k], ter = terrainAt(i, j);
  if (tool === 'erase') {
    if (!here) return;
    s.b[k] = null; born.delete(k);
    beep([300, 200], 'sawtooth', 0.06);
    return after();
  }
  if (here === 'house') {
    const miss = missing(i, j);
    if (!miss.length) speak(['Тази къща е весела!', 'This house is happy!']);
    else speak([`Тази къща иска ${miss.map(n => NEED_NAMES[n][0]).join(' и ')}.`, `This house wants ${miss.map(n => NEED_NAMES[n][1]).join(' and ')}.`]);
    return beep([520], 'sine', 0.06);
  }
  if (!canPlace(tool, i, j)) {
    beep([200, 150], 'square', 0.08);
    if (ter === 'sea') speak(['Там е морето.', 'That is the sea.']);
    else if (ter === 'beach') speak(['Плажът е за игра.', 'The beach is for playing.']);
    else if (here) speak(['Тук вече има нещо.', 'Something is already here.']);
    else if (tool === 'cathedral') speak(['Катедралата вече е тук.', 'The cathedral is already here.']);
    return;
  }
  s.b[k] = tool;
  born.set(k, performance.now());
  beep([520, 780], 'triangle', 0.06);
  after();
}

function after() {
  save();
  if (s.level < LEVELS.length && level().done(counts())) win();
}

function win() {
  s.level++;
  save();
  beep([523, 659, 784, 1047], 'triangle', 0.13);
  const done = s.level >= LEVELS.length;
  document.getElementById('win-stars').innerHTML = LEVELS.map((_, n) => `<span class="${n < s.level ? 'on' : ''}${n === s.level - 1 ? ' fresh' : ''}">⭐</span>`).join('');
  document.getElementById('win-text').textContent = L(done ? FINAL.show : ['БРАВО!', 'WELL DONE!']);
  document.getElementById('win').hidden = false;
  speak(done ? FINAL.say : ['Браво!', 'Well done!']);
}

document.getElementById('win-go').onclick = () => {
  document.getElementById('win').hidden = true;
  renderTask(); renderTools(); fit();
  speak(s.level >= LEVELS.length ? FINAL.say : level().say);
};

document.getElementById('start-go').onclick = () => {
  document.getElementById('start').hidden = true;
  beep([523, 784], 'triangle', 0.08);
  speak(s.level >= LEVELS.length ? FINAL.say : level().say);
};
document.getElementById('reset').onclick = () => {
  s = { ...fresh(), muted: s.muted };
  born.clear(); save(); renderTask(); renderTools();
  document.getElementById('start').hidden = true;
  speak(level().say);
};
document.getElementById('say').onclick = () => speak(s.level >= LEVELS.length ? FINAL.say : level().say);
document.getElementById('sound').onclick = () => {
  s.muted = !s.muted; save(); renderTask();
  if (s.muted && 'speechSynthesis' in window) speechSynthesis.cancel();
};
langSwitch(document.getElementById('lang'), save);

canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') hover = tileAt(e); });
canvas.addEventListener('pointerleave', () => { hover = null; });
canvas.addEventListener('pointerdown', e => { const { i, j } = tileAt(e); tap(i, j); });
window.addEventListener('resize', fit);

renderTask();
renderTools();
fit();
requestAnimationFrame(loop);

// За тестове: достъп до състоянието от конзолата.
window.malki = { get state() { return s; }, tap, setTool: t => { tool = t; renderTools(); } };
