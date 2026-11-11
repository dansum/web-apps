// Раковски, Левски, Каравелов, Ботев — жива карта: мрежата от комитети на Левски (7.1.4).
// Стъпки: опознай местата → изгради мрежата и виж какво става, ако комитет бъде разкрит →
// свържи делото с деятеля → предскажи какво става с мрежата след залавянето на Левски.
// Картата показва днешния бряг и днешните граници само за ориентир. Градовете са само част от
// градовете с комитети (известни от учебниците); броят и разположението на всички комитети не се показват.
// Моделите (къщи, лагер, печатница, параход) са възстановка — рисунка, а не точно копие.
import { createStage, cornerMenu, esc, mat, labelSprite, THREE } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { mapDecor } from './hist/regions.js';
import { M } from './hist/architecture.js';
import { revivalHouse, folkPerson, pine, leafTree, mergeStatic } from './hist/revival.js';
import { europeanHouse } from './hist/city.js';
import { animal } from './hist/thrace.js';
import { plume } from './hist/industrial.js';

const CENTER = [25.6, 44.3], UPD = 1.6;

// Места за опознаване (стъпка 1).
const PLACES = [
  { id: 'belgrade', label: 'Белград', lon: 20.46, lat: 44.82, icon: '⚔',
    note: '<b>Белград — Георги Стойков Раковски.</b> През 1861 – 1862 г. Раковски създава тук <b>Първата българска легия</b> — отряд от доброволци, които се обучават за бъдеща борба. Раковски пръв прави план за освобождението и създава организация за него. Затова е наречен основоположник на организираното освободително движение.<br><span class="small">Лагерът на картата е възстановка.</span>' },
  { id: 'bucharest', label: 'Букурещ', lon: 26.1, lat: 44.43, icon: '📰',
    note: '<b>Букурещ — център на българската емиграция.</b> Тук <b>Любен Каравелов</b> издава вестниците „Свобода“ и „Независимост“. През 1869 – 1870 г. е създаден Българският революционен централен комитет (БРЦК). Тук <b>Христо Ботев</b> издава вестник „Знаме“. В Букурещ умира Раковски (1867 г.).<br><span class="small">Къщите и печатницата са възстановка.</span>' },
  { id: 'braila', label: 'Браила', lon: 27.97, lat: 45.27, icon: '📰',
    note: '<b>Браила — Христо Ботев.</b> През 1871 г. Ботев издава тук вестник „Дума на българските емигранти“. В Браила живеят много българи.<br><span class="small">Моделът на картата е възстановка.</span>' },
  { id: 'odessa', label: 'Одеса', lon: 30.73, lat: 46.48, icon: '🎓',
    note: '<b>Одеса</b> (тогава в Руската империя). Тук младият <b>Христо Ботев</b> учи в гимназия. В Одеса има голяма българска общност.<br><span class="small">Сградата на картата е възстановка.</span>' },
  { id: 'lovech', label: 'Ловеч', lon: 24.72, lat: 43.14, icon: '🏮',
    note: '<b>Ловеч — Васил Левски.</b> Левски смята, че свободата трябва да се подготви <b>вътре</b> в българските земи. Той обикаля страната и основава тайни революционни комитети. Комитетът в Ловеч става център на тази Вътрешна революционна организация.<br><span class="small">Къщите на картата са възстановка.</span>' },
  { id: 'kozloduy', label: 'Козлодуй', lon: 23.73, lat: 43.78, icon: '🚢',
    note: '<b>Козлодуй — четата на Ботев.</b> През май 1876 г. четниците на Христо Ботев се качват като пътници на австрийския параход „Радецки“, принуждават капитана да спре и слизат на българския бряг при Козлодуй. Днес в Козлодуй има копие на парахода — музей.<br><span class="small">Моделът на картата е възстановка.</span>' },
  { id: 'vratsa', label: 'Врачански Балкан', lon: 23.45, lat: 43.17, icon: '⛰',
    note: '<b>Врачанският Балкан.</b> Четата на Ботев навлиза в планината и се бие с османски войски. Тук, край връх Вола, през 1876 г. Христо Ботев загива.<br><span class="small">Планината на картата е рисунка.</span>' },
];

// Част от градовете с комитети, основани от Левски (стъпка 2). Ловеч е центърът.
const TOWNS = [
  { id: 'lovech', label: 'Ловеч', lon: 24.72, lat: 43.14, dx: -0.42, center: true },
  { id: 'pleven', label: 'Плевен', lon: 24.62, lat: 43.42, dx: -0.42 },
  { id: 'tarnovo', label: 'Търново', lon: 25.63, lat: 43.08, dx: 0.42 },
  { id: 'troyan', label: 'Троян', lon: 24.71, lat: 42.89, dx: 0.38 },
  { id: 'karlovo', label: 'Карлово', lon: 24.81, lat: 42.64, dx: -0.45, note: 'Карлово е родният град на Левски.' },
  { id: 'kazanlak', label: 'Казанлък', lon: 25.4, lat: 42.62, dx: 0.2, dz: -0.12 },
  { id: 'stzagora', label: 'Стара Загора', lon: 25.63, lat: 42.43, dx: 0.55 },
  { id: 'plovdiv', label: 'Пловдив', lon: 24.75, lat: 42.15, dx: -0.45 },
  { id: 'sofia', label: 'София', lon: 23.32, lat: 42.7, dx: 0 },
];
const FOUND = TOWNS.filter((t) => !t.center).map((t) => t.id);
// Схема Б (илюстрация): комитетите са свързани и помежду си, не само с центъра.
const MESH = [['lovech', 'pleven'], ['lovech', 'tarnovo'], ['lovech', 'troyan'], ['troyan', 'karlovo'], ['karlovo', 'plovdiv'],
  ['karlovo', 'kazanlak'], ['kazanlak', 'stzagora'], ['stzagora', 'plovdiv'], ['kazanlak', 'tarnovo'], ['plovdiv', 'sofia'], ['sofia', 'pleven']];
