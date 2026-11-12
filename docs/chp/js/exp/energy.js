// 4.2.5 „Видове енергия“ — малък град: къща със слънчев панел и печка, бензиностанция с кола,
// вятърна турбина, дете с ябълка и ТЕЦ на въглища.
// Стъпки: опознай града → проследи енергията → къде се използва енергията → дим или чисто? (+ предсказване).
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;

// ---------- стилове (само за този модул) ----------
function injectStyle() {
  if (document.getElementById('energy-style')) return;
  const s = document.createElement('style');
  s.id = 'energy-style';
  s.textContent = `
  .energy-q { margin:10px 0 4px; font-weight:700; }
  .xp-controls .choices.energy-pick { grid-template-columns: repeat(2, 1fr); }
  .xp-controls .choices.energy-pick .choice { flex-direction:column; justify-content:center; gap:2px; padding:8px 4px; font-weight:700; text-align:center; }
  .xp-controls .choices.energy-pick .choice span { font-size:1.5rem; }
  .energy-kinds { list-style:none; padding:0; margin:8px 0; display:grid; gap:4px; }
  .energy-kinds li { border:1px solid #dfe5ee; border-radius:8px; padding:5px 8px; background:#fbfcfe; font-size:.88rem; }
  .energy-kinds li.on { border-color:#9ad8b0; background:#eefaf2; }
  `;
  document.head.appendChild(s);
}

// ---------- данни ----------
const PLACES = [
  { id: 'sun', label: 'Слънце', icon: '☀️',
    note: '<b>Слънцето</b> ни дава светлина и топлина. Това е <b>слънчева енергия</b>. Без нея на Земята нямаше да има живот.' },
  { id: 'panel', label: 'Слънчев панел', icon: '🔆',
    note: '<b>Слънчевият панел</b> на покрива превръща слънчевата светлина в <b>електричество</b> (ток). Токът тече по жицата до лампата и я кара да свети.' },
  { id: 'stove', label: 'Печка и дърва', icon: '🪵',
    note: 'В къщата има <b>печка</b>, а до къщата — купчина <b>дърва</b>. Дървата са гориво. Когато горят, те дават <b>топлина</b>. Димът излиза през комина.' },
  { id: 'fuel', label: 'Бензиностанция', icon: '⛽',
    note: 'Това е <b>бензиностанция</b>. Тук колите зареждат <b>бензин</b>. Бензинът е гориво: колата го изгаря в двигателя си, за да се движи.' },
  { id: 'turbine', label: 'Вятърна турбина', icon: '🌬️',
    note: 'Това е <b>вятърна турбина</b>. Вятърът е въздух, който се движи. Той върти перките ѝ и турбината произвежда <b>електричество</b>.' },
  { id: 'child', label: 'Дете с ябълка', icon: '🍎',
    note: 'Това дете държи <b>ябълка</b>. Храната дава енергия на тялото ни, за да растем, да играем и да тичаме.' },
  { id: 'plant', label: 'ТЕЦ на въглища', icon: '🏭',
    note: 'Това е <b>топлоелектрическа централа</b> (ТЕЦ). В нея се изгарят <b>въглища</b>, за да се произвежда електричество. От високите комини излиза дим.' },
];
const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));

const KINDS = [
  { icon: '☀️', label: 'Слънчева енергия' },
  { icon: '🔥', label: 'Топлинна енергия' },
  { icon: '💨', label: 'Енергия на движението' },
  { icon: '⛽', label: 'Енергия от горива и храни' },
];

// Стъпка 2: източници и верига на енергията.
const SRC = [
  { id: 'sun', name: 'Слънцето и панелът', right: 0,
    q: 'Каква енергия улавя слънчевият панел?',
    why: {
      1: 'Панелът не се нагрява, за да работи — той улавя светлината. Проследи лъчите: откъде идват те?',
      2: 'Панелът стои неподвижно на покрива. Проследи лъчите: откъде идват те?',
      3: 'Панелът не изгаря нищо. Проследи лъчите: откъде идват те?',
    },
    hint: 'лъчите идват от Слънцето.',
    ok: 'Вярно! Слънчевият панел улавя слънчевата енергия и я превръща в електричество за лампата.',
    chain: 'Слънце → панел → жица → лампа' },
  { id: 'wood', name: 'Дървата и печката', right: 1,
    q: 'Стоиш близо до печката и ти става топло. Каква енергия усещаш?',
    why: {
      0: 'Огънят е в печката, а не на небето. Какво усещаш, когато стоиш близо до огън?',
      2: 'В стаята нищо не започна да се движи. Какво усещаш, когато стоиш близо до огън?',
      3: 'Дървата наистина са гориво! Но питаме какво усещаш ти близо до огъня.',
    },
    hint: 'близо до огъня ни става топло.',
    ok: 'Вярно! Дървата са гориво. Когато горят, дават топлинна енергия и стаята се затопля.',
    chain: 'Дърва → огън → топло в стаята' },
  { id: 'fuel', name: 'Бензинът и колата', right: 3,
    q: 'Откъде колата взе енергия, за да се движи?',
    why: {
      0: 'Колата няма слънчев панел. Какво сипаха в резервоара ѝ?',
      1: 'Двигателят се нагрява, докато работи, но енергията идва отнякъде другаде. Какво сипаха в резервоара?',
      2: 'Движението е това, което колата прави. Но откъде дойде енергията за него? Какво сипаха в резервоара?',
    },
    hint: 'бензинът е гориво.',
    ok: 'Вярно! Бензинът е гориво. Двигателят го изгаря и колата се движи.',
    chain: 'Бензин → двигател → колата тръгва' },
  { id: 'child', name: 'Ябълката и детето', right: 3,
    q: 'Откъде детето получи енергия, за да тича?',
    why: {
      0: 'Детето не е слънчев панел. Какво направи то, преди да затича?',
      1: 'Тялото ни е топло, но тичаме благодарение на нещо друго. Какво направи детето, преди да затича?',
      2: 'Тичането е движение — това е, което детето прави. Но откъде дойде енергията? Какво направи то, преди да затича?',
    },
    hint: 'храната дава енергия на тялото.',
    ok: 'Вярно! Храната дава енергия на тялото. Затова детето може да тича и да играе.',
    chain: 'Ябълка → тяло → детето тича' },
  { id: 'turbine', name: 'Вятърът и турбината', right: 2,
    q: 'Каква енергия има вятърът, който върти перките?',
    why: {
      0: 'Вятърът не е светлина. Какво прави въздухът, когато духа?',
      1: 'Вятърът не грее. Какво прави въздухът, когато духа?',
      3: 'Турбината не изгаря нищо. Какво прави въздухът, когато духа?',
    },
    hint: 'вятърът е въздух, който се движи.',
    ok: 'Вярно! Вятърът е въздух в движение. Енергията на движението му върти перките на турбината.',
    chain: 'Вятър → перки → електричество' },
];
const SRCBY = Object.fromEntries(SRC.map((s) => [s.id, s]));
const PICK2SRC = { sun: 'sun', panel: 'sun', stove: 'wood', fuel: 'fuel', child: 'child', turbine: 'turbine' };

