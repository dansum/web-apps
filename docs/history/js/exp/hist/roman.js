// Римски град по части: терен, небе, акведукт с арки, театър, амфитеатър, терми, вила, форум.
// Всичко е от прости тела и малки рисувани текстури (canvas), без външни файлове.
import { mat, THREE } from '../../kit.js';
import { person } from './antiquity.js';

const MARBLE = 0xf4efe4;
const STONE = 0xe6dcc6;
const STONE_D = 0xcfc2a5;
const TILE = 0xb9583a;
const sm = (v) => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };
const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// Вода с движещи се светли ивици. Връща материал; texture.offset.x се мести от сцената.
export function waterMat({ opacity = 0.92 } = {}) {
  const map = canvasTex(64, 32, (g, w, h) => {
    g.fillStyle = '#3f98d8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(255,255,255,${0.18 + hash(i, 3) * 0.4})`;
      g.fillRect(hash(i, 1) * w, hash(i, 2) * h, 6 + hash(i, 4) * 14, 1.5);
    }
  });
  const m = mat(0xffffff, { map, roughness: 0.25, transparent: true, opacity });
  m.userData.noShadow = true;
  return m;
}

// Каменна настилка за площада и улиците.
function pavingTex() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#e6dcc4'; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) {
      const x = i * 32 + (j % 2) * 16, y = j * 16;
      g.fillStyle = `rgba(120,100,70,${0.04 + hash(i + 5, j) * 0.1})`;
      g.fillRect(x, y, 32, 16); g.fillRect(x - 64, y, 32, 16);
      g.strokeStyle = 'rgba(110,95,70,0.45)'; g.lineWidth = 1;
      g.strokeRect(x + 0.5, y + 0.5, 32, 16); g.strokeRect(x - 63.5, y + 0.5, 32, 16);
    }
  });
}
export function paved(w, d, { color = 0xffffff, y = 0.012, density = 2.2 } = {}) {
  const map = pavingTex();
  map.repeat.set(w * density, d * density);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), mat(color, { map, roughness: 0.9 }));
  m.position.y = y;
  m.userData.noCast = true;
  return m;
}

// Небе с плавен преход от хоризонта нагоре. top/bottom се сменят за залез.
export function sky({ top = 0x6ea8e6, bottom = 0xe3eef2 } = {}) {
  const uniforms = { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(95, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms,
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.02, 0.55, h)), 1.0);\n#include <colorspace_fragment>\n}',
  }));
  m.userData.noShadow = true;
  m.userData.uniforms = uniforms;
  return m;
}

// Терен: равно място за града, планина с извора, хълм зад театъра, далечни възвишения.
// Мрежата е гъста в средата и рядка към хоризонта.
export function createTerrain({ flat, mountain: M, theatre: T }) {
  const Hc = { x: T.x - T.ox * 2.1, z: T.z - T.oz * 2.1 };
  function parts(x, z) {
    const out = Math.hypot(Math.max(flat.x0 - x, 0, x - flat.x1), Math.max(flat.z0 - z, 0, z - flat.z1));
    const k = sm(out / 3.5), farK = sm((out - 7) / 22);
    const base = k * (noise(x * 0.33 + 3.1, z * 0.33 + 7.7) * 0.55 + noise(x * 0.9, z * 0.9) * 0.15 - 0.08)
      + farK * noise(x * 0.07 + 11, z * 0.07 + 5) * 7;
    const hm = M.h * Math.pow(Math.max(0, 1 - Math.hypot(x - M.x, z - M.z) / M.r), 1.15) * (0.85 + 0.3 * noise(x * 1.4, z * 1.4));
    let hh = 0.85 * sm(1 - Math.hypot(x - Hc.x, z - Hc.z) / 2.6);
    const rx = x - T.x, rz = z - T.z, r = Math.hypot(rx, rz);
    if (r < 2.4) {
      // Под седалките хълмът не излиза над тях; пред сцената е равно.
      const behind = -(rx * T.ox + rz * T.oz) > 0;
      const cap = behind ? Math.max(0, r - 0.65) * 0.5 : 0;
      hh += (Math.min(hh, cap) - hh) * sm((2.4 - r) / 0.5);
    }
    return { base, hm, hh, k, farK };
  }
  const heightAt = (x, z) => { const p = parts(x, z); return p.base + p.hm + p.hh; };

  const SX = 112, SZ = 96;
  const geo = new THREE.PlaneGeometry(2, 2, SX, SZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const C = (hex) => new THREE.Color(hex);
  const earth = C(0xd6c89b), grassA = C(0xa3b96f), grassB = C(0x89a85b), rock = C(0x9d9685), rockHi = C(0xbdb6a5), farC = C(0x93a98f);
  const c = new THREE.Color(), g = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i), v = pos.getZ(i);
    const x = -1 + 12 * u + 34 * u ** 5, z = 0.5 + 10 * v + 30 * v ** 5;
    const p = parts(x, z);
    pos.setXYZ(i, x, p.base + p.hm + p.hh, z);
    g.copy(grassA).lerp(grassB, noise(x * 0.6 + 9, z * 0.6));
    c.copy(earth).lerp(g, Math.max(p.k, sm(p.hh / 0.25), sm(p.hm / 0.3)));
    c.lerp(rock, sm((p.hm - 1.1) / 0.9)).lerp(rockHi, sm((p.hm - 2.3) / 0.8)).lerp(farC, p.farK * 0.75);
    c.multiplyScalar(0.94 + 0.12 * hash(x * 3.3, z * 3.3));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  mesh.userData.noCast = true;
  return { mesh, heightAt };
}

