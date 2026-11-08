/* Дупката — 3D игра: дупка в земята поглъща всичко, което е по-малко от нея, и расте.
   Всички модели се строят от прости форми в кода. Без реклами, без външни файлове освен three.js. */
import * as THREE from './three.module.min.js';

// ================= помощни =================
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* без запис */ } },
};
const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* няма */ } };
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
let rng = Math.random;
const R = () => rng();
const RR = (a, b) => a + R() * (b - a);
const pick = (arr) => arr[Math.floor(R() * arr.length)];

// ================= настройки на играта =================
const GROW = 0.045;
const PENALTY = { chicken: 30, sheep: 50, pig: 50, cow: 80 }; // точки, които губиш, ако животно падне в дупката          // колко расте дупката от глътнатата маса
const LEVEL_TIME = 100;      // секунди за ниво
const BATTLE_TIME = 120;     // секунди за битка
const STARS = [0.4, 0.7, 0.95];
const THEMES = ['park', 'city', 'farm', 'downtown', 'cubes', 'food', 'school', 'toys', 'tech'];
const PLAYER_COLOR = '#7c3aed';
const PLAYER_NAMES = { bg: 'Ти', en: 'You' };
const BOTS = [
  { names: { bg: 'Бобо', en: 'Bobo' }, color: '#ef4444' },
  { names: { bg: 'Мира', en: 'Mira' }, color: '#f59e0b' },
  { names: { bg: 'Зико', en: 'Ziko' }, color: '#10b981' },
  { names: { bg: 'Лора', en: 'Lora' }, color: '#3b82f6' },
];
// Единично ниво: размер на картата → полуразмер, време и множител за броя неща
// Сложност на битката: колко бързо растат противниците и колко монети носи
const DIFFS = { easy: { grow: 0.55, coins: 0.6 }, normal: { grow: 1, coins: 1 }, hard: { grow: 1.4, coins: 1.6 } };
const botGrow = () => (cfgCur && cfgCur.kind === 'battle' ? DIFFS[cfgCur.diff || 'normal'].grow : 1);
const SIZES = { s: { L: 24, time: 120, k: 1 }, m: { L: 34, time: 180, k: 2 }, l: { L: 46, time: 300, k: 3.6 } };
// Категории неща; max е за малка карта. small = достатъчно малки, за да се расте от тях.
const CATS = [
  { id: 'animals', ic: '🐄', types: ['chicken', 'sheep', 'pig', 'cow'], max: 30, bad: true },
  { id: 'street', ic: '🪑', types: ['cone', 'hydrant', 'bin', 'lamp', 'bench', 'busstop'], max: 40, small: true },
  { id: 'plants', ic: '🌳', types: ['flowers', 'bush', 'tree', 'pine'], max: 40, small: true },
  { id: 'cars', ic: '🚗', types: ['car'], max: 20 },
  { id: 'farm', ic: '🌾', types: ['pumpkin', 'crate', 'milkcan', 'hay', 'fence', 'trough', 'haystack', 'silo', 'windmill'], max: 30 },
  { id: 'park', ic: '⛲', types: ['statue', 'kiosk', 'slide', 'fountain', 'gazebo'], max: 10 },
  { id: 'big', ic: '🚌', types: ['tractor', 'truck', 'bus'], max: 8 },
  { id: 'houses', ic: '🏠', types: ['house', 'shop', 'barn'], max: 10 },
  { id: 'blocks', ic: '🏢', types: ['block'], max: 4 },
  { id: 'towers', ic: '🏙️', types: ['tower'], max: 3 },
];

const WORLD_KINDS = ['objects', 'cubes', 'food', 'school', 'toys', 'tech'];
const singleWorld = (cfg) => cfg.world || (cfg.cubes ? 'cubes' : 'objects');
// Категории за нива от кубчета (order: по-големите се нареждат първи)
const CUBE_CATS = [
  { id: 'cubes', ic: '🟥', types: ['single', 'single', 'stack'], max: 80, small: true, order: 1 },
  { id: 'bigcubes', ic: '🧊', types: ['bigcube'], max: 20, small: true, order: 2 },
  { id: 'flowers', ic: '🌷', types: ['flower'], max: 30, small: true, order: 1 },
  { id: 'vcars', ic: '🚗', types: ['car'], max: 12, small: true, order: 3 },
  { id: 'vtrees', ic: '🌳', types: ['tree', 'pine', 'tree', 'bigtree'], max: 20, small: true, order: 4 },
  { id: 'vhouses', ic: '🏠', types: ['house'], max: 6, small: true, order: 5 },
  { id: 'vbuildings', ic: '🏢', types: ['building'], max: 6, order: 6 },
  { id: 'vtowers', ic: '🗼', types: ['tower'], max: 3, order: 7 },
  { id: 'pyramids', ic: '🔺', types: ['pyramid'], max: 2, order: 8 },
  { id: 'mega', ic: '🏙️', types: ['mega'], max: 2, order: 9 },
];
const CUBE_CAREER = { cubes: 70, bigcubes: 14, flowers: 24, vcars: 10, vtrees: 16, vhouses: 5, vbuildings: 5, vtowers: 3, pyramids: 1, mega: 1 };

// ================= езици =================
const I18N = {
  bg: {
    title: 'Дупката', logo: 'ДУП<span>КАТА</span>',
    tagline: 'Глътни всичко, което е по-малко от теб, и расти.',
    continue: '▶ Продължи', contSub: (w, tm) => `${w} · остават ${tm}`,
    career: 'Кариера', careerSub: (n, th) => `Ниво ${n} · ${th}`,
    single: 'Единично ниво', singleSub: 'Ти избираш какво и колко да има',
    battle: 'Битка', battleSub: '2 минути срещу 4 дупки',
    how1: 'Плъзни пръст където и да е по екрана, за да движиш дупката.',
    how2: 'Пропада всичко, което е по-малко от дупката. Всяко глътнато нещо носи точки и те прави по-голям.',
    how3: 'Внимавай с животните: ако паднат в дупката, губиш точки.',
    how4: 'В битката по-голяма дупка може да глътне по-малка.', pts: 'т.',
    soundOn: 'Звук: вкл.', soundOff: 'Звук: изкл.',
    install: '📲 Инсталирай на телефона',
    installHint: 'На Android: Chrome → меню ⋮ → „Добавяне към началния екран“. Без реклами, работи и офлайн.',
    difficulty: 'Сложност', diff_easy: 'Лесна', diff_normal: 'Нормална', diff_hard: 'Трудна',
    diffd_easy: 'противниците растат бавно', diffd_normal: 'противниците растат колкото теб', diffd_hard: 'противниците растат бързо',
    diffNote: 'По-трудната битка носи повече монети.',
    mapSize: 'Размер на картата', sizeS: 'Малка', sizeM: 'Средна', sizeL: 'Голяма',
    whatToEat: 'Какво да има', random: '🎲 Случайно',
    needSmall: 'Добави малки неща (категориите най-отгоре), иначе дупката няма с какво да порасне.',
    play: 'Играй', back: 'Назад', paused: 'Пауза', resume: 'Продължи', toMenu: 'Към менюто',
    savedNote: 'Напредъкът ти е запазен. Можеш да продължиш и по-късно от менюто.',
    next: 'Следващо ниво', newSetup: 'Нова настройка', retry: 'Пак същото', newBattle: 'Нова битка',
    level: 'Ниво', size: 'Размер', you: 'Ти',
    upSize: 'Размер', upSpeed: 'Скорост', upTime: 'Време', upLvl: (a, b) => `ниво ${a}/${b}`, max: 'макс.',
    park: 'Парк', city: 'Квартал', farm: 'Ферма', downtown: 'Център', cubes: 'Кубчета',
    food: 'Маса с храна', school: 'Бюро', toys: 'Детска стая', tech: 'Склад',
    kind_objects: '🏙️ Предмети', kind_cubes: '🧊 Кубчета', kind_food: '🍎 Храна', kind_school: '✏️ Бюро', kind_toys: '🧸 Играчки', kind_tech: '💻 Склад',
    cat_f_fruit: 'Плодове', catd_f_fruit: 'грозде, ягоди, ябълки… диня',
    cat_f_sweet: 'Сладкиши', catd_f_sweet: 'бонбони, понички, мъфини, торти',
    cat_f_main: 'Ястия', catd_f_main: 'яйца, сирене, хляб, сандвичи, пица, печено',
    cat_f_dish: 'Съдове', catd_f_dish: 'чаши, бутилки, чинии, чайник, ваза',
    cat_f_piles: 'Купчини', catd_f_piles: 'пирамиди от домати и плодове, кули от суши и палачинки, къща от бисквити',
    cat_s_small: 'Дреболии', catd_s_small: 'кабарчета, кламери, гуми, острилки, листчета',
    cat_s_write: 'За писане', catd_s_write: 'пастели, моливи, химикалки, маркери',
    cat_s_tools: 'Пособия', catd_s_tools: 'линийки, ножици, калкулатори, телбоди',
    cat_s_books: 'Книги и тетрадки', catd_s_books: 'тетрадки, книги, несесери',
    cat_s_big: 'Големи', catd_s_big: 'глобус, лампа, лаптоп, раница',
    cat_t_small: 'Дребни играчки', catd_t_small: 'топчета, лего, кубчета, зарове, патета',
    cat_t_balls: 'Топки', catd_t_balls: 'от топче до плажна топка',
    cat_t_cars: 'Колички и влакчета', catd_t_cars: 'колички, камиони, влакче',
    cat_t_figs: 'Фигурки', catd_t_figs: 'пумпали, мечета, роботи, ракети',
    cat_t_big: 'Големи играчки', catd_t_big: 'ксилофон, барабан, конче, палатка, къща за кукли',
    cat_c_parts: 'Части', catd_c_parts: 'винтове, флашки, процесори, RAM, вентилатори',
    cat_c_peri: 'Периферия', catd_c_peri: 'мишки, камери, кабели, слушалки, клавиатури',
    cat_c_boards: 'Платки и дискове', catd_c_boards: 'дискове, рутери, захранвания, видеокарти',
    cat_c_big: 'Устройства', catd_c_big: 'монитори, кашони, кутии, принтери, сървъри',
    cat_c_store: 'Складови', catd_c_store: 'палети и стелажи',
    levelKind: 'Вид ниво', kindObjects: 'Предмети', kindObjectsD: 'коли, къщи, дървета…', kindCubes: 'Кубчета', kindCubesD: 'всичко е от кубчета',
    cat_cubes: 'Кубчета', catd_cubes: '1–3 едно върху друго',
    cat_bigcubes: 'Големи кубове', catd_bigcubes: 'куб от 8 кубчета',
    cat_flowers: 'Цветя', catd_flowers: 'стрък и цвят',
    cat_vcars: 'Коли', catd_vcars: 'потъват цели',
    cat_vtrees: 'Дървета', catd_vtrees: 'потъват цели, като едно цяло',
    cat_vhouses: 'Къщи', catd_vhouses: 'с покрив, врата и прозорци',
    cat_vbuildings: 'Сгради', catd_vbuildings: 'напр. 3 × 2 кубчета и 10 на височина',
    cat_vtowers: 'Кули', catd_vtowers: 'по-големи кубчета',
    cat_pyramids: 'Пирамиди', catd_pyramids: 'големи кубчета',
    cat_mega: 'Небостъргачи', catd_mega: 'най-големите кубчета',
    eatAll: 'Глътни колкото можеш повече', battleGo: 'Битка!', beBiggest: 'Стани най-голямата дупка',
    gotEaten: (n) => `Глътна те ${n}!`, backSoon: 'Връщаш се след малко', ateHole: (n) => `Глътна ${n}!`,
    backIn: 'Пак си в играта!', welcomeBack: 'Продължаваш',
    levelDone: (n) => `Ниво ${n} премина!`, almost: 'Почти!', done: 'Готово!', need40: 'Нужни са 40% за звезда',
    winner: '🏆 Ти си най-голямата дупка!', place: (n) => `${n}. място`,
    cat_animals: 'Животни', catd_animals: 'внимавай: отнемат точки',
    cat_street: 'Улични неща', catd_street: 'конуси, кошчета, лампи, пейки',
    cat_plants: 'Растения', catd_plants: 'цветя, храсти, дървета',
    cat_cars: 'Коли', catd_cars: 'карат по пътищата',
    cat_farm: 'Ферма', catd_farm: 'тикви, щайги, сено, огради, силози, мелници',
    cat_park: 'Паркови', catd_park: 'статуи, павилиони, пързалки, фонтани',
    cat_big: 'Големи машини', catd_big: 'трактори, камиони, автобуси',
    cat_houses: 'Къщи', catd_houses: 'къщи, магазини, хамбари',
    cat_blocks: 'Блокове', catd_blocks: 'жилищни блокове',
    cat_towers: 'Небостъргачи', catd_towers: 'най-високите сгради',
  },
  en: {
    title: 'The Hole', logo: 'THE <span>HOLE</span>',
    tagline: 'Swallow everything smaller than you and grow.',
    continue: '▶ Continue', contSub: (w, tm) => `${w} · ${tm} left`,
    career: 'Career', careerSub: (n, th) => `Level ${n} · ${th}`,
    single: 'Single level', singleSub: 'You choose what goes on the map',
    battle: 'Battle', battleSub: '2 minutes against 4 holes',
    how1: 'Drag anywhere on the screen to move the hole.',
    how2: 'Anything smaller than the hole falls in. Everything you swallow gives points and makes you bigger.',
    how3: 'Watch out for animals: if one falls into the hole, you lose points.',
    how4: 'In a battle, a bigger hole can swallow a smaller one.', pts: 'pts',
    soundOn: 'Sound: on', soundOff: 'Sound: off',
    install: '📲 Install on your phone',
    installHint: 'On Android: Chrome → menu ⋮ → “Add to Home screen”. No ads, works offline.',
    difficulty: 'Difficulty', diff_easy: 'Easy', diff_normal: 'Normal', diff_hard: 'Hard',
    diffd_easy: 'opponents grow slowly', diffd_normal: 'opponents grow as fast as you', diffd_hard: 'opponents grow fast',
    diffNote: 'Harder battles give more coins.',
    mapSize: 'Map size', sizeS: 'Small', sizeM: 'Medium', sizeL: 'Large',
    whatToEat: 'What goes on the map', random: '🎲 Random',
    needSmall: 'Add some small things (the top categories), or the hole will have nothing to grow on.',
    play: 'Play', back: 'Back', paused: 'Paused', resume: 'Resume', toMenu: 'Main menu',
    savedNote: 'Your progress is saved. You can continue later from the menu.',
    next: 'Next level', newSetup: 'New setup', retry: 'Play again', newBattle: 'New battle',
    level: 'Level', size: 'Size', you: 'You',
    upSize: 'Size', upSpeed: 'Speed', upTime: 'Time', upLvl: (a, b) => `level ${a}/${b}`, max: 'max',
    park: 'Park', city: 'Suburb', farm: 'Farm', downtown: 'Downtown', cubes: 'Blocks',
    food: 'Dinner table', school: 'Desk', toys: 'Playroom', tech: 'Warehouse',
    kind_objects: '🏙️ Objects', kind_cubes: '🧊 Blocks', kind_food: '🍎 Food', kind_school: '✏️ Desk', kind_toys: '🧸 Toys', kind_tech: '💻 Warehouse',
    cat_f_fruit: 'Fruit', catd_f_fruit: 'grapes, strawberries, apples… watermelon',
    cat_f_sweet: 'Sweets', catd_f_sweet: 'candy, donuts, cupcakes, cakes',
    cat_f_main: 'Dishes', catd_f_main: 'eggs, cheese, bread, sandwiches, pizza, roast',
    cat_f_dish: 'Tableware', catd_f_dish: 'cups, bottles, plates, teapot, vase',
    cat_f_piles: 'Piles', catd_f_piles: 'tomato and fruit pyramids, sushi and pancake towers, a biscuit house',
    cat_s_small: 'Bits and bobs', catd_s_small: 'pins, clips, erasers, sharpeners, sticky notes',
    cat_s_write: 'Writing', catd_s_write: 'crayons, pencils, pens, markers',
    cat_s_tools: 'Tools', catd_s_tools: 'rulers, scissors, calculators, staplers',
    cat_s_books: 'Books & notebooks', catd_s_books: 'notebooks, books, pencil cases',
    cat_s_big: 'Big items', catd_s_big: 'globe, lamp, laptop, backpack',
    cat_t_small: 'Small toys', catd_t_small: 'marbles, LEGO, blocks, dice, ducks',
    cat_t_balls: 'Balls', catd_t_balls: 'from marbles to beach balls',
    cat_t_cars: 'Cars & trains', catd_t_cars: 'toy cars, trucks, a train',
    cat_t_figs: 'Figures', catd_t_figs: 'tops, teddies, robots, rockets',
    cat_t_big: 'Big toys', catd_t_big: 'xylophone, drum, rocking horse, tent, dollhouse',
    cat_c_parts: 'Parts', catd_c_parts: 'screws, USB sticks, CPUs, RAM, fans',
    cat_c_peri: 'Peripherals', catd_c_peri: 'mice, webcams, cables, headphones, keyboards',
    cat_c_boards: 'Boards & drives', catd_c_boards: 'drives, routers, PSUs, graphics cards',
    cat_c_big: 'Devices', catd_c_big: 'monitors, boxes, PC cases, printers, servers',
    cat_c_store: 'Storage', catd_c_store: 'pallets and shelving',
    levelKind: 'Level type', kindObjects: 'Objects', kindObjectsD: 'cars, houses, trees…', kindCubes: 'Blocks', kindCubesD: 'everything is made of cubes',
    cat_cubes: 'Cubes', catd_cubes: '1–3 stacked',
    cat_bigcubes: 'Big cubes', catd_bigcubes: 'a cube made of 8 cubes',
    cat_flowers: 'Flowers', catd_flowers: 'stem and bloom',
    cat_vcars: 'Cars', catd_vcars: 'sink in one piece',
    cat_vtrees: 'Trees', catd_vtrees: 'sink in one piece',
    cat_vhouses: 'Houses', catd_vhouses: 'with roof, door and windows',
    cat_vbuildings: 'Buildings', catd_vbuildings: 'e.g. 3 × 2 cubes, 10 tall',
    cat_vtowers: 'Towers', catd_vtowers: 'bigger cubes',
    cat_pyramids: 'Pyramids', catd_pyramids: 'big cubes',
    cat_mega: 'Skyscrapers', catd_mega: 'the biggest cubes',
    eatAll: 'Swallow as much as you can', battleGo: 'Battle!', beBiggest: 'Become the biggest hole',
    gotEaten: (n) => `${n} swallowed you!`, backSoon: 'You will be back in a moment', ateHole: (n) => `You swallowed ${n}!`,
    backIn: 'You are back!', welcomeBack: 'Welcome back',
    levelDone: (n) => `Level ${n} complete!`, almost: 'Almost!', done: 'Done!', need40: '40% needed for a star',
    winner: '🏆 You are the biggest hole!', place: (n) => ['1st', '2nd', '3rd', '4th', '5th'][n - 1] + ' place',
    cat_animals: 'Animals', catd_animals: 'careful: they cost points',
    cat_street: 'Street items', catd_street: 'cones, bins, lamps, benches',
    cat_plants: 'Plants', catd_plants: 'flowers, bushes, trees',
    cat_cars: 'Cars', catd_cars: 'driving on the roads',
    cat_farm: 'Farm', catd_farm: 'pumpkins, crates, hay, fences, silos, windmills',
    cat_park: 'Park features', catd_park: 'statues, kiosks, slides, fountains',
    cat_big: 'Big vehicles', catd_big: 'tractors, trucks, buses',
    cat_houses: 'Houses', catd_houses: 'houses, shops, barns',
    cat_blocks: 'Apartment blocks', catd_blocks: 'residential blocks',
    cat_towers: 'Skyscrapers', catd_towers: 'the tallest buildings',
  },
};
let lang = store.get('dup.lang', null) || ((navigator.language || 'bg').toLowerCase().startsWith('bg') ? 'bg' : 'en');
function t(k, ...a) { const v = (I18N[lang] && I18N[lang][k]) ?? I18N.bg[k] ?? k; return typeof v === 'function' ? v(...a) : v; }

const save = {
  coins: store.get('dup.coins', 0),
  level: store.get('dup.level', 1),
  up: Object.assign({ size: 0, speed: 0, time: 0 }, store.get('dup.up', {})),
  sound: store.get('dup.sound', true),
};
function persist() { store.set('dup.coins', save.coins); store.set('dup.level', save.level); store.set('dup.up', save.up); store.set('dup.sound', save.sound); }
const UPGRADES = [
  { id: 'size', ic: '⭕', nm: 'upSize', max: 10 },
  { id: 'speed', ic: '💨', nm: 'upSpeed', max: 10 },
  { id: 'time', ic: '⏱️', nm: 'upTime', max: 10 },
];
const upCost = (lvl) => Math.round(60 * Math.pow(1.55, lvl));
const startR = () => 0.8 + 0.08 * save.up.size;
const speedMul = () => 1 + 0.06 * save.up.speed;
const extraTime = () => 6 * save.up.time;

// ================= рендериране =================
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, powerPreference: 'high-performance' });
const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.6 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const SKY = new THREE.Color('#8fd3ff');
const scene = new THREE.Scene();
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 60, 160);
const camera = new THREE.PerspectiveCamera(48, 1, 0.5, 500);

const hemi = new THREE.HemisphereLight('#ffffff', '#8a9a70', 1.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3dc', 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

// Материал за всички обекти: цветове по върхове, плоско осветяване и потъмняване под земята.
const objMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
function darkenBelowGround(sh) {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying float vWY;')
    .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\nvWY = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).y;\n#else\nvWY = (modelMatrix * vec4(transformed, 1.0)).y;\n#endif');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vWY;')
    .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb *= clamp(1.0 + vWY * 0.32, 0.06, 1.0);');
}
objMat.onBeforeCompile = darkenBelowGround;

// ================= модели от прости форми =================
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cone: new THREE.ConeGeometry(1, 1, 12),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  cone6: new THREE.ConeGeometry(1, 1, 6),
  ico: new THREE.IcosahedronGeometry(1, 0),
  ico1: new THREE.IcosahedronGeometry(1, 1),
  sph: new THREE.SphereGeometry(1, 10, 7),
  torus: new THREE.TorusGeometry(1, 0.35, 8, 18),
  cyl3: new THREE.CylinderGeometry(1, 1, 1, 3),
};
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function part(L, g, c, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
  L.push({ g, c, m: new THREE.Matrix4().compose(_p, _q, _s) });
}
// кутия с дъно на височина y
const Bx = (L, c, w, h, d, x = 0, y = 0, z = 0, ry = 0) => part(L, G.box, c, x, y + h / 2, z, w, h, d, 0, ry, 0);
const Cy = (L, c, r, h, x = 0, y = 0, z = 0, g = G.cyl) => part(L, g, c, x, y + h / 2, z, r, h, r);
const Co = (L, c, r, h, x = 0, y = 0, z = 0, g = G.cone, ry = 0) => part(L, g, c, x, y + h / 2, z, r, h, r, 0, ry, 0);
const Ba = (L, c, r, x, y, z, sy = 1, g = G.ico) => part(L, g, c, x, y, z, r, r * sy, r);
const wheel = (L, x, z, r = 0.3, w = 0.24) => part(L, G.cyl, '#1f2937', x, r, z, r, w, r, Math.PI / 2, 0, 0);

