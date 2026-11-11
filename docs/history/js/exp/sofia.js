// 4.3.5 „София през епохите“ — пластовете на София.
// Детето стои в центъра на София, с Витоша зад града. Плъзгачът сменя епохата: Сердика, Средец,
// османската епоха, столица на България, днес. Сградите се появяват в епохата, в която са построени.
// Стъпки: опознай петте епохи и седемте места → къде е София на картата → свържи паметника с епохата
// → предскажи защо София става столица и какво я прави център на държавата днес.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { M, stoaDetailed, crenellatedWall, baths } from './hist/architecture.js';
import { person, wander } from './hist/antiquity.js';
import { MM, stoneWall, stoneTower, medievalHouse, dukyan, medPerson, tarnovoChurch, mergeStatic } from './hist/medieval.js';
import { leafTree, pine, folkPerson, fountain } from './hist/revival.js';
import { coach, worker } from './hist/industrial.js';
import { car } from './hist/home.js';
import { smoke, cloud } from './hist/bulgar.js';
import { animal } from './hist/thrace.js';
import { CM, romanDomus, mahalaHouse, europeanHouse, ruinWall, streetLamp, bench, infoBoard, railing, cityPerson, retainingWall } from './hist/city.js';
import { rotunda, stSofia, minaret, banyaBashi, nevsky, parliament, tsarMonument, stateBuilding, metroEntrance, vitosha } from './hist/sofia-places.js';
import { createMap } from './hist/map.js';
import { createRegions, COL } from './hist/regions.js';

// Слива неподвижните части; ключовете от userData (движещи се части) остават отделни.
const ms = (obj, keys = []) => mergeStatic(obj, keys.flatMap((k) => [].concat(obj.userData[k] ?? [])));
const fp = (kind) => mergeStatic(folkPerson(kind));

const KEPT = 'Запазено и днес.';
const REC = 'Възстановка.';
const GEN = 'Обобщена възстановка: не знаем точно как е изглеждало.';
const SIMPLE = 'Сградата е запазена. Моделът е опростен.';
const tag = (s) => `<br><span class="small"><b>${s}</b></span>`;

