// 3.2.3 „От какво се нуждаят растенията“ — стая с прозорец, шкаф, студен балкон и четири саксии с фасул.
// Стъпки: опознай → опит с четири саксии (вода, светлина, топлина) → помогни на растенията → предскажи.
import { labelSprite, mat, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, stepScore } from './labkit.js';
import { beanInPot, seg, lerp } from './nature3.js';

const V3 = THREE.Vector3;
const LETTERS = ['А', 'Б', 'В', 'Г'];

function canModel() {
  const g = new THREE.Group();
  const m = mat(0x26a69a, { roughness: 0.4, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.5, 18), m);
  body.position.y = 0.25;
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.75, 8), m);
  spout.position.set(0.45, 0.42, 0);
  spout.rotation.z = -1.0;
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.08, 10), m);
  rose.position.set(0.77, 0.62, 0);
  rose.rotation.z = -1.0;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 14, Math.PI), m);
  handle.position.set(-0.05, 0.5, 0);
  g.add(body, spout, rose, handle);
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Опит с четири саксии', 'Помогни на растенията', 'Предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xeef2f6, camPos: [0, 4.2, 10], target: [0, 0.8, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14, d: 4.8, color: 0xe8d3a9 });

  const tags = [];
  const tag = (obj, html, cls = 'tag', lift = 1.2) => { const b = stage.bubble(obj, html, { cls, lift }); tags.push(b); return b; };
  const clearTags = () => { while (tags.length) tags.pop().remove(); };
  const named = (g, text, y, size = 0.22) => {
    const l = labelSprite(text, { size });
    l.position.y = y;
    l.raycast = () => {};
    g.add(l);
    stage.steadyLabel(l, 8);
    return l;
  };

  // ---------- Прозорец със слънце ----------
  const win = new THREE.Group();
  {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ color: 0xbfe6ff }));
    const sunD = new THREE.Mesh(new THREE.CircleGeometry(0.35, 20), new THREE.MeshBasicMaterial({ color: 0xffe082 }));
    sunD.position.set(0.9, 0.5, 0.01);
    const frameM = mat(0xffffff);
    const parts = [[3.4, 0.12, 0, 1.1], [3.4, 0.12, 0, -1.1], [0.12, 2.3, -1.65, 0], [0.12, 2.3, 1.65, 0], [0.08, 2.2, 0, 0], [3.2, 0.08, 0, 0]];
    for (const [w, h, x, y] of parts) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameM); f.position.set(x, y, 0.03); win.add(f); }
    win.add(pane, sunD);
    win.position.set(0.3, 2.6, -3.95);
    win.userData.sun = sunD;
  }
  win.userData.pickId = 'window';
  scene.add(win);
  // слънчеви лъчи до масата
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 3.6, 4, 1, true), beamM);
  beam.rotation.y = Math.PI / 4;
  beam.position.set(0.3, 1.6, -2.6);
  beam.rotation.x = 0.45;
  scene.add(beam);
  const spotM = new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.35, depthWrite: false });
  const sunSpot = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.2), spotM);
  sunSpot.rotation.x = -Math.PI / 2;
  sunSpot.position.set(0.3, 0.005, -0.9);
  scene.add(sunSpot);
  stage.tick((dt, t) => { beamM.opacity = 0.14 + Math.sin(t * 0.8) * 0.03; win.userData.sun.scale.setScalar(1 + Math.sin(t * 2) * 0.04); });

  // ---------- Шкаф ----------
  const cab = new THREE.Group();
  {
    const wood = mat(0x8d6e63);
    const add = (w, h, d, x, y, z, m = wood) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); cab.add(b); };
    add(2.0, 0.08, 1.6, 0, 2.0, 0); add(2.0, 0.08, 1.6, 0, 0.04, 0);
    add(0.08, 2.0, 1.6, -1.0, 1.0, 0); add(0.08, 2.0, 1.6, 1.0, 1.0, 0);
    add(2.0, 2.0, 0.08, 0, 1.0, -0.8);
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ color: 0x1b1410 }));
    dark.position.set(0, 1.0, -0.75);
    cab.add(dark);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.06), mat(0xa1887f));
    door.position.set(-1.5, 1.0, 0.75);
    door.rotation.y = 0.0;
    cab.add(door);
  }
  cab.position.set(-3.9, 0, -0.6);
  const cabZone = zoneRing(0x37474f, 0.55);
  cabZone.position.set(0, 0.1, 0.1);
  cabZone.userData.pickId = 'zone-dark';
  cab.add(cabZone);
  named(cab, 'Тъмен шкаф', 2.4);
  cab.userData.pickId = 'cab';
  scene.add(cab);

  // ---------- Студен балкон (стъклена кутия със сняг) ----------
  const bal = new THREE.Group();
  {
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 1.6), glass(0.18));
    box.position.y = 1.0;
    box.raycast = () => {}; // стъклото не пречи да се кликне саксията вътре
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 1.6), mat(0xe3f2fd));
    floor.position.y = 0.03;
    bal.add(box, floor);
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0xffffff));
      s.scale.y = 0.4;
      s.position.set(-0.8 + (i % 4) * 0.5, 0.08, i < 4 ? -0.6 : 0.6);
      bal.add(s);
    }
  }
  const flakes = [];
  for (let i = 0; i < 40; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    f.position.set((Math.random() - 0.5) * 1.8, Math.random() * 1.9, (Math.random() - 0.5) * 1.4);
    bal.add(f);
    flakes.push(f);
  }
  bal.position.set(4.4, 0, -0.6);
  const balZone = zoneRing(0x42a5f5, 0.55);
  balZone.position.set(0, 0.07, 0.1);
  balZone.userData.pickId = 'zone-cold';
  bal.add(balZone);
  named(bal, 'Студен балкон: 2 °C', 2.35);
  bal.userData.pickId = 'balcony';
  scene.add(bal);
  stage.tick((dt) => { for (const f of flakes) { f.position.y -= dt * 0.35; if (f.position.y < 0.05) f.position.y = 1.95; } });
  const roomT = labelSprite('В стаята: 22 °C', { size: 0.2 });
  roomT.position.set(-1.9, 3.3, -3.9);
  stage.steadyLabel(roomT, 8);
  scene.add(roomT);

  // ---------- Лейка ----------
  const can = canModel();
  const CAN_HOME = new V3(-2.3, 0, 1.0);
  can.position.copy(CAN_HOME);
  can.userData.pickId = 'can';
  named(can, 'Лейка', 1.0);
  addHitBox(can, 0.8);
  scene.add(can);
  const drops = [];
  for (let i = 0; i < 8; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshStandardMaterial({ color: 0x4fa8e8, transparent: true, opacity: 0.85 }));
    d.visible = false;
    d.userData.k = i / 8;
    scene.add(d);
    drops.push(d);
  }
  let pour = null; // { pot, t, done }
  let canHeld = false;
  stage.tick((dt, t) => {
    if (!pour) {
      const home = canHeld ? CAN_HOME.clone().add(new V3(0, 0.5, 0)) : CAN_HOME;
      can.position.lerp(home, Math.min(1, dt * 4));
      can.rotation.z *= 1 - Math.min(1, dt * 4);
      drops.forEach((d) => { d.visible = false; });
      return;
    }
    pour.t += dt;
    const p = pour.pot.getWorldPosition(new V3());
    can.position.lerp(new V3(p.x - 0.85, 1.0, p.z), Math.min(1, dt * 5));
    can.rotation.z += ((pour.t > 0.5 ? -0.55 : 0) - can.rotation.z) * Math.min(1, dt * 5);
    const flowing = pour.t > 0.8 && pour.t < 2.2;
    drops.forEach((d) => {
      d.visible = flowing;
      const f = (t * 2 + d.userData.k) % 1;
      d.position.set(p.x - 0.05 + Math.sin(d.userData.k * 20) * 0.06, 1.25 - f * 0.75, p.z + Math.cos(d.userData.k * 20) * 0.06);
    });
    if (pour.t > 2.4) { const cb = pour.done; pour = null; cb && cb(); }
  });

  // ---------- Четирите саксии (стъпка 2) ----------
  const expG = new THREE.Group();
  scene.add(expG);
  const POTS = [
    { id: 'pot-a', kind: 'good', x: -1.4 },
    { id: 'pot-b', kind: 'dry', x: -0.2 },
    { id: 'pot-c', kind: 'dark', x: 1.0 },
    { id: 'pot-d', kind: 'cold', x: 2.2 },
  ];
  const pots = POTS.map((P, i) => {
    const g = beanInPot({ r: 0.3, h: 0.45 });
    g.userData.pickId = P.id;
    g.userData.P = P;
    g.userData.home = new V3(P.x, 0, -0.9);
    named(g, `Саксия ${LETTERS[i]}`, -0.22, 0.2).position.z = 0.55;
    addHitBox(g, 0.8);
    expG.add(g);
    return g;
  });
  const E = { water: new Set(), place: {}, day: 0 };
  function grow(g, kind, d) {
    const set = g.userData.set;
    if (kind === 'good') set({ h: lerp(0.15, 0.95, seg(d, 0, 14)), leaves: Math.round(lerp(2, 8, seg(d, 1, 14))), green: 1, dry: 0, wet: 1, lean: 0 });
    else if (kind === 'dry') set({ h: lerp(0.15, 0.4, seg(d, 0, 4)), leaves: d > 2 ? 4 : 2, green: 1, dry: seg(d, 4, 10), wet: 1 - seg(d, 0, 3), lean: seg(d, 6, 12) * 0.5 });
    else if (kind === 'dark') set({ h: lerp(0.15, 1.05, seg(d, 0, 12)), leaves: d > 6 ? 3 : 2, green: 1 - seg(d, 1, 9), dry: seg(d, 11, 14) * 0.3, wet: 1, lean: seg(d, 8, 14) * 0.3 });
    else set({ h: lerp(0.15, 0.2, seg(d, 0, 14)), leaves: 2, green: 0.85, dry: 0, wet: 1, lean: 0 });
  }
  function resetExp() {
    E.water.clear(); E.place = {}; E.day = 0;
    pots.forEach((g) => { g.position.copy(g.userData.home); g.userData.locked = false; delete g.userData.dragId; grow(g, 'good', 0); g.userData.set({ wet: 0.35 }); });
  }

  // ---------- Три болни растения (стъпка 3) ----------
  const helpG = new THREE.Group();
  scene.add(helpG);
  const SICK = [
    { id: 'sick-dry', need: 'water', x: -1.6, z: 0.6, name: '1', fix: 'Растението пи вода и се изправи.' },
    { id: 'sick-dark', need: 'light', x: -0.2, z: 1.2, name: '2', fix: 'На светло листата отново позеленяват.' },
    { id: 'sick-oil', need: 'air', x: 1.4, z: 0.6, name: '3', fix: 'Чистите листа отново поемат въздух.' },
  ];
  const sick = SICK.map((S) => {
    const g = beanInPot({ r: 0.32, h: 0.48 });
    g.position.set(S.x, 0, S.z);
    g.userData.pickId = S.id;
    g.userData.S = S;
    named(g, `Растение ${S.name}`, -0.22, 0.2).position.z = 0.6;
    addHitBox(g, 0.8);
    helpG.add(g);
    const oil = [];
    if (S.need === 'air') {
      for (let i = 0; i < 14; i++) {
        const o = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0x8d7a2e, { roughness: 0.1, metalness: 0.4 }));
        o.scale.y = 0.4;
        o.position.set(Math.cos(i * 2.3) * 0.22, 0.6 + (i % 5) * 0.12, Math.sin(i * 2.3) * 0.22);
        g.add(o);
        oil.push(o);
      }
    }
    return { S, g, oil, fixed: false, k: 0 };
  });
  // Кутия-сянка над второто растение (стои в тъмен ъгъл).
  const shade = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 1.0), new THREE.MeshStandardMaterial({ color: 0x3e2723, transparent: true, opacity: 0.55, depthWrite: false }));
  shade.position.set(SICK[1].x, 0.7, SICK[1].z);
  helpG.add(shade);
  function sickState(s, k) {
    s.k = k;
    const set = s.g.userData.set;
    if (s.S.need === 'water') set({ h: 0.7, leaves: 6, green: 1, dry: 1 - k, wet: k, lean: 0.45 * (1 - k) });
    else if (s.S.need === 'light') set({ h: 0.85, leaves: 4, green: k, dry: 0, wet: 1, lean: 0 });
    else { set({ h: 0.7, leaves: 6, green: 0.55 + 0.45 * k, dry: 0.35 * (1 - k), wet: 1, lean: 0 }); s.oil.forEach((o) => { o.visible = k < 0.5; }); }
  }
  function resetHelp() { sick.forEach((s) => { s.fixed = false; sickState(s, 0); }); shade.visible = true; shade.material.opacity = 0.55; }
  stage.tick((dt) => {
    for (const s of sick) if (s.fixed && s.k < 1) sickState(s, Math.min(1, s.k + dt / 2));
    if (sick[1].fixed) shade.material.opacity = Math.max(0, shade.material.opacity - dt * 0.6), shade.visible = shade.material.opacity > 0.01;
  });

  // ---------- Растение на перваза (стъпка 4) ----------
  const turnG = new THREE.Group();
  scene.add(turnG);
  const tp = beanInPot({ r: 0.34, h: 0.5 });
  tp.position.set(0.3, 0, -1.2);
  tp.userData.pickId = 'turn';
  named(tp, 'Растение на перваза', -0.22, 0.2).position.z = 0.6;
  turnG.add(tp);
  const T = { lean: 0, want: 0 };
  // Наклон към прозореца (−z) — завъртаме саксията около оста y.
  tp.rotation.y = -Math.PI / 2;
  stage.tick((dt) => { T.lean += (T.want - T.lean) * Math.min(1, dt * 2); tp.userData.set({ lean: T.lean }); });

  // Живот в сцената: листата леко трептят.
  stage.tick((dt, t) => {
    for (const g of [...pots, ...sick.map((s) => s.g), tp]) g.userData.plant.rotation.y = Math.sin(t * 0.9 + g.position.x) * 0.06;
  });

  function show(which) {
    expG.visible = which === 'exp';
    helpG.visible = which === 'help';
    turnG.visible = which === 'turn';
    can.visible = which !== 'turn';
    cabZone.visible = false; balZone.visible = false;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip(); clearTags();
    ctx.click = null;
    if (ctx.stopDrag) { ctx.stopDrag(); ctx.stopDrag = null; }
    pour = null; canHeld = false;
    show('exp');
    resetExp(); resetHelp();
    view(ctx, [0.25, 1.2, -0.6], 5.4, { halfH: 2.2 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Растенията сами си правят храна. От какво имат нужда за това?</p><p><b>Разгледай всичко</b> от менюто в ъгъла или с клик.</p>',
      items: [
        { id: 'pot-a', label: 'Фасул в саксия', icon: '🌱', note: 'Малко растение фасул. С <b>корена</b> си поема вода от почвата. В зелените <b>листа</b> си прави храна.', obj: () => pots[0], dist: 3 },
        { id: 'window', label: 'Прозорец', icon: '🪟', note: 'През прозореца влиза <b>светлина</b>. Без светлина растенията не могат да си правят храна.', obj: () => win, dist: 5, lift: 0, bubble: 1.4 },
        { id: 'can', label: 'Лейка', icon: '💧', note: 'С лейката поливаме. Растенията имат нужда от <b>вода</b>.', obj: () => can, dist: 3 },
        { id: 'cab', label: 'Тъмен шкаф', icon: '🚪', note: 'В затворения шкаф е <b>тъмно</b>. Светлина не влиза.', obj: () => cab, dist: 4.5, lift: 1, bubble: 1.7 },
        { id: 'balcony', label: 'Студен балкон', icon: '❄️', note: 'Навън е зима. На балкона е светло, но е <b>студено</b> — само 2 °C.', obj: () => bal, dist: 4.5, lift: 1, bubble: 1.7 },
        { id: 'leaf', label: 'Лист отблизо', icon: '🍃', note: 'Листът има много малки отвори. През тях растението <b>поема въздух</b>. Те са толкова малки, че не ги виждаме.', obj: () => pots[0].userData.plant, dist: 2 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Опит с четири саксии ----------
  const COND = { good: ['✓', '✓', '✓'], dry: ['✗', '✓', '✓'], dark: ['✓', '✗', '✓'], cold: ['✓', '✓', '✗'] };
  function table(ready) {
    return `<table class="small" style="width:100%;border-collapse:collapse;text-align:center">
      <tr><th></th><th>💧 Вода</th><th>☀ Светлина</th><th>🌡 Топлина</th></tr>
      ${pots.map((g, i) => `<tr><td style="text-align:left">Саксия ${LETTERS[i]}</td>${COND[g.userData.P.kind].map((c) => `<td style="font-weight:800;color:${c === '✓' ? '#2e9d5b' : '#c62828'}">${ready(g) ? c : '·'}</td>`).join('')}</tr>`).join('')}
    </table>`;
  }
  function step2() {
    shell.step(1);
    ctx.clearTip(); clearTags();
    show('exp');
    resetExp();
    view(ctx, [0.25, 0.8, -0.6], 5.2, { halfH: 1.8, elev: 0.4 });
    let mistakes = 0;
    const isSet = (g) => {
      const k = g.userData.P.kind;
      const placed = k === 'dark' ? E.place[g.userData.P.id] === 'dark' : k === 'cold' ? E.place[g.userData.P.id] === 'cold' : true;
      const watered = k === 'dry' ? true : E.water.has(g.userData.P.id);
      return placed && watered;
    };
    const upd = (txt) => shell.task(`<p>${txt}</p>${table(isSet)}`);
    upd('Направи опит. <b>1)</b> Провлачи <b>саксия В</b> в шкафа и <b>саксия Г</b> на студения балкон. <b>2)</b> Кликни лейката и полей <b>А, В и Г</b>. Саксия Б остава без вода.');
    shell.setControls('');
    cabZone.visible = true; balZone.visible = true;
    pots[2].userData.dragId = 'pot-c';
    pots[3].userData.dragId = 'pot-d';
    ctx.stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => { ctx.clearTip(); },
      onDrop: (g, p, start) => {
        const id = g.userData.P.id;
        const cabW = cab.position; const balW = bal.position;
        const inCab = Math.hypot(p.x - cabW.x, p.z - (cabW.z + 0.1)) < 0.9;
        const inBal = Math.hypot(p.x - balW.x, p.z - (balW.z + 0.1)) < 0.9;
        const want = id === 'pot-c' ? 'dark' : 'cold';
        if ((want === 'dark' && inCab) || (want === 'cold' && inBal)) {
          const W = want === 'dark' ? cabW : balW;
          g.position.set(W.x, want === 'dark' ? 0.08 : 0.06, W.z + 0.1);
          g.userData.locked = true;
          delete g.userData.dragId;
          E.place[id] = want;
          (want === 'dark' ? cabZone : balZone).visible = false;
          ctx.say(g, want === 'dark' ? 'Саксия В е на тъмно.' : 'Саксия Г е на студено, но на светло.', 'tag', 1.3);
        } else {
          g.position.copy(start);
          if (inCab || inBal) shell.msg(want === 'dark' ? 'Саксия В отива в тъмния шкаф.' : 'Саксия Г отива на студения балкон.', 'bad');
        }
        check();
      },
    });
    ctx.click = (id) => {
      if (id === 'can') { canHeld = !canHeld; shell.msg(canHeld ? 'Сега кликни саксия, за да я полееш.' : ''); return; }
      const g = pots.find((x) => x.userData.P.id === id);
      if (!g || !canHeld || pour) return;
      if (g.userData.P.kind === 'dry') { shell.msg('Саксия Б е опитът „без вода“. Не я поливай.', 'bad'); return; }
      if (E.water.has(id)) return;
      pour = { pot: g, t: 0, done: () => { E.water.add(id); g.userData.set({ wet: 1 }); check(); } };
    };
    let asked = false;
    function check() {
      upd('Направи опит. <b>1)</b> Провлачи <b>саксия В</b> в шкафа и <b>саксия Г</b> на студения балкон. <b>2)</b> Кликни лейката и полей <b>А, В и Г</b>. Саксия Б остава без вода.');
      if (asked || !pots.every(isSet)) return;
      asked = true;
      canHeld = false;
      ctx.click = null;
      if (ctx.stopDrag) { ctx.stopDrag(); ctx.stopDrag = null; }
      ctx.clearTip();
      view(ctx, [0.25, 0.9, -0.6], 5.4, { halfH: 2.0, elev: 0.35 });
      upd('Опитът е готов. Виж таблицата.');
      choice(ctx, {
        q: 'Коя саксия ще расте най-добре?',
        options: [
          { t: 'Саксия А', ok: true, why: 'Да проверим! Плъзни лентата: минават дни.' },
          { t: 'Саксия В в шкафа', ok: false, why: 'В шкафа е тъмно. Може ли растението да си прави храна без светлина?' },
          { t: 'Саксия Б', ok: false, why: 'Саксия Б не получава вода. Може ли растение без вода?' },
          { t: 'Саксия Г на балкона', ok: false, why: 'На балкона е светло, но студено. Растенията обичат ли студа?' },
        ],
        hint: 'Търси саксията, която има и вода, и светлина, и топлина.',
        onRight: (m) => { mistakes = m; days(); },
      });
    }
    function days() {
      const c = shell.setControls('<label class="row">Ден <b class="dn">0</b> <input type="range" class="days" min="0" max="14" value="0" style="flex:1"></label>');
      let ok = false;
      c.querySelector('.days').addEventListener('input', (e) => {
        const d = +e.target.value;
        c.querySelector('.dn').textContent = d;
        pots.forEach((g) => grow(g, g.userData.P.kind, d));
        if (d >= 14 && !ok) {
          ok = true;
          const nar = stage.camera.aspect < 1;
          tag(pots[0], nar ? 'А ✓' : 'А: високо и зелено', 'tag good', nar ? 2.0 : 1.6);
          tag(pots[1], nar ? 'Б ✗' : 'Б: увехна', 'tag bad', 1.0);
          tag(pots[2], nar ? 'В ✗' : 'В: бледо и слабо', 'tag bad', 1.75);
          tag(pots[3], nar ? 'Г ✗' : 'Г: почти не порасна', 'tag bad', 1.0);
          setTimeout(() => {
            choice(ctx, {
              q: 'Защо растението в шкафа е бледо и слабо?',
              options: [
                { t: 'Нямаше светлина и не можеше да си прави храна.', ok: true, why: 'Вярно! На тъмно стъблото се източва, а листата пожълтяват.' },
                { t: 'Нямаше вода.', ok: false, why: 'Саксия В беше полята. Какво друго липсва в шкафа?' },
                { t: 'Беше му студено.', ok: false, why: 'В стаята е топло. Какво не стига в затворения шкаф?' },
              ],
              hint: 'В шкафа е тъмно.',
              mistakes,
              onRight: (m) => {
                ctx.scores[0] = stepScore(m, 3);
                nextBtn(ctx, 'Напред →', step3);
              },
            });
          }, 600);
        }
      });
    }
  }

  // ---------- 3. Помогни на растенията ----------
  const TOOLS = { water: '💧 Полей', light: '☀ Премести на светло', air: '🧽 Избърши листата' };
  const WRONG = {
    water: { light: 'Почвата е суха и листата висят. Светлината ли липсва?', air: 'Листата са чисти. Почвата обаче е съвсем суха.' },
    light: { water: 'Почвата е влажна. Растението стои в тъмен ъгъл.', air: 'Листата са чисти, но бледи. Какво не стига в тъмния ъгъл?' },
    air: { water: 'Почвата е влажна. Виж листата — по тях има мазни петна.', light: 'Растението е на светло. Виж листата — по тях има мазнина.' },
  };
  function step3() {
    shell.step(2);
    ctx.clearTip(); clearTags();
    show('help');
    resetHelp();
    can.visible = false;
    view(ctx, [-0.1, 0.8, 0.8], 2.6, { halfH: 1.4, elev: 0.45 });
    let mistakes = 0; let tool = null; let done = 0;
    shell.task(`<p>Три растения не са добре. Какво им липсва? <b>Избери помощ</b> и кликни растението.</p>
      <div class="xp-chips">${Object.entries(TOOLS).map(([k, v]) => `<span class="chip" data-t="${k}">${v}</span>`).join('')}</div>`);
    shell.setControls('');
    shell.score('Помогнато: 0 от 3');
    container.querySelectorAll('.xp-task .chip').forEach((ch) => ch.addEventListener('click', () => {
      container.querySelectorAll('.xp-task .chip').forEach((x) => x.classList.remove('held'));
      ch.classList.add('held');
      tool = ch.dataset.t;
    }));
    ctx.click = (id) => {
      const s = sick.find((x) => x.S.id === id);
      if (!s || s.fixed) return;
      if (!tool) { shell.msg('Първо избери помощ отгоре.', 'bad'); return; }
      if (tool === s.S.need) {
        s.fixed = true;
        done++;
        if (s.S.need === 'light') s.g.position.z = s.S.z - 0.9;
        ctx.say(s.g, `✔ ${s.S.fix}`, 'good', 1.5);
        shell.msg(`Вярно! ${s.S.need === 'water' ? 'Растенията имат нужда от вода.' : s.S.need === 'light' ? 'Растенията имат нужда от светлина.' : 'Растенията имат нужда от въздух.'}`, 'good');
        shell.score(`Помогнато: ${done} от 3`);
        if (done === 3) {
          ctx.click = null;
          ctx.scores[1] = stepScore(mistakes, 3);
          shell.task('<p>Растенията имат нужда от <b>вода</b>, <b>въздух</b> и <b>светлина</b>, за да си правят храна.</p>');
          nextBtn(ctx, 'Напред →', step4);
        }
      } else {
        mistakes++;
        ctx.say(s.g, `✘ ${WRONG[s.S.need][tool]}`, 'bad wide', 1.5);
        shell.msg(`Не е това.${mistakes >= 2 ? ' Подсказка: суха почва — вода; тъмен ъгъл — светлина; мазни листа — въздух.' : ''}`, 'bad');
      }
    };
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    ctx.clearTip(); clearTags();
    shell.score('');
    show('turn');
    T.lean = 0.45; T.want = 0.45;
    tp.rotation.y = -Math.PI / 2;
    tp.userData.set({ h: 0.9, leaves: 7, green: 1, wet: 1 });
    // Гледаме отстрани: прозорецът е вдясно.
    stage.flyTo([4.0, 2.0, -0.9], [0.3, 0.75, -1.4], 1.0);
    shell.task('<p>Растението на перваза се е навело към прозореца. Обръщаме саксията наобратно.</p>');
    let mistakes = 0;
    const c = shell.setControls('<div class="row"><button class="btn primary turn">🔄 Обърни саксията</button></div>');
    c.querySelector('.turn').addEventListener('click', () => {
      tp.rotation.y = Math.PI / 2;
      ctx.say(tp, 'Сега растението е наведено навътре в стаята.', 'tag', 1.6);
      choice(ctx, {
        q: 'Какво ще стане след няколко дни?',
        options: [
          { t: 'Ще се обърне отново към прозореца.', ok: true, why: 'Да проверим! Плъзни лентата.' },
          { t: 'Ще остане наведено навътре.', ok: false, why: 'Растението търси светлина. Откъде идва тя?' },
          { t: 'Ще изсъхне веднага.', ok: false, why: 'Растението има вода, въздух и светлина. Защо да изсъхне?' },
        ],
        hint: 'Растенията растат към светлината.',
        onRight: (m) => {
          mistakes = m;
          const cc = shell.setControls('<label class="row">Ден <b class="dn">0</b> <input type="range" class="days" min="0" max="5" value="0" style="flex:1"></label>');
          let ok = false;
          cc.querySelector('.days').addEventListener('input', (e) => {
            const d = +e.target.value;
            cc.querySelector('.dn').textContent = d;
            T.want = 0.45 * (1 - 2 * seg(d, 0, 5));
            if (d >= 5 && !ok) {
              ok = true;
              ctx.say(tp, 'Растението отново се обърна към светлината. Така листата получават повече светлина.', 'good wide', 1.6);
              setTimeout(transfer, 1500);
            }
          });
        },
      });
    });
    function transfer() {
      shell.setControls('');
      shell.task('<p>Пренеси към живота.</p>');
      choice(ctx, {
        q: 'Посади семе в саксия. От какво се нуждае растението, за да си прави храна?',
        options: [
          { t: 'От вода, въздух и светлина', ok: true, why: 'Вярно! С тях растението си прави храна в листата.' },
          { t: 'Само от пръст', ok: false, why: 'Растението не яде пръст. Какво поема с корена и с листата?' },
          { t: 'От тъмнина и студ', ok: false, why: 'Спомни си саксиите В и Г.' },
        ],
        hint: 'Спомни си саксия А.',
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
  return { dispose() { if (ctx.stopDrag) ctx.stopDrag(); stage.dispose(); } };
}
