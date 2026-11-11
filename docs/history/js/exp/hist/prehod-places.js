// Модели за „Преход, НАТО и ЕС“ (10.3.9) — за многократна употреба.
// София (мащабът на sofia-places.js, човек ≈ 0,68): Партийният дом с червената звезда, трибуна и знамена
// за митинг, зала с кръгла маса, избирателна секция с урна и кабина, Конституцията на пулт, схема на
// държавното устройство (зала с 240 места, президент, Министерски съвет, съдилища, Конституционен съд, община).
// Град (в метри, като home.js): магазин с рафтове и опашка, частна будка, кафене, завод с комин,
// бюро по труда, табела за европейски проект, училище със скеле, магистрала, граничен пункт, камион.
// Всички модели са опростени възстановки — не са точни копия на сградите.
import { THREE, labelSprite } from '../../kit.js';
import { M, column } from './architecture.js';
import { CM, col } from './city.js';
import { signMat } from './sofia1943.js';
import { stateBuilding } from './sofia-places.js';

const GEO = new Map();
const G = (key, make) => { if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); };
const box = (w, h, d, m) => new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);
const cyl = (rt, rb, h, m, seg = 12) => new THREE.Mesh(G(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m);
const sph = (r, m, ws = 12, hs = 8) => new THREE.Mesh(G(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)), m);
const at = (g, o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
const GLASS = () => col(0x9fc3d8, { rough: 0.15, metal: 0.3 });
const DARK = () => col(0x2a2622);

// ---------- знамена ----------
const FLAGTEX = new Map();
function flagTex(kind) {
  if (FLAGTEX.has(kind)) return FLAGTEX.get(kind);
  const c = document.createElement('canvas'); c.width = 300; c.height = 200;
  const g = c.getContext('2d');
  if (kind === 'eu') {
    g.fillStyle = '#003399'; g.fillRect(0, 0, 300, 200);
    g.fillStyle = '#ffcc00';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; star(g, 150 + Math.cos(a) * 66, 100 + Math.sin(a) * 66, 11); }
  } else if (kind === 'nato') {
    g.fillStyle = '#004990'; g.fillRect(0, 0, 300, 200);
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.beginPath(); g.arc(150, 100, 42, 0, 7); g.stroke();
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) { g.save(); g.translate(150, 100); g.rotate((i * Math.PI) / 2); g.beginPath(); g.moveTo(0, -78); g.lineTo(13, -13); g.lineTo(-13, -13); g.closePath(); g.fill(); g.restore(); }
    g.lineWidth = 4; g.strokeStyle = '#ffffff';
    for (const [x0, y0, x1, y1] of [[150, 4, 150, 22], [150, 178, 150, 196], [40, 100, 70, 100], [230, 100, 260, 100]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  } else {
    // Българското знаме.
    for (const [i, s] of ['#ffffff', '#00966e', '#d62612'].entries()) { g.fillStyle = s; g.fillRect(0, (i * 200) / 3, 300, 200 / 3 + 1); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, side: THREE.DoubleSide });
  FLAGTEX.set(kind, m);
  return m;
}
function star(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}
// Знаме на пилон: kind — 'bg', 'eu', 'nato'. userData.cloth се вее (въртене около пилона).
export function flagPole(kind = 'bg', { pole = 1.2, w = 0.5, h = 0.33 } = {}) {
  const g = new THREE.Group();
  at(g, cyl(0.012, 0.016, pole, col(0xd8d8d8, { metal: 0.5, rough: 0.4 }), 6), 0, pole / 2, 0);
  at(g, sph(0.022, col(0xd9b23a, { metal: 0.6, rough: 0.3 }), 8, 6), 0, pole + 0.01, 0);
  const cloth = new THREE.Group(); cloth.position.set(0, pole - h / 2 - 0.02, 0); g.add(cloth);
  const geo = G(`flag${w},${h}`, () => { const p = new THREE.PlaneGeometry(w, h, 8, 1); p.translate(w / 2, 0, 0); return p; });
  const m = new THREE.Mesh(geo, flagTex(kind)); cloth.add(m);
  g.userData.cloth = cloth; g.userData.wave = m;
  return g;
}
// Вълни по плата (вика се от tick).
export function waveFlag(f, t) {
  const m = f.userData.wave; if (!m) return;
  const p = m.geometry.attributes.position;
  if (!m.userData.x0) { m.geometry = m.geometry.clone(); m.userData.x0 = Array.from({ length: p.count }, (_, i) => p.getX(i)); }
  const q = m.geometry.attributes.position;
  for (let i = 0; i < q.count; i++) { const x = m.userData.x0[i]; q.setZ(i, Math.sin(x * 9 - t * 4 + f.id) * x * 0.12); }
  q.needsUpdate = true;
}
export const flagMat = flagTex;

// ---------- табели ----------
export function sign(text, { w = 1, h = 0.22, bg = '#f2efe6', fg = '#1e2a36', font, px = 512 } = {}) {
  const ratio = Math.max(1, Math.round((px * h) / w));
  return box(w, h, 0.02, signMat(text, { bg, fg, w: px, h: ratio, font: font || `bold ${Math.round(ratio * 0.52)}px Arial, sans-serif` }));
}
// Плакат на два пилона (за митинга).
export function banner(text, { w = 0.9, h = 0.22, pole = 0.75, bg = '#f6f2e8', fg = '#b0261c' } = {}) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) at(g, cyl(0.008, 0.008, pole, col(0x7a5a3a), 5), s * w / 2, pole / 2, 0);
  at(g, sign(text, { w, h, bg, fg }), 0, pole - h / 2 - 0.02, 0);
  return g;
}