function merge(parts) {
  let n = 0;
  const list = parts.map((p) => {
    const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    g.applyMatrix4(p.m);
    n += g.attributes.position.count;
    return [g, new THREE.Color(p.c)];
  });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const [g, c] of list) {
    const cnt = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    for (let i = 0; i < cnt; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
    o += cnt;
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

const PAL = {
  skin: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'],
  shirt: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#f8fafc'],
  pants: ['#1e3a8a', '#374151', '#78350f', '#111827', '#64748b'],
  car: ['#ef4444', '#3b82f6', '#f8fafc', '#facc15', '#10b981', '#334155', '#f97316', '#a78bfa', '#06b6d4'],
  wall: ['#fde68a', '#fecaca', '#bfdbfe', '#d9f99d', '#fbcfe8', '#e9d5ff', '#fed7aa', '#f5f5f4'],
  roof: ['#b91c1c', '#7c2d12', '#1e3a8a', '#374151', '#9a3412', '#065f46'],
  block: ['#e5e7eb', '#fcd34d', '#93c5fd', '#fca5a5', '#c4b5fd', '#a7f3d0', '#fdba74', '#cbd5e1'],
  leaf: ['#4ade80', '#22c55e', '#16a34a', '#65a30d', '#84cc16', '#15803d'],
  flower: ['#f43f5e', '#facc15', '#f472b6', '#a78bfa', '#fb923c', '#ffffff'],
};

// Каталог: r = „отпечатък“ — дупката трябва да е поне толкова голяма, за да го глътне.
const T = {
  cone: { r: 0.3, nv: 1, b(L) { Bx(L, '#f97316', 0.6, 0.06, 0.6); Co(L, '#f97316', 0.27, 0.72, 0, 0.05); Cy(L, '#ffffff', 0.17, 0.1, 0, 0.32, 0); } },
  bin: { r: 0.35, nv: 2, b(L) { const c = pick(['#16a34a', '#2563eb', '#4b5563']); Cy(L, c, 0.28, 0.8); Cy(L, '#1f2937', 0.31, 0.07, 0, 0.8, 0); } },
  hydrant: { r: 0.3, nv: 1, b(L) { Cy(L, '#dc2626', 0.17, 0.6); Ba(L, '#dc2626', 0.17, 0, 0.6, 0, 0.8, G.sph); part(L, G.cyl, '#b91c1c', 0, 0.38, 0, 0.08, 0.5, 0.08, Math.PI / 2, 0, 0); } },
  bench: { r: 0.8, nv: 2, b(L) {
    const w = pick(['#a16207', '#92400e', '#166534']);
    Bx(L, w, 1.6, 0.08, 0.45, 0, 0.42, 0); Bx(L, w, 1.6, 0.4, 0.07, 0, 0.55, -0.22);
    Bx(L, '#374151', 0.08, 0.45, 0.45, -0.7); Bx(L, '#374151', 0.08, 0.45, 0.45, 0.7);
  } },
  lamp: { r: 0.35, nv: 1, b(L) { Cy(L, '#374151', 0.2, 0.15); Cy(L, '#374151', 0.07, 4.2); Bx(L, '#374151', 0.7, 0.12, 0.2, 0.3, 4.1); Bx(L, '#fde68a', 0.4, 0.06, 0.16, 0.45, 4.04); } },
  bush: { r: 0.6, nv: 3, b(L) { const c = pick(PAL.leaf); Ba(L, c, 0.62, 0, 0.45, 0, 0.8, G.ico1); Ba(L, c, 0.4, 0.35, 0.4, 0.2, 0.9, G.ico1); } },
  flowers: { r: 0.45, nv: 4, b(L) { Cy(L, '#c2410c', 0.36, 0.4); Ba(L, '#15803d', 0.32, 0, 0.5, 0, 0.6); const f = pick(PAL.flower); for (let i = 0; i < 4; i++) Ba(L, f, 0.1, Math.cos(i * 1.6) * 0.2, 0.68, Math.sin(i * 1.6) * 0.2); } },
  tree: { r: 1.0, nv: 5, b(L) {
    const c = pick(PAL.leaf), h = RR(1.5, 2.1);
    Cy(L, '#7c4a1e', 0.2, h + 0.6);
    Ba(L, c, RR(1.1, 1.35), 0, h + 0.9, 0, 0.95, G.ico1);
    Ba(L, c, RR(0.7, 0.9), RR(-0.3, 0.3), h + 1.8, RR(-0.3, 0.3), 0.9, G.ico1);
  } },
  pine: { r: 0.9, nv: 3, b(L) { const c = pick(['#166534', '#15803d', '#14532d']); Cy(L, '#7c4a1e', 0.18, 0.8); Co(L, c, 1.1, 2.0, 0, 0.6, 0); Co(L, c, 0.8, 1.6, 0, 1.8, 0); Co(L, c, 0.5, 1.2, 0, 2.9, 0); } },
  car: { r: 1.2, nv: 9, b(L) {
    const c = PAL.car[Math.floor(R() * PAL.car.length)];
    Bx(L, c, 2.2, 0.55, 1.05, 0, 0.25); Bx(L, '#9cc9f0', 1.2, 0.48, 0.96, -0.1, 0.8); Bx(L, c, 1.24, 0.08, 1.0, -0.1, 1.28);
    Bx(L, '#fef3c7', 0.05, 0.14, 0.26, 1.1, 0.5, 0.32); Bx(L, '#fef3c7', 0.05, 0.14, 0.26, 1.1, 0.5, -0.32);
    Bx(L, '#b91c1c', 0.05, 0.14, 0.26, -1.1, 0.5, 0.32); Bx(L, '#b91c1c', 0.05, 0.14, 0.26, -1.1, 0.5, -0.32);
    wheel(L, 0.68, 0.5); wheel(L, 0.68, -0.5); wheel(L, -0.68, 0.5); wheel(L, -0.68, -0.5);
  } },
  bus: { r: 2.8, nv: 3, b(L) {
    const c = pick(['#f59e0b', '#2563eb', '#dc2626']);
    Bx(L, c, 5.4, 1.9, 1.95, 0, 0.35); Bx(L, '#1e3a5f', 5.0, 0.62, 1.99, -0.1, 1.2); Bx(L, '#1e3a5f', 0.05, 0.8, 1.6, 2.7, 1.1);
    Bx(L, '#f8fafc', 5.42, 0.1, 1.97, 0, 2.25);
    for (const x of [-1.8, 1.7]) { wheel(L, x, 0.95, 0.42, 0.3); wheel(L, x, -0.95, 0.42, 0.3); }
  } },
  truck: { r: 2.3, nv: 3, b(L) {
    const c = pick(['#dc2626', '#1d4ed8', '#16a34a']);
    Bx(L, c, 1.5, 1.6, 1.9, 1.75, 0.35); Bx(L, '#9cc9f0', 0.05, 0.6, 1.6, 2.5, 1.2);
    Bx(L, pick(['#f8fafc', '#e5e7eb', '#fbbf24']), 3.4, 2.2, 2.0, -0.75, 0.4);
    for (const x of [1.6, -0.4, -1.6]) { wheel(L, x, 0.95, 0.4, 0.3); wheel(L, x, -0.95, 0.4, 0.3); }
  } },
  kiosk: { r: 1.3, nv: 3, b(L) {
    const c = pick(PAL.wall), s = pick(['#ef4444', '#2563eb', '#16a34a']);
    Bx(L, c, 2.0, 2.1, 1.6); Bx(L, '#1e3a5f', 1.4, 0.7, 0.05, 0, 1.0, 0.8); Bx(L, s, 2.3, 0.2, 1.9, 0, 2.1); Bx(L, '#ffffff', 2.3, 0.12, 1.92, 0, 2.3);
  } },
  busstop: { r: 1.5, nv: 1, b(L) {
    Bx(L, '#9cc9f0', 2.6, 2.0, 0.06, 0, 0.1, -0.5); Bx(L, '#374151', 2.9, 0.12, 1.2, 0, 2.1, 0);
    Bx(L, '#374151', 0.1, 2.1, 0.1, -1.35, 0, -0.5); Bx(L, '#374151', 0.1, 2.1, 0.1, 1.35, 0, -0.5);
    Bx(L, '#a16207', 1.8, 0.08, 0.4, 0, 0.45, -0.25);
  } },
  fountain: { r: 2.0, nv: 1, b(L) {
    Cy(L, '#cbd5e1', 2.0, 0.5); Cy(L, '#60a5fa', 1.75, 0.52); Cy(L, '#cbd5e1', 0.3, 1.5);
    Cy(L, '#cbd5e1', 0.8, 0.15, 0, 1.4, 0); Ba(L, '#93c5fd', 0.4, 0, 1.8, 0, 1.4, G.sph);
  } },
  statue: { r: 1.1, nv: 2, b(L) {
    const c = pick(['#b45309', '#64748b']);
    Bx(L, '#d6d3d1', 1.4, 1.2, 1.4); Cy(L, c, 0.25, 1.1, 0, 1.2, 0); Ba(L, c, 0.2, 0, 2.5, 0, 1, G.sph);
    part(L, G.box, c, 0.3, 2.3, 0, 0.12, 0.7, 0.12, 0, 0, -0.8);
  } },
  gazebo: { r: 2.3, nv: 2, b(L) {
    const c = pick(['#f8fafc', '#fde68a']);
    Cy(L, '#d6d3d1', 2.3, 0.25, 0, 0, 0, G.cyl6);
    for (let i = 0; i < 6; i++) Cy(L, c, 0.1, 2.3, Math.cos(i * Math.PI / 3) * 2, 0.2, Math.sin(i * Math.PI / 3) * 2);
    Co(L, pick(PAL.roof), 2.7, 1.4, 0, 2.4, 0, G.cone6);
  } },
  slide: { r: 1.7, nv: 2, b(L) {
    const c = pick(['#ef4444', '#3b82f6', '#facc15']);
    Bx(L, '#f8fafc', 1.0, 1.8, 1.0, -1.0); Bx(L, c, 1.1, 0.1, 1.1, -1.0, 1.8);
    part(L, G.box, c, 0.35, 1.0, 0, 2.2, 0.08, 0.8, 0, 0, -0.75);
    Bx(L, '#374151', 0.08, 1.8, 0.08, -1.45, 0, 0.45); Bx(L, '#374151', 0.08, 1.8, 0.08, -1.45, 0, -0.45);
  } },
  house: { r: 3.1, nv: 8, b(L) {
    const w = pick(PAL.wall), rf = pick(PAL.roof);
    Bx(L, w, 5, 3, 5); part(L, G.cone4, rf, 0, 3 + 1.2, 0, 3.95, 2.4, 3.95, 0, Math.PI / 4, 0);
    Bx(L, '#7c2d12', 0.9, 1.7, 0.1, 0, 0, 2.5);
    for (const x of [-1.6, 1.6]) Bx(L, '#bfe3ff', 0.9, 0.9, 0.1, x, 1.4, 2.5);
    for (const z of [-1.2, 1.2]) { Bx(L, '#bfe3ff', 0.1, 0.9, 0.9, 2.5, 1.4, z); Bx(L, '#bfe3ff', 0.1, 0.9, 0.9, -2.5, 1.4, z); }
    Bx(L, '#78716c', 0.6, 1.6, 0.6, 1.3, 3.6, -1.0);
  } },
  shop: { r: 3.8, nv: 5, b(L) {
    const w = pick(PAL.wall), s = pick(['#ef4444', '#2563eb', '#16a34a', '#f59e0b']);
    Bx(L, w, 7, 3.6, 5); Bx(L, '#1e3a5f', 5.6, 1.6, 0.1, 0, 0.3, 2.5);
    for (let i = 0; i < 6; i++) Bx(L, i % 2 ? '#ffffff' : s, 7.2 / 6, 0.18, 1.3, -3.0 + i * 1.2, 2.25, 2.95);
    Bx(L, s, 3, 0.7, 0.15, 0, 2.8, 2.55); Bx(L, '#a8a29e', 7.2, 0.3, 5.2, 0, 3.6);
  } },
  block: { r: 4.7, nv: 6, b(L, v) {
    const c = pick(PAL.block), h = 9 + (v % 4) * 3;
    Bx(L, c, 8, h, 8);
    for (let y = 1.2; y < h - 1; y += 3) { Bx(L, '#1e3a5f', 8.06, 1.0, 6.6, 0, y); Bx(L, '#1e3a5f', 6.6, 1.0, 8.06, 0, y); }
    Bx(L, '#64748b', 8.3, 0.35, 8.3, 0, h); Bx(L, '#94a3b8', 2, 1.2, 1.6, 1.5, h + 0.35, -1.5);
    Bx(L, '#7c2d12', 1.4, 2.0, 0.1, 0, 0, 4.0);
  } },
  tower: { r: 5.8, nv: 4, b(L, v) {
    const c = pick(['#cbd5e1', '#93c5fd', '#a5b4fc', '#e2e8f0']), h = 22 + v * 3;
    Bx(L, c, 9, h, 9);
    for (let y = 1.5; y < h - 1; y += 2.5) { Bx(L, '#1e3a5f', 9.06, 1.2, 7.6, 0, y); Bx(L, '#1e3a5f', 7.6, 1.2, 9.06, 0, y); }
    Bx(L, '#475569', 6, 2, 6, 0, h); Cy(L, '#475569', 0.15, 5, 0, h + 2, 0); Ba(L, '#ef4444', 0.3, 0, h + 7.1, 0, 1, G.sph);
  } },
  // ферма
  hay: { r: 0.8, nv: 1, b(L) { part(L, G.cyl, '#e8c25a', 0, 0.62, 0, 0.62, 1.2, 0.62, 0, 0, Math.PI / 2); part(L, G.cyl, '#d4a73c', 0, 0.62, 0, 0.5, 1.22, 0.5, 0, 0, Math.PI / 2); } },
  haystack: { r: 1.6, nv: 1, b(L) { for (const [x, y] of [[-0.65, 0], [0.65, 0], [0, 0.8]]) Bx(L, '#e8c25a', 1.25, 0.8, 1.8, x, y); } },
  cow: { r: 1.0, nv: 3, b(L) {
    const c = pick(['#f8fafc', '#78350f', '#f5f5f4']), sp = c === '#78350f' ? '#f8fafc' : '#111827';
    Bx(L, c, 1.6, 0.75, 0.75, 0, 0.55); Bx(L, sp, 0.6, 0.5, 0.78, -0.3, 0.7); Bx(L, sp, 0.4, 0.4, 0.78, 0.4, 0.6);
    Bx(L, c, 0.55, 0.5, 0.48, 0.95, 0.95); Bx(L, '#fda4af', 0.2, 0.25, 0.4, 1.25, 0.9);
    Bx(L, '#e5e7eb', 0.08, 0.2, 0.08, 0.95, 1.45, 0.18); Bx(L, '#e5e7eb', 0.08, 0.2, 0.08, 0.95, 1.45, -0.18);
    for (const x of [-0.6, 0.6]) for (const z of [-0.25, 0.25]) Bx(L, c, 0.15, 0.55, 0.15, x, 0, z);
  } },
  sheep: { r: 0.65, nv: 2, b(L) {
    Ba(L, '#f8fafc', 0.55, 0, 0.75, 0, 0.8, G.ico1); Bx(L, '#1f2937', 0.35, 0.35, 0.3, 0.55, 0.8);
    for (const x of [-0.25, 0.25]) for (const z of [-0.2, 0.2]) Bx(L, '#1f2937', 0.1, 0.45, 0.1, x, 0, z);
  } },
  pig: { r: 0.65, nv: 1, b(L) {
    Bx(L, '#f9a8d4', 1.0, 0.55, 0.6, 0, 0.28); Bx(L, '#f9a8d4', 0.35, 0.4, 0.45, 0.6, 0.38); Bx(L, '#f472b6', 0.1, 0.18, 0.22, 0.8, 0.45);
    for (const x of [-0.3, 0.3]) for (const z of [-0.18, 0.18]) Bx(L, '#f472b6', 0.12, 0.3, 0.12, x, 0, z);
  } },
  chicken: { r: 0.25, nv: 2, b(L) { const c = pick(['#f8fafc', '#b45309']); Ba(L, c, 0.2, 0, 0.3, 0, 0.9, G.sph); Ba(L, c, 0.12, 0.15, 0.5, 0, 1, G.sph); Bx(L, '#f59e0b', 0.1, 0.05, 0.05, 0.28, 0.5); Bx(L, '#dc2626', 0.06, 0.08, 0.04, 0.15, 0.62); } },
  fence: { r: 0.9, nv: 1, b(L) { for (const x of [-1.4, 0, 1.4]) Bx(L, '#a16207', 0.12, 1.0, 0.12, x); Bx(L, '#ca8a04', 3, 0.12, 0.06, 0, 0.4); Bx(L, '#ca8a04', 3, 0.12, 0.06, 0, 0.75); } },
  tractor: { r: 1.6, nv: 2, b(L) {
    const c = pick(['#16a34a', '#dc2626']);
    Bx(L, c, 1.9, 0.9, 1.0, 0.3, 0.5); Bx(L, c, 1.0, 1.2, 1.1, -0.5, 1.0); Bx(L, '#9cc9f0', 0.9, 0.6, 1.12, -0.5, 1.35);
    Bx(L, '#1f2937', 1.1, 0.1, 1.2, -0.5, 2.2); Cy(L, '#374151', 0.08, 0.6, 0.9, 1.3, 0);
    wheel(L, -0.6, 0.7, 0.7, 0.4); wheel(L, -0.6, -0.7, 0.7, 0.4); wheel(L, 0.9, 0.6, 0.4, 0.3); wheel(L, 0.9, -0.6, 0.4, 0.3);
  } },
  barn: { r: 4.3, nv: 2, b(L) {
    const c = pick(['#b91c1c', '#9a3412']);
    Bx(L, c, 7, 4.5, 6); part(L, G.cone4, '#44403c', 0, 4.5 + 1.6, 0, 5.2, 3.2, 4.6, 0, Math.PI / 4, 0);
    Bx(L, '#f8fafc', 2.6, 3.0, 0.1, 0, 0, 3.0); Bx(L, c, 2.2, 2.6, 0.12, 0, 0.2, 3.0);
    part(L, G.box, '#f8fafc', 0, 1.5, 3.08, 0.15, 3.3, 0.05, 0, 0, 0.75); part(L, G.box, '#f8fafc', 0, 1.5, 3.08, 0.15, 3.3, 0.05, 0, 0, -0.75);
  } },
  silo: { r: 1.8, nv: 2, b(L) { const c = pick(['#cbd5e1', '#e5e7eb']); Cy(L, c, 1.6, 7); for (let y = 1; y < 7; y += 1.5) Cy(L, '#94a3b8', 1.63, 0.15, 0, y, 0); Ba(L, '#94a3b8', 1.6, 0, 7, 0, 0.6, G.sph); } },
  windmill: { r: 2.3, nv: 1, b(L) {
    Co(L, '#f5f5f4', 2.0, 9, 0, 0, 0, G.cone6); Bx(L, '#7c2d12', 1.1, 1.1, 1.3, 0, 7.6, 0.4);
    for (let i = 0; i < 4; i++) part(L, G.box, '#f8fafc', Math.cos(i * Math.PI / 2 + 0.4) * 2.3, 8.2 + Math.sin(i * Math.PI / 2 + 0.4) * 2.3, 1.2, 4.6, 0.7, 0.08, 0, 0, i * Math.PI / 2 + 0.4);
  } },
  pumpkin: { r: 0.4, nv: 2, b(L) { Ba(L, pick(['#f97316', '#ea580c']), 0.36, 0, 0.3, 0, 0.75, G.ico1); Bx(L, '#3f6212', 0.07, 0.18, 0.07, 0, 0.52); Ba(L, '#65a30d', 0.12, 0.12, 0.55, 0.05, 0.4); } },
  crate: { r: 0.45, nv: 2, b(L) { Bx(L, '#c08a4b', 0.62, 0.62, 0.62); Bx(L, '#8b5a2b', 0.64, 0.08, 0.64, 0, 0.15); Bx(L, '#8b5a2b', 0.64, 0.08, 0.64, 0, 0.42); } },
  milkcan: { r: 0.3, nv: 1, b(L) { Cy(L, '#cbd5e1', 0.2, 0.55); Cy(L, '#94a3b8', 0.13, 0.15, 0, 0.55, 0); Cy(L, '#94a3b8', 0.16, 0.05, 0, 0.7, 0); } },
  trough: { r: 0.9, nv: 1, b(L) { Bx(L, '#78716c', 1.8, 0.5, 0.7); Bx(L, '#60a5fa', 1.6, 0.05, 0.5, 0, 0.47); } },
};

// ================= нови светове: храна, бюро, играчки, склад =================
const PI = Math.PI;
const lie = (L, c, r, len, x = 0, y = null, z = 0, g = G.cyl, ry = 0) => part(L, g, c, x, y === null ? r : y, z, r, len, r, 0, ry, PI / 2); // легнал цилиндър по оста x
const ring = (L, c, R, tube, x, y, z, rx = PI / 2, ry = 0) => part(L, G.torus, c, x, y, z, R, R, tube / 0.35, rx, ry, 0);
const IN_PAL = {
  bright: ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
  pastel: ['#fecaca', '#fde68a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fbcfe8'],
};
Object.assign(T, {
  // ---- храна ----
  grape: { r: 0.2, nv: 2, b(L, v) { Ba(L, v ? '#65a30d' : '#7e22ce', 0.18, 0, 0.18, 0, 1, G.sph); } },
  cherry: { r: 0.2, nv: 1, b(L) { Ba(L, '#b91c1c', 0.16, 0, 0.16, 0, 1, G.sph); part(L, G.box, '#3f6212', 0.03, 0.4, 0, 0.03, 0.28, 0.03, 0, 0, -0.3); } },
  strawberry: { r: 0.25, nv: 1, b(L) { part(L, G.cone, '#dc2626', 0, 0.2, 0, 0.2, 0.36, 0.2, PI, 0, 0); Cy(L, '#16a34a', 0.16, 0.05, 0, 0.36, 0); } },
  candy: { r: 0.25, nv: 4, b(L) { const c = pick(IN_PAL.bright); Ba(L, c, 0.13, 0, 0.13, 0, 1, G.sph); part(L, G.cone, c, 0.2, 0.13, 0, 0.1, 0.14, 0.1, 0, 0, PI / 2); part(L, G.cone, c, -0.2, 0.13, 0, 0.1, 0.14, 0.1, 0, 0, -PI / 2); } },
  egg: { r: 0.25, nv: 2, b(L, v) { Ba(L, v ? '#fef3c7' : '#f8fafc', 0.17, 0, 0.22, 0, 1.3, G.sph); } },
  cookie: { r: 0.35, nv: 2, b(L) { Cy(L, '#d6a15c', 0.33, 0.1); for (let i = 0; i < 5; i++) Bx(L, '#3f2a14', 0.07, 0.03, 0.07, Math.cos(i * 1.3) * 0.18, 0.1, Math.sin(i * 1.3) * 0.18); } },
  apple: { r: 0.4, nv: 3, b(L, v) { Ba(L, ['#dc2626', '#65a30d', '#facc15'][v], 0.36, 0, 0.33, 0, 0.9, G.ico1); Bx(L, '#3f2a14', 0.04, 0.18, 0.04, 0, 0.62); Ba(L, '#16a34a', 0.08, 0.08, 0.7, 0, 0.4); } },
  orange: { r: 0.4, nv: 1, b(L) { Ba(L, '#f97316', 0.37, 0, 0.36, 0, 1, G.ico1); Bx(L, '#16a34a', 0.06, 0.04, 0.06, 0, 0.72); } },
  pear: { r: 0.4, nv: 1, b(L) { Ba(L, '#bef264', 0.33, 0, 0.3, 0, 0.9, G.ico1); Ba(L, '#bef264', 0.21, 0, 0.62, 0, 1.1, G.ico1); Bx(L, '#3f2a14', 0.04, 0.16, 0.04, 0, 0.82); } },
  banana: { r: 0.6, nv: 1, b(L) { for (let i = -2; i <= 2; i++) part(L, G.box, '#facc15', i * 0.22, 0.12 + Math.abs(i) * 0.06, 0, 0.26, 0.18, 0.2, 0, 0, i * 0.25); Bx(L, '#3f2a14', 0.06, 0.06, 0.06, 0.55, 0.22); } },
  donut: { r: 0.5, nv: 3, b(L) { ring(L, '#d6a15c', 0.36, 0.13, 0, 0.13, 0); ring(L, pick(['#f472b6', '#7c2d12', '#f8fafc']), 0.36, 0.1, 0, 0.2, 0); } },
  cupcake: { r: 0.45, nv: 3, b(L) { part(L, G.cyl, '#f9a8d4', 0, 0.17, 0, 0.3, 0.34, 0.3); Ba(L, pick(['#fdf2f8', '#fde68a', '#bfdbfe']), 0.34, 0, 0.42, 0, 0.75, G.ico1); Ba(L, '#dc2626', 0.09, 0, 0.68, 0, 1, G.sph); } },
  cheese: { r: 0.55, nv: 1, b(L) { part(L, G.cyl3, '#facc15', 0, 0.25, 0, 0.6, 0.5, 0.6); Ba(L, '#eab308', 0.07, 0.15, 0.3, 0.28, 1, G.sph); } },
  bread: { r: 0.8, nv: 1, b(L) { Bx(L, '#d97706', 1.4, 0.45, 0.75); part(L, G.sph, '#b45309', 0, 0.45, 0, 0.7, 0.25, 0.37); for (const x of [-0.4, 0, 0.4]) Bx(L, '#fde68a', 0.06, 0.05, 0.5, x, 0.66); } },
  sandwich: { r: 0.75, nv: 2, b(L) { const lay = ['#f5deb3', '#16a34a', '#facc15', '#ef4444', '#f5deb3']; lay.forEach((c, i) => Bx(L, c, 1.05 - (i % 2 ? 0 : 0.05), i % 4 === 0 ? 0.16 : 0.07, 1.05, 0, i * 0.1)); } },
  cup: { r: 0.5, nv: 3, b(L) { const c = pick(['#f8fafc', '#3b82f6', '#ef4444']); Cy(L, c, 0.33, 0.7); Cy(L, '#3f2a14', 0.28, 0.02, 0, 0.69, 0); ring(L, c, 0.18, 0.06, 0.38, 0.38, 0, 0, 0); } },
  bottle: { r: 0.4, nv: 3, b(L) { const c = pick(['#16a34a', '#0ea5e9', '#a16207']); Cy(L, c, 0.28, 1.1); Co(L, c, 0.28, 0.3, 0, 1.1, 0); Cy(L, c, 0.1, 0.35, 0, 1.3, 0); Cy(L, '#f8fafc', 0.12, 0.1, 0, 1.62, 0); Cy(L, '#fef3c7', 0.29, 0.35, 0, 0.35, 0); } },
  plate: { r: 1.0, nv: 2, b(L) { Cy(L, '#f8fafc', 1.0, 0.08); Cy(L, '#e5e7eb', 0.7, 0.1); Ba(L, '#f97316', 0.25, 0.25, 0.3, 0.1, 0.8, G.ico1); Ba(L, '#16a34a', 0.22, -0.3, 0.25, -0.1, 0.7, G.ico1); Bx(L, '#b45309', 0.5, 0.15, 0.3, 0, 0.1, 0.35); } },
  fruitbowl: { r: 1.1, nv: 1, b(L) { Cy(L, '#e5e7eb', 0.55, 0.15); part(L, G.cone, '#f1f5f9', 0, 0.55, 0, 1.0, 0.6, 1.0, PI, 0, 0); [['#dc2626', 0.3, 0], ['#f97316', -0.3, 0.1], ['#facc15', 0, -0.35], ['#65a30d', 0, 0.35], ['#7e22ce', 0.1, 0]].forEach(([c, x, z], i) => Ba(L, c, 0.32, x, 0.95 + (i === 4 ? 0.3 : 0), z, 1, G.ico1)); } },
  pizza: { r: 1.4, nv: 1, b(L) { Cy(L, '#d97706', 1.4, 0.12); Cy(L, '#fbbf24', 1.25, 0.15); for (let i = 0; i < 9; i++) Cy(L, '#b91c1c', 0.15, 0.04, Math.cos(i * 0.7) * (0.3 + (i % 3) * 0.3), 0.15, Math.sin(i * 0.7) * (0.3 + (i % 3) * 0.3)); } },
  teapot: { r: 0.9, nv: 2, b(L) { const c = pick(['#f8fafc', '#93c5fd']); Ba(L, c, 0.62, 0, 0.55, 0, 0.85, G.ico1); part(L, G.cone, c, 0.75, 0.75, 0, 0.12, 0.6, 0.12, 0, 0, -1.0); ring(L, c, 0.28, 0.07, -0.7, 0.6, 0, 0, 0); Cy(L, c, 0.3, 0.1, 0, 1.05, 0); Ba(L, c, 0.1, 0, 1.2, 0, 1, G.sph); } },
  watermelon: { r: 1.2, nv: 1, b(L) { part(L, G.ico1, '#15803d', 0, 0.75, 0, 1.15, 0.75, 0.9); } },
  cake: { r: 1.5, nv: 2, b(L) { Cy(L, pick(['#fbcfe8', '#7c2d12']), 1.4, 0.9); Cy(L, '#fdf2f8', 1.45, 0.14, 0, 0.88, 0); for (let i = 0; i < 8; i++) Ba(L, '#dc2626', 0.12, Math.cos(i * 0.785) * 1.1, 1.08, Math.sin(i * 0.785) * 1.1, 1, G.sph); Cy(L, '#60a5fa', 0.05, 0.4, 0, 1.0, 0); Ba(L, '#facc15', 0.07, 0, 1.47, 0, 1.4, G.sph); } },
  vase: { r: 0.9, nv: 2, b(L) { Cy(L, pick(['#3b82f6', '#a855f7']), 0.45, 1.5); Cy(L, '#16a34a', 0.05, 0.6, 0, 1.5, 0); for (let i = 0; i < 5; i++) Ba(L, pick(['#f43f5e', '#facc15', '#f8fafc']), 0.22, Math.cos(i * 1.25) * 0.3, 2.1 + (i % 2) * 0.15, Math.sin(i * 1.25) * 0.3, 1, G.ico1); } },
  roast: { r: 1.8, nv: 1, b(L) { Cy(L, '#f8fafc', 1.8, 0.1); Ba(L, '#b45309', 1.1, 0, 0.7, 0, 0.6, G.ico1); for (const z of [-0.5, 0.5]) { part(L, G.cyl, '#92400e', 1.0, 0.6, z, 0.18, 0.7, 0.18, 0, 0, -1.1); Ba(L, '#fef3c7', 0.1, 1.35, 0.85, z, 1, G.sph); } for (let i = 0; i < 6; i++) Ba(L, i % 2 ? '#16a34a' : '#f97316', 0.18, Math.cos(i) * 1.45, 0.2, Math.sin(i) * 1.45, 0.8, G.ico); } },
  weddingcake: { r: 2.4, nv: 1, b(L) { Cy(L, '#f8fafc', 2.3, 1.2); Cy(L, '#fdf2f8', 1.6, 1.1, 0, 1.2, 0); Cy(L, '#f8fafc', 1.0, 1.0, 0, 2.3, 0); for (const [R2, y] of [[2.3, 1.2], [1.6, 2.3], [1.0, 3.3]]) for (let i = 0; i < 10; i++) Ba(L, '#f9a8d4', 0.13, Math.cos(i * 0.628) * R2, y, Math.sin(i * 0.628) * R2, 1, G.sph); Ba(L, '#f43f5e', 0.3, 0, 3.6, 0, 1, G.ico1); } },
  // ---- бюро ----
  pin: { r: 0.15, nv: 3, b(L) { Cy(L, pick(IN_PAL.bright), 0.12, 0.1, 0, 0.12, 0); Cy(L, '#cbd5e1', 0.02, 0.12); } },
  clip: { r: 0.25, nv: 1, b(L) { for (const z of [-0.07, 0.07]) Bx(L, '#94a3b8', 0.45, 0.03, 0.025, 0, 0, z); for (const x of [-0.22, 0.22]) Bx(L, '#94a3b8', 0.025, 0.03, 0.16, x, 0, 0); } },
  eraser: { r: 0.25, nv: 2, b(L) { Bx(L, pick(['#f9a8d4', '#f8fafc']), 0.45, 0.16, 0.24); Bx(L, '#3b82f6', 0.18, 0.165, 0.245, 0.14); } },
  sharpener: { r: 0.25, nv: 2, b(L) { Bx(L, pick(['#ef4444', '#3b82f6', '#94a3b8']), 0.32, 0.24, 0.26); Cy(L, '#1f2937', 0.07, 0.02, 0, 0.24, 0); } },
  crayon: { r: 0.5, nv: 6, b(L) { const c = pick(IN_PAL.bright); lie(L, c, 0.1, 0.8); part(L, G.cone, c, 0.5, 0.1, 0, 0.1, 0.2, 0.1, 0, 0, -PI / 2); lie(L, '#f8fafc', 0.105, 0.3, -0.1); } },
  pencil: { r: 0.8, nv: 3, b(L) { lie(L, pick(['#facc15', '#ef4444', '#22c55e']), 0.1, 1.3, 0, 0.1, 0, G.cyl6); part(L, G.cone, '#f5deb3', 0.75, 0.1, 0, 0.1, 0.2, 0.1, 0, 0, -PI / 2); part(L, G.cone, '#374151', 0.85, 0.1, 0, 0.035, 0.07, 0.035, 0, 0, -PI / 2); lie(L, '#cbd5e1', 0.105, 0.08, -0.69); lie(L, '#f9a8d4', 0.1, 0.12, -0.79); } },
  pen: { r: 0.75, nv: 3, b(L) { const c = pick(['#1d4ed8', '#111827', '#dc2626']); lie(L, '#e5e7eb', 0.08, 1.3); lie(L, c, 0.09, 0.45, -0.45); part(L, G.cone, '#94a3b8', 0.7, 0.08, 0, 0.07, 0.15, 0.07, 0, 0, -PI / 2); Bx(L, c, 0.35, 0.03, 0.03, -0.45, 0.16); } },
  marker: { r: 0.6, nv: 4, b(L) { const c = pick(IN_PAL.bright); lie(L, '#f8fafc', 0.15, 0.85); lie(L, c, 0.16, 0.35, 0.4); lie(L, c, 0.155, 0.08, -0.4); } },
  gluestick: { r: 0.3, nv: 2, b(L) { Cy(L, '#f8fafc', 0.18, 0.55); Cy(L, pick(['#7c3aed', '#ef4444']), 0.19, 0.25, 0, 0.55, 0); } },
  notes: { r: 0.55, nv: 3, b(L) { Bx(L, pick(['#fde047', '#f9a8d4', '#86efac']), 0.9, 0.3, 0.9); } },
  ruler: { r: 1.5, nv: 2, b(L) { Bx(L, pick(['#fde047', '#e0f2fe']), 3, 0.05, 0.5); for (let i = 0; i < 15; i++) Bx(L, '#1f2937', 0.02, 0.01, i % 5 ? 0.12 : 0.22, -1.4 + i * 0.2, 0.05, -0.18 + (i % 5 ? 0 : 0.05)); } },
  scissors: { r: 0.8, nv: 2, b(L) { const c = pick(['#ef4444', '#3b82f6']); part(L, G.box, '#cbd5e1', 0.35, 0.04, 0.06, 0.9, 0.04, 0.1, 0, 0.18, 0); part(L, G.box, '#cbd5e1', 0.35, 0.06, -0.06, 0.9, 0.04, 0.1, 0, -0.18, 0); ring(L, c, 0.2, 0.06, -0.4, 0.05, 0.18); ring(L, c, 0.2, 0.06, -0.4, 0.05, -0.18); } },
  calculator: { r: 0.75, nv: 1, b(L) { Bx(L, '#334155', 0.95, 0.18, 1.35); Bx(L, '#a7f3d0', 0.75, 0.02, 0.3, 0, 0.18, -0.42); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) Bx(L, j === 3 ? '#f97316' : '#e5e7eb', 0.16, 0.04, 0.14, -0.3 + j * 0.2, 0.18, -0.1 + i * 0.2); } },
  stapler: { r: 0.8, nv: 2, b(L) { const c = pick(['#111827', '#dc2626']); Bx(L, '#374151', 1.4, 0.15, 0.4); part(L, G.box, c, 0, 0.3, 0, 1.35, 0.22, 0.36, 0, 0, 0.06); } },
  tape: { r: 0.55, nv: 1, b(L) { Bx(L, '#334155', 0.9, 0.35, 0.4); part(L, G.cyl, '#e0f2fe', 0, 0.45, 0, 0.32, 0.3, 0.32, PI / 2, 0, 0); } },
  pencilcup: { r: 0.6, nv: 2, b(L) { Cy(L, pick(['#0ea5e9', '#f97316']), 0.38, 0.8); for (let i = 0; i < 5; i++) part(L, G.cyl6, pick(IN_PAL.bright), Math.cos(i * 1.25) * 0.15, 1.0, Math.sin(i * 1.25) * 0.15, 0.06, 0.9, 0.06, Math.sin(i) * 0.2, 0, Math.cos(i) * 0.2); } },
  notebook: { r: 1.5, nv: 4, b(L) { const c = pick(IN_PAL.bright); Bx(L, c, 1.8, 0.05, 2.4); Bx(L, '#f8fafc', 1.75, 0.14, 2.35, 0.02, 0.05); Bx(L, c, 1.8, 0.05, 2.4, 0, 0.19); for (let z = -1.05; z < 1.1; z += 0.3) Ba(L, '#94a3b8', 0.07, -0.88, 0.12, z, 1, G.sph); } },
  book: { r: 1.4, nv: 5, b(L) { const c = pick(['#1d4ed8', '#b91c1c', '#15803d', '#7c3aed', '#a16207']); Bx(L, c, 1.6, 0.06, 2.2); Bx(L, '#f8fafc', 1.5, 0.36, 2.1, 0.03, 0.06); Bx(L, c, 1.6, 0.06, 2.2, 0, 0.42); Bx(L, c, 0.06, 0.48, 2.2, -0.8, 0); } },
  pencilcase: { r: 1.0, nv: 3, b(L) { const c = pick(IN_PAL.bright); Bx(L, c, 1.8, 0.5, 0.7); Bx(L, '#111827', 1.7, 0.04, 0.05, 0, 0.5); Bx(L, '#cbd5e1', 0.12, 0.12, 0.05, 0.7, 0.45, 0.04); } },
  globe: { r: 1.0, nv: 1, b(L) { Cy(L, '#7c2d12', 0.6, 0.15); Cy(L, '#a16207', 0.06, 0.6, 0, 0.15, 0); Ba(L, '#38bdf8', 0.8, 0, 1.55, 0, 1, G.ico1); for (let i = 0; i < 5; i++) Ba(L, '#22c55e', 0.3, Math.cos(i * 1.3) * 0.6, 1.55 + Math.sin(i * 2.1) * 0.4, Math.sin(i * 1.3) * 0.6, 0.7, G.ico); } },
  lamp: { r: 1.0, nv: 2, b(L) { const c = pick(['#111827', '#f8fafc']); Cy(L, c, 0.5, 0.12); part(L, G.box, c, 0.2, 0.9, 0, 0.08, 1.6, 0.08, 0, 0, -0.25); part(L, G.box, c, 0.65, 1.75, 0, 0.08, 1.0, 0.08, 0, 0, 1.0); part(L, G.cone, c, 1.0, 1.5, 0, 0.35, 0.5, 0.35, 0, 0, 0.6); Ba(L, '#fef3c7', 0.13, 1.05, 1.35, 0, 1, G.sph); } },
  laptop: { r: 1.9, nv: 2, b(L) { const c = pick(['#94a3b8', '#334155']); Bx(L, c, 2.4, 0.12, 1.7); Bx(L, '#1f2937', 2.1, 0.02, 0.9, 0, 0.12, -0.2); Bx(L, '#64748b', 0.7, 0.02, 0.45, 0, 0.12, 0.5); part(L, G.box, c, 0, 0.85, -0.95, 2.4, 1.6, 0.08, -0.25, 0, 0); part(L, G.box, '#38bdf8', 0, 0.85, -0.9, 2.15, 1.35, 0.02, -0.25, 0, 0); } },
  bookstack: { r: 1.8, nv: 2, b(L) { let y = 0; for (let i = 0; i < 5; i++) { const h = 0.3 + R() * 0.25; part(L, G.box, pick(['#1d4ed8', '#b91c1c', '#15803d', '#7c3aed', '#a16207', '#0f766e']), RR(-0.15, 0.15), y + h / 2, RR(-0.15, 0.15), 1.7 - i * 0.08, h, 2.3 - i * 0.1, 0, RR(-0.3, 0.3), 0); y += h; } } },
  backpack: { r: 1.6, nv: 3, b(L) { const c = pick(['#dc2626', '#2563eb', '#16a34a']); Bx(L, c, 1.6, 2.0, 1.0); Ba(L, c, 0.8, 0, 2.0, 0, 0.4, G.sph); Bx(L, '#111827', 1.1, 0.8, 0.3, 0, 0.3, 0.6); Bx(L, '#111827', 0.2, 1.4, 0.15, -0.5, 0.4, -0.55); Bx(L, '#111827', 0.2, 1.4, 0.15, 0.5, 0.4, -0.55); } },
  // ---- играчки ----
  marble: { r: 0.15, nv: 4, b(L) { Ba(L, pick(['#38bdf8', '#f43f5e', '#a3e635', '#fbbf24']), 0.14, 0, 0.14, 0, 1, G.sph); } },
  lego: { r: 0.35, nv: 6, b(L) { const c = pick(IN_PAL.bright); Bx(L, c, 0.64, 0.35, 0.32); for (const x of [-0.24, -0.08, 0.08, 0.24]) Cy(L, c, 0.06, 0.07, x, 0.35, 0); } },
  toyblock: { r: 0.35, nv: 6, b(L) { const c = pick(IN_PAL.bright); Bx(L, '#f5deb3', 0.5, 0.5, 0.5); Bx(L, c, 0.3, 0.3, 0.02, 0, 0.1, 0.25); Bx(L, c, 0.02, 0.3, 0.3, 0.25, 0.1, 0); Bx(L, c, 0.3, 0.02, 0.3, 0, 0.5, 0); } },
  dice: { r: 0.3, nv: 2, b(L, v) { Bx(L, v ? '#ef4444' : '#f8fafc', 0.42, 0.42, 0.42); const d = v ? '#f8fafc' : '#111827'; for (const [x, z] of [[-0.1, -0.1], [0, 0], [0.1, 0.1]]) Bx(L, d, 0.07, 0.02, 0.07, x, 0.42, z); } },
  duck: { r: 0.35, nv: 1, b(L) { Ba(L, '#facc15', 0.3, 0, 0.22, 0, 0.75, G.ico1); Ba(L, '#facc15', 0.18, 0.18, 0.5, 0, 1, G.ico1); part(L, G.cone, '#f97316', 0.38, 0.48, 0, 0.07, 0.15, 0.07, 0, 0, -PI / 2); } },
  toycar: { r: 0.6, nv: 6, b(L) { const c = pick(IN_PAL.bright); Bx(L, c, 1.0, 0.25, 0.5, 0, 0.1); Bx(L, '#bfdbfe', 0.5, 0.22, 0.45, -0.05, 0.35); for (const x of [-0.33, 0.33]) for (const z of [-0.25, 0.25]) part(L, G.cyl, '#111827', x, 0.12, z, 0.12, 0.08, 0.12, PI / 2, 0, 0); } },
  top: { r: 0.4, nv: 3, b(L) { const c = pick(IN_PAL.bright); part(L, G.cone, c, 0, 0.18, 0, 0.35, 0.36, 0.35, PI, 0, 0); Cy(L, c, 0.35, 0.12, 0, 0.36, 0); Cy(L, '#7c2d12', 0.05, 0.3, 0, 0.48, 0); } },
  ball: { r: 0.6, nv: 5, b(L) { const c = pick(IN_PAL.bright); Ba(L, c, 0.55, 0, 0.55, 0, 1, G.ico1); part(L, G.torus, '#f8fafc', 0, 0.55, 0, 0.55, 0.55, 0.1, 0, 0.5, 0); } },
  teddy: { r: 0.8, nv: 2, b(L) { const c = pick(['#a16207', '#d6a15c']); Ba(L, c, 0.5, 0, 0.5, 0, 1.1, G.ico1); Ba(L, c, 0.38, 0, 1.15, 0, 1, G.ico1); for (const z of [-0.25, 0.25]) { Ba(L, c, 0.13, 0, 1.45, z, 1, G.sph); Ba(L, c, 0.18, 0.15, 0.6, z * 2.2, 1.2, G.sph); Ba(L, c, 0.2, 0.25, 0.15, z * 1.3, 1, G.sph); } Ba(L, '#fde68a', 0.14, 0.32, 1.1, 0, 0.8, G.sph); Ba(L, '#111827', 0.05, 0.43, 1.13, 0, 1, G.sph); } },
  robot: { r: 0.7, nv: 3, b(L) { const c = pick(['#94a3b8', '#60a5fa', '#f87171']); Bx(L, c, 0.25, 0.4, 0.2, 0, 0, -0.18); Bx(L, c, 0.25, 0.4, 0.2, 0, 0, 0.18); Bx(L, c, 0.55, 0.6, 0.7, 0, 0.4); Bx(L, c, 0.45, 0.4, 0.45, 0, 1.0); Bx(L, '#fde047', 0.02, 0.1, 0.3, 0.23, 1.15); Cy(L, '#111827', 0.03, 0.25, 0, 1.4, 0); Ba(L, '#ef4444', 0.06, 0, 1.68, 0, 1, G.sph); Bx(L, c, 0.15, 0.5, 0.12, 0, 0.45, -0.45); Bx(L, c, 0.15, 0.5, 0.12, 0, 0.45, 0.45); } },
  rocket: { r: 0.5, nv: 2, b(L) { Cy(L, '#f8fafc', 0.3, 1.4, 0, 0.2, 0); Co(L, '#ef4444', 0.3, 0.6, 0, 1.6, 0); Ba(L, '#38bdf8', 0.1, 0.28, 1.1, 0, 1, G.sph); for (let i = 0; i < 3; i++) part(L, G.box, '#ef4444', Math.cos(i * 2.1) * 0.35, 0.35, Math.sin(i * 2.1) * 0.35, 0.25, 0.5, 0.05, 0, -i * 2.1, 0); } },
  xylophone: { r: 1.2, nv: 1, b(L) { Bx(L, '#7c2d12', 2.2, 0.2, 0.15, 0, 0, -0.5); Bx(L, '#7c2d12', 2.2, 0.2, 0.15, 0, 0, 0.5); IN_PAL.bright.forEach((c, i) => Bx(L, c, 0.2, 0.08, 1.3 - i * 0.08, -0.9 + i * 0.26, 0.2)); } },
  drum: { r: 1.0, nv: 2, b(L) { const c = pick(['#ef4444', '#2563eb']); Cy(L, c, 0.8, 0.8); Cy(L, '#f8fafc', 0.82, 0.06, 0, 0.8, 0); Cy(L, '#facc15', 0.82, 0.08, 0, 0.1, 0); part(L, G.cyl, '#a16207', 0.3, 0.95, 0.2, 0.04, 0.9, 0.04, 0, 0, 1.2); } },
  toytruck: { r: 1.4, nv: 3, b(L) { const c = pick(IN_PAL.bright); Bx(L, c, 0.9, 0.7, 1.0, 0.8, 0.25); Bx(L, '#bfdbfe', 0.05, 0.3, 0.8, 1.25, 0.55); Bx(L, pick(IN_PAL.bright), 1.5, 0.7, 1.0, -0.45, 0.25); for (const x of [-0.8, 0, 0.8]) for (const z of [-0.5, 0.5]) part(L, G.cyl, '#111827', x, 0.22, z, 0.22, 0.12, 0.22, PI / 2, 0, 0); } },
  train: { r: 1.8, nv: 2, b(L) { Bx(L, '#dc2626', 1.0, 0.6, 0.7, 1.1, 0.2); Bx(L, '#dc2626', 0.5, 0.5, 0.7, 0.85, 0.8); Cy(L, '#111827', 0.12, 0.4, 1.45, 0.8, 0); Bx(L, '#2563eb', 0.9, 0.55, 0.7, 0, 0.2); Bx(L, '#16a34a', 0.9, 0.55, 0.7, -1.05, 0.2); for (const x of [-1.3, -0.8, -0.25, 0.25, 0.8, 1.35]) for (const z of [-0.36, 0.36]) part(L, G.cyl, '#111827', x, 0.15, z, 0.15, 0.06, 0.15, PI / 2, 0, 0); } },
  blocktower: { r: 0.9, nv: 3, b(L) { for (let i = 0; i < 6; i++) part(L, G.box, pick(IN_PAL.bright), RR(-0.1, 0.1), 0.25 + i * 0.5, RR(-0.1, 0.1), 0.5, 0.5, 0.5, 0, RR(-0.4, 0.4), 0); } },
  beachball: { r: 1.3, nv: 1, b(L) { Ba(L, '#f8fafc', 1.2, 0, 1.2, 0, 1, G.ico1); for (const [c, a] of [['#ef4444', 0], ['#3b82f6', 2.1], ['#facc15', 4.2]]) part(L, G.sph, c, Math.cos(a) * 0.35, 1.2, Math.sin(a) * 0.35, 0.9, 1.15, 0.9); } },
  rockinghorse: { r: 1.6, nv: 2, b(L) { const c = pick(['#f8fafc', '#a16207']); for (const z of [-0.35, 0.35]) part(L, G.torus, '#7c2d12', 0, 1.0, z, 1.4, 1.0, 0.25, 0, 0, 0); Bx(L, '#7c2d12', 1.5, 0.12, 0.8, 0, 0.12); for (const x of [-0.5, 0.5]) for (const z of [-0.3, 0.3]) Bx(L, c, 0.15, 0.7, 0.15, x, 0.2, z); Bx(L, c, 1.4, 0.55, 0.6, 0, 0.9); part(L, G.box, c, 0.8, 1.55, 0, 0.35, 0.9, 0.4, 0, 0, -0.5); Bx(L, c, 0.6, 0.35, 0.35, 1.05, 1.75); Bx(L, '#ef4444', 0.6, 0.12, 0.62, 0, 1.45); } },
  toybox: { r: 2.0, nv: 2, b(L) { const c = pick(['#2563eb', '#a16207']); Bx(L, c, 3, 1.5, 2); Bx(L, '#facc15', 3.05, 0.15, 2.05, 0, 0.7); part(L, G.box, c, 0, 2.2, -1.3, 3, 0.15, 1.9, 1.2, 0, 0); Ba(L, '#ef4444', 0.45, -0.7, 1.6, 0, 1, G.ico1); Bx(L, '#22c55e', 0.5, 0.5, 0.5, 0.6, 1.4, 0.2); Ba(L, '#a16207', 0.35, 0.1, 1.7, 0.4, 1, G.ico1); } },
  tent: { r: 2.2, nv: 2, b(L) { Co(L, pick(['#ef4444', '#3b82f6']), 2.1, 2.2, 0, 0, 0, G.cone6); Co(L, '#f8fafc', 1.6, 1.0, 0, 2.0, 0, G.cone6); Bx(L, '#111827', 0.8, 1.1, 0.1, 0, 0, 1.75); Cy(L, '#facc15', 0.04, 0.6, 0, 3.0, 0); Bx(L, '#facc15', 0.5, 0.3, 0.02, 0.25, 3.3); } },
  dollhouse: { r: 2.6, nv: 2, b(L) { const c = pick(['#fbcfe8', '#fde68a']); Bx(L, c, 3.6, 2.6, 2.4); Bx(L, '#f8fafc', 3.5, 0.1, 2.3, 0, 1.3); part(L, G.cone4, '#be185d', 0, 2.6 + 0.9, 0, 2.8, 1.8, 2.0, 0, PI / 4, 0); for (const x of [-1, 0, 1]) for (const y of [0.6, 1.8]) Bx(L, '#bfdbfe', 0.5, 0.5, 0.05, x, y, 1.2); Bx(L, '#7c2d12', 0.5, 0.9, 0.06, 0, 0, 1.21); } },
  // ---- склад ----
  screw: { r: 0.15, nv: 1, b(L) { Cy(L, '#94a3b8', 0.05, 0.3); Cy(L, '#cbd5e1', 0.12, 0.06, 0, 0.3, 0); } },
  usb: { r: 0.25, nv: 3, b(L) { Bx(L, pick(['#111827', '#2563eb', '#dc2626']), 0.35, 0.1, 0.16); Bx(L, '#cbd5e1', 0.14, 0.07, 0.13, 0.24, 0.015); } },
  ram: { r: 0.6, nv: 2, b(L) { Bx(L, '#15803d', 1.2, 0.05, 0.32); for (let i = 0; i < 4; i++) Bx(L, '#111827', 0.2, 0.05, 0.2, -0.42 + i * 0.28, 0.05); Bx(L, '#facc15', 1.1, 0.055, 0.05, 0, 0, 0.14); } },
  cpu: { r: 0.35, nv: 1, b(L) { Bx(L, '#15803d', 0.5, 0.05, 0.5); Bx(L, '#cbd5e1', 0.38, 0.06, 0.38, 0, 0.05); } },
  ssd: { r: 0.45, nv: 2, b(L) { Bx(L, '#1f2937', 0.8, 0.08, 0.55); Bx(L, pick(['#ef4444', '#3b82f6']), 0.5, 0.01, 0.35, 0, 0.08); } },
  fan: { r: 0.5, nv: 1, b(L) { Bx(L, '#111827', 0.8, 0.2, 0.8); Cy(L, '#374151', 0.37, 0.21); Cy(L, '#111827', 0.12, 0.22); for (let i = 0; i < 5; i++) part(L, G.box, '#4b5563', Math.cos(i * 1.256) * 0.22, 0.12, Math.sin(i * 1.256) * 0.22, 0.25, 0.02, 0.1, 0, -i * 1.256, 0); } },
  mouse: { r: 0.4, nv: 2, b(L) { part(L, G.sph, pick(['#111827', '#f8fafc']), 0, 0.12, 0, 0.42, 0.22, 0.28); Bx(L, '#64748b', 0.02, 0.03, 0.08, 0.25, 0.3); } },
  cable: { r: 0.5, nv: 2, b(L) { for (let i = 0; i < 3; i++) ring(L, pick(['#111827', '#f8fafc']), 0.38 - i * 0.02, 0.04, 0, 0.05 + i * 0.07, 0); } },
  headphones: { r: 0.7, nv: 2, b(L) { const c = pick(['#111827', '#ef4444']); part(L, G.torus, c, 0, 0.45, 0, 0.5, 0.5, 0.1, 0, 0, 0); for (const x of [-0.5, 0.5]) part(L, G.cyl, c, x, 0.2, 0, 0.25, 0.18, 0.25, 0, 0, PI / 2); } },
  webcam: { r: 0.35, nv: 1, b(L) { Cy(L, '#374151', 0.2, 0.08); Cy(L, '#374151', 0.04, 0.3, 0, 0.08, 0); Ba(L, '#111827', 0.22, 0, 0.55, 0, 1, G.sph); Ba(L, '#38bdf8', 0.08, 0.2, 0.55, 0, 1, G.sph); } },
  keyboard: { r: 1.4, nv: 2, b(L, v) { const c = v ? '#f1f5f9' : '#1f2937', k = v ? '#cbd5e1' : '#374151'; Bx(L, c, 2.6, 0.12, 0.9); for (let i = 0; i < 4; i++) for (let j = 0; j < 12; j++) Bx(L, k, 0.17, 0.06, 0.15, -1.1 + j * 0.2, 0.12, -0.3 + i * 0.2); } },
  hdd: { r: 0.75, nv: 1, b(L) { Bx(L, '#94a3b8', 1.0, 0.2, 1.4); Bx(L, '#f8fafc', 0.6, 0.01, 0.5, 0, 0.2, -0.2); Bx(L, '#15803d', 0.8, 0.02, 0.4, 0, 0, 0.55); } },
  gpu: { r: 1.2, nv: 2, b(L) { Bx(L, '#1f2937', 2.2, 0.4, 1.0); for (const x of [-0.5, 0.5]) { Cy(L, '#111827', 0.4, 0.42, x, 0, 0); Cy(L, '#4b5563', 0.12, 0.43, x, 0, 0); } Bx(L, '#cbd5e1', 0.06, 0.6, 1.0, -1.12, -0.05); Bx(L, pick(['#ef4444', '#22c55e']), 2.0, 0.02, 0.04, 0, 0.4, 0.5); } },
  motherboard: { r: 1.6, nv: 1, b(L) { Bx(L, '#166534', 2.4, 0.06, 2.4); Bx(L, '#cbd5e1', 0.5, 0.12, 0.5, -0.3, 0.06, -0.3); for (let i = 0; i < 4; i++) Bx(L, '#111827', 0.08, 0.1, 1.2, 0.4 + i * 0.15, 0.06, -0.2); Bx(L, '#111827', 0.6, 0.1, 0.25, -0.6, 0.06, 0.7); Bx(L, '#64748b', 0.25, 0.3, 0.9, -1.05, 0.06, -0.5); Cy(L, '#facc15', 0.08, 0.15, 0.6, 0.06, 0.8); } },
  psu: { r: 0.9, nv: 1, b(L) { Bx(L, '#111827', 1.2, 0.8, 1.0); Cy(L, '#374151', 0.35, 0.02, 0, 0.8, 0); Bx(L, '#facc15', 0.3, 0.2, 0.02, 0.3, 0.3, 0.5); } },
  router: { r: 0.8, nv: 1, b(L) { Bx(L, '#f8fafc', 1.2, 0.25, 0.8); for (const x of [-0.45, 0, 0.45]) part(L, G.cyl, '#111827', x, 0.6, -0.38, 0.04, 0.7, 0.04, -0.15, 0, 0); for (let i = 0; i < 4; i++) Bx(L, '#22c55e', 0.05, 0.02, 0.02, -0.3 + i * 0.2, 0.25, 0.3); } },
  monitor: { r: 1.6, nv: 2, b(L) { Bx(L, '#1f2937', 1.0, 0.06, 0.6); Bx(L, '#1f2937', 0.15, 0.8, 0.1, 0, 0.06, -0.1); Bx(L, '#1f2937', 2.8, 1.7, 0.12, 0, 0.6, 0); Bx(L, pick(['#38bdf8', '#a78bfa']), 2.6, 1.5, 0.01, 0, 0.7, 0.07); } },
  pccase: { r: 1.4, nv: 3, b(L) { Bx(L, pick(['#111827', '#f8fafc', '#334155']), 1.0, 2.2, 2.0); Bx(L, '#38bdf8', 0.02, 1.6, 1.3, 0.51, 0.3, 0); Cy(L, '#22c55e', 0.06, 0.02, 0, 2.2, 0.8); } },
  printer: { r: 1.5, nv: 1, b(L) { Bx(L, '#e5e7eb', 2.0, 0.9, 1.5); Bx(L, '#f8fafc', 1.4, 0.04, 0.6, 0, 0.9, -0.5); part(L, G.box, '#f8fafc', 0, 1.15, -0.6, 1.3, 0.5, 0.02, -0.3, 0, 0); Bx(L, '#334155', 1.3, 0.1, 0.2, 0, 0.35, 0.75); } },
  cardbox: { r: 1.2, nv: 3, b(L) { Bx(L, '#c8955a', 1.6, 1.2, 1.4); Bx(L, '#a16207', 1.62, 0.02, 0.2, 0, 1.2); Bx(L, '#f8fafc', 0.4, 0.3, 0.01, 0.4, 0.5, 0.7); } },
  server: { r: 1.8, nv: 1, b(L) { Bx(L, '#111827', 1.4, 3.2, 1.4); for (let y = 0.3; y < 3; y += 0.3) { Bx(L, '#374151', 1.3, 0.22, 0.02, 0, y, 0.7); Bx(L, R() < 0.5 ? '#22c55e' : '#38bdf8', 0.06, 0.06, 0.03, 0.5, y + 0.08, 0.71); } } },
  pallet: { r: 2.2, nv: 2, b(L) { for (const z of [-0.8, 0, 0.8]) Bx(L, '#a16207', 2.6, 0.15, 0.3, 0, 0, z); for (let x = -1.1; x <= 1.15; x += 0.55) Bx(L, '#ca8a04', 0.4, 0.06, 2.0, x, 0.15); for (const x of [-0.6, 0.6]) for (const z of [-0.5, 0.5]) for (let y = 0; y < 2; y++) Bx(L, y % 2 ? '#c8955a' : '#b98546', 1.15, 0.9, 0.95, x, 0.21 + y * 0.9, z); } },
  shelf: { r: 3.0, nv: 2, b(L) { for (const x of [-2.5, 2.5]) for (const z of [-0.6, 0.6]) Bx(L, '#f97316', 0.12, 4.2, 0.12, x, 0, z); for (const y of [0.3, 1.6, 2.9, 4.1]) Bx(L, '#64748b', 5.1, 0.1, 1.3, 0, y); for (const y of [0.4, 1.7, 3.0]) for (let i = 0; i < 4; i++) Bx(L, pick(['#c8955a', '#b98546', '#e5e7eb', '#1f2937']), 1.0, 0.9 + R() * 0.25, 1.0, -1.8 + i * 1.2, y); } },
});

// Светове на закрито: повърхност, фон и категории (types: от малки към големи)
const INDOOR = {
  food: { bg: '#f3e3cc', margin: '#8b5a2b', cats: [
    { id: 'f_fruit', ic: '🍎', types: ['grape', 'cherry', 'strawberry', 'apple', 'orange', 'pear', 'banana', 'watermelon'], max: 120, small: true },
    { id: 'f_sweet', ic: '🧁', types: ['candy', 'cookie', 'donut', 'cupcake', 'cake', 'weddingcake'], max: 90, small: true },
    { id: 'f_main', ic: '🥪', types: ['egg', 'cheese', 'bread', 'sandwich', 'pizza', 'roast'], max: 60 },
    { id: 'f_dish', ic: '🍽️', types: ['cup', 'bottle', 'plate', 'fruitbowl', 'teapot', 'vase'], max: 42 },
    { id: 'f_piles', ic: '🍅', types: ['pancakeStack', 'sushiTower', 'tomatoPyr', 'fruitPyr', 'biscuitHouse'], max: 9 },
  ] },
  school: { bg: '#e7e2d8', margin: '#5b3a1f', cats: [
    { id: 's_small', ic: '📎', types: ['pin', 'clip', 'eraser', 'sharpener', 'gluestick', 'notes'], max: 120, small: true },
    { id: 's_write', ic: '✏️', types: ['crayon', 'pencil', 'pen', 'marker'], max: 90, small: true },
    { id: 's_tools', ic: '📐', types: ['ruler', 'scissors', 'calculator', 'stapler', 'tape', 'pencilcup'], max: 48 },
    { id: 's_books', ic: '📚', types: ['notebook', 'book', 'pencilcase', 'bookstack'], max: 36 },
    { id: 's_big', ic: '🎒', types: ['globe', 'lamp', 'laptop', 'backpack'], max: 15 },
  ] },
  toys: { bg: '#dbeafe', margin: '#9a6b3c', cats: [
    { id: 't_small', ic: '🧱', types: ['marble', 'lego', 'toyblock', 'dice', 'duck'], max: 135, small: true },
    { id: 't_balls', ic: '⚽', types: ['marble', 'ball', 'beachball'], max: 42, small: true },
    { id: 't_cars', ic: '🚂', types: ['toycar', 'toytruck', 'train'], max: 36 },
    { id: 't_figs', ic: '🧸', types: ['top', 'teddy', 'robot', 'rocket', 'blocktower'], max: 42 },
    { id: 't_big', ic: '🎪', types: ['xylophone', 'drum', 'rockinghorse', 'toybox', 'tent', 'dollhouse'], max: 21 },
  ] },
  tech: { bg: '#d4d8dd', margin: '#6b7280', cats: [
    { id: 'c_parts', ic: '🔩', types: ['screw', 'usb', 'cpu', 'ssd', 'ram', 'fan'], max: 135, small: true },
    { id: 'c_peri', ic: '🖱️', types: ['mouse', 'webcam', 'cable', 'headphones', 'keyboard'], max: 66, small: true },
    { id: 'c_boards', ic: '🎛️', types: ['hdd', 'router', 'psu', 'gpu', 'motherboard'], max: 42 },
    { id: 'c_big', ic: '🖥️', types: ['monitor', 'cardbox', 'pccase', 'printer', 'server'], max: 30 },
    { id: 'c_store', ic: '📦', types: ['pallet', 'shelf'], max: 12 },
  ] },
};

function paintIndoor(kind, P, L, E, blocks) {
  const g = P.g;
  if (kind === 'food') {
    // карирана покривка
    P.rect(-L, -L, L, L, '#fff7ed');
    for (let x = -L; x < L; x += 2) P.rect(x, -L, x + 1, L, 'rgba(220,38,38,.45)');
    for (let z = -L; z < L; z += 2) P.rect(-L, z, L, z + 1, 'rgba(220,38,38,.45)');
  } else if (kind === 'school') {
    P.rect(-L, -L, L, L, '#c8955a');
    for (let i = 0; i < L * 3; i++) { const z = RR(-L, L); P.line(-L, z, L, z + RR(-1, 1), RR(0.05, 0.2), 'rgba(120,70,30,.25)'); }
    P.rect(-L * 0.55, -L * 0.45, L * 0.55, L * 0.45, '#1f5f3f');            // подложка за писане
    P.rect(-L * 0.53, -L * 0.43, L * 0.53, L * 0.43, '#2d7a52');
  } else if (kind === 'toys') {
    P.rect(-L, -L, L, L, '#d9b07a');
    for (let z = -L; z < L; z += 1.5) { P.line(-L, z, L, z, 0.06, 'rgba(90,55,20,.35)'); for (let x = -L + ((z / 1.5) % 2) * 2; x < L; x += 4) P.line(x, z, x, z + 1.5, 0.06, 'rgba(90,55,20,.35)'); }
    ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'].forEach((c, i) => P.circle(0, 0, L * 0.6 - i * L * 0.1, c));
  } else {
    P.rect(-L, -L, L, L, '#9aa3ad');
    for (let x = -L; x < L; x += 4) P.line(x, -L, x, L, 0.05, 'rgba(0,0,0,.12)');
    for (let z = -L; z < L; z += 4) P.line(-L, z, L, z, 0.05, 'rgba(0,0,0,.12)');
    if (!blocks) { P.line(-L, 0, L, 0, 0.4, '#facc15'); P.line(0, -L, 0, L, 0.4, '#facc15'); }
    for (let x = -L; x < L; x += 1.2) { P.line(x, -L + 0.3, x + 0.6, -L + 0.9, 0.3, '#111827'); }
  }
  // ръб на масата / бюрото
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.8 * P.ppu; g.strokeRect(P.X(-L), P.X(-L), 2 * L * P.ppu, 2 * L * P.ppu);
}

const rOf = (tp) => (T[tp] ? T[tp].r : PREFABS[tp].r);
// Подредени светове: предметите се нареждат в редици, групирани по вид (като на витрина / в склад).
const ORDERED = {
  food: { gap: (r) => 0.15 + r * 0.2, typeGap: 0.5, rowGap: 0.35, catGap: 1.8 },
  tech: { gap: (r) => 0.25 + r * 0.12, typeGap: 0.6, rowGap: 0.7, catGap: 2.6 },
};
function planRows(L, cats, counts, o) {
  const maxX = L - 1.5, rows = [], blocks = [];
  let z = 0;
  for (const c of cats) {
    const n = counts[c.id] || 0;
    if (!n) continue;
    const weights = c.types.map((tp) => 1 / Math.sqrt(rOf(tp)));
    const wsum = weights.reduce((s, w) => s + w, 0);
    const pickType = () => { let r = R() * wsum; for (let i = 0; i < c.types.length; i++) { r -= weights[i]; if (r <= 0) return c.types[i]; } return c.types[0]; };
    const list = [];
    for (let i = 0; i < n; i++) list.push(pickType());
    list.sort((a, b) => rOf(a) - rOf(b) || (a < b ? -1 : a > b ? 1 : 0)); // по размер, после по вид
    if (blocks.length) z += o.catGap;
    const block = { z0: z, z1: z, rows: [] };
    let row = null, prev = null;
    const newRow = () => { if (row) z = row.z0 + row.h + o.rowGap; row = { z0: z, h: 0, x: -maxX, items: [] }; rows.push(row); block.rows.push(row); prev = null; };
    newRow();
    for (const tp of list) {
      const r = rOf(tp), cell = 2 * r + o.gap(r);
      let x = row.x + (prev && tp !== prev ? o.typeGap : 0);
      if (x + cell > maxX && row.items.length) { newRow(); x = row.x; }
      row.items.push({ tp, x: x + cell / 2 });
      row.x = x + cell; row.h = Math.max(row.h, cell); prev = tp;
    }
    block.z1 = row.z0 + row.h;
    z = block.z1;
    blocks.push(block);
  }
  // центрирай по височина; редовете, които не се събират, отпадат
  const off = -z / 2;
  const plan = [];
  for (const b of blocks) { b.z0 += off; b.z1 += off; }
  for (const row of rows) {
    const zc = row.z0 + off + row.h / 2;
    if (Math.abs(zc) + row.h / 2 > L - 1) continue;
    const shift = (maxX - row.x) / 2; // центрирай реда хоризонтално
    for (const it of row.items) plan.push({ tp: it.tp, x: it.x + shift, z: zc });
  }
  return { plan, H: z, blocks: blocks.filter((b) => b.z1 > -L && b.z0 < L) };
}

function layoutIndoor(kind, L, counts) {
  const def = INDOOR[kind], E = L + 30;
  const { cv, P } = makeGroundCanvas(E, def.margin);
  if (ORDERED[kind]) {
    // ако не се събира, намали броя на всеки вид пропорционално (вместо да отпадат цели редици)
    let cnt = { ...counts }, res;
    const room = 2 * (L - 1.2), seed = rng;
    for (let k = 0; k < 6; k++) {
      const st0 = Math.floor(seed() * 1e9);
      rng = mulberry32(st0);
      res = planRows(L, def.cats, cnt, ORDERED[kind]);
      if (res.H <= room) break;
      const f = (room / res.H) * 0.97;
      for (const id in cnt) cnt[id] = cnt[id] > 0 ? Math.max(1, Math.floor(cnt[id] * f)) : 0;
    }
    rng = seed;
    const { plan, blocks } = res;
    paintIndoor(kind, P, L, E, blocks);
    const m = L - 0.8;
    for (const b of blocks) {
      if (kind === 'food') { P.rect(-m, b.z0 - 0.4, m, b.z1 + 0.4, 'rgba(255,253,247,.92)'); P.line(-m, b.z0 - 0.4, m, b.z0 - 0.4, 0.08, '#d6d3d1'); P.line(-m, b.z1 + 0.4, m, b.z1 + 0.4, 0.08, '#d6d3d1'); }
      else { P.g.strokeStyle = '#facc15'; P.g.lineWidth = 0.18 * P.ppu; P.g.strokeRect(P.X(-m), P.X(b.z0 - 0.5), 2 * m * P.ppu, (b.z1 - b.z0 + 1) * P.ppu); }
    }
    if (kind === 'tech') for (let i = 1; i < blocks.length; i++) { const zc = (blocks[i - 1].z1 + blocks[i].z0) / 2; P.line(-L, zc, L, zc, 0.12, '#f8fafc', [1.2, 1.2]); }
    finishGround(cv, E, true);
    for (const it of plan) { if (PREFABS[it.tp]) addStruct(it.tp, it.x, it.z, true); else spawn(it.tp, it.x, it.z, 0, { force: true }); }
    if (structs.length) finishCubes();
    // започни в пътеката между първите две групи
    if (blocks.length > 1) world.start = { x: 0, z: (blocks[0].z1 + blocks[1].z0) / 2 };
    return;
  }
  paintIndoor(kind, P, L, E);
  finishGround(cv, E, true);
  const order = [...def.cats].sort((a, b) => Math.max(...b.types.map((t) => T[t].r)) - Math.max(...a.types.map((t) => T[t].r)));
  for (const c of order) {
    const weights = c.types.map((tp) => 1 / Math.sqrt(T[tp].r));
    const wsum = weights.reduce((s, w) => s + w, 0);
    const pickType = () => { let r = R() * wsum; for (let i = 0; i < c.types.length; i++) { r -= weights[i]; if (r <= 0) return c.types[i]; } return c.types[0]; };
    for (let i = 0; i < (counts[c.id] || 0); i++) {
      const type = pickType();
      for (let tr = 0; tr < 40; tr++) if (spawn(type, RR(-L + 1.5, L - 1.5), RR(-L + 1.5, L - 1.5))) break;
    }
  }
}

const geoCache = new Map();
function geoFor(type, v) {
  const key = type + ':' + v;
  let g = geoCache.get(key);
  if (!g) {
    const saved = rng;
    rng = mulberry32(hashStr(key));
    const L = [];
    T[type].b(L, v);
    rng = saved;
    g = merge(L);
    geoCache.set(key, g);
  }
  return g;
}

// ================= свят =================
let world = null; // { L, objs, ground, ... }
let objs = [];
let occ = [];
let holes = [];
let player = null;
const groundMat = new THREE.MeshLambertMaterial({
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc,
  stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp,
});
let groundMesh = null;

function free(x, z, r) {
  const L = world.L;
  if (Math.abs(x) > L - r * 0.6 || Math.abs(z) > L - r * 0.6) return false;
  for (const o of occ) {
    const d = r + o.r * 0.9;
    if (Math.abs(o.x - x) < d && Math.abs(o.z - z) < d && (o.x - x) ** 2 + (o.z - z) ** 2 < d * d) return false;
  }
  return true;
}
function block(x, z, r) { occ.push({ x, z, r }); }

function spawn(type, x, z, ry, opts = {}) {
  const def = T[type];
  if (!opts.force && !free(x, z, def.r)) return null;
  const v = opts.v != null ? opts.v : Math.floor(R() * (def.nv || 1));
  const geo = geoFor(type, v);
  const bb = geo.boundingBox;
  const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
  const mesh = new THREE.Mesh(geo, objMat);
  if (ry == null) ry = R() * Math.PI * 2;
  mesh.position.set(x, 0, z);
  mesh.rotation.y = ry;
  mesh.castShadow = def.r > 0.4;
  mesh.receiveShadow = def.r >= 1.5;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  scene.add(mesh);
  const o = { id: world.nextId++, type, mesh, x, y: 0, z, ry, r: def.r, h: sy, v: Math.pow(sx * sy * sz, 0.72), dead: false, fall: null, mover: null, wob: 0 };
  objs.push(o);
  occ.push({ x, z, r: def.r });
  if (!PENALTY[type]) world.total += o.v; // животните не се броят към процента
  return o;
}

// ---------- земя (рисувана в canvas) ----------
function makeGroundCanvas(E, base) {
  const size = 2048;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  const ppu = size / (2 * E);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  const P = {
    g, ppu,
    X: (x) => (x + E) * ppu,
    rect(x0, z0, x1, z1, c) { g.fillStyle = c; g.fillRect(P.X(x0), P.X(z0), (x1 - x0) * ppu, (z1 - z0) * ppu); },
    circle(x, z, r, c) { g.fillStyle = c; g.beginPath(); g.arc(P.X(x), P.X(z), r * ppu, 0, Math.PI * 2); g.fill(); },
    ring(x, z, r, w, c) { g.strokeStyle = c; g.lineWidth = w * ppu; g.beginPath(); g.arc(P.X(x), P.X(z), r * ppu, 0, Math.PI * 2); g.stroke(); },
    line(x0, z0, x1, z1, w, c, dash) { g.strokeStyle = c; g.lineWidth = w * ppu; g.setLineDash(dash ? dash.map((d) => d * ppu) : []); g.beginPath(); g.moveTo(P.X(x0), P.X(z0)); g.lineTo(P.X(x1), P.X(z1)); g.stroke(); g.setLineDash([]); },
  };
  return { cv, P };
}
let decor = [];
function addDecor(L, E) {
  // гора отвъд края на картата — само за красота, не се гълта
  const saved = rng;
  for (let x = -E + 3; x < E - 2; x += 4.5) for (const sgn of [-1, 1]) for (let k = 0; k < 3; k++) {
    for (const [px, pz] of [[x + RR(-1, 1), sgn * (L + 3 + k * 5 + RR(-1, 1))], [sgn * (L + 3 + k * 5 + RR(-1, 1)), x + RR(-1, 1)]]) {
      const m = new THREE.Mesh(geoFor(R() < 0.5 ? 'pine' : 'tree', Math.floor(R() * 3)), objMat);
      m.position.set(px, 0, pz); m.rotation.y = R() * 6; const sc = RR(1.1, 1.8); m.scale.set(sc, sc, sc);
      m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m); decor.push(m);
    }
  }
  rng = saved;
}
function finishGround(cv, E, indoor) {
  if (!indoor) addDecor(world.L, E);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const geo = new THREE.PlaneGeometry(2 * E, 2 * E);
  geo.rotateX(-Math.PI / 2);
  groundMat.map = tex;
  groundMat.needsUpdate = true;
  groundMesh = new THREE.Mesh(geo, groundMat);
  groundMesh.receiveShadow = true;
  groundMesh.renderOrder = -2;
  scene.add(groundMesh);
}
function mowStripes(P, L, c) { for (let x = -L; x < L; x += 6) P.rect(x, -L, x + 3, L, c); }
function border(P, L) { P.line(-L, -L, L, -L, 0.5, 'rgba(0,0,0,.18)'); P.line(L, -L, L, L, 0.5, 'rgba(0,0,0,.18)'); P.line(L, L, -L, L, 0.5, 'rgba(0,0,0,.18)'); P.line(-L, L, -L, -L, 0.5, 'rgba(0,0,0,.18)'); }

