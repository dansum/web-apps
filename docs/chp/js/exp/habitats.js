// 3.2.5 „Среда на живот, приспособления и опазване“ — езеро, ливада, пясъчна поляна и защитена местност.
// Стъпки: опознай → какво става, ако езерото пресъхне → обитатели и приспособления → опази средата.
import { labelSprite, mat, addHitBox, THREE, esc, shuffle } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, bar, stepScore } from './labkit.js';
import { meadow, clouds, treeModel, quadruped, butterflyModel, flap, flowerModel, birdModel, swingLegs, lerp, seg } from './nature3.js';

const V3 = THREE.Vector3;
const POND = { x: -3.2, z: 0.2, r: 2.3, h: 0.32 };

function fishModel(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), mat(color));
  body.scale.set(1.6, 0.85, 0.5);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 4), mat(color));
  tail.rotation.z = Math.PI / 2; tail.position.x = -0.3;
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 3), mat(color));
  fin.position.set(0, 0.14, 0);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(0x111111));
  eye.position.set(0.17, 0.04, 0.07);
  const gill = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 4, 10, Math.PI), mat(0x8d3b1f));
  gill.position.set(0.09, 0, 0.075); gill.rotation.z = Math.PI / 2;
  g.add(body, tail, fin, eye, gill);
  g.userData.tail = tail;
  return g;
}

function duckModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), mat(0x8d6e63));
  body.scale.set(1.4, 0.8, 0.9);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), mat(0x2e7d32));
  head.position.set(0.3, 0.25, 0);
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.09), mat(0xffb300));
  beak.position.set(0.45, 0.22, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), mat(0xffffff));
  ring.position.set(0.26, 0.14, 0); ring.rotation.y = Math.PI / 2;
  g.add(body, head, beak, ring);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), mat(0x111111));
    e.position.set(0.39, 0.29, s * 0.07);
    const web = new THREE.Mesh(new THREE.CircleGeometry(0.08, 3), mat(0xff8f00, { side: THREE.DoubleSide }));
    web.rotation.x = -Math.PI / 2; web.position.set(-0.05, -0.18, s * 0.1);
    g.add(e, web);
  }
  return g;
}

function crabModel() {
  const g = new THREE.Group();
  const m = mat(0xc0392b);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), m);
  b.scale.set(1.2, 0.5, 1);
  b.position.y = 0.1;
  g.add(b);
  for (const s of [1, -1]) {
    const claw = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), m);
    claw.scale.set(1.4, 0.7, 0.8); claw.position.set(0.24, 0.1, s * 0.13);
    g.add(claw);
    for (let i = 0; i < 3; i++) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 4), m);
      l.position.set(-0.06 + i * 0.07, 0.05, s * 0.18); l.rotation.x = s * 1.0;
      g.add(l);
    }
  }
  return g;
}

function cactusModel() {
  const g = new THREE.Group();
  const m = mat(0x558b2f);
  const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.1, 6, 12), m);
  trunk.position.y = 0.75;
  g.add(trunk);
  for (const [s, h] of [[1, 0.8], [-1, 1.05]]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.4, 4, 10), m);
    arm.position.set(s * 0.38, h + 0.2, 0);
    const elbow = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.2, 4, 10), m);
    elbow.rotation.z = Math.PI / 2; elbow.position.set(s * 0.25, h, 0);
    g.add(arm, elbow);
  }
  const spineM = mat(0xfff8e1);
  for (let i = 0; i < 26; i++) {
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.09, 4), spineM);
    const a = i * 2.4; const y = 0.3 + (i % 9) * 0.14;
    sp.position.set(Math.cos(a) * 0.23, y, Math.sin(a) * 0.23);
    sp.rotation.z = -Math.cos(a) * 1.4; sp.rotation.x = Math.sin(a) * 1.4;
    g.add(sp);
  }
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0xec407a));
  fl.position.y = 1.43;
  g.add(fl);
  return g;
}

