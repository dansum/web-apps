// ВАРНА СТРОИ — игра за строене на град за ученици от 5. клас.
// Целта е да се види кои фактори правят живота в един град добър.
import { N, idx, inside, makeMap } from './map.js';
import { BUILDINGS, TOOLS, FACTORS, MISSIONS, TERRAIN_INFO } from './buildings.js';
import { evaluate, monthTick, canPlace, needsRoad, roadNear } from './sim.js';
import { Renderer } from './render.js';
import * as ui from './ui.js';

const SEED = 1852;
const MONTH_MS = 3000;
const SAVE_KEY = 'varna-stroi-save';

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* няма значение */ } },
};

function newState() {
  const m = makeMap(SEED);
  return { terrain: m.terrain, trees: m.trees, b: new Array(N * N).fill(null),
    money: 3000, pop: 0, month: 0, year: 2026, mission: 0, last: null };
}

function save() {
  store.set(SAVE_KEY, { v: 1, b: s.b, trees: Array.from(s.trees).join(''), money: s.money, pop: s.pop,
    month: s.month, year: s.year, mission: s.mission, muted });
}

function load() {
  const d = store.get(SAVE_KEY);
  if (!d || d.v !== 1 || !Array.isArray(d.b) || d.b.length !== N * N) return null;
  const st = newState();
  st.b = d.b.map(t => (t && BUILDINGS[t] ? t : null));
  st.trees = Uint8Array.from(String(d.trees), c => (c === '1' ? 1 : 0));
  if (st.trees.length !== N * N) st.trees = makeMap(SEED).trees;
  Object.assign(st, { money: +d.money || 0, pop: +d.pop || 0, month: +d.month % 12 || 0, year: +d.year || 2026,
    mission: +d.mission || 0 });
  muted = !!d.muted;
  return st;
}

// ---------- звуци (синтезирани, без файлове) ----------
let audio = null, muted = false;
function beep(notes, type = 'sine', len = 0.09) {
  if (muted) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach((f, n) => {
      const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + n * len;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.12, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + len * 1.6);
      o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + len * 1.7);
    });
  } catch (e) { /* без звук */ }
}
const sfx = {
  place: () => beep([520, 780], 'triangle', 0.05),
  error: () => beep([200, 150], 'square', 0.08),
  win: () => beep([523, 659, 784, 1047], 'triangle', 0.12),
};

// ---------- състояние ----------
let s = newState();
let ev = evaluate(s);
let tool = 'inspect';
let overlay = null;
let gameSpeed = 1;
let started = false;
let acc = 0, monthsSinceTip = 0;
let hover = null, focus = null;

const canvas = document.getElementById('map');
const R = new Renderer(canvas);
R.center();

function refresh() {
  ev = evaluate(s);
  ui.stats(s, ev);
  ui.factors(ev, overlay, pickFactor);
  ui.mission(MISSIONS[s.mission], s.mission + 1, MISSIONS.length);
  ui.toolbar(s, tool, pickTool);
}

function setSpeed(v) { gameSpeed = v; ui.speed(v); }

function pickTool(id) {
  tool = id;
  focus = null;
  const d = TOOLS[id] || BUILDINGS[id];
  ui.toolbar(s, tool, pickTool);
  if (id === 'inspect') { ui.info(null); return; }
  const lines = [`<h3>${d.icon} ${ui.esc(d.name)}</h3>`];
  if (d.cost) lines.push(`<p class="meta">Цена: <b>${d.cost} €</b>${d.upkeep >= 1 ? ` · поддръжка ${d.upkeep} € на месец` : ''}</p>`);
  lines.push(`<p>${ui.esc(d.desc)}</p>`);
  if (d.fact) lines.push(`<p class="fact">💡 <b>Знаеш ли?</b> ${ui.esc(d.fact)}</p>`);
  ui.info(lines.join(''));
}

