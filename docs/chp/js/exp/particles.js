// 5.1.2 „Градивни частици и дифузия“ — лабораторна маса със стъклена кутия, пълна с частици.
// Стъпки: опознай трите състояния → температура и движение → дифузия: студена и гореща вода → примери и предсказание.
import { createStage, labelSprite, mat, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const STYLE = `
.pt-list{margin:6px 0 0;padding-left:20px}.pt-list li{margin:2px 0}.pt-list li.done{color:#0d7a3a}
.pt-list li.done::marker{content:"✓ ";font-weight:900}.pt-list li.cur{font-weight:700}
.pt-q{margin:10px 0 4px;font-weight:700}
.pt-temp{display:flex;justify-content:space-between;font-size:.8rem;color:#5b6472;margin-top:-2px}
.pt-big{font-size:1.25rem;font-weight:900}
.pt-st{display:inline-block;padding:0 7px;border-radius:99px;color:#fff;font-weight:800;font-size:.78rem;line-height:1.5}
.pt-st.solid{background:#5c6bc0}.pt-st.liquid{background:#1e88e5}.pt-st.gas{background:#ef6c00}
.pt-multi .choice .box{width:1.1em;height:1.1em;border:2px solid #9aa6b5;border-radius:4px;flex:none;display:inline-flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:900}
.pt-multi .choice.on .box{background:#1865f2;border-color:#1865f2;color:#fff}
.pt-multi .choice.on .box::after{content:"✓"}
.pt-multi .choice:disabled{opacity:1;color:inherit}
.pt-why{display:block;font-size:.8rem;color:#5b6472;margin-top:2px}
`;
function injectStyle() {
  if (document.getElementById('pt-style')) return;
  const s = document.createElement('style');
  s.id = 'pt-style';
  s.textContent = STYLE;
  document.head.appendChild(s);
}

const STATE = {
  solid: { name: 'лед', kind: 'твърдо тяло' },
  liquid: { name: 'вода', kind: 'течност' },
  gas: { name: 'водна пара', kind: 'газ' },
};
const stateOf = (T) => (T < 0 ? 'solid' : T < 100 ? 'liquid' : 'gas');
const fmtT = (T) => `${Math.round(T) < 0 ? '−' : ''}${Math.abs(Math.round(T))} °C`;
const chip = (s) => `<span class="pt-st ${s}">${esc(STATE[s].kind)}</span>`;

// Гаусово случайно число.
function gauss() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const glassMat = (opacity = 0.16) => new THREE.MeshStandardMaterial({
  color: 0xdff1ff, transparent: true, opacity, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide,
});

// Стъклена кутия с ръбове.
function glassBox(w, h, d) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(w, h, d);
  const faces = new THREE.Mesh(geo, glassMat(0.12));
  faces.position.y = h / 2;
  faces.renderOrder = 4;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x9fb8cc }));
  edges.raycast = () => {};
  edges.position.y = h / 2;
  g.add(faces, edges);
  return g;
}
// Стъклена чаша (цилиндър) с вода.
function beaker(R, H, waterColor) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, H, 36, 1, true), glassMat(0.18));
  wall.position.y = H / 2;
  wall.renderOrder = 4;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.03, 0.02, 6, 40), new THREE.MeshStandardMaterial({ color: 0xcfe3f2 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = H;
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.04, 36), glassMat(0.3));
  bottom.position.y = 0.02;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H * 0.86, 36), new THREE.MeshStandardMaterial({
    color: waterColor, transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false,
  }));
  water.position.y = 0.04 + (H * 0.86) / 2;
  water.renderOrder = 2;
  g.add(wall, rim, bottom, water);
  g.userData.water = water;
  g.userData.R = R;
  g.userData.H = H * 0.86;
  return g;
}

// Облак от частици, които се лутат на случаен принцип (дифузия) в цилиндър или кутия.
function diffuser({ shape, R = 0.8, W = 2, D = 1.4, H = 1.7, y0 = 0.05, N = 140, color, radius = 0.045, opacity = 1, coef = 0.1 }) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.4, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 8, 6), m, N);
  mesh.frustumCulled = false;
  const pos = Array.from({ length: N }, () => new THREE.Vector3());
  const dummy = new THREE.Object3D();
  const d = { mesh, pos, coef, on: false, sink: 0, t: 0 };
  function clamp(p) {
    if (shape === 'cyl') {
      const r = Math.hypot(p.x, p.z);
      const lim = R - radius;
      if (r > lim) { p.x *= lim / r; p.z *= lim / r; }
    } else {
      p.x = Math.max(-W / 2 + radius, Math.min(W / 2 - radius, p.x));
      p.z = Math.max(-D / 2 + radius, Math.min(D / 2 - radius, p.z));
    }
    p.y = Math.max(y0 + radius, Math.min(y0 + H - radius, p.y));
  }
  function write() {
    for (let i = 0; i < N; i++) { dummy.position.copy(pos[i]); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }
    mesh.instanceMatrix.needsUpdate = true;
  }
  d.uniform = () => {
    for (const p of pos) {
      if (shape === 'cyl') { const a = Math.random() * Math.PI * 2; const r = Math.sqrt(Math.random()) * R; p.set(Math.cos(a) * r, y0 + Math.random() * H, Math.sin(a) * r); } else p.set((Math.random() - 0.5) * W, y0 + Math.random() * H, (Math.random() - 0.5) * D);
      clamp(p);
    }
    write();
  };
  // Всички частици в малка капка около точка c.
  d.drop = (c, spread = 0.08) => {
    for (const p of pos) { p.set(c.x + gauss() * spread, c.y + gauss() * spread, c.z + gauss() * spread); clamp(p); }
    d.on = true;
    d.t = 0;
    write();
  };
  d.hide = () => { mesh.visible = false; d.on = false; };
  d.update = (dt) => {
    if (!d.on) return;
    d.t += dt;
    const s = Math.sqrt(2 * d.coef * dt);
    const sinkV = d.sink * Math.exp(-d.t * 1.5);
    for (const p of pos) {
      p.x += gauss() * s;
      p.y += gauss() * s - sinkV * dt;
      p.z += gauss() * s;
      clamp(p);
    }
    write();
  };
  // Колко равномерно са разпределени: 0 — събрани на едно място, 1 — навсякъде еднакво.
  d.mix = () => {
    const cells = new Array(6).fill(0);
    for (const p of pos) {
      const layer = Math.min(2, Math.max(0, Math.floor(((p.y - y0) / H) * 3)));
      let side;
      if (shape === 'cyl') side = p.x * p.x + p.z * p.z < (R * R) / 2 ? 0 : 1;
      else side = p.x < 0 ? 0 : 1;
      cells[layer * 2 + side]++;
    }
    let dev = 0;
    for (const c of cells) dev += Math.abs(c / N - 1 / 6);
    return Math.max(0, 1 - (dev / 2) / (5 / 6));
  };
  d.uniform();
  return d;
}

