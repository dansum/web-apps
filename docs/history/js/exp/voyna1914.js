// 9.1.1 „Блоковете и Първата световна война“ — жива карта на Европа през 1914 г. и след войната.
// Стъпки: опознай Великите сили и Сараево → оцвети блоковете и виж как съюзите въвличат все повече държави →
// фронтовете 1914–1918 с плъзгач, новите оръжия отблизо, причина / повод / последица →
// предскажи какво става с четирите империи и виж новата карта.
// Картата: data/geo/europe1914.json — опростена схема, начертана за курса (tools/make-europe1914-geo.mjs);
// сцената показва „Приблизителни граници“. Днешните граници (data/geo/europe.json, Natural Earth) са само за ориентир.
// Фронтовете са схема; сигурни са датите в балончетата.
import { createStage, cornerMenu, esc, mat, labelSprite, addHitBox, THREE } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { mapDecor } from './hist/regions.js';
import { mergeStatic } from './hist/medieval.js';
import { tank, biplane, gasCloud, animateGas, trench, machineGun, crater, stump, dioramaBase, wagon, warship, sarajevoBridge } from './hist/war1914.js';

const APPROX = '<br><i class="small">Приблизителни граници.</i>';
const SCHEME = '<br><i class="small">Фронтът е схема.</i>';
const C0 = [18, 48.5], UNIT = 0.3, KX = Math.cos((C0[1] * Math.PI) / 180);
const pos = (lon, lat, y = 0) => new THREE.Vector3((lon - C0[0]) * KX * UNIT, y, -(lat - C0[1]) * UNIT);
const H = 0.06; // височина на държавите

// Цветове: политическа карта (стъпки 1 и 4) и блоковете (стъпки 2 и 3).
const POL = {
  de: 0xcfa98a, ah: 0xe6cf7a, ru: 0xa6cc9c, fr: 0x93b5e2, gb: 0xe6a3a3, it: 0x9fd4c6, ot: 0xdbb892, rs: 0xc6a3d9, me: 0xb3a6dc,
  bg: 0x8cc47f, ro: 0xf2b886, gr: 0x95d2e8, al: 0xd8c4a4, be: 0xf2d470, nl: 0xf5ad66, lu: 0xc8c8f0, ch: 0xf0a8a8, dk: 0xe2b6cc,
  no: 0xb4d4ac, se: 0xaec6ea, es: 0xf0dca6, pt: 0xb0dcb6, x: 0xddd6c6,
  pl: 0xe8909f, cs: 0x7fb2db, at: 0xf2d27e, hu: 0x9ed38c, ks: 0xc6a3d9, fi: 0xc4e3f2, ee: 0x8cbcae, lv: 0xdaa6bd, lt: 0xcad97c,
  su: 0xa6cc9c, tr: 0xdbb892, frm: 0xbcd0ec, gbm: 0xf0c4c4, danzig: 0xe0e0e0, ie: 0xa4d6a4,
};
const BLOC = { E: 0x4f86c6, C: 0xd2603f, Ep: 0xb2cbe9, Cp: 0xf0b9a6, N: 0xebe5d4, out: 0xc9c4b8 };
const NAME = {
  de: 'Германия', ah: 'Австро-Унгария', ru: 'Русия', fr: 'Франция', gb: 'Великобритания', it: 'Италия', ot: 'Османската империя',
  rs: 'Сърбия', me: 'Черна гора', bg: 'България', ro: 'Румъния', gr: 'Гърция', al: 'Албания', be: 'Белгия', nl: 'Нидерландия',
  lu: 'Люксембург', ch: 'Швейцария', dk: 'Дания', no: 'Норвегия', se: 'Швеция', es: 'Испания', pt: 'Португалия',
};
const GREAT = { de: 'ta', ah: 'ta', it: 'ta', fr: 'en', gb: 'en', ru: 'en' };

// Столици и места (дължина, ширина).
const CAP = { ah: [16.37, 48.21], rs: [20.46, 44.82], ru: [30.32, 59.94], de: [13.4, 52.52], fr: [2.35, 48.86], be: [4.35, 50.85], gb: [-0.13, 51.5], deW: [6.1, 50.78] };
const SARAJEVO = [18.41, 43.86];

// ---------- стъпка 1 ----------
const EXPLORE = [
  { id: 'sarajevo', icon: '📍', label: 'Сараево, 1914 г.',
    note: '<b>Сараево, 28 юни 1914 г.</b><br>Столицата на Босна, която Австро-Унгария анексира през 1908 г. До Латинския мост младият босненски сърбин Гаврило Принцип убива австро-унгарския престолонаследник Франц Фердинанд и съпругата му София. Това е <b>поводът</b> за войната.<br><i class="small">Мостът е запазен и днес; моделът е възстановка.</i>' },
  { id: 'de', icon: '🏭', label: 'Германия',
    note: '<b>Германската империя</b><br>Обединена през 1871 г.; император е Вилхелм II. Има бързо растяща индустрия и строи голям военен флот. Иска още колонии и пазари.<br><b>Съюз:</b> Тройният съюз (1882 г.) с Австро-Унгария и Италия.' },
  { id: 'ah', icon: '👑', label: 'Австро-Унгария',
    note: '<b>Австро-Унгария</b><br>Двуединна монархия на император Франц Йосиф. В нея живеят много народи: австрийци, унгарци, чехи, поляци, хървати, сърби, румънци и др. Съперничи на Русия за влияние на Балканите.<br><b>Съюз:</b> Тройният съюз.' },
  { id: 'it', icon: '⛵', label: 'Италия',
    note: '<b>Кралство Италия</b><br>От 1882 г. е в Тройния съюз с Германия и Австро-Унгария. Но спори с Австро-Унгария за Трентино и Триест, където живеят италианци.' },
  { id: 'fr', icon: '🗼', label: 'Франция',
    note: '<b>Френската република</b><br>През 1871 г. губи Елзас и Лотарингия във войната с Германия и иска да си ги върне. Има големи колонии в Африка и Азия.<br><b>Съюзи:</b> с Русия (в края на XIX в.) и с Великобритания (1904 г.).' },
  { id: 'gb', icon: '⚓', label: 'Великобритания',
    note: '<b>Великобритания</b><br>Най-голямата колониална империя и най-силният флот в света. Тревожи се от растящия германски флот. Сближава се с Франция (1904 г.) и с Русия (1907 г.).' },
  { id: 'ru', icon: '❄️', label: 'Русия',
    note: '<b>Руската империя</b><br>Най-голямата държава в Европа; цар е Николай II. В нея са и Финландия, балтийските земи и голяма част от Полша. Подкрепя Сърбия и славяните на Балканите.<br><b>Съюзи:</b> с Франция и с Великобритания.' },
  { id: 'ot', icon: '🕌', label: 'Османската империя',
    note: '<b>Османската империя</b><br>Отслабена е след Балканските войни (1912–1913 г.) и е загубила почти всичките си европейски земи. Сближава се с Германия.' },
];