// Много колони наведнъж. list: [[x, y, z, височина, радиус], …]
export function columns(list, color = MARBLE) {
  const g = new THREE.Group();
  const shaft = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.85, 1, 1, 8).translate(0, 0.5, 0), mat(color), list.length);
  const cap = new THREE.InstancedMesh(new THREE.BoxGeometry(2.7, 1, 2.7).translate(0, 0.5, 0), mat(color), list.length);
  const m = new THREE.Matrix4();
  list.forEach(([x, y, z, h, r], i) => {
    shaft.setMatrixAt(i, m.makeScale(r, h, r).setPosition(x, y, z));
    cap.setMatrixAt(i, m.makeScale(r, r * 1.2, r).setPosition(x, y + h, z));
  });
  g.add(shaft, cap);
  return g;
}

// Античен театър: полукръгли стъпаловидни седалки в два пояса, орхестра, сцена с двуетажна колонада.
// Сцената е към +z. userData.rows: редовете (радиус и височина) — за зрителите.
export const THEATRE_STAIRS = [1, 2, 3, 4, 5].map((j) => Math.PI / 2 + (Math.PI * j) / 6);
export function theatre() {
  const g = new THREE.Group();
  const R0 = 0.45, RW = 0.09, RH = 0.06;
  const pts = [[R0, 0]];
  let r = R0, y = 0.04;
  pts.push([r, y]);
  const rows = [];
  for (let k = 0; k < 12; k++) {
    if (k === 6) { r += 0.14; pts.push([r, y]); } // пътека между двата пояса
    y += RH; pts.push([r, y]);
    rows.push({ r: r + RW / 2, y });
    r += RW; pts.push([r, y]);
  }
  y += 0.08; pts.push([r, y]);
  r += 0.07; pts.push([r, y], [r, 0]);
  const v2 = pts.map(([a, b]) => new THREE.Vector2(a, b));
  const seatMat = mat(STONE, { side: THREE.DoubleSide });
  const seats = new THREE.Mesh(new THREE.LatheGeometry(v2, 44, Math.PI / 2, Math.PI), seatMat);
  seats.userData.noReceive = true; // стъпалата са твърде ситни за сенките
  g.add(seats);
  // Подпорни стени в двата края на полукръга.
  const side = new THREE.ShapeGeometry(new THREE.Shape(v2));
  const sideMat = mat(STONE_D, { side: THREE.DoubleSide });
  const s1 = new THREE.Mesh(side, sideMat), s2 = new THREE.Mesh(side, sideMat);
  s2.scale.x = -1;
  g.add(s1, s2);
  // Стълбища, които делят седалките на сектори.
  const stairGeo = new THREE.BoxGeometry(0.05, 0.012, Math.hypot(0.54, 0.36));
  const stairMat = mat(0xb9ad92);
  for (const phi of THEATRE_STAIRS) {
    for (const [rm, ym] of [[R0 + 0.27, 0.04 + 0.18], [R0 + 0.54 + 0.14 + 0.27, 0.04 + 0.54]]) {
      const holder = new THREE.Group();
      holder.rotation.y = phi;
      const st = new THREE.Mesh(stairGeo, stairMat);
      st.position.set(0, ym + 0.036, rm);
      st.rotation.x = -Math.atan2(0.36, 0.54);
      holder.add(st);
      g.add(holder);
    }
  }
  const orch = new THREE.Mesh(new THREE.CircleGeometry(R0, 24, 0, Math.PI).rotateX(-Math.PI / 2), mat(0xefe6d2));
  orch.position.y = 0.012;
  g.add(orch);
  const add = (w, h, d, x, yy, z, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x, yy, z); g.add(m); return m; };
  add(1.9, 0.1, 0.36, 0, 0.05, 0.2, 0xd9c7a2); // подиум на сцената
  add(2.2, 0.62, 0.12, 0, 0.31, 0.47, STONE); // стена зад сцената
  add(0.22, 0.62, 0.36, -1.0, 0.31, 0.3, STONE);
  add(0.22, 0.62, 0.36, 1.0, 0.31, 0.3, STONE);
  for (const x of [-0.5, 0, 0.5]) add(x ? 0.13 : 0.18, x ? 0.18 : 0.22, 0.02, x, x ? 0.19 : 0.21, 0.405, 0x54463a); // три врати
  const cols = [];
  for (let i = 0; i < 8; i++) {
    const x = -0.77 + i * 0.22;
    cols.push([x, 0.1, 0.345, 0.2, 0.02], [x, 0.345, 0.345, 0.18, 0.018]);
  }
  g.add(columns(cols));
  add(1.76, 0.035, 0.1, 0, 0.3275, 0.36, MARBLE);
  add(1.76, 0.035, 0.1, 0, 0.5525, 0.36, MARBLE);
  g.userData.rows = rows;
  g.userData.top = y;
  return g;
}

