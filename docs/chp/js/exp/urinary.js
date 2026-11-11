// 5.3.7 „Отделителна система на човека“ — прозрачният Боби (organs4.js) с бъбреци, пикочопроводи и пикочен мехур (не в мащаб).
// Стъпки: опознай → бъбреците пречистват кръвта: колко вода пием (симулация) → пътят на урината и другите отделителни органи
// → навици, които пазят отделителната система.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { curveOf, flowDots, organMat, glowOf, tube } from './anatomy.js';
import { buildKid, buildLungs } from './organs4.js';

const KX = -1.2;

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Бъбреците и водата', 'Пътят на урината', 'Пази отделителната система'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xe0f2f1, camPos: [0, 3, 9], target: [0, 2.2, 0], maxDistance: 18 } });
  const { shell, stage, scene } = ctx;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat(0xcfd8dc)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), mat(0xe8f5e9)); wall.position.set(0, 7, -3); scene.add(wall);
  const note = document.createElement('div');
  note.textContent = '⚠ Не е в мащаб';
  note.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:4;pointer-events:none;background:rgba(255,255,255,.9);color:#8a6d00;font-size:.78rem;border-radius:8px;padding:3px 8px';
  shell.stageEl.appendChild(note);

  // ---------- Боби ----------
  const K = buildKid();
  const kid = K.kid;
  kid.position.set(KX, 0, 0);
  scene.add(kid);
  // гащетата стават прозрачни, за да се вижда пикочният мехур
  kid.traverse((o) => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0x3f7fd6) { o.material.transparent = true; o.material.opacity = 0.35; o.material.depthWrite = false; } });
  const lungs = buildLungs(); lungs.position.set(0, 2.72, 0); kid.add(lungs);
  lungs.userData.pickId = 'lungs';
  const organs = {};
  const kidneys = new THREE.Group();
  for (const s of [-1, 1]) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), organMat(0x8e3b2f, { emissive: 0xffeb3b, emissiveIntensity: 0 }));
    k.scale.set(0.75, 1.15, 0.6); k.position.set(s * 0.25, 2.0, -0.12);
    k.rotation.z = s * 0.2;
    kidneys.add(k);
  }
  kidneys.userData.pickId = 'kidneys'; kid.add(kidneys); addHitBox(kidneys, 0.3); organs.kidneys = kidneys;
  const ureters = new THREE.Group();
  const uretC = [-1, 1].map((s) => curveOf([[s * 0.22, 1.88, -0.1], [s * 0.18, 1.6, -0.05], [s * 0.08, 1.33, 0.06]]));
  uretC.forEach((c) => ureters.add(tube(c, 0.018, organMat(0xf5d76e, { emissive: 0xffeb3b, emissiveIntensity: 0 }), 16)));
  ureters.userData.pickId = 'ureters'; kid.add(ureters); organs.ureters = ureters;
  const bladder = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 14), organMat(0xf5d76e, { emissive: 0xffeb3b, emissiveIntensity: 0 }));
  bladder.position.set(0, 1.28, 0.08);
  const bladderG = new THREE.Group(); bladderG.add(bladder); bladderG.userData.pickId = 'bladder'; kid.add(bladderG); addHitBox(bladderG, 0.25); organs.bladder = bladderG;
  const urethra = tube([[0, 1.18, 0.08], [0, 1.08, 0.08]], 0.015, organMat(0xf5d76e), 6); kid.add(urethra);
  // кръв: аорта и бъбречни артерии
  const aorta = tube([[0.04, 2.75, -0.15], [0.04, 2.2, -0.16], [0.04, 1.6, -0.15]], 0.03, organMat(0xd32f2f), 16); kid.add(aorta);
  const bloodC = [-1, 1].map((s) => curveOf([[0.04, 2.7, -0.15], [0.04, 2.15, -0.16], [s * 0.12, 2.05, -0.14], [s * 0.2, 2.0, -0.12]]));
  bloodC.forEach((c) => kid.add(tube(c, 0.018, organMat(0xd32f2f), 12)));
  const waste = bloodC.map((c) => flowDots(c, { n: 6, r: 0.026, color: 0xfdd835, speed: 0.35 }));
  const cleanB = bloodC.map((c) => flowDots(c, { n: 8, r: 0.024, color: 0xb71c1c, speed: 0.35 }));
  [...waste, ...cleanB].forEach((d) => kid.add(d));
  const urineDots = uretC.map((c) => flowDots(c, { n: 4, r: 0.022, color: 0xfbc02d, speed: 0.2 }));
  urineDots.forEach((d) => kid.add(d));
  const glows = { kidneys: glowOf(kidneys), ureters: glowOf(ureters), bladder: glowOf(bladderG) };
  // кожа с капчици пот (на ръката)
  const sweat = [];
  for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb3e5fc, roughness: 0.05 })); d.position.set(0.12, -0.3 - i * 0.12, 0.12); d.userData.k = i / 6; K.arms[0].add(d); sweat.push(d); }
  const skinAt = new THREE.Object3D(); skinAt.position.set(0.1, -0.6, 0.15); K.arms[0].add(skinAt);
  skinAt.userData.pickId = 'skin'; skinAt.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
  const anchor = (parent, pos) => { const a = new THREE.Object3D(); a.position.set(...pos); parent.add(a); return a; };
  const at = { kidneys: anchor(kid, [0.25, 2.05, 0]), ureters: anchor(kid, [0.18, 1.6, 0]), bladder: anchor(kid, [0, 1.3, 0.1]), lungs: anchor(kid, [-0.3, 2.9, 0.1]), skin: skinAt };
  ctx.pt = (id) => at[id];

  // ---------- Чаша вода ----------
  const cup = new THREE.Group();
  { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.5, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); g.position.y = 0.25;
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.38, 20), new THREE.MeshStandardMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.6 })); w.position.y = 0.2; cup.add(g, w);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.7), mat(0xa1887f)); t.position.y = -0.03; cup.add(t);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), mat(0x6d4c41)); leg.position.y = -0.7; cup.add(leg); }
  cup.position.set(1.3, 1.35, 0.3);
  cup.userData.pickId = 'water';
  const cl = labelSprite('чаша вода', { size: 0.18 }); cl.position.y = 0.75; cup.add(cl); stage.steadyLabel(cl, 6);
  scene.add(cup); addHitBox(cup, 0.5);
  // показател за цвета на урината
  const S = { cups: 3, hot: true, fill: 0 };
  const shade = () => {
    // 1 = много светла, 0 = тъмна. Приблизителен модел.
    const need = S.hot ? 6 : 5;
    return Math.max(0, Math.min(1, (S.cups - 1) / (need - 1)));
  };
  const urineCol = (k) => new THREE.Color(0xd4880f).lerp(new THREE.Color(0xfff59d), k);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffca28 })); sun.position.set(2.6, 4.1, -2.5); scene.add(sun);

  stage.tick((dt, t) => {
    const k = shade();
    const rate = 0.6 + k * 0.8;
    for (const d of [...waste, ...cleanB]) d.userData.update(dt);
    urineDots.forEach((d) => { d.userData.update(dt, rate); d.material.color.copy(urineCol(k)); });
    bladder.material.color.copy(urineCol(k));
    S.fill = (S.fill + dt * 0.05 * rate) % 1;
    bladder.scale.setScalar(0.8 + S.fill * 0.45);
    glows.kidneys.set(0.12 + Math.sin(t * 3) * 0.08, 0xffeb3b);
    sweat.forEach((d) => { d.visible = S.hot; const q = (d.userData.k + t * 0.2) % 1; d.position.y = -0.3 - q * 0.7; });
    sun.visible = S.hot;
    sun.scale.setScalar(1 + Math.sin(t * 2) * 0.04);
    const br = Math.sin(t * 2); lungs.userData.lobes.forEach((l) => l.scale.set(l.userData.base.x * (1 + br * 0.04), l.userData.base.y * (1 + br * 0.04), l.userData.base.z));
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    S.cups = 6; S.hot = false;
    view(ctx, [KX + 0.6, 2.2, 0], 1.7, { halfH: 1.4, elev: 0.1 });
    const it = (id, label, icon, note) => ({ id, label, icon, note, obj: () => at[id], dist: 2.2, lift: 0, bubble: 0.3 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>При човека <b>отделителната система</b> изхвърля ненужните вещества от кръвта. Виж я в прозрачния Боби.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        it('kidneys', 'Бъбреци', '🫘', 'Човек има <b>два бъбрека</b>. Те са отзад в корема, от двете страни на гръбнака. Пречистват кръвта и образуват <b>урина</b>.'),
        it('ureters', 'Пикочопроводи', '〰', 'Две тънки тръбички отвеждат урината от бъбреците към пикочния мехур.'),
        it('bladder', 'Пикочен мехур', '🟡', 'Пикочният мехур <b>събира</b> урината. Когато се напълни, усещаме нужда да отидем до тоалетна.'),
        it('skin', 'Кожа', '💧', 'Кожата също отделя: с <b>потта</b> излизат вода и соли.'),
        { id: 'water', label: 'Чаша вода', icon: '🥛', note: 'Водата е нужна, за да могат бъбреците да изхвърлят ненужните вещества.', obj: () => cup, dist: 2.2 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Бъбреците и водата ----------
  function step2() {
    shell.step(1);
    S.cups = 2; S.hot = true;
    view(ctx, [KX + 0.6, 1.9, 0], 1.4, { halfH: 1.1, elev: 0.1 });
    ctx.say(at.kidneys, 'Кръвта носи ненужни вещества (жълто) към бъбреците. Бъбреците ги изхвърлят с урината.', 'wide', 0.4);
    shell.task('<p>Горещ летен ден. Боби тича, поти се и е изпил само <b>2 чаши</b> вода.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Каква ще бъде урината му?',
      options: [
        { t: 'Малко и по-тъмна.', ok: true, why: 'Вярно! Тялото пести водата. Сега му помогни.' },
        { t: 'Много и светла.', ok: false, why: 'Боби губи вода с потта и пие малко. Откъде ще дойде много урина?' },
        { t: 'Няма да се промени.', ok: false, why: 'Водата, която пием и губим, влияе на урината. Как?' },
      ],
      hint: 'Помисли колко вода е останала в тялото.',
      onRight: (m) => { mistakes = m; drink(); },
    });
    function drink() {
      ctx.clearTip();
      ctx.answer = 6;
      shell.task(`<p>Колко чаши вода трябва да изпие Боби в този горещ ден, за да е урината <b>светложълта</b>?</p>
        <label class="small">Чаши вода за деня: <b class="cv">${S.cups}</b>
        <input class="slider cs" type="range" min="1" max="8" step="1" value="${S.cups}"></label>
        <p class="small">Цветът е приблизителен модел. Светложълтата урина показва, че пием достатъчно вода.</p>`);
      const sl = container.querySelector('.cs');
      sl.addEventListener('input', () => { S.cups = +sl.value; container.querySelector('.cv').textContent = S.cups; });
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      c.querySelector('.chk').addEventListener('click', () => {
        if (shade() >= 1) {
          c.querySelector('.chk').disabled = true; sl.disabled = true; ctx.answer = null;
          ctx.say(at.bladder, '✔ Урината е светла. При жега и движение пием повече вода — около 6–8 чаши на ден.', 'good wide', 0.3);
          ctx.scores[0] = stepScore(mistakes, 3);
          nextBtn(ctx, 'Напред →', step3);
          return;
        }
        mistakes++;
        shell.msg(`Урината още е тъмна: водата не стига.${mistakes >= 2 ? ' Подсказка: в жега са нужни поне 6 чаши.' : ''}`, 'bad');
      });
    }
  }

  // ---------- 3. Пътят на урината ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    S.hot = false; S.cups = 6;
    view(ctx, [KX + 0.4, 1.9, 0], 1.4, { halfH: 1.1, elev: 0.1 });
    const ids = ['kidneys', 'ureters', 'bladder', null];
    orderTask(ctx, {
      q: 'Подреди органите по пътя на урината.',
      items: ['бъбреци', 'пикочопроводи', 'пикочен мехур', 'пикочен канал (навън)'],
      hint: 'Урината се образува в бъбреците.',
      onPick: (i) => { Object.values(glows).forEach((g) => g.set(0)); if (ids[i]) { glows[ids[i]].set(0.6, 0xffeb3b); ctx.say(at[ids[i]], ['бъбреци', 'пикочопроводи', 'пикочен мехур'][i], 'tag', 0.15); } },
      onDone: (m) => {
        ctx.clearTip();
        view(ctx, [KX + 0.4, 2.3, 0], 1.6, { halfH: 1.5, elev: 0.1 });
        shell.task('<p>И други органи изхвърлят ненужни вещества. Кой какво отделя?</p>');
        const look = (id, t) => () => ctx.say(at[id], t, 'tag', 0.15);
        sortTask(ctx, {
          bins: ['Бъбреци', 'Бели дробове', 'Кожа'],
          items: [
            { t: 'урина', bin: 0, show: look('kidneys', 'бъбреци'), why: 'Бъбреците образуват урина.' },
            { t: 'въглероден диоксид и водна пара', bin: 1, show: look('lungs', 'бели дробове'), why: 'Издишваме въглероден диоксид и водна пара.' },
            { t: 'пот: вода и соли', bin: 2, show: look('skin', 'кожа'), why: 'Потта излиза през кожата.' },
          ],
          hint: 'Кое издишваме? Какво има в потта?',
          mistakes: m,
          onDone: (m2) => {
            ctx.clearTip();
            choice(ctx, {
              q: 'Каква е ролята на кръвта за отделянето?',
              options: [
                { t: 'Взема ненужните вещества от клетките и ги носи до бъбреците, белите дробове и кожата.', ok: true, why: 'Вярно! Кръвта свързва клетките с отделителните органи.' },
                { t: 'Образува урината сама.', ok: false, why: 'Урината се образува в бъбреците. Какво прави кръвта?' },
                { t: 'Кръвта не участва в отделянето.', ok: false, why: 'Виж жълтите точки в кръвоносните съдове към бъбреците.' },
              ],
              hint: 'Жълтите точки идват с кръвта.',
              mistakes: m2,
              onRight: (m3) => { ctx.scores[1] = stepScore(m3, 3); nextBtn(ctx, 'Напред →', step4); },
            });
          },
        });
      },
    });
  }

  // ---------- 4. Пази отделителната система ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    Object.values(glows).forEach((g) => g.set(0));
    view(ctx, [KX + 0.8, 2.2, 0], 1.9, { halfH: 1.5, elev: 0.1 });
    shell.task('<p>Как влияе всеки навик на отделителната система?</p>');
    sortTask(ctx, {
      bins: ['Полезно', 'Вредно'],
      items: [
        { t: 'Пия достатъчно вода през деня.', bin: 0, why: 'Водата помага на бъбреците да изхвърлят ненужните вещества.' },
        { t: 'Ям много солени храни.', bin: 1, why: 'Многото сол натоварва бъбреците.' },
        { t: 'Седя на студени камъни и бетон.', bin: 1, why: 'Простудата може да предизвика възпаление на бъбреците и пикочния мехур.' },
        { t: 'Не задържам дълго урината.', bin: 0, why: 'Задържането дълго време вреди на пикочния мехур.' },
        { t: 'Къпя се редовно.', bin: 0, why: 'Чистата кожа отделя потта по-лесно и пази от микроби.' },
        { t: 'Пия газирани напитки вместо вода.', bin: 1, why: 'Захарта и добавките в тях не помагат на бъбреците. Най-добре е водата.' },
      ],
      hint: 'Водата, топлото облекло и хигиената помагат.',
      onDone: (m) => {
        S.hot = true; S.cups = 6;
        choice(ctx, {
          q: 'В горещ ден Боби се поти много. Какво става с урината му, ако пие същото количество вода?',
          options: [
            { t: 'Става по-малко, защото повече вода излиза с потта.', ok: true, why: 'Вярно! Кожата и бъбреците работят заедно.' },
            { t: 'Става повече.', ok: false, why: 'Водата, която излиза с потта, вече я няма в тялото. Какво остава за урината?' },
            { t: 'Не се променя.', ok: false, why: 'С потта губим вода. Как се отразява това?' },
          ],
          hint: 'Водата в тялото излиза по няколко пътя.',
          mistakes: m,
          onRight: (m2) => { ctx.scores[2] = stepScore(m2, 3); finishBtn(ctx, onComplete, restart); },
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
