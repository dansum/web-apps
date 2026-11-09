// Ранносредновековна България (VII–IX век): землен вал с ров, каменна крепостна стена от големи
// варовикови блокове, порта с кули, дворци, баня, езическо светилище, полуземлянка, юрта, конници и хора.
// Нисък полигон и кеширани текстури от architecture.js, за да върви и на слаб компютър.
import { mat, THREE } from '../../kit.js';
import { M, archGeo, gableRoof } from './architecture.js';
import { person } from './antiquity.js';
import { animal } from './thrace.js';

const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const LIME = (rx, ry) => M(0xfff8ea, { tex: 'limestone', rep: [Math.max(1, Math.round(rx)), Math.max(1, Math.round(ry))] });
const WOOD = 0x6b4f36;

// ---------- землен вал и ров ----------
// Напречен профил (z, y) отвън навътре. level 0…4: колкото по-дълбок ровът, толкова по-висок валът
// (изкопаната пръст се насипва от вътрешната страна).
export function earthProfile(level, { rampart = true } = {}) {
  const d = 0.06 + 0.19 * level, H = rampart ? 0.04 + 0.18 * level : 0;
  // z расте навън; 0 е вътрешният край, 4 — външният.
  return { d, H, pts: [[0, 0], [0.2, 0], [0.9, H], [1.3, H], [1.95, 0], [2.1, 0], [2.5, -d], [3.1, -d], [3.5, 0], [4.0, 0]] };
}
export function surfaceAt(pts, u) {
  if (u <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (u <= pts[i][0]) { const [u0, y0] = pts[i - 1], [u1, y1] = pts[i]; return y0 + (y1 - y0) * (u - u0) / (u1 - u0 || 1); }
  }
  return pts[pts.length - 1][1];
}
// Парче от вала с рова с дължина len по x. Профилът е по локалната ос +z (отвътре навън).
export function earthwork(len, level, opts) {
  const { pts } = earthProfile(level, opts);
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], -1.4);
  for (const [u, v] of pts) s.lineTo(u, v);
  s.lineTo(pts[pts.length - 1][0], -1.4);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);          // профилът → по z, изтеглянето → по −x
  g.translate(len / 2, 0, 0);       // центрирано по x
  // Срезът (торците) е кафява пръст, повърхността — трева.
  const m = new THREE.Mesh(g, [mat(0x8a6a45, { flat: true }), mat(0x8fab5c, { flat: true })]);
  return m;
}

