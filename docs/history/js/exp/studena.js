// „Студената война“ (9.3.2): Берлинската стена при КПП „Чарли“ и жива карта на разделена Европа.
// Стъпки: 1) опознай стената и КПП „Чарли“ (възстановка) → 2) раздели Европа на блокове и виж „желязната завеса“
//         → 3) приложи: събития и понятия към Запада или Изтока → 4) плъзгач 1946–1991 и предскажи 1989 г.
// Държавите са по днешните граници от data/geo/europe.json (само за ориентир). ГДР, Западен Берлин
// и „желязната завеса“ са опростена схема (data/geo/coldwar.json) — сцената показва „⚠ Приблизителни граници“.
import { createStage, cornerMenu, esc, labelSprite, addHitBox, zoneRing, THREE } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { createRegions } from './hist/regions.js';
import { buildBerlin } from './hist/coldwar.js';

const APPROX = '<br><i class="small">Приблизителни граници.</i>';
const CLR = { nato: 0x4f7fc9, wp: 0xd0574b, out: 0xeedc9a, none: 0xd9d2c0, far: 0xc9c3b3, westPale: 0xa8c2e6, eastPale: 0xe8a59b };

// Днешните държави от картата, събрани в държавите от времето на Студената война.
const ENT = {
  uk: ['826'], fr: ['250'], be: ['056'], nl: ['528'], lu: ['442'], no: ['578'], dk: ['208'], it: ['380'], pt: ['620'], gr: ['300'], tr: ['792'], frg: ['276'],
  ussr: ['643', '804', '112', '440', '428', '233', '498', '268', '051', '031', '398'], pl: ['616'], cs: ['203', '703'], hu: ['348'], ro: ['642'], bg: ['100'], al: ['008'],
  at: ['040'], ch: ['756'], se: ['752'], ie: ['372'], es: ['724'], yu: ['191', '705', '070', '688', '499', '807', 'Kosovo'],
};
const NAME = {
  uk: 'Великобритания', fr: 'Франция', be: 'Белгия', nl: 'Нидерландия', lu: 'Люксембург', no: 'Норвегия', dk: 'Дания', it: 'Италия', pt: 'Португалия',
  gr: 'Гърция', tr: 'Турция', frg: 'ФРГ', gdr: 'ГДР', ussr: 'СССР', pl: 'Полша', cs: 'Чехословакия', hu: 'Унгария', ro: 'Румъния', bg: 'България',
  al: 'Албания', at: 'Австрия', ch: 'Швейцария', se: 'Швеция', ie: 'Ирландия', es: 'Испания', yu: 'Югославия',
};
const AT = {
  uk: [-1.8, 52.6], fr: [2.4, 46.8], be: [4.6, 50.6], nl: [5.7, 52.4], lu: [6.1, 49.7], no: [8.6, 59.2], dk: [9.2, 56.0], it: [12.6, 42.9], pt: [-8.1, 39.8],
  gr: [22.0, 39.4], tr: [33.0, 39.0], frg: [8.8, 50.3], gdr: [12.4, 51.8], ussr: [36, 54], pl: [19.4, 52.1], cs: [16.4, 49.5], hu: [19.3, 47.1],
  ro: [24.8, 45.9], bg: [25.2, 42.7], al: [20.0, 41.0], at: [14.3, 47.55], ch: [8.1, 46.8], se: [14.8, 58.0], ie: [-8.0, 53.2], es: [-3.7, 40.2], yu: [20.4, 44.0],
};
const NATO49 = ['uk', 'fr', 'be', 'nl', 'lu', 'no', 'dk', 'it', 'pt'];
const NATO55 = [...NATO49, 'gr', 'tr', 'frg'];
const EAST = ['ussr', 'pl', 'cs', 'hu', 'ro', 'bg', 'al', 'gdr'];
const OUT = ['at', 'ch', 'se', 'ie', 'es', 'yu'];
const B55 = Object.fromEntries([...NATO55.map((k) => [k, 'nato']), ...EAST.map((k) => [k, 'wp']), ...OUT.map((k) => [k, 'out'])]);

// ---------- 1. Берлин: какво се разглежда ----------
const EXPLORE = [
  { id: 'wall', icon: '🧱', label: 'Стената', note: '<b>Граничната стена</b><br>Строежът започва на 13 август 1961 г. — първо с бодлива тел, после с блокове. Тези бетонни плочи с тръба отгоре (около 3,6 м) са от 70-те години. Западната страна е изрисувана с графити.<br><i class="small">Възстановка. Запазени части има например на улица „Бернауер“.</i>' },
  { id: 'strip', icon: '⚠️', label: '„Ивицата на смъртта“', note: '<b>„Ивицата на смъртта“</b><br>Между двете стени: пясък, по който личат стъпките, път за патрулите, лампи, сигнална ограда и препятствия срещу коли. При опит за бягство граничарите стрелят. Най-малко 140 души загиват при стената.<br><i class="small">Опростена възстановка.</i>' },
  { id: 'tower', icon: '🗼', label: 'Наблюдателна кула', note: '<b>Наблюдателна кула</b><br>От кулите граничарите на ГДР следят ивицата денем и нощем, с прожектори.<br><i class="small">Възстановка; няколко такива кули са запазени.</i>' },
  { id: 'gdr', icon: '🚧', label: 'Контролата на ГДР', note: '<b>Контролата на ГДР</b><br>Бариери, зигзаг от бетонни блокове, за да не могат колите да минат с бързина, и сграда, в която граничарите проверяват паспортите.<br><i class="small">Опростена възстановка.</i>' },
  { id: 'hut', icon: '🏠', label: 'КПП „Чарли“', note: '<b>КПП „Чарли“</b><br>„Чарли“ е третата буква в азбуката на военните радиооператори — третият пункт. Тук, на улица „Фридрихщрасе“, минават чужденци, дипломати и военни на съюзниците. През октомври 1961 г. тук един срещу друг застават американски и съветски танкове.<br><i class="small">Будката днес е копие; старата е в музей в Берлин.</i>' },
  { id: 'sign', icon: '🪧', label: 'Табелата', note: '<b>Табелата</b><br>„Напускате американския сектор“. Истинската табела е на английски, руски, френски и немски — тук надписът е преведен. След войната Берлин е разделен на четири сектора: американски, британски, френски и съветски.' },
  { id: 'cross', icon: '🚶', label: 'Мини от Изток на Запад', note: '<b>Минаване от Изток на Запад</b><br>Гледай пътника: проверка на паспорта при граничарите на ГДР, зигзагът, бариерата и американската будка. Така минават чужденци. Жителите на ГДР по правило не могат да минат.' },
];
const B_AT = { wall: [-20, 2.5, 0], strip: [-42, 1, -12], tower: [-30, 8, -18], gdr: [6, 3, -16], hut: [0, 2.5, 14], sign: [-7.2, 3.2, 6], cross: [1.5, 1, -40] };