// ---------- София, 1989–1991 ----------
// Партийният дом (Ларгото): масивна сграда с кула, шпил и червена звезда отгоре. Лицето гледа по +z.
export function partyHouse() {
  const g = stateBuilding({ w: 3.8, d: 1.5, h: 2.2, color: 0xe8dfca, flagOn: false });
  const stoneM = M(0xf0e8d6, { tex: 'limestone', rep: [2, 2] });
  at(g, box(1.1, 0.7, 0.9, stoneM), 0, 2.6, 0);
  for (let i = 0; i < 5; i++) { const c = column('doric', { h: 0.45, r: 0.025, color: 0xf6efe0 }); c.position.set(-0.4 + i * 0.2, 2.35, 0.47); g.add(c); }
  at(g, box(0.75, 0.35, 0.6, stoneM), 0, 3.12, 0);
  const spire = cyl(0.03, 0.12, 0.9, col(0xd8d0bc, { metal: 0.3 }), 8); at(g, spire, 0, 3.75, 0);
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.08 : 0.2; i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const starM = new THREE.Mesh(G('redstar', () => { const e = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false }); e.translate(0, 0, -0.02); return e; }), new THREE.MeshStandardMaterial({ color: 0xc8231c, emissive: 0x6a0a06, roughness: 0.4 }));
  starM.position.set(0, 4.38, 0); g.add(starM);
  g.userData.star = starM; g.userData.top = 4.6;
  return g;
}
// Трибуна с микрофони и знамена (митингът пред „Ал. Невски“).
export function tribune() {
  const g = new THREE.Group();
  at(g, box(1.6, 0.3, 0.7, col(0x6b4a2c)), 0, 0.15, 0);
  at(g, box(1.6, 0.04, 0.72, col(0x8a6a4a)), 0, 0.31, 0);
  at(g, box(1.6, 0.28, 0.02, flagTex('bg')), 0, 0.15, 0.36);
  for (const x of [-0.2, 0.2]) { at(g, cyl(0.006, 0.006, 0.28, DARK(), 5), x, 0.45, 0.25); at(g, sph(0.018, DARK(), 6, 4), x, 0.6, 0.25); }
  for (const x of [-0.75, 0.75]) { const f = flagPole('bg', { pole: 1.0, w: 0.4, h: 0.26 }); f.position.set(x, 0.3, -0.25); g.add(f); (g.userData.flags ||= []).push(f); }
  for (const x of [-0.7, 0.7]) { at(g, box(0.18, 0.2, 0.16, DARK()), x, 0.42, 0.2); at(g, cyl(0.06, 0.06, 0.02, col(0x555555), 12), x, 0.42, 0.29).rotation.x = Math.PI / 2; }
  return g;
}
// Зала с кръглата маса: без покрив (разрез), ниски стени с прозорци, кръгла маса със зелено сукно,
// столове, микрофони и табелки. userData.seats — точки около масата (за хората).
export function roundTableHall({ s = 3.4 } = {}) {
  const g = new THREE.Group();
  at(g, box(s, 0.06, s, CM('paving', { color: 0xb89a7a, rep: [3, 3] })), 0, 0.03, 0);
  const wall = CM('plaster', { color: 0xefe6d2, rep: [2, 1] });
  for (const [x, z, w, d] of [[0, -s / 2, s, 0.08], [-s / 2, 0, 0.08, s], [s / 2, 0, 0.08, s]]) at(g, box(w, 0.8, d, wall), x, 0.43, z);
  for (const [x, z] of [[-1, -s / 2 + 0.05], [0, -s / 2 + 0.05], [1, -s / 2 + 0.05]]) { at(g, box(0.4, 0.5, 0.02, GLASS()), x, 0.5, z); at(g, box(0.5, 0.7, 0.04, col(0x8a5a3a)), x, 0.5, z - 0.02); }
  for (const s2 of [-1, 1]) for (const z of [-0.8, 0.8]) at(g, box(0.02, 0.5, 0.4, GLASS()), s2 * (s / 2 - 0.05), 0.5, z);
  // Масата: пръстен.
  const R = 0.95;
  const top = new THREE.Mesh(G('rtTop', () => new THREE.RingGeometry(R - 0.32, R, 40)), col(0x2f6a3a, { side: THREE.DoubleSide }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.3; g.add(top);
  const rim = new THREE.Mesh(G('rtRim', () => new THREE.CylinderGeometry(R, R, 0.05, 40, 1, true)), col(0x6b4a2c, { side: THREE.DoubleSide })); rim.position.y = 0.28; g.add(rim);
  const rimIn = new THREE.Mesh(G('rtRimI', () => new THREE.CylinderGeometry(R - 0.32, R - 0.32, 0.05, 40, 1, true)), col(0x6b4a2c, { side: THREE.DoubleSide })); rimIn.position.y = 0.28; g.add(rimIn);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; at(g, box(0.04, 0.26, 0.04, col(0x5a3a22)), Math.cos(a) * (R - 0.16), 0.14, Math.sin(a) * (R - 0.16)); }
  const seats = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.1;
    const cx = Math.cos(a) * (R + 0.2), cz = Math.sin(a) * (R + 0.2);
    const ch = new THREE.Group(); ch.position.set(cx, 0, cz); ch.rotation.y = -a - Math.PI / 2; g.add(ch);
    at(ch, box(0.16, 0.03, 0.16, col(0x7a2e2e)), 0, 0.17, 0);
    at(ch, box(0.16, 0.2, 0.03, col(0x7a2e2e)), 0, 0.28, -0.08);
    for (const [x, z] of [[-0.07, -0.07], [0.07, -0.07], [-0.07, 0.07], [0.07, 0.07]]) at(ch, box(0.02, 0.17, 0.02, DARK()), x, 0.085, z);
    // Микрофон и табелка на масата.
    const mx = Math.cos(a) * (R - 0.1), mz = Math.sin(a) * (R - 0.1);
    at(g, cyl(0.004, 0.004, 0.12, DARK(), 4), mx, 0.36, mz);
    at(g, box(0.1, 0.035, 0.01, col(0xf2efe6)), Math.cos(a) * (R - 0.04), 0.33, Math.sin(a) * (R - 0.04), -a + Math.PI / 2);
    seats.push({ x: Math.cos(a) * (R + 0.14), z: Math.sin(a) * (R + 0.14), ry: -a - Math.PI / 2 });
  }
  // Цветя в средата.
  at(g, cyl(0.12, 0.09, 0.12, col(0xd8d0c0), 12), 0, 0.12, 0);
  for (let i = 0; i < 7; i++) at(g, sph(0.05, col([0xd62612, 0xf2efe6, 0xf2c230][i % 3]), 8, 6), Math.cos(i) * 0.08, 0.24 + (i % 2) * 0.04, Math.sin(i) * 0.08);
  g.userData.seats = seats;
  return g;
}
// Урна: дървена кутия с процеп и печат.
export function ballotBox(k = 1) {
  const g = new THREE.Group();
  at(g, box(0.22 * k, 0.24 * k, 0.18 * k, col(0x8a5a32)), 0, 0.12 * k, 0);
  at(g, box(0.1 * k, 0.006, 0.015 * k, DARK()), 0, 0.243 * k, 0);
  at(g, box(0.05 * k, 0.05 * k, 0.005, col(0xb02a20)), 0.06 * k, 0.17 * k, 0.092 * k);
  return g;
}
// Избирателна секция: училищна сграда в разрез (без предна стена) с кабина със завеса,
// маса на комисията, урна, табела „ИЗБИРАТЕЛНА СЕКЦИЯ“. Лицето гледа по +z. userData.curtain, slip.
export function pollingStation({ w = 3.2, d = 1.8, h = 0.95 } = {}) {
  const g = new THREE.Group();
  const wall = CM('plaster', { color: 0xf0d9a8, rep: [3, 1] });
  at(g, box(w, 0.06, d, CM('paving', { color: 0xc9b9a0, rep: [3, 2] })), 0, 0.03, 0);
  at(g, box(w, h, 0.1, wall), 0, h / 2, -d / 2);
  for (const s of [-1, 1]) at(g, box(0.1, h, d, wall), s * w / 2, h / 2, 0);
  // Предна стена — само ниска част и ъгли, за да се вижда вътре.
  for (const s of [-1, 1]) at(g, box(0.5, h, 0.1, wall), s * (w / 2 - 0.25), h / 2, d / 2);
  at(g, box(w, 0.2, 0.1, wall), 0, h - 0.1, d / 2);
  at(g, box(w + 0.12, 0.06, d + 0.12, col(0xd8d0bc)), 0, h + 0.03, 0);
  for (let i = 0; i < 4; i++) { const x = -w / 2 + 0.5 + i * (w - 1) / 3; at(g, box(0.36, 0.42, 0.02, GLASS()), x, 0.55, -d / 2 + 0.06); }
  const sg = sign('ИЗБИРАТЕЛНА СЕКЦИЯ', { w: 1.5, h: 0.17, bg: '#f6f2e8', fg: '#1d3f6e' }); at(g, sg, 0, h + 0.17, d / 2 + 0.04);
  // Кабина със завеса.
  at(g, box(0.5, 0.02, 0.5, DARK()), -0.9, 0.62, -0.35);
  for (const [x, z] of [[-1.15, -0.6], [-0.65, -0.6], [-1.15, -0.1], [-0.65, -0.1]]) at(g, box(0.02, 0.6, 0.02, DARK()), x, 0.33, z);
  const curtain = box(0.5, 0.48, 0.01, col(0x8a2a2a, { side: THREE.DoubleSide })); at(g, curtain, -0.9, 0.36, -0.1);
  at(g, box(0.3, 0.02, 0.2, col(0x8a6a4a)), -0.9, 0.3, -0.5);
  // Маса на комисията.
  at(g, box(1.1, 0.04, 0.4, col(0x8a6a4a)), 0.5, 0.28, -0.45);
  at(g, box(1.1, 0.26, 0.02, col(0xf2efe6)), 0.5, 0.15, -0.26);
  for (let i = 0; i < 6; i++) at(g, box(0.1, 0.006, 0.07, col(0xf8f6f0)), 0.1 + i * 0.16, 0.305, -0.45);
  const urn = ballotBox(1.1); urn.position.set(1.2, 0.06, 0.2); g.add(urn);
  const slip = box(0.08, 0.004, 0.06, col(0xfdfcf6)); slip.visible = false; g.add(slip);
  g.userData = { curtain, slip, urn };
  return g;
}
// Конституцията на пулт: отворена книга с надпис.
export function constitutionStand() {
  const g = new THREE.Group();
  at(g, box(0.36, 0.06, 0.3, M(0xf2ece0, { tex: 'marble' })), 0, 0.03, 0);
  at(g, cyl(0.04, 0.06, 0.42, M(0xf2ece0, { tex: 'marble' }), 10), 0, 0.27, 0);
  const top = new THREE.Group(); top.position.set(0, 0.5, 0); top.rotation.x = -0.45; g.add(top);
  at(top, box(0.5, 0.03, 0.36, col(0x6a1e1e)), 0, 0, 0);
  const pageM = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 360;
    const x = c.getContext('2d');
    x.fillStyle = '#f8f3e6'; x.fillRect(0, 0, 512, 360);
    x.fillStyle = '#2a2218'; x.textAlign = 'center';
    x.font = 'bold 30px Georgia, serif'; x.fillText('КОНСТИТУЦИЯ', 128, 120); x.fillText('НА РЕПУБЛИКА', 128, 160); x.fillText('БЪЛГАРИЯ', 128, 200);
    x.font = '22px Georgia, serif'; x.fillText('1991', 128, 250);
    x.fillStyle = 'rgba(40,30,20,0.55)'; for (let i = 0; i < 12; i++) x.fillRect(290, 70 + i * 20, 180 - (i % 3) * 20, 5);
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(254, 0, 4, 360);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
  })();
  at(top, box(0.46, 0.012, 0.32, pageM), 0, 0.022, 0);
  return g;
}

