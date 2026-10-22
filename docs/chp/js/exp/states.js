// 3.1.3 „Твърди тела, течности и газове“ — уютна кухненска маса.
// Стъпки: опознай нещата на масата → опити със съдове и спринцовки → подреди → предскажи.
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const KIND = {
  solid: { name: 'Твърди тела', one: 'твърдо тяло', color: 0x8d6e63, css: '#8d6e63' },
  liquid: { name: 'Течности', one: 'течност', color: 0x1e88e5, css: '#1e88e5' },
  gas: { name: 'Газове', one: 'газ', color: 0x00897b, css: '#00897b' },
};

// Неща на масата за първата стъпка.
const ITEMS = [
  { id: 'stone', label: 'Камък', icon: '🪨', kind: 'solid',
    note: 'Има собствена форма и не тече. Където и да го сложиш, остава същият.' },
  { id: 'spoon', label: 'Лъжица', icon: '🥄', kind: 'solid',
    note: 'Пази формата си — в чашата, в купата и на масата.' },
  { id: 'ice', label: 'Кубче лед', icon: '🧊', kind: 'solid',
    note: 'Ледът е замръзнала вода. Докато е лед, има собствена форма. Когато се стопи, става течност.' },
  { id: 'water', label: 'Вода', icon: '💧', kind: 'liquid',
    note: 'Водата тече и приема формата на чашата. Колкото вода налееш, толкова остава.' },
  { id: 'honey', label: 'Мед', icon: '🍯', kind: 'liquid',
    note: 'Медът тече бавно, но тече. И той приема формата на буркана.' },
  { id: 'juice', label: 'Сок', icon: '🧃', kind: 'liquid',
    note: 'Сокът се налива. В каната има формата на каната, а в чашата — на чашата.' },
  { id: 'sugar', label: 'Захар', icon: '🍬', kind: 'solid',
    note: 'Захарта се сипва, но всяко зрънце е мъничко твърдо тяло със своя форма.' },
  { id: 'balloon', label: 'Въздух в балон', icon: '🎈', kind: 'gas',
    note: 'Въздухът е невидим. Той запълва целия балон и няма своя форма.' },
  { id: 'steam', label: 'Пара от чайника', icon: '♨️', kind: 'gas',
    note: 'Водата в чайника кипи и става на пара. Парата се разнася из цялата кухня. Самата пара е невидима — бялото облаче са ситни капчици.' },
];
const itemById = Object.fromEntries(ITEMS.map((o) => [o.id, o]));

// Неща за подреждане в третата стъпка (някои са нови).
const SORT = [
  { id: 's-stone', label: 'Камък', kind: 'solid', why: 'Камъкът пази формата си и не тече.' },
  { id: 's-pencil', label: 'Молив', kind: 'solid', why: 'Моливът има собствена форма. Не тече и не се разнася.' },
  { id: 's-ice', label: 'Лед', kind: 'solid', why: 'Ледът е замръзнала вода. Докато е лед, пази формата си.' },
  { id: 's-sugar', label: 'Захар', kind: 'solid', why: 'Захарта се сипва, но всяко зрънце пази формата си.' },
  { id: 's-milk', label: 'Мляко', kind: 'liquid', why: 'Млякото се налива и приема формата на чашата. Не се разнася из стаята.' },
  { id: 's-oil', label: 'Олио', kind: 'liquid', why: 'Олиото тече и приема формата на бутилката.' },
  { id: 's-honey', label: 'Мед', kind: 'liquid', why: 'Медът тече — бавно, но тече. Приема формата на буркана.' },
  { id: 's-air', label: 'Въздух в балон', kind: 'gas', why: 'Въздухът запълва целия балон. Няма своя форма.' },
  { id: 's-steam', label: 'Пара', kind: 'gas', why: 'Парата се разнася из цялата стая и запълва всичко.' },
];
const sortById = Object.fromEntries(SORT.map((o) => [o.id, o]));

const STYLE = `
.st-k{display:inline-block;padding:0 7px;border-radius:99px;color:#fff;font-weight:800;font-size:.78rem;line-height:1.5}
.st-k.solid{background:#8d6e63}.st-k.liquid{background:#1e88e5}.st-k.gas{background:#00897b}
.st-list{margin:6px 0 0;padding-left:20px}.st-list li{margin:2px 0}.st-list li.done{color:#0d7a3a}
.st-list li.done::marker{content:"✓ ";font-weight:900}.st-list li.cur{font-weight:700}
.st-q{margin:10px 0 4px;font-weight:700}
.st-press{display:block;margin-top:6px}
`;
function injectStyle() {
  if (document.getElementById('st-style')) return;
  const s = document.createElement('style');
  s.id = 'st-style';
  s.textContent = STYLE;
  document.head.appendChild(s);
}

// ---------- материали и текстури ----------
let puffTex = null;
function getPuffTex() {
  if (puffTex) return puffTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  puffTex = new THREE.CanvasTexture(c);
  puffTex.colorSpace = THREE.SRGBColorSpace;
  return puffTex;
}
function puffSprite(color, opacity = 0.6, size = 0.3) {
  const m = new THREE.SpriteMaterial({ map: getPuffTex(), color, transparent: true, opacity, depthWrite: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  s.renderOrder = 5;
  return s;
}
function checkTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff8ee';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(226,120,110,0.45)';
  ctx.fillRect(0, 0, 64, 128);
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = 'rgba(200,80,70,0.35)';
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(9, 5);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glassMat = () => new THREE.MeshStandardMaterial({
  color: 0xe3f2ff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide,
});
const liquidMat = (color, opacity = 0.78) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.15 });

// ---------- съдове с течност ----------
// Съдът е описан с вътрешния си радиус rin(y) за y от дъното (0) до ръба (depth).
const SHAPES = {
  glass: { floor: 0.06, depth: 1.45, t: 0.03, rin: () => 0.385 },
  bowl: { floor: 0.09, depth: 0.62, t: 0.04, R: 0.85, rin: (y) => Math.sqrt(Math.max(0, 0.85 ** 2 - (0.85 - y) ** 2)) },
  bottle: { floor: 0.06, depth: 1.9, t: 0.03,
    rin: (y) => (y < 1.2 ? 0.34 : y < 1.5 ? 0.34 + (0.09 - 0.34) * ((y - 1.2) / 0.3) : 0.09) },
  jug: { floor: 0.06, depth: 1.35, t: 0.03, rin: (y) => 0.44 + 0.04 * (y / 1.35) },
  jar: { floor: 0.06, depth: 1.5, t: 0.03, rin: () => 0.62 },
  honeyJar: { floor: 0.05, depth: 0.62, t: 0.03, rin: (y) => 0.3 + (y > 0.5 ? -0.05 * ((y - 0.5) / 0.12) : 0) },
  sugarBowl: { floor: 0.07, depth: 0.38, t: 0.04, rin: (y) => Math.sqrt(Math.max(0, 0.5 ** 2 - (0.5 - y) ** 2)) },
};
const V0 = Math.PI * 0.385 * 0.385 * 1.05; // една порция вода (в чашата стига до 1,05)

function volumeOf(sh, h) {
  const n = 60;
  let v = 0;
  for (let i = 0; i < n; i++) {
    const y = ((i + 0.5) / n) * h;
    v += Math.PI * sh.rin(y) ** 2 * (h / n);
  }
  return v;
}
function heightFor(sh, V) {
  if (V <= 1e-5) return 0;
  let lo = 0;
  let hi = sh.depth;
  if (volumeOf(sh, hi) <= V) return hi;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (volumeOf(sh, mid) < V) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
function wallGeo(sh) {
  const pts = [];
  const n = 36;
  const { floor, depth, t } = sh;
  pts.push(new THREE.Vector2(0, floor - t), new THREE.Vector2(sh.rin(0) + t, floor - t));
  for (let i = 0; i <= n; i++) { const y = (i / n) * depth; pts.push(new THREE.Vector2(sh.rin(y) + t, floor + y)); }
  pts.push(new THREE.Vector2(sh.rin(depth) + t * 0.5, floor + depth + 0.012));
  for (let i = n; i >= 0; i--) { const y = (i / n) * depth; pts.push(new THREE.Vector2(sh.rin(y), floor + y)); }
  pts.push(new THREE.Vector2(0, floor));
  return new THREE.LatheGeometry(pts, 40);
}
function liquidGeo(sh, h) {
  const pts = [new THREE.Vector2(0, 0)];
  const n = 24;
  for (let i = 0; i <= n; i++) { const y = (i / n) * h; pts.push(new THREE.Vector2(Math.max(0.001, sh.rin(y) - 0.006), y)); }
  pts.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(pts, 32);
}
function makeVessel(shapeName, { liquid = 0x64b5f6, liquidOpacity = 0.78, wallMat = null } = {}) {
  const sh = SHAPES[shapeName];
  const g = new THREE.Group();
  const wall = new THREE.Mesh(wallGeo(sh), wallMat || glassMat());
  wall.renderOrder = 3;
  g.add(wall);
  const liq = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat(liquid, liquidOpacity));
  liq.position.y = sh.floor;
  liq.renderOrder = 1;
  liq.visible = false;
  g.add(liq);
  const lip = new THREE.Object3D();
  lip.position.set(sh.rin(sh.depth) + sh.t, sh.floor + sh.depth, 0);
  g.add(lip);
  g.userData.vessel = { sh, liq, vol: 0, h: 0, lip };
  return g;
}
function setVol(g, V) {
  const v = g.userData.vessel;
  v.vol = Math.max(0, V);
  const h = heightFor(v.sh, v.vol);
  if (Math.abs(h - v.h) < 1e-4 && v.liq.geometry.attributes.position) return;
  v.h = h;
  v.liq.geometry.dispose();
  v.liq.geometry = h > 0.004 ? liquidGeo(v.sh, h) : new THREE.BufferGeometry();
  v.liq.visible = h > 0.004;
}