// ---------- каменна крепостна стена ----------
// Стена от големи, грижливо издялани варовикови блокове, с пътека и зъбци отгоре.
export function blockWall(len, { h = 1.6, t = 0.42 } = {}) {
  const g = new THREE.Group();
  const plinth = box(len, 0.16, t + 0.12, LIME(len * 1.2, 0.4)); plinth.position.y = 0.08; g.add(plinth);
  const body = box(len, h, t, LIME(len * 1.1, h * 1.3)); body.position.y = h / 2; g.add(body);
  const n = Math.max(2, Math.floor(len / 0.34));
  const mer = M(0xfff8ea, { tex: 'limestone', rep: [1, 1] });
  for (let i = 0; i < n; i++) {
    for (const s of [1]) {
      const m = box(0.18, 0.18, 0.1, mer);
      m.position.set(-len / 2 + 0.17 + i * (len - 0.34) / Math.max(1, n - 1), h + 0.09, s * (t / 2 - 0.05));
      g.add(m);
    }
  }
  return g;
}
export function roundTower({ r = 0.55, h = 2.1 } = {}) {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 20), LIME(5, h * 1.3)); c.position.y = h / 2; g.add(c);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.15, 0.18, 20), LIME(5, 0.4)); base.position.y = 0.09; g.add(base);
  const mer = M(0xfff8ea, { tex: 'limestone', rep: [1, 1] });
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const m = box(0.16, 0.18, 0.12, mer); m.position.set(Math.cos(a) * (r - 0.06), h + 0.09, Math.sin(a) * (r - 0.06)); m.rotation.y = -a; g.add(m); }
  const slit = M(0x2e2a26);
  for (let i = 0; i < 3; i++) { const a = i * 2.1; const w = box(0.04, 0.22, 0.02, slit); w.position.set(Math.cos(a) * (r + 0.005), h * 0.62, Math.sin(a) * (r + 0.005)); w.rotation.y = -a + Math.PI / 2; g.add(w); }
  return g;
}
export function squareTower({ s = 0.8, h = 2.1 } = {}) {
  const g = new THREE.Group();
  const b = box(s, h, s, LIME(s * 1.6, h * 1.3)); b.position.y = h / 2; g.add(b);
  const base = box(s + 0.12, 0.18, s + 0.12, LIME(1, 0.4)); base.position.y = 0.09; g.add(base);
  const mer = M(0xfff8ea, { tex: 'limestone', rep: [1, 1] });
  for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) {
    const m = box(0.16, 0.18, 0.1, mer); const off = -s / 2 + 0.12 + i * (s - 0.24) / 2;
    if (k < 2) m.position.set(off, h + 0.09, (k ? 1 : -1) * (s / 2 - 0.05)); else { m.position.set((k === 2 ? 1 : -1) * (s / 2 - 0.05), h + 0.09, off); m.rotation.y = Math.PI / 2; }
    g.add(m);
  }
  const slit = M(0x2e2a26);
  for (const sx of [-0.18, 0.18]) { const w = box(0.045, 0.24, 0.01, slit); w.position.set(sx, h * 0.65, s / 2 + 0.006); g.add(w); }
  return g;
}
// Порта: две кули, проход със свод, отворени дървени крила и пътека отгоре. Проходът е по оста z.
export function fortGate({ span = 1.5, h = 1.6, t = 0.42 } = {}) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const tw = squareTower({ s: 0.95, h: h + 0.6 }); tw.position.set(s * (span / 2 + 0.47), 0, 0.12); g.add(tw); }
  const arch = new THREE.Mesh(archGeo(span + 0.02, h, t + 0.1, 0.82), LIME(2, 2)); g.add(arch);
  const top = box(span + 0.02, 0.1, t + 0.1, LIME(1, 1)); top.position.y = h + 0.05; g.add(top);
  const mer = M(0xfff8ea, { tex: 'limestone', rep: [1, 1] });
  for (let i = 0; i < 4; i++) { const m = box(0.16, 0.18, 0.1, mer); m.position.set(-span / 2 + 0.2 + i * (span - 0.4) / 3, h + 0.19, t / 2); g.add(m); }
  const doorM = M(0x5a3d22);
  for (const s of [-1, 1]) {
    const leaf = new THREE.Group();
    const p = box(span * 0.4, h * 0.62, 0.05, doorM); p.position.x = s * span * 0.2; leaf.add(p);
    for (const y of [-0.2, 0.2]) { const band = box(span * 0.4, 0.04, 0.06, M(0x2e2a26, { metal: 0.5 })); band.position.set(s * span * 0.2, y, 0); leaf.add(band); }
    leaf.position.set(s * span * 0.41, h * 0.31, -t / 2 - 0.05); leaf.rotation.y = s * 1.25; g.add(leaf);
  }
  return g;
}

