// 6.1.1 „Движение и скорост“ — 3D стадион: писта с табели през 10 m, хронометър, светофар,
// кола, колоездач, костенурка и заек.
// Стъпки: опознай → измери скоростта → какво е движението → пътуване и безопасност на пътя.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

// ---------- мерки на стадиона ----------
const S = 0.25; // единици в сцената за 1 m
const HALF = 7.5; // половината от правата (60 m)
const X0 = -HALF; // табелата 0 m
const ZC = -2.4; // център на полукръговете по z
const RIN = 3;
const LANE = 0.8;
const ROUT = RIN + 4 * LANE;
const xOf = (m) => X0 + m * S;
const laneR = (k) => RIN + LANE * (k + 0.5);
const laneZ = (k) => ZC + laneR(k);
const nice = (v) => (Math.round(v * 100) / 100).toString().replace('.', ',');
const num = (s) => parseFloat(String(s ?? '').trim().replace(/\s/g, '').replace(',', '.'));

// Точка по овала на разстояние u от началото на долната права (движение обратно на часовника, гледано отгоре).
function stadium(r, u) {
  const seg = 2 * HALF;
  const arc = Math.PI * r;
  const L = 2 * seg + 2 * arc;
  u = ((u % L) + L) % L;
  if (u < seg) return { x: -HALF + u, z: ZC + r, yaw: 0 };
  u -= seg;
  if (u < arc) { const f = u / r; return { x: HALF + r * Math.sin(f), z: ZC + r * Math.cos(f), yaw: f }; }
  u -= arc;
  if (u < seg) return { x: HALF - u, z: ZC - r, yaw: Math.PI };
  u -= seg;
  const f = u / r;
  return { x: -HALF - r * Math.sin(f), z: ZC - r * Math.cos(f), yaw: Math.PI + f };
}
function stadiumLen(r) { return 4 * HALF + 2 * Math.PI * r; }

const CSS = `
.motion-form { display: grid; gap: 6px; margin: 8px 0; }
.motion-form label { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.motion-form input { font: inherit; font-size: 1.05rem; width: 5.5em; padding: 5px 8px; border: 2px solid var(--line, #cfd8e3); border-radius: 8px; }
.motion-form input.right { border-color: var(--green, #1fab54); background: #eafaf0; }
.motion-form input.wrong { border-color: var(--red, #d92916); background: #fff0ee; }
.motion-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 4px 0 8px; }
.motion-pair .choice { justify-content: center; padding: 8px 6px; }
.motion-table { border-collapse: collapse; font-size: 0.9rem; margin: 6px 0; }
.motion-table th, .motion-table td { padding: 2px 8px; border-bottom: 1px solid #e3e8ee; text-align: right; }
.motion-table th:first-child, .motion-table td:first-child { text-align: left; }
.motion-chips { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
.motion-chips .chip { cursor: pointer; }
.motion-q { margin-top: 10px; }
.motion-form[hidden], .xp-controls .motion-hide[hidden] { display: none !important; }
`;

// ---------- помощни модели ----------
const UP = new THREE.Vector3(0, 1, 0);
const tmpV = new THREE.Vector3();
function box(w, h, d, color, extra) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra)); }
function rod(r, m) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), m); }
function setRod(m, a, b) {
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.scale.y = Math.max(1e-3, a.distanceTo(b));
  m.quaternion.setFromUnitVectors(UP, tmpV.copy(b).sub(a).normalize());
}

// Краката висят от „тазобедрена“ точка, за да могат да се люлеят (както в хранителните вериги).
function legs(g, color, { len = 0.5, r = 0.06, spreadX = 0.5, spreadZ = 0.18 }) {
  const m = mat(color);
  const list = g.userData.legs || (g.userData.legs = []);
  for (const [x, z] of [[spreadX, spreadZ], [spreadX, -spreadZ], [-spreadX, spreadZ], [-spreadX, -spreadZ]]) {
    const hip = new THREE.Group();
    hip.position.set(x, len, z);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, len, 8), m);
    l.position.y = -len / 2;
    hip.add(l);
    g.add(hip);
    list.push(hip);
  }
}
function swingLegs(g, phase, amp) {
  (g.userData.legs || []).forEach((lg, i) => { lg.rotation.z = Math.sin(phase + (i === 0 || i === 3 ? 0 : Math.PI)) * amp; });
}

function wheel(r, w) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 16), mat(0x222222));
  tire.rotation.x = Math.PI / 2;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, w + 0.01, 10), mat(0xcfd8dc));
  hub.rotation.x = Math.PI / 2;
  const spoke = box(r * 1.5, r * 0.22, w + 0.02, 0x78909c);
  g.add(tire, hub, spoke);
  return g;
}

function carModel() {
  const g = new THREE.Group();
  const red = 0xe63946;
  const body = box(1.0, 0.26, 0.52, red, { roughness: 0.45 });
  body.position.y = 0.28;
  const cabin = box(0.5, 0.24, 0.46, red, { roughness: 0.45 });
  cabin.position.set(-0.08, 0.52, 0);
  const glass = box(0.52, 0.15, 0.48, 0x9fd3f0, { roughness: 0.2 });
  glass.position.set(-0.08, 0.53, 0);
  g.add(body, cabin, glass);
  for (const s of [1, -1]) {
    const hl = box(0.03, 0.07, 0.1, 0xfff59d, { emissive: 0xfff59d, emissiveIntensity: 0.6 });
    hl.position.set(0.5, 0.31, s * 0.17);
    const tl = box(0.03, 0.06, 0.1, 0xb71c1c);
    tl.position.set(-0.5, 0.31, s * 0.17);
    g.add(hl, tl);
  }
  const wheels = [];
  for (const [x, z] of [[0.32, 0.26], [0.32, -0.26], [-0.32, 0.26], [-0.32, -0.26]]) {
    const w = wheel(0.14, 0.1);
    w.position.set(x, 0.14, z);
    g.add(w);
    wheels.push(w);
  }
  g.userData.anim = (d) => { for (const w of wheels) w.rotation.z = -d / 0.14; };
  return g;
}

function busModel() {
  const g = new THREE.Group();
  const body = box(1.9, 0.62, 0.64, 0xf4b400, { roughness: 0.5 });
  body.position.y = 0.48;
  const band = box(1.92, 0.2, 0.66, 0x9fd3f0, { roughness: 0.2 });
  band.position.y = 0.62;
  const roof = box(1.8, 0.05, 0.6, 0xffffff);
  roof.position.y = 0.81;
  g.add(body, band, roof);
  const wheels = [];
  for (const [x, z] of [[0.6, 0.32], [0.6, -0.32], [-0.6, 0.32], [-0.6, -0.32]]) {
    const w = wheel(0.16, 0.1);
    w.position.set(x, 0.16, z);
    g.add(w);
    wheels.push(w);
  }
  g.userData.anim = (d) => { for (const w of wheels) w.rotation.z = -d / 0.16; };
  return g;
}

