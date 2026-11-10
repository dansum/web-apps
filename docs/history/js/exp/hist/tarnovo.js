// Средновековният Търновград: хълмът Царевец със стените, улиците и къщите, долният град със занаятчиите и пазара, реката Янтра.
// Мерките са в метри. Разположението е опростено: местата са там, където са и днес, но разстоянията са скъсени.
import { THREE } from '../../kit.js';
import { Batch, box, cyl, gable, gableEnds, hip, materials, ownSet, groundTex, rng, figure, stride } from './build.js';
import * as P from './tarnovo-places.js';
import { sky } from './roman.js';

const sm = (v) => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };
const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const lerp = (a, b, k) => a + (b - a) * k;

// Очертание на крепостта (стените) и на долния град.
export const FORT = [[-92, -10], [-70, -34], [-30, -50], [20, -56], [65, -46], [95, -20], [100, 12], [80, 40], [40, 54], [-10, 52], [-55, 40], [-88, 14]];
const LOW = { x0: -182, x1: -108, z0: -84, z1: 30 }, RIDGE = { x0: -110, x1: -90, z0: -4, z1: 8 };
function sdPoly(x, z, poly) {
  let d = Infinity, inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[i], [bx, bz] = poly[j], ex = bx - ax, ez = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)));
    d = Math.min(d, (x - ax - ex * t) ** 2 + (z - az - ez * t) ** 2);
    if ((az > z) !== (bz > z) && x < (ex * (z - az)) / ez + ax) inside = !inside;
  }
  return inside ? -Math.sqrt(d) : Math.sqrt(d);
}
const sdRect = (x, z, r) => { const dx = Math.max(r.x0 - x, x - r.x1), dz = Math.max(r.z0 - z, z - r.z1); return dx > 0 || dz > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) : Math.max(dx, dz); };
// Равни площадки (тераси) за двореца, Патриаршията и пазара.
const FLATS = [{ x: 20, z: 12, hw: 19, hd: 14, h: 35.5, m: 9 }, { x: 0, z: -32, hw: 25.5, hd: 16.5, h: 27, m: 6 }];
const hillTop = (x, z) => 20 + 16 * Math.exp(-(((x - 20) / 70) ** 2 + ((z - 10) / 45) ** 2) * 1.2);
const lowTop = (z) => (z > -22 ? 17 : lerp(17, 3.5, sm((-22 - z) / 50)));
const ridgeTop = (x) => lerp(17, 21, (x + 110) / 20);
function parts(x, z) {
  const sd = sdPoly(x, z, FORT), sl = sdRect(x, z, LOW), sr = sdRect(x, z, RIDGE);
  let top = hillTop(x, z);
  for (const f of FLATS) { const d = Math.hypot(Math.max(Math.abs(x - f.x) - f.hw, 0), Math.max(Math.abs(z - f.z) - f.hd, 0)); top = lerp(top, f.h, sm(1 - d / f.m)); }
  const h1 = lerp(top, -3, sm(sd / 26));
  const h2 = lerp(lowTop(z), -3, sm(sl / 18));
  const h3 = lerp(ridgeTop(x), -3, sm(sr / 8)) - 7.5 * Math.exp(-(((x + 99.5) / 2.4) ** 2)) * (1 - sm(sr / 6));
  const out = Math.min(sd, sl, sr);
  const h4 = sm((out - 50) / 45) * (16 + 36 * noise(x * 0.011 + 3, z * 0.011 + 9)) - 3;
  const rough = sm(out / 5) * (1 - sm((out - 60) / 30)) * (noise(x * 0.13, z * 0.13) * 3.2 + noise(x * 0.4, z * 0.4) * 0.9 - 1.2);
  return { h: Math.max(h1, h2, h3, h4) + rough, out, sd, sl, sr };
}
export const heightAt = (x, z) => parts(x, z).h;
// Височина за ходене: върху подвижния мост се стъпва по дъските.
export const walkY = (x, z) => (x > -104.6 && x < -94.4 && Math.abs(z - 2) < 2.6 ? ridgeTop(x) + 0.12 : heightAt(x, z));
// Къде може да се ходи: вътре в стените, в долния град и по провлака с моста.
export function canStand(x, z) {
  if (x > -110.5 && x < -85 && Math.abs(z - 2) < (x > -95.2 ? 1.5 : 2.0)) return true;
  return sdPoly(x, z, FORT) < -2.6 || sdRect(x, z, LOW) < -2.5;
}

