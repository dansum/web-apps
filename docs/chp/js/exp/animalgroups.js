// 4.3.3 „Групи животни“ — 3D природонаучен музей със зоопарк: голям аквариум, терариум и открит двор с езерце.
// Стъпки: опознай → рентген: гръбначни и безгръбначни → подреди по групи → вода и суша, предскажи.
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const CSS = `
.animalgroups-card { background: #fffbea; border: 2px solid #f0d67a; border-radius: 10px; padding: 8px 10px; margin-top: 6px; }
.animalgroups-card b { font-size: 1.05rem; }
.animalgroups-card ul { margin: 4px 0 0; padding-left: 18px; }
.animalgroups-card li { margin: 2px 0; }
.animalgroups-xray.on { background: #12263f; color: #fff; border-color: #12263f; }
.animalgroups-q { margin-top: 10px; }
@media (max-width: 420px) { .animalgroups-card { padding: 6px 8px; font-size: 0.92rem; } }
`;

const V3 = THREE.Vector3;

// ---------- помощни модели ----------
function sph(r, color, seg = 12) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 4)), typeof color === 'number' ? mat(color) : color); }
function cyl(rt, rb, h, color, seg = 10) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof color === 'number' ? mat(color) : color); }
function box(w, h, d, color, extra) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra)); }
function at(m, x, y, z) { m.position.set(x, y, z); return m; }

// Цилиндър между две точки.
function segMesh(a, b, r, m) {
  const A = new V3(...a);
  const B = new V3(...b);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.max(0.001, A.distanceTo(B)), 6), m);
  c.position.copy(A).add(B).multiplyScalar(0.5);
  c.quaternion.setFromUnitVectors(new V3(0, 1, 0), B.clone().sub(A).normalize());
  return c;
}

// Кости за „рентгена“: виждат се през полупрозрачното тяло.
function bonesKit(g) {
  const m = new THREE.MeshBasicMaterial({ color: 0xfff8e0, depthTest: false, transparent: true, opacity: 0.95 });
  const list = g.userData.boneList = [];
  const reg = (mesh, parent) => { mesh.userData.bone = true; mesh.renderOrder = 6; mesh.visible = false; (parent || g).add(mesh); list.push(mesh); return mesh; };
  return {
    seg: (a, b, r, parent) => reg(segMesh(a, b, r, m), parent),
    ball: (p, r, parent) => reg(at(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m), ...p), parent),
    // Гръбначен стълб: прешлени по начупена линия.
    spine(pts, r, parent) {
      for (let i = 0; i < pts.length - 1; i++) {
        const A = new V3(...pts[i]);
        const B = new V3(...pts[i + 1]);
        const n = Math.max(1, Math.round(A.distanceTo(B) / (r * 2.6)));
        for (let k = 0; k < n; k++) reg(at(new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m), ...A.clone().lerp(B, k / n).toArray()), parent);
      }
      reg(at(new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m), ...pts[pts.length - 1]), parent);
    },
    // Ребра от двете страни на гръбнака.
    ribs(x0, x1, y, n, len, r, parent, down = 0.6) {
      for (let i = 0; i < n; i++) {
        const x = x0 + (x1 - x0) * (i / Math.max(1, n - 1));
        for (const s of [1, -1]) reg(segMesh([x, y, 0], [x - 0.02, y - len * down, s * len * 0.7], r, m), parent);
      }
    },
  };
}

// Крака, които висят от „тазобедрена“ точка, за да се люлеят при ходене.
function legs(g, color, { n = 4, len = 0.5, r = 0.06, spreadX = 0.5, spreadZ = 0.18, y = 0, bk = null }) {
  const m = mat(color);
  const list = g.userData.legs || (g.userData.legs = []);
  const pts = n === 2 ? [[0, spreadZ], [0, -spreadZ]] : [[spreadX, spreadZ], [spreadX, -spreadZ], [-spreadX, spreadZ], [-spreadX, -spreadZ]];
  for (const [x, z] of pts) {
    const hip = new THREE.Group();
    hip.position.set(x, y + len, z);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, len, 8), m);
    l.position.y = -len / 2;
    hip.add(l);
    if (bk) bk.seg([0, 0, 0], [0, -len * 0.95, 0], r * 0.45, hip);
    g.add(hip);
    list.push(hip);
  }
}
function swingLegs(g, t, amp = 0.5, speed = 9) {
  (g.userData.legs || []).forEach((h, i) => { h.rotation.z = Math.sin(t * speed + (i % 3 === 0 ? 0 : Math.PI)) * amp; });
}

function quadruped(o) {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const bodyM = mat(o.color);
  const by = o.legLen + o.r * 0.9;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(o.r, o.len, 8, 16), bodyM);
  body.rotation.z = Math.PI / 2;
  body.position.y = by;
  g.add(body);
  if (o.belly) {
    const b = sph(o.r * 0.85, o.belly, 16);
    b.scale.set(1.6, 0.7, 0.9);
    b.position.set(0, o.legLen + o.r * 0.45, 0);
    g.add(b);
  }
  const head = new THREE.Group();
  const hx = o.len / 2 + o.r * 0.9;
  const hy = o.legLen + o.r * (1.4 + (o.neck || 0));
  head.position.set(hx, hy, 0);
  head.add(sph(o.headR, bodyM, 16));
  if (o.snout) {
    const sn = cyl(o.headR * 0.35, o.headR * 0.55, o.snout, o.snoutColor || o.color);
    sn.rotation.z = -Math.PI / 2;
    sn.position.set(o.headR * 0.7 + o.snout / 2 - 0.05, -o.headR * 0.2, 0);
    head.add(sn);
    head.add(at(sph(o.headR * 0.22, 0x222222, 8), o.headR * 0.7 + o.snout, -o.headR * 0.2, 0));
  }
  for (const s of [1, -1]) {
    head.add(at(sph(o.headR * 0.13, 0x111111, 8), o.headR * 0.65, o.headR * 0.25, s * o.headR * 0.5));
    const ear = o.ears === 'long'
      ? new THREE.Mesh(new THREE.CapsuleGeometry(o.headR * 0.18, o.headR * 1.6, 4, 8), bodyM)
      : o.ears === 'round' ? sph(o.headR * 0.3, bodyM, 10) : new THREE.Mesh(new THREE.ConeGeometry(o.headR * 0.3, o.headR * 0.7, 6), bodyM);
    ear.position.set(-o.headR * 0.1, o.headR * (o.ears === 'long' ? 1.3 : 0.85), s * o.headR * 0.45);
    if (o.ears === 'long') ear.rotation.x = s * 0.15;
    head.add(ear);
  }
  g.add(head);
  g.userData.head = head;
  if (o.tail) {
    const t = o.tail === 'puff' ? sph(o.r * 0.35, 0xffffff, 10) : new THREE.Mesh(new THREE.ConeGeometry(o.r * 0.3, o.r * 1.8, 8), bodyM);
    t.position.set(-o.len / 2 - o.r * 0.9, o.legLen + o.r * 1.1, 0);
    if (o.tail !== 'puff') t.rotation.z = 2.1;
    g.add(t);
    g.userData.tail = t;
  }
  const sx = -o.len / 2 - o.r * 0.7;
  bk.spine([[sx, by + o.r * 0.25, 0], [o.len / 2 + o.r * 0.3, by + o.r * 0.35, 0], [hx - o.headR * 0.6, hy - o.headR * 0.3, 0]], o.r * 0.12);
  bk.ball([hx + o.headR * 0.15, hy, 0], o.headR * 0.62);
  bk.ribs(-o.len * 0.25, o.len * 0.4, by + o.r * 0.25, 5, o.r * 0.9, o.r * 0.05);
  if (o.tail && o.tail !== 'puff') bk.seg([sx, by + o.r * 0.25, 0], [sx - o.r * 0.8, by - o.r * 0.25, 0], o.r * 0.07);
  legs(g, o.legColor || o.color, { len: o.legLen, r: o.r * 0.22, spreadX: o.len * 0.45, spreadZ: o.r * 0.5, bk });
  g.userData.anim = (t, k = 1) => {
    swingLegs(g, t, 0.45 * k);
    if (g.userData.tail && o.tail !== 'puff') g.userData.tail.rotation.x = Math.sin(t * 6) * 0.4;
  };
  return g;
}

