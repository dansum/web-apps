// 6.2.1 „Атоми, молекули, йони; химичен елемент“ — витрина с модели на частици и „конструктор“ на атом.
// Стъпки: опознай → построй атом и йон (протоните определят елемента) → атом, молекула или йон → химичен елемент.
import { labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { ELEM, BY_Z, MOL, atomBall, bohrAtom, lattice, tagOver, NOT_SCALE } from './chem6.js';

const V3 = THREE.Vector3;
const sup = (q) => (q === 0 ? '' : `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}`);

// Йон като топче с ореол и знак.
function ionModel(sym, q) {
  const g = new THREE.Group();
  const a = atomBall(sym, q < 0 ? 2.2 : 1.6);
  g.add(a);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(ELEM[sym].r * (q < 0 ? 2.2 : 1.6) * 1.25, 16, 12), new THREE.MeshBasicMaterial({ color: q > 0 ? 0xff8a80 : 0x82b1ff, transparent: true, opacity: 0.25, depthWrite: false }));
  g.add(halo);
  const l = labelSprite(q > 0 ? '+' : '−', { size: 0.2, color: q > 0 ? '#b71c1c' : '#0d47a1' });
  l.position.set(0.3, 0.3, 0.2); l.raycast = () => {};
  g.add(l);
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Построй атом и йон', 'Атом, молекула или йон?', 'Химичен елемент'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 1, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 15, d: 4.8 });

  // ---------- Табло с елементите (1–17) ----------
  const boardC = document.createElement('canvas');
  boardC.width = 1024; boardC.height = 160;
  const bctx = boardC.getContext('2d');
  const boardTex = new THREE.CanvasTexture(boardC);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.25), new THREE.MeshBasicMaterial({ map: boardTex }));
  board.position.set(0, 3.3, -3.95);
  board.userData.pickId = 'table';
  scene.add(board);
  const ZS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  function drawBoard(hi) {
    bctx.fillStyle = '#f7f9fb'; bctx.fillRect(0, 0, 1024, 160);
    const w = 1024 / ZS.length;
    ZS.forEach((z, i) => {
      const s = BY_Z[z];
      bctx.fillStyle = z === hi ? '#ffe082' : '#ffffff';
      bctx.fillRect(i * w + 3, 6, w - 6, 148);
      bctx.strokeStyle = z === hi ? '#f57f17' : '#b0bec5'; bctx.lineWidth = 3; bctx.strokeRect(i * w + 3, 6, w - 6, 148);
      bctx.fillStyle = '#37474f'; bctx.font = '600 22px system-ui, Arial'; bctx.textAlign = 'center';
      bctx.fillText(String(z), i * w + w / 2, 34);
      bctx.font = '800 46px system-ui, Arial'; bctx.fillStyle = '#1b2a3a';
      bctx.fillText(s, i * w + w / 2, 90);
      bctx.font = '500 16px system-ui, Arial'; bctx.fillStyle = '#455a64';
      bctx.fillText(ELEM[s].name, i * w + w / 2, 132);
    });
    boardTex.needsUpdate = true;
  }
  drawBoard(0);

  // ---------- Конструктор на атом ----------
  const atom = bohrAtom({ p: 6, n: 6, e: 6, R: 0.6, dR: 0.42 });
  atom.scale.setScalar(1.25);
  atom.rotation.x = 1.0;
  const builder = new THREE.Group();
  builder.add(atom);
  atom.position.y = 1.55;
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.2, 20), mat(0x546e7a));
  ped.position.y = 0.1;
  builder.add(ped);
  builder.position.set(0, 0, 0.6);
  builder.userData.pickId = 'builder';
  addHitBox(builder, 1);
  scene.add(builder);
  const AT = atom.userData;
  const info = stage.bubble(new V3(0, 0.35, 1.5), '', { cls: 'tag', lift: 0 });
  stage.tick((dt) => {
    AT.tick(dt);
    atom.rotation.y += dt * 0.2;
    const { p, n, e } = AT.state;
    const s = BY_Z[p];
    const q = p - e;
    info.set(`${p} p · ${n} n · ${e} e → ${s ? `<b>${ELEM[s].name}</b> ${q === 0 ? '(атом, неутрален)' : `(йон ${s}${sup(q)})`}` : '—'}`);
  });

  // ---------- Витрина с модели ----------
  const SHELF = [
    { id: 'm-H', label: 'H', kind: 0, make: () => atomBall('H', 2.2) },
    { id: 'm-He', label: 'He', kind: 0, make: () => atomBall('He', 2.2) },
    { id: 'm-O2', label: 'O₂', kind: 1, make: () => MOL.O2() },
    { id: 'm-H2O', label: 'H₂O', kind: 1, make: () => MOL.H2O() },
    { id: 'm-CO2', label: 'CO₂', kind: 1, make: () => MOL.CO2() },
    { id: 'm-Na', label: 'Na⁺', kind: 2, make: () => ionModel('Na', 1) },
    { id: 'm-Cl', label: 'Cl⁻', kind: 2, make: () => ionModel('Cl', -1) },
  ];
  const shelf = new THREE.Group();
  const shelfModels = SHELF.map((S, i) => {
    const g = new THREE.Group();
    const m = S.make();
    m.position.y = 0.55;
    g.add(m);
    const ped2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.15, 14), mat(0xcfd8dc));
    ped2.position.y = 0.075;
    g.add(ped2);
    tagOver(stage, g, S.label, 1.15, 0.22);
    g.position.set(-4.2 + i * 0.95 + (i > 2 ? 1.8 : 0) + (i > 4 ? 0.0 : 0), 0, -1.2);
    g.userData.pickId = S.id;
    g.userData.model = m;
    addHitBox(g, 0.7);
    shelf.add(g);
    return g;
  });
  // разместване: атоми и молекули вляво, йони вдясно
  shelfModels.forEach((g, i) => { g.position.x = [-5.6, -4.7, -3.5, -2.4, -1.2, 2.6, 3.6][i]; });
  scene.add(shelf);
  const salt = lattice(['Na', 'Cl'], 3, 0.5, 1.4);
  salt.position.set(5.4, 0.75, -0.9);
  salt.userData.pickId = 'salt';
  addHitBox(salt, 0.8);
  tagOver(stage, salt, 'Готварска сол (кристал)', 0.95);
  scene.add(salt);
  stage.tick((dt, t) => {
    shelfModels.forEach((g, i) => { g.userData.model.rotation.y = t * 0.4 + i; });
    salt.rotation.y = t * 0.25;
  });

  // ---------- Частици за химичния елемент (стъпка 4) ----------
  const PART = [
    { id: 'p-O', p: 8, e: 8, sym: 'O', ok: true },
    { id: 'p-Ne', p: 10, e: 10, sym: 'Ne', ok: false },
    { id: 'p-O2m', p: 8, e: 10, sym: 'O', ok: true },
    { id: 'p-N', p: 7, e: 7, sym: 'N', ok: false },
    { id: 'p-Fm', p: 9, e: 10, sym: 'F', ok: false },
  ];
  const elemG = new THREE.Group();
  const parts = PART.map((P, i) => {
    const g = new THREE.Group();
    const a = bohrAtom({ p: P.p, n: P.p, e: P.e, R: 0.32, dR: 0.25 });
    a.rotation.x = 1.1;
    a.position.y = 0.95;
    g.add(a);
    const q = P.p - P.e;
    tagOver(stage, g, `${P.p} p · ${P.e} e${q ? ` (${q > 0 ? '+' : '−'}${Math.abs(q) > 1 ? Math.abs(q) : ''})` : ''}`, 1.75, 0.18);
    g.position.set(-3.2 + i * 1.6, 0, 1.4);
    g.userData.pickId = P.id;
    g.userData.atom = a;
    addHitBox(g, 1.0);
    elemG.add(g);
    return g;
  });
  elemG.visible = false;
  scene.add(elemG);
  stage.tick((dt) => { if (elemG.visible) parts.forEach((g) => { g.userData.atom.userData.tick(dt); g.userData.atom.rotation.y += dt * 0.3; }); });

  function show(which) {
    builder.visible = which === 'all' || which === 'build';
    shelf.visible = which === 'all' || which === 'sort';
    salt.visible = which === 'all' || which === 'sort';
    elemG.visible = which === 'elem';
    info.el.style.visibility = builder.visible ? '' : 'hidden';
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    show('all');
    AT.set({ p: 6, n: 6, e: 6 });
    drawBoard(6);
    view(ctx, [0, 1.3, -0.3], 6.6, { halfH: 2.2 });
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p>Всички вещества са изградени от много малки частици: <b>атоми</b>, <b>молекули</b> и <b>йони</b>.</p><p><b>Разгледай всичко</b> от менюто или с клик.</p>`,
      items: [
        { id: 'builder', label: 'Атом', icon: '⚛', note: `<b>Атомът</b> има ядро (протони и неутрони) и електрони около него. Неутрален е — протоните и електроните са равен брой. ${NOT_SCALE}`, obj: () => builder, dist: 3.2, lift: 1.3, bubble: 1.9 },
        { id: 'm-H2O', label: 'Молекула', icon: '💧', note: '<b>Молекулата</b> е частица от два или повече свързани атома. Молекулата на водата е от 2 атома водород и 1 атом кислород.', obj: () => shelfModels[3], dist: 2.6 },
        { id: 'm-O2', label: 'Молекула кислород', icon: '🫧', note: 'Кислородът във въздуха е от молекули O₂ — два свързани атома кислород.', obj: () => shelfModels[2], dist: 2.6 },
        { id: 'm-Na', label: 'Йон', icon: '➕', note: '<b>Йонът</b> е заредена частица. Получава се, когато атом отдаде или приеме електрони. Na⁺ е отдал 1 електрон.', obj: () => shelfModels[5], dist: 2.6 },
        { id: 'salt', label: 'Готварска сол', icon: '🧂', note: 'Солта е изградена от йони Na⁺ (лилави) и Cl⁻ (зелени), подредени в кристал.', obj: () => salt, dist: 3 },
        { id: 'table', label: 'Табло с елементи', icon: '🔢', note: 'Числото горе е <b>поредният номер</b> — броят на протоните в ядрото. Той определя елемента.', obj: () => board, dist: 5, lift: 0, bubble: 0.9 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Построй атом и йон ----------
  const GOALS = [
    { q: 'Направи <b>неутрален атом кислород</b>.', ok: (s) => s.p === 8 && s.e === 8, no: 'Кислородът има 8 протона. Колко електрона трябват, за да е неутрален?' },
    { q: 'Направи <b>йон натрий Na⁺</b>.', ok: (s) => s.p === 11 && s.e === 10, no: 'Натрият има 11 протона. Йонът Na⁺ има с един електрон по-малко.' },
  ];
  function step2() {
    shell.step(1);
    ctx.clearTip();
    show('build');
    AT.set({ p: 6, n: 6, e: 6 });
    drawBoard(6);
    view(ctx, [0, 1.9, -0.6], 2.6, { halfH: 2.0, elev: 0.15 });
    shell.task('<p>На конструктора има атом <b>въглерод</b>: 6 протона, 6 неутрона, 6 електрона.</p>');
    choice(ctx, {
      q: 'Какво ще стане, ако добавим 1 протон в ядрото?',
      options: [
        { t: 'Ще стане атом на друг елемент — азот.', ok: true, why: 'Да проверим! Натисни „+ протон“.' },
        { t: 'Ще си остане въглерод, само по-тежък.', ok: false, why: 'Погледни таблото: какво определя поредния номер?' },
        { t: 'Ще стане йон.', ok: false, why: 'Йон се получава, когато се смени броят на електроните. Тук сменяме протоните.' },
      ],
      hint: 'Броят на протоните определя елемента.',
      onRight: (m) => build(m),
    });
  }
  function build(m0) {
    let mistakes = m0;
    let k = -1;
    const c = shell.setControls(`<div class="row"><button class="btn padd">+ протон</button><button class="btn prem">− протон</button></div>
      <div class="row"><button class="btn nadd">+ неутрон</button><button class="btn nrem">− неутрон</button></div>
      <div class="row"><button class="btn eadd">+ електрон</button><button class="btn erem">− електрон</button></div>
      <div class="row"><button class="btn primary chk" disabled>Провери</button></div>`);
    const chg = (o) => { const s = AT.state; const nx = { p: s.p, n: s.n, e: s.e, ...o(s) }; if (nx.p < 1 || nx.p > 13 || nx.n < 0 || nx.n > 14 || nx.e < 0 || nx.e > 14) return; AT.set(nx); drawBoard(nx.p); after(); };
    c.querySelector('.padd').addEventListener('click', () => chg((s) => ({ p: s.p + 1 })));
    c.querySelector('.prem').addEventListener('click', () => chg((s) => ({ p: s.p - 1 })));
    c.querySelector('.nadd').addEventListener('click', () => chg((s) => ({ n: s.n + 1 })));
    c.querySelector('.nrem').addEventListener('click', () => chg((s) => ({ n: s.n - 1 })));
    c.querySelector('.eadd').addEventListener('click', () => chg((s) => ({ e: s.e + 1 })));
    c.querySelector('.erem').addEventListener('click', () => chg((s) => ({ e: s.e - 1 })));
    const chk = c.querySelector('.chk');
    function after() {
      if (k === -1 && AT.state.p === 7) {
        k = 0;
        ctx.say(builder, 'Виж таблото: 7 протона — вече е <b>азот</b>! Броят на протоните определя елемента. Ядрото обаче не се променя при химичните реакции.', 'good wide', 2.6);
        shell.task(`<p>${GOALS[0].q}</p><p class="small">Добави или махни частици и натисни „Провери“.</p>`);
        chk.disabled = false;
      }
    }
    shell.task('<p>Добави <b>1 протон</b>.</p>');
    chk.addEventListener('click', () => {
      const G = GOALS[k];
      if (G.ok(AT.state)) {
        shell.msg('Вярно!', 'good');
        k++;
        if (k < GOALS.length) shell.task(`<p>${GOALS[k].q}</p>`);
        else {
          chk.disabled = true;
          ctx.say(builder, 'Na⁺ е <b>йон</b>: 11 положителни протона и 10 отрицателни електрона → заряд +1.', 'good wide', 2.6);
          ctx.scores[0] = stepScore(mistakes, 3);
          nextBtn(ctx, 'Напред →', step3);
        }
      } else {
        mistakes++;
        shell.msg(`Не още. ${mistakes >= 2 ? G.no : 'Провери броя на протоните и електроните.'}`, 'bad');
      }
    });
  }

  // ---------- 3. Атом, молекула или йон? ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    show('sort');
    view(ctx, [-0.4, 0.8, -1.2], 5.2, { halfH: 1.3, elev: 0.3 });
    shell.task('<p>Разгледай модела, който свети, и избери вида на частицата.</p>');
    const NAMES = ['Атом', 'Молекула', 'Йон'];
    sortTask(ctx, {
      bins: NAMES,
      items: SHELF.map((S, i) => ({
        t: `Модел ${S.label}`,
        bin: S.kind,
        why: ['Атомът е неутрален и самостоятелен.', 'Молекулата е от свързани атоми.', 'Йонът има заряд: + или −.'][S.kind],
        no: S.kind === 0 ? 'Едно топче без заряд. Колко атома има?' : S.kind === 1 ? 'Виж: колко атома са свързани?' : 'Виж знака до частицата.',
        show: () => ctx.say(shelfModels[i], `<b>${S.label}</b>`, 'tag', 1.35),
      })),
      hint: 'Едно неутрално топче — атом; няколко свързани — молекула; със знак + или − — йон.',
      onDone: (m) => { ctx.clearTip(); ctx.scores[1] = stepScore(m, 3); shell.msg('Браво!', 'good'); nextBtn(ctx, 'Напред →', step4); },
    });
  }

  // ---------- 4. Химичен елемент ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    show('elem');
    const narrow = stage.camera.aspect < 1;
    parts.forEach((g, i) => {
      if (narrow) g.position.set(i < 3 ? -1.3 + i * 1.3 : -0.65 + (i - 3) * 1.3, i < 3 ? 1.5 : 0, 1.4); // два реда един над друг
      else g.position.set(-3.2 + i * 1.6, 0, 1.4);
    });
    if (narrow) view(ctx, [0, 1.8, 1.4], 1.9, { halfH: 1.9, elev: 0.15 });
    else view(ctx, [0, 1.1, 1.4], 4.0, { halfH: 1.3, elev: 0.35 });
    shell.task(`<p>Пет частици. Под всяка пише броят на протоните (p) и електроните (e). ${NOT_SCALE}</p>`);
    let mistakes = 0;
    choice(ctx, {
      q: 'Неонът (10 p, 10 e) и йонът с 8 p и 10 e имат еднакъв брой електрони. Един и същ елемент ли са?',
      options: [
        { t: 'Не. Елементът се определя от броя на протоните.', ok: true, why: 'Вярно! Химичният елемент е вид атоми и йони с еднакъв брой протони.' },
        { t: 'Да, щом електроните са еднакъв брой.', ok: false, why: 'Електроните могат да се добавят и махат. Кое не се променя?' },
      ],
      hint: 'Погледни протоните.',
      onRight: (m) => {
        mistakes = m;
        const found = new Set();
        shell.task('<p><b>Кликни всички частици на елемента кислород</b> (8 протона). Те са две.</p>');
        shell.setControls('');
        ctx.click = (id) => {
          const P = PART.find((x) => x.id === id);
          if (!P || found.has(id)) return;
          const g = parts[PART.indexOf(P)];
          if (P.ok) {
            found.add(id);
            ctx.say(g, P.e === P.p ? '✔ Атом кислород' : '✔ Йон кислород O²⁻ (с 2 електрона повече)', 'good', 2.1);
            if (found.size === 2) {
              ctx.click = null;
              ctx.scores[2] = stepScore(mistakes, 3);
              shell.task('<p><b>Химичен елемент</b> — атоми и йони с еднакъв брой протони в ядрото.</p>');
              finishBtn(ctx, onComplete, restart);
            }
          } else {
            mistakes++;
            ctx.say(g, `✘ ${P.p} протона — това е ${ELEM[P.sym].name}.`, 'bad', 2.1);
            shell.msg(`Не е кислород.${mistakes >= 2 ? ' Подсказка: търси 8 p, без значение колко са електроните.' : ''}`, 'bad');
          }
        };
      },
    });
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    step1();
  }
  step1();
  return { dispose() { info.remove(); stage.dispose(); } };
}
