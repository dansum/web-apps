// Модели за Първата световна война (1914–1918): танк Mark I, двуплан, облак газ, окопи с чували с пясък,
// бодлива тел и картечница, вагон-ресторант (Компиен, 1918), броненосец, Латинският мост в Сараево.
// Всичко е възстановка по снимки от епохата; размерите са в единици на модела (викащият мащабира).
// Без хора и без натуралистични сцени: оръжията се показват като предмети от музей.
import { THREE } from '../../kit.js';
import { M, archGeo } from './architecture.js';
import { mosque, mahalaHouse, col } from './city.js';
import { mergeStatic } from './medieval.js';

const GEO = new Map();
const G = (key, make) => { if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); };
const box = (w, h, d, m) => new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);
const cyl = (rt, rb, h, m, seg = 12) => new THREE.Mesh(G(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m);
const sph = (r, m, ws = 12, hs = 8) => new THREE.Mesh(G(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)), m);
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// ---------- текстури ----------
const TEXC = new Map();
function canvasTex(key, w, h, draw, rep = [1, 1]) {
  const k = `${key}|${rep}`;
  if (TEXC.has(k)) return TEXC.get(k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4;
  TEXC.set(k, t);
  return t;
}
const DRAW = {
  // Разкаляна земя с дупки и следи.
  mud(ctx, w, h) {
    ctx.fillStyle = '#7d6a4c'; ctx.fillRect(0, 0, w, h);
    const r = rnd(41);
    for (let i = 0; i < 420; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '60,48,32' : '160,140,105'},${0.1 + r() * 0.25})`; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 2 + r() * 9, 1.5 + r() * 5, r() * 3, 0, 7); ctx.fill(); }
  },
  // Плочите на веригата.
  track(ctx, w, h) {
    ctx.fillStyle = '#4a463c'; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { ctx.fillStyle = '#5f5a4c'; ctx.fillRect(x + 2, 0, 11, h); ctx.fillStyle = '#2f2c26'; ctx.fillRect(x + 13, 0, 3, h); }
  },
  // Нитове по бронята.
  armour(ctx, w, h) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,40,30,0.35)'; ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(30,30,20,0.45)';
    for (let x = 6; x < w; x += 12) for (const y of [5, 59, 69, 123]) { ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill(); }
  },
  // Платнище на чувал с пясък.
  sack(ctx, w, h) {
    ctx.fillStyle = '#c8b68a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(90,75,45,0.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 4) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let i = 0; i < h; i += 4) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
  },
  // Тиково дърво на вагона с позлатени линии.
  teak(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5a3820'); g.addColorStop(1, '#3e2614');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(20,10,5,0.35)';
    for (let x = 0; x < w; x += 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(0, h * 0.12, w, 2); ctx.fillRect(0, h * 0.86, w, 2);
  },
};
const TM = new Map();
function TMat(name, { color = 0xffffff, rep = [1, 1], rough = 0.85, metal = 0 } = {}) {
  const k = `${name}|${color}|${rep}|${rough}|${metal}`;
  if (!TM.has(k)) TM.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, map: canvasTex(name, 128, 128, DRAW[name], rep) }));
  return TM.get(k);
}

// ---------- танк Mark I (Великобритания, 1916) ----------
// Ромбовидна форма, веригите обикалят целия корпус, оръдията са в странични „спонсони“.
// Дължина около 1 (по x, напред е +x).
export function tank() {
  const g = new THREE.Group();
  const P = [[-0.5, 0.2], [-0.36, 0.0], [0.28, 0.0], [0.5, 0.2], [0.5, 0.3], [0.4, 0.42], [-0.32, 0.42], [-0.5, 0.3]];
  const shape = new THREE.Shape(P.map(([x, y]) => new THREE.Vector2(x, y)));
  const side = G('tankSide', () => { const s = new THREE.ExtrudeGeometry(shape, { depth: 0.11, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 }); s.translate(0, 0, -0.055); return s; });
  const trackM = TMat('track', { rep: [6, 6] });
  const hullM = TMat('armour', { color: 0x9a9272, rep: [3, 3], rough: 0.7, metal: 0.2 });
  for (const z of [-0.2, 0.2]) {
    const s = new THREE.Mesh(side, [hullM, trackM]); s.position.z = z; g.add(s);
    // Плочите по ръба като отделни ребра (веригата).
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(len / 0.045));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const pl = box(0.03, 0.012, 0.13, col(0x3b382f, { rough: 0.9 }));
        pl.position.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z);
        pl.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]);
        g.add(pl);
      }
    }
  }
  const body = box(0.62, 0.28, 0.3, hullM); body.position.set(-0.02, 0.24, 0); g.add(body);
  // Кабина отпред с наблюдателни процепи.
  const cab = box(0.16, 0.08, 0.26, hullM); cab.position.set(0.24, 0.42, 0); g.add(cab);
  for (const z of [-0.07, 0, 0.07]) { const sl = box(0.005, 0.012, 0.04, col(0x111111)); sl.position.set(0.322, 0.43, z); g.add(sl); }
  // Спонсони с оръдия.
  for (const s of [-1, 1]) {
    const sp = new THREE.Mesh(G('spons', () => { const sh = new THREE.Shape([new THREE.Vector2(-0.12, 0), new THREE.Vector2(0.12, 0), new THREE.Vector2(0.07, 0.15), new THREE.Vector2(-0.07, 0.15)]); const e = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false }); return e; }), hullM);
    sp.position.set(0.02, 0.14, s * 0.26); if (s < 0) sp.rotation.y = Math.PI; g.add(sp);
    const gun = cyl(0.014, 0.014, 0.2, col(0x2e2c26, { metal: 0.5, rough: 0.4 }), 8); gun.rotation.z = Math.PI / 2; gun.position.set(0.14, 0.22, s * 0.32); g.add(gun);
    const hatch = box(0.06, 0.08, 0.005, col(0x5c5746)); hatch.position.set(-0.08, 0.23, s * 0.338); g.add(hatch);
  }
  // Задните колела за завиване.
  const tail = box(0.22, 0.02, 0.02, col(0x4a4638)); tail.position.set(-0.6, 0.12, 0); g.add(tail);
  for (const z of [-0.06, 0.06]) { const w = cyl(0.07, 0.07, 0.03, col(0x3e3a30), 14); w.rotation.x = Math.PI / 2; w.position.set(-0.7, 0.07, z); g.add(w); }
  const exh = cyl(0.015, 0.015, 0.1, col(0x2a2620), 8); exh.position.set(-0.2, 0.47, 0.06); g.add(exh);
  g.userData.exhaust = new THREE.Vector3(-0.2, 0.53, 0.06);
  return mergeStatic(g);
}

// ---------- двуплан (около 1916 г.) ----------
// Два платнени носещи плоскости, подпори, витло отпред (+x), опашка, колесник. Размах около 1.
export function biplane({ roundel = [0x2a4fa0, 0xffffff, 0xc0392b] } = {}) {
  const g = new THREE.Group();
  const linen = col(0xd9cfae, { rough: 0.9 }), wood = col(0x8a6a44), dark = col(0x2b2a26, { metal: 0.4, rough: 0.5 });
  const fus = new THREE.Mesh(G('fus', () => { const c = new THREE.CylinderGeometry(0.045, 0.02, 0.62, 8); c.rotateZ(Math.PI / 2); return c; }), linen);
  fus.position.set(-0.05, 0, 0); g.add(fus);
  const cowl = cyl(0.055, 0.05, 0.08, col(0x9a9a92, { metal: 0.5, rough: 0.4 }), 12); cowl.rotation.z = Math.PI / 2; cowl.position.set(0.28, 0, 0); g.add(cowl);
  const cock = box(0.07, 0.02, 0.06, col(0x3b2a1a)); cock.position.set(0.02, 0.045, 0); g.add(cock);
  for (const y of [0.13, -0.05]) {
    const w = box(0.17, 0.014, y > 0 ? 1.0 : 0.88, linen); w.position.set(0.12, y, 0); g.add(w);
    const edge = box(0.012, 0.016, y > 0 ? 1.0 : 0.88, wood); edge.position.set(0.205, y, 0); g.add(edge);
  }
  for (const z of [-0.4, -0.15, 0.15, 0.4]) for (const x of [0.06, 0.18]) { const s = cyl(0.005, 0.005, 0.18, wood, 5); s.position.set(x, 0.04, z); g.add(s); }
  // Опознавателни кръгове отгоре на крилото.
  roundel.forEach((c, i) => {
    for (const z of [-0.36, 0.36]) {
      const d = new THREE.Mesh(G(`rd${i}`, () => new THREE.CircleGeometry(0.06 - i * 0.02, 16)), col(c));
      d.rotation.x = -Math.PI / 2; d.position.set(0.12, 0.138 + i * 0.001, z); g.add(d);
    }
  });
  const stab = box(0.1, 0.01, 0.28, linen); stab.position.set(-0.34, 0.0, 0); g.add(stab);
  const fin = new THREE.Mesh(G('fin', () => { const s = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.12, 0), new THREE.Vector2(0.02, 0.12)]); return new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: false }); }), linen);
  fin.position.set(-0.4, 0.0, -0.004); g.add(fin);
  for (const z of [-0.08, 0.08]) {
    const leg = cyl(0.005, 0.005, 0.12, dark, 5); leg.position.set(0.18, -0.1, z * 0.7); leg.rotation.x = z > 0 ? -0.3 : 0.3; g.add(leg);
    const wh = cyl(0.035, 0.035, 0.015, dark, 14); wh.rotation.x = Math.PI / 2; wh.position.set(0.18, -0.16, z); g.add(wh);
  }
  const prop = new THREE.Group(); prop.position.set(0.33, 0, 0);
  const blade = box(0.012, 0.24, 0.025, wood); prop.add(blade);
  const hub = sph(0.018, dark); prop.add(hub);
  g.add(prop);
  g.userData.prop = prop;
  return mergeStatic(g, [prop]);
}

// ---------- облак газ ----------
// Спокоен жълто-зелен облак, който пълзи по земята и избледнява. Без хора.
export function gasCloud(n = 9, seed = 5) {
  const g = new THREE.Group();
  const r = rnd(seed);
  const m = new THREE.MeshStandardMaterial({ color: 0xc9d36a, transparent: true, opacity: 0.38, roughness: 1, depthWrite: false });
  for (let i = 0; i < n; i++) {
    const s = sph(0.12 + r() * 0.1, m, 12, 9);
    s.position.set((r() - 0.5) * 0.7, 0.06 + r() * 0.08, (r() - 0.5) * 0.35);
    s.scale.set(1.4, 0.6, 1);
    s.userData.ph = r() * 6;
    g.add(s);
  }
  g.userData.mat = m;
  return g;
}
export function animateGas(g, t, dt, { from = -0.3, to = 0.5 } = {}) {
  const k = (t * 0.06) % 1;
  g.position.x = from + (to - from) * k;
  g.userData.mat.opacity = 0.42 * Math.sin(Math.PI * k);
  for (const s of g.children) { const q = 1 + 0.15 * Math.sin(t * 0.8 + s.userData.ph); s.scale.set(1.4 * q, 0.6 * q, q); }
}

// ---------- окопи ----------
// Зигзагообразен окоп: дъно от дъски, парапет от чували с пясък от двете страни, колове за тел отпред.
// pts: точки [x, z] по оста на окопа (в равнината y = 0).
export function trench(pts, { width = 0.1, wire = true, wireSide = 1 } = {}) {
  const g = new THREE.Group();
  const sackM = TMat('sack', { rep: [1, 1] });
  const plank = col(0x6b4f30, { rough: 0.9 }), floor = col(0x4b3a26, { rough: 1 });
  const sack = G('sack', () => { const b = new THREE.BoxGeometry(0.05, 0.022, 0.026, 2, 1, 1); const p = b.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, p.getY(i) * (1 - Math.abs(x) * 6)); } b.computeVertexNormals(); return b; });
  const sacks = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax);
    const mid = [(ax + bx) / 2, (az + bz) / 2];
    const nx = -Math.sin(ang), nz = Math.cos(ang);
    const fl = box(len + width * 0.6, 0.004, width, floor); fl.position.set(mid[0], 0.003, mid[1]); fl.rotation.y = -ang; g.add(fl);
    // Дъските по дъното.
    const n = Math.max(2, Math.round(len / 0.03));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const pl = box(0.008, 0.004, width * 0.6, plank); pl.position.set(ax + (bx - ax) * t, 0.007, az + (bz - az) * t); pl.rotation.y = -ang; g.add(pl);
    }
    for (const s of [-1, 1]) {
      const m = Math.max(2, Math.round(len / 0.048));
      for (let row = 0; row < 3; row++) {
        for (let k = 0; k < m; k++) {
          const t = (k + 0.5 + (row % 2) * 0.5) / (m + 0.5);
          sacks.push([ax + (bx - ax) * t + nx * s * (width / 2 + 0.02), 0.012 + row * 0.02, az + (bz - az) * t + nz * s * (width / 2 + 0.02), -ang]);
        }
      }
    }
    if (wire) {
      // Бодлива тел: кръстати колове и навита тел между тях.
      const wm = col(0x5a5852, { metal: 0.6, rough: 0.5 });
      const off = wireSide * (width / 2 + 0.16);
      const m2 = Math.max(2, Math.round(len / 0.07));
      for (let k = 0; k <= m2; k++) {
        const t = k / m2, x = ax + (bx - ax) * t + nx * off, z = az + (bz - az) * t + nz * off;
        for (const tilt of [-0.5, 0.5]) { const p = cyl(0.003, 0.003, 0.07, col(0x5a4630), 4); p.position.set(x, 0.03, z); p.rotation.set(tilt * Math.cos(ang), 0, tilt * Math.sin(ang)); g.add(p); }
        if (k < m2) {
          const coil = new THREE.Mesh(G('coil', () => new THREE.TorusGeometry(0.018, 0.0018, 4, 14)), wm);
          for (let c = 0; c < 3; c++) {
            const tt = t + (c + 0.5) / (3 * m2);
            const cc = coil.clone(); cc.position.set(ax + (bx - ax) * tt + nx * off, 0.026, az + (bz - az) * tt + nz * off); cc.rotation.y = -ang + Math.PI / 2; g.add(cc);
          }
        }
      }
    }
  }
  const im = new THREE.InstancedMesh(sack, sackM, sacks.length);
  const o = new THREE.Object3D();
  sacks.forEach(([x, y, z, a], i) => { o.position.set(x, y, z); o.rotation.set(0, a + (i % 3) * 0.06, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  mergeStatic(g);
  g.add(im);
  return g;
}

// Картечница с водно охлаждане на тринога (като „Максим“ / „Викърс“).
export function machineGun() {
  const g = new THREE.Group();
  const steel = col(0x3a3a36, { metal: 0.55, rough: 0.45 }), brass = col(0xb08d3c, { metal: 0.6, rough: 0.35 });
  const jacket = cyl(0.022, 0.022, 0.2, steel, 12); jacket.rotation.z = Math.PI / 2; jacket.position.set(0.08, 0.1, 0); g.add(jacket);
  for (let i = 0; i < 6; i++) { const r = cyl(0.024, 0.024, 0.006, steel, 12); r.rotation.z = Math.PI / 2; r.position.set(0.0 + i * 0.03, 0.1, 0); g.add(r); }
  const muzzle = cyl(0.008, 0.012, 0.04, steel, 8); muzzle.rotation.z = Math.PI / 2; muzzle.position.set(0.2, 0.1, 0); g.add(muzzle);
  const recv = box(0.1, 0.045, 0.04, steel); recv.position.set(-0.06, 0.1, 0); g.add(recv);
  const grip = box(0.02, 0.03, 0.05, col(0x5a3f26)); grip.position.set(-0.12, 0.1, 0); g.add(grip);
  const belt = box(0.04, 0.008, 0.08, brass); belt.position.set(-0.05, 0.09, 0.05); g.add(belt);
  const head = cyl(0.012, 0.012, 0.03, steel, 8); head.position.set(-0.04, 0.07, 0); g.add(head);
  for (const [x, z] of [[0.08, 0], [-0.1, 0.06], [-0.1, -0.06]]) {
    const leg = cyl(0.005, 0.005, 0.1, steel, 5);
    leg.position.set(-0.04 + x * 0.5, 0.035, z * 0.5); leg.rotation.set(z * 4, 0, -x * 4); g.add(leg);
  }
  return mergeStatic(g);
}

// Фуния от снаряд: тъмна вдлъбнатина с повдигнат ръб.
export function crater(r = 0.06) {
  const g = new THREE.Group();
  const d = new THREE.Mesh(G(`cr${r}`, () => new THREE.CircleGeometry(r, 16)), col(0x4a3b29, { rough: 1 }));
  d.rotation.x = -Math.PI / 2; d.position.y = 0.002; g.add(d);
  const rim = new THREE.Mesh(G(`crr${r}`, () => new THREE.TorusGeometry(r, r * 0.22, 5, 18)), col(0x8a7552, { rough: 1 }));
  rim.rotation.x = -Math.PI / 2; rim.scale.z = 0.5; g.add(rim);
  return g;
}
// Изпочупено дърво без клони.
export function stump(h = 0.12, seed = 1) {
  const g = new THREE.Group();
  const r = rnd(seed + 3);
  const t = cyl(0.008, 0.012, h, col(0x4a3a2a, { rough: 1 }), 6); t.position.y = h / 2; t.rotation.z = (r() - 0.5) * 0.3; g.add(t);
  const b = cyl(0.003, 0.005, h * 0.4, col(0x4a3a2a), 5); b.position.set(0.012, h * 0.7, 0); b.rotation.z = -0.8; g.add(b);
  return g;
}

// Плоча-диорама: разкаляна кръгла земя с ръб (като макет в музей). Връща групата; горната повърхност е при y = 0.
export function dioramaBase(R = 1) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(G(`dio${R}`, () => new THREE.CylinderGeometry(R, R, 0.08, 48)), TMat('mud', { rep: [3, 3] }));
  top.position.y = -0.04; g.add(top);
  const rim = new THREE.Mesh(G(`dior${R}`, () => new THREE.CylinderGeometry(R + 0.04, R + 0.06, 0.14, 48, 1, true)), col(0x4a3524, { rough: 0.7, side: THREE.DoubleSide }));
  rim.position.y = -0.06; g.add(rim);
  const foot = cyl(R * 0.25, R * 0.35, 0.6, col(0x5a4330, { rough: 0.7 }), 20); foot.position.y = -0.4; g.add(foot);
  return g;
}

// ---------- вагонът от Компиен ----------
// Вагон-ресторант от тиково дърво на релси в гората. Тук на 11 ноември 1918 г. е подписано примирието.
export function wagon() {
  const g = new THREE.Group();
  const L = 1, W = 0.2, H = 0.2;
  const teak = TMat('teak', { rep: [4, 1] });
  const body = box(L, H, W, teak); body.position.y = 0.12 + H / 2; g.add(body);
  const roof = new THREE.Mesh(G('wroof', () => { const c = new THREE.CylinderGeometry(W * 0.62, W * 0.62, L + 0.02, 16, 1, false, -Math.PI / 2.8, Math.PI / 1.4); c.rotateZ(Math.PI / 2); return c; }), col(0x3a3532, { rough: 0.6 }));
  roof.position.y = 0.12 + H - 0.03; g.add(roof);
  const glass = col(0xd9e2e6, { rough: 0.2, metal: 0.1 }), frame = col(0xc9a54a, { metal: 0.5, rough: 0.4 });
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
    const x = -L / 2 + 0.1 + i * 0.1;
    const w = box(0.06, 0.07, 0.004, glass); w.position.set(x, 0.12 + H * 0.6, s * (W / 2 + 0.002)); g.add(w);
    const f = box(0.066, 0.004, 0.005, frame); f.position.set(x, 0.12 + H * 0.6 + 0.037, s * (W / 2 + 0.002)); g.add(f);
  }
  for (const x of [-L / 2 - 0.015, L / 2 + 0.015]) { const p = box(0.03, 0.03, W * 0.9, col(0x2a2a2a)); p.position.set(x, 0.14, 0); g.add(p); }
  const steel = col(0x2b2b2b, { metal: 0.5, rough: 0.5 });
  for (const x of [-L * 0.35, L * 0.35]) {
    const bog = box(0.18, 0.04, W * 0.8, steel); bog.position.set(x, 0.1, 0); g.add(bog);
    for (const dx of [-0.06, 0.06]) for (const z of [-W * 0.42, W * 0.42]) { const wh = cyl(0.04, 0.04, 0.015, steel, 14); wh.rotation.x = Math.PI / 2; wh.position.set(x + dx, 0.05, z); g.add(wh); }
  }
  // Релси и траверси.
  for (const z of [-W * 0.42, W * 0.42]) { const r = box(L * 1.6, 0.012, 0.012, col(0x8a8a86, { metal: 0.7, rough: 0.35 })); r.position.set(0, 0.016, z); g.add(r); }
  for (let i = 0; i < 16; i++) { const s = box(0.03, 0.01, W * 1.3, col(0x5a4330)); s.position.set(-L * 0.78 + i * L * 1.56 / 15, 0.005, 0); g.add(s); }
  // Гората наоколо.
  const r = rnd(9);
  for (let i = 0; i < 12; i++) {
    const tr = new THREE.Group();
    const h = 0.18 + r() * 0.12;
    const trunk = cyl(0.012, 0.016, h * 0.5, col(0x5a4330), 6); trunk.position.y = h * 0.25; tr.add(trunk);
    const crown = sph(0.07 + r() * 0.04, col(r() > 0.5 ? 0x4f7a3a : 0x5f8a44, { rough: 1 }), 10, 8); crown.position.y = h * 0.6; crown.scale.y = 1.3; tr.add(crown);
    const a = r() * Math.PI * 2, d = 0.3 + r() * 0.35;
    tr.position.set(Math.cos(a) * d * 1.6, 0, Math.sin(a) * d + (Math.sin(a) > 0 ? 0.12 : -0.12));
    g.add(tr);
  }
  return mergeStatic(g);
}

// ---------- броненосец (дредноут) ----------
// Сив корпус, кули с оръдия, два комина с дим. Дължина около 1 (напред е +x).
export function warship() {
  const g = new THREE.Group();
  const grey = col(0x7d848a, { rough: 0.6, metal: 0.2 }), dark = col(0x4a4f54, { rough: 0.6 }), deck = col(0xb8a98a);
  const hull = new THREE.Mesh(G('hull', () => {
    const s = new THREE.Shape([new THREE.Vector2(-0.5, -0.07), new THREE.Vector2(0.38, -0.07), new THREE.Vector2(0.5, 0), new THREE.Vector2(0.38, 0.07), new THREE.Vector2(-0.5, 0.07), new THREE.Vector2(-0.53, 0)]);
    const e = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }); e.rotateX(Math.PI / 2); e.translate(0, 0.04, 0); return e;
  }), grey);
  g.add(hull);
  const dk = box(0.92, 0.004, 0.12, deck); dk.position.set(-0.04, 0.042, 0); g.add(dk);
  const sup = box(0.24, 0.06, 0.08, grey); sup.position.set(0.0, 0.075, 0); g.add(sup);
  const bridge = box(0.06, 0.05, 0.07, grey); bridge.position.set(0.1, 0.13, 0); g.add(bridge);
  const mast = cyl(0.005, 0.006, 0.18, dark, 5); mast.position.set(0.08, 0.2, 0); g.add(mast);
  const funnels = [];
  for (const x of [-0.04, -0.12]) { const f = cyl(0.022, 0.024, 0.09, dark, 10); f.position.set(x, 0.135, 0); g.add(f); funnels.push(new THREE.Vector3(x, 0.19, 0)); }
  for (const x of [0.28, 0.18, -0.22, -0.34]) {
    const t = cyl(0.035, 0.038, 0.03, grey, 12); t.position.set(x, 0.06, 0); g.add(t);
    for (const z of [-0.012, 0.012]) { const gun = cyl(0.005, 0.005, 0.09, dark, 6); gun.rotation.z = Math.PI / 2; gun.position.set(x + (x > 0 ? 0.06 : -0.06), 0.066, z); g.add(gun); }
  }
  g.userData.funnels = funnels;
  return mergeStatic(g);
}

// ---------- Сараево: Латинският мост над Миляцка ----------
// Каменен мост с четири арки, крайбрежни къщи и джамия с минаре. Около 1 широко.
export function sarajevoBridge() {
  const g = new THREE.Group();
  const water = new THREE.Mesh(G('river', () => new THREE.BoxGeometry(1.4, 0.02, 0.22)), new THREE.MeshStandardMaterial({ color: 0x5f9cc4, roughness: 0.3, metalness: 0.1 }));
  water.position.y = 0.0; g.add(water);
  for (const s of [-1, 1]) { const bank = box(1.4, 0.06, 0.12, M(0xffffff, { tex: 'stone', rep: [8, 0.5] })); bank.position.set(0, 0.03, s * 0.17); g.add(bank); }
  const stone = M(0xe6dccb, { tex: 'limestone', rep: [0.5, 0.5] });
  const bridge = new THREE.Group();
  const spans = 4, sw = 0.1;
  for (let i = 0; i < spans; i++) {
    const a = new THREE.Mesh(archGeo(sw, 0.11, 0.07, 0.8), stone);
    a.position.set(0, 0.0, (i - (spans - 1) / 2) * sw);
    a.rotation.y = Math.PI / 2;
    bridge.add(a);
  }
  const deck = box(0.08, 0.015, sw * spans + 0.08, stone); deck.position.y = 0.117; bridge.add(deck);
  for (const x of [-0.035, 0.035]) { const par = box(0.01, 0.025, sw * spans + 0.08, stone); par.position.set(x, 0.137, 0); bridge.add(par); }
  // Отворите за висока вода над стълбовете.
  for (let i = 1; i < spans; i++) { const o = new THREE.Mesh(G('ocul', () => new THREE.CylinderGeometry(0.012, 0.012, 0.072, 10)), col(0x3a3a3a)); o.rotation.z = Math.PI / 2; o.position.set(0, 0.085, (i - spans / 2) * sw); bridge.add(o); }
  bridge.position.set(0.05, 0, 0);
  g.add(bridge);
  // Къщи по двата бряга и джамия с минаре.
  const houses = [[-0.45, -0.32, 0], [-0.22, -0.34, 0.2], [0.3, -0.33, -0.1], [0.52, -0.32, 0.1], [-0.4, 0.33, Math.PI], [0.42, 0.34, Math.PI]];
  for (const [x, z, a] of houses) { const h = mahalaHouse({ w: 1.3, d: 1.0, color: [0xf1ece0, 0xe8dcc0, 0xf0e2d0][Math.abs(Math.round(x * 10)) % 3] }); h.scale.setScalar(0.12); h.position.set(x, 0.06, z); h.rotation.y = a; g.add(h); }
  const mq = mosque({ s: 2.0, h: 0.9 }); mq.scale.setScalar(0.09); mq.position.set(0.05, 0.06, 0.4); mq.rotation.y = Math.PI; g.add(mq);
  g.userData.water = water;
  return mergeStatic(g, [water]);
}
