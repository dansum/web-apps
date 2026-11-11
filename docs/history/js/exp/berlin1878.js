// Сан Стефано и Берлин (1878) — карта, която детето „сглобява“ само.
// Обслужва: 10.3.1 „Сан Стефано и Берлин“ и 7.2.1 „Берлинският конгрес и националният въпрос“
// (разликите са в стъпка 3 според skill.id).
// Стъпки: опознай Санстефанска България → сглоби картата след Берлин → сравни двете граници → предскажи.
// Границите са опростена схема (data/geo/bg-history.json) — сцената показва „Приблизителни граници“.
import { createStage, cornerMenu, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { createRegions, mapDecor, COL } from './hist/regions.js';

const APPROX = '<br><i class="small">Приблизителни граници.</i>';
// Стъпка 1: Санстефанска България (3 март 1878 г.).
const SS_ITEMS = [
  { id: 'sanstefano', icon: '📜', label: 'Сан Стефано', place: true,
    note: '<b>Сан Стефано, 3 март 1878 г.</b><br>Край Цариград Русия и Османската империя подписват мирния договор след Руско-турската война. България става автономно княжество, васално на султана.' },
  { id: 'knyaz', icon: '🟩', label: 'Мизия и Софийско',
    note: '<b>Мизия и Софийско</b><br>Земите между Дунав и Стара планина и Софийско. Влизат в Санстефанска България.' },
  { id: 'rumelia', icon: '🟩', label: 'Северна Тракия',
    note: '<b>Северна Тракия</b><br>Пловдив, Стара Загора, Сливен, Бургас. Влизат в Санстефанска България.' },
  { id: 'makodr', icon: '🟩', label: 'Македония и Одринско',
    note: '<b>Македония и Одринска Тракия</b><br>Голяма част от тях влизат в Санстефанска България. Тя стига до Бяло море.' },
  { id: 'ohrid', icon: '📍', label: 'Охрид', place: true,
    note: '<b>Охрид</b><br>На запад Санстефанска България стига до Охрид.' },
];
const SS_REGIONS = ['knyaz', 'sdob', 'tsar', 'bosil', 'rumelia', 'makodr'];
const SS_GROUP = { knyaz: 'knyaz', sdob: 'knyaz', tsar: 'knyaz', bosil: 'knyaz', rumelia: 'rumelia', makodr: 'makodr' };
// Стъпка 2: решенията на Берлинския конгрес (1 юли по стар стил, 13 юли 1878 г. по нов стил).
const BERLIN = [
  { id: 'knyaz', ask: 'Кликни земята, която става <b>Княжество България</b>.', color: COL.bg, name: 'Княжество България',
    note: 'Княжество България: между Дунав и Стара планина, заедно със Софийско. Васално на султана.' },
  { id: 'rumelia', ask: 'Кликни земята, която става <b>автономна област под властта на султана</b>, с губернатор християнин.', color: COL.auto, name: 'Източна Румелия',
    note: 'Източна Румелия: автономна област под властта на султана, с губернатор християнин.' },
  { id: 'makodr', ask: 'Кликни земите, които са <b>върнати на Османската империя</b>.', color: COL.otto, name: 'Македония и Одринско',
    note: 'Македония и Одринско са върнати на Османската империя.' },
  { id: 'ndob', ask: 'Кликни земята, която отива към <b>Румъния</b>.', color: COL.ro, name: 'Северна Добруджа',
    note: 'Северна Добруджа отива към Румъния.' },
  { id: 'nish', ask: 'Кликни земите, които отиват към <b>Сърбия</b>.', color: COL.rs, name: 'Нишко и Пиротско',
    note: 'Нишко и Пиротско отиват към Сърбия.' },
];
// Защо е грешно: кратко описание на областта, без да издава отговора.
const WHERE = {
  knyaz: 'Това са земите между Дунав и Стара планина и Софийско.',
  rumelia: 'Това е областта на юг от Стара планина: Пловдив, Стара Загора, Бургас.',
  makodr: 'Това са Македония и Одринска Тракия.',
  ndob: 'Това е земята между долния Дунав и Черно море — Северна Добруджа.',
  nish: 'Това са Ниш и Пирот, на северозапад от София.',
};
const BERLIN_IDS = BERLIN.map((b) => b.id);
const MAIN = ['knyaz', 'rumelia', 'makodr', 'ndob', 'nish'];
const ALL_IDS = [...new Set([...SS_REGIONS, ...BERLIN_IDS])];
// Стъпка 3 за 10.3.1: кой договор?
const CLAUSES = [
  { t: 'Подписан от Русия и Османската империя', ans: 'ss' },
  { t: 'Решен от Великите сили на конгрес', ans: 'b' },
  { t: 'Една голяма българска държава до Бяло море', ans: 'ss' },
  { t: 'Княжество България и автономна Източна Румелия', ans: 'b' },
];
// Стъпка 4: какво наистина става.
const PREDICT = [
  { t: 'Българите ще се стремят да се обединят. През 1885 г. Източна Румелия се съединява с Княжеството.', ok: true },
  { t: 'Източна Румелия ще остане отделна област завинаги.', ok: false,
    why: 'Не. Днес Пловдив и Стара Загора са в България. Разделението не трае дълго.' },
  { t: 'Великите сили скоро ще дадат и Македония на Княжеството.', ok: false,
    why: 'Не. Македония остава в Османската империя. Точно затова възниква българският национален въпрос.' },
];

export function mount(container, { skill = {}, onComplete } = {}) {
  const grade7 = String(skill.id || '').startsWith('7.');
  const shell = createShell(container, { steps: ['Опознай', 'Сглоби картата', 'Сравни границите', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[0, 7.0 * far, 4.6 * far], [0, 0, 0.3]];
  const stage = createStage(shell.stageEl, { background: 0xdcecf7, camPos: VIEW[0], target: VIEW[1], maxDistance: 30 });

  let map = null, reg = null, decor = null, menu = null, tip = null, clickHandler = null;
  const scores = [];
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.7, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const anchorOf = (id) => reg.anchor(id) || map.places.get(id);

  function paintSS() {
    const c = {};
    for (const id of SS_REGIONS) c[id] = COL.bg;
    reg.paint(c, { labels: false });
  }
  const groupOf = (id) => SS_GROUP[id] || id;

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    paintSS();
    map.showPlace('sanstefano', true); map.showPlace('ohrid', true);
    shell.task('Това е <b>Санстефанска България</b> (зелено). Разгледай договора и земите ѝ: избери всяко от менюто или кликни върху картата.');
    const seen = new Set();
    const open = (id) => {
      const it = SS_ITEMS.find((x) => x.id === id);
      if (!it) return;
      const a = anchorOf(id);
      stage.focusOn(a, { dist: 4.2 * far, height: 4 * far, keepFollow: false });
      say(a, it.note + (it.place ? '' : APPROX), { cls: 'wide' });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${SS_ITEMS.length}`);
      if (seen.size === SS_ITEMS.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: SS_ITEMS.map(({ id, label, icon }) => ({ id, label, icon })), onSelect: open });
    clickHandler = (id) => { if (id) open(groupOf(id)); };
    shell.setControls('');
  }

  // ---------- 2. Сглоби картата след Берлин ----------
  function step2() {
    shell.step(1);
    shell.score('');
    stage.flyTo(VIEW[0], VIEW[1], 1);
    map.showPlace('ohrid', false);
    let mistakes = 0, k = 0, tries = 0, view = 'b';
    const done = new Set();
    const drawBerlin = () => {
      const c = {};
      for (const id of BERLIN_IDS) c[id] = done.has(id) ? BERLIN.find((b) => b.id === id).color : 0xf4efe2;
      for (const id of ['sdob', 'tsar', 'bosil']) c[id] = done.has('knyaz') ? COL.bg : 0xf4efe2;
      reg.paint(c, { labels: false });
      for (const id of done) reg.regions.get(id).userData.label.visible = true;
    };
    const setView = (v) => {
      view = v;
      if (v === 'ss') paintSS(); else drawBerlin();
      shell.controls.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('primary', b.dataset.view === v));
    };
    const ask = () => {
      shell.task(`Великите сили променят договора в Берлин (юли 1878 г.). Белите земи чакат решение. ${BERLIN[k].ask}`);
      shell.score(`Решения: ${k} от ${BERLIN.length}`);
    };
    shell.setControls('<div class="row"><button class="btn" data-view="ss">Сан Стефано</button><button class="btn primary" data-view="b">След Берлин</button></div>');
    shell.controls.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    drawBerlin();
    ask();
    clickHandler = (raw) => {
      if (!raw || k >= BERLIN.length) return;
      const id = groupOf(raw);
      if (!BERLIN_IDS.includes(id)) return;
      if (view !== 'b') { shell.msg('Превключи на картата „След Берлин“, за да отбележиш решението.', 'bad'); return; }
      const want = BERLIN[k];
      if (id !== want.id) {
        if (done.has(id)) { shell.msg('За тази земя вече е решено. Потърси бяла земя.', 'bad'); return; }
        mistakes++; tries++;
        shell.msg(`${WHERE[id]} Помисли пак какво решава конгресът за нея.`, 'bad');
        if (tries >= 2) { reg.blink(want.id); say(reg.anchor(want.id), 'Подсказка: тук', { cls: 'tag' }); }
        return;
      }
      tries = 0; reg.blink(null);
      done.add(id);
      drawBerlin();
      say(reg.anchor(id), `<b>${esc(want.name)}</b><br>${esc(want.note)}${APPROX}`, { cls: 'good wide' });
      shell.msg('Вярно!', 'good');
      k++;
      if (k < BERLIN.length) { ask(); return; }
      scores.push(stepScore(mistakes, 3));
      shell.task('Картата след Берлинския конгрес е готова. Сравни я със Санстефанска България с бутоните.');
      shell.score(`Решения: ${k} от ${BERLIN.length}`);
      const c = shell.setControls('<div class="row"><button class="btn" data-view="ss">Сан Стефано</button><button class="btn primary" data-view="b">След Берлин</button></div><button class="btn primary next">Напред →</button>');
      c.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
      c.querySelector('.next').addEventListener('click', () => { clearTip(); step3(); });
    };
  }

  // ---------- 3. Сравни двете граници ----------
  function step3() {
    shell.step(2);
    stage.flyTo(VIEW[0], VIEW[1], 1);
    let mistakes = 0;
    // Санстефанска България е бяла с надписи; Княжеството е зелено.
    const base = () => {
      const c = { knyaz: COL.bg, sdob: COL.bg, tsar: COL.bg, bosil: COL.bg, rumelia: 0xf4efe2, makodr: 0xf4efe2 };
      for (const id of chosen) c[id] = COL.pick;
      reg.paint(c, { labels: false });
      reg.regions.get('knyaz').userData.label.visible = true;
    };
    const chosen = new Set();
    base();
    shell.task('Зелено е Княжество България след Берлин. Белите земи също са били в Санстефанска България. <b>Кои земи от Санстефанска България остават извън Княжеството?</b> Кликни всички, после „Провери“.');
    const c = shell.setControls('<button class="btn primary check">Провери</button>');
    shell.score('');
    clickHandler = (raw) => {
      if (!raw) return;
      const id = groupOf(raw);
      if (!['knyaz', 'rumelia', 'makodr'].includes(id)) return;
      if (id === 'knyaz') { mistakes++; shell.msg('Зелената земя е самото Княжество. Търси земите, които са били в Санстефанска България, но не са в него.', 'bad'); return; }
      if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
      base();
      shell.msg('');
    };
    c.querySelector('.check').addEventListener('click', () => {
      if (!(chosen.has('rumelia') && chosen.has('makodr'))) {
        mistakes++;
        shell.msg(chosen.size ? 'Още не са всички. Сравни с картата на Санстефанска България.' : 'Кликни земите извън зеленото.', 'bad');
        return;
      }
      clickHandler = null;
      reg.paint({ knyaz: COL.bg, sdob: COL.bg, tsar: COL.bg, bosil: COL.bg, rumelia: COL.auto, makodr: COL.otto }, { labels: MAIN });
      say(reg.anchor('makodr'), 'Българите в Източна Румелия, Македония и Одринско остават <b>извън</b> Княжеството.' + APPROX, { cls: 'wide' });
      shell.msg('Вярно!', 'good');
      if (grade7) askNational(); else askClauses();
    });
    const finishStep = () => {
      scores.push(stepScore(mistakes, 3));
      const n = shell.setControls('<button class="btn primary">Напред →</button>');
      n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
    };
    // 7. клас: понятието „национален въпрос“.
    function askNational() {
      shell.task('Как наричаме стремежа на българите от тези земи да живеят в една държава с останалите българи?');
      const opts = [
        { t: 'Българският национален въпрос', ok: true },
        { t: 'Църковният въпрос', why: 'Църковният въпрос е борбата за самостоятелна българска църква — тя е решена още през 1870 г.' },
        { t: 'Източният въпрос', why: 'Така се нарича спорът на Великите сили за земите на Османската империя. Търсим стремежа на самите българи.' },
      ];
      const cc = shell.setControls(`<div class="col">${opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
      cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const o = opts[+b.dataset.i];
        if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
        shell.msg('Да! Решенията в Берлин пораждат българския национален въпрос.', 'good');
        finishStep();
      }));
    }
    // 10. клас: клаузите на двата договора.
    function askClauses() {
      let i = 0;
      const next = () => {
        if (i >= CLAUSES.length) { shell.msg('Вярно! Различаваш двата договора.', 'good'); finishStep(); return; }
        shell.task(`Към кой договор се отнася: <b>„${esc(CLAUSES[i].t)}“</b>?`);
        shell.score(`Твърдения: ${i} от ${CLAUSES.length}`);
        const cc = shell.setControls('<div class="row"><button class="btn" data-a="ss">Санстефански</button><button class="btn" data-a="b">Берлински</button></div>');
        cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
          if (b.dataset.a !== CLAUSES[i].ans) {
            mistakes++; b.disabled = true;
            shell.msg(CLAUSES[i].ans === 'ss' ? 'Не. Спомни си кой подписва договора край Цариград през март.' : 'Не. Спомни си кой променя договора през лятото.', 'bad');
            return;
          }
          i++; shell.msg('Вярно!', 'good'); next();
        }));
      };
      next();
    }
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    shell.score('');
    reg.paint({ knyaz: COL.bg, sdob: COL.bg, tsar: COL.bg, bosil: COL.bg, rumelia: COL.auto, makodr: COL.otto, ndob: COL.ro, nish: COL.rs }, { labels: MAIN });
    const a = reg.anchor('rumelia');
    stage.focusOn(a, { dist: 4.6 * far, height: 4.2 * far, keepFollow: false });
    let mistakes = 0;
    shell.task('Българите в Източна Румелия са отделени от Княжеството само със Стара планина. <b>Какво ще стане според теб?</b>');
    const c = shell.setControls(`<div class="col">${PREDICT.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = PREDICT[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      reg.setColor('rumelia', COL.bgNew);
      reg.blink('rumelia');
      say(a, '<b>Така и става.</b> На 6 септември 1885 г. в Пловдив е обявено Съединението на Княжество България и Източна Румелия. Македония и Одринско остават в Османската империя.' + APPROX, { cls: 'good wide' });
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
    clearTip();
    if (menu) menu.remove();
    reg.blink(null);
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  shell.task('Зареждане на картата…');
  (async () => {
    map = await createMap(stage, { center: [24.8, 42.4], unitsPerDeg: 1.2, focus: 'none', showNames: false });
    reg = await createRegions(stage, map, { ids: ALL_IDS });
    decor = mapDecor(stage, map, [
      { text: 'Черно море', lon: 30.0, lat: 43.0, sea: true }, { text: 'Бяло море', lon: 24.6, lat: 39.9, sea: true },
      { text: 'Румъния', lon: 25.0, lat: 44.75 }, { text: 'Сърбия', lon: 20.6, lat: 44.1 }, { text: 'Гърция', lon: 21.9, lat: 39.4 },
      { text: 'Османска империя', lon: 27.6, lat: 41.15 },
    ]);
    map.addPlace('sanstefano', { lon: 28.82, lat: 40.97, label: 'Сан Стефано', color: 0x2b6cb0, labelDx: -0.2 });
    map.addPlace('ohrid', { lon: 20.8, lat: 41.12, label: 'Охрид', color: 0x2b6cb0 });
    step1();
  })().catch((e) => shell.msg(`Картата не се зареди: ${e.message}`, 'bad'));

  container.__demo = { stage, get map() { return map; }, get reg() { return reg; }, at: (id) => (reg && reg.anchors.has(id) ? reg.screenOf(id) : stage.screenOf(id)) };
  return { dispose() { if (menu) menu.remove(); if (decor) decor.dispose(); if (reg) reg.dispose(); stage.dispose(); } };
}
