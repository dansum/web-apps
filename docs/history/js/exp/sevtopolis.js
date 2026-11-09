// 5.2.6 „Одриското царство“ — разходка в тракийския град Севтополис (края на IV в. пр.Хр.).
// Стъпки: разходка по спирките → пазарът: откъде идват стоките → поръчки при майсторите → предскажи размяната.
import { createStage, labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { person, wander } from './hist/antiquity.js';
import { wallSegment, tower, courtyardHouse, palace, forge, potteryWheel, goldTable, amphora, paintedCup, coins, stall, animal, graze } from './hist/thrace.js';
import { createWalk } from './hist/walk.js';
import { createMap } from './hist/map.js';

const DUG = '<span class="small">Разкопано</span>';
const REC = '<span class="small">Възстановка</span>';
// Спирки на разходката. Текстовете казват кое е разкопано и кое е възстановка (принцип 10).
const STOPS = [
  { id: 'gate', label: 'Портата и стената', icon: '🏰', at: [0, 12.8], look: [0, 0.7, 8], anchor: 'gateT',
    note: `Севтополис е град на одриския цар Севт III, построен в края на IV век пр.Хр. Стената има каменна основа, а отгоре е от кирпич — непечени глинени тухли. ${DUG}` },
  { id: 'street', label: 'Улиците', icon: '🛣️', at: [0, 8.2], look: [0, 0.4, 0], anchor: 'cross',
    note: `Улиците са прави и се пресичат под прав ъгъл — така строят и гърците. Траките взимат от съседите си това, което им харесва. ${DUG}` },
  { id: 'house', label: 'Къща с двор', icon: '🏠', at: [-0.7, 5.5], look: [-2.9, 0.3, 5.5], anchor: 'house',
    note: `Стаите са около двор. В двора е огнището, голям глинен съд за зърно и стан за тъкане. Покривът е от керемиди. Планът е ${'разкопан'}, предметите са възстановка.` },
  { id: 'crafts', label: 'Работилниците', icon: '⚒️', at: [0.4, 4.4], look: [2.5, 0.4, 4.4], anchor: 'forge',
    note: `Ковачът работи с желязо и бронз, грънчарят прави съдове на колело и ги пече в пещ, златарят изработва накити. Намерени са сечива и пещи. ${REC} на работилниците.` },
  { id: 'animals', label: 'Домашните животни', icon: '🐎', at: [3.4, 3.0], look: [5.6, 0.3, 5.4], anchor: 'horse',
    note: `Траките отглеждат коне, говеда, овце, кози и свине. Прочути са като конници — още Омир възпява конете на тракийския цар Резос. Костите на животни са от разкопките.` },
  { id: 'people', label: 'Хората и дрехите', icon: '🧥', at: [1.4, 1.4], look: [-0.4, 0.45, -0.4], anchor: 'man',
    note: 'Гръцкият историк Херодот пише, че траките носят шапки от лисича кожа, хитони, пъстри наметала и ботуши. Дрехите не са се запазили — това е възстановка по описания и изображения.' },
  { id: 'market', label: 'Пазарът', icon: '🏺', at: [-0.9, -1.0], look: [-3.4, 0.35, -2.4], eyeY: 1.5, anchor: 'stallA',
    note: `На пазара има амфори с вино от остров Тасос, рисувана гръцка керамика и монети. Всичко това е намерено в града. ${DUG}` },
  { id: 'palace', label: 'Дворецът на Севт III', icon: '👑', at: [0, -3.2], look: [0, 0.8, -7.2], eyeY: 1.9, anchor: 'palace',
    note: `В укрепената северна част са дворецът на царя и светилище. Тук е открит голям надпис на гръцки език, свързан със Севт III. Днес градът е под водата на язовир „Копринка“. ${DUG}` },
];
const GOODS = [
  { id: 'g-wine', label: 'Амфора с вино', from: 'thasos', note: 'Амфора за вино от остров Тасос. По печатите върху дръжките се познава откъде е.' },
  { id: 'g-cup', label: 'Рисувана чаша', from: 'apollonia', note: 'Рисувана гръцка чаша. Гръцките съдове идват и през гръцките градове по Черно море, като Аполония (днес Созопол).' },
  { id: 'g-mac', label: 'Монети от Македония', from: 'macedonia', note: 'Монети на македонските царе. Македония е силна съседка на траките.' },
  { id: 'g-seuth', label: 'Монети на Севт III', from: 'sevtopolis', note: 'Бронзови монети, които сече самият Севт III. Намерени са много в града.' },
];
const PLACES = [
  { id: 'thasos', label: 'Тасос', lon: 24.7, lat: 40.75 },
  { id: 'apollonia', label: 'Аполония', lon: 27.7, lat: 42.42 },
  { id: 'macedonia', label: 'Македония', lon: 22.5, lat: 40.76 },
  { id: 'sevtopolis', label: 'Севтополис', lon: 25.3, lat: 42.63 },
];
const ORDERS = [
  { id: 'o-fibula', label: 'Бронзова фибула', to: 'forge', why: 'Фибулата (закопчалка за наметало) е от метал.' },
  { id: 'o-spear', label: 'Желязно острие', to: 'forge', why: 'Острието е от желязо — то се кове на огън.' },
  { id: 'o-jug', label: 'Глинена кана', to: 'wheel', why: 'Каната е от глина — прави се на колело и се пече.' },
  { id: 'o-ring', label: 'Златен пръстен', to: 'gold', why: 'Пръстенът е накит от злато.' },
];
const PREDICT = [
  { t: 'Зърно, мед, восък и кожи от земите около града.', ok: true },
  { t: 'Чай и коприна от Китай.', ok: false, why: 'Китай е много далеч, а и тези стоки идват в Европа много по-късно.' },
  { t: 'Нищо — гърците не искат нищо от траките.', ok: false, why: 'Гърците купуват много от Тракия. Търговията е изгодна и за двете страни.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Разходка из града', 'Откъде са стоките?', 'Поръчки при майсторите', 'Предскажи'] });
  const stage = createStage(shell.stageEl, { background: 0xcfe6f7, camPos: [0, 9, 20], target: [0, 0, 2], minDistance: 0.3, maxDistance: 40, maxPolarAngle: Math.PI * 0.49 });
  const { scene } = stage;
  // Тесен екран: общите изгледи се отдръпват назад, за да се вижда цялата сцена.
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const view = (pos, tgt, dur = 1) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * far), tgt, dur);
  const named = {};
  const pick = (id, obj, size = 0.8) => { obj.userData.pickId = id; addHitBox(obj, size); named[id] = obj; return obj; };

  // Земя, река Тунджа, градът.
  const ground = new THREE.Mesh(new THREE.BoxGeometry(44, 0.1, 44), mat(0x9cb36b));
  ground.position.y = -0.06; scene.add(ground);
  const city = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.02, 19), mat(0xc8b48a));
  city.position.set(0, 0, -0.2); scene.add(city);
  const river = new THREE.Mesh(new THREE.BoxGeometry(44, 0.03, 2.2), mat(0x5fa8d8));
  river.position.set(0, 0, 15.5); scene.add(river);
  const street = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, d), mat(0xe2d3ab)); m.position.set(x, 0.01, z); scene.add(m); return m; };
  street(0, 1.5, 1.3, 16); named.cross = street(0, 0, 17, 1.2);

  // Стена: неправилен многоъгълник с порта на юг.
  const P = [[-8.6, 9], [-1.0, 9], [1.0, 9], [8.6, 9], [9.4, -2.2], [0, -9.6], [-9.4, -2.2]];
  const edges = [[0, 1], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]];
  for (const [a, b] of edges) {
    const [x1, z1] = P[a], [x2, z2] = P[b];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const w = wallSegment(len);
    w.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
    w.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    scene.add(w);
  }
  for (const [x, z] of P) { const t = tower(); t.position.set(x, 0, z); scene.add(t); }
  named.gateT = new THREE.Object3D(); named.gateT.position.set(0, 1.0, 9); scene.add(named.gateT);

  // Къщи.
  const houseMain = pick('house', courtyardHouse());
  houseMain.position.set(-2.9, 0, 5.5); houseMain.rotation.y = Math.PI / 2; scene.add(houseMain);
  for (const [x, z, r] of [[-2.9, 2.5, Math.PI / 2], [-6.0, 5.5, Math.PI / 2], [-6.0, 2.5, Math.PI / 2], [3.2, -2.6, -Math.PI / 2], [6.2, -2.6, -Math.PI / 2], [-6.2, -5.0, 0], [4.8, -5.4, 0]]) {
    const h = courtyardHouse(); h.position.set(x, 0, z); h.rotation.y = r; scene.add(h);
  }

  // Работилници и майстори.
  const fg = pick('forge', forge()); fg.position.set(2.5, 0, 6.0); scene.add(fg);
  const wh = pick('wheel', potteryWheel()); wh.position.set(2.5, 0, 4.3); scene.add(wh);
  const gt = pick('gold', goldTable()); gt.position.set(2.5, 0, 2.6); scene.add(gt);
  const smith = person('thracian'); smith.position.set(2.9, 0, 6.0); scene.add(smith);
  const potter = person('thracian'); potter.position.set(2.9, 0, 4.3); scene.add(potter);
  const goldsmith = person('thracianWoman'); goldsmith.position.set(2.95, 0, 2.6); scene.add(goldsmith);
  for (const [g, x] of [[fg, 2.5], [wh, 2.5], [gt, 2.5]]) {
    const l = labelSprite({ forge: 'Ковач', wheel: 'Грънчар', gold: 'Златар' }[g.userData.pickId], { size: 0.2 });
    l.position.set(0, 1.0, 0); g.add(l);
  }

  // Загон с животни.
  const pen = new THREE.Group(); pen.position.set(5.6, 0, 5.4); scene.add(pen);
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.05), mat(0x6b4f36)); p.position.set(Math.cos(a) * 1.8, 0.17, Math.sin(a) * 1.4); pen.add(p); }
  const herd = ['horse', 'horse', 'cow', 'sheep', 'sheep', 'sheep', 'goat', 'pig'].map((k, i) => {
    const a = animal(k); a.position.set(5.6 + Math.cos(i * 0.8) * 0.9, 0, 5.4 + Math.sin(i * 0.8) * 0.6); scene.add(a); return a;
  });
  named.horse = herd[0];
  graze(stage, herd, { r: 0.35, speed: 0.22 });

  // Пазар: сергии и стоки.
  const stA = stall(); stA.position.set(-3.2, 0, -2.6); scene.add(stA); named.stallA = stA;
  const stB = stall(); stB.position.set(-4.7, 0, -1.4); stB.rotation.y = Math.PI / 2.5; scene.add(stB);
  const goodsObj = {};
  const place = (id, obj, parent, x) => { obj.position.x = x; obj.position.y += 0.38; parent.add(obj); const g = pick(id, obj, 0.32); goodsObj[id] = g; return g; };
  place('g-wine', amphora(), stA, -0.42); place('g-cup', paintedCup(), stA, 0.05); place('g-mac', coins(0xc9c9c9), stA, 0.45);
  place('g-seuth', coins(), stB, 0.0);
  const trader = person('citizen'); trader.position.set(-3.2, 0, -3.15); scene.add(trader);

  // Дворецът.
  const pal = pick('palace', palace(), 1.4); pal.position.set(0, 0, -7.2); scene.add(pal);
  for (const [x1, z1, x2, z2] of [[-3, -5, 3, -5]]) { const w = wallSegment(Math.hypot(x2 - x1, z2 - z1) - 1.4, { h: 0.8 }); w.position.set(-1.65, 0, z1); scene.add(w); const w2 = w.clone(); w2.position.x = 1.65; scene.add(w2); }

  // Хора по улиците.
  const folk = [];
  [[0.3, 7.2, 'thracian'], [-0.4, 3.4, 'thracianWoman'], [0.4, -0.6, 'thracian'], [-1.8, -0.4, 'thracianWoman'], [1.8, 0.3, 'thracian'], [-0.3, -3.2, 'warrior']].forEach(([x, z, k]) => {
    const p = person(k); p.position.set(x, 0, z); scene.add(p); folk.push(p);
  });
  named.man = folk[2];
  wander(stage, folk, { r: 0.45, speed: 0.3 });

  // Живот: огънят трепти, колелото се върти, златото блести, ковачът удря.
  stage.tick((dt, t) => {
    fg.userData.glow.material.color.setHSL(0.06, 1, 0.5 + Math.sin(t * 9) * 0.08);
    wh.userData.wheel.rotation.y += dt * 4;
    gt.userData.shine.forEach((m, i) => { m.rotation.z = Math.sin(t * 1.5 + i) * 0.4; });
    smith.position.y = Math.abs(Math.sin(t * 4)) * 0.05;
    houseMain.userData.fire.scale.y = 1 + Math.sin(t * 11) * 0.15;
  });

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 1.1, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let clickHandler = null, stopDrag = null, map = null;
  const extra = [];
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  // ---------- 1. Разходка ----------
  const seen = new Set();
  const walk = createWalk(stage, {
    stops: STOPS,
    eye: 0.95,
    menuTitle: 'Спирки',
    onArrive(s) {
      if (phase !== 1) return;
      say(named[s.anchor] || named.cross, `<b>${esc(s.label)}</b><br>${s.note}`, { cls: 'wide', lift: s.id === 'palace' ? 2.0 : 1.2 });
      seen.add(s.id); walk.mark(s.id);
      shell.score(`Спирки: ${seen.size} от ${STOPS.length}`);
      if (seen.size === STOPS.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { clearTip(); step2(); });
      }
    },
  });
  let phase = 1;
  function step1() {
    phase = 1;
    shell.step(0);
    scores.length = 0;
    seen.clear();
    walk.showNav(true);
    shell.task('Разходи се из тракийския град. Върви със стрелките долу или избирай спирка от менюто. На всяка спирка се огледай.');
    shell.setControls('');
    clickHandler = null;
    walk.go('gate');
  }

  // ---------- 2. Откъде са стоките? ----------
  function step2() {
    phase = 2;
    shell.step(1);
    shell.score('');
    walk.showNav(false);
    view([-1.2, 3.8, 3.8], [-4.6, 1.0, -0.6]);
    map.group.visible = true;
    let mistakes = 0, chosen = null, done = 0;
    shell.task('Кликни върху стока на пазара, после кликни на картата мястото, откъдето идва. <span class="small">(Картата е за теб — с днешните граници.)</span>');
    shell.setControls('');
    clickHandler = (id) => {
      const g = GOODS.find((x) => x.id === id);
      if (g) {
        if (g.done) return;
        chosen = g;
        say(goodsObj[g.id], `<b>${esc(g.label)}</b><br>${esc(g.note)}<br><i>Сега кликни на картата.</i>`, { cls: 'wide', lift: 0.5 });
        return;
      }
      const p = PLACES.find((x) => x.id === id);
      if (!p || !chosen) return;
      if (p.id === chosen.from) {
        chosen.done = true; done++;
        map.colorPlace(p.id, 0x2fb36b);
        shell.msg(`Вярно: ${chosen.label} — ${p.label}.`, 'good');
        chosen = null; clearTip();
        shell.score(`Стоки: ${done} от ${GOODS.length}`);
        if (done === GOODS.length) {
          scores.push(stepScore(mistakes, 4));
          say(map.places.get('sevtopolis'), 'Севтополис търгува с гърците по Бяло и Черно море и с Македония.', { cls: 'good wide', lift: 1.3 });
          const n = shell.setControls('<button class="btn primary">Напред →</button>');
          n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
        }
      } else {
        mistakes++;
        shell.msg('Не оттам. Прочети пак бележката за стоката.', 'bad');
      }
    };
  }

  // ---------- 3. Поръчки при майсторите ----------
  function step3() {
    phase = 3;
    shell.step(2);
    for (const g of GOODS) g.done = false;
    map.group.visible = false;
    clickHandler = null;
    view([-2.2, 3.6, 4.3], [1.9, 0.0, 4.3]);
    ORDERS.forEach((o, i) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.38), mat(0xfff4d6));
      const l = labelSprite(o.label, { size: 0.15 }); l.position.y = 0.22;
      g.add(b, l);
      g.position.set(0.5, 0.1, 2.9 + i * 0.95);
      g.userData = { dragId: o.id, home: g.position.clone() };
      addHitBox(g, 0.5);
      scene.add(g); extra.push(g);
    });
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Хората поръчват неща. Завлечи всяка поръчка при майстора, който ще я изработи.');
    shell.setControls('');
    shell.score(`Поръчки: 0 от ${ORDERS.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.1,
      onDrop(obj) {
        const o = ORDERS.find((x) => x.id === obj.userData.dragId);
        let best = null, bd = 1.0;
        for (const id of ['forge', 'wheel', 'gold']) { const p = named[id].position; const d = Math.hypot(obj.position.x - p.x, obj.position.z - p.z); if (d < bd) { bd = d; best = id; } }
        if (!best) { obj.position.copy(obj.userData.home); return; }
        if (best === o.to) {
          obj.userData.locked = true;
          obj.position.set(named[best].position.x - 0.55, 0.1 + placed * 0.02, named[best].position.z + (o.id === 'o-spear' ? 0.35 : 0));
          placed++;
          shell.score(`Поръчки: ${placed} от ${ORDERS.length}`);
          shell.msg('Вярно!', 'good');
          if (placed === ORDERS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            say(named.wheel, 'Всеки майстор има свой занаят. Работилниците правят града богат.', { cls: 'good wide', lift: 1.2 });
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[o.id] = (tries[o.id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(tries[o.id] >= 2 ? `${o.why} Потърси майстора, който работи с този материал.` : 'Този майстор не работи с този материал.', 'bad');
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    phase = 4;
    shell.step(3);
    shell.score('');
    view([-1.2, 1.6, -1.0], [-3.2, 0.5, -2.8]);
    say(trader, 'Търговец от остров Тасос носи вино.', { cls: 'tag', lift: 0.9 });
    let mistakes = 0;
    shell.task('Гръцкият търговец е продал виното си. <b>Какво ще вземе от траките, за да го закара обратно?</b>');
    const c = shell.setControls(`<div class="col">${PREDICT.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = PREDICT[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      for (let i = 0; i < 4; i++) {
        const sack = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.3, 10), mat(i === 3 ? 0x8a5a3a : 0xd8c79a));
        sack.position.set(-2.6 + (i % 2) * 0.28, 0.15, -3.0 + Math.floor(i / 2) * 0.28);
        scene.add(sack); extra.push(sack);
      }
      say(trader, '<b>Така е.</b> Гръцките автори пишат, че от Тракия се изнасят зърно, мед, восък, кожи и дървен материал. Срещу тях траките купуват вино, масло и красиви съдове.', { cls: 'good wide', lift: 0.9 });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => { clearTip(); shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart); });
    }));
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    for (const p of PLACES) map.colorPlace(p.id);
    for (const g of GOODS) g.done = false;
    map.group.visible = false;
    walk.menu.setItems(STOPS.map((x) => ({ id: x.id, label: x.label, icon: x.icon })));
    step1();
  }

  shell.task('Зареждане…');
  createMap(stage, { center: [25.0, 41.6], unitsPerDeg: 0.42, height: 0.04, showNames: false }).then((m) => {
    map = m;
    map.group.position.set(-5.4, 1.5, 0.6);
    for (const p of PLACES) { const g = map.addPlace(p.id, p); g.scale.setScalar(0.7); }
    const t = labelSprite('Карта за теб (днешни граници)', { size: 0.2 });
    t.position.set(0, 1.0, -1.6); map.group.add(t);
    map.group.visible = false;
    step1();
  }).catch((e) => shell.msg(`Картата не се зареди: ${e.message}`, 'bad'));

  container.__demo = { stage, walk, get map() { return map; } };
  return { dispose() { if (stopDrag) stopDrag(); walk.dispose(); stage.dispose(); } };
}
