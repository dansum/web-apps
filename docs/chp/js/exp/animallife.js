// 4.3.2 „Дишане и развитие на животните“ — езеро до ливада и двор с ферма, а отзад — море с делфин.
// Стъпки: опознай животните → как дишат (хриле или бели дробове) и откъде е енергията → как се развиват → приложи и предскажи.
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (k) => Math.min(1, Math.max(0, k));

// ---------- стилове (само за този модул) ----------
function injectStyle() {
  if (document.getElementById('animallife-style')) return;
  const s = document.createElement('style');
  s.id = 'animallife-style';
  s.textContent = `
  .animallife-q { margin:10px 0 4px; font-weight:700; }
  .animallife-demos { display:grid; grid-template-columns:1fr; gap:6px; }
  .animallife-demos .btn.seen::after { content:" ✓"; color:#1fab54; font-weight:900; }
  .animallife-time { margin-top:4px; }
  .animallife-time label { font-weight:800; display:flex; justify-content:space-between; font-size:.9rem; }
  .animallife-range { width:100%; height:34px; accent-color:#1865f2; touch-action:pan-y; }
  .animallife-ends { display:flex; justify-content:space-between; font-size:.75rem; color:#5b6b7f; }
  .animallife-tabs { display:flex; gap:6px; margin-bottom:6px; }
  .animallife-tabs span { flex:1; text-align:center; border:2px solid #dfe5ee; border-radius:8px; padding:3px 2px; font-size:.8rem; font-weight:700; background:#fff; }
  .animallife-tabs span.cur { border-color:#1865f2; background:#eef4ff; }
  .animallife-tabs span.done { border-color:#1fab54; background:#e9f8ef; }
  .animallife-order { display:grid; gap:6px; margin-top:6px; }
  .animallife-order .choice b { min-width:1.4em; color:#1865f2; }
  .animallife-checks { display:grid; gap:6px; }
  .animallife-checks label { display:flex; gap:8px; align-items:center; border:2px solid #dfe5ee; border-radius:8px; padding:7px 9px; background:#fff; cursor:pointer; }
  .animallife-checks label.right { border-color:#1fab54; background:#e9f8ef; }
  .animallife-checks input { width:20px; height:20px; }
  `;
  document.head.appendChild(s);
}

// ---------- данни ----------
const ANIMALS = [
  { id: 'fish', label: 'Риба', icon: '🐟',
    note: 'Рибата живее само във водата и <b>диша с хриле</b>. Хрилете поемат кислорода, разтворен във водата. Рибата снася много малки яйца във водата — <b>хайвер</b>.' },
  { id: 'tadpole', label: 'Попова лъжичка', icon: '💧',
    note: 'Това е <b>ларва на жабата</b> — малкото на жабата, което живее във водата. Тя плува с опашка и <b>диша с хриле</b> като рибите.' },
  { id: 'frog', label: 'Жаба', icon: '🐸',
    note: 'Възрастната жаба живее във водата и на сушата. Тя <b>диша с бели дробове</b> и през влажната си кожа. Жабата <b>снася хайвер</b> във водата.' },
  { id: 'duck', label: 'Патица', icon: '🦆',
    note: 'Патицата плува, но е птица и <b>диша въздух с бели дробове</b>. Тя <b>снася яйца</b> и ги мъти в гнездо.' },
  { id: 'horse', label: 'Кон', icon: '🐴',
    note: 'Конят е <b>бозайник</b>. Така наричаме животните, които хранят малките си с мляко. Конят <b>диша с бели дробове</b>. Кобилата <b>ражда</b> малко конче.' },
  { id: 'cat', label: 'Котка с котенца', icon: '🐱',
    note: 'Котката <b>ражда котенца</b> и ги храни със своето мляко — котенцата сучат. Котката <b>диша с бели дробове</b>. Виж как коремът ѝ се повдига при всяко вдишване.' },
  { id: 'hen', label: 'Кокошка с пиленца', icon: '🐔',
    note: 'Кокошката <b>снася яйца</b>. Тя мъти яйцето около три седмици и от него се излюпва пиленце. Кокошката <b>диша с бели дробове</b>.' },
  { id: 'butterfly', label: 'Пеперуда', icon: '🦋',
    note: 'Пеперудата е насекомо. Тя <b>снася яйца</b> по листата. От яйцето излиза гъсеница. Тя става <b>какавида</b> — неподвижна обвивка, в която тялото ѝ се променя. От какавидата излиза пеперуда. Насекомите дишат през малки отвори по тялото си.' },
];
const AN = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));

const POND = { x: -4, z: -1, rx: 3, rz: 2 };
const YARD = { x0: 2.8, x1: 8.6, z0: -3, z1: 2.8 };
const LIFE = {
  horse: { home: [6.4, -1.3], r: 1.3, speed: 0.55, graze: true },
  hen: { home: [4.0, 1.3], r: 1.0, speed: 0.4, peck: true },
  cat: { home: [7.3, 1.4], r: 0.8, speed: 0.3 },
};

// Сортиране в стъпка 2 и 3.
const SORT_BREATH = {
  bins: ['Хриле', 'Бели дробове'], colors: [0x1e88e5, 0xe53962], css: ['#1e88e5', '#e53962'],
  items: [
    { id: 'fish', bin: 0, why: 'Рибата не може да диша въздух. Спомни си през какво минаваше водата зад главата ѝ.' },
    { id: 'tadpole', bin: 0, why: 'Поповата лъжичка още живее само във водата и не може да диша въздух. Спомни си розовите пискюли на главата ѝ — това са хрилете на малката попова лъжичка.' },
    { id: 'frog', bin: 1, why: 'Това е възрастна жаба. Тя излиза на сушата и диша въздух. Хриле имаше, докато беше попова лъжичка.' },
    { id: 'duck', bin: 1, why: 'Патицата плува, но главата ѝ е над водата. Тя е птица и диша въздух.' },
    { id: 'horse', bin: 1, why: 'Конят живее на сушата и диша въздух през ноздрите. Спомни си как се повдигаха гърдите му.' },
    { id: 'cat', bin: 1, why: 'Котката живее на сушата и диша въздух. Виж как коремът ѝ се повдига при всяко вдишване.' },
    { id: 'hen', bin: 1, why: 'Кокошката е птица, живее на сушата и диша въздух.' },
  ],
};
const SORT_BIRTH = {
  bins: ['Снасят яйца', 'Раждат малки'], colors: [0xf09a1a, 0x8e44ad], css: ['#e08600', '#8e44ad'],
  items: [
    { id: 'hen', bin: 0, why: 'Кокошката не ражда пиленца. Спомни си откъде излезе пиленцето.' },
    { id: 'duck', bin: 0, why: 'Патицата е птица като кокошката. Помисли какво мъти тя в гнездото си.' },
    { id: 'fish', bin: 0, why: 'Помисли какво е хайверът на рибата.' },
    { id: 'frog', bin: 0, why: 'Спомни си как започна развитието на жабата — с какво във водата?' },
    { id: 'butterfly', bin: 0, why: 'Пеперудата е насекомо. Помисли какво оставя тя по листата, от което после излизат гъсеници.' },
    { id: 'horse', bin: 1, why: 'Конят е бозайник като котката. Малкото конче расте в корема на майка си и после суче мляко.' },
    { id: 'cat', bin: 1, why: 'Спомни си какво видя: котенцата растат в корема на котката и после сучат мляко.' },
  ],
};

// Развитие (стъпка 3): етапи по „време“ k от 0 до 1.
const CYCLES = [
  { id: 'hen', name: 'Кокошка', icon: '🐔', stages: [
    { to: 0.36, t: 'Яйце', d: 'Кокошката снася яйце и го мъти около три седмици. Вътре расте малко пиленце.' },
    { to: 0.5, t: 'Пиленцето се излюпва', d: 'Пиленцето пробива черупката с човката си и се излюпва.' },
    { to: 0.72, t: 'Пилето расте', d: 'Пилето кълве зрънца и расте.' },
    { to: 1.01, t: 'Кокошка', d: 'Пилето порасна и стана кокошка. Тя също ще снася яйца.' },
  ] },
  { id: 'frog', name: 'Жаба', icon: '🐸', stages: [
    { to: 0.22, t: 'Хайвер', d: 'Жабата снася във водата много яйца, обвити в желе. Това е хайверът.' },
    { to: 0.48, t: 'Попова лъжичка', d: 'От всяко яйце излиза попова лъжичка. Тя живее във водата и диша с хриле.' },
    { to: 0.76, t: 'Попова лъжичка с крачета', d: 'Поповата лъжичка расте. Появяват се крачета, а в тялото ѝ се развиват бели дробове. Хрилете изчезват.' },
    { to: 1.01, t: 'Жаба', d: 'Опашката изчезва. Малката жаба излиза на сушата и диша с бели дробове.' },
  ] },
  { id: 'cat', name: 'Котка', icon: '🐱', stages: [
    { to: 0.25, t: 'Котенцата растат в корема на майката', d: 'Котенцата растат в корема на котката. Те не са в яйца.' },
    { to: 0.45, t: 'Котката ражда котенца', d: 'Котката ражда няколко малки, слепи котенца.' },
    { to: 0.7, t: 'Котенцата сучат мляко', d: 'Котенцата сучат мляко от майка си. Така се хранят първите седмици.' },
    { to: 1.01, t: 'Котенцата растат', d: 'Котенцата растат, играят и постепенно стават големи котки.' },
  ] },
];
const stageIdx = (cyc, k) => cyc.stages.findIndex((s) => k < s.to);

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
  g.userData.body = body;
  if (o.belly) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(o.r * 0.85, 16, 12), mat(o.belly));
    b.scale.set(1.6, 0.7, 0.9);
    b.position.set(0, o.legLen + o.r * 0.45, 0);
    g.add(b);
    g.userData.belly = b;
  }
  const head = new THREE.Group();
  head.position.set(o.len / 2 + o.r * 0.9, o.legLen + o.r * (1.4 + (o.neck || 0)), 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(o.headR, 16, 12), bodyM));
  if (o.snout) {
    const sn = new THREE.Mesh(new THREE.CylinderGeometry(o.headR * 0.35, o.headR * 0.55, o.snout, 10), mat(o.snoutColor || o.color));
    sn.rotation.z = -Math.PI / 2;
    sn.position.x = o.headR * 0.7 + o.snout / 2 - 0.05;
    sn.position.y = -o.headR * 0.2;
    head.add(sn);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(o.headR * 0.22, 8, 6), mat(o.noseColor || 0x222222));
    nose.position.set(o.headR * 0.7 + o.snout, -o.headR * 0.2, 0);
    head.add(nose);
  }
  const eyeM = mat(0x111111);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(o.headR * 0.13, 8, 6), eyeM);
    e.position.set(o.headR * 0.65, o.headR * 0.25, s * o.headR * 0.5);
    head.add(e);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(o.headR * 0.3, o.headR * 0.7, 6), bodyM);
    ear.position.set(-o.headR * 0.1, o.headR * 0.85, s * o.headR * 0.45);
    head.add(ear);
  }
  g.add(head);
  g.userData.head = head;
  if (o.neck) {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(o.r * 0.45, o.r * 0.6, o.neck * o.r * 1.6, 10), bodyM);
    neck.position.set(o.len / 2 + o.r * 0.55, o.legLen + o.r * (0.9 + o.neck * 0.6), 0);
    neck.rotation.z = -0.5;
    g.add(neck);
    if (o.mane) {
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.08, o.neck * o.r * 1.7, 0.07), mat(o.mane));
      mane.position.set(o.len / 2 + o.r * 0.35, o.legLen + o.r * (1.15 + o.neck * 0.6), 0);
      mane.rotation.z = -0.5;
      g.add(mane);
    }
  }
  const t = new THREE.Mesh(new THREE.ConeGeometry(o.r * (o.tailR || 0.35), o.r * (o.tailL || 1.8), 8), mat(o.tailColor || o.color));
  t.position.set(-o.len / 2 - o.r * 0.9, o.legLen + o.r * 1.1, 0);
  t.rotation.z = 2.1;
  g.add(t);
  g.userData.tail = t;
  legs(g, o.legColor || o.color, { len: o.legLen, r: o.r * 0.22, spreadX: o.len * 0.45, spreadZ: o.r * 0.5 });
  return g;
}

