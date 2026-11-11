// Османското завоевание на българските земи (XIV–XV в.) — карта с плъзгач на годината и линия на времето.
// Обслужва: 6.2.7 и 10.1.9 „Османското завоевание“ (разликата е в стъпка 4 според skill.id).
// Стъпки: опознай местата → проследи завоеванието с плъзгача → подреди събитията → предскажи.
// Картата показва днешния бряг и реки; местата са с карфици (без средновековни граници).
import { createStage, cornerMenu, esc, mat, THREE } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { createTimeline } from './hist/timeline.js';
import { mapDecor, cardSpots } from './hist/regions.js';

const PLACES = [
  { id: 'gallipoli', label: 'Галиполи', lon: 26.67, lat: 40.41, year: 1354, labelDx: 0.5,
    note: 'Галиполи. През 1354 г. османците завземат крепостта — първата им здрава опора в Европа.' },
  { id: 'chernomen', label: 'Черномен', lon: 26.22, lat: 41.72, year: 1371, labelDx: -0.55,
    note: 'Черномен, на река Марица. През 1371 г. тук османците разбиват войските на крал Вълкашин и деспот Углеша.' },
  { id: 'tarnovo', label: 'Търново', lon: 25.63, lat: 43.08, year: 1393,
    note: 'Търново — столицата на Търновското царство и седалище на българския патриарх.' },
  { id: 'nikopol', label: 'Никопол', lon: 24.9, lat: 43.7, year: 1396, labelDx: -0.4,
    note: 'Никопол, на Дунав. Тук през 1396 г. се води битка между османците и голяма кръстоносна армия.' },
  { id: 'vidin', label: 'Видин', lon: 22.88, lat: 43.99, year: 1396,
    note: 'Видин — столицата на Видинското царство на Иван Срацимир.' },
  { id: 'varna', label: 'Варна', lon: 27.91, lat: 43.21, year: 1444,
    note: 'Варна. През 1444 г. край града се води битка между османците и кръстоносната армия на крал Владислав.' },
  { id: 'constantinople', label: 'Цариград', lon: 28.98, lat: 41.01, year: 1453, labelDx: 0.3,
    note: 'Константинопол (Цариград) — столицата на Византия. Османците го превземат през 1453 г.' },
];
// Пътят на завоеванието в българските земи: от югоизток към северозапад.
const PATH = ['gallipoli', 'chernomen', 'tarnovo', 'vidin'];
const FALLEN = 0x5b3a29, START = 0x2b6cb0;

const TASKS = [
  { id: 'tarnovo', year: 1393, ask: 'Премести плъзгача до <b>1393 г.</b> Кликни столицата, която пада тогава.',
    early: 'Премести плъзгача до 1393 г. и виж коя карфица потъмнява.', good: 'Търново пада през 1393 г. след три месеца обсада.' },
  { id: 'nikopol', year: 1396, ask: 'Продължи до <b>1396 г.</b> Кликни мястото, където кръстоносците са разбити.',
    early: 'Битката е през 1396 г. Премести плъзгача там.', good: 'При Никопол (1396 г.) османците разбиват кръстоносната армия.' },
  { id: 'vidin', year: 1396, ask: 'Кое българско царство пада последно? Кликни столицата му.',
    early: 'Премести плъзгача до 1396 г.', good: 'Видинското царство пада през 1396 г. Това е последното българско царство.' },
];
const WRONG = {
  gallipoli: 'Галиполи е първата опора на османците в Европа (1354 г.).',
  chernomen: 'При Черномен е битката от 1371 г.',
  tarnovo: 'Търново пада през 1393 г.',
  nikopol: 'При Никопол е битката с кръстоносците.',
  vidin: 'Видин пада през 1396 г.',
  varna: 'Битката при Варна е много по-късно — през 1444 г.',
  constantinople: 'Цариград е столицата на Византия, а не на българско царство.',
};
const DIRECTION = [
  { t: 'От югоизток (Галиполи, Тракия) към северозапад (Видин)', ok: true },
  { t: 'От север (Дунав) към юг', why: 'Не. Погледни откъде тръгва линията — от Галиполи, на юг.' },
  { t: 'От запад (Видин) към изток', why: 'Не. Видин пада последен — значи там завоеванието свършва.' },
];
const EVENTS = [
  { year: 1354, card: 'Галиполи е завзет', place: 'gallipoli' },
  { year: 1371, card: 'Битката при Черномен', place: 'chernomen' },
  { year: 1393, card: 'Търново пада', place: 'tarnovo' },
  { year: 1396, card: 'Никопол и Видин', place: 'vidin' },
  { year: 1444, card: 'Битката при Варна', place: 'varna' },
  { year: 1453, card: 'Цариград пада', place: 'constantinople' },
];
const PREDICT = {
  '6.2.7': { focus: 'varna',
    ask: '1444 г.: Крал Владислав води кръстоносна армия срещу османците. Тя стига до Варна. <b>Какво ще стане според теб?</b>',
    opts: [
      { t: 'Кръстоносците са разбити, а крал Владислав загива в битката.', ok: true },
      { t: 'Кръстоносците освобождават българските земи.', why: 'Не. Османците остават на Балканите още векове.' },
      { t: 'Кръстоносците превземат Цариград.', why: 'Не. Цариград пада през 1453 г., но в ръцете на османците.' },
    ],
    show: '<b>Така и става.</b> В битката при Варна (1444 г.) кръстоносците са разбити, а крал Владислав загива. Затова го наричат Варненчик.' },
  '10.1.9': { focus: 'tarnovo',
    ask: '1393 г.: Търново пада. В него е седалището на българския патриарх. <b>Какво ще стане с Търновската патриаршия според теб?</b>',
    opts: [
      { t: 'Патриаршията е премахната и българската църква е подчинена на Цариградската патриаршия.', ok: true },
      { t: 'Патриаршията става още по-силна.', why: 'Не. Новата власт не иска самостоятелна българска църква.' },
      { t: 'Патриаршията се мести във Видин и продължава.', why: 'Не. Тя е премахната, а българските епархии са подчинени на Цариград.' },
    ],
    show: '<b>Така и става.</b> Търновската патриаршия е премахната, а българските епархии са подчинени на Цариградската патриаршия. С държавата изчезва и самостоятелната църква.' },
};

