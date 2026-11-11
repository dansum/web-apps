// 10.2.6 „Организираното освободително движение“ — Стаята на историка: витрини с извори, маса с карта
// на центровете, работна маса и верига от причини и последици (от БРЦК до Освобождението).
// Стъпки: опознай витрините и изворите → систематизирай Каравелов и Ботев по показатели и сравни
// с Раковски и Левски → оцени делото на Левски по критерии с аргументи от изворите →
// подреди веригата от причини и последици и предскажи какво следва след Априлското въстание.
// Предметите във витрините, стаята и вестниците са възстановка (рисунка), не копия на истински предмети.
// Откъсите от изворите са кратки; където не са дословни, са означени като преразказ.
import { createStage, cornerMenu, esc, labelSprite, THREE } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { createVitrina } from './hist/vitrina.js';
import { M } from './hist/architecture.js';
import { room, windowFrame, keroseneLamp, letterSet } from './hist/home.js';
import { leafTree, mergeStatic } from './hist/revival.js';
import { figure, stride } from './hist/build.js';

const REC = '<br><span class="small"><b>Предметът във витрината е възстановка (рисунка), не истинският предмет.</b></span>';
const PEOPLE = [
  { id: 'rakovski', label: 'Раковски', full: 'Георги Стойков Раковски', icon: '📜',
    note: '<b>Георги Стойков Раковски</b><br><i>Извор (преразказ):</i> в „План за освобождението на България“ (1861 г.) Раковски предлага в Сърбия да се събере българска войска от доброволци. Тя да премине в българските земи и да вдигне народа на въстание.<br>Той създава <b>Първата българска легия</b> в Белград (1861 – 1862 г.) и пише „Привременен закон за народните горски чети“ (1867 г.). Пръв дава план, организация и устав на борбата — затова е <b>основоположник</b> на организираното движение.' + REC },
  { id: 'levski', label: 'Левски', full: 'Васил Левски', icon: '✒',
    note: '<b>Васил Левски</b><br>Левски пише, че свободна България трябва да бъде „чиста и свята република“. <i>Преразказ:</i> в нея всички — българи, турци, евреи и други — да са равни пред закона.<br>Той изгражда <b>мрежа от тайни комитети вътре в страната</b> — Вътрешната революционна организация. Негови са думите: „Ако спечеля, печеля за цял народ, ако загубя, губя само мене си.“' + REC },
  { id: 'karavelov', label: 'Каравелов', full: 'Любен Каравелов', icon: '📰',
    note: '<b>Любен Каравелов</b><br><i>Извор (преразказ):</i> в своите вестници Каравелов пише, че свободата се извоюва с революция и че освободените балкански народи трябва да живеят в съюз.<br>В Букурещ издава вестниците <b>„Свобода“</b> и <b>„Независимост“</b>. Председател е на БРЦК. По-късно се отдръпва от революционната работа и се занимава с просвета.' + REC },
  { id: 'botev', label: 'Ботев', full: 'Христо Ботев', icon: '🖋',
    note: '<b>Христо Ботев</b><br><i>Извор (преразказ):</i> във вестниците си Ботев зове към <b>незабавна революция</b> и пише за свобода и справедливост за бедните и трудещите се. В стихотворението „Хаджи Димитър“: „Тоз, който падне в бой за свобода, той не умира…“<br>Издава „Дума на българските емигранти“ (Браила, 1871 г.), „Будилник“ и „Знаме“ (Букурещ). През 1875 г. застава начело на БРЦК, а през май 1876 г. води чета и загива във Врачанския Балкан.' + REC },
];
const EXTRA = [
  { id: 'map', label: 'Картата на центровете', icon: '🗺',
    note: '<b>Центровете на емиграцията</b><br>В Букурещ, Браила, Белград и Одеса живеят много българи. Тези градове дават на революционерите <b>убежище</b>, <b>печатници</b> за вестници, <b>пари</b> и място за <b>организации</b> като БРЦК. Ловеч е център на комитетите <b>вътре</b> в страната.<br><span class="small"><b>Тънките линии са днешните граници — само за ориентир.</b></span>' },
  { id: 'chain', label: 'Веригата на събитията', icon: '⛓',
    note: '<b>Верига от причини и последици</b><br>Всяко звено е последица на предишното и причина за следващото. В последната стъпка ще я подредиш — от създаването на БРЦК (1869 – 1870 г.) до Освобождението (1878 г.).' },
];
const ITEMS = [...PEOPLE, ...EXTRA];

// Стъпка 2: показатели и стойности за четиримата (Раковски и Левски са дадени, Каравелов и Ботев попълва детето).
const ROWS = [
  { id: 'goal', label: 'Цел' },
  { id: 'means', label: 'Средства' },
  { id: 'org', label: 'Организация' },
  { id: 'center', label: 'Център и печат' },
];
const SHORT = {
  goal: ['Освобождение', 'Република за всички', 'Свобода и балкански съюз', 'Свобода и справедливост'],
  means: ['Войска, която влиза отвън', 'Въстание, готвено вътре', 'Революция и печат', 'Незабавна революция'],
  org: ['Легия, горски чети', 'Тайни комитети', 'БРЦК — председател', 'Начело на БРЦК, чета'],
  center: ['Белград', 'Ловеч — в страната', 'Букурещ', 'Браила, Букурещ'],
};
const COLS = [{ id: 'karavelov', label: 'Любен Каравелов' }, { id: 'botev', label: 'Христо Ботев' }];
const TCARDS = [
  { id: 't1', col: 1, row: 1, t: 'Незабавна революция: въстание и чета' },
  { id: 't2', col: 0, row: 0, t: 'Свободна България в съюз с балканските народи' },
  { id: 't3', col: 1, row: 3, t: 'Браила и Букурещ: „Дума“, „Будилник“, „Знаме“' },
  { id: 't4', col: 0, row: 2, t: 'Председател на БРЦК' },
  { id: 't5', col: 1, row: 0, t: 'Свобода и справедливост за бедните и трудещите се' },
  { id: 't6', col: 0, row: 1, t: 'Революция, подготвена с вестници и книги' },
  { id: 't7', col: 1, row: 2, t: 'Начело на БРЦК (1875 г.), води чета (1876 г.)' },
  { id: 't8', col: 0, row: 3, t: 'Букурещ: вестниците „Свобода“ и „Независимост“' },
];
const ROW_HINT = {
  goal: 'Цел е каква България иска деятелят.',
  means: 'Средства е по какъв път иска да стигне до свободата.',
  org: 'Организация е какво ръководи или създава.',
  center: 'Център и печат е откъде действа и какви вестници издава.',
};
const COMPARE_Q = [
  { t: 'Всички искат свобода, но само Левски изгражда организацията вътре в българските земи.', ok: true },
  { t: 'Каравелов и Ботев действат главно от Белград.', why: 'Не. Виж реда „Център и печат“: Каравелов и Ботев действат в Румъния — Букурещ и Браила.' },
  { t: 'Четиримата предлагат една и съща организация.', why: 'Не. Виж реда „Организация“: легия и чети, тайни комитети, БРЦК.' },
];

// Стъпка 3: оценка на Левски по критерии.
const TRAYS = [
  { id: 'ideas', label: 'Идеи: каква България' },
  { id: 'org', label: 'Организация: какво създава' },
  { id: 'example', label: 'Личен пример' },
  { id: 'none', label: 'Не е за Левски' },
];
const ECARDS = [
  { id: 'e1', tray: 'org', src: 'Факт', t: 'Основава тайни комитети в българските земи; център е Ловеч.' },
  { id: 'e2', tray: 'example', src: 'Цитат', t: '„Ако спечеля, печеля за цял народ, ако загубя, губя само мене си.“' },
  { id: 'e3', tray: 'none', src: 'Факт', t: 'Издава вестник „Знаме“ в Букурещ.' },
  { id: 'e4', tray: 'ideas', src: 'Цитат', t: 'Свободна България да бъде „чиста и свята република“.' },
  { id: 'e5', tray: 'org', src: 'Факт', t: 'Участва в Общото събрание на БРЦК в Букурещ (1872 г.).' },
  { id: 'e6', tray: 'example', src: 'Факт', t: 'Обикаля страната тайно, под чужди имена, с риск за живота си.' },
  { id: 'e7', tray: 'ideas', src: 'Преразказ', t: 'Всички народности в свободна България да са равни пред закона.' },
];
const TRAY_WHY = {
  ideas: 'Това не казва каква държава иска Левски.',
  org: 'Това не е за мрежата или комитетите, които създава.',
  example: 'Това не показва личната му саможертва и поведение.',
  none: 'Това е за Левски — сложи го при подходящия критерий.',
};
const EVAL_Q = [
  { t: 'Делото на Левски е голямо: той пренася подготовката вътре в страната, изгражда мрежа от комитети и мечтае за република с равни права. Неговите идеи и комитети помагат и на Априлското въстание след смъртта му.', ok: true },
  { t: 'Левски сам освобождава България.', why: 'Не. Освобождението идва след Руско-турската война (1877 – 1878 г.), пет години след смъртта на Левски. Оценката трябва да почива на изворите.' },
  { t: 'Делото на Левски няма значение, защото е заловен преди въстанието.', why: 'Не. Изворите показват идеи и мрежа от комитети, които продължават да действат и след него.' },
];

