// 3.2.2 „Растения, гъби и животни“ — край на гора с пън, пикник, слънчоглед и животни.
// Стъпки: опознай → как се хранят и движат (храна на ливадата, дни) → подреди в три групи → предскажи.
import { labelSprite, mat, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import {
  meadow, clouds, treeModel, mushroomModel, butterflyModel, flap, flowerModel, sunflowerModel,
  quadruped, birdModel, beanInPot, swingLegs, seg, lerp,
} from './nature3.js';

const V3 = THREE.Vector3;

function childModel() {
  const g = new THREE.Group();
  const skin = mat(0xf2c7a0);
  const shirt = mat(0x1e88e5);
  const pants = mat(0x37474f);
  const legsL = [];
  for (const s of [1, -1]) {
    const hip = new THREE.Group();
    hip.position.set(0, 0.6, s * 0.1);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), pants);
    l.position.y = -0.3;
    hip.add(l);
    g.add(hip);
    legsL.push(hip);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8), shirt);
    arm.position.set(0, 0.95, s * 0.24);
    arm.rotation.x = s * 0.15;
    g.add(arm);
  }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.35, 6, 12), shirt);
  body.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), skin);
  head.position.y = 1.42;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5d4037));
  hair.position.y = 1.45;
  g.add(body, head, hair);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), mat(0x111111));
    e.position.set(0.15, 1.45, s * 0.06);
    g.add(e);
  }
  g.userData.legs = legsL;
  return g;
}

function stumpModel() {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.6, 12), mat(0x6d4c41, { flat: true }));
  s.position.y = 0.3;
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.44, 12), mat(0xbc9a6c));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.605;
  g.add(s, top);
  return g;
}

function breadModel() {
  const g = new THREE.Group();
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), mat(0xe57373, { side: THREE.DoubleSide }));
  cloth.rotation.x = -Math.PI / 2; cloth.position.y = 0.01;
  g.add(cloth);
  for (let i = 0; i < 4; i++) {
    const st = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.1), mat(0xffffff, { side: THREE.DoubleSide }));
    st.rotation.x = -Math.PI / 2; st.position.set(0, 0.012, -0.4 + i * 0.27);
    g.add(st);
  }
  const slice = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.45), mat(0xf3d9a4));
  slice.position.y = 0.05;
  const crust = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.49), mat(0xb5793a));
  crust.position.y = 0.03;
  g.add(crust, slice);
  const molds = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06 + (i % 3) * 0.02, 10, 6), mat([0x7cb342, 0x9ccc65, 0x546e7a][i % 3], { roughness: 1 }));
    m.scale.y = 0.35;
    m.position.set(-0.17 + (i % 3) * 0.17, 0.095, -0.15 + Math.floor(i / 3) * 0.15);
    m.userData.k = [4, 0, 6, 2, 1, 5, 8, 3, 7][i] / 9;
    g.add(m);
    molds.push(m);
  }
  g.userData.molds = molds;
  return g;
}

function carrotModel() {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 10), mat(0xff7f27));
  c.rotation.z = Math.PI / 2; c.position.y = 0.09;
  g.add(c);
  for (let i = 0; i < 3; i++) {
    const l = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.22, 4), mat(0x43a047));
    l.rotation.z = -Math.PI / 2 + (i - 1) * 0.4; l.position.set(-0.3, 0.1 + (i - 1) * 0.04, 0);
    g.add(l);
  }
  for (let i = 0; i < 2; i++) {
    const c2 = c.clone(); c2.position.set(0.05, 0.09, 0.12 * (i ? 1 : -1)); c2.rotation.y = (i ? 0.4 : -0.4);
    g.add(c2);
  }
  return g;
}

function wheatModel() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.8, 5), mat(0xd4b04c));
    s.position.set((i - 2) * 0.07, 0.4, (i % 2) * 0.06);
    s.rotation.z = (i - 2) * 0.06;
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 4, 6), mat(0xe8c766));
    ear.position.set((i - 2) * 0.07 + (i - 2) * 0.05, 0.88, (i % 2) * 0.06);
    g.add(s, ear);
  }
  return g;
}

