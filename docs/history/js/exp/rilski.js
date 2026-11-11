// 6.3.5 „Манастирите и православието“ — разходка в Рилския манастир през XV–XVII в. (обобщена възстановка).
// Стъпки: разходка по спирките → опит: книжовниците преписват книга (колко време отнема)
// → приложи: дейности на манастира и ролята им за българите; светец-мъченик
// → предскажи: какво става след пренасянето на мощите през 1469 г. и какво е запазено до днес.
// ВРЕМЕТО: сцената показва манастира, както може да е изглеждал тогава. Хрельовата кула (XIV в.) е запазена;
// днешната голяма църква и крилата с арките са от XIX в. — показват се само в края, с ясен надпис.
import { createStage, labelSprite, mat, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createWalk } from './hist/stopwalk.js';
import { M } from './hist/architecture.js';
import { animal, graze } from './hist/thrace.js';
import { smoke, cloud } from './hist/bulgar.js';
import { wander } from './hist/antiquity.js';
import { tarnovoChurch, packHorse } from './hist/medieval.js';
import { RM, humpBridge, fountain, pine, leafTree, forestHill, folkPerson, mergeStatic } from './hist/revival.js';
import { monasteryWing, monasteryGate, defenseTower, bigChurch, monasteryKitchen, scriptorium, klepalo, reliquary, peak } from './hist/monastery.js';

const ms = (obj, keys = []) => mergeStatic(obj, keys.flatMap((k) => [].concat(obj.userData[k] ?? [])));
const fp = (kind, opts = {}, arms = false) => { const p = folkPerson(kind, opts); return mergeStatic(p, arms ? p.userData.arms : []); };

