// 6.2.4 „Средновековният град и университетите“ — разходка в Търновград (Царевец и долният град), XIII–XIV век.
// Стъпки: разходка по спирките → защо градът расте (опит с условия) → кой какво работи (извори) → предскажи: какво дава новото образование.
import { createStage, labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { wander } from './hist/antiquity.js';
import { forge, potteryWheel, goldTable, stall, coins } from './hist/thrace.js';
import { createWalk } from './hist/stopwalk.js';
import { M } from './hist/architecture.js';
import {
  MM, cliffHill, river, field, tree, stoneWall, stoneTower, gatehouse, tarnovoChurch, royalPalace, medievalHouse, dukyan,
  glazedBowl, jug, stoneBridge, packHorse, cart, medPerson, scribeDesk, bookStack, lectureHall, book, mergeStatic, causeway,
} from './hist/medieval.js';

const DUG = 'Разкопано и проучено.';
const REC = 'Сградите тук са възстановка.';
// Спирки на разходката. Всеки текст казва кое е запазено или разкопано и кое е възстановка (принцип 10).
const STOPS = [
  { id: 'yantra', label: 'Янтра и хълмовете', icon: '🏞️', at: [-8, 20], eyeY: 13.5, look: [-0.5, 0.5, -2.5], anchor: 'tsarevets',
    note: 'Търновград е построен върху хълмовете Царевец и Трапезица. Река Янтра обикаля Царевец от три страни, а склоновете са стръмни — природата помага на защитата. От 1185 г. до 1393 г. градът е столица на България. <i>Хълмовете и реката са истински, а сградите в сцената са опростена възстановка.</i>' },
  { id: 'houses', label: 'Къщите', icon: '🏠', at: [-10.4, 9.6], eyeY: 2.7, look: [-13.6, 0.4, 3.6], anchor: 'look',
    note: 'Къщите са плътно една до друга, а улиците са тесни и криви. Долу стените са от камък, покривите са с керемиди. <i>Археолозите са разкрили основите на много къщи. Как точно са изглеждали горните етажи, не знаем — това е възстановка.</i>' },
  { id: 'crafts', label: 'Занаятчиите', icon: '⚒️', at: [-8.4, 5.8], eyeY: 2.5, look: [-12.3, 0.4, 3.7], anchor: 'potterShop',
    note: 'В долния град, под крепостта, живеят много занаятчии. Ковачите правят сечива, подкови и оръжия, грънчарите — глазирани съдове с врязани рисунки, а златарите — накити. <i>Такива съдове, накити и сечива са намерени при разкопките. Дюкяните са възстановка.</i>' },
  { id: 'market', label: 'Пазарът', icon: '🧺', at: [-7.2, 1.8], eyeY: 2.5, look: [-10.2, 0.3, -1.4], anchor: 'stallA',
    note: 'На пазара селяните от околните села продават храна, а занаятчиите — своите изделия. Плаща се и с монети. <i>В Търново са намерени много монети на българските царе. Сергиите са възстановка.</i>' },
  { id: 'merchants', label: 'Търговци отдалеч', icon: '🐴', at: [-4.4, 6.6], eyeY: 4.2, look: [-7.9, 0.3, 0.4], anchor: 'caravan',
    note: 'Цар Иван Асен II дава грамота на търговците от Дубровник: те могат свободно да търгуват в българските земи. С България търгуват и Венеция, и Генуа. <i>Грамотата е запазена. Керванът е възстановка.</i>' },
  { id: 'gate', label: 'Стената и портата', icon: '🏰', at: [-7.6, -1.8], eyeY: 3.5, look: [-3.0, 2.1, -1.1], anchor: 'gate',
    note: 'Царевец е обиколен от дебела каменна стена с кули. До главната порта се стига по тесен скалист провлак, а портите са няколко една след друга. <i>Стената е запазена отчасти и е възстановена през XX век.</i>' },
  { id: 'palace', label: 'Царският дворец', icon: '👑', at: [-0.2, 3.2], eyeY: 4.6, look: [3.2, 1.9, -1.4], anchor: 'palace',
    note: 'В средата на хълма е дворецът на българските царе. Той има своя стена с кули, тронна зала и дворцова църква. <i>Запазени са основите и долните части на стените. Кулите и покривите са възстановка.</i>' },
  { id: 'church', label: 'Патриаршеската църква', icon: '⛪', at: [4.2, 1.4], eyeY: 4.6, look: [7.8, 2.5, -3.4], anchor: 'church',
    note: 'На най-високото място е църквата „Възнесение Господне“, а до нея — Патриаршията, домът на българския патриарх. Тук служи и патриарх Евтимий. <i>Църквата е възстановена през XX век, а стенописите в нея са съвременни.</i>' },
  { id: 'baldwin', label: 'Балдуиновата кула', icon: '🗼', at: [6.6, -1.0], eyeY: 4.0, look: [10.8, 2.6, 2.4], anchor: 'baldwin',
    note: 'През 1205 г. цар Калоян побеждава латинците при Одрин и пленява императора им Балдуин. <b>Според предание</b> Балдуин е затворен в тази кула — затова тя носи името му. Дали е било точно тук, не е доказано. <i>Кулата е възстановена през XX век върху старите основи.</i>' },
];

// Опит: условия, от които зависи растежът на града. up: true — градът расте; false — намалява.
const CONDS = [
  { id: 'fort', label: 'Крепост на хълма', up: true, anchor: 'gate',
    why: 'Зад стените хората са в безопасност. Затова идват да живеят наблизо.' },
  { id: 'capital', label: 'Царят и патриархът са тук', up: true, anchor: 'palace',
    why: 'Царят, болярите, войската и духовенството имат нужда от храна, дрехи, оръжие и книги. Това дава работа на много хора.' },
  { id: 'food', label: 'Селата дават повече храна', up: true, anchor: 'fieldA',
    why: 'Когато селата произвеждат повече храна, част от хората могат да не работят на нивата, а да станат занаятчии и търговци в града.' },
  { id: 'war', label: 'Войни и разбойници', up: false, anchor: 'bridge',
    why: 'Търговците не смеят да пътуват. Стоките намаляват и хората напускат града.' },
  { id: 'crafts', label: 'Занаятчии отварят дюкяни', up: true, anchor: 'potterShop',
    why: 'Занаятчиите правят изделия за продан. Около дюкяните растат нови къщи.' },
  { id: 'market', label: 'Пазар', up: true, anchor: 'stallA',
    why: 'На пазара селяни, занаятчии и търговци разменят стоки. Хората идват в града да купуват и продават.' },
  { id: 'drought', label: 'Суша: лоша реколта', up: false, anchor: 'fieldA',
    why: 'Когато реколтата е лоша, храната не стига и поскъпва. Градът не може да изхрани толкова много хора.' },
  { id: 'roads', label: 'Мост и пътища за търговци', up: true, anchor: 'bridge',
    why: 'По пътищата и моста идват търговци отдалеч. Те носят стоки и купуват местни изделия.' },
];
// Модел (не истински числа): колко къщи има в долния град при дадените условия.
function houseCount(on) {
  let n = 2;
  if (on.fort) n += 3;
  if (on.capital) n += 4;
  if (on.food) n += 3;
  if (on.crafts) n += 2 + (on.market ? 1 : 0);
  if (on.market) n += 2 + (on.roads ? 1 : 0);
  if (on.roads) n += 2;
  if (on.war) n -= 6;
  if (on.drought) n -= 5;
  return Math.max(1, Math.min(18, n));
}

// Приложи: извори → жители.
const SOURCES = [
  { id: 'src-bowl', label: 'Находка: глазирана паница', to: 'potter', why: 'Паницата е от глина, покрита с глазура.',
    note: 'Глазирани паници с врязани рисунки са намерени при разкопките в Търново. Правят ги грънчарите.' },
  { id: 'src-iron', label: 'Находка: подкови и ключове', to: 'smith', why: 'Подковите и ключовете са от желязо.',
    note: 'Железни подкови, ключове и сечива се намират често при разкопките. Изковава ги ковачът.' },
  { id: 'src-gold', label: 'Находка: златни обеци', to: 'goldsmith', why: 'Обеците са накит от благороден метал.',
    note: 'Златни и сребърни накити от Търново показват умението на местните златари.' },
  { id: 'src-charter', label: 'Документ: грамота за търговия', to: 'merchant', why: 'Грамотата разрешава търговия.',
    note: 'Грамотата на Иван Асен II позволява на търговците от Дубровник да търгуват свободно. Това е писмен извор.' },
  { id: 'src-book', label: 'Ръкопис: преписано Евангелие', to: 'scribe', why: 'Ръкописът е книга, написана на ръка.',
    note: 'Книгите се преписват на ръка върху пергамент. Правят го книжовниците, най-често монаси.' },
];
const RESIDENTS = [
  { id: 'smith', label: 'Ковач', kind: 'smith', pos: [-11.75, 5.2] },
  { id: 'potter', label: 'Грънчар', kind: 'potter', pos: [-11.75, 3.7] },
  { id: 'goldsmith', label: 'Златар', kind: 'goldsmith', pos: [-11.75, 2.2] },
  { id: 'merchant', label: 'Търговец', kind: 'merchant', pos: [-10.2, -1.5] },
  { id: 'scribe', label: 'Книжовник', kind: 'scribe', pos: [-12.1, -3.1] },
];

// Предскажи.
const Q_UNI = [
  { t: 'Учени хора: юристи, лекари, свещеници и учители.', ok: true },
  { t: 'Учат рицарите да се бият с меч.', ok: false, why: 'Рицарите се обучават при своя господар, не в университета.' },
  { t: 'Учат малките деца на първите букви.', ok: false, why: 'Първите букви децата учат в църковни и градски училища. Университетът дава по-високо образование.' },
];
const Q_EVT = [
  { t: 'Печатат книги на печатна машина.', ok: false, why: 'Печатането на книги в Европа започва чак около средата на XV век — след падането на Търново през 1393 г.' },
  { t: 'Преписват и превеждат книги и уеднаквяват правописа.', ok: true },
  { t: 'Учат студенти по право и медицина.', ok: false, why: 'Това правят университетите на Запад. В Търново няма университет.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Разходка из Търновград', 'Защо градът расте?', 'Кой какво работи?', 'Предскажи'] });
  const stage = createStage(shell.stageEl, { background: 0xcfe3f2, camPos: [-4.5, 9, 14], target: [1, 0.8, -1.5], minDistance: 0.3, maxDistance: 45, maxPolarAngle: Math.PI * 0.49 });
  const { scene } = stage;
  // Тесен екран: изгледите се отдръпват назад, за да се вижда всичко.
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const view = (pos, tgt, dur = 1) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * far), tgt, dur);
  const named = {};
  const pick = (id, obj, size = 0.8) => { obj.userData.pickId = id; addHitBox(obj, size); named[id] = obj; return obj; };
  const add = (obj, x, y, z, ry = 0, parent = scene) => { obj.position.set(x, y, z); obj.rotation.y = ry; parent.add(obj); return obj; };
  const groups = {};
  const staticBits = [];
  const grp = (id) => { const g = new THREE.Group(); scene.add(g); groups[id] = g; return g; };
  const smoke = [];
  const addSmoke = (x, y, z, n = 4) => { for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe4e4e4, transparent: true, opacity: 0.4, depthWrite: false })); s.userData = { x, y, z, k: i / n }; scene.add(s); smoke.push(s); } };

  // ---------- Природа: земя, хълмове, река ----------
  const ground = new THREE.Mesh(new THREE.BoxGeometry(70, 0.1, 60), MM('grass', { rep: [18, 15] }));
  ground.position.set(0, -0.06, -2); scene.add(ground);
  const H = 1.8;
  const TS = [[-3.2, -1.2], [-1.5, -3.8], [2, -5.6], [6, -6.2], [9.5, -5.4], [11.8, -3.2], [12.2, -0.2], [10.8, 2.4], [7.5, 3.4], [3.5, 3.2], [0, 2.2], [-2.4, 0.8]];
  named.tsarevets = add(cliffHill(TS, H), 0, 0, 0);
  const hillTop = new THREE.Object3D(); hillTop.position.set(4, H + 0.6, -1.5); scene.add(hillTop); named.tsarevets = hillTop;
  const TR = [[-16.5, -11.5], [-13.5, -13.8], [-10, -13], [-9.2, -10], [-10.8, -7.4], [-14.5, -7.2]];
  const H2 = 1.4;
  add(cliffHill(TR, H2), 0, 0, 0);
  const trLbl = labelSprite('Трапезица', { size: 0.42 }); trLbl.position.set(-12.8, H2 + 1.6, -10.4); scene.add(trLbl); stage.steadyLabel(trLbl, 16);
  const tsLbl = labelSprite('Царевец', { size: 0.42 }); tsLbl.position.set(5.2, H + 2.4, -5.0); scene.add(tsLbl); stage.steadyLabel(tsLbl, 16);
  const yan = river([[17, -14], [15, -6], [14.6, 0], [12.5, 4.8], [7, 6.0], [1, 5.4], [-3.5, 4.0], [-6.2, 1.4], [-7.2, -3], [-7.5, -8], [-6.8, -13], [-8.5, -21]], { width: 1.7 });
  scene.add(yan.group);
  const yLbl = labelSprite('р. Янтра', { size: 0.34, color: '#1d4f7a' }); yLbl.position.set(6, 0.6, 6.4); scene.add(yLbl); stage.steadyLabel(yLbl, 16);
  for (const [x, z, s] of [[-17, 4, 1.2], [-17.5, 1, 1], [-16.8, -4, 1.1], [15.5, 8, 1.2], [17, 3, 1], [-3, 8.5, 1.1], [3, 8, 1], [9, 8.4, 1.2], [-18, -14, 1.3], [-5, -16, 1.1], [3, -10, 1.2], [9, -10, 1], [16, -10, 1.1], [-2, -11, 1], [-17.5, 7.5, 1]]) add(tree(s), x, 0, z, x);

  // ---------- Царевец: стени, кули, порта ----------
  const fort = grp('fort');
  const cx = TS.reduce((a, p) => a + p[0], 0) / TS.length, cz = TS.reduce((a, p) => a + p[1], 0) / TS.length;
  const IN = TS.map(([x, z]) => { const dx = cx - x, dz = cz - z, l = Math.hypot(dx, dz); return [x + dx / l * 0.3, z + dz / l * 0.3]; });
  for (let i = 0; i < IN.length; i++) {
    let [x1, z1] = IN[i], [x2, z2] = IN[(i + 1) % IN.length];
    const len0 = Math.hypot(x2 - x1, z2 - z1);
    // Около портата (връх 0) стената спира, за да остане място за кулите на портата.
    if (i === 0) { x1 += (x2 - x1) / len0 * 0.9; z1 += (z2 - z1) / len0 * 0.9; }
    if ((i + 1) % IN.length === 0) { x2 -= (x2 - x1) / len0 * 0.9; z2 -= (z2 - z1) / len0 * 0.9; }
    const len = Math.hypot(x2 - x1, z2 - z1);
    const w = stoneWall(len);
    add(w, (x1 + x2) / 2, H, (z1 + z2) / 2, -Math.atan2(z2 - z1, x2 - x1), fort);
    if (i > 0 && i !== 7) add(stoneTower({ s: 0.62, h: 1.15 }), IN[i][0], H, IN[i][1], -Math.atan2(z2 - z1, x2 - x1), fort);
  }
  const gate = pick('gate', gatehouse({ w: 1.5, h: 0.9 }), 1.2);
  add(gate, IN[0][0] + 0.15, H, IN[0][1] + 0.05, 0.25, fort);
  const baldwin = pick('baldwin', stoneTower({ s: 0.95, h: 2.0 }), 1.2);
  add(baldwin, IN[7][0], H, IN[7][1], 0.4, fort);
  const guards = [medPerson('guard'), medPerson('guard')];
  add(guards[0], IN[0][0] + 0.7, H, IN[0][1] - 0.5, -Math.PI / 2, fort); add(guards[1], IN[0][0] + 0.7, H, IN[0][1] + 0.6, -Math.PI / 2, fort);

  // ---------- Столицата: дворец, Патриаршеска църква, Патриаршия ----------
  const capital = grp('capital');
  const palace = pick('palace', royalPalace(), 2.0);
  add(palace, 3.2, H, -1.4, 0, capital);
  // Знаме на кулата на двореца.
  const flagPole = add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), mat(0x5a3d22)), 1.6, H + 1.25, -2.6, 0, capital);
  const flag = add(new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2, 8, 1), mat(0xb0322b, { side: THREE.DoubleSide })), 1.78, H + 1.42, -2.6, 0, capital);
  const flagBase = flag.geometry.attributes.position.array.slice();
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.0, 0.35, 14), MM('grass', { rep: [1, 1] }));
  add(mound, 7.8, H + 0.17, -3.6, 0, capital);
  const church = pick('church', tarnovoChurch({ L: 1.5, W: 0.95, H: 0.85, bell: true }), 1.4);
  add(church, 7.8, H + 0.35, -3.6, 0, capital);
  const patr = add(medievalHouse({ w: 1.2, d: 0.7 }), 9.9, H, -4.0, -0.75, capital);
  const deskSpot = new THREE.Group(); add(deskSpot, 8.3, H + 0.35, -2.25, 0.3, capital);
  const desk = scribeDesk(); deskSpot.add(desk);
  const evtimiy = medPerson('scribe'); evtimiy.position.set(0, 0, 0.42); evtimiy.rotation.y = Math.PI; deskSpot.add(evtimiy);
  const books = bookStack(7); books.position.set(0, 0.5, -0.42); books.visible = false; deskSpot.add(books);
  named.desk = deskSpot;
  for (const [x, z, r] of [[5.6, -4.8, 0.2], [0.4, -3.2, 0.5]]) staticBits.push(add(tarnovoChurch({ L: 0.8, W: 0.5, H: 0.45 }), x, H, z, r, capital));
  for (const [x, z, r, two] of [[-0.6, 0.4, 0.3, true], [0.7, 1.4, 0.1, false], [5.6, 1.6, 0, true], [7.0, 1.9, -0.2, false], [6.3, 0.3, 0.2, true], [-0.4, -1.6, 0.6, false], [10.4, -1.2, -0.9, true]]) {
    const h = add(medievalHouse({ two }), x, H, z, r, capital); staticBits.push(h);
    if (two) addSmoke(x + Math.cos(r) * 0.22, H + 1.05, z - Math.sin(r) * 0.22, 3);
  }
  const boyars = [medPerson('boyar'), medPerson('boyar'), medPerson('woman'), medPerson('boyar')];
  boyars.forEach((p, i) => add(p, [2.6, 4.4, 5.4, 5.4][i], H, [0.6, 0.9, -0.6, -2.6][i], 0, capital));
  // Трапезица: църкви (една — разкопани основи).
  staticBits.push(add(tarnovoChurch({ L: 0.9, W: 0.55, H: 0.5 }), -13.6, H2, -10.8, 0.2));
  staticBits.push(add(tarnovoChurch({ L: 0.8, W: 0.5, H: 0.45 }), -11.4, H2, -9.2, -0.3));
  staticBits.push(add(tarnovoChurch({ L: 0.9, W: 0.55, ruin: true }), -12.0, H2, -12.2, 0.1));
  for (const [x, z] of [[-14.8, -8.6], [-10.6, -11.8]]) staticBits.push(add(medievalHouse({ two: false }), x, H2, z, 0.3));

  // ---------- Долният град ----------
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.8), MM('cobble', { rep: [3, 3] }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(-10.0, 0.012, -1.3); scene.add(plaza);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 9.6), MM('cobble', { rep: [1, 8] }));
  street.rotation.x = -Math.PI / 2; street.position.set(-11.1, 0.012, 3.0); scene.add(street);
  // Къщи: 18 места; броят им се сменя в опита.
  const SLOTS = [
    [-14.2, 4.4, Math.PI / 2], [-14.2, 3.2, Math.PI / 2], [-14.2, 5.6, Math.PI / 2], [-14.2, 2.0, Math.PI / 2], [-9.5, 4.0, -Math.PI / 2], [-14.2, 0.8, Math.PI / 2],
    [-9.5, 5.2, -Math.PI / 2], [-14.2, -0.4, Math.PI / 2], [-12.8, 7.4, Math.PI], [-9.5, 6.4, -Math.PI / 2], [-11.6, 7.4, Math.PI], [-14.2, -1.6, Math.PI / 2],
    [-14.0, 7.4, Math.PI], [-9.5, 2.8, -Math.PI / 2], [-10.4, 7.6, Math.PI], [-11.2, -4.4, 0], [-9.6, -4.6, 0], [-15.4, 2.6, Math.PI / 2],
  ];
  const houses = SLOTS.map(([x, z, r], i) => {
    const h = add(medievalHouse({ two: i % 3 !== 2 }), x, 0, z, r);
    h.userData.smoke = new THREE.Vector3(x, 1.05, z);
    return h;
  });
  named.house = houses[0];
  houses.slice(0, 6).forEach((h, i) => { if (i % 2 === 0) addSmoke(h.position.x + 0.15, 0.95, h.position.z - 0.1, 3); });

  // Занаятчии: дюкяни с работилници.
  const crafts = grp('crafts');
  const shopAt = (z) => { const d = dukyan(); add(d, -12.4, 0, z, Math.PI / 2, crafts); return d; };
  const smithShop = shopAt(5.2), potterShop = shopAt(3.7), goldShop = shopAt(2.2);
  named.potterShop = potterShop;
  const fg = forge(); fg.scale.setScalar(0.8); add(fg, 0, 0, -0.08, 0, smithShop);
  const wh = potteryWheel(); wh.scale.setScalar(0.8); add(wh, -0.15, 0, -0.08, 0, potterShop);
  const gt = goldTable(); gt.scale.setScalar(0.75); add(gt, 0, 0, -0.08, 0, goldShop);
  for (let i = 0; i < 3; i++) { add(glazedBowl([0x5f8a3a, 0xc9a227, 0x8a5a2b][i]), -0.3 + i * 0.2, potterShop.userData.counterY, potterShop.userData.front, 0, potterShop); }
  add(jug(), 0.35, potterShop.userData.counterY, potterShop.userData.front, 0, potterShop);
  const horseshoes = coins(0x55585e); add(horseshoes, 0.2, smithShop.userData.counterY, smithShop.userData.front, 0, smithShop);
  const gold = coins(0xd4af37); add(gold, -0.2, goldShop.userData.counterY, goldShop.userData.front, 0, goldShop);
  addSmoke(-12.55, 1.2, 5.2, 5);
  const residents = {};
  for (const r of RESIDENTS) {
    const p = medPerson(r.kind);
    add(p, r.pos[0], 0, r.pos[1], Math.PI / 2, r.id === 'merchant' || r.id === 'scribe' ? scene : crafts);
    pick(r.id, p, 0.7);
    const l = labelSprite(r.label, { size: 0.2 }); l.position.y = 0.95; p.add(l); stage.steadyLabel(l, 7);
    residents[r.id] = p;
  }
  residents.merchant.rotation.y = 0;
  const lowChurch = add(tarnovoChurch({ L: 1.1, W: 0.7, H: 0.65 }), -13.2, 0, -3.0, 0);

  // Пазар.
  const market = grp('market');
  const stA = add(stall(), -10.6, 0, -2.0, 0, market); named.stallA = stA;
  const stB = add(stall({ w: 1.0 }), -9.0, 0, -2.0, 0, market);
  const stC = add(stall({ w: 1.0 }), -11.2, 0, -0.2, Math.PI / 2, market);
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat([0xc0392b, 0xe67e22, 0x8bc34a, 0xf1c40f][i])); c.position.set(-0.4 + i * 0.22, 0.42, 0); stA.add(c); }
  for (let i = 0; i < 3; i++) { const b = glazedBowl([0x5f8a3a, 0xc9a227, 0x2f6b8a][i]); b.position.set(-0.3 + i * 0.3, 0.38, 0); stB.add(b); }
  for (let i = 0; i < 3; i++) { const cl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.3), mat([0x8a1f2b, 0x2f4f86, 0xd9c38a][i])); cl.position.set(-0.3 + i * 0.3, 0.4, 0); stC.add(cl); }
  const folk = [];
  [[-9.8, -0.6, 'woman'], [-10.6, -1.0, 'peasant'], [-9.2, -1.2, 'peasant'], [-11.0, 1.5, 'woman'], [-10.8, 4.5, 'peasant']].forEach(([x, z, k]) => {
    const p = medPerson(k); add(p, x, 0, z, 0, market); folk.push(p);
  });

  // Мост, рампа към портата, керван.
  const roads = grp('roads');
  const bridge = add(stoneBridge(3.2, { w: 0.75, h: 0.4 }), -5.6, 0, 1.9, 0.12, roads); named.bridge = bridge;
  // Тесният скалист провлак към главната порта.
  const cw = causeway([-3.9, 0.45, 1.75], [IN[0][0] - 0.1, H, IN[0][1] + 0.05], { w: 0.65 }); scene.add(cw); staticBits.push(cw);
  const caravan = [packHorse(), packHorse(), medPerson('merchant')];
  caravan.forEach((c) => roads.add(c));
  named.caravan = caravan[0];
  const CAR = new THREE.CatmullRomCurve3([[-3.6, 0, 2.0], [-5.6, 0.45, 1.9], [-7.6, 0, 1.6], [-8.6, 0, 0.4], [-9.4, 0, -0.6]].map((p) => new THREE.Vector3(...p)));

  // Ниви и каруца (храната от селата).
  const food = grp('food');
  const fields = [[-13.4, 10.6, 3.2, 1.8], [-9.6, 11.0, 2.6, 1.6], [-17.0, 9.6, 2.4, 2.2], [-5.4, 9.8, 2.4, 1.6]].map(([x, z, w, d]) => add(field(w, d), x, 0, z, 0.05, food));
  named.fieldA = fields[0];
  const ox = cart(); food.add(ox);
  const CART = new THREE.CatmullRomCurve3([[-16, 0, 8.4], [-13, 0, 8.6], [-11.2, 0, 7.9], [-11.0, 0, 6.6]].map((p) => new THREE.Vector3(...p)));
  const peasants = [medPerson('peasant'), medPerson('woman')];
  add(peasants[0], -13.0, 0, 10.2, 0, food); add(peasants[1], -9.6, 0, 10.6, 0, food);

  // Хората в долния град и на Царевец се разхождат.
  const walkers = [];
  [[-11.1, 0.6, 'peasant'], [-11.0, 3.0, 'woman'], [-10.9, 6.0, 'peasant'], [-12.4, -1.6, 'woman']].forEach(([x, z, k]) => { const p = medPerson(k); add(p, x, 0, z); walkers.push(p); });
  wander(stage, walkers, { r: 0.4, speed: 0.25 });
  wander(stage, folk, { r: 0.3, speed: 0.3 });
  wander(stage, boyars, { r: 0.35, speed: 0.2 });
  wander(stage, peasants, { r: 0.5, speed: 0.15 });

  // ---------- Болоня: университетска зала (далеч от Търново) ----------
  const bologna = new THREE.Group(); bologna.position.set(42, 0, 0); scene.add(bologna);
  const bGround = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 6), MM('cobble', { rep: [6, 5] })); bGround.position.y = -0.04; bologna.add(bGround);
  const hall = lectureHall(); bologna.add(hall);
  const bLbl = labelSprite('Болоня (Италия) — университет', { size: 0.3 }); bLbl.position.set(0, 2.5, -1.4); bologna.add(bLbl);
  const professor = medPerson('professor'); professor.position.set(0, 0.48, -1.05); bologna.add(professor);
  const students = [];
  hall.userData.benches.forEach((b, i) => {
    for (const x of [-0.35, 0.35]) {
      const s = medPerson('student'); s.position.set(b.position.x + x, 0.04, b.position.z + 0.08); s.rotation.y = Math.PI; s.visible = false; bologna.add(s); students.push(s);
      const bk = book([0x7a2f22, 0x2f4f86, 0x3f6f4f][i % 3], true); bk.position.set(b.position.x + x, 0.45, b.position.z - 0.26); bk.visible = false; bologna.add(bk); students.push(bk);
    }
  });
  named.hall = hall.userData.cathedra;

  // Неподвижните части се сливат — по-малко рисувания за слаб компютър.
  mergeStatic(fort, [gate, baldwin, ...guards]);
  mergeStatic(baldwin);
  mergeStatic(gate, gate.userData.hinges);
  mergeStatic(palace); mergeStatic(church); mergeStatic(patr);
  houses.forEach((h) => mergeStatic(h));
  for (const sh of [smithShop, potterShop, goldShop]) mergeStatic(sh, [fg, wh, gt]);
  mergeStatic(lowChurch); mergeStatic(bridge);
  mergeStatic(hall, [hall.userData.cathedra]);
  for (const o of staticBits) mergeStatic(o);

  // ---------- Живот ----------
  let warOn = false, droughtOn = false, caravanAway = false;
  stage.tick((dt, t) => {
    yan.tick(dt);
    fg.userData.glow.material.color.setHSL(0.06, 1, 0.5 + Math.sin(t * 9) * 0.08);
    wh.userData.wheel.rotation.y += dt * 4;
    gt.userData.shine.forEach((m, i) => { m.rotation.z = Math.sin(t * 1.5 + i) * 0.4; });
    residents.smith.position.y = Math.abs(Math.sin(t * 4)) * 0.04;
    desk.userData.flame.scale.y = 1 + Math.sin(t * 13) * 0.2;
    professor.rotation.y = Math.sin(t * 0.7) * 0.4;
    // Знамето се вее.
    const p = flag.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = flagBase[i * 3]; p.setZ(i, Math.sin(t * 4 + x * 14) * 0.03 * (x + 0.17) * 3); }
    p.needsUpdate = true;
    // Дим от комините и ковачницата.
    for (const s of smoke) { const k = (t * 0.18 + s.userData.k) % 1; s.position.set(s.userData.x + k * 0.25, s.userData.y + k * 0.9, s.userData.z); s.material.opacity = 0.42 * (1 - k); s.scale.setScalar(0.6 + k * 1.4); }
    // Керванът върви от моста към пазара и обратно.
    const showCar = !warOn && !caravanAway;
    caravan.forEach((c, i) => {
      c.visible = showCar;
      const k = ((t * 0.035 + i * 0.05) % 2);
      const u = k < 1 ? k : 2 - k;
      const pt = CAR.getPointAt(Math.min(0.999, u)), nx = CAR.getPointAt(Math.min(1, u + 0.01));
      c.position.copy(pt);
      const dir = k < 1 ? 1 : -1;
      c.rotation.y = Math.atan2(-(nx.z - pt.z) * dir, (nx.x - pt.x) * dir) + (c.userData.kind === 'merchant' ? -Math.PI / 2 : 0);
      if (c.userData.legs) c.userData.legs.forEach((l, j) => { l.rotation.z = Math.sin(t * 6 + j * Math.PI / 2) * 0.35; });
    });
    ox.visible = !droughtOn;
    { const k = (t * 0.03) % 2, u = k < 1 ? k : 2 - k; const pt = CART.getPointAt(u), nx = CART.getPointAt(Math.min(1, u + 0.01)); ox.position.copy(pt); const dir = k < 1 ? 1 : -1; ox.rotation.y = Math.atan2(-(nx.z - pt.z) * dir, (nx.x - pt.x) * dir); ox.userData.ox.userData.legs.forEach((l, j) => { l.rotation.z = Math.sin(t * 4 + j * Math.PI / 2) * 0.3; }); }
  });

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 1.1, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let clickHandler = null, stopDrag = null;
  const extra = [];
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  // Състояние на града: кои условия са включени.
  const on = {};
  function applyCity() {
    for (const id of ['fort', 'capital', 'crafts', 'market', 'roads', 'food']) groups[id].visible = !!on[id];
    warOn = !!on.war; droughtOn = !!on.drought;
    gate.userData.setOpen(on.war ? 0 : 1);
    for (const f of fields) f.material.color.setHex(on.drought ? 0x9a7b4f : 0xd8b85a);
    const n = houseCount(on);
    houses.forEach((h, i) => { h.visible = i < n; });
    walkers.forEach((w, i) => { w.visible = i < Math.ceil(n / 4); });
    residents.merchant.visible = !!on.market; residents.scribe.visible = !!on.capital;
    lowChurch.visible = !!on.capital;
    return n;
  }
  function fullCity() { for (const c of CONDS) on[c.id] = c.up; applyCity(); }

  // ---------- 1. Разходка ----------
  // На тесен екран камерата на всяка спирка застава по-назад.
  const stops = STOPS.map((s) => {
    if (far === 1) return s;
    const ey = s.eyeY ?? 1.0;
    return { ...s, at: [s.look[0] + (s.at[0] - s.look[0]) * far, s.look[2] + (s.at[1] - s.look[2]) * far], eyeY: s.look[1] + (ey - s.look[1]) * far };
  });
  const seen = new Set();
  const lookAnchor = new THREE.Object3D(); scene.add(lookAnchor);
  let phase = 1;
  const walk = createWalk(stage, { stops, eye: 1.0, menuTitle: 'Спирки', onArrive: arrive });
  function arrive(s) {
      if (phase !== 1) return;
      lookAnchor.position.set(...s.look);
      say(s.anchor === 'look' ? lookAnchor : named[s.anchor] || hillTop, `<b>${esc(s.label)}</b><br>${s.note}`, { cls: 'wide', lift: { gate: 1.4, palace: 1.6, church: 2.0, baldwin: 2.4, tsarevets: 0.4, caravan: 0.9 }[s.anchor] ?? 1.3 });
      seen.add(s.id); walk.mark(s.id);
      shell.score(`Спирки: ${seen.size} от ${STOPS.length}`);
      if (seen.size === STOPS.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { clearTip(); step2(); });
      }
  }
  function step1() {
    phase = 1;
    shell.step(0);
    scores.length = 0;
    seen.clear();
    fullCity();
    walk.showNav(true);
    shell.task('Разходи се из средновековния Търновград. Върви със стрелките долу или избирай спирка от менюто. На всяка спирка се огледай.');
    shell.setControls('');
    clickHandler = null;
    if (walk.current && walk.current.id === 'yantra') {
      // Вече сме на първата спирка (например след „Започни отначало“): само връщаме камерата.
      const s = stops[0];
      stage.flyTo([s.at[0], s.eyeY, s.at[1]], s.look, 1);
      setTimeout(() => arrive(s), 1050);
    } else walk.go('yantra');
  }

  // ---------- 2. Защо градът расте? ----------
  function step2() {
    phase = 2;
    shell.step(1);
    walk.showNav(false);
    for (const c of CONDS) on[c.id] = false;
    let n = applyCity();
    view([-7.5, 10, 13], [-8, 0, -0.5]);
    let mistakes = 0, pending = null;
    const tried = new Set();
    const lbl = () => `Къщи в долния град: ${n} <span class="small">(модел, не истински числа)</span>`;
    const scoreHtml = () => { container.querySelector('.xp-score').innerHTML = lbl(); };
    scoreHtml();
    shell.task('Тук скоро ще расте град. Избери условие. <b>Първо предскажи</b> какво ще стане, после гледай сцената.');
    const allDone = () => tried.size === CONDS.length;
    const good = () => CONDS.every((c) => !!on[c.id] === c.up);
    function list() {
      const finalPhase = allDone();
      const c = shell.setControls(`<div style="display:grid;gap:5px">${CONDS.map((x) => {
        const state = tried.has(x.id) ? (on[x.id] ? '✓ има' : '✗ няма') : '';
        const dis = !finalPhase && tried.has(x.id) ? 'disabled' : '';
        return `<button class="btn cond" data-id="${x.id}" ${dis} style="display:flex;justify-content:space-between;gap:8px;text-align:left;padding:6px 10px">${esc(x.label)}<span class="small">${state}</span></button>`;
      }).join('')}</div>`);
      c.querySelectorAll('.cond').forEach((b) => b.addEventListener('click', () => choose(b.dataset.id)));
    }
    function choose(id) {
      const cnd = CONDS.find((x) => x.id === id);
      if (allDone()) {
        // Последна част: детето само включва и изключва условията.
        on[id] = !on[id];
        const before = n; n = applyCity(); scoreHtml();
        say(named[cnd.anchor], `${on[id] ? 'Включено' : 'Изключено'}: <b>${esc(cnd.label)}</b><br>Къщи: ${before} → ${n}`, { cls: 'tag', lift: 1.2 });
        if (good()) finishStep();
        else list();
        return;
      }
      pending = cnd;
      shell.msg('');
      const c = shell.setControls(`<p><b>${esc(cnd.label)}</b></p><p>Как мислиш, какво ще стане с града?</p>
        <div class="row"><button class="btn" data-p="up">⬆ Ще расте</button><button class="btn" data-p="down">⬇ Ще намалее</button></div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => predict(b.dataset.p === 'up')));
    }
    function predict(up) {
      const cnd = pending; pending = null;
      on[cnd.id] = true; tried.add(cnd.id);
      const before = n; n = applyCity(); scoreHtml();
      const right = up === cnd.up;
      if (!right) mistakes++;
      shell.msg(right ? 'Вярно предсказание!' : `Не позна: къщите ${n > before ? 'се увеличиха' : n < before ? 'намаляха' : 'не се промениха'}. Прочети защо.`, right ? 'good' : 'bad');
      const target = named[cnd.anchor];
      if (cnd.id === 'fort' || cnd.id === 'capital') view([-1.5, 7.5, 10.5], [0, 1, -1.5]);
      else view([-7.5, 10, 13], [-8, 0, -0.5]);
      say(target, `<b>${esc(cnd.label)}</b>: къщи ${before} → ${n}<br>${esc(cnd.why)}`, { cls: (right ? 'good' : 'bad') + ' wide', lift: 1.3 });
      if (allDone()) {
        scores.push(stepScore(mistakes, 3));
        shell.task('Пробва всички условия. <b>Сега изключи лошите условия</b>, за да може градът да расте отново.');
      }
      list();
    }
    function finishStep() {
      view([-7.5, 10, 13], [-8, 0, -0.5]);
      say(houses[0], '<b>Градът процъфтява!</b> Градовете растат, когато има сигурност, власт, достатъчно храна, занаяти и търговия.', { cls: 'good wide', lift: 1.4 });
      shell.msg('Браво! Това са причините за възхода на градовете.', 'good');
      const c = shell.setControls('<button class="btn primary">Напред →</button>');
      c.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
    }
    list();
  }

  // ---------- 3. Кой какво работи? (извори) ----------
  function step3() {
    phase = 3;
    shell.step(2);
    fullCity();
    clickHandler = null;
    caravanAway = true;
    if (far > 1) stage.flyTo([-10.4, 11.5, 9.8], [-10.4, 0, 1.0], 1);
    else view([-5.0, 8.0, 1.1], [-10.4, 0, 1.1]);
    SOURCES.forEach((s, i) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.36), mat(0xfff4d6));
      const l = labelSprite(s.label, { size: 0.24 }); l.position.y = 0.3;
      g.add(b, l);
      stage.steadyLabel(l, 9);
      g.userData.label = l;
      // Широк екран: карти в две редици пред жителите; тесен екран: в колона, а камерата гледа отгоре от юг.
      if (far > 1) g.position.set(-8.4, 0.1, -2.6 + i * 1.75);
      else g.position.set(i % 2 ? -7.0 : -8.4, 0.1, -2.6 + i * 1.75);
      Object.assign(g.userData, { dragId: s.id, home: g.position.clone() });
      addHitBox(g, 0.5);
      scene.add(g); extra.push(g);
    });
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Археолозите и историците научават за живота в града от <b>извори</b>: находки, документи, книги. Завлечи всеки извор при жителя, за чиято работа разказва.');
    shell.setControls('');
    shell.score(`Извори: 0 от ${SOURCES.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.1,
      onDrop(obj) {
        const s = SOURCES.find((x) => x.id === obj.userData.dragId);
        // Най-близкият жител на екрана (в пиксели) — работи еднакво при всеки ъгъл на камерата.
        const el = stage.renderer.domElement;
        const px = (v) => { const q = v.clone().project(stage.camera); return [q.x * el.clientWidth / 2, q.y * el.clientHeight / 2]; };
        const [ox, oy] = px(obj.position);
        let best = null, bd = 60;
        for (const r of RESIDENTS) { const [rx, ry] = px(residents[r.id].position.clone().setY(0.4)); const d = Math.hypot(ox - rx, oy - ry); if (d < bd) { bd = d; best = r.id; } }
        if (!best) { obj.position.copy(obj.userData.home); return; }
        if (best === s.to) {
          obj.userData.locked = true;
          const p = residents[best].position;
          obj.position.set(p.x + 0.75, 0.1, p.z);
          obj.scale.setScalar(0.6);
          obj.userData.label.visible = false;
          placed++;
          shell.score(`Извори: ${placed} от ${SOURCES.length}`);
          shell.msg('Вярно!', 'good');
          say(residents[best], `<b>${esc(RESIDENTS.find((r) => r.id === best).label)}</b><br>${esc(s.note)}`, { cls: 'good wide', lift: 1.1 });
          if (placed === SOURCES.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            say(residents.potter, 'Градът събира хора с различни занятия: занаятчии, търговци, книжовници. За тях разказват находките от разкопките, документите и книгите.', { cls: 'good wide', lift: 1.2 });
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[s.id] = (tries[s.id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(tries[s.id] >= 2 ? `${s.why} Кой работи с това?` : 'Този жител не работи с това. Прочети пак извора.', 'bad');
        }
      },
    });
  }

  // ---------- 4. Предскажи: новото образование ----------
  function step4() {
    phase = 4;
    caravanAway = false;
    shell.step(3);
    shell.score('');
    let mistakes = 0;
    view([42, 3.4, 6.2], [42, 0.8, -0.2]);
    say(hall.userData.cathedra, 'Болоня, края на XI век', { cls: 'tag', lift: 2.0 });
    shell.task('През XII–XIII век в Западна Европа се появяват първите <b>университети</b> — в Болоня, после в Париж. <b>Какво мислиш, че дават те?</b>');
    ask(Q_UNI, () => {
      for (const s of students) s.visible = true;
      say(hall.userData.cathedra, '<b>Така е.</b> Университетът е сдружение на преподаватели и студенти. В Болоня се учи най-вече право, в Париж — богословие. Учат се още медицина и „свободни изкуства“. Лекциите са на латински, затова идват студенти от много страни. <i>Залата е възстановка.</i>', { cls: 'good wide', lift: 1.9 });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">А в Търново? →</button>');
      n.querySelector('button').addEventListener('click', () => {
        clearTip();
        view([9.7, 3.3, -1.0], [8.3, 2.5, -2.25]);
        shell.msg('');
        shell.task('В Търново няма университет. Но около патриарх Евтимий работят книжовници — <b>Търновската книжовна школа</b>. <b>Какво правят те?</b>');
        say(deskSpot, 'Патриарх Евтимий, XIV век', { cls: 'tag', lift: 1.0 });
        ask(Q_EVT, () => {
          books.visible = true;
          say(deskSpot, '<b>Вярно.</b> Евтимий и учениците му уеднаквяват правописа и поправят преводите на църковните книги. Техните книги се четат и в Сърбия, Влахия и Русия. <i>Запазени са ръкописи от тази школа. Масата и книгите тук са възстановка.</i>', { cls: 'good wide', lift: 1.1 });
          shell.msg('Вярно предсказание!', 'good');
          scores.push(stepScore(mistakes, 2));
          const f = shell.setControls('<button class="btn primary">Виж резултата</button>');
          f.querySelector('button').addEventListener('click', () => { clearTip(); shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart); });
        });
      });
    });
    function ask(list, onRight) {
      const c = shell.setControls(`<div style="display:grid;gap:6px">${list.map((p, i) => `<button class="btn" data-i="${i}" style="text-align:left">${esc(p.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = list[+b.dataset.i];
        if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
        onRight();
      }));
    }
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    caravanAway = false;
    for (const s of students) s.visible = false;
    books.visible = false;
    walk.menu.setItems(STOPS.map((x) => ({ id: x.id, label: x.label, icon: x.icon })));
    step1();
  }

  step1();

  container.__demo = { stage, walk, on, houseCount: () => houses.filter((h) => h.visible).length };
  return { dispose() { if (stopDrag) stopDrag(); walk.dispose(); stage.dispose(); } };
}
