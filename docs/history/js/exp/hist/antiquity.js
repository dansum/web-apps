// Възстановени места от Античността: колони, храм, стоа, хълм, къща, хора, които се разхождат.
import { mat, THREE } from '../../kit.js';

const MARBLE = 0xf1ece0;

export function column(h = 1.2, r = 0.09) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, h, 12), mat(MARBLE));
  shaft.position.y = h / 2;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(r * 2.6, 0.06, r * 2.6), mat(MARBLE));
  cap.position.y = h + 0.03;
  g.add(shaft, cap);
  return g;
}

// Храм с колони по периметъра и триъгълен фронтон.
export function temple({ w = 2.4, d = 1.4, h = 1.0, cols = 6, color = MARBLE, roof = 0xd9cfb8 } = {}) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.18, d + 0.3), mat(0xe2dccd));
  base.position.y = 0.09;
  g.add(base);
  const sideCols = Math.max(3, Math.round(cols * d / w) + 1);
  const place = (x, z) => { const c = column(h, 0.07); c.position.set(x, 0.18, z); g.add(c); };
  for (let i = 0; i < cols; i++) { const x = -w / 2 + (w * i) / (cols - 1); place(x, d / 2); place(x, -d / 2); }
  for (let i = 1; i < sideCols - 1; i++) { const z = -d / 2 + (d * i) / (sideCols - 1); place(-w / 2, z); place(w / 2, z); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.12, d + 0.2), mat(color));
  beam.position.y = 0.18 + h + 0.12;
  g.add(beam);
  const tri = new THREE.Shape([new THREE.Vector2(-(w + 0.2) / 2, 0), new THREE.Vector2((w + 0.2) / 2, 0), new THREE.Vector2(0, 0.35)]);
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: d + 0.2, bevelEnabled: false }), mat(roof));
  ped.position.set(0, 0.18 + h + 0.18, -(d + 0.2) / 2);
  g.add(ped);
  return g;
}

// Стоа: дълга покрита колонада на площада.
export function stoa({ w = 3, h = 0.8, cols = 8 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < cols; i++) { const c = column(h, 0.06); c.position.set(-w / 2 + (w * i) / (cols - 1), 0, 0.3); g.add(c); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), mat(0xe8dfcb));
  back.position.set(0, h / 2, -0.3);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.08, 0.8), mat(0xb5553a));
  roof.position.y = h + 0.06;
  g.add(back, roof);
  return g;
}

export function hill({ r = 1.8, h = 0.8, color = 0xb7a57a } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r, h, 9), mat(color, { flat: true }));
  m.position.y = h / 2;
  return m;
}

export function house({ w = 0.6, d = 0.5, h = 0.4, wall = 0xe4d3b0, roof = 0xa8532f } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(wall));
  b.position.y = h / 2;
  const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 0.25, 4), mat(roof));
  r.position.y = h + 0.12; r.rotation.y = Math.PI / 4;
  g.add(b, r);
  return g;
}

// Човече: туника (конус) и глава. kind: 'citizen' | 'woman' | 'slave' | 'foreigner' | 'warrior'.
const LOOK = {
  citizen: { body: 0xf3f0e6, trim: 0x2d5fa8 },
  woman: { body: 0xd98aa0, trim: 0x7a3550 },
  slave: { body: 0x9a8b74, trim: 0x5a4d3a },
  foreigner: { body: 0x6aa36f, trim: 0x2f5e33 },
  warrior: { body: 0xb0322b, trim: 0xd4af37 },
  // Тракийци: пъстро наметало (зейра), шапка от лисича кожа, ботуши (по Херодот).
  thracian: { body: 0x8a3b2f, trim: 0xe0a33a, cap: 0xc4672b, cloak: 0x2f6f8f },
  thracianWoman: { body: 0x3f6f4f, trim: 0xe7d38a, cloak: 0x9b3f5a },
};
export function person(kind = 'citizen', { scale = 1 } = {}) {
  const L = LOOK[kind] || LOOK.citizen;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 12), mat(L.body));
  body.position.y = 0.25;
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 16), mat(L.trim));
  belt.rotation.x = Math.PI / 2; belt.position.y = 0.33;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), mat(0xe0b58f));
  head.position.y = 0.58;
  g.add(body, belt, head);
  if (L.cloak) {
    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8), mat(L.cloak, { side: THREE.DoubleSide }));
    cloak.position.y = 0.3;
    cloak.rotation.y = Math.PI;
    g.add(cloak);
  }
  if (L.cap) {
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.2, 10), mat(L.cap));
    cap.position.set(0, 0.7, -0.02); cap.rotation.x = -0.35;
    g.add(cap);
  }
  if (kind === 'warrior') {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16), mat(0xd4af37));
    shield.rotation.z = Math.PI / 2; shield.position.set(0.15, 0.32, 0);
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.9, 6), mat(0x6b4f36));
    spear.position.set(-0.14, 0.45, 0);
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.16), mat(0xb0322b));
    crest.position.y = 0.7;
    g.add(shield, spear, crest);
  }
  g.scale.setScalar(scale);
  g.userData.kind = kind;
  return g;
}

// Разходка: човечетата бавно обикалят около своя дом в даден радиус.
export function wander(stage, people, { r = 0.8, speed = 0.4 } = {}) {
  people.forEach((p, i) => { p.userData.home = p.position.clone(); p.userData.ph = i * 1.7; });
  return stage.tick((dt, t) => {
    for (const p of people) {
      if (p.userData.frozen) continue;
      const a = t * speed + p.userData.ph;
      const h = p.userData.home;
      const nx = h.x + Math.cos(a) * r, nz = h.z + Math.sin(a * 0.8) * r * 0.6;
      p.rotation.y = Math.atan2(nx - p.position.x, nz - p.position.z);
      p.position.x = nx; p.position.z = nz;
      p.position.y = h.y + Math.abs(Math.sin(t * 6 + p.userData.ph)) * 0.03;
    }
  });
}
