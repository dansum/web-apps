// 7.3.4 „Конституцията: права и отговорности“ — София днес: сградите на трите власти.
// Стъпки: опознай сградите и институциите → опит: проследи как един закон минава от предложение
// през гласуване до обнародване и какво става, ако Конституционният съд го намери противоконституционен
// → приложи: властите и институциите; права и задължения според Конституцията от 1991 г.
// → извор (1879 ↔ 1991, преразказ) и предскажи (реален изход).
// Сградите са истински, но са събрани на един площад; в София са на различни улици.
import { createStage, cornerMenu, labelSprite, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { M, column } from './hist/architecture.js';
import { mergeStatic, leafTree } from './hist/revival.js';
import { CM, col, streetLamp, bench, cityPerson } from './hist/city.js';
import { parliament, stateBuilding, tsarMonument, vitosha, flag } from './hist/sofia-places.js';
import { car } from './hist/home.js';
import { cloud } from './hist/bulgar.js';
import { wander } from './hist/antiquity.js';

const ms = (obj, keys = []) => mergeStatic(obj, keys.flatMap((k) => [].concat(obj.userData[k] ?? [])));
const tag = (s) => `<br><span class="small"><b>${s}</b></span>`;
const SIMPLE = 'Сградата е запазена и се ползва и днес. Моделът е опростен.';
const REC = 'Възстановка за сцената.';

// ---------- стъпка 1: какво има за разглеждане ----------
const SPOTS = [
  { id: 'ns', label: 'Народното събрание', icon: '🏛️',
    note: `<b>Законодателната власт.</b> 240 народни представители, избрани от гражданите за 4 години, обсъждат и приемат законите. Сградата е от края на XIX век. Над входа пише „Съединението прави силата“. Днес депутатите заседават в голяма зала в друга сграда наблизо, а тази също е на Народното събрание.${tag(SIMPLE)}` },
  { id: 'ms', label: 'Министерският съвет', icon: '🏢',
    note: `<b>Изпълнителната власт.</b> Министерският съвет е правителството. Води го министър-председателят. Министрите ръководят вътрешната и външната политика и изпълняват законите. Министерският съвет може да предлага нови закони.${tag(SIMPLE)}` },
  { id: 'court', label: 'Съдебната палата', icon: '⚖️',
    note: `<b>Съдебната власт.</b> Съдилищата решават спорове и съдят по законите. Към съдебната власт са и прокуратурата и следствието. В Съдебната палата на булевард „Витоша“ работят няколко съдилища. Пред входа ѝ има два бронзови лъва.${tag(SIMPLE)}` },
  { id: 'pres', label: 'Президентството', icon: '🎖️',
    note: `<b>Държавният глава.</b> Президентът не е отделна, четвърта власт: Конституцията разделя властта на три. Той олицетворява единството на нацията и представлява България пред света. Пред сградата стои почетна гвардия.${tag(SIMPLE)}` },
  { id: 'cc', label: 'Конституционният съд', icon: '📘',
    note: `<b>Пазителят на Конституцията.</b> 12 съдии проверяват дали законите са в съгласие с Конституцията. Той не е част от обикновените съдилища.${tag('Сградата тук е условна: моделът само показва, че съдът е отделен.')}` },
  { id: 'book', label: 'Конституцията от 1991 г.', icon: '📜',
    note: `<b>Основният закон.</b> Приета е на 12 юли 1991 г. от Седмото велико народно събрание. Член 8 казва, че държавната власт се разделя на законодателна, изпълнителна и съдебна. Всички други закони трябва да са в съгласие с нея.${tag('Голямата книга на площада е само знак за сцената.')}` },
  { id: 'people', label: 'Гражданите', icon: '👥',
    note: `Конституцията казва, че цялата държавна власт произтича от народа. Гражданите избират депутатите и президента. Те имат права, но и задължения.${tag(REC)}` },
  { id: 'sofia', label: 'София днес', icon: '🗺️',
    note: `Всички тези сгради са в центъра на София, но са на различни улици. Тук са събрани на един площад, за да ги видиш заедно. Зад тях е Витоша.${tag('Разположението е условно.')}` },
];

// ---------- стъпка 2: пътят на един закон ----------
const LAW_WRONG1 = {
  court: 'Съдът не приема закони. Той съди по тях.',
  pres: 'Президентът не приема законите. Той ги обнародва, след като са приети.',
  cc: 'Конституционният съд не приема закони. Той проверява дали са в съгласие с Конституцията.',
  ms: 'Министерският съвет вече предложи закона. Сега някой трябва да го обсъди и гласува.',
  book: 'Конституцията е основата. Но новият закон трябва да бъде гласуван от някого.',
  people: 'Гражданите избират депутатите. А кой гласува законите?',
};
const LAW_WRONG2 = {
  ns: 'Депутатите вече приеха закона. Сега той трябва да бъде обнародван.',
  ms: 'Правителството ще изпълнява закона, но не го обнародва.',
  court: 'Съдът не обнародва законите. Той съди по тях.',
  cc: 'Конституционният съд не обнародва законите.',
  book: 'Новият закон не се пише в Конституцията. Той трябва да бъде обнародван.',
  people: 'Гражданите ще прочетат закона, след като той бъде обнародван. Кой го обнародва?',
};
const LAW_WRONG3 = {
  court: 'Съдилищата в Съдебната палата съдят по законите. Дали един закон е в съгласие с Конституцията, решава друг съд.',
  ns: 'Депутатите могат да променят закона, но не решават спора дали той нарушава Конституцията.',
  pres: 'Президентът също може да поиска такава проверка, но не решава сам.',
  ms: 'Министерският съвет не решава дали законът е в съгласие с Конституцията.',
  book: 'Конституцията е мярката. Но кой я прилага, за да провери закона?',
  people: 'Гражданите могат да спорят, но решението взима съд. Кой?',
};

// ---------- стъпка 3 ----------
const POWERS = [
  { id: 'ns', label: 'Законодателна власт', color: '#2e7d32', why: 'Приема законите' },
  { id: 'ms', label: 'Изпълнителна власт', color: '#1565c0', why: 'Изпълнява законите' },
  { id: 'court', label: 'Съдебна власт', color: '#6a1b9a', why: 'Съди по законите' },
  { id: 'pres', label: 'Държавен глава', color: '#8d6e00', why: 'Не е отделна власт' },
];
const POWER_WRONG = {
  ns: 'Народното събрание приема законите — това е законодателната власт.',
  ms: 'Министерският съвет изпълнява законите — това е изпълнителната власт.',
  court: 'Съдилищата съдят по законите — това е съдебната власт.',
  pres: 'Президентът е държавен глава. Той не е отделна власт.',
  cc: 'Конституционният съд пази Конституцията. Той не е част от трите власти, за които питаме.',
  book: 'Това е Конституцията. Тя разделя властта, но не е институция.',
  people: 'Гражданите избират, но не са институция на властта.',
  sofia: '',
};
const ZONES = [
  { id: 'z-right', label: 'Право', color: 0x2e9d55, css: '#2e9d55', dx: -3.1, dz: 0 },
  { id: 'z-duty', label: 'Задължение', color: 0x2f6fbf, css: '#2f6fbf', dx: 0, dz: 0.5 },
  { id: 'z-none', label: 'Няма го в Конституцията', color: 0x8a8a8a, css: '#6b6b6b', dx: 3.1, dz: 0 },
];
// Само неща, които наистина са в Конституцията от 1991 г. (без номера на членове).
const CARDS = [
  { id: 'c-edu', label: 'Право на образование', zone: 'z-right', ok: 'Да. Всеки има право на образование.' },
  { id: 'c-tax', label: 'Да плащаш данъци', zone: 'z-duty', ok: 'Да. Гражданите са длъжни да плащат данъци и такси, определени със закон.' },
  { id: 'c-speech', label: 'Свобода на словото', zone: 'z-right', ok: 'Да. Всеки може свободно да изразява мнението си — с думи, писмено, с образ.' },
  { id: 'c-law', label: 'Да спазваш законите', zone: 'z-duty', ok: 'Да. Гражданите са длъжни да спазват Конституцията и законите.' },
  { id: 'c-party', label: 'Да членуваш в партия', zone: 'z-none', ok: 'Точно така. Никой не е длъжен да членува в партия. Това е свободен избор.' },
  { id: 'c-vote', label: 'Да гласуваш от 18 години', zone: 'z-right', ok: 'Да. Гражданите над 18 години имат право да избират.' },
  { id: 'c-nature', label: 'Да опазваш природата', zone: 'z-duty', ok: 'Да. Всеки има право на здравословна среда и е длъжен да я опазва.' },
  { id: 'c-faith', label: 'Свобода на вярата', zone: 'z-right', ok: 'Да. Свободата на съвестта и на вероизповеданието е неприкосновена.' },
  { id: 'c-others', label: 'Да зачиташ правата на другите', zone: 'z-duty', ok: 'Да. Гражданите са длъжни да зачитат правата и законните интереси на другите.' },
  { id: 'c-notax', label: 'Да не плащаш данъци, ако не искаш', zone: 'z-none', ok: 'Вярно. Такова право няма — плащането на данъци е задължение.' },
];
const CARD_WRONG = {
  'z-right': {
    'z-duty': 'Това е нещо, което <b>трябва</b> да правиш. Значи е задължение, а не право.',
    'z-none': 'Това наистина е записано в Конституцията.',
  },
  'z-duty': {
    'z-right': 'Това е свобода, която имаш, а не нещо, което си длъжен да правиш.',
    'z-none': 'Това наистина е записано в Конституцията.',
  },
  'z-none': {
    'z-right': 'Такова право няма в Конституцията. Помисли пак.',
    'z-duty': 'Конституцията не задължава никого да прави това. Помисли пак.',
  },
};

// ---------- стъпка 4: извор и предсказание ----------
const COMPARE = [
  { t: 'Държавата', a: 'България е княжество. Начело е князът. Властта му се предава по наследство.', b: 'България е република с парламентарно управление. Държавен глава е президентът.' },
  { t: 'Законите', a: 'Народното събрание гласува законите, а князът ги потвърждава.', b: 'Народното събрание приема законите. Президентът ги обнародва.' },
  { t: 'Властта', a: 'Князът има голяма власт — и при законите, и в управлението чрез министрите.', b: 'Властта е разделена на три: законодателна, изпълнителна и съдебна. Конституционен съд пази основния закон.' },
  { t: 'Правата', a: 'Всички са равни пред закона. Началното училище е безплатно и задължително. Печатът е свободен.', b: 'Всички са равни пред закона. Право на образование, свобода на словото, право на глас от 18 години.' },
];
const Q1 = [
  { t: 'Гражданите ще го изберат пряко на избори.', ok: true },
  { t: 'Депутатите ще го изберат отново.', ok: false, why: 'Новата Конституция променя правилото. Държавният глава вече не се избира в залата на Народното събрание.' },
  { t: 'Министър-председателят ще го назначи.', ok: false, why: 'Не. Министър-председателят е начело на изпълнителната власт и не назначава държавния глава.' },
];
const Q2 = [
  { t: 'Да върне закона в Народното събрание за ново обсъждане.', ok: true },
  { t: 'Да спре закона завинаги и никога да не го обнародва.', ok: false, why: 'Президентът не може сам да спре закон завинаги. Помисли коя институция има последната дума за законите.' },
  { t: 'Да го занесе в Съдебната палата, за да го отмени съдът.', ok: false, why: 'Обикновените съдилища не отменят закони. Те съдят по тях.' },
];

// ---------- текстури с надпис ----------
const texMats = new Map();
function canvasMat(key, w, h, draw, extra = {}) {
  if (texMats.has(key)) return texMats.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, ...extra });
  m.userData.canvas = c;
  texMats.set(key, m);
  return m;
}
const B = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const CY = (rt, rb, h, m, seg = 12) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
const SP = (r, m, ws = 12, hs = 8) => new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m);
const BRONZE = () => col(0x5a4a30, { metal: 0.55, rough: 0.42 });
const GOLD = () => col(0xd8b23a, { metal: 0.75, rough: 0.28 });
const DARKW = () => col(0x2a3038, { rough: 0.35 });