// ---------- дворци, баня, светилище ----------
function windowRow(g, n, w, y, z, rot = 0) {
  const dark = M(0x2b2420, { side: THREE.DoubleSide });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * (w / n);
    const win = new THREE.Group();
    const r = box(0.13, 0.2, 0.02, dark); win.add(r);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.065, 10, 0, Math.PI), dark); top.position.set(0, 0.1, 0.011); win.add(top);
    win.position.set(x, y, z); win.rotation.y = rot;
    g.add(win);
  }
}
// Двуетажна сграда от варовикови блокове: опорни пиластри, корниз между етажите, сводести прозорци,
// стълбище към входа и керемиден покрив. Покривът и горният етаж са възстановка.
export function stonePalace({ w = 4.6, d = 2.2, h1 = 0.95, h2 = 0.8, stairs = true } = {}) {
  const g = new THREE.Group();
  const sock = box(w + 0.2, 0.16, d + 0.2, LIME(w, 0.3)); sock.position.y = 0.08; g.add(sock);
  const f1 = box(w, h1, d, LIME(w * 1.2, h1 * 1.4)); f1.position.y = 0.16 + h1 / 2; g.add(f1);
  const band = box(w + 0.08, 0.08, d + 0.08, M(0xe9dcc0)); band.position.y = 0.16 + h1; g.add(band);
  const f2 = box(w - 0.06, h2, d - 0.06, LIME(w * 1.2, h2 * 1.4)); f2.position.y = 0.16 + h1 + 0.04 + h2 / 2; g.add(f2);
  const corn = box(w + 0.1, 0.07, d + 0.1, M(0xe9dcc0)); corn.position.y = 0.16 + h1 + h2 + 0.06; g.add(corn);
  const top = 0.16 + h1 + h2 + 0.1;
  const roof = gableRoof(w + 0.14, d + 0.2, d * 0.28); roof.position.y = top; g.add(roof);
  // Фронтони от камък на тесните страни.
  for (const s of [-1, 1]) {
    const tri = new THREE.Shape([new THREE.Vector2(-(d + 0.06) / 2, 0), new THREE.Vector2((d + 0.06) / 2, 0), new THREE.Vector2(0, d * 0.28)]);
    const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: false }), LIME(2, 1));
    ped.rotation.y = Math.PI / 2; ped.position.set(s * (w / 2 + 0.03) - 0.02, top, 0); g.add(ped);
  }
  // Пиластри (подпорни издатини) по дългите страни.
  const pil = M(0xf3e8d0, { tex: 'limestone', rep: [1, 2] });
  const np = Math.max(3, Math.round(w / 0.6));
  for (let i = 0; i <= np; i++) for (const s of [-1, 1]) {
    const p = box(0.12, h1 + h2, 0.06, pil); p.position.set(-w / 2 + (i * w) / np, 0.16 + (h1 + h2) / 2, s * (d / 2 + 0.03)); g.add(p);
  }
  windowRow(g, np, w, 0.16 + h1 + h2 * 0.5, d / 2 + 0.01);
  windowRow(g, np, w, 0.16 + h1 + h2 * 0.5, -d / 2 - 0.01, Math.PI);
  windowRow(g, Math.max(2, np - 2), w * 0.8, 0.16 + h1 * 0.55, d / 2 + 0.01);
  // Вход с портал и стълбище.
  const door = box(0.42, 0.62, 0.03, M(0x5a3d22)); door.position.set(0, 0.16 + 0.31, d / 2 + 0.02); g.add(door);
  const portal = new THREE.Mesh(archGeo(0.7, 0.85, 0.08, 0.66), M(0xf3e8d0, { tex: 'limestone' })); portal.position.set(0, 0.16, d / 2 + 0.05); g.add(portal);
  if (stairs) for (let i = 0; i < 3; i++) { const st = box(1.1 - i * 0.12, 0.055, 0.22, LIME(2, 0.2)); st.position.set(0, 0.03 + i * 0.055, d / 2 + 0.42 - i * 0.12); g.add(st); }
  g.userData.height = top + d * 0.28;
  return g;
}
// Баня: ниска сграда с полуцилиндричен свод.
export function bathhouse({ w = 1.3, d = 0.9 } = {}) {
  const g = new THREE.Group();
  const b = box(w, 0.5, d, LIME(w * 1.2, 0.6)); b.position.y = 0.25; g.add(b);
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(d / 2, d / 2, w, 16, 1, false, 0, Math.PI), M(0xffffff, { tex: 'tiles', rep: [3, 2] }));
  vault.rotation.z = Math.PI / 2; vault.position.y = 0.5; g.add(vault);
  const door = box(0.22, 0.32, 0.02, M(0x5a3d22)); door.position.set(0, 0.16, d / 2 + 0.01); g.add(door);
  return g;
}
// Езическо светилище с план „квадрат в квадрат“: външна ограда и по-висока вътрешна зала.
export function paganTemple({ s = 2.0 } = {}) {
  const g = new THREE.Group();
  const pl = box(s + 0.3, 0.14, s + 0.3, LIME(3, 0.3)); pl.position.y = 0.07; g.add(pl);
  const th = 0.14, hh = 0.55;
  for (const [x, z, w, d] of [[0, -s / 2, s, th], [-s / 2, 0, th, s], [s / 2, 0, th, s]]) { const w2 = box(w, hh, d, LIME(Math.max(w, d) * 1.2, 0.7)); w2.position.set(x, 0.14 + hh / 2, z); g.add(w2); }
  for (const sx of [-1, 1]) { const w2 = box(s * 0.36, hh, th, LIME(1, 0.7)); w2.position.set(sx * s * 0.32, 0.14 + hh / 2, s / 2); g.add(w2); }
  const inner = s * 0.5, ih = 1.15;
  const cella = box(inner, ih, inner, LIME(inner * 1.6, ih * 1.3)); cella.position.y = 0.14 + ih / 2; g.add(cella);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(inner * 0.78, 0.4, 4), M(0xffffff, { tex: 'tiles', rep: [2, 1] })); roof.rotation.y = Math.PI / 4; roof.position.y = 0.14 + ih + 0.2; g.add(roof);
  const door = box(0.22, 0.4, 0.02, M(0x3a2a1a)); door.position.set(0, 0.34, inner / 2 + 0.01); g.add(door);
  // Ниска покривка на галерията между двата квадрата.
  for (const [x, z, w, d, rx, rz] of [[0, -s * 0.37, s, s * 0.28, 0.3, 0], [-s * 0.37, 0, s * 0.28, s, 0, -0.3], [s * 0.37, 0, s * 0.28, s, 0, 0.3]]) {
    const r = box(w, 0.03, d, M(0xffffff, { tex: 'tiles', rep: [3, 1] })); r.position.set(x, 0.14 + hh + 0.05, z); r.rotation.set(rx, 0, rz); g.add(r);
  }
  return g;
}