// ---------- преживяване ----------
export function mount(container, opts) {
  injectStyle();
  // „Започни отначало“ строи всичко наново — така нищо не остава от предишния опит.
  let inst = null;
  const restart = () => { inst.dispose(); inst = build(container, opts, restart); };
  inst = build(container, opts, restart);
  return { dispose() { inst.dispose(); } };
}

function build(container, { onComplete }, restart) {
  const STEPS = ['Опознай частиците', 'Топло и студено', 'Дифузия: състезание', 'Къде има дифузия?'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xdde7f0, camPos: [0, 3.6, 7.4], target: [0, 1.5, 0], minDistance: 2.2, maxDistance: 13,
    maxPolarAngle: Math.PI * 0.46,
  });
  const { scene } = stage;
  stage.controls.minAzimuthAngle = -1.1;
  stage.controls.maxAzimuthAngle = 1.1;
  // На тесен (висок) екран камерата се отдръпва, за да се вижда цялата сцена.
  const narrowK = () => { const a = stage.camera.aspect; return a < 1.2 ? Math.min(1.9, Math.pow(1.2 / a, 0.75)) : 1; };
  const fly = (pos, tgt, dur) => { const k = narrowK(); stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur); };
  const narrow = () => stage.renderer.domElement.clientWidth < 480;

  // ---- анимации и таймери ----
  const anims = new Set();
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  function animate(dur, fn, done) { const a = { k: 0, dur, fn, done }; anims.add(a); return a; }
  const later = (sec, fn) => animate(sec, () => {}, fn);
  stage.tick((dt) => {
    for (const a of [...anims]) {
      a.k = Math.min(1, a.k + dt / a.dur);
      a.fn(a.k);
      if (a.k >= 1) { anims.delete(a); if (a.done) a.done(); }
    }
  });

  // ---- лаборатория ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat(0x9aa7b4));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.4;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), mat(0xe9eff5));
  wall.position.set(0, 3, -3.2);
  scene.add(wall);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(11, 0.3, 4.4), mat(0x37474f, { roughness: 0.6 }));
  bench.position.set(0, -0.15, -0.5);
  scene.add(bench);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(10.6, 2.1, 4.0), mat(0xcfd8dc));
  cab.position.set(0, -1.35, -0.5);
  scene.add(cab);
  for (let i = 0; i < 5; i++) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.04), mat(0x78909c));
    h.position.set(-4 + i * 2, -0.6, 1.52);
    scene.add(h);
  }
  // рафт с колби, в които бълбука
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 0.6), mat(0x8d6e63));
  shelf.position.set(-2.6, 3.4, -2.9);
  scene.add(shelf);
  const bubbles = [];
  const flaskCols = [0x66bb6a, 0xffa726, 0xab47bc, 0x29b6f6];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), glassMat(0.3));
    body.position.y = 0.3;
    const liq = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: flaskCols[i], transparent: true, opacity: 0.8 }));
    liq.position.y = 0.3;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 10), glassMat(0.3));
    neck.position.y = 0.75;
    f.add(body, liq, neck);
    f.position.set(-4.4 + i * 1.2, 3.45, -2.9);
    scene.add(f);
    for (let k = 0; k < 3; k++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
      b.userData = { base: f.position.clone(), ph: Math.random() };
      scene.add(b);
      bubbles.push(b);
    }
  }
  // табло на стената
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), mat(0x2e4a3a));
  board.position.set(3.2, 3.6, -3.18);
  scene.add(board);
  const boardC = document.createElement('canvas');
  boardC.width = 512; boardC.height = 288;
  const bctx = boardC.getContext('2d');
  bctx.strokeStyle = '#f5f5f5'; bctx.fillStyle = '#f5f5f5'; bctx.lineWidth = 3;
  bctx.font = '600 30px system-ui, sans-serif';
  bctx.fillText('H₂O', 220, 50);
  const drawMol = (cx, cy, n, sp) => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { bctx.beginPath(); bctx.arc(cx + i * sp, cy + j * sp, 9, 0, Math.PI * 2); bctx.stroke(); } };
  drawMol(40, 110, 4, 22);
  drawMol(205, 120, 3, 34);
  for (const [x, y] of [[380, 100], [450, 140], [400, 210], [470, 230], [360, 250]]) { bctx.beginPath(); bctx.arc(x, y, 9, 0, Math.PI * 2); bctx.stroke(); }
  bctx.font = '500 24px system-ui, sans-serif';
  bctx.fillText('лед', 60, 240); bctx.fillText('вода', 215, 240); bctx.fillText('пара', 395, 285 - 10);
  const boardTex = new THREE.CanvasTexture(boardC);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const boardInk = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.68), new THREE.MeshBasicMaterial({ map: boardTex, transparent: true }));
  boardInk.position.set(3.2, 3.6, -3.17);
  scene.add(boardInk);

  // ---- кутията с частици ----
  const BOX = { w: 2.4, h: 3.0, d: 1.6 };
  const R = 0.13;
  const N = 150;
  const main = new THREE.Group();
  scene.add(main);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.5, 0.2, 40), mat(0x546e7a, { metalness: 0.4, roughness: 0.4 }));
  plate.position.y = 0.1;
  const plateTop = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.02, 40), new THREE.MeshStandardMaterial({ color: 0x455a64, emissive: 0x000000 }));
  plateTop.position.y = 0.21;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), mat(0x212121));
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0, 0.1, 1.52);
  main.add(plate, plateTop, knob);
  const boxG = new THREE.Group();
  boxG.position.y = 0.22;
  main.add(boxG);
  boxG.add(glassBox(BOX.w, BOX.h, BOX.d));
  const pMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(R, 14, 10), pMat, N);
  inst.frustumCulled = false;
  boxG.add(inst);
  const BASE_COL = new THREE.Color(0x2f8fe0);
  const HI_COL = new THREE.Color(0xff8f00);
  for (let i = 0; i < N; i++) inst.setColorAt(i, BASE_COL);
  inst.userData.pickId = 'box';
  const boxHit = new THREE.Mesh(new THREE.BoxGeometry(BOX.w, BOX.h, BOX.d), new THREE.MeshBasicMaterial({ visible: false }));
  boxHit.position.y = BOX.h / 2;
  boxG.add(boxHit);
  boxG.userData.pickId = 'box';

  // кристална решетка 6 × 5 × 5 за леда
  const SP = 0.28;
  const sites = [];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) for (let z = 0; z < 5; z++) {
    sites.push(new THREE.Vector3((x - 2.5) * SP, R + 0.02 + y * SP, (z - 2) * SP));
  }
  const P = sites.map((s) => s.clone());
  const V = Array.from({ length: N }, () => new THREE.Vector3());
  const site = sites.map((s) => s.clone());
  const phase = Array.from({ length: N }, () => [Math.random() * 6, Math.random() * 6, Math.random() * 6, 5 + Math.random() * 4]);
  const want = Array.from({ length: N }, () => 0.6 + Math.random() * 0.8);

  let T = -10; // показваната температура
  let Tgoal = -10;
  let mode = 'solid';
  let freeze = 1;
  // Когато водата замръзва, всяка частица получава място в решетката близо до себе си.
  function assignSites() {
    const idx = [...Array(N).keys()].sort((a, b) => P[a].y - P[b].y);
    const lay = [];
    for (let L = 0; L < 5; L++) {
      const layer = idx.slice(L * 30, L * 30 + 30).sort((a, b) => P[a].x - P[b].x);
      for (let c = 0; c < 6; c++) {
        const col = layer.slice(c * 5, c * 5 + 5).sort((a, b) => P[a].z - P[b].z);
        col.forEach((pi, k) => lay.push([pi, sites[L * 30 + c * 5 + k]]));
      }
    }
    for (const [pi, s] of lay) site[pi].copy(s);
  }
  function setMode(m) {
    if (m === mode) return;
    if (m === 'solid') { assignSites(); freeze = 0; }
    if (mode === 'solid') for (const v of V) v.set(gauss(), gauss(), gauss()).multiplyScalar(0.3);
    mode = m;
  }
  const dummy = new THREE.Object3D();
  let highlight = -1;
  const tmp = new THREE.Vector3();
  function simulate(dt, t) {
    T += (Tgoal - T) * Math.min(1, dt * 2.2);
    if (Math.abs(Tgoal - T) < 0.3) T = Tgoal;
    setMode(stateOf(T));
    const halfW = BOX.w / 2 - R;
    const halfD = BOX.d / 2 - R;
    const top = BOX.h - R;
    if (mode === 'solid') {
      freeze = Math.min(1, freeze + dt * 1.2);
      const amp = 0.012 + 0.03 * Math.max(0, (T + 30) / 30);
      for (let i = 0; i < N; i++) {
        const ph = phase[i];
        const w = ph[3];
        tmp.set(site[i].x + Math.sin(t * w + ph[0]) * amp, site[i].y + Math.sin(t * w * 1.1 + ph[1]) * amp, site[i].z + Math.sin(t * w * 0.9 + ph[2]) * amp);
        P[i].lerp(tmp, freeze < 1 ? Math.min(1, dt * 3) : 1);
      }
    } else {
      const speed = mode === 'liquid' ? 0.3 + 0.6 * (T / 100) : 1.9 + 1.4 * Math.min(1, (T - 100) / 30);
      const g = mode === 'liquid' ? 4 : 0;
      for (let i = 0; i < N; i++) {
        const v = V[i];
        v.x += gauss() * dt * speed * 3;
        v.y += gauss() * dt * speed * 3 - g * dt;
        v.z += gauss() * dt * speed * 3;
        const target = speed * want[i];
        const l = v.length() || 1e-3;
        v.multiplyScalar(1 + (target / l - 1) * Math.min(1, dt * 3));
        P[i].addScaledVector(v, dt);
      }
      // частиците не се застъпват
      const d0 = 0.285;
      for (let i = 0; i < N; i++) {
        const a = P[i];
        for (let j = i + 1; j < N; j++) {
          const b = P[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dz = b.z - a.z;
          const q = dx * dx + dy * dy + dz * dz;
          if (q < d0 * d0 && q > 1e-8) {
            const dd = Math.sqrt(q);
            const push = (d0 - dd) * 0.5 / dd;
            a.x -= dx * push; a.y -= dy * push; a.z -= dz * push;
            b.x += dx * push; b.y += dy * push; b.z += dz * push;
            if (mode === 'gas') {
              // удар: разменят скоростите си по линията на удара
              const nx = dx / dd; const ny = dy / dd; const nz = dz / dd;
              const va = V[i].x * nx + V[i].y * ny + V[i].z * nz;
              const vb = V[j].x * nx + V[j].y * ny + V[j].z * nz;
              if (va - vb > 0) {
                const k = vb - va;
                V[i].x += k * nx; V[i].y += k * ny; V[i].z += k * nz;
                V[j].x -= k * nx; V[j].y -= k * ny; V[j].z -= k * nz;
              }
            }
          }
        }
      }
      for (let i = 0; i < N; i++) {
        const p = P[i];
        const v = V[i];
        if (p.x < -halfW) { p.x = -halfW; v.x = Math.abs(v.x); }
        if (p.x > halfW) { p.x = halfW; v.x = -Math.abs(v.x); }
        if (p.z < -halfD) { p.z = -halfD; v.z = Math.abs(v.z); }
        if (p.z > halfD) { p.z = halfD; v.z = -Math.abs(v.z); }
        if (p.y < R) { p.y = R; v.y = Math.abs(v.y) * (mode === 'liquid' ? 0.3 : 1); }
        if (p.y > top) { p.y = top; v.y = -Math.abs(v.y); }
      }
    }
    for (let i = 0; i < N; i++) { dummy.position.copy(P[i]); dummy.scale.setScalar(i === highlight ? 1.2 : 1); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix); }
    inst.instanceMatrix.needsUpdate = true;
  }
  function setHighlight(i) {
    if (highlight >= 0) inst.setColorAt(highlight, BASE_COL);
    highlight = i;
    if (i >= 0) inst.setColorAt(i, HI_COL);
    inst.instanceColor.needsUpdate = true;
  }

  // ---- термометър ----
  const thermo = new THREE.Group();
  thermo.position.set(2.1, 0, 0.3);
  main.add(thermo);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 20), mat(0x37474f));
  stand.position.y = 0.04;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 3.1, 16), glassMat(0.35));
  tube.position.y = 1.85;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), mat(0xe53935));
  bulb.position.y = 0.3;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 10), mat(0xe53935));
  thermo.add(stand, tube, bulb, col);
  const TY = (t) => 0.45 + ((t + 30) / 160) * 2.75; // −30…130 °C
  for (const v of [-20, 0, 20, 40, 60, 80, 100, 120]) {
    const tk = new THREE.Mesh(new THREE.BoxGeometry(v % 100 === 0 ? 0.2 : 0.12, 0.015, 0.01), new THREE.MeshBasicMaterial({ color: 0x37474f }));
    tk.position.set(0.1, TY(v), 0.07);
    thermo.add(tk);
  }
  for (const v of [0, 100]) {
    const l = labelSprite(`${v} °C`, { size: 0.17 });
    l.position.set(0.42, TY(v), 0.05);
    thermo.add(l);
  }
  const tTag = stage.bubble(thermo, '', { lift: 3.55, cls: 'tag' });
  let lastTag = '';
  function drawThermo() {
    const top = TY(T);
    col.scale.y = top - 0.3;
    col.position.y = 0.3 + (top - 0.3) / 2;
    const txt = `🌡 ${fmtT(T)} · ${STATE[stateOf(T)].name}`;
    if (txt !== lastTag) { tTag.set(txt); lastTag = txt; }
    // котлон: червен, когато грее; син, когато охлажда
    const e = plateTop.material.emissive;
    if (T > 25) e.setRGB(Math.min(1, (T - 25) / 90), 0.12 * Math.min(1, (T - 25) / 90), 0);
    else if (T < 5) e.setRGB(0, 0.18 * Math.min(1, (5 - T) / 30), 0.6 * Math.min(1, (5 - T) / 30));
    else e.setRGB(0, 0, 0);
  }

  // ---- оживяване ----
  stage.tick((dt, t) => {
    if (main.visible) { simulate(dt, t); drawThermo(); }
    for (const b of bubbles) {
      const u = b.userData;
      const k = (t * 0.5 + u.ph) % 1;
      b.position.set(u.base.x + Math.sin(k * 9 + u.ph * 6) * 0.05, u.base.y + 0.35 + k * 0.6, u.base.z);
      b.material.opacity = 0.8 * (1 - k);
    }
  });

  // ---- балончета ----
  let tip = null;
  function say(anchor, html, cls = '', lift = 1.2) {
    if (tip) tip.remove();
    if (narrow()) cls = cls.replace('wide', '');
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const pins = [];
  const pin = (anchor, html, cls = '', lift = 1.2) => { const b = stage.bubble(anchor, html, { lift, cls }); pins.push(b); return b; };
  const clearPins = () => { while (pins.length) pins.pop().remove(); };

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });

  function choiceBox(c, q, items, rightIdx, why, onRight, onWrong) {
    c.innerHTML = `<p class="pt-q">${q}</p><div class="choices">${items.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
    c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i !== rightIdx) {
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(why[i] || 'Не е това. Помисли пак.', 'bad');
        if (onWrong) onWrong();
        return;
      }
      b.classList.add('right');
      c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      onRight();
    }));
  }
  const nextBtn = (c, label, fn) => {
    const n = c.appendChild(document.createElement('div'));
    n.className = 'row';
    n.innerHTML = `<button class="btn primary">${esc(label)}</button>`;
    n.querySelector('button').addEventListener('click', fn);
  };

  // ---------- 1. Опознай ----------
  const MENU = [
    { id: 'solid', label: 'Лед', icon: '🧊', T: -10,
      note: 'Твърдо тяло. Частиците са <b>много близо</b> една до друга и са подредени. Не се разместват — само <b>трептят</b> на местата си. Затова ледът пази формата си.' },
    { id: 'liquid', label: 'Вода', icon: '💧', T: 20,
      note: 'Течност. Частиците са <b>близо</b> една до друга, но <b>се плъзгат</b> една покрай друга. Затова водата тече и приема формата на съда.' },
    { id: 'gas', label: 'Водна пара', icon: '♨️', T: 110,
      note: 'Газ. Разстоянията между частиците са <b>големи</b>. Частиците летят <b>бързо</b> във всички посоки, удрят се и запълват целия съд.' },
    { id: 'one', label: 'Една частица', icon: '🔶', T: null,
      note: 'Следи оранжевата частица. Тя <b>никога не спира</b> да се движи. Между нея и съседките ѝ винаги има <b>разстояние</b>.' },
  ];
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Разгледай',
    items: MENU.map((m) => ({ id: m.id, label: m.label, icon: m.icon })),
    onSelect: (id) => {
      // На тесен екран менюто се свива след избора, за да не закрива балончето.
      if (stage.renderer.domElement.clientWidth < 480) {
        const head = menu.el.querySelector('.cm-head');
        if (head && head.getAttribute('aria-expanded') === 'true') head.click();
      }
      if (menuHandler) menuHandler(id);
    },
  });
  const overview = () => { stage.stopFollow(); fly([0, 3.6, 7.4], [0, 1.5, 0]); };

  function step1() {
    shell.step(0);
    clearTip();
    menu.show(true);
    const seen = new Set();
    shell.task(`<p>Всяко вещество е изградено от мънички <b>градивни частици</b>. Тук те са увеличени милиони пъти.</p>
      <p>В кутията има вода. <b>Избери от менюто</b> лед, вода и пара и гледай как се държат частиците. Проследи и една частица.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата маса</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); setHighlight(-1); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${MENU.length}`);
    upd();
    const visit = (id) => {
      const m = MENU.find((x) => x.id === id);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      if (id === 'one') {
        setHighlight(37);
        if (stateOf(Tgoal) === 'gas') Tgoal = 20;
        stage.stopFollow();
        fly([0.2, 2.6, 5.0], [0.2, 1.1, 0]);
        say(boxG, `<b>${m.icon} ${m.label}</b><br>${m.note}`, 'wide', 3.3);
      } else {
        setHighlight(-1);
        Tgoal = m.T;
        stage.stopFollow();
        fly([0, 3.2, 6.6], [0.3, 1.5, 0]);
        say(boxG, `<b>${m.icon} ${m.label}</b> ${chip(id)}<br>${m.note}<br><span class="small">Частиците са същите — водни. Менят се само разстоянието и движението.</span>`, 'wide', 3.3);
      }
      upd();
      if (seen.size >= MENU.length) {
        next.disabled = false;
        shell.msg('Браво! Видя и трите състояния. Продължи напред.', 'good');
      } else if (['solid', 'liquid', 'gas'].every((s) => seen.has(s))) {
        shell.msg('Сега избери „Една частица“ и я проследи.', '');
      }
    };
    clickHandler = (id) => {
      if (id !== 'box') { clearTip(); return; }
      const s = stateOf(T);
      const m = MENU.find((x) => x.id === s);
      say(boxG, `<b>${m.icon} ${m.label}</b> ${chip(s)}<br>${m.note}`, 'wide', 3.3);
    };
    menuHandler = visit;
    next.addEventListener('click', () => { setHighlight(-1); clearTip(); menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Топло и студено ----------
  function step2() {
    shell.step(1);
    menu.show(false);
    menuHandler = null;
    stage.stopFollow();
    fly([0.6, 3.2, 7.0], [0.6, 1.5, 0]);
    Tgoal = -20;
    let mistakes = 0;
    const TASKS = [
      { goal: 'liquid', text: 'Стопи леда: направи го <b>вода</b>.' },
      { goal: 'gas', text: 'Направи водата <b>пара</b>.' },
      { goal: 'solid', text: 'Охлади парата, докато стане пак <b>лед</b>.' },
    ];
    let task = 0;
    const draw = () => {
      shell.task(`<p>Плъзгачът управлява котлона: надясно — <b>грее</b>, наляво — <b>охлажда</b>.</p>
        <ol class="pt-list">${TASKS.map((x, i) => `<li class="${i < task ? 'done' : i === task ? 'cur' : ''}">${x.text}</li>`).join('')}</ol>
        <label class="small" style="display:block;margin-top:8px">Температура: <b class="pt-tv">${fmtT(Tgoal)}</b>
          <input class="slider temp" type="range" min="-30" max="130" step="1" value="${Tgoal}"></label>
        <div class="pt-temp"><span>❄ студено</span><span>🔥 горещо</span></div>`);
      shell.score(`Задача ${Math.min(task + 1, 3)} от 3 · грешки: ${mistakes}`);
      const sl = container.querySelector('.temp');
      sl.addEventListener('input', () => {
        Tgoal = +sl.value;
        container.querySelector('.pt-tv').textContent = fmtT(Tgoal);
      });
    };
    draw();
    const c = shell.setControls('<button class="btn primary ok">Готово</button>');
    c.querySelector('.ok').addEventListener('click', () => {
      const s = stateOf(Tgoal);
      const goal = TASKS[task].goal;
      if (s !== goal) {
        mistakes++;
        const hint = {
          liquid: s === 'solid' ? 'Частиците още само трептят на местата си — още е лед. Ледът се топи при 0 °C.' : 'Частиците летят из цялата кутия — това е пара. Охлади малко.',
          gas: 'Частиците още са близо една до друга — това е течност. Водата кипи при 100 °C.',
          solid: s === 'liquid' ? 'Частиците още се плъзгат — това е вода. Водата замръзва при 0 °C.' : 'Частиците още летят надалеч — това е пара.',
        }[goal];
        shell.msg(hint, 'bad');
        shell.score(`Задача ${task + 1} от 3 · грешки: ${mistakes}`);
        return;
      }
      const msgs = {
        liquid: 'Ледът се стопи! Частиците излязоха от местата си и се плъзгат една покрай друга.',
        gas: 'Водата кипна! Частиците се движат много бързо и се отдалечиха една от друга.',
        solid: 'Пак е лед. Частиците се забавиха и се подредиха.',
      };
      say(boxG, `✔ ${msgs[goal]}`, 'good wide', 3.3);
      shell.msg('Вярно!', 'good');
      task++;
      if (task < TASKS.length) { draw(); return; }
      draw();
      container.querySelector('.temp').disabled = true;
      choiceBox(c, 'Какво става с частиците, когато загряваме веществото?', [
        'Частиците стават по-големи.',
        'Частиците спират да се движат.',
        'Частиците се движат по-бързо и разстоянията между тях растат.',
      ], 2, {
        0: 'Частиците не растат — виж, те са същите. Расте разстоянието между тях.',
        1: 'Точно обратното — гледай частиците, когато котлонът грее.',
      }, () => {
        shell.msg('Вярно! Колкото по-висока е температурата, толкова по-бързо се движат частиците.', 'good');
        scores.push(stepScore(mistakes, 3));
        nextBtn(c, 'Напред →', step3);
      }, () => { mistakes++; shell.score(`Грешки: ${mistakes}`); });
    });
  }

  // ---------- 3. Дифузия: студена срещу гореща вода ----------
  const race = new THREE.Group();
  race.visible = false;
  scene.add(race);
  const BR = 0.8;
  const BH = 2.1;
  const sides = {};
  for (const [key, x, label, Tw, coef, wcol] of [['cold', -1.5, 'Студена вода · 10 °C', 10, 0.012, 0x7fc4ff], ['hot', 1.5, 'Гореща вода · 80 °C', 80, 0.045, 0x9fd2ff]]) {
    const g = new THREE.Group();
    g.position.x = x;
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.16, 32), new THREE.MeshStandardMaterial({ color: 0x546e7a, emissive: key === 'hot' ? 0x8a1500 : 0x002a70, roughness: 0.5 }));
    pl.position.y = 0.08;
    const bk = beaker(BR, BH, wcol);
    bk.position.y = 0.16;
    g.add(pl, bk);
    const y0 = 0.05;
    const ink = diffuser({ shape: 'cyl', R: BR, H: bk.userData.H - 0.05, y0, N: 150, color: 0x8e24aa, radius: 0.05, coef });
    ink.mesh.visible = false;
    bk.add(ink.mesh);
    const wat = diffuser({ shape: 'cyl', R: BR, H: bk.userData.H - 0.05, y0, N: 45, color: 0x1e88e5, radius: 0.06, opacity: 0.45, coef: key === 'hot' ? 0.6 : 0.12 });
    wat.on = true;
    bk.add(wat.mesh);
    const lbl = labelSprite(label, { size: 0.22 });
    lbl.position.set(0, BH + 0.7, 0);
    g.add(lbl);
    stage.steadyLabel(lbl, 9);
    // капкомер
    const dropper = new THREE.Group();
    const dt1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, 0.5, 10), glassMat(0.5));
    const bulbD = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat(0x212121));
    bulbD.position.y = 0.3;
    const inkIn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.3, 8), mat(0x8e24aa));
    inkIn.position.y = -0.08;
    dropper.add(dt1, bulbD, inkIn);
    dropper.position.y = BH + 0.25;
    g.add(dropper);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0x8e24aa));
    drop.visible = false;
    g.add(drop);
    const steam = [];
    if (key === 'hot') {
      for (let i = 0; i < 8; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }));
        s.userData.k = i / 8;
        s.userData.x = (Math.random() - 0.5) * 1.0;
        g.add(s);
        steam.push(s);
      }
    }
    race.add(g);
    sides[key] = { g, bk, ink, wat, drop, dropper, steam, Tw, time: 0, done: false, running: false, tag: null };
  }
  const SIM_MIN = 1; // 1 секунда в сцената = 1 минута (часовникът е ускорен)
  stage.tick((dt, t) => {
    if (!race.visible) return;
    for (const s of Object.values(sides)) {
      s.wat.update(dt);
      for (const st of s.steam) {
        st.userData.k = (st.userData.k + dt * 0.25) % 1;
        const k = st.userData.k;
        st.position.set(st.userData.x + Math.sin(t + k * 6) * 0.08, BH + 0.25 + k * 1.0, Math.cos(t * 0.7 + k * 5) * 0.1);
        st.material.opacity = 0.3 * (1 - k);
      }
      if (!s.running) continue;
      s.ink.update(dt);
      const mix = s.ink.mix();
      const water = s.bk.userData.water.material;
      water.color.setHex(0x9fd2ff).lerp(new THREE.Color(0xc27ad6), Math.min(1, mix));
      water.opacity = 0.22 + 0.25 * mix;
      if (!s.done) {
        s.time += dt * SIM_MIN;
        if (s.tag) s.tag.set(`⏱ ${Math.floor(s.time)} мин`);
        if (mix > 0.8) {
          s.done = true;
          if (s.tag) { s.tag.set(`✔ Смеси се за ${Math.max(1, Math.round(s.time))} мин`); s.tag.el.classList.add('good'); }
          if (raceDone) raceDone();
        }
      }
    }
  });
  let raceDone = null;

  function step3() {
    shell.step(2);
    clearTip();
    main.visible = false;
    tTag.el.style.visibility = 'hidden';
    race.visible = true;
    stage.stopFollow();
    fly([0, 3.4, 7.2], [0, 1.4, 0]);
    let mistakes = 0;
    shell.task(`<p>В двете чаши има еднакво много вода. В едната е <b>студена</b>, в другата — <b>гореща</b>. Ще капнем в тях по капка мастило и <b>няма да бъркаме</b>.</p>
      <p class="pt-q">Предскажи: в коя чаша мастилото ще оцвети цялата вода по-бързо?</p>
      <div class="choices pred">
        <button class="choice" data-v="cold">В студената</button>
        <button class="choice" data-v="same">Еднакво бързо</button>
        <button class="choice" data-v="hot">В горещата</button>
      </div>`);
    shell.score('');
    const c = shell.setControls('<button class="btn primary go" disabled>💧 Капни мастилото</button>');
    const go = c.querySelector('.go');
    let pred = null;
    container.querySelectorAll('.pred .choice').forEach((b) => b.addEventListener('click', () => {
      container.querySelectorAll('.pred .choice').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      pred = b.dataset.v;
      go.disabled = false;
    }));
    go.addEventListener('click', () => {
      go.remove();
      container.querySelectorAll('.pred .choice').forEach((b) => { b.disabled = true; });
      if (pred !== 'hot') mistakes++;
      shell.msg('Гледай и следи часовниците над чашите. Те са ускорени: 1 секунда е 1 минута.', '');
      for (const s of Object.values(sides)) {
        s.drop.visible = true;
        s.drop.position.set(0, BH + 0.05, 0);
        s.tag = pin(s.g, '⏱ 0 мин', 'tag', BH + 1.25);
        const y1 = 0.16 + s.bk.userData.H - 0.1;
        animate(0.6, (k) => { s.drop.position.y = BH + 0.05 - (BH + 0.05 - y1) * k * k; }, () => {
          s.drop.visible = false;
          s.ink.mesh.visible = true;
          s.ink.sink = 0.5;
          s.ink.drop(new THREE.Vector3(0, s.bk.userData.H - 0.2, 0), 0.06);
          s.running = true;
        });
      }
      let first = true;
      raceDone = () => {
        if (first) {
          first = false;
          say(sides.hot.g, '<b>В горещата вода</b> мастилото се разнесе по-бързо!', 'good', BH + 1.9);
          return;
        }
        raceDone = null;
        shell.msg(pred === 'hot' ? 'Предсказа правилно! 🎉' : 'Предсказанието не позна — но опитът показа истината.', pred === 'hot' ? 'good' : 'bad');
        choiceBox(c, 'Защо в горещата вода стана по-бързо?', [
          'В горещата чаша има повече вода.',
          'Частиците на горещата вода се движат по-бързо и разнасят мастилото.',
          'Някой разбърка горещата вода.',
        ], 1, {
          0: 'Водата в двете чаши е еднакво много.',
          2: 'Никой не е бъркал — смесването стана само.',
        }, () => {
          clearTip();
          shell.msg('Вярно! Самоволното смесване на вещества заради движението на частиците им се нарича дифузия. При по-висока температура тя е по-бърза.', 'good');
          scores.push(stepScore(mistakes, 2));
          nextBtn(c, 'Напред →', step4);
        }, () => { mistakes++; });
      };
    });
  }

  // ---------- 4. Къде има дифузия? ----------
  const s4 = new THREE.Group();
  s4.visible = false;
  scene.add(s4);
  const airBox = new THREE.Group();
  airBox.position.set(-1.6, 0, 0);
  airBox.add(glassBox(2.2, 2.0, 1.4));
  const airLbl = labelSprite('Въздух · 20 °C', { size: 0.22 });
  airLbl.position.y = 2.45;
  airBox.add(airLbl);
  stage.steadyLabel(airLbl, 9);
  const perfume = new THREE.Group();
  const pb = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.26, 6), new THREE.MeshStandardMaterial({ color: 0xf48fb1, transparent: true, opacity: 0.7, flatShading: true }));
  pb.position.y = 0.13;
  const pc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10), mat(0xd4af37, { metalness: 0.6, roughness: 0.3 }));
  pc.position.y = 0.3;
  perfume.add(pb, pc);
  perfume.position.set(-0.85, 0, 0.35);
  airBox.add(perfume);
  const gasD = diffuser({ shape: 'box', W: 2.2, D: 1.4, H: 1.95, y0: 0.02, N: 150, color: 0xec407a, radius: 0.045, coef: 0.25 });
  gasD.mesh.visible = false;
  airBox.add(gasD.mesh);
  const airMol = diffuser({ shape: 'box', W: 2.2, D: 1.4, H: 1.95, y0: 0.02, N: 24, color: 0x90a4ae, radius: 0.06, opacity: 0.5, coef: 1.2 });
  airMol.on = true;
  airBox.add(airMol.mesh);
  const wBeaker = beaker(0.75, 2.0, 0x9fd2ff);
  wBeaker.position.set(1.7, 0, 0);
  const wLbl = labelSprite('Вода · 20 °C', { size: 0.22 });
  wLbl.position.y = 2.45;
  wBeaker.add(wLbl);
  stage.steadyLabel(wLbl, 9);
  const liqD = diffuser({ shape: 'cyl', R: 0.75, H: wBeaker.userData.H - 0.05, y0: 0.05, N: 150, color: 0x8e24aa, radius: 0.05, coef: 0.015 });
  liqD.mesh.visible = false;
  wBeaker.add(liqD.mesh);
  const watMol = diffuser({ shape: 'cyl', R: 0.75, H: wBeaker.userData.H - 0.05, y0: 0.05, N: 45, color: 0x1e88e5, radius: 0.06, opacity: 0.45, coef: 0.2 });
  watMol.on = true;
  wBeaker.add(watMol.mesh);
  s4.add(airBox, wBeaker);
  const race2 = { on: false, t: 0, gasDone: false, liqDone: false, tagG: null, tagL: null };
  stage.tick((dt) => {
    if (!s4.visible) return;
    airMol.update(dt);
    watMol.update(dt);
    if (!race2.on) return;
    gasD.update(dt);
    liqD.update(dt);
    race2.t += dt;
    const wm = wBeaker.userData.water.material;
    wm.color.setHex(0x9fd2ff).lerp(new THREE.Color(0xc27ad6), liqD.mix());
    if (!race2.gasDone) {
      race2.tagG.set(`⏱ ${Math.floor(race2.t)} мин`);
      if (gasD.mix() > 0.8) { race2.gasDone = true; race2.tagG.set(`✔ Разнесе се за ${Math.max(1, Math.round(race2.t))} мин`); race2.tagG.el.classList.add('good'); if (race2.onGas) race2.onGas(); }
    }
    if (!race2.liqDone) {
      race2.tagL.set(`⏱ ${Math.floor(race2.t)} мин`);
      if (liqD.mix() > 0.8) { race2.liqDone = true; race2.tagL.set(`✔ Смеси се за ${Math.round(race2.t)} мин`); race2.tagL.el.classList.add('good'); }
    }
  });

  function step4() {
    shell.step(3);
    clearTip();
    clearPins();
    race.visible = false;
    s4.visible = true;
    stage.stopFollow();
    fly([0, 3.2, 7.0], [0, 1.2, 0]);
    let mistakes = 0;
    const EX = [
      { t: 'Ароматът на печени кифли стига от кухнята до стаята.', d: true, why: 'Частиците на аромата се смесват с въздуха.' },
      { t: 'Кислородът от въздуха минава в кръвта в белите дробове.', d: true, why: 'Без тази дифузия не бихме могли да дишаме.' },
      { t: 'Разбъркваме супата с лъжица.', d: false, why: 'Това е разбъркване от нас, а не самоволно смесване.' },
      { t: 'Захарта на дъното на чая след време подслажда целия чай, без да бъркаме.', d: true, why: 'Частиците на захарта сами се разнасят във водата.' },
      { t: 'Ледът се топи на слънцето.', d: false, why: 'Това е топене — твърдото тяло става течност. Няма смесване на две вещества.' },
      { t: 'Рибите дишат кислород, който е проникнал от въздуха във водата.', d: true, why: 'Кислородът дифундира във водата — така живеят водните животни.' },
      { t: 'Топката се търкаля надолу по склона.', d: false, why: 'Това е движение на цяло тяло, не смесване на частици.' },
    ];
    shell.task(`<p>Дифузията е навсякъде около нас.</p>
      <p class="pt-q">Отбележи <b>всички</b> примери за дифузия:</p>
      <div class="choices pt-multi">${EX.map((e, i) => `<button class="choice" data-i="${i}"><span class="box"></span><span>${esc(e.t)}<span class="pt-why" hidden></span></span></button>`).join('')}</div>`);
    shell.score('');
    const picked = new Set();
    const c = shell.setControls('<button class="btn primary chk" disabled>Провери</button>');
    const chk = c.querySelector('.chk');
    container.querySelectorAll('.pt-multi .choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (picked.has(i)) picked.delete(i); else picked.add(i);
      b.classList.toggle('on', picked.has(i));
      chk.disabled = picked.size === 0;
    }));
    chk.addEventListener('click', () => {
      let bad = 0;
      container.querySelectorAll('.pt-multi .choice').forEach((b) => {
        const i = +b.dataset.i;
        const e = EX[i];
        b.disabled = true;
        const ok = picked.has(i) === e.d;
        if (!ok) bad++;
        if (e.d) b.classList.add(picked.has(i) ? 'right' : 'wrong');
        else if (picked.has(i)) b.classList.add('wrong');
        const w = b.querySelector('.pt-why');
        w.hidden = false;
        w.textContent = (e.d ? 'Дифузия. ' : 'Не е дифузия. ') + e.why;
      });
      mistakes += bad;
      shell.msg(bad ? `Сбърка ${bad}. Прочети обясненията под примерите.` : 'Всичко е вярно! 🎉', bad ? 'bad' : 'good');
      c.innerHTML = '';
      nextBtn(c, 'Към последния опит →', () => predict());
    });

    function predict() {
      shell.msg('');
      shell.task(`<p>В едната кутия отваряме <b>парфюм</b> — частиците му се смесват с <b>въздуха</b>. В чашата капваме <b>мастило</b> във <b>вода</b>. Температурата е една и съща.</p>
        <p class="pt-q">Предскажи: къде смесването ще стане по-бързо?</p>
        <div class="choices pred2">
          <button class="choice" data-v="liq">Във водата</button>
          <button class="choice" data-v="gas">Във въздуха</button>
          <button class="choice" data-v="same">Еднакво бързо</button>
        </div>`);
      const c2 = shell.setControls('<button class="btn primary go" disabled>▶ Започни опита</button>');
      const go = c2.querySelector('.go');
      let pred = null;
      container.querySelectorAll('.pred2 .choice').forEach((b) => b.addEventListener('click', () => {
        container.querySelectorAll('.pred2 .choice').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        pred = b.dataset.v;
        go.disabled = false;
      }));
      go.addEventListener('click', () => {
        go.remove();
        container.querySelectorAll('.pred2 .choice').forEach((b) => {
          b.disabled = true;
          if (b.dataset.v === 'gas') b.classList.add('right'); else if (b.classList.contains('on')) b.classList.add('wrong');
        });
        if (pred !== 'gas') mistakes++;
        try { shell.stageEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* няма значение */ }
        animate(0.5, (k) => { pc.position.set(0.2 * k, 0.3 + Math.sin(k * Math.PI) * 0.2 - 0.26 * k, 0); pc.rotation.z = -1.5 * k; });
        gasD.mesh.visible = true;
        gasD.drop(new THREE.Vector3(-0.85, 0.4, 0.35), 0.05);
        liqD.mesh.visible = true;
        liqD.sink = 0.4;
        liqD.drop(new THREE.Vector3(0, wBeaker.userData.H - 0.2, 0), 0.06);
        race2.on = true;
        race2.tagG = pin(airBox, '⏱ 0 мин', 'tag', 2.85);
        race2.tagL = pin(wBeaker, '⏱ 0 мин', 'tag', 2.85);
        shell.msg('Гледай…', '');
        race2.onGas = () => later(1.5, () => {
          say(airBox, 'В газа частиците са <b>далеч</b> една от друга и се движат <b>бързо</b>. Затова дифузията в газовете е най-бърза.', 'wide good', 3.4);
          shell.msg(pred === 'gas' ? 'Предсказа правилно! 🎉' : 'Предсказанието не позна — във въздуха стана много по-бързо.', pred === 'gas' ? 'good' : 'bad');
          scores.push(stepScore(mistakes, 3));
          const c3 = shell.setControls('<button class="btn primary">Виж резултата</button>');
          c3.querySelector('button').addEventListener('click', () => {
            clearTip();
            clearPins();
            const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
            shell.finish(ratio, onComplete, restart);
          });
        });
      });
    }
  }

  step1();
  return {
    dispose() {
      menu.remove();
      stage.dispose();
    },
  };
}
