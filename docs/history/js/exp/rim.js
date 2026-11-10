// 5.3.3 „Римското строителство и паметниците в българските земи“ — римски град: театър, амфитеатър, терми, акведукт, вила.
// Стъпки: опознай → пусни водата по акведукта (опит) → за какво е всяка сграда → предскажи: театърът днес.
import { createStage, cornerMenu, labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { person, stoa } from './hist/antiquity.js';
import * as R from './hist/roman.js';

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

// Разположение на града (x надясно, z към зрителя).
const T = { x: -0.5, z: -2.7, ry: 1.2 }; // театърът; сцената гледа надясно и леко напред
T.ox = Math.sin(T.ry); T.oz = Math.cos(T.ry);
const SRC = new THREE.Vector3(-4.7, 0, -2.5), CITY = new THREE.Vector3(-2.6, 0, 1.5); // извор и водна кула
const DEST_H = 0.9, SRC_START = 1.7, SRC_LOW = 0.6;
const DAY = { top: 0x6ea8e6, bottom: 0xe3eef2, sun: 0xfff3dc, sunI: 2.1, hemi: 1.0 };
const DUSK = { top: 0x4a6cb0, bottom: 0xf9cf9f, sun: 0xffc48a, sunI: 1.9, hemi: 0.9 };

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай', 'Пусни водата', 'За какво е сградата?', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[0.4, 5.6 * far, 11.2 * far], [0.3, 1.2, -1.0]];
  // Изглед към обект: камерата е на разстояние off от целта; на тесен екран — по-далеч.
  const look = (tgt, off, dur = 1.1) => stage.flyTo([tgt[0] + off[0] * far, tgt[1] + off[1] * far, tgt[2] + off[2] * far], tgt, dur);
  const weak = (navigator.hardwareConcurrency || 4) <= 2; // слаб компютър: без сенки
  const stage = createStage(shell.stageEl, {
    background: DAY.bottom, camPos: [VIEW[0][0] - 5, VIEW[0][1] * 1.7, VIEW[0][2] * 1.7], target: VIEW[1],
    minDistance: 2.2, maxDistance: 30, shadows: !weak, fog: { color: DAY.bottom, near: 26, far: 75 },
  });
  const { scene } = stage;
  stage.sun.position.set(4, 12, 8);
  stage.sun.color.setHex(DAY.sun); stage.sun.intensity = DAY.sunI;
  stage.hemi.color.setHex(0xdcecff); stage.hemi.groundColor.setHex(0xb9a878); stage.hemi.intensity = DAY.hemi;
  if (!weak) {
    const sc = stage.sun.shadow.camera;
    sc.left = -11; sc.right = 11; sc.top = 9; sc.bottom = -9; sc.far = 45;
    sc.updateProjectionMatrix();
    stage.sun.shadow.mapSize.set(2048, 2048);
    stage.sun.shadow.normalBias = 0.03;
  }
  const skyDome = R.sky(DAY);
  scene.add(skyDome);

  // Терен и вода.
  const terrain = R.createTerrain({ flat: { x0: -4.4, x1: 7, z0: -3.8, z1: 6 }, mountain: { x: -5.93, z: -4.79, r: 3.0, h: 3.2 }, theatre: T });
  scene.add(terrain.mesh);
  const flowW = R.waterMat(), fallW = R.waterMat(), stillW = R.waterMat({ opacity: 0.85 });
  flowW.map.repeat.set(7, 1); fallW.map.repeat.set(1, 3); fallW.map.rotation = Math.PI / 2; stillW.map.repeat.set(2, 2);

  // Улици и площад (форум).
  const town = new THREE.Group();
  const road = (w, d, x, z, color = 0xd9ceb4) => { const r = R.paved(w, d, { color }); r.position.x = x; r.position.z = z; town.add(r); };
  road(9.5, 0.36, 1.55, -0.45); // главната улица изток–запад
  road(0.36, 6.9, 1.6, -0.15); // главната улица север–юг
  road(0.24, 1.3, 4.75, 0.35);
  const plaza = R.paved(3.1, 2.1, { y: 0.014 });
  plaza.position.x = -0.55; plaza.position.z = 1.65;
  town.add(plaza);
  const colonnade = stoa({ w: 2.6, h: 0.5, cols: 9 });
  colonnade.position.set(-0.55, 0.02, 0.3);
  town.add(colonnade);
  const fount = R.fountain(stillW);
  fount.position.set(-0.55, 0.02, 1.7);
  town.add(fount);
  town.add(R.houses([
    [-2.75, -1.1, 0.5, 0.42, 0.34, 0.05], [-2.15, -1.15, 0.46, 0.44, 0.4, -0.04],
    [2.25, -0.98, 0.5, 0.42, 0.36, 0], [2.85, -0.95, 0.44, 0.4, 0.42, 0.03], [4.3, -1.0, 0.52, 0.44, 0.36, 0], [4.9, -1.05, 0.46, 0.46, 0.44, 0], [5.5, -0.98, 0.5, 0.4, 0.34, 0.06],
    [-3.55, 2.45, 0.5, 0.44, 0.36, 0.2], [-3.35, 3.15, 0.46, 0.42, 0.4, 0.1],
    [-1.65, 3.25, 0.5, 0.42, 0.36, 0], [-0.95, 3.3, 0.46, 0.44, 0.42, 0.04], [0.45, 3.28, 0.5, 0.42, 0.36, -0.03],
    [2.3, 3.0, 0.46, 0.42, 0.4, 0], [2.95, 3.05, 0.5, 0.44, 0.34, 0.05], [3.6, 3.0, 0.44, 0.4, 0.42, 0],
  ]));
  const vines = R.vineyard(1.5, 5);
  vines.position.set(5.5, 0, 3.5); vines.rotation.y = -0.35;
  town.add(vines);
  scene.add(town);

  // Постройките, които детето разглежда.
  const spots = new Map();
  const addSpot = (id, obj, x, z, ry = 0) => { obj.position.set(x, 0, z); obj.rotation.y = ry; obj.userData.pickId = id; addHitBox(obj, 1.0); scene.add(obj); spots.set(id, obj); return obj; };
  const theatre = addSpot('theatre', R.theatre(), T.x, T.z, T.ry);
  const amphi = addSpot('amphi', R.amphitheatre(), 3.3, -2.3, 0.25);
  const baths = addSpot('baths', R.baths(stillW), 2.9, 1.2);
  const villa = addSpot('villa', R.villa(R.waterMat({ opacity: 0.85 })), 5.0, 1.9, -0.35);
  const actors = [person('citizen', { scale: 0.42 }), person('woman', { scale: 0.42 })];
  actors.forEach((a, i) => { a.position.set(i ? 0.22 : -0.2, 0.1, 0.2); theatre.add(a); });
  const audience = R.theatreAudience(theatre.userData.rows);
  theatre.add(audience);
  const steamG = R.steam([[2.9, 0.2, 1.8], [2.6, 0.2, 1.8], [3.2, 0.2, 1.8], [2.9, 0.95, 0.54]]);
  scene.add(steamG);

  // Акведукт: от скалата с водопада до водната кула в града.
  const len = SRC.distanceTo(CITY);
  const yaw = -Math.atan2(CITY.z - SRC.z, CITY.x - SRC.x);
  const aq = R.aqueduct({ len, destH: DEST_H, water: flowW });
  aq.group.position.copy(SRC); aq.group.rotation.y = yaw;
  aq.group.userData.pickId = 'aqueduct';
  aq.setSource(SRC_START);
  addHitBox(aq.group, 1.0);
  scene.add(aq.group);
  spots.set('aqueduct', aq.group);
  const piers = aq.piers;
  const cliff = R.springCliff(fallW);
  cliff.position.copy(SRC); cliff.rotation.y = yaw;
  scene.add(cliff);

  // Дървета: кипариси в града, широколистни по хълмовете.
  const round = [];
  for (let i = 0; round.length < 46 && i < 400; i++) {
    const x = -13 + ((i * 0.618) % 1) * 24, z = -9 + ((i * 0.377) % 1) * 17;
    const inTown = x > -4.6 && x < 7.2 && z > -3.9;
    const corridor = x < -4.2 && z > -2.2; // оттук се гледа акведуктът
    const onMound = Math.hypot(x - T.x, z - T.z) < 2.6;
    const y = terrain.heightAt(x, z);
    if (inTown || corridor || onMound || y > 1.6 || Math.hypot(x - SRC.x, z - SRC.z) < 1.4) continue;
    round.push([x, y - 0.02, z, 0.9 + ((i * 0.71) % 1) * 0.9]);
  }
  scene.add(R.trees({
    round,
    cypress: [[4.05, 0, 2.95, 1], [5.9, 0, 2.6, 1.1], [6.15, 0, 1.4, 0.9], [4.2, 0, 0.75, 1], [3.95, 0, 0.3, 1.1], [1.95, 0, 0.35, 1], [1.95, 0, 2.2, 0.9],
      [-2.3, 0, 0.35, 1], [-2.3, 0, 2.9, 1.1], [1.15, 0, 0.5, 0.9], [1.15, 0, 2.8, 1], [5.2, 0, -2.6, 1.1], [5.5, 0, -2.2, 0.9], [-3.1, 0, -1.9, 1], [1.2, 0, -1.2, 1]],
  }));
  const cloudG = R.clouds(7);
  scene.add(cloudG);

  // Хора по улиците и на площада: вървят напред-назад между две точки.
  const walkers = [
    ['citizen', -2.6, -0.45, 0.9, -0.45], ['woman', 5.6, -0.42, 2.0, -0.48], ['slave', 1.6, -1.2, 1.6, 2.9], ['citizen', 1.62, 3.0, 1.58, 0.2],
    ['woman', -1.7, 1.1, 0.5, 1.2], ['citizen', 0.6, 2.4, -1.8, 2.3], ['foreigner', 4.75, -0.2, 4.75, 0.9], ['woman', -1.2, 2.9, 0.9, 2.95],
  ].map(([kind, x0, z0, x1, z1], i) => { const p = person(kind, { scale: 0.62 }); p.userData.path = { x0, z0, x1, z1, len: Math.hypot(x1 - x0, z1 - z0), ph: i * 0.37 }; scene.add(p); return p; });

  // Могилата, която векове покрива театъра (стъпка 4).
  const moundM = R.mound(2.3, 1.05);
  moundM.position.set(T.x, 0, T.z);
  moundM.scale.y = 0.001; moundM.visible = false;
  scene.add(moundM);
  // Прожектори за днешните представления.
  const beams = [-1, 1].map((sgn) => {
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.6, 16, 1, true).rotateX(Math.PI).translate(0, 1.3, 0),
      new THREE.MeshBasicMaterial({ color: 0xfff2c4, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    b.userData.noShadow = true;
    b.position.set(sgn * 0.85, 0.62, 0.47);
    b.userData.sgn = sgn;
    theatre.add(b);
    return b;
  });
  if (!weak) R.shade(scene);

  // Състояние на водата и на времето.
  let srcH = SRC_START, front = 1, supply = 1, onArrive = null;
  let buried = 0, buriedTo = 0, today = 0, todayTo = 0;
  let markers = [], hot = null;
  const colA = new THREE.Color(), colB = new THREE.Color();
  const mix = (a, b, k) => colA.setHex(a).lerp(colB.setHex(b), k);
  const flowing = () => srcH > DEST_H + 0.15;
  stage.tick((dt, t) => {
    // Вода: тръгва само ако изворът е над града; после пълни кулата, чешмата и термите.
    front = Math.min(1, Math.max(0, front + dt * (flowing() ? 0.7 + (srcH - DEST_H) : -1.6)));
    aq.setFront(front);
    const arrived = flowing() && front >= 1;
    supply = Math.min(1, Math.max(0, supply + dt * (arrived ? 0.8 : -0.5)));
    if (arrived && onArrive) { const fn = onArrive; onArrive = null; fn(); }
    aq.setTank(supply);
    flowW.map.offset.x = -t * (0.5 + Math.max(0, srcH - DEST_H) * 0.6);
    fallW.map.offset.y = t * 0.9;
    stillW.map.offset.set(Math.sin(t * 0.4) * 0.04, t * 0.02);
    stillW.opacity = 0.2 + 0.65 * supply;
    fount.userData.jets(t, supply);
    steamG.userData.update(t, supply);
    cloudG.userData.update(dt);
    // Хора, актьори, гладиатори.
    for (const p of walkers) {
      const w = p.userData.path, u = (t * 0.28 / w.len + w.ph) % 2, k = u < 1 ? u : 2 - u;
      p.position.set(w.x0 + (w.x1 - w.x0) * k, 0.02 + Math.abs(Math.sin(t * 6 + w.ph * 9)) * 0.025, w.z0 + (w.z1 - w.z0) * k);
      p.rotation.y = Math.atan2(w.x1 - w.x0, w.z1 - w.z0) + (u < 1 ? 0 : Math.PI);
    }
    actors.forEach((a, i) => { a.position.x = (i ? 0.22 : -0.2) + Math.sin(t * 0.7 + i * 2) * 0.14; a.rotation.y = Math.sin(t * 0.9 + i) * 0.6; });
    amphi.userData.gladiators.forEach((gl, i) => {
      const s = i ? 1 : -1, lunge = Math.max(0, Math.sin(t * 2.2 + i * Math.PI)) * 0.07;
      gl.position.set(s * (0.17 - lunge) + Math.sin(t * 0.5) * 0.12, 0.012 + lunge * 0.3, Math.cos(t * 0.5) * 0.1);
    });
    // Театърът потъва под пръстта и се разкрива отново.
    buried += Math.sign(buriedTo - buried) * Math.min(Math.abs(buriedTo - buried), dt / 2.4);
    const bk = buried * buried * (3 - 2 * buried);
    moundM.visible = bk > 0.002;
    moundM.scale.y = Math.max(bk, 0.001);
    theatre.position.y = -0.4 * bk;
    // „Днес“: залез, зрители, прожектори.
    today += Math.sign(todayTo - today) * Math.min(Math.abs(todayTo - today), dt / 2.2);
    skyDome.userData.uniforms.top.value.copy(mix(DAY.top, DUSK.top, today));
    skyDome.userData.uniforms.bottom.value.copy(mix(DAY.bottom, DUSK.bottom, today));
    scene.fog.color.copy(colA);
    stage.sun.color.copy(mix(DAY.sun, DUSK.sun, today));
    stage.sun.intensity = DAY.sunI + (DUSK.sunI - DAY.sunI) * today;
    stage.hemi.intensity = DAY.hemi + (DUSK.hemi - DAY.hemi) * today;
    audience.userData.show(today);
    beams.forEach((b) => { b.material.opacity = 0.16 * today; b.visible = today > 0.01; b.rotation.set(Math.sin(t * 0.6 + b.userData.sgn) * 0.2, 0, -b.userData.sgn * (0.3 + Math.sin(t * 0.8) * 0.2)); });
    // Показалци над постройките при подреждането.
    for (const m of markers) { m.position.y = m.userData.y + Math.sin(t * 3 + m.userData.y * 7) * 0.05; const s = m === hot ? 1.6 : 1; m.scale.lerp(colScale.set(s, s, s), 0.25); }
  });
  const colScale = new THREE.Vector3();

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 1.3, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  let tags = [];
  const clearTags = () => { tags.forEach((b) => b.remove()); tags = []; };
  const scores = [];
  let menu = null, clickHandler = null, stopDrag = null, stopHover = null;
  const extra = [];
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  // Най-добрият изглед към всяка постройка: [цел, отместване на камерата, височина на балончето].
  const SHOW = {
    theatre: [[T.x + 0.2, 0.8, T.z - 0.7], [-3.7, 3.1, 1.3], 1.5],
    amphi: [[3.3, 0.5, -2.3], [0.6, 2.9, 4.2], 1.05],
    baths: [[2.9, 0.5, 1.3], [-1.6, 2.5, 3.6], 1.3],
    aqueduct: [[-3.75, 1.1, -0.6], [-3.6, 1.6, 4.4], 2.3],
    villa: [[5.0, 0.3, 1.9], [-1.0, 2.6, 3.0], 0.95],
  };

  function step1() {
    shell.step(0);
    scores.length = 0;
    shell.task('Разгледай римския град. Избери всяка постройка от менюто или кликни върху нея.');
    const seen = new Set();
    const open = (id) => {
      const s = SPOTS.find((x) => x.id === id);
      if (!s) return;
      const [tgt, off, lift] = SHOW[id];
      look(tgt, off);
      say(id === 'aqueduct' ? piers[3] : spots.get(id), `<b>${esc(s.label)}</b><br>${esc(s.note)}`, { cls: 'wide', lift });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${SPOTS.length}`);
      if (seen.size === SPOTS.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: SPOTS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })), onSelect: open });
    clickHandler = open;
    stopHover = stage.onHover(() => {});
    shell.setControls('');
  }

  function step2() {
    shell.step(1);
    shell.score('');
    clickHandler = null;
    if (stopHover) { stopHover(); stopHover = null; stage.renderer.domElement.style.cursor = ''; }
    look([-3.6, 1.0, -0.4], [-5.4, 1.5, 3.0]);
    // Опитът започва с нисък извор: каналът се изкачва към града и водата спира.
    srcH = SRC_LOW; aq.setSource(srcH);
    tags = [stage.bubble(aq.trough, 'Изворът', { cls: 'tag', lift: 0.45 }), stage.bubble(aq.tower, 'Градът', { cls: 'tag', lift: DEST_H + 0.55 })];
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
      const cc = shell.setControls(`<label class="small">Височина на извора</label><input class="h-range" type="range" min="0.2" max="2.2" step="0.05" value="${SRC_LOW}" style="width:100%">`);
      const r = cc.querySelector('.h-range');
      let state = 'low', done = false;
      r.addEventListener('input', () => {
        srcH = +r.value;
        aq.setSource(srcH);
        const now = flowing() ? 'flow' : srcH < DEST_H - 0.15 ? 'low' : 'level';
        if (now === state) return;
        state = now;
        if (done) return;
        if (now === 'low') shell.msg('Изворът е по-ниско от града. Водата не може да се изкачи.', 'bad');
        else if (now === 'level') shell.msg('Каналът е почти равен. Водата стои на място.', '');
        else {
          shell.msg('Водата тръгна надолу по канала!', 'good');
          onArrive = () => {
            done = true;
            scores.push(stepScore(mistakes, 1));
            say(aq.tower, 'Водата тече! Каналът се спуска леко надолу към града. Чешмата на площада заработи.', { cls: 'good wide', lift: DEST_H + 0.6 });
            clearTags();
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
          };
        }
      });
    }
  }

  // Точка от сцената в пиксели на платното.
  const pv = new THREE.Vector3();
  const toScreen = (v) => { pv.copy(v).project(stage.camera); const el = stage.renderer.domElement; return [(pv.x * 0.5 + 0.5) * el.clientWidth, (-pv.y * 0.5 + 0.5) * el.clientHeight]; };
  const TARGETS = ['theatre', 'amphi', 'baths', 'aqueduct'];
  const topOf = { theatre: 1.2, amphi: 0.95, baths: 1.2, aqueduct: 0 };
  function anchors(id) {
    if (id === 'aqueduct') return piers.filter((_, i) => i % 2 === 1).map((p) => { const w = p.getWorldPosition(new THREE.Vector3()); w.y = p.scale.y * 0.6; return w; });
    const p = spots.get(id).position;
    return [new THREE.Vector3(p.x, 0.35, p.z)];
  }
  // Постройката, над която е картата: мери се на екрана, както я вижда детето.
  function targetUnder(obj) {
    const [cx, cy] = toScreen(obj.position);
    const lim = stage.renderer.domElement.clientHeight * 0.17;
    let best = null, bd = lim;
    for (const id of TARGETS) for (const a of anchors(id)) { const [x, y] = toScreen(a); const d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = id; } }
    return best;
  }

  function step3() {
    shell.step(2);
    clearTags();
    stage.flyTo(VIEW[0], VIEW[1], 1.2);
    let mistakes = 0, placed = 0;
    const done = new Set();
    markers = TARGETS.map((id) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 10).rotateX(Math.PI), mat(0xf2b632, { emissive: 0x7a4a00, roughness: 0.4 }));
      const p = id === 'aqueduct' ? piers[3].getWorldPosition(new THREE.Vector3()) : spots.get(id).position;
      m.userData = { id, y: id === 'aqueduct' ? srcH + 0.55 : topOf[id] };
      m.position.set(p.x, m.userData.y, p.z);
      scene.add(m); extra.push(m);
      return m;
    });
    USES.forEach((u, i) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.5), mat(0xfff6dc));
      const rim = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.05, 0.58), mat(0xb9583a));
      rim.position.y = -0.03;
      const l = labelSprite(u.label, { size: 0.25 }); l.position.y = 0.32;
      g.add(rim, b, l);
      g.position.set(-3.3 + i * 2.3, 0.1, 4.2);
      g.userData = { dragId: u.id, home: g.position.clone() };
      addHitBox(g, 0.6);
      scene.add(g); extra.push(g);
    });
    shell.task('За какво служи всяка постройка? Завлечи всяка карта до своята постройка.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${USES.length}`);
    const markerOf = (id) => markers.find((m) => m.userData.id === id && !done.has(id)) || null;
    stopDrag = stage.enableDrag({
      planeY: 0.1,
      onMove(obj) { hot = markerOf(targetUnder(obj)); },
      onDrop(obj) {
        hot = null;
        const u = USES.find((x) => x.id === obj.userData.dragId);
        const best = targetUnder(obj);
        if (!best) { obj.position.copy(obj.userData.home); return; }
        if (best === u.target) {
          obj.userData.locked = true;
          const m = markerOf(best);
          obj.position.set(m.position.x, m.userData.y + 0.1, m.position.z);
          m.visible = false; done.add(best);
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
    for (const o of extra) scene.remove(o);
    extra.length = 0; markers = [];
    look([T.x + 0.2, 0.9, T.z - 0.2], [-3.7, 3.2, 1.2], 1.4);
    buriedTo = 1; // вековете минават: пръстта покрива театъра
    actors.forEach((a) => { a.visible = false; });
    tags = [stage.bubble(theatre, 'Векове по-късно', { cls: 'tag', lift: 1.5 })];
    let mistakes = 0, solved = false;
    shell.task('Античният театър в Пловдив е затрупан от земя векове наред. Ако го разкопаят и възстановят, <b>за какво ще се използва днес?</b>');
    const c = shell.setControls(`<div class="col">${PREDICT.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (solved) return;
      const p = PREDICT[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      solved = true;
      scores.push(stepScore(mistakes, 2));
      // Разкопките: пръстта се отдръпва, театърът излиза; идва вечерта на днешно представление.
      buriedTo = 0; todayTo = 1;
      actors.forEach((a) => { a.visible = true; });
      clearTags();
      say(theatre, '<b>Така и става.</b> Театърът е открит и възстановен през ХХ век. Днес в него отново има представления и концерти — почти 2000 години по-късно!', { cls: 'good wide', lift: 1.7 });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => { clearTip(); shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart); });
    }));
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    if (stopHover) { stopHover(); stopHover = null; }
    clearTip(); clearTags();
    for (const o of extra) scene.remove(o);
    extra.length = 0; markers = []; hot = null;
    srcH = SRC_START; aq.setSource(srcH); onArrive = null;
    buriedTo = 0; todayTo = 0;
    actors.forEach((a) => { a.visible = true; });
    if (menu) menu.remove();
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  step1();
  stage.flyTo(VIEW[0], VIEW[1], 2.4); // начален полет над града
  container.__demo = { stage, piers, spots };
  return { dispose() { if (stopDrag) stopDrag(); if (stopHover) stopHover(); if (menu) menu.remove(); stage.dispose(); } };
}
