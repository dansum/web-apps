// 4.3.5 „Органи за хранене и дишане; съзряване“ — прозрачното дете Боби в спокойна стая.
// Стъпки: опознай органите → пътят на хапката и на въздуха → подреди и свържи → растем (от бебе до възрастен).
import { createStage, labelSprite, addHitBox, cornerMenu, zoneRing, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

// ---------- данни ----------
const ORGANS = [
  { id: 'mouth', label: 'Уста и зъби', icon: '🦷', sys: 0, glow: 0xffb0a0,
    note: 'В устата започва храненето. Зъбите раздробяват и сдъвкват храната, а слюнката я овлажнява.',
    fact: 'Езикът разбърква хапката и помага да я преглътнеш.',
    fn: 'Раздробяват и сдъвкват храната' },
  { id: 'esophagus', label: 'Хранопровод', icon: '⬇️', sys: 0, glow: 0xffa070,
    note: 'Хранопроводът е мускулеста тръба. По него сдъвканата храна слиза от устата до стомаха.',
    fact: 'Стените му се свиват на вълни и бутат хапката надолу.',
    fn: 'Пренася сдъвканата храна до стомаха' },
  { id: 'stomach', label: 'Стомах', icon: '🥣', sys: 0, glow: 0xffa070,
    note: 'Стомахът е като торбичка в корема. Той разбърква храната със стомашен сок и я смила. Стомашният сок е течност, която стомахът сам прави.',
    fact: 'Когато е празен, е малък, а когато ядеш, се разтяга.',
    fn: 'Разбърква храната със стомашен сок и я смила' },
  { id: 'intestines', label: 'Черва', icon: '🌀', sys: 0, glow: 0xffb060,
    note: 'След стомаха храната минава през тънкото черво, а после през дебелото черво.',
    fact: 'В тънкото черво хранителните вещества преминават в кръвта. В дебелото черво се поема водата.',
    fn: 'Хранителните вещества преминават в кръвта' },
  { id: 'liver', label: 'Черен дроб', icon: '🟤', sys: 0, glow: 0xff8a50,
    note: 'Черният дроб е най-големият орган в корема. Той е в дясната страна, точно под диафрагмата.',
    fact: 'Той отделя жлъчка, която помага за смилането на мазната храна.',
    fn: 'Отделя жлъчка, която помага за смилането' },
  { id: 'nose', label: 'Нос', icon: '👃', sys: 1, glow: 0x80d8ff,
    note: 'През носа въздухът влиза в тялото. Там той се затопля, овлажнява и пречиства.',
    fact: 'Космъчетата и слузта в носа задържат праха. Затова е по-добре да дишаш през носа.',
    fn: 'Затопля, овлажнява и пречиства въздуха' },
  { id: 'trachea', label: 'Трахея', icon: '🌬️', sys: 1, glow: 0x80d8ff,
    note: 'Трахеята, или дихателната тръба, води въздуха от гърлото към белите дробове.',
    fact: 'Твърди пръстени от хрущял я държат винаги отворена. Хрущялът е твърд, но гъвкав — като ушите и връхчето на носа ти.',
    fn: 'Води въздуха към белите дробове' },
  { id: 'lungs', label: 'Бели дробове', icon: '🫁', sys: 1, glow: 0xff8a9a,
    note: 'Двата бели дроба са в гърдите. В тях кислородът от въздуха преминава в кръвта.',
    fact: 'При издишване от тях излиза въглероден диоксид.',
    fn: 'Кислородът от въздуха преминава в кръвта' },
  { id: 'diaphragm', label: 'Диафрагма', icon: '⛰️', sys: 1, glow: 0xff7043,
    note: 'Диафрагмата е мускул като купол под белите дробове. Тя отделя гърдите от корема.',
    fact: 'Когато вдишваш, тя слиза надолу и белите дробове се пълнят с въздух.',
    fn: 'Мускул, който помага да вдишваме и издишваме' },
];
const byId = Object.fromEntries(ORGANS.map((o) => [o.id, o]));
const SUB = { small: 'Тънко черво', large: 'Дебело черво' };
const nameOf = (id) => SUB[id] || byId[id].label;
const SYS = ['хранене', 'дишане'];

// Пътят на хапката и на въздуха.
const FOOD = ['mouth', 'esophagus', 'stomach', 'small', 'large'];
const AIR = ['nose', 'trachea', 'lungs'];
const FOOD_HINT = [
  'Хапката още е в ръката. Откъде влиза храната в тялото?',
  'Като преглътнеш, хапката слиза по тръба към корема. Тя е зад трахеята.',
  'Хранопроводът стига до торбичка в корема. Коя е тя?',
  'След стомаха идва дълга навита тръба — в средата на корема.',
  'Последната част е по-дебела и обикаля като рамка около тънкото черво.',
];
const AIR_HINT = [
  'Вдишай. Откъде влиза въздухът?',
  'От носа въздухът минава през гърлото в тръба с пръстени, в шията.',
  'Трахеята се разклонява и води въздуха към два големи органа в гърдите.',
];
const FOOD_DONE = {
  mouth: 'Зъбите сдъвкаха хапката, а слюнката я овлажни.',
  esophagus: 'Хапката слезе по хранопровода.',
  stomach: 'В стомаха храната се разбърква и смила.',
  small: 'В тънкото черво хранителните вещества преминават в кръвта.',
  large: 'В дебелото черво се поема водата. Остатъците излизат от тялото.',
};
const AIR_DONE = {
  nose: 'В носа въздухът се затопли и пречисти.',
  trachea: 'Въздухът мина по трахеята.',
  lungs: 'Въздухът стигна до белите дробове. Кислородът преминава в кръвта.',
};
// Защо органът е в този кръг (при грешно сортиране).
const SORT_WHY = {
  mouth: 'В устата започва смилането на храната.',
  esophagus: 'По хранопровода минава храната, не въздухът.',
  stomach: 'Стомахът смила храната.',
  intestines: 'В червата храната се смила докрай.',
  liver: 'Черният дроб помага храната да се смели.',
  nose: 'През носа влиза въздухът, който вдишваме.',
  trachea: 'По трахеята минава въздухът.',
  lungs: 'С белите дробове дишаме.',
  diaphragm: 'Диафрагмата е мускулът, който ни помага да дишаме.',
};
const MATCH = ['mouth', 'stomach', 'intestines', 'liver', 'nose', 'lungs', 'diaphragm'];
const MATCH_HINT = {
  mouth: 'Какво работи първо, когато отхапеш ябълка?',
  stomach: 'Торбичката в корема, в която слиза храната.',
  intestines: 'Дългата навита тръба в долната част на корема.',
  liver: 'Големият тъмен орган в дясната страна на корема.',
  nose: 'През какво е най-добре да вдишваш?',
  lungs: 'Двата големи органа в гърдите, които се надуват.',
  diaphragm: 'Куполът под белите дробове.',
};

// Растеж: височина (м), част за главата, част за краката.
const GROW = [[0, 0.5, 0.25, 0.32], [1, 0.75, 0.23, 0.35], [2, 0.87, 0.21, 0.37], [4, 1.02, 0.19, 0.4], [6, 1.16, 0.17, 0.43],
  [8, 1.28, 0.16, 0.44], [10, 1.38, 0.155, 0.45], [12, 1.5, 0.145, 0.46], [14, 1.62, 0.137, 0.465], [16, 1.68, 0.132, 0.47],
  [18, 1.71, 0.13, 0.47], [25, 1.72, 0.13, 0.47]];
const STAGES = [
  { id: 'baby', label: 'Бебе', from: 0, to: 1.99, icon: '👶',
    text: 'Бебето е малко, а главата му е голяма спрямо тялото. През първата година то расте много бързо.' },
  { id: 'child', label: 'Детство', from: 2, to: 10.49, icon: '🧒',
    text: 'В детството човек расте всяка година. Учи се да тича, да говори, да чете и да пише.' },
  { id: 'teen', label: 'Юношество', from: 10.5, to: 17.99, icon: '🧑',
    text: 'Това е съзряването. Тялото расте по-бързо. При момчетата гласът става по-плътен. Тялото се поти повече, затова хигиената е много важна. Настроението може да се сменя по-често. Всеки съзрява със свое темпо.' },
  { id: 'adult', label: 'Зрялост', from: 18, to: 25, icon: '🧑‍🦱',
    text: 'Възрастният човек вече не расте на ръст. Тялото му е напълно развито.' },
];
const U = 2.2; // единици на метър в стъпка 4

const CSS = `
.organs4-trail { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin: 6px 0 2px; font-weight: 800; font-size: 0.85rem; }
.organs4-trail span { padding: 3px 8px; border-radius: 999px; background: #eef2f7; border: 2px dashed #c7d3e0; color: #5b6573; }
.organs4-trail span.on { background: #e9f8ef; border: 2px solid #2e9e5b; color: #145c33; }
.organs4-trail i { font-style: normal; color: #8a96a6; }
.xp-chips .chip.organs4-fn { font-weight: 700; font-size: 0.88rem; border-radius: 10px; text-align: left; }
.organs4-held { position: absolute; left: 50%; top: 8px; transform: translateX(-50%); z-index: 4; pointer-events: none;
  background: #1865f2; color: #fff; font-weight: 800; border-radius: 999px; padding: 6px 14px; font-size: 0.88rem;
  box-shadow: 0 4px 14px rgba(0,0,0,0.2); max-width: calc(100% - 24px); text-align: center; }
.organs4-held[hidden] { display: none; }
.organs4-slider { display: grid; gap: 4px; margin-top: 6px; font-weight: 700; }
.organs4-slider input { width: 100%; accent-color: #1865f2; height: 28px; }
.organs4-slider .organs4-val { font-variant-numeric: tabular-nums; color: #1865f2; }
.organs4-stages { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 6px; }
.organs4-stages span { text-align: center; font-size: 0.78rem; font-weight: 800; padding: 4px 2px; border-radius: 8px;
  background: #eef2f7; border: 2px solid #dfe5ee; color: #5b6573; }
.organs4-stages span.on { background: #e9f8ef; border-color: #2e9e5b; color: #145c33; }
.organs4-stages span.cur { outline: 3px solid #1865f2; outline-offset: 1px; }
.organs4-q { margin-top: 8px; }
.organs4-q p { margin: 4px 0; }
@media (max-width: 520px) { .organs4-held { font-size: 0.78rem; padding: 4px 10px; } .organs4-stages span { font-size: 0.7rem; } }
`;

function injectStyle(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

// ---------- помощни (по образеца на body.js) ----------
function organMat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, emissive: 0x000000, ...extra });
}
function glassMat(color, opacity = 0.3, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, transparent: true, opacity, depthWrite: false, roughness: 0.35, metalness: 0, ...extra });
}
function curveOf(points) {
  return new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p))), false, 'catmullrom', 0.5);
}
function tube(curveOrPoints, radius, material, segs = 48, radial = 8) {
  const curve = typeof curveOrPoints.getPoint === 'function' ? curveOrPoints : curveOf(curveOrPoints);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, radial, false), material);
  m.userData.curve = curve;
  return m;
}
function hitTube(curve, radius = 0.1) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 6, false), new THREE.MeshBasicMaterial({ visible: false }));
  m.userData.isHitBox = true;
  return m;
}
function glowOf(group) {
  const ms = [];
  group.traverse((o) => {
    if (o.isMesh && !o.userData.isHitBox && o.material && o.material.emissive && !ms.includes(o.material)) ms.push(o.material);
  });
  return {
    set(k, color) {
      for (const m of ms) {
        if (color !== undefined) m.emissive.set(color); else m.emissive.copy(m.color);
        m.emissiveIntensity = k;
      }
    },
  };
}
function flowDots(curve, { n = 8, r = 0.03, color = 0xffffff, speed = 0.2 } = {}) {
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color }), n);
  im.frustumCulled = false;
  const offs = Array.from({ length: n }, (_, i) => (i + Math.random() * 0.6) / n);
  const dummy = new THREE.Object3D();
  const len = curve.getLength();
  im.userData.update = (dt) => {
    for (let i = 0; i < n; i++) {
      offs[i] = (offs[i] + (dt * speed) / Math.max(len, 0.2)) % 1;
      curve.getPointAt(offs[i], dummy.position);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  };
  im.userData.update(0);
  return im;
}
function mover(stage) {
  const moving = new Map();
  stage.tick((dt) => {
    for (const [o, mv] of moving) {
      mv.k = Math.min(1, mv.k + dt / mv.dur);
      const e = mv.k < 0.5 ? 2 * mv.k * mv.k : 1 - Math.pow(-2 * mv.k + 2, 2) / 2;
      o.position.lerpVectors(mv.from, mv.to, e);
      if (mv.arc) o.position.y += Math.sin(e * Math.PI) * mv.arc;
      if (mv.k >= 1) { moving.delete(o); o.position.copy(mv.to); mv.done && mv.done(); }
    }
  });
  return {
    move(o, to, dur = 0.6, { arc = 0, done } = {}) { moving.set(o, { from: o.position.clone(), to: to.clone(), k: 0, dur, arc, done }); },
    clear() { moving.clear(); },
  };
}
function choicesHTML(name, opts) {
  return `<div class="choices" data-q="${name}">${opts.map((o) => `<button class="choice" data-v="${o.v}">${esc(o.t)}</button>`).join('')}</div>`;
}
const lerp = (a, b, k) => a + (b - a) * k;

