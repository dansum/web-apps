// 6.2.2 „Прости и сложни вещества“ — лабораторна маса: захар в епруветка над спиртна лампа, буркани с вещества
// и конструктор на молекули.
// Стъпки: опознай → разлагане на захар при нагряване (опит) → просто или сложно по модел → построй молекули.
import { labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { ELEM, MOL, atomBall, lattice, tagOver, testTube, spiritLamp, TEACHER, NOT_SCALE } from './chem6.js';

const V3 = THREE.Vector3;

function jarModel(contentColor, kind = 'solid') {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.6, 20, 1, true), glass(0.3));
  wall.position.y = 0.3;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 20), mat(0x90a4ae));
  lid.position.y = 0.62;
  g.add(wall, lid);
  if (kind === 'gas') {
    const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.56, 18), new THREE.MeshStandardMaterial({ color: contentColor, transparent: true, opacity: 0.12, depthWrite: false }));
    gas.position.y = 0.3; g.add(gas);
  } else if (kind === 'liquid') {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.4, 18), new THREE.MeshStandardMaterial({ color: contentColor, transparent: true, opacity: 0.55 }));
    l.position.y = 0.21; g.add(l);
  } else {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.25, 18), mat(contentColor, { flat: true, roughness: 0.9 }));
    s.position.y = 0.13; g.add(s);
  }
  return g;
}

const JARS = [
  { id: 'j-O2', name: 'Кислород', color: 0xbbdefb, kind: 'gas', model: () => MOL.O2(), simple: true },
  { id: 'j-Fe', name: 'Желязо', color: 0x78909c, kind: 'solid', model: () => lattice(['Fe'], 2, 0.42, 1.1), simple: true },
  { id: 'j-S', name: 'Сяра', color: 0xfdd835, kind: 'solid', model: () => { const g = new THREE.Group(); for (let i = 0; i < 8; i++) { const a = atomBall('S', 0.9); const t = (i / 8) * Math.PI * 2; a.position.set(Math.cos(t) * 0.32, (i % 2) * 0.1 - 0.05, Math.sin(t) * 0.32); g.add(a); } return g; }, simple: true },
  { id: 'j-H2O', name: 'Вода', color: 0x64b5f6, kind: 'liquid', model: () => MOL.H2O(), simple: false },
  { id: 'j-NaCl', name: 'Готварска сол', color: 0xfafafa, kind: 'solid', model: () => lattice(['Na', 'Cl'], 2, 0.42, 1.1), simple: false },
  { id: 'j-CO2', name: 'Въглероден диоксид', color: 0xeeeeee, kind: 'gas', model: () => MOL.CO2(), simple: false },
];

