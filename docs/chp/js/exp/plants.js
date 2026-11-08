// 4.3.1 „Как се хранят и размножават растенията“ — слънчев перваз с растения, буркан с водно растение и лампа.
// Стъпки: опознай частите → как растението си прави храна (схема, опит с буркана, покрито растение)
// → размножаване (пчела, тичинки, плодник, плод) → жизнен цикъл на фасула с плъзгач „Дни“.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (k) => Math.max(0, Math.min(1, k));
const seg = (d, a, b) => clamp01((d - a) / (b - a));

const PARTS = [
  { id: 'leaf', label: 'Лист', icon: '🍃',
    note: '<b>Лист</b> — в зелените листа, на светлина, растението <b>изгражда хранителни вещества</b>. Листата поемат от въздуха въглероден диоксид и отделят <b>кислород</b>.' },
  { id: 'root', label: 'Корен', icon: '🪴',
    note: '<b>Корен</b> — закрепва растението в почвата и поема от нея <b>вода</b> с разтворени в нея вещества.' },
  { id: 'stem', label: 'Стъбло', icon: '🌿',
    note: '<b>Стъбло</b> — държи листата и цветовете към светлината. По него водата се изкачва от корена до листата, а хранителните вещества се разнасят из цялото растение.' },
  { id: 'flower', label: 'Цвят', icon: '🌸',
    note: '<b>Цвят</b> — с него растението се размножава. В средата има <b>плодник</b>, около него са <b>тичинките</b> с прашец. Ярките венчелистчета привличат пчелите.' },
  { id: 'fruit', label: 'Плод и семена', icon: '🍅',
    note: '<b>Плод</b> — развива се от цвета след опрашването. В плода има <b>семена</b>. От всяко семе може да израсне ново растение.' },
  { id: 'jar', label: 'Водно растение', icon: '🫙',
    note: '<b>Водно растение в буркан</b> — то е под водата и лампата го осветява. Виждаш ли мехурчетата? Това е <b>кислород</b>, който растението отделя.' },
  { id: 'sun', label: 'Слънце', icon: '☀️',
    note: '<b>Слънце</b> — светлината му е нужна на растението, за да изгражда хранителни вещества в листата. Без светлина растението отслабва.' },
];
const PART = Object.fromEntries(PARTS.map((p) => [p.id, p]));

// Стъпка 2: какво е нужно на листа, за да изгради храна.
const TOKENS = [
  { id: 'water', name: 'Вода', need: true, pos: [-1.25, 0.45, 0.65], say: 'Корените поемат вода от почвата. Тя се изкачва по стъблото до листата.' },
  { id: 'co2', name: 'Въглероден диоксид', need: true, pos: [-1.15, 2.4, 0.3], say: 'Листата поемат въглероден диоксид от въздуха.' },
  { id: 'light', name: 'Светлина', need: true, pos: [1.3, 3.05, -0.1], say: 'Слънчевата светлина огрява зелените листа.' },
  { id: 'o2', name: 'Кислород', need: false, pos: [1.4, 1.95, 0.45], say: 'Кислородът не влиза в изграждането на храната — растението го отделя, когато си прави храна.' },
  { id: 'soil', name: 'Пръст', need: false, pos: [1.3, 0.12, 0.75], say: 'Растението не яде пръст. От почвата корените поемат само вода с разтворени в нея вещества.' },
];

// Етапи от живота на фасула (ден от плъзгача).
const STAGES = [
  { id: 'seed', name: 'семе', from: 0 }, { id: 'sprout', name: 'кълн', from: 6 }, { id: 'plant', name: 'растение с листа', from: 14 },
  { id: 'flower', name: 'цвят', from: 40 }, { id: 'fruit', name: 'плод (шушулка)', from: 55 }, { id: 'seeds', name: 'зрели семена', from: 70 },
  { id: 'dry', name: 'растението изсъхва', from: 80 },
];
const stageOf = (d) => { let s = STAGES[0]; for (const x of STAGES) if (d >= x.from) s = x; return s; };
const HUNT = [
  { id: 'sprout', ask: 'фасулът е <b>кълн</b>', ok: (d) => d >= 6 && d < 14, hint: 'Кълнът е съвсем малък — едва е излязъл от почвата, още без истински листа.' },
  { id: 'flower', ask: 'фасулът <b>цъфти</b>', ok: (d) => d >= 40 && d < 55, hint: 'Цветовете са малки, бели. Търси ги след като растението вече има много листа.' },
  { id: 'fruit', ask: 'по фасула висят <b>плодове — шушулки със семена</b>', ok: (d) => d >= 55 && d < 80, hint: 'Шушулките се появяват, когато цветовете прецъфтят, и преди растението да изсъхне.' },
];

function injectStyle() {
  if (document.getElementById('plants-style')) return;
  const s = document.createElement('style');
  s.id = 'plants-style';
  s.textContent = `
  .plants-q { margin:10px 0 4px; font-weight:700; }
  .plants-scheme { display:flex; flex-wrap:wrap; align-items:center; gap:4px; margin:8px 0 2px; font-size:.86rem; line-height:1.3; }
  .plants-scheme span { padding:3px 7px; border-radius:7px; background:#eef2f6; border:1px dashed #b8c4d0; }
  .plants-scheme span.on { border-style:solid; font-weight:700; }
  .plants-scheme .w.on { background:#e2f1ff; border-color:#2f8fdc; } .plants-scheme .c.on { background:#eceff1; border-color:#78909c; }
  .plants-scheme .l.on { background:#fff7d6; border-color:#e0a800; } .plants-scheme .f.on { background:#fff1e0; border-color:#e67e22; }
  .plants-scheme .o.on { background:#e6fbff; border-color:#26a6c9; }
  .plants-scheme b.op { background:none; border:0; padding:0; font-weight:900; }
  .plants-order { margin:6px 0 4px; padding-left:22px; } .plants-order li { margin:3px 0; color:#0d7a3a; font-weight:700; }
  .plants-range { width:100%; margin:10px 0 2px; accent-color:#2e7d32; height:28px; }
  .plants-days { display:flex; justify-content:space-between; font-size:.8rem; color:#5b6b7b; }
  .plants-legend { margin:6px 0 0; padding-left:18px; font-size:.88rem; } .plants-legend li { margin:2px 0; }
  `;
  document.head.appendChild(s);
}

