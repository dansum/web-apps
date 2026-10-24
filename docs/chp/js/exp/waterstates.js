// 4.1.3 „Температура и трите състояния на водата“ — кухня-лаборатория с термометри, котлон, тенджера, капак и фризер.
// Стъпки: опознай → измери температура (вода, въздух, тяло) → промени състоянието и го назови → приложи наученото.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (k) => Math.max(0, Math.min(1, k));
const fmt = (v) => String(Math.round(v * 10) / 10).replace('.', ',').replace('-', '−');

const PARTS = [
  { id: 'thermo', label: 'Термометър', icon: '🌡️',
    note: '<b>Термометър</b> — уред за измерване на температура. Температурата се измерва в <b>градуси Целзий (°C)</b>. Колкото по-топло е, толкова по-високо се качва червеният стълб.' },
  { id: 'glass', label: 'Чаша вода', icon: '🥛',
    note: '<b>Вода</b> — <b>течно</b> състояние. Течната вода няма собствена форма — приема формата на съда. Тече и се разлива.' },
  { id: 'ice', label: 'Лед', icon: '🧊',
    note: '<b>Лед</b> — <b>твърдо</b> състояние на водата. Ледът има собствена форма. Водата замръзва при <b>0 °C</b>. В топлата стая ледът бавно се топи.' },
  { id: 'kettle', label: 'Чайник', icon: '♨️',
    note: '<b>Водни пари</b> — <b>газообразно</b> състояние на водата. При <b>100 °C</b> водата кипи и бързо се превръща във водни пари. Самите пари са невидими. Бялото облаче над чайника са ситни капчици — парите се втечняват в по-хладния въздух.' },
  { id: 'pot', label: 'Тенджера на котлона', icon: '🍲',
    note: '<b>Стъклена тенджера на котлон.</b> С нея ще нагряваме и охлаждаме вода и ще гледаме как се променя състоянието ѝ. Този лабораторен котлон може и да нагрява, и да охлажда.' },
  { id: 'freezer', label: 'Фризер', icon: '❄️',
    note: '<b>Фризер</b> — в него е много студено, около <b>−18 °C</b>. Там водата замръзва и става на лед.' },
  { id: 'kid', label: 'Мира', icon: '👧',
    note: '<b>Мира</b>. Телесната температура на здрав човек е около <b>36,6 °C</b>. Измерва се с медицински термометър под мишницата.' },
];
const PART = Object.fromEntries(PARTS.map((p) => [p.id, p]));

const NAMES = ['Топене', 'Замръзване', 'Изпарение', 'Втечняване'];
const DEF = [
  'Топене е, когато ледът се превръща във вода.',
  'Замръзване е, когато водата се превръща в лед.',
  'Изпарение е, когато водата се превръща във водни пари.',
  'Втечняване е, когато водните пари се превръщат отново във вода.',
];

function injectStyle() {
  if (document.getElementById('waterstates-style')) return;
  const s = document.createElement('style');
  s.id = 'waterstates-style';
  s.textContent = `
  .waterstates-q { margin:10px 0 4px; font-weight:700; }
  .waterstates-meas { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  .waterstates-meas svg { flex:0 0 auto; background:#f7fbff; border:1px solid #d5e3f0; border-radius:10px; }
  .waterstates-in { display:flex; gap:6px; align-items:center; margin-top:6px; }
  .waterstates-in input { width:84px; font:inherit; font-size:1.1rem; padding:8px; border:2px solid #c7d3e0; border-radius:8px; text-align:right; }
  .waterstates-tbl { width:100%; border-collapse:collapse; font-size:.9rem; margin-top:6px; }
  .waterstates-tbl td { border-bottom:1px solid #e3e8ef; padding:3px 4px; }
  .waterstates-tbl td:last-child { text-align:right; font-weight:700; }
  .waterstates-range { width:100%; margin:10px 0 2px; accent-color:#e53935; height:28px; }
  .waterstates-scale { display:flex; justify-content:space-between; font-size:.8rem; color:#5b6b7b; }
  .waterstates-names { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .waterstates-names .choice { justify-content:center; font-weight:700; }
  `;
  document.head.appendChild(s);
}