// Стъпка 4: веригата.
const CHAIN = [
  { year: '1869 – 1870', t: 'БРЦК е създаден в Букурещ', place: 'bucharest',
    more: '<b>1869 – 1870 г.</b> В Букурещ е създаден Българският революционен централен комитет (БРЦК). Емиграцията получава ръководен център.' },
  { year: '1872', t: 'Общото събрание на БРЦК: програма и устав', place: 'bucharest',
    more: '<b>1872 г.</b> Общото събрание на БРЦК в Букурещ приема програма и устав. Левски участва; вътрешната организация и емиграцията действат заедно.' },
  { year: '1872 – 1873', t: 'Левски е заловен и обесен; организацията е разтърсена', place: 'sofia', blank: 'c1',
    more: '<b>1872 – 1873 г.</b> След обира в Арабаконак властта разкрива част от комитетите. Левски е заловен и обесен в София (февруари 1873 г.). Организацията е разтърсена.' },
  { year: '1875', t: 'Старозагорското въстание се проваля', place: 'stzagora', blank: 'c2',
    more: '<b>1875 г.</b> БРЦК, вече с Ботев, подготвя въстание. Старозагорското въстание се проваля.' },
  { year: '1875 – 1876', t: 'Гюргевският комитет готви общо въстание', place: 'giurgiu', blank: 'c3',
    more: '<b>1875 – 1876 г.</b> В Гюргево е създаден нов комитет. Той разделя земите на революционни окръзи и подготвя общо въстание.' },
  { year: 'април – май 1876', t: 'Априлското въстание; четата на Ботев', place: 'panag',
    more: '<b>Април – май 1876 г.</b> Избухва Априлското въстание. Четата на Ботев преминава Дунава. Въстанието е жестоко потушено.' },
  { year: '1876 – 1877', t: 'Европа научава; Русия обявява война', place: 'svishtov', predict: true,
    more: '<b>1876 – 1877 г.</b> Вестите за жестокостите обикалят Европа. Цариградската конференция предлага самоуправление за българските земи, но Високата порта го отхвърля. През април 1877 г. Русия обявява война на Османската империя.' },
  { year: '3 март 1878', t: 'Санстефанският мир — Освобождението', place: 'sanstefano', predict: true,
    more: '<b>3 март 1878 г.</b> Санстефанският мирен договор слага край на войната. България е освободена. Днес 3 март е национален празник.' },
];
const CCARDS = [
  { id: 'c3', slot: 4, t: 'Гюргевският комитет готви общо въстание',
    why: 'Гюргевският комитет е създаден след провала на Старозагорското въстание, за да подготви по-добро, общо въстание. Каква е причината за него?' },
  { id: 'c1', slot: 2, t: 'Левски е заловен и обесен; организацията е разтърсена',
    why: 'Залавянето на Левски идва след Общото събрание (1872 г.), когато властта разкрива част от комитетите. Без него БРЦК търси нов път.' },
  { id: 'c2', slot: 3, t: 'Старозагорското въстание се проваля',
    why: 'Старозагорското въстание (1875 г.) е опит на БРЦК, след като организацията остава без Левски. Провалът му води до нов комитет.' },
];
const PREDICT = {
  ask: 'Априлското въстание е жестоко потушено. <b>Какво следва според теб?</b>',
  opts: [
    { t: 'Европа научава за жестокостите; след провала на Цариградската конференция Русия обявява война на Османската империя.', ok: true },
    { t: 'Султанът веднага дава на българите своя държава още през 1876 г.', why: 'Не. Цариградската конференция предлага самоуправление, но Високата порта го отхвърля.' },
    { t: 'Всичко утихва и за българите никой не научава.', why: 'Не. Вестите за жестокостите обикалят Европа — пишат за тях журналисти и дипломати.' },
  ],
};

// Места на картата.
const PLACES = {
  belgrade: { label: 'Белград', lon: 20.46, lat: 44.82 },
  bucharest: { label: 'Букурещ', lon: 26.1, lat: 44.43 },
  braila: { label: 'Браила', lon: 27.97, lat: 45.27 },
  odessa: { label: 'Одеса', lon: 30.2, lat: 46.48 },
  lovech: { label: 'Ловеч', lon: 24.72, lat: 43.14 },
  sofia: { label: 'София', lon: 23.32, lat: 42.7 },
  stzagora: { label: 'Стара Загора', lon: 25.63, lat: 42.43 },
  giurgiu: { label: 'Гюргево', lon: 25.97, lat: 43.9 },
  panag: { label: 'Панагюрище', lon: 24.18, lat: 42.5 },
  kozloduy: { label: 'Козлодуй', lon: 23.73, lat: 43.78 },
  svishtov: { label: 'Свищов', lon: 25.35, lat: 43.62 },
  sanstefano: { label: 'Сан Стефано', lon: 28.82, lat: 40.98 },
};
const EMIGRE = ['belgrade', 'bucharest', 'braila', 'odessa', 'lovech'];
// Кои места светват на картата при сравнение по показател: [деятел, място].
const ROW_PINS = {
  goal: [],
  means: [['rakovski', 'belgrade'], ['levski', 'lovech'], ['karavelov', 'bucharest'], ['botev', 'kozloduy']],
  org: [['rakovski', 'belgrade'], ['levski', 'lovech'], ['karavelov', 'bucharest'], ['botev', 'kozloduy']],
  center: [['rakovski', 'belgrade'], ['levski', 'lovech'], ['karavelov', 'bucharest'], ['botev', 'braila']],
};
const DANUBE = [[20.46, 44.82], [20.93, 44.66], [21.38, 44.77], [21.52, 44.79], [21.74, 44.68], [22.03, 44.62], [22.2, 44.56], [22.35, 44.68],
  [22.5, 44.71], [22.64, 44.6], [22.78, 44.3], [22.95, 44.13], [22.91, 43.99], [23.0, 43.86], [23.23, 43.88], [23.54, 43.85], [23.95, 43.79],
  [24.23, 43.76], [24.43, 43.8], [24.81, 43.74], [25.16, 43.69], [25.5, 43.67], [25.68, 43.71], [25.82, 43.77], [25.93, 43.87], [26.22, 44.01],
  [26.49, 44.09], [26.85, 44.15], [27.26, 44.12], [27.9, 44.1], [27.98, 44.4], [28.0, 44.8], [27.97, 45.15], [28.05, 45.4], [28.4, 45.32],
  [28.8, 45.24], [29.3, 45.32], [29.65, 45.2]];

// Разположение на стаята (в метри).
const RW = 11, RD = 9, RH = 3.2;
const VIT_X = [-4.4, -2.8, -1.2, 0.4], VIT_Z = -3.5;
const MAPT = { x: -1.6, z: 0.35, w: 3.7, d: 2.95, top: 0.86 };
const DESK = { x: 3.2, z: 0.8, w: 3.0, d: 2.2, top: 0.86 };
const SHEET = { x: DESK.x, z: DESK.z - 0.25, w: 2.6, d: 1.5 };

// ---------- рисувани хартии ----------
function canvasOf(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/), lines = [];
  let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
function paperBg(ctx, w, h, seed = 3) {
  ctx.fillStyle = '#f4ead2'; ctx.fillRect(0, 0, w, h);
  let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(150,120,70,${r() * 0.06})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 4 + r() * 18, 0, 7); ctx.fill(); }
}
// Текст, вписан в правоъгълник: намалява шрифта, докато се събере.
function fitText(ctx, text, x, y, maxW, maxH, { size = 40, min = 16, weight = 600, color = '#2a2218', align = 'center' } = {}) {
  let lines, fs = size;
  for (; fs >= min; fs -= 2) {
    ctx.font = `${weight} ${fs}px system-ui, "Segoe UI", Roboto, Arial, sans-serif`;
    lines = wrap(ctx, text, maxW);
    if (lines.length * fs * 1.18 <= maxH && lines.every((l) => ctx.measureText(l).width <= maxW)) break;
  }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  const lh = fs * 1.18, y0 = y - (lines.length - 1) * lh / 2;
  lines.forEach((l, i) => ctx.fillText(l, align === 'center' ? x + maxW / 2 : x, y0 + i * lh));
}

