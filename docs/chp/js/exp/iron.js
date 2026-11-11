// 6.2.5 „Желязото и корозията“ — четири епруветки с пирони, железен прът с уреди за проверка на свойствата,
// чугунен тиган и стоманени релси.
// Стъпки: опознай → кога желязото ръждясва (опит за дни) → свойства на желязото → опазване, чугун и стомана.
import { labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { tagOver, testTube, TEACHER } from './chem6.js';

const V3 = THREE.Vector3;

function nailModel() {
  const g = new THREE.Group();
  const m = mat(0x9e9e9e, { metalness: 0.75, roughness: 0.3 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), m);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), m);
  head.position.y = 0.3;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 8), m);
  tip.rotation.x = Math.PI; tip.position.y = -0.33;
  g.add(shaft, head, tip);
  g.userData.m = m;
  return g;
}

const TUBES = [
  { id: 't-A', name: 'А: вода и въздух', water: 0.45, oil: false, dry: false, salt: false, rate: 0.6 },
  { id: 't-B', name: 'Б: сварена вода и олио', water: 0.55, oil: true, dry: false, salt: false, rate: 0 },
  { id: 't-C', name: 'В: сух въздух', water: 0, oil: false, dry: true, salt: false, rate: 0 },
  { id: 't-D', name: 'Г: солена вода и въздух', water: 0.45, oil: false, dry: false, salt: true, rate: 1 },
];

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Кога желязото ръждясва?', 'Свойства на желязото', 'Опазване, чугун и стомана'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.9, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 15, d: 4.8 });

  // ---------- Четири епруветки с пирони ----------
  const rack = new THREE.Group();
  { const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.5), mat(0x8d6e63)); top.position.y = 0.6; const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.5), mat(0x8d6e63)); base.position.y = 0.03; for (const x of [-1.25, 1.25]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.5), mat(0x6d4c41)); l.position.set(x, 0.3, 0); rack.add(l); } rack.add(top, base); }
  const tubes = TUBES.map((T, i) => {
    const tb = testTube(1.2, 0.15);
    tb.position.set(-0.9 + i * 0.6, 0.06, 0);
    tb.userData.fill(T.water, T.salt ? 0xe0f2f1 : 0xb3e5fc);
    if (T.oil) { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xffd54f, transparent: true, opacity: 0.8 })); o.position.y = 0.15 + T.water * 1.2 + 0.04; tb.add(o); const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.12, 14), mat(0xbcaaa4)); cork.position.y = 1.4; tb.add(cork); }
    if (T.dry) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 14), mat(0xfafafa, { roughness: 1, flat: true })); c.position.y = 0.2; tb.add(c); const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.12, 14), mat(0xbcaaa4)); cork.position.y = 1.4; tb.add(cork); }
    const n = nailModel();
    n.position.y = T.dry ? 0.75 : 0.52;
    tb.add(n);
    const rustSpots = [];
    for (let k = 0; k < 10; k++) { const r = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), mat(0xa0461d, { roughness: 1 })); r.position.set(Math.cos(k * 2.3) * 0.022, -0.25 + k * 0.055, Math.sin(k * 2.3) * 0.022); r.visible = false; n.add(r); rustSpots.push(r); }
    const lab = labelSprite(LETTER(i), { size: 0.22 }); lab.position.set(0, 1.65, 0); lab.raycast = () => {}; stage.steadyLabel(lab, 7); tb.add(lab);
    tb.userData.pickId = T.id;
    addHitBox(tb, 0.5);
    rack.add(tb);
    return { T, tb, n, rustSpots };
  });
  function LETTER(i) { return ['А', 'Б', 'В', 'Г'][i]; }
  rack.position.set(-4.3, 0, 0.1);
  rack.userData.pickId = 'rack';
  tagOver(stage, rack, 'Опит с пирони', 2.0);
  scene.add(rack);
  const plaque = stage.bubble(new V3(-4.3, 0.0, 0.9), '', { cls: 'tag', lift: 0 });
  function setDays(d) {
    tubes.forEach(({ T, n, rustSpots }) => {
      const k = Math.min(1, (d / 14) * T.rate);
      n.userData.m.color.setHex(0x9e9e9e).lerp(new THREE.Color(0x8d3a14), k * 0.85);
      n.userData.m.metalness = 0.75 * (1 - k);
      rustSpots.forEach((r, i) => { r.visible = k > i / 12; });
    });
    plaque.set(`Ден ${d}`);
  }

  // ---------- Железен прът и уреди ----------
  const bench = new THREE.Group();
  const barM = mat(0x7b8a92, { metalness: 0.7, roughness: 0.35 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.12), barM);
  bar.position.y = 0.4;
  const shine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.005, 0.1), mat(0xf2f5f7, { metalness: 0.2, roughness: 0.15, emissive: 0x555555 }));
  shine.position.set(0.5, 0.465, 0); shine.visible = false;
  const stands = [-0.7, 0.7].map((x) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.3), mat(0x546e7a)); s.position.set(x, 0.17, 0); return s; });
  bench.add(bar, shine, ...stands);
  const magnet = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 8, 16, Math.PI), mat(0xe53935));
  magnet.rotation.z = Math.PI; magnet.position.set(-0.4, 0.7, 0); magnet.visible = false;
  const bulb = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff9c4, transparent: true, opacity: 0.8, emissive: 0x000000 })); b.position.y = 0.12; const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10), mat(0x9e9e9e)); bulb.add(b, base2); bulb.userData.b = b; }
  bulb.position.set(0, 0.6, 0.4); bulb.visible = false;
  const waxDrops = [-0.1, 0.1, 0.3].map((x, i) => { const w = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat(0xfff8e1)); w.position.set(x + 0.2, 0.48, 0); w.visible = false; w.userData.t = i * 0.8; return w; });
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb74d }));
  flame.scale.set(1, 2, 1); flame.position.set(0.85, 0.25, 0); flame.visible = false;
  bench.add(magnet, bulb, ...waxDrops, flame);
  bench.position.set(-0.6, 0, 0.2);
  bench.userData.pickId = 'bar';
  addHitBox(bench, 0.7);
  tagOver(stage, bench, 'Железен прът', 0.95);
  scene.add(bench);
  const acid = testTube(1.0, 0.13);
  acid.userData.fill(0.4, 0xe8f5e9);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.06), mat(0x7b8a92, { metalness: 0.6 }));
  chip.position.y = 0.12; acid.add(chip);
  const acidBubbles = [];
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), mat(0xffffff)); b.userData.k = i / 8; b.visible = false; acid.add(b); acidBubbles.push(b); }
  acid.position.set(1.0, 0, 0.6);
  scene.add(acid);
  tagOver(stage, acid, 'Разредена солна киселина', 1.45, 0.15);
  const L = { mag: false, bulb: false, heat: 0, file: false, acid: false };
  stage.tick((dt, t) => {
    magnet.visible = L.mag; magnet.position.y = 0.62;
    bulb.visible = L.bulb; bulb.userData.b.material.emissive.setHex(L.bulb ? 0xffeb3b : 0x000000);
    flame.visible = L.heat > 0; flame.scale.set(1, 2 + Math.sin(t * 15) * 0.2, 1);
    if (L.heat > 0) L.heat += dt;
    waxDrops.forEach((w) => { w.visible = true; const melt = L.heat > 0.5 + w.userData.t; if (melt) w.position.y = Math.max(0.05, w.position.y - dt * 0.8); else w.position.y = 0.48; });
    shine.visible = L.file;
    acidBubbles.forEach((b) => { b.visible = L.acid; const f = (t * 0.8 + b.userData.k) % 1; b.position.set(Math.sin(b.userData.k * 9) * 0.05, 0.15 + f * 0.35, 0); });
  });

  // ---------- Чугун и стомана ----------
  const pan = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.12, 22), mat(0x263238, { roughness: 0.8 })); b.position.y = 0.06; const h = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.08), mat(0x263238)); h.position.set(0.7, 0.1, 0); pan.add(b, h); }
  pan.position.set(3.0, 0, 0.6);
  pan.userData.pickId = 'pan';
  addHitBox(pan, 0.6);
  tagOver(stage, pan, 'Чугунен тиган', 0.45);
  scene.add(pan);
  const rails = new THREE.Group();
  { for (const z of [-0.25, 0.25]) { const r = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.06), mat(0xb0bec5, { metalness: 0.8, roughness: 0.25 })); r.position.set(0, 0.13, z); rails.add(r); } for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.8), mat(0x6d4c41)); s.position.set(-0.85 + i * 0.34, 0.04, 0); rails.add(s); } }
  rails.position.set(4.9, 0, -0.6);
  rails.userData.pickId = 'rails';
  addHitBox(rails, 0.6);
  tagOver(stage, rails, 'Стоманени релси', 0.45);
  scene.add(rails);
  const gate = new THREE.Group();
  { for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6), mat(0x8d3a14, { roughness: 1 })); b.position.set(-0.4 + i * 0.16, 0.55, 0); gate.add(b); } const tb = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.06), mat(0x8d3a14)); tb.position.y = 1.05; gate.add(tb); }
  gate.position.set(6.3, 0, 0.6);
  gate.userData.pickId = 'gate';
  addHitBox(gate, 0.6);
  tagOver(stage, gate, 'Ръждясала ограда', 1.35);
  scene.add(gate);

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    setDays(0);
    Object.assign(L, { mag: false, bulb: false, heat: 0, file: false, acid: false });
    view(ctx, [0.6, 0.8, 0], 6.8, { halfH: 1.8 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Желязото е най-използваният метал. Но то <b>ръждясва</b>. Защо и как да го пазим?</p><p><b>Разгледай всичко</b> от менюто или с клик.</p>',
      items: [
        { id: 'rack', label: 'Опит с пирони', icon: '🧪', note: 'Четири еднакви железни пирона в различни условия: А — вода и въздух; Б — сварена вода под олио (без въздух); В — сух въздух със сушител; Г — солена вода и въздух.', obj: () => rack, dist: 3.2, lift: 0.6, bubble: 2.1 },
        { id: 'bar', label: 'Железен прът', icon: '🔩', note: 'С него ще проверим свойствата на желязото.', obj: () => bench, dist: 2.8 },
        { id: 'pan', label: 'Чугунен тиган', icon: '🍳', note: '<b>Чугунът</b> е желязо с повече въглерод (около 2–4%). Твърд е, но крехък; лее се във форми.', obj: () => pan, dist: 2.6 },
        { id: 'rails', label: 'Релси', icon: '🛤', note: '<b>Стоманата</b> е желязо с по-малко въглерод (под 2%). Здрава е и издържа удари.', obj: () => rails, dist: 3 },
        { id: 'gate', label: 'Ръждясала ограда', icon: '🟫', note: 'Ръждата е рохкава и се рони. Под нея желязото продължава да ръждясва.', obj: () => gate, dist: 2.8 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Кога желязото ръждясва? ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    setDays(0);
    view(ctx, [-4.3, 0.85, 0.1], 1.55, { halfH: 1.1, elev: 0.15 });
    shell.task('<p>Оставяме четирите епруветки за две седмици.</p>');
    choice(ctx, {
      q: 'В кои епруветки пиронът ще ръждяса?',
      options: [
        { t: 'В А и Г — където има и вода, и въздух. Най-бързо в солената вода.', ok: true, why: 'Да проверим! Плъзни лентата.' },
        { t: 'Във всички четири.', ok: false, why: 'В Б няма въздух, а във В няма вода. Ще ръждясат ли там?' },
        { t: 'Само във В — сухият въздух разяжда желязото.', ok: false, why: 'Без вода желязото почти не ръждясва.' },
      ],
      hint: 'Нужни са и вода, и кислород от въздуха.',
      onRight: (m) => days(m),
    });
  }
  function days(m0) {
    let mistakes = m0;
    const c = shell.setControls('<label class="row">Дни <b class="dn">0</b> <input type="range" class="days" min="0" max="14" value="0" style="flex:1"></label>');
    let said = false;
    c.querySelector('.days').addEventListener('input', (e) => {
      const d = +e.target.value;
      c.querySelector('.dn').textContent = d;
      setDays(d);
      if (d >= 14 && !said) {
        said = true;
        ctx.say(tubes[3].tb, 'Г: най-много ръжда (солта ускорява корозията). А: ръжда. Б и В: без ръжда.', 'wide', 1.9);
        choice(ctx, {
          q: 'Кои две условия са нужни, за да ръждясва желязото?',
          options: [
            { t: 'Вода и кислород (въздух)', ok: true, why: 'Вярно! Корозията е химична реакция на желязото с кислорода и водата.' },
            { t: 'Само вода', ok: false, why: 'В Б имаше вода, но нямаше въздух. Ръждяса ли пиронът?' },
            { t: 'Само въздух', ok: false, why: 'Във В имаше въздух, но беше сух. Ръждяса ли пиронът?' },
          ],
          hint: 'Сравни А с Б и с В.',
          mistakes,
          onRight: (mm) => { ctx.scores[0] = stepScore(mm, 3); nextBtn(ctx, 'Напред →', step3); },
        });
      }
    });
  }

  // ---------- 3. Свойства на желязото ----------
  const TESTS = [
    { t: 'mag', label: '🧲 Магнит', res: 'Привлича се от магнит.' },
    { t: 'bulb', label: '💡 Ел. верига', res: 'Провежда електричен ток — лампичката свети.' },
    { t: 'heat', label: '🕯 Нагряване', res: 'Провежда топлина — восъчните капки се стопяват една след друга.' },
    { t: 'file', label: '🪚 Пила', res: 'На прясно изпилено място има сребристосив метален блясък.' },
    { t: 'acid', label: '🧪 Солна киселина', res: 'В разредена солна киселина желязото отделя мехурчета водород (само учител!).' },
  ];
  function step3() {
    shell.step(2);
    ctx.clearTip();
    view(ctx, [-0.2, 0.6, 0.4], 1.7, { halfH: 0.9, elev: 0.35 });
    const done = new Set();
    let tool = null;
    const draw = () => shell.task(`<p>Избери уред и кликни железния прът.</p>${TEACHER}
      <div class="xp-chips">${TESTS.map((T) => `<span class="chip ${done.has(T.t) ? 'used right' : ''}" data-t="${T.t}">${T.label}</span>`).join('')}</div>
      <ul class="small">${TESTS.filter((T) => done.has(T.t)).map((T) => `<li>${T.res}</li>`).join('')}</ul>`);
    const bind = () => container.querySelectorAll('.xp-task .chip').forEach((ch) => ch.addEventListener('click', () => {
      container.querySelectorAll('.xp-task .chip').forEach((x) => x.classList.remove('held'));
      ch.classList.add('held'); tool = ch.dataset.t;
    }));
    draw(); bind();
    shell.setControls('');
    ctx.click = (id) => {
      if (id !== 'bar' || !tool || done.has(tool)) { if (id === 'bar' && !tool) shell.msg('Първо избери уред.', 'bad'); return; }
      if (tool === 'heat') L.heat = 0.01; else if (tool === 'acid') L.acid = true; else L[tool] = true;
      done.add(tool); tool = null;
      draw(); bind();
      shell.msg('');
      if (done.size === TESTS.length) {
        ctx.click = null;
        choice(ctx, {
          q: 'Кое НЕ е вярно за желязото?',
          options: [
            { t: 'Не провежда електричен ток.', ok: true, why: 'Точно така — това не е вярно. Желязото провежда и ток, и топлина.' },
            { t: 'Привлича се от магнит.', ok: false, why: 'Това е вярно — видя го с магнита.' },
            { t: 'Има метален блясък.', ok: false, why: 'Вярно е — виж изпиленото място.' },
            { t: 'Взаимодейства със солна киселина.', ok: false, why: 'Вярно е — отделят се мехурчета водород.' },
          ],
          hint: 'Спомни си лампичката.',
          onRight: (m) => { ctx.scores[1] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step4); },
        });
      }
    };
  }

  // ---------- 4. Опазване, чугун и стомана ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [4.6, 0.6, 0], 2.3, { halfH: 1.1, elev: 0.3 });
    shell.task('<p>Пази ли това желязото от ръжда?</p>');
    sortTask(ctx, {
      bins: ['Пази от ръжда', 'Не пази'],
      items: [
        { t: '🎨 Боядисване на оградата', bin: 0, why: 'Боята не пуска водата и въздуха до желязото.' },
        { t: '🛢 Смазване на инструментите с масло', bin: 0, why: 'Маслото покрива метала.' },
        { t: '⚪ Покриване с цинк (поцинковане)', bin: 0, why: 'Цинкът пази желязото отдолу.' },
        { t: '🌧 Оставяне на мокрия велосипед навън', bin: 1, why: 'Вода + въздух = ръжда.' },
        { t: '🧂 Посипване на заледения път със сол', bin: 1, why: 'Солта ускорява ръждясването на колите (спомни си епруветка Г).' },
      ],
      hint: 'Пази ли от вода и въздух?',
      onDone: (m1) => {
        shell.task('<p>Чугун или стомана?</p>');
        sortTask(ctx, {
          bins: ['Чугун', 'Стомана'],
          items: [
            { t: '🍳 Тежък тиган', bin: 0, why: 'Чугунът се лее във форми и пази топлината.' },
            { t: '🕳 Капак на шахта', bin: 0, why: 'Лят чугун — твърд и тежък.' },
            { t: '🛤 Железопътни релси', bin: 1, why: 'Стоманата е здрава и издържа удари.' },
            { t: '🔪 Нож', bin: 1, why: 'Стоманата може да се закали и наточи.' },
            { t: '🌉 Конструкция на мост', bin: 1, why: 'Стоманените греди са здрави и гъвкави.' },
          ],
          hint: 'Чугунът е крехък и се лее; стоманата е здрава и жилава.',
          mistakes: m1,
          onDone: (m2) => { ctx.scores[2] = stepScore(m2, 3); shell.task('<p>Пазим желязото от вода и въздух и избираме подходящата сплав.</p>'); finishBtn(ctx, onComplete, restart); },
        });
      },
    });
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    step1();
  }
  step1();
  return { dispose() { plaque.remove(); stage.dispose(); } };
}
