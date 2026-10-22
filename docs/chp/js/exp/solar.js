// 4.2.6 „Земята, Слънцето, Луната и планетите“ — 3D Слънчева система.
// Стъпки: опознай → ден и нощ → една година → подреди планетите и пренеси знанието.
import { createStage, labelSprite, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const CSS = `
.so-read { display: flex; flex-wrap: wrap; gap: 6px 14px; font-weight: 800; background: #0f1a33; color: #fff; border-radius: 8px; padding: 8px 10px; margin-top: 6px; }
.so-read b { color: #ffd54a; }
.so-lbl { display: block; font-weight: 700; margin-top: 6px; }
.so-lbl output { float: right; font-weight: 900; color: #1865f2; }
.xp-task .so-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.xp-task .so-chips .chip { font: inherit; font-weight: 700; cursor: pointer; }
.xp-task .so-chips .chip.right { pointer-events: none; }
.xp-task .so-chips .chip.wrong { animation: so-shake 0.35s; }
@keyframes so-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.xp-task .choices.so-q { margin-top: 6px; }
`;
function injectCss() {
  if (document.getElementById('so-style')) return;
  const s = document.createElement('style');
  s.id = 'so-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// Не в истински мащаб: размерите и разстоянията са избрани, за да се вижда всичко.
const PLANETS = [
  { id: 'mercury', label: 'Меркурий', icon: '🪨', r: 0.264, d: 4.0, period: 88, ph: 1.0,
    note: 'Първата планета — най-близо до Слънцето и най-малката. Обикаля Слънцето най-бързо: за 88 денонощия.' },
  { id: 'venus', label: 'Венера', icon: '🟡', r: 0.432, d: 5.4, period: 225, ph: 2.6,
    note: 'Втората планета. Обвита е в гъсти облаци и е най-горещата планета. Вечер или сутрин се вижда като много ярка точка — но не е звезда.' },
  { id: 'earth', label: 'Земя', icon: '🌍', r: 0.504, d: 7.2, period: 365.25, ph: 0.4,
    note: 'Третата планета — нашият дом. Има форма на кълбо. Върти се около оста си и обикаля около Слънцето. Само на нея знаем, че има живот.' },
  { id: 'mars', label: 'Марс', icon: '🔴', r: 0.36, d: 9.2, period: 687, ph: 4.2,
    note: 'Четвъртата планета — „червената планета“. Червеният цвят идва от ръждивия прах по повърхността ѝ.' },
  { id: 'jupiter', label: 'Юпитер', icon: '🟠', r: 1.2, d: 12.2, period: 4333, ph: 5.3,
    note: 'Петата и най-голямата планета. Огромно кълбо от газове с ивици и Голямо червено петно — буря, по-голяма от Земята.' },
  { id: 'saturn', label: 'Сатурн', icon: '🪐', r: 1.02, d: 15.6, period: 10759, ph: 2.0,
    note: 'Шестата планета. Има красиви пръстени от лед и камъчета.' },
  { id: 'uranus', label: 'Уран', icon: '🔵', r: 0.72, d: 18.6, period: 30687, ph: 3.4,
    note: 'Седмата планета. Студена, синьо-зелена. Върти се, сякаш е „легнала“ на една страна.' },
  { id: 'neptune', label: 'Нептун', icon: '🔷', r: 0.696, d: 21.4, period: 60190, ph: 0.2,
    note: 'Осмата и най-далечната планета. Много студена и ветровита, тъмносиня.' },
];
const SUN_NOTE = 'Слънцето е звезда — огромно горещо кълбо от газове. То само излъчва светлина и топлина. Без него на Земята няма да има живот.';
const MOON_NOTE = 'Луната е естественият спътник на Земята. Обикаля около нея за около един месец. Не свети сама — отразява светлината на Слънцето.';
const byId = Object.fromEntries(PLANETS.map((p) => [p.id, p]));
const BG = { lat: 42.7, lon: 25.5 };
const TILT = THREE.MathUtils.degToRad(23.4);
const D2R = Math.PI / 180;

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
// Точка от земното кълбо по географска ширина и дължина (както я рисува текстурата на сферата).
function latLon(lat, lon, r = 1) {
  const a = lat * D2R, b = lon * D2R;
  return new THREE.Vector3(Math.cos(a) * Math.cos(b) * r, Math.sin(a) * r, -Math.cos(a) * Math.sin(b) * r);
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
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
function bandsTex(cols, seed, extra) {
  const R = rng(seed);
  return canvasTex(256, 128, (ctx, w, h) => {
    let y = 0;
    while (y < h) {
      const bh = 4 + R() * 12;
      ctx.fillStyle = cols[Math.floor(R() * cols.length)];
      ctx.fillRect(0, y, w, bh + 1);
      y += bh;
    }
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = cols[Math.floor(R() * cols.length)];
      ctx.fillRect(R() * w, R() * h, 20 + R() * 60, 2 + R() * 3);
    }
    ctx.globalAlpha = 1;
    if (extra) extra(ctx, w, h);
  });
}
function rockyTex(base, spot, seed, n = 70) {
  const R = rng(seed);
  return canvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = spot;
      ctx.globalAlpha = 0.15 + R() * 0.35;
      ctx.beginPath();
      ctx.ellipse(R() * w, h * 0.1 + R() * h * 0.8, 2 + R() * 9, 2 + R() * 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

// Приблизителни очертания на континентите (дължина, ширина).
const LAND = [
  [[-168, 66], [-140, 70], [-110, 72], [-85, 70], [-75, 62], [-60, 55], [-66, 45], [-75, 38], [-81, 31], [-80, 25], [-90, 29], [-97, 26], [-97, 20], [-87, 16], [-83, 9], [-79, 8], [-92, 15], [-105, 20], [-112, 30], [-118, 34], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60]],
  [[-50, 60], [-40, 65], [-22, 70], [-20, 80], [-40, 83], [-60, 80], [-72, 77], [-55, 70]],
  [[-80, 8], [-72, 12], [-60, 10], [-50, 0], [-35, -6], [-38, -15], [-41, -22], [-48, -26], [-58, -38], [-65, -42], [-68, -52], [-74, -52], [-72, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0]],
  [[-10, 36], [-9, 43], [-2, 44], [-4, 48], [2, 51], [8, 54], [8, 57], [5, 60], [10, 63], [15, 68], [25, 71], [40, 68], [45, 60], [40, 48], [30, 46], [28, 41], [23, 38], [20, 40], [15, 38], [12, 44], [8, 44], [3, 43], [-1, 37]],
  [[26, 40], [36, 36], [35, 30], [44, 12], [52, 15], [57, 23], [62, 25], [67, 24], [72, 20], [77, 8], [80, 15], [88, 22], [92, 22], [98, 16], [100, 13], [104, 10], [106, 20], [110, 21], [118, 24], [122, 30], [120, 38], [126, 40], [130, 43], [140, 50], [143, 60], [160, 62], [170, 66], [180, 68], [180, 72], [140, 74], [110, 77], [80, 73], [68, 70], [55, 68], [45, 66], [40, 64], [40, 48], [50, 45], [50, 38], [40, 40]],
  [[-17, 15], [-17, 21], [-10, 30], [-6, 35], [10, 37], [20, 32], [32, 31], [34, 28], [43, 12], [51, 12], [48, 4], [40, -5], [40, -15], [35, -24], [32, -29], [20, -35], [17, -30], [12, -16], [13, -6], [9, 4], [0, 5], [-8, 4], [-14, 10]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [140, -38], [132, -32], [117, -35], [114, -30]],
  [[-5, 50], [1, 51], [0, 53], [-3, 56], [-5, 58], [-6, 55], [-3, 54]],
  [[130, 31], [135, 34], [140, 36], [142, 40], [141, 44], [138, 38], [132, 33]],
  [[95, 5], [105, -6], [115, -8], [120, -4], [118, 2], [110, 2], [100, 2]],
  [[44, -16], [50, -14], [50, -24], [45, -25]],
];
function earthTex() {
  return canvasTex(1024, 512, (ctx, w, h) => {
    const X = (lon) => ((lon + 180) / 360) * w;
    const Y = (lat) => ((90 - lat) / 180) * h;
    const sea = ctx.createLinearGradient(0, 0, 0, h);
    sea.addColorStop(0, '#2a5d9c'); sea.addColorStop(0.5, '#1f6fc4'); sea.addColorStop(1, '#2a5d9c');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, w, h);
    ctx.lineJoin = 'round';
    for (const poly of LAND) {
      ctx.beginPath();
      poly.forEach(([lo, la], i) => (i ? ctx.lineTo(X(lo), Y(la)) : ctx.moveTo(X(lo), Y(la))));
      ctx.closePath();
      ctx.fillStyle = '#4f9a45';
      ctx.fill();
      ctx.strokeStyle = '#7bb663';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // Пустини и планини (петна).
    const R = rng(5);
    ctx.globalAlpha = 0.55;
    for (const [lo, la, rx, ry, c] of [[15, 23, 28, 9, '#d8c17a'], [45, 23, 10, 8, '#d8c17a'], [130, -25, 12, 7, '#c9a86a'], [-110, 38, 8, 6, '#a58d5f'], [90, 32, 16, 5, '#8f7f6a'], [-68, -25, 4, 14, '#8f7f6a']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(X(lo), Y(la), (rx / 360) * w, (ry / 180) * h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Полярни шапки.
    ctx.fillStyle = '#f2f7fb';
    ctx.fillRect(0, Y(-68), w, h - Y(-68));
    ctx.fillRect(0, 0, w, Y(82));
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.ellipse(R() * w, Y(-66 - R() * 4), 10 + R() * 20, 4 + R() * 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
function cloudsTex() {
  const R = rng(11);
  return canvasTex(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 130; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.08 + R() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(R() * w, h * 0.12 + R() * h * 0.76, 12 + R() * 34, 1.5 + R() * 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
function ringTex() {
  return canvasTex(256, 4, (ctx, w, h) => {
    const R = rng(3);
    for (let x = 0; x < w; x++) {
      const a = (x < 40 ? 0.25 : x > 130 && x < 145 ? 0.08 : 0.55 + R() * 0.35) * (x > 235 ? (w - x) / 21 : 1);
      ctx.fillStyle = `rgba(${215 + R() * 25},${190 + R() * 20},${140 + R() * 20},${a})`;
      ctx.fillRect(x, 0, 1, h);
    }
  });
}

export function mount(container, { onComplete }) {
  injectCss();
  const STEPS = ['Опознай Слънчевата система', 'Ден и нощ', 'Една година', 'Подреди планетите'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0x050816, camPos: [0, 22, 34], target: [0, 0, 0],
    minDistance: 1.4, maxDistance: 70, maxPolarAngle: Math.PI * 0.8,
  });
  const { scene, camera } = stage;
  stage.onHover(() => {});
  stage.sun.intensity = 0;
  stage.hemi.intensity = 0.16;
  stage.hemi.color.set(0x8899cc);
  stage.hemi.groundColor.set(0x223355);
  const light = new THREE.PointLight(0xfff3dd, 3.0, 0, 0);
  scene.add(light);
  const R = rng(9);

  // ---------- звезди ----------
  const sPos = [], sCol = [];
  const cc = new THREE.Color();
  for (let i = 0; i < 1800; i++) {
    const u = R() * 2 - 1, a = R() * Math.PI * 2, rr = 80 + R() * 20;
    const s = Math.sqrt(1 - u * u);
    sPos.push(Math.cos(a) * s * rr, u * rr, Math.sin(a) * s * rr);
    cc.setHSL(0.55 + R() * 0.15 - (R() < 0.2 ? 0.5 : 0), 0.5, 0.65 + R() * 0.35);
    sCol.push(cc.r, cc.g, cc.b);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
  starGeo.setAttribute('color', new THREE.Float32BufferAttribute(sCol, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, sizeAttenuation: true, depthWrite: false }));
  stars.raycast = () => {};
  scene.add(stars);

  // ---------- Слънце ----------
  const sunG = new THREE.Group();
  const sunTex = canvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffb21e';
    ctx.fillRect(0, 0, w, h);
    const r2 = rng(21);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = r2() < 0.5 ? 'rgba(255,235,140,0.3)' : 'rgba(235,120,20,0.22)';
      ctx.beginPath();
      ctx.arc(r2() * w, r2() * h, 0.8 + r2() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(2.0, 40, 24), new THREE.MeshBasicMaterial({ map: sunTex }));
  const glowA = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,240,180,0.95)'], [0.3, 'rgba(255,190,60,0.55)'], [1, 'rgba(255,120,0,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glowA.scale.set(9, 9, 1);
  const glowB = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,220,140,0.5)'], [0.5, 'rgba(255,150,40,0.15)'], [1, 'rgba(255,100,0,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glowB.scale.set(15, 15, 1);
  glowA.raycast = () => {}; glowB.raycast = () => {};
  sunG.add(glowB, glowA, sunBall);
  sunG.userData.pickId = 'sun';
  scene.add(sunG);
  addHitBox(sunG, 4);

  const labelStyle = { size: 0.36, color: '#ffffff', bg: 'rgba(16,28,60,0.85)', border: '#6b7fb0' };
  // Етикетите пазят еднакъв размер на екрана (около 17 пиксела височина), колкото и далеч да е камерата.
  const fixedLabels = new Set();
  function fixLabel(s, px = 17) {
    s.userData.aspect = s.scale.x / s.scale.y;
    s.userData.px = px;
    fixedLabels.add(s);
  }
  function addLabel(parent, text, y, size = 0.36, px = 17) {
    const s = labelSprite(text, { ...labelStyle, size });
    s.position.y = y;
    parent.add(s);
    fixLabel(s, px);
    return s;
  }
  const lblTmp = new THREE.Vector3();
  stage.tick(() => {
    const H = shell.stageEl.clientHeight || 520;
    const k = (2 * Math.tan((camera.fov * Math.PI) / 360)) / H;
    for (const s of fixedLabels) {
      s.getWorldPosition(lblTmp);
      const h = camera.position.distanceTo(lblTmp) * k * s.userData.px;
      s.scale.set(h * s.userData.aspect, h, 1);
    }
  });
  addLabel(sunG, 'Слънце', -2.75, 0.42, 19);

  // ---------- планети ----------
  const roots = new Map();
  const TEX = {
    mercury: () => rockyTex('#9b958d', '#5f5a55', 31, 90),
    venus: () => bandsTex(['#e8cf8f', '#d9b874', '#f0dca8', '#cfae6a'], 32),
    mars: () => rockyTex('#c1562c', '#7a2f17', 34, 60),
    jupiter: () => bandsTex(['#d8b48a', '#c4936a', '#efdcc0', '#a97852', '#e6c9a2'], 35, (ctx, w, h) => {
      ctx.fillStyle = '#b5482c';
      ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.66, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
    }),
    saturn: () => bandsTex(['#e7d3a1', '#d6bd84', '#f0e2bc', '#c9ad72'], 36),
    uranus: () => bandsTex(['#9fe0e6', '#a9e6ea', '#93d6de'], 37),
    neptune: () => bandsTex(['#3f63d6', '#3557c4', '#4b74e6', '#2c49a8'], 38),
  };
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x5b6f9c, transparent: true, opacity: 0.45 });
  const orbitLines = [];
  function circlePts(r, n = 160) { return Array.from({ length: n }, (_, i) => new THREE.Vector3(Math.cos((i / n) * Math.PI * 2) * r, 0, -Math.sin((i / n) * Math.PI * 2) * r)); }
  let earth = null;
  for (const p of PLANETS) {
    const ol = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circlePts(p.d)), orbitMat);
    ol.raycast = () => {};
    scene.add(ol);
    orbitLines.push(ol);
    const g = new THREE.Group();
    g.userData.pickId = p.id;
    let body;
    if (p.id === 'earth') {
      const tilt = new THREE.Group();
      tilt.rotation.z = -TILT;
      const spin = new THREE.Group();
      const ball = new THREE.Mesh(new THREE.SphereGeometry(p.r, 48, 32), new THREE.MeshStandardMaterial({ map: earthTex(), roughness: 0.85 }));
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(p.r * 1.025, 40, 24), new THREE.MeshStandardMaterial({ map: cloudsTex(), transparent: true, depthWrite: false, roughness: 1 }));
      spin.add(ball, clouds);
      // Знаме-кабърче за България.
      const n = latLon(BG.lat, BG.lon);
      const pin = new THREE.Group();
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      stick.position.y = 0.06;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff2d2d }));
      head.position.y = 0.13;
      pin.add(stick, head);
      pin.position.copy(n).multiplyScalar(p.r);
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      spin.add(pin);
      const bgLabel = labelSprite('България', { size: 0.075, color: '#fff', bg: '#d92916', border: '#ffffff' });
      bgLabel.position.copy(n).multiplyScalar(p.r + 0.2);
      spin.add(bgLabel);
      fixLabel(bgLabel, 16);
      const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, p.r * 3, 6), new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0.8 }));
      tilt.add(spin, axis);
      g.add(tilt);
      body = ball;
      earth = { g, tilt, spin, clouds, pin, bgLabel, axis, ball, spinA: 0 };
    } else {
      const m = new THREE.MeshStandardMaterial({ map: TEX[p.id](), roughness: 0.9 });
      body = new THREE.Mesh(new THREE.SphereGeometry(p.r, 36, 24), m);
      if (p.id === 'uranus') body.rotation.z = 1.7;
      g.add(body);
      if (p.id === 'saturn') {
        const inner = p.r * 1.3, outer = p.r * 2.3;
        const rg = new THREE.RingGeometry(inner, outer, 96, 1);
        const pos = rg.attributes.position, uv = rg.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const rad = Math.hypot(pos.getX(i), pos.getY(i));
          uv.setXY(i, (rad - inner) / (outer - inner), 0.5);
        }
        const ring = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: ringTex(), transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1 }));
        ring.rotation.x = -Math.PI / 2 + 0.45;
        g.add(ring);
      }
    }
    g.userData.body = body;
    g.userData.label = addLabel(g, p.label, p.r + 0.38);
    scene.add(g);
    addHitBox(g, Math.max(1.0, p.r * 2.2));
    roots.set(p.id, g);
  }
  // Луната.
  const moonPivot = new THREE.Group();
  earth.g.add(moonPivot);
  const moonG = new THREE.Group();
  moonG.position.set(1.25, 0, 0);
  const moonBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), new THREE.MeshStandardMaterial({ map: rockyTex('#b9b9b5', '#6d6d6a', 41, 80), roughness: 1 }));
  moonG.add(moonBall);
  moonG.userData.pickId = 'moon';
  moonPivot.add(moonG);
  const moonLabel = addLabel(moonG, 'Луна', 0.26, 0.3, 15);
  addHitBox(moonG, 0.55);
  const moonOrbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circlePts(1.25, 80)), new THREE.LineBasicMaterial({ color: 0x8892aa, transparent: true, opacity: 0.35 }));
  moonOrbit.raycast = () => {};
  earth.g.add(moonOrbit);

  // Лъчи светлина към Земята (в стъпка 2).
  const rays = new THREE.Group();
  const rayMat = new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.35, depthWrite: false });
  for (let i = 0; i < 5; i++) {
    const a = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.42, 6), rayMat);
    shaft.rotation.z = Math.PI / 2;
    const tip2 = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 8), rayMat);
    tip2.rotation.z = -Math.PI / 2;
    tip2.position.x = 0.24;
    a.add(shaft, tip2);
    a.position.set(0, (i - 2) * 0.16, 0);
    a.userData.ph = i * 0.37;
    rays.add(a);
  }
  rays.visible = false;
  scene.add(rays);

  // ---------- време и движение ----------
  const sim = { mode: 'ambient', T: 0, rate: 2, spinBase: 0 };
  const angleOf = (p, T) => p.ph + (2 * Math.PI * T) / p.period;
  const earthAngle = (T) => angleOf(byId.earth, T);
  const tmpV = new THREE.Vector3(), origin = new THREE.Vector3();
  const nBG = latLon(BG.lat, BG.lon);
  // Слънцето, гледано от България: час (слънчево време) и височина над хоризонта.
  function bgSky() {
    earth.spin.updateWorldMatrix(true, false);
    const s = earth.spin.worldToLocal(tmpV.copy(origin)).normalize();
    const sunLon = Math.atan2(-s.z, s.x) / D2R;
    let hour = 12 + (BG.lon - sunLon) / 15;
    hour = ((hour % 24) + 24) % 24;
    const elev = Math.asin(Math.max(-1, Math.min(1, s.dot(nBG)))) / D2R;
    return { hour, elev };
  }
  const fmtH = (h) => { const m = Math.floor(h * 60) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  const skyWord = (e) => (e > 6 ? 'ден ☀️' : e < -6 ? 'нощ 🌙' : (e >= 0 ? 'изгрев или залез 🌅' : 'здрач 🌆'));
  let readout = null; // HTML елемент за показване на час/денонощия
  let onFrame = null;

  stage.tick((dt, t) => {
    if (sim.mode !== 'manual') sim.T += dt * sim.rate;
    for (const p of PLANETS) {
      const g = roots.get(p.id);
      const a = angleOf(p, sim.T);
      g.position.set(Math.cos(a) * p.d, 0, -Math.sin(a) * p.d);
      if (p.id !== 'earth') g.userData.body.rotation.y += dt * (p.id === 'venus' ? -0.05 : 0.35);
    }
    if (sim.mode === 'ambient') earth.spinA += dt * 0.45;
    else if (sim.mode === 'time') earth.spinA = sim.spinBase + 2 * Math.PI * sim.T + earthAngle(sim.T);
    earth.spin.rotation.y = earth.spinA;
    earth.clouds.rotation.y = t * 0.02;
    // Луната обикаля за 27,3 денонощия и винаги е обърната с една страна към Земята.
    const ma = 1.3 + (2 * Math.PI * sim.T) / 27.3;
    moonPivot.rotation.y = ma;
    moonG.rotation.y = 0;
    sunBall.rotation.y = t * 0.03;
    const pul = 1 + Math.sin(t * 1.7) * 0.03;
    glowA.scale.set(9 * pul, 9 * pul, 1);
    glowB.scale.set(15 / pul, 15 / pul, 1);
    stars.rotation.y = t * 0.004;
    if (rays.visible) {
      const e = earth.g.position;
      const dir = tmpV.copy(e).normalize();
      rays.position.copy(e).addScaledVector(dir, -0.95);
      rays.rotation.y = Math.atan2(-dir.z, dir.x);
      rays.children.forEach((a) => { a.position.x = ((t * 0.5 + a.userData.ph) % 1) * 0.25 - 0.15; });
    }
    if (onFrame) onFrame(dt, t);
  });

  // ---------- балончета ----------
  let tip = null;
  function say(obj, html, { lift = 0.6, cls = '' } = {}) {
    if (tip) tip.remove();
    tip = stage.bubble(obj, html, { lift, cls });
    return tip;
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const objOf = (id) => (id === 'sun' ? sunG : id === 'moon' ? moonG : roots.get(id));
  const liftOf = (id) => (id === 'sun' ? 3.0 : id === 'moon' ? 0.5 : byId[id].r + 0.75);

  const scores = [];
  let clickHandler = null;
  let menuHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  const ITEMS = [{ id: 'sun', label: 'Слънце', icon: '☀️' }, ...PLANETS.map((p) => ({ id: p.id, label: p.label, icon: p.icon })), { id: 'moon', label: 'Луна', icon: '🌙' }];
  const menu = cornerMenu(stage, { title: 'Небесни тела', items: ITEMS, onSelect: (id) => menuHandler && menuHandler(id) });

  const narrow = () => (shell.stageEl.clientWidth || 600) < 560;
  function overview(far = false, dur = 1.2) {
    stage.stopFollow();
    if (narrow()) stage.flyTo(far ? [0, 50, 44] : [0, 30, 27], [0, 0, 0], dur);
    else stage.flyTo(far ? [0, 22, 34] : [0, 12, 19], [0, 0, 0], dur);
  }
  const allLabels = (on) => { for (const g of roots.values()) g.userData.label.visible = on; moonLabel.visible = on; };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    sim.mode = 'ambient'; sim.rate = 2;
    rays.visible = false;
    earth.bgLabel.visible = false;
    allLabels(true);
    menu.show(true);
    menu.setActive(null);
    const seen = new Set();
    const NEED = 6;
    shell.task(`<p>Това е нашата Слънчева система: Слънцето и планетите, които обикалят около него.</p>
      <p><b>Разгледай поне ${NEED} небесни тела</b> — кликни върху тях или ги избери от менюто. Задължително разгледай Слънцето, Земята и Луната.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата система</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); overview(true); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${ITEMS.length}`);
    upd();
    say(sunG, '🔍 Внимание: тук размерите и разстоянията не са истински. Слънцето е много по-голямо, а планетите са много по-далеч една от друга.', { lift: 3.0, cls: 'wide' });
    const visit = (id) => {
      const obj = objOf(id);
      if (id === 'sun') {
        stage.stopFollow();
        stage.flyTo(narrow() ? [0, 6, 15] : [0, 4, 11], [0, 0.4, 0], 1.0);
        say(sunG, `<b>☀️ Слънце</b><br>${esc(SUN_NOTE)}`, { lift: 2.4, cls: 'wide' });
      } else if (id === 'moon') {
        stage.focusOn(moonG, { dist: narrow() ? 2.6 : 1.9, height: 0.5, lift: 0 });
        say(moonG, `<b>🌙 Луна</b><br>${esc(MOON_NOTE)}`, { lift: 0.4, cls: 'wide' });
      } else {
        const p = byId[id];
        const k = narrow() ? 1.35 : 1;
        stage.focusOn(obj, { dist: (p.r * 5 + 1.6) * k, height: p.r * 1.5 + 0.3, lift: 0 });
        say(obj, `<b>${esc(p.icon)} ${esc(p.label)}</b><br>${esc(p.note)}`, { lift: liftOf(id), cls: 'wide' });
      }
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      const must = ['sun', 'earth', 'moon'].filter((x) => !seen.has(x));
      if (seen.size >= NEED && !must.length) {
        next.disabled = false;
        shell.msg('Браво! Можеш да продължиш или да разгледаш още.', 'good');
      } else if (seen.size >= NEED) {
        shell.msg(`Разгледай още: ${must.map((x) => ITEMS.find((i) => i.id === x).label).join(', ')}.`, '');
      }
    };
    clickHandler = (id) => { if (!id) { clearTip(); return; } visit(id); };
    menuHandler = (id) => {
      visit(id);
      // На тесен екран менюто се свива, за да не закрива балончето.
      const list = menu.el.querySelector('.cm-list');
      if (narrow() && list && !list.hidden) menu.el.querySelector('.cm-head').click();
    };
    next.addEventListener('click', step2);
    overview(true);
  }

  // ---------- 2. Ден и нощ ----------
  let stopSpinDrag = null;
  function step2() {
    shell.step(1);
    clearTip();
    stage.stopFollow();
    menu.show(false);
    menu.setActive(null);
    menuHandler = null;
    clickHandler = null;
    sim.mode = 'manual';
    allLabels(true);
    earth.bgLabel.visible = true;
    rays.visible = true;
    earth.g.userData.label.visible = false;
    let mistakes = 0;
    let task = 0;
    // Начало: в България е около 1 часа през нощта.
    const setHour = (target) => {
      for (let i = 0; i < 3; i++) { const { hour } = bgSky(); earth.spinA += ((target - hour) / 24) * Math.PI * 2; earth.spin.rotation.y = earth.spinA; }
    };
    setHour(1);
    const spin0 = earth.spinA;
    // Камерата гледа Земята отстрани, така че се вижда и дневната, и нощната страна.
    const E = earth.g.position.clone();
    const s = E.clone().negate().normalize();
    const perp = new THREE.Vector3().crossVectors(s, new THREE.Vector3(0, 1, 0)).normalize();
    const dist = narrow() ? 2.9 : 2.1;
    const view = perp.clone().multiplyScalar(-0.78).addScaledVector(s, 0.62).normalize();
    const camP = E.clone().addScaledVector(view, dist).add(new THREE.Vector3(0, 0.8, 0));
    stage.flyTo(camP.toArray(), E.clone().addScaledVector(s, 0.12).toArray(), 1.4);
    const TASKS = [
      { text: 'Сега в България е нощ. <b>Завърти Земята така, че в България да е ден.</b> Влачи Земята с пръст или мишка или използвай плъзгача. После натисни „Готово“.', ok: (e) => e > 10 },
      { text: 'Браво! Сега <b>направи да е нощ в България</b> и натисни „Готово“.', ok: (e) => e < -10 },
    ];
    const ctrl = shell.setControls(`<label class="so-lbl">🔄 Завърти Земята
        <input class="slider so-spin" type="range" min="0" max="360" step="1" value="0"></label>
      <div class="so-read">🕐 <span>В България: <b class="hh">--:--</b></span><span class="dn"></span></div>
      <div class="row"><button class="btn primary so-ok">Готово</button></div>`);
    const sl = ctrl.querySelector('.so-spin');
    const hh = ctrl.querySelector('.hh');
    const dn = ctrl.querySelector('.dn');
    readout = () => {
      const { hour, elev } = bgSky();
      hh.textContent = fmtH(hour);
      dn.textContent = skyWord(elev);
    };
    onFrame = () => readout && readout();
    const setSpin = (deg) => { earth.spinA = spin0 + deg * D2R; };
    sl.addEventListener('input', () => setSpin(+sl.value));
    // Влачене на Земята.
    const el = stage.renderer.domElement;
    let drag = null;
    const pd = (ev) => {
      const hit = stage.pickAt(ev);
      if (!hit || hit.root.userData.pickId !== 'earth') return;
      drag = { x: ev.clientX, a: earth.spinA };
      stage.controls.enabled = false;
      try { el.setPointerCapture(ev.pointerId); } catch (e) { /* няма значение */ }
    };
    const pm = (ev) => {
      if (!drag) return;
      earth.spinA = drag.a + (ev.clientX - drag.x) * 0.012;
      let deg = ((earth.spinA - spin0) / D2R) % 360;
      if (deg < 0) deg += 360;
      sl.value = Math.round(deg);
    };
    const pu = () => { if (drag) { drag = null; stage.controls.enabled = true; } };
    el.addEventListener('pointerdown', pd);
    el.addEventListener('pointermove', pm);
    el.addEventListener('pointerup', pu);
    el.addEventListener('pointercancel', pu);
    stopSpinDrag = () => {
      el.removeEventListener('pointerdown', pd);
      el.removeEventListener('pointermove', pm);
      el.removeEventListener('pointerup', pu);
      el.removeEventListener('pointercancel', pu);
      stage.controls.enabled = true;
    };
    const drawTask = () => {
      shell.task(`<p>${TASKS[task].text}</p><p class="small">Жълтите стрелки показват откъде идва светлината на Слънцето.</p>`);
      shell.score(`Задача ${task + 1} от 3 · грешки: ${mistakes}`);
    };
    drawTask();
    say(earth.g, '🌍 Земята се върти около своята <b>ос</b> — въображаема линия през Северния и Южния полюс.', { lift: 0.75 });
    ctrl.querySelector('.so-ok').addEventListener('click', () => {
      const { elev } = bgSky();
      if (TASKS[task].ok(elev)) {
        say(earth.g, task === 0
          ? '✔ <b>Ден!</b> България е на страната, обърната към Слънцето, и е огряна.'
          : '✔ <b>Нощ!</b> България е на страната, обърната обратно на Слънцето. Там не стига слънчева светлина.', { lift: 0.75, cls: 'good' });
        shell.msg('Вярно!', 'good');
        task++;
        if (task < TASKS.length) { drawTask(); return; }
        askWhy();
        return;
      }
      mistakes++;
      shell.score(`Задача ${task + 1} от 3 · грешки: ${mistakes}`);
      const twilight = Math.abs(elev) <= 10;
      const msg = twilight
        ? 'Слънцето е точно на ръба — при изгрев или залез. Завърти още малко.'
        : task === 0
          ? 'В България още е нощ — тя е на тъмната страна. Завърти Земята така, че България да се обърне към Слънцето.'
          : 'В България още е ден — тя е огряна от Слънцето. Завърти я към тъмната страна.';
      say(earth.g, `✘ ${esc(msg)}`, { lift: 0.75, cls: 'bad' });
      shell.msg(mistakes >= 2 ? 'Подсказка: гледай часовника — денят е около 12:00, а нощта — около 00:00.' : 'Не още.', 'bad');
    });
    function askWhy() {
      shell.setControls(ctrl.innerHTML);
      // Плъзгачът остава, за да може детето да продължи да върти.
      const c = shell.controls;
      c.querySelector('.so-ok').remove();
      const sl2 = c.querySelector('.so-spin');
      sl2.value = sl.value;
      sl2.addEventListener('input', () => setSpin(+sl2.value));
      const hh2 = c.querySelector('.hh'), dn2 = c.querySelector('.dn');
      readout = () => { const { hour, elev } = bgSky(); hh2.textContent = fmtH(hour); dn2.textContent = skyWord(elev); };
      shell.task(`<p><b>Защо денят се сменя с нощ?</b></p>
        <div class="choices so-q">
          <button class="choice" data-v="spin">Защото Земята се върти около оста си</button>
          <button class="choice" data-v="moon">Защото Луната закрива Слънцето</button>
          <button class="choice" data-v="off">Защото Слънцето угасва вечер</button>
          <button class="choice" data-v="orbit">Защото Земята обикаля около Слънцето</button>
        </div>`);
      shell.score(`Задача 3 от 3 · грешки: ${mistakes}`);
      const WHY = {
        moon: 'Луната не закрива Слънцето всяка вечер. Погледни: какво направи ти със Земята?',
        off: 'Слънцето не угасва — то свети постоянно. Когато при нас е нощ, на другата страна на Земята е ден.',
        orbit: 'Обиколката около Слънцето трае цяла година. Денят и нощта се сменят много по-бързо.',
      };
      container.querySelectorAll('.so-q .choice').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        if (b.dataset.v !== 'spin') {
          mistakes++;
          b.classList.add('wrong');
          b.disabled = true;
          shell.msg(WHY[b.dataset.v], 'bad');
          shell.score(`Задача 3 от 3 · грешки: ${mistakes}`);
          return;
        }
        container.querySelectorAll('.so-q .choice').forEach((x) => { x.disabled = true; });
        b.classList.add('right');
        shell.msg('Вярно!', 'good');
        say(earth.g, '✔ Земята се върти около оста си <b>от запад на изток</b>. Затова Слънцето „изгрява“ на изток. Едната половина на Земята винаги е огряна — там е ден, а на другата е нощ.', { lift: 0.75, cls: 'good wide' });
        scores.push(stepScore(mistakes, 3));
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = '<button class="btn primary">Напред →</button>';
        c.appendChild(row);
        row.querySelector('button').addEventListener('click', step3);
      }));
    }
  }

  // ---------- 3. Една година ----------
  function step3() {
    shell.step(2);
    clearTip();
    if (stopSpinDrag) { stopSpinDrag(); stopSpinDrag = null; }
    rays.visible = false;
    earth.bgLabel.visible = false;
    allLabels(true);
    // Времето тръгва от днешното положение на Земята.
    const T0 = sim.T;
    sim.spinBase = earth.spinA - 2 * Math.PI * T0 - earthAngle(T0);
    sim.mode = 'time';
    sim.rate = 0;
    let running = false;
    let mistakes = 0;
    let q = 0;
    let yearDone = false;
    overview(false);
    // Следа по орбитата и знак „Старт“.
    const ED = byId.earth.d;
    const trailPts = [];
    const a0 = earthAngle(T0);
    for (let i = 0; i <= 200; i++) { const a = a0 + (i / 200) * Math.PI * 2; trailPts.push(new THREE.Vector3(Math.cos(a) * ED, 0.01, -Math.sin(a) * ED)); }
    const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(trailPts), new THREE.LineBasicMaterial({ color: 0x4fc3ff }));
    trail.geometry.setDrawRange(0, 0);
    trail.raycast = () => {};
    scene.add(trail);
    const start = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.65, 32), new THREE.MeshBasicMaterial({ color: 0x4fc3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    start.rotation.x = -Math.PI / 2;
    start.position.set(Math.cos(a0) * ED, 0, -Math.sin(a0) * ED);
    start.raycast = () => {};
    scene.add(start);
    const startLbl = labelSprite('Старт', { ...labelStyle, size: 0.32, bg: 'rgba(20,110,170,0.9)' });
    startLbl.position.copy(start.position).add(new THREE.Vector3(0, -0.6, 0.9));
    fixLabel(startLbl, 15);
    scene.add(startLbl);
    step3.cleanup = () => { scene.remove(trail, start, startLbl); };

    const ctrl = shell.setControls(`<div class="row"><button class="btn primary so-play">▶ Пусни времето</button></div>
      <label class="so-lbl">⏩ Скорост <output class="sp"></output>
        <input class="slider so-speed" type="range" min="0" max="100" step="1" value="0"></label>
      <div class="so-read"><span>📅 Денонощия: <b class="days">0</b></span><span>🕐 В България: <b class="hh">--:--</b></span></div>`);
    const play = ctrl.querySelector('.so-play');
    const spd = ctrl.querySelector('.so-speed');
    const spOut = ctrl.querySelector('.sp');
    const daysEl = ctrl.querySelector('.days');
    const hhEl = ctrl.querySelector('.hh');
    const rateOf = () => 0.25 * Math.pow(120, spd.value / 100); // от 1 денонощие за 4 секунди до 30 за секунда
    const updSpeed = () => {
      const r = rateOf();
      spOut.textContent = r < 0.6 ? `1 денонощие за ${Math.round(1 / r)} секунди` : Math.round(r) === 1 ? '1 денонощие в секунда' : `${Math.round(r)} денонощия в секунда`;
      if (running) sim.rate = r;
    };
    spd.addEventListener('input', updSpeed);
    updSpeed();
    play.addEventListener('click', () => {
      if (yearDone && q >= 1) return;
      running = !running;
      sim.rate = running ? rateOf() : 0;
      play.textContent = running ? '⏸ Спри' : '▶ Пусни времето';
    });
    onFrame = () => {
      const days = sim.T - T0;
      if (days >= 365.25 && !yearDone) {
        sim.T = T0 + 365.25;
        yearDone = true;
        running = false; sim.rate = 0;
        play.textContent = '▶ Пусни времето';
        play.disabled = true;
        say(earth.g, '🎉 Земята се върна на мястото, откъдето тръгна! Направи <b>една цяла обиколка</b> около Слънцето.', { lift: 0.9, cls: 'good wide' });
        if (q === 1) drawQ();
      }
      const d = Math.min(365.25, sim.T - T0);
      daysEl.textContent = Math.floor(d + 1e-6);
      hhEl.textContent = fmtH(bgSky().hour);
      trail.geometry.setDrawRange(0, Math.floor((d / 365.25) * 200) + 1);
    };
    const QS = [
      { q: 'За колко време Земята се завърта <b>веднъж около оста си</b>?', hint: 'Пусни времето бавно и гледай часовника: колко часа минават, докато в България пак стане същият час?',
        choices: [['h1', '1 час'], ['day', '24 часа — едно денонощие'], ['week', '1 седмица'], ['year', '1 година']], ok: 'day',
        why: { h1: 'За 1 час Земята се завърта съвсем малко. Гледай часовника.', week: 'За една седмица Земята се завърта 7 пъти.', year: 'За една година Земята се завърта около 365 пъти.' },
        good: '✔ Едно завъртане около оста трае <b>24 часа</b> — едно денонощие (ден и нощ).' },
      { q: 'За колко време Земята <b>обикаля веднъж около Слънцето</b>?', hint: 'Ускори времето и изчакай Земята да се върне до „Старт“. Погледни брояча на денонощията.',
        choices: [['day', '24 часа'], ['month', '1 месец'], ['year', '1 година — около 365 денонощия'], ['c', '100 години']], ok: 'year',
        why: { day: 'За 24 часа Земята само се завърта веднъж около оста си.', month: 'Около един месец Луната обикаля Земята. Земята обикаля Слънцето по-бавно.', c: 'Погледни брояча — денонощията са много по-малко.' },
        good: '✔ Една обиколка около Слънцето трае <b>една година</b> — около 365 денонощия.' },
    ];
    const lock = () => (q === 0 ? sim.T - T0 < 1 : !yearDone);
    function drawQ() {
      const Q = QS[q];
      shell.task(`<p>Земята прави две движения: <b>върти се около оста си</b> и <b>обикаля около Слънцето</b>. Пусни времето и наблюдавай.</p>
        <p>${Q.q}</p>
        <div class="choices so-q">${Q.choices.map(([v, l]) => `<button class="choice" data-v="${v}">${esc(l)}</button>`).join('')}</div>`);
      shell.score(`Въпрос ${q + 1} от 2 · грешки: ${mistakes}`);
      container.querySelectorAll('.so-q .choice').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        if (lock()) { shell.msg(q === 0 ? 'Първо пусни времето и виж поне едно денонощие.' : Q.hint, 'bad'); return; }
        if (b.dataset.v !== Q.ok) {
          mistakes++;
          b.classList.add('wrong');
          b.disabled = true;
          shell.msg(`${Q.why[b.dataset.v]}${mistakes >= 2 ? ' ' + Q.hint : ''}`, 'bad');
          shell.score(`Въпрос ${q + 1} от 2 · грешки: ${mistakes}`);
          return;
        }
        container.querySelectorAll('.so-q .choice').forEach((x) => { x.disabled = true; });
        b.classList.add('right');
        shell.msg('Вярно!', 'good');
        say(earth.g, Q.good, { lift: 0.9, cls: 'good wide' });
        if (q === 0) {
          q = 1;
          const nb = document.createElement('div');
          nb.className = 'row';
          nb.innerHTML = '<button class="btn primary">Следващ въпрос →</button>';
          shell.controls.appendChild(nb);
          nb.querySelector('button').addEventListener('click', () => { nb.remove(); shell.msg(''); if (!running && !yearDone) shell.msg('Ускори времето с плъзгача.', ''); drawQ(); });
          return;
        }
        scores.push(stepScore(mistakes, 3));
        const nb = document.createElement('div');
        nb.className = 'row';
        nb.innerHTML = '<button class="btn primary">Напред →</button>';
        shell.controls.appendChild(nb);
        nb.querySelector('button').addEventListener('click', step4);
      }));
    }
    drawQ();
  }

  // ---------- 4. Подреди планетите ----------
  function step4() {
    shell.step(3);
    clearTip();
    onFrame = null;
    if (step3.cleanup) { step3.cleanup(); step3.cleanup = null; }
    sim.mode = 'ambient'; sim.rate = 2;
    allLabels(false);
    overview(true);
    let mistakes = 0;
    let n = 0;
    const order = PLANETS.map((p) => p.id);
    const names = shuffle(PLANETS);
    shell.task(`<p><b>Подреди планетите</b> по ред от Слънцето навън: кликни имената поред — първо най-близката до Слънцето.</p>
      <div class="so-chips">${names.map((p) => `<button class="chip" data-id="${p.id}">${esc(p.label)}</button>`).join('')}</div>
      <p class="small so-got">Подредени: —</p>`);
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${n} от 8 · грешки: ${mistakes}`);
    upd();
    const got = container.querySelector('.so-got');
    container.querySelectorAll('.so-chips .chip').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.id;
      if (b.classList.contains('right')) return;
      const want = order[n];
      if (id !== want) {
        mistakes++;
        b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
        shell.msg(`„${byId[id].label}“ не е следващата. Има планета, която е по-близо до Слънцето.${mistakes >= 2 ? ` Подсказка: следващата започва с „${byId[want].label[0]}“.` : ''}`, 'bad');
        upd();
        return;
      }
      n++;
      b.classList.remove('wrong');
      b.classList.add('right');
      b.textContent = `${n}. ${byId[id].label}`;
      const g = roots.get(id);
      g.userData.label.visible = true;
      say(g, `✔ <b>${n}. ${esc(byId[id].label)}</b>`, { lift: byId[id].r + 0.75, cls: 'good' });
      shell.msg('Вярно!', 'good');
      got.textContent = 'Подредени: ' + order.slice(0, n).map((x) => byId[x].label).join(' → ');
      upd();
      if (n === 8) {
        moonLabel.visible = true;
        say(sunG, '✔ Осемте планети: Меркурий, Венера, Земя, Марс, Юпитер, Сатурн, Уран и Нептун.', { lift: 3.0, cls: 'good wide' });
        const c = shell.setControls('<button class="btn primary">Следващ въпрос →</button>');
        c.querySelector('button').addEventListener('click', () => transfer(0));
      }
    }));

    const TQ = [
      { q: 'Нощем Луната свети ярко. <b>Защо свети Луната?</b>', ok: 'refl',
        choices: [['refl', 'Отразява светлината на Слънцето'], ['star', 'Тя е звезда и сама излъчва светлина'], ['fire', 'Вътре в нея гори огън'], ['earth', 'Осветяват я лампите от Земята']],
        why: { star: 'Луната не е звезда — тя е студено каменно кълбо.', fire: 'В Луната няма огън — тя е студено каменно кълбо.', earth: 'Светлината от лампите е твърде слаба, за да стигне до Луната.' },
        show: () => { stage.focusOn(moonG, { dist: narrow() ? 2.6 : 1.9, height: 0.4, lift: 0 }); return [moonG, 0.4, '🌙 Огрятата от Слънцето половина на Луната свети, а другата е тъмна. Затова Луната ни изглежда с различна форма.']; } },
      { q: '<b>Кое от тези небесни тела е звезда?</b>', ok: 'sun',
        choices: [['moon', 'Луната'], ['venus', 'Венера'], ['sun', 'Слънцето'], ['jupiter', 'Юпитер']],
        why: { moon: 'Луната е спътник на Земята — тя само отразява светлина.', venus: 'Венера свети ярко, но е планета — отразява светлината на Слънцето.', jupiter: 'Юпитер е най-голямата планета, но не е звезда — не излъчва собствена светлина.' },
        show: () => { stage.stopFollow(); stage.flyTo(narrow() ? [0, 6, 15] : [0, 4, 11], [0, 0.4, 0], 1.0); return [sunG, 2.4, '☀️ Звездата сама излъчва светлина и топлина. Планетите и Луната само отразяват светлината на Слънцето.']; } },
    ];
    function transfer(k) {
      const Q = TQ[k];
      clearTip();
      shell.msg('');
      shell.task(`<p>${Q.q}</p><div class="choices so-q">${Q.choices.map(([v, l]) => `<button class="choice" data-v="${v}">${esc(l)}</button>`).join('')}</div>`);
      shell.setControls('');
      shell.score(`Въпрос ${k + 1} от 2 · грешки: ${mistakes}`);
      container.querySelectorAll('.so-q .choice').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        if (b.dataset.v !== Q.ok) {
          mistakes++;
          b.classList.add('wrong');
          b.disabled = true;
          shell.msg(Q.why[b.dataset.v], 'bad');
          shell.score(`Въпрос ${k + 1} от 2 · грешки: ${mistakes}`);
          return;
        }
        container.querySelectorAll('.so-q .choice').forEach((x) => { x.disabled = true; });
        b.classList.add('right');
        shell.msg('Вярно!', 'good');
        const [obj, lift, text] = Q.show();
        say(obj, `✔ ${text}`, { lift, cls: 'good wide' });
        const last = k === TQ.length - 1;
        const c = shell.setControls(`<button class="btn primary">${last ? 'Виж резултата' : 'Следващ въпрос →'}</button>`);
        c.querySelector('button').addEventListener('click', () => {
          if (!last) { transfer(k + 1); return; }
          scores.push(stepScore(mistakes, 3));
          clearTip();
          overview();
          const ratio = scores.reduce((a, b2) => a + b2, 0) / scores.length;
          shell.score('');
          shell.finish(ratio, onComplete, restart);
        });
      }));
    }
  }

  function restart() {
    clearTip();
    if (stopSpinDrag) { stopSpinDrag(); stopSpinDrag = null; }
    if (step3.cleanup) { step3.cleanup(); step3.cleanup = null; }
    onFrame = null;
    readout = null;
    scores.length = 0;
    sim.T = 0;
    step1();
  }

  step1();
  return { dispose() { if (stopSpinDrag) stopSpinDrag(); stage.dispose(); } };
}
