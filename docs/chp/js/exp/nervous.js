// 6.3.6 „Нервна и опорно-двигателна система на човека“ — прозрачният Боби (organs4.js) с мозък, гръбначен мозък, нерви,
// скелет и мускули; модел на крак за коленния рефлекс и аптечка с шина (не в мащаб).
// Стъпки: опознай → коленният рефлекс (чукче, прекъснат нерв) → функции, пътят на рефлекса и първа помощ при травми
// → какво пази нервната система, двигателен режим и отговорност.
import { mat, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { curveOf, organMat, glassMat, glowOf, tube } from './anatomy.js';
import { buildKid } from './organs4.js';
import { badge, spot, tagOn } from './bio6.js';

const KX = -2.6; // Боби
const LX = 0.9; // моделът на крака
const CALL = '<p class="warn">При тежка травма (на главата, гърба, счупване) не местим пострадалия и звъним на <b>112</b>.</p>';

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Коленният рефлекс', 'Функции и първа помощ', 'Пази нервната система'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xe8eef7, camPos: [0, 3, 11], target: [0, 2, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat(0xcfd8dc)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), mat(0xe3eaf3)); wall.position.set(0, 7, -3); scene.add(wall);
  const note = badge(shell, '⚠ Схема — не е в мащаб');
  const boneM = organMat(0xf5f0e1);
  const nervM = organMat(0xfdd835);
  const musM = organMat(0xd84343);

  // ---------- Боби ----------
  const K = buildKid();
  const kid = K.kid; kid.position.set(KX, 0, 0); scene.add(kid);
  kid.traverse((o) => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0x3f7fd6) { o.material.transparent = true; o.material.opacity = 0.3; o.material.depthWrite = false; } });
  const brain = new THREE.Mesh(new THREE.SphereGeometry(0.4, 22, 16), organMat(0xf8a5c2)); brain.scale.set(1.05, 0.8, 1); brain.position.set(0, 0.14, -0.05); K.head.add(brain);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 16), new THREE.MeshStandardMaterial({ color: 0xf5f0e1, transparent: true, opacity: 0.22, depthWrite: false })); skull.position.y = 0.08; K.head.add(skull);
  const spine = new THREE.Group(); kid.add(spine);
  for (let y = 1.45; y <= 3.62; y += 0.12) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.12), boneM); v.position.set(0, y, -0.28); spine.add(v); }
  const cordC = curveOf([[0, 3.62, -0.22], [0, 2.6, -0.22], [0, 1.6, -0.22]]);
  const cord = tube(cordC, 0.035, organMat(0xfdd835, { emissive: 0x000000 }), 20); kid.add(cord);
  const ribs = new THREE.Group(); kid.add(ribs);
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.44 - Math.abs(i - 2) * 0.02, 0.022, 6, 28), boneM); r.rotation.x = Math.PI / 2; r.scale.y = 0.62; r.position.set(0, 2.45 + i * 0.13, -0.02); ribs.add(r); }
  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 8, 24), boneM); pelvis.rotation.x = Math.PI / 2 - 0.3; pelvis.scale.y = 0.6; pelvis.position.y = 1.32; kid.add(pelvis);
  const nerveMats = [];
  const limbNerve = (g, len, x = 0.06) => { const m = organMat(0xfdd835, { emissive: 0x000000 }); nerveMats.push(m); g.add(tube([[x, 0, 0.05], [x, -len * 0.5, 0.07], [x * 0.5, -len, 0.06]], 0.014, m, 12)); };
  K.arms.forEach((a, i) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8), boneM); b.position.y = -0.7; a.add(b);
    limbNerve(a, 1.35);
    if (i === 0) { const mm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 8), musM); mm.position.set(0, -0.42, 0.06); a.add(mm); }
    kid.add(tube([[0, 3.3, -0.22], [a.position.x * 0.6, 3.1, -0.05], [a.position.x, 2.95, 0.05]], 0.014, nervM, 10));
  });
  K.legs.forEach((l) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.95, 8), boneM); b.position.y = -0.5; l.add(b);
    const mm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.32, 4, 8), musM); mm.position.set(0, -0.3, 0.1); l.add(mm);
    limbNerve(l, 0.95, 0.07);
    kid.add(tube([[0, 1.6, -0.22], [l.position.x * 0.6, 1.4, -0.1], [l.position.x, 1.15, 0.05]], 0.014, nervM, 10));
  });
  const at = {
    brain: spot(K.head, 'brain', [0, 0.14, 0], 0.35),
    spinal: spot(kid, 'spinal', [0, 2.2, -0.2], 0.25),
    nerves: spot(K.arms[1], 'nerves', [0.06, -0.8, 0.06], 0.2),
    skeleton: spot(kid, 'skeleton', [0.2, 2.75, 0.1], 0.3),
    bone: spot(K.legs[1], 'bone', [0, -0.5, 0], 0.2),
    muscle: spot(K.arms[0], 'muscle', [0, -0.42, 0.06], 0.18),
  };
  const kGlow = { brain: glowOf(brain), cord: glowOf(cord) };

  // ---------- Модел на крак: коленен рефлекс ----------
  const leg = new THREE.Group(); leg.position.set(LX, 0, 0.2); scene.add(leg);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.8), mat(0x8d6e63)); seat.position.set(0.8, 1.55, 0); leg.add(seat);
  for (const x of [0.2, 1.38]) for (const z of [-0.3, 0.3]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), mat(0x6d4c41)); p.position.set(x, 0.75, z); leg.add(p); }
  const skinM = glassMat(0xffc8a2, 0.28);
  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.3, 6, 14), skinM); thigh.rotation.z = Math.PI / 2; thigh.position.set(0.95, 1.86, 0); leg.add(thigh);
  const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 1.35, 8), boneM); femur.rotation.z = Math.PI / 2; femur.position.set(0.95, 1.84, 0); leg.add(femur);
  const quadM = organMat(0xd84343, { emissive: 0x000000 });
  const quad = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.9, 4, 10), quadM); quad.rotation.z = Math.PI / 2; quad.position.set(1.0, 1.98, 0); leg.add(quad);
  const patella = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), boneM); patella.scale.set(0.6, 1, 1); patella.position.set(1.78, 1.86, 0); leg.add(patella);
  const knee = new THREE.Group(); knee.position.set(1.7, 1.84, 0); leg.add(knee);
  const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.1, 6, 14), skinM); shin.position.y = -0.7; knee.add(shin);
  const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 1.2, 8), boneM); tibia.position.y = -0.7; knee.add(tibia);
  const tendon = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), organMat(0xeeeeee)); tendon.position.set(0.1, -0.16, 0); knee.add(tendon);
  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })); foot.scale.set(1.5, 0.6, 0.9); foot.position.set(0.12, -1.38, 0); knee.add(foot);
  const tendonAt = spot(knee, 'tendon', [0.16, -0.17, 0], 0.13);
  const thighAt = spot(leg, 'thigh', [0.7, 2.0, 0], 0.22);
  // гръбначен мозък (отрязък) и два нерва
  const seg = new THREE.Group(); seg.position.set(-0.35, 0, 0); leg.add(seg);
  for (let y = 1.5; y <= 2.8; y += 0.2) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.34), new THREE.MeshStandardMaterial({ color: 0xf5f0e1, transparent: true, opacity: 0.35, depthWrite: false })); v.position.y = y; seg.add(v); }
  const segCord = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 12), organMat(0xfdd835, { emissive: 0x000000 })); segCord.position.y = 2.15; seg.add(segCord);
  const sensC = curveOf([[1.75, 1.72, 0.12], [1.3, 2.25, 0.15], [0.4, 2.45, 0.12], [-0.35, 2.3, 0.04]]);
  const motC = curveOf([[-0.35, 2.15, -0.04], [0.2, 2.25, -0.12], [0.8, 2.15, -0.1], [1.0, 2.05, -0.02]]);
  const sensM = organMat(0x42a5f5, { emissive: 0x000000 });
  const motM = organMat(0xff9800, { emissive: 0x000000 });
  const sens = tube(sensC, 0.022, sensM, 30); leg.add(sens);
  const mot = tube(motC, 0.022, motM, 30); leg.add(mot);
  const cutMark = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 14), mat(0x424242)); cutMark.position.copy(motC.getPoint(0.5)); cutMark.visible = false; leg.add(cutMark);
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); pulse.visible = false; leg.add(pulse);
  const segAt = spot(seg, null, [0, 2.2, 0]);
  tagOn(stage, seg, 'гръбначен мозък', [0, 3.05, 0], 0.2);
  tagOn(stage, leg, 'сетивен нерв', [0.9, 2.62, 0.15], 0.2);
  tagOn(stage, leg, 'двигателен нерв', [0.3, 2.05, 0.2], 0.2);
  // чукче
  const hammer = new THREE.Group(); leg.add(hammer); hammer.position.set(2.35, 1.5, 0.1);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), mat(0x90a4ae)); handle.position.y = 0.35; hammer.add(handle);
  const hhead = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 3), mat(0xe53935)); hhead.rotation.z = Math.PI / 2; hhead.position.set(-0.1, 0.72, 0); hammer.add(hhead);
  hammer.rotation.z = 0.5;

  // ---------- Аптечка и шина ----------
  const kit = new THREE.Group(); kit.position.set(4.3, 0, 0.6); scene.add(kit);
  const bx = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), mat(0xffffff)); bx.position.y = 0.25; kit.add(bx);
  for (const r of [0, Math.PI / 2]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.01), mat(0xe53935)); c.position.set(0, 0.28, 0.26); c.rotation.z = r; kit.add(c); }
  const splint = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.16), mat(0xffcc80)); splint.position.set(0, 0.55, 0); splint.rotation.z = 0.15; kit.add(splint);
  const bandage = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 14), mat(0xfafafa)); bandage.rotation.x = Math.PI / 2; bandage.position.set(0.55, 0.1, 0.4); kit.add(bandage);
  const splintAt = spot(kit, 'splint', [0, 0.55, 0], 0.4);

  // ---------- Жива сцена ----------
  const R = { phase: -1, t: 0, cut: false, done: null };
  stage.tick((dt, t) => {
    brain.scale.setScalar(1 + Math.sin(t * 2) * 0.01); brain.scale.y *= 0.8;
    nerveMats.forEach((m, i) => { m.emissive.set(0xffeb3b); m.emissiveIntensity = Math.max(0, Math.sin(t * 3 - i)) * 0.4; });
    K.arms[0].rotation.x = Math.sin(t * 0.8) * 0.12;
    K.head.rotation.y = Math.sin(t * 0.4) * 0.15;
    // рефлекс
    if (R.phase >= 0) {
      R.t += dt;
      if (R.phase === 0) { const k = Math.min(1, R.t / 0.35); hammer.rotation.z = 0.5 - Math.sin(k * Math.PI) * 0.75; if (k >= 1) { R.phase = 1; R.t = 0; pulse.visible = true; } }
      else if (R.phase === 1) { const k = Math.min(1, R.t / 0.7); sensC.getPoint(k, pulse.position); sensM.emissive.set(0x42a5f5); sensM.emissiveIntensity = 0.8; if (k >= 1) { R.phase = 2; R.t = 0; sensM.emissiveIntensity = 0; } }
      else if (R.phase === 2) { const k = Math.min(1, R.t / (R.cut ? 0.35 : 0.7)); motC.getPoint(k, pulse.position); motM.emissive.set(0xff9800); motM.emissiveIntensity = 0.8; segCord.material.emissive.set(0xffeb3b); segCord.material.emissiveIntensity = 0.6 * (1 - k);
        if (k >= 1) { R.phase = R.cut ? 4 : 3; R.t = 0; pulse.visible = false; motM.emissiveIntensity = 0; } }
      else if (R.phase === 3) { const k = Math.min(1, R.t / 0.8); const s = Math.sin(k * Math.PI); knee.rotation.z = s * 0.75; quad.scale.set(1 + s * 0.25, 1 - s * 0.12, 1 + s * 0.25); quadM.emissive.set(0xff5252); quadM.emissiveIntensity = s * 0.6; if (k >= 1) { R.phase = 4; } }
      if (R.phase === 4) { R.phase = -1; const d = R.done; R.done = null; d && d(); }
    } else { knee.rotation.z = Math.sin(t * 0.7) * 0.03; }
  });
  const tap = (done) => { if (R.phase >= 0) return; R.phase = 0; R.t = 0; R.done = done; };
  const setCut = (v) => { R.cut = v; cutMark.visible = v; motM.color.set(v ? 0x9e9e9e : 0xff9800); };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    setCut(false); R.phase = -1; pulse.visible = false; knee.rotation.z = 0;
    Object.values(kGlow).forEach((g) => g.set(0));
    view(ctx, [0.6, 2.2, 0], 5.0, { halfH: 2.5, elev: 0.1 });
    const it = (id, label, icon, n, obj, dist = 3) => ({ id, label, icon, note: n, obj: () => obj, dist, lift: 0, bubble: 0.35 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p><b>Нервната система</b> управлява тялото. <b>Опорно-двигателната система</b> (кости, стави, мускули) го държи и движи.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        it('brain', 'Главен мозък', '🧠', 'Главният мозък е в черепа. С него мислим, помним, учим и управляваме движенията. Той приема сигналите от сетивата.', at.brain, 3.2),
        it('spinal', 'Гръбначен мозък', '〰', 'Гръбначният мозък е в канала на гръбначния стълб. Свързва главния мозък с тялото и управлява простите рефлекси.', at.spinal, 3.4),
        it('nerves', 'Нерви', '⚡', 'Нервите са снопове от нервни влакна. <b>Сетивните</b> носят сигнали към мозъка, а <b>двигателните</b> — команди към мускулите.', at.nerves, 3),
        it('skeleton', 'Скелет', '🦴', 'Скелетът е опората на тялото. Черепът пази главния мозък, гръдният кош — сърцето и белите дробове, а гръбначният стълб — гръбначния мозък.', at.skeleton, 3.6),
        it('bone', 'Бедрена кост', '🦵', 'Бедрената кост е най-дългата и здрава кост в тялото. Костите са свързани в <b>стави</b>, които позволяват движение.', at.bone, 3),
        it('muscle', 'Мускул', '💪', 'Скелетните мускули се прикрепват към костите със сухожилия. Когато мускулът се <b>свие</b>, той дърпа костта.', at.muscle, 3),
        it('splint', 'Аптечка и шина', '🩹', 'Шината служи за <b>обездвижване</b> на крайника при счупване, докато пострадалият стигне до лекар.', splintAt, 3),
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Коленният рефлекс ----------
  function step2() {
    shell.step(1);
    view(ctx, [LX + 0.8, 1.7, 0.2], 1.6, { halfH: 1.5, elev: 0.12 });
    shell.task('<p>Лекарят проверява нервната система. Детето седи, а кракът му виси свободно. Лекарят чука леко с гумено чукче <b>точно под капачката</b>.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще стане?',
      options: [
        { t: 'Кракът ще подскочи сам, без да мислим за това.', ok: true, why: 'Да проверим! Кликни точно под капачката.' },
        { t: 'Нищо, ако не решим да мръднем крака.', ok: false, why: 'Има движения, които стават без да мислим. Кои са те?' },
        { t: 'Кракът ще се сгъне още повече.', ok: false, why: 'Кой мускул е над коляното и какво прави, когато се свие?' },
      ],
      hint: 'Това е рефлекс — бърз отговор без мислене.',
      onRight: (m) => { mistakes = m; tapIt(); },
    });
    function tapIt() {
      shell.setControls('');
      ctx.click = (id) => {
        if (id === 'thigh') { shell.msg('Тук нищо не става. Потърси мястото точно под капачката.', ''); return; }
        if (id !== 'tendon') return;
        ctx.click = null;
        ctx.clearTip();
        shell.msg('');
        tap(() => {
          ctx.say(segAt, '✔ Сигналът (бяла точка) мина по <b>сетивния нерв</b> до гръбначния мозък и веднага се върна по <b>двигателния нерв</b>. Мускулът се сви и кракът подскочи. Главният мозък научава за това едва после.', 'good wide', 0.9);
          shell.task('<p>Какво ще стане, ако <b>двигателният нерв</b> е увреден? Прекъсни го и чукни пак.</p>');
          const c = shell.setControls('<div class="row"><button class="btn primary cut">✂ Прекъсни двигателния нерв</button></div>');
          c.querySelector('.cut').addEventListener('click', () => {
            setCut(true); c.querySelector('.cut').disabled = true; ctx.clearTip();
            ctx.click = (id2) => {
              if (id2 !== 'tendon') return;
              ctx.click = null;
              tap(() => {
                ctx.say(segAt, 'Сигналът стигна до гръбначния мозък, но командата не стигна до мускула. Кракът не помръдна, макар мускулът и костта да са здрави.', 'wide', 0.9);
                choice(ctx, {
                  q: 'Защо коленният рефлекс е толкова бърз?',
                  options: [
                    { t: 'Сигналът се превключва в гръбначния мозък и пътят е къс.', ok: true, why: 'Вярно! Рефлексите ни пазят — например бързо дърпаме ръка от горещото.' },
                    { t: 'Защото главният мозък мисли много бързо.', ok: false, why: 'Проследи бялата точка: стигна ли до главния мозък?' },
                    { t: 'Защото мускулът се свива сам, без нерв.', ok: false, why: 'Видя какво стана, когато нервът беше прекъснат.' },
                  ],
                  hint: 'Виж къде се обърна бялата точка.',
                  mistakes,
                  onRight: (m) => { setCut(false); ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
                });
              });
            };
          });
        });
      };
      shell.msg('Кликни с чукчето точно под капачката.', '');
    }
  }

  // ---------- 3. Функции и първа помощ ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    ctx.click = null;
    view(ctx, [KX + 0.3, 2.4, 0], 1.8, { halfH: 2.2, elev: 0.1 });
    shell.task('<p>Каква е основната задача на всяка част?</p>');
    const sh = (id, t) => () => { Object.values(kGlow).forEach((g) => g.set(0)); if (id === 'brain') kGlow.brain.set(0.6, 0xffeb3b); if (id === 'spinal') kGlow.cord.set(0.8, 0xffeb3b); ctx.say(at[id], t, 'tag', 0.2); };
    sortTask(ctx, {
      bins: ['Главен мозък', 'Гръбначен мозък', 'Кости', 'Мускули'],
      items: [
        { t: 'Мисли, помни и управлява съзнателните движения.', bin: 0, show: sh('brain', 'главен мозък'), why: 'Главният мозък е „командният център“.' },
        { t: 'Провежда сигнали между главния мозък и тялото и управлява простите рефлекси.', bin: 1, show: sh('spinal', 'гръбначен мозък'), why: 'Като при коленния рефлекс.' },
        { t: 'Опора на тялото и защита на вътрешните органи.', bin: 2, show: sh('skeleton', 'скелет'), why: 'Черепът и гръдният кош пазят органите.' },
        { t: 'Свиват се и движат костите.', bin: 3, show: sh('muscle', 'мускул'), why: 'Мускулите са „двигателят“.' },
      ],
      hint: 'Кой мисли, кой провежда, кой държи, кой движи?',
      onDone: (m) => {
        Object.values(kGlow).forEach((g) => g.set(0));
        ctx.clearTip();
        view(ctx, [4.3, 0.6, 0.6], 1.3, { halfH: 0.8, elev: 0.35 });
        shell.task(`<p>Съученик падна и вероятно си е <b>счупил ръката</b>. Кое е правилно?</p>${CALL}`);
        sortTask(ctx, {
          bins: ['Правилно', 'Неправилно'],
          items: [
            { t: 'Обездвижвам ръката с шина, която хваща двете съседни стави.', bin: 0, why: 'Обездвижването пази от болка и ново нараняване.' },
            { t: 'Опитвам се да наместя костта.', bin: 1, why: 'Наместването се прави само от лекар.' },
            { t: 'Повиквам възрастен и търсим лекарска помощ.', bin: 0, why: 'Счупването се лекува от лекар.' },
            { t: 'Карам го да раздвижи ръката, за да „мине“.', bin: 1, why: 'Движението може да влоши нараняването.' },
            { t: 'При навяхване на глезена слагам студен компрес и не натоварвам крака.', bin: 0, why: 'Студът намалява отока и болката.' },
          ],
          hint: 'Главното е: не местим и не наместваме, обездвижваме и викаме помощ.',
          mistakes: m,
          onDone: (m2) => { ctx.scores[1] = stepScore(m2, 3); nextBtn(ctx, 'Напред →', step4); },
        });
      },
    });
  }

  // ---------- 4. Пази нервната система ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [KX + 0.3, 2.4, 0], 1.8, { halfH: 2.2, elev: 0.1 });
    kGlow.brain.set(0.25, 0x80deea);
    shell.task('<p>Как влияе всеки навик на нервната система?</p>');
    sortTask(ctx, {
      bins: ['Полезно', 'Вредно'],
      items: [
        { t: 'Спя достатъчно — поне 9 часа.', bin: 0, why: 'По време на сън мозъкът почива и подрежда наученото.' },
        { t: 'Играя на телефона до късно през нощта.', bin: 1, why: 'Светлината и възбудата пречат на съня.' },
        { t: 'Движа се всеки ден на чист въздух.', bin: 0, why: 'Движението подобрява настроението и вниманието.' },
        { t: 'Алкохол, цигари (и електронни) и наркотици.', bin: 1, why: 'Те увреждат нервната система, особено докато расте. Предизвикват зависимост.' },
        { t: 'Редувам учене и кратки почивки.', bin: 0, why: 'Така мозъкът се уморява по-малко.' },
        { t: 'Пия енергийни напитки, за да не спя.', bin: 1, why: 'Енергийните напитки не са подходящи за деца — нарушават съня и сърдечния ритъм.' },
      ],
      hint: 'Сънят, движението и почивката помагат.',
      onDone: (m) => {
        kGlow.brain.set(0);
        choice(ctx, {
          q: 'Защо редовното движение (двигателният режим) е важно за опорно-двигателната система?',
          options: [
            { t: 'Мускулите заякват, костите стават по-здрави, а ставите — по-подвижни.', ok: true, why: 'Вярно! Добре е да се движим поне един час на ден.' },
            { t: 'Не е важно — костите растат сами.', ok: false, why: 'Какво става с мускулите, ако дълго не се движим?' },
            { t: 'Важно е само за спортистите.', ok: false, why: 'Всяко тяло се нуждае от движение. Защо?' },
          ],
          hint: 'Помисли какво прави тренировката с мускула.',
          mistakes: m,
          onRight: (m2) => {
            choice(ctx, {
              q: 'Приятели те канят да скочиш с главата надолу в непознат вир. Кое е отговорното решение?',
              options: [
                { t: 'Отказвам — водата може да е плитка, а ударът в главата и гърба може да увреди гръбначния мозък.', ok: true, why: 'Вярно! Скачаме само на обозначени места и след като знаем колко е дълбоко.' },
                { t: 'Скачам, щом другите скачат.', ok: false, why: 'Отговорността за собственото здраве е твоя. Какво може да има под водата?' },
                { t: 'Скачам, но бързо.', ok: false, why: 'Скоростта не пази от камъни и плитка вода.' },
              ],
              hint: 'Помисли какво пази гръбначният стълб.',
              mistakes: m2,
              onRight: (m3) => { ctx.scores[2] = stepScore(m3, 3); finishBtn(ctx, onComplete, restart); },
            });
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
