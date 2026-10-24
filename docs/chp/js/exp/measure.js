// „measure“ — тела, вещества, обем и маса; измерване.
// 3.1.1 (3. клас): от какво са телата → колко място заемат (водата в каната се покачва) → кое е по-тежко (везна с блюда) → подреди по вещество.
// 5.1.1 (5. клас): опознай уредите → налей точно и отчети по скалата, L ↔ mL → маса и обем на камъче (V = V2 − V1) → твърдо, течно, газ: форма, обем, маса.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, zoneRing, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const fmt = (x, d = 1) => String(+x.toFixed(d)).replace('.', ',');
const num = (s) => parseFloat(String(s).trim().replace(/\s/g, '').replace(',', '.'));

function injectStyle() {
  if (document.getElementById('measure-style')) return;
  const s = document.createElement('style');
  s.id = 'measure-style';
  s.textContent = `
  .measure-mag { padding:4px 6px 2px; }
  .measure-mag svg { display:block; }
  .measure-in { display:grid; gap:6px; margin-top:6px; }
  .measure-in .num input { width:5.5em; }
  .measure-q { font-weight:700; margin:8px 0 6px; }
  .measure-pour { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
  .measure-pour .btn { padding:6px 10px; }
  .measure-list { margin:4px 0; padding-left:1.1em; }
  .measure-list li.ok { color:#0d7a3a; }
  .measure-grid { width:100%; border-collapse:collapse; font-size:.88rem; margin-top:6px; }
  .measure-grid th, .measure-grid td { border-bottom:1px solid #e3e8ef; padding:4px 2px; text-align:center; }
  .measure-grid th:first-child, .measure-grid td:first-child { text-align:left; }
  .measure-cell { font:inherit; font-weight:700; min-width:3.2em; padding:4px 6px; border-radius:7px; border:2px solid #c7d3e0; background:#fff; cursor:pointer; }
  .measure-cell.right { border-color:#1fab54; background:#e9f8ef; }
  .measure-cell.wrong { border-color:#d92916; background:#fdeceb; }
  .measure-mat { display:flex; flex-wrap:wrap; gap:6px; margin:6px 0; }
  .measure-mat button.on { border-color:#1865f2; background:#eef4ff; }
  `;
  document.head.appendChild(s);
}

// ---------- материали и текстури ----------
const glassMat = (opacity = 0.26) => new THREE.MeshStandardMaterial({
  color: 0xe3f2ff, transparent: true, opacity, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide,
});
const liquidMat = (color = 0x5fb4e6, opacity = 0.62) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.15, depthWrite: false });
function canvasTex(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { c, x: c.getContext('2d'), t };
}
function puffTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- съдове (профил на въртене) ----------
// Съдът е описан с вътрешния радиус rin(y) за y от дъното (0) до ръба (depth).
const SHAPES = {
  cup: { floor: 0.04, depth: 0.5, t: 0.025, rin: () => 0.22 },
  jug3: { floor: 0.06, depth: 1.3, t: 0.03, rin: () => 0.34 },
  cyl: { floor: 0.1, depth: 2.0, t: 0.022, rin: () => 0.36 },
  beaker: { floor: 0.05, depth: 1.2, t: 0.03, rin: () => 0.62 },
  glass: { floor: 0.06, depth: 1.9, t: 0.03, rin: () => 0.32 },
  bowl: { floor: 0.09, depth: 0.75, t: 0.04, rin: (y) => Math.sqrt(Math.max(0, 0.9 ** 2 - (0.9 - y) ** 2)) },
  flask: { floor: 0.05, depth: 1.5, t: 0.03, rin: (y) => (y < 1.0 ? 0.65 - 0.5 * y : 0.15) },
  jar: { floor: 0.06, depth: 1.25, t: 0.03, rin: () => 0.55 },
};
function volumeOf(sh, h) {
  const n = 60;
  let v = 0;
  for (let i = 0; i < n; i++) { const y = ((i + 0.5) / n) * h; v += Math.PI * sh.rin(y) ** 2 * (h / n); }
  return v;
}
function heightFor(sh, V) {
  if (V <= 1e-6) return 0;
  let lo = 0; let hi = sh.depth;
  if (volumeOf(sh, hi) <= V) return hi;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (volumeOf(sh, mid) < V) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
function wallGeo(sh) {
  const pts = [];
  const n = 30;
  const { floor, depth, t } = sh;
  pts.push(new THREE.Vector2(0, floor - t), new THREE.Vector2(sh.rin(0) + t, floor - t));
  for (let i = 0; i <= n; i++) { const y = (i / n) * depth; pts.push(new THREE.Vector2(sh.rin(y) + t, floor + y)); }
  pts.push(new THREE.Vector2(sh.rin(depth) + t * 0.5, floor + depth + 0.012));
  for (let i = n; i >= 0; i--) { const y = (i / n) * depth; pts.push(new THREE.Vector2(sh.rin(y), floor + y)); }
  pts.push(new THREE.Vector2(0, floor));
  return new THREE.LatheGeometry(pts, 36);
}
function liquidGeo(sh, h) {
  const pts = [new THREE.Vector2(0, 0)];
  const n = 20;
  for (let i = 0; i <= n; i++) { const y = (i / n) * h; pts.push(new THREE.Vector2(Math.max(0.001, sh.rin(y) - 0.006), y)); }
  pts.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(pts, 30);
}
function makeVessel(shapeName, liquid = 0x5fb4e6) {
  const sh = SHAPES[shapeName];
  const g = new THREE.Group();
  const wall = new THREE.Mesh(wallGeo(sh), glassMat());
  wall.renderOrder = 3;
  g.add(wall);
  const liq = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat(liquid));
  liq.position.y = sh.floor;
  liq.renderOrder = 1;
  liq.visible = false;
  g.add(liq);
  const lip = new THREE.Object3D();
  lip.position.set(sh.rin(sh.depth) + sh.t, sh.floor + sh.depth, 0);
  g.add(lip);
  g.userData.vessel = { sh, liq, vol: -1, h: 0, lip, ml: 0 };
  return g;
}
function setVol(g, V) {
  const v = g.userData.vessel;
  const h = heightFor(v.sh, Math.max(0, V));
  if (Math.abs(h - v.h) < 2e-4 && v.vol >= 0) return;
  v.vol = V;
  v.h = h;
  v.liq.geometry.dispose();
  v.liq.geometry = h > 0.004 ? liquidGeo(v.sh, h) : new THREE.BufferGeometry();
  v.liq.visible = h > 0.004;
}

// Скала с черти, нарисувана върху прозрачна лента пред стъклото.
function scaleStrip({ maxML, k, minor, major, labelEvery, w = 0.3, unit = 'mL' }) {
  const H = maxML * k;
  const ch = 1536;
  const cw = Math.max(64, Math.round((ch * w) / H));
  const T = canvasTex(cw, ch);
  const x = T.x;
  const ppu = ch / H;
  x.strokeStyle = '#1d3a57'; x.fillStyle = '#1d3a57';
  for (let v = minor; v < maxML; v += minor) {
    const y = ch - v * k * ppu;
    const isMaj = v % major === 0;
    const half = v % (major / 2) === 0;
    x.lineWidth = isMaj ? Math.max(3, ppu * 0.008) : Math.max(2, ppu * 0.004);
    const len = (isMaj ? 0.12 : half ? 0.085 : 0.05) * ppu;
    x.beginPath(); x.moveTo(0, y); x.lineTo(len, y); x.stroke();
    if (v % labelEvery === 0) {
      x.font = `700 ${Math.round(0.075 * ppu)}px system-ui, Arial`;
      x.textBaseline = 'middle';
      x.fillText(String(v), 0.14 * ppu, y);
    }
  }
  x.font = `700 ${Math.round(0.065 * ppu)}px system-ui, Arial`;
  x.textBaseline = 'top';
  x.fillText(unit, 0.14 * ppu, 4);
  T.t.needsUpdate = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), new THREE.MeshBasicMaterial({ map: T.t, transparent: true, depthWrite: false }));
  m.renderOrder = 4;
  m.raycast = () => {};
  return m;
}

// Лупа: увеличената скала около повърхността (с вдлъбнатата повърхност — менискуса).
function magSVG(level) {
  const W = 120; const Hh = 132; const ppm = 5.6; const cy = Hh / 2;
  let s = `<svg width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}"><rect x="0" y="0" width="${W}" height="${Hh}" rx="8" fill="#f7fbff"/>`;
  s += `<path d="M0 ${cy - 7} Q ${W / 2} ${cy + 7} ${W} ${cy - 7} L ${W} ${Hh} L 0 ${Hh} Z" fill="#8fd0f5" opacity="0.75"/>`;
  for (let v = Math.ceil(level - 12); v <= Math.floor(level + 12); v++) {
    if (v < 0) continue;
    const y = cy - (v - level) * ppm;
    const len = v % 10 === 0 ? 32 : v % 5 === 0 ? 22 : 12;
    s += `<line x1="6" x2="${6 + len}" y1="${y}" y2="${y}" stroke="#1d3a57" stroke-width="${v % 5 === 0 ? 1.8 : 1}"/>`;
    if (v % 5 === 0) s += `<text x="44" y="${y + 5}" font-size="14" font-weight="700" fill="#1d3a57" font-family="system-ui,Arial">${v}</text>`;
  }
  s += `<text x="${W - 30}" y="16" font-size="11" fill="#4a5b6c" font-family="system-ui,Arial">mL</text></svg>`;
  return s;
}

