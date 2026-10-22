// 3.2.4 „Кой какво яде: хранителни вериги“ — 3D ливада край езеро.
// Стъпки: опознай → разпредели по храна → построй верига → какво ще стане, ако…
import { createStage, labelSprite, mat, zoneRing, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const KINDS = {
  herb: { name: 'Растителноядни', one: 'растителноядно', color: 0x2fa84f, css: '#2fa84f' },
  carn: { name: 'Месоядни', one: 'месоядно', color: 0xd9452b, css: '#d9452b' },
  omni: { name: 'Всеядни', one: 'всеядно', color: 0xf09a1a, css: '#f09a1a' },
};

// Кой какво яде (само връзките вътре в сцената се използват за веригите).
const LIVING = [
  { id: 'grass', label: 'Трева', plant: true, pos: [1.2, 0, 0.4],
    note: 'Растение. Само си прави храната от вода, въздух и светлина.' },
  { id: 'berries', label: 'Малини', plant: true, pos: [6.2, 0, -3.2],
    note: 'Храст с плодове. Растение — само си прави храната.' },
  { id: 'oak', label: 'Дъб', plant: true, pos: [-7.2, 0, -0.6],
    note: 'Дърво. Жълъдите му са храна за много животни.' },
  { id: 'grasshopper', label: 'Скакалец', kind: 'herb', eats: ['grass'], pos: [2.8, 0, 1.9],
    note: 'Яде листа и трева. Растителнояден.' },
  { id: 'hare', label: 'Заек', kind: 'herb', eats: ['grass'], pos: [-1.4, 0, 2.0],
    note: 'Яде трева, листа и кора. Растителнояден.' },
  { id: 'deer', label: 'Сърна', kind: 'herb', eats: ['grass', 'oak'], pos: [-3.6, 0, -1.2],
    note: 'Пасе трева и яде листа и жълъди. Растителноядна.' },
  { id: 'frog', label: 'Жаба', kind: 'carn', eats: ['grasshopper'], pos: [-2.4, 0, -2.0],
    note: 'Лови насекоми — скакалци, мухи. Месоядна.' },
  { id: 'stork', label: 'Щъркел', kind: 'carn', eats: ['frog', 'grasshopper'], pos: [-4.6, 0, -4.4],
    note: 'Лови жаби, скакалци, мишки. Месояден.' },
  { id: 'wolf', label: 'Вълк', kind: 'carn', eats: ['hare', 'deer'], pos: [4.6, 0, -1.0],
    note: 'Ловува зайци и сърни. Месояден хищник.' },
  { id: 'bear', label: 'Мечка', kind: 'omni', eats: ['berries'], pos: [4.4, 0, -4.6],
    note: 'Яде малини, жълъди и мед, но и риба и насекоми. Всеядна.' },
  { id: 'boar', label: 'Дива свиня', kind: 'omni', eats: ['oak'], pos: [-5.4, 0, 1.8],
    note: 'Рови за жълъди и корени, яде и червеи и охлюви. Всеядна.' },
];
const byId = Object.fromEntries(LIVING.map((o) => [o.id, o]));
const ANIMALS = LIVING.filter((o) => !o.plant);
const POND = { x: -2.2, z: -4.6, rx: 3.2, rz: 2.0 };

// ---------- модели ----------
function legs(g, color, { n = 4, len = 0.5, r = 0.06, spreadX = 0.5, spreadZ = 0.18, y = 0 }) {
  const m = mat(color);
  const pts = n === 2 ? [[0, spreadZ], [0, -spreadZ]] : [[spreadX, spreadZ], [spreadX, -spreadZ], [-spreadX, spreadZ], [-spreadX, -spreadZ]];
  for (const [x, z] of pts) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, len, 8), m);
    l.position.set(x, y + len / 2, z);
    g.add(l);
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
  const head = new THREE.Group();
  head.position.set(o.len / 2 + o.r * 0.9, o.legLen + o.r * (1.4 + (o.neck || 0)), 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(o.headR, 16, 12), bodyM);
  head.add(skull);
  if (o.snout) {
    const sn = new THREE.Mesh(new THREE.CylinderGeometry(o.headR * 0.35, o.headR * 0.55, o.snout, 10), mat(o.snoutColor || o.color));
    sn.rotation.z = -Math.PI / 2;
    sn.position.x = o.headR * 0.7 + o.snout / 2 - 0.05;
    sn.position.y = -o.headR * 0.2;
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
  if (o.tusks) {
    for (const s of [1, -1]) {
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 6), mat(0xf4efe0));
      t.position.set(o.headR * 0.9 + o.snout * 0.6, -o.headR * 0.25, s * o.headR * 0.3);
      t.rotation.z = 0.4;
      head.add(t);
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
      : new THREE.Mesh(new THREE.ConeGeometry(o.r * 0.35, o.r * 1.8, 8), bodyM);
    t.position.set(-o.len / 2 - o.r * 0.9, o.legLen + o.r * 1.1, 0);
    if (o.tail !== 'puff') t.rotation.z = 2.1;
    g.add(t);
    g.userData.tail = t;
  }
  legs(g, o.legColor || o.color, { len: o.legLen, r: o.r * 0.22, spreadX: o.len * 0.45, spreadZ: o.r * 0.5 });
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
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), green);
    eye.position.set(0.18, 0.38, s * 0.14);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0x111111));
    pupil.position.set(0.24, 0.4, s * 0.15);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.25, 4, 8), green);
    leg.position.set(-0.22, 0.08, s * 0.26);
    leg.rotation.z = 1.2;
    g.add(eye, pupil, leg);
  }
  g.userData.hopper = true;
  return g;
}

