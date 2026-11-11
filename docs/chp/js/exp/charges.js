// 6.1.6 „Електрични заряди и строеж на атома“ — лабораторна маса с балони, вълнен плат, хартийки,
// два окачени балона, модел на атом и макет с облак и гръмоотвод.
// Стъпки: опознай → наелектризиране (опит) → строеж на атома и заряд → електрични явления в природата.
import { labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { bohrAtom, tagOver, NOT_SCALE } from './chem6.js';

const V3 = THREE.Vector3;

function balloonModel(color) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 16), mat(color, { roughness: 0.25 }));
  b.scale.set(1, 1.18, 1);
  const knot = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 8), mat(color));
  knot.position.y = -0.52; knot.rotation.x = Math.PI;
  g.add(b, knot);
  return g;
}
// Знаци за заряд по повърхността на тяло.
function signs(parent, sign, max, radius, center = new V3()) {
  const list = [];
  for (let i = 0; i < max; i++) {
    const s = labelSprite(sign, { size: 0.16, color: sign === '−' ? '#0d47a1' : '#b71c1c', bg: sign === '−' ? 'rgba(187,222,251,0.95)' : 'rgba(255,205,210,0.95)', border: sign === '−' ? '#1e88e5' : '#e53935' });
    const a = i * 2.4; const y = ((i * 0.37) % 1 - 0.5) * radius * 1.4;
    s.position.set(center.x + Math.cos(a) * radius * 0.75, center.y + y, center.z + Math.sin(a) * radius * 0.3 + radius * 0.7);
    s.visible = false;
    s.raycast = () => {};
    parent.add(s);
    list.push(s);
  }
  return { list, show(n) { list.forEach((s, i) => { s.visible = i < n; }); } };
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Наелектризиране', 'Строеж на атома', 'Заряди в природата'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.9, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 15, d: 4.8 });

  // ---------- Балон и вълнен плат ----------
  const bal = balloonModel(0xff7043);
  const BAL_HOME = new V3(-4.4, 1.05, 0.3);
  bal.position.copy(BAL_HOME);
  bal.userData.pickId = 'balloon';
  addHitBox(bal, 0.8);
  tagOver(stage, bal, 'Балон', 0.85);
  scene.add(bal);
  const balQ = signs(bal, '−', 12, 0.42);
  const wool = new THREE.Group();
  {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.7), mat(0xd7ccc8, { roughness: 1 }));
    c.position.y = 0.04;
    wool.add(c);
    for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), mat(0xbcaaa4, { roughness: 1 })); f.position.set(-0.4 + (i % 6) * 0.16, 0.09, -0.28 + Math.floor(i / 6) * 0.26); wool.add(f); }
  }
  wool.position.set(-5.6, 0, 0.6);
  wool.userData.pickId = 'wool';
  addHitBox(wool, 0.6);
  tagOver(stage, wool, 'Вълнен плат', 0.45);
  scene.add(wool);
  const woolQ = signs(wool, '+', 12, 0.4, new V3(0, 0.25, -0.1));
  // летящи електрони при търкане
  const eM = mat(0x1e88e5, { emissive: 0x0d47a1, emissiveIntensity: 0.4 });
  const flyE = [];
  for (let i = 0; i < 6; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), eM); e.visible = false; scene.add(e); flyE.push(e); }

  // ---------- Хартийки ----------
  const PAPER_X = -2.2;
  const papers = [];
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), mat(0xffffff, { side: THREE.DoubleSide }));
    p.rotation.x = -Math.PI / 2;
    p.userData.home = new V3(PAPER_X - 0.35 + (i % 5) * 0.17, 0.01, 0.15 + Math.floor(i / 5) * 0.2);
    p.position.copy(p.userData.home);
    p.userData.stuck = 0;
    scene.add(p);
    papers.push(p);
  }
  const paperHit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  paperHit.position.set(PAPER_X, 0.15, 0.25);
  paperHit.userData.pickId = 'paper';
  scene.add(paperHit);
  const paperTag = labelSprite('Хартийки', { size: 0.2 });
  paperTag.position.set(PAPER_X, 0.35, 0.8);
  stage.steadyLabel(paperTag, 7);
  scene.add(paperTag);

  // ---------- Два окачени балона ----------
  const bar = new THREE.Group();
  {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), mat(0x78909c));
    pole.position.set(0, 1.3, -0.6);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), mat(0x78909c));
    top.rotation.z = Math.PI / 2; top.position.set(0, 2.55, -0.6);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.6), mat(0x546e7a));
    foot.position.set(0, 0.025, -0.6);
    bar.add(pole, top, foot);
  }
  bar.position.set(0.9, 0, 0.3);
  scene.add(bar);
  const hang = [-0.32, 0.32].map((x, i) => {
    const piv = new THREE.Group();
    piv.position.set(x, 2.55, -0.6);
    const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.1, 4), mat(0x424242));
    thread.position.y = -0.55;
    const b = balloonModel(i ? 0x42a5f5 : 0x66bb6a);
    b.scale.setScalar(0.7);
    b.position.y = -1.45;
    piv.add(thread, b);
    bar.add(piv);
    const q = signs(b, '−', 6, 0.42);
    return { piv, b, q, ang: 0, want: 0, s: i ? 1 : -1 };
  });
  hang[0].b.userData.pickId = 'pair'; hang[1].b.userData.pickId = 'pair';
  tagOver(stage, bar, 'Окачени балони', 2.85);

  // ---------- Модел на атом ----------
  const atom = bohrAtom({ p: 3, n: 4, e: 3, R: 0.6, dR: 0.42 });
  const atomG = new THREE.Group();
  atomG.add(atom);
  atom.position.y = 1.6;
  atom.scale.setScalar(1.6);
  atom.rotation.x = 1.0;
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.1, 16), mat(0x546e7a));
  stand.position.y = 0.05;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), mat(0x546e7a));
  rod.position.y = 0.25;
  atomG.add(stand, rod);
  atomG.position.set(3.4, 0, 0.1);
  atomG.userData.pickId = 'atom';
  addHitBox(atomG, 1);
  tagOver(stage, atomG, 'Модел на атом (литий)', 3.0);
  scene.add(atomG);
  const AT = atom.userData;
  const atomInfo = stage.bubble(new V3(3.4, 0.2, 1.0), '', { cls: 'tag', lift: 0 });

  // ---------- Макет: облак, къща с гръмоотвод, дърво ----------
  const dio = new THREE.Group();
  {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.6), mat(0x7cb342));
    base.position.y = 0.06;
    const house = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), mat(0xffe0b2));
    house.position.set(-0.6, 0.47, 0);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 4), mat(0xc62828));
    roof.rotation.y = Math.PI / 4; roof.position.set(-0.6, 1.02, 0);
    const rodL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), mat(0xffb300, { metalness: 0.6 }));
    rodL.position.set(-0.6, 1.5, 0);
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.5, 4), mat(0xffb300, { metalness: 0.6 }));
    wire.position.set(-0.33, 0.85, 0.26);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.4, 6), mat(0x6d4c41));
    trunk.position.set(0.7, 0.32, 0);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), mat(0x2e7d32, { flat: true }));
    crown.position.set(0.7, 0.7, 0);
    dio.add(base, house, roof, rodL, wire, trunk, crown);
    dio.userData.rodTop = new V3(-0.6, 1.8, 0);
  }
  const cloud = new THREE.Group();
  for (const [x, y, r] of [[-0.4, 0, 0.35], [0, 0.12, 0.45], [0.45, 0, 0.35]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat(0x546e7a, { roughness: 1 })); p.position.set(x, y, 0); cloud.add(p); }
  cloud.position.set(-0.3, 2.6, 0);
  dio.add(cloud);
  const cloudQ = signs(cloud, '−', 10, 0.5, new V3(0, -0.25, 0));
  const groundQ = signs(dio, '+', 6, 0.7, new V3(-0.3, 0.3, 0.3));
  const boltM = new THREE.MeshBasicMaterial({ color: 0xfff59d });
  const bolt = new THREE.Group();
  {
    const pts = [new V3(-0.4, 2.35, 0), new V3(-0.5, 2.15, 0), new V3(-0.42, 2.0, 0), new V3(-0.6, 1.8, 0)];
    for (let i = 0; i < pts.length - 1; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), boltM); const d = new V3().subVectors(pts[i + 1], pts[i]); m.position.copy(pts[i]).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.clone().normalize()); m.scale.y = d.length(); bolt.add(m); }
  }
  bolt.visible = false;
  dio.add(bolt);
  dio.position.set(5.8, 0, -0.7);
  dio.userData.pickId = 'storm';
  addHitBox(dio, 1);
  tagOver(stage, dio, 'Макет: буря', 3.25);
  scene.add(dio);

  // ---------- Състояние и анимация ----------
  const S = { q: 0, dist: 1, paper: 0, pair: 0, flyT: -1, storm: 0, flash: 0 };
  function resetLab() {
    S.q = 0; S.dist = 1; S.flyT = -1; S.pair = 0; S.storm = 0; S.flash = 0;
    balQ.show(0); woolQ.show(0); hang.forEach((h) => { h.want = 0; h.q.show(0); });
    papers.forEach((p) => { p.position.copy(p.userData.home); p.rotation.set(-Math.PI / 2, 0, 0); p.userData.stuck = 0; });
    bal.position.copy(BAL_HOME);
    cloudQ.show(0); groundQ.show(0); bolt.visible = false;
  }
  stage.tick((dt, t) => {
    AT.tick(dt);
    atom.rotation.y += dt * 0.15;
    // балонът над хартийките: S.dist 1 → далеч, 0 → съвсем близо
    if (S.dist < 1) bal.position.set(PAPER_X, lerp(0.95, 2.0, S.dist), 0.3);
    bal.rotation.z = Math.sin(t * 1.3) * 0.04;
    // хартийките подскачат към балона, ако той е зареден и близо
    const pull = S.q > 0 && S.dist < 0.35;
    papers.forEach((p, i) => {
      if (pull && !p.userData.stuck && Math.random() < dt * 3) p.userData.stuck = 1;
      if (p.userData.stuck) {
        const tgt = new V3(bal.position.x + Math.cos(i * 2.4) * 0.25, bal.position.y - 0.42 - Math.sin(i) * 0.03, bal.position.z + Math.sin(i * 2.4) * 0.25);
        p.position.lerp(tgt, Math.min(1, dt * 6));
        p.rotation.x = -Math.PI / 2 + Math.sin(t * 8 + i) * 0.2;
      }
    });
    // търкане: електрони прелитат от плата към балона
    if (S.flyT >= 0) {
      S.flyT += dt;
      flyE.forEach((e, i) => {
        const k = Math.min(1, Math.max(0, (S.flyT - i * 0.08) / 0.6));
        e.visible = k > 0 && k < 1;
        e.position.lerpVectors(wool.position.clone().add(new V3(0, 0.2, 0)), bal.position, k);
        e.position.y += Math.sin(k * Math.PI) * 0.4;
      });
      bal.position.x = BAL_HOME.x + Math.sin(S.flyT * 18) * 0.15 * Math.max(0, 1 - S.flyT);
      if (S.flyT > 1.2) { S.flyT = -1; flyE.forEach((e) => { e.visible = false; }); }
    }
    hang.forEach((h) => {
      h.ang += (h.want - h.ang) * Math.min(1, dt * 3);
      h.piv.rotation.z = h.ang * h.s + Math.sin(t * 1.1 + h.s) * 0.015;
    });
    // буря
    if (S.flash > 0) { S.flash -= dt; bolt.visible = Math.sin(S.flash * 40) > -0.3; if (S.flash <= 0) bolt.visible = false; }
    cloud.position.x = -0.3 + Math.sin(t * 0.4) * 0.1;
    // табло на атома
    const st = AT.state; const z = st.p - st.e;
    atomInfo.set(`протони ${st.p} · неутрони ${st.n} · електрони ${st.e} → ${z === 0 ? 'неутрален' : z > 0 ? `заряд +${z}` : `заряд −${-z}`}`);
  });
  const lerp = (a, b, k) => a + (b - a) * k;

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    resetLab();
    AT.set({ p: 3, n: 4, e: 3 });
    view(ctx, [0.4, 1.0, 0], 7.0, { halfH: 2.0 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Защо косата се „лепи“ за гребена? Какво е мълнията? Отговорът е в <b>електричните заряди</b>.</p><p><b>Разгледай всичко</b> от менюто или с клик.</p>',
      items: [
        { id: 'balloon', label: 'Балон', icon: '🎈', note: 'Гумен балон. Сега е <b>неутрален</b> — в него има еднакво положителни и отрицателни заряди.', obj: () => bal, dist: 3 },
        { id: 'wool', label: 'Вълнен плат', icon: '🧶', note: 'С него ще търкаме балона. При търкане едното тяло отдава електрони, а другото ги получава.', obj: () => wool, dist: 2.8 },
        { id: 'paper', label: 'Хартийки', icon: '📄', note: 'Леки парченца хартия. С тях ще проверим дали балонът е наелектризиран.', obj: () => paperHit, dist: 2.6 },
        { id: 'pair', label: 'Окачени балони', icon: '🎈', note: 'Два леки балона на конци. Ще видим как си действат, когато са заредени.', obj: () => bar, dist: 4, lift: 1.3, bubble: 1.8 },
        { id: 'atom', label: 'Модел на атом', icon: '⚛', note: `В центъра е <b>ядрото</b>: протони (червени, положителни) и неутрони (сиви, без заряд). Около него се движат <b>електрони</b> (сини, отрицателни). ${NOT_SCALE}`, obj: () => atomG, dist: 3.4, lift: 1.2, bubble: 1.7 },
        { id: 'storm', label: 'Буря', icon: '⛈', note: 'Макет на къща с гръмоотвод, дърво и буреносен облак. Мълнията е огромна електрична искра.', obj: () => dio, dist: 4.2, lift: 1.2, bubble: 2.4 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Наелектризиране ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    resetLab();
    view(ctx, [-3.6, 1.0, 0.3], 2.3, { halfH: 1.3, elev: 0.3 });
    shell.task('<p>Ще натъркаме балона с вълнения плат и ще го доближим до хартийките.</p>');
    choice(ctx, {
      q: 'Какво ще стане с хартийките?',
      options: [
        { t: 'Ще подскочат и ще се залепят за балона.', ok: true, why: 'Да проверим! Натисни „Търкай“ няколко пъти.' },
        { t: 'Нищо — балонът не ги докосва.', ok: false, why: 'Електричната сила действа и от разстояние. Помисли за косата и гребена.' },
        { t: 'Ще отлетят надалеч от балона.', ok: false, why: 'Хартийките не са заредени. Как наелектризирано тяло действа на ненаелектризирано?' },
      ],
      hint: 'Наелектризираното тяло привлича леки тела.',
      onRight: (m) => rub(m),
    });
  }
  function rub(m0) {
    let mistakes = m0;
    let rubs = 0;
    shell.task('<p><b>Търкай</b> балона с плата (4 пъти). Гледай знаците за заряд.</p>');
    const c = shell.setControls('<div class="row"><button class="btn primary rub">🧶 Търкай</button></div>');
    c.querySelector('.rub').addEventListener('click', (e) => {
      if (S.flyT >= 0) return;
      rubs++; S.flyT = 0; S.q = rubs;
      setTimeout(() => { balQ.show(rubs * 3); woolQ.show(rubs * 3); }, 600);
      if (rubs === 4) {
        e.target.disabled = true;
        setTimeout(() => {
          ctx.say(bal, 'Електроните преминаха от плата в балона. Балонът е <b>отрицателно</b> зареден, а платът — <b>положително</b>.', 'wide', 1.0);
          near();
        }, 1300);
      }
    });
    function near() {
      shell.task('<p>Плъзни лентата и <b>доближи балона</b> до хартийките.</p>');
      const cc = shell.setControls('<label class="row">Далеч <input type="range" class="near" min="0" max="100" value="100" style="flex:1"> Близо</label>');
      let said = false;
      cc.querySelector('.near').addEventListener('input', (ev) => {
        S.dist = 1 - +ev.target.value / 100;
        if (S.dist < 0.3 && !said) {
          said = true;
          setTimeout(() => {
            ctx.say(bal, 'Хартийките подскочиха към балона! Наелектризираното тяло <b>привлича</b> леки тела.', 'good wide', 1.0);
            nextBtn(ctx, 'Напред →', pair);
          }, 900);
        }
      });
    }
    function pair() {
      ctx.clearTip();
      view(ctx, [0.9, 1.4, 0], 1.5, { halfH: 1.5, elev: 0.15 });
      shell.task('<p>Натъркваме с вълна и двата окачени балона. И двата стават <b>отрицателно</b> заредени.</p>');
      const b = nextBtn(ctx, '🧶 Натъркай двата балона', () => {
        b.disabled = true;
        hang.forEach((h) => { h.q.show(6); h.want = 0.38; });
        setTimeout(() => {
          ctx.say(hang[1].b, 'Балоните се раздалечиха!', 'wide', 0.6);
          choice(ctx, {
            q: 'Защо двата балона се отблъскват?',
            options: [
              { t: 'Имат еднакви заряди, а еднаквите заряди се отблъскват.', ok: true, why: 'Вярно! Еднаквите заряди се отблъскват, а различните се привличат.' },
              { t: 'Имат различни заряди.', ok: false, why: 'И двата получиха електрони от вълната. Какви са зарядите им?' },
              { t: 'Вятърът ги раздалечи.', ok: false, why: 'Тук няма вятър. Каква сила действа между заредените тела?' },
            ],
            hint: 'Погледни знаците върху двата балона.',
            mistakes,
            onRight: (m) => { mistakes = m; ctx.scores[0] = stepScore(mistakes, 3); nextBtn(ctx, 'Напред →', step3); },
          });
        }, 1600);
      });
    }
  }

  // ---------- 3. Строеж на атома ----------
  const GOALS = [
    { q: 'Направи атома <b>неутрален</b>.', ok: (p, e) => p === e, no: 'Неутрален е атомът, в който положителните и отрицателните заряди са равни.' },
    { q: 'Направи частицата <b>отрицателно</b> заредена.', ok: (p, e) => e > p, no: 'Отрицателен заряд има, когато електроните са повече от протоните.' },
    { q: 'Направи частицата <b>положително</b> заредена.', ok: (p, e) => e < p, no: 'Положителен заряд има, когато електроните са по-малко от протоните.' },
  ];
  function step3() {
    shell.step(2);
    ctx.clearTip();
    AT.set({ p: 3, n: 4, e: 2 });
    view(ctx, [3.4, 1.5, 0.1], 1.6, { halfH: 1.5, elev: 0.25 });
    let mistakes = 0; let k = 0;
    const draw = () => {
      const G = GOALS[k];
      shell.task(`<p>Литият има <b>3 протона</b> в ядрото. Протоните не могат да излязат от ядрото, но електроните могат да се добавят или махат.</p><p>${G.q}</p><p class="small">${k + 1} от ${GOALS.length}</p>`);
      const c = shell.setControls('<div class="row"><button class="btn eadd">+ електрон</button><button class="btn erem">− електрон</button><button class="btn primary chk">Провери</button></div>');
      c.querySelector('.eadd').addEventListener('click', () => { if (AT.state.e < 6) AT.set({ e: AT.state.e + 1 }); });
      c.querySelector('.erem').addEventListener('click', () => { if (AT.state.e > 0) AT.set({ e: AT.state.e - 1 }); });
      c.querySelector('.chk').addEventListener('click', () => {
        if (G.ok(AT.state.p, AT.state.e)) {
          shell.msg('Вярно!', 'good');
          k++;
          if (k < GOALS.length) draw(); else last();
        } else {
          mistakes++;
          shell.msg(`Не още. ${mistakes >= 2 ? G.no : 'Сравни броя на протоните и електроните.'}`, 'bad');
        }
      });
    };
    draw();
    function last() {
      ctx.say(atomG, 'Атом с повече или по-малко електрони вече не е неутрален — той е <b>заредена частица</b>.', 'wide', 2.6);
      choice(ctx, {
        q: 'Когато търкаме балона с вълна, кои частици преминават от едното тяло в другото?',
        options: [
          { t: 'Електроните', ok: true, why: 'Вярно! Електроните са в обвивката на атома и могат да се преместят. Протоните са здраво в ядрото.' },
          { t: 'Протоните', ok: false, why: 'Протоните са в ядрото и при триене не се местят.' },
          { t: 'Неутроните', ok: false, why: 'Неутроните нямат заряд и са в ядрото.' },
        ],
        hint: 'Кои частици са най-отвън в атома?',
        mistakes,
        onRight: (m) => { ctx.scores[1] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step4); },
      });
    }
  }

  // ---------- 4. Заряди в природата ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [5.8, 1.5, -0.7], 1.6, { halfH: 1.8, elev: 0.15 });
    shell.task('<p>В буреносния облак се натрупват заряди. Отдолу облакът е отрицателно зареден.</p>');
    let mistakes = 0;
    const c = shell.setControls('<label class="row">Заряд в облака <input type="range" class="storm" min="0" max="100" value="0" style="flex:1"></label>');
    c.querySelector('.storm').addEventListener('input', (e) => {
      const v = +e.target.value;
      cloudQ.show(Math.round(v / 10)); groundQ.show(Math.round(v / 17));
      if (v >= 100 && !S.storm) {
        S.storm = 1;
        choice(ctx, {
          q: 'Зарядът е огромен. Къде най-вероятно ще удари мълнията?',
          options: [
            { t: 'В гръмоотвода на покрива', ok: true, why: 'Вярно! Мълнията удря високи и проводящи места. Гръмоотводът отвежда заряда в земята.' },
            { t: 'В тревата между къщата и дървото', ok: false, why: 'Мълнията търси най-краткия път. Кое е най-високо и провежда ток?' },
            { t: 'Мълнията никога не удря в земята', ok: false, why: 'Мълниите често удрят в земята. Защо иначе има гръмоотводи?' },
          ],
          hint: 'Високо и метално.',
          onRight: (m) => {
            mistakes = m;
            S.flash = 0.8; cloudQ.show(2); groundQ.show(1);
            ctx.say(dio, '⚡ Мълнията удари гръмоотвода. Безопасност: при буря не стой под самотно дърво, в открито поле или във вода.', 'wide', 3.0);
            nextBtn(ctx, 'Напред →', examples);
          },
        });
      }
    });
    function examples() {
      ctx.clearTip();
      shell.task('<p>Електрично явление ли е това?</p>');
      sortTask(ctx, {
        bins: ['Електрично явление', 'Не е електрично'],
        items: [
          { t: '⚡ Мълния по време на буря', bin: 0, why: 'Мълнията е огромна искра между заредени облаци и земята.' },
          { t: '🧥 Пукане и искрици при събличане на пуловер', bin: 0, why: 'Дрехите се наелектризират при триене.' },
          { t: '💇 Косата „стърчи“ след сресване', bin: 0, why: 'Косъмчетата се зареждат еднакво и се отблъскват.' },
          { t: '🌈 Дъга след дъжд', bin: 1, why: 'Дъгата е светлинно явление — светлината се разлага в капките.' },
          { t: '🔊 Ехо в планината', bin: 1, why: 'Ехото е звук, отразен от скалите.' },
        ],
        hint: 'Търси триене, искри и привличане.',
        mistakes,
        onDone: (m) => {
          ctx.scores[2] = stepScore(m, 3);
          shell.task('<p>Електричните заряди са навсякъде около нас.</p>');
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
  return { dispose() { atomInfo.remove(); stage.dispose(); } };
}