// ---------- стъпка 2 ----------
const CHAIN = [
  { id: 'rs', from: 'ah', ask: 'Месец след атентата, на <b>28 юли 1914 г.</b>, Австро-Унгария обявява война на държавата, която обвинява за него. Кликни я.',
    good: 'Австро-Унгария обявява война на Сърбия (28 юли 1914 г.).', war: { ah: 'C', rs: 'E' } },
  { id: 'ru', ask: 'Коя Велика сила се застъпва за Сърбия и обявява мобилизация — събира армията си? Кликни я.',
    good: 'Русия обявява мобилизация в подкрепа на Сърбия (края на юли 1914 г.).', war: {} },
  { id: 'de', to: 'ru', ask: '<b>1 август 1914 г.</b> Съюзникът на Австро-Унгария обявява война на Русия. Кликни го.',
    good: 'Германия обявява война на Русия (1 август 1914 г.).', war: { de: 'C', ru: 'E' } },
  { id: 'fr', from: 'de', ask: '<b>3 август 1914 г.</b> Германия обявява война и на съюзницата на Русия на запад. Кликни я.',
    good: 'Германия обявява война на Франция (3 август 1914 г.).', war: { fr: 'E' } },
  { id: 'be', from: 'deW', ask: 'Германската армия напада Франция през неутрална държава на север от нея. Кликни тази държава.',
    good: 'Германските войски влизат в неутрална Белгия (4 август 1914 г.).', war: { be: 'E' } },
  { id: 'gb', to: 'de', ask: 'Заради нападението над Белгия още една Велика сила обявява война на Германия. Кликни я.',
    good: 'Великобритания обявява война на Германия (4 август 1914 г.). За една седмица войната обхваща Европа.', war: { gb: 'E', me: 'E' } },
];
const EVENTS = [
  { id: 'ot', side: 'C', when: 'Есента на 1914 г.', t: 'Османската империя влиза във войната на страната на Германия. Германия, Австро-Унгария и съюзниците им се наричат <b>Централни сили</b>.' },
  { id: 'it', side: 'E', when: 'Май 1915 г.', t: 'Италия напуска Тройния съюз и влиза във войната на страната на <b>Антантата</b>.' },
  { id: 'bg', side: 'C', when: 'Октомври 1915 г.', t: 'България влиза във войната на страната на Централните сили.' },
  { id: 'pt', side: 'E', when: '1916 г.', t: 'Португалия влиза във войната на страната на Антантата.' },
  { id: 'ro', side: 'E', when: 'Август 1916 г.', t: 'Румъния влиза във войната на страната на Антантата.' },
  { id: 'usa', side: 'E', when: 'Април 1917 г.', t: 'Отвъд океана САЩ обявяват война на Германия.' },
  { id: 'gr', side: 'E', when: '1917 г.', t: 'Гърция влиза във войната на страната на Антантата.' },
];

// ---------- стъпка 3 ----------
const AT_WAR = {
  1914: { E: ['fr', 'gb', 'ru', 'rs', 'me', 'be'], C: ['de', 'ah', 'ot'] },
  1915: { E: ['it'], C: ['bg'] },
  1916: { E: ['ro', 'pt'], C: [] },
  1917: { E: ['gr'], C: [] },
  1918: { E: [], C: [] },
};
const YEARS = [1914, 1915, 1916, 1917, 1918];
function blocsAt(year) {
  const s = {};
  for (const y of YEARS) { if (y > year) break; for (const id of AT_WAR[y].E) s[id] = 'E'; for (const id of AT_WAR[y].C) s[id] = 'C'; }
  if (year >= 1918) s.ru = 'out';
  return s;
}
const LEGEND = {
  1914: '🟦 Антанта: Франция, Великобритания, Русия, Сърбия, Белгия, Черна гора · 🟥 Централни сили: Германия, Австро-Унгария, Османската империя',
  1915: '+ Италия (Антанта, май) · + България (Централни сили, октомври)',
  1916: '+ Португалия и Румъния (Антанта)',
  1917: '+ САЩ и Гърция (Антанта) · революция в Русия',
  1918: 'Русия излиза от войната (март) · България — примирие (септември) · Германия — примирие (11 ноември)',
};
const FRONTS = [
  { id: 'west', name: 'Западен фронт', years: [1914, 1918], lab: [1.4, 49.6], pts: [[2.6, 51.12], [2.85, 50.85], [2.95, 50.55], [2.75, 50.3], [2.8, 50.0], [2.95, 49.75], [3.1, 49.55], [3.4, 49.4], [3.9, 49.35], [4.5, 49.25], [5.1, 49.2], [5.4, 49.2], [5.55, 48.9], [6.05, 48.85], [6.6, 48.55], [7.0, 48.25], [7.05, 47.85], [7.15, 47.5]] },
  { id: 'east', name: 'Източен фронт', years: [1914, 1914], lab: [18.6, 53.1], pts: [[21.3, 55.2], [22.3, 54.4], [21.6, 53.4], [20.6, 52.6], [20.2, 52.0], [20.4, 51.4], [20.8, 50.6], [21.0, 49.9], [22.0, 49.3], [23.2, 48.9], [24.5, 48.3], [25.4, 47.9]] },
  { id: 'east', name: 'Източен фронт', years: [1915, 1917], lab: [27.6, 53.2], pts: [[23.6, 57.0], [24.6, 56.6], [26.4, 55.9], [26.6, 55.2], [26.4, 54.4], [26.0, 53.6], [25.9, 52.9], [26.1, 52.1], [25.6, 51.3], [25.3, 50.7], [25.4, 50.0], [25.6, 49.4], [25.9, 48.6], [25.6, 48.0]] },
  { id: 'serbia', name: 'Сръбски фронт', years: [1914, 1915], lab: [19.2, 45.5], pts: [[19.35, 43.6], [19.35, 44.2], [19.15, 44.8], [19.6, 44.95], [20.45, 44.82], [21.4, 44.77], [22.4, 44.55]] },
  { id: 'italy', name: 'Италиански фронт', years: [1915, 1916], lab: [11.6, 46.8], pts: [[10.5, 46.6], [10.9, 45.85], [11.4, 45.95], [11.9, 46.2], [12.4, 46.55], [13.0, 46.55], [13.5, 46.3], [13.6, 46.0], [13.6, 45.75]] },
  { id: 'italy', name: 'Италиански фронт', years: [1917, 1918], lab: [11.6, 46.8], pts: [[10.5, 46.6], [10.9, 45.85], [11.4, 45.92], [11.8, 45.82], [12.1, 45.85], [12.3, 45.65], [12.65, 45.5]] },
  { id: 'salonika', name: 'Южен (Солунски) фронт', years: [1916, 1918], lab: [21.6, 40.25], pts: [[19.5, 40.45], [20.5, 40.7], [21.0, 40.95], [21.4, 41.05], [21.95, 41.15], [22.5, 41.15], [22.75, 41.2], [23.2, 41.3], [23.6, 41.1], [23.85, 40.85]] },
  { id: 'romania', name: 'Румънски фронт', years: [1916, 1917], lab: [28.6, 46.4], pts: [[25.8, 47.4], [26.15, 46.6], [26.6, 46.1], [27.1, 45.75], [27.6, 45.5], [28.1, 45.4], [28.8, 45.25], [29.6, 45.2]] },
];
const MARKS = [
  { id: 'marne', y: [1914], at: [2.95, 48.95], label: 'Марна', note: '<b>Битката на Марна, септември 1914 г.</b><br>Французите и британците спират германците пред Париж. Бързата война не става.' },
  { id: 'tannenberg', y: [1914], at: [20.1, 53.5], label: 'Танненберг', note: '<b>Танненберг, август 1914 г.</b><br>Германската армия разбива руска армия в Източна Прусия.' },
  { id: 'ypres', y: [1915], at: [2.88, 50.85], label: 'Ипър', note: '<b>Ипър, април 1915 г.</b><br>Тук германската армия за пръв път използва в голямо количество отровен газ — хлор.' },
  { id: 'gallipoli', y: [1915], at: [26.4, 40.2], label: 'Галиполи', note: '<b>Галиполи, 1915 г.</b><br>Антантата се опитва да превземе Дарданелите и да стигне до Цариград, но не успява.' },
  { id: 'verdun', y: [1916], at: [5.39, 49.16], dx: 0.35, label: 'Верден', note: '<b>Верден, февруари — декември 1916 г.</b><br>Една от най-дългите битки във войната. Фронтът почти не се мести, а загиналите са стотици хиляди.' },
  { id: 'somme', y: [1916], at: [2.7, 49.95], dx: -0.35, label: 'Сома', note: '<b>Сома, юли — ноември 1916 г.</b><br>Тук на 15 септември 1916 г. британците за пръв път пускат танкове.' },
  { id: 'tutrakan', y: [1916], at: [26.62, 44.05], label: 'Тутракан', note: '<b>Тутракан, септември 1916 г.</b><br>Българската армия превзема румънската крепост Тутракан в Добруджа.' },
  { id: 'petrograd', y: [1917], at: [30.32, 59.94], label: 'Петроград', note: '<b>Петроград, 1917 г.</b><br>Революция: царят се отказва от престола, а през ноември властта вземат болшевиките начело с Ленин.' },
  { id: 'caporetto', y: [1917], at: [13.55, 46.25], label: 'Капорето', note: '<b>Капорето, октомври 1917 г.</b><br>Германски и австро-унгарски войски пробиват Италианския фронт; италианците се изтеглят до река Пиаве.' },
  { id: 'doiran', y: [1917, 1918], at: [22.72, 41.18], dx: 0.45, label: 'Дойран', note: '<b>Дойран, 1917 и 1918 г.</b><br>Тук българската армия удържа позициите си срещу войските на Антантата.' },
  { id: 'brest', y: [1918], at: [23.7, 52.1], label: 'Брест-Литовск', note: '<b>Брест-Литовск, март 1918 г.</b><br>Съветска Русия сключва мир с Централните сили и излиза от войната.' },
  { id: 'dobro', y: [1918], at: [21.9, 41.1], dx: -0.55, label: 'Добро поле', note: '<b>Добро поле, 15 септември 1918 г.</b><br>Войските на Антантата пробиват Южния фронт. На 29 септември България подписва Солунското примирие и излиза от войната.' },
  { id: 'compiegne', y: [1918], at: [2.83, 49.42], label: 'Компиен', note: '<b>Компиен, 11 ноември 1918 г.</b><br>Във вагон в гората край Компиен Германия подписва примирие. Войната свършва.<br><i class="small">Вагонът е възстановка.</i>' },
];
const TASKS = [
  { year: 1914, id: 'west', ask: 'Премести плъзгача на <b>1914 г.</b> Кликни фронта, на който след битката на Марна армиите се окопават от Северно море до Швейцария.',
    good: 'Западният фронт: тук войната става окопна (позиционна).' },
  { year: 1916, id: 'salonika', ask: 'Премести плъзгача на <b>1916 г.</b> Кликни фронта, на който воюва главно българската армия срещу войските на Антантата.',
    good: 'Южният (Солунски, Македонски) фронт — от Адриатическо до Бяло море. Тук българската армия удържа позициите при Дойран.' },
  { year: 1917, id: 'east', ask: 'Премести плъзгача на <b>1917 г.</b> — годината на революцията в Русия. Кликни фронта, на който воюва руската армия.',
    good: 'Източният фронт. Премести плъзгача на 1918 г.: след мира в Брест-Литовск (март 1918 г.) този фронт изчезва.' },
  { year: 1918, id: 'dobro', ask: 'Премести плъзгача на <b>1918 г.</b> Кликни мястото, където през септември 1918 г. войските на Антантата пробиват Южния фронт.',
    good: 'Добро поле: пробив на 15 септември 1918 г. На 29 септември България подписва Солунското примирие и излиза от войната.' },
];
const WEAPONS = [
  { id: 'trench', icon: '〰️', label: 'Окопите',
    note: '<b>Окопите</b><br>След битката на Марна (септември 1914 г.) армиите се окопават. Окопите стигат от Северно море до Швейцария. Между тях е „ничията земя“ с бодлива тел и фунии от снаряди. Войната става <b>позиционна</b>: месеци наред фронтът почти не мърда.' },
  { id: 'mg', icon: '🔩', label: 'Картечницата',
    note: '<b>Картечницата</b><br>Стреля стотици патрони в минута. Няколко души с картечница могат да спрат цяла атака. Затова пехотата трудно пробива окопите.' },
  { id: 'tank', icon: '🛡️', label: 'Танкът',
    note: '<b>Танкът</b><br>Британците го пускат за пръв път в битката при Сома на 15 септември 1916 г. Веригите минават през окопи и бодлива тел, а бронята пази от куршуми. Първите танкове са бавни — почти колкото човек, който върви.' },
  { id: 'plane', icon: '✈️', label: 'Самолетът',
    note: '<b>Самолетът</b><br>В началото самолетите само разузнават — гледат отгоре къде е противникът. После започват въздушни боеве и бомбардировки.' },
  { id: 'gas', icon: '☁️', label: 'Отровният газ',
    note: '<b>Отровният газ</b><br>През април 1915 г. при Ипър германската армия използва хлор в голямо количество. После газ използват и двете страни, а войниците получават противогази. След войната газът е забранен с международен договор (1925 г.).' },
];
const SORT = [
  { t: 'Атентатът в Сараево (28 юни 1914 г.)', a: 'povod' },
  { t: 'Съперничеството на Великите сили за колонии и пазари', a: 'prich' },
  { t: 'Загиват милиони войници и цивилни', a: 'posl' },
  { t: 'Надпреварата във въоръжаването — най-вече за флота между Германия и Великобритания', a: 'prich' },
  { t: 'Създадено е Обществото на народите, за да пази мира', a: 'posl' },
  { t: 'Противопоставянето на двата блока — Тройния съюз и Антантата', a: 'prich' },
  { t: 'Опустошени земи и тежки дългове за много държави', a: 'posl' },
];
const SORT_WHY = {
  prich: 'Не. Това се натрупва дълги години преди войната.',
  povod: 'Не. Това е едно събитие, което само „отприщва“ войната.',
  posl: 'Не. Това идва чак след войната.',
};

