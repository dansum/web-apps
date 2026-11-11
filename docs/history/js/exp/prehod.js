// „Преход, НАТО и ЕС“ (10.3.9): България след 1989 г.
// Стъпки: 1) опознай центъра на София 1989–1991 (митингът, Кръглата маса, изборите, Великото народно
//            събрание, Конституцията със схема на устройството) → 2) опит: от планова към пазарна икономика
//            в един град — три промени и техните последствия → 3) приложи: кое е кое по Конституцията и
//            стъпките на България към НАТО и ЕС на картата на Европа → 4) предскажи какво носи членството в ЕС
//            и виж примери. Сградите са опростени, разстоянията — сгъстени; хората и плакатите са възстановка.
import { createStage, cornerMenu, esc, labelSprite, THREE } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { nevsky, parliament, tsarMonument, vitosha } from './hist/sofia-places.js';
import { cityPerson, streetLamp, CM } from './hist/city.js';
import { leafTree } from './hist/revival.js';
import { mergeStatic } from './hist/medieval.js';
import { panelBlock, bus, car, homePerson, streetLight } from './hist/home.js';
import { plume } from './hist/industrial.js';
import { cloud } from './hist/bulgar.js';
import {
  partyHouse, tribune, banner, roundTableHall, pollingStation, constitutionStand, stateDiagram, ORGANS, flagPole, waveFlag,
  shop, kiosk, cafe, factory, laborOffice, euBillboard, school, borderPost, truck, road,
} from './hist/prehod-places.js';

const ms = (obj, keys = []) => mergeStatic(obj, keys.flatMap((k) => [].concat(obj.userData[k] ?? [])));
const tag = (s) => `<br><i class="small">${s}</i>`;