function fishModel(color = 0x8fb3c9, belly = 0xeef3f0, spot = 0x5a6e7a) {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const bodyM = mat(color);
  const body = sph(0.3, bodyM, 16);
  body.scale.set(1.6, 0.75, 0.42);
  g.add(body);
  const bel = sph(0.27, belly, 14);
  bel.scale.set(1.4, 0.45, 0.38);
  bel.position.y = -0.09;
  g.add(bel);
  for (let i = 0; i < 6; i++) g.add(at(sph(0.025, spot, 6), -0.25 + i * 0.09, 0.08 + (i % 2) * 0.05, 0.12 * (i % 2 ? 1 : -1)));
  const tail = new THREE.Group();
  tail.position.x = -0.44;
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 4), bodyM);
  fin.rotation.z = -Math.PI / 2;
  fin.scale.z = 0.2;
  fin.position.x = -0.1;
  tail.add(fin);
  g.add(tail);
  const dors = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), bodyM);
  dors.scale.z = 0.2;
  dors.position.set(-0.02, 0.24, 0);
  dors.rotation.z = 0.4;
  g.add(dors);
  for (const s of [1, -1]) {
    g.add(at(sph(0.04, 0xffffff, 8), 0.33, 0.06, s * 0.09));
    g.add(at(sph(0.022, 0x111111, 6), 0.355, 0.06, s * 0.11));
  }
  bk.spine([[-0.42, 0, 0], [0.28, 0.02, 0]], 0.025);
  bk.ball([0.37, 0.02, 0], 0.08);
  for (let i = 0; i < 7; i++) {
    const x = -0.3 + i * 0.085;
    bk.seg([x, 0, 0], [x - 0.04, 0.15, 0], 0.008);
    bk.seg([x, 0, 0], [x - 0.04, -0.14, 0], 0.008);
  }
  bk.seg([-0.44, 0, 0], [-0.62, 0.12, 0], 0.008, tail);
  g.userData.anim = (t, k = 1) => { tail.rotation.y = Math.sin(t * 8) * 0.45 * k; };
  return g;
}

function dolphinModel() {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const grey = mat(0x7d93a8);
  const body = sph(0.3, grey, 18);
  body.scale.set(2.4, 0.8, 0.78);
  g.add(body);
  const bel = sph(0.27, 0xdfe6ec, 14);
  bel.scale.set(2.1, 0.55, 0.6);
  bel.position.y = -0.1;
  g.add(bel);
  const beak = cyl(0.05, 0.09, 0.22, grey);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.78, -0.04, 0);
  g.add(beak);
  const dors = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 4), grey);
  dors.scale.z = 0.25;
  dors.rotation.z = 0.5;
  dors.position.set(-0.05, 0.28, 0);
  g.add(dors);
  for (const s of [1, -1]) {
    const fl = sph(0.1, grey, 8);
    fl.scale.set(1.3, 0.2, 0.6);
    fl.position.set(0.3, -0.16, s * 0.24);
    fl.rotation.x = s * 0.5;
    g.add(fl);
    g.add(at(sph(0.025, 0x111111, 6), 0.58, 0.04, s * 0.13));
    bk.seg([0.36, -0.08, s * 0.08], [0.28, -0.17, s * 0.3], 0.012);
  }
  const tail = new THREE.Group();
  tail.position.x = -0.68;
  const fl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.42), grey);
  fl.position.x = -0.08;
  tail.add(fl);
  g.add(tail);
  bk.spine([[-0.72, 0, 0], [0.4, 0.04, 0]], 0.025);
  bk.ball([0.55, 0.02, 0], 0.1);
  bk.seg([0.6, -0.02, 0], [0.86, -0.04, 0], 0.02);
  bk.ribs(-0.1, 0.3, 0.03, 4, 0.18, 0.008);
  g.userData.anim = (t, k = 1) => { tail.rotation.z = Math.sin(t * 4) * 0.35 * k; };
  return g;
}

function frogModel() {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const green = mat(0x4caf50);
  const body = sph(0.3, green, 16);
  body.scale.set(1.2, 0.65, 1);
  body.position.y = 0.2;
  g.add(body);
  const belly = sph(0.26, 0xd6e8a0, 14);
  belly.scale.set(1.15, 0.5, 0.9);
  belly.position.set(0.04, 0.15, 0);
  g.add(belly);
  for (const s of [1, -1]) {
    g.add(at(sph(0.09, green), 0.18, 0.38, s * 0.14));
    g.add(at(sph(0.05, 0x111111, 8), 0.24, 0.4, s * 0.15));
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.25, 4, 8), green);
    leg.position.set(-0.22, 0.08, s * 0.26);
    leg.rotation.z = 1.2;
    g.add(leg);
    const fr = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.14, 4, 6), green);
    fr.position.set(0.2, 0.07, s * 0.18);
    fr.rotation.x = s * 0.3;
    g.add(fr);
    bk.seg([-0.16, 0.2, s * 0.06], [-0.32, 0.08, s * 0.26], 0.014);
    bk.seg([-0.32, 0.08, s * 0.26], [-0.1, 0.04, s * 0.32], 0.012);
    bk.seg([0.15, 0.17, s * 0.06], [0.22, 0.03, s * 0.2], 0.012);
  }
  bk.spine([[-0.18, 0.2, 0], [0.12, 0.23, 0]], 0.022);
  bk.ball([0.2, 0.25, 0], 0.09);
  g.userData.anim = (t, k = 1) => { belly.scale.y = 0.5 + Math.sin(t * 5) * 0.06 * k; };
  return g;
}

// Гущер; с жълти петна и тъмен цвят — дъждовник.
function lizardModel(color = 0x7aa34a, spots = null, moist = false) {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const m = mat(color, moist ? { roughness: 0.25 } : { flat: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.42, 6, 12), m);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.13;
  body.scale.z = 1.15;
  g.add(body);
  const head = sph(0.09, m, 12);
  head.scale.set(1.5, 0.75, 1);
  head.position.set(0.36, 0.14, 0);
  g.add(head);
  for (const s of [1, -1]) g.add(at(sph(0.02, 0x111111, 6), 0.4, 0.18, s * 0.065));
  const tail = new THREE.Group();
  tail.position.set(-0.3, 0.12, 0);
  const tc = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 8), m);
  tc.rotation.z = Math.PI / 2;
  tc.position.x = -0.3;
  tail.add(tc);
  g.add(tail);
  const legList = g.userData.legs = [];
  for (const [x, s] of [[0.17, 1], [0.17, -1], [-0.17, 1], [-0.17, -1]]) {
    const hip = new THREE.Group();
    hip.position.set(x, 0.1, s * 0.09);
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.12, 4, 6), m);
    l.rotation.x = s * 1.0;
    l.position.set(0, -0.04, s * 0.06);
    hip.add(l);
    bk.seg([0, 0, 0], [0, -0.08, s * 0.11], 0.01, hip);
    g.add(hip);
    legList.push(hip);
  }
  if (spots) for (let i = 0; i < 7; i++) g.add(at(sph(0.03, spots, 6), -0.22 + i * 0.08, 0.2 + (i % 2) * 0.01, (i % 2 ? 1 : -1) * 0.05));
  bk.spine([[-0.3, 0.13, 0], [0.24, 0.14, 0]], 0.018);
  bk.spine([[0, 0, 0], [-0.55, 0, 0]], 0.014, tail);
  bk.ball([0.38, 0.14, 0], 0.06);
  bk.ribs(-0.15, 0.15, 0.14, 4, 0.08, 0.006);
  g.userData.anim = (t, k = 1) => {
    tail.rotation.y = Math.sin(t * 6) * 0.3 * k;
    legList.forEach((h, i) => { h.rotation.y = Math.sin(t * 9 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 * k; });
  };
  return g;
}

