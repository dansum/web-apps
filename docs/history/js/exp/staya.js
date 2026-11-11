// 4.2.5 „Технологиите променят всекидневието“ — една и съща стая през 1900, 1960 и 2020 г.
// Детето стои в стаята, а плъзгачът сменя годината: осветлението, готвенето, прането, храната,
// връзката с близките, забавленията и улицата отвън се сменят пред очите му.
// Стъпки: опознай стаята в трите години → пренеси уред в друго време (ще работи ли?) →
// подреди предметите по време → предскажи какво заменя газената лампа и писмото.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { folkPerson, leafTree, revivalHouse } from './hist/revival.js';
import { worker } from './hist/industrial.js';
import { cart, mergeStatic } from './hist/medieval.js';
import { smoke, cloud } from './hist/bulgar.js';
import {
  HM, screenCanvas, room, windowFrame, woodStove, electricStove, modernKitchen, pantry1900, fridge1960, fridge2020,
  trough, washer1960, washer2020, keroseneLamp, bulbLamp, ledLamp, table, chair, seat, cabinet,
  letterSet, rotaryPhone, smartphone, router, books1900, radio1960, tv1960, tv2020, tablet, gameConsole,
  pole, wire, streetLight, panelBlock, bus, car, bicycle, homePerson,
} from './hist/home.js';

const tag = (s) => `<br><span class="small"><b>${s}</b></span>`;
const REC = tag('Обобщена възстановка: такива предмети има в музеите и на старите снимки.');
const TODAY = tag('Днешен вид.');