// ---------- модели на органите ----------
function lungGeo(side) {
  const geo = new THREE.SphereGeometry(1, 28, 20);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i); const y = p.getY(i); let z = p.getZ(i);
    const taper = 1 - 0.38 * Math.max(0, y);
    x *= taper; z *= taper * (1 - 0.15 * Math.max(0, -y));
    if (x * side < 0) x *= 0.45;
    p.setXYZ(i, x, y - 0.12 * Math.max(0, -y) * Math.abs(x), z);
  }
  geo.computeVertexNormals();
  return geo;
}
export function buildLungs() {
  const g = new THREE.Group();
  const m = organMat(0xf28b97, { roughness: 0.65 });
  const lobes = [];
  for (const s of [1, -1]) {
    const l = new THREE.Mesh(lungGeo(s), m);
    l.userData.base = new THREE.Vector3(s > 0 ? 0.23 : 0.26, 0.42, 0.23);
    l.scale.copy(l.userData.base);
    l.position.set(s * 0.29, 0, 0);
    g.add(l);
    lobes.push(l);
  }
  g.userData.lobes = lobes;
  return g;
}
// Трахея: от носната кухина през гърлото до двата бронха (координати в тялото на Боби).
const TRACHEA_PTS = [[0, 3.93, 0.15], [0, 3.72, 0.12], [0, 3.45, 0.08], [0, 3.2, 0.07], [0, 2.98, 0.06]];
export function buildTrachea(short = false) {
  const g = new THREE.Group();
  const m = organMat(0xe9c3c3);
  const pts = short ? [[0, 0.35, 0], [0, -0.25, 0]] : TRACHEA_PTS;
  const t = tube(pts, short ? 0.07 : 0.05, m, 24);
  g.add(t);
  const y0 = short ? -0.2 : 3.02; const y1 = short ? 0.3 : 3.38; const z = short ? 0 : 0.07;
  for (let i = 0; i <= 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(short ? 0.075 : 0.055, 0.013, 6, 16), m);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, lerp(y0, y1, i / 5), z);
    g.add(ring);
  }
  const by = short ? -0.25 : 2.98;
  const bz = short ? 0 : 0.06;
  for (const s of [1, -1]) {
    g.add(tube([[0, by, bz], [s * 0.1, by - 0.08, bz], [s * 0.2, by - 0.18, bz - 0.01]], short ? 0.05 : 0.038, m, 12));
  }
  return g;
}
export function buildStomach() {
  const g = new THREE.Group();
  const m = organMat(0xffa98c, { roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), m);
  body.scale.set(0.2, 0.14, 0.12);
  body.rotation.z = 0.55;
  body.position.set(0.03, 0.02, 0);
  g.add(body);
  const fundus = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), m);
  fundus.position.set(0.1, 0.1, 0);
  g.add(fundus);
  g.add(tube([[-0.08, -0.07, 0], [-0.17, -0.1, 0.01], [-0.24, -0.06, 0.01]], 0.045, m, 12));
  g.userData.body = body;
  return g;
}
export function buildIntestines() {
  const g = new THREE.Group();
  const large = tube([[-0.3, -0.2, 0.02], [-0.35, -0.05, 0.03], [-0.34, 0.15, 0.03], [-0.18, 0.2, 0.05], [0, 0.19, 0.06],
    [0.2, 0.2, 0.05], [0.34, 0.15, 0.03], [0.35, -0.05, 0.03], [0.3, -0.2, 0.03], [0.12, -0.26, 0.05]], 0.062, organMat(0xe2945f), 80, 10);
  g.add(large);
  const pts = [];
  [0.1, 0.03, -0.04, -0.11, -0.17].forEach((y, r) => {
    for (let k = 0; k <= 6; k++) {
      const u = r % 2 ? 1 - k / 6 : k / 6;
      pts.push([-0.22 + u * 0.44, y + Math.sin(k * 1.7 + r) * 0.012, 0.07 + Math.sin(k * 2.1 + r * 1.3) * 0.035]);
    }
  });
  const small = tube(pts, 0.035, organMat(0xf7b48c), 160, 8);
  g.add(small);
  g.userData.small = small;
  g.userData.large = large;
  return g;
}
export function buildLiver() {
  const g = new THREE.Group();
  const m = organMat(0x9c4a3a, { roughness: 0.5 });
  const a = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), m);
  a.scale.set(0.24, 0.12, 0.15);
  a.rotation.z = -0.25;
  g.add(a);
  const b = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), m);
  b.scale.set(0.14, 0.07, 0.1);
  b.position.set(0.2, 0.04, 0.01);
  b.rotation.z = -0.15;
  g.add(b);
  const gall = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), organMat(0x7cb342));
  gall.position.set(0.02, -0.1, 0.07);
  g.add(gall);
  return g;
}
function buildDiaphragm() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, 1.1),
    organMat(0xc4574f, { roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.88 }));
  dome.scale.set(0.56, 0.22, 0.36);
  g.add(dome);
  g.userData.dome = dome;
  return g;
}
export function buildEsophagus(short = false) {
  const g = new THREE.Group();
  const pts = short ? [[0, 0.4, 0], [0.04, 0.1, 0], [-0.03, -0.15, 0], [0.08, -0.38, 0]]
    : [[0, 3.62, -0.1], [0, 3.1, -0.12], [0.05, 2.6, -0.07], [0.13, 2.22, 0.03], [0.17, 2.12, 0.08]];
  const t = tube(pts, short ? 0.06 : 0.035, organMat(0xe8957a), 32);
  g.add(t);
  if (!short) { const h = hitTube(t.userData.curve, 0.075); g.add(h); }
  g.userData.curve = t.userData.curve;
  return g;
}
function buildTooth() {
  const g = new THREE.Group();
  const m = organMat(0xfdfcf5, { roughness: 0.3 });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), m);
  crown.scale.set(1, 0.8, 0.85);
  g.add(crown);
  for (const s of [1, -1]) {
    const root = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 10), m);
    root.rotation.z = Math.PI + s * 0.15;
    root.position.set(s * 0.08, -0.22, 0);
    g.add(root);
  }
  return g;
}
function buildNoseToken() {
  const g = new THREE.Group();
  const m = organMat(0xf4b28e);
  const n = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 16), m);
  n.rotation.x = 0.35;
  g.add(n);
  for (const s of [1, -1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), m);
    w.position.set(s * 0.1, -0.16, 0.06);
    g.add(w);
  }
  return g;
}

// Прозрачна част на тялото + лек контур.
function skinPart(geo, skin, rim) {
  const m = new THREE.Mesh(geo, skin);
  m.renderOrder = 2;
  const o = new THREE.Mesh(geo, rim);
  o.scale.setScalar(1.035);
  o.renderOrder = 1;
  m.add(o);
  return m;
}