function snakeModel() {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const m = mat(0x5d6b3a, { flat: true });
  const belly = mat(0xe3d36a);
  const N = 16;
  const segs = [];
  for (let i = 0; i < N; i++) {
    const r = i === 0 ? 0.075 : 0.068 - i * 0.0028;
    const s = new THREE.Group();
    const b = sph(r, m, 10);
    b.scale.set(1.25, 0.8, 1);
    s.add(b);
    if (i === 0) {
      for (const k of [1, -1]) {
        s.add(at(sph(0.022, belly, 6), 0.0, 0.03, k * 0.05));
        s.add(at(sph(0.013, 0x111111, 6), 0.06, 0.04, k * 0.04));
      }
      bk.ball([0.02, 0.01, 0], 0.045, s);
    } else {
      bk.ball([0, 0.01, 0], r * 0.28, s);
      if (i < N - 3) for (const k of [1, -1]) bk.seg([0, 0.01, 0], [0, -0.02, k * r * 0.75], 0.006, s);
    }
    g.add(s);
    segs.push(s);
  }
  g.userData.anim = (t, k = 1) => {
    segs.forEach((s, i) => {
      s.position.set(-i * 0.105, 0.065, Math.sin(t * 4 - i * 0.55) * 0.09 * (0.3 + i / N) * k);
    });
  };
  g.userData.anim(0);
  return g;
}

function turtleModel() {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const skin = mat(0x8a9a5b);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x6b5a2a, { flat: true }));
  shell.scale.set(1.25, 0.85, 1.05);
  shell.position.y = 0.1;
  g.add(shell);
  const under = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.06, 14), mat(0xc9b47a));
  under.scale.set(1.05, 1, 0.9);
  under.position.y = 0.1;
  g.add(under);
  const head = new THREE.Group();
  head.position.set(0.42, 0.14, 0);
  head.add(sph(0.08, skin));
  for (const s of [1, -1]) head.add(at(sph(0.015, 0x111111, 6), 0.06, 0.03, s * 0.05));
  g.add(head);
  const legList = g.userData.legs = [];
  for (const [x, s] of [[0.22, 1], [0.22, -1], [-0.22, 1], [-0.22, -1]]) {
    const hip = new THREE.Group();
    hip.position.set(x, 0.1, s * 0.24);
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.08, 4, 6), skin);
    l.position.set(0, -0.04, s * 0.03);
    hip.add(l);
    bk.seg([0, 0.02, -s * 0.06], [0, -0.07, s * 0.03], 0.012, hip);
    g.add(hip);
    legList.push(hip);
  }
  bk.spine([[-0.3, 0.18, 0], [0.3, 0.18, 0]], 0.02);
  bk.seg([0.3, 0.17, 0], [0.4, 0.15, 0], 0.015);
  bk.ball([0.44, 0.15, 0], 0.05);
  g.userData.anim = (t, k = 1) => {
    head.position.x = 0.42 + Math.sin(t * 1.5) * 0.04 * k;
    legList.forEach((h, i) => { h.rotation.y = Math.sin(t * 3 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.4 * k; });
  };
  return g;
}

function sparrowModel() {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const brown = mat(0x8a5a33);
  const body = sph(0.15, brown, 14);
  body.scale.set(1.35, 1, 1);
  body.position.y = 0.3;
  g.add(body);
  const bel = sph(0.13, 0xd9c7a8, 12);
  bel.scale.set(1.2, 0.85, 0.9);
  bel.position.set(0.03, 0.26, 0);
  g.add(bel);
  g.add(at(sph(0.1, brown), 0.17, 0.43, 0));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), mat(0x4a3b2a));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.29, 0.42, 0);
  g.add(beak);
  for (const s of [1, -1]) g.add(at(sph(0.018, 0x111111, 6), 0.23, 0.46, s * 0.065));
  const tail = box(0.18, 0.02, 0.1, 0x6b4426);
  tail.position.set(-0.24, 0.34, 0);
  tail.rotation.z = 0.35;
  g.add(tail);
  const wings = [];
  for (const s of [1, -1]) {
    const p = new THREE.Group();
    p.position.set(-0.02, 0.36, s * 0.11);
    const w = sph(0.13, 0x6b4426, 10);
    w.scale.set(1.2, 0.18, 0.9);
    w.position.set(-0.03, 0, s * 0.1);
    p.add(w);
    bk.seg([0.03, 0, 0], [-0.02, 0, s * 0.18], 0.01, p);
    bk.seg([-0.02, 0, s * 0.18], [-0.12, 0, s * 0.2], 0.008, p);
    p.userData.s = s;
    g.add(p);
    wings.push(p);
  }
  legs(g, 0x6d4c41, { n: 2, len: 0.16, r: 0.012, spreadZ: 0.05, bk });
  bk.spine([[-0.2, 0.32, 0], [0.12, 0.36, 0], [0.15, 0.4, 0]], 0.014);
  bk.ball([0.18, 0.43, 0], 0.055);
  bk.ribs(-0.06, 0.08, 0.33, 3, 0.07, 0.005);
  g.userData.flap = 0;
  g.userData.anim = (t) => {
    const f = g.userData.flap;
    wings.forEach((w) => { w.rotation.x = -w.userData.s * (f ? 0.2 + Math.sin(t * 22) * 0.75 : 0); });
    tail.rotation.z = 0.35 + Math.sin(t * 5) * 0.08;
  };
  return g;
}

function storkModel() {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const white = mat(0xf7f7f2);
  const body = sph(0.32, white, 16);
  body.scale.set(1.5, 0.9, 0.85);
  body.position.y = 1.0;
  g.add(body);
  const wing = sph(0.3, 0x222222);
  wing.scale.set(1.2, 0.45, 0.9);
  wing.position.set(-0.22, 1.05, 0);
  g.add(wing);
  const neck = cyl(0.06, 0.08, 0.6, white, 8);
  neck.position.set(0.42, 1.32, 0);
  neck.rotation.z = -0.35;
  g.add(neck);
  const head = new THREE.Group();
  head.position.set(0.55, 1.62, 0);
  head.add(sph(0.1, white));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.42, 8), mat(0xe53935));
  beak.rotation.z = -Math.PI / 2 - 0.25;
  beak.position.set(0.26, -0.05, 0);
  head.add(beak);
  for (const s of [1, -1]) head.add(at(sph(0.02, 0x111111, 6), 0.06, 0.03, s * 0.08));
  bk.ball([0, 0, 0], 0.07, head);
  g.add(head);
  legs(g, 0xe53935, { n: 2, len: 0.75, r: 0.025, spreadZ: 0.1, bk });
  bk.spine([[-0.4, 1.02, 0], [0.32, 1.08, 0], [0.5, 1.5, 0], [0.55, 1.6, 0]], 0.03);
  bk.ribs(-0.15, 0.2, 1.04, 4, 0.2, 0.01);
  g.userData.anim = (t, k = 1) => { head.position.y = 1.62 + Math.sin(t * 2) * 0.03 * k; swingLegs(g, t, 0.15 * k, 3); };
  return g;
}

function penguinModel() {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const black = mat(0x22262e);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.32, 6, 14), black);
  body.position.y = 0.42;
  g.add(body);
  const bel = sph(0.18, 0xf4f4f0, 14);
  bel.scale.set(0.7, 1.45, 0.95);
  bel.position.set(0.07, 0.4, 0);
  g.add(bel);
  g.add(at(sph(0.15, black), 0, 0.8, 0));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), mat(0xf29d1e));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.18, 0.78, 0);
  g.add(beak);
  for (const s of [1, -1]) {
    g.add(at(sph(0.02, 0xffffff, 6), 0.12, 0.84, s * 0.07));
    const fl = sph(0.1, black, 8);
    fl.scale.set(0.5, 1.6, 0.25);
    fl.position.set(-0.02, 0.48, s * 0.21);
    fl.rotation.x = s * 0.25;
    g.add(fl);
    const ft = box(0.12, 0.03, 0.07, 0xf29d1e);
    ft.position.set(0.05, 0.015, s * 0.08);
    g.add(ft);
    bk.seg([0, 0.62, s * 0.08], [-0.02, 0.36, s * 0.24], 0.012);
    bk.seg([0, 0.24, s * 0.07], [0.04, 0.03, s * 0.08], 0.014);
  }
  bk.spine([[-0.05, 0.2, 0], [-0.05, 0.68, 0]], 0.022);
  bk.ball([0.02, 0.8, 0], 0.08);
  bk.ribs(0.4, 0.6, 0, 0, 0, 0);
  g.userData.anim = (t, k = 1) => { g.rotation.x = Math.sin(t * 4) * 0.08 * k; };
  return g;
}

