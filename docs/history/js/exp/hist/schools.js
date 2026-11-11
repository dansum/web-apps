// Три средища на знанието през Средновековието, събрани като музей на открито:
// университет (Болоня, XIII в.), Търновската книжовна школа (XIV в.) и учебното средище във Фес (IX–X в., извън програмата на МОН).
// Мерките са в метри. Местата, които се щракат, са с ярки материали; дворовете и стените са приглушени.
import { THREE } from '../../kit.js';
import { Batch, box, cyl, dome, gable, gableEnds, hip, archWall, materials, ownSet, groundTex, rng, figure, stride } from './build.js';
import { church, merlons, windowAt } from './tarnovo-places.js';
import { sky } from './roman.js';

const PI = Math.PI;
const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };

// Дворовете: център, размер и порта (на южната стена).
export const YARDS = {
  uni: { x: 0, z: -24, w: 44, d: 36, title: 'Университет · Болоня, XIII век' },
  bg: { x: 54, z: -22, w: 30, d: 28, title: 'Търновска книжовна школа · XIV век' },
  fes: { x: -54, z: -22, w: 28, d: 26, title: 'Фес, Мароко · IX–X век  ⚠ извън програмата' },
};
for (const y of Object.values(YARDS)) y.gate = [y.x, y.z + y.d / 2];
const ROAD_Z = 4;

// Места за разглеждане. yard: към кой двор принадлежат; off: не е по програмата на МОН.
export const SITES = {
  lecture: { yard: 'uni', x: 0, z: -36, ry: 0, stand: [0, -26], pitch: 0.02, top: [[0, 3, -34], [0, 13, 20]] },
  faculties: { yard: 'uni', x: -20.4, z: -26, ry: PI / 2, stand: [-11, -26], pitch: -0.05, top: [[-19, 3, -26], [15, 10, 9]] },
  students: { yard: 'uni', x: 0, z: -17, ry: 0, stand: [0, -10.5], pitch: 0.08, top: [[0, 1.5, -17], [0, 9, 13]] },
  library: { yard: 'uni', x: 20.4, z: -26, ry: -PI / 2, stand: [11, -26], pitch: 0.02, top: [[19, 2.5, -26], [-14, 9, 9]] },
  scriptorium: { yard: 'bg', x: 61, z: -27, ry: 0, stand: [61, -18.5], pitch: 0.05, top: [[61, 2.5, -26], [-4, 10, 15]] },
  evtimiy: { yard: 'bg', x: 47, z: -17, ry: 0, stand: [47, -12.5], pitch: 0.06, top: [[47, 1.8, -17], [3, 6, 9]] },
  fes: { yard: 'fes', off: true, x: -54, z: -26, ry: 0, stand: [-47.2, -24.6], pitch: 0.12, top: [[-54, 1.5, -26], [13, 9, 9]] },
};

function sign(text, w, h, { bg = '#f3ead2', fg = '#3a2a1c', band = null } = {}) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round(512 * h / w);
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  if (band) { g.fillStyle = band; g.fillRect(0, 0, c.width, c.height * 0.16); g.fillRect(0, c.height * 0.84, c.width, c.height * 0.16); }
  g.strokeStyle = '#6b4a2e'; g.lineWidth = 8; g.strokeRect(4, 4, c.width - 8, c.height - 8);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = c.height * 0.5;
  g.font = `800 ${size}px system-ui, "Segoe UI", Roboto, Arial, sans-serif`;
  while (g.measureText(text).width > c.width - 36 && size > 10) { size -= 2; g.font = `800 ${size}px system-ui, "Segoe UI", Roboto, Arial, sans-serif`; }
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  m.castShadow = true;
  return m;
}
function sit(f, y = 0) { f.userData.legs.forEach((l) => { l.rotation.x = -1.35; }); f.position.y = y - 0.38; return f; }
function book(f, M, x, y, z, ry = 0, color = M.red) { f.box(color, 0.34, 0.07, 0.25, x, y, z, ry).box(M.white, 0.3, 0.05, 0.22, x, y + 0.012, z + 0.01, ry); }

