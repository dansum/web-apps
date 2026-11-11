// Границите на България 1878–1947 — карта с плъзгач на годината и линия на договорите.
// Обслужва: 7.2.6 „Войните 1912–1918 и националната катастрофа“ (1878–1940),
//           9.1.2 „Версайската система“ (промените след Първата световна война),
//           10.3.6 „Втората световна война“ (1878–1947). Настройките са в CFG по skill.id.
// Стъпки: опознай областите → изследвай с плъзгача → подреди договорите → предскажи следващата промяна.
// Границите са опростена схема (data/geo/bg-history.json) — сцената показва „Приблизителни граници“.
import { createStage, cornerMenu, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { createTimeline } from './hist/timeline.js';
import { createRegions, mapDecor, cardSpots, COL } from './hist/regions.js';

const APPROX = '<br><i class="small">Приблизителни граници.</i>';
const IDS = ['knyaz', 'sdob', 'rumelia', 'south', 'tsar', 'bosil', 'strum', 'aegean', 'macedonia'];
const WEST = ['tsar', 'bosil', 'strum'];
const MAIN = ['knyaz', 'sdob', 'rumelia', 'south', 'tsar', 'strum', 'aegean', 'macedonia'];
const groupOf = (id) => (WEST.includes(id) ? 'west' : id);

// Какво е българско във всяка година (останалото е оцветено според това чие е).
const STATES = {
  1878: { title: '1878 г. — Берлински договор', c: { knyaz: COL.bg, sdob: COL.bg, tsar: COL.bg, bosil: COL.bg, rumelia: COL.auto, south: COL.otto, macedonia: COL.otto, strum: COL.otto, aegean: COL.otto } },
  1885: { title: '1885 г. — Съединението', c: { knyaz: COL.bg, sdob: COL.bg, tsar: COL.bg, bosil: COL.bg, rumelia: COL.bg, south: COL.otto, macedonia: COL.otto, strum: COL.otto, aegean: COL.otto } },
  1913: { title: '1913 г. — Букурещки договор', c: { knyaz: COL.bg, sdob: COL.ro, tsar: COL.bg, bosil: COL.bg, rumelia: COL.bg, south: COL.bg, macedonia: COL.lost, strum: COL.bg, aegean: COL.bg } },
  1919: { title: '1919 г. — Ньойски договор', c: { knyaz: COL.bg, sdob: COL.ro, tsar: COL.rs, bosil: COL.rs, rumelia: COL.bg, south: COL.bg, macedonia: COL.lost, strum: COL.rs, aegean: COL.lost } },
  1940: { title: '1940 г. — Крайовска спогодба', c: { knyaz: COL.bg, sdob: COL.bg, tsar: COL.rs, bosil: COL.rs, rumelia: COL.bg, south: COL.bg, macedonia: COL.lost, strum: COL.rs, aegean: COL.lost } },
};
STATES[1947] = { title: '1947 г. — Парижки мирен договор', c: STATES[1940].c };
const LEGEND = {
  1878: '🟩 Княжество България · 🟨 Източна Румелия (автономна) · 🟧 Османска империя',
  1885: '🟩 България · 🟧 Османска империя',
  1913: '🟩 България · 🟪 Румъния · ⬜ Македония е поделена между Сърбия и Гърция',
  1919: '🟩 България · 🟪 Румъния · 🟦 Кралство на сърби, хървати и словенци · ⬜ Македония и отнетото Беломорие',
  1940: '🟩 България · 🟦 Кралство Югославия · ⬜ Македония и Беломорието не са в България',
  1947: '🟩 България — днешните граници',
};

// Стъпка 1: областите.
const EXPLORE = [
  { id: 'knyaz', icon: '🟩', label: 'Княжество България', note: 'Княжество България (1878 г.): между Дунав и Стара планина, заедно със Софийско.' },
  { id: 'rumelia', icon: '🟨', label: 'Източна Румелия', note: 'Източна Румелия: след Берлинския договор (1878 г.) е автономна област под властта на султана.' },
  { id: 'south', icon: '⛰️', label: 'Пирин, Родопите, Странджа', note: 'Пирин, Родопите и Странджа остават в Османската империя след 1878 г. Влизат в България след Балканските войни (1912–1913 г.).' },
  { id: 'sdob', icon: '🌾', label: 'Южна Добруджа', note: 'Южна Добруджа: между Дунав и Черно море, с Добрич и Балчик. През 1913 г. Румъния я взема.' },
  { id: 'west', icon: '🏔️', label: 'Западни покрайнини', note: 'Западните покрайнини: Царибродско, Босилеградско и Струмишко.' },
  { id: 'aegean', icon: '🌊', label: 'Беломорието', note: 'Беломорието: земите между реките Места и Марица до Бяло море.' },
  { id: 'macedonia', icon: '⬜', label: 'Македония', note: 'Македония: след Берлинския договор остава в Османската империя. В нея живеят много българи.' },
];

// Стъпка 2: задачи с плъзгача.
const TASKS = {
  rumelia: { year: 1885, ids: ['rumelia'], ask: 'Премести плъзгача на <b>1885 г.</b> Кликни земята, която се присъединява със Съединението.',
    hint: 'Съединението е през 1885 г. Премести плъзгача там.', good: 'Източна Румелия се съединява с Княжеството през 1885 г.' },
  aegean: { year: 1913, ids: ['aegean'], ask: 'Намери годината, в която България <b>има излаз на Бяло море</b>. Кликни тази земя.',
    hint: 'В тази година България не стига до Бяло море. Премести плъзгача.', good: 'След 1913 г. България има излаз на Бяло море — Беломорието.' },
  sdob13: { year: 1913, ids: ['sdob'], ask: 'Премести плъзгача на <b>1913 г.</b> Кликни земята, която България губи в полза на Румъния.',
    hint: 'Търсим 1913 г. — годината на Букурещкия договор.', good: 'По Букурещкия договор (1913 г.) Южна Добруджа отива към Румъния.' },
  west: { year: 1919, ids: WEST, ask: 'Премести плъзгача на <b>1919 г.</b> Кликни земите на запад, които България губи по Ньойския договор.',
    hint: 'Ньойският договор е от 1919 г. Премести плъзгача там.', good: 'Западните покрайнини отиват към Кралството на сърби, хървати и словенци.' },
  aegean19: { year: 1919, ids: ['aegean'], ask: 'Остани на <b>1919 г.</b> Кликни земята, с която България губи излаза си на Бяло море.',
    hint: 'Търсим 1919 г. — годината на Ньойския договор.', good: 'По Ньойския договор България губи Беломорието и излаза на Бяло море.' },
  sdob40: { year: 1940, ids: ['sdob'], ask: 'Премести плъзгача на <b>1940 г.</b> Кликни земята, която се връща на България мирно.',
    hint: 'Търсим 1940 г. Премести плъзгача там.', good: 'С Крайовската спогодба (септември 1940 г.) Южна Добруджа се връща мирно.' },
};
const WHAT = {
  knyaz: 'Това е Северна България със Софийско — тя е българска през целия период.',
  rumelia: 'Това е Източна Румелия.', south: 'Това са Пирин, Родопите и Странджа.', sdob: 'Това е Южна Добруджа.',
  west: 'Това са Западните покрайнини.', aegean: 'Това е Беломорието.', macedonia: 'Това е Македония.',
};

// Стъпка 3: договорите и промените (short — по-кратък надпис за тесен екран).
const ORDER = {
  1878: { slot: 'Берлин 1878', card: 'Княжество и автономна Източна Румелия', short: 'Княжество и Румелия' },
  1885: { slot: 'Съединение 1885', card: 'Източна Румелия се присъединява', short: 'Румелия се присъединява' },
  1913: { slot: 'Букурещ 1913', card: 'Губи Южна Добруджа и Македония', short: 'Губи Южна Добруджа' },
  1919: { slot: 'Ньой 1919', card: 'Губи Западните покрайнини и Беломорието', short: 'Губи Беломорието' },
  1940: { slot: 'Крайова 1940', card: 'Южна Добруджа се връща мирно', short: 'Южна Добруджа се връща' },
};
const CARD_WHY = {
  1878: 'Това е първото решение след Освобождението.',
  1885: 'Тази промяна не е по договор: българите сами обявяват обединението.',
  1913: 'Това е загубата след Междусъюзническата война.',
  1919: 'Това е загубата след Първата световна война.',
  1940: 'Това е мирна промяна, преди България да влезе във Втората световна война.',
};

const CFG = {
  '7.2.6': { slider: [1878, 1885, 1913, 1919], tasks: ['rumelia', 'aegean', 'sdob13', 'west'], order: [1878, 1885, 1913, 1919], predict: 1940 },
  '9.1.2': { slider: [1885, 1913, 1919], tasks: ['aegean', 'sdob13', 'west', 'aegean19'], order: [1878, 1885, 1913, 1919], predict: 1940 },
  '10.3.6': { slider: [1878, 1885, 1913, 1919, 1940], tasks: ['rumelia', 'sdob13', 'west', 'sdob40'], order: [1878, 1885, 1913, 1919, 1940], predict: 1947 },
};
const PREDICT = {
  1940: { from: 1919, focus: 'sdob',
    ask: 'През 1940 г. България и Румъния преговарят за Южна Добруджа. <b>Какво ще стане според теб?</b>',
    opts: [
      { t: 'Южна Добруджа се връща на България мирно, със спогодба.', ok: true },
      { t: 'Започва нова война между България и Румъния.', why: 'Не. Този път спорът се решава без война.' },
      { t: 'Южна Добруджа остава в Румъния и до днес.', why: 'Не. Днес Добрич и Балчик са в България.' },
    ],
    show: '<b>Така и става.</b> С Крайовската спогодба (септември 1940 г.) Южна Добруджа се връща на България мирно.' },
  1947: { from: 1940, focus: 'rumelia',
    ask: '1947 г.: България е сред победените във Втората световна война. <b>Какви ще са границите ѝ по Парижкия мирен договор?</b>',
    opts: [
      { t: 'Остават границите към 1 януари 1941 г. — заедно с Южна Добруджа.', ok: true },
      { t: 'Връщат се границите от 1919 г. — без Южна Добруджа.', why: 'Не. Южна Добруджа е върната мирно, със спогодба, и това е признато.' },
      { t: 'България запазва земите, които управлява през 1941–1944 г.', why: 'Не. Тези земи не са признати за български и през 1944 г. България се изтегля от тях.' },
    ],
    show: '<b>Така и става.</b> Парижкият мирен договор (1947 г.) потвърждава границите на България към 1 януари 1941 г. Това са днешните ѝ граници.' },
};

export function mount(container, { skill = {}, onComplete } = {}) {
  const cfg = CFG[skill.id] || CFG['10.3.6'];
  const shell = createShell(container, { steps: ['Опознай', 'Изследвай с плъзгача', 'Подреди договорите', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[-0.4, 8.0 * far, 5.4 * far], [-0.4, 0, 0.3]];
  // На тесен екран в стъпка 3 камерата гледа главно линията, за да се четат картите.
  const VIEW3 = far > 1 ? [[0, 10, 12.4], [0, 0, 3.5]] : [[0, 7.6, 10.2], [0, 0, 2.3]];
  const stage = createStage(shell.stageEl, { background: 0xdcecf7, camPos: VIEW[0], target: VIEW[1], maxDistance: 30 });

  let map = null, reg = null, decor = null, menu = null, tip = null, clickHandler = null, stopDrag = null, tl = null;
  const scores = [];
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.7, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const anchorOf = (gid) => reg.anchor(gid === 'west' ? 'tsar' : gid);
  const show = (year, extra = {}) => reg.paint({ ...STATES[year].c, ...extra }, { labels: MAIN });

  // Ордината на линията: гнездата са на равни разстояния, а не по години (иначе 1913 и 1919 се сливат).
  function buildTimeline() {
    const n = cfg.order.length;
    tl = createTimeline(stage, { from: 1e-6, to: n + 1, z: 3.7, length: far > 1 ? 8.4 : 9.6, tick: 1000, tickLabel: () => ' ', centuryBands: false });
    cfg.order.forEach((y, i) => tl.addSlot(`y${y}`, { year: i + 1, label: ORDER[y].slot }));
    const spot = cardSpots(n, far > 1);
    // Картите са разбъркани, но винаги по един и същи начин (тестовете знаят реда).
    const mix = [2, 0, 3, 1, 4].filter((i) => i < n).map((i) => cfg.order[i]);
    mix.forEach((y, i) => { tl.addCard(`c${y}`, { label: far > 1 ? ORDER[y].short : ORDER[y].card, ...spot(i) }); tl.cards.get(`c${y}`).visible = false; });
    tl.group.visible = false;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    reg.paint({ knyaz: COL.bg, rumelia: COL.auto, south: COL.bgNew, sdob: COL.ro, tsar: COL.rs, bosil: COL.rs, strum: COL.rs, aegean: COL.gr, macedonia: COL.lost }, { labels: MAIN });
    shell.task('Тук са земите, чиито граници се менят от 1878 до 1947 г. Разгледай всяка: избери я от менюто или кликни върху картата.');
    const seen = new Set();
    const open = (gid) => {
      const it = EXPLORE.find((x) => x.id === gid);
      if (!it) return;
      const a = anchorOf(gid);
      stage.focusOn(a, { dist: 3.8 * far, height: 3.6 * far, keepFollow: false });
      say(a, `<b>${esc(it.label)}</b><br>${esc(it.note)}${APPROX}`, { cls: 'wide' });
      seen.add(gid); menu.mark(gid); menu.setActive(gid);
      shell.score(`Разгледани: ${seen.size} от ${EXPLORE.length}`);
      if (seen.size === EXPLORE.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: EXPLORE.map(({ id, label, icon }) => ({ id, label, icon })), onSelect: open });
    clickHandler = (id) => { if (id) open(groupOf(id)); };
    shell.setControls('');
  }

  // ---------- 2. Изследвай с плъзгача ----------
  function step2() {
    shell.step(1);
    stage.flyTo(VIEW[0], VIEW[1], 1);
    let mistakes = 0, k = 0, tries = 0;
    const years = cfg.slider;
    const c = shell.setControls(`<div class="yr-title small"></div>
      <input class="yr-range" type="range" min="0" max="${years.length - 1}" step="1" value="0" style="width:100%">
      <div class="row small" style="justify-content:space-between">${years.map((y) => `<span>${y}</span>`).join('')}</div>
      <div class="yr-legend small"></div>`);
    const range = c.querySelector('.yr-range');
    const year = () => years[+range.value];
    const update = () => {
      const y = year();
      c.querySelector('.yr-title').innerHTML = `<b>${esc(STATES[y].title)}</b>`;
      c.querySelector('.yr-legend').textContent = LEGEND[y];
      show(y);
    };
    range.addEventListener('input', update);
    update();
    const ask = () => { shell.task(TASKS[cfg.tasks[k]].ask); shell.score(`Задачи: ${k} от ${cfg.tasks.length}`); };
    ask();
    clickHandler = (raw) => {
      if (!raw || k >= cfg.tasks.length) return;
      const t = TASKS[cfg.tasks[k]];
      const gid = groupOf(raw);
      const okRegion = t.ids.includes(raw);
      if (okRegion && year() !== t.year) { mistakes++; tries++; shell.msg(t.hint, 'bad'); return; }
      if (!okRegion) {
        mistakes++; tries++;
        shell.msg(`${WHAT[gid] || ''} Потърси друга земя.`, 'bad');
        if (tries >= 2) { reg.blink(t.ids[0]); say(reg.anchor(t.ids[0]), 'Подсказка: тук', { cls: 'tag' }); }
        return;
      }
      tries = 0; reg.blink(null);
      say(reg.anchor(t.ids[0]), `<b>${esc(STATES[t.year].title)}</b><br>${esc(t.good)}${APPROX}`, { cls: 'good wide' });
      shell.msg('Вярно!', 'good');
      k++;
      if (k < cfg.tasks.length) { ask(); return; }
      scores.push(stepScore(mistakes, 3));
      shell.score(`Задачи: ${k} от ${cfg.tasks.length}`);
      shell.task('Браво! Можеш още да местиш плъзгача и да сравняваш границите.');
      const n = document.createElement('button');
      n.className = 'btn primary next'; n.textContent = 'Напред →';
      shell.controls.appendChild(n);
      n.addEventListener('click', () => { clearTip(); step3(); });
    };
  }

  // ---------- 3. Подреди договорите ----------
  function step3() {
    shell.step(2);
    clickHandler = null;
    tl.group.visible = true;
    for (const y of cfg.order) tl.cards.get(`c${y}`).visible = true;
    stage.flyTo(VIEW3[0], VIEW3[1], 1);
    show(cfg.order[0]);
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Под картата са договорите. Завлечи всяка промяна при договора или събитието, което я донася. Картата ще покаже границите след него.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${cfg.order.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.25,
      onDrop(obj) {
        const y = +obj.userData.dragId.slice(1);
        const slot = tl.slotAt(obj.position);
        if (!slot) { tl.sendHome(`c${y}`); return; }
        if (slot === `y${y}`) {
          tl.placeCard(`c${y}`, slot);
          tl.markSlot(slot, 0x2fb36b);
          placed++;
          show(y);
          shell.score(`Подредени: ${placed} от ${cfg.order.length}`);
          shell.msg(`Вярно! ${STATES[y].title}.`, 'good');
          if (placed === cfg.order.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[y] = (tries[y] || 0) + 1;
          tl.sendHome(`c${y}`);
          shell.msg(`Не е тук. ${CARD_WHY[y]}`, 'bad');
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
    const P = PREDICT[cfg.predict];
    show(P.from);
    stage.flyTo(VIEW[0], VIEW[1], 1);
    let mistakes = 0;
    shell.task(P.ask);
    const c = shell.setControls(`<div class="col">${P.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const o = P.opts[+b.dataset.i];
      if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      show(cfg.predict, { sdob: COL.bgNew });
      reg.blink('sdob');
      say(reg.anchor(P.focus), P.show + APPROX, { cls: 'good wide' });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => {
        clearTip(); reg.blink(null);
        const ratio = scores.reduce((s, x) => s + x, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    }));
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    if (menu) menu.remove();
    reg.blink(null);
    tl.reset();
    tl.group.visible = false;
    for (const card of tl.cards.values()) card.visible = false;
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  shell.task('Зареждане на картата…');
  (async () => {
    map = await createMap(stage, { center: [24.8, 42.4], unitsPerDeg: 1.45, focus: 'none', showNames: false });
    reg = await createRegions(stage, map, { ids: IDS, names: { tsar: 'Западни покрайнини', strum: 'Струмишко' } });
    decor = mapDecor(stage, map, [
      { text: 'Черно море', lon: 29.6, lat: 42.9, sea: true }, { text: 'Бяло море', lon: 24.6, lat: 40.2, sea: true },
    ]);
    buildTimeline();
    step1();
  })().catch((e) => shell.msg(`Картата не се зареди: ${e.message}`, 'bad'));

  container.__demo = { stage, get map() { return map; }, get reg() { return reg; }, get tl() { return tl; }, cfg,
    at: (id) => (reg && reg.anchors.has(id) ? reg.screenOf(id) : stage.screenOf(id)) };
  return { dispose() { if (stopDrag) stopDrag(); if (menu) menu.remove(); if (decor) decor.dispose(); if (reg) reg.dispose(); if (tl) tl.dispose(); stage.dispose(); } };
}
