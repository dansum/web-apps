// Строителен комплект за по-реалистични сцени: рисувани текстури (зидария, мазилка, керемиди, дърво, калдъръм),
// материали в два варианта — ярки за местата, които се щракат, и приглушени за останалото —
// и сглобяване на много тела в малко на брой мрежи (Batch).
import { THREE } from '../../kit.js';

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Цвят за рисуване върху canvas. mute (0–1) го избледнява към топло сиво; j е случайно отклонение в яркостта.
function css(hex, mute = 0, j = 0) {
  let r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const grey = 0.3 * r + 0.59 * g + 0.11 * b, t = grey * 0.5 + 108;
  r += (t + 6 - r) * mute; g += (t + 2 - g) * mute; b += (t - 6 - b) * mute;
  const k = 1 + j * (1 - mute * 0.5);
  const q = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${q(r)},${q(g)},${q(b)})`;
}

function tex(size, tile, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  // Ситен шум, за да не изглежда повърхността нарисувана.
  const img = g.getImageData(0, 0, size, size), d = img.data, R = rng(size + tile * 7);
  for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tile, 1 / tile); // координатите на телата са в метри
  t.anisotropy = 8;
  return t;
}

const T = {
  // Каменна зидария на редове.
  stone: (m) => tex(256, 4, (g, s) => {
    const R = rng(11);
    g.fillStyle = css(0x857b6a, m); g.fillRect(0, 0, s, s);
    for (let row = 0; row < 8; row++) {
      let x = -R() * 40;
      while (x < s) {
        const w = 36 + R() * 44;
        g.fillStyle = css([0xb8ab94, 0xa99d88, 0xc4b8a2, 0x9f9480][Math.floor(R() * 4)], m, (R() - 0.5) * 0.16);
        g.fillRect(x + 1.5, row * 32 + 1.5, w - 3, 29);
        g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 1.5, row * 32 + 1.5, w - 3, 3);
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 1.5, row * 32 + 27, w - 3, 3.5);
        x += w;
      }
    }
  }),
  // Редуване на камък и тухла — както строят в Търновград.
  banded: (m) => tex(256, 3.2, (g, s) => {
    const R = rng(23);
    g.fillStyle = css(0x8d8272, m); g.fillRect(0, 0, s, s);
    for (let band = 0; band < 2; band++) {
      const y0 = band * 128;
      for (let row = 0; row < 3; row++) {
        let x = -R() * 30;
        while (x < s) { const w = 34 + R() * 36; g.fillStyle = css(0xd9cba9, m, (R() - 0.5) * 0.14); g.fillRect(x + 1, y0 + row * 28 + 1, w - 2, 26); x += w; }
      }
      for (let row = 0; row < 4; row++) {
        let x = -R() * 20;
        while (x < s) { const w = 26 + R() * 10; g.fillStyle = css(0xa9523a, m, (R() - 0.5) * 0.2); g.fillRect(x + 1, y0 + 85 + row * 11, w - 2, 8.5); x += w; }
      }
    }
  }),
  plaster: (m) => tex(256, 6, (g, s) => {
    const R = rng(31);
    g.fillStyle = css(0xe9dfc8, m); g.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(${R() < 0.5 ? '120,100,70' : '255,250,235'},${0.03 + R() * 0.05})`;
      g.beginPath(); g.ellipse(R() * s, R() * s, 10 + R() * 40, 6 + R() * 22, R() * 3, 0, 7); g.fill();
    }
    g.strokeStyle = 'rgba(90,75,55,0.25)'; g.lineWidth = 1;
    for (let i = 0; i < 5; i++) { g.beginPath(); let x = R() * s, y = R() * s; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - 0.5) * 30; y += R() * 22; g.lineTo(x, y); } g.stroke(); }
  }),
  wood: (m) => tex(256, 2.4, (g, s) => {
    const R = rng(41);
    for (let p = 0; p < 8; p++) {
      g.fillStyle = css(0x6d4c30, m, (R() - 0.5) * 0.3); g.fillRect(p * 32, 0, 32, s);
      g.strokeStyle = 'rgba(30,18,8,0.35)'; g.lineWidth = 1;
      for (let k = 0; k < 5; k++) { const x = p * 32 + 3 + R() * 26; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 4, s * 0.3, x - 4, s * 0.6, x + 2, s); g.stroke(); }
      g.fillStyle = 'rgba(20,12,5,0.55)'; g.fillRect(p * 32, 0, 1.5, s);
    }
  }),
  // Керемиди на редове.
  tiles: (m) => tex(256, 2.6, (g, s) => {
    const R = rng(53);
    g.fillStyle = css(0x7c3a26, m); g.fillRect(0, 0, s, s);
    for (let row = 0; row < 8; row++) for (let i = -1; i < 9; i++) {
      const x = i * 32 + (row % 2) * 16, y = row * 32;
      g.fillStyle = css([0xb65a3c, 0xa94f34, 0xc2684a, 0x9c4a32][Math.floor(R() * 4)], m, (R() - 0.5) * 0.18);
      g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + 30, y); g.lineTo(x + 30, y + 22); g.arc(x + 16, y + 22, 14, 0, Math.PI); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.arc(x + 16, y + 24, 14, 0.15, Math.PI - 0.15); g.lineTo(x + 2, y + 30); g.lineTo(x + 30, y + 30); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 5, y + 2, 5, 18);
    }
  }),
  cobble: (m) => tex(256, 3, (g, s) => {
    const R = rng(61);
    g.fillStyle = css(0x7d7466, m); g.fillRect(0, 0, s, s);
    for (let j = 0; j < 11; j++) for (let i = 0; i < 11; i++) {
      const x = i * 24 + (j % 2) * 12 + (R() - 0.5) * 6, y = j * 24 + (R() - 0.5) * 6, rx = 9 + R() * 3.5, ry = 8 + R() * 3.5;
      for (const ox of [0, s, -s]) for (const oy of [0, s, -s]) {
        g.fillStyle = css([0xb4aa98, 0xa59b8a, 0xc0b7a6, 0x9a917f][(i * 7 + j * 3) % 4], m, ((i * 13 + j * 5) % 7) / 40 - 0.08);
        g.beginPath(); g.ellipse(x + ox, y + oy, rx, ry, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(x + ox - 2, y + oy - 2, rx * 0.55, ry * 0.5, 0, 0, 7); g.fill();
      }
    }
  }),
  // Зърнест шум за земята (умножава се по цвета на върховете).
  ground: () => tex(256, 9, (g, s) => {
    const R = rng(71);
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) { const v = 190 + R() * 65; g.fillStyle = `rgba(${v},${v},${v},0.5)`; g.beginPath(); g.ellipse(R() * s, R() * s, 1 + R() * 5, 1 + R() * 3, R() * 3, 0, 7); g.fill(); }
  }),
};