// Зрители по седалките на театъра (за „днес“). Връща InstancedMesh; show(k) ги показва постепенно.
export function theatreAudience(rows, n = 84) {
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.034, 8, 6).scale(1, 1.35, 1), mat(0xffffff), n);
  const colors = [0xe05a4e, 0x3f7fd0, 0xf2c14e, 0x4cae7a, 0xffffff, 0x8a5fc0, 0xf08a3c, 0x2f3b55];
  const seats = [];
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const row = rows[1 + (i * 5) % (rows.length - 1)];
    let phi;
    for (let tries = 0; tries < 20; tries++) {
      phi = Math.PI / 2 + 0.08 + hash(i, tries) * (Math.PI - 0.16);
      if (THEATRE_STAIRS.every((s) => Math.abs(s - phi) * row.r > 0.06)) break;
    }
    seats.push([row.r * Math.sin(phi), row.y + 0.04, row.r * Math.cos(phi)]);
    mesh.setColorAt(i, c.setHex(colors[Math.floor(hash(i, 77) * colors.length)]));
  }
  const m = new THREE.Matrix4();
  mesh.frustumCulled = false;
  mesh.userData.show = (k) => {
    seats.forEach(([x, y, z], i) => {
      const s = sm(k * 2.2 - (i / n) * 1.2);
      mesh.setMatrixAt(i, m.makeScale(s, s, s).setPosition(x, y, z));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = k > 0;
  };
  mesh.userData.show(0);
  return mesh;
}

// Амфитеатър: овал със стъпаловидни седалки, арена с пясък и аркади отвън.
export function amphitheatre() {
  const g = new THREE.Group();
  const oval = new THREE.Group();
  oval.scale.z = 0.74;
  g.add(oval);
  const pts = [[0.62, 0], [0.62, 0.1]];
  let r = 0.62, y = 0.1;
  const rows = [];
  for (let k = 0; k < 6; k++) { y += 0.07; pts.push([r, y]); rows.push({ r: r + 0.042, y }); r += 0.085; pts.push([r, y]); }
  y += 0.05; pts.push([r, y]); r += 0.07; pts.push([r, y]);
  const seats = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), 48), mat(STONE, { side: THREE.DoubleSide }));
  seats.userData.noReceive = true;
  oval.add(seats);
  const arches = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#dccba6'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(120,100,70,0.25)';
    for (let i = 0; i < 8; i++) c.fillRect(0, i * 16, w, 1);
    c.fillStyle = '#eadcbc'; c.fillRect(0, 60, w, 7); c.fillRect(0, 0, w, 7);
    c.fillStyle = '#5d4d3b';
    c.beginPath(); c.arc(64, 96, 30, Math.PI, 0); c.lineTo(94, 128); c.lineTo(34, 128); c.closePath(); c.fill();
    c.beginPath(); c.arc(64, 38, 22, Math.PI, 0); c.lineTo(86, 60); c.lineTo(42, 60); c.closePath(); c.fill();
  });
  arches.repeat.set(26, 1);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.004, r + 0.004, y, 48, 1, true), mat(0xffffff, { map: arches }));
  wall.position.y = y / 2;
  oval.add(wall);
  const arena = new THREE.Mesh(new THREE.CircleGeometry(0.62, 40).rotateX(-Math.PI / 2), mat(0xe6d29a));
  arena.position.y = 0.012;
  oval.add(arena);
  // Зрители.
  const n = 70;
  const crowd = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 6, 5), mat(0xffffff), n);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  const togas = [0xf3f0e6, 0xf3f0e6, 0xb0463a, 0xd9a35a, 0x8a6f52, 0xd98aa0];
  for (let i = 0; i < n; i++) {
    const row = rows[i % rows.length], a = hash(i, 9) * Math.PI * 2;
    crowd.setMatrixAt(i, m.makeTranslation(row.r * Math.sin(a), row.y + 0.03, row.r * Math.cos(a)));
    crowd.setColorAt(i, c.setHex(togas[Math.floor(hash(i, 5) * togas.length)]));
  }
  oval.add(crowd);
  // Двама гладиатори на арената.
  const gl = [person('warrior', { scale: 0.42 }), person('warrior', { scale: 0.42 })];
  gl[0].position.set(-0.16, 0.012, 0); gl[0].rotation.y = Math.PI / 2;
  gl[1].position.set(0.16, 0.012, 0); gl[1].rotation.y = -Math.PI / 2;
  g.add(gl[0], gl[1]);
  g.userData.gladiators = gl;
  g.userData.top = y;
  return g;
}