function batModel() {
  const g = new THREE.Group();
  const bk = bonesKit(g);
  const fur = mat(0x5c4033);
  const memb = mat(0x3e2b22, { side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.16, 4, 10), fur);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.3;
  g.add(body);
  g.add(at(sph(0.075, fur), 0.16, 0.33, 0));
  for (const s of [1, -1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), fur);
    ear.position.set(0.15, 0.41, s * 0.035);
    g.add(ear);
    g.add(at(sph(0.012, 0x111111, 6), 0.215, 0.35, s * 0.035));
  }
  const shape = new THREE.Shape();
  shape.moveTo(0.08, 0);
  shape.lineTo(0.04, 0.4);
  shape.lineTo(-0.02, 0.3);
  shape.lineTo(-0.06, 0.38);
  shape.lineTo(-0.1, 0.24);
  shape.lineTo(-0.16, 0.26);
  shape.lineTo(-0.12, 0);
  shape.closePath();
  const wgeo = new THREE.ShapeGeometry(shape);
  const wings = [];
  for (const s of [1, -1]) {
    const p = new THREE.Group();
    p.position.set(0, 0.31, s * 0.05);
    const w = new THREE.Mesh(wgeo, memb);
    w.rotation.x = s * -Math.PI / 2;
    p.add(w);
    // пръстите на крилото — кости вътре в кожената ципа
    bk.seg([0.04, 0, 0], [0.04, 0, s * 0.4], 0.008, p);
    bk.seg([0.03, 0, s * 0.12], [-0.06, 0, s * 0.38], 0.006, p);
    bk.seg([0.02, 0, s * 0.1], [-0.15, 0, s * 0.26], 0.006, p);
    p.userData.s = s;
    g.add(p);
    wings.push(p);
  }
  bk.spine([[-0.15, 0.3, 0], [0.1, 0.31, 0]], 0.012);
  bk.ball([0.17, 0.33, 0], 0.045);
  bk.ribs(-0.05, 0.05, 0.31, 3, 0.05, 0.004);
  g.userData.anim = (t, k = 1) => { wings.forEach((w) => { w.rotation.x = w.userData.s * Math.sin(t * 12) * 0.6 * k; }); };
  return g;
}

function butterflyModel(c1 = 0xff8f00, c2 = 0x1b1b1b) {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const dark = mat(0x2a2a2a);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.2, 4, 8), dark);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.2;
  g.add(body);
  for (const s of [1, -1]) {
    const ant = cyl(0.004, 0.004, 0.14, dark, 4);
    ant.position.set(0.17, 0.25, s * 0.03);
    ant.rotation.set(s * 0.4, 0, -0.9);
    g.add(ant);
  }
  const wm = mat(c1, { side: THREE.DoubleSide });
  const wm2 = mat(c2, { side: THREE.DoubleSide });
  const wings = [];
  for (const s of [1, -1]) {
    const p = new THREE.Group();
    p.position.set(0, 0.21, 0);
    const fw = new THREE.Mesh(new THREE.CircleGeometry(0.14, 14), wm);
    fw.rotation.x = -Math.PI / 2;
    fw.scale.set(0.9, 1.2, 1);
    fw.position.set(0.05, 0, s * 0.15);
    const edge = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), wm2);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(0.09, 0.002, s * 0.24);
    const hw = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), wm);
    hw.rotation.x = -Math.PI / 2;
    hw.position.set(-0.07, -0.001, s * 0.11);
    p.add(fw, edge, hw);
    p.userData.s = s;
    g.add(p);
    wings.push(p);
  }
  legs(g, 0x2a2a2a, { n: 2, len: 0.08, r: 0.004, spreadZ: 0.02, y: 0.1 });
  g.userData.anim = (t, k = 1) => { wings.forEach((w) => { w.rotation.x = -w.userData.s * (0.3 + Math.sin(t * 16) * 0.7 * k); }); };
  return g;
}

function ladybugModel() {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd62828));
  dome.scale.set(1.2, 0.8, 1);
  dome.position.y = 0.04;
  g.add(dome);
  for (const [x, z] of [[0.04, 0.05], [0.04, -0.05], [-0.06, 0.06], [-0.06, -0.06], [-0.01, 0]]) g.add(at(sph(0.022, 0x111111, 6), x, 0.12 - Math.abs(x) * 0.4, z));
  g.add(at(sph(0.05, 0x111111, 8), 0.14, 0.05, 0));
  const legList = g.userData.legs = [];
  const lm = mat(0x111111);
  for (const x of [0.07, 0, -0.07]) for (const s of [1, -1]) {
    const hip = new THREE.Group();
    hip.position.set(x, 0.04, s * 0.09);
    const l = cyl(0.006, 0.006, 0.08, lm, 4);
    l.rotation.x = s * 0.9;
    l.position.set(0, -0.02, s * 0.03);
    hip.add(l);
    g.add(hip);
    legList.push(hip);
  }
  g.scale.setScalar(1.4);
  g.userData.anim = (t, k = 1) => { legList.forEach((h, i) => { h.rotation.y = Math.sin(t * 14 + i * 1.7) * 0.4 * k; }); };
  return g;
}

function spiderModel() {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const m = mat(0x3b2a20);
  const abd = sph(0.12, m, 12);
  abd.scale.set(1.2, 0.9, 1);
  abd.position.set(-0.12, 0.14, 0);
  g.add(abd);
  g.add(at(sph(0.08, m), 0.04, 0.12, 0));
  for (const s of [1, -1]) g.add(at(sph(0.015, 0x111111, 6), 0.11, 0.15, s * 0.03));
  const legList = g.userData.legs = [];
  for (let i = 0; i < 4; i++) for (const s of [1, -1]) {
    const hip = new THREE.Group();
    hip.position.set(0.08 - i * 0.05, 0.13, s * 0.05);
    hip.rotation.y = s * (-0.7 + i * 0.45) + (s < 0 ? Math.PI : 0);
    const up = segMesh([0, 0, 0], [0.16, 0.06, 0], 0.009, m);
    const dn = segMesh([0.16, 0.06, 0], [0.26, -0.13, 0], 0.008, m);
    hip.add(up, dn);
    hip.rotation.order = 'YXZ';
    g.add(hip);
    legList.push(hip);
  }
  g.userData.anim = (t, k = 1) => { legList.forEach((h, i) => { h.rotation.z = Math.sin(t * 10 + i * 1.3) * 0.18 * k; }); };
  return g;
}

function snailModel() {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const skin = mat(0xb8a58a, { roughness: 0.3 });
  const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 4, 10), skin);
  foot.rotation.z = Math.PI / 2;
  foot.scale.set(1, 1, 1.2);
  foot.position.y = 0.045;
  g.add(foot);
  const shell = new THREE.Group();
  shell.position.set(-0.03, 0.15, 0);
  const sh = sph(0.13, mat(0x9c6b3a, { flat: true }), 14);
  sh.scale.set(1, 1, 0.75);
  const sp = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.03, 8, 20), mat(0xc8955a));
  sp.position.z = 0.08;
  const sp2 = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.03, 8, 20), mat(0xc8955a));
  sp2.position.z = -0.08;
  shell.add(sh, sp, sp2);
  g.add(shell);
  const stalks = [];
  for (const s of [1, -1]) {
    const p = new THREE.Group();
    p.position.set(0.18, 0.06, s * 0.025);
    const st = cyl(0.008, 0.01, 0.12, skin, 5);
    st.position.y = 0.06;
    p.add(st, at(sph(0.016, 0x3a2a1a, 6), 0, 0.12, 0));
    p.rotation.z = -0.3;
    g.add(p);
    stalks.push(p);
  }
  g.userData.anim = (t, k = 1) => {
    foot.scale.y = 1 + Math.sin(t * 2) * 0.08 * k;
    stalks.forEach((p, i) => { p.rotation.x = Math.sin(t * 1.7 + i) * 0.25 * k; });
  };
  g.scale.setScalar(1.3);
  return g;
}

function wormModel() {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const m = mat(0xd98e8e, { roughness: 0.35 });
  const band = mat(0xe8b0a8);
  const segs = [];
  for (let i = 0; i < 14; i++) {
    const s = sph(0.042 - Math.abs(i - 4) * 0.0012, i === 3 || i === 4 ? band : m, 10);
    g.add(s);
    segs.push(s);
  }
  g.userData.anim = (t, k = 1) => {
    let x = 0;
    segs.forEach((s, i) => {
      const st = 1 + Math.sin(t * 3 - i * 0.5) * 0.22 * k;
      s.position.set(x, 0.04, Math.sin(i * 0.5 + t * 0.6) * 0.03);
      s.scale.set(st, 1 / Math.sqrt(st), 1 / Math.sqrt(st));
      x -= 0.06 * st;
    });
  };
  g.userData.anim(0);
  g.scale.setScalar(1.2);
  return g;
}

