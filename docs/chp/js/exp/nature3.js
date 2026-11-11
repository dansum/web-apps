// Общи модели за преживяванията от 3. клас „Организмите и тяхната среда на живот“ (3.2.1–3.2.3):
// ливада, дърво, саксия с фасул, котка, кокошка, гъба, пеперуда, охлюв, облак, играчка кола и др.
import { mat, THREE } from '../kit.js';

export const lerp = (a, b, k) => a + (b - a) * k;
export const clamp01 = (k) => Math.max(0, Math.min(1, k));
export const seg = (d, a, b) => clamp01((d - a) / (b - a));

// Ливада с леки неравности (горната страна е около y = 0).
export function meadow(scene, { size = 46, color = 0x7cbf4a } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, 60, 60);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = [];
  const c = new THREE.Color();
  const base = new THREE.Color(color);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    pos.setY(i, r < 7 ? -0.02 : Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.25 * seg(r, 7, 12));
    const t = 0.5 + 0.5 * Math.sin(x * 0.6 + Math.cos(z * 0.5) * 2);
    c.copy(base).offsetHSL(t * 0.03, 0, (t - 0.5) * 0.08);
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  scene.add(ground);
  return ground;
}

// Облаци, които бавно плуват.
export function clouds(stage, n = 5, { y = 7, spread = 16 } = {}) {
  const list = [];
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.95 });
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.7 + (k % 2) * 0.3, 12, 8), m);
      p.position.set(k * 0.8 - 1.2, (k % 2) * 0.3, 0);
      g.add(p);
    }
    g.position.set(-spread + i * (2 * spread / n), y + (i % 2), -12 - (i % 3) * 3);
    stage.scene.add(g);
    list.push(g);
  }
  stage.tick((dt) => {
    for (const g of list) { g.position.x += dt * 0.25; if (g.position.x > spread + 4) g.position.x = -spread - 4; }
  });
  return list;
}

export function treeModel(s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 1.6 * s, 8), mat(0x7a5230));
  trunk.position.y = 0.8 * s;
  g.add(trunk);
  const leafM = mat(0x3f8f3a, { flat: true });
  const crown = new THREE.Group();
  crown.position.y = 2.2 * s;
  for (const [x, y, z, r] of [[0, 0, 0, 1.1], [0.65, -0.3, 0.3, 0.75], [-0.6, -0.2, -0.3, 0.8], [0.1, 0.6, 0.1, 0.75]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), leafM);
    b.position.set(x * s, y * s, z * s);
    crown.add(b);
  }
  g.add(crown);
  g.userData.crown = crown;
  return g;
}

export function stoneModel(s = 1, color = 0x8d8d8d) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 * s, 0), mat(color, { flat: true }));
  m.scale.set(1.3, 0.75, 1);
  m.position.y = 0.22 * s;
  g.add(m);
  return g;
}

export function potModel(r = 0.32, h = 0.5) {
  const g = new THREE.Group();
  const terra = mat(0xc8643b);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.78, h, 20), terra);
  body.position.y = h / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.035, 6, 22), mat(0xb3542f));
  rim.rotation.x = Math.PI / 2; rim.position.y = h;
  const soilM = mat(0x4a3322, { roughness: 1 });
  const soil = new THREE.Mesh(new THREE.CircleGeometry(r - 0.02, 20), soilM);
  soil.rotation.x = -Math.PI / 2; soil.position.y = h - 0.04;
  g.add(body, rim, soil);
  g.userData.soilM = soilM;
  g.userData.soilY = h - 0.04;
  return g;
}

function leafGeo() {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.quadraticCurveTo(0.5, 0.35, 1, 0);
  sh.quadraticCurveTo(0.5, -0.35, 0, 0);
  const geo = new THREE.ShapeGeometry(sh, 8);
  return geo;
}

