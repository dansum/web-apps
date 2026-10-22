// 4.1.4 „Кръговрат на водата“ — 3D макет: море, плаж, хълмове, снежна планина, река, езеро и подземни води.
// Стъпки: опознай → пусни кръговрата → подреди етапите → видове валежи (дъжд, сняг, град).
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

// ---------- стилове (само за този модул) ----------
const CSS = `
.wc-steps { margin: 6px 0 0; padding-left: 1.3em; }
.wc-steps li { margin: 2px 0; }
.wc-steps li.done { color: #0d7a3a; }
.wc-steps li.done::marker { content: "✓ "; font-weight: 900; }
.wc-steps li.now { font-weight: 800; }
.wc-meter { height: 12px; border-radius: 99px; background: #e2e6ee; overflow: hidden; margin-top: 4px; }
.wc-meter i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #8fc6ff, #1865f2); transition: width 0.25s; }
.wc-meter.full i { background: linear-gradient(90deg, #6c7a89, #3d4a58); }
.wc-lbl { display: block; font-weight: 700; margin-top: 6px; }
.wc-lbl output { float: right; font-weight: 900; color: #1865f2; }
.wc-ctrl .btn.on { background: #3d4a58; color: #fff; border-color: #3d4a58; }
.xp-task .choices.wc-pick { grid-template-columns: repeat(3, 1fr); margin-top: 6px; }
.xp-task .choices.wc-pick .choice { justify-content: center; flex-direction: column; gap: 2px; padding: 8px 4px; font-weight: 700; }
.xp-task .choices.wc-pick .choice span { font-size: 1.5rem; }
.bubble.wc-temp { font-weight: 900; font-size: 0.95rem; padding: 4px 9px; }
`;
function injectCss() {
  if (document.getElementById('wc-style')) return;
  const s = document.createElement('style');
  s.id = 'wc-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ---------- обекти за опознаване ----------
const PLACES = [
  { id: 'sun', label: 'Слънце', icon: '☀️',
    note: 'Слънцето нагрява водата в моретата, реките и езерата. Без неговата топлина кръговратът на водата ще спре.' },
  { id: 'sea', label: 'Море', icon: '🌊',
    note: 'Най-много вода на Земята има в моретата и океаните. Тя е солена. Когато водата се изпарява, солта остава в морето.' },
  { id: 'vapour', label: 'Водни пари', icon: '💨',
    note: 'Водните пари са вода в газообразно състояние. Те са невидими — тук ги показваме с бели точици. Издигат се нагоре с топлия въздух.' },
  { id: 'cloud', label: 'Облак', icon: '☁️',
    note: 'Облакът е от много малки водни капчици или ледени кристалчета. Те се получават, когато водните пари се издигнат високо, охладят се и се втечнят.' },
  { id: 'mountain', label: 'Планина', icon: '🏔️',
    note: 'Високо в планината е по-студено. Там често вали сняг. През пролетта снегът се топи и водата тече към реките.' },
  { id: 'river', label: 'Река', icon: '🏞️',
    note: 'Реката събира водата от дъждовете и от разтопения сняг и я носи обратно към морето.' },
  { id: 'lake', label: 'Езеро', icon: '💧',
    note: 'Езерото е сладка вода, събрана в падина в земята. От повърхността му също се изпарява вода.' },
  { id: 'ground', label: 'Подземни води', icon: '⛲',
    note: 'Част от валежите попиват в почвата и се събират под земята. Подземните води бавно текат към реките, езерата и морето. От тях идват изворите и кладенците.' },
];
const placeById = Object.fromEntries(PLACES.map((p) => [p.id, p]));

// Етапи на кръговрата за стъпка 3 (в правилен ред).
const STAGES = [
  { id: 'evap', label: 'Изпарение', why: 'Слънцето нагрява водата в морето и тя става на водни пари.' },
  { id: 'cond', label: 'Облак от капчици', why: 'Горе е студено и водните пари се втечняват в малки капчици.' },
  { id: 'precip', label: 'Валеж', why: 'Капчиците се събират, стават тежки и падат като валеж.' },
  { id: 'runoff', label: 'Реки и подземни води', why: 'Водата се стича в реките и попива в земята, а после стига до морето.' },
];

const KINDS = {
  rain: { label: 'Дъжд', icon: '🌧️' },
  snow: { label: 'Сняг', icon: '❄️' },
  hail: { label: 'Град', icon: '🧊' },
};

// ---------- релеф ----------
const W = 24, D = 16, NX = 96, NZ = 64;
const SEA_X = -2.5; // морето е вляво от тази линия
const LAKE = { x: 5.6, z: 3.6, r: 1.45 };
const g2 = (x, z, cx, cz, s) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function baseHeight(x, z) {
  const t = smooth(-6.5, -2.0, x);
  const land = 0.55 + 0.07 * (x + 2) + 0.08 * Math.sin(z * 0.5 + x * 0.3);
  let h = -0.9 * (1 - t) + land * t;
  h += 3.6 * g2(x, z, 6.6, -4.0, 1.9) + 2.4 * g2(x, z, 9.4, -2.2, 1.4) + 1.8 * g2(x, z, 3.8, -5.6, 1.5);
  h += 0.8 * g2(x, z, -0.5, -5.6, 1.7) + 0.6 * g2(x, z, 9.6, 4.6, 1.7) + 0.35 * g2(x, z, 1.0, 5.8, 1.4);
  h += 0.05 * Math.sin(x * 1.7) * Math.cos(z * 1.3) * t;
  return h;
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

function glowTexture(inner = 'rgba(255,240,170,1)', outer = 'rgba(255,200,60,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.35, 'rgba(255,220,110,0.55)');
  gr.addColorStop(1, outer);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function riverTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3f8fd6';
  ctx.fillRect(0, 0, 64, 256);
  const r = rng(7);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.3})`;
    const x = 6 + r() * 52;
    const y = r() * 256;
    ctx.fillRect(x, y, 2 + r() * 3, 10 + r() * 24);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Пул от еднакви частици (капки, снежинки, пари) с InstancedMesh.
function makePool(geo, material, n) {
  const mesh = new THREE.InstancedMesh(geo, material, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const items = [];
  for (let i = 0; i < n; i++) items.push({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, s: 1, k: 0, rot: 0 });
  const dummy = new THREE.Object3D();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < n; i++) mesh.setMatrixAt(i, zero);
  return {
    mesh, items,
    spawn() { for (const it of items) if (!it.on) { it.on = true; it.life = 0; it.k = 0; it.rest = 0; return it; } return null; },
    clear() { for (const it of items) it.on = false; },
    active() { let n2 = 0; for (const it of items) if (it.on) n2++; return n2; },
    write() {
      items.forEach((it, i) => {
        if (!it.on) { mesh.setMatrixAt(i, zero); return; }
        dummy.position.copy(it.p);
        dummy.rotation.set(it.rot, it.rot * 0.7, 0);
        dummy.scale.setScalar(it.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// Извита стрелка между две точки (рисува се постепенно).
function arrowBetween(a, b, color = 0xff8f00, arc = 1.4) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y += arc;
  const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
  const geo = new THREE.TubeGeometry(curve, 40, 0.08, 8, false);
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4, roughness: 0.4 });
  const tube = new THREE.Mesh(geo, m);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 12), m);
  head.position.copy(curve.getPoint(0.93));
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(0.93).normalize());
  head.visible = false;
  const g = new THREE.Group();
  g.add(tube, head);
  const total = geo.index.count;
  geo.setDrawRange(0, 0);
  g.userData.grow = { k: 0, total, head, geo };
  g.userData.curve = curve;
  return g;
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  injectCss();
  const STEPS = ['Опознай природата', 'Пусни кръговрата', 'Подреди етапите', 'Дъжд, сняг или град?'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xbfe3ff, camPos: [0, 11, 20], target: [0, 1.4, 0],
    fog: { color: 0xbfe3ff, near: 34, far: 70 }, minDistance: 4, maxDistance: 40, maxPolarAngle: Math.PI * 0.46,
  });
  const { scene } = stage;
  stage.onHover(() => {});
  stage.sun.position.set(-9, 12, 4);
  stage.sun.intensity = 1.7;
  stage.hemi.intensity = 1.0;
  const R = rng(42);

  // ---------- терен ----------
  const groundGeo = new THREE.PlaneGeometry(W, D, NX, NZ);
  groundGeo.rotateX(-Math.PI / 2);
  const gp = groundGeo.attributes.position;
  const heights = new Float32Array(gp.count);
  for (let i = 0; i < gp.count; i++) heights[i] = baseHeight(gp.getX(i), gp.getZ(i));

  // Реката: от снежния склон, през полето, до морето.
  const riverCurve = new THREE.CatmullRomCurve3([
    [5.5, 0, -2.5], [4.5, 0, -1.2], [3.1, 0, -0.3], [1.6, 0, 0.5], [0, 0, 1.0], [-1.6, 0, 1.7], [-3.2, 0, 2.1], [-5.4, 0, 2.3],
  ].map((p) => new THREE.Vector3(...p)));
  const RN = 140;
  const rPts = riverCurve.getSpacedPoints(RN - 1);
  const rSurf = [];
  let runMin = Infinity;
  for (const p of rPts) {
    runMin = Math.min(runMin, baseHeight(p.x, p.z));
    rSurf.push(Math.max(0.02, runMin - 0.1));
  }
  const rWidth = (i) => 0.22 + (i / RN) * 0.3;
  // Изкопаваме коритото на реката и падината на езерото.
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i);
    const z = gp.getZ(i);
    let h = heights[i];
    let best = Infinity; let bi = 0;
    for (let k = 0; k < RN; k += 2) {
      const d = (rPts[k].x - x) ** 2 + (rPts[k].z - z) ** 2;
      if (d < best) { best = d; bi = k; }
    }
    for (let k = Math.max(0, bi - 2); k <= Math.min(RN - 1, bi + 2); k++) {
      const d = (rPts[k].x - x) ** 2 + (rPts[k].z - z) ** 2;
      if (d < best) { best = d; bi = k; }
    }
    const d = Math.sqrt(best);
    const w = rWidth(bi);
    if (d < w * 2.4) {
      const bed = rSurf[bi] - 0.14;
      const k = smooth(w * 0.7, w * 2.4, d);
      h = Math.min(h, bed * (1 - k) + h * k);
    }
    const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
    if (dl < LAKE.r * 1.5) {
      const k = smooth(LAKE.r * 0.6, LAKE.r * 1.5, dl);
      h = h * k + (baseHeight(LAKE.x, LAKE.z) - 0.45) * (1 - k);
    }
    heights[i] = h;
    gp.setY(i, h);
  }
  const LAKE_Y = baseHeight(LAKE.x, LAKE.z) - 0.12;
  groundGeo.computeVertexNormals();
  const gNorm = groundGeo.attributes.normal;
  const gCol = new Float32Array(gp.count * 3);
  groundGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
  const noise = new Float32Array(gp.count);
  for (let i = 0; i < gp.count; i++) noise[i] = Math.sin(gp.getX(i) * 2.3) * Math.cos(gp.getZ(i) * 1.9) * 0.5 + (R() - 0.5) * 0.4;
  const cTmp = new THREE.Color();
  const C = {
    sand: new THREE.Color(0xe6d29a), wetSand: new THREE.Color(0xb8a676), grass: new THREE.Color(0x6db34a),
    grass2: new THREE.Color(0x4f9a3c), rock: new THREE.Color(0x8d8a84), snow: new THREE.Color(0xf7fbff), bed: new THREE.Color(0x7a8f8a),
  };
  function paintTerrain(snowLine) {
    for (let i = 0; i < gp.count; i++) {
      const h = heights[i];
      const x = gp.getX(i);
      const ny = gNorm.getY(i);
      if (h < -0.15) cTmp.copy(C.wetSand);
      else if (h < 0.42 && x < -0.8) cTmp.copy(C.sand);
      else {
        cTmp.copy(C.grass).lerp(C.grass2, 0.5 + 0.5 * Math.sin(x * 0.8 + gp.getZ(i) * 0.6));
        if (ny < 0.8 || h > 2.4) cTmp.lerp(C.rock, Math.min(1, Math.max((0.86 - ny) * 4, (h - 2.2) * 0.9)));
      }
      if (h > snowLine + noise[i] * 0.35) cTmp.copy(C.snow);
      gCol[i * 3] = cTmp.r; gCol[i * 3 + 1] = cTmp.g; gCol[i * 3 + 2] = cTmp.b;
    }
    groundGeo.attributes.color.needsUpdate = true;
  }
  const SNOW_BASE = 3.1;
  let snowLine = SNOW_BASE;
  let snowTarget = SNOW_BASE;
  paintTerrain(snowLine);
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
  scene.add(ground);

  // Височина на терена/водата в точка — за падащите частици.
  const dx = W / NX, dz = D / NZ;
  function groundH(x, z) {
    const cx = Math.min(NX - 1e-3, Math.max(0, (x + W / 2) / dx));
    const cz = Math.min(NZ - 1e-3, Math.max(0, (z + D / 2) / dz));
    const c0 = Math.floor(cx), r0 = Math.floor(cz);
    const fx = cx - c0, fz = cz - r0;
    const at = (c, r) => heights[r * (NX + 1) + c];
    const h = at(c0, r0) * (1 - fx) * (1 - fz) + at(c0 + 1, r0) * fx * (1 - fz) + at(c0, r0 + 1) * (1 - fx) * fz + at(c0 + 1, r0 + 1) * fx * fz;
    let top = h;
    if (x < SEA_X) top = Math.max(top, 0);
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r) top = Math.max(top, LAKE_Y);
    return top;
  }

  // ---------- стени на макета: почва, подземни води, скала ----------
  const BOT = -2.6, AQ_TOP = -0.85, AQ_BOT = -1.55;
  const skirtPos = []; const skirtCol = [];
  const seaFacePos = [];
  const bandCols = { soil: new THREE.Color(0x6b4a2b), earth: new THREE.Color(0x9a7650), aq: new THREE.Color(0x4f95cf), rock: new THREE.Color(0x77706a) };
  function quad(arr, cols, a, b, ya0, ya1, yb0, yb1, col) {
    if (ya0 - ya1 < 1e-4 && yb0 - yb1 < 1e-4) return;
    const v = [a.x, ya0, a.z, b.x, yb0, b.z, b.x, yb1, b.z, a.x, ya0, a.z, b.x, yb1, b.z, a.x, ya1, a.z];
    arr.push(...v);
    if (cols) for (let k = 0; k < 6; k++) cols.push(col.r, col.g, col.b);
  }
  function edge(points) {
    for (let k = 0; k < points.length - 1; k++) {
      const a = points[k], b = points[k + 1];
      const ta = groundHRaw(a.x, a.z), tb = groundHRaw(b.x, b.z);
      const bands = (t) => {
        const s1 = t - 0.3;
        const e1 = Math.min(AQ_TOP, s1);
        const a1 = Math.min(AQ_BOT, e1);
        return [[t, s1, 'soil'], [s1, e1, 'earth'], [e1, a1, 'aq'], [a1, BOT, 'rock']];
      };
      const A = bands(ta), B = bands(tb);
      for (let j = 0; j < 4; j++) {
        const col = (j === 0 && (ta < 0.3 || tb < 0.3) && a.x < -1) ? C.sand : bandCols[A[j][2]];
        quad(skirtPos, skirtCol, a, b, A[j][0], A[j][1], B[j][0], B[j][1], col);
      }
      if (ta < 0 || tb < 0) quad(seaFacePos, null, a, b, 0, Math.min(0, ta), 0, Math.min(0, tb));
    }
  }
  function groundHRaw(x, z) {
    const cx = Math.round((x + W / 2) / dx), cz = Math.round((z + D / 2) / dz);
    return heights[Math.min(NZ, Math.max(0, cz)) * (NX + 1) + Math.min(NX, Math.max(0, cx))];
  }
  const edgePts = (fn, n) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));
  edge(edgePts((u) => new THREE.Vector3(-W / 2 + u * W, 0, D / 2), NX));
  edge(edgePts((u) => new THREE.Vector3(W / 2 - u * W, 0, -D / 2), NX));
  edge(edgePts((u) => new THREE.Vector3(W / 2, 0, D / 2 - u * D), NZ));
  edge(edgePts((u) => new THREE.Vector3(-W / 2, 0, -D / 2 + u * D), NZ));
  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPos, 3));
  skirtGeo.setAttribute('color', new THREE.Float32BufferAttribute(skirtCol, 3));
  skirtGeo.computeVertexNormals();
  const skirt = new THREE.Mesh(skirtGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }));
  scene.add(skirt);
  const seaFaceGeo = new THREE.BufferGeometry();
  seaFaceGeo.setAttribute('position', new THREE.Float32BufferAttribute(seaFacePos, 3));
  seaFaceGeo.computeVertexNormals();
  const seaFace = new THREE.Mesh(seaFaceGeo, new THREE.MeshStandardMaterial({ color: 0x2a78bd, transparent: true, opacity: 0.75, side: THREE.DoubleSide, roughness: 0.3 }));
  scene.add(seaFace);
  const bottom = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat(0x5d5650));
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = BOT;
  scene.add(bottom);
  // Подземни води: капчици, които бавно текат под земята към морето.
  const gwDots = [];
  const gwMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff });
  for (let i = 0; i < 26; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), gwMat);
    d.userData = { x: -4 + R() * 16, y: AQ_BOT + 0.12 + R() * (AQ_TOP - AQ_BOT - 0.24), ph: R() * 6 };
    scene.add(d);
    gwDots.push(d);
  }
  const gwHit = new THREE.Mesh(new THREE.BoxGeometry(17, 1.6, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  gwHit.position.set(3.4, (AQ_TOP + AQ_BOT) / 2, D / 2);
  gwHit.userData.pickId = 'ground';
  scene.add(gwHit);
  const gwAnchor = new THREE.Object3D();
  gwAnchor.position.set(1.5, AQ_TOP, D / 2 + 0.1);
  scene.add(gwAnchor);
  let gwBoost = 0;

  // ---------- море ----------
  const seaW = SEA_X + W / 2;
  const seaGeo = new THREE.PlaneGeometry(seaW, D, 40, 56);
  seaGeo.rotateX(-Math.PI / 2);
  seaGeo.translate(-W / 2 + seaW / 2, 0, 0);
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: 0x2f86cf, roughness: 0.25, metalness: 0.05, transparent: true, opacity: 0.88, flatShading: true }));
  sea.userData.pickId = 'sea';
  scene.add(sea);
  const seaAnchor = new THREE.Object3D();
  seaAnchor.position.set(-8, 0.2, 1.5);
  scene.add(seaAnchor);

  // ---------- езеро ----------
  const lake = new THREE.Mesh(new THREE.CircleGeometry(LAKE.r * 1.12, 40),
    new THREE.MeshStandardMaterial({ color: 0x3d92d8, roughness: 0.2, transparent: true, opacity: 0.9 }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(LAKE.x, LAKE_Y, LAKE.z);
  lake.userData.pickId = 'lake';
  scene.add(lake);
  addHitBox(lake, 1.2);

  // ---------- река ----------
  const rTex = riverTexture();
  const rv = []; const ruv = []; const ridx = [];
  let acc = 0;
  for (let i = 0; i < RN; i++) {
    const p = rPts[i];
    const tng = (i < RN - 1 ? rPts[i + 1].clone().sub(p) : p.clone().sub(rPts[i - 1])).setY(0).normalize();
    const nrm = new THREE.Vector3(-tng.z, 0, tng.x);
    const w = rWidth(i) * 1.15;
    if (i > 0) acc += p.distanceTo(rPts[i - 1]);
    const y = rSurf[i] + 0.02;
    rv.push(p.x + nrm.x * w, y, p.z + nrm.z * w, p.x - nrm.x * w, y, p.z - nrm.z * w);
    ruv.push(0, acc / 1.6, 1, acc / 1.6);
    if (i < RN - 1) { const a = i * 2; ridx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const riverGeo = new THREE.BufferGeometry();
  riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(rv, 3));
  riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
  riverGeo.setIndex(ridx);
  riverGeo.computeVertexNormals();
  const riverMat = new THREE.MeshStandardMaterial({ map: rTex, roughness: 0.3, side: THREE.DoubleSide });
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.userData.pickId = 'river';
  scene.add(river);
  const riverHit = new THREE.Mesh(new THREE.TubeGeometry(riverCurve, 60, 0.45, 6, false), new THREE.MeshBasicMaterial({ visible: false }));
  riverHit.position.y = 0.6;
  riverHit.userData.pickId = 'river';
  scene.add(riverHit);
  const riverAnchor = new THREE.Object3D();
  riverAnchor.position.copy(rPts[70]).setY(rSurf[70] + 0.3);
  scene.add(riverAnchor);
  let riverBoost = 0;

  // ---------- планина (зона за кликане) ----------
  const mtnHit = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.2, 10), new THREE.MeshBasicMaterial({ visible: false }));
  mtnHit.position.set(6.6, 2.9, -4.0);
  mtnHit.userData.pickId = 'mountain';
  scene.add(mtnHit);
  const mtnAnchor = new THREE.Object3D();
  mtnAnchor.position.set(6.6, 4.4, -4.0);
  scene.add(mtnAnchor);

  // ---------- слънце ----------
  const sunG = new THREE.Group();
  sunG.position.set(-9.5, 8.2, -6.5);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(5, 5, 1);
  const rays = new THREE.Group();
  const rayMat = new THREE.MeshBasicMaterial({ color: 0xffc928, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 12; i++) {
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 4), rayMat);
    const a = (i / 12) * Math.PI * 2;
    r.position.set(Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0);
    r.rotation.z = a - Math.PI / 2;
    rays.add(r);
  }
  sunG.add(glow, sunBall, rays);
  sunG.userData.pickId = 'sun';
  scene.add(sunG);
  addHitBox(sunG, 2.4);
  let sunPower = 0.35; // 0…1

  // ---------- облаци ----------
  function puffCloud(n, spread, r0, seed, color = 0xffffff) {
    const rr = rng(seed);
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.96 });
    for (let k = 0; k < n; k++) {
      const r = r0 * (0.7 + rr() * 0.5) * (1 - Math.abs(k - n / 2) / n * 0.6);
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), m);
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
    c.scale.setScalar(0.9 + (i % 2) * 0.3);
    scene.add(c);
    deco.push(c);
  }
  // Главният облак: расте, потъмнява и може да стане буреносен.
  const cloud = new THREE.Group();
  const cloudBody = puffCloud(6, 0.62, 0.78, 7);
  cloud.add(cloudBody);
  const tower = new THREE.Group(); // буреносна „кула“ и „наковалня“
  const towerM = cloudBody.userData.mat;
  for (const [x, y, z, r] of [[0, 1.0, 0, 0.95], [0.2, 1.9, -0.1, 0.9], [-0.2, 2.7, 0.1, 0.85], [-1.1, 3.25, 0, 0.7], [1.1, 3.3, 0, 0.75], [0, 3.35, 0, 0.8]]) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), towerM);
    p.position.set(x, y, z);
    p.scale.y = y > 3 ? 0.5 : 0.85;
    tower.add(p);
  }
  tower.visible = false;
  cloud.add(tower);
  cloud.userData.pickId = 'cloud';
  scene.add(cloud);
  addHitBox(cloudBody, 1.5);
  const CLOUD_SEA = new THREE.Vector3(-6.2, 4.6, 0.6);
  const CLOUD_MTN = new THREE.Vector3(5.6, 5.9, -2.6);
  cloud.position.copy(CLOUD_SEA);
  let fill = 0.25; // 0…1 колко капчици има облакът
  let storm = 0; // 0…1 колко е буреносен
  let cloudMove = null;
  const cWhite = new THREE.Color(0xffffff), cGrey = new THREE.Color(0xaab3bd), cDark = new THREE.Color(0x5b6570);
  function moveCloud(to, dur) { cloudMove = { from: cloud.position.clone(), to: to.clone(), k: 0, dur }; }

  // Мълния.
  const boltMat = new THREE.LineBasicMaterial({ color: 0xfff6a8 });
  const bolt = new THREE.Line(new THREE.BufferGeometry(), boltMat);
  bolt.visible = false;
  bolt.frustumCulled = false;
  scene.add(bolt);
  let boltTimer = 0;
  let flash = 0;
  function strike() {
    const pts = [];
    const x0 = cloud.position.x + (R() - 0.5) * 1.6;
    const z0 = cloud.position.z + 0.6;
    const y0 = cloud.position.y - 0.3;
    const y1 = groundH(x0, z0);
    let x = x0, z = z0;
    for (let k = 0; k <= 8; k++) {
      const y = y0 + (y1 - y0) * (k / 8);
      pts.push(new THREE.Vector3(x, y, z));
      x += (R() - 0.5) * 0.5; z += (R() - 0.5) * 0.3;
    }
    bolt.geometry.setFromPoints(pts);
    bolt.visible = true;
    flash = 0.18;
  }

  // ---------- живот: дървета, къщички, лодка, чайки ----------
  const nearRiver = (x, z) => { let m = Infinity; for (let k = 0; k < RN; k += 3) m = Math.min(m, Math.hypot(rPts[k].x - x, rPts[k].z - z)); return m; };
  const pineM = mat(0x2f7d3a, { flat: true });
  const trunkM = mat(0x7a5230);
  const leafM = mat(0x58a83c, { flat: true });
  const swayers = [];
  for (let i = 0; i < 70; i++) {
    const x = -1.5 + R() * 13;
    const z = -7.2 + R() * 14.4;
    const h = baseHeight(x, z);
    if (h < 0.6 || h > 2.9) continue;
    if (nearRiver(x, z) < 0.9 || Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 0.7) continue;
    if (Math.hypot(x - 1.9, z - 3.1) < 1.4) continue; // селото
    const t = new THREE.Group();
    const s = 0.5 + R() * 0.45;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 5), trunkM);
    trunk.position.y = 0.17;
    t.add(trunk);
    if (h > 1.4 || R() < 0.5) {
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.8, 6), pineM);
      c1.position.y = 0.65;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 6), pineM);
      c2.position.y = 0.98;
      t.add(c1, c2);
    } else {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), leafM);
      b.position.y = 0.6;
      t.add(b);
    }
    t.scale.setScalar(s);
    t.position.set(x, groundHRaw(x, z) - 0.03, z);
    t.userData.ph = R() * 6;
    scene.add(t);
    swayers.push(t);
  }
  const houseCols = [0xf3e3c3, 0xffffff, 0xf6d4b0];
  const smokes = [];
  [[1.4, 2.7, 0.3], [2.4, 3.3, -0.4], [1.2, 3.8, 0.9]].forEach(([x, z, ry], i) => {
    const hG = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.42, 0.5), mat(houseCols[i]));
    body.position.y = 0.21;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.36, 4), mat(0xc0482f, { flat: true }));
    roof.position.y = 0.6;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, 0.8);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), mat(0x8d6e63));
    chim.position.set(0.15, 0.7, 0.05);
    hG.add(body, roof, chim);
    hG.position.set(x, groundHRaw(x, z) - 0.02, z);
    hG.rotation.y = ry;
    scene.add(hG);
    smokes.push(hG.position.clone().add(new THREE.Vector3(0.15, 0.85, 0.05)));
  });
  // Лодка.
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.34), mat(0x8a4b2a));
  hull.position.y = 0.06;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5), mat(0x5d4037));
  mast.position.y = 0.5;
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0.02, 0.18, 0, 0.02, 0.92, 0, 0.42, 0.2, 0], 3));
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
  boat.add(hull, mast, sail);
  boat.position.set(-9, 0, 4.2);
  scene.add(boat);
  // Чайки.
  const gulls = [];
  const gullM = mat(0xf4f6f8);
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group();
    const wings = [];
    for (const s of [1, -1]) {
      const hinge = new THREE.Group();
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.36), gullM);
      w.position.z = s * 0.18;
      hinge.add(w);
      b.add(hinge);
      wings.push({ hinge, s });
    }
    b.userData = { wings, ph: i * 2.1, r: 1.6 + i * 0.7 };
    scene.add(b);
    gulls.push(b);
  }

  // ---------- частици ----------
  const vapour = makePool(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }), 220);
  const rainP = makePool(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 4), new THREE.MeshBasicMaterial({ color: 0x5aa8f5 }), 360);
  const snowP = makePool(new THREE.IcosahedronGeometry(0.07, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, emissive: 0x9ab4cc, emissiveIntensity: 0.3 }), 360);
  const hailP = makePool(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xeef8ff, roughness: 0.25, emissive: 0x8fb6d6, emissiveIntensity: 0.25 }), 160);
  const flowP = makePool(new THREE.SphereGeometry(0.075, 6, 4), new THREE.MeshBasicMaterial({ color: 0xd6f0ff }), 120);
  const smokeP = makePool(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0xe9ecef, transparent: true, opacity: 0.6 }), 40);
  for (const p of [vapour, rainP, snowP, hailP, flowP, smokeP]) scene.add(p.mesh);
  const vapourHit = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 3), new THREE.MeshBasicMaterial({ visible: false }));
  vapourHit.position.set(-6.5, 2.2, 0.8);
  vapourHit.userData.pickId = 'vapour';
  scene.add(vapourHit);

  // Състояние на симулацията.
  const sim = {
    evapRate: 2, // частици в секунда
    feedCloud: false, // дали парите пълнят облака
    precip: null, // 'rain' | 'snow' | 'hail'
    precipLeft: 0,
    onVapour: null,
  };
  let vapAcc = 0, precipAcc = 0, flowAcc = 0, smokeAcc = 0;

  // ---------- таймери, които спират при рестарт ----------
  let timers = [];
  function later(sec, fn) { const t = { left: sec, fn }; timers.push(t); return t; }
  function clearTimers() { timers = []; }

  // ---------- етикети на местата (стъпка 1) ----------
  const placeLabels = [];
  function placeLabel(text, pos) {
    const s = labelSprite(text, { size: 0.42 });
    s.position.set(...pos);
    stage.steadyLabel(s, 20);
    scene.add(s);
    placeLabels.push(s);
    return s;
  }
  placeLabel('Море', [-8.6, 1.0, 5.2]);
  placeLabel('Планина', [7.2, 5.4, -4.4]);
  placeLabel('Река', [-0.8, 1.2, 1.6]);
  placeLabel('Езеро', [LAKE.x, LAKE_Y + 0.8, LAKE.z + 0.6]);
  placeLabel('Подземни води', [9.4, AQ_TOP + 0.05, D / 2 + 0.4]);
  const showPlaceLabels = (on) => placeLabels.forEach((s) => { s.visible = on; });

  // ---------- главен цикъл на анимацията ----------
  const up = new THREE.Vector3(0, 1, 0);
  stage.tick((dt, t) => {
    for (const tm of timers.slice()) { tm.left -= dt; if (tm.left <= 0) { timers = timers.filter((x) => x !== tm); tm.fn(); } }
    // Вълни.
    const sp = seaGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), z = sp.getZ(i);
      sp.setY(i, 0.05 * Math.sin(x * 1.3 + t * 1.6) + 0.035 * Math.sin(z * 1.9 - t * 1.2 + x * 0.4));
    }
    sp.needsUpdate = true;
    seaGeo.computeVertexNormals();
    lake.material.color.setHSL(0.57, 0.6, 0.53 + Math.sin(t * 0.9) * 0.025);
    // Река: тече по-бързо, когато има много вода.
    riverBoost = Math.max(0, riverBoost - dt * 0.08);
    rTex.offset.y -= dt * (0.35 + riverBoost * 1.4);
    riverMat.color.setRGB(1 + riverBoost * 0.25, 1 + riverBoost * 0.25, 1 + riverBoost * 0.2);
    // Подземни води.
    gwBoost = Math.max(0, gwBoost - dt * 0.05);
    for (const d of gwDots) {
      const u = d.userData;
      u.x -= dt * (0.25 + gwBoost * 1.2);
      if (u.x < -4.3) u.x = 12;
      d.position.set(u.x, u.y + Math.sin(t * 1.5 + u.ph) * 0.06, D / 2 + 0.05);
    }
    // Слънце.
    const sPulse = 1 + Math.sin(t * 2) * 0.04;
    const sScale = (0.8 + sunPower * 0.5) * sPulse;
    glow.scale.setScalar(3.6 + sunPower * 3.6);
    sunBall.scale.setScalar(0.9 + sunPower * 0.25);
    rays.rotation.z = t * 0.25;
    rays.scale.setScalar(sScale);
    stage.sun.intensity = 1.2 + sunPower * 1.0;
    sunG.lookAt(stage.camera.position);
    // Декоративни облаци, лодка, чайки, дървета.
    for (const c of deco) { c.position.x += dt * 0.22; if (c.position.x > 16) c.position.x = -16; }
    boat.position.y = Math.sin(t * 1.4) * 0.05;
    boat.rotation.z = Math.sin(t * 1.1) * 0.06;
    boat.position.x = -9 + Math.sin(t * 0.08) * 1.6;
    boat.rotation.y = Math.cos(t * 0.08) > 0 ? 0 : Math.PI;
    for (const gl of gulls) {
      const u = gl.userData;
      const k = t * 0.35 + u.ph;
      gl.position.set(-7.5 + Math.cos(k) * u.r * 1.4, 3.0 + Math.sin(k * 2) * 0.3 + u.r * 0.2, 1 + Math.sin(k) * u.r);
      gl.rotation.y = -k;
      for (const { hinge, s } of u.wings) hinge.rotation.x = s * (Math.sin(t * 5 + u.ph) * 0.45 + 0.15);
    }
    for (const tr of swayers) tr.rotation.z = Math.sin(t * 1.2 + tr.userData.ph) * 0.03;
    // Сняг по планината.
    if (Math.abs(snowLine - snowTarget) > 0.005) {
      snowLine += Math.sign(snowTarget - snowLine) * Math.min(Math.abs(snowTarget - snowLine), dt * 0.45);
      paintTerrain(snowLine);
    }
    // Облакът.
    if (cloudMove) {
      cloudMove.k = Math.min(1, cloudMove.k + dt / cloudMove.dur);
      const e = cloudMove.k < 0.5 ? 2 * cloudMove.k ** 2 : 1 - (-2 * cloudMove.k + 2) ** 2 / 2;
      cloud.position.lerpVectors(cloudMove.from, cloudMove.to, e);
      if (cloudMove.k >= 1) { const done = cloudMove.onDone; cloudMove = null; if (done) done(); }
    }
    const want = 0.45 + 0.7 * Math.min(1, fill);
    const cs = cloudBody.scale.x + (want - cloudBody.scale.x) * Math.min(1, dt * 2.5);
    cloudBody.scale.set(cs * (1 + Math.sin(t * 0.8) * 0.02), cs, cs);
    cloudBody.position.y = Math.sin(t * 0.7) * 0.06;
    tower.visible = storm > 0.02;
    tower.scale.setScalar(Math.max(0.01, storm));
    cTmp.copy(cWhite).lerp(cGrey, Math.min(1, fill)).lerp(cDark, storm);
    cloudBody.userData.mat.color.copy(cTmp);
    if (storm > 0.5) {
      boltTimer -= dt;
      if (boltTimer <= 0) { strike(); boltTimer = 1.6 + R() * 2; }
    }
    if (flash > 0) {
      flash -= dt;
      stage.hemi.intensity = 2.2;
      if (flash <= 0) { bolt.visible = false; stage.hemi.intensity = 1.0; }
    }

    // Изпарение.
    vapAcc += dt * sim.evapRate;
    while (vapAcc >= 1) {
      vapAcc -= 1;
      const it = vapour.spawn();
      if (!it) break;
      const fromLake = R() < 0.12;
      if (fromLake) {
        const a = R() * 6.28; const r = Math.sqrt(R()) * LAKE.r;
        it.p.set(LAKE.x + Math.cos(a) * r, LAKE_Y + 0.05, LAKE.z + Math.sin(a) * r);
      } else {
        it.p.set(-10.5 + R() * 7.2, 0.08, -4 + R() * 8);
      }
      it.toCloud = sim.feedCloud && !fromLake;
      it.top = it.toCloud ? cloud.position.y - 0.3 : 2.4 + R() * 2.2;
      it.v.set((R() - 0.5) * 0.2, 0.9 + R() * 0.5 + sunPower * 0.6, (R() - 0.5) * 0.2);
      it.ph = R() * 6;
    }
    for (const it of vapour.items) {
      if (!it.on) continue;
      it.life += dt;
      if (it.toCloud) {
        // Парите се събират към облака.
        const k = Math.min(1, it.life * 0.25);
        it.p.x += ((cloud.position.x - it.p.x) * k * 0.6 + it.v.x) * dt;
        it.p.z += ((cloud.position.z - it.p.z) * k * 0.6 + it.v.z) * dt;
      } else {
        it.p.x += (it.v.x + Math.sin(t * 2 + it.ph) * 0.12) * dt;
        it.p.z += it.v.z * dt;
      }
      it.p.y += it.v.y * dt;
      const left = it.top - it.p.y;
      it.s = Math.min(1, it.life * 3) * Math.min(1, Math.max(0, left / 0.7));
      if (left <= 0) {
        it.on = false;
        if (it.toCloud && sim.onVapour) sim.onVapour();
      }
    }
    vapour.write();

    // Валежи.
    if (sim.precip && sim.precipLeft > 0) {
      sim.precipLeft -= dt;
      const rate = sim.precip === 'rain' ? 90 : sim.precip === 'snow' ? 55 : 28;
      precipAcc += dt * rate;
      const pool = sim.precip === 'rain' ? rainP : sim.precip === 'snow' ? snowP : hailP;
      const spread = 1.2 + cloudBody.scale.x * 1.4;
      while (precipAcc >= 1) {
        precipAcc -= 1;
        const it = pool.spawn();
        if (!it) break;
        it.p.set(cloud.position.x + (R() - 0.5) * spread * 2, cloud.position.y - 0.35, cloud.position.z + (R() - 0.5) * 1.6);
        it.v.set(0, sim.precip === 'rain' ? -6.5 : sim.precip === 'snow' ? -1.1 : -7.5, 0);
        it.ph = R() * 6;
        it.rot = R() * 3;
        it.s = 1;
        it.bounced = false;
      }
      if (sim.precipLeft <= 0) { sim.precip = null; if (sim.onPrecipEnd) { const f = sim.onPrecipEnd; sim.onPrecipEnd = null; f(); } }
    }
    for (const it of rainP.items) {
      if (!it.on) continue;
      it.p.y += it.v.y * dt;
      it.rot = 0;
      const gh = groundH(it.p.x, it.p.z);
      if (it.p.y <= gh) { it.on = false; }
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
    for (const it of hailP.items) {
      if (!it.on) continue;
      if (it.rest > 0) { it.rest -= dt; it.s = Math.min(1, it.rest); if (it.rest <= 0) it.on = false; continue; }
      it.v.y -= dt * 9;
      it.p.addScaledVector(it.v, dt);
      const gh = groundH(it.p.x, it.p.z);
      if (it.p.y <= gh + 0.08) {
        it.p.y = gh + 0.08;
        if (!it.bounced) { it.bounced = true; it.v.set((R() - 0.5) * 1.5, 2.2, (R() - 0.5) * 1.5); } else it.rest = 2.5;
      }
    }
    hailP.write();

    // Вода, която тече по реката към морето.
    if (riverBoost > 0.15) {
      flowAcc += dt * riverBoost * 14;
      while (flowAcc >= 1) {
        flowAcc -= 1;
        const it = flowP.spawn();
        if (!it) break;
        it.k = R() * 6; it.side = (R() - 0.5) * 0.25; it.sp = 16 + R() * 8;
      }
    }
    for (const it of flowP.items) {
      if (!it.on) continue;
      it.k += dt * it.sp;
      if (it.k >= RN - 1) {
        // В морето капката се разтваря.
        it.life += dt;
        it.p.x -= dt * 1.2;
        it.s = Math.max(0, 1 - it.life * 1.5);
        if (it.s <= 0) it.on = false;
        continue;
      }
      const i0 = Math.floor(it.k), f = it.k - i0;
      const a = rPts[i0], b = rPts[Math.min(RN - 1, i0 + 1)];
      it.p.set(a.x + (b.x - a.x) * f, rSurf[i0] + 0.08, a.z + (b.z - a.z) * f + it.side);
      it.s = 1;
    }
    flowP.write();

    // Дим от комините.
    smokeAcc += dt * 3;
    while (smokeAcc >= 1) {
      smokeAcc -= 1;
      const it = smokeP.spawn();
      if (!it) break;
      it.p.copy(smokes[Math.floor(R() * smokes.length)]);
      it.life = 0;
    }
    for (const it of smokeP.items) {
      if (!it.on) continue;
      it.life += dt;
      it.p.y += dt * 0.35;
      it.p.x += dt * 0.15;
      it.s = (0.6 + it.life * 0.8) * Math.max(0, 1 - it.life / 2.2);
      if (it.life > 2.2) it.on = false;
    }
    smokeP.write();

    // Стрелките в стъпка 3 се „рисуват“.
    for (const a of arrows) {
      const gr = a.userData.grow;
      if (gr.k < 1) {
        gr.k = Math.min(1, gr.k + dt * 1.4);
        gr.geo.setDrawRange(0, Math.floor((gr.total * gr.k) / 3) * 3);
        if (gr.k >= 1) gr.head.visible = true;
      }
    }
    if (loopDrop) {
      loopDrop.k = (loopDrop.k + dt * 0.35) % arrows.length;
      const ai = Math.floor(loopDrop.k);
      const c = arrows[ai] && arrows[ai].userData.curve;
      if (c) loopDrop.mesh.position.copy(c.getPoint(loopDrop.k - ai));
      loopDrop.mesh.rotation.y += dt * 2;
    }
    void up;
  });

  // ---------- балончета ----------
  let tip = null;
  function say(anchor, html, { lift = 0.6, cls = '' } = {}) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
    return tip;
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const anchors = {
    sun: { obj: sunG, lift: 1.6 }, sea: { obj: seaAnchor, lift: 0.4 }, vapour: { obj: vapourHit, lift: 1.4 },
    cloud: { obj: cloud, lift: 1.1 }, mountain: { obj: mtnAnchor, lift: 0.6 }, river: { obj: riverAnchor, lift: 0.4 },
    lake: { obj: lake, lift: 0.5 }, ground: { obj: gwAnchor, lift: 0.1 },
  };
  const sayAt = (id, html, cls = '') => say(anchors[id].obj, html, { lift: anchors[id].lift, cls });

  let tempTag = null;
  function setTempTag(text) {
    if (!text) { if (tempTag) { tempTag.remove(); tempTag = null; } return; }
    if (!tempTag) tempTag = stage.bubble(mtnHit, '', { lift: -0.6, cls: 'tag wc-temp' });
    tempTag.set(text);
  }

  // ---------- общо: кликане и меню ----------
  const scores = [];
  let arrows = [];
  let loopDrop = null;
  let clickHandler = null;
  let menuHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  const menu = cornerMenu(stage, {
    title: 'Разгледай',
    items: PLACES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });

  const narrow = () => (shell.stageEl.clientWidth || 600) < 560;
  function overview(dur = 1.1) {
    stage.stopFollow();
    if (narrow()) stage.flyTo([-1, 15, 27], [-0.5, 1.2, 0], dur);
    else stage.flyTo([0, 11, 20], [0, 1.4, 0], dur);
  }
  const FOCUS = {
    sun: { pos: [-3, 7, 4], tgt: [-9, 7.4, -6] },
    sea: { pos: [-4, 4.5, 9], tgt: [-8, 0.4, 1] },
    vapour: { pos: [-2.5, 5, 8], tgt: [-6.5, 2.4, 0.8] },
    cloud: { pos: [-2.5, 6.5, 8.5], tgt: [-6.2, 4.4, 0.6] },
    mountain: { pos: [2.5, 6.5, 6], tgt: [6.4, 3.2, -3.6] },
    river: { pos: [1.5, 5.5, 9], tgt: [0.5, 0.8, 1] },
    lake: { pos: [4.6, 4, 9.2], tgt: [5.6, 0.9, 3.4] },
    ground: { pos: [3.5, 1.8, 15.5], tgt: [2.5, -0.9, 7.5] },
  };
  function focusPlace(id) {
    stage.stopFollow();
    const f = FOCUS[id];
    if (id === 'cloud') {
      const c = cloud.position;
      stage.flyTo([c.x + 3.7, c.y + 1.9, c.z + 7.9], [c.x, c.y - 0.2, c.z], 1.0);
      return;
    }
    if (narrow()) {
      // На тесен екран се отдръпваме малко повече назад.
      const p = new THREE.Vector3(...f.pos), t2 = new THREE.Vector3(...f.tgt);
      p.sub(t2).multiplyScalar(1.45).add(t2);
      stage.flyTo(p.toArray(), f.tgt, 1.0);
    } else stage.flyTo(f.pos, f.tgt, 1.0);
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    showPlaceLabels(true);
    menu.show(true);
    menu.setActive(null);
    sim.evapRate = 3; sim.feedCloud = false;
    const seen = new Set();
    const NEED = 6;
    shell.task(`<p>Водата на Земята постоянно пътува: от морето към небето, после към сушата и пак обратно.</p>
      <p><b>Разгледай поне ${NEED} неща</b> от природата: кликни върху тях в сцената или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата картина</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${PLACES.length}`);
    upd();
    const visit = (id) => {
      const p = placeById[id];
      focusPlace(id);
      sayAt(id, `<b>${esc(p.icon)} ${esc(p.label)}</b><br>${esc(p.note)}`, 'wide');
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size >= NEED) {
        next.disabled = false;
        shell.msg('Браво! Можеш да продължиш или да разгледаш още.', 'good');
      }
    };
    clickHandler = (id) => { if (!id) { clearTip(); return; } if (placeById[id]) visit(id); };
    menuHandler = visit;
    next.addEventListener('click', step2);
    overview();
  }

  // ---------- 2. Пусни кръговрата ----------
  function step2() {
    shell.step(1);
    clearTip();
    showPlaceLabels(false);
    menu.show(false);
    menu.setActive(null);
    menuHandler = null;
    let mistakes = 0;
    let phase = 'evap';
    fill = 0.12;
    sunPower = 0.15;
    cloud.position.copy(CLOUD_SEA);
    sim.feedCloud = true;
    const NEED = 45;
    shell.task(`<p><b>Пусни кръговрата на водата!</b></p>
      <ol class="wc-steps">
        <li data-s="evap">Нагрей морето със слънцето.</li>
        <li data-s="full">Изчакай облакът да се напълни с капчици.</li>
        <li data-s="wind">Пусни вятъра към планината.</li>
        <li data-s="rain">Пусни валежа и гледай къде отива водата.</li>
      </ol>`);
    const ctrl = shell.setControls(`<div class="wc-ctrl">
      <label class="wc-lbl">☀️ Сила на слънцето <output class="sv">слабо</output>
        <input class="slider wc-sun" type="range" min="0" max="100" step="1" value="15"></label>
      <span class="wc-lbl">☁️ Капчици в облака <output class="fv">0%</output></span>
      <div class="wc-meter"><i></i></div>
      <div class="row"><button class="btn wc-wind">🌬️ Вятър</button><button class="btn wc-rain">🌧️ Валеж</button></div></div>`);
    const sl = ctrl.querySelector('.wc-sun');
    const meter = ctrl.querySelector('.wc-meter');
    const fv = ctrl.querySelector('.fv');
    const sv = ctrl.querySelector('.sv');
    const mark = () => {
      const order = ['evap', 'full', 'wind', 'rain'];
      const cur = { evap: 0, full: 1, wind: 2, atMtn: 3, rain: 3, flow: 4, done: 4 }[phase];
      container.querySelectorAll('.wc-steps li').forEach((li) => {
        const k = order.indexOf(li.dataset.s);
        li.className = k < cur ? 'done' : k === cur ? 'now' : '';
      });
    };
    let warmed = false;
    const updSun = () => {
      sunPower = sl.value / 100;
      sim.evapRate = 1 + sunPower * 26;
      sv.textContent = sunPower < 0.34 ? 'слабо' : sunPower < 0.67 ? 'средно' : 'силно';
      if (!warmed && sunPower >= 0.5 && phase === 'evap') {
        warmed = true;
        sayAt('sea', '<b>Изпарение</b><br>Слънцето нагрява водата и тя се превръща в невидими водни пари. Те се издигат нагоре с топлия въздух. Солта остава в морето.', 'wide');
        later(5, () => { if (phase === 'evap') phase = 'evap2'; mark(); phase = phase === 'evap2' ? 'evap' : phase; });
        phase = 'evap';
        mark();
        container.querySelector('.wc-steps li[data-s="evap"]').className = 'done';
      }
    };
    sl.addEventListener('input', updSun);
    updSun();
    const updFill = () => {
      const pc = Math.round(Math.min(1, fill) * 100);
      meter.firstElementChild.style.width = pc + '%';
      meter.classList.toggle('full', fill >= 1);
      fv.textContent = pc + '%';
    };
    updFill();
    let condShown = false;
    sim.onVapour = () => {
      if (phase !== 'evap') return;
      fill = Math.min(1, fill + 1 / NEED);
      updFill();
      if (!condShown && fill > 0.35) {
        condShown = true;
        sayAt('cloud', '<b>Втечняване</b><br>Високо горе е студено. Водните пари се охлаждат и стават на много малки капчици — така облакът расте.', 'wide');
      }
      if (fill >= 1) {
        phase = 'full';
        sim.feedCloud = false;
        sim.evapRate = 3;
        mark();
        sayAt('cloud', '<b>Облакът е пълен с капчици!</b><br>Сега вятърът може да го отнесе над сушата.', 'good');
        shell.msg('Облакът е готов. Пусни вятъра.', 'good');
      }
    };
    shell.score('Грешки: 0');
    const upScore = () => shell.score(`Грешки: ${mistakes}`);
    mark();
    stage.flyTo(narrow() ? [-1, 13, 25] : [-1.5, 9.5, 17], [-1, 2.6, 0], 1.2);

    // Вятърни ивици, докато облакът пътува.
    const windLines = [];
    function windOn() {
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
      for (let i = 0; i < 9; i++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.04), m);
        l.userData = { ph: i / 9, y: 3.6 + (i % 3) * 0.9, z: -2 + (i % 4) * 1.2 };
        scene.add(l);
        windLines.push(l);
      }
      const stopW = stage.tick((dt2, t) => {
        for (const l of windLines) {
          const u = l.userData;
          const k = (t * 0.35 + u.ph) % 1;
          l.position.set(-8 + k * 16, u.y + Math.sin(k * 6) * 0.2, u.z);
          l.scale.x = Math.sin(k * Math.PI);
        }
      });
      return () => { stopW(); for (const l of windLines) scene.remove(l); windLines.length = 0; };
    }

    ctrl.querySelector('.wc-wind').addEventListener('click', () => {
      if (phase === 'evap') { shell.msg('Облакът е още малък. Нека първо събере повече капчици.', 'bad'); return; }
      if (phase !== 'full') return;
      phase = 'wind';
      mark();
      clearTip();
      shell.msg('');
      const stopWind = windOn();
      moveCloud(CLOUD_MTN, 3.2);
      stage.flyTo(narrow() ? [2, 11, 21] : [1.5, 8.5, 15], [3, 3, -1.5], 3.2);
      cloudMove.onDone = () => {
        stopWind();
        phase = 'atMtn';
        mark();
        sayAt('mountain', '<b>Над планината</b><br>Въздухът се издига по склона и се охлажда още. Капчиците в облака се сливат, стават по-големи и тежки.', 'wide');
        shell.msg('Облакът е над планината. Пусни валежа.', 'good');
      };
    });
    ctrl.querySelector('.wc-rain').addEventListener('click', () => {
      if (phase === 'evap') {
        mistakes++;
        upScore();
        sayAt('cloud', '✘ Капчиците в облака са още малко и са много леки — въздухът ги държи горе. Валеж пада, когато се съберат много капчици и натежат.', 'bad');
        shell.msg(mistakes >= 2 ? 'Подсказка: гледай лентата „Капчици в облака“ — трябва да стигне 100%.' : 'Още е рано за валеж.', 'bad');
        return;
      }
      if (phase === 'full') {
        shell.msg('Може да вали и над морето, но нека видим как водата стига до сушата. Първо пусни вятъра.', 'bad');
        return;
      }
      if (phase !== 'atMtn') return;
      phase = 'rain';
      mark();
      clearTip();
      shell.msg('');
      sim.precip = 'rain';
      sim.precipLeft = 4.5;
      const startFill = fill;
      const stopDrain = stage.tick((dt2) => { fill = Math.max(0.25, fill - dt2 * (startFill - 0.25) / 4.5); updFill(); });
      later(1.2, () => { riverBoost = 1.2; gwBoost = 1; });
      later(2, () => sayAt('river', '<b>Валежът се стича</b><br>Водата се стича по склоновете в реката. Реката тече надолу и я връща в морето.', 'wide'));
      sim.onPrecipEnd = () => {
        stopDrain();
        phase = 'flow';
        mark();
        stage.flyTo(narrow() ? [2, 5, 24] : [2.5, 3.2, 17], [1.5, -0.2, 4], 1.6);
        later(1.6, () => sayAt('ground', '<b>Подземни води</b><br>Част от водата попива в земята. Под земята тя бавно тече към реките, езерата и морето.', 'wide'));
        later(5.5, () => {
          phase = 'done';
          mark();
          overview();
          sayAt('sea', '<b>Кръгът се затвори!</b><br>Водата отново е в морето. Слънцето пак ще я изпари — и всичко започва отначало.', 'good');
          askWhere();
        });
      };
    });

    function askWhere() {
      shell.task(`<p><b>Къде отиде водата от валежа?</b> Избери всички верни отговори.</p>
        <div class="choices wc-where">
          <button class="choice" data-v="river">Стече се в реката</button>
          <button class="choice" data-v="ground">Попи в земята и стана подземна вода</button>
          <button class="choice" data-v="sea">Върна се в морето</button>
          <button class="choice" data-v="gone">Изчезна завинаги</button>
        </div>`);
      const picked = new Set();
      container.querySelectorAll('.wc-where .choice').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        if (picked.has(b.dataset.v)) picked.delete(b.dataset.v); else picked.add(b.dataset.v);
        b.classList.toggle('on');
      }));
      const c = shell.setControls('<button class="btn primary">Провери</button>');
      c.querySelector('button').addEventListener('click', () => {
        const good = ['river', 'ground', 'sea'];
        const ok = good.every((v) => picked.has(v)) && !picked.has('gone');
        if (!ok) {
          mistakes++;
          upScore();
          if (picked.has('gone')) shell.msg('Водата в природата не изчезва — тя само се променя и пътува. Опитай пак.', 'bad');
          else shell.msg('Не си избрал всички места. Спомни си какво видя — на повърхността и под земята.', 'bad');
          return;
        }
        container.querySelectorAll('.wc-where .choice').forEach((b) => { b.disabled = true; b.classList.add(b.dataset.v === 'gone' ? 'x' : 'right'); });
        shell.msg('Вярно! Водата не се губи — тя се движи в кръг.', 'good');
        scores.push(stepScore(mistakes, 3));
        const c2 = shell.setControls('<button class="btn primary">Напред →</button>');
        c2.querySelector('button').addEventListener('click', step3);
      });
    }
  }

  // ---------- 3. Подреди етапите ----------
  let tags = [];
  function makeTag(st, n) {
    const g = new THREE.Group();
    const txt = n ? `${n}. ${st.label}` : st.label;
    const s = labelSprite(txt, n ? { size: 0.5, color: '#fff', bg: '#1fab54', border: '#14843f' } : { size: 0.5, color: '#1b2a3a', bg: 'rgba(255,255,255,0.95)', border: '#1865f2' });
    g.add(s);
    stage.steadyLabel(s, 20);
    return g;
  }
  const TAG_POS = {
    evap: new THREE.Vector3(-7.2, 1.9, 2.2),
    cond: new THREE.Vector3(5.4, 7.6, -2.4),
    precip: new THREE.Vector3(3.4, 3.4, -1.8),
    runoff: new THREE.Vector3(-1.2, 1.3, 3.2),
  };
  const ARROW_PTS = {
    evap: new THREE.Vector3(-6.4, 2.6, 1.2), cond: new THREE.Vector3(3.6, 6.4, -2.2),
    precip: new THREE.Vector3(4.6, 2.2, -1.5), runoff: new THREE.Vector3(-2.4, 0.9, 2.6),
  };
  function placeTags(done) {
    for (const t of tags) scene.remove(t);
    tags = STAGES.map((st) => {
      const i = done.indexOf(st.id);
      const g = makeTag(st, i >= 0 ? i + 1 : 0);
      g.position.copy(TAG_POS[st.id]);
      g.userData.pickId = 'tag-' + st.id;
      scene.add(g);
      addHitBox(g, 0.9);
      return g;
    });
  }
  function step3() {
    shell.step(2);
    clearTip();
    showPlaceLabels(false);
    menu.show(false);
    sim.feedCloud = false;
    sim.evapRate = 9;
    sunPower = 0.6;
    fill = 1;
    if (cloud.position.distanceTo(CLOUD_MTN) > 0.1) moveCloud(CLOUD_MTN, 1);
    // Лек дъжд над планината през цялата стъпка.
    sim.precip = 'rain'; sim.precipLeft = 9999;
    riverBoost = 0.5;
    let mistakes = 0;
    const done = [];
    placeTags(done);
    overview();
    const drawTask = () => {
      shell.task(`<p>Водата прави кръг. <b>Кликни етапите по ред</b>, като започнеш от морето.</p>
        <p>Редът: <b>${done.length ? done.map((id) => esc(STAGES.find((s) => s.id === id).label)).join(' → ') : '—'}</b></p>`);
      shell.score(`Подредени: ${done.length} от ${STAGES.length} · грешки: ${mistakes}`);
    };
    drawTask();
    shell.setControls('');
    clickHandler = (id) => {
      if (!id || !id.startsWith('tag-')) return;
      const sid = id.slice(4);
      if (done.includes(sid)) return;
      const want = STAGES[done.length];
      const st = STAGES.find((s) => s.id === sid);
      const g = tags[STAGES.indexOf(st)];
      if (sid !== want.id) {
        mistakes++;
        const hint = done.length === 0
          ? 'Кръговратът започва в морето, когато слънцето нагрее водата.'
          : `Помисли какво става с водата точно след „${STAGES[done.length - 1].label}“.`;
        say(g, `✘ Не още. ${esc(hint)}`, { lift: 0.5, cls: 'bad' });
        shell.msg(mistakes >= 3 ? `Подсказка: ${want.why}` : 'Не е този етап.', 'bad');
        drawTask();
        return;
      }
      done.push(sid);
      if (done.length > 1) {
        const prev = done[done.length - 2];
        const a = arrowBetween(ARROW_PTS[prev], ARROW_PTS[sid], 0xff8f00, 1.0);
        scene.add(a); arrows.push(a);
      }
      placeTags(done);
      say(tags[STAGES.indexOf(st)], `✔ <b>${esc(st.label)}</b><br>${esc(st.why)}`, { lift: 0.5, cls: 'good' });
      shell.msg('Вярно!', 'good');
      drawTask();
      if (done.length === STAGES.length) {
        const a = arrowBetween(ARROW_PTS.runoff, ARROW_PTS.evap, 0xff8f00, 0.8);
        scene.add(a); arrows.push(a);
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0x2f9bff, emissive: 0x1e6fd0, emissiveIntensity: 0.5 }));
        drop.scale.y = 1.25;
        scene.add(drop);
        loopDrop = { mesh: drop, k: 0 };
        later(1, () => askSun());
      }
    };
    function askSun() {
      shell.task(`<p>Кръгът се затвори! Една капка може да обиколи този път много пъти.</p>
        <p><b>Какво кара водата да се изпарява и задвижва целия кръговрат?</b> Кликни върху него в сцената.</p>`);
      shell.msg('');
      let tries = 0;
      clickHandler = (id) => {
        if (!id) return;
        if (id === 'sun') {
          sayAt('sun', '✔ <b>Слънцето!</b> Неговата топлина изпарява водата. Без Слънцето кръговратът ще спре.', 'good');
          shell.msg('Вярно!', 'good');
          scores.push(stepScore(mistakes, 3));
          clickHandler = null;
          const c = shell.setControls('<button class="btn primary">Напред →</button>');
          c.querySelector('button').addEventListener('click', step4);
          return;
        }
        mistakes++; tries++;
        shell.score(`Грешки: ${mistakes}`);
        const why = id === 'sea' ? 'Морето дава водата, но нещо трябва да я нагрее.'
          : id === 'cloud' || id === 'tag-cond' ? 'Облакът се получава, след като водата вече се е изпарила.'
            : 'Това не нагрява водата.';
        shell.msg(`${why}${tries >= 2 ? ' Погледни нагоре в небето.' : ''}`, 'bad');
      };
    }
  }

  // ---------- 4. Дъжд, сняг или град? ----------
  function kindFor(temp, st) {
    if (temp <= 0) return 'snow';
    if (st) return 'hail';
    return 'rain';
  }
  function step4() {
    shell.step(3);
    clearTip();
    clickHandler = null;
    for (const t of tags) scene.remove(t);
    tags = [];
    for (const a of arrows) scene.remove(a);
    arrows = [];
    if (loopDrop) { scene.remove(loopDrop.mesh); loopDrop = null; }
    sim.precip = null; sim.precipLeft = 0;
    sim.evapRate = 4;
    let mistakes = 0;
    let temp = 15;
    let stormOn = false;
    let round = 0;
    fill = 1;
    stage.flyTo(narrow() ? [2.5, 8.5, 17] : [1.5, 6.8, 12.5], [5, 3.2, -2.5], 1.2);
    const fmt = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + ' °C';
    const stormTarget = () => (stormOn ? 1 : 0);
    const stopStorm = stage.tick((dt) => { storm += (stormTarget() - storm) * Math.min(1, dt * 2); });
    step4.stop = stopStorm;
    const render = () => {
      const R1 = round === 0;
      const html = R1
        ? `<p><b>Задача 1.</b> Направи така, че в планината да <b>завали сняг</b>. Нагласи температурата на въздуха и натисни „Валеж“.</p>`
        : round === 1
          ? `<p><b>Задача 2.</b> Лято е, въздухът е ${fmt(temp)}, облакът е обикновен.</p><p><b>Какво ще падне?</b></p>${pickHtml()}`
          : round === 2
            ? `<p><b>Задача 3.</b> Горещ летен ден, ${fmt(temp)}. Над планината расте висок тъмен <b>буреносен облак</b> с мълнии.</p><p><b>Какво може да падне от него?</b></p>${pickHtml()}`
            : '<p>Сега знаеш трите основни вида валежи: <b>дъжд</b>, <b>сняг</b> и <b>град</b>. Можеш да пробваш още, преди да видиш резултата.</p>';
      shell.task(html);
      if (round === 1 || round === 2) {
        container.querySelectorAll('.wc-pick .choice').forEach((b) => b.addEventListener('click', () => predict(b)));
      }
    };
    const pickHtml = () => `<div class="choices wc-pick">${Object.entries(KINDS).map(([k, v]) => `<button class="choice" data-v="${k}"><span>${v.icon}</span>${v.label}</button>`).join('')}</div>`;
    const ctrl = shell.setControls(`<div class="wc-ctrl">
      <label class="wc-lbl">🌡️ Температура в планината <output class="tv"></output>
        <input class="slider wc-temp" type="range" min="-10" max="30" step="1" value="15"></label>
      <div class="row"><button class="btn wc-storm">⛈️ Буреносен облак</button><button class="btn primary wc-go">🌧️ Валеж</button></div></div>`);
    const sl = ctrl.querySelector('.wc-temp');
    const tv = ctrl.querySelector('.tv');
    const stBtn = ctrl.querySelector('.wc-storm');
    const go = ctrl.querySelector('.wc-go');
    const updTemp = () => {
      temp = +sl.value;
      tv.textContent = fmt(temp);
      setTempTag(`🌡️ ${fmt(temp)}`);
    };
    sl.addEventListener('input', updTemp);
    updTemp();
    stBtn.addEventListener('click', () => { stormOn = !stormOn; stBtn.classList.toggle('on', stormOn); });
    const setLocked = (on) => { sl.disabled = on; stBtn.disabled = on; go.disabled = on; };
    const upScore = () => shell.score(`Задача ${Math.min(3, round + 1)} от 3 · грешки: ${mistakes}`);
    upScore();
    render();

    const EXPLAIN = {
      snow: '<b>❄️ Сняг</b><br>Когато въздухът е под 0 °C, водата в облака замръзва в ледени кристалчета. Те се слепват в снежинки и падат, без да се стопят.',
      rain: '<b>🌧️ Дъжд</b><br>Когато въздухът е над 0 °C, падат капки течна вода. Дори снежинките горе в облака се стопяват, докато падат.',
      hail: '<b>🧊 Град</b><br>В буреносния облак горе е много студено. Силният вятър в него вдига капките нагоре-надолу и те замръзват слой след слой — стават ледени топчета. Затова град пада най-често лете, при буря.',
    };
    function fall(kind, dur = 4.5) {
      sim.precip = kind;
      sim.precipLeft = dur;
      if (kind === 'snow') snowTarget = 1.6;
      if (kind === 'rain' || kind === 'hail') later(1.5, () => { riverBoost = Math.max(riverBoost, 0.9); gwBoost = 0.8; });
    }
    go.addEventListener('click', () => {
      if (sim.precip) return;
      const kind = kindFor(temp, stormOn);
      clearTip();
      fall(kind);
      setLocked(true);
      sim.onPrecipEnd = () => {
        setLocked(false);
        if (round !== 0) return;
        if (kind === 'snow') {
          say(mtnAnchor, '✔ ' + EXPLAIN.snow, { lift: 0.8, cls: 'good wide' });
          shell.msg('Браво! Завали сняг.', 'good');
          round = 1;
          later(1.2, nextRound);
        } else {
          mistakes++;
          upScore();
          say(mtnAnchor, kind === 'hail'
            ? `✘ Падна град, а не сняг. При ${esc(fmt(temp))} и буря водата замръзва само горе в облака. За сняг трябва целият въздух да е студен.`
            : `✘ Падна дъжд. При ${esc(fmt(temp))} снежинките се стопяват, докато падат. Опитай с по-студен въздух.`, { lift: 0.8, cls: 'bad wide' });
          shell.msg(mistakes >= 2 ? 'Подсказка: водата замръзва при 0 °C. Плъзни температурата под нулата.' : 'Не завали сняг. Пробвай пак.', 'bad');
        }
      };
    });
    function animateTemp(to, dur, onDone) {
      const from = +sl.value;
      let k = 0;
      const stop = stage.tick((dt) => {
        k = Math.min(1, k + dt / dur);
        sl.value = Math.round(from + (to - from) * k);
        updTemp();
        if (k >= 1) { stop(); if (onDone) onDone(); }
      });
    }
    function nextRound() {
      clearTip();
      setLocked(true);
      go.hidden = true;
      if (round === 1) {
        stormOn = false; stBtn.classList.remove('on');
        // Затопля се: снегът се топи и водата тече в реката.
        animateTemp(20, 2.5);
        snowTarget = SNOW_BASE + 0.25;
        later(1.2, () => { riverBoost = 1.1; say(mtnAnchor, '☀️ Затопли се. Снегът се топи и водата от него тече в реката.', { lift: 0.8 }); });
      } else if (round === 2) {
        animateTemp(27, 1.5);
        stormOn = true; stBtn.classList.add('on');
      }
      render();
      upScore();
    }
    function predict(btn) {
      const want = round === 1 ? 'rain' : 'hail';
      const v = btn.dataset.v;
      container.querySelectorAll('.wc-pick .choice').forEach((b) => {
        b.disabled = true;
        if (b.dataset.v === want) b.classList.add('right');
        else if (b === btn) b.classList.add('wrong');
      });
      const ok = v === want;
      if (!ok) { mistakes++; upScore(); }
      shell.msg(ok ? 'Позна! Гледай.' : `Не е ${KINDS[v].label.toLowerCase()}. Гледай какво пада.`, ok ? 'good' : 'bad');
      clearTip();
      fall(want, want === 'hail' ? 5 : 4.5);
      sim.onPrecipEnd = () => {
        say(mtnAnchor, (ok ? '✔ ' : '') + EXPLAIN[want], { lift: 0.8, cls: (ok ? 'good ' : '') + 'wide' });
        round++;
        later(0.5, () => {
          if (round === 2) { nextRound(); return; }
          // Край: свободна игра и резултат.
          stormOn = false; stBtn.classList.remove('on');
          setLocked(false);
          go.hidden = false;
          render();
          shell.score(`Грешки: ${mistakes}`);
          scores.push(stepScore(mistakes, 2));
          const row = document.createElement('div');
          row.className = 'row';
          row.innerHTML = '<button class="btn primary wc-end">Виж резултата</button>';
          ctrl.appendChild(row);
          row.querySelector('button').addEventListener('click', () => {
            clearTip();
            setTempTag(null);
            const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
            shell.finish(ratio, onComplete, restart);
          });
        });
      };
    }
  }

  function restart() {
    clearTimers();
    clearTip();
    setTempTag(null);
    if (step4.stop) { step4.stop(); step4.stop = null; }
    for (const t of tags) scene.remove(t);
    tags = [];
    for (const a of arrows) scene.remove(a);
    arrows = [];
    if (loopDrop) { scene.remove(loopDrop.mesh); loopDrop = null; }
    for (const p of [rainP, snowP, hailP, flowP, vapour]) p.clear();
    sim.precip = null; sim.precipLeft = 0; sim.onPrecipEnd = null; sim.onVapour = null;
    storm = 0; fill = 0.25; sunPower = 0.35; riverBoost = 0; gwBoost = 0;
    snowTarget = SNOW_BASE;
    cloudMove = null;
    cloud.position.copy(CLOUD_SEA);
    scores.length = 0;
    step1();
  }

  step1();
  return { dispose() { clearTimers(); stage.dispose(); } };
}
