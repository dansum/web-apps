// 7.1.2 „Новото училище и читалището“ — разходка във възрожденска Копривщица (средата на XIX век).
// Стъпки: разходка по спирките → старо и ново училище (опит с метода на обучение) → училище, читалище или чаршия?
// → предскажи: какво ще правят хората в читалището и как това подготвя Освобождението.
import { createStage, labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createWalk } from './hist/stopwalk.js';
import { M } from './hist/architecture.js';
import { animal, graze } from './hist/thrace.js';
import { smoke, cloud } from './hist/bulgar.js';
import { wander } from './hist/antiquity.js';
import {
  RM, revivalHouse, yardWall, humpBridge, fountain, shop, revivalChurch, bellTower,
  cellSchool, newSchool, chitalishte, pine, leafTree, forestHill, folkPerson, mergeStatic,
} from './hist/revival.js';

// Слива неподвижните части; ключовете от userData (движещи се или кликаеми части) остават отделни.
const ms = (obj, keys = []) => mergeStatic(obj, keys.flatMap((k) => [].concat(obj.userData[k] ?? [])));
// Човече: ръцете остават отделни само ако ще се движат.
const fp = (kind, opts = {}, arms = false) => { const p = folkPerson(kind, opts); return mergeStatic(p, arms ? p.userData.arms : []); };

