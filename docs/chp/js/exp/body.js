// 3.3.1 „Основни органи и техните функции“ — прозрачно дете Боби с живи органи.
// Стъпки: опознай → върни органите → кой какво прави → какво става, когато тичаш.
import { createStage, labelSprite, addHitBox, cornerMenu, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { injectStyle, organMat, glassMat, curveOf, tube, hitTube, glowOf, flowDots, verticalDrag, mover, choicesHTML } from './anatomy.js';

const ORGANS = [
  { id: 'brain', label: 'Мозък', icon: '🧠', glow: 0xff7fb0,
    note: 'Мозъкът е в главата. Той управлява цялото тяло. С него мислиш, помниш и учиш.',
    fact: 'Той праща команди до всяка част на тялото: „Вдигни ръка!“, „Мигни!“.',
    fn: 'Мисли и управлява цялото тяло' },
  { id: 'heart', label: 'Сърце', icon: '❤️', glow: 0xff3b3b,
    note: 'Сърцето е в гърдите. То е мускул, който бие без почивка и изпомпва кръвта.',
    fact: 'Голямо е колкото твоя юмрук. Сложи ръка на гърдите и ще го усетиш.',
    fn: 'Изпомпва кръвта и я праща по тялото' },
  { id: 'lungs', label: 'Бели дробове', icon: '🫁', glow: 0xff8a9a,
    note: 'Двата бели дроба са в гърдите. С тях дишаш: вдишваш и издишваш въздух.',
    fact: 'Когато вдишваш, те се надуват като балони. От въздуха тялото взема кислород.',
    fn: 'Вкарват въздух в тялото — с тях дишаме' },
  { id: 'stomach', label: 'Стомах', icon: '🥣', glow: 0xffa070,
    note: 'Стомахът е в корема. Като преглътнеш, храната слиза в него и там се смила.',
    fact: 'Той е като торбичка, която се свива и разбърква храната.',
    fn: 'Смила храната, която си изял' },
  { id: 'intestines', label: 'Черва', icon: '🌀', glow: 0xffb060,
    note: 'Червата са дълга навита тръба в долната част на корема. В тях храната се смила докрай.',
    fact: 'Оттук полезните вещества от храната минават в кръвта.',
    fn: 'Пращат полезното от храната в кръвта' },
  { id: 'vessels', label: 'Кръвоносни съдове', icon: '🩸', glow: 0xff5050,
    note: 'Кръвоносните съдове са тънки тръбички. По тях кръвта стига до всяка част на тялото.',
    fact: 'На рисунката червените носят кръвта от сърцето, а сините я връщат обратно.',
    fn: 'Носят кръвта до всяка част на тялото' },
];
const PRON = { brain: 'Той', heart: 'То', lungs: 'Те', stomach: 'Той', intestines: 'Те', vessels: 'Те' };
const byId = Object.fromEntries(ORGANS.map((o) => [o.id, o]));
// Органите, които детето връща на мястото им (съдовете остават в тялото).
const PRED = { up: 'по-бързо', down: 'по-бавно', same: 'както преди' };
const MOVABLE = ['brain', 'heart', 'lungs', 'stomach', 'intestines'];
// Подсказки при грешно място: първо загадка, после по-ясно.
const PLACE_HINTS = {
  brain: ['Мозъкът е скрит в твърда костна кутия — черепа.', 'Мозъкът е в главата.'],
  heart: ['Сърцето чуваш, ако долепиш ухо до гърдите на приятел.', 'Сърцето е в гърдите, между двата бели дроба.'],
  lungs: ['Сложи ръка на гърдите си и вдишай дълбоко. Какво се надува?', 'Белите дробове са в гърдите, от двете страни на сърцето.'],
  stomach: ['Като преглътнеш, храната слиза по тръбичка надолу — под гърдите.', 'Стомахът е в корема, точно под белите дробове.'],
  intestines: ['Червата са дълги и навити. Те са най-ниско от всички органи.', 'Червата са в долната част на корема, под стомаха.'],
};
// Подсказки, когато детето избере грешен орган за дадена работа.
const FN_HINTS = {
  brain: 'С кой орган мислиш? Той е в главата.',
  heart: 'Кой орган бие „туп-туп“ в гърдите?',
  lungs: 'Кой орган се надува, когато вдишваш?',
  stomach: 'Къде отива храната веднага след като я преглътнеш?',
  intestines: 'Къде храната се смила докрай, след стомаха?',
  vessels: 'Потърси тънките червени и сини тръбички.',
};

const CSS = `
.body-hud { position: absolute; top: 8px; right: 8px; z-index: 4; pointer-events: none; display: grid; gap: 4px;
  background: rgba(255,255,255,0.95); border: 1px solid #c7d3e0; border-radius: 10px; padding: 7px 10px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12); font-size: 0.85rem; min-width: 168px; }
.body-hud[hidden] { display: none; }
.body-hud .body-row { display: flex; align-items: center; gap: 6px; font-weight: 800; }
.body-hud .body-ico { display: inline-block; width: 1.3em; text-align: center; }
.body-hud .body-num { font-variant-numeric: tabular-nums; min-width: 2.2em; text-align: right; }
.body-hud .body-unit { font-weight: 600; color: #5b6573; font-size: 0.78rem; }
.body-hud .body-bar { height: 5px; border-radius: 99px; background: #e5e9f0; overflow: hidden; }
.body-hud .body-bar i { display: block; height: 100%; width: 30%; border-radius: 99px; transition: width 0.3s; }
.body-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.body-modes .btn { padding-left: 2px; padding-right: 2px; font-size: 0.85rem; white-space: nowrap; }
.body-modes .btn.on { outline: 3px solid #1865f2; outline-offset: 1px; }
.xp-chips .chip.body-fn { font-weight: 700; font-size: 0.88rem; border-radius: 10px; text-align: left; }
.body-held { position: absolute; left: 50%; top: 8px; transform: translateX(-50%); z-index: 4; pointer-events: none;
  background: #1865f2; color: #fff; font-weight: 800; border-radius: 999px; padding: 6px 14px; font-size: 0.88rem;
  box-shadow: 0 4px 14px rgba(0,0,0,0.2); max-width: calc(100% - 24px); text-align: center; }
.body-held[hidden] { display: none; }
@media (max-width: 520px) { .body-hud { font-size: 0.78rem; min-width: 140px; padding: 5px 8px; } .body-held { font-size: 0.78rem; padding: 4px 10px; } }
`;

// ---------- модели ----------
function wrinkle(geo, amp = 0.07) {
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = 1 + amp * Math.sin(v.x * 9 + 2) * Math.sin(v.y * 8 + 1) * Math.sin(v.z * 10)
      + amp * 0.6 * Math.sin(v.x * 17 + v.y * 13 + v.z * 5);
    v.multiplyScalar(d);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildBrain() {
  const g = new THREE.Group();
  const m = organMat(0xf497b6, { roughness: 0.6 });
  for (const s of [1, -1]) {
    const h = new THREE.Mesh(wrinkle(new THREE.SphereGeometry(1, 48, 36)), m);
    h.scale.set(0.2, 0.24, 0.33);
    h.position.set(s * 0.105, 0, 0);
    g.add(h);
  }
  const cer = new THREE.Mesh(wrinkle(new THREE.SphereGeometry(1, 32, 20), 0.05), organMat(0xe27ca0));
  cer.scale.set(0.17, 0.09, 0.11);
  cer.position.set(0, -0.16, -0.2);
  g.add(cer);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.32, 10), organMat(0xe58aa8));
  stem.position.set(0, -0.28, -0.1);
  stem.rotation.x = 0.25;
  g.add(stem);
  // искрици — „мисли“
  const sparks = [];
  const sm = new THREE.MeshBasicMaterial({ color: 0xfff59d, transparent: true, opacity: 0.9, depthWrite: false });
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), sm);
    const a = i * 2.39;
    s.position.set(Math.cos(a) * 0.19, 0.12 + (i % 3) * 0.05, Math.sin(a) * 0.27);
    s.userData.ph = Math.random() * 6;
    g.add(s);
    sparks.push(s);
  }
  g.userData.sparks = sparks;
  return g;
}