const EMIGRE = {
  belgrade: 'Белград е в Сърбия — там Раковски събира легията. Левски иска комитетите да са вътре в българските земи. Избери град в страната.',
  bucharest: 'Букурещ е център на емиграцията извън българските земи. Левски иска организацията да е вътре в страната. Избери град в страната.',
  braila: 'Браила е в Румъния, извън българските земи. Левски основава комитети вътре в страната.',
  odessa: 'Одеса е далеч извън българските земи. Левски основава комитети вътре в страната.',
};

// Стъпка 3: делата и идеите.
const PEOPLE = [
  { id: 'rakovski', label: 'Раковски' },
  { id: 'levski', label: 'Левски' },
  { id: 'karavelov', label: 'Каравелов' },
  { id: 'botev', label: 'Ботев' },
];
const CARDS = [
  { id: 'c1', t: 'Първата българска легия в Белград', who: 'rakovski', why: 'Легията в Белград (1861 – 1862 г.) е дело на Раковски.' },
  { id: 'c2', t: 'Мрежа от тайни комитети в страната', who: 'levski', why: 'Комитетите в българските земи са дело на Левски.' },
  { id: 'c3', t: 'Вестниците „Свобода“ и „Независимост“', who: 'karavelov', why: 'Тези вестници издава Любен Каравелов в Букурещ.' },
  { id: 'c4', t: 'Чета, преминала Дунава с „Радецки“', who: 'botev', why: 'Това е четата на Христо Ботев (1876 г.).' },
  { id: 'c5', t: 'Закон за народните горски чети', who: 'rakovski', why: 'Законът за горските чети (1867 г.) е написан от Раковски.' },
  { id: 'c6', t: '„Чиста и свята република“', who: 'levski', why: 'Така Левски описва свободна България: всички са равни пред закона.' },
  { id: 'c7', t: 'Председател на БРЦК', who: 'karavelov', why: 'Каравелов е председател на Българския революционен централен комитет.' },
  { id: 'c8', t: 'Вестник „Знаме“', who: 'botev', why: 'Вестник „Знаме“ издава Христо Ботев.' },
];
const WRONG3 = {
  rakovski: 'Раковски е по-ранен: легия в Белград, чети, които влизат отвън.',
  levski: 'Левски работи вътре в страната: тайни комитети.',
  karavelov: 'Каравелов е журналист и писател в Букурещ.',
  botev: 'Ботев е поет и журналист, водач на чета през 1876 г.',
};

const PREDICT = {
  ask: 'В края на 1872 г. Левски е заловен при Къкрина, край Ловеч. Той държи много от нишките на мрежата. <b>Какво ще стане с мрежата от комитети според теб?</b>',
  opts: [
    { t: 'Организацията е тежко разтърсена: много дейци са арестувани. Но идеята за свобода живее и през 1876 г. избухва Априлското въстание.', ok: true },
    { t: 'Комитетите веднага вдигат въстание и България е свободна още през 1873 г.', why: 'Не. Освобождението идва едва след Руско-турската война (1877 – 1878 г.).' },
    { t: 'Нищо не се променя — комитетите работят както преди.', why: 'Не. Опитът в стъпка 2 показа какво става, когато много нишки са в един човек.' },
  ],
  show: '<b>Така и става.</b> Левски е съден в София и е обесен през февруари 1873 г. Вътрешната революционна организация е тежко разтърсена, много дейци са арестувани. Но делото му продължава: Каравелов и Ботев в Букурещ, а през 1876 г. избухва Априлското въстание.',
};

