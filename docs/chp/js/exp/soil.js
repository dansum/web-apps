// 4.1.2 „Почвата“ — градина с разрез на почвата и градинска маса за опити.
// Стъпки: опознай съставните части → опити (въздух в почвата, утаяване в буркан) → плодородие (три саксии) → какво помага и какво вреди на почвата.
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (k) => Math.max(0, Math.min(1, k));

const PARTS = [
  { id: 'humus', label: 'Хумус', icon: '🍂',
    note: '<b>Хумус</b> — тъмният горен пласт. Образува се от изгнили листа, корени и останки от животни. В него има <b>хранителни вещества</b> за растенията. Колкото повече хумус, толкова по-плодородна е почвата.' },
  { id: 'sand', label: 'Пясък', icon: '🏖️',
    note: '<b>Пясък</b> — ситни зрънца от разрушени скали. Между песъчинките има големи пролуки, затова <b>водата минава бързо</b> през пясъка.' },
  { id: 'clay', label: 'Глина', icon: '🧱',
    note: '<b>Глина</b> — много ситни частици, също от разрушени скали. Те са плътно една до друга, затова глината <b>задържа водата</b> и в нея има малко въздух.' },
  { id: 'stones', label: 'Камъчета', icon: '🪨',
    note: '<b>Камъчета</b> — по-едри парченца скала. Под почвата е скалата. От нея много бавно, за стотици години, се образува нова почва.' },
  { id: 'water', label: 'Вода', icon: '💧',
    note: '<b>Вода</b> — между частиците на почвата има вода. Корените на растенията я поемат заедно с разтворените в нея хранителни вещества.' },
  { id: 'air', label: 'Въздух', icon: '🫧',
    note: '<b>Въздух</b> — в пролуките между частиците има въздух. Той е нужен на корените и на животните, които живеят в почвата.' },
  { id: 'worm', label: 'Живи организми', icon: '🪱',
    note: '<b>Живи организми</b> — в почвата живеят земни червеи, насекоми, гъбички и много малки живи същества. Червеите правят ходове, през които влизат въздух и вода, и превръщат окапалите листа в хумус.' },
];
const PART = Object.fromEntries(PARTS.map((p) => [p.id, p]));

// Слоевете в буркана след утаяване (отдолу нагоре).
const JAR = [
  { id: 'stones', name: 'Камъчета', y0: 0.02, y1: 0.16, color: 0x8d8780, side: 1,
    hint: 'Най-едрите и тежки частици падат първи — на самото дъно.' },
  { id: 'sand', name: 'Пясък', y0: 0.16, y1: 0.36, color: 0xdcc08a, side: -1,
    hint: 'Песъчинките са по-ситни от камъчетата, но по-едри от глината. Те падат веднага след камъчетата.' },
  { id: 'clay', name: 'Глина', y0: 0.36, y1: 0.5, color: 0xa8653c, side: 1,
    hint: 'Глината е най-ситна. Тя се утаява най-бавно — последна, над пясъка.' },
  { id: 'water', name: 'Вода', y0: 0.5, y1: 1.1, color: 0x9fd3f0, side: -1,
    hint: 'Водата е над всички утаени слоеве. Тя отново е почти бистра.' },
  { id: 'humus', name: 'Хумус', y0: 1.1, y1: 1.15, color: 0x2e1f12, side: 1,
    hint: 'Хумусът и остатъците от растения са леки — те изплуват най-отгоре, на повърхността на водата.' },
];

// Стъпка 4: какво помага и какво вреди на почвата.
const CARE = [
  { id: 'worm', name: 'Земни червеи', zone: 0, say: 'Червеите разрохкват почвата — в нея влизат въздух и вода.' },
  { id: 'compost', name: 'Компост', zone: 0, say: 'Компостът е от изгнили остатъци от растения. Той прави почвата богата на хумус.' },
  { id: 'leaves', name: 'Окапали листа', zone: 0, say: 'Окапалите листа изгниват и се превръщат в хумус.' },
  { id: 'bottle', name: 'Пластмасови отпадъци', zone: 1, say: 'Пластмасата не изгнива — остава в почвата стотици години.' },
  { id: 'battery', name: 'Стари батерии', zone: 1, say: 'От старите батерии изтичат отровни вещества.' },
  { id: 'chem', name: 'Разлети химикали', zone: 1, say: 'Химикалите тровят почвата и живите организми в нея.' },
];

