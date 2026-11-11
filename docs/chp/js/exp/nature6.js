// 6.3.8 „Единство на природата; човекът – част от природата“ — долина с река, езеро с риби, нива, дървета, птици
// и бряг с отпадъци (6. клас; продължение на unity.js от 5.3.8, без да го повтаря).
// Стъпки: опознай → движението в живата и неживата природа, единство → нивата и езерото: торове и защитна ивица (симулация)
// → почисти брега, сравни поведения и предложи решение.
import { mat, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { curveOf, flowDots } from './anatomy.js';
import { meadow, clouds, treeModel, birdModel, clamp01, lerp } from './nature3.js';
import { badge, spot, tagOn } from './bio6.js';

const LAKE = [2.2, 0, 0.2];
const FERT = ['без тор', 'малко', 'умерено', 'много'];

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Всичко се движи', 'Нивата и езерото', 'Ние и природата'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xbfe3f7, camPos: [0, 7, 12], target: [0, 0.5, 0], maxDistance: 28 } });
  const { shell, stage, scene } = ctx;
  meadow(scene);
  clouds(stage, 6);
  const note = badge(shell, '⚠ Модел — числата и времето са условни');

  // ---------- Езеро с риби ----------
  const lakeM = new THREE.MeshStandardMaterial({ color: 0x29b6f6, roughness: 0.15, transparent: true, opacity: 0.92 });
  const lake = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), lakeM); lake.rotation.x = -Math.PI / 2; lake.position.set(LAKE[0], 0.04, LAKE[2]); lake.scale.set(1.2, 1, 1); scene.add(lake);
  const scum = [];
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.25 + (i % 3) * 0.12, 10), new THREE.MeshStandardMaterial({ color: 0x7cb342, transparent: true, opacity: 0, depthWrite: false })); s.rotation.x = -Math.PI / 2; const a = i * 2.3; const r = 0.4 + (i % 4) * 0.4; s.position.set(LAKE[0] + Math.cos(a) * r * 1.2, 0.05, LAKE[2] + Math.sin(a) * r); scene.add(s); scum.push(s); }
  const fish = [];
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Group();
    const fm = mat(0xff8f00);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), fm); b.scale.set(1.6, 0.8, 0.6); f.add(b);
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 4), fm); t.rotation.z = Math.PI / 2; t.position.x = -0.22; f.add(t);
    f.userData = { a: i * 1.3, r: 0.5 + (i % 3) * 0.45, fm, dead: false };
    scene.add(f); fish.push(f);
  }
  const lakeAt = spot(scene, 'lake', [LAKE[0], 0.3, LAKE[2]], 0.8);

  // ---------- Река ----------
  const riverC = curveOf([[-2, 0.03, -8], [-0.5, 0.03, -5.5], [0.4, 0.03, -3.5], [1.6, 0.03, -1.8]]);
  const pts = riverC.getPoints(40); const verts = []; const idx = [];
  pts.forEach((p, i) => { const tg = riverC.getTangent(i / 40); const n = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(0.35); verts.push(p.x + n.x, 0.035, p.z + n.z, p.x - n.x, 0.035, p.z - n.z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); rg.setIndex(idx); rg.computeVertexNormals();
  scene.add(new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: 0x4fc3f7, side: THREE.DoubleSide, roughness: 0.2 })));
  const ripples = flowDots(curveOf(pts.map((p) => [p.x, 0.06, p.z])), { n: 18, r: 0.04, color: 0xe1f5fe, speed: 0.6 }); scene.add(ripples);
  const riverAt = spot(scene, 'river', [0.0, 0.2, -4.5], 0.6);

  // ---------- Нива ----------
  const field = new THREE.Group(); field.position.set(-2.8, 0, 0.6); scene.add(field);
  const soil = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 2.6), mat(0x8d6e63)); soil.position.y = 0.04; field.add(soil);
  const crops = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 5), mat(0x9ccc65)); p.position.set(-1.4 + c * 0.35, 0.2, -1.05 + r * 0.42); field.add(p); crops.push(p); }
  const sack = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.45, 10), mat(0xeeeeee)); sack.position.set(-1.9, 0.22, 1.5); field.add(sack);
  tagOn(stage, field, 'нива', [0, 0.9, 0], 0.22, 10);
  const fieldAt = spot(field, 'field', [0, 0.4, 0], 0.8);
  // защитна ивица от дървета и храсти между нивата и езерото
  const strip = new THREE.Group(); scene.add(strip);
  for (let i = 0; i < 7; i++) { const t = treeModel(0.32 + (i % 2) * 0.08); t.position.set(-0.75 + (i % 2) * 0.25, 0, -0.8 + i * 0.4); strip.add(t); }
  strip.visible = false;
  // оттичане от нивата към езерото
  const runC = curveOf([[-1.4, 0.12, 0.6], [-0.6, 0.1, 0.5], [0.2, 0.08, 0.35], [0.8, 0.07, 0.25]]);
  const run = flowDots(runC, { n: 14, r: 0.05, color: 0x8bc34a, speed: 0.5 }); run.visible = false; scene.add(run);
  const rain = [];
  for (let i = 0; i < 70; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4), new THREE.MeshBasicMaterial({ color: 0x90caf9 })); d.userData = { x: -4.5 + Math.random() * 9, z: -1.8 + Math.random() * 4, k: Math.random() }; d.visible = false; scene.add(d); rain.push(d); }

  // ---------- Дървета, птици, къща ----------
  const forest = [];
  [[-5, -4], [-3.6, -5], [3.5, -4.5], [5.2, -3.4], [-6, -1.5], [6.2, -1]].forEach(([x, z], i) => { const t = treeModel(0.7 + (i % 3) * 0.15); t.position.set(x, 0, z); scene.add(t); forest.push(t); });
  const treeAt = spot(forest[2], 'tree', [0, 1.8, 0], 0.7);
  const birds = [birdModel(0x37474f), birdModel(0x5d4037)]; birds.forEach((b) => { b.scale.setScalar(1.3); scene.add(b); });
  const birdAt = spot(birds[0], 'bird', [0, 0.3, 0], 0.4);
  const house = new THREE.Group(); house.position.set(-5.3, 0, 2.6); scene.add(house);
  { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1), mat(0xffe0b2)); b.position.y = 0.45; const r = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.6, 4), mat(0xc62828)); r.position.y = 1.2; r.rotation.y = Math.PI / 4; house.add(b, r); }

  // ---------- Бряг с отпадъци и контейнер ----------
  const trash = [];
  const tcol = [0x42a5f5, 0xeeeeee, 0xffca28];
  [[4.4, 2.3], [5.0, 2.8], [3.7, 2.9]].forEach(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const m = i === 1 ? new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.18), mat(tcol[i])) : new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.32, 10), mat(tcol[i]));
    m.rotation.z = i === 1 ? 0.3 : Math.PI / 2; m.position.y = 0.09; g.add(m);
    g.userData.pickId = 'trash' + i;
    const hb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hb.userData.isHitBox = true; hb.position.y = 0.1; g.add(hb);
    scene.add(g); trash.push(g);
  });
  const trashAt = spot(scene, null, [4.4, 0.3, 2.6]);
  const bin = new THREE.Group(); bin.position.set(5.6, 0, 1.4); scene.add(bin);
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.5), mat(0xfdd835)); b.position.y = 0.4; const l = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.55), mat(0xf9a825)); l.position.y = 0.83; bin.add(b, l); }
  tagOn(stage, bin, 'разделно', [0, 1.15, 0], 0.18, 10);
  const binAt = spot(bin, 'bin', [0, 0.45, 0], 0.5);
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(0.6, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffd54f })); sunM.position.set(-7, 7.5, -10); scene.add(sunM);

  // ---------- Състояние на модела ----------
  const S = { fert: 0, strip: false, algae: 0, crop: 0.4, run: null, raining: false, trashOut: [] };
  const target = () => {
    const load = S.fert * (S.strip ? 0.35 : 1); // тор, който стига до езерото
    return { crop: [0.4, 0.75, 1, 1][S.fert], algae: clamp01((load - 0.8) / 1.6) };
  };
  stage.tick((dt, t) => {
    ripples.userData.update(dt);
    if (S.run) {
      S.run.t += dt; const k = Math.min(1, S.run.t / 4);
      S.raining = k < 0.6; run.visible = k < 0.8 && S.fert > 0;
      run.material.color.set(S.strip ? 0x9ccc65 : 0x7cb342); run.scale.setScalar(1);
      const tg = target();
      S.algae = lerp(S.run.a0, tg.algae, k); S.crop = lerp(S.run.c0, tg.crop, k);
      if (k >= 1) { const d = S.run.done; S.run = null; S.raining = false; run.visible = false; d && d(); }
    }
    if (run.visible) run.userData.update(dt, S.strip ? 0.4 : 1);
    rain.forEach((d) => { d.visible = S.raining; if (!S.raining) return; d.userData.k = (d.userData.k + dt * 1.5) % 1; d.position.set(d.userData.x, 5 - d.userData.k * 5, d.userData.z); });
    lakeM.color.set(0x29b6f6).lerp(new THREE.Color(0x689f38), S.algae);
    scum.forEach((s, i) => { s.material.opacity = clamp01(S.algae * 1.6 - (i % 5) * 0.12) * 0.85; });
    crops.forEach((c, i) => { c.scale.y = 0.5 + S.crop * 0.9 + Math.sin(t * 2 + i) * 0.03; c.position.y = 0.2 * c.scale.y; c.material.color.set(0xd4e157).lerp(new THREE.Color(0x558b2f), S.crop); });
    const deadN = Math.round(clamp01((S.algae - 0.35) / 0.5) * fish.length);
    fish.forEach((f, i) => {
      const u = f.userData; const dead = i < deadN;
      if (dead) { f.position.set(LAKE[0] + Math.cos(u.a) * u.r * 1.2, 0.08, LAKE[2] + Math.sin(u.a) * u.r); f.rotation.set(Math.PI, 0, 0); u.fm.color.set(0x9e9e9e); return; }
      u.fm.color.set(0xff8f00);
      u.a += dt * 0.5 * (1 - S.algae * 0.6);
      f.position.set(LAKE[0] + Math.cos(u.a) * u.r * 1.2, -0.02 + Math.sin(t * 3 + i) * 0.03 + 0.06, LAKE[2] + Math.sin(u.a) * u.r);
      f.rotation.set(0, -u.a - Math.PI / 2, 0);
    });
    birds.forEach((b, i) => { const a = t * 0.3 + i * 2; b.position.set(Math.cos(a) * 5, 3.2 + i * 0.5 + Math.sin(t * 2 + i) * 0.15, -2 + Math.sin(a) * 3); b.rotation.y = -a - Math.PI / 2; });
    trash.forEach((g, i) => { if (S.trashOut[i] != null) { S.trashOut[i] = Math.min(1, S.trashOut[i] + dt * 1.5); const k = S.trashOut[i]; g.position.lerpVectors(g.userData.from, bin.position, k); g.position.y = Math.sin(k * Math.PI) * 1.2 + 0.4 * k; if (k >= 1) g.visible = false; } });
    forest.forEach((f, i) => { f.rotation.z = Math.sin(t * 0.8 + i) * 0.015; });
  });

  const resetModel = () => {
    Object.assign(S, { fert: 0, strip: false, algae: 0, crop: 0.4, run: null, raining: false });
    strip.visible = false;
  };
  const resetTrash = () => { S.trashOut = []; trash.forEach((g, i) => { g.visible = true; g.position.set(...[[4.4, 0, 2.3], [5.0, 0, 2.8], [3.7, 0, 2.9]][i]); }); };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    resetModel(); resetTrash();
    view(ctx, [0, 0.6, 0], 6.2, { halfH: 2.5, elev: 0.5 });
    const it = (id, label, icon, n, obj, dist = 4) => ({ id, label, icon, note: n, obj: () => obj, dist, lift: 0, bubble: 0.4 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>В природата всичко е свързано — неживата природа, растенията, животните и човекът.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        it('river', 'Река', '🏞', 'Водата в реката <b>тече</b> към езерото. Тя носи разтворени вещества от всичко, покрай което минава.', riverAt),
        it('lake', 'Езеро с риби', '🐟', 'Във водата има разтворен <b>кислород</b>. С него дишат рибите и другите водни животни.', lakeAt, 5),
        it('field', 'Нива', '🌾', 'Човекът отглежда растения за храна. <b>Торовете</b> им дават вещества за растеж — но излишъкът се отмива от дъжда.', fieldAt, 5),
        it('tree', 'Дърво', '🌳', 'Корените на дърветата задържат почвата и поемат водата. Листата отделят кислород.', treeAt, 5),
        it('bird', 'Птица', '🐦', 'Птиците летят — движението им помага да намерят храна и да избягат от опасност.', birdAt, 5),
        it('trash', 'Отпадъци на брега', '🗑', 'Пластмасата в природата се разгражда стотици години и вреди на животните.', trashAt, 4),
        it('bin', 'Контейнер за разделно събиране', '♻', 'Разделно събраните отпадъци се преработват и стават суровина за нови неща.', binAt, 4),
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Всичко се движи ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    view(ctx, [0, 0.6, -1], 6.2, { halfH: 2.8, elev: 0.5 });
    shell.task('<p>Движението е навсякъде. Това движение в неживата или в живата природа е?</p>');
    sortTask(ctx, {
      bins: ['Нежива природа', 'Жива природа'],
      items: [
        { t: 'Реката тече към езерото.', bin: 0, why: 'Водата се движи под действието на силата на тежестта.' },
        { t: 'Вятърът гони облаците.', bin: 0, why: 'Въздухът се движи.' },
        { t: 'Частиците на водата се движат и тя се изпарява.', bin: 0, why: 'Градивните частици на веществата никога не спират.' },
        { t: 'Земята се върти около оста си и сменя деня с нощта.', bin: 0, why: 'Движение на небесните тела.' },
        { t: 'Птиците отлитат на юг през есента.', bin: 1, why: 'Прелетните птици мигрират.' },
        { t: 'Кръвта тече в тялото на рибата.', bin: 1, why: 'Движение на веществата в организма.' },
        { t: 'Младият слънчоглед обръща връхчето си след слънцето.', bin: 1, why: 'Растенията също се движат.' },
      ],
      hint: 'Има ли тук живо същество?',
      onDone: (m) => {
        choice(ctx, {
          q: 'Защо казваме, че движението е основно свойство на материята?',
          options: [
            { t: 'Всичко — от частиците до планетите и живите организми — непрекъснато се движи и променя.', ok: true, why: 'Вярно! Няма нищо в природата, което да е в пълен покой.' },
            { t: 'Защото само живите организми се движат.', ok: false, why: 'Виж реката и облаците. Те живи ли са?' },
            { t: 'Защото движението е само при машините.', ok: false, why: 'Помисли за примерите, които подреди.' },
          ],
          hint: 'Спомни си частиците на водата и Земята.',
          mistakes: m,
          onRight: (m2) => {
            choice(ctx, {
              q: 'Кое доказва единството на живата и неживата природа?',
              options: [
                { t: 'Организмите са изградени от същите химични елементи, които има в неживата природа, и постоянно обменят вещества с нея.', ok: true, why: 'Вярно! Кислородът, който диша рибата, е разтворен във водата; растенията поемат вода и соли от почвата.' },
                { t: 'Живите организми нямат нищо общо с неживата природа.', ok: false, why: 'От какво си вземат вода, кислород и минерални вещества?' },
                { t: 'И двете са зелени.', ok: false, why: 'Цветът не е доказателство. Помисли за веществата.' },
              ],
              hint: 'От какво са изградени организмите?',
              mistakes: m2,
              onRight: (m3) => { ctx.scores[0] = stepScore(m3, 3); nextBtn(ctx, 'Напред →', step3); },
            });
          },
        });
      },
    });
  }

  // ---------- 3. Нивата и езерото ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    resetModel();
    view(ctx, [-0.4, 0.3, 0.4], 3.9, { halfH: 2.0, elev: 0.6 });
    shell.task('<p>Фермерът иска богата реколта и слага <b>много тор</b> на нивата до езерото. Вали дъжд.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще стане с езерото?',
      options: [
        { t: 'Торът ще се отмие в езерото, водораслите ще се размножат, а рибите ще останат без кислород.', ok: true, why: 'Да проверим! Нагласи модела и пусни сезона.' },
        { t: 'Нищо — торът остава на нивата.', ok: false, why: 'Къде отива дъждовната вода от нивата?' },
        { t: 'Рибите ще пораснат по-бързо от тора.', ok: false, why: 'Торът храни растенията — и водораслите в езерото. Какво става с тях?' },
      ],
      hint: 'Проследи дъждовната вода по склона.',
      onRight: (m) => { mistakes = m; sim(); },
    });
    function sim() {
      ctx.clearTip();
      shell.task(`<p>Направи така, че нивата да дава <b>добра реколта</b>, а езерото да остане <b>чисто</b>.</p>
        <label class="small">Тор: <b class="fv">${FERT[S.fert]}</b><input class="slider fs" type="range" min="0" max="3" step="1" value="${S.fert}"></label>
        <label class="small"><input type="checkbox" class="stc"> 🌳 Ивица от дървета и храсти между нивата и езерото</label>`);
      const sl = container.querySelector('.fs');
      sl.addEventListener('input', () => { S.fert = +sl.value; container.querySelector('.fv').textContent = FERT[S.fert]; });
      const cb = container.querySelector('.stc');
      cb.addEventListener('change', () => { S.strip = cb.checked; strip.visible = cb.checked; });
      ctx.answer = { fert: 2, strip: true };
      const c = shell.setControls('<div class="row"><button class="btn primary run">🌧 Пусни един сезон</button></div>');
      const btn = c.querySelector('.run');
      btn.addEventListener('click', () => {
        if (S.run) return;
        ctx.clearTip(); btn.disabled = true;
        S.algae = 0; S.crop = 0.4;
        S.run = { t: 0, a0: 0, c0: 0.4, done: () => {
          btn.disabled = false;
          const tg = target();
          const good = tg.crop >= 1 && tg.algae < 0.05;
          if (good) {
            btn.disabled = true; sl.disabled = true; cb.disabled = true; ctx.answer = null;
            ctx.say(lakeAt, '✔ Реколтата е добра, а езерото е чисто. Дърветата и храстите задържат водата и тора, преди да стигнат до езерото.', 'good wide', 0.6);
            choice(ctx, {
              q: 'Защо рибите загиват, когато водораслите се размножат прекомерно?',
              options: [
                { t: 'Когато водораслите умрат, бактериите ги разграждат и изразходват кислорода във водата.', ok: true, why: 'Вярно! Така човешката дейност на нивата стига чак до рибите в езерото.' },
                { t: 'Водораслите изяждат рибите.', ok: false, why: 'Водораслите са растителни организми. Какво им трябва на рибите, за да дишат?' },
                { t: 'Водата става солена.', ok: false, why: 'Торът не прави водата солена. Какво не достига на рибите?' },
              ],
              hint: 'С какво дишат рибите?',
              mistakes,
              onRight: (m) => { ctx.scores[1] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step4); },
            });
            return;
          }
          const why = tg.crop < 1 ? (S.fert === 0 ? 'Без тор реколтата е слаба.' : 'Торът не стига — реколтата е средна.') : 'Торът се отми в езерото: водата позеленя и рибите се задушиха.';
          ctx.say(lakeAt, `${why} Опитай пак.`, 'bad wide', 0.6);
        } };
      });
    }
  }

  // ---------- 4. Ние и природата ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    resetTrash();
    view(ctx, [4.6, 0.4, 2.2], 2.4, { halfH: 1.4, elev: 0.6 });
    shell.task('<p>На брега има отпадъци. <b>Кликни всеки отпадък</b>, за да го прибереш в контейнера.</p>');
    shell.setControls('');
    let left = trash.length;
    ctx.click = (id) => {
      const i = ['trash0', 'trash1', 'trash2'].indexOf(id);
      if (i < 0 || S.trashOut[i] != null) return;
      trash[i].userData.from = trash[i].position.clone();
      S.trashOut[i] = 0; left--;
      shell.msg(left ? `Остават ${left}.` : 'Брегът е чист!', 'good');
      if (!left) { ctx.click = null; setTimeout(compare, 900); }
    };
    function compare() {
      view(ctx, [0, 0.6, 0], 6.2, { halfH: 2.5, elev: 0.5 });
      shell.task('<p>Сравни поведенията. Кое е в хармония с природата и здравето, и кое им вреди?</p>');
      sortTask(ctx, {
        bins: ['В хармония', 'Вреди'],
        items: [
          { t: 'На поход вървя по маркираната пътека.', bin: 0, why: 'Така не тъпчем растенията и не плашим животните.' },
          { t: 'Паля огън в гората в сух и ветровит ден.', bin: 1, why: 'Така започват горските пожари.' },
          { t: 'Изливам старото олио в мивката.', bin: 1, why: 'Олиото замърсява водата. Събира се отделно.' },
          { t: 'Отивам на училище пеша или с колело, когато е близо.', bin: 0, why: 'Чист въздух и движение за здравето.' },
          { t: 'Нося бутилка за многократна употреба.', bin: 0, why: 'По-малко пластмасови отпадъци.' },
          { t: 'Късам цветя от защитена местност.', bin: 1, why: 'Защитените растения се пазят по закон.' },
        ],
        hint: 'Помогнах ли на природата или ѝ навредих?',
        onDone: (m) => {
          choice(ctx, {
            q: 'В класа обсъждате как да намалите отпадъците в училище. Кое предложение е най-добро?',
            options: [
              { t: 'Разделно събиране, бутилки за многократна употреба и по-малко опаковки.', ok: true, why: 'Вярно! Всеки може да направи нещо — и заедно се получава много.' },
              { t: 'Да изгаряме отпадъците в двора.', ok: false, why: 'Изгарянето замърсява въздуха с вредни вещества.' },
              { t: 'Това не е наша работа — нека общината се грижи.', ok: false, why: 'Всеки носи лична отговорност. Какво можем да направим ние?' },
            ],
            hint: 'Кое намалява отпадъците, без да вреди на въздуха?',
            mistakes: m,
            onRight: (m2) => { ctx.scores[2] = stepScore(m2, 3); finishBtn(ctx, onComplete, restart); },
          });
        },
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
  return { dispose() { note.remove(); stage.dispose(); } };
}
