// 5.3.6 „Дихателна система на човека“ — прозрачен модел с живо дишане и увеличена алвеола.
// Стъпки: опознай → пътят на въздуха → как дишаме (диафрагма) → газообмен, дим и превенция.
import { createStage, labelSprite, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { injectStyle, organMat, glassMat, curveOf, tube, hitTube, glowOf, choicesHTML } from './anatomy.js';

const PARTS = [
  { id: 'nose', label: 'Носна кухина', icon: '👃', glow: 0xffb74d,
    note: 'Въздухът влиза през ноздрите. Тук той се затопля, овлажнява и очиства: косъмчетата и слузта задържат праха и микробите.' },
  { id: 'pharynx', label: 'Гълтач', icon: '🔻', glow: 0xffa36c,
    note: 'Общ път за въздуха и храната. От гълтача въздухът продължава към гръкляка, а храната — към хранопровода.' },
  { id: 'larynx', label: 'Гръкляк (ларинкс)', icon: '🗣️', glow: 0xffd54f,
    note: 'Хрущялна тръба с гласните връзки — с тях говорим. При преглъщане надгръкляникът затваря входа му, за да не влезе храна.' },
  { id: 'trachea', label: 'Трахея', icon: '🦴', glow: 0x81d4fa,
    note: 'Дихателната тръба. Хрущялните полупръстени я държат винаги отворена. Ресничките и слузта по стената ѝ изхвърлят праха нагоре.' },
  { id: 'bronchi', label: 'Бронхи', icon: '🌳', glow: 0x4fc3f7,
    note: 'Трахеята се разделя на два бронха — към левия и към десния бял дроб. В дробовете те се разклоняват като дърво на тънки бронхиоли.' },
  { id: 'lungs', label: 'Бели дробове', icon: '🫁', glow: 0xff8a80,
    note: 'Два меки, гъбести органа в гръдния кош. Десният има три дяла, а левият — два, защото до него е сърцето.' },
  { id: 'alveoli', label: 'Алвеоли', icon: '🫧', glow: 0xff4081,
    note: 'Белодробни мехурчета в края на бронхиолите — около 300 милиона! Обвити са с капиляри. Тук кислородът минава в кръвта, а въглеродният диоксид — от кръвта във въздуха.' },
  { id: 'diaphragm', label: 'Диафрагма', icon: '⛰️', glow: 0xff7043,
    note: 'Мускул като купол под белите дробове. Когато се свие, слиза надолу и въздухът влиза. Когато се отпусне, се качва и въздухът излиза.' },
];
const byId = Object.fromEntries(PARTS.map((p) => [p.id, p]));
const ORDER = ['nose', 'pharynx', 'larynx', 'trachea', 'bronchi', 'alveoli'];
const NEXT_HINT = {
  pharynx: 'Зад носната кухина въздухът слиза в общия път за въздух и храна.',
  larynx: 'Следва хрущялната тръба с гласните връзки.',
  trachea: 'Следва дългата тръба с хрущялни полупръстени.',
  bronchi: 'Тръбата се разделя на две — към двата дроба.',
  alveoli: 'Накрая въздухът стига до най-малките мехурчета.',
};

const CSS = `
.breathing-hud { position: absolute; top: 8px; right: 8px; z-index: 4; pointer-events: none; display: grid; gap: 4px;
  background: rgba(255,255,255,0.95); border: 1px solid #c7d3e0; border-radius: 10px; padding: 7px 10px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12); font-size: 0.82rem; min-width: 170px; max-width: 220px; }
.breathing-hud[hidden] { display: none; }
.breathing-hud b { font-weight: 800; }
.breathing-hud .breathing-state { font-weight: 800; font-size: 0.9rem; }
.breathing-hud .breathing-state.in { color: #1565c0; }
.breathing-hud .breathing-state.out { color: #7b1fa2; }
.breathing-hud .breathing-bar { height: 6px; border-radius: 99px; background: #e5e9f0; overflow: hidden; }
.breathing-hud .breathing-bar i { display: block; height: 100%; width: 30%; border-radius: 99px; }
.breathing-hud .breathing-leg { display: flex; align-items: center; gap: 6px; }
.breathing-hud .breathing-dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; flex: none; }
.breathing-dia { display: grid; gap: 4px; }
.breathing-dia .breathing-ends { display: flex; justify-content: space-between; font-size: 0.78rem; color: #5b6573; }
.breathing-airs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.breathing-airs .btn { padding-left: 2px; padding-right: 2px; font-size: 0.82rem; }
.breathing-airs .btn.on { outline: 3px solid #1865f2; outline-offset: 1px; }
.choices.breathing-multi .choice.on::before { content: "☑"; color: #1865f2; }
.choices.breathing-multi .choice:not(.on)::before { content: "☐"; color: #8a94a3; }
@media (max-width: 520px) { .breathing-hud { font-size: 0.74rem; min-width: 130px; max-width: 160px; padding: 5px 7px; } }
`;

// ---------- модели ----------
function lungGeo(side) {
  const geo = new THREE.SphereGeometry(1, 30, 22);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i); let y = p.getY(i); let z = p.getZ(i);
    const taper = 1 - 0.42 * Math.max(0, y);
    x *= taper; z *= taper;
    if (x * side < 0) x *= 0.42; // плоска вътрешна страна
    if (y < -0.4) y = -0.4 - (y + 0.4) * 0.35 + 0.25 * (1 - x * x); // вдлъбната основа върху диафрагмата
    p.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Бронхиално дърво: връща сегменти и пътища до върховете.
function growTree(side) {
  const segs = [];
  const tips = [];
  const root = new THREE.Vector3(side * 0.36, 2.06, 0.03);
  function grow(p, dir, len, r, depth, chain) {
    const q = p.clone().add(dir.clone().multiplyScalar(len));
    segs.push({ a: p.clone(), b: q.clone(), r });
    const ch = [...chain, q.clone()];
    if (depth === 0) { tips.push(ch); return; }
    for (const s of [-1, 1]) {
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), s * (0.5 + depth * 0.05));
      d.z += s * 0.25 * (depth % 2 ? 1 : -1);
      d.normalize();
      grow(q, d, len * 0.72, r * 0.7, depth - 1, ch);
    }
  }
  grow(root, new THREE.Vector3(side * 0.45, -0.9, 0).normalize(), 0.32, 0.032, 3, [root.clone()]);
  return { segs, tips };
}