// ---------- движещи се ----------
function walker(o, cx, cz, rad, speed) { if (o) o.mover = { kind: 'wander', cx, cz, rad, tx: cx, tz: cz, speed, wait: R() * 2 }; }
function driver(o, axis, road, dir, lane, speed) { if (o) { o.mover = { kind: 'drive', axis, road, dir, lane, speed }; } }
function liner(o, axis, line, a, b, speed) { if (o) o.mover = { kind: 'line', axis, line, a, b, dir: R() < 0.5 ? 1 : -1, speed }; }

// ---------- оформления ----------
function layoutPark(L) {
  const E = L + 30;
  const { cv, P } = makeGroundCanvas(E, '#7fcf6a');
  mowStripes(P, L, '#78c763');
  const ringR = L * 0.55;
  P.ring(0, 0, ringR, 3, '#e9d8a6');
  P.line(-L, 0, L, 0, 3, '#e9d8a6'); P.line(0, -L, 0, L, 3, '#e9d8a6');
  P.circle(0, 0, 6, '#e9d8a6'); P.ring(0, 0, 6, 0.4, '#d6c08a');
  block(0, 0, 0.1);
  const ponds = [[-L * 0.55, -L * 0.6, 5], [L * 0.6, L * 0.55, 4.5]];
  for (const [x, z, r] of ponds) { P.circle(x, z, r + 0.6, '#c9b98a'); P.circle(x, z, r, '#5ab4e8'); P.circle(x - r * 0.3, z - r * 0.3, r * 0.3, '#7cc6ef'); block(x, z, r + 0.5); }
  border(P, L);
  finishGround(cv, E);

  spawn('fountain', 0, 0, 0, { force: true });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; spawn('bench', Math.cos(a) * 4.6, Math.sin(a) * 4.6, -a + Math.PI / 2); }
  const steps = Math.round(2 * Math.PI * ringR / 7);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    if (i % 2 === 0) spawn('lamp', c * (ringR + 2.2), s * (ringR + 2.2), -a);
    else spawn('bench', c * (ringR - 2.4), s * (ringR - 2.4), -a - Math.PI / 2);
    if (i % 3 === 1) spawn(R() < 0.5 ? 'bin' : 'flowers', c * (ringR + 2.4), s * (ringR + 2.4));
  }
  for (let i = -L + 4; i < L - 3; i += 7) { if (Math.abs(i) < 8) continue; spawn('lamp', i, 2.3, 0); spawn('lamp', 2.3, i, 0); spawn(R() < 0.5 ? 'bin' : 'flowers', i + 2, -2.3); }
  const big = [['gazebo', 2], ['kiosk', 4], ['statue', 3], ['slide', 3]];
  for (const [t, n] of big) for (let k = 0, tries = 0; k < n && tries < 200; tries++) if (spawn(t, RR(-L + 4, L - 4), RR(-L + 4, L - 4))) k++;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3; spawn('house', Math.cos(a) * (L - 4), Math.sin(a) * (L - 4), -a + Math.PI / 2); }
  scatter(['tree', 'tree', 'pine'], Math.round(L * L * 0.075), L);
  scatter(['bush', 'flowers'], Math.round(L * L * 0.03), L);
  scatter(['cone', 'bin'], 6, L);
  scatter(['bin', 'flowers', 'cone', 'hydrant', 'bench', 'bush'], Math.round(L * 1.3), L);
}