export const STREETS = [
  { w: 5, pts: [[-128, 7], [-110, 3], [-104, 2.3], [-94, 2], [-84, 2], [-70, 0], [-40, -4], [-10, 2], [3, 10]] },
  { w: 4, pts: [[-40, -4], [-34, -20], [-26.5, -31.5]] },
  { w: 4, pts: [[38, 20], [54, 26], [69, 32]] },
  { w: 3.6, pts: [[-70, 0], [-62, 20], [-36, 30], [-6, 34], [10, 27]] },
  { w: 3.6, pts: [[-70, 0], [-60, -20], [-44, -30], [-28, -32]] },
  { w: 4, pts: [[-142, -4], [-143.5, -28], [-149, -50], [-152, -63]] },
  { w: 3.6, pts: [[-156, 8], [-176, 11]] },
  { w: 3.2, pts: [[-128, 21], [-156, 24], [-172, 12]] },
  { w: 3.2, pts: [[-157, -6], [-172, -14], [-174, -34]] },
];
function distToStreets(x, z) {
  let best = Infinity;
  for (const s of STREETS) for (let i = 0; i < s.pts.length - 1; i++) {
    const [ax, az] = s.pts[i], [bx, bz] = s.pts[i + 1], ex = bx - ax, ez = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)));
    best = Math.min(best, Math.hypot(x - ax - ex * t, z - az - ez * t) - s.w / 2);
  }
  return best;
}

// Места за разглеждане: къде са, накъде гледат и откъде се виждат най-добре.
export const SITES = {
  gate: { x: -90, z: 2, ry: -Math.PI / 2, y: 21, keep: 13, stand: [-123, 5.5], top: [[-97, 22, 2], [-26, 22, 34]] },
  palace: { x: 0, z: -32, ry: 0, y: 27, keep: 0, stand: [-36.5, -27], pitch: -0.2, top: [[0, 29, -30], [-34, 44, 52]] },
  patriarchate: { x: 20, z: 12, ry: 0, y: 35.5, keep: 0, stand: [-14, 3], pitch: -0.22, top: [[18, 40, 12], [-30, 30, 44]] },
  baldwin: { x: 77, z: 36, ry: -2.03, y: null, keep: 9, stand: [54, 26.5], pitch: -0.3, top: [[77, 36, 36], [-26, 22, 26]] },
  market: { x: -142, z: 8, ry: 0, y: 17, keep: 0, stand: [-126, 8.5], top: [[-142, 18, 8], [6, 26, 36]] },
  smithy: { x: -134.5, z: -19, ry: -Math.PI / 2, y: 17, keep: 8, stand: [-142.5, -17], top: [[-135, 18.5, -19], [-15, 4.5, 5]] },
  pottery: { x: -154.8, z: -40, ry: Math.PI / 2, y: null, keep: 9, stand: [-146.5, -37], top: [[-153, 15.5, -40], [17, 7, 8]] },
  church40: { x: -160, z: -72, ry: 0, y: null, keep: 17, stand: [-152, -61.5], top: [[-159, 7, -71], [10, 24, 36]] },
};

