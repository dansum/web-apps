// Демо режим: кратка обиколка на сайта с подсветка и надписи.
// Показва курса, теста, 3D преживяване с опит (свещта гори хартия) и следенето на напредъка.
// През обиколката се показва примерен напредък; истинският не се променя (store.beginDemo).
import * as store from './store.js';
import { speak, stop as stopVoice } from './voice.js';

const AUTO_MS = 9000;

// Примерен напредък за 4. клас: малко от всичко, за да се видят нивата.
function sampleProgress() {
  const lv = { '4.1.1': 4, '4.1.2': 3, '4.1.3': 3, '4.1.4': 2, '4.1.5': 2, '4.2.1': 1, '4.2.2': 2, '4.2.6': 1, '4.3.1': 2 };
  const skills = {};
  for (const [id, level] of Object.entries(lv)) skills[id] = { level, attempts: 1 };
  const today = new Date().toISOString().slice(0, 10);
  return { name: 'Демо', skills, tests: { '4-1': { best: 0.83, lastScore: 0.83 } }, articles: { '4-1-a': true }, daily: { [today]: 4 }, lastCourse: '4' };
}

const STEPS = [
  { route: '#/', sel: '.hero-focus', title: 'Главната страница',
    text: 'Оттук детето продължава оттам, докъдето е стигнало. Големият бутон води към следващото умение, а вдясно е процентът от курса.' },
  { route: '#/c/4', sel: '.course-head', title: 'Целият курс',
    text: 'Това е целият курс за 4. клас. Горе вдясно е колко е овладян курсът, а цветните квадратчета показват нивото на всяко умение.' },
  { route: '#/c/4', sel: '.unit', title: 'Раздели и умения',
    text: 'Курсът е разделен на раздели. Всеки раздел има умения, статия и тест. Зелената звезда означава пълно 3D преживяване.' },
  { route: '#/c/4', sel: '.challenge-card', title: 'Тест за целия курс',
    text: 'Оттук се пуска „Предизвикателството за курса“ – тест върху всички умения. Под всеки раздел има и по-кратък тест само за раздела.' },
  { route: '#/t/4', sel: '.test', title: 'Как изглежда тестът',
    text: 'Тестът казва колко въпроса има. Верен отговор вдига умението с едно ниво, грешен го сваля с едно.' },
  { route: '#/s/4.1.1', sel: '.xp-stage', wait: (el) => el.closest('.ex-area')?.__demo,
    title: '3D преживяване', text: 'Това е лаборатория с пет станции за опити. Сцената се върти с мишката или с пръст и се приближава с колелцето.' },
  { route: '#/s/4.1.1', sel: '.corner-menu', title: 'Менюто в ъгъла',
    text: 'От менюто детето избира какво да разгледа. Сега избираме свещта.',
    action: (h) => h.visit('fire') },
  { route: '#/s/4.1.1', sel: '.xp', title: 'Опит: гори ли хартията?',
    text: 'В стъпка 2 детето прави опитите. Кликва върху хартията и я поднася към свещта: хартията гори и от нея остава пепел. Резултатът се записва в таблицата.',
    action: (h) => h.experiment('fire', 'f-paper'), auto: 12000 },
  { route: '#/c/4', sel: '.course-mastery', title: 'Напредък по курса',
    text: 'Всяко умение има ниво: „Опитано“, „Запознат“, „Владее“ и „Овладяно“. Упражнението вдига до „Владее“, а тестовете – до „Овладяно“.' },
  { route: '#/c/4', sel: '#stats', title: 'Всеки ден',
    text: 'Най-горе на всяка страница се вижда процентът от курса и колко задачи са направени днес.' },
  { route: '#/c/4', sel: '#dl', title: 'Файлът с напредъка',
    text: 'Напредъкът се пази в браузъра. С „Свали напредъка“ се записва във файл, който детето качва на друг компютър. Нищо не се изпраща никъде.' },
];

let cur = -1;
let ui = null;
let timer = null;
let playing = true;
let onExit = null;
let token = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(sel, check, ms = 10000) {
  const t0 = Date.now();
  for (;;) {
    const el = document.querySelector(sel);
    if (el && (!check || check(el))) return el;
    if (Date.now() - t0 > ms) return el || null;
    await sleep(120);
  }
}

