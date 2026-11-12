// 5.3.8 „Единство на природата; човекът – част от природата“ — долина с река, скала, дърво, човек, гора на склона,
// село до реката и табела „Резерват“.
// Стъпки: опознай → пътят на една капка вода и свойствата на живата и неживата природа → гората и реката (симулация)
// → как човекът пази природата и здравето си.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { curveOf } from './anatomy.js';

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Живата и неживата природа', 'Гората и реката', 'Пази природата'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xbfe3f7, camPos: [0, 7, 12], target: [0, 0.5, 0], maxDistance: 30 } });
  const { shell, stage, scene } = ctx;
  const lbl = (g, t, y, s = 0.26) => { const l = labelSprite(t, { size: s }); l.position.y = y; g.add(l); stage.steadyLabel(l, 10); return l; };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat(0x9ccc65)); ground.rotation.x = -Math.PI / 2; scene.add(ground);

  // ---------- Река ----------
  const riverC = curveOf([[-9, 0.02, -4], [-5, 0.02, -2.5], [-2, 0.02, -0.5], [1, 0.02, 0.3], [4, 0.02, 1.5], [9, 0.02, 2.5]]);
  const rPts = riverC.getPoints(60);
  const rShape = new THREE.BufferGeometry();
  const verts = []; const idx = [];
  rPts.forEach((p, i) => { const tg = riverC.getTangent(i / 60); const n = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(0.45); verts.push(p.x + n.x, 0.03, p.z + n.z, p.x - n.x, 0.03, p.z - n.z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  rShape.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); rShape.setIndex(idx); rShape.computeVertexNormals();
  const riverM = new THREE.MeshStandardMaterial({ color: 0x29b6f6, side: THREE.DoubleSide, roughness: 0.2 });
  const river = new THREE.Mesh(rShape, riverM); scene.add(river);
  const riverAt = new THREE.Object3D(); riverAt.position.copy(riverC.getPoint(0.3)); riverAt.position.y = 0.2; scene.add(riverAt);
  riverAt.userData.pickId = 'river'; riverAt.add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
  lbl(riverAt, 'река', 0.4);
  const flood = new THREE.Mesh(new THREE.CircleGeometry(1.8, 28), new THREE.MeshStandardMaterial({ color: 0x8d6e63, transparent: true, opacity: 0, depthWrite: false }));
  flood.rotation.x = -Math.PI / 2; flood.position.set(5, 0.05, 2.0); scene.add(flood);

  // ---------- Склон с гора ----------
  const hill = new THREE.Mesh(new THREE.SphereGeometry(3.2, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7cb342, { flat: true }));
  hill.scale.set(1, 0.6, 1); hill.position.set(-5, 0, -6); scene.add(hill);
  const forest = []; const stumps = [];
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2; const r = Math.random() * 2.6;
    const x = -5 + Math.cos(a) * r; const z = -6 + Math.sin(a) * r;
    const y = Math.sqrt(Math.max(0, 1 - (r / 3.2) ** 2)) * 3.2 * 0.6;
    const t = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6), mat(0x6d4c41)); tr.position.y = 0.25;
    const cr = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 7), mat(0x2e7d32, { flat: true })); cr.position.y = 0.85;
    t.add(tr, cr); t.position.set(x, y - 0.05, z); scene.add(t); forest.push(t);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 6), mat(0x8d6e63)); st.position.set(x, y, z); st.visible = false; scene.add(st); stumps.push(st);
  }
  const forestAt = new THREE.Object3D(); forestAt.position.set(-5, 2.2, -6); scene.add(forestAt);
  const mud = [];
  for (let i = 0; i < 16; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(0x795548)); d.visible = false; d.userData.k = i / 16; scene.add(d); mud.push(d); }
  const mudC = curveOf([[-4.5, 1.8, -5.5], [-4.0, 0.6, -3.6], [-3.6, 0.1, -2.2], [-2, 0.05, -0.5]]);
  const rain = [];
  for (let i = 0; i < 60; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4), new THREE.MeshBasicMaterial({ color: 0x90caf9 })); d.visible = false; d.userData = { x: -8 + Math.random() * 10, z: -8 + Math.random() * 8, k: Math.random() }; scene.add(d); rain.push(d); }

  // ---------- Село ----------
  const village = new THREE.Group();
  [[4.2, 2.6], [5.4, 2.9], [5.0, 1.0]].forEach(([x, z], i) => { const h = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.7), mat([0xffe0b2, 0xffcc80, 0xd7ccc8][i])); b.position.y = 0.3; const r = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.4, 4), mat(0xc62828)); r.position.y = 0.8; r.rotation.y = Math.PI / 4; h.add(b, r); h.position.set(x, 0, z); village.add(h); });
  scene.add(village);
  const villageAt = new THREE.Object3D(); villageAt.position.set(5, 0.6, 2.2); scene.add(villageAt);
  // ---------- Скала, дърво, човек, табела, облак ----------
  const rock = new THREE.Group();
  { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), mat(0x9e9e9e, { flat: true })); r.scale.set(1.2, 0.8, 1); r.position.y = 0.5; rock.add(r); }
  rock.position.set(2.9, 0, -2.4); rock.userData.pickId = 'rock'; lbl(rock, 'скала', 1.4); scene.add(rock); addHitBox(rock, 0.8);
  const tree = new THREE.Group();
  { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8), mat(0x6d4c41)); tr.position.y = 0.7; const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), mat(0x43a047, { flat: true })); cr.position.y = 1.9; tree.add(tr, cr); }
  tree.position.set(1.4, 0, -1.6); tree.userData.pickId = 'tree'; lbl(tree, 'дърво', 3.0); scene.add(tree); addHitBox(tree, 0.8);
  const human = new THREE.Group();
  { const skin = mat(0xf6c9a5); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 6, 12), mat(0x42a5f5)); body.position.y = 1.0; const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), skin); head.position.y = 1.68;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 10, 0, Math.PI * 2, 0, 1.3), mat(0x5d4037)); hair.position.y = 1.7;
    human.add(body, head, hair);
    for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 4, 8), mat(0x5c6bc0)); leg.position.set(s * 0.1, 0.35, 0); human.add(leg); const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 4, 8), skin); arm.position.set(s * 0.3, 1.05, 0); human.add(arm); } }
  human.position.set(0.6, 0, 1.6); human.userData.pickId = 'human'; lbl(human, 'човек', 2.1); scene.add(human); addHitBox(human, 0.8);
  const sign = new THREE.Group();
  { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = '#2e7d32'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(6, 6, 244, 116); g.fillStyle = '#fff'; g.font = '700 40px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('РЕЗЕРВАТ', 128, 78);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); board.position.y = 1.2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), mat(0x6d4c41)); post.position.y = 0.6; sign.add(board, post); }
  sign.position.set(-2.4, 0, -3.2); sign.userData.pickId = 'reserve'; scene.add(sign); addHitBox(sign, 0.6);
  const cloud = new THREE.Group();
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.45 + (i % 2) * 0.15, 12, 10), mat(0xffffff)); c.position.set(i * 0.45 - 0.9, Math.sin(i) * 0.1, 0); cloud.add(c); }
  cloud.position.set(-0.5, 3.3, -1.2); cloud.userData.pickId = 'cloud'; scene.add(cloud); addHitBox(cloud, 1);
  // капката
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), new THREE.MeshStandardMaterial({ color: 0x0288d1, emissive: 0x0277bd, emissiveIntensity: 0.4 }));
  drop.scale.y = 1.25; drop.visible = false; scene.add(drop);
  const D = { curve: null, k: 1 };
  const posOf = { river: () => riverAt.position.clone(), cloud: () => cloud.position.clone().add(new THREE.Vector3(0, -0.4, 0)), tree: () => tree.position.clone().add(new THREE.Vector3(0, 1.9, 0)), human: () => human.position.clone().add(new THREE.Vector3(0, 1.3, 0.25)) };
  let dropAt = null;
  function moveDrop(id) {
    const to = posOf[id]();
    if (!dropAt) { drop.position.copy(to); dropAt = to; drop.visible = true; return; }
    const mid = dropAt.clone().lerp(to, 0.5); mid.y += 1.2;
    D.curve = new THREE.QuadraticBezierCurve3(dropAt.clone(), mid, to); D.k = 0; dropAt = to;
  }
  const E = { cut: false, raining: false, damage: 0 };

  stage.tick((dt, t) => {
    cloud.position.x = -0.5 + Math.sin(t * 0.15) * 0.8;
    if (D.curve && D.k < 1) { D.k = Math.min(1, D.k + dt * 0.9); D.curve.getPoint(D.k, drop.position); }
    tree.children[1].rotation.y = Math.sin(t * 0.6) * 0.05;
    human.rotation.y = Math.sin(t * 0.4) * 0.3;
    forest.forEach((f, i) => { f.rotation.z = Math.sin(t + i) * 0.03; });
    // дъжд и ерозия
    rain.forEach((r) => { r.visible = E.raining; if (!E.raining) return; const k = (r.userData.k + t * 0.9) % 1; r.position.set(r.userData.x, 5 - k * 5, r.userData.z); });
    const target = E.raining && E.cut ? 1 : E.cut ? E.damage : 0;
    E.damage += (target - E.damage) * Math.min(1, dt * 0.5);
    riverM.color.copy(new THREE.Color(0x29b6f6).lerp(new THREE.Color(0x8d6e63), E.damage));
    river.scale.set(1, 1, 1);
    flood.material.opacity = Math.max(0, E.damage - 0.4) * 1.2;
    hill.material.color.copy(new THREE.Color(0x7cb342).lerp(new THREE.Color(0xa1887f), E.cut ? 0.8 : 0));
    mud.forEach((m) => { m.visible = E.cut && E.raining; if (!m.visible) return; const k = (m.userData.k + t * 0.25) % 1; mudC.getPoint(k, m.position); });
    forest.forEach((f, i) => { f.visible = !E.cut; stumps[i].visible = E.cut; });
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    E.cut = false; E.raining = false; E.damage = 0; drop.visible = false; dropAt = null; D.k = 1;
    view(ctx, [0, 0.8, -0.5], 7.5, { halfH: 4, elev: 0.55 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Живата и неживата природа са свързани. Човекът също е част от природата.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'rock', label: 'Скала', icon: '🪨', note: 'Скалата е <b>нежива</b> природа. Тя не расте, не диша и не се размножава, но е изградена от вещества — като всичко на Земята.', obj: () => rock, dist: 3.5 },
        { id: 'tree', label: 'Дърво', icon: '🌳', note: 'Дървото е <b>живо</b>: храни се, диша, расте и се размножава. Взема вода и минерални соли от неживата природа.', obj: () => tree, dist: 4.5, lift: 1.2 },
        { id: 'human', label: 'Човек', icon: '🧍', note: 'Човекът е <b>част от природата</b>: диша въздух, пие вода, храни се с растения и животни.', obj: () => human, dist: 3.5, lift: 0.9 },
        { id: 'river', label: 'Река', icon: '🏞', note: 'Водата в реката е нежива природа, но без нея няма живот. Реката тече — и неживата природа може да се движи.', obj: () => riverAt, dist: 4 },
        { id: 'reserve', label: 'Табела „Резерват“', icon: '🪧', note: 'В <b>резервата</b> природата се пази почти недокосната. Там живеят редки растения и животни.', obj: () => sign, dist: 3.5, lift: 0.8 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Живата и неживата природа ----------
  function step2() {
    shell.step(1);
    view(ctx, [0, 1.6, 0], 4.2, { halfH: 2.6, elev: 0.3 });
    shell.task('<p>Водата е навсякъде: в реката, във въздуха, в растенията и в нас.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Може ли една и съща капка вода да бъде в реката, после в облак, после в дърво и накрая в човек?',
      options: [
        { t: 'Да: веществата преминават от неживата в живата природа и обратно.', ok: true, why: 'Да проследим капката!' },
        { t: 'Не: водата в живите организми е различна от водата в реката.', ok: false, why: 'Водата е едно и също вещество — откъдето и да идва. Къде отива водата, която пием?' },
        { t: 'Само ако е морска вода.', ok: false, why: 'Всяка вода участва в кръговрата. Какво става с водата от реката, когато се изпари?' },
      ],
      hint: 'Спомни си кръговрата на водата.',
      onRight: (m) => { mistakes = m; journey(); },
    });
    function journey() {
      const order = ['river', 'cloud', 'tree', 'human'];
      const text = { river: 'Капката е в реката.', cloud: 'Изпари се и стана част от облака.', tree: 'Падна с дъжда, корените я поеха и тя стигна до листата.', human: 'Човекът изяде плод от дървото и водата стана част от тялото му.' };
      let k = 0;
      ctx.answer = order[0];
      shell.task('<p><b>Проследи капката:</b> кликни реката, облака, дървото и човека — в този ред.</p>');
      shell.setControls('');
      ctx.click = (id) => {
        if (!id) return;
        if (id !== order[k]) {
          if (order.includes(id) || ['rock', 'reserve'].includes(id)) { mistakes++; shell.msg(`Капката още не може да стигне там.${mistakes >= 2 ? ' Подсказка: река → облак → дърво → човек.' : ''}`, 'bad'); }
          return;
        }
        moveDrop(id);
        shell.msg(text[id], 'good');
        ctx.say(posOf[id](), text[id], 'tag', 0.4);
        k++;
        ctx.answer = order[k] || null;
        if (k === order.length) {
          ctx.click = null;
          setTimeout(() => {
            ctx.clearTip();
            shell.task('<p>Водата, въглеродният диоксид и минералните соли от неживата природа влизат в телата на организмите. Това е <b>единството на материалния свят</b>.</p>');
            sortTask(ctx, {
              lead: 'Свойство само на живата природа ли е, или и на неживата?',
              bins: ['Само на живата', 'И на живата, и на неживата'],
              items: [
                { t: 'диша', bin: 0, why: 'Само живите организми дишат.' },
                { t: 'размножава се', bin: 0, why: 'Само живите организми се размножават.' },
                { t: 'храни се', bin: 0, why: 'Храненето е жизнен процес.' },
                { t: 'изградено е от вещества', bin: 1, why: 'И скалата, и дървото са изградени от вещества.' },
                { t: 'има маса', bin: 1, why: 'Всяко тяло има маса.' },
                { t: 'движи се', bin: 1, why: 'Движат се и животните, и реката, и облаците.', no: 'Реката тече, облаците плуват. Само живото ли се движи?' },
              ],
              hint: 'Жизнените процеси (хранене, дишане, размножаване) са само на живото.',
              mistakes,
              onDone: (m) => { ctx.scores[0] = stepScore(m, 3); shell.msg('Браво!', 'good'); nextBtn(ctx, 'Напред →', step3); },
            });
          }, 1500);
        }
      };
    }
  }

  // ---------- 3. Гората и реката ----------
  function step3() {
    shell.step(2);
    ctx.clearTip(); drop.visible = false;
    view(ctx, [0.2, 0.5, -1.4], 7, { halfH: 3.4, elev: 0.6 });
    shell.task('<p>На склона над реката расте гора. Долу край реката има село.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Хората изсичат цялата гора по склона. Какво ще стане при силен дъжд?',
      options: [
        { t: 'Водата ще отмие почвата, реката ще стане мътна и може да прелее към селото.', ok: true, why: 'Да проверим в модела!' },
        { t: 'Нищо: дърветата не влияят на дъжда.', ok: false, why: 'Корените на дърветата задържат почвата и водата. Какво става без тях?' },
        { t: 'Реката ще стане по-чиста.', ok: false, why: 'Откъде ще дойде калта, ако няма кой да държи почвата?' },
      ],
      hint: 'Корените задържат почвата.',
      onRight: (m) => { mistakes = m; cut(); },
    });
    function cut() {
      const c = shell.controls;
      c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary cut">🪓 Изсечи гората</button><button class="btn rain" disabled>🌧 Пороен дъжд</button></div>');
      c.querySelector('.cut').addEventListener('click', (e) => { e.target.disabled = true; E.cut = true; c.querySelector('.rain').disabled = false; }, { once: true });
      c.querySelector('.rain').addEventListener('click', (e) => {
        e.target.disabled = true; E.raining = true;
        setTimeout(() => {
          ctx.say(villageAt, 'Почвата се отми, реката стана мътна и преля към селото. Природата и хората пострадаха.', 'wide', 0.8);
          const cc = shell.setControls('<div class="row"><button class="btn primary plant">🌱 Залеси склона отново</button></div>');
          cc.querySelector('.plant').addEventListener('click', () => {
            E.raining = false; E.cut = false;
            ctx.clearTip();
            ctx.say(forestAt, '✔ Новата гора задържа почвата. Реката постепенно се избистря.', 'good wide', 0.6);
            setTimeout(() => {
              ctx.clearTip();
              choice(ctx, {
                q: 'Защо казваме, че човекът е част от природата?',
                options: [
                  { t: 'Диша въздух, пие вода и се храни с растения и животни — зависи от природата.', ok: true, why: 'Вярно! Каквото правим с природата, се връща към нас.' },
                  { t: 'Защото може да я променя, както иска.', ok: false, why: 'Видя какво стана, когато хората изсякоха гората. Независими ли сме от природата?' },
                  { t: 'Не е: човекът живее в градове.', ok: false, why: 'И в града дишаме въздух, пием вода и ядем храна. Откъде идват те?' },
                ],
                hint: 'От какво има нужда човек, за да живее?',
                mistakes,
                onRight: (m2) => { ctx.scores[1] = stepScore(m2, 3); nextBtn(ctx, 'Напред →', step4); },
              });
            }, 1800);
          }, { once: true });
        }, 4500);
      }, { once: true });
    }
  }

  // ---------- 4. Пази природата ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [-1.5, 0.8, -2.5], 4.5, { halfH: 2.5, elev: 0.5 });
    ctx.say(sign, 'В резерватите и парковете пазим природата и многообразието на организмите — многото различни видове растения и животни.', 'wide', 1.6);
    shell.task('<p>Оцени всяка дейност.</p>');
    sortTask(ctx, {
      bins: ['Подкрепям — пази природата и здравето', 'Не подкрепям — вреди'],
      items: [
        { t: 'Засаждане на дървета в квартала', bin: 0, why: 'Дърветата чистят въздуха и задържат почвата.' },
        { t: 'Разделно събиране на отпадъците', bin: 0, why: 'Така материалите се използват отново.' },
        { t: 'Бране на защитени цветя за букет', bin: 1, why: 'Защитените растения са редки — може да изчезнат.' },
        { t: 'Палене на огън в гората през лятото', bin: 1, why: 'Лесно избухва горски пожар.' },
        { t: 'Ходене пеша или с колело до училище', bin: 0, why: 'Чист въздух и здраво тяло.' },
      ],
      hint: 'Кое пази растенията, животните, въздуха и водата?',
      onDone: (m) => {
        ctx.clearTip();
        choice(ctx, {
          q: 'Как състоянието на околната среда влияе на здравето на човека?',
          options: [
            { t: 'Мръсният въздух и водата причиняват болести, а чистата природа пази здравето.', ok: true, why: 'Вярно! Като пазим природата, пазим и себе си.' },
            { t: 'Не влияе: здравето зависи само от лекарствата.', ok: false, why: 'Спомни си какво причиняват прахът и замърсената вода.' },
            { t: 'Влияе само на животните.', ok: false, why: 'Човекът диша същия въздух и пие същата вода.' },
          ],
          hint: 'Дишаме въздуха и пием водата около нас.',
          mistakes: m,
          onRight: (m2) => { ctx.scores[2] = stepScore(m2, 3); finishBtn(ctx, onComplete, restart); },
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
  return { dispose() { stage.dispose(); } };
}
