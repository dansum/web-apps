// 4.2.3 „Светлината се разпространява праволинейно“ — затъмнена стая с лабораторна маса.
// Стъпки: опознай стаята → опитът с трите картона → сенките от лампата → приложи и предскажи.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- опитът с картоните (лъчът е по оста x) ----------
const HY = 0.65; // височина на дупките и на фенерчето
const RZ = -0.5; // линията на опита
const XF = -5.0; // стъклото на фенерчето
const XC = [-3.2, -1.7, -0.2]; // картоните
const XS = 1.4; // белият екран
const CONE_R = 0.22; // радиус на светлото петно върху първия картон
const HOLE_R = 0.075; // радиус на дупката
const DZ_MAX = 0.35; // докъде може да се плъзне картон
const DZ0 = [0, 0.33, -0.28];

// ---------- сенките (лампа, мече, екран) ----------
const BX = 4; // центърът
const TOY_Z = -0.4;
const SCR_Z = -1.3;
const SCR_W = 2.6;
const SCR_H = 1.65;
const LAMP_H = 0.32;

// ---------- прозорецът ----------
const WIN = { x: 5.6, y: 3.4, z: -2.57, w: 1.2, h: 1.0 };
const SUN_D = new V3(0.0, -0.62, 0.78).normalize();

const ITEMS = [
  { id: 'torch', label: 'Фенерче', icon: '🔦',
    note: '<b>Фенерче.</b> Фенерчето е <b>източник на светлина</b>. Включихме го. Светлината излиза от него и се движи напред, към картоните.' },
  { id: 'cards', label: 'Картони с дупки', icon: '🟫',
    note: '<b>Три картона с малки дупки.</b> Стоят на поставки и дупките им са на еднаква височина. Картонът не пропуска светлина. Тя може да мине само през дупката.' },
  { id: 'screens', label: 'Екран', icon: '⬜',
    note: '<b>Бял екран.</b> На него се вижда светло петно там, където стига светлината. Има още един екран до лампата — на него ще гледаме сенки.' },
  { id: 'toy', label: 'Мече за сенки', icon: '🧸',
    note: '<b>Плюшено мече.</b> То не пропуска светлина. Когато лампата свети, зад мечето, на екрана, се образува <b>сянка</b>.' },
  { id: 'lamp', label: 'Лампа', icon: '💡',
    note: '<b>Настолна лампа.</b> Тя също е източник на светлина. Включихме я — виж сянката на мечето на екрана. Ще местим лампата и ще гледаме как се променя сянката.' },
  { id: 'sun', label: 'Слънце през прозореца', icon: '☀️',
    note: '<b>Слънцето</b> е най-важният източник на светлина за нас. Виж слънчевия сноп (много лъчи заедно) през прозореца. В прашния въздух той изглежда като <b>права</b> светла ивица.' },
];
const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