// Боби (по образеца на body.js), с уста, зъби и нос, които могат да се изберат.
export function buildKid() {
  const kid = new THREE.Group();
  const skin = glassMat(0xffc8a2, 0.3, { emissive: 0xffa070, emissiveIntensity: 0.08 });
  const headSkin = glassMat(0xffc8a2, 0.38, { emissive: 0xffa070, emissiveIntensity: 0.1 });
  const rim = glassMat(0xd98a63, 0.35, { side: THREE.BackSide });
  const prof = [[0, 1.05], [0.42, 1.08], [0.56, 1.24], [0.6, 1.55], [0.57, 1.95], [0.58, 2.4], [0.62, 2.85], [0.56, 3.1], [0.36, 3.27], [0.16, 3.33], [0, 3.34]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const torso = skinPart(new THREE.LatheGeometry(prof, 36), skin, rim);
  torso.scale.z = 0.64;
  kid.add(torso);
  const neck = skinPart(new THREE.CylinderGeometry(0.17, 0.19, 0.32, 16, 1, true), skin, rim);
  neck.position.y = 3.4;
  kid.add(neck);
  const head = new THREE.Group();
  head.position.y = 3.95;
  kid.add(head);
  head.add(skinPart(new THREE.SphereGeometry(0.6, 36, 28), headSkin, rim));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.635, 36, 18, 0, Math.PI * 2, 0, 1.05), organMat(0x6b4226, { roughness: 0.8 }));
  hair.rotation.x = -0.5;
  head.add(hair);
  const white = organMat(0xffffff, { roughness: 0.3 });
  const dark = organMat(0x2a1d1a, { roughness: 0.3 });
  const eyes = [];
  for (const s of [1, -1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.2, 0.1, 0.53);
    const sc = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), white);
    sc.scale.z = 0.55;
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 10), dark);
    pu.position.z = 0.04;
    eye.add(sc, pu);
    head.add(eye);
    eyes.push(eye);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.09, 4, 8), organMat(0x6b4226));
    brow.rotation.z = Math.PI / 2 - s * 0.18;
    brow.position.set(s * 0.2, 0.23, 0.55);
    head.add(brow);
    const ear = skinPart(new THREE.SphereGeometry(0.11, 14, 10), headSkin, rim);
    ear.scale.set(0.6, 1, 0.9);
    ear.position.set(s * 0.6, 0, 0);
    head.add(ear);
  }
  // нос с носна кухина
  const nose = new THREE.Group();
  const noseM = organMat(0xf4a988);
  const bump = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), noseM);
  bump.position.set(0, -0.04, 0.6);
  nose.add(bump);
  const cav = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.32, 4, 10), organMat(0xf29a9a, { roughness: 0.6 }));
  cav.rotation.x = Math.PI / 2;
  cav.position.set(0, 0.0, 0.38);
  nose.add(cav);
  head.add(nose);
  // уста: устни, зъби, език
  const mouth = new THREE.Group();
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 20, Math.PI), organMat(0xb5403f));
  lip.rotation.z = Math.PI;
  lip.rotation.x = -0.25;
  lip.position.set(0, -0.22, 0.55);
  mouth.add(lip);
  const toothM = organMat(0xffffff, { roughness: 0.3 });
  const jaw = new THREE.Group();
  for (const [row, yy] of [[0, -0.2], [1, -0.28]]) {
    for (let i = 0; i < 6; i++) {
      const a = (i - 2.5) * 0.24;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.04), toothM);
      tooth.position.set(Math.sin(a) * 0.15, yy, 0.38 + Math.cos(a) * 0.1);
      tooth.rotation.y = a;
      (row ? jaw : mouth).add(tooth);
    }
  }
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), organMat(0xe57373));
  tongue.scale.set(0.11, 0.035, 0.13);
  tongue.position.set(0, -0.3, 0.36);
  jaw.add(tongue);
  mouth.add(jaw);
  head.add(mouth);
  // ръце
  const arms = [];
  for (const s of [1, -1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.64, 2.95, 0);
    arm.rotation.z = s * 0.14;
    arm.add(skinPart(new THREE.CapsuleGeometry(0.13, 1.05, 8, 16), skin, rim));
    arm.children[0].position.y = -0.66;
    const hand = skinPart(new THREE.SphereGeometry(0.155, 16, 12), skin, rim);
    hand.position.y = -1.4;
    arm.add(hand);
    kid.add(arm);
    arms.push(arm);
  }
  // крака, гащета, обувки
  const shortsM = organMat(0x3f7fd6, { roughness: 0.7, side: THREE.DoubleSide });
  const shorts = new THREE.Mesh(new THREE.LatheGeometry([[0.47, 0.98], [0.6, 1.18], [0.62, 1.36], [0.61, 1.4]].map(([r, y]) => new THREE.Vector2(r, y)), 36), shortsM);
  shorts.scale.z = 0.66;
  kid.add(shorts);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.03, 8, 36), organMat(0xffffff));
  band.rotation.x = Math.PI / 2;
  band.scale.y = 0.66;
  band.position.y = 1.39;
  kid.add(band);
  const legs = [];
  const shoeM = organMat(0xff7043, { roughness: 0.5 });
  for (const s of [1, -1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.27, 1.15, 0);
    const limb = skinPart(new THREE.CapsuleGeometry(0.19, 0.62, 8, 16), skin, rim);
    limb.position.y = -0.48;
    leg.add(limb);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.25, 0.4, 20), shortsM);
    cuff.position.y = -0.12;
    leg.add(cuff);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), shoeM);
    shoe.scale.set(0.95, 0.55, 1.45);
    shoe.position.set(0, -1.02, 0.09);
    leg.add(shoe);
    kid.add(leg);
    legs.push(leg);
  }
  return { kid, torso, head, eyes, mouth, jaw, nose, arms, legs };
}