// ---------- обща стая ----------
function buildRoom(scene, tableW, tableD) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 30), mat(0xc9a77c));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.6;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(50, 14), mat(0xf3ead8));
  wall.position.set(0, 3.5, -3.4);
  scene.add(wall);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(50, 0.22), mat(0x9ccc65));
  strip.position.set(0, 0.6, -3.39);
  scene.add(strip);
  // прозорец с облачета
  const win = new THREE.Group();
  win.add(new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ color: 0x9fd4ff })));
  const hill = new THREE.Mesh(new THREE.CircleGeometry(2, 30, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8bc34a }));
  hill.position.set(0.3, -1, 0.005);
  hill.scale.y = 0.35;
  win.add(hill);
  const clouds = [];
  for (let i = 0; i < 2; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.2 + k * 0.04, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      p.position.set(k * 0.24 - 0.24, (k % 2) * 0.08, 0.01 + k * 0.001);
      c.add(p);
    }
    c.position.set(-1 + i * 1.5, 0.5 - i * 0.32, 0);
    win.add(c);
    clouds.push(c);
  }
  const frameM = mat(0xffffff);
  for (const [w, h, x, y] of [[3.2, 0.12, 0, 1.02], [3.2, 0.12, 0, -1.02], [0.12, 2.16, 1.54, 0], [0.12, 2.16, -1.54, 0], [0.08, 2, 0, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameM);
    f.position.set(x, y, 0.04);
    win.add(f);
  }
  const curtains = [];
  for (const s of [-1, 1]) {
    const cu = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.4), new THREE.MeshStandardMaterial({ color: 0x81c784, side: THREE.DoubleSide, roughness: 0.9 }));
    cu.position.set(s * 1.9, -0.05, 0.12);
    win.add(cu);
    curtains.push(cu);
  }
  win.position.set(-2.4, 2.9, -3.35);
  scene.add(win);
  // часовник с махало
  const clock = new THREE.Group();
  clock.add(new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), mat(0xffffff)), new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 32), mat(0x6d4c41)));
  const hand = (len, w) => {
    const h = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.02), new THREE.MeshBasicMaterial({ color: 0x333333 }));
    m.position.y = len / 2;
    h.add(m);
    h.position.z = 0.02;
    clock.add(h);
    return h;
  };
  const hh = hand(0.22, 0.04); const mh = hand(0.34, 0.03);
  const pend = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.7, 0.02), mat(0xc9a227));
  rod.position.y = -0.35;
  const bob = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), mat(0xc9a227));
  bob.position.set(0, -0.75, 0.01);
  pend.add(rod, bob);
  pend.position.set(0, -0.45, 0.01);
  clock.add(pend);
  clock.position.set(2.6, 3.3, -3.35);
  scene.add(clock);
  // маса
  const wood = mat(0xa8774d, { roughness: 0.7 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(tableW, 0.2, tableD), wood);
  top.position.set(0, -0.1, 0.2);
  scene.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 2.4, 10), wood);
    leg.position.set(sx * (tableW / 2 - 0.4), -1.4, 0.2 + sz * (tableD / 2 - 0.4));
    scene.add(leg);
  }
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(tableW - 0.6, tableD - 0.6), mat(0xfaf6ee, { roughness: 0.95 }));
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.set(0, 0.003, 0.2);
  scene.add(cloth);
  return (dt, t) => {
    for (const [i, c] of clouds.entries()) { c.position.x += dt * (0.05 + i * 0.03); if (c.position.x > 1.8) c.position.x = -1.8; }
    curtains.forEach((cu, i) => { cu.rotation.y = Math.sin(t * 0.6 + i) * 0.08; });
    const now = new Date();
    mh.rotation.z = -(now.getMinutes() + now.getSeconds() / 60) / 60 * Math.PI * 2;
    hh.rotation.z = -((now.getHours() % 12) + now.getMinutes() / 60) / 12 * Math.PI * 2;
    pend.rotation.z = Math.sin(t * Math.PI) * 0.2;
  };
}

// ---------- модели на телата ----------
function stoneModel() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), mat(0x8f8a84, { flat: true }));
  m.scale.set(1.15, 0.75, 1);
  m.rotation.set(0.3, 0.5, 0.1);
  g.add(m);
  return g;
}
function cubeModel(color, metal) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), metal ? mat(color, { metalness: 0.75, roughness: 0.3 }) : mat(color)));
  if (!metal) {
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.BoxGeometry(0.302, 0.012, 0.012), mat(0x9a6a3a));
      ring.position.set(0, -0.09 + i * 0.09, 0.151);
      g.add(ring);
    }
  }
  return g;
}
function appleModel() {
  const g = new THREE.Group();
  const a = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), mat(0xd83a2e, { roughness: 0.45 }));
  a.scale.y = 0.9;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.1, 6), mat(0x6d4c41));
  stem.position.y = 0.21;
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0x43a047));
  leaf.scale.set(1, 0.25, 0.5);
  leaf.position.set(0.06, 0.23, 0);
  g.add(a, stem, leaf);
  return g;
}
function marbleModel() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshStandardMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.7, roughness: 0.05 })));
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 6, 16), mat(0x1e88e5));
  sw.rotation.x = 0.8;
  g.add(sw);
  return g;
}
function balloonLying(flat) {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xe53950, roughness: 0.3 });
  if (flat) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), red);
    b.scale.set(1.7, 0.32, 0.9);
    const k = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 8), mat(0xc62840));
    k.rotation.z = Math.PI / 2;
    k.position.x = -0.24;
    g.add(b, k);
  } else {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 16), red);
    b.scale.set(1.25, 0.95, 0.95);
    const k = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 8), mat(0xc62840));
    k.rotation.z = Math.PI / 2;
    k.position.x = -0.38;
    g.add(b, k);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    shine.position.set(0.12, 0.16, 0.16);
    g.add(shine);
  }
  return g;
}
function spoonModel(color) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.5 });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.06), m);
  handle.position.set(-0.13, -0.015, 0);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m);
  bowl.scale.set(1.4, 0.5, 1);
  bowl.position.set(0.2, 0.02, 0);
  g.add(handle, bowl);
  return g;
}
function nailModel() {
  const g = new THREE.Group();
  const steel = mat(0x8c939b, { metalness: 0.8, roughness: 0.35 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), steel);
  shaft.rotation.z = Math.PI / 2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 8), steel);
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 0.28;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), steel);
  head.rotation.z = Math.PI / 2;
  head.position.x = -0.25;
  g.add(shaft, tip, head);
  return g;
}
function brickModel() {
  const g = new THREE.Group();
  const m = mat(0xfdd835, { roughness: 0.35 });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.2), m));
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 10), m);
    s.position.set(-0.1 + (i % 2) * 0.2 - 0.0, 0.12, i < 2 ? -0.05 : 0.05);
    s.position.x = i % 2 ? 0.1 : -0.1;
    g.add(s);
  }
  return g;
}
function cupModel() {
  const g = makeVessel('cup');
  setVol(g, volumeOf(SHAPES.cup, 0.36));
  return g;
}

// Електронна везна (от density.js).
function digitalBalance(stage, tick) {
  const g = new THREE.Group();
  const D = canvasTex(256, 96);
  let shown = -1;
  function draw(v) {
    D.x.fillStyle = '#16302a'; D.x.fillRect(0, 0, 256, 96);
    D.x.fillStyle = '#7dff9a'; D.x.font = '700 60px monospace'; D.x.textAlign = 'right';
    const s = fmt(v, 1);
    D.x.fillText(s.includes(',') ? s : s + ',0', 200, 70);
    D.x.font = '700 40px monospace'; D.x.fillText('g', 245, 70);
    D.t.needsUpdate = true;
  }
  draw(0);
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
  g.add(body, front, disp, pan);
  let anim = null;
  tick((dt) => {
    if (!anim) return;
    anim.t += dt;
    const v = anim.t < 0.7 && anim.m > 0 ? anim.m * (0.8 + Math.random() * 0.25) : anim.m;
    if (v !== shown) { shown = v; draw(v); }
    if (anim.t >= 0.7) anim = null;
  });
  g.userData.setMass = (m) => { anim = { t: 0, m }; };
  g.userData.panY = 0.3;
  return g;
}

// Везна с две блюда.
function panBalance(L) {
  const g = new THREE.Group();
  const brass = mat(0xd4a84b, { metalness: 0.55, roughness: 0.35 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.5), mat(0x6d4c41));
  base.position.y = 0.05;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.1, 12), brass);
  pillar.position.y = 0.6;
  const PIV = 1.18;
  const beam = new THREE.Group();
  beam.position.y = PIV;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2 * L, 0.06, 0.08), brass);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.42, 0.02), mat(0xd32f2f));
  needle.position.set(0, -0.24, 0.07);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), brass);
  beam.add(bar, needle, knob);
  const plate = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24, Math.PI * 1.25, Math.PI * 0.5), mat(0xffffff));
  plate.position.set(0, PIV, 0.055);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.08, 0.01), mat(0x333333));
  mark.position.set(0, PIV - 0.26, 0.06);
  g.add(base, pillar, beam, plate, mark);
  const hangers = [];
  for (const s of [-1, 1]) {
    const h = new THREE.Group();
    const pts = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      pts.push(new V3(0, 0, 0), new V3(Math.cos(a) * 0.36, -0.72, Math.sin(a) * 0.36));
    }
    const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x6d5a2a }));
    lines.raycast = () => {};
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.34, 0.04, 28), brass);
    pan.position.y = -0.74;
    h.add(lines, pan);
    h.userData.side = s;
    h.userData.topY = -0.72;
    g.add(h);
    hangers.push(h);
  }
  let rot = 0; let vel = 0;
  const place = () => {
    beam.rotation.z = rot;
    for (const h of hangers) h.position.set(h.userData.side * L * Math.cos(rot), PIV + h.userData.side * L * Math.sin(rot), 0);
  };
  place();
  const massOf = (h) => h.children.reduce((s, c) => s + (c.userData.m || 0), 0);
  g.userData = {
    hangers,
    update(dt) {
      const d = massOf(hangers[1]) - massOf(hangers[0]);
      const th = Math.abs(d) < 0.01 ? 0 : Math.sign(d) * Math.max(0.05, 0.22 * Math.tanh(Math.abs(d) / 30));
      const target = -th;
      const steps = Math.max(1, Math.ceil(dt / 0.02));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) { vel += (14 * (target - rot) - 2.2 * vel) * h; rot += vel * h; }
      place();
    },
    reset() { rot = 0; vel = 0; place(); },
  };
  return g;
}

function syringeModel() {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 14), mat(0x7e57c2));
  cap.position.y = 0.05;
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.045, 0.18, 18, 1, true), glassMat());
  tip.position.y = 0.19;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.45, 24, 1, true), glassMat());
  barrel.position.y = 0.28 + 0.725;
  barrel.renderOrder = 3;
  const flange = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.22), new THREE.MeshStandardMaterial({ color: 0xe3f2ff, transparent: true, opacity: 0.6 }));
  flange.position.y = 1.74;
  const tickM = new THREE.MeshBasicMaterial({ color: 0x546e7a });
  for (let i = 0; i < 7; i++) {
    const tk = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.06 : 0.11, 0.012, 0.01), tickM);
    tk.position.set(0, 0.4 + i * 0.2, 0.182);
    g.add(tk);
  }
  const plunger = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 20), mat(0x37474f));
  const rod = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.5, 0.07), mat(0xf5f5f5));
  rod.position.y = 0.78;
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 20), mat(0xf5f5f5));
  thumb.position.y = 1.55;
  plunger.add(disc, rod, thumb);
  plunger.position.y = 1.62;
  g.add(cap, tip, barrel, flange, plunger);
  g.userData.plunger = plunger;
  return g;
}

// =====================================================================
export function mount(container, opts) {
  injectStyle();
  // „Започни отначало“ строи всичко наново — така нищо не остава от предишния опит.
  let inst = null;
  const restart = () => { inst.dispose(); inst = build(container, opts, restart); };
  inst = build(container, opts, restart);
  return { dispose() { inst.dispose(); } };
}

