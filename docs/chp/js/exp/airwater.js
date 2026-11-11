// 3.1.4 „Въздухът и водата: свойства, значение, опазване“ — маса с вана, чаши, кана и филтър.
// Стъпки: опознай → въздухът заема място (чаша във вода) → водата тече и разтваря → пази водата и въздуха.
import { labelSprite, mat, addHitBox, THREE, esc, shuffle } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, bar, stepScore } from './labkit.js';

const V3 = THREE.Vector3;
const clamp01 = (k) => Math.max(0, Math.min(1, k));
const lerp = (a, b, k) => a + (b - a) * k;
const waterMat = (color = 0x4fa8e8, opacity = 0.42) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.1, depthWrite: false });

// Ваната с вода (стъпка 2).
const TX = -4.6, TW = 2.1, TD = 1.3, TH = 1.5, WL0 = 1.0;
// Обърнатата чаша: ръбът е долу, дъното с кърпичката — горе.
const CR = 0.3, CH = 0.8;

function label(stage, text, size = 0.2, ref = 7) {
  const s = labelSprite(text, { size });
  stage.steadyLabel(s, ref);
  return s;
}

function candleModel() {
  const g = new THREE.Group();
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 18), mat(0xfff3c4));
  wax.position.y = 0.3;
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.05, 20), mat(0xb0bec5));
  dish.position.y = 0.025;
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffc94a }));
  flame.scale.set(1, 2.1, 1);
  flame.position.y = 0.75;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
  core.scale.set(1, 1.8, 1);
  core.position.y = 0.71;
  g.add(wax, dish, flame, core);
  g.userData.flame = flame;
  return g;
}

function plantModel() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.5, 18), mat(0xc8643b));
  pot.position.y = 0.25;
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.3, 18), mat(0x4a3322));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.48;
  g.add(pot, soil);
  const leaves = [];
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6), mat(0x3aa655));
    leaf.scale.set(0.45, 1.4, 0.22);
    const a = (i / 8) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.16, 0.8 + (i % 3) * 0.12, Math.sin(a) * 0.16);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    g.add(leaf);
    leaves.push(leaf);
  }
  g.userData.leaves = leaves;
  return g;
}