function cyclistModel() {
  const g = new THREE.Group();
  const frameM = mat(0x1e88e5, { roughness: 0.4 });
  const dark = mat(0x263238);
  const R = 0.24;
  const P = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const wheels = [];
  for (const x of [-0.34, 0.34]) {
    const w = new THREE.Group();
    w.position.set(x, R, 0);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(R, 0.03, 6, 20), dark);
    const sp1 = box(2 * R, 0.015, 0.015, 0xb0bec5);
    const sp2 = sp1.clone();
    sp2.rotation.z = Math.PI / 2;
    w.add(tire, sp1, sp2);
    g.add(w);
    wheels.push(w);
  }
  const crank = P(0, R - 0.02);
  const seat = P(-0.1, 0.6);
  const headT = P(0.25, 0.64);
  const rear = P(-0.34, R);
  const front = P(0.34, R);
  for (const [a, b] of [[rear, crank], [crank, seat], [seat, rear], [crank, headT], [seat, headT], [headT, front]]) {
    const m = rod(0.022, frameM);
    setRod(m, a, b);
    g.add(m);
  }
  const stem = rod(0.02, dark);
  setRod(stem, headT, P(0.23, 0.78));
  const bar = box(0.03, 0.03, 0.36, 0x263238);
  bar.position.set(0.23, 0.78, 0);
  const saddle = box(0.16, 0.04, 0.1, 0x263238);
  saddle.position.set(-0.1, 0.63, 0);
  g.add(stem, bar, saddle);
  // колоездачът
  const shirt = mat(0xf9a825);
  const skin = mat(0xf0c3a0);
  const pants = mat(0x37474f);
  const hip = P(-0.1, 0.68);
  const shoulder = P(0.08, 1.0);
  const torso = rod(0.1, shirt);
  setRod(torso, hip, shoulder);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), skin);
  head.position.set(0.14, 1.14, 0);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd32f2f));
  helmet.position.set(0.13, 1.16, 0);
  g.add(torso, head, helmet);
  for (const s of [1, -1]) {
    const arm = rod(0.03, skin);
    setRod(arm, P(0.08, 0.98, s * 0.1), P(0.23, 0.79, s * 0.14));
    g.add(arm);
  }
  const legsL = [];
  for (const s of [1, -1]) {
    const thigh = rod(0.045, pants);
    const shin = rod(0.035, skin);
    g.add(thigh, shin);
    legsL.push({ s, thigh, shin });
  }
  const H = new THREE.Vector3();
  const F = new THREE.Vector3();
  const K = new THREE.Vector3();
  const l = 0.3;
  g.userData.anim = (d) => {
    for (const w of wheels) w.rotation.z = -d / R;
    const a = -d / R * 0.7;
    for (const { s, thigh, shin } of legsL) {
      const ph = a + (s > 0 ? 0 : Math.PI);
      H.set(hip.x, hip.y, s * 0.08);
      F.set(crank.x + Math.cos(ph) * 0.1, crank.y + Math.sin(ph) * 0.1, s * 0.08);
      const dist = H.distanceTo(F);
      const h = Math.sqrt(Math.max(0, l * l - (dist / 2) ** 2));
      const dx = (F.x - H.x) / dist;
      const dy = (F.y - H.y) / dist;
      let px = -dy; let py = dx;
      if (px < 0) { px = -px; py = -py; }
      K.set((H.x + F.x) / 2 + px * h, (H.y + F.y) / 2 + py * h, s * 0.08);
      setRod(thigh, H, K);
      setRod(shin, K, F);
    }
  };
  g.userData.anim(0);
  return g;
}

function tortoiseModel() {
  const g = new THREE.Group();
  const skin = 0x9caf6a;
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x6b8e23, { flat: true }));
  shell.scale.set(1.2, 0.85, 1);
  shell.position.y = 0.12;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 18), mat(0x556b2f));
  rim.scale.x = 1.2;
  rim.position.y = 0.12;
  const headG = new THREE.Group();
  headG.position.set(0.43, 0.15, 0);
  const headM = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat(skin));
  headM.scale.set(1.25, 0.9, 0.9);
  headG.add(headM);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), mat(0x111111));
    e.position.set(0.07, 0.04, s * 0.06);
    headG.add(e);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), mat(skin));
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.46, 0.1, 0);
  g.add(shell, rim, headG, tail);
  legs(g, skin, { len: 0.12, r: 0.055, spreadX: 0.24, spreadZ: 0.22 });
  g.userData.head = headG;
  g.userData.anim = (d) => { swingLegs(g, d * 30, 0.5); headG.position.x = 0.43 + Math.sin(d * 15) * 0.02; };
  return g;
}

// Заек — от същия строител на четириноги като в хранителните вериги.
function hareModel() {
  const o = { color: 0xa1887f, belly: 0xd7ccc8, r: 0.18, len: 0.28, legLen: 0.12, headR: 0.14 };
  const g = new THREE.Group();
  const bodyM = mat(o.color);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(o.r, o.len, 8, 16), bodyM);
  body.rotation.z = Math.PI / 2;
  body.position.y = o.legLen + o.r * 0.9;
  const b = new THREE.Mesh(new THREE.SphereGeometry(o.r * 0.85, 16, 12), mat(o.belly));
  b.scale.set(1.6, 0.7, 0.9);
  b.position.set(0, o.legLen + o.r * 0.45, 0);
  g.add(body, b);
  const head = new THREE.Group();
  head.position.set(o.len / 2 + o.r * 0.9, o.legLen + o.r * 1.4, 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(o.headR, 16, 12), bodyM));
  const ears = [];
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(o.headR * 0.13, 8, 6), mat(0x111111));
    e.position.set(o.headR * 0.65, o.headR * 0.25, s * o.headR * 0.5);
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(o.headR * 0.18, o.headR * 1.6, 4, 8), bodyM);
    ear.position.set(-o.headR * 0.1, o.headR * 1.3, s * o.headR * 0.45);
    ear.rotation.x = s * 0.15;
    head.add(e, ear);
    ears.push(ear);
  }
  g.add(head);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(o.r * 0.35, 10, 8), mat(0xffffff));
  tail.position.set(-o.len / 2 - o.r * 0.9, o.legLen + o.r * 1.1, 0);
  g.add(tail);
  legs(g, o.color, { len: o.legLen, r: o.r * 0.22, spreadX: o.len * 0.45, spreadZ: o.r * 0.5 });
  g.scale.setScalar(1.7);
  g.userData.head = head;
  g.userData.ears = ears;
  g.userData.anim = (d) => {
    const ph = d * 5;
    g.position.y = Math.abs(Math.sin(ph)) * 0.22;
    swingLegs(g, ph * 2, 0.7);
    body.rotation.x = 0;
  };
  return g;
}

function personModel(shirtColor) {
  const g = new THREE.Group();
  const skin = mat(0xf0c3a0);
  const legsM = mat(0x3949ab);
  for (const s of [1, -1]) {
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.42, 4, 8), legsM);
    l.position.set(0, 0.27, s * 0.08);
    g.add(l);
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.3, 4, 10), mat(shirtColor));
  torso.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), skin);
  head.position.y = 1.08;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5d4037));
  hair.position.y = 1.1;
  g.add(torso, head, hair);
  const arms = [];
  for (const s of [1, -1]) {
    const sh = new THREE.Group();
    sh.position.set(0, 0.88, s * 0.18);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.3, 4, 8), skin);
    a.position.y = -0.18;
    sh.add(a);
    g.add(sh);
    arms.push(sh);
  }
  g.userData.arms = arms;
  return g;
}

