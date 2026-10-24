// 4.1.5 „Замърсители на въздуха, водата и почвата“ — долина с град, фабрика, път, река с риби, нива с трактор и сметище.
// Стъпки: опознай долината → намери замърсителите → поправи долината → опазва или замърсява? (+ предсказване).
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;

// ---------- стилове (само за този модул) ----------
function injectStyle() {
  if (document.getElementById('pollution-style')) return;
  const s = document.createElement('style');
  s.id = 'pollution-style';
  s.textContent = `
  .pollution-q { margin:10px 0 4px; font-weight:700; }
  .xp-controls .choices.pollution-pick { grid-template-columns: repeat(3, 1fr); }
  .xp-controls .choices.pollution-pick .choice { flex-direction:column; justify-content:center; gap:2px; padding:8px 4px; font-weight:700; text-align:center; }
  .xp-controls .choices.pollution-pick .choice span { font-size:1.5rem; }
  .pollution-tally { display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-top:8px; }
  .pollution-tally div { border:1px solid #dfe5ee; border-radius:8px; padding:5px 6px; font-size:.8rem; background:#fbfcfe; min-height:3.2em; }
  .pollution-tally b { display:block; font-size:.85rem; margin-bottom:2px; }
  .pollution-tally i { display:block; font-style:normal; color:#0d7a3a; font-weight:700; }
  `;
  document.head.appendChild(s);
}

// ---------- данни ----------
const PLACES = [
  { id: 'air', label: 'Въздух', icon: '🌬️',
    note: '<b>Въздухът</b> е смес от газове. Дишаме го ние, животните и растенията. Чистият въздух е прозрачен и няма мирис.' },
  { id: 'water', label: 'Вода', icon: '💧',
    note: '<b>Реката</b> дава вода на хората, животните и растенията. В чистата вода живеят риби. Водата тече надолу — от планината през долината.' },
  { id: 'soil', label: 'Почва', icon: '🟫',
    note: '<b>Почвата</b> на нивата храни растенията, от които получаваме храна. В нея живеят червеи и много малки организми.' },
  { id: 'factory', label: 'Фабрика', icon: '🏭',
    note: '<b>Фабриката</b> прави неща, от които имаме нужда. Тя има висок <b>комин</b> и <b>тръба</b>, която стига до реката.' },
  { id: 'cars', label: 'Път с коли', icon: '🚗',
    note: 'По <b>пътя</b> минават коли. В двигателя им гори бензин или нафта. Отзад, през ауспуха, излизат газове.' },
  { id: 'tractor', label: 'Нива с трактор', icon: '🚜',
    note: 'Фермерът отглежда храна. <b>Тракторът</b> обработва нивата. Понякога пръска химикали срещу вредители и плевели.' },
  { id: 'dump', label: 'Сметище', icon: '🗑️',
    note: 'На <b>сметището</b> всичко е изхвърлено на една купчина: пластмаса, стъкло, хартия, стари батерии и гуми.' },
];
const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));

const CATS = [
  { label: 'Въздуха', icon: '🌫️', short: 'Въздух' },
  { label: 'Водата', icon: '💧', short: 'Вода' },
  { label: 'Почвата', icon: '🟫', short: 'Почва' },
];
const CAT_COL = [0x78909c, 0x1e88e5, 0x8d6e63];

// Източници на замърсяване (стъпки 2 и 3).
const SRC = [
  { id: 'chimney', name: 'Комин на фабриката', cat: 0,
    on: 'От комина излиза <b>дим</b> със сажди, прах и вредни газове. Небето става сиво и мътно.',
    ok: 'Вярно! Димът от комина замърсява въздуха.',
    why: { 1: 'Погледни накъде отива димът — той се издига нагоре, към небето.', 2: 'Погледни накъде отива димът — той се издига нагоре, към небето.' },
    hint: 'димът се носи там, където летят птиците и плуват облаците.' },
  { id: 'cars', name: 'Колите по пътя', cat: 0,
    on: 'От ауспусите излизат <b>изгорели газове</b>. Колкото повече коли, толкова повече газове.',
    ok: 'Вярно! Изгорелите газове от колите замърсяват въздуха.',
    why: { 1: 'Колите не минават през реката, а газовете излизат от ауспуха. Погледни как небето става по-сиво.', 2: 'Газовете не попиват в земята. Погледни как небето става по-сиво.' },
    hint: 'газовете се смесват с това, което дишаме.' },
  { id: 'pipe', name: 'Тръбата на фабриката', cat: 1,
    on: 'По тръбата фабриката изпуска <b>отпадъчни води</b> — мръсна вода с вредни вещества. Рибите се скриха!',
    ok: 'Вярно! Отпадъчните води замърсяват реката.',
    why: { 0: 'От тръбата не излиза дим. Проследи тръбата — къде се излива мръсната вода?', 2: 'Тръбата не стига до нивата. Проследи я — къде се излива мръсната вода?' },
    hint: 'виж какъв цвят стана реката след тръбата.' },
  { id: 'litter', name: 'Боклук в реката', cat: 1,
    on: 'Някой е хвърлил <b>пластмасови шишета</b> в реката. Водата ги отнася надолу. Пластмасата не изгнива стотици години.',
    ok: 'Вярно! Шишетата замърсяват водата. Риби и птици могат да ги объркат с храна.',
    why: { 0: 'Шишетата не пускат дим. Погледни къде плават те.', 2: 'Шишетата не са на нивата. Погледни къде плават те.' },
    hint: 'шишетата плават.' },
  { id: 'tractor', name: 'Химикали на нивата', cat: 2,
    on: 'Тракторът пръска <b>химикали</b> срещу вредители и плевели. Когато са прекалено много, те тровят почвата и малките организми в нея.',
    ok: 'Вярно! Химикалите попиват в почвата. С дъжда част от тях може да стигне и до реката.',
    why: { 0: 'Капчиците се носят малко във въздуха, но падат върху нивата. Погледни какво става със земята и растенията.', 1: 'С дъжда част от химикалите може да стигне и до реката, но най-напред те попадат другаде. Погледни земята под трактора.' },
    hint: 'виж как пожълтяват растенията на нивата.' },
  { id: 'dump', name: 'Сметище', cat: 2,
    on: 'От купчината отпадъци изтичат <b>вредни вещества</b> — например от старите батерии. Земята около сметището посивява и нищо не расте.',
    ok: 'Вярно! Сметището замърсява почвата около себе си.',
    why: { 0: 'Сметището не гори, затова няма дим. Погледни земята около купчината.', 1: 'Реката е далеч от сметището. Погледни земята около купчината.' },
    hint: 'погледни сивото петно около купчината.' },
];
const SRCBY = Object.fromEntries(SRC.map((s) => [s.id, s]));

const SOL = {
  chimney: { label: 'Филтър на комина', icon: '🧰', against: 'дима от комина',
    done: 'Филтърът задържа саждите и праха. От комина излиза почти само бяла водна пара.',
    hint: 'търси нещо, което задържа праха вътре в комина.' },
  cars: { label: 'Велосипеди и градски транспорт', icon: '🚲', against: 'газовете от колите',
    done: 'Един автобус вози толкова хора, колкото много коли. Колелото не изпуска никакви газове.',
    hint: 'как могат хората да пътуват с по-малко коли?' },
  pipe: { label: 'Пречиствателна станция', icon: '🚰', against: 'мръсната вода от тръбата',
    done: 'Станцията почиства водата, преди да я пусне в реката. Рибите се връщат!',
    hint: 'водата трябва да се почисти, преди да стигне до реката.' },
  litter: { label: 'Почистване на брега и кошче', icon: '🧹', against: 'боклука в реката',
    done: 'Шишетата са събрани. Боклукът се хвърля в кошче, а не в реката.',
    hint: 'някой трябва да събере шишетата и да има къде да ги хвърля.' },
  tractor: { label: 'Компост вместо химикали', icon: '🍂', against: 'химикалите на нивата',
    done: 'Компостът е от изгнили остатъци от растения. Той храни почвата, без да я трови.',
    hint: 'почвата може да се нахрани с нещо естествено.' },
  dump: { label: 'Разделно събиране и рециклиране', icon: '♻️', against: 'купчината отпадъци',
    done: 'Хартията, пластмасата и стъклото се събират отделно и се рециклират — от тях се правят нови неща.',
    hint: 'отпадъците могат да се подредят по вид и да се използват отново.' },
};