// ---------- помощни модели ----------
function glassMat(opacity = 0.22) {
  return new THREE.MeshStandardMaterial({ color: 0xe6f4ff, transparent: true, opacity, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
}
function lathe(pts, m, segs = 28) {
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segs), m);
}
function tube(points, r, m, n = 16) {
  const c = new THREE.CatmullRomCurve3(points.map((p) => new V3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(c, n, r, 7, false), m);
}
const hiddenMat = () => new THREE.MeshBasicMaterial({ visible: false });
let leafGeo = null;
function leafGeometry() {
  if (leafGeo) return leafGeo;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.14, 0.08, 0.2, 0.32, 0, 0.55);
  s.bezierCurveTo(-0.2, 0.32, -0.14, 0.08, 0, 0);
  leafGeo = new THREE.ShapeGeometry(s, 8);
  return leafGeo;
}
function potModel(r = 0.3, h = 0.5) {
  const g = new THREE.Group();
  const terra = mat(0xc8643b, { side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.78, h, 22, 1, true), terra);
  body.position.y = h / 2;
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(r * 0.78, 20), terra);
  bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.01;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.035, 6, 24), mat(0xb3542f));
  rim.rotation.x = Math.PI / 2; rim.position.y = h;
  const soilM = mat(0x4a3322, { roughness: 1 });
  const soil = new THREE.Mesh(new THREE.CircleGeometry(r - 0.02, 22), soilM);
  soil.rotation.x = -Math.PI / 2; soil.position.y = h - 0.05;
  g.add(body, bottom, rim, soil);
  g.userData.soilM = soilM;
  g.userData.soilY = h - 0.05;
  return g;
}
// Цвят: венчелистчета, тичинки с прашници и плодник. Гледа по локалната ос +y.
function flowerModel(key) {
  const g = new THREE.Group();
  const petals = new THREE.Group();
  petals.userData.pickId = 'petals-' + key;
  const pm = mat(0xf06fa6, { side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14), pm);
    p.scale.set(0.75, 1, 1);
    const hold = new THREE.Group();
    hold.rotation.y = -a;
    p.rotation.x = -Math.PI / 2 + 0.25;
    p.position.set(0.15, 0.02, 0);
    p.rotation.z = Math.PI / 2;
    hold.add(p);
    petals.add(hold);
  }
  const sep = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.1, 10), mat(0x4e9a3a));
  sep.rotation.x = Math.PI; sep.position.y = -0.04;
  g.add(petals, sep);
  const stamens = new THREE.Group();
  stamens.userData.pickId = 'stamens-' + key;
  const fm = mat(0xf5e6c8); const am = mat(0xffc107, { emissive: 0x553300 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.15, 5), fm);
    fil.position.set(Math.cos(a) * 0.1, 0.07, Math.sin(a) * 0.1);
    fil.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    const an = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), am);
    an.name = 'anther';
    an.scale.set(1, 0.7, 1.4);
    an.position.set(Math.cos(a) * 0.125, 0.145, Math.sin(a) * 0.125);
    stamens.add(fil, an);
  }
  const sHit = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.055, 6, 16), hiddenMat());
  sHit.rotation.x = Math.PI / 2; sHit.position.y = 0.12;
  stamens.add(sHit);
  const pistil = new THREE.Group();
  pistil.userData.pickId = 'pistil-' + key;
  const pgm = mat(0x7cb342);
  const ovary = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), pgm);
  ovary.position.y = 0.03;
  const style = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.18, 6), pgm);
  style.position.y = 0.13;
  const stigma = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), mat(0xc5e1a5));
  stigma.position.y = 0.23;
  const pHit = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.3, 8), hiddenMat());
  pHit.position.y = 0.14;
  pistil.add(ovary, style, stigma, pHit);
  g.add(stamens, pistil);
  g.userData = { petals, stamens, pistil, ovary, style, stigma, pm };
  return g;
}
function beeModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat(0xf2c037));
  body.scale.set(1.45, 1, 1);
  g.add(body);
  for (const x of [-0.03, 0.025]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.022, 14), mat(0x222222));
    st.rotation.z = Math.PI / 2; st.position.x = x;
    st.scale.set(1, 1, 1);
    g.add(st);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(0x2b2b2b));
  head.position.x = 0.11;
  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 6), mat(0x222222));
  sting.rotation.z = Math.PI / 2; sting.position.x = -0.12;
  g.add(head, sting);
  for (const z of [-0.02, 0.02]) {
    const an = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 4), mat(0x222222));
    an.position.set(0.14, 0.04, z); an.rotation.z = -0.6;
    g.add(an);
  }
  const wm = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
  const wings = [];
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(0.01, 0.06, 0.02 * s);
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), wm);
    w.scale.set(1.2, 0.6, 1);
    w.rotation.x = -Math.PI / 2;
    w.position.set(-0.03, 0, 0.06 * s);
    hinge.add(w);
    g.add(hinge);
    wings.push({ hinge, s });
  }
  const pollen = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), mat(0xffd54f, { emissive: 0x664400 }));
    p.position.set(-0.04 + (i % 3) * 0.04, -0.06, i < 3 ? 0.04 : -0.04);
    pollen.add(p);
  }
  pollen.visible = false;
  g.add(pollen);
  g.userData = { wings, pollen };
  return g;
}
// Фасул в саксия: семе, стъбло, семедели, листа, цветове, шушулки, паднали семена.
function beanModel(pot) {
  const SY = pot.userData.soilY;
  const g = new THREE.Group();
  const seedM = mat(0xeee2c0);
  const seed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), seedM);
  seed.scale.set(1.4, 0.75, 0.9); seed.position.y = SY + 0.03;
  const stemM = mat(0x6aa84f);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 1, 7), stemM);
  const cotM = mat(0xc9d77a);
  const cots = [-1, 1].map((s) => { const c = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), cotM); c.scale.set(1.3, 0.5, 0.9); c.userData.s = s; return c; });
  const leafM = mat(0x43a047, { side: THREE.DoubleSide });
  const leaves = [];
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(leafGeometry(), leafM);
    l.userData = { i, s: i % 2 ? 1 : -1 };
    leaves.push(l);
  }
  const flM = mat(0xfbe9f3);
  const flowers = [];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), flM);
      p.scale.set(1, 0.6, 1.2);
      p.position.set(Math.cos(k * 2.1) * 0.025, 0, Math.sin(k * 2.1) * 0.025);
      f.add(p);
    }
    flowers.push(f);
  }
  const podM = mat(0x7cb342);
  const pods = [];
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), podM);
    pods.push(p);
  }
  const fallen = [];
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 6), seedM);
    f.scale.set(1.4, 0.75, 0.9);
    f.position.set(-0.12 + i * 0.11, SY + 0.02, 0.1 - (i % 2) * 0.14);
    f.rotation.y = i;
    fallen.push(f);
  }
  g.add(seed, stem, ...cots, ...leaves, ...flowers, ...pods, ...fallen);
  pot.add(g);
  return { g, SY, seed, stem, stemM, cots, cotM, leaves, leafM, flowers, pods, podM, fallen, pot };
}
const C = (h) => new THREE.Color(h);
const COL = {
  stem: C(0x6aa84f), stemPale: C(0xe3dc8a), stemDry: C(0x9c7b4f),
  leaf: C(0x43a047), leafPale: C(0xe6df8f), leafYellow: C(0xd4b94a), leafDry: C(0x8d6e4a),
  cot: C(0xc9d77a), pod: C(0x7cb342), podDry: C(0xc7a052),
  soil: C(0x4a3322), soilDry: C(0x9a7a58),
};
// Състояние на фасула на ден d. kind: good (светлина и вода), dark (тъмно), dry (без вода).
function setBean(B, d, kind) {
  const { SY } = B;
  const show = (o, v) => { o.visible = v; };
  if (kind === 'dry') {
    show(B.seed, true); show(B.stem, false); B.cots.forEach((c) => show(c, false));
    B.leaves.forEach((l) => show(l, false)); B.flowers.forEach((f) => show(f, false)); B.pods.forEach((p) => show(p, false)); B.fallen.forEach((f) => show(f, false));
    return;
  }
  let H; let nLeaves; let leafK; let flowerK = 0; let podK = 0; let dryK = 0; let cotK; let tilt = 0;
  const startD = kind === 'dark' ? 5 : 6;
  if (kind === 'good') {
    H = d < 6 ? 0 : d < 14 ? lerp(0.04, 0.3, seg(d, 6, 14)) : lerp(0.3, 1.0, seg(d, 14, 40));
    leafK = seg(d, 13, 40);
    nLeaves = Math.round(6 * leafK);
    cotK = d < 6 ? 0 : 1 - seg(d, 22, 30);
    flowerK = d >= 40 && d < 60 ? Math.min(seg(d, 40, 45), 1 - seg(d, 54, 60)) : 0;
    podK = seg(d, 55, 68);
    dryK = seg(d, 76, 90);
    tilt = seg(d, 82, 90) * 0.35;
  } else {
    H = d < 5 ? 0 : lerp(0.05, 1.05, seg(d, 5, 20));
    leafK = seg(d, 10, 20) * 0.35;
    nLeaves = Math.round(2 * seg(d, 10, 18));
    cotK = d < 5 ? 0 : 1;
    dryK = seg(d, 20, 32);
    tilt = seg(d, 24, 34) * 0.55;
  }
  show(B.seed, d < startD);
  show(B.stem, H > 0);
  B.stem.scale.y = Math.max(0.001, H);
  B.stem.position.y = SY + H / 2;
  if (kind === 'dark') { B.g.rotation.x = -tilt; B.g.rotation.z = tilt * 0.3; } else B.g.rotation.z = tilt;
  B.g.position.y = 0;
  const pale = kind === 'dark';
  B.stemM.color.copy(pale ? COL.stemPale : COL.stem).lerp(COL.stemDry, dryK);
  B.cots.forEach((c) => {
    c.visible = cotK > 0.02;
    c.scale.set(1.3 * cotK, 0.5 * cotK, 0.9 * cotK);
    const cy = kind === 'good' ? Math.min(H, 0.3) : H;
    c.position.set(c.userData.s * 0.05, SY + cy, 0);
  });
  B.cotM.color.copy(pale ? COL.stemPale : COL.cot).lerp(COL.stemDry, dryK);
  B.leaves.forEach((l) => {
    const { i, s } = l.userData;
    l.visible = i < nLeaves;
    if (!l.visible) return;
    const f = kind === 'good' ? 0.35 + 0.6 * ((i >> 1) / 2) : 0.85 + 0.1 * i;
    const size = (0.3 + 0.55 * leafK) * (kind === 'good' && i >= 4 ? 0.85 : 1);
    l.scale.setScalar(size);
    l.position.set(0, SY + H * f, 0);
    const droop = lerp(1.0, 2.1, dryK);
    l.rotation.set(-0.3, s > 0 ? 0 : Math.PI, -droop);
  });
  if (kind === 'good') B.leafM.color.copy(COL.leaf).lerp(COL.leafYellow, seg(d, 72, 82)).lerp(COL.leafDry, seg(d, 82, 90));
  else B.leafM.color.copy(COL.leafPale).lerp(COL.leafDry, dryK);
  B.flowers.forEach((fl, i) => {
    fl.visible = flowerK > 0.02;
    fl.scale.setScalar(Math.max(0.001, flowerK));
    const s = i % 2 ? 1 : -1;
    fl.position.set(s * 0.09, SY + H * (0.55 + 0.12 * i), 0.05);
  });
  B.pods.forEach((p, i) => {
    p.visible = podK > 0.02;
    const s = i % 2 ? 1 : -1;
    p.scale.set(1, Math.max(0.01, 5 * podK), 1);
    p.position.set(s * 0.1, SY + H * (0.6 + 0.12 * i) - 0.07 * podK, 0.06);
    p.rotation.z = s * 0.25;
  });
  B.podM.color.copy(COL.pod).lerp(COL.podDry, seg(d, 70, 80));
  B.fallen.forEach((f) => { f.visible = kind === 'good' && d >= 86; });
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
  leafGeo = null;
  const STEPS = ['Опознай растението', 'Как растението си прави храна?', 'Как се размножава цветното растение?', 'Животът на фасула'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xbfe3ff, camPos: [0, 3, 9], target: [0, 1.4, 0], maxDistance: 16, minDistance: 1.2,
    maxPolarAngle: Math.PI * 0.5,
  });
  const { scene, camera } = stage;
  stage.controls.minAzimuthAngle = -1.0;
  stage.controls.maxAzimuthAngle = 1.0;
  const narrow = camera.aspect < 1.15;
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

  // мек кръгъл спрайт (облаци, сияние)
  const pc = document.createElement('canvas');
  pc.width = pc.height = 64;
  const px = pc.getContext('2d');
  const gr = px.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  px.fillStyle = gr; px.fillRect(0, 0, 64, 64);
  const puffTex = new THREE.CanvasTexture(pc);
  puffTex.colorSpace = THREE.SRGBColorSpace;
  const puff = (color, opacity, size) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color, transparent: true, opacity, depthWrite: false }));
    s.scale.setScalar(size);
    return s;
  };

  // ---------- стая: перваз, стена с прозорец, навън ----------
  const sill = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.16, 2.6), mat(0xf3eadb));
  sill.position.set(1.8, -0.08, -0.1);
  scene.add(sill);
  const under = new THREE.Mesh(new THREE.BoxGeometry(14.4, 3, 0.1), mat(0xe9dfcf));
  under.position.set(1.8, -1.6, 1.15);
  scene.add(under);
  const wallM = mat(0xf6efe2);
  const WZ = -1.4;
  for (const [x0, x1, y0, y1] of [[-6, -3.9, -0.2, 7], [4.3, 9.5, -0.2, 7], [-3.9, 4.3, -0.2, 0.55], [-3.9, 4.3, 4.6, 7]]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.2), wallM);
    w.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ);
    scene.add(w);
  }
  const frameM = mat(0xffffff);
  for (const [x, y, w, h] of [[0.2, 0.6, 8.3, 0.12], [0.2, 4.55, 8.3, 0.12], [-3.85, 2.58, 0.12, 4.0], [4.25, 2.58, 0.12, 4.0], [0.2, 2.58, 0.1, 4.0], [0.2, 2.6, 8.2, 0.08]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), frameM);
    f.position.set(x, y, WZ + 0.05);
    scene.add(f);
  }
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), mat(0x8bc34a));
  outside.rotation.x = -Math.PI / 2; outside.position.set(0, -1.2, -22);
  scene.add(outside);
  for (const [x, z, r, c] of [[-8, -20, 7, 0x7cb342], [6, -24, 9, 0x689f38], [16, -18, 6, 0x9ccc65]]) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), mat(c, { flat: true }));
    h.position.set(x, -1.2 - r * 0.55, z);
    scene.add(h);
  }
  const outTree = new THREE.Group();
  outTree.position.set(-2.2, -1.2, -9);
  const otr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 2.4, 8), mat(0x6d4c41));
  otr.position.y = 1.2;
  const ocr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), mat(0x4caf50, { flat: true }));
  ocr.position.y = 3;
  outTree.add(otr, ocr);
  scene.add(outTree);
  const clouds = [];
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4; j++) { const p = puff(0xffffff, 0.9, 1.6 + Math.random() * 0.6); p.position.set(j * 0.8 - 1.2, Math.random() * 0.3, 0); c.add(p); }
    c.position.set(-10 + i * 8, 5.5 + i * 0.6, -14);
    scene.add(c);
    clouds.push(c);
  }
  // Слънце
  const sunG = new THREE.Group();
  sunG.position.set(2.6, 4.6, -9);
  sunG.userData.pickId = 'sun';
  sunG.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffd54f })));
  sunG.add(puff(0xffe082, 0.85, 3.6));
  const rays = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0xffca28 }));
    const a = (i / 10) * Math.PI * 2;
    r.position.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0);
    r.rotation.z = a - Math.PI / 2;
    rays.add(r);
  }
  sunG.add(rays);
  scene.add(sunG);
  addHitBox(sunG, 1.5);

  // ---------- главното растение в стъклена саксия ----------
  const plant = new THREE.Group();
  scene.add(plant);
  const potGlass = lathe([[0, 0.001], [0.4, 0.001], [0.5, 0.85]], glassMat(0.24));
  potGlass.renderOrder = 3;
  const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 6, 28), glassMat(0.5));
  potRim.rotation.x = Math.PI / 2; potRim.position.y = 0.85;
  const soilBody = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.4, 0.74, 24), new THREE.MeshStandardMaterial({ color: 0x5d4030, transparent: true, opacity: 0.5, depthWrite: false, roughness: 1 }));
  soilBody.position.y = 0.38; soilBody.renderOrder = 2;
  const soilTop = new THREE.Mesh(new THREE.CircleGeometry(0.47, 24), mat(0x3e2a1a, { roughness: 1 }));
  soilTop.rotation.x = -Math.PI / 2; soilTop.position.y = 0.75;
  scene.add(potGlass, potRim, soilBody, soilTop);
  const stemX = (y) => 0.04 * Math.sin((y - 0.75) * 2);
  const stemPt = (y) => new V3(stemX(y), y, 0);
  const stemG = new THREE.Group();
  stemG.userData.pickId = 'stem';
  const stemMat = mat(0x5a9e3a);
  const stemPts = []; for (let y = 0.74; y <= 2.66; y += 0.24) stemPts.push([stemX(y), y, 0]);
  stemG.add(tube(stemPts, 0.045, stemMat, 24));
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0x7cb342));
  bud.scale.set(0.8, 1.3, 0.8); bud.position.set(stemX(2.7), 2.72, 0);
  stemG.add(bud);
  plant.add(stemG);
  addHitBox(stemG, 0.16);
  // корени
  const rootG = new THREE.Group();
  rootG.userData.pickId = 'root';
  const rootM = mat(0xeedfbf);
  const ROOTS = [
    [[0, 0.76, 0], [0, 0.55, 0.02], [0.02, 0.3, 0.04], [0, 0.1, 0.02]],
    [[0, 0.64, 0], [0.15, 0.52, 0.1], [0.3, 0.3, 0.16]],
    [[0, 0.6, 0], [-0.16, 0.48, 0.08], [-0.31, 0.28, 0.14]],
    [[0, 0.45, 0.02], [0.14, 0.3, -0.06], [0.24, 0.12, -0.08]],
    [[0, 0.42, 0.02], [-0.13, 0.28, 0], [-0.24, 0.1, 0.08]],
  ];
  for (const r of ROOTS) rootG.add(tube(r, 0.017, rootM, 10));
  plant.add(rootG);
  addHitBox(rootG, 0.3);
  const rootTips = ROOTS.map((r) => new V3(...r[r.length - 1]));
  // листа
  const LEAVES = [{ y: 1.05, s: -1 }, { y: 1.3, s: 1 }, { y: 1.55, s: -1 }, { y: 1.8, s: 1 }, { y: 2.05, s: -1 }, { y: 2.3, s: 1 }];
  const leafMat = mat(0x3f9b3f, { side: THREE.DoubleSide, emissive: 0x000000 });
  const leafMeshes = [];
  const leafMid = [];
  for (const L of LEAVES) {
    const l = new THREE.Mesh(leafGeometry(), leafMat);
    l.position.copy(stemPt(L.y));
    l.rotation.set(-0.5, 0, -L.s * 1.05);
    l.scale.setScalar(L.y > 2.2 ? 0.85 : 1.05);
    l.userData.pickId = 'leaf';
    plant.add(l);
    leafMeshes.push(l);
    l.updateMatrixWorld(true);
    leafMid.push(l.localToWorld(new V3(0, 0.27, 0)));
  }
  // цветове на клонки
  const FL = { A: { at: 2.2, s: -1, pos: new V3(-0.58, 2.62, 0.12) }, B: { at: 2.42, s: 1, pos: new V3(0.6, 2.86, 0.12) } };
  const flowers = {};
  for (const key of ['A', 'B']) {
    const F = FL[key];
    const b = stemPt(F.at);
    stemG.add(tube([[b.x, b.y, 0], [F.pos.x * 0.6, F.pos.y - 0.12, 0.05], [F.pos.x, F.pos.y - 0.06, F.pos.z]], 0.022, stemMat, 10));
    const f = flowerModel(key);
    f.position.copy(F.pos);
    f.quaternion.setFromUnitVectors(new V3(0, 1, 0), new V3(F.s * 0.25, 0.75, 0.62).normalize());
    f.scale.setScalar(1.15);
    plant.add(f);
    flowers[key] = f;
    // половинки на бъдещия плод (показват се в стъпка 3)
    const halves = new THREE.Group();
    halves.visible = false;
    halves.position.copy(F.pos);
    const fruitM = mat(0xd83a2b); const innerM = mat(0xf7a08a); const seedM = mat(0xf3e3b3);
    for (const side of [1, -1]) {
      const outer = new THREE.Group();
      const inner = new THREE.Group();
      inner.rotation.z = -side * Math.PI / 2;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), fruitM);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), innerM);
      face.rotation.x = Math.PI / 2;
      inner.add(dome, face);
      for (let i = 0; i < 7; i++) {
        const sd = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), seedM);
        const a = i * 0.9; const rr = 0.04 + (i % 3) * 0.03;
        sd.position.set(Math.cos(a) * rr, -0.008, Math.sin(a) * rr);
        sd.scale.set(1, 0.4, 1.4);
        inner.add(sd);
      }
      outer.add(inner);
      outer.userData.side = side;
      halves.add(outer);
    }
    plant.add(halves);
    flowers[key].userData.halves = halves;
  }
  // плод, който вече виси, и чинийка с разрязан плод
  const fruitG = new THREE.Group();
  fruitG.userData.pickId = 'fruit';
  stemG.add(tube([[stemX(1.18), 1.18, 0], [0.3, 1.16, 0.08], [0.42, 1.06, 0.16]], 0.016, stemMat, 8));
  const hang = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), mat(0xd83a2b));
  hang.scale.set(1, 0.88, 1); hang.position.set(0.42, 0.93, 0.16);
  const cal = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.04, 6), mat(0x4e9a3a));
  cal.position.set(0.42, 1.05, 0.16);
  fruitG.add(hang, cal);
  plant.add(fruitG);
  addHitBox(fruitG, 0.35);
  const plate = new THREE.Group();
  plate.userData.pickId = 'fruit';
  plate.position.set(1.15, 0, 0.6);
  const dish = lathe([[0, 0.01], [0.3, 0.01], [0.38, 0.06]], mat(0xffffff, { side: THREE.DoubleSide }));
  plate.add(dish);
  const cutDome = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd83a2b));
  cutDome.rotation.x = Math.PI; cutDome.position.y = 0.17;
  const cutFace = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), mat(0xf7a08a));
  cutFace.rotation.x = -Math.PI / 2; cutFace.position.y = 0.171;
  plate.add(cutDome, cutFace);
  for (let i = 0; i < 8; i++) {
    const sd = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), mat(0xf3e3b3));
    const a = i * 0.8; const rr = 0.03 + (i % 3) * 0.03;
    sd.position.set(Math.cos(a) * rr, 0.175, Math.sin(a) * rr); sd.scale.set(1, 0.4, 1.4);
    plate.add(sd);
  }
  for (let i = 0; i < 3; i++) {
    const sd = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), mat(0xf3e3b3));
    sd.position.set(0.2 + i * 0.04, 0.04, 0.08 - i * 0.06); sd.scale.set(1, 0.45, 1.5);
    plate.add(sd);
  }
  scene.add(plate);
  addHitBox(plate, 0.5);

  // ---------- буркан с водно растение и лампа ----------
  const JX = -2.45;
  const jarG = new THREE.Group();
  jarG.position.set(JX, 0, 0.15);
  jarG.userData.pickId = 'jar';
  const jGlass = lathe([[0, 0.001], [0.4, 0.001], [0.42, 0.05], [0.42, 1.0], [0.36, 1.08], [0.36, 1.13]], glassMat(0.22));
  jGlass.renderOrder = 3;
  const jWater = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 24), new THREE.MeshStandardMaterial({ color: 0x8fd0f0, transparent: true, opacity: 0.35, depthWrite: false, roughness: 0.1 }));
  jWater.position.y = 0.5; jWater.renderOrder = 2;
  const jSand = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.1, 24), mat(0xdcc08a));
  jSand.position.y = 0.05;
  jarG.add(jGlass, jWater, jSand);
  const elM = mat(0x2e8b3a, { flat: true });
  const elTips = [];
  const elodea = [];
  for (let i = 0; i < 3; i++) {
    const sx = (i - 1) * 0.14; const sz = (i % 2) * 0.08 - 0.04;
    const pts = [[sx, 0.08, sz], [sx + 0.06 * (i - 1), 0.4, sz], [sx - 0.04, 0.65, sz + 0.03], [sx + 0.02 * (i - 1), 0.82 - i * 0.04, sz]];
    const strand = new THREE.Group();
    strand.add(tube(pts, 0.012, elM, 10));
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new V3(...p)));
    const lv = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 4), elM, 36);
    const d = new THREE.Object3D();
    for (let k = 0; k < 36; k++) {
      const u = 0.08 + (k / 36) * 0.9;
      const p = curve.getPoint(u);
      const a = k * 2.4;
      d.position.set(p.x + Math.cos(a) * 0.035, p.y, p.z + Math.sin(a) * 0.035);
      d.rotation.set(0, -a, 0.9);
      d.scale.set(1, 0.25, 0.45);
      d.updateMatrix();
      lv.setMatrixAt(k, d.matrix);
      if (k % 6 === 5) elTips.push(new V3(p.x, p.y, p.z));
    }
    strand.add(lv);
    jarG.add(strand);
    elodea.push(strand);
  }
  const bubM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.05, emissive: 0x335566 });
  const jBubs = [];
  for (let i = 0; i < 22; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.022 + Math.random() * 0.01, 8, 6), bubM);
    b.visible = false;
    jarG.add(b);
    jBubs.push(b);
  }
  scene.add(jarG);
  addHitBox(jarG, 0.5);
  const jarLbl = labelSprite('Водно растение', { size: 0.13 });
  jarLbl.position.set(0, 0.02, 0.55);
  jarG.add(jarLbl);
  // лампа
  const lamp = new THREE.Group();
  lamp.userData.pickId = 'lamp';
  lamp.position.set(JX - 1.05, 0, 0.15);
  const lampM = mat(0x37474f, { metalness: 0.3 });
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.06, 18), lampM); lb.position.y = 0.03;
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 8), lampM); lp.position.y = 0.88;
  const la = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.95, 8), lampM); la.rotation.z = Math.PI / 2; la.position.set(0.47, 1.72, 0);
  const lh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.24, 18, 1, true), mat(0x26a69a, { side: THREE.DoubleSide })); lh.position.set(1.0, 1.62, 0);
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xfff8e1, emissive: 0xffe082, emissiveIntensity: 1 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), bulbM); bulb.position.set(1.0, 1.53, 0);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.5, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(1.0, 1.25, 0);
  lamp.add(lb, lp, la, lh, bulb, beam);
  scene.add(lamp);
  addHitBox(lamp, 0.4);
  let lampOn = true;
  function setLamp(on) {
    lampOn = on;
    beam.visible = on;
    bulbM.emissiveIntensity = on ? 1 : 0;
    bulbM.color.set(on ? 0xfff8e1 : 0x9e9e9e);
  }

  // ---------- малко растение, което ще покрием с кутия ----------
  const CPX = 2.45;
  const cpot = potModel(0.28, 0.45);
  cpot.position.set(CPX, 0, 0.15);
  scene.add(cpot);
  const cPlant = new THREE.Group();
  cPlant.position.y = cpot.userData.soilY;
  const cStemM = mat(0x5a9e3a);
  const cStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.58, 7), cStemM); cStem.position.y = 0.29;
  cPlant.add(cStem);
  const cLeafM = mat(0x3f9b3f, { side: THREE.DoubleSide });
  const cLeaves = [];
  for (let i = 0; i < 5; i++) {
    const s = i % 2 ? 1 : -1;
    const l = new THREE.Mesh(leafGeometry(), cLeafM);
    l.position.y = 0.15 + i * 0.1;
    l.scale.setScalar(0.62);
    l.userData = { s, base: -s * 1.0 };
    l.rotation.set(-0.5, 0, l.userData.base);
    cPlant.add(l);
    cLeaves.push(l);
  }
  cpot.add(cPlant);
  const box = new THREE.Group();
  const boxM = mat(0xc8a165, { side: THREE.DoubleSide });
  const BW = 0.78; const BH = 1.15;
  for (const [x, y, z, w, h, d] of [[0, BH, 0, BW, 0.03, BW], [-BW / 2, BH / 2, 0, 0.03, BH, BW], [BW / 2, BH / 2, 0, 0.03, BH, BW], [0, BH / 2, -BW / 2, BW, BH, 0.03], [0, BH / 2, BW / 2, BW, BH, 0.03]]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxM);
    p.position.set(x, y, z);
    box.add(p);
  }
  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.005, BW + 0.01), mat(0xa1887f));
  tape.position.y = BH + 0.018;
  box.add(tape);
  const BOX_HOME = new V3(3.4, 0, 0.15);
  box.position.copy(BOX_HOME);
  scene.add(box);

  // ---------- три саксии с фасул (стъпка 4) ----------
  const BX = [4.9, 6.2, 7.5];
  const KINDS = ['good', 'dark', 'dry'];
  const beans = KINDS.map((kind, i) => {
    const p = potModel(0.3, 0.5);
    p.position.set(BX[i], 0, 0.15);
    scene.add(p);
    const B = beanModel(p);
    B.kind = kind;
    setBean(B, 0, kind);
    return B;
  });
  const BEAN_LBL = ['1 · светлина и вода', '2 · тъмно, с вода', '3 · светлина, без вода'];
  beans.forEach((B, i) => {
    const l = labelSprite(BEAN_LBL[i], { size: 0.12 });
    l.position.set(0, 0.12, 0.5);
    B.pot.add(l);
  });
  beans[2].pot.userData.soilM.color.copy(COL.soilDry);
  // тъмен шкаф около втората саксия (отворен отпред, за да виждаме)
  const cab = new THREE.Group();
  cab.position.set(BX[1], 0, 0.1);
  const cabM = mat(0x6d4c41); const cabIn = mat(0x24201c);
  for (const [x, y, z, w, h, d, m] of [[0, 1.7, 0, 1.05, 0.06, 0.95, cabM], [-0.52, 0.85, 0, 0.06, 1.7, 0.95, cabM], [0.52, 0.85, 0, 0.06, 1.7, 0.95, cabM], [0, 0.85, -0.46, 1.05, 1.7, 0.04, cabIn]]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    p.position.set(x, y, z);
    cab.add(p);
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.66, 0.04), cabM);
  const hingeG = new THREE.Group();
  hingeG.position.set(0.52, 0, 0.47);
  door.position.set(0.25, 0.85, 0);
  hingeG.rotation.y = -1.9;
  hingeG.add(door);
  cab.add(hingeG);
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.66), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
  shade.position.set(0, 0.85, 0.4);
  cab.add(shade);
  scene.add(cab);

  // ---------- пчела ----------
  const bee = beeModel();
  scene.add(bee);
  let beeAuto = true;
  let beeT = 0;
  const beePrev = new V3();
  function faceBee(from, to) {
    const dx = to.x - from.x; const dz = to.z - from.z;
    if (dx * dx + dz * dz > 1e-6) bee.rotation.y = Math.atan2(-dz, dx);
  }
  async function flyBee(to, dur = 1.4, height = 0.3) {
    const from = bee.position.clone();
    faceBee(from, to);
    await phase(dur, (k) => { bee.position.lerpVectors(from, to, ease(k)); bee.position.y += Math.sin(k * Math.PI) * height; });
  }

  // ---------- частици по пътища ----------
  const streams = [];
  function makeStream(color, n, size, speed, curves, opts = {}) {
    const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, transparent: true, opacity: opts.opacity ?? 0.95, depthWrite: false });
    const geo = opts.cube ? new THREE.BoxGeometry(size * 1.6, size * 1.6, size * 1.6) : new THREE.SphereGeometry(size, 8, 6);
    const parts = [];
    for (let i = 0; i < n; i++) {
      const p = new THREE.Mesh(geo, m);
      p.visible = false;
      p.renderOrder = 4;
      p.userData = { u: -Math.random(), c: i % curves.length };
      scene.add(p);
      parts.push(p);
    }
    const S = { parts, curves, speed, on: false, fade: !!opts.fade };
    streams.push(S);
    return S;
  }
  function startStream(S) { S.on = true; S.parts.forEach((p) => { p.userData.u = -Math.random(); }); }
  function stopStreams() { streams.forEach((S) => { S.on = false; }); }
  const curve = (pts) => new THREE.CatmullRomCurve3(pts);
  const waterCurves = leafMid.map((m, i) => curve([rootTips[i % rootTips.length].clone(), new V3(0, 0.5, 0.03), stemPt(0.8), stemPt(LEAVES[i].y - 0.05), stemPt(LEAVES[i].y), m.clone()]));
  const co2Start = new V3(...TOKENS[1].pos);
  const co2Curves = leafMid.map((m, i) => curve([co2Start.clone().add(new V3(0, (i % 3) * 0.15 - 0.15, 0)), co2Start.clone().lerp(m, 0.5).add(new V3(0, 0.15, 0.25)), m.clone()]));
  const lightCurves = leafMid.map((m, i) => curve([new V3(1.6 + (i % 3) * 0.4, 3.9, -1.3), m.clone()]));
  const sugarCurves = leafMid.map((m, i) => {
    const end = i % 2 ? new V3(0.42, 0.93, 0.16) : rootTips[i % rootTips.length].clone();
    return curve(i % 2 ? [m.clone(), stemPt(LEAVES[i].y), stemPt(1.18), new V3(0.3, 1.16, 0.08), end] : [m.clone(), stemPt(LEAVES[i].y), stemPt(0.9), new V3(0, 0.6, 0.02), end]);
  });
  const o2Curves = leafMid.map((m, i) => curve([m.clone(), m.clone().add(new V3(LEAVES[i].s * 0.5, 0.5, 0.35)), m.clone().add(new V3(LEAVES[i].s * 1.0, 1.1, 0.5))]));
  const sWater = makeStream(0x2f8fdc, 22, 0.035, 0.35, waterCurves);
  const sCO2 = makeStream(0x78909c, 14, 0.04, 0.4, co2Curves);
  const sLight = makeStream(0xffd54f, 14, 0.035, 0.75, lightCurves);
  const sSugar = makeStream(0xff9800, 14, 0.028, 0.32, sugarCurves, { cube: true });
  const sO2 = makeStream(0x6fd6f2, 14, 0.04, 0.38, o2Curves, { fade: true });

  // ---------- оживяване ----------
  stage.tick((dt, t) => {
    for (const c of clouds) { c.position.x += dt * 0.25; if (c.position.x > 14) c.position.x = -14; }
    rays.rotation.z = t * 0.15;
    ocr.rotation.z = Math.sin(t * 0.6) * 0.04;
    plant.rotation.z = Math.sin(t * 0.9) * 0.008;
    cPlant.rotation.z = Math.sin(t * 1.1 + 1) * 0.03;
    beans.forEach((B, i) => { if (B.kind === 'good') B.g.rotation.x = Math.sin(t * 1.2 + i) * 0.02; });
    elodea.forEach((e, i) => { e.rotation.z = Math.sin(t * 0.8 + i * 1.7) * 0.04; });
    // пчела
    if (beeAuto) {
      beeT += dt;
      beePrev.copy(bee.position);
      bee.position.set(Math.sin(beeT * 0.45) * 1.1, 2.75 + Math.sin(beeT * 1.3) * 0.18, 0.45 + Math.cos(beeT * 0.45) * 0.45);
      faceBee(beePrev, bee.position);
    }
    for (const w of bee.userData.wings) w.hinge.rotation.x = w.s * (0.3 + Math.sin(t * 45) * 0.5);
    // мехурчета кислород в буркана
    for (const b of jBubs) {
      if (!b.visible) {
        if (lampOn && Math.random() < 0.05) {
          const tip = elTips[Math.floor(Math.random() * elTips.length)];
          b.position.copy(tip);
          b.userData.v = 0.18 + Math.random() * 0.12;
          b.visible = true;
        }
        continue;
      }
      b.position.y += b.userData.v * dt;
      b.position.x += Math.sin(t * 6 + b.id) * 0.0015;
      if (b.position.y > 0.93) b.visible = false;
    }
    // частици
    for (const S of streams) {
      for (const p of S.parts) {
        const ud = p.userData;
        if (ud.u < 0) {
          if (!S.on) { p.visible = false; continue; }
          ud.u += dt * S.speed;
          p.visible = false;
          if (ud.u >= 0) ud.c = Math.floor(Math.random() * S.curves.length);
          continue;
        }
        ud.u += dt * S.speed;
        if (ud.u > 1) {
          if (S.on) { ud.u = -Math.random() * 0.5; } else { ud.u = -1; }
          p.visible = false;
          continue;
        }
        p.visible = true;
        S.curves[ud.c].getPoint(ud.u, p.position);
        if (S.fade) p.scale.setScalar(1 - ud.u * 0.6);
      }
    }
  });

  // ---------- изглед и балончета ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.25, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.08;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, dur);
  }
  const overview = () => (narrow ? fitView([-0.4, 1.55, 0.1], 2.4, 1.7) : fitView([-0.4, 1.9, 0.1], 3.9, 1.95));
  const plantView = () => fitView([0, 1.75, 0.1], narrow ? 1.8 : 1.9, 1.75);
  const jarView = () => fitView([JX - 0.4, 0.9, 0.15], narrow ? 1.05 : 1.4, 0.95);
  const boxView = () => fitView([1.4, 1.1, 0.15], narrow ? 1.7 : 2.3, 1.25);
  const flowerView = () => fitView([0, 2.72, 0.12], narrow ? 0.95 : 1.05, 0.55, 0.45);
  const beanView = () => fitView([6.2, 0.95, 0.15], 2.0, 1.05, 0.2);
  const VIEWS = {
    leaf: () => fitView([-0.45, 1.6, 0.1], 0.9, 0.7), root: () => fitView([0, 0.5, 0.2], 0.85, 0.65),
    stem: () => fitView([0, 1.5, 0.1], 0.9, 1.1), flower: () => fitView([0, 2.72, 0.12], 1.0, 0.55, 0.4),
    fruit: () => fitView([0.75, 0.75, 0.4], 0.95, 0.6), jar: jarView, sun: () => fitView([2.0, 3.6, -3.0], 2.0, 1.4, 0.05),
  };
  const ANCH = {
    leaf: leafMid[2], root: new V3(0, 0.35, 0.2), stem: stemPt(1.45), flower: FL.A.pos, fruit: new V3(0.8, 0.9, 0.4),
    jar: new V3(JX, 1.1, 0.15), sun: sunG.position,
  };
  let tip = null;
  const tags = [];
  function say(anchor, html, cls = '', lift = 0.3) {
    if (tip) tip.remove();
    if (narrowUI()) cls = cls.replace('wide', '');
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  function tag(anchor, html, lift, cls = '') { const b = stage.bubble(anchor, html, { lift, cls: 'tag ' + cls }); tags.push(b); return b; }
  function clearTags() { while (tags.length) tags.pop().remove(); }

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null, hit); });
  stage.onHover(() => {});

  function choiceBox(c, q, items, rightIdx, why, onRight, onWrong) {
    c.innerHTML = `<p class="plants-q">${esc(q)}</p><div class="choices">${items.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
    let wrong = 0;
    c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i !== rightIdx) {
        wrong++;
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(typeof why === 'function' ? why(i, wrong) : (why[i] || 'Не е това. Помисли пак.'), 'bad');
        if (onWrong) onWrong();
        return;
      }
      b.classList.add('right');
      c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      onRight();
    }));
  }
  const askBox = () => shell.setControls('<div class="plants-ask"></div>').querySelector('.plants-ask');
  const nextBtn = (label, fn) => { const c = shell.setControls(`<button class="btn primary">${label}</button>`); c.querySelector('button').addEventListener('click', fn, { once: true }); };

  // ---------- 1. Опознай ----------
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Какво има на перваза?',
    items: PARTS.map((p) => ({ id: p.id, label: p.label, icon: p.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  const partOf = (id) => {
    if (!id) return null;
    if (/^(petals|stamens|pistil)-/.test(id)) return 'flower';
    if (id === 'lamp') return 'jar';
    return PART[id] ? id : null;
  };
  function step1() {
    shell.step(0);
    const seen = new Set();
    shell.task(`<p>На слънчевия перваз растат растения. До прозореца има <b>буркан с водно растение</b> и лампа.</p>
      <p><b>Разгледай частите на растението и всичко около него:</b> кликни върху тях или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Целият перваз</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${PARTS.length}`);
    upd();
    const visit = (id) => {
      const p = PART[id];
      VIEWS[id]();
      say(ANCH[id], `<b>${esc(p.icon)}</b> ${p.note}`, 'wide', id === 'sun' ? 0.9 : 0.25);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === PARTS.length) { next.disabled = false; shell.msg('Разгледа всичко! Продължи напред.', 'good'); }
    };
    clickHandler = (pid) => { const id = partOf(pid); if (!id) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); menu.show(false); clearTip(); step2(); });
    overview();
  }

  // ---------- 2. Как растението си прави храна ----------
  const tokens = {};
  for (const T of TOKENS) {
    const g = new THREE.Group();
    g.userData.pickId = 'tok-' + T.id;
    g.position.set(...T.pos);
    if (T.id === 'water') {
      const m = mat(0x2f8fdc, { roughness: 0.15 });
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), m);
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.17, 14), m); c.position.y = 0.13;
      g.add(s, c);
    } else if (T.id === 'co2' || T.id === 'o2') {
      const m = new THREE.MeshStandardMaterial({ color: T.id === 'co2' ? 0x90a4ae : 0x8fe3f7, transparent: true, opacity: 0.85, roughness: 0.4 });
      for (const [x, y, r] of [[-0.1, 0, 0.1], [0.06, 0.04, 0.12], [0.16, -0.03, 0.08], [0, -0.08, 0.08]]) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); s.position.set(x, y, 0); g.add(s);
      }
    } else if (T.id === 'light') {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd54f })));
      g.add(puff(0xffe082, 0.8, 0.6));
      for (let i = 0; i < 8; i++) {
        const r = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 5), new THREE.MeshBasicMaterial({ color: 0xffb300 }));
        const a = (i / 8) * Math.PI * 2;
        r.position.set(Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0); r.rotation.z = a - Math.PI / 2;
        g.add(r);
      }
    } else {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5d4037, { flat: true, roughness: 1 }));
      h.scale.y = 0.6; h.position.y = -0.1;
      g.add(h);
    }
    const lbl = labelSprite(T.name, { size: 0.15 });
    lbl.position.y = 0.3;
    g.add(lbl);
    stage.steadyLabel(lbl, 6);
    scene.add(g);
    addHitBox(g, 0.45);
    g.visible = false;
    g.userData.home = g.position.clone();
    tokens[T.id] = g;
  }

  function schemeHTML(have) {
    const sp = (k, cls, txt) => `<span class="${cls} ${have.has(k) ? 'on' : ''}">${have.has(k) ? txt : '?'}</span>`;
    return `<div class="plants-scheme">${sp('water', 'w', '💧 вода')}<b class="op">+</b>${sp('co2', 'c', 'въглероден диоксид')}
      <b class="op">→</b>${sp('light', 'l', '☀️ светлина, зелен лист')}<b class="op">→</b>${sp('food', 'f', 'хранителни вещества (захар, нишесте)')}<b class="op">+</b>${sp('o2', 'o', 'кислород')}</div>`;
  }

  function step2() {
    shell.step(1);
    let mistakes = 0;
    const upd = () => shell.score(mistakes ? `Грешки: ${mistakes}` : '');
    upd();
    plate.visible = false;
    beeAuto = true;
    setLamp(false);
    plantView();
    for (const id in tokens) { tokens[id].visible = true; tokens[id].position.copy(tokens[id].userData.home); }
    const have = new Set();
    let wrongHere = 0;
    const task = () => shell.task(`<p>Растението си прави храна само. Какво е нужно на листата, за да изградят <b>хранителни вещества</b>?</p>
      <p><b>Кликни трите неща</b>, които растението поема, за да си направи храна.</p>${schemeHTML(have)}`);
    task();
    shell.setControls('');
    let tokT = 0;
    const stopBob = stage.tick((dt) => {
      tokT += dt;
      for (const id in tokens) { const g = tokens[id]; if (!g.userData.busy && g.visible) g.position.y = g.userData.home.y + Math.sin(tokT * 1.6 + g.userData.home.x) * 0.04; }
    });
    clickHandler = async (pid) => {
      if (!pid || !pid.startsWith('tok-')) return;
      const id = pid.slice(4);
      const T = TOKENS.find((x) => x.id === id);
      const g = tokens[id];
      if (g.userData.busy) return;
      if (!T.need) {
        mistakes++; wrongHere++; upd();
        shell.msg(T.say + (wrongHere >= 2 ? ' Подсказка: едното нещо идва през корена, второто — от въздуха през листата, а третото — от Слънцето.' : ''), 'bad');
        g.userData.busy = true;
        const x0 = g.position.x;
        await phase(0.5, (k) => { g.position.x = x0 + Math.sin(k * Math.PI * 6) * 0.06 * (1 - k); });
        g.position.x = x0;
        g.userData.busy = false;
        return;
      }
      g.userData.busy = true;
      wrongHere = 0;
      have.add(id);
      task();
      shell.msg('Вярно! ' + T.say, 'good');
      const from = g.position.clone();
      const to = id === 'water' ? new V3(0, 0.78, 0.3) : leafMid[id === 'co2' ? 2 : 3].clone();
      await phase(0.9, (k) => { g.position.lerpVectors(from, to, ease(k)); g.scale.setScalar(1 - 0.7 * k); });
      g.visible = false;
      g.scale.setScalar(1);
      startStream(id === 'water' ? sWater : id === 'co2' ? sCO2 : sLight);
      if (have.size === 3) makeFood();
    };
    async function makeFood() {
      clickHandler = null;
      for (const id of ['o2', 'soil']) tokens[id].visible = false;
      stopBob();
      await wait(1.2);
      leafMat.emissive.set(0x1f5f1f);
      say(leafMid[2], '✨ На светлина зелените листа изграждат <b>хранителни вещества</b> (захар и нишесте) от вода и въглероден диоксид.', 'wide good', 0.3);
      await phase(1.2, (k) => { leafMat.emissiveIntensity = 0.3 + Math.sin(k * Math.PI * 3) * 0.3; });
      have.add('food');
      startStream(sSugar);
      await wait(1.2);
      startStream(sO2);
      task();
      tag(stemPt(1.0), 'храна', 0.05);
      tag(leafMid[5], 'O₂ навън', 0.45);
      await wait(1.2);
      choiceBox(askBox(), 'Какво отделя растението във въздуха, докато си прави храна?', ['Въглероден диоксид', 'Кислород', 'Захар'], 1,
        ['Въглеродния диоксид растението поема, не го отделя.', '', 'Захарта остава в растението — тя е неговата храна. Погледни светлосините частици.'], () => {
          have.add('o2');
          task();
          shell.msg('Вярно! Растенията обогатяват въздуха с кислород, а поемат въглероден диоксид.', 'good');
          nextBtn('Опит с водното растение →', () => { clearTags(); clearTip(); stopStreams(); leafMat.emissive.set(0x000000); jarTest(); });
        }, () => { mistakes++; upd(); });
    }

    // Опит: водното растение отделя кислород само на светлина.
    function jarTest() {
      shell.msg('');
      jarView();
      setLamp(false);
      let onTime = 0; let offTime = 0; let wasOn = false;
      shell.task(`<p><b>Опит.</b> Водното растение е в буркан с вода. <b>Включи и изключи лампата</b> няколко пъти и наблюдавай листата му.</p>`);
      const c = shell.setControls('<div class="row"><button class="btn primary lmp">💡 Включи лампата</button></div>');
      const b = c.querySelector('.lmp');
      const toggle = () => {
        setLamp(!lampOn);
        if (lampOn) wasOn = true;
        b.textContent = lampOn ? '🌑 Изключи лампата' : '💡 Включи лампата';
        say(jarG.position.clone().add(new V3(0, 1.1, 0)), lampOn ? 'Лампата свети…' : 'Лампата е изключена…', '', 0.45);
      };
      b.addEventListener('click', toggle);
      clickHandler = (pid) => { if (pid === 'lamp') toggle(); };
      let asked = false;
      const stopW = stage.tick((dt) => {
        if (lampOn) onTime += dt; else if (wasOn) offTime += dt;
        if (!asked && onTime > 2.5 && offTime > 2) {
          asked = true;
          stopW();
          ask();
        }
      });
      function ask() {
        clickHandler = (pid) => { if (pid === 'lamp') toggle(); };
        const host = shell.controls;
        const q = document.createElement('div');
        host.appendChild(q);
        choiceBox(q, 'Какво показва опитът?', [
          'Мехурчетата идват от лампата.',
          'Водното растение отделя мехурчета кислород само когато е осветено.',
          'Растението отделя мехурчета и на тъмно.',
        ], 1, ['Мехурчетата излизат от листата на растението, а не от лампата.', '', 'Изключи лампата и погледни пак — има ли мехурчета на тъмно?'], () => {
          clickHandler = null;
          setLamp(true);
          shell.msg('Вярно! На светлина растението си прави храна и отделя кислород — мехурчетата.', 'good');
          say(jarG.position.clone().add(new V3(0, 1.1, 0)), '🫧 Мехурчетата са <b>кислород</b>. Те излизат само на светлина.', 'good', 0.05);
          nextBtn('Опит с кутията →', () => { clearTip(); boxTest(); });
        }, () => { mistakes++; upd(); });
      }
    }

    // Опит: растение без светлина.
    function boxTest() {
      shell.msg('');
      boxView();
      shell.task('<p><b>Опит.</b> Да покрием едното растение с <b>кутия</b> и да го оставим така цяла седмица. Поливаме го както обикновено.</p>');
      nextBtn('📦 Покрий растението', async () => {
        shell.setControls('');
        const over = new V3(CPX, 0, 0.15);
        const from = box.position.clone();
        await phase(1.4, (k) => { box.position.lerpVectors(from, over, ease(k)); box.position.y = Math.sin(k * Math.PI) * 1.4; });
        box.position.copy(over);
        const dayTag = tag(new V3(CPX, BH, 0.15), 'Ден 0', 0.35);
        await phase(3.5, (k) => { dayTag.set('Ден ' + Math.round(k * 7)); });
        // през това време растението побледнява
        const pale = new THREE.Color(0xe3dc8a);
        cLeafM.color.set(0x3f9b3f).lerp(pale, 0.85); cStemM.color.set(0x5a9e3a).lerp(pale, 0.8);
        cLeaves.forEach((l) => { l.rotation.z = l.userData.base - l.userData.s * 0.9; });
        shell.task('<p>Мина една седмица. Да видим растението!</p>');
        nextBtn('Махни кутията', async () => {
          shell.setControls('');
          clearTags();
          await phase(1.4, (k) => { box.position.lerpVectors(over, BOX_HOME, ease(k)); box.position.y = Math.sin(k * Math.PI) * 1.4; });
          box.position.copy(BOX_HOME);
          say(new V3(CPX, 1.2, 0.15), 'Растението е <b>бледо</b> и листата му са <b>увиснали</b>.', 'bad', 0.1);
          await wait(0.8);
          choiceBox(askBox(), 'Защо растението под кутията побледня и отслабна?', [
            'Кутията беше много тежка.',
            'Без светлина растението не може да изгражда хранителни вещества.',
            'Под кутията растението нямаше вода.',
          ], 1, ['Кутията не докосваше растението. Какво не можеше да влезе в кутията?', '', 'Растението беше поливано както обикновено. Какво не можеше да влезе в кутията?'], async () => {
            shell.msg('Вярно! Без светлина растението не може да си прави храна. Да го върнем на светлина.', 'good');
            say(new V3(CPX, 1.2, 0.15), '☀️ На светлина растението отново позеленява.', 'good', 0.1);
            const p0 = cLeafM.color.clone(); const s0 = cStemM.color.clone();
            await phase(2, (k) => {
              cLeafM.color.copy(p0).lerp(new THREE.Color(0x3f9b3f), k);
              cStemM.color.copy(s0).lerp(new THREE.Color(0x5a9e3a), k);
              cLeaves.forEach((l) => { l.rotation.z = l.userData.base - l.userData.s * 0.9 * (1 - k); });
            });
            choiceBox(askBox(), 'Защо казваме, че растенията пречистват въздуха?', [
              'Поемат кислород и отделят въглероден диоксид.',
              'Поемат въглероден диоксид и отделят кислород.',
              'Събират праха с корените си.',
            ], 1, ['Обратно е: спомни си кои частици влизаха в листата и кои излизаха.', '', 'Корените са в почвата и поемат вода. Помисли какво правят листата.'], () => {
              shell.msg('Вярно! Растенията поемат въглероден диоксид и обогатяват въздуха с кислород, който дишаме.', 'good');
              nextBtn('Напред →', () => { scores.push(stepScore(mistakes, 3)); clearTip(); shell.msg(''); step3(); });
            }, () => { mistakes++; upd(); });
          }, () => { mistakes++; upd(); });
        });
      });
    }
  }

  // ---------- 3. Размножаване ----------
  function step3() {
    shell.step(2);
    plate.visible = true;
    let mistakes = 0; let wrongHere = 0;
    const upd = () => shell.score(mistakes ? `Грешки: ${mistakes}` : '');
    upd();
    flowerView();
    beeAuto = false;
    const home = new V3(0, 3.1, 0.6);
    flyBee(home, 1.2);
    shell.setControls('');
    let src = null;
    let busy = false;
    const PARTNAME = { petals: 'венчелистчетата', stamens: 'тичинките', pistil: 'плодника' };
    shell.task('<p>Пчелата търси <b>прашец</b>. Помогни ѝ: кликни частта на цвета, в която се образува прашецът.</p><p class="small">Приближи цвета, ако трябва.</p>');
    say(flowers.A, 'Венчелистчета, тичинки, плодник — кое къде е?', '', 0.45);
    clickHandler = async (pid) => {
      if (busy || !pid) return;
      const m = /^(petals|stamens|pistil)-([AB])$/.exec(pid);
      if (!m) return;
      const [, part, key] = m;
      const F = flowers[key];
      if (!src) {
        if (part !== 'stamens') {
          mistakes++; wrongHere++; upd();
          shell.msg(`Това са ${PARTNAME[part]}. ` + (part === 'pistil' ? 'Плодникът е в средата на цвета, но прашецът не се образува в него.' : 'Те са ярки и привличат пчелите, но прашецът не е в тях.')
            + (wrongHere >= 2 ? ' Подсказка: търси тънките дръжчици с жълти главички около средата.' : ''), 'bad');
          return;
        }
        busy = true; wrongHere = 0; src = key;
        clearTip();
        shell.msg('Вярно! Прашецът се образува в тичинките.', 'good');
        const p = F.localToWorld(new V3(0, 0.3, 0));
        await flyBee(p, 1.2, 0.2);
        await phase(1.2, (k, dt, t) => { bee.position.x = p.x + Math.sin(t * 9) * 0.04; });
        bee.userData.pollen.visible = true;
        say(bee, 'Пчелата събра жълт <b>прашец</b> от тичинките.', 'good', 0.25);
        await flyBee(home, 1.0, 0.15);
        busy = false;
        shell.task('<p>Пчелата лети към <b>другия цвят</b>. Кликни къде трябва да попадне прашецът, за да се образува плод.</p>');
        return;
      }
      if (key === src) { shell.msg('Пчелата вече лети към другия цвят. Кликни върху него.', ''); return; }
      if (part !== 'pistil') {
        mistakes++; wrongHere++; upd();
        shell.msg(`Това са ${PARTNAME[part]}. ` + (part === 'stamens' ? 'Тичинките дават прашец, а прашецът трябва да попадне другаде.' : 'Плод не се развива от венчелистчетата.')
          + (wrongHere >= 2 ? ' Подсказка: търси в самата среда на цвета.' : ''), 'bad');
        return;
      }
      busy = true;
      clickHandler = null;
      clearTip();
      const st = F.userData.stigma;
      const p = st.localToWorld(new V3(0, 0.12, 0));
      await flyBee(p, 1.2, 0.2);
      // прашецът пада върху близалцето на плодника
      const dots = [];
      for (let i = 0; i < 6; i++) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), mat(0xffd54f, { emissive: 0x664400 }));
        d.position.set((Math.random() - 0.5) * 0.04, 0.03, (Math.random() - 0.5) * 0.04);
        st.add(d); dots.push(d);
      }
      await wait(0.8);
      bee.userData.pollen.visible = false;
      shell.msg('Вярно! Прашецът попадна върху плодника — това е опрашване.', 'good');
      say(st, '🐝 <b>Опрашване:</b> пчелата пренесе прашеца от тичинките на единия цвят върху плодника на другия.', 'wide good', 0.2);
      beeAuto = true;
      await wait(2.5);
      await toFruit(key);
    };

    async function toFruit(key) {
      const F = flowers[key];
      const U = F.userData;
      say(F, '⏳ Минават няколко седмици…', '', 0.5);
      U.pm.transparent = true;
      const red = new THREE.Color(0xd83a2b);
      const g0 = U.ovary.material.color.clone();
      U.ovary.material = U.ovary.material.clone();
      await phase(3, (k) => {
        U.petals.children.forEach((h) => { h.children[0].position.y = 0.02 - k * 0.25; h.children[0].rotation.x = -Math.PI / 2 + 0.25 - k; });
        U.pm.opacity = 1 - k;
        U.stamens.scale.setScalar(Math.max(0.001, 1 - k));
        U.style.scale.setScalar(Math.max(0.001, 1 - k)); U.stigma.scale.setScalar(Math.max(0.001, 1 - k));
        U.ovary.scale.setScalar(1 + k * 2.8);
        U.ovary.material.color.copy(g0).lerp(red, seg(k, 0.4, 1));
      });
      U.petals.visible = false;
      say(F, 'От плодника се разви <b>плод</b>. Да го разрежем!', 'good', 0.45);
      await wait(1.6);
      const H = U.halves;
      F.visible = false;
      H.visible = true;
      H.position.copy(F.position);
      await phase(1.4, (k) => {
        H.children.forEach((o) => {
          const s = o.userData.side;
          o.position.x = s * 0.14 * ease(k);
          o.rotation.y = s * (Math.PI / 2) * 0.8 * ease(k);
        });
      });
      say(H, '🌱 В плода има <b>семена</b>. От всяко семе може да израсне ново растение.', 'wide good', 0.35);
      order();
    }

    function order() {
      const RIGHT = ['Цвят с тичинки и плодник', 'Пчелата пренася прашеца върху плодника', 'От плодника се развива плод', 'В плода узряват семена', 'От семето израства ново растение'];
      let n = 0; let wrongO = 0;
      const items = shuffle(RIGHT.map((t, i) => ({ t, i })));
      const draw = () => {
        shell.task(`<p><b>Подреди</b> как се размножава цветното растение: кликни етапите един след друг, от първия до последния.</p>
          <ol class="plants-order">${RIGHT.slice(0, n).map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`);
        const c = shell.setControls(`<div class="choices">${items.filter((x) => x.i >= n).map((x) => `<button class="choice" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div>`);
        c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
          const i = +b.dataset.i;
          if (i !== n) {
            mistakes++; wrongO++; upd();
            b.classList.add('wrong');
            shell.msg(wrongO >= 2 ? `Подсказка: след „${n ? RIGHT[n - 1] : 'началото'}“ идва това, което трябва да се случи веднага след него.` : 'Не е този етап. Помисли какво трябва да се случи първо.', 'bad');
            return;
          }
          n++;
          shell.msg('');
          if (n < RIGHT.length) { draw(); return; }
          shell.task(`<p>Подреди всички етапи!</p><ol class="plants-order">${RIGHT.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`);
          shell.msg('Браво! Така се размножава цветното растение: цвят → опрашване → плод → семена → ново растение.', 'good');
          nextBtn('Напред →', () => { scores.push(stepScore(mistakes, 3)); clearTip(); shell.msg(''); step4(); });
        }));
      };
      draw();
    }
  }

  // ---------- 4. Животът на фасула ----------
  function step4() {
    shell.step(3);
    clickHandler = null;
    beeAuto = true;
    let mistakes = 0;
    const upd = () => shell.score(mistakes ? `Грешки: ${mistakes}` : '');
    upd();
    beanView();
    beans.forEach((B) => setBean(B, 0, B.kind));
    shell.task(`<p>В три саксии засадихме по едно <b>семе от фасул</b> в един и същи ден.</p>
      <ul class="plants-legend"><li><b>1</b> — на светло, поливаме го.</li><li><b>2</b> — в тъмен шкаф, поливаме го.</li><li><b>3</b> — на светло, но <b>не</b> го поливаме.</li></ul>`);
    choiceBox(askBox(), 'Предскажи: в коя саксия фасулът ще порасне, ще цъфне и ще даде нови семена?', ['В саксия 1', 'В саксия 2', 'В саксия 3'], 0, (i, n) => {
      if (n >= 2) return 'Подсказка: на растението са нужни и вода, и светлина.';
      return i === 1 ? 'Помисли: може ли растението да си прави храна в тъмното?' : 'Помисли: може ли семето да покълне без вода?';
    }, () => {
      shell.msg('Да проверим! Плъзни „Дни“ и наблюдавай трите саксии.', 'good');
      slider();
    }, () => { mistakes++; upd(); });

    let rng = null;
    let dayTag = null;
    function slider(onEnd) {
      const c = shell.setControls(`<input type="range" class="plants-range" min="0" max="90" step="1" value="0" aria-label="Дни">
        <div class="plants-days"><span>Ден 0</span><span class="plants-day"><b>Ден 0</b></span><span>Ден 90</span></div><div class="plants-more"></div>`);
      rng = c.querySelector('.plants-range');
      if (!dayTag) dayTag = tag(beans[0].pot.localToWorld(new V3(0, 1.6, 0)), 'Ден 0', 0.05);
      let finished = false;
      rng.addEventListener('input', () => {
        const d = +rng.value;
        c.querySelector('.plants-day').innerHTML = `<b>Ден ${d}</b>`;
        dayTag.set('Ден ' + d);
        beans.forEach((B) => setBean(B, d, B.kind));
        if (d >= 90 && !finished && !onEnd) { finished = true; afterGrowth(); }
      });
      return c;
    }
    async function afterGrowth() {
      const T = [
        tag(beans[0].pot.localToWorld(new V3(0, 0.75, 0)), 'цъфна, даде семена, изсъхна', 0.05, 'good'),
        tag(beans[1].pot.localToWorld(new V3(0, 0.9, 0)), 'покълна, но загина', 0.05, 'bad'),
        tag(beans[2].pot.localToWorld(new V3(0, 0.6, 0)), 'не покълна', 0.05, 'bad'),
      ];
      await wait(0.6);
      const q = document.createElement('div');
      shell.controls.querySelector('.plants-more').appendChild(q);
      choiceBox(q, 'Защо фасулът в тъмния шкаф покълна, но после загина?', [
        'Защото не беше поливан.',
        'Кълнът порасна с храната от семето, но без светлина не можа да си прави нова храна.',
        'Защото семето беше развалено.',
      ], 1, ['Саксия 2 беше поливана. Какво липсваше в шкафа?', '', 'Семето беше здраво — нали покълна! Какво липсваше в шкафа?'], () => {
        shell.msg('Вярно! А семето без вода изобщо не покълна. На растението са нужни вода, светлина, въздух и топлина.', 'good');
        T.forEach((x) => x.remove());
        hunt();
      }, () => { mistakes++; upd(); });
    }
    function hunt() {
      const order = shuffle(HUNT);
      let qi = 0; let wrongHere = 0;
      const ask = () => {
        const H = order[qi];
        shell.task(`<p>Разгледай <b>живота на фасула</b> в саксия 1. Премести плъзгача на ден, в който ${H.ask}, и натисни „Тук е!“.</p><p class="small">Задача ${qi + 1} от ${order.length}</p>`);
        const c = slider(true);
        rng.value = 0; rng.dispatchEvent(new Event('input'));
        const more = c.querySelector('.plants-more');
        more.innerHTML = '<div class="row"><button class="btn primary here">Тук е!</button></div>';
        more.querySelector('.here').addEventListener('click', () => {
          const d = +rng.value;
          if (!H.ok(d)) {
            mistakes++; wrongHere++; upd();
            shell.msg(`На ден ${d} фасулът е в етап „${stageOf(d).name}“. ` + (wrongHere >= 2 ? 'Подсказка: ' + H.hint : 'Опитай друг ден.'), 'bad');
            return;
          }
          wrongHere = 0;
          shell.msg(`Вярно! На ден ${d} фасулът е в етап „${stageOf(d).name}“.`, 'good');
          qi++;
          if (qi < order.length) { ask(); return; }
          final();
        });
      };
      ask();
    }
    function final() {
      rng.value = 90; rng.dispatchEvent(new Event('input'));
      say(beans[0].pot.localToWorld(new V3(0, 0.9, 0)), 'Растението изсъхна, но <b>семената</b> му останаха. От тях догодина ще израснат нови растения.', 'wide good', 0.1);
      shell.task('<p>Фасулът премина целия си живот: <b>семе → кълн → растение → цвят → плод → семена → изсъхва</b>.</p>');
      choiceBox(askBox(), 'Защо фасулът е едногодишно тревисто растение?', [
        'Живее много години и всяка година цъфти отново.',
        'За една година израства от семе, цъфти, дава плод със семена и изсъхва.',
        'Защото расте само една седмица.',
      ], 1, ['Така живеят многогодишните растения, например дърветата. Погледни какво стана с фасула накрая.', '', 'Фасулът живя много повече от седмица — цели три месеца, до есента.'], () => {
        shell.msg('Вярно! Едногодишното растение живее само един сезон, но оставя семена.', 'good');
        nextBtn('Виж резултата', () => {
          scores.push(stepScore(mistakes, 3));
          clearTip(); clearTags();
          const ratio = scores.reduce((x, y) => x + y, 0) / scores.length;
          shell.finish(ratio, onComplete, restart);
        });
      }, () => { mistakes++; upd(); });
    }
  }

  step1();
  return {
    dispose() { clickHandler = null; menu.remove(); stage.dispose(); puffTex.dispose(); },
  };
}