function cluster(center, n, r, m) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const rr = Math.sqrt(1 - y * y);
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m);
    s.position.set(Math.cos(a) * rr * r * 1.5, y * r * 1.5, Math.sin(a) * rr * r * 1.5);
    g.add(s);
  }
  g.position.copy(center);
  return g;
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  injectStyle('breathing-style', CSS);
  const STEPS = ['Опознай дихателната система', 'Пътят на въздуха', 'Как дишаме?', 'В алвеолата'];
  const shell = createShell(container, { steps: STEPS });
  const HOME = { pos: [2.4, 2.75, 6.7], tgt: [0.2, 2.35, 0] };
  const stage = createStage(shell.stageEl, {
    background: 0xeaf3fb, camPos: HOME.pos, target: HOME.tgt, minDistance: 1.2, maxDistance: 14, maxPolarAngle: Math.PI * 0.62,
  });
  const { scene, camera } = stage;

  const world = new THREE.Group();
  scene.add(world);
  // Фон: мек подиум.
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.3, 48), new THREE.MeshStandardMaterial({ color: 0xd5e3f0, roughness: 0.8 }));
  podium.position.y = 0.15;
  world.add(podium);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 32), new THREE.MeshStandardMaterial({ color: 0xdfe9f3, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  world.add(floor);

  // Прозрачно тяло (бюст).
  const skin = glassMat(0xffd2b8, 0.2, { emissive: 0xffa070, emissiveIntensity: 0.06 });
  const rim = glassMat(0xd99a7c, 0.25, { side: THREE.BackSide });
  const skinPart = (geo) => {
    const m = new THREE.Mesh(geo, skin);
    m.renderOrder = 3;
    const o = new THREE.Mesh(geo, rim);
    o.scale.setScalar(1.025);
    o.renderOrder = 2;
    m.add(o);
    return m;
  };
  const prof = [[0.78, 0.3], [0.95, 0.6], [1.0, 1.2], [1.02, 1.8], [1.08, 2.4], [1.0, 2.75], [0.7, 2.98], [0.3, 3.05], [0, 3.06]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const torso = skinPart(new THREE.LatheGeometry(prof, 40));
  torso.scale.z = 0.6;
  world.add(torso);
  const neck = skinPart(new THREE.CylinderGeometry(0.24, 0.27, 0.5, 20, 1, true));
  neck.position.set(0, 3.2, -0.02);
  world.add(neck);
  const headG = new THREE.Group();
  headG.position.set(0, 3.92, 0);
  world.add(headG);
  const headSkin = skinPart(new THREE.SphereGeometry(0.62, 36, 28));
  headSkin.scale.set(0.92, 1.05, 1);
  headG.add(headSkin);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 16, 0, Math.PI * 2, 0, 1.15), organMat(0x4e342e, { roughness: 0.85 }));
  hair.scale.set(0.95, 1.08, 1.03);
  hair.rotation.x = -0.55;
  headG.add(hair);
  const noseSkin = skinPart(new THREE.ConeGeometry(0.09, 0.26, 12));
  noseSkin.rotation.x = 0.35;
  noseSkin.position.set(0, -0.08, 0.64);
  headG.add(noseSkin);
  const eyeM = organMat(0x2a1d1a, { roughness: 0.3 });
  const eyes = [];
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), eyeM);
    e.position.set(s * 0.19, 0.06, 0.55);
    headG.add(e);
    eyes.push(e);
    const ear = skinPart(new THREE.SphereGeometry(0.1, 12, 8));
    ear.scale.set(0.5, 1, 0.8);
    ear.position.set(s * 0.57, 0, -0.02);
    headG.add(ear);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 6, 16, Math.PI), organMat(0xb5403f));
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.3, 0.55);
  headG.add(mouth);

  // Ребра.
  const ribM = new THREE.MeshStandardMaterial({ color: 0xf2e7d0, roughness: 0.6, transparent: true, opacity: 0.75 });
  const ribs = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const y = 2.5 - i * 0.24;
    const r = 0.82 + Math.min(i, 3) * 0.04;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(r, 0.028, 6, 36, Math.PI * 1.7), ribM);
    rib.rotation.x = Math.PI / 2 + 0.25;
    rib.rotation.z = Math.PI * 0.65;
    rib.scale.set(1, 0.6, 1);
    rib.position.set(0, y, -0.02);
    ribs.add(rib);
  }
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.6, 10), ribM);
  spine.position.set(0, 1.75, -0.5);
  ribs.add(spine);
  world.add(ribs);

  // --- органи ---
  const parts = {};
  const pick = (id, g) => { g.userData.pickId = id; parts[id] = g; world.add(g); return g; };
  const airM = (c) => organMat(c, { roughness: 0.45 });
  // носна кухина
  const nose = new THREE.Group();
  const noseCurve = curveOf([[0, 3.74, 0.72], [0, 3.84, 0.56], [0, 3.92, 0.34], [0, 3.88, 0.1]]);
  const noseTube = tube(noseCurve, 0.075, airM(0xffc98a), 24, 10);
  noseTube.scale.x = 1;
  nose.add(noseTube);
  for (const [y, z] of [[3.95, 0.35], [3.86, 0.38], [3.77, 0.4]]) {
    for (const s of [1, -1]) {
      const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.28, 4, 8), airM(0xf0a870));
      t.rotation.x = Math.PI / 2;
      t.position.set(s * 0.06, y - 0.02, z - 0.05);
      nose.add(t);
    }
  }
  pick('nose', nose);
  addHitBox(nose, 0.3);
  // гълтач
  const pharCurve = curveOf([[0, 3.88, 0.1], [0, 3.78, -0.08], [0, 3.5, -0.1], [0, 3.28, -0.04], [0, 3.16, 0.04]]);
  const pharynx = new THREE.Group();
  pharynx.add(tube(pharCurve, 0.085, airM(0xff9f6e), 24, 10));
  pharynx.add(hitTube(pharCurve, 0.13));
  pick('pharynx', pharynx);
  // хранопровод (след гълтача, зад трахеята) — само за ориентир
  world.add(tube([[0, 3.2, -0.12], [0, 2.8, -0.16], [0, 2.2, -0.18], [0.05, 1.4, -0.12]], 0.05, organMat(0xe8c7b0, { transparent: true, opacity: 0.7 }), 16));
  // гръкляк
  const larynx = new THREE.Group();
  larynx.position.set(0, 3.04, 0.06);
  const larM = airM(0xf7d070);
  const lc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.24, 16), larM);
  larynx.add(lc);
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.05), larM);
  shield.position.set(0, 0.03, 0.09);
  shield.rotation.x = -0.2;
  larynx.add(shield);
  const epi = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), airM(0xf4b860));
  epi.scale.set(1, 0.3, 0.6);
  epi.position.set(0, 0.15, -0.04);
  epi.rotation.x = -0.6;
  larynx.add(epi);
  pick('larynx', larynx);
  addHitBox(larynx, 0.3);
  // трахея
  const trachea = new THREE.Group();
  const traCurve = curveOf([[0, 2.92, 0.07], [0, 2.6, 0.06], [0, 2.32, 0.05]]);
  const traM = airM(0x9fd3f0);
  trachea.add(tube(traCurve, 0.06, traM, 12, 12));
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.014, 6, 18, Math.PI * 1.6), traM);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = Math.PI * 0.7;
    ring.position.set(0, 2.38 + i * 0.07, 0.055);
    trachea.add(ring);
  }
  trachea.add(hitTube(traCurve, 0.12));
  pick('trachea', trachea);
  // бронхи и бронхиоли
  const bronchi = new THREE.Group();
  const bM = airM(0x5ab4e5);
  const trees = {};
  for (const s of [1, -1]) {
    const main = curveOf([[0, 2.32, 0.05], [s * 0.18, 2.2, 0.04], [s * 0.36, 2.06, 0.03]]);
    bronchi.add(tube(main, 0.045, bM, 12, 10));
    bronchi.add(hitTube(main, 0.11));
    const tr = growTree(s);
    for (const sg of tr.segs) bronchi.add(tube([sg.a, sg.b], sg.r, bM, 2, 6));
    trees[s] = { main, tips: tr.tips };
  }
  pick('bronchi', bronchi);
  // бели дробове
  const lungs = new THREE.Group();
  const lungM = organMat(0xf28b97, { transparent: true, opacity: 0.62, depthWrite: false, roughness: 0.7 });
  const lobes = [];
  for (const s of [1, -1]) {
    const l = new THREE.Mesh(lungGeo(s), lungM);
    l.userData.base = new THREE.Vector3(s > 0 ? 0.4 : 0.44, 0.72, 0.36);
    l.scale.copy(l.userData.base);
    l.position.set(s * 0.5, 1.78, 0);
    l.renderOrder = 1;
    lungs.add(l);
    lobes.push(l);
  }
  pick('lungs', lungs);
  // малки алвеоли в краищата на бронхиолите (украса)
  const alvSmallM = organMat(0xff6f91);
  for (const s of [1, -1]) for (const ch of trees[s].tips) world.add(cluster(ch[ch.length - 1], 5, 0.022, alvSmallM));
  // увеличени алвеоли до левия бял дроб
  const alveoli = new THREE.Group();
  const tipL = trees[1].tips[trees[1].tips.length - 1];
  const tipPoint = tipL[tipL.length - 1].clone();
  const insetPos = new THREE.Vector3(1.6, 1.05, 0.5);
  alveoli.position.copy(insetPos);
  const alvM = organMat(0xff6f91, { roughness: 0.5 });
  alveoli.add(tube([[0, 0.38, 0], [0, 0.18, 0], [0, 0.02, 0]], 0.05, airM(0x5ab4e5), 8, 8));
  const grape = cluster(new THREE.Vector3(0, -0.12, 0), 11, 0.085, alvM);
  alveoli.add(grape);
  const capM = organMat(0xd32f2f);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.02, 0.012, 6, 28), capM);
    c.position.y = -0.2 + i * 0.1;
    c.rotation.x = Math.PI / 2 + i * 0.4;
    alveoli.add(c);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.33, 40), new THREE.MeshBasicMaterial({ color: 0x8a6fd1, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  ring.position.y = -0.05;
  alveoli.add(ring);
  pick('alveoli', alveoli);
  addHitBox(alveoli, 0.6);
  const lensLbl = labelSprite('увеличено', { size: 0.13, color: '#5e35b1', border: '#b39ddb' });
  lensLbl.position.set(0, 0.5, 0);
  alveoli.add(lensLbl);
  stage.steadyLabel(lensLbl, 6.5);
  const lineGeo = new THREE.BufferGeometry().setFromPoints([tipPoint, insetPos.clone().add(new THREE.Vector3(-0.22, 0.05, 0))]);
  const lensLine = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({ color: 0x8a6fd1, dashSize: 0.05, gapSize: 0.035 }));
  lensLine.computeLineDistances();
  world.add(lensLine);
  // диафрагма
  const diaphragm = new THREE.Group();
  const diaM = organMat(0xc4574f, { roughness: 0.6, side: THREE.DoubleSide });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, 1.05), diaM);
  dome.scale.set(0.98, 0.42, 0.6);
  diaphragm.add(dome);
  diaphragm.position.y = 0.62;
  pick('diaphragm', diaphragm);
  // сърце (за ориентир — кръвта)
  const heart = new THREE.Group();
  const hm = organMat(0xc62828, { roughness: 0.45 });
  for (const x of [-0.06, 0.06]) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), hm); s.position.set(x, 0.05, 0); heart.add(s); }
  const hc = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 18), hm);
  hc.rotation.z = Math.PI;
  hc.position.y = -0.1;
  heart.add(hc);
  heart.rotation.z = 0.5;
  heart.position.set(0.16, 1.62, 0.18);
  world.add(heart);

  const glows = {};
  for (const p of PARTS) glows[p.id] = glowOf(parts[p.id]);
  const anchors = {
    nose: [0, 4.0, 0.7], pharynx: [0, 3.62, -0.1], larynx: [0, 3.18, 0.12], trachea: [0, 2.72, 0.1],
    bronchi: [0.3, 2.22, 0.05], lungs: [0.6, 2.45, 0], alveoli: [1.6, 1.42, 0.5], diaphragm: [0.45, 1.0, 0.35],
  };
  const anchorObj = {};
  for (const [id, p] of Object.entries(anchors)) { const a = new THREE.Object3D(); a.position.set(...p); world.add(a); anchorObj[id] = a; }
  const focusObj = {};
  const focusPts = {
    nose: [0, 3.86, 0.4], pharynx: [0, 3.5, -0.05], larynx: [0, 3.04, 0.06], trachea: [0, 2.62, 0.06],
    bronchi: [0, 2.05, 0.03], lungs: [0, 1.85, 0], alveoli: [1.6, 1.05, 0.5], diaphragm: [0, 0.9, 0],
  };
  for (const [id, p] of Object.entries(focusPts)) { const a = new THREE.Object3D(); a.position.set(...p); world.add(a); focusObj[id] = a; }

  // --- пътища на въздуха и частици ---
  const trunk = [[0, 3.72, 0.78], [0, 3.84, 0.56], [0, 3.92, 0.34], [0, 3.86, 0.08], [0, 3.72, -0.08], [0, 3.48, -0.09], [0, 3.26, -0.02], [0, 3.06, 0.06], [0, 2.8, 0.065], [0, 2.4, 0.055]];
  const paths = [];
  for (const s of [1, -1]) {
    for (const ch of trees[s].tips) {
      paths.push(curveOf([...trunk.map((p) => new THREE.Vector3(...p)), new THREE.Vector3(s * 0.18, 2.2, 0.04), ...ch]));
    }
  }
  const mainPath = curveOf([...trunk.map((p) => new THREE.Vector3(...p)), new THREE.Vector3(0.18, 2.2, 0.04), ...tipL]);
  const N_AIR = 70;
  const airGeo = new THREE.SphereGeometry(0.028, 8, 6);
  const airMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false });
  const air = new THREE.InstancedMesh(airGeo, airMat, N_AIR);
  air.renderOrder = 15;
  air.frustumCulled = false;
  world.add(air);
  const airP = Array.from({ length: N_AIR }, (_, i) => ({ path: paths[i % paths.length], u: Math.random(), sp: 0.8 + Math.random() * 0.5 }));
  const IN_COL = new THREE.Color(0x29b6f6);
  const OUT_COL = new THREE.Color(0xab47bc);
  const dummy = new THREE.Object3D();
  const tmpV = new THREE.Vector3();

  // HUD.
  const hud = document.createElement('div');
  hud.className = 'breathing-hud';
  hud.hidden = true;
  stage.overlay.parentElement.appendChild(hud);
  function hudBreath() {
    hud.innerHTML = `<div class="breathing-state">—</div>
      <div>Обем на белите дробове</div><div class="breathing-bar"><i class="vol" style="background:#ef8a96"></i></div>
      <div class="breathing-leg"><span class="breathing-dot" style="background:#29b6f6"></span>вдишан въздух</div>
      <div class="breathing-leg"><span class="breathing-dot" style="background:#ab47bc"></span>издишан въздух</div>`;
  }

  // --- дишане ---
  const br = { b: 0, prevB: 0, auto: true, phase: 0, flow: 0, rate: 14, enabled: true };
  let blinkT = 2;
  stage.tick((dt, t) => {
    if (!world.visible) return;
    if (br.auto) {
      br.phase = (br.phase + (dt * br.rate) / 60) % 1;
      br.b = 0.5 - 0.5 * Math.cos(br.phase * Math.PI * 2);
    }
    const db = (br.b - br.prevB) / Math.max(dt, 1e-3);
    br.prevB = br.b;
    br.flow += (db - br.flow) * Math.min(1, dt * 8);
    const b = br.b;
    // диафрагмата слиза и се сплесква при вдишване
    diaphragm.position.y = 0.62 - 0.2 * b;
    dome.scale.y = 0.42 - 0.16 * b;
    for (const l of lobes) {
      const s0 = l.userData.base;
      l.scale.set(s0.x * (1 + 0.1 * b), s0.y * (1 + 0.16 * b), s0.z * (1 + 0.1 * b));
      l.position.y = 1.78 - 0.11 * b;
    }
    ribs.scale.set(1 + 0.04 * b, 1, 1 + 0.07 * b);
    ribs.position.y = 0.05 * b;
    torso.scale.set(1 + 0.03 * b, 1, 0.6 * (1 + 0.06 * b));
    // частици въздух
    if (br.enabled) {
      const f = br.flow;
      const col = f >= 0 ? IN_COL : OUT_COL;
      for (let i = 0; i < N_AIR; i++) {
        const a = airP[i];
        a.u += f * dt * 0.55 * a.sp;
        if (a.u > 1) { a.u -= 1; a.path = paths[(Math.random() * paths.length) | 0]; }
        if (a.u < 0) { a.u += 1; a.path = paths[(Math.random() * paths.length) | 0]; }
        a.path.getPointAt(a.u, tmpV);
        dummy.position.copy(tmpV);
        const fade = Math.min(1, Math.abs(f) * 3);
        dummy.scale.setScalar(0.35 + 0.65 * fade);
        dummy.updateMatrix();
        air.setMatrixAt(i, dummy.matrix);
        air.setColorAt(i, col);
      }
      air.instanceMatrix.needsUpdate = true;
      if (air.instanceColor) air.instanceColor.needsUpdate = true;
    }
    air.visible = br.enabled;
    // сърце
    const hb = (t * 1.2) % 1;
    heart.scale.setScalar(1 + (hb < 0.15 ? Math.sin((hb / 0.15) * Math.PI) * 0.12 : 0));
    blinkT -= dt;
    for (const e of eyes) e.scale.y = blinkT < 0.12 ? 0.15 : 1;
    if (blinkT < 0) blinkT = 2.5 + Math.random() * 2.5;
    headG.rotation.y = Math.sin(t * 0.3) * 0.05;
    // светене
    for (const id of Object.keys(glows)) {
      const fl = flash.get(id);
      if (fl) {
        fl.k -= dt;
        glows[id].set(Math.max(0, fl.k) * 0.8, fl.color);
        if (fl.k <= 0) { flash.delete(id); if (!lit.has(id)) glows[id].set(0); }
      } else if (id === glowId) glows[id].set(0.35 + 0.25 * Math.sin(t * 4), byId[id].glow);
      else if (lit.has(id)) glows[id].set(0.3, byId[id].glow);
    }
    // HUD
    if (!hud.hidden && hudMode === 'breath') {
      const st = hud.querySelector('.breathing-state');
      const f = br.flow;
      if (f > 0.05) { st.textContent = '⬇ Вдишване: въздухът влиза'; st.className = 'breathing-state in'; }
      else if (f < -0.05) { st.textContent = '⬆ Издишване: въздухът излиза'; st.className = 'breathing-state out'; }
      else { st.textContent = '⏸ Пауза'; st.className = 'breathing-state'; }
      hud.querySelector('.vol').style.width = `${25 + 75 * b}%`;
    }
  });
  let hudMode = '';
  let glowId = null;
  const lit = new Set();
  const flash = new Map();
  function setGlow(id) {
    if (glowId && glowId !== id && !lit.has(glowId)) glows[glowId].set(0);
    glowId = id;
  }

  let tip = null;
  function say(id, html, cls = '') {
    clearTip();
    tip = stage.bubble(anchorObj[id], html, { lift: 0.05, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null, hit); });
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Части',
    items: PARTS.map((p) => ({ id: p.id, label: p.label, icon: p.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  function overview(dur = 1) {
    stage.stopFollow();
    stage.flyTo(HOME.pos, HOME.tgt, dur);
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    setGlow(null);
    menu.show(true);
    br.auto = true;
    br.enabled = true;
    hud.hidden = true;
    const seen = new Set();
    shell.task(`<p>Това е дихателната система на човек. Виж как диша: въздухът (сини точки) влиза, а издишаният (лилави точки) излиза.</p>
      <p><b>Разгледай всички части</b> от менюто или с клик върху тях.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Целият модел</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); setGlow(null); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${PARTS.length}`);
    upd();
    const visit = (id) => {
      const p = byId[id];
      const dist = { nose: 1.9, pharynx: 2.0, larynx: 1.9, trachea: 2.2, bronchi: 2.6, lungs: 3.6, alveoli: 1.9, diaphragm: 3.4 }[id];
      stage.focusOn(focusObj[id], { dist, height: 0.35, lift: 0.05 });
      setGlow(id);
      say(id, `<b>${p.icon} ${esc(p.label)}</b><br>${esc(p.note)}`);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === PARTS.length) { next.disabled = false; shell.msg('Браво! Разгледа всички части.', 'good'); }
    };
    clickHandler = (id) => { if (!id) { clearTip(); setGlow(null); menu.setActive(null); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Пътят на въздуха ----------
  const tags = [];
  let ball = null;
  function step2() {
    shell.step(1);
    clearTip();
    setGlow(null);
    menu.show(false);
    menuHandler = null;
    overview();
    br.enabled = false;
    br.auto = true;
    // топче въздух, което следва детето
    ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: 0x29b6f6, transparent: true, opacity: 0.95, depthTest: false }));
    ball.renderOrder = 16;
    world.add(ball);
    const uOf = {};
    const near = (pt) => {
      let best = 0; let bd = 1e9;
      for (let k = 0; k <= 200; k++) { mainPath.getPointAt(k / 200, tmpV); const d = tmpV.distanceTo(pt); if (d < bd) { bd = d; best = k / 200; } }
      return best;
    };
    for (const id of ORDER) uOf[id] = id === 'alveoli' ? 1 : near(focusObj[id].position);
    uOf.nose = 0.1;
    let u0 = 0; let u1 = 0;
    mainPath.getPointAt(0, ball.position);
    const stopBall = stage.tick((dt) => {
      if (u0 < u1) u0 = Math.min(u1, u0 + dt * 0.35);
      mainPath.getPointAt(u0, ball.position);
      ball.scale.setScalar(1 + 0.2 * Math.sin(performance.now() / 150));
    });
    ball.userData.stop = stopBall;
    let k = 0;
    let mistakes = 0;
    let streak = 0;
    shell.task(`<p>Проследи пътя на въздуха при вдишване.</p>
      <p><b>Кликни частите една след друга</b> — от носа до мястото, където кислородът минава в кръвта.</p>
      <p class="small">Синьото топче показва докъде е стигнал въздухът.</p>`);
    shell.setControls('');
    const upd = () => shell.score(`Стъпки: ${k} от ${ORDER.length} · грешки: ${mistakes}`);
    upd();
    clickHandler = (id) => {
      if (!id) return;
      const want = ORDER[k];
      if (id === want) {
        flash.set(id, { k: 0.8, color: 0x66ff99 });
        lit.add(id);
        tags.push(stage.bubble(anchorObj[id], `${k + 1}. ${esc(byId[id].label)}`, { lift: 0.02, cls: 'tag good' }));
        clearTip();
        u1 = uOf[id];
        k++;
        streak = 0;
        shell.msg(k < ORDER.length ? 'Вярно! Накъде продължава въздухът?' : '', 'good');
        upd();
        if (k === ORDER.length) {
          clickHandler = null;
          say('alveoli', '✔ <b>Пътят на въздуха:</b> носна кухина → гълтач → гръкляк → трахея → бронхи → бронхиоли → алвеоли.', 'good wide');
          scores.push(stepScore(mistakes, 3));
          shell.msg(mistakes ? `Готово! Грешки: ${mistakes}.` : 'Без нито една грешка! 🎉', 'good');
          const c = shell.setControls('<button class="btn primary">Напред →</button>');
          c.querySelector('button').addEventListener('click', step3);
        }
        return;
      }
      if (id === 'lungs' && want === 'bronchi') {
        say('lungs', 'Бронхите водят въздуха към белите дробове. Кликни там, където трахеята се разделя на две.', '');
        return;
      }
      if (id === 'lungs' && want === 'alveoli') {
        say('lungs', 'Да, въздухът е в белия дроб. Но къде точно отива? Потърси най-малките мехурчета в края на бронхиолите.', '');
        return;
      }
      const done = ORDER.indexOf(id) >= 0 && ORDER.indexOf(id) < k;
      if (done) { shell.msg(`Въздухът вече мина през: ${byId[id].label.toLowerCase()}.`, 'bad'); return; }
      mistakes++;
      streak++;
      flash.set(id, { k: 0.6, color: 0xff3030 });
      let why;
      if (id === 'diaphragm') why = 'Диафрагмата е мускул. Въздухът не минава през нея — тя само помага на белите дробове да се разширят.';
      else if (id === 'lungs') why = 'Въздухът още не е стигнал до белите дробове. Преди тях има още части.';
      else why = `Въздухът още не е стигнал до тази част. Какво има преди нея?`;
      say(id, `✘ ${esc(why)}`, 'bad');
      shell.msg(streak >= 2 && NEXT_HINT[want] ? `Подсказка: ${NEXT_HINT[want]}` : 'Не е тази част.', 'bad');
      upd();
    };
  }

  // ---------- 3. Как дишаме? ----------
  let stopDiaDrag = null;
  function step3() {
    shell.step(2);
    clearTip();
    for (const tg of tags) tg.remove();
    tags.length = 0;
    lit.clear();
    for (const id of Object.keys(glows)) glows[id].set(0);
    if (ball) { ball.userData.stop(); world.remove(ball); ball = null; }
    br.enabled = true;
    br.auto = false;
    br.b = 0; br.prevB = 0;
    hud.hidden = false;
    hudMode = 'breath';
    hudBreath();
    stage.stopFollow();
    stage.flyTo([3.2, 2.4, 5.6], [0.2, 1.9, 0], 1);
    setGlow('diaphragm');
    say('diaphragm', 'Плъзни диафрагмата надолу и нагоре — с плъзгача или направо с пръст.', '');
    const TASKS = [
      { t: '<b>Вдишай:</b> свий диафрагмата — плъзни я докрай <b>надолу</b>.', ok: () => br.b > 0.9 },
      { t: '<b>Издишай:</b> отпусни диафрагмата — нека се върне <b>нагоре</b>.', ok: () => br.b < 0.1 },
      { t: '<b>Подиши още 2 пъти</b> — надолу и нагоре, спокойно.', ok: () => cycles >= 2 },
    ];
    let task = 0;
    let cycles = 0;
    let wasDown = false;
    const draw = () => shell.task(`<p>Белите дробове нямат мускули. Помага им диафрагмата.</p><p>${TASKS[task].t}</p>`);
    draw();
    const c = shell.setControls(`<label class="breathing-dia"><span class="small"><b>Диафрагма</b></span>
      <input class="slider breathing-range" type="range" min="0" max="100" step="1" value="0">
      <span class="breathing-ends"><span>⬆ отпусната (купол)</span><span>свита (сплескана) ⬇</span></span></label>`);
    const range = c.querySelector('.breathing-range');
    shell.score(`Задача 1 от 3`);
    const setB = (v) => {
      br.b = Math.max(0, Math.min(1, v));
      range.value = Math.round(br.b * 100);
      check();
    };
    function check() {
      if (br.b > 0.85) wasDown = true;
      if (wasDown && br.b < 0.12) { wasDown = false; if (task === 2) cycles++; }
      if (task < TASKS.length && TASKS[task].ok()) {
        task++;
        if (task === 1) { clearTip(); shell.msg('Диафрагмата слезе, гръдният кош се разшири и въздухът влезе в белите дробове!', 'good'); wasDown = true; }
        if (task === 2) { shell.msg('Диафрагмата се отпусна и се качи, гръдният кош се смали и въздухът излезе.', 'good'); cycles = 0; wasDown = false; }
        if (task === 3) { question(); return; }
        draw();
        shell.score(`Задача ${task + 1} от 3`);
      }
    }
    range.addEventListener('input', () => setB(range.value / 100));
    // влачене на самата диафрагма
    const el = stage.renderer.domElement;
    let drag = null;
    const pd = (ev) => {
      const hit = stage.pickAt(ev);
      if (!hit || hit.root.userData.pickId !== 'diaphragm') return;
      drag = { y: ev.clientY, b: br.b };
      stage.controls.enabled = false;
      try { el.setPointerCapture(ev.pointerId); } catch (e) { /* няма значение */ }
    };
    const pm = (ev) => { if (drag) setB(drag.b + (ev.clientY - drag.y) / 110); };
    const pu = () => { if (drag) { drag = null; stage.controls.enabled = true; } };
    el.addEventListener('pointerdown', pd);
    el.addEventListener('pointermove', pm);
    el.addEventListener('pointerup', pu);
    el.addEventListener('pointercancel', pu);
    stopDiaDrag = () => {
      el.removeEventListener('pointerdown', pd);
      el.removeEventListener('pointermove', pm);
      el.removeEventListener('pointerup', pu);
      el.removeEventListener('pointercancel', pu);
      stage.controls.enabled = true;
    };
    clickHandler = null;
    function question() {
      stopDiaDrag(); stopDiaDrag = null;
      br.auto = true;
      br.phase = 0;
      setGlow(null);
      shell.score('');
      shell.msg('Браво! Сега дишането продължава само.', 'good');
      const opts = shuffle([
        { v: 'ok', t: 'Диафрагмата се свива и слиза, гръдният кош се разширява и въздухът влиза.' },
        { v: 'up', t: 'Диафрагмата се отпуска и се качва, а въздухът влиза.' },
        { v: 'self', t: 'Белите дробове сами се надуват, без помощта на мускули.' },
      ]);
      shell.task(`<p><b>Какво става при вдишване?</b></p>${choicesHTML('q', opts)}`);
      shell.setControls('');
      let mistakes = 0;
      container.querySelectorAll('.xp-task .choice').forEach((bt) => bt.addEventListener('click', () => {
        if (bt.disabled) return;
        if (bt.dataset.v !== 'ok') {
          mistakes++;
          bt.classList.add('wrong');
          bt.disabled = true;
          shell.msg(bt.dataset.v === 'up' ? 'Не. Когато диафрагмата се качва, мястото в гърдите намалява и въздухът излиза.' : 'Не. Белите дробове нямат мускули — разширява ги диафрагмата заедно с ребрата.', 'bad');
          return;
        }
        bt.classList.add('right');
        container.querySelectorAll('.xp-task .choice').forEach((x) => { x.disabled = true; });
        scores.push(stepScore(mistakes, 2));
        shell.msg('Вярно! При издишване диафрагмата се отпуска и въздухът излиза.', 'good');
        const c2 = shell.setControls('<button class="btn primary">Влез в алвеолата →</button>');
        c2.querySelector('button').addEventListener('click', step4);
      }));
    }
  }

  // ---------- 4. В алвеолата ----------
  const MX = 40;
  const micro = new THREE.Group();
  micro.position.set(MX, 0, 0);
  micro.visible = false;
  scene.add(micro);
  const ALV_C = new THREE.Vector3(0, 2.5, 0);
  const ALV_R = 1.5;
  const alvWallM = new THREE.MeshStandardMaterial({ color: 0xf8a5b8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, roughness: 0.5 });
  const alvClean = new THREE.Color(0xf8a5b8);
  const alvDirty = new THREE.Color(0x6b5546);
  const alv = new THREE.Mesh(new THREE.SphereGeometry(ALV_R, 40, 30, 0, Math.PI * 2, 0.34, Math.PI - 0.34), alvWallM);
  alv.position.copy(ALV_C);
  alv.renderOrder = 2;
  micro.add(alv);
  const alvRim = new THREE.Mesh(new THREE.SphereGeometry(ALV_R * 1.01, 40, 30, 0, Math.PI * 2, 0.34, Math.PI - 0.34),
    new THREE.MeshBasicMaterial({ color: 0xe57391, wireframe: true, transparent: true, opacity: 0.08 }));
  alvRim.position.copy(ALV_C);
  micro.add(alvRim);
  for (const [x, y, z, r] of [[-2.4, 3.2, -1.4, 1.0], [2.5, 3.4, -1.2, 1.1], [0.3, 4.6, -1.8, 0.9]]) {
    const n = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshStandardMaterial({ color: 0xf8a5b8, transparent: true, opacity: 0.22, depthWrite: false }));
    n.position.set(x, y, z);
    micro.add(n);
  }
  const bronchiole = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.6, 2.2, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x8fcdf0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  bronchiole.position.set(0, ALV_C.y + ALV_R + 0.7, 0);
  micro.add(bronchiole);
  // капиляр с цвят от синкаво-червен към яркочервен
  const capCurve = curveOf([[-4.2, 0.5, 0.4], [-2.1, 0.95, 1.15], [0, 1.25, 1.45], [2.1, 0.95, 1.15], [4.2, 0.5, 0.4]]);
  const capGeo = new THREE.TubeGeometry(capCurve, 80, 0.34, 16, false);
  {
    const cols = [];
    const c0 = new THREE.Color(0x7e57c2); const c1 = new THREE.Color(0xe53935); const cc = new THREE.Color();
    const n = capGeo.attributes.position.count;
    for (let i = 0; i < n; i++) {
      const u = Math.floor(i / 17) / 80;
      cc.copy(c0).lerp(c1, THREE.MathUtils.smoothstep(u, 0.35, 0.65));
      cols.push(cc.r, cc.g, cc.b);
    }
    capGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  }
  const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide }));
  cap.renderOrder = 4;
  micro.add(cap);
  for (const u of [0.12, 0.88]) {
    const ar = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 12), new THREE.MeshBasicMaterial({ color: u < 0.5 ? 0x7e57c2 : 0xe53935 }));
    const p = capCurve.getPointAt(u); const tg = capCurve.getTangentAt(u);
    ar.position.copy(p).add(new THREE.Vector3(0, 0.62, 0));
    ar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg);
    micro.add(ar);
  }
  const mkLabel = (text, pos, opt = {}) => { const l = labelSprite(text, { size: 0.3, ...opt }); l.position.set(...pos); micro.add(l); return l; };
  mkLabel('Алвеола', [-1.25, 4.15, 0.3]);
  mkLabel('Капиляр', [2.7, 1.75, 1.0], { color: '#b71c1c', border: '#ef9a9a' });
  mkLabel('от тялото', [-3.6, 1.35, 0.6], { color: '#5e35b1', border: '#b39ddb', size: 0.26 });
  mkLabel('към сърцето', [3.6, 1.35, 0.6], { color: '#c62828', border: '#ef9a9a', size: 0.26 });
  mkLabel('въздух ⇅', [0.95, 4.75, 0], { color: '#0277bd', border: '#81d4fa', size: 0.26 });
  // червени кръвни клетки
  const rbcGeo = new THREE.TorusGeometry(0.13, 0.075, 10, 20);
  const cells = [];
  const DARK = new THREE.Color(0x8e3b5e);
  const BRIGHT = new THREE.Color(0xff2a2a);
  for (let i = 0; i < 14; i++) {
    const m = new THREE.MeshStandardMaterial({ color: DARK.clone(), roughness: 0.4 });
    const c = new THREE.Mesh(rbcGeo, m);
    c.userData = { u: i / 14, o2: i / 14 > 0.6 ? 1 : 0.15, co2: i / 14 > 0.6 ? 0 : 1, spin: Math.random() * 6, off: new THREE.Vector3((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25) };
    c.renderOrder = 5;
    micro.add(c);
    cells.push(c);
  }
  // молекули
  const mkO2 = () => {
    const g = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({ color: 0x1e88e5 });
    for (const s of [1, -1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), m); a.position.x = s * 0.06; g.add(a); }
    return g;
  };
  const mkCO2 = () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: 0x424242 })));
    const om = new THREE.MeshBasicMaterial({ color: 0x9e9e9e });
    for (const s of [1, -1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), om); a.position.x = s * 0.11; g.add(a); }
    return g;
  };
  const randIn = (v, r = 1.15) => {
    do { v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1); } while (v.lengthSq() > 1);
    return v.multiplyScalar(r).add(ALV_C);
  };
  const o2s = [];
  for (let i = 0; i < 26; i++) {
    const g = mkO2();
    g.userData = { st: 'float', vel: new THREE.Vector3(), t: 0 };
    randIn(g.position);
    micro.add(g);
    o2s.push(g);
  }
  const co2s = [];
  for (let i = 0; i < 14; i++) {
    const g = mkCO2();
    g.userData = { st: 'idle', vel: new THREE.Vector3(), t: 0 };
    g.visible = false;
    micro.add(g);
    co2s.push(g);
  }
  // катран и прах по стените
  const spots = [];
  const spotGeo = new THREE.SphereGeometry(0.07, 8, 6);
  const tarM = new THREE.MeshStandardMaterial({ color: 0x3e2a1c, roughness: 0.9 });
  const sootM = new THREE.MeshStandardMaterial({ color: 0x5f6368, roughness: 0.9 });
  const smokeParts = [];
  const gx = { air: 'clean', eff: 1, effNow: 1, dirt: 0, o2out: 0.95, running: false };
  const AIRS = {
    clean: { eff: 1, dirt: 0, label: '🌿 Чист въздух' },
    smoke: { eff: 0.25, dirt: 1, label: '🚬 Тютюнев дим' },
    smog: { eff: 0.5, dirt: 0.65, label: '🏭 Мръсен въздух' },
  };
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  stage.tick((dt, t) => {
    if (!micro.visible) return;
    gx.effNow += (gx.eff - gx.effNow) * Math.min(1, dt * 0.8);
    // клетките текат
    const zone = (u) => u > 0.35 && u < 0.65;
    let outSum = 0; let outN = 0;
    for (const c of cells) {
      const d = c.userData;
      d.u += dt * 0.055;
      if (d.u > 1) { d.u -= 1; d.o2 = 0.15; d.co2 = 1; }
      capCurve.getPointAt(d.u, c.position);
      c.position.add(d.off);
      d.spin += dt * 1.5;
      c.rotation.set(d.spin, d.spin * 0.6, 0);
      c.material.color.copy(DARK).lerp(BRIGHT, Math.min(1, d.o2));
      if (zone(d.u)) {
        // кислород влиза в клетката
        if (d.o2 < 1 && Math.random() < dt * 1.0 * gx.effNow) {
          const m = o2s.find((o) => o.userData.st === 'float');
          if (m) { m.userData.st = 'cross'; m.userData.t = 0; m.userData.from = m.position.clone(); m.userData.cell = c; }
        }
        // въглероден диоксид излиза
        if (d.co2 > 0 && Math.random() < dt * 2.0 * (0.4 + 0.6 * gx.effNow)) {
          const m = co2s.find((o) => o.userData.st === 'idle');
          if (m) {
            d.co2 = Math.max(0, d.co2 - 0.3);
            m.visible = true; m.userData.st = 'out'; m.userData.t = 0;
            m.userData.from = c.position.clone(); m.userData.to = randIn(new THREE.Vector3(), 0.9);
          }
        }
      }
      if (d.u > 0.7) { outSum += Math.min(1, d.o2); outN++; }
    }
    if (outN) gx.o2out += (outSum / outN - gx.o2out) * Math.min(1, dt * 1.5);
    for (const m of o2s) {
      const u = m.userData;
      if (u.st === 'float') {
        u.vel.add(tmpA.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(dt * 2));
        u.vel.multiplyScalar(0.97);
        m.position.addScaledVector(u.vel, dt);
        if (m.position.distanceTo(ALV_C) > 1.2) u.vel.add(tmpB.copy(ALV_C).sub(m.position).multiplyScalar(dt * 2));
        m.rotation.y += dt;
      } else if (u.st === 'cross') {
        u.t += dt / 0.9;
        m.position.lerpVectors(u.from, u.cell.position, Math.min(1, u.t));
        if (u.t >= 1) {
          u.cell.userData.o2 = Math.min(1.1, u.cell.userData.o2 + 0.2);
          u.st = 'enter'; u.t = 0;
          m.position.set((Math.random() - 0.5) * 0.6, ALV_C.y + ALV_R + 1.6, (Math.random() - 0.5) * 0.6);
        }
      } else if (u.st === 'enter') {
        u.t += dt;
        m.position.y -= dt * 1.1;
        if (m.position.y < ALV_C.y + 0.6) { u.st = 'float'; u.vel.set(0, -0.3, 0); }
      }
    }
    for (const m of co2s) {
      const u = m.userData;
      if (u.st === 'out') {
        u.t += dt / 1.0;
        m.position.lerpVectors(u.from, u.to, Math.min(1, u.t));
        if (u.t >= 1) { u.st = 'rise'; }
      } else if (u.st === 'rise') {
        m.position.x *= 1 - dt * 1.5;
        m.position.z *= 1 - dt * 1.5;
        m.position.y += dt * 0.9;
        if (m.position.y > ALV_C.y + ALV_R + 1.7) { u.st = 'idle'; m.visible = false; }
      }
      m.rotation.z += dt * 2;
    }
    // дим / прах
    const wantSpots = Math.round(AIRS[gx.air].dirt * 46);
    if (gx.air !== 'clean' && Math.random() < dt * 6 && smokeParts.length < 10) {
      const p = new THREE.Mesh(spotGeo, gx.air === 'smoke' ? tarM : sootM);
      p.position.set((Math.random() - 0.5) * 0.7, ALV_C.y + ALV_R + 1.5, (Math.random() - 0.5) * 0.7);
      const dir = new THREE.Vector3(Math.random() - 0.5, -Math.random() * 0.8 - 0.2, Math.random() - 0.5).normalize();
      p.userData.to = ALV_C.clone().addScaledVector(dir, ALV_R * 0.97);
      p.userData.t = 0;
      p.userData.from = p.position.clone();
      micro.add(p);
      smokeParts.push(p);
    }
    for (let i = smokeParts.length - 1; i >= 0; i--) {
      const p = smokeParts[i];
      p.userData.t += dt / 1.6;
      p.position.lerpVectors(p.userData.from, p.userData.to, Math.min(1, p.userData.t));
      if (p.userData.t >= 1) {
        smokeParts.splice(i, 1);
        if (spots.length < wantSpots) { p.scale.set(2.2, 2.2, 0.6); p.lookAt(ALV_C.clone().add(micro.position)); spots.push(p); } else micro.remove(p);
      }
    }
    if (spots.length > wantSpots && Math.random() < dt * 5) micro.remove(spots.shift());
    gx.dirt += (Math.min(1, spots.length / 46) - gx.dirt) * Math.min(1, dt);
    alvWallM.color.copy(alvClean).lerp(alvDirty, gx.dirt * 0.75);
    alvWallM.opacity = 0.35 + gx.dirt * 0.25;
    if (!hud.hidden && hudMode === 'gas') {
      hud.querySelector('.o2').style.width = `${Math.round(gx.o2out * 100)}%`;
      hud.querySelector('.o2t').textContent = gx.o2out > 0.75 ? 'много' : gx.o2out > 0.5 ? 'по-малко' : 'малко';
    }
  });

  function hudGas() {
    hud.innerHTML = `<div class="breathing-leg"><span class="breathing-dot" style="background:#1e88e5"></span><b>O₂</b> кислород</div>
      <div class="breathing-leg"><span class="breathing-dot" style="background:#555"></span><b>CO₂</b> въглероден диоксид</div>
      <div class="breathing-leg"><span class="breathing-dot" style="background:#e53935"></span>червена кръвна клетка</div>
      <div>Кислород в кръвта: <b class="o2t">много</b></div><div class="breathing-bar"><i class="o2" style="background:#e53935"></i></div>`;
  }

  const microTip = {};
  function microAnchor(name, pos) {
    if (!microTip[name]) { const a = new THREE.Object3D(); a.position.set(...pos); micro.add(a); microTip[name] = a; }
    return microTip[name];
  }
  function sayMicro(name, pos, html, cls = '') {
    clearTip();
    tip = stage.bubble(microAnchor(name, pos), html, { lift: 0, cls });
  }
  function setAir(a) {
    gx.air = a;
    gx.eff = AIRS[a].eff;
  }

  function step4() {
    shell.step(3);
    clearTip();
    stage.stopFollow();
    stage.flyTo([1.9, 1.3, 1.6], [1.6, 1.05, 0.5], 0.9);
    setTimeout(() => {
      if (!alive) return;
      world.visible = false;
      micro.visible = true;
      scene.background = new THREE.Color(0xfbeef2);
      camera.position.set(MX + 0.4, 3.2, 9.5);
      stage.controls.target.set(MX, 2.1, 0.5);
      stage.flyTo([MX + 0.6, 3.0, 8.2], [MX, 2.1, 0.5], 0.8);
      hudMode = 'gas';
      hudGas();
      hud.hidden = false;
      gasQuestions();
    }, 950);
    shell.setControls('');
    shell.task('<p>Влизаме в една алвеола…</p>');
  }

  let alive = true;
  function gasQuestions() {
    sayMicro('wall', [0, 1.05, 1.2], 'Стената на алвеолата и на капиляра е много тънка. Оттук газовете минават.', '');
    const q1 = shuffle([
      { v: 'ok', t: 'В кръвта — червените кръвни клетки го носят до всички клетки на тялото.' },
      { v: 'stay', t: 'Остава в алвеолата.' },
      { v: 'stom', t: 'Отива в стомаха.' },
    ]);
    const q2 = shuffle([
      { v: 'ok', t: 'От клетките на тялото — кръвта го носи до белите дробове и ние го издишваме.' },
      { v: 'air', t: 'От въздуха, който вдишваме.' },
      { v: 'nose', t: 'Образува се в носа.' },
    ]);
    shell.task(`<p>Гледай сините (O₂) и сивите (CO₂) частици.</p>
      <p><b>Къде отива кислородът от алвеолата?</b></p>${choicesHTML('a', q1)}
      <p><b>Откъде идва въглеродният диоксид?</b></p>${choicesHTML('b', q2)}`);
    shell.score('');
    const first = {};
    const solved = {};
    container.querySelectorAll('.xp-task .choices').forEach((box) => {
      box.querySelectorAll('.choice').forEach((bt) => bt.addEventListener('click', () => {
        const q = box.dataset.q;
        if (solved[q] || bt.disabled) return;
        const ok = bt.dataset.v === 'ok';
        if (first[q] === undefined) first[q] = ok ? 1 : 0;
        if (!ok) {
          bt.classList.add('wrong'); bt.disabled = true;
          shell.msg(q === 'a' ? 'Не. Виж накъде летят сините частици и какво става с червените клетки.' : 'Не. Виж откъде излизат сивите частици — от клетките в капиляра.', 'bad');
          return;
        }
        bt.classList.add('right');
        box.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        solved[q] = true;
        shell.msg(q === 'a' ? 'Вярно! Клетките стават яркочервени — пълни са с кислород.' : 'Вярно! Клетките на тялото отделят CO₂, а кръвта го носи до белите дробове.', 'good');
        if (solved.a && solved.b) {
          const c = shell.setControls('<button class="btn primary">Напред →</button>');
          c.querySelector('button').addEventListener('click', () => smokePart(first.a + first.b));
        }
      }));
    });
  }

  function smokePart(qScore) {
    clearTip();
    const pr = [{ v: 'more', t: '⬆ Повече' }, { v: 'less', t: '⬇ По-малко' }, { v: 'same', t: '＝ Същото' }];
    shell.task(`<p>Човекът запалва цигара и вдишва тютюнев дим.</p>
      <p><b>Предскажи: колко кислород ще минава в кръвта?</b></p>${choicesHTML('p', pr)}`);
    let pred = null;
    shell.msg('');
    const c = shell.setControls('<button class="btn primary" disabled>🚬 Провери</button>');
    const go = c.querySelector('button');
    container.querySelectorAll('.xp-task .choice').forEach((bt) => bt.addEventListener('click', () => {
      if (bt.disabled) return;
      container.querySelectorAll('.xp-task .choice').forEach((x) => x.classList.remove('on'));
      bt.classList.add('on');
      pred = bt.dataset.v;
      go.disabled = false;
    }));
    go.addEventListener('click', () => {
      container.querySelectorAll('.xp-task .choice').forEach((x) => {
        x.disabled = true;
        if (x.dataset.v === 'less') x.classList.add('right'); else if (x.classList.contains('on')) x.classList.add('wrong');
      });
      const predOk = pred === 'less' ? 1 : 0;
      setAir('smoke');
      const cc = shell.setControls(`<div class="breathing-airs">${Object.entries(AIRS).map(([k, a]) => `<button class="btn ${k === 'smoke' ? 'on' : ''}" data-a="${k}">${a.label}</button>`).join('')}</div>`);
      const tried = new Set(['smoke']);
      const notes = {
        smoke: '<b>Тютюнев дим.</b> Катранът полепва по стените на алвеолите. Те потъмняват и през тях минава много по-малко кислород. Никотинът и отровните газове вредят на сърцето и кръвоносните съдове.',
        smog: '<b>Мръсен въздух.</b> Прахът и саждите от колите и комините също запушват алвеолите. Кислородът в кръвта намалява.',
        clean: '<b>Чист въздух.</b> Алвеолите се почистват постепенно и кислородът отново минава лесно в кръвта.',
      };
      let shown = false;
      const showNote = (k) => sayMicro('note', [0, 4.1, 0.6], notes[k], 'wide');
      setTimeout(() => { if (alive && gx.air === 'smoke') showNote('smoke'); }, 2500);
      shell.msg(predOk ? 'Позна! Гледай алвеолата и уреда горе вдясно.' : 'Гледай алвеолата и уреда горе вдясно.', predOk ? 'good' : 'bad');
      cc.querySelectorAll('[data-a]').forEach((bt) => bt.addEventListener('click', () => {
        cc.querySelectorAll('[data-a]').forEach((x) => x.classList.toggle('on', x === bt));
        setAir(bt.dataset.a);
        tried.add(bt.dataset.a);
        showNote(bt.dataset.a);
        if (tried.size === 3 && !shown) {
          shown = true;
          const nx = document.createElement('button');
          nx.className = 'btn primary';
          nx.style.marginTop = '8px';
          nx.textContent = 'Как да пазим белите дробове? →';
          cc.appendChild(nx);
          nx.addEventListener('click', () => rules(qScore, predOk));
        }
      }));
      shell.task(`<p class="small">Ти предположи: <b>${esc(pr.find((p) => p.v === pred).t)}</b> ${predOk ? '✔' : '✘'}</p>
        <p>Пробвай и трите вида въздух. Следи цвета на алвеолата и червените клетки.</p>`);
    });
  }

  function rules(qScore, predOk) {
    clearTip();
    setAir('clean');
    const R = shuffle([
      { v: 'y1', ok: true, t: 'Дишам през носа, а не през устата.' },
      { v: 'y2', ok: true, t: 'Не пуша и стоя далеч от тютюнев дим.' },
      { v: 'y3', ok: true, t: 'Проветрявам стаята често.' },
      { v: 'y4', ok: true, t: 'Спортувам на открито, сред природата.' },
      { v: 'n1', ok: false, t: 'Тичам покрай натоварен път с много коли.' },
      { v: 'n2', ok: false, t: 'Играя в прашна стая със затворени прозорци.' },
    ]);
    shell.task(`<p><b>Избери всички правила, които пазят дихателната система.</b></p>
      <div class="choices breathing-multi" data-q="r">${R.map((r) => `<button class="choice" data-v="${r.v}">${esc(r.t)}</button>`).join('')}</div>`);
    shell.msg('');
    const c = shell.setControls('<button class="btn primary">Провери</button>');
    container.querySelectorAll('.breathing-multi .choice').forEach((bt) => bt.addEventListener('click', () => { if (!bt.disabled) bt.classList.toggle('on'); }));
    c.querySelector('button').addEventListener('click', () => {
      let good = 0;
      container.querySelectorAll('.breathing-multi .choice').forEach((bt) => {
        const r = R.find((x) => x.v === bt.dataset.v);
        const on = bt.classList.contains('on');
        if (on === r.ok) good++;
        bt.disabled = true;
        if (r.ok) bt.classList.add('right');
        else if (on) bt.classList.add('wrong');
        else bt.insertAdjacentHTML('beforeend', ' <b style="color:#d92916">(вреди)</b>');
      });
      const rScore = good / R.length;
      shell.msg(good === R.length ? 'Всички правила са верни! 🎉' : `Верни избори: ${good} от ${R.length}. Зелените правила пазят белите дробове, червените им вредят.`, good === R.length ? 'good' : 'bad');
      scores.push((qScore + predOk + 2 * rScore) / 5); // два въпроса + предсказване + правила (×2)
      const c2 = shell.setControls('<button class="btn primary">Виж резултата</button>');
      c2.querySelector('button').addEventListener('click', () => {
        clearTip();
        const ratio = scores.reduce((a, s) => a + s, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    });
  }

  function restart() {
    clearTip();
    for (const tg of tags) tg.remove();
    tags.length = 0;
    if (stopDiaDrag) { stopDiaDrag(); stopDiaDrag = null; }
    if (ball) { ball.userData.stop(); world.remove(ball); ball = null; }
    lit.clear();
    flash.clear();
    for (const id of Object.keys(glows)) glows[id].set(0);
    for (const s of spots) micro.remove(s);
    spots.length = 0;
    for (const s of smokeParts) micro.remove(s);
    smokeParts.length = 0;
    setAir('clean');
    gx.effNow = 1; gx.dirt = 0;
    micro.visible = false;
    world.visible = true;
    scene.background = new THREE.Color(0xeaf3fb);
    camera.position.set(...HOME.pos);
    stage.controls.target.set(...HOME.tgt);
    hud.hidden = true;
    hudMode = '';
    scores.length = 0;
    step1();
  }

  step1();
  return {
    dispose() {
      alive = false;
      if (stopDiaDrag) stopDiaDrag();
      hud.remove();
      menu.remove();
      stage.dispose();
    },
  };
}