function lungGeo(side) {
  const geo = new THREE.SphereGeometry(1, 28, 20);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i); const y = p.getY(i); let z = p.getZ(i);
    const taper = 1 - 0.38 * Math.max(0, y); // узък връх
    x *= taper; z *= taper * (1 - 0.15 * Math.max(0, -y));
    if (x * side < 0) x *= 0.45; // плоска вътрешна страна
    p.setXYZ(i, x, y - 0.12 * Math.max(0, -y) * Math.abs(x), z);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildLungs() {
  const g = new THREE.Group();
  const m = organMat(0xf28b97, { roughness: 0.65 });
  const lobes = [];
  for (const s of [1, -1]) {
    const l = new THREE.Mesh(lungGeo(s), m);
    l.scale.set(s > 0 ? 0.23 : 0.26, 0.42, 0.23);
    l.position.set(s * 0.29, 0, 0);
    g.add(l);
    lobes.push(l);
  }
  const tm = organMat(0xe9c3c3);
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 12), tm);
  tr.position.set(0, 0.47, 0.02);
  g.add(tr);
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.012, 6, 16), tm);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.32 + i * 0.075, 0.02);
    g.add(ring);
  }
  for (const s of [1, -1]) {
    g.add(tube([[0, 0.28, 0.02], [s * 0.1, 0.2, 0.02], [s * 0.2, 0.1, 0.01]], 0.04, tm, 12));
  }
  g.userData.lobes = lobes;
  return g;
}

function buildHeart() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  const m = organMat(0xd62f3a, { roughness: 0.45 });
  for (const [x, y] of [[-0.055, 0.04], [0.05, 0.05]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 14), m);
    s.position.set(x, y, 0);
    inner.add(s);
  }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.22, 20), m);
  cone.rotation.z = Math.PI;
  cone.position.set(0, -0.08, 0);
  inner.add(cone);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.022, 8, 16, Math.PI), organMat(0xc62828));
  arch.position.set(-0.01, 0.12, -0.02);
  inner.add(arch);
  inner.rotation.z = 0.45;
  g.add(inner);
  g.userData.inner = inner;
  return g;
}

function buildStomach() {
  const g = new THREE.Group();
  const m = organMat(0xffa98c, { roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), m);
  body.scale.set(0.2, 0.14, 0.12);
  body.rotation.z = 0.55;
  body.position.set(0.03, 0.02, 0);
  g.add(body);
  const fundus = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), m);
  fundus.position.set(0.1, 0.1, 0);
  g.add(fundus);
  g.add(tube([[-0.08, -0.07, 0], [-0.17, -0.1, 0.01], [-0.24, -0.06, 0.01]], 0.045, m, 12));
  g.userData.body = body;
  return g;
}

function buildIntestines() {
  const g = new THREE.Group();
  const large = tube([[-0.3, -0.2, 0.02], [-0.35, -0.05, 0.03], [-0.34, 0.15, 0.03], [-0.18, 0.2, 0.05], [0, 0.19, 0.06],
    [0.2, 0.2, 0.05], [0.34, 0.15, 0.03], [0.35, -0.05, 0.03], [0.3, -0.2, 0.03], [0.12, -0.26, 0.05]], 0.062, organMat(0xe2945f), 80, 10);
  g.add(large);
  const pts = [];
  const rows = [0.1, 0.03, -0.04, -0.11, -0.17];
  rows.forEach((y, r) => {
    for (let k = 0; k <= 6; k++) {
      const u = r % 2 ? 1 - k / 6 : k / 6;
      pts.push([-0.22 + u * 0.44, y + Math.sin(k * 1.7 + r) * 0.012, 0.07 + Math.sin(k * 2.1 + r * 1.3) * 0.035]);
    }
  });
  const small = tube(pts, 0.035, organMat(0xf7b48c), 160, 8);
  g.add(small);
  g.userData.small = small;
  return g;
}

// Прозрачна част на тялото + лек контур.
function skinPart(geo, skin, rim) {
  const m = new THREE.Mesh(geo, skin);
  m.renderOrder = 2;
  const o = new THREE.Mesh(geo, rim);
  o.scale.setScalar(1.035);
  o.renderOrder = 1;
  m.add(o);
  return m;
}

