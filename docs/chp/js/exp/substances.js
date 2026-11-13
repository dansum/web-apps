// 5.2.1 „Вещества и смеси“ — лабораторна маса с проби и стъклена кутия-модел с движещи се частици.
// Стъпки: опознай → вещество или смес по модела (опит) → еднородни и нееднородни смеси, състояния → свойства и приложение.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';

const BOX = { x: 3.6, s: 1.7, y: 0.95 }; // кутията-модел (центърът е на y = BOX.y)
const C = { blue: 0x42a5f5, red: 0xef5350, white: 0xf5f5f5, green: 0x66bb6a, gray: 0xb0794a, yellow: 0xfdd835, tin: 0xb0bec5, purple: 0x8e24aa };
// Модели: types: [{ n, atoms: [цветове] }]; solid: подредени в решетка.
const MODELS = {
  empty: { types: [] },
  water: { types: [{ n: 26, atoms: [C.blue] }] },
  salty: { types: [{ n: 22, atoms: [C.blue] }, { n: 8, atoms: [C.white] }] },
  m1: { types: [{ n: 26, atoms: [C.green] }] },
  m2: { types: [{ n: 14, atoms: [C.red] }, { n: 14, atoms: [C.blue] }] },
  m3: { types: [{ n: 18, atoms: [C.red, C.white] }] },
  m4: { types: [{ n: 10, atoms: [C.red] }, { n: 10, atoms: [C.yellow] }, { n: 8, atoms: [C.purple] }] },
  m5: { types: [{ n: 27, atoms: [C.gray] }], solid: true },
  m6: { types: [{ n: 16, atoms: [C.blue, C.blue] }, { n: 5, atoms: [C.red, C.red] }] },
  cu: { types: [{ n: 27, atoms: [C.gray] }], solid: true },
  bronze: { types: [{ n: 22, atoms: [C.gray] }, { n: 5, atoms: [C.tin] }], solid: true },
};

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Вещество или смес?', 'Какви са смесите?', 'Свойства и приложение'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.8, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 13, d: 4.6 });

  const tag = (g, t, y) => { const l = labelSprite(t, { size: 0.19 }); l.position.y = y; g.add(l); stage.steadyLabel(l, 7); return l; };
  const samples = {};
  function sample(id, x, z, build, label, ty) {
    const g = new THREE.Group(); build(g); g.position.set(x, 0, z);
    tag(g, label, ty);
    g.userData.pickId = id; scene.add(g); addHitBox(g, 0.6);
    samples[id] = g; return g;
  }
  const liquidGlass = (g, color, opacity = 0.75, h = 0.7) => {
    const side = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.27, h + 0.1, 24, 1, true), glass(0.3)); side.position.y = (h + 0.1) / 2;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, h, 24), new THREE.MeshStandardMaterial({ color, transparent: true, opacity })); liq.position.y = h / 2;
    g.add(side, liq); return liq;
  };
  // захар
  sample('sugar', -5.2, -0.6, (g) => {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.7, 24, 1, true), glass(0.3)); jar.position.y = 0.35;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 24), mat(0x1976d2)); lid.position.y = 0.74;
    g.add(jar, lid);
    for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), mat(0xffffff, { roughness: 0.3 })); c.position.set((Math.random() - 0.5) * 0.45, 0.05 + Math.random() * 0.35, (Math.random() - 0.5) * 0.45); c.rotation.set(Math.random(), Math.random(), 0); g.add(c); }
  }, 'захар', 1.05);
  // медна жица
  sample('copper', -4.0, 0.6, (g) => {
    for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 28), mat(0xc8743a, { metalness: 0.35, roughness: 0.35 })); t.rotation.x = Math.PI / 2; t.position.y = 0.05 + i * 0.06; g.add(t); }
  }, 'медна жица', 0.65);
  // салата
  sample('salad', -2.8, -0.6, (g) => {
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xffffff, { side: THREE.DoubleSide })); bowl.position.y = 0.42;
    g.add(bowl);
    const cols = [0xe53935, 0x43a047, 0xfdd835, 0x66bb6a, 0xffffff];
    for (let i = 0; i < 30; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.08), mat(cols[i % 5])); const a = Math.random() * 6.3; const r = Math.random() * 0.3; p.position.set(Math.cos(a) * r, 0.3 + Math.random() * 0.1, Math.sin(a) * r); p.rotation.set(Math.random(), Math.random(), 0); g.add(p); }
  }, 'салата', 0.8);
  // сок от сироп
  sample('juice', -1.6, 0.6, (g) => liquidGlass(g, 0xff9800, 0.8), 'сок от сироп', 1.05);
  // бронзов медал
  sample('medal', -0.4, -0.6, (g) => {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 28), mat(0xcd7f32, { metalness: 0.3, roughness: 0.35 })); d.rotation.x = Math.PI / 2; d.position.y = 0.3;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.4, 0.01), mat(0x1e88e5)); rib.position.y = 0.72;
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.2), mat(0x5d4037)); st.position.y = 0.025;
    g.add(d, rib, st);
  }, 'бронзов медал', 1.1);
  // въздух в балон
  sample('air', 0.8, 0.6, (g) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.33, 20, 16), new THREE.MeshStandardMaterial({ color: 0x90caf9, transparent: true, opacity: 0.6 })); b.scale.y = 1.2; b.position.y = 0.95;
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.55, 4), mat(0x555555)); s.position.y = 0.3;
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.2), mat(0x795548)); w.position.y = 0.03;
    g.add(b, s, w);
  }, 'въздух в балон', 1.5);
  // вода с пясък
  sample('sand', 1.9, -0.7, (g) => {
    liquidGlass(g, 0x8d9e7a, 0.55);
    const sand = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.15, 24), mat(0xd7b46a)); sand.position.y = 0.08; g.add(sand);
    for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), mat(0xc49a4a)); p.position.set((Math.random() - 0.5) * 0.4, 0.2 + Math.random() * 0.4, (Math.random() - 0.5) * 0.4); p.userData.s = 0.02 + Math.random() * 0.03; g.add(p); g.userData.grains = (g.userData.grains || []).concat(p); }
  }, 'вода с пясък', 1.05);
  // гранит
  sample('granite', -5.3, 1.0, (g) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c2 = cv.getContext('2d');
    c2.fillStyle = '#d7c4b8'; c2.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) { c2.fillStyle = ['#2b2b2b', '#f5f5f5', '#c97f6b', '#8d8d8d'][i % 4]; c2.fillRect(Math.random() * 128, Math.random() * 128, 3 + Math.random() * 5, 3 + Math.random() * 4); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, flatShading: true })); r.position.y = 0.26; r.scale.y = 0.8;
    g.add(r);
  }, 'гранит', 0.75);
  // морска вода
  sample('sea', -3.0, 1.3, (g) => liquidGlass(g, 0x4fc3f7, 0.6), 'морска вода', 1.05);

  // ---------- Кутия-модел ----------
  const boxG = new THREE.Group();
  const shell3 = new THREE.Mesh(new THREE.BoxGeometry(BOX.s, BOX.s, BOX.s), glass(0.16));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BOX.s, BOX.s, BOX.s)), new THREE.LineBasicMaterial({ color: 0x546e7a }));
  boxG.add(shell3, edges);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(BOX.s + 0.2, 0.1, BOX.s + 0.2), mat(0x455a64)); stand.position.y = -BOX.s / 2 - 0.05; boxG.add(stand);
  boxG.position.set(BOX.x, BOX.y + 0.1, -0.3);
  boxG.userData.pickId = 'model';
  scene.add(boxG);
  const lens = new THREE.Group();
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 10, 28), mat(0x37474f)); const gl = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), glass(0.25));
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), mat(0x6d4c41)); h.position.y = -0.55;
    lens.add(ring, gl, h);
  }
  lens.position.set(BOX.x + 1.35, 1.2, 0.5); lens.rotation.z = -0.3; lens.scale.setScalar(0.8);
  scene.add(lens);
  const boxTag = stage.bubble(boxG, '', { cls: 'tag', lift: BOX.s / 2 + 0.3 });
  boxTag.el.style.visibility = 'hidden';
  const parts = [];
  const atomGeo = new THREE.SphereGeometry(0.085, 14, 10);
  const matCache = {};
  const atomMat = (c) => (matCache[c] ||= mat(c, { roughness: 0.4 }));
  let cur = 'empty';
  function clearParts() { for (const p of parts) boxG.remove(p.g); parts.length = 0; }
  function addParticle(atoms, solidPos) {
    const g = new THREE.Group();
    atoms.forEach((c, i) => { const a = new THREE.Mesh(atomGeo, atomMat(c)); a.position.x = atoms.length > 1 ? (i - 0.5) * 0.13 : 0; if (atoms.length > 1 && i) a.scale.setScalar(0.75); g.add(a); });
    const h = BOX.s / 2 - 0.12;
    const p = { g, v: new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(0.9), home: solidPos || null, h };
    g.position.copy(solidPos || new THREE.Vector3((Math.random() * 2 - 1) * h, (Math.random() * 2 - 1) * h, (Math.random() * 2 - 1) * h));
    g.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    boxG.add(g); parts.push(p);
  }
  function setModel(id, label = '') {
    cur = id; clearParts();
    const M = MODELS[id];
    if (M.solid) {
      const cells = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) cells.push(new THREE.Vector3((i - 1) * 0.45, (j - 1) * 0.45 - 0.2, (k - 1) * 0.45));
      // атомите на калая се разпръскват между медните
      const order = cells.map((c, i) => [c, (i * 7919) % 27]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
      let n = 0;
      for (const T of M.types) for (let i = 0; i < T.n; i++) addParticle(T.atoms, order[n++]);
    } else {
      for (const T of M.types) for (let i = 0; i < T.n; i++) addParticle(T.atoms);
    }
    boxTag.set(label); boxTag.el.style.visibility = label ? '' : 'hidden';
  }
  setModel('empty');

  stage.tick((dt, t) => {
    for (const p of parts) {
      if (p.home) {
        p.g.position.set(p.home.x + Math.sin(t * 9 + p.home.x * 13) * 0.025, p.home.y + Math.cos(t * 8 + p.home.y * 11) * 0.025, p.home.z + Math.sin(t * 10 + p.home.z * 7) * 0.025);
        continue;
      }
      p.g.position.addScaledVector(p.v, dt);
      for (const ax of ['x', 'y', 'z']) if (Math.abs(p.g.position[ax]) > p.h) { p.g.position[ax] = Math.sign(p.g.position[ax]) * p.h; p.v[ax] *= -1; }
      p.g.rotation.x += dt * 0.8; p.g.rotation.y += dt * 0.6;
    }
    // пясъкът бавно се утаява, балонът се полюшва
    for (const gr of samples.sand.userData.grains) { gr.position.y -= gr.userData.s * dt; if (gr.position.y < 0.17) gr.position.y = 0.6; }
    samples.air.children[0].position.x = Math.sin(t * 0.9) * 0.04;
    lens.position.y = 1.2 + Math.sin(t * 1.2) * 0.04;
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    setModel('water', 'вода');
    view(ctx, [-0.6, 0.6, 0], 5.6, { halfH: 1.6 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Всичко около нас е изградено от <b>вещества</b>. Кое е чисто вещество и кое — смес?</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'model', label: 'Кутия-модел', icon: '🔬', note: 'Модел: всяко кълбенце е <b>градивна частица</b>. Еднаквите частици са с еднакъв цвят. Истинските частици са невидимо малки и нямат цвят.', obj: () => boxG, dist: 3.6, bubble: 1.4 },
        { id: 'sugar', label: 'Захар', icon: '🧂', note: 'Захарта е <b>чисто вещество</b>: всичките ѝ частици са еднакви. Свойства: бяла, сладка, разтваря се във вода.', obj: () => samples.sugar, dist: 2.6 },
        { id: 'copper', label: 'Медна жица', icon: '🟠', note: 'Медта е <b>чисто вещество</b> — метал с червеникав цвят и блясък.', obj: () => samples.copper, dist: 2.4 },
        { id: 'salad', label: 'Салата', icon: '🥗', note: 'Салатата е <b>смес</b>: домати, краставици, сирене. Всяко се вижда отделно.', obj: () => samples.salad, dist: 2.6 },
        { id: 'juice', label: 'Сок от сироп', icon: '🧃', note: 'Сокът е <b>смес</b> от вода и сироп. Не можем да ги различим с очи.', obj: () => samples.juice, dist: 2.6 },
        { id: 'medal', label: 'Бронзов медал', icon: '🥉', note: 'Бронзът е <b>сплав</b> — твърда смес от мед и калай.', obj: () => samples.medal, dist: 2.6 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Вещество или смес? ----------
  function step2() {
    shell.step(1);
    setModel('empty');
    view(ctx, [BOX.x - 0.6, 1.0, -0.3], 2.0, { halfH: 1.4, elev: 0.3 });
    shell.task('<p><b>Чистото вещество</b> е изградено от еднакви частици. <b>Сместа</b> е съставена от две или повече вещества.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Разтваряме сол във вода. Какво ще получим: чисто вещество или смес?',
      options: [
        { t: 'Смес', ok: true, why: 'Да проверим с модела! Сложи частиците в кутията.' },
        { t: 'Чисто вещество', ok: false, why: 'Солта не изчезва — водата става солена. Колко вещества има тогава в чашата?' },
        { t: 'Нито едното, нито другото', ok: false, why: 'Всичко около нас е или чисто вещество, или смес. Колко вещества смесихме?' },
      ],
      hint: 'Брой веществата: вода и сол.',
      onRight: (m) => { mistakes = m; build(); },
    });
    function build() {
      const c = shell.setControls('<div class="row"><button class="btn primary addw">🔵 Добави вода</button><button class="btn adds" disabled>⚪ Добави сол</button></div>');
      c.querySelector('.addw').addEventListener('click', () => {
        c.querySelector('.addw').disabled = true; c.querySelector('.adds').disabled = false;
        setModel('water', 'чисто вещество: вода');
        ctx.say(boxG, 'Всички частици са еднакви: това е <b>чисто вещество</b>. Тук всяка частица вода е едно кълбо. Всъщност тя е от три атома: два водорода и един кислород.', 'wide', 1.4);
      }, { once: true });
      c.querySelector('.adds').addEventListener('click', () => {
        c.querySelector('.adds').disabled = true;
        setModel('salty', 'смес: вода + сол');
        ctx.say(boxG, 'Сега частиците са от <b>два вида</b>: това е <b>смес</b>. Солената вода изглежда еднаква навсякъде, но е смес. Тук солта е показана опростено.', 'wide', 1.4);
        nextBtn(ctx, 'Разпознай моделите →', sortModels);
      }, { once: true });
    }
    function sortModels() {
      ctx.clearTip();
      shell.task('<p>Разгледай модела в кутията. <b>Чисто вещество или смес?</b></p><p class="small">Внимавай: една частица може да е съставена от различни атоми.</p>');
      const show = (id) => () => setModel(id, '');
      sortTask(ctx, {
        bins: ['Чисто вещество', 'Смес'],
        items: [
          { t: 'Модел А', bin: 0, show: show('m1'), why: 'Чисто вещество: всички частици са еднакви.' },
          { t: 'Модел Б', bin: 1, show: show('m2'), why: 'Смес: два вида частици.' },
          { t: 'Модел В', bin: 0, show: show('m3'), why: 'Чисто вещество: всяка частица е от два атома, но всички частици са <b>еднакви</b>.'.replace(/<\/?b>/g, ''), no: 'Погледни внимателно: има ли различни частици, или всички са еднакви?' },
          { t: 'Модел Г', bin: 1, show: show('m4'), why: 'Смес: три вида частици.' },
          { t: 'Модел Д', bin: 0, show: show('m5'), why: 'Чисто вещество: еднакви частици, подредени плътно — като в твърд метал.' },
          { t: 'Модел Е (въздух)', bin: 1, show: show('m6'), why: 'Смес: във въздуха има частици на азот и на кислород (и малко други газове).', no: 'Всички частици ли са еднакви? Виж цветовете.' },
        ],
        hint: 'Ако всички частици са еднакви, е чисто вещество, дори всяка да е от два атома.',
        mistakes,
        onDone: (m) => { ctx.scores[0] = stepScore(m, 3); setModel('water', 'вода'); shell.msg('Браво! Разпозна всички модели.', 'good'); nextBtn(ctx, 'Напред →', step3); },
      });
    }
  }

  // ---------- 3. Какви са смесите? ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    view(ctx, [-1.8, 0.6, 0.2], 4.4, { halfH: 1.4, elev: 0.5 });
    shell.task('<p>В <b>еднородната</b> смес не различаваме съставните части дори с лупа. В <b>нееднородната</b> — виждаме ги.</p>');
    const look = (id, txt) => () => { stage.focusOn(samples[id], { dist: 2.0, height: 1.9, lift: 0.4, keepFollow: false }); ctx.say(samples[id], txt, 'tag', 1.2); };
    sortTask(ctx, {
      bins: ['Еднородна', 'Нееднородна'],
      items: [
        { t: 'Салата', bin: 1, show: look('salad', '🔍 салата'), why: 'Нееднородна: виждаме отделните зеленчуци.' },
        { t: 'Сок от сироп', bin: 0, show: look('juice', '🔍 сок'), why: 'Еднородна: сиропът и водата не се различават.' },
        { t: 'Вода с пясък', bin: 1, show: look('sand', '🔍 вода с пясък'), why: 'Нееднородна: песъчинките се виждат и се утаяват.' },
        { t: 'Въздух', bin: 0, show: look('air', '🔍 въздух'), why: 'Еднородна: газовете във въздуха не се различават.' },
        { t: 'Гранит', bin: 1, show: look('granite', '🔍 гранит'), why: 'Нееднородна: в гранита се виждат зрънца с различен цвят.', no: 'Погледни отблизо камъка: еднакъв ли е навсякъде?' },
        { t: 'Бронз', bin: 0, show: look('medal', '🔍 бронз'), why: 'Еднородна: в сплавта медта и калаят не се различават.' },
      ],
      hint: 'Виждаш ли отделните части с очи или с лупа?',
      onDone: (m) => {
        shell.task('<p>Смесите могат да бъдат <b>газообразни</b>, <b>течни</b> и <b>твърди</b>.</p>');
        sortTask(ctx, {
          bins: ['Газообразна', 'Течна', 'Твърда'],
          items: [
            { t: 'Въздух', bin: 0, show: look('air', 'въздух'), why: 'Въздухът е газообразна смес.' },
            { t: 'Морска вода', bin: 1, show: look('sea', 'морска вода'), why: 'Морската вода е течна смес от вода и соли.' },
            { t: 'Бронз', bin: 2, show: look('medal', 'бронз'), why: 'Бронзът е твърда смес (сплав).' },
            { t: 'Сок от сироп', bin: 1, show: look('juice', 'сок'), why: 'Сокът е течна смес.' },
            { t: 'Гранит', bin: 2, show: look('granite', 'гранит'), why: 'Гранитът е твърда смес от минерали.' },
          ],
          hint: 'В какво състояние е сместа при стайна температура?',
          mistakes: m,
          onDone: (m2) => { ctx.clearTip(); ctx.scores[1] = stepScore(m2, 3); shell.msg('Браво!', 'good'); nextBtn(ctx, 'Напред →', step4); },
        });
      },
    });
  }

  // ---------- 4. Свойства и приложение ----------
  const magnet = new THREE.Group();
  {
    const u = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 10, 20, Math.PI), mat(0xd32f2f)); u.rotation.z = Math.PI;
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), mat(0xeceff1)); t1.position.set(-0.18, -0.02, 0);
    const t2 = t1.clone(); t2.position.x = 0.18;
    magnet.add(u, t1, t2);
  }
  magnet.visible = false; scene.add(magnet);
  const circuit = new THREE.Group();
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xfff9c4, transparent: true, opacity: 0.7, emissive: 0xffeb3b, emissiveIntensity: 0 });
  {
    const bat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.2), mat(0x37474f)); bat.position.set(-0.6, 0.125, 0);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), bulbM); bulb.position.set(0.6, 0.3, 0);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), mat(0x9e9e9e)); base.position.set(0.6, 0.12, 0);
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.02), mat(0x212121)); w1.position.set(-0.25, 0.05, 0.12);
    const w2 = w1.clone(); w2.position.x = 0.35;
    circuit.add(bat, bulb, base, w1, w2);
  }
  circuit.position.set(-4.0, 0, 1.4); circuit.visible = false; scene.add(circuit);

  function step4() {
    shell.step(3);
    ctx.clearTip();
    setModel('cu', 'модел: мед');
    view(ctx, [-2.6, 0.5, 0.8], 2.6, { halfH: 1.1, elev: 0.6 });
    circuit.visible = true; magnet.visible = true; magnet.position.set(-4.0, 0.9, 0.0);
    shell.task('<p class="small"><b>🔁 Припомни от 4. клас</b>: с магнит проверявахме дали веществото се привлича.</p><p><b>Физични свойства</b> са цвят, блясък, твърдост, провеждане на ток и топлина. Наблюдаваме ги, без веществото да се превръща в друго.</p><p>Изследвай <b>медната жица</b>. Направи и трите опита.</p>');
    let mistakes = 0;
    const done = new Set();
    const c = shell.setControls('<div class="row"><button class="btn tmag">🧲 Магнит</button><button class="btn tcur">💡 Включи във веригата</button><button class="btn tbend">✋ Огъни</button></div>');
    const fin = (k) => {
      done.add(k);
      if (done.size === 3) setTimeout(ask, 1200);
    };
    c.querySelector('.tmag').addEventListener('click', (e) => {
      e.target.disabled = true;
      let k = 0;
      const stop = stage.tick((dt) => { k = Math.min(1, k + dt); magnet.position.y = 0.9 - k * 0.45; if (k >= 1) { stop(); ctx.say(samples.copper, 'Магнитът <b>не привлича</b> медта.', 'tag', 0.8); fin('mag'); } });
    });
    c.querySelector('.tcur').addEventListener('click', (e) => {
      e.target.disabled = true;
      bulbM.emissiveIntensity = 1.4;
      ctx.say(circuit, 'Крушката свети: медта <b>провежда електрически ток</b>.', 'tag', 0.6);
      fin('cur');
    });
    c.querySelector('.tbend').addEventListener('click', (e) => {
      e.target.disabled = true;
      samples.copper.children.forEach((ch, i) => { if (ch.geometry && ch.geometry.type === 'TorusGeometry') ch.scale.set(1, 1 + i * 0.15, 1); });
      ctx.say(samples.copper, 'Медта се <b>огъва</b>, без да се счупи.', 'tag', 0.8);
      fin('bend');
    });
    function ask() {
      ctx.clearTip();
      choice(ctx, {
        q: 'Кои са физични свойства на медта?',
        options: [
          { t: 'Червеникава е, с метален блясък, провежда ток и топлина, огъва се.', ok: true, why: 'Вярно! По тези свойства разпознаваме медта.' },
          { t: 'Червеникава е и се привлича от магнит, защото е метал.', ok: false, why: 'Спомни си опита с магнита. Магнитът привлича желязото, но не всеки метал.' },
          { t: 'Червеникава е и се огъва, но не провежда ток.', ok: false, why: 'Виж крушката: свети ли?' },
        ],
        hint: 'Разчитай на трите опита.',
        mistakes,
        onRight: (m) => { mistakes = m; nextBtn(ctx, 'Сплавите →', alloy); },
      });
    }
    function alloy() {
      ctx.clearTip();
      circuit.visible = false; magnet.visible = false;
      setModel('bronze', 'модел: бронз (мед + калай)');
      view(ctx, [BOX.x - 0.9, 0.9, -0.3], 2.3, { halfH: 1.3, elev: 0.3 });
      shell.task('<p>Бронзът е <b>сплав</b>: смес от мед и малко калай. Сивите частици в модела са калай.</p>');
      choice(ctx, {
        q: 'Защо медалите и камбаните се правят от бронз, а не от чиста мед?',
        options: [
          { t: 'Бронзът е по-твърд и по-издръжлив от чистата мед.', ok: true, why: 'Вярно! Сместа има свойства, различни от тези на съставните ѝ части. Затова хората правят сплави.' },
          { t: 'Бронзът е чисто вещество.', ok: false, why: 'Виж модела: еднакви ли са всички частици?' },
          { t: 'Бронзът се привлича от магнит.', ok: false, why: 'Нито медта, нито калаят се привличат от магнит.' },
        ],
        hint: 'Свойствата на сместа могат да са по-добри за дадена употреба.',
        mistakes,
        onRight: (m) => { mistakes = m; nextBtn(ctx, 'Последен въпрос →', life); },
      });
    }
    function life() {
      ctx.clearTip();
      shell.task('<p>Пренеси към живота. Всички тези неща са <b>смеси</b>. За какво ги използваме?</p>');
      sortTask(ctx, {
        bins: ['Храна', 'Лекарство', 'Сплав (материал)'],
        items: [
          { t: 'мляко', bin: 0, why: 'Млякото е смес от вода, мазнини, захар и други вещества.' },
          { t: 'чай със захар', bin: 0, why: 'Чаят със захар е разтвор — еднородна смес.' },
          { t: 'сироп за кашлица', bin: 1, why: 'Сиропът е лекарство, разтворено във вода със захар.' },
          { t: 'физиологичен разтвор (сол във вода)', bin: 1, why: 'С него промиваме носа и раните. Той е сол, разтворена във вода.' },
          { t: 'бронз', bin: 2, why: 'Бронзът е сплав от мед и калай.' },
          { t: 'неръждаема стомана', bin: 2, why: 'Неръждаемата стомана е сплав. В нея има желязо и хром.' },
        ],
        hint: 'Ядем ли го, лекуваме ли се с него, или правим предмети от него?',
        mistakes,
        onDone: (m) => { ctx.scores[2] = stepScore(m, 3); shell.msg('Вярно! Храните, лекарствата и материалите често са смеси.', 'good'); finishBtn(ctx, onComplete, restart); },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    ctx.answer = null;
    circuit.visible = false; magnet.visible = false; bulbM.emissiveIntensity = 0;
    samples.copper.children.forEach((ch) => { if (ch.geometry && ch.geometry.type === 'TorusGeometry') ch.scale.set(1, 1, 1); });
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