// Лъв от бронз (опростен), гледа по +z.
function lion() {
  const g = new THREE.Group();
  const m = BRONZE();
  const ped = B(0.34, 0.22, 0.5, M(0xffffff, { tex: 'limestone', rep: [1, 0.5] })); ped.position.y = 0.11; g.add(ped);
  const body = B(0.16, 0.13, 0.34, m); body.position.set(0, 0.29, -0.02); g.add(body);
  const chest = SP(0.09, m); chest.position.set(0, 0.32, 0.13); chest.scale.set(1, 1.1, 0.9); g.add(chest);
  const mane = SP(0.085, m); mane.position.set(0, 0.42, 0.16); g.add(mane);
  const head = B(0.08, 0.08, 0.1, m); head.position.set(0, 0.42, 0.22); g.add(head);
  for (const s of [-1, 1]) { const paw = B(0.05, 0.05, 0.12, m); paw.position.set(s * 0.05, 0.245, 0.17); g.add(paw); }
  const tail = B(0.03, 0.03, 0.14, m); tail.position.set(0.06, 0.25, -0.2); tail.rotation.y = 0.5; g.add(tail);
  return g;
}

// ---------- Съдебната палата ----------
// Голяма каменна сграда: висок цокъл, широко стълбище с лъвове, колонада в средата, корниз и знаме.
function courtPalace({ w = 3.4, d = 1.6, H = 1.55 } = {}) {
  const g = new THREE.Group();
  const stone = M(0xffffff, { tex: 'limestone', rep: [5, 2] });
  const lime = M(0xe9e0cc, { tex: 'limestone', rep: [4, 2] });
  const trim = col(0xf0e8d6);
  const plinth = 0.42;
  const base = B(w + 0.1, plinth, d + 0.1, M(0xffffff, { tex: 'stone', rep: [6, 0.6] })); base.position.y = plinth / 2; g.add(base);
  const body = B(w, H, d, lime); body.position.y = plinth + H / 2; g.add(body);
  const cor = B(w + 0.14, 0.08, d + 0.14, trim); cor.position.y = plinth + H + 0.04; g.add(cor);
  const attic = B(w - 0.2, 0.22, d - 0.2, stone); attic.position.y = plinth + H + 0.19; g.add(attic);
  const roof = B(w - 0.36, 0.08, d - 0.36, col(0x6f7478)); roof.position.y = plinth + H + 0.34; g.add(roof);
  // Средата: дълбока ложа с високи колони.
  const cw = 1.7;
  const loggia = B(cw, H * 0.82, 0.02, col(0x4a4640)); loggia.position.set(0, plinth + H * 0.45, d / 2 + 0.005); g.add(loggia);
  for (let i = 0; i < 8; i++) {
    const c = column('doric', { h: H * 0.8, r: 0.055, color: 0xf2ede1 });
    c.position.set(-cw / 2 + 0.1 + i * (cw - 0.2) / 7, plinth + 0.02, d / 2 + 0.12); g.add(c);
  }
  const ent = B(cw + 0.2, 0.12, 0.3, trim); ent.position.set(0, plinth + H * 0.83 + 0.06, d / 2 + 0.12); g.add(ent);
  for (let i = 0; i < 3; i++) { const dr = B(0.16, 0.32, 0.01, col(0x3a2c1e)); dr.position.set(-0.45 + i * 0.45, plinth + 0.18, d / 2 + 0.012); g.add(dr); }
  // Прозорци по крилата, на три етажа.
  for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) {
    const x = sx * (cw / 2 + 0.16 + i * 0.25);
    const wn = B(0.12, 0.24, 0.012, DARKW()); wn.position.set(x, plinth + 0.25 + r * 0.45, d / 2 + 0.006); g.add(wn);
    const sill = B(0.16, 0.025, 0.04, trim); sill.position.set(x, plinth + 0.12 + r * 0.45, d / 2 + 0.02); g.add(sill);
  }
  for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) {
    const wn = B(0.012, 0.24, 0.12, DARKW()); wn.position.set(sx * (w / 2 + 0.006), plinth + 0.25 + r * 0.45, -d / 2 + 0.25 + i * (d - 0.5) / 3); g.add(wn);
  }
  // Широко стълбище.
  const sw = 2.0;
  for (let i = 0; i < 6; i++) { const st = B(sw - i * 0.04, plinth - i * plinth / 6, 0.12, M(0xe6e0d4, { tex: 'limestone', rep: [3, 0.3] })); st.position.set(0, (plinth - i * plinth / 6) / 2, d / 2 + 0.05 + 0.72 - i * 0.12); g.add(st); }
  for (const s of [-1, 1]) { const l = lion(); l.position.set(s * (sw / 2 + 0.22), 0, d / 2 + 0.55); g.add(l); }
  const fl = flag(undefined, { pole: 0.7 }); fl.position.set(0, plinth + H + 0.38, 0); g.add(fl);
  g.userData.flag = fl.userData.cloth;
  g.userData.top = plinth + H + 1.1;
  return g;
}