// ---------- стъпка 4 ----------
const EMPIRES = [
  { id: 'ru', also: [], ask: 'Какво става с <b>Руската империя</b>?',
    opts: [
      { t: 'Революция сваля царя. Болшевиките вземат властта, а Финландия, Естония, Латвия, Литва и Полша стават независими.', ok: true },
      { t: 'Русия печели войната и взема Цариград.', why: 'Не. Русия излиза от войната още през март 1918 г., след революцията.' },
      { t: 'Царят остава на власт и империята запазва всичките си земи.', why: 'Не. През 1917 г. царят се отказва от престола, а народите на запад се отделят.' },
    ],
    show: '<b>Така и става.</b> След революцията (1917 г.) болшевиките вземат властта; през 1922 г. е създаден СССР. Независими стават Финландия, Естония, Латвия и Литва, а Полша се възстановява.' },
  { id: 'ah', also: ['rs', 'me'], ask: 'Какво става с <b>Австро-Унгария</b>?',
    opts: [
      { t: 'Разпада се. Появяват се Австрия, Унгария и Чехословакия, а други земи отиват към Полша, Румъния, Италия и новото Кралство на сърби, хървати и словенци.', ok: true },
      { t: 'Остава цяла, но губи Босна.', why: 'Не. Народите в империята искат свои държави и тя се разпада напълно.' },
      { t: 'Обединява се с Германия в една държава.', why: 'Не. Мирните договори забраняват на Австрия да се обедини с Германия.' },
    ],
    show: '<b>Така и става.</b> През есента на 1918 г. империята се разпада. Възникват Австрия, Унгария и Чехословакия; Трансилвания отива към Румъния, Галиция — към Полша, Трентино и Триест — към Италия. Хърватия, Словения и Босна се обединяват със Сърбия и Черна гора в Кралството на сърби, хървати и словенци.' },
  { id: 'de', also: [], ask: 'Какво става с <b>Германската империя</b>?',
    opts: [
      { t: 'Императорът абдикира и Германия става република. Връща Елзас и Лотарингия на Франция, дава земи на Полша и губи всичките си колонии.', ok: true },
      { t: 'Германия запазва императора и колониите си.', why: 'Не. През ноември 1918 г. император Вилхелм II абдикира.' },
      { t: 'Германия е разделена на няколко малки кралства.', why: 'Не. Германия губи земи, но остава една държава.' },
    ],
    show: '<b>Така и става.</b> През ноември 1918 г. Вилхелм II абдикира и Германия става република. По Версайския договор (1919 г.) Елзас и Лотарингия се връщат на Франция, Познан и излаз на море — на Полша, а Данциг става свободен град.' },
  { id: 'ot', also: [], ask: 'Какво става с <b>Османската империя</b>?',
    opts: [
      { t: 'Губи арабските земи — те се управляват от Франция и Великобритания. Султанатът е премахнат и през 1923 г. е обявена Република Турция.', ok: true },
      { t: 'Империята си връща земите на Балканите.', why: 'Не. Тя е победена и губи още земи.' },
      { t: 'Арабските земи стават една голяма независима държава.', why: 'Не. Те минават под управлението на Франция и Великобритания като „мандати“.' },
    ],
    show: '<b>Така и става.</b> Сирия и Ливан минават под управлението на Франция, а Палестина, Трансйордания и Ирак — на Великобритания. Султанатът е премахнат (1922 г.) и през 1923 г. е обявена Република Турция.' },
];

