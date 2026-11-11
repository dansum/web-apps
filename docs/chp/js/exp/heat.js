// 5.1.4 „Преходи между състоянията; топлопроводност и конвекция“ — пръчки с восък в гореща вода,
// чаша със стърготини над спиртна лампа, стая с радиатор и рафт с примери за преходите.
// Стъпки: опознай → кой прът провежда топлината (опит) → конвекция в чаша и в стая → преходите около нас.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, stepScore } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';

const SAFE = '<p class="warn">⚠ Гореща вода и спиртна лампа — <b>само с възрастен</b>.</p>';
// Пръчките: скорост, с която топлината се разпространява (опростено, по реда на топлопроводността).
const RODS = [
  { id: 'cu', name: 'мед', color: 0xc8743a, metal: 0.6, k: 0.78 },
  { id: 'al', name: 'алуминий', color: 0xc9ccd1, metal: 0.6, k: 0.66 },
  { id: 'fe', name: 'стомана', color: 0x7d8590, metal: 0.6, k: 0.33 },
  { id: 'wood', name: 'дърво', color: 0xa9773f, metal: 0, k: 0.035 },
];
const TANK_X = -5.0; const ROD_L = 3.4; const ROD_Y = 0.85;
const PIN_D = [0.6, 1.25, 1.9, 2.55];
const BK = { x: 1.3, r: 0.62, h: 1.25, y: 0.62 }; // чашата със стърготините (дъното е на y = BK.y)
const RM = { x: 4.9, w: 2.6, h: 2.0, d: 1.6 };    // стаята-макет

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Кой прът провежда топлината?', 'Конвекция', 'Преходите около нас'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10.5], target: [0, 0.8, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14.5, d: 4.8 });

  // ---------- Пръчки в съд с гореща вода ----------
  const rodsG = new THREE.Group();
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 2.6), glass(0.3));
  tank.position.set(TANK_X, 0.55, 0);
  const water = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1, 2.54), new THREE.MeshStandardMaterial({ color: 0x64b5f6, transparent: true, opacity: 0.55 }));
  water.position.set(TANK_X, 0.02, 0);
  water.scale.y = 0.02;
  rodsG.add(tank, water);
  const steam = [];
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
    s.userData.k = i / 8; s.userData.z = (i % 4 - 1.5) * 0.55;
    rodsG.add(s); steam.push(s);
  }
  const rods = RODS.map((R, i) => {
    const z = -0.95 + i * 0.63;
    const g = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, ROD_L, 14), mat(R.color, { metalness: R.metal, roughness: R.metal ? 0.35 : 0.85 }));
    rod.rotation.z = Math.PI / 2;
    rod.position.x = ROD_L / 2;
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 1, 14), new THREE.MeshBasicMaterial({ color: 0xff5722, transparent: true, opacity: 0.45, depthWrite: false }));
    glow.rotation.z = Math.PI / 2;
    g.add(rod, glow);
    const pins = PIN_D.map((d) => {
      const p = new THREE.Group();
      const wax = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0xfff3c4));
      wax.scale.set(1, 0.8, 1);
      wax.position.y = -0.06;
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.025, 12), mat(0xd32f2f, { metalness: 0.3 }));
      head.position.y = -0.13;
      const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 5), mat(0x9e9e9e, { metalness: 0.8 }));
      needle.position.y = -0.07;
      p.add(needle, head);
      p.position.x = d;
      g.add(p, wax);
      wax.position.x = d;
      return { p, wax, d, fall: 0, vy: 0, down: false };
    });
    // стойка в края
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, ROD_Y, 0.08), mat(0x5d4037));
    post.position.set(ROD_L - 0.2, -ROD_Y / 2, 0);
    g.add(post);
    const tag = labelSprite(R.name, { size: 0.2 });
    tag.position.set(ROD_L + 0.45, 0.05, 0);
    g.add(tag);
    stage.steadyLabel(tag, 7);
    g.userData.tag = tag;
    g.position.set(TANK_X + 0.1, ROD_Y, z);
    const tagAt = new THREE.Object3D(); tagAt.position.set(ROD_L + 0.45, 0.1, 0); g.add(tagAt);
    rodsG.add(g);
    return { ...R, g, glow, pins, tagAt, tag, front: 0 };
  });
  rodsG.userData.pickId = 'rods';
  scene.add(rodsG);
  const rodsAt = new THREE.Object3D(); rodsAt.position.set(TANK_X + 1.8, ROD_Y, 0); scene.add(rodsAt);
  const H = { on: false, t: 0, run: false, level: 0.02 };
  function resetRods() {
    H.on = false; H.t = 0; H.run = false; H.level = 0.02;
    for (const r of rods) {
      r.front = 0; r.tag.visible = true;
      for (const p of r.pins) { p.fall = 0; p.vy = 0; p.down = false; p.p.position.y = 0; p.wax.visible = true; p.wax.scale.set(1, 0.8, 1); }
    }
  }
  const fallen = (r) => r.pins.filter((p) => p.down).length;

  // ---------- Чаша със стърготини над спиртна лампа ----------
  const bk = new THREE.Group();
  const bkSide = new THREE.Mesh(new THREE.CylinderGeometry(BK.r, BK.r, BK.h, 32, 1, true), glass(0.25));
  bkSide.position.y = BK.h / 2;
  const bkBottom = new THREE.Mesh(new THREE.CircleGeometry(BK.r, 32), glass(0.35));
  bkBottom.rotation.x = -Math.PI / 2; bkBottom.position.y = 0.01;
  const bkWater = new THREE.Mesh(new THREE.CylinderGeometry(BK.r - 0.02, BK.r - 0.02, BK.h * 0.85, 32), new THREE.MeshStandardMaterial({ color: 0x90caf9, transparent: true, opacity: 0.22, depthWrite: false }));
  bkWater.position.y = BK.h * 0.425;
  bk.add(bkSide, bkBottom, bkWater);
  // триножник и мрежа
  const tri = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, BK.y, 6), mat(0x37474f, { metalness: 0.6 }));
    leg.position.set(Math.cos(a) * 0.62, BK.y / 2, Math.sin(a) * 0.62);
    tri.add(leg);
  }
  const gauze = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 1.5), mat(0x78909c, { metalness: 0.5 }));
  gauze.position.y = BK.y - 0.01;
  tri.add(gauze);
  bk.position.y = BK.y;
  const bkG = new THREE.Group();
  bkG.add(tri, bk);
  bkG.position.set(BK.x, 0, 0);
  bkG.userData.pickId = 'beaker';
  scene.add(bkG);
  addHitBox(bkG, 0.8);
  const grains = [];
  const gMat = mat(0x8d5a2b);
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.025, 0.035), gMat);
    m.userData.p = new THREE.Vector3((Math.random() * 2 - 1) * 0.5, Math.random() * 0.15 + 0.03, (Math.random() * 2 - 1) * 0.35);
    bk.add(m); grains.push(m);
  }
  const lamp = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshStandardMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.55 }));
    body.scale.y = 0.7; body.position.y = 0.14;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), mat(0x9e9e9e));
    cap.position.y = 0.3;
    lamp.add(body, cap);
  }
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.85 }));
  flame.scale.set(1, 2.4, 1); flame.position.y = 0.48; flame.visible = false;
  lamp.add(flame);
  lamp.userData.pickId = 'lamp';
  bkG.add(lamp);
  const LP = { pos: -1, x: -0.4 }; // -1 ляво, 0 среда, 1 дясно
  const placeLamp = (p) => { LP.pos = p; lamp.position.set(p * 0.42, 0, 0); };
  placeLamp(-1);

  // ---------- Стая-макет с радиатор ----------
  const room = new THREE.Group();
  {
    const wallM = mat(0xfff3e0, { side: THREE.DoubleSide });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(RM.w, RM.h), wallM); back.position.set(0, RM.h / 2, -RM.d / 2);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(RM.d, RM.h), wallM); left.rotation.y = Math.PI / 2; left.position.set(-RM.w / 2, RM.h / 2, 0);
    const right = left.clone(); right.position.x = RM.w / 2;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(RM.w, 0.06, RM.d), mat(0xa1887f)); floor.position.y = 0.03;
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(RM.w, 0.05, RM.d), mat(0xeeeeee)); ceil.position.y = RM.h;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshStandardMaterial({ color: 0xb3e5fc, emissive: 0x4fc3f7, emissiveIntensity: 0.2 }));
    win.position.set(-0.55, 1.1, -RM.d / 2 + 0.01);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.04), mat(0xffffff)); frame.position.set(-0.55, 1.1, -RM.d / 2 + 0.03);
    room.add(back, left, right, floor, ceil, win, frame);
  }
  const radiator = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.4, 0.12), mat(0xf5f5f5, { roughness: 0.4 }));
    fin.position.x = (i - 3) * 0.1;
    radiator.add(fin);
  }
  const radGlow = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.13), new THREE.MeshBasicMaterial({ color: 0xff7043, transparent: true, opacity: 0.18 }));
  radiator.add(radGlow);
  room.add(radiator);
  const SPOTS = { low: [-0.55, 0.32, -RM.d / 2 + 0.12], high: [-0.55, 1.72, -RM.d / 2 + 0.12] };
  const spots = {};
  for (const k of ['low', 'high']) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.44, 0.08), new THREE.MeshBasicMaterial({ color: 0x26a69a, transparent: true, opacity: 0.35 }));
    s.position.set(...SPOTS[k]);
    s.userData.pickId = 'spot-' + k;
    s.visible = false;
    room.add(s); spots[k] = s;
  }
  const airDots = [];
  const airM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), airM.clone());
    m.userData.p = new THREE.Vector2(Math.random() * RM.w - RM.w / 2, Math.random() * RM.h);
    m.position.z = (Math.random() - 0.5) * RM.d * 0.6;
    room.add(m); airDots.push(m);
  }
  const RS = { at: 'low', on: false };
  const thFloor = new THREE.Object3D(); thFloor.position.set(0.75, 0.25, 0.3);
  const thCeil = new THREE.Object3D(); thCeil.position.set(0.75, 1.75, 0.3);
  room.add(thFloor, thCeil);
  room.position.set(RM.x, 0, -0.3);
  room.userData.pickId = 'room';
  scene.add(room);
  const placeRad = (k) => { RS.at = k; radiator.position.set(SPOTS[k][0], SPOTS[k][1], SPOTS[k][2] + 0.04); };
  placeRad('low');
  let roomTags = [];
  const clearRoomTags = () => { roomTags.forEach((b) => b.remove()); roomTags = []; };

  // ---------- Рафт с примери за преходите ----------
  const shelf = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.08, 0.7), mat(0x8d6e63));
  board.position.y = 1.55;
  shelf.add(board);
  for (const sx of [-2.5, 2.5]) {
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.5), mat(0x6d4c41));
    br.position.set(sx, 1.38, -0.1); shelf.add(br);
  }
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.04, 24), mat(0xffffff));
  plate.position.set(-2, 1.61, 0);
  const ice = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshStandardMaterial({ color: 0xd6f0ff, transparent: true, opacity: 0.8, roughness: 0.1 }));
  ice.position.set(-2, 1.74, 0);
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshStandardMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.7 }));
  puddle.rotation.x = -Math.PI / 2; puddle.position.set(-2, 1.635, 0);
  const iceG = new THREE.Group(); iceG.add(plate, ice, puddle);
  const bottle = new THREE.Group();
  {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 18), new THREE.MeshStandardMaterial({ color: 0x81c784, transparent: true, opacity: 0.75, roughness: 0.1 }));
    b.position.y = 1.84;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.18, 14), b.material);
    neck.position.y = 2.18;
    bottle.add(b, neck);
    for (let i = 0; i < 26; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), new THREE.MeshStandardMaterial({ color: 0xe1f5fe, roughness: 0.05 }));
      const a = Math.random() * Math.PI * 2;
      d.position.set(Math.cos(a) * 0.135, 1.62 + Math.random() * 0.44, Math.sin(a) * 0.135);
      bottle.add(d);
    }
    bottle.position.x = -0.7;
  }
  const cloth = new THREE.Group();
  {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.9, 5), mat(0x5d4037));
    rope.rotation.z = Math.PI / 2; rope.position.y = 2.15;
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.45), mat(0x42a5f5, { side: THREE.DoubleSide }));
    c.position.y = 1.9;
    cloth.add(rope, c);
    for (const sx of [-0.45, 0.45]) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 5), mat(0x5d4037));
      st.position.set(sx, 1.88, 0); cloth.add(st);
    }
    cloth.position.x = 0.6;
    cloth.userData.c = c;
  }
  const vapor = [];
  for (let i = 0; i < 5; i++) {
    const v = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
    v.userData.k = i / 5; cloth.add(v); vapor.push(v);
  }
  const candle = new THREE.Group();
  {
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.05, 18), mat(0xb0bec5, { metalness: 0.5 }));
    holder.position.y = 1.62;
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 14), mat(0xfff8e1));
    w.position.y = 1.85;
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xfff8e1));
    drip.scale.set(1.6, 0.5, 1.2); drip.position.set(0.1, 1.655, 0.02);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc94a }));
    fl.scale.set(1, 2, 1); fl.position.y = 2.13;
    candle.add(holder, w, drip, fl);
    candle.position.x = 1.9;
    candle.userData.fl = fl;
  }
  shelf.add(iceG, bottle, cloth, candle);
  shelf.position.set(-1.3, 0, -1.9);
  shelf.userData.pickId = 'shelf';
  scene.add(shelf);
  const shelfAt = new THREE.Object3D(); shelfAt.position.set(-1.3, 1.85, -1.9); scene.add(shelfAt);
  const S = { melt: 0 };

  // ---------- Живот на сцената ----------
  stage.tick((dt, t) => {
    // гореща вода и пръчки
    water.scale.y += ((H.on ? 0.75 : 0.02) - water.scale.y) * Math.min(1, dt * 2);
    water.position.y = water.scale.y / 2 + 0.03;
    for (const s of steam) {
      const k = (s.userData.k + t * 0.25) % 1;
      s.position.set(TANK_X + Math.sin(t + s.userData.z * 3) * 0.12, 0.85 + k * 1.1, s.userData.z);
      s.material.opacity = H.on ? 0.18 * (1 - k) : 0;
      s.scale.setScalar(0.6 + k);
    }
    if (H.run) H.t += dt * 5;
    for (const r of rods) {
      r.front = r.k * Math.sqrt(H.t);
      const f = Math.min(ROD_L, r.front);
      r.glow.visible = f > 0.02;
      r.glow.scale.y = Math.max(0.001, f);
      r.glow.position.x = f / 2;
      for (const p of r.pins) {
        if (!p.down && r.front > p.d) { p.down = true; p.vy = 0; }
        if (p.down && p.fall < 1) {
          p.vy += dt * 9; p.p.position.y = Math.max(-(ROD_Y - 0.15), p.p.position.y - p.vy * dt);
          p.wax.scale.y = Math.max(0.15, p.wax.scale.y - dt);
          if (p.p.position.y <= -(ROD_Y - 0.15)) p.fall = 1;
        }
      }
    }
    // конвекция в чашата
    flame.scale.y = 2.4 + Math.sin(t * 17) * 0.2;
    const W = BK.r * 0.92; const Hh = BK.h * 0.8;
    for (const g of grains) {
      const p = g.userData.p;
      if (flame.visible) {
        const xi = Math.min(1, Math.max(0, (p.x + W) / (2 * W))); const eta = Math.min(1, Math.max(0, p.y / Hh));
        let u; let v;
        if (LP.pos === 0) {
          // две клетки: нагоре в средата, надолу покрай стените
          const A = 0.12;
          u = A * Math.PI * Math.sin(2 * Math.PI * xi) * Math.cos(Math.PI * eta) / Hh;
          v = -A * Math.PI * Math.cos(2 * Math.PI * xi) * Math.sin(Math.PI * eta) / W;
        } else {
          // една клетка: нагоре над пламъка
          const A = LP.pos < 0 ? -0.16 : 0.16;
          u = A * Math.sin(Math.PI * xi) * Math.cos(Math.PI * eta) * Math.PI / Hh;
          v = -A * Math.cos(Math.PI * xi) * Math.sin(Math.PI * eta) * Math.PI / (2 * W);
        }
        p.x += (u + (Math.random() - 0.5) * 0.08) * dt;
        p.y += (v + (Math.random() - 0.5) * 0.08 + (p.y < 0.05 ? 0.1 : 0)) * dt;
      } else {
        p.y = Math.max(0.03, p.y - dt * 0.05);
        p.x += (Math.random() - 0.5) * 0.01 * dt;
      }
      p.x = Math.min(W * 0.9, Math.max(-W * 0.9, p.x)); p.y = Math.min(Hh * 0.93, Math.max(0.03, p.y));
      const zm = Math.sqrt(Math.max(0, (BK.r - 0.06) ** 2 - p.x * p.x));
      p.z = Math.min(zm, Math.max(-zm, p.z));
      g.position.copy(p);
      g.rotation.set(t + p.x * 9, t * 0.7 + p.y * 7, 0);
    }
    // конвекция в стаята
    for (const d of airDots) {
      const p = d.userData.p;
      if (RS.on) {
        if (RS.at === 'low') {
          // нагоре над радиатора, по тавана, надолу при отсрещната стена, по пода обратно
          const xi = (p.x + RM.w / 2) / RM.w; const eta = p.y / RM.h; const A = -0.3;
          p.x += A * Math.PI * Math.sin(Math.PI * xi) * Math.cos(Math.PI * eta) / RM.h * dt;
          p.y += -A * Math.PI * Math.cos(Math.PI * xi) * Math.sin(Math.PI * eta) / RM.w * dt;
        } else {
          // радиаторът е горе: топлият въздух остава под тавана, долу въздухът почти не се движи
          if (p.y > 1.3) { p.x += Math.sin(t * 0.8 + p.y * 3) * 0.25 * dt; p.y += (Math.random() - 0.5) * 0.2 * dt; }
          else { p.x += (Math.random() - 0.5) * 0.05 * dt; p.y += (Math.random() - 0.5) * 0.05 * dt; }
        }
      } else {
        p.x += Math.sin(t * 0.5 + p.y * 4) * 0.03 * dt; p.y += Math.cos(t * 0.4 + p.x * 4) * 0.03 * dt;
      }
      p.x = Math.min(RM.w / 2 - 0.05, Math.max(-RM.w / 2 + 0.05, p.x));
      p.y = Math.min(RM.h - 0.06, Math.max(0.08, p.y));
      d.position.x = p.x; d.position.y = p.y;
      // цвят по температура
      let warm = 0.3;
      if (RS.on) warm = RS.at === 'low' ? 0.45 + p.y / RM.h * 0.25 : Math.min(1, Math.max(0, (p.y - 0.9) / 0.9));
      d.material.color.setRGB(0.4 + warm * 0.6, 0.55 - warm * 0.2, 1 - warm * 0.75);
    }
    radGlow.material.opacity = RS.on ? 0.22 + Math.sin(t * 3) * 0.05 : 0.04;
    // рафт: ледът се топи, кърпата съхне, пламъкът трепти
    S.melt = Math.min(1, S.melt + dt * 0.01);
    ice.scale.setScalar(1 - S.melt * 0.4); ice.position.y = 1.74 - S.melt * 0.04;
    puddle.scale.setScalar(0.6 + S.melt * 0.5);
    candle.userData.fl.scale.y = 2 + Math.sin(t * 15) * 0.2;
    for (const v of vapor) {
      const k = (v.userData.k + t * 0.2) % 1;
      v.position.set(Math.sin(t + v.userData.k * 6) * 0.15, 1.9 + k * 0.6, 0.05);
      v.material.opacity = 0.3 * (1 - k);
    }
    cloth.userData.c.rotation.y = Math.sin(t * 1.3) * 0.15;
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip(); clearRoomTags();
    S.melt = 0; resetRods(); flame.visible = false; placeLamp(-1); RS.on = false; placeRad('low');
    spots.low.visible = spots.high.visible = false;
    view(ctx, [-0.2, 0.9, 0], 6.8, { halfH: 1.8 });
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p>Как топлината стига от горещото до студеното? И как водата сменя състоянието си?</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>${SAFE}`,
      items: [
        { id: 'rods', label: 'Пръчки и восък', icon: '🥢', note: 'Четири пръчки: от <b>мед</b>, <b>алуминий</b>, <b>стомана</b> и <b>дърво</b>. Единият им край ще е в гореща вода. Кабарчетата са залепени с восък: когато восъкът се стопи, кабарчето пада.', obj: () => rodsAt, dist: 4.5 },
        { id: 'beaker', label: 'Чаша със стърготини', icon: '🧪', note: 'Във водата има ситни дървени стърготини. По тях ще видим как се движи водата, когато я нагряваме отдолу.', obj: () => bkG, dist: 3.4, lift: 0.9, bubble: 1.4 },
        { id: 'lamp', label: 'Спиртна лампа', icon: '🔥', note: 'Спиртната лампа нагрява чашата. С огън работим <b>само с възрастен</b>, далеч от коса и хартия.', obj: () => lamp, dist: 2.8, lift: 0.3, bubble: 0.8 },
        { id: 'room', label: 'Стая с радиатор', icon: '🏠', note: 'Макет на стая. Радиаторът е под прозореца. Точките показват въздуха: синьо — студен, оранжево — топъл.', obj: () => room, dist: 4.2, lift: 1.0, bubble: 1.4 },
        { id: 'shelf', label: 'Рафт с примери', icon: '🧊', note: 'Лед на чинийка, студена бутилка, мокра кърпа и свещ. Във всеки от тях водата или восъкът сменят състоянието си.', obj: () => shelfAt, dist: 4.6, lift: 0, bubble: 0.7 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Топлопроводност ----------
  function step2() {
    shell.step(1);
    resetRods();
    view(ctx, [TANK_X + 2.1, 0.5, 0.2], 3.3, { halfH: 1.4, elev: 0.55 });
    shell.task(`<p>Единият край на всяка пръчка ще бъде в <b>гореща вода</b>. Топлината тръгва по пръчката. Където стигне, восъкът се топи и кабарчето пада.</p>${SAFE}`);
    let mistakes = 0;
    choice(ctx, {
      q: 'От коя пръчка първо ще падне кабарче?',
      options: [
        { t: 'От медната', ok: true, why: 'Да проверим! Налей горещата вода.' },
        { t: 'От дървената', ok: false, why: 'Дървената лъжица в горещата супа остава ли студена в края?' },
        { t: 'От всички едновременно', ok: false, why: 'Пръчките са от различни материали. Дали провеждат топлината еднакво?' },
      ],
      hint: 'Металите провеждат топлината по-добре от дървото.',
      onRight: (m) => { mistakes = m; pourBtn(); },
    });
    function pourBtn() {
      const c = shell.controls;
      c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary pour">♨ Налей гореща вода</button></div>');
      c.querySelector('.pour').addEventListener('click', () => {
        c.querySelector('.pour').disabled = true;
        H.on = true;
        setTimeout(() => { H.run = true; }, 700);
        rods.forEach((r) => { r.tag.visible = false; });
        const tags = rods.map((r) => stage.bubble(r.tagAt, '', { cls: 'tag', lift: 0.12 }));
        const stop = stage.tick(() => {
          rods.forEach((r, i) => {
            const n = fallen(r);
            tags[i].set(`${r.name}: ${n} от 4`);
          });
          if (H.t >= 62) {
            stop(); H.run = false;
            tags.forEach((b) => b.remove());
            rods.forEach((r) => { r.tag.visible = true; });
            ctx.say(rodsAt, 'Първо паднаха кабарчетата от медта, после от алуминия и най-накрая от стоманата. От дървото не падна нито едно.', 'good wide', 0.9);
            order();
          }
        });
      }, { once: true });
    }
    function order() {
      orderTask(ctx, {
        q: 'Подреди материалите от най-добрия към най-лошия проводник на топлина.',
        items: ['мед', 'алуминий', 'стомана', 'дърво'],
        hint: 'Колкото по-бързо падат кабарчетата, толкова по-добре пръчката провежда топлината.',
        mistakes,
        onDone: (m) => {
          ctx.clearTip();
          ctx.scores[0] = stepScore(m, 3);
          ctx.say(rodsAt, '<b>Добри проводници</b> на топлина са металите. <b>Лоши проводници</b> са дървото, пластмасата, вълната и въздухът. Затова дръжките на тиганите са от дърво или пластмаса.', 'wide', 0.9);
          nextBtn(ctx, 'Напред →', step3);
        },
      });
    }
  }

  // ---------- 3. Конвекция ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    flame.visible = false; placeLamp(-1);
    for (const g of grains) g.userData.p.set((Math.random() * 2 - 1) * 0.5, Math.random() * 0.12 + 0.03, (Math.random() * 2 - 1) * 0.35);
    view(ctx, [BK.x, 1.15, 0], 1.4, { halfH: 1.05, elev: 0.3 });
    shell.task(`<p>Стърготините лежат на дъното. Спиртната лампа е под <b>левия край</b> на чашата.</p>${SAFE}`);
    let mistakes = 0;
    choice(ctx, {
      q: 'Къде водата ще тръгне нагоре, когато запалим лампата?',
      options: [
        { t: 'Над пламъка', ok: true, why: 'Да проверим! Запали лампата и гледай стърготините.' },
        { t: 'В десния край, далеч от пламъка', ok: false, why: 'Коя вода става по-лека: топлата или студената?' },
        { t: 'Водата няма да се движи', ok: false, why: 'Нагрятата вода се разширява. Какво прави тогава?' },
      ],
      hint: 'Топлата вода е по-лека и се издига.',
      onRight: (m) => { mistakes = m; light(); },
    });
    function light() {
      const c = shell.controls;
      c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary fire">🔥 Запали лампата</button></div>');
      c.querySelector('.fire').addEventListener('click', () => {
        c.querySelector('.fire').disabled = true;
        flame.visible = true;
        setTimeout(() => {
          ctx.say(bkG, 'Над пламъка водата се затопля и <b>се издига</b>. Горе изстива и <b>слиза</b> от другата страна. Водата се движи в кръг и пренася топлината. Това е <b>конвекция</b>.', 'wide', 2.2);
          shell.task('<p>Сега <b>премести лампата в средата</b> и виж как се движат стърготините.</p>');
          const cc = shell.setControls('<div class="row"><button class="btn mid">⬌ Лампата в средата</button></div>');
          cc.querySelector('.mid').addEventListener('click', () => {
            cc.querySelector('.mid').disabled = true;
            placeLamp(0);
            ctx.say(bkG, 'Сега водата се издига в средата и слиза покрай двете стени.', 'wide', 2.2);
            setTimeout(() => nextBtn(ctx, 'Към стаята →', roomTask), 1500);
          }, { once: true });
        }, 3500);
      }, { once: true });
    }
    function roomTask() {
      ctx.clearTip();
      flame.visible = false;
      view(ctx, [RM.x, 1.0, -0.3], 1.7, { halfH: 1.3, elev: 0.2 });
      shell.task('<p>Конвекция има и във въздуха. Да опитаме радиатора на две места.</p><p><b>Кликни горе, под тавана</b> (зеленото място), за да преместиш радиатора там.</p>');
      shell.setControls('');
      spots.high.visible = true;
      ctx.click = (id) => {
        if (id === 'spot-high') {
          spots.high.visible = false;
          placeRad('high'); RS.on = true;
          ctx.click = null;
          temps();
          setTimeout(() => {
            shell.task('<p>Топлият въздух остана под тавана, а на пода е студено.</p><p>Сега <b>кликни долу, под прозореца</b>.</p>');
            spots.low.visible = true;
            ctx.click = (id2) => {
              if (id2 !== 'spot-low') return;
              spots.low.visible = false;
              placeRad('low');
              ctx.click = null;
              temps();
              setTimeout(ask, 2500);
            };
          }, 3000);
        }
      };
    }
    function temps() {
      clearRoomTags();
      const [f, c] = RS.at === 'low' ? ['≈ 20 °C', '≈ 23 °C'] : ['≈ 15 °C', '≈ 28 °C'];
      roomTags = [stage.bubble(thCeil, `🌡 горе ${c}`, { cls: 'tag', lift: 0 }), stage.bubble(thFloor, `🌡 долу ${f}`, { cls: 'tag', lift: 0 })];
    }
    function ask() {
      shell.task('<p>Радиаторът е долу. Топлият въздух се издига, а студеният слиза към радиатора. Цялата стая се затопля.</p><p class="small">Температурите са приблизителни.</p>');
      choice(ctx, {
        q: 'Защо радиаторите се поставят ниско, под прозореца?',
        options: [
          { t: 'Затопленият въздух се издига и раздвижва въздуха в цялата стая.', ok: true, why: 'Вярно! Това е конвекция във въздуха.' },
          { t: 'Топлият въздух слиза надолу към пода.', ok: false, why: 'Виж точките в стаята: накъде тръгва топлият въздух?' },
          { t: 'Защото така не се виждат.', ok: false, why: 'Важно е как се движи въздухът, а не как изглежда.' },
        ],
        hint: 'Топлият въздух е по-лек от студения.',
        mistakes,
        onRight: (m) => { ctx.scores[1] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step4); },
      });
    }
  }

  // ---------- 4. Преходите около нас ----------
  function step4() {
    shell.step(3);
    ctx.clearTip(); clearRoomTags(); RS.on = false;
    view(ctx, [-1.3, 1.85, -1.9], 3.2, { halfH: 0.9, elev: 0.25 });
    shell.task('<p>Около нас веществата постоянно сменят състоянието си. <b>Как се казва всеки преход?</b></p><p class="small">Топене: твърдо → течно. Втвърдяване: течно → твърдо. Изпаряване: течно → газ. Кондензация: газ → течно.</p>');
    const show = (o, txt) => () => ctx.say(o, txt, 'tag', 0.55);
    sortTask(ctx, {
      bins: ['Топене', 'Втвърдяване', 'Изпаряване', 'Кондензация'],
      items: [
        { t: 'Кубчето лед на чинийката става на вода.', bin: 0, show: show(ice, 'лед → вода'), why: 'Топене: от твърдо в течно състояние.' },
        { t: 'Студената бутилка от хладилника се покрива с капки.', bin: 3, show: show(bottle.children[0], 'капки по бутилката'), why: 'Кондензация: водната пара от въздуха се охлажда и става на капки.', no: 'Капките не идват отвътре. Откъде идва водата, която се събира по студената бутилка?' },
        { t: 'Мократа кърпа изсъхва.', bin: 2, show: show(cloth.userData.c, 'кърпата съхне'), why: 'Изпаряване: водата става на пара и отива във въздуха.' },
        { t: 'Разтопеният восък стича по свещта и отново става твърд.', bin: 1, show: show(candle.children[2], 'восъкът застива'), why: 'Втвърдяване: от течно в твърдо състояние.' },
        { t: 'Водата в локвата замръзва през нощта.', bin: 1, why: 'Втвърдяване: водата става на лед.' },
        { t: 'Сутрин по тревата има роса.', bin: 3, why: 'Кондензация: през нощта водната пара от въздуха се охлажда и става на капки.' },
      ],
      hint: 'Попитай се: от какво състояние в какво преминава веществото?',
      onDone: (m) => {
        ctx.clearTip();
        view(ctx, [-0.2, 0.9, 0], 6.8, { halfH: 1.8 });
        shell.task('<p>Пренеси към живота.</p>');
        choice(ctx, {
          q: 'Защо прозорците с два слоя стъкло пазят стаята топла през зимата?',
          options: [
            { t: 'Между стъклата има въздух, а въздухът е лош проводник на топлина.', ok: true, why: 'Вярно! Затова и вълнените дрехи топлят: между нишките има въздух.' },
            { t: 'Стъклото е добър проводник на топлина.', ok: false, why: 'Ако провежда добре, топлината ще излиза навън по-бързо, а не по-бавно.' },
            { t: 'Двете стъкла правят конвекция навън.', ok: false, why: 'Помисли какво има между стъклата и как то провежда топлина.' },
          ],
          hint: 'Спомни си дървената пръчка: лошите проводници задържат топлината.',
          mistakes: m,
          onRight: (m2) => {
            ctx.scores[2] = stepScore(m2, 3);
            ctx.say(shelfAt, 'Топлинните явления са навсякъде: изпаряването от моретата дава облаци и дъжд, конвекцията затопля стаите, а лошите проводници ни пазят от студ и от изгаряне.', 'wide', 0.4);
            finishBtn(ctx, onComplete, restart);
          },
        });
      },
    });
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