// ---- Места в университета ----
function lecture(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.wood, 16, 0.3, 7.5, 0, 0, -1.2).box(M.banded, 17, 7, 0.6, 0, 0, -5.2).box(M.banded, 0.6, 7, 6.4, -8.2, 0, -2.2).box(M.banded, 0.6, 7, 6.4, 8.2, 0, -2.2);
  f.add(M.tiles, gable(18.6, 8.4, 2.6), 0, 7, -2.2).add(M.banded, gableEnds(17, 7, 2.6), 0, 7, -2.2);
  for (const x of [-8.2, -2.8, 2.8, 8.2]) f.add(M.white, cyl(0.3, 6.4, 10), x, 0.3, 1.1).box(M.white, 0.9, 0.3, 0.9, x, 6.7, 1.1);
  f.box(M.banded, 17, 0.6, 0.7, 0, 6.6, 1.1);
  // Катедра с навес: оттук магистърът чете.
  f.box(M.wood, 2.2, 1.2, 1.4, 0, 0.3, -3.6).box(M.wood, 2.4, 0.12, 1.6, 0, 1.5, -3.6).box(M.wood, 2.2, 2.6, 0.14, 0, 1.5, -4.3).box(M.wood, 2.6, 0.14, 1.7, 0, 4.1, -3.7).box(M.red, 1.6, 0.9, 0.05, 0, 2.6, -4.2);
  f.box(M.wood, 0.9, 0.06, 0.6, 0, 2.55, -3.0, 0, 0.5).box(M.wood, 0.1, 1.0, 0.1, 0, 1.62, -3.05);
  book(f, M, 0, 2.62, -2.98, 0, M.blue);
  for (const z of [-1.2, 0.2]) { f.box(M.wood, 11, 0.12, 0.45, 0, 0.75, z).box(M.wood, 11, 0.1, 0.5, 0, 1.25, z - 0.75); for (const x of [-5.3, 0, 5.3]) f.box(M.wood, 0.14, 0.45, 0.45, x, 0.3, z).box(M.wood, 0.12, 0.95, 0.12, x, 0.3, z - 0.75); }
  for (const x of [-7, 7]) windowAt(f, M, x, 3.6, -4.88, 0, 0.8, 2.2);
  const group = B.build();
  const master = figure({ tunic: 0x8a1f2a, long: true, hat: 0x8a1f2a, hair: 0x9a9a9a }); master.position.set(0, 1.62, -3.75); group.add(master);
  const looks = [0x4a5a8a, 0x6a7a4a, 0x7a5a3a, 0x5a3a6a, 0x8a6a3a, 0x3a6a6a, 0x7a4a4a, 0x4a4a4a];
  const pupils = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const p = sit(figure({ tunic: looks[r * 4 + i], long: true, hair: [0x3a2a1c, 0x6a4a2a, 0xb9a36a][i % 3] }), 0.87); p.position.x = -4 + i * 2.7 + r * 0.6; p.position.z = r ? 0.2 : -1.2; p.rotation.y = PI; group.add(p); pupils.push(p); }
  return { group, top: 9.8, obstacles: [{ x: 0, z: -5.2, hw: 8.6, hd: 0.5 }, { x: -8.2, z: -2.2, hw: 0.5, hd: 3.3 }, { x: 8.2, z: -2.2, hw: 0.5, hd: 3.3 }, { x: 0, z: -1.5, hw: 8.2, hd: 3.2 }],
    tick(t) { master.userData.arms[1].rotation.x = -1.1 + Math.sin(t * 2.2) * 0.3; master.rotation.y = Math.sin(t * 0.6) * 0.25; pupils.forEach((p, i) => { p.userData.arms[0].rotation.x = -0.9 + Math.sin(t * 3 + i) * 0.12; p.rotation.y = PI + Math.sin(t * 0.5 + i * 1.3) * 0.12; }); } };
}
export const FACULTIES = [['Свободни изкуства', '#d9a441'], ['Право', '#b23a2e'], ['Медицина', '#4f8a4a'], ['Богословие', '#2f5fa8']];
function faculties(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.banded, 24, 6.2, 0.6, 0, 0, -0.9).add(M.tiles, box(24.6, 0.18, 4.2), 0, 6.1, 0.9, 0, 0.22);
  const group = B.build();
  const doors = [];
  FACULTIES.forEach(([name, col], i) => {
    const x = -8.4 + i * 5.6, s = new Batch(), d = s.frame(x, 0, 0);
    d.box(M.stone, 2.3, 3.5, 0.16, 0, 0, -0.56).box(M.wood, 1.7, 3.0, 0.2, 0, 0, -0.5).box(M.iron, 1.7, 0.1, 0.24, 0, 1.0, -0.5).box(M.iron, 1.7, 0.1, 0.24, 0, 2.2, -0.5).box(M.stone, 2.6, 0.25, 1.0, 0, 0, -0.1);
    group.add(s.build());
    const sg = sign(name, 3.6, 0.9, { band: col }); sg.position.set(x, 4.3, -0.5); group.add(sg);
    doors.push([x, 0.9]);
  });
  const cb = new Batch(), cf = cb.frame();
  for (let i = 0; i < 5; i++) cf.add(M.white, cyl(0.24, 5.6, 10), -11.2 + i * 5.6, 0, 2.6);
  group.add(cb.build());
  group.userData.doors = doors;
  return { group, top: 7.6, obstacles: [{ x: 0, z: -0.9, hw: 12.2, hd: 0.5 }] };
}
function library(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.banded, 24, 6.2, 0.6, 0, 0, -0.9).add(M.tiles, box(24.6, 0.18, 4.2), 0, 6.1, 0.9, 0, 0.22);
  for (const x of [-9, -3, 3, 9]) f.add(M.white, cyl(0.24, 5.6, 10), x, 0, 2.6);
  // Рафт с книги.
  f.box(M.wood, 9, 3.4, 0.5, -5.5, 0, -0.35);
  const cols = [M.red, M.blue, M.green, M.ochre, M.clay, M.dark];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 20; i++) f.box(cols[(i * 3 + r) % 6], 0.16 + (i % 3) * 0.05, 0.5 + ((i + r) % 4) * 0.06, 0.3, -9.6 + i * 0.43, 0.25 + r * 0.8, -0.05);
  // Маси с книги, вързани с верига.
  for (let i = 0; i < 3; i++) {
    const x = 2.5 + i * 3.4;
    f.box(M.wood, 2.2, 0.1, 0.9, x, 1.0, 0.6, 0, 0.3).box(M.wood, 0.14, 1.0, 0.14, x - 0.9, 0, 0.6).box(M.wood, 0.14, 1.0, 0.14, x + 0.9, 0, 0.6).box(M.wood, 2.2, 0.08, 0.5, x, 0.5, 1.6).box(M.wood, 0.1, 0.5, 0.4, x - 0.9, 0, 1.6).box(M.wood, 0.1, 0.5, 0.4, x + 0.9, 0, 1.6);
    book(f, M, x - 0.4, 1.12, 0.62, 0, cols[i]); book(f, M, x + 0.5, 1.12, 0.62, 0, cols[i + 3]);
    f.box(M.iron, 0.03, 0.03, 0.9, x - 0.4, 1.0, 0.15, 0, -0.6).box(M.iron, 0.06, 0.06, 2.0, x, 1.02, -0.25, PI / 2);
  }
  const group = B.build();
  const reader = sit(figure({ tunic: 0x4a5a8a, long: true }), 0.52); reader.position.x = 5.9; reader.position.z = 1.6; reader.rotation.y = PI; group.add(reader);
  return { group, top: 7.6, obstacles: [{ x: 0, z: -0.9, hw: 12.2, hd: 0.5 }, { x: -5.5, z: -0.2, hw: 4.6, hd: 0.5 }, { x: 5.9, z: 1, hw: 4.6, hd: 1.1 }], tick(t) { reader.userData.arms[0].rotation.x = -0.9 + Math.sin(t * 0.8) * 0.2; } };
}
function students(M) {
  const B = new Batch(), f = B.frame();
  f.add(M.stone, cyl(3.4, 0.14, 20), 0, 0, 0).add(M.cobble, cyl(3.1, 0.16, 20), 0, 0, 0);
  const group = B.build();
  const looks = [{ tunic: 0x2f5fa8, cloak: 0x7a1f1f, long: true, hat: 0x7a1f1f }, { tunic: 0x6a7a4a, long: true, hair: 0xb9a36a }, { tunic: 0x7a3a5a, cloak: 0x24325a, long: true }, { tunic: 0x8a6a2a, long: true, hat: 0x3a3a3a }, { tunic: 0x3a6a6a, long: true, hair: 0x1a120c }];
  const people = looks.map((l, i) => { const a = (i / looks.length) * PI * 2, p = figure(l); p.position.set(Math.sin(a) * 1.5, 0.16, Math.cos(a) * 1.5); p.rotation.y = a + PI; group.add(p); return p; });
  return { group, top: 2.6, obstacles: [{ x: 0, z: 0, r: 2.2 }], tick(t) { people.forEach((p, i) => { p.userData.arms[i % 2].rotation.x = -0.4 + Math.sin(t * 1.6 + i * 1.9) * 0.5; }); } };
}
// ---- Места в Търновската школа ----
function scriptorium(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.stone, 12, 3.2, 4.4, 0, 0, -3.2).box(M.plaster, 12.4, 2.2, 4.8, 0, 3.2, -3.2).box(M.wood, 12.6, 0.24, 5, 0, 3.08, -3.2).add(M.tiles, gable(13.8, 6.2, 2.2), 0, 5.4, -3.2).add(M.plaster, gableEnds(12.4, 4.8, 2.2), 0, 5.4, -3.2);
  f.box(M.wood, 12, 0.2, 4.6, 0, 0, 1.2).add(M.tiles, box(12.8, 0.16, 5.2), 0, 3.4, 1.3, 0, 0.2);
  for (const x of [-5.8, -1.9, 1.9, 5.8]) f.box(M.wood, 0.24, 2.9, 0.24, x, 0.2, 3.3);
  for (const x of [-3.5, 3.5]) windowAt(f, M, x, 4.0, -0.78, 0, 0.8, 1.0, true);
  // Рафт с готови книги на стената.
  f.box(M.wood, 5, 0.1, 0.4, 0, 2.2, -0.8).box(M.wood, 5, 0.1, 0.4, 0, 1.5, -0.8);
  const cols = [M.red, M.blue, M.ochre, M.green, M.clay];
  for (let i = 0; i < 9; i++) { f.box(cols[i % 5], 0.3, 0.45, 0.28, -2.1 + i * 0.52, 2.25, -0.8); if (i % 2) f.box(cols[(i + 2) % 5], 0.45, 0.14, 0.3, -2.1 + i * 0.52, 1.55, -0.8); }
  // Три писалищни маси с пергамент, мастилница и перо.
  for (let i = 0; i < 3; i++) {
    const x = -3.8 + i * 3.8;
    f.box(M.wood, 1.5, 0.08, 0.9, x, 1.05, 1.5, 0, 0.32).box(M.wood, 0.12, 1.0, 0.12, x - 0.6, 0.2, 1.5).box(M.wood, 0.12, 1.0, 0.12, x + 0.6, 0.2, 1.5).box(M.wood, 0.5, 0.5, 0.5, x, 0.2, 2.4);
    f.box(M.white, 0.8, 0.02, 0.6, x - 0.1, 1.14, 1.52, 0, 0.32).add(M.dark, cyl(0.07, 0.12, 8), x + 0.55, 1.0, 1.15).box(M.gold, 0.5, 0.42, 0.06, x - 0.1, 1.42, 1.02, 0, -0.2);
  }
  const group = B.build();
  const monks = [0, 1, 2].map((i) => { const m = sit(figure({ tunic: 0x26262c, long: true, hat: 0x1a1a1e, hair: 0x8a8a8a }), 0.72); m.position.x = -3.8 + i * 3.8; m.position.z = 2.4; m.rotation.y = PI; group.add(m); return m; });
  return { group, top: 8.2, obstacles: [{ x: 0, z: -3.2, hw: 6.4, hd: 2.6 }, { x: 0, z: 1.9, hw: 5, hd: 1.1 }], tick(t) { monks.forEach((m, i) => { m.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 4 + i * 2) * 0.1; m.userData.arms[1].rotation.z = Math.sin(t * 1.1 + i) * 0.15; }); } };
}
function evtimiy(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.stone, 2.6, 0.26, 2.0, 0, 0, 0);
  const group = B.build();
  const S = (hex, o) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, ...o });
  const robe = S(0x1e1e24), mats = [robe];
  const g = new THREE.Group();
  const add = (geo, m, x, y, z, parent = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  add(new THREE.CylinderGeometry(0.2, 0.38, 1.32, 14), robe, 0, 0.66, 0);
  add(new THREE.BoxGeometry(0.2, 1.1, 0.03), S(0xf3eee2), 0, 0.74, 0.3).rotation.x = -0.14; // епитрахил
  for (let i = 0; i < 4; i++) { add(new THREE.BoxGeometry(0.12, 0.03, 0.035), M.dark, 0, 0.4 + i * 0.24, 0.345 - i * 0.033); add(new THREE.BoxGeometry(0.03, 0.12, 0.035), M.dark, 0, 0.4 + i * 0.24, 0.345 - i * 0.033); }
  add(new THREE.BoxGeometry(0.035, 0.16, 0.02), M.gold, 0, 1.2, 0.235); add(new THREE.BoxGeometry(0.1, 0.035, 0.02), M.gold, 0, 1.23, 0.235); // нагръден кръст
  const arms = [-1, 1].map((sx) => { const pv = new THREE.Group(); pv.position.set(sx * 0.25, 1.28, 0); pv.rotation.z = sx * 0.16; g.add(pv); add(new THREE.CylinderGeometry(0.075, 0.11, 0.62, 8).translate(0, -0.31, 0), robe, 0, 0, 0, pv); add(new THREE.SphereGeometry(0.06, 8, 6), M.skin, 0, -0.66, 0, pv); return pv; });
  const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
  add(new THREE.SphereGeometry(0.135, 12, 10), M.skin, 0, 0, 0, head);
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.018, 6, 5), M.dark, sx * 0.05, 0.02, 0.125, head);
  add(new THREE.ConeGeometry(0.13, 0.42, 8), S(0xe6e2da), 0, -0.22, 0.06, head).rotation.x = PI; // дълга бяла брада
  add(new THREE.CylinderGeometry(0.15, 0.14, 0.2, 12), S(0x151518), 0, 0.17, 0, head); // камилавка
  add(new THREE.CylinderGeometry(0.16, 0.24, 0.5, 10, 1, true, PI * 0.6, PI * 0.8), S(0x151518, { side: THREE.DoubleSide }), 0, -0.05, -0.03, head);
  // Жезъл.
  const st = new THREE.Group(); st.position.set(0, -0.66, 0.05);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 6), M.wood); rod.position.y = 0.25; st.add(rod);
  const top = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 12, PI), M.gold); top.position.y = 1.12; st.add(top);
  arms[0].add(st); arms[0].rotation.x = -0.25;
  // Книга в другата ръка.
  const bk = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.07), M.red); bk.position.set(0, -0.62, 0.12); arms[1].add(bk); arms[1].rotation.x = -0.75;
  g.position.y = 0.26; g.scale.setScalar(1.02);
  group.add(g);
  return { group, mats, top: 2.6, obstacles: [{ x: 0, z: 0, r: 0.6 }], tick(t) { g.rotation.y = Math.sin(t * 0.45) * 0.14; head.rotation.y = Math.sin(t * 0.7) * 0.2; } };
}
// ---- Фес (извън програмата на МОН) ----
function fes(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.red, 7.6, 0.06, 5.4, 0, 0, 0).box(M.gold, 7.6, 0.07, 0.14, 0, 0, 2.6).box(M.gold, 7.6, 0.07, 0.14, 0, 0, -2.6).box(M.ochre, 5.2, 0.065, 3.2, 0, 0.005, 0);
  f.add(M.blue, new THREE.SphereGeometry(0.5, 10, 6).scale(1, 0.32, 1), 0, 0.2, -1.6); // възглавница на учителя
  f.box(M.wood, 0.7, 0.05, 0.5, 0, 0.62, -0.75, 0, 0.5).box(M.wood, 0.08, 0.6, 0.4, -0.2, 0.06, -0.8, 0, 0, 0.3).box(M.wood, 0.08, 0.6, 0.4, 0.2, 0.06, -0.8, 0, 0, -0.3); // поставка за книга
  book(f, M, 0, 0.68, -0.73, 0, M.green);
  const group = B.build();
  const turban = (p, col) => { const t = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8).scale(1, 0.75, 1), new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 })); t.position.y = 1.74; p.add(t); };
  const teacher = sit(figure({ tunic: 0xf1ece0, long: true, hair: 0x8a8a8a }), 0.6); teacher.position.z = -1.6; turban(teacher, 0xf5f2ea); group.add(teacher);
  const cols = [0x8a5a2a, 0x3a6a6a, 0x6a3a3a, 0x5a6a3a, 0x4a4a7a];
  const pupils = cols.map((c, i) => { const a = -1.15 + i * 0.575, p = sit(figure({ tunic: c, long: true, hair: 0x1a120c }), 0.42); p.position.x = Math.sin(a) * 2.4; p.position.z = -1.6 + Math.cos(a) * 2.9; p.rotation.y = a + PI; turban(p, [0xf5f2ea, 0xb23a2e, 0xd9a441][i % 3]); group.add(p); return p; });
  return { group, top: 2.4, obstacles: [{ x: 0, z: 0, hw: 3.6, hd: 2.6 }], tick(t) { teacher.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 2) * 0.3; pupils.forEach((p, i) => { p.rotation.y = -1.15 + i * 0.575 + PI + Math.sin(t * 0.6 + i) * 0.1; }); } };
}