// ---------- 1. София, 1989–1991 ----------
const EXPLORE = [
  { id: 'nov10', icon: '📅', label: '10 ноември 1989 г.', note: '<b>10 ноември 1989 г.</b><br>Ръководството на Българската комунистическа партия (БКП) освобождава Тодор Живков, който е начело на партията и държавата 35 години. Започват промените. Това е Партийният дом — седалището на БКП. Червената звезда на върха е свалена по-късно.' + tag('Сградата е запазена. Моделът е опростен, разстоянията в сцената са сгъстени.') },
  { id: 'miting', icon: '📣', label: 'Митингът пред „Ал. Невски“', note: '<b>Свободните митинги</b><br>На 18 ноември 1989 г. пред храма „Св. Александър Невски“ се събира първият голям свободен митинг. Хората искат демокрация и свободни избори. През декември 1989 г. опозиционните организации се обединяват в Съюза на демократичните сили (СДС).' + tag('Възстановка: хората и плакатите са обобщени. Храмът е запазен, моделът е опростен.') },
  { id: 'kragla', icon: '⭕', label: 'Кръглата маса (1990)', note: '<b>Кръглата маса</b><br>От януари до май 1990 г. управляващата БКП (от април 1990 г. — БСП), опозицията (СДС) и други организации преговарят на Кръглата маса. Те се договарят за мирен преход и за свободни избори. През януари 1990 г. е отменен член 1 от старата конституция — за „ръководната роля“ на БКП. Връща се плурализмът: много партии, свободни мнения, свободен печат.' + tag('Възстановка: залата и масата са показани условно.') },
  { id: 'izbori', icon: '🗳️', label: 'Свободните избори (юни 1990)', note: '<b>Първите свободни избори</b><br>На 10 и 17 юни 1990 г. гражданите избират Велико народно събрание. Участват много партии. Гласуването е тайно: в кабината никой не вижда избора ти, после бюлетината се пуска в урната.' + tag('Възстановка на избирателна секция.') },
  { id: 'vns', icon: '🏛', label: 'Великото народно събрание', note: '<b>Великото народно събрание</b><br>То има 400 народни представители и заседава в сградата на Народното събрание. Главната му задача е да приеме нова конституция.' + tag('Сградата е запазена. Моделът е опростен.') },
  { id: 'konst', icon: '📜', label: 'Конституцията (1991)', note: '<b>Конституцията на Република България</b><br>Приета е на 12 юли 1991 г. и е в сила и днес (с изменения). България е република с парламентарно управление. Властта е разделена на законодателна, изпълнителна и съдебна. Политическият живот се основава на плурализма — никоя партия или идеология не може да бъде обявена за държавна. Икономиката се основава на свободната стопанска инициатива.<br><b>Виж схемата отпред: кликни всяка част.</b>' },
];
const ORG_NOTE = {
  ns: '<b>Народно събрание</b> — законодателна власт<br>240 народни представители, избрани от гражданите за 4 години. Приема законите и бюджета, избира министър-председателя и Министерския съвет.',
  pres: '<b>Президент</b> — държавен глава<br>Избира се пряко от гражданите за 5 години, най-много два пъти. Заедно с него се избира вицепрезидент.',
  ms: '<b>Министерски съвет</b> — изпълнителна власт<br>Правителството ръководи вътрешната и външната политика. Начело е министър-председателят.',
  court: '<b>Съдебна власт</b><br>Съдилищата, прокуратурата и следствието. Съдебната власт е независима.',
  ks: '<b>Конституционен съд</b><br>Следи законите да са в съгласие с Конституцията. Има 12 съдии.',
  obsh: '<b>Общините</b> — местно самоуправление<br>Жителите на всяка община избират кмет и общински съвет.',
};
// ---------- 2. Опит: три промени ----------
const REFORMS = [
  { id: 'prices', icon: '🏷️', label: 'Свободни цени', on: '<b>Свободни цени</b><br>Цените вече не се определят от държавата. Стоките се връщат по рафтовете, опашките изчезват. <b>Но</b> цените растат бързо — парите губят стойност (инфлация), а заплатите и пенсиите не смогват.', off: 'Цените отново се определят от държавата: стоките не стигат, опашката се връща.' },
  { id: 'firms', icon: '🏪', label: 'Частни фирми', on: '<b>Частни фирми</b><br>Хората сами откриват магазини, будки, кафенета и работилници. Появяват се нови стоки, услуги и работни места. Много от фирмите са малки и рискуват.', off: 'Без частни фирми почти всичко е на държавата.' },
  { id: 'priv', icon: '🏭', label: 'Приватизация', on: '<b>Приватизация</b><br>Държавните предприятия се продават на частни собственици. Някои се обновяват и работят по-добре. Други губят старите си пазари (Съветът за икономическа взаимопомощ се разпада през 1991 г.) и затварят — хората остават без работа. Приватизацията е бавна и често спорна.', off: 'Заводът отново е държавен и работи с всички работници.' },
];
const CLASSIFY = [
  { t: 'В магазините има много и различни стоки.', good: true, why: 'Свободните цени и частните фирми пълнят рафтовете.' },
  { t: 'Цените растат бързо — инфлация.', good: false, why: 'Инфлацията изяжда заплатите и спестяванията.' },
  { t: 'Хората могат сами да започнат собствен бизнес.', good: true, why: 'Частната инициатива е основа на пазарната икономика.' },
  { t: 'Много заводи затварят и хора остават без работа.', good: false, why: 'Безработицата е едно от най-тежките предизвикателства на прехода.' },
  { t: 'Опашките пред магазините изчезват.', good: true, why: 'Когато стоките стигат, няма нужда да се чака.' },
  { t: 'Спестяванията на хората губят стойност.', good: false, why: 'При тежката криза от 1996–1997 г. парите се обезценяват много бързо. През 1997 г. е въведен валутен борд.' },
];
// ---------- 3. Приложи ----------
const ORG_Q = [
  { id: 'pres', t: 'Избира се пряко от гражданите за 5 години и е държавен глава.' },
  { id: 'ks', t: 'Проверява дали законите са в съгласие с Конституцията.' },
  { id: 'ns', t: '240 народни представители приемат законите.' },
  { id: 'obsh', t: 'Жителите избират кмет и общински съвет.' },
  { id: 'ms', t: 'Правителството, начело с министър-председателя.' },
  { id: 'court', t: 'Съдилищата и прокуратурата — независими от другите власти.' },
];
const STEPS_BG = [
  { id: 'e1', t: 'Отстраняване на Тодор Живков', when: '10 ноември 1989 г.', year: 1989, layer: 'eu' },
  { id: 'e2', t: 'Избори за Велико народно събрание', when: 'юни 1990 г.', year: 1990, layer: 'eu' },
  { id: 'e3', t: 'Нова Конституция', when: '12 юли 1991 г.', year: 1991, layer: 'eu' },
  { id: 'e4', t: 'Членство в НАТО', when: '29 март 2004 г.', year: 2004, layer: 'nato' },
  { id: 'e5', t: 'Подписване на договора за присъединяване към ЕС', when: '25 април 2005 г.', year: 2005, layer: 'eu' },
  { id: 'e6', t: 'Членство в Европейския съюз', when: '1 януари 2007 г.', year: 2007, layer: 'eu' },
  { id: 'e7', t: 'Пълноправен член на Шенгенското пространство', when: '1 януари 2025 г.', year: 2025, layer: 'eu' },
];
const SHOW_ORDER = ['e6', 'e2', 'e4', 'e7', 'e1', 'e5', 'e3'];
// Кога влизат държавите (по кодовете на картата). Германия: до 1990 г. членува само Западна Германия.
const EU = {
  1958: ['056', '250', '276', '380', '442', '528'], 1973: ['208', '372', '826'], 1981: ['300'], 1986: ['724', '620'], 1995: ['040', '246', '752'],
  2004: ['196', '203', '233', '348', '428', '440', '470', '616', '703', '705'], 2007: ['100', '642'], 2013: ['191'],
};
const EU_LEFT = { '826': 2020 };
const NATO = {
  1949: ['056', '208', '250', '380', '442', '528', '578', '620', '826'], 1952: ['300', '792'], 1955: ['276'], 1982: ['724'], 1999: ['203', '348', '616'],
  2004: ['100', '233', '428', '440', '642', '703', '705'], 2009: ['008', '191'], 2017: ['499'], 2020: ['807'], 2023: ['246'], 2024: ['752'],
};
const YEARS = [...new Set([...Object.keys(EU), ...Object.keys(NATO), '2020', '2025'].map(Number))].sort((a, b) => a - b);
const MAPNOTE = {
  eu: (y) => (y < 1993 ? 'Европейските общности (от 1993 г. — Европейски съюз)' : 'Европейски съюз'),
  nato: () => 'НАТО (САЩ, Канада и Исландия са извън картата)',
};
const CLR = { none: 0xd9d2c0, nato: 0x3a5aa8, eu: 0xf2c230, bgNo: 0x7cc47f, bgNato: 0x1a2f6e, bgEu: 0xc98400 };
function members(layer, year) {
  const t = layer === 'nato' ? NATO : EU;
  const out = new Set();
  for (const [y, ids] of Object.entries(t)) if (+y <= year) ids.forEach((i) => out.add(i));
  if (layer === 'eu') for (const [id, y] of Object.entries(EU_LEFT)) if (year >= y) out.delete(id);
  return out;
}
// ---------- 4. Предскажи ----------
const PREDICT = {
  ask: '1 януари 2007 г.: България става член на Европейския съюз. <b>Какво наистина се случва през следващите години?</b>',
  opts: [
    { t: 'Идват европейски средства за пътища, училища и болници, а българите могат свободно да учат и работят в другите страни от ЕС.', ok: true },
    { t: 'Още от 1 януари 2007 г. в България се плаща с евро.', why: 'Не. През 2007 г. левът остава. Еврото идва много по-късно — от 1 януари 2026 г.' },
    { t: 'Още същия ден изчезват проверките по всички граници.', why: 'Не веднага. Шенгенското пространство е отделна стъпка: България влиза в него по въздух и море от 31 март 2024 г., а напълно — от 1 януари 2025 г.' },
    { t: 'България напуска НАТО, защото вече е в ЕС.', why: 'Не. България остава в НАТО. Повечето държави от ЕС са и в НАТО.' },
  ],
};
const REVEAL = [
  { id: 'road', note: '<b>Пътища и водопроводи</b><br>С европейски средства се строят и ремонтират магистрали, пътища, водопроводи и пречиствателни станции. На всеки такъв обект има табела.' },
  { id: 'school', note: '<b>Училища и болници</b><br>Обновяват се училища, детски градини и болници: нови прозорци, изолация, отопление.' },
  { id: 'study', note: '<b>Свободно учене и работа</b><br>Българите могат да учат, работят и живеят в другите държави от ЕС. Българските фирми продават на общия европейски пазар.' },
  { id: 'border', note: '<b>Шенген</b><br>От 1 януари 2025 г. България е пълноправен член на Шенгенското пространство — без проверки на границите с другите държави в него, например с Румъния и Гърция.' },
  { id: 'note', note: '<b>Това са примери, а не пълна равносметка.</b><br>Членството носи и задължения: общи правила и стандарти, отчет за всяко евро от фондовете. Как се използват възможностите, зависи и от нас.' },
];

