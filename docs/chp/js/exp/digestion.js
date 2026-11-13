// 5.3.5 „Храносмилателна система на човека“ — прозрачно дете (Боби от organs4.js) с храносмилателни органи,
// маса с храни и увеличен участък от тънкото черво (не в мащаб).
// Стъпки: опознай → какво става във всеки орган (хапката пътува) → храните и кръвта → здравословни навици.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { curveOf, flowDots, organMat, glowOf, hitTube } from './anatomy.js';
import { buildKid, buildStomach, buildIntestines, buildLiver, buildEsophagus } from './organs4.js';

const KX = -1.6;
const PANC = [0.3, 1.97, -0.05];

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Какво става с храната', 'Храните и кръвта', 'Здравословни навици'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xfff8e1, camPos: [0, 3, 9], target: [0, 2.2, 0], maxDistance: 18 } });
  const { shell, stage, scene } = ctx;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat(0xd7ccc8)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), mat(0xfff3e0)); wall.position.set(0, 7, -3); scene.add(wall);
  const note = document.createElement('div');
  note.textContent = '⚠ Не е в мащаб';
  note.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:4;pointer-events:none;background:rgba(255,255,255,.9);color:#8a6d00;font-size:.78rem;border-radius:8px;padding:3px 8px';
  shell.stageEl.appendChild(note);

  // ---------- Боби ----------
  const K = buildKid();
  const kid = K.kid;
  kid.position.set(KX, 0, 0);
  scene.add(kid);
  const organs = {};
  const add = (id, g, pos) => { if (pos) g.position.set(...pos); g.userData.pickId = id; kid.add(g); organs[id] = g; return g; };
  add('esophagus', buildEsophagus());
  add('stomach', buildStomach(), [0.22, 2.02, 0.1]); addHitBox(organs.stomach, 0.3);
  add('liver', buildLiver(), [-0.2, 2.03, 0.06]); addHitBox(organs.liver, 0.25);
  const intest = add('intestines', buildIntestines(), [0, 1.7, 0.08]);
  intest.userData.pickId = undefined;
  intest.userData.small.userData.pickId = 'small';
  intest.userData.large.userData.pickId = 'large';
  for (const k of ['small', 'large']) { const h = hitTube(intest.userData[k].userData.curve, k === 'small' ? 0.06 : 0.08); h.userData.pickId = k; intest.add(h); }
  organs.mouth = K.mouth; K.mouth.userData.pickId = 'mouth'; addHitBox(K.mouth, 0.2);
  // задстомашна жлеза: продълговата, зад и под стомаха (не е в мащаб)
  { const g = new THREE.Group();
    const pm = organMat(0xf3c27a, { roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.26, 4, 10), pm);
    body.rotation.z = Math.PI / 2 - 0.18;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), pm);
    head.position.set(-0.15, -0.03, 0);
    g.add(body, head);
    add('pancreas', g, PANC);
    addHitBox(g, 0.12); }
  organs.small = intest.userData.small; organs.large = intest.userData.large;
  const glows = {};
  for (const id of ['mouth', 'esophagus', 'stomach', 'liver', 'pancreas', 'small', 'large']) glows[id] = glowOf(organs[id]);
  const anchor = (parent, pos) => { const a = new THREE.Object3D(); a.position.set(...pos); parent.add(a); return a; };
  const at = {
    mouth: anchor(K.head, [0, -0.2, 0.6]), esophagus: anchor(kid, [0.05, 2.62, -0.04]), stomach: anchor(organs.stomach, [0.05, 0.1, 0]),
    liver: anchor(organs.liver, [-0.05, 0.1, 0.05]), pancreas: anchor(organs.pancreas, [0.02, 0, 0.04]), small: anchor(intest, [0, 0.0, 0.1]), large: anchor(intest, [-0.35, 0.05, 0.05]),
  };
  ctx.pt = (id) => at[id]; // за автоматичните тестове: точка върху органа
  // хапката
  const bolus = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), organMat(0xf2df9a)); bolus.visible = false; kid.add(bolus);
  const WAY = {
    mouth: [[0, 3.75, 0.45]], esophagus: [[0, 3.55, 0.1], [0, 3.1, -0.12], [0.05, 2.6, -0.07], [0.13, 2.22, 0.03]],
    stomach: [[0.22, 2.05, 0.12]], liver: [[0.0, 1.95, 0.12]], small: [[0.1, 1.85, 0.15], [-0.15, 1.75, 0.15], [0.15, 1.6, 0.15]], large: [[-0.34, 1.85, 0.12], [0, 1.9, 0.14], [0.34, 1.82, 0.12], [0.3, 1.5, 0.1]],
  };
  const trip = { curve: null, k: 1 };
  let last = new THREE.Vector3(0, 3.75, 0.7);
  function go(id) {
    if (!WAY[id]) return; // храната не минава през задстомашната жлеза
    const pts = [last.toArray(), ...WAY[id]];
    trip.curve = curveOf(pts); trip.k = 0;
    last = new THREE.Vector3(...WAY[id][WAY[id].length - 1]);
    bolus.visible = true;
  }
  // хранителни вещества в кръвта (до тънкото черво)
  const bloodC = curveOf([[0.15, 1.62, 0.22], [0.42, 1.9, 0.22], [0.45, 2.5, 0.2], [0.3, 2.9, 0.18], [-0.3, 2.9, 0.18], [-0.45, 2.4, 0.2], [-0.38, 1.8, 0.22]], true);
  const vessel = new THREE.Mesh(new THREE.TubeGeometry(bloodC, 50, 0.02, 6, true), organMat(0xd32f2f)); vessel.visible = false; kid.add(vessel);
  const nutri = flowDots(bloodC, { n: 14, r: 0.03, color: 0xffb300, speed: 0.5 }); nutri.visible = false; kid.add(nutri);

  // ---------- Тънкото черво под лупа ----------
  const villi = new THREE.Group();
  { const basePl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.8), organMat(0xf4a582)); villi.add(basePl);
    for (let i = 0; i < 8; i++) { const v = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 4, 10), organMat(0xf7b48c)); v.position.set(-0.75 + i * 0.21, 0.32, 0); villi.add(v);
      const cap = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14, Math.PI), organMat(0xd32f2f)); cap.position.set(-0.75 + i * 0.21, 0.42, 0.06); villi.add(cap); }
    const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), organMat(0xd32f2f)); vein.rotation.z = Math.PI / 2; vein.position.set(0, 0.0, 0.42); villi.add(vein); }
  const lumen = [];
  for (let i = 0; i < 16; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffb300 })); d.userData.k = Math.random(); d.userData.x = -0.8 + Math.random() * 1.6; villi.add(d); lumen.push(d); }
  villi.position.set(2.2, 2.4, 0.3);
  villi.visible = false;
  const vLbl = labelSprite('тънко черво под лупа (увеличено)', { size: 0.2 }); vLbl.position.set(0, -0.35, 0.3); villi.add(vLbl);
  scene.add(villi);

  // ---------- Маса с храни ----------
  const table = new THREE.Group();
  { const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.2), mat(0xa1887f)); top.position.y = 1.1; table.add(top);
    for (const sx of [-1.15, 1.15]) for (const sz of [-0.5, 0.5]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.08), mat(0x6d4c41)); l.position.set(sx, 0.55, sz); table.add(l); } }
  const foods = [
    ['хляб', 0xd7a86e, (g) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.25, 4, 10), mat(0xd7a86e)); m.rotation.z = Math.PI / 2; g.add(m); }],
    ['ябълка', 0xe53935, (g) => g.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), mat(0xe53935)))],
    ['яйце', 0xfff8e1, (g) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), mat(0xfff8e1)); m.scale.y = 1.3; g.add(m); }],
    ['мляко', 0xffffff, (g) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12), mat(0xffffff)); g.add(m); }],
    ['риба', 0x90a4ae, (g) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat(0x90a4ae)); m.scale.set(1.8, 0.6, 0.6); g.add(m); }],
    ['боб', 0x8d6e63, (g) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.08, 14), mat(0xffffff)); g.add(b); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), mat(0xa1887f)); s.position.set((Math.random() - 0.5) * 0.15, 0.05, (Math.random() - 0.5) * 0.15); g.add(s); } }],
  ];
  foods.forEach(([n, , build], i) => { const g = new THREE.Group(); build(g); g.position.set(-0.95 + (i % 3) * 0.95, 1.28, i < 3 ? -0.25 : 0.3); const l = labelSprite(n, { size: 0.15 }); l.position.y = 0.3; g.add(l); stage.steadyLabel(l, 6); table.add(g); });
  table.position.set(2.2, 0, 0);
  table.userData.pickId = 'table';
  scene.add(table);

  stage.tick((dt, t) => {
    if (trip.curve && trip.k < 1) { trip.k = Math.min(1, trip.k + dt * 0.8); trip.curve.getPointAt(trip.k, bolus.position); }
    K.head.rotation.y = Math.sin(t * 0.4) * 0.08;
    K.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 0.8 + i * Math.PI) * 0.05; });
    if (nutri.visible) nutri.userData.update(dt);
    if (villi.visible) for (const d of lumen) { const k = (d.userData.k + t * 0.3) % 1; d.position.set(d.userData.x, 0.75 - k * 0.75, -0.05 + k * 0.45); }
    organs.stomach.userData.body.scale.y = 0.14 + Math.sin(t * 2) * 0.006;
  });

  function clearGlows() { for (const g of Object.values(glows)) g.set(0); }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip(); clearGlows();
    bolus.visible = false; last = new THREE.Vector3(0, 3.75, 0.7); trip.k = 1;
    vessel.visible = nutri.visible = false; villi.visible = false;
    view(ctx, [KX, 2.6, 0], 1.6, { halfH: 1.6, elev: 0.1 });
    const it = (id, label, icon, note) => ({ id, label, icon, note, obj: () => at[id], dist: 2.2, lift: 0, bubble: 0.3 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Боби е прозрачен: виждаш органите на <b>храносмилателната система</b>. Тя превръща храната в хранителни вещества, които кръвта разнася до клетките.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        it('mouth', 'Уста и зъби', '🦷', 'Зъбите раздробяват храната, а <b>слюнката</b> я овлажнява и започва смилането.'),
        it('esophagus', 'Хранопровод', '⬇', 'Мускулеста тръба, по която хапката слиза до стомаха.'),
        it('stomach', 'Стомах', '🥣', 'Стомахът разбърква храната със <b>стомашен сок</b> и я смила.'),
        it('liver', 'Черен дроб', '🟤', 'Черният дроб отделя <b>жлъчка</b>. Тя е течност, която раздробява мазнините на ситни капчици. Така те се смилат по-лесно.'),
        it('pancreas', 'Задстомашна жлеза', '🟠', 'Лежи зад стомаха. Отделя <b>сок</b> в тънкото черво. Той помага да се смелят белтъците, въглехидратите и мазнините.'),
        it('small', 'Тънко черво', '〰', 'В тънкото черво смилането завършва и хранителните вещества <b>преминават в кръвта</b>.'),
        it('large', 'Дебело черво', '🌀', 'В дебелото черво се поема <b>водата</b>, а остатъците се изхвърлят.'),
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Какво става с храната ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    view(ctx, [KX, 2.6, 0], 1.6, { halfH: 1.6, elev: 0.1 });
    shell.task('<p>Боби отхапа от сандвич. Хапката тръгва по храносмилателната система.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Как мислиш: къде хранителните вещества преминават в кръвта?',
      options: [
        { t: 'В тънкото черво', ok: true, why: 'Да проверим! Следвай хапката.' },
        { t: 'В стомаха', ok: false, why: 'В стомаха смилането едва започва. Къде храната е смляна докрай?' },
        { t: 'В дебелото черво', ok: false, why: 'В дебелото черво се поема главно водата. А хранителните вещества — по-рано.' },
      ],
      hint: 'Най-дългата част на храносмилателната тръба.',
      onRight: (m) => { mistakes = m; tasks(); },
    });
    const TASKS = [
      { id: 'mouth', q: 'Кликни органа, който <b>раздробява</b> храната и я овлажнява със слюнка.', ok: 'Устата: зъбите сдъвкват, слюнката овлажнява.' },
      { id: 'esophagus', q: 'Кликни органа, по който хапката <b>слиза</b> към стомаха.', ok: 'Хранопроводът пренася хапката.' },
      { id: 'stomach', q: 'Кликни органа, който <b>смила</b> храната със стомашен сок.', ok: 'Стомахът смила храната.' },
      { id: 'liver', q: 'Кликни органа, който отделя <b>жлъчка</b> за смилането на мазнините.', ok: 'Черният дроб отделя жлъчка.' },
      { id: 'pancreas', q: 'Кликни жлезата <b>зад стомаха</b>, която отделя сок в тънкото черво.', ok: 'Задстомашната жлеза! Храната не минава през нея, но сокът ѝ помага за смилането.' },
      { id: 'small', q: 'Кликни органа, в който хранителните вещества <b>минават в кръвта</b>.', ok: 'Тънкото черво! Хранителните вещества минават в кръвта.' },
      { id: 'large', q: 'Кликни органа, в който се поема <b>водата</b>.', ok: 'Дебелото черво поема водата.' },
    ];
    function tasks() {
      let k = 0;
      const ask = () => {
        ctx.answer = TASKS[k].id;
        // Задстомашната жлеза е скрита зад стомаха: за тази задача стомахът се скрива за малко.
        const hide = TASKS[k].id === 'pancreas';
        organs.stomach.visible = !hide;
        shell.task(`<p>${TASKS[k].q}</p>${hide ? '<p class="small">Стомахът е скрит за малко, за да видиш какво има зад него.</p>' : ''}`);
      };
      shell.setControls('');
      ask();
      ctx.click = (id) => {
        if (!id || k >= TASKS.length) return;
        const T = TASKS[k];
        if (id !== T.id) {
          mistakes++;
          shell.msg(`Това не е той.${mistakes >= 2 ? ' Подсказка: виж менюто от първата стъпка — всеки орган има своя работа.' : ''}`, 'bad');
          return;
        }
        clearGlows(); glows[id].set(0.6, 0xffb060);
        go(id);
        shell.msg(T.ok, 'good');
        k++;
        if (k < TASKS.length) { ask(); return; }
        ctx.click = null; ctx.answer = null;
        organs.stomach.visible = true;
        if (id === 'large') { vessel.visible = true; nutri.visible = true; }
        ctx.scores[0] = stepScore(mistakes, 3);
        shell.task('<p>Хранителните вещества (жълтите точки) вече са в кръвта.</p>');
        nextBtn(ctx, 'Напред →', step3);
      };
    }
  }

  // ---------- 3. Храните и кръвта ----------
  function step3() {
    shell.step(2);
    ctx.clearTip(); clearGlows(); bolus.visible = false;
    vessel.visible = nutri.visible = true; villi.visible = true;
    view(ctx, [0.4, 2.2, 0.1], 3.2, { halfH: 1.6, elev: 0.15 });
    ctx.say(villi, 'Стената на тънкото черво има милиони малки власинки. През тях хранителните вещества минават в <b>кръвта</b>, а кръвта ги разнася до всички <b>клетки</b> на тялото. Това е опростено: мазнините минават първо в <b>лимфата</b> — друга течност в тялото — и после в кръвта.', 'wide', 1.2);
    shell.task('<p>Храните са от <b>растителен</b> или от <b>животински</b> произход.</p>');
    sortTask(ctx, {
      bins: ['Растителен произход', 'Животински произход'],
      items: [
        { t: 'хляб', bin: 0, why: 'Хлябът е от жито — растение.' },
        { t: 'ябълка', bin: 0, why: 'Ябълката е плод на растение.' },
        { t: 'боб', bin: 0, why: 'Бобът е семе на растение.' },
        { t: 'яйце', bin: 1, why: 'Яйцето е от животно.' },
        { t: 'мляко', bin: 1, why: 'Млякото е от животно.' },
        { t: 'риба', bin: 1, why: 'Рибата е животно.' },
      ],
      hint: 'Откъде идва храната: от растение или от животно?',
      onDone: (m) => {
        ctx.clearTip();
        shell.task('<p>С какво вещество е най-богата всяка храна?</p>');
        sortTask(ctx, {
          bins: ['Белтъци', 'Въглехидрати', 'Мазнини'],
          items: [
            { t: 'месо, риба, яйца', bin: 0, why: 'Белтъците изграждат тялото — растем с тях.' },
            { t: 'хляб, картофи, ориз', bin: 1, why: 'Въглехидратите дават бърза енергия.' },
            { t: 'олио, масло', bin: 2, why: 'Мазнините дават много енергия — нужни са в малко количество.' },
          ],
          hint: 'Белтъци — за растеж, въглехидрати — за енергия.',
          mistakes: m,
          onDone: (m2) => { ctx.scores[1] = stepScore(m2, 3); shell.msg('Браво!', 'good'); nextBtn(ctx, 'Напред →', step4); },
        });
      },
    });
  }

  // ---------- 4. Здравословни навици ----------
  function step4() {
    shell.step(3);
    ctx.clearTip(); villi.visible = false;
    view(ctx, [KX + 0.2, 2.4, 0], 1.8, { halfH: 1.8, elev: 0.1 });
    shell.task('<p>Боби иска храносмилателната му система да е здрава.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Боби се храни набързо и гълта хапките почти несдъвкани. Какво ще стане?',
      options: [
        { t: 'Стомахът ще се затрудни, защото храната не е раздробена и овлажнена.', ok: true, why: 'Вярно! Смилането започва в устата — дъвчи бавно.' },
        { t: 'Ще смели храната по-бързо.', ok: false, why: 'Кой раздробява храната, ако не зъбите?' },
        { t: 'Нищо: зъбите не са част от храносмилането.', ok: false, why: 'Спомни си първия орган по пътя на хапката.' },
      ],
      hint: 'Какво правят зъбите и слюнката?',
      onRight: (m) => {
        mistakes = m;
        sortTask(ctx, {
          lead: 'Кои навици пазят храносмилателната система?',
          bins: ['Полезно', 'Вредно'],
          items: [
            { t: 'Мия ръцете си преди хранене.', bin: 0, why: 'Така микробите не влизат с храната.' },
            { t: 'Ям плодове и зеленчуци всеки ден.', bin: 0, why: 'Те съдържат витамини и фибри. Фибрите са растителни влакна, които помагат на червата.' },
            { t: 'Пия газирани напитки вместо вода.', bin: 1, why: 'Захарта в тях вреди на зъбите. Водата утолява жаждата без захар.' },
            { t: 'Мия зъбите си сутрин и вечер.', bin: 0, why: 'Пазим зъбите от кариес.' },
            { t: 'Ям много сладкиши и чипс.', bin: 1, why: 'Много захар, сол и мазнини вредят.' },
          ],
          hint: 'Какво помага на зъбите, стомаха и червата?',
          mistakes,
          onDone: (m2) => { ctx.scores[2] = stepScore(m2, 3); shell.msg('Браво!', 'good'); finishBtn(ctx, onComplete, restart); },
        });
      },
    });
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    ctx.answer = null;
    organs.stomach.visible = true;
    step1();
  }
  step1();
  return { dispose() { note.remove(); stage.dispose(); } };
}
