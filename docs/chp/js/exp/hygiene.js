// 3.3.3 „Хигиена и здравословно хранене“ — стая с мивка и голям зъб, бюро с дете и кухненска маса.
// Стъпки: опознай → зъбите и сладкото (плака, миене) → правилна стойка → полезна храна.
import { labelSprite, mat, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, bar, stepScore } from './labkit.js';
import { lerp, seg } from './nature3.js';

const V3 = THREE.Vector3;

function toothModel() {
  const g = new THREE.Group();
  const enamel = mat(0xfbfaf4, { roughness: 0.35 });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.5, 0.7, 24), enamel);
  crown.position.y = 1.55;
  g.add(crown);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), enamel);
  top.scale.y = 0.35; top.position.y = 1.9;
  g.add(top);
  for (const [x, z] of [[-0.22, 0.2], [0.22, 0.2], [-0.22, -0.2], [0.22, -0.2]]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), enamel);
    c.position.set(x, 2.02, z);
    g.add(c);
  }
  for (const s of [1, -1]) {
    const root = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 12), mat(0xf1e6c8));
    root.rotation.z = Math.PI + s * 0.12;
    root.position.set(s * 0.25, 0.9, 0);
    g.add(root);
  }
  const gum = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.45, 24), mat(0xf48fb1));
  gum.position.y = 1.0;
  g.add(gum);
  // плака: жълтеникави петна по зъба
  const plaqueM = new THREE.MeshStandardMaterial({ color: 0xe0c060, roughness: 1, transparent: true, opacity: 0 });
  const plaque = [];
  for (let i = 0; i < 18; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.1 + (i % 3) * 0.03, 8, 6), plaqueM);
    const a = i * 0.7; const y = 1.3 + (i % 4) * 0.13;
    p.position.set(Math.cos(a) * 0.55, y, Math.sin(a) * 0.48 + 0.02);
    p.scale.set(1, 0.6, 0.4);
    p.lookAt(new V3(0, y, 0).add(g.position));
    g.add(p);
    plaque.push(p);
  }
  const cavity = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0x3e2723));
  cavity.scale.set(1, 0.8, 0.4);
  cavity.position.set(0.15, 1.62, 0.5);
  cavity.visible = false;
  g.add(cavity);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.5, 18), mat(0x90a4ae));
  stand.position.y = 0.25;
  g.add(stand);
  g.userData = { plaqueM, plaque, cavity };
  return g;
}

function brushModel() {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.9, 4, 8), mat(0x42a5f5, { roughness: 0.3 }));
  handle.rotation.z = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.1), mat(0x42a5f5));
  head.position.x = 0.55;
  const bristles = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.09), mat(0xffffff));
  bristles.position.set(0.55, 0.09, 0);
  const paste = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.15, 4, 6), mat(0x80deea));
  paste.rotation.z = Math.PI / 2; paste.position.set(0.55, 0.17, 0);
  g.add(handle, head, bristles, paste);
  return g;
}

function sinkModel() {
  const g = new THREE.Group();
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.8), mat(0xeceff1));
  cab.position.y = 0.5;
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.12, 22), mat(0xffffff));
  basin.position.set(0, 1.04, 0);
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), mat(0xb0bec5, { metalness: 0.7, roughness: 0.2 }));
  tap.position.set(0, 1.2, -0.3);
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), mat(0xcfe8f5, { metalness: 0.4, roughness: 0.1 }));
  mirror.position.set(0, 1.9, -0.39);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.2, 12), mat(0xffca28));
  cup.position.set(0.55, 1.1, 0);
  g.add(cab, basin, tap, mirror, cup);
  return g;
}