// ---------- жилища ----------
// Полуземлянка: вкопан в земята под, ниски стени от дърво и стръмен покрив от слама; пещ в ъгъла.
export function dugout() {
  const g = new THREE.Group();
  const pit = box(1.0, 0.04, 0.9, M(0x6f5a3e)); pit.position.y = 0.01; g.add(pit);
  const logM = M(0x7a5a3a, { flat: true });
  for (const [x, z, w, d] of [[0, -0.45, 1.0, 0.06], [0, 0.45, 1.0, 0.06], [-0.5, 0, 0.06, 0.9], [0.5, 0, 0.06, 0.9]]) { const l = box(w, 0.16, d, logM); l.position.set(x, 0.08, z); g.add(l); }
  const thatch = M(0xc9a85a, { flat: true });
  const span = 1.0, rise = 0.62, len = 1.12, sl = Math.hypot(span / 2, rise);
  for (const s of [-1, 1]) { const p = box(len, 0.06, sl + 0.08, thatch); p.position.set(0, 0.16 + rise / 2, s * span / 4); p.rotation.x = s * Math.atan2(rise, span / 2); g.add(p); }
  const ridge = box(len + 0.04, 0.06, 0.06, M(0x8a6a2a)); ridge.position.y = 0.16 + rise + 0.02; g.add(ridge);
  const gable = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
  const front = new THREE.Mesh(new THREE.ShapeGeometry(gable), M(0x7a5a3a, { side: THREE.DoubleSide }));
  front.rotation.y = Math.PI / 2; front.position.set(0.53, 0.16, 0); g.add(front);
  const door = box(0.01, 0.3, 0.24, M(0x3a2a1a)); door.position.set(0.54, 0.25, 0); g.add(door);
  g.userData.chimney = new THREE.Vector3(-0.3, 0.72, -0.2);
  return g;
}
// Юрта: кръгла рамка, покрита с плъстен; димен отвор отгоре.
export function yurt({ r = 0.62 } = {}) {
  const g = new THREE.Group();
  const felt = M(0xe8dcc4, { flat: true });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.42, 16), felt); wall.position.y = 0.21; g.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.06, 0.42, 16), felt); roof.position.y = 0.42 + 0.21; g.add(roof);
  const band = new THREE.Mesh(new THREE.TorusGeometry(r + 0.005, 0.018, 6, 24), M(0x9b3f2a)); band.rotation.x = Math.PI / 2; band.position.y = 0.3; g.add(band);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const rope = box(0.015, 0.4, 0.015, M(0x8a6a48)); rope.position.set(Math.cos(a) * r * 0.55, 0.64, Math.sin(a) * r * 0.55); rope.rotation.set(Math.sin(a) * 0.95, 0, -Math.cos(a) * 0.95); g.add(rope); }
  const door = box(0.26, 0.32, 0.03, M(0x9b3f2a)); door.position.set(0, 0.16, r + 0.005); g.add(door);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 10), M(0x6b4f36)); crown.position.y = 0.84; g.add(crown);
  g.userData.chimney = new THREE.Vector3(0, 0.88, 0);
  return g;
}
// Плет (ограда от преплетени пръти) за кошара.
export function fence(len) {
  const g = new THREE.Group();
  const n = Math.max(2, Math.round(len / 0.3));
  for (let i = 0; i <= n; i++) { const p = box(0.04, 0.34, 0.04, mat(WOOD)); p.position.set(-len / 2 + (i * len) / n, 0.17, 0); g.add(p); }
  for (const y of [0.12, 0.24]) { const r = box(len, 0.05, 0.03, mat(0x8a6a48)); r.position.y = y; g.add(r); }
  return g;
}