// Терми: зала със сводове, купол, басейн с колонада отпред. userData.pool — водата в басейна.
export function baths(water) {
  const g = new THREE.Group();
  const add = (geo, color, x, y, z, extra) => { const m = new THREE.Mesh(geo, typeof color === 'number' ? mat(color, extra) : color); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(1.7, 0.05, 2.1), STONE_D, 0, 0.025, 0.05);
  add(new THREE.BoxGeometry(1.5, 0.4, 0.6), 0xeee2c8, 0, 0.25, -0.2);
  const vault = new THREE.CylinderGeometry(0.25, 0.25, 0.62, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2);
  const glass = new THREE.CircleGeometry(0.15, 12, 0, Math.PI);
  for (const x of [-0.5, 0, 0.5]) {
    add(vault, TILE, x, 0.45, -0.2);
    add(glass, 0x4f6274, x, 0.47, 0.113, { roughness: 0.3 });
  }
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 20), 0xeee2c8, 0, 0.3, -0.66);
  add(new THREE.SphereGeometry(0.31, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), TILE, 0, 0.55, -0.66);
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), 0x3b3f48, 0, 0.86, -0.66);
  add(new THREE.BoxGeometry(0.2, 0.26, 0.02), 0x5a4a3a, 0, 0.18, 0.105); // врата
  // Басейн.
  add(new THREE.BoxGeometry(1.0, 0.07, 0.5), STONE, 0, 0.085, 0.6);
  add(new THREE.PlaneGeometry(0.86, 0.36).rotateX(-Math.PI / 2), 0xa9cdd6, 0, 0.1215, 0.6);
  const pool = add(new THREE.PlaneGeometry(0.86, 0.36).rotateX(-Math.PI / 2), water, 0, 0.126, 0.6);
  const cols = [];
  for (const z of [0.2, 0.47, 0.74, 1.0]) cols.push([-0.74, 0.05, z, 0.34, 0.026], [0.74, 0.05, z, 0.34, 0.026]);
  for (const x of [-0.37, 0, 0.37]) cols.push([x, 0.05, 1.0, 0.34, 0.026]);
  g.add(columns(cols));
  add(new THREE.BoxGeometry(0.08, 0.04, 0.9), MARBLE, -0.74, 0.44, 0.6);
  add(new THREE.BoxGeometry(0.08, 0.04, 0.9), MARBLE, 0.74, 0.44, 0.6);
  add(new THREE.BoxGeometry(1.56, 0.04, 0.08), MARBLE, 0, 0.44, 1.0);
  g.userData.pool = pool;
  g.userData.top = 0.86;
  return g;
}