function jellyModel() {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const m = new THREE.MeshStandardMaterial({ color: 0xf5a3c7, transparent: true, opacity: 0.7, roughness: 0.3 });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), m);
  bell.position.y = 0.45;
  g.add(bell);
  const tents = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const t = cyl(0.01, 0.006, 0.35, m, 4);
    t.position.set(Math.cos(a) * 0.12, 0.27, Math.sin(a) * 0.12);
    g.add(t);
    tents.push(t);
  }
  g.userData.anim = (t, k = 1) => {
    const p = 1 + Math.sin(t * 3) * 0.12 * k;
    bell.scale.set(p, 2 - p, p);
    tents.forEach((x, i) => { x.rotation.z = Math.sin(t * 3 + i) * 0.2; });
  };
  return g;
}

// ---------- растения ----------
function lilyModel() {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const pad = new THREE.Mesh(new THREE.CircleGeometry(0.32, 22, 0.3, Math.PI * 2 - 0.3), mat(0x3f9142, { side: THREE.DoubleSide }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.05;
  g.add(pad);
  const pm = mat(0xfbe3ef);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 5), pm);
    p.position.set(Math.cos(a) * 0.06, 0.12, Math.sin(a) * 0.06);
    p.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
    g.add(p);
  }
  g.add(at(sph(0.04, 0xffd54f, 8), 0, 0.12, 0));
  g.userData.anim = (t) => { g.children[0].rotation.z = Math.sin(t * 0.5) * 0.2; };
  return g;
}
function seaweedModel() {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const m = mat(0x2e8b57);
  const strands = [];
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Group();
    p.position.set((i - 1.5) * 0.08, 0, (i % 2) * 0.06);
    const h = 0.6 + (i % 3) * 0.18;
    const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, h, 4, 6), m);
    s.scale.z = 0.4;
    s.position.y = h / 2 + 0.03;
    p.add(s);
    g.add(p);
    strands.push(p);
  }
  g.userData.anim = (t) => { strands.forEach((p, i) => { p.rotation.z = Math.sin(t * 1.4 + i) * 0.22; p.rotation.x = Math.cos(t * 1.1 + i) * 0.12; }); };
  return g;
}
function treeModel(s = 1) {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const trunk = cyl(0.22 * s, 0.32 * s, 1.6 * s, 0x7a5230, 8);
  trunk.position.y = 0.8 * s;
  g.add(trunk);
  const leafM = mat(0x3f8f3a, { flat: true });
  const crown = new THREE.Group();
  for (const [x, y, z, r] of [[0, 2.3, 0, 1.2], [0.7, 1.9, 0.3, 0.8], [-0.6, 2.0, -0.3, 0.85], [0.1, 2.9, 0.1, 0.8]]) crown.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), leafM), x * s, y * s, z * s));
  g.add(crown);
  g.userData.anim = (t) => { crown.rotation.z = Math.sin(t * 0.8) * 0.02; };
  return g;
}
function cactusModel() {
  const g = new THREE.Group();
  g.userData.boneList = [];
  const m = mat(0x4f9a4a, { flat: true });
  const main = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.6, 4, 8), m);
  main.position.y = 0.42;
  g.add(main);
  for (const [s, y, h] of [[1, 0.42, 0.22], [-1, 0.55, 0.18]]) {
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, h, 4, 6), m);
    a.position.set(0, y + h / 2 + 0.04, s * 0.2);
    g.add(a);
    const c = cyl(0.05, 0.05, 0.12, m, 6);
    c.rotation.x = Math.PI / 2;
    c.position.set(0, y, s * 0.13);
    g.add(c);
  }
  g.add(at(sph(0.05, 0xff6f91, 8), 0, 0.86, 0));
  const pot = cyl(0.17, 0.13, 0.14, 0xd6a77a, 10);
  pot.position.y = 0.07;
  g.add(pot);
  g.userData.anim = (t) => { g.children[0].scale.y = 1 + Math.sin(t) * 0.01; };
  return g;
}
function flowerModel(c = 0xff5c8a) {
  const g = new THREE.Group();
  const stem = cyl(0.012, 0.015, 0.4, 0x3f8f3a, 5);
  stem.position.y = 0.2;
  g.add(stem);
  const pm = mat(c);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = sph(0.04, pm, 6);
    p.scale.set(1, 0.4, 1);
    p.position.set(Math.cos(a) * 0.05, 0.41, Math.sin(a) * 0.05);
    g.add(p);
  }
  g.add(at(sph(0.03, 0xffd54f, 6), 0, 0.42, 0));
  return g;
}

// ---------- животните и растенията ----------
// group: insect, fish, amph, rept, bird, mammal; other — безгръбначни, които не са насекоми.
const GROUPS = {
  insect: { name: 'Насекоми', color: 0xef8f00, css: '#ef8f00', crit: 'Насекомите имат 6 крака и 2 пипала, а тялото им е от 3 части.' },
  fish: { name: 'Риби', color: 0x1e88e5, css: '#1e88e5', crit: 'Рибите живеят във вода, дишат с хриле, плуват с перки и имат люспи.' },
  amph: { name: 'Земноводни', color: 0x2e9e5b, css: '#2e9e5b', crit: 'Земноводните имат гола, влажна кожа без люспи, а малките им се развиват във вода.' },
  rept: { name: 'Влечуги', color: 0x8d7a2e, css: '#8d7a2e', crit: 'Влечугите имат суха кожа с люспи или щитове и снасят яйцата си на сушата.' },
  bird: { name: 'Птици', color: 0x7e57c2, css: '#7e57c2', crit: 'Птиците имат пера, клюн и крила и снасят яйца.' },
  mammal: { name: 'Бозайници', color: 0xd84343, css: '#d84343', crit: 'Бозайниците имат козина и хранят малките си с мляко.' },
  other: { name: 'Не е от тези групи', color: 0x78909c, css: '#78909c', crit: 'Някои безгръбначни, като паяка, охлюва и червея, не са насекоми.' },
};
const GROUP_IDS = ['insect', 'fish', 'amph', 'rept', 'bird', 'mammal'];

