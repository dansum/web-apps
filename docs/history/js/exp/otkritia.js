// 8.1.2 „Великите географски открития“ — пристанище от XV в., каравела и голям глобус.
// Стъпки: опознай (кораба, уредите, подправките, стария път) → плъзгач по годините: Диаш, Колумб, да Гама
// и изминатите километри → причина или последица → предскажи какво ще докаже плаването на Магелан—Елкано.
// Глобусът: брегове и днешни граници от Natural Earth (data/geo/world.json) — само за ориентир.
// Пътищата са схема: точките по пътя са приблизителни, сигурни са само датите в балончетата.
import { createStage, cornerMenu, esc, mat, labelSprite, addHitBox, zoneRing, THREE } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createGlobe, unit } from './hist/globe.js';
import { caravel, animateShip, compass, astrolabe, spiceSack, cinnamon, barrel, potato, corn, tomato, cocoa, crate, gull } from './hist/ships.js';
import { M } from './hist/architecture.js';
import { person } from './hist/antiquity.js';
import { animal } from './hist/thrace.js';

const SCHEME = '<br><i class="small">Пътят е схема; разстоянията са приблизителни.</i>';
const MONTHS = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
const fmtKm = (km) => `${(Math.round(km / 500) * 500).toLocaleString('bg-BG')} км`;
const monthOf = (t) => `${MONTHS[Math.min(11, Math.floor((t - Math.floor(t)) * 12 + 1e-6))]} ${Math.floor(t)} г.`;

// Пътища: [дължина, ширина, време в десетични години]. Сигурни са началото и целта; междинните точки са схема.
const ROUTES = {
  dias: { label: 'Диаш', color: 0x2f6fb0, pts: [[-9.14, 38.7, 1487.6], [-16, 28, 1487.68], [-18.5, 15, 1487.76], [-12, 5, 1487.82], [2, 2, 1487.86], [9, -3, 1487.88],
    [12, -12, 1487.91], [13.3, -22, 1487.94], [14.6, -26.6, 1487.96], [10, -33, 1488.0], [17, -38, 1488.04], [22.1, -34.4, 1488.1], [26.6, -33.9, 1488.2],
    [22.1, -34.4, 1488.27], [18.4, -34.75, 1488.34], [16.6, -33.4, 1488.4]] },
  columbus: { label: 'Колумб', color: 0xc0392b, pts: [[-6.9, 37.1, 1492.59], [-9.5, 35, 1492.6], [-15.4, 28.2, 1492.61], [-17.3, 28.0, 1492.68], [-30, 27.5, 1492.72],
    [-50, 26, 1492.75], [-65, 25, 1492.77], [-74.5, 24.05, 1492.78], [-75.6, 22.6, 1492.8], [-76.5, 21.4, 1492.82], [-73.5, 20.4, 1492.9], [-72.0, 20.1, 1492.95]] },
  gama: { label: 'Да Гама', color: 0x1f8a4c, pts: [[-9.14, 38.7, 1497.52], [-16, 28, 1497.55], [-23.4, 14.9, 1497.57], [-23.7, 14.7, 1497.59], [-26, 0, 1497.65],
    [-30, -15, 1497.71], [-25, -28, 1497.77], [-8, -34, 1497.82], [17.8, -32.7, 1497.85], [18.4, -34.6, 1497.89], [22.1, -34.4, 1497.92], [28, -33.3, 1497.98],
    [33, -28, 1498.05], [36, -24, 1498.1], [40.8, -15, 1498.2], [40.4, -10, 1498.24], [39.8, -4.1, 1498.27], [40.2, -3.25, 1498.29], [52, 4, 1498.33],
    [65, 9, 1498.36], [73.2, 11.0, 1498.38]] },
  magellan: { label: 'Магелан — Елкано', color: 0x8e44ad, pts: [[-6.4, 36.8, 1519.72], [-16, 28, 1519.76], [-24, 12, 1519.83], [-30, -5, 1519.88], [-38, -15, 1519.92],
    [-43.1, -23.1, 1519.95], [-48, -28, 1519.99], [-55.5, -35.3, 1520.04], [-63, -41, 1520.12], [-67.5, -49.3, 1520.25], [-67.4, -49.4, 1520.6], [-68.2, -52.4, 1520.8],
    [-70.6, -53.5, 1520.85], [-72.6, -53.1, 1520.88], [-75, -52.5, 1520.91], [-80, -42, 1520.96], [-90, -30, 1521.0], [-105, -20, 1521.05], [-125, -10, 1521.09],
    [-145, 0, 1521.12], [-165, 8, 1521.15], [175, 12, 1521.17], [144.8, 13.4, 1521.18], [126, 10.6, 1521.25], [124.1, 10.3, 1521.32], [122, 8, 1521.45],
    [120.5, 5, 1521.6], [124, 2, 1521.75], [127.3, 0.75, 1521.85], [125.5, -8.6, 1522.05], [110, -18, 1522.15], [85, -30, 1522.25], [55, -38, 1522.33],
    [30, -38, 1522.38], [18.4, -35.3, 1522.42], [5, -20, 1522.48], [-15, 0, 1522.52], [-23.4, 14.8, 1522.53], [-20, 28, 1522.62], [-6.4, 36.8, 1522.68]] },
};
// Стъпка 2: кога всеки кораб е в центъра на глобуса.
const FACE2 = [[1487, -2, -12], [1492.5, -40, 18], [1497.5, 5, -10], [1498.05, 35, 0]];

// Старият път на подправките (схема): по море до Арабия и Персийския залив, по суша с кервани, после до Венеция.
const OLD_ROUTES = [
  [[75.6, 11.2], [60, 13], [45, 12.4], [40, 17], [36, 23], [33.3, 28.5], [32.5, 29.9], [29.9, 31.2], [22, 34.2], [17.5, 39.5], [12.4, 45.3]],
  [[75.6, 11.2], [62, 22], [56.3, 26.6], [50, 29.2], [47.8, 30.5], [44.4, 33.3], [40.5, 35.5], [37.2, 36.2], [35.8, 34.5], [26, 34.5], [19.5, 38.5], [12.4, 45.3]],
];
const CARAVAN = [[47.8, 30.5], [44.4, 33.3], [40.5, 35.5], [37.2, 36.2]];