// Стъпка 3: къде се използва енергията.
const ZONES = ['🏠 В бита', '🚗 В транспорта', '🌱 Живи организми'];
const ZONE_HINT = [
  'Подсказка: това се случва у дома, в домакинството.',
  'Подсказка: това превозва хора или товари.',
  'Подсказка: това е живо същество — то расте, храни се и се развива.',
];
const USES = [
  { id: 'lamp', name: 'Лампа свети', zone: 0, say: 'Лампата у дома използва електричество — например от слънчевия панел или от вятърната турбина.' },
  { id: 'pot', name: 'Готвя на печка', zone: 0, say: 'Печката дава топлинна енергия. С нея готвим и се топлим у дома.' },
  { id: 'bus', name: 'Автобус вози хора', zone: 1, say: 'Автобусът изгаря гориво в двигателя си и вози много хора наведнъж.' },
  { id: 'train', name: 'Влак пътува', zone: 1, say: 'Влакът използва електричество или гориво, за да пренася хора и товари.' },
  { id: 'bird', name: 'Птица лети', zone: 2, say: 'Птицата получава енергия от храната си — семена и насекоми. Затова може да лети.' },
  { id: 'flower', name: 'Слънчоглед расте', zone: 2, say: 'Растенията използват слънчевата енергия, за да растат.' },
];

