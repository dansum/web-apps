// 5.2.4 „Опазване чистотата на въздуха“ — макет на град: път с коли, завод, къщи с печки, парк, далечен вулкан.
// Стъпки: опознай → опит с лепливи картончета и протокол → източници и замърсители → направи въздуха по-чист.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, bar, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';

const SAFE = '<p class="warn">⚠ Картончетата се поставят <b>с възрастен</b>, далеч от платното на пътя. След опита измий ръцете.</p>';
const SPOTS = [
  { id: 'card-road', name: 'до пътя', pos: [0.6, 0, 1.75], dirt: 0.9, dots: 28, word: 'много' },
  { id: 'card-park', name: 'в парка', pos: [-0.6, 0, -2.6], dirt: 0.18, dots: 4, word: 'малко' },
  { id: 'card-yard', name: 'в училищния двор', pos: [4.3, 0, 0.3], dirt: 0.45, dots: 11, word: 'средно' },
];
const MEASURES = [
  { id: 'filter', t: '🏭 Филтри на комина на завода', d: 20, ok: true, why: 'Филтрите задържат праха и част от вредните газове.' },
  { id: 'bike', t: '🚲 Пеша, с велосипед и с градски транспорт вместо с кола', d: 20, ok: true, why: 'По-малко коли — по-малко изгорели газове.' },
  { id: 'heat', t: '🔌 Отопление без въглища и сурови дърва', d: 20, ok: true, why: 'Печките с въглища и сурови дърва дават много сажди и прах.' },
  { id: 'trees', t: '🌳 Повече дървета и паркове', d: 10, ok: true, why: 'Дърветата задържат праха и отделят кислород.' },
  { id: 'tall', t: '🏗 По-високи комини', d: 0, ok: false, why: 'Високият комин само отнася дима по-далеч. Там замърсяването се разпръсва, но не изчезва.' },
  { id: 'burn', t: '🔥 Изгаряне на листата и боклука в двора', d: -10, ok: false, why: 'Горенето на листа и отпадъци замърсява въздуха още повече.' },
];

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Опит с картончета', 'Източници и замърсители', 'По-чист въздух'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xbcd7ee, camPos: [0, 8, 12], target: [0, 0.5, 0], maxDistance: 30 } });
  const { shell, stage, scene } = ctx;
  const fog = new THREE.Fog(0x9aa3ab, 6, 60); scene.fog = fog;
  const sky = new THREE.Color(0xbcd7ee); const dirty = new THREE.Color(0x9aa3ab);
  const P = { level: 85, shown: 85, fil: false, bike: false, heat: false, trees: false, tall: false, burn: false };

  // ---------- Земя, път, сгради ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat(0x8bc34a)); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(30, 1.3), mat(0x546e7a)); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 1.0); scene.add(road);
  for (let x = -14; x < 15; x += 1.5) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.06), mat(0xffffff)); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.02, 1.0); scene.add(s); }
  const lbl = (g, t, y) => { const l = labelSprite(t, { size: 0.26 }); l.position.y = y; g.add(l); stage.steadyLabel(l, 10); return l; };
  const objs = {};
  const add = (id, g, label, ly) => { g.userData.pickId = id; if (label) lbl(g, label, ly); scene.add(g); addHitBox(g, 0.8); objs[id] = g; return g; };
  // завод
  const factory = new THREE.Group();
  {
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.4), mat(0x90a4ae)); b.position.y = 0.6;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 1.5), mat(0x607d8b)); roof.position.y = 1.25;
    const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.4, 14), mat(0xb71c1c)); ch.position.set(0.6, 2.2, 0);
    const ch2 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.25, 14), mat(0xeeeeee)); ch2.position.set(0.6, 2.6, 0);
    factory.add(b, roof, ch, ch2);
    const filt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), mat(0x26a69a)); filt.position.set(0.6, 1.5, 0.35); filt.visible = false; factory.add(filt); factory.userData.filt = filt;
    factory.userData.top = new THREE.Vector3(0.6, 3.45, 0);
    for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25), mat(0xfff59d)); w.position.set(-0.8 + i * 0.32, 0.7, 0.71); factory.add(w); }
  }
  factory.position.set(-4.2, 0, -1.6);
  add('factory', factory, 'завод', 3.8);
  // къщи с комини
  const houses = new THREE.Group();
  const houseTops = [];
  [[1.8, -1.6], [3.2, -1.9], [4.6, -1.5]].forEach(([x, z], i) => {
    const h = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.9), mat([0xffcc80, 0xffe0b2, 0xbcaaa4][i])); b.position.y = 0.4;
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.5, 4), mat(0xc62828)); r.position.y = 1.05; r.rotation.y = Math.PI / 4;
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.14), mat(0x6d4c41)); ch.position.set(0.25, 1.25, 0);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.4), mat(0x5d4037)); d.position.set(0, 0.2, 0.455);
    h.add(b, r, ch, d); h.position.set(x, 0, z); houses.add(h);
    houseTops.push(new THREE.Vector3(x + 0.25, 1.5, z));
  });
  add('houses', houses, null);
  houses.children.forEach((h) => { h.userData.pickId = undefined; });
  const housesAt = new THREE.Object3D(); housesAt.position.set(3.2, 0.8, -1.7); scene.add(housesAt); lbl(housesAt, 'къщи с печки', 1.1);
  // училище
  const school = new THREE.Group();
  {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1), mat(0xfff9c4)); b.position.y = 0.55;
    const r = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 1.1), mat(0x8d6e63)); r.position.y = 1.15;
    school.add(b, r);
    for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.3), mat(0x81d4fa)); w.position.set(-0.6 + i * 0.4, 0.65, 0.51); school.add(w); }
  }
  school.position.set(4.6, 0, -0.3);
  scene.add(school);
  // парк
  const park = new THREE.Group();
  const extraTrees = [];
  const tree = (x, z, s = 1) => {
    const t = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.6, 8), mat(0x6d4c41)); tr.position.y = 0.3;
    const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mat(0x2e7d32, { flat: true })); cr.position.y = 0.85;
    t.add(tr, cr); t.position.set(x, 0, z); t.scale.setScalar(s); return t;
  };
  [[-1.6, -2.4], [-0.9, -3.1], [0.2, -2.7], [-0.2, -3.6], [1.0, -3.3]].forEach(([x, z]) => park.add(tree(x, z)));
  add('park', park, null);
  const parkAt = new THREE.Object3D(); parkAt.position.set(-0.3, 0.8, -2.9); scene.add(parkAt); lbl(parkAt, 'парк', 0.9);
  // нови дървета (стъпка 4)
  [[-6.5, 2.4], [-5, 2.6], [-3, 2.3], [2.5, 2.5], [6, 2.4], [-7.2, -0.4], [7, -1]].forEach(([x, z]) => { const t = tree(x, z, 0.001); scene.add(t); extraTrees.push(t); });
  // вулкан далеч
  const volcano = new THREE.Group();
  {
    const c = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.4, 18, 1, true), mat(0x6d5a4e, { flat: true })); c.position.y = 1.7;
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), mat(0xe65100)); top.rotation.x = -Math.PI / 2; top.position.y = 3.0;
    volcano.add(c, top);
  }
  volcano.position.set(-10, 0, -11);
  add('volcano', volcano, 'вулкан (далеч)', 4.2);
  // коли и автобус
  const cars = [];
  const carCols = [0xe53935, 0x1e88e5, 0xfdd835, 0x8e24aa, 0x43a047, 0xff7043];
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.3), mat(carCols[i])); b.position.y = 0.16;
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.26), mat(0xe3f2fd)); t.position.set(-0.03, 0.32, 0);
    c.add(b, t);
    const lane = i % 2; c.userData = { x: -12 + i * 4.3, lane, v: lane ? -1.3 : 1.3 };
    c.position.set(c.userData.x, 0, lane ? 0.75 : 1.25);
    c.rotation.y = lane ? Math.PI : 0;
    scene.add(c); cars.push(c);
  }
  const carsAt = new THREE.Object3D(); carsAt.position.set(-1.5, 0.3, 1.0); scene.add(carsAt);
  carsAt.userData.pickId = 'cars';
  { const hit = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 1.3), new THREE.MeshBasicMaterial({ visible: false })); carsAt.add(hit); }
  const bikes = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group();
    for (const dx of [-0.13, 0.13]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 14), mat(0x212121)); w.position.set(dx, 0.08, 0); b.add(w); }
    const r = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 8), mat(0x00897b)); r.position.y = 0.33; b.add(r);
    b.userData = { x: -10 + i * 7 }; b.position.set(b.userData.x, 0, 1.55); b.visible = false; scene.add(b); bikes.push(b);
  }
  const bus = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.4), mat(0x43a047)); b.position.y = 0.3; const w = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.42), mat(0xe3f2fd)); w.position.y = 0.38; bus.add(b, w); }
  bus.userData = { x: 6 }; bus.position.set(6, 0, 0.75); bus.rotation.y = Math.PI; bus.visible = false; scene.add(bus);

  // ---------- Дим и прах ----------
  const smokeMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, depthWrite: false });
  const puffs = [];
  function emitter(origin, color, n, size, rise, kind) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 6), smokeMat(color));
      m.userData = { o: origin, k: i / n, rise, kind, drift: Math.random() * 0.6 };
      m.raycast = () => {};
      scene.add(m); puffs.push(m);
    }
  }
  emitter(new THREE.Vector3(-4.2 + 0.6, 2.7, -1.6), 0x616161, 12, 0.32, 3.2, 'factory');
  houseTops.forEach((p) => emitter(p, 0x424242, 6, 0.16, 1.6, 'house'));
  emitter(new THREE.Vector3(-10, 3.1, -11), 0x757575, 10, 0.6, 4, 'volcano');
  const exhausts = cars.map((c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), smokeMat(0x9e9e9e)); m.raycast = () => {}; scene.add(m); return m; });
  const leafFire = new THREE.Group();
  { const pile = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 10), mat(0xa1887f)); pile.position.y = 0.12; const f = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0xff7043 })); f.position.y = 0.4; leafFire.add(pile, f); }
  leafFire.position.set(2.4, 0, -0.6); leafFire.visible = false; scene.add(leafFire);
  emitter(new THREE.Vector3(2.4, 0.5, -0.6), 0x5d4037, 6, 0.15, 1.5, 'burn');

  // ---------- Картончета ----------
  const cards = SPOTS.map((S) => {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), mat(0x8d6e63)); post.position.y = 0.35;
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.02), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    card.position.y = 0.82;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.36, 24), new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
    g.add(post, card, ring);
    g.position.set(...S.pos);
    g.userData.pickId = S.id;
    scene.add(g); addHitBox(g, 0.7);
    return { ...S, g, card, post, ring, placed: false, d: 0 };
  });
  const setCards = (vis) => cards.forEach((c) => { c.post.visible = c.card.visible = c.placed; c.ring.visible = vis && !c.placed; c.g.visible = vis; });

  let week = 0;
  stage.tick((dt, t) => {
    P.shown += (P.level - P.shown) * Math.min(1, dt * 1.5);
    const k = Math.max(0, Math.min(1, P.shown / 100));
    scene.background.copy(sky).lerp(dirty, k * 0.8);
    fog.color.copy(scene.background);
    // мъглата зависи от разстоянието до камерата, за да се вижда градът и на тесен екран
    const cd = stage.camera.position.distanceTo(stage.controls.target);
    fog.near = cd * 0.6; fog.far = cd + 55 - k * 38;
    for (const p of puffs) {
      const u = p.userData;
      const f = (u.k + t * 0.18) % 1;
      p.position.set(u.o.x + f * 1.2 + Math.sin(t + u.drift * 9) * 0.1, u.o.y + f * u.rise, u.o.z + u.drift * f);
      let on = 1;
      if (u.kind === 'factory') on = P.fil ? 0.15 : 1;
      if (u.kind === 'house') on = P.heat ? 0 : 1;
      if (u.kind === 'burn') on = P.burn ? 1 : 0;
      if (u.kind === 'volcano') on = 0.8;
      p.material.opacity = 0.55 * (1 - f) * on;
      p.scale.setScalar(0.6 + f * 1.4);
    }
    const nCars = P.bike ? 2 : cars.length;
    cars.forEach((c, i) => {
      c.visible = i < nCars;
      c.userData.x += c.userData.v * dt; if (c.userData.x > 13) c.userData.x = -13; if (c.userData.x < -13) c.userData.x = 13;
      c.position.x = c.userData.x;
      const e = exhausts[i]; const f = (t * 1.5 + i * 0.3) % 1;
      e.visible = c.visible;
      e.position.set(c.position.x - Math.sign(c.userData.v) * (0.35 + f * 0.5), 0.15 + f * 0.25, c.position.z);
      e.material.opacity = 0.5 * (1 - f); e.scale.setScalar(0.6 + f * 1.5);
    });
    bikes.forEach((b) => { b.visible = P.bike; b.userData.x += dt * 0.6; if (b.userData.x > 13) b.userData.x = -13; b.position.x = b.userData.x; });
    bus.visible = P.bike; bus.userData.x -= dt * 1.0; if (bus.userData.x < -13) bus.userData.x = 13; bus.position.x = bus.userData.x;
    extraTrees.forEach((tr, i) => { const s = P.trees ? 1 : 0.001; tr.scale.setScalar(tr.scale.x + (s - tr.scale.x) * Math.min(1, dt * (2 + i * 0.3))); });
    factory.userData.filt.visible = P.fil;
    leafFire.visible = P.burn;
    leafFire.children[1].scale.y = 1 + Math.sin(t * 14) * 0.15;
    if (week > 0) {
      for (const c of cards) if (c.placed) { c.d = Math.min(c.dirt, c.d + dt * c.dirt * 0.25); const v = 1 - c.d * 0.8; c.card.material.color.setRGB(v, v * 0.97, v * 0.9); }
    }
    for (const c of cards) if (c.ring.visible) c.ring.material.opacity = 0.5 + Math.sin(t * 4) * 0.3;
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    Object.assign(P, { level: 85, fil: false, bike: false, heat: false, trees: false, tall: false, burn: false });
    cards.forEach((c) => { c.placed = false; c.d = 0; c.card.material.color.set(0xffffff); });
    setCards(false); week = 0;
    view(ctx, [0, 0.8, -1], 7.5, { halfH: 3.5, elev: 0.6 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Зимен ден в малък град. Въздухът е мътен. <b>Откъде идва замърсяването?</b></p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'factory', label: 'Завод', icon: '🏭', note: 'Заводите изгарят гориво. Комините изпускат <b>прах</b>, <b>сажди</b> и газове като <b>серен диоксид</b>. Той е отровен газ с остра миризма. Отделя се, когато гориво със сяра изгаря.', obj: () => factory, dist: 6, bubble: 3.2 },
        { id: 'cars', label: 'Автомобили', icon: '🚗', note: 'Изгорелите газове на колите съдържат <b>азотни оксиди</b>, <b>въглероден оксид</b> (угарен газ) и прах. Азотните оксиди са газове от азот и кислород. Те дразнят дихателните пътища.', obj: () => carsAt, dist: 4.5 },
        { id: 'houses', label: 'Къщи с печки', icon: '🏠', note: 'Печките на въглища и сурови дърва дават много <b>дим и сажди</b>. През зимата те са голям източник на прах в градовете.', obj: () => housesAt, dist: 5, bubble: 1.2 },
        { id: 'park', label: 'Парк', icon: '🌳', note: 'Дърветата задържат праха по листата си и отделят <b>кислород</b>.', obj: () => parkAt, dist: 5, bubble: 1 },
        { id: 'volcano', label: 'Вулкан', icon: '🌋', note: 'Вулканите изхвърлят пепел и газове. Това е <b>природен</b> източник на замърсяване, който хората не могат да спрат.', obj: () => volcano, dist: 12, bubble: 4.5 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Опит с лепливи картончета ----------
  function step2() {
    shell.step(1);
    setCards(true);
    view(ctx, [1.6, 0.6, -0.3], 4.2, { halfH: 2.4, elev: 0.75 });
    shell.task(`<p><b>Опит:</b> картончета, намазани с вазелин, остават една седмица на три места. Прахът във въздуха полепва по тях.</p>${SAFE}`);
    let mistakes = 0;
    choice(ctx, {
      q: 'Къде картончето ще събере най-много прах?',
      options: [
        { t: 'До пътя', ok: true, why: 'Да проверим! Постави трите картончета.' },
        { t: 'В парка', ok: false, why: 'Какво има в парка: коли или дървета? А какво има до пътя?' },
        { t: 'Навсякъде еднакво', ok: false, why: 'Близо ли е всяко място до източник на замърсяване?' },
      ],
      hint: 'Помисли къде има най-много източници на прах и газове.',
      onRight: (m) => { mistakes = m; place(); },
    });
    function place() {
      shell.task(`<p><b>Кликни трите зелени кръга</b>, за да поставиш картончетата: до пътя, в парка и в училищния двор.</p>${SAFE}`);
      shell.setControls('');
      ctx.click = (id, hit) => {
        // кликът може да попадне в съседен обект (парка, пътя): взимаме най-близкото картонче
        let c = cards.find((x) => x.id === id);
        if (!c && hit) c = cards.find((x) => !x.placed && Math.hypot(x.g.position.x - hit.point.x, x.g.position.z - hit.point.z) < 0.9);
        if (!c || c.placed) return;
        c.placed = true; setCards(true);
        ctx.say(c.g, `картонче ${c.name}`, 'tag', 1.2);
        if (cards.every((x) => x.placed)) {
          ctx.click = null;
          const cc = shell.setControls('<div class="row"><button class="btn primary wait">⏳ Изчакай една седмица</button></div>');
          cc.querySelector('.wait').addEventListener('click', () => {
            cc.querySelector('.wait').disabled = true;
            ctx.clearTip();
            week = 1;
            let d = 0;
            const tg = stage.bubble(cards[0].g, '', { cls: 'tag', lift: 1.4 });
            const stop = stage.tick((dt) => {
              d = Math.min(7, d + dt * 1.6);
              tg.set(`ден ${Math.max(1, Math.ceil(d))} от 7`);
              if (d >= 7) { stop(); tg.remove(); protocol(); }
            });
          }, { once: true });
        }
      };
    }
    function protocol() {
      cards.forEach((c) => { c.d = c.dirt; });
      shell.msg('');
      const tags = cards.map((c) => stage.bubble(c.g, `🔍 ${'•'.repeat(Math.min(c.dots, 18))}${c.dots > 18 ? '…' : ''}`, { cls: 'tag', lift: 1.25 }));
      ctx.tags2 = tags;
      shell.task(`<p><b>Протокол</b></p>
        <table class="small" style="border-collapse:collapse;width:100%">
          <tr><td style="padding:2px 4px;vertical-align:top"><b>Цел</b></td><td>Да сравним колко прах има във въздуха на три места.</td></tr>
          <tr><td style="padding:2px 4px;vertical-align:top"><b>Пособия</b></td><td>3 картончета, вазелин, лупа.</td></tr>
          <tr><td style="padding:2px 4px;vertical-align:top"><b>Ход</b></td><td>Намазваме картончетата, оставяме ги 7 дни, гледаме ги с лупа.</td></tr>
          <tr><td style="padding:2px 4px;vertical-align:top"><b>Наблюдения</b></td><td>${cards.map((c) => `${c.name}: <b>${c.word}</b> прахови частици`).join('<br>')}</td></tr>
        </table>`);
      choice(ctx, {
        q: 'Довърши протокола. Какъв е изводът?',
        options: [
          { t: 'Най-много прах има до пътя, а най-малко — в парка. Край пътя въздухът е най-прашен.', ok: true, why: 'Вярно! Изводът отговаря на целта и се опира на наблюденията.' },
          { t: 'Прахът идва само от вулкана.', ok: false, why: 'Тогава картончетата щяха да са еднакво мръсни. Така ли е?' },
          { t: 'В парка въздухът е най-мръсен.', ok: false, why: 'Погледни реда „Наблюдения“ в протокола.' },
        ],
        hint: 'Сравни картончетата: кое е най-тъмно?',
        mistakes,
        onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
      });
    }
  }

  // ---------- 3. Източници и замърсители ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    (ctx.tags2 || []).forEach((b) => b.remove()); ctx.tags2 = null;
    setCards(false);
    view(ctx, [-2, 1, -3], 8, { halfH: 4, elev: 0.5 });
    shell.task('<p>Източниците на замърсяване са <b>природни</b> или от <b>човешка дейност</b>.</p>');
    const look = (o, txt) => () => ctx.say(o, txt, 'tag', 1.0);
    sortTask(ctx, {
      bins: ['Природен източник', 'Човешка дейност'],
      items: [
        { t: 'Вулкан изхвърля пепел', bin: 0, show: look(volcano, '🌋'), why: 'Природен източник.' },
        { t: 'Горски пожар от мълния', bin: 0, why: 'Природен източник: пожарът е запален от мълния.' },
        { t: 'Прашна буря', bin: 0, why: 'Природен източник: вятърът вдига прах и пясък.' },
        { t: 'Комин на завод', bin: 1, show: look(factory, '🏭'), why: 'Човешка дейност.' },
        { t: 'Изгорели газове от колите', bin: 1, show: look(carsAt, '🚗'), why: 'Човешка дейност.' },
        { t: 'Печки на въглища', bin: 1, show: look(housesAt, '🏠'), why: 'Човешка дейност.' },
      ],
      hint: 'Би ли се случило това, ако нямаше хора?',
      onDone: (m) => {
        ctx.clearTip();
        shell.task('<p>Какво причинява всеки замърсител?</p><p class="small">Някои замърсители вредят по няколко начина. Гледай къде е замърсителят.</p>');
        sortTask(ctx, {
          bins: ['Киселинни дъждове', 'Отравяне: кръвта пренася по-малко кислород', 'Болести на дишането'],
          items: [
            { t: 'Серен диоксид в облаците', bin: 0, why: 'Серният диоксид се разтваря във водните капки и образува киселинни дъждове. Той дразни и дихателните пътища.' },
            { t: 'Азотни оксиди в облаците', bin: 0, why: 'В облаците азотните оксиди също водят до киселинни дъждове. Те дразнят и дихателните пътища.' },
            { t: 'Въглероден оксид (угарен газ)', bin: 1, why: 'Угарният газ пречи на кръвта да пренася кислород.' },
            { t: 'Прах и сажди', bin: 2, why: 'Ситният прах влиза дълбоко в белите дробове: кашлица, астма, бронхит.' },
          ],
          hint: 'Киселинните дъждове идват от газове, които се разтварят във водата на облаците.',
          mistakes: m,
          onDone: (m2) => { ctx.scores[1] = stepScore(m2, 3); shell.msg('Браво!', 'good'); nextBtn(ctx, 'Напред →', step4); },
        });
      },
    });
  }

  // ---------- 4. По-чист въздух ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [0, 0.8, -0.5], 7.5, { halfH: 3.5, elev: 0.55 });
    let mistakes = 0;
    const meter = stage.bubble(new THREE.Vector3(0, 3.6, -1), '', { cls: 'tag', lift: 0 });
    const upd = () => meter.set(`Замърсяване ${bar(P.level, P.level > 50 ? '#e05555' : P.level > 30 ? '#f9a825' : '#2e7d32')} ${P.level}`);
    upd();
    shell.task('<p>Градът иска <b>по-чист въздух</b>. Избери мерки, докато замърсяването падне <b>под 30</b>.</p><p class="small">Числата са приблизителни: моделът само сравнява мерките.</p>');
    const c = shell.setControls(`<div class="choices">${MEASURES.map((M, i) => `<button class="choice ms" data-i="${i}" data-ok="${M.ok ? 1 : 0}">${M.t}</button>`).join('')}</div>`);
    c.querySelectorAll('.ms').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      const M = MEASURES[+b.dataset.i];
      b.disabled = true;
      const key = { filter: 'fil', bike: 'bike', heat: 'heat', trees: 'trees', tall: 'tall', burn: 'burn' }[M.id];
      P[key] = true;
      P.level = Math.max(5, Math.min(100, P.level - M.d));
      upd();
      if (!M.ok) {
        mistakes++;
        b.classList.add('wrong');
        shell.msg(`${M.why}${mistakes >= 2 ? ' Подсказка: търси мерки, които намаляват изгарянето на гориво и праха.' : ''}`, 'bad');
        if (M.id === 'burn') setTimeout(() => { P.burn = false; P.level = Math.max(5, P.level - 10); upd(); }, 2500);
        return;
      }
      b.classList.add('right');
      shell.msg(M.why, 'good');
      if (P.level < 30) {
        c.querySelectorAll('.ms').forEach((x) => { x.disabled = true; });
        setTimeout(() => {
          meter.remove();
          ctx.say(new THREE.Vector3(0, 2, -1), '✔ Въздухът е по-чист: небето се изчисти, а димът намаля.', 'good', 0);
          nextBtn(ctx, 'Последен въпрос →', () => co(mistakes));
        }, 900);
      }
    }));
    function co(m0) {
      ctx.clearTip();
      shell.task('<p>Пренеси към живота.</p>');
      choice(ctx, {
        q: 'Защо въглеродният оксид (угарният газ) от печките е особено опасен?',
        options: [
          { t: 'Няма цвят и мирис, а пречи на кръвта да пренася кислород.', ok: true, why: 'Вярно! Затова стаята с печка се проветрява, а комините се почистват.' },
          { t: 'Защото мирише силно и дразни очите.', ok: false, why: 'Точно обратното — не го усещаме. Затова е опасен.' },
          { t: 'Защото оцветява въздуха в черно.', ok: false, why: 'Черни са саждите. Угарният газ не се вижда.' },
        ],
        hint: 'Как бихме разбрали, че го има?',
        mistakes: m0,
        onRight: (m) => { ctx.scores[2] = stepScore(m, 3); finishBtn(ctx, onComplete, restart); },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    ctx.answer = null;
    stage.clearBubbles();
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