const KEPT = '<span class="small">Запазено и днес.</span>';
const REC = '<span class="small">Възстановка.</span>';
// Спирки на разходката. Всяко балонче казва кое е запазено и кое е възстановка (принцип 10).
const STOPS = [
  { id: 'bridge', label: 'Реката и мостчетата', icon: '🌉', at: [3.6, 8.5], look: [0, 0.3, 7], eyeY: 1.3, anchor: 'bridgeA',
    note: `Копривщица е в Средна гора, край река Тополница. През реката водят каменни гърбави мостчета. Много от тях са запазени. На Калачевия мост на 20 април 1876 г. е даден първият изстрел на Априлското въстание. ${KEPT}` },
  { id: 'street', label: 'Калдъръмените улици', icon: '🪨', at: [0.3, 5.3], look: [-0.2, 0.3, 1.5], eyeY: 1.0, anchor: 'streetA',
    note: `Улиците са тесни и постлани с калдъръм — обли камъни от реката. От двете страни има високи каменни зидове с дървени порти. ${KEPT}` },
  { id: 'house', label: 'Възрожденската къща', icon: '🏠', at: [0.5, 3.0], look: [-2.4, 0.95, 4.6], eyeY: 1.0, anchor: 'houseA',
    note: `Долният етаж е от камък, горният е от дърво, измазан и боядисан в синьо, жълто или червено. Горният етаж се издава над улицата, а еркерът е стаичка, която стърчи напред. Широките стрехи пазят от дъжд и сняг. В Копривщица са запазени много такива къщи, например Ослековата и Лютовата. Тази къща е възстановка.` },
  { id: 'people', label: 'Хората и дрехите', icon: '👘', at: [-0.7, 2.6], look: [1.2, 0.35, 0.6], eyeY: 1.1, anchor: 'peopleA',
    note: 'Повечето хора носят възрожденски дрехи: мъжете — потури, аба и калпак, жените — сукман, престилка и забрадка. Някои търговци и учители вече обличат европейски дрехи — сюртук или рокля, а мъжете често носят фес. Дрехите са възстановка по запазени носии и стари снимки.' },
  { id: 'bazaar', label: 'Чаршията и еснафите', icon: '🧵', at: [2.4, -0.3], look: [3.2, 0.4, 2.7], eyeY: 1.15, anchor: 'bazaarA',
    note: `На чаршията са дюкяните. Сутрин горният кепенк се вдига като навес, а долният се сваля като тезгях. Майсторите от един занаят се събират в еснаф. В Копривщица има много абаджии (шият аби от дебел вълнен плат), кожухари и търговци на овце — джелепи. Богатите еснафи и търговци дават пари за училища и читалища. ${REC}` },
  { id: 'church', label: 'Църквата', icon: '⛪', at: [-2.6, -3.7], look: [-4.5, 0.5, -6.2], eyeY: 1.2, anchor: 'churchA',
    note: `Църквата „Успение Богородично“ в Копривщица е запазена. Възрожденските църкви често са ниски, с дървена галерия отпред, а камбанарията е отделно. Тази църква е опростена възстановка.` },
  { id: 'cell', label: 'Килийното училище', icon: '📜', at: [0.6, -6.0], look: [-1.6, 0.35, -6.0], eyeY: 0.8, anchor: 'cellA',
    note: `Килийното училище е при църквата или манастира. Учител е свещеник, монах или друг грамотен човек. Децата учат главно да четат по църковни книги — часослов и псалтир — и пишат с пръчица в пясъчник. ${REC}` },
  { id: 'school', label: 'Новото училище', icon: '🏫', at: [0.4, 1.0], look: [3.8, 0.5, -2.4], eyeY: 1.5, anchor: 'schoolA',
    note: `Новото, светско училище учи децата на говоримия български език. Освен четене и писане те учат смятане, история и география. Първото такова училище е открито в Габрово през 1835 г. с помощта на Васил Априлов. Първият му учител е Неофит Рилски. ${REC}` },
  { id: 'chit', label: 'Читалището', icon: '📚', at: [-2.0, 2.0], look: [-3.6, 0.6, -1.9], eyeY: 1.35, anchor: 'chitA',
    note: `В читалището хората четат книги и вестници, слушат сказки (беседи) и играят театър. Първите читалища са открити през 1856 г. в Свищов, Лом и Шумен. Скоро има читалища в много селища. Сградата тук е възстановка.` },
];
// Неща в двете училища, които детето разглежда (стъпка 2).
const ITEMS = [
  { id: 'i-sand', where: 'cell', label: 'Пясъчник', note: 'В пясъчника децата пишат букви с пръчица, после ги заличават. Хартията е скъпа.' },
  { id: 'i-psalter', where: 'cell', label: 'Псалтир', note: 'Децата четат по църковни книги — часослов и псалтир. Езикът им е старинен, църковен, и често учат наизуст.' },
  { id: 'i-tables', where: 'school', label: 'Табла с букви', note: 'Пред всяко табло стои група деца. По-голям ученик ги учи, а учителят надзирава всички. Това е взаимоучителната метода.' },
  { id: 'i-board', where: 'school', label: 'Черна дъска', note: 'В новото училище се учи и смятане — нужно е на всеки търговец и майстор.' },
  { id: 'i-map', where: 'school', label: 'Карта', note: 'Децата учат география и история: какво има по света и какво е миналото на българите.' },
  { id: 'i-books', where: 'school', label: 'Учебници', note: 'Учебниците са на говоримия български език. Един от първите е „Рибният буквар“ на Петър Берон (1824 г.) — с басни, смятане и знания за природата.' },
];
const N_KIDS = 30;
const METHODS = {
  cell: { label: 'Всеки поотделно при учителя', short: 'Поотделно (както в килийното училище)' },
  mutual: { label: 'Взаимоучителна метода', short: 'Взаимоучителна метода' },
};
// Колко деца се научават да четат за една година — само илюстрация, не точни данни.
const learnedCount = (method, helpers) => (method === 'cell' ? 4 : Math.min(N_KIDS, helpers * 5 + Math.min(4, N_KIDS - helpers * 5)));
const CARDS = [
  { id: 'c-math', label: 'Урок по смятане', to: 'school', why: 'Уроците са в училището.' },
  { id: 'c-geo', label: 'Урок по география', to: 'school', why: 'Уроците са в училището.' },
  { id: 'c-tables', label: 'Деца четат по таблата', to: 'school', why: 'Таблата с букви са в класната стая.' },
  { id: 'c-lib', label: 'Библиотека с книги', to: 'chit', why: 'Книгите за всички са в читалището.' },
  { id: 'c-theatre', label: 'Театрално представление', to: 'chit', why: 'Читалището има сцена за театър.' },
  { id: 'c-aba', label: 'Абаджия шие аба', to: 'bazaar', why: 'Майсторите работят в дюкяните.' },
  { id: 'c-kozhuh', label: 'Продават кожуси', to: 'bazaar', why: 'Стоките се продават на чаршията.' },
];
const PLACE_NAMES = { school: 'Училище', chit: 'Читалище', bazaar: 'Чаршия' };
const PREDICT1 = [
  { t: 'Ще четат книги и вестници, ще слушат сказки и ще играят театър.', ok: true },
  { t: 'Ще събират данъци за султана.', ok: false, why: 'Данъците не са работа на читалището. То е създадено от самите българи за просвета.' },
  { t: 'Ще продават стоки, както на чаршията.', ok: false, why: 'Търговията е на чаршията. Читалището е за книги, вестници и събрания.' },
];
const PREDICT2 = [
  { t: 'Хората научават повече за света и за своята история и все повече искат свобода.', ok: true },
  { t: 'Читалищата имат своя войска, която освобождава България.', ok: false, why: 'Читалищата нямат войска. Те помагат с просвета и като място за срещи.' },
  { t: 'Никак — в читалищата се говори само за търговия.', ok: false, why: 'В читалищата се говори за книги, за историята и за бъдещето на българите.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Разходка в Копривщица', 'Старо и ново училище', 'Училище, читалище или чаршия?', 'Предскажи'] });
  const SKY = 0xcfe6f7;
  const stage = createStage(shell.stageEl, { background: SKY, camPos: [1, 9, 20], target: [0, 0, 1], minDistance: 0.3, maxDistance: 40, maxPolarAngle: Math.PI * 0.49 });
  const { scene } = stage;
  // Тесен екран: общите изгледи се отдръпват назад, за да се вижда цялата сцена.
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const view = (pos, tgt, dur = 1, k = far) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur);
  const named = {};
  const marker = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  const add = (obj, x, z, ry = 0) => { obj.position.set(x, 0, z); obj.rotation.y = ry; scene.add(obj); obj.updateMatrixWorld(true); return obj; };

  // ---------- земя, река, улици ----------
  const ground = new THREE.Mesh(new THREE.BoxGeometry(60, 0.1, 60), RM('grass', { rep: [24, 24] }));
  ground.position.y = -0.06; scene.add(ground);
  const RZ = 7;
  const water = new THREE.Mesh(new THREE.BoxGeometry(60, 0.02, 1.3), RM('water', { rep: [30, 1], rough: 0.25 }));
  water.position.set(0, -0.005, RZ); scene.add(water);
  const waterTex = water.material.map;
  for (const s of [-1, 1]) {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(60, 0.14, 0.22), M(0xffffff, { tex: 'stone', rep: [40, 1] }));
    bank.position.set(0, 0.05, RZ + s * 0.76); scene.add(bank);
  }
  const cobble = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), RM('cobble', { rep: [Math.max(1, Math.round(w)), Math.max(1, Math.round(d))] })); m.position.set(x, 0.006, z); scene.add(m); return m; };
  cobble(0, 0.9, 11, 3.0);          // мегдан
  cobble(0, -3.6, 1.2, 6.0);        // главната улица на север
  cobble(0, 4.0, 1.2, 3.4);         // към моста
  cobble(0, 10.6, 1.2, 4.6);        // отвъд реката
  cobble(-4.0, -4.6, 6.8, 0.9);     // към църквата
  cobble(-8.0, 6.0, 6.0, 0.8);      // покрай реката
  marker('streetA', 0, 0.6, 3.2);

  // Мостчета.
  const bridgeA = add(ms(humpBridge()), 0, RZ); named.bridgeA = marker('bridgeA', 0, 0.9, RZ);
  add(ms(humpBridge({ span: 1.5 })), -7.5, RZ);
  add(ms(humpBridge({ span: 1.5 })), 7.2, RZ);
  void bridgeA;

  // ---------- къщи ----------
  const chimneys = [];
  const house = (x, z, ry, color, opts = {}) => {
    const h = add(ms(revivalHouse({ color, ...opts })), x, z, ry);
    h.updateMatrixWorld(true);
    chimneys.push(h.localToWorld(h.userData.chimney.clone()));
    return h;
  };
  const BLUE = 0x3f6fae, OCHRE = 0xd9a441, RED = 0xb5533c, WHITE = 0xf1ece0, GREEN = 0x6f9a7a;
  house(-2.4, 4.6, Math.PI / 2, BLUE);
  marker('houseA', -2.4, 1.3, 4.6);
  house(2.5, 4.7, -Math.PI / 2, OCHRE, { erker: false });
  house(-4.9, 4.4, 0, RED, { w: 1.5 });
  house(-7.6, 3.9, 0, WHITE, { erker: false, w: 1.5 });
  house(7.4, 4.3, 0, BLUE, { w: 1.5 });
  house(-2.3, 10.2, Math.PI / 2, OCHRE);
  house(2.4, 10.4, -Math.PI / 2, RED, { erker: false });
  house(-5.2, 10.4, Math.PI, GREEN, { w: 1.5 });
  house(5.4, 10.2, Math.PI, WHITE);
  house(8.6, 9.8, Math.PI, OCHRE, { erker: false, w: 1.4 });
  house(2.2, -6.9, -Math.PI / 2, RED);
  house(2.2, -9.1, -Math.PI / 2, WHITE, { erker: false });
  house(-1.8, -8.9, Math.PI / 2, OCHRE, { erker: false, w: 1.5 });
  house(7.6, -1.9, -Math.PI / 2, GREEN);
  house(-7.8, -1.6, Math.PI / 2, BLUE, { w: 1.5 });
  house(7.0, -5.6, 0, OCHRE, { w: 1.5 });
  // Зидове с порти покрай улиците.
  add(ms(yardWall(2.0, { gate: true })), 1.0, -4.9, Math.PI / 2);
  add(ms(yardWall(1.4, { gate: true })), -0.85, 9.1, Math.PI / 2);

  // ---------- чаршия ----------
  const shopKinds = ['aba', 'kozhuh', 'bakal', 'aba'];
  const shops = shopKinds.map((k, i) => add(ms(shop({ kind: k })), 1.6 + i * 1.2, 2.85, Math.PI));
  named.bazaarA = marker('bazaarA', 3.4, 0.75, 2.6);
  // Точки за пускане на картите (и за автоматичния тест).
  for (const [id, x, z] of [['bazaar', 3.4, 2.6], ['school', 3.8, -1.5], ['chit', -3.6, -1.1]]) { const o = new THREE.Object3D(); o.position.set(x, 0.12, z); o.userData.dropId = id; scene.add(o); }
  const masters = [];
  ['man', 'man', 'gent', 'man'].forEach((k, i) => { const p = fp(k, {}, true); p.position.set(1.6 + i * 1.2, 0.1, 2.75); p.rotation.y = Math.PI; scene.add(p); masters.push(p); });
  const fnt = add(ms(fountain(), ['stream']), -1.6, 2.75, Math.PI);

  // ---------- църква, килийно училище ----------
  const church = add(ms(revivalChurch()), -4.5, -6.2);
  named.churchA = marker('churchA', -4.5, 1.2, -6.2);
  const tower = add(ms(bellTower(), ['bell']), -6.7, -4.9);
  add(ms(yardWall(4.8, { h: 0.35 })), -4.9, -8.0);
  add(ms(yardWall(3.4, { h: 0.35 })), -7.5, -6.3, Math.PI / 2);
  const cell = add(ms(cellSchool(), ['sandbox', 'psalter', 'lamp']), -1.6, -6.0, Math.PI / 2);
  named.cellA = marker('cellA', -1.6, 0.9, -6.0);
  void church;

  // ---------- ново училище ----------
  const SX = 3.8, SZ = -2.4;
  const school = add(ms(newSchool(), ['board', 'map', 'cat', 'bell']), SX, SZ);
  named.schoolA = marker('schoolA', SX, 1.3, SZ + 0.4);
  const S = school.userData;
  const sw = (v) => new THREE.Vector3(v.x + SX, v.y, v.z + SZ); // от мерките на сградата към сцената

  // ---------- читалище ----------
  const CX = -3.6, CZ = -1.9;
  const chit = add(ms(chitalishte(), ['curtains', 'lamp']), CX, CZ);
  named.chitA = marker('chitA', CX, 1.2, CZ + 0.4);
  const C = chit.userData;

  // ---------- природа ----------
  [[0, -17, 9, 4, 2.6, 30], [-16, -5, 4.5, 8, 2.0, 22], [16, -4, 4.5, 8, 2.2, 22], [-15, 15, 6, 4, 1.6, 14], [15, 16, 6, 4, 1.6, 14]].forEach(([x, z, rx, rz, h, n], i) => {
    const hl = ms(forestHill({ rx, rz, h, trees: n, seed: i + 2 })); hl.position.set(x, -0.05, z); scene.add(hl);
  });
  for (const [x, z, k] of [[-9.5, 7.9, 'l'], [-4, 8.1, 'l'], [4.2, 8.0, 'l'], [10.5, 8.2, 'p'], [-10.5, 2.5, 'p'], [10, 1.5, 'l'], [-9, -6, 'p'], [9.5, -7, 'p'], [5.5, -8.5, 'l'], [-3.2, -9.6, 'l']]) {
    const t = k === 'p' ? pine(1.3) : leafTree(1.4); t.position.set(x, 0, z); scene.add(t);
  }
  const clouds = [[-6, 9, -12], [7, 10, -14], [0, 11, -20]].map(([x, y, z]) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(1.3); scene.add(c); return c; });

  // Стадо овце с овчар край реката, кон на мегдана.
  const flock = [];
  for (let i = 0; i < 7; i++) { const a = animal('sheep'); a.scale.setScalar(0.8); a.position.set(-10 + (i % 4) * 0.55, 0, 9.0 + Math.floor(i / 4) * 0.5); scene.add(a); flock.push(a); }
  graze(stage, flock, { r: 0.35, speed: 0.18 });
  const shepherd = fp('shepherd'); shepherd.position.set(-8.6, 0, 9.4); scene.add(shepherd);
  const horse = animal('horse'); horse.scale.setScalar(0.8); horse.position.set(6.4, 0, 0.9); scene.add(horse);
  graze(stage, [horse], { r: 0.2, speed: 0.15 });

  // ---------- хора ----------
  const folk = [];
  [[1.3, 0.4, 'man'], [1.9, 0.8, 'woman'], [0.8, 0.9, 'gent'], [-0.6, 1.4, 'lady'], [-2.4, 0.6, 'man'], [-1.0, 0.1, 'woman'], [4.6, 0.6, 'woman'], [0.3, 5.0, 'man'], [-0.2, -4.2, 'woman'], [0.2, 9.8, 'man'], [-3.2, -4.6, 'girl'], [2.7, 1.5, 'boy']].forEach(([x, z, k]) => {
    const p = fp(k, { color: k === 'lady' ? 0x5a7a9a : undefined }); p.position.set(x, 0, z); scene.add(p); folk.push(p);
  });
  named.peopleA = marker('peopleA', 1.3, 0.9, 0.5);
  wander(stage, folk, { r: 0.4, speed: 0.25 });
  const priest = fp('priest'); priest.position.set(-4.0, 0, -5.1); scene.add(priest);
  const fWoman = fp('woman', { color: 0x3a2a4a }, true); fWoman.position.set(-1.6, 0, 2.25); fWoman.rotation.y = 0; scene.add(fWoman);

  // Килийно училище: даскал и деца на пода.
  const cellTeacher = fp('priest', {}, true); cellTeacher.position.copy(cell.localToWorld(new THREE.Vector3(0.3, 0.06, -0.3))); cellTeacher.rotation.y = Math.PI / 2; scene.add(cellTeacher);
  const cellKids = [];
  [[-0.62, 0.25], [-0.28, 0.47], [0.0, 0.3], [-0.6, -0.12], [0.62, 0.38]].forEach(([lx, lz], i) => {
    const k = fp(i % 2 ? 'girl' : 'boy', { scale: 0.75 }); k.position.copy(cell.localToWorld(new THREE.Vector3(lx, 0.02, lz))); k.rotation.y = Math.PI / 2 + Math.PI; k.scale.y *= 0.8; scene.add(k); cellKids.push(k);
  });

  // ---------- класът за опита ----------
  const KID_COLORS = [0xf2ede0, 0xd9c7a0, 0x9fb4c8, 0xc89a8a, 0xb5c49a];
  const kids = [];
  for (let i = 0; i < N_KIDS; i++) {
    const k = fp(i % 2 ? 'girl' : 'boy', { scale: 0.8, color: i % 2 ? [0x8a2f4a, 0x2f4f7a, 0x6a3a2a][i % 3] : KID_COLORS[i % 5] });
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.1), mat(0x2fb36b));
    book.position.y = 0.86; book.visible = false; k.add(book);
    k.userData.book = book;
    scene.add(k); kids.push(k);
  }
  const deskSlot = (i) => { const dk = S.desks[Math.floor(i / 5)]; return sw(new THREE.Vector3(dk.position.x - 0.26 + (i % 5) * 0.13, 0.06, dk.position.z + 0.2)); };
  const groupSlot = (gi, j) => {
    const gr = S.groups[gi];
    const tan = new THREE.Vector3(gr.n.z, 0, -gr.n.x);
    const a = (j - 2) * 0.55, r = 0.36;
    return sw(gr.c.clone().addScaledVector(gr.n, r * Math.cos(a) + 0.04).addScaledVector(tan, r * Math.sin(a)));
  };
  const helpers = S.groups.map((gr, gi) => {
    const h = fp('helper', { color: [0x2f5a8a, 0x7a3a2a, 0x3f6a3f, 0x5a3a6a, 0x8a6a2a, 0x2a5a5a][gi] }, true);
    const tan = new THREE.Vector3(gr.n.z, 0, -gr.n.x);
    h.position.copy(sw(gr.c.clone().addScaledVector(tan, 0.22).addScaledVector(gr.n, 0.05)));
    h.lookAt(sw(gr.c.clone().addScaledVector(gr.n, 1)));
    h.visible = false; scene.add(h); return h;
  });
  const teacher = fp('gent'); teacher.position.copy(sw(new THREE.Vector3(1.15, 0.06, 0.95))); teacher.rotation.y = -Math.PI / 2; scene.add(teacher);
  const teacherHome = teacher.position.clone();
  const lookAtXZ = (o, p) => { o.rotation.y = Math.atan2(p.x - o.position.x, p.z - o.position.z); };
  function seatKids() {
    kids.forEach((k, i) => { k.position.copy(deskSlot(i)); k.rotation.y = Math.PI; k.userData.target = null; k.userData.book.visible = false; });
    helpers.forEach((h) => { h.visible = false; });
    teacher.position.copy(teacherHome); teacher.rotation.y = -Math.PI / 2;
  }
  seatKids();
  // Плавно преместване на децата.
  stage.tick((dt) => {
    for (const k of kids) {
      const tg = k.userData.target;
      if (!tg) continue;
      const d = tg.clone().sub(k.position); d.y = 0;
      const len = d.length();
      if (len < 0.01) { k.position.copy(tg); k.userData.target = null; if (k.userData.face) lookAtXZ(k, k.userData.face); continue; }
      k.position.addScaledVector(d, Math.min(1, dt * 5) * (len > 0.02 ? 1 : 0)); lookAtXZ(k, tg);
    }
  });

  // ---------- живот ----------
  smoke(stage, chimneys.slice(0, 10));
  stage.tick((dt, t) => {
    waterTex.offset.x -= dt * 0.05;
    fnt.userData.stream.scale.x = 1 + Math.sin(t * 20) * 0.2;
    tower.userData.bell.rotation.z = Math.sin(t * 0.8) * 0.12;
    S.bell.rotation.z = Math.sin(t * 1.3) * 0.08;
    cell.userData.lamp.material.emissiveIntensity = 0.8 + Math.sin(t * 9) * 0.25;
    masters.forEach((m, i) => { m.userData.arms[1].rotation.x = -0.6 + Math.sin(t * 3 + i) * 0.35; });
    fWoman.userData.arms[0].rotation.x = -0.5 + Math.sin(t * 1.5) * 0.1;
    cellKids.forEach((k, i) => { k.position.y = Math.abs(Math.sin(t * 2 + i)) * 0.01; });
    cellTeacher.userData.arms[1].rotation.x = -0.4 + Math.sin(t * 1.1) * 0.2;
    shepherd.rotation.y = Math.sin(t * 0.3) * 0.6;
    clouds.forEach((c, i) => { c.position.x = ((c.userData.x0 ??= c.position.x) + t * (0.12 + i * 0.03) + 30) % 60 - 30; });
    for (const h of helpers) if (h.visible) h.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 2.5 + h.position.x) * 0.25;
  });

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.3, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let clickHandler = null, stopDrag = null, phase = 1, running = null;
  const extra = [];
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  // Неща за разглеждане в двете училища (стъпка 2).
  const itemObj = {};
  const pickItem = (id, obj, size = 0.3) => { obj.userData.pickId = id; addHitBox(obj, size); itemObj[id] = obj; return obj; };
  pickItem('i-sand', cell.userData.sandbox, 0.35);
  pickItem('i-psalter', cell.userData.psalter, 0.3);
  const tablesHit = new THREE.Group(); tablesHit.position.set(SX - 1.0, 0.56, SZ - S.d / 2 + 0.15); scene.add(tablesHit);
  { const hb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.1), new THREE.MeshBasicMaterial({ visible: false })); tablesHit.add(hb); }
  pickItem('i-tables', tablesHit, 0.3);
  pickItem('i-board', S.board, 0.4);
  pickItem('i-map', S.map, 0.4);
  pickItem('i-books', S.cat, 0.3);

  // ---------- 1. Разходка ----------
  const seen = new Set();
  const walk = createWalk(stage, {
    stops: STOPS,
    eye: 1.0,
    menuTitle: 'Спирки',
    onArrive(s) {
      if (phase !== 1) return;
      say(named[s.anchor], `<b>${esc(s.label)}</b><br>${s.note}`, { cls: 'wide', lift: 0.3 });
      seen.add(s.id); walk.mark(s.id);
      shell.score(`Спирки: ${seen.size} от ${STOPS.length}`);
      if (seen.size === STOPS.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { clearTip(); step2(); });
      }
    },
  });
  function step1() {
    phase = 1;
    shell.step(0);
    scores.length = 0;
    seen.clear();
    walk.showNav(true);
    shell.task('Разходи се из Копривщица в средата на XIX век. Върви със стрелките долу или избирай спирка от менюто. На всяка спирка се огледай.');
    shell.setControls('');
    shell.score('');
    clickHandler = null;
    walk.go('bridge');
  }

  // ---------- 2. Старо и ново училище ----------
  const CELL_VIEW = [[0.9, 1.05, -6.0], [-1.7, 0.3, -6.0]];
  const SCHOOL_VIEW = [[SX, 1.45, SZ + 3.6], [SX, 0.35, SZ - 0.1]];
  function step2() {
    phase = 2;
    shell.step(1);
    shell.score('');
    walk.showNav(false);
    const looked = new Set();
    shell.task('Влез в двете училища. Кликни на нещата, с които учат децата, и ги сравни.');
    const showButtons = (extraHtml = '') => {
      const c = shell.setControls(`<div class="row"><button class="btn v-cell">📜 Килийното училище</button><button class="btn v-school">🏫 Новото училище</button></div>${extraHtml}`);
      c.querySelector('.v-cell').addEventListener('click', () => { clearTip(); view(...CELL_VIEW, 1, Math.min(far, 1.15)); });
      c.querySelector('.v-school').addEventListener('click', () => { clearTip(); view(...SCHOOL_VIEW); });
      const n = c.querySelector('.go');
      if (n) n.addEventListener('click', () => { clearTip(); experiment(); });
    };
    showButtons();
    view(...CELL_VIEW, 1, Math.min(far, 1.15)); // зад камерата има къща — отдръпва се малко
    shell.score(`Разгледани: 0 от ${ITEMS.length}`);
    clickHandler = (id) => {
      const it = ITEMS.find((x) => x.id === id);
      if (!it) return;
      say(itemObj[id], `<b>${esc(it.label)}</b><br>${esc(it.note)}`, { cls: 'wide', lift: 0.35 });
      if (looked.has(id)) return;
      looked.add(id);
      shell.score(`Разгледани: ${looked.size} от ${ITEMS.length}`);
      if (looked.size === ITEMS.length) showButtons('<button class="btn primary go">Към опита →</button>');
    };
  }

  // Опитът: един учител и 30 деца — поотделно или с помощници.
  function experiment() {
    clickHandler = null;
    view(...SCHOOL_VIEW);
    seatKids();
    const ran = { cell: false, mutual: false };
    let method = 'cell', nHelp = 3, guess = null, mistakes = 0;
    shell.score('');
    shell.task(`В класа има един учител и ${N_KIDS} деца. <b>Как повече деца ще се научат да четат за една година?</b> Първо предположи.`);
    const c = shell.setControls(`<div class="col">
      <button class="btn" data-p="cell">Учителят учи всяко дете поотделно, а другите чакат.</button>
      <button class="btn" data-p="mutual">По-големите ученици учат по-малките на групи, а учителят надзирава.</button></div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { guess = b.dataset.p; lab(); }));

    function lab() {
      shell.task('Сега провери. Избери метода, после пусни една учебна година. Опитай и двата метода.');
      const cc = shell.setControls(`<div class="row"><button class="btn m-cell">Поотделно</button><button class="btn m-mutual">Взаимоучителна</button></div>
        <div class="help-row" hidden><label class="small">По-големи ученици помощници: <b class="hn">${nHelp}</b></label><input class="h-range" type="range" min="1" max="6" step="1" value="${nHelp}" style="width:100%"></div>
        <div class="row"><button class="btn primary run">▶ Пусни една учебна година</button></div>`);
      const bc = cc.querySelector('.m-cell'), bm = cc.querySelector('.m-mutual'), hr = cc.querySelector('.help-row'), rg = cc.querySelector('.h-range'), run = cc.querySelector('.run');
      const sync = () => {
        bc.classList.toggle('primary', method === 'cell'); bm.classList.toggle('primary', method === 'mutual');
        hr.hidden = method !== 'mutual';
        cc.querySelector('.hn').textContent = nHelp;
        arrange();
      };
      bc.addEventListener('click', () => { if (running) return; method = 'cell'; sync(); });
      bm.addEventListener('click', () => { if (running) return; method = 'mutual'; sync(); });
      rg.addEventListener('input', () => { if (running) return; nHelp = +rg.value; sync(); });
      run.addEventListener('click', () => { if (running) return; runYear(() => {
        ran[method] = true;
        if (ran.cell && ran.mutual) ask();
      }); });
      sync();
    }
    // Децата застават според метода.
    function arrange() {
      clearTip();
      kids.forEach((k) => { k.userData.book.visible = false; });
      helpers.forEach((h, gi) => { h.visible = method === 'mutual' && gi < nHelp; });
      kids.forEach((k, i) => {
        const gi = Math.floor(i / 5);
        if (method === 'mutual' && gi < nHelp) {
          k.userData.target = groupSlot(gi, i % 5);
          k.userData.face = sw(S.groups[gi].c);
        } else { k.userData.target = deskSlot(i); k.userData.face = deskSlot(i).add(new THREE.Vector3(0, 0, -1)); }
      });
      say(named.schoolA, method === 'cell' ? 'Учителят вика децата едно по едно. Другите чакат.' : `${nHelp} ${nHelp === 1 ? 'група' : 'групи'} по 5 деца пред таблата. Всяка група има помощник.`, { cls: 'tag', lift: 0.5 });
    }
    function runYear(done) {
      clearTip();
      const n = learnedCount(method, nHelp);
      // Кои деца се научават: при групите — децата в групите; останалите — при учителя.
      const order = [];
      const inGroups = method === 'mutual' ? Math.min(N_KIDS, nHelp * 5) : 0;
      for (let i = 0; i < inGroups; i++) order.push(i);
      for (let i = inGroups; i < N_KIDS && order.length < n; i++) order.push(i);
      order.length = n;
      const DUR = 3.5;
      let t0 = null, shown = 0, lastCall = -1;
      const meter = stage.bubble(named.schoolA, '', { cls: 'tag', lift: 0.5 });
      running = stage.tick((dt, t) => {
        if (t0 === null) t0 = t;
        const k = Math.min(1, (t - t0) / DUR);
        const month = Math.min(9, 1 + Math.floor(k * 9));
        while (shown < Math.floor(k * n + 1e-6)) { kids[order[shown]].userData.book.visible = true; shown++; }
        meter.set(`Месец ${month} от 9 · Четат: ${shown} от ${N_KIDS}`);
        // Поотделно: учителят вика по едно дете при катедрата.
        const call = Math.floor(k * 12);
        if (call !== lastCall) {
          lastCall = call;
          const idx = (method === 'cell' ? call : inGroups + call) % N_KIDS;
          kids.forEach((kd, i) => { kd.position.y = 0.06 + (i === idx && (method === 'cell' || idx >= inGroups) ? 0.06 : 0); });
        }
        if (method === 'mutual') {
          const gi = Math.floor(k * 4 * nHelp) % nHelp;
          const tg = groupSlot(gi, 2);
          const d = tg.clone().sub(teacher.position); d.y = 0;
          if (d.length() > 0.45) { teacher.position.addScaledVector(d.normalize(), dt * 1.2); lookAtXZ(teacher, tg); }
        }
        if (k >= 1) {
          running(); running = null; meter.remove();
          kids.forEach((kd) => { kd.position.y = 0.06; });
          say(named.schoolA, `<b>${esc(METHODS[method].label)}</b>${method === 'mutual' ? ` (${nHelp} помощници)` : ''}: за една година се научиха да четат <b>${n} от ${N_KIDS}</b> деца.<br><span class="small">Числата са илюстрация, не точни данни.</span>`, { cls: 'wide', lift: 0.5 });
          shell.score(`Опити: ${ran.cell || method === 'cell' ? '✓' : '○'} поотделно · ${ran.mutual || method === 'mutual' ? '✓' : '○'} взаимоучителна`);
          done();
        }
      });
    }
    function ask() {
      const right = guess === 'mutual';
      shell.task(`${right ? 'Предположението ти се потвърди.' : 'Опитът показа нещо друго, отколкото предположи.'} <b>Защо при взаимоучителната метода повече деца се научават да четат?</b>`);
      const opts = [
        { t: 'Един учител може да учи много деца наведнъж, защото по-големите ученици помагат на по-малките.', ok: true },
        { t: 'Защото децата учат само молитви наизуст.', ok: false, why: 'Наизустяването е по-често в килийното училище. Виж колко деца учат едновременно.' },
        { t: 'Защото учителят изпитва всяко дете поотделно.', ok: false, why: 'Така е при първия метод — и тогава се научават малко деца.' },
      ];
      const cc = shell.setControls(`<div class="col">${opts.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
      cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = opts[+b.dataset.i];
        if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
        scores.push(stepScore(mistakes, 2));
        shell.msg('Вярно!', 'good');
        say(named.schoolA, 'Взаимоучителната (Бел-Ланкастърска) метода идва от Англия. У нас я въвежда Неофит Рилски в Габровското училище през 1835 г. Така с малко учители се учат много деца.', { cls: 'good wide', lift: 0.5 });
        const n = shell.setControls('<button class="btn primary">Напред →</button>');
        n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
      }));
    }
  }

  // ---------- 3. Училище, читалище или чаршия? ----------
  const FOOT = {
    school: { x: [SX - 2.0, SX + 2.0], z: [SZ - 1.2, SZ + 1.2] },
    chit: { x: [CX - 1.5, CX + 1.5], z: [CZ - 1.0, CZ + 1.0] },
    bazaar: { x: [0.95, 5.65], z: [2.4, 3.4] },
  };
  function placeAt(p) {
    let best = null, bd = 0.45;
    for (const [id, f] of Object.entries(FOOT)) {
      const dx = Math.max(f.x[0] - p.x, 0, p.x - f.x[1]), dz = Math.max(f.z[0] - p.z, 0, p.z - f.z[1]);
      const d = Math.hypot(dx, dz);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }
  function step3() {
    phase = 3;
    shell.step(2);
    clickHandler = null;
    seatKids();
    view([0.4, 8.0, 7.8], [0.4, 0, -0.3]);
    for (const [id, x, y, z] of [['school', SX, 2.9, SZ], ['chit', CX, 2.6, CZ], ['bazaar', 3.4, 1.6, 2.9]]) {
      const l = labelSprite(PLACE_NAMES[id], { size: 0.32 }); l.position.set(x, y, z); scene.add(l); extra.push(l);
    }
    const pos = [[-2.7, 0.35], [-0.9, 0.35], [0.9, 0.35], [2.7, 0.35], [-1.8, 1.45], [0, 1.45], [1.8, 1.45]];
    const order = [3, 0, 5, 1, 4, 6, 2];
    const cardObj = {};
    CARDS.forEach((cd, i) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.46), mat(0xfff4d6));
      const l = labelSprite(cd.label, { size: 0.24 }); l.position.y = 0.3;
      g.add(b, l);
      const [x, z] = pos[order[i]];
      g.position.set(x, 0.12, z);
      g.userData = { dragId: cd.id, home: g.position.clone() };
      addHitBox(g, 0.5);
      scene.add(g); extra.push(g); cardObj[cd.id] = g;
    });
    let mistakes = 0, placed = 0;
    const tries = {};
    const stacked = { school: 0, chit: 0, bazaar: 0 };
    shell.task('Какво става в училището, какво в читалището и какво на чаршията? Завлечи всяка карта до сградата.');
    shell.setControls('');
    shell.score(`Карти: 0 от ${CARDS.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.12,
      onDrop(obj) {
        const cd = CARDS.find((x) => x.id === obj.userData.dragId);
        const to = placeAt(obj.position);
        if (!to) { obj.position.copy(obj.userData.home); return; }
        if (to === cd.to) {
          obj.userData.locked = true;
          const spot = { school: [SX, SZ + 1.55], chit: [CX, CZ + 1.35], bazaar: [3.4, 2.05] }[to];
          obj.scale.setScalar(0.8);
          const k = stacked[to]++;
          obj.position.set(spot[0] + (k - 1) * 1.25, 0.15 + k * 0.01, spot[1]);
          placed++;
          shell.score(`Карти: ${placed} от ${CARDS.length}`);
          shell.msg('Вярно!', 'good');
          if (placed === CARDS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 3));
            say(named.bazaarA, 'Чаршията има нужда от грамотни хора: търговецът пише писма и сметки, майсторът смята. Затова еснафите и търговците дават пари за училището и читалището.', { cls: 'good wide', lift: 0.6 });
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[cd.id] = (tries[cd.id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(tries[cd.id] >= 2 ? `${cd.why}` : `Това не е в сградата „${PLACE_NAMES[to]}“. Помисли къде става.`, 'bad');
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  const visitors = [];
  function eveningLight(on) {
    scene.background.setHex(on ? 0xf0c9a0 : SKY);
    stage.sun.intensity = on ? 0.9 : 1.6;
    stage.sun.color.setHex(on ? 0xffc890 : 0xffffff);
    C.lamp.material.emissiveIntensity = on ? 1.4 : 0.15;
    C.curtains.forEach((c, i) => { c.position.x = (i ? 1 : -1) * (on ? 0.44 : 0.25); c.scale.x = on ? 0.35 : 1; });
  }
  function step4() {
    phase = 4;
    shell.step(3);
    shell.score('');
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    view([CX, 1.55, CZ + 3.4], [CX, 0.45, CZ - 0.1]);
    let mistakes = 0;
    shell.task('Копривщенци са построили читалище. <b>Какво ще правят хората в него?</b>');
    ask(PREDICT1, () => {
      // Сцената показва какво наистина става: вечер в читалището.
      eveningLight(true);
      const spots = [
        ['man', -0.95, 0.15, 0], ['gent', -0.4, 0.35, Math.PI], ['woman', -1.1, -0.45, Math.PI],
        ['man', 0.45, 0.38, Math.PI], ['woman', 0.7, 0.38, Math.PI], ['boy', 0.95, 0.38, Math.PI], ['girl', 0.45, 0.74, Math.PI], ['gent', 0.8, 0.74, Math.PI],
        ['lady', 0.6, -0.65, 0], ['man', 0.9, -0.65, 0],
      ];
      spots.forEach(([k, x, z, r]) => { const p = fp(k, { color: k === 'lady' ? 0x8a3a5a : undefined }); p.position.set(CX + x, 0.06 + (x > 0.3 && z < -0.4 ? 0.14 : 0), CZ + z); p.rotation.y = r; scene.add(p); visitors.push(p); });
      say(named.chitA, '<b>Така е.</b> В читалището има библиотека и маса с вестници. Вечер младите играят театър, а учители и свещеници изнасят сказки. Читалищата помагат и на училищата. <span class="small">Сцената е възстановка.</span>', { cls: 'good wide', lift: 0.6 });
      shell.task('<b>Как читалищата ще помогнат за Освобождението на България?</b>');
      ask(PREDICT2, () => {
        say(named.chitA, '<b>Вярно.</b> Просветените хора искат свобода. В много селища в читалището се събират и членове на революционните комитети. В Копривщица на 20 април 1876 г. започва Априлското въстание. Две години по-късно, през 1878 г., България е освободена.', { cls: 'good wide', lift: 0.6 });
        const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
        n.querySelector('button').addEventListener('click', () => {
          clearTip();
          scores.push(stepScore(mistakes, 2));
          shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart);
        });
      });
    });
    function ask(list, onRight) {
      const c = shell.setControls(`<div class="col">${list.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = list[+b.dataset.i];
        if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
        shell.msg('Вярно предсказание!', 'good');
        onRight();
      }));
    }
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    if (running) { running(); running = null; }
    clearTip();
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    for (const v of visitors) scene.remove(v);
    visitors.length = 0;
    eveningLight(false);
    seatKids();
    walk.menu.setItems(STOPS.map((x) => ({ id: x.id, label: x.label, icon: x.icon })));
    step1();
  }

  step1();
  container.__demo = { stage, walk, scene, kids };
  return { dispose() { if (stopDrag) stopDrag(); if (running) running(); walk.dispose(); stage.dispose(); } };
}