function build() {
  ui = document.createElement('div');
  ui.className = 'demo-ui';
  ui.innerHTML = `<div class="demo-spot" hidden></div>
    <div class="demo-card" role="dialog" aria-label="Демо">
      <div class="demo-top"><span class="demo-tag">▶ ДЕМО</span><span class="demo-n"></span>
        <button class="demo-x" title="Изход от демото" aria-label="Изход">✕</button></div>
      <b class="demo-title"></b><p class="demo-text"></p>
      <div class="demo-bar"><i></i></div>
      <div class="demo-row"><button class="btn demo-prev">← Назад</button>
        <button class="btn demo-play"></button>
        <button class="btn primary demo-next">Напред →</button></div>
    </div>`;
  document.body.appendChild(ui);
  ui.querySelector('.demo-x').addEventListener('click', () => end());
  ui.querySelector('.demo-prev').addEventListener('click', () => go(cur - 1));
  ui.querySelector('.demo-next').addEventListener('click', () => (cur >= STEPS.length - 1 ? finishCard() : go(cur + 1)));
  ui.querySelector('.demo-play').addEventListener('click', () => { playing = !playing; drawPlay(); schedule(); });
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, { passive: true });
}

function drawPlay() {
  ui.querySelector('.demo-play').textContent = playing ? '⏸ Пауза' : '▶ Пусни';
  ui.classList.toggle('paused', !playing);
}

let target = null;
function place() {
  const spot = ui && ui.querySelector('.demo-spot');
  if (!spot) return;
  // Изгледът може да се начертае наново; тогава търсим елемента отново.
  if (target && !target.isConnected && STEPS[cur]) target = document.querySelector(STEPS[cur].sel);
  if (!target || !target.isConnected) { spot.hidden = true; return; }
  const r = target.getBoundingClientRect();
  const pad = 6;
  spot.hidden = false;
  Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
}

function schedule() {
  clearTimeout(timer);
  const bar = ui.querySelector('.demo-bar i');
  bar.style.transition = 'none';
  bar.style.width = '0%';
  if (!playing || cur < 0) return;
  const ms = STEPS[cur]?.auto || AUTO_MS;
  requestAnimationFrame(() => { bar.style.transition = `width ${ms}ms linear`; bar.style.width = '100%'; });
  timer = setTimeout(() => (cur >= STEPS.length - 1 ? finishCard() : go(cur + 1)), ms);
}

async function go(i) {
  if (i < 0 || i >= STEPS.length) return;
  const my = ++token;
  clearTimeout(timer);
  cur = i;
  const s = STEPS[i];
  ui.querySelector('.demo-n').textContent = `${i + 1} / ${STEPS.length}`;
  ui.querySelector('.demo-title').textContent = s.title;
  ui.querySelector('.demo-text').textContent = s.text;
  ui.querySelector('.demo-prev').disabled = i === 0;
  ui.querySelector('.demo-next').textContent = i === STEPS.length - 1 ? 'Край ✔' : 'Напред →';
  ui.querySelector('.demo-row').hidden = false;
  target = null;
  place();
  if (location.hash !== s.route) location.hash = s.route;
  const el = await waitFor(s.sel, s.wait);
  if (my !== token) return;
  target = el;
  if (el) el.scrollIntoView({ block: el.offsetHeight > innerHeight * 0.6 ? 'start' : 'center', behavior: 'smooth' });
  place();
  setTimeout(place, 450);
  speak(`${s.title}. ${s.text}`);
  schedule();
  if (s.action) {
    const host = await waitFor('.ex-area', (a) => a.querySelector('.xp') && a.__demo);
    if (my !== token || !host || !host.__demo) return;
    await sleep(500);
    try { await s.action(host.__demo); } catch (e) { console.warn('Демо:', e); }
    place();
  }
}

function finishCard() {
  token++;
  clearTimeout(timer);
  cur = STEPS.length;
  target = null;
  place();
  ui.querySelector('.demo-n').textContent = '';
  ui.querySelector('.demo-title').textContent = 'Това е всичко!';
  ui.querySelector('.demo-text').innerHTML = 'Сега опитай сам. Демото не промени твоя напредък.';
  ui.querySelector('.demo-row').hidden = true;
  const row = document.createElement('div');
  row.className = 'demo-row demo-end';
  row.innerHTML = '<button class="btn demo-again">↻ Пусни отново</button><button class="btn primary demo-go">Започни →</button>';
  ui.querySelector('.demo-card').appendChild(row);
  row.querySelector('.demo-again').addEventListener('click', () => { row.remove(); go(0); });
  row.querySelector('.demo-go').addEventListener('click', () => end('#/'));
  ui.querySelector('.demo-bar i').style.width = '100%';
}

export const active = () => !!ui;

// rerender: начертава текущия изглед наново (с примерния или с истинския напредък).
export function start(rerender) {
  if (ui) return;
  onExit = rerender;
  store.beginDemo(sampleProgress());
  build();
  playing = true;
  drawPlay();
  go(0);
}

export function end(hash) {
  if (!ui) return;
  token++;
  clearTimeout(timer);
  stopVoice();
  window.removeEventListener('resize', place);
  window.removeEventListener('scroll', place);
  ui.remove();
  ui = null;
  target = null;
  cur = -1;
  store.endDemo();
  if (hash && location.hash !== hash) location.hash = hash;
  else if (onExit) onExit();
}
