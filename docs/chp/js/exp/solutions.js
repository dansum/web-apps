// 5.2.5 „Водата и водните разтвори“ — везна с чаша вода и сол, чаши за разтворимост, сиропи, лед и езеро в разрез.
// Стъпки: опознай → наситен разтвор и маса на разтвора (опит) → разтворимост и протокол → свойствата на водата.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, lcd, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';

const SAFE = '<p class="warn">⚠ В кабинета <b>не опитваме</b> веществата на вкус и не ги пипаме с ръце.</p>';
const SOL = 36;          // около 36 g сол се разтварят в 100 g вода при 20 °C
const BX = -3.4;         // чашата на везната
const TESTS = [
  { id: 'b-sugar', name: 'захар', x: -0.9, kind: 'sol', note: 'разтвори се напълно' },
  { id: 'b-gyps', name: 'гипс', x: 0.3, kind: 'little', note: 'малка част се разтвори, повечето остана на дъното' },
  { id: 'b-chalk', name: 'тебешир', x: 1.5, kind: 'none', note: 'водата помътня, после всичко се утаи' },
  { id: 'b-sand', name: 'пясък', x: 2.7, kind: 'none', note: 'песъчинките паднаха на дъното' },
];

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Наситен разтвор', 'Разтворимост', 'Свойствата на водата'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.8, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14, d: 4.8 });
  const tag = (g, t, y, s = 0.19) => { const l = labelSprite(t, { size: s }); l.position.y = y; g.add(l); stage.steadyLabel(l, 7); return l; };
  const waterMat = () => new THREE.MeshStandardMaterial({ color: 0x9fd3f5, transparent: true, opacity: 0.45, depthWrite: false });
  function beaker(r, h, fill = 0.7) {
    const g = new THREE.Group();
    const side = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.95, h, 28, 1, true), glass(0.28)); side.position.y = h / 2;
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(r * 0.95, 28), glass(0.4)); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.005;
    const w = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.93, h * fill, 28), waterMat()); w.position.y = h * fill / 2;
    g.add(side, bottom, w);
    g.userData.water = w;
    return g;
  }

  // ---------- Везна с чаша ----------
  const scale = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 1.1), mat(0xeceff1)); body.position.y = 0.11;
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 28), mat(0xb0bec5, { metalness: 0.5 })); pan.position.y = 0.24;
    scale.add(body, pan);
  }
  const disp = lcd(0.62, 0.2); disp.mesh.position.set(0, 0.12, 0.556); scale.add(disp.mesh);
  scale.position.set(BX, 0, 0.1);
  scene.add(scale);
  const main = beaker(0.42, 1.0, 0.68);
  main.position.set(BX, 0.26, 0.1);
  main.userData.pickId = 'main';
  scene.add(main); addHitBox(main, 0.6);
  tag(scale, 'везна', -0.08);
  const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 1, 24), mat(0xffffff, { roughness: 0.9 }));
  pile.scale.y = 0.001; pile.position.y = 0.01; main.add(pile);
  const salt = new THREE.Group();
  {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })); jar.position.y = 0.25;
    const inside = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.35, 20), mat(0xfafafa)); inside.position.y = 0.18;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.06, 20), mat(0xd32f2f)); lid.position.y = 0.53;
    salt.add(jar, inside, lid);
  }
  salt.position.set(BX - 1.1, 0, 0.6); tag(salt, 'сол', 0.75);
  salt.userData.pickId = 'salt'; scene.add(salt); addHitBox(salt, 0.5);
  const thermo = new THREE.Group();
  {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), new THREE.MeshStandardMaterial({ color: 0xe3f2fd, transparent: true, opacity: 0.6 }));
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6), mat(0xe53935)); col.position.y = -0.2;
    thermo.add(t, col);
  }
  thermo.position.set(0.22, 0.75, -0.1); thermo.rotation.z = -0.25; main.add(thermo);
  const grains = [];
  for (let i = 0; i < 24; i++) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), mat(0xffffff));
    g.visible = false; g.userData = { v: 0, life: 0 }; main.add(g); grains.push(g);
  }
  const M = { salt: 0, undis: 0 };
  const dissolved = () => Math.min(M.salt, SOL);
  function updScale() { disp.set(`${100 + M.salt} g`); }
  function resetMain() { M.salt = 0; M.undis = 0; pile.scale.y = 0.001; updScale(); main.userData.water.material.color.set(0x9fd3f5); }
  resetMain();
  function spoon() {
    // 5 g сол: зрънцата падат във водата
    M.salt += 5;
    grains.forEach((g, i) => { g.visible = true; g.position.set((Math.random() - 0.5) * 0.4, 0.95 + Math.random() * 0.15, (Math.random() - 0.5) * 0.4); g.userData.v = 0.2 + Math.random() * 0.3; g.userData.life = 0; g.userData.i = i; });
    updScale();
  }

  // ---------- Чаши за разтворимост ----------
  const tests = TESTS.map((T) => {
    const b = beaker(0.32, 0.8, 0.7);
    b.position.set(T.x, 0, 0.3);
    b.userData.pickId = T.id;
    tag(b, T.name, 1.05);
    scene.add(b); addHitBox(b, 0.5);
    const sed = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.29, 1, 20), mat(T.name === 'пясък' ? 0xd7b46a : 0xffffff, { roughness: 0.95 }));
    sed.scale.y = 0.001; sed.position.y = 0.01; b.add(sed);
    const haze = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.28, 0.55, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    haze.position.y = 0.29; b.add(haze);
    return { ...T, b, sed, haze, done: false, t: -1 };
  });
  // ---------- Два сиропа ----------
  const syr = [1, 3].map((n, i) => {
    const b = beaker(0.3, 0.8, 0.7);
    b.position.set(4.3 + i * 0.95, 0, 0.3);
    b.userData.water.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(0xfff3e0).lerp(new THREE.Color(0xe65100), n / 3.4), transparent: true, opacity: 0.75 });
    tag(b, `${n} ${n === 1 ? 'лъжичка' : 'лъжички'}`, 1.05);
    scene.add(b);
    return b;
  });
  const syrAt = new THREE.Object3D(); syrAt.position.set(4.75, 0.6, 0.3); scene.add(syrAt);
  syrAt.userData.pickId = 'syrups';
  { const hit = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 0.8), new THREE.MeshBasicMaterial({ visible: false })); syrAt.add(hit); }
  // ---------- Лед в чаша и езеро в разрез ----------
  const iceGlass = beaker(0.32, 0.9, 0.7);
  iceGlass.position.set(-5.5, 0, -0.9);
  tag(iceGlass, 'лед', 1.15);
  scene.add(iceGlass);
  const ice = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), new THREE.MeshStandardMaterial({ color: 0xe1f5fe, transparent: true, opacity: 0.85, roughness: 0.1 }));
  ice.position.set(0, 1.25, 0); iceGlass.add(ice);
  const I = { drop: false, y: 1.25, v: 0 };
  const lake = new THREE.Group();
  {
    const tank = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.6), glass(0.25)); tank.position.y = 0.65;
    lake.add(tank);
    // слоеве вода: отгоре по-студена, на дъното около 4 °C
    const cols = [0xbbdefb, 0x90caf9, 0x64b5f6, 0x42a5f5];
    cols.forEach((c, i) => { const l = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.25, 0.56), new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.55, depthWrite: false })); l.position.y = 0.94 - i * 0.25; lake.add(l); });
    const iceL = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.12, 0.56), new THREE.MeshStandardMaterial({ color: 0xf1f8ff, roughness: 0.2 })); iceL.position.y = 1.13; lake.add(iceL);
    const mud = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.1, 0.56), mat(0x6d4c41)); mud.position.y = 0.05; lake.add(mud);
    for (let i = 0; i < 2; i++) {
      const f = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat(0xff8f00)); body.scale.set(1.6, 0.8, 0.6);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 8), mat(0xff8f00)); tail.rotation.z = Math.PI / 2; tail.position.x = -0.2;
      f.add(body, tail); f.position.set(-0.4 + i * 0.7, 0.25 + i * 0.12, 0.05); f.userData.k = i; lake.add(f);
    }
  }
  lake.position.set(-1.0, 1.0, -1.7);
  const lakeStand = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 0.8), mat(0x8d6e63)); lakeStand.position.set(-1.0, 0.5, -1.7); scene.add(lakeStand);
  lake.userData.pickId = 'lake';
  tag(lake, 'езеро през зимата (в разрез)', 1.55, 0.17);
  scene.add(lake);
  addHitBox(lake, 0.6);
  const fish = lake.children.filter((c) => c.userData.k !== undefined && c.type === 'Group');
  let lakeTags = [];

  stage.tick((dt, t) => {
    for (const g of grains) {
      if (!g.visible) continue;
      g.userData.life += dt;
      g.position.y -= g.userData.v * dt;
      const inWater = g.position.y < 0.68;
      // докато разтворът не е наситен, зрънцата изчезват във водата
      if (inWater && M.salt <= SOL && g.userData.life > 0.6 + (g.userData.i % 5) * 0.15) g.visible = false;
      if (g.position.y < 0.03) g.visible = false;
    }
    const targetPile = Math.max(0, M.salt - SOL) * 0.012;
    pile.scale.y += (Math.max(0.001, targetPile) - pile.scale.y) * Math.min(1, dt * 2);
    pile.position.y = pile.scale.y / 2 + 0.005;
    for (const T of tests) {
      if (T.t < 0) continue;
      T.t += dt;
      if (T.kind === 'sol') { T.haze.material.opacity = Math.max(0, 0.25 - T.t * 0.12); }
      else if (T.kind === 'little') { T.haze.material.opacity = 0.08; T.sed.scale.y = Math.min(0.06, T.t * 0.04); }
      else if (T.name === 'тебешир') { T.haze.material.opacity = Math.max(0.0, 0.55 - Math.max(0, T.t - 1) * 0.12); T.sed.scale.y = Math.min(0.08, T.t * 0.02); }
      else { T.sed.scale.y = Math.min(0.08, T.t * 0.06); }
      T.sed.position.y = T.sed.scale.y / 2 + 0.005;
    }
    if (I.drop) {
      // ледът пада, потапя се за миг и изплува; плава с около 9/10 от обема си под водата
      const top = 0.63; const rest = top + 0.1 - 0.18;
      I.v += (I.y > top ? -9.8 : (rest - I.y) * 30) * dt; I.v *= I.y < top ? 0.92 : 1;
      I.y += I.v * dt;
      ice.position.y = I.y;
    }
    ice.rotation.y = t * 0.3;
    fish.forEach((f) => { f.position.x = Math.sin(t * 0.4 + f.userData.k * 2) * 0.7; f.rotation.y = Math.cos(t * 0.4 + f.userData.k * 2) > 0 ? 0 : Math.PI; });
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    lakeTags.forEach((b) => b.remove()); lakeTags = [];
    resetMain();
    tests.forEach((T) => { T.t = -1; T.done = false; T.haze.material.opacity = 0; T.sed.scale.y = 0.001; });
    I.drop = false; I.y = 1.25; I.v = 0; ice.position.y = 1.25;
    view(ctx, [-0.3, 0.6, -0.2], 6.4, { halfH: 1.8 });
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p>Водата е най-разпространеното вещество на Земята и чудесен разтворител.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>${SAFE}`,
      items: [
        { id: 'main', label: 'Чаша вода на везна', icon: '⚖', note: 'В чашата има <b>100 g чиста вода</b> при 20 °C. Везната показва масата на водата (без чашата). Чистата вода е без цвят, мирис и вкус.', obj: () => main, dist: 2.8 },
        { id: 'salt', label: 'Сол', icon: '🧂', note: 'Готварската сол се <b>разтваря</b> във вода. Получава се <b>разтвор</b> — еднородна смес.', obj: () => salt, dist: 2.4 },
        { id: 'b-sugar', label: 'Четири чаши', icon: '🧪', note: 'Ще изследваме кое вещество се разтваря във вода: захар, гипс, тебешир, пясък.', obj: () => tests[1].b, dist: 3.4 },
        { id: 'syrups', label: 'Два сиропа', icon: '🥤', note: 'В двете чаши има еднакво вода, но различно количество сироп. Цветът подсказва кой разтвор е по-концентриран.', obj: () => syrAt, dist: 3 },
        { id: 'lake', label: 'Езеро в разрез', icon: '🧊', note: 'Езеро през зимата: отгоре има лед, а отдолу — вода. Как оцеляват рибите?', obj: () => lake, dist: 3.6, bubble: 1.5 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Наситен разтвор ----------
  function step2() {
    shell.step(1);
    resetMain();
    view(ctx, [BX - 0.3, 0.7, 0.1], 1.6, { halfH: 1.1, elev: 0.35 });
    shell.task(`<p>Везната показва <b>100 g</b>: толкова е водата. Ще слагаме сол по <b>5 g</b> (една лъжичка) и ще разбъркваме.</p>${SAFE}`);
    let mistakes = 0;
    choice(ctx, {
      q: 'Разтваряме 20 g сол в 100 g вода. Каква ще бъде масата на разтвора?',
      options: [
        { t: '120 g', ok: true, why: 'Да проверим! Слагай сол с лъжичката.' },
        { t: '100 g', ok: false, why: 'Солта не изчезва, макар да не се вижда. Къде отива нейната маса?' },
        { t: '80 g', ok: false, why: 'Добавяме вещество. Може ли масата да намалее?' },
      ],
      hint: 'Масата на разтвора = масата на водата + масата на разтвореното вещество.',
      onRight: (m) => { mistakes = m; add(); },
    });
    function add() {
      const c = shell.setControls('<div class="row"><button class="btn primary sp">🥄 Добави 5 g сол и разбъркай</button></div>');
      const b = c.querySelector('.sp');
      b.addEventListener('click', () => {
        spoon();
        if (M.salt === 20) ctx.say(main, `✔ ${100 + M.salt} g: масата на разтвора е сбор от масите на водата и солта.`, 'good wide', 1.3);
        if (M.salt > SOL) {
          b.disabled = true;
          setTimeout(() => {
            shell.msg('');
            ctx.say(main, `Сложихме ${M.salt} g сол, а на дъното остана неразтворена сол. Разтворени са около ${dissolved()} g.`, 'wide', 1.3);
            choice(ctx, {
              q: 'Какъв е този разтвор?',
              options: [
                { t: 'Наситен: при тази температура повече сол не може да се разтвори.', ok: true, why: 'Вярно! Когато още може да се разтваря, разтворът е ненаситен.' },
                { t: 'Ненаситен', ok: false, why: 'Защо тогава солта остава на дъното?' },
                { t: 'Чиста вода', ok: false, why: 'В чашата има разтворена сол. Чиста вода ли е това?' },
              ],
              hint: 'Виж дъното на чашата.',
              mistakes,
              onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
            });
          }, 1800);
        }
      });
    }
  }

  // ---------- 3. Разтворимост ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    view(ctx, [0.9, 0.5, 0.3], 2.6, { halfH: 1.0, elev: 0.4 });
    shell.task(`<p>Във всяка чаша има 100 g вода. <b>Кликни всяка чаша</b>, за да добавиш една лъжичка от веществото и да разбъркаш.</p>${SAFE}`);
    shell.setControls('');
    let left = tests.length;
    ctx.click = (id) => {
      const T = tests.find((x) => x.id === id);
      if (!T || T.done) return;
      T.done = true; T.t = 0;
      if (T.kind === 'sol') T.haze.material.opacity = 0.25;
      setTimeout(() => ctx.say(T.b, `${T.name}: ${T.note}`, 'tag', 1.25), 1500);
      left--;
      if (!left) { ctx.click = null; setTimeout(proto, 3000); }
    };
    function proto() {
      ctx.clearTip();
      shell.task(`<p><b>Протокол от наблюдението</b></p>
        <table class="small" style="border-collapse:collapse;width:100%">
        <tr><td style="padding:2px 4px"><b>Вещество</b></td><td><b>Какво видяхме</b></td></tr>
        ${tests.map((T) => `<tr><td style="padding:2px 4px">${T.name}</td><td>${T.note}</td></tr>`).join('')}
        <tr><td style="padding:2px 4px">сол</td><td>36 g се разтвориха в 100 g вода (опитът с везната)</td></tr>
        </table>`);
      sortTask(ctx, {
        lead: 'Класифицирай веществата по разтворимостта им във вода.',
        bins: ['Разтворимо', 'Малко разтворимо', 'Практически неразтворимо'],
        items: [
          { t: 'захар', bin: 0, why: 'Захарта е разтворима.' },
          { t: 'сол', bin: 0, why: 'Солта е разтворима.' },
          { t: 'гипс', bin: 1, why: 'Гипсът е малко разтворим.', no: 'Виж протокола: колко от гипса се разтвори?' },
          { t: 'тебешир', bin: 2, why: 'Тебеширът е практически неразтворим: помътнява водата, но после се утаява.', no: 'Помътняването не е разтваряне. Какво остана накрая?' },
          { t: 'пясък', bin: 2, why: 'Пясъкът е практически неразтворим.' },
        ],
        hint: 'Разтвореното вещество не се вижда и не се утаява.',
        onDone: (m) => {
          view(ctx, [4.75, 0.5, 0.3], 1.6, { halfH: 1.0, elev: 0.35 });
          ctx.say(syrAt, 'В двете чаши има по 100 g вода.', 'tag', 0.8);
          shell.task('<p>Свойствата на разтвора зависят от това <b>колко</b> вещество има в него.</p>');
          choice(ctx, {
            q: 'В първата чаша има 1 лъжичка сироп, във втората — 3. Кой разтвор е по-сладък и по-тъмен?',
            options: [
              { t: 'Вторият: в него има повече разтворено вещество.', ok: true, why: 'Вярно! Колкото повече вещество е разтворено в същото количество вода, толкова по-силно е свойството му.' },
              { t: 'Първият', ok: false, why: 'Сравни цветовете на двете чаши.' },
              { t: 'Еднакво сладки са.', ok: false, why: 'Водата е еднаква, а сиропът — не.' },
            ],
            hint: 'Повече сироп в същата вода.',
            mistakes: m,
            onRight: (m2) => { ctx.scores[1] = stepScore(m2, 3); nextBtn(ctx, 'Напред →', step4); },
          });
        },
      });
    }
  }

  // ---------- 4. Свойствата на водата ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [-5.5, 0.6, -0.9], 1.3, { halfH: 1.0, elev: 0.3 });
    shell.task('<p>Пускаме кубче лед в чаша с вода.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще направи ледът?',
      options: [
        { t: 'Ще плава на повърхността.', ok: true, why: 'Да проверим!' },
        { t: 'Ще потъне на дъното.', ok: false, why: 'Виждал ли си лед в чаша с вода или по реката през зимата? Къде е той?' },
        { t: 'Веднага ще се стопи.', ok: false, why: 'Ледът се топи бавно. Въпросът е къде ще е, докато се топи.' },
      ],
      hint: 'Ледът е по-лек от същото количество вода.',
      onRight: (m) => {
        mistakes = m;
        I.drop = true; I.v = 0;
        setTimeout(() => {
          ctx.say(iceGlass, 'Ледът плава: той е по-лек от същия обем вода. Повечето вещества са по-плътни в твърдо състояние, а водата — не. Това е <b>аномалия на водата</b>.', 'wide', 1.2);
          nextBtn(ctx, 'Към езерото →', lakeQ);
        }, 2200);
      },
    });
    function lakeQ() {
      ctx.clearTip();
      view(ctx, [-1.0, 1.7, -1.7], 1.6, { halfH: 1.0, elev: 0.2 });
      lakeTags = [stage.bubble(new THREE.Vector3(-0.4, 2.13, -1.4), '0 °C', { cls: 'tag', lift: 0 }), stage.bubble(new THREE.Vector3(-0.4, 1.25, -1.4), '≈ 4 °C', { cls: 'tag', lift: 0 })];
      shell.task('<p>Зимата е студена, а езерото не замръзва до дъното.</p>');
      shell.msg('');
      choice(ctx, {
        q: 'Защо рибите оцеляват през зимата?',
        options: [
          { t: 'Ледът остава отгоре и пази водата отдолу. На дъното водата е около 4 °C.', ok: true, why: 'Вярно! Водата е най-плътна при около 4 °C и затова се събира на дъното.' },
          { t: 'Рибите не усещат студа.', ok: false, why: 'Рибите не могат да живеят в лед. Погледни къде е ледът.' },
          { t: 'Ледът потъва и затопля дъното.', ok: false, why: 'Видя опита с чашата: ледът потъва ли?' },
        ],
        hint: 'Къде е ледът и каква е водата под него?',
        mistakes,
        onRight: (m) => { mistakes = m; nextBtn(ctx, 'Последен въпрос →', boil); },
      });
    }
    function boil() {
      lakeTags.forEach((b) => b.remove()); lakeTags = [];
      ctx.clearTip();
      shell.task('<p>Чистата вода се топи при <b>0 °C</b>. А кога кипи?</p>');
      choice(ctx, {
        q: 'При каква температура кипи чистата вода при нормално атмосферно налягане?',
        options: [
          { t: '100 °C', ok: true, why: 'Вярно! Високо в планината, където налягането е по-ниско, водата кипи под 100 °C.' },
          { t: '0 °C', ok: false, why: 'При 0 °C водата замръзва или ледът се топи.' },
          { t: '36 °C', ok: false, why: 'Това е телесната температура. Водата кипи при много по-висока.' },
        ],
        hint: 'Скалата на Целзий е построена между топенето и кипенето на водата.',
        mistakes,
        onRight: (m) => { ctx.scores[2] = stepScore(m, 3); finishBtn(ctx, onComplete, restart); },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    ctx.answer = null;
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
