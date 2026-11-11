// 3.3.2 „Скелет, мускули и първа помощ“ — скелет, модел на ръка с мускули, дете на игрището и аптечка.
// Стъпки: опознай → как се движи ръката (мускули) и защо ни трябва скелет → първа помощ → пази се от травми.
import { labelSprite, mat, addHitBox, THREE, esc, shuffle } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, bar, stepScore } from './labkit.js';
import { meadow, clouds, treeModel, lerp, seg } from './nature3.js';

const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);
const CALL = '<p class="warn">При силна болка, подуване или кървене, което не спира, <b>повикай възрастен</b> или звънни на <b>112</b>.</p>';

// Цилиндър между две точки.
function link(m, r) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), m);
  mesh.userData.r = r;
  return mesh;
}
function place(mesh, a, b, r = mesh.userData.r) {
  const d = new V3().subVectors(b, a);
  const len = d.length();
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(UP, d.normalize());
  mesh.scale.set(r / mesh.userData.r, len, r / mesh.userData.r);
}

function skeletonModel() {
  const g = new THREE.Group();
  const bone = mat(0xf3eee0);
  const parts = {};
  const skull = new THREE.Group();
  const cr = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), bone);
  cr.scale.set(0.9, 1, 1);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.3), bone);
  jaw.position.set(0.1, -0.24, 0);
  skull.add(cr, jaw);
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0x37474f));
    eye.position.set(0.22, 0.02, s * 0.1);
    skull.add(eye);
  }
  skull.position.y = 2.75;
  g.add(skull);
  parts.skull = skull;
  const spine = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.07, 10), bone);
    v.position.set(-0.06 - Math.sin(i * 0.25) * 0.03, 2.4 - i * 0.085, 0);
    spine.add(v);
  }
  g.add(spine);
  parts.spine = spine;
  const ribs = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.26 - Math.abs(i - 2) * 0.02, 0.022, 6, 22, Math.PI * 1.7), bone);
    r.rotation.x = Math.PI / 2;
    r.rotation.z = Math.PI * 0.15 + Math.PI;
    r.position.set(0.04, 2.3 - i * 0.09, 0);
    r.scale.set(1, 1.15, 1);
    ribs.add(r);
  }
  g.add(ribs);
  parts.ribs = ribs;
  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 18), bone);
  pelvis.rotation.x = Math.PI / 2;
  pelvis.position.y = 1.15;
  g.add(pelvis);
  for (const s of [1, -1]) {
    const add = (a, b, r) => { const m = link(bone, r); place(m, a, b); g.add(m); return m; };
    add(new V3(0, 2.38, s * 0.25), new V3(0, 1.8, s * 0.32), 0.04);
    add(new V3(0, 1.8, s * 0.32), new V3(0.05, 1.3, s * 0.34), 0.03);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), bone);
    hand.position.set(0.06, 1.24, s * 0.34);
    g.add(hand);
    const femur = add(new V3(0, 1.12, s * 0.13), new V3(0.02, 0.6, s * 0.14), 0.05);
    add(new V3(0.02, 0.6, s * 0.14), new V3(0, 0.08, s * 0.14), 0.04);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), bone);
    knee.position.set(0.05, 0.6, s * 0.14);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.09), bone);
    foot.position.set(0.07, 0.04, s * 0.14);
    g.add(knee, foot);
    if (s === 1) parts.leg = femur;
  }
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.06, 16), mat(0x78909c));
  stand.position.y = 0.03;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.7, 6), mat(0x78909c));
  pole.position.set(-0.32, 1.35, 0);
  g.add(stand, pole);
  g.userData.parts = parts;
  return g;
}