export function mount(container, { skill = {}, onComplete } = {}) {
  const P = PREDICT[skill.id] || PREDICT['6.2.7'];
  const shell = createShell(container, { steps: ['Опознай', 'Проследи завоеванието', 'Подреди събитията', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[0, 7.4 * far, 5.0 * far], [0, 0, 0.2]];
  // На тесен екран в стъпка 3 камерата гледа главно линията, за да се четат картите.
  const VIEW3 = far > 1 ? [[0, 10, 12.4], [0, 0, 3.5]] : [[0, 7.6, 10.2], [0, 0, 2.3]];
  const stage = createStage(shell.stageEl, { background: 0xdcecf7, camPos: VIEW[0], target: VIEW[1], maxDistance: 30 });

  let map = null, decor = null, menu = null, tip = null, clickHandler = null, stopDrag = null, tl = null;
  let route = null, army = null, armyTo = null;
  const scores = [];
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 1.0, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const place = (id) => PLACES.find((p) => p.id === id);
  const paintYear = (y) => { for (const p of PLACES) map.colorPlace(p.id, y >= p.year ? FALLEN : START); };

  // Линията на завоеванието расте с годините; малка войска (знаме) върви по нея.
  function buildRoute() {
    const pts = PATH.map((id) => { const p = place(id); return map.pos(p.lon, p.lat, 0.2); });
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
    const geo = new THREE.TubeGeometry(curve, 120, 0.05, 6, false);
    route = new THREE.Mesh(geo, mat(0xc0392b));
    route.userData.curve = curve;
    route.geometry.setDrawRange(0, 0);
    stage.scene.add(route);
    army = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), mat(0x4a3b2a));
    pole.position.y = 0.35;
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.02), mat(0xc0392b));
    flag.position.set(0.17, 0.58, 0);
    army.add(pole, flag);
    army.userData.flag = flag;
    army.visible = false;
    stage.scene.add(army);
    armyTo = 0;
    route.userData.at = 0;
    stage.tick((dt, t) => {
      if (!army.visible) return;
      const u = route.userData;
      u.at += (armyTo - u.at) * Math.min(1, dt * 3);
      army.position.copy(curve.getPointAt(Math.min(1, Math.max(0, u.at))));
      flag.rotation.y = Math.sin(t * 4) * 0.25;
      route.geometry.setDrawRange(0, Math.floor(u.at * 120) * 6 * 6);
    });
  }
  // Каква част от пътя е изминала войската до година y.
  function routeShare(y) {
    const ys = PATH.map((id) => place(id).year);
    if (y < ys[0]) return 0;
    for (let i = 1; i < ys.length; i++) if (y < ys[i]) return (i - 1 + (y - ys[i - 1]) / (ys[i] - ys[i - 1])) / (ys.length - 1);
    return 1;
  }

  function buildTimeline() {
    tl = createTimeline(stage, { from: 1e-6, to: EVENTS.length + 1, z: 3.7, length: far > 1 ? 8.4 : 9.6, tick: 1000, tickLabel: () => ' ', centuryBands: false });
    EVENTS.forEach((e, i) => tl.addSlot(`y${e.year}`, { year: i + 1, label: `${e.year} г.` }));
    const spot = cardSpots(EVENTS.length, far > 1);
    [3, 0, 5, 1, 4, 2].forEach((k, i) => {
      const e = EVENTS[k];
      tl.addCard(`c${e.year}`, { label: e.card, ...spot(i) });
      tl.cards.get(`c${e.year}`).visible = false;
    });
    tl.group.visible = false;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    for (const p of PLACES) map.colorPlace(p.id, START);
    shell.task('Това са местата, свързани с османското завоевание. Разгледай всяко: избери го от менюто или кликни върху карфицата.');
    const seen = new Set();
    const open = (id) => {
      const p = place(id);
      if (!p) return;
      const g = map.places.get(id);
      stage.focusOn(g, { dist: 3.6 * far, height: 3.2 * far, keepFollow: false });
      say(g, `<b>${esc(p.label)}</b><br>${esc(p.note)}`, { cls: 'wide' });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${PLACES.length}`);
      if (seen.size === PLACES.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: PLACES.map((p) => ({ id: p.id, label: p.label, icon: '📍' })), onSelect: open });
    clickHandler = (id) => { if (id) open(id); };
    shell.setControls('');
  }

  // ---------- 2. Проследи завоеванието ----------
  function step2() {
    shell.step(1);
    stage.flyTo(VIEW[0], VIEW[1], 1);
    let mistakes = 0, k = 0, tries = 0;
    army.visible = true; route.visible = true;
    const c = shell.setControls('<label class="small">Година: <b class="yr">1350</b></label><input class="yr-range" type="range" min="1350" max="1460" step="1" value="1350" style="width:100%"><p class="small">Тъмната карфица: мястото вече е в ръцете на османците или битката е станала.</p>');
    const range = c.querySelector('.yr-range');
    const update = () => {
      const y = +range.value;
      c.querySelector('.yr').textContent = y;
      paintYear(y);
      armyTo = routeShare(y);
    };
    range.addEventListener('input', update);
    update();
    const ask = () => { shell.task(TASKS[k].ask); shell.score(`Задачи: ${k} от ${TASKS.length + 1}`); };
    ask();
    clickHandler = (id) => {
      if (!id || k >= TASKS.length) return;
      const t = TASKS[k];
      if (id === t.id && +range.value < t.year) { mistakes++; tries++; shell.msg(t.early, 'bad'); return; }
      if (id !== t.id) {
        mistakes++; tries++;
        shell.msg(`${WRONG[id] || ''} Опитай пак.`, 'bad');
        if (tries >= 2) { map.colorPlace(t.id, 0xf2b01e); say(map.places.get(t.id), 'Подсказка: тук', { cls: 'tag' }); }
        return;
      }
      tries = 0;
      paintYear(+range.value);
      say(map.places.get(id), `<b>${esc(place(id).label)}</b><br>${esc(t.good)}`, { cls: 'good wide' });
      shell.msg('Вярно!', 'good');
      k++;
      if (k < TASKS.length) { ask(); return; }
      askDirection();
    };
    function askDirection() {
      range.value = 1396; update(); range.disabled = true;
      clickHandler = null;
      shell.task('Червената линия показва пътя на завоеванието в българските земи. <b>В каква посока върви то?</b>');
      shell.score(`Задачи: ${TASKS.length} от ${TASKS.length + 1}`);
      const cc = shell.setControls(`<div class="col">${DIRECTION.map((d, i) => `<button class="btn" data-i="${i}">${esc(d.t)}</button>`).join('')}</div>`);
      cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const d = DIRECTION[+b.dataset.i];
        if (!d.ok) { mistakes++; b.disabled = true; shell.msg(d.why, 'bad'); return; }
        scores.push(stepScore(mistakes, 3));
        shell.msg('Вярно! Завоеванието тръгва от Галиполи и Тракия и свършва при Видин.', 'good');
        shell.score(`Задачи: ${TASKS.length + 1} от ${TASKS.length + 1}`);
        const n = shell.setControls('<button class="btn primary">Напред →</button>');
        n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
      }));
    }
  }

  // ---------- 3. Подреди събитията ----------
  function step3() {
    shell.step(2);
    tl.group.visible = true;
    for (const card of tl.cards.values()) card.visible = true;
    for (const p of PLACES) map.colorPlace(p.id, START);
    army.visible = false; route.visible = false; // линията би издала реда
    stage.flyTo(VIEW3[0], VIEW3[1], 1);
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Завлечи всяко събитие при годината му на линията на времето.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${EVENTS.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.25,
      onDrop(obj) {
        const y = +obj.userData.dragId.slice(1);
        const e = EVENTS.find((x) => x.year === y);
        const slot = tl.slotAt(obj.position);
        if (!slot) { tl.sendHome(`c${y}`); return; }
        if (slot === `y${y}`) {
          tl.placeCard(`c${y}`, slot);
          tl.markSlot(slot, 0x2fb36b);
          map.colorPlace(e.place, FALLEN);
          placed++;
          shell.score(`Подредени: ${placed} от ${EVENTS.length}`);
          shell.msg('Вярно!', 'good');
          if (placed === EVENTS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[y] = (tries[y] || 0) + 1;
          tl.sendHome(`c${y}`);
          shell.msg('Не е тук. Спомни си: първо пада Тракия, после Търново и Видин, а битката при Варна и падането на Цариград са по-късно.', 'bad');
          if (tries[y] >= 2) { tl.markSlot(`y${y}`, 0xf2b01e); say(tl.slots.get(`y${y}`), 'Подсказка: тук', { cls: 'tag' }); }
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    shell.score('');
    tl.group.visible = false;
    for (const card of tl.cards.values()) card.visible = false;
    for (const p of PLACES) map.colorPlace(p.id, START);
    const g = map.places.get(P.focus);
    stage.focusOn(g, { dist: 4.4 * far, height: 3.6 * far, keepFollow: false });
    say(g, `<b>${esc(place(P.focus).label)}</b>`, { cls: 'tag' });
    let mistakes = 0;
    shell.task(P.ask);
    const c = shell.setControls(`<div class="col">${P.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const o = P.opts[+b.dataset.i];
      if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      map.colorPlace(P.focus, FALLEN);
      say(g, P.show, { cls: 'good wide' });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => {
        clearTip();
        const ratio = scores.reduce((s, x) => s + x, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    }));
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    if (menu) menu.remove();
    tl.reset();
    tl.group.visible = false;
    for (const card of tl.cards.values()) card.visible = false;
    army.visible = false; armyTo = 0; route.userData.at = 0; route.geometry.setDrawRange(0, 0); route.visible = true;
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  shell.task('Зареждане на картата…');
  createMap(stage, { center: [25.6, 42.3], unitsPerDeg: 1.3, focus: 'none', showNames: false }).then((m) => {
    map = m;
    for (const p of PLACES) map.addPlace(p.id, { ...p, color: START });
    decor = mapDecor(stage, map, [
      { text: 'Черно море', lon: 30.0, lat: 42.9, sea: true }, { text: 'Бяло море', lon: 24.8, lat: 39.9, sea: true },
    ]);
    // Средновековните граници не са начертани: тънките линии са днешните държави.
    const note = document.createElement('div');
    note.className = 'map-approx';
    note.textContent = 'Тънките линии са днешните граници — само за ориентир.';
    Object.assign(note.style, { position: 'absolute', left: '8px', bottom: '8px', zIndex: 3, padding: '3px 8px', borderRadius: '6px',
      background: 'rgba(255,255,255,0.9)', border: '1px solid #c7d3e0', font: '600 12px/1.3 system-ui, sans-serif', color: '#44505c', pointerEvents: 'none' });
    shell.stageEl.appendChild(note);
    buildRoute();
    buildTimeline();
    step1();
  }).catch((e) => shell.msg(`Картата не се зареди: ${e.message}`, 'bad'));

  container.__demo = { stage, get map() { return map; }, get tl() { return tl; }, at: (id) => stage.screenOf(id) };
  return { dispose() { if (stopDrag) stopDrag(); if (menu) menu.remove(); if (decor) decor.dispose(); if (tl) tl.dispose(); stage.dispose(); } };
}