// ---------- модели ----------
function stoneModel() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), mat(0x8f8a84, { flat: true }));
  m.scale.set(1.2, 0.72, 1);
  m.rotation.set(0.3, 0.5, 0.1);
  m.position.y = 0.2;
  g.add(m);
  return g;
}
function spoonModel() {
  const g = new THREE.Group();
  const metal = mat(0xd5dbe1, { metalness: 0.75, roughness: 0.25 });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.035, 0.09), metal);
  handle.position.set(-0.2, 0.05, 0);
  handle.rotation.z = 0.06;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), metal);
  bowl.scale.set(1.5, 0.5, 1);
  bowl.position.set(0.4, 0.09, 0);
  g.add(handle, bowl);
  return g;
}
function iceModel(withSaucer = true) {
  const g = new THREE.Group();
  if (withSaucer) {
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.05, 28), mat(0xffffff, { roughness: 0.4 }));
    saucer.position.y = 0.025;
    g.add(saucer);
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), liquidMat(0xb3e0ff, 0.5));
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.052;
    g.add(puddle);
    g.userData.puddle = puddle;
  }
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.36),
    new THREE.MeshStandardMaterial({ color: 0xd8f1ff, transparent: true, opacity: 0.82, roughness: 0.08, emissive: 0x6fb8e8, emissiveIntensity: 0.15 }));
  cube.position.y = (withSaucer ? 0.05 : 0) + 0.17;
  cube.rotation.y = 0.4;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
  cube.add(edges);
  g.add(cube);
  g.userData.cube = cube;
  return g;
}
function honeyModel() {
  const g = new THREE.Group();
  const jar = makeVessel('honeyJar', { liquid: 0xf0a020, liquidOpacity: 0.92 });
  setVol(jar, volumeOf(SHAPES.honeyJar, 0.45));
  g.add(jar);
  // Дървена лъжица за мед, легнала върху буркана, и капка, която бавно се точи.
  const wood = mat(0xb07a45);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), wood);
  stick.rotation.z = Math.PI / 2;
  stick.position.set(0.15, 0.76, 0);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 12), mat(0xc58a4f));
  head.rotation.z = Math.PI / 2;
  head.position.set(-0.05, 0.76, 0);
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.12, 12), liquidMat(0xf0a020, 0.9));
  coat.rotation.z = Math.PI / 2;
  coat.position.copy(head.position);
  const drip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), liquidMat(0xf0a020, 0.95));
  drip.position.set(-0.05, 0.7, 0);
  g.add(stick, head, coat, drip);
  g.userData.drip = drip;
  return g;
}
function jugModel(liquid, fill = 1) {
  const g = makeVessel('jug', { liquid });
  const sh = SHAPES.jug;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 20, Math.PI), glassMat());
  handle.rotation.z = Math.PI / 2;
  handle.position.set(-sh.rin(sh.depth) - 0.03, sh.floor + sh.depth * 0.55, 0);
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 12, 1, true), glassMat());
  spout.rotation.z = -Math.PI / 2 - 0.5;
  spout.position.set(sh.rin(sh.depth) + 0.05, sh.floor + sh.depth - 0.02, 0);
  g.add(handle, spout);
  setVol(g, V0 * fill);
  return g;
}
function sugarModel() {
  const g = makeVessel('sugarBowl', { wallMat: mat(0x9ec5e8, { roughness: 0.4 }) });
  const sh = SHAPES.sugarBowl;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 20), mat(0x9ec5e8, { roughness: 0.4 }));
  foot.position.y = 0.025;
  g.add(foot);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xfbfbf7, { flat: true, roughness: 0.9 }));
  mound.scale.y = 0.42;
  mound.position.y = sh.floor + 0.24;
  g.add(mound);
  const grainM = mat(0xffffff, { roughness: 0.6 });
  for (let i = 0; i < 14; i++) {
    const gr = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), grainM);
    const a = i * 2.3;
    gr.position.set(Math.cos(a) * (0.6 + (i % 3) * 0.08), 0.02, Math.sin(a) * (0.6 + (i % 4) * 0.06));
    gr.rotation.set(i, i * 2, 0);
    g.add(gr);
  }
  return g;
}
function balloonModel(height = 2.0, scale = 1) {
  const g = new THREE.Group();
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.14, 14), mat(0x5c6bc0));
  weight.position.y = 0.07;
  g.add(weight);
  const ball = new THREE.Group();
  const skin = new THREE.Mesh(new THREE.SphereGeometry(0.42 * scale, 24, 18), new THREE.MeshStandardMaterial({ color: 0xe53950, roughness: 0.28, transparent: true, opacity: 0.93 }));
  skin.scale.y = 1.18;
  const knot = new THREE.Mesh(new THREE.ConeGeometry(0.06 * scale, 0.1 * scale, 8), mat(0xc62840));
  knot.position.y = -0.52 * scale;
  ball.add(skin, knot);
  ball.position.y = height;
  g.add(ball);
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.14, 0), new THREE.Vector3(0, height - 0.55 * scale, 0)]);
  const string = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x555555 }));
  g.add(string);
  g.userData.ball = ball;
  g.userData.string = string;
  g.userData.bHeight = height;
  g.userData.bScale = scale;
  return g;
}
function kettleModel() {
  const g = new THREE.Group();
  const red = mat(0xd84b3a, { roughness: 0.35, metalness: 0.2 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.1, 28), mat(0x37474f));
  base.position.y = 0.05;
  const glow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.02, 6, 40), new THREE.MeshBasicMaterial({ color: 0x4fc3f7 }));
  glow.rotation.x = Math.PI / 2;
  glow.position.y = 0.1;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 18), red);
  body.scale.set(1, 0.82, 1);
  body.position.y = 0.55;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.08, 20), red);
  lid.position.y = 1.03;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0x263238));
  knob.position.y = 1.1;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 20, Math.PI), mat(0x263238));
  handle.position.y = 0.88;
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.55, 12), red);
  spout.position.set(0.62, 0.72, 0);
  spout.rotation.z = -0.9;
  g.add(base, glow, body, lid, knob, handle, spout);
  g.userData.glow = glow;
  return g;
}
function pencilModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), mat(0xf6c344, { flat: true }));
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.06;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 6), mat(0xe8c9a0));
  tip.rotation.z = -Math.PI / 2;
  tip.position.set(0.53, 0.06, 0);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 6), mat(0x333333));
  lead.rotation.z = -Math.PI / 2;
  lead.position.set(0.6, 0.06, 0);
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), mat(0xf48fb1));
  eraser.rotation.z = Math.PI / 2;
  eraser.position.set(-0.5, 0.06, 0);
  g.add(body, tip, lead, eraser);
  g.rotation.y = 0.5;
  return g;
}
function steamCloud(n = 7) {
  const g = new THREE.Group();
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const p = puffSprite(0xffffff, 0.75, 0.42);
    p.userData.ph = i * 1.3;
    p.userData.base = new THREE.Vector3(Math.cos(i * 2.2) * 0.25, 0.55 + (i % 3) * 0.12, Math.sin(i * 2.2) * 0.18);
    g.add(p);
    puffs.push(p);
  }
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0x90a4ae, transparent: true, opacity: 0.35 }));
  plate.position.y = 0.015;
  g.add(plate);
  g.userData.puffs = puffs;
  return g;
}
function syringeModel(kind) {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 14), mat(kind === 'air' ? 0xef5350 : 0x42a5f5));
  cap.position.y = 0.06;
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.045, 0.18, 18, 1, true), glassMat());
  tip.position.y = 0.21;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.45, 24, 1, true), glassMat());
  barrel.position.y = 0.3 + 0.725;
  barrel.renderOrder = 3;
  const flange = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.22), new THREE.MeshStandardMaterial({ color: 0xe3f2ff, transparent: true, opacity: 0.6 }));
  flange.position.y = 1.76;
  const tickM = new THREE.MeshBasicMaterial({ color: 0x546e7a });
  for (let i = 0; i < 7; i++) {
    const tk = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.06 : 0.11, 0.012, 0.01), tickM);
    tk.position.set(0, 0.4 + i * 0.2, 0.182);
    g.add(tk);
  }
  const plunger = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 20), mat(0x37474f));
  const rod = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.5, 0.07), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, transparent: true, opacity: 0.9 }));
  rod.position.y = 0.78;
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }));
  thumb.position.y = 1.55;
  plunger.add(disc, rod, thumb);
  plunger.position.y = 1.68;
  g.add(cap, tip, barrel, flange, plunger);
  g.userData.plunger = plunger;
  g.userData.cap = cap;
  if (kind === 'water') {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1, 20), liquidMat(0x42a5f5, 0.7));
    w.renderOrder = 1;
    g.add(w);
    g.userData.water = w;
  }
  return g;
}
function perfumeModel() {
  const g = new THREE.Group();
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0xf8bbd0, transparent: true, opacity: 0.55, roughness: 0.05, flatShading: true }));
  bottle.position.y = 0.25;
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.36, 6), liquidMat(0xec407a, 0.7));
  liq.position.y = 0.2;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 10), glassMat());
  neck.position.y = 0.55;
  const cap = new THREE.Group();
  const capM = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 12), mat(0xd4af37, { metalness: 0.7, roughness: 0.3 }));
  cap.add(capM);
  cap.position.y = 0.66;
  g.add(bottle, liq, neck, cap);
  g.userData.cap = cap;
  return g;
}
function sieveModel() {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x78909c, wireframe: true }));
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.6, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xb0bec5, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.03, 8, 40), mat(0x90a4ae, { metalness: 0.6, roughness: 0.3 }));
  rim.rotation.x = Math.PI / 2;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.08), mat(0x37474f));
  handle.position.set(-1.05, 0.02, 0);
  g.add(mesh, inner, rim, handle);
  return g;
}
function vaseModel() {
  const g = new THREE.Group();
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.7, 16), mat(0x5c9ead, { roughness: 0.4 }));
  vase.position.y = 0.35;
  g.add(vase);
  const flowers = [];
  const cols = [0xffd54f, 0xf06292, 0xffffff, 0xba68c8, 0xff8a65];
  for (let i = 0; i < 5; i++) {
    const stem = new THREE.Group();
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 5), mat(0x558b2f));
    s.position.y = 0.4;
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat(cols[i], { flat: true }));
    head.position.y = 0.82;
    stem.add(s, head);
    stem.position.y = 0.6;
    stem.rotation.set(Math.sin(i * 2) * 0.3, 0, Math.cos(i * 1.7) * 0.3);
    stem.userData.ph = i;
    g.add(stem);
    flowers.push(stem);
  }
  g.userData.flowers = flowers;
  return g;
}

