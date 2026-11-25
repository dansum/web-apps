// Builds the 3D scene from parsed OSM features, painted in the manner of Van Gogh.
// Based on ../../ul_serdika/js/world.js (the realistic walk); the differences are marked "VG".
import * as THREE from '../../ul_serdika/js/three.module.min.js';
import { textTexture } from './paint.js';
import { parseNum, pointInRing } from '../../ul_serdika/js/osm.js';

// ---------------------------------------------------------------- small helpers
function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = (hash(seed) % 2147483646) + 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const ringArea = (r) => { let s = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
function orient(r, positive) { const a = ringArea(r); return (a > 0) === positive ? r : r.slice().reverse(); }
function centroid(r) {
  let x = 0, z = 0, A = 0;
  for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; const f = a[0] * b[1] - b[0] * a[1]; A += f; x += (a[0] + b[0]) * f; z += (a[1] + b[1]) * f; }
  if (Math.abs(A) < 1e-6) { let sx = 0, sz = 0; for (const p of r) { sx += p[0]; sz += p[1]; } return [sx / r.length, sz / r.length]; }
  return [x / (3 * A), z / (3 * A)];
}
function segDist(p, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
  let t = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  const x = a[0] + t * dx, z = a[1] + t * dz;
  return { d: Math.hypot(p[0] - x, p[1] - z), x, z, t };
}
function polyDist(p, pts) {
  let best = { d: Infinity };
  for (let i = 0; i < pts.length - 1; i++) { const s = segDist(p, pts[i], pts[i + 1]); if (s.d < best.d) { best = s; best.i = i; } }
  return best;
}
const col = (hex) => new THREE.Color(hex);
const normName = (s) => (s || '').toLowerCase().replace(/[„“”"'«»]/g, '').replace(/^(улица|булевард|площад|ул\.|бул\.|пл\.)\s*/, '').replace(/^(ул|бул|пл)\s+/, '').trim();

export function displayStreet(name) {
  if (!name) return '';
  let n = name.trim();
  // OSM in Bulgaria often has just the name ("Сердика"); street plates say "ул. „Сердика“"
  if (!/^(ул\.|улица|бул\.|булевард|пл\.|площад|пасаж|алея|кв\.|ж\.к\.)/i.test(n) && /^[А-Яа-яЁё0-9„“"' .-]+$/.test(n)) n = 'ул. ' + n;
  const m = n.match(/^(улица|ул\.|булевард|бул\.|площад|пл\.)\s*(.*)$/i);
  if (m) {
    const kind = { 'улица': 'ул.', 'ул.': 'ул.', 'булевард': 'бул.', 'бул.': 'бул.', 'площад': 'пл.', 'пл.': 'пл.' }[m[1].toLowerCase()];
    let rest = m[2].replace(/^["“„«]|["“”»]$/g, '');
    return `${kind} „${rest}“`;
  }
  return n;
}

// Uniform grid for segments and polygons
class Grid {
  constructor(cell = 8) { this.c = cell; this.m = new Map(); }
  k(i, j) { return i * 100003 + j; }
  add(item, x0, z0, x1, z1) {
    const c = this.c;
    for (let i = Math.floor(Math.min(x0, x1) / c); i <= Math.floor(Math.max(x0, x1) / c); i++)
      for (let j = Math.floor(Math.min(z0, z1) / c); j <= Math.floor(Math.max(z0, z1) / c); j++) {
        const k = this.k(i, j); let a = this.m.get(k); if (!a) this.m.set(k, (a = [])); a.push(item);
      }
  }
  query(x, z, r) {
    const c = this.c, out = new Set();
    for (let i = Math.floor((x - r) / c); i <= Math.floor((x + r) / c); i++)
      for (let j = Math.floor((z - r) / c); j <= Math.floor((z + r) / c); j++) {
        const a = this.m.get(this.k(i, j)); if (a) for (const it of a) out.add(it);
      }
    return out;
  }
}

// Geometry accumulator: one draw call per material
class Batch {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.i = []; this.o = []; this.vc = 0; }
  v(x, y, z, nx, ny, nz, u, v, c) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.u.push(u, v); this.c.push(c.r, c.g, c.b); return this.vc++; }
  t(a, b, c, owner = -1) {
    // keep counter-clockwise winding as seen from the vertex normal
    const P = this.p, N = this.n;
    const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az;
    const wx = P[c * 3] - ax, wy = P[c * 3 + 1] - ay, wz = P[c * 3 + 2] - az;
    const cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
    if (cx * N[a * 3] + cy * N[a * 3 + 1] + cz * N[a * 3 + 2] < 0) this.i.push(a, c, b); else this.i.push(a, b, c);
    this.o.push(owner);
  }
  quad(A, B, C, D, n, uv, c, owner) {
    // VG: raised surfaces are split into a grid so the crooked-world shader can bend them
    const seg = Batch.seg;
    if (seg && Math.max(A[1], B[1], C[1], D[1]) > 0.6) {
      const nu = Math.min(24, Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) / seg)));
      const nv = Math.min(24, Math.max(1, Math.ceil(Math.hypot(D[0] - A[0], D[1] - A[1], D[2] - A[2]) / seg)));
      if (nu > 1 || nv > 1) {
        const base = this.vc, L = (p, q, t) => p.map((x, i) => x + (q[i] - x) * t);
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
          const su = i / nu, tv = j / nv;
          const P = L(L(A, B, su), L(D, C, su), tv), U = L(L(uv[0], uv[1], su), L(uv[3], uv[2], su), tv);
          this.v(P[0], P[1], P[2], n[0], n[1], n[2], U[0], U[1], c);
        }
        for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
          const a = base + j * (nu + 1) + i;
          this.t(a, a + 1, a + nu + 2, owner); this.t(a, a + nu + 2, a + nu + 1, owner);
        }
        return;
      }
    }
    const a = this.v(...A, ...n, ...uv[0], c), b = this.v(...B, ...n, ...uv[1], c), cc = this.v(...C, ...n, ...uv[2], c), d = this.v(...D, ...n, ...uv[3], c);
    this.t(a, b, cc, owner); this.t(a, cc, d, owner);
  }
  geo(geom, m, c, owner = -1) {
    const g = geom.index ? geom.toNonIndexed() : geom;
    const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
    const nm = new THREE.Matrix3().getNormalMatrix(m), v = new THREE.Vector3(), nn = new THREE.Vector3();
    const base = this.vc;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m); nn.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
      this.v(v.x, v.y, v.z, nn.x, nn.y, nn.z, uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0, c);
    }
    for (let i = 0; i < pos.count; i += 3) this.t(base + i, base + i + 1, base + i + 2, owner);
  }
  mesh(mat, { cast = true, receive = true } = {}) {
    if (!this.vc) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.vc > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = cast; m.receiveShadow = receive;
    m.userData.owners = Int32Array.from(this.o);
    m.matrixAutoUpdate = false; m.updateMatrix();
    return m;
  }
}

function mergeGeos(list) {
  const pos = [], nor = [], uv = [];
  for (const [g0, m] of list) {
    const g = (g0.index ? g0.toNonIndexed() : g0.clone());
    if (m) g.applyMatrix4(m);
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
    if (g.attributes.uv) uv.push(...g.attributes.uv.array); else uv.push(...new Array(g.attributes.position.count * 2).fill(0));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
const M4 = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(sx, sy, sz));

function instanced(geo, mat, list, { cast = true, receive = false, colors = null } = {}) {
  if (!list.length) return null;
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((mx, i) => m.setMatrixAt(i, mx));
  if (colors) colors.forEach((c, i) => m.setColorAt(i, c));
  m.castShadow = cast; m.receiveShadow = receive;
  m.instanceMatrix.needsUpdate = true;
  m.computeBoundingSphere();
  return m;
}

// ---------------------------------------------------------------- constants
const DRIVABLE = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'road', 'busway',
  'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link']);
const ROAD_W = { motorway: 20, trunk: 18, primary: 14, secondary: 11, tertiary: 9, unclassified: 7, residential: 7, living_street: 6, service: 4.2, road: 7, busway: 7,
  primary_link: 7, secondary_link: 7, tertiary_link: 6, pedestrian: 6, footway: 2.2, path: 1.8, cycleway: 2, steps: 2.4, track: 3, bridleway: 2 };
const BAY = 3.4; // m, one window bay
// VG: the plaster colours of Arles, saturated (the Yellow House, pale blues and pinks, lilac shadows)
const PLASTER = ['#f2cf6a', '#f0d890', '#e9b85a', '#f3e2b0', '#d9a35c', '#c9d9c0', '#a9c4dc', '#e8c0a0', '#f4dca0', '#e3c9e0', '#f6e6b8', '#b8d0e8', '#f0c890', '#d8e4b0', '#f2b880', '#e0d0f0'];
const CAR_COLORS = ['#b9bcbf', '#a7abb0', '#dcdcd8', '#1d1f22', '#1d1f22', '#1d1f22', '#5b6066', '#5b6066', '#2c3e66', '#8a1c1c', '#6d7174', '#2f4f3f', '#b8a07a', '#3a6aa0', '#9b9da0'];

// Corrections for well-known buildings nearby, where the OSM outline alone gives the wrong shape or height.
// Keys are OSM ids (w = way, r = relation). Values are applied on top of the OSM tags.
const LANDMARKS = { // VG: same corrections, with painted colours
  w96646570: { 'roof:shape': 'dome', 'roof:height': '12', 'building:colour': '#f2e2b8', 'roof:colour': '#a8e0d0', _domeScale: 0.62 }, // Sofia Synagogue, 31 m to the top of the dome
  w166213386: { 'building:levels': '2', height: '14', 'building:colour': '#f2c860', 'roof:shape': 'hipped' }, // Central Mineral Bath
  w48337730: { 'building:levels': '2', height: '13', 'building:colour': '#e8c890', 'roof:shape': 'hipped' }, // Central Market Hall
  w157740233: { 'building:colour': '#e8dcc8', 'roof:shape': 'flat' }, // TSUM
  w157740278: { 'building:colour': '#e6dcc0', 'roof:shape': 'flat' }, // Council of Ministers
  r3442483: { 'building:colour': '#ece0c0', 'roof:shape': 'flat' }, // National Assembly (former Party House)
  w96640830: { 'building:colour': '#e8a070' }, // Banya Bashi Mosque (its parts carry the shape)
};

