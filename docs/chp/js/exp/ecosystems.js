// 4.3.4 „Съобщества и равновесие в природата“ — естествена гора с ливада и езеро до нива, овощна градина и парк, създадени от хората.
// Стъпки: опознай → естествено или изкуствено (+ хранителна верига и „ако изчезнат лисиците“) → приспособления (пустиня, полярни ледове, вода) → равновесие (вреди и мерки + предсказване).
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

// ---------- стилове (само за този модул) ----------
function injectStyle() {
  if (document.getElementById('ecosystems-style')) return;
  const s = document.createElement('style');
  s.id = 'ecosystems-style';
  s.textContent = `
  .ecosystems-q { margin:8px 0 4px; font-weight:700; }
  .xp-controls .choices.ecosystems-two { grid-template-columns: 1fr 1fr; }
  .xp-controls .choices.ecosystems-two .choice { flex-direction:column; justify-content:center; text-align:center; gap:2px; font-weight:700; }
  .xp-controls .choices.ecosystems-two .choice span { font-size:1.6rem; }
  .xp-controls .choices.ecosystems-four { grid-template-columns: 1fr 1fr; }
  .xp-controls .choices.ecosystems-four .choice { font-weight:700; font-size:.92rem; padding:8px; }
  .ecosystems-hud { position:absolute; top:8px; right:8px; z-index:4; background:rgba(255,255,255,.94); border:1px solid #cfd8e3;
    border-radius:10px; padding:6px 10px; font-size:.8rem; font-weight:800; color:#1b2a3a; min-width:150px; pointer-events:none; }
  .ecosystems-hud[hidden] { display:none; }
  .ecosystems-bar { height:10px; border-radius:99px; background:#e6e9ef; margin-top:4px; overflow:hidden; }
  .ecosystems-bar span { display:block; height:100%; width:100%; border-radius:99px; background:#2fa84f; transition:width .8s, background .8s; }
  .ecosystems-tally { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
  .ecosystems-tally span { font-size:.78rem; border-radius:99px; padding:2px 8px; font-weight:700; color:#fff; }
  .ecosystems-tally .n { background:#2f8f46; } .ecosystems-tally .a { background:#d9822b; }
  .ecosystems-chain { font-size:1.05rem; font-weight:800; margin-top:4px; }
  @media (max-width:520px) { .ecosystems-hud { min-width:120px; font-size:.72rem; padding:4px 8px; } }
  `;
  document.head.appendChild(s);
}

// ---------- данни ----------
// Местата в пейзажа (за менюто и за сортирането).
const PLACES = [
  { id: 'forest', label: 'Гора', icon: '🌲', nat: true,
    note: '<b>Гората</b> е създадена от природата. Никой не е засадил тези дървета – семената им са пренесени от вятъра и от животните. Тук живеят много видове растения и животни.' },
  { id: 'meadow', label: 'Ливада', icon: '🌼', nat: true,
    note: '<b>На ливадата</b> растат много видове треви и цветя. Никой не ги сее и не ги полива. Тук пасат зайци, а над цветята летят пеперуди.' },
  { id: 'pond', label: 'Езеро', icon: '🦆', nat: true,
    note: '<b>Езерото</b> е създадено от природата. В него живеят риби, жаби и патици, а по брега растат тръстики.' },
  { id: 'field', label: 'Нива', icon: '🌾', nat: false,
    note: '<b>Нивата</b> е създадена от човека. Фермерът оре земята, сее пшеница, полива я и я пази от плевели. Тук расте почти само един вид растение.' },
  { id: 'orchard', label: 'Овощна градина', icon: '🍎', nat: false,
    note: '<b>Овощните дървета</b> са засадени от хората в прави редици. Хората ги подрязват, пръскат ги срещу вредители и берат плодовете.' },
  { id: 'park', label: 'Парк', icon: '⛲', nat: false,
    note: '<b>Паркът</b> е направен от хората за отдих. Градинарите садят цветя, косят тревата и подрязват храстите.' },
];
const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));
const MENU = [
  { id: 'forest', label: 'Гора', icon: '🌲' },
  { id: 'meadow', label: 'Ливада и езеро', icon: '🌼' },
  { id: 'field', label: 'Нива', icon: '🌾' },
  { id: 'orchard', label: 'Овощна градина', icon: '🍎' },
  { id: 'park', label: 'Парк', icon: '⛲' },
  { id: 'animals', label: 'Животни', icon: '🐰' },
  { id: 'farmer', label: 'Фермер', icon: '👨‍🌾' },
];
const MENU_NOTE = {
  forest: PLACE.forest.note,
  meadow: '<b>Ливадата и езерото</b> са създадени от природата. На ливадата растат треви и цветя, а в езерото живеят риби, жаби и патици. Никой не се грижи за тях.',
  field: PLACE.field.note,
  orchard: PLACE.orchard.note,
  park: PLACE.park.note,
  animals: '<b>Животните</b> в гората и на ливадата са свързани чрез храната. Заекът яде трева, а лисицата лови зайци. Сърната пасе трева и яде листа.',
  farmer: '<b>Фермерът</b> се грижи за нивата и за овощната градина. Без грижите на човека нивата скоро ще обрасне с плевели.',
};

// Приспособления (стъпка 3).
const HABITATS = [
  { id: 'desert', label: 'Пустиня', x: -4.3, why: 'В пустинята е много горещо и почти няма вода.' },
  { id: 'polar', label: 'Полярни ледове', x: 0, why: 'В полярните ледове е много студено и всичко е покрито със сняг и лед.' },
  { id: 'water', label: 'Вода', x: 4.3, why: 'Тук живеят организми, които плуват и се хранят във водата.' },
];
const HAB = Object.fromEntries(HABITATS.map((h) => [h.id, h]));
const ORGS = [
  { id: 'camel', label: 'Камила', hab: 'desert', adapt: 'Гърбица със запас от мазнини',
    hint: 'Камилата издържа на голяма горещина и може дълго да върви без вода.',
    done: 'Камилата може дълго да върви през пустинята без храна и вода. Мазнините в гърбицата са неин запас.' },
  { id: 'cactus', label: 'Кактус', hab: 'desert', adapt: 'Бодли вместо листа и дебело стъбло',
    hint: 'Кактусът расте там, където вали много рядко.',
    done: 'Кактусът пази вода в дебелото си стъбло. През бодлите се губи много малко вода, а и те го пазят от животните.' },
  { id: 'bear', label: 'Бяла мечка', hab: 'polar', adapt: 'Дебела козина и слой мазнина',
    hint: 'Бялата мечка има бяла козина – като цвета на снега.',
    done: 'Гъстата козина и мазнината под кожата пазят бялата мечка от студа. Бялият цвят я прави незабележима в снега. Тя живее около Северния полюс.' },
  { id: 'penguin', label: 'Пингвин', hab: 'polar', adapt: 'Гъсти пера и слой мазнина',
    hint: 'Пингвините живеят сред ледовете около Южния полюс.',
    done: 'Гъстите пера и мазнината пазят пингвина от студа, а крилата му са като перки за плуване. Пингвините живеят около Южния полюс.' },
  { id: 'fish', label: 'Риба', hab: 'water', adapt: 'Хриле, с които диша във водата',
    hint: 'Рибата не може да живее без вода.',
    done: 'С хрилете рибата взима кислород от водата. Перките и гладкото тяло ѝ помагат да плува.' },
  { id: 'duck', label: 'Патица', hab: 'water', adapt: 'Ципести крака за плуване',
    hint: 'Патицата плува по водата и се гмурка за храна.',
    done: 'Между пръстите на патицата има ципи. С тях тя гребе като с весла. Перата ѝ са намазани с мазнина и не се мокрят.' },
];
const ORG = Object.fromEntries(ORGS.map((o) => [o.id, o]));

// Вреди и мерки (стъпка 4).
const HARMS = [
  { id: 'cut', label: 'Сеч', icon: '🪓',
    on: '🪓 Хората отсякоха много дървета. Животните загубиха дома си, а почвата остана без защита.' },
  { id: 'fire', label: 'Пожар', icon: '🔥',
    on: '🔥 Неизгасен огън от пикник подпали гората. Дърветата горят, а лисицата избяга.' },
  { id: 'trash', label: 'Отпадъци', icon: '🗑️',
    on: '🗑️ Туристи оставиха отпадъци. Те замърсяват почвата и водата, а животните могат да ги погълнат.' },
  { id: 'poach', label: 'Бракониерство', icon: '🎯',
    on: '🎯 Бракониер лови животни незаконно – без разрешение и в забранено време. Сърните изчезнаха.' },
];
const HARM = Object.fromEntries(HARMS.map((h) => [h.id, h]));
const FIXES = {
  cut: { icon: '🌱', label: 'Засаждане на дървета', done: 'Хората засадиха млади дръвчета. След години тук отново ще има гора.', hint: 'Отсечените дървета трябва да бъдат заменени с нови.' },
  fire: { icon: '🚒', label: 'Гасене на пожара', done: 'Огънят е изгасен. Растенията постепенно се възстановяват и лисицата се връща.', hint: 'Първо трябва да спрем огъня.' },
  trash: { icon: '🧤', label: 'Почистване', done: 'Доброволци събраха отпадъците. Гората отново е чиста.', hint: 'Отпадъците трябва да бъдат събрани и изхвърлени в кошче.' },
  poach: { icon: '🛡️', label: 'Защитена територия', done: 'Гората е обявена за защитена територия. Ловът тук е забранен и сърните се връщат.', hint: 'Трябва място, където е забранено да се ловуват животни.' },
};

// ---------- помощни ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- модели ----------
function legs(g, color, { n = 4, len = 0.5, r = 0.06, spreadX = 0.5, spreadZ = 0.18, y = 0 }) {
  const m = mat(color);
  const list = g.userData.legs || (g.userData.legs = []);
  const pts = n === 2 ? [[0, spreadZ], [0, -spreadZ]] : [[spreadX, spreadZ], [spreadX, -spreadZ], [-spreadX, spreadZ], [-spreadX, -spreadZ]];
  for (const [x, z] of pts) {
    const hip = new THREE.Group();
    hip.position.set(x, y + len, z);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, len, 8), m);
    l.position.y = -len / 2;
    hip.add(l);
    g.add(hip);
    list.push(hip);
  }
}

