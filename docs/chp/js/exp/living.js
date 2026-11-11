// 3.2.1 „Живо и неживо“ — двор с котенце, фасул, камък и играчка кола.
// Стъпки: опознай → провери с опит (хранене, растеж, малки) → подреди живо/неживо → предскажи.
import { labelSprite, mat, addHitBox, zoneRing, THREE, esc, shuffle } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import {
  meadow, clouds, treeModel, stoneModel, beanInPot, catModel, henModel, chickModel, eggModel,
  mushroomModel, butterflyModel, flap, snailModel, flowerModel, toyCarModel, ballModel, cloudModel, sandModel,
  seg, lerp, swingLegs,
} from './nature3.js';

const V3 = THREE.Vector3;

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Провери с опит', 'Живо или неживо?', 'Предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xbfe3ff, camPos: [0, 4.5, 10], target: [0, 0.6, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  scene.fog = new THREE.Fog(0xbfe3ff, 22, 50);
  meadow(scene);
  clouds(stage, 5);
  // ограда и цветя за жив двор
  for (let i = 0; i < 22; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.08), mat(0xc8a26b));
    p.position.set(-10.5 + i, 0.5, -6);
    scene.add(p);
  }
  for (const y of [0.35, 0.8]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 0.06), mat(0xb08850));
    r.position.set(0, y, -5.95);
    scene.add(r);
  }
  for (let i = 0; i < 14; i++) {
    const f = flowerModel([0xe91e63, 0xffeb3b, 0xffffff, 0x9c27b0][i % 4], 0.35);
    f.position.set(-8 + i * 1.25 + Math.sin(i) * 0.4, 0, -4.6 + Math.cos(i * 2) * 0.5);
    scene.add(f);
  }

  const tags = [];
  const tag = (obj, html, cls = 'tag', lift = 1.2) => { const b = stage.bubble(obj, html, { cls, lift }); tags.push(b); return b; };
  const clearTags = () => { while (tags.length) tags.pop().remove(); };

  // ---------- Четиримата в опита ----------
  const row = new THREE.Group();
  scene.add(row);
  const kitten = catModel(0xf0a04b);
  const kitG = new THREE.Group(); kitG.add(kitten);
  kitG.position.set(-3, 0, 0);
  kitG.userData.pickId = 'cat';
  const bean = beanInPot({ r: 0.36, h: 0.55 });
  bean.position.set(-1, 0, 0);
  bean.userData.pickId = 'bean';
  const stone = stoneModel(1.3);
  stone.position.set(1, 0, 0);
  stone.userData.pickId = 'stone';
  const car = toyCarModel();
  car.position.set(3, 0, 0);
  car.userData.pickId = 'car';
  const SUBJ = [
    { id: 'cat', g: kitG, name: 'Котенце', top: 1.0 },
    { id: 'bean', g: bean, name: 'Семе в саксия', top: 0.9 },
    { id: 'stone', g: stone, name: 'Камък', top: 0.75 },
    { id: 'car', g: car, name: 'Кола играчка', top: 0.7 },
  ];
  for (const s of SUBJ) {
    const l = labelSprite(s.name, { size: 0.24 });
    l.position.y = -0.25;
    l.position.z = 0.75;
    s.g.add(l);
    stage.steadyLabel(l, 8);
    addHitBox(s.g, 0.9);
    row.add(s.g);
  }
  // купички с храна и вода, бебета и шушулки
  const bowls = SUBJ.map((s, i) => {
    const b = new THREE.Group();
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.08, 16), mat(i === 1 ? 0x42a5f5 : 0xef5350));
    dish.position.y = 0.04;
    const food = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 14), mat(i === 1 ? 0x64b5f6 : 0x8d6e63));
    food.position.y = 0.08;
    b.add(dish, food);
    b.userData.food = food;
    b.position.set(s.g.position.x + 0.55, 0, 0.55);
    b.visible = false;
    row.add(b);
    return b;
  });
  const kits = [0xf0a04b, 0x9e9e9e].map((c, i) => {
    const k = catModel(c);
    k.scale.setScalar(0.4);
    k.position.set(-3.4 + i * 0.7, 0, 0.8);
    k.rotation.y = 0.5 - i;
    k.visible = false;
    row.add(k);
    return k;
  });
  const sprout = beanInPot({ r: 0.2, h: 0.3 });
  sprout.position.set(-0.3, 0, 0.6);
  sprout.userData.set({ h: 0.18, leaves: 2, green: 1 });
  sprout.visible = false;
  row.add(sprout);
  const W = { feed: 0, day: 0, babies: 0 };
  function resetRow() {
    W.feed = 0; W.day = 0; W.babies = 0;
    bowls.forEach((b) => { b.visible = false; b.userData.food.scale.set(1, 1, 1); });
    kits.forEach((k) => { k.visible = false; });
    sprout.visible = false;
    setDay(0);
  }
  function setDay(d) {
    W.day = d;
    kitten.scale.setScalar(lerp(0.5, 1, seg(d, 0, 30)));
    bean.userData.set({ h: lerp(0, 1.1, seg(d, 4, 30)), leaves: Math.round(8 * seg(d, 6, 26)), green: 1, pods: W.babies ? 1 : 0, wet: W.feed ? 1 : 0.4 });
  }
  let carDir = 1;
  stage.tick((dt, t) => {
    // котето се оглежда и маха с опашка; ако има храна — яде
    const eating = W.feed > 0 && bowls[0].userData.food.scale.y > 0.05;
    kitten.userData.head.rotation.z = eating ? -0.5 + Math.sin(t * 6) * 0.08 : Math.sin(t * 0.8) * 0.1;
    kitten.userData.head.rotation.y = eating ? 0.6 : Math.sin(t * 0.6) * 0.4;
    kitten.userData.tail.rotation.x = Math.sin(t * 2) * 0.4;
    kitG.rotation.y = eating ? -0.6 : Math.sin(t * 0.3) * 0.3;
    if (eating) { const f = bowls[0].userData.food; f.scale.y = Math.max(0.01, f.scale.y - dt * 0.25); }
    if (W.feed > 0) { const f = bowls[1].userData.food; f.scale.y = Math.max(0.01, f.scale.y - dt * 0.3); }
    // играчката се движи напред-назад: движи се, но не е жива
    if (car.visible && row.visible) {
      car.position.x += carDir * dt * 0.35;
      if (car.position.x > 3.5) carDir = -1;
      if (car.position.x < 2.6) carDir = 1;
      car.rotation.y = carDir > 0 ? 0 : Math.PI;
      car.userData.wheels.forEach((w) => { w.rotation.y += dt * 6; });
    }
    kits.forEach((k, i) => { if (k.visible) { k.rotation.y = 0.5 - i + Math.sin(t * 1.5 + i) * 0.4; swingLegs(k, t * 6 + i, 0.3); } });
  });

  // ---------- Дърво, кокошка и облак (за опознаване) ----------
  const tree = treeModel(1.2);
  tree.position.set(-6, 0, -2.5);
  tree.userData.pickId = 'tree';
  scene.add(tree);
  const hen = henModel();
  const henG = new THREE.Group();
  henG.add(hen);
  henG.position.set(5.6, 0, -1.6);
  henG.userData.pickId = 'hen';
  const eggs = [];
  const chicks = [];
  for (let i = 0; i < 3; i++) {
    const e = eggModel(); e.position.set(-0.3 + i * 0.25, 0, 0.5); henG.add(e); eggs.push(e);
    const c = chickModel(); c.position.set(-0.4 + i * 0.35, 0, 0.6); c.visible = false; henG.add(c); chicks.push(c);
  }
  const nest = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 6, 16), mat(0xc8a26b, { flat: true }));
  nest.rotation.x = Math.PI / 2; nest.position.set(-0.05, 0.05, 0.5);
  henG.add(nest);
  addHitBox(henG, 1);
  scene.add(henG);
  let hatch = -1;
  stage.tick((dt, t) => {
    hen.userData.head.rotation.z = Math.sin(t * 3) > 0.7 ? -0.6 : 0;
    tree.userData.crown.rotation.z = Math.sin(t * 0.7) * 0.02;
    if (hatch >= 0) {
      hatch += dt;
      eggs.forEach((e, i) => { e.visible = hatch < 1 + i * 0.4; e.rotation.z = Math.sin(t * 20) * 0.2; });
      chicks.forEach((c, i) => { c.visible = hatch >= 1 + i * 0.4; c.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.05; });
    }
  });
  const cloud = cloudModel(1.1);
  cloud.position.set(1.5, 4.2, -3);
  cloud.userData.pickId = 'cloud';
  scene.add(cloud);
  stage.tick((dt, t) => { cloud.position.x = 1.5 + Math.sin(t * 0.15) * 2.5; cloud.scale.setScalar(1 + Math.sin(t * 0.2) * 0.12); });

  // ---------- Неща за подреждане (стъпка 3) ----------
  const ITEMS = [
    { id: 'butterfly', label: 'Пеперуда', live: true, make: () => { const b = butterflyModel(0xff8f00); b.scale.setScalar(1.6); return b; }, fly: true, why: 'Пеперудата се храни с нектар, расте от гъсеница и снася яйца.' },
    { id: 'mush', label: 'Гъба', live: true, make: () => mushroomModel(0x8d5524, 1.3), why: 'Гъбата се храни, расте и се размножава. Тя е жива.' },
    { id: 'snail', label: 'Охлюв', live: true, make: () => snailModel(), why: 'Охлювът яде листа, расте и снася яйца.' },
    { id: 'tulip', label: 'Лале', live: true, make: () => flowerModel(0xe53935, 0.6), why: 'Лалето расте и дава семена. То е живо, макар да не ходи.' },
    { id: 'cloud2', label: 'Облак', live: false, make: () => cloudModel(0.3), fly: true, why: 'Облакът се движи и се променя, но не се храни и няма малки.' },
    { id: 'ball', label: 'Топка', live: false, make: () => ballModel(), why: 'Топката се търкаля, но не се храни и не расте.' },
    { id: 'sand', label: 'Пясък', live: false, make: () => sandModel(), why: 'Пясъкът не се храни, не расте и не се размножава.' },
  ];
  const sortG = new THREE.Group();
  scene.add(sortG);
  const zLive = zoneRing(0x2e9d5b, 1.5); zLive.position.set(-2.4, 0, -0.3); zLive.userData.pickId = 'zone-live';
  const zDead = zoneRing(0x78909c, 1.5); zDead.position.set(2.4, 0, -0.3); zDead.userData.pickId = 'zone-dead';
  sortG.add(zLive, zDead);
  for (const [z, t] of [[zLive, '🌱 Живо'], [zDead, '🪨 Неживо']]) {
    const l = labelSprite(t, { size: 0.36 });
    l.position.set(0, 0.35, -1.75);
    stage.steadyLabel(l, 9);
    z.add(l);
  }
  const items = ITEMS.map((it, i) => {
    const g = new THREE.Group();
    const m = it.make();
    if (it.fly) m.position.y = 0.55;
    g.add(m);
    g.userData = { pickId: it.id, it, model: m, home: new V3(-3.15 + i * 1.05, 0, 1.9) };
    g.position.copy(g.userData.home);
    addHitBox(g, 0.7);
    // Етикетът не пречи на влаченето на съседните неща.
    const l = labelSprite(it.label, { size: 0.2 });
    l.position.y = it.fly ? 1.15 : 0.95;
    l.raycast = () => {};
    g.add(l);
    stage.steadyLabel(l, 8);
    sortG.add(g);
    return g;
  });
  stage.tick((dt, t) => {
    for (const g of items) {
      const it = g.userData.it;
      if (it.id === 'butterfly') { flap(g.userData.model, t); g.userData.model.position.y = 0.55 + Math.sin(t * 2) * 0.08; }
      if (it.id === 'cloud2') g.userData.model.position.y = 0.55 + Math.sin(t * 1.2) * 0.05;
      if (it.id === 'snail') g.userData.model.position.x = Math.sin(t * 0.3) * 0.08;
      if (it.id === 'tulip') g.userData.model.rotation.z = Math.sin(t * 1.4) * 0.05;
    }
  });
  let stopDrag = null;

  // ---------- Две саксии за предсказване (стъпка 4) ----------
  const predG = new THREE.Group();
  scene.add(predG);
  const potSeed = beanInPot({ r: 0.4, h: 0.6 });
  potSeed.position.set(-1, 0, 0);
  const potPeb = beanInPot({ r: 0.4, h: 0.6 });
  potPeb.position.set(1, 0, 0);
  potPeb.userData.plant.visible = false;
  const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), mat(0x9e9e9e, { flat: true }));
  pebble.position.y = potPeb.userData.soilY + 0.04;
  potPeb.add(pebble);
  for (const [p, t] of [[potSeed, 'Семе'], [potPeb, 'Камъче']]) {
    const l = labelSprite(t, { size: 0.24 });
    l.position.set(0, -0.2, 0.75);
    stage.steadyLabel(l, 8);
    p.add(l);
    predG.add(p);
  }
  function setPred(d) {
    potSeed.userData.set({ h: lerp(0, 1.0, seg(d, 4, 21)), leaves: Math.round(6 * seg(d, 6, 21)), green: 1, wet: 1 });
    potPeb.userData.set({ wet: 1 });
  }

  function show(which) {
    row.visible = which === 'row';
    sortG.visible = which === 'sort';
    predG.visible = which === 'pred';
    tree.visible = which !== 'sort';
    cloud.visible = which === 'row';
    henG.visible = which !== 'sort';
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip(); clearTags();
    ctx.click = null;
    if (stopDrag) { stopDrag(); stopDrag = null; }
    resetRow();
    show('row');
    hatch = -1;
    eggs.forEach((e) => { e.visible = true; e.rotation.z = 0; });
    chicks.forEach((c) => { c.visible = false; });
    items.forEach((g) => { g.position.copy(g.userData.home); g.userData.locked = false; delete g.userData.dragId; });
    view(ctx, [0, 0.8, -0.6], 6.6, { halfH: 2.6 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>В двора има <b>живи</b> и <b>неживи</b> тела. Как да ги различим?</p><p><b>Разгледай всичко</b> от менюто в ъгъла или с клик.</p>',
      items: [
        { id: 'cat', label: 'Котенце', icon: '🐱', note: 'Котенцето се движи, яде и пие. Ще порасне.', obj: () => kitG, dist: 3.2 },
        { id: 'bean', label: 'Семе в саксия', icon: '🫘', note: 'В саксията има семе на фасул. Сега е малко и не се движи.', obj: () => bean, dist: 3.2 },
        { id: 'stone', label: 'Камък', icon: '🪨', note: 'Камъкът лежи тук от години.', obj: () => stone, dist: 3.2 },
        { id: 'car', label: 'Кола играчка', icon: '🚗', note: 'Колата се движи напред и назад. Навиваме я с ключе.', obj: () => car, dist: 3.2 },
        { id: 'tree', label: 'Дърво', icon: '🌳', note: 'Дървото расте бавно. Всяка година става по-голямо.', obj: () => tree, dist: 6, lift: 1.5, bubble: 3.6 },
        { id: 'hen', label: 'Кокошка', icon: '🐔', note: 'Кокошката мъти яйца в гнездото.', obj: () => henG, dist: 3.4 },
        { id: 'cloud', label: 'Облак', icon: '☁️', note: 'Облакът плува по небето. Понякога става по-голям.', obj: () => cloud, dist: 9, lift: 0, bubble: 1.6 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Провери с опит ----------
  const MARK = { cat: ['✓', '✓', '✓'], bean: ['✓', '✓', '✓'], stone: ['✗', '✗', '✗'], car: ['✗', '✗', '✗'] };
  function table(done) {
    const head = ['Храни се', 'Расте', 'Има малки'];
    return `<table class="small" style="width:100%;border-collapse:collapse;text-align:center">
      <tr><th></th>${head.map((h) => `<th>${h}</th>`).join('')}</tr>
      ${SUBJ.map((s) => `<tr><td style="text-align:left">${esc(s.name)}</td>${[0, 1, 2].map((k) => `<td style="font-weight:800;color:${MARK[s.id][k] === '✓' ? '#2e9d5b' : '#c62828'}">${k < done ? MARK[s.id][k] : '·'}</td>`).join('')}</tr>`).join('')}
    </table>`;
  }
  function step2() {
    shell.step(1);
    ctx.clearTip(); clearTags();
    resetRow();
    show('row');
    view(ctx, [0, 0.6, 0.2], 4.1, { halfH: 1.4, elev: 0.38 });
    shell.task('<p>Колата се движи. Камъкът не се движи. Семето — също.</p>');
    choice(ctx, {
      q: 'Значи ли това, че колата е жива?',
      options: [
        { t: 'Не. Да проверим дали се храни, расте и има малки.', ok: true, why: 'Точно така! Ще направим три опита.' },
        { t: 'Да, щом се движи, е жива.', ok: false, why: 'Облакът и реката също се движат. Живи ли са те?' },
        { t: 'Да, защото е червена и красива.', ok: false, why: 'Цветът не показва дали нещо е живо.' },
      ],
      hint: 'Живите организми се хранят, растат и имат малки.',
      onRight: (m) => tests(m),
    });
  }
  function tests(m0) {
    let mistakes = m0;
    let done = 0;
    const setTask = (txt) => shell.task(`<p>${txt}</p>${table(done)}`);
    setTask('<b>Опит 1.</b> Дай на всички храна и вода.');
    nextBtn(ctx, '🍽 Дай храна и вода', () => {
      ctx.clearTip(); clearTags();
      W.feed = 1;
      bowls.forEach((b) => { b.visible = true; });
      setDay(W.day);
      SUBJ.forEach((s) => tag(s.g, MARK[s.id][0] === '✓' ? (s.id === 'cat' ? '✓ яде' : '✓ пие вода') : '✗ не яде', `tag ${MARK[s.id][0] === '✓' ? 'good' : 'bad'}`, s.top + 0.5));
      done = 1;
      setTimeout(() => {
        setTask('<b>Опит 2.</b> Плъзни лентата: минават дни.');
        const c = shell.setControls('<label class="row">Ден <b class="dn">0</b> <input type="range" class="days" min="0" max="30" value="0" style="flex:1"></label>');
        c.querySelector('.days').addEventListener('input', (e) => {
          const d = +e.target.value;
          c.querySelector('.dn').textContent = d;
          setDay(d);
          if (d >= 30 && done < 2) {
            done = 2;
            clearTags();
            SUBJ.forEach((s) => tag(s.g, MARK[s.id][1] === '✓' ? '✓ порасна' : '✗ не порасна', `tag ${MARK[s.id][1] === '✓' ? 'good' : 'bad'}`, s.id === 'bean' ? 1.8 : s.top + 0.5));
            setTask('<b>Опит 3.</b> Ще имат ли малки?');
            nextBtn(ctx, '🐣 Мина още време', babies);
          }
        });
      }, 1500);
    });
    function babies() {
      clearTags();
      W.babies = 1;
      setDay(30);
      kits.forEach((k) => { k.visible = true; });
      sprout.visible = true;
      SUBJ.forEach((s) => tag(s.g, MARK[s.id][2] === '✓' ? (s.id === 'cat' ? '✓ котенца' : '✓ семена') : '✗ няма', `tag ${MARK[s.id][2] === '✓' ? 'good' : 'bad'}`, s.id === 'bean' ? 1.8 : s.top + 0.5));
      done = 3;
      setTask('Виж таблицата.');
      shell.setControls('');
      choice(ctx, {
        q: 'Кои от четирите са живи?',
        options: [
          { t: 'Котката и фасулът', ok: true, why: 'Вярно! Те се хранят, растат и имат малки. Това са жизнени процеси.' },
          { t: 'Котката и колата', ok: false, why: 'Колата се движи. Но яде ли? Расте ли? Виж таблицата.' },
          { t: 'Само котката', ok: false, why: 'Фасулът не ходи. Но расте ли? Има ли семена?' },
          { t: 'И четирите', ok: false, why: 'Камъкът и колата не се промениха. Виж таблицата.' },
        ],
        hint: 'Търси редовете само с ✓.',
        mistakes,
        onRight: (m) => {
          mistakes = m;
          ctx.scores[0] = stepScore(mistakes, 3);
          nextBtn(ctx, 'Напред →', step3);
        },
      });
    }
  }

  // ---------- 3. Живо или неживо? ----------
  function step3() {
    shell.step(2);
    ctx.clearTip(); clearTags();
    show('sort');
    // На тесен екран кръговете и нещата са по-близо едно до друго.
    const narrow = stage.camera.aspect < 1;
    const R = narrow ? 1.1 : 1.5;
    zLive.scale.setScalar(R / 1.5); zDead.scale.setScalar(R / 1.5);
    zLive.position.set(narrow ? -1.25 : -2.4, 0, narrow ? -0.6 : -0.3);
    zDead.position.set(narrow ? 1.25 : 2.4, 0, narrow ? -0.6 : -0.3);
    items.forEach((g, i) => {
      if (narrow) g.userData.home.set(i < 4 ? -1.2 + i * 0.8 : -0.8 + (i - 4) * 0.8, 0, i < 4 ? 0.9 : 2.1);
      else g.userData.home.set(-3.15 + i * 1.05, 0, 1.9);
    });
    items.forEach((g) => { g.position.copy(g.userData.home); g.userData.locked = false; g.userData.dragId = g.userData.it.id; });
    if (narrow) view(ctx, [0, 0.3, 0.6], 2.1, { halfH: 2.3, elev: 0.85 });
    else view(ctx, [0, 0.3, 0.7], 5.0, { halfH: 2.6, elev: 0.8 });
    let mistakes = 0; let placed = 0;
    shell.task('<p><b>Провлачи всяко нещо</b> в правилния кръг: живо или неживо.</p>');
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${placed} от ${ITEMS.length} · грешки: ${mistakes}`);
    upd();
    ctx.click = null;
    const count = { live: 0, dead: 0 };
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => ctx.clearTip(),
      onDrop: (g, p, start) => {
        const it = g.userData.it;
        const inL = Math.hypot(p.x - zLive.position.x, p.z - zLive.position.z) < R + 0.1;
        const inD = Math.hypot(p.x - zDead.position.x, p.z - zDead.position.z) < R + 0.1;
        if (!inL && !inD) { g.position.copy(start); return; }
        if (inL === it.live) {
          g.userData.locked = true;
          delete g.userData.dragId;
          const z = it.live ? zLive : zDead;
          const k = count[it.live ? 'live' : 'dead']++;
          const a = k * 1.57 + 0.8;
          g.position.set(z.position.x + Math.cos(a) * R * 0.57, 0, z.position.z + Math.sin(a) * R * 0.5);
          placed++;
          ctx.say(g, `✔ ${esc(it.why)}`, 'good wide', 1.3);
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          g.position.copy(start);
          const why = it.live ? `${it.label}: храни ли се? Расте ли?` : `${it.label}: храни ли се? Има ли малки?`;
          ctx.say(g, `✘ ${esc(why)}${mistakes >= 2 ? ' ' + esc(it.why) : ''}`, 'bad wide', 1.3);
          shell.msg('Не е там.', 'bad');
        }
        upd();
        if (placed === ITEMS.length) {
          stopDrag(); stopDrag = null;
          ctx.scores[1] = stepScore(mistakes, 3);
          shell.score('');
          shell.msg('Браво! Живото се храни, расте и има малки.', 'good');
          nextBtn(ctx, 'Напред →', step4);
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    ctx.clearTip(); clearTags();
    show('pred');
    setPred(0);
    view(ctx, [0, 0.8, 0], 2.2, { halfH: 1.3, elev: 0.35 });
    shell.task('<p>Засаждаме <b>семе</b> и <b>камъче</b> в две саксии. Поливаме ги три седмици.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще стане?',
      options: [
        { t: 'От семето ще поникне растение. Камъчето ще остане същото.', ok: true, why: 'Да проверим! Плъзни лентата.' },
        { t: 'И от двете ще поникнат растения.', ok: false, why: 'Камъчето живо ли е? Може ли да расте?' },
        { t: 'Нищо няма да се промени.', ok: false, why: 'Семето е живо. Какво става с живите неща с времето?' },
      ],
      hint: 'Семето е живо, а камъчето — не.',
      onRight: (m) => {
        mistakes = m;
        const c = shell.setControls('<label class="row">Ден <b class="dn">0</b> <input type="range" class="days" min="0" max="21" value="0" style="flex:1"></label>');
        let ok = false;
        c.querySelector('.days').addEventListener('input', (e) => {
          const d = +e.target.value;
          c.querySelector('.dn').textContent = d;
          setPred(d);
          if (d >= 21 && !ok) {
            ok = true;
            tag(potSeed, '✓ поникна и расте', 'tag good', 1.9);
            tag(potPeb, '✗ същото камъче', 'tag bad', 1.0);
            setTimeout(hens, 1200);
          }
        });
      },
    });
    function hens() {
      clearTags();
      shell.setControls('');
      view(ctx, [5.6, 0.5, -1.2], 1.4, { halfH: 1.0, elev: 0.35 });
      shell.task('<p>Кокошката мъти яйца.</p>');
      choice(ctx, {
        q: 'От яйцата се излюпват пиленца. Кой жизнен процес е това?',
        options: [
          { t: 'Размножаване', ok: true, why: 'Вярно! Появяват се нови кокошки. Това е размножаване.' },
          { t: 'Хранене', ok: false, why: 'Храненето е, когато организмът яде. Тук се появяват нови пиленца.' },
          { t: 'Растеж', ok: false, why: 'Растеж е, когато организмът става по-голям. Тук се появяват нови организми.' },
        ],
        hint: 'Появяват се малки.',
        mistakes,
        onRight: (m) => {
          hatch = 0;
          ctx.scores[2] = stepScore(m, 3);
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
  return { dispose() { if (stopDrag) stopDrag(); stage.dispose(); } };
}
