// 6.3.2 „Дразнимост и движение“ — маса с млад слънчоглед, мимоза, стрък под лампа и прозрачна схема на куче
// с нервна система, кости и мускули (не в мащаб).
// Стъпки: опознай → растенията реагират: стрък и лампа (симулация), мимоза → как се движи кучето (нервна и опорно-двигателна
// система) → общо и различно, предскажи.
import { mat, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore, labRoom } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { curveOf, organMat, glowOf, tube } from './anatomy.js';
import { sunflowerModel, potModel, ballModel } from './nature3.js';
import { badge, spot, tagOn, glassMammal } from './bio6.js';

const SX = -0.9; // стрък под лампа
const DX = 2.7; // куче
const LAMP = { left: -1, top: 0, right: 1 };

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Растенията реагират', 'Как се движи кучето', 'Общо и различно'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xf1f5ea, camPos: [0, 4, 11], target: [0, 1.2, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 13, d: 4.6 });
  const note = badge(shell, '⚠ Схема — не е в мащаб');

  // ---------- Млад слънчоглед ----------
  const sunPot = potModel(0.3, 0.45); sunPot.position.set(-4.3, 0, 0); scene.add(sunPot);
  const sf = sunflowerModel(1.5); sf.position.y = sunPot.userData.soilY ?? 0.42; sunPot.add(sf);
  const sfHead = sf.userData.head;
  const sunAt = spot(sunPot, 'sunflower', [0, 1.9, 0], 0.4);

  // ---------- Мимоза ----------
  const mim = potModel(0.28, 0.4); mim.position.set(-2.8, 0, 0.2); scene.add(mim);
  const mimTop = new THREE.Group(); mimTop.position.y = mim.userData.soilY ?? 0.38; mim.add(mimTop);
  { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.9, 6), mat(0x6d8f3a)); st.position.y = 0.45; mimTop.add(st); }
  const leafletM = mat(0x5aa83c, { side: THREE.DoubleSide });
  const mimLeaves = [];
  for (let i = 0; i < 6; i++) {
    const pet = new THREE.Group(); pet.position.y = 0.3 + (i % 3) * 0.22; pet.rotation.y = i * 1.05; mimTop.add(pet);
    const tilt = new THREE.Group(); tilt.rotation.z = -0.25; pet.add(tilt);
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 4), mat(0x6d8f3a)); axis.rotation.z = Math.PI / 2; axis.position.x = 0.21; tilt.add(axis);
    const pairs = [];
    for (let k = 0; k < 8; k++) for (const s of [1, -1]) {
      const h = new THREE.Group(); h.position.set(0.07 + k * 0.045, 0, 0); tilt.add(h);
      const lf = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), leafletM); lf.scale.set(0.6, 0.12, 1.4); lf.position.z = s * 0.04; h.add(lf);
      h.userData.s = s; pairs.push(h);
    }
    mimLeaves.push({ tilt, pairs });
  }
  const mimAt = spot(mim, 'mimosa', [0, 0.9, 0], 0.45);
  const M = { fold: 0, target: 0, timer: 0 };

  // ---------- Стрък и лампа ----------
  const box = new THREE.Group(); box.position.set(SX, 0, 0.2); scene.add(box);
  const sp = potModel(0.22, 0.3); box.add(sp);
  const segs = [];
  let parent = new THREE.Group(); parent.position.y = sp.userData.soilY ?? 0.28; sp.add(parent);
  const stemM = mat(0x7cb342);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Group(); parent.add(s);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 8), stemM); c.position.y = 0.11; s.add(c);
    const nx = new THREE.Group(); nx.position.y = 0.22; s.add(nx);
    segs.push(s); parent = nx;
  }
  for (const s of [1, -1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6), mat(0x43a047, { side: THREE.DoubleSide })); l.scale.set(1.4, 0.12, 0.7); l.position.set(s * 0.12, 0.02, 0); l.rotation.z = s * 0.4; parent.add(l); }
  const lampG = new THREE.Group(); box.add(lampG);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff59d })); lampG.add(bulb);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 16, 1, true), mat(0x26a69a, { side: THREE.DoubleSide })); lampG.add(shade);
  const rays = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff59d, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })); lampG.add(rays);
  const placeLamp = (p) => {
    const d = LAMP[p];
    if (d === 0) { lampG.position.set(0, 2.1, 0); lampG.rotation.z = 0; } else { lampG.position.set(d * 1.0, 1.0, 0); lampG.rotation.z = -d * Math.PI / 2; }
    shade.position.y = 0.05; bulb.position.y = -0.05; rays.position.y = -0.55; rays.rotation.x = Math.PI;
  };
  const seedAt = spot(box, 'seedling', [0, 0.9, 0], 0.4);
  const P = { lamp: 'left', days: 0, run: null };
  const bend = () => LAMP[P.lamp] * (P.days / 5) * 1.1; // общ ъгъл на огъване (радиани)
  const setStem = () => { const b = bend(); segs.forEach((s, i) => { s.rotation.z = -(b / 5) * (0.4 + i * 0.3); }); };
  placeLamp('left'); setStem();

  // ---------- Прозрачно куче ----------
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.12, 30), mat(0xb0bec5)); stand.position.set(DX, 0.06, 0); scene.add(stand);
  const dog = glassMammal({ color: 0xd7b48a }); dog.position.set(DX, 0.12, 0); scene.add(dog);
  const head = dog.userData.head;
  const brain = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), organMat(0xf48fb1)); brain.scale.set(1.2, 0.85, 0.9); brain.position.set(-0.05, 0.08, 0); head.add(brain);
  const eye = spot(head, null, [0.28, 0.1, 0.18]);
  const nervM = organMat(0xfdd835);
  const spinalC = curveOf([[0.95, 1.36, 0], [0.6, 1.38, 0], [0, 1.4, 0], [-0.6, 1.36, 0], [-0.75, 1.3, 0]]);
  const spinal = tube(spinalC, 0.03, nervM, 40); dog.add(spinal);
  const optic = tube(curveOf([[1.33, 1.43, 0.15], [1.15, 1.42, 0.05], [1.0, 1.4, 0]]), 0.015, nervM, 10); dog.add(optic);
  // гръбначен стълб (прешлени)
  const vertM = organMat(0xf5f5f5);
  for (let i = 0; i < 14; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.1), vertM); const p = spinalC.getPoint(i / 13); v.position.set(p.x, p.y + 0.06, 0); dog.add(v); }
  const legs = dog.userData.legs;
  const legBits = legs.map((hip, i) => {
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 8), organMat(0xfafafa)); bone.position.y = -0.33; hip.add(bone);
    const mus = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 8), organMat(0xd84343)); mus.position.set(0.03, -0.2, 0); hip.add(mus);
    const nerve = tube([[0.0, 0.05, 0.04], [0.05, -0.2, 0.05], [0.04, -0.6, 0.05]], 0.012, nervM, 10); hip.add(nerve);
    const hp = hip.position;
    dog.add(tube([[hp.x, 1.36, 0], [hp.x, 1.1, hp.z * 0.6], [hp.x, hp.y + 0.05, hp.z]], 0.014, nervM, 12));
    return { bone, mus, nerve, i };
  });
  const FL = legBits[0];
  FL.nerve.material = organMat(0xfdd835); FL.mus.material = organMat(0xd84343); FL.bone.material = organMat(0xfafafa);
  const dGlow = { brain: glowOf(brain), spinal: glowOf(spinal) };
  dGlow.nerve = { set: (k, c) => { FL.nerve.material.emissive.set(c ?? 0xfdd835); FL.nerve.material.emissiveIntensity = k; } };
  dGlow.muscle = { set: (k, c) => { FL.mus.material.emissive.set(c ?? 0xd84343); FL.mus.material.emissiveIntensity = k; FL.bone.material.emissive.set(c ?? 0xffffff); FL.bone.material.emissiveIntensity = k * 0.6; } };
  dGlow.eye = { set: () => {} };
  const dat = {
    brainDog: spot(head, 'brainDog', [-0.05, 0.08, 0], 0.2),
    spinal: spot(dog, 'spinal', [0, 1.4, 0], 0.2),
    nerve: spot(legs[0], 'nerve', [0.05, -0.15, 0.06], 0.16),
    muscle: spot(legs[0], 'muscle', [0.03, -0.42, 0], 0.16),
    eye,
  };
  const ball = ballModel(); ball.scale.setScalar(0.6); ball.position.set(DX + 1.9, 0, 0.6); scene.add(ball);
  tagOn(stage, dog, 'схема на куче', [0, 1.95, 0], 0.18);

  // ---------- Жива сцена ----------
  const D = { walk: 0, speed: 0, cut: false };
  stage.tick((dt, t) => {
    sfHead.rotation.y = Math.sin(t * 0.25) * 0.5;
    // мимоза
    if (M.timer > 0) { M.timer -= dt; if (M.timer <= 0) M.target = 0; }
    M.fold += (M.target - M.fold) * Math.min(1, dt * (M.target ? 8 : 1.2));
    mimLeaves.forEach((L, i) => { L.tilt.rotation.z = -0.25 - M.fold * 0.7 + Math.sin(t + i) * 0.03 * (1 - M.fold); L.pairs.forEach((h) => { h.rotation.x = h.userData.s * M.fold * 1.3; }); });
    // стрък
    if (P.run) { P.run.t += dt; P.days = Math.min(5, (P.run.t / 2.5) * 5); setStem(); if (P.days >= 5) { const d = P.run.done; P.run = null; d(); } }
    rays.material.opacity = 0.14 + Math.sin(t * 3) * 0.04;
    // куче
    D.walk += dt * 6 * D.speed;
    legs.forEach((lg, i) => { lg.rotation.z = (D.cut && i === 0) ? 0 : Math.sin(D.walk + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.45 * D.speed; });
    if (!D.speed) legs.forEach((lg) => { lg.rotation.z *= 0.9; });
    head.rotation.z = Math.sin(t * 0.9) * 0.05;
    ball.rotation.z -= dt * 0.6;
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    Object.assign(P, { lamp: 'left', days: 0, run: null }); placeLamp('left'); setStem();
    D.speed = 0; D.cut = false; M.target = 0;
    Object.values(dGlow).forEach((g) => g.set(0));
    view(ctx, [0, 1.2, 0], 5.4, { halfH: 1.8, elev: 0.25 });
    const it = (id, label, icon, note, obj, dist = 3) => ({ id, label, icon, note, obj: () => obj, dist, lift: 0, bubble: 0.35 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Всички организми усещат промени около себе си и <b>отговарят</b> на тях. Растенията и животните и <b>се движат</b>, но по различен начин.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        it('sunflower', 'Млад слънчоглед', '🌻', 'Младите слънчогледи обръщат връхчето си след слънцето през деня. Цъфналите цветове вече остават обърнати на изток.', sunAt),
        it('mimosa', 'Мимоза', '🌿', 'Кликни я! При допир листчетата на мимозата бързо се сгъват, а след време отново се разтварят.', mimAt, 2.6),
        it('seedling', 'Стрък под лампа', '🌱', 'Стъблото на растението расте <b>към светлината</b>. Това е бавно движение чрез растеж.', seedAt),
        it('brainDog', 'Главен мозък', '🧠', 'Главният мозък приема сигналите от сетивата и изпраща команди до мускулите.', dat.brainDog, 2.6),
        it('spinal', 'Гръбначен мозък', '〰', 'Гръбначният мозък е в гръбначния стълб. По него минават сигналите между главния мозък и тялото.', dat.spinal, 3),
        it('nerve', 'Нерви', '⚡', 'Нервите са като кабели: носят сигнали от сетивата до мозъка и от мозъка до мускулите.', dat.nerve, 2.6),
        it('muscle', 'Мускул и кост', '🦴', 'Мускулите се <b>свиват</b> и дърпат костите. Костите са опората на тялото, а ставите ги свързват подвижно.', dat.muscle, 2.6),
      ],
      onNext: step2,
    });
    ctx.click = ((orig) => (id) => { if (id === 'mimosa') { M.target = 1; M.timer = 5; } orig(id); })(ctx.click);
  }

  // ---------- 2. Растенията реагират ----------
  function step2() {
    shell.step(1);
    view(ctx, [SX - 0.2, 1.1, 0.2], 1.7, { halfH: 1.2, elev: 0.2 });
    Object.assign(P, { lamp: 'left', days: 0 }); placeLamp('left'); setStem();
    shell.task('<p>Стрък расте в стая, в която светлината идва <b>само отляво</b> (от лампата).</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Как ще расте стъблото след няколко дни?',
      options: [
        { t: 'Ще се наведе към лампата.', ok: true, why: 'Да проверим! Плъзни дните.' },
        { t: 'Ще се наведе на обратната страна.', ok: false, why: 'Растението има нужда от светлина. Накъде е по-изгодно да расте?' },
        { t: 'Ще расте право нагоре, растенията не реагират.', ok: false, why: 'Растенията също отговарят на дразнения. Помисли за цветята на перваза.' },
      ],
      hint: 'Спомни си цветята на прозореца.',
      onRight: (m) => { mistakes = m; days(); },
    });
    function days() {
      shell.task(`<p>Плъзни <b>дните</b> и наблюдавай стъблото.</p>
        <label class="small">Дни: <b class="dv">0</b><input class="slider ds" type="range" min="0" max="5" step="1" value="0"></label>`);
      shell.setControls('');
      const sl = container.querySelector('.ds');
      sl.addEventListener('input', () => {
        P.days = +sl.value; container.querySelector('.dv').textContent = P.days; setStem();
        if (P.days >= 5 && !sl.disabled) {
          sl.disabled = true;
          ctx.say(seedAt, '✔ Стъблото се наведе към светлината. Засенчената му страна расте по-бързо и то се огъва към лампата.', 'good wide', 0.6);
          nextBtn(ctx, 'Опитай друго →', lampTask);
        }
      });
    }
    function lampTask() {
      ctx.clearTip();
      P.days = 0; setStem();
      shell.task('<p>Нов стрък. Къде да е лампата, за да расте стъблото <b>право нагоре</b>?</p>');
      const c = shell.setControls(`<div class="choices">${Object.keys(LAMP).map((p) => `<button class="choice lp" data-p="${p}">${{ left: '⬅ Отляво', top: '⬆ Отгоре', right: 'Отдясно ➡' }[p]}</button>`).join('')}</div>
        <div class="row"><button class="btn primary run">▶ Пусни 5 дни</button></div>`);
      ctx.answer = 'top';
      c.querySelectorAll('.lp').forEach((b) => b.addEventListener('click', () => { if (P.run) return; P.lamp = b.dataset.p; placeLamp(P.lamp); P.days = 0; setStem(); c.querySelectorAll('.lp').forEach((x) => x.classList.toggle('right', x === b)); }));
      const run = c.querySelector('.run');
      run.addEventListener('click', () => {
        if (P.run) return;
        P.days = 0; ctx.clearTip(); run.disabled = true;
        P.run = { t: 0, done: () => {
          run.disabled = false;
          if (P.lamp !== 'top') { ctx.say(seedAt, 'Стъблото пак се наведе — към лампата. Опитай друго място.', 'bad wide', 0.6); return; }
          run.disabled = true; ctx.answer = null;
          c.querySelectorAll('.lp').forEach((x) => { x.disabled = true; });
          ctx.say(seedAt, '✔ Когато светлината идва отгоре, стъблото расте право. Растението „усеща“ откъде идва светлината.', 'good wide', 0.6);
          nextBtn(ctx, 'Към мимозата →', mimosa);
        } };
      });
    }
    function mimosa() {
      ctx.clearTip();
      view(ctx, [-2.8, 0.9, 0.2], 1.0, { halfH: 0.9, elev: 0.3 });
      shell.task('<p>Растенията реагират и по-бързо. <b>Докосни мимозата</b> (кликни върху нея).</p>');
      shell.setControls('');
      ctx.click = (id) => {
        if (id !== 'mimosa') return;
        M.target = 1; M.timer = 5;
        ctx.click = null;
        ctx.say(mimAt, 'Листчетата се сгънаха за секунди! След време мимозата ги разтваря отново.', 'wide', 0.5);
        choice(ctx, {
          q: 'Как се нарича способността на организмите да отговарят на дразнения от средата?',
          options: [
            { t: 'Дразнимост.', ok: true, why: 'Вярно! Светлината и допирът са дразнения, а навеждането и сгъването — отговори.' },
            { t: 'Размножаване.', ok: false, why: 'Размножаването е създаване на потомство. Какво направи мимозата при допир?' },
            { t: 'Хранене.', ok: false, why: 'Мимозата не се храни с пръста ти. Тя отговори на допира.' },
          ],
          hint: 'Думата идва от „дразнение“.',
          mistakes,
          onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
        });
      };
    }
  }

  // ---------- 3. Как се движи кучето ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    ctx.click = null;
    view(ctx, [DX + 0.5, 1.0, 0], 1.9, { halfH: 1.1, elev: 0.15 });
    shell.task('<p>Кучето вижда топката и тича към нея. Проследи по схемата как става това.</p>');
    const glowSeq = ['eye', 'brain', 'spinal', 'nerve', 'muscle', 'muscle'];
    const anchors = [dat.eye, dat.brainDog, dat.spinal, dat.nerve, dat.muscle, dat.muscle];
    const tags = ['око (сетиво)', 'главен мозък', 'гръбначен мозък', 'двигателен нерв', 'мускул', 'кост'];
    orderTask(ctx, {
      q: 'Подреди по ред.',
      items: ['Окото вижда топката — това е дразнението.', 'Нерв носи сигнала до главния мозък.', 'Главният мозък изпраща команда по гръбначния мозък.', 'Нерв носи командата до мускулите на краката.', 'Мускулите се свиват.', 'Мускулите дърпат костите и кучето тича.'],
      hint: 'Първо сетивото усеща, накрая се движат костите.',
      onPick: (i) => {
        Object.values(dGlow).forEach((g) => g.set(0));
        const g = dGlow[glowSeq[i]] || dGlow.brain; g.set(0.8, 0xffeb3b);
        if (i === 1) dGlow.brain.set(0.8, 0xffeb3b);
        ctx.say(anchors[i], tags[i], 'tag', 0.15);
        if (i === 5) D.speed = 1;
      },
      onDone: (m) => {
        Object.values(dGlow).forEach((g) => g.set(0));
        ctx.clearTip();
        shell.task('<p>Към коя система принадлежи всеки орган?</p>');
        const sh = (a, t) => () => ctx.say(a, t, 'tag', 0.15);
        sortTask(ctx, {
          bins: ['Нервна система', 'Опорно-двигателна система'],
          items: [
            { t: 'главен мозък', bin: 0, show: sh(dat.brainDog, 'главен мозък'), why: 'Главният мозък управлява.' },
            { t: 'гръбначен мозък', bin: 0, show: sh(dat.spinal, 'гръбначен мозък'), why: 'Той провежда сигнали — част е от нервната система.', no: 'Гръбначният мозък е в гръбначния стълб, но е нервна тъкан. Какво прави?' },
            { t: 'нерви', bin: 0, show: sh(dat.nerve, 'нерв'), why: 'Нервите носят сигнали.' },
            { t: 'кости', bin: 1, show: sh(dat.muscle, 'кост'), why: 'Костите са опората.' },
            { t: 'мускули', bin: 1, show: sh(dat.muscle, 'мускул'), why: 'Мускулите движат костите.' },
            { t: 'гръбначен стълб (прешлени)', bin: 1, show: sh(dat.spinal, 'прешлени'), why: 'Прешлените са кости. Те пазят гръбначния мозък.', no: 'Прешлените са кости. Към коя система са костите?' },
          ],
          hint: 'Нервната система провежда сигнали, опорно-двигателната — държи и движи тялото.',
          mistakes: m,
          onDone: (m2) => {
            ctx.clearTip();
            choice(ctx, {
              q: 'Каква е връзката между нервната и опорно-двигателната система?',
              options: [
                { t: 'Нервната система дава команда, а мускулите и костите изпълняват движението.', ok: true, why: 'Вярно! Двете системи работят заедно.' },
                { t: 'Мускулите се свиват сами, без сигнал.', ok: false, why: 'Спомни си пътя: какво кара мускула да се свие?' },
                { t: 'Нямат връзка помежду си.', ok: false, why: 'Проследи пътя от окото до краката.' },
              ],
              hint: 'Кой дава команда и кой я изпълнява?',
              mistakes: m2,
              onRight: (m3) => { ctx.scores[1] = stepScore(m3, 3); nextBtn(ctx, 'Напред →', step4); },
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
    D.speed = 0.6;
    view(ctx, [0, 1.2, 0], 5.4, { halfH: 1.8, elev: 0.25 });
    shell.task('<p>Сравни движенията на растенията и животните.</p>');
    sortTask(ctx, {
      bins: ['Растения', 'Животни', 'И двете'],
      items: [
        { t: 'Отговарят на дразнения от средата.', bin: 2, why: 'Дразнимостта е свойство на всички живи организми.' },
        { t: 'Повечето се придвижват от място на място.', bin: 1, why: 'Животните търсят храна, бягат, мигрират.' },
        { t: 'Движат се бавно, най-често чрез растеж — към светлината или водата.', bin: 0, why: 'Като стръка под лампата.' },
        { t: 'Имат нервна система и мускули.', bin: 1, why: 'Растенията нямат нерви и мускули.' },
        { t: 'Движенията им помагат да оцелеят.', bin: 2, why: 'Към светлината — за храна; към топката, от врага — за живот.' },
      ],
      hint: 'Мимозата и стръкът нямат мускули, но реагират.',
      onDone: (m) => {
        view(ctx, [DX + 0.3, 1.0, 0], 1.9, { halfH: 1.1, elev: 0.15 });
        choice(ctx, {
          q: 'Ако нервът към предния крак на кучето е прекъснат, какво ще стане с този крак?',
          options: [
            { t: 'Няма да се движи, макар мускулът и костта да са здрави.', ok: true, why: 'Вярно! Без нерв командата не стига до мускула. Виж кучето.' },
            { t: 'Ще се движи както преди, щом мускулът е здрав.', ok: false, why: 'Мускулът се свива само по команда. Откъде идва тя?' },
            { t: 'Ще се движи по-бързо.', ok: false, why: 'Помисли какво носи нервът до мускула.' },
          ],
          hint: 'Командата пътува по нерва.',
          mistakes: m,
          onRight: (m2) => {
            D.cut = true; D.speed = 1;
            dGlow.nerve.set(0.7, 0x9e9e9e);
            ctx.say(dat.muscle, 'Предният крак не се движи: командата не стига до мускула. Затова пазим гръбнака и главата при игра и спорт.', 'wide', 0.4);
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