// Фасул в саксия. set({ h, leaves, green, droop, pods, seed }) — h е височината на стъблото.
export function beanInPot({ r = 0.32, h = 0.5 } = {}) {
  const pot = potModel(r, h);
  const SY = pot.userData.soilY;
  const plant = new THREE.Group();
  plant.position.y = SY;
  const seedM = mat(0xeee2c0);
  const seed = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), seedM);
  seed.scale.set(1.4, 0.75, 0.9);
  seed.position.y = 0.03;
  const stemM = mat(0x6aa84f);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1, 7), stemM);
  const leafM = mat(0x43a047, { side: THREE.DoubleSide });
  const lg = leafGeo();
  const leaves = [];
  for (let i = 0; i < 8; i++) {
    const hinge = new THREE.Group();
    const l = new THREE.Mesh(lg, leafM);
    l.scale.setScalar(0.32);
    hinge.add(l);
    hinge.userData = { i, s: i % 2 ? 1 : -1, f: 0.35 + 0.65 * (Math.floor(i / 2) / 3) };
    hinge.rotation.y = (i % 2 ? 0 : Math.PI) + (i >> 1) * 0.6;
    plant.add(hinge);
    leaves.push(hinge);
  }
  const pods = [];
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.22, 4, 8), mat(0x7cb342));
    plant.add(p);
    pods.push(p);
  }
  plant.add(seed, stem);
  pot.add(plant);
  const green = new THREE.Color(0x43a047); const pale = new THREE.Color(0xe6df8f); const dry = new THREE.Color(0x9c7b4f);
  const soilWet = new THREE.Color(0x3a2618); const soilDry = new THREE.Color(0xa58a68);
  const state = { h: 0, leaves: 0, green: 1, dry: 0, pods: 0, wet: 1, lean: 0 };
  function set(o) {
    Object.assign(state, o);
    const { h: H, leaves: n, green: gk, dry: dk, pods: pk, wet, lean } = state;
    seed.visible = H < 0.06;
    stem.visible = H >= 0.02;
    stem.scale.y = Math.max(0.001, H);
    stem.position.y = H / 2;
    plant.rotation.z = lean;
    const lc = pale.clone().lerp(green, gk).lerp(dry, dk);
    leafM.color.copy(lc);
    stemM.color.copy(new THREE.Color(0xd8d48a).lerp(new THREE.Color(0x6aa84f), gk).lerp(dry, dk));
    leaves.forEach((L) => {
      const { i, f } = L.userData;
      L.visible = i < n && H > 0.05;
      L.position.y = Math.max(0.03, H * f);
      L.children[0].scale.setScalar(0.18 + 0.2 * clamp01(n / 8 + 0.2) * (gk * 0.6 + 0.4));
      L.children[0].rotation.z = lerp(0.35, -1.25, dk);
    });
    pods.forEach((p, i) => {
      p.visible = pk > 0.02 && H > 0.3;
      p.scale.set(1, Math.max(0.05, pk), 1);
      p.position.set((i - 1) * 0.08, H * (0.55 + i * 0.12) - 0.1, 0.06);
      p.rotation.z = (i - 1) * 0.3;
    });
    pot.userData.soilM.color.copy(soilDry).lerp(soilWet, wet);
  }
  set({});
  pot.userData.set = set;
  pot.userData.state = state;
  pot.userData.plant = plant;
  return pot;
}

// Котка. scale ≈ 0.55 е котенце.
export function catModel(color = 0xf0a04b) {
  const g = new THREE.Group();
  const m = mat(color);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.45, 8, 14), m);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.42;
  const head = new THREE.Group();
  head.position.set(0.42, 0.62, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), m);
  head.add(skull);
  for (const s of [1, -1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), m);
    ear.position.set(-0.02, 0.17, s * 0.1);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(0x2e7d32));
    eye.position.set(0.15, 0.04, s * 0.07);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), mat(0x111111));
    pup.position.set(0.175, 0.04, s * 0.07);
    head.add(ear, eye, pup);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(0xe57373));
  nose.position.set(0.18, -0.03, 0);
  head.add(nose);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.45, 4, 8), m);
  tail.position.set(-0.45, 0.62, 0);
  tail.rotation.z = 0.6;
  g.add(body, head, tail);
  const legsL = [];
  for (const [x, z] of [[0.22, 0.1], [0.22, -0.1], [-0.22, 0.1], [-0.22, -0.1]]) {
    const hip = new THREE.Group();
    hip.position.set(x, 0.32, z);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.32, 8), m);
    l.position.y = -0.16;
    hip.add(l);
    g.add(hip);
    legsL.push(hip);
  }
  g.userData.head = head; g.userData.tail = tail; g.userData.legs = legsL;
  return g;
}

export function henModel() {
  const g = new THREE.Group();
  const m = mat(0xb5651d);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), m);
  body.scale.set(1.3, 1, 0.9);
  body.position.y = 0.45;
  const head = new THREE.Group();
  head.position.set(0.3, 0.78, 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), m));
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.03), mat(0xe53935));
  comb.position.y = 0.13;
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 6), mat(0xffb300));
  beak.rotation.z = -Math.PI / 2; beak.position.x = 0.15;
  head.add(comb, beak);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), mat(0x111111));
    e.position.set(0.09, 0.03, s * 0.08);
    head.add(e);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), mat(0xffb300));
    leg.position.set(0, 0.11, s * 0.1);
    g.add(leg);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 6), mat(0x6d3a10));
  tail.position.set(-0.4, 0.6, 0); tail.rotation.z = 0.9;
  g.add(body, head, tail);
  g.userData.head = head;
  return g;
}