export function mount(container, { onComplete } = {}) {
  const shell = createShell(container, { steps: ['Опознай Европа през 1914 г.', 'Съюзите се задействат', 'Фронтовете 1914–1918', 'Предскажи: след войната'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1;
  const narrow = far > 1;
  const VIEW = [[0, 9.0 * far, 6.2 * far], [0, 0, -0.2]];
  const home = (dur = 1) => stage.flyTo(VIEW[0], VIEW[1], dur);
  const stage = createStage(shell.stageEl, { background: 0xdcecf7, camPos: VIEW[0], target: VIEW[1], maxDistance: 34, minDistance: 0.8 });
  stage.sun.position.set(-4, 10, 6);

  let geo = null, menu = null, tip = null, clickHandler = null, decor = null, modern = null;
  const scores = [];
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.5, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  const world = new THREE.Group();
  stage.scene.add(world);
  const anchorAt = (lon, lat, y = H) => { const o = new THREE.Object3D(); o.position.copy(pos(lon, lat, y)); world.add(o); return o; };

  // ---------- море, облаци ----------
  const sea = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 34), mat(0x6fb3dc));
  sea.position.set(0, -0.06, 0);
  world.add(sea);
  const seaBase = new THREE.Color(0x6fb3dc);
  // Леки вълни: тънки светли ивици, които плават.
  const waves = [];
  for (let i = 0; i < 14; i++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5 + (i % 3) * 0.2, 0.025), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    w.rotation.x = -Math.PI / 2;
    const p = [[-8, 2], [-7, -3], [-9, 5], [7, 6], [-2.5, 4.6], [1, 3.6], [-6.5, -1], [6.5, 3], [-1, 5.8], [3.8, 5], [-8.5, -5], [0.5, -6.2], [8, -1], [-4.2, 6.5]][i];
    w.position.set(p[0], 0.0, p[1]);
    w.userData.ph = i;
    world.add(w); waves.push(w);
  }

  // ---------- карта ----------
  const pieces = [];          // { a, b, group, mat, line }
  const labels14 = new Map(), labels20 = new Map();
  const lines14 = new Map(), lines20 = new Map();
  const anchors14 = new Map(), anchors20 = new Map();
  function ringsToLines(polys, y, color, opacity) {
    const pts = [];
    for (const p of polys) for (const r of p) for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; pts.push(pos(a[0], a[1], y), pos(b[0], b[1], y)); }
    const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    l.raycast = () => {};
    return l;
  }
  function buildMap() {
    for (const p of geo.pieces) {
      const g = new THREE.Group();
      const m = mat(POL[p.a] || POL.x);
      for (const poly of p.polygons) {
        const toV = ([lon, lat]) => { const v = pos(lon, lat); return new THREE.Vector2(v.x, -v.z); };
        const shape = new THREE.Shape(poly[0].map(toV));
        for (const hole of poly.slice(1)) shape.holes.push(new THREE.Path(hole.map(toV)));
        const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false }), m);
        mesh.rotation.x = -Math.PI / 2;
        g.add(mesh);
      }
      mergeStatic(g);
      const line = ringsToLines(p.polygons, H + 0.004, 0x4a4438, 0.5);
      line.visible = false;
      g.add(line);
      if (p.a !== 'x') g.userData.pickId = p.a;
      world.add(g);
      pieces.push({ a: p.a, b: p.b, group: g, mat: m, line });
    }
    const mk = (list, labels, lines, anchors) => {
      for (const s of list) {
        const l = ringsToLines(s.polygons, H + 0.005, 0x4a4438, 0.6);
        world.add(l); lines.set(s.id, l);
        if (!s.name) continue;
        // Големите държави — по-едър надпис; малките — по-дребен (иначе се застъпват на Балканите).
        const big = s.polygons.reduce((a, p) => a + Math.abs(p[0].reduce((q, v, i) => { const w = p[0][(i + 1) % p[0].length]; return q + v[0] * w[1] - w[0] * v[1]; }, 0)) / 2, 0) > 30;
        const sp = labelSprite(s.name, { size: big ? 0.34 : 0.25, color: '#3b3529', bg: 'rgba(255,255,255,0.72)', border: 'rgba(0,0,0,0)' });
        sp.position.copy(pos(s.anchor[0], s.anchor[1], 0.32));
        stage.steadyLabel(sp, 13);
        world.add(sp); labels.set(s.id, sp);
        anchors.set(s.id, anchorAt(s.anchor[0], s.anchor[1]));
      }
    };
    mk(geo.states14, labels14, lines14, anchors14);
    mk(geo.states20, labels20, lines20, anchors20);
  }
  // Оцветява картата: colorOf(piece) → цвят; mode '14' | '20' | 'mix' (за надписите и границите).
  let revealed = new Set();
  function paint(colorOf, { mode = '14', labels = true } = {}) {
    for (const p of pieces) p.mat.color.setHex(colorOf(p));
    const on20 = (p) => mode === '20' || (mode === 'mix' && revealed.has(p.a));
    const all20 = new Map(), any20 = new Map();
    for (const p of pieces) {
      const r = on20(p);
      all20.set(p.b, (all20.get(p.b) ?? true) && r);
      any20.set(p.b, (any20.get(p.b) ?? false) || r);
      p.line.visible = mode === 'mix' && r;
      p.group.position.y = r && mode === 'mix' ? 0.02 : 0;
    }
    const ids14 = new Set(geo.states14.map((s) => s.id));
    for (const [id, l] of lines14) l.visible = mode === '14' || (mode === 'mix' && !revealed.has(id));
    for (const [id, l] of lines20) l.visible = mode === '20' || (mode === 'mix' && all20.get(id));
    for (const [id, s] of labels14) s.visible = labels && (mode === '14' || (mode === 'mix' && !revealed.has(id))) && (labels === true || labels.includes(id));
    for (const [id, s] of labels20) s.visible = labels && (mode === '20' || (mode === 'mix' && (all20.get(id) || (!ids14.has(id) && any20.get(id)))));
  }
  const politics = () => paint((p) => POL[p.a] || POL.x, { mode: '14' });

  // Мигане на държава (подсказка).
  let blinkId = null;
  stage.tick((dt, t) => {
    for (const p of pieces) {
      if (p.a === blinkId) p.mat.emissive.setHex(0xffffff).multiplyScalar(0.18 + 0.18 * Math.sin(t * 6));
      else if (p.mat.emissive.getHex()) p.mat.emissive.setHex(0);
    }
    sea.material.color.copy(seaBase).offsetHSL(0, 0, Math.sin(t * 0.8) * 0.02);
    for (const w of waves) { w.position.x += dt * 0.08; if (w.position.x > 11) w.position.x = -11; w.material.opacity = 0.2 + 0.15 * Math.sin(t * 0.9 + w.userData.ph); }
  });

  // Знак „Приблизителни граници“ и превключвател за днешните граници.
  const host = stage.renderer.domElement.parentElement;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const badge = document.createElement('div');
  badge.textContent = '⚠ Приблизителни граници';
  Object.assign(badge.style, { position: 'absolute', left: '8px', bottom: '8px', zIndex: 3, padding: '3px 8px', borderRadius: '6px',
    background: 'rgba(255,248,220,0.92)', border: '1px solid #d8b75a', font: '600 12px/1.3 system-ui, sans-serif', color: '#6b4d00', pointerEvents: 'none' });
  host.appendChild(badge);
  const modBtn = document.createElement('button');
  modBtn.type = 'button';
  modBtn.className = 'btn';
  modBtn.textContent = 'Днешни граници';
  Object.assign(modBtn.style, { position: 'absolute', right: '8px', bottom: '8px', zIndex: 3, padding: '3px 9px', fontSize: '12px', minHeight: '0' });
  modBtn.addEventListener('click', () => { if (!modern) return; modern.visible = !modern.visible; modBtn.classList.toggle('primary', modern.visible); });
  ['pointerdown', 'touchstart'].forEach((ev) => modBtn.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
  host.appendChild(modBtn);
  async function loadModern() {
    const r = await fetch('data/geo/europe.json');
    if (!r.ok) return;
    const g = await r.json();
    const pts = [];
    for (const c of g.countries) for (const ring of c.rings) for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      if (i % 2) continue; // пунктир
      pts.push(pos(a[0], a[1], H + 0.03), pos(b[0], b[1], H + 0.03));
    }
    modern = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.55 }));
    modern.raycast = () => {};
    modern.visible = false;
    world.add(modern);
  }

  // ---------- места и модели ----------
  function pin(id, lon, lat, label, { color = 0xc0392b, size = 0.22, dx = 0 } = {}) {
    const g = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), mat(0x5a5a5a)); stick.position.y = 0.11;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), mat(color)); head.position.y = 0.24;
    g.add(stick, head);
    const l = labelSprite(label, { size });
    l.position.set(dx, 0.42, 0);
    stage.steadyLabel(l, 13);
    g.add(l);
    g.position.copy(pos(lon, lat, H));
    g.userData = { pickId: id, head, ph: Math.random() * 6 };
    addHitBox(g, 0.35);
    world.add(g);
    return g;
  }
  const pins = new Map();
  const sarajevo = pin('sarajevo', SARAJEVO[0], SARAJEVO[1], 'Сараево', { color: 0x2b6cb0 });
  pins.set('sarajevo', sarajevo);
  for (const m of MARKS) { const g = pin(m.id, m.at[0], m.at[1], m.label, { color: m.id === 'dobro' || m.id === 'doiran' || m.id === 'tutrakan' ? 0x2e7d32 : 0x8e2a1c, size: 0.2, dx: m.dx || 0 }); g.visible = false; pins.set(m.id, g); }
  stage.tick((dt, t) => { for (const g of pins.values()) g.userData.head.scale.setScalar(1 + 0.15 * Math.sin(t * 2.4 + g.userData.ph)); });

  // Сараево отблизо: Латинският мост, Миляцка, къщи и джамия.
  // Сараево отблизо: малък макет над Адриатическо море, свързан с града с пунктир.
  const SB = pos(18.6, 37.6, 0.3);
  const sbp = new THREE.Group(); sbp.position.copy(SB); sbp.scale.setScalar(0.5); world.add(sbp);
  sbp.add(dioramaBase(1));
  const sb = sarajevoBridge(); sb.scale.setScalar(1.25); sb.rotation.y = 0.25; sbp.add(sb);
  sbp.userData.pickId = 'sarajevo';
  addHitBox(sbp, 0.5);
  const sbLead = new THREE.Line(new THREE.BufferGeometry().setFromPoints([SB.clone().add(new THREE.Vector3(0.35, -0.05, -0.25)), pos(SARAJEVO[0], SARAJEVO[1], H + 0.02)]),
    new THREE.LineDashedMaterial({ color: 0x6b4d00, dashSize: 0.08, gapSize: 0.06 }));
  sbLead.computeLineDistances(); sbLead.raycast = () => {}; world.add(sbLead);
  // Вагонът от Компиен.
  const wg = wagon();
  wg.scale.setScalar(0.2);
  wg.position.copy(pos(1.9, 49.9, H + 0.005));
  wg.rotation.y = 0.4;
  wg.userData.pickId = 'compiegne';
  wg.visible = false;
  world.add(wg);
  // Броненосци в Северно море и малък самолет над Западния фронт.
  const ships = [0, 1].map((i) => {
    const s = warship(); s.scale.setScalar(0.28); s.userData.ph = i * 3; world.add(s);
    s.userData.puffs = [0, 1, 2, 3].map(() => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshStandardMaterial({ color: 0x777777, transparent: true, opacity: 0.5 })); world.add(p); return p; });
    return s;
  });
  const miniPlane = biplane(); miniPlane.scale.setScalar(0.22); world.add(miniPlane); miniPlane.visible = false;
  stage.tick((dt, t) => {
    ships.forEach((s, i) => {
      const k = 0.5 + 0.5 * Math.sin(t * 0.05 + s.userData.ph);
      const a = pos(1.5 + i * 1.2, 55.6 + i * 0.9), b = pos(5.0 + i * 0.6, 57.3 + i * 0.6);
      s.position.lerpVectors(a, b, k); s.position.y = -0.01;
      const dir = Math.cos(t * 0.05 + s.userData.ph) >= 0 ? 1 : -1;
      s.rotation.y = Math.atan2(-(b.z - a.z) * dir, (b.x - a.x) * dir);
      s.userData.puffs.forEach((p, j) => {
        const q = ((t * 0.5 + j / 4) % 1);
        const f = s.localToWorld(new THREE.Vector3(-0.08, 0.2, 0));
        p.position.set(f.x - q * 0.15, f.y + q * 0.12, f.z);
        p.scale.setScalar(0.6 + q * 1.4); p.material.opacity = 0.5 * (1 - q);
        p.visible = s.visible;
      });
    });
    if (miniPlane.visible) {
      const c = pos(3.4, 49.6, 0.55);
      miniPlane.position.set(c.x + Math.cos(t * 0.4) * 0.5, c.y + Math.sin(t * 0.9) * 0.03, c.z + Math.sin(t * 0.4) * 0.35);
      miniPlane.rotation.set(0, -t * 0.4 - Math.PI / 2, 0.25);
      miniPlane.userData.prop.rotation.x += dt * 30;
    }
  });

  // ---------- диорама „Западният фронт отблизо“ (в Норвежко море, над картата) ----------
  const DIO = pos(-4.5, 63.0, 0.35);
  const dio = new THREE.Group();
  dio.position.copy(DIO);
  dio.scale.setScalar(0.95);
  world.add(dio);
  dio.add(dioramaBase(1));
  const dioLabel = labelSprite('Западният фронт отблизо', { size: 0.16 });
  dioLabel.position.set(0, 0.95, -0.6); stage.steadyLabel(dioLabel, 13); dio.add(dioLabel);
  const zig = (z0, s) => [[-0.85, z0], [-0.6, z0 + 0.08 * s], [-0.35, z0], [-0.1, z0 + 0.08 * s], [0.15, z0], [0.4, z0 + 0.08 * s], [0.65, z0], [0.82, z0 + 0.05 * s]];
  const tr1 = trench(zig(-0.45, 1), { wireSide: 1 }); tr1.userData.pickId = 'trench'; dio.add(tr1);
  const tr2 = trench(zig(0.48, -1), { wireSide: -1 }); tr2.userData.pickId = 'trench'; dio.add(tr2);
  addHitBox(tr1, 0.2);
  const dioStatic = new THREE.Group(); dio.add(dioStatic);
  [[0.1, -0.1, 0.07], [-0.4, 0.12, 0.05], [0.45, 0.08, 0.06], [-0.15, 0.22, 0.04], [0.62, -0.18, 0.045], [-0.62, -0.12, 0.05]].forEach(([x, z, r]) => { const c = crater(r); c.position.set(x, 0, z); dioStatic.add(c); });
  [[-0.7, 0.25], [0.3, 0.27], [0.75, -0.3], [-0.3, -0.28]].forEach(([x, z], i) => { const s = stump(0.12 + i * 0.02, i); s.position.set(x, 0, z); dioStatic.add(s); });
  mergeStatic(dioStatic);
  const mg = machineGun(); mg.scale.setScalar(0.9); mg.position.set(-0.1, 0.03, 0.4); mg.rotation.y = Math.PI / 2; mg.userData.pickId = 'mg'; addHitBox(mg, 0.2); dio.add(mg);
  const tk = tank(); tk.scale.setScalar(0.3); tk.userData.pickId = 'tank'; addHitBox(tk, 0.5); dio.add(tk);
  const tkSmoke = [0, 1, 2].map(() => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshStandardMaterial({ color: 0x555555, transparent: true, opacity: 0.4 })); dio.add(p); return p; });
  const pl = biplane(); pl.scale.setScalar(0.42); pl.userData.pickId = 'plane'; addHitBox(pl, 0.4); dio.add(pl);
  const gas = gasCloud(); gas.position.set(0, 0, 0.12); gas.userData.pickId = 'gas'; dio.add(gas);
  const gasHit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.4), new THREE.MeshBasicMaterial({ visible: false })); gasHit.position.y = 0.1; gas.add(gasHit);
  // Тънка линия от диорамата до истинския фронт.
  const lead = new THREE.Line(new THREE.BufferGeometry().setFromPoints([DIO.clone().add(new THREE.Vector3(0.6, -0.1, 0.6)), pos(2.8, 50.4, H + 0.02)]),
    new THREE.LineDashedMaterial({ color: 0x6b4d00, dashSize: 0.15, gapSize: 0.1 }));
  lead.computeLineDistances(); lead.raycast = () => {};
  world.add(lead);
  stage.tick((dt, t) => {
    const k = (t * 0.035) % 2, u = k < 1 ? k : 2 - k;
    tk.position.set(-0.55 + u * 1.0, 0.0, 0.0);
    tk.rotation.y = k < 1 ? 0 : Math.PI;
    tk.position.y = Math.abs(Math.sin(t * 6)) * 0.004;
    const ex = tk.localToWorld(tk.userData.exhaust.clone());
    tkSmoke.forEach((p, j) => { const q = (t * 0.6 + j / 3) % 1; const w = dio.worldToLocal(ex.clone()); p.position.set(w.x, w.y + q * 0.15, w.z); p.scale.setScalar(0.5 + q); p.material.opacity = 0.4 * (1 - q); });
    pl.position.set(Math.cos(t * 0.35) * 0.55, 0.62 + Math.sin(t * 0.8) * 0.03, Math.sin(t * 0.35) * 0.4);
    pl.rotation.set(0, -t * 0.35 - Math.PI / 2, 0.3);
    pl.userData.prop.rotation.x += dt * 30;
    animateGas(gas, t, dt, { from: 0.5, to: -0.35 });
  });

  // ---------- фронтове ----------
  const fronts = FRONTS.map((f) => {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3(f.pts.map(([lon, lat]) => pos(lon, lat, H + 0.05)));
    const n = f.pts.length * 8;
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, n, 0.035, 6), new THREE.MeshStandardMaterial({ color: 0x8e2a1c, roughness: 0.6, emissive: 0x000000 }));
    g.add(tube);
    // „Зъбчета“ — знакът за фронт на историческите карти.
    for (let i = 1; i < n; i += 3) {
      const p = curve.getPoint(i / n), tg = curve.getTangent(i / n);
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 5), tube.material);
      c.position.copy(p).add(new THREE.Vector3(-tg.z, 0, tg.x).multiplyScalar(0.05));
      c.rotation.set(0, 0, 0); c.lookAt(p.clone().add(new THREE.Vector3(-tg.z, 0, tg.x))); c.rotateX(Math.PI / 2);
      g.add(c);
    }
    mergeStatic(g);
    const hit = new THREE.Mesh(new THREE.TubeGeometry(curve, n, 0.16, 5), new THREE.MeshBasicMaterial({ visible: false }));
    g.add(hit);
    const l = labelSprite(f.name, { size: 0.22, color: '#7a1d10' });
    l.position.copy(pos(f.lab[0], f.lab[1], 0.4)); stage.steadyLabel(l, 13);
    g.add(l);
    g.userData = { pickId: f.id, tube, years: f.years, f };
    g.visible = false;
    world.add(g);
    return g;
  });
  stage.tick((dt, t) => { for (const g of fronts) if (g.visible) g.userData.tube.material.emissive.setRGB(0.15 + 0.1 * Math.sin(t * 3), 0, 0); });
  const frontAnchors = new Map();
  const frontAnchor = (id, year) => { const g = frontAt(id, year); if (!frontAnchors.has(g)) frontAnchors.set(g, anchorAt(...g.userData.f.lab)); return frontAnchors.get(g); };
  const frontAt = (id, year) => fronts.find((g) => g.userData.f.id === id && year >= g.userData.years[0] && year <= g.userData.years[1]);
  function showYear(year) {
    for (const g of fronts) g.visible = year != null && year >= g.userData.years[0] && year <= g.userData.years[1];
    for (const m of MARKS) pins.get(m.id).visible = year != null && m.y.includes(year);
    wg.visible = year === 1918;
    miniPlane.visible = year != null;
  }

  // ---------- стрелки „обявява война“ ----------
  let arrows = [];
  function arrow(fromLL, toLL) {
    const a = pos(fromLL[0], fromLL[1], H + 0.05), b = pos(toLL[0], toLL[1], H + 0.05);
    const mid = a.clone().lerp(b, 0.5); mid.y += 0.25 + a.distanceTo(b) * 0.25;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const m = new THREE.MeshStandardMaterial({ color: 0xb03a2e, emissive: 0x3a0000 });
    const geom = new THREE.TubeGeometry(curve, 40, 0.025, 6);
    const tube = new THREE.Mesh(geom, m);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 10), m);
    head.position.copy(b); const d = curve.getTangent(1); head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    head.visible = false;
    const g = new THREE.Group(); g.add(tube, head); world.add(g);
    const total = geom.index.count, per = 6 * 6;
    let k = 0;
    const stop = stage.tick((dt) => {
      k = Math.min(1, k + dt / 0.9);
      geom.setDrawRange(0, Math.floor((k * total) / per) * per);
      head.visible = k >= 1;
      if (k >= 1) stop();
    });
    arrows.push({ g, stop });
  }
  function clearArrows() { for (const a of arrows) { a.stop(); world.remove(a.g); } arrows = []; }
  // Пулсиращ кръг (мобилизация).
  let ring = null;
  function pulseAt(ll) {
    if (ring) { ring.stop(); world.remove(ring.m); }
    const m = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.32, 32), new THREE.MeshBasicMaterial({ color: 0xb03a2e, transparent: true, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.copy(pos(ll[0], ll[1], H + 0.03)); world.add(m);
    const stop = stage.tick((dt, t) => { const q = (t * 0.7) % 1; m.scale.setScalar(0.6 + q * 1.6); m.material.opacity = 0.8 * (1 - q); });
    ring = { m, stop };
  }
  function clearRing() { if (ring) { ring.stop(); world.remove(ring.m); ring = null; } }
  // САЩ: надпис отвъд океана.
  const usa = labelSprite('САЩ →', { size: 0.2, color: '#1f4f8a' });
  usa.position.copy(pos(-13.5, 46.5, 0.3)); stage.steadyLabel(usa, 13); usa.visible = false; world.add(usa);
  const usaAnchor = anchorAt(-13.5, 46.5, 0.2);
  usa.userData.pickId = 'usa';

  const anchor14 = (id) => anchors14.get(id) || (pins.get(id));

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    revealed = new Set();
    clearArrows(); clearRing(); showYear(null); usa.visible = false;
    politics();
    shell.task('Това е Европа през 1914 г. Разгледай Великите сили и града, където започва всичко: избери от менюто или кликни върху картата.');
    const seen = new Set();
    const open = (id) => {
      const it = EXPLORE.find((x) => x.id === id);
      if (!it) return;
      const a = id === 'sarajevo' ? sbp : anchor14(id);
      stage.focusOn(a, { dist: (id === 'sarajevo' ? 1.4 : 3.4) * far, height: (id === 'sarajevo' ? 0.8 : 3.2) * far, keepFollow: false });
      blinkId = id === 'sarajevo' ? null : id;
      say(a, it.note + (id === 'sarajevo' ? '' : APPROX), { cls: 'wide' });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${EXPLORE.length}`);
      if (seen.size === EXPLORE.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); blinkId = null; step2(); });
      }
    };
    if (menu) menu.remove();
    menu = cornerMenu(stage, { title: 'Разгледай', items: EXPLORE.map(({ id, label, icon }) => ({ id, label, icon })), onSelect: open });
    clickHandler = (id) => { if (id) open(id); };
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${EXPLORE.length}`);
  }

  // ---------- 2. Съюзите се задействат ----------
  function step2() {
    shell.step(1);
    home();
    let mistakes = 0, brush = 'en', fails = 0;
    const painted = {};
    const draw = () => paint((p) => {
      if (p.a === 'x') return POL.x;
      const b = painted[p.a];
      return b === 'en' ? BLOC.E : b === 'ta' ? BLOC.C : BLOC.N;
    }, { mode: '14' });
    draw();
    shell.task('Преди войната Великите сили са в два враждебни блока: <b>Тройният съюз</b> и <b>Антантата</b>. Избери цвят и кликни шестте Велики сили, за да ги оцветиш. После натисни „Провери“.');
    const c = shell.setControls(`<div class="row"><button class="btn primary" data-b="en">🟦 Антанта</button><button class="btn" data-b="ta">🟥 Тройният съюз</button><button class="btn" data-b="none">⬜ Изтрий</button></div>
      <button class="btn primary check">Провери</button>`);
    c.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => {
      brush = b.dataset.b;
      c.querySelectorAll('[data-b]').forEach((x) => x.classList.toggle('primary', x === b));
    }));
    const count = () => shell.score(`Оцветени: ${Object.keys(painted).length} от 6`);
    count();
    clickHandler = (id) => {
      if (!id || !NAME[id]) return;
      if (!GREAT[id]) { shell.msg(`${NAME[id] || 'Тази държава'} не е Велика сила. Оцветяваме само шестте Велики сили.`, 'bad'); return; }
      if (brush === 'none') delete painted[id]; else painted[id] = brush;
      shell.msg('');
      draw(); count();
    };
    c.querySelector('.check').addEventListener('click', () => {
      const missing = Object.keys(GREAT).filter((id) => !painted[id]);
      if (missing.length) { shell.msg('Оцвети и шестте Велики сили. Те са с надписи в менюто от стъпка 1.', 'bad'); return; }
      const wrong = Object.keys(GREAT).filter((id) => painted[id] !== GREAT[id]);
      if (wrong.length) {
        mistakes++; fails++;
        shell.msg(`Провери пак: ${wrong.map((id) => NAME[id]).join(', ')}. Спомни си с кого има договор всяка.`, 'bad');
        if (fails >= 2) { blinkId = wrong[0]; say(anchor14(wrong[0]), `Подсказка: ${esc(NAME[wrong[0]])} е в ${GREAT[wrong[0]] === 'ta' ? 'Тройния съюз' : 'Антантата'}.`, { cls: 'tag' }); }
        return;
      }
      blinkId = null;
      shell.msg('Вярно! Тройният съюз: Германия, Австро-Унгария, Италия. Антантата: Франция, Великобритания, Русия.', 'good');
      say(anchor14('it'), '<b>Внимание:</b> Италия е в Тройния съюз, но през лятото на 1914 г. остава <b>неутрална</b>.' + APPROX, { cls: 'wide' });
      const n = shell.setControls('<button class="btn primary">Какво става след атентата? →</button>');
      n.querySelector('button').addEventListener('click', () => { clearTip(); chain(); });
    });

    // Верижна реакция след Сараево.
    function chain() {
      const war = {};
      const draw2 = () => paint((p) => {
        if (p.a === 'x') return POL.x;
        if (war[p.a]) return war[p.a] === 'E' ? BLOC.E : BLOC.C;
        const g = GREAT[p.a];
        return g === 'en' ? BLOC.Ep : g === 'ta' ? BLOC.Cp : BLOC.N;
      }, { mode: '14' });
      draw2();
      stage.focusOn(sarajevo, { dist: 4.2 * far, height: 4.6 * far, keepFollow: false });
      say(sarajevo, '<b>28 юни 1914 г.</b> Атентатът в Сараево. Бледите цветове са блоковете, наситените — държавите, които вече воюват. Гледай как съюзите въвличат все повече държави.', { cls: 'wide' });
      let k = 0, tries = 0;
      const ask = () => { shell.task(CHAIN[k].ask); shell.score(`Стъпки: ${k} от ${CHAIN.length}`); };
      ask();
      shell.setControls('');
      clickHandler = (id) => {
        if (!id || k >= CHAIN.length || !NAME[id]) return;
        const ch = CHAIN[k];
        if (id !== ch.id) {
          mistakes++; tries++;
          shell.msg(`Това е ${NAME[id] || 'друга земя'}. Помисли пак кой е замесен.`, 'bad');
          if (tries >= 2) { blinkId = ch.id; say(anchor14(ch.id), 'Подсказка: тук', { cls: 'tag' }); }
          return;
        }
        tries = 0; blinkId = null;
        Object.assign(war, ch.war);
        draw2();
        if (ch.from) arrow(CAP[ch.from], CAP[ch.id]);
        if (ch.to) arrow(CAP[ch.id], CAP[ch.to]);
        if (ch.id === 'ru') pulseAt(CAP.ru);
        say(anchor14(ch.id), `<b>${esc(ch.good)}</b>`, { cls: 'good wide' });
        shell.msg('Вярно!', 'good');
        k++;
        if (k < CHAIN.length) { ask(); return; }
        clickHandler = null;
        home();
        events(war, draw2);
      };
    }
    // Още държави влизат във войната: детето пуска събитията едно по едно.
    function events(war, draw2) {
      let i = 0;
      shell.task('Войната не спира дотук. Натискай „Следващото събитие“ и гледай кой още влиза във войната.');
      shell.score(`Събития: 0 от ${EVENTS.length}`);
      const c2 = shell.setControls('<button class="btn primary nextev">Следващото събитие →</button>');
      c2.querySelector('.nextev').addEventListener('click', () => {
        const ev = EVENTS[i];
        if (ev.id === 'usa') { usa.visible = true; arrow([-13.5, 46.5], [-4.5, 48.4]); }
        else war[ev.id] = ev.side;
        draw2();
        const a = ev.id === 'usa' ? usaAnchor : anchor14(ev.id);
        say(a, `<b>${esc(ev.when)}</b><br>${ev.t}`, { cls: 'wide' });
        i++;
        shell.score(`Събития: ${i} от ${EVENTS.length}`);
        if (i >= EVENTS.length) {
          scores.push(stepScore(mistakes, 3));
          shell.task('От Сараево до САЩ: съюзите превръщат войната между две държави в <b>световна война</b>. Синьо — Антантата, червено — Централните сили.');
          const n = shell.setControls('<button class="btn primary">Напред →</button>');
          n.querySelector('button').addEventListener('click', () => { clearTip(); clearArrows(); clearRing(); usa.visible = false; step3(); });
        }
      });
    }
  }

  // ---------- 3. Фронтовете 1914–1918 ----------
  function step3() {
    shell.step(2);
    let mistakes = 0;
    const blocPaint = (year) => { const s = blocsAt(year); paint((p) => (p.a === 'x' ? POL.x : s[p.a] === 'E' ? BLOC.E : s[p.a] === 'C' ? BLOC.C : s[p.a] === 'out' ? BLOC.out : BLOC.N), { mode: '14' }); };
    blocPaint(1914); showYear(1914);
    // А) Западният фронт отблизо.
    shell.task('Първо разгледай Западния фронт отблизо — макета горе вляво. Избери всеки предмет от менюто или кликни върху него.');
    const seen = new Set();
    stage.focusOn(dio, { dist: 2.4 * far, height: 1.8 * far, keepFollow: false });
    const openW = (id) => {
      const it = WEAPONS.find((w) => w.id === id);
      if (!it) return;
      const obj = { trench: tr1, mg, tank: tk, plane: pl, gas }[id];
      stage.focusOn(obj, { dist: 1.3 * far, height: 0.9 * far, keepFollow: id === 'tank' || id === 'plane' });
      say(obj, it.note + '<br><i class="small">Макетът е възстановка.</i>', { cls: 'wide', lift: 0.25 });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${WEAPONS.length}`);
      if (seen.size === WEAPONS.length) {
        const c = shell.setControls('<button class="btn primary">Към картата →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); stage.stopFollow(); slider(); });
      }
    };
    if (menu) menu.remove();
    menu = cornerMenu(stage, { title: 'Нови оръжия', items: WEAPONS.map(({ id, label, icon }) => ({ id, label, icon })), onSelect: openW });
    clickHandler = (id) => { if (WEAPONS.some((w) => w.id === id)) openW(id); };
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${WEAPONS.length}`);

    // Б) Плъзгач по годините.
    function slider() {
      home();
      let k = 0, tries = 0;
      const c = shell.setControls(`<div class="yr-title small"></div>
        <input class="yr-range" type="range" min="0" max="${YEARS.length - 1}" step="1" value="0" style="width:100%">
        <div class="row small" style="justify-content:space-between">${YEARS.map((y) => `<span>${y}</span>`).join('')}</div>
        <div class="yr-legend small"></div>`);
      const range = c.querySelector('.yr-range');
      const year = () => YEARS[+range.value];
      const update = () => {
        const y = year();
        c.querySelector('.yr-title').innerHTML = `<b>${y} г.</b>`;
        c.querySelector('.yr-legend').textContent = LEGEND[y];
        blocPaint(y); showYear(y);
      };
      range.addEventListener('input', () => { clearTip(); update(); });
      update();
      const ask = () => { shell.task(TASKS[k].ask); shell.score(`Задачи: ${k} от ${TASKS.length}`); };
      ask();
      clickHandler = (id) => {
        if (!id || k >= TASKS.length || WEAPONS.some((w) => w.id === id) || id === 'sarajevo') return;
        const t = TASKS[k];
        const mark = MARKS.find((m) => m.id === id);
        if (id === t.id && year() !== t.year) { mistakes++; tries++; shell.msg(`Това е вярното място, но годината не е ${year()} г. Премести плъзгача.`, 'bad'); return; }
        if (id !== t.id) {
          if (mark) { say(pins.get(id), mark.note, { cls: 'wide' }); shell.msg('Добре е да знаеш. Но търсим друго.', ''); return; }
          if (id === 'compiegne') { say(wg, MARKS.find((m) => m.id === 'compiegne').note, { cls: 'wide' }); return; }
          mistakes++; tries++;
          const f = FRONTS.find((x) => x.id === id);
          shell.msg(f ? `Това е ${f.name}. Потърси друг.` : `Това е ${NAME[id] || 'друга земя'}. Търсим фронт или място на картата.`, 'bad');
          if (tries >= 2) {
            const obj = pins.get(t.id) || frontAt(t.id, t.year);
            if (obj && obj.visible) say(pins.get(t.id) || frontAnchor(t.id, t.year), 'Подсказка: тук', { cls: 'tag' });
            else shell.msg(`Подсказка: премести плъзгача на ${t.year} г.`, 'bad');
          }
          return;
        }
        tries = 0;
        const obj = pins.get(id) || frontAnchor(id, year());
        say(obj, `<b>${esc(t.good)}</b>${pins.get(id) ? '' : SCHEME}`, { cls: 'good wide' });
        shell.msg('Вярно!', 'good');
        k++;
        if (k < TASKS.length) { ask(); return; }
        shell.score(`Задачи: ${k} от ${TASKS.length}`);
        const n = shell.setControls('<button class="btn primary">Причини и последици →</button>');
        n.querySelector('button').addEventListener('click', () => { clearTip(); apply(); });
        clickHandler = null;
      };
    }

    // В) Приложи: причина, повод или последица?
    function apply() {
      let i = 0;
      const next = () => {
        if (i >= SORT.length) {
          scores.push(stepScore(mistakes, 3));
          shell.msg('Вярно! Различаваш причини, повод и последици.', 'good');
          const n = shell.setControls('<button class="btn primary">Напред →</button>');
          n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          return;
        }
        shell.task(`Причина, повод или последица на войната е: <b>„${esc(SORT[i].t)}“</b>?`);
        shell.score(`Твърдения: ${i} от ${SORT.length}`);
        const cc = shell.setControls('<div class="row"><button class="btn" data-a="prich">Причина</button><button class="btn" data-a="povod">Повод</button><button class="btn" data-a="posl">Последица</button></div>');
        cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
          if (b.dataset.a !== SORT[i].a) { mistakes++; b.disabled = true; shell.msg(SORT_WHY[SORT[i].a], 'bad'); return; }
          i++; shell.msg('Вярно!', 'good'); next();
        }));
      };
      next();
    }
  }

  // ---------- 4. Предскажи: след войната ----------
  function step4() {
    shell.step(3);
    showYear(null); wg.visible = true; miniPlane.visible = false;
    revealed = new Set();
    const draw = () => paint((p) => (revealed.has(p.a) ? (POL[p.b] ?? POL.x) : (POL[p.a] ?? POL.x)), { mode: 'mix' });
    draw();
    let mistakes = 0, e = 0;
    stage.focusOn(wg, { dist: 2.2 * far, height: 1.8 * far, keepFollow: false });
    say(wg, '<b>11 ноември 1918 г.</b> Във вагон в гората край Компиен Германия подписва примирие. Войната свършва. Победителите събират мирна конференция в Париж (1919 г.).<br><i class="small">Вагонът е възстановка.</i>', { cls: 'wide' });
    shell.task('Четири империи са във войната. Какво става с тях след нея? Предскажи, а картата ще покаже какво наистина се случва.');
    const c0 = shell.setControls('<button class="btn primary">Започни →</button>');
    c0.querySelector('button').addEventListener('click', ask);
    function ask() {
      clearTip();
      const E = EMPIRES[e];
      const a = anchors14.get(E.id);
      stage.focusOn(a, { dist: (E.id === 'ru' ? 6 : 4.4) * far, height: (E.id === 'ru' ? 6 : 4.4) * far, keepFollow: false });
      blinkId = E.id;
      shell.task(E.ask);
      shell.score(`Империи: ${e} от ${EMPIRES.length}`);
      const c = shell.setControls(`<div class="col">${E.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const o = E.opts[+b.dataset.i];
        if (!o.ok) { mistakes++; b.disabled = true; shell.msg(o.why, 'bad'); return; }
        blinkId = null;
        revealed.add(E.id); for (const x of E.also) revealed.add(x);
        draw();
        say(a, E.show + APPROX, { cls: 'good wide' });
        shell.msg('Вярно предсказание!', 'good');
        e++;
        shell.score(`Империи: ${e} от ${EMPIRES.length}`);
        const n = shell.setControls(`<button class="btn primary">${e < EMPIRES.length ? 'Следващата империя →' : 'Виж цялата карта →'}</button>`);
        n.querySelector('button').addEventListener('click', () => { if (e < EMPIRES.length) ask(); else whole(); });
      }));
    }
    function whole() {
      clearTip();
      shell.msg('');
      scores.push(stepScore(mistakes, 2));
      home();
      const show = (m) => {
        if (m === '20') paint((p) => POL[p.b] ?? POL.x, { mode: '20' }); else politics();
        cc.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('primary', b.dataset.m === m));
      };
      shell.task('Това е Европа след мирните договори (около 1923 г.). Сравни я с Европа през 1914 г. с бутоните. Новите държави: Полша, Чехословакия, Австрия, Унгария, Кралството на сърби, хървати и словенци, Финландия, Естония, Латвия и Литва.');
      shell.score('');
      const cc = shell.setControls('<div class="row"><button class="btn" data-m="14">1914 г.</button><button class="btn primary" data-m="20">След войната</button></div><button class="btn primary fin">Виж резултата</button>');
      cc.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => show(b.dataset.m)));
      show('20');
      say(anchors20.get('pl'), 'Империите са изчезнали. На тяхно място има нови държави.' + APPROX, { cls: 'wide' });
      cc.querySelector('.fin').addEventListener('click', () => {
        clearTip();
        const ratio = scores.reduce((s, x) => s + x, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    }
  }

  function restart() {
    clearTip();
    if (menu) menu.remove();
    blinkId = null;
    stage.stopFollow();
    home(0.8);
    step1();
  }

  shell.task('Зареждане на картата…');
  (async () => {
    const r = await fetch('data/geo/europe1914.json');
    if (!r.ok) throw new Error('няма данни');
    geo = await r.json();
    buildMap();
    decor = mapDecor(stage, { pos }, [
      { text: 'Атлантически океан', lon: -8.5, lat: 44.5, sea: true }, { text: 'Средиземно море', lon: 18, lat: 34.5, sea: true },
      { text: 'Черно море', lon: 34, lat: 43.2, sea: true }, { text: 'Северно море', lon: 3.5, lat: 56.5, sea: true }, { text: 'Балтийско море', lon: 19.2, lat: 57.4, sea: true },
    ]);
    loadModern().catch(() => {});
    step1();
  })().catch((err) => shell.msg(`Картата не се зареди: ${err.message}`, 'bad'));

  container.__demo = {
    stage, pos,
    // Екранни координати: държава (по надписа ѝ), фронт, място или предмет.
    at(id, year) {
      let v = null;
      const proj = (p) => { const q = p.clone().project(stage.camera); const rc = stage.renderer.domElement.getBoundingClientRect(); return { x: rc.left + (q.x * 0.5 + 0.5) * rc.width, y: rc.top + (-q.y * 0.5 + 0.5) * rc.height }; };
      if (anchors14.has(id) && !FRONTS.some((f) => f.id === id)) v = anchors14.get(id).getWorldPosition(new THREE.Vector3());
      else if (FRONTS.some((f) => f.id === id)) {
        const g = frontAt(id, year);
        const f = g.userData.f, p = f.pts[Math.floor(f.pts.length / 2)];
        v = pos(p[0], p[1], H + 0.05);
      } else if (pins.has(id)) v = pins.get(id).userData.head.getWorldPosition(new THREE.Vector3());
      else return stage.screenOf(id);
      return proj(v);
    },
  };
  return {
    dispose() {
      if (menu) menu.remove();
      if (decor) decor.dispose();
      badge.remove(); modBtn.remove();
      stage.dispose();
    },
  };
}