function scatter(types, n, L, area) {
  let k = 0;
  for (let i = 0; i < n * 8 && k < n; i++) {
    const x = area ? RR(area[0], area[2]) : RR(-L + 1.5, L - 1.5);
    const z = area ? RR(area[1], area[3]) : RR(-L + 1.5, L - 1.5);
    if (spawn(pick(types), x, z)) k++;
  }
}

function layoutCity(L0, kind) {
  const Bp = 26, roadW = 7, side = 2.4;
  const n = Math.max(2, Math.round((2 * L0) / Bp));
  const L = (n * Bp) / 2;
  world.L = L;
  const E = L + 30;
  const { cv, P } = makeGroundCanvas(E, '#7fcf6a');
  const lines = [];
  for (let k = 0; k <= n; k++) lines.push(-L + k * Bp);
  // тротоари и парцели
  const lots = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x0 = lines[i] + roadW / 2, x1 = lines[i + 1] - roadW / 2;
    const z0 = lines[j] + roadW / 2, z1 = lines[j + 1] - roadW / 2;
    P.rect(x0, z0, x1, z1, '#cfd4da');
    lots.push([x0 + side, z0 + side, x1 - side, z1 - side, x0, z0, x1, z1]);
  }
  // пътища
  for (const c of lines) {
    P.rect(c - roadW / 2, -L - roadW / 2, c + roadW / 2, L + roadW / 2, '#4b5563');
    P.rect(-L - roadW / 2, c - roadW / 2, L + roadW / 2, c + roadW / 2, '#4b5563');
  }
  for (const c of lines) {
    P.line(c, -L, c, L, 0.2, '#f8fafc', [1.6, 1.6]);
    P.line(-L, c, L, c, 0.2, '#f8fafc', [1.6, 1.6]);
  }
  for (const cx of lines) for (const cz of lines) { P.rect(cx - roadW / 2, cz - roadW / 2, cx + roadW / 2, cz + roadW / 2, '#4b5563'); }
  for (const cx of lines) for (const cz of lines) {
    for (let k = -2.5; k <= 2.5; k += 1) {
      P.rect(cx + k - 0.3, cz - roadW / 2 - 1.6, cx + k + 0.3, cz - roadW / 2 - 0.2, '#f8fafc');
      P.rect(cx - roadW / 2 - 1.6, cz + k - 0.3, cx - roadW / 2 - 0.2, cz + k + 0.3, '#f8fafc');
    }
  }
  for (const c of lines) { block(c, 0, 0); }

  const weights = kind === 'downtown'
    ? { houses: 1, apartments: 4, tower: 3, park: 1.2, shops: 2.5, parking: 1 }
    : { houses: 5, apartments: 1.6, tower: 0.4, park: 1.4, shops: 1.6, parking: 0.8 };
  const pickLot = () => { let tot = 0; for (const k in weights) tot += weights[k]; let r = R() * tot; for (const k in weights) { r -= weights[k]; if (r <= 0) return k; } return 'houses'; };

  for (const lot of lots) {
    const [a0, b0, a1, b1, s0, t0, s1, t1] = lot;
    const cx = (a0 + a1) / 2, cz = (b0 + b1) / 2, w = a1 - a0;
    const type = pickLot();
    const lawn = type === 'houses' || type === 'park';
    P.rect(a0, b0, a1, b1, lawn ? '#86d46f' : type === 'parking' ? '#6b7280' : '#e2e5e9');
    if (type === 'houses') {
      const q = w / 4;
      for (const dx of [-q, q]) for (const dz of [-q, q]) spawn('house', cx + dx, cz + dz, dz > 0 ? 0 : Math.PI);
      scatter(['tree', 'bush', 'flowers', 'bush'], 10, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
      if (R() < 0.6) spawn('car', cx, cz, R() < 0.5 ? 0 : Math.PI / 2);
    } else if (type === 'apartments') {
      if (kind === 'downtown' && R() < 0.5) {
        const q = w / 4;
        for (const dx of [-q, q]) for (const dz of [-q, q]) spawn(R() < 0.5 ? 'shop' : 'house', cx + dx, cz + dz, dz > 0 ? 0 : Math.PI);
      } else {
        spawn('block', cx, cz, 0, { force: true });
        scatter(['tree', 'bench', 'car', 'bush'], 8, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
      }
    } else if (type === 'tower') {
      spawn('tower', cx, cz, 0, { force: true });
      scatter(['bench', 'flowers', 'bin', 'tree'], 8, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
    } else if (type === 'park') {
      P.circle(cx, cz, 3.6, '#e9d8a6');
      spawn(R() < 0.6 ? 'fountain' : 'gazebo', cx, cz, 0, { force: true });
      scatter(['tree', 'tree', 'pine', 'bench', 'bush', 'flowers', 'slide'], 16, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
    } else if (type === 'shops') {
      spawn('shop', cx, cz - w / 4, Math.PI, { force: true }); spawn('shop', cx, cz + w / 4, 0, { force: true });
      scatter(['kiosk', 'bench', 'hydrant', 'bin', 'flowers', 'cone'], 7, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
    } else {
      for (let x = a0 + 1.6; x < a1 - 1; x += 2.6) {
        P.line(x - 1.3, b0 + 1, x - 1.3, b0 + 5, 0.12, '#f8fafc'); P.line(x - 1.3, b1 - 5, x - 1.3, b1 - 1, 0.12, '#f8fafc');
        if (R() < 0.75) spawn('car', x, b0 + 3, Math.PI / 2 + (R() < 0.5 ? Math.PI : 0), { force: true });
        if (R() < 0.75) spawn('car', x, b1 - 3, Math.PI / 2 + (R() < 0.5 ? Math.PI : 0), { force: true });
      }
      if (R() < 0.5) spawn('truck', cx, cz, 0);
      spawn('kiosk', cx + w / 3, cz, 0);
    }
    // тротоар: лампи, кошчета, дървета, хора
    const sm = side / 2;
    const edges = [[s0 + sm, t0 + sm, s1 - sm, t0 + sm, 'x'], [s0 + sm, t1 - sm, s1 - sm, t1 - sm, 'x'], [s0 + sm, t0 + sm, s0 + sm, t1 - sm, 'z'], [s1 - sm, t0 + sm, s1 - sm, t1 - sm, 'z']];
    for (const [x0, z0, x1, z1, ax] of edges) {
      const len = ax === 'x' ? x1 - x0 : z1 - z0;
      for (let d = 2; d < len - 1; d += 4.2) {
        const x = ax === 'x' ? x0 + d : x0, z = ax === 'x' ? z0 : z0 + d;
        const r = R();
        const t = r < 0.3 ? 'lamp' : r < 0.45 ? 'tree' : r < 0.58 ? 'bin' : r < 0.66 ? 'hydrant' : r < 0.74 ? 'bench' : r < 0.78 ? 'busstop' : null;
        if (t) spawn(t, x, z, ax === 'x' ? (z0 > (t0 + t1) / 2 ? 0 : Math.PI) : (x0 > (s0 + s1) / 2 ? -Math.PI / 2 : Math.PI / 2));
      }
      for (let k = 0; k < 2; k++) {
        const d = RR(1, len - 1);
        spawn(R() < 0.5 ? 'cone' : 'flowers', ax === 'x' ? x0 + d : x0, ax === 'x' ? z0 : z0 + d);
      }
    }
  }
  // трафик
  const lane = 1.7;
  for (const c of lines) {
    for (const axis of ['x', 'z']) {
      const nCars = Math.round(n * 1.1);
      for (let i = 0; i < nCars; i++) {
        const dir = R() < 0.5 ? 1 : -1;
        const along = RR(-L + 4, L - 4);
        const laneC = axis === 'z' ? c - lane * dir : c + lane * dir;
        const x = axis === 'x' ? along : laneC, z = axis === 'x' ? laneC : along;
        const r = R();
        const t = r < 0.08 ? 'bus' : r < 0.16 ? 'truck' : 'car';
        const ry = axis === 'x' ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
        const o = spawn(t, x, z, ry);
        driver(o, axis, c, dir, lane, t === 'car' ? RR(4, 6.5) : RR(3, 4.5));
      }
    }
  }
  for (let i = 0; i < n * 2; i++) { const c = pick(lines); spawn('cone', c + RR(-3, 3), RR(-L + 2, L - 2)); }
  border(P, L);
  finishGround(cv, E);
}

function layoutFarm(L) {
  const E = L + 30;
  const { cv, P } = makeGroundCanvas(E, '#8fd36a');
  mowStripes(P, L, '#88cc63');
  P.rect(-2.5, -E, 2.5, E, '#c9a46c'); P.rect(-E, -2.5, E, 2.5, '#c9a46c');
  block(0, 0, 0);
  const quads = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const roles = ['yard', 'field', 'pen', 'field2'];
  // разбъркай ролите
  for (let i = roles.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [roles[i], roles[j]] = [roles[j], roles[i]]; }
  quads.forEach(([sx, sz], qi) => {
    const a0 = sx < 0 ? -L + 2 : 4, a1 = sx < 0 ? -4 : L - 2;
    const b0 = sz < 0 ? -L + 2 : 4, b1 = sz < 0 ? -4 : L - 2;
    const cx = (a0 + a1) / 2, cz = (b0 + b1) / 2;
    const role = roles[qi];
    if (role === 'field' || role === 'field2') {
      P.rect(a0 + 1, b0 + 1, a1 - 1, b1 - 1, role === 'field' ? '#a8794f' : '#d9c45a');
      for (let x = a0 + 2; x < a1 - 1; x += 1.6) P.line(x, b0 + 1.3, x, b1 - 1.3, 0.3, role === 'field' ? '#8c6239' : '#c4ae45');
      scatter(['hay', 'hay', 'haystack'], Math.round((a1 - a0) * (b1 - b0) / 30), 0, [a0 + 2, b0 + 2, a1 - 2, b1 - 2]);
      scatter(['pumpkin', 'pumpkin', 'crate', 'milkcan'], Math.round((a1 - a0) * (b1 - b0) / 22), 0, [a0 + 2, b0 + 2, a1 - 2, b1 - 2]);
      spawn('tractor', cx, cz, R() * 6);
      scatter(['tree', 'pine'], 6, 0, [a0, b0, a1, b1]);
    } else if (role === 'pen') {
      const p0 = a0 + 2, p1 = a1 - 2, q0 = b0 + 2, q1 = b1 - 2;
      P.rect(p0, q0, p1, q1, '#a3dc7f');
      for (let x = p0 + 1.5; x < p1 - 1; x += 3) { spawn('fence', x, q0, 0, { force: true }); spawn('fence', x, q1, 0, { force: true }); }
      for (let z = q0 + 1.5; z < q1 - 1; z += 3) { spawn('fence', p0, z, Math.PI / 2, { force: true }); spawn('fence', p1, z, Math.PI / 2, { force: true }); }
      spawn('trough', cx, cz, 0);
      const animals = ['cow', 'cow', 'sheep', 'sheep', 'pig'];
      for (let i = 0, k = 0; i < 300 && k < Math.round((p1 - p0) * (q1 - q0) / 18); i++) {
        const x = RR(p0 + 2, p1 - 2), z = RR(q0 + 2, q1 - 2);
        const o = spawn(pick(animals), x, z);
        if (o) { walker(o, x, z, 3, RR(0.4, 0.8)); k++; }
      }
    } else {
      P.rect(a0 + 1, b0 + 1, a1 - 1, b1 - 1, '#d6c39a');
      spawn('barn', cx - 3, cz - 3, R() < 0.5 ? 0 : Math.PI / 2, { force: true });
      spawn('silo', cx + 6, cz - 5);
      spawn('silo', cx + 6, cz - 1);
      spawn('house', cx + 4, cz + 6, 0);
      spawn('tractor', cx - 6, cz + 6, 0.5);
      spawn('windmill', cx - 8, cz + 8 > b1 - 3 ? cz : cz + 8, 0);
      for (let i = 0; i < 18; i++) { const x = RR(a0 + 2, a1 - 2), z = RR(b0 + 2, b1 - 2); const o = spawn('chicken', x, z); walker(o, x, z, 2, RR(0.6, 1.1)); }
      scatter(['crate', 'milkcan', 'pumpkin', 'crate'], 24, 0, [a0 + 2, b0 + 2, a1 - 2, b1 - 2]);
      scatter(['hay', 'haystack', 'trough', 'bush', 'flowers'], 10, 0, [a0 + 2, b0 + 2, a1 - 2, b1 - 2]);
    }
  });
  for (let d = -L + 3; d < L - 2; d += 5) { if (Math.abs(d) < 4) continue; spawn(R() < 0.5 ? 'milkcan' : 'pumpkin', d + 1.2, -5.2); spawn('crate', -5.2, d + 1.2); spawn('tree', -3.6, d); spawn('tree', 3.6, d + 2.5); spawn('fence', d, -3.6, 0); spawn('fence', d + 2.5, 3.6, 0); }
  for (const s of [-1, 1]) { const o = spawn('tractor', s * RR(8, L - 8), 0, 0); if (o) driver(o, 'x', 0, s, 1.2, 2.5); }
  spawn('windmill', L - 5, -L + 5, 0); spawn('windmill', -L + 5, L - 5, 0);
  border(P, L);
  finishGround(cv, E);
}


// Единично ниво: картата се пълни с избраните категории и брой.
function layoutCustom(L, counts) {
  const E = L + 30;
  const { cv, P } = makeGroundCanvas(E, '#7fcf6a');
  mowStripes(P, L, '#78c763');
  const n = (k) => counts[k] || 0;
  const urban = n('cars') + n('big') + n('houses') + n('blocks') + n('towers') > 0;
  const roads = [];
  const roadW = 7;
  if (urban) {
    const k = Math.max(1, Math.round((2 * L) / 28));
    const sp = (2 * L) / k;
    for (let i = 0; i < k; i++) roads.push(-L + sp * (i + 0.5));
    for (const c of roads) {
      P.rect(c - roadW / 2 - 1.4, -L, c + roadW / 2 + 1.4, L, '#cfd4da');
      P.rect(-L, c - roadW / 2 - 1.4, L, c + roadW / 2 + 1.4, '#cfd4da');
    }
    for (const c of roads) { P.rect(c - roadW / 2, -L, c + roadW / 2, L, '#4b5563'); P.rect(-L, c - roadW / 2, L, c + roadW / 2, '#4b5563'); }
    for (const c of roads) { P.line(c, -L, c, L, 0.2, '#f8fafc', [1.6, 1.6]); P.line(-L, c, L, c, 0.2, '#f8fafc', [1.6, 1.6]); }
    for (const cx of roads) for (const cz of roads) P.rect(cx - roadW / 2, cz - roadW / 2, cx + roadW / 2, cz + roadW / 2, '#4b5563');
  } else {
    P.ring(0, 0, L * 0.55, 2.6, '#e9d8a6');
    P.line(-L, 0, L, 0, 2.6, '#e9d8a6'); P.line(0, -L, 0, L, 2.6, '#e9d8a6');
  }
  border(P, L);
  finishGround(cv, E);

  const onRoad = (x, z, r) => roads.some((c) => Math.abs(x - c) < roadW / 2 + 1.4 + r * 0.7 || Math.abs(z - c) < roadW / 2 + 1.4 + r * 0.7);
  const VEH = new Set(['car', 'bus', 'truck']);
  const WALK = new Set(['chicken', 'sheep', 'pig', 'cow']);
  const maxR = (c) => Math.max(...c.types.map((tp) => T[tp].r));
  const order = [...CATS].sort((a, b) => maxR(b) - maxR(a));
  for (const c of order) {
    // по-големите типове в категорията са по-редки
    const weights = c.types.map((tp) => 1 / Math.sqrt(T[tp].r));
    const wsum = weights.reduce((s, w) => s + w, 0);
    const pickType = () => { let r = R() * wsum; for (let i = 0; i < c.types.length; i++) { r -= weights[i]; if (r <= 0) return c.types[i]; } return c.types[0]; };
    for (let i = 0; i < n(c.id); i++) {
      const type = pickType();
      if (urban && VEH.has(type)) {
        for (let tr = 0; tr < 20; tr++) {
          const road = pick(roads), axis = R() < 0.5 ? 'x' : 'z', dir = R() < 0.5 ? 1 : -1, lane = 1.7;
          const along = RR(-L + 4, L - 4);
          const lc = axis === 'z' ? road - lane * dir : road + lane * dir;
          const x = axis === 'x' ? along : lc, z = axis === 'x' ? lc : along;
          const ry = axis === 'x' ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
          const o = spawn(type, x, z, ry);
          if (o) { driver(o, axis, road, dir, lane, type === 'car' ? RR(4, 6.5) : RR(3, 4.5)); break; }
        }
        continue;
      }
      for (let tr = 0; tr < 40; tr++) {
        const x = RR(-L + 1.5, L - 1.5), z = RR(-L + 1.5, L - 1.5);
        if (urban && onRoad(x, z, T[type].r)) continue;
        const o = spawn(type, x, z);
        if (o) { if (WALK.has(type)) walker(o, x, z, type === 'cow' ? 3 : 2.5, RR(0.4, 0.9)); break; }
      }
    }
  }
}

// ================= кубчета =================
// Нива от кубчета: всяка постройка е решетка от еднакви кубчета. Дупката гълта кубчетата на земята,
// а тези отгоре падат надолу. Дърветата и колите („твърди“) потъват като едно цяло.
const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const cubeMat = new THREE.MeshLambertMaterial();
cubeMat.onBeforeCompile = darkenBelowGround;
let cubeMesh = null, cubes = [], structs = [], holeCubes = [];
const _cm = new THREE.Matrix4(), _cqq = new THREE.Quaternion(), _cpp = new THREE.Vector3(), _css = new THREE.Vector3(), _cc = new THREE.Color(), _ax = new THREE.Vector3();
const ckey = (x, y, z) => (y * 256 + x) * 256 + z;

const VC = {
  bright: ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
  leaf: ['#22c55e', '#16a34a', '#4ade80', '#15803d', '#65a30d'],
  wall: ['#f5f5f4', '#fde68a', '#fecaca', '#bfdbfe', '#d9f99d', '#e9d5ff', '#fed7aa', '#cbd5e1'],
  roof: ['#dc2626', '#b45309', '#1d4ed8', '#374151', '#9a3412'],
  glass: '#1e3a5f', trunk: '#7c4a1e',
};
// Готови постройки: s = размер на кубчето (м), rigid = потъва като едно цяло.
const pyramid = (n, colors) => { const out = []; for (let k = 0; k < n; k++) for (let i = 0; i < n - k; i++) for (let j = 0; j < n - k; j++) out.push([2 * i + k, k, 2 * j + k, pick(colors)]); return out; };
const PREFABS = {
  // ---- купчини от храна ----
  tomatoPyr: { s: 0.55, shape: 'ball', pile: true, r: 1.9, b: () => pyramid(4 + Math.floor(R() * 2), ['#dc2626', '#ef4444', '#b91c1c']) },
  fruitPyr: { s: 0.6, shape: 'ball', pile: true, r: 2.1, b: () => pyramid(4 + Math.floor(R() * 2), pick([['#f97316', '#fb923c'], ['#dc2626', '#65a30d', '#facc15'], ['#facc15', '#fde047'], ['#84cc16', '#65a30d']])) },
  sushiTower: { s: 0.5, sy: 0.36, shape: 'disc', r: 1.0, b: () => {
    const n = 2 + Math.floor(R() * 2), H = 7 + Math.floor(R() * 5), out = [], kinds = ['#fb923c', '#f8fafc', '#14532d', '#fde047', '#ef4444'];
    for (let y = 0; y < H; y++) { const c = kinds[y % kinds.length]; for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) out.push([x, y, z, c]); }
    return out;
  } },
  biscuitHouse: { s: 0.55, sy: 0.2, shape: 'box', r: 2.0, b: () => {
    const out = [], W = 5, H = 10;
    for (let x = 0; x < W; x++) for (let z = 0; z < W; z++) for (let y = 0; y < H; y++) {
      const edge = x === 0 || x === W - 1 || z === 0 || z === W - 1;
      let c = edge ? (y % 2 ? '#e0b37a' : '#d6a15c') : '#c08a4b';
      if (z === W - 1 && x === 2 && y < 5) c = '#5b3a1f';                             // врата от шоколад
      else if ((z === W - 1 || z === 0) && (x === 1 || x === 3) && (y === 6 || y === 7)) c = '#fdf2f8'; // прозорци от глазура
      out.push([x, y, z, c]);
    }
    for (let x = 0; x < W; x++) for (let z = 0; z < W; z++) out.push([x, H, z, '#f9a8d4']);
    for (const y of [H + 1, H + 2]) for (let x = 1; x < 4; x++) for (let z = 1; z < 4; z++) out.push([x, y, z, y === H + 1 ? '#f472b6' : '#f9a8d4']);
    out.push([2, H + 3, 2, '#dc2626']);
    return out;
  } },
  pancakeStack: { s: 1.0, sy: 0.14, shape: 'disc', r: 0.6, b: () => {
    const H = 10 + Math.floor(R() * 5), out = [];
    for (let y = 0; y < H; y++) out.push([0, y, 0, y % 3 ? '#e0a458' : '#d4913f']);
    out.push([0, H, 0, '#fde047']);
    return out;
  } },
  single: { s: 0.5, b: () => [[0, 0, 0, pick(VC.bright)]] },
  stack: { s: 0.5, b: () => { const n = 2 + Math.floor(R() * 2), a = pick(VC.bright), c = pick(VC.bright); return Array.from({ length: n }, (_, i) => [0, i, 0, i % 2 ? c : a]); } },
  bigcube: { s: 0.5, b: () => { const c = pick(VC.bright), out = []; for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) out.push([x, y, z, c]); return out; } },
  flower: { s: 0.5, b: () => [[0, 0, 0, '#16a34a'], [0, 1, 0, pick(['#f43f5e', '#facc15', '#f472b6', '#a78bfa', '#fb923c', '#ffffff'])]] },
  car: { s: 0.5, rigid: true, b: () => {
    const c = pick(VC.bright), out = [];
    for (let x = 0; x < 4; x++) for (let z = 0; z < 2; z++) out.push([x, 0, z, (x === 0 || x === 3) ? '#1f2937' : c]);
    for (let x = 0; x < 4; x++) for (let z = 0; z < 2; z++) out.push([x, 1, z, x === 3 ? '#fef3c7' : c]);
    for (let x = 1; x < 3; x++) for (let z = 0; z < 2; z++) out.push([x, 2, z, '#9cc9f0']);
    return out;
  } },
  tree: { s: 0.5, rigid: true, b: () => {
    const g = pick(VC.leaf), out = [];
    for (let y = 0; y < 3; y++) out.push([1, y, 1, VC.trunk]);
    for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) out.push([x, 3, z, g]);
    for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) if ((x === 1 || z === 1)) out.push([x, 4, z, g]);
    out.push([1, 5, 1, g]);
    return out;
  } },
  pine: { s: 0.5, rigid: true, b: () => {
    const g = pick(['#166534', '#15803d', '#14532d']), out = [];
    for (let y = 0; y < 2; y++) out.push([1, y, 1, VC.trunk]);
    for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) out.push([x, 2, z, g]);
    for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) if (x === 1 || z === 1) out.push([x, 3, z, g]);
    out.push([1, 4, 1, g]); out.push([1, 5, 1, g]);
    return out;
  } },
  bigtree: { s: 0.5, rigid: true, b: () => {
    const g = pick(VC.leaf), out = [];
    for (let y = 0; y < 5; y++) out.push([2, y, 2, VC.trunk]);
    for (const y of [5, 6]) for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) if (!((x === 0 || x === 4) && (z === 0 || z === 4))) out.push([x, y, z, g]);
    for (let x = 1; x < 4; x++) for (let z = 1; z < 4; z++) out.push([x, 7, z, g]);
    out.push([2, 8, 2, g]);
    return out;
  } },
  house: { s: 0.5, b: () => {
    const w = pick(VC.wall), rf = pick(VC.roof), out = [];
    for (let x = 0; x < 5; x++) for (let y = 0; y < 4; y++) for (let z = 0; z < 5; z++) {
      let c = w;
      if (z === 4 && x === 2 && y < 2) c = '#7c2d12';
      else if ((z === 4 || z === 0) && (x === 1 || x === 3) && y === 2) c = '#9cc9f0';
      else if ((x === 0 || x === 4) && z === 2 && y === 2) c = '#9cc9f0';
      out.push([x, y, z, c]);
    }
    for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) out.push([x, 4, z, rf]);
    for (let x = 1; x < 4; x++) for (let z = 1; z < 4; z++) out.push([x, 5, z, rf]);
    out.push([2, 6, 2, rf]);
    return out;
  } },
  building: { s: 0.75, b: () => {
    // например 3 × 2 кубчета основа и 10 на височина
    const W = 2 + Math.floor(R() * 3), D = 2 + Math.floor(R() * 3), H = 6 + Math.floor(R() * 7), c = pick(VC.wall), out = [];
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) {
      const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
      out.push([x, y, z, y === H - 1 ? '#64748b' : edge && y % 2 === 1 && (x + z) % 2 === 0 ? VC.glass : c]);
    }
    return out;
  } },
  tower: { s: 1.0, b: () => {
    const H = 9 + Math.floor(R() * 7), a = pick(VC.bright), b = '#f8fafc', out = [];
    for (let x = 0; x < 2; x++) for (let z = 0; z < 2; z++) for (let y = 0; y < H; y++) out.push([x, y, z, Math.floor(y / 2) % 2 ? a : b]);
    return out;
  } },
  pyramid: { s: 1.0, b: () => {
    const out = [];
    for (let l = 0; l < 3; l++) for (let x = l; x < 5 - l; x++) for (let z = l; z < 5 - l; z++) out.push([x, l, z, ['#e9c46a', '#f4d58d', '#d4a73c'][(x + z + l) % 3]]);
    return out;
  } },
  mega: { s: 1.25, b: () => {
    const H = 11 + Math.floor(R() * 7), c = pick(['#cbd5e1', '#93c5fd', '#a5b4fc', '#e2e8f0']), out = [];
    for (let x = 0; x < 4; x++) for (let z = 0; z < 4; z++) for (let y = 0; y < H; y++) {
      const edge = x === 0 || x === 3 || z === 0 || z === 3;
      out.push([x, y, z, y === H - 1 ? '#475569' : edge && y % 2 === 0 ? VC.glass : c]);
    }
    return out;
  } },
};