function pickFactor(id) {
  overlay = overlay === id ? null : id;
  ui.factors(ev, overlay, pickFactor);
  if (!overlay) { ui.info(null); return; }
  const f = FACTORS.find(x => x.id === id), v = ev.factors ? ev.factors[id] : null;
  const map = ['home', 'work'].includes(id)
    ? '<p class="meta">Този фактор е общ за целия град.</p>'
    : '<p class="meta">На картата домовете са оцветени: <b style="color:#2e9e4a">зелено</b> — добре, <b style="color:#d23c3c">червено</b> — зле.</p>';
  ui.info(`<h3>${f.icon} ${f.name}: ${v ?? '—'}</h3><p>${f.why}</p><p class="tip">👉 ${f.tip}</p>${map}`);
}

// ---------- строене ----------
function place(t, i, j, quiet) {
  const r = canPlace(s, t, i, j);
  if (!r.ok) {
    if (!quiet && r.why) { ui.toast(r.why, 'bad'); sfx.error(); }
    return false;
  }
  const k = idx(i, j);
  s.b[k] = t;
  s.trees[k] = 0;
  s.money -= BUILDINGS[t].cost;
  sfx.place();
  if (needsRoad(t) && !roadNear(s, i, j) && !quiet) ui.toast('Сградата няма път до себе си и не работи. Построй път до нея!', 'warn');
  afterChange();
  return true;
}

function bulldoze(i, j) {
  if (!inside(i, j)) return false;
  const k = idx(i, j);
  if (s.b[k]) { s.b[k] = null; }
  else if (s.trees[k]) { s.trees[k] = 0; }
  else return false;
  beep([300, 200], 'sawtooth', 0.05);
  afterChange();
  return true;
}

function afterChange() {
  refresh();
  checkMission();
  save();
}

let missionBusy = false;
async function checkMission() {
  const m = MISSIONS[s.mission];
  if (!m || missionBusy || !m.check(s, ev)) return;
  missionBusy = true;
  s.mission++;
  s.money += m.reward;
  save();
  refresh();
  sfx.win();
  await ui.modal(`<div class="big">🎉</div><h2>Браво!</h2><p class="done">✅ ${ui.esc(m.text)}</p>
    <p class="lesson"><b>Какво научихме:</b> ${ui.esc(m.lesson)}</p><p class="meta">Награда: <b>+${m.reward} €</b> в бюджета</p>`,
  [MISSIONS[s.mission] ? 'Към следващата задача' : 'Продължи']);
  missionBusy = false;
  if (!MISSIONS[s.mission]) {
    await ui.modal(`<div class="big">🏆</div><h2>Варна е град за хората!</h2>
      <p>Изпълни всички задачи. Хората в твоя град имат дом и работа, училище и лекар наблизо, паркове, транспорт и култура.</p>
      <p>Можеш да продължиш да строиш. Опитай всички фактори да станат над 90!</p>`, ['Продължи']);
  }
  checkMission();
}

