// Осемте места в Търновград, които детето разглежда. Те са по-подробни и по-ярки от останалия град.
// Всяка функция връща { group, obstacles, tick? }. Мерките са в метри; предната страна е към локалното +z.
import { THREE } from '../../kit.js';
import { Batch, box, cyl, dome, gable, gableEnds, hip, archWall, stripes, figure } from './build.js';

const PI = Math.PI;
// Зъбери по ръба на правоъгълник w × d на височина y.
export function merlons(f, mat, w, d, y, step = 2.2, size = [1.1, 1.1, 0.6]) {
  const [mw, mh, mt] = size;
  for (let x = -w / 2 + mw / 2; x <= w / 2 - mw / 2 + 0.01; x += step) { f.box(mat, mw, mh, mt, x, y, d / 2 - mt / 2); f.box(mat, mw, mh, mt, x, y, -d / 2 + mt / 2); }
  for (let z = -d / 2 + step; z <= d / 2 - step + 0.01; z += step) { f.box(mat, mt, mh, mw, w / 2 - mt / 2, y, z); f.box(mat, mt, mh, mw, -w / 2 + mt / 2, y, z); }
}
// Прозорец: дървена рамка и тъмен отвор; с капаци, ако shutters.
export function windowAt(f, M, x, y, z, ry = 0, w = 0.8, h = 1.0, shutters = false) {
  const s = f.sub(x, y, z, ry);
  s.box(M.wood, w + 0.22, h + 0.22, 0.08, 0, -0.11, 0).box(M.dark, w, h, 0.12, 0, 0, 0);
  if (shutters) s.box(M.wood, w * 0.5, h, 0.06, -w * 0.78, 0, 0.03, 0.5).box(M.wood, w * 0.5, h, 0.06, w * 0.78, 0, 0.03, -0.5);
}
function doorAt(f, M, x, y, z, ry = 0, w = 1.2, h = 2.1) {
  const s = f.sub(x, y, z, ry);
  s.box(M.stone, w + 0.5, h + 0.3, 0.14, 0, 0, -0.02).box(M.wood, w, h, 0.16, 0, 0, 0.04).box(M.iron, w, 0.08, 0.2, 0, h * 0.3, 0.04).box(M.iron, w, 0.08, 0.2, 0, h * 0.72, 0.04);
}
function flag(color, w = 2.4, h = 1.4) {
  const geo = new THREE.PlaneGeometry(w, h, 8, 1).translate(w / 2, 0, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.8 }));
  m.castShadow = true;
  const base = geo.attributes.position.array.slice();
  m.userData.wave = (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = base[i * 3]; p.setZ(i, Math.sin(x * 2.2 - t * 5) * 0.18 * (x / w)); }
    p.needsUpdate = true;
  };
  return m;
}
// Кръстокуполна църква с редуване на камък и тухла. Олтарът е към +x.
function church(f, M, L, W, H, { drum = true, narthex = true } = {}) {
  f.box(M.banded, L, H, W).add(M.tiles, gable(L + 0.8, W + 0.8, W * 0.3), 0, H, 0).add(M.banded, gableEnds(L, W, W * 0.3), 0, H, 0);
  f.add(M.banded, cyl(W * 0.36, H * 0.8, 14), L / 2, 0, 0).add(M.tiles, dome(W * 0.38, 14), L / 2, H * 0.8, 0);
  if (drum) {
    const tw = W + 2.6;
    f.box(M.banded, L * 0.36, H + 1.1, tw).add(M.tiles, gable(tw + 0.6, L * 0.36 + 0.6, W * 0.27), 0, H + 1.1, 0, PI / 2).add(M.banded, gableEnds(tw, L * 0.36, W * 0.27), 0, H + 1.1, 0, PI / 2);
    const r = W * 0.29, dy = H + W * 0.22;
    f.add(M.banded, cyl(r, 3.0, 12), 0, dy, 0).add(M.tiles, dome(r + 0.35, 14), 0, dy + 3.0, 0);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; f.box(M.dark, 0.45, 1.5, 0.2, Math.sin(a) * r, dy + 0.9, Math.cos(a) * r, a); }
    f.box(M.gold, 0.12, 1.3, 0.12, 0, dy + 3.0 + r + 0.3, 0).box(M.gold, 0.7, 0.12, 0.12, 0, dy + 3.0 + r + 1.1, 0);
  } else f.box(M.gold, 0.1, 1.1, 0.1, 0, H + W * 0.3, 0).box(M.gold, 0.6, 0.1, 0.1, 0, H + W * 0.3 + 0.75, 0);
  if (narthex) { f.box(M.banded, 3.4, H * 0.72, W + 0.4, -L / 2 - 1.7, 0, 0).add(M.tiles, hip(4.2, W + 1.2, 1.6), -L / 2 - 1.7, H * 0.72, 0); doorAt(f, M, -L / 2 - 3.42, 0, 0, -PI / 2, 1.5, 2.6); }
  else doorAt(f, M, -L / 2 - 0.02, 0, 0, -PI / 2, 1.4, 2.5);
  for (let x = -L / 2 + 2; x <= L / 2 - 1.5; x += 2.6) for (const s of [1, -1]) { if (drum && Math.abs(x) < L * 0.2) continue; f.box(M.dark, 0.55, 1.7, 0.16, x, H * 0.42, s * W / 2, 0); f.box(M.stone, 0.95, 0.25, 0.2, x, H * 0.42 + 1.7, s * W / 2, 0); }
}
export { church };