// Парчетата могат да са кубчета (box), топки (ball) или дискове (disc); всяка форма е отделна инстанцирана мрежа.
// Режими на опора: „колона“ (парчето стои върху парчето под него), „твърдо“ (потъва като едно цяло)
// и „пирамида“ (топката лежи върху четирите под нея; без поне две опори се търкулва встрани).
const pieceGeos = { box: cubeGeo, ball: new THREE.SphereGeometry(0.5, 14, 10), disc: new THREE.CylinderGeometry(0.5, 0.5, 1, 18) };
let pieceMeshes = {}, rollers = [];
const pieceX = (c) => (c.loose ? c.x : c.st.ox + (c.st.pile ? c.ix / 2 + 0.5 : c.ix + 0.5) * c.st.s);
const pieceZ = (c) => (c.loose ? c.z : c.st.oz + (c.st.pile ? c.iz / 2 + 0.5 : c.iz + 0.5) * c.st.s);
const restY = (st, iy) => st.base + iy * st.sy;
function markPieces() { for (const k in pieceMeshes) pieceMeshes[k].instanceMatrix.needsUpdate = true; }

function addStruct(type, cx, cz, force) {
  const pf = PREFABS[type];
  const cells = pf.b();
  const pile = !!pf.pile, s = pf.s, shape = pf.shape || 'box';
  const sy = pf.sy || (pile ? s * 0.707 : s);
  let W = 0, D = 0;
  for (const c of cells) { W = Math.max(W, pile ? c[0] / 2 + 1 : c[0] + 1); D = Math.max(D, pile ? c[2] / 2 + 1 : c[2] + 1); }
  const r = Math.hypot(W, D) * s / 2;
  if (!force && !free(cx, cz, r)) return null;
  occ.push({ x: cx, z: cz, r });
  const st = { type, s, sy, shape, pile, base: shape === 'ball' ? s / 2 : sy / 2, rigid: !!pf.rigid, ox: cx - W * s / 2, oz: cz - D * s / 2, cx, cz, r, grid: new Map(), cubes: [], drops: [], fall: null, dirty: false, left: cells.length, pts: 0 };
  const v = Math.pow(s * s * sy, 0.72) * 1.1;
  for (const [x, y, z, col] of cells) {
    const c = { id: cubes.length, st, ix: x, iy: y, iz: z, y: restY(st, y), state: 'rest', vy: 0, v, color: col };
    st.grid.set(ckey(x, y, z), c);
    st.cubes.push(c); cubes.push(c);
    world.total += v;
  }
  structs.push(st);
  return st;
}