// ---------- разглеждане ----------
function inspect(i, j) {
  if (!inside(i, j)) return;
  const k = idx(i, j), t = s.b[k];
  focus = null;
  if (!t) {
    const ter = TERRAIN_INFO[s.terrain[k]];
    const extra = s.trees[k] ? '<p>Тук растат дървета. Те правят въздуха около домовете по-чист.</p>' : '';
    ui.info(`<h3>${ter.icon} ${ter.name}</h3><p>${ter.desc}</p>${extra}`);
    return;
  }
  const d = BUILDINGS[t], lines = [`<h3>${d.icon} ${ui.esc(d.name)}</h3>`];
  if (ev.inactive.has(k)) lines.push('<p class="warn">⚠️ До тази сграда няма път, затова тя не работи. Построй път до нея!</p>');
  lines.push(`<p>${ui.esc(d.desc)}</p>`);
  const loc = ev.local.get(k);
  if (loc) {
    lines.push('<ul class="local">' + FACTORS.filter(f => loc[f.id] !== undefined).map(f => {
      const v = loc[f.id];
      return `<li><span>${f.icon} ${f.name}</span><span class="bar"><i style="width:${v}%;background:${ui.barColor(v)}"></i></span><b>${v}</b></li>`;
    }).join('') + '</ul>');
    const hints = [];
    if (loc.edu < 50) hints.push('няма достатъчно места в училище наблизо');
    if (loc.health < 50) hints.push(loc.pollution > 15 ? 'въздухът е замърсен от завод' : 'няма поликлиника наблизо');
    if (loc.nature < 50) hints.push('няма парк или дървета наблизо');
    if (loc.transport < 50) hints.push('няма автобусна спирка наблизо');
    if (hints.length) lines.push(`<p class="tip">👉 За хората тук: ${hints.join('; ')}.</p>`);
  }
  if (d.serve) {
    focus = { i, j, r: d.serve.r, color: 'rgba(255,255,255,.22)' };
    lines.push(`<p class="meta">Светлият кръг показва кои домове обслужва.</p>`);
  }
  if (d.pollution) focus = { i, j, r: d.pollution.r, color: 'rgba(120,70,30,.3)' };
  if (d.fact) lines.push(`<p class="fact">💡 <b>Знаеш ли?</b> ${ui.esc(d.fact)}</p>`);
  ui.info(lines.join(''));
}

// ---------- управление с мишка, пръст и клавиатура ----------
const pointers = new Map();
let drag = null;

function tileAt(e) {
  const r = canvas.getBoundingClientRect();
  return R.screenToTile(e.clientX - r.left, e.clientY - r.top);
}

function paint(e) {
  const { i, j } = tileAt(e), key = i + ',' + j;
  if (drag.painted.has(key)) return;
  drag.painted.add(key);
  if (tool === 'road') place('road', i, j, drag.painted.size > 1);
  else bulldoze(i, j);
}

canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    drag = { mode: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    return;
  }
  if (pointers.size > 2) return;
  const painting = tool === 'road' || tool === 'bulldoze';
  drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, painted: new Set(),
    mode: e.button !== 0 ? 'pan' : painting ? 'paint' : 'pending' };
  if (drag.mode === 'paint') paint(e);
});

canvas.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (e.pointerType === 'mouse') hover = tileAt(e);
  if (!drag) return;
  if (drag.mode === 'pinch') {
    if (pointers.size < 2) return;
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    R.cam.x += cx - drag.cx; R.cam.y += cy - drag.cy;
    R.zoomAt(cx, cy, d / drag.d);
    Object.assign(drag, { d, cx, cy });
    return;
  }
  if (drag.mode === 'pending' && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.mode = 'pan';
  if (drag.mode === 'pan') { R.cam.x += e.clientX - drag.x; R.cam.y += e.clientY - drag.y; }
  if (drag.mode === 'paint') paint(e);
  drag.x = e.clientX; drag.y = e.clientY;
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (!drag) return;
  if (drag.mode === 'pending' && e.type === 'pointerup') {
    const { i, j } = tileAt(e);
    if (tool === 'inspect') inspect(i, j); else place(tool, i, j);
  }
  if (pointers.size === 0) drag = null;
  else if (drag.mode === 'pinch') drag = { mode: 'none' };
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = null; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  R.zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
}, { passive: false });

