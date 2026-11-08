// 4.2.4 „Сили около нас“ — 3D детска площадка: количка, топка на кулата, пързалка с четири настилки,
// маса с пластелин и пружина, дете.
// Стъпки: опознай → бутай, пускай, плъзгай, стискай → подреди силите → приложи и предскажи.
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const CSS = `
.forces-acts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 6px 0; }
.forces-acts .btn { padding: 8px 6px; font-size: 0.9rem; }
.forces-acts .btn.tried { border-color: #2e7d32; }
.forces-q { margin-top: 10px; }
.forces-q > p { margin: 4px 0 6px; }
.forces-legend { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 0.8rem; margin: 4px 0; }
.forces-legend i { display: inline-block; width: 18px; height: 5px; border-radius: 3px; vertical-align: middle; margin-right: 4px; }
@media (max-width: 420px) { .forces-acts .btn { font-size: 0.82rem; } }
`;

const C_MUSCLE = 0x1e88e5;
const C_GRAV = 0xd32f2f;
const C_FRIC = 0xef6c00;
const FORCES = {
  muscle: { name: 'мускулна сила', color: C_MUSCLE, css: '#1e88e5' },
  gravity: { name: 'земно притегляне', color: C_GRAV, css: '#d32f2f' },
  friction: { name: 'триене', color: C_FRIC, css: '#ef6c00' },
};
const FORCE_IDS = ['muscle', 'gravity', 'friction'];

const UP = new THREE.Vector3(0, 1, 0);
const nice = (v) => v.toFixed(1).replace('.', ',');

// ---------- помощни модели ----------
function box(w, h, d, color, extra) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra)); }
function cyl(rt, rb, h, color, seg = 12) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color)); }

// Дете, обърнато напред по +x. Ръцете се въртят около z (положителен ъгъл = напред).
function childModel(shirt) {
  const g = new THREE.Group();
  const skin = mat(0xf0c3a0);
  const legM = mat(0x3949ab);
  for (const s of [1, -1]) {
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.38, 4, 8), legM);
    l.position.set(0, 0.26, s * 0.08);
    g.add(l);
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.28, 4, 10), mat(shirt));
  torso.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), skin);
  head.position.y = 1.06;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5d4037));
  hair.position.y = 1.08;
  g.add(torso, head, hair);
  const arms = [];
  for (const s of [1, -1]) {
    const sh = new THREE.Group();
    sh.position.set(0, 0.86, s * 0.18);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.28, 4, 8), skin);
    a.position.y = -0.17;
    sh.add(a);
    g.add(sh);
    arms.push(sh);
  }
  g.userData.arms = arms;
  return g;
}

function treeModel(s = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.16, 0.24, 1.4, 0x7a5230, 7);
  trunk.position.y = 0.7;
  g.add(trunk);
  const crown = new THREE.Group();
  const leafM = mat(0x3f8f3a, { flat: true });
  for (const [x, y, z, r] of [[0, 2.0, 0, 1.0], [0.55, 1.7, 0.25, 0.7], [-0.5, 1.75, -0.25, 0.72], [0.1, 2.6, 0.1, 0.65]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafM);
    b.position.set(x, y, z);
    crown.add(b);
  }
  g.add(crown);
  g.userData.crown = crown;
  g.scale.setScalar(s);
  return g;
}

// Стрелка за сила: сочи по +y, после се завърта към нужната посока.
function arrowModel(color, text) {
  const g = new THREE.Group();
  const piv = new THREE.Group();
  g.add(piv);
  const m = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), m);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 12), m);
  shaft.renderOrder = 9; head.renderOrder = 9;
  piv.add(shaft, head);
  const lbl = labelSprite(text, { size: 0.26, color: '#fff', bg: '#' + new THREE.Color(color).getHexString(), border: '#ffffff' });
  g.add(lbl);
  g.userData = { piv, shaft, head, lbl };
  g.visible = false;
  return g;
}
const tmpQ = new THREE.Vector3();
function setArrow(a, from, dir, len) {
  const { piv, shaft, head, lbl } = a.userData;
  a.position.copy(from);
  tmpQ.copy(dir).normalize();
  piv.quaternion.setFromUnitVectors(UP, tmpQ);
  const L = Math.max(0.3, len);
  shaft.scale.y = L - 0.26;
  shaft.position.y = (L - 0.26) / 2;
  head.position.y = L - 0.14;
  lbl.position.copy(tmpQ).multiplyScalar(L * 0.5);
  lbl.position.y += 0.32;
  a.visible = true;
}

function cartModel() {
  const g = new THREE.Group();
  const body = box(1.0, 0.32, 0.62, 0xe53935);
  body.position.y = 0.4;
  const inner = box(0.9, 0.05, 0.52, 0xb71c1c);
  inner.position.y = 0.55;
  g.add(body, inner);
  const toys = [[0.2, 0x43a047], [-0.15, 0xffca28], [0.05, 0x1e88e5]];
  toys.forEach(([x, c], i) => { const t = box(0.18, 0.18, 0.18, c); t.position.set(x, 0.66, i % 2 ? 0.12 : -0.1); t.rotation.y = i; g.add(t); });
  const wheels = [];
  for (const x of [0.32, -0.32]) for (const z of [0.33, -0.33]) {
    const w = new THREE.Group();
    const tire = cyl(0.15, 0.15, 0.07, 0x263238, 14);
    tire.rotation.x = Math.PI / 2;
    const sp = box(0.24, 0.04, 0.08, 0xb0bec5);
    w.add(tire, sp);
    w.position.set(x, 0.16, z);
    g.add(w);
    wheels.push(w);
  }
  const metal = mat(0x455a64);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), metal);
  bar.position.set(-0.62, 0.68, 0);
  bar.rotation.z = 0.7;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), mat(0x212121));
  grip.rotation.x = Math.PI / 2;
  grip.position.set(-0.78, 0.86, 0);
  g.add(bar, grip);
  g.userData.wheels = wheels;
  return g;
}

function towerModel() {
  const g = new THREE.Group();
  const wood = mat(0x8d6e63);
  for (const x of [-0.6, 0.6]) for (const z of [-0.6, 0.6]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.6, 6), wood);
    p.position.set(x, 1.8, z);
    g.add(p);
  }
  const plat = box(1.4, 0.1, 1.4, 0x6d4c41);
  plat.position.y = 2.4;
  g.add(plat);
  for (const [x, z, w, d] of [[0, -0.66, 1.3, 0.05], [-0.66, 0, 0.05, 1.3], [0, 0.66, 1.3, 0.05]]) {
    const r = box(w, 0.05, d, 0xffb300);
    r.position.set(x, 2.95, z);
    g.add(r);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.8, 4), mat(0x1e88e5, { flat: true }));
  roof.position.y = 4.0;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), mat(0x9e9e9e));
  pole.position.y = 4.7;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.28, 6, 1), new THREE.MeshStandardMaterial({ color: 0x43a047, side: THREE.DoubleSide }));
  flag.position.set(0.24, 4.9, 0);
  g.add(pole, flag);
  g.userData.flag = flag;
  for (let i = 0; i < 6; i++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), wood);
    rung.rotation.x = Math.PI / 2;
    rung.position.set(-0.75, 0.3 + i * 0.36, 0);
    g.add(rung);
  }
  for (const z of [-0.3, 0.3]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 6), wood);
    rail.position.set(-0.78, 1.25, z);
    g.add(rail);
  }
  return g;
}

function benchModel() {
  const g = new THREE.Group();
  const seat = box(1.6, 0.08, 0.45, 0x8d6e63); seat.position.y = 0.45;
  const back = box(1.6, 0.4, 0.06, 0x8d6e63); back.position.set(0, 0.75, 0.22);
  g.add(seat, back);
  for (const x of [-0.7, 0.7]) { const l = box(0.08, 0.45, 0.4, 0x37474f); l.position.set(x, 0.22, 0); g.add(l); }
  return g;
}

function springGeo() {
  const pts = [];
  const turns = 6;
  for (let i = 0; i <= turns * 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * 0.15, 0.05 + (i / (turns * 24)) * 0.55, Math.sin(a) * 0.15));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.022, 6, false);
}

function handModel() {
  const g = new THREE.Group();
  const skin = mat(0xf0c3a0);
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.24), skin);
  palm.position.y = 0.045;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.7, 10), skin);
  arm.position.y = 0.43;
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 10), mat(0xffa726));
  sleeve.position.y = 0.8;
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.08, 3, 6), skin);
    f.rotation.z = Math.PI / 2;
    f.position.set(0.19, 0.04, -0.09 + i * 0.06);
    g.add(f);
  }
  g.add(palm, arm, sleeve);
  return g;
}