function injectStyle() {
  if (document.getElementById('light-style')) return;
  const s = document.createElement('style');
  s.id = 'light-style';
  s.textContent = `
  .light-q { margin:10px 0 6px; font-weight:700; }
  .light-sl { display:block; font-size:.88rem; font-weight:700; margin:8px 0 2px; }
  .light-sl input { width:100%; margin-top:4px; }
  .light-sl .light-ends { display:flex; justify-content:space-between; font-weight:400; color:#5b6575; font-size:.8rem; }
  .light-sl input:disabled { opacity:.45; }
  `;
  document.head.appendChild(s);
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = () => canvasTex(64, 64, (x) => {
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
});
const addMat = (color, opacity, map) => new THREE.MeshBasicMaterial({
  color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, map: map || null,
});

// Матрица, която „сплесква“ предмет върху равнина, гледано от светлината (плоска сянка).
// plane: n·p + d = 0; L: (x, y, z, 1) за точков източник.
function shadowMatrix(out, n, d, L) {
  const dot = n.x * L.x + n.y * L.y + n.z * L.z + d * L.w;
  out.set(
    dot - L.x * n.x, -L.x * n.y, -L.x * n.z, -L.x * d,
    -L.y * n.x, dot - L.y * n.y, -L.y * n.z, -L.y * d,
    -L.z * n.x, -L.z * n.y, dot - L.z * n.z, -L.z * d,
    -L.w * n.x, -L.w * n.y, -L.w * n.z, dot - L.w * d,
  );
  return out;
}

export function mount(container, opts) {
  injectStyle();
  let inst = null;
  const restart = () => { inst.dispose(); inst = build(container, opts, restart); };
  inst = build(container, opts, restart);
  return { dispose() { inst.dispose(); } };
}

function build(container, { onComplete }, restart) {
  const STEPS = ['Опознай стаята', 'Опитът с трите картона', 'Сенките', 'Приложи и предскажи'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0x10141c, camPos: [0, 5, 11], target: [0, 0.5, 0], maxDistance: 24, minDistance: 1.5,
    maxPolarAngle: Math.PI * 0.46,
  });
  const { scene, camera, renderer } = stage;
  renderer.localClippingEnabled = true;
  stage.controls.minAzimuthAngle = -1.2;
  stage.controls.maxAzimuthAngle = 1.2;
  stage.hemi.color.set(0x9fb2d6);
  stage.hemi.groundColor.set(0x2a2f3a);
  stage.hemi.intensity = 0.6;
  stage.sun.intensity = 0.35;
  const fill = new THREE.DirectionalLight(0xb8c8ff, 0.45);
  fill.position.set(-8, 4, 5);
  scene.add(fill);
  const narrowUI = () => renderer.domElement.clientWidth < 480;

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
  let alive = true;

  const GLOW = glowTex();

  // ---------- стая ----------
  const table = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.12, 4.2), mat(0x7a5a3e, { roughness: 0.8 }));
  table.position.set(0, -0.06, 0.3);
  scene.add(table);
  for (const [x, z] of [[-6, -1.6], [6, -1.6], [-6, 2.2], [6, 2.2]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.5, 0.14), mat(0x5b4330));
    leg.position.set(x, -1.37, z);
    scene.add(leg);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat(0x262a33));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.62;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), mat(0x2c3444));
  wall.position.set(0, 2.5, -2.6);
  scene.add(wall);
  // часовник на стената
  const clockG = new THREE.Group();
  clockG.add(new THREE.Mesh(new THREE.CircleGeometry(0.36, 28), mat(0xd9dee6)));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.035, 6, 28), mat(0x1c222c));
  clockG.add(rim);
  const hand = (len, w, c) => {
    const p = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.01), mat(c));
    m.position.y = len / 2 - 0.03;
    p.add(m); p.position.z = 0.02;
    clockG.add(p);
    return p;
  };
  const hM = hand(0.27, 0.03, 0x1c222c);
  const hS = hand(0.3, 0.012, 0xd32f2f);
  clockG.position.set(-2.2, 3.5, -2.58);
  scene.add(clockG);

  // ---------- прозорец със щори и слънчев сноп ----------
  const winG = new THREE.Group();
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xcfe9ff });
  winG.add(new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.h), glassMat));
  for (const [w, h, x, y] of [[WIN.w + 0.16, 0.08, 0, WIN.h / 2 + 0.04], [WIN.w + 0.16, 0.08, 0, -WIN.h / 2 - 0.04], [0.08, WIN.h + 0.16, -WIN.w / 2 - 0.04, 0], [0.08, WIN.h + 0.16, WIN.w / 2 + 0.04, 0], [0.04, WIN.h, 0, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), mat(0xe8e8e8));
    f.position.set(x, y, 0.03);
    winG.add(f);
  }
  const slats = [];
  for (let i = 0; i < 8; i++) {
    const sl = new THREE.Mesh(new THREE.BoxGeometry(WIN.w + 0.04, WIN.h / 8 + 0.01, 0.012), mat(0xd8d2c4));
    sl.position.set(0, WIN.h / 2 - (i + 0.5) * (WIN.h / 8), 0.09);
    winG.add(sl);
    slats.push(sl);
  }
  winG.position.set(WIN.x, WIN.y, WIN.z);
  winG.userData.pickId = 'sun';
  scene.add(winG);
  addHitBox(winG, 1.2);
  // сноп: от ъглите на прозореца до масата
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => new V3(WIN.x + a * WIN.w / 2, WIN.y + b * WIN.h / 2, WIN.z + 0.1));
  const hitTable = (p) => p.clone().addScaledVector(SUN_D, (p.y - 0.004) / -SUN_D.y);
  const ends = corners.map(hitTable);
  const shaftGeo = new THREE.BufferGeometry();
  {
    const pos = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i]; const b = corners[(i + 1) % 4]; const c = ends[(i + 1) % 4]; const d = ends[i];
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
    }
    shaftGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  }
  const shaft = new THREE.Mesh(shaftGeo, addMat(0xfff0c8, 0.1));
  shaft.raycast = () => {};
  scene.add(shaft);
  const patchTex = canvasTex(128, 128, (x) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#000'; x.fillRect(61, 0, 6, 128); // сянката на рамката
  });
  const patchGeo = new THREE.BufferGeometry();
  patchGeo.setAttribute('position', new THREE.Float32BufferAttribute([...ends[0].toArray(), ...ends[1].toArray(), ...ends[2].toArray(), ...ends[3].toArray()], 3));
  patchGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  patchGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const patch = new THREE.Mesh(patchGeo, addMat(0xffe7a8, 0.5, patchTex));
  patch.raycast = () => {};
  scene.add(patch);
  // прашинки в снопа
  const SUN_N = 110;
  const sunDust = { u: [], v: [], t: [], sp: [] };
  const sunPos = new Float32Array(SUN_N * 3);
  for (let i = 0; i < SUN_N; i++) { sunDust.u.push(Math.random()); sunDust.v.push(Math.random()); sunDust.t.push(Math.random()); sunDust.sp.push(0.02 + Math.random() * 0.03); }
  const sunGeo = new THREE.BufferGeometry();
  sunGeo.setAttribute('position', new THREE.BufferAttribute(sunPos, 3));
  const sunPtsMat = new THREE.PointsMaterial({ map: GLOW, size: 0.06, color: 0xfff1c8, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  const sunPts = new THREE.Points(sunGeo, sunPtsMat);
  sunPts.raycast = () => {};
  sunPts.frustumCulled = false;
  scene.add(sunPts);
  let blinds = 1; let blindsTo = 1;
  const tmpA = new V3(); const tmpB = new V3();
  stage.tick((dt, t) => {
    blinds += (blindsTo - blinds) * Math.min(1, rdt * 2.5);
    slats.forEach((s) => { s.rotation.x = blinds * 1.35; });
    glassMat.color.setHex(0x2a3446).lerp(new THREE.Color(0xd4ecff), blinds);
    shaft.material.opacity = 0.11 * blinds;
    patch.material.opacity = 0.55 * blinds;
    sunPtsMat.opacity = 0.85 * blinds;
    stage.hemi.intensity = 0.5 + 0.18 * blinds;
    for (let i = 0; i < SUN_N; i++) {
      sunDust.t[i] = (sunDust.t[i] + sunDust.sp[i] * rdt * 0.4) % 1;
      const u = sunDust.u[i] + Math.sin(t * 0.3 + i) * 0.02; const v = sunDust.v[i];
      tmpA.lerpVectors(corners[0], corners[1], u); tmpB.lerpVectors(corners[3], corners[2], u); tmpA.lerp(tmpB, v);
      const e = hitTable(tmpA);
      tmpA.lerp(e, 0.05 + sunDust.t[i] * 0.9);
      sunPos[i * 3] = tmpA.x; sunPos[i * 3 + 1] = tmpA.y; sunPos[i * 3 + 2] = tmpA.z;
    }
    sunGeo.attributes.position.needsUpdate = true;
    hS.rotation.z = -Math.floor(t) * (Math.PI / 30);
    hM.rotation.z = -t * 0.004 - 1.2;
  });

  // ---------- фенерче ----------
  const torch = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.5, 16), mat(0x1f5fbf, { roughness: 0.5 }));
    body.rotation.z = Math.PI / 2; body.position.x = -0.38;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.16, 18), mat(0x2d3a4a, { metalness: 0.4, roughness: 0.4 }));
    head.rotation.z = -Math.PI / 2; head.position.x = -0.08;
    const btn = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), mat(0xe53935));
    btn.position.set(-0.36, 0.08, 0);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.34, HY - 0.08, 0.24), mat(0x8d6e63));
    stand.position.set(-0.3, -(HY - 0.08) / 2 - 0.07, 0);
    torch.add(body, head, btn, stand);
  }
  const lensMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 18), lensMat);
  lens.rotation.y = Math.PI / 2; lens.position.x = 0.001;
  torch.add(lens);
  torch.position.set(XF, HY, RZ);
  torch.userData.pickId = 'torch';
  scene.add(torch);
  addHitBox(torch, 0.6);
  const torchGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xfff0b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  torchGlow.scale.set(0.6, 0.6, 1);
  torchGlow.position.set(XF + 0.03, HY, RZ);
  torchGlow.raycast = () => {};
  scene.add(torchGlow);
  const coneLen = XC[0] - 0.03 - XF;
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.08, CONE_R, coneLen, 24, 1, true), addMat(0xfff2b8, 0.16));
  cone.rotation.z = Math.PI / 2;
  cone.position.set(XF + coneLen / 2, HY, RZ);
  cone.raycast = () => {};
  scene.add(cone);
  const spotGeo = new THREE.CircleGeometry(1, 24);
  const card1Spot = new THREE.Mesh(spotGeo, addMat(0xffe9a0, 0.6, GLOW));
  card1Spot.scale.setScalar(CONE_R * 1.5);
  card1Spot.rotation.y = -Math.PI / 2;
  card1Spot.position.set(XC[0] - 0.035, HY, RZ);
  card1Spot.raycast = () => {};
  scene.add(card1Spot);
  let torchOn = false;
  const setTorch = (on) => { torchOn = on; lensMat.color.setHex(on ? 0xfff6c8 : 0x555555); };

  // ---------- картони с дупки ----------
  const cardsRig = new THREE.Group();
  cardsRig.userData.pickId = 'cards';
  scene.add(cardsRig);
  const cards = [];
  const cardShape = new THREE.Shape();
  cardShape.moveTo(-0.9, 0.2); cardShape.lineTo(0.9, 0.2); cardShape.lineTo(0.9, 1.2); cardShape.lineTo(-0.9, 1.2); cardShape.lineTo(-0.9, 0.2);
  const holePath = new THREE.Path();
  holePath.absarc(0, HY, HOLE_R, 0, Math.PI * 2, true);
  cardShape.holes.push(holePath);
  const cardGeo = new THREE.ExtrudeGeometry(cardShape, { depth: 0.03, bevelEnabled: false, curveSegments: 16 });
  cardGeo.translate(0, 0, -0.015);
  XC.forEach((x, i) => {
    const g = new THREE.Group();
    const card = new THREE.Mesh(cardGeo, mat(0xcfa977, { roughness: 0.95 }));
    card.rotation.y = Math.PI / 2;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.7), mat(0x6d4c41));
    base.position.y = 0.05;
    const clampM = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.5), mat(0x5d4037));
    clampM.position.y = 0.16;
    const lbl = labelSprite(String(i + 1), { size: 0.26 });
    lbl.position.set(0, 1.42, 0);
    stage.steadyLabel(lbl, 9);
    g.add(card, base, clampM, lbl);
    g.position.set(x, 0, RZ + DZ0[i]);
    g.userData.dragId = 'card' + (i + 1);
    g.userData.idx = i;
    cardsRig.add(g);
    addHitBox(g, 0.8);
    cards.push(g);
  });
  const dz = (i) => cards[i].position.z - RZ;

  // екран A (гледа към фенерчето)
  const screenA = new THREE.Group();
  {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), mat(0xf4f4f0, { roughness: 0.9 }));
    face.rotation.y = -Math.PI / 2; face.position.y = 0.75;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.28, 2.08), mat(0x37474f));
    back.position.set(0.03, 0.75, 0);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 1.2), mat(0x37474f));
    foot.position.y = 0.04;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), mat(0x37474f));
    post.position.y = 0.12;
    screenA.add(face, back, foot, post);
  }
  screenA.position.set(XS, 0, RZ);
  screenA.userData.pickId = 'screens';
  scene.add(screenA);

  // лъч: ядро + ореол, петна там, където спира
  const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
  const beamCore = new THREE.Mesh(beamGeo, addMat(0xfff6d0, 0.55));
  const beamHalo = new THREE.Mesh(beamGeo, addMat(0xffe08a, 0.13));
  beamCore.raycast = () => {}; beamHalo.raycast = () => {};
  scene.add(beamCore, beamHalo);
  const blockSpot = new THREE.Mesh(spotGeo, addMat(0xffe9a0, 0.9, GLOW));
  blockSpot.rotation.y = -Math.PI / 2; blockSpot.scale.setScalar(0.16);
  const screenSpot = new THREE.Mesh(spotGeo, addMat(0xfff2b0, 1.0, GLOW));
  screenSpot.rotation.y = -Math.PI / 2; screenSpot.scale.setScalar(0.22);
  blockSpot.raycast = () => {}; screenSpot.raycast = () => {};
  scene.add(blockSpot, screenSpot);
  const guidePts = new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]);
  const guide = new THREE.Line(guidePts, new THREE.LineDashedMaterial({ color: 0x7fffd4, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.9 }));
  guide.visible = false;
  guide.raycast = () => {};
  scene.add(guide);

  // Изчислява пътя на светлината: права от фенерчето през първата дупка.
  let beam = { n: 0, s: 0, endX: XC[0], endZ: 0, reached: false };
  function computeBeam() {
    const d1 = dz(0);
    if (!torchOn || Math.abs(d1) > CONE_R - HOLE_R * 0.6) return { n: 0, s: 0, endX: XC[0], endZ: d1, reached: false, block: 0 };
    const s = d1 / (XC[0] - XF);
    let n = 1;
    for (let i = 1; i < 3; i++) {
      const zr = s * (XC[i] - XF);
      if (Math.abs(zr - dz(i)) > HOLE_R) return { n, s, endX: XC[i] - 0.035, endZ: zr, reached: false, block: i };
      n++;
    }
    return { n, s, endX: XS - 0.02, endZ: s * (XS - XF), reached: true, block: -1 };
  }
  const bdir = new V3(); const up = new V3(0, 1, 0);
  function drawBeam(t) {
    beam = computeBeam();
    cone.visible = card1Spot.visible = torchOn;
    torchGlow.material.opacity = torchOn ? 0.9 : 0;
    const flick = 1 + Math.sin(t * 7.3) * 0.04 + Math.sin(t * 3.1) * 0.03;
    cone.material.opacity = 0.15 * flick;
    const has = torchOn && beam.n > 0;
    beamCore.visible = beamHalo.visible = has;
    if (has) {
      const a = new V3(XC[0], HY, RZ + dz(0));
      const b = new V3(beam.endX, HY, RZ + beam.endZ);
      const len = a.distanceTo(b);
      bdir.copy(b).sub(a).normalize();
      for (const [m, r] of [[beamCore, 0.028], [beamHalo, 0.075]]) {
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(up, bdir);
        m.scale.set(r, len, r);
      }
      beamCore.material.opacity = 0.5 * flick;
    }
    blockSpot.visible = has && !beam.reached;
    if (blockSpot.visible) blockSpot.position.set(beam.endX - 0.003, HY, RZ + beam.endZ);
    screenSpot.visible = has && beam.reached;
    if (screenSpot.visible) {
      screenSpot.position.set(XS - 0.025, HY, RZ + beam.endZ);
      screenSpot.scale.setScalar(0.24 * (1 + Math.sin(t * 4) * 0.06));
    }
  }

  // прашинки около лъча
  const DN = 420;
  const dPos = new Float32Array(DN * 3);
  const dCol = new Float32Array(DN * 3);
  const dBase = [];
  for (let i = 0; i < DN; i++) {
    const narrow = i < 240;
    dBase.push({
      x: lerp(XF - 0.2, XS, Math.random()),
      y: narrow ? HY + (Math.random() - 0.5) * 0.26 : 0.25 + Math.random() * 1.1,
      z: narrow ? RZ + (Math.random() - 0.5) * 0.7 : RZ + (Math.random() - 0.5) * 1.6,
      ph: Math.random() * 6.28, sp: 0.2 + Math.random() * 0.4,
    });
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ map: GLOW, size: 0.05, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  dust.raycast = () => {};
  dust.frustumCulled = false;
  scene.add(dust);
  stage.tick((dt, t) => {
    drawBeam(t);
    for (let i = 0; i < DN; i++) {
      const b = dBase[i];
      const x = b.x + Math.sin(t * b.sp * 0.5 + b.ph) * 0.12;
      const y = b.y + Math.sin(t * b.sp + b.ph * 2) * 0.05;
      const z = b.z + Math.cos(t * b.sp * 0.7 + b.ph) * 0.06;
      dPos[i * 3] = x; dPos[i * 3 + 1] = y; dPos[i * 3 + 2] = z;
      let k = 0.07;
      if (torchOn) {
        if (x > XF && x < XC[0]) {
          const f = (x - XF) / (XC[0] - XF);
          if (Math.hypot(y - HY, z - RZ) < 0.08 + f * (CONE_R - 0.08)) k = 0.6;
        } else if (beam.n > 0 && x > XC[0] && x < beam.endX) {
          if (Math.hypot(y - HY, z - (RZ + beam.s * (x - XF))) < 0.075) k = 1.0;
        }
      }
      dCol[i * 3] = k; dCol[i * 3 + 1] = k * 0.93; dCol[i * 3 + 2] = k * 0.75;
    }
    dGeo.attributes.position.needsUpdate = true;
    dGeo.attributes.color.needsUpdate = true;
  });

  // ---------- мече ----------
  const toy = new THREE.Group();
  {
    const fur = mat(0xa86b3c, { roughness: 0.95 });
    const light = mat(0xe0b88a, { roughness: 0.95 });
    const dark = mat(0x1b1b1b);
    const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); toy.add(o); return o; };
    const sph = new THREE.SphereGeometry(1, 16, 12);
    add(sph, fur, 0, 0.29, 0, 0.2, 0.24, 0.18);
    add(sph, light, 0, 0.28, 0.12, 0.12, 0.14, 0.07);
    add(sph, fur, 0, 0.6, 0, 0.15, 0.15, 0.15);
    add(sph, fur, -0.11, 0.73, 0, 0.055, 0.055, 0.04);
    add(sph, fur, 0.11, 0.73, 0, 0.055, 0.055, 0.04);
    add(sph, light, 0, 0.57, 0.13, 0.06, 0.05, 0.05);
    add(sph, dark, 0, 0.59, 0.18, 0.02, 0.02, 0.02);
    add(sph, dark, -0.05, 0.64, 0.135, 0.018, 0.018, 0.018);
    add(sph, dark, 0.05, 0.64, 0.135, 0.018, 0.018, 0.018);
    add(sph, fur, -0.21, 0.34, 0.03, 0.06, 0.11, 0.06);
    add(sph, fur, 0.21, 0.34, 0.03, 0.06, 0.11, 0.06);
    add(sph, fur, -0.1, 0.07, 0.04, 0.08, 0.07, 0.09);
    add(sph, fur, 0.1, 0.07, 0.04, 0.08, 0.07, 0.09);
  }
  toy.position.set(BX, 0, TOY_Z);
  toy.userData.pickId = 'toy';
  scene.add(toy);
  const toyMeshes = toy.children.slice();
  addHitBox(toy, 0.6);

  // екран B (гледа към лампата) с решетка, за да се сравнява размерът на сянката
  const gridTex = canvasTex(256, 160, (x, w, h) => {
    x.fillStyle = '#f6f5f0'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(120,130,150,0.28)'; x.lineWidth = 2;
    for (let i = 1; i < 13; i++) { x.beginPath(); x.moveTo((i * w) / 13, 0); x.lineTo((i * w) / 13, h); x.stroke(); }
    for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(0, (i * h) / 8); x.lineTo(w, (i * h) / 8); x.stroke(); }
  });
  const screenB = new THREE.Group();
  {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(SCR_W, SCR_H), new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.9 }));
    face.position.y = SCR_H / 2 + 0.01;
    const back = new THREE.Mesh(new THREE.BoxGeometry(SCR_W + 0.08, SCR_H + 0.08, 0.04), mat(0x37474f));
    back.position.set(0, SCR_H / 2 + 0.01, -0.03);
    screenB.add(face, back);
  }
  screenB.position.set(BX, 0, SCR_Z);
  screenB.userData.pickId = 'screens';
  scene.add(screenB);

  // плоски сенки на мечето: върху екрана и върху масата
  const shMat = (planes) => new THREE.MeshBasicMaterial({ color: 0x232833, clippingPlanes: planes, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const P = (x, y, z, c) => new THREE.Plane(new V3(x, y, z), c);
  const scrShMat = shMat([P(1, 0, 0, -(BX - SCR_W / 2)), P(-1, 0, 0, BX + SCR_W / 2), P(0, 1, 0, -0.03), P(0, -1, 0, SCR_H)]);
  const tabShMat = shMat([P(0, 0, 1, 1.78), P(0, 0, -1, 2.38), P(1, 0, 0, 5.9), P(-1, 0, 0, 5.9)]);
  const mkShadow = (m) => {
    const g = new THREE.Group();
    g.matrixAutoUpdate = false;
    for (const c of toyMeshes) {
      const s = new THREE.Mesh(c.geometry, m);
      s.position.copy(c.position); s.scale.copy(c.scale); s.rotation.copy(c.rotation);
      s.raycast = () => {};
      s.frustumCulled = false; // матрицата е проективна — обичайната проверка не важи
      g.add(s);
    }
    g.visible = false;
    scene.add(g);
    return g;
  };
  const scrShadow = mkShadow(scrShMat);
  const tabShadow = mkShadow(tabShMat);
  const nScr = new V3(0, 0, 1); const nTab = new V3(0, 1, 0);
  const L4 = new THREE.Vector4();
  const Smat = new THREE.Matrix4();
  // Отсичането по ръбовете на екрана в шейдъра работи с координати преди делението на w,
  // затова мащабираме матрицата така, че w ≈ 1 в средата на мечето (проекцията не се променя).
  const normW = (m) => { const e = m.elements; const w = e[3] * 0 + e[7] * 0.4 + e[15]; if (Math.abs(w) > 1e-6) m.multiplyScalar(1 / w); };

  // ---------- лампа ----------
  const lamp = new THREE.Group();
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.05, 20), mat(0x263238));
  lampBase.position.y = 0.025;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 10), mat(0xb0bec5, { metalness: 0.6, roughness: 0.3 }));
  const head = new THREE.Group();
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.15, 0.18, 20, 1, true), mat(0xe53935, { side: THREE.DoubleSide }));
  shade.rotation.x = -Math.PI / 2; // широкият край сочи напред (+z на главата)
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0x777777 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 10), bulbMat);
  bulb.position.z = 0.02;
  head.add(shade, bulb);
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffe2a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  lampGlow.scale.set(0.7, 0.7, 1);
  lampGlow.raycast = () => {};
  head.add(lampGlow);
  const lampLight = new THREE.PointLight(0xffe2a8, 0, 0, 2);
  head.add(lampLight);
  lamp.add(lampBase, pole, head);
  lamp.userData.pickId = 'lamp';
  lamp.userData.dragId = 'lamp';
  scene.add(lamp);
  let lampOn = false;
  let lampH = LAMP_H;
  const lampState = { dist: 1.3, side: 0 };
  const setLampH = (h) => {
    lampH = h;
    pole.scale.y = h - 0.05; pole.position.y = 0.05 + (h - 0.05) / 2;
    head.position.y = h;
  };
  const placeLamp = () => {
    lamp.position.set(BX + lampState.side, 0, TOY_Z + lampState.dist);
  };
  setLampH(LAMP_H); placeLamp();
  addHitBox(lamp, 0.5);
  const setLamp = (on) => { lampOn = on; };
  const headW = new V3(); const toyAim = new V3();
  let screenShadowOn = true; let tableShadowOn = false;
  stage.tick((dt, t) => {
    toy.rotation.z = Math.sin(t * 1.2) * 0.07;
    toy.rotation.y = Math.sin(t * 0.5) * 0.12;
    toyAim.set(BX, 0.38, TOY_Z);
    head.getWorldPosition(headW);
    head.lookAt(toyAim);
    bulbMat.color.setHex(lampOn ? 0xfff4d0 : 0x777777);
    lampGlow.material.opacity = lampOn ? 0.85 + Math.sin(t * 2.3) * 0.08 : 0;
    lampLight.intensity = lampOn ? 2.6 : 0;
    toy.updateMatrixWorld(true);
    // „Сплескани“ копия на мечето от гледна точка на лампата.
    L4.set(headW.x, headW.y, headW.z, 1);
    scrShadow.visible = lampOn && screenShadowOn && screenB.visible;
    if (scrShadow.visible) {
      shadowMatrix(Smat, nScr, -(SCR_Z + 0.015), L4);
      scrShadow.matrix.multiplyMatrices(Smat, toy.matrixWorld);
      normW(scrShadow.matrix);
      scrShadow.matrixWorldNeedsUpdate = true;
    }
    tabShadow.visible = lampOn && tableShadowOn && headW.y > 0.95;
    if (tabShadow.visible) {
      shadowMatrix(Smat, nTab, -0.006, L4);
      tabShadow.matrix.multiplyMatrices(Smat, toy.matrixWorld);
      normW(tabShadow.matrix);
      tabShadow.matrixWorldNeedsUpdate = true;
    }
  });
  // Къде е центърът на сянката върху екрана (за проверки).
  const shadowCenterX = () => {
    const ls = TOY_Z + lampState.dist - SCR_Z; const lt = lampState.dist;
    return BX + lampState.side - lampState.side * (ls / lt);
  };

  // ---------- изглед и балончета ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.45, az = 0, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.08;
    stage.stopFollow();
    stage.flyTo([c[0] + Math.sin(az) * Math.cos(elev) * d, c[1] + Math.sin(elev) * d, c[2] + Math.cos(az) * Math.cos(elev) * d], c, dur);
  }
  const VIEWS = {
    all: () => fitView([0, 0.9, 0.1], 6.4, 1.6, 0.5, 0),
    rigA: () => fitView([-2.1, 0.6, RZ], 3.7, 1.0, 0.5, -0.45),
    torch: () => fitView([-4.6, 0.6, RZ], 1.3, 0.8, 0.45, -0.5),
    cards: () => fitView([-1.7, 0.7, RZ], 2.2, 0.9, 0.45, -0.5),
    screens: () => fitView([0.8, 0.7, RZ], 1.5, 0.9, 0.35, -0.75),
    rigB: () => fitView([BX, 0.5, 0.35], 2.0, 1.55, 0.78, 0),
    toy: () => fitView([BX, 0.5, -0.4], 1.2, 0.8, 0.35, 0),
    lamp: () => fitView([BX, 0.7, 0.1], 1.9, 1.2, 0.5, 0.35),
    sun: () => fitView([WIN.x - 0.3, 1.7, 0.2], 1.5, 2.1, 0.25, -0.25),
    table: () => fitView([BX, 0.7, -0.4], 2.0, 1.5, 0.6, 1.0),
  };
  let tip = null;
  function say(anchor, html, cls = '', lift = 0.5) {
    if (tip) tip.remove();
    if (narrowUI()) cls = cls.replace('wide', '');
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const ANCH = {
    torch: [new V3(XF - 0.3, HY, RZ), 0.4], cards: [new V3(XC[1], 1.2, RZ), 0.45], screens: [new V3(XS, 1.35, RZ), 0.15],
    toy: [new V3(BX, 0.8, TOY_Z), 0.15], lamp: [lamp, 0.65], sun: [new V3(WIN.x, WIN.y - 0.6, WIN.z + 0.5), 0.2],
  };
  const scrollStage = () => { try { shell.stageEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* няма значение */ } };

  // ---------- влачене (с отместване от точката на хващане) ----------
  let dragMode = null; // 'cards' | 'lamp' | null
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  const dragPlane = new THREE.Plane(); const hp = new V3();
  let drag = null;
  const el = renderer.domElement;
  const rayAt = (ev) => {
    const r = el.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(dragPlane, hp);
  };
  let onCardDrop = null; let onLampMove = null;
  const pdown = (ev) => {
    if (!dragMode) return;
    const hit = stage.pickAt(ev, 'dragId');
    if (!hit) return;
    const id = hit.root.userData.dragId;
    if ((dragMode === 'cards') !== id.startsWith('card')) return;
    dragPlane.set(new V3(0, 1, 0), -(id === 'lamp' ? lampH : HY));
    if (!rayAt(ev)) return;
    drag = { obj: hit.root, id, p0: hp.clone(), start: hit.root.position.clone(), side0: lampState.side, dist0: lampState.dist };
    stage.controls.enabled = false;
    try { el.setPointerCapture(ev.pointerId); } catch (e) { /* няма значение */ }
  };
  const pmove = (ev) => {
    if (!drag || !rayAt(ev)) return;
    const dx = hp.x - drag.p0.x; const dzz = hp.z - drag.p0.z;
    if (drag.id === 'lamp') {
      lampState.side = clamp(drag.side0 + dx, -0.9, 0.9);
      lampState.dist = clamp(drag.dist0 + dzz, 0.6, 2.4);
      placeLamp();
      if (onLampMove) onLampMove();
    } else {
      drag.obj.position.z = RZ + clamp(drag.start.z - RZ + dzz, -DZ_MAX, DZ_MAX);
    }
  };
  const pup = (ev) => {
    if (!drag) return;
    const d = drag; drag = null;
    stage.controls.enabled = true;
    try { el.releasePointerCapture(ev.pointerId); } catch (e) { /* няма значение */ }
    if (d.id !== 'lamp' && onCardDrop) onCardDrop(d.obj);
  };
  el.addEventListener('pointerdown', pdown, { capture: true });
  el.addEventListener('pointermove', pmove);
  el.addEventListener('pointerup', pup);
  el.addEventListener('pointercancel', pup);
  // Курсор „ръка“ над нещата, които може да се влачат.
  const phover = (ev) => {
    if (ev.pointerType && ev.pointerType !== 'mouse') return;
    if (drag) return;
    let c = '';
    if (dragMode) { const h = stage.pickAt(ev, 'dragId'); if (h && (dragMode === 'cards') === h.root.userData.dragId.startsWith('card')) c = 'grab'; }
    if (!c && clickHandler) { const h = stage.pickAt(ev); if (h) c = 'pointer'; }
    el.style.cursor = c;
  };
  el.addEventListener('pointermove', phover);

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null, hit); });

  function choiceBox(c, q, items, rightIdx, why, onRight, onWrong) {
    c.innerHTML = `<p class="light-q">${esc(q)}</p><div class="choices">${items.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
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

  // ---------- 1. Опознай ----------
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'В стаята',
    items: ITEMS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  function step1() {
    shell.step(0);
    menu.show(true);
    const seen = new Set();
    shell.task(`<p>Това е затъмнена стая с лабораторна маса. Тук ще проверим с опити <b>как се движи светлината</b>.</p>
      <p><b>Разгледай всичко в стаята:</b> кликни върху предметите или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата стая</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); VIEWS.all(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${ITEMS.length}`);
    upd();
    const visit = (id) => {
      const it = ITEM[id];
      if (id === 'torch') setTorch(true);
      if (id === 'lamp') setLamp(true);
      if (id === 'sun') blindsTo = 1;
      VIEWS[id]();
      say(ANCH[id][0], `<b>${esc(it.icon)} ${esc(it.label)}</b><br>${it.note}`, 'wide', ANCH[id][1]);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === ITEMS.length && next.disabled) { next.disabled = false; shell.msg('Разгледа всичко! Продължи напред.', 'good'); }
    };
    clickHandler = (id) => { if (!id || !ITEM[id]) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); step2(); });
    VIEWS.all();
  }

  // ---------- 2. Опитът с картоните ----------
  function step2() {
    shell.step(1);
    menu.show(false);
    clickHandler = null;
    clearTip();
    blindsTo = 0;
    setTorch(true);
    setLamp(false);
    cards.forEach((c, i) => { c.position.z = RZ + DZ0[i]; });
    guide.visible = false;
    VIEWS.rigA();
    let mistakes = 0;
    shell.task(`<p>Затворихме щорите и в стаята е тъмно. Фенерчето свети към <b>три картона с малки дупки</b>. Зад тях стои бял екран.</p>
      <p><b>Премести картоните</b> — влачи ги напред или назад, докато светлината стигне до екрана.</p>`);
    shell.setControls('<div class="row"><button class="btn view">🔭 Виж опита</button></div>').querySelector('.view').addEventListener('click', () => VIEWS.rigA());
    let lastN = -1;
    let done = false;
    dragMode = 'cards';
    const stopWatch = stage.tick(() => {
      if (beam.n !== lastN && !done) {
        lastN = beam.n;
        shell.score(`Светлината минава през ${beam.n} от 3 дупки.`);
      }
      if (beam.reached && !done && !drag) { done = true; reached(); }
    });
    // При пускане картонът „щраква“ точно на лъча, ако е съвсем близо.
    onCardDrop = (obj) => {
      const i = obj.userData.idx;
      if (i === 0) { if (Math.abs(dz(0)) < 0.07) obj.position.z = RZ; return; }
      const b = computeBeam();
      if (b.n >= i) {
        const zr = b.s * (XC[i] - XF);
        if (Math.abs(zr - dz(i)) < 0.13) obj.position.z = RZ + zr;
      }
    };
    async function reached() {
      dragMode = null;
      stopWatch();
      shell.score('Светлината минава през 3 от 3 дупки.');
      await wait(0.15);
      const sp = new V3(XS - 0.02, HY, RZ + beam.endZ);
      guidePts.setFromPoints([new V3(XF, HY, RZ), sp]);
      guide.computeLineDistances();
      guide.visible = true;
      say(sp, 'Светлината стигна до екрана! Виж пунктирната линия: фенерчето, трите дупки и петното са на <b>една права линия</b>.', 'wide good', 0.75);
      shell.msg('Браво! Светлината мина през трите дупки.', 'good');
      await wait(1.2);
      if (!alive) return;
      const box = shell.setControls('<div class="light-ask"></div>').querySelector('.light-ask');
      choiceBox(box, 'Кога светлината стигна до екрана?',
        ['Когато фенерчето и трите дупки са на една права линия.', 'Когато картоните са близо един до друг.', 'Винаги, щом фенерчето свети.'], 0,
        ['', 'Разстоянието между картоните не се промени. Ти местеше картоните напред и назад, докато дупките застанат на една линия.', 'В началото фенерчето също светеше, но светлината спираше на картона.'],
        () => { shell.msg('Вярно!', 'good'); askB(box); }, () => { mistakes++; });
    }
    function askB(box) {
      choiceBox(box, 'Сега ще преместя средния картон встрани. Какво ще стане със светлото петно на екрана?',
        ['Ще изчезне, защото картонът ще спре светлината.', 'Светлината ще заобиколи картона и пак ще стигне до екрана.', 'Петното ще стане по-ярко.'], 0,
        ['', 'Може ли светлината да завие, за да намери дупката? Помисли какво видя преди малко.', 'Картонът не прави светлината по-силна.'],
        async () => {
          shell.msg('Да видим!', 'good');
          guide.visible = false;
          clearTip();
          const z0 = cards[1].position.z;
          await phase(1.0, (k) => { cards[1].position.z = lerp(z0, RZ + 0.3, ease(k)); });
          say(new V3(XC[1], 1.2, cards[1].position.z), 'Петното на екрана изчезна. Светлината спря на картона. Във въздуха тя се движи <b>по права линия</b> и не завива към дупката.', 'wide', 0.4);
          shell.msg('Предсказа правилно! Светлината не заобикаля картона.', 'good');
          await wait(0.8);
          if (alive) askC(box);
        }, () => { mistakes++; });
    }
    function askC(box) {
      choiceBox(box, 'Какво доказва този опит?',
        ['Светлината се разпространява праволинейно — по права линия.', 'Светлината минава през картон.', 'Светлината минава само през малки дупки.'], 0,
        ['', 'Картонът спря светлината — тя мина само през дупките.', 'Светлината минава и без дупки, щом нищо не я спира. Важното е, че дупките бяха на една права линия.'],
        () => {
          scores.push(stepScore(mistakes, 2));
          shell.msg('Точно така! Светлината се разпространява праволинейно.', 'good');
          shell.setControls('<button class="btn primary">Напред →</button>').querySelector('button').addEventListener('click', step3);
        }, () => { mistakes++; });
    }
  }

  // ---------- 3. Сенките ----------
  function step3() {
    shell.step(2);
    dragMode = null; onCardDrop = null;
    clearTip();
    setTorch(false);
    setLamp(true);
    screenB.visible = true; screenShadowOn = true; tableShadowOn = false;
    setLampH(LAMP_H);
    lampState.dist = 1.3; lampState.side = 0; placeLamp();
    VIEWS.rigB();
    let mistakes = 0;
    const ROUNDS = [
      { q: 'Как ще се промени сянката на мечето, ако приближиш лампата до него?',
        a: ['Ще стане по-голяма.', 'Ще стане по-малка.', 'Няма да се промени.'], right: 0,
        why: ['', 'Помисли: колкото по-близо е лампата, толкова по-голяма част от светлината закрива мечето.', 'Размерът на сянката зависи от това къде е лампата.'],
        do: 'Сега провери: <b>приближи лампата</b> до мечето. Използвай плъзгача „близо – далеч“ или влачи самата лампа.',
        cond: () => lampState.dist <= 0.8,
        done: 'Сянката стана по-голяма! Близо до лампата мечето закрива по-широк сноп светлина (повече лъчи).' },
      { q: 'А какво ще стане със сянката, ако отдалечиш лампата?',
        a: ['Ще стане по-голяма.', 'Ще стане по-малка.', 'Ще изчезне.'], right: 1,
        why: ['Преди малко приближи лампата и сянката порасна. Сега правим обратното.', '', 'Докато мечето спира светлината, сянка има.'],
        do: 'Провери: <b>отдалечи лампата</b> от мечето.',
        cond: () => lampState.dist >= 2.0,
        done: 'Сянката стана по-малка. Когато лампата е далеч, мечето закрива по-тесен сноп светлина.' },
      { q: 'Ще преместиш лампата наляво. Накъде ще отиде сянката на екрана?',
        a: ['Наляво.', 'Надясно.', 'Няма да мръдне.'], right: 1,
        why: ['Светлината върви по права линия от лампата през мечето до екрана. Ако лампата е вляво, къде ще стигне тази линия?', '', 'Сянката е там, където мечето спира светлината. А пътят на светлината се променя, когато местиш лампата.'],
        do: 'Провери: <b>премести лампата наляво</b>.',
        cond: () => lampState.side <= -0.6,
        done: 'Сянката отиде надясно — от другата страна на мечето. Лампата, мечето и сянката винаги са на една права линия.' },
    ];
    let ri = 0;
    const ctrlHTML = `<div class="light-ask"></div>
      <label class="light-sl">Лампата: близо – далеч<input type="range" class="light-dist" min="0.6" max="2.4" step="0.05" value="${lampState.dist}" disabled><span class="light-ends"><span>близо до мечето</span><span>далеч</span></span></label>
      <label class="light-sl">Лампата: наляво – надясно<input type="range" class="light-side" min="-0.9" max="0.9" step="0.05" value="0" disabled><span class="light-ends"><span>наляво</span><span>надясно</span></span></label>`;
    const c = shell.setControls(ctrlHTML);
    const box = c.querySelector('.light-ask');
    const sDist = c.querySelector('.light-dist');
    const sSide = c.querySelector('.light-side');
    const syncSliders = () => { sDist.value = lampState.dist; sSide.value = lampState.side; };
    const enable = (on) => { sDist.disabled = sSide.disabled = !on; dragMode = on ? 'lamp' : null; };
    let checking = null;
    const check = () => { if (checking) checking(); };
    sDist.addEventListener('input', () => { lampState.dist = +sDist.value; placeLamp(); check(); });
    sSide.addEventListener('input', () => { lampState.side = +sSide.value; placeLamp(); check(); });
    onLampMove = () => { syncSliders(); check(); };
    shell.task('<p>Включихме лампата. Мечето спира част от светлината и на екрана се вижда неговата <b>сянка</b>.</p><p>Първо <b>предскажи</b>, после <b>провери</b>, като местиш лампата.</p><p class="small">Това е упражнение за любопитни — не носи точки.</p>');
    const upd = () => shell.score(`Опит ${Math.min(ri + 1, 4)} от 4 · упражнение без точки`);
    const round = () => {
      const R = ROUNDS[ri];
      upd();
      enable(false);
      checking = null;
      choiceBox(box, R.q, R.a, R.right, R.why, () => {
        shell.msg('');
        box.innerHTML = `<p class="light-q">${R.do}</p>`;
        enable(true);
        checking = () => {
          if (!R.cond()) return;
          checking = null;
          enable(false);
          say(new V3(BX - 1.2, 0.2, 0.6), R.done, 'wide good', 0.2);
          shell.msg('Предсказа правилно и го провери!', 'good');
          ri++;
          setTimeout(() => { if (!alive) return; if (ri < ROUNDS.length) round(); else predict(); }, 1400);
        };
        check();
      }, () => { mistakes++; });
    };
    // Последно: лампата е изключена, детето посочва къде ще падне сянката.
    const marks = [];
    async function predict() {
      upd();
      clearTip();
      setLamp(false);
      box.innerHTML = '<p class="light-q">Изключих лампата и я преместих.</p>';
      const s0 = lampState.side; const d0 = lampState.dist;
      await phase(1.0, (k) => { lampState.side = lerp(s0, 0.8, ease(k)); lampState.dist = lerp(d0, 1.0, ease(k)); placeLamp(); syncSliders(); });
      if (!alive) return;
      const expectX = shadowCenterX();
      [-0.75, 0, 0.75].forEach((ox, i) => {
        const g = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.13, 0.17, 28), new THREE.MeshBasicMaterial({ color: 0x0aa5a0 }));
        const disc = new THREE.Mesh(new THREE.CircleGeometry(0.13, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
        const lbl = labelSprite(String(i + 1), { size: 0.2 });
        lbl.position.z = 0.02;
        g.add(disc, ring, lbl);
        g.position.set(BX + ox, 0.75, SCR_Z + 0.03);
        g.userData.pickId = 'mark' + (i + 1);
        g.userData.ok = Math.abs(BX + ox - expectX) < 0.3;
        scene.add(g);
        addHitBox(g, 0.4);
        marks.push(g);
      });
      say(new V3(BX + 0.8, 0.6, TOY_Z + 1.0), 'Лампата е вдясно от мечето.', 'tag', 0.3);
      box.innerHTML = '<p class="light-q">Лампата е изключена и сега е <b>вдясно</b> от мечето. Когато я включим, къде ще падне сянката? <b>Кликни върху знака на екрана</b>.</p>';
      shell.score('Опит 4 от 4 · упражнение без точки');
      clickHandler = async (id) => {
        if (!id || !id.startsWith('mark')) return;
        const m = marks.find((g) => g.userData.pickId === id);
        if (!m.userData.ok) {
          mistakes++;
          m.visible = false;
          shell.msg('Не там. Светлината тръгва от лампата отдясно и минава покрай мечето по права линия. Сянката е от другата страна.', 'bad');
          return;
        }
        clickHandler = null;
        shell.msg('');
        setLamp(true);
        marks.forEach((g) => { g.visible = g === m; });
        await wait(0.6);
        marks.forEach((g) => { g.visible = false; });
        say(new V3(expectX, 1.3, SCR_Z), 'Позна! Лампата е вдясно, а сянката падна вляво. Лампата, мечето и сянката са на една права линия.', 'wide good', 0.3);
        shell.msg('Браво!', 'good');
        // Сенките (големина и посока) са от програмата за 5. клас — стъпката е упражнение без точки.
        box.innerHTML = '';
        shell.setControls('<button class="btn primary">Напред →</button>').querySelector('button').addEventListener('click', step4);
      };
    }
    round();
  }

  // ---------- 4. Приложи и предскажи ----------
  function step4() {
    shell.step(3);
    clickHandler = null; dragMode = null; onLampMove = null;
    clearTip();
    let good = 0;
    const QS = [
      { q: 'Приятелят ти се е скрил зад ъгъла на къщата. Чуваш го, но не го виждаш. Защо?',
        a: ['Във въздуха светлината се движи по права линия. Тя не завива зад ъгъла към очите ми.', 'Защото зад ъгъла винаги е тъмно.', 'Защото светлината се движи по-бавно от звука.'], right: 0,
        explain: 'Виждаме нещо, когато светлина от него стигне до очите ни. Светлината се движи по права линия и не заобикаля ъгли — точно като при картоните.',
        setup: () => { setLamp(false); setTorch(true); cards.forEach((c) => { c.position.z = RZ; }); VIEWS.rigA(); },
        after: async () => {
          const z0 = cards[1].position.z;
          await phase(0.9, (k) => { cards[1].position.z = lerp(z0, RZ + 0.3, ease(k)); });
          say(new V3(XC[1], 1.2, cards[1].position.z), 'Картонът е като ъгъла на къщата: светлината спира и не завива зад него.', 'wide', 0.4);
        } },
      { q: 'Защо зад предмет, осветен от лампа, се образува сянка?',
        a: ['Сянката е отражение на предмета, като в огледало.', 'Предметът спира светлината, а тя не завива зад него.', 'Лампата свети само встрани.'], right: 1,
        explain: 'Светлината се движи по права линия. Където предметът я спре, остава тъмно място — сянка.',
        setup: () => { setTorch(false); setLamp(true); screenB.visible = true; screenShadowOn = true; lampState.dist = 1.1; lampState.side = 0; placeLamp(); VIEWS.rigB(); },
        after: async () => { say(new V3(BX, 1.25, SCR_Z), 'Мечето спира светлината. Зад него, на екрана, остава сянка.', 'wide', 0.3); } },
      { q: 'В тъмна прашна стая през процеп на завесите влиза слънчев лъч. Как изглежда той?',
        a: ['Като права светла ивица.', 'Като крива светла змийка.', 'Като светло кръгче само около прозореца.'], right: 0,
        explain: 'Прашинките във въздуха отразяват светлината към очите ни. Затова виждаме пътя на лъча — права ивица от прозореца до масата.',
        setup: () => { setLamp(false); blindsTo = 0; VIEWS.sun(); },
        after: async () => { blindsTo = 1; await wait(0.8); say(ANCH.sun[0], 'Виж! Слънчевият лъч е права светла ивица от прозореца до масата.', 'wide', 0.2); } },
      { q: 'По обед слънцето е високо и сенките са къси. Вечер слънцето е ниско. Каква ще бъде сянката на мечето, ако свалим лампата ниско?',
        a: ['По-дълга.', 'По-къса.', 'Същата.'], right: 0, predict: true, free: true, // сенките са от 5. клас — без точки
        explain: 'Когато лампата е ниско, лъчите идват почти хоризонтално. Мечето ги спира и тъмното място зад него става дълго. Затова вечер сенките са дълги.',
        setup: async () => {
          blindsTo = 0; setTorch(false); screenB.visible = false; screenShadowOn = false; tableShadowOn = true;
          lampState.dist = 1.2; lampState.side = 0; placeLamp(); setLampH(2.6); setLamp(true); VIEWS.table();
          say(lamp, 'Лампата е високо като слънцето по обед.', 'tag', 0.2);
        },
        after: async () => {
          clearTip();
          await phase(2.4, (k) => setLampH(lerp(2.6, 1.15, ease(k))));
          say(new V3(BX, 0.1, TOY_Z - 1.0), 'Лампата слезе ниско и сянката на мечето стана много по-дълга — като вечерните сенки.', 'wide good', 0.3);
        } },
    ];
    let qi = 0;
    const ask = async () => {
      const Q = QS[qi];
      clearTip();
      shell.msg('');
      shell.score('');
      shell.task(`<p>${Q.predict ? 'Предскажи' : 'Приложи наученото'} (${qi + 1} от ${QS.length}).</p>${Q.free ? '<p class="small">Това е упражнение за любопитни — не носи точки.</p>' : ''}<div class="light-p"></div>`);
      shell.setControls('');
      await Q.setup();
      const bx = container.querySelector('.light-p');
      bx.innerHTML = `<p class="light-q">${esc(Q.q)}</p><div class="choices">${Q.a.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
      bx.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', async () => {
        const i = +b.dataset.i;
        bx.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        const ok = i === Q.right;
        if (ok && !Q.free) good++;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) bx.querySelector(`.choice[data-i="${Q.right}"]`).classList.add('right');
        shell.msg((ok ? 'Вярно! ' : 'Не е така. ') + Q.explain, ok ? 'good' : 'bad');
        scrollStage();
        await Q.after();
        if (!alive) return;
        qi++;
        const last = qi >= QS.length;
        const c = shell.setControls(`<button class="btn primary">${last ? 'Виж резултата' : 'Следващ въпрос →'}</button>`);
        c.querySelector('button').addEventListener('click', () => {
          if (!last) { ask(); return; }
          clearTip();
          scores.push(good / QS.filter((q) => !q.free).length);
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
      alive = false;
      el.removeEventListener('pointerdown', pdown, { capture: true });
      el.removeEventListener('pointermove', pmove);
      el.removeEventListener('pointermove', phover);
      el.removeEventListener('pointerup', pup);
      el.removeEventListener('pointercancel', pup);
      menu.remove();
      GLOW.dispose(); patchTex.dispose(); gridTex.dispose();
      stage.dispose();
    },
  };
}
