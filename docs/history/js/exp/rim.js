// 5.3.3 „Римското строителство и паметниците в българските земи“ — римски град: театър, амфитеатър, терми, акведукт, вила.
// Стъпки: опознай → пусни водата по акведукта (опит) → за какво е всяка сграда → предскажи: театърът днес.
import { createStage, cornerMenu, labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { column, house, person, wander } from './hist/antiquity.js';

const SPOTS = [
  { id: 'theatre', label: 'Античният театър в Пловдив', icon: '🎭',
    note: 'Театърът в древния Филипопол (днес Пловдив) е от времето на Римската империя. Тук се играят пиеси пред хиляди зрители.' },
  { id: 'amphi', label: 'Амфитеатър', icon: '🏟️',
    note: 'Амфитеатърът е овален. В него се провеждат гладиаторски борби. Останки от амфитеатър има в София, древната Сердика.' },
  { id: 'baths', label: 'Терми', icon: '♨️',
    note: 'Термите са обществени бани с топла и студена вода. Римляните се къпят, спортуват и разговарят там.' },
  { id: 'aqueduct', label: 'Акведукт', icon: '🌊',
    note: 'Акведуктът докарва вода от планината до града. Водата тече сама, защото каналът леко се спуска надолу.' },
  { id: 'villa', label: 'Вила Армира', icon: '🏡',
    note: 'Край Ивайловград е открита римската вила Армира — богат дом с красиви подови мозайки.' },
];
const USES = [
  { id: 'u-theatre', label: 'Представления', target: 'theatre' },
  { id: 'u-amphi', label: 'Гладиаторски борби', target: 'amphi' },
  { id: 'u-baths', label: 'Къпане и срещи', target: 'baths' },
  { id: 'u-aqueduct', label: 'Вода за града', target: 'aqueduct' },
];
const PREDICT = [
  { t: 'За представления и концерти, както преди.', ok: true },
  { t: 'Нищо — старите сгради не могат да се използват.', ok: false, why: 'Здравите каменни постройки на римляните често издържат хиляди години.' },
  { t: 'За гладиаторски борби.', ok: false, why: 'Гладиаторските борби са в амфитеатъра, не в театъра. И днес не се провеждат.' },
];

function theatreModel() {
  const g = new THREE.Group();
  // Седалките се издигат стъпаловидно назад (половин кръг), сцената е отпред.
  const prof = [[0.5, 0]];
  for (let i = 0; i < 5; i++) { const r = 0.5 + i * 0.22, h = 0.1 + i * 0.12; prof.push([r, h], [r + 0.22, h]); }
  prof.push([1.6, 0], [0.5, 0]);
  const seats = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 28, Math.PI / 2, Math.PI), mat(0xeee6d3, { side: THREE.DoubleSide }));
  g.add(seats);
  const scene = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.18), mat(0xe2d6bc));
  scene.position.set(0, 0.35, 0.45);
  g.add(scene);
  for (let i = 0; i < 5; i++) { const c = column(0.5, 0.04); c.position.set(-0.7 + i * 0.35, 0, 0.32); g.add(c); }
  return g;
}
function amphiModel() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.5, 32, 1, true), mat(0xd8c7a3, { side: THREE.DoubleSide }));
  ring.scale.z = 0.7; ring.position.y = 0.25;
  const arena = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.04, 32), mat(0xe8d59c));
  arena.scale.z = 0.7; arena.position.y = 0.02;
  g.add(ring, arena);
  return g;
}
function bathsModel() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), mat(0xe9dcc2));
  b.position.y = 0.25;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc96d43));
  dome.position.y = 0.5;
  const pool = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.4), mat(0x6fb3dc));
  pool.position.set(0, 0.03, 0.62);
  g.add(b, dome, pool);
  g.userData.pool = pool;
  return g;
}

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай', 'Пусни водата', 'За какво е сградата?', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[0, 6.5 * far, 8.6 * far], [0, 0.4, far > 1 ? 1.2 : 0.5]];
  const stage = createStage(shell.stageEl, { background: 0xd4e8f5, camPos: VIEW[0], target: VIEW[1], maxDistance: 30 });
  const { scene } = stage;
  const ground = new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 10), mat(0xcbbf92));
  ground.position.set(0, -0.05, 0.5);
  scene.add(ground);
  // Планина с извор (вляво отзад).
  const mount3 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.4, 7), mat(0x8fa36e, { flat: true }));
  mount3.position.set(-5.2, 1.2, -3.2);
  scene.add(mount3);

  const spots = new Map();
  const addSpot = (id, obj, x, z, ry = 0) => { obj.position.set(x, 0, z); obj.rotation.y = ry; obj.userData.pickId = id; addHitBox(obj, 1.0); scene.add(obj); spots.set(id, obj); return obj; };
  addSpot('theatre', theatreModel(), -0.4, -1.9);
  addSpot('amphi', amphiModel(), 2.6, -1.8);
  const baths = addSpot('baths', bathsModel(), 1.6, 1.0);
  const villa = house({ w: 1.0, d: 0.8, h: 0.45, wall: 0xf0e4c8 });
  addSpot('villa', villa, 4.2, 0.9);

  // Акведукт: арки от планината до града; изворът е на регулируема височина.
  const aq = new THREE.Group();
  aq.userData.pickId = 'aqueduct';
  const A = new THREE.Vector3(-4.5, 0, -2.4), B = new THREE.Vector3(-2.6, 0, 1.4);
  const N = 7;
  const piers = [];
  for (let i = 0; i < N; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1, 0.16), mat(0xd9c9a6));
    aq.add(p); piers.push(p);
  }
  const channel = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.2), mat(0xc9b78f));
  aq.add(channel);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16), mat(0xbfae88));
  tank.position.set(B.x, 0.15, B.z);
  aq.add(tank);
  const tankWater = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 16), mat(0x4aa3e0));
  tankWater.position.set(B.x, 0.05, B.z);
  aq.add(tankWater);
  addHitBox(aq, 1.0);
  scene.add(aq);
  spots.set('aqueduct', aq);
  const DEST_H = 0.9;
  let srcH = 0.6;
  function layoutAqueduct() {
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const h = srcH + (DEST_H - srcH) * t;
      const p = piers[i];
      p.scale.y = h; p.position.set(A.x + (B.x - A.x) * t, h / 2, A.z + (B.z - A.z) * t);
    }
    const len = A.distanceTo(B);
    channel.scale.x = len;
    channel.position.set((A.x + B.x) / 2, (srcH + DEST_H) / 2 + 0.04, (A.z + B.z) / 2);
    channel.rotation.set(0, -Math.atan2(B.z - A.z, B.x - A.x), Math.atan2(DEST_H - srcH, len));
  }
  layoutAqueduct();
  // Капки вода по канала: текат само когато изворът е по-високо от града.
  const drops = Array.from({ length: 14 }, () => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0x3a95dd)); d.visible = false; scene.add(d); return d; });
  let flowing = false;
  stage.tick((dt, t) => {
    drops.forEach((d, i) => {
      d.visible = flowing;
      if (!flowing) return;
      const k = ((t * 0.25 + i / drops.length) % 1);
      d.position.set(A.x + (B.x - A.x) * k, srcH + (DEST_H - srcH) * k + 0.12, A.z + (B.z - A.z) * k);
    });
    if (flowing && tankWater.position.y < 0.28) tankWater.position.y += dt * 0.05;
    baths.userData.pool.material.color.setHSL(0.56, 0.6, 0.6 + Math.sin(t * 2) * 0.03);
  });

  const walkers = [];
  for (let i = 0; i < 5; i++) { const p = person(i % 2 ? 'citizen' : 'woman'); p.position.set(-0.4 + i * 0.7, 0, 2.6); scene.add(p); walkers.push(p); }
  wander(stage, walkers, { r: 0.6, speed: 0.3 });

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 1.3, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let menu = null, clickHandler = null, stopDrag = null;
  const extra = [];
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  function step1() {
    shell.step(0);
    scores.length = 0;
    shell.task('Разгледай римския град. Избери всяка постройка от менюто или кликни върху нея.');
    const seen = new Set();
    const open = (id) => {
      const s = SPOTS.find((x) => x.id === id);
      if (!s) return;
      const obj = id === 'aqueduct' ? piers[3] : spots.get(id);
      stage.focusOn(obj, { dist: 4, height: 2, lift: 0.5, keepFollow: false });
      say(obj, `<b>${esc(s.label)}</b><br>${esc(s.note)}`, { cls: 'wide', lift: 1.3 });
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
    stage.flyTo([0.8, 2.8 * far, 0.6 * far], [-3.5, 0.8, -0.5], 1);
    let mistakes = 0, phase = 'predict';
    shell.task('Римляните нямат помпи. <b>Къде трябва да е изворът, за да стигне водата сама до града?</b>');
    const c = shell.setControls('<div class="row"><button class="btn" data-a="low">По-ниско от града</button><button class="btn" data-a="high">По-високо от града</button></div>');
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (phase !== 'predict') return;
      if (b.dataset.a === 'low') { mistakes++; b.disabled = true; shell.msg('Помисли: водата може ли сама да тече нагоре?', 'bad'); return; }
      phase = 'try';
      shell.msg('Да проверим! Вдигни извора с плъзгача.', 'good');
      tryIt();
    }));
    function tryIt() {
      shell.task('Премести плъзгача и гледай: кога водата потича към града?');
      const cc = shell.setControls('<label class="small">Височина на извора</label><input class="h-range" type="range" min="0.2" max="2.2" step="0.05" value="0.6" style="width:100%">');
      const r = cc.querySelector('.h-range');
      say(tank, 'Градът', { cls: 'tag', lift: 0.6 });
      r.addEventListener('input', () => {
        srcH = +r.value;
        layoutAqueduct();
        const was = flowing;
        flowing = srcH > DEST_H + 0.15;
        if (flowing && !was) {
          scores.push(stepScore(mistakes, 1));
          say(tank, 'Водата тече! Каналът се спуска леко надолу към града.', { cls: 'good wide', lift: 0.7 });
          const n = shell.setControls('<button class="btn primary">Напред →</button>');
          n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
        }
      });
    }
  }

  function step3() {
    shell.step(2);
    stage.flyTo(VIEW[0], VIEW[1], 1);
    let mistakes = 0, placed = 0;
    USES.forEach((u, i) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.45), mat(0xfff4d6));
      const l = labelSprite(u.label, { size: 0.18 }); l.position.y = 0.3;
      g.add(b, l);
      g.position.set(-3.3 + i * 2.2, 0.1, 4.2);
      g.userData = { dragId: u.id, home: g.position.clone() };
      addHitBox(g, 0.6);
      scene.add(g); extra.push(g);
    });
    shell.task('За какво служи всяка постройка? Завлечи всяка карта до своята постройка.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${USES.length}`);
    const centerOf = (id) => (id === 'aqueduct' ? piers[3].getWorldPosition(new THREE.Vector3()) : spots.get(id).getWorldPosition(new THREE.Vector3()));
    stopDrag = stage.enableDrag({
      planeY: 0.1,
      onDrop(obj) {
        const u = USES.find((x) => x.id === obj.userData.dragId);
        // Акведуктът е дълъг и висок: разстоянието се мери до най-близката му опора.
        const dist = (s) => (s === 'aqueduct' ? Math.min(...piers.map((pp) => { const w = pp.getWorldPosition(new THREE.Vector3()); return Math.hypot(obj.position.x - w.x, obj.position.z - w.z) - 0.4; }))
          : (() => { const p = centerOf(s); return Math.hypot(obj.position.x - p.x, obj.position.z - p.z); })());
        let best = null, bd = 1.3;
        for (const s of ['theatre', 'amphi', 'baths', 'aqueduct']) { const d = dist(s); if (d < bd) { bd = d; best = s; } }
        if (!best) { obj.position.copy(obj.userData.home); return; }
        if (best === u.target) {
          obj.userData.locked = true;
          const p = centerOf(best);
          obj.position.set(p.x, 1.4, p.z + 0.2);
          placed++;
          shell.score(`Подредени: ${placed} от ${USES.length}`);
          shell.msg('Вярно!', 'good');
          if (placed === USES.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 3));
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          obj.position.copy(obj.userData.home);
          shell.msg(['theatre', 'amphi'].includes(best) && ['theatre', 'amphi'].includes(u.target) ? 'Внимание: театърът е полукръгъл, а амфитеатърът — овален. Различно е и това, което се случва в тях.' : 'Не е тази постройка. Разгледай пак какво има в нея.', 'bad');
        }
      },
    });
  }

  function step4() {
    shell.step(3);
    shell.score('');
    stage.focusOn(spots.get('theatre'), { dist: 4, height: 2.2, lift: 0.4, keepFollow: false });
    let mistakes = 0;
    shell.task('Античният театър в Пловдив е затрупан от земя векове наред. Ако го разкопаят и възстановят, <b>за какво ще се използва днес?</b>');
    const c = shell.setControls(`<div class="col">${PREDICT.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = PREDICT[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      const crowd = [];
      for (let i = 0; i < 8; i++) { const q = person(i % 3 ? 'citizen' : 'woman', { scale: 0.6 }); const a = Math.PI * (0.62 + i * 0.1); const r = i % 2 ? 1.05 : 0.83; const th = spots.get('theatre').position; q.position.set(th.x + Math.sin(a) * r, i % 2 ? 0.34 : 0.22, th.z + Math.cos(a) * r); scene.add(q); crowd.push(q); extra.push(q); }
      say(spots.get('theatre'), '<b>Така и става.</b> Театърът е открит и възстановен през ХХ век. Днес в него отново има представления и концерти — почти 2000 години по-късно!', { cls: 'good wide', lift: 1.4 });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => { clearTip(); shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart); });
    }));
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    srcH = 0.6; flowing = false; tankWater.position.y = 0.05; layoutAqueduct();
    if (menu) menu.remove();
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  step1();
  container.__demo = { stage, piers, spots };
  return { dispose() { if (stopDrag) stopDrag(); if (menu) menu.remove(); stage.dispose(); } };
}