function house(f, M, R, w, d, two) {
  f.box(M.stone, w, 5.8, d, 0, -3, 0);
  let top = 2.8, ow = w, od = d;
  if (two) {
    ow = w + 0.5; od = d + 0.5; top = 5.3;
    f.box(M.plaster, ow, 2.5, od, 0, 2.8, 0).box(M.wood, ow + 0.2, 0.24, od + 0.2, 0, 2.68, 0);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) f.box(M.wood, 0.22, 2.5, 0.22, x * ow / 2, 2.8, z * od / 2);
    for (let x = -ow / 2 + 1.3; x < ow / 2 - 0.6; x += 2.2) P.windowAt(f, M, x, 3.5, od / 2 + 0.02, 0, 0.75, 1.0, true);
  }
  const rh = 1.7 + R() * 0.9;
  f.add(M.tiles, gable(ow + 1.3, od + 1.3, rh), 0, top, 0).add(two ? M.plaster : M.stone, gableEnds(ow, od, rh), 0, top, 0);
  const dx = (R() - 0.5) * (w - 2.4);
  f.box(M.wood, 1.25, 2.15, 0.14, dx, 0, d / 2 + 0.02).box(M.dark, 1.0, 1.95, 0.18, dx, 0, d / 2 + 0.02).box(M.stone, 1.7, 0.22, 0.7, dx, -0.05, d / 2 + 0.3);
  if (Math.abs(dx) < w / 2 - 2.2) P.windowAt(f, M, dx + (dx > 0 ? -1.9 : 1.9), 1.2, d / 2 + 0.02, 0, 0.6, 0.7);
  f.box(M.stone, 0.7, rh + 0.8, 0.7, w * 0.26, top, -d * 0.18);
}