// Седнало дете: torso се накланя (прегърбване), главата отива напред.
function sittingKid() {
  const g = new THREE.Group();
  const skin = mat(0xf2c7a0); const shirt = mat(0x7e57c2); const pants = mat(0x455a64);
  const hips = new THREE.Group();
  hips.position.set(0, 0.95, 0);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 6, 12), shirt);
  torso.position.y = 0.32;
  const neck = new THREE.Group();
  neck.position.y = 0.68;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), skin);
  head.position.y = 0.18;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.195, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), mat(0x3e2723));
  hair.position.y = 0.21;
  neck.add(head, hair);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), mat(0x111111));
    e.position.set(0.17, 0.2, s * 0.07);
    neck.add(e);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.4, 4, 8), shirt);
    arm.position.set(0.18, 0.35, s * 0.25); arm.rotation.z = 1.0;
    hips.add(arm);
  }
  hips.add(torso, neck);
  // линия на гръбначния стълб (зелена — изправен, червена — прегърбен)
  const spineM = new THREE.MeshBasicMaterial({ color: 0x2e9d5b });
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), spineM);
  spine.position.set(-0.22, 0.35, 0);
  hips.add(spine);
  g.add(hips);
  for (const s of [1, -1]) {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.38, 4, 8), pants);
    thigh.rotation.z = Math.PI / 2; thigh.position.set(0.22, 0.92, s * 0.12);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 4, 8), pants);
    shin.position.set(0.45, 0.55, s * 0.12);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.11), mat(0xffffff));
    shoe.position.set(0.5, 0.3, s * 0.12);
    g.add(thigh, shin, shoe);
    g.userData['shoe' + s] = shoe;
  }
  g.userData.hips = hips; g.userData.neck = neck; g.userData.spineM = spineM;
  return g;
}

function standingKid() {
  const g = new THREE.Group();
  const skin = mat(0xf2c7a0); const shirt = mat(0x26a69a); const pants = mat(0x37474f);
  const upper = new THREE.Group();
  upper.position.y = 0.85;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 6, 12), shirt);
  torso.position.y = 0.32;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), skin);
  head.position.y = 0.88;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.195, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), mat(0xffb74d));
  hair.position.y = 0.91;
  upper.add(torso, head, hair);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), mat(0x111111));
    e.position.set(0.17, 0.9, s * 0.07);
    upper.add(e);
  }
  const straps = [1, -1].map((s) => {
    const st = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 6, 14, Math.PI), mat(0x5e35b1));
    st.rotation.y = Math.PI / 2; st.rotation.z = -Math.PI / 2; st.position.set(0.0, 0.55, s * 0.13);
    upper.add(st);
    return st;
  });
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.45), mat(0x7e57c2));
  bag.position.set(-0.32, 0.35, 0);
  upper.add(bag);
  g.add(upper);
  for (const s of [1, -1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.6, 4, 8), pants);
    leg.position.set(0, 0.42, s * 0.11);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.11), mat(0xffffff));
    shoe.position.set(0.04, 0.04, s * 0.11);
    g.add(leg, shoe);
  }
  g.userData = { upper, bag, straps };
  return g;
}

