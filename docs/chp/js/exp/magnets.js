// 6.1.8 „Магнити и електромагнит“ — маса с два прави магнита, железни стърготини, компас,
// електромагнит от пирон с намотка, банкова карта и макет на кран за скрап.
// Стъпки: опознай → полюсите (опит) → електромагнит (опит с навивки и ток) → приложения.
import { labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { tagOver } from './chem6.js';

const V3 = THREE.Vector3;

// Прав магнит по оста x: дясната половина е N (червена), лявата — S (синя). flip() го обръща.
function barMagnet(L = 1.2) {
  const g = new THREE.Group();
  const n = new THREE.Mesh(new THREE.BoxGeometry(L / 2, 0.22, 0.3), mat(0xe53935, { roughness: 0.4 }));
  n.position.x = L / 4;
  const s = new THREE.Mesh(new THREE.BoxGeometry(L / 2, 0.22, 0.3), mat(0x1e88e5, { roughness: 0.4 }));
  s.position.x = -L / 4;
  g.add(n, s);
  for (const [t, x] of [['N', L / 4], ['S', -L / 4]]) {
    const l = labelSprite(t, { size: 0.16, bg: 'rgba(255,255,255,0.85)' });
    l.position.set(x, 0.22, 0.05);
    l.raycast = () => {};
    g.add(l);
  }
  g.position.y = 0.11;
  return g;
}

function compassModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 28), mat(0xeceff1));
  body.position.y = 0.04;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 28), mat(0xb0bec5, { metalness: 0.5 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.08;
  const needle = new THREE.Group();
  const nN = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 4), mat(0xe53935));
  nN.rotation.z = -Math.PI / 2; nN.position.x = 0.14;
  const nS = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 4), mat(0x1e88e5));
  nS.rotation.z = Math.PI / 2; nS.position.x = -0.14;
  needle.add(nN, nS);
  needle.position.y = 0.11;
  g.add(body, rim, needle);
  g.userData.needle = needle;
  return g;
}

// Силови линии около прав магнит, показани с „железни стърготини“.
function filingsBoard() {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 1.6), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 }));
  plate.position.y = 0.27;
  const m = barMagnet(0.8);
  m.position.y = 0.11;
  g.add(m, plate);
  const dashM = mat(0x37474f);
  const dash = new THREE.BoxGeometry(0.05, 0.012, 0.012);
  const L = 0.32;
  const B = (x, z) => {
    let bx = 0; let bz = 0;
    for (const [px, q] of [[L, 1], [-L, -1]]) {
      const dx = x - px; const dz = z; const r3 = Math.pow(dx * dx + dz * dz, 1.5) + 1e-4;
      bx += q * dx / r3; bz += q * dz / r3;
    }
    return [bx, bz];
  };
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    let x = L + Math.cos(a) * 0.06; let z = Math.sin(a) * 0.06;
    for (let s = 0; s < 220; s++) {
      const [bx, bz] = B(x, z); const len = Math.hypot(bx, bz);
      x += (bx / len) * 0.02; z += (bz / len) * 0.02;
      if (Math.abs(x) > 1.15 || Math.abs(z) > 0.75) break;
      if (Math.hypot(x + L, z) < 0.06) break;
      if (s % 3 === 0 && !(Math.abs(x) < 0.42 && Math.abs(z) < 0.17)) {
        const d = new THREE.Mesh(dash, dashM);
        d.position.set(x, 0.3, z);
        d.rotation.y = -Math.atan2(bz, bx);
        g.add(d);
      }
    }
  }
  return g;
}

