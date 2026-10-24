// 4.2.2 „Звук и шум“ — 3D музикална стая: барабан с оризови зрънца, китара, линийка на ръба на масата,
// камертон във вода и шумомер на стената.
// Стъпки: опознай → накарай телата да трептят → шумомер (тихо / нормално / вредно) → пази слуха си.
// Звукът е само по желание: тих, кратък и пуска се само след клик. Всичко се вижда и без него.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const CSS = `
.sound-mute { position: absolute; right: 8px; top: 8px; z-index: 5; font: inherit; font-size: 0.85rem; font-weight: 700;
  padding: 5px 10px; border-radius: 999px; border: 2px solid #cfd8e3; background: rgba(255,255,255,0.95); cursor: pointer; }
.sound-mute.on { border-color: #1865f2; }
.sound-q { margin-top: 10px; }
.sound-vol { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
.sound-vol input { flex: 1; min-width: 0; accent-color: #1865f2; }
.sound-vol b { min-width: 4.5em; text-align: right; }
.sound-habits { display: grid; gap: 6px; margin: 6px 0; }
.sound-habits .choice { padding: 8px 10px; }
`;

const ZONES = [
  { id: 'quiet', name: 'тихо', range: 'под 40 dB', max: 40, color: 0x43a047, css: '#43a047' },
  { id: 'normal', name: 'нормално', range: '40 – 80 dB', max: 80, color: 0xfbc02d, css: '#c79100' },
  { id: 'harm', name: 'вредно', range: 'над 80 dB', max: 200, color: 0xe53935, css: '#e53935' },
];
const zoneOf = (db) => ZONES.find((z) => db < z.max) || ZONES[2];

// ---------- помощни модели ----------
const UP = new THREE.Vector3(0, 1, 0);
const tmpA = new THREE.Vector3();
function box(w, h, d, color, extra) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra)); }
function cyl(rt, rb, h, color, seg = 16) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color)); }
function setRod(m, a, b) {
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.scale.y = Math.max(1e-3, a.distanceTo(b));
  m.quaternion.setFromUnitVectors(UP, tmpA.copy(b).sub(a).normalize());
}

function childModel(shirt, phones = false) {
  const g = new THREE.Group();
  const skin = mat(0xf0c3a0);
  for (const s of [1, -1]) {
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.4, 4, 8), mat(0x3949ab));
    l.position.set(s * 0.08, 0.27, 0);
    g.add(l);
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.28, 4, 10), mat(shirt));
  torso.position.y = 0.72;
  const head = new THREE.Group();
  head.position.y = 1.06;
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), skin);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5d4037));
  hair.position.y = 0.02;
  head.add(hd, hair);
  for (const s of [1, -1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), skin);
    ear.position.set(s * 0.12, 0, 0);
    head.add(ear);
  }
  if (phones) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 6, 20, Math.PI), mat(0x263238));
    band.position.y = 0.0;
    head.add(band);
    for (const s of [1, -1]) {
      const cup = cyl(0.06, 0.06, 0.05, 0xe53935, 12);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(s * 0.14, 0, 0);
      head.add(cup);
    }
  }
  g.add(torso, head);
  const arms = [];
  for (const s of [1, -1]) {
    const sh = new THREE.Group();
    sh.position.set(s * 0.18, 0.86, 0);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.28, 4, 8), skin);
    a.position.y = -0.17;
    sh.add(a);
    g.add(sh);
    arms.push(sh);
  }
  g.userData.arms = arms;
  g.userData.head = head;
  return g;
}

function handModel() {
  const g = new THREE.Group();
  const skin = mat(0xf0c3a0);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), skin);
  palm.scale.set(1.2, 0.45, 1);
  g.add(palm);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.12, 3, 6), skin);
    f.rotation.x = Math.PI / 2;
    f.position.set(-0.09 + i * 0.06, 0, 0.17);
    g.add(f);
  }
  return g;
}

function drumModel() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const leg = cyl(0.025, 0.025, 0.5, 0x90a4ae, 6);
    leg.position.set(Math.cos(a) * 0.5, 0.25, Math.sin(a) * 0.5);
    g.add(leg);
  }
  const shellM = cyl(0.7, 0.7, 0.55, 0xc62828, 28);
  shellM.position.y = 0.78;
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.035, 6, 32), mat(0xcfd8dc));
  rimT.rotation.x = Math.PI / 2;
  rimT.position.y = 1.06;
  const rimB = rimT.clone();
  rimB.position.y = 0.5;
  const skin = cyl(0.68, 0.68, 0.02, 0xfff8e1, 28);
  skin.position.y = 1.06;
  g.add(shellM, rimT, rimB, skin);
  const grains = [];
  const gm = mat(0xffffff);
  for (let i = 0; i < 16; i++) {
    const r = 0.12 + Math.random() * 0.45;
    const a = Math.random() * Math.PI * 2;
    const gr = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.03, 2, 4), gm);
    gr.rotation.z = Math.PI / 2;
    gr.rotation.y = a;
    gr.position.set(Math.cos(a) * r, 1.085, Math.sin(a) * r);
    gr.userData.ph = Math.random() * 6;
    gr.userData.k = 1 - r / 0.65;
    grains.push(gr);
    g.add(gr);
  }
  const stick = new THREE.Group();
  const st = cyl(0.025, 0.02, 0.8, 0xd7a86e, 8);
  st.rotation.z = Math.PI / 2;
  st.position.x = 0.4;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xd7a86e));
  tip.position.x = 0.02;
  stick.add(st, tip);
  stick.position.set(0.1, 1.2, 0.25);
  g.add(stick);
  g.userData = { skin, grains, stick, top: 1.06 };
  return g;
}

// Китара изправена на стойка; една струна е подчертана и трепти.
const NSEG = 14;
function guitarModel() {
  const g = new THREE.Group();
  const stand = box(0.6, 0.08, 0.4, 0x37474f);
  stand.position.y = 0.04;
  g.add(stand);
  const body = new THREE.Group();
  const lower = cyl(0.42, 0.42, 0.18, 0xd38b3c, 24);
  lower.rotation.x = Math.PI / 2;
  lower.position.y = 0.55;
  const upper = cyl(0.32, 0.32, 0.18, 0xd38b3c, 24);
  upper.rotation.x = Math.PI / 2;
  upper.position.y = 1.0;
  const hole = cyl(0.11, 0.11, 0.01, 0x3e2723, 18);
  hole.rotation.x = Math.PI / 2;
  hole.position.set(0, 0.86, 0.095);
  const bridge = box(0.3, 0.05, 0.03, 0x4e342e);
  bridge.position.set(0, 0.5, 0.1);
  body.add(lower, upper, hole, bridge);
  const neck = box(0.12, 1.0, 0.07, 0x6d4c41);
  neck.position.set(0, 1.75, 0.03);
  const head = box(0.16, 0.25, 0.07, 0x4e342e);
  head.position.set(0, 2.36, 0.03);
  g.add(body, neck, head);
  const y0 = 0.5;
  const y1 = 2.25;
  for (let i = 0; i < 6; i++) {
    if (i === 2) continue;
    const s = box(0.006, y1 - y0, 0.006, 0xbdbdbd);
    s.position.set(-0.05 + i * 0.02, (y0 + y1) / 2, 0.1);
    g.add(s);
  }
  const segs = [];
  const sm = mat(0xffd54f, { emissive: 0x6d5200 });
  for (let i = 0; i < NSEG; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 5), sm);
    g.add(m);
    segs.push(m);
  }
  g.userData = { segs, y0, y1, x: -0.01, z: 0.11 };
  return g;
}
function setString(g, amp, t) {
  const { segs, y0, y1, x, z } = g.userData;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const off = (s) => amp * Math.sin(Math.PI * s) * Math.sin(t * 38);
  for (let i = 0; i < NSEG; i++) {
    const s0 = i / NSEG;
    const s1 = (i + 1) / NSEG;
    a.set(x + off(s0), y0 + (y1 - y0) * s0, z);
    b.set(x + off(s1), y0 + (y1 - y0) * s1, z);
    setRod(segs[i], a, b);
  }
}

function tableModel(w, d, h, color = 0xa1887f) {
  const g = new THREE.Group();
  const top = box(w, 0.07, d, color);
  top.position.y = h;
  g.add(top);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const l = box(0.06, h, 0.06, 0x6d4c41);
    l.position.set(sx * (w / 2 - 0.08), h / 2, sz * (d / 2 - 0.08));
    g.add(l);
  }
  return g;
}

function rulerModel() {
  // маса + линийка, притисната с ръка; свободният край стърчи над ръба (+x).
  const g = tableModel(1.6, 0.9, 0.9);
  const H = 0.94;
  const fixed = box(0.6, 0.015, 0.12, 0xfdd835);
  fixed.position.set(0.5, H, 0);
  const pivot = new THREE.Group();
  pivot.position.set(0.8, H, 0);
  const free = box(0.75, 0.015, 0.12, 0xfdd835);
  free.position.x = 0.375;
  pivot.add(free);
  for (let i = 0; i < 12; i++) {
    const tick = box(0.006, 0.017, i % 5 === 0 ? 0.06 : 0.035, 0x424242);
    const x = 0.24 + i * 0.1;
    tick.position.set(x < 0.8 ? x : 0, H + 0.001, -0.04);
    if (x < 0.8) g.add(tick);
    else { tick.position.set(x - 0.8, 0.001, -0.04); pivot.add(tick); }
  }
  const hand = handModel();
  hand.position.set(0.55, H + 0.06, 0.02);
  hand.rotation.y = -Math.PI / 2;
  g.add(fixed, pivot, hand);
  g.userData = { pivot, top: 1.0, tipAnchor: free };
  return g;
}

function forkModel() {
  const g = tableModel(1.0, 0.8, 0.75, 0x90a4ae);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.25, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xe3f2fd, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  bowl.position.y = 0.91;
  const water = cyl(0.32, 0.32, 0.02, 0x42a5f5, 24);
  water.position.y = 0.98;
  const bottom = cyl(0.26, 0.26, 0.02, 0xb3e5fc, 24);
  bottom.position.y = 0.79;
  g.add(bowl, water, bottom);
  const fork = new THREE.Group();
  fork.position.set(0, 0.98, 0);
  const handle = cyl(0.025, 0.025, 0.45, 0x9e9e9e, 8);
  handle.position.y = 0.72;
  const yoke = box(0.16, 0.04, 0.04, 0x9e9e9e);
  yoke.position.y = 0.48;
  const tines = [];
  for (const s of [-1, 1]) {
    const t = box(0.03, 0.48, 0.04, 0xbdbdbd);
    t.position.set(s * 0.065, 0.24, 0);
    fork.add(t);
    tines.push(t);
  }
  fork.add(handle, yoke);
  g.add(fork);
  const hand = handModel();
  hand.position.set(0, 1.85, 0.05);
  hand.rotation.x = Math.PI / 2;
  hand.scale.setScalar(0.8);
  g.add(hand);
  const drops = [];
  const dm = mat(0x64b5f6);
  for (let i = 0; i < 14; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), dm);
    d.visible = false;
    d.userData = { t: 0, v: new THREE.Vector3() };
    g.add(d);
    drops.push(d);
  }
  g.userData = { tines, drops, water, top: 1.6 };
  return g;
}

function meterModel() {
  const g = new THREE.Group();
  const plate = box(1.9, 1.25, 0.08, 0x37474f);
  plate.position.y = 0.3;
  g.add(plate);
  const R = 0.78;
  const MAXDB = 130;
  const angOf = (db) => Math.PI - (Math.min(MAXDB, Math.max(0, db)) / MAXDB) * Math.PI;
  let from = 0;
  for (const z of ZONES) {
    const to = Math.min(MAXDB, z.max);
    const a0 = angOf(to);
    const a1 = angOf(from);
    const sec = new THREE.Mesh(new THREE.RingGeometry(R * 0.55, R, 24, 1, a0, a1 - a0), new THREE.MeshBasicMaterial({ color: z.color }));
    sec.position.z = 0.05;
    g.add(sec);
    from = to;
  }
  const pivot = new THREE.Group();
  pivot.position.z = 0.07;
  const needle = box(0.035, R * 0.95, 0.02, 0xffffff);
  needle.position.y = (R * 0.95) / 2;
  const hub = cyl(0.06, 0.06, 0.03, 0xffffff, 12);
  hub.rotation.x = Math.PI / 2;
  pivot.add(needle, hub);
  g.add(pivot);
  const lab = labelSprite('Шумомер', { size: 0.2 });
  lab.position.set(0, -0.18, 0.1);
  g.add(lab);
  g.userData = { pivot, angOf, db: 30, target: 30 };
  return g;
}

function waveRings(color) {
  // Пръстени-вълни, които се разширяват от трептящото тяло.
  const g = new THREE.Group();
  const rings = [];
  for (let i = 0; i < 6; i++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    r.userData.age = 99;
    g.add(r);
    rings.push(r);
  }
  g.userData = { rings, next: 0 };
  return g;
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const STEPS = ['Опознай стаята', 'Как се ражда звукът', 'Шумомер', 'Пази слуха си'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xf3e9dc, camPos: [0, 5.5, 10], target: [0, 1.2, 0], shadows: false, maxDistance: 22,
  });
  const { scene, camera } = stage;

  // ---------- стая ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(13, 11), mat(0xc49a6c));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 1.5;
  scene.add(floor);
  for (let i = -6; i <= 6; i += 0.8) {
    const ln = box(0.02, 0.002, 11, 0xa97f55);
    ln.position.set(i, 0.002, 1.5);
    scene.add(ln);
  }
  const wallM = mat(0xfff3e0);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(13, 5), wallM);
  back.position.set(0, 2.5, -3);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(11, 5), wallM);
  left.rotation.y = Math.PI / 2;
  left.position.set(-6.5, 2.5, 1.5);
  scene.add(back, left);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), mat(0x7986cb));
  rug.rotation.x = -Math.PI / 2;
  rug.scale.set(1.6, 1, 0.7);
  rug.position.set(0, 0.006, 0.6);
  scene.add(rug);
  // прозорец и пердета
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshBasicMaterial({ color: 0xbfe3ff }));
  win.position.set(-3.6, 2.7, -2.98);
  const frameV = box(0.06, 1.4, 0.04, 0xffffff); frameV.position.set(-3.6, 2.7, -2.96);
  const frameH = box(1.8, 0.06, 0.04, 0xffffff); frameH.position.set(-3.6, 2.7, -2.96);
  scene.add(win, frameV, frameH);
  const curtains = [];
  for (const s of [-1, 1]) {
    const c = box(0.45, 1.8, 0.04, 0x9575cd);
    c.position.set(-3.6 + s * 1.1, 2.6, -2.9);
    scene.add(c);
    curtains.push(c);
  }
  // ноти по стената
  for (const [x, y] of [[2.2, 3.6], [3.6, 3.9], [4.8, 3.4]]) {
    const n = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), new THREE.MeshBasicMaterial({ color: 0x5c6bc0 }));
    n.scale.set(1.25, 1, 1);
    n.position.set(x, y, -2.97);
    const st = box(0.03, 0.45, 0.01, 0x5c6bc0);
    st.position.set(x + 0.13, y + 0.22, -2.97);
    scene.add(n, st);
  }
  // прашинки във въздуха
  const motes = [];
  const moteM = new THREE.MeshBasicMaterial({ color: 0xfff8e1, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), moteM);
    m.position.set(-4.6 + Math.random() * 2.4, 0.5 + Math.random() * 3, -2.5 + Math.random() * 3);
    m.userData.ph = Math.random() * 6;
    scene.add(m);
    motes.push(m);
  }

  const drum = drumModel();
  drum.position.set(-3.4, 0, 0.4);
  const guitar = guitarModel();
  guitar.position.set(-1.2, 0, -1.6);
  const ruler = rulerModel();
  ruler.position.set(1.2, 0, -1.2);
  const fork = forkModel();
  fork.position.set(3.7, 0, 0.2);
  const meter = meterModel();
  meter.position.set(0.6, 3.2, -2.92);
  const kid = childModel(0x26a69a);
  kid.position.set(-0.9, 0, 1.6);
  kid.rotation.y = 0.3;
  scene.add(drum, guitar, ruler, fork, meter, kid);
  const kidPhones = childModel(0xff7043, true);
  kidPhones.position.set(0.3, 0, 1.4);
  kidPhones.visible = false;
  scene.add(kidPhones);

  const BODIES = {
    drum: { root: drum, label: 'Барабан', icon: '🥁', db: 80, freq: 110, act: '🥁 Удари барабана', lift: 1.35,
      note: 'Върху кожата на барабана има оризови зрънца. Гледай ги, когато удариш барабана.',
      on: 'Кожата трепти и зрънцата подскачат. Трептящата кожа издава звук.',
      off: 'Хванах кожата с ръка — тя спря да трепти и звукът спря. Зрънцата застинаха.' },
    guitar: { root: guitar, label: 'Китара', icon: '🎸', db: 65, freq: 196, act: '🎸 Дръпни струната', lift: 2.6,
      note: 'Струните са опънати. Жълтата струна ще дръпнем с пръст.',
      on: 'Струната трепти бързо насам-натам — виждаш я размазана. Така китарата звучи.',
      off: 'Хванах струната — тя спря да трепти и звукът спря.' },
    ruler: { root: ruler, label: 'Линийка', icon: '📏', db: 55, freq: 82, act: '📏 Огъни и пусни линийката', lift: 1.3,
      note: 'Линийката е притисната с ръка към масата, а краят ѝ стърчи над ръба.',
      on: 'Свободният край трепти нагоре-надолу и бръмчи.',
      off: 'Хванах края на линийката — тя спря да трепти и бръмченето спря.' },
    fork: { root: fork, label: 'Камертон', icon: '🍴', db: 45, freq: 440, act: '🔔 Удари камертона', lift: 1.9,
      note: 'Камертонът е метална вилица с два зъба. Зъбите му докосват водата в купата.',
      on: 'Зъбите трептят толкова бързо, че окото не ги вижда — но водата се разплисква! Звукът е тих и чист.',
      off: 'Хванах зъбите — те спряха да трептят, водата се успокои и звукът спря.' },
  };
  const WAVES = {};
  for (const [id, b] of Object.entries(BODIES)) {
    b.id = id;
    b.amp = 0;
    b.vib = false;
    b.root.userData.pickId = id;
    addHitBox(b.root, 1);
    const w = waveRings(0x1e88e5);
    scene.add(w);
    WAVES[id] = w;
  }
  meter.userData.pickId = 'meter';
  addHitBox(meter, 1);
  kid.userData.pickId = 'kid';
  addHitBox(kid, 1);
  const waveSrc = {
    drum: () => drum.localToWorld(new THREE.Vector3(0, 1.1, 0)),
    guitar: () => guitar.localToWorld(new THREE.Vector3(0, 1.3, 0.15)),
    ruler: () => ruler.localToWorld(new THREE.Vector3(1.3, 0.95, 0)),
    fork: () => fork.localToWorld(new THREE.Vector3(0, 1.3, 0)),
  };
  const hands = {};
  for (const id of Object.keys(BODIES)) {
    const h = handModel();
    h.visible = false;
    scene.add(h);
    hands[id] = h;
  }
  const handPos = {
    drum: () => drum.localToWorld(new THREE.Vector3(0, 1.13, 0)),
    guitar: () => guitar.localToWorld(new THREE.Vector3(0, 1.4, 0.2)),
    ruler: () => ruler.localToWorld(new THREE.Vector3(1.35, 1.0, 0)),
    fork: () => fork.localToWorld(new THREE.Vector3(0, 1.3, 0.12)),
  };

  // ---------- звук (само по желание) ----------
  let soundOn = false;
  let actx = null;
  const voices = {};
  const muteBtn = document.createElement('button');
  muteBtn.className = 'sound-mute';
  const drawMute = () => { muteBtn.textContent = soundOn ? '🔈 Звук: вкл.' : '🔇 Звук: изкл.'; muteBtn.classList.toggle('on', soundOn); };
  drawMute();
  muteBtn.addEventListener('click', () => { soundOn = !soundOn; if (!soundOn) Object.keys(voices).forEach(stopTone); drawMute(); });
  ['pointerdown', 'pointerup'].forEach((ev) => muteBtn.addEventListener(ev, (e) => e.stopPropagation()));
  shell.stageEl.appendChild(muteBtn);
  function playTone(id, freq, loud = 1) {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      stopTone(id);
      const o = actx.createOscillator();
      const gn = actx.createGain();
      o.type = id === 'ruler' ? 'triangle' : 'sine';
      o.frequency.value = freq;
      const now = actx.currentTime;
      const peak = 0.035 * loud; // тихо
      gn.gain.setValueAtTime(0.0001, now);
      gn.gain.exponentialRampToValueAtTime(peak, now + 0.02);
      gn.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      o.connect(gn).connect(actx.destination);
      o.start(now);
      o.stop(now + 2.6);
      voices[id] = { o, gn };
    } catch (e) { /* без звук — няма значение */ }
  }
  function stopTone(id) {
    const v = voices[id];
    if (!v || !actx) return;
    try {
      const now = actx.currentTime;
      v.gn.gain.cancelScheduledValues(now);
      v.gn.gain.setValueAtTime(Math.max(0.0001, v.gn.gain.value), now);
      v.gn.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      v.o.stop(now + 0.06);
    } catch (e) { /* вече е спрял */ }
    delete voices[id];
  }

  // ---------- трептене ----------
  let loudK = 1; // по-силно дръпване в стъпка 4
  function vibrate(id, k = 1) {
    const b = BODIES[id];
    b.vib = true;
    b.amp = k;
    b.k = k;
    hands[id].visible = false;
    playTone(id, b.freq, Math.min(1.5, k));
    if (id === 'drum') drum.userData.hit = 0;
  }
  function damp(id, withHand = true) {
    const b = BODIES[id];
    b.vib = false;
    stopTone(id);
    if (withHand) {
      hands[id].visible = true;
      hands[id].position.copy(handPos[id]());
      hands[id].rotation.set(id === 'guitar' ? Math.PI / 2 : 0, 0, 0);
    }
  }
  function quietAll() {
    for (const id of Object.keys(BODIES)) { damp(id, false); BODIES[id].amp = 0; hands[id].visible = false; }
  }

  const camQ = new THREE.Quaternion();
  let meterOverride = null;
  let phonesDb = null;
  stage.tick((dt, t) => {
    for (const m of motes) {
      m.position.y += dt * 0.05;
      m.position.x += Math.sin(t * 0.5 + m.userData.ph) * dt * 0.05;
      if (m.position.y > 3.6) m.position.y = 0.4;
    }
    curtains.forEach((c, i) => { c.rotation.y = Math.sin(t * 0.7 + i) * 0.06; });
    kid.userData.head.rotation.y = Math.sin(t * 0.5) * 0.4;
    kid.position.y = Math.abs(Math.sin(t * 1.2)) * 0.012;
    kidPhones.userData.head.rotation.z = phonesDb !== null && phonesDb > 80 ? Math.sin(t * 9) * 0.05 : Math.sin(t * 2) * 0.12;
    camQ.copy(camera.quaternion);

    let loudest = 30;
    for (const [id, b] of Object.entries(BODIES)) {
      if (!b.vib) b.amp = Math.max(0, b.amp - dt * 6);
      else b.amp = Math.max(b.k * 0.35, b.amp - dt * 0.12); // трепти дълго, докато не го спрем
      const a = b.amp;
      if (a > 0.05) loudest = Math.max(loudest, b.db + (b.k > 1 ? 10 : 0));
      if (id === 'drum') {
        const ud = drum.userData;
        ud.skin.position.y = 1.06 + Math.sin(t * 60) * 0.006 * a;
        for (const gr of ud.grains) gr.position.y = 1.085 + Math.abs(Math.sin(t * 9 + gr.userData.ph)) * 0.16 * a * (0.4 + gr.userData.k);
        if (ud.hit !== undefined) { ud.hit += dt; const k = Math.max(0, 1 - ud.hit / 0.25); ud.stick.rotation.z = Math.sin(k * Math.PI) * 0.5; }
      } else if (id === 'guitar') {
        setString(guitar, 0.05 * a, t);
      } else if (id === 'ruler') {
        ruler.userData.pivot.rotation.z = Math.sin(t * 40) * 0.12 * a;
      } else if (id === 'fork') {
        fork.userData.tines.forEach((tn, i) => { tn.position.x = (i ? 1 : -1) * (0.065 + Math.sin(t * 70) * 0.006 * a); });
        for (const d of fork.userData.drops) {
          if (!d.visible && a > 0.1 && Math.random() < dt * 14 * a) {
            d.visible = true;
            d.userData.t = 0;
            const ang = Math.random() * Math.PI * 2;
            d.userData.v.set(Math.cos(ang) * 0.5, 1.1 + Math.random() * 0.6, Math.sin(ang) * 0.5);
            d.position.set(Math.cos(ang) * 0.07, 1.0, Math.sin(ang) * 0.03);
          }
          if (d.visible) {
            d.userData.t += dt;
            d.userData.v.y -= 6 * dt;
            d.position.addScaledVector(d.userData.v, dt);
            if (d.position.y < 0.98) d.visible = false;
          }
        }
        fork.userData.water.position.y = 0.98 + Math.sin(t * 50) * 0.004 * a;
      }
      // вълни
      const w = WAVES[id];
      const ud = w.userData;
      if (b.vib && a > 0.2) {
        ud.next -= dt;
        if (ud.next <= 0) {
          const r = ud.rings.find((x) => x.userData.age > 1.6);
          if (r) { r.userData.age = 0; r.userData.k = b.k || 1; }
          ud.next = 0.32;
        }
      }
      w.position.copy(waveSrc[id]());
      for (const r of ud.rings) {
        r.userData.age += dt;
        const g = r.userData.age;
        r.visible = g < 1.6;
        if (!r.visible) continue;
        r.quaternion.copy(camQ);
        const s = 0.25 + g * 1.0;
        r.scale.setScalar(s);
        r.material.opacity = Math.max(0, 0.75 * (1 - g / 1.6)) * Math.min(1, r.userData.k || 1);
      }
    }
    // шумомер
    const mu = meter.userData;
    mu.target = meterOverride !== null ? meterOverride : phonesDb !== null ? phonesDb : loudest;
    mu.db += (mu.target - mu.db) * Math.min(1, dt * 5);
    const jitter = Math.sin(t * 7) * 0.8 + Math.sin(t * 13) * 0.5;
    mu.pivot.rotation.z = mu.angOf(mu.db + jitter) - Math.PI / 2;
    const txt = `${Math.round(mu.db)} dB · ${zoneOf(mu.db).name}`;
    if (txt !== meterTxt) { meterTxt = txt; meterTag.set(txt); }
    if (sortTick) sortTick(dt, t);
  });
  let meterTxt = '';
  const meterTag = stage.bubble(meter, '', { lift: 1.15, cls: 'tag' });
  let sortTick = null;

  // ---------- камера, балончета ----------
  function view(pos, tgt, dur = 1) {
    const w = shell.stageEl.clientWidth || 600;
    const h = shell.stageEl.clientHeight || 400;
    const k = Math.min(2.2, Math.max(1, 1.6 / (w / h)));
    const p = pos.map((v, i) => tgt[i] + (v - tgt[i]) * k);
    stage.stopFollow();
    stage.flyTo(p, tgt, dur);
  }
  const overview = () => view([0, 5.2, 9.5], [0, 1.3, -0.3]);
  const CAMS = {
    drum: [[-2.6, 2.6, 3.6], [-3.4, 1.0, 0.4]],
    guitar: [[-0.6, 2.2, 1.8], [-1.2, 1.3, -1.6]],
    ruler: [[2.2, 2.0, 1.4], [1.9, 0.95, -1.2]],
    fork: [[3.4, 2.2, 3.0], [3.7, 1.15, 0.2]],
    meter: [[0.6, 3.0, 1.6], [0.6, 3.0, -2.9]],
    kid: [[-0.7, 1.7, 4.4], [-0.9, 0.9, 1.6]],
    phones: [[0.6, 2.4, 5.6], [0.4, 1.6, 0]],
  };
  const camTo = (id) => view(...CAMS[id]);
  let tip = null;
  function say(anchor, html, cls = '', lift = 1) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null, hit));
  let menuHandler = null;
  const EXTRA = {
    meter: { id: 'meter', root: meter, label: 'Шумомер', icon: '📟', lift: 1.15,
      note: 'Шумомерът мери колко силен е звукът — в <b>децибели</b> (dB). Зелено — тихо, жълто — нормално, червено — вредно за слуха.' },
    kid: { id: 'kid', root: kid, label: 'Дете', icon: '👂', lift: 1.4,
      note: 'Звукът стига до нас през въздуха. Чуваме го с ушите. Слухът е едно от петте сетива — трябва да го пазим.' },
  };
  const ALL = { ...BODIES, ...EXTRA };
  const MENU = Object.values(ALL).map((o) => ({ id: o.id, label: o.label, icon: o.icon }));
  const menu = cornerMenu(stage, { title: 'Какво има в стаята', items: MENU, onSelect: (id) => menuHandler && menuHandler(id) });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip(); quietAll(); meterOverride = null; phonesDb = null; loudK = 1;
    setVisible(true);
    kidPhones.visible = false; kid.visible = true; rug.visible = true;
    menu.setItems(MENU);
    menu.show(true);
    const seen = new Set();
    shell.task(`<p>В музикалната стая има неща, които могат да звучат.</p>
      <p><b>Разгледай поне 4 неща</b> — кликни върху тях или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата стая</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${MENU.length}`);
    upd();
    const visit = (id) => {
      const o = ALL[id];
      if (!o) return;
      camTo(id);
      say(o.root, `<b>${esc(o.icon)} ${esc(o.label)}</b><br>${o.note}`, 'wide', o.lift);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size >= 4) { next.disabled = false; shell.msg('Браво! Можеш да продължиш или да разгледаш още.', 'good'); }
    };
    clickHandler = (id) => { if (!id || !ALL[id]) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.show(false); menuHandler = null; step2(); });
    overview();
  }
  function setVisible(on) { for (const b of Object.values(BODIES)) b.root.visible = on; }

  // Въпрос с избор, вграден в панела.
  function choiceQ(boxEl, { q, opts, right, bad, ok, onRight, then, count }) {
    const order = opts.map((o, k) => k).sort(() => Math.random() - 0.5);
    const wrap = document.createElement('div');
    wrap.className = 'sound-q';
    wrap.innerHTML = `<p>${q}</p><div class="choices">${order.map((k) => `<button class="choice" data-i="${k}">${esc(opts[k])}</button>`).join('')}</div>`;
    boxEl.appendChild(wrap);
    wrap.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      if (+b.dataset.i !== right) {
        count();
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(bad, 'bad');
        return;
      }
      b.classList.add('right');
      wrap.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      shell.msg(ok, 'good');
      if (onRight) onRight();
      const go = shell.setControls('<button class="btn primary">Напред →</button>').querySelector('button');
      go.addEventListener('click', () => { shell.setControls(''); shell.msg(''); wrap.querySelectorAll('.choice:not(.right)').forEach((x) => x.remove()); then(wrap); });
    }));
    wrap.scrollIntoView({ block: 'nearest' });
  }

  // ---------- 2. Как се ражда звукът ----------
  const ORDER = ['drum', 'guitar', 'ruler', 'fork'];
  function step2() {
    shell.step(1);
    clearTip(); quietAll();
    let i = 0;
    let mistakes = 0;
    const load = () => {
      const id = ORDER[i];
      const b = BODIES[id];
      camTo(id);
      clearTip();
      shell.score(`Тяло ${i + 1} от ${ORDER.length}`);
      shell.task(`<p><b>${esc(b.icon)} ${esc(b.label)}</b></p><p>${esc(b.act)} — натисни бутона или кликни върху него. Гледай какво става.</p>`);
      const c = shell.setControls(`<div class="row"><button class="btn primary go">${esc(b.act)}</button><button class="btn stop" disabled>✋ Спри трептенето</button></div>`);
      const go = c.querySelector('.go');
      const stop = c.querySelector('.stop');
      const start = () => {
        if (b.vib) return;
        vibrate(id);
        say(b.root, `🔊 ${b.on}`, 'wide', b.lift);
        go.disabled = true;
        setTimeout(() => { if (b.vib) stop.disabled = false; }, 1200);
        shell.msg('');
      };
      go.addEventListener('click', start);
      clickHandler = (pid) => { if (pid === id && !go.disabled) start(); };
      stop.addEventListener('click', () => {
        damp(id);
        stop.disabled = true;
        clickHandler = null;
        say(b.root, `🔇 ${b.off}`, 'good wide', b.lift);
        const last = i === ORDER.length - 1;
        const nx = shell.setControls(`<button class="btn primary">${last ? 'Напред →' : 'Следващо тяло →'}</button>`).querySelector('button');
        nx.addEventListener('click', () => {
          hands[id].visible = false;
          if (last) { questions(); return; }
          i++;
          load();
        });
      });
    };
    const questions = () => {
      clearTip(); overview();
      shell.score('Въпрос 1 от 2 · грешки: 0');
      shell.task('<div class="sound-qs"></div>');
      shell.setControls('');
      const count = () => { mistakes++; shell.score(`Въпроси · грешки: ${mistakes}`); };
      choiceQ(container.querySelector('.sound-qs'), {
        q: 'Какво общо имаха барабанът, струната, линийката и камертонът, докато звучаха?',
        opts: ['Всички трептяха', 'Всички бяха от метал', 'Всички бяха големи'],
        right: 0, count,
        bad: 'Спомни си зрънцата върху барабана и пръските във водата. Какво правеше всяко тяло?',
        ok: 'Вярно! Звук издават трептящи тела. Трептят и гласните ни връзки, когато говорим.',
        then: (w) => choiceQ(w, {
          q: 'Какво стана, когато хвана трептящото тяло с ръка?',
          opts: ['Трептенето спря и звукът спря', 'Звукът стана по-силен', 'Нищо не се промени'],
          right: 0, count,
          bad: 'Виж пак: продължиха ли вълните да излизат от тялото, след като го хвана?',
          ok: 'Вярно! Без трептене няма звук.',
          then: () => { scores.push(stepScore(mistakes, 2)); step3(); },
        }),
      });
    };
    load();
  }

  // ---------- 3. Шумомер ----------
  const SOURCES = [
    { id: 'leaves', label: 'Шумолене на листа', db: 20 },
    { id: 'whisper', label: 'Шепот', db: 30 },
    { id: 'talk', label: 'Разговор', db: 60 },
    { id: 'street', label: 'Улица с коли', db: 70 },
    { id: 'phones', label: 'Слушалки на максимум', db: 100 },
    { id: 'plane', label: 'Излитащ самолет', db: 120 },
  ];
  const sortWorld = new THREE.Group();
  scene.add(sortWorld);
  let stopDrag = null;
  function step3() {
    shell.step(2);
    clearTip(); quietAll();
    setVisible(false);
    kid.visible = false;
    rug.visible = false;
    sortWorld.clear();
    const narrow = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400) < 1.1;
    // зони на пода
    const zones = ZONES.map((z, i) => {
      const w = narrow ? 4.6 : 2.9;
      const d = narrow ? 1.25 : 2.2;
      const g = new THREE.Group();
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: z.color, transparent: true, opacity: 0.35, depthWrite: false }));
      pl.rotation.x = -Math.PI / 2;
      pl.position.y = 0.01;
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, d)), new THREE.LineBasicMaterial({ color: z.color }));
      edge.rotation.x = -Math.PI / 2;
      edge.position.y = 0.015;
      const l = labelSprite(`${z.name} · ${z.range}`, { size: narrow ? 0.34 : 0.28, color: '#fff', bg: z.css, border: z.css });
      if (narrow) l.position.set(-w / 2 + 1.3, 0.25, -d / 2 + 0.2); else l.position.set(0, 0.25, -d / 2 - 0.05);
      g.add(pl, edge, l);
      if (narrow) g.position.set(0, 0, -1.4 + i * 1.45); else g.position.set(-3.1 + i * 3.1, 0, 0.1);
      g.userData = { w, d, z, n: 0 };
      sortWorld.add(g);
      return g;
    });
    const order = SOURCES.slice().sort(() => Math.random() - 0.5);
    const tokens = order.map((o, i) => {
      const g = new THREE.Group();
      const puck = cyl(0.42, 0.46, 0.1, 0xffffff, 24);
      puck.position.y = 0.05;
      const spk = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 14, 1, true), mat(0x546e7a, { side: THREE.DoubleSide }));
      spk.rotation.z = Math.PI / 2;
      spk.position.set(0, 0.32, 0);
      const bx = box(0.14, 0.16, 0.16, 0x37474f);
      bx.position.set(0.18, 0.32, 0);
      const l = labelSprite(o.label, { size: narrow ? 0.3 : 0.24 });
      l.position.y = 0.85;
      const w = waveRings(0x1e88e5);
      w.position.set(-0.1, 0.32, 0);
      g.add(puck, spk, bx, l);
      if (narrow) g.position.set(i % 2 ? 1.2 : -1.2, 0, 3.2 + Math.floor(i / 2) * 1.3);
      else g.position.set(-3.1 + (i % 3) * 3.1, 0, 2.5 + Math.floor(i / 3) * 1.4);
      g.userData = { pickId: 's-' + o.id, dragId: 's-' + o.id, o, waves: w, ph: i };
      sortWorld.add(g);
      sortWorld.add(w);
      w.userData.host = g;
      addHitBox(g, 0.9);
      return g;
    });
    let playing = null;
    sortTick = (dt) => {
      for (const g of tokens) {
        const w = g.userData.waves;
        const wd = w.userData;
        w.position.set(g.position.x - 0.1, 0.32, g.position.z);
        const on = playing === g;
        if (on) { wd.next -= dt; if (wd.next <= 0) { const r = wd.rings.find((x) => x.userData.age > 1.6); if (r) { r.userData.age = 0; r.userData.k = Math.min(1.4, g.userData.o.db / 70); } wd.next = 0.3; } }
        for (const r of wd.rings) {
          r.userData.age += dt;
          const a = r.userData.age;
          r.visible = a < 1.6;
          if (!r.visible) continue;
          r.quaternion.copy(camera.quaternion);
          r.scale.setScalar((0.2 + a * 0.7) * (r.userData.k || 1));
          r.material.opacity = 0.7 * (1 - a / 1.6);
        }
      }
    };
    const measure = (g) => {
      playing = g;
      meterOverride = g.userData.o.db;
      clearTimeout(measure.tm);
      measure.tm = setTimeout(() => { if (playing === g) { playing = null; meterOverride = null; } }, 2600);
    };
    if (narrow) { stage.stopFollow(); stage.flyTo([0, 11.5, 7.6], [0, 0, 1.3], 1); } else view([0, 6.5, 9.5], [0, 0.8, 0.6]);
    let mistakes = 0;
    let placed = 0;
    const tries = new Map();
    shell.task(`<p>Шумомерът на стената показва колко силен е звукът.</p>
      <p><b>Кликни</b> върху източник на звук, за да го измериш, и го <b>провлачи</b> в зоната: тихо, нормално или вредно.</p>`);
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${placed} от ${SOURCES.length} · грешки: ${mistakes}`);
    upd();
    clickHandler = (id, hit) => {
      if (!hit || !hit.root.userData.o) { clearTip(); return; }
      const g = hit.root;
      measure(g);
      say(g, `📟 ${esc(g.userData.o.label)}: <b>${g.userData.o.db} dB</b>`, 'tag', 1.15);
    };
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: (g) => { clearTip(); stage.stopFollow(); measure(g); },
      onDrop: (g, p, start) => {
        const zg = zones.find((Z) => Math.abs(p.x - Z.position.x) < Z.userData.w / 2 && Math.abs(p.z - Z.position.z) < Z.userData.d / 2);
        if (!zg) { g.position.copy(start); return; }
        const o = g.userData.o;
        const right = zoneOf(o.db);
        if (zg.userData.z === right) {
          g.userData.locked = true;
          const n = zg.userData.n++;
          if (narrow) g.position.set(zg.position.x + 0.6 + n * 1.2, 0, zg.position.z + 0.1);
          else g.position.set(zg.position.x + (n ? 0.65 : -0.65), 0, zg.position.z + (n ? 0.5 : 0.1));
          placed++;
          const extra = right.id === 'harm' ? ' Такъв звук уврежда слуха!' : right.id === 'normal' && o.db >= 70 ? ' Ако трае дълго, уморява.' : '';
          say(g, `✔ ${o.db} dB — ${right.name}.${extra}`, right.id === 'harm' ? 'bad' : 'good', 1.15);
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          const n = (tries.get(o.id) || 0) + 1;
          tries.set(o.id, n);
          g.position.copy(start);
          let why = `Не е там. Зоната „${zg.userData.z.name}“ е ${zg.userData.z.range}. Колко показа шумомерът?`;
          if (n >= 2) why += ` Подсказка: ${o.label.toLowerCase()} — ${o.db} dB.`;
          say(g, '✘ Измери пак.', 'bad', 1.15);
          shell.msg(why, 'bad');
        }
        upd();
        if (placed === SOURCES.length) {
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 3));
          shell.msg('Браво! Над 80 dB звукът е вреден — особено ако го слушаме дълго.', 'good');
          shell.setControls('<button class="btn primary">Напред →</button>').querySelector('button').addEventListener('click', step4);
        }
      },
    });
  }

  // ---------- 4. Пази слуха си ----------
  const HABITS = [
    { t: 'Слушам музиката в слушалките тихо', good: true },
    { t: 'Правя почивки в тишина', good: true },
    { t: 'При много силен шум слагам антифони или запушвам ушите си', good: true },
    { t: 'Стоя далеч от колоните на концерт', good: true },
    { t: 'Усилвам слушалките до край, за да не чувам улицата', good: false, why: 'Така звукът в ушите става над 80 dB — вредно за слуха.' },
    { t: 'Викам силно в ухото на приятел', good: false, why: 'Силният звук отблизо може да нарани ухото.' },
    { t: 'Заспивам със силна музика в слушалките', good: false, why: 'Дълго слушане на силен звук уврежда слуха, без да го усетим веднага.' },
  ];
  function step4() {
    shell.step(3);
    clearTip(); quietAll();
    sortTick = null;
    sortWorld.clear();
    setVisible(false);
    rug.visible = true;
    guitar.visible = true;
    kidPhones.visible = true;
    meterOverride = null;
    let mistakes = 0;
    const count = () => { mistakes++; shell.score(`Грешки: ${mistakes}`); };
    camTo('phones');
    shell.score('Грешки: 0');
    // А) силата на звука в слушалките
    let vol = 10;
    const dbOf = (v) => 45 + v * 6;
    phonesDb = dbOf(vol);
    const tagK = () => {
      const db = dbOf(vol);
      const z = zoneOf(db);
      say(kidPhones, `🎧 ${db} dB — ${z.id === 'harm' ? '⚠ вредно за слуха!' : z.name}`, z.id === 'harm' ? 'bad' : 'good', 1.45);
    };
    tagK();
    shell.task(`<p>Ани слуша музика със слушалки на максимум. Шумомерът показва колко силен е звукът в ушите ѝ.</p>
      <p><b>Намали звука</b> до ниво, което не вреди на слуха, и натисни „Готово“.</p>
      <div class="sound-vol"><span>🔉</span><input type="range" min="1" max="10" step="1" value="10" aria-label="Сила на звука"><span>🔊</span><b class="sound-db">${dbOf(vol)} dB</b></div>
      <div class="sound-qs"></div>`);
    const rng = container.querySelector('.sound-vol input');
    rng.addEventListener('input', () => {
      vol = +rng.value;
      phonesDb = dbOf(vol);
      container.querySelector('.sound-db').textContent = `${dbOf(vol)} dB`;
      tagK();
    });
    const done = shell.setControls('<button class="btn primary">Готово</button>').querySelector('button');
    let tries = 0;
    done.addEventListener('click', () => {
      const db = dbOf(vol);
      if (db > 80) {
        count(); tries++;
        shell.msg(tries >= 2 ? 'Подсказка: шумомерът трябва да е в жълтата или зелената зона — до 80 dB.' : `${db} dB е в червената зона — още е вредно.`, 'bad');
        return;
      }
      rng.disabled = true;
      shell.msg('Вярно! Така Ани чува музиката, без да вреди на ушите си.', 'good');
      done.remove();
      habits();
    });

    // Б) добри навици
    function habits() {
      const box = container.querySelector('.sound-qs');
      const order = HABITS.map((h, k) => k).sort(() => Math.random() - 0.5);
      const wrap = document.createElement('div');
      wrap.className = 'sound-q';
      wrap.innerHTML = `<p><b>Избери всички добри навици</b>, които пазят слуха (те са 4).</p><div class="sound-habits">${order.map((k) => `<button class="choice" data-i="${k}">${esc(HABITS[k].t)}</button>`).join('')}</div>`;
      box.appendChild(wrap);
      wrap.scrollIntoView({ block: 'nearest' });
      let found = 0;
      wrap.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        const h = HABITS[+b.dataset.i];
        b.disabled = true;
        if (!h.good) { count(); b.classList.add('wrong'); shell.msg(h.why, 'bad'); return; }
        b.classList.add('right');
        found++;
        shell.msg(`Вярно! Намерени: ${found} от 4.`, 'good');
        if (found === 4) {
          wrap.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
          shell.msg('Браво! Шумът и силните звукове уморяват, причиняват главоболие и могат да увредят слуха завинаги.', 'good');
          const go = shell.setControls('<button class="btn primary">Напред →</button>').querySelector('button');
          go.addEventListener('click', () => { shell.setControls(''); shell.msg(''); predict(box); });
        }
      }));
    }

    // В) предскажи
    function predict(box) {
      phonesDb = null;
      kidPhones.visible = false;
      camTo('guitar');
      say(guitar, '🎸 Сега ще дръпнем струната <b>по-силно</b>.', 'tag', 2.6);
      choiceQ(box, {
        q: '<b>Предскажи:</b> какво ще стане, ако дръпнем струната по-силно?',
        opts: ['Струната ще трепти по-силно и звукът ще е по-силен', 'Струната няма да трепти', 'Звукът ще е същият'],
        right: 0, count,
        bad: 'Помисли: колко далеч от мястото си ще отиде струната, ако я дръпнем по-силно?',
        ok: 'Вярно! Виж: струната се люлее по-широко, вълните са по-големи и шумомерът показва повече. По-силно трептене — по-силен звук.',
        onRight: () => { clearTip(); vibrate('guitar', 2); say(guitar, '🔊 По-силно трептене → по-силен звук', 'tag', 2.6); },
        then: finishAll,
      });
    }
    function finishAll() {
      scores.push(stepScore(mistakes, 3));
      const btn = shell.setControls('<button class="btn primary">Виж резултата</button>').querySelector('button');
      btn.addEventListener('click', () => {
        clearTip(); quietAll();
        const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    }
  }

  function restart() {
    scores.length = 0;
    if (stopDrag) { stopDrag(); stopDrag = null; }
    sortTick = null;
    sortWorld.clear();
    step1();
  }

  step1();
  return {
    dispose() {
      if (stopDrag) stopDrag();
      for (const id of Object.keys(voices)) stopTone(id);
      if (actx) { try { actx.close(); } catch (e) { /* няма значение */ } }
      stage.dispose();
      style.remove();
    },
  };
}