// ---------- хора и конници ----------
// Облеклото не е запазено — цветовете са възстановка.
const DRESS = {
  khan: { body: 0x7a1f2b, trim: 0xd4af37, cap: 0x3a2a1a, capTop: 0xd4af37 },
  boil: { body: 0x2f4f7a, trim: 0xc9a227, cap: 0x4a3524 },
  bulgar: { body: 0x6b4a2b, trim: 0xa0522d, cap: 0x4a3524 },
  slav: { body: 0xeee6d2, trim: 0xb0322b },
  slavWoman: { body: 0xd9cbb0, trim: 0x2f6f8f, scarf: 0xf6f1e4 },
};
export function folk(kind = 'bulgar', { scale = 1 } = {}) {
  const D = DRESS[kind] || DRESS.bulgar;
  const p = person('citizen');
  const [body, belt] = p.children;
  body.material.color.setHex(D.body);
  belt.material.color.setHex(D.trim);
  belt.position.y = 0.21; belt.scale.setScalar(0.92); // поясът приляга към дрехата
  if (D.cap) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.1, 10), mat(D.cap)); cap.position.y = 0.66; p.add(cap);
    if (D.capTop) { const t = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(D.capTop, { metalness: 0.6, roughness: 0.3 })); t.position.y = 0.73; p.add(t); }
  }
  if (D.scarf) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), mat(D.scarf)); s.position.y = 0.59; p.add(s); }
  if (kind === 'khan') {
    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.46, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8), mat(0xb0322b, { side: THREE.DoubleSide }));
    cloak.position.y = 0.28; cloak.rotation.y = Math.PI; p.add(cloak);
  }
  p.scale.setScalar(scale);
  p.userData.kind = kind;
  return p;
}
// Конник: кон и ездач. Гледа към +x (като animal()).
export function rider(kind = 'bulgar') {
  const g = new THREE.Group();
  const h = animal('horse');
  g.add(h);
  const man = folk(kind, { scale: 0.78 });
  man.position.set(-0.04, 0.36, 0); man.rotation.y = Math.PI / 2;
  g.add(man);
  const spear = box(0.012, 0.012, 0.85, mat(0x6b4f36)); spear.position.set(0.05, 0.75, 0.1); spear.rotation.y = Math.PI / 2; g.add(spear);
  g.userData = { legs: h.userData.legs, horse: h };
  return g;
}

// ---------- предмети ----------
// Колона с надпис на гръцки (като колоните с надписи на хановете). Буквите са само за картинка.
export function inscribedColumn({ h = 1.0 } = {}) {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#e6dcc6'; x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#5b4c38'; x.font = 'bold 22px serif';
  const L = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΩ';
  let seed = 5; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let row = 0; row < 9; row++) { let s = ''; for (let i = 0; i < 14; i++) s += L[Math.floor(r() * L.length)]; x.fillText(s, 10, 28 + row * 26); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, h, 18), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  shaft.position.y = 0.12 + h / 2; g.add(shaft);
  const base = box(0.34, 0.12, 0.34, LIME(1, 0.3)); base.position.y = 0.06; g.add(base);
  const cap = box(0.3, 0.07, 0.3, M(0xe9dcc0)); cap.position.y = 0.12 + h + 0.035; g.add(cap);
  return g;
}
// Глинени тръби от водопровод в разкопан изкоп.
export function pipeTrench(len = 1.4) {
  const g = new THREE.Group();
  const trench = box(len, 0.03, 0.34, M(0x8a6f4c)); trench.position.y = 0.012; g.add(trench);
  const n = Math.round(len / 0.24);
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.22, 10), mat(0xb5683a));
    p.rotation.z = Math.PI / 2; p.position.set(-len / 2 + 0.12 + i * 0.24, 0.06, 0); g.add(p);
  }
  return g;
}

// ---------- дим и облаци ----------
export function smoke(stage, points, { color = 0xd8d4cc } = {}) {
  const g = new THREE.Group();
  const puffs = [];
  const m = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.35, roughness: 1, depthWrite: false });
  const geo = new THREE.SphereGeometry(0.06, 8, 6);
  points.forEach((p, k) => { for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(geo, m.clone()); s.userData = { base: p.clone(), ph: i / 5 + k * 0.13 }; g.add(s); puffs.push(s); } });
  stage.scene.add(g);
  const off = stage.tick((dt, t) => {
    for (const s of puffs) {
      const k = (t * 0.18 + s.userData.ph) % 1;
      s.position.set(s.userData.base.x + Math.sin(t + s.userData.ph * 9) * 0.06 + k * 0.25, s.userData.base.y + k * 1.1, s.userData.base.z);
      s.scale.setScalar(0.5 + k * 1.3);
      s.material.opacity = 0.35 * (1 - k);
    }
  });
  return { group: g, dispose: off };
}
export function cloud() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.88, roughness: 1 });
  [[0, 0, 0, 0.9], [0.9, 0.1, 0.2, 0.7], [-0.9, 0, -0.1, 0.65], [0.2, 0.4, 0, 0.6]].forEach(([x, y, z, r]) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m); s.position.set(x, y, z); g.add(s);
  });
  return g;
}
