// Модели за тракийски град: стена, кула, къща с двор, дворец, работилници, стоки, домашни животни.
// Всичко е от прости тела (нисък полигон), за да върви и на слаб компютър.
import { mat, THREE } from '../../kit.js';

const STONE = 0x9c9486, MUD = 0xcfae7f, TILE = 0xa8532f, WOOD = 0x6b4f36;

// Стена: каменна основа и горна част от кирпич (непечени тухли).
export function wallSegment(len, { h = 1.1, t = 0.35 } = {}) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(len, h * 0.4, t), mat(STONE, { flat: true }));
  base.position.y = h * 0.2;
  const top = new THREE.Mesh(new THREE.BoxGeometry(len, h * 0.6, t * 0.9), mat(MUD));
  top.position.y = h * 0.7;
  g.add(base, top);
  return g;
}
export function tower({ s = 0.8, h = 1.6 } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(s, h * 0.35, s), mat(STONE, { flat: true }));
  b.position.y = h * 0.175;
  const t = new THREE.Mesh(new THREE.BoxGeometry(s * 0.95, h * 0.65, s * 0.95), mat(MUD));
  t.position.y = h * 0.35 + h * 0.325;
  g.add(b, t);
  return g;
}

// Къща с двор: стаи от три страни, керемиден покрив, огнище в двора.
export function courtyardHouse({ w = 2.0, d = 1.8, h = 0.75 } = {}) {
  const g = new THREE.Group();
  const walls = [];
  const room = (x, z, rw, rd) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(rw, h, rd), mat(MUD));
    m.position.set(x, h / 2, z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.04, 0.12, rd + 0.04), mat(STONE));
    base.position.set(x, 0.06, z);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.12, 0.08, rd + 0.12), mat(TILE));
    roof.position.set(x, h + 0.08, z);
    roof.rotation.z = 0.0;
    g.add(m, base, roof);
    walls.push(m, roof);
  };
  room(0, -d / 2 + 0.3, w, 0.6);                 // задни стаи
  room(-w / 2 + 0.3, 0.15, 0.6, d - 0.9);        // лява стая
  room(w / 2 - 0.3, 0.15, 0.6, d - 0.9);         // дясна стая
  const yard = new THREE.Mesh(new THREE.BoxGeometry(w - 1.2, 0.02, d - 0.6), mat(0xc9b48a));
  yard.position.set(0, 0.01, 0.3);
  const hearth = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.08, 12), mat(STONE));
  hearth.position.set(0, 0.04, 0.2);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 8), new THREE.MeshBasicMaterial({ color: 0xff9a2a }));
  fire.position.set(0, 0.16, 0.2);
  const pithos = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.3, 10), mat(0xb5683a));
  pithos.position.set(0.25, 0.15, -0.05);
  const loom = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.04), mat(WOOD));
  loom.position.set(-0.25, 0.2, -0.05);
  g.add(yard, hearth, fire, pithos, loom);
  g.userData = { walls, fire };
  return g;
}

// Дворецът на Севт III: голяма сграда с колонада отпред, на отделно укрепено място.
export function palace() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 1.8), mat(0xe1cfa6));
  b.position.y = 0.55;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 0.6, 4), mat(TILE));
  roof.position.y = 1.4; roof.rotation.y = Math.PI / 4; roof.scale.set(1.05, 1, 0.62);
  g.add(b, roof);
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 10), mat(0xf1ece0));
    c.position.set(-1.25 + i * 0.5, 0.45, 1.05);
    g.add(c);
  }
  const porch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.5), mat(TILE));
  porch.position.set(0, 0.95, 1.05);
  g.add(porch);
  return g;
}

// Работилници.
export function forge() {
  const g = new THREE.Group();
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), mat(STONE, { flat: true }));
  hearth.position.set(-0.3, 0.175, 0);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.25), new THREE.MeshBasicMaterial({ color: 0xff6a1a }));
  glow.position.set(-0.3, 0.37, 0);
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.12), mat(0x3c3f44, { metalness: 0.6 }));
  anvil.position.set(0.25, 0.3, 0);
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.22, 8), mat(WOOD));
  stump.position.set(0.25, 0.11, 0);
  g.add(hearth, glow, anvil, stump);
  g.userData.glow = glow;
  return g;
}
export function potteryWheel() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.25, 12), mat(WOOD));
  base.position.y = 0.125;
  const wheel = new THREE.Group();
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), mat(0x8a6a48));
  const clay = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 12), mat(0xb5683a));
  clay.position.y = 0.1;
  wheel.add(disk, clay);
  wheel.position.y = 0.27;
  const kiln = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xa36b45));
  kiln.position.set(0.5, 0, -0.35); kiln.scale.setScalar(0.8);
  g.add(base, wheel, kiln);
  g.userData.wheel = wheel;
  return g;
}
export function goldTable() {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.35), mat(WOOD));
  t.position.y = 0.32;
  for (const [x, z] of [[-0.25, -0.13], [0.25, -0.13], [-0.25, 0.13], [0.25, 0.13]]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.04), mat(WOOD)); l.position.set(x, 0.16, z); g.add(l);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 20), mat(0xd4af37, { metalness: 0.8, roughness: 0.25 }));
  ring.position.set(-0.1, 0.37, 0); ring.rotation.x = Math.PI / 2;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xd4af37, { metalness: 0.8, roughness: 0.25, side: THREE.DoubleSide }));
  bowl.position.set(0.12, 0.43, 0);
  g.add(t, ring, bowl);
  g.userData.shine = [ring, bowl];
  return g;
}

