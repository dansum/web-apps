// 6.2.3 „Химични реакции и запазване на масата“ — везна, отворен и затворен съд, желязо и сяра, свещ.
// Стъпки: опознай → сода и оцет в отворен и в затворен съд (опит) → желязо + сяра (приложи) → предскажи.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, lcd, view, fmt, stepScore } from './labkit.js';

const SAFE = '<p class="warn">⚠ Опитите се правят <b>само с възрастен</b> или с учител, с предпазни очила.</p>';

// Маси в грамове (опитът е с малко сода, за да не се натрупа голямо налягане в затворената бутилка).
const M = { bottle: 25, cap: 2, vinegar: 50, tube: 4, soda: 0.5, gasOut: 0.2 };

function bottleModel() {
  const g = new THREE.Group();
  const prof = [[0, 0], [0.36, 0], [0.4, 0.05], [0.4, 0.95], [0.3, 1.2], [0.14, 1.38], [0.13, 1.55]];
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 32), glass(0.3));
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.45, 28), new THREE.MeshStandardMaterial({ color: 0xf3e5ab, transparent: true, opacity: 0.55, depthWrite: false }));
  liquid.position.y = 0.25;
  // Епруветка със сода, облегната вътре.
  const tube = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 14, 1, true), glass(0.45));
  t.position.y = 0.3;
  const soda = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 14), mat(0xffffff));
  soda.position.y = 0.08;
  tube.add(t, soda);
  tube.position.set(0.12, 0.5, 0);
  tube.rotation.z = 0.12;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 20), mat(0x1e88e5));
  cap.position.y = 1.6;
  cap.userData.pickId = 'cap';
  const bubbles = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.025 + Math.random() * 0.02, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    b.userData.k = Math.random();
    b.userData.x = (Math.random() - 0.5) * 0.5;
    b.userData.z = (Math.random() - 0.5) * 0.5;
    bubbles.add(b);
  }
  bubbles.visible = false;
  // Газ, който излиза от гърлото (видим само условно — въглеродният диоксид е безцветен).
  const gas = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshBasicMaterial({ color: 0x9aa7b3, transparent: true, opacity: 0.0 }));
    p.userData.k = i / 10;
    gas.add(p);
  }
  gas.position.y = 1.55;
  g.add(body, liquid, tube, cap, bubbles, gas);
  return { g, liquid, tube, soda, cap, bubbles, gas };
}