// Главната порта с подвижния мост. Локалното +z сочи навън, към моста.
export function gate(M) {
  const B = new Batch(), f = B.frame();
  f.add(M.stone, archWall(11, 13, 9, 4, 5.6), 0, 0, 0);
  f.box(M.stone, 11.8, 0.7, 9.8, 0, 13, 0);
  merlons(f, M.stone, 11.8, 9.8, 13.7, 2.14);
  for (const [x, z] of [[-5, -4], [5, -4], [-5, 4], [5, 4]]) f.box(M.wood, 0.35, 2.6, 0.35, x, 13.7, z);
  f.add(M.tiles, hip(13.4, 11.4, 3.6), 0, 16.3, 0);
  // Отворени дървени крила с железен обков.
  for (const s of [1, -1]) { const d = f.sub(s * 2.0, 0, -3.2, s * 1.25); d.box(M.wood, 2.0, 5.0, 0.22, s * -1.0, 0, 0); for (const y of [1.2, 2.6, 4.0]) d.box(M.iron, 2.0, 0.14, 0.28, s * -1.0, y, 0); }
  for (const x of [-3.6, 3.6]) { windowAt(f, M, x, 8.5, 4.52, 0, 0.5, 1.6); windowAt(f, M, x, 8.5, -4.52, PI, 0.5, 1.6); }
  f.box(M.gold, 1.4, 1.4, 0.1, 0, 9.3, 4.53); f.box(M.red, 1.1, 1.1, 0.12, 0, 9.45, 4.55); // герб над входа
  // Подвижен мост над изсечената в скалата пропаст.
  const br = f.sub(0, -0.25, 9.2);
  br.box(M.wood, 4.6, 0.3, 9.6, 0, 0, 0, 0, 0.2);
  for (let z = -4.2; z <= 4.3; z += 1.4) for (const s of [1, -1]) br.box(M.wood, 0.16, 1.1, 0.16, s * 2.2, 0.2 - z * 0.2, z);
  for (const s of [1, -1]) { br.box(M.wood, 0.12, 0.12, 9.6, s * 2.2, 1.2, 0, 0, 0.2); br.box(M.iron, 0.09, 0.09, 11.4, s * 2.05, 3.9, -0.6, 0, -0.52); }
  // Предна порта в началото на провлака.
  const o = f.sub(0, -3.6, 17.6);
  o.add(M.stone, archWall(9, 7.2, 2.4, 4, 5.2), 0, 0, 0);
  merlons(o, M.stone, 9, 2.4, 7.2, 2.0, [1, 1, 0.5]);
  for (const s of [1, -1]) o.box(M.stone, 2.2, 5, 2.0, s * 5.4, 0, 0);
  const group = B.build();
  const flags = [-4.6, 4.6].map((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.6, 6), M.wood); p.position.set(x, 16.6, 4.2); const fl = flag(0xb02a24); fl.position.set(0, 1.5, 0); p.add(fl); group.add(p); return fl; });
  const guards = [-3.1, 3.1].map((x) => { const g = figure({ tunic: 0x8a2a24, legs: 0x3a3a40, hat: 0x8c9198 }); g.position.set(x, 0, 5.3); const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 5), M.wood); sp.position.set(0.32, 1.3, 0.1); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 6), M.iron); tip.position.y = 1.45; sp.add(tip); g.add(sp); group.add(g); return g; });
  return { group, top: 20, tick(t) { flags.forEach((fl, i) => fl.userData.wave(t + i)); guards.forEach((g, i) => { g.rotation.y = Math.sin(t * 0.4 + i * 2) * 0.3; }); } };
}

// Царският дворец: малка крепост със собствени стени, тронна зала и църква. Портата е към -x.
export function palace(M) {
  const B = new Batch(), f = B.frame();
  const W = 48, D = 30, obstacles = [];
  f.box(M.cobble, W - 2, 0.12, D - 2, 0, 0, 0);
  const wall = (len, x, z, ry) => { const s = f.sub(x, 0, z, ry); s.box(M.stone, len, 5.2, 1.4, 0, -2, 0); merlons(s, M.stone, len, 1.4, 3.2, 2.2, [1.1, 0.9, 0.5]); obstacles.push({ x, z, hw: len / 2, hd: 0.9, ry }); };
  wall(W, 0, -D / 2, 0); wall(W, 0, D / 2, 0); wall(D, W / 2, 0, PI / 2);
  wall(D / 2 - 3, -W / 2, -D / 4 - 1.5, PI / 2); wall(D / 2 - 3, -W / 2, D / 4 + 1.5, PI / 2);
  f.add(M.stone, archWall(6, 7.4, 2.2, 3.4, 4.6), -W / 2, 0, 0, PI / 2);
  merlons(f.sub(-W / 2, 0, 0, PI / 2), M.stone, 6, 2.2, 7.4, 2.0, [1, 0.9, 0.5]);
  obstacles.push({ x: -W / 2, z: -2.4, hw: 1.2, hd: 0.7 }, { x: -W / 2, z: 2.4, hw: 1.2, hd: 0.7 });
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const t = f.sub(x * W / 2, 0, z * D / 2); t.box(M.stone, 5, 11, 5, 0, -2, 0); merlons(t, M.stone, 5, 5, 9, 1.95, [1, 0.9, 0.5]); t.add(M.tiles, hip(4.2, 4.2, 2.6), 0, 9, 0); obstacles.push({ x: x * W / 2, z: z * D / 2, hw: 2.6, hd: 2.6 }); }
  // Тронна зала с колонада.
  const h = f.sub(4, 0, -7);
  h.box(M.banded, 24, 8.5, 9).add(M.tiles, gable(25.4, 10.6, 3), 0, 8.5, 0).add(M.banded, gableEnds(24, 9, 3), 0, 8.5, 0);
  for (let x = -10.5; x <= 10.6; x += 3) { h.add(M.white, cyl(0.32, 4.2, 10), x, 0, 6.2).box(M.white, 0.9, 0.3, 0.9, x, 4.2, 6.2); if (Math.abs(x) > 1.6) windowAt(h, M, x, 5.2, 4.52, 0, 0.9, 2.0); }
  h.box(M.stone, 22.4, 0.5, 2.4, 0, 4.5, 5.7).add(M.tiles, box(22.8, 0.18, 3.0), 0, 5.2, 5.6, 0, 0.3);
  h.box(M.stone, 22.4, 0.25, 2.6, 0, 0, 5.8);
  doorAt(h, M, 0, 0.25, 4.52, 0, 2.2, 3.6);
  h.box(M.red, 1.6, 2.6, 0.08, -3.2, 3.0, 4.56).box(M.red, 1.6, 2.6, 0.08, 3.2, 3.0, 4.56);
  obstacles.push({ x: 4, z: -7, hw: 12.2, hd: 4.7 });
  // Дворцова църква.
  church(f.sub(14, 0, 7), M, 9, 5.4, 5.2);
  obstacles.push({ x: 14, z: 7, hw: 7.2, hd: 4.2 });
  // Жилищна част с дървен чардак.
  const r = f.sub(-10, 0, 8.5);
  r.box(M.stone, 14, 3, 6.5).box(M.plaster, 14.6, 3, 7.1, 0, 3, 0).box(M.wood, 14.8, 0.28, 7.3, 0, 2.86, 0).add(M.tiles, gable(16, 8.6, 2.6), 0, 6, 0).add(M.plaster, gableEnds(14.6, 7.1, 2.6), 0, 6, 0);
  r.box(M.wood, 14.6, 0.2, 1.6, 0, 3, -4.2);
  for (let x = -7; x <= 7.1; x += 2.33) { r.box(M.wood, 0.2, 3, 0.2, x, 0, -4.85).box(M.wood, 0.16, 2.9, 0.16, x, 3.2, -4.85); if (x < 6) windowAt(r, M, x + 1.16, 3.9, -3.56, PI, 0.8, 1.1, true); }
  r.box(M.wood, 14.6, 0.14, 0.14, 0, 4.1, -4.85);
  doorAt(r, M, -3, 0, -3.26, PI);
  obstacles.push({ x: -10, z: 8, hw: 7.4, hd: 4.6 });
  // Кладенец в двора.
  f.add(M.stone, cyl(1.1, 0.9, 12), -8, 0, -3).box(M.wood, 0.16, 2.2, 0.16, -9, 0.9, -3).box(M.wood, 0.16, 2.2, 0.16, -7, 0.9, -3).box(M.wood, 2.4, 0.16, 0.16, -8, 3.0, -3);
  obstacles.push({ x: -8, z: -3, r: 1.2 });
  const group = B.build();
  const flags = [[-W / 2, -D / 2], [-W / 2, D / 2]].map(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 6), M.wood); p.position.set(x, 13.5, z); const fl = flag(0xb02a24); fl.position.y = 1.2; p.add(fl); group.add(p); return fl; });
  return { group, obstacles, top: 15, tick(t) { flags.forEach((fl, i) => fl.userData.wave(t + i * 1.7)); } };
}