function buildKid() {
  const kid = new THREE.Group();
  const skin = glassMat(0xffc8a2, 0.3, { emissive: 0xffa070, emissiveIntensity: 0.08 });
  const headSkin = glassMat(0xffc8a2, 0.42, { emissive: 0xffa070, emissiveIntensity: 0.1 });
  const rim = glassMat(0xd98a63, 0.35, { side: THREE.BackSide });
  // тяло
  const prof = [[0, 1.05], [0.42, 1.08], [0.56, 1.24], [0.6, 1.55], [0.57, 1.95], [0.58, 2.4], [0.62, 2.85], [0.56, 3.1], [0.36, 3.27], [0.16, 3.33], [0, 3.34]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const torsoGeo = new THREE.LatheGeometry(prof, 36);
  const torso = skinPart(torsoGeo, skin, rim);
  torso.scale.z = 0.64;
  kid.add(torso);
  const neck = skinPart(new THREE.CylinderGeometry(0.17, 0.19, 0.32, 16, 1, true), skin, rim);
  neck.position.y = 3.4;
  kid.add(neck);
  // глава
  const head = new THREE.Group();
  head.position.y = 3.95;
  kid.add(head);
  head.add(skinPart(new THREE.SphereGeometry(0.6, 36, 28), headSkin, rim));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.635, 36, 18, 0, Math.PI * 2, 0, 1.05), organMat(0x6b4226, { roughness: 0.8 }));
  hair.rotation.x = -0.5;
  head.add(hair);
  const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), organMat(0x6b4226));
  tuft.position.set(0.05, 0.62, -0.08);
  tuft.rotation.z = -0.5;
  head.add(tuft);
  const white = organMat(0xffffff, { roughness: 0.3 });
  const dark = organMat(0x2a1d1a, { roughness: 0.3 });
  const eyes = [];
  for (const s of [1, -1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.2, 0.04, 0.53);
    const sc = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), white);
    sc.scale.z = 0.55;
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 10), dark);
    pu.position.z = 0.04;
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), white);
    hl.position.set(0.02, 0.025, 0.09);
    eye.add(sc, pu, hl);
    head.add(eye);
    eyes.push(eye);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.09, 4, 8), organMat(0x6b4226));
    brow.rotation.z = Math.PI / 2 - s * 0.18;
    brow.position.set(s * 0.2, 0.17, 0.55);
    head.add(brow);
    const ear = skinPart(new THREE.SphereGeometry(0.11, 14, 10), headSkin, rim);
    ear.scale.set(0.6, 1, 0.9);
    ear.position.set(s * 0.6, 0, 0);
    head.add(ear);
  }
  const cheekM = new THREE.MeshBasicMaterial({ color: 0xff8f8f, transparent: true, opacity: 0.55, depthWrite: false });
  const cheeks = [];
  for (const s of [1, -1]) {
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), cheekM);
    c.position.set(s * 0.34, -0.12, 0.49);
    c.rotation.y = s * 0.6;
    head.add(c);
    cheeks.push(c);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), organMat(0xf4a988));
  nose.position.set(0, -0.08, 0.6);
  head.add(nose);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 20, Math.PI), organMat(0xb5403f));
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.2, 0.55);
  mouth.rotation.x = -0.25;
  head.add(mouth);
  // ръце
  const arms = [];
  for (const s of [1, -1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.64, 2.95, 0);
    arm.rotation.z = s * 0.14;
    arm.add(skinPart(new THREE.CapsuleGeometry(0.13, 1.05, 8, 16), skin, rim));
    arm.children[0].position.y = -0.66;
    const hand = skinPart(new THREE.SphereGeometry(0.155, 16, 12), skin, rim);
    hand.position.y = -1.4;
    arm.add(hand);
    arm.userData.side = s;
    kid.add(arm);
    arms.push(arm);
  }
  // крака, гащета, обувки
  const shortsM = organMat(0x3f7fd6, { roughness: 0.7, side: THREE.DoubleSide });
  const shorts = new THREE.Mesh(new THREE.LatheGeometry([[0.47, 0.98], [0.6, 1.2], [0.625, 1.46], [0.615, 1.5]].map(([r, y]) => new THREE.Vector2(r, y)), 36), shortsM);
  shorts.scale.z = 0.66;
  kid.add(shorts);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.615, 0.03, 8, 36), organMat(0xffffff));
  band.rotation.x = Math.PI / 2;
  band.scale.y = 0.66;
  band.position.y = 1.48;
  kid.add(band);
  const legs = [];
  const shoeM = organMat(0xff7043, { roughness: 0.5 });
  const soleM = organMat(0xffffff);
  for (const s of [1, -1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.27, 1.15, 0);
    const limb = skinPart(new THREE.CapsuleGeometry(0.19, 0.62, 8, 16), skin, rim);
    limb.position.y = -0.48;
    leg.add(limb);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.25, 0.4, 20), shortsM);
    cuff.position.y = -0.12;
    leg.add(cuff);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), shoeM);
    shoe.scale.set(0.95, 0.55, 1.45);
    shoe.position.set(0, -1.02, 0.09);
    const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 18), soleM);
    sole.scale.z = 1.5;
    sole.position.set(0, -1.12, 0.09);
    leg.add(shoe, sole);
    kid.add(leg);
    legs.push(leg);
  }
  // хранопровод (остава в тялото)
  kid.add(tube([[0, 3.5, -0.12], [0, 3.1, -0.12], [0.06, 2.6, -0.06], [0.14, 2.24, 0.06]], 0.035, organMat(0xf2bba5), 24));
  return { kid, torso, head, eyes, cheeks, cheekM, mouth, arms, legs };
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  injectStyle('body-style', CSS);
  const STEPS = ['Опознай тялото', 'Върни органите', 'Кой какво прави?', 'Какво става, когато тичаш?'];
  const shell = createShell(container, { steps: STEPS });
  const HOME = { pos: [0, 3.1, 8.4], tgt: [0, 2.45, 0] };
  const stage = createStage(shell.stageEl, {
    background: 0xe4f1ff, camPos: HOME.pos, target: HOME.tgt, minDistance: 1.3, maxDistance: 13,
  });
  const { scene } = stage;
  stage.renderer.domElement.style.touchAction = 'none';
  const mv = mover(stage);

  // Стая: меко килимче и цветни балончета на фона.
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshStandardMaterial({ color: 0xbfe3b4, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const floorRing = new THREE.Mesh(new THREE.RingGeometry(3.05, 3.2, 64), new THREE.MeshBasicMaterial({ color: 0x8fcf80 }));
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.position.y = 0.005;
  scene.add(floorRing);
  const big = new THREE.Mesh(new THREE.CircleGeometry(30, 32), new THREE.MeshStandardMaterial({ color: 0xd8ebf8, roughness: 1 }));
  big.rotation.x = -Math.PI / 2;
  big.position.y = -0.01;
  scene.add(big);
  const floaters = [];
  const fcols = [0xffd54f, 0x81d4fa, 0xf48fb1, 0xa5d6a7, 0xce93d8];
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.18 + (i % 3) * 0.08, 16, 12),
      new THREE.MeshStandardMaterial({ color: fcols[i % 5], roughness: 0.4, transparent: true, opacity: 0.75 }));
    const a = (i / 9) * Math.PI * 2;
    b.userData = { x: Math.cos(a) * (5 + (i % 3)), z: -3 - (i % 4) * 1.2, y: 1 + (i % 4) * 1.1, ph: i * 1.3 };
    scene.add(b);
    floaters.push(b);
  }
  // Писта за тичане (само в стъпка 4).
  const track = new THREE.Group();
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 26), new THREE.MeshStandardMaterial({ color: 0xd9825b, roughness: 0.9 }));
  lane.rotation.x = -Math.PI / 2;
  lane.position.y = 0.012;
  track.add(lane);
  const stripes = [];
  const stripeM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 13; i++) {
    for (const s of [1, -1]) {
      const st = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.9), stripeM);
      st.rotation.x = -Math.PI / 2;
      st.position.set(s * 1.0, 0.02, -13 + i * 2);
      track.add(st);
      stripes.push(st);
    }
  }
  track.visible = false;
  scene.add(track);

  const K = buildKid();
  const { kid } = K;
  scene.add(kid);

  // Органи.
  const BUILD = { brain: buildBrain, heart: buildHeart, lungs: buildLungs, stomach: buildStomach, intestines: buildIntestines };
  const HOMEPOS = {
    brain: [0, 4.02, -0.04], heart: [0.1, 2.58, 0.17], lungs: [0, 2.72, 0], stomach: [0.18, 2.1, 0.1], intestines: [0, 1.7, 0.08],
  };
  const organs = {};
  for (const id of MOVABLE) {
    const g = BUILD[id]();
    g.position.set(...HOMEPOS[id]);
    g.userData.pickId = id;
    g.userData.dragId = id;
    g.userData.locked = true;
    g.userData.home = new THREE.Vector3(...HOMEPOS[id]);
    if (id === 'heart') addHitBox(g, 0.42);
    if (id === 'stomach') addHitBox(g, 0.4);
    if (id === 'lungs' || id === 'intestines') addHitBox(g, 0.4);
    kid.add(g);
    organs[id] = g;
  }

  // Кръвоносни съдове: червени (от сърцето) и сини (към сърцето), с течащи точки.
  const artM = organMat(0xd32f2f, { roughness: 0.4 });
  const veinM = organMat(0x3f6fd1, { roughness: 0.4 });
  const vesselGroup = new THREE.Group();
  vesselGroup.userData.pickId = 'vessels';
  kid.add(vesselGroup);
  const dots = [];
  const vesselMeshes = [];
  function vessel(parent, pts, vOff, { hit = true } = {}) {
    const ac = curveOf(pts);
    const vc = curveOf(pts.map(([x, y, z]) => [x + vOff[0], y + vOff[1], z + vOff[2]]));
    for (const [c, m, rev, col] of [[ac, artM, false, 0xff6b6b], [vc, veinM, true, 0x8fb2ff]]) {
      const t = tube(c, 0.022, m, 32, 6);
      t.userData.pickId = 'vessels';
      parent.add(t);
      vesselMeshes.push(t);
      const d = flowDots(c, { n: Math.max(3, Math.round(c.getLength() * 7)), r: 0.032, color: col, speed: 0.55, reverse: rev });
      parent.add(d);
      dots.push(d);
      if (hit) {
        const h = hitTube(c, 0.085);
        h.userData.pickId = 'vessels';
        parent.add(h);
      }
    }
  }
  vessel(vesselGroup, [[0.08, 2.72, 0.12], [0.08, 2.95, 0.02], [0.11, 3.3, 0.02], [0.14, 3.55, -0.04], [0.1, 3.78, -0.12]], [0.05, 0, -0.03]);
  vessel(vesselGroup, [[0.03, 2.72, 0.12], [-0.06, 2.95, 0.02], [-0.11, 3.3, 0.02], [-0.14, 3.55, -0.04], [-0.1, 3.78, -0.12]], [-0.05, 0, -0.03]);
  vessel(vesselGroup, [[0.08, 2.72, 0.12], [0.05, 2.9, -0.06], [-0.04, 2.76, -0.17], [-0.04, 2.2, -0.19], [-0.02, 1.6, -0.16], [0, 1.3, -0.1]], [-0.09, 0, 0.03], { hit: false });
  for (const s of [1, -1]) {
    vessel(vesselGroup, [[0, 1.3, -0.1], [s * 0.15, 1.22, -0.03], [s * 0.27, 1.1, 0.03]], [s * 0.05, 0, 0.05], { hit: false });
    vessel(vesselGroup, [[0.06, 2.74, 0.1], [s * 0.3, 2.97, 0.05], [s * 0.62, 2.93, 0.02]], [0, -0.06, -0.03], { hit: false });
    const leg = K.legs[s > 0 ? 0 : 1];
    vessel(leg, [[0, -0.02, 0.03], [0.02, -0.5, 0.09], [0, -0.92, 0.1]], [s * 0.06, 0, -0.02]);
    const arm = K.arms[s > 0 ? 0 : 1];
    vessel(arm, [[0, -0.02, 0.03], [0.01, -0.7, 0.07], [0, -1.32, 0.06]], [s * 0.045, 0, -0.03]);
  }
  // Котви за балончета и камерата.
  const anchors = {};
  const tagAnchors = {};
  const addAnchor = (parent, pos) => { const a = new THREE.Object3D(); a.position.set(...pos); parent.add(a); return a; };
  anchors.brain = addAnchor(organs.brain, [0, 0.32, 0]);
  anchors.heart = addAnchor(organs.heart, [0, 0.16, 0]);
  anchors.lungs = addAnchor(organs.lungs, [-0.3, 0.42, 0]);
  anchors.stomach = addAnchor(organs.stomach, [0.05, 0.18, 0]);
  anchors.intestines = addAnchor(organs.intestines, [0, 0.27, 0]);
  const vesselCenter = addAnchor(K.arms[0], [0, -0.75, 0.05]);
  anchors.vessels = addAnchor(K.arms[0], [0, -0.55, 0.05]);
  // Етикетите в стъпка 3 са разпръснати, за да не се застъпват.
  tagAnchors.brain = addAnchor(kid, [0, 4.5, 0.4]);
  tagAnchors.heart = addAnchor(kid, [0.42, 2.62, 0.35]);
  tagAnchors.lungs = addAnchor(kid, [-0.45, 3.08, 0.3]);
  tagAnchors.stomach = addAnchor(kid, [0.45, 2.02, 0.3]);
  tagAnchors.intestines = addAnchor(kid, [-0.4, 1.6, 0.3]);
  tagAnchors.vessels = addAnchor(K.arms[1], [0, -1.15, 0.08]);
  const centerOf = (id) => (id === 'vessels' ? vesselCenter : organs[id]);

  const glows = {};
  for (const id of MOVABLE) glows[id] = glowOf(organs[id]);
  glows.vessels = { set(k) { for (const m of [artM, veinM]) { m.emissive.copy(m.color); m.emissiveIntensity = k; } } };
  let glowId = null;
  const flash = new Map(); // id -> {k, color}

  // HUD за пулс и дишане.
  const hud = document.createElement('div');
  hud.className = 'body-hud';
  hud.hidden = true;
  hud.innerHTML = `<div class="body-row"><span class="body-ico hb">❤️</span><span class="body-num bpm">80</span><span class="body-unit">удара в минута</span></div>
    <div class="body-bar"><i class="bbar" style="background:#e53935"></i></div>
    <div class="body-row"><span class="body-ico">🫁</span><span class="body-num brm">20</span><span class="body-unit">вдишвания в минута</span></div>
    <div class="body-bar"><i class="rbar" style="background:#42a5f5"></i></div>`;
  stage.overlay.parentElement.appendChild(hud);
  const heldEl = document.createElement('div');
  heldEl.className = 'body-held';
  heldEl.hidden = true;
  stage.overlay.parentElement.appendChild(heldEl);
  const hq = (s) => hud.querySelector(s);

  // ---------- живот: сърце, дишане, кръв, мигане, тичане ----------
  const life = { bpm: 80, br: 18, wantBpm: 80, wantBr: 18, beat: 0, breath: 0, jog: 0, wantJog: 0, jogPh: 0, sway: true };
  const MODES = { rest: [80, 18, 0], walk: [100, 26, 0.45], run: [150, 44, 1] };
  function setMode(m) { [life.wantBpm, life.wantBr, life.wantJog] = MODES[m]; }
  const puffs = [];
  const puffM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false });
  let lastBreathHalf = 0;
  let blink = 2;
  stage.tick((dt, t) => {
    const ap = (cur, want, rate) => cur + (want - cur) * Math.min(1, dt * rate);
    life.bpm = ap(life.bpm, life.wantBpm, 0.9);
    life.br = ap(life.br, life.wantBr, 0.9);
    life.jog = ap(life.jog, life.wantJog, 2.5);
    // сърце: „туп-туп“
    life.beat = (life.beat + (dt * life.bpm) / 60) % 1;
    const b = life.beat;
    const pulse = Math.max(0, Math.sin(Math.min(1, b / 0.13) * Math.PI)) * (b < 0.13 ? 1 : 0)
      + 0.6 * (b > 0.2 && b < 0.31 ? Math.sin(((b - 0.2) / 0.11) * Math.PI) : 0);
    organs.heart.userData.inner.scale.setScalar(1 + 0.16 * pulse);
    // дишане
    life.breath = (life.breath + (dt * life.br) / 60) % 1;
    const inh = 0.5 - 0.5 * Math.cos(life.breath * Math.PI * 2);
    const amp = 0.05 + 0.05 * life.jog;
    for (const l of organs.lungs.userData.lobes) {
      l.scale.x = (l.position.x > 0 ? 0.23 : 0.26) * (1 + amp * 1.2 * inh);
      l.scale.y = 0.42 * (1 + amp * 0.6 * inh);
      l.scale.z = 0.23 * (1 + amp * inh);
    }
    K.torso.scale.x = 1 + 0.02 * inh;
    K.torso.scale.z = 0.64 * (1 + 0.035 * inh);
    // издишване: облачета пред устата (по-често при тичане)
    const half = life.breath > 0.5 ? 1 : 0;
    if (half && !lastBreathHalf && life.jog > 0.2) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), puffM.clone());
      const wp = K.mouth.getWorldPosition(new THREE.Vector3());
      p.position.copy(wp).add(new THREE.Vector3(0, 0, 0.08));
      p.userData.age = 0;
      scene.add(p);
      puffs.push(p);
    }
    lastBreathHalf = half;
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.userData.age += dt;
      p.position.z += dt * 0.6;
      p.position.y += dt * 0.15;
      p.scale.setScalar(1 + p.userData.age * 2.5);
      p.material.opacity = Math.max(0, 0.5 - p.userData.age * 0.5);
      if (p.userData.age > 1) { scene.remove(p); p.geometry.dispose(); p.material.dispose(); puffs.splice(i, 1); }
    }
    // кръв
    const rate = life.bpm / 80;
    for (const d of dots) d.userData.update(dt, rate);
    // мозък — искрици
    for (const s of organs.brain.userData.sparks) {
      const k = 0.5 + 0.5 * Math.sin(t * 3 + s.userData.ph * 3);
      s.scale.setScalar(0.4 + k * 1.1);
    }
    // стомах и черва — бавно свиване
    organs.stomach.userData.body.scale.y = 0.14 * (1 + 0.06 * Math.sin(t * 1.7));
    organs.intestines.userData.small.position.y = Math.sin(t * 2.1) * 0.006;
    organs.intestines.userData.small.rotation.z = Math.sin(t * 1.3) * 0.02;
    // мигане
    blink -= dt;
    const closed = blink < 0.12;
    for (const e of K.eyes) e.scale.y = closed ? 0.12 : 1;
    if (blink < 0) blink = 2.2 + Math.random() * 2.5;
    // тичане на място
    life.jogPh += dt * (3 + 6 * life.jog) * (life.jog > 0.02 ? 1 : 0);
    const sw = Math.sin(life.jogPh) * life.jog;
    K.legs[0].rotation.x = sw * 0.75;
    K.legs[1].rotation.x = -sw * 0.75;
    K.arms[0].rotation.x = -sw * 0.8 + Math.sin(t * 0.9) * 0.04 * (1 - life.jog);
    K.arms[1].rotation.x = sw * 0.8 - Math.sin(t * 0.9 + 1) * 0.04 * (1 - life.jog);
    kid.position.y = Math.abs(Math.sin(life.jogPh)) * 0.14 * life.jog;
    kid.rotation.y = life.sway ? Math.sin(t * 0.45) * 0.14 * (1 - life.jog) : kid.rotation.y * 0.9;
    K.head.rotation.z = Math.sin(t * 0.6) * 0.04;
    K.cheekM.opacity = 0.45 + 0.4 * life.jog;
    if (track.visible) for (const s of stripes) { s.position.z += dt * 6 * life.jog; if (s.position.z > 13) s.position.z -= 26; }
    // светене
    for (const id of Object.keys(glows)) {
      const f = flash.get(id);
      if (f) {
        f.k -= dt;
        glows[id].set(Math.max(0, f.k) * 0.8, f.color);
        if (f.k <= 0) { flash.delete(id); glows[id].set(0); }
      } else if (id === glowId) {
        glows[id].set(0.35 + 0.25 * Math.sin(t * 4), byId[id].glow);
      }
    }
    // фон
    for (const fb of floaters) fb.position.set(fb.userData.x + Math.sin(t * 0.3 + fb.userData.ph) * 0.4, fb.userData.y + Math.sin(t * 0.6 + fb.userData.ph) * 0.35, fb.userData.z);
    // HUD
    if (!hud.hidden) {
      hq('.bpm').textContent = Math.round(life.bpm);
      hq('.brm').textContent = Math.round(life.br);
      hq('.bbar').style.width = `${Math.min(100, ((life.bpm - 50) / 120) * 100)}%`;
      hq('.rbar').style.width = `${Math.min(100, ((life.br - 8) / 44) * 100)}%`;
      hq('.hb').style.transform = `scale(${1 + 0.3 * pulse})`;
    }
  });

  function setGlow(id) {
    if (glowId && glowId !== id) glows[glowId].set(0);
    glowId = id;
  }

  // Балончета.
  let tip = null;
  function say(id, html, cls = '') {
    clearTip();
    tip = stage.bubble(anchors[id], html, { lift: 0.05, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  stage.onHover(() => {});
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Органи',
    items: ORGANS.map((o) => ({ id: o.id, label: o.label, icon: o.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });

  function overview(dur = 1) {
    stage.stopFollow();
    stage.flyTo(HOME.pos, HOME.tgt, dur);
  }
  function lockView(on) {
    const c = stage.controls;
    c.minAzimuthAngle = on ? -0.55 : -Infinity;
    c.maxAzimuthAngle = on ? 0.55 : Infinity;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    setGlow(null);
    menu.show(true);
    life.sway = true;
    const seen = new Set();
    shell.task(`<p>Запознай се с Боби! Тялото му е прозрачно и виждаш органите вътре.</p>
      <p><b>Разгледай всички органи.</b> Избери ги от менюто или кликни върху тях.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🧍 Цялото тяло</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); setGlow(null); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани органи: ${seen.size} от ${ORGANS.length}`);
    upd();
    const visit = (id) => {
      const o = byId[id];
      const near = { brain: 2.3, heart: 1.9, lungs: 2.6, stomach: 2.1, intestines: 2.3, vessels: 3.4 }[id];
      stage.focusOn(centerOf(id), { dist: near, height: 0.25, lift: 0.1 });
      setGlow(id);
      say(id, `<b>${o.icon} ${esc(o.label)}</b><br>${esc(o.note)}<br><span class="small">${esc(o.fact)}</span>`);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === ORGANS.length) {
        next.disabled = false;
        shell.msg('Браво! Разгледа всички органи.', 'good');
      }
    };
    clickHandler = (id) => { if (!id) { clearTip(); setGlow(null); menu.setActive(null); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Върни органите ----------
  let stopDrag = null;
  const slotMarks = [];
  const trayParts = [];
  function step2() {
    shell.step(1);
    clearTip();
    setGlow(null);
    menu.show(false);
    menuHandler = null;
    life.sway = false;
    kid.rotation.y = 0;
    lockView(true);
    stage.stopFollow();
    stage.flyTo([0, 2.95, 8.6], [0, 2.55, 0], 1);
    // табли от двете страни
    const shape = new THREE.Shape();
    const w = 1.25; const h = 3.5; const r = 0.22;
    shape.moveTo(-w / 2 + r, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); shape.lineTo(-w / 2, -h / 2 + r); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    for (const s of [1, -1]) {
      const board = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
      board.position.set(s * 2.15, 2.65, -0.45);
      scene.add(board);
      trayParts.push(board);
    }
    const slots = shuffle([[-2.15, 3.85], [-2.15, 2.65], [-2.15, 1.5], [2.15, 3.55], [2.15, 1.95]]);
    MOVABLE.forEach((id, i) => {
      const g = organs[id];
      g.userData.tray = new THREE.Vector3(slots[i][0], slots[i][1], g.userData.home.z);
      g.userData.placed = false;
      g.userData.locked = false;
      g.userData.miss = 0;
      mv.move(g, g.userData.tray, 0.8 + i * 0.12, { arc: 0.6 });
    });
    // места за органите
    const markM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false });
    for (const id of MOVABLE) {
      const p = organs[id].userData.home.clone();
      p.z = id === 'brain' ? 0.62 : 0.42;
      if (id === 'brain') p.y += 0.1;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.13, 24), markM);
      ring.position.copy(p);
      ring.renderOrder = 20;
      ring.userData.id = id;
      kid.add(ring);
      slotMarks.push(ring);
    }
    const stopPulse = stage.tick((dt, t) => { for (const m of slotMarks) m.scale.setScalar(1 + 0.18 * Math.sin(t * 4)); });
    shell.task(`<p>Опа! Органите на Боби изскочиха навън.</p>
      <p><b>Провлачи всеки орган</b> обратно на мястото му в тялото. Белите кръгчета показват празните места.</p>`);
    shell.setControls('');
    let mistakes = 0;
    let placed = 0;
    const upd = () => shell.score(`На място: ${placed} от ${MOVABLE.length} · грешки: ${mistakes}`);
    upd();
    clickHandler = null;
    const region = (p) => (p.y > 3.35 ? 'head' : p.y > 2.3 ? 'chest' : 'belly');
    const inBody = (p) => Math.abs(p.x) < 0.75 && p.y > 1.0 && p.y < 4.6;
    stopDrag = verticalDrag(stage, {
      planeZ: 0.2,
      onStart: (g) => { clearTip(); setGlow(g.userData.pickId); },
      onDrop: (g, p) => {
        const id = g.userData.pickId;
        setGlow(null);
        const home = g.userData.home;
        const d = Math.hypot(p.x - home.x, p.y - home.y);
        if (d < 0.42) {
          g.userData.locked = true;
          g.userData.placed = true;
          mv.move(g, home, 0.3);
          placed++;
          flash.set(id, { k: 1, color: 0x66ff99 });
          const mk = slotMarks.find((m) => m.userData.id === id);
          if (mk) mk.visible = false;
          say(id, `✔ <b>${esc(byId[id].label)}</b> е на мястото си!`, 'good');
          shell.msg('Вярно!', 'good');
        } else if (inBody(p)) {
          mistakes++;
          g.userData.miss++;
          mv.move(g, g.userData.tray, 0.55, { arc: 0.4 });
          const hint = PLACE_HINTS[id][Math.min(1, g.userData.miss - 1)];
          const where = { head: 'в главата', chest: 'в гърдите', belly: 'в корема' }[region(p)];
          shell.msg(`${byId[id].label} не е ${where}. ${hint}`, 'bad');
          say(id, `✘ Не е тук. ${esc(hint)}`, 'bad');
        } else {
          mv.move(g, g.userData.tray, 0.4);
        }
        upd();
        if (placed === MOVABLE.length) {
          stopDrag(); stopDrag = null;
          stopPulse();
          scores.push(stepScore(mistakes, 3));
          for (const b of trayParts) scene.remove(b);
          trayParts.length = 0;
          shell.msg(mistakes ? `Готово! Грешки: ${mistakes}.` : 'Всички органи са на място без нито една грешка! 🎉', 'good');
          const ctrl = shell.setControls('<button class="btn primary">Напред →</button>');
          ctrl.querySelector('button').addEventListener('click', step3);
        }
      },
    });
  }

  // ---------- 3. Кой какво прави? ----------
  const tags = [];
  function step3() {
    shell.step(2);
    clearTip();
    lockView(false);
    life.sway = true;
    for (const m of slotMarks) kid.remove(m);
    slotMarks.length = 0;
    stage.stopFollow();
    stage.flyTo([0, 3.0, 6.6], [0, 2.55, 0], 1);
    let held = null;
    let mistakes = 0;
    const done = new Set();
    const order = shuffle(ORGANS.map((o) => o.id));
    const draw = () => {
      shell.task(`<p>Всеки орган има своя работа.</p>
        <p><b>Избери работа отдолу, после кликни органа, който я върши.</b></p>
        <div class="xp-chips">${order.map((id) => `<span class="chip body-fn ${done.has(id) ? 'used' : ''} ${held === id ? 'held' : ''}" data-k="${id}">${esc(byId[id].fn)}</span>`).join('')}</div>`);
      container.querySelectorAll('.xp-chips .chip').forEach((ch) => ch.addEventListener('click', () => {
        held = ch.dataset.k;
        container.querySelectorAll('.xp-chips .chip').forEach((x) => x.classList.toggle('held', x === ch));
        shell.msg('Сега кликни органа в тялото на Боби.');
        heldEl.textContent = `Кой орган: „${byId[held].fn}“?`;
        heldEl.hidden = false;
        // На тесен екран сцената е над панела — показваме я.
        const r = shell.stageEl.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) shell.stageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));
    };
    draw();
    shell.setControls('');
    const upd = () => shell.score(`Свързани: ${done.size} от ${ORGANS.length} · грешки: ${mistakes}`);
    upd();
    const missOn = {};
    clickHandler = (id) => {
      if (!id) return;
      if (!held) { shell.msg('Първо избери работа отдолу.', 'bad'); return; }
      if (done.has(id)) { shell.msg(`${byId[id].label} вече има своя работа. Избери друг орган.`, 'bad'); return; }
      if (id === held) {
        done.add(id);
        flash.set(id, { k: 1.2, color: 0x66ff99 });
        clearTip();
        tags.push(stage.bubble(tagAnchors[id], `✔ ${esc(byId[id].label)}`, { lift: 0, cls: 'tag good' }));
        shell.msg(`Вярно! ${byId[id].label}: ${byId[id].fn.toLowerCase()}.`, 'good');
        held = null;
        heldEl.hidden = true;
        draw();
        upd();
        if (done.size === ORGANS.length) {
          clickHandler = null;
          scores.push(stepScore(mistakes, 3));
          shell.msg(mistakes ? `Свърза всички! Грешки: ${mistakes}.` : 'Свърза всички без грешка! 🎉', 'good');
          const ctrl = shell.setControls('<button class="btn primary">Напред →</button>');
          ctrl.querySelector('button').addEventListener('click', step4);
        }
        return;
      }
      mistakes++;
      missOn[held] = (missOn[held] || 0) + 1;
      flash.set(id, { k: 0.8, color: 0xff3030 });
      say(id, `✘ Това е <b>${esc(byId[id].label.toLowerCase())}</b>. ${PRON[id]} не ${id === 'lungs' || id === 'intestines' || id === 'vessels' ? 'правят' : 'прави'} това.`, 'bad');
      shell.msg(missOn[held] >= 2 ? `Подсказка: ${FN_HINTS[held]}` : `Не е ${byId[id].label.toLowerCase()}. Помисли пак.`, 'bad');
      upd();
    };
  }

  // ---------- 4. Какво става, когато тичаш? ----------
  function step4() {
    shell.step(3);
    clearTip();
    for (const t of tags) t.remove();
    tags.length = 0;
    track.visible = true;
    floor.visible = false;
    floorRing.visible = false;
    hud.hidden = false;
    setMode('rest');
    stage.stopFollow();
    stage.flyTo([2.6, 3.0, 7.6], [0, 2.3, 0], 1);
    const opts = [{ v: 'up', t: '⬆ по-бързо' }, { v: 'down', t: '⬇ по-бавно' }, { v: 'same', t: '＝ както преди' }];
    shell.task(`<p>Сега Боби ще потича. Виж горе вдясно: сърцето му бие 80 пъти в минута.</p>
      <p><b>Как мислиш, когато тича, сърцето му ще бие…</b></p>${choicesHTML('h', opts)}
      <p><b>А той ще диша…</b></p>${choicesHTML('b', opts)}`);
    const ans = {};
    container.querySelectorAll('.xp-task .choices').forEach((box) => {
      box.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        box.querySelectorAll('.choice').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        ans[box.dataset.q] = b.dataset.v;
        go.disabled = !(ans.h && ans.b);
      }));
    });
    shell.score('');
    const ctrl = shell.setControls('<button class="btn primary" disabled>🏃 Провери: нека Боби тича!</button>');
    const go = ctrl.querySelector('button');
    clickHandler = (id) => {
      if (!id) return clearTip();
      say(id, `<b>${byId[id].icon} ${esc(byId[id].label)}</b><br>${esc(byId[id].fn)}.`);
    };
    go.addEventListener('click', () => {
      const good = (ans.h === 'up' ? 1 : 0) + (ans.b === 'up' ? 1 : 0);
      container.querySelectorAll('.xp-task .choices').forEach((box) => {
        box.querySelectorAll('.choice').forEach((b) => {
          b.disabled = true;
          if (b.dataset.v === 'up') b.classList.add('right');
          else if (b.classList.contains('on')) b.classList.add('wrong');
        });
      });
      runPhase(good, { ...ans });
    });
  }

  let runTimer = null;
  function runPhase(good, pred) {
    setMode('run');
    const c = shell.setControls(`<div class="body-modes"><button class="btn" data-m="rest">🧍 Почивай</button><button class="btn" data-m="walk">🚶 Ходи</button><button class="btn on" data-m="run">🏃 Тичай</button></div>`);
    c.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      c.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b));
      setMode(b.dataset.m);
    }));
    shell.msg(good === 2 ? 'Гледай пулса и дишането!' : 'Гледай пулса и дишането — какво става?');
    runTimer = setTimeout(() => {
      runTimer = null;
      say('heart', '<b>Туп-туп-туп!</b> Когато Боби тича, сърцето бие много по-бързо, а той диша по-бързо и по-дълбоко.', 'wide');
      shell.msg(good === 2 ? 'Позна и двете! 🎉' : good === 1 ? 'Позна едното.' : 'Сърцето и дишането станаха по-бързи.', good === 2 ? 'good' : 'bad');
      askWhy(good, pred);
    }, 3800);
  }

  function askWhy(good, pred) {
    const opts = shuffle([
      { v: 'ok', t: 'Мускулите на краката работят много и им трябва повече кръв с кислород и храна.' },
      { v: 'food', t: 'За да се смила храната по-бързо.' },
      { v: 'cold', t: 'Защото на Боби му е студено.' },
    ]);
    const mark = (v) => (v === 'up' ? '✔' : '✘');
    shell.task(`<p class="small">Ти предположи: сърцето — <b>${PRED[pred.h]} ${mark(pred.h)}</b>, дишането — <b>${PRED[pred.b]} ${mark(pred.b)}</b>.</p><p><b>Защо, когато тичаш, сърцето бие по-бързо?</b></p>${choicesHTML('w', opts)}
      <p class="small">Пробвай и бутоните „Почивай“ и „Ходи“.</p>`);
    let tries = 0;
    container.querySelectorAll('.xp-task .choices[data-q="w"] .choice').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      tries++;
      if (b.dataset.v !== 'ok') {
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg('Не. Помисли: какво носи кръвта до мускулите на краката?', 'bad');
        return;
      }
      b.classList.add('right');
      container.querySelectorAll('.xp-task .choices[data-q="w"] .choice').forEach((x) => { x.disabled = true; });
      shell.msg('Вярно! Кръвта носи кислород и храна до мускулите. Когато си почине, сърцето на Боби пак бие бавно.', 'good');
      scores.push((good + (tries === 1 ? 1 : 0)) / 3);
      const ctrl = container.querySelector('.xp-controls');
      const fin = document.createElement('button');
      fin.className = 'btn primary';
      fin.textContent = 'Виж резултата';
      fin.style.marginTop = '8px';
      ctrl.appendChild(fin);
      fin.addEventListener('click', () => {
        clearTip();
        setMode('rest');
        const ratio = scores.reduce((a, s) => a + s, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    }));
  }

  function restart() {
    if (runTimer) { clearTimeout(runTimer); runTimer = null; }
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    for (const t of tags) t.remove();
    tags.length = 0;
    for (const m of slotMarks) kid.remove(m);
    slotMarks.length = 0;
    for (const b of trayParts) scene.remove(b);
    trayParts.length = 0;
    mv.clear();
    for (const id of MOVABLE) {
      const g = organs[id];
      g.position.copy(g.userData.home);
      g.userData.locked = true;
    }
    track.visible = false;
    floor.visible = true;
    floorRing.visible = true;
    hud.hidden = true;
    heldEl.hidden = true;
    setMode('rest');
    lockView(false);
    scores.length = 0;
    step1();
  }

  step1();
  return {
    dispose() {
      if (runTimer) clearTimeout(runTimer);
      if (stopDrag) stopDrag();
      hud.remove();
      heldEl.remove();
      menu.remove();
      stage.dispose();
    },
  };
}