export function stripes(a, b, m = 0) {
  const t = tex(64, 1.2, (g, s) => { for (let i = 0; i < 4; i++) { g.fillStyle = css(i % 2 ? a : b, m); g.fillRect(i * 16, 0, 16, s); } });
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide });
}

// Комплект материали. mute = 0: ярки и с релеф (за щракаемите места); mute ≈ 0.5: приглушени (фон).
export function materials(mute = 0) {
  const bump = 1.6 * (1 - mute * 0.6);
  const mk = (map, o = {}) => new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: bump, roughness: 0.9, ...o });
  const flat = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: new THREE.Color(css(hex, mute)), roughness: 0.85, ...o });
  return {
    stone: mk(T.stone(mute)), banded: mk(T.banded(mute)), plaster: mk(T.plaster(mute), { bumpScale: bump * 0.4 }),
    wood: mk(T.wood(mute), { roughness: 0.8 }), tiles: mk(T.tiles(mute), { side: THREE.DoubleSide }), cobble: mk(T.cobble(mute), { roughness: 0.95 }),
    dark: flat(0x2a2420, { roughness: 0.6 }), iron: flat(0x3d3f45, { roughness: 0.45, metalness: 0.7 }), gold: flat(0xe2b23a, { roughness: 0.3, metalness: 0.85 }),
    lead: flat(0x8c9198, { roughness: 0.5, metalness: 0.4 }), white: flat(0xf3eee2), sack: flat(0xc8b48a), red: flat(0xb23a2e), blue: flat(0x2f5fa8), green: flat(0x4f8a4a),
    ochre: flat(0xd9a441), clay: flat(0xb5653f), glaze: flat(0x3f7f5a, { roughness: 0.25 }), skin: flat(0xe0b08a),
  };
}
// Собствено копие на комплекта: за да светва при посочване само едно място.
export function ownSet(set) {
  const o = {};
  for (const k in set) o[k] = set[k].clone();
  return o;
}
export const groundTex = () => T.ground();