// ---------- кухня ----------
function buildKitchen(scene) {
  const live = {};
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat(0xb98a5e));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.6;
  floor.receiveShadow = true;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), mat(0xfbeed7));
  wall.position.set(0, 3.5, -4.6);
  scene.add(wall);
  // плочки зад масата
  const tileC = document.createElement('canvas');
  tileC.width = tileC.height = 64;
  const tctx = tileC.getContext('2d');
  tctx.fillStyle = '#e9f3f1'; tctx.fillRect(0, 0, 64, 64);
  tctx.strokeStyle = '#c4dad6'; tctx.lineWidth = 3; tctx.strokeRect(1.5, 1.5, 61, 61);
  const tileTex = new THREE.CanvasTexture(tileC);
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(24, 3);
  tileTex.colorSpace = THREE.SRGBColorSpace;
  const tiles = new THREE.Mesh(new THREE.PlaneGeometry(24, 3), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.5 }));
  tiles.position.set(0, -0.2, -4.58);
  scene.add(tiles);
  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), mat(0xf6e3c6));
  sideWall.rotation.y = Math.PI / 2;
  sideWall.position.set(-9, 3.5, 6);
  scene.add(sideWall);

  // прозорец с небе и облачета
  const win = new THREE.Group();
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ color: 0x9fd4ff }));
  win.add(sky);
  const hill = new THREE.Mesh(new THREE.CircleGeometry(2.2, 30, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8bc34a }));
  hill.position.set(0.4, -1.1, 0.005);
  hill.scale.y = 0.35;
  win.add(hill);
  const clouds = [];
  for (let i = 0; i < 2; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.22 + k * 0.04, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      p.position.set(k * 0.25 - 0.25, (k % 2) * 0.08, 0.01);
      c.add(p);
    }
    c.position.set(-1 + i * 1.6, 0.55 - i * 0.35, 0);
    win.add(c);
    clouds.push(c);
  }
  const frameM = mat(0xffffff);
  for (const [w, h, x, y] of [[3.4, 0.12, 0, 1.12], [3.4, 0.12, 0, -1.12], [0.12, 2.36, 1.64, 0], [0.12, 2.36, -1.64, 0], [0.08, 2.2, 0, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameM);
    f.position.set(x, y, 0.04);
    win.add(f);
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.4), frameM);
  sill.position.set(0, -1.22, 0.15);
  win.add(sill);
  const curtains = [];
  for (const s of [-1, 1]) {
    const cu = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.6, 1, 8), new THREE.MeshStandardMaterial({ color: 0xf28b82, side: THREE.DoubleSide, roughness: 0.9 }));
    cu.position.set(s * 2.05, -0.05, 0.12);
    win.add(cu);
    curtains.push(cu);
  }
  win.position.set(-2.2, 3.0, -4.55);
  scene.add(win);

  // часовник с махало
  const clock = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), mat(0xffffff));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 32), mat(0x6d4c41));
  const hand = (len, w, c) => {
    const h = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.02), new THREE.MeshBasicMaterial({ color: c }));
    m.position.y = len / 2;
    h.add(m);
    h.position.z = 0.02;
    return h;
  };
  const hh = hand(0.25, 0.04, 0x333333);
  const mh = hand(0.38, 0.03, 0x333333);
  const sh = hand(0.42, 0.012, 0xe53935);
  clock.add(face, rim, hh, mh, sh);
  const pend = new THREE.Group();
  const rodP = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.8, 0.02), mat(0xc9a227));
  rodP.position.y = -0.4;
  const bob = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), mat(0xc9a227));
  bob.position.set(0, -0.85, 0.01);
  pend.add(rodP, bob);
  pend.position.set(0, -0.5, 0.01);
  clock.add(pend);
  clock.position.set(2.6, 3.5, -4.55);
  scene.add(clock);

  // рафт с буркани
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.5), mat(0xa47148));
  shelf.position.set(5.6, 2.4, -4.3);
  scene.add(shelf);
  const jarCols = [0xffcc80, 0xef9a9a, 0xa5d6a7, 0x90caf9];
  for (let i = 0; i < 4; i++) {
    const j = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42 + (i % 2) * 0.12, 14), mat(jarCols[i], { roughness: 0.3 }));
    j.position.set(4.6 + i * 0.66, 2.45 + (0.21 + (i % 2) * 0.06), -4.3);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.06, 14), mat(0xd84b3a));
    lid.position.y = (0.42 + (i % 2) * 0.12) / 2 + 0.03;
    j.add(lid);
    scene.add(j);
  }

  // маса с покривка
  const wood = mat(0xa8774d, { roughness: 0.7 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.22, 6.8), wood);
  top.position.y = -0.13;
  top.receiveShadow = true;
  scene.add(top);
  for (const [x, z] of [[-4.9, -3.0], [4.9, -3.0], [-4.9, 3.0], [4.9, 3.0]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 2.4, 10), wood);
    leg.position.set(x, -1.4, z);
    scene.add(leg);
  }
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 5.8), new THREE.MeshStandardMaterial({ map: checkTexture(), roughness: 0.95 }));
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = 0.004;
  cloth.receiveShadow = true;
  scene.add(cloth);

  // лампа над масата
  const lamp = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.4, 5), mat(0x333333));
  cord.position.y = -1.2;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.45, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xffb74d, side: THREE.DoubleSide, roughness: 0.6 }));
  shade.position.y = -2.5;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff3c4 }));
  bulb.position.y = -2.68;
  lamp.add(cord, shade, bulb);
  lamp.position.set(0, 7.6, -0.6);
  scene.add(lamp);

  live.update = (dt, t) => {
    for (const [i, c] of clouds.entries()) { c.position.x += dt * (0.06 + i * 0.03); if (c.position.x > 1.9) c.position.x = -1.9; }
    curtains.forEach((cu, i) => { cu.rotation.y = Math.sin(t * 0.6 + i) * 0.08; });
    const now = new Date();
    sh.rotation.z = -(now.getSeconds() + now.getMilliseconds() / 1000) / 60 * Math.PI * 2;
    mh.rotation.z = -(now.getMinutes() + now.getSeconds() / 60) / 60 * Math.PI * 2;
    hh.rotation.z = -((now.getHours() % 12) + now.getMinutes() / 60) / 12 * Math.PI * 2;
    pend.rotation.z = Math.sin(t * Math.PI) * 0.22;
    lamp.rotation.z = Math.sin(t * 0.5) * 0.015;
  };
  return live;
}

// ---------- преживяване ----------
export function mount(container, opts) {
  injectStyle();
  // „Започни отначало“ строи всичко наново — така нищо не остава от предишния опит.
  let inst = null;
  const restart = () => { inst.dispose(); inst = build(container, opts, restart); };
  inst = build(container, opts, restart);
  return { dispose() { inst.dispose(); } };
}