// Патриаршията: църквата „Възнесение Господне“ на върха и камбанарията.
export function patriarchate(M) {
  const B = new Batch(), f = B.frame();
  church(f.sub(2, 0, 0), M, 17, 9, 8.2);
  const t = f.sub(-13.5, 0, 7.5);
  t.box(M.stone, 4.6, 15, 4.6);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) t.box(M.stone, 1, 3.4, 1, x * 1.8, 15, z * 1.8);
  t.box(M.stone, 4.8, 0.5, 4.8, 0, 18.4, 0).add(M.tiles, hip(6, 6, 3.6), 0, 18.9, 0).add(M.gold, cyl(0.75, 1.1, 10, 0.3), 0, 16.2, 0);
  t.box(M.gold, 0.1, 1.1, 0.1, 0, 22.5, 0).box(M.gold, 0.6, 0.1, 0.1, 0, 23.2, 0);
  for (const y of [5, 10]) windowAt(t, M, 0, y, 2.32, 0, 0.5, 1.5);
  doorAt(t, M, 0, 0, 2.32, 0, 1.1, 2.2);
  // Ниска ограда на двора.
  for (const [len, x, z, ry] of [[30, 2, -10.5, 0], [30, 2, 11.5, 0], [22, 17, 0.5, PI / 2]]) f.box(M.stone, len, 1.3, 0.7, x, -0.3, z, ry);
  const group = B.build();
  return { group, top: 19, obstacles: [{ x: 2, z: 0, hw: 11.6, hd: 6.4 }, { x: -13.5, z: 7.5, hw: 2.5, hd: 2.5 }, { x: 2, z: -10.5, hw: 15, hd: 0.5 }, { x: 2, z: 11.5, hw: 15, hd: 0.5 }, { x: 17, z: 0.5, hw: 0.5, hd: 11 }] };
}

// Балдуиновата кула.
export function baldwin(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.stone, 7.4, 15, 7.4, 0, -3, 0).box(M.stone, 8, 0.6, 8, 0, 12, 0);
  merlons(f, M.stone, 8, 8, 12.6, 1.95, [1, 1, 0.55]);
  f.box(M.stone, 5.2, 5, 5.2, 0, 12.6, 0).box(M.stone, 5.8, 0.5, 5.8, 0, 17.6, 0);
  merlons(f, M.stone, 5.8, 5.8, 18.1, 1.6, [0.9, 0.9, 0.5]);
  doorAt(f, M, 0, 0, 3.72, 0, 1.2, 2.3);
  f.box(M.stone, 2.4, 0.3, 1.2, 0, 0, 4.4);
  for (const y of [4.5, 8.5]) for (const ry of [0, PI / 2, PI, -PI / 2]) windowAt(f, M, Math.sin(ry) * 3.72, y, Math.cos(ry) * 3.72, ry, 0.35, 1.4);
  windowAt(f, M, 0, 14.2, 2.62, 0, 0.7, 1.3);
  const group = B.build();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.5, 6), M.wood); p.position.set(0, 20.2, 0);
  const fl = flag(0xb02a24); fl.position.y = 1.4; p.add(fl); group.add(p);
  return { group, top: 21, obstacles: [{ x: 0, z: 0, hw: 4, hd: 4 }], tick(t) { fl.userData.wave(t); } };
}