function moleModel() {
  const g = new THREE.Group();
  const hill = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5d4037, { flat: true }));
  hill.scale.y = 0.6;
  g.add(hill);
  const mole = new THREE.Group();
  const m = mat(0x37373f);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), m);
  body.scale.set(1, 1.2, 0.9);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 8), mat(0xf48fb1));
  snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.08, 0.22);
  mole.add(body, snout);
  for (const s of [1, -1]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0xf8bbd0));
    paw.scale.set(1.2, 0.35, 1); paw.position.set(s * 0.2, 0.0, 0.14); paw.rotation.z = s * 0.6;
    mole.add(paw);
  }
  mole.position.y = 0.3;
  g.add(mole);
  g.userData.mole = mole;
  return g;
}

function lizardModel() {
  const g = new THREE.Group();
  const m = mat(0x8d9a3a);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.35, 4, 8), m);
  body.rotation.z = Math.PI / 2; body.position.y = 0.08;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), m);
  head.scale.set(1.4, 0.8, 1); head.position.set(0.3, 0.09, 0);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 6), m);
  tail.rotation.z = Math.PI / 2; tail.position.set(-0.45, 0.07, 0);
  g.add(body, head, tail);
  for (const [x, s] of [[0.12, 1], [0.12, -1], [-0.12, 1], [-0.12, -1]]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 4), m);
    l.rotation.x = s * 1.2; l.position.set(x, 0.05, s * 0.09);
    g.add(l);
  }
  return g;
}

function pineModel(s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 0.9 * s, 8), mat(0x6d4c41));
  trunk.position.y = 0.45 * s;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry((0.9 - i * 0.22) * s, 1.0 * s, 9), mat(0x2e6b3a, { flat: true }));
    c.position.y = (1.1 + i * 0.55) * s;
    g.add(c);
  }
  return g;
}