// Молекули, които конструкторът познава (ключ — състав).
const KNOWN = {
  'H2': { name: 'водород H₂', simple: true, make: () => MOL.H2() },
  'O2': { name: 'кислород O₂', simple: true, make: () => MOL.O2() },
  'H2O1': { name: 'вода H₂O', simple: false, make: () => MOL.H2O() },
  'C1O2': { name: 'въглероден диоксид CO₂', simple: false, make: () => MOL.CO2() },
  'C1H4': { name: 'метан CH₄', simple: false, make: () => MOL.CH4() },
  'C1O1': { name: 'въглероден оксид CO', simple: false, make: () => MOL.CO() },
};
const keyOf = (cnt) => ['C', 'H', 'O'].filter((s) => cnt[s]).map((s) => `${s}${cnt[s]}`).join('').replace(/^H2$/, 'H2').replace(/^O2$/, 'O2');

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Разлагане на захар', 'Просто или сложно?', 'Построй молекули'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.9, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 15, d: 4.8 });

  // ---------- Захар в епруветка над спиртна лампа ----------
  const heat = new THREE.Group();
  const lamp = spiritLamp();
  heat.add(lamp);
  const tube = testTube(1.0, 0.13);
  tube.position.set(0, 0.85, 0);
  tube.rotation.z = -0.5;
  heat.add(tube);
  const sugarM = mat(0xfafafa, { roughness: 0.95 });
  const sugar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 16), sugarM);
  sugar.position.y = 0.2;
  tube.add(sugar);
  const clamp = new THREE.Group();
  { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 8), mat(0x78909c)); post.position.set(-0.75, 0.95, 0); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), mat(0x78909c)); arm.rotation.z = Math.PI / 2; arm.position.set(-0.45, 1.45, 0); const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), mat(0x546e7a)); foot.position.set(-0.75, 0.02, 0); clamp.add(post, arm, foot); }
  heat.add(clamp);
  const drops = [];
  for (let i = 0; i < 10; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.02 + (i % 3) * 0.008, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb3e5fc, transparent: true, opacity: 0.85, roughness: 0.05 }));
    d.position.set(0, 0.55 + i * 0.045, (i % 2) * 0.05 - 0.025);
    d.visible = false; tube.add(d); drops.push(d);
  }
  const smoke = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xbdbdbd, transparent: true, opacity: 0 })); s.userData.k = i / 6; tube.add(s); smoke.push(s); }
  heat.position.set(-4.4, 0, 0.2);
  heat.userData.pickId = 'heat';
  addHitBox(heat, 0.9);
  tagOver(stage, heat, 'Захар в епруветка', 2.0);
  scene.add(heat);
  const H = { k: 0, want: 0 };
  stage.tick((dt, t) => {
    H.k += (H.want - H.k) * Math.min(1, dt * 1.2);
    const k = H.k;
    lamp.userData.flame.visible = H.want > 0;
    lamp.userData.flame.scale.set(1, 1 + Math.sin(t * 14) * 0.08, 1);
    sugarM.color.setHex(0xfafafa).lerp(new THREE.Color(0xc68a3a), Math.min(1, k * 2)).lerp(new THREE.Color(0x1b1b1b), Math.max(0, (k - 0.45) * 1.8));
    sugar.scale.set(1, 1 + Math.sin(Math.min(1, k) * Math.PI) * 0.4, 1);
    drops.forEach((d, i) => { d.visible = k > 0.35 + i * 0.05; });
    smoke.forEach((s) => { const f = (t * 0.5 + s.userData.k) % 1; s.position.set(0, 0.4 + f * 1.0, 0); s.material.opacity = k > 0.2 && k < 0.95 ? 0.35 * (1 - f) : 0; });
  });

  // ---------- Буркани с вещества и модели над тях ----------
  const jars = JARS.map((J, i) => {
    const g = new THREE.Group();
    g.add(jarModel(J.color, J.kind));
    const m = J.model();
    m.scale.setScalar(0.85);
    m.position.y = 1.2;
    g.add(m);
    tagOver(stage, g, J.name, 0.85, 0.17);
    g.position.set(-2.4 + i * 1.05, 0, -1.1);
    g.userData.pickId = J.id;
    g.userData.model = m;
    addHitBox(g, 0.7);
    scene.add(g);
    return g;
  });
  stage.tick((dt, t) => jars.forEach((g, i) => { g.userData.model.rotation.y = t * 0.4 + i; }));

  // ---------- Конструктор на молекули ----------
  const kit = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 28), mat(0xeceff1));
  plate.position.y = 0.03;
  kit.add(plate);
  tagOver(stage, kit, 'Конструктор', 1.7, 0.2);
  const tray = [];
  ['H', 'O', 'C'].forEach((s, i) => {
    const t = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), mat(0xcfd8dc));
    box.position.y = 0.04;
    t.add(box);
    for (let k = 0; k < 4; k++) { const a = atomBall(s, 1.1); a.position.set(-0.1 + (k % 2) * 0.2, 0.15 + Math.floor(k / 2) * 0.05, -0.1 + Math.floor(k / 2) * 0.2); t.add(a); }
    tagOver(stage, t, `${s} — ${ELEM[s].name}`, 0.55, 0.16);
    t.position.set(-0.7 + i * 0.7, 0, 1.15);
    t.userData.pickId = 'add-' + s;
    addHitBox(t, 0.5);
    kit.add(t);
    tray.push(t);
  });
  const built = new THREE.Group();
  built.position.y = 0.75;
  kit.add(built);
  kit.position.set(3.8, 0, 0.0);
  kit.userData.pickId = 'kit';
  scene.add(kit);
  const B = { cnt: {}, made: null };
  function drawBuilt() {
    built.clear();
    if (B.made) { const m = B.made.make(); m.scale.setScalar(1.3); built.add(m); return; }
    let i = 0;
    for (const [s, n] of Object.entries(B.cnt)) for (let k = 0; k < n; k++) { const a = atomBall(s, 1.6); const ang = i * 2.1; a.position.set(Math.cos(ang) * 0.3, (i % 2) * 0.12, Math.sin(ang) * 0.3); built.add(a); i++; }
  }
  stage.tick((dt) => { built.rotation.y += dt * 0.6; });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    H.k = 0; H.want = 0;
    B.cnt = {}; B.made = null; drawBuilt();
    view(ctx, [0, 0.9, -0.3], 6.6, { halfH: 1.9 });
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p>Някои вещества са изградени от атоми на <b>един</b> елемент, а други — от атоми на <b>няколко</b> елемента.</p><p><b>Разгледай всичко</b> от менюто или с клик.</p>`,
      items: [
        { id: 'j-O2', label: 'Кислород', icon: '🫧', note: `Молекулите му са от два атома кислород. ${NOT_SCALE}`, obj: () => jars[0], dist: 2.8, bubble: 1.7 },
        { id: 'j-Fe', label: 'Желязо', icon: '🔩', note: 'Желязото е изградено само от атоми желязо, подредени в кристал.', obj: () => jars[1], dist: 2.8, bubble: 1.7 },
        { id: 'j-H2O', label: 'Вода', icon: '💧', note: 'Молекулата на водата е от атоми на два елемента: водород и кислород.', obj: () => jars[3], dist: 2.8, bubble: 1.7 },
        { id: 'j-NaCl', label: 'Готварска сол', icon: '🧂', note: 'Солта е от йони на два елемента: натрий и хлор.', obj: () => jars[4], dist: 2.8, bubble: 1.7 },
        { id: 'heat', label: 'Захар в епруветка', icon: '🧪', note: 'Захарта ще нагреем силно. Опитът се прави <b>само от учител</b>!', obj: () => heat, dist: 3.2, bubble: 1.8 },
        { id: 'kit', label: 'Конструктор', icon: '🧩', note: 'Тук ще строиш молекули от атоми: водород (бял), кислород (червен), въглерод (черен).', obj: () => kit, dist: 3.6, bubble: 1.9 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Разлагане на захар ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    H.k = 0; H.want = 0;
    view(ctx, [-4.4, 1.0, 0.2], 1.3, { halfH: 1.2, elev: 0.25 });
    shell.task(`<p>Учителят нагрява силно бяла захар в епруветка.</p>${TEACHER}`);
    choice(ctx, {
      q: 'Какво ще видим след силно нагряване?',
      options: [
        { t: 'Захарта ще почернее, а по стъклото ще се съберат капки вода.', ok: true, why: 'Да проверим! Плъзни лентата.' },
        { t: 'Захарта ще се изпари и ще изчезне цялата.', ok: false, why: 'Помисли какво става, когато захарта прегори в тигана.' },
        { t: 'Нищо няма да се промени.', ok: false, why: 'Нагряването променя ли захарта, когато правим карамел?' },
      ],
      hint: 'Спомни си прегорелия карамел.',
      onRight: (m) => heatIt(m),
    });
  }
  function heatIt(m0) {
    let mistakes = m0;
    const c = shell.setControls('<label class="row">Нагряване <input type="range" class="heat" min="0" max="100" value="0" style="flex:1"></label>');
    let said = false;
    c.querySelector('.heat').addEventListener('input', (e) => {
      H.want = +e.target.value / 100;
      if (H.want >= 1 && !said) {
        said = true;
        setTimeout(() => {
          ctx.say(heat, 'Остана черен <b>въглен</b> (въглерод), а горе се събраха капки <b>вода</b>.', 'wide', 1.8);
          choice(ctx, {
            q: 'Какво научихме за захарта?',
            options: [
              { t: 'Тя е сложно вещество — от нея се получиха въглерод и вода.', ok: true, why: 'Вярно! Захарта е изградена от три елемента: въглерод, водород и кислород.' },
              { t: 'Тя е просто вещество — от един елемент.', ok: false, why: 'От едно просто вещество не може да се получат две различни вещества.' },
              { t: 'Тя е смес от въглища и вода.', ok: false, why: 'Бялата захар не съдържа въглища и вода — те се получиха при разлагането ѝ.' },
            ],
            hint: 'Колко различни вещества се получиха?',
            mistakes,
            onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
          });
        }, 2600);
      }
    });
  }

  // ---------- 3. Просто или сложно? ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    H.want = 0;
    view(ctx, [0.2, 0.9, -1.1], 3.6, { halfH: 1.2, elev: 0.25 });
    shell.task(`<p>Погледни модела над буркана, който е отбелязан, и избери вида на веществото. ${NOT_SCALE}</p>`);
    sortTask(ctx, {
      bins: ['Просто вещество', 'Сложно вещество'],
      items: JARS.map((J, i) => ({
        t: J.name,
        bin: J.simple ? 0 : 1,
        why: J.simple ? 'Просто — изградено от атоми на един елемент.' : 'Сложно — изградено от атоми (или йони) на няколко елемента.',
        no: 'Преброй колко различни цвята атоми има в модела.',
        show: () => ctx.say(jars[i], `<b>${J.name}</b>`, 'tag', 1.9),
      })),
      hint: 'Един цвят атоми — просто; няколко цвята — сложно.',
      onDone: (m) => { ctx.clearTip(); ctx.scores[1] = stepScore(m, 3); shell.msg('Браво!', 'good'); nextBtn(ctx, 'Напред →', step4); },
    });
  }

  // ---------- 4. Построй молекули ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    B.cnt = {}; B.made = null; drawBuilt();
    view(ctx, [3.8, 0.7, 0.4], 1.3, { halfH: 1.2, elev: 0.45 });
    let mistakes = 0;
    const got = { simple: null, complex: null };
    const upd = () => shell.task(`<p>Кликни атомите в кутийките, за да ги сложиш на конструктора. Построй:</p>
      <p>${got.simple ? '✅' : '⬜'} молекула на <b>просто</b> вещество ${got.simple ? `(${got.simple})` : ''}<br>${got.complex ? '✅' : '⬜'} молекула на <b>сложно</b> вещество ${got.complex ? `(${got.complex})` : ''}</p>
      <p class="small">На конструктора: ${Object.entries(B.cnt).map(([s, n]) => `${s}${n > 1 ? n : ''}`).join(' + ') || 'няма атоми'}</p>`);
    upd();
    const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button><button class="btn clr">Изчисти</button></div>');
    ctx.click = (id) => {
      if (!id || !id.startsWith('add-')) return;
      if (B.made) { B.made = null; B.cnt = {}; }
      const s = id.slice(4);
      const total = Object.values(B.cnt).reduce((a, b) => a + b, 0);
      if (total >= 5) { shell.msg('Стига атоми. Провери или изчисти.', 'bad'); return; }
      B.cnt[s] = (B.cnt[s] || 0) + 1;
      drawBuilt(); upd(); shell.msg('');
    };
    c.querySelector('.clr').addEventListener('click', () => { B.cnt = {}; B.made = null; drawBuilt(); upd(); ctx.clearTip(); });
    c.querySelector('.chk').addEventListener('click', () => {
      const key = keyOf(B.cnt);
      const K = KNOWN[key];
      if (!K) {
        mistakes++;
        shell.msg(`Такава молекула не познаваме. Опитай H₂, O₂, H₂O, CO₂ или CH₄.${mistakes >= 2 ? ' Подсказка: за водород — два атома H.' : ''}`, 'bad');
        return;
      }
      B.made = K; drawBuilt();
      ctx.say(kit, `${K.name}: <b>${K.simple ? 'просто' : 'сложно'} вещество</b>.`, K.simple ? 'good' : 'good', 1.6);
      if (K.simple) got.simple = K.name; else got.complex = K.name;
      upd();
      if (got.simple && got.complex) {
        ctx.click = null;
        c.querySelector('.chk').disabled = true;
        choice(ctx, {
          q: 'Може ли кислородът (просто вещество) да се разложи на по-прости вещества?',
          options: [
            { t: 'Не — той е изграден само от атоми кислород.', ok: true, why: 'Вярно! Простото вещество не може да се разложи на други вещества. Сложните — могат, като водата и захарта.' },
            { t: 'Да, на водород и кислород.', ok: false, why: 'Водородът не е в молекулата O₂. Колко вида атоми има в нея?' },
          ],
          hint: 'Колко вида атоми има в O₂?',
          mistakes,
          onRight: (m) => { ctx.scores[2] = stepScore(m, 3); finishBtn(ctx, onComplete, restart); },
        });
      }
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