// ---------- Конституционният съд (условна сграда) ----------
function constCourt() {
  const g = new THREE.Group();
  const lime = M(0xefe6d2, { tex: 'limestone', rep: [2, 1] });
  const trim = col(0xf6f0e2);
  const base = B(2.1, 0.2, 1.3, M(0xffffff, { tex: 'stone', rep: [3, 0.4] })); base.position.y = 0.1; g.add(base);
  const body = B(1.9, 0.95, 1.1, lime); body.position.y = 0.2 + 0.475; g.add(body);
  const cor = B(2.0, 0.06, 1.2, trim); cor.position.y = 1.18; g.add(cor);
  for (let i = 0; i < 6; i++) { const c = column('ionic', { h: 0.8, r: 0.04, color: 0xf6f0e2 }); c.position.set(-0.75 + i * 0.3, 0.2, 0.68); g.add(c); }
  const ent = B(1.8, 0.1, 0.2, trim); ent.position.set(0, 1.07, 0.68); g.add(ent);
  const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.98, 0), new THREE.Vector2(0.98, 0), new THREE.Vector2(0, 0.32)]), { depth: 0.2, bevelEnabled: false }), trim);
  tri.position.set(0, 1.12, 0.58); g.add(tri);
  const roof = B(1.7, 0.1, 0.95, col(0x6f7478)); roof.position.y = 1.26; g.add(roof);
  const door = B(0.3, 0.45, 0.01, col(0x3a2c1e)); door.position.set(0, 0.43, 0.556); g.add(door);
  // Книга с везни над входа — знак за сцената.
  const gold = GOLD();
  const post = CY(0.01, 0.01, 0.22, gold, 6); post.position.set(0, 1.55, 0.65); g.add(post);
  const beam = B(0.34, 0.015, 0.015, gold); beam.position.set(0, 1.65, 0.65); g.add(beam);
  for (const s of [-1, 1]) { const pan = CY(0.06, 0.04, 0.02, gold, 12); pan.position.set(s * 0.16, 1.56, 0.65); g.add(pan); }
  g.userData.top = 1.9;
  return g;
}

// Почетен гвардеец (опростен): висока шапка, тъмна униформа.
function guard() {
  const g = new THREE.Group();
  const uni = col(0x1f2a4a), white = col(0xf2efe6), red = col(0xb0262a), skin = col(0xe0b58f);
  for (const s of [-1, 1]) { const l = CY(0.03, 0.028, 0.3, white, 8); l.position.set(s * 0.04, 0.15, 0); g.add(l); const b = B(0.05, 0.03, 0.08, col(0x111111)); b.position.set(s * 0.04, 0.015, 0.01); g.add(b); }
  const body = CY(0.07, 0.08, 0.28, uni, 10); body.position.y = 0.43; g.add(body);
  const belt = CY(0.082, 0.082, 0.03, red, 10); belt.position.y = 0.32; g.add(belt);
  for (const s of [-1, 1]) { const a = CY(0.022, 0.02, 0.24, uni, 6); a.position.set(s * 0.095, 0.43, 0); g.add(a); }
  const head = SP(0.06, skin); head.position.y = 0.63; g.add(head);
  const hat = CY(0.06, 0.065, 0.16, col(0x151515), 10); hat.position.y = 0.74; g.add(hat);
  const plume = SP(0.03, white); plume.position.set(0, 0.84, 0.03); g.add(plume);
  const rifle = B(0.02, 0.36, 0.02, col(0x4a3420)); rifle.position.set(0.11, 0.5, 0.03); g.add(rifle);
  return g;
}
// Съдия от Конституционния съд: тъмна тога.
function judge() {
  const g = new THREE.Group();
  const robe = CY(0.07, 0.13, 0.5, col(0x1e1e26), 12); robe.position.y = 0.25; g.add(robe);
  const coll = CY(0.075, 0.075, 0.03, col(0xf2efe6), 10); coll.position.y = 0.51; g.add(coll);
  const head = SP(0.065, col(0xe0b58f)); head.position.y = 0.6; g.add(head);
  const hair = SP(0.067, col(0x8a8a8a), 12, 6); hair.scale.y = 0.6; hair.position.set(0, 0.63, -0.01); g.add(hair);
  return mergeStatic(g);
}

