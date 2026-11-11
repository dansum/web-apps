// 8.3.2 „Консерватизъм, либерализъм, социализъм“ — европейски индустриален град около 1848 г.
// Стъпки: опознай града и четиримата спорещи в кафенето → опит: „управлявай“ обществото — избери
// проблем и виж какво предлага всяка идея → подреди твърденията по учения и открий либералните идеи
// в преразказ от Търновската конституция → предскажи какво наистина става с исканията на работниците.
// Идеите се представят неутрално, както в учебник: никоя не се обявява за „правилна“.
import { createStage, cornerMenu, labelSprite, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { M, column, steps, statue } from './hist/architecture.js';
import { mergeStatic, tree } from './hist/medieval.js';
import { europeanHouse, streetLamp, bench, cafeTable } from './hist/city.js';
import { cloud } from './hist/bulgar.js';
import { IM, cm, mill, chimney, worker, terraceRow, church, plume, washingLine, pump } from './hist/industrial.js';

const REC = (what) => `<span class="small"><i>Възстановка: ${what}</i></span>`;

// Четирите идеи. Цветовете са само за различаване в сцената.
const IDEAS = [
  { id: 'cons', name: 'Консерватизъм', who: 'Консерваторът', color: 0x3f5f8f, css: '#3f5f8f' },
  { id: 'lib', name: 'Либерализъм', who: 'Либералът', color: 0xc8962a, css: '#a8780e' },
  { id: 'soc', name: 'Социализъм', who: 'Социалистът', color: 0xb8322a, css: '#b8322a' },
  { id: 'anar', name: 'Анархизъм', who: 'Анархистът', color: 0x26262a, css: '#26262a' },
];
const IDEA = Object.fromEntries(IDEAS.map((x) => [x.id, x]));

// Стъпка 1: какво има за разглеждане.
const SPOTS = [
  { id: 'cafe', label: 'Кафенето', icon: '☕', dist: 5.5, h: 2.4,
    note: `В градските кафенета хората четат вестници и спорят за политика. След Френската революция и с растежа на фабриките се появяват нови идеи как да се подреди обществото. Тук четирима души спорят — всеки представя една идея. ${REC('кафенето и хората са измислени, а идеите са истински')}` },
  { id: 'cons', label: 'Консерваторът', icon: '🎩', dist: 2.6, h: 0.9,
    note: `<b>Консерватизъм</b> (от латинската дума за „запазвам“). Иска да се пазят традицията, религията и монархията. Промените трябва да са бавни и внимателни, а не с революция. Англичанинът <b>Едмънд Бърк</b> пише срещу Френската революция (1790 г.) и става символ на тази идея. ${REC('човекът е измислен')}` },
  { id: 'lib', label: 'Либералът', icon: '📰', dist: 2.6, h: 0.9,
    note: `<b>Либерализъм</b> (от латинската дума за „свобода“). На първо място са свободата и правата на човека: конституция, избран парламент, разделение на властите, свобода на словото и печата, свободен пазар. Англичанинът <b>Джон Стюарт Мил</b> пише книгата „За свободата“ (1859 г.). ${REC('човекът е измислен')}` },
  { id: 'soc', label: 'Социалистът', icon: '🛠️', dist: 2.6, h: 0.9,
    note: `<b>Социализъм</b>. Ражда се от тежкия живот на работниците в индустриалните градове. Иска фабриките и земята да станат обществена собственост и богатството да се разпределя по-справедливо. <b>Карл Маркс</b> и Фридрих Енгелс издават „Манифест на комунистическата партия“ през 1848 г. ${REC('човекът е измислен')}` },
  { id: 'anar', label: 'Анархистът', icon: '🏴', dist: 2.6, h: 0.9,
    note: `<b>Анархизъм</b> (от гръцки „без власт“). Смята, че държавата потиска хората и трябва да изчезне. Хората да живеят в свободни общности, които сами се договарят. Известни анархисти са французинът <b>Пиер-Жозеф Прудон</b> и руснакът <b>Михаил Бакунин</b>. ${REC('човекът е измислен')}` },
  { id: 'factory', label: 'Фабриката', icon: '🏭', dist: 9, h: 3.5,
    note: `Във фабриките работят мъже, жени и деца — често по 12 и повече часа на ден срещу ниска заплата. Тежкият живот на работниците е един от големите въпроси на XIX век: как да се промени обществото? ${REC('фабриката не е определена сграда')}` },
  { id: 'parl', label: 'Парламентът', icon: '🏛️', dist: 9, h: 3.2,
    note: `В парламента избрани представители обсъждат и гласуват законите. През първата половина на XIX век в повечето страни право на глас имат малко хора — обикновено мъже с имот. ${REC('сградата не е определен парламент')}` },
  { id: 'kiosk', label: 'Вестникарската будка', icon: '🗞️', dist: 3.4, h: 1.4,
    note: `Вестниците и брошурите разнасят новите идеи бързо и далеч. Затова спорът кой може да пише и печата е важен: либералите искат свобода на печата и край на цензурата. ${REC('будката и вестниците са измислени')}` },
  { id: 'church', label: 'Църквата', icon: '⛪', dist: 7, h: 2.6,
    note: `Църквата е част от стария ред и от традицията. Консерваторите я смятат за опора на обществото и на морала. ${REC('църквата не е определена сграда')}` },
];

// Стъпка 2: три проблема и какво предлага всяка идея (обобщено, както в учебник).
const PROBLEMS = [
  { id: 'wage', title: 'Ниски заплати и работен ден от 14 часа',
    say: {
      cons: 'Да не рушим реда. Стопанинът, църквата и благотворителността да помагат на бедните, а промените да идват бавно и постепенно.',
      lib: 'Работникът и собственикът се договарят свободно. Държавата да не се меси много в стопанството, а законите да пазят правата на всеки.',
      soc: 'Фабриките да станат обществена собственост. Тогава печалбата ще се разпределя по-справедливо между тези, които работят.',
      anar: 'Без господари и без държава: работниците сами да се сдружат и да управляват работата си.',
    },
    check: { q: 'Кое учение предлага <b>фабриките да станат обществена собственост</b>?', ok: 'soc',
      why: { cons: 'Консерваторът иска да не се руши старият ред. Чуй пак кой говори за собствеността.', lib: 'Либералът пази свободния пазар и частната собственост.', anar: 'Анархистът говори преди всичко за това да няма държава и господари.' } } },
  { id: 'child', title: 'Деца работят във фабриката',
    say: {
      cons: 'Семейството и църквата да пазят децата. Ако трябва, законите да се променят постепенно, без да се разклаща редът.',
      lib: 'Всяко дете има право да стане свободен и образован гражданин. Затова трябва да ходи на училище.',
      soc: 'Детският труд да се забрани, а обществото да се грижи поравно за всички деца.',
      anar: 'Хората сами, без държава, да създадат свои училища и да се грижат за децата си.',
    },
    check: { q: 'Кое учение иска <b>да няма държава</b> — хората сами да се организират?', ok: 'anar',
      why: { cons: 'Консерваторът цени монархията и държавата като опора на реда.', lib: 'Либералът иска държавата да пази правата на хората.', soc: 'Социалистът иска обществото да управлява фабриките, но не говори за премахване на всяка власт.' } } },
  { id: 'vote', title: 'Кой да управлява и кой да гласува?',
    say: {
      cons: 'Да се запазят монархът, традицията и църквата. Новото да се приема бавно и внимателно.',
      lib: 'Конституция, избран парламент и разделение на властите. Правата на гражданите са записани в закона.',
      soc: 'Работниците да получат право на глас и свои партии, за да променят обществото в своя полза.',
      anar: 'Никаква власт над хората — нито крал, нито парламент. Хората сами да се договарят в свободни общности.',
    },
    check: { q: 'Кое учение иска <b>промените да са бавни и да се пазят традицията и монархията</b>?', ok: 'cons',
      why: { lib: 'Либералът иска конституция и парламент, които ограничават владетеля.', soc: 'Социалистът иска голяма промяна в полза на работниците.', anar: 'Анархистът не иска никаква власт — и монархия също.' } } },
];

// Стъпка 3: твърдения за подреждане.
const STATEMENTS = [
  { t: 'Промените трябва да са бавни. Традицията и религията пазят обществото.', idea: 'cons' },
  { t: 'Всеки човек има права: свобода на словото, на печата и на събранията.', idea: 'lib' },
  { t: 'Фабриките и земята да станат обществена собственост.', idea: 'soc' },
  { t: 'Държавата потиска хората и трябва да изчезне.', idea: 'anar' },
  { t: 'Конституция и избран парламент ограничават властта на владетеля.', idea: 'lib' },
  { t: 'Старите обичаи са проверени от времето — не ги рушете изведнъж.', idea: 'cons' },
  { t: 'Хората да живеят в свободни общности, без власт над тях.', idea: 'anar' },
  { t: 'Богатството да се разпределя по-справедливо между работниците.', idea: 'soc' },
];
const SORT_WHY = {
  cons: 'Консерваторите пазят традицията и искат бавни промени.',
  lib: 'Либералите поставят на първо място свободата и правата на човека.',
  soc: 'Социалистите искат обществена собственост и повече равенство.',
  anar: 'Анархистите искат да няма държава.',
};
// Търновската конституция: преразказ на прост език, не дословен текст.
const ARTICLES = [
  { t: 'Всички български поданици са равни пред закона.', ok: true, idea: 'Равенство пред закона' },
  { t: 'Всички фабрики и земи стават обща собственост на народа.', ok: false, why: 'Това е идея на социализма. Търновската конституция пази собствеността.' },
  { t: 'Печатът е свободен. Не се допуска цензура.', ok: true, idea: 'Свобода на печата' },
  { t: 'Хората могат да се събират мирно и без оръжие, без да искат позволение.', ok: true, idea: 'Свобода на събранията' },
  { t: 'Държавата и законите се премахват.', ok: false, why: 'Това е идея на анархизма. Конституцията е основният закон на държавата.' },
  { t: 'Правото на собственост е неприкосновено.', ok: true, idea: 'Защита на собствеността' },
];

// Стъпка 4: предскажи — реални изходи.
const PREDICT = [
  { id: 'union', q: 'Работниците искат по-високи заплати и по-кратък работен ден. <b>Какво правят те през XIX век?</b>',
    opts: [
      { t: 'Сдружават се в синдикати и заедно преговарят със собствениците или стачкуват.', ok: true },
      { t: 'Всички напускат града и се връщат по селата.', ok: false, why: 'Повечето остават — в града има работа. Помисли какво могат да направят много работници заедно.' },
      { t: 'Всеки сам се разбира със собственика и така постига всичко.', ok: false, why: 'Сам работник трудно постига нещо. Помисли какво могат да направят много хора заедно.' },
    ],
    real: 'Работниците създават <b>синдикати</b> (профсъюзи) и свои партии. Те преговарят със собствениците и стачкуват. От 1890 г. в много страни 1 май се отбелязва като ден на работниците.' },
  { id: 'hours', q: 'Работният ден е 12–14 часа. <b>Какво става с него през XIX и XX век?</b>',
    opts: [
      { t: 'Закони постепенно го скъсяват.', ok: true },
      { t: 'Става още по-дълъг и остава такъв до днес.', ok: false, why: 'Днес работният ден е много по-кратък. Помисли кой може да го промени.' },
      { t: 'Всички фабрики се забраняват.', ok: false, why: 'Фабриките остават — те са основата на новото стопанство. Помисли как може да се защитят работниците.' },
    ],
    real: 'Във Великобритания закон от 1847 г. ограничава работния ден на жените и младежите в текстилните фабрики до 10 часа. По-късно в много страни се въвежда 8-часов работен ден.' },
  { id: 'vote', q: 'В началото на XIX век гласуват малко хора. <b>Какво става с правото на глас?</b>',
    opts: [
      { t: 'Постепенно го получават все повече хора.', ok: true },
      { t: 'Изборите се забраняват завинаги.', ok: false, why: 'Не — парламентите остават и стават все по-важни. Помисли кой иска право на глас.' },
      { t: 'Още през 1850 г. в цяла Европа гласуват всички мъже и жени.', ok: false, why: 'Толкова бързо не става. Промяната е постепенна и отнема около сто години.' },
    ],
    real: 'Във Великобритания реформите от 1832, 1867 и 1884 г. дават глас на все повече мъже. Жените получават право на глас едва през XX век.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай града', 'Управлявай обществото', 'Подреди идеите', 'Предскажи'] });
  const SKY = 0xcbd6df;
  const stage = createStage(shell.stageEl, { background: SKY, camPos: [-9, 11, 15], target: [-1.5, 0, -0.5], minDistance: 0.3, maxDistance: 46, maxPolarAngle: Math.PI * 0.49, fog: { color: SKY, near: 34, far: 80 } });
  const { scene } = stage;
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const narrow = far > 1;
  const view = (pos, tgt, dur = 1) => { stage.stopFollow(); stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * far), tgt, dur); };
  const named = {};
  const anchor = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  const city = new THREE.Group(); scene.add(city);
  const add = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; city.add(o); return o; };
  const addS = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; scene.add(o); return o; };

  // ---------- земя и площад ----------
  const ground = new THREE.Mesh(new THREE.BoxGeometry(60, 0.1, 46), cm(0x8f9c6c)); ground.position.set(0, -0.06, 0); city.add(ground);
  const pave = (x, z, w, d, color = 0xffffff) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), IM('cobble', { color, rep: [Math.max(1, Math.round(w / 1.5)), Math.max(1, Math.round(d / 1.5))] })); m.position.set(x, 0.005, z); city.add(m); return m; };
  pave(0, 0.5, 15, 10.5);                 // площадът
  pave(0, -4.4, 9, 1.6, 0xe0d8c8);        // пред парламента
  pave(10.5, 1, 6, 2.2, 0xc8c0b0);        // към фабриката
  pave(0, 8.4, 34, 1.6, 0xc8c0b0);        // улица на юг
  pave(-11, 0.5, 7, 1.6, 0xc8c0b0);       // улица на запад
  // Бордюр около площада.
  for (const [x, z, w, d] of [[0, -4.78, 15.2, 0.08], [0, 5.78, 15.2, 0.08]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), cm(0xd8d0bf)); b.position.set(x, 0.03, z); city.add(b); }

  // ---------- парламентът ----------
  const parl = add(parliament(), 0, 0, -8.6);
  mergeStatic(parl);
  named.parl = parl; anchor('parlA', 0, 3.8, -6.2);
  // ---------- кафенето (на запад, лицето към площада) ----------
  const cafe = add(europeanHouse({ w: 3.0, d: 1.8, floors: 3, color: 0xe2c79a, shop: true }), -8.6, 0, 0.6, Math.PI / 2);
  mergeStatic(cafe);
  const awning = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshStandardMaterial({ map: stripeTex(), side: THREE.DoubleSide, roughness: 0.9 }));
  awning.position.set(-7.4, 0.68, 0.6); awning.rotation.set(0, Math.PI / 2, 0); awning.rotation.order = 'YXZ'; awning.rotation.x = -0.6; city.add(awning);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.24), textMat('КАФЕНЕ', { bg: '#3a2a1e', fg: '#f3e6c4', w: 512, h: 88, size: 60 }));
  sign.position.set(-7.68, 0.98, 0.6); sign.rotation.y = Math.PI / 2; city.add(sign);
  named.cafe = anchor('cafeA', -6.0, 1.2, 0.6);
  const tables = [[-5.6, 0.6], [-6.4, -1.3], [-6.4, 2.4]].map(([x, z]) => { const t = cafeTable(); t.scale.setScalar(1.6); return add(t, x, 0, z); });
  // ---------- къщи около площада ----------
  const houseAt = (x, z, ry, o) => { const h = add(europeanHouse(o), x, 0, z, ry); mergeStatic(h); return h; };
  houseAt(-8.6, -2.9, Math.PI / 2, { w: 2.8, d: 1.8, floors: 3, color: 0xd9b48a, shop: true });
  houseAt(-8.6, 4.0, Math.PI / 2, { w: 2.8, d: 1.8, floors: 2, color: 0xc9d0b0, shop: false });
  houseAt(-8.6, 6.9, Math.PI / 2, { w: 2.2, d: 1.8, floors: 3, color: 0xe6d0b8, shop: true });
  houseAt(-4.6, -8.2, 0, { w: 3.0, d: 1.8, floors: 3, color: 0xd8c0a0, shop: false });
  houseAt(5.0, -8.2, 0, { w: 3.0, d: 1.8, floors: 3, color: 0xe6dcc0, shop: false });
  for (const [x, c, f] of [[-5.4, 0xe8c98a, 3], [-2.4, 0xd9b8a0, 2], [0.6, 0xe2d6b8, 3], [3.6, 0xc9b89a, 2]]) houseAt(x, 10.6, Math.PI, { w: 2.8, d: 1.8, floors: f, color: c, shop: true });
  // ---------- фабриката (на изток) ----------
  const fac = add(mill({ w: 7, d: 3.2, floors: 3, fh: 1.2, bays: 8, cutaway: false }), 12.2, 0, -0.4, -Math.PI / 2);
  mergeStatic(fac); named.factory = fac;
  const chim = add(chimney(8), 14.6, 0, -4.4); mergeStatic(chim);
  anchor('facA', 10.4, 3.2, -0.4);
  // Порта на фабричния двор.
  const gate = new THREE.Group();
  for (const z of [-0.9, 0.9]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), IM('brick', { rep: [1, 2] })); p.position.set(0, 0.6, z); gate.add(p); const cap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.36), cm(0xd8d0bf)); cap.position.set(0, 1.24, z); gate.add(cap); }
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 5), cm(0x2a2e32)); b.position.set(0, 0.5, -0.6 + i * 0.15); gate.add(b); }
  for (const s of [-1, 1]) for (const y of [0.15, 0.9]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.6), cm(0x2a2e32)); r.position.set(0, y, s * 0.3); gate.add(r); }
  for (const s of [-1, 1]) { const wl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 2.6), IM('brick', { rep: [3, 1] })); wl.position.set(0, 0.45, s * 2.25); gate.add(wl); }
  add(gate, 8.6, 0, -0.4); mergeStatic(gate);
  // Червено знаме на фабриката (опит: социализъм) — скрито в началото.
  const redBanner = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), cm(0xb8322a, { side: THREE.DoubleSide }));
  redBanner.position.set(10.55, 2.4, -0.4); redBanner.rotation.y = -Math.PI / 2; redBanner.visible = false; scene.add(redBanner);
  // Работнически къщи зад фабриката.
  const rows = [];
  for (const [x, z, n] of [[12.5, 6.2, 6], [12.5, 9.4, 6], [12.5, -7.6, 6]]) { const r = add(terraceRow(n), x, 0, z, z < 0 ? 0 : Math.PI); rows.push(r); }
  const smokes = [];
  for (const r of rows) for (const c of r.userData.chimneys.slice(0, 2)) smokes.push(plume(stage, r, c, { n: 3, size: 0.07, rise: 1.0, drift: 0.3, color: 0x77777a, opacity: 0.45, speed: 0.22 }));
  const lines = [washingLine([10.2, 1.1, 7.6], [12.2, 1.1, 7.6]), washingLine([13.0, 1.1, 7.8], [14.8, 1.1, 7.8], [0xd8c8a8, 0xf2f0ea, 0x8a6a8a])];
  lines.forEach((l) => city.add(l));
  const pmp = add(pump(), 9.4, 0, 7.8);
  // ---------- църквата ----------
  const chur = add(church(), -8.8, 0, -7.2, 0); mergeStatic(chur); named.church = chur;
  anchor('churchA', -9.2, 3.2, -6.4);
  // ---------- будката ----------
  const kio = add(kiosk(), 4.6, 0, 3.6); mergeStatic(kio); named.kiosk = kio;
  anchor('kioskA', 4.6, 1.6, 3.6);
  const newsboy = addS(worker('boy'), 5.2, 0, 4.2, -0.6);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), cm(0xf2efe6, { side: THREE.DoubleSide })); paper.position.set(0.1, 0.5, 0.08); newsboy.add(paper);
  // ---------- улично обзавеждане, дървета ----------
  for (const [x, z] of [[-6.8, -4.2], [6.8, -4.2], [-6.8, 5.2], [6.8, 5.2], [-2.4, 5.4], [2.4, 5.4]]) { const l = add(streetLamp(), x, 0, z); l.scale.setScalar(1.6); }
  for (const [x, z, r] of [[-3.4, -3.6, 0], [3.4, -3.6, 0]]) { const b = add(bench(), x, 0, z, r); b.scale.setScalar(1.6); }
  for (const [x, z, s] of [[-5.6, -4.0, 1.6], [5.6, -4.0, 1.6], [-14, -6, 2], [-15, 4, 2.2], [16, 13, 2], [-13, 12, 2], [7.4, -6.4, 1.8], [18, -9, 2]]) add(tree(s), x, 0, z);
  // Паметник в средата на площада (обобщен, не на определен човек).
  const mon = add(statue({ h: 0.9, color: 0x6a5a3a }), 0, 0.5, 0.8);
  const ped = add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), M(0xffffff, { tex: 'limestone', rep: [1, 1] })), 0, 0.25, 0.8);
  const ped0 = add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), M(0xd9d2c4)), 0, 0.04, 0.8);
  void mon; void ped; void ped0;

  // ---------- четиримата спорещи ----------
  const debaters = {};
  const CAFE_POS = { cons: [-6.1, -0.1], lib: [-5.0, -0.1], soc: [-5.0, 1.35], anar: [-6.1, 1.35] };
  for (const I of IDEAS) {
    const p = debater(I.id);
    const [x, z] = CAFE_POS[I.id];
    p.position.set(x, 0, z);
    p.rotation.set(0, Math.atan2(-5.6 - x, 0.6 - z), 0);
    p.userData.pickId = I.id; addHitBox(p, 0.5);
    p.userData.home = p.position.clone(); p.userData.homeRot = p.rotation.y;
    scene.add(p); debaters[I.id] = p; named[I.id] = p;
    const lbl = labelSprite(I.who.replace(/ът$/, ''), { size: 0.2, border: I.css, color: I.css });
    lbl.position.set(0, 1.08, 0); p.add(lbl); stage.steadyLabel(lbl, 8); p.userData.lbl = lbl;
  }
  // Сервитьор и други посетители.
  const waiter = addS(worker('master'), -6.6, 0, -1.8);
  const guests = [addS(worker('lady'), -6.9, 0, 2.6, Math.PI / 2), addS(worker('man'), -5.9, 0, 2.6, -Math.PI / 2)];

  // ---------- хора по площада (работниците) ----------
  const CROWD_HOME = [[-1.6, 3.6], [-0.8, 4.4], [0.2, 3.8], [1.2, 4.5], [2.0, 3.4], [-2.4, 4.8], [0.8, 2.7], [-0.4, 5.1]];
  const crowd = CROWD_HOME.map(([x, z], i) => { const p = addS(worker(['man', 'woman', 'man', 'boy', 'woman', 'man', 'girl', 'man'][i]), x, 0, z); p.userData.home = new THREE.Vector3(x, 0, z); p.userData.target = null; p.userData.ph = i * 1.3; return p; });
  const strollers = [[-3, -2.2, 'lady'], [3.2, -1.6, 'master'], [6.2, 0.4, 'man'], [-2.4, 7.6, 'woman'], [3.6, 8.2, 'man'], [10.6, 4.6, 'woman']].map(([x, z, k]) => addS(worker(k), x, 0, z));
  strollers.forEach((p, i) => { p.userData.home = p.position.clone(); p.userData.ph = i * 1.9; });

  // Гълъби на площада.
  const birds = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cm(0x8a8f99)); body.scale.set(1.4, 0.9, 1); body.position.y = 0.05; b.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), cm(0x5a6070)); head.position.set(0.06, 0.09, 0); b.add(head);
    b.position.set(-2 + i * 0.6, 0, -1.6 + (i % 3) * 0.5); b.rotation.y = i * 1.3; scene.add(b); birds.push(b);
  }
  // Облаци.
  const clouds = [[-14, 11, -16], [6, 12, -20], [18, 10, -10], [-4, 13, -26]].map(([x, y, z], i) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(1.6 + (i % 2) * 0.6); scene.add(c); return c; });
  // Дим.
  plume(stage, chim, chim.userData.top, { n: 9, size: 0.22, rise: 3.2, drift: 1.4, color: 0x3e3e42, opacity: 0.6, speed: 0.11 });
  for (const h of [cafe]) smokes.push(plume(stage, h, h.userData.chimney, { n: 3, size: 0.06, rise: 0.9, drift: 0.3, color: 0x88888a, opacity: 0.4, speed: 0.2 }));

  // ---------- места на идеите (опит) ----------
  const DEST = {
    cons: { at: [-8.8, -5.6], view: [[-4.2, 6.4, 3.8], [-6.6, 0.8, -4.0]] },
    lib: { at: [0, -4.6], view: [[2.6, 5.2, 4.2], [0, 1.2, -4.6]] },
    soc: { at: [8.0, -0.4], view: [[3.4, 4.6, 4.4], [8.2, 1.2, -0.6]] },
    anar: { at: [1.8, 1.6], view: [[-2.2, 5.0, 8.2], [1.4, 0.4, 1.4]] },
  };
  for (const I of IDEAS) anchor('dest-' + I.id, DEST[I.id].at[0], I.id === 'cons' ? 2.2 : 1.6, DEST[I.id].at[1]);
  const rings = {};
  for (const I of IDEAS) { const r = zoneRing(I.color, 1.25); r.position.set(DEST[I.id].at[0], 0, DEST[I.id].at[1]); r.visible = false; scene.add(r); rings[I.id] = r; }
  // Черно знаме в кръга на анархистите.
  const blackFlag = new THREE.Group();
  { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), cm(0x6b4a2c)); pole.position.y = 0.8; blackFlag.add(pole); const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), cm(0x1c1c1e, { side: THREE.DoubleSide })); cl.position.set(0.3, 1.38, 0); blackFlag.add(cl); blackFlag.userData.cloth = cl; }
  blackFlag.position.set(1.8, 0, 1.6); blackFlag.visible = false; scene.add(blackFlag);
  // Камбанен звън: малка камбана пред църквата се люлее.
  const bellG = new THREE.Group();
  { const fr = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), cm(0x5a4030)); fr.position.y = 1.3; bellG.add(fr); for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.05), cm(0x5a4030)); p.position.set(s * 0.33, 0.65, 0); bellG.add(p); } }
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.15, 0.22, 12, 1, true), cm(0xc9a640, { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide })); bell.geometry.translate(0, -0.11, 0); bell.position.y = 1.28; bellG.add(bell);
  bellG.position.set(-7.0, 0, -5.2); scene.add(bellG);
  let bellOn = 0;

  // ---------- стъпка 4: синдикат, работен ден, избори ----------
  const meeting = new THREE.Group(); scene.add(meeting);
  {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.4), IM('planks')); crate.position.set(7.6, 0.125, 2.0); meeting.add(crate);
    const speaker = worker('man'); speaker.position.set(7.6, 0.25, 2.0); speaker.rotation.y = -Math.PI / 2; meeting.add(speaker);
    for (const x of [7.2, 8.4]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), IM('planks')); pole.position.set(x, 0.75, 3.6); meeting.add(pole); }
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.4), textMat('СИНДИКАТ', { bg: '#7a2a24', fg: '#f6efe0', w: 512, h: 200, size: 84 })); cloth.position.set(7.8, 1.3, 3.6); meeting.add(cloth);
  }
  meeting.visible = false;
  const hoursSign = labelSprite('Работният ден е по-кратък', { size: 0.3, border: '#2fb36b' }); hoursSign.position.set(8.6, 1.75, -0.4); hoursSign.visible = false; scene.add(hoursSign);
  const ballot = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.4), IM('planks', { color: 0xc8a070 })); b.position.y = 0.55; ballot.add(b); const slot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.01, 0.04), cm(0x1a1a1a)); slot.position.y = 0.78; ballot.add(slot); const tbl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.5), IM('planks')); tbl.position.y = 0.3; ballot.add(tbl); for (const [x, z] of [[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), IM('planks')); l.position.set(x, 0.15, z); ballot.add(l); } }
  ballot.position.set(0, 0, -4.0); ballot.visible = false; scene.add(ballot);
  const voteLbl = labelSprite('Избори', { size: 0.26, border: '#2fb36b' }); voteLbl.position.set(0, 1.3, -4.0); voteLbl.visible = false; scene.add(voteLbl);

  // ---------- стъпка 3: зони и карти ----------
  const ZONE_AT = narrow
    ? { cons: [-1.9, 2.5], lib: [1.9, 2.5], soc: [-1.9, 6.5], anar: [1.9, 6.5] }
    : { cons: [-4.6, -0.9], lib: [-1.6, -2.2], soc: [1.6, -2.2], anar: [4.6, -0.9] };
  const CARD_HOME = narrow ? [0, 0.7, 4.5] : [0, 0.7, 3.0];
  const zones = {};
  for (const I of IDEAS) {
    const z = zoneRing(I.color, narrow ? 1.25 : 1.3);
    const [x, zz] = ZONE_AT[I.id]; z.position.set(x, 0, zz);
    z.userData.disc.userData.pickId = 'z-' + I.id;
    const l = labelSprite(I.name, { size: narrow ? 0.34 : 0.3, border: I.css, color: I.css }); l.position.set(0, 0.25, narrow ? 0.85 : 0.95); z.add(l); z.userData.lbl = l;
    z.visible = false; scene.add(z); zones[I.id] = z;
  }
  const card = new THREE.Group();
  const cardFace = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.19), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  cardFace.rotation.x = -1.0; card.add(cardFace);
  const cardBack = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.29, 0.04), cm(0x8a6a4a)); cardBack.rotation.x = -1.0; cardBack.position.set(0, -0.84 * 0.03, -0.54 * 0.03); card.add(cardBack);
  card.userData.dragId = 'card';
  addHitBox(card, 0.8);
  card.position.set(...CARD_HOME); card.visible = false; scene.add(card);
  const setCardText = (t) => { const old = cardFace.material; cardFace.material = cardMat(t); if (old.map) old.map.dispose(); old.dispose(); };

  // Търновската конституция върху пюпитър пред парламента.
  const lectern = new THREE.Group();
  {
    const wood = IM('planks', { color: 0x9a7048 });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.14), wood); post.position.y = 0.4; lectern.add(post);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.4), wood); foot.position.y = 0.025; lectern.add(foot);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6), wood); top.position.y = 0.84; top.rotation.x = 0.35; lectern.add(top);
    const book = new THREE.Group(); book.position.set(0, 0.9, 0.02); book.rotation.x = 0.35 - Math.PI / 2;
    for (const s of [-1, 1]) {
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.52), bookPage(s < 0 ? 'title' : 'text'));
      pg.position.set(s * 0.205, 0, 0.012); pg.rotation.y = -s * 0.08; book.add(pg);
    }
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.56, 0.02), cm(0x6a2a20)); book.add(cover);
    book.rotation.x = -0.35 - 0.2; book.position.set(0, 0.92, 0.0);
    // Страниците гледат нагоре към камерата.
    book.rotation.set(-Math.PI / 2 + 0.35, 0, 0);
    lectern.add(book); lectern.userData.book = book;
  }
  lectern.position.set(0, 0, -3.4); lectern.userData.pickId = 'book'; lectern.visible = false; scene.add(lectern); named.book = lectern;
  const artTags = [];

  // ---------- кликаемо ----------
  for (const [id, o] of [['factory', fac], ['parl', parl], ['church', chur], ['kiosk', kio], ['cafe', cafe]]) { o.userData.pickId = id; addHitBox(o, 0.6); }
  mergeStatic(city, [...lines.flatMap((l) => l.userData.items), pmp.userData.handle]);

  // ---------- оживяване ----------
  const v3 = new THREE.Vector3();
  let crowdSpeed = 1.1;
  stage.tick((dtRaw, t) => {
    const dt = Math.min(dtRaw, 0.1);
    // Спорещите жестикулират.
    IDEAS.forEach((I, i) => { const p = debaters[I.id]; if (!p.userData.moving) p.rotation.z = Math.sin(t * 1.6 + i * 1.7) * 0.05; });
    // Хората от тълпата: вървят към целта си или стоят и леко се поклащат.
    for (const p of crowd) {
      const tg = p.userData.target;
      if (tg) {
        v3.set(tg.x - p.position.x, 0, tg.z - p.position.z);
        const l = v3.length();
        if (l > 0.05) { const s = Math.min(l, dt * crowdSpeed); p.position.x += (v3.x / l) * s; p.position.z += (v3.z / l) * s; p.rotation.y = Math.atan2(v3.x, v3.z); p.position.y = Math.abs(Math.sin(t * 7 + p.userData.ph)) * 0.03; }
        else { p.position.y = 0; if (tg.face !== undefined) p.rotation.y = tg.face; }
      } else { p.position.y = 0; p.rotation.z = Math.sin(t * 1.2 + p.userData.ph) * 0.03; }
    }
    // Разхождащи се граждани.
    strollers.forEach((p) => { const a = t * 0.25 + p.userData.ph, h = p.userData.home; const nx = h.x + Math.cos(a) * 0.9, nz = h.z + Math.sin(a * 0.8) * 0.5; p.rotation.y = Math.atan2(nx - p.position.x, nz - p.position.z); p.position.x = nx; p.position.z = nz; p.position.y = Math.abs(Math.sin(t * 6 + p.userData.ph)) * 0.03; });
    waiter.position.x = -6.4 + Math.sin(t * 0.4) * 0.9; waiter.rotation.y = Math.cos(t * 0.4) > 0 ? Math.PI / 2 : -Math.PI / 2; waiter.position.y = Math.abs(Math.sin(t * 6)) * 0.02;
    guests.forEach((g, i) => { g.rotation.z = Math.sin(t * 1.3 + i) * 0.04; });
    newsboy.rotation.y = -0.6 + Math.sin(t * 1.5) * 0.4; paper.position.y = 0.5 + Math.abs(Math.sin(t * 3)) * 0.12;
    birds.forEach((b, i) => { const k = (t * 0.7 + i * 0.37) % 1; b.position.y = k < 0.15 ? Math.sin(k / 0.15 * Math.PI) * 0.06 : 0; if (k < 0.01) b.rotation.y += 0.8; b.position.x += Math.cos(b.rotation.y) * dt * 0.05; b.position.z -= Math.sin(b.rotation.y) * dt * 0.05; if (Math.abs(b.position.x) > 4) b.rotation.y += Math.PI; if (b.position.z < -3 || b.position.z > 0.2) b.rotation.y += Math.PI; });
    clouds.forEach((c, i) => { c.position.x += dt * (0.2 + i * 0.05); if (c.position.x > 30) c.position.x = -30; });
    lines.forEach((l) => l.userData.items.forEach((c, i) => { c.rotation.x = Math.sin(t * 1.6 + i) * 0.15; }));
    pmp.userData.handle.rotation.x = 0.4 + Math.sin(t * 2.2) * 0.35;
    // Ефекти на идеите.
    if (bellOn > 0) { bellOn -= dt; bell.rotation.z = Math.sin(t * 5) * 0.5 * Math.min(1, bellOn); } else bell.rotation.z *= 0.95;
    for (const I of IDEAS) { const r = rings[I.id]; if (r.visible) { const s = 1 + Math.sin(t * 3) * 0.06; r.scale.set(s, 1, s); } }
    redBanner.rotation.x = Math.sin(t * 2) * 0.05;
    blackFlag.userData.cloth.rotation.y = Math.sin(t * 2.4) * 0.3;
    if (card.visible && !card.userData.dragging) card.position.y = CARD_HOME[1] + Math.sin(t * 2) * 0.04;
  });

  // ---------- общи помощници ----------
  let tip = null;
  const say = (a, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(a, html, { lift: 0.4, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let stopDrag = null, stopClick = null;
  const choice = (opts) => `<div class="col" style="display:flex;flex-direction:column;gap:6px">${opts.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`;
  function ask(html, opts, onRight, onWrong) {
    shell.task(html);
    const c = shell.setControls(choice(opts));
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = opts[+b.dataset.i];
      if (!p.ok) { b.disabled = true; shell.msg(p.why, 'bad'); onWrong(); return; }
      onRight();
    }));
  }
  const next = (label, fn) => { const n = shell.setControls(`<button class="btn primary">${label}</button>`); n.querySelector('button').addEventListener('click', fn); };
  function sendCrowd(fn) { crowd.forEach((p, i) => { p.userData.target = fn(p, i); }); }
  const crowdHome = () => sendCrowd((p) => ({ x: p.userData.home.x, z: p.userData.home.z, face: Math.PI }));
  function clusterAt(x, z, { r = 0.9, face = null } = {}) {
    sendCrowd((p, i) => { const a = (i / crowd.length) * Math.PI * 2; const tx = x + Math.cos(a) * r * (0.7 + (i % 2) * 0.3), tz = z + Math.sin(a) * r * (0.7 + (i % 2) * 0.3); return { x: tx, z: tz, face: face ?? Math.atan2(x - tx, z - tz) }; });
  }
  function clearEffects() {
    for (const I of IDEAS) rings[I.id].visible = false;
    redBanner.visible = false; blackFlag.visible = false; bellOn = 0;
  }
  function showIdea(id) {
    clearEffects();
    rings[id].visible = true;
    const [x, z] = DEST[id].at;
    if (id === 'cons') { bellOn = 6; clusterAt(x, z + 0.6, { r: 1.0, face: Math.PI }); }
    if (id === 'lib') sendCrowd((p, i) => ({ x: -1.6 + (i % 4) * 1.05, z: -4.4 + Math.floor(i / 4) * 0.7, face: Math.PI }));
    if (id === 'soc') { redBanner.visible = true; clusterAt(x - 0.3, z, { r: 1.0 }); }
    if (id === 'anar') { blackFlag.visible = true; clusterAt(x, z, { r: 1.05 }); }
  }

  // ---------- 1. Опознай ----------
  let phase = 1;
  const seen = new Set();
  const menu = cornerMenu(stage, { title: 'Разгледай', items: SPOTS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })), onSelect: (id) => explore(id) });
  const objOf = (id) => ({ cafe: named.cafe, cons: debaters.cons, lib: debaters.lib, soc: debaters.soc, anar: debaters.anar, factory: named.facA, parl: named.parlA, kiosk: named.kioskA, church: named.churchA })[id];
  const bubbleAt = (id) => ({ cafe: named.cafe, factory: named.facA, parl: named.parlA, kiosk: named.kioskA, church: named.churchA })[id] || debaters[id];
  const DEB_VIEW = { cons: [2.0, 1.5, -1.8], lib: [2.3, 1.4, -1.1], soc: [2.3, 1.4, 1.3], anar: [0.7, 1.5, 2.5] };
  function explore(id) {
    if (phase !== 1) return;
    const s = SPOTS.find((x) => x.id === id); if (!s) return;
    const o = objOf(id);
    if (DEB_VIEW[id]) {
      const p = debaters[id].position, [dx, dy, dz] = DEB_VIEW[id];
      view([p.x + dx, dy, p.z + dz], [p.x, 0.6, p.z]);
    } else stage.focusOn(o, { dist: s.dist * far, height: s.h * (narrow ? 1.3 : 1), lift: 0.3, keepFollow: false });
    menu.setActive(id);
    setTimeout(() => { if (phase === 1) say(bubbleAt(id), `<b>${esc(s.label)}</b><br>${s.note}`, { cls: 'wide', lift: IDEA[id] ? 0.85 : 0.3 }); }, 350);
    seen.add(id); menu.mark(id);
    shell.score(`Разгледани: ${seen.size} от ${SPOTS.length}`);
    if (seen.size === SPOTS.length) next('Напред →', () => { clearTip(); step2(); });
  }
  function step1() {
    phase = 1;
    shell.step(0);
    scores.length = 0;
    seen.clear();
    menu.setItems(SPOTS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })));
    menu.show(true);
    shell.task('Европейски индустриален град около 1848 г. В кафенето четирима души спорят как да се подреди обществото. Разгледай всичко от менюто или щракни върху хората и сградите.');
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${SPOTS.length}`);
    view([-9, 11, 15], [-1.5, 0, -0.5], 1.2);
  }
  stage.onClick((hit) => {
    if (!hit) return;
    const id = hit.root.userData.pickId;
    if (phase === 1 && SPOTS.some((s) => s.id === id)) explore(id);
    else if (phase === 2 && IDEA[id] && onPickIdea) onPickIdea(id);
  });

  // ---------- 2. Управлявай обществото ----------
  let onPickIdea = null;
  function step2() {
    phase = 2;
    shell.step(1);
    shell.score('');
    menu.show(false);
    clearTip();
    let mistakes = 0, k = 0;
    crowdSpeed = 2.6;
    function problem() {
      const P = PROBLEMS[k];
      const heard = new Set();
      clearEffects(); crowdHome(); clearTip();
      view([-3, 12, 15], [0, 0, -0.5], 1.2);
      const draw = () => {
        shell.task(`<span class="small">Проблем ${k + 1} от ${PROBLEMS.length}</span><br><b>${esc(P.title)}</b><br>Ти управляваш града. Чуй какво предлага всяка идея: натисни бутон или щракни върху човека в кафенето. Гледай къде отиват хората.`);
        const c = shell.setControls(`<div class="col" style="display:flex;flex-direction:column;gap:6px">${IDEAS.map((I) => `<button class="btn" data-id="${I.id}" style="border-left:6px solid ${I.css}">${esc(I.name)}${heard.has(I.id) ? ' ✓' : ''}</button>`).join('')}</div>`);
        c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => pick(b.dataset.id)));
        shell.score(`Чути идеи: ${heard.size} от 4`);
        if (heard.size === 4) {
          const n = document.createElement('button'); n.className = 'btn primary'; n.textContent = 'Провери се →';
          n.addEventListener('click', check); c.appendChild(n);
        }
      };
      function pick(id) {
        heard.add(id);
        showIdea(id);
        const D = DEST[id];
        view(D.view[0], D.view[1], 1.1);
        say(named['dest-' + id], `<b>${esc(IDEA[id].who)}:</b> „${esc(P.say[id])}“`, { cls: 'wide', lift: 0.2 });
        draw();
      }
      onPickIdea = pick;
      function check() {
        onPickIdea = null;
        clearTip(); clearEffects(); crowdHome();
        view([-3, 12, 15], [0, 0, -0.5], 1);
        const opts = IDEAS.map((I) => ({ t: I.name, ok: I.id === P.check.ok, why: P.check.why[I.id] }));
        ask(`<span class="small">Проблем ${k + 1} от ${PROBLEMS.length}</span><br>${P.check.q}`, opts, () => {
          shell.msg('Вярно!', 'good');
          showIdea(P.check.ok);
          say(named['dest-' + P.check.ok], `<b>${esc(IDEA[P.check.ok].name)}</b>`, { cls: 'good', lift: 0.2 });
          k++;
          if (k < PROBLEMS.length) next('Следващ проблем →', problem);
          else {
            scores.push(stepScore(mistakes, 3));
            say(named.cafe, 'Всяка идея дава различен отговор на един и същ въпрос. Историците ги описват, без да казват коя е „правилна“ — това решават хората, когато гласуват и спорят.', { cls: 'good wide', lift: 0.6 });
            next('Напред →', () => { clearTip(); step3(); });
          }
        }, () => { mistakes++; });
      }
      draw();
    }
    problem();
  }

  // ---------- 3. Подреди идеите ----------
  function step3() {
    phase = 3;
    shell.step(2);
    clearEffects(); crowdHome(); clearTip();
    crowdSpeed = 1.1;
    onPickIdea = null;
    let mistakes = 0, idx = 0;
    const tries = {};
    const counts = { cons: 0, lib: 0, soc: 0, anar: 0 };
    // Спорещите застават зад своята зона.
    for (const I of IDEAS) {
      const z = zones[I.id]; z.visible = true;
      const p = debaters[I.id]; const [x, zz] = ZONE_AT[I.id];
      p.position.set(x, 0, zz - (narrow ? 0.95 : 1.0)); p.rotation.set(0, 0, 0);
    }
    crowd.forEach((p) => { p.visible = false; });
    if (narrow) stage.flyTo([0, 8.8, 13.6], [0, 0.2, 4.6], 1.1); else view([0, 6.8, 9.0], [0, 0.2, 0.2], 1.1);
    const taskText = () => shell.task(`Завлечи картата в кръга на учението, към което принадлежи. <span class="small">(Можеш и да щракнеш върху кръга.)</span><br><b>„${esc(STATEMENTS[idx].t)}“</b>`);
    shell.setControls('');
    const showCard = () => { taskText(); setCardText(STATEMENTS[idx].t); card.position.set(...CARD_HOME); card.visible = true; shell.score(`Твърдения: ${idx} от ${STATEMENTS.length}`); };
    showCard();
    function drop(zoneId) {
      const S = STATEMENTS[idx];
      if (zoneId === S.idea) {
        counts[zoneId]++;
        const z = zones[zoneId];
        const l = labelSprite(`${IDEA[zoneId].name} · ${counts[zoneId]}`, { size: narrow ? 0.34 : 0.3, border: IDEA[zoneId].css, color: IDEA[zoneId].css });
        const old = z.userData.lbl; l.position.copy(old.position); z.remove(old); old.material.map.dispose(); old.material.dispose(); z.add(l); z.userData.lbl = l;
        shell.msg(`Вярно! ${SORT_WHY[zoneId]}`, 'good');
        idx++;
        if (idx < STATEMENTS.length) showCard();
        else {
          card.visible = false;
          shell.score(`Твърдения: ${idx} от ${STATEMENTS.length}`);
          if (stopDrag) { stopDrag(); stopDrag = null; }
          if (stopClick) { stopClick(); stopClick = null; }
          constitution();
        }
      } else {
        mistakes++;
        tries[idx] = (tries[idx] || 0) + 1;
        card.position.set(...CARD_HOME);
        shell.msg(tries[idx] >= 2 ? `Не е тук. Подсказка: ${SORT_WHY[S.idea]}` : `Не е ${IDEA[zoneId].name.toLowerCase()}. Прочети пак твърдението.`, 'bad');
      }
    }
    const zoneNear = (pos) => { let best = null, bd = 1e9; for (const I of IDEAS) { const z = zones[I.id]; const d = Math.hypot(z.position.x - pos.x, z.position.z - pos.z); if (d < bd) { bd = d; best = I.id; } } return bd < (narrow ? 1.5 : 1.6) ? best : null; };
    stopDrag = stage.enableDrag({
      planeY: CARD_HOME[1], lift: 0,
      onStart() { card.userData.dragging = true; },
      onDrop(obj) { card.userData.dragging = false; const z = zoneNear(obj.position); if (z) drop(z); else card.position.set(...CARD_HOME); },
    });
    stopClick = stage.onClick((hit) => { if (phase !== 3 || !hit || !card.visible) return; const id = hit.root.userData.pickId; if (id && id.startsWith('z-')) drop(id.slice(2)); });

    // Втора част: Търновската конституция.
    function constitution() {
      for (const I of IDEAS) zones[I.id].visible = false;
      restoreDebaters();
      crowd.forEach((p) => { p.visible = true; });
      lectern.visible = true;
      view([1.6, 2.6, -0.4], [0, 0.9, -3.4], 1.1);
      say(lectern, 'Идеите на либерализма стигат и до България. <b>Търновската конституция</b> е приета на 16 април 1879 г. в Търново. <span class="small">Изреченията в задачата са преразказ на прост език, не дословен текст.</span>', { cls: 'wide', lift: 1.1 });
      let found = 0;
      const done = new Set();
      shell.task('Кои изречения са <b>преразказ от Търновската конституция</b> и показват идеи на либерализма? Избери всички такива.');
      const c = shell.setControls(choice(ARTICLES.map((a) => ({ t: a.t }))));
      shell.score(`Либерални идеи: 0 от ${ARTICLES.filter((a) => a.ok).length}`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const i = +b.dataset.i, A = ARTICLES[i];
        if (done.has(i)) return;
        done.add(i); b.disabled = true;
        if (!A.ok) { mistakes++; shell.msg(A.why, 'bad'); return; }
        found++;
        b.textContent = `✓ ${A.t}`;
        const tag = labelSprite(A.idea, { size: narrow ? 0.17 : 0.13, border: IDEA.lib.css, color: '#5a4010' });
        tag.position.set(narrow ? -0.75 : -0.95, 0.15 + found * 0.18, -3.2); scene.add(tag); artTags.push(tag);
        shell.msg(`Вярно — ${A.idea.toLowerCase()} е либерална идея.`, 'good');
        shell.score(`Либерални идеи: ${found} от ${ARTICLES.filter((a) => a.ok).length}`);
        if (found === ARTICLES.filter((a) => a.ok).length) {
          scores.push(stepScore(mistakes, 4));
          say(lectern, '<b>Точно така.</b> Търновската конституция е една от най-демократичните за времето си: равенство пред закона, свобода на печата и на събранията, защитена собственост, разделение на властите.', { cls: 'good wide', lift: 1.1 });
          next('Напред →', () => { clearTip(); step4(); });
        }
      }));
    }
  }
  function restoreDebaters() { for (const I of IDEAS) { const p = debaters[I.id]; p.position.copy(p.userData.home); p.rotation.set(0, p.userData.homeRot, 0); } }

  // ---------- 4. Предскажи ----------
  function step4() {
    phase = 4;
    shell.step(3);
    shell.score('');
    lectern.visible = false;
    artTags.forEach((t) => t.visible = false);
    let mistakes = 0, k = 0;
    const where = { union: [[4.4, 3.4, 7.8], [7.4, 0.7, 2.4]], hours: [[3.2, 4.8, 5.4], [9.4, 1.4, 0.4]], vote: [[2.8, 4.4, 2.6], [0, 0.9, -4.2]] };
    const reveal = {
      union() { meeting.visible = true; clusterAt(7.6, 2.2, { r: 0.9 }); return meeting.children[1]; },
      hours() { hoursSign.visible = true; sendCrowd((p, i) => ({ x: 8.4 - i * 0.55, z: 2.2 + (i % 2) * 0.5, face: -Math.PI / 2 })); return named.facA; },
      vote() { ballot.visible = true; voteLbl.visible = true; sendCrowd((p, i) => ({ x: 0, z: -3.3 + i * 0.5, face: Math.PI })); return ballot; },
    };
    function ask4() {
      const P = PREDICT[k];
      clearTip(); meeting.visible = false; hoursSign.visible = false; ballot.visible = false; voteLbl.visible = false; crowdSpeed = 2.6;
      crowdHome();
      view(where[P.id][0], where[P.id][1]);
      ask(`<span class="small">Въпрос ${k + 1} от ${PREDICT.length}</span><br>${P.q}`, P.opts, () => {
        const a = reveal[P.id]();
        shell.msg('Вярно предсказание! Виж какво наистина става.', 'good');
        setTimeout(() => { if (phase === 4) say(a, `<b>Така става.</b> ${P.real}`, { cls: 'good wide', lift: P.id === 'vote' ? 1.0 : 0.6 }); }, 900);
        k++;
        if (k < PREDICT.length) next('Следващ въпрос →', ask4);
        else next('Виж резултата', () => {
          clearTip();
          scores.push(stepScore(mistakes, 3));
          shell.finish(scores.reduce((s, x) => s + x, 0) / scores.length, onComplete, restart);
        });
      }, () => { mistakes++; });
    }
    ask4();
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    if (stopClick) { stopClick(); stopClick = null; }
    onPickIdea = null;
    clearTip(); clearEffects();
    meeting.visible = false; hoursSign.visible = false; ballot.visible = false; voteLbl.visible = false; crowdSpeed = 1.1;
    lectern.visible = false; artTags.forEach((t) => { scene.remove(t); t.material.map.dispose(); t.material.dispose(); }); artTags.length = 0;
    card.visible = false;
    for (const I of IDEAS) { const z = zones[I.id]; z.visible = false; const l = labelSprite(I.name, { size: narrow ? 0.34 : 0.3, border: I.css, color: I.css }); const old = z.userData.lbl; l.position.copy(old.position); z.remove(old); z.add(l); z.userData.lbl = l; }
    restoreDebaters();
    crowd.forEach((p) => { p.visible = true; p.position.copy(p.userData.home); p.userData.target = null; p.rotation.set(0, Math.PI, 0); });
    step1();
  }

  step1();
  container.__demo = { stage, zones, card, get phase() { return phase; } };
  return { dispose() { if (stopDrag) stopDrag(); if (stopClick) stopClick(); menu.remove(); stage.dispose(); } };
}

// ---------- модели ----------
// Човек от кафенето. Всеки носи белег на своята идея: шал в цвят и предмет.
function debater(id) {
  const I = IDEA[id];
  const p = worker(id === 'cons' || id === 'lib' ? 'master' : 'man');
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.025, 6, 14), cm(I.color)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.5; p.add(scarf);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.02), cm(I.color)); tail.position.set(0.04, 0.4, 0.1); p.add(tail);
  if (id === 'cons') { // бастун и сива коса
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 5), cm(0x2a1a10)); cane.position.set(0.16, 0.25, 0.05); p.add(cane);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), cm(0xc9a640, { metalness: 0.6, roughness: 0.35 })); knob.position.set(0.16, 0.5, 0.05); p.add(knob);
  }
  if (id === 'lib') { // вестник
    const np = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), cm(0xf2efe6, { side: THREE.DoubleSide })); np.position.set(0.12, 0.38, 0.12); np.rotation.set(-0.3, -0.5, 0); p.add(np);
  }
  if (id === 'soc') { // книжка с червена корица
    const bk = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.03), cm(0xb8322a)); bk.position.set(-0.14, 0.36, 0.08); p.add(bk);
  }
  if (id === 'anar') { // широкопола шапка
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.015, 14), cm(0x1c1c1e)); brim.position.y = 0.665; p.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.08, 12), cm(0x1c1c1e)); crown.position.y = 0.71; p.add(crown);
  }
  return p;
}

// Парламент в неокласически стил: подиум, две крила с прозорци, портик с коринтски колони, фронтон, купол.
// Лицето гледа по +z.
function parliament() {
  const g = new THREE.Group();
  const W = 8.4, D = 3.0, H = 2.6, Y0 = 0.3;
  const stone = M(0xffffff, { tex: 'limestone', rep: [7, 2] });
  const trim = M(0xf2ece0, { rough: 0.6 });
  const copper = M(0x6f9a8a, { rough: 0.55, metal: 0.2 });
  const glass = M(0x2f4252, { rough: 0.25 });
  const B = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  B(W + 0.4, Y0, D + 0.4, M(0xffffff, { tex: 'stone', rep: [8, 0.5] }), 0, Y0 / 2, 0);
  B(W, H, D, stone, 0, Y0 + H / 2, 0);
  B(W + 0.06, 0.07, D + 0.06, trim, 0, Y0 + H * 0.45, 0);
  B(W + 0.24, 0.16, D + 0.24, trim, 0, Y0 + H + 0.08, 0);
  B(W - 0.2, 0.3, D - 0.2, stone, 0, Y0 + H + 0.31, 0);
  B(W - 0.1, 0.06, D - 0.1, trim, 0, Y0 + H + 0.49, 0);
  // Пиластри и прозорци по фасадата (без средата, където е портикът).
  const fz = D / 2;
  for (let i = 0; i < 12; i++) {
    const x = -W / 2 + 0.35 + i * (W - 0.7) / 11;
    if (Math.abs(x) < 2.1) continue;
    B(0.1, H - 0.1, 0.05, trim, x - 0.3, Y0 + H / 2, fz + 0.02);
    // долен прозорец
    B(0.26, 0.5, 0.03, glass, x, Y0 + 0.55, fz + 0.015); B(0.34, 0.05, 0.08, trim, x, Y0 + 0.27, fz + 0.04); B(0.32, 0.06, 0.05, trim, x, Y0 + 0.84, fz + 0.03);
    // горен прозорец с фронтонче
    B(0.26, 0.6, 0.03, glass, x, Y0 + H * 0.45 + 0.55, fz + 0.015); B(0.34, 0.05, 0.08, trim, x, Y0 + H * 0.45 + 0.22, fz + 0.04);
    const ped = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.12, 3), trim); ped.rotation.z = 0; ped.scale.set(1, 1, 0.25); ped.rotation.y = Math.PI / 6; ped.position.set(x, Y0 + H * 0.45 + 0.94, fz + 0.04); g.add(ped);
  }
  // Задна и странични стени: само прозорци.
  for (let i = 0; i < 10; i++) { const x = -W / 2 + 0.5 + i * (W - 1) / 9; for (const y of [0.55, H * 0.45 + 0.55]) B(0.26, 0.5, 0.03, glass, x, Y0 + y, -fz - 0.015); }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = -D / 2 + 0.45 + i * (D - 0.9) / 3; for (const y of [0.55, H * 0.45 + 0.55]) B(0.03, 0.5, 0.26, glass, s * (W / 2 + 0.015), Y0 + y, z); }
  // Портик.
  const PZ = fz + 0.85;
  const st = steps(4.6, 2.2, { n: 5, h: Y0 / 5, inset: 0.12, color: 0xece5d6 }); st.position.set(0, 0, PZ + 0.1); g.add(st);
  const ch = H - 0.05;
  for (let i = 0; i < 6; i++) { const c = column('corinthian', { h: ch, r: 0.12, color: 0xf2ece0 }); c.position.set(-1.75 + i * 0.7, Y0, PZ + 0.5); g.add(c); }
  B(4.3, 0.26, 1.5, trim, 0, Y0 + ch + 0.13, PZ - 0.05);
  B(4.3, 0.06, 0.06, M(0xc9a640, { metal: 0.5, rough: 0.4 }), 0, Y0 + ch + 0.13, PZ + 0.71);
  // Фронтон.
  const tri = new THREE.Shape([new THREE.Vector2(-2.2, 0), new THREE.Vector2(2.2, 0), new THREE.Vector2(0, 0.8)]);
  const pedM = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.5, bevelEnabled: false }), stone); pedM.position.set(0, Y0 + ch + 0.26, PZ - 0.8); g.add(pedM);
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.07, 1.6), copper); c.position.set(s * 1.05, Y0 + ch + 0.66, PZ - 0.05); c.rotation.z = -s * Math.atan2(0.8, 2.2); g.add(c); }
  // Релеф във фронтона: фигури.
  for (let i = -2; i <= 2; i++) { const hh = 0.5 * (1 - Math.abs(i) / 3); const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, hh * 0.6, 4, 6), trim); f.position.set(i * 0.55, Y0 + ch + 0.3 + hh * 0.45, PZ + 0.72); g.add(f); }
  // Врата зад колоните.
  B(0.7, 1.3, 0.04, M(0x4a3420), 0, Y0 + 0.65, fz + 0.02);
  for (const x of [-1.2, 1.2]) B(0.4, 0.9, 0.03, glass, x, Y0 + 0.75, fz + 0.015);
  // Купол на барабан.
  const drumY = Y0 + H + 0.46;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.1, 0.8, 24), stone); drum.position.set(0, drumY + 0.4, -0.2); g.add(drum);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const w = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.03), glass); w.position.set(Math.sin(a) * 1.07, drumY + 0.42, -0.2 + Math.cos(a) * 1.07); w.rotation.y = a; g.add(w); }
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.08, 24), trim); ring.position.set(0, drumY + 0.84, -0.2); g.add(ring);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.08, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), copper); dome.position.set(0, drumY + 0.86, -0.2); g.add(dome);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const rib = new THREE.Mesh(new THREE.TorusGeometry(1.09, 0.018, 4, 16, Math.PI / 2), trim); rib.position.set(0, drumY + 0.86, -0.2); rib.rotation.set(0, a, Math.PI / 2); rib.rotateX(0); g.add(rib); }
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.32, 10), trim); lan.position.set(0, drumY + 2.05, -0.2); g.add(lan);
  const lcap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 10), copper); lcap.position.set(0, drumY + 2.36, -0.2); g.add(lcap);
  // Статуи по ъглите на покрива.
  for (const x of [-W / 2 + 0.3, W / 2 - 0.3]) { const s = statue({ h: 0.55, color: 0x5f6a5a }); s.position.set(x, Y0 + H + 0.52, fz - 0.3); g.add(s); }
  return g;
}

// Вестникарска будка: кръгла колона с вестници и обяви, купол от ламарина.
function kiosk() {
  const g = new THREE.Group();
  const green = cm(0x2f4a3a);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.16, 20), green); base.position.y = 0.08; g.add(base);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.15, 20, 1, true), new THREE.MeshStandardMaterial({ map: posterTex(), roughness: 0.9 })); body.position.y = 0.74; g.add(body);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 1.15, 12), green); core.position.y = 0.74; g.add(core);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.52, 0.14, 20), green); band.position.y = 1.38; g.add(band);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), cm(0x4f6f5f, { metalness: 0.3, roughness: 0.5 })); dome.scale.y = 0.6; dome.position.y = 1.45; g.add(dome);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cm(0xc9a640, { metalness: 0.6, roughness: 0.35 })); fin.position.y = 1.85; g.add(fin);
  // Тезгях с купчини вестници.
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.3), IM('planks')); counter.position.set(0.0, 0.62, 0.62); g.add(counter);
  for (const s of [-1, 0, 1]) for (const s2 of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.03), IM('planks')); if (s === 0) continue; leg.position.set(s * 0.27, 0.3, 0.62 + s2 * 0.12); g.add(leg); }
  for (const x of [-0.18, 0, 0.18]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06 + Math.abs(x) * 0.2, 0.2), cm(0xeeeae0)); st.position.set(x, 0.68, 0.62); g.add(st); }
  return g;
}

// ---------- текстури ----------
function canvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
let STRIPE = null, POSTER = null;
function stripeTex() {
  if (!STRIPE) STRIPE = canvas(256, 64, (ctx, w, h) => { for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#f3ead8' : '#2f6a4a'; ctx.fillRect(i * w / 8, 0, w / 8, h); } ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, h - 10, w, 10); });
  return STRIPE;
}
function posterTex() {
  if (!POSTER) POSTER = canvas(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e9e1cc'; ctx.fillRect(0, 0, w, h);
    const r = ((s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; })(5);
    for (let i = 0; i < 8; i++) {
      const x = i * 128 + 6, wd = 116;
      const bg = ['#f4efe2', '#e8d8b0', '#f4efe2', '#d8e0e8', '#f4efe2', '#f0d8c8', '#f4efe2', '#e0e8d0'][i];
      ctx.fillStyle = bg; ctx.fillRect(x, 10, wd, h - 20);
      ctx.fillStyle = '#1e1e1e'; ctx.font = 'bold 26px serif'; ctx.textAlign = 'center';
      ctx.fillText(i % 2 ? 'ОБЯВА' : 'ВЕСТНИК', x + wd / 2, 42);
      ctx.fillStyle = 'rgba(30,30,30,0.6)';
      for (let y = 58; y < h - 24; y += 10) { const cols = i % 2 ? 1 : 2; for (let c = 0; c < cols; c++) ctx.fillRect(x + 8 + c * (wd / cols), y, wd / cols - 16 - r() * 18, 4); }
      if (i % 3 === 1) { ctx.fillStyle = '#7a8a9a'; ctx.fillRect(x + 20, 70, wd - 40, 60); }
    }
  });
  return POSTER;
}
const TMAT = new Map();
function textMat(text, { bg, fg, w, h, size }) {
  const k = `${text}|${bg}`;
  if (!TMAT.has(k)) TMAT.set(k, new THREE.MeshStandardMaterial({ map: canvas(w, h, (ctx) => { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); ctx.fillStyle = fg; ctx.font = `bold ${size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2 + 4); }), roughness: 0.85, side: THREE.DoubleSide }));
  return TMAT.get(k);
}
// Карта с твърдение (текстът се пренася на редове).
function cardMat(text) {
  const t = canvas(768, 304, (ctx, w, h) => {
    ctx.fillStyle = '#fbf6e8'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 8; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#2a1e12'; ctx.font = '600 44px system-ui, "Segoe UI", Roboto, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const words = `„${text}“`.split(' '); const lines = []; let line = '';
    for (const wd of words) { const tt = line ? line + ' ' + wd : wd; if (ctx.measureText(tt).width > w - 70) { lines.push(line); line = wd; } else line = tt; }
    lines.push(line);
    const lh = 54, y0 = h / 2 - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => ctx.fillText(l, w / 2, y0 + i * lh));
  });
  return new THREE.MeshBasicMaterial({ map: t });
}
const PAGES = {};
function bookPage(kind) {
  if (!PAGES[kind]) PAGES[kind] = new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide, map: canvas(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#f3e9cf'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8a2a20'; ctx.lineWidth = 3; ctx.strokeRect(14, 14, w - 28, h - 28);
    if (kind === 'title') {
      ctx.fillStyle = '#5a1a14'; ctx.textAlign = 'center'; ctx.font = 'bold 26px serif'; ctx.fillText('КОНСТИТУЦИЯ', w / 2, 120);
      ctx.font = '20px serif'; ctx.fillText('Търново', w / 2, 160); ctx.fillText('1879', w / 2, 190);
    } else {
      ctx.fillStyle = 'rgba(40,30,20,0.55)';
      for (let y = 40, i = 0; y < h - 40; y += 15, i++) ctx.fillRect(30 + (i % 6 === 0 ? 16 : 0), y, w - 60 - ((i * 37) % 50) - (i % 6 === 0 ? 16 : 0), 5);
    }
  }) });
  return PAGES[kind];
}
