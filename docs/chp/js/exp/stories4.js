// Статиите за 4. клас като живи 3D истории: „Пътят на една капка вода“ (4-1-a),
// „Земята, Слънцето и Луната“ (4-2-a) и „Как растението прави храна“ (4-3-a).
// Статията е четене, не упражнение: без точки. Всяка стъпка води камерата до обекта,
// показва текста в балонче до него и оживява процеса. Сцените са опростени копия от
// watercycle.js, solar.js и plants.js.
import { createStage, labelSprite, mat, THREE, esc } from '../kit.js';
import { createShell } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const clamp01 = (k) => Math.max(0, Math.min(1, k));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

const CSS = `
.st4 .bubble.wide { max-width: min(330px, 84%); }
.st4-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.st4-count { font-weight: 800; color: #4a5568; white-space: nowrap; }
.st4-hint { color: #4a5568; }
.st4-end .btn { margin-top: 6px; }
`;
function injectCss() {
  if (document.getElementById('st4-style')) return;
  const s = document.createElement('style');
  s.id = 'st4-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function glowTex(stops) {
  return canvasTex(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([k, c]) => g.addColorStop(k, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
}
const SUN_GLOW = [[0, 'rgba(255,240,170,1)'], [0.35, 'rgba(255,220,110,0.55)'], [1, 'rgba(255,200,60,0)']];
function glowSprite(stops, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(stops), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(size, size, 1);
  s.raycast = () => {};
  return s;
}
// Слънце с лъчи (от watercycle.js / plants.js).
function sunModel(r, nRays = 12) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
  const glow = glowSprite(SUN_GLOW, r * 5.2);
  const rays = new THREE.Group();
  const rayMat = new THREE.MeshBasicMaterial({ color: 0xffc928, transparent: true, opacity: 0.85 });
  for (let i = 0; i < nRays; i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r * 0.17, r * 0.74, 4), rayMat);
    const a = (i / nRays) * Math.PI * 2;
    m.position.set(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5, 0);
    m.rotation.z = a - Math.PI / 2;
    rays.add(m);
  }
  g.add(glow, ball, rays);
  g.userData = { glow, rays, r };
  return g;
}
function animSun(g, t, camera) {
  const p = 1 + Math.sin(t * 2) * 0.05;
  g.userData.rays.rotation.z = t * 0.25;
  g.userData.rays.scale.setScalar(p);
  g.userData.glow.scale.setScalar(g.userData.r * 5.2 * p);
  g.lookAt(camera.position);
}
// Пул от еднакви частици с InstancedMesh (от watercycle.js).
function makePool(geo, material, n) {
  const mesh = new THREE.InstancedMesh(geo, material, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const items = [];
  for (let i = 0; i < n; i++) items.push({ on: false, p: new V3(), v: new V3(), life: 0, s: 1, k: 0, rot: 0 });
  const dummy = new THREE.Object3D();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < n; i++) mesh.setMatrixAt(i, zero);
  return {
    mesh, items,
    spawn() { for (const it of items) if (!it.on) { it.on = true; it.life = 0; it.k = 0; it.rest = 0; return it; } return null; },
    clear() { for (const it of items) it.on = false; },
    write() {
      items.forEach((it, i) => {
        if (!it.on) { mesh.setMatrixAt(i, zero); return; }
        dummy.position.copy(it.p);
        dummy.rotation.set(it.rot, it.rot * 0.7, 0);
        dummy.scale.setScalar(Math.max(0.0001, it.s));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
const narrowOf = (el) => (el.clientWidth || 600) < 560;
// Отдалечава камерата на тесен екран, за да се вижда същото.
function view(stage, el, pos, tgt, far = 1.6) {
  const p = new V3(...pos);
  if (narrowOf(el)) { const t = new V3(...tgt); p.sub(t).multiplyScalar(far).add(t); }
  stage.stopFollow();
  stage.flyTo(p.toArray(), tgt, 1.3);
}

// =====================================================================
// 4-1-a „Пътят на една капка вода“ — макетът от watercycle.js (опростен)
// =====================================================================
const W = 24, D = 16, NX = 96, NZ = 64;
const SEA_X = -2.5;
const g2 = (x, z, cx, cz, s) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));
function baseHeight(x, z) {
  const t = smooth(-6.5, -2.0, x);
  const land = 0.55 + 0.07 * (x + 2) + 0.08 * Math.sin(z * 0.5 + x * 0.3);
  let h = -0.9 * (1 - t) + land * t;
  h += 3.6 * g2(x, z, 6.6, -4.0, 1.9) + 2.4 * g2(x, z, 9.4, -2.2, 1.4) + 1.8 * g2(x, z, 3.8, -5.6, 1.5);
  h += 0.8 * g2(x, z, -0.5, -5.6, 1.7) + 0.6 * g2(x, z, 9.6, 4.6, 1.7) + 0.35 * g2(x, z, 1.0, 5.8, 1.4);
  h += 0.05 * Math.sin(x * 1.7) * Math.cos(z * 1.3) * t;
  return h;
}
function riverTexture() {
  const r = rng(7);
  const t = canvasTex(64, 256, (ctx) => {
    ctx.fillStyle = '#3f8fd6';
    ctx.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.3})`;
      ctx.fillRect(6 + r() * 52, r() * 256, 2 + r() * 3, 10 + r() * 24);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function buildWater(el) {
  const stage = createStage(el, {
    background: 0xbfe3ff, camPos: [0, 11, 20], target: [0, 1.4, 0],
    fog: { color: 0xbfe3ff, near: 34, far: 70 }, minDistance: 3, maxDistance: 40, maxPolarAngle: Math.PI * 0.46,
  });
  const { scene, camera } = stage;
  stage.sun.position.set(-9, 12, 4);
  stage.sun.intensity = 1.9;
  const R = rng(42);

  // ---------- терен с корито на реката ----------
  const groundGeo = new THREE.PlaneGeometry(W, D, NX, NZ);
  groundGeo.rotateX(-Math.PI / 2);
  const gp = groundGeo.attributes.position;
  const heights = new Float32Array(gp.count);
  const riverCurve = new THREE.CatmullRomCurve3([
    [5.5, 0, -2.5], [4.5, 0, -1.2], [3.1, 0, -0.3], [1.6, 0, 0.5], [0, 0, 1.0], [-1.6, 0, 1.7], [-3.2, 0, 2.1], [-5.4, 0, 2.3],
  ].map((p) => new V3(...p)));
  const RN = 140;
  const rPts = riverCurve.getSpacedPoints(RN - 1);
  const rSurf = [];
  let runMin = Infinity;
  for (const p of rPts) { runMin = Math.min(runMin, baseHeight(p.x, p.z)); rSurf.push(Math.max(0.02, runMin - 0.1)); }
  const rWidth = (i) => 0.22 + (i / RN) * 0.3;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i);
    let h = baseHeight(x, z);
    let best = Infinity; let bi = 0;
    for (let k = 0; k < RN; k += 2) { const d = (rPts[k].x - x) ** 2 + (rPts[k].z - z) ** 2; if (d < best) { best = d; bi = k; } }
    const d = Math.sqrt(best);
    const w = rWidth(bi);
    if (d < w * 2.4) { const k = smooth(w * 0.7, w * 2.4, d); h = Math.min(h, (rSurf[bi] - 0.14) * (1 - k) + h * k); }
    heights[i] = h;
    gp.setY(i, h);
  }
  groundGeo.computeVertexNormals();
  const gNorm = groundGeo.attributes.normal;
  const gCol = new Float32Array(gp.count * 3);
  const C = {
    sand: new THREE.Color(0xe6d29a), wetSand: new THREE.Color(0xb8a676), grass: new THREE.Color(0x6db34a),
    grass2: new THREE.Color(0x4f9a3c), rock: new THREE.Color(0x8d8a84), snow: new THREE.Color(0xf7fbff),
  };
  const cTmp = new THREE.Color();
  for (let i = 0; i < gp.count; i++) {
    const h = heights[i], x = gp.getX(i), ny = gNorm.getY(i);
    const nz = Math.sin(x * 2.3) * Math.cos(gp.getZ(i) * 1.9) * 0.5 + (R() - 0.5) * 0.4;
    if (h < -0.15) cTmp.copy(C.wetSand);
    else if (h < 0.42 && x < -0.8) cTmp.copy(C.sand);
    else {
      cTmp.copy(C.grass).lerp(C.grass2, 0.5 + 0.5 * Math.sin(x * 0.8 + gp.getZ(i) * 0.6));
      if (ny < 0.8 || h > 2.4) cTmp.lerp(C.rock, Math.min(1, Math.max((0.86 - ny) * 4, (h - 2.2) * 0.9)));
    }
    if (h > 3.1 + nz * 0.35) cTmp.copy(C.snow);
    gCol[i * 3] = cTmp.r; gCol[i * 3 + 1] = cTmp.g; gCol[i * 3 + 2] = cTmp.b;
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
  scene.add(new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true })));
  const dx = W / NX, dz = D / NZ;
  function groundH(x, z) {
    const cx = Math.min(NX - 1e-3, Math.max(0, (x + W / 2) / dx));
    const cz = Math.min(NZ - 1e-3, Math.max(0, (z + D / 2) / dz));
    const c0 = Math.floor(cx), r0 = Math.floor(cz), fx = cx - c0, fz = cz - r0;
    const at = (c, r) => heights[r * (NX + 1) + c];
    const h = at(c0, r0) * (1 - fx) * (1 - fz) + at(c0 + 1, r0) * fx * (1 - fz) + at(c0, r0 + 1) * (1 - fx) * fz + at(c0 + 1, r0 + 1) * fx * fz;
    return x < SEA_X ? Math.max(h, 0) : h;
  }
  // Стени на макета: почва, пръст, скала.
  const BOT = -2.2;
  const skirtPos = [], skirtCol = [];
  const bandCol = [new THREE.Color(0x6b4a2b), new THREE.Color(0x9a7650), new THREE.Color(0x77706a)];
  const edge = (fn, n) => {
    for (let k = 0; k < n; k++) {
      const a = fn(k / n), b = fn((k + 1) / n);
      const ta = groundH(a.x, a.z) * (a.x < SEA_X ? 0 : 1) + (a.x < SEA_X ? Math.min(0, baseHeight(a.x, a.z)) : 0);
      const tb = groundH(b.x, b.z) * (b.x < SEA_X ? 0 : 1) + (b.x < SEA_X ? Math.min(0, baseHeight(b.x, b.z)) : 0);
      const bands = (t) => [[t, t - 0.3], [t - 0.3, Math.min(t - 0.3, -1.2)], [Math.min(t - 0.3, -1.2), BOT]];
      const A = bands(ta), B = bands(tb);
      for (let j = 0; j < 3; j++) {
        const col = j === 0 && ta < 0.3 && a.x < -1 ? C.sand : bandCol[j];
        skirtPos.push(a.x, A[j][0], a.z, b.x, B[j][0], b.z, b.x, B[j][1], b.z, a.x, A[j][0], a.z, b.x, B[j][1], b.z, a.x, A[j][1], a.z);
        for (let q = 0; q < 6; q++) skirtCol.push(col.r, col.g, col.b);
      }
    }
  };
  edge((u) => new V3(-W / 2 + u * W, 0, D / 2), NX);
  edge((u) => new V3(W / 2 - u * W, 0, -D / 2), NX);
  edge((u) => new V3(W / 2, 0, D / 2 - u * D), NZ);
  edge((u) => new V3(-W / 2, 0, -D / 2 + u * D), NZ);
  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPos, 3));
  skirtGeo.setAttribute('color', new THREE.Float32BufferAttribute(skirtCol, 3));
  skirtGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(skirtGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide })));
  // Море.
  const seaW = SEA_X + W / 2;
  const seaGeo = new THREE.PlaneGeometry(seaW, D, 30, 40);
  seaGeo.rotateX(-Math.PI / 2);
  seaGeo.translate(-W / 2 + seaW / 2, 0, 0);
  scene.add(new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: 0x2f86cf, roughness: 0.25, transparent: true, opacity: 0.88, flatShading: true })));
  const seaSide = new THREE.Mesh(new THREE.PlaneGeometry(seaW, 0.9), new THREE.MeshStandardMaterial({ color: 0x2a78bd, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
  seaSide.position.set(-W / 2 + seaW / 2, -0.45, D / 2 + 0.01);
  scene.add(seaSide);
  // Река.
  const rTex = riverTexture();
  const rv = [], ruv = [], ridx = [];
  let acc = 0;
  for (let i = 0; i < RN; i++) {
    const p = rPts[i];
    const tng = (i < RN - 1 ? rPts[i + 1].clone().sub(p) : p.clone().sub(rPts[i - 1])).setY(0).normalize();
    const w = rWidth(i) * 1.15;
    if (i > 0) acc += p.distanceTo(rPts[i - 1]);
    const y = rSurf[i] + 0.02;
    rv.push(p.x - tng.z * w, y, p.z + tng.x * w, p.x + tng.z * w, y, p.z - tng.x * w);
    ruv.push(0, acc / 1.6, 1, acc / 1.6);
    if (i < RN - 1) { const a = i * 2; ridx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const riverGeo = new THREE.BufferGeometry();
  riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(rv, 3));
  riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
  riverGeo.setIndex(ridx);
  riverGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(riverGeo, new THREE.MeshStandardMaterial({ map: rTex, roughness: 0.3, side: THREE.DoubleSide })));
  // Слънце.
  const sunG = sunModel(0.95);
  sunG.position.set(-9.5, 8.2, -6.5);
  scene.add(sunG);
  // Облаци.
  function puffCloud(n, spread, r0, seed) {
    const rr = rng(seed);
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.96 });
    for (let k = 0; k < n; k++) {
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(r0 * (0.7 + rr() * 0.5) * (1 - (Math.abs(k - n / 2) / n) * 0.6), 2), m);
      p.position.set((k - (n - 1) / 2) * spread + (rr() - 0.5) * 0.3, rr() * 0.35, (rr() - 0.5) * 0.9);
      p.scale.y = 0.72;
      g.add(p);
    }
    g.userData.mat = m;
    return g;
  }
  const deco = [];
  for (let i = 0; i < 4; i++) {
    const c = puffCloud(4, 0.75, 0.6, 100 + i);
    c.position.set(-14 + i * 8, 8.5 + (i % 2) * 0.8, -9 - (i % 3));
    scene.add(c);
    deco.push(c);
  }
  const cloud = puffCloud(6, 0.62, 0.78, 7);
  scene.add(cloud);
  const CLOUD_SEA = new V3(-6.2, 4.6, 0.6);
  const CLOUD_MTN = new V3(5.8, 5.9, -3.2);
  cloud.position.copy(CLOUD_SEA);
  let fill = 0.3;
  const cWhite = new THREE.Color(0xffffff), cGrey = new THREE.Color(0x9aa5b1);
  // Дървета и лодка.
  const pineM = mat(0x2f7d3a, { flat: true }), trunkM = mat(0x7a5230), leafM = mat(0x58a83c, { flat: true });
  const nearRiver = (x, z) => { let m = Infinity; for (let k = 0; k < RN; k += 3) m = Math.min(m, Math.hypot(rPts[k].x - x, rPts[k].z - z)); return m; };
  const trees = [];
  for (let i = 0; i < 60; i++) {
    const x = -1.5 + R() * 13, z = -7.2 + R() * 14.4, h = baseHeight(x, z);
    if (h < 0.6 || h > 2.9 || nearRiver(x, z) < 0.9) continue;
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 5), trunkM);
    trunk.position.y = 0.17;
    const top = h > 1.4 || R() < 0.5 ? new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.95, 6), pineM) : new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), leafM);
    top.position.y = 0.7;
    t.add(trunk, top);
    t.scale.setScalar(0.5 + R() * 0.45);
    t.position.set(x, groundH(x, z) - 0.03, z);
    t.userData.ph = R() * 6;
    scene.add(t);
    trees.push(t);
  }
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.34), mat(0x8a4b2a));
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5), mat(0x5d4037));
  mast.position.y = 0.5;
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0.02, 0.18, 0, 0.02, 0.92, 0, 0.42, 0.2, 0], 3));
  sailGeo.computeVertexNormals();
  boat.add(hull, mast, new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })));
  scene.add(boat);

  // ---------- частици ----------
  const vapour = makePool(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }), 160);
  const rainP = makePool(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 4), new THREE.MeshBasicMaterial({ color: 0x5aa8f5 }), 260);
  const snowP = makePool(new THREE.IcosahedronGeometry(0.07, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, emissive: 0x9ab4cc, emissiveIntensity: 0.3 }), 260);
  const flowP = makePool(new THREE.SphereGeometry(0.075, 6, 4), new THREE.MeshBasicMaterial({ color: 0xd6f0ff }), 100);
  for (const p of [vapour, rainP, snowP, flowP]) scene.add(p.mesh);

  // ---------- капката: светеща, с очи ----------
  const drop = new THREE.Group();
  const dropM = new THREE.MeshStandardMaterial({ color: 0x7cc8ff, emissive: 0x2a8cff, emissiveIntensity: 0.7, roughness: 0.2, transparent: true, opacity: 0.95 });
  const dropBody = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), dropM);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.42, 20), dropM);
  cone.position.y = 0.33;
  dropBody.add(ball, cone);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0x14243a }));
    eye.position.set(s * 0.09, 0.05, 0.25);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(s * 0.09 + 0.015, 0.07, 0.29);
    dropBody.add(eye, shine);
  }
  const flake = new THREE.Group();
  const flakeM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9fd4ff, emissiveIntensity: 0.6 });
  for (let i = 0; i < 3; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 0.07), flakeM);
    bar.rotation.z = (i * Math.PI) / 3;
    flake.add(bar);
  }
  flake.visible = false;
  const dropGlow = glowSprite([[0, 'rgba(170,225,255,0.9)'], [0.4, 'rgba(90,170,255,0.35)'], [1, 'rgba(60,140,255,0)']], 1.7);
  drop.add(dropGlow, dropBody, flake);
  scene.add(drop);

  const SEA_P = new V3(-7.6, 0.28, 2.6);
  const AIR_P = new V3(-6.8, 3.0, 1.8);
  const PEAK = new V3(6.6, groundH(6.6, -4.0) + 0.25, -4.0);
  const RIVER0 = new V3(rPts[0].x, rSurf[0] + 0.25, rPts[0].z);
  const cloudFront = () => cloud.position.clone().add(new V3(0, -0.2, 1.0));
  function form(kind, k = 1) {
    dropBody.visible = kind !== 'flake';
    flake.visible = kind === 'flake';
    dropM.opacity = kind === 'vapour' ? 0.95 - 0.55 * k : 0.95;
  }
  const anchors = {};
  for (const [id, p, lift] of [['sea', [-7.6, 0.6, 2.6], 0.7], ['vapor', [-6.8, 3.6, 1.8], 0.2], ['river', [-0.5, -1.4, 8.1], 0]]) {
    const o = new THREE.Object3D(); o.position.set(...p); scene.add(o); anchors[id] = { anchor: o, lift };
  }
  anchors.cloud = { anchor: cloud, lift: 1.1 };
  anchors.snow = { anchor: cloud, lift: 1.1 };
  const VIEWS = {
    sea: [[-3.2, 4.2, 11], [-7, 1.0, 2]],
    vapor: [[-2.4, 4.8, 11], [-6.6, 2.4, 1.6]],
    cloud: [[-2.2, 6.4, 10.5], [-6, 4.0, 0.8]],
    snow: [[1.5, 9, 14], [1.5, 3.2, -1.5]],
    river: [[0, 11.5, 10.5], [0.5, 0.6, 0.3]],
    end: [[0, 11, 18], [0, 1.4, 0]],
  };

  // ---------- какво прави капката във всяка стъпка ----------
  let step = 0, st = 0, precip = 0, flow = 0, evap = 6;
  const tmp = new V3();
  const ANIM = [
    (s, t) => { form('drop'); drop.position.copy(SEA_P); drop.position.y += Math.sin(t * 2) * 0.06; drop.scale.setScalar(1); },
    (s, t) => {
      const e = ease(clamp01(s / 4));
      form('vapour', e);
      drop.position.lerpVectors(SEA_P, AIR_P, e);
      drop.position.x += Math.sin(s * 2.5) * 0.18 * (1 - e * 0.5);
      drop.position.y += e >= 1 ? Math.sin(t * 1.5) * 0.08 : 0;
      drop.scale.setScalar(1 - 0.3 * e);
    },
    (s, t) => {
      const e = ease(clamp01(s / 3));
      form('vapour', 1 - e);
      drop.position.lerpVectors(AIR_P, cloudFront(), e);
      drop.position.y += Math.sin(t * 1.3) * 0.05;
      drop.scale.setScalar(0.7 - 0.12 * e);
      fill = 0.3 + 0.6 * e;
    },
    (s, t) => {
      fill = 0.9;
      if (s < 4) {
        cloud.position.lerpVectors(CLOUD_SEA, CLOUD_MTN, ease(s / 4));
        form('drop');
        drop.position.copy(cloudFront());
        drop.scale.setScalar(0.58);
        precip = 0;
      } else {
        const e = clamp01((s - 4.5) / 3.5);
        precip = 1;
        form(s < 4.5 ? 'drop' : 'flake');
        drop.position.lerpVectors(cloudFront(), PEAK, e);
        drop.position.x += Math.sin(s * 2) * 0.25 * (1 - e);
        drop.scale.setScalar(0.58 + 0.12 * e);
        flake.rotation.z = t * (e < 1 ? 1.4 : 0.4);
      }
      void t;
    },
    (s, t) => {
      precip = 0; flow = 1; fill = Math.max(0.3, 0.9 - s * 0.06);
      cloud.position.lerpVectors(CLOUD_MTN, CLOUD_SEA, ease(clamp01(s / 12)));
      if (s < 1.5) {
        form(s < 0.75 ? 'flake' : 'drop');
        drop.position.copy(PEAK);
        drop.scale.setScalar(s < 0.75 ? 0.7 * (1 - s / 0.75) + 0.01 : 0.6 * ((s - 0.75) / 0.75) + 0.01);
      } else if (s < 3) {
        form('drop'); drop.scale.setScalar(0.62);
        drop.position.lerpVectors(PEAK, RIVER0, ease((s - 1.5) / 1.5));
      } else if (s < 11) {
        const u = ((s - 3) / 8) * (RN - 1), i0 = Math.floor(u), f = u - i0;
        const a = rPts[i0], b = rPts[Math.min(RN - 1, i0 + 1)];
        drop.position.set(a.x + (b.x - a.x) * f, rSurf[i0] + 0.25 + Math.abs(Math.sin(s * 5)) * 0.06, a.z + (b.z - a.z) * f);
      } else {
        const e = ease(clamp01((s - 11) / 1.6));
        drop.position.lerpVectors(tmp.set(rPts[RN - 1].x, rSurf[RN - 1] + 0.25, rPts[RN - 1].z), SEA_P, e);
        drop.position.y += e >= 1 ? Math.sin(t * 2) * 0.06 : 0;
        drop.scale.setScalar(0.62 + 0.38 * e);
      }
    },
  ];

  stage.tick((dt, t) => {
    st += dt;
    ANIM[step](st, t);
    drop.rotation.y = Math.atan2(camera.position.x - drop.position.x, camera.position.z - drop.position.z);
    dropGlow.material.opacity = 0.75 + Math.sin(t * 3) * 0.2;
    // вълни
    const sp = seaGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), z = sp.getZ(i);
      sp.setY(i, 0.05 * Math.sin(x * 1.3 + t * 1.6) + 0.035 * Math.sin(z * 1.9 - t * 1.2 + x * 0.4));
    }
    sp.needsUpdate = true;
    seaGeo.computeVertexNormals();
    rTex.offset.y -= dt * (0.35 + flow * 0.5);
    animSun(sunG, t, camera);
    for (const c of deco) { c.position.x += dt * 0.22; if (c.position.x > 16) c.position.x = -16; }
    const cs = 0.6 + 0.55 * fill;
    cloud.scale.set(cs * (1 + Math.sin(t * 0.8) * 0.02), cs, cs);
    cloud.userData.mat.color.copy(cWhite).lerp(cGrey, fill);
    boat.position.set(-9 + Math.sin(t * 0.08) * 1.6, Math.sin(t * 1.4) * 0.05, 4.6);
    boat.rotation.set(0, Math.cos(t * 0.08) > 0 ? 0 : Math.PI, Math.sin(t * 1.1) * 0.06);
    for (const tr of trees) tr.rotation.z = Math.sin(t * 1.2 + tr.userData.ph) * 0.03;
    // изпарение от морето
    evap = step <= 1 ? 7 : 2.5;
    for (let n = 0; n < 2 && R() < dt * evap * 0.5; n++) {
      const it = vapour.spawn();
      if (!it) break;
      it.p.set(-10.5 + R() * 7.2, 0.08, -4 + R() * 8);
      it.top = 2.4 + R() * 2.2;
      it.v.set((R() - 0.5) * 0.2, 0.9 + R() * 0.5, (R() - 0.5) * 0.2);
      it.ph = R() * 6;
    }
    for (const it of vapour.items) {
      if (!it.on) continue;
      it.life += dt;
      it.p.x += (it.v.x + Math.sin(t * 2 + it.ph) * 0.12) * dt;
      it.p.z += it.v.z * dt;
      it.p.y += it.v.y * dt;
      const left = it.top - it.p.y;
      it.s = Math.min(1, it.life * 3) * clamp01(left / 0.7);
      if (left <= 0) it.on = false;
    }
    vapour.write();
    // валеж: над високата планина пада сняг, по-ниско — дъжд
    if (precip) {
      for (let n = 0; n < 4; n++) {
        const x = cloud.position.x + (R() - 0.5) * 3.2, z = cloud.position.z + (R() - 0.5) * 1.6;
        const snowy = groundH(x, z) > 2.4;
        const it = (snowy ? snowP : rainP).spawn();
        if (!it) continue;
        it.p.set(x, cloud.position.y - 0.35, z);
        it.v.set(0, snowy ? -1.2 : -6.5, 0);
        it.ph = R() * 6; it.rot = R() * 3; it.s = 1;
      }
    }
    for (const it of rainP.items) {
      if (!it.on) continue;
      it.p.y += it.v.y * dt; it.rot = 0;
      if (it.p.y <= groundH(it.p.x, it.p.z)) it.on = false;
    }
    rainP.write();
    for (const it of snowP.items) {
      if (!it.on) continue;
      if (it.rest > 0) { it.rest -= dt; it.s = Math.min(1, it.rest); if (it.rest <= 0) it.on = false; continue; }
      it.p.y += it.v.y * dt;
      it.p.x += Math.sin(t * 2 + it.ph) * 0.4 * dt;
      it.rot += dt * 1.5;
      const gh = groundH(it.p.x, it.p.z);
      if (it.p.y <= gh + 0.04) { it.p.y = gh + 0.04; it.rest = 2.5; }
    }
    snowP.write();
    // вода, която тече по реката към морето
    if (flow && R() < dt * 10) {
      const it = flowP.spawn();
      if (it) { it.k = R() * 6; it.side = (R() - 0.5) * 0.25; it.sp = 14 + R() * 8; }
    }
    for (const it of flowP.items) {
      if (!it.on) continue;
      it.k += dt * it.sp;
      if (it.k >= RN - 1) {
        it.life += dt; it.p.x -= dt * 1.2; it.s = Math.max(0, 1 - it.life * 1.5);
        if (it.s <= 0) it.on = false;
        continue;
      }
      const i0 = Math.floor(it.k), f = it.k - i0;
      const a = rPts[i0], b = rPts[Math.min(RN - 1, i0 + 1)];
      it.p.set(a.x + (b.x - a.x) * f, rSurf[i0] + 0.08, a.z + (b.z - a.z) * f + it.side);
      it.s = 1;
    }
    flowP.write();
  });

  const ORDER = ['sea', 'vapor', 'cloud', 'snow', 'river'];
  return {
    stage,
    show(k, id) {
      const i = Math.max(0, ORDER.indexOf(id));
      step = i; st = 0; precip = 0; flow = 0;
      cloud.position.copy(i === 4 ? CLOUD_MTN : CLOUD_SEA);
      fill = i >= 3 ? 0.9 : 0.3;
      snowP.clear(); rainP.clear();
      view(stage, el, ...VIEWS[ORDER[i]]);
      // На тесен екран балончето за реката е отпред, иначе — над морето.
      anchors.river.anchor.position.set(...(narrowOf(el) ? [-0.5, -1.4, 8.1] : [-7, 0.4, 4.2]));
      return anchors[ORDER[i]];
    },
    end() { view(stage, el, ...VIEWS.end, 1.4); },
  };
}

// =====================================================================
// 4-2-a „Земята, Слънцето и Луната“ — тела от solar.js
// =====================================================================
const LAND = [
  [[-168, 66], [-140, 70], [-110, 72], [-85, 70], [-75, 62], [-60, 55], [-66, 45], [-75, 38], [-81, 31], [-80, 25], [-90, 29], [-97, 26], [-97, 20], [-87, 16], [-83, 9], [-79, 8], [-92, 15], [-105, 20], [-112, 30], [-118, 34], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60]],
  [[-50, 60], [-40, 65], [-22, 70], [-20, 80], [-40, 83], [-60, 80], [-72, 77], [-55, 70]],
  [[-80, 8], [-72, 12], [-60, 10], [-50, 0], [-35, -6], [-38, -15], [-41, -22], [-48, -26], [-58, -38], [-65, -42], [-68, -52], [-74, -52], [-72, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0]],
  [[-10, 36], [-9, 43], [-2, 44], [-4, 48], [2, 51], [8, 54], [8, 57], [5, 60], [10, 63], [15, 68], [25, 71], [40, 68], [45, 60], [40, 48], [30, 46], [28, 41], [23, 38], [20, 40], [15, 38], [12, 44], [8, 44], [3, 43], [-1, 37]],
  [[26, 40], [36, 36], [35, 30], [44, 12], [52, 15], [57, 23], [62, 25], [67, 24], [72, 20], [77, 8], [80, 15], [88, 22], [92, 22], [98, 16], [100, 13], [104, 10], [106, 20], [110, 21], [118, 24], [122, 30], [120, 38], [126, 40], [130, 43], [140, 50], [143, 60], [160, 62], [170, 66], [180, 68], [180, 72], [140, 74], [110, 77], [80, 73], [68, 70], [55, 68], [45, 66], [40, 64], [40, 48], [50, 45], [50, 38], [40, 40]],
  [[-17, 15], [-17, 21], [-10, 30], [-6, 35], [10, 37], [20, 32], [32, 31], [34, 28], [43, 12], [51, 12], [48, 4], [40, -5], [40, -15], [35, -24], [32, -29], [20, -35], [17, -30], [12, -16], [13, -6], [9, 4], [0, 5], [-8, 4], [-14, 10]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [140, -38], [132, -32], [117, -35], [114, -30]],
];
function earthTex() {
  return canvasTex(1024, 512, (ctx, w, h) => {
    const X = (lon) => ((lon + 180) / 360) * w, Y = (lat) => ((90 - lat) / 180) * h;
    ctx.fillStyle = '#1f6fc4';
    ctx.fillRect(0, 0, w, h);
    for (const poly of LAND) {
      ctx.beginPath();
      poly.forEach(([lo, la], i) => (i ? ctx.lineTo(X(lo), Y(la)) : ctx.moveTo(X(lo), Y(la))));
      ctx.closePath();
      ctx.fillStyle = '#4f9a45'; ctx.fill();
      ctx.strokeStyle = '#7bb663'; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.fillStyle = '#f2f7fb';
    ctx.fillRect(0, Y(-68), w, h - Y(-68));
    ctx.fillRect(0, 0, w, Y(82));
  });
}
function rockyTex(base, spot, seed, n = 70) {
  const r = rng(seed);
  return canvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = spot; ctx.globalAlpha = 0.15 + r() * 0.35;
      ctx.beginPath(); ctx.ellipse(r() * w, h * 0.1 + r() * h * 0.8, 2 + r() * 9, 2 + r() * 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function buildSolar(el) {
  const stage = createStage(el, {
    background: 0x050816, camPos: [0, 14, 22], target: [0, 0, 0], minDistance: 1.4, maxDistance: 60, maxPolarAngle: Math.PI * 0.8,
  });
  const { scene, camera } = stage;
  stage.sun.intensity = 0;
  stage.hemi.intensity = 0.16;
  stage.hemi.color.set(0x8899cc);
  stage.hemi.groundColor.set(0x223355);
  scene.add(new THREE.PointLight(0xfff3dd, 3.0, 0, 0));
  const R = rng(9);
  // звезди
  const sPos = [];
  for (let i = 0; i < 1200; i++) {
    const u = R() * 2 - 1, a = R() * Math.PI * 2, rr = 70 + R() * 20, s = Math.sqrt(1 - u * u);
    sPos.push(Math.cos(a) * s * rr, u * rr, Math.sin(a) * s * rr);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.4, color: 0xdfe8ff, depthWrite: false }));
  stars.raycast = () => {};
  scene.add(stars);
  // Слънце
  const sunTex = canvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffb21e'; ctx.fillRect(0, 0, w, h);
    const r2 = rng(21);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = r2() < 0.5 ? 'rgba(255,235,140,0.3)' : 'rgba(235,120,20,0.22)';
      ctx.beginPath(); ctx.arc(r2() * w, r2() * h, 0.8 + r2() * 2.2, 0, Math.PI * 2); ctx.fill();
    }
  });
  const sunG = new THREE.Group();
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(2.0, 40, 24), new THREE.MeshBasicMaterial({ map: sunTex }));
  const glowA = glowSprite([[0, 'rgba(255,240,180,0.95)'], [0.3, 'rgba(255,190,60,0.55)'], [1, 'rgba(255,120,0,0)']], 9);
  const glowB = glowSprite([[0, 'rgba(255,220,140,0.5)'], [0.5, 'rgba(255,150,40,0.15)'], [1, 'rgba(255,100,0,0)']], 15);
  sunG.add(glowB, glowA, sunBall);
  scene.add(sunG);
  // етикети с постоянен размер на екрана (от solar.js)
  const fixed = new Set();
  function addLabel(parent, text, y, px = 17) {
    const s = labelSprite(text, { size: 0.36, color: '#ffffff', bg: 'rgba(16,28,60,0.85)', border: '#6b7fb0' });
    s.position.y = y;
    s.userData.aspect = s.scale.x / s.scale.y;
    s.userData.px = px;
    parent.add(s);
    fixed.add(s);
    return s;
  }
  addLabel(sunG, 'Слънце', -2.75, 19);
  // Земя
  const ER = 8, ERAD = 0.6;
  const earthG = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = -THREE.MathUtils.degToRad(23.4);
  const spin = new THREE.Group();
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(ERAD, 48, 32), new THREE.MeshStandardMaterial({ map: earthTex(), roughness: 0.85 })));
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, ERAD * 3, 6), new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0.8 }));
  tilt.add(spin, axis);
  earthG.add(tilt);
  addLabel(earthG, 'Земя', ERAD + 0.4);
  scene.add(earthG);
  // Луна
  const MD = 1.7;
  const moonPivot = new THREE.Group();
  earthG.add(moonPivot);
  const moonG = new THREE.Group();
  moonG.position.set(MD, 0, 0);
  moonG.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 16), new THREE.MeshStandardMaterial({ map: rockyTex('#b9b9b5', '#6d6d6a', 41, 80), roughness: 1 })));
  moonPivot.add(moonG);
  addLabel(moonG, 'Луна', 0.34, 15);
  const circlePts = (r, n) => Array.from({ length: n }, (_, i) => new V3(Math.cos((i / n) * Math.PI * 2) * r, 0, -Math.sin((i / n) * Math.PI * 2) * r));
  const moonOrbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circlePts(MD, 80)), new THREE.LineBasicMaterial({ color: 0x8892aa, transparent: true, opacity: 0.4 }));
  earthG.add(moonOrbit);
  // Орбитата на Земята се рисува, докато Земята се движи.
  const TN = 240;
  const trailPos = new Float32Array(TN * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x9fb6ff, transparent: true, opacity: 0.85 }));
  trail.frustumCulled = false;
  scene.add(trail);
  const faint = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circlePts(ER, 160)), new THREE.LineBasicMaterial({ color: 0x5b6f9c, transparent: true, opacity: 0.25 }));
  scene.add(faint);
  // Лъчи: от Слънцето към Луната и отразени към Земята.
  const rayLine = (op) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]), new THREE.LineBasicMaterial({ color: 0xffd54a, transparent: true, opacity: op }));
    l.frustumCulled = false; l.visible = false; scene.add(l); return l;
  };
  const ray1 = rayLine(0.7), ray2 = rayLine(0.45);
  const ANCH = {};
  for (const id of ['day', 'night', 'orbit', 'moonTop']) { ANCH[id] = new THREE.Object3D(); scene.add(ANCH[id]); }
  ANCH.orbit.position.set(0, 0, -ER);

  let ang = 0.6, speed = 0.05, moonA = 0, trailOn = false, trailStart = 0, yearTag = null, tags = [];
  const lblTmp = new V3(), toSun = new V3(), mp = new V3();
  stage.tick((dt, t) => {
    ang += dt * speed;
    earthG.position.set(Math.cos(ang) * ER, 0, -Math.sin(ang) * ER);
    spin.rotation.y += dt * 0.7;
    moonA += dt * 0.35;
    moonPivot.rotation.y = moonA;
    sunBall.rotation.y = t * 0.03;
    const pul = 1 + Math.sin(t * 1.7) * 0.03;
    glowA.scale.set(9 * pul, 9 * pul, 1);
    glowB.scale.set(15 / pul, 15 / pul, 1);
    stars.rotation.y = t * 0.004;
    if (trailOn) {
      const done = Math.min(1, (ang - trailStart) / (Math.PI * 2));
      const n = Math.max(2, Math.ceil(done * (TN - 1)) + 1);
      for (let i = 0; i < n; i++) {
        const a = trailStart + (Math.min(i / (TN - 1), done)) * Math.PI * 2;
        trailPos[i * 3] = Math.cos(a) * ER; trailPos[i * 3 + 1] = 0; trailPos[i * 3 + 2] = -Math.sin(a) * ER;
      }
      trailGeo.attributes.position.needsUpdate = true;
      trailGeo.setDrawRange(0, n);
      if (done >= 1 && !yearTag) yearTag = stage.bubble(earthG, '1 обиколка = 1 година', { lift: ERAD + 0.9, cls: 'tag' });
    }
    toSun.copy(earthG.position).negate().normalize();
    ANCH.day.position.copy(earthG.position).addScaledVector(toSun, ERAD + 0.05);
    ANCH.night.position.copy(earthG.position).addScaledVector(toSun, -(ERAD + 0.05));
    ANCH.moonTop.position.copy(earthG.position).y += 0.9;
    if (ray1.visible) {
      moonG.getWorldPosition(mp);
      const p1 = ray1.geometry.attributes.position;
      const s0 = 2.1 / Math.max(0.01, mp.length());
      p1.setXYZ(0, mp.x * s0, mp.y * s0, mp.z * s0); p1.setXYZ(1, mp.x, mp.y, mp.z); p1.needsUpdate = true;
      const p2 = ray2.geometry.attributes.position;
      p2.setXYZ(0, mp.x, mp.y, mp.z); p2.setXYZ(1, earthG.position.x, 0, earthG.position.z); p2.needsUpdate = true;
    }
    const H = el.clientHeight || 520;
    const kk = (2 * Math.tan((camera.fov * Math.PI) / 360)) / H;
    for (const s of fixed) {
      s.getWorldPosition(lblTmp);
      const h = camera.position.distanceTo(lblTmp) * kk * s.userData.px;
      s.scale.set(h * s.userData.aspect, h, 1);
    }
  });
  const clearTags = () => { while (tags.length) tags.pop().remove(); if (yearTag) { yearTag.remove(); yearTag = null; } };
  // Изглед отстрани на Земята, за да се виждат и денят, и нощта.
  function earthView(dist, up, k = 1) {
    const E = earthG.position.clone();
    const u = E.clone().negate().normalize();
    const side = new V3(-u.z, 0, u.x);
    const pos = E.clone().addScaledVector(side, dist * 0.85).addScaledVector(u, -dist * 0.35 * k).add(new V3(0, up, 0));
    view(stage, el, pos.toArray(), E.toArray(), 1.2);
  }
  return {
    stage,
    show(k, id) {
      clearTags();
      ray1.visible = ray2.visible = false;
      trailOn = id === 'orbit' || (trailOn && id === 'moon');
      faint.visible = id !== 'orbit';
      if (id === 'sun') { speed = 0.05; view(stage, el, [0, 3.2, 9.5], [0, 0, 0]); return { anchor: sunG, lift: 2.5 }; }
      if (id === 'earth') {
        speed = 0;
        earthView(5.2, 1.1);
        tags.push(stage.bubble(ANCH.day, 'Ден', { lift: 0.15, cls: 'tag' }), stage.bubble(ANCH.night, 'Нощ', { lift: 0.15, cls: 'tag' }));
        return { anchor: earthG, lift: ERAD + 0.75 };
      }
      if (id === 'orbit') {
        speed = 0.45; trailStart = ang; trailGeo.setDrawRange(0, 0);
        view(stage, el, [0, 15, 14], [0, -1, 0], 1.45);
        return { anchor: ANCH.orbit, lift: 0.4 };
      }
      speed = 0;
      ray1.visible = ray2.visible = true;
      earthView(4.6, 2.6, -0.6);
      return { anchor: ANCH.moonTop, lift: 0.5 };
    },
    end() { clearTags(); ray1.visible = ray2.visible = false; speed = 0.12; view(stage, el, [0, 15, 17], [0, 0, 0], 1.45); },
  };
}

// =====================================================================
// 4-3-a „Как растението прави храна“ — растението и потоците от plants.js
// =====================================================================
function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.14, 0.08, 0.2, 0.32, 0, 0.55);
  s.bezierCurveTo(-0.2, 0.32, -0.14, 0.08, 0, 0);
  return new THREE.ShapeGeometry(s, 8);
}
function tube(points, r, m, n = 16) {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new V3(...p))), n, r, 7, false), m);
}

function buildPlant(el) {
  const stage = createStage(el, {
    background: 0xbfe3ff, camPos: [0, 3, 9], target: [0, 1.4, 0], maxDistance: 16, minDistance: 1.2, maxPolarAngle: Math.PI * 0.5,
    fog: { color: 0xbfe3ff, near: 18, far: 40 },
  });
  const { scene, camera } = stage;
  stage.sun.position.set(4, 8, 3);
  // мек кръгъл спрайт за облаци
  const puffTex = glowTex([[0, 'rgba(255,255,255,0.95)'], [1, 'rgba(255,255,255,0)']]);
  const puff = (size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0.9, depthWrite: false })); s.scale.setScalar(size); return s; };
  // поляна и хълмове
  const grass = new THREE.Mesh(new THREE.CircleGeometry(30, 40), mat(0x8bc34a));
  grass.rotation.x = -Math.PI / 2;
  scene.add(grass);
  for (const [x, z, r, c] of [[-8, -14, 6, 0x7cb342], [5, -17, 8, 0x689f38], [14, -11, 5, 0x9ccc65]]) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), mat(c, { flat: true }));
    h.position.set(x, -r * 0.72, z);
    scene.add(h);
  }
  const clouds = [];
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4; j++) { const p = puff(1.6 + j * 0.15); p.position.set(j * 0.8 - 1.2, (j % 2) * 0.3, 0); c.add(p); }
    c.position.set(-10 + i * 8, 5.5 + i * 0.6, -12);
    scene.add(c);
    clouds.push(c);
  }
  const sunG = sunModel(0.6, 10);
  sunG.position.set(2.7, 3.9, -2.2);
  scene.add(sunG);
  // стъклена саксия с почва и корени (от plants.js)
  const glass = new THREE.MeshStandardMaterial({ color: 0xe6f4ff, transparent: true, opacity: 0.24, roughness: 0.08, depthWrite: false, side: THREE.DoubleSide });
  const pot = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.001), new THREE.Vector2(0.4, 0.001), new THREE.Vector2(0.5, 0.85)], 28), glass);
  pot.renderOrder = 3;
  const soilBody = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.4, 0.74, 24), new THREE.MeshStandardMaterial({ color: 0x5d4030, transparent: true, opacity: 0.5, depthWrite: false, roughness: 1 }));
  soilBody.position.y = 0.38; soilBody.renderOrder = 2;
  const soilTop = new THREE.Mesh(new THREE.CircleGeometry(0.47, 24), mat(0x3e2a1a));
  soilTop.rotation.x = -Math.PI / 2; soilTop.position.y = 0.75;
  scene.add(pot, soilBody, soilTop);
  const plant = new THREE.Group();
  scene.add(plant);
  const stemX = (y) => 0.04 * Math.sin((y - 0.75) * 2);
  const stemPt = (y) => new V3(stemX(y), y, 0);
  const stemMat = mat(0x5a9e3a, { emissive: 0x000000 });
  const stemPts = []; for (let y = 0.74; y <= 2.66; y += 0.24) stemPts.push([stemX(y), y, 0]);
  plant.add(tube(stemPts, 0.045, stemMat, 24));
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0x7cb342));
  bud.scale.set(0.8, 1.3, 0.8); bud.position.set(stemX(2.7), 2.72, 0);
  plant.add(bud);
  const rootM = mat(0xeedfbf, { emissive: 0x000000 });
  const ROOTS = [
    [[0, 0.76, 0], [0, 0.55, 0.02], [0.02, 0.3, 0.04], [0, 0.1, 0.02]],
    [[0, 0.64, 0], [0.15, 0.52, 0.1], [0.3, 0.3, 0.16]],
    [[0, 0.6, 0], [-0.16, 0.48, 0.08], [-0.31, 0.28, 0.14]],
    [[0, 0.45, 0.02], [0.14, 0.3, -0.06], [0.24, 0.12, -0.08]],
    [[0, 0.42, 0.02], [-0.13, 0.28, 0], [-0.24, 0.1, 0.08]],
  ];
  for (const r of ROOTS) plant.add(tube(r, 0.017, rootM, 10));
  const rootTips = ROOTS.map((r) => new V3(...r[r.length - 1]));
  const LEAVES = [{ y: 1.05, s: -1 }, { y: 1.3, s: 1 }, { y: 1.55, s: -1 }, { y: 1.8, s: 1 }, { y: 2.05, s: -1 }, { y: 2.3, s: 1 }];
  const leafMat = mat(0x3f9b3f, { side: THREE.DoubleSide, emissive: 0x000000 });
  const leafGeo = leafGeometry();
  const leafMid = [];
  for (const L of LEAVES) {
    const l = new THREE.Mesh(leafGeo, leafMat);
    l.position.copy(stemPt(L.y));
    l.rotation.set(-0.5, 0, -L.s * 1.05);
    l.scale.setScalar(L.y > 2.2 ? 0.85 : 1.05);
    plant.add(l);
    l.updateMatrixWorld(true);
    leafMid.push(l.localToWorld(new V3(0, 0.27, 0)));
  }
  // въздух с въглероден диоксид: малки молекули (въглерод + 2 кислорода)
  const AIR = new V3(1.55, 2.25, 0.45);
  const airG = new THREE.Group();
  airG.position.copy(AIR);
  const cM = mat(0x546e7a), oM = mat(0xb0bec5);
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Group();
    m.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), cM));
    for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), oM); o.position.x = s * 0.07; m.add(o); }
    m.position.set(Math.cos(i * 1.3) * 0.28, Math.sin(i * 2.1) * 0.2, Math.sin(i * 1.3) * 0.2);
    m.userData.ph = i;
    airG.add(m);
  }
  scene.add(airG);
  const lbl = (text, pos) => { const s = labelSprite(text, { size: 0.14 }); s.position.copy(pos); stage.steadyLabel(s, 5); scene.add(s); return s; };
  const lblCO2 = lbl('въглероден диоксид', AIR.clone().add(new V3(0, 0.38, 0)));
  const lblWater = lbl('вода', new V3(0.55, 0.3, 0.3));
  const lblO2 = lbl('кислород', new V3(-1.15, 3.05, 0.5));
  const lblFood = lbl('хранителни вещества', new V3(0.75, 1.15, 0.3));
  // потоци от частици (от plants.js)
  const streams = [];
  function makeStream(color, n, size, speed, curves, opts = {}) {
    const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, transparent: true, opacity: 0.95, depthWrite: false });
    const geo = opts.cube ? new THREE.BoxGeometry(size * 1.6, size * 1.6, size * 1.6) : new THREE.SphereGeometry(size, 8, 6);
    const parts = [];
    for (let i = 0; i < n; i++) {
      const p = new THREE.Mesh(geo, m);
      p.visible = false; p.renderOrder = 4;
      p.userData = { u: -Math.random(), c: i % curves.length };
      scene.add(p);
      parts.push(p);
    }
    const S = { parts, curves, speed, on: false, fade: !!opts.fade };
    streams.push(S);
    return S;
  }
  const curve = (pts) => new THREE.CatmullRomCurve3(pts);
  const sWater = makeStream(0x2f8fdc, 26, 0.035, 0.3, leafMid.map((m, i) => curve([rootTips[i % rootTips.length].clone(), new V3(0, 0.5, 0.03), stemPt(0.8), stemPt(LEAVES[i].y - 0.05), stemPt(LEAVES[i].y), m.clone()])));
  const sCO2 = makeStream(0x78909c, 16, 0.04, 0.35, leafMid.map((m, i) => curve([AIR.clone().add(new V3(0, (i % 3) * 0.15 - 0.15, 0)), AIR.clone().lerp(m, 0.5).add(new V3(0, 0.15, 0.25)), m.clone()])));
  const sLight = makeStream(0xffd54f, 16, 0.035, 0.7, leafMid.map((m, i) => curve([sunG.position.clone().add(new V3(-0.5 + (i % 3) * 0.3, -0.4, 0.5)), m.clone()])));
  const sFood = makeStream(0xff9800, 14, 0.028, 0.3, leafMid.map((m, i) => curve([m.clone(), stemPt(LEAVES[i].y), stemPt(0.9), new V3(0, 0.6, 0.02), rootTips[i % rootTips.length].clone()])), { cube: true });
  const sO2 = makeStream(0x6fd6f2, 16, 0.04, 0.35, leafMid.map((m, i) => curve([m.clone(), m.clone().add(new V3(LEAVES[i].s * 0.5, 0.5, 0.35)), m.clone().add(new V3(LEAVES[i].s * 1.0, 1.1, 0.5))])), { fade: true });
  const setStream = (S, on) => { if (on && !S.on) S.parts.forEach((p) => { p.userData.u = -Math.random(); }); S.on = on; };
  let glowK = 0, glowWant = 0, focus = '';
  const cGlow = new THREE.Color(0x2e7d32), cRoot = new THREE.Color(0x3b6fb0);
  stage.tick((dt, t) => {
    for (const c of clouds) { c.position.x += dt * 0.25; if (c.position.x > 14) c.position.x = -14; }
    animSun(sunG, t, camera);
    plant.rotation.z = Math.sin(t * 0.9) * 0.01;
    airG.children.forEach((m) => { m.position.y = Math.sin(t * 0.8 + m.userData.ph * 2.1) * 0.2; m.rotation.y = t * 0.7 + m.userData.ph; });
    glowK += (glowWant - glowK) * Math.min(1, dt * 2);
    leafMat.emissive.copy(cGlow).multiplyScalar(glowK * (0.6 + Math.sin(t * 3) * 0.25));
    rootM.emissive.copy(cRoot).multiplyScalar(focus === 'root' ? 0.35 + Math.sin(t * 3) * 0.2 : 0);
    stemMat.emissive.copy(cRoot).multiplyScalar(focus === 'stem' ? 0.25 + Math.sin(t * 3) * 0.15 : 0);
    for (const S of streams) {
      for (const p of S.parts) {
        const ud = p.userData;
        ud.u += dt * S.speed;
        if (ud.u < 0) { p.visible = false; if (!S.on) ud.u = -1; else if (ud.u >= 0) ud.c = Math.floor(Math.random() * S.curves.length); continue; }
        if (ud.u > 1) { ud.u = S.on ? -Math.random() * 0.5 : -1; p.visible = false; continue; }
        p.visible = true;
        S.curves[ud.c].getPoint(ud.u, p.position);
        if (S.fade) p.scale.setScalar(1 - ud.u * 0.6);
      }
    }
  });
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.25) {
    if (narrowOf(el)) hw *= 0.8;
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.1;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, 1.3);
  }
  const ORDER = ['root', 'stem', 'air', 'sun', 'leaf'];
  const anchorAt = (p) => { const o = new THREE.Object3D(); o.position.copy(p); scene.add(o); return o; };
  const A = {
    root: { anchor: anchorAt(new V3(0, 0.95, 0.3)), lift: 0.05, v: () => fitView([0.1, 0.8, 0.2], 1.1, 0.95) },
    stem: { anchor: anchorAt(stemPt(2.75)), lift: 0.1, v: () => fitView([0.1, 1.75, 0.1], 1.2, 1.45) },
    air: { anchor: airG, lift: 0.6, v: () => fitView([0.7, 2.2, 0.2], 1.5, 1.05) },
    sun: { anchor: anchorAt(sunG.position.clone().add(new V3(-2.3, -0.2, 0.8))), lift: 0, v: () => fitView([1.0, 2.6, -0.8], 2.4, 2.0, 0.3) },
    leaf: { anchor: anchorAt(new V3(0, 3.0, 0.2)), lift: 0.1, v: () => fitView([0, 2.0, 0.1], 1.6, 1.35) },
  };
  return {
    stage,
    show(k, id) {
      const i = Math.max(0, ORDER.indexOf(id));
      focus = ORDER[i];
      setStream(sWater, true);
      setStream(sCO2, i >= 2);
      setStream(sLight, i >= 3);
      setStream(sFood, i >= 3);
      setStream(sO2, i >= 4);
      glowWant = i >= 3 ? 1 : 0;
      lblWater.visible = i <= 1;
      lblCO2.visible = i >= 2;
      lblFood.visible = i === 3;
      lblO2.visible = i >= 4;
      A[focus].v();
      return A[focus];
    },
    end() { focus = ''; fitView([0.6, 1.9, 0], 2.6, 1.6); },
  };
}

// =====================================================================
// Общо: стъпки, балонче, бутони, край
// =====================================================================
const BUILDERS = { '4-1-a': buildWater, '4-2-a': buildSolar, '4-3-a': buildPlant };

export function mount(container, { article, onComplete }) {
  injectCss();
  const steps = article.steps || [];
  const objs = (article.scene && article.scene.objects) || [];
  const labelOf = (id) => (objs.find((o) => o.id === id) || {}).label || '';
  const focusIds = steps.map((s) => s.focus);
  const build = BUILDERS[article.id]
    || (focusIds.includes('moon') ? buildSolar : focusIds.includes('leaf') ? buildPlant : buildWater);
  const shell = createShell(container, { steps: steps.map((s) => labelOf(s.focus) || 'Стъпка') });
  container.querySelector('.xp').classList.add('st4');
  const S = build(shell.stageEl);
  const { stage } = S;
  const taskEl = container.querySelector('.xp-task');
  let k = 0;
  let bub = null;

  function draw() {
    const s = steps[k];
    shell.step(k);
    shell.score('');
    // Подсказката не се чете на глас: текстът на стъпката е в балончето.
    taskEl.innerHTML = '<p class="small st4-hint">Прочети текста до обекта в сцената. Можеш да въртиш и приближаваш сцената.</p>';
    if (bub) { bub.remove(); bub = null; }
    const a = S.show(k, s.focus);
    const label = labelOf(s.focus);
    bub = stage.bubble(a.anchor, `${label ? `<b>${esc(label)}</b><br>` : ''}${esc(s.text)}`, { lift: a.lift, cls: 'wide' });
    const last = k === steps.length - 1;
    const c = shell.setControls(`<div class="st4-row">
      <button class="btn prev" ${k === 0 ? 'disabled' : ''}>← Назад</button>
      <span class="st4-count">${k + 1} / ${steps.length}</span>
      <button class="btn primary next">${last ? 'Готово ✔' : 'Напред →'}</button></div>`);
    c.querySelector('.prev').addEventListener('click', () => { if (k > 0) { k--; draw(); } });
    c.querySelector('.next').addEventListener('click', () => { if (k < steps.length - 1) { k++; draw(); } else finish(); });
  }

  function finish() {
    if (bub) { bub.remove(); bub = null; }
    const r = onComplete ? onComplete() : null;
    container.querySelectorAll('.xp-steps i').forEach((el) => { el.className = 'done'; });
    container.querySelector('.xp-title').textContent = 'Прочете статията!';
    shell.task(`<p>Браво! Ти прочете статията „${esc(article.title)}“.</p>`);
    const c = shell.setControls(`<div class="row st4-end">
      <button class="btn again">Прочети отначало</button>
      ${r && r.back ? `<a class="btn primary" href="${esc(r.back)}">Към курса →</a>` : ''}</div>`);
    c.querySelector('.again').addEventListener('click', () => { k = 0; draw(); });
    S.end();
  }

  if (steps.length) draw();
  return {
    dispose() {
      if (bub) bub.remove();
      stage.dispose();
    },
  };
}