// Стъпка 1: какво се разглежда.
const ITEMS = [
  { id: 'caravel', label: 'Каравела', icon: '⛵',
    note: '<b>Каравела</b><br>Лек и бърз кораб. Португалците го развиват през XV в., за да плават покрай Африка. С каравели плава Бартоломеу Диаш, а два от трите кораба на Колумб — „Пинта“ и „Ниня“ — също са каравели.<br><i class="small">Моделът е възстановка по стари рисунки; няма запазена каравела.</i>' },
  { id: 'sail', label: 'Триъгълното платно', icon: '🔺',
    note: '<b>Триъгълното (латинско) платно</b><br>Моряците го завъртат спрямо вятъра. Така корабът плава и при страничен вятър, и косо срещу него — на зигзаг. С квадратно платно това е много по-трудно.<br><i class="small">Червеният кръст е знакът на португалския Орден на Христос.</i>' },
  { id: 'compass', label: 'Компас', icon: '🧭',
    note: '<b>Компас</b><br>Магнитната стрелка сочи към север — и в открития океан, където не се вижда бряг, и в облачно време. Компасът е изобретен в Китай и достига до Европа през Средновековието.<br><i class="small">Моделът е възстановка.</i>' },
  { id: 'astrolabe', label: 'Астролабия', icon: '☀️',
    note: '<b>Морска астролабия</b><br>С нея моряците мерят колко високо над хоризонта е Слънцето или Полярната звезда. Оттам изчисляват географската ширина — колко на север или на юг е корабът. Дължината (изток — запад) тогава още не може да се мери точно.<br><i class="small">Моделът е възстановка; запазени са истински морски астролабии от XVI в.</i>' },
  { id: 'spices', label: 'Подправки', icon: '🌶️',
    note: '<b>Подправки от Азия</b><br>Пипер, канела, карамфил и индийско орехче идват от Индия и островите в Югоизточна Азия. В Европа те струват много скъпо — използват се в кухнята и за лекарства. Който намери пряк морски път до тях, ще забогатее.' },
  { id: 'oldroute', label: 'Старият път на подправките', icon: '🐪',
    note: '<b>Старият път на подправките</b><br>Подправките пътуват дълго: по море до Арабия, после с кервани камили по суша до бреговете на Средиземно море, а оттам с корабите на Венеция и Генуа до Европа. Всеки търговец по пътя взима своята печалба и цената расте много. Пътищата по суша са дълги, трудни и скъпи — затова европейците търсят нов, морски път.<br><i class="small">Пунктираните линии са схема на пътя.</i>' },
  { id: 'lisbon', label: 'Лисабон', icon: '🏰',
    note: '<b>Лисабон</b><br>Столицата на Португалия — малка държава на брега на Атлантическия океан. През XV в. португалските моряци плават все по-на юг покрай Африка. Оттук тръгват Бартоломеу Диаш (1487 г.) и Вашку да Гама (1497 г.).' },
  { id: 'globe', label: 'Глобусът', icon: '🌍',
    note: '<b>Глобусът</b><br>Най-старият запазен глобус е направен в Нюрнберг през 1492 г. от Мартин Бехайм. На него още няма Америка. Нашият глобус показва днешните брегове и граници — само за ориентир.' },
];
const GLOBE_AT = { oldroute: [40, 25], lisbon: [-9.14, 38.7], globe: [-10, 20] }; // за балончето: малко на юг от мястото

// Стъпка 2: задачи с плъзгача.
const TASKS = [
  { id: 'cape', t: 1488.2, ask: 'Премести плъзгача до <b>1488 г.</b> Бартоломеу Диаш пръв заобикаля южния край на Африка. Кликни карфицата на това място.',
    early: 'Премести плъзгача поне до началото на 1488 г. и виж докъде стига корабът на Диаш.',
    good: '<b>1488 г.</b> Диаш заобикаля южния край на Африка и влиза в Индийския океан. Носът е наречен Добра надежда — надежда за морски път до Индия.' },
  { id: 'bahamas', t: 1492.78, ask: 'Продължи до <b>октомври 1492 г.</b> Колумб плава на запад, за да стигне до Индия. Къде всъщност стига? Кликни мястото.',
    early: 'Премести плъзгача до октомври 1492 г. и виж докъде стига корабът на Колумб.',
    good: '<b>12 октомври 1492 г.</b> Колумб стига до Бахамските острови. Той вярва, че е в Азия, затова нарича местните хора „индианци“. Всъщност това е нов за европейците континент — по-късно наречен Америка по името на мореплавателя Америго Веспучи.' },
  { id: 'calicut', t: 1498.38, ask: 'Продължи до <b>май 1498 г.</b> Вашку да Гама тръгва от Лисабон през 1497 г. Къде стига? Кликни мястото.',
    early: 'Премести плъзгача до май 1498 г. и виж докъде стига корабът на да Гама.',
    good: '<b>Май 1498 г.</b> Да Гама стига до Каликут в Индия. Морският път до Индия около Африка е открит — подправките вече могат да идват по море, без посредници.' },
  { id: 'ship-gama', t: 1498.38, ask: 'Виж числата под плъзгача. <b>Кой кораб е изминал най-дълъг път?</b> Кликни го на глобуса.',
    early: 'Премести плъзгача до май 1498 г.',
    good: 'Да Гама изминава най-дълъг път — над два пъти по-дълъг от пътя на Колумб. Затова пътуването му трае почти година.' },
];
const WRONG = {
  cape: 'Това е нос Добра надежда — южният край на Африка.',
  bahamas: 'Това са Бахамските острови — отвъд Атлантическия океан.',
  calicut: 'Колумб мисли, че е стигнал до Азия, но не е — виж докъде е стигнал корабът му.',
  'ship-dias': 'Това е корабът на Диаш. Сравни числата под плъзгача.',
  'ship-columbus': 'Това е корабът на Колумб. Сравни числата под плъзгача.',
  'ship-gama': 'Това е корабът на да Гама.',
};
const WRONG_BY_TASK = { calicut: { cape: 'Нос Добра надежда е по пътя, но да Гама продължава нататък — към Индия.' }, cape: { calicut: 'Диаш не стига до Индия. Виж докъде стига корабът му през 1488 г.' } };

// Стъпка 3: причини и последици.
const CARDS = [
  { id: 'c-spice', bin: 'cause', label: 'Подправките са много скъпи', why: 'Помисли: високата цена е преди пътешествията — тя ги подтиква.' },
  { id: 'c-route', bin: 'cause', label: 'Пътищата по суша на изток са трудни и скъпи', why: 'Трудните пътища по суша са в началото — затова се търси нов път.' },
  { id: 'c-ship', bin: 'cause', label: 'Нови кораби — каравели', why: 'Без добри кораби няма пътешествия. Корабите са условие, а не резултат.' },
  { id: 'c-tools', bin: 'cause', label: 'Компас, астролабия и по-точни карти', why: 'Уредите помагат пътешествията да започнат. Те са преди тях.' },
  { id: 'e-lands', bin: 'effect', label: 'Нови земи и колонии', why: 'Новите земи и колониите идват след плаванията — те са резултат.' },
  { id: 'e-food', bin: 'effect', label: 'Картофи, царевица, домати и какао в Европа', why: 'Тези растения стигат до Европа едва след като корабите достигат Америка.' },
  { id: 'e-native', bin: 'effect', label: 'Местните народи са завладени, много загиват', why: 'Това се случва, след като европейците достигат Америка — то е резултат.' },
  { id: 'e-trade', bin: 'effect', label: 'Търговията се мести към Атлантическия океан', why: 'Търговията се мести, защото вече има океански пътища. Това е резултат.' },
];