function grasshopperModel() {
  const g = new THREE.Group();
  const green = mat(0x8bc34a);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.4, 6, 10), green);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.16;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), green);
  head.position.set(0.28, 0.2, 0);
  g.add(head);
  for (const s of [1, -1]) {
    const hind = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.32, 4, 6), mat(0x689f38));
    hind.position.set(-0.08, 0.2, s * 0.09);
    hind.rotation.z = -0.9;
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 4), mat(0x33691e));
    ant.position.set(0.38, 0.32, s * 0.04);
    ant.rotation.z = -0.8;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(0x111111));
    eye.position.set(0.33, 0.23, s * 0.055);
    g.add(hind, ant, eye);
  }
  legs(g, 0x689f38, { len: 0.12, r: 0.012, spreadX: 0.12, spreadZ: 0.06 });
  g.scale.setScalar(1.6);
  g.userData.hopper = true;
  return g;
}

function storkModel() {
  const g = new THREE.Group();
  const white = mat(0xf7f7f2);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), white);
  body.scale.set(1.5, 0.9, 0.85);
  body.position.y = 1.0;
  g.add(body);
  const wing = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), mat(0x222222));
  wing.scale.set(1.2, 0.45, 0.9);
  wing.position.set(-0.22, 1.05, 0);
  g.add(wing);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8), white);
  neck.position.set(0.42, 1.32, 0);
  neck.rotation.z = -0.35;
  g.add(neck);
  const head = new THREE.Group();
  head.position.set(0.55, 1.62, 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), white));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.42, 8), mat(0xe53935));
  beak.rotation.z = -Math.PI / 2 - 0.25;
  beak.position.set(0.26, -0.05, 0);
  head.add(beak);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), mat(0x111111));
    e.position.set(0.06, 0.03, s * 0.08);
    head.add(e);
  }
  g.add(head);
  g.userData.head = head;
  legs(g, 0xe53935, { n: 2, len: 0.75, r: 0.025, spreadZ: 0.1 });
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
  // жълъди
  for (let i = 0; i < 5; i++) {
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0x9c6b30));
    a.position.set(Math.cos(i * 1.3) * 0.9, 0.05, Math.sin(i * 1.3) * 0.9);
    g.add(a);
  }
  return g;
}