// ---------- схема на държавното устройство (Конституцията от 1991 г.) ----------
// Подиум с шест части; всяка има pickId `org-<id>` и котва за балонче. Гражданите са отпред.
export const ORGANS = [
  { id: 'ns', label: 'Народно събрание' },
  { id: 'pres', label: 'Президент' },
  { id: 'ms', label: 'Министерски съвет' },
  { id: 'court', label: 'Съдебна власт' },
  { id: 'ks', label: 'Конституционен съд' },
  { id: 'obsh', label: 'Общини' },
];
export function stateDiagram() {
  const g = new THREE.Group();
  const plinth = M(0xf2ece0, { tex: 'marble', rep: [2, 1] });
  const parts = new Map();
  const anchors = new Map();
  const part = (id, x, z, build) => {
    const p = new THREE.Group(); p.position.set(x, 0, z); g.add(p);
    at(p, cyl(0.85, 0.9, 0.12, plinth, 24), 0, 0.06, 0);
    build(p);
    const L = ORGANS.find((o) => o.id === id).label;
    const lbl = labelSprite(L, { size: 0.26, color: '#1b2a3a', bg: 'rgba(255,255,255,0.92)', border: '#9fb3c8' });
    lbl.position.set(0, { ns: 1.55, pres: 1.6, ms: 1.55, court: 1.1, ks: 1.0, obsh: 1.25 }[id], 0); p.add(lbl);
    const hit = new THREE.Mesh(G('orgHit', () => new THREE.CylinderGeometry(0.9, 0.9, 1.3, 12)), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.6; hit.userData.isHitBox = true; p.add(hit);
    p.userData = { pickId: `org-${id}`, label: lbl };
    const a = new THREE.Object3D(); a.position.set(x, 1.0, z); g.add(a); anchors.set(id, a);
    parts.set(id, p);
  };
  // Народното събрание: полукръгла зала с 240 места.
  part('ns', -2.0, -1.0, (p) => {
    const seat = G('nsSeat', () => new THREE.BoxGeometry(0.035, 0.03, 0.035));
    const inst = new THREE.InstancedMesh(seat, col(0x2f5f9a), 240);
    const m4 = new THREE.Matrix4(); let k = 0;
    const rows = [36, 40, 44, 48, 52, 20];
    rows.forEach((n, r) => {
      const R = 0.25 + r * 0.09;
      const cnt = r === 5 ? 20 : n;
      for (let i = 0; i < cnt && k < 240; i++) {
        const a = Math.PI * (0.05 + 0.9 * (i / Math.max(1, cnt - 1)));
        m4.makeTranslation(Math.cos(a) * R, 0.14 + r * 0.035, -Math.sin(a) * R + 0.15);
        inst.setMatrixAt(k++, m4);
      }
    });
    inst.count = k; p.add(inst);
    at(p, box(0.3, 0.12, 0.12, col(0x6b4a2c)), 0, 0.18, 0.28);
    const f = flagPole('bg', { pole: 0.6, w: 0.24, h: 0.16 }); f.position.set(0.4, 0.12, 0.35); p.add(f); (g.userData.flags ||= []).push(f);
  });
  // Президентът: бюро със знамена.
  part('pres', 0, -1.4, (p) => {
    at(p, box(0.5, 0.05, 0.26, col(0x5a3a22)), 0, 0.36, 0);
    at(p, box(0.48, 0.22, 0.03, col(0x5a3a22)), 0, 0.23, -0.1);
    at(p, box(0.2, 0.04, 0.2, col(0x7a2e2e)), 0, 0.28, -0.32); at(p, box(0.2, 0.3, 0.04, col(0x7a2e2e)), 0, 0.42, -0.42);
    for (const [x, k] of [[-0.35, 'bg'], [0.35, 'eu']]) { const f = flagPole(k, { pole: 0.7, w: 0.22, h: 0.15 }); f.position.set(x, 0.12, -0.35); p.add(f); (g.userData.flags ||= []).push(f); }
  });
  // Министерският съвет: дълга маса със столове.
  part('ms', 2.0, -1.0, (p) => {
    at(p, box(0.9, 0.04, 0.32, col(0x6b4a2c)), 0, 0.34, 0);
    for (const [x, z] of [[-0.4, -0.12], [0.4, -0.12], [-0.4, 0.12], [0.4, 0.12]]) at(p, box(0.03, 0.2, 0.03, DARK()), x, 0.22, z);
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { at(p, box(0.1, 0.02, 0.1, col(0x2f4a6a)), -0.34 + i * 0.17, 0.24, s * 0.28); at(p, box(0.1, 0.14, 0.02, col(0x2f4a6a)), -0.34 + i * 0.17, 0.31, s * 0.33); }
    for (let i = 0; i < 6; i++) at(p, box(0.08, 0.005, 0.06, col(0xf8f6f0)), -0.35 + i * 0.14, 0.365, 0.05 * (i % 2 ? 1 : -1));
  });
  // Съдебната власт: сграда с колони и везни.
  part('court', -1.8, 1.2, (p) => {
    const stone = M(0xeee6d4, { tex: 'limestone' });
    at(p, box(0.9, 0.06, 0.5, stone), 0, 0.15, 0);
    for (let i = 0; i < 5; i++) { const c = column('ionic', { h: 0.4, r: 0.03, color: 0xf2ece0 }); c.position.set(-0.36 + i * 0.18, 0.18, 0.15); p.add(c); }
    at(p, box(0.9, 0.4, 0.2, stone), 0, 0.38, -0.12);
    const tri = new THREE.Mesh(G('ctPed', () => new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.48, 0), new THREE.Vector2(0.48, 0), new THREE.Vector2(0, 0.16)]), { depth: 0.5, bevelEnabled: false })), stone);
    tri.position.set(0, 0.6, -0.25); p.add(tri);
    // Везни отгоре.
    const br = col(0xc9a640, { metal: 0.6, rough: 0.35 });
    at(p, cyl(0.01, 0.01, 0.22, br, 6), 0, 0.87, 0.1);
    const beam = at(p, box(0.36, 0.012, 0.012, br), 0, 0.97, 0.1);
    for (const s of [-1, 1]) { at(p, cyl(0.004, 0.004, 0.1, br, 4), s * 0.17, 0.92, 0.1); at(p, cyl(0.05, 0.04, 0.012, br, 12), s * 0.17, 0.87, 0.1); }
    p.userData.beam = beam;
  });
  // Конституционният съд: пиедестал с книгата на Конституцията.
  part('ks', 1.8, 1.2, (p) => {
    at(p, box(0.36, 0.34, 0.36, M(0xf2ece0, { tex: 'marble' })), 0, 0.29, 0);
    const book = new THREE.Group(); book.position.set(0, 0.5, 0); book.rotation.x = -0.3; p.add(book);
    at(book, box(0.34, 0.04, 0.24, col(0x6a1e1e)), 0, 0, 0);
    at(book, box(0.32, 0.02, 0.22, col(0xf8f3e6)), 0, 0.025, 0);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; at(p, sph(0.025, col(0x9a7a3a, { metal: 0.5 }), 6, 4), Math.cos(a) * 0.55, 0.16, Math.sin(a) * 0.55); }
  });
  // Общините: кметство с часовник.
  part('obsh', 0, 2.4, (p) => {
    const wall = CM('plaster', { color: 0xf0d9a8, rep: [1, 1] });
    at(p, box(0.8, 0.4, 0.45, wall), 0, 0.32, 0);
    at(p, box(0.86, 0.04, 0.5, col(0xd8d0bc)), 0, 0.53, 0);
    at(p, box(0.24, 0.3, 0.24, wall), 0, 0.7, 0);
    at(p, cyl(0.07, 0.07, 0.01, col(0xf8f6f0), 16), 0, 0.72, 0.125).rotation.x = Math.PI / 2;
    at(p, new THREE.Mesh(G('obRoof', () => new THREE.ConeGeometry(0.2, 0.2, 4)), col(0x8a3a2a)), 0, 0.95, 0).rotation.y = Math.PI / 4;
    for (let i = 0; i < 4; i++) at(p, box(0.1, 0.14, 0.01, GLASS()), -0.28 + i * 0.19, 0.32, 0.23);
    const f = flagPole('bg', { pole: 0.5, w: 0.2, h: 0.13 }); f.position.set(0.3, 0.54, 0); p.add(f); (g.userData.flags ||= []).push(f);
  });
  // Стрелки „избират“: от гражданите (отпред) към Народното събрание, президента и общините.
  const arrowM = col(0x2f7de1);
  const arrow = (a, b) => {
    const v = new THREE.Vector3().subVectors(b, a); const len = v.length();
    const ar = new THREE.Group(); ar.position.copy(a); ar.lookAt(b); g.add(ar);
    const shaft = cyl(0.03, 0.03, len - 0.18, arrowM, 6); shaft.rotation.x = Math.PI / 2; shaft.position.z = (len - 0.18) / 2; ar.add(shaft);
    const head = new THREE.Mesh(G('arHead', () => new THREE.ConeGeometry(0.08, 0.18, 8)), arrowM); head.rotation.x = Math.PI / 2; head.position.z = len - 0.09; ar.add(head);
    return ar;
  };
  const C0 = new THREE.Vector3(0, 0.15, 4.0);
  const arrows = [arrow(C0.clone().add(new THREE.Vector3(-0.5, 0, -0.3)), new THREE.Vector3(-1.8, 0.15, -0.1)), arrow(C0.clone().add(new THREE.Vector3(0.3, 0, -0.4)), new THREE.Vector3(0.1, 0.15, -0.5)), arrow(C0.clone().add(new THREE.Vector3(0, 0, -0.35)), new THREE.Vector3(0, 0.15, 3.2))];
  arrows[2].visible = false; // скрита: общините са точно пред гражданите
  const vote = labelSprite('Гражданите избират', { size: 0.24, color: '#ffffff', bg: 'rgba(47,125,225,0.92)', border: 'rgba(0,0,0,0)' });
  vote.position.set(0, 0.9, 4.0); g.add(vote);
  g.userData.parts = parts; g.userData.anchors = anchors; g.userData.citizens = C0; g.userData.arrows = arrows;
  return g;
}