// Стъпка 4: какво ще докаже плаването на Магелан — Елкано.
const OPTIONS = [
  { id: 'near', label: 'Азия е съвсем близо до Европа, ако се плава на запад',
    why: 'Не. Пътят на запад се оказва много дълъг: само през Тихия океан моряците плават повече от три месеца.' },
  { id: 'round', label: 'Земята е кълбо и може да се обиколи по море', ok: true },
  { id: 'land', label: 'Америка и Азия са свързани по суша',
    why: 'Не. Между Америка и Азия се простира най-големият океан — Тихият.' },
];
const MAG_EVENTS = [
  { t: 1519.72, text: '20 септември 1519 г. — тръгват пет кораба' },
  { t: 1520.8, text: 'Есента на 1520 г. — проток на юг от Америка (днес Магеланов проток)' },
  { t: 1520.93, text: 'Тихият океан — повече от три месеца без суша' },
  { t: 1521.31, text: 'Април 1521 г. — Магелан загива на Филипинските острови' },
  { t: 1521.84, text: 'Ноември 1521 г. — Молукските острови, островите на подправките' },
  { t: 1522.41, text: '1522 г. — „Виктория“ заобикаля нос Добра надежда' },
  { t: 1522.67, text: '6 септември 1522 г. — завръщане в Испания' },
];

const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const Q = 0.5; // височина на кея