export function mount(container, { skill = {}, onComplete } = {}) {
  void skill;
  const shell = createShell(container, { steps: ['Опознай: София 1989–1991', 'Опит: към пазарна икономика', 'Приложи: устройство, НАТО и ЕС', 'Предскажи: България в ЕС'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const SKY = 0xcfe0ee;
  const stage = createStage(shell.stageEl, { background: SKY, camPos: [0, 13, 19], target: [0, 0, 0], minDistance: 2, maxDistance: 60, maxPolarAngle: Math.PI * 0.49 });
  const { scene } = stage;
  const host = stage.renderer.domElement.parentElement;
  const view = (pos, tgt, dur = 1, k = far) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur);
  const put = (parent, obj, x, z, ry = 0, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; parent.add(obj); return obj; };
  const anchors = new Map();
  const anchor = (parent, id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); anchors.set(id, o); return o; };
  const flags = [];
  const waves = [];
  const pole = (f) => { flags.push(f.userData.cloth); waves.push(f); return f; };

  // ================= СОФИЯ =================
  const sofia = new THREE.Group(); scene.add(sofia);
  {
    const pav = new THREE.Mesh(new THREE.BoxGeometry(36, 0.1, 26), CM('paving', { rep: [18, 13] }));
    pav.position.y = -0.05; sofia.add(pav);
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(160, 120), new THREE.MeshStandardMaterial({ color: 0xa9c08a, roughness: 1 }));
    grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.11, -20); sofia.add(grass);
    const asphalt = new THREE.Mesh(new THREE.BoxGeometry(36, 0.02, 1.6), new THREE.MeshStandardMaterial({ color: 0x55575b, roughness: 0.95 }));
    asphalt.position.set(0, 0.01, 11.2); sofia.add(asphalt);
    const vit = vitosha({ w: 70, d: 18, h: 7 }); vit.position.set(4, -0.1, -40); sofia.add(vit);
  }
  const NV = { x: 0, z: -9.5 }, PA = { x: -10, z: -1 }, PH = { x: 10.5, z: -1.5 }, RT = { x: 7.2, z: 6.2 }, PS = { x: -7.6, z: 6.6 }, CS = { x: -5.6, z: 2.4 }, DG = { x: 0, z: 3.0 };
  put(sofia, ms(nevsky()), NV.x, NV.z);
  const pa = parliament({ w: 3.4, d: 1.4 }); put(sofia, ms(pa, ['flag']), PA.x, PA.z, Math.PI / 2); flags.push(pa.userData.flag);
  put(sofia, ms(tsarMonument()), PA.x + 2.3, PA.z, Math.PI);
  const ph = partyHouse(); put(sofia, ms(ph, ['star']), PH.x, PH.z, -Math.PI / 2);
  const tri = tribune(); put(sofia, tri, 0, -6.4); tri.userData.flags.forEach(pole);
  // Митингът: хора с плакати и знамена.
  const crowd = [];
  {
    const kinds = ['man', 'woman', 'man', 'tourist', 'woman', 'kid', 'man', 'woman'];
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 44; i++) {
      const p = cityPerson(kinds[i % kinds.length]);
      p.position.set(-4.6 + (i % 11) * 0.9 + (r() - 0.5) * 0.4, 0, -4.9 + Math.floor(i / 11) * 1.05 + (r() - 0.5) * 0.4);
      p.rotation.y = Math.PI + (r() - 0.5) * 0.6; sofia.add(p); crowd.push(p);
    }
    for (const [t, x, z] of [['ДЕМОКРАЦИЯ', -2.6, -3.6], ['СВОБОДНИ ИЗБОРИ', 1.8, -2.5], ['ГЛАСНОСТ', -0.6, -1.4]]) { const b = banner(t, { w: 1.3, h: 0.24, pole: 0.95 }); b.rotation.y = Math.PI; put(sofia, b, x, z, Math.PI); crowd.push(b); }
    for (const [x, z] of [[3.4, -3.9], [-4.0, -2.2], [0.6, -4.4]]) { const f = flagPole('bg', { pole: 1.25, w: 0.42, h: 0.27 }); put(sofia, f, x, z, Math.PI); pole(f); crowd.push(f); }
  }
  const hall = roundTableHall(); put(sofia, hall, RT.x, RT.z);
  const sitters = hall.userData.seats.map((st, i) => { const p = cityPerson(['man', 'woman', 'man', 'tourist'][i % 4]); p.scale.multiplyScalar(0.92); p.position.set(RT.x + st.x, -0.08, RT.z + st.z); p.rotation.y = st.ry + Math.PI; sofia.add(p); return p; });
  const poll = pollingStation(); put(sofia, poll, PS.x, PS.z);
  const voters = [0, 1, 2, 3].map((i) => put(sofia, cityPerson(['woman', 'man', 'kid', 'man'][i]), PS.x + 1.9 + i * 0.5, PS.z + 1.6, -Math.PI / 2));
  const voter = put(sofia, cityPerson('man'), PS.x, PS.z);
  put(sofia, constitutionStand(), CS.x, CS.z, Math.PI / 4);
  const DS = 1.35;
  const diagram = stateDiagram(); put(sofia, diagram, DG.x, DG.z); diagram.scale.set(DS, 0.001, DS); diagram.visible = false;
  diagram.userData.flags.forEach(pole);
  for (const [x, z] of [[-16, -6], [-16, 4], [16, -7], [16, 4], [-13, 9.4], [13, 9.4], [-4.5, -8.5], [4.5, -8.5], [12.5, -6.5]]) put(sofia, leafTree(1.5), x, z);
  for (const x of [-15, -9, 9, 15]) put(sofia, ms(streetLamp(), ['glass']), x, 10.2);
  const sCars = [0x6a8fb0, 0xc0392b, 0xf2efe6, 0x2f8f5a].map((c, i) => { const k = car(c); k.scale.setScalar(0.24); k.userData.off = i * 9; sofia.add(k); return k; });
  const clouds = [[-14, 9, -18], [6, 10, -24], [18, 9.5, -14]].map(([x, y, z]) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(1.6); sofia.add(c); return c; });
  // Котви и жълти знаци.
  const S_AT = { nov10: [PH.x - 3.2, 0.2, PH.z - 3.6], miting: [-3.2, 1.2, -1.2], kragla: [RT.x, 1.3, RT.z], izbori: [PS.x + 2.4, 1.3, PS.z + 1.2], vns: [PA.x, 2.3, PA.z], konst: [CS.x, 1.1, CS.z] };
  for (const [id, p] of Object.entries(S_AT)) anchor(sofia, id, ...p);
  const MARK_AT = { nov10: [PH.x, 4.9, PH.z], miting: [0, 1.6, -3.2], izbori: [PS.x, 1.4, PS.z] };
  const marks = new Map();
  for (const [id, p] of Object.entries(S_AT)) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshStandardMaterial({ color: 0xf2c230, emissive: 0x6a4a00 }));
    const q = MARK_AT[id] || p; m.position.set(q[0], q[1] + 1.1, q[2]); m.raycast = () => {}; sofia.add(m); marks.set(id, m);
  }
  // Невидими зони за клик върху местата.
  const hitZone = (id, x, y, z, w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x, y, z); m.userData.pickId = id; sofia.add(m); return m; };
  const sZones = [
    hitZone('nov10', PH.x, 1.5, PH.z, 2, 3, 4), hitZone('miting', 0, 0.6, -3, 10, 1.2, 5), hitZone('kragla', RT.x, 0.5, RT.z, 3.4, 1, 3.4),
    hitZone('izbori', PS.x, 0.6, PS.z, 3.2, 1.2, 1.9), hitZone('vns', PA.x, 1, PA.z, 1.6, 2, 3.6), hitZone('konst', CS.x, 0.4, CS.z, 0.8, 0.9, 0.8),
  ];
  const S_VIEW = [[0, 13, 19], [0, 0, 0.5]];
  const D_VIEW = [[DG.x + 0.8, 7.6, DG.z + 10], [DG.x, 0.4, DG.z + 1.2]];
  const S_VIEWS = {
    nov10: [[0.5, 3.4, 4.5], [PH.x - 2.4, 2.4, PH.z - 2.7]], miting: [[2.5, 3.6, 4.5], [0, 1.2, -7]], kragla: [[RT.x - 1.5, 5.5, RT.z + 5.5], [RT.x, 0.3, RT.z]],
    izbori: [[PS.x + 0.8, 2.6, PS.z + 4.6], [PS.x, 0.35, PS.z]], vns: [[-3.5, 3.8, 3.2], [PA.x, 1, PA.z]], konst: D_VIEW,
  };

  // ================= ГРАДЪТ (в метри) =================
  const town = new THREE.Group(); scene.add(town); town.visible = false;
  {
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(400, 240), new THREE.MeshStandardMaterial({ color: 0x9fb87e, roughness: 1 }));
    gr.rotation.x = -Math.PI / 2; gr.position.set(30, -0.02, -20); town.add(gr);
    const walk = new THREE.Mesh(new THREE.BoxGeometry(80, 0.12, 6), CM('paving', { rep: [30, 2] })); walk.position.set(-2, 0.06, 3.2); town.add(walk);
    const walk2 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.12, 6), CM('paving', { rep: [30, 2] })); walk2.position.set(-2, 0.06, 15.2); town.add(walk2);
    const plaza = new THREE.Mesh(new THREE.BoxGeometry(80, 0.08, 18), CM('paving', { color: 0xc9c2b0, rep: [20, 5] })); plaza.position.set(-2, 0.04, -9); town.add(plaza);
  }
  put(town, road(80, { w: 6 }), -2, 9.2);
  const shp = shop(); put(town, shp, -14, -2);
  const fac = factory(); put(town, fac, 22, -14);
  const lab = laborOffice(); put(town, lab, 0, -6);
  for (const [x, f] of [[-30, 8], [0, 9], [30, 8]]) put(town, ms(panelBlock({ floors: f, bays: 8 })), x, -42);
  put(town, ms(panelBlock({ floors: 6, bays: 6 })), -58, -12, Math.PI / 2);
  const sch = school(); put(town, sch, 54, -8);
  for (const x of [-36, -20, -4, 12, 28]) { const l = ms(streetLight()); put(town, l, x, 6.4, Math.PI); }
  for (const [x, z] of [[-42, -2], [-26, 2], [-6, -6], [8, 18], [-16, 18], [26, 18], [38, -2], [68, 0], [44, 18]]) { const t = leafTree(6); put(town, t, x, z); }
  const smoke = plume(stage, fac, fac.userData.chimneyTop.clone(), { n: 9, size: 1.2, rise: 16, drift: 6, color: 0x8a8a8e, opacity: 0.55, speed: 0.12 });
  smoke.group.visible = false;
  // Частните фирми (появяват се).
  const firms = new THREE.Group(); town.add(firms);
  put(firms, kiosk({ label: 'ВЕСТНИЦИ', color: 0x2f6fb0 }), -27, 2);
  put(firms, kiosk({ label: 'ЗАКУСКИ', color: 0x2f8f5a }), 7, 2);
  put(firms, kiosk({ label: 'РЕМОНТ', color: 0xc0392b }), 13, 2);
  put(firms, cafe(3), -4, 15.6);
  const firmPeople = [[-27, 4.4], [7, 4.4], [-3, 14.6], [-0.8, 16.4], [13, 4.4], [1.4, 15.8]].map(([x, z], i) => put(firms, homePerson([{ top: 0xc0392b }, { top: 0x2f6fb0, dress: 0x2f6fb0 }, { top: 0xf2c230 }, { dress: 0x8e44ad }, { top: 0x2f8f5a }, { top: 0x6a8fb0 }][i]), x, z, Math.PI));
  // Опашката пред магазина и работниците.
  const DOOR = new THREE.Vector3(-14 + 4.4, 0, 2);
  const looks = [{ top: 0x6a5a4a }, { dress: 0x7a2e2e }, { top: 0x3a4f6a }, { dress: 0x4a5a3a, top: 0x4a5a3a }, { top: 0x5a5a5e }, { dress: 0x2f4a5a }, { top: 0x7a6a4a }, { dress: 0x8a4a3a }, { top: 0x4a4f3a }];
  const walkers = [];
  const walker = (look, q, away) => { const p = homePerson(look); p.position.copy(q); town.add(p); const w = { p, q: q.clone(), away: away.clone(), target: q.clone() }; walkers.push(w); return w; };
  const queue = looks.map((lk, i) => walker(lk, new THREE.Vector3(DOOR.x + 0.2 + i * 0.85, 0.12, DOOR.z + 1.3), new THREE.Vector3(-34 + i * 6.1 + (i > 3 ? 22 : 0), 0.12, 4.9 - (i % 2) * 0.9)));
  fac.updateMatrixWorld(true);
  const GATE = fac.localToWorld(fac.userData.gate.clone()), LAB = new THREE.Vector3(2.6, 0.12, -6 + 3.6);
  const workers = [0, 1, 2, 3, 4].map((i) => walker({ top: 0x3a4a6a, legs: 0x2a3446 }, new THREE.Vector3(GATE.x - 2 + i * 1.2, 0.12, GATE.z + 0.6 + (i % 2)), new THREE.Vector3(LAB.x - 0.4 - i * 0.85, 0.12, LAB.z + 0.6)));
  const tCars = [0xe8e2d0, 0x3a6ac0, 0xc0392b].map((c, i) => { const k = car(c); k.userData.off = i * 26; k.userData.lane = i % 2; town.add(k); return k; });
  const priceArrow = labelSprite('▲ инфлация', { size: 2.2, color: '#ffffff', bg: 'rgba(192,57,43,0.92)', border: 'rgba(0,0,0,0)' });
  priceArrow.position.set(-14 + 7, 6.8, 2); priceArrow.visible = false; town.add(priceArrow);
  const T_AT = { prices: [-17, 5, 1], firms: [-3, 4, 15.6], priv: [14, 9, -6], base: [-14, 5, 1] };
  for (const [id, p] of Object.entries(T_AT)) anchor(town, 't-' + id, ...p);
  // Стъпка 4: магистрала, табела, граница, автобус.
  const HW0 = 40, HW1 = 120;
  const oldRoad = new THREE.Group(); town.add(oldRoad);
  put(oldRoad, road(HW1 - HW0, { w: 6 }), (HW0 + HW1) / 2, 9.2);
  for (let i = 0; i < 9; i++) { const ph2 = new THREE.Mesh(new THREE.CircleGeometry(0.6 + (i % 3) * 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x35373a })); ph2.rotation.x = -Math.PI / 2; ph2.position.set(HW0 + 5 + i * 8.5, 0.07, 8 + (i % 3) * 1.2); oldRoad.add(ph2); }
  const hwSegs = [];
  for (let i = 0; i < 8; i++) { const sgm = road(10, { w: 12, lanes: 3 }); sgm.position.set(HW0 + 5 + i * 10, 0.02, 9.2); sgm.scale.set(1, 1, 0.001); sgm.visible = false; town.add(sgm); hwSegs.push(sgm); }
  const bill = euBillboard(); bill.scale.setScalar(1.5); put(town, bill, 86, 1.4); bill.visible = false;
  const border = borderPost('РУМЪНИЯ'); put(town, border, 128, 9.2);
  const lorry = truck(0x2f6fb0); town.add(lorry);
  const coach = bus(); town.add(coach);
  const students = [0, 1, 2].map((i) => put(town, homePerson([{ top: 0xf2c230 }, { dress: 0x2f8f8a }, { top: 0x8e44ad }][i]), 48 + i * 1.2, 1.6));
  { const st = new THREE.Mesh(new THREE.BoxGeometry(34, 0.12, 3.4), CM('paving', { rep: [12, 1] })); st.position.set(55, 0.06, 1.4); town.add(st); }
  put(town, road(80, { w: 6 }), 160, 9.2);
  const T_VIEW = [[0, 26, 50], [0, 0, 0]];
  const R_VIEWS = { prices: [[-12, 12, 26], [-13, 2, 1]], firms: [[-6, 16, 40], [-6, 1, 6]], priv: [[12, 30, 36], [15, 1, -5]] };
  const P_VIEW = [[74, 46, 74], [78, 0, 2]];
  for (const id of ['road', 'school', 'study', 'border', 'note']) anchor(town, 'r-' + id, ...({ road: [86, 9, 1.4], school: [54, 9, -8], study: [50, 4, 2], border: [126, 6, 4], note: [80, 8, 2] })[id]);

  // ================= КАРТАТА =================
  let map = null, mapX = null;
  const MVIEW = [[0.6, 9.4 * (far > 1 ? 1.4 : 1), 5.8 * (far > 1 ? 1.4 : 1)], [0.6, 0, -0.1]];

  // ---------- общо ----------
  let menu = null, tip = null, clickHandler = null, timers = [];
  const tags = [];
  const scores = [];
  const say = (a, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(typeof a === 'string' ? anchors.get(a) : a, html, { lift: 0.3, cls: 'wide', ...opts }); return tip; };
  const tagAt = (a, html, cls = 'tag') => { const b = stage.bubble(typeof a === 'string' ? anchors.get(a) : a, html, { lift: 0.2, cls }); tags.push(b); return b; };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } tags.forEach((b) => b.remove()); tags.length = 0; };
  const later = (fn, ms2) => { const h = setTimeout(fn, ms2); timers.push(h); };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  function mode(m) {
    stage.stopFollow();
    sofia.visible = m === 'sofia';
    town.visible = m === 'town';
    smoke.group.visible = m === 'town';
    if (mapX) { map.group.visible = mapX.extra.visible = m === 'map'; }
    stage.scene.background.setHex(m === 'map' ? 0xdcecf7 : SKY);
    stage.scene.fog = m === 'town' ? new THREE.Fog(SKY, 140, 300) : m === 'sofia' ? new THREE.Fog(SKY, 50, 110) : null;
    stage.controls.maxDistance = m === 'town' ? 220 : m === 'map' ? 30 : 60;
    stage.controls.minDistance = m === 'town' ? 6 : 2;
  }

  // Диаграмата „израства“.
  let diagK = 0, diagTarget = 0;
  function showDiagram(on) { diagTarget = on ? 1 : 0; if (on) diagram.visible = true; }

  // ---------- градът: състояние ----------
  const reform = { prices: false, firms: false, priv: false };
  let firmsK = 0;
  function applyTown() {
    shp.userData.setFill(reform.prices ? 1 : 0.12);
    shp.userData.drawPrice(reform.prices ? 'free' : 'fixed');
    priceArrow.visible = reform.prices;
    for (const w of queue) w.target = reform.prices ? w.away : w.q;
    for (const w of workers) w.target = reform.priv ? w.away : w.q;
    fac.userData.setSign(reform.priv ? 'ЧАСТНА ФИРМА' : 'ДЪРЖАВЕН ЗАВОД', reform.priv ? '#1d3f6e' : '#7a1e14');
    smoke.set({ rate: reform.priv ? 0.25 : 1 });
  }
  function resetTown() {
    reform.prices = reform.firms = reform.priv = false;
    applyTown();
    for (const w of [...queue, ...workers]) w.p.position.copy(w.target);
    firmsK = 0; firms.scale.setScalar(0.001); firms.visible = false;
    oldRoad.visible = true; hwSegs.forEach((s) => { s.visible = false; s.scale.z = 0.001; }); bill.visible = false;
    sch.userData.setNew(false); border.userData.barrier.rotation.x = 0;
    reveal.on = false;
  }
  function townAfter2007() {
    reform.prices = reform.firms = reform.priv = true;
    applyTown();
    for (const w of queue) { w.target = w.away; w.p.position.copy(w.away); }
    for (const w of workers) { w.target = w.q; w.p.position.copy(w.q); }
    shp.userData.drawPrice('open'); priceArrow.visible = false; smoke.set({ rate: 0.6 });
    firms.visible = true; firmsK = 1; firms.scale.setScalar(1);
  }
  const reveal = { on: false, k: 0 };

  stage.tick((dt, t) => {
    for (const f of flags) if (f) f.rotation.y = Math.sin(t * 2.1 + f.id) * 0.25;
    for (const f of waves) if (f.visible && f.parent && f.parent.visible !== false) waveFlag(f, t);
    if (sofia.visible) {
      crowd.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 3 + i)) * 0.03; });
      sitters.forEach((p, i) => { p.rotation.y += Math.sin(t * 0.8 + i) * 0.002; });
      for (const m of marks.values()) { m.rotation.y = t * 1.5; m.position.y += Math.sin(t * 2.5) * 0.004; }
      ph.userData.star.rotation.y = Math.sin(t * 0.5) * 0.3;
      // Гласуващият: кабина → урна → обратно.
      const k = (t * 0.12) % 1; const a = new THREE.Vector3(PS.x - 0.9, 0, PS.z + 0.15), b = new THREE.Vector3(PS.x + 1.0, 0, PS.z + 0.45);
      const u = k < 0.5 ? k * 2 : 2 - k * 2; voter.position.lerpVectors(a, b, Math.min(1, Math.max(0, (u - 0.15) / 0.7))); voter.rotation.y = k < 0.5 ? Math.PI / 2 : -Math.PI / 2;
      poll.userData.curtain.scale.x = 1 + Math.sin(t * 2) * 0.03;
      for (const c of sCars) { const x = ((t * 1.4 + c.userData.off) % 36) - 18; c.position.set(x, 0, 11.2 + (c.userData.off % 2 ? 0.35 : -0.35)); c.rotation.y = 0; }
      clouds.forEach((c, i) => { c.position.x = ((c.position.x + dt * (0.2 + i * 0.05) + 30) % 60) - 30; });
      if (diagK !== diagTarget) {
        diagK = diagTarget > diagK ? Math.min(1, diagK + dt * 1.4) : Math.max(0, diagK - dt * 2);
        diagram.scale.y = Math.max(0.001, diagK) * DS; if (diagK === 0) diagram.visible = false;
      }
      const beam = diagram.userData.parts.get('court').userData.beam; if (beam) beam.rotation.z = Math.sin(t * 1.2) * 0.12;
      diagram.userData.arrows.forEach((ar, i) => { ar.position.y = 0.05 + Math.abs(Math.sin(t * 2 + i)) * 0.06; });
    }
    if (town.visible) {
      for (const w of walkers) {
        const d = w.target.clone().sub(w.p.position); d.y = 0;
        const L = d.length();
        if (L > 0.05) { const s = Math.min(L, dt * 4); w.p.position.addScaledVector(d.normalize(), s); w.p.rotation.y = Math.atan2(d.x, d.z); w.p.position.y = 0.12 + Math.abs(Math.sin(t * 9)) * 0.06; }
        else w.p.position.y = 0.12;
      }
      const ft = reform.firms ? 1 : 0;
      if (firmsK !== ft) { firmsK = ft > firmsK ? Math.min(1, firmsK + dt * 1.5) : Math.max(0, firmsK - dt * 2); firms.scale.setScalar(Math.max(0.001, firmsK)); firms.visible = firmsK > 0.002; }
      firmPeople.forEach((p, i) => { p.rotation.y = Math.PI + Math.sin(t * 0.7 + i) * 0.5; });
      priceArrow.position.y = 7.2 + Math.sin(t * 3) * 0.3;
      for (const c of tCars) { const u = ((t * 7 + c.userData.off) % 80) - 42; const dir = c.userData.lane ? -1 : 1; c.position.set(dir * u - (dir < 0 ? 4 : 0), 0, c.userData.lane ? 7.7 : 10.7); c.rotation.y = dir > 0 ? 0 : Math.PI; }
      // Граница: камионът чака пред бариерата, след Шенген минава.
      if (reveal.on) {
        reveal.k = Math.min(1, reveal.k + dt * 0.6);
        border.userData.barrier.rotation.x = -reveal.k * 1.35;
        const x = HW0 + ((t * 9) % (HW1 + 30 - HW0)); lorry.position.set(x, 0, 7.6);
        const bx = 48 + ((t * 7) % 120); coach.position.set(bx, 0, 10.9);
      } else {
        lorry.position.set(122, 0, 7.6); coach.position.set(52, 0, 4.6);
      }
      lorry.rotation.y = 0; coach.rotation.y = 0;
    }
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    mode('sofia');
    resetTown();
    diagK = 0; diagTarget = 0; diagram.scale.y = 0.001; diagram.visible = false;
    crowd.forEach((p) => { p.visible = true; });
    view(...S_VIEW, 0.8);
    shell.task('София, 1989–1991 г. Тук страната минава от власт на една партия към демокрация. Разгледай всичко: избери от менюто или кликни в сцената.');
    const seen = new Set();
    for (const m of marks.values()) m.visible = true;
    const open = (id) => {
      const it = EXPLORE.find((x) => x.id === id);
      if (!it) return;
      const a = anchors.get(id);
      stage.stopFollow();
      view(...S_VIEWS[id], 1);
      say(a, it.note);
      showDiagram(id === 'konst');
      crowd.forEach((p) => { p.visible = id !== 'konst'; });
      if (marks.has(id)) marks.get(id).visible = false;
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${EXPLORE.length}`);
      if (seen.size === EXPLORE.length && !shell.controls.querySelector('.next')) {
        const c = shell.setControls('<button class="btn primary next">Към един български град →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: EXPLORE.map(({ id, label, icon }) => ({ id, label, icon })), onSelect: open });
    clickHandler = (id) => {
      if (!id) return;
      if (id.startsWith('org-')) { const k = id.slice(4); say(diagram.userData.anchors.get(k), ORG_NOTE[k]); return; }
      open(id);
    };
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${EXPLORE.length}`);
  }

  // ---------- 2. Опит ----------
  function step2() {
    shell.step(1);
    clickHandler = null;
    mode('town');
    resetTown();
    view(...T_VIEW, 1.1);
    say('t-base', '<b>Планова икономика</b><br>Заводите и магазините са на държавата. Тя решава какво и колко да се произвежда и на каква цена. Често стоките не стигат и хората чакат на опашки.' + tag('Обобщен град, възстановка.'));
    shell.task('Един български град в началото на 90-те години. Включи трите промени една по една и гледай какво става. Можеш да ги изключваш и включваш пак.');
    const tried = new Set();
    const c = shell.setControls(`<div class="col reforms">${REFORMS.map((r) => `<button class="btn reform" data-r="${r.id}">${r.icon} ${esc(r.label)}: <b class="st">изключено</b></button>`).join('')}</div><div class="go"></div>`);
    const draw = () => c.querySelectorAll('.reform').forEach((b) => { const on = reform[b.dataset.r]; b.classList.toggle('primary', on); b.querySelector('.st').textContent = on ? 'включено' : 'изключено'; });
    c.querySelectorAll('.reform').forEach((b) => b.addEventListener('click', () => {
      const r = REFORMS.find((x) => x.id === b.dataset.r);
      reform[r.id] = !reform[r.id];
      applyTown(); draw();
      if (reform[r.id]) tried.add(r.id);
      const a = anchors.get('t-' + r.id);
      view(...R_VIEWS[r.id], 1);
      say(a, reform[r.id] ? r.on : r.off);
      shell.score(`Изпробвани промени: ${tried.size} от ${REFORMS.length}`);
      if (tried.size === REFORMS.length && REFORMS.every((x) => reform[x.id]) && !c.querySelector('.go .next')) {
        c.querySelector('.go').innerHTML = '<button class="btn primary next" style="margin-top:8px">Какво донесоха промените? →</button>';
        c.querySelector('.go .next').addEventListener('click', () => { clearTip(); classify(); });
      }
    }));
    draw();
    shell.score(`Изпробвани промени: 0 от ${REFORMS.length}`);
  }
  function classify() {
    view(...T_VIEW, 1);
    let i = 0, mistakes = 0;
    shell.task('Пазарната икономика носи нови възможности, но и трудности. Кое е подобрение за хората и кое — трудност на прехода?');
    const ask = () => {
      const q = CLASSIFY[i];
      const c = shell.setControls(`<p class="cls-q"><b>${esc(q.t)}</b></p><div class="row"><button class="btn cls" data-g="1">👍 Подобрение</button><button class="btn cls" data-g="0">⚠️ Трудност</button></div>`);
      c.querySelectorAll('.cls').forEach((b) => b.addEventListener('click', () => {
        const g = b.dataset.g === '1';
        if (g !== q.good) { mistakes++; shell.msg(`Помисли пак. ${q.good ? 'Това помага на хората.' : 'Това затруднява хората.'}`, 'bad'); return; }
        shell.msg(`Вярно! ${q.why}`, 'good');
        i++;
        shell.score(`Отговорени: ${i} от ${CLASSIFY.length}`);
        if (i < CLASSIFY.length) { ask(); return; }
        scores.push(stepScore(mistakes, 2));
        shell.task('Браво! Преходът към пазарна икономика носи свобода и избор, но и безработица и инфлация. За много семейства 90-те години са тежки.');
        const n = shell.setControls('<button class="btn primary next">Напред →</button>');
        n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
      }));
    };
    shell.score(`Отговорени: 0 от ${CLASSIFY.length}`);
    ask();
  }

  // ---------- 3. Приложи ----------
  function step3() {
    shell.step(2);
    mode('sofia');
    crowd.forEach((p) => { p.visible = false; });
    showDiagram(true);
    view(...D_VIEW, 1);
    let i = 0, mistakes = 0;
    shell.task('Устройството на Република България по Конституцията. Прочети описанието и кликни частта от схемата, за която се отнася.');
    const ask = () => { shell.setControls(`<p><b>${esc(ORG_Q[i].t)}</b></p>`); };
    clickHandler = (id) => {
      if (!id || !id.startsWith('org-') || i >= ORG_Q.length) return;
      const k = id.slice(4), q = ORG_Q[i];
      if (k !== q.id) {
        mistakes++;
        const name = ORGANS.find((o) => o.id === k).label;
        shell.msg(`Не е ${name}. ${mistakes >= 2 ? 'Подсказка: прочети етикетите над частите.' : 'Помисли пак.'}`, 'bad');
        return;
      }
      say(diagram.userData.anchors.get(k), ORG_NOTE[k], { cls: 'good wide' });
      shell.msg('Вярно!', 'good');
      i++;
      shell.score(`Устройство: ${i} от ${ORG_Q.length}`);
      if (i < ORG_Q.length) { ask(); return; }
      clickHandler = null;
      const n = shell.setControls('<button class="btn primary next">Към картата на Европа →</button>');
      n.querySelector('button').addEventListener('click', () => { clearTip(); step3b(mistakes); });
    };
    shell.score(`Устройство: 0 от ${ORG_Q.length}`);
    ask();
  }
  function paintMap(layer, year) {
    const m = members(layer, year);
    for (const [id] of map.countries) {
      if (id === '100') map.highlight(id, m.has(id) ? (layer === 'nato' ? CLR.bgNato : CLR.bgEu) : CLR.bgNo);
      else map.highlight(id, m.has(id) ? CLR[layer] : CLR.none);
    }
    mapX.euRing.visible = layer === 'eu'; mapX.natoFlag.visible = layer === 'nato';
  }
  function step3b(prevMistakes) {
    mode('map');
    stage.flyTo(...MVIEW, 1);
    let mistakes = prevMistakes, done = 0;
    const placed = [];
    shell.task('Пътят на България. Кликни стъпките по реда, в който са станали — от най-ранната към най-късната. Картата показва кои държави са в ЕС или в НАТО в тази година.');
    paintMap('eu', 1989);
    say(mapX.bgA, '<b>1989 г.</b><br>България още не е член нито на Европейските общности, нито на НАТО. Тя е във Варшавския договор, който е разпуснат през 1991 г.', { cls: 'wide' });
    const draw = () => {
      const left = SHOW_ORDER.filter((id) => !placed.includes(id));
      const c = shell.setControls(`<ol class="small placed" style="margin:0 0 6px 18px;padding:0">${placed.map((id) => { const e = STEPS_BG.find((x) => x.id === id); return `<li><b>${esc(e.when)}</b> — ${esc(e.t)}</li>`; }).join('')}</ol>
        <div class="col steps-left">${left.map((id) => `<button class="btn ev" data-e="${id}">${esc(STEPS_BG.find((x) => x.id === id).t)}</button>`).join('')}</div>`);
      c.querySelectorAll('.ev').forEach((b) => b.addEventListener('click', () => pick(b.dataset.e, b)));
    };
    const pick = (id, btn) => {
      const want = STEPS_BG[done];
      if (id !== want.id) {
        mistakes++; btn.classList.add('bad-shake');
        const e = STEPS_BG.find((x) => x.id === id);
        shell.msg(`Не още: „${e.t}“ е по-късно. ${mistakes >= 2 ? `Подсказка: търси събитие от ${want.year < 2000 ? 'края на 80-те и началото на 90-те' : 'XXI век'}.` : 'Има по-ранна стъпка.'}`, 'bad');
        return;
      }
      placed.push(id); done++;
      paintMap(want.layer, want.year);
      const note = {
        e1: 'Започва преходът. На картата: страните в Европейските общности през 1989 г.',
        e2: 'Първите свободни избори с много партии.',
        e3: 'Новата Конституция урежда демократичната държава.',
        e4: 'На 29 март 2004 г. България влиза в НАТО заедно с Румъния, Словакия, Словения, Естония, Латвия и Литва.',
        e5: 'Договорът е подписан в Люксембург.',
        e6: 'На 1 януари 2007 г. България и Румъния стават членове на Европейския съюз.',
        e7: 'Без проверки по границите с другите държави от Шенгенското пространство.',
      }[id];
      say(mapX.bgA, `<b>${esc(want.when)}</b> — ${esc(want.t)}<br>${esc(note)}`, { cls: 'good wide' });
      shell.msg('Вярно!', 'good');
      shell.score(`Подредени: ${done} от ${STEPS_BG.length}`);
      if (done < STEPS_BG.length) { draw(); return; }
      scores.push(stepScore(mistakes, 3));
      explore();
    };
    shell.score(`Подредени: 0 от ${STEPS_BG.length}`);
    draw();
    // След подреждането: плъзгач по годините с два слоя.
    function explore() {
      let layer = 'eu';
      clearTip(); shell.msg('');
      shell.task('Браво! Сега премести плъзгача и виж кога влизат другите държави. Смени слоя: Европейски съюз или НАТО.');
      const c = shell.setControls(`<div class="row"><button class="btn primary lay" data-l="eu">🇪🇺 Европейски съюз</button><button class="btn lay" data-l="nato">НАТО</button></div>
        <div class="yr-title small" style="margin-top:6px"></div>
        <input class="yr-range" type="range" min="0" max="${YEARS.length - 1}" step="1" value="${YEARS.indexOf(2025)}" style="width:100%">
        <div class="yr-legend small"></div>
        <button class="btn primary next" style="margin-top:8px">Напред →</button>`);
      const range = c.querySelector('.yr-range');
      const upd = () => {
        const y = YEARS[+range.value];
        paintMap(layer, y);
        const n = members(layer, y).size;
        c.querySelector('.yr-title').innerHTML = `<b>${y} г.</b> · ${esc(MAPNOTE[layer](y))}: ${n} от държавите на картата`;
        c.querySelector('.yr-legend').textContent = (layer === 'eu' ? '🟨 членове · 🟫 България, когато е член' : '🟦 членове · тъмно синьо — България, когато е член') + (y < 1990 ? ' · Германия: до 1990 г. само Западна Германия.' : '') + (layer === 'eu' && y >= 2020 ? ' · Великобритания напуска ЕС през 2020 г.' : '');
      };
      range.addEventListener('input', upd);
      c.querySelectorAll('.lay').forEach((b) => b.addEventListener('click', () => { layer = b.dataset.l; c.querySelectorAll('.lay').forEach((x) => x.classList.toggle('primary', x === b)); upd(); }));
      c.querySelector('.next').addEventListener('click', () => { clearTip(); step4(); });
      upd();
    }
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    clickHandler = null;
    mode('town');
    resetTown();
    townAfter2007();
    view(...P_VIEW, 1.1);
    let mistakes = 0;
    shell.task(PREDICT.ask);
    shell.score('');
    say('r-note', '<b>Около 2007 г.</b><br>Старият път е разбит, училището чака ремонт, а на границата с Румъния камионите спират за проверка.' + tag('Обобщена възстановка.'));
    const c = shell.setControls(`<div class="col opts">${PREDICT.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('.opts button').forEach((b) => b.addEventListener('click', () => {
      const o = PREDICT.opts[+b.dataset.i];
      if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      shell.msg('Вярно предсказание!', 'good');
      shell.task('<b>Ето примери какво се случва.</b> Гледай града.');
      playReveal();
      const n = shell.setControls('<button class="btn primary next">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => {
        clearTimers(); clearTip();
        const ratio = scores.reduce((s, x) => s + x, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    }));
  }
  function playReveal() {
    const steps = [
      () => { oldRoad.visible = false; hwSegs.forEach((s, i) => later(() => { s.visible = true; s.scale.z = 1; }, i * 180)); bill.visible = true; view([80, 22, 36], [86, 2, 4], 1.2); say('r-road', REVEAL[0].note); },
      () => { sch.userData.setNew(true); view([50, 18, 24], [54, 3, -6], 1.2); say('r-school', REVEAL[1].note); },
      () => { reveal.on = true; reveal.k = 0; students.forEach((p) => { p.visible = false; }); view([60, 16, 30], [62, 1, 6], 1.2); say('r-study', REVEAL[2].note); },
      () => { view([114, 16, 32], [126, 1, 6], 1.2); say('r-border', REVEAL[3].note); },
      () => { view(...P_VIEW, 1.2); say('r-note', REVEAL[4].note); },
    ];
    steps.forEach((f, i) => later(f, i * 4200));
  }

  function restart() {
    clearTimers(); clearTip();
    if (menu) menu.remove();
    students.forEach((p) => { p.visible = true; });
    step1();
  }

  shell.task('Зареждане…');
  (async () => {
    map = await createMap(stage, { url: 'data/geo/europe.json', center: [17, 48], unitsPerDeg: 0.36, focus: '100', focusColor: CLR.bgNo, showNames: false, otherColor: CLR.none, seaColor: 0xbcdcec, height: 0.08 });
    map.group.traverse((o) => { if (o.isLine) o.raycast = () => {}; });
    const extra = new THREE.Group(); scene.add(extra);
    const bgA = new THREE.Object3D(); bgA.position.copy(map.pos(25.3, 42.7, 0.3)); extra.add(bgA);
    const bgL = labelSprite('България', { size: 0.26 * (far > 1 ? 1.2 : 1), color: '#1f2a1f', bg: 'rgba(255,255,255,0.85)', border: 'rgba(0,0,0,0)' }); bgL.position.copy(map.pos(25.3, 43.4, 0.5)); extra.add(bgL);
    const br = map.addPlace('brussels', { lon: 4.35, lat: 50.85, label: 'Брюксел', color: 0x003399 }); br.scale.setScalar(0.6); extra.add(br);
    const euRing = new THREE.Group();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0x6a5000 })); s.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0); euRing.add(s); }
    euRing.position.copy(map.pos(4.35, 50.85, 1.4)); extra.add(euRing);
    const natoFlag = flagPole('nato', { pole: 1.2, w: 0.6, h: 0.4 }); natoFlag.position.copy(map.pos(4.35, 50.85, 0.1)); extra.add(natoFlag);
    pole(natoFlag);
    for (const [t, lon, lat] of [['Атлантически океан', -8, 46], ['Средиземно море', 18, 35.5], ['Черно море', 34, 43.2]]) { const l = labelSprite(t, { size: 0.17, color: '#1f5d8a', bg: 'rgba(255,255,255,0.45)', border: 'rgba(0,0,0,0)' }); l.position.copy(map.pos(lon, lat, 0.3)); extra.add(l); }
    stage.tick((dt, t) => { if (extra.visible) { euRing.rotation.z = t * 0.3; euRing.lookAt(stage.camera.position); } });
    mapX = { extra, bgA, euRing, natoFlag };
    map.group.visible = extra.visible = false;
    step1();
  })().catch((e) => shell.msg(`Сцената не се зареди: ${e.message}`, 'bad'));

  container.__demo = {
    stage, ORG_Q, STEPS_BG, CLASSIFY, REFORMS, PREDICT, reform,
    at(id) {
      let o = anchors.get(id) || null;
      if (id.startsWith('org-')) o = diagram.userData.anchors.get(id.slice(4));
      if (!o) return stage.screenOf(id);
      const v = o.getWorldPosition(new THREE.Vector3()).project(stage.camera);
      const r = stage.renderer.domElement.getBoundingClientRect();
      return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
    },
  };
  void host; void sZones;
  return {
    dispose() {
      clearTimers();
      if (menu) menu.remove();
      smoke.dispose();
      if (map) map.dispose();
      stage.dispose();
    },
  };
}