export function mount(container, { skill = {}, onComplete } = {}) {
  const shell = createShell(container, { steps: ['Опознай', 'Изгради мрежата', 'Свържи делото', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const narrow = aspect < 1.2;
  const far = aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[-1.6, 9.0 * far, 7.4 * far], [-1.6, 0, 0.1]];
  const NET = [[-1.15, 3.5 * Math.min(far, 1.9), 4.9 + 2.0 * (Math.min(far, 1.9) - 1)], [-1.15, 0, 2.35]];
  const stage = createStage(shell.stageEl, { background: 0xdcecf7, camPos: VIEW[0], target: VIEW[1], maxDistance: 30 });

  let map = null, decor = null, menu = null, tip = null, clickHandler = null, stopDrag = null;
  const scores = [];
  const places = new Map();     // id → група на мястото (стъпка 1)
  const towns = new Map();      // id → { g, lamp, founded, out }
  const links = [];             // { a, b, mesh, courier, u, dir }
  const pedestals = new Map();
  const cards = new Map();
  let ship = null, smoke = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.9, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const P = (lon, lat, y = 0) => map.pos(lon, lat, y);
  const BASE = 0.13;

  // ---------- модели ----------
  function hitBox(g, w, h, d, y = h / 2) {
    const hb = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.y = y; hb.userData.isHitBox = true; g.add(hb); g.userData.hit = hb;
  }
  function tag(text, { size = 0.17, dx = 0, dz = 0, y = 0.5 } = {}) {
    const l = labelSprite(text, { size, bg: 'rgba(255,255,255,0.88)', border: 'rgba(0,0,0,0)' });
    l.position.set(dx, y, dz);
    return l;
  }
  function lantern() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.26, 6), M(0x3a2a1e)); pole.position.y = 0.13; g.add(pole);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x777777, emissive: 0x000000, roughness: 0.6 });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), lampMat); lamp.position.y = 0.28; g.add(lamp);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.04, 4), M(0x2a2420)); cap.position.y = 0.33; cap.rotation.y = Math.PI / 4; g.add(cap);
    g.userData.mat = lampMat;
    return g;
  }
  function setLamp(t, state) {
    const m = t.lamp.userData.mat;
    t.state = state;
    if (state === 'on') { m.color.setHex(0xffd36a); m.emissive.setHex(0xffb020); m.emissiveIntensity = 1; }
    else if (state === 'out') { m.color.setHex(0x8a8a8a); m.emissive.setHex(0x000000); }
    else if (state === 'caught') { m.color.setHex(0x7a2a22); m.emissive.setHex(0x3a0a06); }
    else if (state === 'weak') { m.color.setHex(0xc89a50); m.emissive.setHex(0x5a3a10); m.emissiveIntensity = 0.5; }
    else { m.color.setHex(0x777777); m.emissive.setHex(0x000000); }
  }
  function townModel(t) {
    const g = new THREE.Group();
    const houses = new THREE.Group();
    const colors = [0x3f6fae, 0xe8d9b8, 0x9a4a3a, 0xf0e6cf];
    const n = t.center ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const h = revivalHouse({ w: 1.5, d: 1.2, color: colors[(i + t.label.length) % 4], erker: i === 0 });
      h.scale.setScalar(0.085);
      h.position.set((i - (n - 1) / 2) * 0.17, 0, (i % 2) * 0.08 - 0.03);
      h.rotation.y = (i - 1) * 0.35;
      houses.add(h);
    }
    const tr = leafTree(0.18); tr.position.set(0.17, 0, -0.1); houses.add(tr);
    g.add(mergeStatic(houses));
    const lamp = lantern(); lamp.position.set(-0.12 * (t.center ? 1.6 : 1), 0, 0.12); g.add(lamp);
    g.add(tag(t.label, { dx: t.dx || 0, dz: t.dz || 0, y: 0.3 }));
    hitBox(g, 0.36, 0.34, 0.32);
    g.position.copy(P(t.lon, t.lat, BASE));
    g.userData.pickId = `t-${t.id}`;
    stage.scene.add(g);
    return { g, lamp, def: t, state: 'off' };
  }

  function legionCamp() {
    const g = new THREE.Group();
    const canvas = M(0xefe6cf, { flat: true });
    for (const [x, z] of [[-0.18, -0.1], [0, -0.16], [0.18, -0.1]]) {
      const tent = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 4), canvas); tent.position.set(x, 0.07, z); tent.rotation.y = Math.PI / 4; g.add(tent);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 6), M(0x4a3b2a)); pole.position.set(0.28, 0.21, 0.06); g.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1, 6, 1), new THREE.MeshStandardMaterial({ color: 0xb03028, side: THREE.DoubleSide }));
    flag.position.set(0.36, 0.36, 0.06); g.add(flag);
    const men = [];
    for (let i = 0; i < 4; i++) { const p = folkPerson('man', { scale: 0.2 }); p.position.set(-0.15 + i * 0.09, 0, 0.12); p.rotation.y = Math.PI / 2; g.add(p); men.push(p); }
    stage.tick((dt, t) => {
      const pos = flag.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, Math.sin(t * 5 + x * 30) * 0.012 * (x + 0.08) * 6); }
      pos.needsUpdate = true;
      men.forEach((m, i) => { m.position.x = -0.15 + i * 0.09 + Math.sin(t * 0.8) * 0.08; m.userData.arms.forEach((a, k) => { a.rotation.x = Math.sin(t * 6 + k * Math.PI) * 0.4; }); });
    });
    return g;
  }
  function pressModel() {
    const g = new THREE.Group();
    const wood = M(0x6b4a2c);
    for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.02), wood); post.position.set(s * 0.06, 0.1, 0); g.add(post); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.04), wood); top.position.y = 0.2; g.add(top);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.1), wood); bed.position.y = 0.06; g.add(bed);
    const platen = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 0.07), M(0x3a3f44, { metal: 0.5 })); platen.position.y = 0.12; g.add(platen);
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), M(0x3a3f44, { metal: 0.5 })); screw.position.y = 0.16; g.add(screw);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.12, 5), M(0x3a3f44, { metal: 0.5 })); bar.rotation.z = Math.PI / 2; bar.position.set(0.05, 0.17, 0); g.add(bar);
    for (let i = 0; i < 5; i++) { const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.006, 0.06), M(0xf3eedf)); sheet.position.set(0.17, 0.004 + i * 0.007, 0.02); sheet.rotation.y = i * 0.12; g.add(sheet); }
    g.userData.platen = platen; g.userData.bar = bar;
    return g;
  }
  function emigreCity(id, { floors = 2, n = 2, color = 0xe8c98a, press = false, school = false } = {}) {
    const g = new THREE.Group();
    const hs = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const h = europeanHouse({ w: school ? 2.6 : 1.6, d: 1.1, floors: school ? 3 : floors, color: i ? 0xe6dcc6 : color, shop: !school });
      h.scale.setScalar(0.085);
      h.position.set((i - (n - 1) / 2) * 0.17, 0, -0.05 - (i % 2) * 0.05);
      hs.add(h);
    }
    g.add(mergeStatic(hs));
    if (press) { const p = pressModel(); p.position.set(0.24, 0, 0.12); g.add(p); g.userData.press = p; }
    const walker = folkPerson(school ? 'boy' : 'gent', { scale: 0.22 }); walker.position.set(-0.1, 0, 0.14); g.add(walker);
    g.userData.walker = walker;
    return g;
  }
  function steamer() {
    const g = new THREE.Group();
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-0.22, 0); hullShape.lineTo(0.18, 0); hullShape.quadraticCurveTo(0.27, 0.0, 0.3, 0.05); hullShape.lineTo(-0.24, 0.05); hullShape.lineTo(-0.22, 0);
    const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 0.09, bevelEnabled: false }), M(0x23282e));
    hull.position.z = -0.045; g.add(hull);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.1), M(0xb08a5a)); deck.position.y = 0.056; g.add(deck);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.07), M(0xf2ede0)); cabin.position.set(-0.06, 0.087, 0); g.add(cabin);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.12, 10), M(0x2b2b2b)); stack.position.set(0.02, 0.15, 0); g.add(stack);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0175, 0.02, 10), M(0xb0302a)); band.position.set(0.02, 0.19, 0); g.add(band);
    const wheels = [];
    for (const s of [-1, 1]) {
      const box = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 14, 1, false, 0, Math.PI), M(0x8a2a22));
      box.rotation.x = Math.PI / 2; box.rotation.z = Math.PI / 2; box.position.set(0.0, 0.04, s * 0.065); g.add(box);
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 8), M(0x4a3a2a)); wh.rotation.x = Math.PI / 2; wh.position.set(0, 0.035, s * 0.065); g.add(wh); wheels.push(wh);
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 5), M(0x4a3b2a)); mast.position.set(0.2, 0.13, 0); g.add(mast);
    g.userData.wheels = wheels;
    return g;
  }
  function courier() {
    const g = new THREE.Group();
    const h = animal('horse'); g.add(h);
    const man = folkPerson('man', { scale: 0.8 }); man.position.set(-0.04, 0.3, 0); man.rotation.y = Math.PI / 2; g.add(man);
    g.scale.setScalar(0.32);
    g.userData.legs = h.userData.legs;
    return g;
  }
  function ridge(lon, lat, s = 1, snow = false) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, 0.14 * s, 7), M(0x8a9a5a, { flat: true }));
    m.position.y = 0.1 * s; g.add(m);
    if (snow) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.045 * s, 7), M(0xf4f4f0, { flat: true })); c.position.y = 0.115 * s; g.add(c); }
    for (let i = 0; i < 3; i++) { const p = pine(0.1); const a = i * 2.1 + lon; p.position.set(Math.cos(a) * 0.12 * s, 0.02, Math.sin(a) * 0.09 * s + 0.04); g.add(p); }
    g.position.copy(P(lon, lat, 0.12));
    return g;
  }

  function buildWorld() {
    // Дунав (приблизително) и Стара планина.
    const DANUBE = [[20.46, 44.82], [20.93, 44.66], [21.38, 44.77], [21.52, 44.79], [21.74, 44.68], [22.03, 44.62], [22.2, 44.56], [22.35, 44.68],
      [22.5, 44.71], [22.64, 44.6], [22.78, 44.3], [22.95, 44.13], [22.91, 43.99], [23.0, 43.86], [23.23, 43.88], [23.54, 43.85], [23.95, 43.79],
      [24.23, 43.76], [24.43, 43.8], [24.81, 43.74], [25.16, 43.69], [25.5, 43.67], [25.68, 43.71], [25.82, 43.77], [25.93, 43.87], [26.22, 44.01],
      [26.49, 44.09], [26.85, 44.15], [27.26, 44.12], [27.9, 44.1], [27.98, 44.4], [28.0, 44.8], [27.97, 45.15], [28.05, 45.4], [28.4, 45.32],
      [28.8, 45.24], [29.3, 45.32], [29.65, 45.2]];
    const curve = new THREE.CatmullRomCurve3(DANUBE.map(([lo, la]) => P(lo, la, 0.13)));
    const river = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.035, 6, false), new THREE.MeshStandardMaterial({ color: 0x4f97cf, roughness: 0.3 }));
    river.scale.y = 0.3; river.position.y = 0.09;
    stage.scene.add(river);
    const rt = river.material;
    stage.tick((dt, t) => { rt.color.setHSL(0.57, 0.55, 0.55 + Math.sin(t * 1.3) * 0.03); });
    const BALKAN = [[22.7, 43.45, 0.9], [23.2, 43.2, 1], [23.7, 42.98, 1.1], [24.2, 42.83, 1.1], [24.6, 42.77, 1.3, true], [25.1, 42.73, 1.1], [25.6, 42.78, 1], [26.1, 42.8, 0.9], [26.7, 42.77, 0.8], [27.2, 42.75, 0.7]];
    for (const [lo, la, s, sn] of BALKAN) stage.scene.add(ridge(lo, la, s, sn));
    // Места от стъпка 1.
    const mk = (id, g) => {
      const p = PLACES.find((x) => x.id === id);
      g.position.copy(P(p.lon, p.lat, BASE));
      g.add(tag(p.label, { y: 0.5, size: 0.26 }));
      hitBox(g, 0.5, 0.4, 0.4);
      g.userData.pickId = id;
      stage.scene.add(g);
      places.set(id, g);
      return g;
    };
    mk('belgrade', legionCamp());
    mk('bucharest', emigreCity('bucharest', { n: 3, press: true }));
    mk('braila', emigreCity('braila', { n: 2, color: 0xd9b48a, press: true }));
    mk('odessa', emigreCity('odessa', { n: 1, school: true }));
    const vr = new THREE.Group(); const peak = ridge(23.45, 43.17, 1.5, false); peak.position.set(0, 0, 0); vr.add(peak); mk('vratsa', vr);
    // Козлодуй: брегът и параходът, който бавно плава по Дунава.
    const kz = new THREE.Group();
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.06), M(0x7a5a3a)); pier.position.set(0, 0.01, -0.1); kz.add(pier);
    const hut = revivalHouse({ w: 1.2, d: 1, color: 0xe8d9b8, erker: false }); hut.scale.setScalar(0.07); hut.position.set(0.1, 0, 0.12); kz.add(hut);
    mk('kozloduy', kz);
    ship = steamer();
    stage.scene.add(ship);
    const a = P(23.3, 43.875, 0.12), b = P(24.2, 43.77, 0.12);
    ship.userData.path = [a, b];
    smoke = plume(stage, ship, new THREE.Vector3(0.02, 0.22, 0), { n: 6, size: 0.03, rise: 0.5, drift: 0.15, speed: 0.25 });
    stage.tick((dt, t) => {
      const k = 0.5 - 0.5 * Math.cos(t * 0.12);
      ship.position.lerpVectors(a, b, k);
      ship.rotation.y = Math.sin(t * 0.12) >= 0 ? Math.atan2(-(b.z - a.z), b.x - a.x) : Math.atan2(-(a.z - b.z), a.x - b.x);
      ship.position.y = 0.12 + Math.sin(t * 2) * 0.005;
      ship.userData.wheels.forEach((w) => { w.rotation.y += dt * 4; });
      for (const id of ['bucharest', 'braila']) {
        const pr = places.get(id).userData.press;
        if (pr) { pr.userData.platen.position.y = 0.1 + Math.max(0, Math.sin(t * 2 + id.length)) * 0.02; pr.userData.bar.rotation.y = Math.sin(t * 2 + id.length) * 0.6; }
      }
      for (const g of places.values()) {
        const w = g.userData.walker;
        if (w) { w.position.x = -0.1 + Math.sin(t * 0.5 + g.position.x) * 0.12; w.rotation.y = Math.cos(t * 0.5 + g.position.x) > 0 ? Math.PI / 2 : -Math.PI / 2; }
      }
    });
    // Градовете с комитети.
    for (const t of TOWNS) towns.set(t.id, townModel(t));
    // Куриерите яздят по връзките.
    stage.tick((dt, t) => {
      for (const L of links) {
        if (!L.mesh.visible || !L.courier.visible) continue;
        L.u += dt * L.speed * L.dir;
        if (L.u > 1) { L.u = 1; L.dir = -1; if (L.onArrive) { const f = L.onArrive; L.onArrive = null; f(); } }
        if (L.u < 0) { L.u = 0; L.dir = 1; }
        const p = L.curve.getPointAt(L.u);
        const q = L.curve.getPointAt(Math.min(1, Math.max(0, L.u + 0.02 * L.dir)));
        L.courier.position.copy(p).setY(p.y - 0.02);
        L.courier.rotation.y = Math.atan2(-(q.z - p.z), q.x - p.x);
        L.courier.userData.legs.forEach((l, j) => { l.rotation.z = Math.sin(t * 9 + j * Math.PI / 2) * 0.45; });
      }
    });
  }

  // ---------- връзки ----------
  const linkMat = new THREE.MeshStandardMaterial({ color: 0xd9a520, emissive: 0x6a4a00, roughness: 0.5 });
  const linkMatOld = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.8, transparent: true, opacity: 0.5 });
  function addLink(a, b, { speed = 0.35, from0 = false, onArrive = null } = {}) {
    const A = towns.get(a).g.position.clone().setY(BASE + 0.06), B = towns.get(b).g.position.clone().setY(BASE + 0.06);
    const mid = A.clone().add(B).multiplyScalar(0.5); mid.y += 0.15 + A.distanceTo(B) * 0.12;
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 5, false), linkMat);
    stage.scene.add(mesh);
    const c = courier(); stage.scene.add(c);
    const L = { a, b, curve, mesh, courier: c, u: from0 ? 0 : Math.random(), dir: 1, speed: speed / Math.max(0.5, A.distanceTo(B)), onArrive };
    links.push(L);
    return L;
  }
  function clearLinks() {
    for (const L of links) { stage.scene.remove(L.mesh, L.courier); L.mesh.geometry.dispose(); }
    links.length = 0;
  }
  // Кои живи комитети остават свързани с поне още един.
  function connected() {
    const alive = new Set([...towns.values()].filter((t) => t.founded && t.state !== 'caught').map((t) => t.def.id));
    const adj = new Map([...alive].map((id) => [id, []]));
    for (const L of links) if (L.mesh.visible && alive.has(L.a) && alive.has(L.b)) { adj.get(L.a).push(L.b); adj.get(L.b).push(L.a); }
    const seen = new Set(), comps = [];
    for (const id of alive) {
      if (seen.has(id)) continue;
      const comp = [], st = [id]; seen.add(id);
      while (st.length) { const x = st.pop(); comp.push(x); for (const y of adj.get(x)) if (!seen.has(y)) { seen.add(y); st.push(y); } }
      comps.push(comp);
    }
    comps.sort((x, y) => y.length - x.length);
    return { alive, main: new Set(comps[0] || []) };
  }
  function disclose(id) {
    const t = towns.get(id);
    setLamp(t, 'caught');
    for (const L of links) if (L.a === id || L.b === id) { L.mesh.visible = false; L.courier.visible = false; }
    const { alive, main } = connected();
    let cut = 0;
    for (const x of alive) { const tt = towns.get(x); if (main.size > 1 && main.has(x)) setLamp(tt, 'on'); else { setLamp(tt, 'out'); cut++; } }
    for (const L of links) if (L.mesh.visible && !(main.has(L.a) && main.has(L.b) && main.size > 1)) { L.mesh.visible = false; L.courier.visible = false; }
    return { cut, total: alive.size };
  }
  function resetTowns() {
    clearLinks();
    for (const t of towns.values()) { t.founded = !!t.def.center; setLamp(t, t.def.center ? 'on' : 'off'); }
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    resetTowns();
    for (const t of towns.values()) t.g.visible = !!t.def.center;
    for (const g of places.values()) g.visible = true;
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    shell.task('Това са местата, свързани с Раковски, Левски, Каравелов и Ботев. Разгледай всяко: избери го от менюто или кликни върху него на картата.');
    const seen = new Set();
    const open = (id) => {
      const p = PLACES.find((x) => x.id === id);
      if (!p) return;
      const g = id === 'lovech' ? towns.get('lovech').g : places.get(id);
      stage.focusOn(g, { dist: 3.4 * Math.min(far, 1.8), height: 3.0 * Math.min(far, 1.8), keepFollow: false, lift: 0.1 });
      say(g, p.note, { cls: 'wide', lift: 0.6 });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${PLACES.length}`);
      if (seen.size === PLACES.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    if (menu) menu.remove();
    menu = cornerMenu(stage, { title: 'Разгледай', items: PLACES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })), onSelect: open });
    clickHandler = (id) => { if (id === 't-lovech') open('lovech'); else if (id && places.has(id)) open(id); };
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${PLACES.length}`);
  }

  // ---------- 2. Изгради мрежата ----------
  function step2() {
    shell.step(1);
    clearTip();
    for (const t of towns.values()) t.g.visible = true;
    for (const id of ['vratsa', 'kozloduy']) places.get(id).visible = false;
    stage.flyTo(NET[0], NET[1], 1.1);
    let mistakes = 0, busy = false;
    const done = new Set();
    shell.task('Ти си Левски. От Ловеч тръгваш из българските земи. <b>Кликни град, за да основеш в него таен комитет.</b> Куриер ще го свърже с центъра.');
    shell.setControls('<p class="small">На картата е само част от градовете, в които има комитети.</p>');
    shell.score(`Комитети: 0 от ${FOUND.length}`);
    say(towns.get('lovech').g, '<b>Ловеч</b> — центърът', { cls: 'tag', lift: 0.75 });
    clickHandler = (pid) => {
      if (!pid || busy) return;
      if (EMIGRE[pid]) { mistakes++; shell.msg(EMIGRE[pid], 'bad'); return; }
      if (!pid.startsWith('t-')) return;
      const id = pid.slice(2), t = towns.get(id);
      if (t.def.center) { shell.msg('В Ловеч вече има комитет — той е центърът. Избери друг град.', ''); return; }
      if (t.founded) { shell.msg('Тук вече има комитет.', ''); return; }
      busy = true;
      t.founded = true;
      addLink('lovech', id, { from0: true, speed: 0.9, onArrive: () => {
        setLamp(t, 'on');
        done.add(id);
        busy = false;
        shell.score(`Комитети: ${done.size} от ${FOUND.length}`);
        say(t.g, `<b>${esc(t.def.label)}</b>: нов таен комитет.${t.def.note ? ' ' + esc(t.def.note) : ''}`, { cls: 'good', lift: 0.75 });
        shell.msg('Комитетът е основан. Куриерът носи писма по тайната поща.', 'good');
        if (done.size === FOUND.length) experimentA();
      } });
      shell.msg(`Куриерът язди към ${t.def.label}…`, '');
    };

    // Опит А: всички нишки са в центъра.
    function experimentA() {
      clickHandler = null;
      setTimeout(() => {
        clearTip();
        shell.task('<b>Опит (опростена илюстрация).</b> Сега всички връзки минават през Ловеч. Ами ако властта разкрие центъра? <b>Кликни Ловеч.</b>');
        shell.setControls('<p class="small">Схема А: всички нишки са в един център.</p>');
        say(towns.get('lovech').g, 'Кликни тук', { cls: 'tag', lift: 0.75 });
        clickHandler = (pid) => {
          if (pid !== 't-lovech') { if (pid) shell.msg('Кликни центъра — Ловеч.', ''); return; }
          clickHandler = null;
          const r = disclose('lovech');
          say(towns.get('lovech').g, `Центърът е разкрит. <b>Откъснати комитети: ${r.cut} от ${r.total}.</b> Никой не получава вести.`, { cls: 'bad', lift: 0.75 });
          shell.msg('Всички комитети остават без връзка!', 'bad');
          const c = shell.setControls('<button class="btn primary b-exp">Опитай схема Б →</button>');
          c.querySelector('.b-exp').addEventListener('click', experimentB);
        };
      }, 900);
    }
    // Опит Б: комитетите са свързани и помежду си.
    function experimentB() {
      clearTip();
      clearLinks();
      for (const t of towns.values()) setLamp(t, 'on');
      for (const [a, b] of MESH) addLink(a, b, { speed: 0.3 });
      shell.task('<b>Схема Б:</b> комитетите са свързани и помежду си, не само с центъра. <b>Кликни Ловеч пак.</b>');
      shell.setControls('<p class="small">Схема Б: всеки комитет знае само съседите си.</p>');
      say(towns.get('lovech').g, 'Кликни тук', { cls: 'tag', lift: 0.75 });
      clickHandler = (pid) => {
        if (pid !== 't-lovech') { if (pid) shell.msg('Кликни Ловеч.', ''); return; }
        clickHandler = null;
        const r = disclose('lovech');
        say(towns.get('lovech').g, `Центърът е разкрит. <b>Откъснати комитети: ${r.cut} от ${r.total}.</b> Останалите още са свързани.`, { cls: 'good', lift: 0.75 });
        shell.msg('Мрежата оцелява!', 'good');
        setTimeout(ask, 600);
      };
    }
    function ask() {
      shell.task('<b>Какво показва опитът?</b>');
      const OPTS = [
        { t: 'Ако всички нишки са в един човек или център, разкриването му откъсва всички комитети.', ok: true },
        { t: 'Няма значение как са свързани комитетите.', why: 'Не. Сравни схема А и схема Б — резултатът е различен.' },
        { t: 'Разкритият комитет винаги разкрива всички останали.', why: 'Не. При схема Б останалите комитети остават свързани.' },
      ];
      const c = shell.setControls(`<div class="col">${OPTS.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const o = OPTS[+b.dataset.i];
        if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
        scores.push(stepScore(mistakes, 3));
        shell.msg('Вярно! Затова Левски пази тайната: клетва, тайни имена, тайна поща. Но много нишки все пак остават в неговите ръце.', 'good');
        const n = shell.setControls('<button class="btn primary">Напред →</button>');
        n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
      }));
    }
  }

  // ---------- 3. Свържи делото с деятеля ----------
  const PED_Y = 0.14;
  function pedestalModel(p) {
    const g = new THREE.Group();
    const stone = M(0xffffff, { tex: 'limestone', rep: [1, 1] });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.42), stone); base.position.y = 0.04; g.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.3), stone); body.position.y = 0.25; g.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.38), stone); top.position.y = 0.45; g.add(top);
    const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 6, 16), M(0x8a6a2a, { metal: 0.5, rough: 0.4 }));
    wreath.position.set(0, 0.27, 0.155); g.add(wreath);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 40), new THREE.MeshBasicMaterial({ color: 0x2b6cb0, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; g.add(ring);
    g.add(tag(p.label, { size: 0.24, y: 0.72 }));
    g.userData = { pickId: `p-${p.id}`, ring, stack: 0 };
    hitBox(g, 0.7, 0.6, 0.5);
    g.userData.pickId = `p-${p.id}`;
    return g;
  }
  function cardModel(c) {
    const g = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.34), M(0xf3e9cf));
    g.add(paper);
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), M(0xa02a22)); seal.position.set(0.17, 0.02, 0.1); g.add(seal);
    const l = labelSprite(c.t, { size: narrow ? 0.26 : 0.22, bg: 'rgba(255,250,235,0.97)', border: '#a07a3a' });
    l.position.y = 0.32; g.add(l);
    g.userData.label = l;
    g.userData.dragId = c.id;
    return g;
  }
  function step3() {
    shell.step(2);
    for (const t of towns.values()) t.g.visible = false;
    for (const L of links) { L.mesh.visible = false; L.courier.visible = false; }
    // Пиедесталите — в ред (широк екран) или 2 × 2 (тесен), на юг от картата на градовете.
    const spots = narrow ? [[-1.0, 3.0], [1.0, 3.0], [-1.0, 4.6], [1.0, 4.6]] : [[-3.6, 3.6], [-1.6, 3.6], [0.4, 3.6], [2.4, 3.6]];
    const CARD_AT = narrow ? new THREE.Vector3(0, 0.5, 1.4) : new THREE.Vector3(-0.6, 0.5, 1.9);
    if (!pedestals.size) PEOPLE.forEach((p, i) => { const g = pedestalModel(p); g.position.set(spots[i][0], PED_Y, spots[i][1]); stage.scene.add(g); pedestals.set(p.id, g); });
    for (const g of pedestals.values()) { g.visible = true; g.userData.stack = 0; }
    const view = narrow ? [[0, 5.0, 6.4], [0, 0, 3.1]] : [[-0.6, 5.4, 7.2], [-0.6, 0, 2.9]];
    stage.flyTo(view[0], view[1], 1.1);
    let mistakes = 0, k = 0;
    const tries = {};
    shell.task('Завлечи всяка карта при деятеля, чиято е идеята или делото.');
    shell.setControls('');
    const next = () => {
      shell.score(`Свързани: ${k} от ${CARDS.length}`);
      if (k >= CARDS.length) return;
      const c = CARDS[k];
      const g = cardModel(c);
      g.position.copy(CARD_AT);
      stage.scene.add(g);
      cards.set(c.id, g);
      g.userData.home = CARD_AT.clone();
    };
    next();
    stopDrag = stage.enableDrag({
      planeY: 0.5,
      onDrop(obj) {
        const c = CARDS.find((x) => x.id === obj.userData.dragId);
        let best = null, bd = 1e9;
        for (const [id, p] of pedestals) { const d = Math.hypot(p.position.x - obj.position.x, p.position.z - obj.position.z); if (d < bd) { bd = d; best = id; } }
        if (!best || bd > 0.95) { obj.position.copy(obj.userData.home); return; }
        if (best === c.who) {
          const p = pedestals.get(best);
          obj.userData.dragId = undefined; obj.userData.locked = true;
          obj.position.set(p.position.x + (p.userData.stack ? 0.18 : -0.18), PED_Y + 0.5 + p.userData.stack * 0.04, p.position.z + 0.02);
          obj.userData.label.visible = false;
          p.userData.stack++;
          p.userData.ring.material.color.setHex(0x2fb36b);
          say(p, `<b>${esc(c.t)}</b><br>${esc(c.why)}`, { cls: 'good', lift: 0.95 });
          shell.msg('Вярно!', 'good');
          k++;
          if (k < CARDS.length) { next(); return; }
          shell.score(`Свързани: ${k} от ${CARDS.length}`);
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 4));
          const n = shell.setControls('<button class="btn primary">Напред →</button>');
          n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
        } else {
          mistakes++;
          tries[c.id] = (tries[c.id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(`${WRONG3[best]} Опитай пак.`, 'bad');
          if (tries[c.id] >= 2) { pedestals.get(c.who).userData.ring.material.color.setHex(0xf2b01e); say(pedestals.get(c.who), 'Подсказка: тук', { cls: 'tag', lift: 0.95 }); }
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    shell.score('');
    for (const g of pedestals.values()) g.visible = false;
    for (const g of cards.values()) g.visible = false;
    // Мрежата отново е цяла: центърът и куриерите по всички връзки.
    clearLinks();
    for (const t of towns.values()) { t.g.visible = true; t.founded = true; setLamp(t, 'on'); }
    for (const id of FOUND) addLink('lovech', id, { speed: 0.5 });
    for (const [a, b] of MESH) if (a !== 'lovech' && b !== 'lovech') addLink(a, b, { speed: 0.3 });
    stage.flyTo(NET[0], NET[1], 1.1);
    const lov = towns.get('lovech').g;
    say(lov, '<b>Ловеч</b>, края на 1872 г.', { cls: 'tag', lift: 0.75 });
    let mistakes = 0;
    shell.task(PREDICT.ask);
    const c = shell.setControls(`<div class="col">${PREDICT.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const o = PREDICT.opts[+b.dataset.i];
      if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      // Какво наистина става: центърът е разкрит, много връзки се късат, светлините отслабват.
      setLamp(towns.get('lovech'), 'caught');
      links.forEach((L, i) => { if (L.a === 'lovech' || L.b === 'lovech' || i % 2) { L.mesh.material = linkMatOld; L.courier.visible = false; } });
      for (const t of towns.values()) if (!t.def.center) setLamp(t, 'weak');
      say(lov, PREDICT.show, { cls: 'good wide', lift: 0.75 });
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
    for (const g of cards.values()) stage.scene.remove(g);
    cards.clear();
    for (const g of pedestals.values()) { g.visible = false; g.userData.ring.material.color.setHex(0x2b6cb0); }
    for (const L of links) L.mesh.material = linkMat;
    step1();
  }

  shell.task('Зареждане на картата…');
  createMap(stage, { url: 'data/geo/europe.json', center: CENTER, unitsPerDeg: UPD, focus: 'none', showNames: false,
    only: ['100', '642', '688', '792', '300', '807', '804', '498', '070', '499', 'Kosovo', '008', '191', '348', '112', '643', '703'] }).then((m) => {
    map = m;
    decor = mapDecor(stage, map, [
      { text: 'Черно море', lon: 30.3, lat: 43.2, sea: true }, { text: 'Дунав', lon: 25.0, lat: 43.95, sea: true, size: 0.16 },
      { text: 'Стара планина', lon: 26.6, lat: 42.55, size: 0.15 }, { text: 'Сърбия', lon: 21.0, lat: 43.7, size: 0.18 },
      { text: 'Румъния', lon: 24.6, lat: 45.2, size: 0.18 }, { text: 'Руската империя', lon: 30.6, lat: 47.2, size: 0.18 },
      { text: 'Османската империя', lon: 26.8, lat: 41.6, size: 0.2 },
    ]);
    const note = document.createElement('div');
    note.className = 'map-approx';
    note.textContent = 'Тънките линии са днешните граници — само за ориентир.';
    Object.assign(note.style, { position: 'absolute', left: '8px', bottom: '8px', zIndex: 3, padding: '3px 8px', borderRadius: '6px',
      background: 'rgba(255,255,255,0.9)', border: '1px solid #c7d3e0', font: '600 12px/1.3 system-ui, sans-serif', color: '#44505c', pointerEvents: 'none' });
    shell.stageEl.appendChild(note);
    buildWorld();
    step1();
  }).catch((e) => shell.msg(`Картата не се зареди: ${e.message}`, 'bad'));

  // За тестовете: екранна точка на място, град (t-…), пиедестал (p-…) или текущата карта (c…).
  const project = (o) => {
    const v = (o.userData.hit || o).getWorldPosition(new THREE.Vector3()).project(stage.camera);
    const r = stage.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  };
  container.__demo = {
    stage, get map() { return map; },
    at(id) {
      if (places.has(id)) return project(places.get(id));
      if (id.startsWith('t-')) return project(towns.get(id.slice(2)).g);
      if (id.startsWith('p-')) return project(pedestals.get(id.slice(2)));
      if (cards.has(id)) return project(cards.get(id));
      return null;
    },
    cardWho: (id) => CARDS.find((c) => c.id === id).who,
    currentCard: () => { const c = [...cards.entries()].find(([, g]) => g.userData.dragId); return c ? c[0] : null; },
  };
  return { dispose() { if (stopDrag) stopDrag(); if (menu) menu.remove(); if (decor) decor.dispose(); if (smoke) smoke.dispose(); stage.dispose(); } };
}