export function mount(container, { onComplete } = {}) {
  const shell = createShell(container, { steps: ['Опознай', 'Плъзгач по годините', 'Причина или последица', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const narrow = far > 1;
  const R = 3, GC = new THREE.Vector3(0, 5.0, -6);
  const FACE = new THREE.Vector3(0, Math.sin(0.27), Math.cos(0.27));
  const VIEW = [[0, 7.6, 19.5], [0, 3.4, 1]];
  const VIEW3 = narrow ? [[0, 9.6, 4.2], [0, Q, 1.5]] : [[0, 8.4, 7.4], [0, Q, 2.0]];
  const view = (pos, tgt, dur = 1) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * far), tgt, dur);
  const globeView = (d, dur = 1) => stage.flyTo(GC.clone().addScaledVector(FACE, R + d * far).toArray(), GC.clone().addScaledVector(FACE, d > 3 ? 0 : R).toArray(), dur);
  const stage = createStage(shell.stageEl, { background: 0xc9e4f4, camPos: VIEW[0].map((v, i) => VIEW[1][i] + (v - VIEW[1][i]) * far), target: VIEW[1], maxDistance: 45, minDistance: 1.2 });
  const { scene } = stage;
  scene.fog = new THREE.Fog(0xc9e4f4, 40, 90);

  const globeAnchor = new THREE.Object3D();
  let globe = null, menu = null, tip = null, evTip = null, clickHandler = null, stopDrag = null;
  const scores = [];
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.6, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const clearEv = () => { if (evTip) { evTip.remove(); evTip = null; } };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const ticks = [];

  // ---------- море, кей, хора ----------
  const water = new THREE.Mesh(new THREE.PlaneGeometry(110, 110, 72, 72), new THREE.MeshStandardMaterial({ color: 0x3f86b8, roughness: 0.35, metalness: 0.1, flatShading: true }));
  water.rotation.x = -Math.PI / 2;
  scene.add(water);
  const wp = water.geometry.attributes.position, wBase = Float32Array.from(wp.array);
  ticks.push((dt, t) => {
    for (let i = 0; i < wp.count; i++) {
      const x = wBase[i * 3], y = wBase[i * 3 + 1];
      wp.setZ(i, Math.sin(x * 0.45 + t * 1.1) * 0.08 + Math.cos(y * 0.38 - t * 0.9) * 0.07);
    }
    wp.needsUpdate = true; // нормалите не трябват: водата е с плоско оцветяване
  });
  const quay = new THREE.Group();
  const top = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), M(0xffffff, { tex: 'limestone', rep: [13, 8] }));
  top.rotation.x = -Math.PI / 2; top.position.set(0, Q, -2); quay.add(top);
  const wall = box(26, 1.6, 0.6, M(0xffffff, { tex: 'stone', rep: [13, 1] })); wall.position.set(0, Q - 0.8, 5.7); quay.add(wall);
  for (const s of [-1, 1]) { const sw = box(0.6, 1.6, 16, M(0xffffff, { tex: 'stone', rep: [8, 1] })); sw.position.set(s * 13, Q - 0.8, -2); quay.add(sw); }
  const capM = M(0xd9cdb2, { tex: 'limestone', rep: [13, 1] });
  const cap = box(26.2, 0.14, 0.8, capM); cap.position.set(0, Q + 0.07, 5.65); quay.add(cap);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.4, 10), mat(0x4a4a4a, { metalness: 0.4 })); b.position.set(-10 + i * 4, Q + 0.34, 5.5); quay.add(b); }
  scene.add(quay);

  // Каравелата на котва до кея.
  const ship = caravel();
  ship.scale.setScalar(1.6);
  const shipRoot = new THREE.Group();
  shipRoot.add(ship);
  shipRoot.position.set(narrow ? 1.5 : 4.5, -0.25, 8.6);
  shipRoot.rotation.y = Math.PI; // носът сочи наляво
  ship.userData.pickId = 'caravel';
  const mainsail = ship.userData.sails[1];
  mainsail.userData.pickId = 'sail';
  mainsail.geometry.computeBoundingBox();
  const sailAnchor = new THREE.Object3D();
  mainsail.geometry.boundingBox.getCenter(sailAnchor.position);
  ship.add(sailAnchor);
  scene.add(shipRoot);
  addHitBox(ship, 1);
  // Въже към кея.
  const moor = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(shipRoot.position.x - 4, Q + 0.4, 5.5), new THREE.Vector3(shipRoot.position.x - 3, 0.3, 6.6), new THREE.Vector3(shipRoot.position.x - 1.4, 0.75, 8.2)), 12, 0.025, 4), mat(0xb59866));
  scene.add(moor);
  ticks.push((dt, t) => {
    shipRoot.position.y = -0.25 + Math.sin(t * 1.1) * 0.06;
    ship.rotation.x = Math.sin(t * 0.8) * 0.025;
    ship.rotation.z = Math.sin(t * 0.6) * 0.012;
    animateShip(ship, t, 0.7);
  });

  // Масата на мореплавателя: компас, астролабия, морска карта.
  const table = new THREE.Group();
  const tw = M(0x8a5a32, { rough: 0.7 });
  const tt = box(2.6, 0.1, 1.5, tw); tt.position.y = 1.0; table.add(tt);
  for (const [x, z] of [[-1.15, -0.6], [1.15, -0.6], [-1.15, 0.6], [1.15, 0.6]]) { const l = box(0.1, 1.0, 0.1, tw); l.position.set(x, 0.5, z); table.add(l); }
  table.position.set(narrow ? -4.6 : -6.6, Q, -1.6);
  scene.add(table);
  const comp = compass(); comp.scale.setScalar(1.15); comp.position.set(-0.6, 1.05, 0.15); table.add(comp);
  comp.userData.pickId = 'compass'; addHitBox(comp, 0.8);
  const astro = astrolabe(); astro.scale.setScalar(0.9);
  const frame = new THREE.Group();
  for (const s of [-1, 1]) { const p = box(0.06, 1.3, 0.06, tw); p.position.set(s * 0.5, 0.65, 0); frame.add(p); }
  const bar = box(1.1, 0.06, 0.06, tw); bar.position.y = 1.3; frame.add(bar);
  const hang = new THREE.Group(); hang.position.y = 1.3; frame.add(hang);
  astro.position.y = -0.62; hang.add(astro);
  const cord = box(0.01, 0.12, 0.01, mat(0x3b2a1a)); cord.position.y = -0.06; hang.add(cord);
  frame.position.set(0.65, 1.05, 0); table.add(frame);
  frame.userData.pickId = 'astrolabe'; addHitBox(frame, 0.8);
  let chartMat = null;

  // Подправките на кея: чували, бъчви, канела.
  const goods = new THREE.Group();
  [[0x2a2018, -0.5, 0], [0x5a2e1a, 0.1, 0.1], [0xc9a14a, 0.65, -0.05]].forEach(([c, x, z], i) => {
    const s = spiceSack(c, { grain: i === 2 ? 0.025 : 0.018 }); s.scale.setScalar(1.6); s.position.set(x, 0, z); goods.add(s);
  });
  const cin = cinnamon(); cin.scale.setScalar(1.6); cin.position.set(0.1, 0, 0.75); goods.add(cin);
  for (const [x, z] of [[-1.3, -0.5], [-1.1, 0.4]]) { const b = barrel(); b.scale.setScalar(2.2); b.position.set(x, 0, z); goods.add(b); }
  goods.position.set(narrow ? 4.4 : 6.6, Q, -1.6);
  goods.userData.pickId = 'spices';
  scene.add(goods);
  addHitBox(goods, 1);
  const goodsTag = labelSprite('Пипер, карамфил, канела', { size: 0.26 }); goodsTag.position.set(0, 1.35, 0); goods.add(goodsTag);

  // Хора на кея и чайки.
  const folks = [];
  [[-9.5, 3.8, 0x8a5a3a], [9.8, 4.0, 0x6b7f8f], [-8.8, 0.8, 0x9a8a5a], [9.5, 1.2, 0x2f3e66]].forEach(([x, z, c], i) => {
    const p = person('citizen', { scale: 1.1 });
    p.children[0].material = mat(c);
    if (i % 2 === 0) { const sack = spiceSack(0x5a2e1a, { n: 10 }); sack.scale.setScalar(0.45); sack.position.set(0, 0.62, -0.08); p.add(sack); }
    p.position.set(x, Q, z); p.userData.home = p.position.clone(); p.userData.ph = i * 1.7;
    scene.add(p); folks.push(p);
  });
  ticks.push((dt, t) => {
    for (const p of folks) {
      const k = t * 0.25 + p.userData.ph, h = p.userData.home;
      const x = h.x + Math.cos(k) * 1.2, z = h.z + Math.sin(k * 0.8) * 0.5;
      p.rotation.y = Math.atan2(x - p.position.x, z - p.position.z);
      p.position.set(x, Q + Math.abs(Math.sin(t * 5 + p.userData.ph)) * 0.03, z);
    }
  });
  const gulls = [0, 1, 2].map((i) => { const g = gull(); g.scale.setScalar(1.6); scene.add(g); return g; });
  ticks.push((dt, t) => {
    gulls.forEach((g, i) => {
      const a = t * (0.25 + i * 0.05) + i * 2.1, r = 6 + i * 2;
      g.position.set(Math.cos(a) * r + 2, 12.5 + i * 0.8 + Math.sin(t + i) * 0.3, Math.sin(a) * r * 0.6 + 2);
      g.rotation.y = -a - Math.PI / 2;
      for (const w of g.userData.wings) w.pivot.rotation.x = w.s * Math.sin(t * 6 + i) * 0.45;
    });
    comp.userData.needle.rotation.y = Math.sin(t * 1.3) * 0.08 + Math.sin(t * 3.1) * 0.03;
    hang.rotation.z = Math.sin(t * 0.9) * 0.05;
    astro.userData.alidade.rotation.z = Math.sin(t * 0.4) * 0.5;
  });
  stage.tick((dt, t) => { for (const f of ticks) f(dt, t); });

  // Стойката на глобуса.
  const stand = new THREE.Group();
  const brass = mat(0xc9a14a, { metalness: 0.75, roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.35, 8), M(0x6d4a2c, { rough: 0.7 })); base.position.y = Q + 0.18; stand.add(base);
  const colPts = [];
  for (let i = 0; i <= 12; i++) { const y = i / 12; colPts.push(new THREE.Vector2(0.22 + 0.12 * Math.sin(y * Math.PI * 2) ** 2 + (y < 0.1 ? 0.15 : 0), y * 1.25)); }
  const column = new THREE.Mesh(new THREE.LatheGeometry(colPts, 16), M(0x7a5232, { rough: 0.6 })); column.position.y = Q + 0.35; stand.add(column);
  const meridian = new THREE.Mesh(new THREE.TorusGeometry(R + 0.16, 0.06, 8, 96), brass); meridian.position.set(0, GC.y, 0); stand.add(meridian);
  stand.position.z = GC.z;
  scene.add(stand);

  // ---------- кораби по глобуса ----------
  const voyages = new Map();
  function buildGlobeStuff() {
    globe.group.add(globeAnchor);
    for (const [id, r] of Object.entries(ROUTES)) {
      const rt = globe.route(r.pts, { color: r.color, width: 0.02 });
      const tok = new THREE.Group();
      const sh = caravel({ lite: true, cross: id !== 'columbus' && id !== 'magellan' });
      sh.scale.setScalar(0.085);
      tok.add(sh);
      tok.userData = { pickId: 'ship-' + id };
      addHitBox(tok, 0.2);
      globe.group.add(tok);
      const lbl = labelSprite(r.label, { size: 0.25, bg: 'rgba(255,255,255,0.92)', border: `#${r.color.toString(16).padStart(6, '0')}` });
      globe.group.add(lbl);
      stage.steadyLabel(lbl, 9);
      voyages.set(id, { id, r, rt, tok, sh, lbl, time: r.pts[0][2], show: false, km: 0 });
    }
    // Стария път: пунктир от къси парчета.
    for (const path of OLD_ROUTES) {
      const segs = [];
      for (let i = 0; i < path.length - 1; i++) segs.push([path[i], path[i + 1]]);
      const pts = [];
      for (const [a, b] of segs) {
        const va = unit(...a), vb = unit(...b), n = Math.ceil(va.angleTo(vb) / 0.012);
        for (let k = 0; k < n; k++) pts.push(va.clone().lerp(vb, k / n).normalize().multiplyScalar(R + 0.02));
      }
      // Пунктир: къси цилиндърчета (InstancedMesh — едно тяло за всички).
      const nd = Math.floor(pts.length / 2);
      const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 5), mat(0xd35400), nd);
      const m4 = new THREE.Matrix4(), qd = new THREE.Quaternion(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < nd; i++) {
        const A = pts[2 * i], B = pts[Math.min(pts.length - 1, 2 * i + 1)];
        const dv = B.clone().sub(A), len = Math.max(1e-4, dv.length());
        qd.setFromUnitVectors(Y, dv.normalize());
        m4.compose(A.clone().add(B).multiplyScalar(0.5), qd, sc.set(1, len, 1));
        im.setMatrixAt(i, m4);
      }
      im.raycast = () => {};
      globe.group.add(im);
    }
    // Керван камили.
    const camels = [0, 1, 2].map(() => {
      const c = animal('horse');
      c.traverse((o) => { if (o.isMesh) o.material = mat(0xc89a5a); });
      const hump = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0xc89a5a)); hump.position.set(-0.02, 0.62, 0); hump.scale.y = 0.8; c.add(hump);
      c.scale.setScalar(0.14);
      const holder = new THREE.Group(); holder.add(c); globe.group.add(holder);
      return { holder, c };
    });
    const camelPath = CARAVAN.map(([lo, la]) => unit(lo, la));
    ticks.push((dt, t) => {
      camels.forEach((m, i) => {
        const u = ((t * 0.02 + i * 0.03) % 1) * (camelPath.length - 1);
        const k = Math.floor(u), f = u - k;
        const v = camelPath[k].clone().lerp(camelPath[k + 1], f).normalize();
        const dir = camelPath[k + 1].clone().sub(camelPath[k]).normalize();
        globe.placeOn(m.holder, v, dir, 0.005);
        for (const [j, l] of m.c.userData.legs.entries()) l.rotation.z = Math.sin(t * 6 + j * Math.PI / 2) * 0.4;
      });
    });
    globe.addPin('lisbon', { lon: -9.14, lat: 38.7, label: 'Лисабон', color: 0x2f6fb0 });
    globe.addPin('oldroute', { lon: 12.4, lat: 45.4, label: 'Венеция', color: 0xd35400 });
    globe.addPin('cape', { lon: 18.47, lat: -34.36, label: 'Нос Добра надежда', color: 0xf2b01e, labelUp: 0.05 });
    globe.addPin('bahamas', { lon: -74.5, lat: 24.05, label: 'Бахамски острови', color: 0xf2b01e });
    globe.addPin('calicut', { lon: 75.78, lat: 11.25, label: 'Каликут (Индия)', color: 0xf2b01e });
    globe.addPin('seville', { lon: -6.35, lat: 36.78, label: 'Испания', color: 0x8e44ad });
    for (const id of ['cape', 'bahamas', 'calicut', 'seville']) globe.showPin(id, false);
    // Надписи на океаните и континентите.
    [['Атлантически океан', -35, 10], ['Атлантически океан', -25, -25], ['Индийски океан', 75, -18], ['Тихи океан', -135, -5], ['Тихи океан', 165, 25]].forEach(([n, lo, la]) => globe.addLabel(n, lo, la, { color: '#16466b' }));
    [['Европа', 15, 52], ['Африка', 20, 5], ['Азия', 90, 45], ['Америка', -100, 42], ['Америка', -60, -10], ['Австралия', 134, -25]].forEach(([n, lo, la]) => globe.addLabel(n, lo, la, { color: '#4b3a22', size: 0.28 }));
    // Морската карта на масата: част от същата рисунка, в цвят на пергамент.
    const chartTex = globe.sphere.material.map.clone();
    chartTex.repeat.set(0.28, 0.42); chartTex.offset.set(0.42, 0.38); chartTex.needsUpdate = true;
    chartMat = new THREE.MeshStandardMaterial({ map: chartTex, color: 0xf0d6a0, roughness: 0.9 });
    const chart = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), chartMat);
    chart.rotation.x = -Math.PI / 2; chart.rotation.z = 0.12; chart.position.set(0.1, 1.06, 0.35);
    table.add(chart);
    for (const s of [-1, 1]) { const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.78, 8), mat(0xe8cf98)); roll.rotation.x = Math.PI / 2; roll.rotation.y = 0.12; roll.position.set(0.1 + s * 0.52, 1.085, 0.35 + s * 0.06); table.add(roll); }
  }
  // Състояние на пътешествията: докъде е всеки кораб в момента time.
  const camTmp = new THREE.Vector3(), nTmp = new THREE.Vector3();
  function setVoyages(time, only) {
    for (const v of voyages.values()) {
      const p = v.r.pts;
      v.show = (!only || only.includes(v.id)) && time >= p[0][2];
      v.time = Math.min(time, p[p.length - 1][2]);
      const st = v.rt.at(v.time);
      v.st = st; v.km = st.km;
      v.rt.draw(v.show ? st.frac : 0);
      v.tok.visible = v.show;
      globe.placeOn(v.tok, st.v, st.dir, 0.01);
      v.lbl.position.copy(st.v).multiplyScalar(R + 0.36);
    }
  }
  ticks.push((dt, t) => {
    if (!globe) return;
    camTmp.copy(stage.camera.position).sub(GC).normalize();
    for (const v of voyages.values()) {
      v.sh.position.y = Math.sin(t * 2 + v.r.color) * 0.004;
      animateShip(v.sh, t, 1);
      nTmp.copy(v.lbl.position).normalize().applyQuaternion(globe.group.quaternion);
      v.lbl.visible = v.show && v.labelOn !== false && nTmp.dot(camTmp) > 0.2;
    }
  });
  const kmLabel = (v) => `${v.r.label} · ${fmtKm(v.km)}`;
  function relabel(v, text) {
    const key = text;
    if (v.lblText === key) return;
    v.lblText = key;
    const fresh = labelSprite(text, { size: 0.25, bg: 'rgba(255,255,255,0.92)', border: `#${v.r.color.toString(16).padStart(6, '0')}` });
    v.lbl.material.map.dispose(); v.lbl.material.map = fresh.material.map; v.lbl.scale.copy(fresh.scale); v.lbl.userData.baseScale.copy(fresh.scale); v.lbl.material.needsUpdate = true;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    setVoyages(1480, []);
    for (const v of voyages.values()) { v.labelOn = true; relabel(v, v.r.label); }
    for (const id of ['cape', 'bahamas', 'calicut', 'seville']) { globe.showPin(id, false); globe.colorPin(id); }
    globe.follow(null);
    globe.face(-5, 25);
    shell.task('Пристанището на Лисабон в края на XV в. Разгледай кораба, уредите и подправките, а на глобуса — стария път на подправките. Избери от менюто или кликни върху тях.');
    const seen = new Set();
    const open = (id) => {
      const it = ITEMS.find((x) => x.id === id);
      if (!it) return;
      let anchor;
      if (GLOBE_AT[id]) {
        const [lo, la] = GLOBE_AT[id];
        globe.face(lo, id === 'globe' ? la : la - 6);
        globeView(id === 'globe' ? 6.2 : 2.6);
        if (id === 'globe') anchor = meridian;
        else { globeAnchor.position.copy(globe.pos(lo, la - 15, 0.05)); anchor = globeAnchor; }
      } else {
        const obj = id === 'caravel' ? ship : id === 'sail' ? sailAnchor : id === 'compass' ? comp : id === 'astrolabe' ? frame : goods;
        const d = { caravel: [9, 1.6, 2.0], sail: [5.5, 0.6, 0], compass: [2.4, 1.6, 0.5], astrolabe: [2.6, 1.0, 0.5], spices: [5.2, 2.2, 0.6] }[id];
        stage.focusOn(obj, { dist: d[0] * far, height: d[1] * far, keepFollow: false, lift: d[2] });
        anchor = obj;
      }
      say(anchor, it.note, { cls: 'wide', lift: id === 'globe' ? 3.4 : id === 'caravel' ? 3.6 : GLOBE_AT[id] ? 0 : id === 'sail' ? 0.9 : 0.6 });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${ITEMS.length}`);
      if (seen.size === ITEMS.length) {
        const ctl = shell.setControls('<button class="btn primary">Напред →</button>');
        ctl.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: ITEMS.map(({ id, label, icon }) => ({ id, label, icon })), onSelect: open });
    clickHandler = (id) => { if (id) open(id); };
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${ITEMS.length}`);
  }

  // ---------- 2. Плъзгач по годините ----------
  const T0 = 1487.5, MONTHS_N = 132;
  const EVENTS = [
    { t: 1487.6, text: '1487 г. — Диаш тръгва от Лисабон', at: [-9.14, 38.7] },
    { t: 1488.05, text: 'Началото на 1488 г. — Диаш заобикаля Африка', at: [20, -36] },
    { t: 1492.59, text: '3 август 1492 г. — Колумб тръгва от Испания', at: [-6.9, 37.1] },
    { t: 1492.78, text: '12 октомври 1492 г. — Колумб стига до острови отвъд океана', at: [-74.5, 24.05] },
    { t: 1497.52, text: '8 юли 1497 г. — да Гама тръгва от Лисабон', at: [-9.14, 38.7] },
    { t: 1497.89, text: 'Ноември 1497 г. — да Гама заобикаля нос Добра надежда', at: [18.4, -34.6] },
    { t: 1498.38, text: 'Май 1498 г. — да Гама стига до Индия', at: [75.6, 11.25] },
  ];
  const evAnchor = new THREE.Object3D();
  function step2() {
    shell.step(1);
    for (const id of ['cape', 'bahamas', 'calicut']) globe.showPin(id, true);
    globeView(6.0);
    let mistakes = 0, k = 0, tries = 0, lastEv = null, faceIdx = -1;
    const c = shell.setControls(`<label class="small">Време: <b class="yr"></b></label>
      <input class="yr-range" type="range" min="0" max="${MONTHS_N}" step="1" value="0" style="width:100%" aria-label="Време">
      <div class="small kms" style="display:flex;gap:10px;flex-wrap:wrap"></div>
      <p class="small">Премествай плъзгача: корабите плават, а числата показват изминатия път.</p>`);
    const range = c.querySelector('.yr-range');
    const update = () => {
      const t = T0 + +range.value / 12;
      c.querySelector('.yr').textContent = monthOf(t);
      setVoyages(t, ['dias', 'columbus', 'gama']);
      const shown = [...voyages.values()].filter((v) => v.show);
      for (const v of shown) relabel(v, kmLabel(v));
      c.querySelector('.kms').innerHTML = ['dias', 'columbus', 'gama'].map((id) => { const v = voyages.get(id); return `<span style="color:#${v.r.color.toString(16).padStart(6, '0')}"><b>${esc(v.r.label)}:</b> ${v.show ? fmtKm(v.km) : '—'}</span>`; }).join('');
      // Глобусът се обръща към кораба, който плава в момента.
      let fi = 0; FACE2.forEach(([ft], i) => { if (t >= ft) fi = i; });
      if (fi !== faceIdx) { faceIdx = fi; globe.face(FACE2[fi][1], FACE2[fi][2]); }
      const ev = [...EVENTS].reverse().find((e) => e.t <= t && t - e.t <= 0.45);
      if (ev !== lastEv) {
        lastEv = ev;
        if (!ev) clearEv();
        else {
          if (evAnchor.parent !== globe.group) globe.group.add(evAnchor);
          evAnchor.position.copy(globe.pos(ev.at[0], ev.at[1] - 11, 0.05));
          if (!evTip) evTip = stage.bubble(evAnchor, '', { lift: 0, cls: 'tag' });
          evTip.set(esc(ev.text));
        }
      }
    };
    range.addEventListener('input', () => { clearTip(); update(); });
    update();
    const ask = () => { shell.task(TASKS[k].ask); shell.score(`Задачи: ${k} от ${TASKS.length}`); };
    ask();
    clickHandler = (id) => {
      if (!id || id === 'globe' || k >= TASKS.length || !WRONG[id]) return;
      const T = TASKS[k], t = T0 + +range.value / 12;
      if (id === T.id && t < T.t - 1e-3) { mistakes++; tries++; shell.msg(T.early, 'bad'); return; }
      if (id !== T.id) {
        mistakes++; tries++;
        shell.msg(`${(WRONG_BY_TASK[T.id] || {})[id] || WRONG[id]} Опитай пак.`, 'bad');
        if (tries >= 2) say(T.id.startsWith('ship-') ? voyages.get(T.id.slice(5)).tok : globe.pins.get(T.id), 'Подсказка: тук', { cls: 'tag', lift: 0.3 });
        return;
      }
      tries = 0;
      const anchor = T.id.startsWith('ship-') ? voyages.get(T.id.slice(5)).tok : globe.pins.get(T.id);
      say(anchor, T.good + SCHEME, { cls: 'good wide', lift: 0.35 });
      if (!T.id.startsWith('ship-')) globe.colorPin(T.id, 0x14bf96);
      shell.msg('Вярно!', 'good');
      k++;
      if (k < TASKS.length) { ask(); return; }
      scores.push(stepScore(mistakes, 3));
      shell.score(`Задачи: ${TASKS.length} от ${TASKS.length}`);
      shell.task('Ти проследи трите пътешествия: Диаш показва пътя около Африка, Колумб стига до Америка, а да Гама — до Индия. Можеш още да местиш плъзгача.');
      clickHandler = null;
      const n = document.createElement('button');
      n.className = 'btn primary'; n.textContent = 'Напред →';
      n.addEventListener('click', () => { clearTip(); clearEv(); step3(); });
      shell.controls.appendChild(n);
    };
  }

  // ---------- 3. Причина или последица ----------
  let cards = [], zones = {}, foodCrate = null;
  const sortMid = new THREE.Object3D();
  scene.add(sortMid);
  function wrap(text, max) {
    const out = []; let line = '';
    for (const w of text.split(' ')) { if (line && (line + ' ' + w).length > max) { out.push(line); line = w; } else line = line ? line + ' ' + w : w; }
    if (line) out.push(line);
    return out;
  }
  function buildSorting() {
    const zx = narrow ? 1.45 : 3.4, zz = narrow ? 4.0 : 3.65, zr = narrow ? 1.3 : 1.45;
    sortMid.position.set(0, Q + 0.3, narrow ? 1.2 : 1.6);
    zones = {
      cause: { ring: zoneRing(0x2b6cb0, zr), label: 'Причини', pos: new THREE.Vector3(-zx, Q + 0.02, zz) },
      effect: { ring: zoneRing(0xc0392b, zr), label: 'Последици', pos: new THREE.Vector3(zx, Q + 0.02, zz) },
    };
    for (const z of Object.values(zones)) {
      z.ring.position.copy(z.pos);
      z.ring.userData.zoneId = z.label;
      const l = labelSprite(z.label, { size: narrow ? 0.34 : 0.3, bg: 'rgba(255,255,255,0.95)' });
      l.position.set(z.pos.x, Q + 0.5, z.pos.z + zr + 0.25);
      z.group = new THREE.Group(); z.group.add(z.ring, l);
      z.group.visible = false; z.n = 0;
      scene.add(z.group);
    }
    const order = [0, 4, 1, 5, 2, 6, 3, 7];
    const cols = narrow ? 2 : 4;
    cards = order.map((k, i) => {
      const d = CARDS[k];
      const col = i % cols, row = Math.floor(i / cols);
      const x = narrow ? (col - 0.5) * 2.5 : (col - 1.5) * 2.75;
      const z = narrow ? -1.6 + row * 1.12 : 0.0 + row * 1.15;
      const g = new THREE.Group();
      const lines = wrap(d.label, narrow ? 15 : 18);
      const lbls = lines.map((t) => labelSprite(t, { size: narrow ? 0.28 : 0.3, border: 'rgba(0,0,0,0)', bg: 'rgba(255,255,255,0)' }));
      const w = Math.max(2.1, Math.max(...lbls.map((l) => l.scale.x)) + 0.16), dep = 0.22 + lines.length * (narrow ? 0.29 : 0.3);
      const board = box(Math.min(w, narrow ? 2.4 : 2.65), 0.06, dep, mat(0xfff4d6)); g.add(board);
      const edge = box(Math.min(w, narrow ? 2.4 : 2.65) + 0.06, 0.04, dep + 0.06, mat(0xa98b5a)); edge.position.y = -0.02; g.add(edge);
      const lh = narrow ? 0.29 : 0.3;
      lbls.forEach((l, j) => { l.position.set(0, 0.3, (j - (lines.length - 1) / 2) * lh); g.add(l); });
      g.position.set(x, Q + 0.25, z);
      g.userData = { dragId: d.id, pickId: d.id, home: g.position.clone(), card: d, board };
      addHitBox(g, 0.5);
      g.visible = false;
      scene.add(g);
      return g;
    });
    // Сандък с растенията от Америка — появява се при вярната последица.
    foodCrate = crate(1.1, 0.7, 0.3);
    [[potato(), -0.3, -0.12], [corn(), 0.1, 0.15], [tomato(), 0.3, -0.15], [cocoa(), -0.2, 0.18], [potato(), 0.05, -0.05]].forEach(([o, x, z]) => { o.scale.setScalar(1.3); o.position.set(x, 0.05, z); foodCrate.add(o); });
    const fl = labelSprite('Растения от Америка', { size: 0.22 }); fl.position.y = 0.75; foodCrate.add(fl);
    foodCrate.position.set(narrow ? zx : zx + 2.0, Q, narrow ? zz + 2.0 : zz);
    foodCrate.visible = false;
    scene.add(foodCrate);
  }
  function step3() {
    shell.step(2);
    shell.score('');
    globe.follow(null);
    globe.face(-30, 15);
    if (narrow) stage.flyTo(VIEW3[0], VIEW3[1], 1.1); else view(VIEW3[0], VIEW3[1], 1.1);
    for (const z of Object.values(zones)) { z.group.visible = true; z.n = 0; }
    for (const g of cards) { g.visible = true; g.position.copy(g.userData.home); g.scale.setScalar(1); g.userData.locked = false; g.userData.board.material.color.setHex(0xfff4d6); }
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Кое е <b>причина</b> за Великите географски открития и кое е тяхна <b>последица</b>? Завлечи всяка карта в правилния кръг.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${CARDS.length}`);
    clickHandler = null;
    const zoneAt = (p) => Object.entries(zones).find(([, z]) => Math.hypot(p.x - z.pos.x, p.z - z.pos.z) < z.ring.userData.radius + 0.25)?.[0];
    stopDrag = stage.enableDrag({
      planeY: Q + 0.25,
      onDrop(obj) {
        const d = obj.userData.card;
        const zid = zoneAt(obj.position);
        if (!zid) { obj.position.copy(obj.userData.home); return; }
        if (zid === d.bin) {
          const z = zones[zid];
          obj.position.set(z.pos.x, Q + 0.25 + z.n * 0.02, z.pos.z - 0.9 + z.n * 0.6);
          obj.scale.setScalar(0.58);
          z.n++;
          obj.userData.locked = true;
          obj.userData.board.material.color.setHex(zid === 'cause' ? 0xdbe8f8 : 0xf8dfdb);
          placed++;
          shell.score(`Подредени: ${placed} от ${CARDS.length}`);
          shell.msg('Вярно!', 'good');
          if (d.id === 'e-food') { foodCrate.visible = true; say(foodCrate, 'От Америка в Европа идват картофът, царевицата, доматите, какаото, тютюнът. С времето те стават обикновена храна и у нас.', { cls: 'good wide', lift: 0.9 }); }
          if (d.id === 'e-native') say(obj, 'Испанските завоеватели (конкистадори) завладяват държавите на ацтеките и инките. Много местни жители загиват във войни и от болести, донесени от Европа, срещу които нямат защита.', { cls: 'wide', lift: 0.4 });
          if (placed === CARDS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 3));
            say(sortMid, '<b>Причини → последици.</b> Скъпите подправки и трудните пътища по суша карат европейците да търсят морски път, а новите кораби и уреди го правят възможен. Резултатът: нови земи и колонии, нови храни, тежка съдба за местните народи. Търговията се мести към Атлантическия океан — Лисабон и Севиля растат, а Венеция постепенно губи значение.', { cls: 'good wide', lift: 0.2 });
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[d.id] = (tries[d.id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(d.why, 'bad');
          if (tries[d.id] >= 2) say(zones[d.bin].ring, 'Подсказка: тук', { cls: 'tag', lift: 0.5 });
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  let playing = null;
  function step4() {
    shell.step(3);
    shell.score('');
    for (const z of Object.values(zones)) z.group.visible = false;
    for (const g of cards) g.visible = false;
    foodCrate.visible = false;
    for (const id of ['cape', 'bahamas', 'calicut']) globe.showPin(id, false);
    globe.showPin('seville', true);
    const mag = voyages.get('magellan');
    setVoyages(ROUTES.magellan.pts[0][2], ['magellan']);
    relabel(mag, mag.r.label);
    mag.labelOn = false;
    globe.face(-20, 25);
    globeView(6.0);
    say(globe.pins.get('seville'), '<b>20 септември 1519 г.</b> Фернандо Магелан — португалец на служба при испанския крал — тръгва от Испания с пет кораба на запад. Иска да стигне до Островите на подправките, като заобиколи Америка.', { cls: 'wide', lift: 0.3 });
    let mistakes = 0, done = false;
    shell.task('Ако корабите плават все на запад и се върнат у дома, <b>какво ще докаже това пътуване?</b>');
    const c = shell.setControls(`<div class="col">${OPTIONS.map((o) => `<button class="btn" data-id="${o.id}">${esc(o.label)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const o = OPTIONS.find((x) => x.id === b.dataset.id);
      if (done || b.disabled) return;
      if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
      done = true;
      scores.push(stepScore(mistakes, 2));
      c.querySelectorAll('button').forEach((x) => { x.disabled = true; });
      shell.msg('Да видим какво наистина става.', 'good');
      play(mag);
    }));
  }
  function play(mag) {
    clearTip();
    const pts = ROUTES.magellan.pts, t0 = pts[0][2], t1 = pts[pts.length - 1][2], DUR = 16;
    let k = 0, evI = -1;
    const kmEl = document.createElement('p');
    kmEl.className = 'small mag-km';
    shell.controls.appendChild(kmEl);
    globeView(5.6);
    mag.labelOn = true;
    const evA = new THREE.Object3D();
    globe.group.add(evA);
    playing = stage.tick((dt) => {
      k = Math.min(1, k + dt / DUR);
      const t = t0 + (t1 - t0) * k;
      setVoyages(t, ['magellan']);
      const st = mag.st;
      const lon = Math.atan2(-st.v.z, st.v.x) * 180 / Math.PI, lat = Math.asin(Math.max(-1, Math.min(1, st.v.y))) * 180 / Math.PI;
      globe.follow(() => [lon, lat]);
      kmEl.innerHTML = `<b>${monthOf(t)}</b> · изминати ≈ ${fmtKm(mag.km)}`;
      let ei = -1; MAG_EVENTS.forEach((e, i) => { if (t >= e.t) ei = i; });
      if (ei !== evI) {
        evI = ei;
        evA.position.copy(st.v).multiplyScalar(R + 0.1);
        if (!evTip) evTip = stage.bubble(evA, '', { lift: 0.35, cls: 'tag' });
        evTip.set(esc(MAG_EVENTS[ei].text));
      }
      if (k >= 1) finishPlay(mag);
    });
  }
  function finishPlay(mag) {
    if (playing) { playing(); playing = null; }
    globe.follow(null);
    globe.face(-6.4, 30);
    mag.labelOn = false;
    clearEv();
    say(globe.pins.get('seville'), `<b>Така и става.</b> На 6 септември 1522 г. корабът „Виктория“, воден от Хуан Себастиан Елкано, се връща в Испания — само един от петте кораба, с малка част от моряците. Това е първото плаване около света. То доказва на практика, че Земята е кълбо, че океаните са свързани и че светът е много по-голям, отколкото са мислели. Моряците откриват и че в дневника им липсва един ден — защото са плавали все на запад, след Слънцето.${SCHEME}`, { cls: 'good wide', lift: 0.3 });
    shell.msg(`Обиколката трае почти три години — около ${fmtKm(mag.km)} по нашата схема.`, 'good');
    const n = document.createElement('button');
    n.className = 'btn primary'; n.textContent = 'Виж резултата';
    n.addEventListener('click', () => {
      clearTip();
      const ratio = scores.reduce((a, s) => a + s, 0) / scores.length;
      shell.finish(ratio, onComplete, restart);
    });
    shell.controls.appendChild(n);
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    if (playing) { playing(); playing = null; }
    clearTip(); clearEv();
    if (menu) menu.remove();
    globe.showPin('seville', false);
    for (const z of Object.values(zones)) z.group.visible = false;
    for (const g of cards) { g.visible = false; g.position.copy(g.userData.home); g.scale.setScalar(1); g.userData.locked = false; }
    foodCrate.visible = false;
    view(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  shell.task('Зареждане на глобуса…');
  createGlobe(stage, { radius: R, center: GC.toArray(), tex: narrow ? 2048 : 2048 })
    .then((g) => {
      globe = g;
      globe.face(-5, 25, { instant: true });
      buildGlobeStuff();
      buildSorting();
      const note = document.createElement('div');
      note.className = 'map-approx';
      note.textContent = narrow ? 'Глобусът: днешни граници (за ориентир)' : 'Глобусът показва днешните брегове и граници — само за ориентир.';
      Object.assign(note.style, { position: 'absolute', ...(narrow ? { left: '8px', bottom: '34px' } : { right: '8px', bottom: '8px' }), zIndex: 3, padding: '3px 8px', borderRadius: '6px',
        background: 'rgba(255,255,255,0.9)', border: '1px solid #c7d3e0', font: '600 12px/1.3 system-ui, sans-serif', color: '#44505c', pointerEvents: 'none' });
      shell.stageEl.appendChild(note);
      step1();
    })
    .catch((e) => shell.msg(`Глобусът не се зареди: ${e.message}`, 'bad'));

  container.__demo = {
    stage, get globe() { return globe; },
    at: (id) => stage.screenOf(id),
  };
  return { dispose() { if (stopDrag) stopDrag(); if (playing) playing(); if (menu) menu.remove(); if (globe) globe.dispose(); stage.dispose(); } };
}
