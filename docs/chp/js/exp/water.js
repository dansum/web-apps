// 5.2.6 „Опазване чистотата на водата“ — домашен филтър, макет на пречиствателна станция, езеро до наторено поле, чешма.
// Стъпки: опознай → филтър за мътна вода (опит) → пречиствателната станция и замърсителите → торовете и езерото.
import { labelSprite, mat, addHitBox, shuffle, THREE } from '../kit.js';
import { scaffold, explore, choice, predict, compare, nextBtn, finishBtn, labRoom, glass, view, stepScore } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';

const SAFE = '<p class="warn">⚠ Филтрираната вода <b>не се пие</b>: в нея може да има микроби и разтворени вещества.</p>';
const LAYERS = [
  { t: 'чакъл', c: 0x8d8d8d },
  { t: 'едър пясък', c: 0xc9a46a },
  { t: 'ситен пясък', c: 0xe6cf98 },
  { t: 'активен въглен', c: 0x262626 },
  { t: 'памук', c: 0xfafafa },
];
const STAGES = [
  { t: 'Решетки задържат едрите отпадъци.', name: 'решетки' },
  { t: 'Пясъкът и тинята се утаяват на дъното.', name: 'утаител' },
  { t: 'Полезни бактерии разграждат замърсителите (въздухът им помага).', name: 'биологично пречистване' },
  { t: 'Бактериите и остатъците се утаяват отново.', name: 'втори утаител' },
  { t: 'Пречистената вода се връща в реката.', name: 'река' },
];
const FX = -4.6; // филтърът

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Филтър за мътна вода', 'Пречиствателна станция', 'Езерото и торовете'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4.5, 10.5], target: [0, 0.6, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14.5, d: 5 });
  const tag = (g, t, y, s = 0.2) => { const l = labelSprite(t, { size: s }); l.position.y = y; g.add(l); stage.steadyLabel(l, 8); return l; };
  const waterM = (c, o = 0.6) => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: o, depthWrite: false });

  // ---------- Филтър ----------
  const filt = new THREE.Group();
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.4, 24, 1, true), glass(0.25)); bottle.position.y = 1.75;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.08, 0.3, 24, 1, true), glass(0.3)); neck.position.y = 0.9;
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.4, 0.75, 24, 1, true), glass(0.25)); cup.position.y = 0.375;
  const cupBottom = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), glass(0.4)); cupBottom.rotation.x = -Math.PI / 2; cupBottom.position.y = 0.01;
  filt.add(bottle, neck, cup, cupBottom);
  const layerMeshes = LAYERS.map((L, i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 24), mat(L.c, { roughness: 0.95 }));
    m.position.y = 2.25 - i * 0.2; m.visible = false; filt.add(m); return m;
  });
  const clean = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1, 24), waterM(0xc8b88a, 0.55)); clean.scale.y = 0.001; clean.position.y = 0.01; filt.add(clean);
  const drip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), waterM(0xd7e9f5, 0.9)); drip.visible = false; filt.add(drip);
  const muddyTop = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.25, 24), waterM(0x6d4c2f, 0.8)); muddyTop.position.y = 2.6; muddyTop.visible = false; filt.add(muddyTop);
  filt.position.set(FX, 0, 0.1);
  filt.userData.pickId = 'filter';
  tag(filt, 'филтър', 2.75);
  scene.add(filt); addHitBox(filt, 0.6);
  const jug = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.7, 20), glass(0.3)); b.position.y = 0.35; const w = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.23, 0.55, 20), waterM(0x6d4c2f, 0.85)); w.position.y = 0.28; jug.add(b, w); }
  jug.position.set(FX - 1.1, 0, 0.6); tag(jug, 'мътна вода', 0.95); scene.add(jug);
  const F = { level: 0, run: false };

  // ---------- Пречиствателна станция ----------
  const plant = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 1.8), mat(0x9ccc65)); base.position.set(0, 0.06, 0); plant.add(base);
  const river = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 1.8), waterM(0x4fc3f7, 0.85)); river.position.set(2.3, 0.14, 0); plant.add(river);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 12), mat(0x78909c)); pipe.rotation.z = Math.PI / 2; pipe.position.set(-2.55, 0.35, 0); plant.add(pipe);
  const tanks = [];
  const mkTank = (x, kind) => {
    const g = new THREE.Group();
    let shell;
    if (kind === 'grid') {
      shell = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.7), mat(0xb0bec5));
      for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), mat(0x37474f)); b.position.set(0.31, 0.03, -0.25 + i * 0.1); g.add(b); }
    } else if (kind === 'aer') {
      shell = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.4, 0.9), mat(0xb0bec5));
    } else {
      shell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.4, 24), mat(0xb0bec5));
    }
    const top = kind === 'aer' ? new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.02, 0.82), waterM(0x8d6e63, 0.9)) : kind === 'grid' ? new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.02, 0.64), waterM(0x6d4c2f, 0.9)) : new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.02, 24), waterM(0x8d6e63, 0.9));
    top.position.y = 0.21;
    g.add(shell, top);
    g.position.set(x, 0.32, 0);
    g.userData.top = top;
    plant.add(g); tanks.push(g);
    return g;
  };
  mkTank(-1.85, 'grid'); mkTank(-0.85, 'set'); mkTank(0.35, 'aer'); mkTank(1.45, 'set');
  const waterCols = [0x5d4037, 0x795548, 0x8d9e7a, 0x9ccbe0];
  tanks.forEach((tk, i) => tk.userData.top.material.color.set(waterCols[i]));
  const bubbles = [];
  for (let i = 0; i < 20; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); b.userData.k = Math.random(); b.userData.x = (Math.random() - 0.5) * 0.8; b.userData.z = (Math.random() - 0.5) * 0.7; plant.add(b); bubbles.push(b); }
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd54a })); glowRing.rotation.x = Math.PI / 2; glowRing.visible = false; plant.add(glowRing);
  plant.position.set(2.9, 0, 0.1);
  plant.userData.pickId = 'plant';
  tag(plant, 'пречиствателна станция', 1.15);
  scene.add(plant); addHitBox(plant, 1);
  const pipeAt = new THREE.Object3D(); pipeAt.position.set(2.9 - 2.55, 0.4, 0.1); scene.add(pipeAt);
  pipeAt.userData.pickId = 'pipe';
  { const h = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.4), new THREE.MeshBasicMaterial({ visible: false })); pipeAt.add(h); }
  const flowPts = [[-2.9, 0.4, 0], [-1.85, 0.5, 0], [-0.85, 0.5, 0], [0.35, 0.5, 0], [1.45, 0.5, 0], [2.3, 0.2, 0]].map((p) => new THREE.Vector3(...p));
  const flowCurve = new THREE.CatmullRomCurve3(flowPts);
  const drops = [];
  for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), new THREE.MeshBasicMaterial({ color: 0x5d4037 })); d.userData.k = i / 26; plant.add(d); drops.push(d); }
  const PL = { stage: 5 };

  // ---------- Езеро до наторено поле ----------
  // mkLake — езеро с поле, риби, водорасли и капки тор при дъжд. strip — ивица дървета между полето и езерото.
  const mkLake = () => {
    const g = new THREE.Group();
    const w = new THREE.Mesh(new THREE.CircleGeometry(1.1, 36), waterM(0x29b6f6, 0.9)); w.rotation.x = -Math.PI / 2; w.position.y = 0.03; g.add(w);
    const al = new THREE.Mesh(new THREE.CircleGeometry(1.08, 36), new THREE.MeshStandardMaterial({ color: 0x7cb342, transparent: true, opacity: 0, depthWrite: false })); al.rotation.x = -Math.PI / 2; al.position.y = 0.04; g.add(al);
    const fl = new THREE.Group();
    for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.1), mat(i % 2 ? 0xc0ca33 : 0x8d6e63)); r.position.set(0, 0.03, -0.35 + i * 0.12); fl.add(r); }
    fl.position.set(-2.0, 0, 0); g.add(fl);
    const fs = [];
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Group();
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0xff8f00)); b.scale.set(1.7, 0.8, 0.6);
      const tl = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 6), mat(0xff8f00)); tl.rotation.z = Math.PI / 2; tl.position.x = -0.14;
      f.add(b, tl); f.userData.k = i * 2.1; g.add(f); fs.push(f);
    }
    const ro = [];
    for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0xcddc39 })); d.visible = false; d.userData.k = i / 14; g.add(d); ro.push(d); }
    const strip = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.14, 6), mat(0x6d4c41)); tr.position.set(0, 0.07, -0.4 + i * 0.2);
      const cr = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 8), mat(0x2e7d32)); cr.position.set(0, 0.26, -0.4 + i * 0.2);
      strip.add(tr, cr);
    }
    strip.position.set(-1.2, 0, 0); strip.visible = false; g.add(strip);
    return { g, algae: al, fish: fs, runoff: ro, strip, st: { fert: 0, shown: 0, rain: false } };
  };
  const L1 = mkLake();
  const lake = L1.g;
  const fieldAt = new THREE.Object3D(); fieldAt.position.set(-2.0, 0.2, 0); lake.add(fieldAt);
  const oil = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, metalness: 0.6, roughness: 0.2, transparent: true, opacity: 0.85 }));
  oil.rotation.x = -Math.PI / 2; oil.position.set(0.55, 0.05, 0.45); oil.scale.set(1.3, 0.8, 1); lake.add(oil);
  const oilAt = new THREE.Object3D(); oilAt.position.set(0.55, 0.1, 0.45); lake.add(oilAt);
  lake.position.set(-1.0, 0, -1.6);
  scene.add(lake);
  lake.userData.pickId = 'lake';
  fieldAt.userData.pickId = 'field';
  { const h = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.9), new THREE.MeshBasicMaterial({ visible: false })); fieldAt.add(h); }
  oilAt.userData.pickId = 'oil';
  { const h = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.5), new THREE.MeshBasicMaterial({ visible: false })); oilAt.add(h); }
  const lakeAt = new THREE.Object3D(); lakeAt.position.set(-1.0, 0.2, -1.6); scene.add(lakeAt);
  const L = L1.st;
  // Второто езеро е само за сравнението „Без мярка“ / „С мярка“ (решение 30).
  const L2 = mkLake();
  L2.g.position.set(3.4, 0, -1.6); L2.g.visible = false; scene.add(L2.g);
  const L2At = new THREE.Object3D(); L2At.position.set(3.4, 0.2, -1.6); scene.add(L2At);
  const tagNo = labelSprite('Без мярка', { size: 0.24 }); tagNo.position.set(-1.0, 0.3, -0.25); tagNo.visible = false; scene.add(tagNo); stage.steadyLabel(tagNo, 9);
  const tagYes = labelSprite('С мярка', { size: 0.24 }); tagYes.position.set(3.4, 0.3, -0.25); tagYes.visible = false; scene.add(tagYes); stage.steadyLabel(tagYes, 9);

  // ---------- Чешма ----------
  const tap = new THREE.Group();
  {
    const sink = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.6), mat(0xeceff1)); sink.position.y = 0.15;
    const pipeV = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 10), mat(0xb0bec5, { metalness: 0.7 })); pipeV.position.set(0, 0.55, -0.2);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10), mat(0xb0bec5, { metalness: 0.7 })); spout.rotation.x = Math.PI / 2; spout.position.set(0, 0.82, -0.06);
    tap.add(sink, pipeV, spout);
  }
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), waterM(0x81d4fa, 0.8)); stream.position.set(0, 0.55, 0.08); tap.add(stream);
  tap.position.set(-6.2, 0, -1.3);
  tap.userData.pickId = 'tap';
  tag(tap, 'чешма', 1.1);
  scene.add(tap); addHitBox(tap, 0.6);

  stage.tick((dt, t) => {
    // филтър
    if (F.run) {
      F.level = Math.min(0.5, F.level + dt * 0.06);
      drip.visible = true;
      const k = (t * 2.2) % 1; drip.position.set(0, 0.85 - k * (0.8 - F.level), 0);
    } else drip.visible = false;
    clean.scale.y = Math.max(0.001, F.level); clean.position.y = F.level / 2 + 0.01;
    // станцията
    drops.forEach((d) => {
      const k = (d.userData.k + t * 0.06) % 1;
      flowCurve.getPointAt(k, d.position);
      const seg = Math.min(4, Math.floor(k * 5));
      d.visible = seg < PL.stage || PL.stage >= 5;
      d.material.color.set(waterCols[Math.min(3, Math.max(0, seg - 1))] ?? 0x5d4037);
      if (k > 0.9) d.material.color.set(0x4fc3f7);
    });
    bubbles.forEach((b) => { const k = (b.userData.k + t * 0.5) % 1; b.position.set(0.35 + b.userData.x, 0.3 + k * 0.26, b.userData.z); });
    // езерата
    for (const LK of [L1, L2]) {
      const S = LK.st;
      S.shown += (S.fert - S.shown) * Math.min(1, dt * 0.6);
      LK.algae.material.opacity = Math.min(0.92, S.shown * 0.9);
      // fresh: новопуснати риби — живи в началото, после се задушават (решение 24).
      if (S.fresh) S.fresh = Math.max(0, S.fresh - dt * 0.45);
      const ok = Math.max(1 - Math.max(0, S.shown - 0.55) / 0.45, S.fresh || 0);
      LK.fish.forEach((f) => {
        const a = t * 0.4 * Math.max(0.05, ok) + f.userData.k;
        const r = 0.45 + f.userData.k * 0.08;
        f.position.set(Math.cos(a) * r, 0.0 + (1 - ok) * 0.08, Math.sin(a) * r * 0.7);
        f.rotation.y = -a - Math.PI / 2;
        f.children.forEach((c) => c.material.color.setRGB(1 * ok + 0.6 * (1 - ok), 0.56 * ok + 0.6 * (1 - ok), 0.6 * (1 - ok)));
        f.visible = true;
      });
      // При ивица дървета повечето капки тор спират в нея (стигат само до x = −1.25).
      LK.runoff.forEach((d) => {
        d.visible = S.rain;
        const k = (d.userData.k + t * 0.35) % 1;
        const x = -2.0 + k * 1.4;
        const stop = LK.strip.visible && d.userData.k > 0.2;
        d.position.set(stop ? Math.min(x, -1.3) : x, 0.06, -0.3 + (d.userData.k - 0.5) * 0.6);
      });
    }
    stream.scale.y = 1 + Math.sin(t * 20) * 0.03;
    oil.rotation.z = Math.sin(t * 0.3) * 0.2;
    glowRing.scale.setScalar(1 + Math.sin(t * 4) * 0.05);
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    LAYERS.forEach((_, i) => { layerMeshes[i].visible = false; });
    F.level = 0; F.run = false; muddyTop.visible = false;
    PL.stage = 5; glowRing.visible = false;
    L.fert = 0; L.shown = 0; L.rain = false; L.fresh = 0;
    L1.strip.visible = false; L2.g.visible = false; tagNo.visible = false; tagYes.visible = false; plant.visible = true;
    (ctx.bubbles2 || []).forEach((b) => b.remove()); ctx.bubbles2 = null;
    view(ctx, [-0.5, 0.8, -0.2], 6.8, { halfH: 2 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Без чиста вода няма живот. Какво замърсява водата и как да я пречистим?</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'pipe', label: 'Тръба с отпадни води', icon: '🚰', note: 'От домовете и заводите излизат <b>отпадни води</b>: с остатъци от храна, препарати, масла и микроби. Те не бива да стигат до реката непречистени.', obj: () => pipeAt, dist: 3 },
        { id: 'plant', label: 'Пречиствателна станция', icon: '🏭', note: 'В <b>пречиствателната станция</b> отпадните води се очистват на няколко етапа, преди да се върнат в реката.', obj: () => plant, dist: 5, bubble: 1.3 },
        { id: 'field', label: 'Наторено поле', icon: '🌾', note: 'Торовете помагат на растенията. Но когато дъждът ги отмие в езерото, те вредят.', obj: () => fieldAt, dist: 3 },
        { id: 'oil', label: 'Петно от нефт', icon: '🛢', note: '<b>Нефтът</b> не се разтваря във вода. Той покрива повърхността като ципа и вреди на птиците и рибите.', obj: () => oilAt, dist: 2.6 },
        { id: 'filter', label: 'Домашен филтър', icon: '🧪', note: 'Пластмасова бутилка без дъно, обърната над чаша. В нея ще сложим слоеве, през които да прецедим мътна вода.', obj: () => filt, dist: 3.4, lift: 1.2, bubble: 1.8 },
        { id: 'tap', label: 'Чешма', icon: '🚿', note: '<b>Питейната вода</b> е бистра, без мирис и без опасни микроби. Тя е пречистена и <b>обеззаразена</b>, често с хлор. После я проверяват.', obj: () => tap, dist: 2.8 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Филтър ----------
  function step2() {
    shell.step(1);
    view(ctx, [FX - 0.4, 1.45, 0.1], 1.4, { halfH: 1.65, elev: 0.15 });
    shell.task(`<p>Ще прецедим мътна вода през домашен филтър.</p>${SAFE}`);
    let mistakes = 0;
    // Решение 21: отворена прогноза — опитът тръгва с каквото детето е избрало, после сравнение.
    predict(ctx, {
      q: 'Каква ще бъде водата след филтъра?',
      options: [
        { t: 'По-бистра, но не е сигурно, че е годна за пиене.', ok: true },
        { t: 'Чиста и годна за пиене.', ok: false },
        { t: 'Същата като преди.', ok: false },
      ],
      onPick: () => { mistakes = ctx.predMiss || 0; nextBtn(ctx, 'Напълни филтъра →', build); },
    });
    // Детето само избира реда на слоевете. Грешният ред дава по-лош резултат и се подрежда отново.
    let wrongBuilds = 0;
    function build() {
      const order = [];
      LAYERS.forEach((_, i) => { layerMeshes[i].visible = false; });
      F.level = 0; F.run = false; muddyTop.visible = false;
      clean.material.color.set(0xc8b88a);
      const c = shell.setControls(`<p><b>Напълни филтъра: избери слоевете отгоре надолу. Водата минава първо през най-горния слой.</b></p><ol class="small ord-done"></ol>
        <div class="choices">${shuffle(LAYERS.map((_, i) => i)).map((i) => `<button class="choice ord" data-i="${i}">${LAYERS[i].t}</button>`).join('')}</div>`);
      const done = c.querySelector('.ord-done');
      c.querySelectorAll('.ord').forEach((btn) => btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const i = +btn.dataset.i;
        btn.disabled = true; btn.style.display = 'none';
        layerMeshes[i].position.y = 2.25 - order.length * 0.2;
        layerMeshes[i].visible = true;
        order.push(i);
        done.insertAdjacentHTML('beforeend', `<li>${LAYERS[i].t}</li>`);
        if (order.length === LAYERS.length) pourBtn(order);
      }));
    }
    function pourBtn(order) {
      const c = shell.controls;
      c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary pour">🫗 Налей мътната вода</button></div>');
      c.querySelector('.pour').addEventListener('click', () => {
        c.querySelector('.pour').disabled = true;
        const cottonLast = order[order.length - 1] === 4;
        const grains = order.indexOf(0) < order.indexOf(1) && order.indexOf(1) < order.indexOf(2);
        muddyTop.visible = true; F.run = true;
        if (cottonLast && grains) {
          setTimeout(() => {
            F.run = false; muddyTop.visible = false;
            clean.material.color.set(0xd6e6ee);
            ctx.say(filt, 'Водата е <b>по-бистра</b>: чакълът и пясъкът задържаха частиците, а <b>активният въглен</b> (въглен с много мънички пори) — част от цвета и мириса. Но в нея може да има <b>микроби</b> — не я пий!', 'wide', 2.0);
            ctx.scores[0] = stepScore(mistakes, 3);
            compare(ctx, {
              result: 'Водата стана по-бистра. Частиците останаха в слоевете.',
              why: 'Филтърът задържа песъчинките и калта. Микробите са толкова малки, че минават през пясъка. Затова тази вода не се пие.',
            });
            nextBtn(ctx, 'Напред →', step3);
          }, 4500);
          return;
        }
        mistakes++; wrongBuilds++;
        const hint = wrongBuilds >= 2 ? ' Подсказка: най-отгоре е чакълът, най-отдолу — памукът.' : '';
        const why = !cottonLast
          ? 'Памукът не е най-отдолу. Пясъкът и въгленът се отмиха през гърлото в чашата. Водата е <b>мътна</b>.'
          : 'По-ситен слой е над по-едър. Калта бързо запуши ситния пясък и водата <b>едва минава</b>.';
        if (!cottonLast) clean.material.color.set(0x7a5f3c);
        setTimeout(() => {
          F.run = false;
          if (!cottonLast) muddyTop.visible = false;
          ctx.say(filt, why, 'wide bad', 2.0);
          shell.msg('Този ред не става. Подреди слоевете отново.' + hint, 'bad');
          c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn again-build">🔄 Подреди отново</button></div>');
          c.querySelector('.again-build').addEventListener('click', () => { ctx.clearTip(); build(); }, { once: true });
        }, cottonLast ? 1500 : 4500);
      }, { once: true });
    }
  }

  // ---------- 3. Пречиствателна станция ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    PL.stage = 0;
    view(ctx, [2.9, 0.4, 0.1], 2.9, { halfH: 1.0, elev: 0.6 });
    shell.task('<p>Отпадните води от града влизат в станцията.</p><p class="small"><b>Утаител</b> е голям басейн. В него неразтворените частици падат на дъното. <b>Биологично пречистване</b> значи, че водата се чисти от живи организми — бактерии.</p>');
    const at = [-1.85, -0.85, 0.35, 1.45, 2.3];
    orderTask(ctx, {
      q: 'Подреди етапите на пречистване по реда, в който минава водата.',
      items: STAGES.map((S) => S.t),
      hint: 'Първо се махат най-едрите неща, накрая водата отива в реката.',
      onPick: (i) => { PL.stage = i + 1; glowRing.visible = true; glowRing.position.set(at[i], 0.62, 0); ctx.say(glowRing, STAGES[i].name, 'tag', 0.15); },
      onDone: (m) => {
        glowRing.visible = false; PL.stage = 5;
        ctx.clearTip();
        view(ctx, [-1.0, 0.3, -1.5], 2.4, { halfH: 1.0, elev: 0.7 });
        shell.task('<p>Какво причинява всеки замърсител?</p>');
        sortTask(ctx, {
          bins: ['Водораслите плъзват, рибите се задушават', 'Покрива водата; птиците и рибите загиват', 'Микроби: заразни болести', 'Отрови се трупат в рибите и в човека'],
          items: [
            { t: 'Торове, отмити от нивите', bin: 0, why: 'Торовете хранят водораслите и те плъзват. Когато загинат, гниенето им изразходва кислорода във водата.' },
            { t: 'Нефт и машинно масло', bin: 1, why: 'Нефтът покрива водата и перата на птиците.' },
            { t: 'Непречистени отпадни води от домовете', bin: 2, why: 'В тях има микроби, които причиняват болести.' },
            { t: 'Тежки метали от заводи', bin: 3, why: 'Тежките метали, като живака и оловото, са отровни. Те се натрупват в рибите, а после — в хората, които ги ядат.' },
          ],
          hint: 'Помисли какво прави всяко вещество във водата.',
          mistakes: m,
          onDone: (m2) => { ctx.scores[1] = stepScore(m2, 3); shell.msg('Браво!', 'good'); nextBtn(ctx, 'Напред →', step4); },
        });
      },
    });
  }

  // ---------- 4. Езерото и торовете ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    L.fert = 0;
    view(ctx, [-1.8, 0.3, -1.6], 2.2, { halfH: 1.0, elev: 0.75 });
    shell.task('<p>Фермерът е сложил много торове на полето до езерото. Задава се дъжд.</p>');
    let mistakes = 0;
    predict(ctx, {
      q: 'Какво ще стане с езерото, ако дъждът отмие торовете в него?',
      options: [
        { t: 'Водораслите ще се размножат, кислородът ще намалее и рибите ще загинат.', ok: true },
        { t: 'Рибите ще пораснат по-големи от торовете.', ok: false },
        { t: 'Нищо: торовете ще потънат на дъното.', ok: false },
      ],
      onPick: () => {
        mistakes = ctx.predMiss || 0;
        const c = shell.controls;
        c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary rain">🌧 Пусни дъжда</button></div>');
        c.querySelector('.rain').addEventListener('click', () => {
          c.querySelector('.rain').disabled = true;
          L.rain = true; L.fert = 1;
          setTimeout(() => {
            L.rain = false;
            ctx.say(lakeAt, 'Водораслите покриха езерото. Когато загиват, разграждането им изразходва кислорода във водата и рибите се задушават.', 'wide', 0.6);
            compare(ctx, {
              result: 'Езерото позеленя от водорасли, а рибите се задушиха.',
              why: 'Торовете се разтварят във водата и хранят водораслите. Те плъзват. Когато загиват, гниенето им изразходва кислорода.',
            });
            nextBtn(ctx, 'Как да помогнем? →', measures);
          }, 4500);
        }, { once: true });
      },
    });
    // Решение 24: три действия с различни последствия, всяко се вижда в сцената.
    function measures() {
      const MS = [
        { id: 'fish', t: '🐟 Пусни нови риби в езерото', ok: false },
        { id: 'clean', t: '🧹 Изгребай водораслите веднъж', ok: false },
        { id: 'fix', t: '🌳 Торове умерено + ивица дървета до брега', ok: true },
      ];
      const cc = shell.setControls(`<p><b>Как да помогнем на езерото? Опитай и виж какво става.</b></p><div class="choices">${shuffle(MS.map((_, i) => i)).map((i) => `<button class="choice fix-m ${MS[i].id === 'fix' ? 'fix' : ''}" data-m="${MS[i].id}">${MS[i].t}</button>`).join('')}</div>`);
      let busy = false;
      cc.querySelectorAll('.fix-m').forEach((b) => b.addEventListener('click', () => {
        if (busy || b.disabled) return;
        const m = b.dataset.m;
        if (m === 'fix') {
          busy = true;
          cc.querySelectorAll('.fix-m').forEach((x) => { x.disabled = true; });
          b.classList.add('right');
          L.fert = 0.15; L1.strip.visible = true;
          ctx.say(lakeAt, '✔ Ивица дървета и храсти задържа торовете. Езерото постепенно се възстановява.', 'good wide', 0.6);
          shell.msg('Тази мярка спира причината — торовете.', 'good');
          setTimeout(twoLakes, 2200);
          return;
        }
        mistakes++;
        b.disabled = true; b.classList.add('wrong');
        busy = true;
        if (m === 'fish') {
          L.fresh = 1;
          ctx.say(lakeAt, 'Новите риби плуват… но във водата пак няма достатъчно кислород. И те се задушават.', 'wide bad', 0.6);
          shell.msg('Водораслите и торовете останаха. Причината не е махната.', 'bad');
          setTimeout(() => { busy = false; }, 2500);
        } else {
          L.fert = 0; L.shown = 0;
          ctx.say(lakeAt, 'Водата за малко е бистра…', 'wide', 0.6);
          setTimeout(() => {
            L.rain = true; L.fert = 1;
            ctx.say(lakeAt, 'Дойде нов дъжд. Торовете пак стигнаха до езерото и водораслите отново плъзнаха.', 'wide bad', 0.6);
            shell.msg('Торовете на полето останаха. Причината не е махната.', 'bad');
            setTimeout(() => { L.rain = false; busy = false; }, 3000);
          }, 1800);
        }
      }));
    }
    // Решение 30: двете езера едно до друго след един и същ дъжд — „Без мярка“ и „С мярка“.
    function twoLakes() {
      ctx.clearTip();
      plant.visible = false;
      L1.strip.visible = false; L2.strip.visible = true; L2.g.visible = true;
      Object.assign(L1.st, { fert: 0, shown: 0, rain: false, fresh: 0 });
      Object.assign(L2.st, { fert: 0, shown: 0, rain: false, fresh: 0 });
      tagNo.visible = true; tagYes.visible = true;
      view(ctx, [1.2, 0.3, -1.6], 4.7, { halfH: 1.2, elev: 0.7 });
      shell.task('<p><b>Сравни двете езера.</b> Полетата до тях са наторени. Вляво няма мярка. Вдясно торовете са умерено и до брега има ивица дървета.</p>');
      shell.msg('');
      const c = shell.setControls('<div class="row"><button class="btn primary rain2">🌧 Пусни един и същ дъжд над двете</button></div>');
      c.querySelector('.rain2').addEventListener('click', () => {
        c.querySelector('.rain2').disabled = true;
        L1.st.rain = true; L2.st.rain = true; L1.st.fert = 1; L2.st.fert = 0.15;
        setTimeout(() => {
          L1.st.rain = false; L2.st.rain = false;
          ctx.bubbles2 = [
            stage.bubble(lakeAt, '❌ Водорасли. Рибите се задушават.', { cls: 'bad', lift: 0.35 }),
            stage.bubble(L2At, '✔ Бистра вода. Рибите са живи.', { cls: 'good', lift: 2.4 }),
          ];
          choice(ctx, {
            q: 'Дъждът беше един и същ. Какво направи разликата?',
            options: [
              { t: 'Ивицата дървета задържа торовете, а и торовете бяха по-малко.', ok: true, why: 'Вярно! До второто езеро стигна много по-малко тор. Водораслите не плъзнаха.' },
              { t: 'Над второто езеро валя по-малко.', ok: false, why: 'Дъждът беше един и същ. Виж къде спряха жълтите капки тор вдясно.' },
              { t: 'Рибите във второто езеро са по-силни.', ok: false, why: 'Рибите са еднакви. Разликата е между полето и езерото.' },
            ],
            hint: 'Какво има между полето и езерото вдясно?',
            mistakes,
            onRight: (m) => { mistakes = m; nextBtn(ctx, 'Напред →', save); },
          });
        }, 4500);
      }, { once: true });
    }
    function save() {
      ctx.clearTip();
      (ctx.bubbles2 || []).forEach((b) => b.remove()); ctx.bubbles2 = null;
      tagNo.visible = false; tagYes.visible = false; L2.g.visible = false; plant.visible = true;
      view(ctx, [-3.5, 0.6, -0.6], 3.6, { halfH: 1.4, elev: 0.5 });
      shell.task('<p>Пренеси към живота: <b>опазва</b> ли водата всяко действие?</p>');
      shell.msg('');
      sortTask(ctx, {
        bins: ['Пази водата', 'Вреди на водата'],
        items: [
          { t: 'Затварям чешмата, докато си мия зъбите.', bin: 0, why: 'Пестим питейната вода.', show: () => { stream.visible = false; } },
          { t: 'Изливам олиото от тигана в мивката.', bin: 1, why: 'Олиото запушва тръбите и замърсява водата. Събира се в бутилка.' },
          { t: 'Нося старите лекарства в аптека, която ги приема.', bin: 0, why: 'Така те не стигат до реките. Не всяка аптека ги събира — питаме там.' },
          { t: 'Мия колата на брега на реката.', bin: 1, why: 'Препаратите и маслото отиват направо в реката.' },
          { t: 'Изхвърлям старите батерии в специалния контейнер.', bin: 0, why: 'Някои батерии съдържат вредни метали. Ако попаднат в почвата, те могат да стигнат до подпочвените води.' },
        ],
        hint: 'Какво стига до реката и какво я пести?',
        mistakes,
        onDone: (m) => { stream.visible = true; ctx.scores[2] = stepScore(m, 3); shell.msg('Браво!', 'good'); finishBtn(ctx, onComplete, restart); },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    ctx.answer = null;
    stream.visible = true;
    clean.material.color.set(0xc8b88a);
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