function lungsFor(g, pts, r) {
  const lm = new THREE.MeshStandardMaterial({ color: 0xff7aa2, emissive: 0xff3d7f, emissiveIntensity: 0.35, roughness: 0.6, depthTest: false, transparent: true, opacity: 0.95 });
  const grp = new THREE.Group();
  for (const p of pts) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), lm);
    l.scale.set(1.4, 1, 0.75);
    l.position.set(...p);
    l.renderOrder = 4;
    l.userData.keep = true;
    grp.add(l);
  }
  grp.visible = false;
  g.add(grp);
  g.userData.lungs = grp;
}

function horseModel() {
  const g = quadruped({ color: 0x8a5530, belly: 0xa06a44, r: 0.3, len: 0.8, legLen: 0.75, headR: 0.17, neck: 1.6, snout: 0.26,
    snoutColor: 0x6b3f22, legColor: 0x5a361d, tailColor: 0x3b2414, tailR: 0.4, tailL: 2.2, mane: 0x3b2414 });
  lungsFor(g, [[0.12, 1.06, 0.11], [0.12, 1.06, -0.11]], 0.13);
  return g;
}
function catModel(color = 0xf0a040, belly = 0xffe2b8) {
  const g = quadruped({ color, belly, r: 0.13, len: 0.26, legLen: 0.13, headR: 0.12, snout: 0.03, snoutColor: belly, noseColor: 0xe57373, tailR: 0.22, tailL: 2.4 });
  return g;
}

function fishModel(c = 0xff8f00) {
  const g = new THREE.Group();
  const bodyM = mat(c, { roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), bodyM);
  body.scale.set(1.6, 0.75, 0.55);
  g.add(body);
  const tailH = new THREE.Group();
  tailH.position.x = -0.3;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.24, 4), bodyM);
  tail.rotation.z = -Math.PI / 2;
  tail.scale.set(1, 1, 0.35);
  tail.position.x = -0.1;
  tailH.add(tail);
  g.add(tailH);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), bodyM);
  fin.position.set(-0.02, 0.17, 0);
  fin.scale.z = 0.3;
  g.add(fin);
  const gills = [];
  const flapM = new THREE.MeshStandardMaterial({ color: new THREE.Color(c).multiplyScalar(0.8), side: THREE.DoubleSide, roughness: 0.5 });
  const redM = mat(0xd81b3c);
  for (const s of [1, -1]) {
    const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xffffff));
    eyeW.position.set(0.21, 0.04, s * 0.07);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), mat(0x111111));
    eye.position.set(0.235, 0.045, s * 0.085);
    const red = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), redM);
    red.scale.set(0.6, 1, 0.3);
    red.position.set(0.07, 0, s * 0.085);
    const h = new THREE.Group();
    h.position.set(0.13, 0, s * 0.105);
    const flap = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12, Math.PI / 2, Math.PI), flapM);
    if (s < 0) flap.rotation.y = Math.PI;
    h.add(flap);
    h.userData.s = s;
    g.add(eyeW, eye, red, h);
    gills.push(h);
  }
  g.userData.tail = tailH;
  g.userData.gills = gills;
  return g;
}

function tadpoleModel() {
  const g = new THREE.Group();
  const dark = mat(0x4a4430);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), dark);
  body.scale.set(1.25, 0.9, 1);
  g.add(body);
  const tailH = new THREE.Group();
  tailH.position.x = -0.12;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.38, 4), mat(0x5d5640));
  tail.rotation.z = Math.PI / 2;
  tail.scale.set(1, 1, 0.25);
  tail.position.x = -0.19;
  tailH.add(tail);
  g.add(tailH);
  const gills = new THREE.Group();
  const gm = mat(0xff6f8a);
  for (const s of [1, -1]) {
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.09, 5), gm);
      f.position.set(0.02 - k * 0.025, 0.02, s * 0.14);
      f.rotation.x = s * (0.9 + k * 0.2);
      gills.add(f);
    }
  }
  g.add(gills);
  const hind = []; const front = [];
  for (const s of [1, -1]) {
    const hl = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.12, 4, 6), mat(0x5b6b2f));
    hl.position.set(-0.11, -0.06, s * 0.1);
    hl.rotation.z = 1.0;
    hl.visible = false;
    const fl = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.07, 4, 6), mat(0x5b6b2f));
    fl.position.set(0.07, -0.08, s * 0.1);
    fl.rotation.x = s * 0.5;
    fl.visible = false;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), mat(0x111111));
    eye.position.set(0.12, 0.05, s * 0.07);
    g.add(hl, fl, eye);
    hind.push(hl); front.push(fl);
  }
  Object.assign(g.userData, { tail: tailH, tailMesh: tail, gills, hind, front });
  return g;
}

function frogModel() {
  const g = new THREE.Group();
  const green = mat(0x4caf50);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), green);
  body.scale.set(1.2, 0.65, 1);
  body.position.y = 0.2;
  g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), mat(0xd6e8a0));
  belly.scale.set(1.15, 0.5, 0.9);
  belly.position.set(0.04, 0.15, 0);
  g.add(belly);
  const throat = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(0xe6f0b8));
  throat.position.set(0.24, 0.13, 0);
  g.add(throat);
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), green);
    eye.position.set(0.18, 0.38, s * 0.14);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0x111111));
    pupil.position.set(0.24, 0.4, s * 0.15);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.25, 4, 8), green);
    leg.position.set(-0.22, 0.08, s * 0.26);
    leg.rotation.z = 1.2;
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.12, 4, 6), green);
    arm.position.set(0.2, 0.06, s * 0.2);
    g.add(eye, pupil, leg, arm);
  }
  g.userData.throat = throat;
  lungsFor(g, [[0.0, 0.22, 0.09], [0.0, 0.22, -0.09]], 0.075);
  return g;
}

function duckModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), mat(0xd8d2c4));
  body.scale.set(1.4, 0.8, 0.95);
  body.position.y = 0.15;
  g.add(body);
  for (const s of [1, -1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat(0x8d6e4f));
    w.scale.set(1.3, 0.5, 0.4);
    w.position.set(-0.05, 0.22, s * 0.17);
    g.add(w);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 6), mat(0x37474f));
  tail.position.set(-0.36, 0.25, 0);
  tail.rotation.z = 1.0;
  g.add(tail);
  const head = new THREE.Group();
  head.position.set(0.28, 0.42, 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), mat(0x1b6b3a)));
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.09), mat(0xf9a825));
  beak.position.set(0.15, -0.03, 0);
  head.add(beak);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), mat(0x111111));
    e.position.set(0.08, 0.04, s * 0.09);
    head.add(e);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 6, 14), mat(0xffffff));
  ring.position.set(0.25, 0.31, 0);
  ring.rotation.y = Math.PI / 2;
  ring.rotation.x = 0.4;
  g.add(head, ring);
  g.userData.head = head;
  return g;
}

function henModel() {
  const g = new THREE.Group();
  const brown = mat(0xc8763e);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), brown);
  body.scale.set(1.2, 1, 0.9);
  body.position.y = 0.36;
  g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 5), mat(0x8d4a22));
  tail.position.set(-0.27, 0.52, 0);
  tail.rotation.z = 0.6;
  tail.scale.z = 0.5;
  g.add(tail);
  for (const s of [1, -1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat(0xa85d2c));
    w.scale.set(1.3, 0.7, 0.35);
    w.position.set(-0.03, 0.38, s * 0.17);
    g.add(w);
  }
  const head = new THREE.Group();
  head.position.set(0.24, 0.6, 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), brown));
  const red = mat(0xe53935);
  for (let k = 0; k < 3; k++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), red);
    c.position.set(0.03 - k * 0.04, 0.1, 0);
    head.add(c);
  }
  const wat = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), red);
  wat.scale.y = 1.5;
  wat.position.set(0.08, -0.08, 0);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 6), mat(0xf9a825));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.12, -0.01, 0);
  head.add(wat, beak);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), mat(0x111111));
    e.position.set(0.06, 0.03, s * 0.075);
    head.add(e);
  }
  g.add(head);
  g.userData.head = head;
  legs(g, 0xf9a825, { n: 2, len: 0.18, r: 0.018, spreadZ: 0.08 });
  return g;
}