function build(container, { skill, onComplete }, restart) {
  const g5 = !!(skill && String(skill.id).startsWith('5'));
  const STEPS = g5
    ? ['Опознай уредите', 'Измери обем на течност', 'Маса и обем на камъче', 'Твърдо, течно, газ']
    : ['Опознай телата', 'Колко място заемат?', 'Кое е по-тежко?', 'От какво са направени?'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, { background: 0xe8f1f8, camPos: [0, 5, 9], target: [0, 0.7, 0], maxDistance: 18, minDistance: 2 });
  const { scene, camera } = stage;
  const narrow = camera.aspect < 1.15;
  let alive = true;

  let rdt = 0.016;
  let lastNow = performance.now();
  stage.tick(() => { const n = performance.now(); rdt = Math.min(0.25, Math.max(0.001, (n - lastNow) / 1000)); lastNow = n; });
  const phase = (dur, fn) => new Promise((res) => {
    let k = 0;
    const stop = stage.tick((dt, t) => {
      k = Math.min(1, k + rdt / dur);
      if (fn) fn(k, t);
      if (k >= 1) { stop(); res(); }
    });
  });
  const roomTick = buildRoom(scene, narrow ? 6.6 : 11.4, 5.2);
  stage.tick((dt, t) => roomTick(rdt, t));

  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.5, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.06;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, dur);
  }

  let tip = null;
  function say(anchor, html, cls = '', lift = 0.4) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }

  // Предмет се мести по дъга (в световни координати).
  function hop(obj, to, dur = 0.6, height = 0.5) {
    if (obj.parent !== scene) scene.attach(obj);
    const from = obj.position.clone();
    return phase(dur, (k) => {
      const e = ease(k);
      obj.position.lerpVectors(from, to, e);
      obj.position.y += Math.sin(k * Math.PI) * height;
    });
  }

  // Тела в съдове: водата се покачва с потопената част от тялото.
  const vessels = [];
  const sinkers = []; // { g, V (mL), h }
  let U = 0.001; // обем в 3D единици за 1 mL
  stage.tick(() => {
    for (const vg of vessels) {
      const v = vg.userData.vessel;
      let extra = 0;
      for (let it = 0; it < 2; it++) {
        const surf = vg.position.y + v.sh.floor + heightFor(v.sh, (v.ml + extra) * U);
        extra = 0;
        for (const s of sinkers) {
          if (s.g.userData.inVessel !== vg) continue;
          const bottom = s.g.position.y - s.h / 2;
          extra += s.V * Math.min(1, Math.max(0, (surf - bottom) / s.h));
        }
      }
      setVol(vg, (v.ml + extra) * U);
    }
  });
  const surfaceY = (vg) => vg.position.y + vg.userData.vessel.sh.floor + vg.userData.vessel.h;
  async function sinkInto(g, vg, h) {
    const sh = vg.userData.vessel.sh;
    const top = vg.position.y + sh.floor + sh.depth + 0.35 + h / 2;
    await hop(g, new V3(vg.position.x, top, vg.position.z), 0.6, 0.4);
    g.userData.inVessel = vg;
    if (g.userData.label) g.userData.label.visible = false;
    const from = g.position.clone();
    const to = new V3(vg.position.x, vg.position.y + sh.floor + h / 2 + 0.005, vg.position.z);
    await phase(1.1, (k) => { g.position.lerpVectors(from, to, 1 - Math.pow(1 - k, 2)); });
  }
  async function liftOut(g, home) {
    const vg = g.userData.inVessel;
    if (vg) {
      const sh = vg.userData.vessel.sh;
      const from = g.position.clone();
      const to = new V3(vg.position.x, vg.position.y + sh.floor + sh.depth + 0.35, vg.position.z);
      await phase(0.45, (k) => { g.position.lerpVectors(from, to, ease(k)); });
      g.userData.inVessel = null;
    }
    if (g.userData.label) g.userData.label.visible = true;
    await hop(g, home, 0.55, 0.3);
  }

  let clickHandler = null;
  let menuHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  const scores = [];

  function choiceBox(el, q, items, rightIdx, whys, onRight, onWrong) {
    el.innerHTML = `<p class="measure-q">${q}</p><div class="choices">${items.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
    el.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i !== rightIdx) {
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(whys[i] || 'Не е това. Помисли пак.', 'bad');
        if (onWrong) onWrong();
        return;
      }
      b.classList.add('right');
      el.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      onRight();
    }));
  }
  function finishAll() {
    clearTip();
    const ratio = scores.reduce((a, x) => a + x, 0) / Math.max(1, scores.length);
    shell.score('');
    shell.finish(ratio, onComplete, restart);
  }

  // Първа стъпка: опознаване с меню в ъгъла.
  function exploreStep({ items, need, intro, focus, after, overview }) {
    shell.step(0);
    const menu = cornerMenu(stage, { title: g5 ? 'Уреди и тела' : 'Тела и уреди', items: items.map(({ id, label, icon }) => ({ id, label, icon })), onSelect: (id) => menuHandler && menuHandler(id) });
    const seen = new Set();
    shell.task(intro);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата маса</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const nx = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${items.length}`);
    upd();
    const visit = (id) => {
      const it = items.find((x) => x.id === id);
      if (!it) return;
      const [obj, lift, dist] = focus(id);
      stage.focusOn(obj, { dist, height: 0.9, lift: Math.min(lift * 0.5, 0.9), keepFollow: false });
      say(obj, it.note, 'wide', lift);
      seen.add(id); menu.mark(id); menu.setActive(id); upd();
      if (seen.size >= need && nx.disabled) { nx.disabled = false; shell.msg('Браво! Можеш да продължиш.', 'good'); }
    };
    clickHandler = (id) => { if (!id) return clearTip(); visit(id); };
    menuHandler = visit;
    nx.addEventListener('click', () => { menu.remove(); menuHandler = null; clearTip(); after(); });
    overview();
  }

  const api = { shell, stage, scene, camera, narrow, phase, fitView, say, clearTip, hop, sinkInto, liftOut, surfaceY, vessels, sinkers,
    setU: (u) => { U = u; }, choiceBox, finishAll, exploreStep, scores, rdtRef: () => rdt, alive: () => alive,
    setClick: (fn) => { clickHandler = fn; } };
  const extra = g5 ? build5(api) : build3(api);

  return {
    dispose() {
      alive = false;
      if (extra && extra.dispose) extra.dispose();
      stage.dispose();
    },
  };
}