// ---------- пленарната зала (разрез) ----------
// 240 места в полукръг пред трибуната; табло с резултата. Местата и хората са InstancedMesh.
function plenaryHall() {
  const g = new THREE.Group();
  const floor = B(4.2, 0.06, 2.7, col(0x7a2a2a, { rough: 0.95 })); floor.position.set(0, 0.03, -0.05); g.add(floor);
  const wallM = M(0xe8dcc0, { rough: 0.9 });
  const back = B(4.2, 1.0, 0.08, wallM); back.position.set(0, 0.5, -1.38); g.add(back);
  for (const s of [-1, 1]) { const sw = B(0.08, 0.5, 2.7, wallM); sw.position.set(s * 2.1, 0.25, -0.05); g.add(sw); }
  const front = B(4.2, 0.18, 0.06, wallM); front.position.set(0, 0.09, 1.3); g.add(front);
  // Трибуната и председателското място.
  const trib = B(1.2, 0.22, 0.32, M(0x6b4a2c)); trib.position.set(0, 0.11, -1.05); g.add(trib);
  const pult = B(0.22, 0.2, 0.12, M(0x6b4a2c)); pult.position.set(0, 0.16, -0.78); g.add(pult);
  const chair = new THREE.Group(); chair.position.set(0, 0.22, -1.1); g.add(chair);
  const ch = B(0.04, 0.16, 0.05, col(0x2b2f3a)); ch.position.y = 0.08; chair.add(ch);
  const chH = SP(0.03, col(0xe0b58f)); chH.position.y = 0.19; chair.add(chH);
  // Таблото.
  const board = B(1.5, 0.6, 0.04, boardMat()); board.position.set(0, 0.62, -1.33); g.add(board);
  const bfr = B(1.58, 0.68, 0.03, col(0x2a2a2e)); bfr.position.set(0, 0.62, -1.355); g.add(bfr);
  const fl = flag(undefined, { pole: 0.5, w: 0.28, h: 0.18 }); fl.position.set(-0.95, 0.06, -1.25); g.add(fl);
  // Места: 6 реда, общо 240.
  const rows = [0.75, 0.95, 1.15, 1.35, 1.55, 1.75];
  const counts = [24, 30, 37, 43, 50, 56];
  const N = 240;
  const deskG = new THREE.BoxGeometry(0.07, 0.04, 0.035);
  const bodyG = new THREE.CylinderGeometry(0.02, 0.026, 0.07, 6); bodyG.translate(0, 0.035, 0);
  const headG = new THREE.SphereGeometry(0.018, 8, 6);
  const lightG = new THREE.BoxGeometry(0.024, 0.008, 0.016);
  const desks = new THREE.InstancedMesh(deskG, col(0x8a5a32), N);
  const bodies = new THREE.InstancedMesh(bodyG, new THREE.MeshStandardMaterial({ roughness: 0.8 }), N);
  const heads = new THREE.InstancedMesh(headG, col(0xe0b58f), N);
  const lights = new THREE.InstancedMesh(lightG, new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
  const seats = [];
  const suit = [0x2b2f3a, 0x3a3f4a, 0x4a3a32, 0x23324a, 0x5a5f66, 0x6a2a2a];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
  let k = 0;
  rows.forEach((r, ri) => {
    const n = counts[ri];
    for (let i = 0; i < n; i++) {
      const a = -1.3 + (2.6 * (i + 0.5)) / n;
      const x = Math.sin(a) * r, z = -0.9 + Math.cos(a) * r, y = 0.06 + ri * 0.04;
      q.setFromAxisAngle(Y, a + Math.PI);
      const deskPos = new THREE.Vector3(x - Math.sin(a) * 0.045, y + 0.02, z - Math.cos(a) * 0.045);
      m4.compose(deskPos, q, one); desks.setMatrixAt(k, m4);
      m4.compose(new THREE.Vector3(x, y, z), q, one); bodies.setMatrixAt(k, m4);
      bodies.setColorAt(k, new THREE.Color(suit[(k * 7) % suit.length]));
      m4.compose(new THREE.Vector3(x, y + 0.088, z), q, one); heads.setMatrixAt(k, m4);
      m4.compose(new THREE.Vector3(deskPos.x, y + 0.044, deskPos.z), q, one); lights.setMatrixAt(k, m4);
      lights.setColorAt(k, new THREE.Color(0x888888));
      seats.push({ x, y, z, a });
      k++;
    }
  });
  g.add(desks, bodies, heads, lights);
  // Редът, в който местата светват: смесен, но винаги еднакъв.
  const order = seats.map((_, i) => i).sort((a, b) => ((a * 97) % 241) - ((b * 97) % 241));
  const C_FOR = new THREE.Color(0x2ecc55), C_AG = new THREE.Color(0xe0392b), C_AB = new THREE.Color(0xf2c230), C_OFF = new THREE.Color(0x888888);
  function setVotes(f, a, ab) {
    order.forEach((idx, j) => lights.setColorAt(idx, j < f ? C_FOR : j < f + a ? C_AG : j < f + a + ab ? C_AB : C_OFF));
    lights.instanceColor.needsUpdate = true;
    drawBoard(board.material, f, a, ab);
  }
  function clear() { setVotes(0, 0, 0); drawBoard(board.material, null); }
  g.userData = { setVotes, clear, board, chair, top: 1.2 };
  clear();
  return g;
}
function boardMat() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 208;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: t });
  m.userData.canvas = c;
  return m;
}
function drawBoard(m, f, a, ab) {
  const c = m.userData.canvas, ctx = c.getContext('2d');
  ctx.fillStyle = '#10161e'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = 'bold 30px system-ui, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#e8eef5';
  ctx.fillText('ГЛАСУВАНЕ', 256, 40);
  if (f == null) { ctx.fillStyle = '#7f8a96'; ctx.font = '26px system-ui, Arial, sans-serif'; ctx.fillText('Присъстват 240 народни представители', 256, 120); }
  else {
    ctx.font = 'bold 26px system-ui, Arial, sans-serif';
    [['ЗА', f, '#2ecc55'], ['ПРОТИВ', a, '#e0392b'], ['ВЪЗДЪРЖАЛИ СЕ', ab, '#f2c230']].forEach(([l, v, cl], i) => {
      ctx.fillStyle = cl; ctx.textAlign = 'left'; ctx.fillText(l, 60, 78 + i * 32); ctx.textAlign = 'right'; ctx.fillText(String(v), 452, 78 + i * 32);
    });
    const ok = f > 120;
    ctx.fillStyle = ok ? '#2ecc55' : '#e0392b'; ctx.textAlign = 'center'; ctx.font = 'bold 32px system-ui, Arial, sans-serif';
    ctx.fillText(ok ? 'ПРИЕТ' : 'НЕ Е ПРИЕТ', 256, 190);
  }
  m.map.needsUpdate = true;
}