function stopwatchModel() {
  const g = new THREE.Group();
  const metal = mat(0xb0bec5, { metalness: 0.6, roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 18), mat(0x546e7a));
  base.position.y = 0.04;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), mat(0x546e7a));
  pole.position.y = 0.75;
  g.add(base, pole);
  const head = new THREE.Group();
  head.position.y = 1.95;
  const cas = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 32), metal);
  cas.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.17, 32), mat(0xffffff));
  face.rotation.x = Math.PI / 2;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 12), metal);
  crown.position.y = 0.62;
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 16), metal);
  loop.position.y = 0.78;
  head.add(cas, face, crown, loop);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const t = box(0.025, i % 3 === 0 ? 0.1 : 0.06, 0.01, 0x263238);
    t.position.set(Math.sin(a) * 0.41, Math.cos(a) * 0.41, 0.09);
    t.rotation.z = -a;
    head.add(t);
  }
  const hand = new THREE.Group();
  hand.position.z = 0.1;
  const needle = box(0.03, 0.4, 0.015, 0xd32f2f);
  needle.position.y = 0.17;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), mat(0x263238));
  cap.rotation.x = Math.PI / 2;
  hand.add(needle, cap);
  head.add(hand);
  g.add(head);
  g.userData.hand = hand;
  return g;
}

function trafficLightModel() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.0, 8), mat(0x455a64));
  pole.position.y = 1.0;
  const housing = box(0.34, 0.92, 0.26, 0x263238);
  housing.position.y = 2.2;
  g.add(pole, housing);
  const lamps = {};
  for (const [k, y, col] of [['red', 2.48, 0xff3b30], ['yellow', 2.2, 0xffcc00], ['green', 1.92, 0x2ecc71]]) {
    const m = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: col, emissiveIntensity: 0.05, roughness: 0.3 });
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), m);
    l.position.set(0, y, 0.12);
    l.scale.z = 0.5;
    g.add(l);
    lamps[k] = { m, col };
  }
  g.userData.set = (state) => {
    for (const k of Object.keys(lamps)) {
      const on = k === state;
      lamps[k].m.emissiveIntensity = on ? 1.4 : 0.05;
      lamps[k].m.color.setHex(on ? lamps[k].col : 0x333333);
    }
  };
  g.userData.set('red');
  return g;
}