// Вила с вътрешен двор, колони, басейн за дъждовна вода и подова мозайка.
export function villa(water) {
  const g = new THREE.Group();
  const add = (geo, color, x, y, z, extra) => { const m = new THREE.Mesh(geo, typeof color === 'number' ? mat(color, extra) : color); m.position.set(x, y, z); g.add(m); return m; };
  const WALL = 0xf2e7cc;
  add(new THREE.BoxGeometry(1.62, 0.04, 1.37), STONE_D, 0, 0.02, 0);
  add(new THREE.BoxGeometry(1.5, 0.3, 0.3), WALL, 0, 0.19, 0.475);
  add(new THREE.BoxGeometry(1.5, 0.3, 0.3), WALL, 0, 0.19, -0.475);
  add(new THREE.BoxGeometry(0.3, 0.3, 0.65), WALL, -0.6, 0.19, 0);
  add(new THREE.BoxGeometry(0.3, 0.3, 0.65), WALL, 0.6, 0.19, 0);
  // Покривите са наклонени навътре: дъждът се стича в басейна на двора.
  const roofL = new THREE.BoxGeometry(1.6, 0.03, 0.44), roofS = new THREE.BoxGeometry(0.44, 0.03, 0.74);
  add(roofL, TILE, 0, 0.375, 0.455).rotation.x = -0.26;
  add(roofL, TILE, 0, 0.375, -0.455).rotation.x = 0.26;
  add(roofS, TILE, -0.58, 0.372, 0).rotation.z = -0.26;
  add(roofS, TILE, 0.58, 0.372, 0).rotation.z = 0.26;
  const mosaic = canvasTex(256, 256, (c, w) => {
    c.fillStyle = '#efe6d2'; c.fillRect(0, 0, w, w);
    c.strokeStyle = '#8f3b2a'; c.lineWidth = 10; c.strokeRect(9, 9, w - 18, w - 18);
    for (let i = 0; i < 14; i++) for (const [x, y] of [[22 + i * 15.4, 20], [22 + i * 15.4, w - 31], [20, 22 + i * 15.4], [w - 31, 22 + i * 15.4]]) {
      c.fillStyle = i % 2 ? '#2b2b2b' : '#c99a3a'; c.fillRect(x, y, 11, 11);
    }
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) {
      const x = 48 + i * 32, y = 48 + j * 32;
      c.fillStyle = (i + j) % 2 ? '#a8482f' : '#c99a3a';
      c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + 14, y); c.lineTo(x, y + 14); c.lineTo(x - 14, y); c.closePath(); c.fill();
      c.strokeStyle = '#2b2b2b'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#2b2b2b'; c.fillRect(x - 3, y - 3, 6, 6);
    }
    c.strokeStyle = 'rgba(120,100,70,0.22)'; c.lineWidth = 1;
    for (let i = 0; i < w; i += 5) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, w); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); }
  });
  add(new THREE.PlaneGeometry(0.9, 0.65).rotateX(-Math.PI / 2), mat(0xffffff, { map: mosaic }), 0, 0.045, 0);
  add(new THREE.BoxGeometry(0.34, 0.03, 0.24), STONE, 0, 0.055, 0);
  add(new THREE.PlaneGeometry(0.28, 0.18).rotateX(-Math.PI / 2), water, 0, 0.072, 0);
  const cols = [];
  for (const x of [-0.41, -0.14, 0.14, 0.41]) cols.push([x, 0.04, 0.29, 0.25, 0.018], [x, 0.04, -0.29, 0.25, 0.018]);
  for (const x of [-0.41, 0.41]) cols.push([x, 0.04, 0, 0.25, 0.018]);
  g.add(columns(cols));
  add(new THREE.BoxGeometry(0.16, 0.2, 0.02), 0x5a4a3a, 0, 0.14, 0.63);
  for (const x of [-0.5, 0.5]) add(new THREE.BoxGeometry(0.1, 0.07, 0.02), 0x5a4a3a, x, 0.24, 0.63);
  g.userData.top = 0.45;
  return g;
}

