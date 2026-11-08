// 3.2.2 „Владетелите и делата им“ — жива карта на България и линия на времето (VII–X век).
// Стъпки: опознай → изследвай с плъзгача (столицата се мести) → подреди делата → предскажи последицата.
import { createStage, cornerMenu, mat, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { createTimeline } from './hist/timeline.js';

// Факти по учебната програма за III клас: владетелят и делото, което обединява обществото.
const RULERS = [
  { id: 'asparuh', label: 'Хан Аспарух', year: 681, icon: '🐎',
    note: 'През 681 г. Византия признава новата държава на българите и славяните. Аспарух е неин първи владетел.' },
  { id: 'krum', label: 'Хан Крум', year: 803, icon: '📜',
    note: 'Хан Крум управлява от около 803 г. Той дава закони, които важат еднакво за българи и славяни.' },
  { id: 'boris', label: 'Княз Борис I', year: 864, icon: '✝️',
    note: 'През 864 г. Борис I приема християнството. Българи и славяни вече имат една вяра.' },
  { id: 'simeon', label: 'Цар Симеон', year: 893, icon: '📚',
    note: 'Симеон управлява от 893 г. Тогава се пишат много книги на старобългарски. Това време наричаме „Златен век“.' },
];
const DEEDS = [
  { id: 'd-state', ruler: 'asparuh', label: 'Създава държавата',
    why: 'Това е най-ранното дело. Потърси първия владетел на линията.' },
  { id: 'd-laws', ruler: 'krum', label: 'Дава общи закони',
    why: 'Законите идват, след като държавата вече съществува, но преди покръстването.' },
  { id: 'd-faith', ruler: 'boris', label: 'Покръства народа',
    why: 'Покръстването е през IX век, но преди „Златния век“.' },
  { id: 'd-books', ruler: 'simeon', label: 'Златен век на книгите',
    why: 'Книгите на старобългарски се пишат много след покръстването. Потърси най-късния владетел.' },
];
const PLACES = [
  { id: 'pliska', label: 'Плиска', lon: 27.38, lat: 43.38, labelDx: 0.55,
    note: 'Плиска е първата столица на България. Тук е построена и Голямата базилика.' },
  { id: 'preslav', label: 'Преслав', lon: 26.82, lat: 43.16, labelDx: -0.55,
    note: 'През 893 г. столицата се мести в Преслав. Градът става център на книжовността.' },
];
const MOVE_YEAR = 893;
const PREDICT = [
  { t: 'Българи и славяни имат обща вяра и се сплотяват още повече в един народ.', ok: true },
  { t: 'Българите забравят езика си и започват да пишат само на гръцки.', ok: false,
    why: 'Точно обратното: скоро книгите се пишат на старобългарски език.' },
  { t: 'Държавата се разпада веднага.', ok: false,
    why: 'Не. Държавата продължава да съществува и да укрепва.' },
];

function church() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.8), mat(0xf4efe4));
  body.position.y = 0.15;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 4), mat(0xb5553a));
  roof.position.y = 0.45; roof.rotation.y = Math.PI / 4; roof.scale.z = 1.5;
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), mat(0xd4af37));
  cross.position.y = 0.7;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), mat(0xd4af37));
  bar.position.y = 0.74;
  g.add(body, roof, cross, bar);
  return g;
}
function cloud() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 1 });
  [[0, 0, 0, 0.45], [0.45, 0.05, 0.1, 0.35], [-0.45, 0, -0.05, 0.32], [0.1, 0.2, 0, 0.3]].forEach(([x, y, z, r]) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m);
    s.position.set(x, y, z);
    g.add(s);
  });
  return g;
}

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай', 'Изследвай с картата', 'Подреди делата', 'Предскажи'] });
  // Общ изглед: картата и линията. На тесен екран камерата се отдръпва.
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[0, 8.2 * far, 8.6 * far], [0, 0, far > 1 ? 2.5 : 1.7]];
  const stage = createStage(shell.stageEl, { background: 0xdcecf7, camPos: VIEW[0], target: VIEW[1], maxDistance: 30 });
  const { scene } = stage;

  let map = null;
  const tl = createTimeline(stage, { from: 650, to: 950, z: 3.9, length: 9, tick: 50, tickLabel: (y) => `${y}` });
  for (const r of RULERS) tl.addSlot(r.id, { year: r.year, label: `${r.icon} ${r.label}` });
  const cardXs = [-3.3, -1.1, 1.1, 3.3];
  DEEDS.forEach((d, i) => { tl.addCard(d.id, { label: d.label, x: cardXs[i], z: 5.6 }); tl.cards.get(d.id).visible = false; });

  const basilica = church();
  basilica.visible = false;
  scene.add(basilica);
  const clouds = [cloud(), cloud()];
  clouds.forEach((c, i) => { c.position.set(-4 + i * 5, 3.6 + i * 0.3, -3.2 + i * 0.8); scene.add(c); });
  stage.tick((dt, t) => {
    clouds.forEach((c, i) => { c.position.x += dt * (0.18 + i * 0.07); if (c.position.x > 6) c.position.x = -6; });
    if (basilica.visible) basilica.rotation.y = Math.sin(t * 0.6) * 0.15;
  });

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 1.1, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };

  const scores = [];
  let menu = null;
  let clickHandler = null;
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null, hit));
  let stopDrag = null;

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    shell.task('Разгледай владетелите на линията на времето и столиците на картата. Избери всеки от менюто или кликни върху него.');
    const items = [...RULERS.map((r) => ({ id: r.id, label: r.label, icon: r.icon })), ...PLACES.map((p) => ({ id: p.id, label: p.label, icon: '📍' }))];
    const seen = new Set();
    const open = (id) => {
      const r = RULERS.find((x) => x.id === id);
      const p = PLACES.find((x) => x.id === id);
      const obj = r ? tl.slots.get(id) : map.places.get(id);
      if (!obj) return;
      stage.focusOn(obj, { dist: 4.5, height: 2.4, keepFollow: false });
      say(obj, `<b>${esc((r || p).label)}</b><br>${esc((r || p).note)}`, { cls: 'wide' });
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${items.length}`);
      if (seen.size === items.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items, onSelect: open });
    clickHandler = (id) => { if (id && items.some((i) => i.id === id)) open(id); };
    shell.setControls('');
  }

  // ---------- 2. Изследвай: плъзгач на годината ----------
  function step2() {
    shell.step(1);
    stage.flyTo(VIEW[0], VIEW[1], 1);
    let mistakes = 0;
    let phase = 'slide';
    map.colorPlace('pliska', 0xf2b01e);
    map.colorPlace('preslav', 0x9a9a9a);
    shell.task('Премести плъзгача по годините. Златната карфица показва столицата. <b>В коя година столицата се мести?</b> Когато видиш промяната, кликни върху <b>новата</b> столица на картата.');
    const c = shell.setControls('<label class="small">Година: <b class="yr">650</b></label><input class="yr-range" type="range" min="650" max="950" step="1" value="650" style="width:100%">');
    const range = c.querySelector('.yr-range');
    const out = c.querySelector('.yr');
    let moved = false;
    const update = () => {
      const y = +range.value;
      out.textContent = y;
      tl.setCursor(y);
      const capital = y >= MOVE_YEAR ? 'preslav' : 'pliska';
      map.colorPlace('pliska', capital === 'pliska' ? 0xf2b01e : 0x9a9a9a);
      map.colorPlace('preslav', capital === 'preslav' ? 0xf2b01e : 0x9a9a9a);
      for (const r of RULERS) tl.markSlot(r.id, y >= r.year ? 0x14bf96 : 0xffffff);
      if (y >= MOVE_YEAR && !moved) { moved = true; say(map.places.get('preslav'), '<b>Столицата се смени!</b>', { cls: 'tag' }); }
      if (y < MOVE_YEAR && moved) { moved = false; clearTip(); }
    };
    range.addEventListener('input', update);
    tl.setCursor(650);
    clickHandler = (id) => {
      if (phase !== 'slide' || !id || !PLACES.some((p) => p.id === id)) return;
      if (+range.value < MOVE_YEAR) {
        mistakes++;
        shell.msg('Първо премести плъзгача, докато златната карфица смени мястото си.', 'bad');
        return;
      }
      if (id === 'pliska') {
        mistakes++;
        shell.msg('Плиска е първата столица. Коя карфица стана златна?', 'bad');
        return;
      }
      phase = 'who';
      range.disabled = true;
      say(map.places.get('preslav'), `<b>Преслав, ${MOVE_YEAR} г.</b><br>${esc(PLACES[1].note)}`, { cls: 'good wide' });
      shell.msg('Вярно! Новата столица е Преслав.', 'good');
      askWho();
    };
    function askWho() {
      shell.task(`Кой владетел управлява, когато столицата се мести в Преслав (${MOVE_YEAR} г.)? Погледни линията на времето.`);
      const cc = shell.setControls(`<div class="row">${RULERS.map((r) => `<button class="btn" data-id="${r.id}">${esc(r.label)}</button>`).join('')}</div>`);
      cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.id === 'simeon') {
          scores.push(stepScore(mistakes, 3));
          shell.msg('Да! Цар Симеон премества столицата в Преслав.', 'good');
          const n = shell.setControls('<button class="btn primary">Напред →</button>');
          n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
        } else {
          mistakes++;
          b.disabled = true;
          shell.msg(`Не. ${RULERS.find((r) => r.id === b.dataset.id).label} управлява по-рано. Търси владетеля, чиято година съвпада с ${MOVE_YEAR} г.`, 'bad');
        }
      }));
    }
  }

  // ---------- 3. Подреди делата ----------
  function step3() {
    shell.step(2);
    tl.hideCursor();
    for (const r of RULERS) tl.markSlot(r.id);
    for (const p of PLACES) map.colorPlace(p.id);
    stage.flyTo([0, 6.2 * far, 10.4 * far], [0, 0, 3.9], 1);
    let mistakes = 0;
    const tries = {};
    let placed = 0;
    for (const d of DEEDS) tl.cards.get(d.id).visible = true;
    shell.task('Завлечи всяко дело при владетеля, който го е извършил.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${DEEDS.length}`);
    clickHandler = null;
    stopDrag = stage.enableDrag({
      planeY: 0.25,
      onDrop(obj) {
        const deed = DEEDS.find((d) => d.id === obj.userData.dragId);
        const slot = tl.slotAt(obj.position);
        if (!slot) { tl.sendHome(deed.id); return; }
        if (slot === deed.ruler) {
          tl.placeCard(deed.id, slot);
          tl.markSlot(slot, 0x2fb36b);
          placed++;
          shell.score(`Подредени: ${placed} от ${DEEDS.length}`);
          const r = RULERS.find((x) => x.id === slot);
          say(tl.slots.get(slot), `<b>${esc(r.label)}</b>: ${esc(deed.label.toLowerCase())}.`, { cls: 'good' });
          shell.msg('Вярно!', 'good');
          if (placed === DEEDS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[deed.id] = (tries[deed.id] || 0) + 1;
          tl.sendHome(deed.id);
          shell.msg(deed.why, 'bad');
          if (tries[deed.id] >= 2) {
            tl.markSlot(deed.ruler, 0xf2b01e);
            say(tl.slots.get(deed.ruler), 'Подсказка: тук', { cls: 'tag' });
          }
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    shell.score('');
    const pl = map.places.get('pliska');
    stage.focusOn(pl, { dist: 5, height: 3, keepFollow: false });
    let mistakes = 0;
    shell.task('Княз Борис I решава българите да станат християни. <b>Какво ще последва според теб?</b>');
    say(pl, '<b>Плиска, 864 г.</b><br>Владетелят приема християнството.', { cls: 'wide' });
    const c = shell.setControls(`<div class="col">${PREDICT.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = PREDICT[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      // Проверка: показва какво наистина е станало.
      basilica.position.copy(map.pos(27.38, 43.38, 0.24)).add(new THREE.Vector3(0.5, 0, 0.55));
      basilica.visible = true;
      say(basilica, '<b>Така и става.</b> Българи и славяни имат обща вяра. В Плиска се строи Голямата базилика. Скоро в България идват учениците на Кирил и Методий и книгите се пишат на старобългарски.', { cls: 'good wide', lift: 0.9 });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => {
        clearTip();
        const ratio = scores.reduce((a, s) => a + s, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    }));
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    tl.reset();
    for (const d of DEEDS) tl.cards.get(d.id).visible = false;
    basilica.visible = false;
    for (const p of PLACES) map.colorPlace(p.id);
    if (menu) menu.remove();
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  shell.task('Зареждане на картата…');
  createMap(stage, { center: [25.4, 42.9], unitsPerDeg: 1.5 }).then((m) => {
    map = m;
    for (const p of PLACES) map.addPlace(p.id, p);
    step1();
  }).catch((e) => shell.msg(`Картата не се зареди: ${e.message}`, 'bad'));

  container.__demo = { tl, stage, get map() { return map; } };
  return { dispose() { if (stopDrag) stopDrag(); if (menu) menu.remove(); stage.dispose(); } };
}