// Хартиена карта (лежи на масата), с рамка и надпис.
function paperCard(text, { w = 0.94, h = 0.28, src = null, color = '#f4ead2', edge = '#8a6a3a' } = {}) {
  const PX = 420;
  const cw = Math.round(w * PX), ch = Math.round(h * PX);
  const tex = canvasOf(cw, ch, (ctx) => {
    paperBg(ctx, cw, ch, text.length + 7);
    if (color !== '#f4ead2') { ctx.fillStyle = color; ctx.globalAlpha = 0.35; ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = 1; }
    ctx.strokeStyle = edge; ctx.lineWidth = 6; ctx.strokeRect(4, 4, cw - 8, ch - 8);
    let top = 0;
    if (src) {
      ctx.font = '700 22px system-ui, sans-serif'; ctx.fillStyle = '#7a2a20'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(src === 'Факт' ? 'ФАКТ' : `ИЗВОР · ${src.toUpperCase()}`, 16, 12); top = 30;
    }
    fitText(ctx, text, 14, top + (ch - top) / 2, cw - 28, ch - top - 18, { size: 40, min: 18 });
  });
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, h), M(0xd9c79a)); back.position.y = 0.006; g.add(back);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  face.rotation.x = -Math.PI / 2; face.position.y = 0.0135; g.add(face);
  g.userData.face = face;
  return g;
}

// ---------- предмети във витрините (възстановки) ----------
function scrollItem() {
  const g = new THREE.Group();
  const paper = M(0xeadcb4);
  const tex = canvasOf(256, 320, (ctx, w, h) => {
    paperBg(ctx, w, h, 5);
    ctx.fillStyle = '#3a2a1a'; ctx.font = '700 30px serif'; ctx.textAlign = 'center'; ctx.fillText('ПЛАНЪ', w / 2, 46);
    ctx.strokeStyle = 'rgba(40,30,20,0.6)'; ctx.lineWidth = 2;
    for (let y = 80; y < h - 20; y += 18) { ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(w - 24 - (y % 36 ? 0 : 40), y); ctx.stroke(); }
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
  sheet.position.y = 0.02; g.add(sheet);
  for (const s of [-1, 1]) {
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.38, 16), paper); roll.rotation.z = Math.PI / 2; roll.position.set(0, s * 0.23 + 0.02, 0.02); g.add(roll);
    for (const k of [-1, 1]) { const knob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), M(0x6b4426)); knob.position.set(k * 0.2, s * 0.23 + 0.02, 0.02); g.add(knob); }
  }
  const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 20), M(0xa02a22)); ribbon.position.set(0.12, -0.21, 0.06); g.add(ribbon);
  return g;
}
function letterItem() {
  const g = new THREE.Group();
  const tex = canvasOf(256, 320, (ctx, w, h) => {
    paperBg(ctx, w, h, 11);
    ctx.strokeStyle = 'rgba(30,40,90,0.75)'; ctx.lineWidth = 2;
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let y = 40; y < h - 50; y += 20) { ctx.beginPath(); let x = 22; ctx.moveTo(x, y); while (x < w - 30) { const d = 10 + r() * 24; ctx.lineTo(x + d, y + (r() - 0.5) * 3); x += d + 6; ctx.moveTo(x, y); } ctx.stroke(); }
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.4), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
  sheet.rotation.z = 0.08; g.add(sheet);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20), M(0xa02a22, { rough: 0.4 }));
  seal.rotation.x = Math.PI / 2; seal.position.set(0.08, -0.14, 0.015); g.add(seal);
  const lion = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 6), M(0x7a1a14)); lion.rotation.x = Math.PI / 2; lion.position.set(0.08, -0.14, 0.027); g.add(lion);
  const pen = new THREE.Group(); pen.position.set(-0.12, -0.05, 0.04); pen.rotation.z = -0.6; g.add(pen);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.003, 0.36, 6), M(0x3a2a1e)); pen.add(shaft);
  const vane = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), M(0xf2efe6, { rough: 0.95 })); vane.scale.set(0.4, 2.6, 0.12); vane.position.y = 0.09; pen.add(vane);
  return g;
}
function newspaperItem(title, city) {
  const g = new THREE.Group();
  const tex = canvasOf(300, 400, (ctx, w, h) => {
    ctx.fillStyle = '#eee6d2'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1e1a16'; ctx.font = '800 46px serif'; ctx.textAlign = 'center'; ctx.fillText(title, w / 2, 58);
    ctx.font = '600 16px serif'; ctx.fillText(city, w / 2, 84);
    ctx.fillRect(16, 94, w - 32, 3); ctx.fillRect(16, 100, w - 32, 1);
    ctx.strokeStyle = 'rgba(40,35,30,0.55)'; ctx.lineWidth = 2;
    for (let c = 0; c < 3; c++) for (let y = 116; y < h - 14; y += 9) { const x0 = 18 + c * ((w - 36) / 3); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (w - 36) / 3 - 10 - ((y * 7 + c * 13) % 23 === 0 ? 30 : 0), y); ctx.stroke(); }
  });
  const page = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.95 });
  const a = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), page); a.position.z = 0.01; g.add(a);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), M(0xe6dcc4, { side: THREE.DoubleSide })); b.position.set(0.02, -0.01, -0.02); b.rotation.y = 0.25; g.add(b);
  return g;
}
const ITEM_OF = {
  rakovski: scrollItem,
  levski: letterItem,
  karavelov: () => newspaperItem('СВОБОДА', 'Букурещ'),
  botev: () => newspaperItem('ЗНАМЕ', 'Букурещ'),
};

// ---------- мебели ----------
function woodTable(w, d, top) {
  const g = new THREE.Group();
  const wood = M(0x6b4426, { rough: 0.6 });
  const tt = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), wood); tt.position.y = top - 0.03; g.add(tt);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, 0.12, d - 0.16), M(0x553420)); apron.position.y = top - 0.12; g.add(apron);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, top - 0.06, 10), wood);
    leg.position.set(sx * (w / 2 - 0.12), (top - 0.06) / 2, sz * (d / 2 - 0.12)); g.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), wood); foot.position.set(sx * (w / 2 - 0.12), 0.04, sz * (d / 2 - 0.12)); g.add(foot);
  }
  return g;
}
function bookcase(w = 2.0, h = 2.4, d = 0.38, seed = 1) {
  const g = new THREE.Group();
  const wood = M(0x5a3a22, { rough: 0.7 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), M(0x3e2816)); back.position.set(0, h / 2, -d / 2 + 0.015); g.add(back);
  for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, d), wood); side.position.set(s * (w / 2 - 0.025), h / 2, 0); g.add(side); }
  const crown = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.08, d + 0.06), wood); crown.position.y = h + 0.04; g.add(crown);
  const n = 5, cols = [0x7a2f22, 0x2f4f6a, 0x5a4a2a, 0x3f5f3a, 0x8a5a2a, 0x2a2a2e, 0x6a2a3a, 0xa8823a];
  let s = seed * 97 + 13; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) {
    const y = 0.08 + i * (h - 0.1) / n;
    const sh = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.035, d - 0.03), wood); sh.position.y = y; g.add(sh);
    let x = -w / 2 + 0.08;
    while (x < w / 2 - 0.16) {
      if (r() < 0.07) { x += 0.12; continue; }
      const bw = 0.035 + r() * 0.04, bh = 0.24 + r() * 0.16;
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d - 0.1), M(cols[Math.floor(r() * cols.length)], { rough: 0.75 }));
      b.position.set(x + bw / 2, y + 0.018 + bh / 2, 0.02);
      if (r() < 0.08) b.rotation.z = 0.18;
      g.add(b);
      const band = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.002, 0.015, d - 0.098), M(0xc9a640, { metal: 0.5, rough: 0.4 }));
      band.position.set(x + bw / 2, y + 0.018 + bh * 0.8, 0.02); g.add(band);
      x += bw + 0.004;
    }
  }
  return mergeStatic(g);
}
function wallClock() {
  const g = new THREE.Group();
  const wood = M(0x5a3a22, { rough: 0.5 });
  const cas = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.1, 0.16), wood); cas.position.y = -0.3; g.add(cas);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 24, 1, false, 0, Math.PI), wood); top.rotation.x = Math.PI / 2; top.rotation.z = -Math.PI / 2; top.position.y = 0.25; g.add(top);
  const faceTex = canvasOf(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a2218'; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = '#2a2218'; ctx.font = '700 30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ['XII', 'III', 'VI', 'IX'].forEach((s, i) => { const a = i * Math.PI / 2 - Math.PI / 2; ctx.fillText(s, w / 2 + Math.cos(a) * 92, h / 2 + Math.sin(a) * 92); });
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), new THREE.MeshStandardMaterial({ map: faceTex })); face.position.set(0, 0.12, 0.085); g.add(face);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.13, 0.005), M(0x1a1410)); hand.position.set(0, 0.12, 0.09); hand.geometry.translate(0, 0.055, 0); g.add(hand);
  const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.09, 0.005), M(0x1a1410)); hand2.position.set(0, 0.12, 0.092); hand2.geometry.translate(0, 0.04, 0); g.add(hand2);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.62), new THREE.MeshStandardMaterial({ color: 0xcfe6ee, transparent: true, opacity: 0.25, roughness: 0.05 })); glass.position.set(0, -0.45, 0.085); g.add(glass);
  const pend = new THREE.Group(); pend.position.set(0, -0.12, 0.05); g.add(pend);
  const rod = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.55, 0.01), M(0xc9a640, { metal: 0.6, rough: 0.3 })); rod.position.y = -0.275; pend.add(rod);
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 20), M(0xc9a640, { metal: 0.7, rough: 0.25 })); bob.rotation.x = Math.PI / 2; bob.position.y = -0.55; pend.add(bob);
  g.userData = { pend, hand, hand2 };
  return g;
}
function chair() {
  const g = new THREE.Group();
  const wood = M(0x6b4426, { rough: 0.6 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.44), wood); seat.position.y = 0.46; g.add(seat);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.02, 0.46, 8), wood); l.position.set(sx * 0.19, 0.23, sz * 0.18); g.add(l); }
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.5, 8), wood); p.position.set(sx * 0.19, 0.73, -0.2); g.add(p); }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.03), wood); rail.position.set(0, 0.92, -0.2); g.add(rail);
  return g;
}