// Малки модели за сортирането; anim(t) показва какво става.
function miniModel(id) {
  const g = new THREE.Group();
  let anim = () => {};
  const frac = (x) => x - Math.floor(x);
  const skin = mat(0xf0c3a0);
  if (id === 'kick') {
    const hip = new THREE.Group(); hip.position.set(-0.25, 0.85, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.6, 4, 8), mat(0x3949ab)); leg.position.y = -0.38;
    const boot = box(0.22, 0.1, 0.12, 0x212121); boot.position.set(0.06, -0.76, 0);
    hip.add(leg, boot);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat(0xffffff));
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.122, 6, 4, 0, 1.2, 0, 1.2), mat(0x212121)); ball.add(patch);
    g.add(hip, ball);
    anim = (t) => {
      const u = frac(t / 2);
      hip.rotation.z = u < 0.3 ? -0.6 * (u / 0.3) : u < 0.4 ? -0.6 + 1.5 * ((u - 0.3) / 0.1) : 0.9 * (1 - Math.min(1, (u - 0.4) / 0.4));
      const k = u < 0.38 ? 0 : Math.min(1, (u - 0.38) / 0.5);
      ball.position.set(0.05 + 0.45 * k, 0.12 + 0.35 * 4 * k * (1 - k), 0);
      ball.rotation.z = -k * 6;
    };
  } else if (id === 'bag') {
    const bag = new THREE.Group();
    const b = box(0.36, 0.4, 0.18, 0x7b1fa2); b.position.y = 0.2;
    const pocket = box(0.26, 0.15, 0.04, 0x9c27b0); pocket.position.set(0, 0.12, 0.1);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI), mat(0x4a148c)); handle.position.y = 0.4;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), skin); hand.position.y = 0.49;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), skin); arm.position.y = 0.76;
    bag.add(b, pocket, handle, hand, arm);
    g.add(bag);
    anim = (t) => { const u = frac(t / 2.4); bag.position.y = 0.06 + 0.45 * (u < 0.5 ? Math.sin((u / 0.5) * Math.PI / 2) : Math.cos(((u - 0.5) / 0.5) * Math.PI / 2)); };
  } else if (id === 'sled') {
    const snow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), mat(0xffffff)); snow.rotation.x = -Math.PI / 2; snow.position.y = 0.13;
    g.add(snow);
    const sled = new THREE.Group();
    for (const z of [-0.13, 0.13]) { const r = box(0.55, 0.03, 0.03, 0x455a64); r.position.set(0, 0.16, z); sled.add(r); }
    const seat = box(0.42, 0.04, 0.32, 0xc62828); seat.position.y = 0.26; sled.add(seat);
    for (const x of [-0.15, 0.15]) for (const z of [-0.13, 0.13]) { const p = box(0.03, 0.1, 0.03, 0x455a64); p.position.set(x, 0.21, z); sled.add(p); }
    const rope = box(0.45, 0.015, 0.015, 0xffca28); rope.position.set(0.48, 0.3, 0); rope.rotation.z = 0.25; sled.add(rope);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), skin); hand.position.set(0.7, 0.36, 0); sled.add(hand);
    g.add(sled);
    anim = (t) => { const u = frac(t / 2.4); sled.position.x = -0.35 + 0.35 * Math.min(1, u * 1.4); };
  } else if (id === 'apple') {
    const br = box(0.7, 0.07, 0.07, 0x795548); br.position.y = 1.15; g.add(br);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0x43a047, { flat: true })); leaf.scale.set(1.4, 0.5, 1); leaf.position.set(-0.2, 1.2, 0); g.add(leaf);
    const ap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat(0xe53935)); g.add(ap);
    anim = (t) => { const u = frac(t / 2.2); ap.position.y = u < 0.08 ? 1.0 : 1.0 - 0.86 * Math.min(1, ((u - 0.08) / 0.3) ** 2); };
  } else if (id === 'rain') {
    const cloud = new THREE.Group();
    for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (k % 2) * 0.05, 10, 8), mat(0xeceff1)); p.position.set(k * 0.2 - 0.2, (k % 2) * 0.06, 0); cloud.add(p); }
    cloud.position.y = 1.15;
    g.add(cloud);
    const drops = [];
    for (let k = 0; k < 4; k++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0x29b6f6)); d.scale.y = 1.8;
      d.position.x = -0.24 + k * 0.16; d.userData.ph = k * 0.27; g.add(d); drops.push(d);
    }
    anim = (t) => { for (const d of drops) { const u = frac(t / 1.1 + d.userData.ph); d.position.y = 1.0 - 0.9 * u; } };
  } else if (id === 'leaf') {
    const br = box(0.6, 0.06, 0.06, 0x795548); br.position.y = 1.2; g.add(br);
    const lf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0xf9a825, { flat: true })); lf.scale.set(1.4, 0.25, 0.8);
    g.add(lf);
    anim = (t) => { const u = frac(t / 3); lf.position.set(Math.sin(u * 12) * 0.18, 1.1 - 1.0 * Math.min(1, u * 1.2), 0); lf.rotation.z = Math.sin(u * 12) * 0.6; };
  } else if (id === 'rollstop') {
    const grass = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), mat(0x66bb6a)); grass.rotation.x = -Math.PI / 2; grass.position.y = 0.13; g.add(grass);
    for (let k = 0; k < 7; k++) { const bl = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.1, 4), mat(0x2e7d32)); bl.position.set(-0.4 + k * 0.13, 0.18, (k % 2) * 0.2 - 0.1); g.add(bl); }
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat(0xff7043)); g.add(ball);
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 4, 16), mat(0xffffff)); ball.add(stripe);
    anim = (t) => { const u = Math.min(1, frac(t / 2.6) * 1.5); const s = 1 - (1 - u) * (1 - u); ball.position.set(-0.42 + 0.75 * s, 0.25, 0); ball.rotation.z = -s * 7; };
  } else if (id === 'shoe') {
    const tile = box(1.0, 0.04, 0.5, 0x90a4ae); tile.position.y = 0.14; g.add(tile);
    const shoe = new THREE.Group();
    const sole = box(0.5, 0.06, 0.2, 0x212121); sole.position.y = 0.03;
    for (let k = 0; k < 5; k++) { const tr = box(0.04, 0.03, 0.2, 0x424242); tr.position.set(-0.2 + k * 0.1, -0.005, 0); shoe.add(tr); }
    const up = box(0.4, 0.16, 0.18, 0x1e88e5); up.position.set(-0.03, 0.14, 0);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(0x1e88e5)); toe.scale.set(1.2, 0.9, 1); toe.position.set(0.17, 0.1, 0);
    shoe.add(sole, up, toe);
    shoe.position.y = 0.17;
    g.add(shoe);
    anim = (t) => { const u = frac(t / 1.8); const k = u < 0.5 ? Math.sin(u * 2 * Math.PI) : 0; shoe.position.y = 0.17 + 0.12 * Math.max(0, k); shoe.rotation.z = 0.2 * Math.max(0, k); };
  } else if (id === 'brake') {
    const wheel = new THREE.Group(); wheel.position.y = 0.55;
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 24), mat(0x263238));
    wheel.add(tire);
    for (let k = 0; k < 4; k++) { const sp = box(0.012, 0.76, 0.012, 0xcfd8dc); sp.rotation.z = (k * Math.PI) / 4; wheel.add(sp); }
    const fork = box(0.04, 0.6, 0.04, 0x607d8b); fork.position.set(0, 0.85, 0.08);
    const pads = [];
    for (const z of [0.07, -0.07]) { const p = box(0.12, 0.05, 0.04, 0xd32f2f); p.position.set(0, 0.99, z); g.add(p); pads.push(p); }
    g.add(wheel, fork);
    let ang = 0;
    let last = 0;
    anim = (t) => {
      const dt = Math.max(0, Math.min(0.1, t - last)); last = t;
      const u = frac(t / 3);
      const sp = u < 0.4 ? 8 : Math.max(0, 8 * (1 - (u - 0.4) / 0.3));
      ang += sp * dt;
      wheel.rotation.z = -ang;
      const sq = u > 0.4 ? 0.03 : 0;
      pads[0].position.z = 0.07 - sq + 0.0; pads[1].position.z = -0.07 + sq;
      pads[0].position.y = pads[1].position.y = 0.97 - (u > 0.4 ? 0.02 : 0);
    };
  }
  g.userData.anim = anim;
  return g;
}

const LANES = [
  { id: 'ice', name: 'лед', icon: '🧊', color: 0xd4f1ff, d: 7.2, fr: 0.3 },
  { id: 'wood', name: 'дърво', icon: '🪵', color: 0xc9995f, d: 3.9, fr: 0.65 },
  { id: 'carpet', name: 'килим', icon: '🟪', color: 0x8e5bb5, d: 1.8, fr: 1.0 },
  { id: 'sand', name: 'пясък', icon: '🏖', color: 0xe6cf8f, d: 0.9, fr: 1.3 },
];

