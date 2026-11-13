// 5.3.4 „Отделяне“ — растение с найлонова торбичка, есенно дърво и схема на бозайник с бъбреци, бели дробове и кожа (не в мащаб).
// Стъпки: опознай → какво отделят растенията (опит с торбичката, листопад) → отделяне при бозайника → ако отделянето спре.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, view, stepScore } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { curveOf, flowDots, glassMat, organMat } from './anatomy.js';

const AX = 2.6; // бозайникът

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Отделяне при растенията', 'Отделяне при бозайника', 'Ако отделянето спре'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xe8f5e9, camPos: [0, 4, 10], target: [0, 1, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14, d: 4.8, color: 0xd7ccc8 });
  const tag = (g, t, y, s = 0.2) => { const l = labelSprite(t, { size: s }); l.position.y = y; g.add(l); stage.steadyLabel(l, 8); return l; };
  const note = document.createElement('div');
  note.textContent = '⚠ Животното е схема, не е в мащаб';
  note.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:4;pointer-events:none;background:rgba(255,255,255,.9);color:#8a6d00;font-size:.78rem;border-radius:8px;padding:3px 8px';
  shell.stageEl.appendChild(note);

  // ---------- Растение с торбичка ----------
  const plant = new THREE.Group();
  { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.5, 18), mat(0xd7774a)); pot.position.y = 0.25; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.4, 8), mat(0x558b2f)); st.position.y = 1.2; plant.add(pot, st);
    for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat(0x43a047)); l.scale.set(0.28, 0.03, 0.14); const s = i % 2 ? 1 : -1; l.position.set(s * 0.22, 0.9 + i * 0.17, 0); l.rotation.z = s * 0.4; plant.add(l); } }
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.1, depthWrite: false }));
  bag.scale.set(1, 1.15, 0.8); bag.position.set(0.25, 1.6, 0); plant.add(bag);
  const drops = [];
  for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshStandardMaterial({ color: 0xb3e5fc, roughness: 0.05 })); const a = Math.random() * Math.PI * 2; const b = Math.random() * Math.PI; d.position.set(0.25 + Math.cos(a) * Math.sin(b) * 0.4, 1.6 + Math.cos(b) * 0.46, Math.sin(a) * Math.sin(b) * 0.32); d.visible = false; d.userData.k = Math.random(); plant.add(d); drops.push(d); }
  const vapor = flowDots(curveOf([[0.15, 1.45, 0.02], [0.25, 1.65, 0.05], [0.35, 1.8, 0.02]]), { n: 6, r: 0.025, color: 0xe1f5fe, speed: 0.2 }); vapor.visible = false; plant.add(vapor);
  plant.position.set(-4.6, 0, 0.2);
  plant.userData.pickId = 'leaf';
  tag(plant, 'растение с торбичка', 2.35);
  scene.add(plant); addHitBox(plant, 0.8);
  const bagAt = new THREE.Object3D(); bagAt.position.set(-4.35, 1.6, 0.2); scene.add(bagAt);
  const T = { wet: 0, wetT: 0 };

  // ---------- Есенно дърво ----------
  const tree = new THREE.Group();
  { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 10), mat(0x6d4c41)); tr.position.y = 0.8; tree.add(tr);
    for (const [x, y, z] of [[0, 2.0, 0], [0.4, 1.7, 0.1], [-0.4, 1.75, -0.1], [0.1, 1.6, 0.4]]) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), mat(0x6d4c41)); b.position.set(x, y, z); tree.add(b); } }
  const leaves = [];
  const leafCols = [0xffb300, 0xe65100, 0xfdd835, 0xbf360c, 0x8bc34a];
  for (let i = 0; i < 70; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), mat(leafCols[i % 5], { side: THREE.DoubleSide })); const home = new THREE.Vector3((Math.random() - 0.5) * 1.3, 1.5 + Math.random() * 0.8, (Math.random() - 0.5) * 1.0); l.position.copy(home); l.rotation.set(Math.random() * 3, Math.random() * 3, 0); l.userData = { home, fall: 0, v: 0.25 + Math.random() * 0.3, delay: Math.random() * 3 }; tree.add(l); leaves.push(l); }
  tree.position.set(-2.4, 0, -1.2);
  tree.userData.pickId = 'autumn';
  tag(tree, 'есенно дърво', 2.7);
  scene.add(tree); addHitBox(tree, 0.8);
  const A = { on: false, t: 0 };

  // ---------- Схема на бозайник ----------
  const animal = new THREE.Group();
  const fur = glassMat(0xd7b899, 0.28);
  { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 26, 18), fur); b.scale.set(1.25, 0.6, 0.55); b.position.y = 1.1; const h = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 14), fur); h.position.set(1.4, 1.5, 0); const sn = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), fur); sn.position.set(1.75, 1.4, 0); animal.add(b, h, sn);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0x212121)); e.position.set(1.65, 1.6, s * 0.17); animal.add(e); const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), fur); ear.position.set(1.3, 1.9, s * 0.2); animal.add(ear);
      for (const x of [-0.8, 0.8]) { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.6, 4, 8), fur); leg.position.set(x, 0.38, s * 0.3); animal.add(leg); } }
    const tl = new THREE.Mesh(new THREE.TubeGeometry(curveOf([[-1.2, 1.2, 0], [-1.55, 1.45, 0], [-1.7, 1.7, 0]]), 10, 0.05, 6), fur); animal.add(tl); }
  // органи
  const lungs = [];
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), organMat(0xf28b97, { emissive: 0x4fc3f7, emissiveIntensity: 0 })); l.scale.set(1.2, 0.9, 0.7); l.position.set(0.75, 1.2, s * 0.15); animal.add(l); lungs.push(l); }
  const kidneys = [];
  for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), organMat(0x8e3b2f, { emissive: 0xffeb3b, emissiveIntensity: 0 })); k.scale.set(0.7, 1.1, 0.6); k.position.set(-0.2, 1.3, s * 0.2); animal.add(k); kidneys.push(k); }
  const bladder = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), organMat(0xf5d76e, { emissive: 0xffeb3b, emissiveIntensity: 0 })); bladder.position.set(-0.95, 0.85, 0); animal.add(bladder);
  for (const s of [-1, 1]) animal.add(new THREE.Mesh(new THREE.TubeGeometry(curveOf([[-0.2, 1.2, s * 0.2], [-0.6, 1.0, s * 0.1], [-0.92, 0.88, 0]]), 12, 0.018, 5), organMat(0xf5d76e)));
  // кожа с потни капчици (отзад на гърба)
  const sweat = [];
  for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb3e5fc, roughness: 0.05 })); d.position.set(-0.5 + i * 0.15, 1.68, 0.12 + (i % 2) * 0.1); d.userData.k = i / 8; animal.add(d); sweat.push(d); }
  // кръв: от клетките (в крака) до бъбреците, белите дробове и кожата
  const cells = new THREE.Group();
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), organMat(0xf8bbd0)); c.position.set(0.75 + (i % 3) * 0.06, 0.25 + Math.floor(i / 3) * 0.07, 0.35); cells.add(c); }
  animal.add(cells);
  const bloodC = curveOf([[0.78, 0.3, 0.35], [0.5, 0.8, 0.3], [-0.2, 1.25, 0.28], [-0.4, 1.5, 0.25], [0.2, 1.55, 0.25], [0.75, 1.25, 0.28], [0.9, 0.7, 0.33], [0.78, 0.3, 0.35]], true);
  animal.add(new THREE.Mesh(new THREE.TubeGeometry(bloodC, 60, 0.022, 6, true), organMat(0xd32f2f)));
  const waste = flowDots(bloodC, { n: 16, r: 0.03, color: 0xfdd835, speed: 0.55 }); animal.add(waste);
  const waste2 = flowDots(bloodC, { n: 22, r: 0.034, color: 0xf9a825, speed: 0.5 }); waste2.visible = false; animal.add(waste2);
  const urine = flowDots(curveOf([[-0.2, 1.2, 0.2], [-0.6, 1.0, 0.1], [-0.92, 0.88, 0]]), { n: 5, r: 0.022, color: 0xfbc02d, speed: 0.25 }); animal.add(urine);
  const co2 = flowDots(curveOf([[0.75, 1.25, 0], [1.3, 1.35, 0], [1.75, 1.42, 0], [2.2, 1.5, 0]]), { n: 6, r: 0.03, color: 0x9e9e9e, speed: 0.4 }); co2.visible = false; animal.add(co2);
  animal.position.set(AX, 0, 0.1);
  animal.userData.pickId = 'animal';
  tag(animal, 'бозайник (схема)', 2.3);
  scene.add(animal); addHitBox(animal, 1);
  const anchor = (p) => { const o = new THREE.Object3D(); o.position.set(...p); animal.add(o); return o; };
  const kidAt = anchor([-0.2, 1.3, 0.25]); const lungAt = anchor([0.75, 1.3, 0.2]); const skinAt = anchor([0.0, 1.7, 0.2]); const vesAt = anchor([0.5, 0.8, 0.3]);
  kidAt.userData.pickId = 'kidney'; lungAt.userData.pickId = 'lungs'; skinAt.userData.pickId = 'skin'; vesAt.userData.pickId = 'vessel';
  for (const [o, s] of [[kidAt, 0.3], [lungAt, 0.35], [skinAt, 0.3], [vesAt, 0.25]]) o.add(new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
  const B = { stop: false, dirty: 0 };

  stage.tick((dt, t) => {
    T.wet += (T.wetT - T.wet) * Math.min(1, dt * 0.7);
    drops.forEach((d) => { d.visible = d.userData.k < T.wet; });
    vapor.visible = T.wetT > 0; if (vapor.visible) vapor.userData.update(dt);
    plant.children.forEach((c, i) => { if (i > 1 && i < 8) c.rotation.x = Math.sin(t * 1.3 + i) * 0.05; });
    if (A.on) A.t += dt;
    for (const l of leaves) {
      const u = l.userData;
      if (A.on && A.t > u.delay && l.position.y > 0.03) { l.position.y = Math.max(0.03, l.position.y - u.v * dt); l.position.x += Math.sin(t * 2 + u.delay * 5) * 0.004; l.rotation.x += dt * 2; }
      else if (!A.on) { l.position.copy(u.home); l.rotation.z = Math.sin(t + u.delay) * 0.2; }
    }
    waste.userData.update(dt);
    urine.visible = !B.stop; if (urine.visible) urine.userData.update(dt);
    if (co2.visible) co2.userData.update(dt);
    B.dirty += ((B.stop ? 1 : 0) - B.dirty) * Math.min(1, dt * 0.5);
    waste.material.color.setRGB(0.99, 0.85 - B.dirty * 0.35, 0.21 - B.dirty * 0.1);
    waste2.visible = B.dirty > 0.25; if (waste2.visible) waste2.userData.update(dt);
    cells.children.forEach((c, i) => c.material.color.setRGB(0.97 - B.dirty * 0.3, 0.73 - B.dirty * 0.25, 0.82 - B.dirty * 0.4 + Math.sin(t * 3 + i) * 0.02));
    kidneys.forEach((k) => { k.material.emissiveIntensity = B.stop ? 0 : 0.15 + Math.sin(t * 3) * 0.1; });
    bladder.scale.setScalar(1 + ((t * 0.08) % 0.4));
    const br = Math.sin(t * 2.4); lungs.forEach((l) => l.scale.set(1.2 + br * 0.07, 0.9 + br * 0.05, 0.7));
    sweat.forEach((d) => { const k = (d.userData.k + t * 0.15) % 1; d.position.y = 1.68 + k * 0.05; d.material.opacity = 1; d.scale.setScalar(0.5 + k); });
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    T.wet = 0; T.wetT = 0; A.on = false; A.t = 0; B.stop = false; B.dirty = 0; co2.visible = false;
    view(ctx, [-1.0, 1.1, -0.2], 5.8, { halfH: 2.1 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p><b>Отделянето</b> е жизнен процес: организмът изхвърля излишните и вредните вещества.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'leaf', label: 'Лист с устица', icon: '🍃', note: 'По листата има малки отвори — <b>устица</b>. През тях растението отделя <b>водна пара</b> и газове.', obj: () => bagAt, dist: 2.4 },
        { id: 'autumn', label: 'Есенно дърво', icon: '🍂', note: 'През лятото в листата се натрупват ненужни вещества. Есента дървото ги изхвърля заедно с листата: <b>листопад</b>.', obj: () => tree, dist: 4, lift: 1.3, bubble: 1.6 },
        { id: 'kidney', label: 'Бъбрек', icon: '🫘', note: '<b>Бъбреците</b> пречистват кръвта и образуват <b>урина</b>. Тя се събира в пикочния мехур.', obj: () => kidAt, dist: 2.4 },
        { id: 'vessel', label: 'Кръвоносен съд', icon: '🩸', note: '<b>Кръвта</b> взема ненужните вещества от клетките (жълтите точки) и ги носи до органите, които ги изхвърлят.', obj: () => vesAt, dist: 2.4 },
        { id: 'skin', label: 'Кожа с потни жлези', icon: '💧', note: 'Чрез <b>потта</b> кожата отделя вода и соли.', obj: () => skinAt, dist: 2.4 },
        { id: 'lungs', label: 'Бели дробове', icon: '🫁', note: 'С издишания въздух белите дробове отделят <b>въглероден диоксид</b> и водна пара.', obj: () => lungAt, dist: 2.4 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Растенията ----------
  function step2() {
    shell.step(1);
    view(ctx, [-4.4, 1.3, 0.2], 1.3, { halfH: 1.3, elev: 0.2 });
    shell.task('<p>Сложихме прозрачна найлонова торбичка върху клонка и я завързахме. Растението стои на слънце.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще се появи в торбичката след няколко часа?',
      options: [
        { t: 'Капки вода: листата отделят водна пара.', ok: true, why: 'Да проверим!' },
        { t: 'Нищо: растенията не отделят нищо.', ok: false, why: 'Растенията дишат и правят фотосинтеза. Отделят ли нещо през листата?' },
        { t: 'Пръст от саксията.', ok: false, why: 'Торбичката е около листата, а не около пръстта. Какво може да излезе от листата?' },
      ],
      hint: 'Помисли какво излиза през устицата.',
      onRight: (m) => { mistakes = m; wait(); },
    });
    function wait() {
      const c = shell.controls;
      c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary sun">☀ Няколко часа на слънце</button></div>');
      c.querySelector('.sun').addEventListener('click', () => {
        c.querySelector('.sun').disabled = true;
        T.wetT = 1;
        setTimeout(() => {
          ctx.say(bagAt, 'Водата се изпарява от листата. Това се нарича <b>транспирация</b>. Парата се охлади по найлона и стана на <b>капки вода</b>. Тази вода не е образувана в клетките — корените са я поели от почвата. Тя не е вредна. Тук я броим към отделянето, защото растението я изхвърля навън.', 'wide', 0.6);
          const cc = shell.setControls('<div class="row"><button class="btn primary fall">🍂 Дойде есента</button></div>');
          cc.querySelector('.fall').addEventListener('click', () => {
            cc.querySelector('.fall').disabled = true;
            ctx.clearTip();
            view(ctx, [-2.4, 1.2, -1.2], 1.4, { halfH: 1.5, elev: 0.25 });
            A.on = true; A.t = 0;
            setTimeout(() => {
              choice(ctx, {
                q: 'Как дърветата се освобождават от част от натрупаните ненужни вещества?',
                options: [
                  { t: 'С окапването на листата (листопада).', ok: true, why: 'Вярно! Ненужните вещества се натрупват в листата и окапват с тях. Листопадът помага и иначе: през зимата дървото губи по-малко вода.' },
                  { t: 'С цветовете през пролетта.', ok: false, why: 'Цветовете служат за размножаване. Какво става с листата наесен?' },
                  { t: 'Чрез корените нагоре.', ok: false, why: 'Корените поемат вода. Какво пада от дървото наесен?' },
                ],
                hint: 'Какво се случва есента?',
                mistakes,
                onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
              });
            }, 2500);
          }, { once: true });
        }, 3000);
      }, { once: true });
    }
  }

  // ---------- 3. Бозайникът ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    co2.visible = true;
    view(ctx, [AX + 0.2, 1.1, 0.1], 2.3, { halfH: 1.3, elev: 0.2 });
    shell.task('<p>Жълтите точки са ненужните вещества в кръвта. Кои органи ги изхвърлят?</p>'
      + '<p class="small">Подробния път на урината ще учиш в урока „Отделителна система на човека“.</p>');
    const look = (o, t) => () => ctx.say(o, t, 'tag', 0.3);
    sortTask(ctx, {
      bins: ['Бъбреци', 'Бели дробове', 'Кожа'],
      items: [
        { t: 'урина (вода и ненужни вещества)', bin: 0, show: look(kidAt, 'бъбреци'), why: 'Бъбреците пречистват кръвта и образуват урина.' },
        { t: 'въглероден диоксид', bin: 1, show: look(lungAt, 'бели дробове'), why: 'Въглеродният диоксид се издишва.' },
        { t: 'пот (вода и соли)', bin: 2, show: look(skinAt, 'кожа'), why: 'Потта излиза през кожата.' },
      ],
      hint: 'Кое се издишва, кое излиза с потта?',
      onDone: (m) => {
        ctx.clearTip();
        orderTask(ctx, {
          q: 'Проследи по схема отделянето на ненужните вещества с урината.',
          items: ['клетки', 'кръв', 'бъбреци', 'навън с урината'],
          hint: 'Кръвта взема веществата от клетките и ги носи до бъбреците.',
          mistakes: m,
          onDone: (m2) => { ctx.scores[1] = stepScore(m2, 3); nextBtn(ctx, 'Напред →', step4); },
        });
      },
    });
  }

  // ---------- 4. Ако отделянето спре ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [AX + 0.2, 1.1, 0.1], 2.3, { halfH: 1.3, elev: 0.2 });
    shell.task('<p>Представи си, че бъбреците спрат да работят.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще се случи в организма?',
      options: [
        { t: 'Ненужните вещества ще се натрупват в кръвта и ще вредят на клетките.', ok: true, why: 'Да проверим в схемата!' },
        { t: 'Нищо: кръвта сама ще се изчисти.', ok: false, why: 'Кой орган пречиства кръвта от ненужните вещества?' },
        { t: 'Всичко ще излезе с потта.', ok: false, why: 'С потта излиза само малка част. Кой орган пречиства кръвта?' },
      ],
      hint: 'Бъбреците пречистват кръвта.',
      onRight: (m) => {
        mistakes = m;
        const c = shell.controls;
        c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary stop">⏸ Спри бъбреците (в модела)</button></div>');
        c.querySelector('.stop').addEventListener('click', () => {
          c.querySelector('.stop').disabled = true;
          B.stop = true;
          setTimeout(() => {
            ctx.say(vesAt, 'Жълтите точки в кръвта стават все повече, а клетките страдат. Затова отделянето е жизнено важно.', 'wide', 0.5);
            const cc = shell.setControls('<div class="row"><button class="btn back">▶ Пусни ги отново</button></div>');
            cc.querySelector('.back').addEventListener('click', () => {
              B.stop = false;
              ctx.clearTip();
              choice(ctx, {
                q: 'Защо отделянето е важно за всички организми?',
                options: [
                  { t: 'Така организмът се освобождава от вредните вещества и клетките остават здрави.', ok: true, why: 'Вярно! Хранене, дишане и отделяне са свързани: кръвта носи и полезното, и ненужното.' },
                  { t: 'Само за да има място за нова храна.', ok: false, why: 'Отделянето чисти кръвта от вредни вещества. Какво ще стане, ако останат?' },
                  { t: 'Важно е само за растенията.', ok: false, why: 'Видя бъбреците, белите дробове и кожата на бозайника.' },
                ],
                hint: 'Спомни си какво стана с клетките в модела.',
                mistakes,
                onRight: (m2) => { ctx.scores[2] = stepScore(m2, 3); finishBtn(ctx, onComplete, restart); },
              });
            }, { once: true });
          }, 3500);
        }, { once: true });
      },
    });
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    ctx.answer = null;
    step1();
  }
  step1();
  return { dispose() { note.remove(); stage.dispose(); } };
}
