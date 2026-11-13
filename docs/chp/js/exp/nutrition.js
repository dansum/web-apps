// 5.3.2 „Хранене при растения и животни“ — растение в саксия в разрез и заек с прозрачно тяло (схема, не в мащаб).
// Стъпки: опознай → самостойно хранене: какво влиза в листа и какво излиза → несамостойно хранене: пътят на храната до клетките
// → сравни и предскажи.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, view, stepScore } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { curveOf, flowDots, glassMat, organMat } from './anatomy.js';

const PX = -2.6; // растението
const RX = 2.4;  // заекът

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Как се храни растението', 'Как се храни животното', 'Сравни и предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xe3f2fd, camPos: [0, 4, 10], target: [0, 1.2, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 13, d: 4.6, color: 0xc8e6c9 });
  const tag = (g, t, y, s = 0.2) => { const l = labelSprite(t, { size: s }); l.position.y = y; g.add(l); stage.steadyLabel(l, 8); return l; };
  const note = document.createElement('div');
  note.textContent = '⚠ Схема, не е в мащаб';
  note.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:4;pointer-events:none;background:rgba(255,255,255,.9);color:#8a6d00;font-size:.78rem;border-radius:8px;padding:3px 8px';
  shell.stageEl.appendChild(note);

  // ---------- Слънце ----------
  const sun = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd54a })); sun.add(b);
    for (let i = 0; i < 10; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 6), new THREE.MeshBasicMaterial({ color: 0xffb300 })); const a = i * Math.PI / 5; r.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0); r.rotation.z = a - Math.PI / 2; sun.add(r); } }
  sun.position.set(PX - 2.2, 3.6, -1.2);
  sun.userData.pickId = 'sun'; scene.add(sun); addHitBox(sun, 1);
  const rays = [];
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), new THREE.MeshBasicMaterial({ color: 0xffca28, transparent: true, opacity: 0.8 })); r.visible = false; scene.add(r); rays.push(r); }

  // ---------- Растение в саксия (в разрез) ----------
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.55, 1.0, 28, 1, true, 0, Math.PI * 1.5), mat(0xd7774a, { side: THREE.DoubleSide })); pot.position.y = 0.5; pot.rotation.y = Math.PI * 0.25;
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.53, 0.92, 28, 1, false, 0, Math.PI * 1.5), mat(0x6d4c41)); soil.position.y = 0.48; soil.rotation.y = Math.PI * 0.25;
  plant.add(pot, soil);
  const rootsG = new THREE.Group();
  const rootM = mat(0xefe3c8);
  for (let i = 0; i < 6; i++) { const a = i * 1.05; const pts = [[0, 0.95, 0], [Math.cos(a) * 0.15, 0.6, Math.sin(a) * 0.15 + 0.2], [Math.cos(a) * 0.35, 0.25, Math.sin(a) * 0.3 + 0.25]]; rootsG.add(new THREE.Mesh(new THREE.TubeGeometry(curveOf(pts), 10, 0.02, 5), rootM)); }
  plant.add(rootsG);
  const stemC = curveOf([[0, 0.95, 0.15], [0.05, 1.6, 0.15], [-0.03, 2.3, 0.15], [0, 2.9, 0.15]]);
  plant.add(new THREE.Mesh(new THREE.TubeGeometry(stemC, 16, 0.05, 8), mat(0x558b2f)));
  const leafM = mat(0x43a047, { side: THREE.DoubleSide, emissive: 0x76ff03, emissiveIntensity: 0 });
  const leaves = [];
  [[1.5, 1], [2.0, -1], [2.5, 1], [2.85, -1]].forEach(([y, s]) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), leafM); l.scale.set(0.42, 0.04, 0.2); l.position.set(s * 0.38, y, 0.15); l.rotation.z = s * 0.35; plant.add(l); leaves.push(l);
  });
  plant.position.set(PX, 0, 0);
  plant.userData.pickId = 'plant';
  scene.add(plant); addHitBox(plant, 1);
  const leafAt = new THREE.Object3D(); leafAt.position.set(PX + 0.4, 2.5, 0.15); scene.add(leafAt);
  leafAt.userData.pickId = 'leaf'; { const h = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); leafAt.add(h); }
  const rootsAt = new THREE.Object3D(); rootsAt.position.set(PX + 0.2, 0.5, 0.3); scene.add(rootsAt);
  rootsAt.userData.pickId = 'roots'; { const h = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.5), new THREE.MeshBasicMaterial({ visible: false })); rootsAt.add(h); }
  // потоци: вода нагоре, CO₂ към листа, O₂ навън, захар надолу
  const W = (pts) => curveOf(pts.map(([x, y, z]) => [x + PX, y, z]));
  const flows = {
    water: flowDots(W([[0.3, 0.3, 0.45], [0.05, 0.95, 0.15], [0.03, 1.8, 0.15], [0.1, 2.4, 0.15], [0.4, 2.5, 0.15]]), { n: 12, r: 0.04, color: 0x29b6f6, speed: 0.5 }),
    co2: flowDots(W([[1.6, 3.0, 0.3], [1.0, 2.7, 0.2], [0.45, 2.52, 0.15]]), { n: 8, r: 0.045, color: 0x9e9e9e, speed: 0.45 }),
    o2: flowDots(W([[0.45, 2.55, 0.18], [0.9, 3.0, 0.4], [1.3, 3.6, 0.6]]), { n: 8, r: 0.045, color: 0xe3f2fd, speed: 0.45 }),
    sugar: flowDots(W([[0.4, 2.5, 0.15], [0.0, 2.2, 0.17], [0.0, 1.2, 0.17], [0.15, 0.5, 0.35]]), { n: 10, r: 0.04, color: 0xffa726, speed: 0.4 }),
  };
  for (const f of Object.values(flows)) { f.visible = false; scene.add(f); }
  const P = { water: false, co2: false, light: false, make: false };

  // ---------- Трева ----------
  const grass = new THREE.Group();
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.45 + Math.random() * 0.2, 4), mat(0x7cb342)); b.position.set((Math.random() - 0.5) * 0.6, 0.25, (Math.random() - 0.5) * 0.4); b.rotation.z = (Math.random() - 0.5) * 0.4; grass.add(b); }
  grass.position.set(RX + 1.9, 0, 0.6);
  scene.add(grass);

  // ---------- Заек с прозрачно тяло ----------
  const rabbit = new THREE.Group();
  const fur = glassMat(0xd7ccc8, 0.32);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), fur); body.scale.set(1.0, 0.62, 0.55); body.position.set(0, 0.85, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 22, 16), fur); head.position.set(0.95, 1.35, 0);
  rabbit.add(body, head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.45, 4, 10), fur); ear.position.set(0.85, 1.85, s * 0.12); ear.rotation.z = 0.25; rabbit.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(0x212121)); eye.position.set(1.17, 1.43, s * 0.17); rabbit.add(eye);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 4, 8), fur); leg.position.set(-0.6, 0.3, s * 0.3); leg.rotation.z = 0.8; rabbit.add(leg);
    const fl = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 8), fur); fl.position.set(0.6, 0.3, s * 0.25); rabbit.add(fl);
  }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), mat(0xffffff)); tail.position.set(-1.0, 0.95, 0); rabbit.add(tail);
  // храносмилателна тръба
  const gutPts = [[1.25, 1.25, 0], [1.0, 1.15, 0], [0.7, 1.0, 0], [0.35, 0.95, 0], [0.1, 0.8, 0.05], [-0.15, 0.85, 0.1], [-0.3, 0.65, 0.05], [-0.05, 0.6, 0.1], [-0.4, 0.75, 0.05], [-0.75, 0.8, 0]];
  const gutC = curveOf(gutPts);
  const gutM = organMat(0xf4a582, { emissive: 0xff7043, emissiveIntensity: 0 });
  rabbit.add(new THREE.Mesh(new THREE.TubeGeometry(gutC, 60, 0.05, 8), gutM));
  const stomach = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), organMat(0xffab91, { emissive: 0xff7043, emissiveIntensity: 0 })); stomach.scale.set(1.2, 0.8, 0.8); stomach.position.set(0.35, 0.97, 0); rabbit.add(stomach);
  const stomachAt = stomach;
  // кръвоносни съдове и „клетки“ в мускула на крака
  const bloodC = curveOf([[0.0, 0.72, 0.18], [-0.3, 0.55, 0.22], [-0.55, 0.35, 0.3], [-0.65, 0.18, 0.3], [-0.45, 0.4, 0.25], [-0.1, 0.7, 0.2], [0.3, 1.05, 0.15], [0.0, 0.72, 0.18]], true);
  rabbit.add(new THREE.Mesh(new THREE.TubeGeometry(bloodC, 60, 0.025, 6, true), organMat(0xd32f2f)));
  const cells = new THREE.Group();
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), organMat(0xf8bbd0, { emissive: 0xff4081, emissiveIntensity: 0 })); c.position.set(-0.68 + (i % 3) * 0.07, 0.12 + Math.floor(i / 3) * 0.08, 0.36); cells.add(c); }
  rabbit.add(cells);
  rabbit.position.set(RX, 0, 0);
  rabbit.userData.pickId = 'rabbit';
  scene.add(rabbit); addHitBox(rabbit, 1);
  const bolus = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0x9ccc65)); bolus.visible = false; rabbit.add(bolus);
  const nutri = flowDots(bloodC, { n: 14, r: 0.035, color: 0xffa726, speed: 0.6 }); nutri.visible = false; rabbit.add(nutri);
  const cellsAt = new THREE.Object3D(); cellsAt.position.set(RX - 0.64, 0.2, 0.36); scene.add(cellsAt);
  const R = { trip: -1 };

  stage.tick((dt, t) => {
    for (const [k, f] of Object.entries(flows)) { f.userData.update(dt); f.visible = (k === 'water' && P.water) || (k === 'co2' && P.co2) || ((k === 'o2' || k === 'sugar') && P.make); }
    rays.forEach((r, i) => {
      r.visible = P.light;
      const a = sun.position; const b = new THREE.Vector3(PX + 0.2 + i * 0.15, 2.0 + i * 0.25, 0.15);
      const d = b.clone().sub(a); const L = d.length() * (0.7 + 0.3 * ((t * 0.8 + i * 0.25) % 1));
      r.scale.y = L; r.position.copy(a).addScaledVector(d.normalize(), L / 2); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    });
    leafM.emissiveIntensity = P.make ? 0.25 + Math.sin(t * 3) * 0.1 : 0;
    sun.rotation.z = t * 0.2;
    leaves.forEach((l, i) => { l.rotation.x = Math.sin(t * 1.2 + i) * 0.06; });
    grass.children.forEach((b, i) => { b.rotation.x = Math.sin(t * 1.5 + i) * 0.08; });
    // заекът диша и мърда ушите
    body.scale.y = 0.62 + Math.sin(t * 2.5) * 0.012;
    if (R.trip >= 0) {
      R.trip = Math.min(1, R.trip + dt * 0.22);
      gutC.getPointAt(R.trip, bolus.position);
      bolus.visible = R.trip < 0.98;
      bolus.scale.setScalar(1 - R.trip * 0.6);
      gutM.emissiveIntensity = R.trip > 0.45 && R.trip < 0.9 ? 0.5 : 0;
      stomach.material.emissiveIntensity = R.trip > 0.3 && R.trip < 0.5 ? 0.5 : 0;
      if (R.trip > 0.5) nutri.visible = true;
    }
    if (nutri.visible) { nutri.userData.update(dt); cells.children.forEach((c, i) => { c.material.emissiveIntensity = 0.3 + Math.sin(t * 3 + i) * 0.2; }); }
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    Object.assign(P, { water: false, co2: false, light: false, make: false });
    R.trip = -1; bolus.visible = false; nutri.visible = false; gutM.emissiveIntensity = 0; stomach.material.emissiveIntensity = 0;
    cells.children.forEach((c) => { c.material.emissiveIntensity = 0; });
    view(ctx, [0, 1.4, 0], 5.2, { halfH: 2.4 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p><b>Храненето</b> е жизнен процес: организмът набавя вещества и енергия, за да расте и да живее. Жизнените процеси протичат в живите организми и поддържат живота им.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'sun', label: 'Слънцето', icon: '☀', note: 'Слънчевата светлина дава енергия на растенията, за да си изграждат храна.', obj: () => sun, dist: 3.5 },
        { id: 'leaf', label: 'Зелен лист', icon: '🍃', note: 'В зелените листа растението изгражда <b>органични вещества</b> (захар, нишесте). Този процес се нарича <b>фотосинтеза</b>.', obj: () => leafAt, dist: 2.4 },
        { id: 'roots', label: 'Корени', icon: '🌱', note: 'С корените растението поема от почвата <b>вода</b> и разтворени в нея <b>минерални соли</b>. Това са вещества от почвата, нужни за растежа.', obj: () => rootsAt, dist: 2.6 },
        { id: 'rabbit', label: 'Заек', icon: '🐇', note: 'Заекът не може да си направи храна сам. Той яде трева — <b>готови органични вещества</b>.', obj: () => rabbit, dist: 4, lift: 0.8, bubble: 1.4 },
        { id: 'stomach', label: 'Стомах на заека', icon: '🟠', note: 'В стомаха и в червата храната се <b>смила</b> до хранителни вещества, които минават в кръвта.', obj: () => stomachAt, dist: 2.4 },
      ],
      onNext: step2,
    });
  }
  stomach.userData.pickId = 'stomach';

  // ---------- 2. Растението ----------
  function step2() {
    shell.step(1);
    view(ctx, [PX - 0.3, 1.8, 0], 2.4, { halfH: 2.1, elev: 0.25 });
    shell.task('<p>Растението расте: стъблото и листата му стават все повече. Откъде взема веществата?</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'От какво растението изгражда веществата, от които расте?',
      options: [
        { t: 'Изгражда ги в листата от вода и въглероден диоксид с помощта на светлината. От почвата взема и минерални соли.', ok: true, why: 'Да проверим! Дай на листа каквото му трябва.' },
        { t: 'Яде готова храна от почвата.', ok: false, why: 'От почвата корените поемат вода и минерални соли. Има ли там готова храна за растението?' },
        { t: 'Взема ги от въздуха нощем.', ok: false, why: 'Какво е нужно на зеления лист, за да работи? Свети ли нощем?' },
      ],
      hint: 'Помисли какво поемат корените и какво листата.',
      onRight: (m) => { mistakes = m; supply(); },
    });
    function supply() {
      shell.task('<p>Дай на листа всичко, което му трябва за <b>фотосинтеза</b>. Внимавай: едно от нещата не е нужно.</p>');
      const c = shell.setControls(`<div class="choices">
        <button class="choice in" data-k="water">💧 Вода (през корените)</button>
        <button class="choice in" data-k="co2">💨 Въглероден диоксид (от въздуха)</button>
        <button class="choice in" data-k="light">☀ Светлина</button>
        <button class="choice in" data-k="food">🍞 Готова храна от почвата</button></div>`);
      c.querySelectorAll('.in').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        const k = b.dataset.k;
        if (k === 'food') {
          mistakes++;
          b.classList.add('wrong'); b.disabled = true;
          shell.msg(`Растението не яде готова храна — то я прави само.${mistakes >= 2 ? ' Подсказка: трябват вода, въглероден диоксид и светлина.' : ''}`, 'bad');
          return;
        }
        b.classList.add('right'); b.disabled = true;
        P[k] = true;
        shell.msg({ water: 'Водата тръгна от корените нагоре по стъблото.', co2: 'Въглеродният диоксид влиза в листа през малки отвори.', light: 'Светлината огря листата.' }[k], 'good');
        if (P.water && P.co2 && P.light) {
          c.querySelectorAll('.in').forEach((x) => { x.disabled = true; });
          setTimeout(() => {
            P.make = true;
            ctx.say(leafAt, 'Листът изгражда <b>органични вещества</b> (оранжево): те отиват към стъблото и корените. Навън излиза <b>кислород</b> (бяло).', 'wide', 0.5);
            choice(ctx, {
              q: 'Какво отделя растението при фотосинтезата?',
              options: [
                { t: 'Кислород', ok: true, why: 'Вярно! Кислородът, който дишаме, идва от фотосинтезата.' },
                { t: 'Въглероден диоксид', ok: false, why: 'Въглеродният диоксид влезе в листа. Какво излезе навън?' },
                { t: 'Минерални соли', ok: false, why: 'Солите идват от почвата. Виж белите точки, които излизат от листа.' },
              ],
              hint: 'Белите точки.',
              mistakes,
              onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
            });
          }, 1200);
        }
      }));
    }
  }

  // ---------- 3. Животното ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    view(ctx, [RX + 0.3, 1.0, 0], 2.1, { halfH: 1.3, elev: 0.2 });
    shell.task('<p>Заекът се храни <b>несамостойно</b>: яде готова храна. Проследи какво става с нея.</p>');
    const c = shell.setControls('<div class="row"><button class="btn primary feed">🌿 Нахрани заека</button></div>');
    c.querySelector('.feed').addEventListener('click', () => {
      c.querySelector('.feed').disabled = true;
      R.trip = 0;
      setTimeout(() => ctx.say(stomach, 'Храната се смила в стомаха и в червата.', 'tag', 0.3), 1800);
      setTimeout(() => {
        ctx.say(cellsAt, 'Хранителните вещества минават от червата в <b>кръвта</b>. Кръвта ги носи до всички <b>клетки</b> в тялото.', 'wide', 0.3);
        orderTask(ctx, {
          q: 'Подреди пътя на храната при животното.',
          items: ['храна', 'уста', 'хранопровод', 'стомах', 'черва', 'кръв', 'клетки'],
          hint: 'Храната се смила, а после кръвта я разнася.',
          onDone: (m) => {
            ctx.clearTip();
            sortTask(ctx, {
              lead: 'Кои органи са от <b>храносмилателната система</b>?',
              bins: ['Храносмилателна система', 'Друга система'],
              items: [
                { t: 'стомах', bin: 0, why: 'Стомахът смила храната.' },
                { t: 'черва', bin: 0, why: 'В червата храната се смила докрай и хранителните вещества минават в кръвта.' },
                { t: 'уста и зъби', bin: 0, why: 'В устата храната се раздробява.' },
                { t: 'хранопровод', bin: 0, why: 'По хранопровода храната слиза до стомаха.' },
                { t: 'бели дробове', bin: 1, why: 'Белите дробове са от дихателната система.' },
                { t: 'сърце', bin: 1, why: 'Сърцето изпомпва кръвта — кръвоносна система.' },
              ],
              hint: 'По кои органи минава храната?',
              mistakes: m,
              onDone: (m2) => { ctx.scores[1] = stepScore(m2, 3); shell.msg('Браво!', 'good'); nextBtn(ctx, 'Напред →', step4); },
            });
          },
        });
      }, 4800);
    }, { once: true });
  }

  // ---------- 4. Сравни и предскажи ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [0, 1.4, 0], 5.2, { halfH: 2.4 });
    shell.task('<p><b>Самостойно</b> хранене: организмът сам си изгражда храната. <b>Несамостойно</b>: приема готова храна.</p>');
    sortTask(ctx, {
      bins: ['Самостойно', 'Несамостойно'],
      items: [
        { t: 'дъб', bin: 0, why: 'Дъбът е зелено растение — прави си храна чрез фотосинтеза.' },
        { t: 'водорасло', bin: 0, why: 'Водораслите са зелени и правят фотосинтеза.' },
        { t: 'заек', bin: 1, why: 'Заекът яде растения.' },
        { t: 'вълк', bin: 1, why: 'Вълкът яде други животни.' },
        { t: 'гъба печурка', bin: 1, why: 'Гъбите не са зелени и не правят фотосинтеза. Хранят се несамостойно.', no: 'Гъбата расте като растение, но зелена ли е? Може ли да прави фотосинтеза?' },
      ],
      hint: 'Само зелените организми правят фотосинтеза.',
      onDone: (m) => {
        P.light = false; P.make = false;
        view(ctx, [PX - 0.3, 1.8, 0], 2.4, { halfH: 2.1, elev: 0.25 });
        shell.task('<p>Предскажи.</p>');
        choice(ctx, {
          q: 'Растението остава две седмици в пълна тъмнина. Какво ще стане?',
          options: [
            { t: 'Ще пожълтее и ще отслабне: без светлина не може да си прави храна.', ok: true, why: 'Вярно! Без храна организмите не могат да растат и да живеят.' },
            { t: 'Ще расте по-бързо, защото ще си почива.', ok: false, why: 'Какво е нужно на листата, за да правят храна?' },
            { t: 'Нищо няма да се промени, щом има вода.', ok: false, why: 'Водата е само едно от нещата. Какво още е нужно?' },
          ],
          hint: 'Спомни си трите неща за фотосинтезата.',
          mistakes: m,
          onRight: (m2) => {
            leaves.forEach((l) => l.material.color.set(0xc0ca33));
            setTimeout(() => leaves.forEach((l) => l.material.color.set(0x43a047)), 2500);
            ctx.scores[2] = stepScore(m2, 3);
            finishBtn(ctx, onComplete, restart);
          },
        });
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