export function chickModel() {
  const g = new THREE.Group();
  const m = mat(0xffe066);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), m);
  b.position.y = 0.12;
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), m);
  h.position.set(0.09, 0.24, 0);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 6), mat(0xff8f00));
  beak.rotation.z = -Math.PI / 2; beak.position.set(0.17, 0.24, 0);
  g.add(b, h, beak);
  return g;
}

export function eggModel() {
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), mat(0xf5ecd7));
  e.scale.set(1, 1.3, 1);
  e.position.y = 0.1;
  const g = new THREE.Group();
  g.add(e);
  return g;
}

export function mushroomModel(cap = 0x8d5524, s = 1, spots = false) {
  const g = new THREE.Group();
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.12 * s, 0.35 * s, 10), mat(0xf3ead8));
  stalk.position.y = 0.175 * s;
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.26 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(cap));
  c.scale.y = 0.7;
  c.position.y = 0.33 * s;
  g.add(stalk, c);
  if (spots) for (let i = 0; i < 6; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.03 * s, 6, 4), mat(0xffffff));
    const a = i * 1.05;
    d.position.set(Math.cos(a) * 0.15 * s, 0.47 * s, Math.sin(a) * 0.15 * s);
    g.add(d);
  }
  return g;
}

export function butterflyModel(c = 0xff8f00) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.2, 4, 6), mat(0x3e2723));
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const wm = new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.6 });
  const wings = [];
  for (const s of [1, -1]) {
    const hinge = new THREE.Group();
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), wm);
    w.rotation.x = Math.PI / 2;
    w.position.z = s * 0.17;
    hinge.add(w);
    hinge.userData.s = s;
    g.add(hinge);
    wings.push(hinge);
  }
  g.userData.wings = wings;
  return g;
}
export function flap(g, t, speed = 14) {
  for (const w of g.userData.wings || []) w.rotation.x = w.userData.s * Math.sin(t * speed) * 0.7;
}

export function snailModel() {
  const g = new THREE.Group();
  const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.35, 4, 8), mat(0xc9b28f));
  foot.rotation.z = Math.PI / 2; foot.position.y = 0.07;
  const shell = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.07, 8, 16), mat(0xa0522d));
  shell.position.set(-0.03, 0.2, 0);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(0x8b4513));
  core.position.set(-0.03, 0.2, 0);
  g.add(foot, shell, core);
  for (const s of [1, -1]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 4), mat(0xc9b28f));
    a.position.set(0.22, 0.17, s * 0.03); a.rotation.z = -0.4;
    g.add(a);
  }
  return g;
}

export function flowerModel(c = 0xe91e63, h = 0.7) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, h, 6), mat(0x4caf50));
  stem.position.y = h / 2;
  g.add(stem);
  const head = new THREE.Group();
  head.position.y = h;
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(c));
    p.scale.set(1, 0.4, 0.6);
    const a = (i / 6) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09);
    head.add(p);
  }
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xffd54f)));
  for (const s of [1, -1]) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0x43a047));
    leaf.scale.set(1.6, 0.3, 0.6); leaf.position.set(s * 0.1, h * 0.4, 0);
    g.add(leaf);
  }
  g.add(head);
  return g;
}

export function sunflowerModel(h = 1.6) {
  const g = flowerModel(0xfdd835, h);
  const head = g.children[g.children.length - 1];
  head.clear();
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0xfdd835));
    p.scale.set(1.4, 0.35, 0.5);
    const a = (i / 14) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0);
    p.rotation.z = a;
    head.add(p);
  }
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 18), mat(0x5d4037));
  disc.rotation.x = Math.PI / 2;
  head.add(disc);
  for (const s of [1, -1]) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0x43a047));
    leaf.scale.set(1.5, 0.25, 0.7); leaf.position.set(s * 0.18, h * 0.6, 0);
    g.add(leaf);
  }
  g.userData.head = head;
  return g;
}

export function toyCarModel(color = 0xe53935) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.36), mat(color, { roughness: 0.4 }));
  body.position.y = 0.2;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.32), mat(0x90caf9, { roughness: 0.2 }));
  cab.position.set(-0.05, 0.38, 0);
  g.add(body, cab);
  const wheels = [];
  for (const [x, z] of [[0.22, 0.19], [0.22, -0.19], [-0.22, 0.19], [-0.22, -0.19]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), mat(0x222222));
    w.rotation.x = Math.PI / 2; w.position.set(x, 0.09, z);
    g.add(w); wheels.push(w);
  }
  const key = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 12), mat(0xffc107, { metalness: 0.5 }));
  key.position.set(-0.4, 0.25, 0); key.rotation.y = Math.PI / 2;
  g.add(key);
  g.userData.wheels = wheels;
  return g;
}