function clipModel() {
  const c = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), mat(0xb0bec5, { metalness: 0.7, roughness: 0.3 }));
  c.scale.set(1, 1.8, 1);
  return c;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Полюсите на магнита', 'Електромагнит', 'Приложения'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.8, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 15, d: 4.8 });

  // ---------- Два магнита на релса ----------
  const rail = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 0.5), mat(0xd7ccc8));
  rail.position.set(-4.4, 0.015, 0.4);
  scene.add(rail);
  const magA = barMagnet(); magA.position.set(-5.3, 0.11, 0.4);
  const magB = barMagnet();
  const BX0 = -3.0;
  magB.position.set(BX0, 0.11, 0.4);
  magA.userData.pickId = 'magnets'; magB.userData.pickId = 'magnets';
  addHitBox(magA, 0.5); addHitBox(magB, 0.5);
  scene.add(magA, magB);
  const railTag = labelSprite('Два прави магнита', { size: 0.2 });
  railTag.position.set(-4.4, 0.75, 0.4); stage.steadyLabel(railTag, 7); scene.add(railTag);
  const M = { flip: false, near: 0, x: BX0, seen: new Set() };

  // ---------- Стърготини и компас ----------
  const board = filingsBoard();
  board.position.set(-1.4, 0, -0.9);
  board.userData.pickId = 'filings';
  addHitBox(board, 0.6);
  tagOver(stage, board, 'Железни стърготини', 0.7);
  scene.add(board);
  const comp = compassModel();
  comp.position.set(-1.7, 0, 1.2);
  comp.userData.pickId = 'compass';
  addHitBox(comp, 0.6);
  tagOver(stage, comp, 'Компас', 0.45);
  scene.add(comp);

  // ---------- Електромагнит ----------
  const em = new THREE.Group();
  {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 1.0), mat(0x8d6e63));
    stand.position.y = 0.03;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 8), mat(0x78909c));
    post.position.set(-0.6, 0.95, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 8), mat(0x78909c));
    arm.rotation.z = Math.PI / 2; arm.position.set(-0.3, 1.85, 0);
    em.add(stand, post, arm);
  }
  const nail = new THREE.Group();
  {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 10), mat(0x9e9e9e, { metalness: 0.7, roughness: 0.3 }));
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14), mat(0x9e9e9e, { metalness: 0.7 }));
    head.position.y = 0.46;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 10), mat(0x9e9e9e, { metalness: 0.7 }));
    tip.rotation.x = Math.PI; tip.position.y = -0.5;
    nail.add(shaft, head, tip);
  }
  nail.position.set(0, 1.35, 0);
  em.add(nail);
  const coil = new THREE.Group();
  nail.add(coil);
  const coilM = mat(0xc77c4a, { metalness: 0.6, roughness: 0.35 });
  function setTurns(n) {
    coil.clear();
    const k = Math.round(n / 5);
    for (let i = 0; i < k; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.06 + Math.floor(i / 8) * 0.025, 0.012, 6, 16), coilM);
      t.rotation.x = Math.PI / 2;
      t.position.y = 0.3 - (i % 8) * 0.075;
      coil.add(t);
    }
  }
  const battery = new THREE.Group();
  const cells = [0, 1].map((i) => {
    const c = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.45, 14), mat(0x212121));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 14), mat(0xffb300));
    cap.position.y = 0.2;
    c.add(b, cap);
    c.rotation.z = Math.PI / 2;
    c.position.set(0.45, 0.16, -0.25 + i * 0.24);
    battery.add(c);
    return c;
  });
  em.add(battery);
  const sw = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.15), mat(0x455a64)); b.position.y = 0.09; const lever = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.025, 0.04), mat(0xb0bec5, { metalness: 0.6 })); lever.position.set(0, 0.14, 0); sw.add(b, lever); sw.userData.lever = lever; }
  sw.position.set(0.45, 0, 0.35);
  em.add(sw);
  const wireM = mat(0xd84315);
  for (const [a, b] of [[[0.05, 1.5, 0], [0.45, 0.2, -0.1]], [[0.05, 1.0, 0], [0.45, 0.12, 0.35]]]) {
    const A = new V3(...a); const B = new V3(...b); const d = new V3().subVectors(B, A);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1, 4), wireM);
    w.position.copy(A).addScaledVector(d, 0.5); w.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.clone().normalize()); w.scale.y = d.length();
    em.add(w);
  }
  const clips = [];
  for (let i = 0; i < 12; i++) {
    const c = clipModel();
    c.userData.home = new V3(-0.15 + (i % 4) * 0.1, 0.08, 0.15 - Math.floor(i / 4) * 0.12);
    c.rotation.set(Math.PI / 2, 0, i);
    c.position.copy(c.userData.home);
    em.add(c);
    clips.push(c);
  }
  em.position.set(2.0, 0, 0.2);
  em.userData.pickId = 'em';
  addHitBox(em, 1);
  tagOver(stage, em, 'Електромагнит', 2.2);
  scene.add(em);
  const E = { on: false, turns: 20, cells: 1, lifted: 0 };
  const capacity = () => (E.on ? Math.min(12, Math.round((E.turns / 10) * E.cells * 1.5)) : 0);
  const emInfo = stage.bubble(new V3(2.0, 0.1, 1.0), '', { cls: 'tag', lift: 0 });

  // ---------- Карта, диск и кран ----------
  const card = new THREE.Group();
  { const c = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.54), mat(0x1565c0)); c.position.y = 0.01; const strip = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.022, 0.1), mat(0x212121)); strip.position.set(0, 0.012, -0.15); card.add(c, strip); }
  card.position.set(3.9, 0, 1.2);
  card.rotation.y = 0.3;
  card.userData.pickId = 'card';
  addHitBox(card, 0.5);
  tagOver(stage, card, 'Банкова карта', 0.4);
  scene.add(card);
  const crane = new THREE.Group();
  {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.4), mat(0x8d8d8d));
    base.position.y = 0.03;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.0, 0.16), mat(0xfbc02d));
    tower.position.set(-0.8, 1.0, 0);
    const jib = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), mat(0xfbc02d));
    jib.position.set(-0.1, 1.95, 0);
    const bin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), mat(0x2e7d32));
    bin.position.set(-0.3, 0.18, 0.4);
    crane.add(base, tower, jib, bin);
  }
  const hook = new THREE.Group();
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 4), mat(0x212121));
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 18), mat(0x455a64, { metalness: 0.5 }));
  hook.add(disc);
  crane.add(hook, cable);
  const scrap = [];
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(i % 2 ? new THREE.BoxGeometry(0.16, 0.06, 0.1) : new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), mat([0x795548, 0x8d6e63, 0x9e9e9e][i % 3], { metalness: 0.4 }));
    s.userData.home = new V3(0.35 + (i % 3) * 0.15, 0.08 + Math.floor(i / 3) * 0.05, -0.3 + (i % 2) * 0.1);
    s.position.copy(s.userData.home);
    s.rotation.set(i, i * 2, 0);
    crane.add(s);
    scrap.push(s);
  }
  crane.position.set(6.0, 0, -0.5);
  crane.userData.pickId = 'crane';
  addHitBox(crane, 1);
  tagOver(stage, crane, 'Кран за скрап', 2.3);
  scene.add(crane);
  const C = { on: false, x: 0.5, y: 1.2, phase: 'idle', held: false };

  stage.tick((dt, t) => {
    // релса с магнити
    // Без обръщане S на десния е срещу N на левия → привличане; обърнат: N срещу N → отблъскване.
    const contact = -5.3 + 1.2;
    let want = lerp(BX0, contact, M.near);
    if (!M.flip && M.near > 0.6) want = contact;
    if (M.flip) want = Math.max(want, contact + 0.6);
    M.x += (want - M.x) * Math.min(1, dt * 5);
    magB.position.x = M.x + (M.flip && M.near > 0.15 ? Math.sin(t * 25) * 0.01 : 0);
    magB.rotation.y += ((M.flip ? Math.PI : 0) - magB.rotation.y) * Math.min(1, dt * 6);
    // компас: стрелката трепти около север
    comp.userData.needle.rotation.y = Math.sin(t * 0.7) * 0.15;
    // електромагнит
    sw.userData.lever.rotation.z = E.on ? 0 : 0.45;
    const cap = capacity();
    E.lifted += (cap - E.lifted) * Math.min(1, dt * 4);
    const nTip = nail.position.clone().add(new V3(0, -0.56, 0));
    clips.forEach((c, i) => {
      if (i < Math.round(E.lifted)) c.position.lerp(new V3(nTip.x + Math.sin(i * 1.7) * 0.03, nTip.y - 0.08 - i * 0.1, nTip.z), Math.min(1, dt * 8));
      else c.position.lerp(c.userData.home, Math.min(1, dt * 6));
    });
    cells[1].visible = E.cells === 2;
    emInfo.set(`ток: ${E.on ? 'включен' : 'изключен'} · навивки: ${E.turns} · батерии: ${E.cells} · кламери: ${Math.round(E.lifted)}`);
    // кран
    const tgtX = C.phase === 'drop' || C.phase === 'dropped' ? -0.3 : 0.5;
    const tgtY = C.phase === 'down' ? 0.3 : 1.2;
    C.x += (tgtX - C.x) * Math.min(1, dt * 2); C.y += (tgtY - C.y) * Math.min(1, dt * 2);
    hook.position.set(C.x, C.y, 0);
    cable.position.set(C.x, (1.9 + C.y) / 2, 0); cable.scale.y = 1.9 - C.y;
    scrap.forEach((s, i) => {
      if (C.held) s.position.lerp(new V3(C.x + ((i % 3) - 1) * 0.12, C.y - 0.1 - Math.floor(i / 3) * 0.05, (i % 2) * 0.08 - 0.04), Math.min(1, dt * 8));
      else if (C.phase === 'dropped') s.position.lerp(new V3(-0.3 + ((i % 3) - 1) * 0.12, 0.3 + Math.floor(i / 3) * 0.04, 0.4), Math.min(1, dt * 5));
      else s.position.lerp(s.userData.home, Math.min(1, dt * 5));
    });
  });
  const lerp = (a, b, k) => a + (b - a) * k;

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    M.flip = false; M.near = 0; M.x = BX0; M.seen.clear();
    E.on = false; E.turns = 20; E.cells = 1; setTurns(20);
    C.phase = 'idle'; C.held = false;
    view(ctx, [0.6, 0.8, 0], 7.0, { halfH: 1.8 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Магнитът привлича желязо. А как си действат два магнита? Може ли да направим магнит с ток?</p><p><b>Разгледай всичко</b> от менюто или с клик.</p>',
      items: [
        { id: 'magnets', label: 'Прави магнити', icon: '🧲', note: 'Всеки магнит има два <b>полюса</b>: северен <b>N</b> (червен) и южен <b>S</b> (син). Най-силно привличат краищата.', obj: () => magB, dist: 3 },
        { id: 'filings', label: 'Железни стърготини', icon: '✨', note: 'Под листа има магнит. Стърготините се подреждат по <b>магнитните силови линии</b> — от полюс до полюс.', obj: () => board, dist: 3 },
        { id: 'compass', label: 'Компас', icon: '🧭', note: 'Стрелката на компаса е малък магнит. Северният ѝ край сочи към северния географски полюс на Земята.', obj: () => comp, dist: 2.4 },
        { id: 'em', label: 'Електромагнит', icon: '🔩', note: 'Железен пирон с намотка от проводник. Когато през намотката тече ток, пиронът става <b>магнит</b>.', obj: () => em, dist: 3.4, lift: 0.8, bubble: 1.6 },
        { id: 'card', label: 'Банкова карта', icon: '💳', note: 'Черната ивица е <b>магнитна лента</b>. Информацията е записана като намагнитени участъци. Така работят и някои твърди дискове.', obj: () => card, dist: 2.4 },
        { id: 'crane', label: 'Кран за скрап', icon: '🏗', note: 'На края на въжето има голям електромагнит. С него кранът вдига старо желязо.', obj: () => crane, dist: 4, lift: 0.8, bubble: 1.8 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Полюсите на магнита ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    M.flip = true; M.near = 0; M.x = BX0;
    view(ctx, [-4.4, 0.4, 0.4], 1.9, { halfH: 0.8, elev: 0.55 });
    shell.task('<p>Обърнахме десния магнит. Сега <b>северният полюс N</b> е срещу <b>северния полюс N</b> на левия магнит.</p>');
    choice(ctx, {
      q: 'Какво ще стане, ако ги доближим?',
      options: [
        { t: 'Ще се отблъснат.', ok: true, why: 'Да проверим! Плъзни лентата.' },
        { t: 'Ще се залепят един за друг.', ok: false, why: 'Срещу какъв полюс е N? Еднакви или различни са?' },
        { t: 'Нищо — магнитите си действат само с желязо.', ok: false, why: 'Магнитите си действат и помежду си. Опитай с два магнита за хладилник.' },
      ],
      hint: 'Еднаквите полюси се отблъскват.',
      onRight: (m) => poles(m),
    });
  }
  function poles(m0) {
    let mistakes = m0;
    shell.task('<p><b>Доближи</b> десния магнит с лентата. После го <b>обърни</b> и опитай пак.</p>');
    const c = shell.setControls(`<label class="row">Далеч <input type="range" class="near" min="0" max="100" value="0" style="flex:1"> Близо</label>
      <div class="row"><button class="btn flip">🔄 Обърни десния магнит</button></div>`);
    const rng = c.querySelector('.near');
    const check = () => {
      if (M.near > 0.8) {
        const key = M.flip ? 'NN' : 'NS';
        if (!M.seen.has(key)) {
          M.seen.add(key);
          ctx.say(magB, M.flip ? 'N срещу N: магнитът се отблъсква и не може да се доближи.' : 'S срещу N: магнитите се привлякоха и се залепиха!', M.flip ? 'bad wide' : 'good wide', 0.5);
        }
        if (M.seen.size === 2 && !c.querySelector('.q')) {
          c.insertAdjacentHTML('beforeend', '<span class="q"></span>');
          setTimeout(() => choice(ctx, {
            q: 'Кога два магнита се привличат?',
            options: [
              { t: 'Когато срещу себе си са различни полюси (N и S).', ok: true, why: 'Вярно! Различните полюси се привличат, а еднаквите се отблъскват.' },
              { t: 'Когато срещу себе си са еднакви полюси.', ok: false, why: 'Спомни си: N срещу N отблъсна магнита.' },
              { t: 'Винаги, щом са близо.', ok: false, why: 'При N срещу N магнитът се отблъсна.' },
            ],
            hint: 'Различни полюси.',
            mistakes,
            onRight: (m) => { mistakes = m; ctx.scores[0] = stepScore(mistakes, 3); nextBtn(ctx, 'Напред →', step3); },
          }), 900);
        }
      }
    };
    rng.addEventListener('input', () => { M.near = +rng.value / 100; check(); });
    c.querySelector('.flip').addEventListener('click', () => { M.flip = !M.flip; M.near = 0; rng.value = 0; M.x = BX0; ctx.clearTip(); });
  }

  // ---------- 3. Електромагнит ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    view(ctx, [2.0, 1.0, 0.2], 1.3, { halfH: 1.2, elev: 0.2 });
    shell.task('<p>Електромагнитът сега има <b>20 навивки</b> и <b>1 батерия</b>.</p>');
    choice(ctx, {
      q: 'Какво ще стане, ако увеличим броя на навивките?',
      options: [
        { t: 'Ще вдига повече кламери.', ok: true, why: 'Да проверим!' },
        { t: 'Ще вдига по-малко кламери.', ok: false, why: 'Повече навивки — повече ток около желязото. Магнитът по-силен ли ще е?' },
        { t: 'Няма разлика.', ok: false, why: 'Опитай и виж колко кламера вдига.' },
      ],
      hint: 'Повече навивки — по-силен електромагнит.',
      onRight: (m) => lab(m),
    });
  }
  function lab(m0) {
    let mistakes = m0;
    const tried = new Set();
    shell.task('<p>Включи тока. Пробвай различен брой <b>навивки</b> и <b>батерии</b>. Изключи тока накрая.</p>');
    const c = shell.setControls(`<div class="row"><button class="btn primary sw">🔌 Включи / изключи</button></div>
      <label class="row">Навивки <b class="tn">20</b> <input type="range" class="turns" min="10" max="40" step="10" value="20" style="flex:1"></label>
      <div class="row"><button class="btn cells" data-n="1">1 батерия</button><button class="btn cells" data-n="2">2 батерии</button></div>`);
    const note = () => {
      tried.add(`${E.on}-${E.turns}-${E.cells}`);
      const ons = [...tried].filter((k) => k.startsWith('true')).length;
      if (ons >= 3 && tried.has(`false-${E.turns}-${E.cells}`) && !c.querySelector('.q')) {
        c.insertAdjacentHTML('beforeend', '<span class="q"></span>');
        setTimeout(() => choice(ctx, {
          q: 'Какво става с кламерите, когато изключим тока?',
          options: [
            { t: 'Падат — без ток пиронът не е магнит.', ok: true, why: 'Вярно! Електромагнитът действа само докато тече ток. Колкото повече навивки и по-силен ток, толкова е по-силен.' },
            { t: 'Остават залепени завинаги.', ok: false, why: 'Виж: какво стана при изключен ток?' },
            { t: 'Отлитат нагоре.', ok: false, why: 'Виж какво стана при изключен ток.' },
          ],
          hint: 'Електромагнитът има нужда от ток.',
          mistakes,
          onRight: (m) => { mistakes = m; ctx.scores[1] = stepScore(mistakes, 3); nextBtn(ctx, 'Напред →', step4); },
        }), 1200);
      }
    };
    c.querySelector('.sw').addEventListener('click', () => { E.on = !E.on; note(); });
    c.querySelector('.turns').addEventListener('input', (e) => { E.turns = +e.target.value; c.querySelector('.tn').textContent = E.turns; setTurns(E.turns); note(); });
    c.querySelectorAll('.cells').forEach((b) => b.addEventListener('click', () => { E.cells = +b.dataset.n; note(); }));
  }

  // ---------- 4. Приложения ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    E.on = false;
    view(ctx, [6.0, 1.0, -0.5], 1.4, { halfH: 1.3, elev: 0.25 });
    let mistakes = 0;
    shell.task('<p>Помогни на крана да пренесе скрапа в зеления контейнер.</p>');
    const c = shell.setControls('<div class="row"><button class="btn primary cr">⬇ Спусни и включи магнита</button></div>');
    const b = c.querySelector('.cr');
    let st = 0;
    b.addEventListener('click', () => {
      if (st === 0) { C.phase = 'down'; setTimeout(() => { C.held = true; C.phase = 'up'; }, 1300); b.textContent = '➡ Премести над контейнера'; st = 1; }
      else if (st === 1) { C.phase = 'drop'; b.textContent = '⏻ Изключи магнита'; st = 2; }
      else if (st === 2) {
        C.held = false; C.phase = 'dropped'; b.disabled = true;
        setTimeout(() => {
          ctx.say(crane, 'Кранът използва електромагнит: включваме тока — вдига желязото; изключваме — пуска го. С постоянен магнит това не става.', 'wide', 2.4);
          sorting();
        }, 1200);
      }
    });
    function sorting() {
      shell.task('<p>Къде се използва това?</p>');
      sortTask(ctx, {
        bins: ['Постоянен магнит / магнитен материал', 'Електромагнит'],
        items: [
          { t: '🧲 Магнит за хладилник', bin: 0, why: 'Той е постоянен магнит — не му трябва ток.' },
          { t: '🧭 Компас', bin: 0, why: 'Стрелката е малък постоянен магнит.' },
          { t: '💳 Магнитна лента на карта', bin: 0, why: 'В лентата информацията е записана с намагнитени участъци.' },
          { t: '🏗 Кран за скрап', bin: 1, why: 'Вдига и пуска желязото, като включва и изключва тока.' },
          { t: '🔔 Електрически звънец', bin: 1, why: 'Електромагнитът дърпа чукчето, докато натискаш бутона.' },
          { t: '🚪 Електромагнитна брава на вход', bin: 1, why: 'Държи вратата, докато има ток.' },
        ],
        hint: 'Трябва ли му ток, за да е магнит?',
        mistakes,
        onDone: (m) => {
          mistakes = m;
          choice(ctx, {
            q: 'Защо не държим силен магнит до банковата карта?',
            options: [
              { t: 'Може да развали записа в магнитната лента.', ok: true, why: 'Вярно! Силното магнитно поле може да промени намагнитените участъци.' },
              { t: 'Картата ще се залепи и ще се счупи.', ok: false, why: 'Пластмасата не се привлича от магнит. Какво има в черната ивица?' },
              { t: 'Магнитът ще изгуби силата си.', ok: false, why: 'Помисли какво е записано в лентата.' },
            ],
            hint: 'Черната лента е магнитна.',
            mistakes,
            onRight: (mm) => { ctx.scores[2] = stepScore(mm, 3); finishBtn(ctx, onComplete, restart); },
          });
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
  return { dispose() { emInfo.remove(); stage.dispose(); } };
}