const A = {
  butterfly: { label: 'Пеперуда', icon: '🦋', group: 'insect', build: () => butterflyModel(),
    note: '<b>Пеперуда — насекомо.</b> Има 6 крака, 2 пипала и 4 крила. Няма гръбнак: тялото ѝ е покрито само с тънка твърда обвивка.' },
  ladybug: { label: 'Калинка', icon: '🐞', group: 'insect', build: ladybugModel,
    note: '<b>Калинка — насекомо.</b> Има 6 крака. Под твърдите червени крилца са скрити тънки крила, с които лети.',
    clue: ['Има 6 крака и 2 пипала.', 'Тялото ѝ е от 3 части.', 'Има крила и лети.'] },
  trout: { label: 'Пъстърва', icon: '🐟', group: 'fish', build: () => fishModel(),
    note: '<b>Пъстърва — риба.</b> Живее във вода, диша с хриле и плува с перки. Тялото ѝ е покрито с люспи.' },
  carp: { label: 'Шаран', icon: '🐟', group: 'fish', build: () => fishModel(0xc9a24a, 0xf3e5b5, 0x8a6a2a),
    clue: ['Живее в езера и реки.', 'Диша с хриле, а не с бели дробове.', 'Плува с перки, тялото е покрито с люспи.'] },
  dolphin: { label: 'Делфин', icon: '🐬', group: 'mammal', build: dolphinModel, tricky: true,
    clue: ['Живее в морето и плува с перки.', 'Изплува, за да диша въздух с бели дробове.', 'Кожата е гладка, без люспи.', 'Малкото суче мляко от майка си.'],
    ok: 'Да! Делфинът прилича на риба, но е бозайник: диша въздух и кърми малкото си с мляко.' },
  frog: { label: 'Жаба', icon: '🐸', group: 'amph', build: frogModel,
    note: '<b>Жаба — земноводно.</b> Кожата ѝ е гола и влажна, без люспи. Живее и на сушата, и във водата, а яйцата си снася във водата.',
    clue: ['Кожата е гола и влажна, без люспи.', 'Снася яйцата си във водата.', 'От яйцата излизат попови лъжички, които живеят във водата.'] },
  salamander: { label: 'Дъждовник', icon: '🦎', group: 'amph', build: () => lizardModel(0x22252a, 0xf2c200, true), tricky: true,
    clue: ['Прилича на гущер.', 'Кожата му е гола и влажна, без люспи.', 'Малките му се развиват във вода.'],
    ok: 'Да! Дъждовникът прилича на гущер, но кожата му е гола и влажна. Той е земноводно.' },
  lizard: { label: 'Гущер', icon: '🦎', group: 'rept', build: () => lizardModel(),
    note: '<b>Гущер — влечуго.</b> Кожата му е суха и покрита с люспи. Снася яйцата си на сушата.',
    clue: ['Кожата е суха и покрита с люспи.', 'Снася яйца на сушата.', 'Пълзи с 4 къси крака.'] },
  snake: { label: 'Смок', icon: '🐍', group: 'rept', build: snakeModel,
    note: '<b>Смок — влечуго.</b> Змиите нямат крака, но имат много дълъг гръбнак. Кожата им е покрита с люспи. Смокът е безобиден.' },
  turtle: { label: 'Костенурка', icon: '🐢', group: 'rept', build: turtleModel, tricky: true,
    clue: ['Има твърда черупка от рогови щитове.', 'Главата и краката са покрити с люспи.', 'Снася яйцата си на сушата.'],
    ok: 'Да! Костенурката е влечуго: има люспи и щитове и снася яйцата си на сушата.' },
  sparrow: { label: 'Врабче', icon: '🐦', group: 'bird', build: sparrowModel,
    note: '<b>Врабче — птица.</b> Тялото му е покрито с пера. Има клюн и крила и снася яйца в гнездо.' },
  stork: { label: 'Щъркел', icon: '🪶', group: 'bird', build: storkModel,
    clue: ['Тялото е покрито с пера.', 'Има дълъг клюн и крила.', 'Снася яйца в голямо гнездо.'] },
  penguin: { label: 'Пингвин', icon: '🐧', group: 'bird', build: penguinModel, tricky: true,
    clue: ['Не може да лети, но плува отлично.', 'Тялото е покрито с гъсти пера.', 'Има клюн и снася яйца.'],
    ok: 'Да! Пингвинът не лети, но има пера и клюн и снася яйца — той е птица.' },
  bat: { label: 'Прилеп', icon: '🦇', group: 'mammal', build: batModel, tricky: true,
    clue: ['Лети с крила от тънка кожа, а не от пера.', 'Тялото е покрито с козина.', 'Малките сучат мляко от майка си.'],
    ok: 'Да! Прилепът лети, но е бозайник: има козина и кърми малките си с мляко.' },
  rabbit: { label: 'Заек', icon: '🐰', group: 'mammal', build: () => quadruped({ color: 0xa1887f, belly: 0xd7ccc8, r: 0.18, len: 0.28, legLen: 0.12, headR: 0.14, ears: 'long', tail: 'puff' }),
    note: '<b>Заек — бозайник.</b> Тялото му е покрито с козина. Малките сучат мляко от майка си.',
    clue: ['Тялото е покрито с козина.', 'Малките сучат мляко от майка си.', 'Има 4 крака.'] },
  dog: { label: 'Куче', icon: '🐕', group: 'mammal', build: () => quadruped({ color: 0xc68a4a, belly: 0xf0d9b5, r: 0.2, len: 0.5, legLen: 0.32, headR: 0.16, ears: 'round', snout: 0.16, snoutColor: 0xd9a46a, tail: 'thin' }),
    note: '<b>Куче — бозайник.</b> Има козина, а кученцата сучат мляко от майка си.' },
  spider: { label: 'Паяк', icon: '🕷', group: 'other', build: spiderModel, tricky: true,
    note: '<b>Паяк — безгръбначно.</b> Но <b>не е</b> насекомо: има 8 крака, няма пипала и крила, а тялото му е от 2 части.',
    clue: ['Има 8 крака.', 'Няма пипала и крила.', 'Тялото е от 2 части.'],
    ok: 'Да! Паякът не е насекомо: има 8 крака, а насекомите имат 6.' },
  snail: { label: 'Охлюв', icon: '🐌', group: 'other', build: snailModel,
    note: '<b>Охлюв — безгръбначно.</b> Тялото му е меко, без нито една кост. Пази се в черупка, която носи на гърба си.' },
  worm: { label: 'Дъждовен червей', icon: '🪱', group: 'other', build: wormModel,
    note: '<b>Дъждовен червей — безгръбначно.</b> Тялото му е меко и дълго, без кости и без крака. Пълзи, като се свива и разтяга.' },
  jelly: { label: 'Медуза', icon: '🪼', build: jellyModel, home: 'water', why: 'Медузата живее в морето.' },
  lily: { label: 'Водна лилия', icon: '🪷', build: lilyModel, home: 'water', plant: true, why: 'Водната лилия е растение. Листата ѝ плават по водата, а корените са в дъното.' },
  seaweed: { label: 'Водорасли', icon: '🌿', build: seaweedModel, home: 'water', plant: true, why: 'Водораслите са растения, които живеят във водата.' },
  oak: { label: 'Дъб', icon: '🌳', build: () => treeModel(0.42), home: 'land', plant: true, why: 'Дъбът е растение, което расте на сушата.' },
  cactus: { label: 'Кактус', icon: '🌵', build: cactusModel, home: 'land', plant: true, why: 'Кактусът е растение от сухи места на сушата. Пази вода в стъблото си.' },
};
A.carp.home = 'water'; A.carp.why = 'Шаранът е риба и живее в сладка вода.';
A.rabbit.home = 'land'; A.rabbit.why = 'Заекът живее на сушата — в поля и гори.';
A.butterfly.home = 'land'; A.butterfly.why = 'Пеперудата живее на сушата и лети от цвят на цвят.';
A.dolphin.home = 'water'; A.dolphin.why = 'Делфинът живее в морето, макар че диша въздух.';
for (const [id, a] of Object.entries(A)) a.id = id;
const isVert = (a) => ['fish', 'amph', 'rept', 'bird', 'mammal'].includes(a.group);

// Мащабира модела така, че най-големият му размер да е size.
function fit(g, size) {
  const b = new THREE.Box3().setFromObject(g);
  const s = b.getSize(new V3());
  const k = size / Math.max(s.x, s.y * 1.2, s.z, 0.01);
  g.scale.multiplyScalar(k);
  return g;
}

// „Рентген“: тялото става полупрозрачно, костите светят.
function xray(g, on) {
  g.traverse((o) => {
    if (!o.isMesh || o.userData.bone || o.userData.isHitBox) return;
    const m = o.material;
    if (!m || m.visible === false) return;
    if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.transparent ? m.opacity : 1;
    m.transparent = on || m.userData.baseOpacity < 1;
    m.opacity = on ? 0.2 : m.userData.baseOpacity;
    m.depthWrite = !on;
    m.needsUpdate = true;
  });
  for (const b of g.userData.boneList || []) b.visible = on;
}