export function buildSchools(stage, { weak = false } = {}) {
  const { scene } = stage;
  const V = materials(0), M = materials(0.6);
  const tickers = [], obstacles = [], R = rng(21);

  // ---- Земя, път, небе ----
  const geo = new THREE.PlaneGeometry(700, 700, 70, 70).rotateX(-PI / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv, col = new Float32Array(pos.count * 3), c = new THREE.Color(), a = new THREE.Color(0x8fa367), b = new THREE.Color(0x7b9158);
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), far = Math.max(0, Math.hypot(x, z + 10) - 120); pos.setY(i, far * far * 0.0009 * (0.4 + hash(Math.round(x / 40), Math.round(z / 40)))); uv.setXY(i, x, z); c.copy(a).lerp(b, hash(Math.round(x / 9), Math.round(z / 9))); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: groundTex(), roughness: 1 }));
  terrain.receiveShadow = true; scene.add(terrain);
  const skyDome = sky({ top: 0x5b93d6, bottom: 0xdfe9ee }); skyDome.scale.setScalar(22); scene.add(skyDome);
  const cobble = M.cobble.clone(); cobble.polygonOffset = true; cobble.polygonOffsetFactor = -3; cobble.polygonOffsetUnits = -3;
  const G = new Batch();
  G.frame(0, 0.02, ROAD_Z).box(cobble, 176, 0.08, 6);
  for (const y of Object.values(YARDS)) G.frame(y.gate[0], 0.02, (y.gate[1] + ROAD_Z) / 2).box(cobble, 4.4, 0.08, ROAD_Z - y.gate[1]);
  scene.add(G.build({ cast: false }));

  // ---- Дворове (фон, приглушени) ----
  const S = new Batch();
  const wallRing = (y, mat, h, t, gateW, crenel) => {
    const f = S.frame(y.x, 0, y.z), hw = y.w / 2, hd = y.d / 2, side = (y.w - gateW) / 2;
    const seg = (len, x, z, ry) => { const s = f.sub(x, 0, z, ry); s.box(mat, len, h, t); if (crenel) merlons(s, mat, len, t, h, 2.2, [1.1, 0.8, 0.45]); obstacles.push({ x: y.x + x, z: y.z + z, hw: len / 2, hd: t / 2 + 0.2, ry }); };
    seg(y.w, 0, -hd, 0); seg(y.d, -hw, 0, PI / 2); seg(y.d, hw, 0, PI / 2);
    seg(side, -hw + side / 2, hd, 0); seg(side, hw - side / 2, hd, 0);
    f.add(mat, archWall(gateW + 2, h + 2.6, t + 0.6, gateW - 1, Math.min(h + 0.6, 5.2)), 0, 0, hd);
    return f;
  };
  // Университет: тухлени стени, аркади с колони от двете страни, калдъръмен двор.
  const U = YARDS.uni, fu = wallRing(U, M.banded, 6.2, 0.8, 6, false);
  fu.box(M.cobble, U.w - 1, 0.1, U.d - 1, 0, 0, 0);
  for (const sx of [-1, 1]) for (let z = -15; z <= 15.1; z += 5) { if (Math.abs(z + 2) < 12.5) continue; fu.add(M.white, cyl(0.26, 5.6, 10), sx * 17.6, 0, z); }
  for (const sx of [-1, 1]) { fu.add(M.tiles, box(4.4, 0.18, 8.4), sx * 19.6, 6.1, -13.6, 0, 0, sx * 0.22); fu.add(M.tiles, box(4.4, 0.18, 6.4), sx * 19.6, 6.1, 13.2, 0, 0, sx * 0.22); }
  fu.add(M.stone, cyl(1.1, 0.9, 12), 10, 0, 10).box(M.wood, 0.16, 2.2, 0.16, 9, 0.9, 10).box(M.wood, 0.16, 2.2, 0.16, 11, 0.9, 10).box(M.wood, 2.4, 0.16, 0.16, 10, 3.0, 10);
  obstacles.push({ x: U.x + 10, z: U.z + 10, r: 1.3 });
  // Търновска школа: ниска каменна ограда и манастирска църква.
  const Bg = YARDS.bg, fb = wallRing(Bg, M.stone, 2.4, 0.7, 5, false);
  church(fb.sub(-7, 0, -6), M, 11, 6, 5.2);
  obstacles.push({ x: Bg.x - 7, z: Bg.z - 6, hw: 8.4, hd: 4.4 });
  // Фес: бели стени, аркада със зелен покрив, четириъгълно минаре, шадраван.
  const F = YARDS.fes, ff = wallRing(F, M.plaster, 5, 0.8, 5, true);
  const green = new THREE.MeshStandardMaterial({ color: 0x6a9a86, roughness: 0.6 });
  ff.box(M.plaster, F.w - 1, 0.1, F.d - 1, 0, 0, 0);
  for (let x = -11; x <= 11.1; x += 3.66) ff.add(M.white, cyl(0.24, 3.6, 10), x, 0, -8.6);
  ff.box(M.plaster, F.w - 2, 1.4, 0.5, 0, 3.6, -8.6).add(green, box(F.w - 1.6, 0.2, 4.6), 0, 5.0, -10.6, 0, 0.2);
  const mn = ff.sub(-10.4, 0, 9.4);
  mn.box(M.plaster, 4, 15, 4); merlons(mn, M.plaster, 4, 4, 15, 1.45, [0.8, 0.8, 0.4]); mn.box(M.plaster, 2, 3.4, 2, 0, 15, 0).add(green, dome(1.1, 12), 0, 18.4, 0).box(V.gold, 0.08, 1.0, 0.08, 0, 19.4, 0);
  for (const y of [5, 9.5]) for (const ry of [0, PI / 2, PI, -PI / 2]) windowAt(mn, M, Math.sin(ry) * 2.02, y, Math.cos(ry) * 2.02, ry, 0.5, 1.5);
  obstacles.push({ x: F.x - 10.4, z: F.z + 9.4, hw: 2.3, hd: 2.3 });
  ff.add(M.white, cyl(1.5, 0.5, 8), 8, 0, 7).add(M.white, cyl(0.2, 1.0, 8), 8, 0.5, 7).add(M.white, cyl(0.6, 0.12, 10, 0.2), 8, 1.4, 7);
  obstacles.push({ x: F.x + 8, z: F.z + 7, r: 1.7 });
  scene.add(S.build());
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.35, 8).rotateX(-PI / 2), new THREE.MeshStandardMaterial({ color: 0x4d8fa8, roughness: 0.15, transparent: true, opacity: 0.85 }));
  pool.position.set(F.x + 8, 0.46, F.z + 7); scene.add(pool);
  // Табели над портите.
  for (const [k, y] of Object.entries(YARDS)) { const sg = sign(y.title, k === 'fes' ? 9.6 : 8.4, 1.15, k === 'fes' ? { bg: '#fff3cf', band: '#e0a020' } : {}); sg.position.set(y.gate[0], k === 'bg' ? 5.7 : k === 'uni' ? 9.7 : 8.5, y.gate[1] + 0.75); scene.add(sg); }

  // ---- Местата (ярки, подробни) ----
  const places = new Map();
  const builders = { lecture, faculties, students, library, scriptorium, evtimiy, fes };
  for (const id of Object.keys(SITES)) {
    const s = SITES[id], mats = ownSet(V), built = builders[id](mats);
    built.group.position.set(s.x, 0.1, s.z); built.group.rotation.y = s.ry; built.group.userData.pickId = id;
    scene.add(built.group);
    const cs = Math.cos(s.ry), sn = Math.sin(s.ry);
    for (const o of built.obstacles || []) obstacles.push({ ...o, x: s.x + o.x * cs + o.z * sn, z: s.z - o.x * sn + o.z * cs, ry: s.ry + (o.ry || 0) });
    if (built.tick) tickers.push((dt, t) => built.tick(t));
    places.set(id, { id, group: built.group, mats: Object.values(mats).concat(built.mats || []), x: s.x, y: 0.1, z: s.z, top: built.top, site: s, glow: 0 });
  }
  tickers.push(() => { for (const p of places.values()) for (const m of p.mats) { m.emissive.setHex(0xffd9a0); m.emissiveIntensity = p.glow * 0.07; } });

  // ---- Дървета ----
  const inYard = (x, z, pad) => Object.values(YARDS).some((y) => Math.abs(x - y.x) < y.w / 2 + pad && Math.abs(z - y.z) < y.d / 2 + pad);
  const trunks = [];
  for (let i = 0; trunks.length < (weak ? 50 : 120) && i < 3000; i++) { const x = -150 + R() * 300, z = -120 + R() * 190; if (inYard(x, z, 4) || (Math.abs(z - ROAD_Z) < 6 && Math.abs(x) < 92) || (z > -10 && z < 2 && Object.values(YARDS).some((y) => Math.abs(x - y.x) < 5)) || (z > 9 && z < 40 && Math.abs(x) < 30)) continue; trunks.push([x, z, 0.8 + R() * 0.9, R()]); if (Math.abs(x) < 90 && z > -48 && z < 26) obstacles.push({ x, z, r: 0.5 }); }
  const crownGeo = new THREE.SphereGeometry(1, 9, 7);
  { const p = crownGeo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.82 + hash(p.getX(i) * 3.1, p.getY(i) * 2.7 + p.getZ(i)) * 0.36; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.9, p.getZ(i) * k); } crownGeo.computeVertexNormals(); }
  const trunkM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.26, 3, 6).translate(0, 1.5, 0), new THREE.MeshStandardMaterial({ color: 0x6a5642, roughness: 1 }), trunks.length);
  const crownM = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), trunks.length * 3);
  const m4 = new THREE.Matrix4(), tc = new THREE.Color();
  trunks.forEach(([x, z, s, r], i) => {
    trunkM.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(x, -0.2, z));
    for (let k = 0; k < 3; k++) { const an = r * 6 + k * 2.1, rr = (k ? 1.5 : 2.1) * s; crownM.setMatrixAt(i * 3 + k, m4.makeScale(rr, rr * 0.95, rr).setPosition(x + (k ? Math.cos(an) * 1.1 * s : 0), (3.4 + (k ? 0.2 : 1.1)) * s, z + (k ? Math.sin(an) * 1.1 * s : 0))); crownM.setColorAt(i * 3 + k, tc.setHex(0x6f8a52).lerp(new THREE.Color(0x8ea463), hash(i, k)).multiplyScalar(0.85 + r * 0.25)); }
  });
  trunkM.castShadow = crownM.castShadow = true; scene.add(trunkM, crownM);

  // ---- Хора, които се движат по зададен път (минувачи, студенти, завършили) ----
  const actors = [];
  function send(fig, pts, { speed = 3.2, onEnd, loop = false } = {}) {
    fig.visible = true;
    const a = actors.find((q) => q.fig === fig) || (actors.push({ fig }), actors[actors.length - 1]);
    Object.assign(a, { pts, i: 0, speed, onEnd, loop, dir: 1 });
  }
  tickers.push((dt, t) => {
    for (const a of actors) {
      if (!a.pts) { stride(a.fig, 0, 0); continue; }
      const [tx, tz] = a.pts[a.i], dx = tx - a.fig.position.x, dz = tz - a.fig.position.z, d = Math.hypot(dx, dz), step = a.speed * dt;
      if (d <= step) {
        a.fig.position.x = tx; a.fig.position.z = tz; a.i += a.dir;
        if (a.i >= a.pts.length || a.i < 0) { if (a.loop) { a.dir *= -1; a.i += a.dir * 2; } else { const fn = a.onEnd; a.pts = null; a.onEnd = null; if (fn) fn(); } }
      } else { a.fig.position.x += (dx / d) * step; a.fig.position.z += (dz / d) * step; a.fig.rotation.y = Math.atan2(dx, dz); stride(a.fig, t * 8 + a.fig.id); }
    }
  });
  const walkersLooks = [{ tunic: 0x8a6a4a }, { tunic: 0x6a7a5a, hat: 0xb9a36a }, { tunic: 0x7a4a5a, long: true }, { tunic: 0x5a6a8a, cloak: 0x4a3a2a }];
  walkersLooks.slice(0, weak ? 2 : 4).forEach((l, i) => { const f = figure(l); f.position.set(-70 + i * 40, 0.1, ROAD_Z + (i % 2 ? 1.6 : -1.6)); scene.add(f); send(f, [[-78 + i * 9, ROAD_Z + (i % 2 ? 1.6 : -1.6)], [78 - i * 7, ROAD_Z + (i % 2 ? 1.6 : -1.6)]], { speed: 1.3, loop: true }); });

  // Опитът в стъпка 2: студент влиза във факултет и излиза с професия.
  const fac = places.get('faculties');
  fac.group.updateMatrixWorld(true);
  const doorWorld = fac.group.userData.doors.map(([lx, lz]) => fac.group.localToWorld(new THREE.Vector3(lx, 0, lz)));
  const GRAD = [{ tunic: 0x2f5fa8, long: true, hat: 0x2f5fa8 }, { tunic: 0xa3202a, long: true, hat: 0xa3202a }, { tunic: 0x2f6a3a, long: true, hat: 0x1a1a1e }, { tunic: 0x1e1e24, long: true, cloak: 0x4a1f6a }];
  const novice = figure({ tunic: 0x8a7a5a, long: true }); novice.visible = false; scene.add(novice);
  const grads = GRAD.map((l) => { const g = figure(l); g.visible = false; scene.add(g); return g; });
  // Новодошли студенти за стъпка 4.
  const newcomers = [0x4a5a8a, 0x7a5a3a, 0x5a3a6a, 0x3a6a6a, 0x8a6a3a, 0x6a7a4a].map((cl, i) => { const f = figure({ tunic: cl, long: true, hat: i % 2 ? 0x3a3a3a : undefined }); f.visible = false; scene.add(f); return f; });

  const inRect = (x, z, cx, cz, hw, hd) => Math.abs(x - cx) < hw && Math.abs(z - cz) < hd;
  const yardOf = (x, z) => { for (const [k, y] of Object.entries(YARDS)) if (inRect(x, z, y.x, y.z, y.w / 2, y.d / 2 + 0.6)) return k; return null; };
  return {
    places, obstacles, terrain, yardOf,
    heightAt: () => 0.1,
    canStand(x, z) {
      if (inRect(x, z, 0, 10, 88, 15)) return true; // пътят и поляната пред дворовете
      for (const y of Object.values(YARDS)) { if (inRect(x, z, y.x, y.z, y.w / 2 - 1.2, y.d / 2 - 1.2)) return true; if (Math.abs(x - y.gate[0]) < 1.9 && z > y.gate[1] - 2 && z < -4) return true; }
      return false;
    },
    // Път за автоматичното ходене: през портата на двора, по пътя и през портата на другия двор.
    route(from, to) {
      const a = yardOf(from[0], from[1]), b = yardOf(to[0], to[1]), pts = [];
      if (a !== b) {
        if (a) pts.push([YARDS[a].gate[0], YARDS[a].gate[1] - 3], [YARDS[a].gate[0], ROAD_Z]);
        if (b) pts.push([YARDS[b].gate[0], ROAD_Z], [YARDS[b].gate[0], YARDS[b].gate[1] - 3]);
      }
      pts.push(to);
      return pts;
    },
    // Изпраща студент във факултет i; след малко оттам излиза завършил. done() се вика, когато той застане на мястото си.
    graduate(i, done) {
      const d = doorWorld[i];
      novice.position.set(-3, 0.1, -12);
      send(novice, [[d.x + 4, d.z], [d.x + 0.6, d.z]], { speed: 8, onEnd() {
        novice.visible = false;
        const g = grads[i]; g.position.set(d.x + 0.6, 0.1, d.z);
        setTimeout(() => send(g, [[d.x + 5, d.z], [-7.5 + i * 5, -9.5]], { speed: 7, onEnd() { g.rotation.y = 0; done && done(g); } }), 700);
      } });
    },
    resetGraduates() { novice.visible = false; grads.forEach((g) => { g.visible = false; const a = actors.find((q) => q.fig === g); if (a) a.pts = null; }); const a = actors.find((q) => q.fig === novice); if (a) a.pts = null; },
    arrive() { newcomers.forEach((f, i) => { f.position.set(-14 + i * 5.5, 0.1, ROAD_Z + 5 + (i % 2) * 2); send(f, [[0, ROAD_Z], [0, -9], [-10 + i * 4, -13 - (i % 2) * 2.5]], { speed: 3.4 + i * 0.25, onEnd() { f.rotation.y = PI; } }); }); },
    resetArrive() { newcomers.forEach((f) => { f.visible = false; const a = actors.find((q) => q.fig === f); if (a) a.pts = null; }); },
    tick(dt, t) { for (const fn of tickers) fn(dt, t); },
    paintMap(g, px) {
      g.fillStyle = 'rgba(232,238,220,0.94)'; g.fillRect(0, 0, 400, 400);
      const [rx0, ry0] = px(-88, ROAD_Z - 3), [rx1, ry1] = px(88, ROAD_Z + 3);
      g.fillStyle = '#c9c0ac'; g.fillRect(rx0, ry0, rx1 - rx0, ry1 - ry0);
      for (const [k, y] of Object.entries(YARDS)) { const [x0, z0] = px(y.x - y.w / 2, y.z - y.d / 2), [x1, z1] = px(y.x + y.w / 2, y.z + y.d / 2); g.fillStyle = k === 'fes' ? '#f3ecd6' : k === 'uni' ? '#e6cdb6' : '#d9d3c4'; g.strokeStyle = '#7d7466'; g.lineWidth = 1.6; g.fillRect(x0, z0, x1 - x0, z1 - z0); g.strokeRect(x0, z0, x1 - x0, z1 - z0); const [gx, gz] = px(y.gate[0], y.gate[1]); g.fillStyle = '#c9c0ac'; g.fillRect(gx - 2, gz - 1, 4, ry0 - gz + 1); }
    },
    mapBounds: { x0: -92, x1: 92, z0: -50, z1: 28 },
  };
}