export function mount(container, { skill = {}, onComplete } = {}) {
  const shell = createShell(container, { steps: ['Опознай', 'Систематизирай', 'Оцени Левски', 'Предскажи веригата'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const narrow = aspect < 1.2;
  const far = aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[1.2, 7.2 * far, 10.0 * far], [-0.4, 0.6, 0.2]];
  const CMPV = [[-0.6, 3.6 * far, 3.9 * far + 0.6], [-1.3, 0.9, -1.3]];
  const DESKV = [[DESK.x, DESK.top + 2.6 * Math.min(far, 1.8), DESK.z + 2.1 * Math.min(far, 1.8)], [DESK.x, DESK.top, DESK.z + 0.05]];
  const stage = createStage(shell.stageEl, { background: 0x2a2018, camPos: VIEW[0], target: VIEW[1], maxDistance: 30, minDistance: 1.5 });
  stage.renderer.localClippingEnabled = true;

  let map = null, menu = null, tip = null, clickHandler = null, stopDrag = null;
  const scores = [];
  const vitrinas = new Map();   // id → vitrina
  const vlabels = new Map();    // id → етикет със стойност (стъпка 2)
  const pins = new Map();       // id → карфица
  const placed = [];            // карти, сложени на масата (за „отначало“)
  const tipEl = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.4, ...opts }); return tip; };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const anchorAt = (x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); stage.scene.add(o); return o; };
  const cmpAnchor = anchorAt(narrow ? MAPT.x : 1.1, MAPT.top + 0.3, narrow ? MAPT.z + 0.6 : -0.6);

  // ---------- стаята ----------
  const rm = room({ W: RW, D: RD, H: RH, win: [2.2, 3.8, 1.0, 2.5] });
  stage.scene.add(rm);
  const win = windowFrame(1.6, 1.5, 0); win.position.set(3.0, 1.75, -RD / 2 - 0.02); stage.scene.add(win);
  // Навън: небе и дърво, което се люлее.
  const skyTex = canvasOf(64, 128, (ctx, w, h) => { const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8ec3ea'); gr.addColorStop(1, '#e6f1f6'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshBasicMaterial({ map: skyTex })); sky.position.set(3.0, 1.75, -RD / 2 - 1.8); stage.scene.add(sky);
  const tree = leafTree(1); tree.scale.setScalar(3.2); tree.position.set(3.5, -0.4, -RD / 2 - 1.4); stage.scene.add(tree);
  // Сноп светлина и прашинки в него.
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 3.0), new THREE.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0.16, depthWrite: false }));
  beam.position.set(3.0, 0.02, -RD / 2 + 1.6); stage.scene.add(beam);
  const NDUST = 70, dustPos = new Float32Array(NDUST * 3), dustSeed = [];
  for (let i = 0; i < NDUST; i++) { dustSeed.push([Math.random(), Math.random(), Math.random()]); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xfff4d0, size: 0.03, transparent: true, opacity: 0.8, depthWrite: false }));
  stage.scene.add(dust);
  // Рафтове с книги и часовник на лявата стена.
  for (const [z, s] of [[-2.9, 1], [-0.7, 2], [1.5, 3]]) { const b = bookcase(2.0, 2.5, 0.38, s); b.rotation.y = Math.PI / 2; b.position.set(-RW / 2 + 0.22, 0, z); stage.scene.add(b); }
  const clock = wallClock(); clock.rotation.y = Math.PI / 2; clock.position.set(-RW / 2 + 0.1, 2.1, 3.3); stage.scene.add(clock);
  // Надпис на задната стена.
  const signTex = canvasOf(1024, 160, (ctx, w, h) => {
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#c9a640'; ctx.lineWidth = 8; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#f2e6c8'; ctx.font = '700 54px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Организираното освободително движение', w / 2, 66);
    ctx.font = '500 34px serif'; ctx.fillText('Стаята на историка', w / 2, 118);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.56), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 })); sign.position.set(-1.9, 2.55, -RD / 2 + 0.01); stage.scene.add(sign);
  // Килим под масата с картата.
  const rugTex = canvasOf(256, 256, (ctx, w, h) => { ctx.fillStyle = '#7a1f28'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#d9b46a'; ctx.lineWidth = 10; ctx.strokeRect(14, 14, w - 28, h - 28); ctx.strokeStyle = '#1f2f4a'; ctx.lineWidth = 6; ctx.strokeRect(32, 32, w - 64, h - 64); ctx.fillStyle = '#d9b46a'; ctx.beginPath(); ctx.moveTo(w / 2, 70); ctx.lineTo(w - 70, h / 2); ctx.lineTo(w / 2, h - 70); ctx.lineTo(70, h / 2); ctx.closePath(); ctx.fill(); });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 4.0), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 })); rug.rotation.x = -Math.PI / 2; rug.position.set(MAPT.x, 0.006, MAPT.z); stage.scene.add(rug);

  // Витрините.
  PEOPLE.forEach((p, i) => {
    const v = createVitrina(stage, { id: p.id, x: VIT_X[i], z: VIT_Z, label: p.label, item: ITEM_OF[p.id]() });
    v.group.userData.hit = v.group;
    vitrinas.set(p.id, v);
  });

  // Масата с картата.
  const mt = woodTable(MAPT.w, MAPT.d, MAPT.top); mt.position.set(MAPT.x, 0, MAPT.z); stage.scene.add(mt);
  const mtHit = new THREE.Mesh(new THREE.BoxGeometry(MAPT.w, 0.3, MAPT.d), new THREE.MeshBasicMaterial({ visible: false })); mtHit.position.y = MAPT.top; mtHit.userData.isHitBox = true; mt.add(mtHit);
  mt.userData.pickId = 'map';
  const seaMat = new THREE.MeshStandardMaterial({ color: 0x6fa9cf, roughness: 0.5 });
  const sea = new THREE.Mesh(new THREE.BoxGeometry(MAPT.w - 0.2, 0.02, MAPT.d - 0.2), seaMat); sea.position.set(MAPT.x, MAPT.top + 0.01, MAPT.z); stage.scene.add(sea);
  const frameM = M(0x3a2414);
  for (const [w, d, dx, dz] of [[MAPT.w - 0.1, 0.06, 0, -(MAPT.d - 0.16) / 2], [MAPT.w - 0.1, 0.06, 0, (MAPT.d - 0.16) / 2], [0.06, MAPT.d - 0.1, -(MAPT.w - 0.16) / 2, 0], [0.06, MAPT.d - 0.1, (MAPT.w - 0.16) / 2, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), frameM); f.position.set(MAPT.x + dx, MAPT.top + 0.035, MAPT.z + dz); stage.scene.add(f);
  }

  // Работната маса.
  const desk = woodTable(DESK.w, DESK.d, DESK.top); desk.position.set(DESK.x, 0, DESK.z); stage.scene.add(desk);
  const ch = chair(); ch.position.set(DESK.x - 0.6, 0, DESK.z - DESK.d / 2 - 0.35); stage.scene.add(ch);
  const lamp = keroseneLamp(); lamp.scale.setScalar(1.4); lamp.position.set(DESK.x + DESK.w / 2 - 0.15, DESK.top, DESK.z - DESK.d / 2 + 0.15); stage.scene.add(lamp);
  const glow = new THREE.PointLight(0xffb050, 0.6, 3.5); glow.position.set(lamp.position.x, DESK.top + 0.5, lamp.position.z); stage.scene.add(glow);
  const ls = letterSet(); ls.scale.setScalar(1.5); ls.position.set(DESK.x - DESK.w / 2 + 0.4, DESK.top, DESK.z + DESK.d / 2 - 0.35); stage.scene.add(ls);
  // Листът за таблицата.
  const sheetTex = canvasOf(1040, 600, (ctx, w, h) => {
    paperBg(ctx, w, h, 21);
    const cx = [0, 240, 640, 1040], ry = [0, 100, 225, 350, 475, 600];
    ctx.fillStyle = 'rgba(160,120,60,0.18)'; ctx.fillRect(0, 0, w, 100); ctx.fillRect(0, 0, 240, h);
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4;
    for (const x of cx) { ctx.beginPath(); ctx.moveTo(Math.min(x, w - 2), 0); ctx.lineTo(Math.min(x, w - 2), h); ctx.stroke(); }
    for (const y of ry) { ctx.beginPath(); ctx.moveTo(0, Math.min(y, h - 2)); ctx.lineTo(w, Math.min(y, h - 2)); ctx.stroke(); }
    fitText(ctx, 'Показател', 10, 50, 220, 80, { size: 34, weight: 800 });
    COLS.forEach((c, i) => fitText(ctx, c.label, cx[i + 1] + 10, 50, 380, 80, { size: 40, weight: 800 }));
    ROWS.forEach((r, i) => fitText(ctx, r.label, 10, (ry[i + 1] + ry[i + 2]) / 2, 220, 110, { size: 34, weight: 700 }));
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(SHEET.w, SHEET.d), new THREE.MeshStandardMaterial({ map: sheetTex, roughness: 0.95 }));
  sheet.rotation.x = -Math.PI / 2; sheet.position.set(SHEET.x, DESK.top + 0.004, SHEET.z); stage.scene.add(sheet);
  const cellPos = (col, row) => new THREE.Vector3(SHEET.x - SHEET.w / 2 + 0.6 + 0.5 + col * 1.0, DESK.top + 0.008, SHEET.z - SHEET.d / 2 + 0.25 + 0.15625 + row * 0.3125);
  const cellMarks = new Map();
  for (let c = 0; c < 2; c++) for (let r = 0; r < 4; r++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.29), new THREE.MeshBasicMaterial({ color: 0x2b6cb0, transparent: true, opacity: 0.0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.copy(cellPos(c, r)); m.position.y += 0.002; stage.scene.add(m);
    m.userData.pickId = `cell-${c}-${r}`; cellMarks.set(`${c}-${r}`, m);
  }
  const rowGlow = new THREE.Mesh(new THREE.PlaneGeometry(SHEET.w, 0.31), new THREE.MeshBasicMaterial({ color: 0xf2c94c, transparent: true, opacity: 0.35, depthWrite: false }));
  rowGlow.rotation.x = -Math.PI / 2; rowGlow.visible = false; stage.scene.add(rowGlow);

  // Тавите за стъпка 3 (на мястото на листа).
  const trays = new Map();
  const TRAY_AT = narrow ? [[-0.72, -0.55], [0.72, -0.55], [-0.72, 0.12], [0.72, 0.12]] : [[-0.72, -0.55], [0.72, -0.55], [-0.72, 0.12], [0.72, 0.12]];
  TRAYS.forEach((t, i) => {
    const g = new THREE.Group();
    const isNone = t.id === 'none';
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.02, 0.6), M(isNone ? 0x8a8a84 : 0x7a5a32, { rough: 0.7 })); base.position.y = 0.01; g.add(base);
    for (const [w, d, x, z] of [[1.36, 0.03, 0, -0.3], [1.36, 0.03, 0, 0.3], [0.03, 0.6, -0.68, 0], [0.03, 0.6, 0.68, 0]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), M(isNone ? 0x5a5a56 : 0x553420)); e.position.set(x, 0.03, z); g.add(e); }
    const ttex = canvasOf(560, 70, (ctx, w, h) => { ctx.fillStyle = isNone ? '#d8d6cc' : '#efe2c0'; ctx.fillRect(0, 0, w, h); fitText(ctx, t.label, 8, h / 2, w - 16, h - 8, { size: 40, weight: 800, color: isNone ? '#4a4a46' : '#4a2a10' }); });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.16), new THREE.MeshStandardMaterial({ map: ttex })); plate.rotation.x = -Math.PI / 2; plate.position.set(0, 0.026, -0.2); g.add(plate);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.56), new THREE.MeshBasicMaterial({ color: 0x2fb36b, transparent: true, opacity: 0, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.024; g.add(ring);
    g.position.set(DESK.x + TRAY_AT[i][0], DESK.top, DESK.z + TRAY_AT[i][1]);
    g.userData = { pickId: `tray-${t.id}`, ring, n: 0 };
    g.visible = false;
    stage.scene.add(g);
    trays.set(t.id, g);
  });

  // Пейката с веригата.
  const DOM_W = 0.62, DOM_H = 0.86, BENCH_Y = 0.42;
  const domAt = (i) => narrow ? { x: -2.25 + (i % 4) * 1.5, z: i < 4 ? 2.55 : 3.75 } : { x: -4.3 + i * 1.18, z: 3.15 };
  const CHAIN_CARD = narrow ? new THREE.Vector3(0, BENCH_Y + 0.05, 4.65) : new THREE.Vector3(-0.2, BENCH_Y + 0.05, 4.15);
  const benches = narrow ? [{ x: 0, z: 2.55, w: 6.2 }, { x: 0, z: 3.75, w: 6.2 }] : [{ x: -0.17, z: 3.15, w: 9.7 }];
  const benchG = new THREE.Group();
  for (const b of benches) {
    const top = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.08, 0.6), M(0xffffff, { tex: 'limestone', rep: [Math.round(b.w), 1] })); top.position.set(b.x, BENCH_Y - 0.04, b.z); benchG.add(top);
    const body = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.12, BENCH_Y - 0.08, 0.5), M(0x5a3a22)); body.position.set(b.x, (BENCH_Y - 0.08) / 2, b.z); benchG.add(body);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(b.w, 1.2, 0.8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(b.x, 0.6, b.z); hit.userData.isHitBox = true; benchG.add(hit);
  }
  benchG.userData.pickId = 'chain';
  stage.scene.add(benchG);
  function drawFace(ctx, w, h, i, d, state) {
    paperBg(ctx, w, h, 31 + i);
    ctx.fillStyle = state === 'blank' ? 'rgba(120,120,120,0.25)' : state === 'done' ? 'rgba(47,179,107,0.18)' : 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#7a2a20'; ctx.beginPath(); ctx.arc(w / 2, 62, 44, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 56px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), w / 2, 64);
    if (state === 'blank') { ctx.fillStyle = '#5a5a5a'; ctx.font = '800 150px serif'; ctx.fillText('?', w / 2, 250); return; }
    fitText(ctx, d.year, 14, 140, w - 28, 50, { size: 34, weight: 800, color: '#7a2a20' });
    fitText(ctx, d.t, 18, 270, w - 36, 190, { size: 36, min: 18, weight: 700 });
  }
  const dominos = CHAIN.map((d, i) => {
    const pos = domAt(i);
    const pivot = new THREE.Group(); pivot.position.set(pos.x + DOM_W / 2, BENCH_Y, pos.z);
    const body = new THREE.Group(); body.position.x = -DOM_W / 2; pivot.add(body);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(DOM_W, DOM_H, 0.08), M(0x6b4426, { rough: 0.6 })); slab.position.y = DOM_H / 2; body.add(slab);
    const c = document.createElement('canvas'); c.width = 256; c.height = 360;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(DOM_W - 0.06, DOM_H - 0.06), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    face.position.set(0, DOM_H / 2, 0.042); body.add(face);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(DOM_W + 0.1, DOM_H + 0.2, 0.5), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = DOM_H / 2; hit.userData.isHitBox = true; body.add(hit);
    body.userData.pickId = `dom-${i}`;
    stage.scene.add(pivot);
    const D = { i, d, pivot, body, tex, c, fall: 0, falling: false, state: '' };
    D.draw = (state) => { D.state = state; drawFace(c.getContext('2d'), c.width, c.height, i, d, state); tex.needsUpdate = true; };
    D.draw(d.blank || d.predict ? 'blank' : '');
    return D;
  });

  // Историкът, който се разхожда покрай рафтовете.
  const hist = figure({ tunic: 0x2a3550, legs: 0x3a3a40, hair: 0x5a5a5a });
  hist.position.set(-RW / 2 + 1.0, 0, -2.0); stage.scene.add(hist);
  const histBook = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.26), M(0x7a2f22)); histBook.position.set(0.18, -0.55, 0.1); hist.userData.arms[1].add(histBook);

  // Живот на сцената.
  stage.tick((dt, t) => {
    // Историкът ходи напред-назад и спира да чете.
    const walking = (t % 14) < 10;
    if (walking) {
      hist.userData.z = (hist.userData.z ?? -2.0) + dt * 0.45 * (hist.userData.dir ?? 1);
      if (hist.userData.z > 2.6) hist.userData.dir = -1;
      if (hist.userData.z < -2.4) hist.userData.dir = 1;
      hist.position.z = hist.userData.z;
      hist.rotation.y = (hist.userData.dir ?? 1) > 0 ? 0 : Math.PI;
      stride(hist, t * 5.5, 1);
    } else {
      stride(hist, 0, 0);
      hist.rotation.y = -Math.PI / 2;
      hist.userData.arms[1].rotation.x = -0.9;
    }
    // Прашинките в снопа светлина.
    for (let i = 0; i < NDUST; i++) {
      const [a, b, c] = dustSeed[i];
      const u = (a + t * 0.02 * (0.5 + b)) % 1;
      dustPos[i * 3] = 2.3 + c * 1.4 + Math.sin(t * 0.4 + i) * 0.08;
      dustPos[i * 3 + 1] = 0.1 + ((b + t * 0.015) % 1) * 2.2;
      dustPos[i * 3 + 2] = -RD / 2 + 0.2 + u * 2.6;
    }
    dustGeo.attributes.position.needsUpdate = true;
    tree.rotation.z = Math.sin(t * 0.7) * 0.025;
    clock.userData.pend.rotation.z = Math.sin(t * Math.PI) * 0.18;
    clock.userData.hand.rotation.z = -t * 0.05;
    clock.userData.hand2.rotation.z = -t * 0.004;
    const f = lamp.userData.flame; f.scale.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 9 + 1) * 0.15, 1);
    glow.intensity = 0.55 + Math.sin(t * 11) * 0.05;
    seaMat.color.setHSL(0.57, 0.45, 0.62 + Math.sin(t * 0.8) * 0.02);
    // Падащите звена.
    for (const D of dominos) {
      if (D.falling && D.fall < 1) { D.fall = Math.min(1, D.fall + dt * 2.6); D.pivot.rotation.z = -1.22 * (D.fall * D.fall); }
    }
    for (const p of pins.values()) if (p.visible) p.userData.head.scale.setScalar(1 + Math.sin(t * 3 + p.position.x) * 0.12);
  });

  // ---------- карфици на картата ----------
  const MAP_OFF = new THREE.Vector3(MAPT.x, MAPT.top + 0.02, MAPT.z);
  const P = (lon, lat, y = 0) => map.pos(lon, lat, y).add(MAP_OFF);
  function addPin(id) {
    const p = PLACES[id];
    const g = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6), M(0x5a5a5a)); stick.position.y = 0.1; g.add(stick);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xd23b3b, roughness: 0.4 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 10), headMat); head.position.y = 0.21; g.add(head);
    const lbl = labelSprite(p.label, { size: 0.085, bg: 'rgba(255,255,255,0.9)', border: 'rgba(0,0,0,0)' }); lbl.position.y = 0.33; g.add(lbl);
    g.position.copy(P(p.lon, p.lat, 0.03));
    g.userData = { head, headMat, label: lbl };
    g.visible = false;
    stage.scene.add(g);
    pins.set(id, g);
    return g;
  }
  const pinColor = (id, hex) => { const g = pins.get(id); if (g) g.userData.headMat.color.setHex(hex); };
  const showPins = (ids, hex = 0xd23b3b) => { for (const [id, g] of pins) { g.visible = ids.includes(id); pinColor(id, hex); } };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    clearTip();
    showPins(EMIGRE);
    pinColor('lovech', 0x2f8a4a);
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    shell.task('Това е стаята на историка. Във витрините има извори за Раковски, Левски, Каравелов и Ботев, на масата — карта на центровете, а отпред — веригата на събитията. <b>Разгледай всичко</b>: избери от менюто или кликни в стаята.');
    const seen = new Set();
    const open = (id) => {
      const it = ITEMS.find((x) => x.id === id);
      if (!it) return;
      let obj, opts;
      if (vitrinas.has(id)) { obj = vitrinas.get(id).group; opts = { dist: 4.4 * Math.min(far, 1.7), height: 0.3, lift: 1.7 }; }
      else if (id === 'map') { obj = mt; opts = { dist: 3.2 * Math.min(far, 1.8), height: 2.6 * Math.min(far, 1.8), lift: MAPT.top }; }
      else { obj = benchG; opts = { dist: 4.2 * Math.min(far, 1.8), height: 1.6 * Math.min(far, 1.8), lift: 0.4 }; }
      stage.focusOn(obj, { ...opts, keepFollow: false });
      const anchor = vitrinas.has(id) ? obj : id === 'map' ? anchorAt(MAPT.x, MAPT.top, MAPT.z - 0.4) : anchorAt(narrow ? 0 : -0.2, BENCH_Y, narrow ? 2.55 : 3.15);
      tipEl(anchor, it.note, { cls: 'wide', lift: vitrinas.has(id) ? 2.15 : 0.7 });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${ITEMS.length}`);
      if (seen.size === ITEMS.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    if (menu) menu.remove();
    menu = cornerMenu(stage, { title: 'Разгледай', items: ITEMS.map((p) => ({ id: p.id, label: p.label, icon: p.icon })), onSelect: open });
    clickHandler = (id) => { if (id && id.startsWith('dom-')) id = 'chain'; if (id && ITEMS.some((x) => x.id === id)) open(id); };
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${ITEMS.length}`);
  }

  // ---------- общо: влачене на хартиени карти ----------
  let current = null;            // { def, g, home }
  function spawnCard(def, text, at, opts) {
    const g = paperCard(text, opts);
    g.position.copy(at);
    g.userData.dragId = def.id;
    g.userData.pickId = def.id;
    const hb = new THREE.Mesh(new THREE.BoxGeometry(opts.w + 0.1, 0.12, opts.h + 0.1), new THREE.MeshBasicMaterial({ visible: false })); hb.userData.isHitBox = true; g.add(hb);
    g.userData.hit = hb;
    stage.scene.add(g);
    placed.push(g);
    current = { def, g, home: at.clone() };
    return g;
  }

  // ---------- 2. Систематизирай ----------
  function step2() {
    shell.step(1);
    clickHandler = null;
    showPins([]);
    sheet.visible = true;
    for (const m of cellMarks.values()) m.visible = true;
    stage.flyTo(DESKV[0], DESKV[1], 1.1);
    let mistakes = 0, k = 0;
    const tries = {};
    const CARD_AT = new THREE.Vector3(DESK.x, DESK.top + 0.01, DESK.z + 0.82);
    const showTask = () => {
      const c = TCARDS[k];
      shell.task(`Систематизирай дейността на <b>Каравелов</b> и <b>Ботев</b> по показатели. Завлечи картата в правилната клетка на таблицата.<br><span class="small">Карта:</span> <b>„${esc(c.t)}“</b>`);
    };
    const next = () => {
      shell.score(`Попълнени: ${k} от ${TCARDS.length}`);
      if (k >= TCARDS.length) return;
      spawnCard(TCARDS[k], TCARDS[k].t, CARD_AT, { w: 0.94, h: 0.28 });
      showTask();
    };
    shell.setControls('<p class="small">Подсказка: прочети отново изворите във витрините, ако не си сигурен.</p>');
    next();
    stopDrag = stage.enableDrag({
      planeY: DESK.top + 0.01,
      onDrop(obj) {
        const c = TCARDS.find((x) => x.id === obj.userData.dragId);
        let best = null, bd = 1e9;
        for (const [key, m] of cellMarks) { const d = Math.hypot(m.position.x - obj.position.x, (m.position.z - obj.position.z) * 1.6); if (d < bd) { bd = d; best = key; } }
        if (!best || bd > 0.6) { obj.position.copy(current.home); return; }
        const [col, row] = best.split('-').map(Number);
        if (col === c.col && row === c.row) {
          obj.userData.dragId = undefined; obj.userData.locked = true;
          obj.position.copy(cellPos(col, row));
          cellMarks.get(best).material.opacity = 0;
          tipEl(obj, `<b>${esc(COLS[col].label)} — ${esc(ROWS[row].label.toLowerCase())}</b>`, { cls: 'good tag', lift: 0.15 });
          shell.msg('Вярно!', 'good');
          k++;
          if (k < TCARDS.length) { next(); return; }
          shell.score(`Попълнени: ${k} от ${TCARDS.length}`);
          stopDrag(); stopDrag = null;
          compare();
        } else {
          mistakes++;
          tries[c.id] = (tries[c.id] || 0) + 1;
          obj.position.copy(current.home);
          const r = ROWS[c.row];
          const why = col !== c.col
            ? `Това не е за ${COLS[col].label.split(' ')[1]}. Спомни си извора в неговата витрина.`
            : `Деятелят е верен, но показателят не е. ${ROW_HINT[r.id]}`;
          shell.msg(`${why} Опитай пак.`, 'bad');
          if (tries[c.id] >= 2) { const m = cellMarks.get(`${c.col}-${c.row}`); m.material.color.setHex(0xf2b01e); m.material.opacity = 0.45; }
        }
      },
    });

    // Опит: сравни по показател — витрините и картата се променят.
    function compare() {
      clearTip();
      const viewed = new Set();
      shell.task('<b>Сравни четиримата.</b> Избери показател: над витрините и на картата ще видиш стойностите и за Раковски и Левски.');
      shell.msg('');
      const c = shell.setControls(`<div class="row">${ROWS.map((r) => `<button class="btn" data-r="${r.id}">${esc(r.label)}</button>`).join('')}</div>`);
      stage.flyTo(CMPV[0], CMPV[1], 1.1);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const rid = b.dataset.r;
        viewed.add(rid);
        c.querySelectorAll('button').forEach((x) => x.classList.toggle('primary', x === b));
        showRow(rid);
        shell.score(`Сравнени показатели: ${viewed.size} от ${ROWS.length}`);
        if (viewed.size === ROWS.length && !c.querySelector('.q')) ask();
      }));
    }
    function showRow(rid) {
      const ri = ROWS.findIndex((r) => r.id === rid);
      rowGlow.visible = true; rowGlow.position.copy(cellPos(0, ri)); rowGlow.position.x = SHEET.x; rowGlow.position.y += 0.012;
      PEOPLE.forEach((p, i) => {
        if (vlabels.has(p.id)) vitrinas.get(p.id).group.remove(vlabels.get(p.id));
        const l = labelSprite(SHORT[rid][i], { size: 0.12, bg: 'rgba(255,248,225,0.96)', border: '#b9a77a' });
        l.position.y = i % 2 ? 2.2 : 2.38;
        vitrinas.get(p.id).group.add(l); vlabels.set(p.id, l);
      });
      const ids = ROW_PINS[rid].map((x) => x[1]);
      for (const id of ids) if (!pins.has(id)) addPin(id);
      showPins(ids);
      for (const [who, id] of ROW_PINS[rid]) pinColor(id, who === 'levski' ? 0x2f8a4a : 0xd23b3b);
      const anchor = cmpAnchor;
      const list = PEOPLE.map((p, i) => `<b>${esc(p.label)}:</b> ${esc(SHORT[rid][i])}`).join('<br>');
      tipEl(anchor, `<b>${esc(ROWS[ri].label)}</b><br>${list}${rid === 'center' ? '<br><span class="small">На картата: зелено — вътре в българските земи; червено — в емиграцията.</span>' : rid === 'org' ? '<br><span class="small">На картата: легията (Белград), комитетите (Ловеч), БРЦК (Букурещ), четата (Козлодуй).</span>' : ''}`, { cls: 'wide', lift: 0.2 });
    }
    function ask() {
      const q = document.createElement('div');
      q.className = 'q col';
      q.innerHTML = `<p><b>Какво показва сравнението?</b></p>${COMPARE_Q.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}`;
      shell.controls.appendChild(q);
      q.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const o = COMPARE_Q[+b.dataset.i];
        if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
        scores.push(stepScore(mistakes, 4));
        shell.msg('Вярно! Целта е обща — свобода, но пътят и организацията са различни. Левски пренася центъра вътре в страната.', 'good');
        const n = shell.setControls('<button class="btn primary">Напред →</button>');
        n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
      }));
    }
  }

  // ---------- 3. Оцени Левски ----------
  function step3() {
    shell.step(2);
    clearTip();
    rowGlow.visible = false;
    for (const l of vlabels.values()) l.parent && l.parent.remove(l);
    vlabels.clear();
    showPins([]);
    sheet.visible = false;
    for (const m of cellMarks.values()) m.visible = false;
    for (const g of placed) g.visible = false;
    for (const g of trays.values()) { g.visible = true; g.userData.n = 0; g.userData.ring.material.opacity = 0; }
    vitrinas.get('levski').glow(0xf2c94c);
    stage.flyTo(DESKV[0], DESKV[1], 1.1);
    let mistakes = 0, k = 0;
    const tries = {};
    const CARD_AT = new THREE.Vector3(DESK.x, DESK.top + 0.01, DESK.z + 0.78);
    const showTask = () => {
      const c = ECARDS[k];
      shell.task(`<b>Оцени делото на Левски по критерии.</b> Всяка карта е извор или факт. Сложи я при критерия, който подкрепя, или в „Не е за Левски“.<br><span class="small">${esc(c.src)}:</span> <b>${esc(c.t)}</b>`);
    };
    const next = () => {
      shell.score(`Аргументи: ${k} от ${ECARDS.length}`);
      if (k >= ECARDS.length) return;
      spawnCard(ECARDS[k], ECARDS[k].t, CARD_AT, { w: 1.0, h: 0.4, src: ECARDS[k].src });
      showTask();
    };
    shell.setControls('');
    next();
    stopDrag = stage.enableDrag({
      planeY: DESK.top + 0.01,
      onDrop(obj) {
        const c = ECARDS.find((x) => x.id === obj.userData.dragId);
        let best = null, bd = 1e9;
        for (const [id, g] of trays) { const d = Math.hypot(g.position.x - obj.position.x, g.position.z - obj.position.z); if (d < bd) { bd = d; best = id; } }
        if (!best || bd > 0.8) { obj.position.copy(current.home); return; }
        if (best === c.tray) {
          const tr = trays.get(best);
          obj.userData.dragId = undefined; obj.userData.locked = true;
          obj.scale.setScalar(0.6);
          obj.position.set(tr.position.x + (tr.userData.n ? 0.33 : -0.33), DESK.top + 0.03 + tr.userData.n * 0.01, tr.position.z + 0.06);
          tr.userData.n++;
          tr.userData.ring.material.color.setHex(0x2fb36b); tr.userData.ring.material.opacity = 0.25;
          shell.msg(best === 'none' ? 'Вярно — вестник „Знаме“ издава Христо Ботев.' : 'Вярно!', 'good');
          k++;
          if (k < ECARDS.length) { next(); return; }
          shell.score(`Аргументи: ${k} от ${ECARDS.length}`);
          stopDrag(); stopDrag = null;
          evaluate();
        } else {
          mistakes++;
          tries[c.id] = (tries[c.id] || 0) + 1;
          obj.position.copy(current.home);
          shell.msg(`${TRAY_WHY[best]} Опитай пак.`, 'bad');
          if (tries[c.id] >= 2) { const tr = trays.get(c.tray); tr.userData.ring.material.color.setHex(0xf2b01e); tr.userData.ring.material.opacity = 0.45; }
        }
      },
    });
    function evaluate() {
      shell.task('<b>Сега оцени.</b> Коя оценка на делото на Левски се подкрепя от аргументите на масата?');
      tipEl(vitrinas.get('levski').group, '<b>Аргументите са подредени.</b> Идеи, организация, личен пример.', { cls: 'tag', lift: 2.0 });
      const c = shell.setControls(`<div class="col">${EVAL_Q.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const o = EVAL_Q[+b.dataset.i];
        if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
        scores.push(stepScore(mistakes, 4));
        shell.msg('Вярно! Добрата оценка назовава критериите и се опира на изворите.', 'good');
        const n = shell.setControls('<button class="btn primary">Напред →</button>');
        n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
      }));
    }
  }

  // ---------- 4. Причина и последица; предскажи ----------
  function step4() {
    shell.step(3);
    clearTip();
    vitrinas.get('levski').glow(null);
    for (const g of trays.values()) g.visible = false;
    for (const g of placed) g.visible = false;
    showPins([]);
    const CV = narrow ? [[0.2, 6.8, 10.8], [0.2, 0.6, 3.1]] : [[-0.2, 4.9, 9.9], [-0.2, 0.7, 1.9]];
    stage.flyTo(CV[0], CV[1], 1.1);
    let mistakes = 0, k = 0;
    const tries = {};
    const listHtml = () => `<ol class="small chain">${CHAIN.map((d, i) => {
      const D = dominos[i];
      return `<li>${D.state === 'blank' ? (d.predict ? '<i>? — ще разбереш накрая</i>' : '<i>? — празно звено</i>') : `<b>${esc(d.year)}:</b> ${esc(d.t)}`}</li>`;
    }).join('')}</ol>`;
    const showTask = () => {
      const c = CCARDS[k];
      shell.task(`Веригата е от причини и последици. <b>Завлечи картата в празното звено</b>, на което тя е последица.<br><span class="small">Карта:</span> <b>„${esc(c.t)}“</b>`);
      shell.setControls(listHtml());
    };
    const next = () => {
      shell.score(`Звена: ${k} от ${CCARDS.length}`);
      if (k >= CCARDS.length) return;
      spawnCard(CCARDS[k], CCARDS[k].t, CHAIN_CARD, { w: 1.1, h: 0.36 });
      showTask();
    };
    next();
    stopDrag = stage.enableDrag({
      planeY: BENCH_Y + 0.05,
      onDrop(obj) {
        const c = CCARDS.find((x) => x.id === obj.userData.dragId);
        let best = null, bd = 1e9;
        for (const D of dominos) { const p = D.body.getWorldPosition(new THREE.Vector3()); const d = Math.hypot(p.x - obj.position.x, (p.z - obj.position.z) * 0.8); if (d < bd) { bd = d; best = D; } }
        if (!best || bd > 0.9) { obj.position.copy(current.home); return; }
        if (best.state !== 'blank' || CHAIN[best.i].predict) {
          obj.position.copy(current.home);
          shell.msg(CHAIN[best.i].predict ? 'Това звено ще разгадаеш накрая. Търси празно звено с „?“ по-рано във веригата.' : 'Това звено вече е попълнено. Търси празно звено с „?“.', '');
          return;
        }
        if (best.i === c.slot) {
          obj.visible = false; obj.userData.dragId = undefined; obj.userData.locked = true;
          best.draw('done');
          tipEl(best.body, `<b>${esc(CHAIN[best.i].year)}</b> — вярно звено.`, { cls: 'good tag', lift: DOM_H + 0.2 });
          shell.msg('Вярно! Звеното е на мястото си.', 'good');
          k++;
          if (k < CCARDS.length) { next(); return; }
          shell.score(`Звена: ${k} от ${CCARDS.length}`);
          stopDrag(); stopDrag = null;
          ready();
        } else {
          mistakes++;
          tries[c.id] = (tries[c.id] || 0) + 1;
          obj.position.copy(current.home);
          shell.msg(`${c.why} Опитай пак.`, 'bad');
          if (tries[c.id] >= 2) tipEl(dominos[c.slot].body, 'Подсказка: тук', { cls: 'tag', lift: DOM_H + 0.2 });
        }
      },
    });
    function ready() {
      clearTip();
      shell.msg('');
      shell.task('Веригата е подредена до Априлското въстание. <b>Бутни първото звено</b> и гледай как причината води до последица.');
      const c = shell.setControls(`<button class="btn primary push">Бутни първото звено ▶</button>${listHtml()}`);
      c.querySelector('.push').addEventListener('click', () => { c.querySelector('.push').disabled = true; run(0, 6, predict); });
    }
    // Звената падат едно след друго; на картата светва мястото.
    function run(from, to, then) {
      let i = from;
      const go = () => {
        if (i >= to) { then(); return; }
        const D = dominos[i];
        D.falling = true;
        const pl = CHAIN[i].place;
        if (!pins.has(pl)) addPin(pl);
        const pg = pins.get(pl); pg.visible = true; pinColor(pl, 0xf28c28);
        if (i > 0) { const prev = CHAIN[i - 1].place; if (prev !== pl) pinColor(prev, 0x9a6a3a); }
        tipEl(D.body, CHAIN[i].more, { cls: 'wide', lift: DOM_H + 0.25 });
        i++;
        setTimeout(go, 1500);
      };
      go();
    }
    function predict() {
      clearTip();
      tipEl(dominos[6].body, '<b>?</b> Какво следва?', { cls: 'tag', lift: DOM_H + 0.2 });
      shell.task(PREDICT.ask);
      const c = shell.setControls(`<div class="col">${PREDICT.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const o = PREDICT.opts[+b.dataset.i];
        if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
        scores.push(stepScore(mistakes, 4));
        shell.msg('Вярно предсказание! Гледай какво наистина става.', 'good');
        c.querySelectorAll('button').forEach((x) => { x.disabled = true; });
        dominos[6].draw('done'); dominos[7].draw('done');
        run(6, 8, () => {
          addPin('sanstefano');
          shell.msg('Така и става: от БРЦК през Априлското въстание до Освобождението (1878 г.).', 'good');
          const n = shell.setControls(`<button class="btn primary">Виж резултата</button>${listHtml()}`);
          n.querySelector('button').addEventListener('click', () => {
            clearTip();
            const ratio = scores.reduce((s, x) => s + x, 0) / scores.length;
            shell.finish(ratio, onComplete, restart);
          });
        });
      }));
    }
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    for (const g of placed) stage.scene.remove(g);
    placed.length = 0;
    current = null;
    for (const l of vlabels.values()) l.parent && l.parent.remove(l);
    vlabels.clear();
    rowGlow.visible = false;
    sheet.visible = true;
    for (const m of cellMarks.values()) { m.visible = true; m.material.opacity = 0; m.material.color.setHex(0x2b6cb0); }
    for (const g of trays.values()) { g.visible = false; g.userData.n = 0; }
    for (const D of dominos) { D.falling = false; D.fall = 0; D.pivot.rotation.z = 0; D.draw(D.d.blank || D.d.predict ? 'blank' : ''); }
    for (const v of vitrinas.values()) v.glow(null);
    step1();
  }

  // ---------- картата ----------
  shell.task('Зареждане на стаята…');
  createMap(stage, { url: 'data/geo/europe.json', center: [25.1, 43.8], unitsPerDeg: 0.42, focus: 'none', showNames: false, sea: false, height: 0.025,
    otherColor: 0xe6dcc0, only: ['100', '642', '688', '792', '300', '807', '804', '498', '070', '499', 'Kosovo', '008', '191', '348'] }).then((m) => {
    map = m;
    map.group.position.copy(MAP_OFF);
    // Изрязваме картата по рамката на масата.
    const x0 = MAPT.x - MAPT.w / 2 + 0.13, x1 = MAPT.x + MAPT.w / 2 - 0.13, z0 = MAPT.z - MAPT.d / 2 + 0.13, z1 = MAPT.z + MAPT.d / 2 - 0.13;
    const planes = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -x0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), x1),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), -z0), new THREE.Plane(new THREE.Vector3(0, 0, -1), z1)];
    map.group.traverse((o) => { if ((o.isMesh || o.isLine) && o.material) o.material.clippingPlanes = planes; });
    // Дунав.
    const curve = new THREE.CatmullRomCurve3(DANUBE.map(([lo, la]) => P(lo, la, 0.03)));
    const river = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.012, 6, false), new THREE.MeshStandardMaterial({ color: 0x4f97cf, roughness: 0.3, clippingPlanes: planes }));
    river.scale.y = 1; stage.scene.add(river);
    for (const [text, lon, lat, sz] of [['Черно море', 30.0, 43.2, 0.08], ['Румъния', 24.6, 45.4, 0.08], ['Сърбия', 21.0, 43.6, 0.075], ['Османската империя', 25.6, 41.5, 0.08], ['Дунав', 23.2, 44.05, 0.06]]) {
      const l = labelSprite(text, { size: sz, color: text === 'Черно море' || text === 'Дунав' ? '#1f5d8a' : '#5b5446', bg: 'rgba(255,255,255,0.55)', border: 'rgba(0,0,0,0)' });
      l.position.copy(P(lon, lat, 0.12)); stage.scene.add(l);
    }
    for (const id of EMIGRE) addPin(id);
    const note = document.createElement('div');
    note.className = 'map-approx';
    note.textContent = narrow ? 'Карта: днешните граници — за ориентир.' : 'Картата на масата: тънките линии са днешните граници — само за ориентир.';
    Object.assign(note.style, { position: 'absolute', left: '8px', bottom: '8px', zIndex: 3, padding: '3px 8px', borderRadius: '6px', maxWidth: '70%',
      background: 'rgba(255,255,255,0.9)', border: '1px solid #c7d3e0', font: '600 12px/1.3 system-ui, sans-serif', color: '#44505c', pointerEvents: 'none' });
    shell.stageEl.appendChild(note);
    step1();
  }).catch((e) => shell.msg(`Картата не се зареди: ${e.message}`, 'bad'));

  // За тестовете: екранна точка на витрина, клетка, тава, звено или текущата карта.
  const project = (o) => {
    const v = (o.userData && o.userData.hit ? o.userData.hit : o).getWorldPosition(new THREE.Vector3());
    if (o.userData && o.userData.pickId && o.userData.pickId.startsWith('dom-')) v.y += DOM_H / 2;
    v.project(stage.camera);
    const r = stage.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  };
  container.__demo = {
    stage, get map() { return map; },
    at(id) {
      if (vitrinas.has(id)) return project(vitrinas.get(id).group);
      if (id.startsWith('cell-')) return project(cellMarks.get(id.slice(5)));
      if (id.startsWith('tray-')) return project(trays.get(id.slice(5)));
      if (id.startsWith('dom-')) return project(dominos[+id.slice(4)].body);
      if (id === 'card' && current) return project(current.g);
      return null;
    },
    // Къде трябва да отиде текущата карта.
    target() {
      if (!current) return null;
      const d = current.def;
      if (d.col !== undefined) return `cell-${d.col}-${d.row}`;
      if (d.tray) return `tray-${d.tray}`;
      if (d.slot !== undefined) return `dom-${d.slot}`;
      return null;
    },
    current: () => (current && current.g.userData.dragId ? current.def.id : null),
  };
  return { dispose() { if (stopDrag) stopDrag(); if (menu) menu.remove(); stage.dispose(); } };
}