// Акведукт от извора (локално x = 0) до водната кула в града (x = len). Височината на извора се сменя.
// Връща { group, source, piers, trough, tower, setSource(h), setFront(p), setTank(k), water }.
export function aqueduct({ len, destH, water }) {
  const group = new THREE.Group();
  const stone = mat(0xdccdaa), stoneD = mat(0xc9b78f);
  const N = 9, bay = len / (N - 1);
  const piers = [];
  const pierGeo = new THREE.BoxGeometry(0.14, 1, 0.22);
  for (let i = 0; i < N - 1; i++) { const p = new THREE.Mesh(pierGeo, stone); group.add(p); piers.push(p); }
  const rad = (bay - 0.14) / 2, AH = rad + 0.05;
  const s = new THREE.Shape();
  s.moveTo(-bay / 2, -AH); s.lineTo(-rad, -AH); s.absarc(0, -AH, rad, Math.PI, 0, true);
  s.lineTo(bay / 2, -AH); s.lineTo(bay / 2, 0); s.lineTo(-bay / 2, 0);
  const archGeo = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false, curveSegments: 10 }).translate(0, 0, -0.1);
  const arches = [];
  for (let i = 0; i < N - 1; i++) { const a = new THREE.Mesh(archGeo, stone); group.add(a); arches.push(a); }
  const channel = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.28), stoneD);
  const flow = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.15).rotateX(-Math.PI / 2), water);
  flow.position.y = 0.046;
  channel.add(bed, flow);
  for (const z of [-0.12, 0.12]) { const lip = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.04), stone); lip.position.set(0, 0.06, z); channel.add(lip); }
  group.add(channel);
  // Каменно корито при извора.
  const trough = new THREE.Group();
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.4), stoneD);
  const tw = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.32).rotateX(-Math.PI / 2), water);
  tw.position.y = 0.085;
  trough.add(tb, tw);
  group.add(trough);
  // Водна кула в града: оттук водата тръгва по тръби към чешмите и термите.
  const tower = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, destH - 0.05, 16), stone);
  body.position.y = (destH - 0.05) / 2;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.26, 16, 1, true), mat(0xdccdaa, { side: THREE.DoubleSide }));
  rim.position.y = destH + 0.08;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.04, 16), stoneD);
  band.position.y = destH - 0.05;
  const tank = new THREE.Mesh(new THREE.CircleGeometry(0.285, 16).rotateX(-Math.PI / 2), water);
  tower.add(body, rim, band, tank);
  tower.position.x = len;
  group.add(tower);

  let srcH = destH;
  function setSource(h) {
    srcH = h;
    const slope = Math.atan2(destH - h, len);
    for (let i = 0; i < N - 1; i++) {
      const hi = h + ((destH - h) * i) / (N - 1);
      piers[i].scale.y = hi + 0.4;
      piers[i].position.set(bay * i, (hi - 0.4) / 2, 0);
      const hm = h + ((destH - h) * (i + 0.5)) / (N - 1);
      arches[i].position.set(bay * (i + 0.5), hm, 0);
      arches[i].rotation.z = slope;
    }
    channel.scale.x = Math.hypot(len, destH - h) + 0.1;
    channel.position.set(len / 2, (h + destH) / 2 + 0.04, 0);
    channel.rotation.z = slope;
    trough.position.set(-0.1, h + 0.05, 0);
  }
  // p: докъде е стигнала водата по канала (0–1).
  function setFront(p) {
    flow.visible = p > 0.01;
    flow.scale.x = Math.max(p, 0.01);
    flow.position.x = -0.5 + p / 2;
  }
  function setTank(k) { tank.position.y = destH - 0.02 + k * 0.16; tank.visible = k > 0.02; }
  setSource(destH); setFront(0); setTank(0);
  return { group, piers, trough, tower, setSource, setFront, setTank, get srcH() { return srcH; } };
}