// ---------- градът (в метри) ----------
const PAINT = (c) => col(c, { rough: 0.7 });
// Магазин от 80-те: бетонна сграда със стъклена витрина, рафтове вътре, табела.
// userData.setFill(k): 0 — празни рафтове, 1 — пълни; userData.priceBoard — табло за цените.
export function shop({ w = 12, d = 7, h = 3.6, label = 'ХРАНИТЕЛНИ СТОКИ' } = {}) {
  const g = new THREE.Group();
  const wall = CM('plaster', { color: 0xd9d4c6, rep: [4, 1] });
  at(g, box(w, 0.2, d, col(0x9a9890)), 0, 0.1, 0);
  at(g, box(w, h, 0.25, wall), 0, h / 2, -d / 2);
  for (const s of [-1, 1]) at(g, box(0.25, h, d, wall), s * w / 2, h / 2, 0);
  at(g, box(w + 0.4, 0.5, d + 0.4, col(0xc8c2b4)), 0, h + 0.25, 0);
  // Витрина: рамки и стъкло (прозрачно, за да се вижда вътре).
  const glass = new THREE.MeshStandardMaterial({ color: 0xbfd8e8, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.25, depthWrite: false });
  at(g, box(w - 0.5, h - 0.9, 0.05, glass), 0, 0.6 + (h - 0.9) / 2, d / 2);
  for (let i = 0; i <= 6; i++) at(g, box(0.1, h - 0.6, 0.12, col(0x6a6e72, { metal: 0.4 })), -w / 2 + 0.25 + i * (w - 0.5) / 6, 0.3 + (h - 0.6) / 2, d / 2);
  at(g, box(w - 0.4, 0.6, 0.2, wall), 0, 0.3, d / 2);
  at(g, box(w, 0.3, 0.2, wall), 0, h - 0.15, d / 2);
  const sg = sign(label, { w: w * 0.7, h: 0.8, bg: '#f6f2e8', fg: '#1d3f6e' }); at(g, sg, 0, h + 0.4, d / 2 + 0.25);
  // Рафтове по задната стена и в средата.
  const shelfM = col(0xb8b2a6, { metal: 0.3 });
  const shelves = [];
  for (const [z, ry] of [[-d / 2 + 0.5, 0], [-0.3, 0]]) {
    for (let k = 0; k < 4; k++) at(g, box(w - 1.6, 0.05, 0.6, shelfM), 0, 0.5 + k * 0.6, z);
    for (const x of [-(w - 1.6) / 2, (w - 1.6) / 2]) at(g, box(0.06, 2.4, 0.6, shelfM), x, 1.4, z);
    shelves.push(z);
  }
  // Стоките (много еднакви кутии).
  const goodsGeo = G('goods', () => new THREE.BoxGeometry(0.28, 0.36, 0.28));
  const N = 160;
  const goods = new THREE.InstancedMesh(goodsGeo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), N);
  const palette = [0xc0392b, 0xf2c230, 0x2f8f5a, 0x2f6fb0, 0xe67e22, 0xf2efe6, 0x8e44ad];
  const m4 = new THREE.Matrix4(); const cc = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const z = shelves[i % 2], k = Math.floor(i / 2) % 4, j = Math.floor(i / 8);
    m4.makeTranslation(-(w - 1.6) / 2 + 0.3 + j * ((w - 2.2) / 19), 0.72 + k * 0.6, z);
    goods.setMatrixAt(i, m4); goods.setColorAt(i, cc.setHex(palette[(i * 7 + k) % palette.length]));
  }
  g.add(goods);
  // Касата.
  at(g, box(1.4, 0.9, 0.6, col(0x8a7a6a)), w / 2 - 1.4, 0.45, d / 2 - 1.2);
  at(g, box(0.4, 0.25, 0.35, col(0x3a3d40)), w / 2 - 1.4, 1.02, d / 2 - 1.2);
  // Табло с цените (над вратата).
  const pc = document.createElement('canvas'); pc.width = 256; pc.height = 128;
  const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace;
  const board = box(2.2, 1.1, 0.06, new THREE.MeshStandardMaterial({ map: pt, roughness: 0.8 }));
  at(g, board, -w / 2 + 2.2, h - 0.85, d / 2 + 0.15);
  const drawPrice = (mode) => {
    const x = pc.getContext('2d');
    x.fillStyle = '#1f2a24'; x.fillRect(0, 0, 256, 128);
    x.strokeStyle = '#c9b77a'; x.lineWidth = 4; x.strokeRect(4, 4, 248, 120);
    x.fillStyle = '#f2efe6'; x.font = 'bold 26px Arial, sans-serif'; x.textAlign = 'center';
    if (mode === 'fixed') { x.fillText('ЦЕНИТЕ', 128, 48); x.font = 'bold 22px Arial, sans-serif'; x.fillText('ОПРЕДЕЛЯ ДЪРЖАВАТА', 128, 88); }
    else if (mode === 'open') { x.fillStyle = '#9fe0a8'; x.font = 'bold 34px Arial, sans-serif'; x.fillText('ОТВОРЕНО', 128, 76); }
    else { x.fillText('ЦЕНИТЕ', 128, 44); x.fillStyle = '#ff8a7a'; x.font = 'bold 30px Arial, sans-serif'; x.fillText('▲ РАСТАТ', 128, 92); }
    pt.needsUpdate = true;
  };
  drawPrice('fixed');
  let fill = 1;
  g.userData = {
    goods, board, drawPrice,
    setFill(k) { fill = k; goods.count = Math.round(N * k); },
    get fill() { return fill; },
    door: new THREE.Vector3(w / 2 - 1.6, 0, d / 2 + 0.4),
  };
  return g;
}
// Частна будка: малка постройка с прозорче, сенник и табела. Лицето гледа по +z.
export function kiosk({ label = 'ЗАКУСКИ', color = 0x2f8f5a } = {}) {
  const g = new THREE.Group();
  at(g, box(2.4, 2.4, 1.8, PAINT(0xf2efe6)), 0, 1.2, 0);
  at(g, box(2.6, 0.12, 2.0, col(color)), 0, 2.46, 0);
  at(g, box(1.4, 0.8, 0.04, GLASS()), 0, 1.4, 0.91);
  at(g, box(1.6, 0.08, 0.5, col(0x8a6a4a)), 0, 0.95, 1.1);
  const awn = box(2.6, 0.06, 0.9, col(color)); awn.rotation.x = 0.35; at(g, awn, 0, 2.15, 1.25);
  const sg = sign(label, { w: 2.2, h: 0.42, bg: '#ffffff', fg: '#' + color.toString(16).padStart(6, '0') }); at(g, sg, 0, 2.75, 0.92);
  for (let i = 0; i < 5; i++) at(g, box(0.18, 0.22, 0.14, col([0xc0392b, 0xf2c230, 0x2f6fb0, 0xe67e22, 0x8e44ad][i])), -0.6 + i * 0.3, 1.1, 1.1);
  return g;
}
// Кафене на тротоара: маси с чадъри.
export function cafe(n = 3) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const t = new THREE.Group(); t.position.set(i * 2.2, 0, 0); g.add(t);
    at(t, cyl(0.45, 0.45, 0.05, col(0xf2efe8), 14), 0, 0.75, 0);
    at(t, cyl(0.04, 0.04, 0.75, col(0x3a3f44), 6), 0, 0.37, 0);
    at(t, cyl(0.03, 0.03, 2.2, col(0xdddddd), 6), 0, 1.1, 0);
    at(t, new THREE.Mesh(G('cafeUmb', () => new THREE.ConeGeometry(1.2, 0.45, 8)), col(i % 2 ? 0xc0392b : 0xf2c230)), 0, 2.25, 0);
    for (const s of [-1, 1]) at(t, box(0.4, 0.45, 0.4, col(0x3a3f44)), s * 0.7, 0.22, 0);
  }
  return g;
}
// Завод: дълго хале с назъбен покрив, комин, порта с табела. userData.chimneyTop, setSign(text).
export function factory({ w = 26, d = 12, h = 6 } = {}) {
  const g = new THREE.Group();
  const brick = CM('stoneBrick', { color: 0xc89a7a, rep: [8, 2] });
  at(g, box(w, h, d, brick), 0, h / 2, 0);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const tooth = new THREE.Mesh(G(`saw${w / n},${d}`, () => { const s = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(w / n, 0), new THREE.Vector2(w / n, 2.2)]); const e = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); e.translate(-w / n / 2, 0, -d / 2); return e; }), col(0x7a7e82));
    tooth.position.set(-w / 2 + w / n / 2 + i * (w / n), h, 0); g.add(tooth);
    at(g, box(0.06, 2.0, d - 0.4, GLASS()), -w / 2 + (i + 1) * (w / n) - 0.05, h + 1.05, 0);
  }
  for (let i = 0; i < 9; i++) at(g, box(1.6, 2.2, 0.06, GLASS()), -w / 2 + 2 + i * ((w - 4) / 8), h * 0.55, d / 2 + 0.02);
  const gate = box(4, 3.6, 0.1, col(0x4a5a4a, { metal: 0.3 })); at(g, gate, w / 2 - 4, 1.8, d / 2 + 0.05);
  const chim = new THREE.Group(); chim.position.set(-w / 2 + 3, 0, -d / 2 - 2); g.add(chim);
  at(chim, box(2.2, 1.4, 2.2, col(0xa88a72)), 0, 0.7, 0);
  at(chim, cyl(0.7, 1.1, 22, CM('stoneBrick', { color: 0xb07a5a, rep: [2, 10] }), 12), 0, 11, 0);
  for (const y of [8, 15, 21]) at(chim, cyl(1.0 - y * 0.012, 1.0 - y * 0.012, 0.4, col(0xe8e2d6), 12), 0, y, 0);
  let signMesh = sign('ДЪРЖАВЕН ЗАВОД', { w: 9, h: 1.1, bg: '#f2efe6', fg: '#7a1e14' });
  at(g, signMesh, 0, h - 1.2, d / 2 + 0.08);
  g.userData = {
    chimneyTop: new THREE.Vector3(-w / 2 + 3, 22.3, -d / 2 - 2),
    gate: new THREE.Vector3(w / 2 - 4, 0, d / 2 + 1),
    setSign(text, fg = '#7a1e14') { signMesh.material = sign(text, { w: 9, h: 1.1, bg: '#f2efe6', fg }).material; },
  };
  return g;
}
// Бюро по труда.
export function laborOffice() {
  const g = new THREE.Group();
  at(g, box(8, 3.4, 6, CM('plaster', { color: 0xe6dcc6, rep: [3, 1] })), 0, 1.7, 0);
  at(g, box(8.4, 0.3, 6.4, col(0xb8b2a6)), 0, 3.55, 0);
  for (let i = 0; i < 4; i++) at(g, box(1.2, 1.4, 0.06, GLASS()), -2.7 + i * 1.8, 2.0, 3.02);
  at(g, box(1.4, 2.2, 0.06, col(0x5a4a3a)), 2.6, 1.1, 3.03);
  at(g, sign('БЮРО ПО ТРУДА', { w: 5.4, h: 0.8, bg: '#f6f2e8', fg: '#1d3f6e' }), -0.6, 2.95, 3.06);
  g.userData.door = new THREE.Vector3(2.6, 0, 3.6);
  return g;
}
// Табела за проект с европейски средства (на два крака). Лицето гледа по +z.
export function euBillboard(lines = ['ПРОЕКТ, ФИНАНСИРАН', 'ОТ ЕВРОПЕЙСКИЯ СЪЮЗ']) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) at(g, cyl(0.08, 0.08, 4.2, col(0x6a6e72, { metal: 0.4 }), 8), s * 2.4, 2.1, 0);
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 512, 256);
  x.fillStyle = '#003399'; x.fillRect(20, 30, 150, 100);
  x.fillStyle = '#ffcc00'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; star(x, 95 + Math.cos(a) * 34, 80 + Math.sin(a) * 34, 6); }
  x.fillStyle = '#003399'; x.font = 'bold 26px Arial, sans-serif'; x.textAlign = 'left';
  lines.forEach((l, i) => x.fillText(l, 190, 70 + i * 40, 310));
  x.fillStyle = '#c0392b'; x.fillRect(20, 160, 472, 6);
  x.fillStyle = '#2a2a2a'; x.font = '24px Arial, sans-serif'; x.fillText('Пример за табела на обект', 20, 210);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  at(g, box(5.4, 2.7, 0.1, new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 })), 0, 3.0, 0);
  return g;
}
// Училище: двуетажна сграда. userData.setNew(bool) — обновена фасада, нови прозорци, без скеле.
export function school() {
  const g = new THREE.Group();
  const oldW = CM('plaster', { color: 0xb8ad98, rep: [5, 2] }), newW = CM('plaster', { color: 0xf2d79a, rep: [5, 2] });
  const body = box(20, 7, 9, oldW); at(g, body, 0, 3.5, 0);
  at(g, box(20.6, 0.4, 9.6, col(0x8a8a86)), 0, 7.2, 0);
  const wins = [];
  for (let f = 0; f < 2; f++) for (let i = 0; i < 8; i++) wins.push(at(g, box(1.4, 1.6, 0.06, col(0x4a5560, { rough: 0.4 })), -8.4 + i * 2.4, 2 + f * 3.2, 4.52));
  at(g, sign('УЧИЛИЩЕ', { w: 4.4, h: 0.8, bg: '#f6f2e8', fg: '#1d3f6e' }), 0, 6.5, 4.56);
  // Скеле.
  const scaf = new THREE.Group(); g.add(scaf);
  const pipe = col(0x9a9ea2, { metal: 0.6, rough: 0.4 });
  for (let i = 0; i <= 10; i++) at(scaf, cyl(0.05, 0.05, 7.4, pipe, 5), -10 + i * 2, 3.7, 5.4);
  for (let f = 1; f <= 3; f++) { at(scaf, box(20, 0.06, 0.06, pipe), 0, f * 2.4, 5.4); at(scaf, box(20, 0.05, 0.7, col(0x9a7a4a)), 0, f * 2.4 - 0.05, 5.1); }
  g.userData = {
    scaf,
    setNew(on) { body.material = on ? newW : oldW; scaf.visible = !on; for (const w of wins) w.material = on ? col(0x9fc3d8, { rough: 0.15, metal: 0.3 }) : col(0x4a5560, { rough: 0.4 }); },
  };
  return g;
}
// Граничен пункт: будка, бариера, табела със звездите на ЕС. userData.barrier (въртене около z).
export function borderPost(name = 'РУМЪНИЯ') {
  const g = new THREE.Group();
  // Будката е встрани от пътя (−z), бариерата пресича пътя по +z, табелата е от другата страна.
  at(g, box(3, 2.6, 2.4, PAINT(0xe8e2d6)), -1, 1.3, -6.5);
  at(g, box(3.4, 0.2, 2.8, col(0x3a6aa0)), -1, 2.7, -6.5);
  at(g, box(1.4, 1, 0.05, GLASS()), -1, 1.6, -5.28);
  const pivot = new THREE.Group(); pivot.position.set(0, 1.1, -4.4); g.add(pivot);
  at(pivot, box(0.16, 0.16, 8.4, col(0xffffff)), 0, 0, 4.2);
  for (let i = 0; i < 7; i++) at(pivot, box(0.17, 0.17, 0.5, col(0xc0392b)), 0, 0, 0.8 + i * 1.1);
  at(g, box(0.4, 1.1, 0.4, col(0x6a6e72)), 0, 0.55, -4.4);
  const c = document.createElement('canvas'); c.width = 256; c.height = 192;
  const x = c.getContext('2d');
  x.fillStyle = '#003399'; x.fillRect(0, 0, 256, 192);
  x.fillStyle = '#ffcc00'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; star(x, 128 + Math.cos(a) * 46, 78 + Math.sin(a) * 46, 8); }
  x.fillStyle = '#ffffff'; x.font = 'bold 34px Arial, sans-serif'; x.textAlign = 'center'; x.fillText(name, 128, 160);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  at(g, cyl(0.06, 0.06, 3.2, col(0x6a6e72), 6), -6, 1.6, 5.2);
  at(g, box(2.2, 1.65, 0.06, new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })), -6, 3.0, 5.2, -Math.PI / 2);
  g.userData.barrier = pivot;
  return g;
}
// Камион (дължина по x).
export function truck(color = 0x2f6fb0) {
  const g = new THREE.Group();
  at(g, box(2.2, 2.6, 2.4, col(color, { rough: 0.4 })), 4.2, 1.7, 0);
  at(g, box(0.06, 1.0, 2.0, GLASS()), 5.32, 2.3, 0);
  at(g, box(7, 3.0, 2.5, col(0xe8e6e0)), -0.6, 2.0, 0);
  at(g, box(6.6, 0.6, 2.52, col(0x003399)), -0.6, 2.6, 0);
  const wheels = [];
  for (const xx of [-3.2, -2.0, 4.2]) for (const s of [-1, 1]) { const w = cyl(0.5, 0.5, 0.3, col(0x1d1d1f), 14); w.rotation.x = Math.PI / 2; w.position.set(xx, 0.5, s * 1.1); g.add(w); wheels.push(w); }
  g.userData = { wheels, r: 0.5 };
  return g;
}
// Асфалтов път по x: ширина w, с прекъсната осева линия.
export function road(len, { w = 8, lanes = 2 } = {}) {
  const g = new THREE.Group();
  at(g, box(len, 0.06, w, col(0x4a4c50, { rough: 0.95 })), 0, 0.03, 0);
  for (let x = -len / 2 + 1; x < len / 2 - 1; x += 4) at(g, box(2, 0.01, 0.15, col(0xf2f2f2)), x + 1, 0.065, 0);
  if (lanes > 2) for (const s of [-1, 1]) at(g, box(len, 0.01, 0.15, col(0xf2f2f2)), 0, 0.065, s * (w / 2 - 0.4));
  return g;
}