window.addEventListener('keydown', e => {
  if (teacherOpen()) { if (e.key === 'Escape') showTeacher(false); return; }
  if (ui.isModalOpen()) return;
  const step = 40;
  const pan = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step],
    a: [step, 0], d: [-step, 0], w: [0, step], s: [0, -step] }[e.key];
  if (pan) { R.cam.x += pan[0]; R.cam.y += pan[1]; return; }
  if (e.key === ' ') { e.preventDefault(); setSpeed(gameSpeed ? 0 : 1); }
  if (e.key === 'Escape') { pickTool('inspect'); ui.info(null); }
  if (e.key === 'r') { ui.showGroupOf('road'); pickTool('road'); }
  if (e.key === 'b') { ui.showGroupOf('bulldoze'); pickTool('bulldoze'); }
  if (e.key === '+' || e.key === '=') R.zoomAt(R.w / 2, R.h / 2, 1.15);
  if (e.key === '-') R.zoomAt(R.w / 2, R.h / 2, 1 / 1.15);
});

window.addEventListener('resize', () => R.resize());
document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => setSpeed(+b.dataset.speed));
document.getElementById('st-wb').onclick = showWellbeing;
document.getElementById('btn-menu').onclick = menu;

// ---------- раздел „За учителя“ (отваря се и с линк …/Varna/#uchitel) ----------
const teacher = document.getElementById('teacher');
const teacherOpen = () => !teacher.hidden;
function showTeacher(open) {
  teacher.hidden = !open;
  const want = open ? '#uchitel' : '';
  if (location.hash !== want) history.replaceState(null, '', location.pathname + location.search + want);
}
document.getElementById('btn-teacher').onclick = () => showTeacher(true);
document.getElementById('teacher-close').onclick = () => showTeacher(false);
teacher.addEventListener('click', e => { if (e.target === teacher) showTeacher(false); });
teacher.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  teacher.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
  teacher.querySelectorAll('[data-pane]').forEach(p => p.classList.toggle('on', p.dataset.pane === b.dataset.tab));
});
window.addEventListener('hashchange', () => showTeacher(location.hash === '#uchitel'));
if (location.hash === '#uchitel') showTeacher(true);

// ---------- прозорци ----------
function showWellbeing() {
  const rows = FACTORS.map(f => {
    const v = ev.factors ? ev.factors[f.id] : null;
    return `<li><span>${f.icon} ${f.name}</span><span class="bar"><i style="width:${v ?? 0}%;background:${ui.barColor(v ?? 0)}"></i></span><b>${v ?? '—'}</b></li>`;
  }).join('');
  const l = s.last;
  const budget = l ? `<p class="meta">Миналия месец: данъци +${l.taxes} €, туристи +${l.tourism} €, поддръжка −${l.upkeep} €.</p>` : '';
  ui.modal(`<h2>${ui.face(ev.wellbeing)} Добруване: ${ev.wellbeing ?? '—'}</h2>
    <p>Добруването показва колко добре живеят хората в града. То е средното от седемте фактора:</p>
    <ul class="local">${rows}</ul>
    <p>Когато Добруването е високо, в града идват нови хора, а градът събира повече данъци.</p>${budget}`, ['Затвори']);
}

async function menu() {
  const prev = gameSpeed;
  setSpeed(0);
  const n = await ui.modal(`<h2>Меню</h2>`, ['Продължи', 'Как се играе', muted ? 'Звук: изключен' : 'Звук: включен', 'Нова игра']);
  if (n === 1) await help();
  if (n === 2) { muted = !muted; save(); ui.toast(muted ? 'Звукът е изключен' : 'Звукът е включен'); }
  if (n === 3) {
    const sure = await ui.modal('<h2>Нова игра?</h2><p>Сегашният град ще бъде изтрит.</p>', ['Не', 'Да, започни отначало']);
    if (sure === 1) { s = newState(); R.center(); overlay = null; ui.info(null); afterChange(); }
  }
  setSpeed(prev || 1);
}