function chickModel() {
  const g = new THREE.Group();
  const y = mat(0xffe14d);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), y);
  body.position.y = 0.11;
  g.add(body);
  const head = new THREE.Group();
  head.position.set(0.07, 0.19, 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), y));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 5), mat(0xff8f00));
  beak.rotation.z = -Math.PI / 2;
  beak.position.x = 0.06;
  head.add(beak);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.01, 5, 4), mat(0x111111));
    e.position.set(0.035, 0.02, s * 0.035);
    head.add(e);
  }
  g.add(head);
  g.userData.head = head;
  legs(g, 0xff8f00, { n: 2, len: 0.05, r: 0.008, spreadZ: 0.03 });
  return g;
}

function eggModel() {
  const g = new THREE.Group();
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), mat(0xf5ebd8));
  e.scale.y = 1.3;
  e.position.y = 0.13;
  g.add(e);
  return g;
}

function butterflyModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.16, 4, 6), mat(0x3e2723));
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const wm = new THREE.MeshStandardMaterial({ color: 0xff9800, side: THREE.DoubleSide, roughness: 0.6 });
  const wm2 = new THREE.MeshStandardMaterial({ color: 0x5d2f0b, side: THREE.DoubleSide, roughness: 0.6 });
  const wings = [];
  for (const s of [1, -1]) {
    const hinge = new THREE.Group();
    const w1 = new THREE.Mesh(new THREE.CircleGeometry(0.15, 12), wm);
    w1.rotation.x = Math.PI / 2;
    w1.position.set(0.05, 0, s * 0.13);
    const w2 = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), wm2);
    w2.rotation.x = Math.PI / 2;
    w2.position.set(-0.08, 0, s * 0.1);
    hinge.add(w1, w2);
    g.add(hinge);
    wings.push({ hinge, s });
  }
  g.userData.wings = wings;
  return g;
}

function dolphinModel() {
  const g = new THREE.Group();
  const grey = mat(0x7d93aa, { roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.0, 8, 14), grey);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat(0xdfe7ee));
  belly.scale.set(3, 0.6, 0.9);
  belly.position.y = -0.09;
  g.add(belly);
  const ros = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 8), grey);
  ros.rotation.z = -Math.PI / 2;
  ros.position.x = 0.82;
  g.add(ros);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), grey);
  fin.position.set(-0.05, 0.3, 0);
  fin.rotation.z = 0.5;
  fin.scale.z = 0.3;
  g.add(fin);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.55), grey);
  fl.position.x = -0.78;
  g.add(fl);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), mat(0x111111));
    e.position.set(0.5, 0.04, s * 0.15);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.1), grey);
    p.position.set(0.25, -0.12, s * 0.22);
    p.rotation.y = s * 0.5;
    g.add(e, p);
  }
  const blow = new THREE.Object3D();
  blow.position.set(0.35, 0.22, 0);
  g.add(blow);
  g.userData.blow = blow;
  return g;
}

function treeModel() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.6, 8), mat(0x7a5230));
  trunk.position.y = 0.8;
  g.add(trunk);
  const leafM = mat(0x3f8f3a, { flat: true });
  for (const [x, y, z, r] of [[0, 2.3, 0, 1.2], [0.7, 1.9, 0.3, 0.8], [-0.6, 2.0, -0.3, 0.85], [0.1, 2.9, 0.1, 0.8]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leafM);
    b.position.set(x, y, z);
    g.add(b);
  }
  return g;
}