// ---- Тела с координати на текстурата в метри ----
export function box(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
  return g;
}
export function cyl(r, h, seg = 14, rTop = r, open = false) {
  const g = new THREE.CylinderGeometry(rTop, r, h, seg, 1, open).translate(0, h / 2, 0);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * r, uv.getY(i) * h);
  return g;
}
export function dome(r, seg = 18) {
  const g = new THREE.SphereGeometry(r, seg, 9, 0, Math.PI * 2, 0, Math.PI / 2);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * r, uv.getY(i) * r * 1.6);
  return g;
}
function fromTris(tris) { // tris: [[x,y,z,u,v] × 3, …]
  const p = [], u = [];
  for (const t of tris) for (const v of t) { p.push(v[0], v[1], v[2]); u.push(v[3], v[4]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
  g.computeVertexNormals();
  return g;
}
// Двускатен покрив: билото е по x. w, d — размери с издатината; h — височина на билото.
export function gable(w, d, h) {
  const a = w / 2, b = d / 2, s = Math.hypot(b, h);
  return fromTris([
    [[-a, 0, b, 0, 0], [a, 0, b, w, 0], [a, h, 0, w, s]], [[-a, 0, b, 0, 0], [a, h, 0, w, s], [-a, h, 0, 0, s]],
    [[a, 0, -b, 0, 0], [-a, 0, -b, w, 0], [-a, h, 0, w, s]], [[a, 0, -b, 0, 0], [-a, h, 0, w, s], [a, h, 0, 0, s]],
  ]);
}
// Триъгълните стени под двускатния покрив (от материала на стената).
export function gableEnds(w, d, h) {
  const a = w / 2, b = d / 2;
  return fromTris([[[a, 0, b, 0, 0], [a, 0, -b, d, 0], [a, h, 0, b, h]], [[-a, 0, -b, 0, 0], [-a, 0, b, d, 0], [-a, h, 0, b, h]]]);
}
// Четирискатен покрив.
export function hip(w, d, h) {
  const a = w / 2, b = d / 2, sa = Math.hypot(a, h), sb = Math.hypot(b, h);
  return fromTris([
    [[-a, 0, b, 0, 0], [a, 0, b, w, 0], [0, h, 0, a, sb]], [[a, 0, -b, 0, 0], [-a, 0, -b, w, 0], [0, h, 0, a, sb]],
    [[a, 0, b, 0, 0], [a, 0, -b, d, 0], [0, h, 0, b, sa]], [[-a, 0, -b, 0, 0], [-a, 0, b, d, 0], [0, h, 0, b, sa]],
  ]);
}
// Стена с дъговиден отвор (за порти и аркади). Отворът е по z.
export function archWall(w, h, depth, openW, openH) {
  const s = new THREE.Shape(), r = openW / 2;
  s.moveTo(-w / 2, 0); s.lineTo(-r, 0); s.lineTo(-r, openH - r); s.absarc(0, openH - r, r, Math.PI, 0, true);
  s.lineTo(r, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -depth / 2);
}

// ---- Сглобяване ----
// Събира тела по материал и накрая прави по една мрежа на материал.
export class Batch {
  constructor() { this.parts = new Map(); }
  // Рамка: локална координатна система (място и завъртане) за една постройка.
  frame(x = 0, y = 0, z = 0, ry = 0) { return new Frame(this, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z)); }
  push(material, geo, matrix) {
    if (!this.parts.has(material)) this.parts.set(material, []);
    this.parts.get(material).push([geo, matrix]);
  }
  build({ cast = true, receive = true } = {}) {
    const group = new THREE.Group();
    const v = new THREE.Vector3(), n3 = new THREE.Matrix3();
    for (const [material, list] of this.parts) {
      let nv = 0, ni = 0;
      for (const [g] of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
      let vo = 0, io = 0;
      for (const [g, m] of list) {
        const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
        n3.getNormalMatrix(m);
        for (let i = 0; i < P.count; i++) {
          v.fromBufferAttribute(P, i).applyMatrix4(m); pos.set([v.x, v.y, v.z], (vo + i) * 3);
          v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); nor.set([v.x, v.y, v.z], (vo + i) * 3);
          if (U) uv.set([U.getX(i), U.getY(i)], (vo + i) * 2);
        }
        if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.getX(i) + vo;
        else for (let i = 0; i < P.count; i++) idx[io++] = vo + i;
        vo += P.count;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = cast; mesh.receiveShadow = receive;
      group.add(mesh);
    }
    this.parts.clear();
    return group;
  }
}
const _m = new THREE.Matrix4(), _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
class Frame {
  constructor(batch, matrix) { this.batch = batch; this.matrix = matrix; }
  add(material, geo, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s);
    this.batch.push(material, geo, new THREE.Matrix4().multiplyMatrices(this.matrix, _m));
    return this;
  }
  box(material, w, h, d, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) { return this.add(material, box(w, h, d), x, y, z, ry, rx, rz); }
  sub(x = 0, y = 0, z = 0, ry = 0) { return new Frame(this.batch, new THREE.Matrix4().multiplyMatrices(this.matrix, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z))); }
}