// Скала с водопад и вир: изворът на акведукта. Локално +x сочи към града.
export function springCliff(water) {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.75, 1.0, 3.0, 7, 3);
  geo.rotateY(Math.PI / 2 - Math.PI / 7);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const j = 1 + (hash(Math.round(x * 7), Math.round(z * 7) + Math.round(y * 3)) - 0.5) * (x > 0.5 ? 0.04 : 0.22);
    p.setXYZ(i, x * j, y, z * j);
  }
  geo.computeVertexNormals();
  const rock = new THREE.Mesh(geo, mat(0x9d9685, { flat: true }));
  rock.position.set(-0.85, 1.5, 0);
  const fall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.95, 0.26), water);
  fall.position.set(0.0, 1.46, 0);
  fall.rotation.z = Math.atan2(0.225, 3.0);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20).rotateX(-Math.PI / 2), water);
  pond.position.set(0.2, 0.33, 0);
  const bank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.6, 20), mat(0xb8ad92));
  bank.position.set(0.2, 0.02, 0);
  g.add(rock, fall, pond, bank);
  return g;
}

// Чешма на форума. jets(t, k): струите при налягане k (0–1).
export function fountain(water) {
  const g = new THREE.Group();
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.12, 8), mat(STONE));
  basin.position.y = 0.06;
  const pond = new THREE.Mesh(new THREE.CircleGeometry(0.31, 8).rotateX(-Math.PI / 2), water);
  pond.position.y = 0.124;
  const dry = new THREE.Mesh(new THREE.CircleGeometry(0.31, 8).rotateX(-Math.PI / 2), mat(0xb9ad92));
  dry.position.y = 0.1215;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.34, 8), mat(MARBLE));
  post.position.y = 0.28;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.04, 0.06, 12), mat(MARBLE));
  bowl.position.y = 0.46;
  const n = 30;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 6, 5), mat(0x9fd3f5, { roughness: 0.2 }), n);
  drops.frustumCulled = false;
  drops.userData.noShadow = true;
  g.add(basin, dry, pond, post, bowl, drops);
  const m = new THREE.Matrix4();
  g.userData.jets = (t, k) => {
    pond.visible = k > 0.03;
    for (let i = 0; i < n; i++) {
      const a = (i % 6) * (Math.PI / 3) + 0.3, u = (t * 0.9 + i / n * 5) % 1;
      const rr = 0.03 + 0.26 * u * k, y = 0.5 + (0.55 * u - 1.0 * u * u) * (0.4 + 0.6 * k);
      const s = k > 0.03 ? 0.5 + 0.5 * k : 0;
      drops.setMatrixAt(i, m.makeScale(s, s, s).setPosition(Math.cos(a) * rr, Math.max(y, 0.13), Math.sin(a) * rr));
    }
    drops.instanceMatrix.needsUpdate = true;
  };
  g.userData.jets(0, 0);
  return g;
}

// Пара над топлата вода. update(t, k) я движи; k е силата (0–1).
export function steam(points) {
  const map = canvasTex(64, 64, (c) => {
    const gr = c.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
  });
  const g = new THREE.Group();
  const puffs = [];
  points.forEach((pt, j) => {
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity: 0 }));
      sp.userData = { pt, ph: i / 4 + j * 0.13, noShadow: true };
      g.add(sp); puffs.push(sp);
    }
  });
  g.userData.update = (t, k) => {
    for (const sp of puffs) {
      const u = (t * 0.22 + sp.userData.ph) % 1, [x, y, z] = sp.userData.pt;
      sp.position.set(x + Math.sin(u * 5 + sp.userData.ph * 20) * 0.06, y + u * 0.55, z);
      sp.scale.setScalar(0.16 + u * 0.3);
      sp.material.opacity = Math.sin(u * Math.PI) * 0.5 * k;
    }
  };
  return g;
}

