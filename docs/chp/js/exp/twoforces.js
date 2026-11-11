// 6.1.2 „Сили: тежест, триене, уравновесяване“ — две сили върху количка, силомер, триене по различни пътища.
// Стъпки: опознай → две сили на едно тяло (опит) → силомер и посока на тежестта (приложи) → триене (предскажи).
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, makeArrow, view, stepScore } from './labkit.js';

const CX = -1.6;      // среда на релсите
const HALF = 2.1;     // докъде може да стигне количката
const K = 0.16;       // дължина на стрелката за 1 N

function cartModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.55), mat(0xffb300));
  body.position.y = 0.3;
  g.add(body);
  const wheels = [];
  for (const x of [-0.3, 0.3]) for (const z of [-0.3, 0.3]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), mat(0x37474f));
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.11, z);
    g.add(w);
    wheels.push(w);
  }
  for (const x of [-0.47, 0.47]) {
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 12), mat(0x9e9e9e));
    hook.position.set(x, 0.32, 0);
    g.add(hook);
  }
  return { g, wheels };
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Две сили на едно тяло', 'Силомер и тежест', 'Предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.6, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 13, d: 4.6 });

  // ---------- Релси, количка, стрелки ----------
  const rails = new THREE.Group();
  for (const z of [-0.3, 0.3]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2 + 1.2, 0.03, 0.05), mat(0x90a4ae));
    r.position.set(CX, 0.015, z);
    rails.add(r);
  }
  for (const s of [-1, 1]) {
    const stop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.8), mat(0x6d4c41));
    stop.position.set(CX + s * (HALF + 0.55), 0.125, 0);
    rails.add(stop);
  }
  scene.add(rails);
  const cart = cartModel();
  cart.g.userData.pickId = 'cart';
  addHitBox(cart.g, 0.8);
  scene.add(cart.g);
  const aL = makeArrow(0xe53935, 0.05);
  aL.g.rotation.y = Math.PI; // сочи наляво
  const aR = makeArrow(0x1e88e5, 0.05);
  scene.add(aL.g, aR.g);
  const C = { x: CX, v: 0, run: false, FL: 0, FR: 0, onStop: null };
  function setForces(FL, FR) { C.FL = FL; C.FR = FR; }
  stage.tick((dt) => {
    if (C.run) {
      const net = C.FR - C.FL;
      C.v += net * 0.35 * dt;
      C.x += C.v * dt;
      if (Math.abs(C.x - CX) > HALF) {
        C.x = CX + Math.sign(C.x - CX) * HALF;
        C.v = 0; C.run = false;
        C.onStop && C.onStop(Math.sign(net));
      }
      for (const w of cart.wheels) w.rotation.y -= (C.v * dt) / 0.11;
    }
    cart.g.position.set(C.x, 0, 0);
    // стрелките излизат от куките на количката (приложни точки)
    aL.g.position.set(C.x - 0.47, 0.32, 0);
    aR.g.position.set(C.x + 0.47, 0.32, 0);
    aL.set(C.FL * K);
    aR.set(C.FR * K);
  });
  const ancL = new THREE.Vector3(); const ancR = new THREE.Vector3();
  const tagL = stage.bubble(ancL, '', { cls: 'tag', lift: 0 });
  const tagR = stage.bubble(ancR, '', { cls: 'tag', lift: 0 });
  stage.tick(() => {
    ancL.set(C.x - 0.6 - C.FL * K / 2, 0.75, 0);
    ancR.set(C.x + 0.6 + C.FR * K / 2, 0.75, 0);
    tagL.set(C.FL ? `${C.FL} N` : '');
    tagR.set(C.FR ? `${C.FR} N` : '');
    tagL.el.style.visibility = C.FL && rails.visible ? '' : 'hidden';
    tagR.el.style.visibility = C.FR && rails.visible ? '' : 'hidden';
  });

  // ---------- Силомер на стойка ----------
  const SX = 3.6;
  const meter = new THREE.Group();
  const spring = new THREE.Group();
  const hookG = new THREE.Group();
  const loadG = new THREE.Group();
  const dirArrows = [];
  {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), mat(0x546e7a));
    base.position.y = 0.04;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 10), mat(0x78909c));
    post.position.set(-0.45, 1.6, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 10), mat(0x78909c));
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-0.17, 3.15, 0);
    const tubeM = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    tubeM.position.set(0, 2.45, 0);
    // скала 0–6 N
    const scale = new THREE.Group();
    for (let n = 0; n <= 6; n++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.01), mat(0x212121));
      tick.position.set(0.15, 3.0 - n * 0.18, 0.06);
      scale.add(tick);
      const l = labelSprite(String(n), { size: 0.11 });
      l.position.set(0.33, 3.0 - n * 0.18, 0.06);
      scale.add(l);
    }
    const nLbl = labelSprite('N', { size: 0.12 });
    nLbl.position.set(0.33, 3.18, 0.06);
    scale.add(nLbl);
    for (let i = 0; i < 10; i++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 16), mat(0x9e9e9e, { metalness: 0.6 }));
      coil.rotation.x = Math.PI / 2;
      coil.userData.i = i;
      spring.add(coil);
    }
    const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.025), mat(0xe53935));
    pointer.position.x = 0.08;
    hookG.add(pointer);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), mat(0x9e9e9e));
    rod.position.y = -0.25;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI * 1.4), mat(0x9e9e9e));
    hook.position.y = -0.52;
    hookG.add(rod, hook);
    hookG.add(loadG);
    loadG.position.y = -0.6;
    meter.add(base, post, arm, tubeM, scale, spring, hookG);
    meter.position.set(SX, 0, 0);
    meter.userData.pickId = 'meter';
    scene.add(meter);
    // стрелки за избор на посока (около товара)
    const DIRS = [['dir-down', -Math.PI / 2, 0x6a1b9a], ['dir-up', Math.PI / 2, 0x6a1b9a], ['dir-left', Math.PI, 0x6a1b9a], ['dir-right', 0, 0x6a1b9a]];
    for (const [id, ang, col] of DIRS) {
      const a = makeArrow(col, 0.045);
      a.set(0.55);
      a.g.rotation.z = ang;
      const holder = new THREE.Group();
      holder.add(a.g);
      holder.userData.pickId = id;
      addHitBox(holder, 0.4);
      holder.visible = false;
      scene.add(holder);
      dirArrows.push({ id, holder, ang });
    }
  }
  const LOADS = { m100: { name: 'Ябълка', g: 100, color: 0xd32f2f }, m300: { name: 'Торбичка с ориз', g: 300, color: 0xfff3e0 }, m500: { name: 'Тежест', g: 500, color: 0x546e7a } };
  const M = { load: null, shown: 0 };
  function hangLoad(key) {
    while (loadG.children.length) loadG.remove(loadG.children[0]);
    M.load = key;
    if (!key) return;
    const L = LOADS[key];
    let m;
    if (key === 'm100') { m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), mat(L.color)); m.position.y = -0.18; }
    else if (key === 'm300') { m = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), mat(L.color)); m.scale.set(1, 1.2, 0.8); m.position.y = -0.27; }
    else { m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.4, 18), mat(L.color, { metalness: 0.4 })); m.position.y = -0.2; }
    loadG.add(m);
    const l = labelSprite(`${L.name} · ${L.g} g`, { size: 0.14 });
    l.position.set(0, -0.3, 0.4);
    loadG.add(l);
  }
  const weightN = () => (M.load ? LOADS[M.load].g / 100 : 0); // около 1 N за всеки 100 g
  stage.tick((dt, t) => {
    M.shown += (weightN() - M.shown) * Math.min(1, dt * 4);
    const sway = M.load ? Math.sin(t * 3) * 0.004 * Math.exp(-Math.abs(weightN() - M.shown)) : 0;
    const y = 3.0 - M.shown * 0.18 + sway;
    hookG.position.y = y;
    const top = 3.1; const len = top - y;
    spring.children.forEach((c) => { c.position.y = top - (c.userData.i / 9) * len + 0.02; });
    const ly = y - 0.6 - 0.25;
    for (const d of dirArrows) {
      const off = 0.42;
      d.holder.position.set(SX + Math.cos(d.ang) * off, ly + Math.sin(d.ang) * off, 0.3);
    }
  });

  // ---------- Пътеки за триене ----------
  const LANES = [
    { id: 'ice', name: 'Лед', color: 0xd6f0ff, dec: 0.65, z: -1.1 },
    { id: 'wood', name: 'Паркет', color: 0xb5835a, dec: 1.5, z: 0 },
    { id: 'sand', name: 'Пясък', color: 0xe6c88f, dec: 4.0, z: 1.1 },
  ];
  const lanes = new THREE.Group();
  const pucks = [];
  for (const L of LANES) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.04, 0.8), mat(L.color, { flat: L.id === 'sand' }));
    s.position.set(CX + 0.3, 0.02, L.z);
    const l = labelSprite(L.name, { size: 0.22 });
    l.position.set(CX + 3.4, 0.3, L.z);
    stage.steadyLabel(l, 7);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), mat(0xffb300));
    p.position.set(CX - 2.1, 0.19, L.z);
    lanes.add(s, l, p);
    pucks.push({ L, p, v: 0, x: CX - 2.1 });
  }
  lanes.visible = false;
  scene.add(lanes);
  let pushing = false;
  let onPushDone = null;
  stage.tick((dt) => {
    if (!pushing) return;
    let moving = false;
    for (const P of pucks) {
      if (P.v > 0) {
        P.v = Math.max(0, P.v - P.L.dec * dt); // забавянето от триенето (условни стойности)
        P.x += P.v * dt;
        P.p.position.x = P.x;
        moving = moving || P.v > 0;
      }
    }
    if (!moving) { pushing = false; onPushDone && onPushDone(); }
  });
  function push() {
    for (const P of pucks) { P.x = CX - 2.1; P.v = 2.4; P.p.position.x = P.x; }
    pushing = true;
  }

  function showCart(on) {
    rails.visible = on; cart.g.visible = on; aL.g.visible = on && C.FL > 0; aR.g.visible = on && C.FR > 0;
    lanes.visible = !on;
  }
  function resetCart() { C.x = CX; C.v = 0; C.run = false; C.onStop = null; }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    showCart(true); resetCart(); setForces(4, 4);
    hangLoad('m100');
    for (const d of dirArrows) d.holder.visible = false;
    view(ctx, [0.6, 1.2, 0], 5.0, { halfH: 1.8 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Силите дърпат, бутат и спират телата. Как ги измерваме и какво става, когато две сили действат на едно тяло?</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'arrow', label: 'Стрелка на силата', icon: '➡', note: 'Силата се рисува със стрелка: <b>дължината</b> показва големината, <b>върхът</b> — посоката, а <b>началото</b> е приложната точка — мястото, където силата действа на тялото.', obj: () => aR.g, dist: 3 },
        { id: 'cart', label: 'Количка', icon: '🛒', note: 'На количката действат две сили: червената я дърпа наляво, синята — надясно. Двете сили са равни (4 N), затова количката стои.', obj: () => cart.g, dist: 3.2 },
        { id: 'meter', label: 'Силомер', icon: '📏', note: 'Силомерът мери сила в <b>нютони (N)</b>. Колкото по-голяма е силата, толкова повече се разтяга пружината.', obj: () => meter, dist: 4.4, lift: 1.4, bubble: 2.1 },
        { id: 'apple', label: 'Тежест на ябълката', icon: '🍎', note: 'Земята привлича всички тела към центъра си. Тази сила е <b>силата на тежестта</b>. Ябълка от 100 g тежи около 1 N.', obj: () => loadG, dist: 2.6 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Две сили на едно тяло ----------
  function step2() {
    shell.step(1);
    showCart(true); resetCart();
    view(ctx, [CX, 0.5, 0], HALF + 1.4, { halfH: 1.0 });
    let mistakes = 0;
    const TASKS = [
      { text: 'Лявата сила е <b>6 N</b>. Нагласи дясната така, че количката да <b>остане на място</b>.', fixL: 6, slide: 'R', goal: 0 },
      { text: 'Сега направи така, че количката да тръгне <b>надясно</b>.', fixL: 6, slide: 'R', goal: 1 },
      { text: 'Дясната сила е <b>3 N</b>. Нагласи лявата така, че количката да тръгне <b>наляво</b>.', fixR: 3, slide: 'L', goal: -1 },
    ];
    let k = 0;
    const load = () => {
      resetCart();
      const T = TASKS[k];
      const v0 = T.slide === 'R' ? (k === 1 ? 6 : 2) : 3;
      setForces(T.slide === 'L' ? v0 : T.fixL, T.slide === 'R' ? v0 : T.fixR);
      showCart(true);
      shell.task(`<p>${T.text}</p>
        <label class="small">${T.slide === 'R' ? 'Дясна сила (синя)' : 'Лява сила (червена)'}: <b class="fv">${v0} N</b>
        <input class="slider fs" type="range" min="0" max="10" step="1" value="${v0}"></label>
        <p class="small">Задача ${k + 1} от ${TASKS.length}. Релсите са гладки: триенето е много малко.</p>`);
      const sl = container.querySelector('.fs');
      sl.addEventListener('input', () => {
        if (C.run) return;
        resetCart();
        const v = +sl.value;
        container.querySelector('.fv').textContent = `${v} N`;
        if (T.slide === 'R') setForces(C.FL, v); else setForces(v, C.FR);
        showCart(true);
      });
      const c = shell.setControls('<div class="row"><button class="btn primary go">Пусни</button></div>');
      c.querySelector('.go').addEventListener('click', () => {
        if (C.run) return;
        resetCart();
        const net = Math.sign(C.FR - C.FL);
        const ok = net === T.goal;
        const after = () => {
          if (ok) {
            shell.msg(T.goal === 0 ? `Равни сили (${C.FL} N и ${C.FR} N) в противоположни посоки се уравновесяват: количката стои.` : `Силите не са равни: количката тръгна към по-голямата сила (${Math.max(C.FL, C.FR)} N).`, 'good');
            c.querySelector('.go').disabled = true;
            nextBtn(ctx, k < TASKS.length - 1 ? 'Следваща задача →' : 'Напред →', () => { k++; if (k < TASKS.length) load(); else rule(); });
          } else {
            mistakes++;
            const where = net === 0 ? 'остана на място' : net > 0 ? 'тръгна надясно' : 'тръгна наляво';
            shell.msg(`Количката ${where}. ${T.goal === 0 ? 'Кога силите се уравновесяват?' : 'Коя сила трябва да е по-голяма?'}${mistakes >= 2 ? ' Подсказка: количката тръгва към по-голямата сила.' : ''}`, 'bad');
            shell.score(`Грешки: ${mistakes}`);
            setTimeout(() => { resetCart(); }, 1200);
          }
        };
        if (net === 0) { setTimeout(after, 700); return; }
        C.onStop = () => after();
        C.run = true;
      });
    };
    function rule() {
      resetCart(); setForces(5, 5);
      shell.task('<p>Обобщи наблюденията.</p>');
      choice(ctx, {
        q: 'Кога две сили, които действат на едно тяло, се уравновесяват?',
        options: [
          { t: 'Когато са равни по големина и с противоположни посоки.', ok: true, why: 'Вярно! Тогава тялото, което стои, остава на място. Ако силите не са равни, движението се променя.' },
          { t: 'Когато са равни по големина и в една посока.', ok: false, why: 'Две сили в една посока се събират и дърпат тялото още по-силно.' },
          { t: 'Когато едната е по-голяма от другата.', ok: false, why: 'Виж задача 2: при неравни сили количката тръгна.' },
        ],
        hint: 'Спомни си първата задача: 6 N наляво и … надясно.',
        mistakes,
        onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
      });
    }
    load();
  }

  // ---------- 3. Силомер и тежест ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    resetCart(); setForces(0, 0);
    showCart(true);
    hangLoad(null);
    view(ctx, [SX, 1.8, 0], 1.3, { halfH: 1.6, elev: 0.2 });
    let mistakes = 0;
    shell.task(`<p><b>Закачи торбичката с ориз</b> на силомера и прочети показанието.</p>
      <div class="xp-chips"><span class="chip" data-l="m300">🛍 Торбичка с ориз</span></div>`);
    shell.setControls('');
    container.querySelector('.xp-task .chip').addEventListener('click', () => {
      hangLoad('m300');
      shell.task(`<p><b>Колко нютона показва силомерът?</b></p><p class="small">Гледай къде е червената черта на скалата.</p>
        <label class="num"><input class="ans" type="text" inputmode="decimal"> N</label>`);
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      const inp = container.querySelector('.ans');
      c.querySelector('.chk').addEventListener('click', () => {
        const v = parseFloat(inp.value.replace(',', '.'));
        if (!Number.isFinite(v)) return;
        if (v === 3) {
          inp.classList.add('right');
          c.querySelector('.chk').disabled = true;
          shell.msg('Вярно! Тежестта на торбичката е около 3 N.', 'good');
          setTimeout(() => dirs('dir-down'), 900);
          return;
        }
        mistakes++;
        inp.classList.add('wrong');
        shell.msg(`Не е ${v} N. Броят деленията от 0 до червената черта.${mistakes >= 2 ? ' Подсказка: чертата е на третото деление.' : ''}`, 'bad');
      }, { once: false });
    }, { once: true });
    function dirs(want) {
      for (const d of dirArrows) d.holder.visible = true;
      shell.setControls('');
      shell.task(want === 'dir-down'
        ? '<p><b>Кликни стрелката</b>, която показва посоката на <b>силата на тежестта</b>.</p>'
        : '<p>Торбичката виси неподвижно. <b>Кликни стрелката</b> на силата, с която <b>пружината</b> държи торбичката.</p>');
      ctx.click = (id) => {
        if (!id || !id.startsWith('dir-')) return;
        const d = dirArrows.find((x) => x.id === id);
        if (id === want) {
          ctx.say(d.holder, want === 'dir-down' ? '✔ Тежестта е насочена надолу, към центъра на Земята.' : '✔ Пружината дърпа нагоре с 3 N. Двете сили са равни и противоположни — уравновесяват се.', 'good', 0.6);
          if (want === 'dir-down') { setTimeout(() => dirs('dir-up'), 1300); return; }
          ctx.click = null;
          ctx.scores[1] = stepScore(mistakes, 3);
          nextBtn(ctx, 'Напред →', step4);
          return;
        }
        mistakes++;
        ctx.say(d.holder, want === 'dir-down' ? '✘ Накъде падат телата, когато ги пуснем?' : '✘ Торбичката не пада. Накъде трябва да дърпа пружината, за да уравновеси тежестта?', 'bad', 0.6);
        shell.score(`Грешки: ${mistakes}`);
      };
    }
  }

  // ---------- 4. Предскажи: триене ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    shell.score('');
    for (const d of dirArrows) d.holder.visible = false;
    setForces(0, 0);
    showCart(false);
    for (const P of pucks) { P.x = CX - 2.1; P.v = 0; P.p.position.x = P.x; }
    view(ctx, [CX + 0.1, 0.2, 0.2], 3.5, { halfH: 1.5, elev: 0.75 });
    shell.task('<p>Три еднакви кутии ще бутнем <b>еднакво силно</b> по лед, по паркет и по пясък.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Коя кутия ще спре най-бързо?',
      options: [
        { t: 'По пясъка', ok: true, why: 'Да проверим!' },
        { t: 'По леда', ok: false, why: 'По леда е хлъзгаво. Там триенето голямо ли е или малко?' },
        { t: 'Всички спират на едно място', ok: false, why: 'Пътищата не са еднакви. Кой е най-грапав?' },
      ],
      hint: 'Колкото по-грапава е повърхността, толкова по-голямо е триенето.',
      onRight: (m) => {
        mistakes = m;
        onPushDone = () => {
          onPushDone = null;
          ctx.say(pucks[2].p, 'Най-голямото триене е по пясъка: кутията спря първа. По леда стигна най-далеч.', 'good', 0.6);
          nextBtn(ctx, 'Още една задача →', life);
        };
        push();
      },
    });
    function life() {
      ctx.clearTip();
      shell.task('<p>Пренеси към живота.</p>');
      choice(ctx, {
        q: 'Защо през зимата посипват пясък по заледените тротоари?',
        options: [
          { t: 'Пясъкът увеличава триенето и обувките не се плъзгат.', ok: true, why: 'Вярно! Триенето ни помага да ходим. По същата причина колите имат зимни гуми.' },
          { t: 'Пясъкът топи леда веднага.', ok: false, why: 'Пясъкът не топи леда. Какво променя той под обувките ни?' },
          { t: 'Пясъкът намалява триенето.', ok: false, why: 'Обратно: сравни кутията по пясъка и по леда.' },
        ],
        hint: 'Спомни си кутията по пясъка.',
        mistakes,
        onRight: (m) => { ctx.scores[2] = stepScore(m, 3); finishBtn(ctx, onComplete, restart); },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    pushing = false; onPushDone = null;
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