// =====================================================================
// 3. клас — „Телата: вещество, обем и маса“
function build3(A) {
  const { shell, stage, scene, narrow, phase, fitView, say, clearTip, hop, sinkInto, liftOut, vessels, sinkers, choiceBox, scores } = A;
  A.setU(0.001); // каната: 1 mL покачва водата с 0,00275 единици
  const K3 = 0.001 / (Math.PI * 0.34 ** 2);

  // Маса (g) и обем (mL = cm³) — реалистични числа.
  const OBJ = [
    { id: 'apple', label: 'Ябълка', icon: '🍎', make: appleModel, h: 0.36, m: 150, sub: null,
      note: '<b>🍎 Ябълка</b><br>Това е тяло. Тя е съставена от вещества — най-много в нея има вода. Ябълката заема място и има маса (тежи).' },
    { id: 'stone', label: 'Камъче', icon: '🪨', make: stoneModel, h: 0.33, m: 160, V: 60, sub: null,
      note: '<b>🪨 Камъче</b><br>Тяло, направено от камък (скала). Твърдо е, заема място и тежи.' },
    { id: 'wood', label: 'Дървено кубче', icon: '🟫', make: () => cubeModel(0xd2a26a), h: 0.3, m: 14, V: 27, sub: 'wood',
      note: '<b>🟫 Дървено кубче</b><br>Тяло от дърво. Дървото е веществото, от което е направено.' },
    { id: 'metal', label: 'Метално кубче', icon: '⬜', make: () => cubeModel(0x9aa3ad, true), h: 0.3, m: 212, V: 27, sub: 'metal',
      note: '<b>⬜ Метално кубче</b><br>Тяло от желязо. Голямо е колкото дървеното кубче. Дали тежи колкото него?' },
    { id: 'marble', label: 'Стъклено топче', icon: '🔵', make: marbleModel, h: 0.3, m: 35, V: 14, sub: 'glass',
      note: '<b>🔵 Стъклено топче</b><br>Тяло от стъкло. Малко е, но и то заема място и има маса.' },
    { id: 'cup', label: 'Чаша с вода', icon: '🥛', make: cupModel, h: 0.55, m: 300, sub: 'glass',
      note: '<b>🥛 Чаша с вода</b><br>Чашата е тяло от стъкло. Водата в нея е вещество — и тя заема място и има маса.' },
    { id: 'balloon', label: 'Балон с въздух', icon: '🎈', make: () => balloonLying(false), h: 0.54, m: 4.1, sub: null,
      note: '<b>🎈 Балон с въздух</b><br>Балонът е от гума. Вътре има въздух — и въздухът е вещество! Той заема мястото в балона.' },
    { id: 'spoon', label: 'Пластмасова лъжица', icon: '🥄', make: () => spoonModel(0x42a5f5), h: 0.06, m: 5, sub: 'plastic',
      note: '<b>🥄 Пластмасова лъжица</b><br>Тяло от пластмаса. Пластмасата е лека и може да бъде във всякакъв цвят.' },
    { id: 'flat', label: 'Спаднал балон', icon: '🎈', make: () => balloonLying(true), h: 0.09, m: 4.0, sub: null, later: true },
    { id: 'nail', label: 'Пирон', icon: '📌', make: nailModel, h: 0.12, m: 6, sub: 'metal', later: true },
    { id: 'wspoon', label: 'Дървена лъжица', icon: '🥄', make: () => spoonModel(0xb7834f), h: 0.06, m: 10, sub: 'wood', later: true },
    { id: 'brick', label: 'Блокче за игра', icon: '🧱', make: brickModel, h: 0.24, m: 3, sub: 'plastic', later: true },
  ];
  const BY = Object.fromEntries(OBJ.map((o) => [o.id, o]));
  const objs = new Map();
  for (const o of OBJ) {
    const g = new THREE.Group();
    const model = o.make();
    if (o.id === 'cup') model.position.y = -o.h / 2; // съдът започва от дъното
    g.add(model);
    const lbl = labelSprite(o.label, { size: 0.15 });
    lbl.position.y = o.h / 2 + 0.17;
    g.add(lbl);
    stage.steadyLabel(lbl, 8);
    addHitBox(g, 0.55);
    g.userData.label = lbl;
    g.userData.pickId = o.id;
    g.userData.dragId = o.id;
    g.userData.locked = true;
    g.userData.m = o.m;
    g.userData.o = o;
    g.visible = !o.later;
    scene.add(g);
    objs.set(o.id, g);
    if (o.V) sinkers.push({ g, V: o.V, h: o.h });
  }
  // Разположение по масата.
  function slots(n) {
    const out = [];
    if (narrow) {
      const cols = Math.ceil(n / 2);
      for (let i = 0; i < n; i++) {
        const r = i < cols ? 0 : 1; const c = r ? i - cols : i;
        const cn = r ? n - cols : cols;
        out.push(new V3(-2.25 + (cn > 1 ? (c * 4.5) / (cn - 1) : 2.25) + (r ? 0.3 : 0), 0, r ? 1.95 : 1.15));
      }
    } else {
      for (let i = 0; i < n; i++) out.push(new V3(-4.4 + (i * 8.8) / Math.max(1, n - 1), 0, i % 2 ? 1.95 : 1.2));
    }
    return out;
  }
  const home = {};
  function layout(ids) {
    const s = slots(ids.length);
    ids.forEach((id, i) => {
      const g = objs.get(id);
      home[id] = new V3(s[i].x, BY[id].h / 2, s[i].z);
      g.position.copy(home[id]);
      g.visible = true;
    });
  }
  const MAIN = ['marble', 'stone', 'metal', 'wood', 'apple', 'cup', 'balloon', 'spoon'];
  layout(MAIN);

  // Мерителна кана с вода и везна с блюда.
  const JUG = narrow ? [-1.45, 0, -0.75] : [-2.4, 0, -0.8];
  const jug = makeVessel('jug3');
  jug.position.set(...JUG);
  jug.userData.vessel.ml = 200;
  {
    const sh = SHAPES.jug3;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 8, 20, Math.PI), glassMat(0.4));
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-sh.rin(0) - 0.03, sh.floor + sh.depth * 0.55, 0);
    handle.raycast = () => {};
    jug.add(handle);
    const strip = scaleStrip({ maxML: 470, k: K3, minor: 50, major: 100, labelEvery: 100, w: 0.32 });
    strip.position.set(0.1, sh.floor + (470 * K3) / 2, sh.rin(0) + sh.t + 0.006);
    jug.add(strip);
    const band = new THREE.Mesh(new THREE.TorusGeometry(sh.rin(0) + 0.035, 0.016, 6, 36), mat(0xe53935));
    band.rotation.x = Math.PI / 2;
    band.position.y = sh.floor + 200 * K3;
    jug.add(band);
    const lb = labelSprite('Мерителна кана', { size: 0.17, color: '#fff', bg: 'rgba(38,50,56,0.85)', border: 'rgba(38,50,56,0.85)' });
    lb.position.set(0, -0.05, 0.62);
    jug.add(lb);
    stage.steadyLabel(lb, 8);
    jug.userData.pickId = 'jug';
    addHitBox(jug, 0.9);
  }
  scene.add(jug);
  vessels.push(jug);
  const BAL_L = narrow ? 0.75 : 0.95;
  const bal = panBalance(BAL_L);
  bal.position.set(...(narrow ? [0.95, 0, -0.85] : [1.7, 0, -0.85]));
  {
    const lb = labelSprite('Везна', { size: 0.17, color: '#fff', bg: 'rgba(38,50,56,0.85)', border: 'rgba(38,50,56,0.85)' });
    lb.position.set(0, -0.05, 0.55);
    bal.add(lb);
    stage.steadyLabel(lb, 8);
  }
  const balApi = bal.userData;
  bal.userData = { pickId: 'balance' };
  addHitBox(bal, 0.9);
  scene.add(bal);
  stage.tick(() => balApi.update(A.rdtRef()));

  // Живот: балонът леко се поклаща, водата в каната трепти.
  stage.tick((dt, t) => {
    const b = objs.get('balloon');
    if (b.parent === scene) b.rotation.x = Math.sin(t * 1.3) * 0.06;
    b.children[0].rotation.z = Math.sin(t * 0.9) * 0.05;
    jug.userData.vessel.liq.scale.y = 1 + Math.sin(t * 2.2) * 0.004;
  });

  const overview = (dur) => (narrow ? fitView([0, 0.5, 0.5], 3.0, 1.9, 0.62, dur) : fitView([0, 0.6, 0.5], 5.4, 1.9, 0.52, dur));

  // ---------- 1 ----------
  function step1() {
    const items = [
      ...MAIN.map((id) => ({ id, label: BY[id].label, icon: BY[id].icon, note: BY[id].note })),
      { id: 'jug', label: 'Мерителна кана', icon: '🫙', note: '<b>🫙 Мерителна кана с вода</b><br>Има черти и числа. Червената лента показва докъде стига водата сега.' },
      { id: 'balance', label: 'Везна', icon: '⚖️', note: '<b>⚖️ Везна с две блюда</b><br>По-тежкото тяло натиска блюдото си надолу. Така сравняваме масите.' },
    ];
    A.exploreStep({
      items, need: 6, overview,
      intro: `<p>Всичко около нас е съставено от <b>вещества</b>: дърво, стъкло, метал, вода, въздух…</p>
        <p><b>Разгледай поне 6 неща</b> на масата. Кликни върху тях или ги избери от менюто в ъгъла.</p>`,
      focus: (id) => (id === 'jug' ? [jug, 1.7, 3.2] : id === 'balance' ? [bal, 1.75, 3.6] : [objs.get(id), BY[id].h / 2 + 0.35, 2.4]),
      after: step2,
    });
  }

  // ---------- 2: колко място заемат ----------
  function step2() {
    shell.step(1);
    let mistakes = 0;
    const TEST = ['marble', 'metal', 'stone'];
    const COL = { marble: 0x29b6f6, metal: 0x546e7a, stone: 0x8d6e63 };
    const NAME = { marble: 'синята', metal: 'сивата', stone: 'кафявата' };
    const done = new Set();
    let inJug = null;
    let busy = false;
    if (narrow) fitView([-0.9, 0.6, 0.4], 1.9, 1.35, 0.45); else fitView([-2.3, 0.65, 0.4], 2.9, 1.35, 0.42);
    const draw = () => {
      shell.task(`<p>Всяко тяло <b>заема място</b>. Колко място заема едно тяло, наричаме негов <b>обем</b>.</p>
        <p>Кликни <b>стъкленото топче</b>, <b>металното кубче</b> и <b>камъчето</b>, за да ги пуснеш едно по едно в каната. Гледай водата!</p>
        <ul class="measure-list">${TEST.map((id) => `<li class="${done.has(id) ? 'ok' : ''}">${done.has(id) ? '✔' : '○'} ${esc(BY[id].label)}</li>`).join('')}</ul>`);
      shell.score(`Опитани: ${done.size} от 3`);
    };
    draw();
    shell.setControls('');
    say(jug, 'Червената лента показва докъде е водата сега.', '', 1.75);
    A.setClick(async (id) => {
      if (!id) return;
      if (busy) return;
      if (!TEST.includes(id)) {
        if (BY[id]) say(objs.get(id), 'Сега пускаме във водата само топчето, кубчето от метал и камъчето.', '', BY[id].h / 2 + 0.3);
        return;
      }
      if (inJug === id) return;
      busy = true;
      clearTip();
      if (inJug) { const prev = inJug; inJug = null; await liftOut(objs.get(prev), home[prev]); }
      const g = objs.get(id);
      inJug = id;
      await sinkInto(g, jug, BY[id].h);
      await phase(0.8);
      if (!A.alive()) return;
      // черта на новото ниво
      if (!done.has(id)) {
        const sh = SHAPES.jug3;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(sh.rin(0) + 0.03, 0.01, 5, 36), new THREE.MeshBasicMaterial({ color: COL[id] }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = sh.floor + jug.userData.vessel.h;
        jug.add(ring);
      }
      done.add(id);
      const more = { marble: 'съвсем малко', metal: 'малко', stone: 'най-много' }[id];
      say(jug, `Водата се покачи ${more} — до <b>${NAME[id]}</b> черта. ${esc(BY[id].label)} избута водата нагоре, защото заема място.`, '', 1.75);
      draw();
      busy = false;
      if (done.size === 3) question1();
    });
    function question1() {
      A.setClick(null);
      const c = shell.setControls('<div class="q"></div>');
      const q = c.querySelector('.q');
      choiceBox(q, 'Кое тяло заема <b>най-много място</b> (има най-голям обем)?',
        ['Стъкленото топче', 'Металното кубче', 'Камъчето'], 2,
        { 0: 'Виж чертите на каната: с топчето водата се покачи най-малко.', 1: 'Сравни сивата и кафявата черта. Коя е по-високо?' },
        () => {
          shell.msg('Вярно! С камъчето водата се покачи най-много — то заема най-много място.', 'good');
          setTimeout(question2, 900);
        }, () => { mistakes++; shell.score(`Грешки: ${mistakes}`); });
    }
    function question2() {
      if (!A.alive()) return;
      const c = shell.setControls('<div class="q"></div>');
      choiceBox(c.querySelector('.q'), 'Защо водата в каната се покачва, когато пуснем тяло в нея?',
        ['Тялото заема място и избутва водата нагоре', 'Тялото е мокро', 'Във водата се появява още вода'], 0,
        { 1: 'Ако тялото само се намокри, водата щеше ли да се вдигне? Помисли какво прави тялото в каната.', 2: 'Вода не сме добавяли. Какво друго влезе в каната?' },
        async () => {
          shell.msg('Точно така! Всяко тяло заема място — има обем.', 'good');
          scores.push(stepScore(mistakes, 3));
          if (inJug) { const prev = inJug; inJug = null; await liftOut(objs.get(prev), home[prev]); }
          const n = shell.setControls('<div class="row"><button class="btn primary nx">Напред →</button></div>');
          n.querySelector('.nx').addEventListener('click', step3);
        }, () => { mistakes++; shell.score(`Грешки: ${mistakes}`); });
    }
  }

  // ---------- 3: кое е по-тежко ----------
  function step3() {
    shell.step(2);
    clearTip();
    let mistakes = 0;
    objs.get('flat').visible = true;
    layout([...MAIN, 'flat']);
    const PAIRS = [
      { a: 'metal', b: 'wood', task: 'Сложи на везната <b>металното</b> и <b>дървеното кубче</b>.',
        q: 'Двете кубчета са еднакво големи. Кое е по-тежко?', choices: ['Металното кубче', 'Дървеното кубче', 'Еднакво тежки са'], right: 0,
        whys: { 1: 'Виж везната: блюдото с по-тежкото тяло слиза надолу.', 2: 'Ако бяха еднакво тежки, везната щеше да стои права. Права ли е?' },
        after: 'Заемат еднакво място, но масата им е различна! Желязото е по-тежко от дървото.' },
      { a: 'balloon', b: 'stone', task: 'Сега сложи на везната <b>балона</b> и <b>камъчето</b>.',
        q: 'Какво показа везната?', choices: ['Балонът е по-голям, но е по-лек от камъчето', 'Балонът е по-голям и по-тежък', 'Камъчето е по-голямо и по-тежко'], right: 0,
        whys: { 1: 'Виж накъде се наклони везната. Кое блюдо слезе надолу?', 2: 'Кое тяло заема повече място — балонът или камъчето?' },
        after: 'По-голямото тяло не винаги е по-тежко!' },
      { a: 'balloon', b: 'flat', task: 'Последно: сложи <b>балона с въздух</b> и <b>спадналия балон</b>. Те са еднакви, но в спадналия няма въздух.',
        q: 'Има ли въздухът маса?', choices: ['Да — балонът с въздух е малко по-тежък', 'Не — въздухът не тежи нищо', 'Спадналият балон е по-тежък'], right: 0,
        whys: { 1: 'Погледни внимателно стрелката на везната. Стои ли съвсем права?', 2: 'Кое блюдо е слязло надолу — с балона с въздух или със спадналия?' },
        after: 'Въздухът също е вещество и има маса. Затова балонът с въздух тежи малко повече.' },
    ];
    let p = 0;
    let busy = false;
    if (narrow) overview(); else fitView([0, 0.6, 0.45], 5.0, 1.65, 0.45);
    const onPans = () => balApi.hangers.map((h) => h.children.find((c) => c.userData.pickId));
    const load = () => {
      const P = PAIRS[p];
      shell.task(`<p><b>Масата</b> показва колко тежи едно тяло. Везната сравнява масите.</p>
        <p>${p + 1} от 3. ${P.task} Кликни ги.</p>`);
      shell.score(`Грешки: ${mistakes}`);
      shell.setControls('');
      say(objs.get(P.a), 'Кликни ме!', 'tag', BY[P.a].h / 2 + 0.3);
    };
    load();
    A.setClick(async (id) => {
      if (!id || busy) return;
      const P = PAIRS[p];
      const g = objs.get(id);
      if (id !== P.a && id !== P.b) {
        if (BY[id]) say(g, `Сега сравняваме ${esc(BY[P.a].label.toLowerCase())} и ${esc(BY[P.b].label.toLowerCase())}.`, '', BY[id].h / 2 + 0.3);
        return;
      }
      if (g.parent !== scene) return;
      busy = true;
      clearTip();
      const free = balApi.hangers.find((h) => !h.children.some((c) => c.userData.pickId));
      const panW = free.getWorldPosition(new V3());
      await hop(g, new V3(panW.x, panW.y + free.userData.topY + BY[id].h / 2 + 0.02, panW.z), 0.7, 0.6);
      free.attach(g);
      g.position.set(0, free.userData.topY + BY[id].h / 2 + 0.02, 0);
      g.rotation.set(0, 0, 0);
      busy = false;
      const both = onPans();
      if (both[0] && both[1]) {
        await phase(1.6);
        if (!A.alive()) return;
        const c = shell.setControls('<div class="q"></div>');
        choiceBox(c.querySelector('.q'), P.q, P.choices, P.right, P.whys, () => {
          shell.msg(P.after, 'good');
          say(bal, P.after, 'good wide', 1.9);
          const last = p === PAIRS.length - 1;
          c.insertAdjacentHTML('beforeend', `<div class="row"><button class="btn primary nx">${last ? 'Напред →' : 'Следваща двойка →'}</button></div>`);
          c.querySelector('.nx').addEventListener('click', async () => {
            c.querySelector('.nx').disabled = true;
            clearTip();
            shell.msg('');
            for (const o of onPans()) if (o) await hop(o, home[o.userData.pickId], 0.5, 0.4);
            if (last) { scores.push(stepScore(mistakes, 3)); step4(); return; }
            p++;
            load();
          });
        }, () => { mistakes++; shell.score(`Грешки: ${mistakes}`); });
      } else {
        const other = id === P.a ? P.b : P.a;
        say(objs.get(other), 'А сега мен!', 'tag', BY[other].h / 2 + 0.3);
      }
    });
  }

  // ---------- 4: подреди по вещество ----------
  function step4() {
    shell.step(3);
    clearTip();
    A.setClick(null);
    let mistakes = 0;
    const wrongs = {};
    jug.visible = false; bal.visible = false;
    for (const id of ['apple', 'stone', 'balloon', 'flat']) objs.get(id).visible = false;
    const SORT = ['brick', 'marble', 'wood', 'nail', 'spoon', 'cup', 'metal', 'wspoon'];
    layout(SORT);
    const SUBS = [
      { id: 'glass', label: 'Стъкло', color: 0x29b6f6 },
      { id: 'wood', label: 'Дърво', color: 0xa1662f },
      { id: 'metal', label: 'Метал', color: 0x78909c },
      { id: 'plastic', label: 'Пластмаса', color: 0xec407a },
    ];
    const R = narrow ? 0.62 : 1.0;
    const zones = SUBS.map((s, i) => {
      const z = zoneRing(s.color, R);
      z.position.set(narrow ? -2.1 + i * 1.4 : -3.6 + i * 2.4, 0, narrow ? -0.6 : -0.7);
      const lb = labelSprite(s.label, { size: 0.2, color: '#fff', bg: '#' + s.color.toString(16).padStart(6, '0'), border: 'rgba(0,0,0,0)' });
      lb.position.set(0, 0.25, -R - 0.05);
      z.add(lb);
      stage.steadyLabel(lb, 8);
      z.userData.sub = s.id;
      z.userData.count = 0;
      scene.add(z);
      return z;
    });
    const HINT = {
      brick: 'Блокчето е леко, гладко и цветно. От какво се правят играчките като него?',
      marble: 'Топчето е прозрачно и твърдо, може да се счупи. От какво е?',
      wood: 'Виж шарките по кубчето — те са от годишните пръстени на дървото.',
      nail: 'Пиронът е лъскав, твърд и студен на допир. От какво е?',
      spoon: 'Тази лъжица е синя, лека и гладка. От какво е?',
      cup: 'Чашата е прозрачна и може да се счупи. От какво е?',
      metal: 'Това кубче е лъскаво и много тежко. От какво е?',
      wspoon: 'Тази лъжица има цвета и шарките на дървото.',
    };
    let sorted = 0;
    if (narrow) fitView([0, 0.3, 0.6], 2.9, 1.8, 0.75); else fitView([0, 0.3, 0.6], 5.3, 1.9, 0.68);
    shell.task(`<p>Различните тела може да са направени от едно и също вещество.</p>
      <p><b>Провлачи всяко тяло в кръга на веществото, от което е направено.</b></p>`);
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${sorted} от ${SORT.length} · грешки: ${mistakes}`);
    upd();
    for (const id of SORT) objs.get(id).userData.locked = false;
    const stopDrag = stage.enableDrag({
      planeY: 0, lift: 0.3,
      onStart: () => clearTip(),
      onDrop: (g, pos, start) => {
        g.position.y = start.y;
        const o = g.userData.o;
        const z = zones.find((zz) => Math.hypot(pos.x - zz.position.x, pos.z - zz.position.z) < R + 0.15);
        if (!z) { hop(g, start, 0.35, 0.2); return; }
        if (z.userData.sub !== o.sub) {
          mistakes++;
          wrongs[o.id] = (wrongs[o.id] || 0) + 1;
          hop(g, start, 0.45, 0.3);
          shell.msg(`Не е от ${SUBS.find((s) => s.id === z.userData.sub).label.toLowerCase()}. ${HINT[o.id]}`, 'bad');
          if (wrongs[o.id] >= 2) shell.msg(`Подсказка: ${o.label.toLowerCase()} е от ${SUBS.find((s) => s.id === o.sub).label.toLowerCase()}.`, 'bad');
          upd();
          return;
        }
        const k = z.userData.count++;
        const spot = new V3(z.position.x + (k % 2 ? 0.28 : -0.28) * (R / 1.0), o.h / 2, z.position.z + (k < 2 ? -0.12 : 0.32) * (R / 1.0));
        hop(g, spot, 0.3, 0.15);
        g.userData.locked = true;
        sorted++;
        shell.msg(`Вярно! ${o.label} — ${SUBS.find((s) => s.id === o.sub).label.toLowerCase()}.`, 'good');
        upd();
        if (sorted === SORT.length) {
          stopDrag();
          scores.push(stepScore(mistakes, 3));
          shell.msg('Браво! Всяко тяло е съставено от вещество, заема място (има обем) и има маса.', 'good');
          const c = shell.setControls('<div class="row"><button class="btn primary nx">Виж резултата</button></div>');
          c.querySelector('.nx').addEventListener('click', A.finishAll);
        }
      },
    });
    cleanup = () => stopDrag();
  }
  let cleanup = null;
  step1();
  return { dispose() { if (cleanup) cleanup(); } };
}

// =====================================================================
// 5. клас — „Маса, обем и форма; измерване“
function build5(A) {
  const { shell, stage, scene, narrow, phase, fitView, say, clearTip, hop, sinkInto, liftOut, vessels, sinkers, choiceBox, scores } = A;
  const KC = 0.018; // цилиндърът: 1 mL покачва водата с 0,018 единици
  const U5 = Math.PI * 0.36 ** 2 * KC;
  A.setU(U5);
  const STONE = { m: 81, V: 30, h: 0.33 };
  const TARGETS = [40, 50, 60];
  const target = TARGETS[Math.floor(Math.random() * TARGETS.length)];

  const P = narrow
    ? { beaker: [-2.15, -0.75], cyl: [-1.0, -0.7], bal: [0.35, -0.55], stone: [0.35, 0.75], bottle: [1.35, -0.95], syr: [2.2, -0.75], jar: [2.05, 0.75],
      glass: [-2.2, 1.25], bowl: [-1.05, 1.45], flask: [0.9, 1.6] }
    : { beaker: [-4.1, -0.6], cyl: [-2.7, -0.7], bal: [-1.0, -0.5], stone: [-1.0, 1.0], bottle: [0.5, -0.8], syr: [1.7, -0.6], jar: [3.6, -0.7],
      glass: [0.4, 1.3], bowl: [1.9, 1.4], flask: [3.5, 1.3] };
  const tag = (g, text, y = -0.05, z = 0.75) => {
    const lb = labelSprite(text, { size: 0.17, color: '#fff', bg: 'rgba(38,50,56,0.85)', border: 'rgba(38,50,56,0.85)' });
    lb.position.set(0, y, z);
    g.add(lb);
    stage.steadyLabel(lb, 8);
    return lb;
  };
  const place = (g, key) => { g.position.set(P[key][0], 0, P[key][1]); };

  // Мерителен цилиндър.
  const cyl = makeVessel('cyl');
  place(cyl, 'cyl');
  {
    const sh = SHAPES.cyl;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.08, 6), glassMat(0.5));
    foot.position.y = 0.04;
    cyl.add(foot);
    const strip = scaleStrip({ maxML: 105, k: KC, minor: 1, major: 10, labelEvery: 10, w: 0.3 });
    strip.position.set(0.06, sh.floor + (105 * KC) / 2, sh.rin(0) + sh.t + 0.006);
    cyl.add(strip);
    tag(cyl, 'Мерителен цилиндър');
    cyl.userData.pickId = 'cyl';
    addHitBox(cyl, 0.9);
  }
  scene.add(cyl);
  // Чаша с вода (за наливане).
  const beaker = makeVessel('beaker');
  place(beaker, 'beaker');
  beaker.userData.vessel.ml = 180;
  {
    const spout = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 12, 1, true), glassMat());
    spout.rotation.z = -Math.PI / 2 - 0.5;
    spout.position.set(0.66, 1.22, 0);
    beaker.add(spout);
    tag(beaker, 'Чаша с вода', -0.05, 0.9);
    beaker.userData.pickId = 'beaker';
    addHitBox(beaker, 0.9);
  }
  scene.add(beaker);
  // Везна.
  const bal = digitalBalance(stage, (fn) => stage.tick(() => fn(A.rdtRef())));
  place(bal, 'bal');
  tag(bal, 'Везна');
  bal.userData.pickId = 'balance';
  addHitBox(bal, 0.9);
  scene.add(bal);
  // Камъче.
  const stone = new THREE.Group();
  stone.add(stoneModel());
  {
    const lb = labelSprite('Камъче', { size: 0.15 });
    lb.position.y = 0.36;
    stone.add(lb);
    stage.steadyLabel(lb, 8);
  }
  addHitBox(stone, 0.55);
  stone.userData.pickId = 'stone';
  const stoneHome = new V3(P.stone[0], STONE.h / 2, P.stone[1]);
  stone.position.copy(stoneHome);
  scene.add(stone);
  sinkers.push({ g: stone, V: STONE.V, h: STONE.h });
  // Бутилка 1 L.
  const bottle = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 24), new THREE.MeshStandardMaterial({ color: 0x9be7b8, transparent: true, opacity: 0.55, roughness: 0.1 }));
    body.position.y = 0.5;
    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 0.3, 24), body.material);
    shoulder.position.y = 1.15;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 16), mat(0x2e7d32));
    cap.position.y = 1.35;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 20), liquidMat(0x6fc3ef, 0.5));
    water.position.y = 0.47;
    const stk = labelSprite('1 L', { size: 0.2, color: '#1b5e20', bg: '#ffffff', border: '#2e7d32' });
    stk.position.set(0, 0.55, 0.32);
    bottle.add(body, shoulder, cap, water, stk);
    tag(bottle, 'Бутилка');
    place(bottle, 'bottle');
    bottle.userData.pickId = 'bottle';
    addHitBox(bottle, 0.9);
  }
  scene.add(bottle);
  // Спринцовка с оцветен газ.
  const syr = syringeModel();
  place(syr, 'syr');
  tag(syr, 'Спринцовка', -0.05, 0.55);
  syr.userData.pickId = 'syr';
  addHitBox(syr, 0.8);
  scene.add(syr);
  const syrHome = syr.position.clone();
  // Буркан с капак.
  const jar = makeVessel('jar');
  place(jar, 'jar');
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.07, 28), mat(0xd84b3a));
  lid.position.y = SHAPES.jar.floor + SHAPES.jar.depth + 0.05;
  lid.visible = false;
  jar.add(lid);
  tag(jar, 'Буркан', -0.05, 0.85);
  jar.userData.pickId = 'jar';
  addHitBox(jar, 0.9);
  scene.add(jar);
  // Съдове за стъпка 4.
  const shapes4 = { glass: 'Висока чаша', bowl: 'Купа', flask: 'Колба' };
  const cont = {};
  for (const [k, name] of Object.entries(shapes4)) {
    const v = makeVessel(k);
    place(v, k);
    tag(v, name, -0.05, k === 'bowl' ? 1.05 : 0.85);
    v.userData.pickId = k;
    addHitBox(v, 0.9);
    v.visible = false;
    scene.add(v);
    cont[k] = v;
  }
  for (const v of [cyl, beaker, cont.glass, cont.bowl, cont.flask]) vessels.push(v);

  // Капкомер над цилиндъра.
  const pip = new THREE.Group();
  {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.012, 0.8, 10), glassMat(0.5));
    tube.position.y = 0.4;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), mat(0xe53935));
    bulb.scale.y = 1.5;
    bulb.position.y = 0.9;
    pip.add(tube, bulb);
    pip.visible = false;
    scene.add(pip);
  }
  const pipHome = () => new V3(cyl.position.x + 0.12, SHAPES.cyl.floor + SHAPES.cyl.depth + 0.35, cyl.position.z);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), liquidMat(0x5fb4e6, 0.9));
  drop.visible = false;
  scene.add(drop);
  // Струя при наливане.
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8, 1, true), liquidMat(0x5fb4e6, 0.7));
  stream.geometry.translate(0, -0.5, 0);
  stream.visible = false;
  scene.add(stream);

  // Газ: облачета, които следват своя „дом“ — спринцовката, буркана или стаята.
  const puffTex = puffTexture();
  const puffs = [];
  for (let i = 0; i < 34; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0x9575cd, transparent: true, opacity: 0.55, depthWrite: false }));
    s.scale.setScalar(0.2);
    s.renderOrder = 5;
    s.userData = { owner: 'syr', u: Math.random(), a: Math.random() * Math.PI * 2, r: Math.random(), ph: Math.random() * 6, p: new V3(), op: 0.55 };
    scene.add(s);
    puffs.push(s);
  }
  const tmpV = new V3();
  stage.tick((dt, t) => {
    const pl = syr.userData.plunger.position.y;
    for (const s of puffs) {
      const u = s.userData;
      const w = Math.sin(t * 0.8 + u.ph) * 0.04;
      if (u.owner === 'syr') {
        tmpV.set(Math.cos(u.a + t * 0.3) * u.r * 0.11, 0.34 + u.u * Math.max(0.05, pl - 0.42) + w, Math.sin(u.a + t * 0.3) * u.r * 0.11);
        syr.localToWorld(tmpV);
        s.scale.setScalar(0.12 + 0.08 * Math.min(1, (pl - 0.3) / 1.3));
      } else if (u.owner === 'jar') {
        const sh = SHAPES.jar;
        tmpV.set(Math.cos(u.a + t * 0.15) * Math.sqrt(u.r) * 0.45, sh.floor + 0.12 + u.u * (sh.depth - 0.2) + w, Math.sin(u.a + t * 0.15) * Math.sqrt(u.r) * 0.45);
        jar.localToWorld(tmpV);
        s.scale.setScalar(0.3);
      } else {
        // излиза от отворения съд и се разнася в стаята
        u.p.y += A.rdtRef() * 0.5;
        u.p.x += Math.cos(u.a) * A.rdtRef() * 0.25;
        u.p.z += Math.sin(u.a) * A.rdtRef() * 0.25;
        tmpV.copy(u.p);
        u.op = Math.max(0, u.op - A.rdtRef() * 0.22);
        s.scale.setScalar(0.3 + (0.55 - u.op) * 0.8);
      }
      s.material.opacity = u.owner === 'air' ? u.op : 0.55;
      s.visible = u.owner !== 'air' || u.op > 0.01;
      s.position.lerp(tmpV, Math.min(1, A.rdtRef() * (u.owner === 'air' ? 20 : 3)));
    }
  });
  for (const s of puffs) s.position.set(syr.position.x, 0.9, syr.position.z);
  // Живот: буталото на спринцовката бавно сгъстява и пуска газа; водата трепти.
  let syrIdle = true;
  stage.tick((dt, t) => {
    if (syrIdle) syr.userData.plunger.position.y = 1.42 + Math.sin(t * 0.8) * 0.2;
    for (const v of vessels) v.userData.vessel.liq.scale.y = 1 + Math.sin(t * 2.2 + v.position.x) * 0.003;
  });

  async function pour(src, dst, ml, fast = false) {
    const sv = src.userData.vessel; const dv = dst.userData.vessel;
    const homeP = src.position.clone();
    const theta = 1.3;
    const lip = sv.lip.position.clone();
    const rot = new V3(lip.x * Math.cos(theta) + lip.y * Math.sin(theta), -lip.x * Math.sin(theta) + lip.y * Math.cos(theta), 0);
    const mouthY = dst.position.y + dv.sh.floor + dv.sh.depth;
    const at = new V3(dst.position.x - 0.05, mouthY + 0.3, dst.position.z).sub(rot);
    await phase(fast ? 0.45 : 0.7, (k) => {
      const e = ease(k);
      src.position.lerpVectors(homeP, at, e);
      src.position.y += Math.sin(e * Math.PI) * 0.3;
      src.rotation.z = -theta * e;
    });
    stream.visible = true;
    const s0 = sv.ml; const d0 = dv.ml;
    const lipW = new V3(); const up = new V3(0, 1, 0);
    await phase(fast ? 0.5 : 1.3, (k) => {
      sv.ml = Math.max(src === beaker ? 60 : 0, s0 - ml * k);
      dv.ml = d0 + ml * k;
      src.updateMatrixWorld();
      sv.lip.getWorldPosition(lipW);
      const surf = new V3(dst.position.x, A.surfaceY(dst), dst.position.z);
      const d = lipW.clone().sub(surf);
      stream.position.copy(lipW);
      stream.scale.set(1, Math.max(0.01, d.length()), 1);
      stream.quaternion.setFromUnitVectors(up, d.normalize());
    });
    stream.visible = false;
    dv.ml = d0 + ml;
    if (src !== beaker) sv.ml = Math.max(0, s0 - ml);
    await phase(fast ? 0.4 : 0.6, (k) => {
      const e = ease(k);
      src.position.lerpVectors(at, homeP, e);
      src.rotation.z = -theta * (1 - e);
    });
    src.position.copy(homeP);
    src.rotation.z = 0;
  }

  // Лупа до цилиндъра.
  const magAnchor = new V3();
  let mag = null; let magShown = -1;
  function showMag(on) {
    if (on && !mag) { mag = stage.bubble(magAnchor, '', { lift: 0, cls: 'measure-mag' }); magShown = -1; }
    if (!on && mag) { mag.remove(); mag = null; }
  }
  stage.tick(() => {
    if (!mag) return;
    const v = cyl.userData.vessel;
    const level = v.vol / U5;
    cyl.localToWorld(magAnchor.set(0.36 + 0.75, SHAPES.cyl.floor + v.h - 0.45, 0));
    const lv = Math.round(level * 4) / 4;
    if (lv !== magShown) { magShown = lv; mag.set('<b style="font-size:.75rem">🔍 Лупа</b>' + magSVG(level)); }
  });

  const overview = (dur) => (narrow ? fitView([0, 0.7, 0.3], 2.9, 2.0, 0.55, dur) : fitView([-0.1, 0.8, 0.3], 5.4, 2.0, 0.48, dur));
  const sciNotes = {
    cyl: '<b>🧪 Мерителен цилиндър</b><br>С него измерваме обема на течности. Скалата е в милилитри (<b>mL</b>). Отчитаме по <b>долния край</b> на извитата повърхност на водата, с поглед на нейната височина.',
    beaker: '<b>🥛 Чаша с вода</b><br>Водата е <b>течност</b>: тече и приема формата на съда, в който е. Обемът ѝ обаче не се променя.',
    balance: '<b>⚖️ Електронна везна</b><br>Измерва <b>масата</b> в грамове (<b>g</b>). 1 kg = 1000 g.',
    stone: '<b>🪨 Камъче</b><br><b>Твърдо тяло</b>: има собствена форма и собствен обем. Как да измерим обема на тяло с неправилна форма? Ще видиш!',
    bottle: '<b>🍾 Бутилка от 1 литър</b><br>Литърът (<b>L</b>) е по-голяма единица за обем: <b>1 L = 1000 mL</b>.',
    syr: '<b>💉 Спринцовка с газ</b><br>Газът е оцветен, за да го виждаме. Газът може да се <b>сгъстява</b>: буталото влиза навътре и газът заема по-малко място.',
    jar: '<b>🫙 Буркан с капак</b><br>В него ще пуснем газ и ще видим какво място ще заеме.',
  };

  // ---------- 1 ----------
  function step1() {
    const items = [
      { id: 'cyl', label: 'Мерителен цилиндър', icon: '🧪' }, { id: 'beaker', label: 'Чаша с вода', icon: '🥛' },
      { id: 'balance', label: 'Везна', icon: '⚖️' }, { id: 'stone', label: 'Камъче', icon: '🪨' },
      { id: 'bottle', label: 'Бутилка 1 L', icon: '🍾' }, { id: 'syr', label: 'Спринцовка с газ', icon: '💉' },
      { id: 'jar', label: 'Буркан', icon: '🫙' },
    ].map((it) => ({ ...it, note: sciNotes[it.id] }));
    const objOf = { cyl: [cyl, 2.35, 3.4], beaker: [beaker, 1.5, 3.2], balance: [bal, 0.65, 2.8], stone: [stone, 0.45, 2.2], bottle: [bottle, 1.6, 3.0], syr: [syr, 1.95, 3.2], jar: [jar, 1.55, 3.2] };
    A.exploreStep({
      items, need: 5, overview,
      intro: `<p>Всяко тяло има <b>маса</b> и <b>обем</b>. Днес ще ги измерваме и ще сравним твърди тела, течности и газове.</p>
        <p><b>Разгледай поне 5 неща</b> в лабораторията — кликни ги или ги избери от менюто.</p>`,
      focus: (id) => objOf[id],
      after: step2,
    });
  }

  // ---------- 2: налей точно ----------
  function step2() {
    shell.step(1);
    A.setClick(null);
    let mistakes = 0;
    if (narrow) fitView([-1.55, 1.05, -0.2], 1.6, 1.35, 0.3); else fitView([-3.0, 1.1, -0.2], 2.1, 1.35, 0.3);
    shell.task(`<p>Преди да измерваш, разбери <b>скалата</b> на цилиндъра.</p><div class="q"></div>`);
    shell.score('');
    shell.setControls('');
    say(cyl, 'Между 10 и 20 mL има 10 малки деления.', 'wide', 2.3);
    choiceBox(container().querySelector('.xp-task .q'), 'Колко милилитра е едно малко деление на този цилиндър?', ['1 mL', '5 mL', '10 mL'], 0,
      { 1: 'Преброй малките деления между 10 и 20 mL — колко са?', 2: 'Числата 10, 20, 30… са на големите черти. Между тях има още деления.' },
      () => { shell.msg('Вярно! Едно деление е 1 mL.', 'good'); setTimeout(fill, 700); },
      () => { mistakes++; shell.score(`Грешки: ${mistakes}`); });
    function fill() {
      if (!A.alive()) return;
      clearTip();
      showMag(true);
      pip.visible = true;
      pip.position.copy(pipHome());
      shell.task(`<p><b>Налей в цилиндъра точно ${target} mL вода.</b></p>
        <p>С чашата наливаш по 10 mL, а с капкомера можеш да добавиш или да извадиш по 1 mL. Гледай лупата: отчитай по долния край на повърхността.</p>`);
      shell.msg('');
      const c = shell.setControls(`<div class="measure-pour">
        <button class="btn p10">🫗 Налей 10 mL</button><button class="btn p1">💧 Капни 1 mL</button><button class="btn m1">🧪 Изтегли 1 mL</button></div>
        <div class="row"><button class="btn primary ok">✔ Готово</button></div>`);
      let busy = false;
      const cv = cyl.userData.vessel;
      const run = async (fn) => {
        if (busy) return;
        busy = true;
        c.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        shell.msg('');
        await fn();
        if (!A.alive()) return;
        busy = false;
        c.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      };
      c.querySelector('.p10').addEventListener('click', () => run(async () => {
        if (cv.ml + 10 > 100) { shell.msg('Ще прелее! Цилиндърът побира само 100 mL.', 'bad'); return; }
        await pour(beaker, cyl, 10, true);
      }));
      c.querySelector('.p1').addEventListener('click', () => run(async () => {
        if (cv.ml + 1 > 100) { shell.msg('Цилиндърът е пълен.', 'bad'); return; }
        const top = pipHome();
        drop.visible = true;
        const sy = A.surfaceY(cyl);
        await phase(0.45, (k) => { drop.position.set(top.x, top.y - 0.02 - (top.y - sy) * k * k, top.z); });
        drop.visible = false;
        cv.ml += 1;
      }));
      c.querySelector('.m1').addEventListener('click', () => run(async () => {
        if (cv.ml < 1) { shell.msg('В цилиндъра няма вода.', 'bad'); return; }
        const top = pipHome();
        const low = new V3(top.x, A.surfaceY(cyl) - 0.08, top.z);
        await phase(0.4, (k) => { pip.position.lerpVectors(top, low, ease(k)); });
        cv.ml -= 1;
        await phase(0.4, (k) => { pip.position.lerpVectors(low, top, ease(k)); });
      }));
      c.querySelector('.ok').addEventListener('click', () => {
        if (busy) return;
        if (cv.ml === target) {
          shell.msg(`Точно ${target} mL. Отлично измерване!`, 'good');
          say(cyl, `<b>V = ${target} mL</b>`, 'good', 2.3);
          pip.visible = false;
          setTimeout(convert, 800);
          return;
        }
        mistakes++;
        shell.msg(cv.ml > target
          ? `Водата е повече от ${target} mL. Погледни в лупата къде е долният край на повърхността.`
          : `Водата е по-малко от ${target} mL. Погледни в лупата къде е долният край на повърхността.`, 'bad');
        shell.score(`Грешки: ${mistakes}`);
      });
    }
    function convert() {
      if (!A.alive()) return;
      showMag(false);
      if (narrow) fitView([-0.5, 0.9, -0.5], 2.0, 1.3, 0.35); else fitView([-1.2, 0.9, -0.5], 2.6, 1.3, 0.35);
      say(bottle, '<b>1 L</b> — един литър', '', 1.65);
      shell.task(`<p>За по-големи обеми използваме <b>литри (L)</b>.</p>
        <div class="measure-in">
          <label class="num">1 L = <input class="c1" type="text" inputmode="decimal"> mL</label>
          <label class="num">250 mL = <input class="c2" type="text" inputmode="decimal"> L</label>
        </div>`);
      shell.msg('');
      let tries = 0;
      const c = shell.setControls('<button class="btn primary">Провери</button>');
      c.querySelector('button').addEventListener('click', () => {
        const i1 = container().querySelector('.c1'); const i2 = container().querySelector('.c2');
        const a = num(i1.value); const b = num(i2.value);
        if (!Number.isFinite(a) || !Number.isFinite(b)) { shell.msg('Попълни и двете полета.', 'bad'); return; }
        const ok1 = a === 1000; const ok2 = Math.abs(b - 0.25) < 1e-9;
        i1.classList.toggle('right', ok1); i1.classList.toggle('wrong', !ok1);
        i2.classList.toggle('right', ok2); i2.classList.toggle('wrong', !ok2);
        if (ok1 && ok2) {
          i1.disabled = true; i2.disabled = true;
          shell.msg('Вярно! 1 L = 1000 mL, затова 250 mL = 0,25 L (една четвърт литър).', 'good');
          scores.push(stepScore(mistakes, 3));
          const n = shell.setControls('<div class="row"><button class="btn primary nx">Напред →</button></div>');
          n.querySelector('.nx').addEventListener('click', step3);
          return;
        }
        mistakes++; tries++;
        let m = !ok1 ? 'Колко милилитра има в един литър? Виж бутилката.' : '250 mL е част от литъра. Раздели 250 на 1000.';
        if (tries >= 2) m += ' Подсказка: 1 L = 1000 mL; 500 mL = 0,5 L.';
        shell.msg(m, 'bad');
        shell.score(`Грешки: ${mistakes}`);
      });
    }
  }
  const container = () => shell.stageEl.closest('.xp').parentElement;

  // ---------- 3: камъчето ----------
  function step3() {
    shell.step(2);
    clearTip();
    let mistakes = 0;
    let state = 'scale';
    let busy = false;
    if (narrow) fitView([-0.4, 0.9, 0.0], 1.85, 1.4, 0.4); else fitView([-1.9, 0.9, 0.1], 2.4, 1.4, 0.38);
    const draw = () => {
      shell.task(`<p>Как да измерим обема на камъче? То няма форма на кубче и не можем да го измерим с линийка.</p>
        <p>${state === 'scale' ? '👉' : '✔'} 1. Кликни камъчето, за да го сложиш на <b>везната</b>.</p>
        <p>${state === 'scale' ? '' : state === 'cyl' ? '👉' : '✔'} 2. Кликни го пак, за да го пуснеш в <b>цилиндъра</b> с вода.</p>
        ${state === 'calc' ? `<div class="measure-in">
          <label class="num">Маса: m = <input class="im" type="text" inputmode="decimal"> g</label>
          <label class="num">Вода преди: V₁ = <input class="i1" type="text" inputmode="decimal"> mL</label>
          <label class="num">Вода с камъчето: V₂ = <input class="i2" type="text" inputmode="decimal"> mL</label>
          <label class="num">Обем на камъчето: V = <input class="iv" type="text" inputmode="decimal"> cm³</label></div>
          <p class="small">1 mL = 1 cm³. Обемът на камъчето е колкото се е покачила водата: V = V₂ − V₁.</p>` : ''}`);
      shell.score(`Грешки: ${mistakes}`);
    };
    draw();
    shell.setControls('');
    say(stone, 'Кликни ме!', 'tag', 0.4);
    // Етикетът на везната може да закрие камъчето — кликът върху везната или цилиндъра също върши работа.
    A.setClick(async (id) => {
      if (busy) return;
      if (!(id === 'stone' || (state === 'scale' && id === 'balance') || (state === 'cyl' && (id === 'balance' || id === 'cyl')))) return;
      if (state === 'scale') {
        busy = true; clearTip();
        await hop(stone, new V3(bal.position.x, bal.userData.panY + STONE.h / 2, bal.position.z), 0.7, 0.5);
        bal.userData.setMass(STONE.m);
        state = 'cyl';
        draw();
        say(bal, 'Везната показва масата. Запомни я!', '', 0.75);
        busy = false;
      } else if (state === 'cyl') {
        busy = true; clearTip();
        bal.userData.setMass(0);
        showMag(true);
        await sinkInto(stone, cyl, STONE.h);
        await phase(1.0);
        if (!A.alive()) return;
        state = 'calc';
        draw();
        say(cyl, 'Водата се покачи! Отчети новото ниво в лупата.', '', 2.3);
        const c = shell.setControls('<button class="btn primary">Провери</button>');
        c.querySelector('button').addEventListener('click', check);
        busy = false;
      }
    });
    let tries = 0;
    function check() {
      const q = (s) => container().querySelector(s);
      const f = [['.im', STONE.m], ['.i1', target], ['.i2', target + STONE.V], ['.iv', STONE.V]];
      const vals = f.map(([s]) => num(q(s).value));
      if (vals.some((v) => !Number.isFinite(v))) { shell.msg('Попълни всички полета.', 'bad'); return; }
      const ok = f.map(([s, want], i) => { const r = Math.abs(vals[i] - want) < 0.01; q(s).classList.toggle('right', r); q(s).classList.toggle('wrong', !r); return r; });
      if (ok.every(Boolean)) {
        f.forEach(([s]) => { q(s).disabled = true; });
        shell.msg(`Вярно! V = ${target + STONE.V} mL − ${target} mL = ${STONE.V} mL = ${STONE.V} cm³. Масата е ${STONE.m} g.`, 'good');
        say(cyl, `<b>V = V₂ − V₁ = ${STONE.V} cm³</b>`, 'good', 2.3);
        scores.push(stepScore(mistakes, 3));
        const c = shell.setControls('<div class="row"><button class="btn primary nx">Напред →</button></div>');
        c.querySelector('.nx').addEventListener('click', async () => {
          c.querySelector('.nx').disabled = true;
          showMag(false); clearTip();
          await liftOut(stone, stoneHome);
          step4();
        });
        return;
      }
      mistakes++; tries++;
      let m;
      if (!ok[0]) m = 'Масата не е вярна. Колко грама показа везната?';
      else if (!ok[1]) m = 'V₁ е водата, която наля в предишната задача.';
      else if (!ok[2]) m = 'V₂ не е вярно. Погледни лупата — къде е долният край на повърхността сега?';
      else m = 'Обемът на камъчето е разликата V₂ − V₁.';
      if (tries >= 2) m += ` Подсказка: масата беше ${STONE.m} g, а водата отначало — ${target} mL.`;
      shell.msg(m, 'bad');
      shell.score(`Грешки: ${mistakes}`);
    }
  }

  // ---------- 4: твърдо, течно, газ ----------
  function step4() {
    shell.step(3);
    clearTip();
    A.setClick(null);
    let mistakes = 0;
    bal.visible = false; bottle.visible = false;
    for (const v of Object.values(cont)) v.visible = true;
    overview();
    let matSel = 'water';
    let waterAt = cyl;
    const waterIn = new Set(); const stoneIn = new Set(); let gasJar = false; let gasOut = false;
    let busy = false;
    const okAll = () => waterIn.size >= 2 && stoneIn.size >= 1 && gasJar;
    let asked = false;
    const draw = () => {
      shell.task(`<p>Избери <b>какво</b> да преместиш, после кликни <b>съда</b> (висока чаша, купа, колба или буркан).</p>
        <div class="measure-mat">
          <button class="btn ${matSel === 'stone' ? 'on' : ''}" data-m="stone">🪨 Камъчето</button>
          <button class="btn ${matSel === 'water' ? 'on' : ''}" data-m="water">💧 Водата (${target} mL)</button>
          <button class="btn ${matSel === 'gas' ? 'on' : ''}" data-m="gas">💨 Газа</button></div>
        <ul class="measure-list">
          <li class="${waterIn.size >= 2 ? 'ok' : ''}">${waterIn.size >= 2 ? '✔' : '○'} Прелей водата в два различни съда (${Math.min(2, waterIn.size)}/2)</li>
          <li class="${stoneIn.size ? 'ok' : ''}">${stoneIn.size ? '✔' : '○'} Сложи камъчето в съд</li>
          <li class="${gasJar ? 'ok' : ''}">${gasJar ? '✔' : '○'} Пусни газа в затворения буркан</li></ul>`);
      container().querySelectorAll('.measure-mat button').forEach((b) => b.addEventListener('click', () => { matSel = b.dataset.m; draw(); }));
    };
    draw();
    shell.setControls('');
    shell.score('');
    const H = (vg) => vg.userData.vessel.sh.floor + vg.userData.vessel.sh.depth + 0.25;
    const NAMES = { glass: 'високата чаша', bowl: 'купата', flask: 'колбата', jar: 'буркана', cyl: 'цилиндъра' };
    A.setClick(async (id) => {
      if (busy || asked) return;
      const vg = id === 'jar' ? jar : id === 'cyl' ? cyl : cont[id];
      if (!vg) return;
      busy = true; clearTip();
      try {
        if (matSel === 'water') {
          if (vg === jar) { say(jar, 'Буркана пазим за газа. Избери друг съд.', '', H(jar)); return; }
          if (vg === waterAt) { say(vg, 'Водата вече е тук.', '', H(vg)); return; }
          if (stone.userData.inVessel === waterAt) await liftOut(stone, stoneHome);
          await pour(waterAt, vg, waterAt.userData.vessel.ml);
          waterAt = vg;
          if (vg !== cyl) waterIn.add(id);
          say(vg, `Водата прие формата на ${NAMES[id]}. Обемът ѝ е пак <b>${target} mL</b> — не сме добавили и не сме махнали вода.`, 'wide', H(vg));
        } else if (matSel === 'stone') {
          if (vg === jar) { say(jar, 'Буркана пазим за газа. Избери друг съд.', '', H(jar)); return; }
          if (stone.userData.inVessel === vg) { say(vg, 'Камъчето вече е тук.', '', H(vg)); return; }
          if (stone.userData.inVessel) await liftOut(stone, stoneHome);
          await sinkInto(stone, vg, STONE.h);
          stoneIn.add(id);
          say(vg, 'Камъчето запази своята форма и своя обем — то е твърдо тяло.', 'wide', H(vg));
        } else {
          if (gasJar) { say(jar, 'Газът вече е в буркана.', '', H(jar)); return; }
          syrIdle = false;
          const sh = vg.userData.vessel.sh;
          if (vg === jar) lid.visible = true;
          const topY = vg.position.y + sh.floor + sh.depth + (vg === jar ? 0.1 : 0.15);
          await hop(syr, new V3(vg.position.x, topY, vg.position.z), 0.8, 0.6);
          const pl = syr.userData.plunger;
          const y0 = pl.position.y;
          await phase(1.4, (k) => {
            pl.position.y = y0 + (0.34 - y0) * k;
            puffs.forEach((s, i) => {
              if (s.userData.owner !== 'syr' || i / puffs.length > k) return;
              if (vg === jar) s.userData.owner = 'jar';
              else { s.userData.owner = 'air'; s.userData.op = 0.55; s.userData.p.copy(s.position); s.userData.p.y = topY - 0.2; }
            });
          });
          if (vg === jar) {
            gasJar = true;
            say(jar, 'Газът зае <b>целия</b> буркан! Газът няма собствена форма и собствен обем — заема целия съд, в който е.', 'wide', H(jar) + 0.15);
            await hop(syr, syrHome, 0.7, 0.4);
          } else {
            gasOut = true;
            say(vg, 'Газът излезе от отворения съд и се разнесе в стаята. Затова газове пазим в затворени съдове.', 'wide', H(vg));
            await hop(syr, syrHome, 0.7, 0.4);
            // спринцовката отново се пълни с газ
            for (const s of puffs) if (s.userData.owner === 'air') { s.userData.owner = 'syr'; s.position.copy(syr.position); }
          }
          if (!gasJar || vg !== jar) syrIdle = true;
          else { syr.userData.plunger.position.y = 0.34; }
        }
      } finally {
        busy = false;
      }
      if (!A.alive()) return;
      draw();
      if (okAll() && !asked) grid();
    });
    void gasOut;
    function grid() {
      asked = true;
      const ROWS = [['Твърдо тяло (камъче)', [1, 1, 1]], ['Течност (вода)', [0, 1, 1]], ['Газ', [0, 0, 1]]];
      const COLS = ['Собствена форма?', 'Собствен обем?', 'Има маса?'];
      const st = ROWS.map(() => [null, null, null]);
      const c = shell.setControls(`<p class="measure-q">Попълни таблицата: кликай клетките (Да / Не).</p>
        <table class="measure-grid"><tr><th></th>${COLS.map((h) => `<th>${h}</th>`).join('')}</tr>
        ${ROWS.map(([n], r) => `<tr><td>${n}</td>${COLS.map((_, k) => `<td><button class="measure-cell" data-r="${r}" data-k="${k}">?</button></td>`).join('')}</tr>`).join('')}</table>
        <div class="row"><button class="btn primary chk">Провери</button></div>`);
      c.querySelectorAll('.measure-cell').forEach((b) => b.addEventListener('click', () => {
        const r = +b.dataset.r; const k = +b.dataset.k;
        st[r][k] = st[r][k] === 1 ? 0 : 1;
        b.textContent = st[r][k] ? 'Да' : 'Не';
        b.classList.remove('right', 'wrong');
      }));
      let tries = 0;
      c.querySelector('.chk').addEventListener('click', () => {
        if (st.some((row) => row.some((v) => v === null))) { shell.msg('Попълни всички клетки.', 'bad'); return; }
        let bad = 0;
        c.querySelectorAll('.measure-cell').forEach((b) => {
          const r = +b.dataset.r; const k = +b.dataset.k;
          const ok = st[r][k] === ROWS[r][1][k];
          b.classList.toggle('right', ok); b.classList.toggle('wrong', !ok);
          if (!ok) bad++;
        });
        if (!bad) {
          c.querySelectorAll('button').forEach((b) => { b.disabled = true; });
          scores.push(stepScore(mistakes, 3));
          shell.msg('Вярно! Твърдите тела имат собствена форма и обем, течностите — само собствен обем, а газовете заемат целия съд. И трите имат маса.', 'good');
          c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary nx">Виж резултата</button></div>');
          c.querySelector('.nx').addEventListener('click', A.finishAll);
          return;
        }
        mistakes++; tries++;
        let m = `${bad === 1 ? 'Една клетка не е вярна' : `${bad} клетки не са верни`}. Спомни си какво видя: водата смени ли формата си? Газът колко място зае?`;
        if (tries >= 2) m += ' Подсказка: всички вещества имат маса — дори газовете.';
        shell.msg(m, 'bad');
        shell.score(`Грешки: ${mistakes}`);
      });
    }
  }

  step1();
  return { dispose() {} };
}
