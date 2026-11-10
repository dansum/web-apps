// 3.3.6 „Паметниците пазят паметта“ — Пловдив през вековете.
// Детето стои на едно и също място, а плъзгачът сменя епохата: хълмът Небет тепе, главната улица,
// къщата и хората се сменят пред очите му.
// Стъпки: опознай седемте епохи → какво остава (слоевете под улицата) → подреди изгледите по време
// → предскажи какво ще намерят археолозите и как пазим паметниците.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { M, romanTheatre, stoaDetailed, crenellatedWall, towerDetailed } from './hist/architecture.js';
import { person, wander } from './hist/antiquity.js';
import { animal, graze } from './hist/thrace.js';
import { MM, cliffHill, river, stoneWall, stoneTower, medievalHouse, dukyan, medPerson, mergeStatic } from './hist/medieval.js';
import { revivalHouse, shop, leafTree, pine, folkPerson, yardWall } from './hist/revival.js';
import { coach, worker } from './hist/industrial.js';
import { smoke, cloud } from './hist/bulgar.js';
import {
  CM, thracianHouse, romanDomus, stadium, stadiumSection, mosque, mahalaHouse, europeanHouse, curvedPediment,
  ruinWall, streetLamp, bench, infoBoard, railing, cafeTable, cityPerson, retainingWall,
} from './hist/city.js';

// Слива неподвижните части; ключовете от userData (движещи се части) остават отделни.
const ms = (obj, keys = []) => mergeStatic(obj, keys.flatMap((k) => [].concat(obj.userData[k] ?? [])));
// Човечетата от различните модули: ръцете не се движат, затова всичко се слива.
const fp = (kind) => mergeStatic(folkPerson(kind));

const DUG = 'Разкопано.';
const KEPT = 'Запазено и днес.';
const REC = 'Възстановка.';
const GEN = 'Обобщена възстановка: не знаем точно как е изглеждало.';
const tag = (s) => `<br><span class="small"><b>${s}</b></span>`;