// Модел на ръка: раменна кост, лакът, предмишница, двуглав (отпред) и триглав (отзад) мускул.
function armModel() {
  const g = new THREE.Group();
  const bone = mat(0xf3eee0);
  const musM = mat(0xef5350, { roughness: 0.5 });
  const musM2 = mat(0x8e2b28, { roughness: 0.5 });
  const SH = new V3(0, 2.3, 0); const EL = new V3(0, 1.15, 0);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), bone);
  shoulder.position.copy(SH);
  const hum = link(bone, 0.06); place(hum, SH, EL);
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), bone);
  elbow.position.copy(EL);
  const fore = link(bone, 0.05);
  const hand = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.2), mat(0xf2c7a0));
  palm.position.y = -0.1;
  hand.add(palm);
  const bic = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1, 6, 14), musM);
  const tri = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1, 6, 14), musM2);
  const tendon = mat(0xf5f5f5);
  const t1 = link(tendon, 0.015); const t2 = link(tendon, 0.015);
  g.add(shoulder, hum, elbow, fore, hand, bic, tri, t1, t2);
  // подложка и стойка
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.8), mat(0x8d6e63));
  base.position.y = 0.05;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), mat(0x78909c));
  post.position.set(-0.45, 1.2, 0);
  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), mat(0x78909c));
  arm2.rotation.z = Math.PI / 2; arm2.position.set(-0.23, 2.3, 0);
  g.add(base, post, arm2);
  function set(th) {
    const d = new V3(Math.sin(th), -Math.cos(th), 0);
    const n = new V3(Math.cos(th), Math.sin(th), 0);
    const W = EL.clone().addScaledVector(d, 1.0);
    place(fore, EL, W);
    hand.position.copy(W);
    hand.quaternion.setFromUnitVectors(new V3(0, -1, 0), d);
    // двуглав: от рамото до предмишницата малко под лакътя (отпред)
    const bA = new V3(0.1, 2.15, 0); const bB = EL.clone().addScaledVector(d, 0.22).addScaledVector(n, 0.06);
    const bLen = bA.distanceTo(bB);
    const bR = 0.07 * Math.pow(1.05 / bLen, 1.6);
    const bMidA = bA.clone().lerp(bB, 0.15); const bMidB = bA.clone().lerp(bB, 0.82);
    place(t1, bMidB, bB, 0.015);
    musPlace(bic, bA, bMidB, bR, 0.1);
    // триглав: отзад на ръката до лакътя
    const tA = new V3(-0.1, 2.15, 0); const tB = EL.clone().addScaledVector(d, -0.1).addScaledVector(n, -0.06);
    const tLen = tA.distanceTo(tB);
    const tR = 0.07 * Math.pow(1.0 / tLen, 1.6);
    const tMidB = tA.clone().lerp(tB, 0.85);
    place(t2, tMidB, tB, 0.015);
    musPlace(tri, tA, tMidB, tR, 0.1);
    return { bLen, tLen, bMidA };
  }
  function musPlace(m, a, b, r) {
    const dd = new V3().subVectors(b, a);
    const len = dd.length();
    m.position.copy(a).addScaledVector(dd, 0.5);
    m.quaternion.setFromUnitVectors(UP, dd.normalize());
    // капсула: радиус 0.5, тяло 1 → обща височина 2
    m.scale.set(r * 2, len / 2, r * 2);
  }
  g.userData.set = set;
  g.userData.bic = bic; g.userData.tri = tri;
  set(0);
  return g;
}