function barnModel() {
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.8), mat(0xb03a2e));
  walls.position.y = 0.8;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 2.0, 3), mat(0x5d4037, { flat: true }));
  roof.rotation.x = -Math.PI / 2;
  roof.position.y = 1.6 + 0.69;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.05), mat(0xf3e9d2));
  door.position.set(0, 0.55, 0.91);
  const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 14), mat(0xe8c65a));
  hay.rotation.x = Math.PI / 2;
  hay.position.set(1.6, 0.35, 0.6);
  g.add(walls, roof, door, hay);
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
  const STEPS = ['Опознай животните', 'Как дишат животните?', 'Как се развиват животните?', 'Приложи и предскажи'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xbfe3ff, camPos: [0.5, 8, 13], target: [0.5, 0.3, -0.5],
    fog: { color: 0xbfe3ff, near: 26, far: 60 }, minDistance: 1.5, maxDistance: 26,
  });
  const { scene, camera } = stage;
  stage.onHover(() => {});
  const narrowUI = () => stage.renderer.domElement.clientWidth < 480;

  let rdt = 0.016;
  let lastNow = performance.now();
  stage.tick(() => { const n = performance.now(); rdt = Math.min(0.25, Math.max(0.001, (n - lastNow) / 1000)); lastNow = n; });
  const phase = (dur, fn) => new Promise((res) => {
    let k = 0;
    const stop = stage.tick((dt, t) => {
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

  // ---------- земя, езеро, море ----------
  const inPondK = (x, z) => ((x - POND.x) / POND.rx) ** 2 + ((z - POND.z) / POND.rz) ** 2;
  const groundGeo = new THREE.PlaneGeometry(60, 44, 100, 74);
  groundGeo.rotateX(-Math.PI / 2);
  const gp = groundGeo.attributes.position;
  const cols = [];
  const c = new THREE.Color();
  const sand = new THREE.Color(0xe3cf98);
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i); const z = gp.getZ(i);
    const ip = inPondK(x, z);
    let y = Math.sin(x * 0.35) * Math.cos(z * 0.3) * 0.08;
    if (ip < 1.25) y -= (1.25 - ip) * 0.9;
    if (z < -7.2) y -= (-7.2 - z) * 0.35;
    gp.setY(i, y);
    const t = 0.5 + 0.5 * Math.sin(x * 0.7 + Math.cos(z * 0.5) * 2);
    c.setHSL(0.27 + t * 0.04, 0.5, 0.42 + t * 0.08);
    if (ip < 1.5) c.lerp(new THREE.Color(0xb8a272), Math.min(1, (1.5 - ip) * 2));
    if (z < -6.4) c.lerp(sand, Math.min(1, (-6.4 - z) * 1.2));
    if (x > YARD.x0 && x < YARD.x1 && z > YARD.z0 && z < YARD.z1) c.lerp(new THREE.Color(0xa89060), 0.35);
    cols.push(c.r, c.g, c.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  groundGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })));

  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 64),
    new THREE.MeshStandardMaterial({ color: 0x3d8fd1, roughness: 0.15, transparent: true, opacity: 0.55, depthWrite: false }));
  water.rotation.x = -Math.PI / 2;
  water.scale.set(POND.rx * 1.02, POND.rz * 1.02, 1);
  water.position.set(POND.x, -0.05, POND.z);
  water.renderOrder = 2;
  scene.add(water);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(90, 34),
    new THREE.MeshStandardMaterial({ color: 0x2f7fc4, roughness: 0.2, transparent: true, opacity: 0.86, depthWrite: false }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.12, -25);
  sea.renderOrder = 2;
  scene.add(sea);
  const reedM = mat(0x5d7f2a);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + 0.15;
    if (Math.sin(a) > 0.55 && Math.cos(a) > -0.2) continue; // свободен бряг отпред
    const h = 0.6 + ((i * 37) % 10) / 16;
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, h, 5), reedM);
    r.position.set(POND.x + Math.cos(a) * POND.rx * 1.04, h / 2 - 0.1, POND.z + Math.sin(a) * POND.rz * 1.06);
    if (i % 3 === 0) {
      const top = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 6), mat(0x6d4c41));
      top.position.y = h / 2;
      r.add(top);
    }
    scene.add(r);
  }
  for (let i = 0; i < 4; i++) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), mat(0x43a047));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(POND.x - 1.6 + i * 0.6, -0.04, POND.z - 0.9 + Math.sin(i * 2) * 0.3);
    scene.add(pad);
  }
  for (const [x, z, s] of [[-9, -4, 1.2], [-8, 2.5, 1], [-10.5, 0, 1.3], [10.5, -2, 1.2], [11, 2.5, 1], [9.6, -5.2, 0.9]]) {
    const t = treeModel();
    t.scale.setScalar(s);
    t.position.set(x, 0, z);
    scene.add(t);
  }
  const barn = barnModel();
  barn.position.set(6.2, 0, -4.4);
  scene.add(barn);
  // ограда на двора (с вход отпред)
  const woodM = mat(0x9c7448);
  const fence = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.round(len / 0.8));
    for (let k = 0; k <= n; k++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), woodM);
      p.position.set(lerp(x0, x1, k / n), 0.3, lerp(z0, z1, k / n));
      scene.add(p);
    }
    for (const y of [0.25, 0.5]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.04), woodM);
      r.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
      r.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
      scene.add(r);
    }
  };
  fence(YARD.x0, YARD.z0, YARD.x1, YARD.z0);
  fence(YARD.x1, YARD.z0, YARD.x1, YARD.z1);
  fence(YARD.x0, YARD.z0, YARD.x0, YARD.z1);
  fence(YARD.x0, YARD.z1, 4.8, YARD.z1);
  fence(6.0, YARD.z1, YARD.x1, YARD.z1);
  const flowerCols = [0xffffff, 0xffeb3b, 0xe91e63, 0x9c27b0];
  for (let i = 0; i < 50; i++) {
    const x = -1 + ((i * 53) % 37) / 10;
    const z = -3 + ((i * 29) % 61) / 10;
    if (inPondK(x, z) < 1.4) continue;
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(flowerCols[i % 4]));
    f.position.set(x, 0.12, z);
    scene.add(f);
  }
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    const cg = new THREE.Group();
    const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });
    for (let k = 0; k < 4; k++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.8 + (k % 2) * 0.4, 12, 8), cm);
      puff.position.set(k * 0.9 - 1.4, (k % 3) * 0.12, (k % 2) * 0.4);
      puff.scale.y = 0.6;
      cg.add(puff);
    }
    cg.position.set(-18 + i * 8, 9 + (i % 3), -12 - (i % 2) * 5);
    scene.add(cg);
    clouds.push(cg);
  }

  // ---------- животните ----------
  const roots = new Map();
  function addAnimal(id, g, pos, labelText, lsize = 0.26) {
    g.position.set(...pos);
    g.userData.pickId = id;
    const box = new THREE.Box3().setFromObject(g);
    const top = box.max.y - g.position.y;
    const label = labelSprite(labelText, { size: lsize });
    label.position.y = top + 0.25;
    g.add(label);
    stage.steadyLabel(label, 13);
    g.userData.label = label;
    g.userData.top = top + 0.45;
    addHitBox(g, 0.9);
    scene.add(g);
    roots.set(id, g);
    return g;
  }
  const fish = addAnimal('fish', fishModel(0xff8f00), [POND.x, -0.2, POND.z], 'Риба');
  const extraFish = [fishModel(0xb0bec5), fishModel(0xff7043)];
  extraFish.forEach((f) => scene.add(f));
  const fishPaths = [{ a: 0, sp: 0.35, rx: 1.7, rz: 0.9, y: -0.25 }, { a: 2, sp: -0.28, rx: 1.2, rz: 0.6, y: -0.35 }, { a: 4, sp: 0.42, rx: 2.0, rz: 1.1, y: -0.3 }];
  const TAD_HOME = new V3(-1.9, -0.14, -0.3);
  const tadpole = addAnimal('tadpole', tadpoleModel(), TAD_HOME.toArray(), 'Попова лъжичка', 0.22);
  const extraTads = [tadpoleModel(), tadpoleModel(), tadpoleModel()];
  extraTads.forEach((t) => scene.add(t));
  const FROG_HOME = new V3(-1.2, 0, 0.9);
  const frog = addAnimal('frog', frogModel(), FROG_HOME.toArray(), 'Жаба');
  frog.rotation.y = 0.6;
  const duck = addAnimal('duck', duckModel(), [POND.x - 1, -0.08, POND.z], 'Патица');
  const horse = addAnimal('horse', horseModel(), [LIFE.horse.home[0], 0, LIFE.horse.home[1]], 'Кон');
  const cat = addAnimal('cat', catModel(), [LIFE.cat.home[0], 0, LIFE.cat.home[1]], 'Котка с котенца');
  const hen = addAnimal('hen', henModel(), [LIFE.hen.home[0], 0, LIFE.hen.home[1]], 'Кокошка с пиленца');
  const butterfly = addAnimal('butterfly', butterflyModel(), [0.8, 1.1, 0.6], 'Пеперуда', 0.22);
  const dolphin = dolphinModel();
  scene.add(dolphin);
  const followers = [];
  const chickOff = [[-0.45, 0.25], [-0.35, -0.35], [-0.7, 0.05]];
  for (const [ox, oz] of chickOff) {
    const ch = chickModel();
    ch.position.set(hen.position.x + ox, 0, hen.position.z + oz);
    ch.userData.f = { leader: hen, off: new V3(ox, 0, oz), speed: 0.6, ph: Math.random() * 6 };
    scene.add(ch); followers.push(ch);
  }
  [[0x555555, 0xbbbbbb, -0.4, 0.3], [0xffffff, 0xffffff, -0.35, -0.3]].forEach(([col, bel, ox, oz]) => {
    const k = catModel(col, bel);
    k.scale.setScalar(0.55);
    k.position.set(cat.position.x + ox, 0, cat.position.z + oz);
    k.userData.f = { leader: cat, off: new V3(ox, 0, oz), speed: 0.5, ph: Math.random() * 6, hop: true };
    scene.add(k); followers.push(k);
  });

  // ---------- живот: разходки, плуване, полет ----------
  const hold = new Set(); // животни, които стоят за демонстрация
  const inYard = (x, z) => x > YARD.x0 + 0.35 && x < YARD.x1 - 0.35 && z > YARD.z0 + 0.35 && z < YARD.z1 - 0.35;
  function pickTarget(id) {
    const L = LIFE[id];
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * L.r;
      const x = L.home[0] + Math.cos(a) * r; const z = L.home[1] + Math.sin(a) * r;
      if (inYard(x, z)) return new V3(x, 0, z);
    }
    return new V3(L.home[0], 0, L.home[1]);
  }
  function angleTo(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
  function walkLegs(g, ph, amp = 0.5) {
    const L = g.userData.legs || [];
    L.forEach((lg, i) => { const pair = L.length === 2 ? i : (i === 0 || i === 3 ? 0 : 1); lg.rotation.z = Math.sin(ph + pair * Math.PI) * amp; });
  }
  function wander(g, dt, t) {
    const id = g.userData.pickId;
    const L = LIFE[id];
    const w = g.userData.w || (g.userData.w = { mode: 'idle', timer: Math.random() * 2, phase: 0 });
    const head = g.userData.head;
    if (w.mode === 'idle') {
      w.timer -= dt;
      if (head) {
        const dip = (L.graze || L.peck) && Math.sin(t * (L.peck ? 2.2 : 0.9)) > 0.2;
        head.rotation.z += ((dip ? -0.55 : Math.sin(t * 0.6) * 0.1) - head.rotation.z) * Math.min(1, dt * 4);
      }
      for (const lg of g.userData.legs || []) lg.rotation.z *= 0.85;
      if (w.timer <= 0) { w.mode = 'walk'; w.target = pickTarget(id); }
      return;
    }
    const dx = w.target.x - g.position.x; const dz = w.target.z - g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.08) { w.mode = 'idle'; w.timer = 1.5 + Math.random() * 3; return; }
    const diff = angleTo(g.rotation.y, Math.atan2(-dz, dx));
    g.rotation.y += diff * Math.min(1, dt * 5);
    if (Math.abs(diff) < 0.7) {
      const step = Math.min(dist, L.speed * dt);
      g.position.x += (dx / dist) * step; g.position.z += (dz / dist) * step;
      w.phase += dt * L.speed * 9;
    }
    walkLegs(g, w.phase);
    if (head) head.rotation.z += (0.05 - head.rotation.z) * Math.min(1, dt * 4);
  }
  function follow(g, dt, t) {
    const f = g.userData.f;
    const tx = f.leader.position.x + f.off.x; const tz = f.leader.position.z + f.off.z;
    const dx = tx - g.position.x; const dz = tz - g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.1) {
      g.rotation.y += angleTo(g.rotation.y, Math.atan2(-dz, dx)) * Math.min(1, dt * 5);
      const step = Math.min(dist, f.speed * dt * (dist > 0.6 ? 1.6 : 1));
      g.position.x += (dx / dist) * step; g.position.z += (dz / dist) * step;
      f.ph += dt * 12;
      g.position.y = f.hop ? Math.abs(Math.sin(f.ph)) * 0.05 : 0;
      walkLegs(g, f.ph, 0.6);
    } else {
      g.position.y = 0;
      if (g.userData.head) g.userData.head.rotation.z = Math.sin(t * 3 + f.ph) > 0.3 ? -0.6 : 0;
      if (f.hop) g.rotation.y += Math.sin(t * 0.8 + f.ph) * dt * 0.8;
    }
  }
  const fishList = [fish, ...extraFish];
  let frogHopT = 2;
  const spout = [];
  for (let i = 0; i < 12; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
    p.visible = false;
    p.userData.r = [Math.cos(i * 2.4) * 0.12, 0.7 + (i % 4) * 0.15, Math.sin(i * 2.4) * 0.12];
    scene.add(p); spout.push(p);
  }
  const tmpV = new V3();
  stage.tick((dt, t) => {
    water.material.color.setHSL(0.57, 0.55, 0.52 + Math.sin(t * 0.8) * 0.02);
    for (const cl of clouds) { cl.position.x += dt * 0.25; if (cl.position.x > 22) cl.position.x = -22; }
    // риби
    fishList.forEach((f, i) => {
      const P = fishPaths[i];
      f.userData.tail.rotation.y = Math.sin(t * 7 + i) * 0.4;
      for (const h of f.userData.gills) h.rotation.y = h.userData.s * (0.15 + 0.25 * (0.5 + 0.5 * Math.sin(t * 3 + i)));
      if (hold.has(f)) return;
      P.a += P.sp * dt;
      f.position.set(POND.x + Math.cos(P.a) * P.rx, P.y, POND.z + Math.sin(P.a) * P.rz);
      const dx = -Math.sin(P.a) * P.rx * Math.sign(P.sp); const dz = Math.cos(P.a) * P.rz * Math.sign(P.sp);
      f.rotation.y = Math.atan2(-dz, dx);
    });
    // попови лъжички
    [tadpole, ...extraTads].forEach((tp, i) => {
      tp.userData.tail.rotation.y = Math.sin(t * 12 + i) * 0.5;
      if (hold.has(tp)) return;
      const a = t * (0.6 + i * 0.15) + i * 1.6;
      const r = 0.3 + i * 0.12;
      tp.position.set(TAD_HOME.x + Math.cos(a) * r, TAD_HOME.y - i * 0.03, TAD_HOME.z + Math.sin(a) * r * 0.7);
      tp.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
      if (i) tp.scale.setScalar(0.8);
    });
    // патица
    if (!hold.has(duck)) {
      const a = t * 0.15;
      duck.position.set(POND.x - 0.2 + Math.cos(a) * 1.9, -0.08 + Math.sin(t * 2) * 0.015, POND.z - 0.3 + Math.sin(a) * 1.0);
      duck.rotation.y = Math.atan2(-Math.cos(a) * 1.0, -Math.sin(a) * 1.9);
      duck.userData.head.rotation.z = Math.sin(t * 0.7) * 0.15;
    }
    // жаба: гуша и подскоци
    frog.userData.throat.scale.setScalar(1 + 0.25 * Math.max(0, Math.sin(t * 5)));
    if (!hold.has(frog)) {
      frogHopT -= dt;
      if (frogHopT < 0.5 && frogHopT > 0) frog.position.y = Math.sin((frogHopT / 0.5) * Math.PI) * 0.22;
      else frog.position.y = 0;
      if (frogHopT <= 0) { frogHopT = 3 + Math.random() * 3; frog.rotation.y += (Math.random() - 0.5) * 1.2; }
    }
    // двор
    for (const g of [horse, hen, cat]) if (!hold.has(g)) wander(g, dt, t);
    cat.userData.body.scale.set(1 + 0.05 * Math.sin(t * 3), 1, 1 + 0.05 * Math.sin(t * 3));
    if (!hold.has(horse)) horse.userData.body.scale.set(1 + 0.03 * Math.sin(t * 1.8), 1, 1 + 0.03 * Math.sin(t * 1.8));
    horse.userData.tail.rotation.x = Math.sin(t * 2) * 0.3;
    cat.userData.tail.rotation.x = Math.sin(t * 1.5) * 0.4;
    for (const g of followers) follow(g, dt, t);
    // пеперуда
    if (!hold.has(butterfly)) {
      const k = t * 0.35;
      butterfly.position.set(0.6 + Math.sin(k) * 1.6, 1.0 + Math.sin(k * 2.3) * 0.3, 0.4 + Math.sin(k * 0.7) * 1.2);
      butterfly.rotation.y = Math.atan2(-Math.cos(k * 0.7) * 0.84, Math.cos(k) * 1.6);
    }
    for (const { hinge, s } of butterfly.userData.wings) hinge.rotation.x = s * Math.sin(t * 14) * 0.9;
    // делфин: плува и изплува да поеме въздух
    const dx = Math.sin(t * 0.12) * 6 - 1;
    const p = ((t + 3) % 8) / 8;
    const surf = p > 0.55 && p < 0.9 ? Math.sin(((p - 0.55) / 0.35) * Math.PI) : 0;
    dolphin.position.set(dx, -0.62 + surf * 0.62, -12.5);
    dolphin.rotation.set(0, Math.cos(t * 0.12) >= 0 ? 0 : Math.PI, surf > 0 ? Math.cos(((p - 0.55) / 0.35) * Math.PI) * 0.25 : 0);
    const blow = dolphin.userData.blow.getWorldPosition(tmpV);
    const sk = p > 0.66 && p < 0.86 ? (p - 0.66) / 0.2 : -1;
    spout.forEach((sp) => {
      sp.visible = sk >= 0;
      if (!sp.visible) return;
      const r = sp.userData.r;
      sp.position.set(blow.x + r[0] * sk * 4, blow.y + Math.sin(sk * Math.PI) * r[1], blow.z + r[2] * sk * 4);
      sp.scale.setScalar(1 + sk * 1.5);
    });
  });

  // ---------- частици: вода, кислород, въздух ----------
  const dotGeo = new THREE.SphereGeometry(1, 8, 6);
  const flows = [];
  function flow({ count, color, size, pos }) {
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false });
    const grp = new THREE.Group();
    const dots = [];
    for (let i = 0; i < count; i++) {
      const d = new THREE.Mesh(dotGeo, m);
      d.scale.setScalar(size);
      d.renderOrder = 6;
      grp.add(d); dots.push(d);
    }
    scene.add(grp);
    const out = new V3();
    const stop = stage.tick((dt, t) => {
      dots.forEach((d, i) => {
        const ok = pos(i, t, out, count);
        d.visible = !!ok;
        if (ok) { d.position.copy(out); if (typeof ok === 'number') d.scale.setScalar(size * ok); }
      });
    });
    const f = { stop() { stop(); scene.remove(grp); m.dispose(); } };
    flows.push(f);
    return f;
  }
  function poly(pts) {
    const P = pts.map((p) => new V3(...p));
    const seg = []; let L = 0;
    for (let i = 0; i < P.length - 1; i++) { const l = P[i].distanceTo(P[i + 1]); seg.push(l); L += l; }
    return (u, out) => {
      let d = clamp01(u) * L;
      for (let i = 0; i < seg.length; i++) {
        if (d <= seg[i] || i === seg.length - 1) return out.lerpVectors(P[i], P[i + 1], Math.min(1, d / seg[i]));
        d -= seg[i];
      }
      return out;
    };
  }
  // Ghost: тялото става прозрачно, за да се виждат белите дробове.
  function ghost(g, on) {
    g.traverse((o) => {
      if (!o.isMesh || o.userData.keep || o.userData.isHitBox) return;
      if (on) {
        if (o.userData.op0 === undefined) { o.userData.op0 = o.material.opacity; o.userData.tr0 = o.material.transparent; }
        o.material.transparent = true; o.material.opacity = 0.45; o.material.depthWrite = false; o.material.needsUpdate = true;
      } else if (o.userData.op0 !== undefined) {
        o.material.transparent = o.userData.tr0; o.material.opacity = o.userData.op0; o.material.depthWrite = true; o.material.needsUpdate = true;
      }
    });
    if (g.userData.lungs) g.userData.lungs.visible = on;
  }
  // Въздух навътре (син) и навън (сив) по пътя „ноздри → бели дробове“, гърдите се повдигат.
  function lungDemo(g, pathPts, period, size) {
    const pa = poly(pathPts);
    const breath = (t) => { const ph = (t % period) / period; return ph < 0.5 ? ease(ph * 2) : 1 - ease((ph - 0.5) * 2); };
    const mk = (inhale, color) => flow({ count: 10, color, size, pos: (i, t, out, n) => {
      const ph = (t % period) / period;
      if (inhale ? ph >= 0.5 : ph < 0.5) return false;
      const q = (inhale ? ph : ph - 0.5) * 2 * 1.5 - (i / n) * 0.5;
      if (q < 0 || q > 1) return false;
      pa(inhale ? q : 1 - q, out);
      out.z *= i % 2 ? 1 : -1;
      g.localToWorld(out);
      return true;
    } });
    mk(true, 0x3fa9ff); mk(false, 0x9e9e9e);
    const body = g.userData.body;
    const stop = stage.tick((dt, t) => {
      const b = breath(t);
      if (body) body.scale.set(1 + 0.08 * b, 1, 1 + 0.08 * b);
      if (g.userData.lungs) g.userData.lungs.scale.setScalar(1 + 0.3 * b);
    });
    flows.push({ stop });
  }

  // ---------- изглед и балончета ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(cc, hw, hh, elev = 0.4, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.08;
    stage.stopFollow();
    stage.flyTo([cc[0], cc[1] + Math.sin(elev) * d, cc[2] + Math.cos(elev) * d], cc, dur);
  }
  const overview = () => fitView([0.9, 0.2, -0.8], 7.9, 3.6, 0.62);
  let tip = null;
  function say(anchor, html, cls = '', lift = 0.3) {
    if (tip) tip.remove();
    if (narrowUI()) cls = cls.replace('wide', '');
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const sayAt = (g, html, cls = '') => say(g, html, cls, g.userData.top || 0.6);

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  let stopDrag = null;

  function choiceBox(cEl, q, items, rightIdx, why, onRight, onWrong) {
    cEl.innerHTML = `<p class="animallife-q">${q}</p><div class="choices">${items.map((t, i) => `<button class="choice" data-i="${i}">${t}</button>`).join('')}</div>`;
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

  // Край на демонстрация: всичко се връща към нормалния живот.
  function endDemo() {
    while (flows.length) flows.pop().stop();
    for (const g of [fish, tadpole, horse, frog]) {
      if (hold.has(g)) { hold.delete(g); g.scale.setScalar(1); }
      ghost(g, false);
      g.userData.label.visible = true;
    }
    tadpole.userData.gills.visible = true;
    horse.userData.body.scale.set(1, 1, 1);
    frog.position.copy(FROG_HOME);
  }

  // ---------- 1. Опознай ----------
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Животните',
    items: ANIMALS.map((a) => ({ id: a.id, label: a.label, icon: a.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  const NEED1 = 6;
  function step1() {
    shell.step(0);
    menu.show(true);
    const seen = new Set();
    shell.task(`<p>Край езерото, на ливадата и в двора живеят различни животни.</p>
      <p><b>Разгледай поне ${NEED1} животни:</b> кликни върху тях или ги избери от менюто в ъгъла. Виж как дишат и как се появяват малките им.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата картина</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${ANIMALS.length}`);
    upd();
    const visit = (id) => {
      const a = AN[id]; const g = roots.get(id);
      if (!a || !g) { clearTip(); return; }
      const small = ['fish', 'tadpole', 'butterfly'].includes(id);
      stage.focusOn(g, { dist: id === 'horse' ? 5 : small ? 2.6 : 3.4, height: small ? 1.4 : 1.8, lift: 0.3 });
      sayAt(g, `<b>${esc(a.icon)} ${esc(a.label)}</b><br>${a.note}`, 'wide');
      seen.add(id);
      menu.mark(id); menu.setActive(id);
      upd();
      if (seen.size >= NEED1) { next.disabled = false; shell.msg('Браво! Можеш да продължиш или да разгледаш още.', 'good'); }
    };
    clickHandler = (id) => visit(id);
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); menu.show(false); clearTip(); step2(); });
    overview();
  }

  // ---------- сортиране (стъпки 2 и 3) ----------
  const TOKB = { fish: () => fishModel(0xff8f00), tadpole: tadpoleModel, frog: frogModel, duck: duckModel, horse: horseModel, cat: () => catModel(), hen: henModel, butterfly: butterflyModel };
  const RING_Z = 6.7;
  function sortTask(cfg, done) {
    const objs = [];
    const nar = narrowUI();
    const RING_X = nar ? 1.75 : 2.4;
    const rings = cfg.bins.map((name, i) => {
      const z = zoneRing(cfg.colors[i], nar ? 1.15 : 1.35);
      z.position.set(i ? RING_X : -RING_X, 0.03, RING_Z);
      const l = labelSprite(name, { size: 0.36, color: '#fff', bg: cfg.css[i], border: cfg.css[i] });
      l.position.set(0, 0.45, 1.55);
      z.add(l);
      scene.add(z); objs.push(z);
      return { group: z, n: 0 };
    });
    const items = shuffle(cfg.items);
    const slotsXZ = [[-2.1, 3.6], [-0.7, 3.6], [0.7, 3.6], [2.1, 3.6], [-1.4, 4.8], [0, 4.8], [1.4, 4.8]];
    const tokens = items.map((it, k) => {
      const m = TOKB[it.id]();
      if (it.id === 'butterfly') m.position.y = 0.2;
      const holder = new THREE.Group();
      holder.add(m);
      const box = new THREE.Box3().setFromObject(holder);
      const size = box.getSize(new V3());
      m.scale.setScalar(0.85 / Math.max(size.x, size.y, size.z));
      if (it.id === 'fish' || it.id === 'tadpole') m.position.y = 0.2;
      m.rotation.y = -0.5;
      const l = labelSprite(AN[it.id].label.split(' ')[0] === 'Попова' ? 'Попова лъжичка' : AN[it.id].label.split(' ')[0], { size: 0.24 });
      l.position.y = 1.0;
      holder.position.set(slotsXZ[k][0], 0, slotsXZ[k][1]);
      holder.userData = { pickId: 't-' + it.id, dragId: 't-' + it.id, it };
      addHitBox(holder, 0.8); // без етикета, за да не закрива задния ред
      l.raycast = () => {};
      holder.add(l);
      stage.steadyLabel(l, 10);
      scene.add(holder); objs.push(holder);
      return holder;
    });
    fitView([0, 0.3, 5.6], nar ? 3.0 : 4.3, 3.0, 0.85);
    let mistakes = 0; let placed = 0; let wrongRow = 0;
    const upd = () => shell.score(`Подредени: ${placed} от ${items.length} · грешки: ${mistakes}`);
    upd();
    clickHandler = null;
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => clearTip(),
      onDrop: async (g, p, start) => {
        const it = g.userData.it;
        let bi = -1;
        rings.forEach((r, i) => { if (Math.hypot(p.x - r.group.position.x, p.z - r.group.position.z) < 1.5) bi = i; });
        if (bi < 0) { await hop(g, start, 0.35, 0.2); return; }
        if (bi !== it.bin) {
          mistakes++; wrongRow++;
          say(g, `✘ ${esc(it.why)}`, 'bad', 1.1);
          shell.msg(`Не е в „${cfg.bins[bi]}“. ${wrongRow >= 2 ? cfg.hint : 'Прочети балончето.'}`, 'bad');
          upd();
          await hop(g, start, 0.45, 0.3);
          return;
        }
        wrongRow = 0;
        g.userData.locked = true;
        delete g.userData.dragId;
        const r = rings[bi];
        const n = r.n++;
        const slot = new V3(r.group.position.x + (n ? Math.cos(n * 1.3) * 0.75 : 0), 0, r.group.position.z + (n ? Math.sin(n * 1.3) * 0.6 : 0));
        hop(g, slot, 0.35, 0.2);
        placed++;
        say(slot.clone().setY(0.5), `✔ ${esc(AN[it.id].label.replace(/ с .*/, ''))} — ${esc(cfg.bins[bi].toLowerCase())}.`, 'good tag', 0.6);
        shell.msg('Вярно!', 'good');
        upd();
        if (placed === items.length) {
          stopDrag(); stopDrag = null;
          done(mistakes, () => { objs.forEach((o) => scene.remove(o)); });
        }
      },
    });
  }
  SORT_BREATH.hint = 'Подсказка: хриле имат рибите и поповите лъжички — те вземат кислород от водата.';
  SORT_BIRTH.hint = 'Подсказка: птиците, рибите, жабите и насекомите снасят яйца. Повечето бозайници раждат малки и ги хранят с мляко.';

  // ---------- 2. Как дишат ----------
  function demo(kind) {
    endDemo();
    clearTip();
    if (kind === 'fish') {
      hold.add(fish);
      fish.position.set(-3.3, -0.42, -0.1);
      fish.rotation.set(0, 0, 0);
      fish.scale.setScalar(2.2);
      fish.userData.label.visible = false;
      fitView([-3.3, -0.3, -0.1], 2.1, 1.3, 0.55);
      const pw = poly([[0.75, -0.02, 0.02], [0.33, -0.02, 0.02], [0.16, 0, 0.07], [0.07, 0, 0.15], [-0.15, 0, 0.32]]);
      flow({ count: 22, color: 0x8fe3ff, size: 0.035, pos: (i, t, out, n) => {
        const u = (t / 2.4 + i / n) % 1; pw(u, out); out.z *= i % 2 ? 1 : -1; fish.localToWorld(out); return true; } });
      const po = poly([[0.08, 0, 0.08], [0.02, 0.01, 0.05], [-0.08, 0.02, 0.0]]);
      flow({ count: 8, color: 0xff2d2d, size: 0.032, pos: (i, t, out, n) => {
        const u = (t / 1.5 + i / n) % 1; po(u, out); out.z *= i % 2 ? 1 : -1; fish.localToWorld(out); return 1 - u * 0.6; } });
      say(fish, '<b>🐟 Хриле</b><br>Рибата гълта вода през устата. <span style="color:#1e88e5">Водата</span> минава през хрилете и излиза отстрани зад главата. Хрилете поемат <b style="color:#d32f2f">кислорода</b>, разтворен във водата.', 'wide', 0.55);
    } else if (kind === 'horse') {
      hold.add(horse);
      horse.rotation.set(0, 0, 0);
      for (const lg of horse.userData.legs) lg.rotation.z = 0;
      horse.userData.head.rotation.z = 0;
      horse.userData.label.visible = false;
      ghost(horse, true);
      const hp = horse.position;
      fitView([hp.x + 0.25, 1.0, hp.z], 2.3, 1.5, 0.18);
      lungDemo(horse, [[1.08, 1.6, 0], [0.7, 1.62, 0], [0.48, 1.32, 0], [0.26, 1.1, 0], [0.12, 1.06, 0.11]], 3.2, 0.04);
      say(new V3(hp.x + 0.3, 1.6, hp.z), '<b>🐴 Бели дробове</b><br>Конят вдишва <b style="color:#1e88e5">въздух</b> през ноздрите. Въздухът стига до <b style="color:#e53962">белите дробове</b> и гърдите се повдигат. Там тялото взема кислорода. После конят издишва.', 'wide', 0.4);
    } else {
      hold.add(tadpole); hold.add(frog);
      tadpole.position.set(-1.85, -0.2, 0.45);
      tadpole.rotation.set(0, 0, 0);
      tadpole.scale.setScalar(2.4);
      frog.position.set(-0.55, 0, 1.05);
      frog.rotation.set(0, 0, 0);
      tadpole.userData.label.visible = false; frog.userData.label.visible = false;
      ghost(frog, true);
      fitView([-1.2, 0.0, 0.75], 2.0, 1.1, 0.5);
      const pg = poly([[0.4, 0, 0.04], [0.12, 0, 0.12], [0.0, 0, 0.17], [-0.3, 0, 0.3]]);
      flow({ count: 16, color: 0x8fe3ff, size: 0.03, pos: (i, t, out, n) => {
        const u = (t / 2.2 + i / n) % 1; pg(u, out); out.z *= i % 2 ? 1 : -1; tadpole.localToWorld(out); return true; } });
      lungDemo(frog, [[0.32, 0.33, 0], [0.2, 0.28, 0], [0.05, 0.23, 0], [0.0, 0.22, 0.09]], 1.6, 0.022);
      say(new V3(-1.2, 0.3, 0.75), '<b>Попова лъжичка → жаба</b><br>Поповата лъжичка живее във водата и диша с <b style="color:#e53962">хриле</b>. Докато е съвсем малка, хрилете са отвън — розовите пискюли на главата. Възрастната жаба излиза на сушата и диша въздух с <b>бели дробове</b> и през влажната си кожа.', 'wide', 0.35);
    }
  }

  function step2() {
    shell.step(1);
    overview();
    const seen = new Set();
    const DEM = [['fish', '🐟 Как диша рибата?'], ['horse', '🐴 Как диша конят?'], ['tadpole', '🐸 Попова лъжичка и жаба']];
    shell.task(`<p>Всички животни дишат: поемат <b>кислород</b>. Едни го вземат от въздуха, а други — от водата.</p>
      <p><b>Разгледай трите примера.</b> Наблюдавай накъде се движат точиците.</p>`);
    const ctrl = shell.setControls(`<div class="animallife-demos">${DEM.map(([k, t]) => `<button class="btn" data-d="${k}">${t}</button>`).join('')}</div>
      <div class="row"><button class="btn primary nx" disabled>Подреди животните →</button></div>`);
    shell.score('Разгледани: 0 от 3');
    const nx = ctrl.querySelector('.nx');
    ctrl.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
      demo(b.dataset.d);
      seen.add(b.dataset.d);
      b.classList.add('seen');
      shell.score(`Разгледани: ${seen.size} от 3`);
      if (seen.size === 3) nx.disabled = false;
    }));
    clickHandler = null;
    nx.addEventListener('click', () => {
      endDemo(); clearTip();
      shell.msg('');
      shell.task(`<p>Едни животни дишат с <b>хриле</b>, а други — с <b>бели дробове</b>.</p>
        <p><b>Провлачи всяко животно</b> в правилния кръг.</p>`);
      shell.setControls('');
      sortTask(SORT_BREATH, (mist, cleanup) => {
        shell.msg(mist ? `Готово! Грешки: ${mist}.` : 'Без нито една грешка!', 'good');
        const c2 = shell.setControls('<button class="btn primary">Напред →</button>');
        c2.querySelector('button').addEventListener('click', () => { cleanup(); clearTip(); energyQuiz(mist); });
      });
    });
  }

  function energyQuiz(sortMistakes) {
    shell.msg('');
    overview();
    let mistakes = 0;
    shell.task('<p>За да живеят, дишат и се движат, животните имат нужда от <b>енергия</b>.</p>');
    shell.score('');
    const box = shell.setControls('<div></div>').firstChild;
    choiceBox(box, 'Откъде животните получават енергия?', [
      '🍎 От храната, която ядат',
      '💨 От въздуха, който дишат',
      '💧 От водата, в която живеят',
    ], 0, (i) => (i === 1
      ? 'Въздухът им дава кислород. С негова помощ тялото освобождава енергията, но самата енергия идва от друго място.'
      : 'Водата е нужна на всяко животно, но не му дава енергия. Помисли какво правят животните, когато са гладни.'),
    () => {
      shell.msg('Вярно! Енергията идва от храната. Растенията си правят храна сами, а животните ядат растения или други животни.', 'good');
      sayAt(hen, '🌾 Кокошката кълве зрънца. От храната тялото ѝ получава енергия.', 'good');
      const OPTS = [['move', '🏃 Да се движат', true], ['grow', '📏 Да растат', true], ['warm', '🔥 Бозайниците и птиците — да пазят тялото си топло', true], ['sun', '☀️ Да си правят храна от слънчевата светлина', false]];
      const b2 = shell.setControls(`<p class="animallife-q">За какво животните използват тази енергия? Избери всичко вярно.</p>
        <div class="animallife-checks">${OPTS.map(([k, t]) => `<label data-k="${k}"><input type="checkbox" value="${k}">${t}</label>`).join('')}</div>
        <div class="row"><button class="btn primary chk">Провери</button></div>`);
      b2.querySelector('.chk').addEventListener('click', () => {
        const picked = new Set([...b2.querySelectorAll('input:checked')].map((x) => x.value));
        if (picked.has('sun')) {
          mistakes++;
          shell.msg('Храна от слънчевата светлина си правят растенията, а не животните.', 'bad');
          return;
        }
        if (picked.size < 3) {
          mistakes++;
          shell.msg('Не си избрал всичко. Помисли за тичащия кон, за растящото пиле и за топлото тяло на котката.', 'bad');
          return;
        }
        b2.querySelectorAll('label').forEach((l) => { if (l.dataset.k !== 'sun') l.classList.add('right'); });
        b2.querySelectorAll('input').forEach((x) => { x.disabled = true; });
        sayAt(horse, '🐴 С енергията от храната конят тича, расте и пази тялото си топло.', 'good');
        const total = sortMistakes + mistakes;
        scores.push(stepScore(total, 4));
        shell.msg(total ? `Вярно! Грешки в тази стъпка: ${total}.` : 'Вярно! Без нито една грешка в тази стъпка!', 'good');
        const nx = b2.querySelector('.row');
        nx.innerHTML = '<button class="btn primary">Напред →</button>';
        nx.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
      });
    }, () => { mistakes++; });
  }

  // ---------- 3. Развитие ----------
  const ST = new V3(0.3, 0, 3.6);
  const station = new THREE.Group();
  station.position.copy(ST);
  station.visible = false;
  scene.add(station);
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.14, 32), mat(0xc8a26a));
  plat.position.y = 0.07;
  station.add(plat);
  const parts = { hen: new THREE.Group(), frog: new THREE.Group(), cat: new THREE.Group() };
  Object.values(parts).forEach((p) => { p.position.y = 0.14; station.add(p); });
  // кокошка
  const nest = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 8, 20), mat(0xc9a35a));
  nest.rotation.x = Math.PI / 2; nest.position.y = 0.06;
  const sEgg = eggModel(); sEgg.scale.setScalar(1.4);
  const halves = [0, 1].map((k) => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, k ? Math.PI / 2 : 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf5ebd8, side: THREE.DoubleSide }));
    h.scale.set(1.4, 1.8, 1.4);
    h.position.set(k ? 0.55 : -0.5, 0.1, 0.3);
    h.rotation.z = k ? 0.9 : -1.1;
    return h;
  });
  const sChick = chickModel(); const sHen = henModel();
  parts.hen.add(nest, sEgg, ...halves, sChick, sHen);
  // жаба
  const pondDisc = new THREE.Mesh(new THREE.CircleGeometry(1.0, 32), new THREE.MeshStandardMaterial({ color: 0x4a9ad8, roughness: 0.2 }));
  pondDisc.rotation.x = -Math.PI / 2; pondDisc.position.y = 0.01;
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), mat(0x9e9e9e, { flat: true }));
  rock.position.set(0.8, 0.08, 0.35); rock.scale.y = 0.6;
  const spawn = new THREE.Group();
  const jelly = new THREE.MeshStandardMaterial({ color: 0xe6f2e6, transparent: true, opacity: 0.55 });
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39; const r = 0.06 * Math.sqrt(i);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), jelly);
    e.position.set(Math.cos(a) * r, 0.05 + (i % 3) * 0.04, Math.sin(a) * r);
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), mat(0x111111));
    d.position.copy(e.position);
    spawn.add(e, d);
  }
  const sTad = tadpoleModel(); sTad.position.y = 0.12;
  const sFrog = frogModel();
  parts.frog.add(pondDisc, rock, spawn, sTad, sFrog);
  // котка
  const mom = catModel();
  mom.userData.legs.forEach((l) => { l.visible = false; });
  mom.position.y = -0.24;
  mom.scale.setScalar(1.8);
  const kits = [[0x555555, 0xbbbbbb], [0xffffff, 0xffffff], [0xf0a040, 0xffe2b8]].map(([col, bel]) => catModel(col, bel));
  parts.cat.add(mom, ...kits);
  function updateStation(cid, k, t) {
    for (const id in parts) parts[id].visible = id === cid;
    if (cid === 'hen') {
      sEgg.visible = k < 0.36;
      sEgg.rotation.z = k > 0.24 && k < 0.36 ? Math.sin(t * 14) * 0.15 : 0;
      halves.forEach((h) => { h.visible = k >= 0.36 && k < 0.6; });
      sChick.visible = k >= 0.36 && k < 0.72;
      sChick.scale.setScalar(lerp(1.3, 2.6, clamp01((k - 0.36) / 0.36)));
      sChick.userData.head.rotation.z = Math.sin(t * 4) > 0.4 ? -0.5 : 0;
      sHen.visible = k >= 0.72;
      sHen.scale.setScalar(lerp(0.65, 1.1, clamp01((k - 0.72) / 0.28)));
      sHen.userData.head.rotation.z = Math.sin(t * 2.2) > 0.5 ? -0.5 : 0;
      sHen.rotation.y = sChick.rotation.y = -0.4;
    } else if (cid === 'frog') {
      spawn.visible = k < 0.22;
      spawn.rotation.y = t * 0.2;
      sTad.visible = k >= 0.22 && k < 0.8;
      sTad.scale.setScalar(lerp(1.2, 2.6, clamp01((k - 0.22) / 0.4)));
      const ud = sTad.userData;
      ud.gills.visible = k < 0.5;
      ud.hind.forEach((l) => { l.visible = k >= 0.48; l.scale.setScalar(lerp(0.4, 1.2, clamp01((k - 0.48) / 0.15))); });
      ud.front.forEach((l) => { l.visible = k >= 0.6; });
      ud.tail.scale.setScalar(1 - 0.85 * clamp01((k - 0.62) / 0.18));
      ud.tail.rotation.y = Math.sin(t * 10) * 0.4;
      const a = t * 0.8;
      sTad.position.set(Math.cos(a) * 0.4, 0.12, Math.sin(a) * 0.3);
      sTad.rotation.y = Math.atan2(Math.cos(a) * 0.3, Math.sin(a) * 0.4) + Math.PI;
      sFrog.visible = k >= 0.8;
      const fk = clamp01((k - 0.8) / 0.14);
      sFrog.scale.setScalar(lerp(0.4, 0.75, fk));
      sFrog.position.set(lerp(0, 0.75, fk), lerp(0.02, 0.2, fk) + Math.sin(fk * Math.PI) * 0.3, lerp(0, 0.3, fk));
      sFrog.rotation.y = -0.6;
    } else {
      mom.userData.body.scale.set(1 + (k < 0.25 ? 0.22 : 0) + 0.04 * Math.sin(t * 3), 1, 1 + (k < 0.25 ? 0.22 : 0) + 0.04 * Math.sin(t * 3));
      mom.userData.head.rotation.y = Math.sin(t * 0.7) * 0.3;
      const grow = clamp01((k - 0.7) / 0.3);
      kits.forEach((kt, i) => {
        kt.visible = k >= 0.25;
        kt.userData.legs.forEach((l) => { l.visible = k >= 0.7; });
        const s = lerp(0.42, 0.85, grow);
        kt.scale.setScalar(s);
        const bx = -0.25 + i * 0.22;
        if (k < 0.7) {
          kt.position.set(bx, -0.05, 0.36);
          kt.rotation.y = Math.PI / 2;
          kt.userData.head.rotation.z = k >= 0.45 ? Math.sin(t * 6 + i) * 0.12 - 0.15 : -0.3;
        } else {
          const a = t * 0.9 + i * 2.1;
          kt.position.set(lerp(bx, Math.cos(a) * 0.75, grow), Math.abs(Math.sin(t * 5 + i)) * 0.04 * grow, lerp(0.33, 0.55 + Math.sin(a) * 0.2, grow));
          kt.rotation.y = lerp(Math.PI / 2, -a, grow);
          walkLegs(kt, t * 8 + i, 0.5);
        }
      });
    }
  }
  let stationState = null;
  stage.tick((dt, t) => { if (stationState) updateStation(stationState.cid, stationState.k, t); });

  function step3() {
    shell.step(2);
    clearTip();
    station.visible = true;
    fitView([ST.x, 0.55, ST.z], 2.3, 1.4, 0.4);
    let mistakes = 0;
    let ci = 0;
    const tabs = () => `<div class="animallife-tabs">${CYCLES.map((cy, i) => `<span class="${i < ci ? 'done' : i === ci ? 'cur' : ''}">${cy.icon} ${cy.name}</span>`).join('')}</div>`;
    const runCycle = () => {
      const cyc = CYCLES[ci];
      stationState = { cid: cyc.id, k: 0 };
      let lastSt = -1;
      shell.msg('');
      shell.task(`${tabs()}<p>Как се развива <b>${cyc.name.toLowerCase()}та</b>? <b>Плъзни лентата „Време“</b> до края и наблюдавай какво става.</p>`);
      shell.score(`Грешки в тази стъпка: ${mistakes}`);
      const ctrl = shell.setControls(`<div class="animallife-time"><label>Време <span class="animallife-stage tag"></span></label>
        <input type="range" class="animallife-range" min="0" max="100" value="0">
        <div class="animallife-ends"><span>начало</span><span>по-късно →</span></div></div><div class="animallife-ord"></div>`);
      const range = ctrl.querySelector('.animallife-range');
      const stLbl = ctrl.querySelector('.animallife-stage');
      let opened = false;
      const onInput = () => {
        const k = +range.value / 100;
        stationState.k = k;
        const si = stageIdx(cyc, k);
        stLbl.textContent = `${si + 1}. ${cyc.stages[si].t}`;
        if (si !== lastSt) {
          lastSt = si;
          say(new V3(ST.x, 1.2, ST.z), `<b>${si + 1}. ${esc(cyc.stages[si].t)}</b><br>${esc(cyc.stages[si].d)}`, 'wide', 0.2);
        }
        if (k >= 0.98 && !opened) { opened = true; orderTask(ctrl.querySelector('.animallife-ord')); }
      };
      range.addEventListener('input', onInput);
      onInput();
      function orderTask(el) {
        let order = shuffle(cyc.stages.map((s, i) => i));
        if (order.every((v, i) => v === i)) order = order.reverse();
        let nextI = 0; let wrongHere = 0;
        el.innerHTML = `<p class="animallife-q">Подреди етапите: кликни ги поред — от първия до последния.</p>
          <div class="animallife-order">${order.map((i) => `<button class="choice" data-o="${i}"><b></b>${esc(cyc.stages[i].t)}</button>`).join('')}</div>`;
        el.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
          const o = +b.dataset.o;
          if (o !== nextI) {
            mistakes++; wrongHere++;
            b.classList.add('wrong');
            setTimeout(() => b.classList.remove('wrong'), 700);
            const prev = nextI ? `след „${cyc.stages[nextI - 1].t}“` : 'най-напред';
            shell.msg(`„${cyc.stages[o].t}“ не е ${nextI ? 'следващият етап' : 'първият етап'}. ${wrongHere >= 2 ? `Подсказка: върни лентата назад и виж какво става ${prev}.` : 'Помисли какво става ' + prev + '.'}`, 'bad');
            shell.score(`Грешки в тази стъпка: ${mistakes}`);
            return;
          }
          b.classList.add('right'); b.disabled = true;
          b.querySelector('b').textContent = `${o + 1}.`;
          nextI++;
          shell.msg('');
          if (nextI === cyc.stages.length) {
            shell.msg(`Вярно! ${cyc.stages.map((s) => s.t).join(' → ')}.`, 'good');
            const row = document.createElement('div');
            row.className = 'row';
            row.innerHTML = `<button class="btn primary">${ci < CYCLES.length - 1 ? 'Следващото животно →' : 'Напред →'}</button>`;
            el.appendChild(row);
            row.querySelector('button').addEventListener('click', () => {
              ci++;
              if (ci < CYCLES.length) { runCycle(); return; }
              birthSort();
            });
          }
        }));
      }
    };
    const birthSort = () => {
      stationState = null;
      station.visible = false;
      clearTip();
      shell.msg('');
      shell.task(`<p>Едни животни <b>снасят яйца</b>, а други <b>раждат малки</b> и ги хранят с мляко.</p>
        <p><b>Провлачи всяко животно</b> в правилния кръг.</p>`);
      shell.setControls('');
      sortTask(SORT_BIRTH, (mist, cleanup) => {
        mistakes += mist;
        scores.push(stepScore(mistakes, 4));
        shell.msg(mistakes ? `Готово! Грешки в тази стъпка: ${mistakes}.` : 'Без нито една грешка в тази стъпка!', 'good');
        const c2 = shell.setControls('<button class="btn primary">Напред →</button>');
        c2.querySelector('button').addEventListener('click', () => { cleanup(); clearTip(); step4(); });
      });
    };
    runCycle();
  }

  // ---------- 4. Приложи и предскажи ----------
  function step4() {
    shell.step(3);
    let mistakes = 0;
    let qi = 0;
    const upd = () => shell.score(`Въпрос ${Math.min(qi + 1, 3)} от 3 · грешки: ${mistakes}`);
    const Q = [
      { view: () => fitView([-2.4, 0, 0.2], 2.7, 1.5, 0.55),
        ctx: 'Рибар извади риба от езерото и я остави на брега.',
        q: 'Какво ще стане с рибата?',
        items: ['Ще се задуши — хрилете ѝ не могат да вземат кислород от въздуха', 'Ще диша спокойно с хрилете си и на сушата', 'Ще започне да диша с бели дробове като жабата'],
        why: (i) => (i === 1 ? 'Хрилете вземат кислорода, който е разтворен във водата. Във въздуха те слепват.' : 'Повечето риби нямат бели дробове. Тази риба не може да си ги направи. Тя диша само с хриле.'),
        show: async () => {
          hold.add(fish);
          fish.userData.label.visible = false;
          fish.rotation.set(0, 0.3, 0);
          await hop(fish, new V3(-1.0, 0.1, 0.2), 0.8, 0.8);
          say(fish, 'Без вода хрилете слепват и рибата не може да диша. Бързо обратно във водата!', 'bad', 0.4);
          await phase(2.6, (k, dt, t) => { fish.rotation.x = Math.PI / 2 + Math.sin(t * 14) * 0.25; fish.position.y = 0.1 + Math.abs(Math.sin(t * 7)) * 0.08; });
          fish.rotation.x = 0;
          await hop(fish, new V3(-3.0, -0.25, -0.6), 0.8, 0.7);
          hold.delete(fish);
          fish.userData.label.visible = true;
          say(fish, '🐟 Във водата рибата отново диша с хрилете си.', 'good', 0.5);
        } },
      { view: () => fitView([-1.3, 0, 0.4], 2.4, 1.3, 0.5),
        ctx: 'Поповата лъжичка расте във водата.',
        q: 'Какво трябва да ѝ порасне, преди да излезе от водата и да живее на сушата?',
        items: ['Крака и бели дробове', 'По-големи хриле и по-дълга опашка', 'Перки и люспи'],
        why: (i) => (i === 1 ? 'С хриле не може да се диша на сушата, а опашката накрая изчезва.' : 'Перки и люспи имат рибите. Жабата има гладка влажна кожа.'),
        show: async () => {
          hold.add(tadpole);
          tadpole.userData.label.visible = false;
          tadpole.position.set(-1.6, -0.12, 0.35);
          tadpole.rotation.set(0, 0, 0);
          tadpole.scale.setScalar(2.2);
          const ud = tadpole.userData;
          say(tadpole, 'Растат крачета, а вътре — бели дробове. Хрилете и опашката изчезват.', 'wide', 0.4);
          await phase(3, (k) => {
            ud.hind.forEach((l) => { l.visible = k > 0.15; l.scale.setScalar(lerp(0.4, 1.2, clamp01(k * 2))); });
            ud.front.forEach((l) => { l.visible = k > 0.45; });
            ud.gills.visible = k < 0.4;
            ud.tail.scale.setScalar(1 - 0.9 * clamp01((k - 0.5) * 2));
          });
          tadpole.visible = false;
          const fr = frogModel();
          fr.scale.setScalar(0.5);
          fr.position.copy(tadpole.position).setY(-0.1);
          fr.rotation.y = 0.4;
          scene.add(fr);
          await hop(fr, new V3(-0.9, 0, 0.9), 0.8, 0.4);
          say(fr, '🐸 Малката жаба излезе на сушата. Сега тя диша с бели дробове.', 'good', 0.5);
        } },
      { view: () => fitView([-1, 0.2, -12.5], 6.5, 1.8, 0.28, 1.4),
        ctx: 'В морето зад брега плува делфин. Той прилича на голяма риба.',
        q: 'С какво диша делфинът?',
        items: ['С бели дробове — изплува, за да поеме въздух', 'С хриле, като рибите', 'Изобщо не диша'],
        why: (i) => (i === 1 ? 'Погледни делфина: от време на време той изплува, за да поеме въздух. Рибите не правят така.' : 'Всички животни дишат, дори и тези, които живеят във водата.'),
        show: async () => {
          say(dolphin, '🐬 Делфинът е бозайник, като кита. Той диша въздух с бели дробове през отвор на главата си, затова изплува. Делфините раждат малките си и ги хранят с мляко.', 'wide', 0.6);
          await wait(1.5);
        } },
    ];
    const ask = () => {
      const qq = Q[qi];
      upd();
      qq.view();
      clearTip();
      shell.task(`<p>${qq.ctx}</p>`);
      const box = shell.setControls('<div></div>').firstChild;
      choiceBox(box, qq.q, qq.items, 0, qq.why, async () => {
        shell.msg('Вярно! Да видим.', 'good');
        await qq.show();
        const last = qi === Q.length - 1;
        const r = document.createElement('div');
        r.className = 'row';
        r.innerHTML = `<button class="btn primary">${last ? 'Виж резултата' : 'Следващ въпрос →'}</button>`;
        box.appendChild(r);
        r.querySelector('button').addEventListener('click', () => {
          shell.msg('');
          if (!last) { qi++; ask(); return; }
          clearTip();
          scores.push(stepScore(mistakes, 3));
          const ratio = scores.reduce((x, y) => x + y, 0) / scores.length;
          shell.finish(ratio, onComplete, restart);
        });
      }, () => { mistakes++; upd(); });
    };
    ask();
  }

  step1();
  return {
    dispose() {
      if (stopDrag) stopDrag();
      while (flows.length) flows.pop().stop();
      menu.remove();
      stage.dispose();
    },
  };
}