const ONE = { insect: 'насекомо', fish: 'риба', amph: 'земноводно', rept: 'влечуго', bird: 'птица', mammal: 'бозайник', other: 'безгръбначно, но не е насекомо' };
const MENU_IDS = ['butterfly', 'ladybug', 'trout', 'frog', 'lizard', 'snake', 'sparrow', 'rabbit', 'dog', 'spider', 'snail', 'worm'];
// Къде и как се движи всяко животно в музея: център и радиуси на пътеката, височина, скорост.
const ROAM = {
  trout: { kind: 'swim', c: [-6.2, -3.5], rx: 1.4, rz: 0.4, y: 1.85, sp: 0.4, dist: 3.2, lift: 0.7 },
  fish2: { kind: 'swim', c: [-6.0, -3.6], rx: 1.0, rz: 0.3, y: 1.35, sp: -0.5 },
  fish3: { kind: 'swim', c: [-6.5, -3.4], rx: 1.2, rz: 0.35, y: 2.4, sp: 0.3 },
  lizard: { kind: 'walk', c: [-1.85, -3.65], rx: 0.5, rz: 0.32, y: 1.0, sp: 0.5, dist: 2.4, lift: 0.5 },
  snake: { kind: 'slither', c: [-0.45, -3.8], rx: 0.62, rz: 0.4, y: 1.0, sp: 0.35, dist: 2.6, lift: 0.5 },
  spider: { kind: 'crawl', c: [0.45, -4.15], rx: 0.22, rz: 0.18, y: 1.0, sp: 0.4, dist: 2.0, lift: 0.45 },
  frog: { kind: 'hop', c: [4.6, -4.2], rx: 1.9, rz: 1.25, y: 0, sp: 0.45, dist: 2.8, lift: 0.6 },
  rabbit: { kind: 'bunny', c: [7.4, -3.6], rx: 1.1, rz: 0.6, y: 0, sp: 0.45, dist: 3.0, lift: 0.6 },
  dog: { kind: 'walk', c: [8.6, -0.9], rx: 1.4, rz: 0.8, y: 0, sp: 0.4, dist: 3.4, lift: 0.8 },
  sparrow: { kind: 'bird', c: [5.4, -1.3], rx: 0.5, rz: 0.35, y: 0, sp: 0.5, dist: 2.8, lift: 0.6 },
  butterfly: { kind: 'flutter', c: [6.3, 1.1], rx: 0.9, rz: 0.45, y: 0.75, sp: 0.5, dist: 2.6, lift: 0.5 },
  ladybug: { kind: 'crawl', c: [5.3, 1.45], rx: 0.25, rz: 0.15, y: 0.02, sp: 0.35, dist: 1.8, lift: 0.3 },
  snail: { kind: 'crawl', c: [3.7, -2.3], rx: 0.28, rz: 0.18, y: 0, sp: 0.12, dist: 2.0, lift: 0.4 },
  worm: { kind: 'crawl', c: [9.4, 1.2], rx: 0.3, rz: 0.18, y: 0, sp: 0.2, dist: 2.0, lift: 0.35 },
};