function berryBush() {
  const g = new THREE.Group();
  const leaf = mat(0x2e7d32, { flat: true });
  for (const [x, y, z, r] of [[0, 0.5, 0, 0.6], [0.5, 0.4, 0.2, 0.45], [-0.45, 0.42, -0.1, 0.45], [0.1, 0.85, 0, 0.4]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaf);
    b.position.set(x, y, z);
    g.add(b);
  }
  const red = mat(0xd81b60);
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4;
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), red);
    berry.position.set(Math.cos(a) * 0.62, 0.35 + (i % 4) * 0.15, Math.sin(a) * 0.5);
    g.add(berry);
  }
  return g;
}

function grassPatch() {
  const g = new THREE.Group();
  const blades = [];
  const m = mat(0x6cbf3c);
  for (let i = 0; i < 26; i++) {
    const h = 0.35 + Math.random() * 0.35;
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.05, h, 4), m);
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.7;
    b.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
    b.userData.phase = Math.random() * 6;
    g.add(b);
    blades.push(b);
  }
  // невидима зона за кликване
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.7, 12), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.35;
  g.add(hit);
  g.userData.blades = blades;
  return g;
}

const BUILDERS = {
  grass: grassPatch,
  berries: berryBush,
  oak: treeModel,
  grasshopper: grasshopperModel,
  frog: frogModel,
  stork: storkModel,
  hare: () => quadruped({ color: 0xa1887f, belly: 0xd7ccc8, r: 0.18, len: 0.28, legLen: 0.12, headR: 0.14, ears: 'long', tail: 'puff' }),
  deer: () => quadruped({ color: 0xa0673a, belly: 0xe8d2b8, r: 0.22, len: 0.55, legLen: 0.6, headR: 0.15, ears: 'pointy', tail: 'puff', neck: 1.4, snout: 0.12 }),
  wolf: () => quadruped({ color: 0x78808a, belly: 0xc9ced4, r: 0.22, len: 0.55, legLen: 0.38, headR: 0.17, ears: 'pointy', tail: 'bushy', snout: 0.2, snoutColor: 0x9aa1aa }),
  bear: () => quadruped({ color: 0x5d4037, r: 0.38, len: 0.55, legLen: 0.32, headR: 0.25, ears: 'round', snout: 0.16, snoutColor: 0x8d6e63 }),
  boar: () => quadruped({ color: 0x4e3b31, r: 0.26, len: 0.45, legLen: 0.22, headR: 0.18, ears: 'pointy', snout: 0.2, snoutColor: 0x6d4c41, tusks: true, tail: 'thin' }),
};