// Бъчва, чувал, кош, гърне — дребни предмети за пазара и работилниците.
const POT = [[0.01, 0], [0.16, 0], [0.26, 0.14], [0.27, 0.3], [0.18, 0.46], [0.14, 0.54], [0.19, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
const potGeo = () => new THREE.LatheGeometry(POT, 10);
const bowlGeo = () => new THREE.LatheGeometry([[0.01, 0], [0.12, 0], [0.3, 0.16], [0.33, 0.18]].map(([x, y]) => new THREE.Vector2(x, y)), 12);
function barrel(f, M, x, y, z, s = 1) { f.add(M.wood, cyl(0.42 * s, 1.0 * s, 10, 0.36 * s), x, y, z); for (const h of [0.2, 0.8]) f.add(M.iron, cyl(0.435 * s, 0.07 * s, 10), x, y + h * s, z); }
function sack(f, M, x, y, z, s = 1) { f.add(M.sack, new THREE.SphereGeometry(0.42 * s, 8, 6).scale(1, 0.75, 0.8).translate(0, 0.3 * s, 0), x, y, z, x * 3); }
function crate(f, M, x, y, z, fill) { f.box(M.wood, 0.9, 0.45, 0.6, x, y, z); if (fill) for (let i = 0; i < 6; i++) f.add(fill, new THREE.SphereGeometry(0.13, 6, 5), x - 0.28 + (i % 3) * 0.28, y + 0.5, z - 0.12 + Math.floor(i / 3) * 0.26); }

// Пазарът: сергии с платнища, стоки, кладенец, каруца, търговци.
export function market(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.cobble, 28, 0.14, 24, 0, 0, 0);
  const cloths = [stripes(0xb23a2e, 0xf1e6cf), stripes(0x2f5fa8, 0xf1e6cf), stripes(0xd9a441, 0x8a3a2a), stripes(0x4f8a4a, 0xf1e6cf)];
  const obstacles = [], sellers = [];
  const stalls = [[-9, -7.5, 0], [-3, -8, 0], [3.5, -8, 0], [9.5, -7, -0.3], [-10, 6.5, PI], [-3.5, 7.5, PI], [9, 7, PI + 0.25]];
  stalls.forEach(([x, z, ry], i) => {
    const s = f.sub(x, 0.14, z, ry);
    for (const [px, pz] of [[-1.5, -0.8], [1.5, -0.8], [-1.5, 0.8], [1.5, 0.8]]) s.box(M.wood, 0.14, pz < 0 ? 2.9 : 2.3, 0.14, px, 0, pz);
    s.add(cloths[i % 4], box(3.6, 0.05, 2.5), 0, 2.56, 0.05, 0, 0.3);
    s.box(M.wood, 3.0, 0.1, 1.2, 0, 0.95, 0.3).box(M.wood, 0.12, 0.95, 0.12, -1.35, 0, 0.8).box(M.wood, 0.12, 0.95, 0.12, 1.35, 0, 0.8);
    const kind = i % 7;
    if (kind === 0) for (let k = 0; k < 6; k++) s.add([M.clay, M.glaze, M.ochre][k % 3], potGeo(), -1.1 + k * 0.44, 1.05, 0.3 + (k % 2) * 0.25);
    if (kind === 1) for (let k = 0; k < 5; k++) s.box([M.red, M.blue, M.ochre, M.green, M.white][k], 0.5, 0.2 + (k % 2) * 0.12, 0.9, -1.1 + k * 0.55, 1.05, 0.3);
    if (kind === 2) { crate(s, M, -0.8, 1.05, 0.3, M.red); crate(s, M, 0.3, 1.05, 0.3, M.green); sack(s, M, 1.15, 1.05, 0.3, 0.6); }
    if (kind === 3) { // везни и теглилки
      s.box(M.iron, 0.08, 0.8, 0.08, 0, 1.05, 0.3).box(M.iron, 1.1, 0.05, 0.05, 0, 1.82, 0.3);
      for (const sx of [-0.5, 0.5]) { s.add(M.gold, bowlGeo(), sx, 1.3, 0.3).box(M.iron, 0.02, 0.5, 0.02, sx, 1.34, 0.3); }
      for (let k = 0; k < 4; k++) s.add(M.lead, cyl(0.06 + k * 0.02, 0.1 + k * 0.03, 8), 0.9 + (k % 2) * 0.22, 1.05, 0.1 + Math.floor(k / 2) * 0.3);
      for (let k = 0; k < 5; k++) s.add(M.gold, cyl(0.07, 0.02, 8), -1.0 + (k % 3) * 0.16, 1.05 + Math.floor(k / 3) * 0.02, 0.5);
    }
    if (kind === 4) { sack(s, M, -0.9, 1.05, 0.3, 0.7); sack(s, M, -0.1, 1.05, 0.35, 0.7); sack(s, M, 0.7, 1.05, 0.3, 0.7); }
    if (kind === 5) for (let k = 0; k < 4; k++) s.add(M.iron, box(0.08, 0.04, 0.9), -0.9 + k * 0.5, 1.05, 0.3, 0.2 * k);
    if (kind === 6) { crate(s, M, -0.6, 1.05, 0.3, M.ochre); for (let k = 0; k < 3; k++) s.add(M.glaze, bowlGeo(), 0.5 + k * 0.4, 1.05, 0.3); }
    obstacles.push({ x, z, hw: 1.9, hd: 1.2, ry });
    const look = [{ tunic: 0x2f5fa8, cloak: 0x7a1f1f, hat: 0x7a1f1f, long: true }, { tunic: 0x8a5a2a, hair: 0x2a1a10 }, { tunic: 0x4f6a3a, hat: 0xb9a36a }, { tunic: 0x6a2f6a, cloak: 0x24325a, long: true }][i % 4];
    const p = figure(look); p.position.set(x - Math.sin(ry) * 0.75, 0.14, z - Math.cos(ry) * 0.75); p.rotation.y = ry; sellers.push(p);
  });
  // Кладенец с навес.
  f.add(M.stone, cyl(1.25, 1.0, 14), 0, 0.14, 0).add(M.dark, cyl(0.95, 0.05, 14), 0, 1.1, 0);
  for (const s of [1, -1]) f.box(M.wood, 0.18, 2.6, 0.18, s * 1.25, 1.1, 0);
  f.add(M.wood, cyl(0.12, 2.5, 8).rotateZ(PI / 2), 1.25, 3.0, 0).add(M.tiles, gable(3.4, 2.6, 0.9), 0, 3.5, 0).add(M.wood, cyl(0.2, 0.3, 8, 0.17), 0, 1.5, 0);
  obstacles.push({ x: 0, z: 0, r: 1.4 });
  // Каруца с бъчви.
  const c = f.sub(5.5, 0.14, 1.5, 0.5);
  c.box(M.wood, 3.2, 0.14, 1.5, 0, 0.75, 0).box(M.wood, 3.2, 0.5, 0.08, 0, 0.89, 0.72).box(M.wood, 3.2, 0.5, 0.08, 0, 0.89, -0.72).box(M.wood, 2.2, 0.1, 0.1, 2.6, 0.72, 0.5).box(M.wood, 2.2, 0.1, 0.1, 2.6, 0.72, -0.5);
  for (const [x, z] of [[-1, 0.85], [1, 0.85], [-1, -0.85], [1, -0.85]]) c.add(M.wood, new THREE.TorusGeometry(0.55, 0.07, 6, 14), x, 0.62, z).add(M.wood, box(1.05, 0.07, 0.07), x, 0.58, z).add(M.wood, box(0.07, 1.05, 0.07), x, 0.1, z);
  barrel(c, M, -0.8, 0.89, 0); barrel(c, M, 0.3, 0.89, 0, 0.9);
  obstacles.push({ x: 5.5, z: 1.5, r: 2 });
  barrel(f, M, -12.5, 0.14, -2); barrel(f, M, -12.4, 0.14, -0.9, 0.85); sack(f, M, -12.3, 0.14, 0.4); sack(f, M, 12.2, 0.14, 1.5); crate(f, M, 12.3, 0.14, 3, M.red); barrel(f, M, 12.4, 0.14, -2.5);
  const group = B.build();
  sellers.forEach((p) => group.add(p));
  return { group, obstacles, top: 5, tick(t) { sellers.forEach((p, i) => { p.userData.arms[0].rotation.x = -0.5 + Math.sin(t * 1.3 + i) * 0.4; p.rotation.y += Math.sin(t * 0.7 + i * 2) * 0.002; }); } };
}

function glowMat(hex) { return new THREE.MeshStandardMaterial({ color: 0x1a0c06, emissive: hex, emissiveIntensity: 2.2, roughness: 1 }); }
function smoke(n = 5, size = 1.4) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(235,232,225,0.85)'); gr.addColorStop(1, 'rgba(235,232,225,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const map = new THREE.CanvasTexture(c);
  const grp = new THREE.Group();
  for (let i = 0; i < n; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity: 0 })); sp.raycast = () => {}; grp.add(sp); } // димът не се щрака
  grp.userData.update = (t, k = 1) => grp.children.forEach((sp, i) => { const u = (t * 0.16 + i / n) % 1; sp.position.set(Math.sin(u * 4 + i) * 0.5 + u * 1.6, u * 6, Math.cos(u * 3 + i) * 0.3); sp.scale.setScalar(size * (0.6 + u * 2.2)); sp.material.opacity = Math.sin(u * PI) * 0.5 * k; });
  return grp;
}
export { smoke };

