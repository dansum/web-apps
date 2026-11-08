// Музейна витрина: пиедестал, стъклен похлупак и предмет, който бавно се върти.
// Плюс прости модели на находки (сечиво, висулка, съд, злато), сглобени от примитиви.
import { labelSprite, mat, addHitBox, THREE } from '../../kit.js';

export function createVitrina(stage, { id, x = 0, z = 0, label = '', item = null, plaque = null } = {}) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), mat(0x3b4a5c));
  base.position.y = 0.45;
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 1.0), mat(0x2a3542));
  top.position.y = 0.93;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.8, 0.86),
    new THREE.MeshStandardMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false }));
  glass.position.y = 1.36;
  g.add(base, top, glass);
  const holder = new THREE.Group();
  holder.position.y = 1.2;
  g.add(holder);
  let lbl = null;
  if (label) { lbl = labelSprite(label, { size: 0.22 }); lbl.position.y = 1.95; g.add(lbl); }
  if (plaque) {
    const p = labelSprite(plaque, { size: 0.16, bg: 'rgba(250,246,232,0.95)', border: '#b9a77a' });
    p.position.set(0, 0.7, 0.5);
    g.add(p);
  }
  g.userData = { pickId: id, holder, glass, label: lbl };
  addHitBox(g, 0.9);
  stage.scene.add(g);
  const stop = stage.tick((dt, t) => { holder.rotation.y += dt * 0.5; holder.position.y = 1.2 + Math.sin(t * 1.3 + x) * 0.03; });
  const v = {
    group: g,
    setItem(obj) { holder.clear(); if (obj) holder.add(obj); },
    setLabel(text) {
      if (lbl) g.remove(lbl);
      lbl = text ? labelSprite(text, { size: 0.22 }) : null;
      if (lbl) { lbl.position.y = 1.95; g.add(lbl); }
    },
    glow(color) { glass.material.color.setHex(color ?? 0xd8f0ff); glass.material.opacity = color ? 0.32 : 0.18; },
    dispose() { stop(); stage.scene.remove(g); },
  };
  if (item) v.setItem(item);
  return v;
}

// ---------- находки ----------
const GOLD = 0xd4af37;
export const FINDS = {
  // Кремъчно сечиво: заострен, леко сплескан камък.
  flint() {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 5), mat(0x8c8f86, { flat: true }));
    m.scale.z = 0.45; m.rotation.z = 0.3;
    return m;
  },
  // Висулка от мечи зъб на връв.
  tooth() {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 10), mat(0xf1e6c8));
    t.rotation.z = Math.PI; t.position.y = -0.08;
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 30, Math.PI * 1.3), mat(0x7a5a3a));
    cord.position.y = 0.12; cord.rotation.z = -Math.PI * 0.15 + Math.PI;
    g.add(t, cord);
    return g;
  },
  // Глинен съд с украса.
  pot() {
    const pts = [[0, -0.2], [0.14, -0.2], [0.2, -0.08], [0.21, 0.04], [0.15, 0.16], [0.13, 0.22], [0.15, 0.24]].map(([a, b]) => new THREE.Vector2(a, b));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), mat(0xb5683a, { side: THREE.DoubleSide }));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 6, 30), mat(0xf0e2c4));
    band.rotation.x = Math.PI / 2; band.position.y = 0.02;
    const g = new THREE.Group(); g.add(m, band);
    return g;
  },
  // Златни гривни.
  bracelets() {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 10, 36), mat(GOLD, { metalness: 0.8, roughness: 0.25 }));
      r.rotation.x = Math.PI / 2 - 0.25 + i * 0.12; r.position.y = -0.1 + i * 0.07;
      g.add(r);
    }
    return g;
  },
  // Скиптър: дръжка, обкована със злато, и каменна глава.
  scepter() {
    const g = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 10), mat(GOLD, { metalness: 0.8, roughness: 0.25 }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), mat(0x5d5f63));
    head.position.y = 0.28;
    g.add(stick, head);
    g.rotation.z = 0.5;
    return g;
  },
};