// Дете (за първа помощ и защита). Части: глава, тяло, ръце, крака; userData.knee, ankle, nose.
function kidModel({ shirt = 0xff7043, pants = 0x3949ab } = {}) {
  const g = new THREE.Group();
  const skin = mat(0xf2c7a0);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.4, 6, 12), mat(shirt));
  body.position.y = 1.05;
  const head = new THREE.Group();
  head.position.y = 1.55;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), skin));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.205, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), mat(0x6d4c41));
  hair.position.y = 0.03;
  head.add(hair);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(0x111111));
    e.position.set(0.17, 0.03, s * 0.07);
    head.add(e);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), skin);
  nose.position.set(0.2, -0.02, 0);
  head.add(nose);
  g.add(body, head);
  const arms = [];
  for (const s of [1, -1]) {
    const sh = new THREE.Group();
    sh.position.set(0, 1.3, s * 0.26);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.45, 4, 8), mat(shirt));
    a.position.y = -0.25;
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), skin);
    h.position.y = -0.52;
    sh.add(a, h);
    g.add(sh);
    arms.push(sh);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.6, 4, 8), mat(pants));
    leg.position.set(0, 0.42, s * 0.11);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.12), mat(0xffffff));
    shoe.position.set(0.05, 0.04, s * 0.11);
    g.add(leg, shoe);
  }
  const knee = new THREE.Object3D(); knee.position.set(0.07, 0.48, 0.11); g.add(knee);
  const ankle = new THREE.Object3D(); ankle.position.set(0.02, 0.14, -0.11); g.add(ankle);
  // скрити предмети за първа помощ и защита
  const plaster = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.14), mat(0xf5d6b4));
  plaster.position.set(0.08, 0.48, 0.11);
  const ice = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), mat(0x81d4fa));
  ice.position.set(0.02, 0.16, -0.11);
  const towel = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 14), mat(0xffffff));
  towel.rotation.x = Math.PI / 2; towel.position.set(0.02, 0.16, -0.11);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x43a047, { roughness: 0.3 }));
  helmet.position.y = 1.58;
  const pads = [1, -1].map((s) => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(0x263238)); p.scale.set(0.8, 1, 1); p.position.set(0.07, 0.48, s * 0.11); return p; });
  for (const o of [plaster, ice, towel, helmet, ...pads]) { o.visible = false; g.add(o); }
  g.userData = { head, arms, knee, ankle, plaster, ice, towel, helmet, pads };
  return g;
}