// Ковачница: огнище с мях, наковалня, готови подкови и сечива, ковач с чук.
export function smithy(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.stone, 9.4, 3.2, 7.4, 0, -3.1, 0);
  f.box(M.stone, 9, 3.4, 0.6, 0, 0.1, -3.2).box(M.stone, 0.6, 3.4, 5.4, -4.2, 0.1, -0.5).box(M.stone, 0.6, 3.4, 5.4, 4.2, 0.1, -0.5);
  for (const x of [-4.2, -1.4, 1.4, 4.2]) f.box(M.wood, 0.26, 2.9, 0.26, x, 0.1, 2.6);
  f.box(M.wood, 9, 0.24, 0.24, 0, 2.9, 2.6);
  f.add(M.tiles, box(10.2, 0.16, 7.4), 0, 3.25, -0.2, 0, 0.16);
  // Огнище с комин.
  f.box(M.stone, 2.0, 1.0, 1.5, -2.6, 0.1, -2.0).box(M.stone, 1.7, 2.6, 0.5, -2.6, 1.1, -2.6).box(M.stone, 1.0, 2.6, 0.9, -2.6, 3.4, -2.5);
  // Мях.
  f.add(M.wood, box(0.9, 0.3, 1.3), -0.9, 0.9, -2.0, PI / 2, 0, 0.12).add(M.clay, cyl(0.07, 0.6, 6).rotateZ(PI / 2), -1.55, 1.0, -2.0);
  // Наковалня върху пън.
  f.add(M.wood, cyl(0.38, 0.6, 10), 0.6, 0.1, 0.2).box(M.iron, 0.3, 0.14, 0.26, 0.6, 0.7, 0.2).box(M.iron, 0.7, 0.2, 0.3, 0.6, 0.84, 0.2).add(M.iron, new THREE.ConeGeometry(0.11, 0.4, 8).rotateZ(-PI / 2), 1.14, 0.95, 0.2);
  // Каца с вода за закаляване.
  barrel(f, M, 2.4, 0.1, -0.4, 0.9); f.add(M.blue, cyl(0.3, 0.02, 10), 2.4, 0.98, -0.4);
  // Дъска с подкови и сечива на задната стена.
  f.box(M.wood, 4.2, 1.5, 0.08, 1.6, 1.3, -2.86);
  for (let i = 0; i < 6; i++) f.add(M.iron, new THREE.TorusGeometry(0.17, 0.035, 5, 10, PI * 1.3).rotateZ(PI * 0.85), 0 + i * 0.52, 2.35, -2.8);
  for (let i = 0; i < 4; i++) f.box(M.iron, 0.05, 0.9, 0.03, 0.1 + i * 0.45, 1.45, -2.8).box(M.iron, 0.2, 0.14, 0.04, 0.1 + i * 0.45, 2.3 - 0.9 + 0.86, -2.8);
  for (let i = 0; i < 3; i++) f.box(M.iron, 0.07, 1.1, 0.02, 2.3 + i * 0.3, 1.45, -2.8).box(M.wood, 0.2, 0.05, 0.05, 2.3 + i * 0.3, 1.6, -2.8); // мечове
  f.box(M.wood, 2.2, 0.08, 0.8, 3.0, 0.9, 1.2).box(M.wood, 0.1, 0.8, 0.7, 2.1, 0.1, 1.2).box(M.wood, 0.1, 0.8, 0.7, 3.9, 0.1, 1.2);
  for (let i = 0; i < 4; i++) f.add(M.iron, new THREE.TorusGeometry(0.17, 0.035, 5, 10, PI * 1.3).rotateX(PI / 2), 2.4 + i * 0.4, 0.99, 1.2);
  sack(f, M, -3.5, 0.1, 0.6); sack(f, M, -3.4, 0.1, 1.5, 0.85); f.add(M.dark, new THREE.SphereGeometry(0.5, 7, 5).scale(1, 0.4, 1), -3.3, 0.2, -0.6);
  const group = B.build();
  const coals = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 1.0), glowMat(0xff5a14)); coals.position.set(-2.6, 1.16, -2.0); group.add(coals);
  const light = new THREE.PointLight(0xff7a2a, 30, 12, 2); light.position.set(-2.4, 1.9, -1.4); group.add(light);
  const smith = figure({ tunic: 0x5a4030, legs: 0x3a2a20, hair: 0x1a120c }); smith.position.set(0.6, 0.1, 1.05); smith.rotation.y = PI; group.add(smith);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.75, 0.06), M.wood); apron.position.set(0, 1.0, 0.2); smith.add(apron);
  const hammer = new THREE.Group(); const hh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.3), M.iron); hh.position.set(0, -0.62, 0.1); const hs = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), M.wood); hs.position.set(0, -0.55, 0); hs.rotation.x = PI / 2; hammer.add(hh, hs); smith.userData.arms[1].add(hammer);
  const hot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.08), glowMat(0xffa030)); hot.position.set(0.6, 1.06, 0.2); group.add(hot);
  const sm = smoke(5, 1.3); sm.position.set(-2.6, 6.1, -2.5); group.add(sm);
  return { group, top: 6.5, obstacles: [{ x: 0, z: -3.2, hw: 4.6, hd: 0.5 }, { x: -4.2, z: -0.5, hw: 0.5, hd: 2.8 }, { x: 4.2, z: -0.5, hw: 0.5, hd: 2.8 }, { x: -2.6, z: -2.0, hw: 1.1, hd: 0.9 }, { x: 0.6, z: 0.6, r: 0.9 }, { x: 3, z: 1.2, hw: 1.2, hd: 0.5 }],
    tick(t) {
      const sw = Math.max(0, Math.sin(t * 5.2)); smith.userData.arms[1].rotation.x = -2.2 + sw * 1.5;
      coals.material.emissiveIntensity = 1.8 + Math.sin(t * 9) * 0.3 + Math.sin(t * 23) * 0.2; light.intensity = 26 + Math.sin(t * 11) * 6;
      sm.userData.update(t);
    } };
}