const FOODS = [
  { id: 'apple', label: 'Ябълка', daily: true, why: 'Плодовете дават витамини и фибри.' },
  { id: 'carrot', label: 'Морков', daily: true, why: 'Зеленчуците са полезни всеки ден.' },
  { id: 'yogurt', label: 'Кисело мляко', daily: true, why: 'Млечните храни помагат за здрави кости и зъби.' },
  { id: 'bread', label: 'Пълнозърнест хляб', daily: true, why: 'Пълнозърнестият хляб дава сили за дълго.' },
  { id: 'chips', label: 'Чипс', daily: false, why: 'В чипса има много сол и мазнина.' },
  { id: 'soda', label: 'Газирана напитка', daily: false, why: 'В нея има много захар, която разваля зъбите.' },
  { id: 'candy', label: 'Бонбони', daily: false, why: 'Много сладко разваля зъбите.' },
];
function foodModel(id) {
  const g = new THREE.Group();
  const add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m; };
  if (id === 'apple') { add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), mat(0xd32f2f)), 0, 0.2); add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 5), mat(0x5d4037)), 0, 0.42); const l = add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0x43a047)), 0.06, 0.44); l.scale.set(1.5, 0.4, 0.8); }
  if (id === 'carrot') { const c = add(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 10), mat(0xff7f27)), 0, 0.09); c.rotation.z = Math.PI / 2; for (let i = 0; i < 3; i++) { const l = add(new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 4), mat(0x43a047)), -0.32, 0.1 + (i - 1) * 0.04); l.rotation.z = -Math.PI / 2 + (i - 1) * 0.4; } }
  if (id === 'yogurt') { add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.25, 16), mat(0xffffff)), 0, 0.125); add(new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.02, 16), mat(0x42a5f5)), 0, 0.26); }
  if (id === 'bread') { const b = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.3, 6, 12), mat(0x8d5524)), 0, 0.15); b.rotation.z = Math.PI / 2; b.scale.set(1, 1, 1.3); for (let i = 0; i < 6; i++) add(new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), mat(0xe0c080)), -0.15 + i * 0.06, 0.29, (i % 2) * 0.05); }
  if (id === 'chips') { const b = add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.1), mat(0xffc107)), 0, 0.2); b.scale.set(1, 1, 1); add(new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.04, 0.11), mat(0xe53935)), 0, 0.38); }
  if (id === 'soda') { add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.36, 16), mat(0xc62828, { metalness: 0.5, roughness: 0.3 })), 0, 0.18); add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.02, 16), mat(0xb0bec5, { metalness: 0.6 })), 0, 0.37); }
  if (id === 'candy') { for (let i = 0; i < 4; i++) { const c = add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat([0xec407a, 0xffeb3b, 0x7e57c2, 0x29b6f6][i])), (i % 2) * 0.16 - 0.08, 0.07, Math.floor(i / 2) * 0.16 - 0.08); c.scale.set(1.3, 0.8, 0.8); } }
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Зъбите и сладкото', 'Правилна стойка', 'Полезна храна'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xf3efe7, camPos: [0, 4, 10], target: [0, 1, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  // стая
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), mat(0xd7c4a3));
  floor.rotation.x = -Math.PI / 2;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), mat(0xe3eef5));
  wall.position.set(0, 5, -2.5);
  const tiles = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.6), mat(0xb2dfdb));
  tiles.position.set(-4.6, 1.3, -2.49);
  scene.add(floor, wall, tiles);

  const tags = [];
  const tag = (obj, html, cls = 'tag', lift = 1.0) => { const b = stage.bubble(obj, html, { cls, lift }); tags.push(b); return b; };
  const clearTags = () => { while (tags.length) tags.pop().remove(); };
  const named = (g, text, y, size = 0.22) => { const l = labelSprite(text, { size }); l.position.y = y; l.raycast = () => {}; g.add(l); stage.steadyLabel(l, 8); return l; };

  // ---------- Баня: мивка, четка, голям зъб ----------
  const sink = sinkModel();
  sink.position.set(-5.4, 0, -1.8);
  scene.add(sink);
  const tooth = toothModel();
  tooth.position.set(-3.6, 0, -0.6);
  tooth.userData.pickId = 'tooth';
  named(tooth, 'Зъб (уголемен)', 2.6);
  addHitBox(tooth, 1);
  scene.add(tooth);
  const TU = tooth.userData;
  const brush = brushModel();
  const BRUSH_HOME = new V3(-2.3, 1.45, 0.1);
  const brushStand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.38, 12), mat(0x90a4ae));
  brushStand.position.set(-2.3, 0.69, 0.1);
  scene.add(brushStand);
  brush.position.copy(BRUSH_HOME);
  brush.userData.pickId = 'brush';
  addHitBox(brush, 0.6);
  named(brush, 'Четка и паста', 0.45);
  scene.add(brush);
  const T = { plaque: 0, cavity: false };
  function setPlaque(k) {
    T.plaque = Math.max(0, Math.min(1, k));
    TU.plaqueM.opacity = T.plaque * 0.95;
    TU.plaque.forEach((p, i) => { p.visible = T.plaque > i / TU.plaque.length * 0.9; });
    TU.cavity.visible = T.cavity;
  }

  // ---------- Бюро: седнало дете и дете с раница ----------
  const desk = new THREE.Group();
  {
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 1.4), mat(0xbcaaa4));
    top.position.set(0.85, 1.25, 0);
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.25, 1.3), mat(0x8d6e63));
    l1.position.set(1.3, 0.62, 0);
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), mat(0x6d4c41));
    chair.position.set(0, 0.9, 0);
    const cl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), mat(0x6d4c41));
    cl.position.set(0, 0.45, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.5), mat(0x6d4c41));
    back.position.set(-0.27, 1.2, 0);
    desk.add(top, l1, chair, cl, back);
  }
  desk.position.set(-0.5, 0, -0.4);
  scene.add(desk);
  const sitter = sittingKid();
  desk.add(sitter);
  sitter.userData.pickId = 'sitter'; // без голяма кутия за клик: иначе закрива книгата
  const book = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.5), mat(0x1e88e5)); const p = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.48), mat(0xffffff)); p.position.y = 0.03; book.add(b, p); }
  book.userData.pickId = 'book';
  addHitBox(book, 0.5);
  desk.add(book);
  // подложка за книгата, когато е близо до очите
  const lamp = new THREE.Group();
  { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 12), mat(0x37474f)); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), mat(0x37474f)); p.position.y = 0.3; const h = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.18, 12, 1, true), mat(0xffca28, { side: THREE.DoubleSide })); h.position.set(0.08, 0.6, 0); h.rotation.z = 0.8; lamp.add(s, p, h); }
  lamp.position.set(1.15, 1.29, -0.5);
  desk.add(lamp);
  const walker = standingKid();
  walker.position.set(1.9, 0, 0.6);
  walker.rotation.y = -0.4;
  walker.userData.pickId = 'backpack';
  addHitBox(walker, 0.8);
  scene.add(walker);
  const S = { slouch: 1, oneStrap: 1, close: 1, ts: 1, tb: 1, tc: 1 };
  stage.tick((dt, t) => {
    S.slouch += (S.ts - S.slouch) * Math.min(1, dt * 3);
    S.oneStrap += (S.tb - S.oneStrap) * Math.min(1, dt * 3);
    S.close += (S.tc - S.close) * Math.min(1, dt * 3);
    const U = sitter.userData;
    U.hips.rotation.z = -0.45 * S.slouch;
    U.neck.rotation.z = -0.35 * S.slouch;
    U.spineM.color.setHex(0x2e9d5b).lerp(new THREE.Color(0xe53935), S.slouch);
    // книгата: близо до очите — повдигната и приближена
    book.position.set(lerp(0.75, 0.55, S.close), 1.3 + S.close * 0.12, 0);
    book.rotation.z = S.close * 0.5;
    const W = walker.userData;
    W.upper.rotation.x = 0.22 * S.oneStrap;
    W.straps[1].visible = S.oneStrap < 0.5;
    W.bag.position.z = 0.22 * S.oneStrap;
    W.bag.rotation.x = 0.3 * S.oneStrap;
    W.upper.position.y = 0.85 + Math.sin(t * 2) * 0.005;
  });

  // ---------- Кухненска маса с храни ----------
  const table = new THREE.Group();
  {
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 1.6), mat(0xd7ccc8));
    top.position.y = 0.9;
    for (const [x, z] of [[-1.6, -0.6], [1.6, -0.6], [-1.6, 0.6], [1.6, 0.6]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), mat(0x8d6e63)); l.position.set(x, 0.45, z); table.add(l); }
    table.add(top);
  }
  table.position.set(5.2, 0, -0.4);
  scene.add(table);
  const TY = 0.94;
  const zDaily = zoneRing(0x2e9d5b, 0.55); zDaily.position.set(-0.85, TY, 0.1); zDaily.userData.pickId = 'zone-daily';
  const zRare = zoneRing(0xef6c00, 0.55); zRare.position.set(0.85, TY, 0.1); zRare.userData.pickId = 'zone-rare';
  table.add(zDaily, zRare);
  for (const [z, t] of [[zDaily, '🥗 Всеки ден'], [zRare, '🍬 Рядко и малко']]) { const l = labelSprite(t, { size: 0.22 }); l.position.set(0, 0.25, -0.7); l.raycast = () => {}; stage.steadyLabel(l, 7); z.add(l); }
  const water = new THREE.Group();
  { const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.32, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); gl.position.y = 0.16; const w = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.24, 14), new THREE.MeshStandardMaterial({ color: 0x64b5f6, transparent: true, opacity: 0.6 })); w.position.y = 0.13; water.add(gl, w); }
  water.position.set(1.55, TY, -0.55);
  water.userData.pickId = 'water';
  addHitBox(water, 0.4);
  named(water, 'Вода', 0.5, 0.18);
  table.add(water);
  const foods = FOODS.map((F, i) => {
    const g = foodModel(F.id);
    g.userData = { pickId: F.id, F, home: new V3(-1.5 + i * 0.5, TY, 0.6 + (i % 2) * 0.05) };
    g.position.copy(g.userData.home);
    addHitBox(g, 0.4);
    named(g, F.label, 0.55, 0.15);
    table.add(g);
    return g;
  });
  stage.tick((dt, t) => { foods.forEach((g, i) => { if (!g.userData.locked) g.rotation.y = Math.sin(t * 0.6 + i) * 0.15; }); });
  let stopDrag = null;

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip(); clearTags();
    if (stopDrag) { stopDrag(); stopDrag = null; }
    T.cavity = false; setPlaque(0);
    brush.position.copy(BRUSH_HOME); brush.rotation.set(0, 0, 0);
    S.ts = 1; S.tb = 1; S.tc = 1;
    foods.forEach((g) => { g.position.copy(g.userData.home); g.userData.locked = false; delete g.userData.dragId; });
    zDaily.visible = false; zRare.visible = false;
    view(ctx, [0, 1.1, -0.5], 6.6, { halfH: 2.2 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Как да пазим зъбите, гърба и цялото тяло здрави?</p><p><b>Разгледай всичко</b> от менюто или с клик.</p>',
      items: [
        { id: 'tooth', label: 'Зъб', icon: '🦷', note: 'Това е зъб, много уголемен. Отгоре е покрит с твърд <b>зъбен емайл</b>. Корените са скрити във венеца.', obj: () => tooth, dist: 4, lift: 1.2, bubble: 1.6 },
        { id: 'brush', label: 'Четка и паста', icon: '🪥', note: 'Мием зъбите <b>сутрин и вечер</b>, по около <b>2 минути</b>, с паста с флуор.', obj: () => brush, dist: 2.4 },
        { id: 'sitter', label: 'Дете на бюрото', icon: '🪑', note: 'Детето е прегърбено. Зелената линия ще покаже, когато гърбът е изправен.', obj: () => sitter, dist: 3, lift: 1.2, bubble: 1.9 },
        { id: 'backpack', label: 'Раница', icon: '🎒', note: 'Раницата е на едно рамо. Тялото се накланя на една страна.', obj: () => walker, dist: 3, lift: 1, bubble: 1.9 },
        { id: 'apple', label: 'Храни', icon: '🍎', note: 'На масата има различни храни. Кои ядем всеки ден, а кои — рядко?', obj: () => foods[0], dist: 3.4 },
        { id: 'water', label: 'Вода', icon: '🥛', note: 'Водата утолява жаждата и не разваля зъбите.', obj: () => water, dist: 2.4 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Зъбите и сладкото ----------
  function step2() {
    shell.step(1);
    ctx.clearTip(); clearTags();
    view(ctx, [-3.1, 1.4, -0.3], 1.75, { halfH: 1.3, elev: 0.3 });
    shell.task('<p>Ядем бонбони и не мием зъбите. По зъбите остават частици храна и захар. Там се размножават <b>микроби</b>.</p>');
    choice(ctx, {
      q: 'Какво ще стане със зъба след много дни без миене?',
      options: [
        { t: 'Ще се покрие с плака и може да се появи кариес.', ok: true, why: 'Да проверим! Плъзни лентата.' },
        { t: 'Ще стане по-бял и по-здрав.', ok: false, why: 'Захарта и остатъците от храна помагат ли на зъба?' },
        { t: 'Нищо няма да се промени.', ok: false, why: 'Микробите се хранят със захарта. Какво оставят по зъба?' },
      ],
      hint: 'Микробите и захарта развалят емайла.',
      onRight: (m) => days(m),
    });
  }
  function days(m0) {
    let mistakes = m0;
    const c = shell.setControls('<label class="row">Дни без миене <b class="dn">0</b> <input type="range" class="days" min="0" max="10" value="0" style="flex:1"></label>');
    let said = false;
    c.querySelector('.days').addEventListener('input', (e) => {
      const d = +e.target.value;
      c.querySelector('.dn').textContent = d;
      T.cavity = d >= 9;
      setPlaque(d / 7);
      if (d >= 10 && !said) {
        said = true;
        tag(TU.plaque[0], 'Плака', 'tag bad', 0.2);
        tag(TU.cavity, 'Кариес', 'tag bad', 0.25);
        setTimeout(brushIt, 900);
      }
    });
    function brushIt() {
      shell.task('<p><b>Провлачи четката</b> напред-назад по зъба, докато го почистиш.</p>');
      shell.setControls('');
      shell.score('Почистено: 0%');
      brush.userData.dragId = 'brush';
      let last = null;
      stopDrag = stage.enableDrag({
        planeY: 1.5,
        lift: 0,
        onStart: (g) => { last = g.position.clone(); },
        onMove: (g, p) => {
          const near = Math.hypot(p.x - tooth.position.x, p.z - tooth.position.z) < 1.4;
          if (near && last) setPlaque(T.plaque - last.distanceTo(p) * 0.12);
          last = p.clone();
          shell.score(`Почистено: ${Math.round((1 - T.plaque) * 100)}%`);
          if (T.plaque <= 0.02) done();
        },
        onDrop: (g, p) => {
          const near = Math.hypot(p.x - tooth.position.x, p.z - tooth.position.z) < 1.4;
          if (near) setPlaque(T.plaque - 0.05);
          shell.score(`Почистено: ${Math.round((1 - T.plaque) * 100)}%`);
          if (T.plaque <= 0.02) done(); else g.position.set(g.position.x, BRUSH_HOME.y, g.position.z);
        },
      });
    }
    let finished = false;
    function done() {
      if (finished) return;
      finished = true;
      if (stopDrag) { stopDrag(); stopDrag = null; }
      delete brush.userData.dragId;
      setPlaque(0);
      clearTags();
      brush.position.copy(BRUSH_HOME);
      tag(TU.cavity, 'Кариесът остана', 'tag bad', 0.25);
      ctx.say(tooth, 'Плаката изчезна. Но <b>дупката от кариеса не изчезва</b> с миене — лекува я зъболекар. Затова мием зъбите всеки ден, преди да се появи кариес.', 'wide', 2.2);
      shell.score('');
      shell.task('<p>Зъбът е почистен.</p>');
      setTimeout(() => {
        choice(ctx, {
          q: 'Колко често мием зъбите?',
          options: [
            { t: 'Поне два пъти на ден — сутрин и вечер, по около 2 минути.', ok: true, why: 'Вярно! И ходим на зъболекар за преглед.' },
            { t: 'Само когато ни заболи зъб.', ok: false, why: 'Тогава кариесът вече е там. Как да го предпазим?' },
            { t: 'Веднъж седмично.', ok: false, why: 'Плаката се натрупва всеки ден. Колко често трябва да я махаме?' },
          ],
          hint: 'Сутрин и вечер.',
          mistakes,
          onRight: (m) => { mistakes = m; ctx.scores[0] = stepScore(mistakes, 3); nextBtn(ctx, 'Напред →', step3); },
        });
      }, 800);
    }
  }

  // ---------- 3. Правилна стойка ----------
  const FIX = [
    { t: 'back', label: '🪑 Седни изправено, краката на пода', target: 'sitter', ok: 'Гърбът е изправен. Зелената линия го показва.', set: () => { S.ts = 0; } },
    { t: 'bag', label: '🎒 Раницата на двете рамене', target: 'backpack', ok: 'Тежестта е разпределена и тялото не се накланя.', set: () => { S.tb = 0; } },
    { t: 'book', label: '📖 Книгата по-далеч от очите', target: 'book', ok: 'Книгата е на масата, не твърде близо до очите.', set: () => { S.tc = 0; } },
  ];
  function step3() {
    shell.step(2);
    ctx.clearTip(); clearTags();
    view(ctx, [0.6, 1.1, 0], 2.2, { halfH: 1.4, elev: 0.25 });
    brushStand.visible = true;
    let mistakes = 0; let tool = null; let done = 0;
    shell.task(`<p>Помогни на децата да пазят гърба и очите си. <b>Избери съвет</b> и кликни на кого или на какво помага.</p>
      <div class="xp-chips">${FIX.map((f) => `<span class="chip" data-t="${f.t}">${f.label}</span>`).join('')}</div>`);
    shell.setControls('');
    shell.score('Поправени: 0 от 3');
    container.querySelectorAll('.xp-task .chip').forEach((ch) => ch.addEventListener('click', () => {
      container.querySelectorAll('.xp-task .chip').forEach((x) => x.classList.remove('held'));
      ch.classList.add('held'); tool = ch.dataset.t;
    }));
    const objOf = { sitter, backpack: walker, book };
    ctx.click = (id) => {
      if (!objOf[id]) return;
      if (!tool) { shell.msg('Първо избери съвет отгоре.', 'bad'); return; }
      const f = FIX.find((x) => x.t === tool);
      if (f.target === id) {
        f.set(); done++;
        const ch = container.querySelector(`.xp-task .chip[data-t="${tool}"]`);
        ch.classList.remove('held'); ch.classList.add('used', 'right');
        tool = null;
        ctx.say(objOf[id], `✔ ${f.ok}`, 'good wide', id === 'book' ? 0.4 : 1.9);
        shell.msg('Вярно!', 'good');
        shell.score(`Поправени: ${done} от 3`);
        if (done === 3) {
          ctx.click = null;
          ctx.scores[1] = stepScore(mistakes, 3);
          shell.score('');
          shell.task('<p>Изправеният гръб, раницата на двете рамене, движението и спортът пазят правилната стойка.</p>');
          nextBtn(ctx, 'Напред →', step4);
        }
      } else {
        mistakes++;
        ctx.say(objOf[id], '✘ Този съвет не е за това.', 'bad', id === 'book' ? 0.4 : 1.9);
        shell.msg(`Не е тук.${mistakes >= 2 ? ' Подсказка: гърбът — на седящото дете, раницата — на правото, книгата — на бюрото.' : ''}`, 'bad');
      }
    };
  }

  // ---------- 4. Полезна храна ----------
  function step4() {
    shell.step(3);
    ctx.clearTip(); clearTags();
    view(ctx, [5.2, 1.0, -0.2], 2.0, { halfH: 1.1, elev: 0.55 });
    shell.task('<p>Боби игра футбол и е много жаден.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво е най-добре да пие?',
      options: [
        { t: 'Вода', ok: true, why: 'Вярно! Водата утолява жаждата и не разваля зъбите.' },
        { t: 'Газирана напитка', ok: false, why: 'В нея има много захар. Какво утолява жаждата без захар?' },
        { t: 'Енергийна напитка', ok: false, why: 'Енергийните напитки не са за деца — в тях има кофеин и захар.' },
      ],
      hint: 'Най-простата напитка е най-добрата.',
      onRight: (m) => { mistakes = m; tag(water, '✔ Вода', 'tag good', 0.6); nextBtn(ctx, 'Напред →', sort); },
    });
    function sort() {
      clearTags();
      zDaily.visible = true; zRare.visible = true;
      foods.forEach((g) => { g.userData.dragId = g.userData.F.id; });
      shell.task('<p><b>Провлачи всяка храна</b> в кръга: ядем я <b>всеки ден</b> или <b>рядко и малко</b>.</p>');
      shell.setControls('');
      let placed = 0;
      const cnt = { d: 0, r: 0 };
      const upd = () => shell.score(`Подредени: ${placed} от ${FOODS.length}`);
      upd();
      stopDrag = stage.enableDrag({
        planeY: TY,
        onStart: () => ctx.clearTip(),
        onDrop: (g, p, start) => {
          const F = g.userData.F;
          const lp = p; // положението е спрямо масата
          const inD = Math.hypot(lp.x - zDaily.position.x, lp.z - zDaily.position.z) < 0.65;
          const inR = Math.hypot(lp.x - zRare.position.x, lp.z - zRare.position.z) < 0.65;
          if (!inD && !inR) { g.position.copy(start); return; }
          if (inD === F.daily) {
            g.userData.locked = true; delete g.userData.dragId;
            const z = F.daily ? zDaily : zRare;
            const k = F.daily ? cnt.d++ : cnt.r++;
            const a = k * 1.6 + 0.6;
            g.position.set(z.position.x + Math.cos(a) * 0.32, TY, z.position.z + Math.sin(a) * 0.3);
            placed++;
            ctx.say(g, `✔ ${esc(F.why)}`, 'good', 0.7);
          } else {
            mistakes++;
            g.position.copy(start);
            ctx.say(g, `✘ ${esc(F.label)}: ${F.daily ? 'това е полезна храна.' : 'има ли в нея много захар, сол или мазнина?'}${mistakes >= 2 ? ' ' + esc(F.why) : ''}`, 'bad wide', 0.7);
          }
          upd();
          if (placed === FOODS.length) { stopDrag(); stopDrag = null; shell.score(''); myth(); }
        },
      });
    }
    function myth() {
      ctx.clearTip();
      shell.task('<p>Пренеси към живота.</p>');
      choice(ctx, {
        q: 'Сокът от магазина толкова полезен ли е, колкото цял плод?',
        options: [
          { t: 'Не. В него често има добавена захар и липсват фибрите на плода.', ok: true, why: 'Вярно! По-добре цял плод и вода. Сок пием рядко и малко.' },
          { t: 'Да, сокът е същото като плода.', ok: false, why: 'Прочети етикета: има ли добавена захар? Остават ли в сока фибрите на ябълката?' },
          { t: 'Сокът е по-полезен от водата.', ok: false, why: 'Водата утолява жаждата без захар. А сокът?' },
        ],
        hint: 'Помисли за захарта.',
        mistakes,
        onRight: (m) => {
          ctx.scores[2] = stepScore(m, 3);
          ctx.say(table, 'Ядем разнообразно: плодове, зеленчуци, мляко, пълнозърнест хляб. Пием вода. Сладкото — рядко, и после мием зъбите.', 'good wide', 1.6);
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