function finishCubes() {
  const counts = {};
  for (const c of cubes) { const sh = c.st.shape; c.ii = counts[sh] || 0; counts[sh] = c.ii + 1; }
  cubeMesh = new THREE.Group();
  pieceMeshes = {};
  for (const sh in counts) {
    const m = new THREE.InstancedMesh(pieceGeos[sh], cubeMat, counts[sh]);
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    pieceMeshes[sh] = m; cubeMesh.add(m);
  }
  const jr = mulberry32(cubes.length + 17);
  for (const c of cubes) {
    _cc.set(c.color).multiplyScalar(0.92 + jr() * 0.16); // лека разлика между парчетата
    pieceMeshes[c.st.shape].setColorAt(c.ii, _cc);
    setCubeMatrix(c);
  }
  for (const k in pieceMeshes) { pieceMeshes[k].instanceMatrix.needsUpdate = true; if (pieceMeshes[k].instanceColor) pieceMeshes[k].instanceColor.needsUpdate = true; }
  scene.add(cubeMesh);
}
function setCubeMatrix(c) {
  const st = c.st, s = st.s, mesh = pieceMeshes[st.shape];
  if (c.state === 'dead') { _cm.makeScale(0, 0, 0); mesh.setMatrixAt(c.ii, _cm); return; }
  if (c.state === 'hole' || c.loose) { _cpp.set(c.x, c.y, c.z); if (c.q) _cqq.copy(c.q); else _cqq.identity(); }
  else { _cpp.set(pieceX(c), c.y - (st.fall ? st.fall.y : 0), pieceZ(c)); _cqq.identity(); }
  const k = st.shape === 'box' ? 0.985 : 0.97;
  if (st.shape === 'ball') _css.set(s * k, s * k, s * k); else _css.set(s * k, st.sy * k, s * k);
  _cm.compose(_cpp, _cqq, _css);
  mesh.setMatrixAt(c.ii, _cm);
}

function settle(st) {
  st.dirty = false;
  const rest = st.cubes.filter((c) => c.state === 'rest' && !c.loose);
  if (!rest.length) return;
  if (st.rigid) {
    let min = Infinity;
    for (const c of rest) min = Math.min(min, c.iy);
    if (min > 0 && !st.fall) st.fall = { y: 0, vy: 0 };
    return;
  }
  rest.sort((a, b) => a.iy - b.iy);
  for (const c of rest) {
    if (c.iy === 0) continue;
    if (st.pile) {
      // топка в пирамида: опира се на четирите под нея; с по-малко от две се търкулва към празната страна
      let n = 0, mx = 0, mz = 0;
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        if (st.grid.has(ckey(c.ix + dx, c.iy - 1, c.iz + dz))) n++; else { mx += dx; mz += dz; }
      }
      if (n < 2) startRoll(c, mx, mz);
    } else if (!st.grid.has(ckey(c.ix, c.iy - 1, c.iz))) {
      st.grid.delete(ckey(c.ix, c.iy, c.iz));
      c.state = 'drop'; c.vy = 0;
      st.drops.push(c);
    }
  }
}
function startRoll(c, mx, mz) {
  const st = c.st;
  st.grid.delete(ckey(c.ix, c.iy, c.iz));
  c.x = pieceX(c); c.z = pieceZ(c); c.loose = true;
  const l = Math.hypot(mx, mz) || 1, sp = 0.6 + Math.random() * 0.8;
  const a = Math.random() * Math.PI * 2;
  c.vx = (mx / l) * sp + (mx || mz ? 0 : Math.cos(a) * sp); c.vz = (mz / l) * sp + (mx || mz ? 0 : Math.sin(a) * sp);
  c.vy = 0; c.state = 'roll'; c.q = c.q || new THREE.Quaternion();
  rollers.push(c);
}

// Земно ускорение (9,81 м/с²), леко засилено, за да не изглежда забавено от разстояние.
const CUBE_G = 9.81 * 1.5;
const _dq = new THREE.Quaternion(), _wv = new THREE.Vector3();
// Връща дупката, в която парче с център (x, z) и размер s би паднало, или null.
function holeUnder(x, z, s) {
  for (const h of holes) {
    if (!h.alive || s > h.R * 0.95) continue;
    const dx = x - h.x, dz = z - h.z;
    if (dx * dx + dz * dz < (h.R - s * 0.05) ** 2) return h;
  }
  return null;
}
function startCubeHole(c, h, keepV) {
  const st = c.st, s = st.s;
  if (!c.loose) { st.grid.delete(ckey(c.ix, c.iy, c.iz)); c.x = pieceX(c); c.z = pieceZ(c); c.y -= st.fall ? st.fall.y : 0; }
  c.loose = true;
  c.state = 'hole'; c.h = h;
  if (!keepV) c.vy = 0;
  c.q = c.q || new THREE.Quaternion();
  // Колкото по-близо до ръба е парчето, толкова повече се накланя навътре и се плъзга встрани.
  let nx = c.x - h.x, nz = c.z - h.z;
  const d = Math.hypot(nx, nz) || 1e-6; nx /= d; nz /= d;
  const edge = clamp((d - (h.R - s * 0.8)) / (s * 0.8), 0, 1);
  const push = edge * (0.8 + Math.random() * 0.8) + Math.random() * 0.25;
  c.vx = (c.vx || 0) * 0.5 - nx * push + (Math.random() - 0.5) * 0.3;
  c.vz = (c.vz || 0) * 0.5 - nz * push + (Math.random() - 0.5) * 0.3;
  const tip = edge * (3 + Math.random() * 3);
  c.w = new THREE.Vector3(-nz * tip + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.8, nx * tip + (Math.random() - 0.5) * 1.2);
  holeCubes.push(c);
  st.dirty = true;
}
function consumeCube(c) {
  const h = c.h, st = c.st;
  c.state = 'dead';
  setCubeMatrix(c);
  const before = Math.floor(targetR(h) * 10);
  h.mass += c.v * (h.bot ? botGrow() : 1);
  h.eaten += c.v;
  const pts = Math.max(1, Math.round(c.v * 10));
  h.score += pts;
  st.left--;
  if (h === player) {
    st.pts += pts;
    popSound(st.s * 0.8);
    // цяла постройка изядена → показваме общия сбор
    if (st.left === 0 && st.cubes.length >= 6) { floatText(h.x, h.z, '+' + st.pts); buzz(10); }
    if (Math.floor(targetR(h) * 10) > before && Math.floor(targetR(h)) > Math.floor(before / 10)) sfx.grow();
  }
}

function updateCubes(dt) {
  let changed = false;
  for (const st of structs) {
    if (st.left <= 0) continue;
    // твърда постройка потъва като едно цяло
    if (st.fall) {
      const f = st.fall, s = st.s;
      f.vy += CUBE_G * dt; f.y += f.vy * dt;
      let landK = null;
      for (const c of st.cubes) {
        if (c.state !== 'rest' || c.y - f.y > st.base + 1e-4) continue;
        const h = holeUnder(pieceX(c), pieceZ(c), s);
        if (h) { c.vy = -f.vy; startCubeHole(c, h, true); changed = true; }
        else landK = landK === null ? c.iy : Math.min(landK, c.iy);
      }
      if (landK !== null || !st.cubes.some((c) => c.state === 'rest')) {
        st.fall = null;
        st.grid.clear();
        for (const c of st.cubes) if (c.state === 'rest') { c.iy -= landK || 0; c.y = restY(st, c.iy); st.grid.set(ckey(c.ix, c.iy, c.iz), c); }
        st.dirty = true;
      }
      for (const c of st.cubes) if (c.state === 'rest') setCubeMatrix(c);
      changed = true;
      if (st.fall) continue;
    }
    // гълтане: парчета на земята над дупка
    for (const h of holes) {
      if (!h.alive || st.s > h.R * 0.95) continue;
      const dx = st.cx - h.x, dz = st.cz - h.z, lim = h.R + st.r + 3;
      if (dx > lim || dx < -lim || dz > lim || dz < -lim) continue;
      const rr = (h.R - st.s * 0.05) ** 2;
      for (const c of st.cubes) {
        if (c.state !== 'rest' || c.iy !== 0) continue;
        const x = pieceX(c) - h.x, z = pieceZ(c) - h.z;
        if (x * x + z * z < rr) { startCubeHole(c, h); changed = true; }
      }
    }
    if (st.dirty) settle(st);
    // падащи парчета (по колони)
    if (st.drops.length) {
      st.drops.sort((a, b) => a.y - b.y);
      const res = new Map(), s = st.s;
      for (const c of st.drops) {
        const col = c.ix * 256 + c.iz;
        let f = -1;
        for (let iy = Math.ceil((c.y - st.base) / st.sy - 1e-6) - 1; iy >= 0; iy--) if (st.grid.has(ckey(c.ix, iy, c.iz))) { f = iy; break; }
        // ако колоната стъпва на земя над дупка, парчетата падат заедно в нея, без да се спират едно на друго
        const through = f === -1 && holeUnder(pieceX(c), pieceZ(c), s);
        let land = 0;
        if (!through) { land = Math.max(f + 1, res.has(col) ? res.get(col) + 1 : 0); res.set(col, land); }
        c.vy -= CUBE_G * dt; c.y += c.vy * dt;
        const ty = restY(st, land);
        if (c.y <= ty) {
          const hu = land === 0 ? holeUnder(pieceX(c), pieceZ(c), s) : null;
          if (hu) { startCubeHole(c, hu, true); continue; }
          c.y = ty; c.iy = land; c.state = 'rest'; c.vy = 0; st.grid.set(ckey(c.ix, land, c.iz), c); st.dirty = true;
        }
        setCubeMatrix(c);
      }
      st.drops = st.drops.filter((c) => c.state === 'drop');
      changed = true;
    }
  }
  // търкалящи се топки (паднали от пирамида)
  if (rollers.length) {
    const Lw = world.L;
    for (const c of rollers) {
      const st = c.st, s = st.s, rad = s / 2;
      c.vy -= CUBE_G * dt;
      c.x = clamp(c.x + c.vx * dt, -Lw + rad, Lw - rad); c.z = clamp(c.z + c.vz * dt, -Lw + rad, Lw - rad); c.y += c.vy * dt;
      const sp = Math.hypot(c.vx, c.vz);
      if (sp > 1e-3) { _wv.set(c.vz, 0, -c.vx).divideScalar(sp); _dq.setFromAxisAngle(_wv, (sp / rad) * dt); c.q.premultiply(_dq); }
      if (c.y <= st.base) {
        const h = holeUnder(c.x, c.z, s);
        if (h) { startCubeHole(c, h, true); continue; }
        c.y = st.base;
        c.vy = c.vy < -1.5 ? -c.vy * 0.25 : 0;              // малък отскок
        const fr = Math.exp(-1.2 * dt); c.vx *= fr; c.vz *= fr; // триене при търкаляне
        if (c.vy === 0 && sp < 0.06) { c.state = 'rest'; c.iy = 0; }
      }
      setCubeMatrix(c);
    }
    rollers = rollers.filter((c) => c.state === 'roll');
    changed = true;
  }
  // парчета, които падат в дупка
  if (holeCubes.length) {
    for (const c of holeCubes) {
      const h = c.h, s = c.st.s;
      c.vy -= CUBE_G * dt;
      c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
      const wl = c.w.length();
      if (wl > 1e-4) { _wv.copy(c.w).divideScalar(wl); _dq.setFromAxisAngle(_wv, wl * dt); c.q.premultiply(_dq); }
      // стените на шахтата: парчето се удря, отскача слабо и се завърта
      if (c.y < s * 0.5) {
        const rx = c.x - h.x, rz = c.z - h.z, d = Math.hypot(rx, rz), lim = Math.max(0.02, h.R - s * 0.55);
        if (d > lim) {
          const nx = rx / d, nz = rz / d;
          c.x = h.x + nx * lim; c.z = h.z + nz * lim;
          const vr = c.vx * nx + c.vz * nz;
          if (vr > 0) {
            c.vx -= 1.3 * vr * nx; c.vz -= 1.3 * vr * nz;
            c.w.x += -nz * vr * 3 + (Math.random() - 0.5); c.w.z += nx * vr * 3 + (Math.random() - 0.5);
          }
          c.vy *= 0.985;
        }
      }
      if (c.y < -(s + 4)) consumeCube(c); else setCubeMatrix(c);
    }
    holeCubes = holeCubes.filter((c) => c.state === 'hole');
    changed = true;
  }
  if (changed) markPieces();
}