// Грънчарска работилница: колело, пещ, рафтове със сграфито съдове.
export function pottery(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.stone, 12.4, 3.2, 9.4, 0, -3.1, 0);
  // Къщата на грънчаря.
  const h = f.sub(-2.6, 0.1, -1.8);
  h.box(M.stone, 6.4, 2.7, 5).box(M.plaster, 6.9, 2.4, 5.5, 0, 2.7, 0).box(M.wood, 7.1, 0.25, 5.7, 0, 2.58, 0).add(M.tiles, gable(8.2, 6.9, 2.3), 0, 5.1, 0).add(M.plaster, gableEnds(6.9, 5.5, 2.3), 0, 5.1, 0);
  doorAt(h, M, -1.6, 0, 2.52); windowAt(h, M, 1.4, 1.1, 2.52, 0, 0.7, 0.8);
  for (const x of [-1.8, 1.8]) windowAt(h, M, x, 3.4, 2.78, 0, 0.8, 1.0, true);
  // Навес с рафтове.
  const s = f.sub(3.4, 0.1, -2.6);
  for (const x of [-2.2, 2.2]) s.box(M.wood, 0.2, 2.6, 0.2, x, 0, 1.6).box(M.wood, 0.2, 3.1, 0.2, x, 0, -1.2);
  s.add(M.tiles, box(5.4, 0.14, 3.8), 0, 2.85, 0.2, 0, 0.16);
  const glazes = [M.ochre, M.glaze, M.clay, M.white, M.ochre, M.glaze];
  for (let r = 0; r < 3; r++) { s.box(M.wood, 4.4, 0.08, 0.7, 0, 0.5 + r * 0.8, -0.9); for (let i = 0; i < 7; i++) s.add(glazes[(i + r) % 6], (i + r) % 3 ? potGeo() : bowlGeo(), -1.8 + i * 0.6, 0.58 + r * 0.8, -0.9); }
  // Пещ.
  f.add(M.stone, cyl(1.6, 1.0, 14), 3.6, 0.1, 2.4).add(M.clay, dome(1.6, 14), 3.6, 1.1, 2.4).add(M.stone, cyl(0.35, 1.0, 8), 3.6, 2.5, 2.4);
  // Грънчарско колело и дъска със сурови съдове.
  f.add(M.wood, cyl(0.12, 0.7, 8), -0.4, 0.1, 2.6).add(M.wood, cyl(0.6, 0.1, 14), -0.4, 0.16, 2.6).box(M.wood, 0.5, 0.45, 0.5, -1.3, 0.1, 2.6);
  f.box(M.wood, 2.6, 0.08, 0.6, -3.6, 0.7, 2.9).box(M.wood, 0.1, 0.6, 0.5, -4.7, 0.1, 2.9).box(M.wood, 0.1, 0.6, 0.5, -2.5, 0.1, 2.9);
  for (let i = 0; i < 5; i++) f.add(M.sack, i % 2 ? potGeo() : bowlGeo(), -4.6 + i * 0.5, 0.78, 2.9);
  f.add(M.clay, new THREE.SphereGeometry(0.45, 8, 6).scale(1, 0.5, 1), 0.9, 0.3, 3.4);
  const group = B.build();
  // Сграфито паници за показ: жълта глазура с врязани кръгове и зелени петна.
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#d9a63c'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#5a3418'; g.lineWidth = 3;
  for (const r of [58, 46, 20]) { g.beginPath(); g.arc(64, 64, r, 0, 7); g.stroke(); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; g.beginPath(); g.moveTo(64 + Math.cos(a) * 22, 64 + Math.sin(a) * 22); g.quadraticCurveTo(64 + Math.cos(a + 0.5) * 36, 64 + Math.sin(a + 0.5) * 36, 64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44); g.stroke(); g.fillStyle = 'rgba(52,120,70,0.75)'; g.beginPath(); g.arc(64 + Math.cos(a + 0.4) * 52, 64 + Math.sin(a + 0.4) * 52, 5, 0, 7); g.fill(); }
  const pm = new THREE.MeshStandardMaterial({ map: Object.assign(new THREE.CanvasTexture(c), { colorSpace: THREE.SRGBColorSpace }), roughness: 0.25 });
  for (let i = 0; i < 3; i++) { const pl = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), pm); pl.position.set(-4.2 + i * 1.5, 1.7 + (i % 2) * 0.25, 0.82); group.add(pl); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 20), M.clay); rim.position.copy(pl.position); group.add(rim); }
  const fire = new THREE.Mesh(new THREE.CircleGeometry(0.45, 10, 0, PI), glowMat(0xff6a1c)); fire.position.set(3.6, 0.12, 4.03); group.add(fire);
  const wheel = new THREE.Group(); wheel.position.set(-0.4, 0.8, 2.6);
  wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 16), M.wood)); const pot = new THREE.Mesh(potGeo(), M.clay); pot.position.y = 0.03; wheel.add(pot); group.add(wheel);
  const potter = figure({ tunic: 0x7a6a4a, legs: 0x4a3a2a, hair: 0x5a3a20 }); potter.position.set(-1.3, -0.35, 2.6); potter.rotation.y = PI / 2; potter.userData.legs.forEach((l) => { l.rotation.x = -1.3; }); potter.userData.arms.forEach((a) => { a.rotation.x = -1.0; }); group.add(potter);
  const sm = smoke(4, 1.1); sm.position.set(3.6, 3.6, 2.4); group.add(sm);
  return { group, top: 8, obstacles: [{ x: -2.6, z: -1.8, hw: 3.6, hd: 2.9 }, { x: 3.4, z: -3.5, hw: 2.4, hd: 0.6 }, { x: 3.6, z: 2.4, r: 1.7 }, { x: -0.7, z: 2.6, r: 0.9 }, { x: -3.6, z: 2.9, hw: 1.4, hd: 0.4 }],
    tick(t) { wheel.rotation.y = t * 5; pot.scale.y = 1 + Math.sin(t * 0.8) * 0.12; fire.material.emissiveIntensity = 2 + Math.sin(t * 10) * 0.4; sm.userData.update(t); } };
}