function help() {
  return ui.modal(`<h2>Как се играе</h2>
    <ul class="howto">
      <li><b>Строй:</b> избери сграда в лентата долу и натисни място на картата.</li>
      <li><b>Пътища:</b> всяка сграда трябва да е до път. Пътищата се рисуват с натискане и плъзгане.</li>
      <li><b>Местене на картата:</b> плъзни с мишката (или с десния бутон), с два пръста на телефона, или със стрелките.</li>
      <li><b>Приближаване:</b> колелцето на мишката или два пръста.</li>
      <li><b>Фактори:</b> натисни фактор вдясно и картата ще покаже кои домове са добре и кои — не.</li>
      <li><b>Разгледай 🔍:</b> натисни къща, за да видиш какво липсва на хората в нея.</li>
      <li><b>Пари:</b> идват от данъците на жителите и фирмите и от туристите през лятото. Училищата, болниците и парковете струват пари всеки месец.</li>
    </ul>`, ['Разбрах']);
}

async function intro() {
  const saved = load();
  const buttons = saved ? ['Продължи играта', 'Нова игра'] : ['Започни'];
  const n = await ui.modal(`<div class="big">⚓🏙️🌊</div><h1>Варна строи</h1>
    <p>Варна е най-големият град по нашето Черноморие и третият по големина в България. Преди повече от 2500 години тук гърците основават град <b>Одесос</b>.</p>
    <p><b>Сега ти си кметът!</b> Построй град, в който хората живеят добре. Следи седемте фактора за добруване:</p>
    <p class="chips">${FACTORS.map(f => `<span>${f.icon} ${f.name}</span>`).join('')}</p>`, buttons);
  if (saved && n === 0) s = saved;
  else if (!saved || n === 1) {
    s = newState();
    await help();
  }
  started = true;
  afterChange();
  ui.advisor(MISSIONS[s.mission] ? 'Здравей! Аз съм чайката Мара. Горе вляво е задачата ти. Започни с път и няколко къщи до него.' : 'Добре дошъл обратно, кмете!');
}

function tip() {
  if (!ev.factors) return;
  const worst = FACTORS.reduce((a, f) => (ev.factors[f.id] < ev.factors[a.id] ? f : a), FACTORS[0]);
  if (s.money < 0) ui.advisor('Бюджетът е на минус! Построй работни места — фирмите плащат данъци. Не строй скъпи сгради, докато нямаш пари.');
  else if (ev.inactive.size) ui.advisor('Някои сгради нямат път до себе си и не работят. Потърси червените знаци „!“ на картата.');
  else if (ev.factors[worst.id] < 60) ui.advisor(`Най-слабият фактор е ${worst.icon} ${worst.name} (${ev.factors[worst.id]}). ${worst.tip}`);
}

// ---------- главен цикъл ----------
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(100, now - lastT);
  lastT = now;
  if (started && gameSpeed && !ui.isModalOpen() && !teacherOpen()) {
    acc += dt * gameSpeed;
    if (acc >= MONTH_MS) {
      acc = 0;
      monthTick(s, ev);
      refresh();
      checkMission();
      save();
      if (++monthsSinceTip >= 5) { monthsSinceTip = 0; tip(); }
    }
  }

  let h = null, radius = focus;
  if (hover && inside(hover.i, hover.j)) {
    const ok = tool === 'inspect' || tool === 'bulldoze' ? true : canPlace(s, tool, hover.i, hover.j).ok;
    h = { ...hover, ok };
    const d = BUILDINGS[tool];
    if (d && d.serve) radius = { i: hover.i, j: hover.j, r: d.serve.r, color: 'rgba(255,255,255,.18)' };
    if (d && d.pollution) radius = { i: hover.i, j: hover.j, r: d.pollution.r, color: 'rgba(120,70,30,.28)' };
    if (d && d.park) radius = { i: hover.i, j: hover.j, r: 3, color: 'rgba(60,170,60,.25)' };
  }
  R.draw(s, ev, { hover: h, overlay, radius }, now / 1000);
  requestAnimationFrame(frame);
}

refresh();
setSpeed(1);
requestAnimationFrame(frame);
intro();

// За учителя и за тестове: достъп до състоянието от конзолата.
window.varna = { get state() { return s; }, get eval() { return ev; }, place, refresh };