// Стъпка 4: ежедневни действия.
const ACTS = [
  { id: 'bins', name: 'Сортирам отпадъците', zone: 0, say: 'Разделно събраните отпадъци се рециклират и не трупат сметища.' },
  { id: 'bike', name: 'Карам колело до училище', zone: 0, say: 'Колелото не изпуска газове — въздухът остава чист.' },
  { id: 'tree', name: 'Засаждам дърво', zone: 0, say: 'Дърветата пречистват въздуха и пазят почвата.' },
  { id: 'bottle', name: 'Хвърлям шише в реката', zone: 1, say: 'Пластмасата замърсява водата и вреди на рибите и птиците.' },
  { id: 'tire', name: 'Паля стари гуми', zone: 1, say: 'Горящите гуми пускат черен, вреден дим във въздуха.' },
  { id: 'battery', name: 'Хвърлям батерии в общия кош', zone: 1, say: 'Батериите съдържат вредни вещества. Събират се в специални кутии.' },
];

// ---------- помощни модели ----------
let puffTex = null;
function getPuffTex() {
  if (puffTex) return puffTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  puffTex = new THREE.CanvasTexture(c);
  puffTex.colorSpace = THREE.SRGBColorSpace;
  return puffTex;
}
function riverTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d9e6f0';
  ctx.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.5})`;
    ctx.fillRect(6 + Math.random() * 52, Math.random() * 256, 2 + Math.random() * 3, 10 + Math.random() * 24);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function lathe(pts, m, seg = 16) {
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), m);
}
function bottleModel(color = 0x81d4fa) {
  const g = new THREE.Group();
  const b = lathe([[0, 0], [0.1, 0], [0.1, 0.28], [0.04, 0.36], [0.035, 0.4], [0, 0.4]], new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.8, roughness: 0.2 }));
  b.rotation.z = Math.PI / 2;
  b.position.x = 0.2;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8), mat(0x1565c0));
  cap.rotation.z = Math.PI / 2;
  cap.position.x = -0.22;
  g.add(b, cap);
  return g;
}
function treeModel(scale = 1, pine = false) {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 5), mat(0x7a5230));
  trunk.position.y = 0.17;
  t.add(trunk);
  if (pine) {
    const m = mat(0x2f7d3a, { flat: true });
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.8, 6), m); c1.position.y = 0.65;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 6), m); c2.position.y = 0.98;
    t.add(c1, c2);
  } else {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 0), mat(0x58a83c, { flat: true }));
    b.position.y = 0.62;
    t.add(b);
  }
  t.scale.setScalar(scale);
  return t;
}
function carModel(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.36), mat(color, { roughness: 0.4 }));
  body.position.y = 0.17;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.17, 0.32), mat(0xdfeefa, { roughness: 0.2 }));
  cab.position.set(-0.04, 0.35, 0);
  g.add(body, cab);
  const wm = mat(0x222222);
  for (const [x, z] of [[0.22, 0.17], [-0.22, 0.17], [0.22, -0.17], [-0.22, -0.17]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10), wm);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.08, z);
    g.add(w);
  }
  return g;
}
function bikeModel(color) {
  const g = new THREE.Group();
  const wm = mat(0x263238);
  for (const x of [0.2, -0.2]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 6, 16), wm);
    w.position.set(x, 0.14, 0);
    g.add(w);
  }
  const fr = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.03), mat(color));
  fr.position.y = 0.24;
  g.add(fr);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 8), mat(color));
  body.position.set(-0.03, 0.42, 0);
  body.rotation.z = -0.25;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0xffcc99));
  head.position.set(0.02, 0.62, 0);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffb300));
  helm.position.copy(head.position);
  g.add(body, head, helm);
  return g;
}
function actModel(kind) {
  const g = new THREE.Group();
  const add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m; };
  if (kind === 'bins') {
    [0x1e88e5, 0xfdd835, 0x43a047].forEach((c, i) => {
      add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), mat(c)), (i - 1) * 0.24, 0.16, 0);
      add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.22), mat(new THREE.Color(c).multiplyScalar(0.7).getHex())), (i - 1) * 0.24, 0.34, 0);
    });
  } else if (kind === 'bike') {
    g.add(bikeModel(0x43a047));
  } else if (kind === 'tree') {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.08, 12), mat(0x5d4037)), 0, 0.04, 0);
    const t = treeModel(0.75); t.position.y = 0.05; g.add(t);
  } else if (kind === 'bottle') {
    const b = bottleModel(); b.position.y = 0.1; g.add(b);
    const w = add(new THREE.Mesh(new THREE.CircleGeometry(0.32, 18), mat(0x4a90d9, { transparent: true, opacity: 0.6 })), 0, 0.01, 0);
    w.rotation.x = -Math.PI / 2;
  } else if (kind === 'tire') {
    const t = add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.08, 8, 16), mat(0x212121)), 0, 0.08, 0);
    t.rotation.x = Math.PI / 2;
    const fm = new THREE.MeshBasicMaterial({ color: 0xff7043 });
    for (let i = 0; i < 4; i++) {
      const f = add(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 6), fm), Math.cos(i * 1.6) * 0.12, 0.25, Math.sin(i * 1.6) * 0.12);
      f.userData.flame = i;
    }
    for (let i = 0; i < 3; i++) add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0x424242, { transparent: true, opacity: 0.7 })), 0.05 * i, 0.45 + i * 0.14, 0);
  } else if (kind === 'battery') {
    for (let i = 0; i < 2; i++) {
      const b = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 14), mat(0x263238)), 0, 0.06, -0.08 + i * 0.16);
      b.rotation.z = Math.PI / 2;
      b.rotation.y = i * 0.5;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.1, 14), mat(0xffb300));
      band.position.y = 0.08;
      b.add(band);
    }
    const bin = add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.32, 12), mat(0x9e9e9e)), 0.3, 0.16, 0);
    bin.userData.bin = 1;
  }
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
  const STEPS = ['Опознай долината', 'Намери замърсителите', 'Почисти долината', 'Опазва или замърсява?'];
  const shell = createShell(container, { steps: STEPS });
  const SKY = new THREE.Color(0xbfe3ff); const SMOG = new THREE.Color(0xa9a79c);
  const stage = createStage(shell.stageEl, {
    background: 0xbfe3ff, camPos: [0, 10, 20], target: [0, 1, 0],
    fog: { color: 0xbfe3ff, near: 30, far: 70 }, minDistance: 2.5, maxDistance: 34, maxPolarAngle: Math.PI * 0.45,
  });
  const { scene, camera } = stage;
  stage.controls.minAzimuthAngle = -1.0;
  stage.controls.maxAzimuthAngle = 1.0;
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
  const grow = (g, dur = 0.7) => { g.visible = true; return phase(dur, (k) => g.scale.setScalar(Math.max(0.001, ease(k)))); };
  const shrink = (g, dur = 0.6) => phase(dur, (k) => g.scale.setScalar(Math.max(0.001, 1 - ease(k)))).then(() => { g.visible = false; });

  // Състояние на източниците: 0 спокоен, 1 замърсява, 2 поправен.
  const state = Object.fromEntries(SRC.map((s) => [s.id, 0]));

  // ---------- земя, планини ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(28, 20), mat(0x8cc56a));
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -1;
  scene.add(ground);
  const mtnM = mat(0x8d9aa5, { flat: true }); const snowM = mat(0xf7fbff, { flat: true });
  for (const [x, z, r, h] of [[-8, -10, 3.2, 4.2], [-3, -11, 3.6, 5.2], [2.8, -10.5, 3.4, 5.6], [8, -10, 3.4, 4.4], [12, -9, 2.6, 3.4], [-12, -9, 2.8, 3.2]]) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mtnM);
    m.position.set(x, h / 2 - 0.05, z);
    const sn = new THREE.Mesh(new THREE.ConeGeometry(r * 0.32, h * 0.32, 7), snowM);
    sn.position.set(x, h - h * 0.16 - 0.03, z);
    scene.add(m, sn);
  }
  for (const [x, z, r] of [[-6, -7, 2.2], [6, -7.2, 2.4], [-11, -4, 2], [11.5, -3, 2.1]]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7cb85a, { flat: true }));
    hl.scale.y = 0.45;
    hl.position.set(x, 0, z);
    scene.add(hl);
  }

  // ---------- река ----------
  const riverCurve = new THREE.CatmullRomCurve3([
    [3.4, 0, -8.6], [2.9, 0, -6], [1.8, 0, -3], [0.7, 0, -0.2], [0.3, 0, 1.5], [-0.2, 0, 4], [-1.1, 0, 6.5], [-1.6, 0, 9],
  ].map((p) => new V3(...p)));
  const RN = 120;
  const rPts = riverCurve.getSpacedPoints(RN - 1);
  const rNrm = rPts.map((p, i) => {
    const tg = (i < RN - 1 ? rPts[i + 1].clone().sub(p) : p.clone().sub(rPts[i - 1])).setY(0).normalize();
    return new V3(-tg.z, 0, tg.x);
  });
  const rW = (i) => 0.45 + (i / RN) * 0.25;
  const RY = 0.035;
  function ribbon(widthF, y, material, withColor) {
    const v = []; const uv = []; const idx = [];
    let acc = 0;
    for (let i = 0; i < RN; i++) {
      const p = rPts[i]; const n = rNrm[i]; const w = widthF(i);
      if (i > 0) acc += p.distanceTo(rPts[i - 1]);
      v.push(p.x + n.x * w, y, p.z + n.z * w, p.x - n.x * w, y, p.z - n.z * w);
      uv.push(0, acc / 1.6, 1, acc / 1.6);
      if (i < RN - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (withColor) geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(RN * 6).fill(1), 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
  }
  scene.add(ribbon((i) => rW(i) + 0.16, 0.015, mat(0xd8c48e), false));
  const rTex = riverTexture();
  const riverMat = new THREE.MeshStandardMaterial({ map: rTex, vertexColors: true, roughness: 0.3, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  const river = ribbon(rW, RY, riverMat, true);
  river.renderOrder = 2;
  river.userData.pickId = 'water';
  scene.add(river);
  const rColA = river.geometry.attributes.color;
  const CLEAN = new THREE.Color(0x3f8fd6); const MURKY = new THREE.Color(0x7d7444);
  const P = new Float32Array(RN); // замърсяване по течението, 0…1
  const nearestIdx = (x, z) => { let b = 0; let bd = Infinity; rPts.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; b = i; } }); return b; };
  const riverAt = (s) => { // s: 0…RN-1 → точка и нормала
    const i = Math.max(0, Math.min(RN - 2, Math.floor(s))); const f = s - i;
    return { p: rPts[i].clone().lerp(rPts[i + 1], f), n: rNrm[i], i: Math.round(s) };
  };

  // ---------- път и мост ----------
  const ROADZ = 1.6;
  const road = new THREE.Mesh(new THREE.BoxGeometry(26, 0.06, 1.2), mat(0x5f6368));
  road.position.set(0, 0.04, ROADZ);
  scene.add(road);
  for (let i = 0; i < 18; i++) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    d.position.set(-12.5 + i * 1.5, 0.075, ROADZ);
    scene.add(d);
  }
  const bi = nearestIdx(0.3, ROADZ);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.06), mat(0xa1887f));
    rail.position.set(rPts[bi].x, 0.15, ROADZ + s * 0.62);
    scene.add(rail);
  }

  // ---------- град и фабрика ----------
  const FAC = new V3(-3.6, 0, -3.2);
  const factory = new THREE.Group();
  factory.position.copy(FAC);
  factory.userData.pickId = 'chimney';
  const fb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 1.5), mat(0xcfc6b4));
  fb.position.y = 0.65;
  factory.add(fb);
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5, 3, 1), mat(0x90a4ae, { flat: true }));
    r.rotation.x = Math.PI / 2;
    r.position.set(-0.8 + i * 0.8, 1.42, 0);
    factory.add(r);
  }
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.02), mat(0x37474f));
    w.position.set(-0.9 + i * 0.6, 0.75, 0.76);
    factory.add(w);
  }
  const chimney = new THREE.Group();
  chimney.position.set(-0.75, 0, -0.35);
  const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 3.6, 12), mat(0xb0463c));
  ch.position.y = 1.8;
  chimney.add(ch);
  for (const y of [2.6, 3.3]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.24, 0.22, 12), mat(0xf5f5f5));
    band.position.y = y;
    chimney.add(band);
  }
  const filter = new THREE.Group();
  const flt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.36, 12), mat(0x26a69a, { roughness: 0.4 }));
  filter.add(flt);
  const fl = labelSprite('филтър', { size: 0.26 });
  fl.position.set(0.85, 0, 0);
  filter.add(fl);
  filter.position.y = 3.45;
  filter.visible = false;
  chimney.add(filter);
  factory.add(chimney);
  scene.add(factory);
  addHitBox(factory, 1);
  const CHIM_TOP = new V3(FAC.x - 0.75, 3.7, FAC.z - 0.35);

  // тръба до реката
  const pi = nearestIdx(1.8, -3);
  const pipeEndX = rPts[pi].x - rW(pi) + 0.05;
  const PZ = rPts[pi].z;
  const pipe = new THREE.Group();
  pipe.userData.pickId = 'pipe';
  const pStart = FAC.x + 1.2;
  const pLen = pipeEndX - pStart;
  const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, pLen, 10), mat(0x78909c, { roughness: 0.4, metalness: 0.3 }));
  pm.rotation.z = Math.PI / 2;
  pm.position.set(pStart + pLen / 2, 0.32, PZ);
  pipe.add(pm);
  for (let i = 1; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), mat(0x607d8b));
    leg.position.set(pStart + (pLen * i) / 4, 0.15, PZ);
    pipe.add(leg);
  }
  scene.add(pipe);
  addHitBox(pipe, 0.9);
  const PIPE_END = new V3(pipeEndX + 0.05, 0.3, PZ);
  // пречиствателна станция (появява се в стъпка 3)
  const plant = new THREE.Group();
  plant.position.set(pStart + pLen * 0.55, 0, PZ);
  for (const dz of [-0.75, 0.75]) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.45, 20), mat(0xb0bec5));
    tank.position.set(0, 0.22, dz);
    const wtr = new THREE.Mesh(new THREE.CircleGeometry(0.44, 20), mat(0x4fc3f7, { roughness: 0.2 }));
    wtr.rotation.x = -Math.PI / 2;
    wtr.position.set(0, 0.455, dz);
    plant.add(tank, wtr);
  }
  const plBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), mat(0xeceff1));
  plBox.position.set(0, 0.25, 0);
  plant.add(plBox);
  const pll = labelSprite('пречиствателна станция', { size: 0.24 });
  pll.position.set(0, 1.0, 0);
  plant.add(pll);
  plant.visible = false;
  scene.add(plant);

  const houseCols = [0xf3e3c3, 0xffffff, 0xf6d4b0, 0xe8f0d8];
  [[-8.6, -3.6, 0.3], [-7.2, -1.2, -0.2], [-9.4, -1.0, 0.5], [-6.4, -4.6, 0.1], [-5.6, -0.2, -0.3], [-10, -5, 0]].forEach(([x, z, ry], i) => {
    const hG = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.7), mat(houseCols[i % 4]));
    body.position.y = 0.3;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.66, 0.46, 4), mat(0xc0482f, { flat: true }));
    roof.position.y = 0.83;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, 0.85);
    hG.add(body, roof);
    hG.position.set(x, 0, z);
    hG.rotation.y = ry;
    scene.add(hG);
  });
  const swayers = [];
  for (const [x, z, s, pine] of [[-10.5, -2.4, 1, 1], [-7.8, -5.6, 0.9, 1], [-4.6, -5.6, 1.1, 1], [-1.6, -6, 1, 1], [-0.8, -4.8, 0.8, 0], [4.2, -6.6, 1, 1],
    [9.8, -6.2, 0.9, 1], [10.6, 0.4, 0.9, 0], [9.4, 2.6, 1, 0], [3.4, 6.6, 0.9, 0], [-9.6, 3.6, 1.1, 0], [-10.6, 6, 0.9, 1], [2.4, -0.6, 0.8, 0], [-2.6, -1.2, 0.8, 0]]) {
    const t = treeModel(s * 1.2, !!pine);
    t.position.set(x, 0, z);
    t.userData.ph = x + z;
    scene.add(t);
    swayers.push(t);
  }

  // ---------- коли, автобус, колела ----------
  const cars = [];
  [[0xd33c3c, -8, 1], [0x1e88e5, -1, 1], [0xfdd835, 4, -1], [0x8e24aa, -5, -1]].forEach(([c, x, dir]) => {
    const g = carModel(c);
    g.userData.pickId = 'cars';
    g.userData.dir = dir;
    g.position.set(x, 0.07, ROADZ - dir * 0.3);
    g.rotation.y = dir > 0 ? 0 : Math.PI;
    scene.add(g);
    addHitBox(g, 0.8);
    cars.push(g);
  });
  const bus = new THREE.Group();
  const bb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.42), mat(0x43a047, { roughness: 0.4 }));
  bb.position.y = 0.32;
  const bw = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.13, 0.43), mat(0xdfeefa, { roughness: 0.2 }));
  bw.position.y = 0.4;
  bus.add(bb, bw);
  for (const x of [0.5, -0.5]) for (const z of [0.2, -0.2]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 10), mat(0x222222));
    w.rotation.x = Math.PI / 2; w.position.set(x, 0.1, z); bus.add(w);
  }
  const busL = labelSprite('автобус', { size: 0.22 });
  busL.position.y = 0.85;
  bus.add(busL);
  bus.position.set(-11, 0.07, ROADZ - 0.3);
  bus.userData.dir = 1;
  bus.visible = false;
  scene.add(bus);
  const bikes = [0xe53935, 0x1e88e5].map((c, i) => {
    const b = bikeModel(c);
    b.position.set(-3 + i * 7, 0.07, ROADZ + 0.3);
    b.rotation.y = Math.PI;
    b.userData.dir = -1;
    b.visible = false;
    scene.add(b);
    return b;
  });

  // ---------- нива с трактор ----------
  const FIELD = new V3(6.6, 0, -3.2);
  const fieldM = mat(0x6d4c2f, { roughness: 1 });
  const field = new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 4.4), fieldM);
  field.position.set(FIELD.x, 0.04, FIELD.z);
  field.userData.pickId = 'soil';
  scene.add(field);
  const cropM = mat(0x5cb33c, { flat: true });
  const crops = [];
  for (let r = 0; r < 8; r++) {
    const z = FIELD.z - 1.9 + r * 0.54;
    if (Math.abs(z - FIELD.z) < 0.3) continue;
    for (let c = 0; c < 14; c++) crops.push([FIELD.x - 2.7 + c * 0.41, z]);
  }
  const cropIM = new THREE.InstancedMesh(new THREE.ConeGeometry(0.11, 0.32, 5), cropM, crops.length);
  const dmy = new THREE.Object3D();
  function placeCrops(k) {
    crops.forEach(([x, z], i) => {
      dmy.position.set(x, 0.08 + 0.16 * k, z);
      dmy.scale.set(1, k, 1);
      dmy.rotation.set(0, 0, 0);
      dmy.updateMatrix();
      cropIM.setMatrixAt(i, dmy.matrix);
    });
    cropIM.instanceMatrix.needsUpdate = true;
  }
  placeCrops(1);
  scene.add(cropIM);
  const tractor = new THREE.Group();
  tractor.userData.pickId = 'tractor';
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.32, 0.46), mat(0xd32f2f, { roughness: 0.5 }));
  tb.position.set(0.15, 0.36, 0);
  const tc = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.44), mat(0xe3f2fd, { roughness: 0.2 }));
  tc.position.set(-0.12, 0.72, 0);
  const tr = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.5), mat(0xd32f2f));
  tr.position.set(-0.12, 0.95, 0);
  tractor.add(tb, tc, tr);
  const twm = mat(0x263238);
  for (const [x, r, z] of [[-0.18, 0.28, 0.3], [-0.18, 0.28, -0.3], [0.4, 0.15, 0.27], [0.4, 0.15, -0.27]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 14), twm);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, r, z);
    tractor.add(w);
  }
  const boom = new THREE.Group();
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.4, 12), mat(0xeeeeee));
  tank.rotation.x = Math.PI / 2;
  tank.position.set(-0.6, 0.5, 0);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.2), mat(0x546e7a));
  arm.position.set(-0.75, 0.35, 0);
  boom.add(tank, arm);
  tractor.add(boom);
  const trailer = new THREE.Group();
  const trb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.5), mat(0x8d6e63));
  trb.position.set(-0.85, 0.32, 0);
  const heap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x4e342e, { flat: true }));
  heap.position.set(-0.85, 0.41, 0);
  heap.scale.y = 0.6;
  const trl = labelSprite('компост', { size: 0.22 });
  trl.position.set(-0.85, 0.95, 0);
  trailer.add(trb, heap, trl);
  trailer.visible = false;
  tractor.add(trailer);
  tractor.position.set(FIELD.x, 0.08, FIELD.z);
  scene.add(tractor);
  addHitBox(tractor, 1);

  // ---------- сметище ----------
  const DUMP = new V3(6.6, 0, 4.4);
  const dumpG = new THREE.Group();
  dumpG.position.copy(DUMP);
  dumpG.userData.pickId = 'dump';
  const patchM = new THREE.MeshStandardMaterial({ color: 0x8b8578, roughness: 1, transparent: true, opacity: 0.95 });
  const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 28), patchM);
  patch.rotation.x = -Math.PI / 2;
  patch.position.y = 0.012;
  patch.scale.setScalar(1.3);
  dumpG.add(patch);
  const pile = new THREE.Group();
  const pileBase = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x8a7f6a, { flat: true }));
  pileBase.scale.y = 0.6;
  pile.add(pileBase);
  const junkCols = [0xeeeeee, 0x1e88e5, 0xfdd835, 0xe53935, 0x6d4c41, 0x43a047, 0xffffff];
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4; const r = 0.25 + (i % 4) * 0.17;
    const y = 0.5 - r * 0.45;
    let m;
    if (i % 5 === 0) { m = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 6, 12), mat(0x212121)); m.rotation.x = 1.2; }
    else if (i % 3 === 0) { m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), mat(junkCols[i % 7], { flat: true })); }
    else { m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.16), mat(junkCols[i % 7])); m.rotation.set(i, i * 0.7, 0); }
    m.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    pile.add(m);
  }
  dumpG.add(pile);
  const bins = new THREE.Group();
  [[0x1e88e5, 'хартия'], [0xfdd835, 'пластмаса'], [0x43a047, 'стъкло']].forEach(([c, n], i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.55), mat(c));
    b.position.set((i - 1) * 0.75, 0.35, 0);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), mat(new THREE.Color(c).multiplyScalar(0.7).getHex()));
    lid.position.set((i - 1) * 0.75, 0.73, 0);
    const l = labelSprite(n, { size: 0.2 });
    l.position.set((i - 1) * 0.75, 1.0 + (i % 2) * 0.22, 0);
    bins.add(b, lid, l);
  });
  bins.visible = false;
  dumpG.add(bins);
  scene.add(dumpG);
  addHitBox(dumpG, 1.2);
  const flowers = [];
  for (let i = 0; i < 10; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat([0xffeb3b, 0xffffff, 0xf06292][i % 3]));
    const a = i * 0.63;
    f.position.set(DUMP.x + Math.cos(a) * 1.7, 0.1, DUMP.z + Math.sin(a) * 1.4);
    f.scale.setScalar(0.001);
    scene.add(f);
    flowers.push(f);
  }

  // ---------- боклук на брега ----------
  const li = nearestIdx(0, 3.4);
  const LIT = rPts[li].clone().add(rNrm[li].clone().multiplyScalar(-(rW(li) + 0.55)));
  const litter = new THREE.Group();
  litter.position.copy(LIT);
  litter.userData.pickId = 'litter';
  const lb1 = bottleModel(0x81d4fa); lb1.position.set(0.1, 0.1, 0.25); lb1.rotation.y = 0.8;
  const lb2 = bottleModel(0xa5d6a7); lb2.position.set(-0.2, 0.1, -0.2); lb2.rotation.y = 2.2;
  const bag = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), mat(0xf5f5f5, { flat: true }));
  bag.position.set(0.3, 0.12, -0.15);
  litter.add(lb1, lb2, bag);
  scene.add(litter);
  addHitBox(litter, 0.9);
  const binG = new THREE.Group();
  const bn = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.5, 12), mat(0x2e7d32));
  bn.position.y = 0.25;
  const bnl = labelSprite('кошче', { size: 0.2 });
  bnl.position.y = 0.75;
  binG.add(bn, bnl);
  binG.position.copy(LIT).add(new V3(0.35, 0, 0));
  binG.visible = false;
  scene.add(binG);
  const floaters = [];
  for (let i = 0; i < 6; i++) {
    const b = bottleModel([0x81d4fa, 0xa5d6a7, 0xffffff][i % 3]);
    b.scale.setScalar(0.9);
    b.visible = false;
    b.userData.s = li + (i / 6) * (RN - 1 - li);
    b.userData.lat = ((i % 3) - 1) * 0.22;
    scene.add(b);
    floaters.push(b);
  }

  // ---------- риби ----------
  const fish = [];
  [[18, 12, 0.5, 0xff8f00], [36, 8, 0.4, 0xb0bec5], [62, 10, 0.45, 0xff7043], [80, 9, 0.5, 0x90a4ae], [96, 8, 0.35, 0xffb300]].forEach(([s0, amp, sp, c], k) => {
    const f = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), mat(c, { roughness: 0.4 }));
    body.scale.set(1.6, 0.6, 0.55);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), mat(c));
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.3;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), mat(0x111111));
    eye.position.set(0.17, 0.03, 0.06);
    f.add(body, tail, eye);
    f.userData = { s0, amp, sp, ph: k * 1.7, hide: 0, tail, jump: 0, jt: 3 + k * 2.3, lat: ((k % 3) - 1) * 0.15 };
    scene.add(f);
    fish.push(f);
  });

  // ---------- небе: слънце, облаци, птици ----------
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffd84a, fog: false }));
  sunBall.position.set(-9, 9, -12);
  scene.add(sunBall);
  const clouds = [];
  const cloudMats = [];
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const m = new THREE.SpriteMaterial({ map: getPuffTex(), color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false });
      cloudMats.push(m);
      const p = new THREE.Sprite(m);
      p.scale.setScalar(1.8 + (j % 2) * 0.7);
      p.position.set(j * 0.9 - 1.3, (j % 2) * 0.35, 0);
      c.add(p);
    }
    c.position.set(-12 + i * 7, 6.2 + (i % 2) * 0.8, -6 + (i % 2) * 2);
    scene.add(c);
    clouds.push(c);
  }
  const birds = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group();
    const wings = [];
    for (const s of [1, -1]) {
      const hinge = new THREE.Group();
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.4), mat(0x37474f));
      w.position.z = s * 0.2;
      hinge.add(w);
      b.add(hinge);
      wings.push({ hinge, s });
    }
    b.userData = { wings, ph: i * 2.1, r: 2 + i * 0.8, vis: 1 };
    scene.add(b);
    birds.push(b);
  }

  // ---------- частици: дим, капки ----------
  const puffs = [];
  for (let i = 0; i < 150; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: getPuffTex(), transparent: true, depthWrite: false }));
    s.visible = false;
    s.userData = { life: 0, max: 1, v: new V3(), s0: 0.3, s1: 1, op: 0.6 };
    scene.add(s);
    puffs.push(s);
  }
  const dropGeo = new THREE.SphereGeometry(0.04, 5, 4);
  const drops = [];
  for (let i = 0; i < 140; i++) {
    const d = new THREE.Mesh(dropGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
    d.visible = false;
    d.userData = { v: new V3(), floor: 0, life: 0 };
    scene.add(d);
    drops.push(d);
  }
  let pi0 = 0; let di0 = 0;
  function puff(pos, color, op, s0, s1, life, vx, vy) {
    const s = puffs[pi0 = (pi0 + 1) % puffs.length];
    s.visible = true;
    s.position.copy(pos);
    s.material.color.set(color);
    Object.assign(s.userData, { life: 0, max: life, s0, s1, op });
    s.userData.v.set(vx + (Math.random() - 0.5) * 0.12, vy, (Math.random() - 0.5) * 0.12);
  }
  function drop(pos, color, vx, vy, vz, floor) {
    const d = drops[di0 = (di0 + 1) % drops.length];
    d.visible = true;
    d.position.copy(pos);
    d.material.color.set(color);
    d.userData.v.set(vx, vy, vz);
    d.userData.floor = floor;
    d.userData.life = 0;
  }

  // ---------- нива на замърсяване (плавно към целта) ----------
  const lv = { air: 0, field: 0, dump: 0 };
  const lvTarget = () => ({
    air: (state.chimney === 1 ? 0.6 : 0) + (state.cars === 1 ? 0.4 : 0),
    field: state.tractor === 1 ? 1 : 0,
    dump: state.dump === 1 ? 1 : 0,
  });
  let demoInject = 0; // предсказването в стъпка 4
  const GREEN = new THREE.Color(0x5cb33c); const WILT = new THREE.Color(0xb5a24c);
  const SOIL = new THREE.Color(0x6d4c2f); const SOILBAD = new THREE.Color(0x8a8270);
  const tmpC = new THREE.Color();
  let emitT = { ch: 0, car: 0, pipe: 0, spray: 0, lit: 0 };

  // ---------- главен цикъл ----------
  stage.tick((dt, t) => {
    const tg = lvTarget();
    for (const k in lv) lv[k] += (tg[k] - lv[k]) * Math.min(1, dt * 0.9);
    // небе
    tmpC.copy(SKY).lerp(SMOG, lv.air);
    scene.background.copy(tmpC);
    scene.fog.color.copy(tmpC);
    scene.fog.near = lerp(30, 10, lv.air);
    scene.fog.far = lerp(70, 42, lv.air);
    stage.hemi.intensity = lerp(1.1, 0.85, lv.air);
    for (const m of cloudMats) m.color.setRGB(lerp(1, 0.72, lv.air), lerp(1, 0.71, lv.air), lerp(1, 0.68, lv.air));
    for (const c of clouds) { c.position.x += dt * 0.3; if (c.position.x > 15) c.position.x = -15; }
    sunBall.material.color.setHex(0xffd84a).lerp(new THREE.Color(0xd8c48a), lv.air);
    // птици
    birds.forEach((b) => {
      const u = b.userData;
      u.vis += ((lv.air < 0.3 ? 1 : 0) - u.vis) * Math.min(1, dt);
      b.visible = u.vis > 0.05;
      b.scale.setScalar(Math.max(0.001, u.vis));
      const a = t * 0.35 + u.ph;
      b.position.set(-2 + Math.cos(a) * u.r * 1.6, 4.6 + Math.sin(t * 0.8 + u.ph) * 0.3, -3 + Math.sin(a) * u.r);
      b.rotation.y = -a;
      for (const w of u.wings) w.hinge.rotation.x = w.s * Math.sin(t * 7 + u.ph) * 0.5;
    });
    // дървета
    for (const s of swayers) s.rotation.z = Math.sin(t * 0.8 + s.userData.ph) * 0.03;
    // комин
    emitT.ch += dt;
    const chRate = state.chimney === 1 ? 0.13 : 0.6;
    if (emitT.ch > chRate) {
      emitT.ch = 0;
      if (state.chimney === 1) puff(CHIM_TOP, 0x5d5d5d, 0.75, 0.5, 2.2, 4.5, 0.35, 0.55);
      else puff(state.chimney === 2 ? CHIM_TOP.clone().setY(3.95) : CHIM_TOP, 0xffffff, 0.45, 0.25, 0.9, 2.5, 0.25, 0.45);
    }
    // коли
    const carsOn = state.cars === 1;
    emitT.car += dt;
    const emitCar = carsOn && emitT.car > 0.22;
    if (emitCar) emitT.car = 0;
    for (const c of cars) {
      if (!c.visible) continue;
      const d = c.userData.dir;
      c.position.x += d * dt * 1.4;
      if (c.position.x > 12.5) c.position.x = -12.5;
      if (c.position.x < -12.5) c.position.x = 12.5;
      if (emitCar) puff(c.position.clone().add(new V3(-d * 0.42, 0.12, 0)), 0x6e6e6e, 0.6, 0.15, 0.9, 1.8, -d * 0.2, 0.3);
    }
    if (bus.visible) { bus.position.x += dt * 1.0; if (bus.position.x > 12.5) bus.position.x = -12.5; }
    for (const b of bikes) { if (!b.visible) continue; b.position.x -= dt * 0.7; if (b.position.x < -12.5) b.position.x = 12.5; b.position.y = 0.07 + Math.abs(Math.sin(t * 6)) * 0.01; }
    // трактор: напред-назад по нивата
    const tx = Math.sin(t * 0.22);
    tractor.position.x = FIELD.x + tx * 2.1;
    tractor.rotation.y = Math.cos(t * 0.22) >= 0 ? 0 : Math.PI;
    tractor.position.y = 0.08 + Math.abs(Math.sin(t * 9)) * 0.012;
    emitT.spray += dt;
    if (emitT.spray > 0.05 && (state.tractor === 1 || state.tractor === 2)) {
      emitT.spray = 0;
      const back = new V3(-0.75, 0.33, (Math.random() - 0.5) * 2).applyMatrix4(tractor.matrixWorld);
      if (state.tractor === 1) drop(back, 0xcddc39, 0, -0.6, 0, 0.09);
      else drop(new V3(-0.85, 0.5, (Math.random() - 0.5) * 0.4).applyMatrix4(tractor.matrixWorld), 0x4e342e, (Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6, 0.09);
    }
    cropM.color.copy(GREEN).lerp(WILT, lv.field);
    fieldM.color.copy(SOIL).lerp(SOILBAD, lv.field);
    // сметище
    if (state.dump !== 2) patch.scale.setScalar(1.3 + lv.dump * 1.1);
    patchM.color.setHex(0x9a8f7a).lerp(new THREE.Color(0x6f6a62), lv.dump);
    // тръба
    emitT.pipe += dt;
    if ((state.pipe === 1 || state.pipe === 2) && emitT.pipe > 0.04) {
      emitT.pipe = 0;
      drop(PIPE_END, state.pipe === 1 ? 0x6b5a2a : 0x9ad7ff, 0.5 + Math.random() * 0.2, 0, (Math.random() - 0.5) * 0.1, RY);
    }
    // река: замърсяването тече надолу
    const inj = state.pipe === 1 ? 1 : 0;
    const kf = Math.min(1, dt * 10);
    for (let rep = 0; rep < 3; rep++) for (let i = RN - 1; i > 0; i--) P[i] += (P[i - 1] - P[i]) * kf;
    P[0] *= 0.9;
    if (inj) for (let i = pi - 1; i <= pi + 1; i++) P[i] = Math.max(P[i], inj);
    if (demoInject > 0) { demoInject -= dt; for (let i = 3; i <= 5; i++) P[i] = 1; }
    for (let i = 0; i < RN; i++) {
      tmpC.copy(CLEAN).lerp(MURKY, Math.min(1, P[i]));
      rColA.setXYZ(i * 2, tmpC.r, tmpC.g, tmpC.b);
      rColA.setXYZ(i * 2 + 1, tmpC.r, tmpC.g, tmpC.b);
    }
    rColA.needsUpdate = true;
    rTex.offset.y -= dt * 0.35;
    // плаващи шишета
    for (const b of floaters) {
      if (b.userData.collect) continue;
      b.visible = state.litter === 1;
      if (!b.visible) continue;
      b.userData.s += dt * 3;
      if (b.userData.s > RN - 2) b.userData.s = li;
      const r = riverAt(b.userData.s);
      b.position.copy(r.p).add(r.n.clone().multiplyScalar(b.userData.lat));
      b.position.y = RY + 0.04 + Math.sin(t * 3 + b.userData.lat * 9) * 0.02;
      b.rotation.y = t * 0.5 + b.userData.lat * 7;
    }
    // риби
    for (const f of fish) {
      const u = f.userData;
      const s = Math.max(1, Math.min(RN - 2, u.s0 + Math.sin(t * u.sp * 0.4 + u.ph) * u.amp));
      const dir = Math.cos(t * u.sp * 0.4 + u.ph) >= 0 ? 1 : -1;
      const r = riverAt(s);
      const murky = P[r.i] > 0.3 || (state.litter === 1 && r.i > li - 4);
      u.hide += ((murky ? 1 : 0) - u.hide) * Math.min(1, dt * 1.5);
      f.visible = u.hide < 0.97;
      f.scale.setScalar(Math.max(0.001, 1 - u.hide));
      f.position.copy(r.p).add(r.n.clone().multiplyScalar(u.lat + Math.sin(t * 1.3 + u.ph) * 0.08));
      const tgt = rPts[Math.min(RN - 1, Math.max(0, r.i + dir))];
      f.rotation.y = Math.atan2(-(tgt.z - r.p.z), tgt.x - r.p.x);
      u.tail.rotation.y = Math.sin(t * 9 + u.ph) * 0.5;
      // от време на време рибата подскача над водата (само в чиста вода)
      u.jt -= dt;
      if (u.jt < 0 && !murky) { u.jump = 0.001; u.jt = 6 + Math.random() * 6; }
      let y = RY - 0.02;
      if (u.jump > 0) { u.jump += dt / 0.9; if (u.jump >= 1) u.jump = 0; else { y += Math.sin(u.jump * Math.PI) * 0.45; f.rotation.z = Math.cos(u.jump * Math.PI) * 0.8; } }
      if (u.jump === 0) f.rotation.z = 0;
      f.position.y = y - u.hide * 0.25;
    }
    // частици
    for (const s of puffs) {
      if (!s.visible) continue;
      const u = s.userData;
      u.life += dt;
      const k = u.life / u.max;
      if (k >= 1) { s.visible = false; continue; }
      s.position.addScaledVector(u.v, dt);
      s.scale.setScalar(lerp(u.s0, u.s1, k));
      s.material.opacity = u.op * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
    }
    for (const d of drops) {
      if (!d.visible) continue;
      const u = d.userData;
      u.v.y -= 3.5 * dt;
      d.position.addScaledVector(u.v, dt);
      u.life += dt;
      if (d.position.y < u.floor || u.life > 3) d.visible = false;
    }
    // маркери
    for (const m of markers) { m.position.y = m.userData.y0 + Math.sin(t * 3 + m.userData.ph) * 0.12; m.rotation.y = t * 1.2; }
    for (const f of flowers) f.rotation.y = t;
  });

  // ---------- маркери „!“ над източниците ----------
  const MK = {
    chimney: new V3(FAC.x + 0.3, 2.6, FAC.z + 0.3), cars: new V3(-5.5, 1.3, ROADZ), pipe: new V3(pStart + pLen * 0.55, 1.2, PZ),
    litter: LIT.clone().setY(1.2), tractor: new V3(FIELD.x, 1.9, FIELD.z - 1.4), dump: DUMP.clone().setY(1.9),
  };
  const markers = [];
  const markerByID = {};
  for (const id in MK) {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: 0xffb300, emissive: 0x6a4300, roughness: 0.4 });
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 10), m);
    top.rotation.x = Math.PI;
    top.position.y = 0.3;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), m);
    dot.position.y = -0.04;
    g.add(top, dot);
    g.position.copy(MK[id]);
    g.userData = { pickId: id, y0: MK[id].y, ph: markers.length, m };
    g.visible = false;
    scene.add(g);
    addHitBox(g, 0.7);
    markers.push(g);
    markerByID[id] = g;
  }
  const showMarkers = (fn) => { for (const id in markerByID) markerByID[id].visible = fn(id); };

  // ---------- изглед и балончета ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.4, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.08;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, dur);
  }
  const overview = () => fitView([0.5, 0.6, -1.2], 10.5, 4.6, 0.62);
  const VIEW = {
    air: () => fitView([-1, 3, -3], 6.5, 3.6, 0.3),
    water: () => fitView([0.8, 0.2, 0], 3.6, 4.2, 0.95),
    soil: () => fitView([FIELD.x, 0.3, FIELD.z], 3.4, 2.2, 0.6),
    factory: () => fitView([FAC.x + 1.2, 1.7, FAC.z], 3.2, 2.4, 0.35),
    chimney: () => fitView([FAC.x + 0.4, 2.4, FAC.z], 3.4, 2.8, 0.3),
    cars: () => fitView([-2.5, 0.4, ROADZ], 4.2, 1.6, 0.5),
    pipe: () => fitView([pStart + pLen * 0.7, 0.3, PZ + 1.2], 3.8, 2.4, 0.7),
    litter: () => fitView([LIT.x - 0.3, 0.3, LIT.z + 1.4], 2.6, 2.2, 0.7),
    tractor: () => fitView([FIELD.x, 0.5, FIELD.z], 3.4, 2, 0.55),
    dump: () => fitView([DUMP.x, 0.6, DUMP.z], 2.6, 1.8, 0.5),
  };
  const ANCH = {
    air: new V3(-1, 4.6, -3), water: rPts[50].clone().setY(0.4), soil: new V3(FIELD.x, 0.6, FIELD.z),
    factory: new V3(FAC.x + 0.3, 1.9, FAC.z), chimney: new V3(FAC.x + 0.3, 2.2, FAC.z), cars: new V3(-2.5, 0.7, ROADZ),
    pipe: new V3(pStart + pLen * 0.6, 0.6, PZ), litter: LIT.clone().setY(0.5), tractor: new V3(FIELD.x, 1.2, FIELD.z),
    dump: DUMP.clone().setY(1.0),
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
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });

  function choiceBox(c, q, items, rightIdx, why, onRight, onWrong, cls = '') {
    c.innerHTML = `<p class="pollution-q">${q}</p><div class="choices ${cls}">${items.map((t, i) => `<button class="choice" data-i="${i}">${t}</button>`).join('')}</div>`;
    let wrong = 0;
    c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
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
      c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      onRight();
    }));
  }

  // ---------- 1. Опознай ----------
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Разгледай долината',
    items: PLACES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  const PICK2PLACE = { chimney: 'factory', pipe: 'factory', cars: 'cars', tractor: 'tractor', dump: 'dump', water: 'water', soil: 'soil' };
  function step1() {
    shell.step(0);
    const seen = new Set();
    shell.task(`<p>Това е една <b>долина</b>: град с фабрика, път, река с риби, нива и сметище.</p>
      <p><b>Разгледай всичко:</b> избери от менюто в ъгъла или кликни върху обектите в сцената.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата долина</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${PLACES.length}`);
    upd();
    const visit = (id) => {
      const p = PLACE[id];
      VIEW[id]();
      say(ANCH[id], `<b>${esc(p.icon)}</b> ${p.note}`, 'wide', 0.3);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === PLACES.length) { next.disabled = false; shell.msg('Разгледа цялата долина! Продължи напред.', 'good'); }
    };
    clickHandler = (id) => { const pid = PICK2PLACE[id]; if (!pid) { clearTip(); return; } visit(pid); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); menu.show(false); clearTip(); step2(); });
    overview();
  }

  // ---------- 2. Намери замърсителите ----------
  function step2() {
    shell.step(1);
    let mistakes = 0;
    const found = new Set();
    let busy = false;
    showMarkers(() => true);
    overview();
    const tally = () => `<div class="pollution-tally">${CATS.map((c, k) => `<div><b>${c.icon} ${c.short}</b>${SRC.filter((s) => s.cat === k && found.has(s.id)).map((s) => `<i>✓ ${esc(s.name)}</i>`).join('')}</div>`).join('')}</div>`;
    const intro = () => {
      shell.task(`<p>В долината има <b>6 източника на замърсяване</b>. Те са отбелязани с <b>!</b></p>
        <p>Кликни върху всеки и наблюдавай какво става. После кажи какво замърсява той най-вече.</p>${tally()}`);
      shell.setControls('<div class="row"><button class="btn all">🔭 Цялата долина</button></div>').querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
      shell.score(`Открити: ${found.size} от ${SRC.length} · грешки: ${mistakes}`);
    };
    intro();
    clickHandler = (id) => {
      if (busy || !SRCBY[id] || found.has(id)) return;
      busy = true;
      const S = SRCBY[id];
      state[id] = 1;
      markerByID[id].visible = false;
      VIEW[id]();
      say(ANCH[id], `⚠️ ${S.on}`, 'wide bad', 0.3);
      shell.msg('');
      let wrongHere = 0;
      const box = shell.setControls('<div></div>').firstChild;
      choiceBox(box, `Какво замърсява най-вече „${esc(S.name)}“?`, CATS.map((c) => `<span>${c.icon}</span>${c.label}`), S.cat,
        (i) => { wrongHere++; return wrongHere >= 2 ? `Подсказка: ${S.hint}` : S.why[i]; },
        () => {
          found.add(id);
          shell.msg(S.ok, 'good');
          busy = false;
          if (found.size < SRC.length) {
            intro(); shell.msg(S.ok, 'good');
            const n = found.size;
            wait(1.6).then(() => { if (!busy && found.size === n) { clearTip(); overview(); } });
            return;
          }
          clickHandler = null;
          clearTip();
          overview();
          shell.task(`<p>Откри всички замърсители! Погледни долината: небето е сиво, реката е мътна, нивата пожълтя.</p>${tally()}`);
          shell.score(`Открити: ${SRC.length} от ${SRC.length} · грешки: ${mistakes}`);
          const c = shell.setControls('<button class="btn primary">Да почистим долината →</button>');
          c.querySelector('button').addEventListener('click', () => { scores.push(stepScore(mistakes, 3)); shell.msg(''); step3(); });
        },
        () => { mistakes++; shell.score(`Открити: ${found.size} от ${SRC.length} · грешки: ${mistakes}`); }, 'pollution-pick');
    };
  }

  // ---------- 3. Почисти долината ----------
  async function applyFix(id) {
    if (id === 'chimney') { filter.scale.setScalar(0.001); await grow(filter); }
    else if (id === 'pipe') { plant.scale.setScalar(0.001); await grow(plant, 0.9); }
    else if (id === 'cars') {
      await Promise.all(cars.slice(1).map((c) => shrink(c)));
      bus.scale.setScalar(0.001); bikes.forEach((b) => b.scale.setScalar(0.001));
      await Promise.all([grow(bus), ...bikes.map((b) => grow(b))]);
    } else if (id === 'litter') {
      binG.scale.setScalar(0.001);
      await grow(binG, 0.5);
      const to = binG.position.clone().setY(0.45);
      await Promise.all([...floaters.filter((b) => b.visible), lb1, lb2, bag].map(async (b, i) => {
        b.userData.collect = true;
        if (b.parent !== scene) { const wp = b.getWorldPosition(new V3()); scene.attach(b); b.position.copy(wp); }
        await wait(i * 0.12);
        await hop(b, to, 0.7, 0.8);
        b.visible = false;
      }));
    } else if (id === 'tractor') {
      boom.visible = false;
      trailer.scale.setScalar(0.001);
      await grow(trailer);
    } else if (id === 'dump') {
      await shrink(pile, 0.8);
      bins.scale.setScalar(0.001);
      const s0 = patch.scale.x;
      await Promise.all([grow(bins), phase(1.2, (k) => { patch.scale.setScalar(Math.max(0.001, s0 * (1 - ease(k)))); flowers.forEach((f) => f.scale.setScalar(Math.max(0.001, ease(k)))); })]);
      patch.visible = false;
    }
  }
  function step3() {
    shell.step(2);
    let mistakes = 0;
    const fixed = new Set();
    let busy = false;
    showMarkers(() => true);
    for (const id in markerByID) markerByID[id].userData.m.color.setHex(0x26a69a);
    overview();
    const upd = () => shell.score(`Поправени: ${fixed.size} от ${SRC.length} · грешки: ${mistakes}`);
    const intro = () => {
      shell.task(`<p>Да почистим долината! <b>Кликни върху замърсител</b> (отбелязан с <b>!</b>) и избери как да го спрем.</p>
        <p class="small">Наблюдавай как се променят небето, реката и почвата.</p>`);
      shell.setControls('<div class="row"><button class="btn all">🔭 Цялата долина</button></div>').querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
      upd();
    };
    intro();
    clickHandler = (id) => {
      if (busy || !SRCBY[id] || fixed.has(id)) return;
      busy = true;
      const S = SRCBY[id]; const R = SOL[id];
      VIEW[id]();
      clearTip();
      shell.msg('');
      const others = shuffle(SRC.filter((x) => x.id !== id)).slice(0, 2).map((x) => x.id);
      const opts = shuffle([id, ...others]);
      let wrongHere = 0;
      const box = shell.setControls('<div></div>').firstChild;
      choiceBox(box, `Как да спрем ${esc(R.against)}?`, opts.map((o) => `${SOL[o].icon} ${esc(SOL[o].label)}`), opts.indexOf(id),
        (i) => {
          wrongHere++;
          const w = SOL[opts[i]];
          return wrongHere >= 2 ? `Подсказка: ${R.hint}` : `„${w.label}“ помага срещу ${w.against}. Тук трябва да спрем ${R.against}.`;
        },
        async () => {
          markerByID[id].visible = false;
          state[id] = 2;
          shell.msg('Чудесно! Гледай…', 'good');
          await applyFix(id);
          fixed.add(id);
          say(ANCH[id], `✓ ${R.done}`, 'wide good', 0.3);
          shell.msg(`✓ ${R.label}`, 'good');
          busy = false;
          void S;
          if (fixed.size < SRC.length) { intro(); shell.msg(`✓ ${R.label}`, 'good'); return; }
          clickHandler = null;
          await wait(1.2);
          overview();
          say(ANCH.air, '🌤️ Долината отново е чиста! Небето е синьо, рибите плуват, нивата е зелена.', 'wide good', 0);
          shell.task('<p>Всички замърсители са спрени. Хората опазват <b>въздуха</b>, <b>водата</b> и <b>почвата</b>, когато пречистват, събират разделно и пътуват с по-малко коли.</p>');
          upd();
          const c = shell.setControls('<button class="btn primary">Напред →</button>');
          c.querySelector('button').addEventListener('click', () => { scores.push(stepScore(mistakes, 3)); clearTip(); shell.msg(''); step4(); });
        },
        () => { mistakes++; upd(); });
    };
  }

  // ---------- 4. Опазва или замърсява? ----------
  let stopDrag = null;
  function step4() {
    shell.step(3);
    clickHandler = null;
    showMarkers(() => false);
    let mistakes = 0; let wrongHere = 0;
    const ZZ = 5.4; const ZR = 1.15;
    const zx = [-8.0, -3.9];
    const sortG = new THREE.Group();
    scene.add(sortG);
    const zones = [zoneRing(0x2e7d32, ZR), zoneRing(0xc62828, ZR)];
    const zNames = ['🌱 Опазва', '⚠️ Замърсява'];
    zones.forEach((z, i) => {
      z.position.set(zx[i], 0.005, ZZ);
      sortG.add(z);
      const l = labelSprite(zNames[i], { size: 0.26, color: i ? '#b3261e' : '#1b5e20' });
      l.position.set(zx[i], 0.2, ZZ + ZR + 0.3);
      sortG.add(l);
    });
    const SPAWN = new V3((zx[0] + zx[1]) / 2, 0, ZZ - 1.4);
    const order = shuffle(ACTS);
    const items = order.map((A) => {
      const g = actModel(A.id);
      g.position.copy(SPAWN);
      const l = labelSprite(A.name, { size: 0.2 });
      l.position.set(0, 1.0, 0);
      g.add(l);
      g.userData.A = A;
      g.visible = false;
      sortG.add(g);
      addHitBox(g, 0.8);
      return g;
    });
    const inZone = [0, 0];
    const slots = [[-0.45, -0.3], [0.45, -0.3], [0, 0.42]];
    let cur = 0;
    const view4 = () => fitView([(zx[0] + zx[1]) / 2, 0.4, ZZ - 0.2], 3.4, 1.9, 0.8);
    view4();
    const upd = () => shell.score(`Подредени: ${cur} от ${items.length} · грешки: ${mistakes}`);
    shell.task(`<p>Какво правят хората всеки ден? Кое <b>опазва</b> природата и кое я <b>замърсява</b>?</p>
      <p><b>Влачи</b> всяко действие в правилния кръг.</p>`);
    shell.setControls('');
    const show = () => {
      const g = items[cur];
      g.visible = true;
      g.userData.dragId = g.userData.A.id;
      g.userData.pickId = 'a-' + g.userData.A.id;
      upd();
    };
    show();
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => clearTip(),
      onDrop: async (g) => {
        const A = g.userData.A;
        let zi = -1;
        zones.forEach((z, i) => { if (Math.hypot(g.position.x - zx[i], g.position.z - ZZ) < ZR + 0.3) zi = i; });
        if (zi < 0) { await hop(g, SPAWN, 0.4, 0.2); return; }
        if (zi !== A.zone) {
          mistakes++; wrongHere++;
          shell.msg(`„${A.name}“ не е на мястото си. ` + (wrongHere >= 2
            ? 'Подсказка: замърсява това, което пуска дим или вредни вещества във въздуха, водата или почвата.'
            : 'Помисли: какво става с въздуха, водата или почвата след това действие?'), 'bad');
          upd();
          await hop(g, SPAWN, 0.5, 0.3);
          return;
        }
        wrongHere = 0;
        g.userData.locked = true;
        delete g.userData.dragId;
        const [ox, oz] = slots[inZone[zi]++];
        await hop(g, new V3(zx[zi] + ox, 0, ZZ + oz), 0.4, 0.2);
        g.children.forEach((c) => { if (c.isSprite) c.visible = false; });
        g.scale.setScalar(0.85);
        shell.msg(`Вярно! ${A.say}`, 'good');
        say(g, (A.zone ? '⚠️ ' : '🌱 ') + A.say, A.zone ? 'bad' : 'good', 0.6);
        cur++;
        if (cur < items.length) { show(); return; }
        upd();
        predict();
      },
    });
    async function predict() {
      await wait(1.0);
      clearTip();
      fitView([1.2, 0.3, -1], 4.6, 5.2, 0.95);
      shell.task('<p><b>Предскажи.</b> Представи си, че горе, до планината, има друга фабрика. Тя изпуска мръсна вода в реката.</p>');
      const box = shell.setControls('<div></div>').firstChild;
      choiceBox(box, 'Докъде ще стигне замърсяването?', [
        'Само до мястото, където е тръбата',
        'Надолу по течението — през цялата долина',
        'Нагоре, към върха на планината',
      ], 1, (i) => (i === 0
        ? 'Водата в реката не стои на едно място — тя тече. Помисли накъде отнася всичко, което попадне в нея.'
        : 'Реката тече от планината надолу, а не нагоре. Спомни си накъде плаваха шишетата.'),
      async () => {
        shell.msg('Вярно! Реката отнася замърсяването надолу — до всички селища, риби и ниви по течението. Да видим:', 'good');
        shell.setControls('');
        demoInject = 2.5;
        say(rPts[5].clone().setY(0.3), 'Мръсна вода…', 'bad', 0.2);
        await wait(3.5);
        say(rPts[70].clone().setY(0.3), '…стига чак долу. Затова пречиствателните станции пазят всички по течението.', 'wide', 0.2);
        await wait(5);
        const c = shell.setControls('<button class="btn primary">Виж резултата</button>');
        c.querySelector('button').addEventListener('click', () => {
          clearTip();
          scores.push(stepScore(mistakes, 3));
          const ratio = scores.reduce((x, y) => x + y, 0) / scores.length;
          shell.finish(ratio, onComplete, restart);
        });
      }, () => { mistakes++; upd(); });
    }
  }

  step1();
  return {
    dispose() {
      if (stopDrag) stopDrag();
      menu.remove();
      stage.dispose();
    },
  };
}