function parseColour(s, fallback) {
  if (!s) return col(fallback);
  try {
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = '#010203'; c.fillStyle = s.trim();
    if (c.fillStyle === '#010203' && !/^#?010203$/.test(s)) return col(fallback);
    return col(c.fillStyle);
  } catch { return col(fallback); }
}

// ================================================================= build
export function buildWorld(F, ctx) {
  const { textures: T, target } = ctx;
  const group = new THREE.Group();
  const info = [];           // per building: shown when you look at it
  const colliders = new Grid(6);
  const buildingGrid = new Grid(12);
  const edgeGrid = new Grid(8);
  const r0 = rng('serdika20');
  Batch.seg = ctx.subdivide || 0;

  // ---------- materials
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const nightMats = []; // VG: facade materials whose windows light up at night
  const offset = (m, f) => { m.polygonOffset = true; m.polygonOffsetFactor = f; m.polygonOffsetUnits = f; return m; };
  const mats = {
    classic: lam({ map: T.facade.classic.day, emissiveMap: T.facade.classic.night, emissive: 0x000000, vertexColors: true }),
    panel: lam({ map: T.facade.panel.day, emissiveMap: T.facade.panel.night, emissive: 0x000000, vertexColors: true }),
    glass: lam({ map: T.facade.glass.day, emissiveMap: T.facade.glass.night, emissive: 0x000000, vertexColors: true }),
    brick: lam({ map: T.facade.brick.day, emissiveMap: T.facade.brick.night, emissive: 0x000000, vertexColors: true }),
    shop: lam({ map: T.ground.shop.day, emissiveMap: T.ground.shop.night, emissive: 0x000000, vertexColors: true }),
    plain: lam({ map: T.ground.plain.day, emissiveMap: T.ground.plain.night, emissive: 0x000000, vertexColors: true }),
    roofTiles: lam({ map: T.roofTiles, vertexColors: true }),
    roofFlat: lam({ map: T.roofFlat, vertexColors: true }),
    dome: lam({ map: T.roofFlat, vertexColors: true }),
    asphalt: offset(lam({ map: T.asphalt, vertexColors: true }), -4),
    sett: offset(lam({ map: T.sett, vertexColors: true }), -5),
    settYellow: offset(lam({ map: T.settYellow, vertexColors: true }), -5),
    paving: offset(lam({ map: T.paving, vertexColors: true }), -2),
    pavers: offset(lam({ map: T.pavers, vertexColors: true }), -3),
    grass: offset(lam({ map: T.grass, vertexColors: true }), -1),
    dirt: offset(lam({ map: T.dirt, vertexColors: true }), -1),
    water: offset(lam({ map: T.asphalt, color: 0x6aa8e0 }), -6),
    marking: offset(lam({ color: 0xf6ecc8 }), -8),
    curb: lam({ map: T.roofFlat, color: 0xe8e0f0 }),
    rail: offset(lam({ color: 0x3a4a7a }), -9),
    wallStone: lam({ map: T.facade.classic.day, vertexColors: true }),
  };
  const B = {}; for (const k of Object.keys(mats)) B[k] = new Batch();
  for (const k of ['classic', 'panel', 'glass', 'brick', 'shop', 'plain']) nightMats.push(mats[k]);

  // ---------- ground disc
  {
    const g = new THREE.CircleGeometry(ctx.loadRadius + 120, 96);
    g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 3.2, -pos.getZ(i) / 3.2);
    const m = new THREE.Mesh(g, lam({ map: T.paving, color: 0xffffff }));
    m.receiveShadow = true;
    group.add(m);
  }

  // ---------- polygons on the ground
  function fill(batch, outer, holes, y, scale, c, owner = -1) {
    const o = orient(outer, true), hs = holes.map((h) => orient(h, false));
    const contour = o.map((p) => new THREE.Vector2(p[0], p[1]));
    const hv = hs.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
    let faces;
    try { faces = THREE.ShapeUtils.triangulateShape(contour, hv); } catch { return; }
    const all = contour.concat(...hv);
    const base = batch.vc;
    for (const p of all) batch.v(p.x, y, p.y, 0, 1, 0, p.x / scale, -p.y / scale, c);
    for (const f of faces) batch.t(base + f[0], base + f[1], base + f[2], owner);
  }

  const white = col('#ffffff');
  for (const a of F.areas) {
    const t = a.tags;
    if (parseNum(t.layer) < 0 || parseNum(t.level) < 0 || t.indoor || t.location === 'underground' || t.tunnel) continue;
    let mat = null, sc = 4, c = white, y = 0.01;
    const lu = t.landuse, le = t.leisure, na = t.natural, am = t.amenity, ah = t['area:highway'];
    if (['grass', 'meadow', 'village_green', 'recreation_ground', 'flowerbed'].includes(lu) || ['park', 'garden', 'dog_park'].includes(le) || ['grassland', 'scrub', 'heath'].includes(na)) { mat = 'grass'; sc = 6; y = 0.015; if (t.landuse === 'flowerbed') c = col('#cdbb9a'); }
    else if (le === 'playground') { mat = 'dirt'; sc = 3; c = col('#d9a07a'); y = 0.02; }
    else if (le === 'pitch') { mat = 'grass'; c = col('#7fa35a'); y = 0.02; }
    else if (na === 'water' || am === 'fountain' || t.water) { mat = 'water'; y = 0.25; }
    else if (lu === 'construction' || lu === 'brownfield') { mat = 'dirt'; sc = 5; y = 0.012; }
    else if (am === 'parking' && (!t.parking || t.parking === 'surface')) { mat = 'asphalt'; sc = 6; c = col('#d9d9d9'); y = 0.018; }
    else if (ah) { mat = DRIVABLE.has(ah) ? 'asphalt' : 'pavers'; sc = DRIVABLE.has(ah) ? 6 : 4; y = DRIVABLE.has(ah) ? 0.02 : 0.016; }
    else if (t.highway === 'pedestrian' || t.place === 'square' || t.highway === 'footway') { mat = 'pavers'; sc = 4; y = 0.016; }
    if (!mat) continue;
    fill(B[mat], a.outer, a.holes, y, sc, c);
    if (mat === 'water') {
      // basin rim of a fountain
      const o = orient(a.outer, true);
      for (let i = 0; i < o.length; i++) {
        const p = o[i], q = o[(i + 1) % o.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 0.05) continue;
        const nx = (q[1] - p[1]) / L, nz = -(q[0] - p[0]) / L;
        B.curb.quad([p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], 0.45, q[1]], [p[0], 0.45, p[1]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], col('#d7d3c8'));
        const ix = -nx * 0.35, iz = -nz * 0.35;
        B.curb.quad([p[0], 0.45, p[1]], [q[0], 0.45, q[1]], [q[0] + ix, 0.45, q[1] + iz], [p[0] + ix, 0.45, p[1] + iz], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], col('#e4e0d6'));
      }
    }
  }

  // ---------- roads, paths, rails
  const keyCount = new Map();
  const roads = [], trams = [], named = [];
  for (const l of F.lines) {
    const t = l.tags;
    if (t.highway && t.tunnel !== 'yes' && t.tunnel !== 'building_passage' && t.indoor !== 'yes' && !(parseNum(t.layer) < 0) && !(parseNum(t.level) < 0) && !['proposed', 'construction', 'corridor', 'elevator', 'platform'].includes(t.highway)) {
      roads.push(l);
      if (DRIVABLE.has(t.highway)) for (const k of new Set(l.keys)) keyCount.set(k, (keyCount.get(k) || 0) + 1);
      if (t.name) named.push(l);
    }
    if (t.railway === 'tram' && t.tunnel !== 'yes') trams.push(l);
  }
  // a node is a junction if it is shared by two drivable ways, or is an inner node of one and the end of another
  const junction = new Set([...keyCount].filter(([, n]) => n > 1).map(([k]) => k));

  function roadWidth(t) {
    let w = parseNum(t.width);
    if (!(w > 0)) {
      const lanes = parseNum(t.lanes);
      if (lanes > 0 && DRIVABLE.has(t.highway)) w = lanes * 3.2 + (t.oneway === 'yes' ? 0.6 : 0.8);
      else w = ROAD_W[t.highway] || 3;
      if (t.highway === 'service' && t.service === 'parking_aisle') w = 5;
      if (t.highway === 'service' && t.service === 'driveway') w = 3;
    }
    return Math.min(30, w);
  }

  // strip along a polyline with round joints, world-space UVs
  function strip(batch, pts, w, y, sc, c) {
    const h = w / 2;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 0.01) continue;
      const nx = -dz / L * h, nz = dx / L * h;
      const P = [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
      batch.quad(...P.map((p) => [p[0], y, p[1]]), [0, 1, 0], P.map((p) => [p[0] / sc, -p[1] / sc]), c);
    }
    // joint discs
    const seg = 14;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], base = batch.vc;
      batch.v(p[0], y, p[1], 0, 1, 0, p[0] / sc, -p[1] / sc, c);
      for (let k = 0; k <= seg; k++) { const an = k / seg * Math.PI * 2, x = p[0] + Math.cos(an) * h, z = p[1] + Math.sin(an) * h; batch.v(x, y, z, 0, 1, 0, x / sc, -z / sc, c); }
      for (let k = 0; k < seg; k++) batch.t(base, base + 1 + k, base + 2 + k);
    }
  }

  // portions of a polyline away from junctions: returns list of [from, to] point pairs per segment
  function trimmed(l, trim) {
    const out = [];
    for (let i = 0; i < l.pts.length - 1; i++) {
      const a = l.pts[i], b = l.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.5) continue;
      const ta = junction.has(l.keys[i]) || i === 0 ? trim / L : 0, tb = junction.has(l.keys[i + 1]) || i === l.pts.length - 2 ? 1 - trim / L : 1;
      if (tb - ta <= 0.02) continue;
      out.push([[a[0] + (b[0] - a[0]) * ta, a[1] + (b[1] - a[1]) * ta], [a[0] + (b[0] - a[0]) * tb, a[1] + (b[1] - a[1]) * tb], (b[0] - a[0]) / L, (b[1] - a[1]) / L]);
    }
    return out;
  }

  const roadInfo = [];
  for (const l of roads) {
    const t = l.tags, hw = t.highway;
    const w = roadWidth(t);
    const drv = DRIVABLE.has(hw);
    l.width = w; l.drivable = drv;
    const s = (t.surface || '').toLowerCase();
    if (drv || hw === 'busway') {
      const yellow = /yellow|жълт/.test((t['surface:colour'] || t['surface:color'] || '') + (t.note || ''));
      const isSett = /sett|cobble|paving_stones|stone/.test(s);
      strip(isSett ? (yellow ? B.settYellow : B.sett) : B.asphalt, l.pts, w, isSett ? 0.025 : 0.02, isSett ? 3 : 6, white);
      roadInfo.push(l);
    } else if (hw === 'pedestrian') {
      strip(B.pavers, l.pts, w, 0.016, 4, white);
    } else if (['footway', 'path', 'cycleway', 'track', 'bridleway', 'steps'].includes(hw)) {
      if (t.footway === 'sidewalk' || t.footway === 'crossing' || t.footway === 'traffic_island') continue;
      const dirtLike = /dirt|ground|earth|gravel|grass|fine_gravel|compacted|unpaved/.test(s) || hw === 'track';
      strip(dirtLike ? B.dirt : B.pavers, l.pts, w, 0.014, dirtLike ? 4 : 3, hw === 'cycleway' ? col('#e3a59a') : white);
    }
  }

  // curbs and centre lines
  for (const l of roadInfo) {
    const t = l.tags, w = l.width;
    if (w >= 5 && t.highway !== 'service') {
      for (const [a, b, dx, dz] of trimmed(l, w / 2 + 3.5)) {
        for (const side of [1, -1]) {
          const nx = -dz * side, nz = dx * side, o = w / 2;
          const A = [a[0] + nx * o, a[1] + nz * o], Bp = [b[0] + nx * o, b[1] + nz * o];
          const A2 = [A[0] + nx * 0.22, A[1] + nz * 0.22], B2 = [Bp[0] + nx * 0.22, Bp[1] + nz * 0.22];
          const c = col('#c4c1b9');
          B.curb.quad([A[0], 0, A[1]], [Bp[0], 0, Bp[1]], [Bp[0], 0.15, Bp[1]], [A[0], 0.15, A[1]], [-nx, 0, -nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c);
          B.curb.quad([A[0], 0.15, A[1]], [Bp[0], 0.15, Bp[1]], [B2[0], 0.15, B2[1]], [A2[0], 0.15, A2[1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c);
        }
      }
    }
    const lanes = parseNum(t.lanes);
    const marked = ['primary', 'secondary', 'tertiary', 'trunk'].includes(t.highway) || lanes >= 2;
    if (marked && t.oneway !== 'yes' && w >= 6.5 && !/sett|cobble/.test(t.surface || '')) {
      for (const [a, b, dx, dz] of trimmed(l, w / 2 + 6)) {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const solid = t.highway === 'primary' && lanes >= 4;
        for (let s = 0; s < L; s += solid ? L : 6) {
          const e = Math.min(L, s + (solid ? L : 3));
          const p = [a[0] + dx * s, a[1] + dz * s], q = [a[0] + dx * e, a[1] + dz * e], nx = -dz * 0.06, nz = dx * 0.06;
          B.marking.quad([p[0] + nx, 0.03, p[1] + nz], [q[0] + nx, 0.03, q[1] + nz], [q[0] - nx, 0.03, q[1] - nz], [p[0] - nx, 0.03, p[1] - nz], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], white);
        }
      }
    }
  }

  // node lookup: which road passes through a node key
  const roadAtKey = new Map();
  for (const l of roadInfo) l.keys.forEach((k, i) => { if (!roadAtKey.has(k)) roadAtKey.set(k, { l, i }); });
  function roadDirAt(key) {
    const r = roadAtKey.get(key); if (!r) return null;
    const { l, i } = r, a = l.pts[Math.max(0, i - 1)], b = l.pts[Math.min(l.pts.length - 1, i + 1)];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { dx: (b[0] - a[0]) / L, dz: (b[1] - a[1]) / L, w: l.width, l };
  }

  // zebra crossings
  const crossings = [];
  for (const n of F.nodes) {
    const t = n.tags;
    if (!(t.highway === 'crossing' || t.railway === 'crossing' || t.crossing)) continue;
    if (t.crossing === 'unmarked' || t.crossing === 'no') continue;
    const d = roadDirAt(n.key); if (!d) continue;
    crossings.push(n.p);
    const nx = -d.dz, nz = d.dx, half = d.w / 2;
    for (let s = -half + 0.3; s < half - 0.2; s += 1.0) {
      const cx = n.p[0] + nx * (s + 0.25), cz = n.p[1] + nz * (s + 0.25), ex = d.dx * 1.6, ez = d.dz * 1.6, wx = nx * 0.25, wz = nz * 0.25;
      B.marking.quad([cx - ex - wx, 0.032, cz - ez - wz], [cx + ex - wx, 0.032, cz + ez - wz], [cx + ex + wx, 0.032, cz + ez + wz], [cx - ex + wx, 0.032, cz - ez + wz], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], white);
    }
  }

  // tram rails and overhead line
  const wirePts = [], poleMx = [], tramPolys = [];
  for (const l of trams) {
    tramPolys.push(l.pts);
    const g = (parseNum(l.tags.gauge) || 1009) / 1000;
    for (const side of [1, -1]) {
      for (let i = 0; i < l.pts.length - 1; i++) {
        const a = l.pts[i], b = l.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
        const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = -dz, nz = dx;
        const o1 = side * g / 2, o2 = o1 + side * 0.07;
        B.rail.quad([a[0] + nx * o1, 0.035, a[1] + nz * o1], [b[0] + nx * o1, 0.035, b[1] + nz * o1], [b[0] + nx * o2, 0.035, b[1] + nz * o2], [a[0] + nx * o2, 0.035, a[1] + nz * o2], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], white);
      }
    }
    for (let i = 0; i < l.pts.length - 1; i++) { const a = l.pts[i], b = l.pts[i + 1]; wirePts.push(a[0], 6.2, a[1], b[0], 6.2, b[1]); }
  }

  // ---------- buildings
  const parts = F.buildings.filter((b) => b.tags['building:part'] && !b.tags.building);
  const partCentroids = parts.map((p) => centroid(p.outer));
  const levelsDefault = (kind, r) => {
    switch (kind) {
      case 'house': case 'detached': case 'semidetached_house': case 'terrace': return 2;
      case 'apartments': return 5 + Math.floor(r() * 3);
      case 'residential': return 4 + Math.floor(r() * 3);
      case 'garage': case 'garages': case 'shed': case 'kiosk': case 'hut': case 'carport': case 'service': case 'toilets': case 'transformer_tower': case 'roof': case 'cabin': return 1;
      case 'industrial': case 'warehouse': case 'retail': return 2;
      case 'church': case 'cathedral': case 'mosque': case 'synagogue': case 'chapel': case 'temple': return 3;
      case 'hotel': return 6;
      default: return 3 + Math.floor(r() * 4);
    }
  };
  const hotTarget = target && target.osmId ? target.osmId.replace(/^way\//, 'w').replace(/^relation\//, 'r') : null;
  let targetIndex = -1;

  const shopNodes = F.nodes.filter((n) => n.tags.name && (n.tags.shop || n.tags.amenity || n.tags.office || n.tags.craft || n.tags.tourism || n.tags.healthcare || n.tags.club) && !n.tags.highway);
  const addrNodes = F.nodes.filter((n) => n.tags['addr:housenumber']);

  const bldgs = [];
  for (const b of F.buildings) {
    const t = b.tags;
    if (t.location === 'underground' || parseNum(t.layer) < 0 || t.building === 'no') continue;
    if (Math.abs(ringArea(b.outer)) < 2) continue;
    const isPart = !!t['building:part'] && !t.building;
    if (isPart && t['building:part'] === 'no') continue;
    // an outline whose parts are mapped separately is not drawn (the parts are), but still blocks you
    let hidden = false;
    if (!isPart && parts.length) {
      const bb = b.outer.reduce((m, p) => [Math.min(m[0], p[0]), Math.min(m[1], p[1]), Math.max(m[2], p[0]), Math.max(m[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
      hidden = partCentroids.some((c) => c[0] > bb[0] && c[0] < bb[2] && c[1] > bb[1] && c[1] < bb[3] && pointInRing(c, b.outer));
    }
    bldgs.push({ b, isPart, hidden });
  }

  bldgs.forEach((rec, idx) => {
    const { b, isPart } = rec;
    const outer = orient(b.outer, true), holes = b.holes.map((h) => orient(h, false));
    rec.outer = outer; rec.holes = holes;
    const bb = outer.reduce((m, p) => [Math.min(m[0], p[0]), Math.min(m[1], p[1]), Math.max(m[2], p[0]), Math.max(m[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
    rec.bb = bb;
    if (!isPart) buildingGrid.add(rec, bb[0], bb[1], bb[2], bb[3]);
  });

  // building parts: find the outline they belong to
  for (const rec of bldgs) {
    if (!rec.isPart) continue;
    const c = centroid(rec.outer);
    for (const p of buildingGrid.query(c[0], c[1], 1)) if (pointInRing(c, p.outer)) { rec.parent = p; break; }
  }

  // addresses from address nodes inside buildings
  for (const n of addrNodes) {
    for (const rec of buildingGrid.query(n.p[0], n.p[1], 0.5)) {
      if (n.p[0] < rec.bb[0] || n.p[0] > rec.bb[2] || n.p[1] < rec.bb[1] || n.p[1] > rec.bb[3]) continue;
      if (pointInRing(n.p, rec.outer)) { (rec.addrNodes || (rec.addrNodes = [])).push(n); if (target && target.osmId === 'node/' + n.id) rec.isTarget = true; }
    }
  }

  for (let idx = 0; idx < bldgs.length; idx++) {
    const rec = bldgs[idx];
    const { b, isPart, hidden, outer, holes } = rec;
    const t = { ...(rec.parent ? LANDMARKS[rec.parent.b.id] || {} : {}), ...b.tags, ...(LANDMARKS[b.id] || {}) };
    if (isPart && rec.parent) {
      // parts without their own height take it from the building (practical, though OSM does not require it)
      const pt = rec.parent.b.tags;
      if (!t['building:levels'] && !t.height && !t['roof:height']) { if (pt['building:levels']) t['building:levels'] = pt['building:levels']; if (pt.height) t.height = pt.height; }
      if (t['building:part'] === 'roof' && /dome|onion/.test(t['roof:shape'] || '') && !t.min_height && !t['building:min_level']) t['building:part'] = 'yes';
      for (const k of ['building:material', 'building:colour']) if (!t[k] && pt[k]) t[k] = pt[k];
    }
    const kind = isPart && rec.parent && /^(yes|roof|tower|base)$/.test(t['building:part']) ? (t['building:part'] === 'tower' ? 'tower' : rec.parent.b.tags.building) : (t.building || t['building:part']);
    const r = rng(b.id);
    const levels = parseNum(t['building:levels']);
    let H = parseNum(t.height);
    let minH = parseNum(t.min_height);
    const minLevel = parseNum(t['building:min_level']);
    let lv = levels, estimated = false;
    if (!(lv > 0)) { if (H > 0) lv = Math.max(1, Math.round(H / 3.2)); else { lv = levelsDefault(kind, r); estimated = true; } }
    if (!(H > 0)) H = lv * 3.15 + (lv >= 2 ? 0.9 : 0.4);
    if (['church', 'cathedral', 'mosque', 'synagogue'].includes(kind) && estimated) H = 12;
    if (!(minH >= 0)) minH = minLevel > 0 ? minLevel * 3.2 : 0;
    if (kind === 'roof' || kind === 'carport') { if (!(minH > 0)) minH = Math.max(2.5, H - 0.4); }
    let roofShape = (t['roof:shape'] || '').toLowerCase();
    let roofH = parseNum(t['roof:height']);
    const roofLevels = parseNum(t['roof:levels']);
    if (!(roofH > 0) && roofLevels > 0) roofH = roofLevels * 2.6;
    // roof:height is part of height in OSM
    let wallTop = H;
    const isTarget = rec.isTarget || hotTarget === b.id;
    if (isTarget) targetIndex = idx;

    // facade style and colour
    const mat = (t['building:material'] || '').toLowerCase();
    let style = 'classic';
    if (mat === 'glass' || (['office', 'commercial'].includes(kind) && lv >= 7 && r() < 0.6)) style = 'glass';
    else if (mat === 'brick') style = 'brick';
    else if ((kind === 'apartments' && lv >= 8) || mat === 'concrete' || mat === 'panel') style = 'panel';
    const wallCol = parseColour(t['building:colour'] || t['building:color'], style === 'panel' ? '#d9d7d0' : PLASTER[hash(b.id) % PLASTER.length]);
    if (style === 'glass') wallCol.set(t['building:colour'] ? wallCol : '#ffffff');

    // roof
    const small = Math.abs(ringArea(outer)) < 2500;
    if (!roofShape) {
      const flatKinds = ['garage', 'garages', 'kiosk', 'industrial', 'warehouse', 'retail', 'commercial', 'roof', 'carport', 'service', 'transformer_tower'];
      roofShape = (lv <= 7 && !flatKinds.includes(kind) && style !== 'glass' && style !== 'panel' && small) ? 'hipped' : 'flat';
    }
    const pitched = ['hipped', 'gabled', 'half-hipped', 'mansard', 'gambrel', 'saltbox', 'round', 'skillion'].includes(roofShape);
    const perim = outer.reduce((s, p, i) => s + Math.hypot(outer[(i + 1) % outer.length][0] - p[0], outer[(i + 1) % outer.length][1] - p[1]), 0);
    const width = 2 * Math.abs(ringArea(outer)) / perim;
    if (pitched || ['pyramidal', 'dome', 'onion', 'cone'].includes(roofShape)) {
      if (!(roofH > 0)) roofH = roofShape === 'dome' || roofShape === 'onion' ? Math.min(width * 0.5, 12) : Math.min(3.2, Math.max(1.2, width * 0.28));
      // slim towers (minarets, spires) get a tall pointed top
      if ((roofShape === 'pyramidal' || roofShape === 'cone') && width < 5 && !(parseNum(t['roof:height']) > 0)) roofH = Math.max(3, width * 2.4);
      if (pitched) roofH = Math.min(roofH, Math.max(3.5, width * 0.6));
      if (t.height) wallTop = Math.max(minH + 2, H - roofH);
    }
    const roofCol = parseColour(t['roof:colour'] || t['roof:color'], pitched || roofShape === 'pyramidal' ? ['#ffffff', '#f4d0c0', '#ffe0c8', '#e8c0c8', '#d8c8e8'][hash(b.id + 'r') % 5] : ['#ffffff', '#e0e0f8', '#f0e8ff'][hash(b.id + 'r') % 3]);

    const name = t.name || (rec.parent && rec.parent.b.tags.name) || '';
    let addr = '';
    if (!t['addr:housenumber'] && rec.parent && rec.parent.b.tags['addr:housenumber']) addr = `${displayStreet(rec.parent.b.tags['addr:street'] || '')} ${rec.parent.b.tags['addr:housenumber']}`.trim();
    if (t['addr:housenumber']) addr = `${displayStreet(t['addr:street'] || '')} ${t['addr:housenumber']}`.trim();
    else if (rec.addrNodes) addr = rec.addrNodes.map((n) => `${displayStreet(n.tags['addr:street'] || '')} ${n.tags['addr:housenumber']}`.trim()).filter((v, i, a) => a.indexOf(v) === i).join(', ');
    const owner = info.length;
    info.push({ id: b.id, c: centroid(outer), name, addr, levels: lv, estimated, kind, height: Math.round(H * 10) / 10, start: t.start_date || (rec.parent && rec.parent.b.tags.start_date) || '', architect: t.architect || '', heritage: t.heritage || t['heritage:operator'] || '', wiki: t.wikipedia || '', isTarget });
    rec.owner = owner; rec.H = H; rec.minH = minH; rec.lv = lv; rec.style = style; rec.wallTop = wallTop;

    // collision and wall lists
    if (minH < 1.5 && kind !== 'roof' && kind !== 'carport') {
      for (const ring of [outer, ...holes]) for (let i = 0; i < ring.length; i++) { const a = ring[i], c = ring[(i + 1) % ring.length]; colliders.add([a, c], a[0], a[1], c[0], c[1]); }
    }
    if (hidden) continue;
    // walls
    const groundBand = !isPart || minH < 0.5;
    const gH = minH < 0.5 && lv >= 2 && wallTop >= 6 && style !== 'glass' && kind !== 'house' ? 4.0 : 0;
    rec.gH = gH;
    const upper = Math.max(1, gH ? lv - 1 : lv);
    const floorH = (wallTop - Math.max(gH, minH)) / upper;
    const wb = B[style];
    for (const ring of [outer, ...holes]) {
      for (let i = 0; i < ring.length; i++) {
        const p = ring[i], q = ring[(i + 1) % ring.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
        if (L < 0.05) continue;
        const n = [dz / L, 0, -dx / L];
        const bays = L < 2.2 ? 0 : Math.max(1, Math.round(L / BAY));
        const u0 = bays ? 0 : 0.004, u1 = bays ? bays * 0.25 : 0.004;
        edgeGrid.add({ a: p, b: q, n: [n[0], n[2]], rec, L }, p[0], p[1], q[0], q[1]);
        const y0 = Math.max(gH, minH), y1 = wallTop;
        if (y1 > y0 + 0.05) {
          const v0 = 0, v1 = (y1 - y0) / floorH * 0.25;
          wb.quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], n, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], wallCol, owner);
        }
        if (gH && groundBand) rec.groundEdges = (rec.groundEdges || []).concat([[p, q, n, L]]);
        // underside of raised parts
      }
    }
    // roof
    const top = wallTop;
    const holesV = holes;
    if (roofShape === 'flat' || (!pitched && !['pyramidal', 'dome', 'onion', 'cone'].includes(roofShape))) {
      fill(B.roofFlat, outer, holesV, top, 4, roofCol, owner);
      // parapet
      if (lv >= 3) for (const ring of [outer, ...holes]) for (let i = 0; i < ring.length; i++) {
        const p = ring[i], q = ring[(i + 1) % ring.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz); if (L < 0.05) continue;
        const n = [dz / L, 0, -dx / L];
        wb.quad([p[0], top, p[1]], [q[0], top, q[1]], [q[0], top + 0.6, q[1]], [p[0], top + 0.6, p[1]], n, [[0.004, 0], [0.004, 0], [0.004, 0.02], [0.004, 0.02]], wallCol, owner);
        const nI = [-n[0], 0, -n[2]], ix = -n[0] * 0.25, iz = -n[2] * 0.25;
        wb.quad([p[0] + ix, top + 0.6, p[1] + iz], [q[0] + ix, top + 0.6, q[1] + iz], [q[0] + ix, top, q[1] + iz], [p[0] + ix, top, p[1] + iz], nI, [[0.004, 0], [0.004, 0], [0.004, 0.02], [0.004, 0.02]], wallCol, owner);
        B.roofFlat.quad([p[0], top + 0.6, p[1]], [q[0], top + 0.6, q[1]], [q[0] + ix, top + 0.6, q[1] + iz], [p[0] + ix, top + 0.6, p[1] + iz], [0, 1, 0], [[0, 0], [1, 0], [1, 0.1], [0, 0.1]], col('#b5b2ab'), owner);
      }
    } else if ((roofShape === 'pyramidal' || roofShape === 'cone') && !holes.length) {
      const c = centroid(outer);
      for (let i = 0; i < outer.length; i++) {
        const p = outer[i], q = outer[(i + 1) % outer.length];
        const A = [p[0], top, p[1]], Bq = [q[0], top, q[1]], C = [c[0], top + roofH, c[1]];
        const ux = Bq[0] - A[0], uz = Bq[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
        let n = [-(uz * vy), uz * vx - ux * vz, ux * vy]; const nl = Math.hypot(...n) || 1; n = n.map((x) => x / nl); if (n[1] < 0) n = n.map((x) => -x);
        const L = Math.hypot(ux, uz), s = Math.hypot(vx, vy, vz);
        const a = B.roofTiles.v(...A, ...n, 0, 0, roofCol), bb = B.roofTiles.v(...Bq, ...n, L / 4, 0, roofCol), cc = B.roofTiles.v(...C, ...n, L / 8, s / 4, roofCol);
        B.roofTiles.t(a, bb, cc, owner);
      }
    } else if (roofShape === 'dome' || roofShape === 'onion') {
      fill(B.roofFlat, outer, holesV, top, 4, roofCol, owner);
      const c = centroid(outer);
      let rad = Infinity; for (let i = 0; i < outer.length; i++) rad = Math.min(rad, segDist(c, outer[i], outer[(i + 1) % outer.length]).d);
      rad = Math.max(1, rad * (t._domeScale || 0.98));
      const g = new THREE.SphereGeometry(rad, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const rm = (t['roof:material'] || '').toLowerCase();
      const dcol = parseColour(t['roof:colour'], rm === 'glass' ? '#a9c1c9' : rm === 'copper' ? '#6f9a85' : '#7f8487');
      B.dome.geo(g, new THREE.Matrix4().makeTranslation(c[0], top, c[1]).multiply(new THREE.Matrix4().makeScale(1, (roofH > 0 ? roofH : rad) / rad, 1)), dcol, owner);
    } else {
      // pitched: sloped skirt up to an inset flat top (reads as a tiled hipped roof from the street)
      const d = Math.min(roofH / 0.62, width * 0.42, 5.5);
      const rh = d * 0.62;
      const inset = (ring) => ring.map((p, i) => {
        const a = ring[(i - 1 + ring.length) % ring.length], b = ring[(i + 1) % ring.length];
        const l0 = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1, l1 = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
        const n0 = [(p[1] - a[1]) / l0, -(p[0] - a[0]) / l0], n1 = [(b[1] - p[1]) / l1, -(b[0] - p[0]) / l1];
        let m = [n0[0] + n1[0], n0[1] + n1[1]]; const ml = Math.hypot(m[0], m[1]) || 1; m = [m[0] / ml, m[1] / ml];
        const cs = Math.max(0.35, m[0] * n0[0] + m[1] * n0[1]);
        return [p[0] - m[0] * d / cs, p[1] - m[1] * d / cs];
      });
      const rings = [outer, ...holes];
      for (const ring of rings) {
        const ins = inset(ring);
        for (let i = 0; i < ring.length; i++) {
          const j = (i + 1) % ring.length, p = ring[i], q = ring[j], pi = ins[i], qi = ins[j];
          const L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 0.05) continue;
          const nx = (q[1] - p[1]) / L, nz = -(q[0] - p[0]) / L;
          const n = [nx * 0.53, 0.85, nz * 0.53];
          const slope = Math.hypot(d, rh);
          // eaves overhang
          const ox = nx * 0.45, oz = nz * 0.45;
          B.roofTiles.quad([p[0] + ox, top - 0.28, p[1] + oz], [q[0] + ox, top - 0.28, q[1] + oz], [qi[0], top + rh, qi[1]], [pi[0], top + rh, pi[1]], n,
            [[0, 0], [L / 3, 0], [L / 3, (slope + 0.5) / 3], [0, (slope + 0.5) / 3]], roofCol, owner);
          // gutter / fascia
          wb.quad([p[0] + ox, top - 0.4, p[1] + oz], [q[0] + ox, top - 0.4, q[1] + oz], [q[0] + ox, top - 0.28, q[1] + oz], [p[0] + ox, top - 0.28, p[1] + oz], [nx, 0, nz], [[0.004, 0], [0.004, 0], [0.004, 0.01], [0.004, 0.01]], col('#6b6a66'), owner);
          wb.quad([p[0], top - 0.28, p[1]], [q[0], top - 0.28, q[1]], [q[0] + ox, top - 0.28, q[1] + oz], [p[0] + ox, top - 0.28, p[1] + oz], [0, -1, 0], [[0.004, 0], [0.004, 0], [0.004, 0.01], [0.004, 0.01]], wallCol.clone().multiplyScalar(0.7), owner);
        }
      }
      fill(B.roofTiles, inset(outer), holes.map(inset), top + rh, 3, roofCol, owner);
      // chimneys
      const nCh = Math.floor(r() * 3);
      const c0 = centroid(outer);
      for (let k = 0; k < nCh; k++) {
        const cx = c0[0] + (r() - 0.5) * width * 0.6, cz = c0[1] + (r() - 0.5) * width * 0.6;
        if (!pointInRing([cx, cz], outer)) continue;
        B.brick.geo(new THREE.CylinderGeometry(0.3, 0.38, 1.8, 9), M4(cx, top + rh + 0.5, cz), col('#ffffff'), owner);
      }
    }
    // a few roof details on flat roofs: lift shaft / antenna
    if (!pitched && roofShape === 'flat' && lv >= 4 && Math.abs(ringArea(outer)) > 150) {
      const c = centroid(outer);
      if (pointInRing(c, outer)) {
        wb.geo(new THREE.CylinderGeometry(1.3, 1.5, 2.4, 14), M4(c[0], top + 1.2, c[1], r() * Math.PI), wallCol, owner);
        if (r() < 0.5) B.curb.geo(new THREE.CylinderGeometry(0.04, 0.04, 4, 5), M4(c[0] + 1, top + 4.2, c[1]), col('#555'), owner);
      }
    }
  }

  // ---------- ground floors: shop fronts where a shop is mapped, otherwise plain base
  const shopEdges = new Set();
  const placedSigns = [];
  function nearestEdge(p, maxD, filter) {
    let best = null;
    for (const e of edgeGrid.query(p[0], p[1], maxD)) {
      if (filter && !filter(e)) continue;
      const s = segDist(p, e.a, e.b);
      if (s.d < maxD && (!best || s.d < best.s.d)) best = { e, s };
    }
    return best;
  }
  for (const n of shopNodes) {
    const ne = nearestEdge(n.p, 18, (e) => !e.rec.hidden && e.rec.gH > 0 && e.L > 2.5);
    if (ne) { shopEdges.add(ne.e); n._edge = ne; }
  }
  for (const rec of bldgs) {
    if (!rec.groundEdges || rec.hidden) continue;
    const wallCol = parseColour(rec.b.tags['building:colour'], PLASTER[hash(rec.b.id) % PLASTER.length]);
    const shopBuilding = [...shopEdges].some((e) => e.rec === rec);
    for (const [p, q, n, L] of rec.groundEdges) {
      const isShop = shopBuilding && L > 3.5 && [...shopEdges].some((e) => e.a === p);
      const bays = L < 2.2 ? 0 : Math.max(1, Math.round(L / 4.5));
      const u1 = bays ? bays * 0.5 : 0.004, u0 = bays ? 0 : 0.004;
      (isShop ? B.shop : B.plain).quad([p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], rec.gH, q[1]], [p[0], rec.gH, p[1]], n, [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], isShop ? wallCol : wallCol.clone().lerp(col('#bdb7ad'), 0.3), rec.owner);
    }
  }

  // ---------- add batched meshes
  const buildingMeshes = [];
  for (const [k, b] of Object.entries(B)) {
    const isGround = ['asphalt', 'sett', 'settYellow', 'paving', 'pavers', 'grass', 'dirt', 'water', 'marking', 'rail'].includes(k);
    const m = b.mesh(mats[k], { cast: !isGround, receive: true });
    if (!m) continue;
    group.add(m);
    if (['classic', 'panel', 'glass', 'brick', 'shop', 'plain', 'roofTiles', 'roofFlat', 'dome'].includes(k)) buildingMeshes.push(m);
  }

  // ---------- signs (shop names, street names, house numbers, doors)
  const signGroup = new THREE.Group(); group.add(signGroup);
  const signGeo = new THREE.PlaneGeometry(1, 1);
  function placePlate(tex, e, s, y, w, h, out = 0.06) {
    const n = e.n, len = e.L;
    const m = new THREE.Mesh(signGeo, new THREE.MeshLambertMaterial({ map: tex, emissive: 0x222222 }));
    m.scale.set(w, h, 1);
    m.position.set(s.x + n[0] * out, y, s.z + n[1] * out);
    m.rotation.y = Math.atan2(n[0], n[1]);
    m.castShadow = false; m.receiveShadow = true;
    m.matrixAutoUpdate = false; m.updateMatrix();
    signGroup.add(m);
    return m;
  }
  const SIGN_STYLES = [
    { bg: '#1d2b3a', fg: '#ffffff' }, { bg: '#7a1f1f', fg: '#fff6e6' }, { bg: '#f2efe6', fg: '#1d2b3a' }, { bg: '#0f5a4a', fg: '#ffffff' },
    { bg: '#222222', fg: '#f4d35e' }, { bg: '#ffffff', fg: '#c0392b' }, { bg: '#2d4f8f', fg: '#ffffff' }, { bg: '#e2b93b', fg: '#1b1606' },
  ];
  let signs = 0;
  for (const n of shopNodes) {
    if (!n._edge || signs > 160) continue;
    const { e, s } = n._edge;
    if (placedSigns.some((p) => Math.hypot(p[0] - s.x, p[1] - s.z) < 2.2 && p[2] === e)) continue;
    placedSigns.push([s.x, s.z, e]);
    const st = SIGN_STYLES[hash(n.id) % SIGN_STYLES.length];
    const label = n.tags.name.length > 34 ? n.tags.name.slice(0, 33) + '…' : n.tags.name;
    const tex = textTexture(label, { ...st, font: '700 72px "Sofia Sans Condensed", "Arial Narrow", sans-serif', pad: 30 });
    const h = 0.62, w = Math.min(e.L * 0.85, h * tex.userData.aspect, 7);
    const hh = w / tex.userData.aspect < h ? w / tex.userData.aspect : h;
    placePlate(tex, e, s, e.rec.gH ? e.rec.gH - 0.48 : 3.2, w, hh, 0.08);
    signs++;
  }

  // street name plates on building corners along named streets
  const plates = [];
  const streetLines = named.filter((l) => l.tags.highway !== 'footway' && l.tags.highway !== 'path' && l.tags.highway !== 'steps' && l.tags.highway !== 'service');
  for (const l of streetLines) {
    const label = displayStreet(l.tags.name);
    let acc = 0;
    for (let i = 0; i < l.pts.length - 1; i++) {
      const a = l.pts[i], b = l.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = (i === 0 ? 8 : 0) - (acc % 45); s < L; s += 45) {
        if (s < 0) continue;
        const p = [a[0] + (b[0] - a[0]) * s / L, a[1] + (b[1] - a[1]) * s / L];
        for (const side of [1, -1]) {
          const nx = -(b[1] - a[1]) / L * side, nz = (b[0] - a[0]) / L * side;
          const ne = nearestEdge([p[0] + nx * 6, p[1] + nz * 6], 12, (e) => !e.rec.hidden && e.L > 3 && (e.n[0] * -nx + e.n[1] * -nz) > 0.6);
          if (!ne) continue;
          if (plates.some((q) => q.name === label && Math.hypot(q.x - ne.s.x, q.z - ne.s.z) < 38)) continue;
          plates.push({ name: label, x: ne.s.x, z: ne.s.z });
          ne.s.x = ne.e.a[0] + (ne.e.b[0] - ne.e.a[0]) * Math.min(Math.max(ne.s.t, 0.08), 0.92);
          ne.s.z = ne.e.a[1] + (ne.e.b[1] - ne.e.a[1]) * Math.min(Math.max(ne.s.t, 0.08), 0.92);
          const tex = textTexture(label, { bg: '#1f4e8c', fg: '#ffffff', border: '#ffffff', font: '700 60px "Sofia Sans", sans-serif', pad: 34, radius: 4 });
          placePlate(tex, ne.e, ne.s, 3.1, 0.3 * tex.userData.aspect, 0.3, 0.07);
          break;
        }
      }
      acc += L;
    }
  }

  // house numbers: on the wall that faces the addressed street
  const linesByName = new Map();
  for (const l of named) { const k = normName(l.tags.name); if (!linesByName.has(k)) linesByName.set(k, []); linesByName.get(k).push(l); }
  function plateFor(rec, street, num, isTarget) {
    const ls = linesByName.get(normName(street));
    const c = centroid(rec.outer);
    let roadPt = null;
    if (ls) { let best = { d: Infinity }; for (const l of ls) { const d = polyDist(c, l.pts); if (d.d < best.d) best = d; } if (best.d < 80) roadPt = [best.x, best.z]; }
    // wall closest to the street, facing it
    let bestE = null, bestD = Infinity;
    for (const ring of [rec.outer]) for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2) continue;
      const n = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let d = roadPt ? Math.hypot(m[0] - roadPt[0], m[1] - roadPt[1]) : -L;
      if (roadPt) { const tx = roadPt[0] - m[0], tz = roadPt[1] - m[1], tl = Math.hypot(tx, tz) || 1; if ((n[0] * tx + n[1] * tz) / tl < 0.3) d += 50; }
      if (d < bestD) { bestD = d; bestE = { a, b, n, L, rec }; }
    }
    if (!bestE) return null;
    const tt = 0.5 + (bestE.L > 8 ? 2.2 / bestE.L : 0);
    const s = { x: bestE.a[0] + (bestE.b[0] - bestE.a[0]) * tt, z: bestE.a[1] + (bestE.b[1] - bestE.a[1]) * tt };
    const tex = textTexture([{ t: displayStreet(street) || ' ', f: '600 30px "Sofia Sans", sans-serif' }, { t: num, f: '800 92px "Sofia Sans", sans-serif' }], { bg: '#1f4e8c', fg: '#ffffff', border: '#ffffff', pad: 24, minW: 190, radius: 6 });
    const h = 0.42;
    placePlate(tex, bestE, s, 2.6, h * tex.userData.aspect, h, 0.07);
    return { edge: bestE, s, roadPt };
  }
  const plateDone = new Set();
  let targetFront = null;
  for (const rec of bldgs) {
    if (rec.hidden || rec.isPart) continue;
    const t = rec.b.tags;
    const list = t['addr:housenumber'] ? [[t['addr:street'] || t['addr:place'], t['addr:housenumber']]] : (rec.addrNodes || []).map((n) => [n.tags['addr:street'] || n.tags['addr:place'], n.tags['addr:housenumber']]);
    for (const [street, num] of list.slice(0, 2)) {
      if (!street || !num) continue;
      const k = normName(street) + '|' + num; if (plateDone.has(k)) continue; plateDone.add(k);
      const res = plateFor(rec, street, num, rec.isTarget);
      if (res && (rec.isTarget || bldgs.indexOf(rec) === targetIndex) && /сердика/i.test(street)) targetFront = res;
    }
  }

  // doors at mapped entrances
  const doorTex = T.door;
  const doorMat = new THREE.MeshLambertMaterial({ map: doorTex });
  for (const n of F.nodes) {
    if (!n.tags.entrance && !n.tags.door) continue;
    const ne = nearestEdge(n.p, 1.2, (e) => !e.rec.hidden && e.L > 1.6);
    if (!ne) continue;
    const m = new THREE.Mesh(signGeo, doorMat);
    const h = n.tags.entrance === 'garage' ? 2.4 : 2.5, w = n.tags.entrance === 'garage' ? 2.6 : 1.5;
    m.scale.set(w, h, 1);
    m.position.set(ne.s.x + ne.e.n[0] * 0.05, h / 2, ne.s.z + ne.e.n[1] * 0.05);
    m.rotation.y = Math.atan2(ne.e.n[0], ne.e.n[1]);
    m.matrixAutoUpdate = false; m.updateMatrix();
    signGroup.add(m);
  }

  // ---------- helpers for props
  function insideBuilding(x, z, pad = 0) {
    for (const rec of buildingGrid.query(x, z, pad + 0.5)) {
      if (x < rec.bb[0] - pad || x > rec.bb[2] + pad || z < rec.bb[1] - pad || z > rec.bb[3] + pad) continue;
      if (pointInRing([x, z], rec.outer) && !rec.holes.some((h) => pointInRing([x, z], h))) return true;
      if (pad > 0) for (let i = 0; i < rec.outer.length; i++) if (segDist([x, z], rec.outer[i], rec.outer[(i + 1) % rec.outer.length]).d < pad) return true;
    }
    return false;
  }
  function onRoad(x, z, pad = 0) {
    for (const l of roadInfo) { const d = polyDist([x, z], l.pts); if (d.d < l.width / 2 + pad) return true; }
    return false;
  }
  const nearTram = (x, z, d) => tramPolys.some((p) => polyDist([x, z], p).d < d);

  // ---------- trees
  const treeSpots = [];
  for (const n of F.nodes) if (n.tags.natural === 'tree') treeSpots.push({ p: n.p, h: parseNum(n.tags.height), c: parseNum(n.tags.diameter_crown), id: n.id, leaf: n.tags.leaf_type });
  for (const l of F.lines) if (l.tags.natural === 'tree_row') {
    for (let i = 0; i < l.pts.length - 1; i++) {
      const a = l.pts[i], b = l.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = 0; s < L; s += 7) treeSpots.push({ p: [a[0] + (b[0] - a[0]) * s / L, a[1] + (b[1] - a[1]) * s / L], id: l.id + i + s });
    }
  }
  for (const a of F.areas) {
    const t = a.tags;
    if (!(['park', 'garden'].includes(t.leisure) || t.landuse === 'grass' || t.natural === 'wood' || t.landuse === 'forest' || t.natural === 'scrub')) continue;
    const area = Math.abs(ringArea(a.outer)); if (area < 60) continue;
    const already = treeSpots.filter((s) => pointInRing(s.p, a.outer)).length;
    const want = Math.floor(area / (t.leisure === 'park' || t.natural === 'wood' ? 90 : 220)) - already;
    const bb = a.outer.reduce((m, p) => [Math.min(m[0], p[0]), Math.min(m[1], p[1]), Math.max(m[2], p[0]), Math.max(m[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
    const rr = rng(a.id);
    for (let k = 0, tries = 0; k < want && tries < want * 6; tries++) {
      const p = [bb[0] + rr() * (bb[2] - bb[0]), bb[1] + rr() * (bb[3] - bb[1])];
      if (!pointInRing(p, a.outer) || a.holes.some((h) => pointInRing(p, h))) continue;
      if (treeSpots.some((s) => Math.hypot(s.p[0] - p[0], s.p[1] - p[1]) < 4.5)) continue;
      treeSpots.push({ p, id: a.id + 't' + k }); k++;
    }
  }
  const trunkMx = [], crownMx = [[], [], [], []], crownCol = [[], [], [], []], treeColliders = [];
  for (const s of treeSpots) {
    if (insideBuilding(s.p[0], s.p[1], 0.3)) continue;
    const rr = rng('tree' + s.id);
    const h = s.h > 2 ? Math.min(s.h, 28) : 6.5 + rr() * 6.5;
    const cr = s.c > 1 ? s.c / 2 : 2.4 + rr() * 2.0;
    const conifer = s.leaf === 'needleleaved';
    const cy = Math.max(h - cr * 0.85, 2.3 + cr * 0.7);
    trunkMx.push(M4(s.p[0], 0, s.p[1], rr() * 6, 0.55 + h * 0.03, cy, 0.55 + h * 0.03));
    // VG: about one tree in six becomes a flame-like cypress
    const cypress = conifer || rr() < 0.17;
    const v = cypress ? 3 : Math.floor(rr() * 3);
    if (cypress) crownMx[3].push(M4(s.p[0], 0.6, s.p[1], rr() * 6, 1.5 + rr() * 0.5, Math.max(h, 9) / 4.2, 1.5 + rr() * 0.5));
    else crownMx[v].push(M4(s.p[0], cy, s.p[1], rr() * 6, cr, cr * (1.0 + rr() * 0.3), cr));
    crownCol[v].push(rr());
    treeColliders.push(s.p);
  }
  for (const p of treeColliders) colliders.add([p, p, 0.35], p[0], p[1], p[0], p[1]);

  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1, 7); trunkGeo.translate(0, 0.5, 0);
  const trunk = instanced(trunkGeo, lam({ map: T.bark }), trunkMx, { cast: true });
  if (trunk) group.add(trunk);
  // VG: crowns are clusters of swirling, brush-edged blobs; variant 3 is a twisting cypress
  const blob = (r0, rr) => {
    const g = new THREE.IcosahedronGeometry(r0, 2);
    const p = g.attributes.position, uv = g.attributes.uv, ph = rr() * 10;
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j), y = p.getY(j), z = p.getZ(j);
      const f = 0.86 + 0.16 * Math.sin(x * 7 + ph) * Math.cos(z * 6 - ph) + 0.1 * Math.sin(y * 9 + ph * 2);
      p.setXYZ(j, x * f, y * f, z * f);
      uv.setXY(j, uv.getX(j) * 2, uv.getY(j) * 1.5);
    }
    g.computeVertexNormals();
    return g;
  };
  const crownGeos = [0, 1, 2, 3].map((k) => {
    const rr = rng('crown' + k);
    const list = [];
    if (k === 3) {
      // a flame: wide at the bottom, curling to a point, each tuft offset along a spiral
      for (let i = 0; i < 12; i++) {
        const y = 0.35 + i * 0.33, r = 0.78 * Math.pow(1 - i / 12.5, 0.8) + 0.06, a = i * 1.1;
        list.push([blob(r, rr), M4(Math.cos(a) * 0.16 * (1 - i / 12), y, Math.sin(a) * 0.16 * (1 - i / 12), i * 0.7, 1, 1.5, 1)]);
      }
    } else {
      const n = 6 + k;
      for (let i = 0; i < n; i++) {
        const a = rr() * Math.PI * 2, rad = i === 0 ? 0 : 0.32 + rr() * 0.28, y = i === 0 ? 0.1 : (rr() - 0.35) * 0.75;
        list.push([blob(0.46 + rr() * 0.2, rr), M4(Math.cos(a) * rad, y, Math.sin(a) * rad, rr() * 6)]);
      }
    }
    const geo = mergeGeos(list);
    const P = geo.attributes.position, N = geo.attributes.normal;
    for (let j = 0; j < P.count; j++) { const v = new THREE.Vector3(P.getX(j), k === 3 ? 0 : P.getY(j) - 0.1, P.getZ(j)).normalize(); const nn = new THREE.Vector3(N.getX(j), N.getY(j), N.getZ(j)).lerp(v, 0.55).normalize(); N.setXYZ(j, nn.x, nn.y, nn.z); }
    return geo;
  });
  const crownMat = lam({ map: T.leaves, alphaTest: 0.5, side: THREE.DoubleSide });
  const crowns = [];
  crownGeos.forEach((g, k) => { const m = instanced(g, crownMat, crownMx[k], { cast: true, colors: crownCol[k].map(() => new THREE.Color()) }); if (m) { m.userData.r = crownCol[k]; m.userData.cypress = k === 3; crowns.push(m); group.add(m); } });

  // ---------- street lamps
  const lampSpots = F.nodes.filter((n) => n.tags.highway === 'street_lamp').map((n) => n.p);
  if (lampSpots.length < 8) {
    for (const l of roadInfo) {
      if (l.width < 6 || l.tags.highway === 'service') continue;
      let k = 0;
      for (const [a, b, dx, dz] of trimmed(l, l.width / 2 + 4)) {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let s = 4; s < L; s += 26) {
          const side = (k++ % 2) ? 1 : -1, o = l.width / 2 + 0.55;
          const p = [a[0] + dx * s - dz * side * o, a[1] + dz * s + dx * side * o];
          if (insideBuilding(p[0], p[1], 0.6) || lampSpots.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 12) || onRoad(p[0], p[1], 0.2)) continue;
          lampSpots.push(p);
        }
      }
    }
  }
  // VG: gas lanterns on thin crooked posts
  const lampGeo = mergeGeos([
    [new THREE.CylinderGeometry(0.14, 0.2, 0.5, 10), M4(0, 0.25, 0)],
    [new THREE.CylinderGeometry(0.05, 0.07, 3.6, 8, 6), M4(0, 2.2, 0)],
    [new THREE.TorusGeometry(0.12, 0.025, 6, 12), M4(0, 3.95, 0)],
    [new THREE.ConeGeometry(0.34, 0.32, 12), M4(0, 4.72, 0)],
    [new THREE.SphereGeometry(0.06, 8, 6), M4(0, 4.92, 0)],
  ]);
  const lampGlassGeo = new THREE.CylinderGeometry(0.26, 0.15, 0.62, 12); lampGlassGeo.translate(0, 4.27, 0);
  const lampMx = lampSpots.map((p) => M4(p[0], 0, p[1]));
  const lamps = instanced(lampGeo, lam({ color: 0x24305a }), lampMx, { cast: true });
  const lampGlass = new THREE.MeshLambertMaterial({ color: 0xf6e8b0, emissive: 0x000000 });
  const lampHeads = instanced(lampGlassGeo, lampGlass, lampMx, { cast: false });
  if (lamps) group.add(lamps); if (lampHeads) group.add(lampHeads);
  for (const p of lampSpots) colliders.add([p, p, 0.2], p[0], p[1], p[0], p[1]);

  // tram poles and wires
  if (wirePts.length) {
    const wires = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3)), new THREE.LineBasicMaterial({ color: 0x222222 }));
    group.add(wires);
    const span = [];
    for (const pts of tramPolys) {
      let acc = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.1) continue;
        const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L;
        for (let s = (35 - acc % 35) % 35; s < L; s += 35) {
          const p = [a[0] + dx * s, a[1] + dz * s];
          for (const side of [1, -1]) {
            const q = [p[0] - dz * side * 5.5, p[1] + dx * side * 5.5];
            if (insideBuilding(q[0], q[1], 0.5) || nearTram(q[0], q[1], 2)) continue;
            poleMx.push(M4(q[0], 0, q[1]));
            span.push(q[0], 6.6, q[1], p[0], 6.3, p[1]);
            colliders.add([q, q, 0.2], q[0], q[1], q[0], q[1]);
            break;
          }
        }
        acc += L;
      }
    }
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 7, 8); poleGeo.translate(0, 3.5, 0);
    const poles = instanced(poleGeo, lam({ color: 0x3e4a44 }), poleMx, { cast: true });
    if (poles) group.add(poles);
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(span, 3)), new THREE.LineBasicMaterial({ color: 0x222222 })));
  }

  // ---------- street furniture from OSM (VG: rounded shapes only)
  const furn = { bench: [], bin: [], bollard: [], bike: [] };
  for (const n of F.nodes) {
    const t = n.tags, p = n.p, rr = rng('f' + n.id);
    let ry = rr() * Math.PI * 2;
    const rd = nearestEdge(p, 6, null);
    if (rd) ry = Math.atan2(rd.e.n[0], rd.e.n[1]);
    if (t.amenity === 'bench' || t.leisure === 'picnic_table') { furn.bench.push(M4(p[0], 0, p[1], ry)); colliders.add([p, p, 0.6], p[0], p[1], p[0], p[1]); }
    else if (t.amenity === 'waste_basket') furn.bin.push(M4(p[0], 0, p[1]));
    else if (t.barrier === 'bollard') furn.bollard.push(M4(p[0], 0, p[1]));
    else if (t.amenity === 'bicycle_parking') furn.bike.push(M4(p[0], 0, p[1], ry));
  }
  const fm = (geo, color, list, colors, map) => { const m = instanced(geo, lam({ color, map: map || null }), list, { cast: true, colors }); if (m) group.add(m); };
  const capsule = (r, len, m) => [new THREE.CapsuleGeometry(r, len, 4, 10).rotateZ(Math.PI / 2), m];
  fm(mergeGeos([capsule(0.09, 1.6, M4(0, 0.46, 0.05, 0, 1, 1, 2.2)), capsule(0.07, 1.6, M4(0, 0.82, -0.2, 0, 1, 1.6, 1)),
    [new THREE.CylinderGeometry(0.04, 0.05, 0.46, 6), M4(-0.72, 0.23, 0)], [new THREE.CylinderGeometry(0.04, 0.05, 0.46, 6), M4(0.72, 0.23, 0)]]), 0x3f7f5a, furn.bench, null, T.bark);
  fm(new THREE.CylinderGeometry(0.22, 0.18, 0.8, 12).translate(0, 0.4, 0), 0x2e5a7a, furn.bin);
  fm(new THREE.CylinderGeometry(0.08, 0.11, 0.9, 10).translate(0, 0.45, 0), 0x24305a, furn.bollard);
  fm(new THREE.TorusGeometry(0.4, 0.03, 6, 16, Math.PI), 0x24305a, furn.bike);

  // ---------- café terraces (VG: an homage to "Café Terrace at Night", Arles 1888)
  const awnB = new Batch();
  const tableMx = [], chairMx = [], chairCol = [], cafeSpots = [];
  let cafes = 0;
  const CAFE = /^(cafe|restaurant|bar|pub|fast_food|ice_cream|biergarten)$/;
  for (const n of shopNodes) {
    if (!CAFE.test(n.tags.amenity || '') || !n._edge) continue;
    const { e, s } = n._edge;
    if (e.L < 3.5) continue;
    const nx = e.n[0], nz = e.n[1], L = e.L, tx = (e.b[0] - e.a[0]) / L, tz = (e.b[1] - e.a[1]) / L;
    const w = Math.min(L * 0.85, 7.5), depth = 2.3;
    // keep the awning over the sidewalk: shorten it if the road is close
    let d = depth;
    while (d > 1.2 && onRoad(s.x + nx * d, s.z + nz * d, 0.2)) d -= 0.2;
    if (d < 1.2) continue;
    cafes++;
    cafeSpots.push([s.x + nx * d * 0.6, s.z + nz * d * 0.6]);
    const nu = 8, nv = 4, base = awnB.vc;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = (i / nu - 0.5) * w, dd = j / nv * d;
      const y = 3.35 - 0.6 * Math.pow(dd / d, 1.3) + 0.06 * Math.sin(i * 1.7);
      awnB.v(s.x + tx * u + nx * dd, y, s.z + tz * u + nz * dd, nx * 0.4, 0.92, nz * 0.4, i / nu * 2, j / nv * 0.85, col('#ffffff'));
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i; awnB.t(a, a + 1, a + nu + 2); awnB.t(a, a + nu + 2, a + nu + 1); }
    // valance
    const y0 = 3.35 - 0.6, fx = s.x + nx * d, fz = s.z + nz * d;
    awnB.quad([fx - tx * w / 2, y0 - 0.38, fz - tz * w / 2], [fx + tx * w / 2, y0 - 0.38, fz + tz * w / 2], [fx + tx * w / 2, y0, fz + tz * w / 2], [fx - tx * w / 2, y0, fz - tz * w / 2], [nx, 0, nz], [[0, 0.85], [2, 0.85], [2, 1], [0, 1]], col('#ffffff'));
    // little round tables with chairs on the sidewalk
    const rr = rng('cafe' + n.id);
    for (const u of [-w / 3, 0, w / 3]) {
      if (rr() < 0.25) continue;
      const dd = Math.min(d - 0.3, 1.5), x = s.x + tx * u + nx * dd, z = s.z + tz * u + nz * dd;
      if (onRoad(x, z, 0.5) || insideBuilding(x, z, 0.5)) continue;
      tableMx.push(M4(x, 0, z, rr() * 6));
      for (const a of [0.3, Math.PI + 0.3]) {
        const ca = a + rr() * 0.6;
        chairMx.push(M4(x + Math.cos(ca) * 0.62, 0, z + Math.sin(ca) * 0.62, -ca - Math.PI / 2));
        chairCol.push(col(['#3a5a9a', '#2e7a6a', '#c96a3a'][Math.floor(rr() * 3)]));
      }
      colliders.add([[x, z], [x, z], 0.7], x - 1, z - 1, x + 1, z + 1);
    }
  }
  const awnMesh = awnB.mesh(new THREE.MeshLambertMaterial({ map: T.awning, side: THREE.DoubleSide, emissive: 0x000000, emissiveMap: T.awning }));
  if (awnMesh) group.add(awnMesh);
  fm(mergeGeos([[new THREE.CylinderGeometry(0.4, 0.4, 0.05, 18), M4(0, 0.74, 0)], [new THREE.CylinderGeometry(0.035, 0.045, 0.72, 8), M4(0, 0.36, 0)], [new THREE.CylinderGeometry(0.2, 0.24, 0.03, 12), M4(0, 0.015, 0)]]), 0xf2e2b0, tableMx);
  fm(mergeGeos([[new THREE.CylinderGeometry(0.2, 0.18, 0.05, 14), M4(0, 0.45, 0)], [new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), M4(0.12, 0.22, 0.12)], [new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), M4(-0.12, 0.22, 0.12)], [new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), M4(0.12, 0.22, -0.12)], [new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), M4(-0.12, 0.22, -0.12)], [new THREE.TorusGeometry(0.17, 0.025, 6, 12, Math.PI), M4(0, 0.5, -0.17, 0, 1, 1, 1)]]), 0xffffff, chairMx, chairCol);
  const awningMat = awnMesh ? awnMesh.material : null;

  // walls and fences
  const fenceB = new Batch(), wallB = new Batch();
  for (const l of F.lines) {
    const t = l.tags; if (!t.barrier) continue;
    const isWall = ['wall', 'retaining_wall', 'city_wall'].includes(t.barrier);
    if (!isWall && !['fence', 'railing', 'handrail', 'guard_rail'].includes(t.barrier)) continue;
    const h = parseNum(t.height) > 0 ? parseNum(t.height) : isWall ? 1.8 : 1.3;
    for (let i = 0; i < l.pts.length - 1; i++) {
      const a = l.pts[i], b = l.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
      const n = [(b[1] - a[1]) / L, 0, -(b[0] - a[0]) / L];
      const bt = isWall ? wallB : fenceB;
      for (const s of [1, -1]) {
        const o = isWall ? 0.15 * s : 0;
        bt.quad([a[0] + n[0] * o, 0, a[1] + n[2] * o], [b[0] + n[0] * o, 0, b[1] + n[2] * o], [b[0] + n[0] * o, h, b[1] + n[2] * o], [a[0] + n[0] * o, h, a[1] + n[2] * o], [n[0] * s, 0, n[2] * s], [[0, 0], [L / 1.2, 0], [L / 1.2, 1], [0, 1]], white);
      }
      if (isWall) wallB.quad([a[0] + n[0] * 0.15, h, a[1] + n[2] * 0.15], [b[0] + n[0] * 0.15, h, b[1] + n[2] * 0.15], [b[0] - n[0] * 0.15, h, b[1] - n[2] * 0.15], [a[0] - n[0] * 0.15, h, a[1] - n[2] * 0.15], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], white);
      colliders.add([a, b], a[0], a[1], b[0], b[1]);
    }
  }
  {
    const wm = wallB.mesh(lam({ color: 0xbdb4a5 })); if (wm) group.add(wm);
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#1e2420'; g.fillRect(0, 8, 128, 8); g.fillRect(0, 116, 128, 8);
    for (let x = 4; x < 128; x += 16) g.fillRect(x, 8, 4, 116);
    const ft = new THREE.CanvasTexture(c); ft.wrapS = THREE.RepeatWrapping;
    const fmesh = fenceB.mesh(new THREE.MeshLambertMaterial({ map: ft, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide }));
    if (fmesh) group.add(fmesh);
  }

  // ---------- minimap data
  const mapData = {
    buildings: bldgs.filter((r) => !r.isPart).map((r) => ({ ring: r.outer, target: r.isTarget || bldgs.indexOf(r) === targetIndex })),
    roads: roadInfo.map((l) => ({ pts: l.pts, w: l.width })),
    paths: roads.filter((l) => !l.drivable).map((l) => l.pts),
    green: F.areas.filter((a) => a.tags.leisure === 'park' || a.tags.landuse === 'grass' || a.tags.leisure === 'garden').map((a) => a.outer),
    trams: tramPolys,
  };

  // street names for the HUD
  const streetsForHud = named.filter((l) => l.tags.highway !== 'service').map((l) => ({ name: displayStreet(l.tags.name), pts: l.pts }));

  const stats = { buildings: bldgs.filter((r) => !r.isPart).length, parts: parts.length, trees: treeColliders.length, lamps: lampSpots.length, signs, plates: plates.length, cafes, roads: roadInfo.length, shops: shopNodes.length };

  return {
    group, info, buildingMeshes, colliders, insideBuilding, crowns, lampGlass, mapData, streetsForHud, stats,
    nightMats, awningMat, lampSpots, cafeSpots, lampTop: 4.27,
    target: { index: targetIndex, front: targetFront, rec: targetIndex >= 0 ? bldgs[targetIndex] : null },
    streetLines: (name) => linesByName.get(normName(name)) || [],
  };
}

// tree colours by season

// VG: viridian, emerald and yellow-green in summer; chrome yellow, orange and vermilion in autumn;
// violet-brown in winter. Cypresses stay dark green with blue.
export function paintTrees(crowns, season) {
  const pal = {
    summer: ['#3f8a4a', '#5fa040', '#7ab83f', '#2f7a5a', '#4f9a3a', '#9cc040', '#3a7a6a'],
    autumn: ['#f2b52e', '#e8862a', '#d0582a', '#f2cf4a', '#b8a030', '#c9702a', '#7a9a3a'],
    winter: ['#7a5a7a', '#6a5a8a', '#8a6a5a', '#5a5a7a'],
  }[season];
  const cyp = ['#1f5a4a', '#2a6a4a', '#1f4a5a', '#2f6a3a'];
  const c = new THREE.Color();
  for (const m of crowns) {
    const p = m.userData.cypress ? cyp : pal;
    m.userData.r.forEach((r, i) => { c.set(p[Math.floor(r * p.length) % p.length]); m.setColorAt(i, c); });
    m.instanceColor.needsUpdate = true;
  }
}