const EPOCHS = [
  { id: 'thrace', label: 'Траки', when: 'преди 342 г. пр.Хр.' },
  { id: 'rome', label: 'Македонци и римляни', when: '342 г. пр.Хр. – VI век' },
  { id: 'middle', label: 'Средновековие', when: 'VII – XIV век' },
  { id: 'ottoman', label: 'Османска власт', when: 'XIV – XVIII век' },
  { id: 'revival', label: 'Възраждане', when: 'XVIII век – 1878 г.' },
  { id: 'liberty', label: 'След Освобождението', when: '1878 г. – началото на XX век' },
  { id: 'today', label: 'Днес', when: 'XXI век' },
];
// Събитията, които се случват в града в дадена епоха.
const EVENTS = [
  null,
  '342 г. пр.Хр.: Филип II Македонски завладява града. Градът се нарича Филипопол. После става римски.',
  null,
  'XIV век: османците завладяват града. Те го наричат Филибе.',
  null,
  '1878 г.: Пловдив става столица на Източна Румелия. 1885 г.: тук е обявено Съединението.',
  '2019 г.: Пловдив е Европейска столица на културата.',
];
// Местата и какво казва балончето във всяка епоха (принцип 10: кое е разкопано, кое е възстановка).
const PLACES = [
  { id: 'hill', label: 'Хълмът Небет тепе', icon: '⛰️', notes: [
    `Хълмът Небет тепе е над реката Марица. Тук траките имат укрепено селище — Евмолпия. Хълмът е създаден от природата, а стените са дело на хората. ${tag('Основите са разкопани. Къщите са възстановка.')}`,
    `Филипопол има крепост на хълма. Стените са от големи камъни. ${tag('Части от стените са разкопани. Видът на крепостта е възстановка.')}`,
    `През Средновековието крепостта е важна. Тя минава ту към България, ту към Византия. ${tag(GEN)}`,
    `Крепостта вече не е нужна и се руши. Името „Небет тепе“ е турско. То значи „хълм на стражата“. ${tag('Развалините са обобщена възстановка.')}`,
    `Около хълма расте Старият град. Богатите къщи са по хълмовете. Отгоре се вижда целият град. ${tag('Много от тези къщи са запазени и днес. Тези тук са възстановка.')}`,
    `Хълмът е зелен. Хората идват на разходка и гледат града отгоре. Под тревата са старите стени. ${tag(GEN)}`,
    `Днес Небет тепе е археологически обект. Разкопаните стени от различни епохи се пазят и се показват на хората. ${tag('Разкопано и запазено.')}`,
  ] },
  { id: 'street', label: 'Главната улица', icon: '🛣️', notes: [
    `Тук още няма улица. Има път през полето към реката и към селището на хълма. ${tag(GEN)}`,
    `През II век римляните строят тук стадион. Хиляди хора гледат състезания по бягане. ${tag('Северният край на стадиона е разкопан. Останалото е възстановка.')}`,
    `Стадионът вече не се ползва. Камъните му отиват за нови сгради, а отгоре се трупа пръст. Отгоре минава улица. ${tag(GEN)}`,
    `Османците строят Джумая джамия. Около нея е чаршията — улица с дюкяни. ${tag('Джамията е запазена и днес. Дюкяните са възстановка.')}`,
    `На чаршията работят еснафите — майстори от един занаят. В дюкяните те правят и продават стоките си. Джамията стои на мястото си. ${tag('Дюкяните са възстановка.')}`,
    `Пловдив е столица на Източна Румелия. Строят се сгради в европейски стил, а по улицата светят фенери. ${tag('Много такива сгради са запазени. Тези тук са възстановка.')}`,
    `Днес това е голяма пешеходна улица. Под нея е стадионът. Северният му край е разкопан и се вижда до Джумая джамия. ${tag('Разкопано и запазено.')}`,
  ] },
  { id: 'house', label: 'Къщата', icon: '🏠', notes: [
    `Тракийска къща от плет, измазан с глина. Покривът е от слама, а огнището е на двора. ${tag(GEN)}`,
    `Римски дом. Стаите са около двор с колони. Подът е мозайка от малки камъчета. В Пловдив са разкопани римски сгради с красиви мозайки. ${tag('Тази къща е възстановка.')}`,
    `Средновековна къща: долу е от камък, горе — от дърво. ${tag(GEN)}`,
    `Къща в махалата. Висок зид пази двора. В града живеят българи, турци, евреи, арменци и гърци. Всяка общност има свои храмове. ${tag(GEN)}`,
    `Богата възрожденска къща с еркер и фронтон с дъга. Такава е къщата на Аргир Куюмджиоглу в Стария град. Днес в нея е Етнографският музей. ${tag('Тази къща е възстановка.')}`,
    `Градска къща в европейски стил: корнизи, балкон с железни перила, магазин долу. ${tag(REC)}`,
    `Същата къща днес. Тя е ремонтирана внимателно, за да запази стария си вид. Долу има кафене. ${tag(REC)}`,
  ] },
  { id: 'people', label: 'Хората и дрехите', icon: '🧥', notes: [
    `Траките носят пъстри наметала и шапки от лисича кожа. ${tag('Възстановка по описания на древни автори.')}`,
    `Римляните носят туники. Войници пазят града. ${tag(REC)}`,
    `Селяни, търговци и стражи. ${tag(REC)}`,
    `В града живеят различни общности. Дрехите им се различават. ${tag(REC)}`,
    `Мъжете носят потури и калпак, жените — сукман и забрадка. Някои търговци носят фес. ${tag('Възстановка по запазени носии.')}`,
    `Все повече хора носят европейски дрехи. ${tag('Възстановка по стари снимки.')}`,
    `Днешни хора: жители на града и туристи от цял свят. ${tag('Днешен вид.')}`,
  ] },
  { id: 'theatre', label: 'Античният театър', icon: '🎭', notes: [
    `Тук още няма театър. Склонът на хълма е празен. ${tag(GEN)}`,
    `Римляните строят театър в склона. Хората гледат представления. ${tag('Театърът е разкопан. Видът на сцената е възстановка.')}`,
    `Театърът е изоставен и засипан с пръст. Никой не знае, че е тук. ${tag(GEN)}`,
    `Театърът е под земята. Отгоре има къщи и градини. ${tag(GEN)}`,
    `Театърът още е под земята. ${tag(GEN)}`,
    `Театърът още е под земята. ${tag(GEN)}`,
    `Театърът е открит през XX век. Археолозите го разкопават, а реставраторите го възстановяват. Днес в него пак има представления. ${tag('Разкопано и възстановено.')}`,
  ] },
];
// Слоевете под главната улица (дебелина в сцената). Всяка епоха оставя свой слой.
const LAYERS = [
  { t: 0.35, color: 0x8a6a48 }, { t: 0.25, color: 0xc2a882 }, { t: 0.55, color: 0x7a5a3a },
  { t: 0.3, color: 0x9a7a52 }, { t: 0.2, color: 0x6f5a44 }, { t: 0.15, color: 0xa08f78 }, { t: 0.1, color: 0x8d8d8d },
];
const LAYER_NOTE = [
  'Най-долу е земята, по която живеят траките.',
  'Римляните строят стадиона на тогавашната земя.',
  'Стадионът е изоставен. Пръст и развалини го покриват — ето нов слой.',
  'Отгоре строят нови сгради. Земята расте още.',
  'Още един слой. Стадионът е все по-дълбоко.',
  'Улицата е пак по-високо. Стадионът е скрит.',
  'Днес стадионът е на няколко метра под улицата.',
];
const Q2 = [
  { q: 'Какво е останало от римския стадион днес?', opts: [
    { t: 'Голяма част е под главната улица. Северният край е разкопан и се вижда.', ok: true },
    { t: 'Нищо. Стадионът е изчезнал напълно.', ok: false, why: 'Погледни пак разреза: стадионът е там, само е засипан.' },
    { t: 'Целият стадион стои над земята, както при римляните.', ok: false, why: 'Над него има няколко слоя пръст и нови сгради. Погледни разреза.' },
  ] },
  { q: 'Защо стадионът е под земята?', opts: [
    { t: 'С векове върху него се трупат пръст и нови сгради.', ok: true },
    { t: 'Римляните са го построили под земята като мазе.', ok: false, why: 'Римляните го строят на тогавашната земя. Върни плъзгача на римляните и виж.' },
    { t: 'Археолозите са го заровили.', ok: false, why: 'Археолозите не заравят, а разкопават и пазят паметниците.' },
  ] },
];
// Карти за подреждане (стъпка 3): изглед от всяка епоха.
const CARDS = [
  { id: 'c-hut', label: 'Селище на хълма' },
  { id: 'c-stadium', label: 'Стадион' },
  { id: 'c-fort', label: 'Крепост с кули' },
  { id: 'c-mosque', label: 'Джамия и чаршия' },
  { id: 'c-erker', label: 'Къща с еркер' },
  { id: 'c-balcony', label: 'Къща с балкон и фенер' },
  { id: 'c-today', label: 'Пешеходна улица' },
];
const CARD_ORDER = [3, 5, 0, 6, 2, 4, 1]; // разбъркан ред на масата (постоянен — за теста)
const PREDICT1 = [
  { t: 'Част от римския стадион.', ok: true },
  { t: 'Средновековната крепостна стена.', ok: false, why: 'Крепостта е на хълма Небет тепе, а не под улицата.' },
  { t: 'Нищо — под улицата има само пръст.', ok: false, why: 'Под стария град почти навсякъде има следи от миналото. Спомни си разреза.' },
];
const PREDICT2 = [
  { t: 'Гледаме отгоре, не влизаме в разкопките и не пишем по камъните.', ok: true },
  { t: 'Взимаме си камъче от стадиона за спомен.', ok: false, why: 'Ако всеки вземе по камък, от стадиона няма да остане нищо.' },
  { t: 'Засипваме разкопките, за да не пречат.', ok: false, why: 'Тогава никой няма да види стадиона. Разкопките се пазят и се показват.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Пловдив през вековете', 'Какво остава?', 'Подреди по време', 'Предскажи'] });
  const SKY = 0xcfe6f7;
  const stage = createStage(shell.stageEl, { background: SKY, camPos: [9, 10, 20], target: [0, 0.5, -2], minDistance: 0.3, maxDistance: 45, maxPolarAngle: Math.PI * 0.53 });
  const { scene } = stage;
  // Тесен екран: изгледите се отдръпват назад.
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const view = (pos, tgt, dur = 1, k = far) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur);
  const named = {};
  const marker = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  const put = (parent, obj, x, z, ry = 0, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; parent.add(obj); return obj; };

  // ---------- земя: плоча с яма за разкопките на стадиона ----------
  const SOIL = M(0x7a5f45, { tex: 'rock', rep: [6, 1] });
  const GRASS = MM('grass', { rep: [10, 10] });
  const PIT = { x0: -1.9, x1: 1.9, z0: -4.9, z1: -2.4 }, FRONT = 9, DEPTH = 2.0;
  const slab = (x0, x1, z0, z1) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, DEPTH, z1 - z0), [SOIL, SOIL, GRASS, SOIL, SOIL, SOIL]);
    m.position.set((x0 + x1) / 2, -DEPTH / 2, (z0 + z1) / 2); scene.add(m); return m;
  };
  slab(-13, 13, -19, PIT.z0); slab(-13, 13, PIT.z1, FRONT); slab(-13, PIT.x0, PIT.z0, PIT.z1); slab(PIT.x1, 13, PIT.z0, PIT.z1);
  // Дъно и стени на ямата (виждат се само днес).
  const pitFloor = new THREE.Mesh(new THREE.BoxGeometry(PIT.x1 - PIT.x0, 0.1, PIT.z1 - PIT.z0), M(0xffffff, { tex: 'sand', rep: [2, 1] }));
  pitFloor.position.set(0, -1.37, (PIT.z0 + PIT.z1) / 2); scene.add(pitFloor);
  for (const [x, z, len, ry] of [[0, PIT.z0 + 0.06, 3.8, 0], [0, PIT.z1 - 0.06, 3.8, 0], [PIT.x0 + 0.06, (PIT.z0 + PIT.z1) / 2, 2.5, Math.PI / 2], [PIT.x1 - 0.06, (PIT.z0 + PIT.z1) / 2, 2.5, Math.PI / 2]]) {
    const w = ms(retainingWall(len, 1.36)); w.position.set(x, 0, z); w.rotation.y = ry; scene.add(w);
  }
  // Капак над ямата: земята в епохите, преди тя да е разкопана.
  const lid = new THREE.Mesh(new THREE.BoxGeometry(PIT.x1 - PIT.x0, 0.1, PIT.z1 - PIT.z0), [SOIL, SOIL, GRASS, SOIL, SOIL, SOIL]);
  lid.position.set(0, -0.05, (PIT.z0 + PIT.z1) / 2); scene.add(lid);

  // Хълмът Небет тепе и реката Марица.
  const HILL = { x: -4.6, z: -11, h: 2.2 };
  const hillPts = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const r = 1 + 0.12 * Math.sin(i * 2.3); hillPts.push([HILL.x + Math.cos(a) * 3.2 * r, HILL.z + Math.sin(a) * 2.3 * r]); }
  scene.add(cliffHill(hillPts, HILL.h, { bevel: 0.7 }));
  const rv = river([[-14, -16.2], [-6, -15.6], [2, -16.4], [14, -15.8]], { width: 2.6, y: 0.03 });
  scene.add(rv.group);
  // Хълмове на хоризонта и облаци.
  for (const [x, z, s] of [[-11, -8, 1.3], [10, -10, 1.6], [11, -2, 1.1], [-11, 4, 1.0]]) { const t = pine(s); t.position.set(x, 0, z); scene.add(t); }
  const clouds = [[-8, 9, -14], [6, 10, -16], [0, 11, -24]].map(([x, y, z]) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(1.4); scene.add(c); return c; });

  // ---------- епохите ----------
  const groups = EPOCHS.map(() => { const g = new THREE.Group(); scene.add(g); return g; });
  const spans = []; // { obj, from, to, k, pop }
  const span = (obj, from, to, opts = {}) => { spans.push({ obj, from, to, k: 1, ...opts }); return obj; };
  groups.forEach((g, e) => span(g, e, e, { kids: true }));
  const tops = HILL.h;
  const ground = (g, x0, x1, z0, z1, m, y = 0.006) => { const p = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.012, z1 - z0), m); p.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); g.add(p); return p; };
  const cobble = (rx, rz) => MM('cobble', { rep: [rx, rz] });
  const chimneys = EPOCHS.map(() => []);
  const addSmoke = (e, obj) => { obj.updateMatrixWorld(true); if (obj.userData.chimney) chimneys[e].push(obj.localToWorld(obj.userData.chimney.clone())); };
  const people = EPOCHS.map(() => []);
  const folk = (e, obj, x, z) => { obj.position.set(x, 0, z); groups[e].add(obj); people[e].push(obj); return obj; };
  const onHill = (e, obj, dx, dz, ry = 0) => put(groups[e], obj, HILL.x + dx, HILL.z + dz, ry, tops);
  // Пешеходите в главната улица и около нея.
  const crowd = (e, kinds) => kinds.forEach((k, i) => folk(e, k, [-0.4, 0.5, -0.6, 0.6, 0.1, -0.3][i % 6], [6.2, 5.0, 3.6, 2.2, 7.4, 0.8][i % 6]));

  // Къщата (един и същи парцел, лицето към улицата).
  const HOUSE = { x: -3.6, z: 2.6, ry: Math.PI / 2 };

  // 0. Траки.
  {
    const g = groups[0];
    ground(g, -0.7, 0.7, -9, FRONT, CM('dirt', { rep: [1, 10] }));
    ground(g, -7.5, -0.7, -7.8, -7.0, CM('dirt', { rep: [4, 1] }));
    // Укрепено селище на хълма: стена с кули и къщи.
    for (const [dx, dz, len, ry] of [[0, 1.9, 4.2, 0], [-2.4, 0, 3.0, Math.PI / 2], [2.4, 0, 3.0, Math.PI / 2], [0, -1.8, 4.2, 0]]) onHill(0, ms(crenellatedWall(len, { h: 0.55, t: 0.25 })), dx, dz, ry);
    for (const [dx, dz] of [[-2.4, 1.9], [2.4, 1.9], [-2.4, -1.8], [2.4, -1.8]]) onHill(0, ms(towerDetailed({ s: 0.55, h: 0.85 })), dx, dz);
    for (const [dx, dz, ry] of [[-1.1, 0.6, 0.2], [0.9, 0.5, -0.3], [-0.2, -0.8, 0]]) onHill(0, ms(thracianHouse({ w: 1.0, d: 0.75 }), ['fire']), dx, dz, ry);
    const th = put(g, ms(thracianHouse(), ['fire']), HOUSE.x, HOUSE.z, HOUSE.ry);
    named.fire0 = th.userData.fire;
    for (const [x, z, ry] of [[-6.2, 3.6, 0.4], [3.0, 5.5, -0.8]]) put(g, ms(thracianHouse({ w: 1.1, d: 0.8 }), ['fire']), x, z, ry);
    const herd = ['horse', 'sheep', 'sheep', 'cow', 'goat'].map((k, i) => put(g, animal(k), 4.0 + (i % 3) * 0.7, -1.5 + Math.floor(i / 3) * 0.8));
    herd.forEach((a) => a.scale.setScalar(0.85));
    graze(stage, herd, { r: 0.35, speed: 0.2 });
    for (const [x, z] of [[-1.8, 0.4], [2.2, 2.6], [-1.6, 7.4], [6, 7]]) put(g, leafTree(1.2), x, z);
    const sm = smoke(stage, [th.localToWorld(th.userData.smoke.clone())], { color: 0xcfc8bc });
    span(sm.group, 0, 0, { pop: true });
    crowd(0, [person('thracian'), person('thracianWoman'), person('thracian'), person('thracianWoman')]);
    put(g, person('thracian'), HILL.x + 0.4, HILL.z + 1.2, 0, tops);
  }
  // 1. Македонци и римляни.
  const STAD = { z0: -2.8 };
  const std = ms(stadium({ L: FRONT - 0.05 - STAD.z0, a: 1.8, D: 0.85 }));
  std.position.set(0, 0, STAD.z0); scene.add(std);
  named.stadium = std;
  const runners = [];
  {
    const g = groups[1];
    ground(g, -6.5, -2.2, -2, 8, M(0xffffff, { tex: 'limestone', rep: [4, 8] }));
    ground(g, 2.2, 6.0, -6, 8, M(0xffffff, { tex: 'limestone', rep: [4, 12] }));
    for (const [dx, dz, len, ry] of [[0, 1.9, 4.2, 0], [-2.4, 0, 3.0, Math.PI / 2], [2.4, 0, 3.0, Math.PI / 2], [0, -1.8, 4.2, 0]]) onHill(1, ms(crenellatedWall(len, { h: 0.75, t: 0.3, mud: false })), dx, dz, ry);
    for (const [dx, dz] of [[-2.4, 1.9], [2.4, 1.9], [-2.4, -1.8], [2.4, -1.8]]) onHill(1, ms(stoneTower({ s: 0.6, h: 1.05 })), dx, dz);
    for (const [dx, dz] of [[-1, 0.4], [0.9, -0.4]]) onHill(1, ms(romanDomus({ w: 1.3, d: 1.1, h: 0.45 })), dx, dz);
    put(g, ms(romanDomus(), ['mosaic', 'pool']), HOUSE.x, HOUSE.z, HOUSE.ry);
    put(g, ms(romanDomus({ w: 1.8, d: 1.6 })), -6.0, 5.6, Math.PI / 2);
    put(g, ms(stoaDetailed({ w: 3.4, d: 0.8, h: 0.6, cols: 13 })), -3.2, -1.0, Math.PI / 2);
    put(g, ms(romanDomus({ w: 1.8, d: 1.6 })), 3.6, 0.6, -Math.PI / 2);
    put(g, ms(romanDomus({ w: 1.6, d: 1.6 })), 3.4, -3.8, -Math.PI / 2);
    // Бегачи на пистата и зрители по седалките.
    for (let i = 0; i < 3; i++) { const r = person('citizen', { scale: 0.9 }); g.add(r); runners.push(r); }
    for (const [x, z] of [[-1.35, 1.5], [-1.55, 3.0], [1.4, 2.2], [1.5, 4.4], [-1.3, 5.6], [1.35, 6.4]]) { const s = person(x < 0 ? 'citizen' : 'woman', { scale: 0.8 }); s.position.set(x, Math.abs(x) > 1.45 ? 0.45 : 0.3, z); s.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(s); }
    crowd(1, [person('warrior'), person('citizen'), person('woman')].map((p) => p));
    people[1].forEach((p, i) => { p.position.x = -2.0 - (i % 2) * 0.4; });
    put(g, person('warrior'), HILL.x + 0.2, HILL.z + 1.4, 0, tops);
    for (const [x, z] of [[-6.5, 0.5], [5.4, 6.5]]) put(g, leafTree(1.1), x, z);
  }
  // Театърът: в римската епоха и днес; между тях е засипан (зелена могила).
  const TH = { x: 7.8, z: 4.6 };
  const theatre = ms(romanTheatre({ R: 1.75 }));
  theatre.position.set(TH.x, 0, TH.z); theatre.rotation.y = -Math.PI / 2; scene.add(theatre);
  span(theatre, 1, 1);
  const theatreToday = theatre.clone(); scene.add(theatreToday); span(theatreToday, 6, 6);
  const mound = new THREE.Group();
  const mh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), MM('grass', { rep: [3, 2] }));
  mh.scale.set(2.2, 0.9, 2.2); mound.add(mh);
  for (const [x, z] of [[0.6, -0.4], [-0.5, 0.6]]) { const t = leafTree(1.0); t.position.set(x, 0.75, z); mound.add(t); }
  mound.position.set(TH.x + 0.3, 0, TH.z); scene.add(mound);
  span(mound, 2, 5);
  // Джамията: от османската епоха до днес.
  const MQ = { x: 3.7, z: -4.4 };
  const mq = ms(mosque());
  mq.position.set(MQ.x, 0, MQ.z); mq.rotation.y = -Math.PI / 2; scene.add(mq);
  span(mq, 3, 6);

  // 2. Средновековие.
  {
    const g = groups[2];
    ground(g, -1.0, 1.0, -9, FRONT, cobble(2, 18));
    for (const [dx, dz, len, ry] of [[0, 1.9, 4.2, 0], [-2.4, 0, 3.0, Math.PI / 2], [2.4, 0, 3.0, Math.PI / 2], [0, -1.8, 4.2, 0]]) onHill(2, ms(stoneWall(len, { h: 0.8, t: 0.28 })), dx, dz, ry);
    for (const [dx, dz] of [[-2.4, 1.9], [2.4, 1.9], [-2.4, -1.8], [2.4, -1.8], [0, 1.9]]) onHill(2, ms(stoneTower({ s: 0.65, h: 1.25, roof: dx === 0 })), dx, dz);
    for (const [dx, dz] of [[-1, 0.3], [0.9, -0.3]]) addSmoke(2, onHill(2, ms(medievalHouse({ w: 0.8, d: 0.65 })), dx, dz));
    addSmoke(2, put(g, ms(medievalHouse({ w: 1.4, d: 1.0 })), HOUSE.x, HOUSE.z, HOUSE.ry));
    for (const [x, z, ry] of [[-2.0, -1.6, Math.PI / 2], [-2.0, 5.8, Math.PI / 2], [2.0, 4.2, -Math.PI / 2], [2.0, 0.2, -Math.PI / 2], [-6.0, 2.0, Math.PI / 2]]) addSmoke(2, put(g, ms(medievalHouse({ w: 1.0, d: 0.75 })), x, z, ry));
    for (const [x, z] of [[2.0, 1.8], [-2.0, 4.4]]) put(g, ms(dukyan()), x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2);
    crowd(2, [medPerson('peasant'), medPerson('woman'), medPerson('merchant'), medPerson('peasant')].map((p) => mergeStatic(p)));
    put(g, mergeStatic(medPerson('guard')), HILL.x + 0.3, HILL.z + 1.3, 0, tops);
    for (const [x, z] of [[-6.5, -1], [5.6, 7]]) put(g, leafTree(1.1), x, z);
  }
  // 3. Османска власт.
  {
    const g = groups[3];
    ground(g, -1.0, 1.0, -9, FRONT, cobble(2, 18));
    for (const [dx, dz, len, ry, s] of [[0, 1.9, 4.2, 0, 1], [-2.4, 0, 3.0, Math.PI / 2, 2], [2.4, 0.2, 2.4, Math.PI / 2, 3], [0, -1.8, 3.6, 0, 4]]) onHill(3, ms(ruinWall(len, { h: 0.55, seed: s })), dx, dz, ry);
    for (const [dx, dz] of [[-2.4, 1.9], [2.4, -1.8]]) onHill(3, ms(ruinWall(0.6, { h: 0.6, t: 0.6, seed: dx > 0 ? 5 : 6 })), dx, dz);
    for (const [dx, dz] of [[-0.8, 0.4], [1.0, -0.6]]) onHill(3, leafTree(0.9), dx, dz);
    const yard = put(g, ms(mahalaHouse({ w: 1.5, d: 1.1 })), HOUSE.x, HOUSE.z, HOUSE.ry); addSmoke(3, yard);
    put(g, ms(yardWall(2.2, { gate: true, h: 0.55 })), HOUSE.x + 1.25, HOUSE.z, Math.PI / 2);
    for (const [x, z, ry] of [[-6.0, 2.0, Math.PI / 2], [-6.2, 5.6, Math.PI / 2]]) addSmoke(3, put(g, ms(mahalaHouse({ w: 1.3, d: 1.0, color: 0xf2e6c8 })), x, z, ry));
    for (const [x, z] of [[-1.9, -1.6], [-1.9, -0.4], [-1.9, 4.4], [-1.9, 5.6], [2.0, -0.6], [2.0, 0.6], [2.0, 3.4], [2.0, 4.6], [2.0, 5.8]]) put(g, ms(dukyan({ w: 1.1, d: 0.7 })), x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2);
    crowd(3, [cityPerson('turban'), cityPerson('veiled'), mergeStatic(medPerson('merchant')), cityPerson('robe'), mergeStatic(medPerson('woman')), cityPerson('turban')]);
    for (const [x, z] of [[-6.5, -1.2], [-6.0, 7.4]]) put(g, leafTree(1.1), x, z);
  }
  // 4. Възраждане.
  {
    const g = groups[4];
    ground(g, -1.0, 1.0, -9, FRONT, cobble(2, 18));
    for (const [dx, dz, len, ry, s] of [[0, 1.9, 4.2, 0, 1], [-2.4, 0, 3.0, Math.PI / 2, 2], [2.4, 0.2, 2.4, Math.PI / 2, 3], [0, -1.8, 3.6, 0, 4]]) onHill(4, ms(ruinWall(len, { h: 0.5, seed: s })), dx, dz, ry);
    for (const [dx, dz] of [[-0.8, 0.4], [1.0, -0.6], [0.2, 1.0]]) onHill(4, leafTree(1.0), dx, dz);
    put(g, fp('gent'), HILL.x + 0.2, HILL.z + 1.3, 0, tops);
    // Старият град под хълма.
    for (const [x, z, c] of [[-7.6, -7.0, 0x3f6fae], [-2.0, -7.4, 0xd9a441], [-5.0, -6.8, 0xb5533c]]) addSmoke(4, put(g, ms(revivalHouse({ w: 1.4, d: 1.1, color: c })), x, z, 0));
    const rh = ms(revivalHouse({ w: 1.9, d: 1.4, color: 0x3f6fae }));
    const ped = curvedPediment(0.9, 0x3f6fae); ped.position.set(0, rh.userData.top - 0.44, 1.4 / 2 + 0.18 + 0.28); rh.add(ped);
    addSmoke(4, put(g, ms(rh), HOUSE.x, HOUSE.z, HOUSE.ry));
    for (const [x, z, k] of [[-1.95, -1.4, 'aba'], [-1.95, -0.2, 'kozhuh'], [-1.95, 4.4, 'bakal'], [2.0, -0.4, 'aba'], [2.0, 0.8, 'bakal'], [2.0, 3.6, 'kozhuh'], [2.0, 4.8, 'aba']]) put(g, ms(shop({ w: 1.1, d: 0.8, kind: k })), x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2);
    addSmoke(4, put(g, ms(revivalHouse({ w: 1.4, d: 1.1, color: 0xd9a441, erker: false })), -6.2, 5.4, Math.PI / 2));
    crowd(4, [fp('man'), fp('woman'), fp('gent'), fp('priest'), fp('woman'), fp('boy')]);
    for (const [x, z] of [[-6.5, 1.0], [5.6, 7.2]]) put(g, leafTree(1.1), x, z);
  }
  // 5. След Освобождението.
  const carriage = coach({ color: 0x2f3a4a });
  {
    const g = groups[5];
    ground(g, -1.0, 1.0, -9, FRONT, cobble(2, 18));
    ground(g, -2.1, -1.0, -6, FRONT, M(0xffffff, { tex: 'limestone', rep: [1, 12] }), 0.012);
    ground(g, 1.0, 2.1, -1.5, FRONT, M(0xffffff, { tex: 'limestone', rep: [1, 10] }), 0.012);
    for (const [dx, dz, len, ry, s] of [[0, 1.9, 4.2, 0, 1], [-2.4, 0, 3.0, Math.PI / 2, 2], [2.4, 0.2, 2.4, Math.PI / 2, 3], [0, -1.8, 3.6, 0, 4]]) onHill(5, ms(ruinWall(len, { h: 0.45, seed: s })), dx, dz, ry);
    for (const [dx, dz] of [[-0.9, 0.5], [1.0, -0.6], [0.3, 1.0], [-1.4, -0.9]]) onHill(5, leafTree(1.1), dx, dz);
    for (const [dx, dz, ry] of [[0.2, 0.0, 0], [-0.6, -0.4, 0.6]]) onHill(5, ms(bench()), dx, dz, ry);
    put(g, fp('lady'), HILL.x - 0.3, HILL.z + 0.6, 0, tops); put(g, fp('gent'), HILL.x + 0.3, HILL.z + 0.6, 0, tops);
    for (const [x, z, c] of [[-7.6, -7.0, 0x3f6fae], [-2.0, -7.4, 0xd9a441], [-5.0, -6.8, 0xb5533c]]) put(g, ms(revivalHouse({ w: 1.4, d: 1.1, color: c })), x, z, 0);
    addSmoke(5, put(g, ms(europeanHouse({ w: 2.0, d: 1.3, floors: 2, color: 0xe8c98a, shop: false })), HOUSE.x, HOUSE.z, HOUSE.ry));
    for (const [x, z, c, f] of [[-2.8, -1.0, 0xd9b8a0, 3], [-2.8, 5.9, 0xc9d3b0, 2], [2.9, 0.4, 0xe6d6a8, 3], [2.9, 3.4, 0xd8a890, 2], [2.9, 6.4, 0xe0d0b8, 3]]) addSmoke(5, put(g, ms(europeanHouse({ w: 2.2, d: 1.3, floors: f, color: c })), x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2));
    for (const z of [-0.5, 2.5, 5.5, 8.2]) for (const x of [-1.15, 1.15]) put(g, ms(streetLamp(), ['glass']), x, z);
    carriage.rotation.y = Math.PI / 2; carriage.scale.setScalar(0.7); g.add(carriage);
    const horse = animal('horse'); horse.scale.setScalar(0.8); carriage.add(horse); horse.position.set(0.95, 0, 0); horse.scale.setScalar(1.15);
    crowd(5, [fp('gent'), fp('lady'), mergeStatic(worker('master')), fp('woman'), mergeStatic(worker('lady')), fp('boy')]);
    people[5].forEach((p, i) => { p.position.x = i % 2 ? 1.5 : -1.5; });
  }
  // 6. Днес.
  {
    const g = groups[6];
    const PAV = CM('paving', { rep: [2, 12] });
    ground(g, -2.1, 2.1, -9, PIT.z0 - 0.02, PAV); ground(g, -2.1, 2.1, PIT.z1 + 0.02, FRONT, PAV);
    for (const [dx, dz, len, ry, s] of [[0, 1.9, 4.2, 0, 1], [-2.4, 0, 3.0, Math.PI / 2, 2], [2.4, 0.2, 2.4, Math.PI / 2, 3], [0, -1.8, 3.6, 0, 4]]) onHill(6, ms(ruinWall(len, { h: 0.6, seed: s, low: 0.55 })), dx, dz, ry);
    for (const [dx, dz] of [[-1.4, -0.9], [1.4, 1.2]]) onHill(6, leafTree(1.0), dx, dz);
    onHill(6, ms(infoBoard('Небет тепе')), 0.4, 1.0, 0);
    put(g, cityPerson('tourist'), HILL.x - 0.4, HILL.z + 0.6, 0, tops); put(g, cityPerson('kid'), HILL.x + 0.1, HILL.z + 0.4, 0, tops);
    for (const [x, z, c] of [[-7.6, -7.0, 0x3f6fae], [-2.0, -7.4, 0xd9a441], [-5.0, -6.8, 0xb5533c]]) put(g, ms(revivalHouse({ w: 1.4, d: 1.1, color: c })), x, z, 0);
    put(g, ms(europeanHouse({ w: 2.0, d: 1.3, floors: 2, color: 0xf2d27a, shop: false, fresh: true })), HOUSE.x, HOUSE.z, HOUSE.ry);
    for (const [x, z] of [[-2.15, 2.0], [-2.15, 3.2]]) put(g, ms(cafeTable()), x, z);
    for (const [x, z, c, f] of [[-2.8, -1.0, 0xf0c8a8, 3], [-2.8, 5.9, 0xbfe0c0, 2], [2.9, 0.4, 0xf6e0a0, 3], [2.9, 3.4, 0xf0b8a0, 2], [2.9, 6.4, 0xf2e4d0, 3]]) put(g, ms(europeanHouse({ w: 2.2, d: 1.3, floors: f, color: c, fresh: true })), x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2);
    for (const z of [-0.5, 2.5, 5.5, 8.2]) put(g, ms(streetLamp({ modern: true }), ['glass']), z > 4 ? 1.0 : -1.0, z);
    for (const z of [0.9, 4.0, 7.0]) put(g, ms(bench()), 1.25, z, -Math.PI / 2);
    for (const z of [1.6, 6.2]) put(g, leafTree(0.8), -1.4, z);
    // Ямата с разкопания край на стадиона: перила и табела.
    for (const [x, z, len, ry] of [[0, PIT.z0 - 0.05, 3.9, 0], [0, PIT.z1 + 0.05, 3.9, 0], [PIT.x0 - 0.05, (PIT.z0 + PIT.z1) / 2, 2.6, Math.PI / 2], [PIT.x1 + 0.05, (PIT.z0 + PIT.z1) / 2, 2.6, Math.PI / 2]]) put(g, ms(railing(len)), x, z, ry);
    const board = put(g, ms(infoBoard('Античен стадион')), -1.2, PIT.z1 + 0.35, Math.PI);
    named.board = board;
    put(g, ms(infoBoard('Античен театър')), TH.x - 2.3, TH.z + 1.4, -Math.PI / 2);
    crowd(6, [cityPerson('man'), cityPerson('woman'), cityPerson('kid'), cityPerson('tourist'), cityPerson('woman'), cityPerson('man')]);
    for (const [x, z] of [[-0.8, -2.1], [0.9, -2.0]]) folk(6, cityPerson(x < 0 ? 'tourist' : 'kid'), x, z);
  }
  // Дим от комините на всяка епоха.
  chimneys.forEach((pts, e) => { if (pts.length) span(smoke(stage, pts.slice(0, 8), { color: 0xd8d4cc }).group, e, e, { pop: true }); });
  // Археолози (показват се в стъпка 4).
  const diggers = [cityPerson('archaeologist'), cityPerson('archaeologist')];
  diggers.forEach((d, i) => { d.position.set(-0.6 + i * 1.1, -1.32, -3.2 - i * 0.4); d.rotation.y = i ? -0.6 : 0.5; d.visible = false; scene.add(d); });
  // Пешеходите се разхождат.
  people.forEach((list) => wander(stage, list, { r: 0.35, speed: 0.25 }));

  // ---------- разрез под главната улица (лицето на плочата отпред) ----------
  const SEC = { w: 5.0, z: FRONT + 0.035 };
  const section = new THREE.Group(); scene.add(section);
  const bedrock = new THREE.Mesh(new THREE.BoxGeometry(SEC.w, 1, 0.07), M(0x6e6a64, { tex: 'rock', rep: [3, 1] }));
  bedrock.position.z = SEC.z; section.add(bedrock);
  const layerMeshes = LAYERS.map((L, k) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(SEC.w, 1, 0.08), CM('soil', { color: L.color, rep: [3, 0.6] }));
    m.position.z = SEC.z + 0.005; section.add(m);
    const l = labelSprite(EPOCHS[k].label, { size: 0.17 }); l.position.set((k % 2 ? -1 : 1) * (SEC.w / 2 + 0.95), 0, SEC.z + 0.1); section.add(l);
    m.userData = { label: l, y: -0.5, h: 0.001 };
    return m;
  });
  const secStadium = stadiumSection({ a: 1.8, D: 0.85, depth: 0.05 });
  secStadium.position.z = SEC.z + 0.03; section.add(secStadium);
  const secTitle = labelSprite('Разрез: какво има под улицата', { size: 0.2 }); secTitle.position.set(0, -DEPTH - 0.25, SEC.z + 0.1); section.add(secTitle); secTitle.visible = false;
  // Камъчета и парчета от съдове в слоевете.
  const bits = [];
  for (let k = 0; k < LAYERS.length; k++) for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.02), mat(k % 2 ? 0xb5683a : 0xd8d0bf));
    b.userData = { k, x: -2.2 + ((i * 1.37 + k * 0.61) % 4.4), dy: 0.3 + ((i * 0.37 + k * 0.23) % 0.4) };
    b.position.z = SEC.z + 0.05; section.add(b); bits.push(b);
  }
  let secEpoch = 0;
  // Целеви положения на слоевете за епоха e: най-новият слой е отгоре (y = 0), старите слизат надолу.
  function sectionTargets(e) {
    let top = 0;
    const out = [];
    for (let k = e; k >= 0; k--) { out[k] = { top, h: LAYERS[k].t }; top -= LAYERS[k].t; }
    for (let k = e + 1; k < LAYERS.length; k++) out[k] = { top: 0, h: 0.001 };
    return { out, bottom: top };
  }
  const stadiumY = (e) => (e < 1 ? 0 : -LAYERS.slice(2, e + 1).reduce((a, L) => a + L.t, 0));
  let secState = null;
  function setSection(e, instant) {
    secEpoch = e;
    secState = sectionTargets(e);
    if (instant) applySection(1);
  }
  function applySection(f) {
    const { out, bottom } = secState;
    layerMeshes.forEach((m, k) => {
      const T = out[k];
      m.userData.y += (T.top - m.userData.y) * f;
      m.userData.h += (T.h - m.userData.h) * f;
      m.scale.y = Math.max(0.001, m.userData.h);
      m.position.y = m.userData.y - m.userData.h / 2;
      m.visible = m.userData.h > 0.01;
      m.userData.label.visible = m.visible && (phase === 2 || phase === 4);
      m.userData.label.position.y = m.position.y;
    });
    secTitle.visible = phase === 2 || phase === 4;
    const bt = layerMeshes[0].userData.y - layerMeshes[0].userData.h;
    void bottom;
    bedrock.scale.y = Math.max(0.01, bt + DEPTH); bedrock.position.y = (bt - DEPTH) / 2;
    secStadium.visible = secEpoch >= 1 && layerMeshes[1].visible;
    secStadium.position.y = layerMeshes[1].userData.y;
    std.position.y += (stadiumY(secEpoch) - std.position.y) * f;
    std.visible = secEpoch >= 1;
    for (const b of bits) { const m = layerMeshes[b.userData.k]; b.visible = m.visible && m.userData.h > 0.12; b.position.set(b.userData.x, m.userData.y - Math.min(m.userData.h * 0.8, b.userData.dy * m.userData.h), b.position.z); }
  }

  // ---------- кликаеми места ----------
  const ANCH = {
    hill: [HILL.x, HILL.h + 1.2, HILL.z], street: [0, 1.0, 4.2], house: [HOUSE.x, 1.7, HOUSE.z],
    people: [0.2, 0.9, 5.2], theatre: [TH.x, 1.2, TH.z],
  };
  const VIEWS = {
    hill: [[-1.0, 6.0, -3.6], [HILL.x, HILL.h + 0.3, HILL.z]],
    street: [[1.4, 5.4, 9.6], [0.3, 0.2, -1.6]],
    house: [[-0.4, 3.4, 3.8], [HOUSE.x, 0.6, HOUSE.z]],
    people: [[-0.2, 2.3, 11.2], [0.1, 0.4, 4.6]],
    theatre: [[3.6, 3.6, 9.8], [TH.x, 0.4, TH.z]],
  };
  for (const [id, [x, y, z]] of Object.entries(ANCH)) marker(id + 'A', x, y, z);
  const hitZone = (id, x, y, z, w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x, y, z); m.userData.pickId = id; scene.add(m); named[id] = m; return m; };
  hitZone('hill', HILL.x, HILL.h + 0.6, HILL.z, 6, 1.6, 4.4);
  hitZone('street', 0, 0.5, 1.0, 2.2, 1.0, 9);
  hitZone('house', HOUSE.x, 0.8, HOUSE.z, 2.0, 1.8, 2.2);
  hitZone('people', 0.2, 0.4, 7.2, 2.0, 0.8, 2.6);
  hitZone('theatre', TH.x, 0.6, TH.z, 3.4, 1.4, 3.6);

  // ---------- епохите се сменят ----------
  let epoch = 0;
  function setEpoch(e, { instant = false } = {}) {
    epoch = e;
    for (const s of spans) {
      const on = e >= s.from && e <= s.to;
      s.target = on ? 1 : 0;
      if (instant || s.pop) { s.k = s.target; applySpan(s); }
    }
    lid.visible = e !== 6;
    pitFloor.visible = e === 6;
    setSection(e, instant);
    bar.sync();
  }
  function applySpan(s) {
    s.obj.visible = s.k > 0.002;
    if (s.pop) return;
    const kids = s.kids ? s.obj.children : [s.obj];
    for (const c of kids) c.scale.y = Math.max(0.002, s.k) * (c.userData.sy || 1);
  }
  // Сменящите се части растат и се свиват спокойно.
  let runT = 0;
  stage.tick((dt, t) => {
    for (const s of spans) {
      if (s.target === undefined || s.k === s.target) continue;
      s.k = s.target > s.k ? Math.min(1, s.k + dt * 2.2) : Math.max(0, s.k - dt * 3);
      applySpan(s);
    }
    if (secState) applySection(Math.min(1, dt * 3));
    rv.tick(dt);
    clouds.forEach((c, i) => { c.position.x = ((c.position.x + dt * (0.15 + i * 0.05) + 20) % 40) - 20; });
    if (named.fire0) named.fire0.scale.y = 1 + Math.sin(t * 11) * 0.18;
    // Бегачите обикалят пистата на стадиона.
    runT += dt;
    runners.forEach((r, i) => { const u = ((runT * 0.06 + i * 0.07) % 1); const z = STAD.z0 + 0.6 + u * 9.5; r.position.set(-0.4 + i * 0.4, Math.abs(Math.sin(t * 9 + i)) * 0.04, z); r.rotation.y = 0; });
    // Каретата минава по улицата.
    const cz = ((t * 0.5) % 17) - 8; carriage.position.set(0.35, 0, -cz); carriage.userData.roll(t * 0.5);
    if (pulse) { const k = 0.5 + 0.5 * Math.sin(t * 5); pulse.forEach((m) => m.material.emissive && m.material.emissive.setRGB(k * 0.35, k * 0.25, 0)); }
  });
  let pulse = null;

  // ---------- лента с епохите (под сцената) ----------
  const bar = (() => {
    const el = document.createElement('div');
    el.className = 'pv-epochs';
    el.style.cssText = 'position:absolute;left:50%;bottom:8px;transform:translateX(-50%);z-index:6;width:min(94%,560px);box-sizing:border-box;background:rgba(255,255,255,0.95);border:1px solid #c7d3e0;border-radius:14px;padding:6px 8px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,0.15)';
    el.innerHTML = `<button class="btn pv-prev" aria-label="По-рано" style="min-width:38px;padding:6px 8px">◀</button>
      <div style="flex:1;min-width:0;text-align:center"><div class="pv-name" style="font-weight:700;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
      <input class="pv-range" type="range" min="0" max="6" step="1" value="0" aria-label="Епоха" style="width:100%;margin:2px 0 0">
      <div class="pv-hint" style="display:flex;justify-content:space-between;font-size:0.7rem;color:#667"><span>по-рано</span><span>днес</span></div></div>
      <button class="btn pv-next" aria-label="По-късно" style="min-width:38px;padding:6px 8px">▶</button>`;
    shell.stageEl.appendChild(el);
    // Тесен екран: по-ниска лента, за да остане повече място за сцената.
    if ((shell.stageEl.clientWidth || 600) < 480) { el.querySelector('.pv-hint').style.display = 'none'; el.style.padding = '3px 6px'; el.style.bottom = '4px'; }
    ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => el.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
    const range = el.querySelector('.pv-range');
    const go = (e) => { e = Math.max(0, Math.min(6, e)); if (e === epoch) { bar.sync(); return; } setEpoch(e); onEpoch && onEpoch(e); };
    range.addEventListener('input', () => go(+range.value));
    el.querySelector('.pv-prev').addEventListener('click', () => go(epoch - 1));
    el.querySelector('.pv-next').addEventListener('click', () => go(epoch + 1));
    return {
      el,
      sync() { range.value = String(epoch); el.querySelector('.pv-name').innerHTML = `${esc(EPOCHS[epoch].label)} <small style="font-weight:400;color:#556">· ${esc(EPOCHS[epoch].when)}</small>`; },
      show(on) { el.style.display = on ? 'flex' : 'none'; },
      go,
    };
  })();
  let onEpoch = null;

  // ---------- общи помощници ----------
  let tip = null, tip2 = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.3, cls: 'wide', ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } if (tip2) { tip2.remove(); tip2 = null; } };
  const scores = [];
  let clickHandler = null, stopDrag = null, phase = 1;
  const extra = [];
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const next = (label, fn) => { const c = shell.setControls(`<button class="btn primary">${label}</button>`); c.querySelector('button').addEventListener('click', () => { clearTip(); fn(); }); };

  // ---------- 1. Опознай ----------
  const seenE = new Set(), seenP = new Set();
  let place = 'street';
  const menu = cornerMenu(stage, { title: 'Места', items: PLACES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })), onSelect: (id) => { if (phase === 1) showPlace(id, true); } });
  function showPlace(id, fly) {
    place = id;
    const P = PLACES.find((p) => p.id === id);
    if (fly) { const [pos, tgt] = VIEWS[id]; view(pos, tgt, 1.1); }
    const ev = EVENTS[epoch] ? `<br><span style="color:#8a4b00">📅 ${esc(EVENTS[epoch])}</span>` : '';
    say(named[id + 'A'], `<b>${esc(P.label)} · ${esc(EPOCHS[epoch].label)}</b><br>${P.notes[epoch]}${ev}`);
    seenP.add(id); menu.mark(id); menu.setActive(id);
    progress1();
  }
  function drawChips() {
    return `<div class="row" style="flex-wrap:wrap;gap:4px">${EPOCHS.map((E, i) => `<button class="btn pv-chip" data-e="${i}" style="padding:4px 8px;font-size:0.85rem${i === epoch ? ';outline:2px solid #2f7de1' : ''}">${seenE.has(i) ? '✓ ' : ''}${esc(E.label)}</button>`).join('')}</div>`;
  }
  function progress1() {
    if (phase !== 1) return;
    shell.score(`Епохи: ${seenE.size} от 7 · Места: ${seenP.size} от ${PLACES.length}`);
    const done = seenE.size === 7 && seenP.size === PLACES.length;
    const c = shell.setControls(drawChips() + (done ? '<button class="btn primary go" style="margin-top:8px">Напред →</button>' : ''));
    c.querySelectorAll('.pv-chip').forEach((b) => b.addEventListener('click', () => bar.go(+b.dataset.e)));
    if (done) { c.querySelector('.go').addEventListener('click', () => { clearTip(); step2(); }); }
  }
  function step1() {
    phase = 1;
    shell.step(0);
    scores.length = 0;
    seenE.clear(); seenP.clear();
    menu.setItems(PLACES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })));
    menu.show(true); bar.show(true);
    setEpoch(0, { instant: true });
    seenE.add(0);
    shell.task('Стоиш на едно и също място в Пловдив. Мести плъзгача долу и гледай как градът се сменя през вековете. Избирай места от менюто или ги кликай.');
    onEpoch = (e) => { seenE.add(e); showPlace(place, false); };
    clickHandler = (id) => { if (PLACES.some((p) => p.id === id)) showPlace(id, true); };
    showPlace('street', true);
  }

  // ---------- 2. Какво остава? ----------
  function step2() {
    phase = 2;
    shell.step(1);
    menu.show(false); bar.show(true);
    clickHandler = null;
    setEpoch(0, { instant: true });
    view([2.6, 1.4, 16.0], [0, -1.1, 8.0], 1.2);
    shell.score('');
    shell.task('Отпред виждаш разрез: какво има под главната улица. Мести плъзгача <b>от траките до днес</b> и гледай какво става със стадиона.');
    shell.setControls('');
    const reached = new Set([0]);
    say(named.secA, LAYER_NOTE[0], { lift: 0.2 });
    onEpoch = (e) => {
      reached.add(e);
      say(named.secA, `<b>${esc(EPOCHS[e].label)}</b><br>${LAYER_NOTE[e]}`, { lift: 0.2 });
      if (reached.size === 7 && e === 6 && !asked) ask();
    };
    let asked = false, mistakes = 0;
    function ask(qi = 0) {
      asked = true;
      const Q = Q2[qi];
      shell.task(`<b>${esc(Q.q)}</b>`);
      const c = shell.setControls(`<div class="col">${Q.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const o = Q.opts[+b.dataset.i];
        if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
        shell.msg('Вярно!', 'good');
        if (qi + 1 < Q2.length) { ask(qi + 1); return; }
        scores.push(stepScore(mistakes, 3));
        say(named.secA, 'Така е: старото не изчезва. То остава под земята като слой, а новото се строи отгоре.', { cls: 'good wide', lift: 0.2 });
        onEpoch = null;
        next('Напред →', step3);
      }));
    }
  }
  marker('secA', 0, 0.2, FRONT + 0.1);

  // ---------- 3. Подреди по време ----------
  const BOARD = { x: 0, z: 46 };
  // Тесен екран: гнездата са на два реда (1–4 и 5–7), картите — под тях.
  const narrow = aspect < 1;
  const slotXZ = (i) => (narrow ? [BOARD.x + ((i < 4 ? i : i - 4) - (i < 4 ? 1.5 : 1)) * 1.85, BOARD.z - 1.6 + (i < 4 ? 0 : 1.6)] : [BOARD.x + (i - 3) * 1.85, BOARD.z - 0.4]);
  const boardGround = new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 12), MM('grass', { rep: [6, 4] }));
  boardGround.position.set(BOARD.x, -0.2, BOARD.z + 1.5); scene.add(boardGround);
  const table = new THREE.Mesh(narrow ? new THREE.BoxGeometry(7.6, 0.08, 3.4) : new THREE.BoxGeometry(13.2, 0.08, 1.9), M(0x8a6040));
  table.position.set(BOARD.x, 0.04, narrow ? BOARD.z - 0.8 : BOARD.z - 0.4); scene.add(table);
  const slots = EPOCHS.map((E, i) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 1.3), mat(0xfff4d6));
    const [x, z] = slotXZ(i);
    s.position.set(x, 0.095, z);
    s.userData = { dropId: 's' + i, i };
    scene.add(s);
    const l = labelSprite(String(i + 1), { size: 0.26 }); l.position.set(x - 0.62, 0.2, z - 0.5); scene.add(l);
    return s;
  });
  const arrow = labelSprite('по-рано  →  →  →  по-късно', { size: 0.26 }); arrow.position.set(BOARD.x, 0.25, narrow ? BOARD.z - 2.55 : BOARD.z - 1.4); scene.add(arrow);
  // Карти с малки макети.
  function miniFor(i) {
    const g = new THREE.Group();
    const add = (o, x, z, s, ry = 0) => { o.scale.multiplyScalar(s); o.position.set(x, 0.06, z); o.rotation.y = ry; g.add(o); return o; };
    if (i === 0) { add(ms(thracianHouse(), ['fire']), -0.15, 0, 0.55); add(ms(crenellatedWall(1.2, { h: 0.5, t: 0.2 })), 0, -0.35, 0.8); }
    if (i === 1) add(ms(stadium({ L: 1.5, a: 0.5, D: 0.3, rows: 5, top: 0.28 })), -0.55, 0, 0.8, Math.PI / 2);
    if (i === 2) { add(ms(stoneTower({ s: 0.5, h: 0.9 })), -0.35, -0.1, 0.7); add(ms(stoneTower({ s: 0.5, h: 0.9, roof: true })), 0.35, -0.1, 0.7); add(ms(stoneWall(0.6, { h: 0.5, t: 0.2 })), 0, -0.1, 0.7); }
    if (i === 3) { add(ms(mosque()), -0.1, -0.05, 0.28); add(ms(dukyan({ w: 0.9, d: 0.6 })), 0.45, 0.25, 0.4, -Math.PI / 2); }
    if (i === 4) { const rh = revivalHouse({ w: 1.4, d: 1.0, color: 0x3f6fae }); const p = curvedPediment(0.7); p.position.set(0, rh.userData.top - 0.44, 0.5 + 0.18 + 0.28); rh.add(p); add(ms(rh), 0, -0.1, 0.42); }
    if (i === 5) { add(ms(europeanHouse({ w: 1.6, d: 1.0, floors: 2 })), 0, -0.15, 0.42); add(ms(streetLamp()), 0.55, 0.35, 0.5); }
    if (i === 6) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 0.9), CM('paving', { rep: [2, 1] })); p.position.y = 0.07; g.add(p); add(ms(streetLamp({ modern: true })), -0.45, -0.2, 0.5); add(ms(bench()), 0.2, -0.25, 0.9); add(cityPerson('kid'), 0.0, 0.15, 0.8); add(cityPerson('woman'), 0.35, 0.1, 0.8); }
    return g;
  }
  const cards = CARDS.map((C, i) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.2), mat(0xf6efdc)); base.position.y = 0.03; g.add(base);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.04, 1.26), mat(0x7a5634)); rim.position.y = 0.01; g.add(rim);
    g.add(miniFor(i));
    const l = labelSprite(C.label, { size: 0.22 }); l.position.set(0, 0.95, 0.35); g.add(l);
    g.userData = { dragId: C.id, i };
    addHitBox(g, 0.6);
    g.visible = false;
    scene.add(g);
    return g;
  });
  const cardHome = (g) => { const k = CARD_ORDER.indexOf(g.userData.i); return narrow ? new THREE.Vector3(BOARD.x + ((k < 4 ? k : k - 4) - (k < 4 ? 1.5 : 1)) * 1.85, 0, BOARD.z + 2.2 + (k < 4 ? 0 : 1.6)) : new THREE.Vector3(BOARD.x + (k - 3) * 1.85, 0, BOARD.z + 2.3 + (k % 2) * 1.45); };
  function step3() {
    phase = 3;
    shell.step(2);
    bar.show(false); menu.show(false);
    clickHandler = null; onEpoch = null;
    setEpoch(6, { instant: true });
    if (narrow) view([BOARD.x, 8.8, BOARD.z + 6.0], [BOARD.x, 0, BOARD.z + 0.6], 1.2, 1.15); else view([BOARD.x, 7.6, BOARD.z + 10.6], [BOARD.x, 0, BOARD.z + 0.9], 1.2, aspect < 1.4 ? 1.6 / Math.max(aspect, 0.5) : 1);
    for (const g of cards) { g.visible = true; g.userData.locked = false; g.position.copy(cardHome(g)); g.userData.home = g.position.clone(); }
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Това са изгледи от различни епохи. Завлечи всяка картина на мястото ѝ: от <b>най-старата (1)</b> до <b>днешната (7)</b>.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${cards.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.1,
      onDrop(obj) {
        let best = null, bd = 1.1;
        for (const s of slots) { const d = Math.hypot(obj.position.x - s.position.x, obj.position.z - s.position.z); if (d < bd) { bd = d; best = s; } }
        if (!best) { obj.position.copy(obj.userData.home); return; }
        const i = obj.userData.i;
        if (best.userData.i === i) {
          obj.userData.locked = true;
          obj.position.set(best.position.x, 0.1, best.position.z);
          placed++;
          shell.score(`Подредени: ${placed} от ${cards.length}`);
          shell.msg(`Вярно: ${EPOCHS[i].label}.`, 'good');
          if (placed === cards.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            say(slots[3], 'Подреди града от траките до днес! Всяка епоха оставя следи, които виждаме и днес.', { cls: 'good wide', lift: 1.2 });
            next('Напред →', step4);
          }
        } else {
          mistakes++;
          const id = obj.userData.dragId;
          tries[id] = (tries[id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          const later = best.userData.i < i;
          shell.msg(tries[id] >= 2 ? `Подсказка: това е от епохата „${EPOCHS[i].label}“.` : (later ? 'Тази картина е от по-късна епоха. Сложи я по-надясно.' : 'Тази картина е от по-ранна епоха. Сложи я по-наляво.'), 'bad');
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    phase = 4;
    shell.step(3);
    for (const g of cards) g.visible = false;
    bar.show(false);
    setEpoch(6, { instant: true });
    view([1.4, 5.4, 9.6], [0.3, 0.2, -1.6], 1.2);
    shell.score('');
    let mistakes = 0;
    say(named.streetA, 'Днешната главна улица.', { cls: 'tag', lift: 0.1 });
    shell.task('Археолозите ще копаят под днешната главна улица. <b>Какво ще намерят?</b>');
    ask(PREDICT1, () => {
      // Разрезът показва истината: стадионът е под улицата.
      view([2.6, 1.4, 16.0], [0, -1.1, 8.0], 1.2);
      pulse = secStadium.children.filter((m) => m.isMesh).map((m) => { m.material = m.material.clone(); return m; });
      say(named.secA, '<b>Така е.</b> Под днешната улица е римският стадион. Археолозите го откриват при строежи и разкопки. Северният му край вече е разкопан до Джумая джамия.', { cls: 'good wide', lift: -0.4 });
      setTimeout(() => {
        if (phase !== 4) return;
        shell.task('Северният край на стадиона е разкопан и се показва на хората. <b>Как пазим такива паметници?</b>');
        ask(PREDICT2, () => {
          diggers.forEach((d) => { d.visible = true; });
          view([0.4, 3.0, 1.6], [0, -0.8, -3.6], 1.2);
          say(named.board, 'Паметниците пазят паметта на града. Археолозите разкопават внимателно, реставраторите поправят, музеите пазят находките. А ние не драскаме, не пипаме и не взимаме камъни.', { cls: 'good wide', lift: 0.9 });
          next('Виж резултата', () => {
            scores.push(stepScore(mistakes, 2));
            shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart);
          });
        });
      }, 1600);
    });
    function ask(list, onRight) {
      const c = shell.setControls(`<div class="col">${list.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = list[+b.dataset.i];
        if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
        shell.msg('Вярно предсказание!', 'good');
        shell.setControls('');
        onRight();
      }));
    }
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    for (const g of cards) { g.visible = false; g.userData.locked = false; }
    diggers.forEach((d) => { d.visible = false; });
    if (pulse) { pulse.forEach((m) => m.material.emissive && m.material.emissive.setRGB(0, 0, 0)); pulse = null; }
    step1();
  }

  step1();
  container.__demo = { stage, scene, setEpoch: (e) => bar.go(e), get epoch() { return epoch; }, select: (id) => showPlace(id, true) };
  return { dispose() { if (stopDrag) stopDrag(); menu.remove(); bar.el.remove(); stage.dispose(); } };
}
