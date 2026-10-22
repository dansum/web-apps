// 6.1.3 „Лост и макара“ — 3D лабораторна маса с лост, макари и силомер.
// Стъпки: уравновеси лоста → подвижна опора → макари → лостове и макари около нас.
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const WEIGHT_COLORS = { 1: 0xf6c343, 2: 0xf08a24, 3: 0xe0533a, 4: 0xb3367a, 5: 0x7b3fb5, 6: 0x3f5fbf, 10: 0x37474f };
const UNIT = 0.9; // разстояние между деленията в сцената

function weightModel(n) {
  const g = new THREE.Group();
  const h = 0.25 + n * 0.05;
  const block = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, h, 24), mat(WEIGHT_COLORS[n] || 0x607d8b, { roughness: 0.4, metalness: 0.3 }));
  block.position.y = -0.45 - h / 2;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 16), mat(0x9aa4ae, { metalness: 0.8, roughness: 0.3 }));
  hook.position.y = -0.06;
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 4), mat(0x444444));
  string.position.y = -0.25;
  const l = labelSprite(`${n} N`, { size: 0.22 });
  l.position.set(0, block.position.y, 0.3);
  g.add(block, hook, string, l);
  g.userData.n = n;
  return g;
}

function buildLever(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(13, 0.25, 4), mat(0xd7b98e));
  tableTop.position.y = -0.125;
  tableTop.receiveShadow = true;
  root.add(tableTop);
  const pivot = new THREE.Group();
  pivot.position.y = 2.2;
  root.add(pivot);
  const fulcrum = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 3), mat(0x5c6b7a, { flat: true }));
  fulcrum.position.y = -1.1;
  fulcrum.rotation.y = Math.PI / 6;
  pivot.add(fulcrum);
  const beam = new THREE.Group();
  pivot.add(beam);
  const plank = new THREE.Mesh(new THREE.BoxGeometry(UNIT * 10 + 0.5, 0.16, 0.42), mat(0xa0703c));
  plank.castShadow = true;
  beam.add(plank);
  const marks = [];
  for (let i = -5; i <= 5; i++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.17, 0.44), mat(i === 0 ? 0xffffff : 0x2b2b2b));
    tick.position.x = i * UNIT;
    beam.add(tick);
    if (i !== 0) {
      const num = labelSprite(String(Math.abs(i)), { size: 0.2 });
      num.position.set(i * UNIT, 0.3, 0.1);
      beam.add(num);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(UNIT * 0.8, 0.55, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(i * UNIT, 0.1, 0);
      hit.userData.pickId = 'mark:' + i;
      beam.add(hit);
      marks.push(hit);
    }
  }
  return { root, pivot, beam, fulcrum, marks, angle: 0, vel: 0, f: 0, hung: [] };
}