const EPOCHS = [
  { id: 'e1900', label: '1900 г.', when: 'преди повече от 100 години' },
  { id: 'e1960', label: '1960 г.', when: 'когато баба и дядо са деца' },
  { id: 'e2020', label: '2020 г.', when: 'днес' },
];
// Местата в стаята и какво казва балончето във всяка година.
const PLACES = [
  { id: 'light', label: 'Осветление', icon: '💡', notes: [
    `Газена лампа. Фитилът гори с газ, а стъклото пази пламъка. Светлината е слаба. В къщата още няма ток. ${REC}`,
    `Електрическа крушка. В къщата вече има ток. С едно копче стаята светва — без огън и без мирис. ${REC}`,
    `Светодиодна лампа. Тя свети силно, а харчи много по-малко ток от старата крушка. ${TODAY}`,
  ] },
  { id: 'cook', label: 'Готвене', icon: '🍲', notes: [
    `Печка на дърва. На нея се готви, а тя топли и стаята. Дървата се цепят и се носят отвън. Готвенето отнема много време. ${REC}`,
    `Електрическа печка с котлони и фурна. Не трябват дърва: котлонът се включва с копче. ${REC}`,
    `Кухня с котлони и микровълнова печка. Микровълновата затопля храната за минути. ${TODAY}`,
  ] },
  { id: 'cold', label: 'Храната', icon: '🥫', notes: [
    `Тук няма хладилник. Храната се пази в зимника — хладно мазе. Зеленчуците се правят на туршия, а чушките се сушат. ${REC}`,
    `Хладилник. Храната остава свежа по-дълго. Тогава хладилникът е нов и скъп уред и не всеки дом има такъв. ${REC}`,
    `Голям хладилник с фризер. Днес почти всеки дом има хладилник. ${TODAY}`,
  ] },
  { id: 'wash', label: 'Пране', icon: '🧺', notes: [
    `Пране на ръка в дървено корито с дъска. Водата се носи от чешмата и се топли на печката. Прането отнема много часове. ${REC}`,
    `Пералня. Тя върти прането във водата вместо нас. Но изплакването и изстискването още са на ръка. ${REC}`,
    `Автоматична пералня. Тя пере, изплаква и изцежда сама. Ние само слагаме прането и натискаме копче. ${TODAY}`,
  ] },
  { id: 'talk', label: 'Връзка с близките', icon: '✉️', notes: [
    `Писмо, мастило и перо. Писмото пътува с пощата дни наред. За бърза вест хората пращат телеграма от пощата. ${REC}`,
    `Телефон с шайба. Набираш номера, като въртиш шайбата. Тогава домашен телефон имат малко семейства. Много хора звънят от пощата. ${REC}`,
    `Смартфон и рутер за интернет. Говорим, пишем съобщения и се виждаме с близки по целия свят. ${TODAY}`,
  ] },
  { id: 'fun', label: 'Забавления', icon: '🎶', notes: [
    `Книги и кавал. Вечер хората четат, пеят и разказват. Събират се на седянки и в читалището. ${REC}`,
    `Радио и телевизор. Радиото носи новини и музика. Българската телевизия започва в края на 1959 г. Телевизорът е черно-бял и е голяма новост. ${REC}`,
    `Плосък телевизор, игрова конзола и таблет. По интернет гледаме филми, слушаме музика и играем с приятели. ${TODAY}`,
  ] },
  { id: 'street', label: 'Улицата отвън', icon: '🪟', notes: [
    `Улицата е от пръст. Хората ходят пеша или пътуват с каруца. Няма стълбове с жици. ${REC}`,
    `Улицата е с асфалт. Минават автобус и велосипед. По жиците на стълбовете идва токът. Лека кола имат малко хора. ${REC}`,
    `Колите са много. Уличните лампи са светодиодни. Блокът отсреща е с нова изолация и боя. ${TODAY}`,
  ] },
];
// Стъпка 2: уреди, които детето пренася в друго време.
const TRIPS = [
  { item: 'v-bulb', name: 'крушката', era: 0, q: 'Ще светне ли крушката през 1900 г.?', opts: [
    { t: 'Да. Крушката свети винаги.', ok: false, why: 'Крушката не гори като лампата. Тя свети само когато по жиците идва ток.' },
    { t: 'Не. В къщата още няма ток.', ok: true },
  ], works: false, after: '<b>Крушката не светва.</b> В къщата няма жици и няма ток. Затова тук светят с газена лампа.' },
  { item: 'v-lamp', name: 'газената лампа', era: 2, q: 'Ще свети ли газената лампа през 2020 г.?', opts: [
    { t: 'Не. Днес тя не може да свети.', ok: false, why: 'Помисли от какво има нужда лампата: газ и огън. А те има и днес.' },
    { t: 'Да. Тя гори с газ и не иска ток.', ok: true },
  ], works: true, after: '<b>Лампата свети.</b> Тя не иска ток. Но днес светим с ток: така е по-лесно и по-безопасно.' },
  { item: 'v-phone', name: 'смартфона', era: 1, q: 'Ще можеш ли да се обадиш със смартфона през 1960 г.?', opts: [
    { t: 'Да. В къщата има ток, значи ще работи.', ok: false, why: 'С тока можеш само да го заредиш. За разговор телефонът търси мобилна мрежа.' },
    { t: 'Не. Още няма мобилна мрежа и интернет.', ok: true },
  ], works: false, after: '<b>Екранът казва „Няма мрежа“.</b> Мобилните мрежи в България се появяват чак през 1990-те години.' },
  { item: 'v-fridge', name: 'днешния хладилник', era: 1, q: 'Ще работи ли днешният хладилник през 1960 г.?', opts: [
    { t: 'Не. Тогава няма хладилници.', ok: false, why: 'Погледни стаята през 1960 г. — там вече има хладилник. А в къщата има ток.' },
    { t: 'Да. В къщата има ток.', ok: true },
  ], works: true, after: '<b>Хладилникът работи.</b> В къщата има ток. Но тогава хладилниците са малки, а такъв голям няма.' },
];
// Стъпка 3: предмети за подреждане по годината, в която за първи път ги има в стаята.
const CARDS = [
  { id: 'k-lamp', label: 'Газена лампа', era: 0 },
  { id: 'k-trough', label: 'Корито', era: 0 },
  { id: 'k-letter', label: 'Писмо и перо', era: 0 },
  { id: 'k-radio', label: 'Радио', era: 1 },
  { id: 'k-rotary', label: 'Телефон с шайба', era: 1 },
  { id: 'k-tv60', label: 'Телевизор с антена', era: 1 },
  { id: 'k-phone', label: 'Смартфон', era: 2 },
  { id: 'k-micro', label: 'Микровълнова', era: 2 },
  { id: 'k-tablet', label: 'Таблет', era: 2 },
];
const CARD_ORDER = [4, 0, 7, 5, 2, 8, 1, 3, 6]; // разбъркан ред на масата (постоянен — за теста)
const PREDICT1 = [
  { t: 'Електрическа крушка.', ok: true },
  { t: 'Свещ.', ok: false, why: 'Свещта е още по-стара от газената лампа. И тя гори с огън, а не с ток.' },
  { t: 'Телевизор.', ok: false, why: 'Телевизорът показва образ, но не осветява стаята.' },
];
const PREDICT2 = [
  { t: 'С телеграма от пощата.', ok: false, why: 'Телеграмата е по-бърза от писмото, но е само кратък текст. Тя има и през 1900 г.' },
  { t: 'С видеоразговор по смартфона.', ok: true },
  { t: 'С пощенски гълъб.', ok: false, why: 'Гълъбът е още по-бавен и несигурен от пощата.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Стаята през годините', 'Пренеси в друго време', 'Подреди по време', 'Предскажи'] });
  const stage = createStage(shell.stageEl, { background: 0xcfe6f7, camPos: [3.6, 3.3, 6.4], target: [-0.1, 1.0, -0.6], minDistance: 0.3, maxDistance: 22, maxPolarAngle: Math.PI * 0.53 });
  const { scene } = stage;
  stage.hemi.intensity = 1.25;
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.3 / Math.max(aspect, 0.55) : 1;
  const view = (pos, tgt, dur = 1, k = far) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur);
  const named = {};
  const marker = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  const put = (parent, obj, x, z, ry = 0, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; parent.add(obj); return obj; };
  const ms = (obj, keys = []) => mergeStatic(obj, keys.flatMap((k) => [].concat(obj.userData[k] ?? [])).map((o) => (o.isVector3 ? null : o)).filter(Boolean));

  // ---------- стаята ----------
  const R = room();
  scene.add(R);
  const { W, D, H } = R.userData;
  const WIN = { x0: -0.2, x1: 1.4, y0: 0.9, y1: 2.1 };
  const winC = [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, -D / 2 - 0.08];
  const frames = [0, 1, 2].map((s) => { const f = windowFrame(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, s); f.position.set(...winC); scene.add(f); return f; });
  // Земята отвън.
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), HM(null, { color: 0x8aa860 }));
  outside.rotation.x = -Math.PI / 2; outside.position.set(0, -0.02, -28); scene.add(outside);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), HM(null, { color: 0x9ab870 }));
  front.rotation.x = -Math.PI / 2; front.position.set(0, -0.12, 22); scene.add(front);
  const clouds = [[-8, 11, -26], [6, 13, -30], [16, 12, -22]].map(([x, y, z]) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(2.4); scene.add(c); return c; });

  // ---------- трите години ----------
  const groups = EPOCHS.map(() => { const g = new THREE.Group(); g.userData.k = 0; scene.add(g); return g; });
  const live = EPOCHS.map(() => ({}));
  const people = EPOCHS.map(() => []);
  const human = (e, obj, x, z, ry, s) => { obj.scale.multiplyScalar(s); put(groups[e], obj, x, z, ry); obj.userData.home = obj.position.clone(); obj.userData.ry = ry; people[e].push(obj); return obj; };
  // Местата (общи за трите години).
  const P = {
    cook: [-2.62, -1.55], cold: [-2.62, -0.2], wash: [-2.55, 1.35], table: [0.45, 0.45],
    talk: [2.25, -1.9], fun: [-1.2, -1.92], seat: [2.55, 0.55], cal: [2.25, -2.19],
  };
  const TOP = 0.79; // горе на масата
  const ADULT = [1.35, -0.6], KID = [-0.3, 1.4]; // хората стоят встрани от погледа към местата
  // Екрани.
  const scrPhone = screenCanvas(128, 256), scrNoNet = screenCanvas(128, 256), scrTV = screenCanvas(256, 150), scrTV60 = screenCanvas(128, 96), scrTab = screenCanvas(192, 128);
  drawPhone(scrPhone, 'home'); drawNoNet(scrNoNet);
  // Календар на стената с годината.
  const calendars = EPOCHS.map((E, e) => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 160;
    const x = c.getContext('2d');
    x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, 128, 160);
    x.fillStyle = ['#8a2f22', '#2f5a8a', '#2f7a4a'][e]; x.fillRect(0, 0, 128, 42);
    x.fillStyle = '#fff'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.fillText(E.label.replace(' г.', ''), 64, 34);
    x.fillStyle = '#556'; for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) x.fillRect(10 + k * 16, 56 + r * 20, 10, 10);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), new THREE.MeshBasicMaterial({ map: t }));
    m.position.set(P.cal[0], 1.75, P.cal[1] + 0.012); groups[e].add(m);
    return m;
  });
  void calendars;

  // 1900
  {
    const g = groups[0], L = live[0];
    const st = ms(woodStove(), ['fire']); L.fire = st.userData.fire; L.steam = st.userData.steam; put(g, st, P.cook[0], P.cook[1], Math.PI / 2);
    put(g, ms(pantry1900()), P.cold[0] + 0.05, P.cold[1], Math.PI / 2);
    const tr = ms(trough(), ['water']); L.water = tr.userData.water; put(g, tr, P.wash[0] + 0.1, P.wash[1], Math.PI / 2);
    put(g, ms(table(0)), P.table[0], P.table[1]);
    for (const [dx, dz, ry] of [[-0.35, 0.6, Math.PI], [0.35, -0.6, 0]]) put(g, ms(chair(0)), P.table[0] + dx, P.table[1] + dz, ry);
    const lamp = ms(keroseneLamp(), ['flame']); L.flame = lamp.userData.flame; put(g, lamp, P.table[0] - 0.15, P.table[1] - 0.05, 0, TOP);
    put(g, ms(cabinet(0, 1.0, 0.75)), P.talk[0], P.talk[1] + 0.05);
    put(g, ms(letterSet()), P.talk[0] - 0.05, P.talk[1] + 0.08, 0, 0.75);
    put(g, ms(books1900()), P.fun[0], P.fun[1] + 0.03, 0, 1.25);
    put(g, ms(seat(0, 1.6)), P.fun[0], P.fun[1] + 0.28);
    put(g, ms(seat(0, 1.4)), P.seat[0], P.seat[1], -Math.PI / 2);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.01, 2.2), HM('cherga', { rep: [1, 2] })); rug.position.set(0.4, 0.005, 0.5); g.add(rug);
    // Икона в ъгъла и кърпа.
    const icon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.02), HM(null, { color: 0xc9a640, metal: 0.5, rough: 0.4 })); icon.position.set(-W / 2 + 0.01, 2.05, -1.0); icon.rotation.y = Math.PI / 2; g.add(icon);
    const iconIn = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.22), HM(null, { color: 0x7a2f22 })); iconIn.position.set(-W / 2 + 0.025, 2.05, -1.0); iconIn.rotation.y = Math.PI / 2; g.add(iconIn);
    // Хората.
    human(0, folkPerson('woman'), ADULT[0], ADULT[1], -Math.PI / 2, 2.5);
    human(0, folkPerson('girl'), KID[0], KID[1], -Math.PI * 0.75, 2.6);
    // Отвън: черен път, къщи от Възраждането, каруца.
    const road = new THREE.Mesh(new THREE.BoxGeometry(80, 0.02, 4), HM(null, { color: 0xa88e68, rough: 1 })); road.position.set(0, 0, -6.3); g.add(road);
    for (const [x, c] of [[-7, 0x3f6fae], [1.5, 0xd9a441], [10, 0xb5533c]]) { const h = ms(revivalHouse({ w: 1.6, d: 1.2, color: c, erker: x === 1.5 })); h.scale.setScalar(2.7); put(g, h, x, -12); }
    for (const [x, z] of [[-3, -10.5], [6, -10.8], [-12, -9]]) { const t = leafTree(1.0); t.scale.setScalar(3); put(g, t, x, z); }
    const ct = cart(); ct.scale.setScalar(2.6); g.add(ct); L.vehicles = [{ o: ct, z: -5.6, speed: 0.9, dir: 1, len: 5 }];
  }
  // 1960
  {
    const g = groups[1], L = live[1];
    const st = ms(electricStove(), ['hot']); L.hot = st.userData.hot; L.steam = st.userData.steam; put(g, st, P.cook[0] + 0.04, P.cook[1], Math.PI / 2);
    put(g, ms(fridge1960()), P.cold[0], P.cold[1], Math.PI / 2);
    const ws = ms(washer1960(), ['agit', 'water']); L.agit = ws.userData.agit; put(g, ws, P.wash[0] + 0.05, P.wash[1] + 0.15, Math.PI / 2);
    put(g, ms(table(1)), P.table[0], P.table[1]);
    for (const [dx, dz, ry] of [[-0.35, 0.6, Math.PI], [0.35, -0.6, 0]]) put(g, ms(chair(1)), P.table[0] + dx, P.table[1] + dz, ry);
    const lb = ms(bulbLamp(0.85), ['bulb']); L.bulb = lb.userData.bulb; put(g, lb, P.table[0], P.table[1], 0, H);
    put(g, ms(cabinet(1, 1.0, 0.75)), P.talk[0], P.talk[1] + 0.05);
    put(g, ms(rotaryPhone(0x1b1b1f)), P.talk[0] + 0.15, P.talk[1] + 0.05, 0, 0.75);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.2), HM(null, { color: 0xf4ecd8 })); pad.position.set(P.talk[0] - 0.22, 0.756, P.talk[1] + 0.08); g.add(pad);
    put(g, ms(cabinet(1, 1.5, 0.55)), P.fun[0], P.fun[1] + 0.05);
    const rd = ms(radio1960(), ['dial']); L.dial = rd.userData.dial; put(g, rd, P.fun[0] - 0.38, P.fun[1] + 0.07, 0, 0.55);
    const tv = ms(tv1960(scrTV60), ['screen']); L.tv60 = tv.userData.screen; put(g, tv, P.fun[0] + 0.42, P.fun[1] + 0.05, 0, 0.27);
    tv.scale.setScalar(0.9);
    put(g, ms(seat(1, 1.6)), P.seat[0], P.seat[1], -Math.PI / 2);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.01, 2.4), HM('carpet')); rug.position.set(0.4, 0.005, 0.5); g.add(rug);
    human(1, homePerson({ dress: 0x5a7fa8, top: 0x5a7fa8, apron: 0xf2efe6, hair: 0x4a3020, bun: true }), ADULT[0], ADULT[1], -Math.PI / 2, 0.98);
    human(1, homePerson({ top: 0xf2f0e6, legs: 0x3a4a5a, hair: 0x3a2a1e, child: true }), KID[0], KID[1], -Math.PI * 0.75, 1);
    // Отвън: асфалт, стълбове с жици, блок, автобус и велосипед.
    const road = new THREE.Mesh(new THREE.BoxGeometry(80, 0.02, 4.4), HM('asphalt', { rep: [20, 1] })); road.position.set(0, 0, -6.3); g.add(road);
    const walk = new THREE.Mesh(new THREE.BoxGeometry(80, 0.06, 1.6), HM(null, { color: 0xb8b2a6 })); walk.position.set(0, 0.03, -3.4); g.add(walk);
    const blk = ms(panelBlock({ floors: 5, bays: 8, style: 1 })); put(g, blk, 1, -20);
    const poles = [-13, -3, 7, 17].map((x) => { const p = ms(pole(6)); put(g, p, x, -3.9); return p; });
    for (let i = 0; i < poles.length - 1; i++) for (const dz of [-0.4, 0, 0.4]) g.add(wire(new THREE.Vector3(poles[i].position.x, 5.76, -3.9 + dz), new THREE.Vector3(poles[i + 1].position.x, 5.76, -3.9 + dz), 0.35));
    // Жица до къщата.
    g.add(wire(new THREE.Vector3(-3, 5.76, -3.9), new THREE.Vector3(-1.5, H + 0.05, -D / 2 - 0.1), 0.25));
    for (const [x, z] of [[-9, -10.8], [10, -11]]) { const t = leafTree(1.0); t.scale.setScalar(3); put(g, t, x, z); }
    const b = bus(); b.userData.z = -7.2; g.add(b);
    const bk = bicycle(); g.add(bk);
    const rider = worker('man'); rider.scale.setScalar(2.4); rider.position.set(-0.4, 0.15, 0); rider.rotation.y = Math.PI / 2; bk.add(rider);
    L.vehicles = [{ o: b, z: -7.3, speed: 2.4, dir: -1, len: 9 }, { o: bk, z: -5.3, speed: 1.2, dir: 1, len: 2 }];
  }
  // 2020
  {
    const g = groups[2], L = live[2];
    const kt = ms(modernKitchen(), ['inner', 'plate', 'disp']); Object.assign(L, { mwInner: kt.userData.inner, mwPlate: kt.userData.plate }); L.steam = kt.userData.steam; put(g, kt, P.cook[0] - 0.02, P.cook[1] + 0.05, Math.PI / 2);
    put(g, ms(fridge2020(), ['disp']), P.cold[0] - 0.02, P.cold[1] - 0.1, Math.PI / 2);
    const ws = ms(washer2020(), ['drum', 'disp']); L.drum = ws.userData.drum; put(g, ws, P.wash[0], P.wash[1] + 0.25, Math.PI / 2);
    put(g, ms(table(2)), P.table[0], P.table[1]);
    for (const [dx, dz, ry] of [[-0.35, 0.6, Math.PI], [0.35, -0.6, 0]]) put(g, ms(chair(2)), P.table[0] + dx, P.table[1] + dz, ry);
    const led = ms(ledLamp(0.8), ['panel']); L.panel = led.userData.panel; put(g, led, P.table[0], P.table[1], 0, H);
    put(g, ms(cabinet(2, 1.0, 0.75)), P.talk[0], P.talk[1] + 0.05);
    const ph = smartphone({ screen: scrPhone }); ph.rotation.x = -0.25; L.phone = ph;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.06), HM(null, { color: 0x2a2a2c })); stand.position.set(P.talk[0] - 0.1, 0.765, P.talk[1] + 0.12); g.add(stand);
    ph.position.set(P.talk[0] - 0.1, 0.84, P.talk[1] + 0.12); g.add(ph);
    const rt = ms(router(), ['leds']); L.leds = rt.userData.leds; put(g, rt, P.talk[0] + 0.25, P.talk[1] + 0.02, 0, 0.75);
    put(g, ms(cabinet(2, 1.6, 0.42)), P.fun[0], P.fun[1] + 0.05);
    const tv = tv2020(scrTV); put(g, tv, P.fun[0], P.fun[1] - 0.15, 0, 1.15);
    put(g, ms(gameConsole()), P.fun[0] - 0.45, P.fun[1] + 0.08, 0, 0.42);
    put(g, ms(seat(2, 1.6)), P.seat[0], P.seat[1], -Math.PI / 2);
    const tb = tablet(scrTab); tb.rotation.set(-1.1, -Math.PI / 2, 0, 'YXZ'); tb.position.set(P.seat[0] - 0.15, 0.45, P.seat[1] + 0.35); g.add(tb);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.012, 2.4), HM('rug')); rug.position.set(0.4, 0.006, 0.5); g.add(rug);
    human(2, homePerson({ top: 0xc0392b, legs: 0x2f4a6f, hair: 0x5a3a22, long: true }), ADULT[0], ADULT[1], -Math.PI / 2, 1);
    human(2, homePerson({ top: 0xf2c14e, legs: 0x2f4a6f, hair: 0x3a2a1e, child: true }), KID[0], KID[1], -Math.PI * 0.75, 1);
    const road = new THREE.Mesh(new THREE.BoxGeometry(80, 0.02, 4.4), HM('asphalt', { rep: [20, 1] })); road.position.set(0, 0, -6.3); g.add(road);
    for (let x = -38; x < 40; x += 4) { const s = new THREE.Mesh(new THREE.BoxGeometry(2, 0.025, 0.12), HM(null, { color: 0xf4f4f0 })); s.position.set(x, 0.005, -6.3); g.add(s); }
    const walk = new THREE.Mesh(new THREE.BoxGeometry(80, 0.06, 1.6), HM(null, { color: 0xcfc6b6 })); walk.position.set(0, 0.03, -3.4); g.add(walk);
    put(g, ms(panelBlock({ floors: 5, bays: 8, style: 2 })), 1, -20);
    for (const x of [-9, 3, 15]) put(g, ms(streetLight({ led: true })), x, -3.6, Math.PI);
    for (const [x, z] of [[-6, -10.8], [8, -11], [-15, -10]]) { const t = leafTree(1.0); t.scale.setScalar(3); put(g, t, x, z); }
    const c1 = car(0xc0392b), c2 = car(0x3a6ac0), c3 = car(0xe0e0e0);
    g.add(c1, c2, c3);
    L.vehicles = [{ o: c1, z: -5.3, speed: 4, dir: 1, len: 5 }, { o: c2, z: -7.3, speed: 3.2, dir: -1, len: 5, ph: 0.4 }, { o: c3, z: -5.3, speed: 4, dir: 1, len: 5, ph: 0.55 }];
  }
  // Пара над тенджерите.
  const steamPts = [];
  // Точките на парата: печката/кухнята е първото дете на всяка група.
  groups.forEach((g, e) => { const host = g.children[1]; host.updateMatrixWorld(true); steamPts[e] = host.localToWorld(live[e].steam.clone()); });
  steamPts.forEach((p, e) => groups[e].add(smoke(stage, [p], { color: 0xffffff }).group));
  // Светлина от лампата.
  const lampLight = new THREE.PointLight(0xffd9a0, 0, 7, 1.6); scene.add(lampLight);
  people.forEach((list) => list.forEach((p, i) => { p.userData.ph = i * 2.3; }));

  // ---------- кликаеми места ----------
  const ANCH = {
    light: [P.table[0], 2.45, P.table[1]], cook: [P.cook[0], 1.55, P.cook[1]], cold: [P.cold[0], 1.95, P.cold[1]],
    wash: [P.wash[0], 1.15, P.wash[1]], talk: [P.talk[0], 1.25, P.talk[1]], fun: [P.fun[0], 1.85, P.fun[1]], street: [winC[0], 2.3, -5],
  };
  const VIEWS = {
    light: [[2.6, 1.55, 3.6], [P.table[0], 1.4, P.table[1]]],
    cook: [[-0.9, 1.9, 0.1], [P.cook[0], 0.9, P.cook[1]]],
    cold: [[-0.3, 1.9, 1.7], [P.cold[0], 0.9, P.cold[1]]],
    wash: [[-0.2, 1.9, 3.2], [P.wash[0], 0.6, P.wash[1]]],
    talk: [[2.0, 1.9, 0.8], [P.talk[0], 0.85, P.talk[1]]],
    fun: [[-0.4, 1.8, 1.6], [P.fun[0], 0.95, P.fun[1]]],
    street: [[0.62, 1.5, 0.1], [winC[0], 1.2, -6]],
  };
  const OVER = [[3.6, 3.3, 6.4], [-0.1, 1.0, -0.6]];
  for (const [id, [x, y, z]] of Object.entries(ANCH)) marker(id + 'A', x, y, z);
  marker('phoneA', P.talk[0] - 0.1, 0.97, P.talk[1] + 0.12);
  const zonesHit = [];
  const hitZone = (id, x, y, z, w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x, y, z); m.userData.pickId = id; scene.add(m); named[id] = m; zonesHit.push(m); return m; };
  hitZone('cook', P.cook[0], 0.6, P.cook[1], 0.8, 1.2, 0.9);
  hitZone('cold', P.cold[0], 0.8, P.cold[1], 0.8, 1.6, 0.9);
  hitZone('wash', P.wash[0], 0.5, P.wash[1], 0.8, 1.0, 1.3);
  hitZone('light', P.table[0], 1.6, P.table[1], 0.7, 1.4, 0.7);
  hitZone('talk', P.talk[0], 0.9, P.talk[1], 1.0, 0.5, 0.5);
  hitZone('fun', P.fun[0], 0.9, P.fun[1], 1.6, 1.2, 0.5);
  hitZone('street', winC[0], winC[1], winC[2] + 0.05, 1.6, 1.2, 0.1);

  // ---------- годините се сменят ----------
  let epoch = 0;
  const lampLook = [
    { pos: [P.table[0] - 0.15, TOP + 0.4, P.table[1] - 0.05], color: 0xffc070, i: 0.8 },
    { pos: [P.table[0], H - 1.05, P.table[1]], color: 0xffe2b0, i: 1.2 },
    { pos: [P.table[0], H - 0.9, P.table[1]], color: 0xf4f8ff, i: 1.5 },
  ];
  function setEpoch(e, { instant = false } = {}) {
    epoch = e;
    groups.forEach((g, k) => { g.userData.target = k === e ? 1 : 0; if (instant) { g.userData.k = g.userData.target; applyGroup(g); } });
    frames.forEach((f, k) => { f.visible = k === e; });
    R.userData.setLook(e);
    const LL = lampLook[e];
    lampLight.position.set(...LL.pos); lampLight.color.setHex(LL.color); lampLight.intensity = LL.i;
    bar.sync();
  }
  const L = (e) => live[e];
  function applyGroup(g) { g.visible = g.userData.k > 0.002; g.scale.y = Math.max(0.002, g.userData.k); }

  // Живата сцена.
  let tvT = 0;
  stage.tick((dt, t) => {
    for (const g of groups) {
      const T = g.userData.target;
      if (T === undefined || g.userData.k === T) continue;
      g.userData.k = T > g.userData.k ? Math.min(1, g.userData.k + dt * 2.4) : Math.max(0, g.userData.k - dt * 3.5);
      applyGroup(g);
    }
    clouds.forEach((c, i) => { c.position.x = ((c.position.x + dt * (0.3 + i * 0.1) + 30) % 60) - 30; });
    // 1900: огън, пламък, вода.
    L(0).fire.material.emissiveIntensity = 1.3 + Math.sin(t * 13) * 0.3 + Math.sin(t * 7.3) * 0.2;
    L(0).flame.scale.set(1, 1 + Math.sin(t * 17) * 0.12, 1);
    L(0).water.position.y = 0.17 + Math.sin(t * 2) * 0.004;
    if (visitor.lamp.parent && visitor.lamp.userData.flame) visitor.lamp.userData.flame.scale.set(1, 1 + Math.sin(t * 17) * 0.12, 1);
    // 1960: котлон, пералня, радио, телевизор.
    L(1).hot.material.emissive.setRGB(0.55 + Math.sin(t * 2) * 0.1, 0.08, 0.02);
    L(1).agit.rotation.y = Math.sin(t * 3) * 1.2;
    L(1).dial.material.emissive.setRGB(0.35 + Math.sin(t * 9) * 0.03, 0.28, 0.1);
    // 2020: микровълнова, пералня, рутер.
    L(2).mwPlate.rotation.y += dt * 1.5;
    L(2).mwInner.material.emissive.setRGB(0.55, 0.48, 0.25);
    L(2).drum.rotation.z += dt * 4;
    L(2).leds.forEach((l, i) => { l.material.emissiveIntensity = (Math.sin(t * (6 + i * 3) + i) > 0) ? 1.2 : 0.2; });
    // Лампи.
    if (!bulbOff) L(1).bulb.material.emissive.setRGB(1, 0.85, 0.55);
    L(2).panel.material.emissive.setRGB(1, 1, 1);
    // Хората се движат спокойно на място.
    people.forEach((list) => list.forEach((p) => {
      const h = p.userData.home, k = t * 0.5 + p.userData.ph;
      p.position.set(h.x + Math.sin(k) * 0.12, 0, h.z + Math.cos(k * 0.7) * 0.1);
      p.rotation.y = p.userData.ry + Math.sin(k * 0.8) * 0.4;
    }));
    // Превозните средства минават по улицата.
    live.forEach((Lx, e) => {
      if (e !== epoch) return;
      for (const v of Lx.vehicles) {
        const span = 34, u = ((t * v.speed + (v.ph || 0) * span) % span) - span / 2;
        v.o.position.set(u * v.dir, 0, v.z);
        v.o.rotation.y = v.dir > 0 ? 0 : Math.PI;
        if (v.o.userData.wheels) v.o.userData.wheels.forEach((w) => { w.rotation[w.geometry.type === 'CylinderGeometry' ? 'y' : 'z'] = -t * v.speed / (v.o.userData.r || 0.4); });
      }
    });
    // Екраните.
    tvT += dt;
    if (tvT > 0.15) {
      tvT = 0;
      if (epoch === 2) { drawTV(scrTV, t); drawTablet(scrTab, t); }
      if (epoch === 1) drawTV60(scrTV60, t);
    }
    if (pulse) { const k = 0.5 + 0.5 * Math.sin(t * 5); pulse.forEach((m) => m.material.emissive && m.material.emissive.setRGB(k * 0.35, k * 0.28, 0)); }
  });
  let pulse = null, bulbOff = false;

  // ---------- лента с годините (под сцената) ----------
  const bar = (() => {
    const el = document.createElement('div');
    el.className = 'pv-epochs';
    el.style.cssText = 'position:absolute;left:50%;bottom:8px;transform:translateX(-50%);z-index:6;width:min(94%,460px);box-sizing:border-box;background:rgba(255,255,255,0.95);border:1px solid #c7d3e0;border-radius:14px;padding:6px 8px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,0.15)';
    el.innerHTML = `<button class="btn pv-prev" aria-label="По-рано" style="min-width:38px;padding:6px 8px">◀</button>
      <div style="flex:1;min-width:0;text-align:center"><div class="pv-name" style="font-weight:700;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
      <input class="pv-range" type="range" min="0" max="2" step="1" value="0" aria-label="Година" style="width:100%;margin:2px 0 0">
      <div class="pv-hint" style="display:flex;justify-content:space-between;font-size:0.7rem;color:#667"><span>1900</span><span>1960</span><span>2020</span></div></div>
      <button class="btn pv-next" aria-label="По-късно" style="min-width:38px;padding:6px 8px">▶</button>`;
    shell.stageEl.appendChild(el);
    if ((shell.stageEl.clientWidth || 600) < 480) { el.querySelector('.pv-hint').style.display = 'none'; el.style.padding = '3px 6px'; el.style.bottom = '4px'; }
    ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => el.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
    const range = el.querySelector('.pv-range');
    const go = (e) => { e = Math.max(0, Math.min(2, e)); if (e === epoch) { bar.sync(); return; } setEpoch(e); onEpoch && onEpoch(e); };
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
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.15, cls: 'wide', ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let clickHandler = null, stopDrag = null, phase = 1;
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const next = (label, fn) => { const c = shell.setControls(`<button class="btn primary">${label}</button>`); c.querySelector('button').addEventListener('click', () => { clearTip(); fn(); }); };
  function ask(list, onRight, onWrong) {
    const c = shell.setControls(`<div class="col">${list.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = list[+b.dataset.i];
      if (!p.ok) { onWrong(); b.disabled = true; shell.msg(p.why, 'bad'); return; }
      shell.msg('Вярно!', 'good');
      shell.setControls('');
      onRight();
    }));
  }

  // ---------- 1. Опознай ----------
  const seenE = new Set(), seenP = new Set();
  let place = 'light';
  const menu = cornerMenu(stage, { title: 'В стаята', items: PLACES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })), onSelect: (id) => { if (phase === 1) showPlace(id, true); } });
  function showPlace(id, fly) {
    place = id;
    const Pl = PLACES.find((p) => p.id === id);
    if (fly) { const [pos, tgt] = VIEWS[id]; view(pos, tgt, 1.1); }
    say(named[id + 'A'], `<b>${esc(Pl.label)} · ${esc(EPOCHS[epoch].label)}</b><br>${Pl.notes[epoch]}`);
    seenP.add(id); menu.mark(id); menu.setActive(id);
    progress1();
  }
  function drawChips() {
    return `<div class="row" style="flex-wrap:wrap;gap:4px">${EPOCHS.map((E, i) => `<button class="btn pv-chip" data-e="${i}" style="padding:4px 8px;font-size:0.85rem${i === epoch ? ';outline:2px solid #2f7de1' : ''}">${seenE.has(i) ? '✓ ' : ''}${esc(E.label)}</button>`).join('')}</div>`;
  }
  function progress1() {
    if (phase !== 1) return;
    shell.score(`Години: ${seenE.size} от 3 · Места: ${seenP.size} от ${PLACES.length}`);
    const done = seenE.size === 3 && seenP.size === PLACES.length;
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
    zonesHit.forEach((z) => { z.visible = true; });
    setEpoch(0, { instant: true });
    seenE.add(0);
    shell.task('Това е една и съща стая през 1900, 1960 и 2020 г. Мести плъзгача долу и гледай какво се сменя. Разгледай всичко от менюто или кликай в стаята.');
    onEpoch = (e) => { seenE.add(e); showPlace(place, false); };
    clickHandler = (id) => { if (PLACES.some((p) => p.id === id)) showPlace(id, true); };
    view(...OVER, 0.01);
    showPlace('light', false);
  }

  // ---------- 2. Пренеси в друго време ----------
  // Сандък с уреди от различни години.
  const CHEST = { x: 1.25, z: 1.7 };
  const chest = new THREE.Group(); chest.position.set(CHEST.x, 0, CHEST.z); scene.add(chest); chest.visible = false;
  {
    const wood = HM(null, { color: 0x7a5232 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.7), wood); b.position.y = 0.225; chest.add(b);
    for (const x of [-0.75, 0, 0.75]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.46, 0.72), HM(null, { color: 0x3a3d40, metal: 0.5 })); s.position.set(x, 0.225, 0); chest.add(s); }
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.7), wood); lid.position.set(0, 0.6, -0.42); lid.rotation.x = -1.2; chest.add(lid);
    const l = labelSprite('Сандък на времето', { size: 0.14 }); l.position.set(0, 1.05, -0.45); chest.add(l);
  }
  const visitor = {
    bulb: ms(bulbLamp(0.85), ['bulb']), lamp: ms(keroseneLamp(), ['flame']),
    phone: (() => { const g = new THREE.Group(); const st = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.06), HM(null, { color: 0x2a2a2c })); st.position.y = 0.015; g.add(st); const ph = smartphone({ screen: scrPhone }); ph.rotation.x = -0.25; ph.position.y = 0.085; g.add(ph); g.userData.screen = ph.userData.screen; return g; })(), fridge: ms(fridge2020(), ['disp']),
  };
  // Малките копия в сандъка (кликаеми).
  const VIS = { 'v-bulb': 'bulb', 'v-lamp': 'lamp', 'v-phone': 'phone', 'v-fridge': 'fridge' };
  const minis = {};
  [['v-bulb', () => { const g = new THREE.Group(); const b = bulbLamp(0.05); b.position.y = 0.32; g.add(b); return g; }, 'Крушка', 1.4],
    ['v-lamp', () => keroseneLamp(), 'Газена лампа', 1.4],
    ['v-phone', () => { const p = smartphone({ screen: scrPhone }); p.rotation.x = -0.3; p.position.y = 0.09; return p; }, 'Смартфон', 2.0],
    ['v-fridge', () => fridge2020(), 'Хладилник', 0.25],
  ].forEach(([id, make, label, s], i) => {
    const g = new THREE.Group();
    const o = make(); o.scale.multiplyScalar(s); g.add(o);
    const lb = labelSprite(label, { size: 0.11 }); lb.position.set(0, i % 2 ? 0.62 : 0.5, 0.08); g.add(lb);
    g.position.set(-0.63 + i * 0.42, 0.46, 0.05);
    g.userData.pickId = id;
    chest.add(g);
    addHitBox(g, 0.3);
    minis[id] = g;
  });
  // Къде отива пренесеният уред.
  function placeVisitor(key, e) {
    const o = visitor[key];
    groups[e].add(o);
    if (key === 'bulb') { o.position.set(P.table[0] + 0.25, H, P.table[1] + 0.2); o.userData.bulb.material.emissive.setRGB(0, 0, 0); }
    if (key === 'lamp') { o.position.set(P.table[0] + 0.25, TOP + (e === 2 ? 0.0 : 0), P.table[1] + 0.15); o.userData.flame.visible = false; }
    if (key === 'phone') { o.position.set(P.talk[0] - 0.25, 0.75, P.talk[1] + 0.12); o.userData.screen.material = scrPhone.mat; }
    if (key === 'fridge') { o.rotation.y = 0; o.position.set(-1.6, 0, 1.6); o.userData.disp.material.emissiveIntensity = 0; }
    return o;
  }
  function showOutcome(key, works) {
    const o = visitor[key];
    if (key === 'bulb') o.userData.bulb.material.emissive.setRGB(works ? 1 : 0, works ? 0.85 : 0, works ? 0.5 : 0);
    if (key === 'lamp') o.userData.flame.visible = works;
    if (key === 'phone') o.userData.screen.material = works ? scrPhone.mat : scrNoNet.mat;
    if (key === 'fridge') o.userData.disp.material.emissiveIntensity = works ? 0.9 : 0;
  }
  const TRIP_VIEW = {
    bulb: [[2.2, 2.0, 3.0], [P.table[0] + 0.2, 1.3, P.table[1]]],
    lamp: [[2.0, 1.7, 2.6], [P.table[0] + 0.1, 0.9, P.table[1]]],
    phone: [[P.talk[0] - 0.2, 1.08, P.talk[1] + 0.95], [P.talk[0] - 0.22, 0.86, P.talk[1] + 0.1]],
    fridge: [[0.6, 1.9, 4.2], [-1.6, 0.9, 1.4]],
  };
  const tripAnchor = { bulb: [P.table[0] + 0.25, 1.95, P.table[1] + 0.2], lamp: [P.table[0] + 0.25, 1.15, P.table[1] + 0.15], phone: [P.talk[0] - 0.25, 1.0, P.talk[1] + 0.1], fridge: [-1.6, 1.95, 1.6] };
  for (const [k, [x, y, z]] of Object.entries(tripAnchor)) marker('trip-' + k, x, y, z);
  function clearVisitors() { for (const o of Object.values(visitor)) if (o.parent) o.parent.remove(o); }
  function step2() {
    phase = 2;
    shell.step(1);
    menu.show(false); bar.show(true);
    zonesHit.forEach((z) => { z.visible = false; });
    chest.visible = true;
    for (const m of Object.values(minis)) m.visible = true;
    setEpoch(0, { instant: true });
    shell.score('');
    let mistakes = 0, r = 0;
    const OV2 = [[2.4, 2.5, 5.6], [0.4, 0.8, 0.6]];
    function round() {
      const T = TRIPS[r];
      view(...OV2, 1.1);
      clearTip();
      chest.visible = true;
      shell.task(`Опит ${r + 1} от ${TRIPS.length}: <b>пренеси ${esc(T.name)} в ${esc(EPOCHS[T.era].label)}</b>. Избери годината с плъзгача и кликни уреда в сандъка на времето.`);
      shell.setControls('');
      shell.score(`Опити: ${r} от ${TRIPS.length}`);
      onEpoch = null;
      clickHandler = (id) => {
        if (!id || !VIS[id]) return;
        if (id !== T.item) { shell.msg(`Сега пренасяме ${T.name}. Кликни него.`, 'bad'); return; }
        if (epoch !== T.era) { shell.msg(`Първо избери ${EPOCHS[T.era].label} с плъзгача долу.`, 'bad'); return; }
        clickHandler = null;
        const key = VIS[id];
        minis[id].visible = false;
        chest.visible = false;
        placeVisitor(key, T.era);
        view(...TRIP_VIEW[key], 1.1);
        shell.msg('');
        say(named['trip-' + key], `${esc(EPOCHS[T.era].label)}: ${esc(T.name)} е в стаята.`, { cls: 'tag' });
        shell.task(`<b>${esc(T.q)}</b>`);
        bar.show(false);
        ask(T.opts, () => {
          showOutcome(key, T.works);
          say(named['trip-' + key], T.after, { cls: (T.works ? 'good' : 'bad') + ' wide' });
          r++;
          shell.score(`Опити: ${r} от ${TRIPS.length}`);
          next(r < TRIPS.length ? 'Следващ опит →' : 'Напред →', () => {
            if (r < TRIPS.length) { bar.show(true); round(); return; }
            scores.push(stepScore(mistakes, 3));
            step3();
          });
        }, () => { mistakes++; });
      };
    }
    round();
  }

  // ---------- 3. Подреди по време ----------
  const BOARD = { x: 0, z: 46 };
  const narrow = aspect < 1;
  const ZX = narrow ? 2.3 : 2.7;
  const boardGround = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 10), HM(null, { color: 0x9ab870 }));
  boardGround.position.set(BOARD.x, -0.2, BOARD.z + 1.5); scene.add(boardGround);
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(narrow ? 7.4 : 8.6, 0.08, 6.4), HM('boards', { rep: [3, 3] }));
  tableTop.position.set(BOARD.x, 0.04, BOARD.z + 1.4); scene.add(tableTop);
  const zones = EPOCHS.map((E, i) => {
    const z = new THREE.Mesh(new THREE.BoxGeometry(ZX - 0.15, 0.03, 1.5), mat([0xf4e2d0, 0xd8e6f4, 0xdaf0de][i]));
    z.position.set(BOARD.x + (i - 1) * ZX, 0.095, BOARD.z - 0.6);
    z.userData = { dropId: 'z' + i, i, n: 0 };
    scene.add(z);
    const l = labelSprite(E.label, { size: 0.36 }); l.position.set(z.position.x, 0.35, BOARD.z - 1.55); scene.add(l);
    return z;
  });
  const arrow = labelSprite('по-рано  →  →  по-късно', { size: 0.24 }); arrow.position.set(BOARD.x, 0.3, BOARD.z - 2.1); scene.add(arrow);
  const miniOf = {
    'k-lamp': () => keroseneLamp(), 'k-trough': () => trough(), 'k-letter': () => letterSet(),
    'k-radio': () => radio1960(), 'k-rotary': () => rotaryPhone(0x8a1f2b), 'k-tv60': () => tv1960(scrTV60),
    'k-phone': () => { const p = smartphone({ screen: scrPhone }); p.rotation.x = -0.4; p.position.y = 0.08; return p; },
    'k-micro': () => { const k = modernKitchen(); const mw = k.children.find((c) => c.isGroup); k.remove(mw); mw.position.set(0, 0, 0); return mw; },
    'k-tablet': () => { const t = tablet(scrTab); t.rotation.x = -0.6; t.position.y = 0.1; return t; },
  };
  const cards = CARDS.map((Cd, i) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 0.95), mat(0xf6efdc)); base.position.y = 0.03; g.add(base);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.21, 0.04, 1.01), mat(0x7a5634)); rim.position.y = 0.01; g.add(rim);
    const o = miniOf[Cd.id]();
    const bb = new THREE.Box3().setFromObject(o); const sz = bb.getSize(new THREE.Vector3());
    const s = 0.72 / Math.max(sz.x, sz.y, sz.z);
    const holder = new THREE.Group(); holder.add(o); holder.scale.setScalar(s); holder.position.set(0, 0.06, -0.08); g.add(holder);
    const l = labelSprite(Cd.label, { size: 0.21 }); l.position.set(0, 0.75, 0.35); g.add(l);
    g.userData = { dragId: Cd.id, i, era: Cd.era };
    addHitBox(g, 0.6);
    g.visible = false;
    scene.add(g);
    return g;
  });
  const cardHome = (g) => { const k = CARD_ORDER.indexOf(g.userData.i); const col = k % 3, row = Math.floor(k / 3); return new THREE.Vector3(BOARD.x + (col - 1) * (narrow ? 2.2 : 2.5), 0.08, BOARD.z + 1.0 + row * 1.25); };
  function step3() {
    phase = 3;
    shell.step(2);
    bar.show(false); menu.show(false); chest.visible = false;
    clickHandler = null; onEpoch = null;
    clearVisitors();
    if (narrow) view([BOARD.x, 9.0, BOARD.z + 5.4], [BOARD.x, 0, BOARD.z + 1.0], 1.2, 1); else view([BOARD.x, 6.2, BOARD.z + 6.4], [BOARD.x, 0, BOARD.z + 1.1], 1.2, aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1);
    zones.forEach((z) => { z.userData.n = 0; });
    for (const g of cards) { g.visible = true; g.userData.locked = false; g.scale.setScalar(1); g.position.copy(cardHome(g)); g.userData.home = g.position.clone(); }
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Кога за първи път виждаш тези предмети в стаята? Завлечи всеки на неговата година: <b>1900, 1960 или 2020 г.</b>');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${cards.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.1,
      onDrop(obj) {
        let best = null, bd = 1.3;
        for (const z of zones) { const d = Math.hypot(obj.position.x - z.position.x, (obj.position.z - z.position.z) * 0.8); if (d < bd) { bd = d; best = z; } }
        if (!best) { obj.position.copy(obj.userData.home); return; }
        const era = obj.userData.era;
        if (best.userData.i === era) {
          obj.userData.locked = true;
          const n = best.userData.n++;
          obj.scale.setScalar((ZX - 0.15) / 3 / 1.21);
          obj.position.set(best.position.x + (n - 1) * (ZX - 0.15) / 3, 0.11, best.position.z);
          placed++;
          shell.score(`Подредени: ${placed} от ${cards.length}`);
          shell.msg(`Вярно: ${EPOCHS[era].label}`, 'good');
          if (placed === cards.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            view([BOARD.x, 4.6, BOARD.z + 3.4], [BOARD.x, 0, BOARD.z - 0.5], 1.2, narrow ? 1.6 : far);
            say(zones[1], 'Всичко е подредено! Новите уреди идват едни след други и променят живота вкъщи.', { cls: 'good wide', lift: 1.0 });
            next('Напред →', step4);
          }
        } else {
          mistakes++;
          const id = obj.userData.dragId;
          tries[id] = (tries[id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          const later = best.userData.i < era;
          shell.msg(tries[id] >= 2 ? `Подсказка: това е от ${EPOCHS[era].label}` : (later ? 'Този предмет се появява по-късно. Сложи го по-надясно.' : 'Този предмет се появява по-рано. Сложи го по-наляво.'), 'bad');
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
    setEpoch(0, { instant: true });
    view([2.0, 2.1, 3.4], [P.table[0], 1.0, P.table[1]], 1.2);
    shell.score('');
    let mistakes = 0;
    say(named.lightA, '1900 г. Стаята свети с газена лампа.', { cls: 'tag' });
    shell.task('Минават години и в къщата прокарват ток. <b>С какво ще светят тогава вместо с газена лампа?</b>');
    ask(PREDICT1, () => {
      setEpoch(1);
      view([2.0, 2.1, 3.4], [P.table[0], 1.4, P.table[1]], 1.2);
      say(named.lightA, '<b>Така е.</b> През 1960 г. стаята свети с крушка. Токът идва в къщата по жици. Светлината е по-силна и няма открит огън.', { cls: 'good wide' });
      setTimeout(() => {
        if (phase !== 4) return;
        setEpoch(0);
        view([2.0, 1.9, 0.6], [P.talk[0], 0.85, P.talk[1]], 1.2);
        say(named.talkA, '1900 г. Синът живее в друг град. Писмото до него пътува дни наред.', { cls: 'wide' });
        shell.task('<b>Как през 2020 г. семейството говори със сина и го вижда веднага?</b>');
        ask(PREDICT2, () => {
          setEpoch(2);
          drawPhone(scrPhone, 'call');
          view([P.talk[0] - 0.05, 1.05, P.talk[1] + 0.75], [P.talk[0] - 0.1, 0.86, P.talk[1] + 0.1], 1.2, 1);
          pulse = null;
          say(named.phoneA, '<b>Така е.</b> През 2020 г. с видеоразговор по смартфона виждаш и чуваш близките си веднага, дори да са в друга страна. Писмото пътува дни, а видеоразговорът е за миг.', { cls: 'good wide', lift: 0.02 });
          next('Виж резултата', () => {
            scores.push(stepScore(mistakes, 2));
            shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart);
          });
        }, () => { mistakes++; });
      }, 2600);
    }, () => { mistakes++; });
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    clearVisitors();
    for (const g of cards) { g.visible = false; g.userData.locked = false; g.scale.setScalar(1); }
    chest.visible = false;
    drawPhone(scrPhone, 'home');
    pulse = null; bulbOff = false;
    step1();
  }

  // ---------- рисуване на екраните ----------
  function drawPhone(S, mode) {
    const { ctx, c } = S; const w = c.width, h = c.height;
    if (mode === 'call') {
      const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a8fb0'); gr.addColorStop(1, '#3a4a5a');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      // Лицето на сина (просто нарисувано).
      ctx.fillStyle = '#2a5a8a'; ctx.beginPath(); ctx.ellipse(w / 2, h * 0.86, w * 0.42, h * 0.2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e0b58f'; ctx.beginPath(); ctx.arc(w / 2, h * 0.5, w * 0.24, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); ctx.arc(w / 2, h * 0.44, w * 0.25, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#222'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(w / 2 + s * w * 0.09, h * 0.5, 4, 0, 7); ctx.fill(); }
      ctx.strokeStyle = '#7a3a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w / 2, h * 0.53, w * 0.1, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.fillStyle = '#e0b58f'; ctx.fillRect(w * 0.66, h * 0.06, w * 0.28, h * 0.17); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(w * 0.66, h * 0.06, w * 0.28, h * 0.17);
      ctx.fillStyle = '#d0302a'; ctx.beginPath(); ctx.arc(w / 2, h * 0.93, 12, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Видеоразговор', w / 2, 22);
    } else {
      const gr = ctx.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a7ac0'); gr.addColorStop(1, '#7a4ab0');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('10:20', w / 2, 56);
      const cols = ['#f2c14e', '#4aa060', '#e05a4a', '#4ac0e0', '#f0f0f0', '#c04ab0', '#f09a3a', '#3a6ac0'];
      for (let i = 0; i < 8; i++) { ctx.fillStyle = cols[i]; const x = 14 + (i % 3) * 38, y = 100 + Math.floor(i / 3) * 40; ctx.fillRect(x, y, 26, 26); }
    }
    S.tex.needsUpdate = true;
  }
  function drawNoNet(S) {
    const { ctx, c } = S; const w = c.width, h = c.height;
    ctx.fillStyle = '#1a1c22'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) ctx.strokeRect(w / 2 - 30 + i * 16, 110 - i * 12, 8, 14 + i * 12);
    ctx.strokeStyle = '#e04a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(w / 2 - 36, 80); ctx.lineTo(w / 2 + 36, 140); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Няма мрежа', w / 2, 180);
    S.tex.needsUpdate = true;
  }
  function drawTV(S, t) {
    const { ctx, c } = S; const w = c.width, h = c.height;
    ctx.fillStyle = '#7ac0f0'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.arc(40 + ((t * 12) % (w - 60)), 34, 16, 0, 7); ctx.fill();
    ctx.fillStyle = '#5aa04a'; ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h * 0.62 + Math.sin(x / 30 + t * 0.5) * 12); ctx.lineTo(w, h); ctx.fill();
    ctx.fillStyle = '#c04a4a'; const bx = (t * 30) % (w + 40) - 20; ctx.fillRect(bx, h * 0.55, 30, 18); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(bx + 7, h * 0.55 + 18, 5, 0, 7); ctx.arc(bx + 24, h * 0.55 + 18, 5, 0, 7); ctx.fill();
    S.tex.needsUpdate = true;
  }
  function drawTV60(S, t) {
    const { ctx, c } = S; const w = c.width, h = c.height;
    const v = 150 + Math.sin(t * 20) * 10;
    ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(w / 2, h * 0.45, 18, 0, 7); ctx.fill(); ctx.fillRect(w / 2 - 26, h * 0.62, 52, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    S.tex.needsUpdate = true;
  }
  function drawTablet(S, t) {
    const { ctx, c } = S; const w = c.width, h = c.height;
    ctx.fillStyle = '#2a2a4a'; ctx.fillRect(0, 0, w, h);
    const cols = ['#e05a4a', '#f2c14e', '#4aa060', '#4ac0e0'];
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { ctx.fillStyle = cols[(r + k + Math.floor(t)) % 4]; ctx.fillRect(10 + k * 29, 10 + r * 28, 25, 24); }
    S.tex.needsUpdate = true;
  }

  step1();
  container.__demo = { stage, scene, setEpoch: (e) => bar.go(e), get epoch() { return epoch; }, select: (id) => showPlace(id, true) };
  return { dispose() { if (stopDrag) stopDrag(); menu.remove(); bar.el.remove(); stage.dispose(); } };
}