// Църквата „Свети Четиридесет мъченици“ край реката.
export function church40(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.stone, 30, 3.2, 16, 0, -3.1, 0);
  church(f.sub(1, 0.1, -1), M, 19, 8.4, 6.6, { drum: false });
  for (const [len, x, z, ry] of [[28, 0, 7.4, 0], [14, -14, 0.4, PI / 2], [14, 14, 0.4, PI / 2]]) f.box(M.stone, len, 1.2, 0.6, x, 0.1, z, ry);
  // Колоната с надписа на цар Иван Асен II (тук — пред църквата, за да се вижда).
  f.box(M.stone, 1.1, 0.3, 1.1, -9, 0.1, 4.4).add(M.white, cyl(0.34, 2.9, 12), -9, 0.4, 4.4).box(M.white, 0.9, 0.3, 0.9, -9, 3.3, 4.4);
  for (let i = 0; i < 7; i++) f.add(M.dark, cyl(0.345, 0.03, 12), -9, 1.2 + i * 0.22, 4.4);
  const group = B.build();
  return { group, top: 10, obstacles: [{ x: 1, z: -1, hw: 13, hd: 5 }, { x: -9, z: 4.4, r: 0.6 }, { x: -14, z: 0.4, hw: 0.4, hd: 7 }, { x: 14, z: 0.4, hw: 0.4, hd: 7 }] };
}