// ---------- помощни модели ----------
function glassMat(opacity = 0.26) {
  return new THREE.MeshStandardMaterial({ color: 0xe6f4ff, transparent: true, opacity, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
}
function liquidMat(color, opacity = 0.82) {
  return new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.15, depthWrite: false });
}
function lathe(pts, m, seg = 28) {
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), m);
}
function gridTexture({ size = 128, cells = 16, line = 'rgba(70,75,85,1)', bg = 'rgba(0,0,0,0)', lw = 2 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, size, size);
  x.strokeStyle = line; x.lineWidth = lw;
  for (let i = 0; i <= cells; i++) {
    const p = (i / cells) * size;
    x.beginPath(); x.moveTo(p, 0); x.lineTo(p, size); x.stroke();
    x.beginPath(); x.moveTo(0, p); x.lineTo(size, p); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let puffTex = null;
function puffSprite(color, opacity, size) {
  if (!puffTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    puffTex = new THREE.CanvasTexture(c);
    puffTex.colorSpace = THREE.SRGBColorSpace;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color, transparent: true, opacity, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}
// Скала на термометъра в панела (SVG). min…max, малка чертичка = minor, число на всеки major.
function svgThermo(min, max, minor, major, value, title) {
  const top = 30; const bot = 232;
  const n = Math.round((max - min) / minor);
  const y = (v) => bot - ((v - min) / (max - min)) * (bot - top);
  let ticks = '';
  for (let i = 0; i <= n; i++) {
    const v = min + i * minor;
    const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    const isMid = !isMaj && Math.abs((v * 2) / major - Math.round((v * 2) / major)) < 1e-6;
    const len = isMaj ? 20 : isMid ? 13 : 7;
    const yy = y(v).toFixed(1);
    ticks += `<line x1="58" x2="${58 + len}" y1="${yy}" y2="${yy}" stroke="#37474f" stroke-width="${isMaj ? 2 : 1}"/>`;
    if (isMaj) ticks += `<text x="84" y="${(+yy + 5).toFixed(1)}" font-size="15" font-weight="700" fill="#263238">${fmt(v)}</text>`;
  }
  const yv = y(Math.max(min, Math.min(max, value)));
  return `<svg width="140" height="270" viewBox="0 0 140 270" role="img" aria-label="${esc(title)}">
    <text x="70" y="12" font-size="11" text-anchor="middle" fill="#5b6b7b">${esc(title)}</text>
    <rect x="42" y="${top - 8}" width="14" height="${bot - top + 34}" rx="7" fill="#eef6fc" stroke="#9fb3c4"/>
    <rect x="46" y="${yv.toFixed(1)}" width="6" height="${(bot + 26 - yv).toFixed(1)}" fill="#e53935"/>
    <circle cx="49" cy="${bot + 30}" r="13" fill="#e53935" stroke="#b71c1c"/>
    ${ticks}
    <text x="122" y="${bot + 34}" font-size="14" fill="#263238">°C</text>
  </svg>`;
}

// ---------- преживяване ----------
export function mount(container, opts) {
  injectStyle();
  let inst = null;
  const restart = () => { inst.dispose(); inst = build(container, opts, restart); };
  inst = build(container, opts, restart);
  return { dispose() { inst.dispose(); } };
}

function build(container, { onComplete }, restart) {
  const STEPS = ['Опознай кухнята', 'Измери температурата', 'Промени състоянието', 'Приложи наученото'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xf3efe6, camPos: [0, 3.5, 10], target: [0, 1.4, 0], maxDistance: 20, minDistance: 1.2,
    maxPolarAngle: Math.PI * 0.47,
  });
  const { scene, camera } = stage;
  stage.controls.minAzimuthAngle = -1.0;
  stage.controls.maxAzimuthAngle = 1.0;
  const narrow = camera.aspect < 1.15;
  const narrowUI = () => stage.renderer.domElement.clientWidth < 480;

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
  const wait = (sec) => phase(sec);
  const until = (cond) => new Promise((res) => { const stop = stage.tick(() => { if (cond()) { stop(); res(); } }); });
  async function hop(g, to, dur = 0.7, height = 0.4, rotTo = null) {
    const from = g.position.clone();
    const r0 = g.rotation.clone();
    await phase(dur, (k) => {
      g.position.lerpVectors(from, to, ease(k));
      g.position.y += Math.sin(k * Math.PI) * height;
      if (rotTo) { g.rotation.x = lerp(r0.x, rotTo[0], ease(k)); g.rotation.z = lerp(r0.z, rotTo[2], ease(k)); }
    });
  }

  // ---------- кухня ----------
  const TY = 1.0;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat(0xd7ccc8));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), mat(0xf6f1e7));
  wall.position.set(0, 5, -1.1);
  scene.add(wall);
  const tileTex = gridTexture({ size: 256, cells: 4, line: 'rgba(170,190,200,1)', bg: '#e8f1f5', lw: 4 });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(16, 2);
  const splash = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 1.0), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.8 }));
  splash.position.set(1.7, TY + 0.5, -1.09);
  scene.add(splash);
  const ctop = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.08, 1.9), mat(0xeceff1, { roughness: 0.5 }));
  ctop.position.set(1.7, TY - 0.04, -0.1);
  scene.add(ctop);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(8.0, TY - 0.08, 1.8), mat(0x90a4ae));
  cab.position.set(1.7, (TY - 0.08) / 2, -0.12);
  scene.add(cab);
  for (let i = 0; i < 5; i++) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, TY - 0.2, 0.03), mat(0xb0bec5));
    door.position.set(-2.1 + 0.8 + i * 1.6, (TY - 0.08) / 2, 0.8);
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.04), mat(0x607d8b, { metalness: 0.6 }));
    knob.position.set(0, 0.28, 0.03);
    door.add(knob);
    scene.add(door);
  }
  // прозорец със слънце
  const WX = 4.6;
  const win = new THREE.Group();
  win.add(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.3), new THREE.MeshBasicMaterial({ color: 0xbfe3ff })));
  const sunM = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), new THREE.MeshBasicMaterial({ color: 0xffd54f }));
  sunM.position.set(0.45, 0.3, 0.01);
  win.add(sunM);
  const hill = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x9ccc65 }));
  hill.position.set(-0.3, -0.65, 0.01);
  hill.scale.y = 0.35;
  win.add(hill);
  for (const [w, h, x, y] of [[2.0, 0.1, 0, 0.7], [2.0, 0.1, 0, -0.7], [0.1, 1.5, -0.95, 0], [0.1, 1.5, 0.95, 0], [0.06, 1.3, 0, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), mat(0xffffff));
    f.position.set(x, y, 0.04);
    win.add(f);
  }
  win.position.set(WX, 2.45, -1.08);
  scene.add(win);
  const cloud = new THREE.Group();
  for (let j = 0; j < 3; j++) { const p = puffSprite(0xffffff, 0.95, 0.35); p.position.set(j * 0.2, 0, 0); cloud.add(p); }
  cloud.position.set(WX - 0.5, 2.75, -1.06);
  scene.add(cloud);
  // стенен часовник
  const clock = new THREE.Group();
  clock.add(new THREE.Mesh(new THREE.CircleGeometry(0.3, 28), mat(0xffffff)));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.03, 6, 28), mat(0x37474f));
  clock.add(rim);
  const hand = (len, w, c) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.01), mat(c)); m.position.y = len / 2 - 0.03; p.add(m); p.position.z = 0.02; clock.add(p); return p; };
  const hM = hand(0.22, 0.025, 0x263238); const hS = hand(0.25, 0.01, 0xd32f2f);
  clock.position.set(2.0, 2.9, -1.07);
  scene.add(clock);

  // ---------- фризер ----------
  const FX = -5.3;
  const fridge = new THREE.Group();
  fridge.position.set(FX, 0, -0.45);
  fridge.userData.pickId = 'freezer';
  // долу хладилник (плътна кутия), горе фризер с кухина, за да се вижда вътре
  const whiteM = mat(0xf5f7f8, { roughness: 0.4 });
  const fBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.55, 1.1), whiteM);
  fBody.position.y = 0.775;
  fridge.add(fBody);
  const iceWallM = mat(0xd6ecf8);
  for (const [w, h, d, x, y, z] of [[1.3, 0.85, 0.05, 0, 1.975, -0.525], [0.05, 0.85, 1.1, -0.625, 1.975, 0], [0.05, 0.85, 1.1, 0.625, 1.975, 0], [1.3, 0.05, 1.1, 0, 2.375, 0]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), x === 0 && z < 0 ? iceWallM : whiteM);
    m.position.set(x, y, z);
    fridge.add(m);
  }
  const fFloor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 1.0), iceWallM);
  fFloor.position.set(0, 1.56, 0);
  fridge.add(fFloor);
  const lowDoor = new THREE.Mesh(new THREE.BoxGeometry(1.26, 1.5, 0.06), mat(0xeef1f3, { roughness: 0.4 }));
  lowDoor.position.set(0, 0.8, 0.58);
  const lh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), mat(0x90a4ae, { metalness: 0.6 }));
  lh.position.set(0.5, 0.45, 0.05);
  lowDoor.add(lh);
  fridge.add(lowDoor);
  const fDoorPivot = new THREE.Group();
  fDoorPivot.position.set(-0.63, 1.95, 0.58);
  const fDoor = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.8, 0.06), mat(0xeef1f3, { roughness: 0.4 }));
  fDoor.position.x = 0.63;
  const fh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.05), mat(0x90a4ae, { metalness: 0.6 }));
  fh.position.set(0.5, -0.15, 0.05);
  fDoor.add(fh);
  const disp = labelSprite('❄ −18 °C', { size: 0.1, color: '#0d47a1', bg: 'rgba(225,240,255,0.95)' });
  disp.position.set(0.63, 0.18, 0.05);
  disp.material.depthTest = true;
  fDoorPivot.add(fDoor, disp);
  fridge.add(fDoorPivot);
  // бутилка във фризера (за стъпка 4)
  const bottle = new THREE.Group();
  bottle.position.set(0, 1.57, 0.1);
  const bGlass = lathe([[0, 0.001], [0.1, 0.001], [0.1, 0.32], [0.04, 0.42], [0.035, 0.52]], glassMat(0.35));
  bGlass.renderOrder = 3;
  const bWaterM = liquidMat(0x64b5f6, 0.75);
  const bWater = lathe([[0, 0.005], [0.093, 0.005], [0.093, 0.32], [0.034, 0.42], [0.03, 0.5], [0, 0.5]], bWaterM);
  bWater.renderOrder = 2;
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 10), mat(0xe1f5fe));
  plug.position.y = 0.5; plug.scale.y = 0.001; plug.visible = false;
  const crackM = new THREE.MeshBasicMaterial({ color: 0x263238, transparent: true, opacity: 0 });
  const cracks = new THREE.Group();
  for (const [x, y, rz, l] of [[0.03, 0.2, 0.5, 0.18], [-0.04, 0.14, -0.4, 0.14], [0.0, 0.27, 0.1, 0.12]]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.008, l, 0.002), crackM);
    c.position.set(x, y, 0.102);
    c.rotation.z = rz;
    cracks.add(c);
  }
  bottle.add(bGlass, bWater, plug, cracks);
  bottle.visible = false;
  fridge.add(bottle);
  scene.add(fridge);
  addHitBox(fridge);
  const frost = [];
  for (let i = 0; i < 10; i++) {
    const p = puffSprite(0xe3f2fd, 0, 0.3);
    p.userData.ph = Math.random();
    fridge.add(p);
    frost.push(p);
  }
  let freezerOpen = 0;

  // ---------- Мира ----------
  const KX = -3.35;
  const kid = new THREE.Group();
  kid.position.set(KX, 0, 0.45);
  kid.userData.pickId = 'kid';
  const skin = mat(0xf2c9a0);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 10), mat(0x3949ab));
    leg.position.set(s * 0.09, 0.35, 0);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.2), mat(0xe53935));
    shoe.position.set(s * 0.09, 0.035, 0.04);
    kid.add(leg, shoe);
  }
  const torso = new THREE.Group();
  torso.position.y = 0.7;
  const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.55, 14), mat(0xffb300));
  shirt.position.y = 0.27;
  torso.add(shirt);
  const head = new THREE.Group();
  head.position.y = 0.72;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), skin));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(0x6d4c41));
  hair.rotation.x = -0.6;
  head.add(hair);
  for (const s of [-1, 1]) {
    const pig = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0x6d4c41));
    pig.position.set(s * 0.19, -0.02, -0.04);
    head.add(pig);
  }
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), mat(0x263238));
    e.position.set(s * 0.06, 0.02, 0.155);
    head.add(e);
    eyes.push(e);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 12, Math.PI), mat(0xc62828));
  smile.position.set(0, -0.06, 0.155); smile.rotation.z = Math.PI;
  head.add(smile);
  torso.add(head);
  const arms = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group();
    pv.position.set(s * 0.21, 0.5, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), mat(0xffb300));
    arm.position.y = -0.25;
    const hnd = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skin);
    hnd.position.y = -0.52;
    pv.add(arm, hnd);
    pv.rotation.z = s * 0.12;
    torso.add(pv);
    arms.push(pv);
  }
  kid.add(torso);
  scene.add(kid);
  addHitBox(kid);
  const kidArm = arms[1]; // лявата ръка на Мира (вдясно на екрана)
  let armTarget = 0.12;

  // ---------- чаша, лед, чайник ----------
  const glass = new THREE.Group();
  glass.position.set(-1.7, TY, 0.15);
  glass.userData.pickId = 'glass';
  const gl = lathe([[0, 0.001], [0.19, 0.001], [0.22, 0.5]], glassMat(0.3));
  gl.renderOrder = 3;
  const gw = lathe([[0, 0.01], [0.18, 0.01], [0.205, 0.38], [0, 0.38]], liquidMat(0x64b5f6, 0.6));
  gw.renderOrder = 2;
  glass.add(gl, gw);
  scene.add(glass);
  addHitBox(glass, 0.6);
  const bowl = new THREE.Group();
  bowl.position.set(-0.55, TY, 0.2);
  bowl.userData.pickId = 'ice';
  bowl.add(lathe([[0, 0.001], [0.2, 0.01], [0.3, 0.1], [0.34, 0.2]], mat(0x80cbc4, { side: THREE.DoubleSide })));
  const bowlW = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.03, 20), liquidMat(0x90caf9, 0.7));
  bowlW.position.y = 0.04;
  bowl.add(bowlW);
  const iceM = new THREE.MeshStandardMaterial({ color: 0xd6f0ff, transparent: true, opacity: 0.85, roughness: 0.1 });
  const bowlIce = [];
  for (const [x, z, ry] of [[-0.08, 0.02, 0.3], [0.08, -0.04, 1.1], [0.0, 0.1, 0.7], [0.05, 0.1, 0.2]]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.13), iceM);
    c.position.set(x, 0.1 + (bowlIce.length === 3 ? 0.08 : 0), z);
    c.rotation.y = ry;
    bowl.add(c);
    bowlIce.push(c);
  }
  scene.add(bowl);
  addHitBox(bowl, 0.6);
  const kettle = new THREE.Group();
  kettle.position.set(3.3, TY, -0.35);
  kettle.userData.pickId = 'kettle';
  kettle.add(lathe([[0, 0.001], [0.26, 0.001], [0.28, 0.2], [0.22, 0.45], [0.1, 0.5], [0, 0.52]], mat(0xfafafa, { roughness: 0.3 })));
  const kBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 20), mat(0x424242));
  kBase.position.y = -0.0;
  kettle.add(kBase);
  const kSp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.3, 10), mat(0xfafafa));
  kSp.position.set(0.32, 0.36, 0); kSp.rotation.z = -0.9;
  const kH = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 6, 14, Math.PI), mat(0x424242));
  kH.position.set(-0.27, 0.27, 0); kH.rotation.z = Math.PI / 2;
  const kLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5252 }));
  kLed.position.set(0.0, 0.08, 0.27);
  kettle.add(kSp, kH, kLed);
  scene.add(kettle);
  addHitBox(kettle, 0.6);
  const kSteam = [];
  for (let i = 0; i < 10; i++) {
    const p = puffSprite(0xffffff, 0, 0.15);
    p.userData.ph = i / 10;
    scene.add(p);
    kSteam.push(p);
  }

  // ---------- котлон и тенджера ----------
  const PXp = 1.05;
  const potG = new THREE.Group();
  potG.position.set(PXp, TY, 0.0);
  potG.userData.pickId = 'pot';
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.14, 32), mat(0x546e7a, { metalness: 0.4, roughness: 0.4 }));
  plate.position.y = 0.07;
  const plateTopM = new THREE.MeshStandardMaterial({ color: 0x37474f, emissive: 0x000000 });
  const plateTop = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.02, 32), plateTopM);
  plateTop.position.y = 0.15;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 14), mat(0x212121));
  knob.rotation.x = Math.PI / 2; knob.position.set(0, 0.07, 0.66);
  potG.add(plate, plateTop, knob);
  const POT_Y = 0.16;
  const PR = 0.4;
  const pglass = lathe([[0, 0.001], [PR + 0.02, 0.001], [PR + 0.03, 0.6], [PR + 0.06, 0.62]], glassMat(0.22));
  pglass.position.y = POT_Y;
  pglass.renderOrder = 3;
  potG.add(pglass);
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.022, 6, 12, Math.PI), glassMat(0.5));
    h.position.set(s * (PR + 0.1), POT_Y + 0.5, 0);
    h.rotation.z = -s * Math.PI / 2;
    potG.add(h);
  }
  const pWaterM = liquidMat(0x64b5f6, 0.6);
  const pWater = new THREE.Mesh(new THREE.CylinderGeometry(PR, PR, 1, 28), pWaterM);
  pWater.renderOrder = 2;
  potG.add(pWater);
  const pBlockM = new THREE.MeshStandardMaterial({ color: 0xe1f5fe, transparent: true, opacity: 0.92, roughness: 0.15 });
  const pBlock = new THREE.Mesh(new THREE.CylinderGeometry(PR, PR, 1, 28), pBlockM);
  pBlock.renderOrder = 2;
  potG.add(pBlock);
  const cubes = [];
  const CUBE_POS = [[-0.15, 0, -0.1], [0.14, 0, -0.08], [0.0, 0, 0.15], [-0.05, 1, 0.0], [0.17, 0, 0.16]];
  for (const [x, lvl, z] of CUBE_POS) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), iceM);
    c.position.set(x, 0, z);
    c.rotation.y = Math.random() * 2;
    c.userData.lvl = lvl;
    potG.add(c);
    cubes.push(c);
  }
  const pBubbles = [];
  const bubM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 16; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), bubM);
    b.visible = false;
    potG.add(b);
    pBubbles.push(b);
  }
  const pSteam = [];
  for (let i = 0; i < 50; i++) {
    const p = puffSprite(0xffffff, 0, 0.25);
    p.visible = false;
    potG.add(p);
    pSteam.push(p);
  }
  scene.add(potG);
  addHitBox(potG);
  let potTag = null;
  // студен капак
  const lid = new THREE.Group();
  lid.userData.pickId = 'lid';
  const lidDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.03, 32), mat(0xb0bec5, { metalness: 0.5, roughness: 0.35, emissive: 0x404850 }));
  const lidKnob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0x263238));
  lidKnob.position.y = 0.05;
  lid.add(lidDisk, lidKnob);
  const lidDrops = [];
  const dropM = new THREE.MeshStandardMaterial({ color: 0x90caf9, transparent: true, opacity: 0.95, roughness: 0.05 });
  for (let i = 0; i < 22; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), dropM);
    const a = Math.random() * Math.PI * 2; const r = Math.sqrt(Math.random()) * 0.4;
    d.position.set(Math.cos(a) * r, -0.025, Math.sin(a) * r);
    d.scale.set(0.001, 0.001, 0.001);
    d.userData.th = Math.random();
    lid.add(d);
    lidDrops.push(d);
  }
  const LID_HOME = new V3(2.25, TY + 0.02, 0.1);
  const LID_UP = new V3(PXp, TY + 1.12, 0.12);
  lid.position.copy(LID_HOME);
  scene.add(lid);
  const fallDrop = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), dropM);
  fallDrop.visible = false;
  scene.add(fallDrop);

  // ---------- термометри ----------
  const tc = document.createElement('canvas');
  tc.width = 96; tc.height = 768;
  const tx = tc.getContext('2d');
  const TMIN = -20; const TMAX = 110;
  const scaleY = (v) => 0.2 + ((v - TMIN) / (TMAX - TMIN)) * 1.0; // в метри от дъното на термометъра
  tx.fillStyle = '#ffffff'; tx.fillRect(0, 0, 96, 768);
  tx.fillStyle = '#263238';
  for (let v = TMIN; v <= TMAX; v += 2) {
    const py = 768 - ((scaleY(v) - 0.12) / 1.18) * 768;
    const maj = v % 10 === 0;
    tx.fillRect(maj ? 4 : 4, py - 1, maj ? 26 : 14, maj ? 3 : 2);
    if (maj && v % 20 === 0) { tx.font = 'bold 22px system-ui, Arial'; tx.fillText(String(v), 40, py + 8); }
  }
  const tTex = new THREE.CanvasTexture(tc);
  tTex.colorSpace = THREE.SRGBColorSpace;
  const thermo = new THREE.Group();
  thermo.userData.pickId = 'thermo';
  const tPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.18), new THREE.MeshBasicMaterial({ map: tTex }));
  tPlate.position.set(0.05, 0.12 + 0.59, -0.02);
  const tTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 12), glassMat(0.4));
  tTube.position.y = 0.7;
  tTube.renderOrder = 4;
  const tBulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), mat(0xe53935));
  tBulb.position.y = 0.06;
  const tCol = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), mat(0xe53935));
  const tCap = new THREE.Mesh(new THREE.SphereGeometry(0.027, 10, 8), glassMat(0.5));
  tCap.position.y = 1.3;
  thermo.add(tPlate, tTube, tBulb, tCol, tCap);
  thermo.userData.cur = 22; thermo.userData.target = 22; // уточнява се по-долу
  function drawThermo() {
    const top = scaleY(thermo.userData.cur);
    tCol.scale.y = top - 0.06;
    tCol.position.y = 0.06 + (top - 0.06) / 2;
  }
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.18, 14), mat(0x5c6bc0));
  holder.position.set(-1.05, TY + 0.09, -0.55);
  scene.add(holder);
  const TH_HOME = new V3(-1.05, TY + 0.03, -0.55);
  thermo.position.copy(TH_HOME);
  scene.add(thermo);
  addHitBox(thermo, 0.4);
  // кукичка на стената (въздух)
  const hook = new THREE.Group();
  hook.userData.pickId = 'hook';
  const hookP = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.04), mat(0x8d6e63));
  const hookN = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8), mat(0x546e7a, { metalness: 0.6 }));
  hookN.rotation.x = Math.PI / 2; hookN.position.z = 0.05;
  hook.add(hookP, hookN);
  hook.position.set(-0.3, 2.75, -1.07);
  scene.add(hook);
  addHitBox(hook, 0.45);
  // медицински термометър
  const med = new THREE.Group();
  const medBody = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
  const medTip = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), mat(0xb0bec5, { metalness: 0.8 }));
  medTip.position.y = -0.12;
  med.add(medBody, medTip);
  const MED_HOME = new V3(-2.05, TY + 0.02, 0.45);
  med.position.copy(MED_HOME);
  med.rotation.z = Math.PI / 2;
  scene.add(med);

  // температури за измерване (различни при всяко започване)
  const T_WATER = 12 + Math.floor(Math.random() * 7);
  const T_AIR = 21 + Math.floor(Math.random() * 4);
  const T_BODY = 36.6;
  thermo.userData.cur = thermo.userData.target = T_AIR;

  // ---------- състояние на водата в тенджерата ----------
  const W = { T: -10, target: -10, ice: 1, form: 'cubes', M: 0.24, cond: 0, lidOn: false, boil: 0 };
  function potLevel() {
    if (W.form === 'cubes') return W.M * (1 - W.ice);
    return W.M * (1 - W.ice) + W.M * W.ice * 1.09;
  }
  function renderPot(dt, t) {
    const liq = W.M * (1 - W.ice);
    pWater.visible = liq > 0.004;
    pWater.scale.y = Math.max(0.001, liq);
    pWater.position.y = POT_Y + liq / 2;
    const s = 0.16 * Math.cbrt(W.form === 'cubes' ? Math.max(0.001, W.ice) : 0.001);
    for (const c of cubes) {
      c.visible = W.form === 'cubes' && W.ice > 0.01;
      c.scale.setScalar(s);
      const rest = POT_Y + s / 2 + c.userData.lvl * s * 0.9;
      // ледът плава: 9/10 от него са под водата
      const fl = POT_Y + liq - 0.4 * s + Math.sin(t * 2 + c.position.x * 9) * 0.004;
      c.position.y = Math.max(rest, fl);
    }
    pBlock.visible = W.form === 'block' && W.ice > 0.005;
    if (pBlock.visible) {
      const th = W.M * W.ice * 1.09;
      pBlock.scale.y = th;
      pBlock.position.y = POT_Y + liq + th / 2;
    }
    // котлон: червен, когато грее; син, когато охлажда
    const e = plateTopM.emissive;
    if (W.target > 25) e.setRGB(Math.min(1, (W.target - 25) / 70), 0.1 * Math.min(1, (W.target - 25) / 70), 0);
    else if (W.target < 0) e.setRGB(0, 0.15, 0.6 * Math.min(1, -W.target / 10));
    else e.setRGB(0, 0, 0);
    if (potTag) {
      const label = `🌡 ${fmt(Math.round(W.T))} °C · ${W.boil > 0 ? 'кипи' : W.ice > 0.98 ? 'лед' : W.ice > 0.02 ? 'лед и вода' : 'вода'}`;
      if (potTag.el.textContent !== label) potTag.set(label);
    }
  }
  function simulate(dt) {
    // температурата върви към зададената; докато ледът се топи или водата замръзва, тя стои на 0 °C
    if (W.target > 0 && W.ice > 0 && W.T >= 0) {
      W.T = 0;
      W.ice = Math.max(0, W.ice - dt * (0.12 + W.target / 160));
      if (W.ice === 0) W.form = 'block';
    } else if (W.target < 0 && W.ice < 1 && W.T <= 0) {
      W.T = 0;
      if (W.form === 'cubes' && W.ice < 1) W.form = W.ice < 0.02 ? 'block' : 'cubes';
      W.ice = Math.min(1, W.ice + dt * (0.15 + -W.target / 25));
    } else {
      const d = W.target - W.T;
      W.T += Math.sign(d) * Math.min(Math.abs(d), dt * 35);
    }
    W.boil = W.T >= 99.5 && W.ice === 0 ? W.boil + dt : 0;
    if (W.boil > 0) W.M = Math.max(0.13, W.M - dt * 0.005);
  }

  // ---------- оживяване ----------
  let steamI = 0;
  const steamRate = () => (W.boil > 0 ? 14 : W.T > 50 && W.ice === 0 ? 2 + (W.T - 50) / 10 : 0);
  let steamAcc = 0;
  stage.tick((dt, t) => {
    simulate(dt);
    renderPot(dt, t);
    // мехурчета при кипене
    const liq = W.M * (1 - W.ice);
    for (const b of pBubbles) {
      if (!b.visible) {
        if (W.boil > 0 && Math.random() < 0.2) { b.visible = true; const a = Math.random() * 6.3; const r = Math.random() * 0.33; b.position.set(Math.cos(a) * r, POT_Y + 0.02, Math.sin(a) * r); }
        continue;
      }
      b.position.y += dt * 0.6;
      if (b.position.y > POT_Y + liq) b.visible = false;
    }
    // пара над тенджерата
    steamAcc += dt * steamRate();
    while (steamAcc > 1) {
      steamAcc -= 1;
      const p = pSteam[steamI++ % pSteam.length];
      p.visible = true;
      p.userData.age = 0;
      p.userData.max = W.boil > 0 ? 0.55 : 0.25;
      const a = Math.random() * 6.3; const r = Math.random() * 0.25;
      p.position.set(Math.cos(a) * r, POT_Y + potLevel() + 0.05, Math.sin(a) * r);
    }
    const lidLocalY = LID_UP.y - TY - 0.2;
    for (const p of pSteam) {
      if (!p.visible) continue;
      p.userData.age += dt;
      p.position.y += dt * 0.7;
      p.position.x += Math.sin(t * 2 + p.id) * dt * 0.05;
      const k = p.userData.age / 2.2;
      p.material.opacity = p.userData.max * Math.sin(Math.min(1, k) * Math.PI);
      p.scale.setScalar(0.22 + k * 0.4);
      if (W.lidOn && p.position.y > lidLocalY) { p.visible = false; W.cond = Math.min(1, W.cond + 0.012); }
      if (k >= 1) p.visible = false;
    }
    // капки по капака
    for (const d of lidDrops) {
      const s = clamp01((W.cond - d.userData.th * 0.6) / 0.4);
      d.scale.set(Math.max(0.001, s), Math.max(0.001, s * 0.8), Math.max(0.001, s));
    }
    if (W.lidOn && W.cond > 0.6 && !fallDrop.visible && Math.random() < dt * 1.5) {
      fallDrop.visible = true;
      fallDrop.position.set(PXp + (Math.random() - 0.5) * 0.3, LID_UP.y - 0.25, 0.15 + (Math.random() - 0.5) * 0.2);
    }
    if (fallDrop.visible) { fallDrop.position.y -= dt * 2.2; if (fallDrop.position.y < TY + POT_Y + potLevel()) fallDrop.visible = false; }
    // термометър
    const th = thermo.userData;
    th.cur += (th.target - th.cur) * Math.min(1, dt * 1.5);
    drawThermo();
    // чайникът ври и пуска пара
    kSteam.forEach((p) => {
      const k = (t * 0.45 + p.userData.ph) % 1;
      p.position.set(3.3 + 0.48 + k * 0.25 + Math.sin(t * 3 + p.userData.ph * 9) * 0.03, TY + 0.6 + k * 0.9, -0.35);
      p.material.opacity = 0.6 * Math.sin(k * Math.PI) * (k > 0.08 ? 1 : 0.2);
      p.scale.setScalar(0.12 + k * 0.45);
    });
    kLed.material.color.setHSL(0, 1, 0.55 + Math.sin(t * 4) * 0.1);
    // ледът в купата бавно се топи (капчици блещукат)
    bowlIce.forEach((c, i) => { c.rotation.y += dt * 0.02 * (i % 2 ? 1 : -1); });
    bowlW.scale.set(1, 1 + Math.sin(t * 1.5) * 0.08, 1);
    // Мира диша и мига
    torso.scale.set(1 + Math.sin(t * 2.2) * 0.012, 1, 1 + Math.sin(t * 2.2) * 0.012);
    head.rotation.y = Math.sin(t * 0.5) * 0.25;
    const blink = (t % 3.7) < 0.12 ? 0.15 : 1;
    eyes.forEach((e) => { e.scale.y = blink; });
    kidArm.rotation.z += (armTarget - kidArm.rotation.z) * Math.min(1, dt * 5);
    // фризер: вратата и мразовит въздух
    fDoorPivot.rotation.y += (-freezerOpen * 1.6 - fDoorPivot.rotation.y) * Math.min(1, dt * 4);
    frost.forEach((p) => {
      const k = (t * 0.4 + p.userData.ph) % 1;
      p.position.set(-0.4 + p.userData.ph * 0.8, 1.9 - k * 0.6, 0.65 + k * 0.4);
      p.material.opacity = freezerOpen * 0.5 * Math.sin(k * Math.PI);
    });
    // облак и часовник
    cloud.position.x = WX - 0.5 + Math.sin(t * 0.12) * 0.35;
    hS.rotation.z = -t * 1.0;
    hM.rotation.z = -t * 0.02 - 1;
    sunM.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05);
  });

  // ---------- изглед и балончета ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.28, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.08;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, dur);
  }
  const overview = () => (narrow ? measureView() : fitView([-0.5, 1.5, 0], 6.2, 1.6, 0.22));
  const measureView = () => (narrow ? fitView([-2.0, 1.5, 0.2], 1.85, 1.35, 0.2) : fitView([-2.0, 1.6, 0.2], 2.2, 1.25, 0.2));
  const potView = () => (narrow ? fitView([PXp, TY + 0.95, 0.1], 1.05, 1.1, 0.3) : fitView([PXp, TY + 0.95, 0.1], 1.5, 1.05, 0.3));
  const VIEWS = {
    thermo: [-1.05, 1.7, -0.4], glass: [-1.7, 1.25, 0.15], ice: [-0.55, 1.15, 0.2], kettle: [3.4, 1.5, -0.3],
    pot: [PXp, 1.35, 0], freezer: [FX, 1.7, 0.1], kid: [KX, 1.2, 0.45],
  };
  const partView = (id) => {
    const v = VIEWS[id];
    const big = id === 'freezer' || id === 'kid' || id === 'thermo';
    fitView(v, narrow ? (big ? 1.2 : 0.9) : big ? 1.6 : 1.3, big ? 1.2 : 0.75, 0.22);
  };
  let tip = null;
  function say(anchor, html, cls = '', lift = 0.5) {
    if (tip) tip.remove();
    if (narrowUI()) cls = cls.replace('wide', '');
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const LIFT = { thermo: 1.45, glass: 0.6, ice: 0.4, kettle: 1.4, pot: 0.9, freezer: 2.5, kid: 1.95 };

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  stage.onHover(() => {});

  function choiceBox(c, q, items, rightIdx, why, onRight, onWrong, cls = '') {
    c.innerHTML = `<p class="waterstates-q">${esc(q)}</p><div class="choices ${cls}">${items.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
    let wrong = 0;
    c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i !== rightIdx) {
        wrong++;
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(typeof why === 'function' ? why(i, wrong) : (why[i] || 'Не е това. Помисли пак.'), 'bad');
        if (onWrong) onWrong();
        return;
      }
      b.classList.add('right');
      c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      onRight();
    }));
  }

  // ---------- 1. Опознай ----------
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Разгледай',
    items: PARTS.map((p) => ({ id: p.id, label: p.label, icon: p.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  function step1() {
    shell.step(0);
    const seen = new Set();
    shell.task(`<p>Водата може да бъде в три състояния: <b>твърдо</b> (лед), <b>течно</b> (вода) и <b>газообразно</b> (водни пари). Кое състояние е тя, зависи от <b>температурата</b>.</p>
      <p><b>Разгледай кухнята:</b> кликни върху предметите или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата кухня</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${PARTS.length}`);
    upd();
    const visit = (id) => {
      const p = PART[id];
      partView(id);
      const anchor = { thermo, glass, ice: bowl, kettle, pot: potG, freezer: fridge, kid }[id];
      say(anchor, `<b>${esc(p.icon)}</b> ${p.note}`, 'wide', LIFT[id]);
      freezerOpen = id === 'freezer' ? 1 : 0;
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === PARTS.length) { next.disabled = false; shell.msg('Разгледа всичко! Продължи напред.', 'good'); }
    };
    clickHandler = (id) => {
      if (id === 'hook') id = null;
      if (id === 'lid') id = 'pot';
      if (!id || !PART[id]) { clearTip(); return; }
      visit(id);
    };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); menu.show(false); clearTip(); freezerOpen = 0; step2(); });
    overview();
  }

  // ---------- 2. Измери ----------
  function step2() {
    shell.step(1);
    let mistakes = 0;
    measureView();
    const results = [];
    const M = [
      { id: 'glass', what: 'водата в чашата', subj: 'Водата в чашата', ask: 'Сложи термометъра в <b>чашата с вода</b> — кликни върху чашата.', value: T_WATER, kind: 'lab' },
      { id: 'hook', what: 'въздуха в стаята', subj: 'Въздухът в стаята', ask: 'Измери температурата на <b>въздуха</b>. Закачи термометъра на <b>кукичката на стената</b> — кликни върху нея.', value: T_AIR, kind: 'lab' },
      { id: 'kid', what: 'тялото на Мира', subj: 'Тялото на Мира', ask: 'Измери <b>телесната температура</b> на Мира с медицинския термометър — кликни върху Мира.', value: T_BODY, kind: 'med' },
    ];
    let mi = 0;
    const tbl = () => (results.length ? `<table class="waterstates-tbl">${results.map(([w, v]) => `<tr><td>${esc(w)}</td><td>${fmt(v)} °C</td></tr>`).join('')}</table>` : '');
    const upd = () => shell.score(`Измерени: ${results.length} от ${M.length} · грешки: ${mistakes}`);
    const askNext = () => {
      const m = M[mi];
      shell.task(`<p>${m.ask}</p>${tbl()}`);
      shell.setControls('');
      upd();
      const hint = m.id === 'hook' ? hook : m.id === 'glass' ? glass : kid;
      say(hint, '👆 Тук', '', m.id === 'kid' ? 1.95 : m.id === 'hook' ? 0.2 : 0.65);
      let busy = false;
      clickHandler = async (id) => {
        if (busy) return;
        if (id !== m.id) {
          if (id) shell.msg(m.id === 'kid' ? 'Кликни върху Мира.' : m.id === 'glass' ? 'Кликни върху чашата с вода.' : 'Кликни върху кукичката на стената.', '');
          return;
        }
        busy = true;
        clickHandler = null;
        clearTip();
        shell.msg('');
        if (m.kind === 'lab') {
          if (m.id === 'glass') await hop(thermo, new V3(-1.7 + 0.04, TY + 0.04, 0.15), 0.8, 0.5, [0, 0, -0.12]);
          else await hop(thermo, new V3(-0.3, 2.75 - 1.36, -1.0), 0.9, 0.4, [0, 0, 0]);
          thermo.userData.target = m.value;
          say(thermo, '⏳ Изчакай стълбчето да спре…', '', 1.45);
          await wait(2.4);
        } else {
          armTarget = 0.9;
          await hop(med, new V3(KX + 0.22, 1.12, 0.47), 0.8, 0.3, [0, 0, 0.6]);
          armTarget = 0.18;
          say(kid, '⏳ Медицинският термометър се държи под мишницата няколко минути…', '', 1.95);
          await wait(2.2);
        }
        clearTip();
        readout(m);
      };
    };
    const readout = (m) => {
      let wrongHere = 0;
      const svg = m.kind === 'lab' ? svgThermo(0, 40, 1, 10, m.value, 'Скалата отблизо') : svgThermo(35, 38, 0.1, 1, m.value, 'Медицински термометър');
      shell.task(`<p>Колко градуса показва термометърът за <b>${esc(m.what)}</b>?</p>
        <div class="waterstates-meas">${svg}<div><p class="small">${m.kind === 'lab' ? 'Виж края на червения стълб. Числата са през 10 °C.' : 'Числата са през 1 °C. Има по 10 малки чертички между тях.'}</p>
        <div class="waterstates-in"><input type="text" inputmode="decimal" aria-label="Температура в градуси" autocomplete="off"><b>°C</b></div>
        <button class="btn primary chk" style="margin-top:8px">Провери</button></div></div>${tbl()}`);
      const inp = container.querySelector('.waterstates-in input');
      const chk = container.querySelector('.chk');
      const check = () => {
        const v = parseFloat(String(inp.value).replace(',', '.').replace('−', '-'));
        if (Number.isNaN(v)) { shell.msg('Напиши число.', 'bad'); return; }
        if (Math.abs(v - m.value) < 0.05) {
          shell.msg(m.kind === 'med' ? 'Вярно! 36,6 °C — нормална телесна температура. Ако е над 37 °C, човек е болен и има температура.' : `Вярно! ${m.subj}: ${fmt(m.value)} °C.`, 'good');
          return done();
        }
        mistakes++; wrongHere++;
        upd();
        if (wrongHere >= 3) {
          shell.msg(`Термометърът показва ${fmt(m.value)} °C. Виж: край на стълба, после брой чертичките от последното число.`, 'bad');
          return done();
        }
        const dir = v > m.value ? 'по-малко' : 'по-голямо';
        shell.msg(wrongHere >= 2
          ? `Подсказка: всяка малка чертичка е ${m.kind === 'med' ? '0,1' : '1'} °C. Намери последното число под края на стълба и брой чертичките нагоре.`
          : `Не е точно — показанието е ${dir} от ${fmt(v)}. Погледни внимателно къде свършва червеният стълб.`, 'bad');
      };
      chk.addEventListener('click', check);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      const done = () => {
        chk.disabled = true; inp.disabled = true;
        results.push([m.subj, m.value]);
        upd();
        mi++;
        const last = mi >= M.length;
        const c = shell.setControls(`<button class="btn primary">${last ? 'Напред →' : 'Следващо измерване →'}</button>`);
        c.querySelector('button').addEventListener('click', async () => {
          shell.msg('');
          if (m.kind === 'med') { med.position.copy(MED_HOME); med.rotation.set(0, 0, Math.PI / 2); }
          if (!last) { askNext(); return; }
          scores.push(stepScore(mistakes, 3));
          clickHandler = null;
          hop(thermo, TH_HOME, 0.6, 0.4, [0, 0, 0]).then(() => { thermo.userData.target = T_AIR; });
          step3();
        });
      };
    };
    askNext();
  }

  // ---------- 3. Промени състоянието ----------
  function step3() {
    shell.step(2);
    clickHandler = null;
    let mistakes = 0;
    potView();
    potTag = stage.bubble(potG, '', { lift: 1.0, cls: 'tag' });
    const upd = () => shell.score(`Грешки: ${mistakes}`);
    upd();
    const ctl = (html) => `<div class="waterstates-slot"></div>
      <label class="small" for="waterstates-t"><b>Котлон:</b> охлажда ← → нагрява</label>
      <input id="waterstates-t" type="range" class="waterstates-range" min="-10" max="100" step="1" value="${W.target}" aria-label="Температура на котлона">
      <div class="waterstates-scale"><span>−10 °C</span><span>0 °C</span><span>50 °C</span><span>100 °C</span></div>${html || ''}`;
    const c = shell.setControls(ctl());
    const rng = c.querySelector('.waterstates-range');
    rng.addEventListener('input', () => { W.target = +rng.value; });
    const slot = c.querySelector('.waterstates-slot');
    const nameIt = (rightIdx, then) => {
      choiceBox(slot, 'Как се нарича тази промяна?', NAMES, rightIdx, (i, n) => (n >= 2 ? `Подсказка: ${DEF[rightIdx]}` : `Не е това. ${DEF[i]} Какво се случи тук?`), then, () => { mistakes++; upd(); }, 'waterstates-names');
    };
    const tempQ = (q, items, right, why, then) => {
      choiceBox(slot, q, items, right, why, then, () => { mistakes++; upd(); });
    };

    // а) топене
    shell.task('<p>В тенджерата има <b>лед</b> от фризера, −10 °C.</p><p><b>Плъзни котлона надясно</b> — над 0 °C — и гледай какво става с леда.</p>');
    say(potG, '🧊 Лед, −10 °C', '', 1.05);
    (async () => {
      await until(() => W.T >= 0 && W.ice < 0.9);
      say(potG, 'Ледът се топи! Термометърът показва 0 °C, докато има лед.', '', 1.05);
      await until(() => W.ice === 0);
      say(potG, '💧 Ледът се превърна във <b>вода</b>.', 'good', 1.05);
      shell.task('<p>Ледът се превърна във вода.</p>');
      nameIt(0, () => {
        shell.msg('Вярно! Това е топене.', 'good');
        tempQ('При каква температура се топи ледът?', ['0 °C', '36,6 °C', '100 °C'], 0,
          ['', 'Това е телесната температура. Ледът се топи още при по-ниска температура.', 'При 100 °C водата кипи. Ледът се топи много по-рано.'],
          () => { shell.msg('Вярно! Ледът се топи при 0 °C.', 'good'); boilTask(); });
      });
    })();

    // б) изпарение
    async function boilTask() {
      slot.innerHTML = '';
      shell.task('<p>Сега <b>нагрей водата до 100 °C</b> — плъзни котлона докрай надясно.</p>');
      await until(() => W.boil > 1.8);
      say(potG, '♨️ Водата кипи и се превръща във <b>водни пари</b>.', 'good', 1.05);
      shell.task('<p>Водата кипи. Мехурчетата вътре са водни пари. Те излизат от водата.</p>');
      nameIt(2, () => {
        shell.msg('Вярно! Това е изпарение. При кипене водата се изпарява най-бързо.', 'good');
        tempQ('При колко градуса кипи водата?', ['0 °C', '36,6 °C', '100 °C'], 2,
          ['При 0 °C водата замръзва или ледът се топи.', 'Това е телесната температура. Водата кипи при много по-висока.', ''],
          () => { shell.msg('Вярно! Водата кипи при 100 °C.', 'good'); lidTask(); });
      });
    }

    // в) втечняване
    function lidTask() {
      slot.innerHTML = '<button class="btn primary lidb">🥘 Задръж студения капак над парата</button>';
      shell.task('<p>Водата още кипи. Какво ще стане, ако задържим <b>студен капак</b> над парата?</p>');
      clearTip();
      slot.querySelector('.lidb').addEventListener('click', async (e) => {
        e.target.disabled = true;
        if (W.target < 100) { W.target = 100; rng.value = 100; }
        await hop(lid, LID_UP, 0.9, 0.3, [-0.6, 0, 0]);
        W.lidOn = true;
        await until(() => W.cond > 0.75);
        say(lid, '💧 По студения капак се събраха капки вода!', 'good', 0.35);
        shell.task('<p>Водните пари стигнаха до студения капак и се превърнаха в капки вода.</p>');
        nameIt(3, () => { shell.msg('Вярно! Това е втечняване — парите отново станаха вода.', 'good'); freezeTask(); });
      });
    }

    // г) замръзване
    async function freezeTask() {
      await wait(1.2);
      clearTip();
      W.lidOn = false;
      await hop(lid, LID_HOME, 0.8, 0.3, [0, 0, 0]);
      W.cond = 0;
      slot.innerHTML = '';
      shell.task('<p>Накрая <b>охлади водата под 0 °C</b> — плъзни котлона докрай наляво.</p>');
      await until(() => W.ice > 0.98 && W.form === 'block');
      say(potG, '🧊 Водата замръзна. Виж — ледът е <b>по-високо</b>, отколкото беше водата!', 'good', 1.05);
      shell.task('<p>Водата се превърна в лед.</p>');
      nameIt(1, () => {
        shell.msg('Вярно! Това е замръзване. Водата замръзва при 0 °C, а ледът заема повече място от водата.', 'good');
        const c2 = shell.setControls('<button class="btn primary">Напред →</button>');
        c2.querySelector('button').addEventListener('click', () => {
          scores.push(stepScore(mistakes, 3));
          clearTip(); shell.msg(''); step4();
        });
      });
    }
  }

  // ---------- 4. Приложи ----------
  function step4() {
    shell.step(3);
    if (potTag) { potTag.remove(); potTag = null; }
    let good = 0;
    // локва на перваза под прозореца
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), liquidMat(0x64b5f6, 0.8));
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(WX, TY + 0.005, -0.5);
    puddle.scale.set(1, 0.7, 1);
    scene.add(puddle);
    const QS = [
      { q: 'Защо капакът на тенджера с вряща вода се намокря отвътре?', view: 'pot',
        a: ['Водата от тенджерата пръска и мокри капака.', 'Водните пари стигат до по-студения капак и се втечняват на капки.', 'Капакът се топи от топлината.'], right: 1,
        explain: 'Парите се втечняват, когато стигнат до нещо по-студено.' },
      { q: 'Мира разля малко вода на масата до прозореца, на слънце. След час водата я нямаше. Къде отиде? Така изчезват и локвите след дъжд.', view: 'win',
        a: ['Изпари се — превърна се във водни пари във въздуха.', 'Замръзна.', 'Втечни се.'], right: 0,
        explain: 'Водата се изпарява и при обикновена температура, а на слънце — по-бързо.' },
      { q: 'Пълна догоре стъклена бутилка с вода остана във фризера. Тя се спука! Защо?', view: 'freezer',
        a: ['Във фризера е горещо.', 'Водата се изпари и избута тапата.', 'Водата замръзна, а ледът заема повече място от водата.'], right: 2,
        explain: 'При замръзване водата се разширява. Ледът няма място и пука бутилката.' },
    ];
    let qi = 0;
    const show = async (Q) => {
      if (Q.view === 'pot') {
        potView();
        // водата в тенджерата отново е затоплена (без да чакаме леда да се стопи)
        W.ice = 0; W.form = 'block'; W.T = Math.max(W.T, 85);
        W.target = 100;
        await until(() => W.boil > 0.5);
        await hop(lid, LID_UP, 0.8, 0.3, [-0.6, 0, 0]);
        W.lidOn = true;
        await until(() => W.cond > 0.75);
        say(lid, '💧 Парите се втечняват по студения капак.', 'good', 0.35);
      } else if (Q.view === 'win') {
        fitView([WX, TY + 0.6, -0.3], narrow ? 0.9 : 1.3, 0.85, 0.35);
        const wisps = [];
        for (let i = 0; i < 6; i++) { const p = puffSprite(0xe3f2fd, 0, 0.2); scene.add(p); wisps.push(p); }
        await phase(4, (k, dt, t) => {
          puddle.scale.set(Math.max(0.001, 1 - k), Math.max(0.001, 0.7 * (1 - k)), 1);
          wisps.forEach((p, i) => {
            const u = (t * 0.5 + i / 6) % 1;
            p.position.set(WX + Math.sin(i * 2) * 0.2, TY + 0.05 + u * 0.7, -0.5 + Math.cos(i * 2) * 0.1);
            p.material.opacity = 0.35 * Math.sin(u * Math.PI) * (1 - k);
          });
        });
        puddle.visible = false;
        say(puddle, '☀️ Водата се изпари.', 'good', 0.3);
      } else {
        fitView([FX, 1.95, 0.3], narrow ? 0.8 : 1.0, 0.65, 0.15);
        freezerOpen = 1;
        bottle.visible = true;
        await wait(1);
        const w0 = new THREE.Color(0x64b5f6); const w1 = new THREE.Color(0xe1f5fe);
        plug.visible = true;
        await phase(2.5, (k) => {
          bWaterM.color.copy(w0).lerp(w1, k);
          bWaterM.opacity = lerp(0.75, 0.95, k);
          plug.scale.y = Math.max(0.001, 0.09 * k);
          plug.position.y = 0.5 + plug.scale.y / 2;
          crackM.opacity = clamp01((k - 0.6) / 0.4);
        });
        say(bottle, '🧊 Ледът не се побра и бутилката се спука!', 'good', 0.75);
      }
    };
    const ask = () => {
      const Q = QS[qi];
      clearTip();
      shell.msg('');
      shell.task(`<p>Приложи наученото (${qi + 1} от ${QS.length}).</p><div class="waterstates-p"></div>`);
      shell.setControls('');
      shell.score('');
      const bx = container.querySelector('.waterstates-p');
      bx.innerHTML = `<p class="waterstates-q">${esc(Q.q)}</p><div class="choices">${Q.a.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
      bx.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', async () => {
        const i = +b.dataset.i;
        bx.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        const ok = i === Q.right;
        if (ok) good++;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) bx.querySelector(`.choice[data-i="${Q.right}"]`).classList.add('right');
        shell.msg((ok ? 'Вярно! ' : 'Не е така. ') + Q.explain, ok ? 'good' : 'bad');
        try { shell.stageEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* няма значение */ }
        await show(Q);
        qi++;
        const last = qi >= QS.length;
        const c = shell.setControls(`<button class="btn primary">${last ? 'Виж резултата' : 'Следващ въпрос →'}</button>`);
        c.querySelector('button').addEventListener('click', async () => {
          if (Q.view === 'pot') { W.lidOn = false; hop(lid, LID_HOME, 0.6, 0.3, [0, 0, 0]); }
          if (Q.view === 'freezer') freezerOpen = 0;
          if (!last) { ask(); return; }
          clearTip();
          scores.push(good / QS.length);
          const ratio = scores.reduce((x, y) => x + y, 0) / scores.length;
          shell.finish(ratio, onComplete, restart);
        });
      }));
    };
    ask();
  }

  step1();
  return {
    dispose() {
      menu.remove();
      stage.dispose();
    },
  };
}
