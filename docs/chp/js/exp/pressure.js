// 6.1.4 „Налягане“ — блок върху пясък с различна площ, предмети за голямо и малко налягане, бутилка с отвори.
// Стъпки: опознай → блокът в пясъка (опит) → подреди предметите (приложи) → предскажи (вода и планина).
import { labelSprite, mat, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, fmt, stepScore } from './labkit.js';

// Блок 20 cm × 10 cm × 5 cm с тежест 20 N. В сцената 1 единица = 20 cm.
const BLOCK = { F: 20, dims: [1, 0.5, 0.25] };
const POSES = {
  flat: { name: 'Легнал', S: 0.02, rot: [0, 0, 0], h: 0.25, face: '20 cm × 10 cm' },
  side: { name: 'На ръб', S: 0.01, rot: [Math.PI / 2, 0, 0], h: 0.5, face: '20 cm × 5 cm' },
  up: { name: 'Изправен', S: 0.005, rot: [0, 0, Math.PI / 2], h: 1, face: '10 cm × 5 cm' },
};
const SAND_X = -2.2;
const SAND_TOP = 0.36;

const ITEMS = [
  { id: 'knife', label: 'Нож', big: true, note: 'Острието е тънко: малка площ → голямо налягане. Затова ножът реже.' },
  { id: 'pin', label: 'Кабърче', big: true, note: 'Върхът е много малък: силата на палеца дава огромно налягане и кабърчето влиза в дървото.' },
  { id: 'needle', label: 'Игла', big: true, note: 'Острият връх на иглата има малка площ и лесно пробива плата.' },
  { id: 'skis', label: 'Ски', big: false, note: 'Ските разпределят тежестта на голяма площ: налягането е малко и не потъваме в снега.' },
  { id: 'track', label: 'Гъсеница на трактор', big: false, note: 'Широката гъсеница има голяма площ, затова тежкият трактор не затъва в калта.' },
  { id: 'bag', label: 'Раница с широки презрамки', big: false, note: 'Широките презрамки натискат раменете върху по-голяма площ и не ни убиват.' },
];