// Царят и царицата пред тронната зала. Гледат към локалното +z. userData.tsar / .tsaritsa — за балончетата с отговорите.
export function royals(M) {
  const B = new Batch(), f = B.frame();
  f.box(M.stone, 4.4, 0.24, 2.6, 0, 0, 0).box(M.red, 3.6, 0.03, 1.9, 0, 0.24, 0).box(M.gold, 3.6, 0.035, 0.1, 0, 0.24, 0.9).box(M.gold, 3.6, 0.035, 0.1, 0, 0.24, -0.9);
  const group = B.build();
  const S = (hex, o) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.75, ...o });
  const mats = [];
  const person = ({ robe, cloak, h, beard, veil }) => {
    const g = new THREE.Group(), k = h / 1.8;
    const robeM = S(robe), cloakM = S(cloak, { side: THREE.DoubleSide }), hairM = S(0x3a2618);
    mats.push(robeM, cloakM);
    const add = (geo, m, x, y, z, parent = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
    add(new THREE.CylinderGeometry(0.2, 0.37, 1.3, 14), robeM, 0, 0.65, 0); // дълга дреха
    add(new THREE.CylinderGeometry(0.375, 0.375, 0.09, 14), M.gold, 0, 0.05, 0); // златен кант
    add(new THREE.BoxGeometry(0.16, 1.2, 0.03), M.gold, 0, 0.72, 0.29).rotation.x = -0.13; // златната лента отпред (лор)
    for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.035, 6, 5), i % 2 ? M.blue : M.red, 0, 0.3 + i * 0.22, 0.335 - i * 0.028);
    add(new THREE.CylinderGeometry(0.23, 0.25, 0.1, 14), M.gold, 0, 1.3, 0); // яка
    add(new THREE.CylinderGeometry(0.3, 0.42, 1.22, 12, 1, true, Math.PI * 0.55, Math.PI * 0.9), cloakM, 0, 0.72, -0.02); // наметало
    const arms = [-1, 1].map((sx) => {
      const pv = new THREE.Group(); pv.position.set(sx * 0.25, 1.28, 0); pv.rotation.z = sx * 0.18; g.add(pv);
      add(new THREE.CylinderGeometry(0.075, 0.1, 0.6, 8).translate(0, -0.3, 0), robeM, 0, 0, 0, pv);
      add(new THREE.CylinderGeometry(0.105, 0.105, 0.06, 8), M.gold, 0, -0.56, 0, pv);
      add(new THREE.SphereGeometry(0.06, 8, 6), M.skin, 0, -0.64, 0, pv);
      return pv;
    });
    const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
    add(new THREE.SphereGeometry(0.135, 12, 10), M.skin, 0, 0, 0, head);
    for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.018, 6, 5), M.dark, sx * 0.05, 0.02, 0.125, head);
    if (beard) { add(new THREE.SphereGeometry(0.12, 10, 8, 0, 7, 1.5, 1.7), hairM, 0, -0.035, 0.03, head); add(new THREE.SphereGeometry(0.14, 10, 8, 0, 7, 0, 1.7), hairM, 0, 0.01, -0.02, head); }
    if (veil) { add(new THREE.SphereGeometry(0.15, 10, 8, 0, 7, 0, 1.9), M.white, 0, 0.01, -0.025, head); add(new THREE.CylinderGeometry(0.15, 0.2, 0.42, 10, 1, true, Math.PI * 0.6, Math.PI * 0.8), new THREE.MeshStandardMaterial({ color: 0xf3eee2, side: THREE.DoubleSide, roughness: 0.9 }), 0, -0.2, -0.02, head); }
    // Корона с кръст и висулки.
    add(new THREE.CylinderGeometry(0.145, 0.14, 0.09, 12), M.gold, 0, 0.12, 0, head);
    add(new THREE.SphereGeometry(0.13, 10, 6, 0, 7, 0, 1.5), veil ? M.gold : M.red, 0, 0.14, 0, head);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(new THREE.SphereGeometry(0.022, 6, 5), i % 2 ? M.blue : M.green, Math.sin(a) * 0.145, 0.12, Math.cos(a) * 0.145, head); }
    if (veil) for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; add(new THREE.ConeGeometry(0.03, 0.09, 5), M.gold, Math.sin(a) * 0.13, 0.21, Math.cos(a) * 0.13, head); }
    else { add(new THREE.BoxGeometry(0.025, 0.12, 0.025), M.gold, 0, 0.31, 0, head); add(new THREE.BoxGeometry(0.08, 0.025, 0.025), M.gold, 0, 0.33, 0, head); }
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.018, 5, 4), M.white, sx * 0.14, 0.05 - i * 0.045, 0.03, head);
    g.scale.setScalar(k);
    g.userData = { head, arms };
    return g;
  };
  const tsar = person({ robe: 0x7a1830, cloak: 0x4a1f6a, h: 1.84, beard: true });
  tsar.position.set(-0.7, 0.27, 0);
  // Скиптър с кръст в дясната ръка.
  const sc = new THREE.Group(); sc.position.set(0, -0.62, 0.06); sc.rotation.z = 0.18;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 6), M.gold); rod.position.y = 0.3; sc.add(rod);
  const cr = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), M.gold); cr.position.y = 0.85; sc.add(cr);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), M.red); knob.position.y = 0.95; sc.add(knob);
  tsar.userData.arms[0].add(sc); tsar.userData.arms[0].rotation.x = -0.35;
  const tsaritsa = person({ robe: 0x1d5f66, cloak: 0x8a1f2a, h: 1.68, veil: true });
  tsaritsa.position.set(0.7, 0.27, 0);
  tsaritsa.userData.arms.forEach((a, i) => { a.rotation.x = -0.55; a.rotation.z = (i ? 1 : -1) * -0.25; });
  group.add(tsar, tsaritsa);
  group.userData.tsar = tsar; group.userData.tsaritsa = tsaritsa;
  let speaker = null;
  group.userData.speak = (who) => { speaker = who; };
  return { group, mats, top: 2.6, obstacles: [{ x: -0.7, z: 0, r: 0.45 }, { x: 0.7, z: 0, r: 0.45 }],
    tick(t) {
      [tsar, tsaritsa].forEach((p, i) => {
        const talking = speaker === (i ? 'tsaritsa' : 'tsar');
        p.rotation.y = Math.sin(t * 0.5 + i * 2) * 0.12;
        p.userData.head.rotation.x = talking ? Math.sin(t * 5) * 0.05 : 0;
        p.userData.head.rotation.y = Math.sin(t * 0.8 + i) * 0.2;
        const free = p.userData.arms[1];
        free.rotation.x += ((talking ? -0.9 + Math.sin(t * 3) * 0.25 : i ? -0.55 : 0) - free.rotation.x) * 0.15; // говорещият ръкомаха
      });
    } };
}