function quadruped(o) {
  const g = new THREE.Group();
  const bodyM = mat(o.color);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(o.r, o.len, 8, 16), bodyM);
  body.rotation.z = Math.PI / 2;
  body.position.y = o.legLen + o.r * 0.9;
  g.add(body);
  if (o.belly) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(o.r * 0.85, 16, 12), mat(o.belly));
    b.scale.set(1.6, 0.7, 0.9);
    b.position.set(0, o.legLen + o.r * 0.45, 0);
    g.add(b);
  }
  if (o.hump) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(o.r * 0.95, 14, 10), bodyM);
    h.scale.set(1.1, 0.9, 0.8);
    h.position.set(-o.len * 0.05, o.legLen + o.r * 1.6, 0);
    g.add(h);
  }
  const head = new THREE.Group();
  head.position.set(o.len / 2 + o.r * 0.9 + (o.neck ? o.r * 0.4 : 0), o.legLen + o.r * (1.4 + (o.neck || 0)), 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(o.headR, 16, 12), bodyM));
  if (o.snout) {
    const sn = new THREE.Mesh(new THREE.CylinderGeometry(o.headR * 0.35, o.headR * 0.55, o.snout, 10), mat(o.snoutColor || o.color));
    sn.rotation.z = -Math.PI / 2;
    sn.position.set(o.headR * 0.7 + o.snout / 2 - 0.05, -o.headR * 0.2, 0);
    head.add(sn);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(o.headR * 0.22, 8, 6), mat(0x222222));
    nose.position.set(o.headR * 0.7 + o.snout, -o.headR * 0.2, 0);
    head.add(nose);
  }
  const eyeM = mat(0x111111);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(o.headR * 0.13, 8, 6), eyeM);
    e.position.set(o.headR * 0.65, o.headR * 0.25, s * o.headR * 0.5);
    head.add(e);
    if (o.ears) {
      const ear = o.ears === 'long'
        ? new THREE.Mesh(new THREE.CapsuleGeometry(o.headR * 0.18, o.headR * 1.6, 4, 8), bodyM)
        : o.ears === 'round'
          ? new THREE.Mesh(new THREE.SphereGeometry(o.headR * 0.3, 10, 8), bodyM)
          : new THREE.Mesh(new THREE.ConeGeometry(o.headR * 0.3, o.headR * 0.7, 6), bodyM);
      ear.position.set(-o.headR * 0.1, o.headR * (o.ears === 'long' ? 1.3 : 0.85), s * o.headR * 0.45);
      if (o.ears === 'long') ear.rotation.x = s * 0.15;
      head.add(ear);
    }
  }
  g.add(head);
  g.userData.head = head;
  if (o.neck) {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(o.r * 0.45, o.r * 0.6, o.neck * o.r * 1.6, 10), bodyM);
    neck.position.set(o.len / 2 + o.r * 0.55, o.legLen + o.r * (0.9 + o.neck * 0.6), 0);
    neck.rotation.z = -0.5;
    g.add(neck);
  }
  if (o.tail) {
    const t = o.tail === 'puff'
      ? new THREE.Mesh(new THREE.SphereGeometry(o.r * 0.35, 10, 8), mat(0xffffff))
      : new THREE.Mesh(new THREE.ConeGeometry(o.r * (o.tail === 'bushy' ? 0.45 : 0.25), o.r * 2.2, 8), bodyM);
    t.position.set(-o.len / 2 - o.r * 1.0, o.legLen + o.r * 1.0, 0);
    if (o.tail !== 'puff') t.rotation.z = 2.0;
    g.add(t);
    g.userData.tail = t;
  }
  legs(g, o.legColor || o.color, { len: o.legLen, r: o.r * 0.22, spreadX: o.len * 0.45, spreadZ: o.r * 0.5 });
  return g;
}
const rabbitModel = () => quadruped({ color: 0xa1887f, belly: 0xd7ccc8, r: 0.18, len: 0.28, legLen: 0.12, headR: 0.14, ears: 'long', tail: 'puff' });
const foxModel = () => quadruped({ color: 0xd9662b, belly: 0xf5ede0, r: 0.17, len: 0.46, legLen: 0.24, headR: 0.14, ears: 'pointy', tail: 'bushy', snout: 0.17, snoutColor: 0xf5ede0, legColor: 0x4a2f1f });
const deerModel = () => quadruped({ color: 0xa0673a, belly: 0xe8d2b8, r: 0.22, len: 0.55, legLen: 0.6, headR: 0.15, ears: 'pointy', tail: 'puff', neck: 1.4, snout: 0.12 });
const camelModel = () => quadruped({ color: 0xc9a066, r: 0.26, len: 0.62, legLen: 0.75, headR: 0.14, ears: 'round', tail: 'thin', neck: 1.7, snout: 0.16, hump: true });
const polarBearModel = () => quadruped({ color: 0xf4f1e8, r: 0.36, len: 0.6, legLen: 0.3, headR: 0.24, ears: 'round', snout: 0.18, snoutColor: 0xe9e4d6 });

function personModel(shirt, pants, hatColor) {
  const g = new THREE.Group();
  const skin = mat(0xf2c7a5);
  legs(g, pants, { n: 2, len: 0.5, r: 0.07, spreadZ: 0.1 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.36, 6, 12), mat(shirt));
  body.position.y = 0.78;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), skin);
  head.position.y = 1.24;
  g.add(head);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), mat(0x222222));
    e.position.set(0.13, 1.27, s * 0.06);
    g.add(e);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.36, 4, 8), mat(shirt));
    arm.position.set(0, 0.8, s * 0.24);
    arm.rotation.x = s * 0.15;
    g.add(arm);
  }
  if (hatColor !== undefined) {
    const hm = mat(hatColor);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 16), hm);
    brim.position.y = 1.36;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.16, 14), hm);
    top.position.y = 1.44;
    g.add(brim, top);
  }
  return g;
}

function duckModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), mat(0x8d6e63));
  body.scale.set(1.45, 0.75, 1);
  body.position.y = 0.12;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat(0x2e7d32));
  head.position.set(0.26, 0.34, 0);
  g.add(head);
  const bill = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.08), mat(0xffa000));
  bill.position.set(0.4, 0.31, 0);
  g.add(bill);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), mat(0x111111));
    e.position.set(0.33, 0.37, s * 0.07);
    g.add(e);
    // ципест крак: плоско триъгълно стъпало
    const foot = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.02, 3), mat(0xff8f00));
    foot.position.set(-0.02, -0.08, s * 0.1);
    g.add(foot);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 6), mat(0x6d4c41));
  tail.rotation.z = 2.2;
  tail.position.set(-0.32, 0.2, 0);
  g.add(tail);
  return g;
}

function penguinModel() {
  const g = new THREE.Group();
  const black = mat(0x1f2328);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.32, 6, 14), black);
  body.position.y = 0.4;
  g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), mat(0xf7f7f2));
  belly.scale.set(0.6, 1.35, 0.9);
  belly.position.set(0.09, 0.38, 0);
  g.add(belly);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), black);
  head.position.y = 0.78;
  g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 8), mat(0xff9800));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.18, 0.76, 0);
  g.add(beak);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), mat(0xffffff));
    e.position.set(0.11, 0.82, s * 0.07);
    g.add(e);
    const fl = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.26, 4, 8), black);
    fl.position.set(0, 0.45, s * 0.22);
    fl.rotation.x = s * 0.3;
    g.add(fl);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.07), mat(0xff9800));
    foot.position.set(0.06, 0.02, s * 0.08);
    g.add(foot);
  }
  return g;
}

function fishModel(color = 0xff8a3d) {
  const g = new THREE.Group();
  const m = mat(color);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), m);
  body.scale.set(1.6, 0.9, 0.55);
  g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 4), m);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.38;
  g.add(tail);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), m);
  fin.position.set(0, 0.2, 0);
  g.add(fin);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mat(0x111111));
    e.position.set(0.22, 0.05, s * 0.09);
    g.add(e);
    // хриле – тъмна черта зад окото
    const gill = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.01), mat(0xb3471d));
    gill.position.set(0.12, 0, s * 0.105);
    g.add(gill);
  }
  g.userData.tail = tail;
  return g;
}

function cactusModel() {
  const g = new THREE.Group();
  const m = mat(0x4f9a3c);
  const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.8, 6, 12), m);
  trunk.position.y = 0.56;
  g.add(trunk);
  for (const [s, h] of [[1, 0.55], [-1, 0.75]]) {
    const a1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.2, 4, 8), m);
    a1.rotation.x = Math.PI / 2;
    a1.position.set(0, h, s * 0.24);
    const a2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.26, 4, 8), m);
    a2.position.set(0, h + 0.17, s * 0.36);
    g.add(a1, a2);
  }
  const spineM = mat(0xfaf6e8);
  for (let i = 0; i < 18; i++) {
    const a = i * 2.1;
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.08, 4), spineM);
    sp.position.set(Math.cos(a) * 0.17, 0.25 + (i % 6) * 0.13, Math.sin(a) * 0.17);
    sp.rotation.set(Math.sin(a) * 1.5, 0, -Math.cos(a) * 1.5);
    g.add(sp);
  }
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0xec407a));
  fl.position.y = 1.08;
  g.add(fl);
  return g;
}

// Широколистно дърво или бор; всяко дърво има свой материал, за да може да „изгори“ и после да се възстанови.
function treeModel(pine = false, leafColor = 0x3f8f3a) {
  const g = new THREE.Group();
  const trunkM = mat(0x7a5230);
  const leafM = mat(leafColor, { flat: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, pine ? 1.0 : 1.4, 7), trunkM);
  trunk.position.y = pine ? 0.5 : 0.7;
  g.add(trunk);
  if (pine) {
    for (const [y, r, h] of [[1.2, 0.95, 1.3], [1.85, 0.75, 1.1], [2.45, 0.5, 0.9]]) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), leafM);
      c.position.y = y;
      g.add(c);
    }
  } else {
    for (const [x, y, z, r] of [[0, 2.0, 0, 0.95], [0.55, 1.7, 0.25, 0.65], [-0.5, 1.75, -0.25, 0.7], [0.1, 2.55, 0.1, 0.62]]) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leafM);
      b.position.set(x, y, z);
      g.add(b);
    }
  }
  g.userData.leafM = leafM;
  g.userData.trunkM = trunkM;
  g.userData.leaf0 = new THREE.Color(leafColor);
  return g;
}

function appleTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 7), mat(0x6d4c2f));
  trunk.position.y = 0.45;
  g.add(trunk);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), mat(0x4caf50, { flat: true }));
  crown.position.y = 1.3;
  crown.scale.y = 0.85;
  g.add(crown);
  const red = mat(0xe53935);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.3;
    const ap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), red);
    ap.position.set(Math.cos(a) * 0.62, 1.15 + (i % 3) * 0.2, Math.sin(a) * 0.62);
    g.add(ap);
  }
  return g;
}

function grassPatch(m, n = 16, r = 0.55) {
  const g = new THREE.Group();
  const blades = [];
  for (let i = 0; i < n; i++) {
    const h = 0.3 + Math.random() * 0.3;
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.045, h, 4), m);
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * r;
    b.position.set(Math.cos(a) * rr, h / 2, Math.sin(a) * rr);
    b.userData.phase = Math.random() * 6;
    g.add(b);
    blades.push(b);
  }
  g.userData.blades = blades;
  return g;
}

function stumpModel() {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.22, 8), mat(0x7a5230));
  s.position.y = 0.11;
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.2, 10), mat(0xd8b384));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.225;
  g.add(s, top);
  return g;
}

function trashItem(i) {
  const kinds = [
    () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 10), mat(0x4fc3f7, { transparent: true, opacity: 0.8 })); m.rotation.z = Math.PI / 2; m.position.y = 0.06; return m; },
    () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.13, 10), mat(0xe53935, { metalness: 0.5, roughness: 0.4 })); m.position.y = 0.065; return m; },
    () => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat(0xf5f5f5, { flat: true })); m.scale.y = 0.6; m.position.y = 0.07; return m; },
    () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.14), mat(0xffca28)); m.position.y = 0.02; return m; },
  ];
  const g = new THREE.Group();
  g.add(kinds[i % kinds.length]());
  return g;
}

// Стрелка „храна → този, който я яде“, която се „изрисува“.
function arrowBetween(a, b, color = 0xff8f00) {
  const p0 = a.clone().setY(a.y + 0.6);
  const p2 = b.clone().setY(b.y + 0.6);
  const mid = p0.clone().lerp(p2, 0.5);
  mid.y += 0.9 + p0.distanceTo(p2) * 0.15;
  const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
  const geo = new THREE.TubeGeometry(curve, 40, 0.05, 8, false);
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4 });
  const tube = new THREE.Mesh(geo, m);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 12), m);
  head.position.copy(curve.getPoint(0.94));
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(0.94).normalize());
  head.visible = false;
  const g = new THREE.Group();
  g.add(tube, head);
  const total = geo.index.count;
  geo.setDrawRange(0, 0);
  g.userData.grow = { k: 0, total, head, geo };
  return g;
}

// ---------- преживяване ----------
export function mount(container, opts) {
  injectStyle();
  let inst = null;
  const restart = () => { inst.dispose(); inst = build(container, opts, restart); };
  inst = build(container, opts, restart);
  return { dispose() { inst.dispose(); } };
}

