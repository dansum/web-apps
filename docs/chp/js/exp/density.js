// 6.1.5 „Плътност; плаване и потъване“ — 3D лаборатория с везна, мензура и аквариум.
// Стъпки: опознай → измери и пресметни ρ = m / V → плава или потъва? → лодка от пластилин и яйце в солена вода.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const fmt = (x, d = 2) => String(+x.toFixed(d)).replace('.', ',');
const num = (s) => parseFloat(String(s).trim().replace(',', '.'));

// Маса (g) и обем (cm³) — числата са подбрани така, че плътностите да са реалните.
const OBJ = [
  { id: 'wood', label: 'Дървено блокче', short: 'Дърво', icon: '🪵', m: 30, V: 50, sub: 'дърво (бор)',
    note: 'Блокче от борово дърво. Изглежда голямо, но е леко.' },
  { id: 'bolt', label: 'Железен болт', short: 'Болт', icon: '🔩', m: 78, V: 10, sub: 'желязо',
    note: 'Малък, но тежък болт от желязо.' },
  { id: 'al', label: 'Алуминиево кубче', short: 'Алуминий', icon: '🥫', m: 54, V: 20, sub: 'алуминий',
    note: 'Кубче от алуминий — лек метал, от който се правят кутийки за напитки и самолети.' },
  { id: 'ice', label: 'Кубче лед', short: 'Лед', icon: '🧊', m: 23, V: 25, sub: 'лед',
    note: 'Замръзнала вода. Ледът заема повече място от водата, от която е направен.' },
  { id: 'cork', label: 'Корк', short: 'Корк', icon: '🍾', m: 6, V: 25, sub: 'корк',
    note: 'Тапа от корк — кората на корков дъб. Пълна е с мънички въздушни мехурчета.' },
  { id: 'clay', label: 'Пластилин', short: 'Пластилин', icon: '🟢', m: 42, V: 30, sub: 'пластилин',
    note: 'Топче пластилин. От него може да се моделира всякаква форма.' },
  { id: 'egg', label: 'Сурово яйце', short: 'Яйце', icon: '🥚', m: 58, V: 55, sub: 'яйце',
    note: 'Сурово кокоше яйце. Ще го използваме накрая.' },
];
for (const o of OBJ) o.rho = o.m / o.V;
const BY = Object.fromEntries(OBJ.map((o) => [o.id, o]));
const INSTR = {
  balance: { label: 'Везна', icon: '⚖️', note: '<b>Електронна везна.</b> Измерва масата на тялото в грамове (g).' },
  cyl: { label: 'Мензура', icon: '🧪', note: '<b>Мензура с вода.</b> Измерва обем: 1 ml = 1 cm³. Обемът на тяло е колко се покачва водата, когато тялото е <b>изцяло</b> под водата.' },
  tank: { label: 'Аквариум', icon: '🐟', note: '<b>Аквариум с вода.</b> Тук ще проверим кое плава и кое потъва. Рибката не се притеснява!' },
  poster: { label: 'Таблица с плътности', icon: '📋', note: '<b>Таблица.</b> Плътността ρ показва каква е масата на 1 cm³ от веществото: <b>ρ = m / V</b>. Водата има плътност <b>1 g/cm³</b> — 1 cm³ вода тежи 1 g.' },
};
// Плътност на солена вода: s лъжички (по 18 g) сол в 1 l вода.
const brine = (s) => 1 + 0.71 * ((18 * s) / (1000 + 18 * s));

function injectStyle() {
  if (document.getElementById('density-style')) return;
  const s = document.createElement('style');
  s.id = 'density-style';
  s.textContent = `
  .density-mag { padding:4px 6px 2px; }
  .density-mag svg { display:block; }
  .density-in { display:grid; gap:6px; margin-top:6px; }
  .density-in .num input { width:6em; }
  .density-tbl { width:100%; border-collapse:collapse; font-size:.85rem; margin-top:6px; }
  .density-tbl td, .density-tbl th { border-bottom:1px solid #e3e8ef; padding:4px 3px; text-align:left; }
  .density-tbl tr.right td { background:#e9f8ef; } .density-tbl tr.wrong td { background:#fdeceb; }
  .density-pb { display:flex; gap:4px; }
  .density-pb button { font:inherit; font-size:.8rem; font-weight:700; padding:3px 7px; border-radius:7px; border:2px solid #c7d3e0; background:#fff; cursor:pointer; }
  .density-pb button.on { border-color:#1865f2; background:#f0f5ff; }
  .density-pb button:disabled { cursor:default; }
  .density-read { font-size:.85rem; background:#f1f6fd; border-radius:8px; padding:6px 8px; margin-top:6px; }
  `;
  document.head.appendChild(s);
}

function glassMat(opacity = 0.22) {
  return new THREE.MeshStandardMaterial({ color: 0xe6f4ff, transparent: true, opacity, roughness: 0.06, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
}
function waterMat(opacity = 0.55) {
  return new THREE.MeshStandardMaterial({ color: 0x5fb4e6, transparent: true, opacity, roughness: 0.15, depthWrite: false, side: THREE.DoubleSide });
}
function canvasTex(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { c, x: c.getContext('2d'), t };
}

// Модели на телата. h — височина (за изтласкващата сила).
function objModel(o) {
  const g = new THREE.Group();
  let h = 0.3;
  if (o.id === 'wood') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.34), mat(0xc8955a));
    g.add(b);
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.BoxGeometry(0.505, 0.012, 0.012), mat(0xa06a35));
      ring.position.set(0, -0.1 + i * 0.065, 0.171);
      g.add(ring);
    }
    h = 0.3;
  } else if (o.id === 'bolt') {
    const steel = mat(0x8c939b, { metalness: 0.8, roughness: 0.35 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.36, 12), steel);
    shaft.rotation.z = Math.PI / 2;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 6), steel);
    head.rotation.z = Math.PI / 2;
    head.position.x = -0.2;
    g.add(shaft, head);
    for (let i = 0; i < 7; i++) {
      const th = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.008, 4, 12), steel);
      th.rotation.y = Math.PI / 2;
      th.position.x = -0.05 + i * 0.033;
      g.add(th);
    }
    h = 0.2;
  } else if (o.id === 'al') {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.27, 0.27), mat(0xd5dbe1, { metalness: 0.7, roughness: 0.3 })));
    h = 0.27;
  } else if (o.id === 'ice') {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.29, 0.29), new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.75, roughness: 0.05 })));
    h = 0.29;
  } else if (o.id === 'cork') {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.3, 18), mat(0xc79a62, { roughness: 1 })));
    h = 0.3;
  } else if (o.id === 'clay') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 14), mat(0x43a047, { roughness: 0.9 }));
    g.add(m);
    g.userData.clayMesh = m;
    h = 0.38;
  } else if (o.id === 'egg') {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), mat(0xf3e3c8, { roughness: 0.6 }));
    e.scale.set(1, 1.3, 1);
    g.add(e);
    h = 0.4;
  }
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  const lbl = labelSprite(o.short, { size: 0.18 });
  lbl.position.y = h / 2 + 0.2;
  g.add(lbl);
  g.userData.label = lbl;
  g.userData.h = h;
  addHitBox(g, 0.55);
  return g;
}

