// 5.2.2 „Спарта и Атина“ — възстановени Атина (Акропол, агора, Пникс) и Спарта (възпитание на воини).
// Стъпки: опознай → кой гласува в Атина (опит с извор-сцена) → подреди белезите → пренеси към днес.
import { createStage, cornerMenu, labelSprite, mat, zoneRing, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { hill, person, wander } from './hist/antiquity.js';
import { greekTemple, stoaDetailed, tholos, rockHill, statue, steps, gableRoof, column, M } from './hist/architecture.js';

// Факти по програмата за V клас (Тема 4, 4.1.3 Спарта и Атина; 4.2.2 Всекидневието).
const SPOTS = [
  { id: 'acropolis', label: 'Акропол и Партенон', icon: '🏛️',
    note: 'На хълма Акропол е Партенонът — храм на богиня Атина, покровителка на града. Построен е при Перикъл, през V век пр.Хр. До него са Ерехтейонът с кариатидите, Пропилеите (входът на Акропола) и бронзовата статуя на Атина.' },
  { id: 'agora', label: 'Агората', icon: '🏺',
    note: 'Агората е главният площад. Тук атиняните търгуват, срещат се и обсъждат новините в покритите колонади (стои). Над нея е храмът на Хефест.' },
  { id: 'pnyx', label: 'Народното събрание', icon: '🗳️',
    note: 'На хълма Пникс се събират гражданите. Те гласуват законите и решават важните въпроси. Това е демокрация — власт на народа.' },
  { id: 'pericles', label: 'Перикъл', icon: '🗿',
    note: 'Перикъл е водач на Атина през V век пр.Хр. При него демокрацията и културата на града процъфтяват.' },
  { id: 'leonidas', label: 'Цар Леонид', icon: '🛡️',
    note: 'Спарта има двама царе. Цар Леонид загива в битката при Термопилите (480 г. пр.Хр.) заедно с 300 спартанци.' },
  { id: 'agoge', label: 'Спартанското възпитание', icon: '⚔️',
    note: 'В Спарта момчетата от 7-годишна възраст живеят заедно и се обучават да бъдат издръжливи воини.' },
];
const CANDIDATES = [
  { id: 'c-citizen1', kind: 'citizen', label: 'Атинянин, гражданин', ok: true },
  { id: 'c-woman', kind: 'woman', label: 'Атинянка', ok: false, why: 'Жените в Атина не участват в Народното събрание.' },
  { id: 'c-slave', kind: 'slave', label: 'Роб', ok: false, why: 'Робите не са граждани и нямат право на глас.' },
  { id: 'c-foreigner', kind: 'foreigner', label: 'Чужденец, търговец', ok: false, why: 'Чужденците, дори да живеят в Атина, не са граждани.' },
  { id: 'c-citizen2', kind: 'citizen', label: 'Атинянин, грънчар', ok: true },
];
const TRAITS = [
  { id: 't-kings', label: 'Двама царе', city: 'sparta' },
  { id: 't-boys', label: 'Момчетата се обучават за воини', city: 'sparta' },
  { id: 't-leonid', label: 'Леонид и Термопилите', city: 'sparta' },
  { id: 't-demo', label: 'Демокрация', city: 'athens' },
  { id: 't-parth', label: 'Партенонът', city: 'athens' },
  { id: 't-school', label: 'Четене, музика и гимнастика', city: 'athens' },
];
const TRANSFER = [
  { t: 'Всички в класа гласуваме и решава мнозинството.', ok: true },
  { t: 'Решава само един човек и не пита никого.', ok: false, why: 'Така е при едноличната власт, не при демокрацията.' },
  { t: 'Решава само този, който е най-силен.', ok: false, why: 'В демокрацията решава мнозинството, а не силата.' },
];

function pedestal(figure) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.45), M(0xffffff, { tex: 'marble' }));
  p.position.y = 0.175;
  figure.position.y = 0.35;
  figure.scale.setScalar(1.3);
  g.add(p, figure);
  return g;
}
function card(id, label, x, z) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.45), mat(0xfff4d6));
  const l = labelSprite(label, { size: 0.17 });
  l.position.y = 0.3;
  g.add(b, l);
  g.position.set(x, 0.1, z);
  g.userData = { dragId: id, home: new THREE.Vector3(x, 0.1, z) };
  addHitBox(g, 0.6);
  return g;
}

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай', 'Кой гласува в Атина?', 'Атина или Спарта?', 'Демокрацията днес'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[0, 6.5 * far, 8.5 * far], [0, 0.3, far > 1 ? 1.2 : 0.4]];
  const stage = createStage(shell.stageEl, { background: 0xcfe6f7, camPos: VIEW[0], target: VIEW[1], maxDistance: 30 });
  const { scene } = stage;

  const ground = new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 10), M(0xffffff, { tex: 'sand', rep: [10, 7] }));
  ground.position.set(0, -0.05, 0.5);
  scene.add(ground);
  // Планини между двата града.
  for (let i = 0; i < 4; i++) { const m = hill({ r: 0.7, h: 0.9 + (i % 2) * 0.3, color: 0x9aa77a }); m.position.set(0.5 + (i % 2) * 0.3, 0, -3 + i * 1.1); scene.add(m); }
  const city = (t, x) => { const l = labelSprite(t, { size: 0.42, color: '#0a2a66' }); l.position.set(x, 2.6, -2.6); scene.add(l); };
  city('АТИНА', -3); city('СПАРТА', 3.2);

  const spots = new Map();
  const addSpot = (id, obj, x, z) => { obj.position.set(x, 0, z); obj.userData.pickId = id; addHitBox(obj, 0.9); scene.add(obj); spots.set(id, obj); return obj; };
  // Атина: Акрополът с Партенона, Пропилеите, Ерехтейона и статуята на Атина.
  const acro = new THREE.Group();
  const rock = rockHill({ rx: 1.65, rz: 1.05, h: 0.8 });
  acro.add(rock);
  const parth = greekTemple({ w: 1.55, d: 0.7, h: 0.3, front: 8, side: 17 });
  parth.position.set(0.25, 0.8, -0.1);
  acro.add(parth);
  const erech = greekTemple({ w: 0.55, d: 0.32, h: 0.22, front: 6, side: 4, order: 'ionic', painted: false });
  erech.position.set(-0.35, 0.8, 0.5);
  acro.add(erech);
  // Портикът на кариатидите: шест мраморни девойки вместо колони.
  for (let i = 0; i < 6; i++) { const k = person('woman', { scale: 0.42 }); k.traverse((o) => { if (o.material) o.material = M(0xf2ede1); }); k.position.set(-0.5 + (i % 3) * 0.1, 0.86, 0.72 + Math.floor(i / 3) * 0.08); acro.add(k); }
  const prop = new THREE.Group();
  const pst = steps(0.32, 0.6, { n: 3, h: 0.04 }); prop.add(pst);
  for (let i = 0; i < 6; i++) { const c = column('doric', { h: 0.26, r: 0.03 }); c.position.set(-0.13, 0.12, -0.25 + i * 0.1); prop.add(c); }
  const pr = gableRoof(0.36, 0.68, 0.1); pr.position.y = 0.4; prop.add(pr);
  prop.position.set(-1.25, 0.8, 0); acro.add(prop);
  const athena = statue({ h: 0.42 }); athena.position.set(-0.75, 0.8, -0.1); acro.add(athena);
  addSpot('acropolis', acro, -3.6, -2.1);
  // Агората: стоа, Хефестейонът на хълмче и кръглият Толос.
  const agora = new THREE.Group();
  agora.add(stoaDetailed({ w: 2.3, d: 0.75, h: 0.5, cols: 13 }));
  const heph = greekTemple({ w: 0.95, d: 0.45, h: 0.24, front: 6, side: 13 });
  const kol = rockHill({ rx: 0.65, rz: 0.4, h: 0.25, wall: false }); kol.position.set(1.7, 0, -0.9); agora.add(kol);
  heph.position.set(1.7, 0.25, -0.9); agora.add(heph);
  const th = tholos({ r: 0.3, h: 0.3 }); th.position.set(-1.5, 0, 0.75); agora.add(th);
  addSpot('agora', agora, -3.4, 0.9);
  // Пникс: стъпаловидна тераса с подпорна стена и ораторска трибуна (бема), изсечена в скалата.
  const pnyx = new THREE.Group();
  const terr = rockHill({ rx: 1.05, rz: 0.8, h: 0.3 });
  pnyx.add(terr);
  const bema = new THREE.Group();
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5 - i * 0.12, 0.08, 0.32 - i * 0.06), M(0xffffff, { tex: 'rock', flat: true })); b.position.y = 0.04 + i * 0.08; bema.add(b); }
  bema.position.set(0, 0.3, -0.5);
  pnyx.add(bema);
  addSpot('pnyx', pnyx, -1.2, -0.7);
  addSpot('pericles', pedestal(person('citizen')), -1.9, 1.9);
  // Спарта: обикновени къщи от кирпич с керемидени покриви и храмът на Артемида Ортия.
  for (const [x, z, r] of [[2.6, -2.4, 0], [3.4, -2.0, 0.4], [4.2, -2.5, -0.3], [3.0, -1.3, 0.2], [4.0, -1.2, 0]]) {
    const hs = new THREE.Group();
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.5), M(0xffffff, { tex: 'mudbrick', rep: [2, 1] })); w.position.y = 0.18; hs.add(w);
    const sock = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.52), M(0xffffff, { tex: 'stone', rep: [2, 0.5] })); sock.position.y = 0.04; hs.add(sock);
    const rf = gableRoof(0.7, 0.58, 0.18); rf.position.y = 0.36; hs.add(rf);
    const dr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.01), M(0x5a3d22)); dr.position.set(0, 0.1, 0.255); hs.add(dr);
    hs.position.set(x, 0, z); hs.rotation.y = r; scene.add(hs);
  }
  const orthia = greekTemple({ w: 0.7, d: 0.38, h: 0.22, front: 4, side: 6, painted: false }); orthia.position.set(4.6, 0, -0.1); orthia.rotation.y = Math.PI / 2; scene.add(orthia);
  addSpot('leonidas', pedestal(person('warrior')), 1.8, -0.4);
  const field = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 1.4), M(0xfff0c8, { tex: 'sand', rep: [3, 2] }));
  sand.position.y = 0.02;
  field.add(sand);
  addSpot('agoge', field, 3.4, 0.7);

  // Живот: атиняни на агората, младежи се упражняват в Спарта.
  const walkers = [];
  for (let i = 0; i < 4; i++) { const p = person(i === 2 ? 'woman' : 'citizen', { scale: 0.6 }); p.position.set(-3.8 + i * 0.6, 0, 1.5); scene.add(p); walkers.push(p); }
  const trainees = [];
  for (let i = 0; i < 4; i++) { const p = person('warrior', { scale: 0.6 }); p.position.set(2.8 + (i % 2) * 1.1, 0.04, 0.4 + Math.floor(i / 2) * 0.6); scene.add(p); trainees.push(p); }
  wander(stage, walkers, { r: 0.5, speed: 0.35 });
  wander(stage, trainees, { r: 0.25, speed: 1.2 });

  // Зона на Народното събрание (стъпка 2) и зони за подреждане (стъпка 3).
  const assembly = zoneRing(0x2d5fa8, 0.9);
  assembly.position.set(-1.2, 0.32, -0.5);
  assembly.visible = false;
  scene.add(assembly);
  const zones = { athens: zoneRing(0x2d5fa8, 1.3), sparta: zoneRing(0xb0322b, 1.3) };
  zones.athens.position.set(-2.2, 0.02, 3.4); zones.sparta.position.set(2.2, 0.02, 3.4);
  for (const [k, z] of Object.entries(zones)) {
    const l = labelSprite(k === 'athens' ? 'Атина' : 'Спарта', { size: 0.3 });
    l.position.set(0, 0.5, -1.0); z.add(l); z.visible = false; scene.add(z);
  }
  const ballot = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.3), mat(0xffffff));
  box.position.y = 0.2;
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.03), mat(0x222222));
  slit.position.y = 0.405;
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.005), mat(0xfafafa));
  paper.position.y = 0.5;
  ballot.add(box, slit, paper);
  ballot.position.set(-0.4, 0.3, -0.3);
  ballot.visible = false;
  scene.add(ballot);
  stage.tick((dt, t) => { if (ballot.visible) paper.position.y = 0.42 + ((t * 0.5) % 1) * 0.15; });

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 1.3, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let menu = null, clickHandler = null, stopDrag = null;
  const dragObjs = [];
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  function step1() {
    shell.step(0);
    scores.length = 0;
    shell.task('Разгледай Атина и Спарта. Избери всяко място от менюто или кликни върху него.');
    const seen = new Set();
    const open = (id) => {
      const s = SPOTS.find((x) => x.id === id);
      if (!s) return;
      stage.focusOn(spots.get(id), { dist: 4, height: 2, lift: 0.6, keepFollow: false });
      say(spots.get(id), `<b>${esc(s.label)}</b><br>${esc(s.note)}`, { cls: 'wide', lift: id === 'acropolis' ? 2.2 : 1.4 });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${SPOTS.length}`);
      if (seen.size === SPOTS.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: SPOTS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })), onSelect: open });
    clickHandler = open;
    shell.setControls('');
  }

  function step2() {
    shell.step(1);
    shell.score('');
    clickHandler = null;
    stage.flyTo([-1.2, 4.6 * far, 4.6 * far], [-1.2, 0.2, 0.6], 1);
    assembly.visible = true;
    say(assembly, 'Народно събрание', { cls: 'tag', lift: 0.4 });
    const people = CANDIDATES.map((c, i) => {
      const g = person(c.kind);
      g.position.set(-3.2 + i * 1.0, 0, 2.1);
      g.userData = { ...g.userData, dragId: c.id, home: g.position.clone() };
      const l = labelSprite(c.label, { size: 0.15 });
      l.position.y = 0.85; g.add(l);
      addHitBox(g, 0.5);
      scene.add(g); dragObjs.push(g);
      return g;
    });
    let mistakes = 0, inside = 0;
    shell.task('Тези хора живеят в Атина. <b>Кои от тях могат да гласуват в Народното събрание?</b> Завлечи ги в синия кръг.');
    shell.setControls('');
    stopDrag = stage.enableDrag({
      planeY: 0,
      onDrop(obj) {
        const c = CANDIDATES.find((x) => x.id === obj.userData.dragId);
        const d = Math.hypot(obj.position.x - assembly.position.x, obj.position.z - assembly.position.z);
        if (d > 1.0) { obj.position.copy(obj.userData.home); return; }
        if (c.ok) {
          obj.userData.locked = true;
          obj.position.set(assembly.position.x - 0.3 + inside * 0.6, 0.32, assembly.position.z);
          inside++;
          shell.msg('Да! Пълнолетните мъже — граждани на Атина — гласуват.', 'good');
          if (inside === 2) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 3));
            say(assembly, 'Гражданите гласуват с вдигане на ръка. Решава мнозинството. Но жените, робите и чужденците нямат право на глас.', { cls: 'good wide', lift: 1.0 });
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
          }
        } else {
          mistakes++;
          obj.position.copy(obj.userData.home);
          shell.msg(c.why, 'bad');
        }
      },
    });
  }

  function step3() {
    shell.step(2);
    assembly.visible = false;
    stage.flyTo([0, 5.2 * far, 9.6 * far], [0, 0, 3.0], 1);
    for (const z of Object.values(zones)) z.visible = true;
    const cards = TRAITS.map((t, i) => { const c = card(t.id, t.label, -4 + (i % 3) * 4, 5.0 + Math.floor(i / 3) * 0.7); c.position.x = [-3.3, 0, 3.3][i % 3]; c.userData.home.x = c.position.x; scene.add(c); dragObjs.push(c); return c; });
    // Разбъркан ред: Спарта и Атина се редуват.
    const order = [0, 3, 1, 4, 2, 5];
    order.forEach((k, i) => { const c = cards[k]; c.position.set([-3.3, 0, 3.3][i % 3], 0.1, 5.0 + Math.floor(i / 3) * 0.75); c.userData.home.copy(c.position); });
    let mistakes = 0, placed = 0;
    shell.task('Кое е за Атина и кое за Спарта? Завлечи всяка карта в правилния кръг.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${TRAITS.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.1,
      onDrop(obj) {
        const t = TRAITS.find((x) => x.id === obj.userData.dragId);
        const k = Object.keys(zones).find((z) => Math.hypot(obj.position.x - zones[z].position.x, obj.position.z - zones[z].position.z) < 1.4);
        if (!k) { obj.position.copy(obj.userData.home); return; }
        if (k === t.city) {
          obj.userData.locked = true;
          const n = TRAITS.filter((x) => x.city === k && dragObjs.find((o) => o.userData.dragId === x.id)?.userData.locked).length - 1;
          obj.position.set(zones[k].position.x - 0.0, 0.1 + n * 0.1, zones[k].position.z - 0.5 + n * 0.45);
          placed++;
          shell.score(`Подредени: ${placed} от ${TRAITS.length}`);
          shell.msg('Вярно!', 'good');
          if (placed === TRAITS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            const nx = shell.setControls('<button class="btn primary">Напред →</button>');
            nx.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          obj.position.copy(obj.userData.home);
          shell.msg(t.city === 'sparta' ? 'Помисли: това е белег на град, в който всичко е подчинено на войската.' : 'Помисли: това е белег на града на демокрацията и на храмовете.', 'bad');
        }
      },
    });
  }

  function step4() {
    shell.step(3);
    shell.score('');
    for (const z of Object.values(zones)) z.visible = false;
    stage.flyTo([-1.0, 3.6 * far, 4.2 * far], [-1.0, 0.4, -0.5], 1);
    let mistakes = 0;
    shell.task('Класът ви трябва да реши къде да отиде на екскурзия. <b>Как ще решите, ако постъпите като атиняните?</b>');
    const c = shell.setControls(`<div class="col">${TRANSFER.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = TRANSFER[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      ballot.visible = true;
      say(ballot, '<b>Точно така.</b> Демокрацията идва от Атина. Днес в България гражданите избират с гласуване своите представители — в Народното събрание, в общината, а в училище — ученическия съвет.', { cls: 'good wide', lift: 0.8 });
      shell.msg('Вярно!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => { clearTip(); shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart); });
    }));
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    for (const o of dragObjs) scene.remove(o);
    dragObjs.length = 0;
    ballot.visible = false; assembly.visible = false;
    for (const z of Object.values(zones)) z.visible = false;
    if (menu) menu.remove();
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  step1();
  container.__demo = { stage, zones, assembly };
  return { dispose() { if (stopDrag) stopDrag(); if (menu) menu.remove(); stage.dispose(); } };
}
