// 6.2.4 „Кислород и водород“ — уред за електролиза на вода, колба с водороден пероксид, епруветка с цинк и
// солна киселина, два балона и табло с модели на реакции.
// Стъпки: опознай → електролиза на водата (разлагане) → получаване и свойства → съединяване или разлагане.
import { labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { MOL, tagOver, testTube, TEACHER, NOT_SCALE } from './chem6.js';

const V3 = THREE.Vector3;

function bubbleField(parent, n, area, color = 0xffffff) {
  const list = [];
  const m = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.8, roughness: 0.1 });
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.025 + (i % 3) * 0.01, 8, 6), m);
    b.userData = { k: Math.random(), x: (Math.random() - 0.5) * area.w, z: (Math.random() - 0.5) * area.d };
    b.visible = false;
    parent.add(b);
    list.push(b);
  }
  return {
    list,
    tick(t, on, y0, y1, speed = 0.6) {
      for (const b of list) {
        b.visible = on;
        if (!on) continue;
        const f = (t * speed + b.userData.k) % 1;
        b.position.set(b.userData.x, y0 + f * (y1 - y0), b.userData.z);
      }
    },
  };
}

function balloonModel(color) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), mat(color, { roughness: 0.3 }));
  b.scale.set(1, 1.2, 1);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.7, 4), mat(0x424242));
  s.position.y = -0.7;
  g.add(b, s);
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Електролиза на водата', 'Получаване и свойства', 'Съединяване или разлагане'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 1, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 15, d: 4.8 });

  // ---------- Уред за електролиза ----------
  const el = new THREE.Group();
  const vessel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.7), glass(0.25));
  vessel.position.y = 0.3;
  const water = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.5, 0.65), new THREE.MeshStandardMaterial({ color: 0x90caf9, transparent: true, opacity: 0.45, depthWrite: false }));
  water.position.y = 0.26;
  el.add(vessel, water);
  const TUBE_H = 1.8;
  const tubes = [-0.4, 0.4].map((x, i) => {
    const g = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, TUBE_H, 18, 1, true), glass(0.3));
    wall.position.y = TUBE_H / 2;
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), glass(0.3));
    top.position.y = TUBE_H;
    const wM = new THREE.MeshStandardMaterial({ color: 0x90caf9, transparent: true, opacity: 0.5, depthWrite: false });
    const wcol = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1, 16), wM);
    const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1, 16), new THREE.MeshStandardMaterial({ color: i ? 0xffcdd2 : 0xe3f2fd, transparent: true, opacity: 0.35, depthWrite: false }));
    const elec = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), mat(0x546e7a, { metalness: 0.6 }));
    elec.position.y = 0.15;
    for (let k = 1; k < 8; k++) { const tick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.01), mat(0x37474f)); tick.position.set(0.11, 0.2 + k * 0.2, 0.06); g.add(tick); }
    g.add(wall, top, wcol, gas, elec);
    g.position.set(x, 0.08, 0);
    el.add(g);
    const lab = labelSprite(i ? 'анод (+)' : 'катод (−)', { size: 0.13 });
    lab.position.set(x, -0.05, 0.45); lab.raycast = () => {};
    el.add(lab);
    return { g, wcol, gas, v: 0, x };
  });
  const bat = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.3), mat(0x263238)); b.position.y = 0.175; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), mat(0xe53935)); p.position.set(0.15, 0.39, 0); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), mat(0x1e88e5)); n.position.set(-0.15, 0.39, 0); bat.add(b, p, n); }
  bat.position.set(0, 0, 0.75);
  el.add(bat);
  const bubbleH = bubbleField(tubes[0].g, 14, { w: 0.15, d: 0.15 });
  const bubbleO = bubbleField(tubes[1].g, 7, { w: 0.15, d: 0.15 });
  const splint = new THREE.Group();
  { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), mat(0xc49a54)); s.rotation.z = 0.9; const ember = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5722 })); ember.position.set(-0.28, -0.2, 0); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc107, transparent: true, opacity: 0.9 })); fl.scale.set(1, 1.8, 1); fl.position.set(-0.28, -0.12, 0); splint.add(s, ember, fl); splint.userData = { ember, fl }; }
  splint.visible = false;
  el.add(splint);
  const pop = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff59d, transparent: true, opacity: 0 }));
  el.add(pop);
  el.position.set(-4.3, 0, 0.1);
  el.userData.pickId = 'electro';
  addHitBox(el, 1);
  tagOver(stage, el, 'Електролиза на вода', 2.3);
  scene.add(el);
  const EL = { on: false, t: 0, splint: null, splT: 0, popT: 0 };
  const volInfo = stage.bubble(new V3(-4.3, 2.15, 0.1), '', { cls: 'tag', lift: 0 });
  volInfo.el.style.visibility = 'hidden';

  // ---------- Модели на реакцията (разлагане / съединяване) ----------
  const rx = new THREE.Group();
  rx.position.set(-2.3, 1.5, 0.4);
  rx.scale.setScalar(0.7);
  scene.add(rx);
  function playReaction(left, right, text) {
    rx.clear();
    const L = new THREE.Group(); const R = new THREE.Group(); rx.add(L, R);
    left.forEach((f, i) => { const m = MOL[f](); m.position.set((i - (left.length - 1) / 2) * 1.0, 0, 0); L.add(m); });
    right.forEach((f, i) => { const m = MOL[f](); m.userData.x = (i - (right.length - 1) / 2) * 1.35; m.visible = false; R.add(m); });
    const lab = labelSprite(text, { size: 0.22 }); lab.position.y = 0.75; lab.raycast = () => {}; rx.add(lab);
    rx.userData.anim = { t: 0, L, R };
  }
  stage.tick((dt) => {
    const A = rx.userData.anim;
    if (!A) return;
    A.t += dt;
    const k = Math.min(1, A.t / 1.5);
    A.L.children.forEach((m) => { m.position.x *= 1 - dt * 1.5; m.visible = A.t < 1.6; m.rotation.y += dt * 3; });
    A.R.children.forEach((m) => { m.visible = A.t >= 1.6; m.position.x = m.userData.x * Math.min(1, Math.max(0.1, (A.t - 1.6) * 1.5 + 0.1)); m.rotation.y += dt; });
    void k;
  });

  // ---------- Колба с водороден пероксид и епруветка с цинк ----------
  const flask = new THREE.Group();
  { const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 14), glass(0.3)); body.position.y = 0.35; const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 14, 1, true), glass(0.3)); neck.position.y = 0.85; const liq = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe1f5fe, transparent: true, opacity: 0.6 })); liq.position.y = 0.35; const mno2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 12), mat(0x3e2723)); mno2.position.y = 0.06; flask.add(body, neck, liq, mno2); }
  flask.position.set(1.4, 0, -0.4);
  flask.userData.pickId = 'h2o2';
  addHitBox(flask, 0.7);
  tagOver(stage, flask, 'Водороден пероксид + катализатор', 1.3, 0.16);
  scene.add(flask);
  const fb = bubbleField(flask, 16, { w: 0.4, d: 0.4 });
  const zn = testTube(1.0, 0.13);
  zn.userData.fill(0.4, 0xe0f7fa);
  for (let i = 0; i < 4; i++) { const g = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05, 0), mat(0x9e9e9e, { metalness: 0.6, flat: true })); g.position.set((i % 2) * 0.06 - 0.03, 0.12, (i > 1 ? 0.03 : -0.03)); zn.add(g); }
  zn.position.set(2.5, 0, -0.4);
  zn.userData.pickId = 'zn';
  addHitBox(zn, 0.6);
  tagOver(stage, zn, 'Цинк + солна киселина', 1.55, 0.16);
  scene.add(zn);
  const zb = bubbleField(zn, 10, { w: 0.12, d: 0.12 });
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.4), mat(0x8d6e63));
  rack.position.set(2.5, 0.3, -0.4);
  scene.add(rack);

  // ---------- Два балона ----------
  const balls = [{ id: 'b-H', color: 0x81d4fa, name: 'Водород' }, { id: 'b-O', color: 0xef9a9a, name: 'Кислород' }].map((B, i) => {
    const g = balloonModel(B.color);
    g.position.set(4.3 + i * 0.9, 1.3, 0.3);
    const weight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.15), mat(0x616161));
    weight.position.set(4.3 + i * 0.9, 0.05, 0.3);
    scene.add(weight);
    g.userData.pickId = 'balloons';
    tagOver(stage, g, B.name, 0.6, 0.17);
    scene.add(g);
    return { g, weight, y: 1.3, free: false, up: i === 0 };
  });
  const goggles = new THREE.Group();
  { for (const s of [1, -1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), mat(0x26a69a)); l.position.x = s * 0.15; goggles.add(l); const gl = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), glass(0.4)); gl.position.x = s * 0.15; goggles.add(gl); } goggles.rotation.x = -1.2; goggles.position.set(6.1, 0.06, 0.9); }
  goggles.userData.pickId = 'goggles';
  addHitBox(goggles, 0.5);
  tagOver(stage, goggles, 'Предпазни очила', 0.3, 0.15);
  scene.add(goggles);

  const P = { h2o2: false, zn: false };
  stage.tick((dt, t) => {
    // електролиза: водородът се събира два пъти по-бързо от кислорода
    if (EL.on) EL.t = Math.min(1, EL.t + dt * 0.25);
    tubes.forEach((T, i) => {
      const gasH = (i === 0 ? 1.2 : 0.6) * EL.t;
      const wH = TUBE_H - 0.08 - gasH;
      T.wcol.scale.y = Math.max(0.01, wH); T.wcol.position.y = wH / 2;
      T.gas.scale.y = Math.max(0.001, gasH); T.gas.position.y = wH + gasH / 2; T.gas.visible = gasH > 0.01;
    });
    bubbleH.tick(t, EL.on && EL.t < 1, 0.3, TUBE_H - 1.2 * EL.t, 0.8);
    bubbleO.tick(t, EL.on && EL.t < 1, 0.3, TUBE_H - 0.6 * EL.t, 0.6);
    if (EL.on || EL.t > 0) { volInfo.el.style.visibility = ''; volInfo.set(`водород: ${(12 * EL.t).toFixed(0)} мл · кислород: ${(6 * EL.t).toFixed(0)} мл`); }
    // трескичка
    if (EL.splint) {
      EL.splT += dt;
      splint.visible = EL.splT < 3;
      const T = EL.splint === 'O' ? tubes[1] : tubes[0];
      splint.position.set(T.x + 0.3, TUBE_H + 0.3, 0);
      splint.userData.fl.visible = EL.splint === 'O' ? EL.splT > 0.6 : true;
      splint.userData.fl.scale.set(1, (EL.splint === 'O' ? 2.6 : 1.8) + Math.sin(t * 15) * 0.2, 1);
      if (EL.splint === 'H' && EL.splT > 0.7 && EL.popT === 0) EL.popT = 0.01;
    }
    if (EL.popT > 0) { EL.popT += dt; pop.position.set(tubes[0].x, TUBE_H + 0.15, 0); pop.scale.setScalar(1 + EL.popT * 3); pop.material.opacity = Math.max(0, 0.8 - EL.popT * 2); }
    fb.tick(t, P.h2o2, 0.1, 0.65, 0.7);
    zb.tick(t, P.zn, 0.15, 0.5, 0.9);
    balls.forEach((B) => {
      if (B.free) B.y += ((B.up ? 3.4 : 0.35) - B.y) * Math.min(1, dt * 0.8);
      B.g.position.y = B.y + Math.sin(t * 1.5 + (B.up ? 0 : 2)) * 0.03;
    });
  });

  function resetAll() {
    EL.on = false; EL.t = 0; EL.splint = null; EL.splT = 0; EL.popT = 0; splint.visible = false; pop.material.opacity = 0;
    volInfo.el.style.visibility = 'hidden';
    rx.clear(); rx.userData.anim = null;
    P.h2o2 = false; P.zn = false;
    balls.forEach((B) => { B.free = false; B.y = 1.3; });
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    resetAll();
    view(ctx, [0.6, 1.0, 0], 6.6, { halfH: 2.0 });
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p>Кислородът и водородът са газове без цвят и мирис. Как ги получаваме и разпознаваме?</p>${TEACHER}<p><b>Разгледай всичко</b> от менюто или с клик.</p>`,
      items: [
        { id: 'electro', label: 'Електролиза', icon: '⚡', note: 'Две тръби над електроди във вода. Когато тече ток, водата се разлага на два газа.', obj: () => el, dist: 3.6, lift: 0.8, bubble: 1.9 },
        { id: 'h2o2', label: 'Водороден пероксид', icon: '⚗', note: '<b>Кислородна вода</b> (водороден пероксид). С катализатор (тъмният прах) бързо отделя <b>кислород</b>.', obj: () => flask, dist: 2.6 },
        { id: 'zn', label: 'Цинк и солна киселина', icon: '🧪', note: 'При взаимодействие на метал (цинк) с киселина се отделя <b>водород</b>.', obj: () => zn, dist: 2.6 },
        { id: 'balloons', label: 'Балони', icon: '🎈', note: 'Единият балон е пълен с водород, другият — с кислород. Те са вързани за тежести.', obj: () => balls[0].g, dist: 3.4 },
        { id: 'goggles', label: 'Очила', icon: '🥽', note: 'При химичен опит се носят очила и ръкавици, работи се далеч от огън и само с учител.', obj: () => goggles, dist: 2.2 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Електролиза на водата ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    resetAll();
    view(ctx, [-3.2, 1.1, 0.1], 2.4, { halfH: 1.4, elev: 0.2 });
    shell.task(`<p>Учителят пуска ток през вода. Във всяка тръба се събира газ: водород и кислород.</p>${TEACHER}`);
    choice(ctx, {
      q: 'Колко ще бъде водородът в сравнение с кислорода?',
      options: [
        { t: 'Два пъти повече от кислорода.', ok: true, why: 'Да проверим! Включи тока.' },
        { t: 'Еднакво.', ok: false, why: 'Формулата на водата е H₂O. Колко атома водород има на един атом кислород?' },
        { t: 'Два пъти по-малко.', ok: false, why: 'Виж формулата H₂O: кой елемент е повече?' },
      ],
      hint: 'H₂O — два атома водород на един атом кислород.',
      onRight: (m) => run(m),
    });
  }
  function run(m0) {
    let mistakes = m0;
    const c = shell.setControls('<div class="row"><button class="btn primary on">⚡ Включи тока</button></div>');
    c.querySelector('.on').addEventListener('click', (e) => {
      e.target.disabled = true;
      EL.on = true;
      const wait = setInterval(() => {
        if (EL.t < 0.98) return;
        clearInterval(wait);
        EL.on = false;
        ctx.say(tubes[0].g, 'Водородът е два пъти повече.', 'tag', 2.0);
        shell.msg('');
        shell.task(`<p>Да разпознаем газовете с трескичка.</p>${TEACHER}`);
        const cc = shell.setControls('<div class="row"><button class="btn sO">Тлееща трескичка при кислорода</button><button class="btn sH">Запалена трескичка при водорода</button></div>');
        const seen = new Set();
        const tried = () => {
          if (seen.size < 2) return;
          setTimeout(() => {
            ctx.clearTip();
            playReaction(['H2O', 'H2O'], ['H2', 'H2', 'O2'], '2H₂O → 2H₂ + O₂');
            choice(ctx, {
              q: 'От едно вещество (вода) се получиха две нови вещества. Каква е тази реакция?',
              options: [
                { t: 'Химично разлагане', ok: true, why: 'Вярно! При разлагане от едно сложно вещество се получават две или повече вещества.' },
                { t: 'Химично съединяване', ok: false, why: 'При съединяване от няколко вещества се получава едно. Тук е обратното.' },
                { t: 'Не е химична реакция', ok: false, why: 'Получиха се нови вещества — значи е химична реакция.' },
              ],
              hint: 'Едно вещество → няколко.',
              mistakes,
              onRight: (m) => { mistakes = m; ctx.scores[0] = stepScore(mistakes, 3); nextBtn(ctx, 'Напред →', step3); },
            });
          }, 3200);
        };
        cc.querySelector('.sO').addEventListener('click', (ev) => { ev.target.disabled = true; EL.splint = 'O'; EL.splT = 0; seen.add('O'); ctx.say(tubes[1].g, 'Трескичката <b>пламна</b> — това е кислород. Кислородът поддържа горенето.', 'wide', 2.3); tried(); });
        cc.querySelector('.sH').addEventListener('click', (ev) => { ev.target.disabled = true; EL.splint = 'H'; EL.splT = 0; EL.popT = 0; seen.add('H'); ctx.say(tubes[0].g, 'Чу се <b>„пук“</b> — водородът изгоря с кислорода от въздуха. Смес от водород и въздух е взривоопасна!', 'wide', 2.3); tried(); });
      }, 200);
    });
  }

  // ---------- 3. Получаване и свойства ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    rx.clear(); rx.userData.anim = null;
    view(ctx, [3.3, 1.1, 0], 2.7, { halfH: 1.5, elev: 0.25 });
    let mistakes = 0;
    shell.task('<p>Отвързваме двата балона от тежестите.</p>');
    choice(ctx, {
      q: 'Какво ще стане?',
      options: [
        { t: 'Балонът с водород ще излети нагоре, а този с кислород ще падне.', ok: true, why: 'Да видим! Натисни „Пусни балоните“.' },
        { t: 'И двата ще излетят.', ok: false, why: 'Кислородът малко по-тежък ли е от въздуха или по-лек?' },
        { t: 'И двата ще паднат.', ok: false, why: 'Водородът е най-лекият газ. Какво става с балон, пълен с него?' },
      ],
      hint: 'Водородът е най-лекият газ.',
      onRight: (m) => {
        mistakes = m;
        const b = nextBtn(ctx, '🎈 Пусни балоните', () => {
          b.disabled = true;
          balls.forEach((B) => { B.free = true; });
          P.h2o2 = true; P.zn = true;
          setTimeout(() => {
            ctx.say(balls[0].g, 'Водородът е <b>най-лекият газ</b>. Кислородът е малко по-тежък от въздуха.', 'wide', 0.6);
            shell.msg('');
            shell.task('<p>В колбата и в епруветката се отделят газове. Кой газ се получава?</p>');
            sortTask(ctx, {
              bins: ['Кислород', 'Водород'],
              items: [
                { t: 'Водороден пероксид (кислородна вода) с катализатор', bin: 0, why: 'Водородният пероксид се разлага до вода и кислород.' },
                { t: 'Нагряване на калиев перманганат', bin: 0, why: 'При нагряване калиевият перманганат отделя кислород.' },
                { t: 'От въздуха (в промишлеността)', bin: 0, why: 'Във въздуха има около 21% кислород; в заводи го отделят от него.' },
                { t: 'Цинк + солна киселина', bin: 1, why: 'Метал + киселина → водород.' },
                { t: 'Желязо + разредена солна киселина', bin: 1, why: 'И желязото с киселина отделя водород.' },
              ],
              hint: 'Метал + киселина дава водород.',
              mistakes,
              onDone: (mm) => { ctx.scores[1] = stepScore(mm, 3); nextBtn(ctx, 'Напред →', step4); },
            });
          }, 2200);
        });
      },
    });
  }

  // ---------- 4. Съединяване или разлагане ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    P.h2o2 = false; P.zn = false;
    shell.msg('');
    view(ctx, [-2.3, 1.5, 0.4], 1.3, { halfH: 0.9, elev: 0.2 });
    playReaction(['H2', 'H2', 'O2'], ['H2O', 'H2O'], '2H₂ + O₂ → 2H₂O');
    shell.task(`<p>Водородът гори с кислорода и се получава вода. ${NOT_SCALE}</p>`);
    sortTask(ctx, {
      bins: ['Съединяване', 'Разлагане'],
      items: [
        { t: 'водород + кислород → вода', bin: 0, why: 'От две вещества — едно: съединяване.' },
        { t: 'въглерод + кислород → въглероден диоксид', bin: 0, why: 'Съединяване: при горенето на въглен.' },
        { t: 'желязо + кислород → железен оксид', bin: 0, why: 'Съединяване.' },
        { t: 'вода → водород + кислород', bin: 1, why: 'От едно вещество — две: разлагане.' },
        { t: 'водороден пероксид → вода + кислород', bin: 1, why: 'Разлагане.' },
      ],
      hint: 'Колко вещества има преди и колко след стрелката?',
      onDone: (m) => {
        choice(ctx, {
          q: 'Защо опитите с водород прави само учител?',
          options: [
            { t: 'Смес от водород и въздух избухва при запалване.', ok: true, why: 'Вярно! Затова се работи с малки количества, далеч от огън, с очила.' },
            { t: 'Водородът е отровен и мирише силно.', ok: false, why: 'Водородът няма мирис. Какво чу при запалването му?' },
            { t: 'Водородът е тежък и пада на пода.', ok: false, why: 'Той е най-лекият газ. Опасността е друга.' },
          ],
          hint: 'Спомни си „пук“.',
          mistakes: m,
          onRight: (mm) => { ctx.scores[2] = stepScore(mm, 3); finishBtn(ctx, onComplete, restart); },
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
  return { dispose() { volInfo.remove(); stage.dispose(); } };
}