function itemModel(id) {
  const g = new THREE.Group();
  const metal = mat(0xb0bec5, { metalness: 0.6, roughness: 0.3 });
  switch (id) {
    case 'knife': {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.02), metal);
      blade.position.set(0.15, 0.3, 0);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.08), mat(0x5d4037));
      handle.position.set(-0.4, 0.32, 0);
      g.add(blade, handle);
      g.rotation.y = 0.4;
      break;
    }
    case 'pin': {
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 20), mat(0xe53935));
      head.position.y = 0.45;
      const point = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.35, 8), metal);
      point.rotation.x = Math.PI;
      point.position.y = 0.25;
      g.add(head, point);
      break;
    }
    case 'needle': {
      const n = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 6), metal);
      n.rotation.z = 0.5;
      n.position.y = 0.4;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.06, 6), metal);
      tip.position.set(0.2, 0.05, 0);
      g.add(n);
      break;
    }
    case 'skis': {
      for (const z of [-0.12, 0.12]) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.12), mat(0x1e88e5));
        s.position.set(0, 0.05, z);
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.12), mat(0x1e88e5));
        tip.position.set(0.6, 0.09, z);
        tip.rotation.z = 0.5;
        g.add(s, tip);
      }
      break;
    }
    case 'track': {
      const belt = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.7, 4, 12), mat(0x37474f));
      belt.rotation.z = Math.PI / 2;
      belt.scale.set(1, 1, 1.6);
      belt.position.y = 0.16;
      g.add(belt);
      for (let i = -3; i <= 3; i++) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.46), mat(0x212121));
        r.position.set(i * 0.12, 0.3, 0);
        g.add(r);
      }
      break;
    }
    case 'bag': {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), mat(0x43a047));
      body.position.y = 0.3;
      for (const x of [-0.13, 0.13]) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.04), mat(0x2e7d32));
        st.position.set(x, 0.32, -0.15);
        g.add(st);
      }
      g.add(body);
      break;
    }
    default: break;
  }
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Блокът в пясъка', 'Голямо или малко налягане', 'Предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.6, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14, d: 5 });

  // ---------- Тава с пясък и блок ----------
  const tray = new THREE.Group();
  {
    const wall = mat(0x8d6e63);
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.8), wall);
    base.position.y = 0.03;
    tray.add(base);
    for (const [w, d, x, z] of [[2.6, 0.06, 0, 0.87], [2.6, 0.06, 0, -0.87], [0.06, 1.8, 1.27, 0], [0.06, 1.8, -1.27, 0]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.42, d), wall);
      m.position.set(x, 0.21, z);
      tray.add(m);
    }
    const sand = new THREE.Mesh(new THREE.BoxGeometry(2.48, SAND_TOP - 0.06, 1.68), mat(0xe6c88f, { flat: true }));
    sand.position.y = 0.06 + (SAND_TOP - 0.06) / 2;
    tray.add(sand);
    tray.position.x = SAND_X;
    tray.userData.pickId = 'sand';
    scene.add(tray);
  }
  // Ямка (тъмен отпечатък), която расте с дълбочината.
  const pit = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xb08850, transparent: true, opacity: 0 }));
  pit.rotation.x = -Math.PI / 2;
  pit.position.set(SAND_X, SAND_TOP + 0.002, 0);
  scene.add(pit);
  function blockMesh(color) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(...BLOCK.dims), mat(color));
    const g = new THREE.Group();
    g.add(b);
    const l = labelSprite('20 N', { size: 0.18 });
    l.position.set(0, 0, 0.3);
    g.add(l);
    g.userData.box = b;
    return g;
  }
  const block = blockMesh(0xc0504d);
  block.userData.pickId = 'block';
  scene.add(block);
  const block2 = blockMesh(0x8e3b38);
  block2.visible = false;
  scene.add(block2);
  const S = { pose: 'flat', depth: 0, target: 0, n: 1, y: 1.4 };
  function setPose(p) {
    S.pose = p;
    const P = POSES[p];
    block.userData.box.rotation.set(...P.rot);
    S.y = SAND_TOP + P.h / 2 + 0.9;
    S.target = 0;
  }
  function pressure() { return (BLOCK.F * S.n) / POSES[S.pose].S; }
  function drop() { S.target = (pressure() / 4000) * 0.16; }
  stage.tick((dt, t) => {
    const P = POSES[S.pose];
    const rest = SAND_TOP + P.h / 2 - S.target;
    S.y += (rest - S.y) * Math.min(1, dt * 4);
    block.position.set(SAND_X, S.y, 0);
    block2.position.set(SAND_X, S.y + 0.25, 0);
    const sunk = Math.max(0, SAND_TOP + P.h / 2 - S.y);
    // отпечатъкът е колкото стената, на която стои блокът
    const fw = S.pose === 'up' ? 0.25 : 1; const fd = S.pose === 'flat' ? 0.5 : 0.25;
    pit.scale.set(fw * 1.15, fd * 1.15, 1);
    pit.material.opacity = Math.min(0.85, sunk * 8);
    pit.position.y = SAND_TOP + 0.002;
  });

  // ---------- Предмети за подреждане ----------
  const SX = 3.2;
  const models = ITEMS.map((it, i) => {
    const g = itemModel(it.id);
    g.userData.pickId = it.id;
    g.userData.it = it;
    g.userData.home = new THREE.Vector3(SX - 2.25 + i * 0.9, 0, -0.9 + (i % 2) * 0.35);
    g.position.copy(g.userData.home);
    addHitBox(g, 0.6); // без етикета, за да не се застъпват зоните за хващане
    const l = labelSprite(it.label, { size: 0.17 });
    l.position.y = 0.9;
    g.add(l);
    stage.steadyLabel(l, 7);
    scene.add(g);
    return g;
  });
  const zBig = zoneRing(0xe53935, 1.05);
  zBig.position.set(SX - 1.25, 0.01, 1.25);
  const zSmall = zoneRing(0x1e88e5, 1.05);
  zSmall.position.set(SX + 1.25, 0.01, 1.25);
  for (const [z, txt, col] of [[zBig, 'Голямо налягане', '#e53935'], [zSmall, 'Малко налягане', '#1e88e5']]) {
    const l = labelSprite(txt, { size: 0.24, color: '#fff', bg: col, border: col });
    l.position.set(0, 0.3, 0);
    z.add(l);
    z.userData.pickId = z === zBig ? 'zone-big' : 'zone-small';
    scene.add(z);
  }
  zBig.visible = false; zSmall.visible = false;

  // ---------- Бутилка с три отвора ----------
  const BX = -5.4;
  const bottle = new THREE.Group();
  const STAND = 0.8; const H = 1.4;
  const holes = [0.3, 0.7, 1.1];
  const jets = [];
  {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8, STAND, 0.8), mat(0x90a4ae));
    stand.position.y = STAND / 2;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.6, 24, 1, true), glass(0.3));
    body.position.y = STAND + 0.8;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, H, 24), new THREE.MeshStandardMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.55, depthWrite: false }));
    water.position.y = STAND + H / 2;
    bottle.add(stand, body, water);
    holes.forEach((h, i) => {
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), new THREE.MeshBasicMaterial({ color: 0x0d47a1 }));
      d.position.set(0.322, STAND + h, 0);
      d.rotation.y = Math.PI / 2;
      bottle.add(d);
      const l = labelSprite(['Долен', 'Среден', 'Горен'][i], { size: 0.14 });
      l.position.set(-0.6, STAND + h, 0);
      bottle.add(l);
      const jet = new THREE.Group();
      for (let k = 0; k < 16; k++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ color: 0x29b6f6 }));
        p.userData.k = k / 16;
        jet.add(p);
      }
      jet.visible = false;
      bottle.add(jet);
      // скорост от дълбочината (v² = 2gd), път до масата
      const depth = H - h; const y0 = STAND + h; const g = 9.8;
      const v = Math.sqrt(2 * g * depth);
      const T = Math.sqrt((2 * y0) / g);
      jets.push({ jet, v, T, y0, range: v * T });
    });
    bottle.position.set(BX, 0, 0);
    bottle.userData.pickId = 'bottle';
    scene.add(bottle);
  }
  stage.tick((dt, t) => {
    for (const J of jets) {
      if (!J.jet.visible) continue;
      for (const p of J.jet.children) {
        const f = (t * 0.8 + p.userData.k) % 1;
        const tt = f * J.T;
        p.position.set(0.33 + J.v * tt, J.y0 - 4.9 * tt * tt, 0);
      }
    }
  });
  const mountain = new THREE.Group();
  {
    const m = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 7), mat(0x6a994e, { flat: true }));
    m.position.y = 1.1;
    const snow = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.72, 7), mat(0xffffff, { flat: true }));
    snow.position.y = 1.85;
    mountain.add(m, snow);
    mountain.position.set(0.2, 0, -2.4);
    mountain.scale.setScalar(0.7);
    mountain.userData.pickId = 'mountain';
    scene.add(mountain);
  }

  function resetItems() {
    for (const g of models) { g.position.copy(g.userData.home); g.userData.locked = false; delete g.userData.dragId; }
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    setPose('flat'); S.n = 1; block2.visible = false; block.visible = true;
    for (const J of jets) J.jet.visible = false;
    resetItems();
    zBig.visible = false; zSmall.visible = false;
    view(ctx, [-0.6, 0.6, 0], 6.2, { halfH: 1.5 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Защо ножът реже, а със ски не потъваме в снега? Отговорът е в <b>налягането</b>.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'block', label: 'Блок', icon: '🧱', note: 'Блокът е 20 cm × 10 cm × 5 cm и натиска с тежестта си <b>20 N</b>. Тази сила е силата на натиск.', obj: () => block, dist: 3.2 },
        { id: 'sand', label: 'Пясък', icon: '🏖', note: 'Колкото по-голямо е налягането, толкова по-дълбоко блокът потъва в пясъка. <b>Налягане = сила : площ</b> (p = F / S). Мерната единица е паскал: 1 Pa = 1 N/m².', obj: () => tray, dist: 3.8 },
        { id: 'knife', label: 'Нож', icon: '🔪', note: ITEMS[0].note, obj: () => models[0], dist: 2.6 },
        { id: 'skis', label: 'Ски', icon: '🎿', note: ITEMS[3].note, obj: () => models[3], dist: 2.6 },
        { id: 'bottle', label: 'Бутилка с вода', icon: '🧴', note: 'Водата натиска дъното и стените на съда. Колкото по-дълбоко, толкова по-голямо е налягането на водата (хидростатично налягане).', obj: () => bottle, dist: 3.6, bubble: 2.6 },
        { id: 'mountain', label: 'Планина', icon: '⛰', note: 'Въздухът също натиска: това е <b>атмосферното налягане</b>. Колкото по-високо се качваме, толкова по-малко е то.', obj: () => mountain, dist: 4, bubble: 1.9 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Блокът в пясъка ----------
  function step2() {
    shell.step(1);
    setPose('flat'); S.n = 1; block2.visible = false;
    view(ctx, [SAND_X, 0.7, 0], 1.9, { halfH: 1.3 });
    shell.task('<p>Един и същ блок може да легне върху пясъка с три различни стени.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Как блокът ще потъне най-дълбоко?',
      options: [
        { t: 'Изправен — на най-малката си стена', ok: true, why: 'Да проверим! Постави блока по трите начина.' },
        { t: 'Легнал — на най-голямата си стена', ok: false, why: 'Силата е една и съща. На коя стена тя се разпределя върху най-малка площ?' },
        { t: 'Еднакво, защото тежестта е една и съща', ok: false, why: 'Тежестта е еднаква, но площта, върху която натиска, не е. Има ли значение площта?' },
      ],
      hint: 'p = F / S. Колкото по-малка е площта, толкова…',
      onRight: (m) => { mistakes = m; tryPoses(); },
    });
    function tryPoses() {
      const tried = new Set();
      const rows = () => Object.entries(POSES).map(([k, P]) => `<tr><td>${P.name}</td><td>${fmt(P.S, P.S < 0.01 ? 3 : 2)} m²</td><td>${tried.has(k) ? `<b>${BLOCK.F / P.S} Pa</b>` : '—'}</td></tr>`).join('');
      const draw = () => shell.task(`<p><b>Постави блока</b> по трите начина и сравни.</p>
        <table class="small" style="width:100%"><tr><th style="text-align:left">Блок</th><th>Площ S</th><th>Налягане p</th></tr>${rows()}</table>`);
      draw();
      const c = shell.setControls(`<div class="row">${Object.entries(POSES).map(([k, P]) => `<button class="btn pose" data-p="${k}">${P.name}</button>`).join('')}</div>`);
      c.querySelectorAll('.pose').forEach((b) => b.addEventListener('click', () => {
        setPose(b.dataset.p);
        setTimeout(drop, 450);
        tried.add(b.dataset.p);
        const P = POSES[b.dataset.p];
        ctx.say(block, `p = F / S = ${BLOCK.F} N : ${fmt(P.S, P.S < 0.01 ? 3 : 2)} m² = <b>${BLOCK.F / P.S} Pa</b>`, 'tag', 1.0);
        draw();
        if (tried.size === 3 && !c.querySelector('.nx')) {
          shell.msg('Най-дълбоко потъва изправеният блок: най-малка площ → най-голямо налягане.', 'good');
          nextBtn(ctx, 'Напред →', two);
        }
      }));
    }
    function two() {
      ctx.clearTip();
      setPose('flat'); setTimeout(drop, 300);
      shell.task(`<p>Блокът лежи на най-голямата си стена (0,02 m²) и натиска с <b>1000 Pa</b>.</p>
        <p>Ще сложим <b>още един еднакъв блок</b> отгоре. <b>Какво ще е налягането?</b></p>
        <label class="num"><input class="ans" type="text" inputmode="decimal"> Pa</label>`);
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      const inp = container.querySelector('.ans');
      c.querySelector('.chk').addEventListener('click', () => {
        const v = parseFloat(inp.value.replace(/\s/g, '').replace(',', '.'));
        if (!Number.isFinite(v)) return;
        if (v === 2000) {
          inp.classList.add('right');
          c.querySelector('.chk').disabled = true;
          S.n = 2; block2.visible = true; S.y += 0.4; drop();
          ctx.say(block, 'p = 40 N : 0,02 m² = <b>2000 Pa</b>', 'good', 1.3);
          shell.msg('Вярно! Двойна сила върху същата площ → двойно налягане. Блокът потъна по-дълбоко.', 'good');
          ctx.scores[0] = stepScore(mistakes, 3);
          nextBtn(ctx, 'Напред →', step3);
          return;
        }
        mistakes++;
        inp.classList.add('wrong');
        shell.msg(`Не е ${fmt(v, 0)} Pa. Колко е силата на натиск с два блока?${mistakes >= 2 ? ' Подсказка: 40 N : 0,02 m².' : ''}`, 'bad');
      });
    }
  }

  // ---------- 3. Голямо или малко налягане ----------
  let stopDrag = null;
  function step3() {
    shell.step(2);
    ctx.clearTip();
    S.n = 1; block2.visible = false;
    zBig.visible = true; zSmall.visible = true;
    resetItems();
    for (const g of models) g.userData.dragId = g.userData.it.id;
    view(ctx, [SX, 0.2, 0.3], 3.0, { halfH: 1.6, elev: 0.75 });
    let mistakes = 0; let placed = 0;
    shell.task('<p>Някои неща са направени за <b>голямо налягане</b>, а други — за <b>малко</b>.</p><p><b>Провлачи всеки предмет</b> в правилния кръг.</p>');
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${placed} от ${ITEMS.length} · грешки: ${mistakes}`);
    upd();
    ctx.click = (id) => { const g = models.find((m) => m.userData.it.id === id); if (g) ctx.say(g, `<b>${esc(g.userData.it.label)}</b>`, 'tag', 1.0); };
    stopDrag = stage.enableDrag({
      planeY: 0,
      onStart: () => ctx.clearTip(),
      onDrop: (g, p, start) => {
        const it = g.userData.it;
        const inB = Math.hypot(p.x - zBig.position.x, p.z - zBig.position.z) < 1.15;
        const inS = Math.hypot(p.x - zSmall.position.x, p.z - zSmall.position.z) < 1.15;
        if (!inB && !inS) { g.position.copy(start); return; }
        if ((inB && it.big) || (inS && !it.big)) {
          g.userData.locked = true;
          const zone = inB ? zBig : zSmall;
          const n = models.filter((m) => m.userData.locked && m.userData.it.big === it.big).length - 1;
          g.position.set(zone.position.x + (n - 1) * 0.6, 0, zone.position.z + (n === 1 ? -0.35 : 0.2));
          placed++;
          ctx.say(g, `✔ ${esc(it.note)}`, 'good', 1.0);
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          g.position.copy(start);
          ctx.say(g, `✘ ${esc(it.label)}: помисли каква е площта, върху която натиска.${mistakes >= 2 ? ' Острите неща имат малка площ, широките — голяма.' : ''}`, 'bad', 1.0);
          shell.msg('Не е там.', 'bad');
        }
        upd();
        if (placed === ITEMS.length) {
          stopDrag(); stopDrag = null;
          ctx.click = null;
          ctx.scores[1] = stepScore(mistakes, 3);
          nextBtn(ctx, 'Напред →', step4);
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    shell.score('');
    for (const g of models) delete g.userData.dragId;
    view(ctx, [BX + 1.1, 1.2, 0], 2.4, { halfH: 1.7, elev: 0.3 });
    shell.task('<p>В бутилката с вода има три отвора на различна дълбочина. Сега са запушени.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Когато ги отпушим, от кой отвор водата ще излиза най-силно?',
      options: [
        { t: 'От долния', ok: true, why: 'Да видим!' },
        { t: 'От горния', ok: false, why: 'Горният отвор е близо до повърхността. Там налягането на водата голямо ли е?' },
        { t: 'Еднакво от трите', ok: false, why: 'Отворите са на различна дълбочина. Зависи ли налягането на водата от дълбочината?' },
      ],
      hint: 'Колкото по-дълбоко, толкова по-голямо е налягането на водата.',
      onRight: (m) => {
        mistakes = m;
        for (const J of jets) J.jet.visible = true;
        ctx.say(bottle, 'Най-силно блика долната струя: там водата е най-дълбока и налягането е най-голямо.', 'good', 2.7);
        nextBtn(ctx, 'Още една задача →', mountainQ);
      },
    });
    function mountainQ() {
      ctx.clearTip();
      for (const J of jets) J.jet.visible = false;
      view(ctx, [0.2, 1.0, -2.4], 1.8, { halfH: 1.3 });
      shell.task('<p>Качваш се от Самоков до връх Мусала (2925 m).</p>');
      choice(ctx, {
        q: 'Какво става с атмосферното налягане, докато се качваш?',
        options: [
          { t: 'Намалява', ok: true, why: 'Вярно! Колкото по-високо сме, толкова по-малко въздух има над нас и толкова по-малко е налягането му.' },
          { t: 'Увеличава се', ok: false, why: 'Помисли: колко въздух остава над теб, когато си по-високо?' },
          { t: 'Не се променя', ok: false, why: 'Атмосферното налягане зависи от височината. Как?' },
        ],
        hint: 'Атмосферното налягане идва от тежестта на въздуха над нас.',
        mistakes,
        onRight: (m) => {
          ctx.say(mountain, 'Високо в планината атмосферното налягане е по-малко.', 'good', 2.2);
          ctx.scores[2] = stepScore(m, 3);
          finishBtn(ctx, onComplete, restart);
        },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    if (stopDrag) { stopDrag(); stopDrag = null; }
    step1();
  }
  step1();
  return { dispose() { if (stopDrag) stopDrag(); stage.dispose(); } };
}
