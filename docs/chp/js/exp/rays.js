// 5.1.5 „Светлина: лъчи, сянка, отражение“ — затъмнена лаборатория: фенерче, куб и екран,
// фенерче с процеп, огледало на въртяща се поставка и мишени зад преграда, слънчев панел с перка.
// Стъпки: опознай → лъчите и сянката (опит) → отражение: насочи лъча с огледало → светлината пренася енергия.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, view, fmt, stepScore } from './labkit.js';

const Y = 1.0;            // височина на лъчите
const CUBE = { x: -1.8, h: 0.3 };
const XF = CUBE.x - CUBE.h; // предната стена на куба
const SCR = 1.0;          // екранът
const STAR = 0.7; const FRAME = 0.95;
// огледалото
const SL = { x: 1.6, z: 1.6 }; const MI = { x: 5.2, z: 1.6 };
const WALL = { x0: 1.2, x1: 3.9, z: 0.4 };
const TARGETS = [{ id: 't1', x: 5.2, z: -1.6, name: 'зелената' }, { id: 't2', x: 2.7, z: -1.4, name: 'синята' }];
const TR = 0.26;

const up = new THREE.Vector3(0, 1, 0);
function beam(color, r = 0.012, opacity = 0.9) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity }));
  m.userData.set = (a, b) => {
    const d = b.clone().sub(a); const L = d.length();
    m.visible = L > 0.001;
    m.scale.y = Math.max(0.001, L);
    m.position.copy(a).addScaledVector(d, 0.5);
    if (L > 0) m.quaternion.setFromUnitVectors(up, d.normalize());
  };
  return m;
}
// Сянката от точков източник: половин ширина на екрана.
const halfShadow = (L) => CUBE.h * (SCR - L) / (XF - L);

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Лъчи и сянка', 'Отражение', 'Светлината носи енергия'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0x1f2633, camPos: [0, 5, 10], target: [0, 0.9, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14.5, d: 5 });
  stage.hemi.intensity = 0.45; stage.sun.intensity = 0.55;
  scene.traverse((o) => { if (o.material && o.material.color && o.geometry && o.geometry.type === 'PlaneGeometry') o.material.color.multiplyScalar(0.55); });

  // ---------- Фенерче (стъпки 2 и 4) ----------
  function torch() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.55, 16), mat(0x37474f, { metalness: 0.5, roughness: 0.4 }));
    body.rotation.z = Math.PI / 2; body.position.x = -0.28;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.18, 18), mat(0x455a64, { metalness: 0.5 }));
    head.rotation.z = -Math.PI / 2; head.position.x = 0.07;
    const glassM = new THREE.MeshBasicMaterial({ color: 0x555555 });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.15, 18), glassM);
    lens.rotation.y = Math.PI / 2; lens.position.x = 0.165;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, Y, 8), mat(0x546e7a));
    stand.position.set(-0.2, -Y / 2, 0);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 16), mat(0x546e7a));
    foot.position.set(-0.2, -Y + 0.025, 0);
    g.add(body, head, lens, stand, foot);
    g.position.y = Y;
    g.userData.on = (on) => { glassM.color.set(on ? 0xfff59d : 0x555555); };
    return g;
  }
  const lamp = torch();
  lamp.userData.pickId = 'lamp';
  scene.add(lamp);
  addHitBox(lamp, 0.6);
  const lampLight = new THREE.PointLight(0xfff3c0, 0, 9, 1.5);
  scene.add(lampLight);

  // ---------- Куб и екран ----------
  const cube = new THREE.Group();
  {
    const c = new THREE.Mesh(new THREE.BoxGeometry(CUBE.h * 2, CUBE.h * 2, CUBE.h * 2), mat(0xe57373));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, Y - CUBE.h, 8), mat(0x78909c));
    post.position.y = -(Y - CUBE.h) / 2 - CUBE.h;
    cube.add(c, post);
  }
  cube.position.set(CUBE.x, Y, 0);
  cube.userData.pickId = 'cube';
  scene.add(cube);
  const screen = new THREE.Group();
  const scrMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e1, emissiveIntensity: 0 });
  {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.0, 4.2), scrMat);
    s.position.y = 1.0;
    screen.add(s);
  }
  // звезда и рамка, нарисувани върху екрана
  const starC = document.createElement('canvas'); starC.width = starC.height = 256;
  {
    const g = starC.getContext('2d');
    g.strokeStyle = '#f9a825'; g.lineWidth = 6;
    g.strokeRect(6, 6, 244, 244);
    g.fillStyle = '#fbc02d';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 40 : 94; const a = -Math.PI / 2 + i * Math.PI / 5;
      g.lineTo(128 + r * Math.cos(a) * 0.74 / 0.74 * (STAR / FRAME), 128 + r * Math.sin(a) * (STAR / FRAME));
    }
    g.closePath(); g.fill();
  }
  const starTex = new THREE.CanvasTexture(starC); starTex.colorSpace = THREE.SRGBColorSpace;
  const star = new THREE.Mesh(new THREE.PlaneGeometry(FRAME * 2, FRAME * 2), new THREE.MeshBasicMaterial({ map: starTex, transparent: true, depthWrite: false }));
  star.rotation.y = -Math.PI / 2; star.position.set(-0.03, Y, 0);
  star.visible = false;
  screen.add(star);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x263238, transparent: true, opacity: 0.88, depthWrite: false }));
  shadow.rotation.y = -Math.PI / 2; shadow.position.set(-0.04, Y, 0);
  shadow.visible = false;
  screen.add(shadow);
  screen.position.x = SCR + 0.03;
  screen.userData.pickId = 'screen';
  scene.add(screen);
  // ветрило от лъчи + двата гранични лъча
  const fan = [];
  for (let i = 0; i < 13; i++) { const b = beam(0xfff176, 0.01, 0.75); b.visible = false; scene.add(b); fan.push(b); }
  const edges = [beam(0xff7043, 0.016, 1), beam(0xff7043, 0.016, 1)];
  edges.forEach((b) => { b.visible = false; scene.add(b); });
  const L = { x: -5.6, on: false, rays: false };
  const shadowAt = new THREE.Object3D(); shadowAt.position.set(SCR, Y + 0.2, 0); scene.add(shadowAt);
  function layoutA() {
    lamp.position.set(L.x, Y, 0); lamp.rotation.y = 0;
    lamp.userData.on(L.on);
    lampLight.position.set(L.x + 0.3, Y, 0); lampLight.intensity = L.on ? 6 : 0;
    scrMat.emissiveIntensity = L.on ? 0.55 : 0;
    const hw = halfShadow(L.x);
    shadow.visible = L.on;
    shadow.scale.set(Math.min(hw * 2, 4.2), Math.min(hw * 2, 2 * Y), 1);
    const vis = L.on && L.rays;
    const src = new THREE.Vector3(L.x + 0.18, Y, 0);
    fan.forEach((b, i) => {
      b.visible = vis;
      if (!vis) return;
      const a = (-24 + i * 4) * Math.PI / 180;
      const dz = Math.tan(a);
      const zf = dz * (XF - src.x);
      const endX = Math.abs(zf) < CUBE.h ? XF : SCR;
      b.userData.set(src, new THREE.Vector3(endX, Y, dz * (endX - src.x)));
    });
    edges.forEach((b, k) => {
      b.visible = vis;
      if (!vis) return;
      const s = k ? 1 : -1;
      const dz = s * CUBE.h / (XF - src.x);
      b.userData.set(src, new THREE.Vector3(SCR, Y, dz * (SCR - src.x)));
    });
  }

  // ---------- Отражение: фенерче с процеп, преграда, огледало, мишени ----------
  const slit = torch();
  slit.position.set(SL.x, Y, SL.z);
  slit.userData.pickId = 'slit';
  {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.34), mat(0x212121));
    cap.position.x = 0.18; slit.add(cap);
  }
  scene.add(slit);
  addHitBox(slit, 0.6);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(WALL.x1 - WALL.x0, 1.7, 0.08), mat(0x8d6e63));
  wall.position.set((WALL.x0 + WALL.x1) / 2, 0.85, WALL.z);
  wall.userData.pickId = 'wall';
  scene.add(wall);
  const mirror = new THREE.Group();
  const mirrorTurn = new THREE.Group();
  {
    const glassM = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.03), new THREE.MeshStandardMaterial({ color: 0xe3f2fd, metalness: 0.95, roughness: 0.05, emissive: 0x90a4ae, emissiveIntensity: 0.25 }));
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.79, 0.64, 0.02), mat(0x5d4037));
    back.position.z = -0.025;
    mirrorTurn.add(glassM, back);
    mirrorTurn.position.y = Y;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, Y - 0.3, 8), mat(0x78909c));
    post.position.y = (Y - 0.3) / 2;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.06, 28), mat(0x455a64));
    disc.position.y = 0.03;
    // деления по края на диска
    for (let i = 0; i < 12; i++) {
      const tk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.02), mat(0xeceff1));
      const a = i * Math.PI / 6;
      tk.position.set(Math.cos(a) * 0.36, 0.065, Math.sin(a) * 0.36); tk.rotation.y = -a;
      disc.add(tk);
    }
    mirror.add(post, disc, mirrorTurn);
  }
  mirror.position.set(MI.x, 0, MI.z);
  mirror.userData.pickId = 'mirror';
  scene.add(mirror);
  addHitBox(mirror, 0.7);
  const targets = TARGETS.map((T, i) => {
    const g = new THREE.Group();
    const color = i ? 0x42a5f5 : 0x66bb6a;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(TR, 0.04, 10, 28), mat(color));
    const core = new THREE.Mesh(new THREE.CircleGeometry(TR, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 0.1, side: THREE.DoubleSide }));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, Y - TR, 8), mat(0x78909c));
    post.position.y = -(Y - TR) / 2 - TR;
    g.add(ring, core, post);
    g.position.set(T.x, Y, T.z);
    g.lookAt(MI.x, Y, MI.z);
    g.userData.pickId = T.id;
    g.userData.core = core;
    scene.add(g);
    return { ...T, g, core, color };
  });
  const rayIn = beam(0xff5252, 0.02, 1); const rayOut = beam(0xff5252, 0.02, 1);
  rayIn.visible = rayOut.visible = false;
  scene.add(rayIn, rayOut);
  const glowDot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff8a80 }));
  glowDot.visible = false; scene.add(glowDot);
  const R = { on: false, ang: 160, hit: null };
  const mirAt = new THREE.Object3D(); mirAt.position.set(MI.x, Y + 0.3, MI.z); scene.add(mirAt);
  const regionB = new THREE.Object3D(); regionB.position.set(3.6, Y, 0); scene.add(regionB);
  // Ъгълът на огледалото (в градуси спрямо оста x), при който лъчът стига до мишената.
  const angFor = (T) => {
    const rx = T.x - MI.x; const rz = T.z - MI.z; const l = Math.hypot(rx, rz);
    const nx = rx / l - 1; const nz = rz / l;
    let a = Math.atan2(nz, nx) * 180 / Math.PI + 90;
    a = ((a % 180) + 180) % 180;
    return Math.round(a);
  };
  function layoutB() {
    // плоскостта на огледалото е по посока ang (в равнината xz); three.js: rotation.y = −ang
    const a = R.ang * Math.PI / 180;
    mirrorTurn.rotation.y = -a;
    slit.userData.on(R.on);
    rayIn.visible = rayOut.visible = glowDot.visible = R.on;
    R.hit = null;
    targets.forEach((T) => { T.core.material.emissiveIntensity = 0.1; });
    if (!R.on) return;
    const s = new THREE.Vector3(SL.x + 0.19, Y, SL.z); const m = new THREE.Vector3(MI.x, Y, MI.z);
    rayIn.userData.set(s, m);
    // нормала към огледалото
    let nx = -Math.sin(a); let nz = Math.cos(a);
    const dx = 1; const dz = 0;
    let dn = dx * nx + dz * nz;
    if (Math.abs(dn) < 0.02) { rayOut.visible = false; glowDot.position.copy(m); return; }
    if (dn > 0) { nx = -nx; nz = -nz; dn = -dn; }
    const rx = dx - 2 * dn * nx; const rz = dz - 2 * dn * nz;
    // търсим първото препятствие по отразения лъч
    let tEnd = 9;
    if (Math.abs(rz) > 1e-6) {
      const tw = (WALL.z - MI.z) / rz; const xw = MI.x + rx * tw;
      if (tw > 0 && xw >= WALL.x0 && xw <= WALL.x1) tEnd = Math.min(tEnd, tw);
    }
    // ръбът на масата
    for (const [lim, v, p] of [[7.1, rx, MI.x], [-7.1, rx, MI.x], [2.45, rz, MI.z], [-2.45, rz, MI.z]]) {
      if (Math.abs(v) > 1e-6) { const tt = (lim - p) / v; if (tt > 0) tEnd = Math.min(tEnd, tt); }
    }
    for (const T of targets) {
      const px = T.x - MI.x; const pz = T.z - MI.z;
      const tt = px * rx + pz * rz;
      if (tt <= 0 || tt > tEnd) continue;
      const dist = Math.abs(px * rz - pz * rx);
      if (dist < TR) { tEnd = tt; R.hit = T.id; T.core.material.emissiveIntensity = 0.9; }
    }
    const e = new THREE.Vector3(MI.x + rx * tEnd, Y, MI.z + rz * tEnd);
    rayOut.userData.set(m, e);
    glowDot.position.copy(e);
  }

  // ---------- Слънчев панел с перка ----------
  const panel = new THREE.Group();
  {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 1.1), mat(0x1a237e, { metalness: 0.4, roughness: 0.3 }));
    for (let i = -1; i <= 1; i++) {
      const ln = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 1.1), mat(0x90a4ae)); ln.position.y = i * 0.2; p.add(ln);
      const lv = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.01), mat(0x90a4ae)); lv.position.z = i * 0.27; p.add(lv);
    }
    p.position.y = Y; p.rotation.z = 0.15;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, Y - 0.4, 8), mat(0x78909c));
    post.position.y = (Y - 0.4) / 2;
    panel.add(p, post);
  }
  const fanG = new THREE.Group();
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 12), mat(0x9e9e9e, { metalness: 0.6 }));
  motor.rotation.z = Math.PI / 2;
  const rotor = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.36, 0.09), mat(0xff7043));
    bl.position.y = 0.18; const h = new THREE.Group(); h.add(bl); h.rotation.x = i * Math.PI * 2 / 3; rotor.add(h);
  }
  rotor.position.x = -0.13;
  const fpost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, Y + 0.2, 8), mat(0x78909c));
  fpost.position.y = -(Y + 0.2) / 2;
  fanG.add(motor, rotor, fpost);
  fanG.position.set(0.6, Y + 0.2, 0.9);
  panel.add(fanG);
  const wire = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.012, 6, 20, Math.PI), mat(0xd32f2f));
  wire.position.set(0.3, 0.25, 0.45); wire.rotation.y = -Math.PI / 4;
  panel.add(wire);
  panel.position.set(0.0, 0, -1.6);
  panel.userData.pickId = 'panel';
  panel.visible = false;
  scene.add(panel);
  const E = { spin: 0, block: 0, blockT: 0 };
  const panelAt = new THREE.Object3D(); panelAt.position.set(0.0, Y + 0.4, -1.6); scene.add(panelAt);

  // ---------- Живот ----------
  stage.tick((dt, t) => {
    // прашинки във въздуха, видими в светлината
    for (const d of motes) {
      d.position.x += Math.sin(t * 0.3 + d.userData.k) * 0.002;
      d.position.y += Math.cos(t * 0.25 + d.userData.k * 2) * 0.0015;
    }
    // панелът и перката
    E.block += (E.blockT - E.block) * Math.min(1, dt * 2.5);
    if (panel.visible) {
      const lit = L.on ? Math.max(0, 1 - E.block) : 0;
      E.spin += (lit * 14 - E.spin) * Math.min(1, dt * 1.5);
      rotor.rotation.x += E.spin * dt;
    }
    mirrorTurn.children[0].material.emissiveIntensity = 0.2 + Math.sin(t * 2) * 0.05;
  });
  const motes = [];
  for (let i = 0; i < 40; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 3), new THREE.MeshBasicMaterial({ color: 0xfffde7, transparent: true, opacity: 0.6 }));
    d.position.set(-5 + Math.random() * 6, 0.4 + Math.random() * 1.4, -1.2 + Math.random() * 2.4);
    d.userData.k = Math.random() * 6;
    scene.add(d); motes.push(d);
  }

  function setupA() {
    panel.visible = false;
    cube.position.set(CUBE.x, Y, 0);
    lamp.rotation.y = 0;
    L.x = -5.6; L.on = false; L.rays = false; star.visible = false;
    layoutA();
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    setupA();
    R.on = false; R.ang = 160; layoutB();
    view(ctx, [0.2, 0.9, 0], 6.6, { halfH: 1.8 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Стаята е затъмнена. Тук ще изследваме <b>как се движи светлината</b>.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'lamp', label: 'Фенерче', icon: '🔦', note: 'Фенерчето е <b>източник на светлина</b>: то само излъчва светлина. Други източници са Слънцето, свещта и лампата.', obj: () => lamp, dist: 3 },
        { id: 'cube', label: 'Непрозрачен куб', icon: '🟥', note: 'Кубът е <b>непрозрачен</b>: светлината не минава през него. Виждаме го, защото той <b>отразява</b> част от светлината към очите ни.', obj: () => cube, dist: 3 },
        { id: 'screen', label: 'Бял екран', icon: '⬜', note: 'На белия екран ще видим светлото петно от фенерчето и <b>сянката</b> на куба.', obj: () => shadowAt, dist: 4, bubble: 1.2 },
        { id: 'mirror', label: 'Огледало', icon: '🪞', note: 'Огледалото е гладко. От него светлината се <b>отразява</b> и продължава в нова посока. Огледалото се върти на поставката си.', obj: () => mirAt, dist: 3.5 },
        { id: 'slit', label: 'Фенерче с процеп', icon: '🔦', note: 'Отпред има капаче с тесен процеп. Така фенерчето пуска само <b>тесен сноп светлина</b>, почти като един лъч.', obj: () => slit, dist: 3 },
        { id: 'wall', label: 'Преграда и мишени', icon: '🎯', note: 'Преградата закрива мишените. Фенерчето не може да ги освети направо. Дали ще помогне огледалото?', obj: () => regionB, dist: 5, bubble: 1.2 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Лъчи и сянка ----------
  function step2() {
    shell.step(1);
    setupA();
    view(ctx, [-2.2, 0.9, 0], 3.8, { halfH: 1.4, elev: 0.75 });
    shell.task('<p class="small"><b>🔁 Припомни от 4. клас</b></p><p>Фенерчето ще светне към куба. Зад куба е белият екран.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще се види на екрана точно зад куба?',
      options: [
        { t: 'Тъмно петно с формата на куба — сянка', ok: true, why: 'Да проверим! Включи фенерчето.' },
        { t: 'Светло петно с формата на куба', ok: false, why: 'Кубът е непрозрачен. Минава ли светлината през него?' },
        { t: 'Нищо особено: светлината ще заобиколи куба', ok: false, why: 'Може ли светлината да завие около куба? Как се движи тя?' },
      ],
      hint: 'Светлината се движи по права линия и не минава през непрозрачни тела.',
      onRight: (m) => { mistakes = m; turnOn(); },
    });
    function turnOn() {
      const c = shell.controls;
      c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary on">🔦 Включи фенерчето</button></div>');
      c.querySelector('.on').addEventListener('click', () => {
        L.on = true; layoutA();
        ctx.say(shadowAt, 'Зад куба има <b>сянка</b>: там светлината не стига.', 'wide', 0.9);
        const cc = shell.setControls('<div class="row"><button class="btn primary rays">✏ Начертай лъчите</button></div>');
        cc.querySelector('.rays').addEventListener('click', () => {
          L.rays = true; layoutA();
          ctx.say(lamp, 'Пътя на светлината чертаем с <b>лъчи</b>: прави линии със стрелка от източника. Лъчите, които удрят куба, спират. Двата <b>оранжеви</b> лъча минават покрай ръбовете на куба и очертават сянката.', 'wide', 0.6);
          setTimeout(fit, 1200);
        }, { once: true });
      }, { once: true });
    }
    function fit() {
      star.visible = true; layoutA();
      shell.msg('');
      ctx.answer = -4.0;
      shell.task(`<p class="small"><b>Ново:</b> от какво зависи размерът на сянката?</p><p>На екрана има <b>звезда в рамка</b>. Премести фенерчето така, че сянката на куба да <b>скрие цялата звезда</b>, но да <b>не излиза от рамката</b>.</p>
        <label class="small">Разстояние от фенерчето до куба: <b class="lv"></b>
        <input class="slider ls" type="range" min="-5.8" max="-2.6" step="0.1" value="${L.x}"></label>`);
      const sl = container.querySelector('.ls'); const lv = container.querySelector('.lv');
      const upd = () => { L.x = +sl.value; layoutA(); lv.textContent = `${fmt((XF - L.x) * 20, 0)} cm`; };
      sl.addEventListener('input', upd); upd();
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      c.querySelector('.chk').addEventListener('click', () => {
        const hw = halfShadow(L.x);
        if (hw >= STAR && hw <= FRAME) {
          c.querySelector('.chk').disabled = true; sl.disabled = true;
          ctx.answer = null;
          ctx.scores[0] = stepScore(mistakes, 3);
          ctx.say(shadowAt, '✔ Колкото по-близо е фенерчето до куба, толкова по-голяма е сянката: граничните лъчи се разтварят по-широко.', 'good wide', 0.9);
          nextBtn(ctx, 'Напред →', step3);
          return;
        }
        mistakes++;
        shell.msg(`${hw < STAR ? 'Сянката е малка: звездата още се вижда. Накъде да преместиш фенерчето?' : 'Сянката излиза от рамката. Накъде да преместиш фенерчето?'}${mistakes >= 2 ? ' Подсказка: виж как се разтварят оранжевите лъчи, когато местиш фенерчето.' : ''}`, 'bad');
      });
    }
  }

  // ---------- 3. Отражение ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    L.on = false; L.rays = false; star.visible = false; layoutA();
    R.on = true; R.ang = 160; layoutB();
    view(ctx, [3.6, 0.8, 0], 3.3, { halfH: 2.0, elev: 1.0 });
    let mistakes = 0;
    let ti = 0;
    ctx.say(mirAt, 'Лъчът пада върху огледалото и <b>се отразява</b> в нова посока.', 'wide', 0.4);
    function task() {
      const T = targets[ti];
      ctx.answer = angFor(T);
      shell.task(`<p>Мишените са зад преградата. <b>Завърти огледалото</b> така, че отразеният лъч да освети <b>${T.name} мишена</b>.</p>
        <label class="small">Завъртане на огледалото: <b class="av">${R.ang}°</b>
        <input class="slider ma" type="range" min="0" max="179" step="1" value="${R.ang}"></label>`);
      const sl = container.querySelector('.ma'); const av = container.querySelector('.av');
      sl.addEventListener('input', () => { R.ang = +sl.value; av.textContent = R.ang + '°'; layoutB(); });
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      c.querySelector('.chk').addEventListener('click', () => {
        if (R.hit === T.id) {
          c.querySelector('.chk').disabled = true; sl.disabled = true;
          ctx.say(T.g, `✔ ${T.name[0].toUpperCase() + T.name.slice(1)} мишена свети!`, 'good tag', 0.5);
          ti++;
          if (ti < targets.length) nextBtn(ctx, 'Следваща мишена →', task);
          else nextBtn(ctx, 'Напред →', ask);
          return;
        }
        mistakes++;
        shell.msg(`Лъчът не стига до ${T.name} мишена.${R.hit ? ' Освети друга мишена.' : ''}${mistakes >= 2 ? ' Подсказка: върти огледалото малко по малко и следи накъде отива червеният лъч.' : ''}`, 'bad');
      });
    }
    function ask() {
      ctx.answer = null;
      ctx.clearTip();
      shell.task('<p>Огледалото не свети само. То само сменя посоката на светлината.</p>');
      choice(ctx, {
        q: 'Кое тяло излъчва собствена светлина и кое само я отразява?',
        options: [
          { t: 'Фенерчето излъчва, а огледалото и кубът отразяват.', ok: true, why: 'Вярно! Ние виждаме куба, защото отразена светлина от него стига до очите ни.' },
          { t: 'Огледалото излъчва, а фенерчето отразява.', ok: false, why: 'Спомни си: светеше ли огледалото, преди да включим фенерчето?' },
          { t: 'Кубът излъчва собствена светлина.', ok: false, why: 'В тъмната стая кубът не се виждаше. Защо после го видяхме?' },
        ],
        hint: 'Източникът свети и в пълна тъмнина.',
        mistakes,
        onRight: (m) => { ctx.scores[1] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step4); },
      });
    }
    task();
  }

  // ---------- 4. Светлината носи енергия ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    R.on = false; layoutB();
    panel.visible = true;
    // фенерчето свети към панела, кубът стои встрани
    L.on = true; L.rays = false; star.visible = false;
    L.x = -3.2; layoutA();
    lamp.position.set(-3.2, Y, -1.6);
    lampLight.position.set(-2.9, Y, -1.6);
    shadow.visible = false;
    scrMat.emissiveIntensity = 0.15;
    cube.position.set(-1.6, Y, -0.4);
    E.blockT = 0; E.block = 0;
    view(ctx, [-1.1, 0.9, -1.3], 2.7, { halfH: 1.2, elev: 0.5 });
    ctx.say(panelAt, 'Светлината пада върху <b>слънчевия панел</b>. Той превръща енергията ѝ в електрическа и перката се върти.', 'wide', 0.5);
    shell.task('<p>Светлината <b>пренася енергия</b>: панелът задвижва перката.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще стане с перката, ако поставим куба между фенерчето и панела?',
      options: [
        { t: 'Ще спре: панелът ще е в сянка', ok: true, why: 'Да проверим! Ще преместим куба.' },
        { t: 'Ще се върти по-бързо', ok: false, why: 'Ще стига ли до панела повече светлина, когато кубът е отпред?' },
        { t: 'Нищо няма да се промени', ok: false, why: 'Светлината не минава през непрозрачния куб. Какво ще стигне до панела?' },
      ],
      hint: 'В сянката не стига светлина, значи не стига и енергия.',
      onRight: (m) => {
        mistakes = m;
        ctx.clearTip();
        const from = cube.position.clone(); const to = new THREE.Vector3(-1.6, Y, -1.6);
        let k = 0;
        const stop = stage.tick((dt) => {
          k = Math.min(1, k + dt * 0.8);
          cube.position.lerpVectors(from, to, k);
          if (k >= 1) {
            stop();
            E.blockT = 1;
            setTimeout(() => {
              ctx.say(panelAt, 'Панелът е в сянката на куба. Светлина не стига до него и перката спира.', 'good wide', 0.5);
              nextBtn(ctx, 'Още една задача →', transfer);
            }, 1800);
          }
        });
      },
    });
    function transfer() {
      ctx.clearTip();
      shell.task('<p>Пренеси към живота.</p>');
      choice(ctx, {
        q: 'Как да видиш какво има зад ъгъла, без да надничаш?',
        options: [
          { t: 'С огледало, поставено под подходящ ъгъл.', ok: true, why: 'Вярно! Така работят огледалата на кръстовищата и перископът. Перископът е тръба с две огледала. През него се вижда над препятствие.' },
          { t: 'С фенерче, което свети покрай ъгъла.', ok: false, why: 'Светлината на фенерчето отива по права линия. Как ще стигне до очите ти от зад ъгъла?' },
          { t: 'Не може: светлината не завива.', ok: false, why: 'Сама не завива, но спомни си мишените зад преградата.' },
        ],
        hint: 'Спомни си огледалото и мишените.',
        mistakes,
        onRight: (m) => { ctx.scores[2] = stepScore(m, 3); finishBtn(ctx, onComplete, restart); },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    ctx.answer = null;
    E.blockT = 0;
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
