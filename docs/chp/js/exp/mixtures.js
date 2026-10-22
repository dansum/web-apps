// 5.2.2 „Разделяне на смеси“ — 3D училищна химическа лаборатория.
// Стъпки: опознай уредите и правилата → раздели смесите → кой метод? → трудна смес и смесите около нас.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;

// ---------- уреди ----------
const TOOLS = {
  sieve: { label: 'Сито', icon: '🥣', method: 'Пресяване', h: 0.9,
    note: '<b>Пресяване.</b> Едрите частици остават върху мрежата на ситото, а дребните минават през дупките.' },
  settle: { label: 'Чаша за утаяване', icon: '🥛', method: 'Утаяване', h: 1.3,
    note: '<b>Утаяване.</b> Сместа престоява и тежките неразтворени частици падат на дъното. После бистрата течност се отлива внимателно.' },
  filter: { label: 'Фуния с филтър', icon: '🧪', method: 'Филтруване', h: 1.85,
    note: '<b>Филтруване.</b> Филтърната хартия задържа неразтворените частици, а течността минава през нея.' },
  evap: { label: 'Порцеланово блюдо', icon: '🍶', method: 'Изпаряване', h: 1.35,
    note: '<b>Изпаряване.</b> Блюдото е върху триножник над спиртна лампа. Водата се изпарява, а разтвореното вещество остава в блюдото. Горещото блюдо се хваща само с щипка.' },
  magnet: { label: 'Магнит', icon: '🧲', method: 'С магнит', h: 1.75,
    note: '<b>Магнит.</b> Привлича желязото и го отделя от вещества, които магнитът не привлича: пясък, дърво, сол.' },
};
const TOOL_IDS = ['sieve', 'settle', 'filter', 'evap', 'magnet'];
const EXTRA = {
  goggles: { label: 'Предпазни очила', icon: '🥽',
    note: '<b>Предпазни очила.</b> Пазят очите от пръски и горещи капки. Слагаме ги преди всеки опит.' },
  lamp: { label: 'Спиртна лампа', icon: '🔥',
    note: '<b>Спиртна лампа.</b> Пали се само с разрешение на учителя. Не я накланяй, не я оставяй без надзор и я гаси <b>с капачката</b> — никога с духане!' },
};

// ---------- смеси ----------
// jar: как изглежда в бурканчето; vis: как се разделя с най-подходящия уред.
const SAND = 0xd9b77a;
const MIX2 = [
  { id: 'peas', short: 'Грах и брашно', name: 'Грах и брашно', best: 'sieve', dry: true,
    look: 'Едри зелени зърна, смесени със ситен бял прах.',
    jar: { grains: [{ color: 0x7cb342, r: 0.05, n: 14 }, { color: 0xf3ecdc, r: 0.02, n: 90 }] },
    vis: { big: { color: 0x7cb342, r: 0.055, n: 26 }, small: { color: 0xf3ecdc, r: 0.02, n: 160 } },
    noMag: 'граха и брашното', result: 'Грахът остана в ситото, брашното мина в купата.', proto: 'грах — в ситото, брашно — в купата',
    hint: 'Частиците тук са с много различна големина.' },
  { id: 'sandw', short: 'Пясък и вода', name: 'Пясък и вода', best: 'filter', liquid: true,
    look: 'Песъчинките не се разтварят — плуват мътни във водата и падат на дъното.',
    jar: { liquid: 0xa9c7cf, grains: [{ color: SAND, r: 0.022, n: 70, bottom: true }] },
    vis: { mix: 0xb5b08e, solid: SAND, filtrate: 0xcfe9f7 },
    alt: { settle: 'Става — пясъкът ще се утаи. Но водата над него остава мътна и трябва да чакаш. Има по-бърз и по-чист начин.' },
    noMag: 'пясъка и водата', result: 'Пясъкът остана върху филтъра, бистрата вода мина в чашата.', proto: 'пясък — на филтъра, вода — в чашата',
    hint: 'Пясъкът не се разтваря. Коя хартия пропуска водата, но не и песъчинките?' },
  { id: 'saltw', short: 'Сол и вода', name: 'Сол и вода (разтвор)', best: 'evap', liquid: true, dissolved: true,
    look: 'Бистра течност. Солта се е разтворила и не се вижда — но водата е солена.',
    jar: { liquid: 0xd4ecf7 },
    vis: { liquid: 0xd4ecf7, residue: 0xffffff },
    noMag: 'солта и водата', result: 'Водата се изпари, в блюдото останаха кристалчета сол.', proto: 'водата се изпари, сол — в блюдото',
    hint: 'Солта е разтворена. Как да махнем водата, а солта да остане?' },
  { id: 'iron', short: 'Стърготини и пясък', name: 'Железни стърготини и пясък', best: 'magnet', dry: true, hasIron: true, sameSize: true,
    look: 'Сиви железни стърготини, смесени с пясък. Частиците са почти еднакво дребни.',
    jar: { grains: [{ color: 0x3d4248, r: 0.02, n: 60 }, { color: SAND, r: 0.02, n: 60 }] },
    vis: { iron: { color: 0x3d4248, shape: 'filing', n: 70 }, other: { color: SAND, shape: 'grain', n: 90 } },
    result: 'Стърготините полепнаха по магнита, пясъкът остана в паничката.', proto: 'желязо — на магнита, пясък — в паничката',
    hint: 'Едното вещество е метал — желязо.' },
  { id: 'mud', short: 'Кал', name: 'Кал (пръст и вода)', best: 'settle', liquid: true,
    look: 'Мътна кафява вода с много ситни частици пръст.',
    jar: { liquid: 0x8a6a45 },
    vis: { mode: 'sediment', murky: 0x8a6a45, clear: 0xc9dde0, solid: 0x6a4a30 },
    alt: { filter: 'Става, но ситната кал бързо запушва филтъра. Има по-лесен начин — без никакви уреди, само с малко търпение.' },
    noMag: 'пръстта и водата', result: 'Пръстта се утаи на дъното, а водата отгоре се избистри.', proto: 'пръст — на дъното, бистра вода — отгоре',
    hint: 'Ако оставиш сместа на спокойствие, тежките частици ще паднат надолу.' },
];
const MIX3 = [
  { id: 'oil', short: 'Олио и вода', name: 'Олио и вода', best: 'settle', liquid: true, layers: true,
    look: 'Олиото не се смесва с водата — разклатено, то прави мътни капчици.',
    jar: { liquid: 0xe6d48a },
    vis: { mode: 'layers', water: 0xcfe6f2, oil: 0xf2c94c },
    noMag: 'олиото и водата', result: 'Олиото е по-леко от водата и изплува отгоре. После се отделя внимателно.',
    hint: 'Олиото и водата не се смесват. Какво става, ако ги оставиш да престоят?' },
  { id: 'sea', short: 'Морска вода', name: 'Морска вода', best: 'evap', liquid: true, dissolved: true,
    look: 'Бистра и солена. В нея има разтворена сол.',
    jar: { liquid: 0xbfe3ef },
    vis: { liquid: 0xbfe3ef, residue: 0xf7f7f2 },
    noMag: 'солта и водата', result: 'Водата се изпари, остана морска сол.',
    hint: 'Солта е разтворена — не се вижда.' },
  { id: 'gravel', short: 'Чакъл и пясък', name: 'Чакъл и пясък', best: 'sieve', dry: true,
    look: 'Едри камъчета, смесени с ситен пясък.',
    jar: { grains: [{ color: 0x8f949a, r: 0.055, n: 12 }, { color: SAND, r: 0.02, n: 80 }] },
    vis: { big: { color: 0x8f949a, r: 0.065, n: 20, stone: true }, small: { color: SAND, r: 0.02, n: 150 } },
    noMag: 'камъчетата и пясъка', result: 'Чакълът остана в ситото, пясъкът мина в купата.',
    hint: 'Частиците са с много различна големина.' },
  { id: 'nails', short: 'Пирони и стърготини', name: 'Пирони и дървени стърготини', best: 'magnet', dry: true, hasIron: true, bothBig: true,
    look: 'Малки железни пирони, смесени с дървени стърготини.',
    jar: { grains: [{ color: 0x7b8086, r: 0.03, n: 14 }, { color: 0xd8b07a, r: 0.035, n: 30 }] },
    vis: { iron: { color: 0x7b8086, shape: 'nail', n: 16 }, other: { color: 0xd8b07a, shape: 'flake', n: 45 } },
    result: 'Магнитът вдигна пироните, стърготините от дърво останаха.',
    hint: 'Пироните са от желязо.' },
  { id: 'chalk', short: 'Тебешир и вода', name: 'Тебешир на прах и вода', best: 'filter', liquid: true,
    look: 'Бяла мътна течност. Тебеширът не се разтваря във вода.',
    jar: { liquid: 0xe8ecef },
    vis: { mix: 0xe3e6e8, solid: 0xf4f4f0, filtrate: 0xd6eef8 },
    alt: { settle: 'Става, но тебеширът е много ситен и се утаява бавно — водата дълго остава мътна. Има по-бърз начин.' },
    noMag: 'тебешира и водата', result: 'Тебеширът остана върху филтъра, а бистрата вода мина в чашата.',
    hint: 'Тебеширът не се разтваря. Коя хартия задържа ситни частици?' },
];
const BY_MIX = Object.fromEntries([...MIX2, ...MIX3].map((m) => [m.id, m]));

// Защо уредът не става за тази смес (null = става).
function whyNot(m, t) {
  if (t === m.best) return null;
  if (m.alt && m.alt[t]) return null;
  if (t === 'magnet') return `В тази смес няма желязо. Магнитът не привлича ${m.noMag}.`;
  if (t === 'evap') {
    if (!m.liquid) return 'Тази смес е суха — тук няма вода, която да се изпари.';
    if (m.layers) return 'Олиото не се изпарява като водата. Ще стане лепкава горяща каша — така не се разделя.';
    return 'Водата ще се изпари, но така я губим, а и е бавно. Частиците тук не са разтворени — може да ги задържиш по друг начин.';
  }
  if (t === 'filter') {
    if (!m.liquid) return 'Сместа е суха — филтърът ще задържи и двете вещества заедно.';
    if (m.dissolved) return 'Солта е разтворена — частиците ѝ са толкова малки, че минават през филтъра заедно с водата.';
    if (m.layers) return 'Олиото е течност — минава през филтъра заедно с водата.';
  }
  if (t === 'settle') {
    if (!m.liquid) return 'Утаяването става в течност, а тази смес е суха.';
    if (m.dissolved) return 'Солта е разтворена — колкото и да чакаш, тя няма да се утаи.';
  }
  if (t === 'sieve') {
    if (m.liquid) return 'Течността минава през дупките на ситото заедно с дребните частици.';
    if (m.sameSize) return 'Стърготините и песъчинките са почти еднакво дребни — минават заедно през дупките.';
    if (m.bothBig) return 'И пироните, и стърготините са по-едри от дупките — остават заедно в ситото.';
  }
  return 'Този уред не разделя тази смес.';
}