// Строи целия град. Връща всичко, което преживяването управлява.
export function buildTarnovgrad(stage, { weak = false } = {}) {
  const { scene } = stage;
  const V = materials(0), M = materials(0.62); // ярки за местата, приглушени за фона
  const tickers = [];
  const R = rng(7);

  // ---- Терен ----
  const SX = weak ? 110 : 150, SZ = weak ? 92 : 124;
  const geo = new THREE.PlaneGeometry(2, 2, SX, SZ).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv, col = new Float32Array(pos.count * 3);
  const C = (h) => new THREE.Color(h);
  const grassA = C(0x8ea066), grassB = C(0x7b9158), rock = C(0xa39b8b), rockD = C(0x847c6e), dust = C(0xb5aa8e), sand = C(0xb9ae8f), farC = C(0x8fa08a), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i), v = pos.getZ(i), x = -35 + 150 * u + 190 * u ** 5, z = -5 + 122 * v + 160 * v ** 5;
    const p = parts(x, z), e = 1.5;
    const slope = Math.hypot(heightAt(x + e, z) - heightAt(x - e, z), heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
    pos.setXYZ(i, x, p.h, z); uv.setXY(i, x, z);
    c.copy(grassA).lerp(grassB, noise(x * 0.07 + 5, z * 0.07));
    if (p.out < 0) c.lerp(dust, 0.35 + 0.3 * noise(x * 0.2, z * 0.2) + 0.35 * sm(1 - distToStreets(x, z) / 5));
    c.lerp(noise(x * 0.3, p.h * 0.6) > 0.5 ? rock : rockD, sm((slope - 0.55) / 0.5));
    if (p.h < 1.6) c.lerp(sand, sm((1.6 - p.h) / 1.2));
    c.lerp(farC, sm((p.out - 90) / 120) * 0.7);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: groundTex(), roughness: 1 }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  // ---- Река ----
  const wtex = groundTex(); wtex.repeat.set(1 / 28, 1 / 28);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4d7f88, roughness: 0.18, metalness: 0.15, bumpMap: wtex, bumpScale: 2.5, transparent: true, opacity: 0.9 }));
  river.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? 1200 : 1400); });
  river.position.set(-35, 0, -5);
  scene.add(river);
  tickers.push((dt, t) => { wtex.offset.set(t * 0.012, t * 0.02); });

  // ---- Улици: ленти калдъръм върху терена ----
  const cobble = M.cobble.clone();
  cobble.polygonOffset = true; cobble.polygonOffsetFactor = -3; cobble.polygonOffsetUnits = -3;
  for (const s of STREETS) {
    const pts = [];
    for (let i = 0; i < s.pts.length - 1; i++) { const [ax, az] = s.pts[i], [bx, bz] = s.pts[i + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.6); for (let k = i ? 1 : 0; k <= n; k++) pts.push([lerp(ax, bx, k / n), lerp(az, bz, k / n)]); }
    const vp = [], vu = [], idx = [];
    let len = 0;
    pts.forEach(([x, z], i) => {
      const [px, pz] = pts[Math.max(0, i - 1)], [nx, nz] = pts[Math.min(pts.length - 1, i + 1)];
      const tx = nx - px, tz = nz - pz, tl = Math.hypot(tx, tz) || 1, ox = (-tz / tl) * s.w / 2, oz = (tx / tl) * s.w / 2;
      if (i) len += Math.hypot(x - px, z - pz);
      for (const k of [-1, 0, 1]) { const qx = x + ox * k, qz = z + oz * k; vp.push(qx, walkY(qx, qz) + 0.1, qz); vu.push((k + 1) * s.w / 2, len); }
      if (i) { const a = (i - 1) * 3, b = i * 3; idx.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(vu, 2));
    g.setIndex(idx); g.computeVertexNormals();
    // Под моста няма улица: там са дъските.
    const m = new THREE.Mesh(g, cobble); m.receiveShadow = true; scene.add(m);
  }
  const plazaB = new Batch();
  plazaB.frame(20, 35.5, 12).box(cobble, 37, 0.1, 27, 0, 0, 0);
  const plaza = plazaB.build({ cast: false }); scene.add(plaza);

  // ---- Крепостни стени и кули (фон, приглушени) ----
  const WB = new Batch();
  FORT.forEach(([ax, az], i) => {
    const [bx, bz] = FORT[(i + 1) % FORT.length], len = Math.hypot(bx - ax, bz - az), n = Math.ceil(len / 9), ry = -Math.atan2(bz - az, bx - ax);
    for (let k = 0; k < n; k++) {
      const x0 = lerp(ax, bx, k / n), z0 = lerp(az, bz, k / n), x1 = lerp(ax, bx, (k + 1) / n), z1 = lerp(az, bz, (k + 1) / n), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      if (mx < -85 && Math.abs(mz - 2) < 6.5) continue; // тук е портата
      const ha = hillTop(x0, z0), hb = hillTop(x1, z1), y0 = Math.min(ha, hb) - 6, H = Math.max(ha, hb) + 6.5 - y0, L = len / n + 0.4;
      const f = WB.frame(mx, y0, mz, ry);
      f.box(M.stone, L, H, 2.2);
      const side = sdPoly(mx + Math.sin(ry) * 3, mz + Math.cos(ry) * 3, FORT) > 0 ? 1 : -1;
      for (let x = -L / 2 + 0.7; x < L / 2 - 0.5; x += 2.2) f.box(M.stone, 1.1, 1.0, 0.6, x, H, side * 0.8);
    }
    const y0 = hillTop(ax, az) - 7, H = 18.5, f = WB.frame(ax, y0, az, ry);
    f.box(M.stone, 6.4, H, 6.4);
    P.merlons(f, M.stone, 6.4, 6.4, H, 2.1, [1, 1, 0.55]);
    if (i % 2) f.add(M.tiles, hip(5.4, 5.4, 3), 0, H, 0);
  });
  scene.add(WB.build());

  // ---- Осемте места (ярки, подробни) ----
  const places = new Map(), obstacles = [];
  const builders = { gate: P.gate, palace: P.palace, patriarchate: P.patriarchate, baldwin: P.baldwin, market: P.market, smithy: P.smithy, pottery: P.pottery, church40: P.church40 };
  for (const id of Object.keys(SITES)) {
    const s = SITES[id], mats = ownSet(V), built = builders[id](mats);
    const y = s.y ?? heightAt(s.x, s.z);
    built.group.position.set(s.x, y, s.z); built.group.rotation.y = s.ry;
    built.group.userData.pickId = id;
    scene.add(built.group);
    const cs = Math.cos(s.ry), sn = Math.sin(s.ry);
    for (const o of built.obstacles || []) obstacles.push({ ...o, x: s.x + o.x * cs + o.z * sn, z: s.z - o.x * sn + o.z * cs, ry: s.ry + (o.ry || 0) });
    if (built.tick) tickers.push((dt, t) => built.tick(t));
    places.set(id, { id, group: built.group, mats: Object.values(mats), x: s.x, y, z: s.z, top: built.top, site: s, glow: 0 });
  }
  // Портата: двата каменни стълба на кулата и на предната порта не се преминават.
  for (const [x, z, hw, hd] of [[-90, -2.6, 4.6, 2.9], [-90, 6.6, 4.6, 2.9], [-107.6, -2.7, 1.3, 2.6], [-107.6, 6.7, 1.3, 2.6]]) obstacles.push({ x, z, hw, hd });

  // ---- Къщи и малки църкви (фон) ----
  const keep = [];
  for (const p of places.values()) if (p.site.keep) keep.push([p.x, p.z, p.site.keep]);
  const inRect = (x, z, cx, cz, hw, hd) => Math.abs(x - cx) < hw && Math.abs(z - cz) < hd;
  const blocked = (x, z, r) => inRect(x, z, 20, 12, 21 + r, 16 + r) || inRect(x, z, 0, -32, 27 + r, 18 + r) || inRect(x, z, -142, 8, 15 + r, 13 + r) || keep.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr + r);
  const HB = new Batch(), growB = [new Batch(), new Batch(), new Batch()];
  const chapels = [[-22, 15, 0.3], [42, -24, -0.2]];
  for (const [x, z, ry] of chapels) { P.church(HB.frame(x, hillTop(x, z), z, ry), M, 9, 5, 4.6); keep.push([x, z, 9]); obstacles.push({ x, z, hw: 7, hd: 4, ry }); }
  const placed = [];
  let lowCount = 0;
  for (const s of STREETS) for (let i = 0; i < s.pts.length - 1; i++) {
    const [ax, az] = s.pts[i], [bx, bz] = s.pts[i + 1], len = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / len, tz = (bz - az) / len;
    for (const side of [1, -1]) for (let d0 = 3 + R() * 3; d0 < len - 2; ) {
      const w = 5.6 + R() * 2.6, d = 5 + R() * 1.6, two = R() < 0.6, off = s.w / 2 + d / 2 + 0.9 + R() * 1.2;
      const x = ax + tx * (d0 + w / 2) - tz * side * off, z = az + tz * (d0 + w / 2) + tx * side * off;
      d0 += w + 1.2 + R() * 3.5;
      const fort = sdPoly(x, z, FORT) < -7.5, low = sdRect(x, z, LOW) < -5;
      if ((!fort && !low) || blocked(x, z, 4.5) || distToStreets(x, z) < d / 2 + 0.3 || placed.some(([px, pz]) => Math.hypot(x - px, z - pz) < 8.2)) continue;
      placed.push([x, z]);
      const face = Math.atan2(tz * side, -tx * side); // предната страна гледа към улицата
      const B = low ? growB[lowCount++ % 3] : HB;
      house(B.frame(x, heightAt(x, z), z, face), M, R, w, d, two);
      obstacles.push({ x, z, hw: w / 2 + 0.35, hd: d / 2 + 0.35, ry: face });
    }
  }
  scene.add(HB.build());
  const growth = growB.map((b) => { const g = b.build(); scene.add(g); return g; });

  // ---- Дървета ----
  const trunks = [], N = weak ? 110 : 260;
  for (let i = 0; trunks.length < N && i < 4000; i++) {
    const x = -260 + R() * 470, z = -190 + R() * 370, p = parts(x, z);
    if (p.h < 1.4 || (p.out > 0 && p.out < 3)) continue;
    if (p.out < 0 && (distToStreets(x, z) < 3.5 || blocked(x, z, 2) || placed.some(([px, pz]) => Math.hypot(x - px, z - pz) < 6.5) || R() < 0.55)) continue;
    const e = 1.5, slope = Math.hypot(heightAt(x + e, z) - heightAt(x - e, z), heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
    if (slope > 0.75) continue;
    trunks.push([x, p.h, z, 0.8 + R() * 0.9, R()]);
    if (p.out < 0) obstacles.push({ x, z, r: 0.5 });
  }
  const crownGeo = new THREE.SphereGeometry(1, 9, 7);
  { const p = crownGeo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.8 + noise(p.getX(i) * 2.3 + 5, p.getY(i) * 2.3 + p.getZ(i) * 1.9) * 0.45; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.9, p.getZ(i) * k); } crownGeo.computeVertexNormals(); }
  const trunkM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.26, 3, 6).translate(0, 1.5, 0), new THREE.MeshStandardMaterial({ color: 0x6a5642, roughness: 1 }), trunks.length);
  const crownM = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), trunks.length * 3);
  const m4 = new THREE.Matrix4(), tc = new THREE.Color();
  trunks.forEach(([x, y, z, s, r], i) => {
    trunkM.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(x, y - 0.2, z));
    for (let k = 0; k < 3; k++) {
      const a = r * 6 + k * 2.1, rr = (k ? 1.5 : 2.1) * s;
      crownM.setMatrixAt(i * 3 + k, m4.makeScale(rr, rr * 0.95, rr).setPosition(x + (k ? Math.cos(a) * 1.1 * s : 0), y + (3.4 + (k ? 0.2 : 1.1)) * s, z + (k ? Math.sin(a) * 1.1 * s : 0)));
      crownM.setColorAt(i * 3 + k, tc.setHex(0x6f8a52).lerp(C(0x8ea463), hash(i, k)).multiplyScalar(0.85 + r * 0.25));
    }
  });
  trunkM.castShadow = crownM.castShadow = true; crownM.receiveShadow = true;
  scene.add(trunkM, crownM);

  // ---- Небе и облаци ----
  const dome = sky({ top: 0x5b93d6, bottom: 0xdfe9ee });
  dome.scale.setScalar(22);
  scene.add(dome);
  const cc = document.createElement('canvas'); cc.width = 128; cc.height = 64;
  { const g = cc.getContext('2d'); for (let i = 0; i < 9; i++) { const x = 20 + R() * 88, y = 24 + R() * 20, r = 12 + R() * 14, gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 64); } }
  const cloudTex = new THREE.CanvasTexture(cc);
  const cloudG = new THREE.Group();
  for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.85, depthWrite: false, fog: false })); s.position.set(-700 + R() * 1400, 240 + R() * 120, -800 + R() * 500); s.scale.set(300 + R() * 200, 110 + R() * 60, 1); cloudG.add(s); }
  scene.add(cloudG);
  tickers.push((dt) => { for (const s of cloudG.children) { s.position.x += dt * 3; if (s.position.x > 750) s.position.x = -750; } });

  // ---- Хора по улиците ----
  const looks = [{ tunic: 0x8a6a4a }, { tunic: 0x6a7a5a, hat: 0xb9a36a }, { tunic: 0x7a4a5a, long: true, hair: 0x4a2a1a }, { tunic: 0x5a6a8a, cloak: 0x4a3a2a }, { tunic: 0x9a8a6a, long: true }, { tunic: 0x6a4a3a, hat: 0x5a4a3a }];
  const routes = [STREETS[0].pts, STREETS[3].pts, STREETS[5].pts, STREETS[0].pts.slice(4), STREETS[4].pts, [[-150, 2], [-134, 3], [-134, 14], [-150, 13], [-150, 2]], STREETS[0].pts.slice(0, 5), STREETS[2].pts];
  const walkers = routes.slice(0, weak ? 5 : routes.length).map((pts, i) => {
    const f = figure(looks[i % looks.length]);
    const segs = []; let total = 0;
    for (let k = 0; k < pts.length - 1; k++) { const l = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); segs.push([total, l, pts[k], pts[k + 1]]); total += l; }
    f.userData.route = { segs, total, ph: R() * 2, off: (i % 2 ? 1 : -1) * 1.1 };
    scene.add(f); return f;
  });
  tickers.push((dt, t) => {
    for (const f of walkers) {
      const r = f.userData.route, u = ((t * 1.25) / r.total + r.ph) % 2, back = u > 1, d = (back ? 2 - u : u) * r.total;
      const sg = r.segs.find((s) => d <= s[0] + s[1]) || r.segs[r.segs.length - 1], k = (d - sg[0]) / sg[1];
      const tx = sg[3][0] - sg[2][0], tz = sg[3][1] - sg[2][1], tl = Math.hypot(tx, tz), sgn = back ? -1 : 1;
      const x = lerp(sg[2][0], sg[3][0], k) - (tz / tl) * r.off * sgn, z = lerp(sg[2][1], sg[3][1], k) + (tx / tl) * r.off * sgn;
      f.position.set(x, walkY(x, z) + 0.08, z); f.rotation.y = Math.atan2(tx * sgn, tz * sgn);
      stride(f, t * 7 + r.ph * 9);
    }
  });

  // ---- Керван (стъпка 4): товарни коне и търговци по пътя към пазара ----
  const caravan = new THREE.Group();
  const horseM = new THREE.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const h = new THREE.Group();
    const add = (g, m, x, y, z, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.z = rz; o.castShadow = true; h.add(o); return o; };
    add(new THREE.CapsuleGeometry(0.34, 1.0, 4, 8).rotateZ(Math.PI / 2), horseM, 0, 1.25, 0);
    add(new THREE.CapsuleGeometry(0.17, 0.6, 4, 6), horseM, 0.85, 1.75, 0, -0.7);
    add(new THREE.CapsuleGeometry(0.14, 0.34, 4, 6).rotateZ(Math.PI / 2), horseM, 1.2, 2.05, 0);
    h.userData.legs = [[-0.55, 0.16], [-0.55, -0.16], [0.55, 0.16], [0.55, -0.16]].map(([x, z]) => { const pv = new THREE.Group(); pv.position.set(x, 1.05, z); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 1.05, 5).translate(0, -0.52, 0), horseM); l.castShadow = true; pv.add(l); h.add(pv); return pv; });
    add(new THREE.BoxGeometry(0.75, 0.5, 1.05), V.sack, -0.05, 1.65, 0);
    add(new THREE.BoxGeometry(0.5, 0.3, 1.15), [V.red, V.blue, V.ochre][i], -0.05, 2.0, 0);
    const man = figure([{ tunic: 0x2f5fa8, cloak: 0x7a1f1f, hat: 0x7a1f1f, long: true }, { tunic: 0x6a2f6a, cloak: 0x24325a, long: true }, { tunic: 0x8a5a2a, hat: 0xb9a36a }][i]);
    man.position.set(1.9, 0, 0.5); man.rotation.y = Math.PI / 2; h.add(man); h.userData.man = man;
    h.userData.lag = i * 4.2;
    caravan.add(h);
  }
  caravan.visible = false;
  scene.add(caravan);
  const ROAD = [[-181, 11], [-156, 8], [-150, 6], [-146, 4]];
  let caravanK = 0, caravanOn = false;
  tickers.push((dt, t) => {
    if (!caravanOn) return;
    caravanK = Math.min(1, caravanK + dt / 9);
    for (const h of caravan.children) {
      const d = Math.max(0, caravanK * 46 - h.userData.lag), moving = caravanK < 1 && d > 0;
      let acc = 0, x = ROAD[0][0], z = ROAD[0][1], a = 0;
      for (let k = 0; k < ROAD.length - 1; k++) { const l = Math.hypot(ROAD[k + 1][0] - ROAD[k][0], ROAD[k + 1][1] - ROAD[k][1]), q = Math.max(0, Math.min(1, (d - acc) / l)); if (d >= acc) { x = lerp(ROAD[k][0], ROAD[k + 1][0], q); z = lerp(ROAD[k][1], ROAD[k + 1][1], q); a = Math.atan2(-(ROAD[k + 1][1] - ROAD[k][1]), ROAD[k + 1][0] - ROAD[k][0]); } acc += l; }
      h.position.set(x, walkY(x, z) + 0.1, z); h.rotation.y = a;
      h.userData.legs.forEach((l, i) => { l.rotation.z = moving ? Math.sin(t * 8 + (i % 3) * 2) * 0.45 : 0; });
      stride(h.userData.man, t * 8, moving ? 1 : 0);
    }
  });

  // Светване на място при посочване.
  tickers.push((dt) => { for (const p of places.values()) { const k = p.glow; for (const m of p.mats) { m.emissive.setHex(0xffd9a0); m.emissiveIntensity = k * 0.07; } } });

  // Постепенно показване на частите на долния град (стъпка 2). parts: [храна, занаяти, търговия], стойности 0–1.
  const grow = [1, 1, 1], growTo = [1, 1, 1];
  const craftPlaces = ['smithy', 'pottery'].map((id) => places.get(id)), tradePlace = places.get('market');
  tickers.push((dt) => {
    for (let i = 0; i < 3; i++) {
      grow[i] += Math.sign(growTo[i] - grow[i]) * Math.min(Math.abs(growTo[i] - grow[i]), dt / 1.6);
      const k = sm(grow[i]);
      const list = [growth[i]].concat(i === 0 ? [places.get('church40').group] : i === 1 ? craftPlaces.map((p) => p.group) : [tradePlace.group]);
      for (const g of list) { g.visible = k > 0.001; g.scale.y = Math.max(k, 0.001); }
    }
  });

  return {
    places, obstacles, terrain, heightAt, walkY, canStand, growth,
    setGrowth(i, on, instant = false) { growTo[i] = on ? 1 : 0; if (instant) grow[i] = growTo[i]; },
    startCaravan() { caravan.visible = true; caravanOn = true; caravanK = 0; },
    resetCaravan() { caravan.visible = false; caravanOn = false; caravanK = 0; },
    tick(dt, t) { for (const fn of tickers) fn(dt, t); },
    // Постоянната част на малката карта.
    paintMap(g, px) {
      g.fillStyle = 'rgba(244,239,225,0.92)'; g.fillRect(0, 0, 400, 400);
      const poly = (pts, fill, stroke, lw = 1.5) => { g.beginPath(); pts.forEach(([x, z], i) => { const [a, b] = px(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };
      poly([[LOW.x0, LOW.z0], [LOW.x1, LOW.z0], [LOW.x1, LOW.z1], [LOW.x0, LOW.z1]], '#e3d9bd', '#b9ad8c', 1);
      poly([[-110, -2], [-90, -2], [-90, 6], [-110, 6]], '#e3d9bd');
      poly(FORT, '#d9cfae', '#7d7466', 2.2);
      g.strokeStyle = '#a2978a'; g.lineCap = 'round';
      for (const s of STREETS) { g.lineWidth = 1.6; g.beginPath(); s.pts.forEach(([x, z], i) => { const [a, b] = px(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); }
    },
    mapBounds: { x0: -190, x1: 108, z0: -90, z1: 62 },
  };
}