// ---------- 2. Блоковете ----------
const SORT = ['frg', 'fr', 'it', 'gr', 'tr', 'gdr', 'pl', 'cs', 'hu', 'ro', 'bg', 'at', 'yu', 'ch', 'se'];
const GIVEN = ['uk', 'be', 'nl', 'lu', 'no', 'dk', 'pt', 'ussr', 'al', 'ie', 'es'];
const WHY = {
  frg: 'ФРГ е създадена в зоните на САЩ, Великобритания и Франция.',
  gdr: 'ГДР е създадена в съветската зона на Германия.',
  fr: 'Франция е сред държавите, които основават един от блоковете през 1949 г.',
  it: 'Италия е сред държавите, които основават един от блоковете през 1949 г.',
  gr: 'Гърция се присъединява към един от блоковете през 1952 г., заедно с Турция.',
  tr: 'Турция се присъединява към един от блоковете през 1952 г., заедно с Гърция.',
  pl: 'Помисли: договорът на един от блоковете носи името на столицата на Полша.',
  cs: 'В Чехословакия управлява комунистическа партия, близка до СССР.',
  hu: 'В Унгария управлява комунистическа партия, близка до СССР.',
  ro: 'В Румъния управлява комунистическа партия, близка до СССР.',
  bg: 'В България управлява комунистическа партия, близка до СССР.',
  at: 'През 1955 г. Австрия обявява, че ще бъде неутрална.',
  yu: 'Югославия скъсва със Сталин през 1948 г. и следва свой път.',
  ch: 'Швейцария е неутрална от много отдавна.',
  se: 'Швеция е неутрална и не влиза във военни съюзи.',
};
const GOOD = {
  frg: 'ФРГ влиза в НАТО през 1955 г.', gdr: 'ГДР е във Варшавския договор от 1955 г.', fr: 'Франция основава НАТО през 1949 г.',
  it: 'Италия основава НАТО през 1949 г.', gr: 'Гърция е в НАТО от 1952 г.', tr: 'Турция е в НАТО от 1952 г.',
  pl: 'Варшавският договор е подписан във Варшава през 1955 г.', cs: 'Чехословакия е във Варшавския договор.', hu: 'Унгария е във Варшавския договор.',
  ro: 'Румъния е във Варшавския договор.', bg: 'България е във Варшавския договор от създаването му през 1955 г.',
  at: 'Австрия е неутрална от 1955 г.', yu: 'Югославия е извън блоковете.', ch: 'Швейцария е неутрална.', se: 'Швеция е неутрална.',
};
const BRUSH = [
  { id: 'nato', label: 'НАТО', col: '#4f7fc9' },
  { id: 'wp', label: 'Варшавски договор', col: '#d0574b' },
  { id: 'out', label: 'Извън блоковете', col: '#eedc9a' },
];

// ---------- 3. Събития и понятия към двата блока ----------
const CARDS = [
  { id: 'c1', t: 'НАТО (1949)', side: 'w', why: 'НАТО основават САЩ, Канада и държави от Западна Европа.' },
  { id: 'c2', t: 'Варшавски договор (1955)', side: 'e', why: 'Варшавският договор събира СССР и неговите съюзници.' },
  { id: 'c3', t: 'План „Маршал“', side: 'w', why: 'С плана „Маршал“ САЩ помагат на Европа след войната. СССР не го приема.' },
  { id: 'c4', t: 'Спутник (1957)', side: 'e', why: 'Първият изкуствен спътник е изстрелян от СССР.' },
  { id: 'c5', t: 'Гагарин в Космоса (1961)', side: 'e', why: 'Юрий Гагарин е съветски космонавт.' },
  { id: 'c6', t: '„Аполо 11“ на Луната (1969)', side: 'w', why: '„Аполо 11“ е мисия на САЩ.' },
  { id: 'c7', t: 'Берлинската стена (1961)', side: 'e', why: 'Стената е построена от ГДР с подкрепата на СССР.' },
  { id: 'c8', t: 'Въздушен мост (1948)', side: 'w', why: 'Самолетите на САЩ и Великобритания носят храна за Западен Берлин.' },
  { id: 'c9', t: 'Чърчил: „желязна завеса“', side: 'w', why: 'Уинстън Чърчил е британски политик, водил Великобритания през войната.' },
  { id: 'c10', t: 'Тодор Живков (1954–1989)', side: 'e', why: 'Тодор Живков управлява България 35 години в тесен съюз със СССР.' },
];