function scaleModel() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 1.3), mat(0xeceff1));
  base.position.y = 0.14;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 32), mat(0xb0bec5, { metalness: 0.5, roughness: 0.3 }));
  plate.position.y = 0.31;
  const disp = lcd(0.9, 0.22);
  disp.mesh.position.set(0, 0.15, 0.656);
  g.add(base, plate, disp.mesh);
  return { g, disp, top: 0.335 };
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Отворен и затворен съд', 'Желязо и сяра', 'Предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 3.4, 8.5], target: [0, 0.8, 0], maxDistance: 18 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 12, d: 4.6 });

  const sc = scaleModel();
  sc.g.userData.pickId = 'scale';
  scene.add(sc.g);
  const B = bottleModel();
  B.g.position.y = sc.top;
  B.g.userData.pickId = 'bottle';
  sc.g.add(B.g);
  B.g.position.set(0, sc.top - 0.0, 0);
  addHitBox(B.g, 0.8);

  // Бутилки за менюто: оцет и сода на масата.
  const vinegar = new THREE.Group();
  {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 20), glass(0.35));
    b.position.y = 0.45;
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 20), new THREE.MeshStandardMaterial({ color: 0xf3e5ab, transparent: true, opacity: 0.7 }));
    l.position.y = 0.32;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), mat(0xc62828));
    c.position.y = 0.96;
    const lb = labelSprite('Оцет', { size: 0.2 });
    lb.position.set(0, 0.55, 0.3);
    vinegar.add(b, l, c, lb);
    vinegar.position.set(-1.7, 0, 0.6);
    vinegar.userData.pickId = 'vinegar';
    scene.add(vinegar);
  }
  const sodaBox = new THREE.Group();
  {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), mat(0xffffff));
    box.position.y = 0.3;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.18, 0.31), mat(0x1e88e5));
    band.position.y = 0.35;
    const lb = labelSprite('Сода', { size: 0.2 });
    lb.position.set(0, 0.75, 0.2);
    sodaBox.add(box, band, lb);
    sodaBox.position.set(1.7, 0, 0.7);
    sodaBox.userData.pickId = 'soda';
    scene.add(sodaBox);
  }
  // Желязо, сяра и епруветка за стъпка 3.
  function dish(color, name, x) {
    const g = new THREE.Group();
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.1, 24), mat(0xfafafa));
    d.position.y = 0.05;
    const pile = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, { flat: true }));
    pile.scale.y = 0.5;
    pile.position.y = 0.09;
    const lb = labelSprite(name, { size: 0.2 });
    lb.position.set(0, 0.5, 0.2);
    g.add(d, pile, lb);
    g.position.set(x, 0, 1.1);
    stage.steadyLabel(lb, 6);
    scene.add(g);
    return { g, pile };
  }
  const fe = dish(0x5f6368, 'Желязо 7 g', -1.9);
  fe.g.userData.pickId = 'fe';
  const su = dish(0xf2d21b, 'Сяра 4 g', 1.9);
  su.g.userData.pickId = 'su';
  addHitBox(fe.g, 0.8); addHitBox(su.g, 0.8);
  const tubeRig = new THREE.Group();
  const mix = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 16), mat(0x8a8a5a));
  {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), mat(0x795548));
    stand.position.y = 0.04;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 16), mat(0x795548));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.55;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), mat(0x795548));
    post.position.set(0.2, 0.3, 0);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 16, 1, true), glass(0.4));
    t.position.y = 0.55;
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glass(0.4));
    bot.position.y = 0.1;
    mix.position.y = 0.12;
    mix.visible = false;
    tubeRig.add(stand, ring, post, t, bot, mix);
  }
  tubeRig.position.y = sc.top;
  tubeRig.visible = false;
  sc.g.add(tubeRig);
  const burner = new THREE.Group();
  const bFlame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0x64b5f6, transparent: true, opacity: 0.85 }));
  {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 12), glass(0.5));
    body.scale.y = 0.75;
    body.position.y = 0.22;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 10), mat(0x9e9e9e));
    neck.position.y = 0.52;
    bFlame.scale.set(1, 2.4, 1);
    bFlame.position.y = 0.78;
    bFlame.visible = false;
    burner.add(body, neck, bFlame);
    burner.position.set(-3.6, 0, 0);
    burner.userData.pickId = 'burner';
    scene.add(burner);
  }
  // Свещ в стъкленица за стъпка 4.
  const candleRig = new THREE.Group();
  const cWax = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 18), mat(0xfff8e1));
  const cFlame = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffc94a }));
  const cJar = new THREE.Group();
  {
    cWax.position.y = 0.25;
    cFlame.scale.set(1, 2, 1);
    cFlame.position.y = 0.66;
    const side = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 28, 1, true), glass());
    side.position.y = 0.6;
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), glass());
    top.rotation.x = -Math.PI / 2;
    top.position.y = 1.2;
    cJar.add(side, top);
    candleRig.add(cWax, cFlame, cJar);
    candleRig.position.y = sc.top;
    candleRig.visible = false;
    sc.g.add(candleRig);
  }

  // ---------- Състояние и анимация ----------
  const S = { capOn: false, reacting: 0, reacted: false, shown: 0, mass: 0, fe: false, su: false, heat: 0, candle: null };
  const bottleMass = () => M.bottle + M.vinegar + M.tube + M.soda + (S.capOn ? M.cap : 0);
  function resetBottle() {
    S.reacting = 0; S.reacted = false;
    B.soda.visible = true;
    B.tube.rotation.z = 0.12;
    B.bubbles.visible = false;
    B.cap.visible = S.capOn;
    S.mass = bottleMass();
  }
  stage.tick((dt, t) => {
    // реакция в бутилката
    if (S.reacting > 0) {
      S.reacting += dt;
      const k = Math.min(1, S.reacting / 3);
      B.tube.rotation.z = 0.12 + Math.min(1, S.reacting * 2) * 1.2;
      B.soda.visible = S.reacting < 0.5;
      B.bubbles.visible = k < 1;
      if (!S.capOn) S.mass = bottleMass() - M.gasOut * k;
      if (k >= 1 && !S.reacted) { S.reacted = true; S.reacting = 0; B.bubbles.visible = false; if (S.onDone) S.onDone(); }
    }
    for (const b of B.bubbles.children) {
      const f = (t * 0.9 + b.userData.k) % 1;
      b.position.set(b.userData.x * (1 - f * 0.3), 0.05 + f * 0.48, b.userData.z);
    }
    const gasOn = S.reacting > 0 && !S.capOn;
    for (const p of B.gas.children) {
      const f = (t * 0.7 + p.userData.k) % 1;
      p.position.set(Math.sin(f * 9 + p.userData.k * 6) * 0.12, f * 0.9, 0);
      p.material.opacity = gasOn ? 0.35 * (1 - f) : Math.max(0, p.material.opacity - dt);
    }
    // нагряване
    if (S.heat > 0) {
      S.heat += dt;
      bFlame.visible = true;
      bFlame.scale.set(1, 2.4 + Math.sin(t * 20) * 0.2, 1);
    } else bFlame.visible = false;
    // свещ
    if (S.candle) {
      const c = S.candle;
      c.t += dt;
      if (!c.closed) {
        const k = Math.min(1, c.t / 6);
        S.mass = c.m0 - 0.6 * k;
        cWax.scale.y = 1 - 0.25 * k;
        cWax.position.y = 0.25 * cWax.scale.y;
        cFlame.position.y = 0.5 * cWax.scale.y + 0.16;
        cFlame.visible = true;
        if (k >= 1 && !c.done) { c.done = true; c.cb && c.cb(); }
      } else {
        const k = Math.min(1, c.t / 3);
        cFlame.visible = k < 1;
        cFlame.scale.set(1 - k * 0.6, (1 - k * 0.6) * 2, 1 - k * 0.6);
        if (k >= 1 && !c.done) { c.done = true; c.cb && c.cb(); }
      }
    }
    // показанието на везната се приближава плавно
    S.shown += (S.mass - S.shown) * Math.min(1, dt * 6);
    if (Math.abs(S.mass - S.shown) < 0.004) S.shown = S.mass;
    sc.disp.set(S.mass > 0 ? `${fmt(S.shown, 1)} g` : '0,0 g');
  });

  function showOnly(which) {
    B.g.visible = which === 'bottle';
    tubeRig.visible = which === 'tube';
    candleRig.visible = which === 'candle';
    fe.g.visible = which === 'tube' || which === 'bottle';
    su.g.visible = which === 'tube' || which === 'bottle';
    S.heat = 0;
    S.candle = null;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    showOnly('bottle');
    S.capOn = false; S.onDone = null;
    resetBottle();
    S.mass = 0;
    fe.pile.visible = true; su.pile.visible = true;
    view(ctx, [0, 0.8, 0.3], 4.2, { halfH: 1.4 });
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p>Когато веществата реагират, се получават нови вещества. Какво става с масата им?</p>
        <p><b>Разгледай уредите и веществата</b> от менюто в ъгъла.</p>${SAFE}`,
      items: [
        { id: 'scale', label: 'Везна', icon: '⚖', note: 'Електронната везна мери масата в грамове (g) с точност до 0,1 g.', obj: () => sc.g, dist: 3.2 },
        { id: 'bottle', label: 'Бутилка с оцет', icon: '🧴', note: 'В пластмасовата бутилка има оцет. Вътре е облегната епруветка със сода. Двете вещества още не се смесват.', obj: () => B.g, dist: 3.2, bubble: 1.9 },
        { id: 'soda', label: 'Сода бикарбонат', icon: '🧂', note: 'Содата за хляб реагира с оцета. Получават се нови вещества, едното от тях е газът <b>въглероден диоксид</b>.', obj: () => sodaBox, dist: 3 },
        { id: 'vinegar', label: 'Оцет', icon: '🫙', note: 'Оцетът е разтвор на оцетна киселина във вода.', obj: () => vinegar, dist: 3 },
        { id: 'fe', label: 'Желязо', icon: '⚙', note: 'Железни стърготини — просто вещество, метал. Привличат се от магнит.', obj: () => fe.g, dist: 2.6 },
        { id: 'su', label: 'Сяра', icon: '🟡', note: 'Сярата е жълто просто вещество, неметал.', obj: () => su.g, dist: 2.6 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Отворен и затворен съд ----------
  function step2() {
    shell.step(1);
    showOnly('bottle');
    fe.g.visible = false; su.g.visible = false;
    S.capOn = false;
    resetBottle();
    view(ctx, [0, 1.1, 0], 1.9, { halfH: 1.3 });
    const rec = { open: null, closed: null };
    const table = () => `<table class="small" style="width:100%;border-collapse:collapse">
      <tr><th style="text-align:left">Съд</th><th>Преди</th><th>След</th></tr>
      <tr><td>Отворен</td><td>${rec.open ? fmt(rec.open[0]) + ' g' : '—'}</td><td>${rec.open && rec.open[1] != null ? fmt(rec.open[1]) + ' g' : '—'}</td></tr>
      <tr><td>Затворен</td><td>${rec.closed ? fmt(rec.closed[0]) + ' g' : '—'}</td><td>${rec.closed && rec.closed[1] != null ? fmt(rec.closed[1]) + ' g' : '—'}</td></tr></table>`;
    const task = (lead) => shell.task(`${lead}${table()}${SAFE}`);
    task('<p>Бутилката е на везната и е <b>отворена</b>. Ще наклоним епруветката, за да се смесят содата и оцетът.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще покаже везната след реакцията в отворения съд?',
      options: [
        { t: 'По-малко', ok: true, why: 'Да проверим! Натисни „Смеси“.' },
        { t: 'Същото', ok: false, why: 'Помисли: къде отива газът, когато бутилката е отворена?' },
        { t: 'Повече', ok: false, why: 'Нищо не се добавя в бутилката отвън. Какво може да излезе от нея?' },
      ],
      hint: 'При реакцията се образува газ.',
      onRight: (m) => { mistakes = m; runOpen(); },
    });
    const mixBtn = (fn) => {
      const c = shell.setControls('<div class="row"><button class="btn primary mixb">Смеси</button></div>');
      c.querySelector('.mixb').addEventListener('click', () => { c.querySelector('.mixb').disabled = true; ctx.clearTip(); fn(); }, { once: true });
    };
    function runOpen() {
      rec.open = [bottleMass(), null];
      task('<p>Натисни „Смеси“ и гледай везната.</p>');
      mixBtn(() => {
        S.onDone = () => {
          rec.open[1] = bottleMass() - M.gasOut;
          task('<p>Масата намаля с <b>0,2 g</b>.</p>');
          ctx.say(B.g, 'Мехурчетата са въглероден диоксид. Той е безцветен газ — тук е оцветен, за да се вижда. В отворения съд излиза във въздуха.', 'wide', 1.9);
          setTimeout(() => choice(ctx, {
            q: 'Защо масата в отворения съд намаля?',
            options: [
              { t: 'Полученият газ излезе от бутилката във въздуха.', ok: true, why: 'Вярно! Газът е вещество и има маса. Излезе навън и везната не го претегли.' },
              { t: 'Част от веществата изчезнаха при реакцията.', ok: false, why: 'Веществата не изчезват, а се превръщат в други. Къде отиде едното от тях?' },
              { t: 'Реакцията направи веществата по-леки.', ok: false, why: 'Масата не се губи при реакция. Виж какво излиза от гърлото на бутилката.' },
            ],
            hint: 'Погледни гърлото на бутилката по време на реакцията.',
            mistakes,
            onRight: (m) => { mistakes = m; nextBtn(ctx, 'Сега със затворен съд →', prepClosed); },
          }), 600);
        };
        S.reacting = 0.001;
      });
    }
    function prepClosed() {
      ctx.clearTip();
      S.capOn = false;
      resetBottle();
      task('<p>Нова проба. <b>Затвори бутилката:</b> кликни капачката до нея или натисни бутона.</p>');
      const cap0 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 20), mat(0x1e88e5));
      cap0.position.set(1.25, 0.07, 0.6);
      cap0.userData.pickId = 'loose-cap';
      addHitBox(cap0, 0.5);
      scene.add(cap0);
      const c = shell.setControls('<div class="row"><button class="btn capb">Сложи капачката</button></div>');
      const put = () => {
        scene.remove(cap0);
        ctx.click = null;
        S.capOn = true;
        resetBottle();
        rec.closed = [bottleMass(), null];
        task('<p>Бутилката е <b>затворена</b>. Капачката също е на везната. Натисни „Смеси“.</p>');
        mixBtn(() => {
          S.onDone = () => {
            rec.closed[1] = bottleMass();
            task('<p>Масата <b>не се промени</b>.</p>');
            ctx.say(B.g, 'Газът остана в затворената бутилка. Масата на веществата преди и след реакцията е една и съща.', 'good', 1.9);
            ctx.scores[0] = stepScore(mistakes, 3);
            shell.msg('Масата на веществата преди реакцията е равна на масата на веществата след нея. Това е законът за запазване на масата.', 'good');
            shell.setControls('');
            nextBtn(ctx, 'Напред →', step3);
          };
          S.reacting = 0.001;
        });
      };
      c.querySelector('.capb').addEventListener('click', put, { once: true });
      ctx.click = (id) => { if (id === 'loose-cap') put(); };
    }
  }

  // ---------- 3. Желязо и сяра ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    showOnly('tube');
    fe.pile.visible = true; su.pile.visible = true;
    mix.visible = false;
    mix.material.color.setHex(0x8a8a5a);
    S.mass = 0;
    view(ctx, [-0.8, 0.7, 0.6], 3.4, { halfH: 1.2 });
    let mistakes = 0;
    const SAFE3 = '<p class="warn">⚠ Желязо и сяра се нагряват <b>само от учител</b> в лаборатория.</p>';
    shell.task(`<p>Празната епруветка е на везната (везната е нулирана).</p><p><b>Кликни изходните вещества</b>, за да ги изсипеш в епруветката.</p>${SAFE3}`);
    shell.setControls('');
    const got = new Set();
    const tare = 0;
    ctx.click = (id) => {
      if (id === 'fe' || id === 'su') {
        if (got.has(id)) return;
        got.add(id);
        (id === 'fe' ? fe : su).pile.visible = false;
        mix.visible = true;
        mix.scale.y = got.size === 1 ? 14 : 26;
        mix.position.y = 0.11 + mix.scale.y * 0.005;
        mix.material.color.setHex(got.size === 2 ? 0x8a8a5a : id === 'fe' ? 0x5f6368 : 0xf2d21b);
        S.mass = tare + (got.has('fe') ? 7 : 0) + (got.has('su') ? 4 : 0);
        ctx.say(tubeRig, got.size === 2 ? 'Смес от желязо и сяра: 7 g + 4 g' : (id === 'fe' ? 'Желязо: 7 g' : 'Сяра: 4 g'), 'tag', 1.3);
        if (got.size === 2) { ctx.click = null; ask(); }
      } else if (id === 'burner') {
        shell.msg('Първо изсипи веществата в епруветката.', 'bad');
      }
    };
    function ask() {
      shell.task(`<p>Учителят ще нагрее сместа. Получава се ново вещество — <b>железен сулфид</b>.</p>
        <p><b>Колко грама железен сулфид ще се получат?</b></p>
        <label class="num"><input class="ans" type="text" inputmode="decimal"> g</label>${SAFE3}`);
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      const inp = container.querySelector('.ans');
      c.querySelector('.chk').addEventListener('click', () => {
        const v = parseFloat(inp.value.replace(',', '.'));
        if (!Number.isFinite(v)) return;
        if (Math.abs(v - 11) < 1e-9) {
          inp.classList.add('right');
          c.querySelector('.chk').disabled = true;
          shell.msg('Вярно! Да проверим с везната.', 'good');
          heat();
          return;
        }
        mistakes++;
        inp.classList.add('wrong');
        shell.msg(`${v < 11 ? 'Твърде малко: масата не се губи при реакцията.' : 'Твърде много: нищо не се добавя отвън.'}${mistakes >= 2 ? ' Подсказка: събери масите на изходните вещества.' : ''}`, 'bad');
        shell.score(`Грешки: ${mistakes}`);
      });
    }
    function heat() {
      // Епруветката отива при спиртната лампа, нагрява се и се връща на везната.
      const home = tubeRig.position.clone();
      let k = 0;
      S.mass = 0;
      const stop = stage.tick((dt) => {
        k += dt;
        if (k < 1) tubeRig.position.lerpVectors(home, new THREE.Vector3(-3.6, 0.9, 0), k);
        else if (k < 3.2) { S.heat = S.heat || 0.001; mix.material.color.lerp(new THREE.Color(0x2b2b2b), dt * 1.5); mix.material.emissive = new THREE.Color(0xff5722); mix.material.emissiveIntensity = Math.sin((k - 1) / 2.2 * Math.PI) * 0.7; }
        else if (k < 4.2) { S.heat = 0; mix.material.emissiveIntensity = 0; tubeRig.position.lerpVectors(new THREE.Vector3(-3.6, 0.9, 0), home, k - 3.2); }
        else {
          stop();
          tubeRig.position.copy(home);
          S.mass = 11;
          ctx.say(tubeRig, 'Железен сулфид: 11,0 g. 7 g + 4 g = 11 g — масата се запази.', 'good', 1.3);
          ctx.scores[1] = stepScore(mistakes, 3);
          shell.task('<p><b>Изходни вещества:</b> желязо и сяра.<br><b>Продукт:</b> железен сулфид.</p><p>желязо + сяра → железен сулфид</p>');
          nextBtn(ctx, 'Напред →', step4);
        }
      });
      sc.g.remove(tubeRig); scene.add(tubeRig);
      home.set(0, sc.top, 0);
      tubeRig.position.copy(home);
    }
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    if (tubeRig.parent !== sc.g) { scene.remove(tubeRig); sc.g.add(tubeRig); tubeRig.position.set(0, sc.top, 0); }
    showOnly('candle');
    cJar.visible = false;
    cWax.scale.y = 1; cWax.position.y = 0.25; cFlame.position.y = 0.66; cFlame.visible = true; cFlame.scale.set(1, 2, 1);
    S.mass = 52.4;
    shell.score('');
    view(ctx, [0, 0.9, 0], 1.7, { halfH: 1.1 });
    shell.task(`<p>Горяща свещ стои на везната. Отворено е — около нея има въздух.</p>${SAFE}`);
    let mistakes = 0;
    choice(ctx, {
      q: 'Свещта гори. Какво ще показва везната след малко?',
      options: [
        { t: 'По-малко', ok: true, why: 'Да видим!' },
        { t: 'Същото', ok: false, why: 'Помисли: продуктите на горенето са газове. Остават ли на везната?' },
        { t: 'Повече', ok: false, why: 'Свещта се стопява и смалява. Какво става с продуктите на горенето?' },
      ],
      hint: 'При горенето се получават въглероден диоксид и водни пари.',
      onRight: (m) => {
        mistakes = m;
        shell.setControls('');
        S.candle = { t: 0, m0: 52.4, closed: false, cb: () => setTimeout(why, 300) };
      },
    });
    function why() {
      choice(ctx, {
        q: 'Къде отиде масата на восъка?',
        options: [
          { t: 'Превърна се във въглероден диоксид и водни пари, които отидоха във въздуха.', ok: true, why: 'Вярно! Масата не изчезна, а продуктите на горенето са газове.' },
          { t: 'Изчезна в пламъка.', ok: false, why: 'При химична реакция масата не изчезва. Какви вещества се получават при горенето?' },
          { t: 'Превърна се в светлина.', ok: false, why: 'Светлината няма маса като веществата. Помисли за газовете.' },
        ],
        hint: 'Спомни си бутилката, когато беше отворена.',
        mistakes,
        onRight: (m) => { mistakes = m; nextBtn(ctx, 'Още една задача →', closedQ); },
      });
    }
    function closedQ() {
      cWax.scale.y = 1; cWax.position.y = 0.25; cFlame.position.y = 0.66; cFlame.visible = true; cFlame.scale.set(1, 2, 1);
      S.candle = null;
      cJar.visible = true;
      S.mass = 268.4;
      shell.task(`<p>Сега свещта гори под <b>затворена стъкленица</b>, а всичко е на везната.</p>${SAFE}`);
      choice(ctx, {
        q: 'Какво ще покаже везната, когато свещта угасне?',
        options: [
          { t: 'Същото', ok: true, why: 'Вярно! Газовете остават в стъкленицата, затова масата се запазва.' },
          { t: 'По-малко', ok: false, why: 'Този път газовете не могат да излязат. Сравни с затворената бутилка.' },
          { t: 'Повече', ok: false, why: 'Нищо не влиза отвън в затворения съд.' },
        ],
        hint: 'Затвореният съд не пуска нищо навън.',
        mistakes,
        onRight: (m) => {
          S.candle = { t: 0, m0: 268.4, closed: true, cb: () => ctx.say(candleRig, 'Свещта угасна, а везната показва същата маса.', 'good', 1.6) };
          ctx.scores[2] = stepScore(m, 3);
          finishBtn(ctx, onComplete, restart);
        },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    if (tubeRig.parent !== sc.g) { scene.remove(tubeRig); sc.g.add(tubeRig); tubeRig.position.set(0, sc.top, 0); }
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