const KEPT = '<span class="small">Запазено до днес.</span>';
const REC = '<span class="small">Обобщена възстановка.</span>';
const STOPS = [
  { id: 'mountain', label: 'Планината Рила', icon: '⛰️', at: [7, 21], look: [0, 1.6, -1], eyeY: 5.0, anchor: 'mountainA',
    note: `Рилският манастир е високо в планината Рила, в долината на Рилската река, далеч от градовете и големите пътища. Води началото си от X век, от отшелника св. Иван Рилски, който живее в тази планина. <span class="small">Планината е истинска. Сградите са обобщена възстановка на манастира през XV–XVII век.</span>` },
  { id: 'gate', label: 'Стените и портата', icon: '🚪', at: [0, 8.8], look: [0, 1.1, 6], eyeY: 1.15, anchor: 'gateA',
    note: `Отвън манастирът прилича на крепост: дебели каменни стени с малки прозорци и тежка порта, която вечер се затваря. Така монасите пазят себе си, книгите и църковните съкровища. ${REC} <span class="small">Днешните стени и порти са от XIX век.</span>` },
  { id: 'yard', label: 'Дворът и клепалото', icon: '🔔', at: [-0.9, 5.0], look: [-3.9, 0.8, 2.5], eyeY: 1.3, anchor: 'klepaloA',
    note: `В двора тече животът на манастира. Монахът удря клепалото — дървена дъска, по която се бие с чукче, за да събере братята за молитва. Монасите се молят, работят и посрещат гости. ${REC}` },
  { id: 'church', label: 'Църквата', icon: '⛪', at: [0.9, 5.0], look: [-0.9, 1.3, 0.4], eyeY: 1.4, anchor: 'churchA',
    note: `В средата на двора е църквата. Тук монасите служат всеки ден, а на празник идват и хора от околните села. Службата и книгите са на църковнославянски език. <span class="small">Старата църква не е запазена: през XIX век на нейно място е построена днешната, много по-голяма църква. Тази е обобщена възстановка в стила на средновековните български църкви.</span>` },
  { id: 'tower', label: 'Хрельовата кула', icon: '🏰', at: [5.0, 3.3], look: [2.6, 2.4, -0.2], eyeY: 1.2, anchor: 'towerA',
    note: `Хрельовата кула е построена през 1334–1335 г. от местния владетел Хрельо. Тя е най-старата запазена сграда в манастира. При опасност монасите се укриват в нея, а на най-горния етаж има малък параклис. ${KEPT} <span class="small">Малката камбанария на върха ѝ е добавена по-късно, през XIX век, затова тук я няма.</span>` },
  { id: 'cells', label: 'Килиите на монасите', icon: '🛏️', at: [3.8, -1.1], look: [0.6, 1.0, -5.0], eyeY: 1.5, anchor: 'cellsA',
    note: `Монасите живеят в килии — малки стаи с врата към дървения чардак. Те се молят, учат и работят в гората, в градината и в работилниците. Манастирът се грижи сам за себе си. ${REC} <span class="small">Днешните крила с арките са от XIX век.</span>` },
  { id: 'kitchen', label: 'Кухнята', icon: '🍲', at: [-2.2, -1.6], look: [-3.7, 0.6, -3.9], eyeY: 1.0, anchor: 'kitchenA',
    note: `В кухнята се готви в големи котли за всички монаси и за гостите. Монасите се хранят заедно в трапезарията, а един от тях чете на глас. ${REC} <span class="small">Днешната голяма кухня с висок комин е от XIX век.</span>` },
  { id: 'library', label: 'Книжовниците', icon: '📜', at: [-4.2, 0.9], look: [-6.4, 0.55, 0.9], eyeY: 1.0, anchor: 'libraryA',
    note: `Тук книжовниците преписват на ръка богослужебни книги и жития на светци — с перо и мастило. Пазят и старите книги. През XV век в Рилския манастир работи книжовникът Владислав Граматик. В манастирите учат и деца да четат. ${REC}` },
  { id: 'pilgrims', label: 'Поклонниците', icon: '🚶', at: [0.4, 2.6], look: [2.6, 0.45, 4.4], eyeY: 1.1, anchor: 'pilgrimsA',
    note: `Поклонници идват от различни краища на българските земи — пеша или с коне. Тук те се молят, носят дарове и разказват новини. Така хора от далечни места се чувстват част от един народ с една вяра. <span class="small">Хората и дрехите са обобщена възстановка.</span>` },
];
// Опитът: колко дни отнема преписването на една книга. Числата са илюстрация.
const PAGES = 400, PER_DAY = 4;
const daysFor = (n) => Math.ceil(PAGES / (PER_DAY * n));
// Стъпка 3: дейности → роля на манастира.
const ROLES = {
  faith: { label: 'Пази вярата', at: [-0.9, 2.7], why: 'Това е част от молитвата и службата — то пази вярата.' },
  books: { label: 'Пази книгите и знанието', at: [-4.3, 0.9], why: 'Това пази книжнината и грамотността.' },
  people: { label: 'Сплотява българите', at: [3.6, 2.6], why: 'Тук се срещат хора от различни краища — това ги сплотява.' },
};
const CARDS = [
  { id: 'c-liturgy', label: 'Служба в църквата', to: 'faith' },
  { id: 'c-icon', label: 'Иконописец рисува икона', to: 'faith' },
  { id: 'c-copy', label: 'Книжовник преписва книга', to: 'books' },
  { id: 'c-kids', label: 'Монах учи деца да четат', to: 'books' },
  { id: 'c-sabor', label: 'Събор: хора от много краища', to: 'people' },
  { id: 'c-gifts', label: 'Дарове от много села', to: 'people' },
];
const MARTYR = [
  { t: 'Св. Николай Софийски (XVI век)', ok: true },
  { t: 'Св. Иван Рилски (X век)', ok: false, why: 'Св. Иван Рилски живее през X век, много преди османската власт. Той е отшелник, а не мъченик.' },
  { t: 'Св. Климент Охридски (IX–X век)', ok: false, why: 'Св. Климент Охридски е книжовник и учител от IX–X век, ученик на Кирил и Методий.' },
];
const PREDICT1 = [
  { t: 'Манастирът става още по-почитан: идват поклонници от всички български земи.', ok: true },
  { t: 'Манастирът опустява и е забравен.', ok: false, why: 'Обратното — мощите на светеца привличат още повече хора.' },
  { t: 'Манастирът става крепост на султана.', ok: false, why: 'Манастирът остава християнско място — дом на монасите и на книгите.' },
];
const PREDICT2 = [
  { t: 'Хрельовата кула', ok: true },
  { t: 'Всички сгради — точно както са били тогава', ok: false, why: 'Сградите не остават същите векове наред: ремонтират се, горят, строят се наново.' },
  { t: 'Нито една', ok: false, why: 'Една сграда е оцеляла — най-старата и най-здравата, каменната.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Разходка в Рилския манастир', 'Книжовниците', 'Какво дава манастирът на българите?', 'Предскажи'] });
  const SKY = 0xcfe3f2;
  const stage = createStage(shell.stageEl, { background: SKY, camPos: [6, 9, 22], target: [0, 1, 0], minDistance: 0.3, maxDistance: 45, maxPolarAngle: Math.PI * 0.49, fog: { color: SKY, near: 40, far: 110 } });
  const { scene } = stage;
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const view = (pos, tgt, dur = 1, k = far) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur);
  const named = {};
  const marker = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  const add = (obj, x, z, ry = 0, parent = scene) => { obj.position.set(x, obj.position.y, z); obj.rotation.y = ry; parent.add(obj); obj.updateMatrixWorld(true); return obj; };

  // Знак в ъгъла: какво показва сцената.
  const host = stage.renderer.domElement.parentElement;
  const badge = document.createElement('div');
  badge.className = 'map-approx';
  Object.assign(badge.style, { position: 'absolute', left: '8px', bottom: '8px', zIndex: 3, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.9)', border: '1px solid #c7d3e0', fontSize: '12px', fontWeight: 600, lineHeight: 1.3, color: '#3a2a14', pointerEvents: 'none', maxWidth: '60%' });
  host.appendChild(badge);
  // Докато долу има стрелки за разходката, знакът е над тях.
  const badgeUp = (on) => { badge.style.bottom = on ? '62px' : '8px'; };
  const setBadge = (today) => { badge.textContent = today ? 'Днешният вид: сградите са от XIX век, кулата — от XIV век' : 'Обобщена възстановка: манастирът през XV–XVII век'; };
  setBadge(false);

  // ---------- земя, река, път ----------
  const ground = new THREE.Mesh(new THREE.BoxGeometry(140, 0.1, 140), RM('grass', { rep: [50, 50] }));
  ground.position.y = -0.06; scene.add(ground);
  const yardFloor = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.02, 11.6), RM('cobble', { rep: [10, 9] }));
  yardFloor.position.set(0, 0.006, 0.4); scene.add(yardFloor);
  const RZ = 11;
  const water = new THREE.Mesh(new THREE.BoxGeometry(140, 0.02, 1.4), RM('water', { rep: [60, 1], rough: 0.25 }));
  water.position.set(0, -0.005, RZ); scene.add(water);
  const waterTex = water.material.map;
  for (const s of [-1, 1]) { const bank = new THREE.Mesh(new THREE.BoxGeometry(140, 0.14, 0.24), M(0xffffff, { tex: 'stone', rep: [60, 1] })); bank.position.set(0, 0.05, RZ + s * 0.8); scene.add(bank); }
  // Камъни в реката.
  for (const [x, s] of [[-6, 0.25], [-3.2, 0.18], [4.5, 0.22], [8, 0.3], [-11, 0.2]]) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), M(0x9a9488, { flat: true })); st.position.set(x, 0.02, RZ + (x % 2) * 0.2); scene.add(st); }
  add(mergeStatic(humpBridge({ span: 1.8 })), 0, RZ);
  const path = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 3.6), RM('cobble', { rep: [1, 3] })); path.position.set(0, 0.006, 8.6); scene.add(path);
  const path2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.02, 12), RM('cobble', { rep: [1, 10] })); path2.position.set(0, 0.006, 18); scene.add(path2);

  // ---------- манастирът тогава ----------
  const oldG = new THREE.Group(); scene.add(oldG);
  const chimneys = [];
  const wing = (opts, x, z, ry, parent) => {
    const w = add(ms(monasteryWing(opts)), x, z, ry, parent);
    for (const c of w.userData.chimneys) chimneys.push(w.localToWorld(c.clone()));
    return w;
  };
  wing({ len: 14.2, ends: [true, true] }, 0, -5.6, 0, oldG);
  wing({ len: 6.35 }, -3.925, 6.0, Math.PI, oldG);
  wing({ len: 6.35 }, 3.925, 6.0, Math.PI, oldG);
  wing({ len: 4.3 }, -6.4, -2.75, Math.PI / 2, oldG);
  wing({ len: 2.9 }, -6.4, 3.85, Math.PI / 2, oldG);
  wing({ len: 10.2 }, 6.4, 0.2, -Math.PI / 2, oldG);
  const gate = add(ms(monasteryGate(), ['leaves']), 0, 6.0, 0, oldG);
  named.gateA = marker('gateA', 0, 1.6, 6.6);
  void gate;
  // Старата църква.
  const church = tarnovoChurch({ L: 1.3, W: 0.8, H: 0.75, bell: false });
  church.scale.setScalar(2.2);
  add(ms(church), -0.9, 0.4, 0, oldG);
  named.churchA = marker('churchA', -0.9, 2.2, 0.4);
  // Кухнята.
  const kitchen = add(ms(monasteryKitchen(), ['flames']), -3.7, -3.75, 0, oldG);
  named.kitchenA = marker('kitchenA', -3.7, 1.1, -3.5);
  chimneys.unshift(kitchen.localToWorld(kitchen.userData.smokeAt.clone()));
  // Стаята на книжовниците (в западното крило).
  const scr = add(ms(scriptorium(), ['flames', 'piles', 'lamp']), -6.4, 0.9, Math.PI / 2, oldG);
  named.libraryA = marker('libraryA', -6.0, 1.1, 0.9);
  const SU = scr.userData;
  // Клепало пред църквата.
  const kl = add(ms(klepalo(), ['board']), -3.9, 2.7, 0.5, oldG);
  named.klepaloA = marker('klepaloA', -3.9, 1.2, 2.7);
  // Чешма в двора.
  const fnt = add(ms(fountain(), ['stream']), 4.7, -3.6, 0);

  // ---------- Хрельовата кула (остава и днес) ----------
  const TX = 2.6, TZ = -0.2;
  const tower = add(ms(defenseTower()), TX, TZ, 0);
  named.towerA = marker('towerA', TX, 3.2, TZ);
  void tower;

  // ---------- днешният вид (XIX в.) — скрит до края ----------
  const todayG = new THREE.Group(); todayG.visible = false; scene.add(todayG);
  const tw = (opts, x, z, ry) => add(ms(monasteryWing({ ...opts, today: true })), x, z, ry, todayG);
  tw({ len: 14.2, ends: [true, true] }, 0, -5.6, 0);
  tw({ len: 6.35 }, -3.925, 6.0, Math.PI);
  tw({ len: 6.35 }, 3.925, 6.0, Math.PI);
  tw({ len: 10.2 }, -6.4, 0.2, Math.PI / 2);
  tw({ len: 10.2 }, 6.4, 0.2, -Math.PI / 2);
  add(ms(monasteryGate({ today: true, h: 2.96 }), ['leaves']), 0, 6.0, 0, todayG);
  add(ms(bigChurch()), -1.05, 0.4, 0, todayG);

  // ---------- планината ----------
  [[0, -34, 15, 17, 1, true], [-24, -26, 12, 13, 2, true], [24, -27, 13, 14, 3, true], [-36, 2, 11, 10, 4, true], [36, 4, 11, 11, 5, true], [-24, 34, 11, 8, 6, false], [22, 36, 11, 7, 7, false], [-44, -14, 10, 12, 8, true], [44, -12, 10, 12, 9, true]].forEach(([x, z, r, h, seed, snow]) => {
    const p = peak({ r, h, seed, snow }); p.position.set(x, -0.05, z); scene.add(p);
  });
  [[-15, -12, 5, 4, 2.4, 18], [15, -12, 5, 4, 2.4, 18], [-15, 9, 5, 4, 2.0, 14], [15, 9, 5, 4, 2.2, 14], [0, -14, 6, 3, 2.0, 16]].forEach(([x, z, rx, rz, h, n], i) => {
    const hl = ms(forestHill({ rx, rz, h, trees: n, seed: i + 3 })); hl.position.set(x, -0.05, z); scene.add(hl);
  });
  for (const [x, z, k] of [[-9, 8, 'p'], [-5, 8.6, 'p'], [5, 8.4, 'p'], [9.5, 7.8, 'p'], [-9.5, 3, 'p'], [9.6, 2, 'p'], [-9.4, -4, 'p'], [9.5, -5, 'l'], [-4, -8.4, 'p'], [4.5, -8.2, 'p'], [-11, 14, 'p'], [11, 14, 'p'], [-4, 14.5, 'l'], [4, 15, 'p'], [8, 17, 'p'], [-7, 18, 'p']]) {
    const t = k === 'p' ? pine(1.6) : leafTree(1.5); t.position.set(x, 0, z); scene.add(t);
  }
  named.mountainA = marker('mountainA', 0, 4.5, -3);
  named.skyA = marker('skyA', 0, 5.8, -7);
  const clouds = [[-8, 13, -18], [9, 14, -22], [0, 15, -28], [-16, 12, -8]].map(([x, y, z]) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(1.6); scene.add(c); return c; });

  // ---------- хора и животни ----------
  const oldOnly = [];
  const monks = [];
  [[1.4, 2.0], [-2.2, 3.4], [-4.6, -1.2], [4.7, 1.4]].forEach(([x, z]) => { const m = fp('priest'); m.position.set(x, 0, z); scene.add(m); monks.push(m); });
  wander(stage, monks, { r: 0.45, speed: 0.18 });
  const ringer = fp('priest', {}, true); ringer.position.set(-3.5, 0, 2.95); ringer.rotation.y = -2.0; scene.add(ringer);
  // Монаси на чардака на северното крило.
  const galleryMonks = [-2.4, 3.2].map((x) => { const m = fp('priest'); m.position.set(x, 0.92, -5.1); scene.add(m); oldOnly.push(m); return m; });
  named.cellsA = marker('cellsA', 1.2, 1.4, -5.0);
  // Готвач в кухнята.
  const cook = fp('priest', {}, true); cook.position.copy(kitchen.localToWorld(new THREE.Vector3(0.12, 0.04, -0.2))); cook.rotation.y = -Math.PI / 2 - 0.3; scene.add(cook); oldOnly.push(cook);
  // Книжовници: до четирима (в опита детето избира колко).
  const scribes = SU.seats.map((s) => {
    const m = fp('priest', {}, true);
    m.position.copy(scr.localToWorld(s.clone())); m.rotation.y = Math.PI / 2; m.scale.y *= 0.88;
    scene.add(m); oldOnly.push(m); return m;
  });
  const setScribes = (n) => scribes.forEach((m, i) => { m.visible = i < n; SU.desks[i].visible = true; });
  setScribes(2);
  // Поклонници в двора и по пътя.
  const pilgrims = [];
  [[2.2, 4.2, 'man'], [2.8, 4.6, 'woman'], [3.2, 4.0, 'girl'], [1.6, 4.8, 'shepherd'], [3.6, 3.4, 'woman']].forEach(([x, z, k]) => {
    const p = fp(k); p.position.set(x, 0, z); scene.add(p); pilgrims.push(p);
  });
  wander(stage, pilgrims, { r: 0.25, speed: 0.15 });
  named.pilgrimsA = marker('pilgrimsA', 2.6, 1.0, 4.3);
  // Път към манастира: поклонник с товарен кон.
  const traveller = fp('man'); scene.add(traveller);
  const horse = packHorse(); horse.scale.setScalar(0.9); scene.add(horse);
  const flock = [];
  for (let i = 0; i < 6; i++) { const a = animal(i === 5 ? 'goat' : 'sheep'); a.scale.setScalar(0.85); a.position.set(-10 + (i % 3) * 0.6, 0, 13.4 + Math.floor(i / 3) * 0.5); scene.add(a); flock.push(a); }
  graze(stage, flock, { r: 0.4, speed: 0.15 });

  // ---------- живот ----------
  const smk = smoke(stage, chimneys.slice(0, 5));
  stage.tick((dt, t) => {
    waterTex.offset.x -= dt * 0.06;
    fnt.userData.stream.scale.x = 1 + Math.sin(t * 20) * 0.2;
    // Клепалото: монахът удря ритмично, дъската се люлее.
    const hit = Math.max(0, Math.sin(t * 4));
    ringer.userData.arms[1].rotation.x = -0.9 + hit * 0.7;
    kl.userData.board.rotation.x = Math.sin(t * 4 - 0.6) * 0.06;
    kitchen.userData.flames.forEach((f, i) => { f.scale.y = 0.8 + Math.abs(Math.sin(t * 9 + i * 2)) * 0.5; });
    cook.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 2) * 0.3;
    SU.flames.forEach((f, i) => { f.scale.y = 0.85 + Math.sin(t * 11 + i) * 0.15; });
    SU.lamp.material.emissiveIntensity = 0.8 + Math.sin(t * 7) * 0.2;
    scribes.forEach((m, i) => { m.userData.arms[1].rotation.x = -0.8 + Math.sin(t * 6 + i * 1.3) * 0.12; });
    galleryMonks[1].position.x = 3.2 + Math.sin(t * 0.25) * 2.2;
    galleryMonks[1].rotation.y = Math.cos(t * 0.25) > 0 ? Math.PI / 2 : -Math.PI / 2;
    // Пътникът и конят вървят от моста към портата и обратно.
    const k = (t * 0.05) % 2, u = k < 1 ? k : 2 - k;
    const z = 16 - u * 8.5;
    traveller.position.set(0.25, Math.abs(Math.sin(t * 6)) * 0.02, z);
    traveller.rotation.y = k < 1 ? Math.PI : 0;
    horse.position.set(-0.25, 0, z + (k < 1 ? 0.7 : -0.7));
    horse.rotation.y = k < 1 ? Math.PI / 2 : -Math.PI / 2;
    horse.userData.legs.forEach((l, j) => { l.rotation.z = Math.sin(t * 5 + j * Math.PI / 2) * 0.35; });
    clouds.forEach((c, i) => { c.position.x = ((c.userData.x0 ??= c.position.x) + t * (0.15 + i * 0.03) + 40) % 80 - 40; });
  });

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.3, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let stopDrag = null, phase = 1, running = null;
  const extra = [];

  // ---------- 1. Разходка ----------
  const seen = new Set();
  const walk = createWalk(stage, {
    stops: STOPS,
    eye: 1.1,
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
    walk.showNav(true); badgeUp(true);
    shell.task('Разходи се из Рилския манастир през XV–XVII век. Върви със стрелките долу или избирай спирка от менюто. На всяка спирка се огледай.');
    shell.setControls('');
    shell.score('');
    walk.go('mountain');
  }

  // ---------- 2. Книжовниците: колко време отнема една книга? ----------
  const LIB_VIEW = [[-3.3, 1.35, 0.9], [-6.3, 0.45, 0.9]];
  function resetPiles() { SU.piles.forEach((p) => { p.scale.y = 0.01; p.position.y = p.userData.base; }); }
  function step2() {
    phase = 2;
    shell.step(1);
    shell.score('');
    walk.showNav(false); badgeUp(false);
    view(...LIB_VIEW, 1, Math.min(far, 1.1));
    setScribes(1);
    resetPiles();
    let mistakes = 0, n = 1;
    const tried = new Set();
    shell.task(`Монасите искат нова книга — Евангелие от около ${PAGES} страници. Един книжовник преписва около ${PER_DAY} страници на ден. <b>Колко време ще му трябва?</b> Първо предположи.`);
    say(named.libraryA, `<b>Преписване на ръка</b><br>Всяка буква се пише с перо и мастило. Инициалите се рисуват с червено. <span class="small">Числата в опита са илюстрация.</span>`, { cls: 'wide', lift: 0.4 });
    const c = shell.setControls(`<div class="col">
      <button class="btn" data-g="week">Около седмица</button>
      <button class="btn" data-g="months">Повече от три месеца</button>
      <button class="btn" data-g="years">Около десет години</button></div>`);
    let guess = null;
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { guess = b.dataset.g; lab(); }));

    function lab() {
      clearTip();
      shell.task('Провери. Избери колко книжовници работят и пусни преписването. Опитай поне с един и с повече книжовници.');
      const cc = shell.setControls(`<label class="small">Книжовници: <b class="sn">${n}</b></label>
        <input class="s-range" type="range" min="1" max="4" step="1" value="${n}" style="width:100%">
        <div class="row"><button class="btn primary run">▶ Преписвай</button></div>`);
      const rg = cc.querySelector('.s-range');
      rg.addEventListener('input', () => { if (running) return; n = +rg.value; cc.querySelector('.sn').textContent = n; setScribes(n); resetPiles(); clearTip(); });
      cc.querySelector('.run').addEventListener('click', () => { if (running) return; copyBook(n, () => { tried.add(n); if (tried.has(1) && tried.size >= 2) ask(); }); });
    }
    function copyBook(nn, done) {
      clearTip();
      resetPiles();
      const days = daysFor(nn);
      const DUR = Math.max(1.2, days * 0.04);
      let t0 = null;
      const meter = stage.bubble(named.libraryA, '', { cls: 'tag', lift: 0.5 });
      running = stage.tick((dt, t) => {
        if (t0 === null) t0 = t;
        const k = Math.min(1, (t - t0) / DUR);
        const day = Math.max(1, Math.ceil(k * days));
        const pages = Math.min(PAGES, Math.round(k * PAGES));
        meter.set(`Ден ${day} · Преписани: ${pages} от ${PAGES} страници`);
        // Ден и нощ се сменят; купчинките листове растат.
        const night = 0.5 + 0.5 * Math.cos(k * days * Math.PI * 2 / Math.max(1, days / 6));
        scene.background.setHex(SKY).lerp(new THREE.Color(0x3a4a66), night * 0.5);
        SU.piles.forEach((p, i) => { if (i < nn) { p.scale.y = Math.max(0.01, k); p.position.y = p.userData.base + 0.05 * k; } });
        if (k >= 1) {
          running(); running = null; meter.remove();
          scene.background.setHex(SKY);
          const months = days >= 60 ? ` — повече от ${Math.floor(days / 30)} месеца` : '';
          say(named.libraryA, `<b>${nn} ${nn === 1 ? 'книжовник' : 'книжовници'}</b>: една книга за около <b>${days} дни</b>${months}.<br><span class="small">Числата са илюстрация, не точни данни.</span>`, { cls: 'wide', lift: 0.5 });
          shell.score(`Опити: ${[1, 2, 3, 4].map((x) => (tried.has(x) || x === nn ? `✓${x}` : `○${x}`)).join(' ')}`);
          done();
        }
      });
    }
    function ask() {
      const right = guess === 'months';
      shell.task(`${right ? 'Предположението ти се потвърди.' : 'Опитът показа друго, отколкото предположи.'} <b>Защо през XV–XVII век книгите в българските земи са малко и много ценни?</b>`);
      askList([
        { t: 'Всяка книга се преписва на ръка много дни, а в българските земи няма печатници.', ok: true },
        { t: 'Защото хората не искат да четат.', ok: false, why: 'Хората искат книги, но всяка книга отнема много време. Виж колко дни трае преписването.' },
        { t: 'Защото монасите крият книгите от всички.', ok: false, why: 'Монасите пазят книгите, но и ги преписват и учат деца да четат по тях.' },
      ], () => {
        say(named.libraryA, 'По същото време в Западна Европа вече има печатници: от средата на XV век книгите там се печатат. „Абагар“ — първата печатна книга с новобългарски елементи — е отпечатана в Рим чак през 1651 г. от Филип Станиславов.', { cls: 'wide', lift: 0.5 });
        shell.task('<b>Какво показват тези години?</b>');
        askList([
          { t: 'Българската култура под османска власт изостава от европейската: развитието не съвпада по време.', ok: true },
          { t: 'Българите печатат книги преди европейците.', ok: false, why: 'Сравни годините: средата на XV век в Европа и 1651 г. за „Абагар“.' },
          { t: 'В Европа и при българите всичко става по едно и също време.', ok: false, why: 'Сравни годините: разликата е около двеста години.' },
        ], () => {
          scores.push(stepScore(mistakes, 2));
          say(named.libraryA, '<b>Вярно.</b> Когато развитието на две култури не съвпада по време, казваме, че е <b>асинхронно</b>. Под османска власт българите нямат своя държава и свои печатници — затова манастирите пазят книжнината.', { cls: 'good wide', lift: 0.5 });
          const nx = shell.setControls('<button class="btn primary">Напред →</button>');
          nx.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
        });
      });
    }
    function askList(list, onRight) {
      const cc = shell.setControls(`<div class="col">${list.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
      cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = list[+b.dataset.i];
        if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
        shell.msg('Вярно!', 'good');
        onRight();
      }));
    }
  }

  // ---------- 3. Какво дава манастирът на българите? ----------
  function step3() {
    phase = 3;
    shell.step(2);
    setScribes(2);
    resetPiles();
    view([0, 12, 7.5], [0, 0, 0.9]);
    for (const [id, r] of Object.entries(ROLES)) {
      const ring = zoneRing(id === 'faith' ? 0xd4af37 : id === 'books' ? 0x7a2f22 : 0x2f6a9a, 0.85);
      ring.position.set(r.at[0], 0.03, r.at[1]); scene.add(ring); extra.push(ring);
      const l = labelSprite(r.label, { size: 0.44 }); l.position.set(r.at[0], 1.1, r.at[1] - 0.9); scene.add(l); extra.push(l);
      const o = new THREE.Object3D(); o.position.set(r.at[0], 0.12, r.at[1]); o.userData.dropId = id; scene.add(o); extra.push(o);
    }
    pilgrims.forEach((p) => { p.visible = false; });
    const pos = [[-3.4, 4.25], [0, 4.25], [3.4, 4.25], [-3.4, -2.4], [0, -2.4], [3.4, -2.4]];
    const order = [3, 0, 5, 1, 4, 2];
    CARDS.forEach((cd, i) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.55), mat(0xfff4d6));
      const l = labelSprite(cd.label, { size: 0.3 }); l.position.y = 0.3;
      g.add(b, l);
      const [x, z] = pos[order[i]];
      g.position.set(x, 0.14, z);
      g.userData = { dragId: cd.id, home: g.position.clone() };
      addHitBox(g, 0.5);
      scene.add(g); extra.push(g);
    });
    let mistakes = 0, placed = 0;
    const tries = {};
    const stacked = { faith: 0, books: 0, people: 0 };
    shell.task('Какво дава всяка дейност на българите? Завлечи всяка карта до кръга с ролята ѝ.');
    shell.setControls('');
    shell.score(`Карти: 0 от ${CARDS.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.14,
      onDrop(obj) {
        const cd = CARDS.find((x) => x.id === obj.userData.dragId);
        let to = null, bd = 1.3;
        for (const [id, r] of Object.entries(ROLES)) { const d = Math.hypot(obj.position.x - r.at[0], obj.position.z - r.at[1]); if (d < bd) { bd = d; to = id; } }
        if (!to) { obj.position.copy(obj.userData.home); return; }
        if (to === cd.to) {
          obj.userData.locked = true;
          delete obj.userData.dragId;
          const r = ROLES[to].at;
          const k = stacked[to]++;
          obj.scale.setScalar(0.62);
          obj.position.set(r[0], 0.16 + k * 0.02, r[1] - 0.28 + k * 0.5);
          placed++;
          shell.score(`Карти: ${placed} от ${CARDS.length}`);
          shell.msg('Вярно!', 'good');
          if (placed === CARDS.length) { stopDrag(); stopDrag = null; martyr(); }
        } else {
          mistakes++;
          tries[cd.id] = (tries[cd.id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(tries[cd.id] >= 2 ? `Подсказка: ${ROLES[cd.to].why}` : `Помисли пак: какво пази или прави тази дейност за хората?`, 'bad');
        }
      },
    });
    function martyr() {
      say(named.churchA, 'Вярата, книгите и срещите на хората пазят българите като общност, докато нямат своя държава.', { cls: 'good wide', lift: 0.8 });
      shell.task('Монасите четат на глас и жития на светци. Някои светци са загинали, защото не се отказват от вярата си — те са <b>мъченици</b>. <b>Кой е светец-мъченик от времето на османската власт?</b>');
      const cc = shell.setControls(`<div class="col">${MARTYR.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
      cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = MARTYR[+b.dataset.i];
        if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
        shell.msg('Вярно!', 'good');
        scores.push(stepScore(mistakes, 3));
        say(named.churchA, '<b>Вярно.</b> Св. Николай Софийски загива в София през XVI век, защото не се отказва от християнската вяра. Такива светци се наричат <b>новомъченици</b>. Други примери са св. Георги Софийски и св. Георги Кратовски. Житията им се преписват и четат в църквите и манастирите.', { cls: 'good wide', lift: 0.8 });
        const nx = shell.setControls('<button class="btn primary">Напред →</button>');
        nx.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
      }));
    }
  }

  // ---------- 4. Предскажи ----------
  const procession = [];
  const newPilgrims = [];
  function clearExtra() { for (const o of extra) scene.remove(o); extra.length = 0; }
  function setToday(on) {
    oldG.visible = !on; todayG.visible = on;
    for (const o of oldOnly) o.visible = !on;
    smk.group.visible = !on;
    setBadge(on);
  }
  function step4() {
    phase = 4;
    shell.step(3);
    shell.score('');
    clearExtra();
    pilgrims.forEach((p) => { p.visible = true; });
    view([2, 8, 15], [0, 0.6, 1.0]);
    let mistakes = 0;
    shell.task('През XV век мощите на св. Иван Рилски се пазят в Търново. През 1469 г. монасите ги пренасят тържествено в Рилския манастир. <b>Какво ще стане с манастира?</b>');
    ask(PREDICT1, () => {
      // Шествието влиза през портата и отива до църквата; в двора идват много поклонници.
      const rel = reliquary(); const carriers = [fp('priest'), fp('priest')];
      const g = new THREE.Group();
      rel.position.y = 0.42; g.add(rel);
      carriers.forEach((c, i) => { c.position.set(i ? 0.45 : -0.45, 0, 0); c.rotation.y = Math.PI; g.add(c); });
      const behind = [0, 1, 2].map((i) => { const m = fp('priest'); m.position.set((i - 1) * 0.35, 0, 0.7); m.rotation.y = Math.PI; g.add(m); return m; });
      void behind;
      g.position.set(0, 0, 13); scene.add(g); procession.push(g);
      const route = [[0, 13], [0, 6], [0, 3.6], [-2.2, 2.2], [-3.3, 1.2]].map(([x, z]) => new THREE.Vector3(x, 0, z));
      let seg = 0;
      running = stage.tick((dt) => {
        if (seg >= route.length - 1) { running(); running = null; return; }
        const to = route[seg + 1];
        const d = to.clone().sub(g.position);
        const L = d.length();
        if (L < 0.05) { seg++; return; }
        g.position.addScaledVector(d.normalize(), Math.min(L, dt * 2.2));
        g.rotation.y = Math.atan2(-d.x, -d.z);
        g.position.y = Math.abs(Math.sin(performance.now() / 160)) * 0.015;
      });
      [[-1.5, 3.4, 'woman'], [-0.6, 3.6, 'man'], [0.6, 3.2, 'boy'], [1.2, 2.6, 'woman'], [-2.4, 3.6, 'man'], [3.0, 1.6, 'shepherd'], [4.2, 0.8, 'girl'], [-4.4, -1.6, 'woman'], [1.4, -2.4, 'man'], [-1.6, -2.4, 'woman'], [4.6, 3.2, 'man'], [2.0, 3.9, 'girl']].forEach(([x, z, k]) => {
        const p = fp(k); p.position.set(x, 0, z); p.lookAt(-0.9, 0, 0.4); scene.add(p); newPilgrims.push(p);
      });
      say(named.skyA, '<b>Така става.</b> През 1469 г. мощите на св. Иван Рилски са пренесени тържествено от Търново в Рилския манастир. Манастирът става най-почитаното място за българите: на поклонение идват хора от всички български земи. Пренасянето е описано от книжовника Владислав Граматик. <span class="small">Шествието и хората са възстановка.</span>', { cls: 'good wide', lift: 0.8 });
      shell.task('Минават векове. <b>Коя сграда от XV–XVII век ще стои в манастира и днес?</b>');
      ask(PREDICT2, () => {
        newPilgrims.forEach((p) => { p.visible = false; });
        procession.forEach((p) => { p.visible = false; });
        setToday(true);
        view([8, 9, 13], [0, 1.0, 0], 1.4);
        say(named.skyA, '<b>Вярно.</b> През 1833 г. голям пожар унищожава почти целия манастир. Хрельовата кула оцелява. След пожара манастирът е построен наново: днешната голяма църква (1834–1837 г.) и крилата с шарените арки са от XIX век — от Възраждането. Днес Рилският манастир е в списъка на ЮНЕСКО за световно наследство.', { cls: 'good wide', lift: 0.6 });
        const nx = shell.setControls('<button class="btn primary">Виж резултата</button>');
        nx.querySelector('button').addEventListener('click', () => {
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
    clearExtra();
    for (const o of [...procession, ...newPilgrims]) scene.remove(o);
    procession.length = 0; newPilgrims.length = 0;
    pilgrims.forEach((p) => { p.visible = true; });
    scene.background.setHex(SKY);
    setToday(false);
    setScribes(2);
    resetPiles();
    walk.menu.setItems(STOPS.map((x) => ({ id: x.id, label: x.label, icon: x.icon })));
    step1();
  }

  step1();
  container.__demo = { stage, walk, scene, scribes, setToday };
  return { dispose() { if (stopDrag) stopDrag(); if (running) running(); smk.dispose(); badge.remove(); walk.dispose(); stage.dispose(); } };
}