// Обща физика на лоста: момент спрямо опората f (в деления).
function torque(L, extra = []) {
  let t = 0;
  for (const h of L.hung) t += h.n * (h.x - L.f);
  for (const e of extra) t += e.n * (e.x - L.f);
  return t;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Уравновеси лоста', 'Подвижната опора', 'Макари', 'Лостове и макари около нас'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xeef2f6, camPos: [0, 3.8, 9.5], target: [0, 1.7, 0], shadows: true, maxDistance: 18,
  });
  const { scene, camera } = stage;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), mat(0xe2e8ef));
  wall.position.set(0, 5, -3);
  scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), mat(0xc9d2dc));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.2;
  floor.receiveShadow = true;
  scene.add(floor);

  const L = buildLever(scene);
  let targetAngle = 0;
  let maxTilt = 0.32;
  let restAngle = 0;
  const readouts = { left: null, right: null };

  stage.tick((dt) => {
    // пружинка с затихване към целевия ъгъл
    const k = 40; const d = 9;
    const acc = k * (targetAngle - L.angle) - d * L.vel;
    L.vel += acc * dt;
    L.angle += L.vel * dt;
    L.beam.rotation.z = L.angle;
    for (const h of L.hung) h.model.rotation.z = -L.angle;
    if (stoneRig) stoneRig.stone.rotation.z = -L.angle;
  });

  function setFulcrum(f) {
    L.f = f;
    L.pivot.position.x = f * UNIT;
    L.beam.position.x = -f * UNIT;
  }

  function hang(n, x, locked = false) {
    const m = weightModel(n);
    m.position.set(x * UNIT, 0, 0);
    m.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    m.userData.pickId = locked ? 'locked' : 'hung';
    L.beam.add(m);
    const h = { n, x, model: m, locked };
    m.userData.h = h;
    L.hung.push(h);
    return h;
  }
  function unhang(h) {
    L.beam.remove(h.model);
    L.hung = L.hung.filter((x) => x !== h);
  }
  function clearLever() { for (const h of L.hung.slice()) unhang(h); }

  function updateLever(extra = []) {
    const t = torque(L, extra);
    targetAngle = restAngle + -Math.max(-maxTilt, Math.min(maxTilt, t * 0.03));
    return t;
  }

  function sideText() {
    const left = L.hung.filter((h) => h.x < L.f);
    const right = L.hung.filter((h) => h.x > L.f);
    const fmt = (arr) => arr.length ? arr.map((h) => `${h.n} N × ${Math.abs(h.x - L.f)}`).join(' + ') + ` = <b>${arr.reduce((s, h) => s + h.n * Math.abs(h.x - L.f), 0)}</b>` : '0';
    return { left: fmt(left), right: fmt(right) };
  }

  let tip = null;
  function say(anchor, html, cls = '', lift = 0.6) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  function clearReadouts() {
    for (const k of Object.keys(readouts)) if (readouts[k]) { readouts[k].remove(); readouts[k] = null; }
  }

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => clickHandler && clickHandler(hit));

  // Меню в ъгъла: частите на лоста (стъпка 1) и примери (стъпка 4).
  let menuHandler = null;
  const menu = cornerMenu(stage, { title: 'Части на лоста', items: [], onSelect: (id) => menuHandler && menuHandler(id) });
  const LEVER_PARTS = [
    { id: 'fulcrum', label: 'Опора', icon: '🔺', note: 'Точката, около която се върти лостът.', at: () => L.fulcrum },
    { id: 'beam', label: 'Лост', icon: '📏', note: 'Твърдо тяло, което се върти около опората.', at: () => L.beam },
    { id: 'arm', label: 'Рамо', icon: '↔', note: 'Разстоянието от опората до мястото, където действа силата. Тук се мери в деления.', at: () => L.marks.find((m) => m.userData.pickId === 'mark:3') },
    { id: 'load', label: 'Тежест', icon: '⚫', note: 'Тежестта действа със сила надолу. Мери се в нютони (N).', at: () => (L.hung[0] ? L.hung[0].model : L.beam) },
  ];

  // ---------- 1. Уравновеси ----------
  function step1() {
    shell.step(0);
    clearTip();
    L.root.visible = true;
    if (pulleys) pulleys.g.visible = false;
    setFulcrum(0);
    restAngle = 0;
    clearLever();
    stage.flyTo([0, 3.8, 9.5], [0, 1.7, 0]);
    let mistakes = 0;
    let p = 0;
    let held = null;
    const PUZ = [
      { fixed: [[4, -2]], text: 'Вляво виси тежест <b>4 N</b> на <b>2-ро</b> деление. <b>Закачи тежести вдясно</b>, така че лостът да е в равновесие.', weights: [1, 2, 4] },
      { fixed: [[6, -1]], text: 'Вляво: <b>6 N</b> на <b>1-во</b> деление. Уравновеси с <b>една тежест от 2 N</b>. На кое деление ще я закачиш?', weights: [2], one: 2 },
      { fixed: [[10, -2]], text: 'Вляво: <b>10 N</b> на <b>2-ро</b> деление. Колко нютона трябва да е тежестта на <b>5-то</b> деление вдясно?', ask: 4 },
    ];
    menu.setTitle('Части на лоста');
    menu.setItems(LEVER_PARTS.map(({ id, label, icon }) => ({ id, label, icon })));
    menu.show(true);
    menuHandler = (id) => {
      const part = LEVER_PARTS.find((x) => x.id === id);
      say(part.at(), `<b>${esc(part.icon)} ${esc(part.label)}</b><br>${esc(part.note)}`, '', 0.5);
      menu.mark(id);
    };
    readouts.left = stage.bubble(new THREE.Vector3(-2.2 * UNIT, 2.7, 0), '', { cls: 'tag', lift: 0.6 });
    readouts.right = stage.bubble(new THREE.Vector3(2.2 * UNIT, 2.7, 0), '', { cls: 'tag', lift: 0.6 });
    const refresh = () => {
      const t = updateLever();
      const s = sideText();
      readouts.left.set(`Ляво: ${s.left}`);
      readouts.right.set(`Дясно: ${s.right}`);
      const bal = t === 0 && L.hung.some((h) => h.x > 0);
      readouts.left.el.classList.toggle('good', bal);
      readouts.right.el.classList.toggle('good', bal);
      return bal;
    };
    const load = () => {
      clearLever();
      clearTip();
      held = null;
      const P = PUZ[p];
      for (const [n, x] of P.fixed) hang(n, x, true);
      refresh();
      shell.score(`Задача ${p + 1} от ${PUZ.length} · грешки: ${mistakes}`);
      if (P.ask) {
        shell.task(`<p>${P.text}</p><p class="small">Лостът е в равновесие, когато <b>сила × рамо</b> е еднакво от двете страни.</p>
          <label class="num"><input class="ans" type="text" inputmode="decimal"> N</label>`);
        const c = shell.setControls('<button class="btn primary">Провери с тежест</button>');
        const inp = container.querySelector('.ans');
        inp.focus();
        c.querySelector('button').addEventListener('click', () => {
          const v = parseFloat(inp.value.replace(',', '.'));
          if (!Number.isFinite(v)) return;
          const n = Math.round(v);
          for (const h of L.hung.filter((x) => !x.locked)) unhang(h);
          if (WEIGHT_COLORS[n] || n > 0) hang(n, 5);
          const bal = refresh();
          if (v === P.ask && bal) {
            shell.msg('Вярно: 10 N × 2 = 20 = 4 N × 5. Лостът е в равновесие!', 'good');
            done();
          } else {
            mistakes++;
            shell.msg(`Не е в равновесие: ${sideText().left.replace(/<[^>]+>/g, '')} ≠ ${sideText().right.replace(/<[^>]+>/g, '')}. Опитай пак.`, 'bad');
            shell.score(`Задача ${p + 1} от ${PUZ.length} · грешки: ${mistakes}`);
          }
        });
        clickHandler = null;
        return;
      }
      shell.task(`<p>${P.text}</p>
        <p class="small">Избери тежест, после кликни деление на лоста. Кликни закачена тежест, за да я махнеш.</p>
        <div class="xp-chips">${P.weights.map((n) => `<span class="chip" data-n="${n}">${n} N</span>`).join('')}</div>`);
      container.querySelectorAll('.xp-chips .chip').forEach((ch) => ch.addEventListener('click', () => {
        container.querySelectorAll('.xp-chips .chip').forEach((x) => x.classList.remove('held'));
        held = +ch.dataset.n;
        ch.classList.add('held');
      }));
      const c = shell.setControls('<button class="btn primary">Готово</button>');
      c.querySelector('button').addEventListener('click', () => {
        const bal = refresh();
        const free = L.hung.filter((h) => !h.locked);
        if (P.one && (free.length !== 1 || free[0].n !== P.one)) {
          mistakes++;
          shell.msg('Използвай точно една тежест от 2 N.', 'bad');
        } else if (bal) {
          shell.msg('Равновесие! Сила × рамо е еднакво от двете страни.', 'good');
          return done();
        } else {
          mistakes++;
          shell.msg('Още не е в равновесие — виж числата над лоста.', 'bad');
        }
        shell.score(`Задача ${p + 1} от ${PUZ.length} · грешки: ${mistakes}`);
      });
      clickHandler = (hit) => {
        if (!hit) return;
        const id = hit.root.userData.pickId;
        if (id === 'hung') { unhang(hit.root.userData.h); refresh(); return; }
        if (id === 'locked') { say(hit.root, 'Тази тежест е част от задачата.', 'bad', 0.2); return; }
        if (id && id.startsWith('mark:')) {
          const x = +id.slice(5);
          if (!held) { shell.msg('Първо избери тежест.', 'bad'); return; }
          if (x < 0) { shell.msg('Закачай тежестите вдясно.', 'bad'); return; }
          hang(held, x);
          refresh();
        }
      };
    };
    const done = () => {
      clickHandler = null;
      const last = p === PUZ.length - 1;
      const c = shell.setControls(`<button class="btn primary">${last ? 'Напред →' : 'Следваща задача →'}</button>`);
      c.querySelector('button').addEventListener('click', () => {
        shell.msg('');
        if (last) { scores.push(stepScore(mistakes, 4)); clearReadouts(); menu.show(false); menuHandler = null; clearTip(); step2(); return; }
        p++;
        load();
      });
    };
    load();
  }

  // ---------- 2. Подвижна опора ----------
  let stoneRig = null;
  function step2() {
    shell.step(1);
    clearTip();
    clearLever();
    restAngle = 0;
    const stone = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), mat(0x8d8f93, { flat: true }));
    rock.position.y = -0.62;
    rock.castShadow = true;
    const l = labelSprite('Камък 30 N', { size: 0.24 });
    l.position.set(0, -0.6, 0.7);
    stone.add(rock, l);
    stone.position.x = -5 * UNIT;
    L.beam.add(stone);
    const hand = new THREE.Group();
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 12), mat(0x1865f2));
    arrow.rotation.z = Math.PI;
    arrow.position.y = 0.45;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), mat(0x1865f2));
    shaft.position.y = 1.05;
    hand.add(arrow, shaft);
    hand.position.x = 5 * UNIT;
    L.beam.add(hand);
    stoneRig = { stone, hand };
    setFulcrum(0);
    stage.flyTo([0, 3.6, 9.5], [0, 1.6, 0]);
    let mistakes = 0;
    const needed = () => (30 * (L.f + 5)) / (5 - L.f);
    const handBubble = stage.bubble(hand, '', { lift: 1.6, cls: 'tag' });
    const draw = () => {
      const F = needed();
      handBubble.set(`Нужна сила: <b>${F.toFixed(1).replace('.', ',')} N</b>`);
      handBubble.el.classList.toggle('good', F <= 10 + 1e-9);
    };
    shell.task(`<p>С лост искаш да повдигнеш камък от <b>30 N</b>. Ръката ти може да натисне най-много с <b>10 N</b>.</p>
      <p><b>Премести опората</b> с плъзгача, после натисни „Натисни лоста“.</p>
      <label class="small">Опора: по-близо до камъка ⟵ ⟶ по-близо до ръката
        <input class="slider fslide" type="range" min="-4" max="4" step="0.5" value="0"></label>
      <p class="small">Рамо на камъка: <b class="l1">5</b> деления · рамо на ръката: <b class="l2">5</b> деления</p>`);
    const sl = container.querySelector('.fslide');
    const upd = () => {
      setFulcrum(+sl.value);
      container.querySelector('.l1').textContent = String(L.f + 5).replace('.', ',');
      container.querySelector('.l2').textContent = String(5 - L.f).replace('.', ',');
      targetAngle = 0;
      draw();
    };
    sl.addEventListener('input', upd);
    upd();
    shell.score(`Грешки: ${mistakes}`);
    const c = shell.setControls('<button class="btn primary">Натисни лоста</button>');
    c.querySelector('button').addEventListener('click', () => {
      const F = needed();
      if (F <= 10 + 1e-9) {
        targetAngle = -0.22;
        say(stoneRig.stone, '✔ Камъкът се повдигна!', 'good', 0.1);
        shell.msg('Колкото по-близо е опората до товара, толкова по-малка сила трябва.', 'good');
        sl.disabled = true;
        question();
      } else {
        mistakes++;
        targetAngle = -0.015;
        setTimeout(() => { targetAngle = 0; }, 350);
        shell.msg(`Трябват ${F.toFixed(1).replace('.', ',')} N, а ръката има само 10 N. Премести опората.`, 'bad');
        shell.score(`Грешки: ${mistakes}`);
      }
    });
    function question() {
      const c2 = shell.setControls(`<p><b>Защо стана по-лесно?</b></p><div class="choices">
        <button class="choice" data-i="0">Рамото на ръката стана по-дълго от рамото на камъка</button>
        <button class="choice" data-i="1">Камъкът стана по-лек</button>
        <button class="choice" data-i="2">Лостът стана по-къс</button></div>`);
      c2.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        if (+b.dataset.i !== 0) { mistakes++; b.classList.add('wrong'); shell.msg('Не. Камъкът и лостът са същите — промени се само мястото на опората.', 'bad'); return; }
        b.classList.add('right');
        c2.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        shell.msg('Вярно! С по-дълго рамо печелим сила.', 'good');
        scores.push(stepScore(mistakes, 3));
        c2.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary nx">Напред →</button></div>');
        c2.querySelector('.nx').addEventListener('click', () => {
          handBubble.remove();
          clearTip();
          L.beam.remove(stoneRig.stone, stoneRig.hand);
          stoneRig = null;
          step3();
        });
      }));
    }
  }

  // ---------- 3. Макари ----------
  const PX = 24;
  let pulleys = null;
  function buildPulleys() {
    const g = new THREE.Group();
    g.position.x = PX;
    scene.add(g);
    const metal = mat(0x9aa4ae, { metalness: 0.7, roughness: 0.3 });
    const beamTop = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 0.5), mat(0x5c6b7a));
    beamTop.position.y = 4.6;
    g.add(beamTop);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5.8, 0.25), mat(0x5c6b7a));
    post.position.set(-4, 1.7, 0);
    const post2 = post.clone();
    post2.position.x = 4;
    g.add(post, post2);
    const mkWheel = (r = 0.45) => {
      const w = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 32), metal);
      disc.rotation.x = Math.PI / 2;
      const groove = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 8, 32), mat(0x37474f));
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), mat(0x222222));
      axle.rotation.x = Math.PI / 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(r * 1.8, 0.05, 0.16), mat(0x37474f));
      w.add(disc, groove, axle, spoke);
      return w;
    };
    const ropeM = mat(0xc49a54);
    const rope = () => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), ropeM);
      g.add(m);
      return m;
    };
    const setRope = (m, a, b) => {
      const mid = a.clone().add(b).multiplyScalar(0.5);
      m.position.copy(mid);
      m.scale.y = Math.max(0.001, a.distanceTo(b));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    };
    const mkLoad = (label) => {
      const lg = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), mat(0x8d6e63));
      box.castShadow = true;
      const l = labelSprite(label, { size: 0.22 });
      l.position.set(0, 0, 0.5);
      lg.add(box, l);
      g.add(lg);
      return lg;
    };
    const mkScale = () => {
      const sg = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16), mat(0xf5f5f5));
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.12, 16), mat(0xd92916));
      band.position.y = -0.1;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 16), metal);
      ring.position.y = -0.55;
      sg.add(body, band, ring);
      g.add(sg);
      return sg;
    };
    // Неподвижна макара (вляво)
    const w1 = mkWheel();
    w1.position.set(-2, 4.1, 0);
    g.add(w1);
    const hanger1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), mat(0x37474f));
    hanger1.position.set(-2, 4.4, 0);
    g.add(hanger1);
    const load1 = mkLoad('6 N');
    const scale1 = mkScale();
    const r1a = rope(); const r1b = rope();
    // Подвижна макара (вдясно)
    const w2 = mkWheel(0.35);
    g.add(w2);
    const load2 = mkLoad('6 N');
    const scale2 = mkScale();
    const anchor2 = new THREE.Vector3(1.65, 4.5, 0);
    const r2a = rope(); const r2b = rope(); const r2c = rope();
    const fixedTop2 = mkWheel(0.35);
    fixedTop2.position.set(3.05, 4.1, 0);
    g.add(fixedTop2);
    const t1 = labelSprite('Неподвижна макара', { size: 0.3 });
    t1.position.set(-2, 5.2, 0);
    const t2 = labelSprite('Подвижна макара', { size: 0.3 });
    t2.position.set(2, 5.2, 0);
    g.add(t1, t2);

    const state = { pull: 0 };
    const update = () => {
      const p = state.pull; // издърпано въже, 0..2 (метра в сцената)
      const R1 = 0.45;
      // неподвижна: товарът се вдига колкото е издърпано
      const y1 = 0.3 + p;
      load1.position.set(-2 - R1, y1, 0);
      scale1.position.set(-2 + R1, 2.6 - p, 0);
      setRope(r1a, new THREE.Vector3(-2 - R1, 4.1, 0), new THREE.Vector3(-2 - R1, y1 + 0.3, 0));
      setRope(r1b, new THREE.Vector3(-2 + R1, 4.1, 0), new THREE.Vector3(-2 + R1, 2.6 - p + 0.4, 0));
      w1.rotation.z = -p / R1;
      // подвижна: товарът се вдига наполовина
      const R2 = 0.35;
      const y2 = 0.3 + p / 2;
      const cx = 2 - 0;
      w2.position.set(cx, y2 + 0.9, 0);
      load2.position.set(cx, y2, 0);
      setRope(r2a, anchor2, new THREE.Vector3(cx - R2, y2 + 0.9, 0));
      setRope(r2b, new THREE.Vector3(cx + R2, y2 + 0.9, 0), new THREE.Vector3(3.05 - R2, 4.1, 0));
      scale2.position.set(3.05 + R2, 2.6 - p, 0);
      setRope(r2c, new THREE.Vector3(3.05 + R2, 4.1, 0), new THREE.Vector3(3.05 + R2, 2.6 - p + 0.4, 0));
      w2.rotation.z = p / R2;
      fixedTop2.rotation.z = -p / R2;
    };
    update();
    return { g, state, update, scale1, scale2, load1, load2 };
  }

  function step3() {
    shell.step(2);
    clearTip();
    L.root.visible = false;
    if (!pulleys) pulleys = buildPulleys();
    pulleys.g.visible = true;
    pulleys.state.pull = 0;
    pulleys.update();
    camera.position.set(PX, 3, 10);
    stage.flyTo([PX, 2.8, 9], [PX, 2.3, 0], 0.6);
    let mistakes = 0;
    const b1 = stage.bubble(pulleys.scale1, '', { lift: 0.6, cls: 'tag' });
    const b2 = stage.bubble(pulleys.scale2, '', { lift: 0.6, cls: 'tag' });
    const read = () => {
      b1.set(pulleys.state.pull > 0.05 ? 'Силомер: <b>6 N</b>' : 'Силомер: 0 N');
      b2.set(pulleys.state.pull > 0.05 ? 'Силомер: <b>3 N</b>' : 'Силомер: 0 N');
    };
    read();
    shell.task(`<p>Две макари вдигат по един товар от <b>6 N</b>. Въжето се дърпа със силомер.</p>
      <p><b>Дръпни въжетата</b> с плъзгача и гледай какво показват силомерите и колко се вдигат товарите.</p>
      <label class="small">Дръпни въжето <input class="slider pull" type="range" min="0" max="2" step="0.02" value="0"></label>
      <p class="small">Издърпано въже: <b class="pl">0</b> m · вдигане вляво: <b class="h1">0</b> m · вдясно: <b class="h2">0</b> m</p>
      <div class="qs" hidden>
        <p>Колко показва силомерът при <b>неподвижната</b> макара? <label class="num"><input class="a1" type="text" inputmode="decimal" size="4"> N</label></p>
        <p>А при <b>подвижната</b>? <label class="num"><input class="a2" type="text" inputmode="decimal" size="4"> N</label></p>
      </div>`);
    const sl = container.querySelector('.pull');
    const fmt = (v) => v.toFixed(2).replace('.', ',');
    sl.addEventListener('input', () => {
      pulleys.state.pull = +sl.value;
      pulleys.update();
      read();
      container.querySelector('.pl').textContent = fmt(+sl.value);
      container.querySelector('.h1').textContent = fmt(+sl.value);
      container.querySelector('.h2').textContent = fmt(+sl.value / 2);
      if (+sl.value > 1) container.querySelector('.qs').hidden = false;
    });
    shell.score(`Грешки: ${mistakes}`);
    const c = shell.setControls('<button class="btn primary">Провери</button>');
    c.querySelector('button').addEventListener('click', () => {
      if (container.querySelector('.qs').hidden) { shell.msg('Първо дръпни въжето поне 1 m.', 'bad'); return; }
      const a1 = parseFloat(container.querySelector('.a1').value.replace(',', '.'));
      const a2 = parseFloat(container.querySelector('.a2').value.replace(',', '.'));
      if (a1 === 6 && a2 === 3) {
        shell.msg('Вярно! Подвижната макара намалява силата наполовина, но въжето се дърпа двойно повече.', 'good');
        container.querySelectorAll('.a1, .a2').forEach((x) => { x.disabled = true; });
        q2();
      } else {
        mistakes++;
        shell.msg('Не е точно. Погледни числата до силомерите.', 'bad');
        shell.score(`Грешки: ${mistakes}`);
      }
    });
    function q2() {
      const c2 = shell.setControls(`<p><b>Тогава защо използваме неподвижната макара, щом силата не намалява?</b></p><div class="choices">
        <button class="choice" data-i="0">Сменя посоката на силата — дърпаме надолу, а товарът се вдига нагоре</button>
        <button class="choice" data-i="1">Намалява наполовина пътя, по който дърпаме</button>
        <button class="choice" data-i="2">Прави товара по-лек</button></div>`);
      c2.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        if (+b.dataset.i !== 0) { mistakes++; b.classList.add('wrong'); shell.msg('Не. Виж посоката, в която дърпаш.', 'bad'); return; }
        b.classList.add('right');
        c2.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        shell.msg('Вярно! По-удобно е да дърпаш надолу, отколкото да вдигаш нагоре.', 'good');
        scores.push(stepScore(mistakes, 3));
        c2.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary nx">Напред →</button></div>');
        c2.querySelector('.nx').addEventListener('click', () => {
          b1.remove(); b2.remove();
          step4();
        });
      }));
    }
  }

  // ---------- 4. Около нас ----------
  const EX = -24;
  let stopDrag = null;
  const EXAMPLES = [
    { id: 'scissors', label: 'Ножица', kind: 'lever', note: 'Два лоста с обща опора — винтчето по средата.' },
    { id: 'pliers', label: 'Клещи', kind: 'lever', note: 'Дългите дръжки дават голяма сила в челюстите.' },
    { id: 'seesaw', label: 'Люлка-везна', kind: 'lever', note: 'Дъска с опора по средата — лост.' },
    { id: 'arm', label: 'Ръката', kind: 'lever', note: 'Костите на ръката са лост, опората е в лакътя. Лост в природата!' },
    { id: 'flag', label: 'Знаме на пилон', kind: 'pulley', note: 'Дърпаш въжето надолу, а знамето се вдига — неподвижна макара.' },
    { id: 'crane', label: 'Строителна макара', kind: 'pulley', note: 'С макара кофата се вдига, като дърпаш надолу.' },
  ];

  function exModel(id) {
    const g = new THREE.Group();
    const metal = mat(0xb0bec5, { metalness: 0.7, roughness: 0.3 });
    switch (id) {
      case 'scissors': {
        // Две половини, които се въртят около винтчето (опората).
        const halves = [];
        for (const s of [1, -1]) {
          const half = new THREE.Group();
          half.position.y = 0.3;
          const blade = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.1), metal);
          blade.position.set(0.45, 0, 0);
          const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 20), mat(s > 0 ? 0xd92916 : 0x1865f2));
          ringM.rotation.x = Math.PI / 2;
          ringM.position.set(-0.35, 0, 0);
          half.add(blade, ringM);
          g.add(half);
          halves.push({ half, s });
        }
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 10), mat(0x333333));
        pin.position.y = 0.33;
        g.add(pin);
        g.userData.anim = (t) => { const a = 0.12 + Math.abs(Math.sin(t * 1.6)) * 0.3; for (const { half, s } of halves) half.rotation.y = s * a; };
        break;
      }
      case 'pliers': {
        const arms = [];
        for (const s of [1, -1]) {
          const arm = new THREE.Group();
          arm.position.y = 0.3;
          const h = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.1), mat(0xf1c232));
          h.position.set(-0.45, 0, s * 0.06);
          const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.08), metal);
          jaw.position.set(0.2, 0, -s * 0.03);
          arm.add(h, jaw);
          g.add(arm);
          arms.push({ arm, s });
        }
        g.userData.anim = (t) => { const a = 0.05 + Math.abs(Math.sin(t * 1.2)) * 0.18; for (const { arm, s } of arms) arm.rotation.y = s * a; };
        break;
      }
      case 'seesaw': {
        const plankG = new THREE.Group();
        plankG.position.y = 0.4;
        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.3), mat(0xa0703c));
        const kidA = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.16, 4, 8), mat(0xe53935));
        kidA.position.set(-0.75, 0.15, 0);
        const kidB = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.16, 4, 8), mat(0x1e88e5));
        kidB.position.set(0.75, 0.15, 0);
        plankG.add(plank, kidA, kidB);
        const tri = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.38, 3), mat(0x5c6b7a));
        tri.position.y = 0.19;
        g.add(plankG, tri);
        g.userData.anim = (t) => { plankG.rotation.z = Math.sin(t * 1.3) * 0.2; };
        break;
      }
      case 'arm': {
        const skin = mat(0xf0c3a0);
        const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 10), skin);
        upper.position.set(-0.2, 0.55, 0);
        // Предмишницата се върти около лакътя (опората) и вдига топката.
        const elbow = new THREE.Group();
        elbow.position.set(-0.2, 0.22, 0);
        const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.6, 4, 10), skin);
        fore.rotation.z = Math.PI / 2;
        fore.position.set(0.4, 0, 0);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), mat(0xe53935));
        ball.position.set(0.8, 0.14, 0);
        elbow.add(fore, ball);
        g.add(upper, elbow);
        g.userData.anim = (t) => { elbow.rotation.z = 0.15 + Math.abs(Math.sin(t * 1.1)) * 0.9; };
        break;
      }
      case 'flag': {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), metal);
        pole.position.y = 0.8;
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 16), mat(0x37474f));
        wheel.position.set(0.05, 1.6, 0);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.01), mat(0xffffff));
        flag.position.set(0.3, 1.1, 0);
        const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.107, 0.012), mat(0x00966e));
        g2.position.set(0.3, 1.1, 0);
        const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.107, 0.012), mat(0xd62612));
        r2.position.set(0.3, 0.993, 0);
        const flagG = new THREE.Group();
        flagG.add(flag, g2, r2);
        g.add(pole, wheel, flagG);
        g.userData.anim = (t) => { flagG.position.y = -0.55 + (Math.sin(t * 0.7) * 0.5 + 0.5) * 0.55; flagG.rotation.y = Math.sin(t * 3) * 0.08; };
        break;
      }
      case 'crane': {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), mat(0xf1c232));
        frame.position.set(-0.3, 0.7, 0);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), mat(0xf1c232));
        arm.position.set(0.05, 1.4, 0);
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 16), mat(0x37474f));
        wheel.position.set(0.4, 1.32, 0);
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4), mat(0xc49a54));
        rope.position.set(0.5, 0.92, 0);
        const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.22, 12), mat(0x78909c));
        bucket.position.set(0.5, 0.45, 0);
        g.add(frame, arm, wheel, rope, bucket);
        g.userData.anim = (t) => {
          const y = 0.35 + (Math.sin(t * 0.9) * 0.5 + 0.5) * 0.6;
          bucket.position.y = y;
          rope.scale.y = (1.32 - y - 0.11) / 0.8;
          rope.position.y = (1.32 + y + 0.11) / 2;
          wheel.rotation.z = y * 6;
        };
        break;
      }
      default: break;
    }
    return g;
  }

  function step4() {
    shell.step(3);
    clearTip();
    if (pulleys) pulleys.g.visible = false;
    const world = new THREE.Group();
    world.position.set(EX, 0, 0);
    scene.add(world);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(7, 48), mat(0xdde5ee));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.01;
    world.add(ground);
    camera.position.set(EX, 7, 10);
    stage.flyTo([EX, 6.5, 9], [EX, 0, 1.2], 0.6);
    const zL = zoneRing(0xa0703c, 1.7);
    zL.position.set(-2.7, 0.03, 3.3);
    const zP = zoneRing(0x1865f2, 1.7);
    zP.position.set(2.7, 0.03, 3.3);
    for (const [z, t, col] of [[zL, 'Лост', '#a0703c'], [zP, 'Макара', '#1865f2']]) {
      const l = labelSprite(t, { size: 0.4, color: '#fff', bg: col, border: col });
      l.position.set(0, 0.45, 2.0);
      z.add(l);
      world.add(z);
    }
    const models = [];
    const order = EXAMPLES.slice().sort(() => Math.random() - 0.5);
    order.forEach((o, i) => {
      const g = exModel(o.id);
      g.scale.setScalar(1.4);
      g.position.set(-1.9 + i * 1.2, 0, -0.8);
      g.userData.pickId = o.id;
      g.userData.dragId = o.id;
      g.userData.o = o;
      const l = labelSprite(o.label, { size: 0.17 });
      l.position.y = 1.4;
      g.add(l);
      g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      addHitBox(g, 0.8);
      world.add(g);
      models.push(g);
    });
    const stopEx = stage.tick((dt, t) => {
      models.forEach((g, i) => { if (g.userData.anim && !g.userData.dragging) g.userData.anim(t + i * 0.7); });
    });
    menu.setTitle('Предмети');
    menu.setItems(EXAMPLES.map((o) => ({ id: o.id, label: o.label, icon: o.kind === 'lever' ? '⚖' : '🛞' })));
    menu.show(true);
    menuHandler = (id) => {
      const g = models.find((m) => m.userData.o.id === id);
      if (!g) return;
      stage.focusOn(g, { dist: 4, height: 1.8, lift: 0.6, keepFollow: false });
      say(g, `<b>${esc(g.userData.o.label)}</b>`, 'tag', 1.6);
      menu.mark(id);
    };
    let mistakes = 0;
    let placed = 0;
    shell.task(`<p>Лостове и макари има навсякъде около нас — и дори в тялото ни.</p>
      <p><b>Провлачи всеки предмет</b> в кръга „Лост“ или „Макара“.</p>`);
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${placed} от ${EXAMPLES.length} · грешки: ${mistakes}`);
    upd();
    clickHandler = (hit) => {
      if (!hit) return clearTip();
      const o = hit.root.userData.o;
      if (o) say(hit.root, `<b>${esc(o.label)}</b>`, 'tag', 1.6);
    };
    const local = new THREE.Vector3();
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: (g) => { clearTip(); stage.stopFollow(); g.userData.dragging = true; },
      onDrop: (g, p, start) => {
        g.userData.dragging = false;
        local.copy(p); // позицията е спрямо world
        const o = g.userData.o;
        const inL = Math.hypot(local.x - zL.position.x, local.z - zL.position.z) < 1.8;
        const inP = Math.hypot(local.x - zP.position.x, local.z - zP.position.z) < 1.8;
        if (!inL && !inP) { g.position.copy(start); return; }
        if ((inL && o.kind === 'lever') || (inP && o.kind === 'pulley')) {
          g.userData.locked = true;
          placed++;
          const zone = inL ? zL : zP;
          const n = models.filter((m) => m.userData.locked && m.userData.o.kind === o.kind).length - 1;
          g.position.set(zone.position.x + ((n % 2) - 0.5) * 1.3, 0, zone.position.z + (Math.floor(n / 2) - 0.5) * 1.1);
          say(g, `✔ ${esc(o.note)}`, 'good', 1.6);
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          g.position.copy(start);
          say(g, `✘ ${esc(o.note)}`, 'bad', 1.6);
          shell.msg('Не е там.', 'bad');
        }
        upd();
        if (placed === EXAMPLES.length) {
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 3));
          const c = shell.setControls('<button class="btn primary">Виж резултата</button>');
          c.querySelector('button').addEventListener('click', () => {
            clearTip();
            const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
            menu.show(false);
            menuHandler = null;
            shell.finish(ratio, onComplete, () => {
              stopEx();
              scene.remove(world);
              restart();
            });
          });
        }
      },
    });
  }

  function restart() {
    scores.length = 0;
    clickHandler = null;
    camera.position.set(0, 3.8, 9.5);
    step1();
  }

  step1();
  return { dispose() { if (stopDrag) stopDrag(); stage.dispose(); } };
}