function injectStyle() {
  if (document.getElementById('soil-style')) return;
  const s = document.createElement('style');
  s.id = 'soil-style';
  s.textContent = `
  .soil-q { margin:10px 0 4px; font-weight:700; }
  .soil-list { margin:6px 0 0; padding-left:20px; } .soil-list li { margin:2px 0; }
  .soil-list li.done { color:#0d7a3a; } .soil-list li.done::marker { content:"✓ "; font-weight:900; }
  .soil-list li.cur { font-weight:800; }
  .soil-range { width:100%; margin:10px 0 2px; accent-color:#2e7d32; height:28px; }
  .soil-days { display:flex; justify-content:space-between; font-size:.8rem; color:#5b6b7b; }
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
function lathe(pts, m, seg = 28) {
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), m);
}
let puffTex = null;
function puffSprite(color, opacity, size) {
  if (!puffTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    puffTex = new THREE.CanvasTexture(c);
    puffTex.colorSpace = THREE.SRGBColorSpace;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color, transparent: true, opacity, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}
// Пръснати по лицето на слоя частици (един InstancedMesh за всички).
function speckles(geo, material, n, x0, x1, y0, y1, z, smin, smax) {
  const im = new THREE.InstancedMesh(geo, material, n);
  const d = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    d.position.set(lerp(x0, x1, Math.random()), lerp(y0, y1, Math.random()), z);
    const s = lerp(smin, smax, Math.random());
    d.scale.set(s, s * (0.7 + Math.random() * 0.5), s * 0.7);
    d.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  return im;
}
function wormModel(n = 11, r = 0.05) {
  const g = new THREE.Group();
  const segs = [];
  const m1 = mat(0xd98c8c); const m2 = mat(0xc76f6f);
  for (let i = 0; i < n; i++) {
    const rr = r * (i === 0 ? 1.1 : i === 3 ? 1.25 : 1 - i * 0.025);
    const s = new THREE.Mesh(new THREE.SphereGeometry(rr, 10, 8), i === 3 ? m2 : m1);
    s.position.x = (n / 2 - i) * r * 1.6;
    g.add(s);
    segs.push(s);
  }
  g.userData.segs = segs;
  return g;
}
function careModel(kind) {
  const g = new THREE.Group();
  const add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m; };
  if (kind === 'worm') {
    const w = wormModel(12, 0.055);
    w.position.y = 0.06;
    w.userData.segs.forEach((s, i) => { s.position.z = Math.sin(i * 0.7) * 0.08; });
    g.add(w);
    g.userData.worm = w;
  } else if (kind === 'compost') {
    const heap = add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x4e342e, { flat: true, roughness: 1 })));
    heap.scale.y = 0.6;
    const bits = [[0xff9800, 0.1, 0.13, 0.08], [0x7cb342, -0.12, 0.12, 0.05], [0xfdd835, 0.02, 0.17, -0.1], [0x8d6e63, -0.05, 0.1, 0.18]];
    for (const [c, x, y, z] of bits) {
      const b = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.06), mat(c)), x, y, z);
      b.rotation.set(0.4, x * 10, 0.3);
    }
  } else if (kind === 'leaves') {
    const cols = [0xd84315, 0xf9a825, 0x8d6e63, 0xef6c00];
    cols.forEach((c, i) => {
      const l = add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 6), mat(c, { flat: true })), Math.cos(i * 1.6) * 0.14, 0.03 + i * 0.02, Math.sin(i * 1.6) * 0.12);
      l.scale.set(1, 0.12, 0.55);
      l.rotation.y = i * 0.9;
    });
  } else if (kind === 'bottle') {
    const b = add(lathe([[0, 0], [0.1, 0], [0.1, 0.28], [0.04, 0.36], [0.035, 0.4], [0, 0.4]], new THREE.MeshStandardMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.7, roughness: 0.2 })), 0, 0.1, 0);
    b.rotation.z = Math.PI / 2;
    b.position.set(-0.2, 0.1, 0);
    const cap = add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10), mat(0x1565c0)), 0.22, 0.1, 0);
    cap.rotation.z = Math.PI / 2;
    const bag = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat(0xeeeeee, { flat: true })), 0.05, 0.08, 0.22);
    bag.scale.set(1.2, 0.6, 1);
  } else if (kind === 'battery') {
    for (let i = 0; i < 2; i++) {
      const b = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 14), mat(0x263238)), 0, 0.06, -0.08 + i * 0.16);
      b.rotation.z = Math.PI / 2;
      b.rotation.y = i * 0.5;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.1, 14), mat(0xffb300));
      band.position.y = 0.08;
      b.add(band);
      const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 8), mat(0xb0bec5, { metalness: 0.7 }));
      nub.position.y = 0.165;
      b.add(nub);
    }
  } else if (kind === 'chem') {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.14), mat(0xc62828)), -0.05, 0.16, 0);
    const sp = add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), mat(0x212121)), 0.05, 0.34, 0);
    sp.rotation.z = -0.6;
    const spill = add(new THREE.Mesh(new THREE.CircleGeometry(0.22, 18), new THREE.MeshStandardMaterial({ color: 0x6a1b9a, transparent: true, opacity: 0.75, roughness: 0.1 })), 0.2, 0.012, 0.1);
    spill.rotation.x = -Math.PI / 2;
    spill.scale.set(1, 0.7, 1);
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
  const STEPS = ['Опознай почвата', 'Направи опитите', 'Кое прави почвата плодородна?', 'Пази почвата'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xd6ebfa, camPos: [0, 4, 12], target: [0, 1, 0], maxDistance: 22, minDistance: 1.5,
    maxPolarAngle: Math.PI * 0.46,
  });
  const { scene, camera } = stage;
  stage.controls.minAzimuthAngle = -1.1;
  stage.controls.maxAzimuthAngle = 1.1;
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
  async function hop(g, to, dur = 0.6, height = 0.5) {
    const from = g.position.clone();
    await phase(dur, (k) => { g.position.lerpVectors(from, to, ease(k)); g.position.y += Math.sin(k * Math.PI) * height; });
  }

  // ---------- градина ----------
  const GX = -3.4; const W = 3.8; const D = 2.2; const FZ = D / 2;
  const LAY = { stones: [0.12, 0.6], clay: [0.6, 1.05], sand: [1.05, 1.5], humus: [1.5, 2.1] };
  const TOP = 2.15;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), mat(0x9ccc65));
  lawn.rotation.x = -Math.PI / 2;
  scene.add(lawn);
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.12, D + 0.3), mat(0xa1887f));
  pallet.position.set(GX, 0.06, 0);
  scene.add(pallet);
  const layers = {};
  const LCOL = { stones: 0x8d8780, clay: 0xb0663c, sand: 0xd8b878, humus: 0x3e2a1a };
  for (const id of ['stones', 'clay', 'sand', 'humus']) {
    const [y0, y1] = LAY[id];
    const g = new THREE.Group();
    g.userData.pickId = id;
    g.position.set(GX, 0, 0);
    const box = new THREE.Mesh(new THREE.BoxGeometry(W, y1 - y0, D), mat(LCOL[id], { roughness: 0.95 }));
    box.position.y = (y0 + y1) / 2;
    g.add(box);
    const x0 = -W / 2 + 0.07; const x1 = W / 2 - 0.07;
    if (id === 'stones') {
      g.add(speckles(new THREE.DodecahedronGeometry(1, 0), mat(0x6f6a64, { flat: true }), 16, x0, x1, y0 + 0.08, y1 - 0.08, FZ, 0.07, 0.15));
      g.add(speckles(new THREE.DodecahedronGeometry(1, 0), mat(0xaaa49c, { flat: true }), 12, x0, x1, y0 + 0.06, y1 - 0.06, FZ, 0.05, 0.1));
    } else if (id === 'clay') {
      g.add(speckles(new THREE.SphereGeometry(1, 8, 6), mat(0x8f4f2b, { roughness: 0.6 }), 26, x0, x1, y0 + 0.04, y1 - 0.04, FZ, 0.04, 0.08));
    } else if (id === 'sand') {
      g.add(speckles(new THREE.SphereGeometry(1, 6, 4), mat(0xf0d49a), 90, x0, x1, y0 + 0.03, y1 - 0.03, FZ, 0.02, 0.035));
      g.add(speckles(new THREE.SphereGeometry(1, 6, 4), mat(0xb8955a), 40, x0, x1, y0 + 0.03, y1 - 0.03, FZ, 0.02, 0.03));
    } else {
      g.add(speckles(new THREE.SphereGeometry(1, 6, 4), mat(0x1f140b), 50, x0, x1, y0 + 0.03, y1 - 0.03, FZ, 0.02, 0.045));
      g.add(speckles(new THREE.BoxGeometry(1, 0.2, 0.6), mat(0x7a5236), 22, x0, x1, y0 + 0.05, y1 - 0.05, FZ, 0.05, 0.09));
      // ход на червея
      const tun = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.11, 0.01), mat(0x24170c));
      tun.position.set(0.6, 1.72, FZ + 0.004);
      g.add(tun);
    }
    scene.add(g);
    layers[id] = g;
  }
  const grassSlab = new THREE.Mesh(new THREE.BoxGeometry(W, 0.05, D), mat(0x7cb342));
  grassSlab.position.set(GX, TOP - 0.025, 0);
  scene.add(grassSlab);
  // стръкчета трева, които се люлеят
  const NB = 170;
  const blades = new THREE.InstancedMesh(new THREE.ConeGeometry(0.025, 0.2, 4), mat(0x558b2f, { flat: true }), NB);
  const bladePos = [];
  for (let i = 0; i < NB; i++) bladePos.push([GX + (Math.random() - 0.5) * (W - 0.1), (Math.random() - 0.5) * (D - 0.1), 0.7 + Math.random() * 0.6]);
  scene.add(blades);
  const dmy = new THREE.Object3D();
  function swayGrass(t) {
    for (let i = 0; i < NB; i++) {
      const [x, z, s] = bladePos[i];
      dmy.position.set(x, TOP + 0.09 * s, z);
      dmy.rotation.set(0, 0, Math.sin(t * 1.8 + x * 2 + z) * 0.18);
      dmy.scale.setScalar(s);
      dmy.updateMatrix();
      blades.setMatrixAt(i, dmy.matrix);
    }
    blades.instanceMatrix.needsUpdate = true;
  }
  swayGrass(0);

  // растение в градината с корени, видими в разреза
  const PX = GX + 1.05;
  const gPlant = new THREE.Group();
  gPlant.position.set(PX, TOP, FZ - 0.25);
  scene.add(gPlant);
  const gStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.8, 8), mat(0x558b2f));
  gStem.position.y = 0.4;
  gPlant.add(gStem);
  for (let i = 0; i < 4; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6), mat(0x43a047, { flat: true }));
    l.scale.set(1, 0.18, 0.45);
    l.position.set((i % 2 ? 1 : -1) * 0.14, 0.2 + i * 0.15, 0);
    l.rotation.z = (i % 2 ? 1 : -1) * 0.4;
    gPlant.add(l);
  }
  const flower = new THREE.Group();
  flower.position.y = 0.82;
  flower.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0xf9a825)));
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0xffffff));
    p.scale.set(1, 0.3, 0.5);
    p.position.set(Math.cos((i / 7) * Math.PI * 2) * 0.11, 0, Math.sin((i / 7) * Math.PI * 2) * 0.11);
    p.rotation.y = -(i / 7) * Math.PI * 2;
    flower.add(p);
  }
  flower.rotation.x = 0.9;
  flower.scale.setScalar(0.001);
  gPlant.add(flower);
  const rootM = mat(0xe8d5b0);
  const roots = [[0, TOP - 0.02, 0, 1.15, 0.024], [0, 1.75, -0.35, 1.45, 0.014], [0, 1.6, 0.3, 1.3, 0.014], [0, 1.4, -0.25, 1.1, 0.012], [0.3, 1.3, 0.5, 1.12, 0.01]];
  for (const [x0, y0, x1, y1, r] of roots) {
    const a = new V3(PX + x0, y0, FZ + 0.012); const b = new V3(PX + x1, y1, FZ + 0.012);
    const len = a.distanceTo(b);
    const rm = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r, len, 6), rootM);
    rm.position.copy(a).add(b).multiplyScalar(0.5);
    rm.rotation.z = Math.atan2(-(b.x - a.x), b.y - a.y);
    scene.add(rm);
  }
  // вода между частиците
  const waterG = new THREE.Group();
  waterG.userData.pickId = 'water';
  waterG.position.set(GX + 1.45, 1.27, FZ + 0.02);
  const drops = [];
  const dropM = mat(0x2f8fdc, { roughness: 0.15 });
  for (let i = 0; i < 9; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), dropM);
    d.scale.set(0.9, 1.15, 0.9);
    d.position.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.3, 0);
    d.userData.sp = 0.04 + Math.random() * 0.04;
    waterG.add(d);
    drops.push(d);
  }
  scene.add(waterG);
  addHitBox(waterG, 0.5);
  // въздух в пролуките
  const airG = new THREE.Group();
  airG.userData.pickId = 'air';
  airG.position.set(GX - 0.55, 1.82, FZ + 0.02);
  const airB = [];
  const airM = new THREE.MeshStandardMaterial({ color: 0xf7fcff, transparent: true, opacity: 0.92, roughness: 0.1, emissive: 0x334455 });
  for (let i = 0; i < 8; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.045 + Math.random() * 0.03, 10, 8), airM);
    b.position.set((Math.random() - 0.5) * 0.55, (Math.random() - 0.5) * 0.3, 0);
    b.userData.ph = Math.random() * 6;
    airG.add(b);
    airB.push(b);
  }
  scene.add(airG);
  addHitBox(airG, 0.5);
  // земен червей в хода си
  const worm = wormModel(11, 0.05);
  worm.userData.pickId = 'worm';
  const WORM_X = GX + 0.6;
  worm.position.set(WORM_X, 1.72, FZ + 0.035);
  scene.add(worm);
  addHitBox(worm, 0.45);

  const PANCH = {
    humus: new V3(GX - 1.35, 1.8, FZ), sand: new V3(GX - 1.0, 1.27, FZ), clay: new V3(GX - 0.3, 0.82, FZ),
    stones: new V3(GX + 0.3, 0.36, FZ), water: waterG.position, air: airG.position, worm: new V3(WORM_X, 1.72, FZ),
  };

  // ограда, дърво, облаци, пеперуда
  const fenceM = mat(0xfff8e1);
  for (let i = 0; i < 34; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 0.06), fenceM);
    p.position.set(-9 + i * 0.55, 0.65, -4);
    scene.add(p);
  }
  for (const y of [0.35, 1.0]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.1, 0.05), fenceM);
    r.position.set(0.1, y, -4.04);
    scene.add(r);
  }
  const tree = new THREE.Group();
  tree.position.set(GX - 2.6, 0, -2.8);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 2.2, 8), mat(0x6d4c41));
  trunk.position.y = 1.1;
  tree.add(trunk);
  const crown = new THREE.Group();
  crown.position.y = 2.6;
  for (const [x, y, z, r] of [[0, 0, 0, 0.95], [0.6, -0.2, 0.2, 0.7], [-0.6, -0.1, 0.1, 0.7], [0, 0.6, 0, 0.6]]) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(0x4caf50, { flat: true }));
    s.position.set(x, y, z);
    crown.add(s);
  }
  tree.add(crown);
  scene.add(tree);
  const clouds = [];
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const p = puffSprite(0xffffff, 0.9, 1.4 + Math.random() * 0.6);
      p.position.set(j * 0.7 - 1, Math.random() * 0.3, 0);
      c.add(p);
    }
    c.position.set(-8 + i * 7, 6 + i * 0.4, -7);
    scene.add(c);
    clouds.push(c);
  }
  const fly = new THREE.Group();
  const wingM = new THREE.MeshStandardMaterial({ color: 0xff9800, side: THREE.DoubleSide });
  const wl = new THREE.Mesh(new THREE.CircleGeometry(0.11, 10), wingM); wl.position.x = -0.1;
  const wr = new THREE.Mesh(new THREE.CircleGeometry(0.11, 10), wingM); wr.position.x = 0.1;
  const wlp = new THREE.Group(); wlp.add(wl);
  const wrp = new THREE.Group(); wrp.add(wr);
  fly.add(wlp, wrp, new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6), mat(0x3e2723)));
  scene.add(fly);

  // ---------- градинска маса за опити ----------
  const TY = 1.0;
  const table = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 2.2), mat(0xbcaaa4));
  top.position.set(3.15, TY - 0.05, 0.2);
  table.add(top);
  for (const [x, z] of [[0.15, -0.75], [6.15, -0.75], [0.15, 1.15], [6.15, 1.15]]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, TY - 0.1, 8), mat(0x8d6e63));
    l.position.set(x, (TY - 0.1) / 2, z);
    table.add(l);
  }
  scene.add(table);

  // Чаша със суха почва (въздух в почвата)
  const AG = new THREE.Group();
  AG.position.set(0.6, TY, 0.35);
  scene.add(AG);
  const agl = lathe([[0, 0.001], [0.3, 0.001], [0.3, 0.95]], glassMat(0.28));
  agl.renderOrder = 3;
  AG.add(agl);
  const agSoilM = mat(0xa07f58, { roughness: 1 });
  const agSoil = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.35, 24), agSoilM);
  agSoil.position.y = 0.18;
  AG.add(agSoil);
  AG.add(speckles(new THREE.SphereGeometry(1, 6, 4), mat(0x5d4037), 30, -0.2, 0.2, 0.04, 0.33, 0.27, 0.015, 0.03));
  const agWater = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1, 24), liquidMat(0x5eb0ea, 0.55));
  agWater.renderOrder = 2;
  agWater.visible = false;
  AG.add(agWater);
  const agBub = [];
  const bubM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.05 });
  for (let i = 0; i < 18; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.018 + Math.random() * 0.015, 8, 6), bubM);
    b.visible = false;
    b.renderOrder = 4;
    AG.add(b);
    agBub.push(b);
  }
  let agLevel = 0.36; let agBubbling = 0;

  // Буркан за утаяване
  const JX = 2.05;
  const jar = new THREE.Group();
  jar.position.set(JX, TY, 0.35);
  scene.add(jar);
  const jglass = lathe([[0, 0.001], [0.42, 0.001], [0.44, 0.05], [0.44, 1.2], [0.38, 1.28], [0.38, 1.36]], glassMat(0.25));
  jglass.renderOrder = 3;
  jar.add(jglass);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 24), mat(0xc62828, { roughness: 0.4 }));
  lid.position.y = 1.4;
  jar.add(lid);
  const cyl = (r = 0.405) => new THREE.CylinderGeometry(r, r, 1, 28);
  const jMix = new THREE.Mesh(cyl(), mat(0x5d4430, { roughness: 1 }));
  jMix.scale.y = 0.48; jMix.position.y = 0.26;
  jar.add(jMix);
  jar.add(Object.assign(speckles(new THREE.SphereGeometry(1, 6, 4), mat(0xd8b878), 26, -0.3, 0.3, 0.05, 0.48, 0.36, 0.015, 0.03), { name: 'mixSpk' }));
  const jL = {};
  const jarLabels = [];
  for (const L of JAR) {
    const g = new THREE.Group();
    g.userData.pickId = 'L-' + L.id;
    let m;
    if (L.id === 'water') {
      m = new THREE.Mesh(cyl(), liquidMat(0x9fd3f0, 0.5));
      m.renderOrder = 2;
    } else if (L.id === 'humus') {
      m = new THREE.Mesh(cyl(0.39), mat(L.color, { roughness: 1 }));
      g.userData.flakes = [];
      for (let i = 0; i < 9; i++) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.04), mat(i % 3 ? 0x3e2a1a : 0x6d8b3a));
        f.position.set((Math.random() - 0.5) * 0.6, 0.6, (Math.random() - 0.5) * 0.6);
        f.rotation.y = Math.random() * 3;
        g.add(f);
        g.userData.flakes.push(f);
      }
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.8), new THREE.MeshBasicMaterial({ visible: false }));
      hb.position.y = (L.y0 + L.y1) / 2;
      g.add(hb);
    } else {
      m = new THREE.Mesh(cyl(), mat(L.color, { roughness: 1 }));
      if (L.id === 'stones') g.add(speckles(new THREE.DodecahedronGeometry(1, 0), mat(0x6f6a64, { flat: true }), 14, -0.3, 0.3, L.y0 + 0.04, L.y1 - 0.04, 0.37, 0.03, 0.05));
      if (L.id === 'sand') g.add(speckles(new THREE.SphereGeometry(1, 6, 4), mat(0xb8955a), 30, -0.3, 0.3, L.y0 + 0.02, L.y1 - 0.02, 0.4, 0.012, 0.02));
    }
    m.scale.y = L.y1 - L.y0;
    m.position.y = (L.y0 + L.y1) / 2;
    g.add(m);
    g.userData.mesh = m;
    g.visible = false;
    jar.add(g);
    jL[L.id] = g;
  }
  jL.water.visible = true;
  const jWaterM = jL.water.userData.mesh;
  function setWater(y0, y1) { jWaterM.scale.y = Math.max(0.001, y1 - y0); jWaterM.position.y = (y0 + y1) / 2; }
  setWater(0.5, 1.1);
  // падащи частици при утаяване
  const fall = [];
  const fallG = new THREE.Group();
  jar.add(fallG);
  const FT = { stones: [0x7d7770, 0.035, 0.0, 0.18, 0.03, 0.15], sand: [0xe0c48c, 0.02, 0.06, 0.45, 0.17, 0.35], clay: [0xa8653c, 0.013, 0.25, 1.0, 0.37, 0.49] };
  for (const [kind, [c, r, s0, s1, ya, yb]] of Object.entries(FT)) {
    const m = mat(c);
    for (let i = 0; i < 16; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 4), m);
      const a = Math.random() * Math.PI * 2; const rr = Math.sqrt(Math.random()) * 0.36;
      p.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      p.userData = { y0: 0.2 + Math.random() * 0.85, y1: lerp(ya, yb, Math.random()), s0, s1: s0 + (s1 - s0) * (0.6 + Math.random() * 0.4) };
      p.visible = false;
      fallG.add(p);
      fall.push(p);
    }
  }

  // Лейка
  const can = new THREE.Group();
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.3, 18), mat(0x43a047, { roughness: 0.5 }));
  canBody.position.y = 0.15;
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.42, 8), mat(0x388e3c));
  spout.position.set(0.28, 0.25, 0); spout.rotation.z = -1.0;
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.05, 10), mat(0x2e7d32));
  rose.position.set(0.46, 0.37, 0); rose.rotation.z = -1.0;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 6, 14, Math.PI), mat(0x2e7d32));
  handle.position.set(-0.05, 0.3, 0);
  can.add(canBody, spout, rose, handle);
  const CAN_HOME = new V3(1.35, TY, -0.45);
  can.position.copy(CAN_HOME);
  scene.add(can);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), liquidMat(0x64b5f6, 0.75));
  stream.visible = false;
  scene.add(stream);
  function showStream(x, yTop, yBot, z) {
    stream.visible = true;
    stream.scale.y = Math.max(0.01, yTop - yBot);
    stream.position.set(x, (yTop + yBot) / 2, z);
  }
  async function pourOver(x, z, surfaceY, dur, fn) {
    // лейката застава вляво от целта и се накланя
    await hop(can, new V3(x - 0.5, surfaceY + 0.55, z), 0.6, 0.3);
    await phase(0.3, (k) => { can.rotation.z = -0.5 * k; });
    const rp = new V3();
    await phase(dur, (k, dt, t) => {
      rose.getWorldPosition(rp);
      showStream(x, rp.y - 0.02, surfaceY, z);
      stream.scale.x = stream.scale.z = 1 + Math.sin(t * 30) * 0.15;
      if (fn) fn(k);
    });
    stream.visible = false;
    await phase(0.25, (k) => { can.rotation.z = -0.5 * (1 - k); });
  }
  const canHome = () => hop(can, CAN_HOME, 0.6, 0.3);

  // Три саксии
  const POTS = [
    { id: 'sand', name: 'Пясък', soil: 0xe2c58e, wet: 0xc9a46a, maxH: 0.34, leaves: 2, leafS: 0.55, col: 0xb7c24a },
    { id: 'clay', name: 'Глина', soil: 0xb0663c, wet: 0x8a4a28, maxH: 0.42, leaves: 3, leafS: 0.68, col: 0xc0b040 },
    { id: 'humus', name: 'Почва с хумус', soil: 0x4a3322, wet: 0x2f2014, maxH: 1.0, leaves: 6, leafS: 1.0, col: 0x2e7d32 },
  ];
  const potX = [3.65, 4.7, 5.75];
  const pots = {};
  const terra = mat(0xc8643b, { side: THREE.DoubleSide });
  POTS.forEach((P, i) => {
    const g = new THREE.Group();
    g.position.set(potX[i], TY, 0.35);
    g.userData.pickId = 'pot-' + P.id;
    const sau = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.07, 24), mat(0xb3542f));
    sau.position.y = 0.035;
    const sauW = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1, 24), liquidMat(0x64b5f6, 0.8));
    sauW.position.y = 0.075; sauW.scale.y = 0.001; sauW.visible = false;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.27, 0.62, 22, 1, true), terra);
    body.position.y = 0.07 + 0.31;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.04, 6, 24), mat(0xb3542f));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.69;
    const soilM = mat(P.soil, { roughness: 1 });
    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), soilM);
    soil.rotation.x = -Math.PI / 2; soil.position.y = 0.64;
    const pud = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), liquidMat(0x5aa9e6, 0.85));
    pud.rotation.x = -Math.PI / 2; pud.position.y = 0.648; pud.scale.setScalar(0.001); pud.visible = false;
    g.add(sau, sauW, body, rim, soil, pud);
    // растение
    const plant = new THREE.Group();
    plant.position.y = 0.64;
    const stemM = mat(0x689f38);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 1, 8), stemM);
    plant.add(stem);
    const leafM = mat(0x66bb6a, { flat: true });
    const leaves = [];
    for (let j = 0; j < 6; j++) {
      for (const s of [-1, 1]) {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 6), leafM);
        l.userData = { j, s };
        plant.add(l);
        leaves.push(l);
      }
    }
    g.add(plant);
    const lbl = labelSprite(P.name, { size: 0.11 });
    lbl.position.set(0, 0.22, 0.52);
    g.add(lbl);
    scene.add(g);
    pots[P.id] = { P, g, sauW, soilM, pud, plant, stem, leaves, leafM, grow: 0, sauLevel: 0, wet: 0 };
  });
  const leafBase = new THREE.Color(0x66bb6a);
  // вода в чинийката: колкото повече, толкова по-широко и по-високо петно
  function setSaucer(p, lev) {
    p.sauW.visible = lev > 0.002;
    p.sauW.scale.set(0.45 + 0.55 * Math.min(1, lev / 0.05), Math.max(0.001, lev), 0.45 + 0.55 * Math.min(1, lev / 0.05));
    p.sauW.position.y = 0.07 + p.sauW.scale.y / 2;
  }
  function setGrow(id, k) {
    const p = pots[id]; const P = p.P;
    p.grow = k;
    const H = 0.14 + (P.maxH - 0.14) * k;
    p.stem.scale.y = H;
    p.stem.position.y = H / 2;
    const nPairs = 1 + Math.round((P.leaves - 1) * k);
    for (const l of p.leaves) {
      const { j, s } = l.userData;
      l.visible = j < nPairs;
      if (!l.visible) continue;
      const f = nPairs === 1 ? 0.8 : 0.3 + (0.62 * j) / (nPairs - 1);
      const size = (0.45 + 0.55 * k) * lerp(1, P.leafS, k) * (j === nPairs - 1 ? 0.75 : 1);
      l.scale.set(size, size * 0.2, size * 0.5);
      l.position.set(s * 0.11 * size, H * f, 0);
      const droop = P.id === 'humus' ? 0.35 : lerp(0.35, -0.35, k);
      l.rotation.set(0, 0, s * droop);
    }
    p.leafM.color.copy(leafBase).lerp(new THREE.Color(P.col), k);
  }
  for (const P of POTS) setGrow(P.id, 0);

  // ---------- оживяване ----------
  let flyT = 0;
  stage.tick((dt, t) => {
    swayGrass(t);
    // червеят пълзи напред-назад в хода си
    const wx = Math.sin(t * 0.3);
    worm.position.x = WORM_X + wx * 0.42;
    worm.scale.x = Math.cos(t * 0.3) >= 0 ? 1 : -1;
    worm.userData.segs.forEach((s, i) => { s.position.y = Math.sin(t * 5 - i * 0.7) * 0.022; });
    for (const d of drops) {
      d.position.y -= d.userData.sp * dt;
      if (d.position.y < -0.17) { d.position.y = 0.17; d.position.x = (Math.random() - 0.5) * 0.6; }
    }
    for (const b of airB) b.scale.setScalar(1 + Math.sin(t * 2 + b.userData.ph) * 0.12);
    crown.rotation.z = Math.sin(t * 0.7) * 0.03;
    gPlant.rotation.z = Math.sin(t * 1.1) * 0.04;
    for (const c of clouds) { c.position.x += dt * 0.25; if (c.position.x > 12) c.position.x = -12; }
    flyT += dt;
    fly.position.set(GX + Math.sin(flyT * 0.35) * 2.2, TOP + 1.1 + Math.sin(flyT * 1.3) * 0.25, 0.3 + Math.cos(flyT * 0.35) * 1.2);
    fly.rotation.y = -flyT * 0.35 + (Math.cos(flyT * 0.35) > 0 ? 0 : Math.PI);
    wlp.rotation.y = Math.sin(t * 16) * 0.9; wrp.rotation.y = -Math.sin(t * 16) * 0.9;
    for (const id in pots) pots[id].plant.rotation.z = Math.sin(t * 1.3 + potX.length * id.length) * 0.03;
    // мехурчета в чашата
    for (const b of agBub) {
      if (!b.visible) {
        if (agBubbling > 0 && Math.random() < 0.08) {
          b.visible = true;
          const a = Math.random() * Math.PI * 2; const r = Math.random() * 0.22;
          b.position.set(Math.cos(a) * r, 0.37, Math.sin(a) * r);
          b.userData.v = 0.25 + Math.random() * 0.25;
        }
        continue;
      }
      b.position.y += b.userData.v * dt;
      b.position.x += Math.sin(t * 8 + b.id) * 0.002;
      if (b.position.y > agLevel - 0.01) b.visible = false;
    }
  });

  // ---------- изглед и балончета ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.3, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.08;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, dur);
  }
  const overview = () => (narrow ? gardenView() : fitView([0.9, 1.2, 0.6], 5.9, 1.9, 0.3));
  const gardenView = () => (narrow ? fitView([GX, 1.2, FZ], 2.05, 1.35, 0.28) : fitView([GX - 0.6, 1.2, FZ], 2.9, 1.35, 0.28));
  const partView = (v) => fitView([narrow ? v.x : v.x - 0.45, v.y, FZ], narrow ? 1.25 : 1.6, 0.9, 0.22);
  const labView = () => fitView([1.55, TY + 0.7, 0.35], narrow ? 1.4 : 1.6, 1.0, 0.25);
  const potsView = () => fitView([4.7, TY + 0.65, 0.35], narrow ? 1.55 : 1.75, 0.95, 0.3);
  let tip = null;
  const tags = [];
  function say(anchor, html, cls = '', lift = 0.5) {
    if (tip) tip.remove();
    if (narrowUI()) cls = cls.replace('wide', '');
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  function tag(anchor, html, lift, cls = '') { tags.push(stage.bubble(anchor, html, { lift, cls: 'tag ' + cls })); }
  function clearTags() { while (tags.length) tags.pop().remove(); }

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  stage.onHover(() => {});

  function choiceBox(c, q, items, rightIdx, why, onRight, onWrong) {
    c.innerHTML = `<p class="soil-q">${esc(q)}</p><div class="choices">${items.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
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

  // ---------- 1. Опознай ----------
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Какво има в почвата?',
    items: PARTS.map((p) => ({ id: p.id, label: p.label, icon: p.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  function step1() {
    shell.step(0);
    const seen = new Set();
    shell.task(`<p>Пред теб е <b>разрез на почвата</b> в градината — като парче торта, на което се виждат пластовете.</p>
      <p><b>Разгледай всички съставни части:</b> кликни върху тях в разреза или ги избери от менюто в ъгъла.</p>
      <p class="small">В истинската почва пясъкът и глината са смесени. Тук са показани отделно, за да се виждат по-добре.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата градина</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); gardenView(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${PARTS.length}`);
    upd();
    const visit = (id) => {
      const p = PART[id];
      partView(PANCH[id]);
      say(id === 'worm' ? worm : PANCH[id], `<b>${esc(p.icon)}</b> ${p.note}`, 'wide', 0.3);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === PARTS.length) { next.disabled = false; shell.msg('Разгледа всички части на почвата! Продължи напред.', 'good'); }
    };
    clickHandler = (id) => { if (!id || !PART[id]) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); menu.show(false); clearTip(); step2(); });
    overview();
  }

  // ---------- 2. Опити ----------
  function step2() {
    shell.step(1);
    clickHandler = null;
    let mistakes = 0;
    labView();
    // Опит 1: въздух в почвата
    shell.task(`<p><b>Опит 1.</b> В чашата има <b>суха почва</b>. Какво ще стане, ако налеем вода?</p><p>Натисни „Налей вода“ и гледай внимателно почвата.</p>`);
    const c1 = shell.setControls('<button class="btn primary">💧 Налей вода</button>');
    shell.score('');
    c1.querySelector('button').addEventListener('click', async (e) => {
      e.target.disabled = true;
      agWater.visible = true;
      agBubbling = 1;
      const dry = new THREE.Color(0xa07f58); const wet = new THREE.Color(0x5b4128);
      const AGW = AG.position;
      await pourOver(AGW.x, AGW.z, TY + 0.5, 2.2, (k) => {
        agLevel = 0.36 + 0.46 * k;
        agWater.scale.y = agLevel - 0.36;
        agWater.position.y = 0.36 + (agLevel - 0.36) / 2;
        agSoilM.color.copy(dry).lerp(wet, k);
      });
      canHome();
      say(AG, '🫧 От почвата излизат мехурчета!', '', 1.05);
      await wait(1.5);
      const box = shell.setControls('<div class="soil-ask"></div>').querySelector('.soil-ask');
      choiceBox(box, 'Откъде дойдоха мехурчетата?', [
        'В почвата има въздух. Водата влезе в пролуките и го избута навън.',
        'Водата завря.',
        'Мехурчетата бяха във водата още в лейката.',
      ], 0, ['', 'Водата е студена — тя не е кипяла. Погледни откъде излизат мехурчетата.', 'Във водата от лейката нямаше мехурчета. Те излизат от почвата.'], () => {
        agBubbling = 0;
        shell.msg('Вярно! В почвата има въздух.', 'good');
        say(AG, '✓ Между частиците на почвата има <b>въздух</b>.', 'good', 1.05);
        const c = shell.setControls('<button class="btn primary">Опит 2 →</button>');
        c.querySelector('button').addEventListener('click', jarTest);
      }, () => { mistakes++; });
    });

    // Опит 2: разклащане и утаяване
    function jarTest() {
      clearTip();
      shell.msg('');
      shell.task(`<p><b>Опит 2.</b> В буркана има <b>почва и вода</b>. Разклати буркана и остави сместа да постои.</p><p>Кои частици ще паднат на дъното първи?</p>`);
      const c = shell.setControls('<button class="btn primary">🫙 Разклати буркана</button>');
      say(jar, 'Почва и вода', '', 1.55);
      let started = false;
      const go = async () => {
        if (started) return;
        started = true;
        clickHandler = null;
        c.querySelector('button').disabled = true;
        clearTip();
        jar.getObjectByName('mixSpk').visible = false;
        const mud = new THREE.Color(0x6b4f35); const clear = new THREE.Color(0x9fd3f0);
        const wm = jWaterM.material;
        await phase(1.6, (k, dt, t) => {
          jar.rotation.z = Math.sin(t * 28) * 0.2 * (1 - k * 0.5);
          jar.position.y = TY + Math.abs(Math.sin(t * 28)) * 0.06;
          if (k > 0.15 && jMix.visible) {
            jMix.visible = false;
            setWater(0.02, 1.1);
            wm.color.copy(mud); wm.opacity = 0.96;
            jL.humus.visible = true;
            jL.humus.userData.flakes.forEach((f) => { f.position.y = 0.3 + Math.random() * 0.6; });
            jL.humus.userData.mesh.scale.y = 0.001;
            for (const p of fall) { p.visible = true; p.position.y = p.userData.y0; }
          }
        });
        jar.rotation.z = 0; jar.position.y = TY;
        say(jar, '⏳ Сместа се утаява… В истински буркан това трае часове.', '', 1.55);
        for (const L of JAR.slice(0, 3)) { jL[L.id].visible = true; jL[L.id].userData.mesh.scale.y = 0.001; }
        const flakes = jL.humus.userData.flakes;
        const fy0 = flakes.map((f) => f.position.y);
        await phase(7, (k) => {
          let topY = 0.02;
          const th = { stones: clamp01(k / 0.18), sand: clamp01((k - 0.06) / 0.4), clay: Math.pow(clamp01((k - 0.25) / 0.75), 0.8) };
          for (const L of JAR.slice(0, 3)) {
            const h = (L.y1 - L.y0) * th[L.id];
            const m = jL[L.id].userData.mesh;
            m.scale.y = Math.max(0.001, h);
            m.position.y = topY + h / 2;
            topY += h;
          }
          setWater(topY, 1.1);
          const ck = clamp01((k - 0.15) / 0.85);
          wm.color.copy(mud).lerp(clear, ck);
          wm.opacity = lerp(0.96, 0.5, ck);
          for (const p of fall) {
            const u = clamp01((k - p.userData.s0) / (p.userData.s1 - p.userData.s0));
            p.position.y = lerp(p.userData.y0, p.userData.y1, u);
            if (u >= 1) p.visible = false;
          }
          const hk = ease(clamp01((k - 0.05) / 0.5));
          flakes.forEach((f, i) => { f.position.y = lerp(fy0[i], 1.15, hk); });
          jL.humus.userData.mesh.scale.y = Math.max(0.001, 0.05 * hk);
        });
        say(jar, 'Сместа се утаи на слоеве!', 'good', 1.55);
        labelLayers();
      };
      c.querySelector('button').addEventListener('click', go);
      clickHandler = (id) => { if (id && id.startsWith('L-')) go(); };
    }

    function labelLayers() {
      const order = shuffle(JAR.map((L) => L.id));
      let qi = 0; let wrongHere = 0;
      const done = new Set();
      const listHTML = () => `<ul class="soil-list">${order.map((id, i) => `<li class="${done.has(id) ? 'done' : i === qi ? 'cur' : ''}">${esc(JAR.find((L) => L.id === id).name)}</li>`).join('')}</ul>`;
      const ask = () => {
        const L = JAR.find((x) => x.id === order[qi]);
        shell.task(`<p>Назови слоевете в буркана. Кликни върху слоя <b>„${esc(L.name)}“</b>.</p>${listHTML()}`);
        shell.score(`Назовани: ${done.size} от ${JAR.length} · грешки: ${mistakes}`);
      };
      shell.setControls('');
      ask();
      clickHandler = (pid) => {
        if (!pid || !pid.startsWith('L-')) return;
        const id = pid.slice(2);
        const L = JAR.find((x) => x.id === order[qi]);
        if (done.has(id)) { shell.msg('Този слой вече има етикет. Потърси друг.', ''); return; }
        if (id !== L.id) {
          mistakes++; wrongHere++;
          shell.msg(`Това не е слоят „${L.name}“. ` + (wrongHere >= 2 ? `Подсказка: ${L.hint}` : 'Помисли: кои частици падат най-бързо — едрите и тежките или ситните и леките?'), 'bad');
          shell.score(`Назовани: ${done.size} от ${JAR.length} · грешки: ${mistakes}`);
          return;
        }
        wrongHere = 0;
        done.add(id);
        const lb = labelSprite(L.name, { size: 0.13 });
        jarLabels.push(lb);
        lb.position.set(L.side * 0.78, (L.y0 + L.y1) / 2 + (id === 'humus' ? 0.06 : 0), 0);
        jar.add(lb);
        shell.msg(`Вярно! ${L.hint}`, 'good');
        qi++;
        if (qi < order.length) { ask(); return; }
        clickHandler = null;
        shell.task(`<p>Всички слоеве имат етикети!</p>${listHTML()}`);
        shell.score(`Назовани: ${JAR.length} от ${JAR.length} · грешки: ${mistakes}`);
        say(jar, 'Най-отдолу са <b>едрите и тежки</b> частици, а най-отгоре плава <b>лекият хумус</b>.', 'wide good', 1.55);
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => {
          scores.push(stepScore(mistakes, 3));
          clearTip(); shell.msg(''); step3();
        });
      };
    }
  }

  // ---------- 3. Плодородие ----------
  function step3() {
    shell.step(2);
    for (const l of jarLabels) l.visible = false;
    clickHandler = null;
    let mistakes = 0;
    potsView();
    const upd = () => shell.score(mistakes ? `Грешки: ${mistakes}` : '');
    upd();
    shell.task(`<p>Засадихме <b>едно и също растение</b> в три саксии: с <b>пясък</b>, с <b>глина</b> и с <b>почва с много хумус</b>. Ще ги поливаме еднакво и ще стоят на едно и също място.</p>`);
    const box = shell.setControls('<div class="soil-ask"></div>').querySelector('.soil-ask');
    choiceBox(box, 'Предскажи: в коя саксия растението ще порасне най-добре?', POTS.map((P) => 'В саксията с ' + P.name.toLowerCase()), 2, (i, n) => {
      if (n >= 2) return 'Подсказка: хумусът съдържа хранителни вещества за растенията.';
      return i === 0 ? 'Помисли: има ли в пясъка храна за растението и задържа ли се водата в него?' : 'Помисли: какво става с водата в глината и остава ли въздух за корените?';
    }, () => {
      shell.msg('Да проверим! Първо ще полеем саксиите с еднакво количество вода.', 'good');
      const c = shell.setControls('<button class="btn primary">💧 Полей саксиите</button>');
      c.querySelector('button').addEventListener('click', (e) => { e.target.disabled = true; watering(); });
    }, () => { mistakes++; upd(); });

    async function watering() {
      shell.msg('');
      for (let i = 0; i < 3; i++) {
        const p = pots[POTS[i].id];
        const dry = new THREE.Color(p.P.soil); const wet = new THREE.Color(p.P.wet);
        p.sauW.visible = true;
        if (p.P.id === 'clay') p.pud.visible = true;
        await pourOver(potX[i], 0.35, TY + 0.64, 1.0, (k) => {
          p.soilM.color.copy(dry).lerp(wet, k);
          if (p.P.id === 'clay') p.pud.scale.setScalar(Math.max(0.001, k));
        });
        // водата се стича: през пясъка бързо, през почвата с хумус малко, през глината почти нищо
        const target = { sand: 0.05, humus: 0.008, clay: 0 }[p.P.id];
        const dur = { sand: 0.8, humus: 1.6, clay: 2 }[p.P.id];
        phase(dur, (k) => setSaucer(p, target * k));
      }
      canHome();
      await wait(1.6);
      tag(pots.sand.g, '💧 Водата изтече в чинийката', 0.25);
      tag(pots.clay.g, '💧 Локва отгоре', 0.95);
      tag(pots.humus.g, 'Почвата е влажна', 0.25);
      askWater();
    }
    function askWater() {
      const box2 = shell.setControls('<div class="soil-ask"></div>').querySelector('.soil-ask');
      choiceBox(box2, 'През коя почва водата мина най-бързо и изтече в чинийката?', POTS.map((P) => P.name), 0,
        ['', 'Погледни саксията с глината — водата стои отгоре като локва.', 'Почвата с хумус задържа водата като гъба. Погледни чинийките.'], () => {
          shell.msg('Вярно! Между песъчинките има големи пролуки и водата минава бързо. Пясъкът не задържа вода за корените.', 'good');
          const box3 = shell.setControls('<div class="soil-ask"></div>').querySelector('.soil-ask');
          choiceBox(box3, 'В коя саксия водата застоя отгоре и корените остават без въздух?', POTS.map((P) => P.name), 1,
            ['Водата изтече през пясъка в чинийката.', '', 'Почвата с хумус попи водата.'], () => {
              shell.msg('Вярно! Частиците на глината са плътно една до друга. Водата застоява и за корените не остава въздух.', 'good');
              timeLapse();
            }, () => { mistakes++; upd(); });
        }, () => { mistakes++; upd(); });
    }
    function timeLapse() {
      clearTags();
      shell.task('<p>Сега да видим как растат растенията. <b>Плъзни „Дни“</b> надясно и наблюдавай саксиите.</p>');
      const c = shell.setControls(`<input type="range" class="soil-range" min="0" max="21" step="1" value="0" aria-label="Дни">
        <div class="soil-days"><span>Ден 0</span><span class="soil-day"><b>Ден 0</b></span><span>Ден 21</span></div>`);
      const rng = c.querySelector('.soil-range');
      let finished = false;
      rng.addEventListener('input', () => {
        const d = +rng.value;
        c.querySelector('.soil-day').innerHTML = `<b>Ден ${d}</b>`;
        for (const P of POTS) setGrow(P.id, d / 21);
        // пясъкът изсъхва, глината остава мокра
        pots.sand.soilM.color.copy(new THREE.Color(pots.sand.P.wet)).lerp(new THREE.Color(pots.sand.P.soil), Math.min(1, d / 4));
        setSaucer(pots.sand, 0.05 * (1 - Math.min(1, d / 6)));
        setSaucer(pots.humus, 0.008 * (1 - Math.min(1, d / 6)));
        if (d >= 21 && !finished) { finished = true; afterGrowth(); }
      });
    }
    async function afterGrowth() {
      tag(pots.sand.g, 'слабо и бледо', 0.95, 'bad');
      tag(pots.clay.g, 'пожълтели листа', 1.25, 'bad');
      say(pots.humus.g, '🌱 Най-високо и зелено!', 'good', 1.9);
      await wait(0.6);
      const box4 = shell.setControls('<div class="soil-ask"></div>').querySelector('.soil-ask');
      choiceBox(box4, 'Защо растението в почвата с хумус порасна най-добре?', [
        'Хумусът дава хранителни вещества и задържа вода, а между частиците има и въздух.',
        'Защото тази саксия стоеше най-близо до слънцето.',
        'Защото тъмната почва е най-красива.',
      ], 0, ['', 'Трите саксии стояха на едно място и получаваха еднаква светлина.', 'Цветът не храни растението. Помисли какво има в хумуса.'], () => {
        shell.msg('Вярно! Плодородието на почвата зависи от хумуса, водата и въздуха в нея.', 'good');
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => {
          scores.push(stepScore(mistakes, 3));
          clearTip(); clearTags(); shell.msg(''); step4();
        });
      }, () => { mistakes++; upd(); });
    }
  }

  // ---------- 4. Пази почвата ----------
  let stopDrag = null;
  function step4() {
    shell.step(3);
    clickHandler = null;
    let mistakes = 0; let wrongHere = 0;
    const ZZ = 2.9; const ZR = 1.0;
    const zx = [GX - 1.75, GX + 1.75];
    const sortG = new THREE.Group();
    scene.add(sortG);
    const zones = [zoneRing(0x2e7d32, ZR), zoneRing(0xc62828, ZR)];
    const zNames = ['Помага на почвата', 'Вреди на почвата'];
    zones.forEach((z, i) => {
      z.position.set(zx[i], 0.005, ZZ);
      sortG.add(z);
      const l = labelSprite((i ? '⚠️ ' : '🌱 ') + zNames[i], { size: 0.2, color: i ? '#b3261e' : '#1b5e20' });
      l.position.set(zx[i], 0.15, ZZ + ZR + 0.25);
      sortG.add(l);
    });
    const SPAWN = new V3(GX, 0, ZZ + 0.1);
    const order = shuffle(CARE);
    const items = order.map((C) => {
      const g = careModel(C.id);
      g.position.copy(SPAWN);
      const l = labelSprite(C.name, { size: 0.17 });
      l.position.set(0, 0.7, 0);
      g.add(l);
      g.userData.C = C;
      g.visible = false;
      sortG.add(g);
      addHitBox(g, 0.7);
      return g;
    });
    const inZone = [0, 0];
    const slots = [[-0.42, -0.3], [0.42, -0.3], [0, 0.38]];
    let cur = 0;
    if (narrow) fitView([GX, 0.4, ZZ], 3.0, 1.25, 0.9); else fitView([GX, 0.5, ZZ - 0.3], 3.1, 1.6, 0.75);
    const upd = () => shell.score(`Подредени: ${cur} от ${items.length} · грешки: ${mistakes}`);
    shell.task(`<p>Градинарят иска почвата да е <b>плодородна</b>. Кое помага на почвата и кое ѝ вреди?</p>
      <p><b>Влачи</b> всеки предмет в правилния кръг.</p>`);
    shell.setControls('');
    const show = () => {
      const g = items[cur];
      g.visible = true;
      g.userData.dragId = g.userData.C.id;
      g.userData.pickId = 'c-' + g.userData.C.id;
      upd();
    };
    show();
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => clearTip(),
      onDrop: async (g) => {
        const C = g.userData.C;
        let zi = -1;
        zones.forEach((z, i) => { if (Math.hypot(g.position.x - zx[i], g.position.z - ZZ) < ZR + 0.25) zi = i; });
        if (zi < 0) { await hop(g, SPAWN, 0.4, 0.2); return; }
        if (zi !== C.zone) {
          mistakes++; wrongHere++;
          shell.msg(`„${C.name}“ не е на мястото си. ` + (wrongHere >= 2
            ? 'Подсказка: помага това, което дава хумус или разрохква почвата. Вреди това, което не изгнива или е отровно.'
            : 'Помисли: помага ли това на растенията и на живите организми в почвата?'), 'bad');
          upd();
          await hop(g, SPAWN, 0.5, 0.3);
          return;
        }
        wrongHere = 0;
        g.userData.locked = true;
        delete g.userData.dragId;
        const [ox, oz] = slots[inZone[zi]++];
        await hop(g, new V3(zx[zi] + ox, 0, ZZ + oz), 0.4, 0.2);
        g.children.forEach((ch) => { if (ch.isSprite) ch.visible = false; });
        g.scale.setScalar(0.85);
        shell.msg(`Вярно! ${C.say}`, 'good');
        say(g, (C.zone ? '⚠️ ' : '🌱 ') + C.say, C.zone ? 'bad' : 'good', 0.55);
        cur++;
        if (cur < items.length) { show(); return; }
        upd();
        done();
      },
    });
    async function done() {
      shell.task('<p>Подреди всичко! Почвата е плодородна, когато в нея има <b>хумус, вода, въздух и живи организми</b>. Отпадъците и химикалите ѝ вредят.</p>');
      await wait(1.2);
      clearTip();
      if (narrow) fitView([GX + 0.3, 1.7, FZ], 1.9, 1.7, 0.28); else fitView([GX, 1.7, FZ], 2.6, 1.7, 0.28);
      await phase(1.5, (k) => { flower.scale.setScalar(Math.max(0.001, ease(k))); gStem.scale.y = 1 + 0.15 * k; });
      say(flower, '🌼 Здравата почва храни растенията!', 'good', 0.3);
      const c = shell.setControls('<button class="btn primary">Виж резултата</button>');
      c.querySelector('button').addEventListener('click', () => {
        clearTip();
        scores.push(stepScore(mistakes, 3));
        const ratio = scores.reduce((x, y) => x + y, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
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