export function mount(container, { onComplete }) {
  injectStyle();
  const STEPS = ['Опознай лабораторията', 'Измери плътността', 'Плава или потъва?', 'Лодка и яйце'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xe6edf3, camPos: [0, 5, 9], target: [0, 0.7, 0], shadows: true, maxDistance: 20, minDistance: 2,
  });
  const { scene, camera } = stage;
  const narrow = camera.aspect < 1.15;

  let rdt = 0.016;
  let lastNow = performance.now();
  stage.tick(() => { const n = performance.now(); rdt = Math.min(0.25, Math.max(0.001, (n - lastNow) / 1000)); lastNow = n; });
  const phase = (dur, fn) => new Promise((res) => {
    let k = 0;
    const stop = stage.tick((dt, t) => {
      k = Math.min(1, k + rdt / dur);
      if (fn) fn(k, rdt, t);
      if (k >= 1) { stop(); res(); }
    });
  });

  // Разположение.
  const L = narrow
    ? { bench: 6.4, balance: [-1.9, 0.15], cyl: [-0.55, 0.0], egg: [1.6, 0.15], tank: [0.5, -1.45], tankW: 3.2,
      tray: OBJ.map((o, i) => [-2.4 + i * 0.8, i % 2 ? 2.05 : 1.45]), poster: [-1.6, 2.35] }
    : { bench: 13, balance: [-3.6, -0.5], cyl: [-1.6, -0.5], egg: [0.6, -0.2], tank: [3.7, -0.6], tankW: 3.8,
      tray: OBJ.map((o, i) => [-5.2 + i * 0.85, i % 2 ? 1.95 : 1.4]), poster: [0.3, 2.45] };

  // ---------- стая ----------
  const bench = new THREE.Mesh(new THREE.BoxGeometry(L.bench, 0.3, 5.6), mat(0x3e4a55, { roughness: 0.6 }));
  bench.position.set(0, -0.15, 0.3);
  bench.receiveShadow = true;
  scene.add(bench);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(L.bench - 0.4, 2.6, 5.2), mat(0xd9e1e8));
  cab.position.set(0, -1.6, 0.3);
  scene.add(cab);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat(0xb7c2cb));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.9;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), mat(0xe9eef2));
  wall.position.set(0, 3, -2.6);
  scene.add(wall);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.25), mat(0x90caf9));
  stripe.position.set(0, 1.1, -2.59);
  scene.add(stripe);

  // Табло с плътностите (рисува се върху платно).
  const measured = {};
  const P = canvasTex(512, 600);
  function drawPoster() {
    const x = P.x;
    x.fillStyle = '#fffdf6'; x.fillRect(0, 0, 512, 600);
    x.strokeStyle = '#1865f2'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 590);
    x.fillStyle = '#12324f'; x.font = '800 38px system-ui, Arial'; x.fillText('Плътност ρ', 28, 60);
    x.font = '600 26px system-ui, Arial'; x.fillStyle = '#4a5b6c'; x.fillText('в g/cm³', 300, 60);
    const rows = [['Вода', '1,00', 1], ['Лед', '0,92'], ['Корк', '0,24'], ['Пластилин', '1,40'], ['Дърво (бор)', measured.wood], ['Алуминий', measured.al], ['Желязо', measured.bolt]];
    rows.forEach(([n, v, hl], i) => {
      const y = 120 + i * 66;
      if (hl) { x.fillStyle = '#dcefff'; x.fillRect(18, y - 44, 476, 60); }
      x.fillStyle = '#12324f'; x.font = '600 34px system-ui, Arial'; x.fillText(n, 32, y);
      x.font = '800 36px system-ui, Arial';
      x.fillStyle = v ? (hl ? '#0b5cad' : '#12324f') : '#d92916';
      x.fillText(v || '?', 360, y);
      x.fillStyle = '#e1e6ec'; x.fillRect(28, y + 14, 456, 2);
    });
    x.fillStyle = '#4a5b6c'; x.font = '600 24px system-ui, Arial'; x.fillText('ρ = m / V', 32, 575);
    P.t.needsUpdate = true;
  }
  drawPoster();
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.875), new THREE.MeshBasicMaterial({ map: P.t }));
  poster.position.set(L.poster[0], L.poster[1], -2.57);
  poster.userData.pickId = 'poster';
  scene.add(poster);

  // ---------- везна ----------
  const balance = new THREE.Group();
  const D = canvasTex(256, 96);
  let shownMass = 0;
  function drawDisplay(v) {
    D.x.fillStyle = '#16302a'; D.x.fillRect(0, 0, 256, 96);
    D.x.fillStyle = '#7dff9a'; D.x.font = '700 60px monospace'; D.x.textAlign = 'right';
    D.x.fillText(fmt(v, 1).includes(',') ? fmt(v, 1) : fmt(v, 1) + ',0', 200, 70);
    D.x.font = '700 40px monospace'; D.x.fillText('g', 245, 70);
    D.t.needsUpdate = true;
  }
  drawDisplay(0);
  {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 0.85), mat(0xeceff1, { roughness: 0.4 }));
    body.position.y = 0.12;
    const front = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.2), mat(0xcfd8dc));
    front.position.set(0, 0.1, 0.48);
    front.rotation.x = -0.5;
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshBasicMaterial({ map: D.t }));
    disp.position.set(0, 0.155, 0.53);
    disp.rotation.x = -0.5;
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 32), mat(0xb0bec5, { metalness: 0.7, roughness: 0.3 }));
    pan.position.y = 0.28;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10), mat(0x90a4ae));
    stem.position.y = 0.25;
    balance.add(body, front, disp, pan, stem);
    balance.position.set(L.balance[0], 0, L.balance[1]);
    balance.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    balance.userData.pickId = 'balance';
    balance.userData.toolId = 'balance';
    const lb = labelSprite('Везна', { size: 0.18, color: '#fff', bg: 'rgba(38,50,56,0.85)', border: 'rgba(38,50,56,0.85)' });
    lb.position.set(0, -0.05, 0.75);
    balance.add(lb);
    stage.steadyLabel(lb, 9);
    addHitBox(balance, 0.9);
    scene.add(balance);
  }
  const PAN_Y = 0.3;
  let massAnim = null;
  function setMass(m) {
    massAnim = { t: 0, m };
  }
  stage.tick(() => {
    if (!massAnim) return;
    massAnim.t += rdt;
    const v = massAnim.t < 0.7 && massAnim.m > 0 ? massAnim.m * (0.8 + Math.random() * 0.25) : massAnim.m;
    if (v !== shownMass) { shownMass = v; drawDisplay(v); }
    if (massAnim.t >= 0.7) massAnim = null;
  });

  // ---------- мензура ----------
  const CY = { r: 0.36, base: 0.08, k: 0.0072 }; // 1 ml → 0,0072 единици височина
  const cyl = new THREE.Group();
  const cylWater = new THREE.Mesh(new THREE.CylinderGeometry(CY.r - 0.015, CY.r - 0.015, 1, 32), waterMat(0.5));
  cylWater.geometry.translate(0, 0.5, 0);
  cylWater.renderOrder = 2;
  let cylLevel = 100; // ml
  {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.08, 6), glassMat(0.5));
    foot.position.y = 0.04;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(CY.r, CY.r, 2.0, 32, 1, true), glassMat(0.2));
    tube.position.y = CY.base + 1.0;
    tube.renderOrder = 3;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(CY.r, 0.015, 6, 32), glassMat(0.5));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = CY.base + 2.0;
    cylWater.position.y = CY.base;
    cyl.add(foot, tube, rim, cylWater);
    // деления: на всеки 10 ml черта, на всеки 50 — число
    const tickM = new THREE.MeshBasicMaterial({ color: 0x23415e });
    for (let v = 10; v <= 250; v += 10) {
      const big = v % 50 === 0;
      const t = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.16 : 0.09, 0.012, 0.005), tickM);
      t.position.set(-0.04, CY.base + v * CY.k, CY.r + 0.004);
      cyl.add(t);
      if (big) {
        const n = labelSprite(String(v), { size: 0.12, bg: 'rgba(255,255,255,0.0)', border: 'rgba(255,255,255,0)' });
        n.position.set(0.12, CY.base + v * CY.k, CY.r + 0.02);
        cyl.add(n);
      }
    }
    const ml = labelSprite('ml', { size: 0.12, bg: 'rgba(255,255,255,0)', border: 'rgba(255,255,255,0)' });
    ml.position.set(0.12, CY.base + 1.98, CY.r + 0.02);
    cyl.add(ml);
    cyl.position.set(L.cyl[0], 0, L.cyl[1]);
    cyl.userData.pickId = 'cyl';
    cyl.userData.toolId = 'cyl';
    const lb = labelSprite('Мензура', { size: 0.18, color: '#fff', bg: 'rgba(38,50,56,0.85)', border: 'rgba(38,50,56,0.85)' });
    lb.position.set(0, -0.05, 0.75);
    cyl.add(lb);
    stage.steadyLabel(lb, 9);
    addHitBox(cyl, 0.9);
    scene.add(cyl);
  }
  const cylSurface = () => CY.base + cylLevel * CY.k;

  // ---------- аквариум ----------
  const TK = { w: L.tankW, d: narrow ? 1.25 : 1.5, h: 1.55, floor: 0.16, water: 1.3 };
  const tank = new THREE.Group();
  const tankSurf = new THREE.Mesh(new THREE.PlaneGeometry(TK.w - 0.06, TK.d - 0.06, 24, 8), waterMat(0.45));
  tankSurf.rotation.x = -Math.PI / 2;
  tankSurf.position.y = TK.water;
  tankSurf.renderOrder = 2;
  const fishes = [];
  const bubbles = [];
  const plants = [];
  {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(TK.w, TK.h, TK.d), glassMat(0.16));
    glass.position.y = TK.h / 2;
    glass.renderOrder = 3;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: 0x7f97a8 }));
    edges.position.copy(glass.position);
    const body = new THREE.Mesh(new THREE.BoxGeometry(TK.w - 0.06, TK.water - 0.04, TK.d - 0.06), waterMat(0.28));
    body.position.y = (TK.water + 0.04) / 2;
    body.renderOrder = 1;
    const gravel = new THREE.Mesh(new THREE.BoxGeometry(TK.w - 0.06, TK.floor, TK.d - 0.06), mat(0xc2a878, { flat: true }));
    gravel.position.y = TK.floor / 2;
    tank.add(glass, edges, body, gravel, tankSurf);
    for (let i = 0; i < 18; i++) {
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05 + Math.random() * 0.04, 0), mat([0x9e9e9e, 0x8d6e63, 0xbcaaa4][i % 3], { flat: true }));
      st.position.set((Math.random() - 0.5) * (TK.w - 0.3), TK.floor, (Math.random() - 0.5) * (TK.d - 0.3));
      tank.add(st);
    }
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Group();
      const hgt = 0.5 + Math.random() * 0.5;
      for (let k = 0; k < 3; k++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.04, hgt, 5), mat(0x2e9d4f, { flat: true }));
        leaf.position.set((k - 1) * 0.05, hgt / 2, 0);
        leaf.rotation.z = (k - 1) * 0.2;
        p.add(leaf);
      }
      p.position.set(-TK.w / 2 + 0.25 + i * ((TK.w - 0.5) / 4), TK.floor, -TK.d / 2 + 0.2);
      p.userData.ph = i;
      tank.add(p);
      plants.push(p);
    }
    for (let i = 0; i < 2; i++) {
      const f = new THREE.Group();
      const col = [0xff8a3d, 0xffd54f][i];
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), mat(col));
      b.scale.set(1.5, 0.9, 0.55);
      const tail = new THREE.Group();
      const tl = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 4), mat(col));
      tl.rotation.z = Math.PI / 2;
      tl.position.x = -0.07;
      tail.add(tl);
      tail.position.x = -0.14;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), mat(0x111111));
      eye.position.set(0.1, 0.02, 0.045);
      f.add(b, tail, eye);
      f.userData = { tail, ph: i * 2.5, r: 0.35 + i * 0.2 };
      tank.add(f);
      fishes.push(f);
    }
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.06, 10), mat(0x546e7a));
    stone.position.set(TK.w / 2 - 0.25, TK.floor + 0.03, -TK.d / 2 + 0.25);
    tank.add(stone);
    for (let i = 0; i < 9; i++) {
      const bb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
      bb.userData.ph = i / 9;
      tank.add(bb);
      bubbles.push(bb);
    }
    tank.position.set(L.tank[0], 0, L.tank[1]);
    tank.userData.pickId = 'tank';
    tank.userData.toolId = 'tank';
    const lb = labelSprite('Аквариум с вода', { size: 0.18, color: '#fff', bg: 'rgba(38,50,56,0.85)', border: 'rgba(38,50,56,0.85)' });
    lb.position.set(0, -0.05, TK.d / 2 + 0.3);
    tank.add(lb);
    stage.steadyLabel(lb, 9);
    addHitBox(tank, 1);
    scene.add(tank);
  }
  const wave = (x, z, t) => Math.sin(x * 3 + t * 1.6) * 0.012 + Math.cos(z * 4 + t * 1.2) * 0.008;
  stage.tick((dt, t) => {
    const pos = tankSurf.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, wave(pos.getX(i), -pos.getY(i), t));
    pos.needsUpdate = true;
    for (const f of fishes) {
      const u = f.userData;
      const a = t * 0.35 + u.ph;
      const fx = Math.cos(a) * (TK.w / 2 - 0.45);
      const fz = Math.sin(a * 2) * (TK.d / 2 - 0.35) * 0.6;
      f.position.set(fx, 0.55 + u.r * 0.6 + Math.sin(t * 0.8 + u.ph) * 0.08, fz);
      const dx = -Math.sin(a) * (TK.w / 2 - 0.45); const dz = Math.cos(a * 2) * 2 * (TK.d / 2 - 0.35) * 0.6;
      f.rotation.y = Math.atan2(-dz, dx);
      u.tail.rotation.y = Math.sin(t * 9 + u.ph) * 0.5;
    }
    for (const b of bubbles) {
      const c = (t * 0.4 + b.userData.ph) % 1;
      b.position.set(TK.w / 2 - 0.25 + Math.sin(c * 12 + b.userData.ph * 9) * 0.03, TK.floor + 0.06 + c * (TK.water - TK.floor - 0.08), -TK.d / 2 + 0.25);
      b.scale.setScalar(0.6 + c * 0.6);
    }
    for (const p of plants) p.rotation.z = Math.sin(t * 0.9 + p.userData.ph) * 0.08;
  });

  // ---------- чаша за яйцето (стъпка 4) ----------
  const EJ = { r: 0.42, h: 1.4, water: 1.15 };
  const eggJar = new THREE.Group();
  const eggWater = new THREE.Mesh(new THREE.CylinderGeometry(EJ.r - 0.02, EJ.r - 0.02, EJ.water - 0.03, 32), waterMat(0.38));
  {
    const g1 = new THREE.Mesh(new THREE.CylinderGeometry(EJ.r, EJ.r, EJ.h, 32, 1, true), glassMat(0.2));
    g1.position.y = EJ.h / 2;
    g1.renderOrder = 3;
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(EJ.r, EJ.r, 0.03, 32), glassMat(0.4));
    bot.position.y = 0.015;
    eggWater.position.y = 0.03 + (EJ.water - 0.03) / 2;
    eggWater.renderOrder = 2;
    eggJar.add(g1, bot, eggWater);
    eggJar.position.set(L.egg[0], 0, L.egg[1]);
    eggJar.userData.pickId = 'eggjar';
    eggJar.userData.toolId = 'eggjar';
    const lb = labelSprite('Чаша с вода', { size: 0.18, color: '#fff', bg: 'rgba(38,50,56,0.85)', border: 'rgba(38,50,56,0.85)' });
    lb.position.set(0, -0.05, 0.7);
    eggJar.add(lb);
    stage.steadyLabel(lb, 9);
    eggJar.visible = false;
    scene.add(eggJar);
  }
  const saltGrains = [];
  for (let i = 0; i < 24; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), mat(0xffffff));
    s.visible = false;
    eggJar.add(s);
    saltGrains.push(s);
  }

  // ---------- телата ----------
  const objs = new Map();
  for (const o of OBJ) {
    const g = objModel(o);
    g.userData.pickId = o.id;
    g.userData.dragId = o.id;
    g.userData.o = o;
    g.userData.locked = true;
    scene.add(g);
    stage.steadyLabel(g.userData.label, 9);
    objs.set(o.id, g);
  }
  function homeOf(id) {
    const i = OBJ.findIndex((o) => o.id === id);
    const [x, z] = L.tray[i];
    return new V3(x, objs.get(id).userData.h / 2, z);
  }
  function resetObjects() {
    for (const [id, g] of objs) {
      g.position.copy(homeOf(id));
      g.rotation.set(0, 0, 0);
      g.visible = id !== 'egg' || true;
      g.userData.locked = true;
      g.userData.body = null;
    }
    setClayShape(0);
  }

  // ---------- физика: изтласкваща сила и затихване ----------
  // body: { where: 'tank' | 'cyl' | 'egg', v, rho, h, pin }
  const GR = 6; const DAMP = 3.2;
  function surfaceOf(b, x, z, t) {
    if (b.where === 'tank') return TK.water + wave(x, z, t);
    if (b.where === 'cyl') return cylSurface();
    return EJ.water;
  }
  function floorOf(b) { return b.where === 'tank' ? TK.floor : b.where === 'cyl' ? CY.base + 0.01 : 0.03; }
  function rhoW(b) { return b.where === 'egg' ? brine(saltNow) : 1; }
  let saltNow = 0;
  stage.tick((dt, t) => {
    const h = Math.min(rdt, 0.05);
    const steps = Math.max(1, Math.round(rdt / h));
    for (const [, g] of objs) {
      const b = g.userData.body;
      if (!b) continue;
      const parent = b.where === 'tank' ? tank : b.where === 'cyl' ? cyl : eggJar;
      for (let s = 0; s < steps; s++) {
        const surf = surfaceOf(b, g.position.x, g.position.z, t);
        const half = b.h / 2;
        const bottom = g.position.y - half;
        const sub = Math.min(b.h, Math.max(0, surf - bottom));
        b.f = sub / b.h;
        if (b.pin) {
          // тел натиска тялото изцяло под водата
          const want = surf - half - 0.06;
          g.position.y += (want - g.position.y) * Math.min(1, h * 6);
          b.v = 0;
          b.f = Math.min(1, Math.max(0, (surf - (g.position.y - half)) / b.h));
          continue;
        }
        // яйцето е почти „неутрално“ — усилваме разликата, за да се вижда движението (посоката е вярна)
        const gain = b.where === 'egg' ? 14 : 1;
        const a = GR * gain * ((b.f * rhoW(b)) / b.rho - 1) - (b.f > 0 ? DAMP : 0.2) * b.v;
        b.v += a * h;
        g.position.y += b.v * h;
        const fl = floorOf(b) + half;
        if (g.position.y < fl) { g.position.y = fl; if (b.v < 0) b.v = -b.v * 0.15; }
      }
      if (b.f > 0 && b.f < 1) g.rotation.z = Math.sin(t * 1.3 + g.position.x * 5) * 0.04;
      void parent;
    }
    // уровень в мензурата следва потопената част на тялото
    let disp = 0;
    for (const [, g] of objs) { const b = g.userData.body; if (b && b.where === 'cyl') disp += (b.f || 0) * g.userData.o.V; }
    cylLevel += (100 + disp - cylLevel) * Math.min(1, rdt * 5);
    if (Math.abs(100 + disp - cylLevel) < 0.02) cylLevel = 100 + disp;
    cylWater.scale.y = cylLevel * CY.k;
  });
  // Пуска тяло в съд: тялото става дете на съда.
  async function dropInto(g, where, x = 0, z = 0) {
    const parent = where === 'tank' ? tank : where === 'cyl' ? cyl : eggJar;
    const wp = g.getWorldPosition(new V3());
    const local = parent.worldToLocal(wp.clone());
    parent.add(g);
    g.position.copy(local);
    const top = where === 'tank' ? TK.h + 0.4 : where === 'cyl' ? CY.base + 2.25 : EJ.h + 0.35;
    const from = g.position.clone();
    const to = new V3(x, top, z);
    await phase(0.7, (k) => { g.position.lerpVectors(from, to, ease(k)); g.position.y += Math.sin(k * Math.PI) * 0.4; });
    const o = g.userData.o;
    g.userData.body = { where, v: -0.6, rho: where === 'egg' ? o.rho : g.userData.rhoOverride || o.rho, h: g.userData.h, f: 0 };
    splash(parent, x, z, where);
  }
  function takeOut(g) {
    const wp = g.getWorldPosition(new V3());
    g.userData.body = null;
    scene.add(g);
    g.position.copy(wp);
    g.rotation.set(0, 0, 0);
  }
  // Кръгове по водата при падане.
  const ripples = [];
  function splash(parent, x, z, where) {
    setTimeout(() => {
      const y = where === 'tank' ? TK.water + 0.01 : where === 'cyl' ? cylSurface() + 0.01 : EJ.water + 0.01;
      const r = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
      r.rotation.x = -Math.PI / 2;
      r.position.set(x, y, z);
      parent.add(r);
      ripples.push({ r, k: 0 });
    }, 250);
  }
  stage.tick(() => {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.k += rdt / 1.2;
      rp.r.scale.setScalar(1 + rp.k * 4);
      rp.r.material.opacity = 0.8 * (1 - rp.k);
      if (rp.k >= 1) { rp.r.parent.remove(rp.r); rp.r.geometry.dispose(); rp.r.material.dispose(); ripples.splice(i, 1); }
    }
  });

  // Тел за потапяне на плаващо тяло в мензурата.
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.6, 6), mat(0x546e7a, { metalness: 0.8 }));
  pin.visible = false;
  cyl.add(pin);
  stage.tick(() => {
    if (!pin.visible) return;
    const g = objs.get('wood');
    if (g.parent !== cyl) return;
    pin.position.set(0.05, g.position.y + g.userData.h / 2 + 0.8, 0.02);
  });

  // ---------- изглед ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.5, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.06;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, dur);
  }
  const overview = (dur) => (narrow ? fitView([0, 0.6, 0.2], 3.05, 2.3, 0.6, dur) : fitView([0, 0.7, 0.5], 5.9, 2.0, 0.5, dur));
  const labView = () => {
    const cx = (L.balance[0] + L.cyl[0]) / 2;
    if (narrow) fitView([-0.6, 0.9, 0.9], 2.1, 1.5, 0.45);
    else fitView([cx - 0.6, 0.9, 0.7], 2.7, 1.4, 0.42);
  };

  // ---------- балончета ----------
  let tip = null;
  function say(anchor, html, cls = '', lift = 0.4) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const anchorOf = (id) => (id === 'balance' ? [balance, 0.6] : id === 'cyl' ? [cyl, 2.4] : id === 'tank' ? [tank, TK.h + 0.25] : id === 'poster' ? [poster, 1.0] : [objs.get(id), objs.get(id).userData.h / 2 + 0.35]);
  function sayAt(id, html, cls = '') { const [a, l] = anchorOf(id); say(a, html, cls, l); }

  // Лупа до мензурата.
  const magAnchor = new V3();
  let mag = null;
  let magShown = -1;
  function magSVG(level) {
    const W = 118; const Hh = 130; const ppm = 5.5; const cy = Hh / 2;
    let s = `<svg width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}"><rect x="0" y="0" width="${W}" height="${Hh}" rx="8" fill="#f7fbff"/>`;
    const wy = cy;
    s += `<path d="M0 ${wy - 3} Q ${W / 2} ${wy + 4} ${W} ${wy - 3} L ${W} ${Hh} L 0 ${Hh} Z" fill="#8fd0f5" opacity="0.75"/>`;
    for (let v = Math.ceil(level - 12); v <= Math.floor(level + 12); v++) {
      const y = cy - (v - level) * ppm;
      const len = v % 10 === 0 ? 30 : v % 5 === 0 ? 22 : 12;
      s += `<line x1="6" x2="${6 + len}" y1="${y}" y2="${y}" stroke="#23415e" stroke-width="${v % 5 === 0 ? 1.8 : 1}"/>`;
      if (v % 5 === 0) s += `<text x="${42}" y="${y + 5}" font-size="14" font-weight="700" fill="#23415e" font-family="system-ui,Arial">${v}</text>`;
    }
    s += `<text x="${W - 26}" y="16" font-size="11" fill="#4a5b6c" font-family="system-ui,Arial">ml</text></svg>`;
    return s;
  }
  function showMag(on) {
    if (on && !mag) { mag = stage.bubble(magAnchor, '', { lift: 0, cls: 'density-mag' }); magShown = -1; }
    if (!on && mag) { mag.remove(); mag = null; }
  }
  stage.tick(() => {
    if (!mag) return;
    cyl.localToWorld(magAnchor.set(CY.r + 0.75, cylSurface() - 0.45, 0));
    const lv = Math.round(cylLevel * 2) / 2;
    if (lv !== magShown) { magShown = lv; mag.set('<b style="font-size:.75rem">🔍 Лупа</b>' + magSVG(cylLevel)); }
  });

  // ---------- влачене ----------
  let lastPtr = null;
  const ptr = (ev) => { lastPtr = { clientX: ev.clientX, clientY: ev.clientY }; };
  stage.renderer.domElement.addEventListener('pointermove', ptr);
  stage.renderer.domElement.addEventListener('pointerdown', ptr);
  const targets = [balance, cyl, tank, eggJar];
  function targetUnder(pos) {
    if (lastPtr) {
      const hit = stage.pickAt(lastPtr, 'toolId', targets);
      if (hit) return hit.root.userData.toolId;
    }
    const tp = tank.position;
    if (Math.abs(pos.x - tp.x) < TK.w / 2 + 0.2 && Math.abs(pos.z - tp.z) < TK.d / 2 + 0.6) return 'tank';
    if (Math.hypot(pos.x - balance.position.x, pos.z - balance.position.z) < 0.7) return 'balance';
    if (Math.hypot(pos.x - cyl.position.x, pos.z - cyl.position.z) < 0.6) return 'cyl';
    return null;
  }
  function glide(g, to, dur = 0.45) {
    const from = g.position.clone();
    return phase(dur, (k) => { g.position.lerpVectors(from, to, ease(k)); g.position.y += Math.sin(k * Math.PI) * 0.3; });
  }

  let clickHandler = null;
  let menuHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  const MENU_ITEMS = [
    ...['balance', 'cyl', 'tank', 'poster'].map((id) => ({ id, label: INSTR[id].label, icon: INSTR[id].icon })),
    ...OBJ.map((o) => ({ id: o.id, label: o.label, icon: o.icon })),
  ];
  const menu = cornerMenu(stage, { title: 'Уреди и тела', items: MENU_ITEMS, onSelect: (id) => menuHandler && menuHandler(id) });

  const scores = [];
  let stopDrag = null;
  const noteOf = (id) => (INSTR[id] ? `<b>${esc(INSTR[id].icon)}</b> ${INSTR[id].note}` : `<b>${esc(BY[id].icon)} ${esc(BY[id].label)}</b><br>${esc(BY[id].note)} Маса: ? Обем: ?`);

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    menu.show(true);
    menu.setActive(null);
    const seen = new Set();
    const NEED = 6;
    shell.task(`<p>В тази лаборатория ще разберем защо едни тела плават, а други потъват.</p>
      <p><b>Разгледай поне ${NEED} неща</b> — уредите и телата. Кликни върху тях или ги избери от менюто в ъгъла.</p>
      <p class="small">Плътност: <b>ρ = m / V</b> (маса, разделена на обем).</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата маса</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const nx = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => overview());
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${MENU_ITEMS.length}`);
    upd();
    const visit = (id) => {
      const [a] = anchorOf(id);
      const big = id === 'tank' || id === 'poster';
      stage.focusOn(a, { dist: big ? 4.2 : INSTR[id] ? 3.2 : 2.4, height: big ? 0.8 : 1.0, lift: id === 'cyl' ? 0.9 : id === 'tank' ? 0.6 : 0.2, keepFollow: false });
      sayAt(id, noteOf(id).replace(' Маса: ? Обем: ?', ''), 'wide');
      seen.add(id); menu.mark(id); menu.setActive(id); upd();
      if (seen.size >= NEED) { nx.disabled = false; shell.msg('Браво! Можеш да продължиш.', 'good'); }
    };
    clickHandler = (id) => { if (!id) return clearTip(); if (MENU_ITEMS.some((m) => m.id === id)) visit(id); };
    menuHandler = visit;
    nx.addEventListener('click', () => { menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Измери ----------
  const MEASURE = ['al', 'bolt', 'wood'];
  function step2() {
    shell.step(1);
    clearTip();
    menu.show(false);
    menuHandler = null;
    labView();
    let mistakes = 0;
    let idx = 0;
    let state = 'scale';
    let wrongTries = 0;
    showMag(true);
    const curG = () => objs.get(MEASURE[idx]);
    const updScore = () => shell.score(`Тяло ${idx + 1} от ${MEASURE.length} · грешки: ${mistakes}`);
    const draw = () => {
      const o = BY[MEASURE[idx]];
      const s1 = state === 'scale' ? '👉' : '✔';
      const s2 = state === 'scale' ? '' : state === 'cyl' || state === 'pin' ? '👉' : '✔';
      shell.task(`<p><b>${esc(o.icon)} ${esc(o.label)}</b></p>
        <p>${s1} 1. Провлачи го на <b>везната</b>.${state !== 'scale' ? ` Маса: <b>m = ${fmt(o.m, 1)} g</b>` : ''}</p>
        <p>${s2} 2. Пусни го в <b>мензурата</b>. Преди това водата е <b>100 ml</b>.</p>
        ${state === 'calc' ? `<div class="density-in">
          <label class="num">V = <input class="iv" type="text" inputmode="decimal"> cm³</label>
          <label class="num">ρ = <input class="ir" type="text" inputmode="decimal"> g/cm³</label></div>
          <p class="small">Виж лупата до мензурата: колко ml е водата сега? Покачването е обемът на тялото.</p>` : ''}`);
      updScore();
    };
    const ready = () => {
      for (const [id, g] of objs) g.userData.locked = id !== MEASURE[idx] || state === 'calc' || state === 'pin';
    };
    const load = () => { state = 'scale'; wrongTries = 0; draw(); ready(); shell.setControls(''); sayAt(MEASURE[idx], `Започни с мен: ${esc(BY[MEASURE[idx]].label.toLowerCase())}.`, '', curG().userData.h / 2 + 0.35); };
    const calcControls = () => {
      const c = shell.setControls('<button class="btn primary">Провери</button>');
      c.querySelector('button').addEventListener('click', check);
    };
    const check = () => {
      const o = BY[MEASURE[idx]];
      const iv = container.querySelector('.iv'); const ir = container.querySelector('.ir');
      const V = num(iv.value); const r = num(ir.value);
      if (!Number.isFinite(V) || !Number.isFinite(r)) { shell.msg('Попълни и двете полета.', 'bad'); return; }
      const okV = Math.abs(V - o.V) < 0.6; const okR = Math.abs(r - o.rho) < 0.051;
      iv.classList.toggle('right', okV); iv.classList.toggle('wrong', !okV);
      ir.classList.toggle('right', okR); ir.classList.toggle('wrong', !okR);
      if (okV && okR) {
        measured[o.id] = fmt(o.rho, 2);
        drawPoster();
        shell.msg(`Вярно! ρ = ${fmt(o.m, 1)} g : ${o.V} cm³ = ${fmt(o.rho, 2)} g/cm³. Записахме го в таблицата.`, 'good');
        iv.disabled = true; ir.disabled = true;
        const last = idx === MEASURE.length - 1;
        const c = shell.setControls(`<button class="btn primary">${last ? 'Напред →' : 'Следващо тяло →'}</button>`);
        c.querySelector('button').addEventListener('click', async () => {
          shell.msg('');
          const g = curG();
          pin.visible = false;
          takeOut(g);
          await glide(g, homeOf(o.id), 0.7);
          if (last) { scores.push(stepScore(mistakes, 3)); showMag(false); step3(); return; }
          idx++;
          load();
        });
        return;
      }
      mistakes++;
      wrongTries++;
      let m;
      if (!okV) m = `Обемът не е верен. V = нивото сега − 100 ml. Виж лупата.`;
      else m = `Плътността не е вярна. Раздели масата на обема: ρ = m : V.`;
      if (wrongTries >= 2) m += ` Подсказка: ${fmt(o.m, 1)} : ${o.V} = ?`;
      shell.msg(m, 'bad');
      updScore();
    };
    clickHandler = (id) => {
      if (!id) return clearTip();
      if (INSTR[id]) sayAt(id, INSTR[id].note, 'wide');
      else if (BY[id]) sayAt(id, `<b>${esc(BY[id].label)}</b>${measured[id] ? `<br>ρ = ${measured[id]} g/cm³` : ''}`);
    };
    stopDrag = stage.enableDrag({
      planeY: 0, lift: 0.4,
      onStart: () => clearTip(),
      onDrop: async (g, p, start) => {
        const id = g.userData.o.id;
        const t = targetUnder(p);
        g.position.y = start.y;
        if (state === 'scale') {
          if (t !== 'balance') { glide(g, start); shell.msg(t === 'cyl' ? 'Първо измери масата на везната.' : 'Сложи тялото на везната.', 'bad'); return; }
          await glide(g, new V3(balance.position.x, PAN_Y + g.userData.h / 2, balance.position.z));
          setMass(g.userData.o.m);
          state = 'cyl';
          sayAt('balance', `Везната показва <b>${fmt(g.userData.o.m, 1)} g</b>.`, 'good');
          shell.msg('');
          draw();
          return;
        }
        if (state === 'cyl') {
          if (t !== 'cyl') { glide(g, start); shell.msg('Сега пусни тялото в мензурата.', 'bad'); return; }
          g.userData.locked = true;
          setMass(0);
          await dropInto(g, 'cyl', 0, 0);
          clearTip();
          await phase(2.2);
          if (id === 'wood') {
            state = 'pin';
            say(cyl, '<b>Дървото плава!</b> Под водата е само част от него, затова водата се вдигна малко. За да измерим целия обем, го натискаме с тънка тел.', 'wide', 2.4);
            const c = shell.setControls('<button class="btn primary">📍 Потопи с тел</button>');
            c.querySelector('button').addEventListener('click', async () => {
              pin.visible = true;
              g.userData.body.pin = true;
              clearTip();
              await phase(2.0);
              state = 'calc';
              draw(); calcControls();
              say(cyl, 'Сега цялото блокче е под водата.', '', 2.4);
            });
            return;
          }
          state = 'calc';
          draw(); calcControls();
          container.querySelector('.iv').focus({ preventScroll: true });
        }
      },
    });
    load();
  }

  // ---------- 3. Плава или потъва? ----------
  const PRED = ['wood', 'bolt', 'al', 'ice', 'cork', 'clay'];
  function step3() {
    shell.step(2);
    clearTip();
    overview();
    const pred = {};
    let mistakes = 0;
    let dropped = 0;
    let phaseP = 'predict';
    const row = (id) => {
      const o = BY[id];
      return `<tr data-id="${id}"><td>${esc(o.icon)} ${esc(o.short)}</td><td><b>${fmt(o.rho, 2)}</b></td>
        <td><div class="density-pb"><button data-v="float" class="${pred[id] === 'float' ? 'on' : ''}">Плава</button><button data-v="sink" class="${pred[id] === 'sink' ? 'on' : ''}">Потъва</button></div></td></tr>`;
    };
    shell.task(`<p>Плътността на водата е <b>1 g/cm³</b>. <b>Предскажи</b> кое тяло ще плава и кое ще потъне.</p>
      <table class="density-tbl"><tr><th>Тяло</th><th>ρ, g/cm³</th><th>Предсказване</th></tr>${PRED.map(row).join('')}</table>`);
    const tbl = container.querySelector('.density-tbl');
    tbl.querySelectorAll('.density-pb button').forEach((b) => b.addEventListener('click', () => {
      if (phaseP !== 'predict') return;
      const id = b.closest('tr').dataset.id;
      pred[id] = b.dataset.v;
      b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      chk.disabled = Object.keys(pred).length < PRED.length;
    }));
    shell.score('');
    const c = shell.setControls('<button class="btn primary" disabled>Провери в аквариума</button>');
    const chk = c.querySelector('button');
    chk.addEventListener('click', () => {
      phaseP = 'drop';
      tbl.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      for (const id of PRED) {
        const real = BY[id].rho < 1 ? 'float' : 'sink';
        if (pred[id] !== real) mistakes++;
      }
      shell.setControls('<p><b>Провлачи всяко тяло в аквариума</b> и виж дали си познал.</p>');
      shell.score(`Пуснати: 0 от ${PRED.length}`);
      for (const id of PRED) objs.get(id).userData.locked = false;
    });
    clickHandler = (id) => { if (!id) return clearTip(); if (BY[id]) sayAt(id, `<b>${esc(BY[id].label)}</b><br>ρ = ${fmt(BY[id].rho, 2)} g/cm³`); else if (INSTR[id]) sayAt(id, INSTR[id].note, 'wide'); };
    stopDrag = stage.enableDrag({
      planeY: 0, lift: 0.4,
      onStart: () => clearTip(),
      onDrop: async (g, p, start) => {
        g.position.y = start.y;
        const id = g.userData.o.id;
        if (targetUnder(p) !== 'tank') { glide(g, start); return; }
        g.userData.locked = true;
        const i = PRED.indexOf(id);
        const x = -TK.w / 2 + 0.4 + (i / (PRED.length - 1)) * (TK.w - 0.8);
        const z = (i % 2 ? 0.2 : -0.2) * (TK.d / 1.5);
        await dropInto(g, 'tank', x, z);
        await phase(1.8);
        const o = BY[id];
        const fl = o.rho < 1;
        const right = pred[id] === (fl ? 'float' : 'sink');
        const tr = tbl.querySelector(`tr[data-id="${id}"]`);
        tr.classList.add(right ? 'right' : 'wrong');
        let extra = '';
        if (id === 'ice') extra = ' Над водата стърчи само малка част — като при айсберг!';
        if (id === 'cork') extra = ' Коркът е много лек за обема си — почти целият е над водата.';
        if (id === 'wood') extra = ' Под водата е около 3/5 от блокчето.';
        say(g, `${right ? '✔' : '✘'} <b>${esc(o.short)}</b>: ${fmt(o.rho, 2)} ${fl ? '<' : '>'} 1 → <b>${fl ? 'плава' : 'потъва'}</b>.${extra}`, right ? 'good' : 'bad', 0.45);
        dropped++;
        shell.score(`Пуснати: ${dropped} от ${PRED.length}`);
        if (dropped === PRED.length) { stopDrag(); stopDrag = null; ruleQ(mistakes); }
      },
    });
  }
  function ruleQ(m0) {
    let mistakes = m0;
    shell.msg(m0 ? `Предсказанията: ${PRED.length - m0} от ${PRED.length} верни.` : 'Всички предсказания са верни! 🎉', m0 ? 'bad' : 'good');
    const c = shell.setControls(`<p><b>Кога тялото плава във вода?</b></p><div class="choices">
      <button class="choice" data-i="0">Когато плътността му е по-малка от 1 g/cm³ — плътността на водата</button>
      <button class="choice" data-i="1">Когато масата му е малка</button>
      <button class="choice" data-i="2">Когато плътността му е по-голяма от плътността на водата</button></div>`);
    c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      if (b.dataset.i !== '0') {
        mistakes++;
        b.classList.add('wrong'); b.disabled = true;
        shell.msg(b.dataset.i === '1' ? 'Не точно. Болтът (78 g) потъва, а дървото (30 g) плава — но и голям дънер плава. Важна е масата на 1 cm³.' : 'Обратно е: виж болта и алуминия — те потъват.', 'bad');
        return;
      }
      b.classList.add('right');
      c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      shell.msg('Вярно! По-малка плътност от течността → плава. По-голяма → потъва.', 'good');
      scores.push(stepScore(mistakes, 3));
      c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary nx">Напред →</button></div>');
      c.querySelector('.nx').addEventListener('click', step4);
    }));
  }

  // ---------- 4. Лодка и яйце ----------
  // k = 0: топче; до 0,4: сплесната плътна питка; после — лодка с бордове (кухина с въздух).
  let clayK = 0;
  const clayVout = (k) => (k < 0.4 ? 30 : 30 + ((k - 0.4) / 0.6) * 120);
  function setClayShape(k) {
    clayK = k;
    const g = objs.get('clay');
    const old = g.userData.clayMesh;
    let geo; let h;
    if (k < 0.4) {
      const f = k / 0.4;
      geo = new THREE.SphereGeometry(0.19, 20, 14);
      geo.scale(1 + f * 0.8, 1 - f * 0.62, 1 + f * 0.8);
      h = 0.38 * (1 - f * 0.62);
    } else {
      const f = (k - 0.4) / 0.6;
      const R = 0.34 + f * 0.24; const H = 0.15 + f * 0.13; const t = 0.05 - f * 0.025;
      const pts = [[0, -H / 2], [R * 0.75, -H / 2], [R, -H / 2 + H * 0.35], [R, H / 2], [R - t, H / 2], [R - t, -H / 2 + H * 0.38], [R * 0.75 - t, -H / 2 + t], [0, -H / 2 + t]];
      geo = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 32);
      h = H;
    }
    old.geometry.dispose();
    old.geometry = geo;
    old.material.side = k >= 0.4 ? THREE.DoubleSide : THREE.FrontSide;
    g.userData.h = h;
    g.userData.label.position.y = h / 2 + 0.2;
    const b = g.userData.body;
    if (b) { b.h = h; b.rho = 42 / clayVout(k); }
    g.userData.rhoOverride = 42 / clayVout(k);
  }

  function step4() {
    shell.step(3);
    clearTip();
    let mistakes = 0;
    // всички без пластилина се връщат на подноса
    for (const id of PRED) {
      if (id === 'clay') continue;
      const g = objs.get(id);
      takeOut(g);
      glide(g, homeOf(id), 0.8);
    }
    const tp = tank.position;
    if (narrow) fitView([tp.x, 1.05, tp.z + 0.8], 2.0, 1.55, 0.35);
    else fitView([tp.x, 1.05, tp.z + 0.6], 2.2, 1.55, 0.35);
    const clay = objs.get('clay');
    const bub = stage.bubble(clay, '', { lift: 0.45, cls: 'tag' });
    const readBub = () => {
      const V = clayVout(clayK);
      const r = 42 / V;
      bub.set(`m = 42 g · V = ${Math.round(V)} cm³ · ρ ср. = ${fmt(r, 2)} g/cm³`);
      bub.el.classList.toggle('good', r < 1);
    };
    shell.task(`<p>Топчето пластилин потъна. А може ли <b>същият пластилин</b> да плава?</p>
      <p><b>Промени формата</b> с плъзгача и гледай какво става.</p>
      <label class="small">Форма: топче ⟵ ⟶ лодка
        <input class="slider shape" type="range" min="0" max="1" step="0.01" value="0"></label>
      <p class="small">V е обемът, който заема тялото заедно с въздуха в лодката.</p>`);
    shell.score(`Грешки: ${mistakes}`);
    shell.setControls('');
    const sl = container.querySelector('.shape');
    readBub();
    let asked = false;
    sl.addEventListener('input', () => {
      setClayShape(+sl.value);
      clay.userData.body.v += 0.0001;
      readBub();
      if (!asked && 42 / clayVout(clayK) < 0.75) {
        asked = true;
        setTimeout(boatQ, 1200);
      }
    });
    clickHandler = (id) => { if (!id) clearTip(); };
    function boatQ() {
      const c = shell.setControls(`<p><b>Защо лодката плава, а топчето потъва?</b></p><div class="choices">
        <button class="choice" data-i="1">Лодката е по-лека от топчето</button>
        <button class="choice" data-i="0">Лодката заема много по-голям обем заедно с въздуха в нея — средната ѝ плътност е по-малка от 1 g/cm³</button>
        <button class="choice" data-i="2">Пластилинът се превърна в друго вещество</button></div>`);
      c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        if (b.dataset.i !== '0') {
          mistakes++; b.classList.add('wrong'); b.disabled = true;
          shell.msg(b.dataset.i === '1' ? 'Не — масата е същата: 42 g. Виж обема в балончето.' : 'Не — пак е същият пластилин, само формата е друга.', 'bad');
          shell.score(`Грешки: ${mistakes}`);
          return;
        }
        b.classList.add('right');
        c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        sl.disabled = true;
        shell.msg('Вярно! Така плават и стоманените кораби — те са кухи и пълни с въздух.', 'good');
        c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary nx">Към яйцето →</button></div>');
        c.querySelector('.nx').addEventListener('click', () => { bub.remove(); eggPart(); });
      }));
    }

    async function eggPart() {
      clearTip();
      eggJar.visible = true;
      saltNow = 0;
      eggWater.material.color.set(0x5fb4e6);
      const ep = eggJar.position;
      fitView([ep.x, 0.8, ep.z + 0.4], narrow ? 1.5 : 1.7, 1.15, 0.3);
      const egg = objs.get('egg');
      egg.userData.locked = true;
      await dropInto(egg, 'egg', 0, 0);
      const eb = stage.bubble(eggJar, '', { lift: EJ.h + 0.15, cls: 'tag' });
      const readEgg = () => {
        const rw = brine(saltNow);
        eb.set(`Вода: ρ ≈ ${fmt(rw, 2)} g/cm³ · яйце: ρ ≈ ${fmt(BY.egg.rho, 2)} g/cm³`);
        eb.el.classList.toggle('good', rw > BY.egg.rho);
      };
      readEgg();
      shell.task(`<p>Пуснахме сурово яйце в чаша с <b>чешмяна вода</b>. То потъна.</p>
        <p><b>Добавяй сол</b> с плъзгача (лъжички сол в 1 литър вода) и разбъркай.</p>
        <label class="small">Сол: <b class="sn">0</b> лъжички
          <input class="slider salt" type="range" min="0" max="8" step="1" value="0"></label>`);
      shell.setControls('');
      shell.msg('');
      const ss = container.querySelector('.salt');
      let asked2 = false;
      ss.addEventListener('input', () => {
        const s = +ss.value;
        if (s > saltNow) sprinkle();
        saltNow = s;
        container.querySelector('.sn').textContent = String(s);
        egg.userData.body.v += 0.0001;
        eggWater.material.color.set(0x5fb4e6).lerp(new THREE.Color(0xd9eef7), s / 12);
        readEgg();
        if (!asked2 && brine(s) > BY.egg.rho) { asked2 = true; setTimeout(() => eggQ(eb), 2200); }
      });
    }
    function sprinkle() {
      saltGrains.forEach((s, i) => {
        s.visible = true;
        s.userData.k = -i * 0.04;
        s.position.set((Math.random() - 0.5) * 0.4, EJ.h + 0.2, (Math.random() - 0.5) * 0.4);
      });
    }
    const stopSalt = stage.tick(() => {
      for (const s of saltGrains) {
        if (!s.visible) continue;
        s.userData.k += rdt;
        if (s.userData.k < 0) continue;
        s.position.y -= rdt * (s.position.y > EJ.water ? 1.6 : 0.35);
        const sc = s.position.y < EJ.water ? Math.max(0.01, 1 - (EJ.water - s.position.y) * 3) : 1;
        s.scale.setScalar(sc);
        if (sc <= 0.02) s.visible = false;
      }
    });
    function eggQ(eb) {
      const c = shell.setControls(`<p><b>Защо яйцето изплава?</b></p><div class="choices">
        <button class="choice" data-i="1">Солта направи яйцето по-леко</button>
        <button class="choice" data-i="0">Солената вода има по-голяма плътност от яйцето</button>
        <button class="choice" data-i="2">Яйцето се напълни с въздух</button></div>`);
      c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        if (b.dataset.i !== '0') {
          mistakes++; b.classList.add('wrong'); b.disabled = true;
          shell.msg('Не. Яйцето е същото — промени се водата. Виж числата над чашата.', 'bad');
          shell.score(`Грешки: ${mistakes}`);
          return;
        }
        b.classList.add('right');
        c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        container.querySelector('.salt').disabled = true;
        shell.msg('Вярно! Тялото плава, когато плътността му е по-малка от плътността на течността.', 'good');
        c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary nx">Още един въпрос →</button></div>');
        c.querySelector('.nx').addEventListener('click', () => seaQ(eb));
      }));
    }
    function seaQ(eb) {
      shell.msg('');
      shell.task(`<p><b>Къде човек плава по-лесно: в Черно море или в река?</b></p>`);
      const c = shell.setControls(`<div class="choices">
        <button class="choice" data-i="1">В реката, защото водата е сладка</button>
        <button class="choice" data-i="0">В морето, защото солената вода има по-голяма плътност</button>
        <button class="choice" data-i="2">Еднакво — водата си е вода</button></div>`);
      c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        if (b.dataset.i !== '0') {
          mistakes++; b.classList.add('wrong'); b.disabled = true;
          shell.msg('Спомни си яйцето: в коя вода изплава?', 'bad');
          shell.score(`Грешки: ${mistakes}`);
          return;
        }
        b.classList.add('right');
        c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        shell.msg('Вярно! В още по-соленото Мъртво море човек лежи на водата като на дюшек.', 'good');
        scores.push(stepScore(mistakes, 3));
        c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary nx">Виж резултата</button></div>');
        c.querySelector('.nx').addEventListener('click', () => {
          eb.remove();
          stopSalt();
          clearTip();
          const ratio = scores.reduce((a, x) => a + x, 0) / scores.length;
          shell.score('');
          shell.finish(ratio, onComplete, restart);
        });
      }));
    }
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    stage.clearBubbles();
    tip = null; mag = null;
    for (const [, g] of objs) { if (g.parent !== scene) takeOut(g); }
    pin.visible = false;
    eggJar.visible = false;
    saltNow = 0;
    for (const k of Object.keys(measured)) delete measured[k];
    drawPoster();
    setMass(0);
    resetObjects();
    scores.length = 0;
    menu.setItems(MENU_ITEMS);
    step1();
  }

  resetObjects();
  step1();
  return {
    dispose() {
      if (stopDrag) stopDrag();
      stage.renderer.domElement.removeEventListener('pointermove', ptr);
      stage.renderer.domElement.removeEventListener('pointerdown', ptr);
      stage.dispose();
    },
  };
}