// Стоки на пазара.
export function amphora(color = 0xc0703f) {
  const pts = [[0, -0.32], [0.05, -0.3], [0.1, -0.18], [0.13, 0.0], [0.12, 0.1], [0.06, 0.18], [0.04, 0.3], [0.05, 0.32]].map(([a, b]) => new THREE.Vector2(a, b));
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), mat(color, { side: THREE.DoubleSide }));
  const h1 = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), mat(color));
  h1.position.set(0.06, 0.22, 0); h1.rotation.z = -Math.PI / 2;
  const h2 = h1.clone(); h2.position.x = -0.06; h2.rotation.z = Math.PI / 2;
  g.add(body, h1, h2);
  g.position.y = 0.32;
  return g;
}
export function paintedCup() {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.06, 0.1, 16, 1, true), mat(0x1d1d1d, { side: THREE.DoubleSide }));
  cup.position.y = 0.12;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 6, 24), mat(0xd06a2a));
  band.rotation.x = Math.PI / 2; band.position.y = 0.12;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.07, 12), mat(0x1d1d1d));
  foot.position.y = 0.035;
  g.add(cup, band, foot);
  return g;
}
export function coins(color = 0xb87333) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16), mat(color, { metalness: 0.7, roughness: 0.35 }));
    c.position.set((i % 3) * 0.07 - 0.07, 0.01 + Math.floor(i / 3) * 0.013, (i % 2) * 0.05);
    g.add(c);
  }
  return g;
}
export function stall({ w = 1.2 } = {}) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.5), mat(WOOD));
  t.position.y = 0.35;
  const awning = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.03, 0.6), mat(0xd9c38a));
  awning.position.set(0, 0.9, -0.05); awning.rotation.x = 0.15;
  for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.04), mat(WOOD)); p.position.set(x, 0.45, -0.3); g.add(p);
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), mat(WOOD)); l.position.set(x, 0.17, 0.2); g.add(l);
  }
  g.add(t, awning);
  return g;
}

// Домашни животни: тяло, глава, крака. kind: horse | cow | sheep | goat | pig
const ANIMALS = {
  horse: { body: [0.55, 0.22, 0.18], color: 0x7a4a2a, leg: 0.32, head: [0.12, 0.12, 0.28], neck: true },
  cow: { body: [0.55, 0.28, 0.24], color: 0x8c6a4f, leg: 0.22, head: [0.14, 0.14, 0.18] },
  sheep: { body: [0.36, 0.2, 0.2], color: 0xf1ede2, leg: 0.14, head: [0.09, 0.09, 0.12], headColor: 0x3b3b3b },
  goat: { body: [0.34, 0.17, 0.15], color: 0x5c4a3a, leg: 0.17, head: [0.08, 0.09, 0.13], horns: true },
  pig: { body: [0.38, 0.2, 0.2], color: 0xd8a39a, leg: 0.1, head: [0.12, 0.12, 0.12] },
};
export function animal(kind) {
  const A = ANIMALS[kind];
  const g = new THREE.Group();
  const m = mat(A.color);
  const [bx, by, bz] = A.body;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bx, by, bz), m);
  body.position.y = A.leg + by / 2;
  g.add(body);
  const legs = [];
  for (const [x, z] of [[bx / 2 - 0.05, bz / 2 - 0.04], [bx / 2 - 0.05, -bz / 2 + 0.04], [-bx / 2 + 0.05, bz / 2 - 0.04], [-bx / 2 + 0.05, -bz / 2 + 0.04]]) {
    const hip = new THREE.Group(); hip.position.set(x, A.leg, z);
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, A.leg, 0.05), m); l.position.y = -A.leg / 2;
    hip.add(l); g.add(hip); legs.push(hip);
  }
  const head = new THREE.Mesh(new THREE.BoxGeometry(...A.head), mat(A.headColor ?? A.color));
  head.position.set(bx / 2 + A.head[0] / 2, A.leg + by + (A.neck ? 0.16 : 0.02), 0);
  if (A.neck) {
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.1), m);
    neck.position.set(bx / 2 - 0.02, A.leg + by + 0.04, 0); neck.rotation.z = -0.5;
    g.add(neck);
    head.rotation.z = -0.9;
  }
  if (A.horns) {
    for (const z of [-0.03, 0.03]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.1, 6), mat(0xd8cfb8)); h.position.set(bx / 2 + 0.04, A.leg + by + 0.1, z); h.rotation.z = 0.5; g.add(h); }
  }
  g.add(head);
  g.userData = { legs, kind };
  return g;
}
// Пасящи животни: бавно обикалят в загон и мърдат краката.
export function graze(stage, list, { r = 0.6, speed = 0.25 } = {}) {
  list.forEach((a, i) => { a.userData.home = a.position.clone(); a.userData.ph = i * 2.1; });
  return stage.tick((dt, t) => {
    for (const a of list) {
      const k = t * speed + a.userData.ph;
      const h = a.userData.home;
      const x = h.x + Math.cos(k) * r, z = h.z + Math.sin(k * 0.7) * r * 0.6;
      a.rotation.y = Math.atan2(-(z - a.position.z), x - a.position.x);
      a.position.set(x, h.y, z);
      a.userData.legs.forEach((l, j) => { l.rotation.z = Math.sin(t * 5 + j * Math.PI / 2 + a.userData.ph) * 0.35; });
    }
  });
}