const EPOCHS = [
  { id: 'serdika', label: 'Сердика', when: 'римски град, I – VI век' },
  { id: 'sredets', label: 'Средец', when: 'Средновековие, IX – XIV век' },
  { id: 'ottoman', label: 'Османска власт', when: 'XV – XIX век' },
  { id: 'capital', label: 'Столица на България', when: '1879 г. – началото на XX век' },
  { id: 'today', label: 'Днес', when: 'XXI век' },
];
const EVENTS = [
  'Градът се казва Сердика — по името на тракийското племе серди. Римляните го правят голям град със стени.',
  '809 г.: хан Крум присъединява Сердика към България. Българите наричат града Средец.',
  'В края на XIV век османците завладяват града. Той вече се нарича София.',
  '3 април 1879 г.: Учредителното събрание в Търново избира София за столица на свободна България.',
  'София е столица на Република България. В нея живеят повече от един милион души.',
];
// Местата и какво казва балончето във всяка епоха (кое е запазено или разкопано и кое е възстановка).
const PLACES = [
  { id: 'center', label: 'Центърът на града', icon: '🏛️', notes: [
    `Тук е сърцето на Сердика. Две главни улици с каменни плочи се пресичат. Около тях има къщи, бани и крепостна стена. ${tag('Улиците и стените са разкопани. Видът на сградите е възстановка.')}`,
    `Средец е крепост с каменни стени и кули. Вътре има къщи, църкви и пазар. ${tag(GEN)}`,
    `Над римските улици вече има нов град — чаршия с дюкяни и тесни улички. Римският град е под земята. ${tag(GEN)}`,
    `София е столица, но още е малък град. Строят се широки улици и сгради в европейски стил. ${tag(REC)}`,
    `Днес тук е площад „Независимост“. От двете страни са Президентството и Министерският съвет. Под площада е метрото. При строежа му археолозите откриват улиците и сградите на Сердика. Днес те се виждат. ${tag('Разкопките на Сердика са запазени. Сградите са опростени.')}`,
  ] },
  { id: 'vitosha', label: 'Витоша', icon: '⛰️', notes: [
    `На юг от града се издига планината Витоша. Тя дава на града вода, дърва и чист въздух. ${tag('Планината е истинска. Гората е обобщена.')}`,
    `В полите на Витоша е Боянската църква. Стенописите в нея са от 1259 г. Днес тя е паметник под закрилата на ЮНЕСКО. ${tag(SIMPLE)}`,
    `Витоша е все същата. По склоновете ѝ пастири пасат стада. ${tag(GEN)}`,
    `През 1895 г. Алеко Константинов води над 300 души на Черни връх. Оттогава хората от столицата обичат да ходят във Витоша. ${tag(GEN)}`,
    `Днес Витоша е природен парк. Най-високият ѝ връх е Черни връх — 2290 м. Склоновете ѝ започват веднага след южните квартали на града. ${tag('Природата е истинска. Моделът е опростен.')}`,
  ] },
  { id: 'rotunda', label: 'Ротондата „Св. Георги“', icon: '⭕', notes: [
    `Ротондата „Св. Георги“ е кръгла тухлена сграда от IV век. Около нея има римски сгради и улица. ${tag('Ротондата е запазена и днес. Сградите около нея са разкопани.')}`,
    `Ротондата е църква. Стените ѝ вътре са изписани със стенописи. Част от тях са запазени и днес. ${tag(SIMPLE)}`,
    `Османците превръщат ротондата в джамия. Стенописите са замазани. ${tag(SIMPLE)}`,
    `Ротондата е най-старата сграда сред новия град. По-късно стенописите ѝ са открити отново. ${tag(SIMPLE)}`,
    `Днес ротондата е в двора между сградите на Президентството. Тя е най-старата запазена сграда в София. ${tag(KEPT)}`,
  ] },
  { id: 'stsofia', label: 'Църквата „Св. София“', icon: '⛪', notes: [
    `През VI век тук, извън стените, е построена голямата църква „Св. София“. Името значи „Света Мъдрост“. ${tag(SIMPLE)}`,
    `Църквата стои в Средец. През XIV век градът започва да се нарича София — по името на тази църква. ${tag(SIMPLE)}`,
    `Османците превръщат църквата в джамия и ѝ добавят минаре. По-късно земетресения я повреждат. ${tag('Минарето е възстановка.')}`,
    `Старата църква е повредена. В началото на XX век започват да я поправят. ${tag(SIMPLE)}`,
    `Днес „Св. София“ отново е църква. Тя е дала името на нашата столица. ${tag(KEPT)}`,
  ] },
  { id: 'banyabashi', label: 'Баня баши и минералната вода', icon: '♨️', notes: [
    `Тук извира топла минерална вода. Хората я ползват още в древността. Римляните имат бани в града. ${tag('Баните са обобщена възстановка.')}`,
    `Минералната вода тече и в Средец. Хората се къпят и пият от нея. ${tag(GEN)}`,
    `През XVI век османците строят джамията Баня баши. Името ѝ идва от баните с минерална вода до нея. ${tag('Джамията е запазена и днес.')}`,
    `Джамията стои. До нея в началото на XX век е построена Централната минерална баня. ${tag(SIMPLE)}`,
    `Джамията работи и днес. До нея има чешми с топла минерална вода — хората си наливат вода. ${tag(KEPT)}`,
  ] },
  { id: 'nevsky', label: 'Храм „Св. Александър Невски“', icon: '✨', notes: [
    `Тук още няма голям храм. Тук е полето извън стените на Сердика. ${tag(GEN)}`,
    `Тук още няма голям храм. ${tag(GEN)}`,
    `Тук още няма голям храм. ${tag(GEN)}`,
    `Храм-паметникът „Св. Александър Невски“ е строен от 1882 до 1912 г. Той е в памет на загиналите за Освобождението на България. ${tag(SIMPLE)}`,
    `Днес храмът е един от символите на София. Главният му купол е позлатен. ${tag(KEPT)}`,
  ] },
  { id: 'parliament', label: 'Народното събрание', icon: '🏛', notes: [
    `Тук още няма сгради на държавата. ${tag(GEN)}`,
    `Тук още няма сгради на държавата. ${tag(GEN)}`,
    `Тук още няма сгради на държавата. Градът е под османска власт. ${tag(GEN)}`,
    `Сградата на Народното събрание е построена в края на XIX век. Над входа пише „Съединението прави силата“. Отпред е паметникът на Цар Освободител (1907 г.). ${tag(SIMPLE)}`,
    `Тук депутатите от цялата страна приемат законите. Сградата е символ на свободна България. ${tag(SIMPLE)}`,
  ] },
];
// Карти за стъпка 3: паметник → епоха (индекс в EPOCHS).
const CARDS = [
  { id: 'c-rotunda', label: 'Ротондата', e: 0 },
  { id: 'c-stsofia', label: '„Св. София“', e: 0 },
  { id: 'c-boyana', label: 'Боянската църква', e: 1 },
  { id: 'c-banyabashi', label: 'Баня баши', e: 2 },
  { id: 'c-nevsky', label: '„Ал. Невски“', e: 3 },
  { id: 'c-parliament', label: 'Народното събрание', e: 3 },
  { id: 'c-metro', label: 'Метрото', e: 4 },
];
const CARD_ORDER = [4, 0, 6, 2, 5, 1, 3]; // разбъркан ред на масата (постоянен — за теста)
const CITIES = [
  { id: 'm-sofia', label: 'София', lon: 23.32, lat: 42.7 },
  { id: 'm-plovdiv', label: 'Пловдив', lon: 24.75, lat: 42.15 },
  { id: 'm-varna', label: 'Варна', lon: 27.91, lat: 43.21 },
  { id: 'm-burgas', label: 'Бургас', lon: 27.47, lat: 42.5 },
  { id: 'm-ruse', label: 'Русе', lon: 25.97, lat: 43.85 },
  { id: 'm-tarnovo', label: 'Велико Търново', lon: 25.63, lat: 43.08 },
  { id: 'm-vidin', label: 'Видин', lon: 22.88, lat: 43.99 },
];
const MAPQ = [
  { q: 'Коя планина се издига точно на юг от София?', opts: [
    { t: 'Витоша', ok: true },
    { t: 'Родопите', ok: false, why: 'Родопите са далеч на юг от Пловдив. Потърси планина съвсем близо до столицата.' },
    { t: 'Странджа', ok: false, why: 'Странджа е на югоизток, близо до Черно море. Погледни пак картата.' },
  ] },
  { q: 'Кое е вярно за мястото на София?', opts: [
    { t: 'Тя е в западна България, в Софийското поле, заобиколено от планини.', ok: true },
    { t: 'Тя е на брега на Черно море.', ok: false, why: 'Погледни картата: морето е далеч на изток.' },
    { t: 'Тя е на брега на река Дунав.', ok: false, why: 'Дунав е на север, по границата. София е далеч от него.' },
  ] },
];
const PREDICT1 = [
  { t: 'Тя е в средата на земите, където живеят българи, и на кръстопът на важни пътища.', ok: true },
  { t: 'Тя е най-големият и най-богатият град.', ok: false, why: 'Тогава София е малък град. Погледни картата: къде е тя сред българските земи?' },
  { t: 'Тя е старата столица на българските царе.', ok: false, why: 'Старата столица на царете е Търново. Погледни картата: къде е София?' },
];
const PREDICT2 = [
  { t: 'Тук работят Народното събрание, Министерският съвет и президентът.', ok: true },
  { t: 'Тук е най-високата планина в България.', ok: false, why: 'Най-високият връх е Мусала в Рила. А столицата е мястото, откъдето се управлява страната.' },
  { t: 'Тук е най-голямото пристанище.', ok: false, why: 'София е далеч от морето. Пристанищата са във Варна и Бургас.' },
];
// Старите пътища, които се срещат в София.
const ROADS = [
  { label: 'към Ниш и Белград', lon: 21.9, lat: 43.32 },
  { label: 'към Дунав', lon: 23.24, lat: 43.82 },
  { label: 'към Одрин и Истанбул', lon: 26.56, lat: 41.68 },
  { label: 'към Солун', lon: 23.1, lat: 41.25 },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['София през епохите', 'Къде е София?', 'Свържи с епохата', 'Предскажи'] });
  const SKY = 0xcfe6f7;
  const stage = createStage(shell.stageEl, { background: SKY, camPos: [6, 11, 24], target: [-1, 0.5, 1], minDistance: 0.3, maxDistance: 60, maxPolarAngle: Math.PI * 0.53 });
  const { scene } = stage;
  // Тесен екран: изгледите се отдръпват назад.
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const view = (pos, tgt, dur = 1, k = far) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur);
  const named = {};
  const marker = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  const put = (parent, obj, x, z, ry = 0, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; parent.add(obj); return obj; };

  // ---------- земя: плоча с яма за разкопките на Сердика ----------
  const SOIL = M(0x7a5f45, { tex: 'rock', rep: [6, 1] });
  const GRASS = MM('grass', { rep: [12, 12] });
  const PIT = { x0: -1.1, x1: 1.1, z0: 1.4, z1: 3.4 }, FRONT = 13, BACK = -15, SIDE = 15, DEPTH = 1.6;
  const slab = (x0, x1, z0, z1) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, DEPTH, z1 - z0), [SOIL, SOIL, GRASS, SOIL, SOIL, SOIL]);
    m.position.set((x0 + x1) / 2, -DEPTH / 2, (z0 + z1) / 2); scene.add(m); return m;
  };
  slab(-SIDE, SIDE, BACK, PIT.z0); slab(-SIDE, SIDE, PIT.z1, FRONT); slab(-SIDE, PIT.x0, PIT.z0, PIT.z1); slab(PIT.x1, SIDE, PIT.z0, PIT.z1);
  // Софийското поле наоколо (до Витоша).
  const plain = new THREE.Mesh(new THREE.PlaneGeometry(140, 90), MM('grass', { rep: [40, 30], color: 0xc8d8a8 }));
  plain.rotation.x = -Math.PI / 2; plain.position.set(0, -0.02, -20); scene.add(plain);
  const pitFloor = new THREE.Mesh(new THREE.BoxGeometry(PIT.x1 - PIT.x0, 0.1, PIT.z1 - PIT.z0), M(0xffffff, { tex: 'sand', rep: [2, 1] }));
  pitFloor.position.set(0, -1.17, (PIT.z0 + PIT.z1) / 2); scene.add(pitFloor);
  for (const [x, z, len, ry] of [[0, PIT.z0 + 0.06, 2.2, 0], [0, PIT.z1 - 0.06, 2.2, 0], [PIT.x0 + 0.06, (PIT.z0 + PIT.z1) / 2, 2.0, Math.PI / 2], [PIT.x1 - 0.06, (PIT.z0 + PIT.z1) / 2, 2.0, Math.PI / 2]]) {
    const w = ms(retainingWall(len, 1.16)); w.position.set(x, 0, z); w.rotation.y = ry; scene.add(w);
  }
  const lid = new THREE.Mesh(new THREE.BoxGeometry(PIT.x1 - PIT.x0, 0.1, PIT.z1 - PIT.z0), [SOIL, SOIL, GRASS, SOIL, SOIL, SOIL]);
  lid.position.set(0, -0.05, (PIT.z0 + PIT.z1) / 2); scene.add(lid);

  // Витоша на юг и облаци.
  const VIT = { x: 4, z: -25 };
  const vit = vitosha();
  vit.position.set(VIT.x, -0.02, VIT.z); scene.add(vit);
  const peakW = vit.localToWorld(vit.userData.peak.clone());
  const clouds = [[-10, 9, -16], [6, 10, -20], [16, 9.5, -12], [0, 11, -30]].map(([x, y, z]) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(1.6); scene.add(c); return c; });
  for (const [x, z, s] of [[-13, -8, 1.3], [13, -9, 1.5], [13.5, 6, 1.1], [-13.5, 10, 1.0], [-12, -13, 1.2], [12.5, -13.5, 1.3]]) { const t = pine(s); t.position.set(x, 0, z); scene.add(t); }

  // ---------- епохите ----------
  const groups = EPOCHS.map(() => { const g = new THREE.Group(); scene.add(g); return g; });
  const spans = [];
  const span = (obj, from, to, opts = {}) => { spans.push({ obj, from, to, k: 1, ...opts }); return obj; };
  groups.forEach((g, e) => span(g, e, e, { kids: true }));
  const ground = (g, x0, x1, z0, z1, m, y = 0.006) => { const p = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.012, z1 - z0), m); p.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); g.add(p); return p; };
  const cobble = (rx, rz) => MM('cobble', { rep: [rx, rz] });
  const chimneys = EPOCHS.map(() => []);
  const addSmoke = (e, obj) => { obj.updateMatrixWorld(true); if (obj.userData.chimney) chimneys[e].push(obj.localToWorld(obj.userData.chimney.clone())); };
  const people = EPOCHS.map(() => []);
  const folk = (e, obj, x, z) => { obj.position.set(x, 0, z); groups[e].add(obj); people[e].push(obj); return obj; };
  const crowd = (e, kinds, pts) => kinds.forEach((k, i) => folk(e, k, ...pts[i % pts.length]));
  const STREET_PTS = [[-0.3, 6.2], [0.4, 8.4], [-0.5, 0.2], [2.0, 2.0], [-1.8, 2.8], [0.2, 4.8]];
  // Крепостната стена (Сердика и Средец): правоъгълник с порта отпред.
  const WALL = { x0: -4.2, x1: 6.6, z0: -3.4, z1: 10.4 };
  function walls(e, make, tower) {
    const g = groups[e];
    const W = WALL, gx = 0.9;
    for (const [x, z, len, ry] of [
      [(W.x0 + W.x1) / 2, W.z0, W.x1 - W.x0, 0], [W.x0, (W.z0 + W.z1) / 2, W.z1 - W.z0, Math.PI / 2], [W.x1, (W.z0 + W.z1) / 2, W.z1 - W.z0, Math.PI / 2],
      [(W.x0 - gx) / 2, W.z1, -gx - W.x0, 0], [(W.x1 + gx) / 2, W.z1, W.x1 - gx, 0],
    ]) put(g, ms(make(len)), x, z, ry);
    for (const [x, z] of [[W.x0, W.z0], [W.x1, W.z0], [W.x0, W.z1], [W.x1, W.z1], [-gx, W.z1], [gx, W.z1], [W.x0, 3.5], [W.x1, 3.5], [1.2, W.z0]]) put(g, ms(tower()), x, z);
  }

  // Ротондата: от Сердика до днес.
  const ROT = { x: 4.6, z: 2.4 };
  const rot = ms(rotunda()); put(scene, rot, ROT.x, ROT.z, -Math.PI / 2); span(rot, 0, 4);
  // „Св. София“: от VI век до днес (извън стените на изток).
  const SS = { x: -6.4, z: -1.6 };
  const ss = ms(stSofia()); put(scene, ss, SS.x, SS.z); span(ss, 0, 4);
  const ssMin = ms(minaret({ h: 1.8 })); put(scene, ssMin, SS.x + 1.1, SS.z + 1.05); span(ssMin, 2, 2);
  // Баня баши: от XVI век; минералният извор — винаги.
  const BB = { x: 4.4, z: 7.6 };
  const bb = ms(banyaBashi()); put(scene, bb, BB.x, BB.z); span(bb, 2, 4);
  const spring = ms(fountain(), ['stream']); put(scene, spring, 2.6, 8.9, Math.PI / 2); span(spring, 2, 4);
  // „Ал. Невски“ и Народното събрание: от столицата до днес.
  const NV = { x: -8.9, z: 3.0 };
  const nv = ms(nevsky()); put(scene, nv, NV.x, NV.z); span(nv, 3, 4);
  const PA = { x: -6.6, z: 8.4 };
  const pa = ms(parliament(), ['flag']); put(scene, pa, PA.x, PA.z); span(pa, 3, 4);
  const flags = [pa.userData.flag];
  const tsar = ms(tsarMonument()); put(scene, tsar, PA.x, PA.z + 1.7, Math.PI); span(tsar, 3, 4);
  // Боянската църква в полите на Витоша (от Средновековието).
  const BOY = { x: 8.6, z: -13.2 };
  const boy = ms(tarnovoChurch({ L: 0.9, W: 0.55, H: 0.5 })); put(scene, boy, BOY.x, BOY.z, -Math.PI / 2); span(boy, 1, 4);
  for (const [x, z] of [[7.6, -13.8], [9.6, -12.6], [9.2, -14.2]]) { const t = pine(1.1); t.position.set(x, 0, z); scene.add(t); }

  // 0. Сердика.
  const runners = [];
  {
    const g = groups[0];
    const STONE_ST = M(0xffffff, { tex: 'limestone', rep: [1, 10] });
    ground(g, -0.7, 0.7, WALL.z0, FRONT, STONE_ST);
    ground(g, WALL.x0, WALL.x1, 1.8, 3.0, M(0xffffff, { tex: 'limestone', rep: [10, 1] }), 0.008);
    walls(0, (len) => crenellatedWall(len, { h: 0.75, t: 0.28, mud: false }), () => stoneTower({ s: 0.6, h: 1.1 }));
    put(g, ms(romanDomus({ w: 2.2, d: 1.8 }), ['mosaic', 'pool']), -2.4, 0.0);
    put(g, ms(romanDomus({ w: 2.0, d: 1.7 })), -2.3, 5.4);
    put(g, ms(romanDomus({ w: 1.8, d: 1.6 })), 2.2, -1.2);
    put(g, ms(romanDomus({ w: 1.8, d: 1.6 })), -2.3, 8.4);
    put(g, ms(stoaDetailed({ w: 2.6, d: 0.7, h: 0.55, cols: 11 })), 2.0, 4.4, Math.PI);
    const bt = baths(); const btm = ms(bt, ['smoke', 'pool']); put(g, btm, 3.6, 7.2, Math.PI);
    runners.push(...bt.userData.smoke);
    crowd(0, [person('citizen'), person('woman'), person('warrior'), person('citizen'), person('woman')], STREET_PTS);
    put(g, person('warrior'), -0.9, WALL.z1 + 0.4);
    put(g, person('warrior'), 0.9, WALL.z1 + 0.4);
    for (const [x, z] of [[-9, 6], [9, 10], [-10, -4], [10, -6]]) put(g, leafTree(1.2), x, z);
    // Гробища (некропол) извън стените, до бъдещата „Св. София“.
    for (const [x, z] of [[-4.9, 0.6], [-5.3, 1.3], [-4.8, 2.1]]) put(g, ms(infoStone()), x, z, 0.3);
  }
  // 1. Средец.
  {
    const g = groups[1];
    ground(g, -0.8, 0.8, WALL.z0, FRONT, cobble(2, 16));
    walls(1, (len) => stoneWall(len, { h: 0.85, t: 0.3 }), () => stoneTower({ s: 0.66, h: 1.35, roof: true }));
    for (const [x, z, ry] of [[-2.2, -1.6, Math.PI / 2], [-2.4, 0.4, Math.PI / 2], [-2.3, 5.2, Math.PI / 2], [-2.4, 7.6, Math.PI / 2], [2.0, -1.8, -Math.PI / 2], [2.2, 5.6, -Math.PI / 2], [3.4, 7.8, 0], [2.0, 0.0, -Math.PI / 2]]) addSmoke(1, put(g, ms(medievalHouse({ w: 1.0, d: 0.8 })), x, z, ry));
    for (const [x, z] of [[1.4, 3.6], [-1.4, 3.6], [1.4, 1.2]]) put(g, ms(dukyan()), x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2);
    crowd(1, [medPerson('peasant'), medPerson('woman'), medPerson('merchant'), medPerson('peasant')].map((p) => mergeStatic(p)), STREET_PTS);
    put(g, mergeStatic(medPerson('guard')), -0.9, WALL.z1 + 0.4); put(g, mergeStatic(medPerson('guard')), 0.9, WALL.z1 + 0.4);
    const sheep = ['sheep', 'sheep', 'goat'].map((k, i) => put(g, animal(k), 6 + i * 0.6, 11.4));
    sheep.forEach((a) => a.scale.setScalar(0.8));
    for (const [x, z] of [[-9, 6], [9, 11], [-10, -4], [10, -6]]) put(g, leafTree(1.2), x, z);
  }
  // 2. Османска власт.
  {
    const g = groups[2];
    ground(g, -0.8, 0.8, -3, FRONT, cobble(2, 16));
    const W = WALL;
    for (const [x, z, len, ry, s] of [[(W.x0 + W.x1) / 2 - 2, W.z0, 4, 0, 1], [W.x0, 1.5, 3, Math.PI / 2, 2], [W.x1, -1, 3, Math.PI / 2, 3], [W.x1, 5.5, 2.4, Math.PI / 2, 4]]) put(g, ms(ruinWall(len, { h: 0.5, seed: s })), x, z, ry);
    // Чаршията по главната улица.
    for (const [x, z] of [[-1.5, 0.2], [-1.5, 1.4], [-1.5, 4.6], [-1.5, 5.8], [1.5, 0.2], [1.5, 1.4], [1.5, 4.6], [1.5, 5.8], [-1.5, 8.0], [1.5, 10.6]]) put(g, ms(dukyan({ w: 1.1, d: 0.7 })), x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2);
    for (const [x, z, ry] of [[-3.0, -1.4, Math.PI / 2], [-3.0, 3.0, Math.PI / 2], [-3.0, 6.8, Math.PI / 2], [2.6, -1.6, -Math.PI / 2], [2.4, 4.6, -Math.PI / 2], [-3.2, 10.6, 0], [6.6, 11.0, 0]]) addSmoke(2, put(g, ms(mahalaHouse({ w: 1.3, d: 1.0, color: [0xf2e6c8, 0xf1ece0, 0xead8b8][Math.abs(Math.round(x * z)) % 3] })), x, z, ry));
    crowd(2, [cityPerson('turban'), cityPerson('veiled'), mergeStatic(medPerson('merchant')), cityPerson('robe'), mergeStatic(medPerson('woman')), cityPerson('turban')], STREET_PTS);
    for (const [x, z] of [[-9, 6], [9, 11], [-10, -4], [10, -6], [6.5, 2.8]]) put(g, leafTree(1.2), x, z);
  }
  // 3. Столица на България.
  const carriage = coach({ color: 0x2f3a4a });
  {
    const g = groups[3];
    ground(g, -1.0, 1.0, -3, 11.6, cobble(2, 16));
    ground(g, -SIDE + 0.5, SIDE - 0.5, 11.0, 12.2, cobble(28, 1));
    ground(g, -SIDE + 0.5, -2.0, 6.0, 7.0, cobble(12, 1));
    for (const [x, z, c, f] of [[-2.8, -1.0, 0xd9b8a0, 2], [-2.8, 2.4, 0xc9d3b0, 3], [-2.8, 5.0, 0xe6d6a8, 2], [2.8, -1.0, 0xe0d0b8, 2], [2.8, 4.6, 0xd8a890, 3], [2.6, 9.6, 0xe8c98a, 2], [-2.6, 9.6, 0xd9c4a0, 2]]) addSmoke(3, put(g, ms(europeanHouse({ w: 2.0, d: 1.2, floors: f, color: c })), x, z, Math.abs(z - 9.6) < 0.1 ? 0 : (x > 0 ? -Math.PI / 2 : Math.PI / 2)));
    for (const z of [-1.5, 1.5, 4.5, 7.5, 10.4]) for (const x of [-1.15, 1.15]) put(g, ms(streetLamp(), ['glass']), x, z);
    carriage.rotation.y = 0; carriage.scale.setScalar(0.7); g.add(carriage);
    const horse = animal('horse'); carriage.add(horse); horse.position.set(0.95, 0, 0); horse.scale.setScalar(1.15);
    crowd(3, [fp('gent'), fp('lady'), mergeStatic(worker('master')), fp('woman'), mergeStatic(worker('lady')), fp('boy')], STREET_PTS);
    for (const [x, z] of [[-9, 6], [9, 11.6], [-10, -4], [10, -6], [6.5, 2.8], [-4.4, 6.0]]) put(g, leafTree(1.2), x, z);
  }
  // 4. Днес.
  const cars = [];
  {
    const g = groups[4];
    const PAV = CM('paving', { rep: [3, 10] });
    ground(g, -2.0, 2.0, -3, PIT.z0 - 0.02, PAV); ground(g, -2.0, 2.0, PIT.z1 + 0.02, 10.9, PAV);
    ground(g, -SIDE + 0.5, SIDE - 0.5, 11.0, 12.3, M(0x4a4c50, { rough: 0.9 }));
    for (let x = -SIDE + 1; x < SIDE - 1; x += 1.2) ground(g, x, x + 0.6, 11.62, 11.68, mat(0xf2f2f2), 0.016);
    const pres = stateBuilding({ w: 4.4, d: 1.3, h: 2.0 }); const presM = ms(pres, ['flag']); put(g, presM, 2.85, 2.4, -Math.PI / 2);
    const gov = stateBuilding({ w: 4.4, d: 1.3, h: 2.0, color: 0xe2d7bf }); const govM = ms(gov, ['flag']); put(g, govM, -2.85, 2.4, Math.PI / 2);
    named.pres = presM; named.gov = govM;
    flags.push(pres.userData.flag, gov.userData.flag);
    // Дворът на ротондата зад Президентството.
    ground(g, 3.6, 5.8, 0.6, 4.2, CM('paving', { rep: [2, 3] }));
    for (const [x, z, len, ry, s] of [[5.6, 1.0, 1.0, 0, 7], [3.9, 3.9, 0.8, 0, 8], [5.7, 3.6, 0.7, Math.PI / 2, 9]]) put(g, ms(ruinWall(len, { h: 0.25, seed: s, low: 0.5 })), x, z, ry);
    // Разкопките на Сердика в ямата (стени, улица с плочи, основи на колони).
    const pitY = -1.12;
    ground(g, -0.4, 0.4, PIT.z0 + 0.12, PIT.z1 - 0.12, M(0xffffff, { tex: 'limestone', rep: [1, 3] }), pitY);
    for (const [x, z, len, ry, s] of [[-0.75, 2.4, 1.6, Math.PI / 2, 11], [0.75, 2.0, 1.2, Math.PI / 2, 12], [0.7, 3.0, 0.5, 0, 13]]) put(g, ms(ruinWall(len, { h: 0.4, t: 0.18, seed: s, low: 0.4 })), x, z, ry, pitY);
    for (const z of [1.8, 2.6]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.16, 10), M(0xece5d6, { tex: 'marble' })); b.position.set(0.25, pitY + 0.08, z); g.add(b); }
    for (const [x, z, len, ry] of [[0, PIT.z0 - 0.05, 2.3, 0], [0, PIT.z1 + 0.05, 2.3, 0], [PIT.x0 - 0.05, (PIT.z0 + PIT.z1) / 2, 2.1, Math.PI / 2], [PIT.x1 + 0.05, (PIT.z0 + PIT.z1) / 2, 2.1, Math.PI / 2]]) put(g, ms(railing(len)), x, z, ry);
    named.board = put(g, ms(infoBoard('Сердика')), -1.4, PIT.z1 + 0.4, 0);
    named.metro = put(g, ms(metroEntrance()), 1.2, 6.6, 0);
    put(g, ms(metroEntrance()), -1.2, -0.6, Math.PI);
    for (const z of [-1.5, 1.0, 4.4, 7.6, 10.4]) put(g, ms(streetLamp({ modern: true }), ['glass']), z > 4 ? 1.7 : -1.7, z);
    for (const z of [5.0, 8.6]) put(g, ms(bench()), -1.7, z, Math.PI / 2);
    for (const [x, z] of [[-9, 6], [9, 10.4], [-10, -4], [10, -6], [6.5, 6.0], [-4.4, 6.2], [-1.5, 9.8], [1.5, 9.8]]) put(g, leafTree(1.0), x, z);
    // Високи сгради далеч встрани (днешният град).
    for (const [x, z, h, c] of [[11.5, -2, 2.8, 0xd6dce2], [-12, 0.5, 3.2, 0xe4dccc], [11.5, 3.6, 2.2, 0xe8e0d0], [-11.8, -6, 2.6, 0xd8d2c4]]) put(g, ms(stateBuilding({ w: 2.6, d: 1.6, h, color: c, flagOn: false })), x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2);
    for (const [c, lane] of [[0x3a6ac0, 0], [0xc0392b, 1], [0xf2f2f2, 0], [0x2f8f5a, 1]]) { const k = car(c); k.scale.setScalar(0.28); k.userData.lane = lane; k.userData.off = cars.length * 7.5; g.add(k); cars.push(k); }
    crowd(4, [cityPerson('man'), cityPerson('woman'), cityPerson('kid'), cityPerson('tourist'), cityPerson('woman'), cityPerson('man')], [[-0.6, 6.2], [0.6, 8.4], [-0.4, 0.2], [0.6, 4.8], [-0.8, 9.6], [0.3, -1.6]]);
    for (const [x, z] of [[-0.6, 3.75], [0.5, 3.8]]) folk(4, cityPerson(x < 0 ? 'tourist' : 'kid'), x, z);
  }
  // Дим от комините.
  chimneys.forEach((pts, e) => { if (pts.length) span(smoke(stage, pts.slice(0, 8), { color: 0xd8d4cc }).group, e, e, { pop: true }); });
  people.forEach((list) => wander(stage, list, { r: 0.3, speed: 0.22 }));

  // Малък надгробен камък (некропол извън стените на Сердика).
  function infoStone() {
    const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.05), M(0xffffff, { tex: 'limestone' })); s.position.y = 0.13; g.add(s);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10, 1, false, 0, Math.PI), M(0xffffff, { tex: 'limestone' })); t.rotation.set(Math.PI / 2, 0, Math.PI / 2); t.position.y = 0.26; g.add(t);
    return g;
  }

  // ---------- кликаеми места ----------
  const ANCH = {
    center: [0, 2.0, -2.2], vitosha: [peakW.x, peakW.y + 0.6, peakW.z], rotunda: [ROT.x, 1.6, ROT.z], stsofia: [SS.x, 1.7, SS.z],
    banyabashi: [BB.x, 1.8, BB.z], nevsky: [NV.x, 3.4, NV.z], parliament: [PA.x, 1.9, PA.z],
  };
  const VIEWS = {
    center: [[1.5, 8.0, 14.5], [0, 0, 2.6]],
    vitosha: [[4.0, 7.0, 12.0], [VIT.x, 2.8, -20]],
    rotunda: [[8.4, 4.2, 6.4], [ROT.x, 0.7, ROT.z]],
    stsofia: [[-2.6, 3.8, 2.8], [SS.x, 0.6, SS.z]],
    banyabashi: [[7.4, 3.8, 13.0], [BB.x, 1.0, BB.z]],
    nevsky: [[-3.8, 5.0, 9.6], [NV.x, 1.3, NV.z]],
    parliament: [[-3.6, 3.2, 14.0], [PA.x, 0.7, PA.z]],
  };
  for (const [id, [x, y, z]] of Object.entries(ANCH)) marker(id + 'A', x, y, z);
  marker('finalA', 0, 0.3, 8.6);
  const hitZone = (id, x, y, z, w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x, y, z); m.userData.pickId = id; scene.add(m); named[id] = m; return m; };
  const zones = [
    hitZone('center', 0, 0.4, 2.4, 2.4, 0.8, 4.6),
    hitZone('vitosha', VIT.x, 3.0, VIT.z + 2, 26, 6, 8),
    hitZone('rotunda', ROT.x, 0.7, ROT.z, 1.7, 1.5, 1.7),
    hitZone('stsofia', SS.x, 0.6, SS.z, 3.0, 1.4, 2.4),
    hitZone('banyabashi', BB.x, 0.8, BB.z, 2.2, 1.6, 2.4),
    hitZone('nevsky', NV.x, 1.2, NV.z, 4.4, 2.6, 3.4),
    hitZone('parliament', PA.x, 0.7, PA.z, 3.2, 1.4, 1.8),
  ];

  // ---------- епохите се сменят ----------
  let epoch = 0;
  function setEpoch(e, { instant = false } = {}) {
    epoch = e;
    for (const s of spans) {
      const on = e >= s.from && e <= s.to;
      s.target = on ? 1 : 0;
      if (instant || s.pop) { s.k = s.target; applySpan(s); }
    }
    lid.visible = e !== 4;
    pitFloor.visible = e === 4;
    bar.sync();
  }
  function applySpan(s) {
    s.obj.visible = s.k > 0.002;
    if (s.pop) return;
    const kids = s.kids ? s.obj.children : [s.obj];
    for (const c of kids) c.scale.y = Math.max(0.002, s.k) * (c.userData.sy || 1);
  }
  let pulse = null;
  stage.tick((dt, t) => {
    for (const s of spans) {
      if (s.target === undefined || s.k === s.target) continue;
      s.k = s.target > s.k ? Math.min(1, s.k + dt * 2.2) : Math.max(0, s.k - dt * 3);
      applySpan(s);
    }
    clouds.forEach((c, i) => { c.position.x = ((c.position.x + dt * (0.15 + i * 0.05) + 24) % 48) - 24; });
    // Знамената се веят, водата тече, пара над римските бани.
    for (const f of flags) if (f) f.rotation.y = Math.sin(t * 2.1 + f.id) * 0.25;
    if (spring.userData.stream) spring.userData.stream.scale.x = 1 + Math.sin(t * 14) * 0.15;
    runners.forEach((s, i) => { const k = (t * 0.3 + i / runners.length) % 1; s.position.y = 0.35 + k * 0.7; s.material.opacity = 0.45 * (1 - k); });
    // Каретата и колите минават по улицата отпред.
    const cx = ((t * 0.5) % 30) - 15; carriage.position.set(cx, 0, 11.6); carriage.userData.roll(t * 0.5);
    for (const k of cars) { const u = ((t * 1.6 + k.userData.off) % 30) - 15; const dir = k.userData.lane ? -1 : 1; k.position.set(dir * u, 0, k.userData.lane ? 11.3 : 11.95); k.rotation.y = dir > 0 ? 0 : Math.PI; }
    if (pulse) { const k = 0.5 + 0.5 * Math.sin(t * 5); pulse.forEach((m) => m.material.emissive && m.material.emissive.setRGB(k * 0.35, k * 0.25, 0)); }
  });

  // ---------- лента с епохите (под сцената) ----------
  const bar = (() => {
    const el = document.createElement('div');
    el.className = 'pv-epochs';
    el.style.cssText = 'position:absolute;left:50%;bottom:8px;transform:translateX(-50%);z-index:6;width:min(94%,560px);box-sizing:border-box;background:rgba(255,255,255,0.95);border:1px solid #c7d3e0;border-radius:14px;padding:6px 8px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,0.15)';
    el.innerHTML = `<button class="btn pv-prev" aria-label="По-рано" style="min-width:38px;padding:6px 8px">◀</button>
      <div style="flex:1;min-width:0;text-align:center"><div class="pv-name" style="font-weight:700;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
      <input class="pv-range" type="range" min="0" max="${EPOCHS.length - 1}" step="1" value="0" aria-label="Епоха" style="width:100%;margin:2px 0 0">
      <div class="pv-hint" style="display:flex;justify-content:space-between;font-size:0.7rem;color:#667"><span>по-рано</span><span>днес</span></div></div>
      <button class="btn pv-next" aria-label="По-късно" style="min-width:38px;padding:6px 8px">▶</button>`;
    shell.stageEl.appendChild(el);
    if ((shell.stageEl.clientWidth || 600) < 480) { el.querySelector('.pv-hint').style.display = 'none'; el.style.padding = '3px 6px'; el.style.bottom = '4px'; }
    ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => el.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
    const range = el.querySelector('.pv-range');
    const go = (e) => { e = Math.max(0, Math.min(EPOCHS.length - 1, e)); if (e === epoch) { bar.sync(); return; } setEpoch(e); onEpoch && onEpoch(e); };
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
  let tip = null;
  const tags = [];
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.3, cls: 'wide', ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } tags.forEach((b) => b.remove()); tags.length = 0; };
  const scores = [];
  let clickHandler = null, stopDrag = null, phase = 1;
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const next = (label, fn) => { const c = shell.setControls(`<button class="btn primary">${label}</button>`); c.querySelector('button').addEventListener('click', () => { clearTip(); fn(); }); };
  function ask(list, onRight, onWrong) {
    const c = shell.setControls(`<div class="col">${list.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = list[+b.dataset.i];
      if (!p.ok) { onWrong(); b.disabled = true; shell.msg(p.why, 'bad'); return; }
      shell.setControls('');
      onRight();
    }));
  }

  // ---------- 1. Опознай ----------
  const seenE = new Set(), seenP = new Set();
  let place = 'center';
  const menu = cornerMenu(stage, { title: 'Места', items: PLACES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })), onSelect: (id) => { if (phase === 1) showPlace(id, true); } });
  function showPlace(id, fly) {
    place = id;
    const P = PLACES.find((p) => p.id === id);
    if (fly) { const [pos, tgt] = VIEWS[id]; view(pos, tgt, 1.1); }
    const ev = `<br><span style="color:#8a4b00">📅 ${esc(EVENTS[epoch])}</span>`;
    say(named[id + 'A'], `<b>${esc(P.label)} · ${esc(EPOCHS[epoch].label)}</b><br>${P.notes[epoch]}${id === 'center' ? ev : ''}`);
    seenP.add(id); menu.mark(id); menu.setActive(id);
    progress1();
  }
  function drawChips() {
    return `<div class="row" style="flex-wrap:wrap;gap:4px">${EPOCHS.map((E, i) => `<button class="btn pv-chip" data-e="${i}" style="padding:4px 8px;font-size:0.85rem${i === epoch ? ';outline:2px solid #2f7de1' : ''}">${seenE.has(i) ? '✓ ' : ''}${esc(E.label)}</button>`).join('')}</div>`;
  }
  function progress1() {
    if (phase !== 1) return;
    shell.score(`Епохи: ${seenE.size} от ${EPOCHS.length} · Места: ${seenP.size} от ${PLACES.length}`);
    const done = seenE.size === EPOCHS.length && seenP.size === PLACES.length;
    const c = shell.setControls(drawChips() + (done ? '<button class="btn primary go" style="margin-top:8px">Напред →</button>' : ''));
    c.querySelectorAll('.pv-chip').forEach((b) => b.addEventListener('click', () => bar.go(+b.dataset.e)));
    if (done) c.querySelector('.go').addEventListener('click', () => { clearTip(); step2(); });
  }
  function step1() {
    phase = 1;
    shell.step(0);
    scores.length = 0;
    seenE.clear(); seenP.clear();
    menu.setItems(PLACES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })));
    menu.show(true); bar.show(true);
    zones.forEach((z) => { z.visible = true; });
    if (map) map.group.visible = false;
    setEpoch(0, { instant: true });
    seenE.add(0);
    shell.task('Стоиш в центъра на София, а на юг е планината Витоша. Мести плъзгача долу и гледай как градът се сменя през вековете. Избирай места от менюто или ги кликай.');
    onEpoch = (e) => { seenE.add(e); showPlace(place, false); };
    clickHandler = (id) => { if (PLACES.some((p) => p.id === id)) showPlace(id, true); };
    showPlace('center', true);
  }

  // ---------- карта на България (стъпки 2 и 4) ----------
  const MAPX = 90;
  let map = null, regions = null, vitMark = null, roads = null;
  const mapReady = createMap(stage, { center: [25.3, 42.7], unitsPerDeg: 1.6 }).then((m) => {
    map = m;
    map.group.position.set(MAPX, 0, 0);
    for (const c of CITIES) map.addPlace(c.id, { lon: c.lon, lat: c.lat, label: c.label, color: 0x2b6cb0, labelDx: c.id === 'm-burgas' ? 0.3 : 0 });
    // Витоша на картата (показва се след въпроса).
    vitMark = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.45, 7), M(0x6f8f4a, { flat: true })); cone.position.y = 0.22; vitMark.add(cone);
    const snow = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.15, 7), M(0xb8b0a0, { flat: true })); snow.position.y = 0.38; vitMark.add(snow);
    const vl = labelSprite('Витоша', { size: 0.2 }); vl.position.set(0.15, 0.75, 0.15); vitMark.add(vl);
    vitMark.position.copy(map.pos(23.27, 42.5, 0.33)); vitMark.visible = false; map.group.add(vitMark);
    // Старите пътища от София.
    roads = new THREE.Group(); map.group.add(roads); roads.visible = false;
    const from = map.pos(23.32, 42.7, 0.4);
    for (const R of ROADS) {
      const to = map.pos(R.lon, R.lat, 0.4);
      const len = from.distanceTo(to);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 6), new THREE.MeshStandardMaterial({ color: 0xc8662a, emissive: 0x6a2a00, emissiveIntensity: 0.4 }));
      tube.position.copy(from).lerp(to, 0.5); tube.lookAt(to); tube.rotateX(Math.PI / 2);
      tube.userData.len = len; roads.add(tube);
      const l = labelSprite(R.label, { size: 0.2 }); l.position.copy(to).add(new THREE.Vector3(0, 0.45, 0)); roads.add(l);
    }
    map.group.visible = false;
    return m;
  });
  const mapView = (dur = 1.2, k = 1) => (aspect < 1 ? view([MAPX - 0.4, 11.5, 4.6], [MAPX - 0.4, 0, 0.2], dur, 1.1 * k) : view([MAPX, 7.2, 5.6], [MAPX, 0, 0.2], dur, (aspect < 1.4 ? 1.25 : 1) * k));
  const pin = (id) => map.places.get(id);

  // ---------- 2. Къде е София? ----------
  function step2() {
    phase = 2;
    shell.step(1);
    menu.show(false); bar.show(false);
    clickHandler = null; onEpoch = null;
    shell.score('');
    shell.setControls('');
    shell.task('Зареждане на картата…');
    mapReady.then(() => {
      if (phase !== 2) return;
      map.group.visible = true;
      CITIES.forEach((c) => map.colorPlace(c.id));
      mapView();
      let mistakes = 0;
      shell.task('Това е картата на България. <b>Кликни върху столицата София.</b>');
      clickHandler = (id) => {
        if (!id || !id.startsWith('m-')) return;
        const C = CITIES.find((c) => c.id === id);
        if (id !== 'm-sofia') { mistakes++; map.colorPlace(id, 0xb0b0b0); shell.msg(`Това е ${C.label}. Столицата е в западната част на България, близо до планина.`, 'bad'); return; }
        clickHandler = null;
        map.colorPlace('m-sofia', 0xf2b01e);
        shell.msg('Вярно! Това е София.', 'good');
        say(pin('m-sofia'), 'София е в западната част на България, близо до границата със Сърбия.', { lift: 0.9 });
        quiz(0);
      };
      function quiz(qi) {
        const Q = MAPQ[qi];
        shell.task(`<b>${esc(Q.q)}</b>`);
        ask(Q.opts, () => {
          shell.msg('Вярно!', 'good');
          if (qi === 0) {
            vitMark.visible = true;
            say(vitMark, 'Витоша е точно на юг от София. Тя се вижда от целия град.', { lift: 0.9 });
            quiz(1);
            return;
          }
          scores.push(stepScore(mistakes, 2));
          say(pin('m-sofia'), 'София е в Софийското поле. Около него има планини: на юг Витоша, на север Стара планина. През полето тече река Искър.', { cls: 'good wide', lift: 0.9 });
          next('Напред →', step3);
        }, () => { mistakes++; });
      }
    });
  }

  // ---------- 3. Свържи паметника с епохата ----------
  const BOARD = { x: 0, z: 60 };
  const narrow = aspect < 1;
  const slotXZ = (i) => (narrow ? [BOARD.x + (i < 3 ? i - 1 : i - 3.5) * 2.55, BOARD.z - 1.6 + (i < 3 ? 0 : 3.0)] : [BOARD.x + (i - 2) * 2.6, BOARD.z]);
  const boardGround = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 16), MM('grass', { rep: [6, 5] }));
  boardGround.position.set(BOARD.x, -0.2, BOARD.z + 2); scene.add(boardGround);
  const slots = EPOCHS.map((E, i) => {
    const [x, z] = slotXZ(i);
    const s = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 2.8), mat(0xfff4d6));
    s.position.set(x, 0.03, z);
    s.userData = { dropId: 's' + i, i, n: 0 };
    scene.add(s);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.04, 2.9), mat(0x7a5634)); rim.position.set(x, 0.01, z); scene.add(rim);
    const l = labelSprite(`${i + 1}. ${E.label}`, { size: 0.24 }); l.position.set(x, 0.35, z - 1.62); scene.add(l);
    return s;
  });
  if (!narrow) { const arrow = labelSprite('по-рано  →  →  →  по-късно', { size: 0.26 }); arrow.position.set(BOARD.x, 0.3, BOARD.z - 2.4); scene.add(arrow); }
  function miniFor(id) {
    const g = new THREE.Group();
    const add = (o, x, z, s, ry = 0) => { o.scale.multiplyScalar(s); o.position.set(x, 0.06, z); o.rotation.y = ry; g.add(o); return o; };
    if (id === 'c-rotunda') add(ms(rotunda()), 0, 0, 0.62, -Math.PI / 2);
    if (id === 'c-stsofia') add(ms(stSofia()), 0, 0, 0.34);
    if (id === 'c-boyana') add(ms(tarnovoChurch({ L: 0.9, W: 0.55, H: 0.5 })), 0, 0, 0.7);
    if (id === 'c-banyabashi') add(ms(banyaBashi()), -0.1, -0.05, 0.3);
    if (id === 'c-nevsky') add(ms(nevsky()), -0.05, 0, 0.21);
    if (id === 'c-parliament') add(ms(parliament(), ['flag']), 0, -0.05, 0.3);
    if (id === 'c-metro') {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.02, 0.9), CM('paving', { rep: [2, 1] })); p.position.y = 0.07; g.add(p);
      add(ms(metroEntrance()), -0.15, 0.3, 0.75);
      add(cityPerson('kid'), 0.3, 0.2, 0.7);
    }
    return g;
  }
  const cards = CARDS.map((C) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 1.1), mat(0xf6efdc)); base.position.y = 0.03; g.add(base);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.04, 1.16), mat(0x7a5634)); rim.position.y = 0.01; g.add(rim);
    g.add(miniFor(C.id));
    const l = labelSprite(C.label, { size: 0.2 }); l.position.set(0, 0.95, 0.3); g.add(l);
    g.userData = { dragId: C.id, e: C.e };
    addHitBox(g, 0.6);
    g.visible = false;
    scene.add(g);
    return g;
  });
  const cardHome = (g) => {
    const k = CARD_ORDER.indexOf(CARDS.findIndex((C) => C.id === g.userData.dragId));
    return narrow ? new THREE.Vector3(BOARD.x + ((k < 4 ? k : k - 4) - (k < 4 ? 1.5 : 1)) * 1.6, 0.1, BOARD.z + 4.2 + (k < 4 ? 0 : 1.55))
      : new THREE.Vector3(BOARD.x + (k - 3) * 1.75, 0.1, BOARD.z + 3.0 + (k % 2) * 1.3);
  };
  function step3() {
    phase = 3;
    shell.step(2);
    bar.show(false); menu.show(false);
    if (map) map.group.visible = false;
    clickHandler = null; onEpoch = null;
    if (narrow) view([BOARD.x, 13.5, BOARD.z + 7.4], [BOARD.x, 0, BOARD.z + 2.0], 1.2, 1); else view([BOARD.x, 8.4, BOARD.z + 11.0], [BOARD.x, 0, BOARD.z + 1.2], 1.2, aspect < 1.4 ? 1.5 / Math.max(aspect, 0.5) : 1);
    slots.forEach((s) => { s.userData.n = 0; s.material.color.setHex(0xfff4d6); });
    for (const g of cards) { g.visible = true; g.userData.locked = false; g.position.copy(cardHome(g)); g.userData.home = g.position.clone(); }
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Кога е построен всеки паметник? Завлечи всяка карта в <b>епохата, в която е построен</b>. В една епоха може да има две карти.');
    shell.setControls('');
    shell.score(`Свързани: 0 от ${cards.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.1,
      onDrop(obj) {
        let best = null, bd = 1.7;
        for (const s of slots) { const d = Math.hypot(obj.position.x - s.position.x, obj.position.z - s.position.z); if (d < bd) { bd = d; best = s; } }
        if (!best) { obj.position.copy(obj.userData.home); return; }
        const e = obj.userData.e;
        const C = CARDS.find((c) => c.id === obj.userData.dragId);
        if (best.userData.i === e) {
          obj.userData.locked = true;
          obj.position.set(best.position.x, 0.1, best.position.z + (best.userData.n ? 0.65 : -0.6));
          best.userData.n++;
          placed++;
          shell.score(`Свързани: ${placed} от ${cards.length}`);
          shell.msg(`Вярно: ${C.label} — ${EPOCHS[e].label}.`, 'good');
          if (placed === cards.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 3));
            say(slots[2], 'Всяка епоха оставя в София свои паметници. Затова градът е като книга с много страници.', { cls: 'good wide', lift: 1.4 });
            next('Напред →', step4);
          }
        } else {
          mistakes++;
          const id = obj.userData.dragId;
          tries[id] = (tries[id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(tries[id] >= 2 ? `Подсказка: ${C.label} е от епохата „${EPOCHS[e].label}“.` : (best.userData.i < e ? 'Тогава този паметник още го няма. Опитай в по-късна епоха.' : 'Този паметник е построен по-рано. Опитай в по-ранна епоха.'), 'bad');
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
    shell.score('');
    let mistakes = 0;
    map.group.visible = true;
    vitMark.visible = true;
    CITIES.forEach((c) => map.colorPlace(c.id));
    map.colorPlace('m-sofia', 0xf2b01e);
    mapView(1.2, 1.15);
    const regReady = regions ? Promise.resolve(regions) : createRegions(stage, map, { ids: ['knyaz', 'rumelia', 'macedonia', 'south', 'strum'], y: 0.26 }).then((r) => { regions = r; regions.group.position.copy(map.group.position); return r; });
    regReady.then(() => {
      if (phase !== 4) return;
      regions.paint({ knyaz: COL.bg, rumelia: COL.auto, macedonia: COL.otto, south: COL.otto, strum: COL.otto }, { labels: ['knyaz', 'rumelia', 'macedonia'] });
      regions.group.visible = true;
      shell.task('1879 г. Учредителното събрание в Търново избира столица на новата българска държава. Цветните области са земите, в които живеят много българи. <b>Защо според теб е избрана София?</b>');
      ask(PREDICT1, () => {
        shell.msg('Вярно предсказание!', 'good');
        roads.visible = true;
        roads.children.forEach((o) => { if (o.userData.len) { o.scale.y = 0.01; } });
        grow = 0;
        say(pin('m-sofia'), '<b>Така е.</b> Марин Дринов предлага София: тя е в средата на земите, където живеят българи. В нея се срещат стари пътища — към Белград, към Истанбул, към Солун и към Дунав. Помагат и Витоша, реките и минералната вода.', { cls: 'good wide', lift: 0.9 });
        setTimeout(() => {
          if (phase !== 4) return;
          shell.task('Днес София е столица на Република България. <b>Какво я прави център на държавата?</b>');
          ask(PREDICT2, () => {
            shell.msg('Вярно предсказание!', 'good');
            map.group.visible = false; regions.dispose(); regions = null;
            setEpoch(4, { instant: true });
            view([1.0, 7.5, 13.5], [-2.2, 0.8, 4.2], 1.3);
            for (const [obj, text, lift] of [[named.pres, 'Президентството', 2.4], [named.gov, 'Министерският съвет', 2.4], [pa, 'Народното събрание', 1.6]]) tags.push(stage.bubble(obj, text, { cls: 'tag', lift }));
            pulse = [named.pres, named.gov, pa].flatMap((o) => o.children.filter((m) => m.isMesh && !Array.isArray(m.material)).slice(0, 4)).map((m) => { m.material = m.material.clone(); return m; });
            say(named.finalA, '<b>Така е.</b> Народното събрание приема законите. Министерският съвет управлява страната. Президентът е държавният глава. В София са и министерствата, посолствата на другите държави, университети и музеи.', { cls: 'good wide', lift: 1.4 });
            next('Виж резултата', () => {
              scores.push(stepScore(mistakes, 2));
              shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart);
            });
          }, () => { mistakes++; });
        }, 1800);
      }, () => { mistakes++; });
    });
  }
  let grow = 1;
  stage.tick((dt) => {
    if (grow >= 1 || !roads) return;
    grow = Math.min(1, grow + dt * 0.8);
    roads.children.forEach((o) => { if (o.userData.len) o.scale.y = Math.max(0.01, grow); });
  });

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    for (const g of cards) { g.visible = false; g.userData.locked = false; }
    if (pulse) { pulse.forEach((m) => m.material.emissive && m.material.emissive.setRGB(0, 0, 0)); pulse = null; }
    if (map) { map.group.visible = false; vitMark.visible = false; roads.visible = false; CITIES.forEach((c) => map.colorPlace(c.id)); }
    if (regions) { regions.dispose(); regions = null; }
    view([6, 11, 24], [-1, 0.5, 1], 0.8);
    step1();
  }

  step1();
  container.__demo = { stage, scene, setEpoch: (e) => bar.go(e), get epoch() { return epoch; }, select: (id) => showPlace(id, true), get mapReady() { return !!map; } };
  return { dispose() { if (stopDrag) stopDrag(); menu.remove(); bar.el.remove(); if (map) map.dispose(); if (regions) regions.dispose(); stage.dispose(); } };
}