// ---------- стил (само за този модул) ----------
function injectStyle() {
  if (document.getElementById('mixtures-style')) return;
  const s = document.createElement('style');
  s.id = 'mixtures-style';
  s.textContent = `
  .mixtures-goggles { position:absolute; inset:0; pointer-events:none; border-radius:10px; opacity:0; transition:opacity .8s; z-index:2;
    box-shadow: inset 0 0 0 5px rgba(30,110,190,.55), inset 0 0 46px rgba(90,170,255,.32); }
  .mixtures-goggles.on { opacity:1; }
  .mixtures-goggles span { position:absolute; right:10px; bottom:8px; font-size:.75rem; font-weight:800; color:#1a5f9e; background:rgba(255,255,255,.85); padding:2px 8px; border-radius:99px; }
  .mixtures-proto { width:100%; border-collapse:collapse; font-size:.78rem; margin-top:6px; }
  .mixtures-proto caption { text-align:left; font-weight:800; font-size:.8rem; margin-bottom:3px; }
  .mixtures-proto th, .mixtures-proto td { border:1px solid #dfe5ee; padding:3px 5px; text-align:left; vertical-align:top; }
  .mixtures-proto th { background:#f1f5fb; }
  .mixtures-proto tr.done td { background:#effaf3; }
  .mixtures-rules { display:grid; gap:6px; margin-top:6px; }
  .mixtures-rules .choice { padding:7px 10px; font-size:.9rem; }
  .mixtures-rules .choice .box { width:1.1em; height:1.1em; border:2px solid #9aa9bb; border-radius:4px; flex:none; display:inline-flex; align-items:center; justify-content:center; font-size:.8rem; }
  .mixtures-rules .choice.on .box { background:#1865f2; border-color:#1865f2; color:#fff; }
  .mixtures-seq { display:grid; gap:5px; margin:6px 0; counter-reset: mxs; }
  .mixtures-slot { border:2px dashed #c7d3e0; border-radius:8px; padding:5px 8px; min-height:1.5em; font-weight:700; background:#fff; cursor:pointer; display:flex; gap:6px; }
  .mixtures-slot::before { counter-increment: mxs; content: counter(mxs) "."; color:#7a8899; }
  .mixtures-slot.full { border-style:solid; border-color:#9cbcf7; background:#f0f5ff; }
  .mixtures-slot.right { border-color:#1fab54; background:#e9f8ef; }
  .mixtures-slot.wrong { border-color:#d92916; background:#fdeceb; }
  .mixtures-text p { margin:6px 0 2px; }
  .mixtures-blank { display:inline-block; min-width:4.5em; border-bottom:2px solid #1865f2; text-align:center; font-weight:800; color:#1865f2; }
  .mixtures-blank.right { border-color:#1fab54; color:#0d7a3a; }
  .mixtures-opts { display:flex; flex-wrap:wrap; gap:5px; margin:3px 0 6px; }
  .mixtures-opt { font:inherit; font-size:.85rem; padding:3px 10px; border-radius:999px; border:2px solid #c9dcff; background:#eef4ff; cursor:pointer; font-weight:700; }
  .mixtures-opt.right { background:#e9f8ef; border-color:#1fab54; }
  .mixtures-opt.wrong { background:#fdeceb; border-color:#d92916; text-decoration:line-through; }
  .mixtures-opt:disabled { cursor:default; }
  `;
  document.head.appendChild(s);
}

// ---------- помощни модели ----------
function glassMat(opacity = 0.26) {
  return new THREE.MeshStandardMaterial({ color: 0xe6f4ff, transparent: true, opacity, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
}
function liquidMat(color, opacity = 0.82) {
  return new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.2, depthWrite: false });
}
function lathe(pts, m, seg = 32) {
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), m);
}
function stick(a, b, r, m) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), m);
  setStick(mesh, a, b);
  return mesh;
}
function setStick(mesh, a, b) {
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(1, Math.max(0.001, a.distanceTo(b)), 1);
  mesh.quaternion.setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize());
}
// Цилиндър с основа в y = 0 (за течности и утайки, които растат нагоре).
function baseCyl(r, color, opacity) {
  const geo = new THREE.CylinderGeometry(r, r, 1, 32);
  geo.translate(0, 0.5, 0);
  const m = new THREE.Mesh(geo, opacity ? liquidMat(color, opacity) : mat(color));
  m.scale.y = 0.001;
  return m;
}
// Конус с връх в y = 0, отворен нагоре (за течност и утайка във фунията).
function upCone(color, opacity) {
  const geo = new THREE.ConeGeometry(1, 1, 28);
  geo.rotateX(Math.PI);
  geo.translate(0, 0.5, 0);
  const m = new THREE.Mesh(geo, opacity ? liquidMat(color, opacity) : mat(color));
  m.scale.setScalar(0.001);
  return m;
}
function gridTexture({ size = 128, cells = 16, line = 'rgba(70,75,85,1)', bg = 'rgba(0,0,0,0)', lw = 2 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, size, size);
  x.strokeStyle = line; x.lineWidth = lw;
  for (let i = 0; i <= cells; i++) {
    const p = (i / cells) * size;
    x.beginPath(); x.moveTo(p, 0); x.lineTo(p, size); x.stroke();
    x.beginPath(); x.moveTo(0, p); x.lineTo(size, p); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function puffTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Множество зрънца (InstancedMesh) с проста гравитация.
const GRAIN_GEO = {
  sphere: new THREE.IcosahedronGeometry(1, 0),
  box: new THREE.BoxGeometry(1, 1, 1),
};
function makeGrains(parent, max, geo = GRAIN_GEO.sphere) {
  const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true }), max);
  m.count = 0;
  m.frustumCulled = false;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  parent.add(m);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const G = {
    mesh: m, items: [], off: new V3(),
    spawn(list) {
      G.items = list.slice(0, max);
      m.count = G.items.length;
      G.items.forEach((it, i) => {
        col.set(it.color);
        const j = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        col.offsetHSL(0, 0, j * 0.07);
        m.setColorAt(i, col);
      });
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      G.sync();
    },
    step(dt) {
      for (const it of G.items) {
        if (it.delay > 0) { it.delay -= dt; continue; }
        if (it.follow) { it.follow(it, dt); continue; }
        it.v.y -= 9.8 * dt;
        it.p.addScaledVector(it.v, dt);
        const f = typeof it.floor === 'function' ? it.floor(it) : it.floor;
        if (it.p.y < f) { it.p.y = f; it.v.set(0, 0, 0); }
      }
      G.sync();
    },
    sync() {
      G.items.forEach((it, i) => {
        dummy.position.copy(it.p);
        if (it.shake) dummy.position.add(G.off);
        const s = it.delay > 0 ? 0.0001 : it.s * (it.k === undefined ? 1 : it.k);
        if (it.dims) dummy.scale.set(it.dims[0] * s, it.dims[1] * s, it.dims[2] * s);
        else dummy.scale.setScalar(Math.max(0.0001, s));
        dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    },
    clear() { G.items = []; m.count = 0; },
  };
  return G;
}

// Бурканче със смес.
function jarModel(mix) {
  const g = new THREE.Group();
  const r = 0.21; const h = 0.44;
  const glass = lathe([[0, 0], [r, 0], [r, h], [r + 0.02, h + 0.02]], glassMat(0.3));
  glass.renderOrder = 3;
  g.add(glass);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.012, 6, 28), glassMat(0.5));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h;
  g.add(rim);
  const content = new THREE.Group();
  g.add(content);
  if (mix.jar.liquid) {
    const liq = baseCyl(r - 0.015, mix.jar.liquid, 0.8);
    liq.scale.y = 0.3;
    liq.position.y = 0.01;
    liq.renderOrder = 2;
    content.add(liq);
    g.userData.liquid = liq;
  }
  if (mix.jar.grains) {
    const all = [];
    for (const gr of mix.jar.grains) {
      for (let i = 0; i < gr.n; i++) {
        const a = Math.random() * Math.PI * 2;
        const rr = Math.sqrt(Math.random()) * (r - 0.04);
        const y = gr.bottom ? 0.02 + Math.random() * 0.05 : 0.02 + Math.random() * (mix.dry ? 0.2 : 0.25);
        all.push({ p: new V3(Math.cos(a) * rr, y, Math.sin(a) * rr), v: new V3(), s: gr.r, color: gr.color, rx: a, ry: a * 2 });
      }
    }
    const G = makeGrains(content, all.length);
    G.spawn(all);
    g.userData.grains = G;
  }
  const lbl = labelSprite(mix.short, { size: 0.2 });
  lbl.position.y = h + 0.24;
  g.add(lbl);
  g.userData.label = lbl;
  const lip = new THREE.Object3D();
  lip.position.set(r + 0.02, h + 0.02, 0);
  g.add(lip);
  g.userData.lip = lip;
  g.userData.content = content;
  g.userData.top = h + 0.45;
  addHitBox(g, 0.7);
  return g;
}