function build(container, { onComplete }, restart) {
  const STEPS = ['Опознай нещата на масата', 'Опити: форма и място', 'Подреди', 'Предскажи и провери'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xf6e3c6, camPos: [0, 5.2, 8.6], target: [0, 0.6, 0], shadows: true, minDistance: 2.2, maxDistance: 14,
    maxPolarAngle: Math.PI * 0.42,
  });
  const { scene } = stage;
  stage.controls.minAzimuthAngle = -1.05;
  stage.controls.maxAzimuthAngle = 1.05;
  stage.hemi.color.set(0xfff4e2);
  stage.sun.position.set(3, 10, 6);
  const kitchen = buildKitchen(scene);

  // ---- анимации и таймери ----
  const anims = new Set();
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  function animate(dur, fn, done) { const a = { k: 0, dur, fn, done }; anims.add(a); return a; }
  const later = (sec, fn) => animate(sec, () => {}, fn);
  stage.tick((dt) => {
    for (const a of [...anims]) {
      a.k = Math.min(1, a.k + dt / a.dur);
      a.fn(a.k);
      if (a.k >= 1) { anims.delete(a); if (a.done) a.done(); }
    }
  });

  const shadowAll = (g) => g.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; });

  // ---- стъпка 1: неща на масата ----
  const POS1 = {
    stone: [-3.7, 0, 1.3], spoon: [-2.4, 0, 1.6], ice: [-1.05, 0, 1.3], water: [0.3, 0, 1.4], honey: [1.65, 0, 1.25],
    juice: [3.25, 0, 1.0], sugar: [-2.5, 0, -0.9], balloon: [-3.9, 0, -2.1], steam: [1.9, 0, -1.9],
  };
  const roots = new Map();
  const tableItems = new THREE.Group();
  scene.add(tableItems);
  const kettle = kettleModel();
  kettle.position.set(POS1.steam[0], 0, POS1.steam[2]);
  shadowAll(kettle);
  scene.add(kettle);
  const vase = vaseModel();
  vase.position.set(4.2, 0, -2.3);
  shadowAll(vase);
  scene.add(vase);
  const steamPuffs = [];
  const steamGroup = new THREE.Group();
  steamGroup.position.set(POS1.steam[0] + 0.86, 0.98, POS1.steam[2]);
  for (let i = 0; i < 22; i++) {
    const p = puffSprite(0xffffff, 0.6, 0.2);
    p.userData.k = i / 22;
    p.userData.sx = (Math.random() - 0.5) * 0.4;
    p.userData.sz = (Math.random() - 0.5) * 0.4;
    steamGroup.add(p);
    steamPuffs.push(p);
  }
  const steamHit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
  steamHit.position.set(0.2, 0.7, 0);
  steamGroup.add(steamHit);
  scene.add(steamGroup);

  const builders1 = {
    stone: stoneModel, spoon: spoonModel, ice: () => iceModel(true), honey: honeyModel, sugar: sugarModel,
    water: () => { const g = makeVessel('glass'); setVol(g, V0); g.scale.setScalar(0.72); return g; },
    juice: () => { const g = jugModel(0xffa726, 0.9); g.scale.setScalar(0.78); g.rotation.y = 2.6; return g; },
    balloon: () => balloonModel(2.1, 1),
  };
  for (const o of ITEMS) {
    let g;
    if (o.id === 'steam') {
      g = steamGroup;
    } else {
      g = builders1[o.id]();
      g.position.set(...POS1[o.id]);
      shadowAll(g);
      tableItems.add(g);
      addHitBox(g, 0.8);
    }
    g.userData.pickId = o.id;
    roots.set(o.id, g);
    const box = new THREE.Box3().setFromObject(g);
    const top = box.max.y - g.position.y;
    const lbl = labelSprite(o.label, { size: 0.24 });
    lbl.position.set(0, o.id === 'balloon' ? 1.0 : o.id === 'steam' ? 1.55 : top + 0.22, 0);
    if (o.id === 'balloon') lbl.position.y = 2.9;
    g.add(lbl);
    stage.steadyLabel(lbl, 9);
    g.userData.top = lbl.position.y + 0.25;
    g.userData.label = lbl;
  }

  // ---- оживяване ----
  const balloons = [];
  const clouds = [];
  stage.tick((dt, t) => {
    kitchen.update(dt, t);
    // пара от чайника
    if (steamGroup.visible) {
      for (const p of steamPuffs) {
        const u = p.userData;
        u.k = (u.k + dt * 0.28) % 1;
        const k = u.k;
        p.position.set(u.sx * k * 2 + k * 0.5, k * 1.6, u.sz * k * 2 + Math.sin(t + u.sx * 10) * 0.05);
        p.scale.setScalar(0.12 + k * 0.6);
        p.material.opacity = 0.65 * Math.min(1, k * 6) * (1 - k);
      }
    }
    kettle.userData.glow.material.color.setHSL(0.55, 0.9, 0.55 + Math.sin(t * 3) * 0.1);
    for (const b of balloons) {
      if (!b.visible) continue;
      const u = b.userData;
      const ph = u.ph || 0;
      u.ball.position.set(Math.sin(t * 0.7 + ph) * 0.12, u.bHeight + Math.sin(t * 1.1 + ph) * 0.08, Math.cos(t * 0.5 + ph) * 0.06);
      u.ball.rotation.z = Math.sin(t * 0.7 + ph) * 0.08;
      const pos = u.string.geometry.attributes.position;
      pos.setXYZ(1, u.ball.position.x, u.ball.position.y - 0.55 * u.bScale, u.ball.position.z);
      pos.needsUpdate = true;
    }
    const honey = roots.get('honey');
    if (honey.visible) {
      const d = honey.userData.drip;
      const cyc = (t * 0.35) % 1;
      if (cyc < 0.7) { d.position.y = 0.7 - cyc * 0.05; d.scale.set(1, 1 + cyc * 2.4, 1); } else { d.position.y = 0.665 - (cyc - 0.7) * 1.2; d.scale.set(1, 1.2, 1); }
    }
    const ice = roots.get('ice');
    if (ice.visible) ice.userData.cube.material.emissiveIntensity = 0.12 + Math.sin(t * 2) * 0.06;
    for (const fl of vase.userData.flowers) fl.rotation.z = Math.cos(fl.userData.ph * 1.7) * 0.3 + Math.sin(t * 1.2 + fl.userData.ph) * 0.05;
    for (const c of clouds) {
      if (!c.visible) continue;
      for (const p of c.userData.puffs) {
        const u = p.userData;
        p.position.set(u.base.x + Math.sin(t * 0.8 + u.ph) * 0.06, u.base.y + Math.sin(t * 1.1 + u.ph) * 0.05, u.base.z);
        p.material.opacity = 0.6 + Math.sin(t + u.ph) * 0.15;
      }
    }
  });
  const b1 = roots.get('balloon');
  b1.userData.ph = 0;
  balloons.push(b1);

  // ---- балончета ----
  let tip = null;
  function say(anchor, html, cls = '', lift = null) {
    if (tip) tip.remove();
    const l = lift != null ? lift : anchor.userData.top || 1.2;
    tip = stage.bubble(anchor, html, { lift: l, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const extraBubbles = [];
  function pin(anchor, html, cls = '', lift = 1.2) {
    const b = stage.bubble(anchor, html, { lift, cls });
    extraBubbles.push(b);
    return b;
  }
  function clearPins() { while (extraBubbles.length) extraBubbles.pop().remove(); }
  const kindChip = (k) => `<span class="st-k ${k}">${esc(KIND[k].one)}</span>`;

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null, hit); });
  stage.onHover(() => {});

  // ---------- 1. Опознай ----------
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'На масата',
    items: ITEMS.map((o) => ({ id: o.id, label: o.label, icon: o.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  const overview = () => { stage.stopFollow(); stage.flyTo([0, 5.2, 8.6], [0, 0.6, 0]); };

  function step1() {
    shell.step(0);
    clearTip();
    menu.show(true);
    const seen = new Set();
    const NEED = 6;
    shell.task(`<p>На кухненската маса има много неща. Едни са <b>твърди тела</b>, други — <b>течности</b>, трети — <b>газове</b>.</p>
      <p><b>Разгледай поне ${NEED} неща:</b> кликни върху тях или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата маса</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${ITEMS.length}`);
    upd();
    const visit = (id) => {
      const o = itemById[id];
      const g = roots.get(id);
      const far = id === 'balloon' || id === 'steam';
      stage.focusOn(g, { dist: far ? 5.4 : 4.2, height: far ? 1.6 : 1.9, lift: id === 'balloon' ? 1.5 : id === 'steam' ? 0.7 : 0.3 });
      say(g, `<b>${esc(o.icon)} ${esc(o.label)}</b> ${kindChip(o.kind)}<br>${esc(o.note)}`, 'wide');
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size >= NEED) {
        next.disabled = false;
        shell.msg(seen.size === ITEMS.length ? 'Разгледа всичко! Продължи напред.' : 'Браво! Можеш да продължиш или да разгледаш още.', 'good');
      }
    };
    clickHandler = (id) => { if (!id || !itemById[id]) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Опити ----------
  const lab = new THREE.Group();
  lab.visible = false;
  scene.add(lab);
  const jug = jugModel(0x64b5f6, 1);
  const vessels = { glass: makeVessel('glass'), bowl: makeVessel('bowl'), bottle: makeVessel('bottle') };
  const VNAME = { glass: 'чашата', bowl: 'купата', bottle: 'бутилката' };
  const VLABEL = { glass: 'Чаша', bowl: 'Купа', bottle: 'Бутилка' };
  const VPOS = { jug: [-3.4, 0, 0.6], glass: [-1.5, 0, 0.6], bowl: [0.45, 0, 0.6], bottle: [2.4, 0, 0.6] };
  const bowlFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.06, 24), glassMat());
  bowlFoot.position.y = 0.03;
  vessels.bowl.add(bowlFoot);
  jug.position.set(...VPOS.jug);
  jug.userData.home = jug.position.clone();
  lab.add(jug);
  const jugLbl = labelSprite('Кана с вода', { size: 0.24 });
  jugLbl.position.y = 1.8;
  jug.add(jugLbl);
  stage.steadyLabel(jugLbl, 9);
  for (const k of Object.keys(vessels)) {
    const v = vessels[k];
    v.position.set(...VPOS[k]);
    v.userData.home = v.position.clone();
    v.userData.pickId = 'v-' + k;
    const lbl = labelSprite(VLABEL[k], { size: 0.24 });
    lbl.position.y = v.userData.vessel.sh.floor + v.userData.vessel.sh.depth + 0.35;
    v.add(lbl);
    stage.steadyLabel(lbl, 9);
    addHitBox(v, 0.9);
    lab.add(v);
  }
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1, 10, 1, true), liquidMat(0x64b5f6, 0.8));
  stream.visible = false;
  scene.add(stream);
  const labStone = stoneModel();
  labStone.position.set(-0.5, 0, 2.0);
  labStone.userData.home = labStone.position.clone();
  shadowAll(labStone);
  labStone.visible = false;
  lab.add(labStone);

  const gasLab = new THREE.Group();
  gasLab.visible = false;
  scene.add(gasLab);
  const syrAir = syringeModel('air');
  const syrWater = syringeModel('water');
  syrAir.position.set(-1.2, 0, 0.5);
  syrWater.position.set(0.1, 0, 0.5);
  const jar = makeVessel('jar');
  jar.position.set(2.0, 0, 0.3);
  const jarLid = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.08, 32), mat(0xb0bec5, { metalness: 0.6, roughness: 0.35 }));
  jarLid.position.y = SHAPES.jar.floor + SHAPES.jar.depth + 0.05;
  const lidHole = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), new THREE.MeshBasicMaterial({ color: 0x263238 }));
  lidHole.rotation.x = -Math.PI / 2;
  lidHole.position.y = jarLid.position.y + 0.041;
  jar.add(jarLid, lidHole);
  gasLab.add(syrAir, syrWater, jar);
  for (const [g, text, y] of [[syrAir, 'Въздух', 2.0], [syrWater, 'Вода', 2.0], [jar, 'Буркан', 1.95]]) {
    const l = labelSprite(text, { size: 0.24 });
    l.position.y = y;
    g.add(l);
    stage.steadyLabel(l, 9);
    g.userData.label = l;
  }
  // оцветен въздух: облачета, които се лутат вътре в спринцовката или буркана
  const AIR_N = 30;
  const airPuffs = [];
  for (let i = 0; i < AIR_N; i++) {
    const p = puffSprite(0xab47bc, 0.42, 0.26);
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    p.userData = { n: new THREE.Vector3(Math.cos(a) * r, Math.random(), Math.sin(a) * r), v: new THREE.Vector3(), where: 'syr', fly: 0 };
    gasLab.add(p);
    airPuffs.push(p);
  }
  const tmpV = new THREE.Vector3();
  const tipWorld = new THREE.Vector3();
  function syrRegion(n, out) {
    const top = syrAir.userData.plunger.position.y - 0.05;
    out.set(n.x * 0.13, 0.32 + n.y * Math.max(0.04, top - 0.32), n.z * 0.13);
    return syrAir.localToWorld(out);
  }
  function jarRegion(n, out) {
    const sh = SHAPES.jar;
    out.set(n.x * 0.52, sh.floor + 0.08 + n.y * (sh.depth - 0.16), n.z * 0.52);
    return jar.localToWorld(out);
  }
  stage.tick((dt) => {
    if (!gasLab.visible) return;
    syrAir.updateMatrixWorld();
    jar.updateMatrixWorld();
    const dens = 1 + (1 - (syrAir.userData.plunger.position.y - 0.3) / 1.38) * 1.2;
    for (const p of airPuffs) {
      const u = p.userData;
      u.v.x += (Math.random() - 0.5) * dt * 6;
      u.v.y += (Math.random() - 0.5) * dt * 6;
      u.v.z += (Math.random() - 0.5) * dt * 6;
      u.v.multiplyScalar(0.97);
      if (u.v.length() > 0.9) u.v.setLength(0.9);
      u.n.addScaledVector(u.v, dt);
      const rr = Math.hypot(u.n.x, u.n.z);
      if (rr > 1) { u.n.x /= rr; u.n.z /= rr; u.v.x *= -1; u.v.z *= -1; }
      if (u.n.y < 0) { u.n.y = 0; u.v.y = Math.abs(u.v.y); }
      if (u.n.y > 1) { u.n.y = 1; u.v.y = -Math.abs(u.v.y); }
      const world = u.where === 'jar' ? jarRegion(u.n, tmpV) : syrRegion(u.n, tmpV);
      if (u.fly > 0) {
        u.fly = Math.max(0, u.fly - dt * 1.6);
        syrAir.localToWorld(tipWorld.set(0, 0.12, 0));
        world.lerpVectors(world, tipWorld, u.fly);
      }
      gasLab.worldToLocal(world);
      p.position.copy(world);
      if (u.where === 'jar') { p.scale.setScalar(0.42); p.material.opacity = 0.32; } else { p.scale.setScalar(0.26); p.material.opacity = Math.min(0.75, 0.38 * dens); }
    }
    const w = syrWater.userData.water;
    const top = syrWater.userData.plunger.position.y - 0.04;
    w.scale.y = top - 0.3;
    w.position.y = 0.3 + (top - 0.3) / 2;
  });

  function pour(src, dst, done) {
    const sv = src.userData.vessel;
    const dv = dst.userData.vessel;
    const mouthY = dst.position.y + (dv.sh.floor + dv.sh.depth) * dst.scale.y;
    const theta = 1.35;
    const lip = sv.lip.position.clone().multiplyScalar(src.scale.x);
    const rot = new THREE.Vector3(lip.x * Math.cos(theta) + lip.y * Math.sin(theta), -lip.x * Math.sin(theta) + lip.y * Math.cos(theta), 0);
    const want = new THREE.Vector3(dst.position.x - 0.08, mouthY + 0.4, dst.position.z);
    const at = want.clone().sub(rot);
    const from = src.position.clone();
    const homeRot = src.rotation.z;
    const total = sv.vol;
    const lipW = new THREE.Vector3();
    const surf = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    animate(0.7, (k) => {
      const e = ease(k);
      src.position.lerpVectors(from, at, e);
      src.position.y = from.y + (at.y - from.y) * e + Math.sin(e * Math.PI) * 0.3;
      src.rotation.z = homeRot - theta * e;
    }, () => {
      stream.visible = true;
      animate(1.5, (k) => {
        setVol(src, total * (1 - k));
        setVol(dst, dv.vol + (total * k - (dv._gain || 0)));
        dv._gain = total * k;
        src.updateMatrixWorld();
        sv.lip.getWorldPosition(lipW);
        surf.set(dst.position.x, dst.position.y + (dv.sh.floor + dv.h) * dst.scale.y, dst.position.z);
        const d = surf.clone().sub(lipW);
        stream.position.copy(lipW).addScaledVector(d, 0.5);
        stream.scale.set(1, Math.max(0.01, d.length()), 1);
        stream.quaternion.setFromUnitVectors(up, d.clone().normalize().negate());
      }, () => {
        stream.visible = false;
        dv._gain = 0;
        setVol(src, 0);
        animate(0.6, (k) => {
          const e = ease(k);
          src.position.lerpVectors(at, src.userData.home, e);
          src.rotation.z = homeRot - theta * (1 - e);
        }, () => { src.position.copy(src.userData.home); src.rotation.z = homeRot; if (done) done(); });
      });
    });
  }

  function hop(obj, to, dur, done, height = 1.0) {
    const from = obj.position.clone();
    animate(dur, (k) => {
      obj.position.lerpVectors(from, to, ease(k));
      obj.position.y = from.y + (to.y - from.y) * k + Math.sin(k * Math.PI) * height;
    }, done);
  }

  function choiceBox(c, q, items, rightIdx, why, onRight, onWrong) {
    c.innerHTML = `<p class="st-q">${q}</p><div class="choices">${items.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
    c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i !== rightIdx) {
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(why[i] || 'Не е това. Помисли пак.', 'bad');
        if (onWrong) onWrong();
        return;
      }
      b.classList.add('right');
      c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      onRight();
    }));
  }

  function step2() {
    shell.step(1);
    clearTip();
    menu.show(false);
    menuHandler = null;
    tableItems.visible = false;
    lab.visible = true;
    let mistakes = 0;
    const LIST = ['Прелей водата в чашата, купата и бутилката', 'Сложи камъка във всеки съд', 'Натисни буталата на спринцовките'];
    let exp = 0;
    const drawList = (extra = '') => {
      shell.task(`<ol class="st-list">${LIST.map((t, i) => `<li class="${i < exp ? 'done' : i === exp ? 'cur' : ''}">${t}</li>`).join('')}</ol>${extra}`);
      shell.score(`Опит ${Math.min(exp + 1, 3)} от 3 · грешки: ${mistakes}`);
    };
    const wrong = () => { mistakes++; shell.score(`Опит ${exp + 1} от 3 · грешки: ${mistakes}`); };
    stage.stopFollow();
    stage.flyTo([-0.4, 3.6, 6.6], [-0.4, 0.7, 0.4]);

    // Опит 1: една и съща вода в различни съдове.
    let holder = jug;
    const filled = new Set();
    let busy = false;
    drawList('<p>В каната има вода. <b>Кликни върху съд</b>, за да прелееш водата в него. Опитай и трите съда.</p>');
    shell.setControls('');
    const pourMsgs = {
      glass: 'Водата взе формата на <b>чашата</b>.',
      bowl: 'Сега водата е ниска и широка — като <b>купата</b>.',
      bottle: 'Водата влезе дори в тясното гърло на <b>бутилката</b>!',
    };
    clickHandler = (id) => {
      if (busy || !id || !id.startsWith('v-')) return;
      const k = id.slice(2);
      const v = vessels[k];
      if (v === holder) { shell.msg(`Водата вече е в ${VNAME[k]}. Избери друг съд.`, ''); return; }
      busy = true;
      clearTip();
      shell.msg('');
      pour(holder, v, () => {
        busy = false;
        holder = v;
        filled.add(k);
        say(v, `${pourMsgs[k]}<br><span class="small">Водата е същата — нищо не сме добавили.</span>`, 'good', v.userData.vessel.sh.depth + 0.75);
        if (filled.size === 3) question1();
      });
    };
    function question1() {
      clickHandler = null;
      const c = shell.setControls('');
      choiceBox(c, 'Какво се промени, когато преливахме водата?', [
        'Водата стана повече в бутилката, защото там стига по-високо.',
        'Нищо не се промени.',
        'Промени се само формата ѝ. Водата остана толкова, колкото беше.',
      ], 2, {
        0: 'Там стига по-високо, защото бутилката е тясна. Но налехме същата вода — нищо не добавихме.',
        1: 'Погледни пак — в купата и в бутилката водата изглежда различно.',
      }, () => {
        shell.msg('Вярно! Течността тече и приема формата на съда. Но мястото, което заема (обемът ѝ), остава същото.', 'good');
        const n = c.appendChild(document.createElement('div'));
        n.className = 'row';
        n.innerHTML = '<button class="btn primary">Следващ опит →</button>';
        n.querySelector('button').addEventListener('click', exp2);
      }, wrong);
    }

    // Опит 2: камъкът пази формата си.
    function exp2() {
      clearTip();
      shell.msg('');
      exp = 1;
      busy = true;
      // Връщаме водата в каната.
      pour(holder, jug, () => {
        busy = false;
        holder = jug;
        labStone.visible = true;
        labStone.position.copy(labStone.userData.home);
        say(labStone, '<b>Камък</b> — опитай да го сложиш в съдовете.', '', 0.9);
      });
      drawList('<p>Ето един камък. <b>Кликни върху съд</b>, за да сложиш камъка в него. Опитай и трите съда.</p>');
      shell.setControls('');
      const tried = new Set();
      let inside = null;
      clickHandler = (id) => {
        if (busy || !id || !id.startsWith('v-')) return;
        const k = id.slice(2);
        const v = vessels[k];
        if (inside === k) { shell.msg(`Камъкът вече е в ${VNAME[k]}. Избери друг съд.`, ''); return; }
        busy = true;
        clearTip();
        const sh = v.userData.vessel.sh;
        if (k === 'bottle') {
          const mouth = new THREE.Vector3(v.position.x, sh.floor + sh.depth + 0.02, v.position.z);
          hop(labStone, mouth, 0.7, () => {
            // не влиза: залюлява се и пада до бутилката
            const side = new THREE.Vector3(v.position.x + 0.75, 0, v.position.z + 0.45);
            hop(labStone, side, 0.6, () => {
              busy = false;
              inside = null;
              tried.add(k);
              say(v, '<b>Камъкът не влиза в бутилката!</b><br>Той не може да промени формата си, за да мине през тясното гърло.', 'bad', sh.depth + 0.75);
              if (tried.size === 3) question2();
            }, 0.4);
          }, 1.6);
          return;
        }
        const bottom = new THREE.Vector3(v.position.x, sh.floor - 0.12 + (k === 'bowl' ? 0.03 : 0), v.position.z);
        hop(labStone, bottom, 0.9, () => {
          busy = false;
          inside = k;
          tried.add(k);
          say(v, k === 'glass' ? 'Камъкът е в чашата, но <b>формата му е същата</b>.' : 'И в купата камъкът е <b>същият</b> — не се разлива.', 'good', sh.depth + 0.75);
          if (tried.size === 3) question2();
        }, 1.8);
      };
    }
    function question2() {
      clickHandler = null;
      const c = shell.setControls('');
      choiceBox(c, 'Защо водата влезе в бутилката, а камъкът — не?', [
        'Камъкът е твърде тежък.',
        'Водата тече и променя формата си, а камъкът има собствена форма.',
        'Бутилката беше пълна.',
      ], 1, {
        0: 'Не е заради тежестта. Сравни какво стана с формата на водата и с формата на камъка.',
        2: 'Бутилката беше празна — изляхме водата обратно в каната.',
      }, () => {
        shell.msg('Вярно! Твърдото тяло има собствена форма и собствен обем. Не тече.', 'good');
        const n = c.appendChild(document.createElement('div'));
        n.className = 'row';
        n.innerHTML = '<button class="btn primary">Следващ опит →</button>';
        n.querySelector('button').addEventListener('click', exp3);
      }, wrong);
    }

    // Опит 3: газът се свива и запълва целия съд.
    function exp3() {
      clearTip();
      shell.msg('');
      exp = 2;
      lab.visible = false;
      gasLab.visible = true;
      stage.flyTo([0.4, 3.4, 6.2], [0.4, 1.0, 0.4]);
      drawList(`<p>В едната спринцовка има <b>въздух</b>, а в другата — <b>вода</b>. Отдолу са запушени. Въздухът е невидим, затова тук е оцветен.</p>
        <label class="small st-press">Натисни двете бутала <input class="slider press" type="range" min="0" max="100" step="1" value="0"></label>`);
      shell.setControls('');
      const sl = container.querySelector('.press');
      let shown = false;
      const bA = pin(syrAir, 'Въздух', 'tag', 2.35);
      const bW = pin(syrWater, 'Вода', 'tag', 2.35);
      sl.addEventListener('input', () => {
        const k = +sl.value / 100;
        syrAir.userData.plunger.position.y = 1.68 - k * 0.95;
        syrWater.userData.plunger.position.y = 1.68 - Math.min(k, 0.03) * 0.95;
        bA.set(k > 0.3 ? 'Въздухът се свива!' : 'Въздух');
        bW.set(k > 0.1 ? 'Водата не се свива!' : 'Вода');
        if (k > 0.3) bA.el.classList.add('good');
        if (k > 0.1) bW.el.classList.add('bad');
        if (k >= 0.9 && !shown) {
          shown = true;
          shell.msg('Въздухът зае по-малко място, а водата — не.', 'good');
          const c = shell.setControls('<button class="btn primary">Пусни въздуха в буркана →</button>');
          c.querySelector('button').addEventListener('click', () => { c.innerHTML = ''; toJar(); });
        }
      });
      function toJar() {
        clearPins();
        shell.msg('');
        sl.disabled = true;
        // спринцовката отпушва въздуха и се премества над капака
        animate(0.5, (k) => { syrAir.userData.plunger.position.y = 1.68 - 0.95 * (1 - k); }, () => {
          const cap = syrAir.userData.cap;
          syrAir.remove(cap);
          cap.position.set(syrAir.position.x + 0.4, 0.06, syrAir.position.z + 0.5);
          gasLab.add(cap);
          const lidY = jar.position.y + SHAPES.jar.floor + SHAPES.jar.depth + 0.0;
          const up = syrAir.position.clone().setY(lidY + 0.6);
          const over = new THREE.Vector3(jar.position.x, lidY + 0.6, jar.position.z);
          const on = new THREE.Vector3(jar.position.x, lidY - 0.02, jar.position.z);
          const from = syrAir.position.clone();
          animate(0.6, (k) => syrAir.position.lerpVectors(from, up, ease(k)), () => {
            animate(0.8, (k) => syrAir.position.lerpVectors(up, over, ease(k)), () => {
              animate(0.5, (k) => syrAir.position.lerpVectors(over, on, ease(k)), () => {
                syrAir.userData.label.visible = false;
                stage.flyTo([1.4, 4.0, 6.4], [1.6, 1.4, 0.3]);
                sl.value = 0;
                sl.disabled = false;
                sl.parentElement.firstChild.textContent = 'Натисни буталото докрай ';
                shell.msg('Сега натисни буталото докрай.', '');
                const pressIn = () => {
                  const k = +sl.value / 100;
                  syrAir.userData.plunger.position.y = 1.68 - k * 1.33;
                  const want = Math.round(AIR_N * Math.min(1, k * 1.05));
                  let have = airPuffs.filter((p) => p.userData.where === 'jar').length;
                  for (const p of airPuffs) {
                    if (have >= want) break;
                    if (p.userData.where === 'jar') continue;
                    p.userData.where = 'jar';
                    p.userData.n.set((Math.random() - 0.5) * 0.3, 0.95, (Math.random() - 0.5) * 0.3);
                    p.userData.v.set((Math.random() - 0.5) * 2, -1.2, (Math.random() - 0.5) * 2);
                    p.userData.fly = 1;
                    have++;
                  }
                  if (have >= AIR_N && !sl.disabled) {
                    sl.disabled = true;
                    for (const p of airPuffs) p.userData.v.multiplyScalar(1.6);
                    later(2.2, () => {
                      say(jar, 'Оцветеният въздух се разнесе в <b>целия</b> буркан — и горе, и долу.', 'good', 2.4);
                      question3();
                    });
                  }
                };
                sl.addEventListener('input', pressIn);
              });
            });
          });
        });
      }
    }
    function question3() {
      const c = shell.setControls('');
      choiceBox(c, 'Какво направи въздухът в буркана?', [
        'Събра се на дъното, като вода.',
        'Запази формата на спринцовката.',
        'Запълни целия буркан.',
      ], 2, {
        0: 'Погледни пак — оцветеният въздух е и горе, и долу.',
        1: 'Газът няма собствена форма. Виж къде отиде.',
      }, () => {
        shell.msg('Вярно! Газът няма собствена форма и собствен обем. Запълва целия съд и може да се свие.', 'good');
        scores.push(stepScore(mistakes, 3));
        exp = 3;
        drawList('');
        const n = c.appendChild(document.createElement('div'));
        n.className = 'row';
        n.innerHTML = '<button class="btn primary">Напред →</button>';
        n.querySelector('button').addEventListener('click', step3);
      }, wrong);
    }
  }

  // ---------- 3. Подреди ----------
  const sortGroup = new THREE.Group();
  sortGroup.visible = false;
  scene.add(sortGroup);
  const sortRoots = new Map();
  const sortBuilders = {
    's-stone': stoneModel,
    's-pencil': pencilModel,
    's-ice': () => iceModel(false),
    's-sugar': () => { const g = sugarModel(); g.scale.setScalar(0.75); return g; },
    's-milk': () => { const g = makeVessel('glass', { liquid: 0xfafafa, liquidOpacity: 0.95 }); setVol(g, V0 * 0.9); g.scale.setScalar(0.55); return g; },
    's-oil': () => {
      const g = makeVessel('bottle', { liquid: 0xf2c94c, liquidOpacity: 0.85 });
      setVol(g, V0 * 0.85);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 14), mat(0xd32f2f));
      cap.position.y = SHAPES.bottle.floor + SHAPES.bottle.depth + 0.06;
      g.add(cap);
      g.scale.setScalar(0.55);
      return g;
    },
    's-honey': () => { const g = honeyModel(); g.scale.setScalar(0.85); return g; },
    's-air': () => { const g = balloonModel(1.15, 0.62); g.userData.ph = 2; return g; },
    's-steam': () => { const g = steamCloud(); clouds.push(g); return g; },
  };
  const SORT_X = [-4.0, -3.0, -2.0, -1.0, 0, 1.0, 2.0, 3.0, 4.0];
  const sortOrder = ['s-milk', 's-stone', 's-steam', 's-honey', 's-pencil', 's-air', 's-ice', 's-oil', 's-sugar'];
  sortOrder.forEach((id, i) => {
    const o = sortById[id];
    const g = sortBuilders[id]();
    g.position.set(SORT_X[i], 0, -1.3 + (i % 2) * 0.35);
    g.userData.home = g.position.clone();
    g.userData.pickId = id;
    g.userData.dragId = id;
    g.userData.locked = true;
    shadowAll(g);
    sortGroup.add(g);
    if (id === 's-air') balloons.push(g);
    const box = new THREE.Box3().setFromObject(g);
    const lbl = labelSprite(o.label, { size: 0.22 });
    lbl.position.y = (box.max.y - g.position.y) / g.scale.y + 0.22 / g.scale.y;
    lbl.scale.multiplyScalar(1 / g.scale.x);
    g.add(lbl);
    stage.steadyLabel(lbl, 9);
    addHitBox(g, 0.85);
    g.userData.top = (box.max.y - g.position.y) + 0.5;
    sortRoots.set(id, g);
  });
  const zones = {};
  const ZX = { solid: -3.1, liquid: 0, gas: 3.1 };
  for (const k of Object.keys(KIND)) {
    const z = zoneRing(KIND[k].color, 1.3);
    z.position.set(ZX[k], 0.0, 1.55);
    const lbl = labelSprite(KIND[k].name, { size: 0.3, color: '#fff', bg: KIND[k].css, border: KIND[k].css });
    lbl.position.set(0, 0.3, 1.45);
    z.add(lbl);
    z.visible = false;
    scene.add(z);
    zones[k] = { group: z, members: [] };
  }
  let stopDrag = null;
  const moving = new Map();
  stage.tick((dt) => {
    for (const [g, mv] of moving) {
      mv.k = Math.min(1, mv.k + dt / mv.dur);
      const e = 1 - Math.pow(1 - mv.k, 3);
      g.position.lerpVectors(mv.from, mv.to, e);
      g.position.y = mv.to.y + Math.sin(e * Math.PI) * 0.5;
      if (mv.k >= 1) { moving.delete(g); g.position.copy(mv.to); }
    }
  });
  const moveTo = (g, to, dur = 0.5) => moving.set(g, { from: g.position.clone(), to: to.clone(), k: 0, dur });

  function step3() {
    shell.step(2);
    clearTip();
    clearPins();
    gasLab.visible = false;
    lab.visible = false;
    tableItems.visible = false;
    sortGroup.visible = true;
    for (const k of Object.keys(zones)) zones[k].group.visible = true;
    stage.stopFollow();
    stage.flyTo([0, 6.8, 7.4], [0, 0.2, 0.3]);
    shell.task(`<p>Подреди нещата в трите кръга.</p>
      <p><b>Провлачи всяко</b> в кръга, където му е мястото.</p>
      <p class="small">Питай се: тече ли? Има ли собствена форма? Разнася ли се навсякъде? Кликни върху нещо, за да си припомниш.</p>`);
    shell.setControls('');
    let mistakes = 0;
    let placed = 0;
    const upd = () => shell.score(`Подредени: ${placed} от ${SORT.length} · грешки: ${mistakes}`);
    upd();
    for (const g of sortRoots.values()) g.userData.locked = false;
    clickHandler = (id) => {
      const o = sortById[id];
      if (!o) { clearTip(); return; }
      const g = sortRoots.get(id);
      if (g.userData.locked) return;
      say(g, `<b>${esc(o.label)}</b><br>${esc(o.why)}`);
    };
    stopDrag = stage.enableDrag({
      planeY: 0,
      lift: 0.35,
      onStart: () => clearTip(),
      onDrop: (g, p, start) => {
        const id = g.userData.pickId;
        const o = sortById[id];
        let target = null;
        for (const k of Object.keys(zones)) {
          const zp = zones[k].group.position;
          if (Math.hypot(p.x - zp.x, p.z - zp.z) < 1.45) target = k;
        }
        if (!target) { moveTo(g, start, 0.4); return; }
        if (target === o.kind) {
          const zone = zones[target];
          const n = zone.members.length;
          const SL = [[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.45], [0.5, 0.45], [0, 0.05]];
          const [ox, oz] = SL[n % SL.length];
          zone.members.push(id);
          moveTo(g, new THREE.Vector3(zone.group.position.x + ox, 0, zone.group.position.z + oz), 0.35);
          g.userData.locked = true;
          placed++;
          say(g, `✔ <b>${esc(o.label)}</b> — ${kindChip(o.kind)}`, 'good');
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          moveTo(g, start, 0.5);
          say(g, `✘ ${esc(o.why)}`, 'bad');
          shell.msg(mistakes >= 3
            ? 'Подсказка: твърдите тела пазят формата си, течностите текат, а газовете се разнасят и запълват всичко.'
            : `Не е в „${KIND[target].name}“. Помисли: тече ли? Има ли собствена форма?`, 'bad');
        }
        upd();
        if (placed === SORT.length) {
          scores.push(stepScore(mistakes, 4));
          stopDrag();
          stopDrag = null;
          clickHandler = null;
          shell.msg(mistakes ? `Готово! Грешки: ${mistakes}.` : 'Без нито една грешка! 🎉', 'good');
          const ctrl = shell.setControls('<button class="btn primary">Напред →</button>');
          ctrl.querySelector('button').addEventListener('click', step4);
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  const s4 = new THREE.Group();
  s4.visible = false;
  scene.add(s4);
  const perfume = perfumeModel();
  perfume.position.set(-3.9, 0, 0.7);
  shadowAll(perfume);
  s4.add(perfume);
  const pLbl = labelSprite('Парфюм', { size: 0.24 });
  pLbl.position.y = 1.05;
  perfume.add(pLbl);
  stage.steadyLabel(pLbl, 9);
  const catchBowl = makeVessel('bowl', { liquid: 0x64b5f6 });
  catchBowl.position.set(1.4, 0, 0.7);
  const cbFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.06, 24), glassMat());
  cbFoot.position.y = 0.03;
  catchBowl.add(cbFoot);
  s4.add(catchBowl);
  const sieve = sieveModel();
  sieve.position.set(1.4, 0.66 + 0.09 + 0.05, 0.7);
  s4.add(sieve);
  const sLbl = labelSprite('Цедка', { size: 0.24 });
  sLbl.position.set(0, 0.55, 0);
  sieve.add(sLbl);
  stage.steadyLabel(sLbl, 9);
  const jug4 = jugModel(0x64b5f6, 1);
  jug4.position.set(-0.6, 0, 0.9);
  jug4.userData.home = jug4.position.clone();
  s4.add(jug4);
  const ice4 = iceModel(true);
  ice4.position.set(3.3, 0, 1.1);
  s4.add(ice4);
  const perfPuffs = [];
  const ROOM = { x0: -6.5, x1: 6.5, y0: 0.1, y1: 4.5, z0: -4.3, z1: 3.6 };
  for (let i = 0; i < 70; i++) {
    const p = puffSprite(0xf06292, 0.0, 0.55);
    p.visible = false;
    p.userData = { v: new THREE.Vector3(), on: false };
    s4.add(p);
    perfPuffs.push(p);
  }
  const drops = [];
  for (let i = 0; i < 16; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), liquidMat(0x64b5f6, 0.9));
    d.visible = false;
    d.userData = { y: 0, vy: 0 };
    s4.add(d);
    drops.push(d);
  }
  let dripping = false;
  stage.tick((dt, t) => {
    if (!s4.visible) return;
    for (const p of perfPuffs) {
      const u = p.userData;
      if (!u.on) continue;
      u.v.x += (Math.random() - 0.5) * dt * 9;
      u.v.y += (Math.random() - 0.5) * dt * 7;
      u.v.z += (Math.random() - 0.5) * dt * 9;
      u.v.multiplyScalar(0.985);
      if (u.v.length() > 2.2) u.v.setLength(2.2);
      p.position.addScaledVector(u.v, dt);
      for (const [ax, lo, hi] of [['x', ROOM.x0, ROOM.x1], ['y', ROOM.y0, ROOM.y1], ['z', ROOM.z0, ROOM.z1]]) {
        if (p.position[ax] < lo) { p.position[ax] = lo; u.v[ax] = Math.abs(u.v[ax]); }
        if (p.position[ax] > hi) { p.position[ax] = hi; u.v[ax] = -Math.abs(u.v[ax]); }
      }
      p.material.opacity = Math.min(0.3, p.material.opacity + dt * 0.3);
      p.scale.setScalar(0.5 + Math.sin(t + u.v.x) * 0.05);
    }
    if (dripping) {
      for (const d of drops) {
        const u = d.userData;
        if (!d.visible) {
          if (Math.random() < dt * 6) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 0.35;
            d.position.set(sieve.position.x + Math.cos(a) * r, sieve.position.y - 0.5, sieve.position.z + Math.sin(a) * r);
            u.vy = 0;
            d.visible = true;
          }
          continue;
        }
        u.vy -= 9 * dt;
        d.position.y += u.vy * dt;
        const surf = catchBowl.position.y + SHAPES.bowl.floor + catchBowl.userData.vessel.h;
        if (d.position.y < surf) d.visible = false;
      }
    }
  });

  function step4() {
    shell.step(3);
    clearTip();
    sortGroup.visible = false;
    for (const k of Object.keys(zones)) zones[k].group.visible = false;
    s4.visible = true;
    stage.stopFollow();
    stage.flyTo([0, 5.0, 8.4], [0, 0.7, 0]);
    const qs = [
      { id: 'pf', q: 'Мама отваря шишенце парфюм в единия край на кухнята. Какво ще стане?', a: [
        ['stay', 'Ароматът ще остане до шишенцето.'], ['room', 'Ароматът ще се разнесе из цялата кухня.'], ['pour', 'Ароматът ще се разлее по масата като вода.']], right: 'room' },
      { id: 'sw', q: 'Можеш ли да пренесеш вода в цедка?', a: [
        ['slow', 'Да, ако вървя бавно.'], ['ball', 'Да — водата ще стане на топка в цедката.'], ['no', 'Не — водата ще изтече през дупките.']], right: 'no' },
      { id: 'si', q: 'А кубче лед в цедката?', a: [
        ['out', 'Ще изтече през дупките.'], ['stay', 'Ще остане в цедката.'], ['air', 'Ще се разнесе из кухнята.']], right: 'stay' },
    ];
    shell.task(`<p>Помисли и <b>предскажи</b>. После провери на масата.</p>
      ${qs.map((q, i) => `<p class="st-q">${i + 1}. ${esc(q.q)}</p><div class="choices" data-q="${q.id}">${q.a.map(([v, t]) => `<button class="choice" data-v="${v}">${esc(t)}</button>`).join('')}</div>`).join('')}`);
    shell.score('');
    const ans = {};
    const ctrl = shell.setControls('<button class="btn primary" disabled>Провери на масата</button>');
    const check = ctrl.querySelector('button');
    container.querySelectorAll('.xp-task .choices').forEach((box) => {
      box.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        box.querySelectorAll('.choice').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        ans[box.dataset.q] = b.dataset.v;
        check.disabled = Object.keys(ans).length < qs.length;
      }));
    });
    check.addEventListener('click', () => {
      check.remove();
      let good = 0;
      for (const q of qs) {
        if (ans[q.id] === q.right) good++;
        const box = container.querySelector(`.xp-task .choices[data-q="${q.id}"]`);
        box.querySelectorAll('.choice').forEach((b) => {
          b.disabled = true;
          if (b.dataset.v === q.right) b.classList.add('right');
          else if (b.classList.contains('on')) b.classList.add('wrong');
        });
      }
      simulate(good, qs.length);
    });
  }

  function simulate(good, total) {
    shell.msg('Гледай масата…', '');
    // 1) парфюмът
    const cap = perfume.userData.cap;
    animate(0.6, (k) => { cap.position.set(0.25 * k, 0.66 + Math.sin(k * Math.PI) * 0.3 - 0.58 * k, 0.1 * k); cap.rotation.z = -1.5 * k; }, () => {
      perfume.updateMatrixWorld();
      const mouth = perfume.localToWorld(new THREE.Vector3(0, 0.62, 0));
      s4.worldToLocal(mouth);
      perfPuffs.forEach((p, i) => {
        later(i * 0.035, () => {
          p.position.copy(mouth);
          p.userData.v.set((Math.random() - 0.3) * 1.2, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 1.2);
          p.material.opacity = 0;
          p.visible = true;
          p.userData.on = true;
        });
      });
      say(perfume, 'Частички от аромата излизат от шишенцето…', 'wide', 1.3);
      later(4.2, () => {
        clearTip();
        pin(vase, '🌸 <b>Мирише на парфюм и тук!</b><br>Ароматът е газ — разнесе се из цялата кухня.', 'wide good', 2.0);
        later(1.4, sieveWater);
      });
    });
    // 2) вода в цедката
    function sieveWater() {
      stage.flyTo([1.6, 3.6, 6.0], [1.6, 0.8, 0.6]);
      const theta = 1.25;
      const lip = jug4.userData.vessel.lip.position.clone();
      const rot = new THREE.Vector3(lip.x * Math.cos(theta) + lip.y * Math.sin(theta), -lip.x * Math.sin(theta) + lip.y * Math.cos(theta), 0);
      const want = new THREE.Vector3(sieve.position.x - 0.15, sieve.position.y + 0.55, sieve.position.z);
      const at = want.clone().sub(rot);
      const from = jug4.position.clone();
      const lipW = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      animate(0.8, (k) => { const e = ease(k); jug4.position.lerpVectors(from, at, e); jug4.rotation.z = -theta * e; }, () => {
        stream.visible = true;
        dripping = true;
        const total = jug4.userData.vessel.vol;
        animate(2.2, (k) => {
          setVol(jug4, total * (1 - k));
          setVol(catchBowl, total * Math.max(0, k - 0.1));
          jug4.updateMatrixWorld();
          jug4.userData.vessel.lip.getWorldPosition(lipW);
          const end = new THREE.Vector3(sieve.position.x, sieve.position.y - 0.45, sieve.position.z);
          const d = end.clone().sub(lipW);
          stream.position.copy(lipW).addScaledVector(d, 0.5);
          stream.scale.set(1, d.length(), 1);
          stream.quaternion.setFromUnitVectors(up, d.clone().normalize().negate());
        }, () => {
          stream.visible = false;
          animate(0.7, (k) => { const e = ease(k); jug4.position.lerpVectors(at, from, e); jug4.rotation.z = -theta * (1 - e); }, () => {
            later(0.6, () => { dripping = false; setVol(catchBowl, total); });
          });
          say(catchBowl, '💧 <b>Водата изтече през дупките</b> в купата. Течността тече и минава навсякъде, където има път.', 'wide bad', 1.5);
          later(2.6, sieveIce);
        });
      });
    }
    // 3) лед в цедката
    function sieveIce() {
      const cube = ice4.userData.cube;
      ice4.updateMatrixWorld();
      const start = cube.getWorldPosition(new THREE.Vector3());
      ice4.remove(cube);
      s4.add(cube);
      cube.position.copy(start);
      const to = new THREE.Vector3(sieve.position.x + 0.05, sieve.position.y - 0.42, sieve.position.z);
      animate(1.0, (k) => {
        cube.position.lerpVectors(start, to, ease(k));
        cube.position.y = start.y + (to.y - start.y) * k + Math.sin(k * Math.PI) * 1.0;
        cube.rotation.x = k * 2;
      }, () => {
        clearTip();
        say(sieve, '🧊 <b>Ледът остана в цедката.</b> Твърдото тяло пази формата си и не минава през дупките.', 'wide good', 1.1);
        shell.msg(good === total ? 'Позна и трите! 🎉' : `Позна ${good} от ${total}.`, good === total ? 'good' : 'bad');
        scores.push(good / total);
        const ctrl = shell.setControls('<button class="btn primary">Виж резултата</button>');
        ctrl.querySelector('button').addEventListener('click', () => {
          clearTip();
          clearPins();
          const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
          shell.finish(ratio, onComplete, restart);
        });
      });
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