// Стрелка „храна → този, който я яде“, която се „изрисува“.
function arrowBetween(a, b, color = 0xff8f00) {
  const p0 = a.clone().setY(a.y + 0.9);
  const p2 = b.clone().setY(b.y + 0.9);
  const mid = p0.clone().lerp(p2, 0.5);
  mid.y += 1.2 + p0.distanceTo(p2) * 0.15;
  const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
  const geo = new THREE.TubeGeometry(curve, 40, 0.06, 8, false);
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4 });
  const tube = new THREE.Mesh(geo, m);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 12), m);
  const end = curve.getPoint(0.94);
  const tan = curve.getTangent(0.94);
  head.position.copy(end);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan.normalize());
  head.visible = false;
  const g = new THREE.Group();
  g.add(tube, head);
  const total = geo.index.count;
  geo.setDrawRange(0, 0);
  g.userData.grow = { k: 0, total, head, geo };
  return g;
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  const STEPS = ['Опознай ливадата', 'Кой какво яде?', 'Построй хранителна верига', 'Какво ще стане, ако…'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xbfe3ff, camPos: [0, 7.5, 12], target: [0, 0.6, 0], shadows: true,
    fog: { color: 0xbfe3ff, near: 22, far: 48 }, maxDistance: 22,
  });
  const { scene } = stage;

  // Земя с леки неравности и петна в различни зелени.
  const groundGeo = new THREE.PlaneGeometry(50, 50, 80, 80);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const colors = [];
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const inPond = ((x - POND.x) / POND.rx) ** 2 + ((z - POND.z) / POND.rz) ** 2;
    let y = Math.sin(x * 0.35) * Math.cos(z * 0.3) * 0.12 + Math.sin(x * 1.3 + z) * 0.03;
    if (inPond < 1.25) y -= (1.25 - inPond) * 0.5;
    pos.setY(i, y);
    const t = 0.5 + 0.5 * Math.sin(x * 0.7 + Math.cos(z * 0.5) * 2);
    c.setHSL(0.27 + t * 0.04, 0.5, 0.42 + t * 0.08);
    if (inPond < 1.5) c.lerp(new THREE.Color(0xb8a272), Math.min(1, (1.5 - inPond) * 2));
    colors.push(c.r, c.g, c.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  ground.receiveShadow = true;
  scene.add(ground);

  // Езеро.
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.MeshStandardMaterial({ color: 0x3d8fd1, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 })
  );
  water.rotation.x = -Math.PI / 2;
  water.scale.set(POND.rx, POND.rz, 1);
  water.position.set(POND.x, -0.08, POND.z);
  scene.add(water);
  const reedM = mat(0x5d7f2a);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + Math.random() * 0.2;
    const h = 0.6 + Math.random() * 0.6;
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, h, 5), reedM);
    r.position.set(POND.x + Math.cos(a) * POND.rx * 1.02, h / 2 - 0.1, POND.z + Math.sin(a) * POND.rz * 1.05);
    if (i % 3 === 0) {
      const top = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 6), mat(0x6d4c41));
      top.position.y = h / 2;
      r.add(top);
    }
    scene.add(r);
  }
  // Лилии.
  for (let i = 0; i < 5; i++) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), mat(0x43a047));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(POND.x - 1.5 + i * 0.7, -0.06, POND.z + Math.sin(i * 2) * 0.8);
    scene.add(pad);
  }

  // Декоративни дървета в далечината и цветя.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3;
    const t = treeModel();
    t.scale.setScalar(0.8 + Math.random() * 0.6);
    t.position.set(Math.cos(a) * (13 + Math.random() * 3), 0, Math.sin(a) * (11 + Math.random() * 3));
    t.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(t);
  }
  const flowerCols = [0xffffff, 0xffeb3b, 0xe91e63, 0x9c27b0];
  for (let i = 0; i < 60; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(flowerCols[i % 4]));
    const x = (Math.random() - 0.5) * 16;
    const z = (Math.random() - 0.5) * 12;
    if (((x - POND.x) / POND.rx) ** 2 + ((z - POND.z) / POND.rz) ** 2 < 1.4) continue;
    f.position.set(x, 0.12, z);
    scene.add(f);
  }

  // Организмите.
  const roots = new Map();
  for (const o of LIVING) {
    const g = BUILDERS[o.id]();
    g.position.set(...o.pos);
    g.rotation.y = Math.random() * Math.PI * 2;
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; } });
    g.userData.pickId = o.id;
    if (!o.plant) g.userData.dragId = o.id;
    g.userData.locked = true;
    g.userData.home = new THREE.Vector3(...o.pos);
    g.userData.phase = Math.random() * 6;
    const box = new THREE.Box3().setFromObject(g);
    const top = box.max.y - g.position.y;
    const label = labelSprite(o.label, { size: 0.28 });
    label.position.y = top + 0.3;
    label.userData.isLabel = true;
    g.add(label);
    g.userData.top = top + 0.55;
    g.userData.label = label;
    if (!o.plant) addHitBox(g, 0.9);
    scene.add(g);
    roots.set(o.id, g);
  }

  // Анимация: дишане, подскоци, люлеене на тревата, стрелки, плъзгане към цел.
  const moving = new Map();
  stage.tick((dt, t) => {
    water.material.color.setHSL(0.57, 0.55, 0.52 + Math.sin(t * 0.8) * 0.02);
    for (const [id, g] of roots) {
      if (!g.visible) continue;
      const o = byId[id];
      if (o.id === 'grass') {
        for (const b of g.userData.blades) b.rotation.z = Math.sin(t * 2 + b.userData.phase) * 0.12;
        continue;
      }
      if (o.plant) continue;
      const mv = moving.get(g);
      if (mv) {
        mv.k = Math.min(1, mv.k + dt / mv.dur);
        const e = 1 - Math.pow(1 - mv.k, 3);
        g.position.lerpVectors(mv.from, mv.to, e);
        g.position.y = mv.to.y + Math.sin(e * Math.PI) * 0.6;
        if (mv.k >= 1) { moving.delete(g); g.position.copy(mv.to); }
        continue;
      }
      const ph = g.userData.phase;
      if (g.userData.hopper) {
        const cyc = (t * 0.6 + ph) % 3;
        g.position.y = cyc < 0.4 ? Math.sin((cyc / 0.4) * Math.PI) * 0.25 : 0;
      } else if (g.userData.head) {
        g.userData.head.rotation.y = Math.sin(t * 0.7 + ph) * 0.35;
        g.userData.head.rotation.z = Math.sin(t * 0.5 + ph) * 0.08;
      }
      if (g.userData.tail) g.userData.tail.rotation.x = Math.sin(t * 3 + ph) * 0.3;
    }
    for (const a of arrows) {
      const gr = a.userData.grow;
      if (gr.k < 1) {
        gr.k = Math.min(1, gr.k + dt * 1.6);
        gr.geo.setDrawRange(0, Math.floor((gr.total * gr.k) / 3) * 3);
        if (gr.k >= 1) gr.head.visible = true;
      }
    }
  });

  function moveTo(g, to, dur = 0.6) {
    moving.set(g, { from: g.position.clone(), to: to.clone(), k: 0, dur });
  }

  // Балончета с текст до обектите.
  let tip = null;
  function say(id, html, cls = '') {
    if (tip) tip.remove();
    const g = roots.get(id);
    tip = stage.bubble(g, html, { lift: g.userData.top, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }


  // Резултати по стъпки.
  const scores = [];
  let arrows = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    const seen = new Set();
    shell.task(`<p>На ливадата край езерото живеят растения и животни.</p>
      <p><b>Кликни върху поне 5 животни</b>, за да разбереш какво ядат.</p>`);
    const ctrl = shell.setControls('<button class="btn primary" disabled>Напред →</button>');
    const next = ctrl.querySelector('button');
    const upd = () => shell.score(`Разгледани животни: ${[...seen].filter((id) => !byId[id].plant).length} от ${ANIMALS.length}`);
    upd();
    clickHandler = (id) => {
      if (!id) return clearTip();
      const o = byId[id];
      say(id, `<b>${esc(o.label)}</b><br>${esc(o.note)}`);
      seen.add(id);
      upd();
      if ([...seen].filter((x) => !byId[x].plant).length >= 5) {
        next.disabled = false;
        shell.msg('Браво! Можеш да продължиш или да разгледаш още.', 'good');
      }
    };
    next.addEventListener('click', step2);
    stage.flyTo([0, 7.5, 12], [0, 0.6, 0]);
  }

  // ---------- 2. Разпредели ----------
  let stopDrag = null;
  const zones = {};
  function step2() {
    shell.step(1);
    clearTip();
    shell.msg('');
    const zx = { herb: -4, carn: 0, omni: 4 };
    for (const k of Object.keys(KINDS)) {
      const z = zoneRing(KINDS[k].color, 1.5);
      z.position.set(zx[k], 0.05, 6.2);
      const lbl = labelSprite(KINDS[k].name, { size: 0.36, color: '#fff', bg: KINDS[k].css, border: KINDS[k].css });
      lbl.position.set(0, 0.5, 1.75);
      z.add(lbl);
      scene.add(z);
      zones[k] = { group: z, members: [] };
    }
    stage.flyTo([0, 9, 15.5], [0, 0, 2.6]);
    shell.task(`<p>Някои животни ядат само растения, други — само животни, а трети — и двете.</p>
      <p><b>Провлачи всяко животно</b> в правилния кръг отпред.</p>
      <p class="small">Подсказка: кликни върху животното, за да видиш какво яде.</p>`);
    shell.setControls('');
    let mistakes = 0;
    let placed = 0;
    const upd = () => shell.score(`Подредени: ${placed} от ${ANIMALS.length} · грешки: ${mistakes}`);
    upd();
    for (const a of ANIMALS) roots.get(a.id).userData.locked = false;
    clickHandler = (id) => {
      if (!id) return clearTip();
      const o = byId[id];
      say(id, `<b>${esc(o.label)}</b><br>${esc(o.note)}`);
    };
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => clearTip(),
      onDrop: (g, p, start) => {
        const id = g.userData.pickId;
        const o = byId[id];
        let target = null;
        for (const k of Object.keys(zones)) {
          const zp = zones[k].group.position;
          if (Math.hypot(p.x - zp.x, p.z - zp.z) < 1.6) target = k;
        }
        if (!target) { moveTo(g, start, 0.4); return; }
        if (target === o.kind) {
          const zone = zones[target];
          const n = zone.members.length;
          const slot = new THREE.Vector3(
            zone.group.position.x + Math.cos(n * 2.1) * 0.75 * (n ? 1 : 0),
            0, zone.group.position.z + Math.sin(n * 2.1) * 0.65 * (n ? 1 : 0)
          );
          zone.members.push(id);
          moveTo(g, slot, 0.35);
          g.rotation.y = -Math.PI / 2 + 0.3;
          g.userData.locked = true;
          placed++;
          say(id, `✔ <b>${esc(o.label)}</b> — ${esc(KINDS[o.kind].one)} животно.`, 'good');
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          moveTo(g, start, 0.5);
          say(id, `✘ ${esc(o.note)}`, 'bad');
          shell.msg(`Не е в „${KINDS[target].name}“. Прочети какво яде.`, 'bad');
        }
        upd();
        if (placed === ANIMALS.length) {
          scores.push(stepScore(mistakes, 4));
          stopDrag(); stopDrag = null;
          shell.msg(mistakes ? `Готово! Грешки: ${mistakes}.` : 'Без нито една грешка! 🎉', 'good');
          const ctrl = shell.setControls('<button class="btn primary">Напред →</button>');
          ctrl.querySelector('button').addEventListener('click', step3);
        }
      },
    });
  }

  // ---------- 3. Верига ----------
  function step3() {
    shell.step(2);
    clearTip();
    shell.msg('');
    for (const k of Object.keys(zones)) zones[k].group.visible = false;
    for (const a of ANIMALS) {
      const g = roots.get(a.id);
      g.userData.locked = true;
      moveTo(g, g.userData.home, 0.8);
    }
    stage.flyTo([0, 9, 12.5], [0, 0.5, -0.5]);
    let mistakes = 0;
    let chain = [];
    let task = 0;
    const TASKS = [
      { text: 'Направи <b>верига от 4 звена</b>. Започни от растение и кликни поред кой кого изяжда.', ok: (ch) => ch.length === 4 },
      { text: 'Сега направи <b>друга верига, която завършва с вълка</b>.', ok: (ch) => ch[ch.length - 1] === 'wolf' && ch.length >= 3 },
    ];
    const drawTask = () => {
      shell.task(`<p>${TASKS[task].text}</p>
        <p class="small">Стрелката сочи от храната към този, който я яде: трева → заек.</p>
        <p>Веригата: <b>${chain.length ? chain.map((id) => esc(byId[id].label)).join(' → ') : '—'}</b></p>`);
      shell.score(`Задача ${task + 1} от 2 · грешки: ${mistakes}`);
    };
    const clearChain = () => {
      for (const a of arrows) scene.remove(a);
      arrows = [];
      chain = [];
    };
    drawTask();
    const ctrl = shell.setControls('<button class="btn">Започни веригата отначало</button>');
    ctrl.querySelector('button').addEventListener('click', () => { clearChain(); clearTip(); shell.msg(''); drawTask(); });
    clickHandler = (id) => {
      if (!id) return;
      const o = byId[id];
      if (!chain.length) {
        if (!o.plant) {
          mistakes++;
          say(id, `✘ Веригата започва от <b>растение</b> — то само си прави храната.`, 'bad');
          shell.msg('Започни от растение.', 'bad');
        } else {
          chain.push(id);
          say(id, `<b>${esc(o.label)}</b> — начало на веригата. Кой яде ${esc(o.label.toLowerCase())}?`, 'good');
          shell.msg('');
        }
        return drawTask();
      }
      const prev = chain[chain.length - 1];
      if (chain.includes(id)) return;
      if (!o.eats || !o.eats.includes(prev)) {
        mistakes++;
        say(id, `✘ <b>${esc(o.label)}</b> не яде ${esc(byId[prev].label.toLowerCase())}. ${esc(o.note)}`, 'bad');
        shell.msg('Тази връзка не е вярна.', 'bad');
        if (mistakes >= 3 && task === 0) shell.msg('Подсказка: кой яде скакалци? А кой яде жаби?', 'bad');
        return drawTask();
      }
      const arrow = arrowBetween(roots.get(prev).position, roots.get(id).position);
      scene.add(arrow);
      arrows.push(arrow);
      chain.push(id);
      say(id, `✔ ${esc(byId[prev].label)} → <b>${esc(o.label)}</b>`, 'good');
      if (TASKS[task].ok(chain)) {
        shell.msg(`Вярно! ${chain.map((x) => byId[x].label).join(' → ')}`, 'good');
        drawTask();
        const done = task === TASKS.length - 1;
        const c2 = shell.setControls(`<button class="btn primary">${done ? 'Напред →' : 'Следваща задача →'}</button>`);
        clickHandler = null;
        c2.querySelector('button').addEventListener('click', () => {
          if (done) { scores.push(stepScore(mistakes, 4)); step4(); return; }
          task++;
          clearChain(); clearTip(); shell.msg('');
          drawTask();
          const c3 = shell.setControls('<button class="btn">Започни веригата отначало</button>');
          c3.querySelector('button').addEventListener('click', () => { clearChain(); clearTip(); shell.msg(''); drawTask(); });
          clickHandler = handler;
        });
        return;
      }
      const eaters = LIVING.filter((x) => x.eats && x.eats.includes(id));
      if (!eaters.length) {
        shell.msg(`${o.label} не е храна за никого на тази ливада. Веригата свърши, но не отговаря на задачата — започни друга.`, 'bad');
      } else {
        shell.msg('');
      }
      drawTask();
    };
    const handler = clickHandler;
  }

  // ---------- 4. Какво ще стане, ако… ----------
  function step4() {
    shell.step(3);
    clearTip();
    shell.msg('');
    for (const a of arrows) scene.remove(a);
    arrows = [];
    const show = ['grass', 'grasshopper', 'frog', 'stork'];
    for (let i = 0; i < show.length - 1; i++) {
      const ar = arrowBetween(roots.get(show[i]).position, roots.get(show[i + 1]).position);
      scene.add(ar);
      arrows.push(ar);
    }
    stage.flyTo([-1, 6.5, 8.5], [-1, 0.5, -0.8]);
    say('frog', '<b>Представи си:</b> всички жаби от езерото изчезват.', 'wide');
    const opts = (name) => `<div class="choices" data-q="${name}">
      <button class="choice" data-v="up">⬆ Ще станат повече</button>
      <button class="choice" data-v="down">⬇ Ще станат по-малко</button>
      <button class="choice" data-v="same">＝ Няма да се промени</button></div>`;
    shell.task(`<p>Веригата е: трева → скакалец → жаба → щъркел.</p>
      <p><b>Ако изчезнат жабите, какво ще стане със скакалците?</b></p>${opts('gh')}
      <p><b>А с щъркелите?</b></p>${opts('st')}`);
    const ans = {};
    container.querySelectorAll('.xp-task .choices').forEach((box) => {
      box.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        box.querySelectorAll('.choice').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        ans[box.dataset.q] = b.dataset.v;
        check.disabled = !(ans.gh && ans.st);
      }));
    });
    const ctrl = shell.setControls('<button class="btn primary" disabled>Провери в природата</button>');
    const check = ctrl.querySelector('button');
    check.addEventListener('click', () => {
      check.remove();
      const good = (ans.gh === 'up' ? 1 : 0) + (ans.st === 'down' ? 1 : 0);
      container.querySelectorAll('.xp-task .choices').forEach((box) => {
        const want = box.dataset.q === 'gh' ? 'up' : 'down';
        box.querySelectorAll('.choice').forEach((b) => {
          b.disabled = true;
          if (b.dataset.v === want) b.classList.add('right');
          else if (b.classList.contains('on')) b.classList.add('wrong');
        });
      });
      runSimulation(good);
    });
  }

  function runSimulation(good) {
    clearTip();
    const frog = roots.get('frog');
    let k = 0;
    const extra = [];
    const stopFade = stage.tick((dt) => {
      k += dt;
      const s = Math.max(0.001, 1 - k);
      frog.scale.setScalar(s);
      if (k >= 1) {
        frog.visible = false;
        stopFade();
        // Скакалците се множат.
        const base = roots.get('grasshopper').position;
        for (let i = 0; i < 7; i++) {
          const g = grasshopperModel();
          g.position.set(base.x + Math.cos(i) * (0.6 + i * 0.12), 0, base.z + Math.sin(i * 1.7) * (0.6 + i * 0.1));
          g.rotation.y = Math.random() * 6;
          g.userData.pickId = 'grasshopper';
          g.userData.phase = Math.random() * 6;
          g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
          scene.add(g);
          extra.push(g);
        }
        // Щъркелът тръгва да търси храна другаде.
        const st = roots.get('stork');
        moveTo(st, new THREE.Vector3(st.position.x - 4, 0, st.position.z - 3), 2.2);
        for (const a of arrows) scene.remove(a);
        arrows = [];
        say('grass', '<b>Без жаби</b> скакалците стават много повече и изяждат много повече трева. Щъркелите имат по-малко храна и намаляват или отлитат другаде.', 'wide');
        shell.msg(good === 2 ? 'Позна и двете! 🎉' : good === 1 ? 'Позна едното.' : 'Виж какво стана.', good === 2 ? 'good' : 'bad');
        scores.push(good / 2);
        const ctrl = shell.setControls('<button class="btn primary">Виж резултата</button>');
        ctrl.querySelector('button').addEventListener('click', () => {
          clearTip();
          const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
          shell.finish(ratio, onComplete, () => restart(extra));
        });
      }
    });
    // подскачащи нови скакалци
    stage.tick((dt, t) => {
      for (const g of extra) {
        const cyc = (t * 0.8 + g.userData.phase) % 2;
        g.position.y = cyc < 0.35 ? Math.sin((cyc / 0.35) * Math.PI) * 0.3 : 0;
      }
    });
  }

  function restart(extra = []) {
    for (const g of extra) scene.remove(g);
    for (const a of arrows) scene.remove(a);
    arrows = [];
    for (const k of Object.keys(zones)) { scene.remove(zones[k].group); delete zones[k]; }
    for (const [id, g] of roots) {
      g.visible = true;
      g.scale.setScalar(byId[id].id === 'grasshopper' ? 1.6 : 1);
      g.position.copy(g.userData.home);
      g.userData.locked = true;
    }
    if (stopDrag) { stopDrag(); stopDrag = null; }
    scores.length = 0;
    step1();
  }

  step1();
  return { dispose() { if (stopDrag) stopDrag(); stage.dispose(); } };
}

