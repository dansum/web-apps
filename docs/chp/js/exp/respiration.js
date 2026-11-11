// 5.3.3 „Дишане“ — опит с покълнали и сварени семена, аквариум с риба, жаба, бръмбар, растение и мишка-схема (не в мащаб).
// Стъпки: опознай → дишат ли семената (опит с варна вода и треска) → органи за дишане → пътят на кислорода и предсказване.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, stepScore } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { curveOf, flowDots, glassMat, organMat } from './anatomy.js';

const SAFE = '<p class="warn">⚠ Опитът с горяща треска се прави <b>само с възрастен</b>.</p>';

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Дишат ли семената?', 'Органи за дишане', 'Пътят на кислорода'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.8, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14, d: 4.8 });
  const tag = (g, t, y, s = 0.2) => { const l = labelSprite(t, { size: s }); l.position.y = y; g.add(l); stage.steadyLabel(l, 8); return l; };
  const note = document.createElement('div');
  note.textContent = '⚠ Мишката е схема, не е в мащаб';
  note.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:4;pointer-events:none;background:rgba(255,255,255,.9);color:#8a6d00;font-size:.78rem;border-radius:8px;padding:3px 8px';
  shell.stageEl.appendChild(note);

  // ---------- Буркани със семена ----------
  const jars = ['А', 'Б'].map((name, i) => {
    const g = new THREE.Group();
    const side = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 28, 1, true), glass(0.25)); side.position.y = 0.55;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 28), mat(0x8d6e63)); lid.position.y = 1.14;
    g.add(side, lid);
    for (let k = 0; k < 26; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(i ? 0xbcaaa4 : 0xf0d9a0)); s.scale.set(1.3, 0.8, 1);
      s.position.set((Math.random() - 0.5) * 0.6, 0.05 + Math.random() * 0.1, (Math.random() - 0.5) * 0.6); g.add(s);
      if (!i && k % 2) { const sprout = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 4), mat(0xf5f5dc)); sprout.position.copy(s.position); sprout.position.y += 0.07; sprout.rotation.z = Math.random() - 0.5; g.add(sprout); }
    }
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.22, 16, 1, true), glass(0.4)); cup.position.set(0.15, 0.3, 0.1);
    const lime = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0xe3f2fd, transparent: true, opacity: 0.55 })); lime.position.set(0.15, 0.27, 0.1);
    g.add(cup, lime);
    const splint = new THREE.Group();
    const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 5), mat(0xd7a86e)); wood.position.y = 0.35;
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb74d })); fl.scale.y = 1.8; fl.position.y = -0.02;
    splint.add(wood, fl); splint.position.set(-0.1, 0.55, 0); splint.visible = false; g.add(splint);
    g.position.set(-4.6 + i * 1.3, 0, 0.3);
    g.userData.pickId = 'jar-' + i;
    tag(g, `${name}: ${i ? 'сварени семена' : 'покълнали семена'}`, 1.45, 0.17);
    scene.add(g); addHitBox(g, 0.6);
    return { g, lime, splint, fl, milky: 0, target: 0 };
  });
  const jarsAt = new THREE.Object3D(); jarsAt.position.set(-3.95, 0.8, 0.3); scene.add(jarsAt);

  // ---------- Аквариум с риба ----------
  const aqua = new THREE.Group();
  { const tank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.7), glass(0.2)); tank.position.y = 0.45; const w = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.75, 0.64), new THREE.MeshStandardMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.35, depthWrite: false })); w.position.y = 0.4; aqua.add(tank, w);
    for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.35, 5), mat(0x2e7d32)); p.position.set(-0.6 + i * 0.07, 0.18, -0.2); aqua.add(p); } }
  const fish = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), mat(0xff8f00)); b.scale.set(1.6, 0.9, 0.6); const tl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 8), mat(0xff8f00)); tl.rotation.z = Math.PI / 2; tl.position.x = -0.3;
    const gill = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8, 0, Math.PI), mat(0xe65100)); gill.position.set(0.12, 0, 0.08); gill.rotation.y = 0.3; fish.add(b, tl, gill); fish.userData.gill = gill;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(0x212121)); eye.position.set(0.18, 0.04, 0.07); fish.add(eye); }
  fish.position.set(0, 0.45, 0); aqua.add(fish);
  const gillFlow = flowDots(curveOf([[0.45, 0.47, 0.02], [0.25, 0.46, 0.05], [0.12, 0.45, 0.1], [0.05, 0.42, 0.2]]), { n: 6, r: 0.018, color: 0x0277bd, speed: 0.3 });
  aqua.add(gillFlow);
  aqua.position.set(-1.4, 0, 0.2);
  aqua.userData.pickId = 'fish';
  tag(aqua, 'риба в аквариум', 1.1);
  scene.add(aqua); addHitBox(aqua, 0.8);
  // ---------- Жаба ----------
  const frog = new THREE.Group();
  { const m = mat(0x7cb342); const b = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), m); b.scale.set(1.2, 0.7, 1); b.position.y = 0.2;
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), m); h.position.set(0.25, 0.3, 0); const throat = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat(0xdce775)); throat.position.set(0.33, 0.2, 0); frog.userData.throat = throat;
    frog.add(b, h, throat);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0x212121)); e.position.set(0.3, 0.42, s * 0.09); frog.add(e); const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.25, 4, 8), m); leg.position.set(-0.2, 0.08, s * 0.25); leg.rotation.z = 1.2; frog.add(leg); } }
  frog.position.set(0.4, 0, 0.5); frog.userData.pickId = 'frog'; tag(frog, 'жаба', 0.7); scene.add(frog); addHitBox(frog, 0.6);
  // ---------- Бръмбар ----------
  const beetle = new THREE.Group();
  { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x1b5e20, { metalness: 0.4, roughness: 0.3 })); sh.scale.set(1.4, 0.8, 1); sh.position.y = 0.06;
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0x212121)); h.position.set(0.24, 0.06, 0); beetle.add(sh, h);
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 4), mat(0x212121)); l.position.set(-0.08 + i * 0.1, 0.04, s * 0.15); l.rotation.x = s * 1.1; beetle.add(l); }
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const sp = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), mat(0xffeb3b)); sp.position.set(-0.12 + i * 0.07, 0.05, s * 0.155); beetle.add(sp); } }
  beetle.position.set(1.3, 0, 0.7); beetle.userData.pickId = 'beetle'; tag(beetle, 'бръмбар', 0.45, 0.17); scene.add(beetle); addHitBox(beetle, 0.5);
  // ---------- Растение ----------
  const plant = new THREE.Group();
  { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.35, 16), mat(0xd7774a)); pot.position.y = 0.175; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), mat(0x558b2f)); st.position.y = 0.7; plant.add(pot, st);
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat(0x43a047)); l.scale.set(0.2, 0.025, 0.1); const s = i % 2 ? 1 : -1; l.position.set(s * 0.17, 0.6 + i * 0.12, 0); l.rotation.z = s * 0.4; plant.add(l); } }
  plant.position.set(2.2, 0, -0.4); plant.userData.pickId = 'plant'; tag(plant, 'растение', 1.3); scene.add(plant); addHitBox(plant, 0.6);
  // ---------- Мишка-схема ----------
  const mouse = new THREE.Group();
  const fur = glassMat(0xbdbdbd, 0.3);
  { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), fur); b.scale.set(0.8, 0.45, 0.42); b.position.y = 0.55; const h = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 18), fur); h.rotation.z = -Math.PI / 2; h.position.set(0.95, 0.65, 0);
    mouse.add(b, h);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), fur); e.position.set(0.75, 0.95, s * 0.17); mouse.add(e); }
    const tail = new THREE.Mesh(new THREE.TubeGeometry(curveOf([[-0.75, 0.5, 0], [-1.2, 0.35, 0.1], [-1.5, 0.5, 0]]), 12, 0.02, 5), mat(0xf8bbd0)); mouse.add(tail); }
  const trach = new THREE.Mesh(new THREE.TubeGeometry(curveOf([[1.2, 0.62, 0], [0.9, 0.65, 0], [0.6, 0.62, 0]]), 12, 0.03, 6), organMat(0xe9c3c3)); mouse.add(trach);
  const lungs = [];
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), organMat(0xf28b97, { emissive: 0xff4081, emissiveIntensity: 0 })); l.scale.set(1.2, 0.9, 0.8); l.position.set(0.42, 0.6, s * 0.12); mouse.add(l); lungs.push(l); }
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), organMat(0xc62828)); heart.position.set(0.35, 0.5, 0.05); mouse.add(heart);
  const mCells = new THREE.Group();
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), organMat(0xf8bbd0, { emissive: 0xff4081, emissiveIntensity: 0 })); c.position.set(-0.55 + (i % 3) * 0.06, 0.4 + Math.floor(i / 3) * 0.06, 0.2); mCells.add(c); }
  mouse.add(mCells);
  const airC = curveOf([[1.45, 0.65, 0], [1.2, 0.62, 0], [0.9, 0.65, 0], [0.6, 0.62, 0], [0.42, 0.6, 0.05]]);
  const bloodC = curveOf([[0.42, 0.58, 0.12], [0.35, 0.5, 0.15], [0.0, 0.45, 0.2], [-0.5, 0.42, 0.22], [-0.2, 0.6, 0.2], [0.3, 0.68, 0.15], [0.42, 0.58, 0.12]], true);
  mouse.add(new THREE.Mesh(new THREE.TubeGeometry(bloodC, 50, 0.018, 6, true), organMat(0xd32f2f)));
  const airDots = flowDots(airC, { n: 8, r: 0.03, color: 0x4fc3f7, speed: 0.5 }); airDots.visible = false; mouse.add(airDots);
  const o2Dots = flowDots(bloodC, { n: 12, r: 0.028, color: 0x29b6f6, speed: 0.5 }); o2Dots.visible = false; mouse.add(o2Dots);
  mouse.position.set(4.3, 0, 0.1); mouse.userData.pickId = 'mouse'; tag(mouse, 'мишка (схема)', 1.25); scene.add(mouse); addHitBox(mouse, 0.8);
  const M = { trace: 0 };

  stage.tick((dt, t) => {
    for (const j of jars) { j.milky += (j.target - j.milky) * Math.min(1, dt * 0.8); j.lime.material.color.setRGB(0.7 + j.milky * 0.3, 0.86 + j.milky * 0.14, 1); j.lime.material.opacity = 0.3 + j.milky * 0.65; j.fl.scale.y = 1.8 + Math.sin(t * 15) * 0.2; }
    fish.position.x = Math.sin(t * 0.5) * 0.35; fish.rotation.y = Math.cos(t * 0.5) > 0 ? 0 : Math.PI;
    fish.userData.gill.scale.setScalar(1 + Math.sin(t * 5) * 0.15);
    gillFlow.position.x = fish.position.x; gillFlow.userData.update(dt);
    frog.userData.throat.scale.setScalar(1 + Math.max(0, Math.sin(t * 3)) * 0.35);
    beetle.position.x = 1.3 + Math.sin(t * 0.4) * 0.15;
    plant.children.forEach((c, i) => { if (i > 1) c.rotation.x = Math.sin(t + i) * 0.05; });
    const br = Math.sin(t * 3);
    lungs.forEach((l) => l.scale.set(1.2 + br * 0.08, 0.9 + br * 0.06, 0.8));
    mouse.children[0].scale.y = 0.45 + br * 0.01;
    if (airDots.visible) airDots.userData.update(dt);
    if (o2Dots.visible) { o2Dots.userData.update(dt); mCells.children.forEach((c, i) => { c.material.emissiveIntensity = 0.3 + Math.sin(t * 3 + i) * 0.2; }); }
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    jars.forEach((j) => { j.target = 0; j.milky = 0; j.splint.visible = false; j.fl.visible = true; });
    airDots.visible = o2Dots.visible = false;
    view(ctx, [0, 0.7, 0.2], 6.4, { halfH: 1.8 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p><b>Дишането</b> е жизнен процес: организмът поема кислород и отделя въглероден диоксид. Така клетките получават енергия.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'jar-0', label: 'Буркани със семена', icon: '🫙', note: 'В буркан А има <b>покълнали</b> (живи) семена, а в Б — <b>сварени</b> (мъртви). В чашките има <b>варна вода</b>: тя помътнява от въглероден диоксид.', obj: () => jarsAt, dist: 3.2 },
        { id: 'fish', label: 'Риба', icon: '🐟', note: 'Рибата диша с <b>хриле</b>. Водата минава през тях и кислородът, разтворен във водата, преминава в кръвта.', obj: () => aqua, dist: 2.8 },
        { id: 'frog', label: 'Жаба', icon: '🐸', note: 'Жабата диша с <b>бели дробове</b>, а също и през тънката си влажна <b>кожа</b>.', obj: () => frog, dist: 2.2 },
        { id: 'beetle', label: 'Бръмбар', icon: '🪲', note: 'Насекомите дишат с <b>трахеи</b> — тънки тръбички. Въздухът влиза през малки отвори отстрани на тялото (жълтите точки).', obj: () => beetle, dist: 1.8 },
        { id: 'plant', label: 'Растение', icon: '🪴', note: 'Растенията също дишат: поемат кислород през малки отвори в листата — <b>устица</b>.', obj: () => plant, dist: 2.4 },
        { id: 'mouse', label: 'Мишка', icon: '🐭', note: 'Бозайниците дишат с <b>бели дробове</b>. Кръвта пренася кислорода до всички клетки.', obj: () => mouse, dist: 3 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Опит със семената ----------
  function step2() {
    shell.step(1);
    view(ctx, [-3.95, 0.7, 0.3], 1.6, { halfH: 1.0, elev: 0.3 });
    shell.task(`<p>Затваряме двата буркана за едно денонощие.</p>${SAFE}`);
    let mistakes = 0;
    choice(ctx, {
      q: 'В кой буркан варната вода ще помътнее?',
      options: [
        { t: 'В А — покълналите семена са живи и дишат.', ok: true, why: 'Да проверим!' },
        { t: 'В Б — при сварените семена.', ok: false, why: 'Могат ли мъртвите семена да дишат?' },
        { t: 'И в двата еднакво.', ok: false, why: 'Едните семена са живи, а другите — не. Кои дишат?' },
      ],
      hint: 'Варната вода помътнява от въглероден диоксид. Кой го отделя?',
      onRight: (m) => { mistakes = m; wait(); },
    });
    function wait() {
      const c = shell.controls;
      c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary day">⏳ Едно денонощие</button></div>');
      c.querySelector('.day').addEventListener('click', () => {
        c.querySelector('.day').disabled = true;
        jars[0].target = 1;
        setTimeout(() => {
          ctx.say(jars[0].g, 'Варната вода в А <b>помътня</b>: там има въглероден диоксид.', 'tag', 1.6);
          const cc = shell.setControls('<div class="row"><button class="btn primary spl">🔥 Внеси горяща треска</button></div>');
          cc.querySelector('.spl').addEventListener('click', () => {
            cc.querySelector('.spl').disabled = true;
            jars.forEach((j) => { j.splint.visible = true; });
            setTimeout(() => {
              jars[0].fl.visible = false;
              ctx.say(jars[0].g, 'В А треската <b>угасна</b>: семената са изразходвали кислорода. В Б гори.', 'wide', 1.6);
              choice(ctx, {
                q: 'Кое вещество поемат и кое отделят покълналите семена?',
                options: [
                  { t: 'Поемат кислород и отделят въглероден диоксид.', ok: true, why: 'Вярно! Така дишат всички живи организми.' },
                  { t: 'Поемат въглероден диоксид и отделят кислород.', ok: false, why: 'Защо тогава угасна треската и помътня варната вода?' },
                  { t: 'Не поемат и не отделят нищо.', ok: false, why: 'Нещо в буркана А се промени. Какво?' },
                ],
                hint: 'Огънят гори с кислород, а варната вода помътнява от въглероден диоксид.',
                mistakes,
                onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
              });
            }, 1800);
          }, { once: true });
        }, 2400);
      }, { once: true });
    }
  }

  // ---------- 3. Органи за дишане ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    jars.forEach((j) => { j.splint.visible = false; });
    view(ctx, [1.4, 0.6, 0.2], 3.8, { halfH: 1.2, elev: 0.4 });
    shell.task('<p>С какви органи диша всеки организъм?</p>');
    const look = (o, txt) => () => ctx.say(o, txt, 'tag', 0.8);
    sortTask(ctx, {
      bins: ['Хриле', 'Бели дробове', 'Трахеи', 'Устица на листата'],
      items: [
        { t: 'риба', bin: 0, show: look(aqua, '🐟'), why: 'Рибата диша с хриле — поема кислорода, разтворен във водата.' },
        { t: 'жаба', bin: 1, show: look(frog, '🐸'), why: 'Жабата диша с бели дробове и през влажната си кожа.', no: 'Възрастната жаба живее и на сушата. С какво диша там?' },
        { t: 'бръмбар', bin: 2, show: look(beetle, '🪲'), why: 'Насекомите дишат с трахеи.' },
        { t: 'мишка', bin: 1, show: look(mouse, '🐭'), why: 'Бозайниците дишат с бели дробове.' },
        { t: 'растение', bin: 3, show: look(plant, '🪴'), why: 'Растенията поемат кислород през устицата.' },
      ],
      hint: 'Водните животни с хриле, насекомите с трахеи, бозайниците с бели дробове.',
      onDone: (m) => { ctx.clearTip(); ctx.scores[1] = stepScore(m, 3); shell.msg('Браво!', 'good'); nextBtn(ctx, 'Напред →', step4); },
    });
  }

  // ---------- 4. Пътят на кислорода ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [4.2, 0.6, 0.1], 1.7, { halfH: 1.0, elev: 0.3 });
    airDots.visible = true; o2Dots.visible = true;
    shell.task('<p>Сините точки показват кислорода: от въздуха в белите дробове, после с кръвта до клетките.</p>');
    orderTask(ctx, {
      q: 'Проследи пътя на кислорода при бозайника.',
      items: ['въздух', 'нос', 'трахея', 'бели дробове', 'кръв', 'клетки'],
      hint: 'Въздухът влиза през носа, а кръвта разнася кислорода.',
      onDone: (m) => {
        ctx.say(mouse, 'В клетките кислородът помага да се освободи <b>енергия</b> от хранителните вещества. Въглеродният диоксид се връща с кръвта до белите дробове и се издишва.', 'wide', 1.3);
        choice(ctx, {
          q: 'Кога дишат растенията?',
          options: [
            { t: 'Постоянно — и денем, и нощем.', ok: true, why: 'Вярно! Фотосинтеза има само на светлина, а дишане — непрекъснато.' },
            { t: 'Само нощем.', ok: false, why: 'Клетките на растението имат нужда от енергия и денем. Спират ли да дишат?' },
            { t: 'Растенията не дишат.', ok: false, why: 'Спомни си покълналите семена.' },
          ],
          hint: 'Всяка жива клетка диша.',
          mistakes: m,
          onRight: (m2) => {
            ctx.clearTip();
            choice(ctx, {
              q: 'Защо дишането е важно за организмите?',
              options: [
                { t: 'Чрез него клетките получават енергия за живот.', ok: true, why: 'Вярно! Без дишане няма енергия и организмът загива.' },
                { t: 'Само за да издаваме звуци.', ok: false, why: 'Растенията и рибите не издават звуци, а дишат.' },
                { t: 'За да изстиваме.', ok: false, why: 'Какво получават клетките с помощта на кислорода?' },
              ],
              hint: 'Помисли какво се освобождава в клетките.',
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