// За запазване: падащите в дупка се зачитат веднага, потъващите постройки и търкалящите се топки се довършват.
function cubesSnapshot() {
  for (const c of holeCubes) consumeCube(c);
  holeCubes = [];
  for (const c of rollers) { c.state = 'rest'; c.iy = 0; c.y = c.st.base; c.vx = c.vz = c.vy = 0; }
  rollers = [];
  for (const st of structs) {
    if (st.fall) {
      let k = Math.floor(st.fall.y / st.sy);
      for (const c of st.cubes) if (c.state === 'rest') k = Math.min(k, c.iy);
      st.fall = null;
      for (const c of st.cubes) if (c.state === 'rest') { c.iy -= k; c.y = restY(st, c.iy); }
    }
  }
  const r2 = (v) => Math.round(v * 100) / 100;
  return cubes.filter((c) => c.state === 'rest' || c.state === 'drop').map((c) =>
    c.loose ? [c.id, 0, r2(c.x), r2(c.z)] : [c.id, c.state === 'rest' ? c.iy : Math.max(0, Math.round((c.y - c.st.base) / c.st.sy))]);
}
function cubesRestore(list) {
  const alive = new Map(list.map((a) => [a[0], a]));
  for (const c of cubes) {
    const a = alive.get(c.id);
    if (!a) { c.state = 'dead'; c.st.left--; setCubeMatrix(c); continue; }
    c.iy = a[1]; c.y = restY(c.st, c.iy); c.state = 'rest';
    if (a.length > 2) { c.loose = true; c.x = a[2]; c.z = a[3]; c.iy = 0; c.y = c.st.base; }
  }
  for (const st of structs) {
    st.grid.clear(); st.drops = [];
    for (const c of st.cubes) if (c.state === 'rest' && !c.loose) st.grid.set(ckey(c.ix, c.iy, c.iz), c);
    st.dirty = true;
  }
  for (const c of cubes) setCubeMatrix(c);
  markPieces();
}

// Карта от кубчета
function layoutCubes(L, counts) {
  const E = L + 30;
  const { cv, P } = makeGroundCanvas(E, '#bfe8a9');
  for (let x = -L; x < L; x += 2) for (let z = -L; z < L; z += 2) if (((x + z) / 2) % 2 === 0) P.rect(x, z, x + 2, z + 2, '#b2e09a');
  P.rect(-1.5, -L, 1.5, L, '#f1e3b8'); P.rect(-L, -1.5, L, 1.5, '#f1e3b8');
  border(P, L);
  finishGround(cv, E);
  block(0, 0, 1.2);
  const order = [...CUBE_CATS].sort((a, b) => b.order - a.order);
  for (const c of order) {
    const n = counts[c.id] || 0;
    for (let i = 0; i < n; i++) {
      const type = pick(c.types);
      for (let tr = 0; tr < 40; tr++) {
        const x = RR(-L + 2, L - 2), z = RR(-L + 2, L - 2);
        if (Math.abs(x) < 2 || Math.abs(z) < 2) continue; // пътеките остават свободни
        if (addStruct(type, x, z)) break;
      }
    }
  }
  finishCubes();
}

// ================= дупки =================
const discMat = new THREE.MeshBasicMaterial({
  colorWrite: false, depthWrite: false,
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
});
const discGeo = new THREE.CircleGeometry(1, 56).rotateX(-Math.PI / 2);
const ringGeo = new THREE.RingGeometry(1, 1.07, 64).rotateX(-Math.PI / 2);
function wallGeo(color) {
  const g = new THREE.CylinderGeometry(1, 1, 40, 48, 8, true);
  g.translate(0, -20, 0);
  // по-тъмен преход, за да изглежда дълбока
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(color).multiplyScalar(0.35), bot = new THREE.Color('#000000');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = clamp(-pos.getY(i) / 4, 0, 1);
    c.copy(top).lerp(bot, t);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

function makeHole(names, color, x, z, R0, bot) {
  const grp = new THREE.Group();
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = 0.003;
  disc.renderOrder = -3;
  const wall = new THREE.Mesh(wallGeo(color), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  const bottom = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: '#000000', fog: false }));
  bottom.position.y = -39;
  // ръбът се вижда и през сгради, за да знаеш винаги къде е дупката
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 }));
  ring.position.y = 0.025;
  ring.renderOrder = 10;
  grp.add(disc, wall, bottom, ring);
  scene.add(grp);
  const label = document.createElement('div');
  label.className = 'label';
  $('labels').appendChild(label);
  const h = { names, color, x, z, vx: 0, vz: 0, R: R0, R0, mass: 0, grp, label, bot, alive: true, respawn: 0, eaten: 0, score: 0, think: 0, tx: x, tz: z };
  holes.push(h);
  return h;
}
const targetR = (h) => Math.sqrt(h.R0 * h.R0 + GROW * h.mass);

// ================= състояние на играта =================
let mode = 'menu';      // menu | level | battle
let state = 'menu';     // menu | play | pause | end
let timeLeft = 0, theme = 'park';
let cfgCur = { kind: 'career', level: 1 };
let elapsed = 0;
let sweep = 0;

function clearWorld() {
  for (const o of objs) scene.remove(o.mesh);
  for (const h of holes) { scene.remove(h.grp); h.label.remove(); h.grp.traverse((m) => { if (m.material && m.material !== discMat) m.material.dispose(); }); }
  if (groundMesh) { scene.remove(groundMesh); groundMesh.geometry.dispose(); if (groundMat.map) groundMat.map.dispose(); groundMesh = null; }
  for (const m of decor) scene.remove(m);
  if (cubeMesh) { scene.remove(cubeMesh); for (const k in pieceMeshes) pieceMeshes[k].dispose(); cubeMesh = null; pieceMeshes = {}; }
  objs = []; occ = []; holes = []; player = null; decor = []; cubes = []; structs = []; holeCubes = []; rollers = [];
}

// Светът се строи детерминирано от настройката (cfg), за да може запазена игра да се възстанови.
function buildWorld(cfg) {
  clearWorld();
  const wk = cfg.kind === 'career' ? THEMES[(cfg.level - 1) % THEMES.length] : cfg.kind === 'single' ? singleWorld(cfg) : 'city';
  const bgc = INDOOR[wk] ? INDOOR[wk].bg : SKY;
  scene.background = new THREE.Color(bgc); scene.fog.color.set(bgc);
  world = { L: 0, total: 0, nextId: 0 };
  if (cfg.kind === 'career') {
    const n = cfg.level;
    theme = THEMES[(n - 1) % THEMES.length];
    const cycle = Math.floor((n - 1) / THEMES.length);
    rng = mulberry32(1000 + n * 7919);
    if (theme === 'park') { world.L = 28 + cycle * 5; layoutPark(world.L); }
    else if (theme === 'farm') { world.L = 36 + cycle * 5; layoutFarm(world.L); }
    else if (INDOOR[theme]) {
      world.L = 26 + cycle * 4;
      const k = (world.L / 24) ** 2, counts = {};
      for (const c of INDOOR[theme].cats) counts[c.id] = Math.round(c.max * 0.75 * k);
      layoutIndoor(theme, world.L, counts);
    }
    else if (theme === 'cubes') {
      world.L = 30 + cycle * 5;
      const k = (world.L / 30) ** 2, counts = {};
      for (const id in CUBE_CAREER) counts[id] = Math.round(CUBE_CAREER[id] * k * (1 + cycle * 0.15));
      layoutCubes(world.L, counts);
    }
    else layoutCity(theme === 'city' ? 40 + cycle * 6 : 46 + cycle * 6, theme);
    rng = Math.random;
    player = makeHole(PLAYER_NAMES, PLAYER_COLOR, world.start ? world.start.x : 0, world.start ? world.start.z : theme === 'park' ? 9 : 0, startR(), false);
  } else if (cfg.kind === 'single') {
    theme = 'single';
    rng = mulberry32(cfg.seed);
    world.L = SIZES[cfg.size].L;
    const wk = singleWorld(cfg);
    if (wk === 'cubes') layoutCubes(world.L, cfg.counts); else if (INDOOR[wk]) layoutIndoor(wk, world.L, cfg.counts); else layoutCustom(world.L, cfg.counts);
    rng = Math.random;
    player = makeHole(PLAYER_NAMES, PLAYER_COLOR, world.start ? world.start.x : 0, world.start ? world.start.z : 0, startR(), false);
  } else {
    theme = 'battle';
    rng = mulberry32(cfg.seed);
    layoutCity(48, R() < 0.5 ? 'city' : 'downtown');
    rng = Math.random;
    const L = world.L;
    const R0 = 0.9 + 0.04 * save.up.size;
    player = makeHole(PLAYER_NAMES, PLAYER_COLOR, 0, 0, R0, false);
    const spots = [[-L * 0.6, -L * 0.6], [L * 0.6, -L * 0.6], [-L * 0.6, L * 0.6], [L * 0.6, L * 0.6]];
    BOTS.forEach((b, i) => {
      const h = makeHole(b.names, b.color, spots[i][0], spots[i][1], 0.9, true);
      h.skill = 0.84 + i * 0.05;
    });
  }
}

// ================= вход =================
const input = { x: 0, z: 0, active: false, ox: 0, oy: 0, id: null };
const keys = new Set();
const joy = $('joy'), joyKnob = joy.querySelector('b');
canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'play') return;
  e.preventDefault();
  input.active = true; input.id = e.pointerId; input.ox = e.clientX; input.oy = e.clientY; input.x = 0; input.z = 0;
  joy.style.left = e.clientX + 'px'; joy.style.top = e.clientY + 'px'; joy.style.display = 'block';
  joyKnob.style.transform = '';
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* нищо */ }
  audio();
}, { passive: false });
canvas.addEventListener('pointermove', (e) => {
  if (!input.active || e.pointerId !== input.id) return;
  let dx = e.clientX - input.ox, dy = e.clientY - input.oy;
  const max = 55;
  const len = Math.hypot(dx, dy);
  if (len > max) {
    // джойстикът „следва“ пръста, за да няма мъртва зона при обръщане
    input.ox += (dx / len) * (len - max); input.oy += (dy / len) * (len - max);
    joy.style.left = input.ox + 'px'; joy.style.top = input.oy + 'px';
    dx = e.clientX - input.ox; dy = e.clientY - input.oy;
  }
  input.x = dx / max; input.z = dy / max;
  joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
});
const endPointer = (e) => { if (e.pointerId === input.id) { input.active = false; input.x = 0; input.z = 0; joy.style.display = 'none'; } };
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
window.addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase());
  if ((e.key === 'Escape' || e.key === 'p') && (state === 'play' || state === 'pause')) { if (state === 'play') pause(); else resume(); }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
function readInput() {
  let x = input.x, z = input.z;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (keys.has('w') || keys.has('arrowup')) z -= 1;
  if (keys.has('s') || keys.has('arrowdown')) z += 1;
  if (window.__dupkaBot) { x = window.__dupkaBot.x; z = window.__dupkaBot.z; }
  const len = Math.hypot(x, z);
  if (len > 1) { x /= len; z /= len; }
  return [x, z];
}

// ================= звук =================
let actx = null;
function audio() {
  if (!save.sound) return null;
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(f, dur, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
}
let lastPop = 0;
function popSound(r) {
  const now = performance.now();
  if (now - lastPop < 45) return;
  lastPop = now;
  const f = clamp(900 / Math.pow(r + 0.3, 0.8), 90, 1200);
  tone(f, 0.12 + r * 0.04, 'sine', 0.1 + Math.min(r, 4) * 0.02, f * 0.5);
  if (r > 2) tone(70, 0.4, 'triangle', 0.18, 35);
}
const sfx = {
  grow() { tone(523, 0.1, 'triangle', 0.08); tone(784, 0.14, 'triangle', 0.08, 0, 0.08); },
  star() { [0, 4, 7, 12].forEach((s, i) => tone(523 * Math.pow(2, s / 12), 0.2, 'triangle', 0.09, 0, i * 0.07)); },
  eatHole() { tone(300, 0.6, 'sawtooth', 0.12, 50); },
  tick() { tone(1000, 0.05, 'square', 0.05); },
  oops() { tone(330, 0.18, 'square', 0.08, 220); tone(220, 0.3, 'square', 0.08, 110, 0.15); },
  end() { [0, 4, 7].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.25, 'triangle', 0.1, 0, i * 0.12)); },
};