// Къщи с керемидени покриви. list: [[x, z, ширина, дълбочина, височина, завъртане], …]
export function houses(list) {
  const g = new THREE.Group();
  const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), mat(0xffffff), list.length);
  const roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(0.74, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), mat(0xffffff), list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
  const wallC = [0xeedfc0, 0xe6d3ad, 0xf3e9d2, 0xe0c9a0], roofC = [0xb5553a, 0xa84e33, 0xc0623f];
  list.forEach(([x, z, w, d, h, ry = 0], i) => {
    q.setFromAxisAngle(up, ry);
    walls.setMatrixAt(i, m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(w, h, d)));
    roofs.setMatrixAt(i, m.compose(new THREE.Vector3(x, h, z), q, new THREE.Vector3(w * 1.1, 0.2, d * 1.1)));
    walls.setColorAt(i, c.setHex(wallC[i % wallC.length]));
    roofs.setColorAt(i, c.setHex(roofC[i % roofC.length]));
  });
  g.add(walls, roofs);
  return g;
}

// Дървета. cypress: [[x, y, z, мащаб]]; round: същото.
export function trees({ cypress = [], round = [] }) {
  const g = new THREE.Group();
  const m = new THREE.Matrix4();
  const put = (mesh, list) => { list.forEach(([x, y, z, s = 1], i) => mesh.setMatrixAt(i, m.makeScale(s, s, s).setPosition(x, y, z))); g.add(mesh); };
  if (cypress.length) put(new THREE.InstancedMesh(new THREE.ConeGeometry(0.085, 0.6, 7).translate(0, 0.32, 0), mat(0x4f7a4a, { flat: true }), cypress.length), cypress);
  if (round.length) {
    put(new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.04, 0.24, 5).translate(0, 0.1, 0), mat(0x7a5a3c), round.length), round);
    put(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.2, 0).translate(0, 0.36, 0), mat(0x7ea457, { flat: true }), round.length), round);
  }
  return g;
}

// Лозе: няколко зелени реда върху разорана земя.
export function vineyard(w = 1.5, rows = 5) {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.02, rows * 0.16 + 0.1), mat(0xb39a6b));
  soil.position.y = 0.01; soil.userData.noCast = true;
  g.add(soil);
  const vines = new THREE.InstancedMesh(new THREE.BoxGeometry(w, 0.1, 0.06), mat(0x6f9a4a, { flat: true }), rows);
  const m = new THREE.Matrix4();
  for (let i = 0; i < rows; i++) vines.setMatrixAt(i, m.makeTranslation(0, 0.07, (i - (rows - 1) / 2) * 0.16));
  g.add(vines);
  return g;
}

// Облаци, които бавно плуват. update(dt) ги мести.
export function clouds(n = 6) {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const m = mat(0xffffff, { flat: true, roughness: 1, fog: false });
  m.userData.noShadow = true;
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const b = new THREE.Mesh(geo, m);
      b.position.set((k - 1.5) * 0.9, hash(i, k) * 0.3, hash(k, i) * 0.6);
      b.scale.set(0.8 + hash(i + 3, k) * 0.6, 0.45 + hash(i, k + 5) * 0.25, 0.7);
      c.add(b);
    }
    c.position.set(-28 + hash(i, 40) * 56, 9 + hash(i, 41) * 4, -24 + hash(i, 42) * 16);
    c.scale.setScalar(1 + hash(i, 43));
    g.add(c);
  }
  g.userData.update = (dt) => { for (const c of g.children) { c.position.x += dt * 0.25; if (c.position.x > 30) c.position.x = -30; } };
  return g;
}

// Могила пръст, която покрива изоставена постройка.
export function mound(radius = 2.2, height = 1.0) {
  const geo = new THREE.SphereGeometry(radius, 22, 9, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const j = 1 + (noise(x * 1.7 + 4, z * 1.7) - 0.5) * 0.22;
    p.setXYZ(i, x * j, (y / radius) * height * j, z * j);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(0x93a862, { flat: true, roughness: 0.95 }));
  m.userData.noCast = true;
  return m;
}

// Сенки: всичко хвърля и приема сянка, освен небето, водата и парата.
export function shade(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const skip = o.userData.noShadow || (o.material && o.material.userData && o.material.userData.noShadow);
    o.castShadow = !skip && !o.userData.noCast;
    o.receiveShadow = !skip && !o.userData.noReceive;
  });
}