// ---- Хора ----
// Човек с крака и ръце, които се движат при ходене. look: { tunic, legs, cloak, hat, hair }.
export function figure(look = {}) {
  const M = (hex, o) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, ...o });
  const g = new THREE.Group();
  const tunic = M(look.tunic ?? 0x9a5a3a), legM = M(look.legs ?? 0x4a3a2c), skin = M(0xe0b08a);
  const limb = (mat, len, r, x, y) => {
    const pivot = new THREE.Group(); pivot.position.set(x, y, 0);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, len, 6).translate(0, -len / 2, 0), mat); m.castShadow = true;
    pivot.add(m); g.add(pivot); return pivot;
  };
  const legs = [limb(legM, 0.82, 0.085, -0.1, 0.84), limb(legM, 0.82, 0.085, 0.1, 0.84)];
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.19, look.long ? 0.3 : 0.24, look.long ? 1.15 : 0.72, 9), tunic);
  body.position.y = look.long ? 0.95 : 1.14; body.castShadow = true; g.add(body);
  const arms = [limb(tunic, 0.6, 0.065, -0.25, 1.42), limb(tunic, 0.6, 0.065, 0.25, 1.42)];
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skin); head.position.y = 1.64; head.castShadow = true; g.add(head);
  if (look.hat) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 8), M(look.hat)); h.position.y = 1.8; g.add(h); }
  else { const h = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, 7, 0, 1.9), M(look.hair ?? 0x3a2a1c)); h.position.set(0, 1.66, -0.015); g.add(h); }
  if (look.cloak) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.33, 0.95, 8, 1, true, Math.PI * 0.5, Math.PI), M(look.cloak, { side: THREE.DoubleSide })); c.position.y = 1.02; c.castShadow = true; g.add(c); }
  g.userData.legs = legs; g.userData.arms = arms;
  return g;
}
export function stride(fig, phase, amount = 1) {
  const a = Math.sin(phase) * 0.55 * amount;
  fig.userData.legs[0].rotation.x = a; fig.userData.legs[1].rotation.x = -a;
  fig.userData.arms[0].rotation.x = -a * 0.8; fig.userData.arms[1].rotation.x = a * 0.8;
}