function signModel() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), mat(0x6d4c41));
  post.position.y = 0.65;
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 0.06), mat(0x8d6e63));
  board.position.y = 1.35;
  g.add(post, board);
  const t = labelSprite('ЗАЩИТЕНА МЕСТНОСТ', { size: 0.17, bg: 'rgba(46,125,50,0.95)', color: '#ffffff', border: '#1b5e20' });
  t.position.set(0, 1.35, 0.06);
  t.raycast = () => {};
  g.add(t);
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Ако езерото пресъхне', 'Кой как е приспособен?', 'Опази средата'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xbfe3ff, camPos: [0, 6, 11], target: [0, 0.5, 0], maxDistance: 24 } });
  const { shell, stage, scene } = ctx;
  scene.fog = new THREE.Fog(0xbfe3ff, 24, 55);
  meadow(scene);
  clouds(stage, 5, { y: 8 });
  for (let i = 0; i < 12; i++) {
    const t = i % 3 ? treeModel(0.9 + (i % 2) * 0.3) : pineModel(1.2);
    t.position.set(-11 + i * 2, 0, -7.5 - (i % 2) * 1.5);
    scene.add(t);
  }

  const tags = [];
  const tag = (obj, html, cls = 'tag', lift = 1.0) => { const b = stage.bubble(obj, html, { cls, lift }); tags.push(b); return b; };
  const clearTags = () => { while (tags.length) tags.pop().remove(); };
  const named = (g, text, y) => {
    const l = labelSprite(text, { size: 0.22 });
    l.position.y = y; l.raycast = () => {};
    g.add(l); stage.steadyLabel(l, 9);
    return l;
  };

  // ---------- Езеро ----------
  const pond = new THREE.Group();
  pond.position.set(POND.x, 0, POND.z);
  const mud = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 40), mat(0x6d5a3e));
  mud.rotation.x = -Math.PI / 2; mud.position.y = 0.01;
  const waterM = new THREE.MeshStandardMaterial({ color: 0x3d8fd1, transparent: true, opacity: 0.6, roughness: 0.1, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(POND.r, POND.r, 1, 40), waterM);
  // Водата не пречи да се кликнат рибите под нея.
  water.raycast = () => {};
  pond.add(mud, water);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.17 + (i % 3) * 0.04, 0), mat([0x9e9e9e, 0x8d8d8d, 0xbdbdbd][i % 3], { flat: true }));
    st.position.set(Math.cos(a) * (POND.r + 0.1), 0.12, Math.sin(a) * (POND.r + 0.1));
    pond.add(st);
  }
  for (let i = 0; i < 10; i++) {
    const a = 3.6 + i * 0.12;
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.9 + (i % 3) * 0.2, 5), mat(0x6d8f2a));
    r.position.set(Math.cos(a) * (POND.r - 0.25), 0.45, Math.sin(a) * (POND.r - 0.25));
    pond.add(r);
  }
  pond.userData.pickId = 'pond';
  scene.add(pond);
  const fishes = [0xff8a3d, 0xffb74d, 0xe57373].map((c, i) => {
    const f = fishModel(c);
    f.userData.ph = i * 2.1; f.userData.sp = 0.5 + i * 0.15;
    pond.add(f);
    return f;
  });
  // Всяка риба и всяка лилия се кликат — на малък екран е по-лесно.
  fishes.forEach((f) => { f.userData.pickId = 'fish'; addHitBox(f, 0.5); });
  named(fishes[0], 'Риба', 0.45);
  const lilyM = mat(0x43a047, { side: THREE.DoubleSide });
  const lilies = [];
  for (let i = 0; i < 4; i++) {
    const L = new THREE.Group();
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16, 0.3, Math.PI * 1.8), lilyM);
    pad.rotation.x = -Math.PI / 2;
    L.add(pad);
    if (i === 0) {
      for (let k = 0; k < 6; k++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0xf8bbd0));
        p.scale.set(1, 0.5, 2); p.position.set(Math.cos(k) * 0.07, 0.06, Math.sin(k) * 0.07); p.rotation.y = -k;
        L.add(p);
      }
    }
    L.position.set(Math.cos(i * 1.7 + 0.5) * 1.75, 0, Math.sin(i * 1.7 + 0.5) * 1.45);
    pond.add(L);
    lilies.push(L);
  }
  lilies.forEach((L) => { L.userData.pickId = 'lily'; addHitBox(L, 0.6); });
  named(lilies[0], 'Водна лилия', 0.5);
  const crab = crabModel();
  crab.position.set(0.2, 0.02, -1.6);
  pond.add(crab);
  crab.userData.pickId = 'crab';
  addHitBox(crab, 0.6);
  named(crab, 'Рак', 0.45);
  const duck = duckModel();
  duck.userData.pickId = 'duck';
  addHitBox(duck, 0.7);
  named(duck, 'Патица', 0.6);
  scene.add(duck);
  const P = { k: 1, want: 1, duckAway: 0, slow: 1, tf: 0, td: 0 };

  stage.tick((dt, t0) => {
    // Във 3. стъпка рибите и патицата плуват по-бавно, за да се кликат по-лесно.
    P.tf += dt * P.slow;
    const t = P.tf;
    P.k += (P.want - P.k) * Math.min(1, dt * 1.5);
    const k = P.k;
    const h = Math.max(0.02, POND.h * (0.15 + 0.85 * k));
    const rr = lerp(0.35, 1, k);
    water.scale.set(rr, h, rr);
    water.position.y = h / 2 + 0.01;
    waterM.color.setHex(0x3d8fd1).lerp(new THREE.Color(0x7a6a3a), 1 - k);
    lilyM.color.setHex(0x43a047).lerp(new THREE.Color(0x8d6e3a), seg(1 - k, 0.3, 0.9));
    lilies.forEach((L) => { L.position.y = h + 0.012; L.rotation.y += dt * 0.05; });
    fishes.forEach((f) => {
      const R = POND.r * rr * 0.42;
      const a = t * f.userData.sp * (0.4 + 0.6 * k) + f.userData.ph;
      f.position.set(Math.cos(a) * R, Math.max(0.06, h * 0.5), Math.sin(a) * R * 0.8);
      f.rotation.y = -a - Math.PI / 2;
      f.rotation.z = k < 0.3 ? Math.sin(t * 9 + f.userData.ph) * 0.3 : 0;
      f.userData.tail.rotation.y = Math.sin(t * (k < 0.3 ? 2 : 8)) * 0.4;
    });
    // Патицата отлита, когато водата свърши.
    P.duckAway += ((k < 0.4 ? 1 : 0) - P.duckAway) * Math.min(1, dt * 0.8);
    const da = t * 0.25;
    duck.position.set(POND.x + Math.cos(da) * 0.35 + P.duckAway * 6, h + 0.12 + P.duckAway * 4, POND.z + Math.sin(da) * 0.25 - P.duckAway * 4);
    duck.rotation.y = -da - Math.PI / 2;
    duck.visible = P.duckAway < 0.97;
    crab.position.x = 0.2 + Math.sin(t * 0.7) * 0.15;
  });

  // ---------- Суша: пясъчна поляна, ливада, гора ----------
  const sand = new THREE.Mesh(new THREE.CircleGeometry(2.1, 36), mat(0xe8cf91));
  sand.rotation.x = -Math.PI / 2; sand.position.set(4.0, 0.012, 0.3);
  scene.add(sand);
  const cactus = cactusModel();
  cactus.position.set(4.3, 0, 0.0);
  cactus.userData.pickId = 'cactus';
  named(cactus, 'Кактус', 1.85);
  addHitBox(cactus, 0.8);
  scene.add(cactus);
  const lizard = lizardModel();
  lizard.position.set(3.3, 0.02, 1.2);
  lizard.userData.pickId = 'lizard';
  named(lizard, 'Гущер', 0.45);
  addHitBox(lizard, 0.7);
  scene.add(lizard);
  const mole = moleModel();
  mole.position.set(1.1, 0, -1.0);
  mole.userData.pickId = 'mole';
  named(mole, 'Къртица', 0.95);
  addHitBox(mole, 0.8);
  scene.add(mole);
  const deer = quadruped({ color: 0xa0673a, r: 0.24, len: 0.6, legLen: 0.65, headR: 0.16, ears: 'pointy', neck: 1.4 });
  const deerG = new THREE.Group(); deerG.add(deer);
  deerG.userData.pickId = 'deer';
  named(deerG, 'Сърна', 1.85);
  addHitBox(deerG, 0.9);
  scene.add(deerG);
  const pine = pineModel(1.1);
  pine.position.set(2.4, 0, -3.0);
  pine.userData.pickId = 'pine';
  named(pine, 'Бор', 2.9);
  addHitBox(pine, 0.9);
  scene.add(pine);
  const sign = signModel();
  sign.position.set(1.3, 0, 1.9);
  sign.userData.pickId = 'sign';
  addHitBox(sign, 0.8);
  scene.add(sign);
  stage.tick((dt, t) => {
    const a = t * 0.12;
    deerG.position.set(-0.2 + Math.cos(a) * 1.0, 0, -3.4 + Math.sin(a) * 0.5);
    deerG.rotation.y = -a - Math.PI / 2 + Math.PI;
    swingLegs(deer, t * 6, 0.4);
    mole.userData.mole.position.y = 0.22 + Math.max(0, Math.sin(t * 0.8)) * 0.15;
    lizard.rotation.y = Math.sin(t * 0.4) * 0.6;
  });

  // ---------- Живот, който се връща, когато пазим средата (стъпка 4) ----------
  const life = [];
  for (let i = 0; i < 8; i++) {
    const kind = i % 3;
    const g = kind === 0 ? butterflyModel([0xff8f00, 0x42a5f5, 0xe91e63][i % 3]) : kind === 1 ? birdModel(0x5d4037, 0xffb300) : flowerModel([0xffeb3b, 0xe91e63, 0xffffff][i % 3], 0.45);
    g.userData.kind = kind;
    g.userData.home = new V3(-0.9 + (i % 4) * 0.6 + Math.floor(i / 4) * 0.3, 0, 1.4 + Math.floor(i / 4) * 0.7);
    if (kind === 0) g.scale.setScalar(0.7);
    g.visible = false;
    scene.add(g);
    life.push(g);
  }
  stage.tick((dt, t) => {
    life.forEach((g, i) => {
      if (!g.visible) return;
      const h = g.userData.home;
      if (g.userData.kind === 0) { flap(g, t); g.position.set(h.x + Math.sin(t * 0.7 + i) * 0.5, 0.9 + Math.sin(t * 1.3 + i) * 0.25, h.z); }
      else if (g.userData.kind === 1) g.position.set(h.x, Math.abs(Math.sin(t * 3 + i)) * 0.1, h.z);
      else g.position.copy(h);
    });
  });
  const showLife = (n) => life.forEach((g, i) => { g.visible = i < n; });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip(); clearTags();
    ctx.click = null;
    P.k = 1; P.want = 1; P.duckAway = 0; P.slow = 1;
    showLife(0);
    view(ctx, [0.4, 0.5, -0.2], 5.8, { halfH: 2.6 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Всеки организъм живее там, където намира храна, вода и подслон. Това е неговата <b>среда на живот</b>.</p><p><b>Разгледай всичко</b> от менюто или с клик.</p>',
      items: [
        { id: 'fish', label: 'Риба', icon: '🐟', note: 'Живее във водата. С <b>перките</b> плува, а с <b>хрилете</b> диша във водата.', obj: () => fishes[0], dist: 3 },
        { id: 'lily', label: 'Водна лилия', icon: '🪷', note: 'Водно растение. Широките ѝ листа плуват по водата.', obj: () => lilies[0], dist: 3 },
        { id: 'duck', label: 'Патица', icon: '🦆', note: 'Има <b>ципи</b> между пръстите. С тях гребе като с весла.', obj: () => duck, dist: 3 },
        { id: 'crab', label: 'Речен рак', icon: '🦀', note: 'Живее на дъното на реки и езера. Хваща храната си с щипките.', obj: () => crab, dist: 2.8 },
        { id: 'cactus', label: 'Кактус', icon: '🌵', note: 'Расте на сухи места. Пази вода в <b>дебелото си стъбло</b>. Има <b>бодли</b> вместо листа.', obj: () => cactus, dist: 3.6, lift: 0.8, bubble: 1.4 },
        { id: 'lizard', label: 'Гущер', icon: '🦎', note: 'Живее на сухи, слънчеви места. Пече се на слънце, за да се стопли.', obj: () => lizard, dist: 2.6 },
        { id: 'mole', label: 'Къртица', icon: '🕳', note: 'Живее под земята. С <b>широките си предни лапи</b> копае тунели.', obj: () => mole, dist: 3 },
        { id: 'deer', label: 'Сърна', icon: '🦌', note: 'Живее в гората и на ливадата. Дългите крака ѝ помагат да бяга бързо.', obj: () => deerG, dist: 3.8 },
        { id: 'sign', label: 'Защитена местност', icon: '🪧', note: 'Тук пазим растенията, животните и мястото, където живеят.', obj: () => sign, dist: 3.4, lift: 0.8, bubble: 1.4 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Ако езерото пресъхне ----------
  function step2() {
    shell.step(1);
    ctx.clearTip(); clearTags();
    view(ctx, [POND.x, 0.3, POND.z], 2.7, { halfH: 1.6, elev: 0.6 });
    shell.task('<p>Лятото е горещо и дълго не вали. Водата в езерото намалява.</p>');
    choice(ctx, {
      q: 'Какво ще стане с рибите, ако езерото пресъхне?',
      options: [
        { t: 'Ще загинат. Те живеят само във вода.', ok: true, why: 'Да видим. Плъзни лентата: минават седмици без дъжд.' },
        { t: 'Ще излязат и ще живеят на сушата.', ok: false, why: 'С какво дишат рибите? Могат ли да ходят?' },
        { t: 'Нищо няма да им стане.', ok: false, why: 'Рибите дишат и плуват във вода. Какво става, ако тя изчезне?' },
      ],
      hint: 'Рибите дишат с хриле във водата.',
      onRight: (m) => dry(m),
    });
  }
  function dry(m0) {
    let mistakes = m0;
    const c = shell.setControls('<label class="row">Седмици без дъжд <b class="dn">0</b> <input type="range" class="weeks" min="0" max="8" value="0" style="flex:1"></label>');
    let said = false;
    c.querySelector('.weeks').addEventListener('input', (e) => {
      const w = +e.target.value;
      c.querySelector('.dn').textContent = w;
      P.want = 1 - w / 8 * 0.95;
      if (w >= 8 && !said) {
        said = true;
        tag(fishes[0], 'Водата почти свърши. Рибите са в опасност.', 'tag bad', 0.5);
        tag(lilies[0], 'Лилиите изсъхват', 'tag bad', 0.45);
        shell.msg('Патицата отлетя да търси друго езеро. Рибите не могат да си тръгнат.', 'bad');
        const b = nextBtn(ctx, '🌧 Пусни дъжд', () => {
          b.disabled = true;
          clearTags();
          P.want = 1;
          rain();
          setTimeout(ask, 2600);
        });
      }
    });
    function ask() {
      shell.setControls('');
      shell.msg('Езерото се напълни. Рибите и лилиите отново са в своята среда.', 'good');
      choice(ctx, {
        q: 'Защо рибата живее само във вода?',
        options: [
          { t: 'Плува с перки и диша с хриле във водата.', ok: true, why: 'Вярно! Перките и хрилете са приспособления за живот във водата.' },
          { t: 'Защото не обича слънцето.', ok: false, why: 'Помисли за тялото на рибата. С какво диша?' },
          { t: 'Защото на сушата няма храна.', ok: false, why: 'На сушата има храна за много животни. Но може ли рибата да диша там?' },
        ],
        hint: 'Виж тялото на рибата: перки и хриле.',
        mistakes,
        onRight: (m) => { mistakes = m; ctx.scores[0] = stepScore(mistakes, 3); nextBtn(ctx, 'Напред →', step3); },
      });
    }
  }
  // Дъжд над езерото.
  const drops = [];
  for (let i = 0; i < 60; i++) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4), new THREE.MeshBasicMaterial({ color: 0x90caf9 }));
    d.visible = false; scene.add(d); drops.push(d);
  }
  let rainT = 0;
  function rain() { rainT = 3; drops.forEach((d) => { d.visible = true; d.position.set(POND.x + (Math.random() - 0.5) * 5, 1 + Math.random() * 4, POND.z + (Math.random() - 0.5) * 4); }); }
  stage.tick((dt) => {
    if (rainT <= 0) return;
    rainT -= dt;
    drops.forEach((d) => { d.position.y -= dt * 6; if (d.position.y < 0.1) d.position.y = 4.5; d.visible = rainT > 0; });
  });

  // ---------- 3. Кой как е приспособен? ----------
  const WATER = ['fish', 'lily', 'crab'];
  const ADAPT = [
    { t: 'fins', label: '🐟 Перки и хриле', who: 'fish', ok: 'Рибата плува с перки и диша с хриле.' },
    { t: 'webs', label: '🦆 Ципи между пръстите', who: 'duck', ok: 'Ципите правят крака на патицата като весла.' },
    { t: 'paws', label: '🕳 Широки лапи за копаене', who: 'mole', ok: 'Къртицата копае тунели в почвата с широките си лапи.' },
    { t: 'stem', label: '🌵 Дебело стъбло и бодли', who: 'cactus', ok: 'Кактусът пази вода в стъблото. Вместо листа има бодли — през тях се губи малко вода.' },
  ];
  const NAME = { fish: 'рибата', duck: 'патицата', mole: 'къртицата', cactus: 'кактуса', lily: 'лилията', crab: 'рака', lizard: 'гущера', deer: 'сърната', pine: 'бора' };
  function step3() {
    shell.step(2);
    ctx.clearTip(); clearTags();
    P.want = 1;
    view(ctx, [POND.x + 0.4, 0.3, POND.z], 2.9, { halfH: 1.7, elev: 0.75 });
    let mistakes = 0;
    const found = new Set();
    shell.task('<p>Във водата и на сушата живеят различни растения и животни.</p><p><b>Кликни всички, които живеят във водата.</b> Те са три.</p>');
    shell.setControls('');
    shell.score('Намерени: 0 от 3');
    P.slow = 0.25;
    ctx.click = (id) => {
      if (!id || id === 'pond' || id === 'sign' || found.has(id)) return;
      if (id === 'duck') { ctx.say(duck, 'Патицата плува, но живее и на сушата: ходи, храни се и гнезди на брега. Търси само водни.', 'wide', 0.7); return; }
      if (WATER.includes(id)) {
        found.add(id);
        const o = id === 'fish' ? fishes[0] : id === 'lily' ? lilies[0] : crab;
        ctx.say(o, `✔ ${id === 'fish' ? 'Рибата' : id === 'lily' ? 'Лилията' : 'Ракът'} живее във водата.`, 'good', 0.6);
        shell.score(`Намерени: ${found.size} от 3`);
        if (found.size === 3) adapt();
      } else {
        mistakes++;
        ctx.say(pickObj(id), `✘ ${NAME[id] ? NAME[id][0].toUpperCase() + NAME[id].slice(1) : 'Това'} живее на сушата.`, 'bad', 1.0);
        shell.msg(`Не е във водата.${mistakes >= 2 ? ' Подсказка: търси в езерото — плуващи, на дъното и по повърхността.' : ''}`, 'bad');
      }
    };
    function adapt() {
      ctx.clearTip();
      view(ctx, [0.4, 0.4, -0.2], 5.4, { halfH: 2.3, elev: 0.6 });
      let tool = null; let done = 0;
      shell.score('Свързани: 0 от 4');
      shell.task(`<p>Всеки е <b>приспособен</b> към своята среда. Избери приспособление и кликни кой го има.</p>
        <div class="xp-chips">${ADAPT.map((a) => `<span class="chip" data-t="${a.t}">${a.label}</span>`).join('')}</div>`);
      container.querySelectorAll('.xp-task .chip').forEach((ch) => ch.addEventListener('click', () => {
        container.querySelectorAll('.xp-task .chip').forEach((x) => x.classList.remove('held'));
        ch.classList.add('held');
        tool = ch.dataset.t;
      }));
      ctx.click = (id) => {
        if (!id || !NAME[id]) return;
        if (!tool) { shell.msg('Първо избери приспособление отгоре.', 'bad'); return; }
        const a = ADAPT.find((x) => x.t === tool);
        if (a.who === id) {
          done++;
          const ch = container.querySelector(`.xp-task .chip[data-t="${tool}"]`);
          ch.classList.remove('held'); ch.classList.add('used', 'right');
          tool = null;
          ctx.say(pickObj(id), `✔ ${a.ok}`, 'good wide', 1.0);
          shell.msg('Вярно!', 'good');
          shell.score(`Свързани: ${done} от 4`);
          if (done === 4) {
            ctx.click = null;
            ctx.scores[1] = stepScore(mistakes, 3);
            shell.score('');
            nextBtn(ctx, 'Напред →', step4);
          }
        } else {
          mistakes++;
          ctx.say(pickObj(id), `✘ Помага ли това на ${NAME[id]} там, където живее?`, 'bad', 1.0);
          shell.msg(`Не е този.${mistakes >= 2 ? ' Подсказка: помисли къде живее всеки — във вода, под земята или на сухо.' : ''}`, 'bad');
        }
      };
    }
  }
  function pickObj(id) {
    return { fish: fishes[0], lily: lilies[0], crab, duck, cactus, lizard, mole, deer: deerG, pine }[id] || sign;
  }

  // ---------- 4. Опази средата ----------
  const ACTS = [
    { t: '🌸 Не берем защитени цветя', good: true, why: 'Така цветята дават семена и има храна за пчелите.' },
    { t: '🗑 Оставяме боклук в гората', good: false, why: 'Животните могат да се наранят или да го изядат.' },
    { t: '🐦 Не рушим птичи гнезда', good: true, why: 'В гнездата растат малките птици.' },
    { t: '🔥 Палим огън, където е забранено', good: false, why: 'Огънят може да изгори гората с всичките ѝ обитатели.' },
    { t: '🏠 Слагаме къщички за птици', good: true, why: 'Птиците имат подслон и място за гнездо.' },
    { t: '🚱 Пускаме мръсна вода в езерото', good: false, why: 'Рибите и растенията във водата ще загинат.' },
  ];
  function step4() {
    shell.step(3);
    ctx.clearTip(); clearTags();
    showLife(0);
    P.slow = 1;
    view(ctx, [0.4, 0.6, 1.4], 2.6, { halfH: 1.8, elev: 0.5 });
    shell.task('<p>Местността е защитена. Тук живеят много растения и животни.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Ако изсечем гората, какво ще стане със сърните и птиците?',
      options: [
        { t: 'Ще загубят дома и храната си.', ok: true, why: 'Вярно! Без своята среда животните не могат да живеят.' },
        { t: 'Ще си намерят нова гора веднага.', ok: false, why: 'Има ли винаги друга гора наблизо? А какво ще правят малките в гнездата?' },
        { t: 'Нищо няма да им стане.', ok: false, why: 'Къде ще се крият, ще гнездят и ще намират храна?' },
      ],
      hint: 'Гората е дом и храна за тях.',
      onRight: (m) => { mistakes = m; nextBtn(ctx, 'Напред →', protect); },
    });
    function protect() {
      ctx.clearTip();
      const list = shuffle(ACTS);
      let i = 0; let good = 0;
      const meter = stage.bubble(sign, '', { cls: 'tag', lift: 2.0 });
      const show = () => {
        meter.set(`Живот в местността ${bar(15 + good * 28, '#2e9d5b')}`);
        showLife(Math.round(good * 8 / 3));
        if (i >= list.length) {
          meter.remove();
          ctx.say(sign, 'Пеперудите, птиците и цветята се връщат, когато пазим тяхната среда.', 'good wide', 2.0);
          shell.task('<p>Пазим растенията и животните, като пазим мястото, където живеят.</p>');
          shell.msg('Браво!', 'good');
          ctx.scores[2] = stepScore(mistakes, 3);
          shell.setControls('');
          finishBtn(ctx, onComplete, restart);
          return;
        }
        const a = list[i];
        shell.task(`<p>Това <b>опазва</b> ли природата, или ѝ <b>вреди</b>?</p><p style="font-size:1.15rem"><b>${esc(a.t)}</b></p><p class="small">${i + 1} от ${list.length}</p>`);
        const c = shell.setControls('<div class="row"><button class="btn act" data-g="1">💚 Опазва</button><button class="btn act" data-g="0">⚠ Вреди</button></div>');
        c.querySelectorAll('.act').forEach((b) => b.addEventListener('click', () => {
          if ((b.dataset.g === '1') === a.good) {
            shell.msg(`Вярно! ${a.why}`, 'good');
            if (a.good) good++;
            i++;
            show();
          } else {
            mistakes++;
            b.disabled = true;
            shell.msg(`Помисли пак. Какво ще стане с животните и растенията?${mistakes >= 2 ? ' Подсказка: ' + a.why : ''}`, 'bad');
          }
        }));
      };
      show();
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