// Стъпка 4: кое пуска дим.
const SMOKY = {
  stove: { key: 'wood', say: 'Дървата горят в печката. През комина излиза дим със сажди — ситни черни частици.' },
  fuel: { key: 'fuel', say: 'Колата изгаря бензин. От ауспуха ѝ излизат изгорели газове — газовете, които остават след горенето.' },
  plant: { key: 'plant', say: 'В ТЕЦ-а горят въглища. От високите комини излиза много дим.' },
};
const CLEAN = {
  sun: 'Слънцето и слънчевият панел не изгарят нищо. Панелът само улавя светлина, затова не пуска дим.',
  panel: 'Слънчевият панел не изгаря нищо — той само улавя светлина. Затова не пуска дим.',
  turbine: 'Турбината се върти от вятъра и не изгаря гориво. Тя не пуска дим.',
  child: 'Детето получава енергия от храната, но не гори гориво и не пуска дим.',
};

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
function panelTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 192;
  const x = c.getContext('2d');
  x.fillStyle = '#1d3a6b'; x.fillRect(0, 0, 128, 192);
  x.strokeStyle = '#a9c6ea'; x.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 192); x.stroke(); }
  for (let j = 0; j <= 6; j++) { x.beginPath(); x.moveTo(0, j * 32); x.lineTo(128, j * 32); x.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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
function childModel() {
  const g = new THREE.Group();
  const skin = mat(0xffcc99); const shirt = mat(0xff7043); const pants = mat(0x3949ab); const shoe = mat(0x263238);
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(s * 0.08, 0.42, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.12), pants);
    leg.position.y = -0.19;
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.18), shoe);
    sh.position.set(0, -0.39, 0.03);
    hip.add(leg, sh);
    g.add(hip);
    legs.push(hip);
  }
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.36, 0.18), shirt);
  body.position.y = 0.6;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), skin);
  head.position.y = 0.92;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x6d4c41));
  hair.position.y = 0.94;
  hair.rotation.x = -0.3;
  g.add(body, head, hair);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), mat(0x111111));
    e.position.set(s * 0.05, 0.94, 0.125);
    g.add(e);
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(s * 0.2, 0.76, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.09), shirt);
    arm.position.y = -0.15;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), skin);
    hand.position.y = -0.32;
    sh.add(arm, hand);
    g.add(sh);
    arms.push(sh);
  }
  const apple = new THREE.Group();
  const ab = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), mat(0xe53935, { roughness: 0.4 }));
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 4), mat(0x5d4037));
  st.position.y = 0.08;
  const lf = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), mat(0x43a047));
  lf.scale.set(1.4, 0.4, 0.8);
  lf.position.set(0.03, 0.09, 0);
  apple.add(ab, st, lf);
  apple.position.set(0, -0.37, 0.07);
  arms[1].add(apple);
  g.userData.parts = { legs, arms, apple };
  return g;
}
function turbineModel() {
  const g = new THREE.Group();
  const white = mat(0xf4f7fa, { roughness: 0.5 });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.15, 3.6, 12), white);
  tower.position.y = 1.8;
  const nac = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.5), white);
  nac.position.set(0, 3.65, -0.05);
  const rotor = new THREE.Group();
  rotor.position.set(0, 3.65, 0.24);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), white);
  rotor.add(hub);
  for (let k = 0; k < 3; k++) {
    const arm = new THREE.Group();
    arm.rotation.z = (k * Math.PI * 2) / 3;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.45, 0.04), white);
    b.position.y = 0.78;
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.18, 0.045), mat(0xe53935));
    tip.position.y = 1.42;
    arm.add(b, tip);
    rotor.add(arm);
  }
  g.add(tower, nac, rotor);
  g.userData.rotor = rotor;
  return g;
}
function useModel(kind) {
  const g = new THREE.Group();
  const add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m; };
  if (kind === 'lamp') {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 14), mat(0x455a64)), 0, 0.03, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), mat(0x455a64)), 0, 0.3, 0);
    add(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.2, 14, 1, true), mat(0xffb74d, { side: THREE.DoubleSide })), 0, 0.6, 0);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe08a, emissiveIntensity: 1.2 })), 0, 0.5, 0);
  } else if (kind === 'pot') {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.4), mat(0xeceff1)), 0, 0.18, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 14), new THREE.MeshBasicMaterial({ color: 0xff7043 })), 0, 0.365, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.16, 14), mat(0x90a4ae, { metalness: 0.3, roughness: 0.4 })), 0, 0.45, 0);
    for (let i = 0; i < 2; i++) {
      const s = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: getPuffTex(), transparent: true, opacity: 0.6, depthWrite: false })), 0, 0.65, 0);
      s.scale.setScalar(0.22);
      s.userData.steam = i;
    }
  } else if (kind === 'bus') {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.32), mat(0x43a047, { roughness: 0.4 })), 0, 0.24, 0);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.33), mat(0xdfeefa, { roughness: 0.2 })), 0, 0.3, 0);
    for (const x of [0.28, -0.28]) for (const z of [0.15, -0.15]) {
      const w = add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10), mat(0x222222)), x, 0.07, z);
      w.rotation.x = Math.PI / 2;
    }
  } else if (kind === 'train') {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.24, 0.3), mat(0x1e88e5)), 0.08, 0.22, 0);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.3), mat(0xc62828)), -0.3, 0.42, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 8), mat(0x263238)), 0.25, 0.42, 0);
    for (const x of [0.25, 0, -0.3]) for (const z of [0.16, -0.16]) {
      const w = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), mat(0x263238)), x, 0.08, z);
      w.rotation.x = Math.PI / 2;
    }
  } else if (kind === 'bird') {
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0x1e88e5));
    body.scale.set(1.6, 0.9, 0.9);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(0x1e88e5));
    head.position.set(0.18, 0.08, 0);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), mat(0xffb300));
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.28, 0.07, 0);
    const wings = [];
    for (const s of [1, -1]) {
      const hinge = new THREE.Group();
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.3), mat(0x1565c0));
      w.position.z = s * 0.15;
      hinge.add(w);
      b.add(hinge);
      wings.push({ hinge, s });
    }
    b.add(body, head, beak);
    b.position.y = 0.45;
    g.add(b);
    g.userData.wings = wings;
    g.userData.flyer = b;
  } else if (kind === 'flower') {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.14, 12), mat(0x8d5524)), 0, 0.07, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.6, 6), mat(0x388e3c)), 0, 0.42, 0);
    for (const s of [1, -1]) {
      const l = add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0x43a047)), s * 0.08, 0.36, 0);
      l.scale.set(1.3, 0.3, 0.6);
    }
    const head = new THREE.Group();
    head.position.y = 0.76;
    head.rotation.x = 0.35;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 14), mat(0x5d4037));
    disc.rotation.x = Math.PI / 2;
    head.add(disc);
    for (let i = 0; i < 10; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(0xfdd835));
      const a = (i / 10) * Math.PI * 2;
      p.scale.set(1, 0.45, 0.3);
      p.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0);
      p.rotation.z = a;
      head.add(p);
    }
    g.add(head);
    g.userData.head = head;
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
  const STEPS = ['Опознай града', 'Проследи енергията', 'Къде се използва енергията?', 'Дим или чисто?'];
  const shell = createShell(container, { steps: STEPS });
  const SKY = new THREE.Color(0xbfe3ff); const SMOG = new THREE.Color(0x9e9b90); const NIGHT = new THREE.Color(0x15214a);
  const stage = createStage(shell.stageEl, {
    background: 0xbfe3ff, camPos: [0, 9, 18], target: [0, 1, -1],
    fog: { color: 0xbfe3ff, near: 30, far: 70 }, minDistance: 2.5, maxDistance: 32, maxPolarAngle: Math.PI * 0.45,
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

  // Състояние на града.
  const st = {
    lamp: false, fire: false, carMode: 'parked', run: false, windy: false, rays: 0, pulses: false,
    heavy: { wood: false, fuel: false, plant: false }, smog: 0, night: 0,
  };
  const lv = { lamp: 0, fire: 0, panel: 0, smog: 0, night: 0, spin: 1.2 };

  // ---------- земя, хълмове, път ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(36, 30), mat(0x8cc56a));
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = 1;
  scene.add(ground);
  for (const [x, z, r] of [[-6.8, -4.8, 2.3], [-12, -7, 2.4], [3, -8.5, 2.8], [12.5, -2, 2.2], [-3.5, -8, 2.2]]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7cb85a, { flat: true }));
    hl.scale.y = 0.38;
    hl.position.set(x, 0, z);
    scene.add(hl);
  }
  const mtnM = mat(0x8d9aa5, { flat: true }); const snowM = mat(0xf7fbff, { flat: true });
  for (const [x, z, r, h] of [[-9, -11, 3.2, 4.4], [-2, -12, 3.8, 5.4], [5, -11.5, 3.4, 4.8], [13, -10, 3, 4]]) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mtnM);
    m.position.set(x, h / 2 - 0.05, z);
    const sn = new THREE.Mesh(new THREE.ConeGeometry(r * 0.32, h * 0.32, 7), snowM);
    sn.position.set(x, h - h * 0.16 - 0.03, z);
    scene.add(m, sn);
  }
  const ROADZ = 3.4;
  const road = new THREE.Mesh(new THREE.BoxGeometry(32, 0.04, 1.4), mat(0x5f6368, { roughness: 1 }));
  road.position.set(0, 0.02, ROADZ);
  scene.add(road);
  for (let i = -15; i < 16; i += 1.5) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.01, 0.07), mat(0xffffff));
    d.position.set(i, 0.045, ROADZ);
    scene.add(d);
  }

  // ---------- къща (отворена отпред) ----------
  const HX = -2.5; const HZ = -1.2; const HW = 3.0; const HD = 2.4; const WH = 1.8;
  const house = new THREE.Group();
  const wallM = mat(0xf3e3c3); const inWallM = mat(0xfff4dd);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(HW, 0.08, HD), mat(0xb98a5a));
  floor.position.set(HX, 0.04, HZ);
  const back = new THREE.Mesh(new THREE.BoxGeometry(HW, WH, 0.1), inWallM);
  back.position.set(HX, WH / 2, HZ - HD / 2);
  const wl = new THREE.Mesh(new THREE.BoxGeometry(0.1, WH, HD), wallM);
  wl.position.set(HX - HW / 2, WH / 2, HZ);
  const wr = wl.clone();
  wr.position.x = HX + HW / 2;
  house.add(floor, back, wl, wr);
  // фронтони
  const tri = new THREE.Shape();
  tri.moveTo(-HW / 2, 0); tri.lineTo(HW / 2, 0); tri.lineTo(0, 0.9); tri.closePath();
  for (const z of [HZ - HD / 2]) {
    const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), mat(0xe8d2a8, { side: THREE.DoubleSide }));
    gm.position.set(HX, WH, z);
    house.add(gm);
  }
  const ang = Math.atan2(0.9, HW / 2);
  const slabLen = Math.hypot(HW / 2, 0.9) + 0.25;
  const roofM = mat(0xc0482f, { flat: true });
  const roofL = new THREE.Group();
  roofL.position.set(HX - HW / 4 - 0.1, WH + 0.45 - 0.04, HZ);
  roofL.rotation.z = ang;
  roofL.add(new THREE.Mesh(new THREE.BoxGeometry(slabLen, 0.08, HD + 0.4), roofM));
  const roofR = new THREE.Group();
  roofR.position.set(HX + HW / 4 + 0.1, WH + 0.45 - 0.04, HZ);
  roofR.rotation.z = -ang;
  roofR.add(new THREE.Mesh(new THREE.BoxGeometry(slabLen, 0.08, HD + 0.4), roofM));
  house.add(roofL, roofR);
  // слънчев панел на лявата страна на покрива
  const panelM = new THREE.MeshStandardMaterial({ map: panelTexture(), roughness: 0.3, metalness: 0.2, emissive: 0x4fa3ff, emissiveIntensity: 0 });
  const panel = new THREE.Group();
  const pm = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.05, 1.9), panelM);
  pm.position.y = 0.07;
  panel.add(pm);
  panel.userData.pickId = 'panel';
  roofL.add(panel);
  // маса и стол
  const tbl = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.5), mat(0x8d6e63));
  top.position.y = 0.5;
  tbl.add(top);
  for (const [x, z] of [[0.3, 0.2], [-0.3, 0.2], [0.3, -0.2], [-0.3, -0.2]]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), mat(0x6d4c41));
    l.position.set(x, 0.25, z);
    tbl.add(l);
  }
  tbl.position.set(HX - 0.8, 0.06, HZ - 0.1);
  house.add(tbl);
  // лампа
  const LAMP = new V3(HX - 0.3, 1.35, HZ);
  const lampG = new THREE.Group();
  lampG.userData.pickId = 'panel';
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.65 - LAMP.y, 4), mat(0x333333));
  cord.position.set(LAMP.x, (2.65 + LAMP.y) / 2, LAMP.z);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 14, 1, true), mat(0x2e7d32, { side: THREE.DoubleSide }));
  shade.position.set(LAMP.x, LAMP.y + 0.08, LAMP.z);
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, emissive: 0xffd36b, emissiveIntensity: 0 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), bulbM);
  bulb.position.copy(LAMP);
  lampG.add(cord, shade, bulb);
  house.add(lampG);
  addHitBox(lampG, 0.5);
  const lampLight = new THREE.PointLight(0xffd88a, 0, 4.5, 1.5);
  lampLight.position.copy(LAMP).add(new V3(0, -0.15, 0.2));
  house.add(lampLight);
  // жица от панела до лампата
  const wireCurve = new THREE.CatmullRomCurve3([
    [HX - 0.95, 2.18, HZ + 0.6], [HX - 1.42, 1.86, HZ + 0.6], [HX - 1.3, 1.72, HZ + 0.3],
    [HX - 0.9, 2.1, HZ], [HX - 0.3, 2.62, HZ], [LAMP.x, 2.4, LAMP.z], [LAMP.x, LAMP.y + 0.15, LAMP.z],
  ].map((p) => new V3(...p)), false, 'centripetal');
  const wire = new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 60, 0.018, 5), mat(0x263238));
  house.add(wire);
  // печка с комин
  const stoveG = new THREE.Group();
  stoveG.userData.pickId = 'stove';
  const SX = HX + 0.9; const SZ = HZ - 0.75;
  const sb = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.7, 0.5), mat(0x37474f, { roughness: 0.5 }));
  sb.position.set(SX, 0.43, SZ);
  const winM = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), winM);
  win.position.set(SX, 0.42, SZ + 0.252);
  const pipeH = 3.25 - 0.78;
  const spipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, pipeH, 10), mat(0x455a64, { roughness: 0.5 }));
  spipe.position.set(SX, 0.78 + pipeH / 2, SZ);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 10), mat(0x263238));
  cap.position.set(SX, 3.26, SZ);
  stoveG.add(sb, win, spipe, cap);
  const flames = [];
  const flameM = new THREE.MeshBasicMaterial({ color: 0xffa726 });
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), flameM);
    f.position.set(SX - 0.09 + i * 0.09, 0.38, SZ + 0.27);
    f.visible = false;
    f.userData.ph = i * 1.7;
    stoveG.add(f);
    flames.push(f);
  }
  house.add(stoveG);
  addHitBox(stoveG, 0.7);
  const fireLight = new THREE.PointLight(0xff8a3d, 0, 3.5, 1.5);
  fireLight.position.set(SX, 0.6, SZ + 0.6);
  house.add(fireLight);
  const CH_TOP = new V3(SX, 3.32, SZ);
  scene.add(house);
  // дърва до къщата
  const WOOD = new V3(HX + HW / 2 + 0.75, 0, HZ - 0.5);
  const woodG = new THREE.Group();
  woodG.userData.pickId = 'stove';
  woodG.position.copy(WOOD);
  const logM = mat(0x8d6e63); const endM = mat(0xd7b98a);
  const logs = [];
  [[-0.2, 0.09], [0, 0.09], [0.2, 0.09], [-0.1, 0.26], [0.1, 0.26], [0, 0.43]].forEach(([x, y]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8), [logM, endM, endM]);
    l.rotation.x = Math.PI / 2;
    l.position.set(x, y, 0);
    woodG.add(l);
    logs.push(l);
  });
  scene.add(woodG);
  addHitBox(woodG, 0.8);

  // ---------- бензиностанция и кола ----------
  const STA = new V3(5.6, 0, 1.0);
  const station = new THREE.Group();
  station.userData.pickId = 'fuel';
  station.position.copy(STA);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 1.9), mat(0xf5f5f5));
  canopy.position.set(0, 1.9, 0.2);
  const band = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.08, 1.92), mat(0x2e7d32));
  band.position.set(0, 1.84, 0.2);
  station.add(canopy, band);
  for (const x of [-1.1, 1.1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.84, 0.12), mat(0xeceff1));
    p.position.set(x, 0.92, -0.3);
    station.add(p);
  }
  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.9, 0.3), mat(0xd32f2f));
  pump.position.set(0, 0.45, -0.1);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.16), new THREE.MeshBasicMaterial({ color: 0x263238 }));
  screen.position.set(0, 0.72, 0.052);
  const hoseCurve = new THREE.CatmullRomCurve3([[0.18, 0.6, 0.0], [0.32, 0.25, 0.12], [0.3, 0.4, 0.4], [0.2, 0.42, 0.55]].map((p) => new V3(...p)));
  const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 20, 0.025, 5), mat(0x212121));
  station.add(pump, screen, hose);
  const stL = labelSprite('бензиностанция', { size: 0.26 });
  stL.position.set(0, 2.3, 0.2);
  station.add(stL);
  stage.steadyLabel(stL, 7);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 2.6), mat(0x9e9e9e, { roughness: 1 }));
  pad.position.set(0, 0.015, 0.9);
  station.add(pad);
  scene.add(station);
  const NOZZLE = STA.clone().add(new V3(0.2, 0.42, 0.55));
  const car = carModel(0x1e88e5);
  car.scale.setScalar(1.35);
  car.userData.pickId = 'fuel';
  const CAR0 = new V3(STA.x, 0.03, STA.z + 0.95);
  car.position.copy(CAR0);
  scene.add(car);
  addHitBox(car, 0.9);
  addHitBox(station, 1);

  // ---------- вятърна турбина ----------
  const TUR = new V3(-6.8, 0.78, -4.8);
  const turbine = turbineModel();
  turbine.position.copy(TUR);
  turbine.userData.pickId = 'turbine';
  scene.add(turbine);
  addHitBox(turbine, 1);
  const rotor = turbine.userData.rotor;

  // ---------- дете и пътечка ----------
  const TRACK = new V3(2.3, 0, 0.0); const TR = 1.05;
  const trackM = new THREE.Mesh(new THREE.RingGeometry(TR - 0.2, TR + 0.2, 40), mat(0xd7b98a, { roughness: 1 }));
  trackM.rotation.x = -Math.PI / 2;
  trackM.position.set(TRACK.x, 0.012, TRACK.z);
  scene.add(trackM);
  const child = childModel();
  child.userData.pickId = 'child';
  const CHILD0 = new V3(TRACK.x, 0, TRACK.z + TR);
  child.position.copy(CHILD0);
  scene.add(child);
  addHitBox(child, 0.8);
  const { legs, arms, apple } = child.userData.parts;
  let runA = 0;

  // ---------- ТЕЦ на въглища ----------
  const PL = new V3(8.6, 0, -5.8);
  const plant = new THREE.Group();
  plant.userData.pickId = 'plant';
  plant.position.copy(PL);
  const pb = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.4), mat(0xa1887f));
  pb.position.set(0, 0.65, 0.3);
  const proof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 1.5), mat(0x6d4c41));
  proof.position.set(0, 1.35, 0.3);
  plant.add(pb, proof);
  const PL_TOPS = [];
  for (const x of [-0.6, 0.6]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3.4, 12), mat(0xeeeeee));
    c.position.set(x, 1.7, -0.6);
    const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.25, 12), mat(0xd32f2f));
    r1.position.set(x, 3.0, -0.6);
    plant.add(c, r1);
    PL_TOPS.push(PL.clone().add(new V3(x, 3.45, -0.6)));
  }
  const coal = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x212121, { flat: true }));
  coal.scale.y = 0.55;
  coal.position.set(-1.7, 0, 0.7);
  plant.add(coal);
  const plL = labelSprite('ТЕЦ', { size: 0.26 });
  plL.position.set(0, 1.75, 0.9);
  plant.add(plL);
  stage.steadyLabel(plL, 7);
  scene.add(plant);
  addHitBox(plant, 1);

  // ---------- дървета, небе ----------
  const swayers = [];
  for (const [x, z, s, pine] of [[-6, -2.5, 1, 1], [-5.4, 0.8, 0.9, 0], [-10.5, -1.5, 1, 1], [-11, 1.5, 0.9, 0], [0.8, -3.4, 1, 1],
    [4.2, -2.8, 1, 0], [11, 0.5, 1, 1], [10, 1.8, 0.9, 0], [-7, 6.2, 1, 0], [7.5, 6.5, 0.9, 1], [-12, 5.2, 1, 1], [12, 5.5, 1, 0], [6.2, -4.2, 0.9, 1]]) {
    const t = treeModel(s * 1.2, !!pine);
    t.position.set(x, 0, z);
    t.userData.ph = x + z;
    scene.add(t);
    swayers.push(t);
  }
  const SUN0 = new V3(-6.2, 6.6, -9);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffd84a, fog: false }));
  sunBall.position.copy(SUN0);
  sunBall.userData.pickId = 'sun';
  scene.add(sunBall);
  addHitBox(sunBall, 2);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: getPuffTex(), color: 0xffe57f, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
  halo.scale.setScalar(3.6);
  sunBall.add(halo);
  const clouds = []; const cloudMats = [];
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
    c.position.set(-12 + i * 7, 6.6 + (i % 2) * 0.8, -7 + (i % 2) * 1.5);
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
    b.userData = { wings, ph: i * 2.1, r: 1.8 + i * 0.7, vis: 1 };
    scene.add(b);
    birds.push(b);
  }
  const starPos = [];
  for (let i = 0; i < 140; i++) starPos.push((Math.random() - 0.5) * 40, 5 + Math.random() * 10, -13 - Math.random() * 4);
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const starM = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0, fog: false });
  scene.add(new THREE.Points(starGeo, starM));

  // ---------- частици: дим, лъчи, ток, вятър, гориво ----------
  const puffs = [];
  for (let i = 0; i < 170; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: getPuffTex(), transparent: true, depthWrite: false }));
    s.visible = false;
    s.userData = { life: 0, max: 1, v: new V3(), s0: 0.3, s1: 1, op: 0.6 };
    scene.add(s);
    puffs.push(s);
  }
  let pi0 = 0;
  function puff(pos, color, op, s0, s1, life, vx, vy, vz = 0) {
    const s = puffs[pi0 = (pi0 + 1) % puffs.length];
    s.visible = true;
    s.position.copy(pos);
    s.material.color.set(color);
    Object.assign(s.userData, { life: 0, max: life, s0, s1, op });
    s.userData.v.set(vx + (Math.random() - 0.5) * 0.12, vy, vz + (Math.random() - 0.5) * 0.12);
  }
  // точки, които летят от A до B (лъчи, ток, капки гориво)
  const dotGeo = new THREE.SphereGeometry(1, 8, 6);
  const dots = [];
  for (let i = 0; i < 90; i++) {
    const d = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.95, fog: false }));
    d.visible = false;
    d.userData = { k: 0, dur: 1, path: null };
    scene.add(d);
    dots.push(d);
  }
  let di0 = 0;
  function dot(path, color, size, dur) {
    const d = dots[di0 = (di0 + 1) % dots.length];
    d.visible = true;
    d.material.color.set(color);
    d.scale.setScalar(size);
    Object.assign(d.userData, { k: 0, dur, path });
    path(0, d.position);
  }
  const PANEL_C = new V3(HX - HW / 4 - 0.1, WH + 0.55, HZ);
  const rayPath = (off) => (k, out) => out.lerpVectors(sunBall.position, PANEL_C.clone().add(off), k);
  const wirePath = (k, out) => { out.copy(wireCurve.getPointAt(k)); };
  const fuelPath = (k, out) => { out.lerpVectors(NOZZLE, CAR0.clone().add(new V3(0.1, 0.32, -0.22)), k); out.y += Math.sin(k * Math.PI) * 0.12; };
  const streaks = [];
  for (let i = 0; i < 24; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
    s.userData = { x: -14 + Math.random() * 6, y: 3 + Math.random() * 1.6, z: TUR.z + (Math.random() - 0.5) * 1.6, sp: 3 + Math.random() * 1.5 };
    s.visible = false;
    scene.add(s);
    streaks.push(s);
  }

  // ---------- главен цикъл ----------
  const tmpC = new THREE.Color();
  const emitT = { ch: 0, car: 0, pl: 0, ray: 0, pulse: 0, heat: 0 };
  stage.tick((dt, t) => {
    // нива
    lv.lamp += ((st.lamp && lv.night < 0.5 ? 1 : 0) - lv.lamp) * Math.min(1, dt * 3);
    lv.fire += ((st.fire ? 1 : 0) - lv.fire) * Math.min(1, dt * 2);
    lv.panel += ((st.lamp && lv.night < 0.5 ? 1 : 0) - lv.panel) * Math.min(1, dt * 2);
    lv.smog += (st.smog - lv.smog) * Math.min(1, dt * 0.9);
    lv.night += (st.night - lv.night) * Math.min(1, dt * 0.6);
    lv.spin += ((st.windy ? 7 : 1.2) - lv.spin) * Math.min(1, dt * 1.2);
    // небе
    tmpC.copy(SKY).lerp(SMOG, lv.smog).lerp(NIGHT, lv.night);
    scene.background.copy(tmpC);
    scene.fog.color.copy(tmpC);
    scene.fog.near = lerp(30, 12, lv.smog);
    scene.fog.far = lerp(70, 44, lv.smog);
    stage.hemi.intensity = lerp(lerp(1.1, 0.85, lv.smog), 0.3, lv.night);
    stage.sun.intensity = lerp(1.6, 0.15, lv.night);
    sunBall.position.set(SUN0.x - lv.night * 3, SUN0.y - lv.night * 8, SUN0.z);
    sunBall.visible = lv.night < 0.95;
    sunBall.material.color.setHex(0xffd84a).lerp(tmpC.setHex(0xd8c48a), lv.smog);
    halo.material.opacity = 0.55 * (1 - lv.smog * 0.7);
    starM.opacity = Math.max(0, lv.night - 0.3) * 1.4;
    for (const m of cloudMats) m.color.setRGB(lerp(lerp(1, 0.72, lv.smog), 0.3, lv.night), lerp(lerp(1, 0.71, lv.smog), 0.33, lv.night), lerp(lerp(1, 0.68, lv.smog), 0.45, lv.night));
    for (const c of clouds) { c.position.x += dt * 0.3; if (c.position.x > 15) c.position.x = -15; }
    birds.forEach((b) => {
      const u = b.userData;
      u.vis += ((lv.smog < 0.3 && lv.night < 0.4 ? 1 : 0) - u.vis) * Math.min(1, dt);
      b.visible = u.vis > 0.05;
      b.scale.setScalar(Math.max(0.001, u.vis));
      const a = t * 0.35 + u.ph;
      b.position.set(1 + Math.cos(a) * u.r * 1.6, 5 + Math.sin(t * 0.8 + u.ph) * 0.3, -4 + Math.sin(a) * u.r);
      b.rotation.y = -a;
      for (const w of u.wings) w.hinge.rotation.x = w.s * Math.sin(t * 7 + u.ph) * 0.5;
    });
    for (const s of swayers) s.rotation.z = Math.sin(t * 0.8 + s.userData.ph) * 0.03;
    // лампа и панел
    bulbM.emissiveIntensity = lv.lamp * 1.6;
    bulbM.color.setHex(0xe0e0e0).lerp(tmpC.setHex(0xfff3c4), lv.lamp);
    lampLight.intensity = lv.lamp * 3;
    panelM.emissiveIntensity = lv.panel * 0.35 + (st.rays > 1 ? 0.25 * (0.5 + 0.5 * Math.sin(t * 8)) : 0);
    // огън
    for (const f of flames) {
      f.visible = lv.fire > 0.05;
      f.scale.set(lv.fire, lv.fire * (0.8 + 0.4 * Math.sin(t * 13 + f.userData.ph)), lv.fire);
    }
    winM.color.setHex(0x1a1a1a).lerp(tmpC.setHex(0xff8f00), lv.fire * (0.85 + 0.15 * Math.sin(t * 17)));
    fireLight.intensity = lv.fire * (2.2 + 0.4 * Math.sin(t * 11));
    // дим от комина на къщата
    emitT.ch += dt;
    if (st.fire) {
      const heavy = st.heavy.wood;
      if (emitT.ch > (heavy ? 0.1 : 0.32)) { emitT.ch = 0; puff(CH_TOP, heavy ? 0x4a4a4a : 0x9a9a9a, heavy ? 0.8 : 0.5, 0.25, heavy ? 1.8 : 1.0, 3.5, 0.3, 0.5); }
      emitT.heat += dt;
      if (emitT.heat > 0.22) { emitT.heat = 0; puff(new V3(SX + (Math.random() - 0.5) * 0.4, 0.85, SZ + 0.35), 0xffa040, 0.35, 0.2, 0.7, 2.2, -0.15, 0.3, 0.15); }
    }
    // ТЕЦ
    emitT.pl += dt;
    const plHeavy = st.heavy.plant;
    if (emitT.pl > (plHeavy ? 0.09 : 0.45)) {
      emitT.pl = 0;
      for (const p of PL_TOPS) puff(p, plHeavy ? 0x474747 : 0xbdbdbd, plHeavy ? 0.85 : 0.5, 0.35, plHeavy ? 2.6 : 1.3, 4.5, 0.35, 0.55);
    }
    // кола
    if (st.carMode === 'drive') {
      car.position.x += dt * 1.2;
      if (car.position.x > 14) car.position.x = -14;
      car.position.y = 0.03 + Math.abs(Math.sin(t * 9)) * 0.01;
      emitT.car += dt;
      const heavy = st.heavy.fuel;
      if (emitT.car > (heavy ? 0.08 : 0.25)) { emitT.car = 0; puff(car.position.clone().add(new V3(-0.55, 0.15, 0.12)), heavy ? 0x444444 : 0x8a8a8a, heavy ? 0.8 : 0.5, 0.15, heavy ? 1.3 : 0.8, 1.8, -0.25, 0.3); }
    }
    // турбина и вятър
    rotor.rotation.z -= dt * lv.spin;
    for (const s of streaks) {
      const u = s.userData;
      s.visible = st.windy;
      if (!st.windy) continue;
      u.x += dt * u.sp;
      if (u.x > TUR.x + 1.5) { u.x = -14 - Math.random() * 3; u.y = 3 + Math.random() * 1.6; }
      s.position.set(u.x, u.y + Math.sin(t * 2 + u.z) * 0.1, u.z);
      s.material.opacity = 0.75 * Math.min(1, (TUR.x + 1.5 - u.x) / 2);
    }
    // лъчи и ток
    emitT.ray += dt;
    const rayRate = st.rays > 1 ? 0.05 : st.rays === 1 ? 0.5 : 0;
    if (rayRate && lv.night < 0.4 && emitT.ray > rayRate) {
      emitT.ray = 0;
      dot(rayPath(new V3((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 1.4)), 0xffe14a, 0.07, 1.1);
    }
    emitT.pulse += dt;
    if (st.pulses && lv.night < 0.5 && emitT.pulse > 0.3) { emitT.pulse = 0; dot(wirePath, 0xfff176, 0.045, 1.4); }
    // дете
    if (st.run) {
      runA += dt * 2.0;
      child.position.set(TRACK.x + Math.sin(runA) * TR, Math.abs(Math.sin(t * 12)) * 0.05, TRACK.z + Math.cos(runA) * TR);
      child.rotation.y = runA + Math.PI / 2;
      const sw = Math.sin(t * 12) * 0.8;
      legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
      if (!apple.visible) { arms[0].rotation.x = -sw * 0.8; arms[1].rotation.x = sw * 0.8; }
    } else {
      child.position.y = Math.abs(Math.sin(t * 1.6)) * 0.015;
      arms[0].rotation.z = -0.08 - Math.sin(t * 1.6) * 0.04;
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
    for (const d of dots) {
      if (!d.visible) continue;
      const u = d.userData;
      u.k += dt / u.dur;
      if (u.k >= 1) { d.visible = false; continue; }
      u.path(u.k, d.position);
    }
    for (const m of markers) { m.position.y = m.userData.y0 + Math.sin(t * 3 + m.userData.ph) * 0.12; m.rotation.y = t * 1.2; }
    for (const g of sortItems) {
      if (g.userData.wings) for (const w of g.userData.wings) w.hinge.rotation.x = w.s * Math.sin(t * 9) * 0.6;
      if (g.userData.flyer) g.userData.flyer.position.y = 0.45 + Math.sin(t * 2) * 0.06;
      if (g.userData.head) g.userData.head.rotation.z = Math.sin(t * 1.2) * 0.1;
      g.traverse((o) => { if (o.userData.steam !== undefined) { const k = (t * 0.6 + o.userData.steam * 0.5) % 1; o.position.y = 0.6 + k * 0.4; o.material.opacity = 0.6 * (1 - k); } });
    }
  });

  // ---------- маркери над източниците ----------
  const MK = {
    sun: new V3(HX - 1.0, 3.5, HZ), wood: WOOD.clone().setY(1.25), fuel: STA.clone().add(new V3(0, 2.75, 0.2)),
    child: CHILD0.clone().setY(1.65), turbine: TUR.clone().add(new V3(0.9, 1.2, 0.4)),
  };
  const markers = [];
  const markerByID = {};
  for (const id in MK) {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: 0xffca28, emissive: 0x6a4300, roughness: 0.4 });
    const tp = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 10), m);
    tp.rotation.x = Math.PI;
    tp.position.y = 0.3;
    const dt0 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), m);
    dt0.position.y = -0.04;
    g.add(tp, dt0);
    g.position.copy(MK[id]);
    g.userData = { pickId: 'mk-' + id, y0: MK[id].y, ph: markers.length, m };
    g.visible = false;
    scene.add(g);
    addHitBox(g, 0.7);
    markers.push(g);
    markerByID[id] = g;
  }
  const sortItems = [];

  // ---------- изглед и балончета ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.4, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.08;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, dur);
  }
  const overview = () => fitView([-0.2, 1.5, -2.2], 9.9, 4.1, 0.5);
  const VIEW = {
    sun: () => fitView([-4.6, 3.8, -4], 4.2, 3.8, 0.2),
    panel: () => fitView([HX - 0.3, 1.6, HZ], 2.6, 1.9, 0.4),
    stove: () => fitView([HX + 0.8, 1.4, HZ], 2.6, 1.9, 0.35),
    fuel: () => fitView([STA.x + 0.6, 0.9, STA.z + 1.3], 3.8, 1.7, 0.45),
    turbine: () => fitView([TUR.x, 3.0, TUR.z], 2.8, 3.4, 0.2),
    child: () => fitView([TRACK.x, 0.6, TRACK.z + 0.3], 2.0, 1.4, 0.5),
    plant: () => fitView([PL.x, 2.0, PL.z], 3.2, 2.6, 0.3),
  };
  const ANCH = {
    sun: SUN0.clone().add(new V3(0, -1, 0)), panel: PANEL_C.clone().add(new V3(0, 0.3, 0)), stove: new V3(SX, 1.3, SZ + 0.3),
    fuel: STA.clone().add(new V3(0, 2.2, 0.2)), turbine: TUR.clone().add(new V3(0, 2.2, 0)), child: CHILD0.clone().setY(1.25),
    plant: PL.clone().add(new V3(0, 2.4, 0)), lamp: LAMP.clone().add(new V3(0, -0.1, 0)),
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
    c.innerHTML = `<p class="energy-q">${q}</p><div class="choices ${cls}">${items.map((t, i) => `<button class="choice" data-i="${i}">${t}</button>`).join('')}</div>`;
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
    title: 'Разгледай града',
    items: PLACES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  function step1() {
    shell.step(0);
    const seen = new Set();
    shell.task(`<p>Това е малък град. Тук енергията идва от различни <b>източници</b>.</p>
      <p><b>Разгледай всичко:</b> избери от менюто в ъгъла или кликни върху нещата в сцената.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Целият град</button><button class="btn primary nx" disabled>Напред →</button></div>');
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
      if (seen.size === PLACES.length) { next.disabled = false; shell.msg('Разгледа целия град! Продължи напред.', 'good'); }
    };
    clickHandler = (id) => { if (!PLACE[id]) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); menu.show(false); clearTip(); step2(); });
    overview();
  }

  // ---------- 2. Проследи енергията ----------
  const CHAINS = {
    async sun() {
      fitView([-4.2, 3.4, -3.2], 4.0, 3.6, 0.2);
      st.rays = 2;
      say(ANCH.sun, '☀️ Слънчевите лъчи летят към панела на покрива.', '', 0.2);
      await wait(2.6);
      st.pulses = true; st.lamp = true;
      say(ANCH.panel, '🔆 Панелът превръща светлината в електричество. То тече по жицата…', '', 0.2);
      await wait(2.4);
      st.rays = 1;
      VIEW.panel();
      await wait(1.0);
      say(ANCH.lamp, '💡 …и лампата в къщата светна!', 'good', 0.1);
      await wait(1.6);
    },
    async wood() {
      VIEW.stove();
      await wait(0.8);
      const l = logs[5];
      const wp = l.getWorldPosition(new V3());
      scene.attach(l);
      l.position.copy(wp);
      say(ANCH.stove, '🪵 Слагаме дърва в печката…', '', 0.2);
      await hop(l, new V3(SX, 0.45, SZ + 0.35), 1.1, 1.9);
      l.visible = false;
      st.fire = true;
      say(ANCH.stove, '🔥 Дървата горят. Огънят затопля печката и въздуха в стаята.', '', 0.2);
      await wait(2.6);
      say(new V3(HX - 0.4, 1.0, HZ + 0.4), '🌡️ В стаята стана топло. Димът излиза през комина.', 'good', 0.1);
      await wait(2.2);
    },
    async fuel() {
      VIEW.fuel();
      await wait(0.8);
      say(ANCH.fuel, '⛽ Колата зарежда бензин.', '', 0.2);
      for (let i = 0; i < 18; i++) { dot(fuelPath, 0xffb300, 0.035, 0.6); await wait(0.1); }
      await wait(0.6);
      say(car, '🚗 Двигателят изгаря бензина и колата тръгва!', '', 0.6);
      const to = new V3(STA.x + 1.4, 0.03, ROADZ);
      const from = car.position.clone();
      await phase(1.4, (k) => { car.position.lerpVectors(from, to, ease(k)); car.rotation.y = -Math.sin(k * Math.PI) * 0.6; });
      car.rotation.y = 0;
      st.carMode = 'drive';
      await wait(1.0);
    },
    async child() {
      VIEW.child();
      await wait(0.8);
      say(ANCH.child, '🍎 Детето изяжда ябълката.', '', 0.2);
      await phase(0.6, (k) => { arms[1].rotation.x = -2.0 * ease(k); arms[1].rotation.z = 0.5 * ease(k); });
      for (let b = 0; b < 3; b++) {
        await wait(0.45);
        apple.scale.setScalar(1 - (b + 1) * 0.28);
        child.rotation.x = 0.06;
        await wait(0.15);
        child.rotation.x = 0;
      }
      apple.visible = false;
      await phase(0.5, (k) => { arms[1].rotation.x = -2.0 * (1 - k); arms[1].rotation.z = 0.5 * (1 - k); });
      st.run = true;
      say(child, '🏃 Сега тялото има енергия и детето тича!', 'good', 0.4);
      await wait(3.2);
    },
    async turbine() {
      VIEW.turbine();
      await wait(0.8);
      st.windy = true;
      say(ANCH.turbine, '💨 Задуха силен вятър…', '', 0.4);
      await wait(2.2);
      say(ANCH.turbine, '🌀 …и перките се завъртяха бързо! Турбината произвежда електричество.', 'good', 0.4);
      await wait(2.2);
    },
  };
  function step2() {
    shell.step(1);
    let mistakes = 0;
    const done = new Set();
    let busy = false;
    for (const id in markerByID) markerByID[id].visible = true;
    overview();
    const list = () => `<ul class="energy-kinds">${SRC.map((s) => `<li class="${done.has(s.id) ? 'on' : ''}">${done.has(s.id) ? '✓ ' + esc(s.chain) + ': <b>' + esc(KINDS[s.right].label.toLowerCase()) + '</b>' : '… ' + esc(s.name)}</li>`).join('')}</ul>`;
    const upd = () => shell.score(`Проследени: ${done.size} от ${SRC.length} · грешки: ${mistakes}`);
    const intro = () => {
      shell.task(`<p><b>Проследи енергията!</b> Кликни върху източник, отбелязан с жълта стрелка, и гледай какво става.</p>${list()}`);
      shell.setControls('<div class="row"><button class="btn all">🔭 Целият град</button></div>').querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
      upd();
    };
    intro();
    clickHandler = async (pid) => {
      const id = pid && pid.startsWith('mk-') ? pid.slice(3) : PICK2SRC[pid];
      if (busy || !id || !SRCBY[id] || done.has(id)) return;
      busy = true;
      const S = SRCBY[id];
      markerByID[id].visible = false;
      shell.msg('');
      shell.task(`<p>Наблюдавай: <b>${esc(S.chain)}</b>.</p>`);
      shell.setControls('');
      await CHAINS[id]();
      let wrongHere = 0;
      const box = shell.setControls('<div></div>').firstChild;
      choiceBox(box, S.q, KINDS.map((k) => `<span>${k.icon}</span>${k.label}`), S.right,
        (i) => { wrongHere++; return wrongHere >= 2 ? `Подсказка: ${S.hint}` : S.why[i]; },
        () => {
          done.add(id);
          busy = false;
          shell.msg(S.ok, 'good');
          if (done.size < SRC.length) {
            intro(); shell.msg(S.ok, 'good');
            const n = done.size;
            wait(2.2).then(() => { if (!busy && done.size === n) { clearTip(); overview(); } });
            return;
          }
          clickHandler = null;
          clearTip();
          overview();
          shell.task(`<p>Проследи енергията от всички източници! Енергията идва от Слънцето, от вятъра, от горивата и от храната.</p>${list()}`);
          upd();
          const c = shell.setControls('<button class="btn primary">Напред →</button>');
          c.querySelector('button').addEventListener('click', () => { scores.push(stepScore(mistakes, 3)); shell.msg(''); step3(); });
        },
        () => { mistakes++; upd(); }, 'energy-pick');
    };
  }

  // ---------- 3. Къде се използва енергията ----------
  let stopDrag = null;
  function step3() {
    shell.step(2);
    clickHandler = null;
    clearTip();
    let mistakes = 0; let wrongHere = 0;
    const nar = narrowUI();
    const ZZ = 6.3; const ZR = nar ? 0.85 : 1.05;
    const zx = nar ? [-2.3, 0, 2.3] : [-3.2, 0, 3.2];
    const sortG = new THREE.Group();
    scene.add(sortG);
    const zones = [zoneRing(0xef6c00, ZR), zoneRing(0x1565c0, ZR), zoneRing(0x2e7d32, ZR)];
    zones.forEach((z, i) => {
      z.position.set(zx[i], 0.005, ZZ);
      sortG.add(z);
      const l = labelSprite(ZONES[i], { size: 0.26, color: ['#a84300', '#0d47a1', '#1b5e20'][i] });
      l.position.set(zx[i], 0.2, ZZ + ZR + 0.3);
      sortG.add(l);
    });
    const SPAWN = new V3(0, 0, 4.75);
    const order = shuffle(USES);
    const items = order.map((U) => {
      const g = useModel(U.id);
      g.position.copy(SPAWN);
      const l = labelSprite(U.name, { size: 0.2 });
      l.position.set(0, 1.05, 0);
      g.add(l);
      g.userData.U = U;
      g.visible = false;
      sortG.add(g);
      addHitBox(g, 0.8);
      sortItems.push(g);
      return g;
    });
    const inZone = [0, 0, 0];
    const slots = nar ? [[-0.3, -0.12], [0.3, 0.12]] : [[-0.4, -0.15], [0.4, 0.15]];
    let cur = 0;
    const view3 = () => fitView([0, 0.4, 5.7], nar ? 3.3 : 4.8, 1.8, 0.85);
    view3();
    const upd = () => shell.score(`Подредени: ${cur} от ${items.length} · грешки: ${mistakes}`);
    shell.task(`<p>Енергията ни трябва навсякъде: <b>у дома</b> (в бита), <b>в транспорта</b> и на <b>живите организми</b>.</p>
      <p><b>Влачи</b> всяка картинка в правилния кръг.</p>`);
    shell.setControls('');
    const show = () => {
      const g = items[cur];
      g.visible = true;
      g.userData.dragId = g.userData.U.id;
      g.userData.pickId = 'u-' + g.userData.U.id;
      upd();
    };
    show();
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => clearTip(),
      onDrop: async (g) => {
        const U = g.userData.U;
        let zi = -1;
        zx.forEach((x, i) => { if (Math.hypot(g.position.x - x, g.position.z - ZZ) < ZR + 0.3) zi = i; });
        if (zi < 0) { await hop(g, SPAWN, 0.4, 0.2); return; }
        if (zi !== U.zone) {
          mistakes++; wrongHere++;
          shell.msg(`„${U.name}“ не е на мястото си. ` + (wrongHere >= 2 ? ZONE_HINT[U.zone] : 'Помисли кой или какво използва енергията тук.'), 'bad');
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
        shell.msg(`Вярно! ${U.say}`, 'good');
        say(g, U.say, 'good', 0.8);
        cur++;
        if (cur < items.length) { show(); return; }
        upd();
        await wait(1.2);
        shell.task('<p>Енергията се използва <b>в бита</b> (лампа, печка) и <b>в транспорта</b> (автобус, влак, кола). Използват я и <b>живите организми</b> (растения, животни, хора).</p>');
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => {
          scores.push(stepScore(mistakes, 3));
          if (stopDrag) { stopDrag(); stopDrag = null; }
          clearTip(); shell.msg(''); step4();
        });
      },
    });
  }

  // ---------- 4. Дим или чисто? + предсказване ----------
  function step4() {
    shell.step(3);
    let mistakes = 0; let wrongHere = 0;
    const found = new Set();
    overview();
    const upd = () => shell.score(`Открити: ${found.size} от 3 · грешки: ${mistakes}`);
    shell.task(`<p>Енергията от горивата има и цена. <b>Кликни върху всичко в града, което изгаря гориво и пуска дим.</b></p>
      <p class="small">Разгледай комините и ауспусите.</p>`);
    shell.setControls('<div class="row"><button class="btn all">🔭 Целият град</button></div>').querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
    upd();
    clickHandler = (pid) => {
      if (!pid) return;
      const S = SMOKY[pid];
      if (S) {
        if (found.has(S.key)) return;
        found.add(S.key);
        wrongHere = 0;
        st.heavy[S.key] = true;
        st.smog = (found.size / 3) * 0.85;
        const anchor = pid === 'stove' ? CH_TOP : pid === 'fuel' ? car : ANCH.plant;
        say(anchor, '⚠️ ' + S.say, 'bad', pid === 'fuel' ? 0.6 : 0.3);
        shell.msg('Вярно! ' + S.say, 'good');
        upd();
        if (found.size === 3) { clickHandler = null; done(); }
        return;
      }
      if (CLEAN[pid]) {
        mistakes++; wrongHere++;
        shell.msg(wrongHere >= 2 ? CLEAN[pid] + ' Подсказка: търси комини и ауспуси, от които излиза дим.' : CLEAN[pid], 'bad');
        upd();
      }
    };
    async function done() {
      await wait(2.0);
      overview();
      await wait(1.0);
      say(new V3(0, 4.6, -3), '🌫️ Виж небето! Когато изгаряме дърва, въглища и бензин, във въздуха отиват дим и вредни газове. Въздухът се замърсява.', 'wide bad', 0);
      shell.task(`<p>Изгарянето на <b>горива</b> — дърва, въглища, бензин — дава енергия, но <b>замърсява въздуха</b>.</p>
        <p>Слънчевият панел и вятърната турбина <b>не замърсяват въздуха, докато работят</b>. Те не изгарят нищо.</p>`);
      const c = shell.setControls('<button class="btn primary">Предскажи →</button>');
      c.querySelector('button').addEventListener('click', predict);
    }
    function predict() {
      clearTip();
      shell.msg('');
      st.heavy = { wood: false, fuel: false, plant: false };
      st.smog = 0;
      fitView([HX, 1.3, HZ], 2.8, 2.0, 0.3);
      say(ANCH.lamp, '💡 Лампата свети с ток от слънчевия панел.', '', 0.1);
      shell.task(`<p><b>Предскажи.</b> Представи си друг ден. Слънцето залязва и идва нощта.</p>
        <p>Лампата в къщата получава ток <b>само от слънчевия панел</b>. Къщата няма батерия.</p>`);
      const box = shell.setControls('<div></div>').firstChild;
      let wp = 0;
      choiceBox(box, 'Какво ще стане с лампата през нощта?', [
        'Ще свети по-силно, защото е тъмно',
        'Ще угасне, защото няма слънчева светлина',
        'Ще свети както през деня',
      ], 1, (i) => {
        wp++;
        if (wp >= 2) return 'Подсказка: панелът прави ток само когато върху него пада светлина.';
        return i === 0
          ? 'Лампата не знае дали е тъмно — тя свети само когато получава ток. Откъде идва токът ѝ?'
          : 'Помисли: какво улавя панелът, за да прави ток? Има ли го през нощта?';
      }, async () => {
        shell.msg('Вярно! Нека видим какво става, когато падне нощта…', 'good');
        shell.setControls('');
        clearTip();
        st.night = 1;
        await wait(4.5);
        say(ANCH.lamp, '💡 Лампата угасна: през нощта панелът не получава слънчева светлина и не прави ток.', 'wide', 0.1);
        await wait(4.0);
        VIEW.turbine();
        await wait(1.2);
        say(ANCH.turbine, '🌬️ А вятърната турбина се върти и нощем, щом духа вятър. Затова хората използват различни източници и пазят енергията в батерии.', 'wide good', 0.4);
        await wait(3.0);
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