function fishModel(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat(color));
  body.scale.set(1.5, 0.9, 0.55);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 4), mat(color));
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.18;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), mat(0x111111));
  eye.position.set(0.09, 0.025, 0.045);
  g.add(body, tail, eye);
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Въздухът заема място', 'Водата тече и разтваря', 'Пази водата и въздуха'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4.2, 11], target: [0, 0.7, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14, d: 4.8 });

  // ---------- Вана, чаша и бучка пръст ----------
  const tank = new THREE.Group();
  tank.position.x = TX;
  {
    const g = glass(0.2);
    const walls = new THREE.Mesh(new THREE.BoxGeometry(TW, TH, TD), g);
    walls.position.y = TH / 2;
    const rim = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.06, 0.05, TD + 0.06), new THREE.MeshStandardMaterial({ color: 0x90a4ae, transparent: true, opacity: 0.6 }));
    rim.position.y = TH;
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(TW, 0.04, TD), mat(0xdfe9f0));
    bottom.position.y = 0.02;
    tank.add(walls, rim, bottom);
    // камъчета на дъното
    for (let i = 0; i < 14; i++) {
      const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06 + (i % 3) * 0.02), mat([0x9e9e9e, 0xbcaaa4, 0x8d6e63][i % 3]));
      p.position.set(-TW / 2 + 0.15 + ((i * 0.37) % (TW - 0.3)), 0.07, -TD / 2 + 0.15 + ((i * 0.53) % (TD - 0.3)));
      tank.add(p);
    }
  }
  const tankWater = new THREE.Mesh(new THREE.BoxGeometry(TW - 0.04, 1, TD - 0.04), waterMat());
  tank.add(tankWater);
  const tankTop = new THREE.Mesh(new THREE.PlaneGeometry(TW - 0.04, TD - 0.04), new THREE.MeshStandardMaterial({ color: 0x7cc4f2, transparent: true, opacity: 0.5, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }));
  tankTop.rotation.x = -Math.PI / 2;
  tank.add(tankTop);
  tank.userData.pickId = 'tank';
  addHitBox(tank, 1);
  scene.add(tank);

  const cup = new THREE.Group(); // начало: ръбът на чашата (отворът)
  const cupX = TX - 0.35;
  {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(CR, CR * 0.92, CH, 28, 1, true), glass(0.32));
    wall.position.y = CH / 2;
    const top = new THREE.Mesh(new THREE.CircleGeometry(CR * 0.92, 28), glass(0.45));
    top.rotation.x = Math.PI / 2;
    top.position.y = CH;
    const lip = new THREE.Mesh(new THREE.TorusGeometry(CR, 0.015, 6, 28), glass(0.6));
    lip.rotation.x = Math.PI / 2;
    // държач: ръка-щипка отгоре
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), mat(0x78909c, { metalness: 0.4 }));
    rod.position.y = CH + 1.1;
    const clamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), mat(0x546e7a));
    clamp.position.y = CH + 0.04;
    cup.add(wall, top, lip, rod, clamp);
  }
  const napkinM = mat(0xff3b30, { emissive: 0x7a1010 });
  const napkin = new THREE.Mesh(new THREE.CylinderGeometry(CR * 0.86, CR * 0.86, 0.16, 20), napkinM);
  napkin.position.y = CH - 0.1;
  cup.add(napkin);
  const airMat = new THREE.MeshBasicMaterial({ color: 0xf2fbff, transparent: true, opacity: 0.45, depthWrite: false });
  const airPocket = new THREE.Mesh(new THREE.CylinderGeometry(CR * 0.9, CR * 0.9, 1, 24), airMat);
  airPocket.renderOrder = 3;
  const innerWater = new THREE.Mesh(new THREE.CylinderGeometry(CR * 0.9, CR * 0.9, 1, 24), waterMat(0x3d8fd1, 0.6));
  innerWater.renderOrder = 2;
  cup.add(airPocket, innerWater);
  cup.userData.pickId = 'cup';
  scene.add(cup);
  const cupTag = label(stage, 'Чаша с кърпичка', 0.18);
  scene.add(cupTag);

  const soil = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), mat(0x6d4c41, { flat: true }));
  soil.userData.pickId = 'soil';
  scene.add(soil);

  // Мехурчета.
  const bubbleGeo = new THREE.SphereGeometry(1, 10, 8);
  const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, roughness: 0.1 });
  const bubbles = [];
  function puff(x, y, z, r = 0.05) {
    let b = bubbles.find((o) => !o.visible);
    if (!b) { b = new THREE.Mesh(bubbleGeo, bubbleMat); scene.add(b); bubbles.push(b); }
    b.visible = true;
    b.scale.setScalar(r);
    b.position.set(x + (Math.random() - 0.5) * 0.12, y, z + (Math.random() - 0.5) * 0.12);
    b.userData.v = 0.7 + Math.random() * 0.4;
  }

  // Състояние на опита с чашата.
  const S = { press: 0, pressT: 0, tilt: 0, flood: 0, wet: 0, tilting: false, soilY: 0, soilT: -1 };
  function resetCup() {
    S.press = 0; S.pressT = 0; S.tilt = 0; S.flood = 0; S.wet = 0; S.tilting = false; S.soilT = -1;
    soil.position.set(TX + 1.4, 0.16, -0.3);
    napkinM.color.setHex(0xff3b30);
  }
  resetCup();

  stage.tick((dt, t) => {
    S.press += (S.pressT - S.press) * Math.min(1, dt * 3);
    if (S.tilting) S.tilt = Math.min(1, S.tilt + dt * 0.8);
    const rimY = lerp(1.35, 0.18, S.press);
    // въздух под вода (част от чашата)
    const top = rimY + CH;
    // Нивото на водата във ваната се вдига от въздуха, който чашата избутва навътре.
    let wl = WL0;
    for (let k = 0; k < 3; k++) {
      const sub = clamp01((wl - rimY) / CH) * CH * (1 - S.flood);
      wl = WL0 + (Math.PI * CR * CR * sub) / (TW * TD);
    }
    const depth = Math.max(0, wl - rimY);
    // Въздухът се свива съвсем малко (за да се види, е преувеличено).
    const squeeze = Math.min(0.07, depth * 0.06);
    const hin = Math.min(CH - 0.12, squeeze + S.flood * (CH - 0.12));
    if (S.tilting && S.flood < 1 && depth > 0.2) {
      S.flood = Math.min(1, S.flood + dt * 0.45);
      if (Math.random() < dt * 14) puff(cupX + CR * 0.85, rimY + 0.05, 0, 0.04 + Math.random() * 0.04);
    }
    if (S.flood > 0.85) S.wet = Math.min(1, S.wet + dt * 1.5);
    napkinM.color.setHex(0xff3b30).lerp(new THREE.Color(0x7f1010), S.wet);
    napkinM.emissiveIntensity = 1 - S.wet;
    cup.position.set(cupX, rimY, 0);
    cup.rotation.z = Math.sin(S.tilt * Math.PI) * 0.35 + Math.sin(t * 1.3) * 0.006;
    tankWater.scale.y = wl;
    tankWater.position.y = wl / 2;
    tankTop.position.y = wl + Math.sin(t * 2) * 0.004;
    // вода и въздух вътре в чашата (в мерките на чашата)
    innerWater.visible = hin > 0.005 && rimY < wl;
    innerWater.scale.y = Math.max(0.001, hin);
    innerWater.position.y = hin / 2;
    const airTop = Math.min(CH - 0.15, wl - rimY);
    const airH = airTop - hin;
    airPocket.visible = airH > 0.01 && S.flood < 0.98;
    airPocket.scale.y = Math.max(0.001, airH);
    airPocket.position.y = hin + airH / 2;
    cupTag.position.set(cupX, top + 0.45, 0);
    // бучка пръст
    if (S.soilT >= 0) {
      S.soilT += dt;
      const floor = 0.18;
      S.soilY = Math.max(floor, S.soilY - dt * 1.6);
      soil.position.set(TX + 0.55, S.soilY, 0.2);
      if (S.soilT < 4.5 && S.soilY < wl && Math.random() < dt * 10) puff(TX + 0.55, S.soilY + 0.1, 0.2, 0.03 + Math.random() * 0.03);
    }
    for (const b of bubbles) {
      if (!b.visible) continue;
      b.position.y += b.userData.v * dt;
      b.position.x += Math.sin(t * 6 + b.position.y * 9) * 0.004;
      if (b.position.y > wl) b.visible = false;
    }
  });

  // ---------- Кана и три съда: водата тече и приема формата на съда ----------
  const JUG_HOME = new V3(-2.55, 0, 0.35);
  const jug = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.85, 22, 1, true), glass(0.35));
    body.position.y = 0.43;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.6, 22), waterMat());
    water.position.y = 0.32;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 14, Math.PI), glass(0.6));
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-0.32, 0.5, 0);
    const spout = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 8, 1, true), glass(0.5));
    spout.rotation.z = -Math.PI / 2;
    spout.position.set(0.33, 0.8, 0);
    jug.add(body, water, handle, spout);
  }
  jug.position.copy(JUG_HOME);
  jug.userData.pickId = 'jug';
  addHitBox(jug, 0.8);
  scene.add(jug);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1, 8), waterMat(0x4fa8e8, 0.75));
  stream.visible = false;
  scene.add(stream);

  const VOL = 0.13;
  const VESSELS = [
    { id: 'v-tall', name: 'Висока чаша', x: -1.55, make: 'cyl', r: 0.2, h: 1.35 },
    { id: 'v-bowl', name: 'Купа', x: -0.5, make: 'cyl', r: 0.52, h: 0.35 },
    { id: 'v-box', name: 'Кутия', x: 0.55, make: 'box', r: 0.36, h: 0.6 },
  ];
  const vessels = VESSELS.map((V) => {
    const g = new THREE.Group();
    g.position.set(V.x, 0, 0.35);
    let wall; let liquid; let area;
    if (V.make === 'box') {
      wall = new THREE.Mesh(new THREE.BoxGeometry(V.r * 2, V.h, V.r * 2), glass(0.25));
      liquid = new THREE.Mesh(new THREE.BoxGeometry(V.r * 2 - 0.04, 1, V.r * 2 - 0.04), waterMat(0x3d8fd1, 0.6));
      area = (V.r * 2 - 0.04) ** 2;
    } else {
      wall = new THREE.Mesh(new THREE.CylinderGeometry(V.r, V.r, V.h, 28, 1, true), glass(0.3));
      liquid = new THREE.Mesh(new THREE.CylinderGeometry(V.r - 0.02, V.r - 0.02, 1, 28), waterMat(0x3d8fd1, 0.6));
      area = Math.PI * (V.r - 0.02) ** 2;
      const base = new THREE.Mesh(new THREE.CircleGeometry(V.r, 28), glass(0.4));
      base.rotation.x = -Math.PI / 2; base.position.y = 0.01;
      g.add(base);
    }
    wall.position.y = V.h / 2;
    liquid.visible = false;
    g.add(wall, liquid);
    const tag = label(stage, V.name, 0.17);
    tag.position.y = V.h + 0.3;
    g.add(tag);
    g.userData.pickId = V.id;
    addHitBox(g, 0.8);
    scene.add(g);
    return { V, g, liquid, H: VOL / area, k: 0, filling: false };
  });
  let pour = null; // { v, t }
  function setVessel(v, k) {
    v.k = k;
    v.liquid.visible = k > 0.01;
    const h = Math.max(0.001, v.H * k);
    v.liquid.scale.y = h;
    v.liquid.position.y = h / 2 + 0.01;
  }
  stage.tick((dt, t) => {
    for (const v of vessels) if (v.k > 0.01 && !v.filling) {
      // лека вълничка
      v.liquid.rotation.z = Math.sin(t * 2 + v.V.x) * 0.01;
    }
    if (!pour) { jug.position.lerp(JUG_HOME, Math.min(1, dt * 3)); jug.rotation.z *= 1 - Math.min(1, dt * 3); stream.visible = false; return; }
    pour.t += dt;
    const v = pour.v;
    const at = new V3(v.V.x - 0.55, v.V.h + 0.15, 0.35);
    jug.position.lerp(at, Math.min(1, dt * 4));
    const tilting = pour.t > 0.6;
    jug.rotation.z += ((tilting ? -1.1 : 0) - jug.rotation.z) * Math.min(1, dt * 4);
    if (pour.t > 1.0 && pour.t < 2.8) {
      stream.visible = true;
      const sx = v.V.x - 0.08;
      const yTop = jug.position.y + 0.55;
      const yBot = 0.02 + v.H * v.k;
      stream.scale.y = Math.max(0.01, yTop - yBot);
      stream.position.set(sx, (yTop + yBot) / 2, 0.35);
      setVessel(v, Math.min(1, (pour.t - 1.0) / 1.7));
    } else stream.visible = false;
    if (pour.t > 3.2) { v.filling = false; const cb = pour.done; pour = null; cb && cb(v); }
  });

  // ---------- Разтваряне: захар и пясък ----------
  const SOL = [
    { id: 'glass-a', subst: 'sugar', x: 1.75, name: 'Чаша А' },
    { id: 'glass-b', subst: 'sand', x: 2.85, name: 'Чаша Б' },
  ];
  const sol = SOL.map((G) => {
    const g = new THREE.Group();
    g.position.set(G.x, 0, 0.3);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.29, 0.95, 28, 1, true), glass(0.3));
    wall.position.y = 0.475;
    const base = new THREE.Mesh(new THREE.CircleGeometry(0.29, 28), glass(0.4));
    base.rotation.x = -Math.PI / 2; base.position.y = 0.01;
    const wm = waterMat(0x6fb8ea, 0.38);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.28, 0.7, 28), wm);
    water.position.y = 0.36;
    const spoon = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.1, 6), mat(0xb0bec5, { metalness: 0.6, roughness: 0.3 }));
    handle.position.y = 0.55;
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), mat(0xb0bec5, { metalness: 0.6, roughness: 0.3 }));
    bowl.scale.set(1, 0.4, 1.4);
    spoon.add(handle, bowl);
    spoon.position.set(0.12, 0.08, 0);
    spoon.rotation.z = 0.15;
    const tag = label(stage, G.name, 0.18);
    tag.position.y = 1.3;
    g.add(wall, base, water, spoon, tag);
    // вещество
    const stuff = new THREE.Group();
    const grains = [];
    if (G.subst === 'sugar') {
      const cube = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), mat(0xffffff, { roughness: 0.9 }));
      stuff.add(cube); grains.push(cube);
    } else {
      for (let i = 0; i < 40; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), mat([0xd8b26e, 0xc49a54, 0xe2c48a][i % 3]));
        s.userData.a = Math.random() * Math.PI * 2; s.userData.r = Math.random() * 0.2; s.userData.h = Math.random() * 0.05;
        stuff.add(s); grains.push(s);
      }
    }
    stuff.visible = false;
    g.add(stuff);
    g.userData.pickId = G.id;
    addHitBox(g, 0.8);
    scene.add(g);
    return { G, g, wm, spoon, stuff, grains, state: 'none', y: 1.2, stir: 0, k: 0 };
  });
  const dishes = [
    { id: 'sugar', subst: 'sugar', x: 1.75, label: 'Захар' },
    { id: 'sand', subst: 'sand', x: 2.85, label: 'Пясък' },
  ].map((D) => {
    const g = new THREE.Group();
    g.position.set(D.x, 0, 1.45);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.06, 20), mat(0xeceff1));
    plate.position.y = 0.03;
    g.add(plate);
    if (D.subst === 'sugar') {
      for (let i = 0; i < 4; i++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), mat(0xffffff, { roughness: 0.9 }));
        c.position.set((i % 2) * 0.17 - 0.08, 0.13 + Math.floor(i / 2) * 0.0, Math.floor(i / 2) * 0.16 - 0.08);
        g.add(c);
      }
    } else {
      const heap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 14), mat(0xd8b26e, { flat: true }));
      heap.position.y = 0.15;
      g.add(heap);
    }
    const tag = label(stage, D.label, 0.16);
    tag.position.y = 0.55;
    g.add(tag);
    g.userData.pickId = D.id;
    addHitBox(g, 0.7);
    scene.add(g);
    return { D, g };
  });
  function resetSol() {
    for (const s of sol) { s.state = 'none'; s.stuff.visible = false; s.y = 1.2; s.stir = 0; s.k = 0; s.wm.color.setHex(0x6fb8ea); s.wm.opacity = 0.38; s.grains.forEach((g) => g.scale.setScalar(1)); }
  }
  stage.tick((dt, t) => {
    for (const s of sol) {
      if (s.state === 'none') { s.spoon.rotation.y = 0; continue; }
      s.y = Math.max(0.1, s.y - dt * 1.4);
      const stirring = s.stir > 0;
      if (stirring) { s.stir -= dt; s.spoon.rotation.y += dt * 7; s.spoon.position.set(Math.cos(t * 7) * 0.12, 0.08, Math.sin(t * 7) * 0.12); }
      if (s.G.subst === 'sugar') {
        const cube = s.grains[0];
        cube.position.set(0, s.y, 0);
        if (stirring) s.k = Math.min(1, s.k + dt / 2.6);
        cube.scale.setScalar(Math.max(0.001, 1 - s.k));
        cube.visible = s.k < 0.99;
      } else {
        if (stirring) s.k = 1;
        for (const g of s.grains) {
          const u = g.userData;
          if (stirring) { u.a += dt * 6; u.h = Math.min(0.55, u.h + dt * 0.9 * Math.random()); } else u.h = Math.max(0, u.h - dt * 0.35);
          g.position.set(Math.cos(u.a) * u.r, Math.max(0.04, Math.min(s.y, 0.04 + u.h)), Math.sin(u.a) * u.r);
        }
        // мътно, докато се върти, после пясъкът пада на дъното
        const cloud = stirring ? 1 : Math.max(0, (s.grains.reduce((a, g) => a + g.userData.h, 0) / s.grains.length) * 3);
        s.wm.color.setHex(0x6fb8ea).lerp(new THREE.Color(0xc8b07a), Math.min(1, cloud) * 0.6);
      }
    }
  });

  // ---------- Мътна вода и филтър ----------
  const FX = 5.2;
  const mud = new THREE.Group();
  const mudHome = new V3(FX - 1.25, 0, 0.4);
  let mudK = 1;
  const mudWM = waterMat(0x8d6e4a, 0.85);
  const mudWater = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 22), mudWM);
  {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 22, 1, true), glass(0.3));
    wall.position.y = 0.45;
    mud.add(wall, mudWater);
    const tag = label(stage, 'Мътна вода', 0.17);
    tag.position.y = 1.25;
    mud.add(tag);
  }
  mud.position.copy(mudHome);
  mud.userData.pickId = 'mud';
  addHitBox(mud, 0.8);
  scene.add(mud);
  const filt = new THREE.Group();
  filt.position.set(FX, 0, 0.4);
  const cleanWM = waterMat(0xd9eef7, 0.55);
  const cleanWater = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 22), cleanWM);
  const drops = [];
  {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.8, 22, 1, true), glass(0.3));
    jar.position.y = 0.4;
    // срязана бутилка-фуния с пластове: чакъл, пясък, памук
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 22, 1, true), glass(0.3));
    bottle.position.y = 1.55;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.07, 0.3, 22, 1, true), glass(0.35));
    neck.position.y = 1.0;
    const layers = [[0xf5f5f5, 1.17, 0.12], [0xd8b26e, 1.32, 0.18], [0x8d8d8d, 1.5, 0.18]];
    for (const [c, y, h] of layers) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, h, 20), mat(c, { flat: true }));
      l.position.y = y;
      filt.add(l);
    }
    const stand = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 6, 20), mat(0x78909c));
    stand.rotation.x = Math.PI / 2; stand.position.y = 1.15;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 6), mat(0x78909c));
    leg.position.set(0.34, 0.58, 0);
    filt.add(jar, bottle, neck, stand, leg, cleanWater);
    for (let i = 0; i < 4; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), waterMat(0xd9eef7, 0.8));
      d.visible = false; d.userData.p = i / 4;
      filt.add(d); drops.push(d);
    }
    const tag = label(stage, 'Филтър', 0.17);
    tag.position.y = 2.25;
    filt.add(tag);
  }
  filt.userData.pickId = 'filter';
  addHitBox(filt, 0.9);
  scene.add(filt);
  const F = { pouring: false, t: 0, cleanK: 0, done: null };
  function resetFilter() { F.pouring = false; F.t = 0; F.cleanK = 0; mudK = 1; mud.position.copy(mudHome); mud.rotation.z = 0; }
  stage.tick((dt, t) => {
    mudWater.scale.y = Math.max(0.001, 0.7 * mudK);
    mudWater.position.y = 0.35 * mudK + 0.01;
    mudWater.visible = mudK > 0.02;
    const ch = 0.55 * F.cleanK;
    cleanWater.scale.y = Math.max(0.001, ch);
    cleanWater.position.y = ch / 2 + 0.01;
    cleanWater.visible = F.cleanK > 0.01;
    if (!F.pouring) {
      mud.position.lerp(mudHome, Math.min(1, dt * 3));
      mud.rotation.z *= 1 - Math.min(1, dt * 3);
      drops.forEach((d) => { d.visible = false; });
      return;
    }
    F.t += dt;
    mud.position.lerp(new V3(FX - 0.55, 1.85, 0.4), Math.min(1, dt * 3));
    mud.rotation.z += ((F.t > 0.8 && mudK > 0 ? -1.2 : 0) - mud.rotation.z) * Math.min(1, dt * 3);
    if (F.t > 1.2) mudK = Math.max(0, mudK - dt / 2.5);
    const flowing = F.t > 1.8 && F.cleanK < 1;
    if (flowing) F.cleanK = Math.min(1, F.cleanK + dt / 3.2);
    drops.forEach((d) => {
      d.visible = flowing;
      const f = (t * 1.5 + d.userData.p) % 1;
      d.position.set(0, 0.85 - f * (0.8 - ch), 0);
    });
    if (F.cleanK >= 1 && mudK <= 0) { F.pouring = false; const cb = F.done; F.done = null; cb && cb(); }
  });

  // ---------- Свещ, растение, рибки (за опознаване) ----------
  const candle = candleModel();
  candle.position.set(-1.9, 0, -1.6);
  candle.userData.pickId = 'candle';
  addHitBox(candle, 0.7);
  scene.add(candle);
  const plant = plantModel();
  plant.position.set(0.9, 0, -1.6);
  plant.userData.pickId = 'plant';
  addHitBox(plant, 0.8);
  scene.add(plant);
  const fishBowl = new THREE.Group();
  const fish = [];
  {
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), glass(0.25));
    bowl.position.y = 0.55;
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 16, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.68), waterMat(0x5fb0e8, 0.4));
    w.position.y = 0.55;
    fishBowl.add(bowl, w);
    for (const c of [0xff8f00, 0xff5252]) { const f = fishModel(c); fishBowl.add(f); fish.push(f); }
    for (let i = 0; i < 3; i++) {
      const weed = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.45, 5), mat(0x2e7d32));
      weed.position.set(-0.2 + i * 0.18, 0.28, -0.1);
      fishBowl.add(weed);
    }
  }
  fishBowl.position.set(-0.4, 0, -1.6);
  fishBowl.userData.pickId = 'fish';
  scene.add(fishBowl);
  stage.tick((dt, t) => {
    candle.userData.flame.scale.set(1, 2.1 + Math.sin(t * 15) * 0.15, 1);
    fish.forEach((f, i) => {
      const a = t * (0.7 + i * 0.25) + i * 2;
      f.position.set(Math.cos(a) * 0.28, 0.45 + Math.sin(t * 1.3 + i) * 0.08, Math.sin(a) * 0.22);
      f.rotation.y = -a - Math.PI / 2;
    });
    plant.rotation.y = Math.sin(t * 0.5) * 0.08;
  });

  function backItems(on) { candle.visible = on; plant.visible = on; fishBowl.visible = on; }
  // Замърсяване в аквариума и дим над него (стъпка 4): 0 — чисто, 1 — много мръсно.
  const ENV = { dirt: 0, want: 0 };
  const bowlWM = fishBowl.children[1].material;
  const smoke = [];
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (i % 3) * 0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0x6d6d6d, transparent: true, opacity: 0, depthWrite: false }));
    p.userData.k = i / 7;
    fishBowl.add(p);
    smoke.push(p);
  }
  stage.tick((dt, t) => {
    ENV.dirt += (ENV.want - ENV.dirt) * Math.min(1, dt * 2);
    bowlWM.color.setHex(0x5fb0e8).lerp(new THREE.Color(0x7a6a3a), ENV.dirt);
    bowlWM.opacity = 0.4 + ENV.dirt * 0.4;
    for (const p of smoke) {
      const f = (t * 0.12 + p.userData.k) % 1;
      p.position.set(Math.sin(p.userData.k * 9 + t * 0.3) * 0.5, 1.3 + f * 0.9, Math.cos(p.userData.k * 7) * 0.2);
      p.material.opacity = ENV.dirt * 0.55 * Math.sin(f * Math.PI);
    }
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    ctx.click = null;
    resetCup(); resetSol(); resetFilter();
    backItems(true);
    ENV.want = 0; ENV.dirt = 0;
    vessels.forEach((v) => setVessel(v, 0));
    view(ctx, [0, 0.8, 0], 6.6);
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p>Въздухът и водата са навсякъде около нас. Какви са те?</p>
        <p><b>Разгледай всичко</b> от менюто в ъгъла или с клик върху предмета.</p>`,
      items: [
        { id: 'cup', label: 'Празна чаша', icon: '🥛', note: 'Чашата изглежда празна. Но в нея има <b>въздух</b>. Въздухът е прозрачен газ. Няма цвят и мирис.', obj: () => cup, dist: 4, bubble: 1.2 },
        { id: 'tank', label: 'Вана с вода', icon: '💧', note: 'Водата е <b>прозрачна течност</b>. През нея виждаме камъчетата на дъното.', obj: () => tank, dist: 4.5 },
        { id: 'jug', label: 'Кана', icon: '🫗', note: 'Водата <b>тече</b>. Можем да я преливаме от съд в съд.', obj: () => jug, dist: 3.5 },
        { id: 'sugar', label: 'Захар и пясък', icon: '🧂', note: 'Ще ги сложим във вода. Ще видим кое се <b>разтваря</b>.', obj: () => dishes[0].g, dist: 3.4 },
        { id: 'candle', label: 'Свещ', icon: '🕯', note: 'Свещта гори, защото има въздух. <b>Въздухът поддържа горенето.</b> Водата не го поддържа — с нея гасим огън. <i>Огън се пали само с възрастен!</i>', obj: () => candle, dist: 3.2 },
        { id: 'fish', label: 'Рибки', icon: '🐟', note: 'Рибките живеят във вода и дишат въздуха, разтворен в нея. Без вода и въздух няма живот.', obj: () => fishBowl, dist: 3.4 },
        { id: 'plant', label: 'Растение', icon: '🪴', note: 'Растението пие вода с корените си. Листата му поемат въздух. Хората и животните също имат нужда от вода и въздух.', obj: () => plant, dist: 3.4 },
        { id: 'filter', label: 'Филтър', icon: '🧪', note: 'Филтърът има пластове: чакъл, пясък и памук. Те задържат калта от водата.', obj: () => filt, dist: 4, bubble: 2.4 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Въздухът заема място ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    resetCup();
    backItems(false);
    view(ctx, [TX, 0.9, 0], 1.6, { halfH: 1.4, elev: 0.42 });
    shell.task('<p>На дъното на чашата има суха червена кърпичка. Ще натиснем обърнатата чаша право надолу във водата.</p>');
    choice(ctx, {
      q: 'Ще се намокри ли кърпичката?',
      options: [
        { t: 'Не, ще остане суха.', ok: true, why: 'Да проверим! Плъзни лентата, за да натиснеш чашата.' },
        { t: 'Да, водата ще влезе в чашата.', ok: false, why: 'Чашата само изглежда празна. Какво има в нея?' },
        { t: 'Чашата ще се напълни догоре с вода.', ok: false, why: 'Помисли: има ли нещо в „празната“ чаша?' },
      ],
      hint: 'В чашата има въздух.',
      onRight: (m) => press(m),
    });
  }
  function press(m0) {
    let mistakes = m0;
    shell.task('<p><b>Плъзни лентата</b>, за да натиснеш чашата във водата. Гледай кърпичката.</p>');
    const c = shell.setControls(`<label class="row">⬆ <input type="range" class="press" min="0" max="100" value="0" style="flex:1"> ⬇</label>
      <div class="row"><button class="btn tilt" disabled>Наклони чашата</button></div>`);
    const tilt = c.querySelector('.tilt');
    let said = false;
    c.querySelector('.press').addEventListener('input', (e) => {
      S.pressT = +e.target.value / 100;
      if (S.pressT > 0.85 && !said) {
        said = true;
        tilt.disabled = false;
        ctx.say(cup, 'Кърпичката е <b>суха</b>! Въздухът в чашата не пуска водата. Виж: водата във ваната се покачи — въздухът я избута.', 'good wide', CH + 0.6);
        shell.msg('Въздухът заема място. Натисни „Наклони чашата“.', 'good');
      }
    });
    tilt.addEventListener('click', () => {
      tilt.disabled = true;
      S.pressT = 1;
      S.tilting = true;
      ctx.say(cup, 'Излизат мехурчета! Водата влиза на тяхно място. Кърпичката се намокри.', 'wide', CH + 0.6);
      setTimeout(() => {
        shell.setControls('');
        choice(ctx, {
          q: 'Какво излезе от чашата на мехурчета?',
          options: [
            { t: 'Въздух', ok: true, why: 'Вярно! Въздухът е газ. Не го виждаме, но той заема място.' },
            { t: 'Вода', ok: false, why: 'Водата влезе в чашата. Какво беше в нея преди това?' },
            { t: 'Нищо, чашата беше празна', ok: false, why: 'Ако беше празна, кърпичката щеше да се намокри веднага.' },
          ],
          hint: 'Мехурчетата са от невидим газ около нас.',
          mistakes,
          onRight: (m) => { mistakes = m; dropSoil(); },
        });
      }, 3800);
    });
    function dropSoil() {
      shell.task('<p>Пусни <b>бучка суха пръст</b> във водата. Какво ще излезе от нея?</p>');
      const b = nextBtn(ctx, 'Пусни бучката', () => {
        b.disabled = true;
        S.soilT = 0; S.soilY = 1.3;
        ctx.say(soil, 'От пръстта излизат мехурчета. Въздух има и в почвата. <b>Въздухът прониква навсякъде.</b>', 'good wide', 0.8);
        setTimeout(() => {
          ctx.scores[0] = stepScore(mistakes, 3);
          nextBtn(ctx, 'Напред →', step3);
        }, 1500);
      });
    }
  }

  // ---------- 3. Водата тече и разтваря ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    view(ctx, [-1.0, 0.75, 0.35], 1.95, { halfH: 1.1, elev: 0.4 });
    let mistakes = 0;
    const filled = new Set();
    shell.task('<p>В каната има вода. <b>Кликни всеки съд</b>, за да налееш в него еднакво количество вода.</p>');
    shell.setControls('');
    shell.score('Напълнени: 0 от 3');
    ctx.click = (id) => {
      const v = vessels.find((x) => x.V.id === id);
      if (!v || pour || filled.has(id)) return;
      v.filling = true;
      pour = {
        v, t: 0,
        done: () => {
          filled.add(id);
          shell.score(`Напълнени: ${filled.size} от 3`);
          ctx.say(v.g, `Водата прие формата на съда: ${v.V.id === 'v-tall' ? 'висока и тясна' : v.V.id === 'v-bowl' ? 'ниска и широка' : 'квадратна'}.`, 'tag', v.V.h + 0.4);
          if (filled.size === 3) askShape();
        },
      };
    };
    function askShape() {
      ctx.click = null;
      shell.score('');
      choice(ctx, {
        q: 'Водата е еднакво много. Защо изглежда различно?',
        options: [
          { t: 'Водата тече и приема формата на съда.', ok: true, why: 'Вярно! Водата е течност. Тя няма собствена форма.' },
          { t: 'В купата водата е по-малко.', ok: false, why: 'Наляхме еднакво много вода. Сравни формата на съдовете.' },
          { t: 'Водата има собствена форма.', ok: false, why: 'Ако имаше собствена форма, щеше да е еднаква във всеки съд.' },
        ],
        hint: 'Водата е течност.',
        onRight: (m) => { mistakes = m; dissolve(); },
      });
    }
    function dissolve() {
      ctx.clearTip();
      view(ctx, [2.3, 0.7, 0.8], 1.6, { halfH: 1.1, elev: 0.45 });
      shell.task('<p>Кликни <b>захарта</b> и <b>пясъка</b>, за да ги сипеш във водата. После ги разбъркай.</p>');
      const c = shell.setControls('<div class="row"><button class="btn stir" disabled>Разбъркай</button></div>');
      const stir = c.querySelector('.stir');
      ctx.click = (id) => {
        const s = sol.find((x) => x.G.subst === id && x.state === 'none');
        if (!s) return;
        s.state = 'in'; s.y = 1.2; s.stuff.visible = true;
        if (sol.every((x) => x.state !== 'none')) stir.disabled = false;
      };
      stir.addEventListener('click', () => {
        stir.disabled = true;
        ctx.click = null;
        sol.forEach((s) => { s.stir = 3; });
        setTimeout(askDissolve, 4600);
      });
    }
    function askDissolve() {
      shell.setControls('');
      shell.task('<p><b>Кликни чашата</b>, в която веществото се разтвори във водата.</p>');
      ctx.click = (id) => {
        const s = sol.find((x) => x.G.id === id);
        if (!s) return;
        if (s.G.subst === 'sugar') {
          ctx.click = null;
          ctx.say(s.g, '✔ Захарта се <b>разтвори</b>. Не я виждаме, но водата стана сладка.', 'good wide', 1.5);
          shell.msg('Вярно! Водата разтваря захарта. Пясъкът не се разтваря — той падна на дъното.', 'good');
          ctx.scores[1] = stepScore(mistakes, 3);
          nextBtn(ctx, 'Напред →', step4);
        } else {
          mistakes++;
          ctx.say(s.g, '✘ Пясъкът се вижда на дъното. Той не изчезна.', 'bad', 1.5);
          shell.msg(`Не е тази.${mistakes >= 2 ? ' Подсказка: търси чашата, в която веществото вече не се вижда.' : ''}`, 'bad');
        }
      };
    }
  }

  // ---------- 4. Пази водата и въздуха ----------
  const ACTS = [
    { t: '🌳 Засаждаме дървета', good: true, why: 'Дърветата пречистват въздуха.' },
    { t: '🗑 Хвърляме боклук в реката', good: false, why: 'Боклукът замърсява водата. Рибите страдат.' },
    { t: '🚲 Ходим пеша или с колело', good: true, why: 'Така от колите излиза по-малко дим.' },
    { t: '🔥 Палим стари гуми', good: false, why: 'Горящите гуми пускат черен отровен дим.' },
    { t: '🚰 Спираме чешмата, докато мием зъби', good: true, why: 'Пестим чистата вода.' },
    { t: '🛢 Изливаме олио в мивката', good: false, why: 'Олиото замърсява водата и запушва тръбите.' },
  ];
  function step4() {
    shell.step(3);
    ctx.clearTip();
    resetFilter();
    backItems(false);
    view(ctx, [FX - 0.6, 1.15, 0.4], 1.6, { halfH: 1.75, elev: 0.22 });
    shell.task('<p>Водата в буркана е мътна от кал. Ще я налеем във филтъра.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще стане с водата, като мине през филтъра?',
      options: [
        { t: 'Ще стане по-бистра, но пак не е за пиене.', ok: true, why: 'Да видим! Натисни „Налей“.' },
        { t: 'Ще стане чиста и можем да я пием.', ok: false, why: 'Филтърът задържа калта. Но спира ли микробите, които не виждаме?' },
        { t: 'Няма да се промени.', ok: false, why: 'Пясъкът и памукът задържат ли нещо от калта?' },
      ],
      hint: 'Филтърът задържа калта, но не и микробите.',
      onRight: (m) => {
        mistakes = m;
        const b = nextBtn(ctx, 'Налей', () => {
          b.disabled = true;
          F.pouring = true; F.t = 0;
          F.done = () => {
            ctx.say(filt, 'Водата е по-бистра. Калта остана в пясъка. Но тази вода <b>не е за пиене</b>: в нея може да има микроби. Пием само чиста вода от чешмата или от бутилка.', 'wide', 2.1);
            nextBtn(ctx, 'Напред →', sortActs);
          };
        });
      },
    });
    function sortActs() {
      ctx.clearTip();
      backItems(true);
      candle.visible = false;
      ENV.want = 0.85;
      view(ctx, [0.2, 1.1, -1.6], 1.9, { halfH: 1.3, elev: 0.55 });
      const list = shuffle(ACTS);
      let i = 0; let clean = 15;
      const meter = stage.bubble(new V3(0.2, 2.75, -1.6), '', { cls: 'tag', lift: 0 });
      const show = () => {
        meter.set(`Чистота ${bar(clean, '#2e9d5b')}`);
        if (i >= list.length) {
          meter.remove();
          ctx.say(fishBowl, 'Водата е бистра, а въздухът — чист. Рибките и растенията са добре.', 'good wide', 1.6);
          shell.task('<p>Чистата вода и чистият въздух пазят живота на Земята.</p>');
          shell.msg('Браво! Знаеш как да пазиш водата и въздуха.', 'good');
          ctx.scores[2] = stepScore(mistakes, 3);
          shell.setControls('');
          finishBtn(ctx, onComplete, restart);
          return;
        }
        const a = list[i];
        shell.task(`<p>Това <b>опазва</b> ли водата и въздуха, или ги <b>замърсява</b>?</p><p style="font-size:1.15rem"><b>${esc(a.t)}</b></p><p class="small">${i + 1} от ${list.length}</p>`);
        const c = shell.setControls('<div class="row"><button class="btn act" data-g="1">💚 Опазва</button><button class="btn act" data-g="0">⚠ Замърсява</button></div>');
        c.querySelectorAll('.act').forEach((b) => b.addEventListener('click', () => {
          const yes = b.dataset.g === '1';
          if (yes === a.good) {
            shell.msg(`Вярно! ${a.why}`, 'good');
            clean = Math.min(100, clean + 85 / list.length);
            ENV.want = Math.max(0, 0.85 * (1 - (i + 1) / list.length));
            i++;
            show();
          } else {
            mistakes++;
            ENV.want = Math.min(1, ENV.want + 0.1);
            shell.msg(`Помисли пак. ${a.good ? 'Това помага ли на природата?' : 'Какво става с реката или с въздуха след това?'}${mistakes >= 2 ? ' Подсказка: ' + a.why : ''}`, 'bad');
            b.disabled = true;
          }
        }));
      };
      show();
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    pour = null;
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