export function mount(container, { onComplete }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const STEPS = ['Опознай площадката', 'Бутай, пускай, плъзгай, стискай', 'Подреди силите', 'Приложи и предскажи'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xbfe3ff, camPos: [1, 11, 15], target: [1, 0.5, 0], shadows: false,
    fog: { color: 0xbfe3ff, near: 40, far: 80 }, maxDistance: 40,
  });
  const { scene } = stage;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const clearTimers = () => { for (const id of timers) clearTimeout(id); timers.clear(); };

  // ---------- площадка ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 80), mat(0x8bc34a));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // настилка за количката и ограда
  const PAVE = { x0: -8.6, x1: -1.0, z0: 0.7, z1: 4.7 };
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(PAVE.x1 - PAVE.x0, PAVE.z1 - PAVE.z0), mat(0xcfd8dc));
  pave.rotation.x = -Math.PI / 2;
  pave.position.set((PAVE.x0 + PAVE.x1) / 2, 0.012, (PAVE.z0 + PAVE.z1) / 2);
  scene.add(pave);
  for (let x = PAVE.x0 + 0.95; x < PAVE.x1; x += 0.95) {
    const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.03, PAVE.z1 - PAVE.z0), mat(0xb0bec5));
    ln.rotation.x = -Math.PI / 2; ln.position.set(x, 0.014, (PAVE.z0 + PAVE.z1) / 2);
    scene.add(ln);
  }
  const FENCE_X = -1.2;
  const fence = new THREE.Group();
  for (let z = PAVE.z0; z <= PAVE.z1 + 0.01; z += 0.5) { const p = box(0.08, 0.7, 0.08, 0xffffff); p.position.set(0, 0.35, z); fence.add(p); }
  for (const y of [0.25, 0.55]) { const r = box(0.05, 0.07, PAVE.z1 - PAVE.z0, 0xffffff); r.position.set(0, y, (PAVE.z0 + PAVE.z1) / 2); fence.add(r); }
  fence.position.x = FENCE_X;
  scene.add(fence);
  const bench = benchModel();
  bench.position.set(-4.4, 0, 5.4);
  scene.add(bench);

  const cart = cartModel();
  scene.add(cart);
  const kid = childModel(0xffa726);
  scene.add(kid);

  // кула с дете и топка
  const TOWER = new THREE.Vector3(-6.4, 0, -3.4);
  const tower = towerModel();
  tower.position.copy(TOWER);
  scene.add(tower);
  const towerKid = childModel(0x26a69a);
  towerKid.scale.setScalar(0.85);
  towerKid.position.set(TOWER.x + 0.1, 2.45, TOWER.z);
  scene.add(towerKid);
  towerKid.userData.arms[0].rotation.z = 1.4;
  const BALL_R = 0.15;
  const HOLD = new THREE.Vector3(TOWER.x + 0.62, 3.0, TOWER.z + 0.15);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 16, 12), mat(0xff5722));
  const bstripe = new THREE.Mesh(new THREE.TorusGeometry(BALL_R, 0.018, 4, 20), mat(0xffffff));
  ball.add(bstripe);
  scene.add(ball);
  const ballAnchor = new THREE.Object3D();
  ballAnchor.position.copy(HOLD);
  scene.add(ballAnchor);

  // пързалка с четири настилки
  const LZ0 = -3.6;
  const laneZ = (i) => LZ0 + (i - 1.5) * 0.9;
  const RAMP_A = new THREE.Vector2(-0.9, 1.25); // горе (x, y)
  const RAMP_B = new THREE.Vector2(0.8, 0.03); // долу
  const RUN_X0 = 0.8;
  const RUN_LEN = 8.2;
  const slide = new THREE.Group();
  scene.add(slide);
  {
    const dx = RAMP_B.x - RAMP_A.x; const dy = RAMP_A.y - RAMP_B.y;
    const len = Math.hypot(dx, dy);
    const ramp = box(len, 0.06, 3.7, 0xffb300);
    ramp.position.set((RAMP_A.x + RAMP_B.x) / 2, (RAMP_A.y + RAMP_B.y) / 2 - 0.03, LZ0);
    ramp.rotation.z = -Math.atan2(dy, dx);
    slide.add(ramp);
    const top = box(0.7, 0.08, 3.7, 0x1e88e5); top.position.set(RAMP_A.x - 0.35, RAMP_A.y - 0.04, LZ0); slide.add(top);
    const metal = mat(0x90a4ae);
    for (const z of [LZ0 - 1.8, LZ0 + 1.8]) for (const x of [RAMP_A.x - 0.65, RAMP_A.x]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, RAMP_A.y, 6), metal); p.position.set(x, RAMP_A.y / 2, z); slide.add(p);
    }
    LANES.forEach((L, i) => {
      const extra = L.id === 'ice' ? { roughness: 0.15, metalness: 0.1 } : {};
      const s = new THREE.Mesh(new THREE.PlaneGeometry(RUN_LEN, 0.82), mat(L.color, extra));
      s.rotation.x = -Math.PI / 2; s.position.set(RUN_X0 + RUN_LEN / 2, 0.02, laneZ(i));
      slide.add(s);
      if (L.id === 'wood') for (let x = RUN_X0 + 0.5; x < RUN_X0 + RUN_LEN; x += 0.5) { const pl = box(0.02, 0.005, 0.82, 0x8d6e63); pl.position.set(x, 0.024, laneZ(i)); slide.add(pl); }
      if (L.id === 'ice') for (let k = 0; k < 9; k++) { const st = box(0.6, 0.004, 0.02, 0xffffff); st.position.set(RUN_X0 + 0.5 + k * 0.85, 0.024, laneZ(i) + ((k * 37) % 7) / 10 - 0.3); st.rotation.y = 0.3; slide.add(st); }
      if (L.id === 'sand') for (let k = 0; k < 30; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), mat(0xd7b56d)); b.scale.y = 0.35; b.position.set(RUN_X0 + 0.2 + ((k * 53) % 80) / 10, 0.022, laneZ(i) + ((k * 29) % 7) / 10 - 0.3); slide.add(b); }
      if (L.id === 'carpet') { for (const e of [-0.4, 0.4]) { const f = box(RUN_LEN, 0.01, 0.03, 0xf3e5f5); f.position.set(RUN_X0 + RUN_LEN / 2, 0.025, laneZ(i) + e); slide.add(f); } }
      const lbl = labelSprite(`${L.icon} ${L.name}`, { size: 0.3 });
      lbl.position.set(RUN_X0 + RUN_LEN + 0.7, 0.3, laneZ(i));
      slide.add(lbl);
      stage.steadyLabel(lbl, 12);
    });
    for (let i = 0; i <= 4; i++) { const dv = box(RUN_LEN + dx, 0.07, 0.04, 0xffffff); dv.position.set(RAMP_A.x + (RUN_LEN + dx) / 2, 0.04, LZ0 + (i - 2) * 0.9); if (i > 0 && i < 4) slide.add(dv); }
    for (let m = 1; m <= 8; m++) {
      const tk = box(0.04, 0.02, 3.7, 0x37474f); tk.position.set(RUN_X0 + m, 0.03, LZ0); slide.add(tk);
      const nl = labelSprite(`${m} м`, { size: 0.2 });
      nl.position.set(RUN_X0 + m, 0.15, LZ0 + 2.05); slide.add(nl);
    }
  }
  const sbox = new THREE.Group();
  {
    const b = box(0.4, 0.4, 0.4, 0xc8a165); sbox.add(b);
    const tape = box(0.41, 0.06, 0.41, 0x8d6e63); sbox.add(tape);
  }
  scene.add(sbox);
  const flags = new THREE.Group();
  scene.add(flags);
  const sandDots = new THREE.Group();
  for (let k = 0; k < 70; k++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), mat(0xb08a4a));
    d.scale.y = 0.4;
    d.position.set(RUN_X0 + 0.1 + ((k * 61) % 75) / 10, 0.03, laneZ(0) + ((k * 23) % 7) / 10 - 0.32);
    sandDots.add(d);
  }
  scene.add(sandDots);

  // маса с пластелин, пружина и гумена топка
  const TABLE = new THREE.Vector3(5.0, 0, 2.6);
  const TOP = 0.78;
  const table = new THREE.Group();
  {
    const t = box(2.4, 0.08, 1.1, 0xa1887f); t.position.y = TOP - 0.04; table.add(t);
    for (const x of [-1.05, 1.05]) for (const z of [-0.45, 0.45]) { const l = box(0.08, TOP - 0.08, 0.08, 0x6d4c41); l.position.set(x, (TOP - 0.08) / 2, z); table.add(l); }
  }
  table.position.copy(TABLE);
  scene.add(table);
  const CLAY_R = 0.22;
  const clay = new THREE.Mesh(new THREE.SphereGeometry(CLAY_R, 18, 14), mat(0xf4a261));
  const CLAY_X = TABLE.x - 0.65;
  scene.add(clay);
  const springG = new THREE.Group();
  {
    const base = cyl(0.22, 0.22, 0.05, 0x607d8b, 18); base.position.y = 0.025;
    const coil = new THREE.Mesh(springGeo(), mat(0xb0bec5, { metalness: 0.5, roughness: 0.35 }));
    const plate = cyl(0.2, 0.2, 0.04, 0x607d8b, 18); plate.position.y = 0.62;
    springG.add(base, coil, plate);
  }
  const SPRING_X = TABLE.x + 0.65;
  springG.position.set(SPRING_X, TOP, TABLE.z);
  scene.add(springG);
  const rubber = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), mat(0x3949ab));
  scene.add(rubber);
  const hand = handModel();
  scene.add(hand);

  // декор
  const trees = [];
  for (const [x, z, s] of [[-10.5, -1, 1.1], [-10, 4, 0.9], [11.5, -1.5, 1.2], [9.6, 4.2, 0.9], [-3, -8, 1.3], [4, -8.5, 1.1], [-12, -7, 1.2], [12.5, -7.5, 1.0]]) {
    const t = treeModel(s);
    t.position.set(x, 0, z);
    t.userData.ph = x * 0.3;
    scene.add(t);
    trees.push(t);
  }
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.8 + k * 0.15, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      p.position.set(k * 0.9 - 0.9, (k % 2) * 0.3, 0);
      c.add(p);
    }
    c.position.set(-25 + i * 11, 9 + (i % 3), -18 - (i % 2) * 6);
    scene.add(c);
    clouds.push(c);
  }
  const butterfly = new THREE.Group();
  const wings = [];
  for (const s of [1, -1]) {
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.15, 10), new THREE.MeshStandardMaterial({ color: 0xff7043, side: THREE.DoubleSide }));
    w.rotation.x = Math.PI / 2;
    w.scale.set(1, 1.4, 1);
    w.position.z = s * 0.14;
    const wp = new THREE.Group(); wp.add(w); butterfly.add(wp); wings.push([wp, s]);
  }
  scene.add(butterfly);

  // стрелки на силите
  const arCart = arrowModel(C_MUSCLE, 'мускулна сила');
  const arCartF = arrowModel(C_FRIC, 'триене');
  const arBall = arrowModel(C_GRAV, 'земно притегляне');
  const arBox = arrowModel(C_FRIC, 'триене');
  const arHand = arrowModel(C_MUSCLE, 'мускулна сила');
  for (const a of [arCart, arCartF, arBall, arBox, arHand]) { scene.add(a); stage.steadyLabel(a.userData.lbl, 9); }

  // ---------- обекти за избор ----------
  const OBJ = {
    cart: { root: cart, label: 'Количка', icon: '🛒', lift: 1.3,
      note: 'Количката сама не тръгва. Когато детето я бутне или дръпне, тя потегля. Силата идва от мускулите на детето — това е <b>мускулна сила</b>.' },
    ball: { root: tower, label: 'Топка на кулата', icon: '⚽', lift: 1.1, at: () => ballAnchor,
      note: 'Детето на кулата държи топка. Ако я пусне, тя ще падне. Земята привлича всички тела към себе си — това е <b>земното притегляне</b>.' },
    slide: { root: slide, label: 'Пързалка с настилки', icon: '🛝', lift: 1.6, at: () => sbox,
      note: 'Кутията се спуска по пързалката и после се плъзга по лед, дърво, килим или пясък. Колко далеч ще стигне, зависи от <b>триенето</b> с настилката.' },
    clay: { root: clay, label: 'Пластелин', icon: '🟠', lift: 0.8,
      note: 'Силата може не само да движи телата, но и да променя формата им. Какво ще стане с пластелина, ако го стиснеш? Ще провериш след малко.' },
    spring: { root: springG, label: 'Пружина', icon: '🌀', lift: 1.2,
      note: 'Пружината е метална тел, навита на спирала. Гледай: ръката я натиска и тя се свива. А после?' },
    kid: { root: kid, label: 'Дете', icon: '🧒', lift: 1.6,
      note: 'С мускулите си детето бута, дърпа, вдига, хвърля и стиска. Силата, с която го прави, се нарича <b>мускулна сила</b>.' },
  };
  Object.entries(OBJ).forEach(([id, o]) => {
    o.id = id;
    o.root.userData.pickId = id;
    addHitBox(o.root, 1);
  });

  // ---------- следа ----------
  const trail = new THREE.Group();
  scene.add(trail);
  const dotGeo = new THREE.SphereGeometry(0.06, 8, 6);
  const dotMats = new Map();
  const dotMat = (c) => { if (!dotMats.has(c)) dotMats.set(c, new THREE.MeshBasicMaterial({ color: c })); return dotMats.get(c); };
  function addDot(p, c) { const d = new THREE.Mesh(dotGeo, dotMat(c)); d.position.copy(p); trail.add(d); }
  function clearTrail() { for (const d of trail.children.slice()) trail.remove(d); }

  // ---------- анимации ----------
  const acts = new Set();
  function anim(dur, fn, done) { const a = { t: 0, dur, fn, done }; acts.add(a); fn(0, 0); return a; }
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

  // Количка: скорост по земята, сила (бутане/дърпане), триене.
  const cartV = new THREE.Vector3();
  const cartS = { force: null, decel: 0.02, dots: false, dotT: 0, onBump: null, onStop: null, heading: 0, kidMode: 'back', kidFollow: true };
  function cartSetup(x, z, vx = 0, vz = 0, { decel = 0.02, dots = false } = {}) {
    cart.position.set(x, 0, z);
    cartV.set(vx, 0, vz);
    cartS.heading = 0;
    cart.rotation.y = 0;
    cartS.force = null; cartS.decel = decel; cartS.dots = dots; cartS.dotT = 0;
    cartS.onBump = null; cartS.onStop = null; cartS.kidMode = 'back'; cartS.kidFollow = true;
    arCart.visible = false; arCartF.visible = false;
    placeKid(true);
  }
  function pushCart(kind, onEnd) {
    const v0 = cartV.clone();
    let dir;
    let v1;
    if (kind === 'fwd') { dir = new THREE.Vector3(1, 0, 0); v1 = v0.clone().add(dir.clone().multiplyScalar(0.5)); }
    else if (kind === 'back') { dir = new THREE.Vector3(-1, 0, 0); v1 = v0.x > 0.05 ? new THREE.Vector3() : v0.clone().add(dir.clone().multiplyScalar(0.5)); }
    else if (kind === 'side') { dir = new THREE.Vector3(0, 0, 1); v1 = v0.clone().add(dir.clone().multiplyScalar(0.55)); }
    else { dir = new THREE.Vector3(1, 0, 0); v1 = new THREE.Vector3(1.4, 0, 0); } // „силно бутане“ за демонстрация
    cartS.kidMode = kind === 'side' ? 'side' : 'back';
    cartS.force = { t: 0, dur: 0.7, v0, v1, dir, onEnd };
  }
  const kidTarget = new THREE.Vector3();
  function placeKid(snap = false) {
    if (!cartS.kidFollow && !snap) return;
    const h = cartS.heading;
    if (cartS.kidMode === 'side') {
      kidTarget.set(cart.position.x, 0, cart.position.z - 0.85);
      kid.rotation.y = -Math.PI / 2;
    } else {
      kidTarget.set(cart.position.x - Math.cos(h) * 1.05, 0, cart.position.z + Math.sin(h) * 1.05);
      kid.rotation.y = h;
    }
    if (snap) kid.position.copy(kidTarget);
  }

  // Топка: полет под действие на земното притегляне.
  const G = 5; // по-бавно от истинското, за да се вижда
  let ballSim = null;
  function ballHome() { ballSim = null; ball.position.copy(HOLD); arBall.visible = false; }
  function throwBall(vx, vy, { catchBack = false, onDone } = {}) {
    ball.position.copy(HOLD);
    ballSim = { v: new THREE.Vector3(vx, vy, 0), t: 0, dotT: 0, rest: 0, catchBack, onDone, done: false };
  }

  // Кутия по пързалката.
  function boxAtTop(i) {
    sbox.position.set(RAMP_A.x + 0.05, RAMP_A.y + 0.26, laneZ(i));
    sbox.rotation.set(0, 0, 0);
    arBox.visible = false;
  }
  function slideBox(i, d, onDone, frScale = LANES[i].fr) {
    const z = laneZ(i);
    const dx = RAMP_B.x - RAMP_A.x; const dy = RAMP_A.y - RAMP_B.y;
    const al = Math.atan2(dy, dx);
    const n = new THREE.Vector2(Math.sin(al), Math.cos(al)).multiplyScalar(0.2);
    const v0 = 3.0;
    const a = (v0 * v0) / (2 * d);
    const tStop = v0 / a;
    anim(0.9, (u) => {
      const k = u * u;
      sbox.position.set(RAMP_A.x + dx * k + n.x, RAMP_A.y - dy * k + n.y, z);
      sbox.rotation.z = u < 0.97 ? -al : 0;
    }, () => {
      anim(tStop, (u, t) => {
        const x = RUN_X0 + v0 * t - (a * t * t) / 2;
        sbox.position.set(x, 0.22, z);
        sbox.rotation.z = 0;
        if (u < 1) setArrow(arBox, new THREE.Vector3(x - 0.15, 0.55, z), new THREE.Vector3(-1, 0, 0), 0.3 + 0.55 * frScale);
      }, () => { arBox.visible = false; onDone && onDone(); });
    });
  }
  function addFlag(i, d, text) {
    const g = new THREE.Group();
    const pole = cyl(0.02, 0.02, 0.8, 0x37474f, 6); pole.position.y = 0.4;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshStandardMaterial({ color: 0xd32f2f, side: THREE.DoubleSide }));
    fl.position.set(0.15, 0.7, 0);
    const lbl = labelSprite(text, { size: 0.24 });
    lbl.position.y = 1.0;
    g.add(pole, fl, lbl);
    stage.steadyLabel(lbl, 10);
    g.position.set(RUN_X0 + d + 0.25, 0, laneZ(i) - 0.3);
    flags.add(g);
    return g;
  }

  // Ръка, която стиска пластелин, пружина или гумена топка.
  const shape = { clay: 1, spring: 1, rubber: 1 }; // 1 = първоначална форма
  function applyShapes() {
    const c = shape.clay; // c: 1 → кълбо, 0.42 → сплескан
    clay.scale.set(1 + (1 - c) * 0.9, c, 1 + (1 - c) * 0.9);
    clay.position.set(CLAY_X, TOP + CLAY_R * c, TABLE.z);
    springG.scale.y = shape.spring;
    const r = shape.rubber;
    rubber.scale.set(1 + (1 - r) * 0.7, r, 1 + (1 - r) * 0.7);
    rubber.position.set(TABLE.x, TOP + 0.2 * r, TABLE.z);
  }
  const topOf = (k) => (k === 'clay' ? TOP + 2 * CLAY_R * shape.clay : k === 'spring' ? TOP + 0.64 * shape.spring : TOP + 0.4 * shape.rubber);
  const xOf = (k) => (k === 'clay' ? CLAY_X : k === 'spring' ? SPRING_X : TABLE.x);
  let squeezing = false;
  function squeeze(k, onDone) {
    squeezing = true;
    const x = xOf(k);
    const hand0 = topOf(k) + 0.9;
    const min = k === 'clay' ? 0.42 : k === 'spring' ? 0.4 : 0.55;
    const showArrow = (y) => setArrow(arHand, new THREE.Vector3(x - 0.45, y + 0.9, TABLE.z), new THREE.Vector3(0, -1, 0), 0.75);
    hand.visible = true;
    anim(0.6, (u) => { hand.position.set(x, hand0 - 0.9 * ease(u), TABLE.z); }, () => {
      anim(0.7, (u) => {
        shape[k] = 1 - (1 - min) * ease(u);
        applyShapes();
        hand.position.y = topOf(k);
        showArrow(hand.position.y);
      }, () => {
        anim(0.35, () => {}, () => {
          arHand.visible = false;
          const y0 = hand.position.y;
          anim(0.8, (u, t) => {
            hand.position.y = y0 + 1.1 * ease(u);
            if (k !== 'clay') {
              // пружината и гумената топка се връщат с малко подскачане
              shape[k] = 1 - (1 - min) * Math.exp(-4 * t) * Math.cos(11 * t);
              if (u >= 1) shape[k] = 1;
              applyShapes();
              if (hand.position.y < topOf(k)) hand.position.y = topOf(k);
            }
          }, () => { hand.visible = false; squeezing = false; onDone && onDone(); });
        });
      });
    });
  }

  function resetWorld() {
    acts.clear();
    clearTimers();
    clearTrail();
    cartSetup(-7.2, 2.6);
    ballHome();
    boxAtTop(1);
    flags.clear();
    sandDots.visible = false;
    shape.clay = 1; shape.spring = 1; shape.rubber = 1;
    applyShapes();
    rubber.visible = false;
    hand.visible = false;
    squeezing = false;
    arHand.visible = false; arBox.visible = false;
  }

  // ---------- живот на сцената ----------
  let sortTick = null;
  const tmpV = new THREE.Vector3();
  stage.tick((dt, t) => {
    for (const a of [...acts]) {
      if (!acts.has(a)) continue;
      a.t += dt;
      const u = Math.min(1, a.t / a.dur);
      a.fn(u, Math.min(a.t, a.dur));
      if (u >= 1) { acts.delete(a); if (a.done) a.done(); }
    }
    for (const c of clouds) { c.position.x += dt * 0.35; if (c.position.x > 32) c.position.x = -32; }
    for (const tr of trees) tr.userData.crown.rotation.z = Math.sin(t * 0.9 + tr.userData.ph) * 0.03;
    const fl = tower.userData.flag;
    fl.rotation.y = Math.sin(t * 3) * 0.3;
    butterfly.position.set(8.2 + Math.sin(t * 0.4) * 1.5, 1.4 + Math.sin(t * 1.7) * 0.3, 1.5 + Math.sin(t * 0.27) * 2);
    butterfly.rotation.y = Math.atan2(-Math.cos(t * 0.27) * 0.54, Math.cos(t * 0.4) * 0.6);
    for (const [wp, s] of wings) wp.rotation.x = s * (0.3 + Math.sin(t * 14) * 0.6);
    towerKid.position.y = 2.45 + Math.abs(Math.sin(t * 1.3)) * 0.015;
    if (!squeezing && shape.clay === 1) clay.rotation.y = t * 0.2;
    if (sortTick) sortTick(dt, t);

    // количка
    const F = cartS.force;
    if (F) {
      F.t += dt;
      const u = Math.min(1, F.t / F.dur);
      cartV.lerpVectors(F.v0, F.v1, u);
      setArrow(arCart, tmpV.copy(cart.position).addScaledVector(F.dir, -0.6).setY(1.15), F.dir, 1.3);
      if (u >= 1) { cartS.force = null; arCart.visible = false; if (F.onEnd) F.onEnd(); }
    }
    const sp = cartV.length();
    if (sp > 1e-3 && !cartS.force && cartS.decel > 0) {
      const ns = Math.max(0, sp - cartS.decel * dt);
      cartV.multiplyScalar(ns / sp);
      if (ns === 0 && cartS.onStop) { const f = cartS.onStop; cartS.onStop = null; f(); }
    }
    const sp2 = cartV.length();
    if (sp2 > 0.03 && cartS.decel >= 0.2) setArrow(arCartF, tmpV.copy(cart.position).setY(0.85), tmpV.clone().copy(cartV).multiplyScalar(-1), 0.8);
    else arCartF.visible = false;
    if (sp2 > 1e-3) {
      cart.position.addScaledVector(cartV, dt);
      if (sp2 > 0.05) {
        const target = Math.atan2(-cartV.z, cartV.x);
        let d = target - cartS.heading;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        if (Math.abs(d) < 2.5) cartS.heading += d * Math.min(1, dt * 5); // назад количката се връща, без да се обръща
        cart.rotation.y = cartS.heading;
      }
      for (const w of cart.userData.wheels) w.rotation.z -= (sp2 * dt) / 0.15 * Math.sign(cartV.x * Math.cos(cartS.heading) - cartV.z * Math.sin(cartS.heading) || 1);
      if (cartS.dots) { cartS.dotT += dt; if (cartS.dotT >= 0.25) { cartS.dotT = 0; addDot(tmpV.copy(cart.position).setY(0.06), 0x1e88e5); } }
      if (cart.position.x > FENCE_X - 0.6) {
        cart.position.x = FENCE_X - 0.6; cartV.set(0, 0, 0); cartS.force = null; arCart.visible = false;
        if (cartS.onBump) { const f = cartS.onBump; cartS.onBump = null; f(); }
      }
      if (cart.position.x < PAVE.x0 + 0.6) { cart.position.x = PAVE.x0 + 0.6; cartV.set(0, 0, 0); }
      if (cart.position.z > PAVE.z1 - 0.45 || cart.position.z < PAVE.z0 + 0.45) {
        cart.position.z = Math.min(PAVE.z1 - 0.45, Math.max(PAVE.z0 + 0.45, cart.position.z)); cartV.set(0, 0, 0);
        if (cartS.onStop) { const f = cartS.onStop; cartS.onStop = null; f(); }
      }
    }
    placeKid();
    kid.position.lerp(kidTarget, Math.min(1, dt * 6));
    const forcing = !!cartS.force;
    for (const a of kid.userData.arms) a.rotation.z += ((forcing ? 1.45 : 0.25 + Math.sin(t * 1.5) * 0.05) - a.rotation.z) * Math.min(1, dt * 8);
    kid.position.y = Math.abs(Math.sin(t * (sp2 > 0.05 ? 8 : 1.3))) * (sp2 > 0.05 ? 0.05 : 0.015);

    // топка
    if (ballSim && !ballSim.done) {
      const B = ballSim;
      B.t += dt;
      B.v.y -= G * dt;
      ball.position.addScaledVector(B.v, dt);
      ball.rotation.z -= B.v.x * dt / BALL_R;
      B.dotT += dt;
      if (B.dotT >= 0.07 && B.rest === 0) { B.dotT = 0; addDot(ball.position, 0xff8a65); }
      if (B.catchBack && B.v.y < 0 && ball.position.y <= HOLD.y) {
        ball.position.copy(HOLD); B.done = true; arBall.visible = false;
        if (B.onDone) later(B.onDone, 300);
      } else if (ball.position.y <= BALL_R) {
        ball.position.y = BALL_R;
        if (Math.abs(B.v.y) > 1.2) { B.v.y = -B.v.y * 0.45; B.v.x *= 0.7; } else { B.v.set(0, 0, 0); B.done = true; arBall.visible = false; if (B.onDone) later(B.onDone, 400); }
      }
      if (!B.done) setArrow(arBall, tmpV.copy(ball.position).setY(ball.position.y - 0.05), new THREE.Vector3(0, -1, 0), 0.8);
    }
  });

  // ---------- камера, балончета ----------
  function view(pos, tgt, dur = 1) {
    const w = shell.stageEl.clientWidth || 600;
    const h = shell.stageEl.clientHeight || 400;
    const k = Math.min(2.4, Math.max(1, 1.6 / (w / h)));
    const p = pos.map((v, i) => tgt[i] + (v - tgt[i]) * k);
    stage.stopFollow();
    stage.flyTo(p, tgt, dur);
  }
  const overview = () => view([1, 11, 15], [1, 0.5, 0]);
  const CAMS = {
    cart: [[-4.7, 4.8, 7.6], [-4.7, 0.3, 2.6]],
    kid: [[-5.6, 3.0, 7.0], [-6.6, 0.8, 2.6]],
    ball: [[-3.0, 3.4, 5.0], [-5.7, 1.8, -3.3]],
    slide: [[4.6, 6.2, 5.2], [4.4, 0.3, -3.4]],
    clay: [[5.0, 2.4, 6.0], [5.0, 1.0, 2.6]],
    spring: [[5.0, 2.4, 6.0], [5.0, 1.0, 2.6]],
  };
  const camTo = (id) => view(...CAMS[id]);
  let tip = null;
  function say(anchor, html, cls = '', lift = 1) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const anchorOf = (o) => (o.at ? o.at() : o.root);

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null, hit));
  let menuHandler = null;
  const MENU = Object.values(OBJ).map((o) => ({ id: o.id, label: o.label, icon: o.icon }));
  const menu = cornerMenu(stage, { title: 'Какво има на площадката', items: MENU, onSelect: (id) => menuHandler && menuHandler(id) });

  // Въпрос с избор. bad може да е масив — отделно обяснение за всеки грешен отговор.
  function ask(boxEl, { q, opts, right, bad, ok, onRight, onWrong }) {
    const order = opts.map((o, k) => k).sort(() => Math.random() - 0.5);
    const wrap = document.createElement('div');
    wrap.className = 'forces-q';
    wrap.innerHTML = `<p>${q}</p><div class="choices">${order.map((k) => `<button class="choice" data-i="${k}">${esc(opts[k])}</button>`).join('')}</div>`;
    boxEl.appendChild(wrap);
    let tries = 0;
    wrap.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      const i = +b.dataset.i;
      if (i !== right) {
        tries++;
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(Array.isArray(bad) ? bad[i] : bad, 'bad');
        if (onWrong) onWrong(tries);
        return;
      }
      b.classList.add('right');
      wrap.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      wrap.querySelectorAll('.choice:not(.right)').forEach((x) => x.remove());
      shell.msg(ok, 'good');
      if (onRight) onRight();
    }));
    wrap.scrollIntoView({ block: 'nearest' });
    return wrap;
  }
  const nextBtn = (text, fn) => {
    const b = shell.setControls(`<button class="btn primary">${text}</button>`).querySelector('button');
    b.addEventListener('click', fn);
    return b;
  };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip(); resetWorld();
    menu.setTitle('Какво има на площадката');
    menu.setItems(MENU);
    menu.show(true);
    const seen = new Set();
    shell.task(`<p>Добре дошъл на площадката! Тук телата се движат, падат, плъзгат се и се смачкват — все заради някаква <b>сила</b>.</p>
      <p><b>Разгледай всичките ${MENU.length} неща</b> — кликни върху тях или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата площадка</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${MENU.length}`);
    upd();
    const demo = (id) => {
      if (id === 'cart' || id === 'kid') {
        if (cartS.force || cartV.lengthSq() > 1e-4) return;
        cartSetup(-7.2, 2.6, 0, 0, { decel: 0.6 });
        later(() => pushCart('demo', () => { cartS.kidFollow = false; cartS.onStop = () => later(() => { if (cartV.lengthSq() < 1e-6) cartSetup(-7.2, 2.6); }, 1500); }), 500);
      } else if (id === 'ball') {
        if (ballSim) return;
        later(() => throwBall(0, 0, { onDone: () => later(ballHome, 800) }), 700);
      } else if (id === 'slide') {
        if (acts.size) return;
        boxAtTop(1);
        later(() => slideBox(1, LANES[1].d, () => later(() => boxAtTop(1), 1200)), 700);
      } else if (id === 'spring') {
        if (squeezing) return;
        later(() => squeeze('spring'), 600);
      }
    };
    const visit = (id) => {
      const o = OBJ[id];
      if (!o) return;
      camTo(id);
      say(anchorOf(o), `<b>${esc(o.icon)} ${esc(o.label)}</b><br>${o.note}`, 'wide', o.lift);
      demo(id);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size >= MENU.length) { next.disabled = false; shell.msg('Браво! Разгледа всичко. Сега ще изпробваш силите сам.', 'good'); }
    };
    clickHandler = (id) => { if (!id || !OBJ[id]) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.show(false); menuHandler = null; step2(); });
    overview();
  }

  // ---------- 2. Изпробвай силите ----------
  let m2 = 0;
  const upd2 = (part) => shell.score(`Опит ${part} от 4 · грешки: ${m2}`);
  function step2() {
    shell.step(1);
    clearTip(); resetWorld();
    clickHandler = null;
    m2 = 0;
    partCart();
  }

  // 2.1 Мускулна сила: количката
  function partCart() {
    upd2(1); shell.msg('');
    camTo('cart');
    clearTrail();
    let goal = 1;
    const GOALS = {
      1: 'Количката стои на място. <b>Накарай я да тръгне напред</b> — към оградата.',
      2: 'Количката се търкаля към оградата. <b>Спри я</b>, преди да се удари!',
      3: 'Детето пак бутна количката напред. <b>Накарай я да завие</b> към пейката.',
    };
    const setTask = () => shell.task(`<p><b>🛒 Мускулна сила.</b> Детето може да бута и да дърпа количката. Синята стрелка показва накъде действа силата.</p>
      <p>${GOALS[goal]}</p><p class="small">Цел ${goal} от 3</p>`);
    const ctrl = shell.setControls(`<div class="forces-acts">
      <button class="btn act" data-a="fwd">➡ Бутни напред</button>
      <button class="btn act" data-a="back">⬅ Дръпни назад</button>
      <button class="btn act" data-a="side">⬇ Бутни към пейката</button></div>`);
    const btns = [...ctrl.querySelectorAll('.act')];
    const enable = (on) => btns.forEach((b) => { b.disabled = !on; });
    const setupGoal = () => {
      clearTrail();
      if (goal === 1) cartSetup(-7.2, 2.6);
      else if (goal === 2) {
        cartSetup(-6.6, 2.6, 0.5, 0);
        cartS.onBump = () => {
          enable(false);
          say(cart, 'Бум! Оградата спря количката.', 'tag', 1.3);
          shell.msg('Количката се удари в оградата — оградата я спря. Опитай пак: спри я ти, преди да стигне до нея.', 'bad');
          later(() => { clearTip(); setupGoal(); enable(true); }, 2200);
        };
      } else cartSetup(-7.4, 1.5, 0.5, 0, { dots: true });
      setTask();
    };
    const mistake = (text) => {
      m2++; upd2(1);
      shell.msg(text, 'bad');
      cartS.onBump = null;
      later(() => { clearTip(); setupGoal(); enable(true); }, 2600);
    };
    btns.forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      const a = b.dataset.a;
      enable(false);
      clearTip();
      shell.msg('');
      pushCart(a, () => {
        if (goal === 1) {
          if (a === 'fwd') {
            say(cart, '✔ Силата тласна количката напред и тя тръгна.', 'good', 1.3);
            shell.msg('Вярно! Мускулната сила накара количката да тръгне.', 'good');
            later(() => { clearTip(); goal = 2; setupGoal(); enable(true); }, 2200);
          } else if (a === 'back') mistake('Количката тръгна, но назад — натам, накъдето я дръпна детето. Силата трябва да сочи напред.');
          else mistake('Количката тръгна, но към пейката — натам, накъдето сочи силата. Искаме напред, към оградата.');
        } else if (goal === 2) {
          if (a === 'back') {
            cartS.onBump = null;
            say(cart, '✔ Силата беше обратна на движението и количката спря.', 'good', 1.3);
            shell.msg('Вярно! Детето дръпна назад и мускулната сила спря количката.', 'good');
            later(() => { clearTip(); goal = 3; setupGoal(); enable(true); }, 2400);
          } else if (a === 'fwd') mistake('Силата беше в посоката на движението, затова количката се засили. За да спре, силата трябва да е обратна на движението.');
          else mistake('Количката зави, но не спря. За да спре, силата трябва да е обратна на движението.');
        } else {
          if (a === 'side') {
            say(cart, '✔ Силата встрани промени посоката — виж как завива следата.', 'good', 1.3);
            shell.msg('Вярно! Мускулната сила може да накара тялото да тръгне, да спре или да завие.', 'good');
            cartS.onStop = null;
            later(() => { cartS.decel = 0.5; }, 1800);
            nextBtn('Следващ опит →', () => { clearTip(); partBall(); });
          } else if (a === 'fwd') mistake('Количката се засили, но не зави. Силата трябва да сочи към пейката.');
          else mistake('Количката спря, но не зави. Силата трябва да сочи натам, накъдето искаме да завие.');
        }
      });
    }));
    setupGoal();
    say(kid, 'Аз ще бутам и ще дърпам!', 'tag', 1.5);
  }

  // 2.2 Земно притегляне: топката от кулата
  function partBall() {
    upd2(2); shell.msg('');
    clearTrail();
    cartSetup(-7.2, 2.6);
    ballHome();
    camTo('ball');
    shell.setControls('');
    shell.task(`<p><b>⚽ Земно притегляне.</b> Детето на кулата държи топка и ще я пусне.</p><div class="forces-qs"></div>`);
    say(ball, 'Ще я пусна!', 'tag', 0.5);
    const qs = container.querySelector('.forces-qs');
    ask(qs, {
      q: '<b>Предскажи:</b> накъде ще полети топката, когато детето я пусне?',
      opts: ['Надолу, към земята', 'Нагоре, към облаците', 'Ще остане във въздуха'],
      right: 0,
      bad: [null, 'Нищо не тласка топката нагоре. Помисли какво става с ябълката, когато се откъсне от клона.', 'Видял ли си някога пусната топка да виси във въздуха? Земята привлича телата към себе си.'],
      ok: 'Вярно! Гледай как пада.',
      onWrong: () => { m2++; upd2(2); },
      onRight: () => {
        clearTip();
        throwBall(0, 0, {
          onDone: () => {
            say(ball, '✔ Топката падна надолу. Червената стрелка показва земното притегляне — то дърпа топката към земята.', 'good wide', 0.6);
            const b = shell.setControls('<button class="btn act throw">🤾 Хвърли топката встрани</button>').querySelector('button');
            b.addEventListener('click', () => {
              b.disabled = true;
              clearTip(); clearTrail(); ballHome();
              later(() => throwBall(1.8, 0, { onDone: askSide }), 300);
            });
          },
        });
      },
    });
    function askSide() {
      shell.setControls('');
      say(ball, 'Виж следата на топката.', 'tag', 0.6);
      ask(qs, {
        q: 'Детето хвърли топката встрани. <b>Накъде я дърпаше земното притегляне</b>, докато летеше?',
        opts: ['През цялото време надолу', 'Встрани, натам, накъдето е хвърлена', 'Отначало встрани, а после надолу'],
        right: 0,
        bad: [null, 'Встрани топката се движи, защото детето я хвърли. Погледни червената стрелка — накъде сочеше?', 'Погледни червената стрелка по време на полета — менеше ли посоката си?'],
        ok: 'Вярно! Земното притегляне винаги дърпа надолу. Затова следата се извива към земята.',
        onWrong: () => { m2++; upd2(2); },
        onRight: () => nextBtn('Следващ опит →', () => { clearTip(); clearTrail(); ballHome(); partSlide(); }),
      });
    }
  }

  // 2.3 Триене: кутията по четирите настилки
  function partSlide() {
    upd2(3); shell.msg('');
    camTo('slide');
    flags.clear();
    boxAtTop(0);
    const tried = new Set();
    shell.task(`<p><b>🛝 Триене.</b> Пусни <b>една и съща кутия</b> по всяка от четирите настилки. Тя тръгва от едно и също място.</p>
      <p>Оранжевата стрелка показва триенето — то забавя кутията. Сравни докъде стига тя.</p><div class="forces-qs"></div>`);
    const ctrl = shell.setControls(`<div class="forces-acts">${LANES.map((L, i) => `<button class="btn act lane" data-l="${i}">${L.icon} ${L.name}</button>`).join('')}</div>`);
    const btns = [...ctrl.querySelectorAll('.lane')];
    say(sbox, 'Избери настилка.', 'tag', 0.6);
    btns.forEach((b) => b.addEventListener('click', () => {
      if (acts.size) return;
      const i = +b.dataset.l;
      const L = LANES[i];
      clearTip();
      btns.forEach((x) => { x.disabled = true; });
      boxAtTop(i);
      later(() => slideBox(i, L.d, () => {
        tried.add(i);
        b.classList.add('tried');
        if (!flags.children.find((f) => f.userData.lane === i)) addFlag(i, L.d, `${L.name}: ${nice(L.d)} м`).userData.lane = i;
        say(sbox, `По ${L.name === 'лед' ? 'леда' : L.name === 'дърво' ? 'дървото' : L.name === 'килим' ? 'килима' : 'пясъка'} кутията стигна ${nice(L.d)} м.`, 'tag', 0.6);
        btns.forEach((x) => { x.disabled = false; });
        if (tried.size === LANES.length) {
          shell.setControls('');
          askFr();
        } else shell.msg(`Опитай и другите настилки (${tried.size} от ${LANES.length}).`);
      }), 300);
    }));
    function askFr() {
      shell.msg('');
      ask(container.querySelector('.forces-qs'), {
        q: 'На коя настилка <b>триенето е най-голямо</b>?',
        opts: ['На пясъка', 'На леда', 'На дървото', 'На килима'],
        right: 0,
        bad: [null, 'По леда кутията стигна най-далеч. Значи там триенето я забавяше най-малко.', 'По дървото кутията стигна доста далеч. Къде спря най-бързо?', 'По килима кутията спря бързо, но има място, където спря още по-бързо.'],
        ok: 'Вярно! По пясъка кутията спря най-бързо — там триенето е най-голямо. По леда триенето е най-малко и кутията стигна най-далеч.',
        onWrong: () => { m2++; upd2(3); },
        onRight: () => nextBtn('Следващ опит →', () => { clearTip(); partShape(); }),
      });
    }
  }

  // 2.4 Силата променя формата
  function partShape() {
    upd2(4); shell.msg('');
    flags.clear(); boxAtTop(1);
    camTo('clay');
    shape.clay = 1; shape.spring = 1; applyShapes();
    const tried = new Set();
    shell.task(`<p><b>✊ Сила и форма.</b> Ръката ще стисне пластелина и пружината. Гледай какво става с тях, <b>докато</b> ръката ги натиска и <b>след като</b> ги пусне.</p><div class="forces-qs"></div>`);
    const ctrl = shell.setControls(`<div class="forces-acts">
      <button class="btn act sq" data-k="clay">✊ Стисни пластелина</button>
      <button class="btn act sq" data-k="spring">✊ Стисни пружината</button></div>`);
    const btns = [...ctrl.querySelectorAll('.sq')];
    btns.forEach((b) => b.addEventListener('click', () => {
      if (squeezing) return;
      const k = b.dataset.k;
      clearTip();
      btns.forEach((x) => { x.disabled = true; });
      if (k === 'clay') { shape.clay = 1; applyShapes(); }
      squeeze(k, () => {
        tried.add(k);
        b.classList.add('tried');
        say(k === 'clay' ? clay : springG, k === 'clay' ? 'Пластелинът след ръката' : 'Пружината след ръката', 'tag', k === 'clay' ? 0.5 : 0.9);
        btns.forEach((x) => { x.disabled = false; });
        if (tried.size === 2) { shell.setControls(''); askShape(); }
      });
    }));
    function askShape() {
      ask(container.querySelector('.forces-qs'), {
        q: 'Какво стана, <b>след като ръката се махна</b>?',
        opts: ['Пластелинът остана сплескан, а пружината се върна в предишната си форма', 'И двете се върнаха в предишната си форма', 'И двете останаха смачкани'],
        right: 0,
        bad: [null, 'Погледни пластелина на масата — кълбо ли е отново?', 'Погледни пружината — свита ли е още?'],
        ok: 'Вярно! Силата на ръката промени формата и на двете. Пружината се върна в предишната си форма, а пластелинът остана сплескан.',
        onWrong: () => { m2++; upd2(4); },
        onRight: () => nextBtn('Напред →', () => { scores.push(stepScore(m2, 4)); clearTip(); step3(); }),
      });
    }
  }

  // ---------- 3. Подреди силите ----------
  const SORT = [
    { id: 'kick', label: 'Ритам топка', kind: 'muscle', note: 'С мускулите на крака ритаме топката и тя полита.' },
    { id: 'bag', label: 'Вдигам чанта', kind: 'muscle', note: 'Мускулите на ръката вдигат чантата нагоре.' },
    { id: 'sled', label: 'Дърпам шейна', kind: 'muscle', note: 'С мускулите на ръцете дърпаме шейната и тя тръгва.' },
    { id: 'apple', label: 'Ябълка пада', kind: 'gravity', note: 'Земното притегляне дърпа ябълката надолу.' },
    { id: 'rain', label: 'Дъждът вали', kind: 'gravity', note: 'Земното притегляне дърпа капките надолу към земята.' },
    { id: 'leaf', label: 'Лист пада', kind: 'gravity', note: 'Листът пада, защото земното притегляне го дърпа надолу.' },
    { id: 'rollstop', label: 'Топка спира в тревата', kind: 'friction', note: 'Триенето в тревата забавя топката, докато тя спре.' },
    { id: 'shoe', label: 'Обувка не се хлъзга', kind: 'friction', note: 'Триенето между подметката и земята не ни дава да се подхлъзнем.' },
    { id: 'brake', label: 'Спирачки на колело', kind: 'friction', note: 'Спирачките се трият в колелото и то спира.' },
  ];
  const sortWorld = new THREE.Group();
  sortWorld.position.set(0, 0, 12);
  sortWorld.visible = false;
  scene.add(sortWorld);
  let stopDrag = null;
  function step3() {
    shell.step(2);
    clearTip(); resetWorld();
    sortWorld.clear();
    sortWorld.visible = true;
    const narrow = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400) < 1.1;
    const SZ = sortWorld.position.z;
    if (narrow) { stage.stopFollow(); stage.flyTo([0, 14, SZ + 4.6], [0, 0, SZ + 0.6], 1); } else view([0, 8.2, SZ + 9], [0, 0, SZ + 1.2]);
    const RR = narrow ? 1.1 : 1.5;
    const rings = FORCE_IDS.map((k, i) => {
      const z = zoneRing(FORCES[k].color, RR);
      if (narrow) z.position.set((i - 1) * 2.4, 0.02, -2.6);
      else z.position.set((i - 1) * 4.4, 0.02, -1.6);
      const l = labelSprite(FORCES[k].name, { size: narrow ? 0.4 : 0.38, color: '#fff', bg: FORCES[k].css, border: FORCES[k].css });
      l.position.set(0, 0.3, -RR - 0.35);
      z.add(l);
      sortWorld.add(z);
      return { k, z, n: 0 };
    });
    const order = SORT.slice().sort(() => Math.random() - 0.5);
    const tokens = order.map((o, i) => {
      const g = new THREE.Group();
      const puck = cyl(0.55, 0.6, 0.12, 0xffffff, 24);
      puck.position.y = 0.06;
      const m = miniModel(o.id);
      m.position.y = 0.0;
      const l = labelSprite(o.label, { size: narrow ? 0.3 : 0.26 });
      l.position.y = 1.45;
      g.add(puck, m, l);
      if (narrow) { g.scale.setScalar(0.85); g.position.set(((i % 3) - 1) * 2.4, 0, 0.1 + Math.floor(i / 3) * 1.65); }
      else g.position.set(i < 5 ? -5.2 + i * 2.6 : -3.9 + (i - 5) * 2.6, 0, i < 5 ? 1.8 : 4.0);
      g.userData = { pickId: 's-' + o.id, dragId: 's-' + o.id, o, anim: m.userData.anim, ph: i * 0.37 };
      sortWorld.add(g);
      addHitBox(g, 1);
      return g;
    });
    sortTick = (dt, t) => { for (const g of tokens) g.userData.anim(t + g.userData.ph); };
    let mistakes = 0;
    let placed = 0;
    const tries = new Map();
    shell.task(`<p>Във всяка от тези случки действа сила. Гледай какво става.</p>
      <p><b>Провлачи всяка случка</b> в кръга на силата, която действа в нея.</p>
      <div class="forces-legend">${FORCE_IDS.map((k) => `<span><i style="background:${FORCES[k].css}"></i>${FORCES[k].name}</span>`).join('')}</div>`);
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${placed} от ${SORT.length} · грешки: ${mistakes}`);
    upd();
    clickHandler = (id, hit) => {
      if (!hit) return clearTip();
      const o = hit.root.userData.o;
      if (o && !hit.root.userData.locked) say(hit.root, `<b>${esc(o.label)}</b>`, 'tag', 1.9);
    };
    const RAD = RR + 0.2;
    const slots = narrow ? [[-0.45, -0.35], [0.45, -0.35], [0, 0.45]] : [[-0.6, -0.5], [0.6, -0.5], [0, 0.6]];
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => { clearTip(); stage.stopFollow(); },
      onDrop: (g, p, start) => {
        const r = rings.find((R) => Math.hypot(p.x - R.z.position.x, p.z - R.z.position.z) < RAD);
        if (!r) { g.position.copy(start); return; }
        const o = g.userData.o;
        if (r.k === o.kind) {
          g.userData.locked = true;
          const [sx, sz] = slots[r.n] || [0, 0];
          g.position.set(r.z.position.x + sx, 0, r.z.position.z + sz);
          g.scale.setScalar(narrow ? 0.6 : 0.75);
          r.n++;
          placed++;
          say(g, `✔ ${esc(o.note)}`, 'good', 1.6);
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          const n = (tries.get(o.id) || 0) + 1;
          tries.set(o.id, n);
          g.position.copy(start);
          let why = {
            muscle: 'Не е тук. Мускулна сила има, когато някой с мускулите си бута, дърпа, вдига или рита. Някой прави ли това тук?',
            gravity: 'Не е тук. Земното притегляне дърпа телата надолу, към земята. Тук нещо пада ли?',
            friction: 'Не е тук. Триенето забавя или спира движението, когато две повърхности се трият една в друга. Така ли е тук?',
          }[r.k];
          if (n >= 2) why += ' Подсказка: мускулна сила — някой бута, дърпа или вдига; земно притегляне — нещо пада; триене — нещо се забавя, спира или не се хлъзга.';
          say(g, '✘ Помисли пак.', 'bad', 1.6);
          shell.msg(why, 'bad');
        }
        upd();
        if (placed === SORT.length) {
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 3));
          shell.msg('Браво! Всички случки са подредени.', 'good');
          nextBtn('Напред →', step4);
        }
      },
    });
  }

  // ---------- 4. Приложи и предскажи ----------
  function step4() {
    shell.step(3);
    clearTip(); resetWorld();
    sortTick = null;
    sortWorld.visible = false;
    sortWorld.clear();
    let mistakes = 0;
    clickHandler = null;
    const upd = (part) => shell.score(`Задача ${part} от 4 · грешки: ${mistakes}`);
    shell.task('<div class="forces-qs"></div>');
    shell.setControls('');
    const qs = container.querySelector('.forces-qs');
    const onWrong = () => { mistakes++; upd(cur); };
    let cur = 1;
    const go = (fn) => nextBtn('Напред →', () => { shell.setControls(''); shell.msg(''); clearTip(); fn(); });

    // 1. Пясък по заледен път
    upd(1);
    camTo('slide');
    boxAtTop(0);
    addFlag(0, LANES[0].d, 'лед: 7,2 м');
    say(sbox, '🧊 Заледен път', 'tag', 0.6);
    ask(qs, {
      q: 'През зимата по заледените пътища и тротоари посипват пясък. <b>Защо?</b>',
      opts: ['За да стане триенето по-голямо и хората и колите да не се пързалят', 'За да се стопи ледът по-бързо', 'За да стане пътят по-гладък и хлъзгав'],
      right: 0,
      bad: [null, 'Пясъкът не топи леда. Спомни си по коя настилка кутията спря най-бързо.', 'Обратното! Спомни си какво стана с кутията по пясъка.'],
      ok: 'Вярно! Пясъкът увеличава триенето. Виж — по посипания с пясък лед кутията спира много по-рано.',
      onWrong,
      onRight: () => {
        clearTip();
        sandDots.visible = true;
        sandDots.children.forEach((d, k) => { d.visible = false; later(() => { d.visible = true; }, k * 12); });
        later(() => slideBox(0, 2.0, () => { addFlag(0, 2.0, 'лед с пясък: 2,0 м'); say(sbox, 'С пясък кутията спря много по-рано.', 'tag', 0.6); go(q2); }, 1.1), 1000);
      },
    });

    // 2. Топка, хвърлена нагоре
    function q2() {
      cur = 2; upd(2); qs.innerHTML = '';
      camTo('ball');
      ballHome();
      say(ball, 'Ще я хвърля право нагоре!', 'tag', 0.5);
      ask(qs, {
        q: '<b>Предскажи:</b> детето хвърля топката право нагоре. Какво ще стане с нея?',
        opts: ['Ще се издигне, ще спре за миг и ще падне обратно', 'Ще лети нагоре все по-бързо, докато изчезне', 'Ще спре високо и ще остане във въздуха'],
        right: 0,
        bad: [null, 'Земното притегляне дърпа топката надолу през цялото време. Може ли тогава тя да лети нагоре все по-бързо?', 'Може ли нещо да остане да виси във въздуха, щом земното притегляне го дърпа надолу?'],
        ok: 'Вярно! Земното притегляне забавя топката, докато се издига, после я дърпа обратно надолу.',
        onWrong,
        onRight: () => { clearTip(); clearTrail(); throwBall(0, 3.3, { catchBack: true, onDone: () => { say(ball, 'Стрелката сочеше надолу през цялото време.', 'tag', 0.5); go(q3); } }); },
      });
    }

    // 3. Гумена топка
    function q3() {
      cur = 3; upd(3); qs.innerHTML = '';
      clearTrail();
      camTo('clay');
      shape.clay = 1; applyShapes();
      rubber.visible = true;
      say(rubber, 'Гумена топка', 'tag', 0.6);
      ask(qs, {
        q: '<b>Предскажи:</b> ръката стиска гумена топка и после я пуска. Какво ще стане с формата на топката?',
        opts: ['Ще се сплеска, а после ще се върне в предишната си форма', 'Ще остане сплескана като пластелина', 'Формата ѝ изобщо няма да се промени'],
        right: 0,
        bad: [null, 'Гумата прилича повече на пружината, отколкото на пластелина. Какво направи пружината?', 'Силата на ръката може да промени формата на телата. Какво стана с пружината, докато ръката я натискаше?'],
        ok: 'Вярно! Докато я стискаме, силата променя формата ѝ. Щом я пуснем, гумената топка се връща в предишната си форма — както пружината.',
        onWrong,
        onRight: () => { clearTip(); squeeze('rubber', () => go(q4)); },
      });
    }

    // 4. Количката, която детето пуска
    function q4() {
      cur = 4; upd(4); qs.innerHTML = '';
      rubber.visible = false;
      camTo('cart');
      cartSetup(-7.6, 2.6, 0, 0, { decel: 0.35 });
      say(cart, 'Ще я бутна веднъж и ще я пусна.', 'tag', 1.3);
      ask(qs, {
        q: '<b>Предскажи:</b> детето бутва количката силно веднъж и я пуска. Какво ще стане?',
        opts: ['Ще се търкаля все по-бавно и ще спре, защото триенето я забавя', 'Ще се търкаля вечно със същата скорост', 'Ще спре в мига, в който детето я пусне'],
        right: 0,
        bad: [null, 'Видял ли си количка, която се търкаля вечно? Нещо я забавя, докато колелата се движат по земята.', 'След бутането количката продължава да се движи. Какво я забавя постепенно?'],
        ok: 'Вярно! Триенето между колелата и земята постепенно забавя количката, докато тя спре. Виж оранжевата стрелка.',
        onWrong,
        onRight: () => {
          clearTip();
          pushCart('demo', () => { cartS.kidFollow = false; cartS.onStop = () => { say(cart, '✔ Триенето я спря.', 'good', 1.3); finishAll(); }; });
        },
      });
    }

    function finishAll() {
      scores.push(stepScore(mistakes, 3));
      nextBtn('Виж резултата', () => {
        clearTip();
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
    sortWorld.visible = false;
    step1();
  }

  step1();
  return {
    dispose() {
      clearTimers();
      acts.clear();
      if (stopDrag) stopDrag();
      stage.dispose();
      style.remove();
    },
  };
}