// Голяма книга на пиедестал (знак за Конституцията в сцената).
function bookMonument() {
  const g = new THREE.Group();
  const ped = B(1.2, 0.5, 0.9, M(0xffffff, { tex: 'stone', rep: [2, 0.6] })); ped.position.y = 0.25; g.add(ped);
  const cap = B(1.3, 0.06, 1.0, col(0xe6dccb)); cap.position.y = 0.53; g.add(cap);
  const cover = B(1.1, 0.06, 0.78, col(0x7a1e1e, { rough: 0.6 })); cover.position.set(0, 0.6, 0); cover.rotation.x = -0.25; g.add(cover);
  const pages = canvasMat('bookpages', 512, 360, (ctx, w, h) => {
    ctx.fillStyle = '#f6eed8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120,90,40,0.25)'; ctx.fillRect(w / 2 - 6, 0, 12, h);
    ctx.fillStyle = '#5a1a14'; ctx.textAlign = 'center';
    ctx.font = 'bold 30px Georgia, serif'; ctx.fillText('КОНСТИТУЦИЯ', w / 4, 120);
    ctx.font = '20px Georgia, serif'; ctx.fillText('на Република', w / 4, 165); ctx.fillText('България', w / 4, 192);
    ctx.font = 'bold 26px Georgia, serif'; ctx.fillText('1991', w / 4, 250);
    ctx.fillStyle = 'rgba(40,30,20,0.5)';
    for (let y = 60, i = 0; y < h - 40; y += 18, i++) ctx.fillRect(w / 2 + 34, y, w / 2 - 70 - ((i * 37) % 60), 6);
  });
  const pg = B(1.04, 0.04, 0.72, pages); pg.position.set(0, 0.645, 0.01); pg.rotation.x = -0.25; g.add(pg);
  g.userData.top = 1.0;
  return g;
}
// Книга на поставка (за сравнението на двете конституции).
function standBook(year, cover) {
  const g = new THREE.Group();
  const leg = CY(0.04, 0.06, 0.7, col(0x3a3f44, { metal: 0.4, rough: 0.5 }), 8); leg.position.y = 0.35; g.add(leg);
  const top = B(0.6, 0.04, 0.45, col(0x3a3f44, { metal: 0.4, rough: 0.5 })); top.position.y = 0.76; top.rotation.x = 0.85; g.add(top);
  const bk = B(0.52, 0.06, 0.38, canvasMat(`cover${year}`, 256, 192, (ctx, w, h) => {
    ctx.fillStyle = cover; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d8b23a'; ctx.lineWidth = 6; ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#f2e3b0'; ctx.textAlign = 'center'; ctx.font = 'bold 28px Georgia, serif'; ctx.fillText('КОНСТИТУЦИЯ', w / 2, 82);
    ctx.font = 'bold 40px Georgia, serif'; ctx.fillText(String(year), w / 2, 138);
  }));
  bk.position.set(0, 0.79, 0.045); bk.rotation.x = 0.85; g.add(bk);
  g.userData.top = 1.0;
  return g;
}
// Свитък със закон.
function scroll() {
  const g = new THREE.Group();
  const paper = col(0xf6eed8);
  const sheet = B(0.5, 0.36, 0.01, canvasMat('lawsheet', 256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#f6eed8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a2a1a'; ctx.textAlign = 'center'; ctx.font = 'bold 26px Georgia, serif'; ctx.fillText('ЗАКОН', w / 2, 40);
    ctx.font = '18px Georgia, serif'; ctx.fillText('за парковете', w / 2, 66);
    ctx.fillStyle = 'rgba(40,30,20,0.5)'; for (let y = 86, i = 0; y < h - 16; y += 14, i++) ctx.fillRect(26, y, w - 52 - ((i * 29) % 50), 5);
  }, { side: THREE.DoubleSide }));
  g.add(sheet);
  for (const s of [-1, 1]) { const r = CY(0.03, 0.03, 0.56, paper, 10); r.rotation.z = Math.PI / 2; r.position.y = s * 0.19; g.add(r); }
  return g;
}
// „Държавен вестник“.
function gazette() {
  const g = new THREE.Group();
  const m = canvasMat('gazette', 256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1b2a3a'; ctx.textAlign = 'center'; ctx.font = 'bold 26px Georgia, serif'; ctx.fillText('ДЪРЖАВЕН', w / 2, 36); ctx.fillText('ВЕСТНИК', w / 2, 64);
    ctx.fillRect(16, 76, w - 32, 3);
    ctx.fillStyle = 'rgba(30,30,30,0.5)'; for (let y = 92, i = 0; y < h - 12; y += 12, i++) { ctx.fillRect(16, y, w / 2 - 24, 4); ctx.fillRect(w / 2 + 8, y, w / 2 - 24 - ((i * 13) % 30), 4); }
  }, { side: THREE.DoubleSide });
  const p = B(0.46, 0.012, 0.34, m); g.add(p);
  return g;
}
// Урна за гласуване.
function ballotBox() {
  const g = new THREE.Group();
  const t = new THREE.MeshStandardMaterial({ color: 0xdfeaf2, transparent: true, opacity: 0.55, roughness: 0.1 });
  const b = B(0.5, 0.5, 0.4, t); b.position.y = 0.6; g.add(b);
  const lid = B(0.54, 0.04, 0.44, col(0x2f6fbf)); lid.position.y = 0.87; g.add(lid);
  const tbl = B(0.9, 0.04, 0.6, col(0x8a5a32)); tbl.position.y = 0.33; g.add(tbl);
  for (const [x, z] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) { const l = B(0.04, 0.33, 0.04, col(0x5a3a22)); l.position.set(x, 0.165, z); g.add(l); }
  return g;
}

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Властите в София', 'Пътят на един закон', 'Власти, права и задължения', 'Извор и предсказание'] });
  const stage = createStage(shell.stageEl, { background: 0xcfe3f2, camPos: [0, 9, 16], target: [0, 1, -2], minDistance: 2, maxDistance: 40, maxPolarAngle: Math.PI * 0.47 });
  const { scene } = stage;
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const narrow = aspect < 1;
  const view = (pos, tgt, dur = 1, k = far) => { stage.stopFollow(); stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur); };
  scene.fog = new THREE.Fog(0xcfe3f2, 40, 90);
  const named = {};
  const add = (obj, x, z, ry = 0, s = 1, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; obj.scale.setScalar(s); scene.add(obj); obj.updateMatrixWorld(true); return obj; };
  const marker = (id, parent, y) => { const o = new THREE.Object3D(); o.position.set(0, y, 0); parent.add(o); named[id] = o; return o; };
  const flags = [];

  // ---------- земя, площад, булевард ----------
  const grass = B(90, 0.1, 90, col(0x7fa35a, { rough: 1 })); grass.position.y = -0.05; scene.add(grass);
  const square = B(22, 0.04, 15, CM('paving', { rep: [14, 10] })); square.position.set(0, 0.02, -1.5); scene.add(square);
  const road = B(60, 0.03, 2.0, col(0x4a4c50, { rough: 0.9 })); road.position.set(0, 0.025, 7.0); scene.add(road);
  for (let x = -29; x < 30; x += 1.6) { const d = B(0.8, 0.01, 0.06, col(0xf2f2f2)); d.position.set(x, 0.045, 7.0); scene.add(d); }
  const walk = B(60, 0.05, 0.6, col(0xb9b3a8)); walk.position.set(0, 0.025, 5.75); scene.add(walk);
  const mt = vitosha({ w: 80, d: 18, h: 8 }); mt.position.set(0, 0, -36); scene.add(mt);
  for (const [x, z] of [[-11, 4], [11, 4], [-12.5, -3], [12.5, -3], [-11, -9], [11, -9], [-7, 4.6], [7, 4.6], [-15, 1], [15, 1]]) add(mergeStatic(leafTree(1.5)), x, z);
  for (const x of [-9, -4.5, 4.5, 9]) add(ms(streetLamp({ modern: true }), ['glass']), x, 5.3, 0, 1.6);
  for (const x of [-6.5, 6.5]) add(ms(bench()), x, 4.6, Math.PI, 1.6);
  const clouds = [];
  for (const [x, y, z] of [[-14, 13, -22], [6, 15, -28], [18, 12, -18]]) { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(2); scene.add(c); clouds.push(c); }

  // ---------- сградите ----------
  const S = 1.5;
  const nsRaw = parliament({ w: 3.0, d: 1.3 }); flags.push(nsRaw.userData.flag);
  const NS = add(ms(nsRaw, ['flag']), -6.6, -1.8, 0.5, S); NS.userData.pickId = 'ns';
  const tsar = add(mergeStatic(tsarMonument()), -4.5, 1.6, 0.5, 1.6);
  const msRaw = stateBuilding({ w: 3.4, d: 1.3, h: 1.9, color: 0xe2d7bf }); flags.push(msRaw.userData.flag);
  const MS = add(ms(msRaw, ['flag']), 0, -6.0, 0, S); MS.userData.pickId = 'ms';
  const ctRaw = courtPalace(); flags.push(ctRaw.userData.flag);
  const CT = add(ms(ctRaw, ['flag']), 6.6, -1.8, -0.5, S); CT.userData.pickId = 'court';
  const prRaw = stateBuilding({ w: 2.2, d: 1.1, h: 1.5, color: 0xece3cf }); flags.push(prRaw.userData.flag);
  const PR = add(ms(prRaw, ['flag']), -4.6, -7.0, 0.25, S); PR.userData.pickId = 'pres';
  const CC = add(mergeStatic(constCourt()), 4.6, -7.0, -0.25, 1.3); CC.userData.pickId = 'cc';
  const BOOK = add(mergeStatic(bookMonument()), 0, 0.2, 0, 1.2); BOOK.userData.pickId = 'book';
  addHitBox(BOOK, 1.2);
  const guards = [];
  for (const s of [-1, 1]) { const gd = guard(); const p = new THREE.Vector3(s * 0.5, 0, 1.15).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.25).multiplyScalar(S).add(PR.position); add(gd, p.x, p.z, 0.25, 1.3); guards.push(gd); }
  const tops = { ns: nsRaw.userData.top * S, ms: msRaw.userData.top * S, court: ctRaw.userData.top * S, pres: prRaw.userData.top * S, cc: 1.9 * 1.3, book: 1.3 };
  const bldg = { ns: NS, ms: MS, court: CT, pres: PR, cc: CC, book: BOOK };
  for (const [id, o] of Object.entries(bldg)) {
    const m = new THREE.Object3D(); m.position.set(o.position.x, tops[id] + 0.1, o.position.z); scene.add(m); named[id] = m;
  }
  const LBL = { ns: 'Народно събрание', ms: 'Министерски съвет', court: 'Съдебна палата', pres: 'Президентство', cc: 'Конституционен съд' };
  const labels = {};
  for (const [id, text] of Object.entries(LBL)) {
    const l = labelSprite(text, { size: 0.42 }); l.position.copy(named[id].position); l.position.y += 0.15; scene.add(l); stage.steadyLabel(l, 16); labels[id] = l;
  }
  // Пленарната зала — на мястото на Народното събрание, когато се гласува.
  const HALL = add(plenaryHall(), NS.position.x, NS.position.z + 0.3, 0.5, S); HALL.visible = false; HALL.userData.pickId = 'ns';
  const showHall = (on) => { HALL.visible = on; NS.visible = !on; };
  named.board = new THREE.Object3D(); named.board.position.set(0, 1.1, -1.3); HALL.add(named.board);

  // ---------- хора и коли ----------
  const kinds = ['man', 'woman', 'kid', 'tourist', 'woman', 'man', 'kid', 'man', 'woman', 'tourist'];
  const citizens = kinds.map((k, i) => {
    const p = cityPerson(k);
    const x = -5 + (i % 5) * 2.5 + (i > 4 ? 1.2 : 0), z = i > 4 ? 3.6 : 2.4;
    p.scale.multiplyScalar(1.15);
    add(p, x, z, 0, p.scale.x); return p;
  });
  wander(stage, citizens, { r: 0.45, speed: 0.2 });
  named.people = new THREE.Object3D(); named.people.position.set(-2.5, 1.4, 2.6); scene.add(named.people);
  const PEOPLE_HIT = new THREE.Mesh(new THREE.BoxGeometry(11, 1.2, 2.6), new THREE.MeshBasicMaterial({ visible: false }));
  PEOPLE_HIT.position.set(0, 0.6, 3.0); PEOPLE_HIT.userData.pickId = 'people'; scene.add(PEOPLE_HIT);
  named.sofia = new THREE.Object3D(); named.sofia.position.set(0, 4.5, -14); scene.add(named.sofia);
  const cars = [];
  [[0x3a6ac0, 0], [0xc0392b, 1], [0xf2f2f2, 0], [0x2f8f5a, 1], [0xe6b23a, 0]].forEach(([c, lane], i) => {
    const k = car(c); k.scale.setScalar(0.24); k.userData.lane = lane; k.userData.off = i * 12; scene.add(k); cars.push(k);
  });
  // Съдиите на Конституционния съд (появяват се в стъпка 2).
  const judges = [];
  for (let i = 0; i < 12; i++) {
    const j = judge(); const a = -0.9 + (1.8 * i) / 11;
    const p = new THREE.Vector3(Math.sin(a) * 1.6, 0, 1.3 + Math.cos(a) * 0.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.25).add(CC.position);
    add(j, p.x, p.z, -0.25, 1.15); j.visible = false; judges.push(j);
  }

  // ---------- подвижни предмети ----------
  const LAW = scroll(); LAW.visible = false; LAW.scale.setScalar(1.4); scene.add(LAW);
  const lawLbl = labelSprite('Законопроект', { size: 0.26 }); lawLbl.position.y = 0.42; LAW.add(lawLbl);
  const setLawLabel = (t) => { LAW.remove(LAW.userData.lbl || lawLbl); const l = labelSprite(t, { size: 0.2 }); l.position.y = 0.4; LAW.add(l); stage.steadyLabel(l, 14); LAW.userData.lbl = l; };
  LAW.userData.lbl = lawLbl;
  const papers = [];
  for (let i = 0; i < 6; i++) { const p = gazette(); p.visible = false; p.scale.setScalar(1.4); scene.add(p); papers.push(p); }
  const URN = add(ballotBox(), 2.6, 2.2, 0, 1.4); URN.visible = false;
  const ballots = [];
  for (let i = 0; i < 6; i++) { const b = B(0.12, 0.01, 0.16, col(0xffffff)); b.visible = false; scene.add(b); ballots.push(b); }
  const BOOKS = new THREE.Group(); scene.add(BOOKS); BOOKS.visible = false;
  const b1879 = standBook(1879, '#6a1e18'); b1879.position.set(-1.6, 0, 2.4); b1879.scale.setScalar(1.5); BOOKS.add(b1879);
  const b1991 = standBook(1991, '#1e3a6a'); b1991.position.set(1.6, 0, 2.4); b1991.scale.setScalar(1.5); BOOKS.add(b1991);
  named.books = new THREE.Object3D(); named.books.position.set(0, 2.0, 2.4); scene.add(named.books);

  // ---------- живот в сцената ----------
  let hallVote = false;
  stage.tick((dt, t) => {
    flags.forEach((c, i) => { if (c) c.rotation.y = Math.sin(t * 2 + i) * 0.28; });
    clouds.forEach((c, i) => { c.position.x = ((c.userData.x0 ??= c.position.x) + t * (0.25 + i * 0.05) + 40) % 80 - 40; });
    cars.forEach((k) => {
      const dir = k.userData.lane ? -1 : 1;
      const x = ((k.userData.off + t * 2.2) % 56) - 28;
      k.position.set(dir * x, 0.04, 7.0 + (k.userData.lane ? -0.45 : 0.45));
      k.rotation.y = dir > 0 ? 0 : Math.PI;
      k.userData.wheels.forEach((w) => { w.rotation.z -= dt * 9; });
    });
    guards.forEach((gd, i) => { gd.position.y = Math.abs(Math.sin(t * 0.6 + i)) * 0.004; });
    judges.forEach((j, i) => { if (j.visible) j.rotation.y = -0.25 + Math.sin(t * 0.8 + i) * 0.1; });
    if (HALL.visible) HALL.userData.chair.rotation.y = Math.sin(t * 0.7) * 0.4;
  });

  // ---------- общи помощници ----------
  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.3, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let clickHandler = null, stopDrag = null, menu = null;
  const extra = [];
  const runs = new Set();
  function run(fn) {
    const off = stage.tick((dt, t) => { if (fn(dt, t)) { off(); runs.delete(off); } });
    runs.add(off); return off;
  }
  const cancelRuns = () => { runs.forEach((o) => o()); runs.clear(); };
  const later = (sec, fn) => { let k = 0; run((dt) => { k += dt; if (k >= sec) { fn(); return true; } return false; }); };
  function fly(obj, to, dur, done, arc = 1) {
    const from = obj.position.clone(); let k = 0;
    run((dt) => {
      k = Math.min(1, k + dt / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      obj.position.lerpVectors(from, to, e); obj.position.y += Math.sin(Math.PI * e) * arc;
      if (k >= 1) { if (done) done(); return true; }
      return false;
    });
  }
  const front = (o, d = 2.2, y = 0.9) => new THREE.Vector3(Math.sin(o.rotation.y) * d, y, Math.cos(o.rotation.y) * d).add(o.position);
  // Изглед отпред към сграда.
  const faceView = (o, dist, h, ty, k = Math.min(far, 1.7)) => {
    const p = o.position, ry = o.rotation.y;
    view([p.x + Math.sin(ry) * dist, h, p.z + Math.cos(ry) * dist], [p.x, ty, p.z], 1, k);
  };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  stage.onHover(() => {});
  const MAIN = [[0, 9, 16], [0, 1, -2]];
  const nextBtn = (label, fn) => { const c = shell.setControls(`<button class="btn primary">${label}</button>`); c.querySelector('button').addEventListener('click', fn); };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    view(...MAIN);
    shell.task('София днес. Тук са сградите на властите в България. Разгледай всичко от менюто или кликни в сцената.');
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${SPOTS.length}`);
    const seen = new Set();
    const open = (id) => {
      const s = SPOTS.find((x) => x.id === id);
      if (!s) return;
      if (bldg[id]) faceView(bldg[id], id === 'book' ? 4.5 : id === 'court' ? 10 : 7.5, id === 'book' ? 3.0 : id === 'court' ? 5 : 4.2, id === 'book' ? 1.0 : 1.6);
      else if (id === 'people') view([0, 3.2, 9.5], [0, 0.6, 2.8], 1, Math.min(far, 1.5));
      else view([0, 6, 12], [0, 3, -16], 1, 1);
      say(named[id], `<b>${esc(s.label)}</b><br>${s.note}`, { cls: 'wide', lift: 0.2 });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${SPOTS.length}`);
      if (seen.size === SPOTS.length) nextBtn('Напред →', () => { menu.show(false); clearTip(); step2(); });
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: SPOTS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })), onSelect: open });
    clickHandler = open;
  }

  // ---------- 2. Пътят на един закон ----------
  let mistakes2 = 0;
  function step2() {
    shell.step(1);
    shell.score('');
    mistakes2 = 0;
    clickHandler = null;
    view(...MAIN);
    LAW.visible = true; setLawLabel('Законопроект');
    LAW.position.copy(front(MS, 2.4, 1.2));
    say(LAW, 'Министерският съвет е подготвил <b>законопроект</b> — „Закон за парковете“. <span class="small">Примерът е измислен, за да видиш как работи държавата.</span>', { cls: 'wide', lift: 0.5 });
    shell.task('Законопроектът е готов. <b>Къде трябва да отиде, за да стане закон?</b> Кликни сградата.');
    shell.setControls('');
    let busy = false;
    clickHandler = (id) => {
      if (busy || !id || id === 'sofia') return;
      if (id !== 'ns') { mistakes2++; shell.msg(LAW_WRONG1[id] + (mistakes2 >= 2 ? ' Подсказка: законите се гласуват от депутатите.' : ''), 'bad'); return; }
      busy = true; clickHandler = null;
      shell.msg('Да! Законите се обсъждат и приемат в Народното събрание.', 'good');
      clearTip();
      fly(LAW, front(NS, 2.4, 1.6), 1.6, () => { later(0.3, voting); }, 1.6);
    };
  }
  function voting() {
    showHall(true);
    HALL.userData.clear();
    LAW.position.set(HALL.position.x, 2.2, HALL.position.z); LAW.visible = false;
    faceView(HALL, 5.8, 5.0, 0.0, Math.min(far, 1.5));
    let passed = 0;
    shell.task('Залата на Народното събрание. Присъстват всички 240 депутати. <b>Избери колко гласуват „за“ и натисни „Гласувай“.</b> Опитай с различни числа.');
    const c = shell.setControls(`<div style="display:flex;flex-direction:column;gap:8px">
      <label>Гласуват „за“: <b class="vn">100</b> от 240</label>
      <input type="range" class="vote" min="0" max="240" step="1" value="100" aria-label="Гласуват за">
      <button class="btn primary go">Гласувай</button></div>`);
    const inp = c.querySelector('.vote'), vn = c.querySelector('.vn');
    inp.addEventListener('input', () => { vn.textContent = inp.value; });
    say(named.board, 'Тук ще видиш резултата от гласуването.', { lift: 0.2 });
    c.querySelector('.go').addEventListener('click', () => {
      const f = +inp.value, a = Math.round((240 - f) * 0.7), ab = 240 - f - a;
      HALL.userData.setVotes(f, a, ab);
      if (f <= 120) {
        shell.msg(`Законът не е приет. „За“ трябва да са повече от половината от присъстващите — поне 121 от 240. Сега са ${f}.`, 'bad');
        say(named.board, `<b>Не е приет.</b> ${f} гласа „за“ не стигат. Нужни са поне 121.`, { cls: 'bad', lift: 0.2 });
        return;
      }
      passed++;
      if (passed === 1) {
        shell.msg('Приет на първо гласуване!', 'good');
        say(named.board, `<b>Първо гласуване: приет</b> с ${f} гласа „за“.<br>Законите се гласуват два пъти, на отделни заседания. <b>Гласувай пак</b> — това е второто гласуване.`, { cls: 'good wide', lift: 0.2 });
        c.querySelector('.go').textContent = 'Второ гласуване';
        return;
      }
      shell.msg('Приет и на второ гласуване. Законът е приет!', 'good');
      say(named.board, `<b>Второ гласуване: приет.</b> Народното събрание прие закона. <span class="small">Залата е условна възстановка.</span>`, { cls: 'good wide', lift: 0.2 });
      nextBtn('Напред →', () => { clearTip(); promulgate(); });
    });
  }
  function promulgate() {
    showHall(false);
    view(...MAIN);
    LAW.visible = true; setLawLabel('Приет закон');
    LAW.position.copy(front(NS, 2.4, 1.4));
    shell.task('Законът е приет. <b>Кой трябва да го обнародва, за да започне да важи?</b> Кликни сградата.');
    shell.setControls('');
    let busy = false;
    clickHandler = (id) => {
      if (busy || !id || id === 'sofia') return;
      if (id !== 'pres') { mistakes2++; shell.msg(LAW_WRONG2[id] + (mistakes2 >= 2 ? ' Подсказка: това е държавният глава.' : ''), 'bad'); return; }
      busy = true; clickHandler = null;
      shell.msg('Да! Президентът обнародва законите.', 'good');
      fly(LAW, front(PR, 2.2, 1.6), 1.6, () => {
        say(named.pres, 'Президентът издава указ. Законът се обнародва в „Държавен вестник“. Така всеки може да го прочете.', { cls: 'wide', lift: 0.2 });
        papers.forEach((p, i) => {
          p.visible = true; p.position.copy(front(PR, 2.0, 1.5)); p.rotation.set(0, 0, 0);
          const cz = citizens[i * 1 % citizens.length].position;
          later(0.6 + i * 0.25, () => fly(p, new THREE.Vector3(cz.x, 1.25, cz.z), 1.4, null, 1.4));
        });
        later(3.4, () => nextBtn('Напред →', () => { clearTip(); review(); }));
      }, 1.2);
    };
  }
  function review() {
    papers.forEach((p) => { p.visible = false; });
    LAW.position.copy(front(PR, 2.2, 1.6)); setLawLabel('Закон за парковете');
    view([0.5, 7, 6], [3.0, 1.2, -6.0], 1, Math.min(far, 1.4));
    say(LAW, 'В закона има текст: <b>„В парка не могат да се събират повече от трима души.“</b><br>48 депутати — една пета от всички — смятат, че този текст нарушава Конституцията.', { cls: 'wide', lift: 0.5 });
    shell.task('<b>Кой решава дали законът е в съгласие с Конституцията?</b> Кликни сградата.');
    shell.setControls('');
    let busy = false;
    clickHandler = (id) => {
      if (busy || !id || id === 'sofia') return;
      if (id !== 'cc') { mistakes2++; shell.msg(LAW_WRONG3[id] + (mistakes2 >= 2 ? ' Подсказка: този съд пази Конституцията.' : ''), 'bad'); return; }
      busy = true; clickHandler = null;
      shell.msg('Да! Това решава Конституционният съд.', 'good');
      clearTip();
      faceView(CC, 6.5, 3.6, 1.0, Math.min(far, 1.6));
      fly(LAW, front(CC, 1.0, 2.0), 1.6, () => {
        judges.forEach((j, i) => { j.visible = true; j.position.y = 0; j.scale.setScalar(0.01); const s0 = 1.15; let k = 0; later(i * 0.08, () => run((dt) => { k = Math.min(1, k + dt * 3); j.scale.setScalar(0.01 + (s0 - 0.01) * k); return k >= 1; })); });
        later(1.6, () => {
          setLawLabel('Текстът е противоконституционен');
          say(LAW, '<b>Решение:</b> <s>„В парка не могат да се събират повече от трима души.“</s><br>Конституцията казва, че гражданите могат да се събират мирно и без оръжие. Затова съдът обявява този текст за <b>противоконституционен</b>. Той вече не се прилага. Останалата част от закона важи.<br><span class="small">Съдиите и сградата са условна възстановка.</span>', { cls: 'good wide', lift: 0.5 });
          nextBtn('Напред →', () => {
            say(named.book, '<b>Това е разделението на властите.</b> Една власт приема законите, друга ги изпълнява, трета съди. Никоя не може сама да прави всичко — те се проверяват една друга. А всички трябва да спазват Конституцията.', { cls: 'good wide', lift: 0.2 });
            view(...MAIN);
            scores.push(stepScore(mistakes2, 3));
            nextBtn('Напред →', () => { clearTip(); step3(); });
          });
        });
      }, 1.2);
    };
  }

  // ---------- 3. Приложи ----------
  function step3() {
    shell.step(2);
    shell.score('');
    LAW.visible = false;
    judges.forEach((j) => { j.visible = false; });
    view(...MAIN);
    let mistakes = 0, k = 0;
    const ask = () => {
      const p = POWERS[k];
      shell.task(`Чия е тази роля? <b>„${esc(p.label)}“</b> — ${esc(p.why.toLowerCase())}. Кликни сградата.`);
      shell.score(`Свързани: ${k} от ${POWERS.length}`);
    };
    ask();
    clickHandler = (id) => {
      if (!id || id === 'sofia' || k >= POWERS.length) return;
      const p = POWERS[k];
      if (id !== p.id) {
        mistakes++;
        shell.msg((POWER_WRONG[id] || 'Не е тази сграда.') + (mistakes >= 2 ? ' Подсказка: виж надписите над сградите.' : ''), 'bad');
        return;
      }
      const b = labelSprite(p.label, { size: 0.36, color: '#ffffff', bg: p.color, border: p.color });
      b.position.copy(named[id].position); b.position.y += 0.75; scene.add(b); stage.steadyLabel(b, 16); extra.push(b);
      shell.msg('Вярно!', 'good');
      k++;
      if (k < POWERS.length) ask();
      else {
        clickHandler = null;
        shell.score(`Свързани: ${k} от ${POWERS.length}`);
        say(named.book, 'Три власти и държавен глава. Конституцията казва кой какво прави.', { cls: 'good', lift: 0.2 });
        nextBtn('Към правата и задълженията →', () => { clearTip(); sortCards(mistakes); });
      }
    };
  }
  const zoneObjs = [];
  function sortCards(m0) {
    const Z0 = new THREE.Vector3(0, 0, 3.2);
    view([0, 6.2, 10.8], [0, 0, 2.4], 1, narrow ? Math.min(far, 1.5) : far);
    if (!zoneObjs.length) ZONES.forEach((z) => {
      const r = zoneRing(z.color, 1.15); r.position.set(Z0.x + z.dx, 0.03, Z0.z + z.dz); r.userData.zoneId = z.id;
      const l = labelSprite(z.label, { size: 0.32, color: '#ffffff', bg: z.css, border: z.css }); l.position.set(0, 0.35, -1.25); r.add(l);
      scene.add(r); zoneObjs.push(r);
    });
    zoneObjs.forEach((r) => { r.visible = true; });
    let mistakes = m0, i = 0, wrongHere = 0;
    const done = [];
    const spawn = () => {
      const c = CARDS[i];
      const g = new THREE.Group();
      const w = Math.max(1.6, c.label.length * 0.085 + 0.3);
      const b = B(w, 0.06, 0.5, col(0xfff4d6)); g.add(b);
      const e = B(w + 0.05, 0.04, 0.55, col(0x9a6a40)); e.position.y = -0.02; g.add(e);
      const l = labelSprite(c.label, { size: 0.26 }); l.position.y = 0.3; g.add(l);
      g.userData.dragId = c.id;
      addHitBox(g, 0.7);
      g.position.set(0, 0.12, 1.15); g.userData.home = g.position.clone();
      scene.add(g); extra.push(g);
      wrongHere = 0;
      shell.score(`Подредени: ${i} от ${CARDS.length}`);
      return g;
    };
    shell.task('Кое е <b>право</b>, кое е <b>задължение</b> на гражданите според Конституцията — и кое изобщо го няма в нея? <b>Завлечи картата в правилния кръг.</b>');
    shell.setControls('');
    let cur = spawn();
    stopDrag = stage.enableDrag({
      planeY: 0.12,
      onDrop(obj) {
        const c = CARDS.find((x) => x.id === obj.userData.dragId);
        const zone = zoneObjs.find((r) => Math.hypot(obj.position.x - r.position.x, obj.position.z - r.position.z) < 1.2);
        if (!zone) { obj.position.copy(obj.userData.home); return; }
        if (zone.userData.zoneId !== c.zone) {
          mistakes++; wrongHere++;
          obj.position.copy(obj.userData.home);
          const hint = wrongHere >= 2 ? (c.zone === 'z-right' ? ' Подсказка: това е свобода, която имаш.' : c.zone === 'z-duty' ? ' Подсказка: това е нещо, което си длъжен да правиш.' : ' Подсказка: Конституцията не казва такова нещо.') : '';
          shell.msg(CARD_WRONG[c.zone][zone.userData.zoneId].replace(/<[^>]+>/g, '') + hint, 'bad');
          return;
        }
        obj.userData.locked = true;
        const n = done.filter((d) => d === zone.userData.zoneId).length;
        done.push(zone.userData.zoneId);
        obj.position.set(zone.position.x + ((n % 2) - 0.5) * 0.25, 0.12 + n * 0.07, zone.position.z + 0.15 - n * 0.12);
        obj.scale.setScalar(0.7);
        shell.msg(c.ok, 'good');
        i++;
        if (i < CARDS.length) { cur = spawn(); return; }
        stopDrag(); stopDrag = null;
        shell.score(`Подредени: ${i} от ${CARDS.length}`);
        scores.push(stepScore(mistakes, 3));
        say(zoneObjs[1], 'Правата вървят заедно със задълженията. Конституцията пази свободата на всеки, но и иска всеки да спазва законите и да зачита другите.', { cls: 'good wide', lift: 1.0 });
        nextBtn('Напред →', () => { clearTip(); step4(); });
      },
    });
    void cur;
  }

  // ---------- 4. Извор и предсказание ----------
  function step4() {
    shell.step(3);
    shell.score('');
    zoneObjs.forEach((r) => { r.visible = false; });
    for (const o of extra) if (o.userData.dragId) o.visible = false;
    BOOKS.visible = true;
    view([0, 2.6, 6.4], [0, 1.2, 2.4], 1, narrow ? Math.min(far, 1.5) : far);
    let mistakes = 0, n = 0;
    shell.task('Изворът: две конституции една до друга — Търновската от 1879 г. и днешната от 1991 г. <span class="small">Текстът е преразказ на прост език, не е дословен.</span>');
    const show = () => {
      const c = COMPARE[n];
      say(named.books, `<b>${esc(c.t)}</b><br><span style="color:#6a1e18"><b>1879:</b></span> ${esc(c.a)}<br><span style="color:#1e3a6a"><b>1991:</b></span> ${esc(c.b)}<br><span class="small">Преразказ, не дословен текст.</span>`, { cls: 'wide', lift: 0.3 });
      shell.score(`Сравнени: ${n + 1} от ${COMPARE.length}`);
      n++;
      if (n < COMPARE.length) { const cc = shell.setControls('<button class="btn primary cmp">Следващо сравнение →</button>'); cc.querySelector('.cmp').addEventListener('click', show); }
      else nextBtn('Към предсказанието →', () => { clearTip(); predict1(); });
    };
    const c0 = shell.setControls('<button class="btn primary cmp">Отвори двете книги</button>');
    c0.querySelector('.cmp').addEventListener('click', show);

    function predict1() {
      shell.score('');
      BOOKS.visible = false;
      view([2, 4.5, 10], [1, 1, 1], 1, far);
      shell.task('През 1990 г. депутатите от Великото народно събрание избират Желю Желев за държавен глава. После идва новата Конституция. <b>Как ще бъде избран президентът през 1992 г.?</b>');
      ask(Q1, () => {
        URN.visible = true;
        ballots.forEach((b, i) => {
          const from = citizens[i % citizens.length].position;
          later(0.2 + i * 0.35, () => { b.visible = true; b.position.set(from.x, 0.9, from.z); fly(b, new THREE.Vector3(URN.position.x, 1.3, URN.position.z), 1.0, () => { b.visible = false; }, 0.8); });
        });
        say(URN, '<b>Точно така.</b> През януари 1992 г. за пръв път гражданите избират президента пряко. Избран е Желю Желев. Оттогава президентът се избира от гражданите за 5 години.', { cls: 'good wide', lift: 1.6 });
        nextBtn('Напред →', () => { clearTip(); URN.visible = false; predict2(); });
      });
    }
    function predict2() {
      view(...MAIN);
      LAW.visible = true; setLawLabel('Нов закон'); LAW.position.copy(front(PR, 2.2, 1.6));
      shell.task('Народното събрание прие нов закон. Президентът не е съгласен с него. <b>Какво може да направи според Конституцията?</b>');
      ask(Q2, () => {
        fly(LAW, front(NS, 2.4, 1.6), 1.6, () => {
          showHall(true);
          faceView(HALL, 5.8, 5.0, 0.0, Math.min(far, 1.5));
          HALL.userData.setVotes(140, 70, 30);
          LAW.visible = false;
          say(named.board, '<b>Да.</b> Президентът може да върне закона за ново обсъждане. Ако депутатите го приемат отново с повече от половината от <b>всички</b> народни представители — поне 121 гласа, президентът е длъжен да го обнародва. <span class="small">Примерът е измислен, правилото е от Конституцията.</span>', { cls: 'good wide', lift: 0.2 });
          const c = shell.setControls('<button class="btn primary">Виж резултата</button>');
          c.querySelector('button').addEventListener('click', () => {
            clearTip();
            showHall(false);
            scores.push(stepScore(mistakes, 2));
            shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart);
          });
        }, 1.4);
      });
    }
    function ask(list, onRight) {
      const c = shell.setControls(`<div style="display:flex;flex-direction:column;gap:8px">${list.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = list[+b.dataset.i];
        if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
        shell.msg('Вярно предсказание!', 'good');
        onRight();
      }));
    }
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    cancelRuns();
    clearTip();
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    zoneObjs.forEach((r) => { r.visible = false; });
    showHall(false); HALL.userData.clear();
    LAW.visible = false; URN.visible = false; BOOKS.visible = false;
    papers.forEach((p) => { p.visible = false; });
    ballots.forEach((b) => { b.visible = false; });
    judges.forEach((j) => { j.visible = false; });
    clickHandler = null;
    if (menu) menu.remove();
    step1();
  }

  step1();
  // За тестовете: екранни координати на именувана точка или на зона.
  const at = (name) => {
    const o = name.startsWith('z-') ? zoneObjs.find((r) => r.userData.zoneId === name) : name === 'card' ? extra.filter((e) => e.userData.dragId && !e.userData.locked).pop() : named[name];
    const v = o.getWorldPosition(new THREE.Vector3()).project(stage.camera);
    const r = stage.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  };
  container.__demo = { stage, at, cards: CARDS };
  void tsar;
  return { dispose() { if (stopDrag) stopDrag(); cancelRuns(); if (menu) menu.remove(); stage.dispose(); } };
}
