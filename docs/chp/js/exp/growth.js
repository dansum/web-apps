// 6.3.4 „Растеж и развитие“ — градина с аквариум (попова лъжичка — увеличено), етапи на фасула, зеле с гъсеница
// и какавида, кокошка с яйце и пиле, котка с коте и езерце с жаба.
// Стъпки: опознай → развитието на жабата (плъзгач „Седмици“: дължина и промени) → растеж или развитие; пряко и непряко
// развитие; етапи при растението → общо и различно при растения и животни, предскажи.
import { mat, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { meadow, clouds, beanInPot, henModel, chickModel, eggModel, catModel, butterflyModel, flap, clamp01, lerp } from './nature3.js';
import { badge, spot, tagOn } from './bio6.js';

const ST = [
  { from: 0, t: 'Хайвер: яйцата на жабата. Във всяко се развива зародиш.' },
  { from: 2, t: 'Попова лъжичка с външни хриле. Живее във водата.' },
  { from: 4, t: 'Хрилете вече са скрити. Поповата лъжичка расте.' },
  { from: 7, t: 'Появяват се задни крака.' },
  { from: 10, t: 'Появяват се предни крака.' },
  { from: 12, t: 'Опашката се скъсява. Хрилете изчезват и започва да диша с бели дробове.' },
  { from: 14, t: 'Малка жаба! Може да излезе на сушата.' },
];
const stageOf = (w) => ST.filter((s) => w >= s.from).pop();
// дължина в mm (приблизително): яйце → расте → опашката се поглъща
const lenMM = (w) => (w < 2 ? 2 : w <= 11 ? lerp(8, 40, (w - 2) / 9) : lerp(40, 15, (w - 11) / 3));

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Развитието на жабата', 'Растеж или развитие?', 'Общо и различно'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xbfe3f7, camPos: [0, 5, 11], target: [0, 1, 0], maxDistance: 24 } });
  const { shell, stage, scene } = ctx;
  meadow(scene);
  clouds(stage, 5);
  const note = badge(shell, '⚠ Поповата лъжичка е увеличена — не е в мащаб');

  // ---------- Аквариум с попова лъжичка ----------
  const tank = new THREE.Group(); tank.position.set(0, 0, 0.8); scene.add(tank);
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 1.4), mat(0xa1887f)); table.position.y = 0.75; tank.add(table);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), mat(0x6d4c41)); l.position.set(sx * 1.25, 0.37, sz * 0.55); tank.add(l); }
  const glassM = new THREE.MeshStandardMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, roughness: 0.05 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.1, 1.1), glassM); box.position.y = 1.35; tank.add(box);
  const water = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.85, 1.04), new THREE.MeshStandardMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.25, depthWrite: false })); water.position.y = 1.23; tank.add(water);
  const sand = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.08, 1.04), mat(0xd7c49e)); sand.position.y = 0.84; tank.add(sand);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), mat(0x8d8d8d, { flat: true })); rock.scale.set(1.2, 1.3, 1); rock.position.set(0.9, 1.1, -0.28); tank.add(rock);
  const weeds = [];
  for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.7, 5), mat(0x2e7d32)); w.position.set(-1.0 + i * 0.12, 1.2, -0.35 + (i % 2) * 0.1); tank.add(w); weeds.push(w); }
  // хайвер
  const spawn = new THREE.Group(); spawn.position.set(-0.4, 1.45, 0); tank.add(spawn);
  const jelly = new THREE.MeshStandardMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.45, depthWrite: false });
  for (let i = 0; i < 26; i++) { const e = new THREE.Group(); e.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), jelly)); e.add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), mat(0x212121))); e.position.set(Math.cos(i * 2.4) * 0.05 * Math.sqrt(i), Math.sin(i * 1.7) * 0.08, Math.sin(i * 2.4) * 0.05 * Math.sqrt(i)); spawn.add(e); }
  // попова лъжичка → жаба
  const tad = new THREE.Group(); tank.add(tad);
  const skinM = mat(0x4e4a2e);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), skinM); body.scale.set(1.35, 0.85, 1); tad.add(body);
  const tail = new THREE.Group(); tail.position.x = -0.18; tad.add(tail);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({ color: 0x6b6440, transparent: true, opacity: 0.85 })); fin.scale.set(1, 0.32, 0.06); fin.position.x = -0.28; tail.add(fin);
  const eyes = [];
  for (const s of [1, -1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xfff59d)); e.position.set(0.12, 0.08, s * 0.1); const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), mat(0x111111)); p.position.set(0.025, 0, 0); e.add(p); tad.add(e); eyes.push(e); }
  const gills = new THREE.Group(); tad.add(gills);
  for (const s of [1, -1]) for (let k = 0; k < 3; k++) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.09, 4), mat(0xe57373)); g.position.set(0.02 - k * 0.03, 0.02, s * 0.15); g.rotation.x = s * 1.1; gills.add(g); }
  const leg = (x, z, len) => { const g = new THREE.Group(); g.position.set(x, -0.06, z); const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, len, 4, 6), skinM); a.rotation.x = Math.sign(z) * 1.2; a.position.z = Math.sign(z) * len * 0.45; g.add(a); const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), skinM); f.scale.set(1.4, 0.4, 1.2); f.position.set(0.02, -0.04, Math.sign(z) * len * 0.95); g.add(f); tad.add(g); return g; };
  const hind = [leg(-0.14, 0.1, 0.18), leg(-0.14, -0.1, 0.18)];
  const fore = [leg(0.1, 0.1, 0.1), leg(0.1, -0.1, 0.1)];
  const tadAt = spot(tad, 'tadpole', [0, 0, 0], 0.35);
  const spawnAt = spot(spawn, 'spawn', [0, 0, 0], 0.35);
  const tankAt = spot(tank, null, [0, 1.6, 0]);
  const W = { w: 0, swim: 0 };
  const brown = new THREE.Color(0x4e4a2e); const green = new THREE.Color(0x689f38);
  function setWeek(w) {
    W.w = w;
    spawn.visible = w < 2;
    tad.visible = w >= 2;
    const s = w <= 11 ? lerp(0.45, 1.0, (w - 2) / 9) : lerp(1.0, 0.85, (w - 11) / 3);
    tad.scale.setScalar(Math.max(0.3, s) * 1.7);
    gills.visible = w >= 2 && w < 4;
    const hk = clamp01((w - 7) / 2); hind.forEach((h) => { h.visible = hk > 0; h.scale.setScalar(Math.max(0.01, hk)); });
    const fk = clamp01((w - 10) / 1.5); fore.forEach((h) => { h.visible = fk > 0; h.scale.setScalar(Math.max(0.01, fk)); });
    const tk = w < 11.5 ? 1 : clamp01(1 - (w - 11.5) / 2.5); tail.scale.set(Math.max(0.02, tk), Math.max(0.2, tk), 1); tail.visible = tk > 0.02;
    skinM.color.copy(brown).lerp(green, clamp01((w - 10.5) / 3));
    body.scale.set(lerp(1.35, 1.2, clamp01((w - 11) / 3)), lerp(0.85, 0.7, clamp01((w - 11) / 3)), 1);
  }
  setWeek(0);

  // ---------- Фасул: семе, кълн, растение ----------
  const beans = new THREE.Group(); beans.position.set(-3.6, 0, 0.6); scene.add(beans);
  const bboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.9), mat(0x8d6e63)); bboard.position.y = 0.25; beans.add(bboard);
  const seedG = new THREE.Group(); seedG.position.set(-0.8, 0.6, 0); beans.add(seedG);
  for (const s of [1, -1]) { const half = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10, 0, Math.PI), mat(0xf3e5c0, { side: THREE.DoubleSide })); half.scale.set(1.4, 0.8, 0.9); half.rotation.y = s > 0 ? 0 : Math.PI; half.position.x = s * 0.12; seedG.add(half); }
  const embryo = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.1, 4, 6), mat(0xc5e1a5)); embryo.position.set(0.12, 0.02, 0.06); embryo.rotation.z = 0.6; seedG.add(embryo);
  const sprout = beanInPot({ r: 0.22, h: 0.3 }); sprout.position.set(0, 0.5, 0); beans.add(sprout); sprout.userData.set({ h: 0.25, leaves: 2 });
  const young = beanInPot({ r: 0.25, h: 0.34 }); young.position.set(0.8, 0.5, 0); beans.add(young); young.userData.set({ h: 0.9, leaves: 8, pods: 1 });
  const at = {
    seed: spot(seedG, 'seed', [0, 0, 0], 0.25),
    sprout: spot(sprout, 'sprout', [0, 0.45, 0], 0.25),
    plant: spot(young, null, [0, 0.8, 0]),
  };
  tagOn(stage, seedG, 'семе в разрез', [0, 0.35, 0], 0.15);

  // ---------- Зеле с гъсеница и какавида ----------
  const cab = new THREE.Group(); cab.position.set(-1.9, 0, -1.6); scene.add(cab);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), mat(0x9ccc65, { side: THREE.DoubleSide })); l.scale.set(1, 0.6, 1); l.position.set(Math.cos(i) * 0.15, 0.25 + (i % 3) * 0.08, Math.sin(i) * 0.15); cab.add(l); }
  const cat = new THREE.Group(); cat.position.set(0.1, 0.62, 0.25); cab.add(cat);
  const segsC = [];
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(i ? 0x7cb342 : 0x33691e)); s.position.x = i * 0.06; cat.add(s); segsC.push(s); }
  const chrys = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 8), mat(0xa5d6a7)); chrys.position.set(-0.3, 0.55, 0.25); chrys.rotation.z = 0.3; cab.add(chrys);
  const bfly = butterflyModel(0xffffff); scene.add(bfly);
  const cabAt = spot(cab, 'butterfly', [0, 0.6, 0.2], 0.4);

  // ---------- Кокошка, яйце, пиле ----------
  const hen = henModel(); hen.position.set(2.8, 0, 0.3); hen.rotation.y = -0.4; scene.add(hen);
  const egg = eggModel(); egg.position.set(3.35, 0, 0.8); scene.add(egg);
  const chicks = [chickModel(), chickModel()]; chicks[0].position.set(3.3, 0, 1.25); chicks[1].position.set(2.6, 0, 1.3); chicks.forEach((c) => scene.add(c));
  const henAt = spot(scene, 'chick', [3.0, 0.4, 0.9], 0.45);
  // ---------- Котка и коте ----------
  const catA = catModel(0xf0a04b); catA.position.set(4.6, 0, -0.6); catA.rotation.y = -0.8; scene.add(catA);
  const kit = catModel(0xf0a04b); kit.scale.setScalar(0.5); kit.position.set(4.3, 0, 0.4); kit.rotation.y = -1.6; scene.add(kit);
  const kitAt = spot(scene, 'kitten', [4.4, 0.4, 0], 0.55);
  // ---------- Езерце с жаба ----------
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1.5, 30), new THREE.MeshStandardMaterial({ color: 0x29b6f6, roughness: 0.15 })); pond.rotation.x = -Math.PI / 2; pond.position.set(1.8, 0.03, -2.6); scene.add(pond);
  const frog = new THREE.Group(); frog.position.set(1.4, 0.05, -1.4); scene.add(frog);
  { const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), mat(0x689f38)); b.scale.set(1.2, 0.7, 1); b.position.y = 0.14; frog.add(b);
    for (const s of [1, -1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xfff59d)); e.position.set(0.15, 0.25, s * 0.08); frog.add(e); const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.22, 4, 6), mat(0x558b2f)); l.position.set(-0.15, 0.06, s * 0.17); l.rotation.z = Math.PI / 2; frog.add(l); } }
  const frogAt = spot(frog, 'frog', [0, 0.15, 0], 0.35);

  // ---------- Жива сцена ----------
  stage.tick((dt, t) => {
    W.swim += dt;
    if (tad.visible) {
      const out = W.w >= 14;
      const x = out ? 0.9 : -0.1 + Math.sin(W.swim * 0.6) * 0.55; const y = out ? 1.52 : 1.2 + Math.sin(W.swim * 1.3) * 0.08;
      tad.position.set(x, y, out ? -0.28 : 0.2 + Math.cos(W.swim * 0.6) * 0.08);
      tad.rotation.y = out ? -0.4 : (Math.cos(W.swim * 0.6) > 0 ? 0 : Math.PI);
      tail.rotation.y = Math.sin(t * 9) * 0.35 * (out ? 0 : 1);
    }
    spawn.rotation.y = Math.sin(t * 0.4) * 0.2;
    weeds.forEach((w, i) => { w.rotation.z = Math.sin(t + i) * 0.08; });
    segsC.forEach((s, i) => { s.position.y = Math.max(0, Math.sin(t * 3 - i * 0.8)) * 0.03; });
    cat.position.x = 0.1 + Math.sin(t * 0.3) * 0.08;
    bfly.position.set(-1.9 + Math.cos(t * 0.6) * 1.0, 1.4 + Math.sin(t * 1.3) * 0.2, -1.6 + Math.sin(t * 0.6) * 0.8);
    bfly.rotation.y = -t * 0.6; flap(bfly, t);
    hen.userData.head.rotation.z = Math.max(0, Math.sin(t * 1.5)) * 0.5;
    chicks.forEach((c, i) => { c.position.x += Math.sin(t * 0.8 + i * 2) * dt * 0.15; c.rotation.y = Math.sin(t * 0.8 + i * 2) > 0 ? 0 : Math.PI; });
    kit.position.x = 4.3 + Math.sin(t * 0.5) * 0.3; kit.rotation.y = Math.cos(t * 0.5) > 0 ? -Math.PI / 2 + 0.6 : Math.PI / 2 + 0.6;
    frog.position.y = 0.05 + Math.max(0, Math.sin(t * 1.1)) * 0.05;
    sprout.rotation.y = Math.sin(t * 0.7) * 0.1; young.rotation.y = Math.sin(t * 0.6 + 1) * 0.1;
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    setWeek(0);
    view(ctx, [0.3, 0.8, 0], 5.6, { halfH: 1.8, elev: 0.35 });
    const it = (id, label, icon, n, obj, dist = 3) => ({ id, label, icon, note: n, obj: () => obj, dist, lift: 0, bubble: 0.35 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Всички организми <b>растат</b> и <b>се развиват</b>. Разгледай как започва животът на растенията и животните.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        it('seed', 'Семе', '🫘', 'В семето има <b>зародиш</b> (бъдещото растение) и запас от хранителни вещества.', at.seed, 2.4),
        it('sprout', 'Покълнало растение', '🌱', 'При покълването от зародиша се образуват коренче и стъбълце.', at.sprout, 2.4),
        it('spawn', 'Хайвер', '🫧', 'Жабите снасят яйцата си във водата. Купчинката яйца се нарича <b>хайвер</b>.', spawnAt, 2.6),
        it('tadpole', 'Попова лъжичка', '🐟', 'От яйцето излиза <b>попова лъжичка</b>. Тя диша с хриле и плува с опашка — съвсем не прилича на жаба.', tadAt, 2.6),
        it('frog', 'Жаба', '🐸', 'Възрастната жаба диша с бели дробове и кожа, има четири крака и няма опашка.', frogAt, 2.6),
        it('butterfly', 'Пеперуда и гъсеница', '🐛', 'От яйцата на пеперудата излизат <b>гъсеници</b>. Гъсеницата става <b>какавида</b>, а от какавидата излиза пеперуда.', cabAt, 3),
        it('chick', 'Кокошка, яйце и пиле', '🐤', 'Пилето, което се излюпва от яйцето, прилича на възрастната птица. То расте и се оперява.', henAt, 3),
        it('kitten', 'Коте', '🐱', 'Котето се ражда малко, но прилича на котката. С времето то расте.', kitAt, 3),
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Развитието на жабата ----------
  function step2() {
    shell.step(1);
    setWeek(0);
    view(ctx, [0, 1.3, 0.8], 1.4, { halfH: 0.8, elev: 0.15 });
    shell.task('<p>В аквариума има хайвер. Ще проследим какво става с него през следващите седмици.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво става с поповата лъжичка, докато стане жаба?',
      options: [
        { t: 'И расте, и се променя по форма и устройство.', ok: true, why: 'Да проверим! Плъзни седмиците.' },
        { t: 'Само расте, без да се променя.', ok: false, why: 'Поповата лъжичка има опашка и хриле, а жабата — не. Значи?' },
        { t: 'Само се променя, без да расте.', ok: false, why: 'От яйце колкото глава на топлийка до жаба — помисли за размера.' },
      ],
      hint: 'Сравни поповата лъжичка с жабата в езерото.',
      onRight: (m) => { mistakes = m; weeks(); },
    });
    function weeks() {
      ctx.clearTip();
      const asks = [
        { q: 'Спри, когато поповата лъжичка има <b>задни крака</b>, но още <b>няма предни</b>.', ok: (w) => w >= 8 && w <= 10, ans: 8, hint: 'Задните крака се появяват преди предните.' },
        { q: 'Спри, когато вече е <b>малка жаба</b> и може да излезе на сушата.', ok: (w) => w >= 14, ans: 14, hint: 'Опашката трябва да е изчезнала.' },
      ];
      let k = 0;
      shell.task(`<p class="small">Приблизително. Сроковете зависят от вида на жабата и от температурата на водата.</p>
        <label class="small">Седмици: <b class="wv">0</b><input class="slider ws" type="range" min="0" max="14" step="1" value="0"></label>
        <p class="aq"></p>`);
      const sl = container.querySelector('.ws');
      const info = stage.bubble(tankAt, '', { lift: 0.5, cls: 'wide' });
      const upd = () => {
        const w = +sl.value; container.querySelector('.wv').textContent = w; setWeek(w);
        info.set(`<b>Растеж:</b> дължина ≈ ${Math.round(lenMM(w))} mm<br><b>Развитие:</b> ${stageOf(w).t}`);
      };
      sl.addEventListener('input', upd); upd();
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      const ask = () => { container.querySelector('.aq').innerHTML = asks[k].q; ctx.answer = asks[k].ans; };
      ask();
      c.querySelector('.chk').addEventListener('click', () => {
        if (!asks[k].ok(+sl.value)) { mistakes++; shell.msg(`Не е този етап.${mistakes >= 2 ? ' Подсказка: ' + asks[k].hint : ''}`, 'bad'); return; }
        shell.msg('Вярно!', 'good');
        k++;
        if (k < asks.length) { ask(); return; }
        ctx.answer = null; sl.disabled = true; c.querySelector('.chk').disabled = true;
        info.remove();
        ctx.say(tankAt, '✔ Дължината растеше, а накрая намаля, защото опашката се погълна. Но развитието продължи: появиха се крака и бели дробове.', 'good wide', 0.5);
        ctx.scores[0] = stepScore(mistakes, 3);
        nextBtn(ctx, 'Напред →', step3);
      });
    }
  }

  // ---------- 3. Растеж или развитие? ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    view(ctx, [1.2, 0.6, 0], 4.6, { halfH: 1.6, elev: 0.35 });
    shell.task('<p><b>Растеж</b> е увеличаване на размерите и масата. <b>Развитие</b> са промените във формата и устройството на организма. Кое е кое?</p>');
    sortTask(ctx, {
      bins: ['Растеж', 'Развитие'],
      items: [
        { t: 'Поповата лъжичка става по-дълга.', bin: 0, why: 'Размерът се увеличава — това е растеж.' },
        { t: 'Появяват се задни крака.', bin: 1, why: 'Появява се нов орган — това е развитие.' },
        { t: 'Котето напълнява и става по-голямо.', bin: 0, why: 'Масата и размерът се увеличават.' },
        { t: 'Гъсеницата се превръща в какавида.', bin: 1, why: 'Формата се променя напълно.' },
        { t: 'Стъблото на дървото става по-дебело всяка година.', bin: 0, why: 'Размерът се увеличава.' },
        { t: 'Растението образува цветове.', bin: 1, why: 'Появяват се нови органи.' },
      ],
      hint: 'По-голямо ли става, или се появява нещо ново?',
      onDone: (m) => {
        shell.task('<p>При <b>прякото развитие</b> малкото прилича на възрастния. При <b>непрякото</b> — малкото е много различно и се преобразува.</p>');
        const sh = (a, t) => () => ctx.say(a, t, 'tag', 0.3);
        sortTask(ctx, {
          bins: ['Пряко развитие', 'Непряко развитие'],
          items: [
            { t: 'жаба', bin: 1, show: sh(frogAt, 'жаба'), why: 'Поповата лъжичка не прилича на жабата.' },
            { t: 'пеперуда', bin: 1, show: sh(cabAt, 'пеперуда'), why: 'Яйце → гъсеница → какавида → пеперуда.' },
            { t: 'кокошка', bin: 0, show: sh(henAt, 'пиле'), why: 'Пилето прилича на възрастната птица.' },
            { t: 'котка', bin: 0, show: sh(kitAt, 'коте'), why: 'Котето прилича на котката.' },
            { t: 'гущер', bin: 0, why: 'Малкото гущерче прилича на възрастния.' },
            { t: 'майски бръмбар', bin: 1, why: 'Ларвата живее в почвата и не прилича на бръмбара.' },
          ],
          hint: 'Прилича ли малкото на родителите си?',
          mistakes: m,
          onDone: (m2) => {
            ctx.clearTip();
            view(ctx, [-3.6, 0.7, 0.6], 1.5, { halfH: 0.8, elev: 0.3 });
            const look = [at.seed, at.sprout, at.plant, at.plant, at.plant];
            orderTask(ctx, {
              q: 'Подреди етапите в развитието на цветно растение.',
              items: ['семе', 'покълване', 'растение с листа', 'цъфтеж', 'плод със семена'],
              hint: 'Започва се от семето и се стига пак до семена.',
              mistakes: m2,
              onPick: (i) => ctx.say(look[i], ['семе', 'покълване', 'растение', 'цъфтеж', 'плод'][i], 'tag', 0.2),
              onDone: (m3) => { ctx.scores[1] = stepScore(m3, 3); nextBtn(ctx, 'Напред →', step4); },
            });
          },
        });
      },
    });
  }

  // ---------- 4. Общо и различно ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [0.3, 0.8, 0], 5.6, { halfH: 1.8, elev: 0.35 });
    shell.task('<p>Какво е общото и какво е различното в растежа и развитието на растенията и животните?</p>');
    sortTask(ctx, {
      bins: ['Растения', 'Животни', 'И двете'],
      items: [
        { t: 'Растат, защото клетките им се делят и увеличават.', bin: 2, why: 'Растежът и при двете е чрез клетките.' },
        { t: 'Минават през етапи на развитие.', bin: 2, why: 'Семе → растение; яйце → възрастно животно.' },
        { t: 'Повечето растат през целия си живот.', bin: 0, why: 'Дърветата растат на височина и дебелина цял живот.' },
        { t: 'Растат главно на върха на корена и стъблото.', bin: 0, why: 'Там има клетки, които се делят непрекъснато.' },
        { t: 'Повечето спират да растат, когато станат възрастни.', bin: 1, why: 'Котката, кокошката и човекът спират да растат на ръст.' },
      ],
      hint: 'Помисли за дървото и за котката.',
      onDone: (m) => {
        view(ctx, [-1.9, 0.6, -1.6], 2.0, { halfH: 1.0, elev: 0.4 });
        choice(ctx, {
          q: 'Пеперуда снася яйца по листата на зелето. Какво ще излезе от яйцата?',
          options: [
            { t: 'Гъсеници.', ok: true, why: 'Вярно! Пеперудата има непряко развитие. Гъсениците се хранят със зелето.' },
            { t: 'Малки пеперудки.', ok: false, why: 'Пряко ли е развитието на пеперудата? Спомни си етапите.' },
            { t: 'Какавиди.', ok: false, why: 'Какавидата е по-късен етап. Какво е преди нея?' },
          ],
          hint: 'Яйце → ? → какавида → пеперуда.',
          mistakes: m,
          onRight: (m2) => {
            ctx.say(cabAt, 'Гъсеницата расте бързо и сменя кожата си няколко пъти, после става какавида.', 'wide', 0.4);
            ctx.scores[2] = stepScore(m2, 3);
            finishBtn(ctx, onComplete, restart);
          },
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