function disposeTree(o) {
  o.traverse((x) => {
    if (x.geometry && !Object.values(GRAIN_GEO).includes(x.geometry)) x.geometry.dispose();
    if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
  });
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  injectStyle();
  const STEPS = ['Опознай лабораторията', 'Раздели смесите', 'Кой метод?', 'Трудна смес'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xe9eef3, camPos: [0, 5.2, 9], target: [0, 0.6, 0.2], shadows: true, maxDistance: 20, minDistance: 2,
  });
  const { scene, camera } = stage;
  const narrow = camera.aspect < 1.15;

  // Реално време (а не кадри): анимациите траят еднакво и на бавен компютър.
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

  // Разположение: на тесен екран уредите са на два реда.
  const TPOS = narrow
    ? { sieve: [-1.9, -1.45], filter: [0, -1.55], magnet: [1.9, -1.45], settle: [-1.0, -0.2], evap: [1.0, -0.2] }
    : { sieve: [-4.2, -0.8], settle: [-2.1, -0.8], filter: [0, -0.8], evap: [2.1, -0.8], magnet: [4.2, -0.8] };
  const SLOTS = narrow
    ? [[-2.2, 1.45], [-1.1, 2.15], [0, 1.45], [1.1, 2.15], [2.2, 1.45]]
    : [[-4.0, 1.75], [-2.0, 2.25], [0, 1.75], [2.0, 2.25], [4.0, 1.75]];
  const GOG = narrow ? [-2.6, 0, 0.55] : [-5.7, 0, 0.9];
  const BENCH_W = narrow ? 6.6 : 13.6;

  // ---------- стая ----------
  const bench = new THREE.Mesh(new THREE.BoxGeometry(BENCH_W, 0.3, 5.4), mat(0x37474f, { roughness: 0.6 }));
  bench.position.set(0, -0.15, 0.3);
  bench.receiveShadow = true;
  scene.add(bench);
  const benchEdge = new THREE.Mesh(new THREE.BoxGeometry(BENCH_W + 0.1, 0.08, 0.1), mat(0x263238));
  benchEdge.position.set(0, -0.04, 3.0);
  scene.add(benchEdge);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(BENCH_W - 0.4, 2.6, 5), mat(0xdfe6ec));
  cab.position.set(0, -1.6, 0.3);
  scene.add(cab);
  for (let i = 0; i < (narrow ? 3 : 6); i++) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(BENCH_W / (narrow ? 3 : 6) - 0.25, 2.2, 0.04), mat(0xcfd8e0));
    door.position.set(-BENCH_W / 2 + 0.2 + (i + 0.5) * ((BENCH_W - 0.4) / (narrow ? 3 : 6)), -1.6, 2.82);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0x90a4ae, { metalness: 0.6 }));
    knob.position.set(0, 0.7, 0.04);
    door.add(knob);
    scene.add(door);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat(0xb9c4cc));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.9;
  scene.add(floor);
  // Стена с плочки.
  const tileTex = gridTexture({ size: 256, cells: 4, line: 'rgba(180,192,204,1)', bg: '#f4f7f9', lw: 4 });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(12, 4);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.9 }));
  wall.position.set(0, 3, -2.6);
  scene.add(wall);
  // Прозорец със светъл лъч.
  const win = new THREE.Group();
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshBasicMaterial({ color: 0xcfeaff }));
  win.add(pane);
  const frameM = mat(0xffffff);
  for (const [w, h, x, y] of [[2.8, 0.1, 0, 0.95], [2.8, 0.1, 0, -0.95], [0.1, 2, -1.35, 0], [0.1, 2, 1.35, 0], [0.06, 1.8, 0, 0], [2.6, 0.06, 0, 0.1]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameM);
    f.position.set(x, y, 0.03);
    win.add(f);
  }
  win.position.set(narrow ? -1.2 : -3.2, 3.0, -2.58);
  scene.add(win);
  // Рафт с шишета.
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(narrow ? 3.2 : 4.4, 0.08, 0.5), mat(0x8d6e63));
  shelf.position.set(narrow ? 1.6 : 3.4, 2.7, -2.3);
  scene.add(shelf);
  const bottleCols = [0x8bc34a, 0x42a5f5, 0xffb74d, 0xef5350, 0xab47bc, 0x26a69a];
  for (let i = 0; i < (narrow ? 4 : 6); i++) {
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.45, 14), new THREE.MeshStandardMaterial({ color: bottleCols[i], transparent: true, opacity: 0.75, roughness: 0.2 }));
    body.position.y = 0.225;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 10), glassMat(0.5));
    neck.position.y = 0.52;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 10), mat(0x37474f));
    cap.position.y = 0.62;
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.14), mat(0xffffff));
    tag.position.set(0, 0.22, 0.152);
    b.add(body, neck, cap, tag);
    b.position.set(shelf.position.x - (narrow ? 1.3 : 1.9) + i * 0.72, 2.74, -2.3);
    scene.add(b);
  }
  // Колба с цветна течност и мехурчета (жива сцена).
  const flask = new THREE.Group();
  const fl = lathe([[0, 0], [0.18, 0.02], [0.28, 0.16], [0.27, 0.32], [0.08, 0.5], [0.07, 0.75]], glassMat(0.3));
  fl.renderOrder = 3;
  const fliq = lathe([[0, 0.01], [0.17, 0.03], [0.26, 0.16], [0.25, 0.28], [0, 0.28]], liquidMat(0x7ad9a6, 0.75));
  flask.add(fl, fliq);
  flask.position.set(shelf.position.x + (narrow ? 1.2 : 1.9), 2.74, -2.25);
  scene.add(flask);
  const fbub = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    b.userData.ph = i / 7;
    flask.add(b);
    fbub.push(b);
  }
  // Часовник.
  const clock = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), mat(0xffffff));
  const rimC = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 8, 32), mat(0x37474f));
  clock.add(face, rimC);
  for (let i = 0; i < 12; i++) {
    const tk = new THREE.Mesh(new THREE.BoxGeometry(0.025, i % 3 ? 0.05 : 0.09, 0.01), mat(0x37474f));
    const a = (i / 12) * Math.PI * 2;
    tk.position.set(Math.sin(a) * 0.38, Math.cos(a) * 0.38, 0.01);
    tk.rotation.z = -a;
    clock.add(tk);
  }
  const hand = (len, w, c) => {
    const p = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.01), mat(c));
    m.position.y = len / 2 - 0.04;
    p.add(m);
    p.position.z = 0.02;
    clock.add(p);
    return p;
  };
  const hH = hand(0.22, 0.04, 0x263238); const hM = hand(0.32, 0.03, 0x263238); const hS = hand(0.36, 0.012, 0xd32f2f);
  clock.position.set(narrow ? 0.9 : 0.4, 3.6, -2.57);
  scene.add(clock);
  // Прашинки в лъча светлина.
  const dustN = 70;
  const dustGeo = new THREE.BufferGeometry();
  const dustP = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustP[i * 3] = win.position.x + (Math.random() - 0.5) * 3;
    dustP[i * 3 + 1] = 0.5 + Math.random() * 3;
    dustP[i * 3 + 2] = -2 + Math.random() * 3;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustP, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(dust);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.9, 4, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff8e0, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(win.position.x + 0.6, 1.6, -1.2);
  beam.rotation.x = 0.5;
  scene.add(beam);

  stage.tick((dt, t) => {
    for (const b of fbub) {
      const k = (t * 0.45 + b.userData.ph) % 1;
      b.position.set(Math.sin(b.userData.ph * 20 + t) * 0.08 * (1 - k), 0.05 + k * 0.24, Math.cos(b.userData.ph * 13) * 0.08);
      b.scale.setScalar(0.6 + k);
    }
    const now = new Date();
    hS.rotation.z = -((now.getSeconds() + now.getMilliseconds() / 1000) / 60) * Math.PI * 2;
    hM.rotation.z = -((now.getMinutes() + now.getSeconds() / 60) / 60) * Math.PI * 2;
    hH.rotation.z = -(((now.getHours() % 12) + now.getMinutes() / 60) / 12) * Math.PI * 2;
    const p = dustGeo.attributes.position;
    for (let i = 0; i < dustN; i++) {
      let y = p.getY(i) + dt * 0.05 * (0.5 + (i % 5) * 0.2);
      if (y > 3.6) y = 0.4;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t * 0.3 + i) * dt * 0.04);
    }
    p.needsUpdate = true;
  });

  // ---------- уредите ----------
  const metal = mat(0xb0bec5, { metalness: 0.7, roughness: 0.3 });
  const dark = mat(0x455a64, { metalness: 0.4, roughness: 0.5 });
  const stations = {};
  const tool = (id) => stations[id];
  const toolRoots = [];
  function placeStation(id, g) {
    const [x, z] = TPOS[id];
    g.position.set(x, 0, z);
    g.userData.pickId = id;
    g.userData.toolId = id;
    g.traverse((o) => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
    scene.add(g);
    toolRoots.push(g);
  }
  // Светещ кръг под уреда, когато влачиш смес към него.
  function glowRing(r) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.07, r, 48), new THREE.MeshBasicMaterial({ color: 0x1865f2, transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.015;
    return m;
  }

  // --- сито над купа ---
  {
    const g = new THREE.Group();
    const bowl = lathe([[0, 0], [0.3, 0], [0.45, 0.15], [0.53, 0.44], [0.5, 0.44], [0.42, 0.17], [0.28, 0.04], [0, 0.04]], mat(0x7fb3e0, { side: THREE.DoubleSide, roughness: 0.4 }));
    g.add(bowl);
    const sv = new THREE.Group();
    sv.position.y = 0.55;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.14, 40, 1, true), mat(0xc9d1d8, { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }));
    band.position.y = 0.07;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 40), metal);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.14;
    const meshTex = gridTexture({ size: 128, cells: 22, lw: 1.6 });
    const net = new THREE.Mesh(new THREE.CircleGeometry(0.49, 40), new THREE.MeshStandardMaterial({ map: meshTex, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, metalness: 0.5 }));
    net.rotation.x = -Math.PI / 2;
    net.position.y = 0.01;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), metal);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-0.75, 0.1, 0);
    const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.3, 4, 8), mat(0x8d5a2b));
    grip.rotation.z = Math.PI / 2;
    grip.position.set(-1.1, 0.1, 0);
    sv.add(band, rim, net, handle, grip);
    g.add(sv);
    const big = makeGrains(g, 40);
    const small = makeGrains(g, 170);
    const ring = glowRing(0.7);
    g.add(ring);
    const S = {
      g, ring, mouth: () => g.localToWorld(new V3(0, 0.75, 0)),
      reset() { big.clear(); small.clear(); sv.position.x = 0; big.off.set(0, 0, 0); small.off.set(0, 0, 0); },
      fill(v, src) {
        const lp = g.worldToLocal(src.clone());
        const mk = (spec, i, n, kind) => ({
          p: lp.clone().add(new V3((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.08)),
          v: new V3(0.25 + Math.random() * 0.4, 0.2, (Math.random() - 0.5) * 0.9), s: spec.r * (0.8 + Math.random() * 0.4), color: spec.color,
          delay: (i / n) * 0.9, shake: true, kind, rx: Math.random() * 3, ry: Math.random() * 3,
          floor: (it) => {
            const rr = Math.hypot(it.p.x, it.p.z);
            if (rr > 0.44) { const f = 0.44 / rr; it.p.x *= f; it.p.z *= f; }
            if (it.through) {
              const heap = 0.04 + it.s + S.heap * Math.max(0, 1 - (it.p.x * it.p.x + it.p.z * it.p.z) / 0.14);
              return heap;
            }
            return 0.565 + it.s + (it.kind === 'small' ? 0.02 + Math.random() * 0.004 : 0);
          },
        });
        S.heap = 0;
        big.spawn(Array.from({ length: v.big.n }, (_, i) => mk(v.big, i, v.big.n, 'big')));
        small.spawn(Array.from({ length: v.small.n }, (_, i) => mk(v.small, i, v.small.n, 'small')));
        if (v.big.stone) for (const it of big.items) it.dims = [1.3, 0.8, 1];
      },
      async work() {
        const n = small.items.length;
        await phase(3.2, (k, dt, t) => {
          const amp = k < 0.9 ? 0.04 : 0.04 * (1 - k) * 10;
          sv.position.x = Math.sin(t * 32) * amp;
          big.off.set(sv.position.x, 0, 0);
          small.off.set(sv.position.x, 0, 0);
          const rel = Math.floor(n * Math.min(1, k * 1.25));
          for (let i = 0; i < rel; i++) {
            const it = small.items[i];
            if (!it.through) { it.through = true; it.shake = false; it.p.add(new V3(sv.position.x, 0, 0)); it.v.set(0, -0.3, 0); it.p.y -= 0.03; }
          }
          S.heap = 0.16 * (rel / n);
        });
        sv.position.x = 0; big.off.set(0, 0, 0); small.off.set(0, 0, 0);
      },
      tick(dt) { big.step(dt); small.step(dt); },
    };
    stations.sieve = S;
    placeStation('sieve', g);
  }

  // --- чаша за утаяване (и за разтваряне) ---
  {
    const g = new THREE.Group();
    const R = 0.42; const H = 1.1;
    const glass = lathe([[0, 0], [R, 0], [R, H], [R + 0.05, H + 0.04]], glassMat(0.25));
    glass.renderOrder = 3;
    g.add(glass);
    const marksM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for (let i = 1; i <= 4; i++) {
      const mk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.01), marksM);
      mk.position.set(0, i * 0.2, R + 0.005);
      g.add(mk);
    }
    const liq = baseCyl(R - 0.025, 0xcfe6f2, 0.8);
    liq.position.y = 0.012;
    liq.renderOrder = 2;
    const oil = baseCyl(R - 0.025, 0xf2c94c, 0.8);
    oil.renderOrder = 2;
    oil.visible = false;
    const sed = baseCyl(R - 0.03, 0x6a4a30);
    sed.position.y = 0.01;
    g.add(liq, oil, sed);
    const parts = makeGrains(g, 120);
    const drops = makeGrains(g, 40);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.4, 8), glassMat(0.6));
    rod.visible = false;
    g.add(rod);
    const lip = new THREE.Object3D();
    lip.position.set(R + 0.05, H + 0.04, 0);
    g.add(lip);
    g.userData.lip = lip;
    const ring = glowRing(0.62);
    g.add(ring);
    const S = {
      g, ring, level: 0, mouth: () => g.localToWorld(new V3(0, S.level * 1 + 0.15, 0)),
      reset() {
        liq.scale.y = 0.001; oil.visible = false; oil.scale.y = 0.001; sed.scale.y = 0.001; parts.clear(); drops.clear(); rod.visible = false; S.level = 0;
        g.position.set(TPOS.settle[0], 0, TPOS.settle[1]); g.rotation.set(0, 0, 0);
      },
      setLevel(l, color) { S.level = l; liq.scale.y = Math.max(0.001, l); if (color !== undefined) liq.material.color.set(color); },
      fillTo(k, v) {
        if (v.mode === 'layers') {
          S.setLevel(0.8 * k, v.water);
          liq.material.color.set(v.water).lerp(new THREE.Color(v.oil), 0.45);
          if (k > 0.05 && !drops.items.length) {
            drops.spawn(Array.from({ length: 40 }, () => ({ p: new V3(), v: new V3(), s: 0.03 + Math.random() * 0.02, color: v.oil, follow: () => {} })));
          }
          drops.items.forEach((it, i) => {
            const a = i * 2.4 + k * 4; const rr = 0.05 + ((i * 37) % 30) / 100;
            it.p.set(Math.cos(a) * rr, 0.06 + ((i * 53) % 70) / 100 * S.level, Math.sin(a) * rr);
          });
          return;
        }
        S.setLevel(0.8 * k, v.murky);
        if (k > 0.05 && !parts.items.length) {
          parts.spawn(Array.from({ length: 110 }, (_, i) => ({ p: new V3(), v: new V3(), s: 0.014 + Math.random() * 0.012, color: v.solid, ph: i * 0.37, follow: () => {} })));
        }
        parts.items.forEach((it) => {
          const a = it.ph * 7 + k * 5; const rr = 0.04 + (it.ph % 1) * 0.3;
          it.p.set(Math.cos(a) * rr, 0.05 + ((it.ph * 13) % 1) * S.level * 0.95, Math.sin(a) * rr);
        });
      },
      async work(v) {
        if (v.mode === 'layers') {
          drops.items.forEach((it, i) => { it.y0 = it.p.y; it.d = (i % 10) / 25; });
          oil.visible = true;
          await phase(4.2, (k) => {
            const e = ease(k);
            S.level = 0.8 - 0.22 * e;
            liq.scale.y = S.level;
            liq.material.color.set(v.water).lerp(new THREE.Color(v.oil), 0.45 * (1 - e));
            oil.position.y = 0.012 + S.level;
            oil.scale.y = Math.max(0.001, 0.22 * e);
            drops.items.forEach((it) => {
              const kk = Math.min(1, Math.max(0, (k - it.d) / 0.6));
              it.p.y = lerp(it.y0, S.level + 0.1, ease(kk));
              it.s = kk >= 1 ? 0.0001 : it.s;
            });
            drops.sync();
          });
          drops.clear();
          return;
        }
        parts.items.forEach((it, i) => { it.y0 = it.p.y; it.d = (i % 12) / 24; it.x0 = it.p.x; it.z0 = it.p.z; });
        await phase(4.2, (k) => {
          parts.items.forEach((it) => {
            const kk = Math.min(1, Math.max(0, (k - it.d) / 0.55));
            it.p.y = lerp(it.y0, 0.03 + 0.06 * Math.random() * 0.2 + sed.scale.y, kk * kk);
          });
          parts.sync();
          sed.scale.y = Math.max(0.001, 0.09 * ease(k));
          liq.material.color.set(v.murky).lerp(new THREE.Color(v.clear), ease(Math.min(1, k * 1.15)));
          liq.material.opacity = lerp(0.85, 0.55, k);
        });
        sed.material.color.set(v.solid);
      },
      // Стъпка 4: пясък и сол се сипват във вода; солта се разтваря при разбъркване.
      async dissolve(srcWorld, list) {
        const lp = g.worldToLocal(srcWorld.clone());
        parts.spawn(list.map((c, i) => ({
          p: lp.clone(), v: new V3(0.35 + Math.random() * 0.3, 0.1, (Math.random() - 0.5) * 0.5), s: 0.02 + Math.random() * 0.01, color: c.color, salt: c.salt,
          delay: (i / list.length) * 0.9,
          floor: (it) => {
            const rr = Math.hypot(it.p.x, it.p.z);
            if (rr > 0.34) { const f = 0.34 / rr; it.p.x *= f; it.p.z *= f; }
            if (it.p.y < S.level) it.v.multiplyScalar(0.86);
            return 0.03 + it.s + sed.scale.y;
          },
        })));
        await phase(1.6, (k, dt) => parts.step(dt));
        rod.visible = true;
        await phase(2.6, (k, dt, t) => {
          parts.step(dt);
          rod.position.set(Math.cos(t * 7) * 0.18, 0.75, Math.sin(t * 7) * 0.18);
          rod.rotation.set(Math.sin(t * 7) * 0.15, 0, -Math.cos(t * 7) * 0.15);
          for (const it of parts.items) {
            if (it.salt) it.s = Math.max(0.0001, it.s - dt * 0.012);
            else if (it.p.y < 0.2) it.s = Math.max(0.0001, it.s - dt * 0.004);
          }
          sed.scale.y = Math.max(0.001, 0.06 * k);
          sed.material.color.set(SAND);
          liq.material.color.set(0xcfe6f2).lerp(new THREE.Color(0xd8cba0), 0.35 * Math.sin(k * Math.PI));
        });
        rod.visible = false;
        parts.clear();
      },
      empty(k) { S.setLevel(S.full * (1 - k)); sed.scale.y = Math.max(0.001, S.sed0 * (1 - k)); },
      tick() {},
      parts, liq, sed,
    };
    stations.settle = S;
    placeStation('settle', g);
  }

  // --- фуния с филтърна хартия на статив ---
  {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.7), dark);
    base.position.set(-0.15, 0.025, 0);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 10), metal);
    rod.position.set(-0.55, 1.05, -0.15);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.04), metal);
    arm.position.set(-0.4, 1.42, -0.08);
    arm.rotation.y = -0.4;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 6, 28), metal);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.42;
    g.add(base, rod, arm, ring);
    const funnel = lathe([[0.035, 0.5], [0.05, 1.08], [0.44, 1.62], [0.46, 1.63]], glassMat(0.32));
    funnel.renderOrder = 3;
    g.add(funnel);
    const paper = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.5, 28, 1, true), mat(0xfbfbf6, { side: THREE.DoubleSide, roughness: 1 }));
    paper.rotation.x = Math.PI;
    paper.position.y = 1.36;
    g.add(paper);
    const fl = upCone(0xb5b08e, 0.85);
    fl.position.y = 1.12;
    fl.renderOrder = 2;
    const res = upCone(SAND);
    res.position.y = 1.115;
    g.add(fl, res);
    // приемна чаша
    const rc = new THREE.Group();
    rc.position.set(0, 0.05, 0);
    const rg = lathe([[0, 0], [0.3, 0], [0.3, 0.62], [0.34, 0.65]], glassMat(0.26));
    rg.renderOrder = 3;
    const rl = baseCyl(0.28, 0xcfe9f7, 0.75);
    rl.position.y = 0.01;
    rl.renderOrder = 2;
    rc.add(rg, rl);
    const rlip = new THREE.Object3D();
    rlip.position.set(0.34, 0.65, 0);
    rc.add(rlip);
    rc.userData.lip = rlip;
    g.add(rc);
    const dropM = liquidMat(0xbfe3f5, 0.9);
    const dropsArr = [];
    for (let i = 0; i < 4; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), dropM);
      d.scale.y = 1.4;
      d.visible = false;
      g.add(d);
      dropsArr.push(d);
    }
    const glow = glowRing(0.62);
    g.add(glow);
    const S = {
      g, ring: glow, receiver: rc, rl, mouth: () => g.localToWorld(new V3(0, 1.55, 0)),
      reset() {
        fl.scale.setScalar(0.001); res.scale.setScalar(0.001); rl.scale.y = 0.001; dropsArr.forEach((d) => { d.visible = false; });
        rc.position.set(0, 0.05, 0); rc.rotation.set(0, 0, 0); S.rlev = 0;
      },
      fillTo(k, v) {
        fl.material.color.set(v.mix);
        const f = Math.max(0.001, k);
        fl.scale.set(0.36 * f, 0.45 * f, 0.36 * f);
      },
      async work(v) {
        res.material.color.set(v.solid);
        rl.material.color.set(v.filtrate);
        dropsArr.forEach((d) => { d.visible = true; });
        await phase(4.0, (k, dt, t) => {
          const f = Math.max(0.03, 1 - k);
          fl.scale.set(0.36 * f, 0.45 * f, 0.36 * f);
          fl.material.color.set(v.mix).lerp(new THREE.Color(v.filtrate), k * 0.5);
          const h = 0.2 * ease(Math.min(1, k * 1.4));
          res.scale.set(0.78 * h + 0.001, h + 0.001, 0.78 * h + 0.001);
          S.rlev = 0.34 * k;
          rl.scale.y = Math.max(0.001, S.rlev);
          dropsArr.forEach((d, i) => {
            const c = (t * 2.6 + i / dropsArr.length) % 1;
            const y0 = 0.5; const y1 = 0.07 + S.rlev;
            d.position.set(0, lerp(y0, y1, c * c), 0);
            d.visible = k < 0.97;
          });
        });
        fl.scale.setScalar(0.001);
        dropsArr.forEach((d) => { d.visible = false; });
      },
      tick() {},
    };
    stations.filter = S;
    placeStation('filter', g);
  }

  // --- порцеланово блюдо на триножник и спиртна лампа ---
  let flameOn = 0;
  {
    const g = new THREE.Group();
    const top = 0.95;
    const tripM = mat(0x3b3f45, { metalness: 0.5, roughness: 0.4 });
    const tr = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.022, 6, 28), tripM);
    tr.rotation.x = Math.PI / 2;
    tr.position.y = top;
    g.add(tr);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      g.add(stick(new V3(Math.cos(a) * 0.34, top, Math.sin(a) * 0.34), new V3(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5), 0.022, tripM));
    }
    const gauze = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshStandardMaterial({ map: gridTexture({ size: 128, cells: 18, lw: 1.5, line: 'rgba(60,60,60,1)' }), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, metalness: 0.5 }));
    gauze.rotation.x = -Math.PI / 2;
    gauze.position.y = top + 0.024;
    const cer = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), mat(0xf1efe8));
    cer.rotation.x = -Math.PI / 2;
    cer.position.y = top + 0.026;
    g.add(gauze, cer);
    const dish = lathe([[0, 0], [0.18, 0], [0.3, 0.04], [0.41, 0.15], [0.43, 0.17], [0.4, 0.17], [0.29, 0.065], [0.17, 0.03], [0, 0.03]], mat(0xf8f6f0, { roughness: 0.35, side: THREE.DoubleSide }));
    dish.position.y = top + 0.03;
    g.add(dish);
    const liq = new THREE.Mesh(new THREE.CircleGeometry(1, 32), liquidMat(0xd4ecf7, 0.85));
    liq.rotation.x = -Math.PI / 2;
    liq.visible = false;
    g.add(liq);
    const crystals = makeGrains(g, 70, GRAIN_GEO.box);
    // спиртна лампа
    const lamp = new THREE.Group();
    const lb = lathe([[0, 0], [0.2, 0], [0.24, 0.06], [0.24, 0.2], [0.16, 0.3], [0.08, 0.34], [0.08, 0.4]], glassMat(0.35));
    lb.renderOrder = 3;
    const alc = lathe([[0, 0.01], [0.19, 0.01], [0.225, 0.06], [0.225, 0.17], [0, 0.17]], liquidMat(0xa8d8ff, 0.6));
    alc.renderOrder = 2;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.06, 14), metal);
    neck.position.y = 0.42;
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.08, 8), mat(0xf5f0e1));
    wick.position.y = 0.48;
    lamp.add(lb, alc, neck, wick);
    const cap = lathe([[0.1, 0], [0.105, 0.02], [0.095, 0.1], [0.05, 0.15], [0, 0.16]], glassMat(0.45));
    cap.position.y = 0.4;
    cap.renderOrder = 3;
    lamp.add(cap);
    const flame = new THREE.Group();
    flame.position.y = 0.52;
    const fo = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffa23a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    fo.scale.set(0.055, 0.16, 0.055);
    fo.position.y = 0.12;
    const fi = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0x4f7dff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    fi.scale.set(0.03, 0.07, 0.03);
    fi.position.y = 0.06;
    flame.add(fo, fi);
    flame.scale.setScalar(0.001);
    lamp.add(flame);
    const light = new THREE.PointLight(0xffa040, 0, 3.5, 1.5);
    light.position.y = 0.75;
    lamp.add(light);
    lamp.userData.pickId = 'lamp';
    addHitBox(lamp, 0.55);
    g.add(lamp);
    // пара
    const puffTex = puffTexture();
    const steam = [];
    for (let i = 0; i < 14; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0, depthWrite: false }));
      sp.userData.ph = i / 14;
      g.add(sp);
      steam.push(sp);
    }
    let steamOn = 0;
    const glow = glowRing(0.66);
    g.add(glow);
    const S = {
      g, ring: glow, lamp, mouth: () => g.localToWorld(new V3(0, top + 0.12, 0)),
      reset() { liq.visible = false; crystals.clear(); flameOn = 0; flame.scale.setScalar(0.001); light.intensity = 0; cap.position.set(0, 0.4, 0); cap.rotation.set(0, 0, 0); steamOn = 0; steam.forEach((s) => { s.material.opacity = 0; }); },
      setLevel(l, color) {
        liq.visible = l > 0.01;
        if (color !== undefined) liq.material.color.set(color);
        liq.position.y = top + 0.035 + 0.11 * l;
        const r = 0.18 + 0.2 * l;
        liq.scale.set(r, r, 1);
      },
      fillTo(k, v) { S.setLevel(k, v.liquid); },
      async light() {
        const p0 = cap.position.clone();
        await phase(0.7, (k) => { cap.position.set(lerp(p0.x, 0.32, ease(k)), 0.4 + Math.sin(k * Math.PI) * 0.25, 0); cap.position.y = lerp(0.4, 0.0, ease(k)) + Math.sin(k * Math.PI) * 0.3; cap.rotation.z = -Math.PI * 0.5 * ease(k); });
        await phase(0.4, (k) => { flameOn = k; });
      },
      async extinguish() {
        await phase(0.7, (k) => { cap.position.set(lerp(0.32, 0, ease(k)), lerp(0.0, 0.4, ease(k)) + Math.sin(k * Math.PI) * 0.3, 0); cap.rotation.z = -Math.PI * 0.5 * (1 - ease(k)); flameOn = k > 0.85 ? 0 : 1; });
      },
      async work(v, slow = 1) {
        await S.light();
        crystals.spawn(Array.from({ length: 60 }, (_, i) => {
          const a = i * 2.39; const rr = Math.sqrt((i + 0.5) / 60) * 0.27;
          return { p: new V3(Math.cos(a) * rr, top + 0.045 + rr * rr * 0.5, Math.sin(a) * rr), v: new V3(), s: 0.03 + (i % 4) * 0.006, k: 0, color: v.residue, rx: i, ry: i * 0.7, follow: () => {} };
        }));
        steamOn = 1;
        await phase(4.5 * slow, (k) => {
          S.setLevel(1 - k);
          liq.material.color.set(v.liquid).lerp(new THREE.Color(0xffffff), k * 0.5);
          crystals.items.forEach((it, i) => { it.k = Math.min(1, Math.max(0, (k - 0.25 - (i / 60) * 0.5) / 0.25)); });
          crystals.sync();
        });
        steamOn = 0;
        liq.visible = false;
        await S.extinguish();
      },
      tick(dt, t) {
        const f = flameOn;
        flame.scale.set(f * (1 + Math.sin(t * 23) * 0.06), f * (1 + Math.sin(t * 17) * 0.12 + Math.sin(t * 41) * 0.06), f * (1 + Math.sin(t * 29) * 0.06));
        flame.rotation.z = Math.sin(t * 9) * 0.06 * f;
        light.intensity = f * (2.2 + Math.sin(t * 31) * 0.4);
        steam.forEach((sp) => {
          const c = (t * 0.35 + sp.userData.ph) % 1;
          sp.position.set(Math.sin(sp.userData.ph * 30 + t) * 0.12 * c, top + 0.15 + c * 1.0, Math.cos(sp.userData.ph * 17) * 0.1);
          sp.scale.setScalar(0.12 + c * 0.45);
          const target = steamOn * (1 - c) * 0.55;
          sp.material.opacity += (target - sp.material.opacity) * 0.15;
        });
      },
    };
    stations.evap = S;
    placeStation('evap', g);
  }

  // --- магнит над паничка ---
  {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.05, 32), mat(0xeef3f7, { roughness: 0.3 }));
    plate.position.y = 0.025;
    const prim = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.018, 6, 32), mat(0xdfe7ee));
    prim.rotation.x = Math.PI / 2;
    prim.position.y = 0.055;
    g.add(plate, prim);
    const mg = new THREE.Group();
    const red = mat(0xd8312a, { roughness: 0.4 });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.075, 10, 24, Math.PI), red);
    const legM = [-0.2, 0.2].map((x) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.15), red);
      l.position.set(x, -0.15, 0);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.15), mat(0xd7dde2, { metalness: 0.7, roughness: 0.3 }));
      tip.position.set(x, -0.35, 0);
      mg.add(l, tip);
      return tip;
    });
    mg.add(arc);
    const nL = labelSprite('N', { size: 0.12, color: '#fff', bg: '#d8312a', border: '#d8312a' });
    nL.position.set(-0.2, -0.15, 0.09);
    const sL = labelSprite('S', { size: 0.12, color: '#fff', bg: '#1865f2', border: '#1865f2' });
    sL.position.set(0.2, -0.15, 0.09);
    mg.add(nL, sL);
    const REST = 1.25; const LOW = 0.56;
    mg.position.y = REST;
    g.add(mg);
    const iron = makeGrains(g, 80, GRAIN_GEO.box);
    const other = makeGrains(g, 110);
    const glow = glowRing(0.66);
    g.add(glow);
    let bob = 1;
    const S = {
      g, ring: glow, mg, mouth: () => g.localToWorld(new V3(0, 0.2, 0)),
      reset() { iron.clear(); other.clear(); mg.position.set(0, REST, 0); bob = 1; },
      fill(v, src, extra = []) {
        const lp = g.worldToLocal(src.clone());
        const heapF = (it) => {
          const rr = Math.hypot(it.p.x, it.p.z);
          if (rr > 0.4) { const f = 0.4 / rr; it.p.x *= f; it.p.z *= f; }
          return 0.05 + it.s * 0.6 + 0.1 * Math.max(0, 1 - (it.p.x * it.p.x + it.p.z * it.p.z) / 0.12) * (it.lay || 0.5);
        };
        const mk = (spec, i, n, isIron) => {
          const shape = spec.shape;
          const it = {
            p: lp.clone(), v: new V3(0.2 + Math.random() * 0.5, 0.25, (Math.random() - 0.5) * 0.7), s: 1, color: spec.color, delay: (i / n) * 0.9,
            rx: Math.random() * 3, ry: Math.random() * 3, rz: Math.random() * 3, lay: Math.random(), floor: heapF,
          };
          if (shape === 'filing') it.dims = [0.05, 0.014, 0.014];
          else if (shape === 'nail') { it.dims = [0.2, 0.025, 0.025]; it.rx = 0; it.rz = 0; }
          else if (shape === 'flake') { it.dims = [0.07, 0.012, 0.05]; }
          else { it.s = 0.02 * (0.8 + Math.random() * 0.4); }
          if (isIron) it.iron = true;
          return it;
        };
        iron.spawn(Array.from({ length: v.iron.n }, (_, i) => mk(v.iron, i, v.iron.n, true)));
        const oth = Array.from({ length: v.other.n }, (_, i) => mk(v.other, i, v.other.n + extra.length, false));
        extra.forEach((e, i) => oth.push(mk(e, v.other.n + i, v.other.n + extra.length, false)));
        other.spawn(oth);
      },
      async work() {
        bob = 0;
        const y0 = mg.position.y;
        await phase(0.8, (k) => { mg.position.y = lerp(y0, LOW, ease(k)); });
        const tipW = legM.map((t) => t.position.clone());
        iron.items.forEach((it, i) => {
          const tp = tipW[i % 2];
          it.goal = new V3(tp.x + (Math.random() - 0.5) * 0.15, tp.y - 0.06 - Math.random() * 0.06, (Math.random() - 0.5) * 0.15);
          it.from = it.p.clone();
          it.d = (i / iron.items.length) * 0.5;
          it.follow = () => {};
        });
        await phase(1.4, (k) => {
          iron.items.forEach((it) => {
            const kk = Math.min(1, Math.max(0, (k - it.d) / 0.5));
            const goalW = it.goal.clone().add(mg.position);
            it.p.lerpVectors(it.from, goalW, kk * kk);
            if (kk > 0.95) it.rz = 1.4 + Math.sin(it.rx) * 0.3;
          });
          iron.sync();
        });
        await phase(0.9, (k) => {
          mg.position.y = lerp(LOW, REST, ease(k));
          iron.items.forEach((it) => it.p.copy(it.goal).add(mg.position));
          iron.sync();
        });
        iron.items.forEach((it) => { it.follow = (x) => x.p.copy(x.goal).add(mg.position); });
      },
      async scoopRest(toWorld, settle) {
        // Остатъкът (пясък и сол) се изсипва в чашата с вода.
        const list = other.items.map((it) => ({ color: it.color, salt: it.salt }));
        other.clear();
        await settle.dissolve(toWorld, list);
      },
      tick(dt, t) {
        if (bob) mg.position.y = REST + Math.sin(t * 1.4) * 0.03;
        mg.rotation.z = bob ? Math.sin(t * 0.9) * 0.04 : 0;
        iron.step(dt); other.step(dt);
      },
      other,
    };
    stations.magnet = S;
    placeStation('magnet', g);
  }
  for (const id of TOOL_IDS) {
    const st = stations[id];
    addHitBox(st.g, 1.0);
    const lbl = labelSprite(TOOLS[id].label, { size: 0.2, color: '#ffffff', bg: 'rgba(38,50,56,0.85)', border: 'rgba(38,50,56,0.85)' });
    lbl.position.set(0, -0.0, 0.62);
    lbl.center.set(0.5, 1.15);
    st.g.add(lbl);
    stage.steadyLabel(lbl, 9);
    st.label = lbl;
  }
  stage.tick((dt, t) => {
    for (const id of TOOL_IDS) stations[id].tick(rdt, t);
  });

  // --- предпазни очила ---
  const goggles = new THREE.Group();
  {
    const frameMat = mat(0x1e88e5, { roughness: 0.4 });
    const lensM = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.45, roughness: 0.05, depthWrite: false });
    for (const s of [-1, 1]) {
      const fr = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 24), frameMat);
      fr.position.set(s * 0.17, 0.16, 0);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), lensM);
      lens.position.set(s * 0.17, 0.16, 0.005);
      goggles.add(fr, lens);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), frameMat);
    bridge.position.set(0, 0.2, 0);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.018, 6, 30, Math.PI), mat(0x263238));
    strap.rotation.x = -Math.PI / 2;
    strap.position.set(0, 0.04, -0.02);
    goggles.add(bridge, strap);
    goggles.rotation.x = -1.1;
    goggles.position.set(...GOG);
    goggles.position.y = 0.02;
    goggles.userData.pickId = 'goggles';
    goggles.userData.home = goggles.position.clone();
    const gl = labelSprite('Очила', { size: 0.18 });
    gl.position.set(0, 0.3, 0.35);
    goggles.add(gl);
    stage.steadyLabel(gl, 9);
    addHitBox(goggles, 0.7);
    scene.add(goggles);
  }
  const gogOverlay = document.createElement('div');
  gogOverlay.className = 'mixtures-goggles';
  gogOverlay.innerHTML = '<span>🥽 С очила</span>';
  shell.stageEl.appendChild(gogOverlay);
  let wearing = false;
  async function wearGoggles() {
    if (wearing) return;
    wearing = true;
    stage.stopFollow();
    const from = goggles.position.clone();
    const r0 = goggles.rotation.x;
    await phase(0.9, (k) => {
      const to = camera.position.clone().add(camera.getWorldDirection(new V3()).multiplyScalar(0.6));
      goggles.position.lerpVectors(from, to, ease(k));
      goggles.rotation.x = lerp(r0, 0, k);
      goggles.lookAt(camera.position);
    });
    goggles.visible = false;
    gogOverlay.classList.add('on');
  }

  // ---------- изгледи ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.5, dur = 1.0) {
    const asp = camera.aspect;
    const d = Math.max(hw / (tanV * asp), hh / tanV) * 1.06;
    const pos = [c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d];
    stage.stopFollow();
    stage.flyTo(pos, c, dur);
  }
  const overview = (dur) => (narrow ? fitView([0, 0.5, 0.1], 3.05, 2.2, 0.62, dur) : fitView([0, 0.5, 0.6], 5.5, 1.9, 0.55, dur));

  // ---------- балончета ----------
  let tip = null;
  function say(anchor, html, cls = '', lift = 0.4) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const sayTool = (id, html, cls = '') => {
    if (id === 'lamp') return say(stations.evap.lamp, html, cls, 0.75);
    if (id === 'goggles') return say(goggles.visible ? goggles : goggles.userData.home.clone(), html, cls, 0.45);
    say(stations[id].g, html, cls, TOOLS[id].h + 0.25);
  };

  // ---------- общи действия ----------
  let clickHandler = null;
  let menuHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null, hit); });
  const menu = cornerMenu(stage, {
    title: 'Уреди',
    items: [
      { id: 'goggles', label: EXTRA.goggles.label, icon: EXTRA.goggles.icon },
      { id: 'lamp', label: EXTRA.lamp.label, icon: EXTRA.lamp.icon },
      ...TOOL_IDS.map((id) => ({ id, label: TOOLS[id].label, icon: TOOLS[id].icon })),
    ],
    onSelect: (id) => menuHandler && menuHandler(id),
  });

  // Сипване от съд (бурканче или чаша) към точка.
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 1, 8), liquidMat(0xcfe6f2, 0.8));
  stream.visible = false;
  stream.renderOrder = 2;
  scene.add(stream);
  async function pour(vessel, target, { color = null, dur = 1.1, onK, tilt = -1.95, back = true, homeLocal } = {}) {
    const parent = vessel.parent;
    const homeL = homeLocal || vessel.position.clone();
    const lipL = vessel.userData.lip.position.clone();
    const c = Math.cos(tilt); const s = Math.sin(tilt);
    const rot = new V3(lipL.x * c - lipL.y * s, lipL.x * s + lipL.y * c, 0);
    const wantW = target.clone().add(new V3(0, 0.28, 0)).sub(rot);
    const wantL = parent.worldToLocal(wantW.clone());
    const from = vessel.position.clone();
    await phase(0.7, (k) => {
      vessel.position.lerpVectors(from, wantL, ease(k));
      vessel.position.y += Math.sin(k * Math.PI) * 0.5;
    });
    await phase(0.45, (k) => { vessel.rotation.z = tilt * ease(k); });
    const lipW = new V3();
    if (color !== null) { stream.material.color.set(color); stream.visible = true; }
    await phase(dur, (k) => {
      vessel.userData.lip.getWorldPosition(lipW);
      if (color !== null) setStick(stream, lipW, target);
      if (onK) onK(k, lipW);
    });
    stream.visible = false;
    await phase(0.4, (k) => { vessel.rotation.z = tilt * (1 - ease(k)); });
    if (back) {
      const p2 = vessel.position.clone();
      await phase(0.7, (k) => { vessel.position.lerpVectors(p2, homeL, ease(k)); vessel.position.y += Math.sin(k * Math.PI) * 0.4; });
    }
  }
  function emptyJar(jar, k) {
    const liq = jar.userData.liquid;
    if (liq) liq.scale.y = Math.max(0.001, 0.3 * (1 - k));
    const G = jar.userData.grains;
    if (G) { G.mesh.count = Math.floor(G.items.length * (1 - k)); }
  }

  // Изпълнява разделяне на смес m в уред id.
  async function separate(jar, m, id) {
    const st = stations[id];
    st.reset();
    const v = m.vis;
    const lipW = new V3();
    if (id === 'sieve' || id === 'magnet') {
      let spawned = false;
      await pour(jar, st.mouth(), {
        dur: 1.1,
        onK: (k, lw) => {
          if (!spawned) { spawned = true; lipW.copy(lw); st.fill(v, lw); }
          emptyJar(jar, k);
        },
      });
      void lipW;
      await phase(0.5);
    } else {
      await pour(jar, st.mouth(), { color: m.jar.liquid, dur: 1.2, onK: (k) => { st.fillTo(k, v); emptyJar(jar, k); } });
    }
    if (id === 'settle') {
      const clockB = stage.bubble(st.g, '⏱ Минават 20 минути…', { lift: 1.5, cls: 'tag' });
      await st.work(v);
      clockB.remove();
    } else {
      await st.work(v);
    }
  }

  // ---------- резултати ----------
  const scores = [];
  let stopDrag = null;
  let jars = [];
  function clearJars() {
    for (const j of jars) { scene.remove(j); disposeTree(j); }
    jars = [];
  }
  function resetStations() { for (const id of TOOL_IDS) stations[id].reset(); }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    menu.show(true);
    menu.setActive(null);
    const seen = new Set();
    const ALL = ['goggles', 'lamp', ...TOOL_IDS];
    shell.task(`<p>Добре дошъл в химическата лаборатория! Тук ще разделяме смеси.</p>
      <p><b>Разгледай всички уреди</b> — кликни върху тях или ги избери от менюто в ъгъла. Започни с <b>предпазните очила</b>.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата маса</button></div>');
    ctrl.querySelector('.all').addEventListener('click', () => overview());
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${ALL.length}`);
    upd();
    const visit = async (id) => {
      const info = TOOLS[id] || EXTRA[id];
      const obj = id === 'goggles' ? goggles : id === 'lamp' ? stations.evap.lamp : stations[id].g;
      if (id !== 'goggles' || wearing) {
        const fo = id === 'goggles' ? { dist: 3, height: 1.4, lift: 0.1 } : id === 'lamp' ? { dist: 3, height: 1.0, lift: 0.5 } : { dist: narrow ? 3.8 : 3.4, height: 1.3, lift: 0.65 };
        stage.focusOn(obj.visible === false ? goggles : obj, { ...fo, keepFollow: false });
      }
      let html = `<b>${esc(info.icon)} ${esc(info.label)}</b><br>${info.note}`;
      if (id === 'goggles' && !wearing) {
        clearTip();
        seen.add(id); menu.mark(id); menu.setActive(id); upd();
        await wearGoggles();
        html += '<br>✔ Сложи си очилата!';
        say(goggles.userData.home.clone(), html, 'good', 0.45);
      } else {
        sayTool(id, html);
        seen.add(id); menu.mark(id); menu.setActive(id); upd();
      }
      if (seen.size === ALL.length) setTimeout(() => { if (clickHandler === handler) safetyQuiz(); }, 300);
    };
    const handler = (id) => { if (!id) { clearTip(); return; } if (ALL.includes(id)) visit(id); };
    clickHandler = handler;
    menuHandler = (id) => visit(id);
    overview();
  }

  const RULES = [
    { t: 'Слагам предпазни очила преди опита.', ok: true },
    { t: 'Помирисвам вещество, като пъхна носа си в чашата.', ok: false, why: 'Не! Миризмата се „маха“ с ръка към носа, отдалече.' },
    { t: 'Не опитвам веществата на вкус и не ги пипам с ръце.', ok: true },
    { t: 'Гася спиртната лампа с капачката, а не с духане.', ok: true },
    { t: 'Навеждам се над съда, докато се нагрява, за да виждам по-добре.', ok: false, why: 'Не! Горещи пръски могат да изгорят лицето и очите. Стой на разстояние.' },
    { t: 'Хващам горещото блюдо с щипка, а не с ръка.', ok: true },
  ];
  function safetyQuiz() {
    clickHandler = (id) => { if (!id) clearTip(); };
    menuHandler = (id) => {
      const info = TOOLS[id] || EXTRA[id];
      sayTool(id, `<b>${esc(info.icon)} ${esc(info.label)}</b><br>${info.note}`);
    };
    let mistakes = 0;
    const order = shuffle(RULES.map((r, i) => i));
    shell.task(`<p><b>Правила за безопасна работа.</b> Отбележи <b>всички верни</b> правила.</p>
      <div class="mixtures-rules">${order.map((i) => `<button class="choice" data-i="${i}"><span class="box"></span><span>${esc(RULES[i].t)}</span></button>`).join('')}</div>`);
    shell.msg('');
    const box = container.querySelector('.mixtures-rules');
    box.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      b.classList.toggle('on');
      b.classList.remove('wrong');
      b.querySelector('.box').textContent = b.classList.contains('on') ? '✓' : '';
    }));
    shell.score(`Грешки: ${mistakes}`);
    const ctrl = shell.setControls('<button class="btn primary">Провери</button>');
    ctrl.querySelector('button').addEventListener('click', () => {
      let bad = 0;
      const whys = [];
      box.querySelectorAll('.choice').forEach((b) => {
        const r = RULES[+b.dataset.i];
        const on = b.classList.contains('on');
        if (on !== r.ok) {
          bad++;
          if (on) { b.classList.add('wrong'); whys.push(r.why); }
        }
      });
      if (!bad) {
        box.querySelectorAll('.choice').forEach((b) => { b.disabled = true; if (b.classList.contains('on')) b.classList.add('right'); });
        shell.msg('Браво! Знаеш правилата. Сега може да започнем опитите.', 'good');
        scores.push(stepScore(mistakes, 3));
        const c2 = shell.setControls('<button class="btn primary">Напред →</button>');
        c2.querySelector('button').addEventListener('click', step2);
        return;
      }
      mistakes++;
      shell.score(`Грешки: ${mistakes}`);
      const missing = bad - whys.length;
      shell.msg(whys.length ? whys[0] + (missing ? ' Има и вярно правило, което не си отбелязал.' : '') : `Пропуснал си ${missing === 1 ? 'едно вярно правило' : 'няколко верни правила'}. Прочети пак.`, 'bad');
    });
  }

  // ---------- влачене на бурканчета към уредите ----------
  let lastPtr = null;
  const ptrMove = (ev) => { lastPtr = { clientX: ev.clientX, clientY: ev.clientY }; };
  stage.renderer.domElement.addEventListener('pointermove', ptrMove);
  stage.renderer.domElement.addEventListener('pointerdown', ptrMove);
  function toolUnder(pos) {
    if (lastPtr) {
      const hit = stage.pickAt(lastPtr, 'toolId', toolRoots);
      if (hit) return hit.root.userData.toolId;
    }
    let best = null; let bd = 0.9;
    for (const id of TOOL_IDS) {
      const p = stations[id].g.position;
      const d = Math.hypot(pos.x - p.x, pos.z - p.z);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }
  function highlight(id) {
    for (const t of TOOL_IDS) stations[t].ring.material.opacity = t === id ? 0.9 : 0;
  }
  function makeJars(list) {
    clearJars();
    const order = shuffle(list);
    order.forEach((m, i) => {
      const j = jarModel(m);
      const [x, z] = SLOTS[i];
      j.position.set(x, 0, z);
      j.userData.pickId = 'jar:' + m.id;
      j.userData.dragId = m.id;
      j.userData.mix = m;
      j.userData.home = j.position.clone();
      j.traverse((o) => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
      stage.steadyLabel(j.userData.label, 9);
      scene.add(j);
      jars.push(j);
    });
  }
  function lockJars(on) { for (const j of jars) if (!j.userData.done) j.userData.locked = on; }

  // Обща логика за стъпки 2 и 3.
  function sortStep({ list, onDone, protocol }) {
    let mistakes = 0;
    let done = 0;
    let busy = false;
    const tries = {};
    makeJars(list);
    const proto = protocol ? list.map((m) => ({ id: m.id, name: m.name, method: '', result: '' })) : null;
    const drawProto = () => {
      if (!proto) return '';
      return `<table class="mixtures-proto"><caption>📋 Протокол</caption><tr><th>Смес</th><th>Метод</th><th>Какво се получи</th></tr>
        ${proto.map((r) => `<tr class="${r.method ? 'done' : ''}"><td>${esc(r.name)}</td><td>${esc(r.method || '—')}</td><td>${esc(r.result || '')}</td></tr>`).join('')}</table>`;
    };
    const intro = protocol
      ? '<p><b>Провлачи всяко бурканче</b> до уреда, с който ще разделиш сместа. Гледай какво става!</p><p class="small">Кликни бурканче, за да видиш каква е сместа.</p>'
      : '<p>Ето нови смеси. <b>Провлачи всяка до уреда</b> с подходящия метод.</p><p class="small">Кликни бурканче, за да видиш каква е сместа.</p>';
    const drawTask = () => shell.task(intro + drawProto());
    drawTask();
    const upd = () => shell.score(`Разделени: ${done} от ${list.length} · грешки: ${mistakes}`);
    upd();
    shell.setControls('');
    clickHandler = (id) => {
      if (!id) return clearTip();
      if (id.startsWith('jar:')) {
        const m = BY_MIX[id.slice(4)];
        const j = jars.find((x) => x.userData.mix === m);
        say(j, `<b>${esc(m.name)}</b><br>${esc(m.look)}`, '', j.userData.top);
      } else if (TOOLS[id]) sayTool(id, `<b>${esc(TOOLS[id].label)}</b><br>${TOOLS[id].note}`);
    };
    menuHandler = null;
    stopDrag = stage.enableDrag({
      planeY: 0,
      lift: 0.5,
      onStart: () => clearTip(),
      onMove: (g, p) => highlight(toolUnder(p)),
      onDrop: async (g, p, start) => {
        highlight(null);
        const m = g.userData.mix;
        const id = toolUnder(p);
        if (!id || busy) { moveBack(g, start); return; }
        const reason = whyNot(m, id);
        if (reason) {
          mistakes++;
          tries[m.id] = (tries[m.id] || 0) + 1;
          upd();
          await shakeAt(g, id);
          sayTool(id, `✘ <b>${esc(TOOLS[id].method)}</b> не става.<br>${esc(reason)}${tries[m.id] >= 2 ? `<br><i>Подсказка: ${esc(m.hint)}</i>` : ''}`, 'bad');
          shell.msg(`„${m.name}“ не се разделя така. Прочети защо.`, 'bad');
          moveBack(g, g.userData.home);
          return;
        }
        if (id !== m.best) {
          await shakeAt(g, id);
          sayTool(id, `<b>${esc(TOOLS[id].method)}?</b> ${esc(m.alt[id])}`, 'bad');
          shell.msg('Почти! Потърси по-подходящ уред.', 'bad');
          moveBack(g, g.userData.home);
          return;
        }
        busy = true;
        lockJars(true);
        clearTip();
        shell.msg('');
        g.position.copy(start);
        const sg = stations[id].g;
        const fv = sg.position.clone();
        fitView([fv.x, 0.75, fv.z + 0.6], narrow ? 2.0 : 2.3, 1.35, 0.42, 0.9);
        await separate(g, m, id);
        g.userData.done = true;
        g.userData.locked = true;
        g.userData.label.material.opacity = 0.5;
        done++;
        sayTool(id, `✔ <b>${esc(TOOLS[id].method)}</b><br>${esc(m.result)}`, 'good');
        shell.msg('Вярно!', 'good');
        if (proto) {
          const row = proto.find((r) => r.id === m.id);
          row.method = TOOLS[id].method;
          row.result = m.proto;
          drawTask();
        }
        upd();
        busy = false;
        lockJars(false);
        overview(1.3);
        if (done === list.length) {
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 4));
          shell.msg(mistakes ? `Готово! Грешки: ${mistakes}.` : 'Без нито една грешка! 🎉', 'good');
          const c = shell.setControls('<button class="btn primary">Напред →</button>');
          c.querySelector('button').addEventListener('click', onDone);
        }
      },
    });
  }
  function moveBack(g, to) {
    const from = g.position.clone();
    phase(0.45, (k) => { g.position.lerpVectors(from, to, ease(k)); g.position.y = Math.sin(k * Math.PI) * 0.3; }).then(() => { g.position.copy(to); });
  }
  async function shakeAt(g, id) {
    const st = stations[id].g.position;
    const from = g.position.clone();
    const to = new V3(st.x - 0.55, 0, st.z + 0.55);
    await phase(0.3, (k) => { g.position.lerpVectors(from, to, ease(k)); });
    await phase(0.4, (k) => { g.rotation.z = Math.sin(k * Math.PI * 6) * 0.18 * (1 - k); });
    g.rotation.z = 0;
  }

  // ---------- 2. Раздели ----------
  function step2() {
    shell.step(1);
    clearTip();
    menu.show(false);
    menuHandler = null;
    resetStations();
    goggles.visible = false;
    wearing = true;
    gogOverlay.classList.add('on');
    overview();
    sortStep({ list: MIX2, protocol: true, onDone: step3 });
  }

  // ---------- 3. Кой метод? ----------
  function step3() {
    shell.step(2);
    clearTip();
    resetStations();
    overview();
    sortStep({ list: MIX3, protocol: false, onDone: step4 });
  }

  // ---------- 4. Трудна смес ----------
  const SEQ = [
    { id: 'magnet', t: '🧲 С магнит' },
    { id: 'dissolve', t: '💧 Разтваряне във вода' },
    { id: 'filter', t: '🧪 Филтруване' },
    { id: 'evap', t: '🔥 Изпаряване' },
    { id: 'sieve', t: '🥣 Пресяване' },
  ];
  const RIGHT = ['magnet', 'dissolve', 'filter', 'evap'];
  function step4() {
    shell.step(3);
    clearTip();
    resetStations();
    clearJars();
    const hard = {
      id: 'hard', short: 'Пясък, сол и стърготини', name: 'Пясък, сол и железни стърготини', dry: true,
      jar: { grains: [{ color: SAND, r: 0.02, n: 50 }, { color: 0xffffff, r: 0.018, n: 40 }, { color: 0x3d4248, r: 0.02, n: 40 }] },
    };
    const jar = jarModel(hard);
    jar.position.set(narrow ? 0 : 0, 0, narrow ? 1.6 : 1.6);
    jar.userData.home = jar.position.clone();
    stage.steadyLabel(jar.userData.label, 9);
    jar.userData.pickId = 'jar:hard';
    scene.add(jar);
    jars.push(jar);
    overview();
    say(jar, `<b>${esc(hard.name)}</b><br>Три вещества в едно бурканче! Как да получим всяко поотделно?`, 'wide', jar.userData.top);
    let mistakes = 0;
    const seq = [];
    const draw = () => {
      shell.task(`<p>В бурканчето има <b>пясък, сол и железни стърготини</b>. Кои методи ще използваш и <b>в какъв ред</b>?</p>
        <p class="small">Кликни методите поред. Кликни ред, за да го изтриеш.</p>
        <div class="mixtures-seq">${[0, 1, 2, 3].map((i) => `<div class="mixtures-slot ${seq[i] ? 'full' : ''}" data-i="${i}">${seq[i] ? esc(SEQ.find((s) => s.id === seq[i]).t) : ''}</div>`).join('')}</div>
        <div class="xp-chips">${SEQ.map((s) => `<span class="chip ${seq.includes(s.id) ? 'used' : ''}" data-id="${s.id}">${esc(s.t)}</span>`).join('')}</div>`);
      container.querySelectorAll('.xp-task .chip').forEach((c) => c.addEventListener('click', () => {
        if (seq.length >= 4 || seq.includes(c.dataset.id)) return;
        seq.push(c.dataset.id);
        shell.msg('');
        draw();
      }));
      container.querySelectorAll('.mixtures-slot').forEach((s) => s.addEventListener('click', () => {
        const i = +s.dataset.i;
        if (seq[i]) { seq.splice(i, 1); draw(); }
      }));
      shell.score(`Грешки: ${mistakes}`);
    };
    draw();
    clickHandler = (id) => { if (!id) clearTip(); else if (TOOLS[id]) sayTool(id, `<b>${esc(TOOLS[id].label)}</b><br>${TOOLS[id].note}`); };
    const ctrl = shell.setControls('<button class="btn primary">Провери</button>');
    ctrl.querySelector('button').addEventListener('click', () => {
      if (seq.length < 4) { shell.msg('Попълни и четирите реда.', 'bad'); return; }
      const wrongAt = seq.findIndex((s, i) => s !== RIGHT[i]);
      if (wrongAt < 0) {
        container.querySelectorAll('.mixtures-slot').forEach((s) => s.classList.add('right'));
        container.querySelectorAll('.xp-task .chip').forEach((c) => { c.style.pointerEvents = 'none'; });
        shell.msg('Вярно! Да го направим.', 'good');
        shell.setControls('');
        runHard(jar, mistakes);
        return;
      }
      mistakes++;
      shell.score(`Грешки: ${mistakes}`);
      container.querySelectorAll('.mixtures-slot')[wrongAt].classList.add('wrong');
      let why;
      if (seq.includes('sieve')) why = 'Пясъкът, солта и стърготините са еднакво ситни — ситото няма да ги раздели.';
      else if (seq[0] !== 'magnet' && seq.indexOf('magnet') > 0) why = 'Ако първо сипеш всичко във вода, стърготините ще се намокрят и смесят с пясъка. Кое вещество можеш да извадиш, докато сместа е още суха?';
      else if (seq.indexOf('filter') < seq.indexOf('dissolve')) why = 'Филтърът отделя течност от неразтворено вещество. Първо трябва да има течност.';
      else if (seq.indexOf('evap') < seq.indexOf('filter')) why = 'Ако изпариш водата преди филтруването, солта пак ще е смесена с пясъка.';
      else why = 'Редът не е верен. Помисли кое вещество какво свойство има.';
      shell.msg(why, 'bad');
      if (mistakes >= 3) shell.msg(why + ' Подсказка: магнитът е първи, изпаряването — последно.', 'bad');
    });
  }

  async function runHard(jar, mistakes) {
    clickHandler = null;
    clearTip();
    const M = stations.magnet; const Sb = stations.settle; const F = stations.filter; const E = stations.evap;
    const cam = (id, d = 3.6) => { const g = stations[id].g; stage.focusOn(g, { dist: narrow ? d + 0.6 : d, height: 1.4, lift: 0.6, keepFollow: false }); };
    // 1. магнит
    cam('magnet');
    const v = { iron: { color: 0x3d4248, shape: 'filing', n: 60 }, other: { color: SAND, shape: 'grain', n: 70 } };
    let spawned = false;
    await pour(jar, M.mouth(), {
      dur: 1.1,
      onK: (k, lw) => {
        if (!spawned) {
          spawned = true;
          M.fill(v, lw, Array.from({ length: 45 }, () => ({ color: 0xffffff, shape: 'grain' })));
          M.other.items.forEach((it) => { if (it.color === 0xffffff) it.salt = true; });
        }
        emptyJar(jar, k);
      },
    });
    await phase(0.4);
    await M.work();
    say(M.g, '<b>1. Магнит.</b> Стърготините полепнаха по магнита.', 'good', TOOLS.magnet.h + 0.2);
    await phase(1.2);
    // 2. разтваряне
    Sb.setLevel(0.55, 0xcfe6f2);
    cam('settle');
    await phase(0.9);
    say(Sb.g, '<b>2. Разтваряне.</b> Сипваме пясъка и солта във вода и разбъркваме.', '', TOOLS.settle.h + 0.2);
    await M.scoopRest(Sb.g.localToWorld(new V3(-0.1, 1.3, 0)), Sb);
    say(Sb.g, '<b>2. Разтваряне.</b> Солта се разтвори и не се вижда. Пясъкът не се разтваря — падна на дъното.', 'good', TOOLS.settle.h + 0.2);
    await phase(1.2);
    // 3. филтруване
    clearTip();
    cam('filter', 4.2);
    Sb.full = Sb.level; Sb.sed0 = Sb.sed.scale.y;
    await pour(Sb.g, F.mouth(), {
      color: 0xd2c9a6, dur: 1.4, tilt: -1.7,
      homeLocal: new V3(TPOS.settle[0], 0, TPOS.settle[1]),
      onK: (k) => { F.fillTo(Math.min(1, k * 1.2), { mix: 0xd2c9a6 }); Sb.empty(k); },
    });
    await F.work({ mix: 0xd2c9a6, solid: SAND, filtrate: 0xd4ecf7 });
    say(F.g, '<b>3. Филтруване.</b> Пясъкът остана на филтъра. През него мина солена вода.', 'good', TOOLS.filter.h + 0.2);
    await phase(1.2);
    // 4. изпаряване
    clearTip();
    cam('evap', 3.8);
    const rc = F.receiver;
    const lev0 = F.rlev;
    await pour(rc, E.mouth(), {
      color: 0xd4ecf7, dur: 1.2, tilt: -1.8,
      homeLocal: new V3(0, 0.05, 0),
      onK: (k) => { E.fillTo(k, { liquid: 0xd4ecf7 }); F.rl.scale.y = Math.max(0.001, lev0 * (1 - k)); },
    });
    await E.work({ liquid: 0xd4ecf7, residue: 0xffffff });
    say(E.g, '<b>4. Изпаряване.</b> Водата се изпари — остана чиста сол. Лампата гасим с капачката.', 'good', TOOLS.evap.h + 0.2);
    await phase(1.0);
    overview();
    usesQuiz(mistakes);
  }

  // Практическо значение: допълни текста.
  const USES = [
    { pre: 'В солниците край Поморие морската вода стои в плитки басейни. Слънцето я ', post: ' и остава готварска сол.', opts: ['изпарява', 'филтрува', 'утаява'], a: 0,
      why: 'Солта е разтворена — тя не се утаява и минава през филтър.' },
    { pre: 'В пречиствателната станция водата престоява в големи басейни, за да се ', post: ' калта на дъното. После минава през пясъчни филтри.', opts: ['изпари', 'утаи', 'пресее'], a: 1,
      why: 'Калта е по-тежка от водата. Какво прави, когато водата стои спокойно?' },
    { pre: 'В пункта за отпадъци голям ', post: ' вдига железните части от купчината.', opts: ['филтър', 'магнит', 'сито'], a: 1,
      why: 'Само едно от тези привлича желязо.' },
    { pre: 'Баба ', post: ' брашното, за да махне бучките и триците.', opts: ['пресява', 'утаява', 'изпарява'], a: 0,
      why: 'Бучките и триците са по-едри от брашното.' },
  ];
  function usesQuiz(prevMistakes) {
    let mistakes = prevMistakes;
    let ok = 0;
    shell.msg('');
    shell.task(`<p><b>Смесите около нас.</b> Допълни текста с правилната дума.</p>
      <div class="mixtures-text">${USES.map((u, i) => `<p>${i + 1}. ${esc(u.pre)}<span class="mixtures-blank" data-b="${i}">?</span>${esc(u.post)}</p>
      <div class="mixtures-opts" data-q="${i}">${u.opts.map((o, k) => `<button class="mixtures-opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>`).join('')}</div>`);
    shell.score(`Грешки: ${mistakes}`);
    container.querySelectorAll('.mixtures-opts').forEach((box) => {
      const q = +box.dataset.q;
      box.querySelectorAll('.mixtures-opt').forEach((b) => b.addEventListener('click', () => {
        const u = USES[q];
        if (+b.dataset.k === u.a) {
          b.classList.add('right');
          box.querySelectorAll('.mixtures-opt').forEach((x) => { x.disabled = true; });
          const bl = container.querySelector(`.mixtures-blank[data-b="${q}"]`);
          bl.textContent = u.opts[u.a];
          bl.classList.add('right');
          ok++;
          shell.msg('Вярно!', 'good');
          if (ok === USES.length) finishStep4(mistakes);
        } else {
          mistakes++;
          b.classList.add('wrong');
          b.disabled = true;
          shell.msg(u.why, 'bad');
          shell.score(`Грешки: ${mistakes}`);
        }
      }));
    });
    shell.setControls('');
  }
  function finishStep4(mistakes) {
    scores.push(stepScore(mistakes, 4));
    shell.msg(mistakes ? `Готово! Грешки в тази стъпка: ${mistakes}.` : 'Отлично — без нито една грешка! 🎉', 'good');
    const c = shell.setControls('<button class="btn primary">Виж резултата</button>');
    c.querySelector('button').addEventListener('click', () => {
      clearTip();
      const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
      shell.finish(ratio, onComplete, restart);
    });
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearJars();
    resetStations();
    highlight(null);
    scores.length = 0;
    wearing = false;
    goggles.visible = true;
    goggles.position.copy(goggles.userData.home);
    goggles.rotation.set(-1.1, 0, 0);
    gogOverlay.classList.remove('on');
    menu.setItems([
      { id: 'goggles', label: EXTRA.goggles.label, icon: EXTRA.goggles.icon },
      { id: 'lamp', label: EXTRA.lamp.label, icon: EXTRA.lamp.icon },
      ...TOOL_IDS.map((id) => ({ id, label: TOOLS[id].label, icon: TOOLS[id].icon })),
    ]);
    step1();
  }

  resetStations();
  step1();
  return {
    dispose() {
      if (stopDrag) stopDrag();
      stage.renderer.domElement.removeEventListener('pointermove', ptrMove);
      stage.renderer.domElement.removeEventListener('pointerdown', ptrMove);
      gogOverlay.remove();
      stage.dispose();
    },
  };
}