function moldBreadItem() {
  const g = new THREE.Group();
  const slice = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.4), mat(0xf3d9a4));
  slice.position.y = 0.05;
  g.add(slice);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(i % 2 ? 0x7cb342 : 0x546e7a));
    m.scale.y = 0.35; m.position.set(-0.14 + (i % 3) * 0.14, 0.095, -0.08 + Math.floor(i / 3) * 0.16);
    g.add(m);
  }
  return g;
}

function sunModel() {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffd54f }));
  g.add(s);
  for (let i = 0; i < 10; i++) {
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), new THREE.MeshBasicMaterial({ color: 0xffb300 }));
    const a = (i / 10) * Math.PI * 2;
    r.position.set(Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0);
    r.rotation.z = a - Math.PI / 2;
    g.add(r);
  }
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Как се хранят и движат?', 'Подреди в три групи', 'Предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xbfe3ff, camPos: [0, 5, 11], target: [0, 0.6, 0], maxDistance: 24 } });
  const { shell, stage, scene } = ctx;
  scene.fog = new THREE.Fog(0xbfe3ff, 24, 55);
  meadow(scene, { color: 0x79b84a });
  clouds(stage, 5, { y: 8 });
  // гора отзад
  for (let i = 0; i < 16; i++) {
    const t = treeModel(0.9 + (i % 3) * 0.25);
    t.position.set(-14 + i * 1.9 + Math.sin(i * 3) * 0.5, 0, -7.5 - (i % 2) * 1.6);
    scene.add(t);
  }
  const sun = sunModel();
  sun.position.set(-7, 7.5, -10);
  scene.add(sun);

  const tags = [];
  const tag = (obj, html, cls = 'tag', lift = 1.2) => { const b = stage.bubble(obj, html, { cls, lift }); tags.push(b); return b; };
  const clearTags = () => { while (tags.length) tags.pop().remove(); };
  const named = (g, text, y, ref = 9) => {
    const l = labelSprite(text, { size: 0.24 });
    l.position.y = y;
    l.raycast = () => {};
    g.add(l);
    stage.steadyLabel(l, ref);
    return l;
  };

  // ---------- Живите същества в сцената ----------
  const world = new THREE.Group();
  scene.add(world);
  const sunflower = sunflowerModel(1.6);
  sunflower.scale.setScalar(1.3);
  sunflower.position.set(-3.6, 0, -0.6);
  sunflower.userData.pickId = 'sunflower';
  named(sunflower, 'Слънчоглед', 2.0);
  addHitBox(sunflower, 0.9);
  const boletus = mushroomModel(0x8d5524, 1.8);
  boletus.position.set(-2.0, 0, 0.6);
  boletus.userData.pickId = 'boletus';
  named(boletus, 'Манатарка', 1.0);
  addHitBox(boletus, 0.8);
  const stump = stumpModel();
  stump.position.set(-0.6, 0, -1.6);
  const stumpMush = [];
  for (let i = 0; i < 4; i++) {
    const m = mushroomModel(0xd9a441, 0.6);
    const a = -0.6 + i * 0.5;
    m.position.set(Math.cos(a) * 0.5, 0.15 + (i % 2) * 0.18, Math.sin(a) * 0.5);
    m.rotation.z = -Math.cos(a) * 0.6; m.rotation.x = Math.sin(a) * 0.6;
    stump.add(m);
    stumpMush.push(m);
  }
  stump.userData.pickId = 'stump';
  named(stump, 'Гниещ пън с гъби', 1.15);
  addHitBox(stump, 0.9);
  const bread = breadModel();
  bread.position.set(2.2, 0, 1.6);
  bread.userData.pickId = 'bread';
  named(bread, 'Хляб с плесен', 0.55);
  addHitBox(bread, 0.8);
  const hare = quadruped({ color: 0xa1887f, r: 0.2, len: 0.3, legLen: 0.14, headR: 0.15, ears: 'long' });
  const hareG = new THREE.Group(); hareG.add(hare);
  hareG.userData.pickId = 'hare';
  named(hareG, 'Заек', 0.95);
  addHitBox(hareG, 0.8);
  const deer = quadruped({ color: 0xa0673a, r: 0.24, len: 0.6, legLen: 0.65, headR: 0.16, ears: 'pointy', neck: 1.4 });
  const deerG = new THREE.Group(); deerG.add(deer);
  deerG.userData.pickId = 'deer';
  named(deerG, 'Сърна', 1.85);
  addHitBox(deerG, 0.9);
  const bird = birdModel(0x212121, 0xffb300);
  const birdG = new THREE.Group(); birdG.add(bird);
  birdG.userData.pickId = 'bird';
  named(birdG, 'Кос', 0.75);
  addHitBox(birdG, 0.7);
  const child = childModel();
  child.position.set(4.4, 0, -0.2);
  child.rotation.y = -2.4;
  child.userData.pickId = 'child';
  named(child, 'Дете', 1.95);
  addHitBox(child, 0.9);
  const carrot = carrotModel();
  carrot.userData.pickId = 'carrot';
  addHitBox(carrot, 0.7);
  const spot = zoneRing(0xff8f00, 0.7);
  spot.position.set(-0.6, 0, 2.6);
  spot.userData.pickId = 'spot';
  world.add(sunflower, boletus, stump, bread, hareG, deerG, birdG, child, carrot, spot);

  const ANIM = [
    { g: hareG, home: new V3(-0.4, 0, -0.1), speed: 1.2, hop: true },
    { g: deerG, home: new V3(3.0, 0, -1.6), speed: 1.0 },
    { g: birdG, home: new V3(0.9, 0, 0.2), speed: 0.8, hop: true },
  ];
  const A = { food: null, day: 0 };
  function resetWorld() {
    A.food = null; A.day = 0;
    ANIM.forEach((a) => { a.g.position.copy(a.home); a.target = null; a.wait = Math.random() * 2; a.phase = 0; a.eat = false; });
    carrot.position.set(-2.6, 0, 2.4);
    carrot.visible = true;
    carrot.scale.setScalar(1);
    spot.visible = false;
    setDay(0);
  }
  function setDay(d) {
    A.day = d;
    bread.userData.molds.forEach((m) => { const k = seg(d, m.userData.k * 5, m.userData.k * 5 + 2); m.visible = k > 0.02; m.scale.set(k * 1.2, 0.35 * k, k * 1.2); });
    stumpMush.forEach((m, i) => m.scale.setScalar(lerp(0.15, 1, seg(d, i * 0.8, i * 0.8 + 4))));
    sunflower.scale.setScalar(lerp(1.0, 1.3, seg(d, 0, 7)));
  }
  const angleTo = (a, b) => { let x = b - a; while (x > Math.PI) x -= Math.PI * 2; while (x < -Math.PI) x += Math.PI * 2; return x; };
  stage.tick((dt, t) => {
    // слънчогледът гледа към слънцето, листата на гората леко се люлеят
    sunflower.userData.head.lookAt(sun.position);
    sun.rotation.z += dt * 0.1;
    for (const a of ANIM) {
      if (!world.visible) break;
      const g = a.g;
      if (!a.target) {
        a.wait -= dt;
        const head = g.children[0].userData.head;
        if (head) head.rotation.z = a.eat ? -0.6 + Math.sin(t * 8) * 0.1 : Math.sin(t + g.position.x) * 0.15;
        if (a.eat && carrot.visible) { carrot.scale.setScalar(Math.max(0.2, carrot.scale.x - dt * 0.05)); }
        if (a.wait <= 0 && !a.eat) {
          // разходка около дома, а ако има храна — към нея
          if (A.food && a.g !== birdG) a.target = A.food.clone().add(new V3(a.g === hareG ? -0.55 : 0.75, 0, a.g === hareG ? 0.25 : -0.3));
          else { const r = Math.random() * 0.9; const ang = Math.random() * 6.28; a.target = a.home.clone().add(new V3(Math.cos(ang) * r, 0, Math.sin(ang) * r)); }
        }
        g.position.y = 0;
        for (const lg of g.children[0].userData.legs || []) lg.rotation.z *= 0.85;
        continue;
      }
      const dx = a.target.x - g.position.x; const dz = a.target.z - g.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.06) {
        a.target = null; a.wait = 1.5 + Math.random() * 3;
        if (A.food && a.g !== birdG && g.position.distanceTo(A.food) < 1.1) {
          a.eat = true;
          g.rotation.y = Math.atan2(-(A.food.z - g.position.z), A.food.x - g.position.x);
        }
        continue;
      }
      const want = Math.atan2(-dz, dx);
      const diff = angleTo(g.rotation.y, want);
      g.rotation.y += diff * Math.min(1, dt * 5);
      if (Math.abs(diff) < 0.8) {
        const step = Math.min(dist, a.speed * dt * (A.food ? 1.6 : 1));
        g.position.x += (dx / dist) * step; g.position.z += (dz / dist) * step;
        a.phase += dt * 10;
      }
      if (a.hop) g.position.y = Math.abs(Math.sin(a.phase)) * 0.15;
      else swingLegs(g.children[0], a.phase, 0.5);
    }
    if (birdG.visible) bird.rotation.z = Math.sin(t * 5) > 0.6 ? -0.5 : 0;
  });

  // ---------- Неща за подреждане (стъпка 3) ----------
  const GROUPS = [
    { id: 'plant', name: '🌿 Растения', color: 0x2e9d5b },
    { id: 'fungi', name: '🍄 Гъби', color: 0xc77d2e },
    { id: 'animal', name: '🐾 Животни и човек', color: 0x1e88e5 },
  ];
  const ITEMS = [
    { id: 'i-oak', label: 'Дъб', grp: 'plant', make: () => treeModel(0.42), why: 'Дъбът има зелени листа. Сам си прави храна.' },
    { id: 'i-wheat', label: 'Пшеница', grp: 'plant', make: wheatModel, why: 'Пшеницата е растение: прави си храна от вода, въздух и светлина.' },
    { id: 'i-rose', label: 'Роза', grp: 'plant', make: () => flowerModel(0xd81b60, 0.7), why: 'Розата е растение. Не се придвижва и сама си прави храна.' },
    { id: 'i-boletus', label: 'Манатарка', grp: 'fungi', make: () => mushroomModel(0x8d5524, 1.4), why: 'Манатарката е гъба. Няма зелени листа и поема готова храна.' },
    { id: 'i-amanita', label: 'Мухоморка', grp: 'fungi', make: () => mushroomModel(0xd32f2f, 1.4, true), why: 'Мухоморката е отровна гъба. Не я пипаме!' },
    { id: 'i-mold', label: 'Плесен', grp: 'fungi', make: moldBreadItem, why: 'Плесента е гъба. Тя се храни с хляба.' },
    { id: 'i-bird', label: 'Кос', grp: 'animal', make: () => birdModel(0x212121, 0xffb300), why: 'Косът лети и търси храна — червеи и плодове.' },
    { id: 'i-bfly', label: 'Пеперуда', grp: 'animal', make: () => { const b = butterflyModel(0x42a5f5); b.scale.setScalar(1.5); b.position.y = 0.5; return b; }, why: 'Пеперудата лети от цвят на цвят и пие нектар.' },
    { id: 'i-child', label: 'Човек', grp: 'animal', make: () => { const c = childModel(); c.scale.setScalar(0.55); return c; }, why: 'Човекът се движи и яде готова храна, както животните.' },
  ];
  const sortG = new THREE.Group();
  scene.add(sortG);
  const zones = GROUPS.map((G) => {
    const z = zoneRing(G.color, 1.2);
    z.userData.pickId = 'zone-' + G.id;
    z.userData.grp = G.id;
    const l = labelSprite(G.name, { size: 0.3 });
    l.position.set(0, 0.3, -1.45);
    l.raycast = () => {};
    stage.steadyLabel(l, 9);
    z.add(l);
    sortG.add(z);
    return z;
  });
  const items = ITEMS.map((it) => {
    const g = new THREE.Group();
    const m = it.make();
    g.add(m);
    g.userData = { pickId: it.id, it, model: m, home: new V3() };
    addHitBox(g, 0.65);
    named(g, it.label, it.id === 'i-oak' ? 1.6 : it.id === 'i-bfly' ? 0.95 : 1.05, 8);
    sortG.add(g);
    return g;
  });
  stage.tick((dt, t) => {
    if (!sortG.visible) return;
    for (const g of items) {
      if (g.userData.it.id === 'i-bfly') flap(g.userData.model, t);
      if (g.userData.it.id === 'i-rose') g.userData.model.rotation.z = Math.sin(t * 1.3) * 0.05;
    }
  });
  let stopDrag = null;

  // ---------- Тъмният шкаф (стъпка 4) ----------
  const cab = new THREE.Group();
  scene.add(cab);
  {
    const wood = mat(0x8d6e63);
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 0.08), wood); back.position.set(0, 1.0, -0.7);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 1.5), wood); top.position.set(0, 2.0, 0);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 1.5), wood); bot.position.set(0, 0.0, 0);
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.0, 1.5), wood); l.position.set(-1.6, 1.0, 0);
    const r = l.clone(); r.position.x = 1.6;
    const inside = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.9), new THREE.MeshBasicMaterial({ color: 0x1b1410 }));
    inside.position.set(0, 1.0, -0.65);
    cab.add(back, top, bot, l, r, inside);
    const door = new THREE.Group();
    const d = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.06), mat(0xa1887f));
    d.position.set(0.8, 1.0, 0);
    door.add(d);
    door.position.set(-1.6, 0, 0.75);
    cab.add(door);
    cab.userData.door = door;
  }
  const cabPlant = beanInPot({ r: 0.32, h: 0.45 });
  cabPlant.position.set(-0.7, 0.04, 0);
  const box = new THREE.Group();
  {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.6), mat(0x795548));
    b.position.y = 0.125;
    const soil = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.02, 0.54), mat(0x3e2723));
    soil.position.y = 0.25;
    box.add(b, soil);
  }
  box.position.set(0.7, 0.04, 0);
  const pec = [];
  for (let i = 0; i < 6; i++) {
    const m = mushroomModel(0xf5f0e6, 0.7);
    m.position.set(-0.3 + (i % 3) * 0.3, 0.26, -0.13 + Math.floor(i / 3) * 0.26);
    box.add(m); pec.push(m);
  }
  cab.add(cabPlant, box);
  named(cabPlant, 'Растение', -0.25, 7).position.z = 0.6;
  named(box, 'Печурки', -0.25, 7).position.z = 0.6;
  cab.position.set(0, 0, 0);
  function setCab(d) {
    // на тъмно растението се източва, бледнее и отслабва; печурките растат и на тъмно
    cabPlant.userData.set({ h: lerp(0.45, 0.8, seg(d, 0, 14)), leaves: d > 9 ? 3 : 6, green: 1 - seg(d, 2, 12), dry: seg(d, 10, 14) * 0.5, lean: seg(d, 8, 14) * 0.25, wet: 1 });
    pec.forEach((m, i) => m.scale.setScalar(lerp(0.25, 1, seg(d, i * 0.6, i * 0.6 + 8))));
  }

  function show(which) {
    world.visible = which === 'world';
    sortG.visible = which === 'sort';
    cab.visible = which === 'cab';
    sun.visible = which !== 'cab';
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip(); clearTags();
    if (stopDrag) { stopDrag(); stopDrag = null; }
    show('world');
    resetWorld();
    view(ctx, [0.4, 0.7, 0], 5.2, { halfH: 2.4 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Край гората живеят <b>растения</b>, <b>гъби</b> и <b>животни</b>. Как се хранят? Движат ли се?</p><p><b>Разгледай всичко</b> от менюто в ъгъла или с клик.</p>',
      items: [
        { id: 'sunflower', label: 'Слънчоглед', icon: '🌻', note: 'Растение. Има зелени листа. <b>Сам си прави храна</b> от вода и въздух със светлината на Слънцето. Не се придвижва.', obj: () => sunflower, dist: 4, lift: 1, bubble: 2.2 },
        { id: 'boletus', label: 'Манатарка', icon: '🍄', note: 'Гъба. Няма зелени листа. <b>Поема готова храна</b> от почвата и от гниещите листа. Не се придвижва.', obj: () => boletus, dist: 3.2 },
        { id: 'stump', label: 'Пън с гъби', icon: '🪵', note: 'Тези гъби растат върху гниещото дърво и <b>се хранят с него</b>.', obj: () => stump, dist: 3.4 },
        { id: 'bread', label: 'Хляб с плесен', icon: '🍞', note: 'Зелено-сивите петна са <b>плесен</b>. Плесента е гъба. Тя се храни с хляба. Мухлясал хляб не се яде!', obj: () => bread, dist: 2.8 },
        { id: 'hare', label: 'Заек', icon: '🐰', note: 'Животно. <b>Придвижва се</b> и търси готова храна — трева, листа, моркови.', obj: () => hareG, dist: 3 },
        { id: 'deer', label: 'Сърна', icon: '🦌', note: 'Животно. Ходи из гората и пасе трева и листа.', obj: () => deerG, dist: 3.8 },
        { id: 'bird', label: 'Кос', icon: '🐦', note: 'Животно. Лети и подскача. Кълве червеи и плодове.', obj: () => birdG, dist: 2.8 },
        { id: 'child', label: 'Дете', icon: '🧒', note: 'Човекът се движи и яде <b>готова храна</b>. По това прилича на животните.', obj: () => child, dist: 3.6, lift: 0.8, bubble: 1.5 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Как се хранят и движат? ----------
  function step2() {
    shell.step(1);
    ctx.clearTip(); clearTags();
    show('world');
    resetWorld();
    spot.visible = true;
    view(ctx, [0.3, 0.6, 0.6], 4.6, { halfH: 2.0, elev: 0.55 });
    shell.task('<p>Ще сложим <b>моркови</b> на ливадата, далеч от всички.</p>');
    choice(ctx, {
      q: 'Кой ще отиде до храната?',
      options: [
        { t: 'Заекът и сърната', ok: true, why: 'Да проверим! Провлачи морковите в оранжевия кръг.' },
        { t: 'Всички — и слънчогледът, и гъбата', ok: false, why: 'Могат ли растенията и гъбите да ходят?' },
        { t: 'Никой', ok: false, why: 'Животните търсят храна. Могат ли да се придвижат до нея?' },
      ],
      hint: 'Само животните се придвижват.',
      onRight: (m) => feed(m),
    });
  }
  function feed(m0) {
    let mistakes = m0;
    shell.task('<p><b>Провлачи морковите</b> в оранжевия кръг.</p>');
    carrot.userData.dragId = 'carrot';
    stopDrag = stage.enableDrag({
      planeY: 0,
      onDrop: (g, p, start) => {
        if (Math.hypot(p.x - spot.position.x, p.z - spot.position.z) > 0.9) { g.position.copy(start); shell.msg('Сложи морковите в оранжевия кръг.', 'bad'); return; }
        stopDrag(); stopDrag = null;
        delete carrot.userData.dragId;
        carrot.position.set(spot.position.x, 0, spot.position.z);
        spot.visible = false;
        A.food = carrot.position.clone();
        ANIM.forEach((a) => { a.wait = 0; a.target = null; });
        shell.msg('');
        setTimeout(() => {
          tag(hareG, '✓ дойде да яде', 'tag good', 1.0);
          tag(deerG, '✓ дойде да яде', 'tag good', 1.9);
          tag(sunflower, '✗ не се придвижва', 'tag bad', 2.3);
          tag(boletus, '✗ не се придвижва', 'tag bad', 1.0);
          shell.msg('Животните се придвижват и търсят храна. Растенията и гъбите остават на място.', 'good');
          nextBtn(ctx, 'Напред →', days);
        }, 4200);
      },
    });
    function days() {
      clearTags();
      // морковите са изядени; животните се връщат по местата си
      carrot.visible = false;
      A.food = null;
      ANIM.forEach((a) => { a.eat = false; a.wait = 0; a.target = a.home.clone(); });
      view(ctx, [-0.2, 0.7, -0.2], 3.4, { halfH: 1.8, elev: 0.5 });
      shell.task('<p>Гъбите и слънчогледът не ходят. Как тогава се хранят? <b>Плъзни лентата</b> и гледай пъна, хляба и слънчогледа.</p>');
      const c = shell.setControls('<label class="row">Ден <b class="dn">0</b> <input type="range" class="days" min="0" max="7" value="0" style="flex:1"></label>');
      let ok = false;
      c.querySelector('.days').addEventListener('input', (e) => {
        const d = +e.target.value;
        c.querySelector('.dn').textContent = d;
        setDay(d);
        if (d >= 7 && !ok) {
          ok = true;
          tag(sunflower, '☀ Расте. Прави си храна със светлината.', 'tag good', 2.3);
          tag(stump, '🍄 Гъбите растат, като се хранят с пъна.', 'tag', 1.2);
          tag(bread, '🍞 Плесента расте, като се храни с хляба.', 'tag', 0.6);
          choice(ctx, {
            q: 'Откъде взема храна гъбата?',
            options: [
              { t: 'От това, върху което расте — пъна, хляба, почвата.', ok: true, why: 'Вярно! Гъбите поемат готова храна. Растенията си правят храна сами.' },
              { t: 'Сама си я прави със светлината.', ok: false, why: 'Има ли гъбата зелени листа като слънчогледа?' },
              { t: 'Ходи и търси храна.', ok: false, why: 'Гъбата премести ли се до морковите?' },
            ],
            hint: 'Виж с какво се храни плесента.',
            mistakes,
            onRight: (m) => {
              mistakes = m;
              ctx.scores[0] = stepScore(mistakes, 3);
              nextBtn(ctx, 'Напред →', step3);
            },
          });
        }
      });
    }
  }

  // ---------- 3. Подреди в три групи ----------
  function step3() {
    shell.step(2);
    ctx.clearTip(); clearTags();
    show('sort');
    const narrow = stage.camera.aspect < 1;
    const dx = narrow ? 1.25 : 2.7;
    const R = narrow ? 0.62 : 1.2;
    zones.forEach((z, i) => { z.position.set((i - 1) * dx, 0, narrow ? -0.4 : -0.2); z.scale.setScalar(R / 1.2); });
    items.forEach((g, i) => {
      if (narrow) g.userData.home.set(-1.2 + (i % 5) * 0.6, 0, i < 5 ? 1.0 : 1.9);
      else g.userData.home.set(-4.0 + i * 1.0, 0, 2.0);
      if (narrow && i >= 5) g.userData.home.x += 0.3;
      g.position.copy(g.userData.home);
      g.userData.locked = false;
      g.userData.dragId = g.userData.it.id;
      g.scale.setScalar(narrow ? 0.8 : 1);
    });
    if (narrow) view(ctx, [0, 0.3, 0.6], 1.95, { halfH: 1.9, elev: 0.9 });
    else view(ctx, [0, 0.3, 0.8], 4.8, { halfH: 2.4, elev: 0.8 });
    let mistakes = 0; let placed = 0;
    const cnt = { plant: 0, fungi: 0, animal: 0 };
    shell.task('<p><b>Провлачи всеки организъм</b> в кръга на неговата група.</p>');
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${placed} от ${ITEMS.length} · грешки: ${mistakes}`);
    upd();
    const HINT = {
      plant: 'Има ли зелени листа? Сам ли си прави храна?',
      fungi: 'Няма зелени листа и не ходи. Как се храни?',
      animal: 'Придвижва ли се? Търси ли готова храна?',
    };
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => ctx.clearTip(),
      onDrop: (g, p, start) => {
        const it = g.userData.it;
        const z = zones.find((zz) => Math.hypot(p.x - zz.position.x, p.z - zz.position.z) < R + 0.15);
        if (!z) { g.position.copy(start); return; }
        if (z.userData.grp === it.grp) {
          g.userData.locked = true;
          delete g.userData.dragId;
          const k = cnt[it.grp]++;
          const a = [0.35, 1.57, 2.8][k];
          g.position.set(z.position.x + Math.cos(a) * R * 0.5, 0, z.position.z + Math.sin(a) * R * 0.45);
          placed++;
          ctx.say(g, `✔ ${esc(it.why)}`, 'good wide', 1.2);
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          g.position.copy(start);
          ctx.say(g, `✘ ${esc(it.label)}: ${esc(HINT[it.grp])}${mistakes >= 2 ? ' ' + esc(it.why) : ''}`, 'bad wide', 1.2);
          shell.msg('Не е там.', 'bad');
        }
        upd();
        if (placed === ITEMS.length) {
          stopDrag(); stopDrag = null;
          ctx.scores[1] = stepScore(mistakes, 3);
          shell.score('');
          shell.msg('Браво! Растенията си правят храна, гъбите поемат готова храна, а животните се придвижват и я търсят.', 'good');
          nextBtn(ctx, 'Напред →', step4);
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    ctx.clearTip(); clearTags();
    show('cab');
    setCab(0);
    cab.userData.door.rotation.y = -1.9;
    view(ctx, [0, 1.0, 0], 1.9, { halfH: 1.3, elev: 0.2 });
    shell.task('<p>В тъмен шкаф слагаме саксия с <b>растение</b> и кутия с малки <b>печурки</b>. Затваряме вратата за две седмици.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще стане на тъмно?',
      options: [
        { t: 'Растението ще пожълтее и ще отслабне, а печурките ще растат.', ok: true, why: 'Да проверим! Плъзни лентата.' },
        { t: 'И двете ще растат добре.', ok: false, why: 'Растението си прави храна със светлина. Има ли светлина в шкафа?' },
        { t: 'И двете ще изсъхнат веднага.', ok: false, why: 'Гъбите не си правят храна със светлина. Трябва ли им тя?' },
      ],
      hint: 'Само растенията имат нужда от светлина, за да си правят храна.',
      onRight: (m) => {
        mistakes = m;
        const c = shell.setControls('<label class="row">Ден <b class="dn">0</b> <input type="range" class="days" min="0" max="14" value="0" style="flex:1"></label>');
        let ok = false;
        c.querySelector('.days').addEventListener('input', (e) => {
          const d = +e.target.value;
          c.querySelector('.dn').textContent = d;
          setCab(d);
          if (d >= 14 && !ok) {
            ok = true;
            tag(cabPlant, '✗ бледо и слабо', 'tag bad', 1.5);
            tag(box, '✓ печурките пораснаха', 'tag good', 0.9);
            ctx.say(cab, 'Печурките растат и на тъмно — те поемат храна от почвата в кутията. Растението без светлина не може да си прави храна.', 'wide', 2.3);
            setTimeout(safety, 1500);
          }
        });
      },
    });
    function safety() {
      clearTags();
      ctx.clearTip();
      shell.setControls('');
      shell.task('<p>Пренеси към живота.</p><p class="warn">⚠ Много гъби са отровни. Никога не яж гъби, които не познаваш!</p>');
      choice(ctx, {
        q: 'В гората намираш непозната гъба. Какво правиш?',
        options: [
          { t: 'Не я пипам и не я ям. Питам възрастен.', ok: true, why: 'Правилно! Отровните гъби приличат на ядливите.' },
          { t: 'Опитвам я, щом е красива.', ok: false, why: 'Красивата мухоморка е отровна. Сигурно ли е?' },
          { t: 'Давам я на кучето.', ok: false, why: 'Отровната гъба е опасна и за животните.' },
        ],
        hint: 'Само възрастен, който познава гъбите, може да каже дали са ядливи.',
        mistakes,
        onRight: (m) => {
          ctx.scores[2] = stepScore(m, 3);
          finishBtn(ctx, onComplete, restart);
        },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    step1();
  }
  step1();
  return { dispose() { if (stopDrag) stopDrag(); stage.dispose(); } };
}