export function mount(container, { onComplete }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const STEPS = ['Опознай музея', 'Гръбначни и безгръбначни', 'Подреди по групи', 'Вода и суша'];
  const shell = createShell(container, { steps: STEPS });
  const BG = new THREE.Color(0xcfe6f7);
  const stage = createStage(shell.stageEl, {
    background: BG.getHex(), camPos: [0, 9, 14], target: [0, 1, -2.5], shadows: false,
    fog: { color: 0xcfe6f7, near: 40, far: 80 }, maxDistance: 34, minDistance: 1.5,
  });
  const { scene } = stage;

  // ---------- зала и двор ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 32), mat(0xe8dfcc));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 2;
  scene.add(floor);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 9.2), mat(0x8bc34a));
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(6.9, 0.01, -2.0);
  scene.add(yard);
  const wall = box(13, 4.2, 0.3, 0xf3ead8);
  wall.position.set(-3.6, 2.1, -6.9);
  scene.add(wall);
  const sign = labelSprite('Природонаучен музей', { size: 0.42, color: '#5a3d1e', bg: 'rgba(255,248,230,0.95)', border: '#c9a66b' });
  sign.position.set(-3.6, 3.6, -6.6);
  scene.add(sign);
  // ограда на двора
  const fenceM = mat(0xa1764a);
  const addRail = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    for (const y of [0.25, 0.5]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), fenceM);
      r.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
      r.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
      scene.add(r);
    }
    const n = Math.round(len / 0.9);
    for (let i = 0; i <= n; i++) {
      const p = box(0.08, 0.65, 0.08, 0x8d6238);
      p.position.set(x0 + (x1 - x0) * (i / n), 0.32, z0 + (z1 - z0) * (i / n));
      scene.add(p);
    }
  };
  addRail(2.5, -6.6, 11.3, -6.6);
  addRail(11.3, -6.6, 11.3, 2.6);
  addRail(2.5, 2.6, 11.3, 2.6);
  addRail(2.5, -6.6, 2.5, -1.2);
  const tree = treeModel(0.95);
  tree.position.set(9.7, 0, -5.3);
  scene.add(tree);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: 0x4f9fd6, roughness: 0.15 }));
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(1.5, 0.95, 1);
  pond.position.set(4.6, 0.025, -4.2);
  scene.add(pond);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const s = sph(0.13 + (i % 3) * 0.03, 0x9e9e9e, 6);
    s.scale.y = 0.55;
    s.position.set(4.6 + Math.cos(a) * 1.58, 0.04, -4.2 + Math.sin(a) * 1.02);
    scene.add(s);
  }
  const pondLily = lilyModel();
  pondLily.position.set(4.2, 0, -4.4);
  pondLily.scale.setScalar(0.8);
  scene.add(pondLily);
  for (let i = 0; i < 9; i++) {
    const f = flowerModel([0xff5c8a, 0xffd54f, 0xffffff, 0xba68c8][i % 4]);
    f.position.set(5.4 + (i % 5) * 0.4 + (i > 4 ? 0.2 : 0), 0, 0.7 + Math.floor(i / 5) * 0.55);
    scene.add(f);
  }
  const stone = sph(0.4, 0x9e9e9e, 7);
  stone.scale.set(1.2, 0.35, 0.9);
  stone.position.set(3.7, 0, -2.3);
  scene.add(stone);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), mat(0x6d4c41));
  soil.rotation.x = -Math.PI / 2;
  soil.position.set(9.4, 0.02, 1.2);
  scene.add(soil);

  // аквариум
  const glassM = new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.14, roughness: 0.05, depthWrite: false });
  const aq = new THREE.Group();
  aq.position.set(-6.2, 0, -3.5);
  scene.add(aq);
  aq.add(at(box(4.7, 0.9, 2.0, 0x37474f), 0, 0.45, 0));
  aq.add(at(box(4.4, 0.12, 1.8, 0xe9d8a6), 0, 0.96, 0));
  const water = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.0, 1.8), new THREE.MeshStandardMaterial({ color: 0x4aa6e0, transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false }));
  water.position.y = 2.0;
  aq.add(water);
  for (const [x, z] of [[-2.2, 0.9], [2.2, 0.9], [-2.2, -0.9], [2.2, -0.9]]) aq.add(at(box(0.06, 2.2, 0.06, 0x263238), x, 2.0, z));
  aq.add(at(box(4.5, 0.08, 1.9, 0x263238), 0, 3.08, 0));
  const tankWeeds = [];
  for (const [x, z] of [[-1.8, -0.5], [-0.9, 0.4], [1.3, -0.4], [1.9, 0.3]]) {
    const w = seaweedModel();
    w.position.set(x, 1.0, z);
    w.scale.setScalar(1.4);
    aq.add(w);
    tankWeeds.push(w);
  }
  for (const [x, z, r] of [[0.4, -0.5, 0.25], [-0.3, 0.5, 0.18]]) { const s = sph(r, 0x8d8d8d, 6); s.scale.y = 0.6; s.position.set(x, 1.05, z); aq.add(s); }
  const bubbles = [];
  const bubM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 8; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), bubM);
    b.userData.ph = i / 8;
    b.position.set(1.6, 1, 0.2);
    aq.add(b);
    bubbles.push(b);
  }
  const aqL = labelSprite('Аквариум', { size: 0.34 });
  aqL.position.set(-6.2, 3.5, -3.5);
  scene.add(aqL);

  // терариум
  const ter = new THREE.Group();
  ter.position.set(-0.8, 0, -3.8);
  scene.add(ter);
  ter.add(at(box(3.9, 0.9, 2.2, 0x6d4c41), 0, 0.45, 0));
  ter.add(at(box(3.7, 0.1, 2.0, 0xd9b77a), 0, 0.95, 0));
  const tglass = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.4, 2.0), glassM);
  tglass.position.y = 1.7;
  ter.add(tglass);
  for (const [x, z] of [[-1.85, 1], [1.85, 1], [-1.85, -1], [1.85, -1]]) ter.add(at(box(0.05, 1.4, 0.05, 0x3e2723), x, 1.7, z));
  ter.add(at(box(3.8, 0.06, 2.1, 0x3e2723), 0, 2.42, 0));
  const branch = cyl(0.05, 0.07, 1.6, 0x795548, 6);
  branch.rotation.set(0.3, 0, 1.25);
  branch.position.set(0.2, 1.3, 0.55);
  ter.add(branch);
  const trock = sph(0.28, 0xa1887f, 6);
  trock.scale.y = 0.6;
  trock.position.set(1.45, 1.05, 0.5);
  ter.add(trock);
  const terL = labelSprite('Терариум', { size: 0.34 });
  terL.position.set(-0.8, 2.85, -3.8);
  scene.add(terL);
  const yardL = labelSprite('Двор', { size: 0.34 });
  yardL.position.set(6.9, 1.5, -6.6);
  scene.add(yardL);

  // ---------- животните в музея ----------
  const OBJ = {};
  const roamers = [];
  for (const id of Object.keys(ROAM)) {
    const r = ROAM[id];
    const a = A[id] || A.trout;
    const g = id.startsWith('fish') ? fishModel(id === 'fish2' ? 0xf28c28 : 0xc9a24a, 0xfff1d6, 0xb35a00) : a.build();
    if (id.startsWith('fish')) g.scale.setScalar(0.8);
    g.userData.ph = Math.random() * 6;
    g.userData.heading = 0;
    scene.add(g);
    const item = { id, g, r, anchor: g, last: new V3(), first: true };
    if (id === 'snake') {
      g.scale.setScalar(0.85);
      const segs = g.children.filter((c) => c.isGroup);
      item.segs = segs;
      item.anchor = segs[0];
      g.userData.anim = null;
    }
    if (A[id] && MENU_IDS.includes(id)) {
      g.userData.pickId = id;
      if (id === 'snake') item.segs.forEach((s) => { s.userData.pickId = id; addHitBox(s, 0.3); });
      else addHitBox(g, 0.6);
      OBJ[id] = item;
    }
    roamers.push(item);
  }
  const tmpP = new V3();
  function angleTo(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
  function moveRoamer(it, dt, t) {
    const { g, r } = it;
    const ph = g.userData.ph;
    const u = t * r.sp + ph;
    let x = r.c[0] + r.rx * Math.cos(u);
    let z = r.c[1] + r.rz * Math.sin(u);
    let y = r.y;
    const anim = g.userData.anim;
    if (r.kind === 'slither') {
      // Тялото следва пътеката на главата и се извива настрани.
      const k = 0.85 * 0.105 / Math.max(r.rx, r.rz);
      it.segs.forEach((s, i) => {
        const ui = u - i * k * 1.35;
        const cx = r.c[0] + r.rx * Math.cos(ui);
        const cz = r.c[1] + r.rz * Math.sin(ui);
        const tx = -r.rx * Math.sin(ui);
        const tz = r.rz * Math.cos(ui);
        const tl = Math.hypot(tx, tz) || 1;
        const w = Math.sin(t * 4 - i * 0.6) * 0.07;
        s.position.set((cx + (-tz / tl) * w) / 0.85, r.y / 0.85 + 0.075, (cz + (tx / tl) * w) / 0.85);
        s.rotation.y = Math.atan2(-tz, tx) * Math.sign(r.sp);
      });
      return;
    }
    if (r.kind === 'swim') y += Math.sin(u * 1.7) * 0.22;
    if (r.kind === 'flutter') {
      x = r.c[0] + r.rx * Math.sin(u);
      z = r.c[1] + r.rz * Math.sin(2 * u);
      y = r.y + Math.sin(u * 3) * 0.25;
    }
    if (r.kind === 'hop') {
      const P = 1.8;
      const tt = t + ph;
      const kk = Math.floor(tt / P);
      const f = (tt / P) - kk;
      const e = Math.min(1, f / 0.35);
      const ee = e * e * (3 - 2 * e);
      const uu = (kk + ee) * 0.55;
      x = r.c[0] + r.rx * Math.cos(uu);
      z = r.c[1] + r.rz * Math.sin(uu);
      y = f < 0.35 ? Math.sin(Math.PI * e) * 0.35 : 0;
    }
    if (r.kind === 'bunny') y = Math.abs(Math.sin(t * 6)) * 0.08;
    if (r.kind === 'bird') {
      const f = (t + ph * 2) % 12;
      g.userData.flap = 0;
      y = Math.abs(Math.sin(t * 7)) * 0.05;
      if (f > 8) {
        const e = (f - 8) / 4;
        const rr = 0.5 + 1.1 * Math.sin(Math.PI * e);
        const aa = u + e * Math.PI * 2;
        x = r.c[0] + rr * Math.cos(aa);
        z = r.c[1] + rr * Math.sin(aa) * 0.8;
        y = 1.9 * Math.sin(Math.PI * e);
        g.userData.flap = 1;
      }
    }
    tmpP.set(x, y, z);
    if (it.first) { it.last.copy(tmpP); it.first = false; }
    const dx = x - it.last.x;
    const dz = z - it.last.z;
    if (dx * dx + dz * dz > 1e-7) {
      const h = Math.atan2(-dz, dx);
      g.userData.heading += angleTo(g.userData.heading, h) * Math.min(1, dt * 8);
    }
    it.last.copy(tmpP);
    g.position.copy(tmpP);
    g.rotation.y = g.userData.heading;
    if (anim) anim(t + ph, r.kind === 'crawl' && r.sp < 0.2 ? 0.6 : 1);
  }

  // ---------- място за подреждане (стъпки 2–4) ----------
  const sortWorld = new THREE.Group();
  const SZ = 6.8;
  sortWorld.position.set(0, 0, SZ);
  sortWorld.visible = false;
  scene.add(sortWorld);
  let tokens = [];
  let lives = [];

  stage.tick((dt, t) => {
    for (const it of roamers) moveRoamer(it, dt, t);
    for (const w of tankWeeds) w.userData.anim(t);
    pondLily.userData.anim(t);
    tree.userData.anim(t);
    for (const b of bubbles) {
      const f = (t * 0.35 + b.userData.ph) % 1;
      b.position.set(1.6 + Math.sin(f * 12 + b.userData.ph * 9) * 0.05, 1.05 + f * 1.9, 0.2);
    }
    for (const g of tokens) {
      const m = g.userData.model;
      if (m && m.userData.anim) m.userData.anim(t + g.userData.ph, 0.6);
      if (m) m.position.y = 0.1 + (g.userData.locked ? 0 : Math.abs(Math.sin(t * 2 + g.userData.ph)) * 0.04);
    }
    for (const L of lives) L(dt, t);
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
  const isNarrow = () => (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400) < 1.1;
  const overview = () => view([0.5, 8.5, 12.5], [0.5, 1, -2.6]);
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
  const MENU = MENU_IDS.map((id) => ({ id, label: A[id].label, icon: A[id].icon }));
  const menu = cornerMenu(stage, { title: 'Животните', items: MENU, onSelect: (id) => menuHandler && menuHandler(id) });
  let stopDrag = null;
  function clearSort() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    tokens = [];
    lives = [];
    for (const c of sortWorld.children.slice()) {
      sortWorld.remove(c);
      c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); });
    }
  }
  function setXrayLook(on) {
    scene.background.set(on ? 0x14283f : BG.getHex());
    scene.fog.color.copy(scene.background);
    stage.hemi.intensity = on ? 0.55 : 1.1;
  }

  function makeToken(a, size, prefix) {
    const narrow = isNarrow();
    const g = new THREE.Group();
    const puck = cyl(0.5, 0.55, 0.1, 0xffffff, 24);
    puck.position.y = 0.05;
    g.add(puck);
    const m = fit(a.build(), size);
    m.position.y = 0.1;
    g.add(m);
    const top = new THREE.Box3().setFromObject(m).max.y;
    const l = labelSprite(a.label, { size: narrow ? 0.3 : 0.24 });
    l.position.y = Math.max(0.75, top + 0.3);
    g.add(l);
    g.userData = { pickId: prefix + a.id, dragId: prefix + a.id, a, model: m, ph: Math.random() * 6, label: l, puck };
    addHitBox(g, 1);
    sortWorld.add(g);
    tokens.push(g);
    return g;
  }
  function ringAt(color, r, x, z, id, text, narrow) {
    const ring = zoneRing(color, r);
    ring.position.set(x, 0.02, z);
    ring.userData.ringId = id;
    sortWorld.add(ring);
    if (text) {
      const css = '#' + color.toString(16).padStart(6, '0');
      const l = labelSprite(text, { size: narrow ? 0.36 : 0.32, color: '#fff', bg: css, border: css });
      l.position.set(x, 0.35, z - r * 0.62);
      sortWorld.add(l);
    }
    return ring;
  }