// ---------- 4. Плъзгач 1946–1991 ----------
const STOPS = [1946, 1948, 1949, 1955, 1957, 1961, 1962, 1969];
const LATER = [1989, 1990, 1991];
const EV = {
  1946: { title: '1946 г. — „желязна завеса“', text: 'През март 1946 г. във Фултън (САЩ) Уинстън Чърчил казва: „От Шчечин на Балтийско море до Триест на Адриатическо море над континента се е спуснала желязна завеса.“', legend: 'Още няма военни блокове.' },
  1948: { title: '1948–1949 г. — Берлинска блокада', text: 'СССР спира пътищата и железниците до Западен Берлин. Близо година самолетите на САЩ и Великобритания носят храна и въглища по „въздушен мост“.', legend: 'Германия е разделена на зони; 🟥 съветската зона.' },
  1949: { title: '1949 г. — НАТО и две германски държави', text: 'През април 1949 г. е създаден НАТО. През същата година се появяват две германски държави: ФРГ на запад и ГДР на изток.', legend: '🟦 НАТО · 🟥 (светло) Източен блок около СССР' },
  1955: { title: '1955 г. — Варшавски договор', text: 'ФРГ влиза в НАТО. В отговор СССР и съюзниците му, сред тях и България, създават Варшавския договор. Австрия става неутрална.', legend: '🟦 НАТО · 🟥 Варшавски договор · 🟨 извън блоковете' },
  1957: { title: '1957 г. — Спутник', text: 'СССР изстрелва първия изкуствен спътник на Земята. Започва надпреварата в Космоса.', legend: '🟦 НАТО · 🟥 Варшавски договор · 🟨 извън блоковете' },
  1961: { title: '1961 г. — Гагарин и Берлинската стена', text: 'През април Юрий Гагарин е първият човек в Космоса. На 13 август 1961 г. ГДР започва да строи стена около Западен Берлин.', legend: '🟦 НАТО · 🟥 Варшавски договор · 🟨 извън блоковете' },
  1962: { title: '1962 г. — Карибска криза', text: 'През октомври 1962 г. САЩ откриват съветски ракети в Куба. Светът е на ръба на ядрена война. След преговори ракетите са изтеглени.', legend: 'Куба е далеч на запад, в Карибско море — извън тази карта.' },
  1969: { title: '1969 г. — хора на Луната', text: 'С „Аполо 11“ американците Нийл Армстронг и Бъз Олдрин стъпват на Луната. През 1968 г. Албания напуска Варшавския договор.', legend: '🟦 НАТО · 🟥 Варшавски договор · 🟨 извън блоковете' },
  1989: { title: '1989 г. — стената пада', text: 'На 9 ноември 1989 г. границата в Берлин се отваря и хората разрушават стената. На 10 ноември в България Тодор Живков е отстранен от властта.', legend: 'В Източна Европа падат комунистическите режими.' },
  1990: { title: '1990 г. — Германия се обединява', text: 'На 3 октомври 1990 г. ГДР и ФРГ се обединяват в една държава.', legend: '🟦 НАТО · 🟥 Варшавски договор · 🟨 извън блоковете' },
  1991: { title: '1991 г. — краят', text: 'През юли 1991 г. Варшавският договор е разпуснат, а през декември се разпада СССР. Студената война свършва.', legend: 'Варшавският договор и СССР вече не съществуват.' },
};
function blocsOf(year) {
  if (year < 1949) return {};
  if (year === 1949) return Object.fromEntries([...NATO49.map((k) => [k, 'nato']), ['frg', 'westPale'], ...EAST.map((k) => [k, 'eastPale'])]);
  const b = { ...B55 };
  if (year >= 1969) b.al = 'out';
  if (year >= 1991) for (const k of EAST) delete b[k];
  return b;
}
const PREDICT = {
  ask: 'Есента на 1989 г.: в ГДР хиляди хора излизат на протести и искат да пътуват свободно. В Полша и Унгария вече има промени. <b>Какво ще стане с Берлинската стена?</b>',
  opts: [
    { t: 'Границата се отваря и стената пада мирно.', ok: true },
    { t: 'Стената е укрепена и стои и до днес.', why: 'Не. Днес от стената са запазени само няколко участъка — като паметник.' },
    { t: 'Започва война между НАТО и Варшавския договор.', why: 'Не. Студената война свършва без пряка война между двата блока.' },
  ],
};