// Схематичен човек в дрехи (без подробности): растящата фигура и майката.
function buildPerson({ shirt = 0x66bb6a, pants = 0x5c6bc0, hairC = 0x5d4037, longHair = false, skinC = 0xf6c9a5 } = {}) {
  const g = new THREE.Group();
  const skinM = organMat(skinC, { roughness: 0.7 });
  const shirtM = organMat(shirt, { roughness: 0.8 });
  const pantsM = organMat(pants, { roughness: 0.8 });
  const shoeM = organMat(0x455a64, { roughness: 0.6 });
  const cap = new THREE.CapsuleGeometry(0.5, 1, 6, 14); // височина 2, ширина 1
  const legs = []; const shoes = []; const arms = [];
  for (const s of [1, -1]) {
    const leg = new THREE.Mesh(cap, pantsM); g.add(leg); legs.push(leg);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), shoeM); g.add(shoe); shoes.push(shoe);
    const arm = new THREE.Group();
    const sleeve = new THREE.Mesh(cap, skinM);
    arm.add(sleeve);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 10), shirtM);
    top.position.y = 0.55;
    arm.add(top);
    arm.userData.side = s;
    g.add(arm);
    arms.push(arm);
  }
  const torso = new THREE.Mesh(cap, shirtM);
  g.add(torso);
  const head = new THREE.Group();
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 18), skinM));
  const hairM = organMat(hairC, { roughness: 0.85 });
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.53, 24, 12, 0, Math.PI * 2, 0, 1.25), hairM);
  hair.rotation.x = -0.35;
  head.add(hair);
  if (longHair) {
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.5, 6, 12), hairM);
    back.position.set(0, -0.35, -0.2);
    back.scale.z = 0.6;
    head.add(back);
  }
  const eyeM = organMat(0x2a1d1a);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeM);
    e.position.set(s * 0.17, 0.02, 0.46);
    head.add(e);
    const ch = new THREE.Mesh(new THREE.CircleGeometry(0.07, 14), new THREE.MeshBasicMaterial({ color: 0xff9e9e, transparent: true, opacity: 0.5, depthWrite: false }));
    ch.position.set(s * 0.27, -0.12, 0.43);
    ch.rotation.y = s * 0.55;
    head.add(ch);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 6, 16, Math.PI), organMat(0xb5403f));
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.15, 0.45);
  head.add(smile);
  g.add(head);
  const top = new THREE.Object3D();
  g.add(top);
  const dims = {};
  // H — височина в единици; hf, lf — части за главата и краката; chub — „бебешка“ пълнота (0…1).
  function setShape(H, hf, lf, chub) {
    const headH = H * hf; const legH = H * lf; const neckH = H * 0.015;
    const torsoH = H - headH - legH - neckH;
    const tw = H * (0.2 + 0.1 * chub);
    const lw = tw * 0.44;
    legs.forEach((l, i) => {
      const s = i ? -1 : 1;
      l.scale.set(lw, legH / 2, lw);
      l.position.set(s * tw * 0.24, legH / 2, 0);
      shoes[i].scale.set(lw * 1.15, lw * 0.55, lw * 1.7);
      shoes[i].position.set(s * tw * 0.24, lw * 0.22, lw * 0.25);
    });
    torso.scale.set(tw, torsoH / 2 + tw * 0.15, tw * 0.62);
    torso.position.y = legH + torsoH / 2;
    const armL = H * (0.27 + 0.07 * (1 - chub)); const aw = tw * 0.3;
    arms.forEach((a) => {
      const s = a.userData.side;
      a.position.set(s * (tw / 2 + aw * 0.35), legH + torsoH * 0.88, 0);
      a.children[0].scale.set(aw, armL / 2, aw);
      a.children[0].position.y = -armL / 2 + aw * 0.4;
      a.children[1].scale.setScalar(aw);
      a.children[1].position.y = 0;
      a.rotation.z = s * 0.12;
    });
    head.scale.setScalar(headH);
    head.position.y = legH + torsoH + neckH + headH / 2;
    top.position.y = H;
    Object.assign(dims, { H, tw, legH, torsoH, headH });
  }
  setShape(3.6, 0.13, 0.47, 0);
  return { g, setShape, dims, head, torso, arms, top, shirtM };
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  injectStyle('organs4-style', CSS);
  const STEPS = ['Опознай органите', 'Пътят на хапката и на въздуха', 'Подреди и свържи', 'Растем и съзряваме'];
  const shell = createShell(container, { steps: STEPS });
  const HOME = { pos: [0, 3.1, 8.4], tgt: [0, 2.45, 0] };
  const stage = createStage(shell.stageEl, {
    background: 0xf3ede4, camPos: HOME.pos, target: HOME.tgt, minDistance: 1.2, maxDistance: 14,
  });
  const { scene } = stage;
  stage.renderer.domElement.style.touchAction = 'none';
  const mv = mover(stage);

  // ---- спокойна стая ----
  const floorM = new THREE.MeshStandardMaterial({ color: 0xe2c9a6, roughness: 0.95 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), floorM);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.01, 4.8);
  scene.add(floor);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.9, 48), new THREE.MeshStandardMaterial({ color: 0xbfe3d0, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.003;
  scene.add(rug);
  const rugRing = new THREE.Mesh(new THREE.RingGeometry(2.75, 2.9, 64), new THREE.MeshBasicMaterial({ color: 0x8fcfb0 }));
  rugRing.rotation.x = -Math.PI / 2;
  rugRing.position.y = 0.006;
  scene.add(rugRing);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7.5), new THREE.MeshBasicMaterial({ color: 0xf4ebdc }));
  wall.position.set(0, 3.7, -2.2);
  scene.add(wall);
  const skirting = new THREE.Mesh(new THREE.BoxGeometry(16, 0.22, 0.05), organMat(0xffffff));
  skirting.position.set(0, 0.11, -2.17);
  scene.add(skirting);
  // прозорец с облаци
  const win = new THREE.Group();
  win.position.set(-2.9, 3.6, -2.18);
  scene.add(win);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), new THREE.MeshBasicMaterial({ color: 0xbfe4ff }));
  win.add(sky);
  const frameM = organMat(0xffffff, { roughness: 0.6 });
  for (const [w, h, x, y] of [[1.95, 0.08, 0, 0.77], [1.95, 0.08, 0, -0.77], [0.08, 1.6, 0.94, 0], [0.08, 1.6, -0.94, 0], [0.05, 1.5, 0, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), frameM);
    b.position.set(x, y, 0.03);
    win.add(b);
  }
  const clouds = [];
  for (let i = 0; i < 2; i++) {
    const c = new THREE.Group();
    const cm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false });
    for (const [x, y, r] of [[0, 0, 0.14], [0.13, 0.03, 0.11], [-0.13, 0.02, 0.1]]) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(r, 18), cm);
      d.position.set(x, y, 0);
      c.add(d);
    }
    c.position.set(0, i ? -0.25 : 0.3, 0.01);
    c.userData = { ph: i * 0.55, m: cm };
    win.add(c);
    clouds.push(c);
  }
  const curtains = [];
  for (const s of [1, -1]) {
    const cu = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.9, 1, 6), organMat(0xf8bbd0, { side: THREE.DoubleSide, roughness: 0.9 }));
    cu.position.set(s * 1.12, 0, 0.08);
    win.add(cu);
    curtains.push(cu);
  }
  // растение в саксия
  const plant = new THREE.Group();
  plant.position.set(-4.3, 0, -1.4);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.55, 18), organMat(0xd9825b));
  pot.position.y = 0.28;
  plant.add(pot);
  const leaves = [];
  for (let i = 0; i < 6; i++) {
    const lf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), organMat(0x66bb6a, { roughness: 0.8 }));
    lf.scale.set(0.1, 0.42, 0.05);
    const a = (i / 6) * Math.PI * 2;
    const piv = new THREE.Group();
    piv.position.y = 0.55;
    piv.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    lf.position.y = 0.38;
    piv.add(lf);
    piv.userData = { ph: i, rx: piv.rotation.x, rz: piv.rotation.z };
    plant.add(piv);
    leaves.push(piv);
  }
  scene.add(plant);
  // масичка с ябълка
  const table = new THREE.Group();
  table.position.set(1.45, 0, 0.6);
  const tTop = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 24), organMat(0xc79a6b));
  tTop.position.y = 1.2;
  const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.2, 10), organMat(0xa47b52));
  tLeg.position.y = 0.6;
  table.add(tTop, tLeg);
  scene.add(table);
  const apple = new THREE.Group();
  const appleBody = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), organMat(0xe53935, { roughness: 0.4 }));
  appleBody.scale.y = 0.92;
  apple.add(appleBody);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6), organMat(0x6d4c41));
  stem.position.y = 0.18;
  apple.add(stem);
  const leafA = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), organMat(0x66bb6a));
  leafA.scale.set(0.06, 0.02, 0.03);
  leafA.position.set(0.05, 0.2, 0);
  apple.add(leafA);
  const biteMark = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), organMat(0xfff3c4));
  biteMark.position.set(-0.13, 0.03, 0.1);
  biteMark.rotation.y = -0.9;
  biteMark.visible = false;
  apple.add(biteMark);
  const APPLE_HOME = new THREE.Vector3(1.45, 1.4, 0.6);
  apple.position.copy(APPLE_HOME);
  scene.add(apple);

  // ---- Боби ----
  const K = buildKid();
  const { kid } = K;
  scene.add(kid);
  const organs = {};
  const add = (id, g, pos, hit) => {
    if (pos) g.position.set(...pos);
    g.userData.pickId = id;
    if (hit !== undefined) addHitBox(g, hit);
    organs[id] = g;
    return g;
  };
  kid.add(add('lungs', buildLungs(), [0, 2.72, 0]));
  kid.add(add('trachea', buildTrachea()));
  for (const m of organs.trachea.children) if (m.isMesh && m.geometry.type === 'TubeGeometry' && m.userData.curve && m.userData.curve.points.length === 5) {
    const h = hitTube(m.userData.curve, 0.07); organs.trachea.add(h);
  }
  kid.add(add('esophagus', buildEsophagus()));
  const DIA_Y = 2.17;
  kid.add(add('diaphragm', buildDiaphragm(), [0, DIA_Y, 0.02]));
  {
    const h = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 0.74), new THREE.MeshBasicMaterial({ visible: false }));
    h.position.y = 0.15;
    h.userData.isHitBox = true;
    organs.diaphragm.add(h);
  }
  kid.add(add('stomach', buildStomach(), [0.22, 2.02, 0.1], 0.3));
  kid.add(add('liver', buildLiver(), [-0.2, 2.03, 0.06], 0.25));
  kid.add(add('intestines', buildIntestines(), [0, 1.7, 0.08]));
  const intest = organs.intestines;
  intest.userData.small.userData.pickId = 'small';
  intest.userData.large.userData.pickId = 'large';
  for (const k of ['small', 'large']) {
    const h = hitTube(intest.userData[k].userData.curve, k === 'small' ? 0.06 : 0.08);
    h.userData.pickId = k;
    intest.add(h);
  }
  organs.mouth = K.mouth; K.mouth.userData.pickId = 'mouth'; addHitBox(K.mouth, 0.2);
  organs.nose = K.nose; K.nose.userData.pickId = 'nose'; addHitBox(K.nose, 0.16);

  // котви за балончета и камерата
  const anchor = (parent, pos) => { const a = new THREE.Object3D(); a.position.set(...pos); parent.add(a); return a; };
  const anchors = {
    mouth: anchor(K.head, [0, -0.2, 0.6]), nose: anchor(K.head, [0, 0.04, 0.62]),
    esophagus: anchor(kid, [0.05, 2.62, -0.04]), stomach: anchor(organs.stomach, [0.05, 0.16, 0]),
    intestines: anchor(intest, [0, 0.24, 0.05]), small: anchor(intest, [0, 0.1, 0.1]), large: anchor(intest, [-0.35, 0.05, 0.05]),
    liver: anchor(organs.liver, [-0.05, 0.12, 0.05]), trachea: anchor(kid, [0, 3.3, 0.08]),
    lungs: anchor(organs.lungs, [-0.3, 0.38, 0]), diaphragm: anchor(kid, [0.42, 2.27, 0.1]),
  };
  const tagAnchors = {
    mouth: anchor(K.head, [0.5, -0.32, 0.45]), nose: anchor(K.head, [-0.55, 0.0, 0.45]),
    esophagus: anchor(kid, [0.0, 2.6, 0.3]), stomach: anchor(kid, [0.62, 2.12, 0.3]), intestines: anchor(kid, [-0.55, 1.55, 0.3]),
    liver: anchor(kid, [-0.62, 2.12, 0.3]), trachea: anchor(kid, [-0.45, 3.42, 0.2]), lungs: anchor(kid, [0.58, 3.0, 0.2]),
    diaphragm: anchor(kid, [-0.1, 2.32, 0.4]), small: anchor(kid, [0.5, 1.68, 0.3]), large: anchor(kid, [-0.6, 1.62, 0.3]),
  };
  const sideAnchor = anchor(scene, [1.75, 1.6, 0.3]);
  const glows = {};
  for (const id of Object.keys(organs)) glows[id] = glowOf(organs[id]);
  glows.small = glowOf(intest.userData.small);
  glows.large = glowOf(intest.userData.large);
  let glowId = null;
  const flash = new Map();
  const glowCol = (id) => (byId[id] ? byId[id].glow : 0xffb060);
  function setGlow(id) {
    if (glowId && glowId !== id) glows[glowId].set(0);
    glowId = id;
  }

  // хапка (болус) и въздух
  const bolusM = organMat(0xf2df9a, { roughness: 0.6 });
  const bolus = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), bolusM);
  bolus.visible = false;
  kid.add(bolus);
  const trip = { curve: null, k: 0, dur: 1, done: null, sparks: false };
  function travel(points, dur, done, { sparks = false } = {}) {
    trip.curve = curveOf(points);
    trip.k = 0; trip.dur = dur; trip.done = done; trip.sparks = sparks;
  }
  const sparkList = [];
  const sparkM = new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.9, depthWrite: false });
  const intestPts = (k, n = 40) => {
    const c = intest.userData[k].userData.curve;
    const out = [];
    for (let i = 0; i <= n; i++) out.push(c.getPointAt(i / n).add(intest.position));
    return out;
  };
  const AIR_CURVE = curveOf([[0, 3.89, 0.68], [0, 3.94, 0.45], ...TRACHEA_PTS, [-0.1, 2.9, 0.06], [-0.2, 2.8, 0.05], [-0.28, 2.65, 0.04]]);
  const AIR_CURVE2 = curveOf([[0, 3.89, 0.68], [0, 3.94, 0.45], ...TRACHEA_PTS, [0.1, 2.9, 0.06], [0.2, 2.8, 0.05], [0.28, 2.65, 0.04]]);
  const airDots = [flowDots(AIR_CURVE, { n: 12, r: 0.028, color: 0x4fc3f7, speed: 0.75 }), flowDots(AIR_CURVE2, { n: 12, r: 0.028, color: 0x4fc3f7, speed: 0.75 })];
  for (const d of airDots) { d.visible = false; kid.add(d); }

  // ---- растящата фигура, майката и ръстомерът (стъпка 4) ----
  const grow = buildPerson({ shirt: 0x4db6ac, pants: 0x5c6bc0, hairC: 0x6d4c41 });
  grow.g.position.set(1.25, 0, -1.5);
  grow.g.visible = false;
  scene.add(grow.g);
  const mom = buildPerson({ shirt: 0xba68c8, pants: 0x7e57c2, hairC: 0x4e342e, longHair: true });
  mom.setShape(1.65 * U, 0.13, 0.46, 0);
  mom.g.position.set(-1.6, 0, -1.2);
  mom.g.rotation.y = 0.3;
  mom.g.visible = false;
  scene.add(mom.g);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), mom.shirtM);
  belly.position.set(0, mom.dims.legH + mom.dims.torsoH * 0.28, mom.dims.tw * 0.18);
  mom.g.add(belly);
  // кръгче-увеличение с бебето вътре (схема)
  const inset = new THREE.Group();
  inset.position.set(1.05, mom.dims.legH + mom.dims.torsoH * 0.35, 0.35);
  mom.g.add(inset);
  const insetBg = new THREE.Mesh(new THREE.CircleGeometry(0.42, 36), new THREE.MeshBasicMaterial({ color: 0xffeef3 }));
  const insetRim = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 40), new THREE.MeshBasicMaterial({ color: 0xf48fb1 }));
  insetRim.position.z = 0.002;
  inset.add(insetBg, insetRim);
  const baby = new THREE.Group();
  baby.position.z = 0.05;
  const babyM = organMat(0xf6c9a5, { roughness: 0.7 });
  const bHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), babyM);
  bHead.position.set(0.04, 0.12, 0);
  const bBody = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.085, 10, 18, Math.PI * 1.1), babyM);
  bBody.rotation.z = Math.PI * 0.75;
  bBody.position.set(-0.02, -0.05, 0);
  baby.add(bHead, bBody);
  inset.add(baby);
  const insetLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.47, 0, 0), new THREE.Vector3(-0.95, -0.15, 0)]),
    new THREE.LineDashedMaterial({ color: 0xf06292, dashSize: 0.06, gapSize: 0.04 }));
  insetLine.computeLineDistances();
  inset.add(insetLine);
  const insetLbl = labelSprite('бебето расте', { size: 0.17, color: '#ad1457', border: '#f48fb1' });
  insetLbl.position.set(0, 0.62, 0);
  inset.add(insetLbl);
  function setMonths(m) {
    const k = m / 9;
    const b = Math.max(0.001, Math.pow(k, 1.2));
    belly.scale.set(mom.dims.tw * 0.95 * b, mom.dims.tw * 0.95 * b, mom.dims.tw * 0.85 * b);
    belly.position.z = mom.dims.tw * 0.18 + mom.dims.tw * 0.28 * b;
    baby.scale.setScalar(0.25 + 1.0 * k);
  }
  setMonths(1);
  // ръстомер на стената
  const ruler = new THREE.Group();
  ruler.position.set(2.05, 0, -2.16);
  ruler.visible = false;
  scene.add(ruler);
  const rulerBg = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 2 * U + 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  rulerBg.position.y = U + 0.05;
  ruler.add(rulerBg);
  const bandCols = [0xffcdd2, 0xffe0b2, 0xfff9c4, 0xc8e6c9];
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.5 * U), new THREE.MeshBasicMaterial({ color: bandCols[i] }));
    b.position.set(0.15, (i + 0.5) * 0.5 * U, 0.003);
    ruler.add(b);
  }
  const tickM = new THREE.MeshBasicMaterial({ color: 0x546e7a });
  for (let cm = 10; cm <= 200; cm += 10) {
    const big = cm % 50 === 0;
    const t = new THREE.Mesh(new THREE.PlaneGeometry(big ? 0.3 : 0.14, big ? 0.025 : 0.012), tickM);
    t.position.set(big ? -0.06 : -0.13, (cm / 100) * U, 0.005);
    ruler.add(t);
    if (big) {
      const l = labelSprite(cm === 100 ? '1 м' : cm === 200 ? '2 м' : cm === 150 ? '1,5 м' : `${cm} см`, { size: 0.16 });
      l.position.set(-0.45, (cm / 100) * U, 0.02);
      ruler.add(l);
    }
  }
  const headBar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 0.03), new THREE.MeshBasicMaterial({ color: 0x1865f2 }));
  headBar.visible = false;
  scene.add(headBar);
  const pencilMarks = [];
  const growTop = new THREE.Object3D();
  scene.add(growTop);
  const growSay = new THREE.Object3D();
  growSay.position.set(-0.6, 3.4, -1.5);
  scene.add(growSay);

  // ---- живот: дишане, смилане, мигане ----
  const life = { br: 15, amp: 1, breath: 0, sway: true, chew: 0, air: false, demo: false };
  let blink = 2;
  const tmpV = new THREE.Vector3();
  stage.tick((dt, t) => {
    life.breath = (life.breath + (dt * life.br) / 60) % 1;
    const inh = 0.5 - 0.5 * Math.cos(life.breath * Math.PI * 2);
    const a = life.amp;
    for (const l of organs.lungs.userData.lobes) {
      const b = l.userData.base;
      l.scale.set(b.x * (1 + 0.07 * a * inh), b.y * (1 + 0.035 * a * inh), b.z * (1 + 0.06 * a * inh));
    }
    organs.diaphragm.position.y = DIA_Y - 0.03 * a * inh;
    organs.diaphragm.userData.dome.scale.y = 0.22 * (1 - 0.2 * a * inh);
    K.torso.scale.x = 1 + 0.012 * a * inh;
    K.torso.scale.z = 0.64 * (1 + 0.03 * a * inh);
    for (const d of airDots) {
      d.visible = life.air && life.breath < 0.5;
      if (d.visible) d.userData.update(dt);
    }
    organs.stomach.userData.body.scale.y = 0.14 * (1 + 0.06 * Math.sin(t * 1.7));
    intest.userData.small.position.y = Math.sin(t * 2.1) * 0.006;
    intest.userData.small.rotation.z = Math.sin(t * 1.3) * 0.02;
    // дъвчене
    if (life.chew > 0) {
      life.chew -= dt;
      K.jaw.position.y = -Math.abs(Math.sin(t * 12)) * 0.03;
      bolus.scale.set(1 + 0.25 * Math.sin(t * 12), 1 - 0.2 * Math.sin(t * 12), 1);
    } else K.jaw.position.y *= 0.8;
    // мигане
    blink -= dt;
    for (const e of K.eyes) e.scale.y = blink < 0.12 ? 0.12 : 1;
    if (blink < 0) blink = 2.2 + Math.random() * 2.5;
    kid.rotation.y = life.sway ? Math.sin(t * 0.45) * 0.14 : kid.rotation.y * 0.9;
    K.head.rotation.z = Math.sin(t * 0.6) * 0.03;
    K.arms[0].rotation.x = Math.sin(t * 0.9) * 0.04;
    K.arms[1].rotation.x = -Math.sin(t * 0.9 + 1) * 0.04;
    // път на хапката
    if (trip.curve) {
      trip.k = Math.min(1, trip.k + dt / trip.dur);
      trip.curve.getPointAt(trip.k, bolus.position);
      if (trip.sparks && Math.random() < dt * 14) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), sparkM.clone());
        s.position.copy(bolus.position);
        s.userData = { age: 0, v: new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.6, 0.4 + Math.random() * 0.3).multiplyScalar(0.5) };
        kid.add(s);
        sparkList.push(s);
      }
      if (trip.k >= 1) { const d = trip.done; trip.curve = null; d && d(); }
    }
    for (let i = sparkList.length - 1; i >= 0; i--) {
      const s = sparkList[i];
      s.userData.age += dt;
      s.position.addScaledVector(s.userData.v, dt);
      s.material.opacity = Math.max(0, 0.9 - s.userData.age * 0.9);
      if (s.userData.age > 1) { kid.remove(s); s.geometry.dispose(); s.material.dispose(); sparkList.splice(i, 1); }
    }
    // стая
    for (const c of clouds) {
      const u = ((t * 0.035 + c.userData.ph) % 1);
      c.position.x = -0.75 + u * 1.5;
      c.userData.m.opacity = 0.95 * Math.min(1, Math.min(u, 1 - u) * 8);
    }
    curtains.forEach((cu, i) => { cu.rotation.y = Math.sin(t * 0.7 + i) * 0.08; });
    for (const lf of leaves) { lf.rotation.x = lf.userData.rx + Math.sin(t * 0.8 + lf.userData.ph) * 0.05; lf.rotation.z = lf.userData.rz + Math.sin(t * 0.6 + lf.userData.ph) * 0.05; }
    if (apple.visible && !apple.userData.flying) apple.rotation.y = Math.sin(t * 0.5) * 0.3;
    // растящата фигура и майката дишат спокойно
    if (grow.g.visible) { grow.torso.scale.x = grow.dims.tw * (1 + 0.015 * inh); grow.g.rotation.y = Math.sin(t * 0.4) * 0.08; }
    if (mom.g.visible) { mom.torso.scale.x = mom.dims.tw * (1 + 0.015 * inh); }
    // светене
    for (const id of Object.keys(glows)) {
      const f = flash.get(id);
      if (f) {
        f.k -= dt;
        glows[id].set(Math.max(0, f.k) * 0.8, f.color);
        if (f.k <= 0) { flash.delete(id); glows[id].set(0); }
      } else if (id === glowId) glows[id].set(0.35 + 0.25 * Math.sin(t * 4), glowCol(id));
    }
    if (headBar.visible) {
      grow.top.getWorldPosition(tmpV);
      growTop.position.copy(tmpV);
    }
  });

  // ---- балончета ----
  let tip = null;
  function say(anc, html, cls = '', lift = 0.05) {
    clearTip();
    tip = stage.bubble(anc, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const tags = [];
  function tagAt(id, html, cls = 'tag good') { tags.push(stage.bubble(tagAnchors[id], html, { lift: 0, cls })); }
  function clearTags() { for (const t of tags) t.remove(); tags.length = 0; }

  const heldEl = document.createElement('div');
  heldEl.className = 'organs4-held';
  heldEl.hidden = true;
  stage.overlay.parentElement.appendChild(heldEl);

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  stage.onHover(() => {});
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Органи',
    items: ORGANS.map((o) => ({ id: o.id, label: o.label, icon: o.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  const timers = new Set();
  const later = (fn, ms) => { const h = setTimeout(() => { timers.delete(h); fn(); }, ms); timers.add(h); return h; };
  function clearTimers() { for (const h of timers) clearTimeout(h); timers.clear(); }
  function overview(dur = 1) { stage.stopFollow(); stage.flyTo(HOME.pos, HOME.tgt, dur); }
  const fit = (z) => Math.min(14, z * Math.max(1, 1.25 / stage.camera.aspect));
  function lockView(on) {
    const c = stage.controls;
    c.minAzimuthAngle = on ? -0.6 : -Infinity;
    c.maxAzimuthAngle = on ? 0.6 : Infinity;
  }
  const showStage = () => {
    const r = shell.stageEl.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) shell.stageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    setGlow(null);
    menu.show(true);
    life.sway = true;
    const seen = new Set();
    shell.task(`<p>Запознай се отново с Боби! Тялото му е прозрачно и виждаш органите, с които той се храни и диша.</p>
      <p><b>Разгледай всички органи.</b> Избери ги от менюто или кликни върху тях.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🧍 Цялото тяло</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); setGlow(null); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани органи: ${seen.size} от ${ORGANS.length}`);
    upd();
    const visit = (id) => {
      if (id === 'small' || id === 'large') id = 'intestines';
      const o = byId[id];
      if (!o) return;
      const near = { mouth: 1.7, nose: 1.7, esophagus: 2.8, stomach: 2.0, intestines: 2.3, liver: 2.0, trachea: 2.2, lungs: 2.7, diaphragm: 2.7 }[id];
      stage.focusOn(anchors[id], { dist: near, height: 0.25, lift: 0 });
      setGlow(id);
      say(anchors[id], `<b>${o.icon} ${esc(o.label)}</b> <span class="small">(${SYS[o.sys]})</span><br>${esc(o.note)}<br><span class="small">${esc(o.fact)}</span>`);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === ORGANS.length && next.disabled) {
        next.disabled = false;
        shell.msg('Браво! Разгледа всички органи за хранене и дишане.', 'good');
      }
    };
    clickHandler = (id) => { if (!id) { clearTip(); setGlow(null); menu.setActive(null); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Пътят на хапката и на въздуха ----------
  let s2mistakes = 0;
  function step2() {
    shell.step(1);
    clearTip();
    setGlow(null);
    menu.show(false);
    menuHandler = null;
    life.sway = false;
    lockView(true);
    stage.stopFollow();
    stage.flyTo([0, 3.0, fit(5.9)], [0, 2.75, 0], 1);
    s2mistakes = 0;
    shell.setControls('');
    clickHandler = null;
    shell.task('<p>Боби е гладен. Гледай: той отхапва от ябълката!</p>');
    // ябълката отива до устата и обратно
    apple.userData.flying = true;
    const mouthW = new THREE.Vector3(0.05, 3.7, 0.95);
    mv.move(apple, mouthW, 1.1, { arc: 0.4, done: () => {
      biteMark.visible = true;
      bolus.visible = true;
      bolus.position.set(0, 3.71, 0.62);
      bolus.scale.setScalar(1);
      bolusM.color.set(0xf2df9a);
      say(anchors.mouth, 'Хрус! Боби отхапа парченце ябълка.', 'good');
      later(() => mv.move(apple, APPLE_HOME, 1.0, { arc: 0.4, done: () => { apple.userData.flying = false; } }), 500);
      later(foodJourney, 1200);
    } });
  }

  function trailHTML(list, idx) {
    return `<div class="organs4-trail">${list.map((id, i) => `${i ? '<i>→</i>' : ''}<span class="${i < idx ? 'on' : ''}">${i < idx ? esc(nameOf(id)) : '?'}</span>`).join('')}</div>`;
  }

  // Общо за двата пътя: детето кликва органите поред.
  function journey({ list, hints, done: doneTxt, intro, other, onStep, onEnd }) {
    let idx = 0;
    let busy = false;
    const missAt = {};
    const draw = () => {
      shell.task(`${intro}${trailHTML(list, idx)}`);
      shell.score(`Грешки: ${s2mistakes}`);
    };
    draw();
    clickHandler = (id) => {
      if (!id || busy) return;
      const want = list[idx];
      if (list === AIR && id === 'mouth' && idx === 0) {
        say(anchors.mouth, 'Можем да дишаме и през устата, но по-добре е през носа. Там въздухът се пречиства.', '');
        return;
      }
      if (id === want) {
        busy = true;
        setGlow(null);
        flash.set(id, { k: 1.2, color: 0x66ff99 });
        tagAt(id, `${idx + 1}. ${esc(nameOf(id))}`);
        clearTip();
        shell.msg(doneTxt[id], 'good');
        idx++;
        draw();
        onStep(id, () => {
          busy = false;
          if (idx === list.length) { clickHandler = null; onEnd(); }
        });
        return;
      }
      s2mistakes++;
      missAt[idx] = (missAt[idx] || 0) + 1;
      let why;
      const pos = list.indexOf(id);
      if (pos >= 0 && pos < idx) why = 'Вече мина оттам. Къде е следващата спирка?';
      else if (pos > idx) why = `Не може да се прескача. Преди „${nameOf(id)}“ има друга спирка.`;
      else why = other(id);
      flash.set(id, { k: 0.8, color: 0xff3030 });
      const anc = anchors[id] || anchors.intestines;
      say(anc, `✘ Това е <b>${esc(nameOf(id).toLowerCase())}</b>. ${esc(why)}`, 'bad');
      shell.msg(missAt[idx] >= 2 ? `Подсказка: ${hints[idx]}` : why, 'bad');
      shell.score(`Грешки: ${s2mistakes}`);
    };
  }

  function foodJourney() {
    clearTip();
    const intro = `<p><b>Пътят на хапката.</b> Кликни поред органите, през които минава хапката — от устата до края на пътя.</p>`;
    journey({
      list: FOOD, hints: FOOD_HINT, done: FOOD_DONE, intro,
      other: (id) => (id === 'liver' ? 'Черният дроб помага за смилането, но храната не минава през него.'
        : 'Това е орган за дишане. Храната не минава оттук.'),
      onStep: (id, next) => {
        if (id === 'mouth') { life.chew = 1.6; later(next, 1700); return; }
        if (id === 'esophagus') {
          const pts = [[0, 3.71, 0.55], [0, 3.68, 0.3], [0, 3.6, 0.0], ...organs.esophagus.userData.curve.points.slice(1).map((p) => p.toArray())];
          travel(pts, 2.2, next);
          return;
        }
        if (id === 'stomach') {
          const c = organs.stomach.position;
          travel([[0.17, 2.12, 0.08], [c.x + 0.05, c.y + 0.03, c.z], [c.x - 0.02, c.y - 0.02, c.z + 0.02], [c.x + 0.04, c.y, c.z]], 1.4, () => {
            bolus.scale.setScalar(1.3);
            bolusM.color.set(0xf7e7b0);
            later(next, 900);
          });
          return;
        }
        if (id === 'small') {
          const c = organs.stomach.position;
          const pts = [[c.x + 0.04, c.y, c.z], [c.x - 0.24, c.y - 0.06, c.z + 0.02], [-0.22, 1.82, 0.16], ...intestPts('small').map((p) => p.toArray())];
          bolus.scale.setScalar(0.9);
          travel(pts, 4.0, () => { bolusM.color.set(0xc9a46a); later(next, 300); }, { sparks: true });
          return;
        }
        // дебело черво
        const pts = intestPts('large').map((p) => p.toArray());
        bolus.scale.setScalar(0.75);
        travel(pts, 3.0, () => { bolus.visible = false; later(next, 400); });
      },
      onEnd: () => {
        shell.msg('Браво! Хапката измина целия път през органите за хранене.', 'good');
        say(sideAnchor, 'Така храната се смила. Полезните вещества отиват с кръвта до цялото тяло.', 'wide', 0);
        const c = shell.setControls('<button class="btn primary">Сега: пътят на въздуха →</button>');
        c.querySelector('button').addEventListener('click', () => { clearTags(); airJourney(); });
      },
    });
  }

  function airJourney() {
    clearTip();
    shell.setControls('');
    life.br = 12;
    const intro = `<p><b>Пътят на въздуха.</b> Боби вдишва. Кликни поред органите, през които минава въздухът.</p>`;
    journey({
      list: AIR, hints: AIR_HINT, done: AIR_DONE, intro,
      other: (id) => (id === 'diaphragm' ? 'Диафрагмата е мускул. Въздухът не минава през нея, но тя помага да вдишваме.'
        : 'Това е орган за хранене. Въздухът не минава оттук.'),
      onStep: (id, next) => {
        if (id === 'lungs') { life.air = true; life.amp = 2.4; life.br = 9; later(next, 600); return; }
        life.air = true;
        later(next, 500);
      },
      onEnd: () => {
        scores.push(stepScore(s2mistakes, 4));
        shell.msg(s2mistakes ? `Готово! Грешки: ${s2mistakes}.` : 'И двата пътя — без нито една грешка! 🎉', 'good');
        stage.flyTo([0.6, 2.8, fit(5.4)], [0.5, 2.6, 0], 1);
        say(sideAnchor, 'Гледай: при вдишване диафрагмата слиза надолу, белите дробове се пълнят с въздух и гърдите се повдигат.', 'wide', 0);
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', step3);
      },
    });
  }

  // ---------- 3. Подреди и свържи ----------
  const tokens = [];
  const sortParts = [];
  let stopDrag = null;
  function makeToken(id) {
    const g = new THREE.Group();
    let m;
    if (id === 'mouth') m = buildTooth();
    else if (id === 'nose') m = buildNoseToken();
    else if (id === 'trachea') m = buildTrachea(true);
    else if (id === 'esophagus') m = buildEsophagus(true);
    else if (id === 'lungs') { m = buildLungs(); m.scale.setScalar(0.95); }
    else if (id === 'stomach') { m = buildStomach(); m.scale.setScalar(2.2); }
    else if (id === 'intestines') { m = buildIntestines(); m.scale.setScalar(1.5); }
    else if (id === 'liver') { m = buildLiver(); m.scale.setScalar(1.7); }
    else { m = buildDiaphragm(); m.scale.setScalar(1.05); m.position.y = -0.1; }
    m.position.y += 0.5;
    g.add(m);
    const lbl = labelSprite(byId[id].label, { size: 0.24 });
    lbl.position.y = 1.08;
    g.add(lbl);
    g.userData.dragId = id;
    g.userData.pickId = 'tok-' + id;
    g.userData.spin = m;
    addHitBox(g, 0.9);
    return g;
  }
  function step3() {
    shell.step(2);
    clearTip();
    clearTags();
    setGlow(null);
    life.air = false; life.amp = 1; life.br = 15;
    lockView(false);
    life.sway = true;
    stage.stopFollow();
    stage.flyTo([0, 4.4, fit(7.4)], [0, 0.7, 2.1], 1);
    const rings = [];
    [[-1.95, 0x2e9e5b, 'Хранене'], [1.95, 0x1e88e5, 'Дишане']].forEach(([x, col, name]) => {
      const r = zoneRing(col, 1.05);
      r.position.set(x, 0.01, 2.1);
      scene.add(r);
      sortParts.push(r);
      const l = labelSprite(name, { size: 0.34, color: col === 0x2e9e5b ? '#145c33' : '#0d47a1', border: col === 0x2e9e5b ? '#8fd9a8' : '#90caf9' });
      l.position.set(x, 0.55, 3.25);
      scene.add(l);
      sortParts.push(l);
      rings.push(r);
    });
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.2, 24), organMat(0xffffff));
    ped.position.set(0, 0.1, 2.6);
    scene.add(ped);
    sortParts.push(ped);
    const order = shuffle(ORGANS.map((o) => o.id));
    const filled = [0, 0];
    let cur = null;
    let mistakes = 0;
    const missOn = {};
    const PED = new THREE.Vector3(0, 0.2, 2.6);
    const upd = () => shell.score(`Подредени: ${filled[0] + filled[1]} от ${ORGANS.length} · грешки: ${mistakes}`);
    shell.task(`<p>Органите излязоха на пиедестала един по един.</p>
      <p><b>Провлачи всеки орган в кръга „Хранене“ или в кръга „Дишане“.</b></p>`);
    shell.setControls('');
    upd();
    clickHandler = null;
    const spinStop = stage.tick((dt) => { if (cur) cur.userData.spin.rotation.y += dt * 0.6; });
    function nextToken() {
      if (!order.length) { finishSort(); return; }
      const id = order.shift();
      const g = makeToken(id);
      g.position.set(0, -1, 2.6);
      scene.add(g);
      tokens.push(g);
      cur = g;
      g.userData.locked = true;
      mv.move(g, PED, 0.6, { done: () => { g.userData.locked = false; } });
    }
    stopDrag = stage.enableDrag({
      planeY: 0.2,
      onStart: () => clearTip(),
      onDrop: (g, p) => {
        const id = g.userData.dragId;
        const want = byId[id].sys;
        const inRing = rings.findIndex((r) => Math.hypot(p.x - r.position.x, p.z - r.position.z) < 1.2);
        if (inRing < 0) { mv.move(g, PED, 0.4); return; }
        if (inRing === want) {
          g.userData.locked = true;
          const n = filled[want]++;
          const sx = rings[want].position.x + ((n % 2) - 0.5) * 0.95 + (n === 4 ? 0.48 : 0);
          const sz = 1.45 + Math.floor(n / 2) * 0.62;
          g.userData.spin.scale.multiplyScalar(0.6);
          g.userData.spin.position.y = 0.3;
          g.children[1].position.y = 0.72;
          mv.move(g, new THREE.Vector3(sx, 0.02, sz), 0.45);
          cur = null;
          shell.msg(`Вярно! ${byId[id].label} — орган за ${SYS[want]}.`, 'good');
          upd();
          later(nextToken, 500);
        } else {
          mistakes++;
          missOn[id] = (missOn[id] || 0) + 1;
          mv.move(g, PED, 0.5, { arc: 0.3 });
          const why = SORT_WHY[id];
          shell.msg(missOn[id] >= 2 ? `Подсказка: ${why}` : `Не е тук. Помисли: какво минава през „${byId[id].label}“ — храна или въздух?`, 'bad');
          say(g, `✘ Не е за ${SYS[inRing]}.`, 'bad', 1.4);
          upd();
        }
      },
    });
    nextToken();
    function finishSort() {
      stopDrag(); stopDrag = null;
      spinStop();
      shell.msg(mistakes ? `Подреди всички! Грешки: ${mistakes}.` : 'Подреди всички без грешка! 🎉', 'good');
      later(() => matchPart(mistakes), 1300);
    }
  }

  function matchPart(sortMistakes) {
    for (const t of tokens) t.visible = false;
    for (const p of sortParts) p.visible = false;
    life.sway = false;
    lockView(true);
    stage.flyTo([0, 2.95, fit(6.6)], [0, 2.75, 0], 1);
    let held = null;
    let mistakes = 0;
    const done = new Set();
    const order = shuffle(MATCH.slice());
    const missOn = {};
    const draw = () => {
      shell.task(`<p>Всеки орган има своя работа.</p>
        <p><b>Избери работа отдолу, после кликни органа в тялото на Боби, който я върши.</b></p>
        <div class="xp-chips">${order.map((id) => `<span class="chip organs4-fn ${done.has(id) ? 'used' : ''} ${held === id ? 'held' : ''}" data-k="${id}">${esc(byId[id].fn)}</span>`).join('')}</div>`);
      container.querySelectorAll('.xp-chips .chip').forEach((ch) => ch.addEventListener('click', () => {
        held = ch.dataset.k;
        container.querySelectorAll('.xp-chips .chip').forEach((x) => x.classList.toggle('held', x === ch));
        shell.msg('Сега кликни органа в тялото на Боби.');
        heldEl.textContent = `Кой орган: „${byId[held].fn}“?`;
        heldEl.hidden = false;
        showStage();
      }));
    };
    draw();
    shell.setControls('');
    const upd = () => shell.score(`Свързани: ${done.size} от ${MATCH.length} · грешки: ${sortMistakes + mistakes}`);
    upd();
    clickHandler = (id) => {
      if (!id) return;
      if (id === 'small' || id === 'large') id = 'intestines';
      if (!byId[id]) return;
      if (!held) { shell.msg('Първо избери работа отдолу.', 'bad'); return; }
      if (id === held) {
        done.add(id);
        flash.set(id, { k: 1.2, color: 0x66ff99 });
        clearTip();
        tagAt(id, `✔ ${esc(byId[id].label)}`);
        shell.msg(`Вярно! ${byId[id].label}: ${byId[id].fn.toLowerCase()}.`, 'good');
        held = null;
        heldEl.hidden = true;
        draw();
        upd();
        if (done.size === MATCH.length) {
          clickHandler = null;
          scores.push(stepScore(sortMistakes + mistakes, 4));
          shell.msg(sortMistakes + mistakes ? `Свърза всички! Грешки в стъпката: ${sortMistakes + mistakes}.` : 'Подреди и свърза всичко без грешка! 🎉', 'good');
          const ctrl = shell.setControls('<button class="btn primary">Напред →</button>');
          ctrl.querySelector('button').addEventListener('click', step4);
        }
        return;
      }
      if (done.has(id)) { shell.msg(`${byId[id].label} вече има своя работа. Избери друг орган.`, 'bad'); return; }
      mistakes++;
      missOn[held] = (missOn[held] || 0) + 1;
      flash.set(id, { k: 0.8, color: 0xff3030 });
      const pl = ['mouth', 'lungs', 'intestines'].includes(id);
      say(anchors[id], `✘ Това е <b>${esc(byId[id].label.toLowerCase())}</b>. ${pl ? 'Те не вършат' : id === 'diaphragm' || id === 'trachea' ? 'Тя не върши' : 'Той не върши'} тази работа.`, 'bad');
      shell.msg(missOn[held] >= 2 ? `Подсказка: ${MATCH_HINT[held]}` : `Не е ${byId[id].label.toLowerCase()}. Помисли пак.`, 'bad');
      upd();
    };
  }

  // ---------- 4. Растем и съзряваме ----------
  let age = 0;
  function ageInfo(a) {
    let i = 0;
    while (i < GROW.length - 2 && GROW[i + 1][0] <= a) i++;
    const [a0, h0, hf0, lf0] = GROW[i]; const [a1, h1, hf1, lf1] = GROW[i + 1];
    const k = Math.min(1, Math.max(0, (a - a0) / (a1 - a0)));
    return { h: lerp(h0, h1, k), hf: lerp(hf0, hf1, k), lf: lerp(lf0, lf1, k), chub: Math.max(0, 1 - a / 6) };
  }
  function setAge(a) {
    age = a;
    const g = ageInfo(a);
    grow.setShape(g.h * U, g.hf, g.lf, g.chub);
    const y = g.h * U;
    headBar.position.set((grow.g.position.x + ruler.position.x) / 2 + 0.1, y, -1.95);
    headBar.scale.x = ruler.position.x - grow.g.position.x + 0.2;
    return g;
  }
  const stageOf = (a) => STAGES.find((s) => a >= s.from && a <= s.to) || STAGES[3];
  let q4 = 0;
  let readTag = null;
  function step4() {
    shell.step(3);
    clearTip();
    clearTags();
    setGlow(null);
    heldEl.hidden = true;
    lockView(false);
    kid.visible = false;
    table.visible = false;
    apple.visible = false;
    mom.g.visible = true;
    ruler.visible = true;
    q4 = 0;
    setMonths(1);
    stage.stopFollow();
    stage.flyTo([-0.6, 2.6, fit(5.6)], [-1.0, 2.1, -1.2], 1.2);
    shell.task(`<p class="small"><b>ℹ️ Тази тема още се обработва, защото е чувствителна. Учителят ще я обсъди с вас.</b></p>
      <p>Всеки човек започва живота си от една клетка. Тя се образува от две клетки — една от майката и една от бащата. Преди да се роди, бебето расте в <b>матката</b> на майка си. Матката е специален орган при жената. Тя не е стомахът. След раждането детето расте и се развива.</p>
      <p><b>Плъзни „Месеци“ надясно и виж как расте бебето.</b></p>
      <label class="organs4-slider">Месеци: <span class="organs4-val">1</span><input type="range" class="organs4-months" min="1" max="9" step="1" value="1"></label>`);
    shell.setControls('');
    shell.score('');
    readTag = stage.bubble(inset, '1 месец', { lift: -0.62, cls: 'tag' });
    const inp = container.querySelector('.organs4-months');
    let asked = false;
    inp.addEventListener('input', () => {
      const m = Number(inp.value);
      setMonths(m);
      container.querySelector('.organs4-val').textContent = m;
      readTag.set(`${m} ${m === 1 ? 'месец' : 'месеца'}`);
      if (m === 9 && !asked) {
        asked = true;
        say(mom.head, 'След около 9 месеца бебето е готово да се роди!', 'good', 0.5);
        askQ('months', 'Колко време расте бебето в матката, преди да се роди?', [
          { v: 'ok', t: 'Около 9 месеца' }, { v: 'd', t: 'Около 3 месеца' }, { v: 'y', t: 'Около 1 година' }],
        'Точно така! Бебето расте в матката около 9 месеца.',
        'Не съвсем. Погледни плъзгача: колко месеца отброи?', () => {
          askQ('cells', 'С какво започва животът на всеки човек?', [
            { v: 'ok', t: 'С една клетка, образувана от две — от майката и от бащата' }, { v: 'm', t: 'С клетка само от майката' }, { v: 'e', t: 'С яйце, което майката мъти в гнездо' }],
          'Точно така! Новият човек започва от една клетка. Тя се образува от клетка на майката и клетка на бащата.',
          'Не съвсем. Прочети пак началото на задачата.', () => {
            const c = shell.setControls('<button class="btn primary">Напред: растем →</button>');
            c.querySelector('button').addEventListener('click', growPart);
          });
        });
      }
    });
  }
  // Въпрос с избор; оценява се първият опит.
  function askQ(name, q, opts, good, bad, then) {
    const box = document.createElement('div');
    box.className = 'organs4-q';
    box.innerHTML = `<p><b>${esc(q)}</b></p>${choicesHTML(name, shuffle(opts))}`;
    container.querySelector('.xp-task').appendChild(box);
    let tries = 0;
    box.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      tries++;
      if (b.dataset.v !== 'ok') {
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(bad, 'bad');
        return;
      }
      if (tries === 1) q4++;
      b.classList.add('right');
      box.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      shell.msg(good, 'good');
      then && then();
    }));
    return box;
  }
  function growPart() {
    clearTip();
    if (readTag) { readTag.remove(); readTag = null; }
    mom.g.visible = false;
    grow.g.visible = true;
    headBar.visible = true;
    setAge(0);
    stage.flyTo([0.6, 2.4, fit(5.0)], [0.9, 2.1, -1.6], 1.2);
    shell.task('<p>Сега ще видиш как човек расте — от бебе до възрастен. Синята черта показва ръста на ръстомера.</p>');
    shell.setControls('');
    const box = document.createElement('div');
    box.className = 'organs4-q';
    box.innerHTML = `<p><b>Предскажи: човек расте ли на ръст през целия си живот?</b></p>${choicesHTML('stop', shuffle([
      { v: 'all', t: 'Да, расте всяка година, докато е жив.' },
      { v: 'ok', t: 'Не. Расте до края на юношеството, после спира.' },
      { v: 'school', t: 'Не. Спира да расте, щом тръгне на училище.' }]))}`;
    container.querySelector('.xp-task').appendChild(box);
    let pred = null;
    box.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      if (pred) return;
      pred = b.dataset.v;
      if (pred === 'ok') q4++;
      box.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      b.classList.add('on');
      shell.msg('Запомни предположението си. Сега провери с плъзгача!');
      startSlider(pred, box);
    }));
  }
  function startSlider(pred, predBox) {
    const seen = new Set();
    const wrap = document.createElement('div');
    wrap.innerHTML = `<label class="organs4-slider">Възраст: <span class="organs4-val">0 години</span><input type="range" class="organs4-age" min="0" max="25" step="0.5" value="0"></label>
      <div class="organs4-stages">${STAGES.map((s) => `<span data-s="${s.id}">${s.label}</span>`).join('')}</div>
      <p class="small">Разгледай и четирите периода.</p>`;
    container.querySelector('.xp-task').appendChild(wrap);
    const inp = wrap.querySelector('.organs4-age');
    readTag = stage.bubble(growTop, '50 см', { lift: 0.25, cls: 'tag' });
    let lastStage = null;
    const fmtAge = (a) => (a === 0 ? 'новородено' : a < 1 ? 'половин година' : `${a % 1 ? a.toFixed(1).replace('.', ',') : a} ${a === 1 ? 'година' : 'години'}`);
    const onAge = () => {
      const a = Number(inp.value);
      const g = setAge(a);
      wrap.querySelector('.organs4-val').textContent = fmtAge(a);
      const cm = Math.round(g.h * 100);
      readTag.set(cm >= 100 ? `${(cm / 100).toFixed(2).replace('.', ',')} м` : `${cm} см`);
      const st = stageOf(a);
      wrap.querySelectorAll('.organs4-stages span').forEach((s) => s.classList.toggle('cur', s.dataset.s === st.id));
      if (st !== lastStage) {
        lastStage = st;
        say(growSay, `<b>${st.icon} ${esc(st.label)}</b><br>${esc(st.text)}`, 'wide', 0);
        if (!seen.has(st.id)) {
          seen.add(st.id);
          wrap.querySelector(`[data-s="${st.id}"]`).classList.add('on');
          const mk = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.03), new THREE.MeshBasicMaterial({ color: [0xe57373, 0xffb74d, 0x64b5f6, 0x81c784][STAGES.indexOf(st)] }));
          mk.position.set(0, g.h * U, 0.01);
          ruler.add(mk);
          pencilMarks.push(mk);
        }
      }
      if (seen.size === 4 && !revealed && a >= 18) reveal();
    };
    let revealed = false;
    inp.addEventListener('input', onAge);
    function reveal() {
      revealed = true;
      predBox.querySelectorAll('.choice').forEach((x) => { if (x.dataset.v === 'ok') x.classList.add('right'); else if (x.classList.contains('on')) x.classList.add('wrong'); });
      shell.msg(pred === 'ok' ? 'Позна! След юношеството растежът на ръст спира.' : 'Виж ръстомера: след около 18 години чертата вече не се вдига. Растежът на ръст спира.', pred === 'ok' ? 'good' : 'bad');
      later(() => {
        askQ('pace', 'Всички деца ли растат и съзряват еднакво бързо?', [
          { v: 'same', t: 'Да, всички растат точно еднакво.' },
          { v: 'ok', t: 'Не. Всеки расте и съзрява със свое темпо.' },
          { v: 'boys', t: 'Само момчетата растат по различен начин.' }],
        'Вярно! Всеки расте със свое темпо и това е напълно нормално.',
        'Помисли за съучениците си: всички ли са еднакво високи?', () => {
          askQ('hyg', 'Защо в юношеството хигиената става още по-важна?', [
            { v: 'ok', t: 'Тялото се поти повече, затова трябва да се къпем често и да носим чисти дрехи.' },
            { v: 'tall', t: 'Защото човек става по-висок.' },
            { v: 'none', t: 'Не е по-важна — хигиената е важна само за бебетата.' }],
          'Точно така! Къпането, чистите дрехи и измиването на зъбите ни пазят здрави.',
          'Прочети пак балончето за юношеството: какво се увеличава?', finish4);
        });
      }, 900);
    }
  }
  function finish4() {
    scores.push(q4 / 5);
    const c = shell.setControls('<button class="btn primary">Виж резултата</button>');
    c.querySelector('button').addEventListener('click', () => {
      clearTip();
      if (readTag) { readTag.remove(); readTag = null; }
      const ratio = scores.reduce((a, s) => a + s, 0) / scores.length;
      shell.finish(ratio, onComplete, restart);
    });
  }

  function restart() {
    clearTimers();
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    clearTags();
    if (readTag) { readTag.remove(); readTag = null; }
    mv.clear();
    trip.curve = null;
    for (const t of tokens) scene.remove(t);
    tokens.length = 0;
    for (const p of sortParts) scene.remove(p);
    sortParts.length = 0;
    for (const m of pencilMarks) ruler.remove(m);
    pencilMarks.length = 0;
    kid.visible = true;
    table.visible = true;
    apple.visible = true;
    apple.position.copy(APPLE_HOME);
    apple.userData.flying = false;
    biteMark.visible = false;
    bolus.visible = false;
    grow.g.visible = false;
    mom.g.visible = false;
    headBar.visible = false;
    ruler.visible = false;
    heldEl.hidden = true;
    life.air = false; life.amp = 1; life.br = 15; life.chew = 0;
    lockView(false);
    scores.length = 0;
    step1();
  }

  step1();
  return {
    dispose() {
      clearTimers();
      if (stopDrag) stopDrag();
      heldEl.remove();
      menu.remove();
      stage.dispose();
    },
  };
}
