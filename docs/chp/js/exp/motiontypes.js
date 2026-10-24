// 4.2.1 „Видове движение“ — 3D парк: влак по прави релси, хвърлена топка, пързалка, люлка,
// карусел, вятърна турбина и часовник с махало.
// Стъпки: опознай → пусни движението и виж следата → подреди движенията → приложи и предскажи.
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const CSS = `
.motiontypes-kinds { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 6px 0; }
.motiontypes-kinds .choice { flex-direction: column; align-items: flex-start; gap: 2px; padding: 8px; }
.motiontypes-kinds .choice small { font-weight: 400; color: #556; font-size: 0.8rem; }
.motiontypes-q { margin-top: 10px; }
@media (max-width: 420px) { .motiontypes-kinds .choice small { font-size: 0.75rem; } }
`;

const KINDS = {
  straight: { name: 'праволинейно', icon: '📏', def: 'по права линия', color: 0x1e88e5, css: '#1e88e5' },
  curved: { name: 'криволинейно', icon: '↪', def: 'по крива линия', color: 0xef6c00, css: '#ef6c00' },
  rotate: { name: 'въртене', icon: '🔄', def: 'около ос', color: 0x8e24aa, css: '#8e24aa' },
  osc: { name: 'трептене', icon: '↔', def: 'напред-назад около едно място', color: 0x2e7d32, css: '#2e7d32' },
};
const KIND_IDS = ['straight', 'curved', 'rotate', 'osc'];

// ---------- помощни модели ----------
function box(w, h, d, color, extra) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra)); }
function cyl(rt, rb, h, color, seg = 12) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color)); }

// Дете: седнало (краката напред по +x) или право.
function childModel(shirt, sit = false) {
  const g = new THREE.Group();
  const skin = mat(0xf0c3a0);
  const legM = mat(0x3949ab);
  for (const s of [1, -1]) {
    const hip = new THREE.Group();
    hip.position.set(0, 0.5, s * 0.08);
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.38, 4, 8), legM);
    l.position.y = -0.24;
    hip.add(l);
    if (sit) hip.rotation.z = Math.PI / 2;
    g.add(hip);
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
  const leafM = mat(0x3f8f3a, { flat: true });
  for (const [x, y, z, r] of [[0, 2.0, 0, 1.0], [0.55, 1.7, 0.25, 0.7], [-0.5, 1.75, -0.25, 0.72], [0.1, 2.6, 0.1, 0.65]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafM);
    b.position.set(x, y, z);
    g.add(b);
  }
  g.scale.setScalar(s);
  return g;
}

function trainModel() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const wheels = [];
  const addWheels = (x0, x1) => {
    for (const x of [x0, x1]) for (const z of [0.36, -0.36]) {
      const w = cyl(0.2, 0.2, 0.08, 0x263238, 14);
      w.rotation.x = Math.PI / 2;
      const sp = box(0.3, 0.05, 0.09, 0xb0bec5);
      const wg = new THREE.Group();
      wg.add(w, sp);
      wg.position.set(x, 0.32, z);
      inner.add(wg);
      wheels.push(wg);
    }
  };
  // локомотив
  const body = box(1.3, 0.55, 0.7, 0xd32f2f);
  body.position.set(0.25, 0.65, 0);
  const cab = box(0.55, 0.65, 0.74, 0xb71c1c);
  cab.position.set(-0.4, 1.0, 0);
  const roof = box(0.7, 0.08, 0.84, 0x37474f);
  roof.position.set(-0.4, 1.36, 0);
  const win = box(0.3, 0.25, 0.76, 0xbbdefb);
  win.position.set(-0.4, 1.08, 0);
  const chim = cyl(0.1, 0.13, 0.4, 0x37474f, 10);
  chim.position.set(0.65, 1.1, 0);
  const nose = cyl(0.28, 0.28, 0.1, 0xffca28, 14);
  nose.rotation.z = Math.PI / 2;
  nose.position.set(0.92, 0.65, 0);
  inner.add(body, cab, roof, win, chim, nose);
  addWheels(0.5, -0.2);
  // вагон
  const wag = box(1.2, 0.6, 0.72, 0x1565c0);
  wag.position.set(-1.6, 0.72, 0);
  const wroof = box(1.3, 0.08, 0.82, 0x37474f);
  wroof.position.set(-1.6, 1.06, 0);
  for (const x of [-1.95, -1.6, -1.25]) {
    const w2 = box(0.22, 0.2, 0.74, 0xbbdefb);
    w2.position.set(x, 0.82, 0);
    inner.add(w2);
  }
  const link = box(0.3, 0.06, 0.06, 0x263238);
  link.position.set(-0.85, 0.4, 0);
  inner.add(wag, wroof, link);
  addWheels(-1.25, -1.95);
  g.userData.wheels = wheels;
  g.userData.chimney = chim;
  const marker = new THREE.Object3D();
  marker.position.set(0.25, 1.1, 0);
  inner.add(marker);
  g.userData.marker = marker;
  return g;
}

function turbineModel() {
  const g = new THREE.Group();
  const tower = cyl(0.1, 0.22, 4.6, 0xeceff1, 12);
  tower.position.y = 2.3;
  const nac = box(0.5, 0.32, 0.36, 0xeceff1);
  nac.position.set(0, 4.7, -0.05);
  const rotor = new THREE.Group();
  rotor.position.set(0, 4.7, 0.2);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), mat(0xcfd8dc));
  rotor.add(hub);
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI * 2) / 3;
    const blade = box(0.2, 1.7, 0.05, 0xfafafa);
    blade.position.y = 0.95;
    const tipC = box(0.2, 0.25, 0.06, i === 0 ? 0xe53935 : 0xfafafa);
    tipC.position.y = 1.72;
    arm.add(blade, tipC);
    rotor.add(arm);
  }
  const marker = new THREE.Object3D();
  marker.position.set(0, 1.75, 0.06);
  rotor.add(marker);
  g.add(tower, nac, rotor);
  g.userData.rotor = rotor;
  g.userData.marker = marker;
  return g;
}