// ================= надписи =================
const v3 = new THREE.Vector3();
function toScreen(x, y, z) {
  v3.set(x, y, z).project(camera);
  return [(v3.x * 0.5 + 0.5) * window.innerWidth, (-v3.y * 0.5 + 0.5) * window.innerHeight, v3.z < 1];
}
function floatText(x, z, text, cls) {
  const [sx, sy, ok] = toScreen(x, 1.5, z);
  if (!ok) return;
  const el = document.createElement('div');
  el.className = 'float' + (cls ? ' ' + cls : ''); el.textContent = text;
  el.style.left = sx + 'px'; el.style.top = sy + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
let bannerT = 0;
function banner(text, small) {
  const el = $('banner');
  el.textContent = text;
  if (small) { const s = document.createElement('small'); s.textContent = small; el.appendChild(s); }
  el.classList.add('show');
  clearTimeout(bannerT);
  bannerT = setTimeout(() => el.classList.remove('show'), 1800);
}

// ================= обновяване =================
const qY = new THREE.Quaternion(), qT = new THREE.Quaternion(), axisY = new THREE.Vector3(0, 1, 0), tAxis = new THREE.Vector3();
let starsGot = 0;

function update(dt) {
  elapsed += dt;
  timeLeft -= dt;
  const L = world.L;

  // играч
  if (player.alive) {
    const [ix, iz] = readInput();
    const sp = (6 + player.R * 1.1) * speedMul();
    player.vx = lerp(player.vx, ix * sp, 1 - Math.exp(-dt * 10));
    player.vz = lerp(player.vz, iz * sp, 1 - Math.exp(-dt * 10));
  }
  for (const h of holes) {
    if (h.bot && h.alive) botThink(h, dt);
    if (h.safe > 0) { h.safe -= dt; h.grp.children[3].visible = Math.floor(h.safe * 6) % 2 === 0 || h.safe <= 0; }
    if (!h.alive) {
      h.R = lerp(h.R, 0.01, 1 - Math.exp(-dt * 8));
      h.respawn -= dt;
      if (h.respawn <= 0) respawnHole(h);
    } else {
      h.R = lerp(h.R, targetR(h), 1 - Math.exp(-dt * 4));
      h.x = clamp(h.x + h.vx * dt, -L + h.R * 0.5, L - h.R * 0.5);
      h.z = clamp(h.z + h.vz * dt, -L + h.R * 0.5, L - h.R * 0.5);
    }
    h.grp.position.set(h.x, 0, h.z);
    h.grp.scale.set(Math.max(h.R, 0.01), 1, Math.max(h.R, 0.01));
  }

  // дупка гълта дупка (битка)
  if (mode === 'battle') {
    for (const a of holes) for (const b of holes) {
      if (a === b || !a.alive || !b.alive || b.safe > 0) continue;
      if (a.R > b.R * 1.12 && Math.hypot(a.x - b.x, a.z - b.z) < a.R - b.R * 0.4) {
        b.alive = false; b.respawn = 3;
        a.mass += (b.mass * 0.4 + 4) * (a.bot ? botGrow() : 1);
        b.mass *= 0.5;
        sfx.eatHole(); buzz(60);
        if (b === player) banner(t('gotEaten', holeName(a)), t('backSoon'));
        else if (a === player) { banner(t('ateHole', holeName(b))); player.score += 50; }
      }
    }
  }

  // обекти
  for (const o of objs) {
    if (o.dead) continue;
    if (o.fall) { updateFall(o, dt); continue; }
    if (o.mover) move(o, dt);
    let wob = 0;
    for (const h of holes) {
      if (!h.alive) continue;
      const dx = o.x - h.x, dz = o.z - h.z;
      const lim = h.R + o.r;
      if (dx > lim || dx < -lim || dz > lim || dz < -lim) continue;
      const d = Math.hypot(dx, dz);
      if (o.r <= h.R * 0.95) {
        if (d < h.R - o.r * 0.35) { startFall(o, h); break; }
      } else if (d < h.R * 0.9) {
        wob = Math.max(wob, 1 - d / h.R);
      }
    }
    if (o.fall) continue;
    if (wob > 0 || o.wob > 0) {
      o.wob = wob;
      const m = o.mesh;
      m.position.set(o.x, 0, o.z);
      m.rotation.set(Math.sin(elapsed * 22) * 0.05 * wob, o.ry, Math.cos(elapsed * 19) * 0.05 * wob);
      m.updateMatrix();
    }
  }
  if (++sweep % 120 === 0) objs = objs.filter((o) => !o.dead);
  if (cubeMesh) updateCubes(dt);

  // край
  if (mode === 'level') {
    const pct = player.eaten / world.total;
    const s = STARS.filter((x) => pct >= x).length;
    if (s > starsGot) { starsGot = s; sfx.star(); banner('⭐'.repeat(s)); }
    if (pct >= 0.995) { timeLeft = 0; }
  }
  if (timeLeft <= 0) endRound();
}

function startFall(o, h) {
  o.fall = { h, vy: 0, ang: 0 };
  o.mover = null;
  o.mesh.castShadow = false;
}
function updateFall(o, dt) {
  const f = o.fall, h = f.h;
  const k = 1 - Math.exp(-dt * 3);
  o.x += (h.x - o.x) * k; o.z += (h.z - o.z) * k;
  f.vy -= 22 * dt; o.y += f.vy * dt;
  f.ang = Math.min(f.ang + dt * 2.6, 1.4);
  const dx = h.x - o.x, dz = h.z - o.z;
  tAxis.set(dz, 0, -dx);
  if (tAxis.lengthSq() < 1e-6) tAxis.set(1, 0, 0);
  tAxis.normalize();
  qY.setFromAxisAngle(axisY, o.ry);
  qT.setFromAxisAngle(tAxis, -f.ang);
  o.mesh.quaternion.copy(qT).multiply(qY);
  o.mesh.position.set(o.x, o.y, o.z);
  o.mesh.updateMatrix();
  if (o.y < -(o.h + 4) || o.y < -30) consume(o, h);
}
function consume(o, h) {
  o.dead = true;
  scene.remove(o.mesh);
  if (PENALTY[o.type]) {
    // животно: не уголемява дупката и отнема точки
    const lost = Math.min(PENALTY[o.type], h.score);
    h.score -= lost;
    if (h === player) {
      floatText(h.x, h.z, '−' + PENALTY[o.type], 'bad');
      sfx.oops(); buzz([30, 40, 30]);
      const el = $('score'); el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
      hudT = 0;
    }
    return;
  }
  const before = Math.floor(targetR(h) * 10);
  h.mass += o.v * (h.bot ? botGrow() : 1);
  h.eaten += o.v;
  const pts = Math.max(1, Math.round(o.v * 10));
  h.score += pts;
  if (h === player) {
    popSound(o.r);
    if (o.r >= 1) { floatText(h.x, h.z, '+' + pts); buzz(8); }
    if (Math.floor(targetR(h) * 10) > before && Math.floor(targetR(h)) > Math.floor(before / 10)) sfx.grow();
  }
}

function move(o, dt) {
  const m = o.mover, L = world.L;
  if (m.kind === 'wander') {
    if (m.wait > 0) { m.wait -= dt; return; }
    const dx = m.tx - o.x, dz = m.tz - o.z, d = Math.hypot(dx, dz);
    if (d < 0.2) { m.tx = m.cx + RR(-m.rad, m.rad); m.tz = m.cz + RR(-m.rad, m.rad); m.wait = Math.random() * 2.5; return; }
    o.x += (dx / d) * m.speed * dt; o.z += (dz / d) * m.speed * dt;
    o.ry = Math.atan2(-dz, dx);
  } else if (m.kind === 'line') {
    let p = (m.axis === 'x' ? o.x : o.z) + m.dir * m.speed * dt;
    if (p > m.b) { p = m.b; m.dir = -1; } else if (p < m.a) { p = m.a; m.dir = 1; }
    if (m.axis === 'x') { o.x = p; o.z = m.line; o.ry = m.dir > 0 ? 0 : Math.PI; }
    else { o.z = p; o.x = m.line; o.ry = m.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
  } else if (m.kind === 'drive') {
    let p = (m.axis === 'x' ? o.x : o.z) + m.dir * m.speed * dt;
    if (Math.abs(p) > L - 3) { p = Math.sign(p) * (L - 3); m.dir = -m.dir; }
    const laneC = m.axis === 'z' ? m.road - m.lane * m.dir : m.road + m.lane * m.dir;
    if (m.axis === 'x') { o.x = p; o.z = lerp(o.z, laneC, 1 - Math.exp(-dt * 3)); o.ry = m.dir > 0 ? 0 : Math.PI; }
    else { o.z = p; o.x = lerp(o.x, laneC, 1 - Math.exp(-dt * 3)); o.ry = m.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
  }
  o.mesh.position.set(o.x, 0, o.z);
  o.mesh.rotation.set(0, o.ry, 0);
  o.mesh.updateMatrix();
}

function botThink(h, dt) {
  h.think -= dt;
  if (h.think <= 0) {
    h.think = 0.3 + Math.random() * 0.3;
    let tx = null, tz = null;
    // опасност
    let fx = 0, fz = 0;
    for (const o of holes) {
      if (o === h || !o.alive) continue;
      const d = Math.hypot(o.x - h.x, o.z - h.z);
      if (o.R > h.R * 1.12 && d < 3 + o.R * 1.6) { fx += (h.x - o.x) / (d + 0.1); fz += (h.z - o.z) / (d + 0.1); }
    }
    if (fx || fz) { tx = h.x + fx * 10; tz = h.z + fz * 10; }
    else {
      // плячка: по-малка дупка
      let bestS = 0;
      for (const o of holes) {
        if (o === h || !o.alive) continue;
        const d = Math.hypot(o.x - h.x, o.z - h.z);
        if (h.R > o.R * 1.15 && !(o.safe > 0) && d < 12 + h.R * 1.5) { const s = 40 / (d + 1); if (s > bestS) { bestS = s; tx = o.x; tz = o.z; } }
      }
      // обекти
      if (tx === null) {
        let best = 0;
        const reach = 18 + h.R * 3;
        for (const o of objs) {
          if (o.dead || o.fall || o.r > h.R * 0.93 || PENALTY[o.type]) continue;
          const dx = o.x - h.x, dz = o.z - h.z;
          if (Math.abs(dx) > reach || Math.abs(dz) > reach) continue;
          const s = o.v / (Math.hypot(dx, dz) + 2);
          if (s > best) { best = s; tx = o.x; tz = o.z; }
        }
      }
      if (tx === null) { tx = (Math.random() * 2 - 1) * world.L * 0.8; tz = (Math.random() * 2 - 1) * world.L * 0.8; }
    }
    h.tx = tx; h.tz = tz;
  }
  const dx = h.tx - h.x, dz = h.tz - h.z, d = Math.hypot(dx, dz);
  const sp = (6 + h.R * 1.1) * h.skill * (d > 0.3 ? 1 : 0);
  h.vx = lerp(h.vx, d > 0.01 ? (dx / d) * sp : 0, 1 - Math.exp(-dt * 6));
  h.vz = lerp(h.vz, d > 0.01 ? (dz / d) * sp : 0, 1 - Math.exp(-dt * 6));
}
function respawnHole(h) {
  const L = world.L;
  let best = null, bestD = -1;
  for (let i = 0; i < 12; i++) {
    const x = (Math.random() * 2 - 1) * L * 0.85, z = (Math.random() * 2 - 1) * L * 0.85;
    let md = Infinity;
    for (const o of holes) if (o !== h && o.alive) md = Math.min(md, Math.hypot(o.x - x, o.z - z));
    if (md > bestD) { bestD = md; best = [x, z]; }
  }
  h.x = best[0]; h.z = best[1]; h.vx = h.vz = 0;
  h.alive = true; h.R = 0.2; h.safe = 3;
  if (h === player) banner(t('backIn'));
}

// ================= камера, HUD =================
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function updateCamera(dt, snap) {
  const h = player;
  const aspect = window.innerWidth / window.innerHeight;
  const k = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;
  const r = Math.max(h.R, 0.8);
  const height = (9 + r * 3.6) * k, back = (6 + r * 2.6) * k;
  const tp = new THREE.Vector3(h.x, height, h.z + back);
  const tl = new THREE.Vector3(h.x, 0, h.z - r * 0.4);
  if (snap) { camPos.copy(tp); camLook.copy(tl); }
  else { const f = 1 - Math.exp(-dt * 5); camPos.lerp(tp, f); camLook.lerp(tl, f); }
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  scene.fog.near = height * 2.2; scene.fog.far = height * 5.5;
  // слънце и сенки следват играча
  const S = 18 + r * 7;
  sun.position.set(h.x + 20, 40 + r * 4, h.z + 14);
  sun.target.position.set(h.x, 0, h.z);
  const sc = sun.shadow.camera;
  if (sc.right !== S) { sc.left = -S; sc.right = S; sc.top = S; sc.bottom = -S; sc.near = 1; sc.far = 120 + r * 10; sc.updateProjectionMatrix(); }
}

let hudT = 0;
const holeName = (h) => (h === player ? t('you') : h.names[lang]);
function updateHud(dt) {
  hudT -= dt;
  // етикети над дупките
  for (const h of holes) {
    const showL = mode === 'battle' && h.alive;
    if (!showL) { h.label.style.display = 'none'; continue; }
    const [sx, sy, ok] = toScreen(h.x, 0, h.z - h.R * 1.05);
    h.label.style.display = ok ? 'block' : 'none';
    h.label.style.left = sx + 'px'; h.label.style.top = sy + 'px';
    h.label.textContent = (h.safe > 0 ? '🛡 ' : '') + holeName(h) + ' · ' + Math.round(h.R * 10);
  }
  if (hudT > 0) return;
  hudT = 0.2;
  const tl = Math.max(0, Math.ceil(timeLeft));
  $('timer').textContent = fmtTime(tl);
  $('timer').classList.toggle('low', tl <= 10);
  if (tl <= 5 && tl > 0 && Math.ceil(timeLeft) !== Math.ceil(timeLeft + 0.2)) sfx.tick();
  $('score').textContent = player.score.toLocaleString(lang === 'bg' ? 'bg-BG' : 'en-US') + ' ' + t('pts');
  $('sizeInfo').textContent = t('size') + ' ' + Math.round(player.R * 10);
  if (mode === 'level') {
    const pct = clamp(player.eaten / world.total, 0, 1);
    $('progFill').style.width = (pct * 100).toFixed(1) + '%';
    ['m1', 'm2', 'm3'].forEach((id, i) => $(id).classList.toggle('on', pct >= STARS[i]));
  } else {
    $('board').innerHTML = rankHtml();
  }
}
const fmtTime = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function rankHtml() {
  const rank = [...holes].sort((a, b) => b.R - a.R);
  return rank.map((h, i) => `<div class="${h === player ? 'me' : ''}"><span><i style="background:${h.color}"></i>${i + 1}. ${holeName(h)}</span><span>${Math.round(h.R * 10)}</span></div>`).join('');
}

// ================= запазване на напредъка =================
function snapshot() {
  for (const o of objs) if (!o.dead && o.fall) consume(o, o.fall.h);
  const r2 = (v) => Math.round(v * 100) / 100;
  return {
    v: 2, cfg: cfgCur, timeLeft, elapsed, starsGot,
    holes: holes.map((h) => ({ x: r2(h.x), z: r2(h.z), R0: h.R0, mass: h.mass, eaten: h.eaten, score: h.score, alive: h.alive, respawn: h.respawn, safe: h.safe || 0 })),
    objs: objs.filter((o) => !o.dead).map((o) => [o.id, r2(o.x), r2(o.z), r2(o.ry), (o.mover && o.mover.dir) || 0]),
    cubes: cubeMesh ? cubesSnapshot() : null,
  };
}
function saveProgress() { if (state === 'play' || state === 'pause') { try { store.set('dup.save', snapshot()); } catch (e) { /* без място */ } } }
function clearProgress() { store.set('dup.save', null); }
function applySnapshot(s) {
  timeLeft = s.timeLeft; elapsed = s.elapsed; starsGot = s.starsGot || 0;
  const alive = new Map(s.objs.map((a) => [a[0], a]));
  for (const o of objs) {
    const a = alive.get(o.id);
    if (!a) { o.dead = true; scene.remove(o.mesh); continue; }
    o.x = a[1]; o.z = a[2]; o.ry = a[3];
    if (o.mover && a[4]) o.mover.dir = a[4];
    o.mesh.position.set(o.x, 0, o.z); o.mesh.rotation.set(0, o.ry, 0); o.mesh.updateMatrix();
  }
  objs = objs.filter((o) => !o.dead);
  if (cubeMesh && s.cubes) cubesRestore(s.cubes);
  s.holes.forEach((d, i) => {
    const h = holes[i]; if (!h) return;
    Object.assign(h, { x: d.x, z: d.z, R0: d.R0, mass: d.mass, eaten: d.eaten, score: d.score, alive: d.alive, respawn: d.respawn || 0, safe: d.safe || 0 });
    h.R = h.alive ? targetR(h) : 0.01;
    h.grp.position.set(h.x, 0, h.z); h.grp.scale.set(h.R, 1, h.R);
  });
}

// ================= екрани и потоци =================
const SCREENS = ['scrMenu', 'scrSingle', 'scrBattle', 'scrPause', 'scrLevelEnd', 'scrBattleEnd'];
function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  $('hud').hidden = !(id === null || id === 'scrPause');
}
function cfgTitle(cfg) {
  if (cfg.kind === 'career') return t('level') + ' ' + cfg.level + ' · ' + t(THEMES[(cfg.level - 1) % THEMES.length]);
  if (cfg.kind === 'single') { const wk = singleWorld(cfg); return (wk === 'objects' ? t('single') : t('kind_' + wk)) + ' · ' + t('size' + cfg.size.toUpperCase()); }
  return t('battle') + ' · ' + t('diff_' + (cfg.diff || 'normal'));
}
function startGame(cfg, snap) {
  cfgCur = cfg;
  mode = cfg.kind === 'battle' ? 'battle' : 'level';
  buildWorld(cfg);
  timeLeft = cfg.kind === 'career' ? LEVEL_TIME + extraTime() : cfg.kind === 'single' ? SIZES[cfg.size].time : BATTLE_TIME;
  elapsed = 0; starsGot = 0;
  if (snap) applySnapshot(snap); else clearProgress();
  $('lvlName').textContent = cfgTitle(cfg);
  $('progress').hidden = mode === 'battle'; $('board').hidden = mode !== 'battle';
  hudT = 0;
  updateCamera(0, true);
  state = 'play';
  last = performance.now();
  show(null);
  if (snap) banner(t('welcomeBack'), fmtTime(Math.ceil(timeLeft)));
  else if (mode === 'battle') banner(t('battleGo'), t('beBiggest'));
  else banner(cfg.kind === 'career' ? t(theme) : t('single'), t('eatAll'));
  audio();
}
const startCareer = (n) => startGame({ kind: 'career', level: n });
let battleDiff = store.get('dup.diff', 'normal');
if (!DIFFS[battleDiff]) battleDiff = 'normal';
const startBattle = () => startGame({ kind: 'battle', diff: battleDiff, seed: Math.floor(Math.random() * 1e9) });
function openBattle() {
  for (const b of $('diffs').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.diff === battleDiff));
  show('scrBattle');
}
function pause() {
  if (state !== 'play') return;
  state = 'pause'; input.active = false; input.x = input.z = 0; joy.style.display = 'none';
  saveProgress();
  show('scrPause');
}
function resume() { state = 'play'; last = performance.now(); show(null); }

let nextAction = null;
function endRound() {
  state = 'end';
  clearProgress();
  input.active = false; input.x = input.z = 0; joy.style.display = 'none';
  sfx.end();
  if (mode === 'level') {
    const pct = clamp(player.eaten / world.total, 0, 1);
    const stars = STARS.filter((x) => pct >= x).length;
    const coins = Math.round(Math.max(0, player.score) / 25) + stars * 25;
    save.coins += coins;
    const career = cfgCur.kind === 'career';
    if (career && stars >= 1 && cfgCur.level >= save.level) save.level = cfgCur.level + 1;
    persist();
    $('leTitle').textContent = career ? (stars ? t('levelDone', cfgCur.level) : t('almost')) : t('done');
    $('leStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'off'}">⭐</span>`).join('');
    $('lePct').textContent = Math.round(pct * 100) + '%';
    $('leStat').textContent = player.score + ' ' + t('pts') + ' · ' + t('size') + ' ' + Math.round(player.R * 10) + ' · ' + cfgTitle(cfgCur) + (career && !stars ? ' · ' + t('need40') : '');
    $('leCoins').textContent = '+' + coins + ' 🪙';
    if (career) { $('btnNext').textContent = t('next'); $('btnNext').hidden = stars === 0; nextAction = () => startCareer(cfgCur.level + 1); }
    else { $('btnNext').textContent = t('newSetup'); $('btnNext').hidden = false; nextAction = openSingle; }
    setTimeout(() => show('scrLevelEnd'), 600);
  } else {
    const rank = [...holes].sort((a, b) => b.R - a.R);
    const place = rank.indexOf(player) + 1;
    const coins = Math.round(([80, 50, 35, 20, 10][place - 1] + Math.round(Math.max(0, player.score) / 40)) * DIFFS[cfgCur.diff || 'normal'].coins);
    save.coins += coins; persist();
    $('beTitle').textContent = place === 1 ? t('winner') : t('place', place);
    $('beRank').innerHTML = rankHtml();
    $('beCoins').textContent = player.score + ' ' + t('pts') + ' · +' + coins + ' 🪙';
    setTimeout(() => show('scrBattleEnd'), 600);
  }
}

function renderMenu() {
  $('coins').textContent = '🪙 ' + save.coins;
  const n = save.level;
  $('careerSub').textContent = t('careerSub', n, t(THEMES[(n - 1) % THEMES.length]));
  let sv = store.get('dup.save', null);
  if (sv && sv.v !== 2) { clearProgress(); sv = null; }
  $('btnContinue').hidden = !sv;
  if (sv) $('continueSub').textContent = t('contSub', cfgTitle(sv.cfg), fmtTime(Math.ceil(sv.timeLeft)));
  $('shop').innerHTML = '';
  for (const u of UPGRADES) {
    const lvl = save.up[u.id], cost = upCost(lvl), maxed = lvl >= u.max;
    const b = document.createElement('button');
    b.className = 'up'; b.type = 'button';
    b.disabled = maxed || save.coins < cost;
    b.innerHTML = `<span class="ic">${u.ic}</span><span class="nm">${t(u.nm)}</span><span class="lv">${t('upLvl', lvl, u.max)}</span><span class="pr">${maxed ? t('max') : cost + ' 🪙'}</span>`;
    b.addEventListener('click', () => {
      if (save.coins < cost || maxed) return;
      save.coins -= cost; save.up[u.id]++; persist(); sfx.grow(); renderMenu();
    });
    $('shop').appendChild(b);
  }
  syncSound();
}
function toMenu() {
  if (state === 'pause') saveProgress();
  mode = 'menu'; state = 'menu';
  if (!world || cfgCur.kind !== 'career') buildWorld({ kind: 'career', level: save.level });
  renderMenu();
  show('scrMenu');
}
function syncSound() { const s = t(save.sound ? 'soundOn' : 'soundOff'); $('btnSound').textContent = s; $('btnSound2').textContent = s; }
function toggleSound() { save.sound = !save.sound; persist(); syncSound(); }

// ---------- единично ниво: настройка ----------
const single = Object.assign({ kind: 'objects', size: 's', by: {} }, store.get('dup.single', {}));
if (!single.by) single.by = {};
if (single.counts) { single.by.objects = single.by.objects || single.counts; delete single.counts; } // стар формат
if (single.ccounts) { single.by.cubes = single.by.cubes || single.ccounts; delete single.ccounts; }
const catsFor = (k) => (k === 'cubes' ? CUBE_CATS : INDOOR[k] ? INDOOR[k].cats : CATS);
const curCats = () => catsFor(single.kind);
const curCounts = () => single.by[single.kind];
function catMax(c, size) { return Math.max(1, Math.round(c.max * SIZES[size].k)); }
function randomCounts(size, list = curCats()) {
  const counts = {};
  for (const c of list) counts[c.id] = 0;
  const smalls = list.filter((c) => c.small), rest = list.filter((c) => !c.small);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const chosen = [...shuffle(smalls).slice(0, 2 + Math.floor(Math.random() * 2)), ...shuffle(rest).slice(0, 2 + Math.floor(Math.random() * 3))];
  for (const c of chosen) { const m = catMax(c, size); counts[c.id] = Math.max(1, Math.round(m * (0.4 + Math.random() * 0.6))); }
  return counts;
}
function ensureCounts() {
  if (!WORLD_KINDS.includes(single.kind)) single.kind = 'objects';
  if (!single.by[single.kind]) single.by[single.kind] = randomCounts(single.size, curCats());
}
function openSingle() {
  ensureCounts();
  renderSingle();
  show('scrSingle');
}
function renderSingle() {
  for (const b of $('kinds').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.kind === single.kind));
  for (const b of $('sizes').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.size === single.size));
  const box = $('cats'); box.innerHTML = '';
  const counts = curCounts();
  for (const c of curCats()) {
    const m = catMax(c, single.size);
    const v = Math.min(counts[c.id] || 0, m);
    counts[c.id] = v;
    const row = document.createElement('label');
    row.className = 'cat' + (v ? '' : ' off');
    row.innerHTML = `<span class="ic">${c.ic}</span><span class="nm">${t('cat_' + c.id)}<small>${t('catd_' + c.id)}</small></span><span class="n">${v}</span><span></span><input type="range" min="0" max="${m}" value="${v}" aria-label="${t('cat_' + c.id)}">`;
    const inp = row.querySelector('input');
    inp.addEventListener('input', () => {
      counts[c.id] = +inp.value;
      row.querySelector('.n').textContent = inp.value;
      row.classList.toggle('off', +inp.value === 0);
      checkSingle();
    });
    box.appendChild(row);
  }
  checkSingle();
}
function checkSingle() {
  const counts = curCounts(), list = curCats();
  const smallN = list.filter((c) => c.small).reduce((s, c) => s + (counts[c.id] || 0), 0);
  $('singleWarn').hidden = smallN >= 8;
  const total = list.reduce((s, c) => s + (counts[c.id] || 0), 0);
  $('btnSinglePlay').disabled = total === 0;
  store.set('dup.single', single);
}
$('kinds').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  single.kind = b.dataset.kind; ensureCounts(); renderSingle();
});
$('sizes').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const old = single.size; single.size = b.dataset.size;
  // мащабирай броя спрямо новия размер (и за двата вида)
  for (const k in single.by) for (const c of catsFor(k)) { const counts = single.by[k]; if (counts) counts[c.id] = Math.round((counts[c.id] || 0) * SIZES[single.size].k / SIZES[old].k); }
  renderSingle();
});
$('btnRandom').addEventListener('click', () => { single.by[single.kind] = randomCounts(single.size); renderSingle(); sfx.grow(); });
$('btnSinglePlay').addEventListener('click', () => startGame({ kind: 'single', world: single.kind, size: single.size, counts: { ...curCounts() }, seed: Math.floor(Math.random() * 1e9) }));
$('btnSingleBack').addEventListener('click', () => show('scrMenu'));

// ---------- език ----------
function applyLang() {
  document.documentElement.lang = lang;
  document.title = t('title');
  $('logo').innerHTML = t('logo');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  renderMenu();
  if (!$('scrSingle').hidden) renderSingle();
}
for (const b of document.querySelectorAll('[data-lang]')) b.addEventListener('click', () => { lang = b.dataset.lang; store.set('dup.lang', lang); applyLang(); });

$('btnContinue').addEventListener('click', () => { const sv = store.get('dup.save', null); if (sv) startGame(sv.cfg, sv); });
$('btnCareer').addEventListener('click', () => startCareer(save.level));
$('btnSingle').addEventListener('click', openSingle);
$('btnBattle').addEventListener('click', openBattle);
$('diffs').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  battleDiff = b.dataset.diff; store.set('dup.diff', battleDiff); openBattle();
});
$('btnBattlePlay').addEventListener('click', startBattle);
$('btnBattleBack').addEventListener('click', () => show('scrMenu'));
$('btnPause').addEventListener('click', pause);
$('btnResume').addEventListener('click', resume);
$('btnQuit').addEventListener('click', toMenu);
$('btnNext').addEventListener('click', () => nextAction && nextAction());
$('btnRetry').addEventListener('click', () => startGame(cfgCur));
$('btnMenu1').addEventListener('click', toMenu);
$('btnMenu2').addEventListener('click', toMenu);
$('btnBattleAgain').addEventListener('click', startBattle);
$('btnSound').addEventListener('click', toggleSound);
$('btnSound2').addEventListener('click', toggleSound);
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (state === 'play') pause(); else saveProgress(); } });
window.addEventListener('pagehide', saveProgress);
window.addEventListener('popstate', () => { if (state === 'play') pause(); try { history.pushState(null, ''); } catch (e) { /* нищо */ } });
try { history.pushState(null, ''); } catch (e) { /* нищо */ }

// PWA
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('btnInstall').hidden = false; $('installHint').hidden = true; });
$('btnInstall').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  try { await deferredPrompt.userChoice; } catch (e) { /* отказ */ }
  deferredPrompt = null; $('btnInstall').hidden = true;
});
if (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) $('installHint').hidden = true;
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

if (/[?&]debug\b/.test(location.search)) {
  window.__dupka = () => ({
    mode, state, timeLeft, L: world.L, total: world.total, cfg: cfgCur,
    player: player && { x: player.x, z: player.z, R: player.R, eaten: player.eaten, alive: player.alive },
    holes: holes.map((h) => ({ name: holeName(h), x: h.x, z: h.z, R: h.R, alive: h.alive })),
    objs: objs.filter((o) => !o.dead && !o.fall).map((o) => ({ x: o.x, z: o.z, r: o.r, v: o.v, type: o.type }))
      .concat(cubes.filter((c) => c.state === 'rest' && c.iy === 0).map((c) => ({ x: pieceX(c), z: pieceZ(c), r: c.st.s, v: c.v * c.st.cubes.length / 4, type: 'cube:' + c.st.type }))),
    cubesLeft: cubes.filter((c) => c.state !== 'dead').length, cubesTotal: cubes.length, rolling: rollers.length, structs: structs.map((st) => ({ type: st.type, x: st.cx, z: st.cz, left: st.left, n: st.cubes.length })),
    moving: cubes.filter((c) => c.state === 'drop' || c.state === 'hole').map((c) => [c.id, c.state === 'hole' ? 1 : 0, +c.vy.toFixed(2), +c.y.toFixed(2)]),
    rigidFalls: structs.filter((st) => st.fall).map((st) => +st.fall.vy.toFixed(2)),
    holeCubes: holeCubes.slice(0, 40).map((c) => ({ x: +c.x.toFixed(2), y: +c.y.toFixed(2), z: +c.z.toFixed(2), vx: +c.vx.toFixed(2), vz: +c.vz.toFixed(2), w: +c.w.length().toFixed(2) })),
    calls: renderer.info.render.calls,
  });
  window.__dupkaStart = (m, n) => (m === 'battle' ? startBattle() : m === 'single' ? startGame({ kind: 'single', size: n || 's', counts: randomCounts(n || 's', CATS), seed: 7 }) : m === 'cubes' ? startGame({ kind: 'single', cubes: true, size: n || 's', counts: randomCounts(n || 's', CUBE_CATS), seed: 7 }) : INDOOR[m] ? startGame({ kind: 'single', world: m, size: n || 's', counts: Object.fromEntries(INDOOR[m].cats.map((c) => [c.id, Math.round(c.max * 0.75)])), seed: 7 }) : startCareer(n || 1));
}

// ================= цикъл =================
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state === 'play') { update(dt); updateCamera(dt); updateHud(dt); }
  else if (state === 'menu' && player) {
    // бавна обиколка в менюто
    const a = now / 9000;
    camera.position.set(Math.sin(a) * world.L * 0.9, world.L * 0.75, Math.cos(a) * world.L * 0.9);
    camera.lookAt(0, 0, 0);
    scene.fog.near = world.L * 1.2; scene.fog.far = world.L * 3;
    sun.position.set(20, 50, 14); sun.target.position.set(0, 0, 0);
    for (const o of objs) if (o.mover && !o.dead) move(o, dt);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

resize();
buildWorld({ kind: 'career', level: save.level });
applyLang();
toMenu();
$('loading').remove();
requestAnimationFrame(frame);