function treeModel() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.4, 7), mat(0x7a5230));
  trunk.position.y = 0.7;
  g.add(trunk);
  const leafM = mat(0x3f8f3a, { flat: true });
  for (const [x, y, z, r] of [[0, 2.0, 0, 1.0], [0.55, 1.7, 0.25, 0.7], [-0.5, 1.75, -0.25, 0.72], [0.1, 2.6, 0.1, 0.65]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafM);
    b.position.set(x, y, z);
    g.add(b);
  }
  return g;
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const STEPS = ['Опознай стадиона', 'Измери скоростта', 'Какво е движението?', 'Пътуване и безопасност'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xbfe3ff, camPos: [0, 8.5, 13.5], target: [0, 0, 0.5], shadows: false,
    fog: { color: 0xbfe3ff, near: 35, far: 70 }, maxDistance: 40,
  });
  const { scene } = stage;

  // Земя, писта, линии.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), mat(0x86c06c));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const ringPts = (r, n = 200) => {
    const L = stadiumLen(r);
    const pts = [];
    for (let i = 0; i < n; i++) { const p = stadium(r, (L * i) / n); pts.push(new THREE.Vector2(p.x, -p.z)); }
    return pts;
  };
  const shape = new THREE.Shape(ringPts(ROUT));
  shape.holes.push(new THREE.Path(ringPts(RIN).reverse()));
  const trackGeo = new THREE.ShapeGeometry(shape, 4);
  trackGeo.rotateX(-Math.PI / 2);
  const track = new THREE.Mesh(trackGeo, mat(0xc8553d, { roughness: 0.95 }));
  track.position.y = 0.01;
  track.userData.pickId = 'track';
  scene.add(track);
  const lineM = new THREE.LineBasicMaterial({ color: 0xffffff });
  for (let k = 0; k <= 4; k++) {
    const r = RIN + k * LANE;
    const pts = ringPts(r, 160).map((p) => new THREE.Vector3(p.x, 0.02, -p.y));
    scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineM));
  }
  // Табели през 10 m на долната права.
  const posts = [];
  for (let m = 0; m <= 60; m += 10) {
    const ln = box(m === 0 ? 0.08 : 0.045, 0.01, ROUT - RIN, 0xffffff);
    ln.position.set(xOf(m), 0.02, ZC + (RIN + ROUT) / 2);
    scene.add(ln);
    const post = new THREE.Group();
    post.position.set(xOf(m), 0, ZC + ROUT + 0.35);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), mat(0xeceff1));
    pole.position.y = 0.3;
    post.add(pole);
    const l = labelSprite(`${m} m`, { size: 0.32, bg: m === 0 ? 'rgba(255,241,200,0.95)' : 'rgba(255,255,255,0.95)' });
    l.position.y = 0.8;
    post.add(l);
    stage.steadyLabel(l, 14);
    post.userData.pickId = 'track';
    scene.add(post);
    posts.push(post);
  }
  // Финал (премества се на нужната табела).
  const finish = new THREE.Group();
  for (const z of [ZC + RIN - 0.15, ZC + ROUT + 0.15]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 6), mat(0x37474f));
    p.position.set(0, 0.75, z);
    finish.add(p);
  }
  const fl = labelSprite('ФИНАЛ', { size: 0.3, color: '#fff', bg: '#263238', border: '#263238' });
  fl.position.set(0, 1.55, ZC + (RIN + ROUT) / 2);
  finish.add(fl);
  const tape = box(0.02, 0.04, ROUT - RIN + 0.3, 0xffffff);
  tape.position.set(0, 1.45, ZC + (RIN + ROUT) / 2);
  finish.add(tape);
  finish.visible = false;
  scene.add(finish);
  // Пешеходна пътека (стъпка 4).
  const zebra = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const st = box(0.8, 0.012, 0.24, 0xffffff);
    st.position.set(0, 0.025, ZC + RIN + 0.25 + i * 0.46);
    zebra.add(st);
  }
  zebra.position.x = xOf(20);
  zebra.visible = false;
  scene.add(zebra);

  // Декор: дървета, знамена, облаци.
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const x = Math.cos(a) * 16 + Math.sin(i * 7.1) * 1.2;
    const z = ZC + Math.sin(a) * 10.5;
    if (z > 5) continue; // отпред няма дървета, за да не закриват пистата
    const t = treeModel();
    t.scale.setScalar(0.9 + ((i * 37) % 10) / 20);
    t.position.set(x, 0, z);
    t.userData.ph = i;
    scene.add(t);
  }
  const flags = [];
  const flagCols = [0xffffff, 0x00966e, 0xd62612, 0x1e88e5];
  [[-12, -8], [12, -8], [-12.5, 3.5], [12.5, 3.5]].forEach(([x, z], i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 6), mat(0xcfd8dc));
    pole.position.set(x, 1.5, z);
    const pivot = new THREE.Group();
    pivot.position.set(x, 2.75, z);
    const f = box(0.7, 0.42, 0.02, flagCols[i]);
    f.position.x = 0.36;
    pivot.add(f);
    pivot.userData.ph = i * 1.7;
    scene.add(pole, pivot);
    flags.push(pivot);
  });
  const clouds = [];
  const cloudM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.9 + (k % 2) * 0.4, 10, 8), cloudM);
      puff.position.set(k * 0.9 - 1.4, (k % 3) * 0.15, (k % 2) * 0.4);
      puff.scale.y = 0.6;
      c.add(puff);
    }
    c.position.set(-24 + i * 11, 10 + (i % 2) * 1.5, -16 - (i % 3) * 3);
    scene.add(c);
    clouds.push(c);
  }

  // Хронометър и светофар.
  const watch = stopwatchModel();
  watch.position.set(0.5, 0, -0.6);
  watch.userData.pickId = 'watch';
  addHitBox(watch, 1);
  scene.add(watch);
  const light = trafficLightModel();
  light.position.set(-8.6, 0, 0.1);
  light.rotation.y = 0.5;
  light.userData.pickId = 'light';
  addHitBox(light, 0.8);
  scene.add(light);

  // Участниците.
  const MOVERS = {
    car: { label: 'Кола', icon: '🚗', lane: 0, build: carModel, top: 0.9, color: 0xffd600 },
    cyclist: { label: 'Колоездач', icon: '🚴', lane: 1, build: cyclistModel, top: 1.4, color: 0x1e88e5 },
    hare: { label: 'Заек', icon: '🐇', lane: 2, build: hareModel, top: 1.0, color: 0x7c4dff },
    tortoise: { label: 'Костенурка', icon: '🐢', lane: 3, build: tortoiseModel, top: 0.6, color: 0x76ff03 },
  };
  for (const [id, m] of Object.entries(MOVERS)) {
    m.id = id;
    m.root = new THREE.Group();
    m.inner = m.build();
    m.root.add(m.inner);
    m.root.userData.pickId = id;
    addHitBox(m.root, 0.9);
    scene.add(m.root);
  }
  const bus = { root: new THREE.Group(), inner: busModel(), top: 1.1 };
  bus.root.add(bus.inner);
  bus.root.visible = false;
  scene.add(bus.root);
  const thrower = personModel(0x8e24aa);
  thrower.position.set(-5.45, 0, -3.2);
  scene.add(thrower);
  const ball = { root: new THREE.Group(), inner: new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), mat(0xff7043, { flat: true })), top: 0.4 };
  ball.root.add(ball.inner);
  ball.inner.userData.anim = (d) => { ball.inner.rotation.z = -d * 4; };
  scene.add(ball.root);
  const walker = personModel(0x00897b);
  walker.position.set(xOf(20), 0, ZC + ROUT + 0.55);
  walker.rotation.y = Math.PI / 2;
  walker.visible = false;
  scene.add(walker);

  function place(m, x, z, yaw = 0) { m.root.position.set(x, 0, z); m.root.rotation.y = yaw; }
  function park(id) { const m = MOVERS[id]; m.busy = false; place(m, xOf(-2), laneZ(m.lane)); if (m.inner.userData.anim) m.inner.userData.anim(0); m.inner.position.y = 0; }
  function resetBall() { ball.root.position.set(-5.2, 0.95, -3.2); ball.inner.rotation.set(0, 0, 0); }
  resetBall();

  // ---------- хронометър ----------
  let watchT = 0;
  let watchTxt = '';
  const watchBubble = stage.bubble(watch, '', { lift: 2.75, cls: 'tag' });
  let watchNote = '';
  function setWatch(t) {
    watchT = t;
    const txt = `⏱ ${t.toFixed(1).replace('.', ',')} s${watchNote}`;
    if (txt !== watchTxt) { watchTxt = txt; watchBubble.set(txt); }
  }
  setWatch(0);

  // ---------- следа (точки през равни интервали от време) ----------
  const trail = new THREE.Group();
  scene.add(trail);
  const dotGeo = new THREE.SphereGeometry(0.075, 8, 6);
  const dotMats = new Map();
  const dotMat = (c) => { if (!dotMats.has(c)) dotMats.set(c, new THREE.MeshBasicMaterial({ color: c })); return dotMats.get(c); };
  // Точки на едно място (тялото стои) се трупат една над друга, за да се вижда, че са много.
  function addDot(x, y, z, c) {
    const d = new THREE.Mesh(dotGeo, dotMat(c));
    const last = trail.children[trail.children.length - 1];
    let yy = y;
    if (last && last.userData.y0 === y && Math.hypot(last.position.x - x, last.position.z - z) < 0.1) yy = last.position.y + 0.16;
    d.userData.y0 = y;
    d.position.set(x, yy, z);
    trail.add(d);
  }
  function clearTrail() { for (const d of trail.children.slice()) trail.remove(d); }

  // ---------- изпълнение на движение ----------
  // path(t) → { x, z, yaw?, y? } за t от -pre до dur (симулирано време).
  let run = null;
  function startRun(o) {
    run = {
      t: -(o.pre || 0), dist: 0, nextDot: 0, playback: 1, dotEvery: 0.5, dotY: 0.07, dotTill: o.dur, ...o,
    };
    run.obj.busy = true;
    const p = run.path(run.t);
    run.last = p;
  }
  function stopRun() { if (run) { run.obj.busy = false; run = null; } }

  // ---------- живот на сцената ----------
  let lightAuto = true;
  let lightState = 'red';
  const setLight = (s) => { if (s !== lightState) { lightState = s; light.userData.set(s); } };
  let lapCyclist = true;
  let lapU = 6;
  let busLap = false;
  let busU = 0;
  let busTag = null;
  stage.tick((dt, t) => {
    for (const c of clouds) { c.position.x += dt * 0.3; if (c.position.x > 30) c.position.x = -30; }
    for (const f of flags) f.rotation.y = Math.sin(t * 2.2 + f.userData.ph) * 0.35;
    if (lightAuto) {
      const cyc = t % 7;
      setLight(cyc < 3 ? 'red' : cyc < 6 ? 'green' : 'yellow');
    }
    watch.userData.hand.rotation.z = -(watchT / 60) * Math.PI * 2;
    // хвърлящото дете маха с ръка
    thrower.userData.arms[0].rotation.z = Math.sin(t * 1.5) * 0.15;
    if (walker.visible) walker.userData.arms[1].rotation.x = Math.sin(t * 2) * 0.1;

    // Изпълнявано движение.
    if (run) {
      run.t += dt * run.playback;
      const tt = Math.min(run.t, run.dur + (run.after || 0));
      const p = run.path(tt);
      const r = run.obj.root;
      r.position.set(p.x, p.y || 0, p.z);
      if (p.yaw !== undefined) r.rotation.y = p.yaw;
      run.dist += Math.hypot(p.x - run.last.x, (p.y || 0) - (run.last.y || 0), p.z - run.last.z);
      run.last = p;
      const anim = run.obj.inner.userData.anim;
      if (anim) anim(run.dist);
      if (run.onT) run.onT(tt);
      while (run.nextDot <= Math.min(tt, run.dotTill) + 1e-9) {
        const q = run.path(run.nextDot);
        addDot(q.x, (q.y || 0) + run.dotY, q.z, typeof run.color === 'function' ? run.color(run.nextDot) : run.color);
        run.nextDot += run.dotEvery;
      }
      if (run.t >= run.dur + (run.after || 0)) {
        const done = run;
        stopRun();
        if (MOVERS[done.obj.id]) {
          // спрял участник: краката и колелата застиват
          if (done.obj.id === 'hare') done.obj.inner.position.y = 0;
        }
        if (done.onDone) done.onDone();
      }
    }

    // Колоездачът обикаля пистата в първата стъпка.
    const cyc = MOVERS.cyclist;
    if (lapCyclist && !cyc.busy) {
      lapU += dt * 1.5;
      const p = stadium(laneR(cyc.lane), lapU);
      place(cyc, p.x, p.z, p.yaw);
      cyc.inner.userData.anim(lapU);
    }
    if (busLap) {
      busU += dt * 1.8;
      const p = stadium(laneR(2), busU);
      bus.root.position.set(p.x, 0, p.z);
      bus.root.rotation.y = p.yaw;
      bus.inner.userData.anim(busU);
    }
    // Спокойно „дишане“ на тези, които стоят.
    const h = MOVERS.hare;
    if (!h.busy) {
      const head = h.inner.userData.head;
      head.rotation.y = Math.sin(t * 0.8) * 0.4;
      const ears = h.inner.userData.ears;
      ears[0].rotation.z = Math.max(0, Math.sin(t * 3.1)) * 0.25;
      const c2 = (t * 0.5) % 2.6;
      h.inner.position.y = c2 < 0.3 ? Math.sin((c2 / 0.3) * Math.PI) * 0.12 : 0;
    }
    const tor = MOVERS.tortoise;
    if (!tor.busy) {
      tor.inner.userData.head.position.x = 0.4 + Math.sin(t * 0.7) * 0.05;
      tor.inner.userData.head.rotation.y = Math.sin(t * 0.4) * 0.3;
    }
    const car = MOVERS.car;
    if (!car.busy) car.inner.position.y = Math.sin(t * 40) * 0.004; // двигателят работи на място
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
  const overview = () => view([-0.6, 9, 14.5], [-0.6, 0, 0.8]);
  const trackView = () => view([-0.4, 7.6, 12.2], [-0.4, 0, 1.2]);
  let tip = null;
  function say(anchor, html, cls = '', lift = 1) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  let tags = [];
  function tag(anchor, html, lift = 1, cls = 'tag') { const b = stage.bubble(anchor, html, { lift, cls }); tags.push(b); return b; }
  function clearTags() { for (const b of tags) b.remove(); tags = []; }

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null, hit));
  let menuHandler = null;
  const ITEMS = [
    { id: 'track', label: 'Писта', icon: '🏟', anchor: () => posts[3], lift: 1.3, dist: 8,
      note: 'Правата част на пистата е дълга <b>60 m</b>. На всеки <b>10 m</b> има табела — по табелите отчитаме изминатия <b>път</b>.' },
    { id: 'watch', label: 'Хронометър', icon: '⏱', anchor: () => watch, lift: 3.4, dist: 5, flift: 1.6,
      note: 'Мери <b>времето</b> в секунди (s). Пуска се, когато участникът мине старта (0 m), и спира на финала.' },
    { id: 'car', label: 'Кола', icon: '🚗',
      note: 'По правата колата се движи <b>праволинейно</b>, а в завоя — <b>криволинейно</b>. Линията, по която се движи тялото, е неговата <b>траектория</b>.' },
    { id: 'cyclist', label: 'Колоездач', icon: '🚴',
      note: 'Обикаля пистата. Ако за всяка секунда изминава еднакъв път, движението му е <b>равномерно</b>.' },
    { id: 'tortoise', label: 'Костенурка', icon: '🐢',
      note: 'Най-бавната на пистата: за 1 секунда изминава само около 20 cm.' },
    { id: 'hare', label: 'Заек', icon: '🐇',
      note: 'Тича много бързо, но често спира и пак тръгва. Такова движение е <b>неравномерно</b>.' },
    { id: 'light', label: 'Светофар', icon: '🚦', anchor: () => light, lift: 2.9, dist: 5, flift: 1.6,
      note: 'Червено — стой, зелено — тръгвай. На зелено колата тръгва и постепенно увеличава скоростта си.' },
  ];
  const menu = cornerMenu(stage, {
    title: 'Какво има на стадиона',
    items: ITEMS.map(({ id, label, icon }) => ({ id, label, icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip(); clearTags(); clearTrail(); stopRun();
    lightAuto = true; lapCyclist = true; busLap = false; bus.root.visible = false;
    finish.visible = false; zebra.visible = false; walker.visible = false;
    for (const id of ['car', 'hare', 'tortoise']) park(id);
    MOVERS.cyclist.busy = false;
    resetBall();
    watchNote = ''; setWatch(0);
    watchBubble.el.style.visibility = '';
    menu.setItems(ITEMS.map(({ id, label, icon }) => ({ id, label, icon })));
    menu.show(true);
    const seen = new Set();
    shell.task(`<p>На стадиона ще мерим колко бързо се движат различни участници.</p>
      <p><b>Разгледай поне 5 неща</b> — кликни върху тях или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Целият стадион</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${ITEMS.length}`);
    upd();
    const visit = (id) => {
      const it = ITEMS.find((x) => x.id === id);
      if (!it) return;
      const m = MOVERS[id];
      const anchor = m ? m.root : it.anchor();
      stage.focusOn(anchor, { dist: it.dist || 4.5, height: 1.6, lift: it.flift || 0.4 });
      say(anchor, `<b>${esc(it.icon)} ${esc(it.label)}</b><br>${it.note}`, 'wide', m ? m.top + 0.2 : it.lift);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size >= 5) { next.disabled = false; shell.msg('Браво! Можеш да продължиш или да разгледаш още.', 'good'); }
    };
    clickHandler = (id) => { if (!id) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.show(false); menuHandler = null; step2(); });
    overview();
  }

  // ---------- 2. Измери скоростта ----------
  const RUNS = [
    { id: 'cyclist', v: 5, ds: [30, 40, 50], dotEvery: 1 },
    { id: 'car', v: 20, ds: [30, 50], dotEvery: 0.5 },
    { id: 'tortoise', v: 0.2, ds: [10, 20], dotEvery: 5, fast: true },
  ];
  function step2() {
    shell.step(1);
    clearTip(); clearTags(); clearTrail();
    lapCyclist = false; lightAuto = false; setLight('green');
    for (const id of Object.keys(MOVERS)) park(id);
    trackView();
    let mistakes = 0;
    let idx = 0;
    const done = [];
    clickHandler = null;
    const table = () => (done.length ? `<table class="motion-table"><tr><th></th><th>s</th><th>t</th><th>v</th></tr>${done.map((d) => `<tr><td>${esc(MOVERS[d.id].icon)} ${esc(MOVERS[d.id].label)}</td><td>${nice(d.s)} m</td><td>${nice(d.t)} s</td><td><b>${nice(d.v)} m/s</b></td></tr>`).join('')}</table>` : '');
    const load = () => {
      stopRun(); clearTip(); clearTags(); clearTrail();
      const R = RUNS[idx];
      const m = MOVERS[R.id];
      const d = R.ds[Math.floor(Math.random() * R.ds.length)];
      const T = d / R.v;
      const tau = Math.min(1, T * 0.2); // плавно спиране след финала
      const play = R.fast ? Math.round(T / 5) : 1;
      let tries = 0;
      let ran = false;
      finish.position.x = xOf(d);
      finish.visible = true;
      for (const id of Object.keys(MOVERS)) park(id);
      for (const id of Object.keys(MOVERS)) MOVERS[id].root.visible = id === R.id;
      watchNote = ''; setWatch(0);
      tag(m.root, `${esc(m.icon)} ${esc(m.label)}`, m.top);
      shell.score(`Участник ${idx + 1} от ${RUNS.length} · грешки: ${mistakes}`);
      shell.task(`<p><b>${esc(m.icon)} ${esc(m.label)}</b> се движи равномерно по правата. Натисни „Старт“ и гледай.</p>
        <p class="small">Стартът е летящ: участникът минава табелата 0 m вече набрал скорост. Хронометърът тръгва при 0 m и спира на финала. Точките в следата се оставят през равни интервали от време.</p>
        <div class="motion-form" hidden>
          <label>Изминат път: s = <input class="in-s" type="text" inputmode="decimal" autocomplete="off"> m</label>
          <label>Време: t = <input class="in-t" type="text" inputmode="decimal" autocomplete="off"> s</label>
          <label>Скорост: v = s : t = <input class="in-v" type="text" inputmode="decimal" autocomplete="off"> m/s</label>
        </div>${table()}`);
      const form = container.querySelector('.motion-form');
      const c = shell.setControls('<div class="row"><button class="btn primary go">▶ Старт</button><button class="btn chk motion-hide" hidden>Провери</button></div>');
      const go = c.querySelector('.go');
      const chk = c.querySelector('.chk');
      go.addEventListener('click', () => {
        clearTip(); clearTrail();
        go.disabled = true;
        watchNote = play > 1 ? ` · ускорено ×${play}` : '';
        setWatch(0);
        const pre = 2 / R.v; // 2 m преди старта
        const pos = (t) => {
          let s = R.v * t;
          if (t > T) { const u = Math.min(t - T, tau); s = d + R.v * u - (R.v / (2 * tau)) * u * u; }
          return { x: xOf(s), z: laneZ(m.lane), yaw: 0 };
        };
        startRun({
          obj: m, path: pos, pre, dur: T, after: tau, playback: play, dotEvery: R.dotEvery, color: m.color,
          onT: (t) => setWatch(Math.max(0, Math.min(t, T))),
          onDone: () => {
            ran = true;
            go.disabled = false;
            go.textContent = '↻ Пусни пак';
            go.classList.remove('primary');
            chk.hidden = false;
            chk.classList.add('primary');
            form.hidden = false;
            shell.msg('Отчети пътя по табелите и времето от хронометъра.');
            const inp = container.querySelector('.in-s');
            if (inp && !inp.value) inp.focus({ preventScroll: true });
          },
        });
      });
      chk.addEventListener('click', () => {
        if (!ran) return;
        const iS = container.querySelector('.in-s');
        const iT = container.querySelector('.in-t');
        const iV = container.querySelector('.in-v');
        const s = num(iS.value); const t = num(iT.value); const v = num(iV.value);
        if (![s, t, v].every(Number.isFinite)) { shell.msg('Попълни и трите полета с числа.', 'bad'); return; }
        const sOk = Math.abs(s - d) < 0.01;
        const tOk = Math.abs(t - T) < 0.051;
        const vOk = Math.abs(v - R.v) <= R.v * 0.02 + 1e-9;
        iS.className = 'in-s ' + (sOk ? 'right' : 'wrong');
        iT.className = 'in-t ' + (tOk ? 'right' : 'wrong');
        iV.className = 'in-v ' + (vOk ? 'right' : 'wrong');
        if (sOk && tOk && vOk) {
          go.disabled = true; chk.disabled = true;
          [iS, iT, iV].forEach((x) => { x.disabled = true; });
          say(m.root, `✔ v = ${nice(d)} m : ${nice(T)} s = <b>${nice(R.v)} m/s</b><br>За всяка секунда — ${nice(R.v)} m.`, 'good', m.top + 0.2);
          shell.msg('Вярно!', 'good');
          done.push({ id: R.id, s: d, t: T, v: R.v });
          const last = idx === RUNS.length - 1;
          const nx = shell.setControls(`<button class="btn primary">${last ? 'Напред →' : 'Следващ участник →'}</button>`).querySelector('button');
          nx.addEventListener('click', () => {
            if (last) { scores.push(stepScore(mistakes, 3)); step3(); return; }
            idx++;
            shell.msg('');
            load();
          });
          return;
        }
        mistakes++; tries++;
        shell.score(`Участник ${idx + 1} от ${RUNS.length} · грешки: ${mistakes}`);
        let why;
        if (!sOk) why = 'Пътят не е верен: виж на коя табела е финалът. Стартът е при 0 m.';
        else if (!tOk) why = 'Времето не е вярно: виж какво показва хронометърът.';
        else if (tries >= 2) why = `Подсказка: v = s : t = ${nice(d)} : ${nice(T)}. Колко метра се падат на 1 секунда?`;
        else why = 'Скоростта не е вярна. Раздели пътя на времето: v = s : t.';
        shell.msg(why, 'bad');
      });
    };
    load();
  }

  // ---------- 3. Какво е движението? ----------
  const HARE_PLAN = [[1, 0.9], [0, 0.9], [1, 0.9], [0, 0.9], [1, 0.9], [0, 0.7], [1, 0.9]];
  const harePath = (t) => {
    let x = X0; let left = Math.max(0, t);
    for (const [moving, dur] of HARE_PLAN) {
      const u = Math.min(left, dur);
      if (moving) x += 3.2 * u;
      left -= u;
      if (left <= 0) break;
    }
    return { x, z: laneZ(MOVERS.hare.lane), yaw: 0 };
  };
  const hareDur = HARE_PLAN.reduce((a, [, d]) => a + d, 0);
  const DEMOS = [
    { title: 'Колата тръгва на зелен светофар', mover: 'car', traj: 'straight', unif: false, dotEvery: 0.4,
      dur: Math.sqrt((2 * 15) / 1.4), pre: 1.4, cam: 'track',
      path: (t) => ({ x: X0 + (t > 0 ? 0.7 * t * t : 0), z: laneZ(0), yaw: 0 }),
      onT: (t) => setLight(t < -0.5 ? 'red' : t < 0 ? 'yellow' : 'green'),
      why: 'Точките са по права линия, а разстоянията между тях растат: колата увеличава скоростта си.' },
    { title: 'Колата минава през завоя', mover: 'car', traj: 'curved', unif: true, dotEvery: 0.35,
      dur: (Math.PI * laneR(0)) / 2.4, cam: 'bend',
      path: (t) => stadium(laneR(0), 2 * HALF + 2.4 * Math.max(0, t)),
      why: 'Траекторията е крива — половин окръжност. Разстоянията между точките са еднакви: скоростта не се променя.' },
    { title: 'Колоездачът кара по правата', mover: 'cyclist', traj: 'straight', unif: true, dotEvery: 0.4,
      dur: 6, pre: 0.4, cam: 'track',
      path: (t) => ({ x: X0 + 2.5 * t, z: laneZ(1), yaw: 0 }),
      why: 'Права следа и еднакви разстояния между точките: праволинейно и равномерно движение.' },
    { title: 'Заекът тича, спира и пак тръгва', mover: 'hare', traj: 'straight', unif: false, dotEvery: 0.3,
      dur: hareDur, cam: 'track', path: harePath,
      why: 'Където заекът спира, точките се трупат на едно място. Скоростта му се променя: движението е неравномерно.' },
    { title: 'Хвърлена топка', mover: 'ball', traj: 'curved', unif: false, dotEvery: 0.15,
      dur: (5.5 + Math.sqrt(5.5 * 5.5 + 2 * 6 * (0.95 - 0.14))) / 6, cam: 'ball',
      path: (t) => { const u = Math.max(0, t); return { x: -5.2 + 2.0 * u, y: Math.max(0.14, 0.95 + 5.5 * u - 3 * u * u), z: -3.2 }; },
      why: 'Топката лети по крива линия. Нагоре се забавя, а надолу се ускорява — разстоянията между точките са различни.' },
  ];
  function step3() {
    shell.step(2);
    clearTip(); clearTags(); clearTrail();
    finish.visible = false;
    for (const id of Object.keys(MOVERS)) { park(id); MOVERS[id].root.visible = true; }
    watchNote = ''; setWatch(0);
    watchBubble.el.style.visibility = 'hidden';
    let mistakes = 0;
    let i = 0;
    clickHandler = null;
    const camFor = (D) => {
      if (D.cam === 'bend') view([13.5, 6.5, 5], [8.6, 0.3, -2.4]);
      else if (D.cam === 'ball') view([-3.2, 3.6, 5.2], [-3.4, 1.3, -3.2]);
      else trackView();
    };
    const load = () => {
      stopRun(); clearTip(); clearTags(); clearTrail();
      const D = DEMOS[i];
      let tries = 0;
      let played = false;
      const ans = {};
      shell.score(`Движение ${i + 1} от ${DEMOS.length} · грешки: ${mistakes}`);
      shell.task(`<p><b>${esc(D.title)}</b></p>
        <p class="small">Точките в следата се оставят през равни интервали от време. Гледай каква е линията и как са разположени точките.</p>
        <p>Според траекторията движението е:</p>
        <div class="motion-pair" data-q="traj"><button class="choice" data-v="straight">📏 праволинейно</button><button class="choice" data-v="curved">↪ криволинейно</button></div>
        <p>Според скоростта движението е:</p>
        <div class="motion-pair" data-q="unif"><button class="choice" data-v="1">＝ равномерно</button><button class="choice" data-v="0">≠ неравномерно</button></div>`);
      const c = shell.setControls('<div class="row"><button class="btn again">↻ Пусни пак</button><button class="btn primary chk" disabled>Провери</button></div>');
      const again = c.querySelector('.again');
      const chk = c.querySelector('.chk');
      const ready = () => { chk.disabled = !(played && ans.traj && ans.unif); };
      container.querySelectorAll('.motion-pair').forEach((boxEl) => {
        boxEl.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
          boxEl.querySelectorAll('.choice').forEach((x) => x.classList.remove('on', 'wrong'));
          b.classList.add('on');
          ans[boxEl.dataset.q] = b.dataset.v;
          ready();
        }));
      });
      const obj = D.mover === 'ball' ? ball : MOVERS[D.mover];
      const play = () => {
        clearTip(); clearTrail();
        again.disabled = true;
        if (D.mover === 'ball') resetBall();
        if (D.cam === 'track') lightAuto = false;
        startRun({
          obj, path: D.path, pre: D.pre || 0, dur: D.dur, dotEvery: D.dotEvery,
          color: D.mover === 'ball' ? 0xff7043 : MOVERS[D.mover].color, onT: D.onT,
          dotY: D.mover === 'ball' ? 0 : 0.07,
          onDone: () => { played = true; again.disabled = false; ready(); },
        });
      };
      again.addEventListener('click', play);
      chk.addEventListener('click', () => {
        const okT = ans.traj === D.traj;
        const okU = (ans.unif === '1') === D.unif;
        if (okT && okU) {
          container.querySelectorAll('.motion-pair .choice').forEach((b) => { b.disabled = true; if (b.classList.contains('on')) b.classList.add('right'); });
          say(obj.root, `✔ ${esc(D.why)}`, 'good wide', (obj.top || 0.6) + 0.2);
          shell.msg('Вярно!', 'good');
          const last = i === DEMOS.length - 1;
          const nx = shell.setControls(`<button class="btn primary">${last ? 'Напред →' : 'Следващо движение →'}</button>`).querySelector('button');
          nx.addEventListener('click', () => {
            if (last) { scores.push(stepScore(mistakes, 4)); step4(); return; }
            i++;
            shell.msg('');
            if (DEMOS[i].mover === 'car' && DEMOS[i].cam === 'track') park('car');
            camFor(DEMOS[i]);
            load();
          });
          return;
        }
        mistakes++; tries++;
        shell.score(`Движение ${i + 1} от ${DEMOS.length} · грешки: ${mistakes}`);
        for (const [q, ok] of [['traj', okT], ['unif', okU]]) {
          if (!ok) container.querySelector(`.motion-pair[data-q="${q}"] .choice.on`).classList.add('wrong');
        }
        let why = !okT ? 'Виж следата: точките лежат ли на права линия?' : 'Сравни разстоянията между съседните точки.';
        if (tries >= 2) why += ' Подсказка: еднакви разстояния между точките → равномерно; различни → неравномерно.';
        shell.msg(why, 'bad');
      });
      play();
    };
    camFor(DEMOS[0]);
    park('car');
    load();
  }

  // ---------- 4. Пътуване и безопасност ----------
  const REACT = 1; // s — време за реакция на шофьора
  const DECEL = 7; // m/s² — спиране по сух асфалт
  const stopData = (kmh) => {
    const v = kmh / 3.6;
    const r = Math.round(v * REACT);
    const b = Math.round((v * v) / (2 * DECEL));
    return { v, r, b, total: r + b };
  };
  function step4() {
    shell.step(3);
    stopRun(); clearTip(); clearTags(); clearTrail();
    for (const id of Object.keys(MOVERS)) { park(id); MOVERS[id].root.visible = false; }
    watchBubble.el.style.visibility = 'hidden';
    lightAuto = true;
    overview();
    let mistakes = 0;
    clickHandler = null;
    const upd = (part) => shell.score(`Задача ${part} от 5 · грешки: ${mistakes}`);

    const numTask = ({ part, html, unit, answer, hints, onOk }) => {
      let tries = 0;
      upd(part);
      shell.task(`${html}<div class="motion-form"><label>Отговор: <input class="in-a" type="text" inputmode="decimal" autocomplete="off"> ${unit}</label></div>`);
      const btn = shell.setControls('<button class="btn primary">Провери</button>').querySelector('button');
      const inp = container.querySelector('.in-a');
      const check = () => {
        const v = num(inp.value);
        if (!Number.isFinite(v)) { shell.msg('Напиши число.', 'bad'); return; }
        if (Math.abs(v - answer) < 1e-6) {
          inp.className = 'in-a right'; inp.disabled = true;
          onOk();
          return;
        }
        inp.className = 'in-a wrong';
        mistakes++; tries++;
        upd(part);
        shell.msg(hints(v, tries), 'bad');
      };
      btn.addEventListener('click', check);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    };

    // А) Автобус: s = v · t
    bus.root.visible = true;
    busLap = true;
    busTag = tag(bus.root, '🚌 60 km/h', bus.top);
    numTask({
      part: 1, unit: 'km', answer: 120,
      html: '<p>Автобус пътува между два града равномерно със скорост <b>60 km/h</b>. Какъв път изминава за <b>2 h</b>?</p><p class="small">60 km/h означава 60 km за всеки час.</p>',
      hints: (v, n) => (v === 30 ? 'Раздели ли? При равномерно движение пътят е скорост по време: s = v · t.'
        : n >= 2 ? 'Подсказка: за 1 час — 60 km, за още 1 час — още 60 km.' : 'Не е вярно. Пътят е скоростта по времето: s = v · t.'),
      onOk: () => {
        shell.msg('Вярно! s = 60 km/h · 2 h = 120 km.', 'good');
        say(bus.root, '✔ 60 km/h · 2 h = <b>120 km</b>', 'good', bus.top + 0.5);
        const nx = shell.setControls('<button class="btn primary">Напред →</button>').querySelector('button');
        nx.addEventListener('click', partB);
      },
    });

    // Б) Колоездач: t = s : v
    function partB() {
      clearTip(); shell.msg('');
      busLap = false; bus.root.visible = false;
      clearTags();
      lapCyclist = true;
      MOVERS.cyclist.root.visible = true;
      tag(MOVERS.cyclist.root, '🚴 15 km/h', MOVERS.cyclist.top);
      numTask({
        part: 2, unit: 'h', answer: 3,
        html: '<p>Колоездач кара равномерно със скорост <b>15 km/h</b>. За колко часа ще измине <b>45 km</b>?</p>',
        hints: (v, n) => (n >= 2 ? 'Подсказка: колко пъти 15 km се събират в 45 km? t = s : v.'
          : 'Не е вярно. Времето е пътят, разделен на скоростта: t = s : v.'),
        onOk: () => {
          shell.msg('Вярно! t = 45 km : 15 km/h = 3 h.', 'good');
          say(MOVERS.cyclist.root, '✔ 45 km : 15 km/h = <b>3 h</b>', 'good', MOVERS.cyclist.top + 0.5);
          const nx = shell.setControls('<button class="btn primary">Напред →</button>').querySelector('button');
          nx.addEventListener('click', partC);
        },
      });
    }

    // В) Път до спиране
    function partC() {
      clearTip(); clearTags(); shell.msg('');
      lapCyclist = false;
      for (const id of Object.keys(MOVERS)) { park(id); MOVERS[id].root.visible = id === 'car'; }
      lightAuto = false; setLight('green');
      zebra.visible = true; walker.visible = true;
      tag(walker, '🚶 пешеходец при 20 m', 1.5);
      trackView();
      upd(3);
      const car = MOVERS.car;
      const tried = new Map();
      let kmh = 50;
      const drawTable = () => (tried.size ? `<table class="motion-table"><tr><th>скорост</th><th>реакция</th><th>спиране</th><th>общо</th></tr>${[...tried.keys()].sort((a, b) => a - b).map((k) => { const s = tried.get(k); return `<tr><td>${k} km/h</td><td>${s.r} m</td><td>${s.b} m</td><td><b>${s.total} m</b></td></tr>`; }).join('')}</table>` : '');
      shell.task(`<p>Шофьорът забелязва опасност, когато колата минава табелата <b>0 m</b>. Докато реагира (около 1 s), колата продължава със същата скорост — <b style="background:#ffeb3b;padding:0 4px;border-radius:4px">жълти</b> точки. После спира — <b style="background:#212121;color:#fff;padding:0 4px;border-radius:4px">черни</b> точки.</p>
        <p><b>Пробвай поне две скорости</b> и виж докъде стига колата.</p>
        <div class="motion-chips">${[30, 50, 70].map((k) => `<span class="chip ${k === kmh ? 'held' : ''}" data-k="${k}">${k} km/h</span>`).join('')}</div>
        <div class="motion-tbl"></div><div class="motion-qs"></div>`);
      container.querySelectorAll('.motion-chips .chip').forEach((ch) => ch.addEventListener('click', () => {
        if (run) return;
        kmh = +ch.dataset.k;
        container.querySelectorAll('.motion-chips .chip').forEach((x) => x.classList.toggle('held', x === ch));
      }));
      const c = shell.setControls('<button class="btn primary brake">🛑 Спирачка!</button>');
      const brakeBtn = c.querySelector('.brake');
      brakeBtn.addEventListener('click', () => {
        if (run) return;
        clearTip(); clearTrail();
        const sd = stopData(kmh);
        const v = sd.v;
        const tStop = REACT + v / DECEL;
        const pos = (t) => {
          let s;
          if (t < REACT) s = v * t;
          else { const u = Math.min(t, tStop) - REACT; s = v * REACT + v * u - (DECEL / 2) * u * u; }
          return { x: xOf(s), z: laneZ(car.lane), yaw: 0 };
        };
        brakeBtn.disabled = true;
        startRun({
          obj: car, path: pos, pre: 0.8, dur: tStop, dotEvery: 0.2,
          color: (t) => (t < REACT ? 0xffeb3b : 0x212121),
          onDone: () => {
            brakeBtn.disabled = false;
            tried.set(kmh, sd);
            const safe = sd.total < 20;
            say(car.root, `${kmh} km/h: реакция ${sd.r} m + спиране ${sd.b} m = <b>${sd.total} m</b><br>${safe ? 'Спря преди пътеката.' : '⚠ Не успя да спре преди пътеката!'}`, safe ? 'good' : 'bad', car.top + 0.2);
            container.querySelector('.motion-tbl').innerHTML = drawTable();
            if (tried.size >= 2 && !qShown) showQ();
          },
        });
      });
      let qShown = false;
      const showQ = () => {
        qShown = true;
        choiceQ(container.querySelector('.motion-qs'), {
          part: 3,
          q: 'Пешеходец стъпва на пътеката <b>20 m</b> пред колата. При коя скорост колата ще спре преди него?',
          opts: ['Само при 30 km/h', 'При 30 km/h и при 50 km/h', 'При всички три скорости'],
          right: 0,
          bad: 'Сравни „общо“ в таблицата с 20 m.',
          ok: 'Вярно! При 50 km/h колата изминава около 28 m, докато спре — повече от 20 m. Спирачният път расте по-бързо от скоростта: при двойно по-голяма скорост той е 4 пъти по-дълъг.',
          then: (box) => {
            brakeBtn.remove();
            choiceQ(box, {
              part: 4,
              q: 'Какво още удължава пътя до спирането?',
              opts: ['Мокър или заледен път', 'Нови гуми', 'По-ниска скорост'],
              right: 0,
              bad: 'Помисли кога гумите се хлъзгат по пътя.',
              ok: 'Вярно! По мокър и заледен път спирачният път е много по-дълъг. Удължава го и шофьор, който е разсеян, уморен или говори по телефона.',
              then: (b2) => choiceQ(b2, {
                part: 5,
                q: 'Как пресичаш улицата безопасно?',
                opts: [
                  'По пешеходна пътека, на зелен сигнал за пешеходци, след като се огледам наляво, надясно и пак наляво',
                  'Тичешком между паркираните коли — така е най-бързо',
                  'На червен сигнал, ако наблизо не се вижда кола',
                ],
                right: 0,
                bad: 'Шофьорът може да не те види и да не успее да спре навреме.',
                ok: 'Вярно! Пресичаме само на пешеходна пътека и на зелен сигнал, без да тичаме и без да гледаме в телефона.',
                then: finishAll,
              }),
            });
          },
        });
      };
    }

    // Въпрос с избор, вграден в панела; then(box) показва следващия.
    function choiceQ(boxEl, { part, q, opts, right, bad, ok, then }) {
      upd(part);
      const order = opts.map((o, k) => k).sort(() => Math.random() - 0.5);
      const wrap = document.createElement('div');
      wrap.className = 'motion-q';
      wrap.innerHTML = `<p>${q}</p><div class="choices">${order.map((k) => `<button class="choice" data-i="${k}">${esc(opts[k])}</button>`).join('')}</div><div class="motion-next"></div>`;
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
        then(wrap.querySelector('.motion-next'));
      }));
      wrap.scrollIntoView({ block: 'nearest' });
    }

    function finishAll() {
      scores.push(stepScore(mistakes, 3));
      const btn = shell.setControls('<button class="btn primary">Виж резултата</button>').querySelector('button');
      btn.addEventListener('click', () => {
        clearTip(); clearTags();
        const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    }
  }

  function restart() {
    scores.length = 0;
    stopRun();
    clearTip(); clearTags(); clearTrail();
    busLap = false; bus.root.visible = false;
    for (const id of Object.keys(MOVERS)) MOVERS[id].root.visible = true;
    step1();
  }

  step1();
  return {
    dispose() {
      stopRun();
      stage.dispose();
      style.remove();
    },
  };
}