function build(container, { onComplete }, restart) {
  const STEPS = ['Опознай природата', 'Естествено или изкуствено?', 'Приспособления', 'Равновесие в природата'];
  const shell = createShell(container, { steps: STEPS });
  const SKY = 0xbfe3ff;
  const stage = createStage(shell.stageEl, {
    background: SKY, camPos: [0, 11, 17], target: [0, 0.5, 0], shadows: true,
    fog: { color: SKY, near: 30, far: 70 }, minDistance: 2.5, maxDistance: 32, maxPolarAngle: Math.PI * 0.45,
  });
  const { scene, camera } = stage;
  stage.onHover(() => {});
  const narrowUI = () => stage.renderer.domElement.clientWidth < 480;
  const disposers = [];

  // Анимации на стъпки (Promise), независимо от честотата на кадрите.
  let rdt = 0.016;
  let lastNow = performance.now();
  stage.tick(() => { const n = performance.now(); rdt = Math.min(0.25, Math.max(0.001, (n - lastNow) / 1000)); lastNow = n; });
  let alive = true;
  const phase = (dur, fn) => new Promise((res) => {
    let k = 0;
    const stop = stage.tick((dt, t) => {
      if (!alive) { stop(); return; }
      k = Math.min(1, k + rdt / dur);
      if (fn) fn(k, rdt, t);
      if (k >= 1) { stop(); res(); }
    });
  });
  const wait = (sec) => phase(sec);
  async function hop(g, to, dur = 0.6, height = 0.5) {
    const from = g.position.clone();
    await phase(dur, (k) => { g.position.lerpVectors(from, to, ease(k)); g.position.y += Math.sin(k * Math.PI) * height; });
  }
  const grow = (g, dur = 0.7, to = 1) => { g.visible = true; return phase(dur, (k) => g.scale.setScalar(Math.max(0.001, ease(k) * to))); };
  const shrink = (g, dur = 0.6) => { const s0 = g.scale.x; return phase(dur, (k) => g.scale.setScalar(Math.max(0.001, s0 * (1 - ease(k))))).then(() => { g.visible = false; }); };
  const shadows = (g) => g.traverse((m) => { if (m.isMesh) m.castShadow = true; });

  // =================== ПЕЙЗАЖ ===================
  const land = new THREE.Group();
  scene.add(land);
  const POND = { x: -5.2, z: 3.4, rx: 2.1, rz: 1.25 };
  const FIELD = { x: 4.7, z: -3.7, w: 5.0, d: 3.6 };
  const ORCH = { x: 4.7, z: 1.1 };
  const PARK = { x: 4.7, z: 5.2, w: 4.6, d: 2.4 };
  const ROADX = 1.0;
  const inPond = (x, z, k = 1.15) => ((x - POND.x) / (POND.rx * k)) ** 2 + ((z - POND.z) / (POND.rz * k)) ** 2 < 1;

  // Земя: естествената страна е пъстра, изкуствената – равна.
  const groundGeo = new THREE.PlaneGeometry(60, 50, 90, 75);
  groundGeo.rotateX(-Math.PI / 2);
  const gp = groundGeo.attributes.position;
  const cols = [];
  const c = new THREE.Color();
  const sand = new THREE.Color(0xb8a272);
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i);
    const z = gp.getZ(i);
    const pd = ((x - POND.x) / POND.rx) ** 2 + ((z - POND.z) / POND.rz) ** 2;
    let y = x < ROADX - 0.6 ? Math.sin(x * 0.45) * Math.cos(z * 0.35) * 0.12 + Math.sin(x * 1.3 + z) * 0.03 : 0;
    if (pd < 1.25) y -= (1.25 - pd) * 0.5;
    gp.setY(i, y);
    const t = 0.5 + 0.5 * Math.sin(x * 0.7 + Math.cos(z * 0.5) * 2);
    if (x < ROADX) c.setHSL(0.27 + t * 0.05, 0.5, 0.36 + t * 0.09);
    else c.setHSL(0.26, 0.5, 0.45);
    if (x < -2.4 && z < 0.6 && z > -6) c.multiplyScalar(0.85); // сянка в гората
    if (pd < 1.5) c.lerp(sand, Math.min(1, (1.5 - pd) * 2));
    cols.push(c.r, c.g, c.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  ground.receiveShadow = true;
  land.add(ground);

  // Черен път между природата и земите на хората.
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 50), mat(0xc2a574));
  road.rotation.x = -Math.PI / 2;
  road.position.set(ROADX, 0.012, 0);
  road.receiveShadow = true;
  land.add(road);

  // Невидими „плочи“ за избор на място.
  const pickSlab = (id, w, d, x, z, h = 0.12) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(x, h / 2, z);
    m.userData.pickId = id;
    land.add(m);
    return m;
  };

  // ---- Гора ----
  const forest = new THREE.Group();
  forest.userData.pickId = 'forest';
  land.add(forest);
  const R = rng(434);
  const trees = [];
  for (let tries = 0; trees.length < 17 && tries < 600; tries++) {
    const a = R() * Math.PI * 2;
    const rr = Math.sqrt(R());
    const x = -5.6 + Math.cos(a) * rr * 3.4;
    const z = -2.7 + Math.sin(a) * rr * 2.7;
    if (trees.some((t) => Math.hypot(t.position.x - x, t.position.z - z) < 1.15)) continue;
    const pine = R() < 0.4;
    const t = treeModel(pine, pine ? 0x2e6b34 : [0x3f8f3a, 0x4a9a3a, 0x5a9e3c][trees.length % 3]);
    t.position.set(x, 0, z);
    t.rotation.y = R() * 6;
    t.scale.setScalar(0.85 + R() * 0.35);
    t.userData.s0 = t.scale.x;
    shadows(t);
    forest.add(t);
    trees.push(t);
  }
  // Храсти и гъби под дърветата.
  for (let i = 0; i < 8; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + R() * 0.2, 1), mat(0x2f7a33, { flat: true }));
    b.position.set(-5.6 + (R() - 0.5) * 6, 0.25, -2.7 + (R() - 0.5) * 4.6);
    forest.add(b);
  }
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Group();
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 6), mat(0xf5ecd8));
    st.position.y = 0.06;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(i % 2 ? 0xc62828 : 0x8d5a2b));
    cap.position.y = 0.11;
    m.add(st, cap);
    m.position.set(-5.6 + (R() - 0.5) * 5, 0, -2.7 + (R() - 0.5) * 4);
    forest.add(m);
  }
  pickSlab('forest', 6.6, 5.4, -5.6, -2.7, 0.15).userData.pickId = 'forest';
  // Дървета за сеч (отпред вдясно) и за пожар (отзад вляво).
  const byDist = (px, pz) => trees.slice().sort((a, b) => Math.hypot(a.position.x - px, a.position.z - pz) - Math.hypot(b.position.x - px, b.position.z - pz));
  const cutTrees = byDist(-3.2, -1.0).slice(0, 4);
  const fireTrees = byDist(-8.8, -2.6).filter((t) => !cutTrees.includes(t)).slice(0, 4);
  const CUTC = new V3(); cutTrees.forEach((t) => CUTC.add(t.position)); CUTC.multiplyScalar(1 / 4);
  const FIREC = new V3(); fireTrees.forEach((t) => FIREC.add(t.position)); FIREC.multiplyScalar(1 / 4);

  // ---- Езеро ----
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48),
    new THREE.MeshStandardMaterial({ color: 0x3d8fd1, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 }));
  water.rotation.x = -Math.PI / 2;
  water.scale.set(POND.rx, POND.rz, 1);
  water.position.set(POND.x, -0.08, POND.z);
  water.userData.pickId = 'pond';
  land.add(water);
  const reedM = mat(0x5d7f2a);
  const reeds = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + R() * 0.2;
    const h = 0.5 + R() * 0.5;
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, h, 5), reedM);
    r.position.set(POND.x + Math.cos(a) * POND.rx * 1.03, h / 2 - 0.1, POND.z + Math.sin(a) * POND.rz * 1.06);
    if (i % 3 === 0) {
      const top = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.14, 4, 6), mat(0x6d4c41));
      top.position.y = h / 2;
      r.add(top);
    }
    r.userData.ph = R() * 6;
    land.add(r);
    reeds.push(r);
  }
  for (let i = 0; i < 5; i++) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.2, 14), mat(0x43a047));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(POND.x - 1.3 + i * 0.6, -0.06, POND.z + Math.sin(i * 2) * 0.7);
    land.add(pad);
  }
  const ducks = [0, 1].map((i) => {
    const d = duckModel();
    d.scale.setScalar(0.9);
    d.userData.pickId = 'duck';
    d.userData.ph = i * Math.PI;
    addHitBox(d, 0.7);
    land.add(d);
    return d;
  });
  const pondFish = [0, 1, 2].map((i) => {
    const f = fishModel([0xff8a3d, 0xffb74d, 0x90a4ae][i]);
    f.scale.setScalar(0.6);
    f.userData.ph = i * 2.1;
    land.add(f);
    return f;
  });

  // ---- Ливада ----
  const grassM = mat(0x6cbf3c);
  const grass0 = new THREE.Color(0x6cbf3c);
  const meadowPatches = [];
  for (let i = 0; i < 12; i++) {
    const g = grassPatch(grassM, 14, 0.5);
    const a = i * 2.4;
    const rr = 0.4 + (i % 4) * 0.55;
    g.position.set(-1.9 + Math.cos(a) * rr * 1.2, 0, 1.9 + Math.sin(a) * rr);
    if (inPond(g.position.x, g.position.z, 1.3)) g.position.x += 1.2;
    land.add(g);
    meadowPatches.push(g);
  }
  const chainGrass = grassPatch(grassM, 26, 0.6);
  chainGrass.position.set(-0.6, 0, 0.5);
  chainGrass.userData.pickId = 'grass';
  land.add(chainGrass);
  meadowPatches.push(chainGrass);
  {
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.6, 10), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.3;
    chainGrass.add(hit);
  }
  const flowerCols = [0xffffff, 0xffeb3b, 0xe91e63, 0x9c27b0];
  for (let i = 0; i < 50; i++) {
    const x = -2 + (R() - 0.5) * 4.4;
    const z = 1.8 + (R() - 0.5) * 4;
    if (inPond(x, z, 1.3) || x > ROADX - 0.5) continue;
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(flowerCols[i % 4]));
    f.position.set(x, 0.12, z);
    land.add(f);
  }
  pickSlab('meadow', 3.4, 4.2, -1.6, 2.0);

  // ---- Нива с пшеница ----
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.w, FIELD.d), mat(0x8d6e4a));
  soil.rotation.x = -Math.PI / 2;
  soil.position.set(FIELD.x, 0.015, FIELD.z);
  soil.receiveShadow = true;
  land.add(soil);
  const wheatRows = [];
  const stalkGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.6, 4);
  stalkGeo.translate(0, 0.3, 0);
  const earGeo = new THREE.CapsuleGeometry(0.035, 0.12, 2, 5);
  earGeo.translate(0, 0.66, 0);
  const stalkM = mat(0xd8b24a);
  const earM = mat(0xe9c46a);
  const dummy = new THREE.Object3D();
  const NROW = 12; const NPER = 34;
  for (let r = 0; r < NROW; r++) {
    const row = new THREE.Group();
    row.position.set(FIELD.x, 0, FIELD.z - FIELD.d / 2 + 0.2 + r * ((FIELD.d - 0.4) / (NROW - 1)));
    const st = new THREE.InstancedMesh(stalkGeo, stalkM, NPER);
    const ea = new THREE.InstancedMesh(earGeo, earM, NPER);
    for (let k = 0; k < NPER; k++) {
      dummy.position.set(-FIELD.w / 2 + 0.15 + k * ((FIELD.w - 0.3) / (NPER - 1)), 0, (R() - 0.5) * 0.06);
      dummy.rotation.set((R() - 0.5) * 0.15, 0, (R() - 0.5) * 0.15);
      dummy.scale.setScalar(0.85 + R() * 0.3);
      dummy.updateMatrix();
      st.setMatrixAt(k, dummy.matrix);
      ea.setMatrixAt(k, dummy.matrix);
    }
    row.add(st, ea);
    row.userData.ph = r * 0.5;
    land.add(row);
    wheatRows.push(row);
  }
  pickSlab('field', FIELD.w, FIELD.d, FIELD.x, FIELD.z, 0.8);

  // ---- Овощна градина ----
  const orchard = new THREE.Group();
  orchard.userData.pickId = 'orchard';
  land.add(orchard);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) {
    const t = appleTree();
    t.position.set(ORCH.x - 1.5 + k * 1.5, 0, ORCH.z - 1.2 + i * 1.2);
    t.scale.setScalar(0.85);
    shadows(t);
    orchard.add(t);
  }
  {
    const postM = mat(0xa1785a);
    const W = 4.6; const D = 3.6;
    const corners = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]];
    for (let s = 0; s < 4; s++) {
      const [x0, z0] = corners[s]; const [x1, z1] = corners[(s + 1) % 4];
      const len = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.round(len / 0.6);
      for (let k = 0; k < n; k++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), postM);
        p.position.set(ORCH.x + x0 + ((x1 - x0) * k) / n, 0.22, ORCH.z + z0 + ((z1 - z0) * k) / n);
        orchard.add(p);
      }
      for (const y of [0.18, 0.36]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.03), postM);
        rail.position.set(ORCH.x + (x0 + x1) / 2, y, ORCH.z + (z0 + z1) / 2);
        rail.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
        orchard.add(rail);
      }
    }
  }
  pickSlab('orchard', 4.6, 3.6, ORCH.x, ORCH.z);

  // ---- Парк ----
  const park = new THREE.Group();
  park.userData.pickId = 'park';
  land.add(park);
  {
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(PARK.w, PARK.d), mat(0x7ccf55));
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(PARK.x, 0.014, PARK.z);
    lawn.receiveShadow = true;
    park.add(lawn);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(PARK.w, 0.5), mat(0xd9cdb4));
    path.rotation.x = -Math.PI / 2;
    path.position.set(PARK.x, 0.02, PARK.z + 0.2);
    park.add(path);
    // фонтан
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.2, 20), mat(0xcfd8dc));
    basin.position.set(PARK.x, 0.1, PARK.z + 0.2);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.48, 20), mat(0x4fa3e0));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(PARK.x, 0.205, PARK.z + 0.2);
    const jet = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.7 }));
    jet.position.set(PARK.x, 0.45, PARK.z + 0.2);
    park.add(basin, pool, jet);
    park.userData.jet = jet;
    // пейка и лампа
    const wood = mat(0x8d5a2b);
    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.3), wood);
    seat.position.y = 0.3;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.05), wood);
    back.position.set(0, 0.48, -0.14);
    bench.add(seat, back);
    for (const s of [-0.38, 0.38]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.28), mat(0x37474f)); l.position.set(s, 0.15, 0); bench.add(l); }
    bench.position.set(PARK.x - 1.4, 0, PARK.z - 0.6);
    park.add(bench);
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.4, 8), mat(0x37474f));
    pole.position.y = 0.7;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe082, emissiveIntensity: 0.6 }));
    bulb.position.y = 1.45;
    lamp.add(pole, bulb);
    lamp.position.set(PARK.x + 1.2, 0, PARK.z - 0.6);
    park.add(lamp);
    // подстригани храсти в редица и кръгла леха
    for (let k = 0; k < 4; k++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(0x2e8b3e));
      b.position.set(PARK.x - 1.8 + k * 1.2, 0.28, PARK.z + 1.0);
      park.add(b);
    }
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.1, 18), mat(0x6d4c41));
    bed.position.set(PARK.x + 1.6, 0.05, PARK.z + 0.4);
    park.add(bed);
    for (let k = 0; k < 10; k++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), mat([0xe91e63, 0xffeb3b][k % 2]));
      f.position.set(PARK.x + 1.6 + Math.cos(k * 0.63) * 0.28, 0.16, PARK.z + 0.4 + Math.sin(k * 0.63) * 0.28);
      park.add(f);
    }
    shadows(park);
  }
  pickSlab('park', PARK.w, PARK.d, PARK.x, PARK.z);

  // Далечни хълмове и дървета наоколо.
  for (let i = 0; i < 10; i++) {
    const t = treeModel(i % 2 === 0, 0x3f8f3a);
    t.scale.setScalar(0.9 + R() * 0.5);
    t.position.set(-16 + i * 3.6 + R(), 0, -11 - R() * 3);
    land.add(t);
  }
  for (let i = 0; i < 4; i++) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7fb36a));
    h.scale.set(1.6, 0.5, 1);
    h.position.set(-24 + i * 16, -0.2, -22);
    land.add(h);
  }

  // ---- Животни и фермер ----
  const animals = {};
  const walkers = [];
  function addWalker(id, g, home, L, label) {
    g.position.copy(home);
    g.rotation.y = R() * 6;
    shadows(g);
    g.userData.pickId = id;
    g.userData.home = home.clone();
    g.userData.L = L;
    g.userData.free = true;
    g.userData.ph = R() * 6;
    if (label) {
      const box = new THREE.Box3().setFromObject(g);
      const lbl = labelSprite(label, { size: 0.24 });
      lbl.position.y = box.max.y - g.position.y + 0.25;
      g.add(lbl);
      stage.steadyLabel(lbl, 12);
      g.userData.top = lbl.position.y + 0.25;
    } else {
      const box = new THREE.Box3().setFromObject(g);
      g.userData.top = box.max.y - g.position.y + 0.2;
    }
    addHitBox(g, 0.8);
    land.add(g);
    walkers.push(g);
    return g;
  }
  animals.rabbit = addWalker('rabbit', rabbitModel(), new V3(-1.8, 0, 2.2), { r: 1.6, speed: 1.1, hop: true }, 'Заек');
  animals.rabbit2 = addWalker('rabbit', rabbitModel(), new V3(-2.4, 0, 3.4), { r: 1.2, speed: 1.0, hop: true });
  animals.fox = addWalker('fox', foxModel(), new V3(-3.4, 0, -0.3), { r: 1.2, speed: 0.9 }, 'Лисица');
  animals.deer = addWalker('deer', deerModel(), new V3(-6.6, 0, -0.9), { r: 0.8, speed: 0.6, graze: true }, 'Сърна');
  animals.deer2 = addWalker('deer', deerModel(), new V3(-7.6, 0, -1.8), { r: 0.6, speed: 0.5, graze: true });
  animals.deer2.scale.setScalar(0.8);
  const farmer = personModel(0x1e88e5, 0x3e4a5a, 0xe0c068);
  farmer.position.set(2.6, 0, -1.3);
  farmer.userData.pickId = 'farmer';
  const farmerLbl = labelSprite('Фермер', { size: 0.24 });
  farmerLbl.position.y = 1.8;
  farmer.add(farmerLbl);
  stage.steadyLabel(farmerLbl, 12);
  addHitBox(farmer, 0.8);
  shadows(farmer);
  land.add(farmer);
  // Лейка в ръката на фермера.
  {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.16, 10), mat(0x66bb6a));
    can.position.set(0.05, 0.55, 0.32);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.2, 6), mat(0x66bb6a));
    spout.rotation.z = -1.0;
    spout.position.set(0.16, 0.6, 0.32);
    farmer.add(can, spout);
  }

  // Етикети на местата.
  const ANCH = {
    forest: new V3(-5.6, 3.6, -2.2), meadow: new V3(-1.4, 0.9, 2.6), pond: new V3(-5.2, 0.9, 3.4),
    field: new V3(FIELD.x, 1.2, FIELD.z), orchard: new V3(ORCH.x, 2.1, ORCH.z), park: new V3(PARK.x, 1.4, PARK.z),
  };
  const placeLabels = {};
  function setPlaceLabel(id, text, colors) {
    if (placeLabels[id]) { land.remove(placeLabels[id]); placeLabels[id].material.map.dispose(); placeLabels[id].material.dispose(); }
    const s = labelSprite(text, { size: 0.34, ...(colors || {}) });
    s.position.copy(ANCH[id]);
    s.userData.pickId = id;
    stage.steadyLabel(s, 16);
    land.add(s);
    placeLabels[id] = s;
  }
  for (const p of PLACES) setPlaceLabel(p.id, p.label);

  // ---- Небе: облаци, птици, пеперуди ----
  const clouds = [];
  const cloudM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 5; i++) {
    const cg = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.8 + R() * 0.5, 12, 8), cloudM);
      puff.position.set(k * 0.9 - 1.4, R() * 0.3, R() * 0.5);
      puff.scale.y = 0.6;
      cg.add(puff);
    }
    cg.position.set(-20 + i * 9, 9 + R() * 2, -12 - R() * 5);
    scene.add(cg);
    clouds.push(cg);
  }
  const flyers = [];
  const wingMs = [0xffb300, 0xe91e63, 0x42a5f5].map((cc) => new THREE.MeshStandardMaterial({ color: cc, side: THREE.DoubleSide, roughness: 0.6 }));
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.12, 4, 6), mat(0x3e2723));
    body.rotation.z = Math.PI / 2;
    b.add(body);
    const wings = [];
    for (const sgn of [1, -1]) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), wingMs[i % 3]);
      w.position.z = sgn * 0.1;
      w.rotation.x = Math.PI / 2;
      const hinge = new THREE.Group();
      hinge.add(w);
      b.add(hinge);
      wings.push({ hinge, sgn });
    }
    b.userData = { wings, cx: i < 3 ? -2 + (i - 1) * 1.4 : 4.7, cz: i < 3 ? 2 + (i - 1) * 0.8 : 5.2, ph: R() * 6, sp: 0.4 + R() * 0.3 };
    land.add(b);
    flyers.push(b);
  }
  const birds = [];
  for (let i = 0; i < 3; i++) {
    const bd = new THREE.Group();
    const wingsB = [];
    for (const sgn of [1, -1]) {
      const h = new THREE.Group();
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.4), mat(0x37474f));
      w.position.z = sgn * 0.2;
      h.add(w);
      bd.add(h);
      wingsB.push({ h, sgn });
    }
    bd.userData = { wingsB, ph: i * 2.1, r: 9 + i * 1.5 };
    land.add(bd);
    birds.push(bd);
  }

  // ---- Разходки на животните ----
  function angleTo(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
  function pickTarget(g) {
    const L = g.userData.L;
    const home = g.userData.home;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * L.r;
      const x = home.x + Math.cos(a) * r;
      const z = home.z + Math.sin(a) * r;
      if (inPond(x, z, 1.2) || x > ROADX - 0.6) continue;
      return new V3(x, 0, z);
    }
    return home.clone();
  }
  function wander(g, dt, t) {
    const L = g.userData.L;
    const w = g.userData.w || (g.userData.w = { mode: 'idle', timer: Math.random() * 2, phase: 0 });
    const legsList = g.userData.legs || [];
    const head = g.userData.head;
    if (w.mode === 'idle') {
      w.timer -= dt;
      if (head) {
        const dip = L.graze && Math.sin(t * 0.9 + g.userData.ph) > 0.2;
        head.rotation.z += ((dip ? -0.55 : Math.sin(t * 0.6 + g.userData.ph) * 0.1) - head.rotation.z) * Math.min(1, dt * 3);
        head.rotation.y = Math.sin(t * 0.7 + g.userData.ph) * 0.35;
      }
      for (const lg of legsList) lg.rotation.z *= 0.85;
      g.position.y += (0 - g.position.y) * Math.min(1, dt * 8);
      if (w.timer <= 0) { w.mode = 'walk'; w.target = pickTarget(g); }
      return;
    }
    const dx = w.target.x - g.position.x;
    const dz = w.target.z - g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.08) { w.mode = 'idle'; w.timer = 1.2 + Math.random() * 3; return; }
    const want = Math.atan2(-dz, dx);
    const diff = angleTo(g.rotation.y, want);
    g.rotation.y += diff * Math.min(1, dt * 5);
    if (Math.abs(diff) < 0.7) {
      const step = Math.min(dist, L.speed * dt);
      g.position.x += (dx / dist) * step;
      g.position.z += (dz / dist) * step;
      w.phase += dt * L.speed * (L.hop ? 6 : 9);
    }
    if (L.hop) g.position.y = Math.abs(Math.sin(w.phase)) * 0.22;
    else {
      g.position.y = Math.abs(Math.sin(w.phase)) * 0.03;
      legsList.forEach((lg, i) => { lg.rotation.z = Math.sin(w.phase + (i === 0 || i === 3 ? 0 : 1) * Math.PI) * 0.5; });
    }
  }
  function settle(g) {
    g.userData.w = { mode: 'idle', timer: 1, phase: 0 };
    for (const lg of g.userData.legs || []) lg.rotation.z = 0;
    g.position.y = 0;
  }

  // Допълнителни зайци (при „ако изчезнат лисиците“) и огън.
  const extraRabbits = [];
  const flames = [];
  const smoke = [];
  let fireOn = false;
  let farmerDir = 1;
  stage.tick((dt, t) => {
    if (!land.visible) return;
    water.material.color.setHSL(0.57, 0.55, 0.5 + Math.sin(t * 0.8) * 0.02);
    for (const g of walkers) {
      if (!g.visible) continue;
      if (g.userData.free) wander(g, dt, t);
      if (g.userData.tail) g.userData.tail.rotation.x = Math.sin(t * 3 + g.userData.ph) * 0.3;
    }
    for (const g of extraRabbits) {
      const u = g.userData;
      u.a += dt * u.sp;
      g.position.x = u.cx + Math.cos(u.a) * u.r;
      g.position.z = u.cz + Math.sin(u.a) * u.r * 0.7;
      g.position.y = Math.abs(Math.sin(t * 6 + u.ph)) * 0.2;
      g.rotation.y = -u.a - Math.PI / 2;
    }
    // фермерът върви покрай нивата
    farmer.position.x += farmerDir * dt * 0.45;
    if (farmer.position.x > 6.9) farmerDir = -1;
    if (farmer.position.x < 2.4) farmerDir = 1;
    farmer.rotation.y += ((farmerDir > 0 ? 0 : Math.PI) - farmer.rotation.y) * Math.min(1, dt * 4);
    (farmer.userData.legs || []).forEach((lg, i) => { lg.rotation.z = Math.sin(t * 6 + i * Math.PI) * 0.4; });
    for (const d of ducks) {
      const a = t * 0.25 + d.userData.ph;
      d.position.set(POND.x + Math.cos(a) * POND.rx * 0.55, -0.02 + Math.sin(t * 2 + d.userData.ph) * 0.015, POND.z + Math.sin(a) * POND.rz * 0.55);
      d.rotation.y = -a - Math.PI / 2;
    }
    for (const f of pondFish) {
      const a = -t * 0.4 + f.userData.ph;
      f.position.set(POND.x + Math.cos(a) * POND.rx * 0.35, -0.22, POND.z + Math.sin(a) * POND.rz * 0.35);
      f.rotation.y = -a + Math.PI;
      f.userData.tail.rotation.y = Math.sin(t * 8) * 0.4;
    }
    for (const g of meadowPatches) for (const b of g.userData.blades) b.rotation.z = Math.sin(t * 2 + b.userData.phase) * 0.12;
    for (const r of reeds) r.rotation.z = Math.sin(t * 1.3 + r.userData.ph) * 0.06;
    for (const row of wheatRows) row.rotation.x = Math.sin(t * 1.4 + row.userData.ph) * 0.03;
    park.userData.jet.scale.y = 1 + Math.sin(t * 5) * 0.12;
    for (const b of flyers) {
      const u = b.userData;
      const k = t * u.sp + u.ph;
      b.position.set(u.cx + Math.sin(k) * 1.3, 0.8 + Math.sin(k * 2.3) * 0.3, u.cz + Math.sin(k * 0.7) * 1.0);
      b.rotation.y = Math.atan2(-Math.cos(k * 0.7) * 0.7, Math.cos(k) * 1.3);
      for (const { hinge, sgn } of u.wings) hinge.rotation.x = sgn * Math.sin(t * 16 + u.ph) * 0.9;
    }
    for (const bd of birds) {
      const u = bd.userData;
      const k = t * 0.18 + u.ph;
      bd.position.set(Math.cos(k) * u.r, 7 + Math.sin(k * 3) * 0.4, Math.sin(k) * u.r - 4);
      bd.rotation.y = -k;
      for (const { h, sgn } of u.wingsB) h.rotation.x = sgn * Math.sin(t * 6 + u.ph) * 0.5;
    }
    if (fireOn) {
      for (const f of flames) {
        const s = f.userData.s * (0.8 + 0.3 * Math.sin(t * 13 + f.userData.ph) + 0.1 * Math.sin(t * 29 + f.userData.ph));
        f.scale.set(f.userData.s, s, f.userData.s);
      }
      for (const p of smoke) {
        p.userData.k = (p.userData.k + dt * 0.35) % 1;
        const k = p.userData.k;
        p.position.set(p.userData.x + Math.sin(k * 4) * 0.3 + k * 0.8, 3.0 + k * 3.5, p.userData.z);
        p.scale.setScalar(0.4 + k * 1.1);
        p.material.opacity = 0.65 * (1 - k);
      }
    }
  });
  stage.tick((dt) => { for (const cg of clouds) { cg.position.x += dt * 0.25; if (cg.position.x > 24) cg.position.x = -24; } });

  // =================== ГАЛЕРИЯ С ТРИ СРЕДИ (стъпка 3) ===================
  const gal = new THREE.Group();
  gal.visible = false;
  scene.add(gal);
  const GZ = -0.8;
  {
    const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 48), mat(0xd9e4cf));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    gal.add(floor);
  }
  const habColors = { desert: 0xe2bd72, polar: 0xf4f8fb, water: 0xd9c48f };
  const habLabelCss = { desert: '#c98a1e', polar: '#3f7fb5', water: '#1e7fc9' };
  const snowPts = [];
  const seaweed = [];
  const bubblesW = [];
  for (const h of HABITATS) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 0.3, 32), mat(habColors[h.id]));
    base.position.set(h.x, 0.15, GZ);
    base.receiveShadow = true;
    gal.add(base);
    const lbl = labelSprite(h.label, { size: 0.4, color: '#fff', bg: habLabelCss[h.id], border: habLabelCss[h.id] });
    lbl.position.set(h.x, h.id === 'water' ? 2.3 : 2.1, GZ - 1.3);
    stage.steadyLabel(lbl, 14);
    gal.add(lbl);
    if (h.id === 'desert') {
      for (const [dx, dz, s] of [[-0.9, -0.9, 0.9], [0.8, -1.0, 0.7], [0.1, -1.3, 0.6]]) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd9ad5c));
        d.scale.set(s, s * 0.45, s * 0.7);
        d.position.set(h.x + dx, 0.3, GZ + dz);
        gal.add(d);
      }
      for (let i = 0; i < 4; i++) {
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + i * 0.03, 0), mat(0xa0835a, { flat: true }));
        r.position.set(h.x + Math.cos(i * 1.7) * 1.4, 0.33, GZ + Math.sin(i * 1.7) * 1.2 + 0.3);
        gal.add(r);
      }
      const sun = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd54f }));
      sun.position.set(h.x + 1.3, 3.0, GZ - 1.6);
      gal.add(sun);
    } else if (h.id === 'polar') {
      for (const [dx, dz, w, hh] of [[-1.0, -0.9, 0.9, 0.5], [0.9, -0.8, 0.7, 0.7], [0.1, -1.3, 1.2, 0.35]]) {
        const ice = new THREE.Mesh(new THREE.BoxGeometry(w, hh, w * 0.7), mat(0xdcefff, { flat: true }));
        ice.position.set(h.x + dx, 0.3 + hh / 2, GZ + dz);
        ice.rotation.y = dx;
        gal.add(ice);
      }
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), mat(0x2f78b8));
      hole.rotation.x = -Math.PI / 2;
      hole.position.set(h.x + 1.1, 0.305, GZ + 0.6);
      gal.add(hole);
      const N = 120;
      const geo = new THREE.BufferGeometry();
      const arr = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { arr[i * 3] = h.x + (Math.random() - 0.5) * 3.6; arr[i * 3 + 1] = 0.3 + Math.random() * 2.6; arr[i * 3 + 2] = GZ + (Math.random() - 0.5) * 3.6; }
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07 }));
      gal.add(pts);
      snowPts.push(pts);
    } else {
      const vol = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 1.0, 32, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x3d8fd1, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
      vol.position.set(h.x, 0.8, GZ);
      gal.add(vol);
      const top = new THREE.Mesh(new THREE.CircleGeometry(1.75, 32),
        new THREE.MeshStandardMaterial({ color: 0x4aa3e0, transparent: true, opacity: 0.45, depthWrite: false, roughness: 0.15 }));
      top.rotation.x = -Math.PI / 2;
      top.position.set(h.x, 1.3, GZ);
      top.userData.wave = true;
      gal.add(top);
      seaweed.push(top);
      for (let i = 0; i < 6; i++) {
        const sw = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.6, 4, 6), mat(0x2e7d32));
        blade.position.y = 0.3;
        sw.add(blade);
        sw.position.set(h.x + Math.cos(i * 1.1 + 2) * 1.3, 0.3, GZ + Math.sin(i * 1.1 + 2) * 1.2);
        sw.userData.ph = i;
        gal.add(sw);
        seaweed.push(sw);
      }
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe3f4ff, transparent: true, opacity: 0.7 }));
        b.userData = { x: h.x - 1 + i * 0.4, z: GZ - 0.6 + (i % 3) * 0.4, k: i / 6 };
        gal.add(b);
        bubblesW.push(b);
      }
    }
  }
  const SLOT = {
    camel: new V3(-4.3 - 0.75, 0.3, GZ + 0.35), cactus: new V3(-4.3 + 0.8, 0.3, GZ + 0.2),
    bear: new V3(-0.7, 0.3, GZ + 0.3), penguin: new V3(0.55, 0.3, GZ + 0.15),
    fish: new V3(4.3 - 0.6, 0.75, GZ + 0.3), duck: new V3(4.3 + 0.6, 1.3, GZ + 0.35),
  };
  const ORG_BUILD = {
    camel: () => { const g = camelModel(); g.scale.setScalar(0.72); return g; },
    cactus: () => { const g = cactusModel(); g.scale.setScalar(0.9); return g; },
    bear: () => { const g = polarBearModel(); g.scale.setScalar(0.72); return g; },
    penguin: () => penguinModel(),
    fish: () => { const g = fishModel(); g.scale.setScalar(1.3); return g; },
    duck: () => { const g = duckModel(); g.scale.setScalar(1.25); return g; },
  };
  const orgs = {};
  const startOrder = shuffle(ORGS.map((o) => o.id));
  startOrder.forEach((id, i) => {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 20), mat(0xf5f5f0));
    const x = -3.75 + i * 1.5;
    ped.position.set(x, 0.06, 3.0);
    gal.add(ped);
    const g = ORG_BUILD[id]();
    g.position.set(x, id === 'fish' ? 0.45 : 0.12, 3.0);
    g.rotation.y = id === 'fish' ? 0.5 : -0.5;
    shadows(g);
    g.userData.pickId = id;
    g.userData.dragId = id;
    g.userData.start = g.position.clone();
    const box = new THREE.Box3().setFromObject(g);
    const lbl = labelSprite(ORG[id].label, { size: 0.26 });
    lbl.position.y = (box.max.y - g.position.y) / g.scale.y + 0.3 / g.scale.y;
    lbl.scale.multiplyScalar(1 / g.scale.x);
    g.add(lbl);
    stage.steadyLabel(lbl, 13);
    g.userData.top = box.max.y - g.position.y + 0.55;
    addHitBox(g, 0.9);
    gal.add(g);
    orgs[id] = g;
  });
  stage.tick((dt, t) => {
    if (!gal.visible) return;
    for (const p of snowPts) {
      const a = p.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) - dt * 0.5;
        if (y < 0.3) y = 2.9;
        a.setY(i, y);
        a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.05);
      }
      a.needsUpdate = true;
    }
    for (const s of seaweed) {
      if (s.userData.wave) s.position.y = 1.3 + Math.sin(t * 1.5) * 0.015;
      else s.rotation.z = Math.sin(t * 1.4 + s.userData.ph) * 0.2;
    }
    for (const b of bubblesW) {
      b.userData.k = (b.userData.k + dt * 0.3) % 1;
      b.position.set(b.userData.x + Math.sin(b.userData.k * 9) * 0.05, 0.35 + b.userData.k * 0.9, b.userData.z);
    }
    for (const id in orgs) {
      const g = orgs[id];
      if (g.userData.dragging || g.userData.moving) continue;
      const base = g.userData.placed ? SLOT[id] : g.userData.start;
      if (id === 'fish') {
        if (g.userData.placed) {
          const a = t * 0.6;
          g.position.set(base.x + Math.cos(a) * 0.45, base.y + Math.sin(t * 2) * 0.05, base.z + Math.sin(a) * 0.35);
          g.rotation.y = -a - Math.PI / 2;
        } else g.position.y = base.y + Math.sin(t * 2) * 0.06;
        g.userData.tail.rotation.y = Math.sin(t * 8) * 0.4;
      } else if (id === 'duck') {
        g.position.y = base.y + Math.sin(t * 2) * 0.02;
        g.rotation.z = Math.sin(t * 1.6) * 0.05;
      } else if (id === 'penguin') {
        g.rotation.z = Math.sin(t * 3) * 0.06;
      } else if (g.userData.head) {
        g.userData.head.rotation.y = Math.sin(t * 0.7 + id.length) * 0.35;
      }
    }
  });

  // =================== ВРЕДИ И МЕРКИ (стъпка 4) ===================
  const TRASH = new V3(-2.6, 0, 1.1);
  const POACH = new V3(-6.3, 0, 0.7);
  const stumps = cutTrees.map((t) => { const s = stumpModel(); s.position.copy(t.position); s.visible = false; land.add(s); return s; });
  const saplings = cutTrees.map((t, i) => {
    const s = treeModel(i % 2 === 1, 0x6abf4b);
    s.position.copy(t.position).add(new V3(0.35, 0, 0.25));
    s.visible = false;
    shadows(s);
    land.add(s);
    return s;
  });
  const flameMs = [new THREE.MeshBasicMaterial({ color: 0xff6d00, transparent: true, opacity: 0.9 }), new THREE.MeshBasicMaterial({ color: 0xffca28, transparent: true, opacity: 0.9 })];
  const fireG = new THREE.Group();
  fireG.visible = false;
  land.add(fireG);
  fireTrees.forEach((t, i) => {
    const sc = t.scale.x;
    for (let k = 0; k < 6; k++) {
      const up = k >= 3;
      const f = new THREE.Mesh(new THREE.ConeGeometry(up ? 0.42 : 0.34, up ? 1.3 : 1.1, 8), flameMs[k % 2]);
      f.geometry.translate(0, up ? 0.65 : 0.55, 0);
      const a = k * 2.1 + i;
      const rr = up ? 0.45 : 0.4;
      f.position.set(t.position.x + Math.cos(a) * rr * sc, up ? 2.2 * sc + (k - 3) * 0.2 : 0.02 + (k % 2) * 0.3, t.position.z + Math.sin(a) * rr * sc);
      f.userData = { s: up ? 1 : 0.9, ph: i * 3 + k };
      fireG.add(f);
      flames.push(f);
    }
  });
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), new THREE.MeshStandardMaterial({ color: 0x555555, transparent: true, opacity: 0.6, depthWrite: false }));
    p.userData = { x: FIREC.x + (i % 4 - 1.5) * 0.7, z: FIREC.z + (i < 4 ? -0.4 : 0.4), k: i / 8 };
    fireG.add(p);
    smoke.push(p);
  }
  const BURNT = new THREE.Color(0x3a302a);
  const trash = [];
  for (let i = 0; i < 8; i++) {
    const g = trashItem(i);
    g.position.set(TRASH.x + Math.cos(i * 2.4) * (0.4 + (i % 3) * 0.3), 0, TRASH.z + Math.sin(i * 2.4) * (0.35 + (i % 3) * 0.25));
    g.rotation.y = i;
    g.userData.home = g.position.clone();
    g.visible = false;
    land.add(g);
    trash.push(g);
  }
  const bin = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.21, 0.6, 14), mat(0x2e7d32));
    body.position.y = 0.3;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.05, 14), mat(0x1b5e20));
    lid.position.y = 0.62;
    bin.add(body, lid);
  }
  bin.position.set(TRASH.x + 1.3, 0, TRASH.z - 0.2);
  bin.visible = false;
  shadows(bin);
  land.add(bin);
  const hunter = personModel(0x556b2f, 0x3e3a2e, 0x556b2f);
  {
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.05), mat(0x3e2723));
    gun.position.set(0.25, 0.95, -0.24);
    gun.rotation.z = 0.25;
    hunter.add(gun);
  }
  hunter.position.copy(POACH);
  hunter.rotation.y = 0.4;
  hunter.visible = false;
  shadows(hunter);
  land.add(hunter);
  const trap = new THREE.Group();
  {
    const tm = mat(0x6d6d6d, { metalness: 0.6, roughness: 0.4 });
    for (let i = 0; i < 6; i++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 5), tm);
      bar.position.set(Math.cos(i) * 0.25, 0.2, Math.sin(i) * 0.25);
      trap.add(bar);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.02, 6, 16), tm);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.4;
    trap.add(ring);
  }
  trap.position.set(POACH.x + 1.0, 0, POACH.z - 0.5);
  trap.visible = false;
  land.add(trap);
  const sign = new THREE.Group();
  {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), mat(0x8d5a2b));
    post.position.y = 0.65;
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.06), mat(0x2e7d32));
    board.position.y = 1.35;
    const txt = labelSprite('Защитена територия', { size: 0.22, color: '#fff', bg: '#2e7d32', border: '#ffffff' });
    txt.position.set(0, 1.35, 0.1);
    sign.add(post, board, txt);
  }
  sign.position.copy(POACH).add(new V3(0.5, 0, 0.4));
  sign.visible = false;
  shadows(sign);
  land.add(sign);
  const rain = new THREE.Group();
  const drops = [];
  {
    const cm = new THREE.MeshStandardMaterial({ color: 0x8a96a3, roughness: 1 });
    for (let k = 0; k < 5; k++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), cm);
      puff.position.set(k * 0.7 - 1.4, Math.sin(k) * 0.2, (k % 2) * 0.4);
      puff.scale.y = 0.6;
      rain.add(puff);
    }
    const dm = new THREE.MeshBasicMaterial({ color: 0x64b5f6 });
    for (let i = 0; i < 30; i++) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4), dm);
      d.userData = { x: (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 1.5, k: Math.random() };
      rain.add(d);
      drops.push(d);
    }
  }
  rain.position.set(FIREC.x, 4.6, FIREC.z);
  rain.visible = false;
  land.add(rain);
  stage.tick((dt) => {
    if (!rain.visible) return;
    for (const d of drops) {
      d.userData.k = (d.userData.k + dt * 1.6) % 1;
      d.position.set(d.userData.x, -d.userData.k * 4.4, d.userData.z);
    }
  });
  // Маркери „!“ над повредите.
  const HARM_POS = { cut: CUTC.clone().setY(1.6), fire: FIREC.clone().setY(3.6), trash: TRASH.clone().setY(1.0), poach: POACH.clone().setY(2.0) };
  const markers = {};
  for (const h of HARMS) {
    const s = labelSprite(' ! ', { size: 0.55, color: '#fff', bg: '#e53935', border: '#ffffff' });
    s.position.copy(HARM_POS[h.id]);
    s.userData.pickId = 'h-' + h.id;
    s.userData.y0 = s.position.y;
    s.visible = false;
    stage.steadyLabel(s, 14);
    land.add(s);
    markers[h.id] = s;
  }
  stage.tick((dt, t) => { for (const id in markers) { const m = markers[id]; if (m.visible) m.position.y = m.userData.y0 + Math.sin(t * 3) * 0.12; } });

  // Уред „Равновесие в гората“.
  const hud = document.createElement('div');
  hud.className = 'ecosystems-hud';
  hud.hidden = true;
  hud.innerHTML = '<span class="ecosystems-hud-t">Равновесие в гората: 100%</span><div class="ecosystems-bar"><span></span></div>';
  shell.stageEl.appendChild(hud);
  let health = 100;
  function setHealth(v) {
    health = Math.max(0, Math.min(100, v));
    hud.querySelector('.ecosystems-hud-t').textContent = `Равновесие в гората: ${health}%`;
    const bar = hud.querySelector('.ecosystems-bar span');
    bar.style.width = health + '%';
    bar.style.background = health > 70 ? '#2fa84f' : health > 40 ? '#f0a020' : '#e53935';
  }

  // =================== ИЗГЛЕД, БАЛОНЧЕТА, ИЗБОР ===================
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(cc, hw, hh, elev = 0.4, az = 0, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.08;
    stage.stopFollow();
    const hz = Math.cos(elev) * d;
    stage.flyTo([cc[0] + Math.sin(az) * hz, cc[1] + Math.sin(elev) * d, cc[2] + Math.cos(az) * hz], cc, dur);
  }
  const overview = () => fitView([0.3, 0.5, 0.2], 8.6, 5.2, 0.72);
  const VIEW = {
    forest: () => fitView([-5.4, 1.0, -2.2], 4.6, 3.0, 0.8),
    meadow: () => fitView([-3.4, 0.3, 2.4], 3.9, 2.4, 0.7),
    pond: () => fitView([-4.6, 0.2, 3.2], 3.0, 1.9, 0.7),
    field: () => fitView([FIELD.x, 0.3, FIELD.z], 3.1, 2.2, 0.9),
    orchard: () => fitView([ORCH.x, 0.8, ORCH.z], 3.0, 2.0, 0.55),
    park: () => fitView([PARK.x, 0.4, PARK.z], 2.9, 1.7, 0.6),
    animals: () => fitView([-3.0, 0.4, 0.6], 3.8, 2.0, 0.55),
    farmer: () => { const p = farmer.position; stage.stopFollow(); stage.flyTo([Math.min(6, Math.max(3.4, p.x)), 3.6, -6.8], [Math.min(6, Math.max(3.4, p.x)), 0.7, -1.3]); },
    chain: () => fitView([-1.9, 0.4, 0.2], 2.7, 1.5, 0.5),
    balance: () => fitView([-4.9, 1.0, -1.2], 5.9, 3.8, 0.95),
    cut: () => fitView([CUTC.x, 0.8, CUTC.z + 0.3], 2.7, 1.9, 0.85),
    fire: () => fitView([FIREC.x + 0.4, 1.8, FIREC.z], 3.6, 3.0, 0.75, -0.9),
    trash: () => fitView([TRASH.x + 0.3, 0.3, TRASH.z + 0.3], 2.2, 1.3, 0.65),
    poach: () => fitView([POACH.x + 0.3, 0.7, POACH.z - 0.6], 2.6, 1.8, 0.7),
    gallery: () => fitView([0, 0.7, 0.9], 6.4, 2.9, 0.55),
  };
  const BUBBLE_AT = {
    ...ANCH,
    animals: new V3(-2.8, 1.0, 0.6),
    cut: CUTC.clone().setY(1.0), fire: FIREC.clone().setY(2.8), trash: TRASH.clone().setY(0.6), poach: POACH.clone().setY(1.7),
  };
  let tip = null;
  function say(anchor, html, cls = '', lift = 0.3) {
    if (tip) tip.remove();
    if (narrowUI()) cls = cls.replace('wide', '');
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }

  const scores = [];
  let clickHandler = null;
  // Маркерите и етикетите на местата се виждат над всичко, затова и при клик имат предимство.
  stage.onClick((hit, ev) => {
    if (!clickHandler) return;
    const top = stage.pickAt(ev, 'pickId', [...Object.values(markers), ...Object.values(placeLabels)].filter((m) => m.visible));
    if (top) { clickHandler(top.root.userData.pickId); return; }
    clickHandler(hit ? hit.root.userData.pickId : null);
  });

  function choiceBox(cEl, q, items, rightIdx, why, onRight, onWrong, cls = '') {
    cEl.innerHTML = `<p class="ecosystems-q">${q}</p><div class="choices ${cls}">${items.map((t, i) => `<button class="choice" data-i="${i}">${t}</button>`).join('')}</div>`;
    let wrong = 0;
    cEl.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i !== rightIdx) {
        wrong++;
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(why(i, wrong), 'bad');
        if (onWrong) onWrong();
        return;
      }
      b.classList.add('right');
      cEl.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      onRight();
    }));
  }

  // =================== 1. ОПОЗНАЙ ===================
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Разгледай',
    items: MENU,
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  const PICK2MENU = { forest: 'forest', meadow: 'meadow', pond: 'meadow', grass: 'meadow', duck: 'meadow', field: 'field', orchard: 'orchard', park: 'park', rabbit: 'animals', fox: 'animals', deer: 'animals', farmer: 'farmer' };
  function step1() {
    shell.step(0);
    const seen = new Set();
    shell.task(`<p>Вляво е природата: <b>гора, ливада и езеро</b>. Вдясно са земите, които са направили хората: <b>нива, овощна градина и парк</b>.</p>
      <p><b>Разгледай всичко:</b> избери от менюто в ъгъла или кликни върху местата в сцената.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Целият пейзаж</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${MENU.length}`);
    upd();
    const visit = (id) => {
      const it = MENU.find((m) => m.id === id);
      VIEW[id]();
      if (id === 'farmer') say(farmer, `<b>${esc(it.icon)}</b> ${MENU_NOTE[id]}`, 'wide', 1.9);
      else say(BUBBLE_AT[id], `<b>${esc(it.icon)}</b> ${MENU_NOTE[id]}`, 'wide', 0.4);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === MENU.length) { next.disabled = false; shell.msg('Разгледа всичко! Продължи напред.', 'good'); }
    };
    clickHandler = (id) => { const m = PICK2MENU[id]; if (!m) { clearTip(); return; } visit(m); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); menu.show(false); clearTip(); step2(); });
    overview();
  }

  // =================== 2. ЕСТЕСТВЕНО ИЛИ ИЗКУСТВЕНО? ===================
  const WHY = {
    forest: 'Никой не е засадил дърветата в гората и никой не ги полива. Помисли пак.',
    meadow: 'Никой не сее тревите и цветята на ливадата. Помисли пак.',
    pond: 'Езерото не е изкопано от хората – водата се е събрала там сама. Помисли пак.',
    field: 'Кой изора земята и зася пшеницата? Помисли пак.',
    orchard: 'Виж колко прави са редиците от дървета и оградата около тях. Кой ги е направил?',
    park: 'Кой коси тревата, сади цветята и е сложил пейката? Помисли пак.',
  };
  const NAT = { color: '#fff', bg: '#2f8f46', border: '#2f8f46' };
  const ART = { color: '#fff', bg: '#d9822b', border: '#d9822b' };
  let arrows = [];
  stage.tick((dt) => {
    for (const a of arrows) {
      const gr = a.userData.grow;
      if (gr.k < 1) {
        gr.k = Math.min(1, gr.k + dt * 1.6);
        gr.geo.setDrawRange(0, Math.floor((gr.total * gr.k) / 3) * 3);
        if (gr.k >= 1) gr.head.visible = true;
      }
    }
  });
  function step2() {
    shell.step(1);
    let mistakes = 0;
    const sorted = {};
    let busy = false;
    for (const p of PLACES) setPlaceLabel(p.id, '? ' + p.label);
    overview();
    const tally = () => `<div class="ecosystems-tally">${PLACES.filter((p) => sorted[p.id] !== undefined).map((p) => `<span class="${p.nat ? 'n' : 'a'}">${esc(p.label)}</span>`).join('')}</div>`;
    const upd = () => shell.score(`Подредени: ${Object.keys(sorted).length} от ${PLACES.length} · грешки: ${mistakes}`);
    const intro = () => {
      shell.task(`<p><b>Естествените</b> съобщества са създадени от природата. <b>Изкуствените</b> са създадени от човека и той се грижи за тях.</p>
        <p>Кликни върху всяко място с <b>?</b> и кажи какво е то.</p>${tally()}`);
      shell.setControls('<div class="row"><button class="btn all">🔭 Целият пейзаж</button></div>').querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
      upd();
    };
    intro();
    clickHandler = (raw) => {
      const id = raw === 'grass' ? 'meadow' : raw === 'duck' ? 'pond' : raw === 'farmer' ? 'field' : raw;
      if (busy || !PLACE[id] || sorted[id] !== undefined) return;
      busy = true;
      const p = PLACE[id];
      VIEW[id]();
      say(BUBBLE_AT[id], `<b>${esc(p.icon)} ${esc(p.label)}</b><br>Кой е създал това място? Кой се грижи за него?`, '', 0.4);
      shell.msg('');
      const box = shell.setControls('<div></div>').firstChild;
      choiceBox(box, `„${esc(p.label)}“ е…`, ['<span>🌿</span>естествено съобщество', '<span>👨‍🌾</span>изкуствено съобщество'], p.nat ? 0 : 1,
        () => WHY[id],
        () => {
          sorted[id] = p.nat;
          setPlaceLabel(id, `${p.label} – ${p.nat ? 'естествено' : 'изкуствено'}`, p.nat ? NAT : ART);
          const ok = p.nat ? `Вярно! „${p.label}“ е създадено от природата.` : `Вярно! „${p.label}“ е създадено от човека и той се грижи за него.`;
          say(BUBBLE_AT[id], `✓ ${ok}`, 'good', 0.4);
          busy = false;
          if (Object.keys(sorted).length < PLACES.length) { intro(); shell.msg(ok, 'good'); return; }
          clickHandler = null;
          shell.msg(ok, 'good');
          wait(1.2).then(() => {
            overview();
            clearTip();
            shell.task(`<p>Гората, ливадата и езерото са <b>естествени съобщества</b>. Нивата, овощната градина и паркът са <b>изкуствени съобщества</b>.</p>
              <p>В естествените съобщества живеят много различни видове, а в изкуствените – малко.</p>${tally()}`);
            upd();
            shell.msg('Подреди всички места!', 'good');
            shell.setControls('<button class="btn primary">Към хранителната верига →</button>').querySelector('button').addEventListener('click', () => chain(mistakes));
          });
        },
        () => { mistakes++; upd(); }, 'ecosystems-two');
    };
  }

  // Хранителна верига в гората: трева → заек → лисица.
  function chain(m0) {
    let mistakes = m0;
    clearTip();
    shell.msg('');
    for (const p of PLACES) setPlaceLabel(p.id, p.label);
    const rb = animals.rabbit; const fx = animals.fox;
    rb.userData.free = false; fx.userData.free = false;
    settle(rb); settle(fx);
    const RB = new V3(-1.9, 0, 0.15); const FX = new V3(-3.3, 0, -0.35);
    hop(rb, RB, 0.8, 0.4).then(() => { rb.rotation.y = 0.2; });
    hop(fx, FX, 0.8, 0.3).then(() => { fx.rotation.y = 0.2; });
    VIEW.chain();
    const seq = [];
    const names = { grass: 'Трева', rabbit: 'Заек', fox: 'Лисица' };
    const draw = () => {
      shell.task(`<p>Животните в гората са свързани чрез храната си.</p>
        <p><b>Построй хранителна верига:</b> кликни първо върху растението, после върху животното, което го яде, и накрая върху хищника.</p>
        <p class="ecosystems-chain">${seq.length ? seq.map((x) => esc(names[x])).join(' → ') : '…'}</p>`);
      shell.score(`Грешки: ${mistakes}`);
    };
    draw();
    shell.setControls('');
    const posOf = (id) => (id === 'grass' ? chainGrass.position : id === 'rabbit' ? RB : FX);
    clickHandler = (id) => {
      if (id === 'deer') { shell.msg('Сърната също яде трева, но сега построй веригата със заека и лисицата.', ''); return; }
      if (!names[id] || seq.includes(id)) return;
      const want = ['grass', 'rabbit', 'fox'][seq.length];
      const anchor = id === 'grass' ? chainGrass : id === 'rabbit' ? rb : fx;
      const lift = id === 'grass' ? 0.8 : anchor.userData.top;
      if (id !== want) {
        mistakes++;
        let why;
        if (!seq.length) why = 'Веригата започва от растение. Растенията сами си правят храната.';
        else if (id === 'fox') why = 'Лисицата не яде трева. Кой яде трева?';
        else why = 'Помисли кой кого изяжда.';
        say(anchor, `✘ ${why}`, 'bad', lift);
        shell.msg(why, 'bad');
        draw();
        return;
      }
      if (seq.length) {
        const ar = arrowBetween(posOf(seq[seq.length - 1]), posOf(id));
        land.add(ar);
        arrows.push(ar);
      }
      seq.push(id);
      const txt = { grass: 'Тревата е растение. С нея започва веригата.', rabbit: 'Заекът яде трева.', fox: 'Лисицата лови зайци.' }[id];
      say(anchor, `✓ ${txt}`, 'good', lift);
      shell.msg(`✓ ${txt}`, 'good');
      draw();
      if (seq.length === 3) {
        clickHandler = null;
        shell.msg('Вярно! Трева → заек → лисица.', 'good');
        wait(1.0).then(() => foxQuestion(mistakes));
      }
    };
  }

  const extraRabbitObjs = [];
  function foxQuestion(m0) {
    let mistakes = m0;
    say(animals.fox, '<b>Представи си:</b> всички лисици изчезват от гората.', 'wide', animals.fox.userData.top);
    const box = shell.setControls('<div></div>').firstChild;
    choiceBox(box, 'Какво ще стане тогава?', ['Зайците също ще изчезнат.', 'Зайците ще станат много и ще изядат тревата.', 'Нищо няма да се промени.'], 1,
      (i) => (i === 0 ? 'Зайците не ядат лисици – те ядат трева. Помисли: кой вече няма да лови зайците?' : 'Всички в хранителната верига са свързани. Ако едно звено изчезне, другите се променят.'),
      async () => {
        shell.msg('Да видим какво ще се случи…', 'good');
        clearTip();
        for (const a of arrows) land.remove(a);
        arrows = [];
        await shrink(animals.fox, 0.8);
        fitView([-1.9, 0.3, 1.6], 3.2, 2.0, 0.65);
        // Зайците се множат.
        for (let i = 0; i < 9; i++) {
          const g = rabbitModel();
          g.userData = { ...g.userData, cx: -1.9 + (i % 3 - 1) * 1.0, cz: 1.4 + (Math.floor(i / 3) - 1) * 0.9, r: 0.4 + (i % 2) * 0.2, a: i, sp: 0.8 + (i % 3) * 0.2, ph: i };
          g.scale.setScalar(0.001);
          shadows(g);
          land.add(g);
          extraRabbits.push(g);
          extraRabbitObjs.push(g);
          grow(g, 0.5);
          await wait(0.18);
        }
        // Тревата е изядена.
        const brown = new THREE.Color(0xb59a52);
        const s0 = meadowPatches.map((g) => g.scale.x);
        await phase(2.4, (k) => {
          grassM.color.copy(grass0).lerp(brown, k);
          meadowPatches.forEach((g, i) => { g.scale.set(s0[i], Math.max(0.2, 1 - k * 0.75), s0[i]); });
        });
        say(BUBBLE_AT.meadow, 'Без лисици никой не лови зайците. Те стават много и изяждат тревата. После и самите зайци остават без храна. <b>Равновесието в природата е нарушено.</b>', 'wide bad', 0.6);
        shell.task('<p>В природата растенията, растителноядните животни и хищниците се пазят в <b>равновесие</b>. Ако изчезне едно звено от веригата, страдат и другите.</p>');
        shell.msg('Наблюдавай какво стана с ливадата.', 'good');
        shell.score(`Грешки: ${mistakes}`);
        shell.setControls('<button class="btn primary">Напред →</button>').querySelector('button').addEventListener('click', () => {
          scores.push(stepScore(mistakes, 4));
          // Природата се връща в равновесие.
          for (const g of extraRabbitObjs) { land.remove(g); extraRabbits.splice(extraRabbits.indexOf(g), 1); }
          extraRabbitObjs.length = 0;
          grassM.color.copy(grass0);
          meadowPatches.forEach((g) => g.scale.setScalar(1));
          animals.fox.visible = true;
          animals.fox.scale.setScalar(1);
          for (const k of ['rabbit', 'fox']) { animals[k].userData.free = true; settle(animals[k]); }
          clearTip();
          shell.msg('');
          step3();
        });
      },
      () => { mistakes++; shell.score(`Грешки: ${mistakes}`); });
  }

  // =================== 3. ПРИСПОСОБЛЕНИЯ ===================
  let stopDrag = null;
  const IN_HAB = { desert: 'в горещата и суха пустиня', polar: 'в студените полярни ледове', water: 'във водата' };
  function step3() {
    shell.step(2);
    land.visible = false;
    gal.visible = true;
    scene.background.set(0xcfe9f7);
    scene.fog.color.set(0xcfe9f7);
    VIEW.gallery();
    let mistakes = 0;
    let busy = false;
    const done = new Set();
    const wrongBy = {};
    const upd = () => shell.score(`Готови: ${done.size} от ${ORGS.length} · грешки: ${mistakes}`);
    const intro = () => {
      shell.task(`<p>Всеки организъм е <b>приспособен</b> към средата, в която живее.</p>
        <p><b>Провлачи</b> всеки организъм в неговата среда. После избери приспособлението, което му помага да живее там.</p>`);
      shell.setControls('');
      upd();
    };
    intro();
    clickHandler = (id) => {
      if (!ORG[id] || busy || done.has(id)) return;
      say(orgs[id], `<b>${esc(ORG[id].label)}</b> – провлачи ме до моята среда.`, '', orgs[id].userData.top);
    };
    const lockAll = (on) => { for (const id in orgs) orgs[id].userData.locked = on || done.has(id); };
    lockAll(false);
    stopDrag = stage.enableDrag({
      planeY: 0,
      lift: 0.5,
      onStart: (g) => { g.userData.dragging = true; clearTip(); },
      onDrop: async (g, p) => {
        g.userData.dragging = false;
        const id = g.userData.dragId;
        const o = ORG[id];
        let target = null;
        for (const h of HABITATS) if (Math.hypot(p.x - h.x, p.z - GZ) < 2.1) target = h.id;
        g.userData.moving = true;
        if (!target) { await hop(g, g.userData.start, 0.4, 0.3); g.userData.moving = false; return; }
        if (target !== o.hab) {
          mistakes++;
          wrongBy[id] = (wrongBy[id] || 0) + 1;
          upd();
          const why = `${o.label} не може да живее тук. ${HAB[target].why}`;
          shell.msg(wrongBy[id] >= 2 ? `${why} Подсказка: ${o.hint}` : why, 'bad');
          await hop(g, g.userData.start, 0.5, 0.4);
          g.userData.moving = false;
          say(g, `✘ Не е тук.`, 'bad', g.userData.top);
          return;
        }
        busy = true;
        lockAll(true);
        await hop(g, SLOT[id], 0.5, 0.5);
        g.userData.placed = true;
        g.userData.moving = false;
        g.rotation.y = id === 'fish' ? 0 : -0.3;
        shell.msg(`Вярно! ${o.label} живее ${IN_HAB[o.hab]}.`, 'good');
        say(g, `<b>${esc(o.label)}</b>: какво ми помага да живея тук?`, '', g.userData.top - 0.1);
        const others = shuffle(ORGS.filter((x) => x.hab !== o.hab)).slice(0, 2);
        const opts = shuffle([o, ...others]);
        const box = shell.setControls('<div></div>').firstChild;
        choiceBox(box, `Кое приспособление помага на организма „${esc(o.label)}“ да живее ${IN_HAB[o.hab]}?`, opts.map((x) => esc(x.adapt)), opts.indexOf(o),
          (i) => `„${opts[i].adapt}“ е приспособление на друг организъм. Помисли какво е нужно, за да се живее ${IN_HAB[o.hab]}.`,
          () => {
            done.add(id);
            say(g, `✓ ${esc(o.done)}`, 'wide good', g.userData.top - 0.1);
            busy = false;
            lockAll(false);
            if (done.size < ORGS.length) { intro(); shell.msg(`✓ ${o.adapt}`, 'good'); return; }
            if (stopDrag) { stopDrag(); stopDrag = null; }
            clickHandler = null;
            shell.task('<p>Всички организми са в своята среда! Те имат <b>приспособления</b>, с които оцеляват в жега, в студ или във вода.</p>');
            upd();
            shell.msg(`✓ ${o.adapt}`, 'good');
            shell.setControls('<button class="btn primary">Напред →</button>').querySelector('button').addEventListener('click', () => {
              scores.push(stepScore(mistakes, 4));
              clearTip();
              shell.msg('');
              step4();
            });
          },
          () => { mistakes++; upd(); });
      },
    });
  }

  // =================== 4. РАВНОВЕСИЕ ===================
  const AGAINST = { cut: 'отсечените дървета', fire: 'огъня', trash: 'отпадъците', poach: 'бракониерите' };
  async function doHarm(id) {
    if (id === 'cut') {
      await Promise.all(cutTrees.map(async (t, i) => {
        await wait(i * 0.25);
        await phase(0.8, (k) => { t.rotation.z = ease(k) * 1.45; });
        await shrink(t, 0.5);
      }));
      await Promise.all(stumps.map((s) => grow(s, 0.4)));
    } else if (id === 'fire') {
      fireOn = true;
      fireG.visible = true;
      fireG.scale.setScalar(0.001);
      animals.fox.userData.free = false;
      await Promise.all([
        grow(fireG, 0.8),
        phase(1.8, (k) => { for (const t of fireTrees) t.userData.leafM.color.copy(t.userData.leaf0).lerp(BURNT, k); }),
        shrink(animals.fox, 1.0),
      ]);
    } else if (id === 'trash') {
      for (const g of trash) {
        g.visible = true;
        g.position.copy(g.userData.home).setY(1.5);
        hop(g, g.userData.home, 0.5, 0.2);
        await wait(0.15);
      }
      await wait(0.5);
    } else if (id === 'poach') {
      hunter.scale.setScalar(0.001);
      trap.scale.setScalar(0.001);
      await Promise.all([grow(hunter, 0.6), grow(trap, 0.6)]);
      for (const k of ['deer', 'deer2']) animals[k].userData.free = false;
      await Promise.all([shrink(animals.deer, 0.9), shrink(animals.deer2, 0.9)]);
    }
  }
  async function doFix(id) {
    if (id === 'cut') {
      await Promise.all(saplings.map(async (s, i) => { s.scale.setScalar(0.001); await wait(i * 0.2); await grow(s, 1.0, 0.55); }));
    } else if (id === 'fire') {
      rain.visible = true;
      rain.scale.setScalar(0.001);
      await grow(rain, 0.5);
      await phase(1.4, (k) => { fireG.scale.setScalar(Math.max(0.001, 1 - k)); });
      fireG.visible = false;
      fireOn = false;
      await shrink(rain, 0.5);
      animals.fox.scale.setScalar(0.001);
      await Promise.all([
        phase(1.6, (k) => { for (const t of fireTrees) t.userData.leafM.color.copy(BURNT).lerp(t.userData.leaf0, k); }),
        grow(animals.fox, 0.8),
      ]);
      animals.fox.userData.free = true;
    } else if (id === 'trash') {
      bin.scale.setScalar(0.001);
      await grow(bin, 0.5);
      const to = bin.position.clone().setY(0.7);
      await Promise.all(trash.map(async (g, i) => { await wait(i * 0.12); await hop(g, to, 0.6, 0.7); g.visible = false; }));
    } else if (id === 'poach') {
      sign.scale.setScalar(0.001);
      await grow(sign, 0.6);
      await Promise.all([shrink(hunter, 0.6), shrink(trap, 0.6)]);
      animals.deer.scale.setScalar(0.001);
      animals.deer2.scale.setScalar(0.001);
      await Promise.all([grow(animals.deer, 0.8), grow(animals.deer2, 0.8, 0.8)]);
      for (const k of ['deer', 'deer2']) animals[k].userData.free = true;
    }
  }

  function step4() {
    shell.step(3);
    gal.visible = false;
    land.visible = true;
    scene.background.set(SKY);
    scene.fog.color.set(SKY);
    hud.hidden = false;
    setHealth(100);
    VIEW.balance();
    let mistakes = 0;
    const harmed = new Set();
    let busy = false;
    shell.task(`<p>Понякога хората <b>нарушават равновесието</b> в природата.</p>
      <p><b>Натисни всеки бутон</b> и наблюдавай какво се случва с гората.</p>`);
    shell.score('');
    const ctrl = shell.setControls(`<div class="choices ecosystems-four">${HARMS.map((h) => `<button class="choice" data-h="${h.id}">${h.icon} ${esc(h.label)}</button>`).join('')}</div>`);
    ctrl.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', async () => {
      if (busy) return;
      const id = b.dataset.h;
      busy = true;
      b.disabled = true;
      b.classList.add('wrong');
      clearTip();
      shell.msg('');
      VIEW[id]();
      await wait(0.6);
      await doHarm(id);
      harmed.add(id);
      setHealth(100 - harmed.size * 20);
      say(BUBBLE_AT[id], HARM[id].on, 'wide bad', 0.4);
      busy = false;
      if (harmed.size === HARMS.length) {
        await wait(1.8);
        predict();
      }
    }));

    function predict() {
      VIEW.balance();
      clearTip();
      shell.task('<p>Гората е пострадала. <b>Предскажи:</b> ако хората не направят нищо, какво ще стане с животните, които живеят в нея?</p>');
      const box = shell.setControls('<div></div>').firstChild;
      choiceBox(box, 'Животните в гората…', ['ще станат повече, защото има повече място.', 'ще останат без дом и храна и ще изчезнат от гората.', 'нищо няма да им се случи.'], 1,
        () => 'Дърветата дават на животните дом и храна. Помисли какво става, когато ги няма или когато гората е замърсена.',
        () => {
          shell.msg('Точно така! Растенията дават на животните дом и храна. Затова хората трябва да пазят гората.', 'good');
          shell.setControls('<button class="btn primary">Да помогнем на гората →</button>').querySelector('button').addEventListener('click', fixPhase);
        },
        () => { mistakes++; });
    }

    function fixPhase() {
      const fixed = new Set();
      const upd = () => shell.score(`Помогна: ${fixed.size} от ${HARMS.length} · грешки: ${mistakes}`);
      const intro = () => {
        shell.task('<p>Хората могат да помогнат на природата. <b>Кликни върху всяка повреда</b>, отбелязана с <b>!</b>, и избери мярката, която ще я поправи.</p>');
        shell.setControls('<div class="row"><button class="btn all">🔭 Цялата гора</button></div>').querySelector('.all').addEventListener('click', () => { clearTip(); VIEW.balance(); });
        upd();
      };
      for (const h of HARMS) markers[h.id].visible = true;
      VIEW.balance();
      shell.msg('');
      intro();
      const order = shuffle(HARMS.map((h) => h.id));
      clickHandler = (raw) => {
        if (busy || !raw || !raw.startsWith('h-')) return;
        const id = raw.slice(2);
        if (fixed.has(id)) return;
        busy = true;
        VIEW[id]();
        say(BUBBLE_AT[id], HARM[id].on, 'wide bad', 0.4);
        shell.msg('');
        let wrongHere = 0;
        const box = shell.setControls('<div></div>').firstChild;
        choiceBox(box, `Как да помогнем на гората срещу ${AGAINST[id]}?`, order.map((o) => `${FIXES[o].icon} ${esc(FIXES[o].label)}`), order.indexOf(id),
          (i) => {
            wrongHere++;
            const o = order[i];
            return wrongHere >= 2 ? `Подсказка: ${FIXES[id].hint}` : `„${FIXES[o].label}“ помага срещу ${AGAINST[o]}, а тук трябва да се справим с ${AGAINST[id]}.`;
          },
          async () => {
            markers[id].visible = false;
            clearTip();
            shell.msg('Чудесно! Гледай…', 'good');
            await doFix(id);
            fixed.add(id);
            setHealth(20 + fixed.size * 20);
            say(BUBBLE_AT[id], `✓ ${FIXES[id].done}`, 'wide good', 0.4);
            busy = false;
            if (fixed.size < HARMS.length) { intro(); shell.msg(`✓ ${FIXES[id].label}`, 'good'); return; }
            clickHandler = null;
            await wait(1.6);
            VIEW.balance();
            say(BUBBLE_AT.forest, '🌳 Гората отново е в равновесие! Дърветата растат, животните се върнаха, а почвата и водата са чисти.', 'wide good', 0.2);
            shell.task('<p>Хората опазват природата, когато <b>засаждат дървета</b>, <b>гасят пожари</b>, <b>почистват отпадъците</b> и създават <b>защитени територии</b>.</p>');
            upd();
            shell.msg('');
            shell.setControls('<button class="btn primary">Виж резултата</button>').querySelector('button').addEventListener('click', () => {
              scores.push(stepScore(mistakes, 3));
              clearTip();
              hud.hidden = true;
              const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
              shell.finish(ratio, onComplete, restart);
            });
          },
          () => { mistakes++; upd(); }, 'ecosystems-four');
      };
    }
  }

  step1();
  return {
    dispose() {
      alive = false;
      if (stopDrag) stopDrag();
      for (const d of disposers) d();
      menu.remove();
      hud.remove();
      stage.dispose();
    },
  };
}