export function mount(container, { skill = {}, onComplete } = {}) {
  const shell = createShell(container, { steps: ['Опознай: стената', 'Раздели Европа', 'Приложи', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1;
  const bf = Math.min(far, 1.5);
  const BVIEW = [[-40 * bf, 40 * bf, 40 * bf], [-6, 0, -8]];
  const nf = far > 1 ? Math.min(far, 1.45) : 1;
  const MVIEW = [[0.6, 9.2 * nf, 5.6 * nf], [0.6, 0, -0.1]];
  const stage = createStage(shell.stageEl, { background: 0xbfd3e6, camPos: BVIEW[0], target: BVIEW[1], minDistance: 3, maxDistance: 130 });
  const host = stage.renderer.domElement.parentElement;

  let berlin = null, map = null, reg = null, menu = null, tip = null, tip2 = null, clickHandler = null, stopDrag = null;
  let mapObjs = null, timers = [];
  const scores = [];
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.4, ...opts }); return tip; };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } if (tip2) { tip2.remove(); tip2 = null; } };
  const later = (fn, ms) => { const h = setTimeout(fn, ms); timers.push(h); };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  // ---------- изглед: Берлин или картата ----------
  const badge = () => host.querySelector('.map-approx');
  function mode(m) {
    const isMap = m === 'map';
    stage.stopFollow();
    berlin.group.visible = !isMap;
    for (const o of mapObjs.all) o.visible = isMap;
    if (badge()) badge().style.display = isMap ? '' : 'none';
    stage.scene.background.setHex(isMap ? 0xdcecf7 : 0xbfd3e6);
    stage.scene.fog = isMap ? null : new THREE.Fog(0xbfd3e6, 120, 210);
    stage.controls.maxDistance = isMap ? 30 : 130;
    stage.controls.minDistance = isMap ? 2 : 4;
  }

  // ---------- картата ----------
  async function buildMap() {
    map = await createMap(stage, { url: 'data/geo/europe.json', center: [17, 48], unitsPerDeg: 0.36, focus: 'none', showNames: false, otherColor: CLR.far, height: 0.08 });
    reg = await createRegions(stage, map, { url: 'data/geo/coldwar.json', y: 0.12, height: 0.05 });
    // Държавите, които се щракат, носят pickId на държавата от онова време.
    const entOf = new Map();
    for (const [k, ids] of Object.entries(ENT)) for (const id of ids) entOf.set(id, k);
    for (const [id, cg] of map.countries) { const e = entOf.get(id); if (e) cg.userData.pickId = e; }
    // Линиите на границите не се кликат (иначе ловят клик на цяла единица разстояние).
    map.group.traverse((o) => { if (o.isLine) o.raycast = () => {}; });
    const extra = new THREE.Group();
    stage.scene.add(extra);
    // Надписи на държавите.
    const labels = new Map();
    for (const k of Object.keys(AT)) {
      const l = labelSprite(NAME[k], { size: (k === 'ussr' ? 0.3 : 0.22) * (far > 1 ? 1.2 : 1), color: '#2b2b2b', bg: 'rgba(255,255,255,0.75)', border: 'rgba(0,0,0,0)' });
      l.position.copy(map.pos(AT[k][0], AT[k][1], 0.32));
      extra.add(l); labels.set(k, l);
    }
    // Котви за балончета и за тестовете.
    const anchors = new Map();
    for (const k of Object.keys(AT)) { const a = new THREE.Object3D(); a.position.copy(map.pos(AT[k][0], AT[k][1], k === 'gdr' ? 0.18 : 0.1)); extra.add(a); anchors.set(k, a); }
    const seaL = [['Атлантически океан', -8, 46], ['Средиземно море', 18, 35.5], ['Черно море', 34, 43.2], ['Балтийско море', 19, 57]].map(([t, lon, lat]) => {
      const l = labelSprite(t, { size: 0.17, color: '#1f5d8a', bg: 'rgba(255,255,255,0.45)', border: 'rgba(0,0,0,0)' }); l.position.copy(map.pos(lon, lat, 0.3)); extra.add(l); return l;
    });
    void seaL;
    map.addPlace('berlin', { lon: 13.4, lat: 52.52, label: 'Берлин', color: 0xf2b01e });
    const berlinPin = map.places.get('berlin');
    berlinPin.scale.setScalar(0.6);
    extra.add(berlinPin);

    // „Желязната завеса“: тъмна стена по линията от coldwar.json, която „израства“.
    const geo = await fetch('data/geo/coldwar.json').then((r) => r.json());
    const pts = geo.curtain.map(([lon, lat]) => map.pos(lon, lat, 0));
    const pos = [], idx = [];
    pts.forEach((p, i) => { pos.push(p.x, 0.12, p.z, p.x, 0.36, p.z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setIndex(idx); cg.computeVertexNormals();
    const curtainMat = new THREE.MeshStandardMaterial({ color: 0x33373d, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 1 });
    const curtain = new THREE.Mesh(cg, curtainMat); curtain.raycast = () => {};
    extra.add(curtain);
    const curtainTop = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((p) => p.clone().setY(0.37))), new THREE.LineBasicMaterial({ color: 0x111111 }));
    curtainTop.raycast = () => {}; extra.add(curtainTop);
    const curtainLabel = labelSprite('„Желязна завеса“', { size: 0.22, color: '#ffffff', bg: 'rgba(40,44,50,0.88)', border: 'rgba(0,0,0,0)' });
    curtainLabel.position.copy(map.pos(9.5, 47.6, 0.75)); extra.add(curtainLabel);
    const curtainAnchor = new THREE.Object3D(); curtainAnchor.position.copy(map.pos(14.5, 49.2, 0.3)); extra.add(curtainAnchor);
    const nCurtain = idx.length;
    let grow = null; // { k } — 0..1
    function showCurtain(on, { animate = false, faded = false } = {}) {
      curtain.visible = curtainTop.visible = curtainLabel.visible = on;
      curtainMat.opacity = faded ? 0.35 : 1;
      grow = on && animate ? { k: 0 } : null;
      cg.setDrawRange(0, on && animate ? 0 : nCurtain);
    }

    // Стената около Западен Берлин (1961–1989).
    const wb = geo.regions.find((r) => r.id === 'wberlin').polygons[0][0].map(([lon, lat]) => map.pos(lon, lat, 0.2));
    const wall = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wb, true), 40, 0.018, 5, true), new THREE.MeshStandardMaterial({ color: 0x2b2e33 }));
    wall.raycast = () => {}; extra.add(wall);

    // Самолети на въздушния мост (1948–1949): от Франкфурт, Хановер и Хамбург до Западен Берлин.
    const planeM = new THREE.MeshStandardMaterial({ color: 0xeef1f4, metalness: 0.5, roughness: 0.4 });
    const plane = () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.32, 8), planeM); b.rotation.x = Math.PI / 2; g.add(b); const w = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.01, 0.07), planeM); g.add(w); const t = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.04), planeM); t.position.z = 0.14; g.add(t); return g; };
    const routes = [[8.68, 50.11], [9.73, 52.37], [9.99, 53.55]].map(([lon, lat]) => [map.pos(lon, lat, 0.5), map.pos(13.3, 52.5, 0.5)]);
    const planes = new THREE.Group(); extra.add(planes);
    const fly = [];
    routes.forEach((r, i) => { for (let j = 0; j < 2; j++) { const p = plane(); planes.add(p); fly.push({ p, r, ph: i * 0.33 + j * 0.5 }); } });
    // Спутник, Восток и Луната.
    const metal = new THREE.MeshStandardMaterial({ color: 0xd8dde3, metalness: 0.8, roughness: 0.25 });
    const sputnik = new THREE.Group();
    sputnik.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), metal));
    for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 4), metal); a.rotation.z = Math.PI / 2 + 0.5; a.rotation.y = (i * Math.PI) / 2; a.position.set(Math.cos((i * Math.PI) / 2) * 0.28, -0.04, Math.sin((i * Math.PI) / 2) * 0.28); sputnik.add(a); }
    extra.add(sputnik);
    const sputLabel = labelSprite('Спутник', { size: 0.28 }); sputLabel.position.y = 0.4; sputnik.add(sputLabel);
    const vostok = new THREE.Group();
    vostok.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.6, roughness: 0.4 })));
    const vb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.24, 12), metal); vb.position.z = 0.2; vb.rotation.x = Math.PI / 2; vostok.add(vb);
    const vLabel = labelSprite('„Восток-1“ с Гагарин', { size: 0.28 }); vLabel.position.y = 0.4; vostok.add(vLabel);
    extra.add(vostok);
    const moonTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#c9c6bd'; g.fillRect(0, 0, 256, 128); let s = 5; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(90,88,80,${0.15 + r() * 0.25})`; g.beginPath(); g.arc(r() * 256, r() * 128, 2 + r() * 12, 0, 7); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const moon = new THREE.Group();
    moon.add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1 })));
    const lander = new THREE.Group();
    const lb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.6, roughness: 0.3 })); lander.add(lb);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); flag.position.set(0.12, 0.08, 0); lander.add(flag);
    lander.position.set(0, 0.57, 0); moon.add(lander);
    const moonLabel = labelSprite('Луната', { size: 0.24 }); moonLabel.position.y = 0.9; moon.add(moonLabel);
    moon.position.set(-5.0, 1.5, 0.3); extra.add(moon);
    // Карибската криза: Куба е извън картата — стрелка на запад.
    const cuba = new THREE.Group();
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 3), new THREE.MeshStandardMaterial({ color: 0xc0392b }));
    arrow.rotation.z = Math.PI / 2; cuba.add(arrow);
    const cubaL = labelSprite('към Куба — Карибска криза', { size: 0.2, color: '#ffffff', bg: 'rgba(192,57,43,0.9)', border: 'rgba(0,0,0,0)' }); cubaL.position.set(1.6, 0.35, 0); cuba.add(cubaL);
    cuba.position.copy(map.pos(-10.2, 38.5, 0.5)); extra.add(cuba);
    const sofia = map.addPlace('sofia', { lon: 23.32, lat: 42.7, label: 'София', color: 0x2fb36b }); sofia.scale.setScalar(0.6); extra.add(sofia);

    // Зоните за стъпка 3.
    const zones = { w: zoneRing(CLR.nato, 1.55), e: zoneRing(CLR.wp, 1.55) };
    zones.w.position.copy(map.pos(-1.5, 48.2, 0.2)); zones.e.position.copy(map.pos(34, 52.5, 0.2));
    const zl = { w: labelSprite('Западът (САЩ)', { size: 0.26, color: '#ffffff', bg: 'rgba(47,95,168,0.92)', border: 'rgba(0,0,0,0)' }), e: labelSprite('Изтокът (СССР)', { size: 0.26, color: '#ffffff', bg: 'rgba(176,58,46,0.92)', border: 'rgba(0,0,0,0)' }) };
    for (const s of ['w', 'e']) { zl[s].position.set(0, 0.5, -1.75); zones[s].add(zl[s]); zones[s].userData.pickId = `zone-${s}`; extra.add(zones[s]); }
    // Картите за влачене.
    const cards = new Map();
    for (const c of CARDS) {
      const g = new THREE.Group();
      const s = labelSprite(c.t, { size: far > 1 ? 0.34 : 0.3, color: '#1b2a3a', bg: 'rgba(255,253,245,0.97)', border: '#8a7a5a' });
      s.position.y = 0.2; g.add(s);
      addHitBox(g, 0.4);
      g.userData = { ...g.userData, dragId: c.id, pickId: c.id, label: s, side: c.side };
      extra.add(g); cards.set(c.id, g);
    }

    const stopTick = stage.tick((dt, t) => {
      if (!extra.visible) return;
      if (grow) { grow.k = Math.min(1, grow.k + dt / 2.4); cg.setDrawRange(0, Math.floor((nCurtain / 6) * grow.k) * 6); if (grow.k >= 1) grow = null; }
      for (const f of fly) {
        if (!planes.visible) break;
        const k = (t * 0.18 + f.ph) % 1, [a, b] = f.r;
        f.p.position.lerpVectors(a, b, k); f.p.position.y = 0.5 + Math.sin(k * Math.PI) * 0.5;
        f.p.lookAt(b.x, f.p.position.y, b.z); f.p.rotateY(Math.PI);
      }
      const o = t * 0.5;
      sputnik.position.set(Math.cos(o) * 4.8 + 0.4, 2.8 + Math.sin(o * 2) * 0.2, Math.sin(o) * 2.6 + 0.2); sputnik.rotation.y = t;
      const v = t * 0.4 + 2;
      vostok.position.set(Math.cos(v) * 4.2 + 0.4, 2.4, Math.sin(v) * 2.3 + 0.2); vostok.rotation.y = -v;
      moon.rotation.y = t * 0.05;
      arrow.position.x = Math.sin(t * 3) * 0.12;
      zones.w.userData.disc.material.opacity = 0.14 + Math.sin(t * 2) * 0.05; zones.e.userData.disc.material.opacity = 0.14 + Math.sin(t * 2 + 1) * 0.05;
    });

    mapObjs = {
      extra, labels, anchors, curtainAnchor, curtainLabel, showCurtain, wall, planes, sputnik, vostok, moon, cuba, sofia, berlinPin, zones, cards,
      all: [map.group, reg.group, extra],
      dispose() { stopTick(); stage.scene.remove(extra); },
    };
  }

  // Оцветява картата: b — { държава: вид }, gdr — показва ли се ГДР отделно.
  function paint(b, { gdr = true, wberlin = gdr } = {}) {
    for (const [k, ids] of Object.entries(ENT)) {
      const c = CLR[b[k] || 'none'];
      for (const id of ids) map.highlight(id, c);
    }
    const r = {};
    if (gdr) r.gdr = CLR[b.gdr || 'none'];
    if (wberlin) r.wberlin = b.frg ? CLR[b.frg] : CLR.westPale;
    reg.paint(r, { labels: false });
  }
  function hideExtras() {
    const o = mapObjs;
    o.showCurtain(false); o.wall.visible = false; o.planes.visible = false; o.sputnik.visible = false; o.vostok.visible = false;
    o.moon.visible = false; o.cuba.visible = false; o.sofia.visible = false; o.zones.w.visible = o.zones.e.visible = false;
    for (const c of o.cards.values()) c.visible = false;
  }

  // ---------- 1. Опознай: Берлинската стена ----------
  const bAnchors = new Map();
  const marks = new Map();
  function step1() {
    shell.step(0);
    scores.length = 0;
    mode('berlin');
    hideExtras();
    berlin.resetCross();
    stage.flyTo(BVIEW[0], BVIEW[1], 0.8);
    shell.task('Берлин, улица „Фридрихщрасе“, 80-те години. Стената разделя града: отвъд нея е Източен Берлин, отпред — Западен Берлин. Разгледай всичко: избери от менюто или кликни в сцената.');
    const seen = new Set();
    for (const m of marks.values()) m.visible = true;
    const open = (id) => {
      const it = EXPLORE.find((x) => x.id === id);
      if (!it) return;
      const a = id === 'cross' ? berlin.traveller : bAnchors.get(id);
      if (id === 'cross') {
        berlin.cross((ev) => {
          if (ev === 'control') say(berlin.traveller, 'Проверка на паспорта при граничарите на ГДР.', { lift: 2.2, cls: 'wide' });
          if (ev === 'west') say(berlin.traveller, 'Пътникът вече е в Западен Берлин.', { lift: 2.2, cls: 'good' });
        });
        stage.focusOn(berlin.traveller, { dist: 22, height: 15, lift: 1, keepFollow: true });
        say(berlin.traveller, it.note, { lift: 2.2, cls: 'wide' });
      } else {
        stage.focusOn(a, { dist: id === 'strip' ? 26 : 16, height: id === 'tower' ? 6 : 8, lift: 0.5, keepFollow: false });
        say(a, it.note, { cls: 'wide' });
      }
      if (marks.has(id)) marks.get(id).visible = false;
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${EXPLORE.length}`);
      if (seen.size === EXPLORE.length && !shell.controls.querySelector('.next')) {
        const c = shell.setControls('<button class="btn primary next">Към картата на Европа →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); berlin.resetCross(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: EXPLORE.map(({ id, label, icon }) => ({ id, label, icon })), onSelect: open });
    clickHandler = (id) => { if (!id) return; open(id === 'traveller' ? 'cross' : id); };
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${EXPLORE.length}`);
  }

  // ---------- 2. Раздели Европа ----------
  function step2() {
    shell.step(1);
    mode('map');
    hideExtras();
    stage.flyTo(MVIEW[0], MVIEW[1], 1);
    const state = {};
    for (const k of GIVEN) state[k] = B55[k];
    paint(state);
    for (const [k, l] of mapObjs.labels) l.visible = true;
    let mistakes = 0, done = 0, brush = 'nato';
    const tries = {};
    shell.task('Европа в края на 1955 г. Някои държави вече са оцветени. Избери цвят и кликни всяка сива държава с надпис, за да я сложиш в нейния блок.');
    const c = shell.setControls(`<div class="row brushes">${BRUSH.map((b) => `<button class="btn brush" data-b="${b.id}"><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${b.col};border:1px solid #0003;vertical-align:-2px"></span> ${esc(b.label)}</button>`).join('')}</div>`);
    const drawBrush = () => c.querySelectorAll('.brush').forEach((b) => b.classList.toggle('primary', b.dataset.b === brush));
    c.querySelectorAll('.brush').forEach((b) => b.addEventListener('click', () => { brush = b.dataset.b; drawBrush(); }));
    drawBrush();
    shell.score(`Разпределени: 0 от ${SORT.length}`);
    clickHandler = (id) => {
      if (!id || done >= SORT.length) return;
      if (id === 'berlin' || id === 'wberlin') { say(mapObjs.berlinPin, 'Западен Берлин е като остров сред ГДР, свързан със Запада. Не е отделна държава в блок.', { cls: 'wide' }); return; }
      if (!SORT.includes(id)) {
        if (ENT[id] || id === 'gdr') shell.msg(`${NAME[id]} вече е оцветена. Търси сивите държави с надпис.`, '');
        return;
      }
      if (state[id]) return;
      const a = mapObjs.anchors.get(id);
      if (B55[id] !== brush) {
        mistakes++; tries[id] = (tries[id] || 0) + 1;
        shell.msg(`Не е този цвят за ${NAME[id]}. ${WHY[id]}`, 'bad');
        say(a, `<b>${esc(NAME[id])}</b>: помисли пак.`, { cls: 'bad' });
        return;
      }
      state[id] = brush; done++;
      paint(state);
      say(a, `<b>${esc(NAME[id])}</b><br>${esc(GOOD[id])}`, { cls: 'good wide' });
      shell.msg('Вярно!', 'good');
      shell.score(`Разпределени: ${done} от ${SORT.length}`);
      if (done < SORT.length) return;
      scores.push(stepScore(mistakes, 3));
      clickHandler = null;
      // Завесата се спуска.
      mapObjs.showCurtain(true, { animate: true });
      later(() => {
        say(mapObjs.curtainAnchor, '<b>„Желязната завеса“</b><br>„От Шчечин на Балтийско море до Триест на Адриатическо море над континента се е спуснала желязна завеса.“ — Уинстън Чърчил, март 1946 г. От двете ѝ страни са двата блока.' + APPROX, { cls: 'wide', lift: 0.6 });
      }, 1200);
      shell.task('Ето я „желязната завеса“ — границата между двата блока. Германия е разделена на две държави, а Берлин — на две части. България е в Източния блок.');
      const n = shell.setControls('<button class="btn primary next">Напред →</button>');
      n.querySelector('button').addEventListener('click', () => { clearTimers(); clearTip(); step3(); });
    };
  }

  // ---------- 3. Приложи: към кой блок? ----------
  function cardHome(i) {
    const cols = far > 1 ? 2 : 3, row = Math.floor(i / cols), col = i % cols, n = Math.min(cols, CARDS.length - row * cols);
    const w = far > 1 ? 4.1 : 3.8;
    return new THREE.Vector3((col - (n - 1) / 2) * w + 0.4, 0.45, (far > 1 ? 1.9 : 2.5) + row * (far > 1 ? 0.7 : 0.62));
  }
  function step3() {
    shell.step(2);
    clickHandler = null;
    hideExtras();
    mapObjs.showCurtain(true);
    paint(B55);
    for (const l of mapObjs.labels.values()) l.visible = false;
    const { zones, cards } = mapObjs;
    zones.w.visible = zones.e.visible = true;
    CARDS.forEach((c, i) => { const g = cards.get(c.id); g.visible = true; g.userData.locked = false; g.position.copy(cardHome(i)); g.userData.home = g.position.clone(); g.userData.label.material.opacity = 1; });
    stage.flyTo(far > 1 ? [0.4, 13.5, 11.5] : [0.4, 9.2, 8.2], far > 1 ? [0.4, 0, 1.6] : [0.4, 0, 1.3], 1);
    let mistakes = 0, placed = 0;
    const count = { w: 0, e: 0 }, tries = {};
    shell.task('Кое към кой блок принадлежи? Завлечи всяка карта в кръга на Запада (САЩ) или на Изтока (СССР).');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${CARDS.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.45,
      onDrop(obj) {
        const id = obj.userData.dragId, c = CARDS.find((x) => x.id === id);
        const d = (s) => Math.hypot(obj.position.x - zones[s].position.x, obj.position.z - zones[s].position.z);
        const zone = d('w') < 1.9 ? 'w' : d('e') < 1.9 ? 'e' : null;
        if (!zone) { obj.position.copy(obj.userData.home); return; }
        if (zone !== c.side) {
          mistakes++; tries[id] = (tries[id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(`Не е тук. ${c.why}`, 'bad');
          return;
        }
        const k = count[zone]++;
        obj.position.set(zones[zone].position.x, 0.45, zones[zone].position.z - 0.95 + k * 0.45);
        obj.userData.locked = true;
        placed++;
        shell.msg(`Вярно! ${c.why}`, 'good');
        shell.score(`Подредени: ${placed} от ${CARDS.length}`);
        if (placed === CARDS.length) {
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 4));
          shell.task('Браво! Двата блока се надпреварват във всичко: във въоръжаването, в Космоса, в стопанството. Но не воюват пряко помежду си.');
          const n = shell.setControls('<button class="btn primary next">Напред →</button>');
          n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
        }
      },
    });
  }

  // ---------- 4. Плъзгач и предсказание ----------
  function showYear(y) {
    const o = mapObjs;
    hideExtras();
    const b = blocsOf(y);
    if (y === 1948) b.gdr = 'eastPale';
    paint(b, { gdr: y >= 1948 && y < 1990, wberlin: y >= 1948 && y < 1990 });
    o.showCurtain(y < 1990, { faded: y < 1949 || y === 1989 });
    o.wall.visible = y >= 1961 && y < 1989;
    o.planes.visible = y === 1948;
    o.sputnik.visible = y === 1957;
    o.vostok.visible = y === 1961;
    o.moon.visible = y === 1969;
    o.cuba.visible = y === 1962;
    o.sofia.visible = y === 1989;
    const e = EV[y];
    const at = { 1946: o.curtainAnchor, 1948: o.berlinPin, 1949: o.anchors.get('frg'), 1955: o.anchors.get('pl'), 1957: o.sputnik, 1961: o.berlinPin, 1962: o.cuba, 1969: o.moon, 1989: o.berlinPin, 1990: o.anchors.get('frg'), 1991: o.anchors.get('ussr') }[y];
    say(at, `<b>${esc(e.title)}</b><br>${esc(e.text)}${y >= 1948 && y <= 1990 ? APPROX : ''}`, { cls: 'wide', lift: y === 1969 ? 1.1 : y === 1957 ? 0.6 : 0.5 });
    if (tip2) { tip2.remove(); tip2 = null; }
    if (y === 1989) tip2 = stage.bubble(o.sofia, '10 ноември 1989 г.: Тодор Живков е отстранен.', { lift: 0.5, cls: 'tag' });
  }
  function step4() {
    shell.step(3);
    hideExtras();
    for (const l of mapObjs.labels.values()) l.visible = false;
    stage.flyTo(far > 1 ? [0.4, 13.5, 9.6] : [0.4, 9.6, 7.0], [0.4, 0, 0.2], 1);
    let mistakes = 0, years = STOPS.slice(), answered = false;
    const draw = () => {
      const c = shell.setControls(`<div class="yr-title small"></div>
        <input class="yr-range" type="range" min="0" max="${years.length - 1}" step="1" value="0" style="width:100%">
        <div class="row small yr-ticks" style="justify-content:space-between;flex-wrap:nowrap">${years.map((y) => `<span>${years.length > 7 ? `’${String(y).slice(2)}` : y}</span>`).join('')}</div>
        <div class="yr-legend small"></div>
        <div class="col opts" style="margin-top:8px">${answered ? '' : PREDICT.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
      const range = c.querySelector('.yr-range');
      const update = () => {
        const y = years[+range.value];
        c.querySelector('.yr-title').innerHTML = `<b>${esc(EV[y].title)}</b>`;
        c.querySelector('.yr-legend').textContent = EV[y].legend;
        showYear(y);
      };
      range.addEventListener('input', update);
      c.querySelectorAll('.opts button').forEach((b) => b.addEventListener('click', () => {
        const o = PREDICT.opts[+b.dataset.i];
        if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
        scores.push(stepScore(mistakes, 2));
        answered = true;
        years = [...STOPS, ...LATER];
        draw();
        const r = shell.controls.querySelector('.yr-range');
        // Сцената показва какво наистина става: 1989 → 1990 → 1991.
        const play = (i) => { r.value = STOPS.length + i; r.dispatchEvent(new Event('input')); };
        play(0);
        later(() => play(1), 4200);
        later(() => play(2), 8400);
        shell.msg('Вярно предсказание!', 'good');
        shell.task('<b>Така и става.</b> Стената пада мирно на 9 ноември 1989 г. Можеш да местиш плъзгача и до 1991 г.');
        const n = document.createElement('button');
        n.className = 'btn primary next'; n.textContent = 'Виж резултата';
        shell.controls.appendChild(n);
        n.addEventListener('click', () => {
          clearTimers(); clearTip();
          const ratio = scores.reduce((s, x) => s + x, 0) / scores.length;
          shell.finish(ratio, onComplete, restart);
        });
      }));
      if (!answered) update();
      return c;
    };
    shell.task('Премести плъзгача и проследи Студената война от 1946 до 1969 г. После предскажи: ' + PREDICT.ask);
    shell.score('');
    draw();
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTimers(); clearTip();
    if (menu) menu.remove();
    step1();
  }

  shell.task('Зареждане…');
  (async () => {
    berlin = buildBerlin(stage);
    for (const [id, p] of Object.entries(B_AT)) {
      const a = new THREE.Object3D(); a.position.set(...p); berlin.group.add(a); bAnchors.set(id, a);
      if (id === 'cross') continue;
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), new THREE.MeshStandardMaterial({ color: 0xf2c230, emissive: 0x6a4a00 }));
      m.position.set(p[0], p[1] + 4.5, p[2]); m.raycast = () => {}; berlin.group.add(m); marks.set(id, m);
    }
    stage.tick((dt, t) => { for (const m of marks.values()) { m.rotation.y = t * 1.5; m.position.y += Math.sin(t * 2.5) * 0.008; } });
    await buildMap();
    step1();
  })().catch((e) => shell.msg(`Сцената не се зареди: ${e.message}`, 'bad'));

  container.__demo = {
    stage, get map() { return map; }, get berlin() { return berlin; }, get objs() { return mapObjs; }, SORT, B55, CARDS,
    at(id) {
      let o = null;
      if (mapObjs && mapObjs.extra.visible && mapObjs.anchors.has(id)) o = mapObjs.anchors.get(id);
      else if (mapObjs && mapObjs.zones.w.visible && (id === 'zone-w' || id === 'zone-e')) o = mapObjs.zones[id.slice(5)];
      else if (berlin && berlin.group.visible && bAnchors.has(id)) o = bAnchors.get(id);
      if (!o) return stage.screenOf(id);
      const v = o.getWorldPosition(new THREE.Vector3()).project(stage.camera);
      const r = stage.renderer.domElement.getBoundingClientRect();
      return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
    },
  };
  return {
    dispose() {
      clearTimers();
      if (stopDrag) stopDrag();
      if (menu) menu.remove();
      if (mapObjs) mapObjs.dispose();
      if (reg) reg.dispose();
      if (map) map.dispose();
      if (berlin) berlin.dispose();
      stage.dispose();
    },
  };
}