function carouselModel() {
  const g = new THREE.Group();
  const base = cyl(1.5, 1.6, 0.18, 0x8d6e63, 28);
  base.position.y = 0.09;
  g.add(base);
  const spin = new THREE.Group();
  g.add(spin);
  const deck = cyl(1.4, 1.4, 0.1, 0xffcc80, 28);
  deck.position.y = 0.23;
  const pole = cyl(0.08, 0.08, 1.8, 0xb0bec5);
  pole.position.y = 1.1;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.6, 16), mat(0xe53935, { flat: true }));
  roof.position.y = 2.25;
  const flag = box(0.03, 0.4, 0.03, 0x455a64);
  flag.position.y = 2.7;
  spin.add(deck, pole, roof, flag);
  const cols = [0x42a5f5, 0xffee58, 0x66bb6a, 0xab47bc];
  let marker = null;
  cols.forEach((c, i) => {
    const a = (i * Math.PI) / 2;
    const s = new THREE.Group();
    s.position.set(Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1);
    const rodM = cyl(0.025, 0.025, 1.75, 0xcfd8dc, 6);
    rodM.position.y = 1.15;
    const seat = box(0.42, 0.28, 0.3, c);
    seat.position.y = 0.62;
    const back = box(0.08, 0.3, 0.3, c);
    back.position.set(-0.17, 0.85, 0);
    s.rotation.y = -a;
    s.add(rodM, seat, back);
    spin.add(s);
    if (i === 0) { marker = new THREE.Object3D(); marker.position.y = 0.8; s.add(marker); }
  });
  g.userData.spin = spin;
  g.userData.marker = marker;
  return g;
}

function swingModel() {
  const g = new THREE.Group();
  const wood = mat(0x8d6e63);
  const H = 2.6;
  for (const z of [-0.8, 0.8]) for (const s of [1, -1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.75, 8), wood);
    leg.position.set(s * 0.45, H / 2, z);
    leg.rotation.z = s * 0.18;
    g.add(leg);
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.9, 8), wood);
  beam.rotation.x = Math.PI / 2;
  beam.position.y = H;
  g.add(beam);
  const pivot = new THREE.Group();
  pivot.position.y = H;
  g.add(pivot);
  const L = 2.0;
  for (const z of [-0.25, 0.25]) {
    const rope = cyl(0.015, 0.015, L, 0x5d4037, 5);
    rope.position.set(0, -L / 2, z);
    pivot.add(rope);
  }
  const seat = box(0.36, 0.06, 0.6, 0xff7043);
  seat.position.y = -L;
  pivot.add(seat);
  const kid = childModel(0x26a69a, true);
  kid.scale.setScalar(0.8);
  kid.position.set(-0.08, -L - 0.37, 0);
  kid.userData.arms.forEach((a) => { a.rotation.z = Math.PI * 0.85; });
  pivot.add(kid);
  const marker = new THREE.Object3D();
  marker.position.y = -L + 0.05;
  pivot.add(marker);
  g.userData.pivot = pivot;
  g.userData.marker = marker;
  return g;
}

// Пързалка по x: стълба при x = -1.2, права улейна част до x = +1.3.
const SLIDE_TOP = new THREE.Vector3(-0.95, 1.85, 0);
const SLIDE_BOT = new THREE.Vector3(1.35, 0.35, 0);
function slideModel() {
  const g = new THREE.Group();
  const metal = mat(0x90a4ae);
  for (const z of [-0.3, 0.3]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6), metal);
    r.position.set(-1.35, 1.0, z);
    g.add(r);
  }
  for (let i = 0; i < 5; i++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), metal);
    rung.rotation.x = Math.PI / 2;
    rung.position.set(-1.35, 0.3 + i * 0.36, 0);
    g.add(rung);
  }
  const plat = box(0.55, 0.08, 0.7, 0x1e88e5);
  plat.position.set(-1.1, 1.72, 0);
  g.add(plat);
  for (const z of [-0.3, 0.3]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.72, 6), metal);
    post.position.set(-0.85, 0.86, z);
    g.add(post);
  }
  const dir = SLIDE_BOT.clone().sub(SLIDE_TOP);
  const len = dir.length() + 0.3;
  const ang = Math.atan2(dir.y, dir.x);
  const chute = new THREE.Group();
  chute.position.copy(SLIDE_TOP).add(SLIDE_BOT).multiplyScalar(0.5);
  chute.position.y -= 0.13;
  chute.rotation.z = ang;
  const bed = box(len, 0.06, 0.6, 0xffb300);
  const s1 = box(len, 0.16, 0.05, 0xffa000); s1.position.set(0, 0.08, 0.3);
  const s2 = s1.clone(); s2.position.z = -0.3;
  chute.add(bed, s1, s2);
  g.add(chute);
  const kid = childModel(0xec407a, true);
  kid.scale.setScalar(0.8);
  g.add(kid);
  g.userData.kid = kid;
  g.userData.angle = ang;
  const marker = new THREE.Object3D();
  marker.position.set(0, 0.42, 0);
  kid.add(marker);
  g.userData.marker = marker;
  return g;
}

function clockModel() {
  const g = new THREE.Group();
  const caseM = mat(0x6d4c41);
  const back = box(0.8, 3.0, 0.1, 0x5d4037);
  back.position.set(0, 1.5, -0.25);
  const sideL = box(0.08, 3.0, 0.5, 0x6d4c41); sideL.position.set(-0.4, 1.5, 0);
  const sideR = sideL.clone(); sideR.position.x = 0.4;
  const top = box(0.95, 0.15, 0.6, 0x4e342e); top.position.set(0, 3.05, 0);
  const bot = box(0.95, 0.2, 0.6, 0x4e342e); bot.position.set(0, 0.1, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.75, 0.5), caseM);
  head.position.set(0, 2.6, 0);
  const face = cyl(0.3, 0.3, 0.04, 0xfffde7, 24);
  face.rotation.x = Math.PI / 2;
  face.position.set(0, 2.6, 0.26);
  const hands = [];
  for (const [len, w] of [[0.24, 0.035], [0.17, 0.05]]) {
    const hg = new THREE.Group();
    hg.position.set(0, 2.6, 0.29);
    const h = box(w, len, 0.02, 0x212121);
    h.position.y = len / 2;
    hg.add(h);
    g.add(hg);
    hands.push(hg);
  }
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.9), new THREE.MeshBasicMaterial({ color: 0xe3f2fd, transparent: true, opacity: 0.18, depthWrite: false }));
  glass.position.set(0, 1.2, 0.25);
  g.add(back, sideL, sideR, top, bot, head, face, glass);
  const pend = new THREE.Group();
  pend.position.set(0, 2.15, 0);
  const rod = box(0.03, 1.35, 0.03, 0xffca28);
  rod.position.y = -0.68;
  const bob = cyl(0.17, 0.17, 0.05, 0xffb300, 20);
  bob.rotation.x = Math.PI / 2;
  bob.position.y = -1.4;
  pend.add(rod, bob);
  g.add(pend);
  const marker = new THREE.Object3D();
  marker.position.set(0, -1.4, 0.06);
  pend.add(marker);
  g.userData.pend = pend;
  g.userData.hands = hands;
  g.userData.marker = marker;
  return g;
}