function kitModel() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.4), mat(0xffffff));
  box.position.y = 0.225;
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.42), mat(0xe53935));
  c1.position.set(0, 0.25, 0);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.42), mat(0xe53935));
  c2.position.set(0, 0.25, 0);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12, Math.PI), mat(0x9e9e9e));
  handle.position.y = 0.45;
  g.add(box, c1, c2, handle);
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Кости и мускули', 'Първа помощ', 'Пази се от травми'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xbfe3ff, camPos: [0, 3.6, 9], target: [0, 1.2, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  meadow(scene, { color: 0x86c45a });
  clouds(stage, 4, { y: 8 });
  for (let i = 0; i < 8; i++) { const t = treeModel(1.0); t.position.set(-9 + i * 2.6, 0, -6 - (i % 2)); scene.add(t); }
  // игрище: пейка и топка
  const bench = new THREE.Group();
  {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.45), mat(0xa1887f));
    seat.position.y = 0.45;
    for (const x of [-0.65, 0.65]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.4), mat(0x6d4c41)); l.position.set(x, 0.22, 0); bench.add(l); }
    bench.add(seat);
  }
  bench.position.set(4.9, 0, 0.0);
  bench.rotation.y = -1.2;
  scene.add(bench);

  const tags = [];
  const tag = (obj, html, cls = 'tag', lift = 1.0) => { const b = stage.bubble(obj, html, { cls, lift }); tags.push(b); return b; };
  const clearTags = () => { while (tags.length) tags.pop().remove(); };
  const named = (g, text, y, size = 0.22) => {
    const l = labelSprite(text, { size }); l.position.y = y; l.raycast = () => {};
    g.add(l); stage.steadyLabel(l, 8); return l;
  };

  // ---------- Скелет и мека кукла ----------
  const skel = skeletonModel();
  skel.position.set(-3.4, 0, 0);
  skel.rotation.y = -0.5;
  scene.add(skel);
  const SP = skel.userData.parts;
  const pick = (o, id) => { o.userData.pickId = id; addHitBox(o, 0.4); };
  pick(SP.skull, 'skull'); pick(SP.spine, 'spine'); pick(SP.ribs, 'ribs');
  named(skel, 'Скелет', 3.25);
  const doll = new THREE.Group();
  {
    const cloth = mat(0xce93d8, { roughness: 1 });
    const parts = [];
    for (const [x, y, z, r] of [[0, 1.5, 0, 0.2], [0, 1.05, 0, 0.27], [0, 0.6, 0, 0.24], [0, 1.1, 0.35, 0.09], [0, 1.1, -0.35, 0.09], [0, 0.25, 0.12, 0.1], [0, 0.25, -0.12, 0.1]]) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloth);
      p.position.set(x, y, z); p.userData.base = p.position.clone();
      doll.add(p); parts.push(p);
    }
    doll.userData.parts = parts;
  }
  // Стойка, която държи куклата права (махаме я в опита).
  const dollStand = new THREE.Group();
  {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 6), mat(0x78909c));
    pole.position.set(-0.3, 0.85, 0);
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), mat(0x78909c));
    hook.rotation.z = Math.PI / 2; hook.position.set(-0.15, 1.65, 0);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 12), mat(0x78909c));
    foot.position.set(-0.3, 0.02, 0);
    dollStand.add(pole, hook, foot);
  }
  doll.add(dollStand);
  doll.position.set(-1.7, 0, 0.4);
  doll.visible = false;
  scene.add(doll);
  let slump = 0; let slumpT = 0;
  stage.tick((dt, t) => {
    slump += (slumpT - slump) * Math.min(1, dt * 2.5);
    doll.userData.parts.forEach((p, i) => {
      const b = p.userData.base;
      const y = lerp(b.y, 0.12 + i * 0.03, slump);
      p.position.set(b.x + slump * Math.sin(i * 2) * 0.35, y, b.z * (1 + slump * 0.6));
      p.scale.set(1 + slump * 0.4, 1 - slump * 0.35, 1 + slump * 0.4);
    });
    SP.skull.rotation.y = Math.sin(t * 0.5) * 0.15;
  });

  // ---------- Ръка с мускули ----------
  const arm = armModel();
  arm.position.set(0, 0, 0);
  arm.userData.pickId = 'arm';
  addHitBox(arm, 0.8);
  named(arm, 'Ръка: кости и мускули', 2.75);
  scene.add(arm);
  const A = { th: 0, want: 0, demo: true };
  stage.tick((dt, t) => {
    const w = A.demo ? (0.5 - 0.5 * Math.cos(t * 0.8)) * 1.6 : A.want;
    A.th += (w - A.th) * Math.min(1, dt * 4);
    arm.userData.set(A.th);
  });

  // ---------- Дете и аптечка ----------
  const kid = kidModel();
  kid.position.set(3.2, 0, 0.3);
  kid.rotation.y = -0.5;
  kid.userData.pickId = 'kid';
  addHitBox(kid, 0.9);
  scene.add(kid);
  const kit = kitModel();
  kit.position.set(5.1, 0.5, -0.5);
  kit.userData.pickId = 'kit';
  addHitBox(kit, 0.6);
  named(kit, 'Аптечка', 0.75);
  scene.add(kit);
  const icePack = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.25), mat(0x81d4fa)); b.position.y = 0.06; const tw = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.32), mat(0xffffff)); tw.position.y = 0.02; icePack.add(tw, b); }
  icePack.position.set(4.7, 0.5, 0.55);
  icePack.userData.pickId = 'ice';
  addHitBox(icePack, 0.5);
  named(icePack, 'Студен компрес', 0.45);
  scene.add(icePack);
  const K = { lean: 0, wave: 0, fall: 0 };
  stage.tick((dt, t) => {
    const U = kid.userData;
    U.head.rotation.z = -K.lean * 0.35;
    U.arms.forEach((a, i) => { a.rotation.x = K.wave ? Math.sin(t * 5 + i * Math.PI) * 0.9 * (i ? -1 : 1) : 0; a.rotation.z = K.lean ? 1.6 * K.lean : Math.sin(t * 1.2 + i) * 0.05; });
    kid.rotation.z = K.fall ? -Math.min(1.2, K.fall) : 0;
    if (K.fall) K.fall = Math.min(1.25, K.fall + dt * 2);
  });

  function resetKid() {
    const U = kid.userData;
    for (const o of [U.plaster, U.ice, U.towel, U.helmet, ...U.pads]) o.visible = false;
    K.lean = 0; K.wave = 0; K.fall = 0;
    kid.position.set(3.2, 0, 0.3); kid.rotation.set(0, -0.5, 0);
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip(); clearTags();
    A.demo = true;
    doll.visible = false; slump = 0; slumpT = 0;
    resetKid();
    view(ctx, [0, 1.3, 0], 4.6, { halfH: 1.9 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Тялото ни има <b>скелет</b> от кости и <b>мускули</b>, които го движат.</p><p><b>Разгледай всичко</b> от менюто или с клик.</p>',
      items: [
        { id: 'skull', label: 'Череп', icon: '💀', note: 'Черепът е като здрава каска. Той <b>пази мозъка</b>.', obj: () => SP.skull, dist: 2.2, lift: 0 },
        { id: 'spine', label: 'Гръбначен стълб', icon: '🦴', note: 'Гръбначният стълб е от много малки кости. Той <b>държи тялото изправено</b>.', obj: () => SP.spine, dist: 2.6, lift: 0 },
        { id: 'ribs', label: 'Гръден кош', icon: '🫁', note: 'Ребрата пазят сърцето и белите дробове.', obj: () => SP.ribs, dist: 2.4, lift: 0 },
        { id: 'arm', label: 'Ръка', icon: '💪', note: 'Мускулите са прикрепени към костите. Когато мускулът <b>се свива</b>, той дърпа костта и ръката се движи.', obj: () => arm, dist: 3.4, lift: 1.2, bubble: 1.9 },
        { id: 'kit', label: 'Аптечка', icon: '🩹', note: 'В аптечката има чиста марля, бинт и лепенки за малки рани. Ползваме я с възрастен.', obj: () => kit, dist: 2.6 },
        { id: 'ice', label: 'Студен компрес', icon: '🧊', note: 'Нещо студено, <b>увито в кърпа</b>. Слага се при удар или навяхване. Никога лед направо на кожата!', obj: () => icePack, dist: 2.6 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Кости и мускули ----------
  function step2() {
    shell.step(1);
    ctx.clearTip(); clearTags();
    A.demo = false; A.want = 0;
    view(ctx, [0, 1.4, 0], 1.5, { halfH: 1.5, elev: 0.15 });
    tag(arm.userData.bic, 'двуглав', 'tag', 0.3);
    tag(arm.userData.tri, 'триглав', 'tag', 0.3);
    shell.task('<p>На модела отпред на ръката е <b>двуглавият мускул</b> (светлочервен), а отзад — <b>триглавият</b> (тъмночервен).</p>');
    choice(ctx, {
      q: 'Когато свиеш ръката в лакътя, какво прави мускулът отпред?',
      options: [
        { t: 'Свива се — става по-къс и по-дебел.', ok: true, why: 'Да проверим! Плъзни лентата.' },
        { t: 'Става по-дълъг и по-тънък.', ok: false, why: 'Помисли: за да придърпа костта нагоре, мускулът трябва да стане по-къс или по-дълъг?' },
        { t: 'Нищо не прави. Костта се движи сама.', ok: false, why: 'Може ли костта да се движи сама, без да я дърпа нещо?' },
      ],
      hint: 'Мускулите могат само да дърпат, като се свиват.',
      onRight: (m) => flex(m),
    });
  }
  function flex(m0) {
    let mistakes = m0;
    const c = shell.setControls('<label class="row">Изпъната <input type="range" class="bend" min="0" max="100" value="0" style="flex:1"> Свита</label>');
    let said = false;
    c.querySelector('.bend').addEventListener('input', (e) => {
      A.want = (+e.target.value / 100) * 2.2;
      if (+e.target.value >= 90 && !said) {
        said = true;
        clearTags();
        ctx.say(arm.userData.bic, 'Двуглавият мускул се сви и издърпа предмишницата нагоре. Триглавият се отпусна. За да изпънем ръката, триглавият се свива.', 'wide', 0.4);
        nextBtn(ctx, 'Напред →', noBones);
      }
    });
    function noBones() {
      ctx.clearTip();
      shell.setControls('');
      view(ctx, [-2.5, 1.3, 0.2], 1.8, { halfH: 1.7, elev: 0.15 });
      doll.visible = true; slump = 0; slumpT = 0; dollStand.visible = true;
      shell.task('<p>До скелета стои кукла от плат. В нея няма кости. Махаме стойката ѝ.</p>');
      const b = nextBtn(ctx, 'Махни стойката', () => {
        b.disabled = true;
        slumpT = 1;
        dollStand.visible = false;
        ctx.say(doll, 'Куклата се свлече на купчина. Без кости тялото няма опора.', 'wide', 0.9);
        setTimeout(() => {
          choice(ctx, {
            q: 'Какво прави скелетът за тялото?',
            options: [
              { t: 'Той е опора на тялото и пази органите.', ok: true, why: 'Вярно! Скелетът е опората, а мускулите движат костите.' },
              { t: 'Той движи тялото сам, без мускули.', ok: false, why: 'Костите се движат, когато мускулите ги дърпат.' },
              { t: 'Той смила храната.', ok: false, why: 'Храната се смила в стомаха. Какво стана с куклата без кости?' },
            ],
            hint: 'Спомни си куклата без кости.',
            mistakes,
            onRight: (m) => { mistakes = m; ctx.scores[0] = stepScore(mistakes, 3); nextBtn(ctx, 'Напред →', step3); },
          });
        }, 1500);
      });
    }
  }

  // ---------- 3. Първа помощ ----------
  const CASES = [
    {
      intro: 'Ани падна на игрището и <b>охлузи коляното</b> си. Раничката е малка.',
      q: 'Какво се прави първо?',
      options: [
        { t: 'Казваме на възрастен. После раната се измива с чиста вода и се покрива с лепенка.', ok: true, why: 'Правилно! Възрастният помага, а чистата лепенка пази раната.' },
        { t: 'Слагаме пръст от игрището върху раната.', ok: false, why: 'Пръстта е мръсна. С какво се почиства раната?' },
        { t: 'Не казваме на никого и продължаваме да играем.', ok: false, why: 'Раната трябва да се почисти. Кой може да помогне?' },
      ],
      act: (U) => { U.plaster.visible = true; return [U.knee, '🩹 Чиста лепенка']; },
    },
    {
      intro: 'Боби си <b>навехна глезена</b>, докато играеше футбол. Глезенът боли и се подува.',
      q: 'Какво е правилно?',
      options: [
        { t: 'Спира да играе, слага студен компрес, увит в кърпа, и казва на възрастен.', ok: true, why: 'Правилно! Кракът почива, а студът намалява отока.' },
        { t: 'Продължава да тича, за да мине.', ok: false, why: 'Ако тича, глезенът ще се нарани още. От какво има нужда кракът?' },
        { t: 'Разтрива силно глезена.', ok: false, why: 'Силното разтриване може да навреди. Какво намалява отока?' },
      ],
      act: (U) => { U.ice.visible = true; U.towel.visible = true; return [U.ankle, '🧊 Студено, увито в кърпа']; },
    },
    {
      intro: 'На Мими ѝ <b>потече кръв от носа</b>.',
      q: 'Как е правилно да седне?',
      options: [
        { t: 'С глава леко наведена напред и стиснати меки части на носа.', ok: true, why: 'Правилно! Така кръвта не се гълта. Ако не спре след 10–15 минути — към лекар.' },
        { t: 'С глава силно назад.', ok: false, why: 'Тогава кръвта се стича в гърлото и се гълта.' },
        { t: 'Да скача, за да спре.', ok: false, why: 'Движението не помага. Как трябва да е главата?' },
      ],
      act: () => { K.lean = 1; return [kid.userData.head, 'Главата леко напред, носът стиснат']; },
    },
  ];
  function step3() {
    shell.step(2);
    ctx.clearTip(); clearTags();
    doll.visible = false;
    view(ctx, [3.4, 0.9, -0.2], 1.5, { halfH: 1.2, elev: 0.25 });
    let mistakes = 0; let k = 0;
    const next = () => {
      ctx.clearTip(); clearTags();
      resetKid();
      if (k >= CASES.length) {
        ctx.scores[1] = stepScore(mistakes, 3);
        shell.task(`<p>Браво! При малки травми помагаме спокойно.</p>${CALL}`);
        shell.setControls('');
        nextBtn(ctx, 'Напред →', step4);
        return;
      }
      const C = CASES[k];
      shell.task(`<p>${C.intro}</p>${CALL}<p class="small">${k + 1} от ${CASES.length}</p>`);
      choice(ctx, {
        q: C.q, options: C.options, mistakes,
        hint: 'Първо — възрастен. Раната се чисти, при удар — студено, при кръв от носа — главата напред.',
        onRight: (m) => {
          mistakes = m;
          const [anchor, txt] = C.act(kid.userData);
          tag(anchor, txt, 'tag good', 0.35);
          k++;
          nextBtn(ctx, k < CASES.length ? 'Следващ случай →' : 'Готово →', next);
        },
      });
    };
    next();
  }

  // ---------- 4. Пази се от травми ----------
  const RULES = [
    { t: '🚲 Слагаме каска, когато караме колело', good: true, gear: 'helmet', why: 'Каската пази главата при падане.' },
    { t: '🛼 Слагаме наколенки на ролерите', good: true, gear: 'pads', why: 'Наколенките пазят коленете.' },
    { t: '🤸 Загряваме преди спорт', good: true, gear: 'wave', why: 'Загрявката подготвя мускулите и ставите за движение.' },
    { t: '🪜 Бутаме другите по стълбите', good: false, why: 'Така някой може да падне и да си счупи кост.' },
    { t: '🚗 Играем с топка до улицата', good: false, why: 'Можем да изтичаме пред кола.' },
  ];
  function step4() {
    shell.step(3);
    ctx.clearTip(); clearTags();
    resetKid();
    view(ctx, [3.3, 0.9, 0], 1.5, { halfH: 1.2, elev: 0.25 });
    shell.task('<p>Ани ще кара колело в парка.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Ако Ани падне от колелото, какво ще пази най-добре главата ѝ?',
      options: [
        { t: 'Каска', ok: true, why: 'Вярно! Твърдата каска поема удара. Черепът също пази мозъка, но каската помага още.' },
        { t: 'Шапка от плат', ok: false, why: 'Меката шапка не поема удар. Какво е твърдо и здраво?' },
        { t: 'Нищо не е нужно — черепът е достатъчен.', ok: false, why: 'Черепът е здрав, но силен удар пак е опасен. Какво носят колоездачите?' },
      ],
      hint: 'Колоездачите носят нещо твърдо на главата.',
      onRight: (m) => {
        mistakes = m;
        kid.userData.helmet.visible = true;
        tag(kid.userData.helmet, '⛑ Каска', 'tag good', 0.4);
        nextBtn(ctx, 'Напред →', rules);
      },
    });
    function rules() {
      clearTags();
      resetKid();
      const list = shuffle(RULES);
      let i = 0; let safe = 0;
      const meter = stage.bubble(kid, '', { cls: 'tag', lift: 2.1 });
      const show = () => {
        meter.set(`Безопасност ${bar(20 + safe * 26, '#2e9d5b')}`);
        if (i >= list.length) {
          meter.remove();
          K.wave = 0;
          ctx.say(kid, 'Каска, наколенки, загрявка и безопасно място — така играем без травми.', 'good wide', 2.0);
          shell.task('<p>Пазим костите и мускулите, като играем внимателно.</p>');
          ctx.scores[2] = stepScore(mistakes, 3);
          shell.setControls('');
          finishBtn(ctx, onComplete, restart);
          return;
        }
        const a = list[i];
        shell.task(`<p>Това <b>пази</b> ли от травми, или е <b>опасно</b>?</p><p style="font-size:1.15rem"><b>${esc(a.t)}</b></p><p class="small">${i + 1} от ${list.length}</p>`);
        const c = shell.setControls('<div class="row"><button class="btn act" data-g="1">✅ Пази</button><button class="btn act" data-g="0">⚠ Опасно</button></div>');
        c.querySelectorAll('.act').forEach((b) => b.addEventListener('click', () => {
          if ((b.dataset.g === '1') === a.good) {
            shell.msg(`Вярно! ${a.why}`, 'good');
            const U = kid.userData;
            if (a.gear === 'helmet') U.helmet.visible = true;
            if (a.gear === 'pads') U.pads.forEach((p) => { p.visible = true; });
            if (a.gear === 'wave') K.wave = 1;
            if (a.good) safe++;
            i++;
            show();
          } else {
            mistakes++;
            b.disabled = true;
            shell.msg(`Помисли пак. Може ли някой да се нарани?${mistakes >= 2 ? ' Подсказка: ' + a.why : ''}`, 'bad');
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