export function ballModel() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), mat(0x1e88e5, { roughness: 0.4 }));
  b.position.y = 0.25;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.251, 0.03, 6, 24), mat(0xffeb3b));
  band.position.y = 0.25;
  g.add(b, band);
  return g;
}

export function cloudModel(s = 0.5) {
  const g = new THREE.Group();
  const m = mat(0xffffff, { roughness: 1 });
  for (const [x, y, r] of [[-0.35, 0, 0.3], [0, 0.12, 0.4], [0.38, 0, 0.3]]) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(r * s * 2, 12, 8), m);
    p.position.set(x * s * 2, y * s * 2, 0);
    g.add(p);
  }
  return g;
}

export function sandModel() {
  const g = new THREE.Group();
  const h = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 14), mat(0xe0c080, { flat: true }));
  h.position.y = 0.15;
  const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), mat(0xff7043));
  sp.position.set(0.18, 0.3, 0); sp.rotation.z = -0.5;
  g.add(h, sp);
  return g;
}

// Заек, сърна и др. (опростен четирикрак модел).
export function quadruped(o) {
  const g = new THREE.Group();
  const bodyM = mat(o.color);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(o.r, o.len, 8, 14), bodyM);
  body.rotation.z = Math.PI / 2;
  body.position.y = o.legLen + o.r * 0.9;
  g.add(body);
  const head = new THREE.Group();
  head.position.set(o.len / 2 + o.r * 0.9, o.legLen + o.r * (1.4 + (o.neck || 0)), 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(o.headR, 14, 10), bodyM));
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(o.headR * 0.13, 8, 6), mat(0x111111));
    e.position.set(o.headR * 0.65, o.headR * 0.25, s * o.headR * 0.5);
    head.add(e);
    const ear = o.ears === 'long'
      ? new THREE.Mesh(new THREE.CapsuleGeometry(o.headR * 0.18, o.headR * 1.6, 4, 8), bodyM)
      : new THREE.Mesh(new THREE.ConeGeometry(o.headR * 0.3, o.headR * 0.7, 6), bodyM);
    ear.position.set(-o.headR * 0.1, o.headR * (o.ears === 'long' ? 1.3 : 0.85), s * o.headR * 0.45);
    head.add(ear);
  }
  if (o.neck) {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(o.r * 0.45, o.r * 0.6, o.neck * o.r * 1.6, 10), bodyM);
    neck.position.set(o.len / 2 + o.r * 0.55, o.legLen + o.r * (0.9 + o.neck * 0.6), 0);
    neck.rotation.z = -0.5;
    g.add(neck);
  }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(o.r * 0.35, 10, 8), mat(0xffffff));
  tail.position.set(-o.len / 2 - o.r * 0.9, o.legLen + o.r * 1.1, 0);
  g.add(head, tail);
  const legsL = [];
  for (const [x, z] of [[o.len * 0.45, o.r * 0.5], [o.len * 0.45, -o.r * 0.5], [-o.len * 0.45, o.r * 0.5], [-o.len * 0.45, -o.r * 0.5]]) {
    const hip = new THREE.Group();
    hip.position.set(x, o.legLen, z);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(o.r * 0.22, o.r * 0.18, o.legLen, 8), bodyM);
    l.position.y = -o.legLen / 2;
    hip.add(l);
    g.add(hip);
    legsL.push(hip);
  }
  g.userData.head = head; g.userData.legs = legsL;
  return g;
}

export function birdModel(color = 0x212121, beakC = 0xffb300) {
  const g = new THREE.Group();
  const m = mat(color);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), m);
  body.scale.set(1.5, 1, 1);
  body.position.y = 0.3;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), m);
  head.position.set(0.22, 0.42, 0);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 6), mat(beakC));
  beak.rotation.z = -Math.PI / 2; beak.position.set(0.34, 0.42, 0);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.1), m);
  tail.position.set(-0.28, 0.33, 0); tail.rotation.z = 0.3;
  g.add(body, head, beak, tail);
  for (const s of [1, -1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 4), mat(beakC));
    leg.position.set(0, 0.08, s * 0.06);
    g.add(leg);
  }
  return g;
}

// Ходене: краката се люлеят; g.userData.legs.
export function swingLegs(g, phase, amp = 0.5) {
  (g.userData.legs || []).forEach((lg, i) => { lg.rotation.z = Math.sin(phase + (i === 0 || i === 3 ? 0 : Math.PI)) * amp; });
}