function wheelModel(R) {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  g.add(spin);
  const tire = new THREE.Mesh(new THREE.TorusGeometry(R, 0.06, 8, 32), mat(0x263238));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.06, 0.02, 6, 32), mat(0xb0bec5));
  spin.add(tire, rim);
  for (let i = 0; i < 8; i++) {
    const sp = box(0.012, R * 2 - 0.1, 0.012, 0xcfd8dc);
    sp.rotation.z = (i * Math.PI) / 8;
    spin.add(sp);
  }
  const hub = cyl(0.07, 0.07, 0.14, 0x1e88e5, 12);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  const valve = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0xe53935));
  valve.position.set(0, R - 0.02, 0.05);
  spin.add(valve);
  g.userData.spin = spin;
  g.userData.valve = valve;
  g.userData.hub = hub;
  return g;
}

// Малки модели за сортирането; anim(t) показва движението им.
function miniModel(id) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  let anim = () => {};
  const frac = (x) => x - Math.floor(x);
  if (id === 'elevator') {
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.2, 0.42), new THREE.MeshBasicMaterial({ color: 0x90a4ae, transparent: true, opacity: 0.25, depthWrite: false }));
    shaft.position.y = 0.65;
    const cab = box(0.36, 0.34, 0.36, 0x78909c);
    const door = box(0.2, 0.26, 0.02, 0xcfd8dc); door.position.z = 0.19; cab.add(door);
    inner.add(shaft, cab);
    anim = (t) => { const u = frac(t / 3); cab.position.y = 0.22 + 0.8 * Math.min(1, u * 1.4); };
  } else if (id === 'apple') {
    const br = box(0.7, 0.07, 0.07, 0x795548); br.position.y = 1.15; inner.add(br);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0x43a047, { flat: true })); leaf.scale.set(1.4, 0.5, 1); leaf.position.set(-0.2, 1.2, 0); inner.add(leaf);
    const ap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat(0xe53935)); inner.add(ap);
    anim = (t) => { const u = frac(t / 2.2); ap.position.y = u < 0.08 ? 1.0 : 1.0 - 0.86 * Math.min(1, ((u - 0.08) / 0.3) ** 2) };
  } else if (id === 'frog') {
    const fr = new THREE.Group();
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(0x7cb342)); b.scale.set(1.3, 0.8, 1);
    for (const z of [0.08, -0.08]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xffffff)); e.position.set(0.13, 0.12, z); fr.add(e); }
    fr.add(b); inner.add(fr);
    anim = (t) => { const n = Math.floor(t / 1.4); const u = frac(t / 1.4); const s = n % 2 ? -1 : 1; const v = Math.min(1, u / 0.6); fr.position.set(s * (-0.4 + 0.8 * v), 0.13 + 0.6 * 4 * v * (1 - v), 0); fr.rotation.y = s > 0 ? 0 : Math.PI; };
  } else if (id === 'carturn') {
    const road = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.55, 24, 1, 0, Math.PI), mat(0x616161)); road.rotation.x = -Math.PI / 2; road.position.y = 0.02; inner.add(road);
    const car = new THREE.Group();
    const cb = box(0.3, 0.12, 0.17, 0x1e88e5); cb.position.y = 0.1;
    const ct = box(0.15, 0.09, 0.15, 0x90caf9); ct.position.set(-0.03, 0.2, 0);
    car.add(cb, ct); inner.add(car);
    anim = (t) => { const a = Math.PI * Math.min(1, frac(t / 2.6) * 1.25); car.position.set(Math.cos(a) * 0.43, 0, -Math.sin(a) * 0.43); car.rotation.y = a + Math.PI / 2; };
  } else if (id === 'top') {
    const tp = new THREE.Group();
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 16), mat(0xffca28)); c1.rotation.x = Math.PI; c1.position.y = 0.22;
    const c2 = cyl(0.3, 0.3, 0.1, 0xe53935, 16); c2.position.y = 0.45;
    const st = box(0.12, 0.11, 0.62, 0x1e88e5); st.position.y = 0.45;
    const hd = cyl(0.04, 0.04, 0.25, 0x6d4c41, 8); hd.position.y = 0.6;
    tp.add(c1, c2, st, hd); inner.add(tp);
    anim = (t) => { tp.rotation.y = t * 9; };
  } else if (id === 'fan') {
    const base = cyl(0.25, 0.28, 0.06, 0x455a64, 16); base.position.y = 0.03;
    const post = cyl(0.04, 0.04, 0.75, 0x455a64, 8); post.position.y = 0.4;
    const rot = new THREE.Group(); rot.position.set(0, 0.85, 0.06);
    for (let i = 0; i < 3; i++) { const bl = box(0.12, 0.32, 0.02, 0x4fc3f7); bl.position.y = 0.17; const a = new THREE.Group(); a.rotation.z = (i * Math.PI * 2) / 3; a.add(bl); rot.add(a); }
    const cage = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.015, 6, 24), mat(0x90a4ae)); cage.position.set(0, 0.85, 0.06);
    inner.add(base, post, rot, cage);
    anim = (t) => { rot.rotation.z = -t * 8; };
  } else if (id === 'string') {
    const board = box(1.0, 0.08, 0.3, 0xa1887f); board.position.y = 0.3;
    const p1 = box(0.06, 0.18, 0.2, 0x4e342e); p1.position.set(-0.45, 0.42, 0);
    const p2 = p1.clone(); p2.position.x = 0.45;
    const str = box(0.9, 0.015, 0.015, 0xeeeeee);
    const blur = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.07, 0.01), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
    blur.position.set(0, 0.49, 0.02);
    inner.add(board, p1, p2, str, blur);
    anim = (t) => { str.position.y = 0.49 + Math.sin(t * 47) * 0.03; };
  } else if (id === 'rocker') {
    const ch = new THREE.Group();
    const seat = box(0.42, 0.06, 0.4, 0xa1887f); seat.position.y = 0.32;
    const bk = box(0.06, 0.45, 0.4, 0xa1887f); bk.position.set(-0.2, 0.55, 0);
    for (const z of [-0.18, 0.18]) {
      const rk = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.025, 6, 16, 1.0), mat(0x6d4c41));
      rk.position.set(0, 0.62, z); rk.rotation.z = -Math.PI / 2 - 0.5; ch.add(rk);
      const lg = box(0.04, 0.24, 0.04, 0x6d4c41); lg.position.set(0.15, 0.18, z); ch.add(lg);
      const lg2 = lg.clone(); lg2.position.x = -0.15; ch.add(lg2);
    }
    ch.add(seat, bk); inner.add(ch);
    anim = (t) => { ch.rotation.z = Math.sin(t * 2.2) * 0.25; };
  }
  g.userData.anim = anim;
  return g;
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const STEPS = ['Опознай парка', 'Пусни и наблюдавай', 'Подреди движенията', 'Приложи и предскажи'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xbfe3ff, camPos: [0, 9, 15], target: [0, 0.8, -1], shadows: false,
    fog: { color: 0xbfe3ff, near: 40, far: 80 }, maxDistance: 40,
  });
  const { scene } = stage;

  // ---------- парк ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 80), mat(0x8bc34a));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const sand = new THREE.Mesh(new THREE.CircleGeometry(5.2, 40), mat(0xe8d5a3));
  sand.rotation.x = -Math.PI / 2;
  sand.scale.set(1.6, 1, 0.55);
  sand.position.set(-1.8, 0.01, -0.6);
  scene.add(sand);
  const pathM = mat(0xd7ccc8);
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(20, 1.4), pathM);
  walk.rotation.x = -Math.PI / 2;
  walk.position.set(0, 0.012, 3.6);
  scene.add(walk);

  // релси
  const RZ = -4.6;
  for (const z of [RZ - 0.36, RZ + 0.36]) {
    const r = box(22, 0.08, 0.07, 0x78909c);
    r.position.set(0, 0.2, z);
    scene.add(r);
  }
  for (let x = -10.5; x <= 10.5; x += 0.7) {
    const sl = box(0.18, 0.1, 1.1, 0x6d4c41);
    sl.position.set(x, 0.08, RZ);
    scene.add(sl);
  }
  const station = new THREE.Group();
  const stB = box(1.8, 1.4, 1.2, 0xffe0b2); stB.position.y = 0.7;
  const stR = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 4), mat(0x8d6e63, { flat: true })); stR.position.y = 1.75; stR.rotation.y = Math.PI / 4; stR.scale.set(1, 1, 0.75);
  station.add(stB, stR);
  station.position.set(-8.8, 0, RZ - 1.8);
  scene.add(station);

  const train = trainModel();
  const TRAIN_X0 = -6.6;
  train.position.set(TRAIN_X0, 0, RZ);
  scene.add(train);

  const turbine = turbineModel();
  turbine.position.set(7.8, 0, -7.6);
  scene.add(turbine);

  const carousel = carouselModel();
  carousel.position.set(2.4, 0, -0.8);
  scene.add(carousel);

  const swing = swingModel();
  swing.position.set(-1.7, 0, -1.0);
  scene.add(swing);

  const slide = slideModel();
  slide.position.set(-6.0, 0, -0.3);
  scene.add(slide);

  const clock = clockModel();
  clock.position.set(6.2, 0, 0.4);
  clock.rotation.y = -0.35;
  scene.add(clock);

  const thrower = childModel(0xffa726);
  thrower.position.set(-3.6, 0, 3.4);
  scene.add(thrower);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), mat(0xff5722));
  scene.add(ball);
  const BALL0 = new THREE.Vector3(-3.4, 1.15, 3.4);
  const catcher = childModel(0x5c6bc0);
  catcher.position.set(2.6, 0, 3.4);
  catcher.rotation.y = Math.PI;
  scene.add(catcher);
  const ballMarker = ball;
  const ballAnchor = new THREE.Object3D();
  ballAnchor.position.set(-0.6, 1.6, 3.4);
  scene.add(ballAnchor);

  // декор
  for (const [x, z, s] of [[-10, -1, 1.1], [-9.5, 3, 0.9], [10, -2.5, 1.2], [9.6, 3.2, 0.9], [-4, -8, 1.3], [2.5, -8.5, 1.1], [-12, -7, 1.2], [12.5, -7.5, 1.0]]) {
    const t = treeModel(s);
    t.position.set(x, 0, z);
    scene.add(t);
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
  const smoke = [];
  const smokeM = new THREE.MeshBasicMaterial({ color: 0xeceff1, transparent: true, opacity: 0.8, depthWrite: false });
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), smokeM.clone());
    p.userData.ph = i / 5;
    scene.add(p);
    smoke.push(p);
  }

  // Сортиране (стъпка 3) — пред парка.
  const sortWorld = new THREE.Group();
  sortWorld.position.set(0, 0, 9.5);
  sortWorld.visible = false;
  scene.add(sortWorld);
  // Колело (стъпка 4).
  const WR = 0.55;
  const wheel = wheelModel(WR);
  const WHEEL_X0 = -4.5;
  const WZ = 5.6;
  wheel.visible = false;
  scene.add(wheel);
  const wPath = new THREE.Mesh(new THREE.PlaneGeometry(11, 0.8), mat(0xbcaaa4));
  wPath.rotation.x = -Math.PI / 2;
  wPath.position.set(-0.5, 0.013, WZ);
  wPath.visible = false;
  scene.add(wPath);

  // ---------- обекти за избор ----------
  const OBJ = {
    train: { root: train, label: 'Влак', icon: '🚂', kind: 'straight', lift: 1.9,
      note: 'Релсите тук са съвсем прави. Влакът тръгва от гарата и пътува по тях, без да завива.' },
    ball: { root: thrower, label: 'Хвърлена топка', icon: '⚽', kind: 'curved', lift: 1.6, at: () => ballAnchor,
      note: 'Детето хвърля топката напред и нагоре към приятеля си. Топката се издига и после пада.' },
    slide: { root: slide, label: 'Пързалка', icon: '🛝', kind: 'straight', lift: 2.6,
      note: 'Улеят на пързалката е прав. Детето се спуска по него отгоре надолу.' },
    swing: { root: swing, label: 'Люлка', icon: '🪢', kind: 'osc', lift: 3.0,
      note: 'Люлката виси на въжета. Ако я бутнеш, тя се люлее напред и назад — пак и пак.' },
    carousel: { root: carousel, label: 'Карусел', icon: '🎠', kind: 'rotate', lift: 2.8,
      note: 'Каруселът стои на едно място, но се върти около стълба в средата си. Стълбът е неговата <b>ос</b>.' },
    turbine: { root: turbine, label: 'Вятърна турбина', icon: '🌬', kind: 'rotate', lift: 3.4, at: () => turbine.userData.rotor,
      note: 'Вятърът върти перките ѝ около оста в средата. Така турбината произвежда електричество.' },
    clock: { root: clock, label: 'Часовник с махало', icon: '🕰', kind: 'osc', lift: 3.3,
      note: 'Махалото се движи наляво-надясно през равни интервали от време. Така часовникът отмерва времето.' },
  };
  Object.entries(OBJ).forEach(([id, o]) => {
    o.id = id;
    o.root.userData.pickId = id;
    addHitBox(o.root, 1);
  });

  // ---------- следа (точки през равни интервали от време) ----------
  const trail = new THREE.Group();
  scene.add(trail);
  const dotGeo = new THREE.SphereGeometry(0.07, 8, 6);
  const dotMats = new Map();
  const dotMat = (c) => { if (!dotMats.has(c)) dotMats.set(c, new THREE.MeshBasicMaterial({ color: c })); return dotMats.get(c); };
  const tmpV = new THREE.Vector3();
  function addDot(obj, c) {
    obj.getWorldPosition(tmpV);
    const d = new THREE.Mesh(dotGeo, dotMat(c));
    d.position.copy(tmpV);
    trail.add(d);
  }
  function clearTrail() { for (const d of trail.children.slice()) trail.remove(d); }

  // ---------- движения ----------
  let turbAng = 0;
  let pendT = 0;
  const busy = new Set();
  const POSE = {
    train: { dur: 4.4, dot: 0.25, color: 0xd32f2f, marker: () => train.userData.marker,
      reset: () => { train.position.x = TRAIN_X0; },
      pose: (t) => { train.position.x = TRAIN_X0 + 2.5 * t; train.userData.wheels.forEach((w) => { w.rotation.z = -(2.5 * t) / 0.2; }); } },
    ball: { dur: 1.7, dot: 0.1, color: 0xff5722, marker: () => ballMarker,
      reset: () => { ball.position.copy(BALL0); thrower.userData.arms[0].rotation.z = 0; },
      pose: (t) => {
        const y = BALL0.y + 4.5 * t - 3 * t * t;
        ball.position.set(BALL0.x + 3.3 * t, Math.max(0.14, y), BALL0.z);
        thrower.userData.arms[0].rotation.z = Math.min(1, t * 4) * 2.4;
      } },
    slide: { dur: 1.7, dot: 0.12, color: 0xec407a, marker: () => slide.userData.marker,
      reset: () => OBJ_POSE_SLIDE(0),
      pose: (t) => OBJ_POSE_SLIDE(Math.min(1, (t / 1.7) ** 2)) },
    swing: { dur: 4.8, dot: 0.12, color: 0xff7043, marker: () => swing.userData.marker,
      reset: () => { swing.userData.pivot.rotation.z = 0; },
      pose: (t) => { swing.userData.pivot.rotation.z = 0.55 * Math.sin((2 * Math.PI * t) / 2.4); } },
    carousel: { dur: 5.3, dot: 0.2, color: 0x1e88e5, marker: () => carousel.userData.marker,
      reset: () => {},
      pose: (t, o) => { carousel.userData.spin.rotation.y = o.a0 + 1.2 * t; } },
    turbine: { dur: 3.9, dot: 0.13, color: 0xe53935, marker: () => turbine.userData.marker,
      reset: () => {},
      pose: (t, o) => { turbAng = o.a0 + 1.62 * t; turbine.userData.rotor.rotation.z = -turbAng; } },
    clock: { dur: 4, dot: 0.1, color: 0x6a1b9a, marker: () => clock.userData.marker,
      reset: () => {},
      pose: (t, o) => { pendT = o.a0 + t; clock.userData.pend.rotation.z = 0.32 * Math.sin(Math.PI * pendT); } },
  };
  function OBJ_POSE_SLIDE(u) {
    const kid = slide.userData.kid;
    kid.position.lerpVectors(SLIDE_TOP, SLIDE_BOT, u);
    kid.position.y -= 0.42;
    kid.rotation.z = u > 0 && u < 1 ? slide.userData.angle * 0.6 : 0;
  }
  POSE.carousel.start = () => carousel.userData.spin.rotation.y;
  POSE.turbine.start = () => turbAng;
  POSE.clock.start = () => pendT;

  let run = null;
  function startRun(id, { dots = true, onDone, P = POSE[id], key = id } = {}) {
    stopRun();
    P.reset();
    run = { id: key, P, t: 0, a0: P.start ? P.start() : 0, next: 0, dots, onDone };
    busy.add(key);
    P.pose(0, run);
  }
  function stopRun() { if (run) { busy.delete(run.id); run = null; } }
  function resetAll() {
    stopRun();
    for (const P of Object.values(POSE)) P.reset();
    train.userData.wheels.forEach((w) => { w.rotation.z = 0; });
    clearTrail();
  }

  // ---------- живот на сцената ----------
  let sortTick = null;
  stage.tick((dt, t) => {
    for (const c of clouds) { c.position.x += dt * 0.35; if (c.position.x > 32) c.position.x = -32; }
    if (!busy.has('turbine')) { turbAng += dt * 1.62; turbine.userData.rotor.rotation.z = -turbAng; }
    if (!busy.has('clock')) { pendT += dt; clock.userData.pend.rotation.z = 0.32 * Math.sin(Math.PI * pendT); }
    clock.userData.hands[0].rotation.z = -t * 0.05;
    clock.userData.hands[1].rotation.z = -t * 0.004 - 1.2;
    // дим от комина
    const ch = train.userData.chimney.getWorldPosition(tmpV);
    for (const p of smoke) {
      const u = (t * 0.4 + p.userData.ph) % 1;
      p.position.set(ch.x - u * 0.9, ch.y + 0.25 + u * 1.3, ch.z);
      p.scale.setScalar(0.6 + u * 2);
      p.material.opacity = 0.7 * (1 - u);
    }
    // децата дишат и махат
    thrower.position.y = Math.abs(Math.sin(t * 1.3)) * 0.02;
    catcher.userData.arms[0].rotation.z = 2.2 + Math.sin(t * 2) * 0.25;
    if (!busy.has('swing')) swing.userData.pivot.rotation.z = Math.sin(t * 1.4) * 0.04;
    if (!busy.has('carousel')) carousel.userData.spin.rotation.y += dt * 0.08;
    if (!busy.has('slide') && slide.userData.kid.position.x < 0) slide.userData.kid.userData.arms[0].rotation.z = Math.sin(t * 2.5) * 0.4 + 0.6;
    if (sortTick) sortTick(dt, t);

    if (run) {
      run.t += dt;
      const P = run.P;
      while (run.dots && run.next <= Math.min(run.t, P.dur) + 1e-9) {
        P.pose(run.next, run);
        scene.updateMatrixWorld(true);
        if (P.markers) for (const [m, c] of P.markers()) addDot(m, c);
        else addDot(P.marker(), P.color);
        run.next += P.dot;
      }
      P.pose(Math.min(run.t, P.dur), run);
      if (run.t >= P.dur) {
        const done = run;
        stopRun();
        if (done.onDone) done.onDone();
      }
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
  const overview = () => view([0, 9, 15], [0, 0.8, -1]);
  const CAMS = {
    train: [[-1.5, 4.5, 6], [-1.5, 0.8, RZ]],
    ball: [[-0.5, 3.2, 10.5], [-0.5, 1.3, 3.4]],
    slide: [[-5, 3.2, 5.5], [-5.4, 1, -0.3]],
    swing: [[-0.6, 2.7, 4.8], [-1.7, 1.3, -1]],
    carousel: [[2.4, 4.6, 5.2], [2.4, 0.9, -0.8]],
    turbine: [[6.2, 4.6, 1.5], [7.8, 4.2, -7.6]],
    clock: [[5.0, 2.4, 4.6], [6.2, 1.7, 0.4]],
    wheel: [[-1, 3, 12.5], [-1, 0.7, WZ]],
  };
  const camTo = (id) => view(...CAMS[id]);
  let tip = null;
  function say(anchor, html, cls = '', lift = 1) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const anchorOf = (o) => (o.at ? o.at() : o.root);
  const liftOf = (o) => (o.id === 'turbine' ? 2.1 : o.at ? 1.4 : o.lift);

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null, hit));
  let menuHandler = null;
  const MENU = Object.values(OBJ).map((o) => ({ id: o.id, label: o.label, icon: o.icon }));
  const menu = cornerMenu(stage, { title: 'Какво има в парка', items: MENU, onSelect: (id) => menuHandler && menuHandler(id) });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip(); resetAll();
    sortWorld.visible = false; wheel.visible = false; wPath.visible = false;
    menu.setTitle('Какво има в парка');
    menu.setItems(MENU);
    menu.show(true);
    const seen = new Set();
    shell.task(`<p>В парка всичко се движи, но по различен начин.</p>
      <p><b>Разгледай поне 5 неща</b> — кликни върху тях или ги избери от менюто в ъгъла. Гледай <b>как</b> се движи всяко.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Целият парк</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${MENU.length}`);
    upd();
    const visit = (id) => {
      const o = OBJ[id];
      if (!o) return;
      camTo(id);
      say(anchorOf(o), `<b>${esc(o.icon)} ${esc(o.label)}</b><br>${o.note}`, 'wide', liftOf(o));
      if (!busy.has(id)) startRun(id, { dots: false, onDone: () => { if (id === 'ball' || id === 'slide' || id === 'train') setTimeout(() => { if (!busy.has(id)) POSE[id].reset(); }, 900); } });
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size >= 5) { next.disabled = false; shell.msg('Браво! Можеш да продължиш или да разгледаш още.', 'good'); }
    };
    clickHandler = (id) => { if (!id || !OBJ[id]) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.show(false); menuHandler = null; step2(); });
    overview();
  }

  // ---------- 2. Пусни и наблюдавай ----------
  const ORDER = ['train', 'ball', 'carousel', 'swing', 'slide', 'turbine', 'clock'];
  const WHY = {
    train: 'Следата е права линия — влакът се движи <b>праволинейно</b>.',
    ball: 'Следата е извита линия — топката се движи <b>криволинейно</b>.',
    carousel: 'Каруселът остава на мястото си и се върти около оста си — това е <b>въртене</b>. Затова седалката обикаля в кръг.',
    swing: 'Люлката минава по една и съща дъга напред-назад около едно място — това е <b>трептене</b>.',
    slide: 'Улеят е прав и следата е права линия — детето се движи <b>праволинейно</b>, макар и надолу.',
    turbine: 'Перките се въртят около оста в средата — това е <b>въртене</b>. Червеният връх описва кръг.',
    clock: 'Махалото се люлее наляво-надясно около едно място — това е <b>трептене</b>.',
  };
  function wrongWhy(id, k) {
    const right = OBJ[id].kind;
    if (right === 'rotate' && k === 'curved') return 'Следата наистина е крива, но виж — тялото не отива на друго място. То се върти около една ос.';
    if (right === 'osc' && k === 'curved') return 'Следата е дъга, но тялото не отива никъде — минава по нея напред-назад, отново и отново.';
    if (right === 'osc' && k === 'rotate') return 'Тялото не прави пълни обиколки — то стига до края и се връща назад.';
    if (right === 'rotate' && k === 'osc') return 'Тялото не се връща назад — то обикаля все в една посока.';
    if (k === 'straight') return 'Погледни следата отблизо — права ли е линията?';
    if (k === 'curved') return 'Погледни следата отблизо — извита ли е линията?';
    if (k === 'rotate') return 'Тялото не стои на едно място, за да се върти около ос — то отива от едно място на друго.';
    return 'Тялото не се връща назад — то отива от едно място на друго.';
  }
  const kindButtons = () => `<div class="motiontypes-kinds">${KIND_IDS.map((k) => `<button class="choice" data-k="${k}" disabled><b>${KINDS[k].icon} ${KINDS[k].name}</b><small>${KINDS[k].def}</small></button>`).join('')}</div>`;

  function step2() {
    shell.step(1);
    clearTip(); resetAll();
    let mistakes = 0;
    let i = 0;
    clickHandler = null;
    const load = () => {
      clearTip(); clearTrail();
      const id = ORDER[i];
      const o = OBJ[id];
      let tries = 0;
      shell.score(`Движение ${i + 1} от ${ORDER.length} · грешки: ${mistakes}`);
      shell.task(`<p><b>${esc(o.icon)} ${esc(o.label)}</b></p>
        <p class="small">Точките в следата се оставят през равни интервали от време. Гледай каква линия очертават и как се движи тялото.</p>
        <p>Какво е движението?</p>${kindButtons()}`);
      const c = shell.setControls('<div class="row"><button class="btn again">▶ Пусни</button></div>');
      const again = c.querySelector('.again');
      const btns = [...container.querySelectorAll('.motiontypes-kinds .choice')];
      const play = () => {
        clearTip(); clearTrail();
        again.disabled = true;
        startRun(id, { onDone: () => { again.disabled = false; again.textContent = '↻ Пусни пак'; btns.forEach((b) => { if (!b.classList.contains('wrong')) b.disabled = false; }); } });
      };
      again.addEventListener('click', play);
      btns.forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        const k = b.dataset.k;
        if (k === o.kind) {
          btns.forEach((x) => { x.disabled = true; });
          b.classList.add('right');
          say(anchorOf(o), `✔ ${WHY[id]}`, 'good wide', liftOf(o));
          shell.msg('Вярно!', 'good');
          const last = i === ORDER.length - 1;
          const nx = shell.setControls(`<button class="btn primary">${last ? 'Напред →' : 'Следващо движение →'}</button>`).querySelector('button');
          nx.addEventListener('click', () => {
            if (last) { scores.push(stepScore(mistakes, 4)); step3(); return; }
            i++;
            shell.msg('');
            camTo(ORDER[i]);
            load();
            setTimeout(() => { if (ORDER[i]) container.querySelector('.xp-controls .again')?.click(); }, 900);
          });
          return;
        }
        mistakes++; tries++;
        b.classList.add('wrong');
        b.disabled = true;
        shell.score(`Движение ${i + 1} от ${ORDER.length} · грешки: ${mistakes}`);
        let why = wrongWhy(id, k);
        if (tries >= 2) why += ' Подсказка: въртене — около ос; трептене — напред-назад около едно място; иначе гледай дали линията е права, или крива.';
        shell.msg(why, 'bad');
      }));
    };
    camTo(ORDER[0]);
    load();
    setTimeout(() => container.querySelector('.xp-controls .again')?.click(), 900);
  }

  // ---------- 3. Подреди движенията ----------
  const SORT = [
    { id: 'elevator', label: 'Асансьор', kind: 'straight', note: 'Асансьорът се качва право нагоре по шахтата.' },
    { id: 'apple', label: 'Падаща ябълка', kind: 'straight', note: 'Ябълката пада право надолу.' },
    { id: 'frog', label: 'Скок на жаба', kind: 'curved', note: 'Жабата лети по извита линия — дъга.' },
    { id: 'carturn', label: 'Кола в завой', kind: 'curved', note: 'В завоя колата се движи по крива линия.' },
    { id: 'top', label: 'Пумпал', kind: 'rotate', note: 'Пумпалът се върти около оста си на едно място.' },
    { id: 'fan', label: 'Перки на вентилатор', kind: 'rotate', note: 'Перките се въртят около оста в средата.' },
    { id: 'string', label: 'Струна на китара', kind: 'osc', note: 'Струната трепти бързо нагоре-надолу около едно място.' },
    { id: 'rocker', label: 'Люлеещ се стол', kind: 'osc', note: 'Столът се люлее напред-назад около едно място.' },
  ];
  const RING_X = [-4.8, -1.6, 1.6, 4.8];
  let stopDrag = null;
  function step3() {
    shell.step(2);
    clearTip(); resetAll();
    sortWorld.clear();
    sortWorld.visible = true;
    // Тесен екран: кръговете 2 × 2, предметите в две колони, камерата отгоре.
    const narrow = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400) < 1.1;
    if (narrow) { stage.stopFollow(); stage.flyTo([0, 14.5, 9.5 + 3.6], [0, 0, 9.5 + 1.0], 1); } else view([0, 7.8, 18], [0, 0, 10.8]);
    const rings = KIND_IDS.map((k, i) => {
      const z = zoneRing(KINDS[k].color, 1.35);
      if (narrow) z.position.set(i % 2 ? 1.5 : -1.5, 0.02, i < 2 ? -3.6 : -0.7);
      else z.position.set(RING_X[i], 0.02, -1.1);
      const l = labelSprite(KINDS[k].name, { size: narrow ? 0.46 : 0.36, color: '#fff', bg: KINDS[k].css, border: KINDS[k].css });
      l.position.set(0, 0.3, narrow ? -1.5 : 1.7);
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
      m.position.y = 0.12;
      const l = labelSprite(o.label, { size: narrow ? 0.34 : 0.26 });
      l.position.y = 1.3;
      g.add(puck, m, l);
      if (narrow) g.position.set(i % 2 ? 1.4 : -1.4, 0, 1.5 + Math.floor(i / 2) * 1.5);
      else g.position.set(-3.9 + (i % 4) * 2.6, 0, 2.2 + Math.floor(i / 4) * 2.0);
      g.userData = { pickId: 's-' + o.id, dragId: 's-' + o.id, o, anim: m.userData.anim, ph: i * 0.37 };
      sortWorld.add(g);
      addHitBox(g, 1);
      return g;
    });
    sortTick = (dt, t) => { for (const g of tokens) g.userData.anim(t + g.userData.ph); };
    let mistakes = 0;
    let placed = 0;
    const tries = new Map();
    shell.task(`<p>Всяко от тези неща се движи. Гледай как.</p>
      <p><b>Провлачи всяко</b> в кръга с правилния вид движение.</p>`);
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${placed} от ${SORT.length} · грешки: ${mistakes}`);
    upd();
    clickHandler = (id, hit) => {
      if (!hit) return clearTip();
      const o = hit.root.userData.o;
      if (o && !hit.root.userData.locked) say(hit.root, `<b>${esc(o.label)}</b>`, 'tag', 1.9);
    };
    const RAD = 1.5;
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => { clearTip(); stage.stopFollow(); },
      onDrop: (g, p, start) => {
        const lx = p.x; // позицията е спрямо sortWorld
        const lz = p.z;
        const r = rings.find((R) => Math.hypot(lx - R.z.position.x, lz - R.z.position.z) < RAD);
        if (!r) { g.position.copy(start); return; }
        const o = g.userData.o;
        if (r.k === o.kind) {
          g.userData.locked = true;
          g.position.set(r.z.position.x + (r.n === 0 ? -0.35 : 0.35), 0, r.z.position.z + (narrow ? (r.n === 0 ? -0.2 : 0.45) : (r.n === 0 ? -0.6 : 0.5)));
          r.n++;
          placed++;
          say(g, `✔ ${esc(o.note)}`, 'good', 1.9);
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          const n = (tries.get(o.id) || 0) + 1;
          tries.set(o.id, n);
          g.position.copy(start);
          let why = {
            straight: 'Не е там. Гледай: това тяло стои на едно място или отива някъде? По права или по крива линия?',
            curved: 'Не е там. Гледай: линията, по която отива тялото, права ли е?',
            rotate: 'Не е там. Гледай: тялото обикаля ли около ос, все в една посока?',
            osc: 'Не е там. Гледай: тялото връща ли се напред-назад около едно място?',
          }[r.k];
          if (n >= 2) why += ' Подсказка: праволинейно — по права линия; криволинейно — по крива; въртене — около ос; трептене — напред-назад около едно място.';
          say(g, '✘ Помисли пак.', 'bad', 1.9);
          shell.msg(why, 'bad');
        }
        upd();
        if (placed === SORT.length) {
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 3));
          shell.msg('Браво! Всички движения са подредени.', 'good');
          const c = shell.setControls('<button class="btn primary">Напред →</button>');
          c.querySelector('button').addEventListener('click', step4);
        }
      },
    });
  }

  // ---------- 4. Приложи и предскажи ----------
  const WHEEL_POSE = {
    dur: 4.6, dot: 0.08,
    reset: () => { wheel.position.set(WHEEL_X0, WR + 0.06, WZ); wheel.userData.spin.rotation.z = 0; },
    pose: (t) => { const x = 1.5 * t; wheel.position.x = WHEEL_X0 + x; wheel.userData.spin.rotation.z = -x / WR; },
    markers: () => [[wheel.userData.hub, 0x1e88e5], [wheel.userData.valve, 0xe53935]],
  };
  function step4() {
    shell.step(3);
    clearTip(); resetAll();
    sortTick = null;
    sortWorld.visible = false;
    sortWorld.clear();
    let mistakes = 0;
    clickHandler = null;
    const upd = (part) => shell.score(`Задача ${part} от 4 · грешки: ${mistakes}`);
    shell.task('<div class="motiontypes-qs"></div>');
    shell.setControls('');
    const qs = container.querySelector('.motiontypes-qs');
    camTo('swing');
    say(swing, 'Как ще изглежда следата на люлката?', 'tag', 3.0);

    choiceQ(qs, {
      part: 1,
      q: '<b>Предскажи:</b> бутаме люлката. Каква следа ще остави седалката?',
      opts: ['Дъга, по която седалката минава напред-назад', 'Права линия, която става все по-дълга', 'Пълен кръг около гредата'],
      right: 0,
      bad: 'Помисли: седалката виси на въжета, закачени за гредата. Докъде може да стигне?',
      ok: 'Вярно! Въжетата държат седалката на едно и също разстояние от гредата, затова тя минава по дъга — напред и назад. Виж следата!',
      onRight: () => startRun('swing'),
      then: (box) => {
        choiceQ(box, {
          part: 2,
          q: 'Велосипед кара направо по алеята. Как се движи колелото му?',
          opts: ['Едновременно се върти около оста си и се движи праволинейно', 'Само се върти на едно място', 'Само се движи праволинейно, без да се върти'],
          right: 0,
          bad: 'Колелото остава ли на едно място? А върти ли се, докато велосипедът се движи?',
          ok: 'Вярно! Оста на колелото се движи по права линия (сините точки), а колелото се върти около нея. Затова вентилът (червените точки) описва извита линия.',
          before: () => { wheel.visible = true; wPath.visible = true; WHEEL_POSE.reset(); clearTip(); camTo('wheel'); say(wheel, '🚲 Колело на велосипед', 'tag', 1.0); },
          onRight: () => { clearTip(); startRun('wheel', { P: WHEEL_POSE }); },
          then: (b2) => {
            choiceQ(b2, {
              part: 3,
              q: 'По права линия влакът се движи праволинейно. А как се движи, когато релсите завиват?',
              opts: ['Криволинейно', 'Праволинейно', 'Трепти'],
              right: 0,
              bad: 'Видът на движението зависи от линията, по която се движи тялото. Каква е тази линия в завоя?',
              ok: 'Вярно! В завоя линията е крива, затова движението е криволинейно.',
              before: () => { clearTip(); camTo('train'); say(train, '🚂 А в завоя?', 'tag', 1.9); },
              then: (b3) => choiceQ(b3, {
                part: 4,
                q: 'Кое от тези движения е <b>трептене</b>?',
                opts: ['Клон, който вятърът люлее напред-назад', 'Самолет, който излита', 'Колелото на водна мелница'],
                right: 0,
                bad: 'При трептене тялото се движи напред-назад около едно място.',
                ok: 'Вярно! Клонът се връща напред-назад около едно място — трепти. Самолетът се движи по линия, а колелото на мелницата се върти.',
                then: finishAll,
              }),
            });
          },
        });
      },
    });

    function choiceQ(boxEl, { part, q, opts, right, bad, ok, then, before, onRight }) {
      if (before) before();
      upd(part);
      const order = opts.map((o, k) => k).sort(() => Math.random() - 0.5);
      const wrap = document.createElement('div');
      wrap.className = 'motiontypes-q';
      wrap.innerHTML = `<p>${q}</p><div class="choices">${order.map((k) => `<button class="choice" data-i="${k}">${esc(opts[k])}</button>`).join('')}</div><div class="motiontypes-next"></div>`;
      boxEl.appendChild(wrap);
      wrap.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        if (+b.dataset.i !== right) {
          mistakes++;
          upd(part);
          b.classList.add('wrong');
          b.disabled = true;
          shell.msg(bad, 'bad');
          return;
        }
        b.classList.add('right');
        wrap.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        shell.msg(ok, 'good');
        if (onRight) onRight();
        const nb = document.createElement('div');
        wrap.querySelector('.motiontypes-next').appendChild(nb);
        if (then === finishAll) { then(); return; }
        const go = document.createElement('button');
        go.className = 'btn primary';
        go.textContent = 'Напред →';
        shell.setControls('').appendChild(go);
        go.addEventListener('click', () => { shell.setControls(''); shell.msg(''); wrap.querySelectorAll('.choice:not(.right)').forEach((x) => x.remove()); then(nb); });
      }));
      wrap.scrollIntoView({ block: 'nearest' });
    }

    function finishAll() {
      scores.push(stepScore(mistakes, 3));
      const btn = shell.setControls('<button class="btn primary">Виж резултата</button>').querySelector('button');
      btn.addEventListener('click', () => {
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
    step1();
  }

  step1();
  return {
    dispose() {
      stopRun();
      if (stopDrag) stopDrag();
      stage.dispose();
      style.remove();
    },
  };
}
