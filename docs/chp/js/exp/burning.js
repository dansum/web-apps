// 6.2.6 „Горене и горива“ — газова (Бунзенова) горелка с отвор за въздух, лагерен огън с „триъгълник на горенето“
// и четири горива с табло за отделените вещества.
// Стъпки: опознай → пълно и непълно горене (опит) → как се гаси огън → горивата и техните продукти; скорост и топлина.
import { labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, view, bar, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { tagOver, TEACHER } from './chem6.js';

const V3 = THREE.Vector3;

function burnerModel() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.08, 20), mat(0x37474f));
  base.position.y = 0.04;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 14), mat(0x9e9e9e, { metalness: 0.6, roughness: 0.3 }));
  tube.position.y = 0.53;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 14), mat(0x607d8b, { metalness: 0.5 }));
  collar.position.y = 0.2;
  const hole = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), mat(0x111111));
  hole.position.set(0, 0.2, 0.09);
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 6, 16, Math.PI / 2), mat(0xff7043));
  hose.position.set(-0.4, 0.1, 0); hose.rotation.z = Math.PI;
  g.add(base, tube, collar, hole, hose);
  const flame = new THREE.Group();
  const outerM = new THREE.MeshBasicMaterial({ color: 0xffb300, transparent: true, opacity: 0.75, depthWrite: false });
  const innerM = new THREE.MeshBasicMaterial({ color: 0x42a5f5, transparent: true, opacity: 0.85, depthWrite: false });
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.7, 16, 1, true), outerM);
  outer.position.y = 0.35;
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 14), innerM);
  inner.position.y = 0.13;
  flame.add(outer, inner);
  flame.position.y = 0.98;
  g.add(flame);
  g.userData = { flame, outer, inner, outerM, innerM, hole };
  return g;
}

function campfire() {
  const g = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.05, 20), mat(0x9e9e9e, { flat: true }));
  sand.position.y = 0.025;
  g.add(sand);
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), mat(0x757575, { flat: true })); const a = (i / 10) * Math.PI * 2; s.position.set(Math.cos(a) * 0.62, 0.08, Math.sin(a) * 0.62); g.add(s); }
  const logs = new THREE.Group();
  for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 8), mat(0x6d4c41)); l.rotation.z = Math.PI / 2 - 0.5; l.rotation.y = (i / 4) * Math.PI * 2; l.position.y = 0.2; logs.add(l); }
  g.add(logs);
  const fire = new THREE.Group();
  const fm = [0xff6f00, 0xffa000, 0xffd54f].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, depthWrite: false }));
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.12 - (i % 3) * 0.02, 0.5, 8), fm[i % 3]); f.position.set(Math.cos(i * 1.1) * 0.1, 0.45, Math.sin(i * 1.1) * 0.1); f.userData.ph = i; fire.add(f); }
  g.add(fire);
  const cover = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd7b46a, { flat: true, roughness: 1 }));
  cover.scale.y = 0.6; cover.visible = false;
  g.add(cover);
  const steam = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xeceff1, transparent: true, opacity: 0, depthWrite: false })); s.userData.k = i / 6; g.add(s); steam.push(s); }
  g.userData = { fire, logs, cover, steam };
  return g;
}

const FUELS = [
  { id: 'f-coal', name: 'Въглища', co2: 100, so2: 80, soot: 70, h2o: 15, note: 'Твърдо изкопаемо гориво. При горене отделя най-много въглероден диоксид, серен диоксид и сажди.' },
  { id: 'f-oil', name: 'Бензин (от нефт)', co2: 80, so2: 25, soot: 30, h2o: 45, note: 'Течно гориво от нефт. Колите отделят въглероден диоксид, а при лошо горене — и въглероден оксид.' },
  { id: 'f-gas', name: 'Природен газ (метан)', co2: 55, so2: 2, soot: 5, h2o: 70, note: 'Най-чистото изкопаемо гориво: почти без серен диоксид и сажди, но пак отделя въглероден диоксид.' },
  { id: 'f-h2', name: 'Водород', co2: 0, so2: 0, soot: 0, h2o: 100, note: 'При горене на водород се получава само вода. Но за получаването му е нужна много енергия.' },
];

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Пълно и непълно горене', 'Как се гаси огън', 'Горива, скорост и топлина'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.9, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 15, d: 4.8 });

  // ---------- Горелка ----------
  const burner = burnerModel();
  burner.position.set(-4.4, 0, 0.3);
  burner.userData.pickId = 'burner';
  addHitBox(burner, 0.8);
  tagOver(stage, burner, 'Газова горелка', 1.9);
  scene.add(burner);
  const BU = burner.userData;
  const soot = [];
  for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: 0x212121, transparent: true, opacity: 0 })); s.userData.k = i / 12; burner.add(s); soot.push(s); }
  const coMeter = stage.bubble(new V3(-4.4, 2.35, 0.3), '', { cls: 'tag', lift: 0 });
  coMeter.el.style.visibility = 'hidden';
  const B = { air: 0, want: 0, on: false };

  // ---------- Лагерен огън ----------
  const camp = campfire();
  camp.position.set(-1.3, 0, 0.3);
  camp.userData.pickId = 'camp';
  addHitBox(camp, 0.9);
  tagOver(stage, camp, 'Огън в огнище', 1.2);
  scene.add(camp);
  const CU = camp.userData;
  const F = { fire: 1, mode: null, t: 0 };
  // триъгълник на горенето
  const tri = new THREE.Group();
  {
    const c = document.createElement('canvas'); c.width = 512; c.height = 460;
    const g2 = c.getContext('2d');
    g2.fillStyle = '#fffdf5'; g2.fillRect(0, 0, 512, 460);
    g2.strokeStyle = '#e65100'; g2.lineWidth = 14; g2.beginPath(); g2.moveTo(256, 50); g2.lineTo(470, 400); g2.lineTo(42, 400); g2.closePath(); g2.stroke();
    g2.fillStyle = '#1b2a3a'; g2.font = '700 40px system-ui, Arial'; g2.textAlign = 'center';
    g2.fillText('ГОРИВО', 256, 450); g2.save(); g2.translate(120, 215); g2.rotate(-1.02); g2.fillText('КИСЛОРОД', 0, 0); g2.restore();
    g2.save(); g2.translate(392, 215); g2.rotate(1.02); g2.fillText('ТОПЛИНА', 0, 0); g2.restore();
    g2.font = '64px system-ui'; g2.fillText('🔥', 256, 300);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.44), new THREE.MeshBasicMaterial({ map: tex }));
    tri.add(p);
  }
  tri.position.set(-1.3, 2.4, -3.95);
  tri.userData.pickId = 'triangle';
  scene.add(tri);

  // ---------- Горива и табло ----------
  const fuelG = FUELS.map((Fu, i) => {
    const g = new THREE.Group();
    if (i === 0) for (let k = 0; k < 7; k++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + (k % 3) * 0.03, 0), mat(0x212121, { flat: true, roughness: 0.6 })); c.position.set((k % 3) * 0.13 - 0.13, 0.1 + Math.floor(k / 3) * 0.08, (k % 2) * 0.1 - 0.05); g.add(c); }
    if (i === 1) { const can = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.18), mat(0xc62828)); can.position.y = 0.21; const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 8), mat(0x212121)); sp.position.set(0.1, 0.48, 0); g.add(can, sp); }
    if (i === 2) { const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.55, 14), mat(0x1565c0)); cyl.position.y = 0.3; const top = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x1565c0)); top.position.y = 0.575; g.add(cyl, top); }
    if (i === 3) { const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 14), mat(0xeceff1)); cyl.position.y = 0.3; const band = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.08, 14), mat(0xd32f2f)); band.position.y = 0.45; const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8), mat(0x9e9e9e)); valve.position.y = 0.65; g.add(cyl, band, valve); }
    g.position.set(1.2 + i * 1.0, 0, 0.9);
    g.userData.pickId = Fu.id;
    addHitBox(g, 0.6);
    tagOver(stage, g, Fu.name, 0.85, 0.15);
    scene.add(g);
    return g;
  });
  // табло с ленти
  const panel = new THREE.Group();
  const pc = document.createElement('canvas'); pc.width = 768; pc.height = 420;
  const pctx = pc.getContext('2d');
  const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace;
  const pmesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.97), new THREE.MeshBasicMaterial({ map: ptex }));
  panel.add(pmesh);
  panel.position.set(2.7, 2.4, -3.95);
  panel.userData.pickId = 'panel';
  scene.add(panel);
  const burned = new Set();
  function drawPanel() {
    pctx.fillStyle = '#ffffff'; pctx.fillRect(0, 0, 768, 420);
    pctx.fillStyle = '#1b2a3a'; pctx.font = '700 28px system-ui, Arial'; pctx.textAlign = 'left';
    pctx.fillText('Какво се отделя при горене (за еднаква топлина)', 20, 40);
    const rows = [['CO₂', 'co2', '#8d6e63'], ['SO₂', 'so2', '#fbc02d'], ['сажди', 'soot', '#424242'], ['вода', 'h2o', '#42a5f5']];
    const colW = 170;
    FUELS.forEach((Fu, i) => {
      const x = 130 + i * colW;
      pctx.fillStyle = '#37474f'; pctx.font = '600 20px system-ui, Arial'; pctx.textAlign = 'center';
      pctx.fillText(Fu.name.split(' ')[0], x + 60, 78);
      rows.forEach(([lab, key, col], r) => {
        const y = 100 + r * 75;
        pctx.fillStyle = '#eceff1'; pctx.fillRect(x, y, 130, 40);
        if (burned.has(Fu.id)) { pctx.fillStyle = col; pctx.fillRect(x, y, 1.3 * Fu[key], 40); }
      });
    });
    rows.forEach(([lab], r) => { pctx.fillStyle = '#1b2a3a'; pctx.font = '700 24px system-ui, Arial'; pctx.textAlign = 'left'; pctx.fillText(lab, 16, 128 + r * 75); });
    ptex.needsUpdate = true;
  }
  drawPanel();
  const burstM = new THREE.MeshBasicMaterial({ color: 0xffa000, transparent: true, opacity: 0, depthWrite: false });
  const burst = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), burstM);
  scene.add(burst);
  let burstT = 0;

  stage.tick((dt, t) => {
    // горелка
    B.air += (B.want - B.air) * Math.min(1, dt * 3);
    BU.flame.visible = B.on;
    const a = B.air;
    BU.outerM.color.setHex(0xffb300).lerp(new THREE.Color(0x64b5f6), a);
    BU.outerM.opacity = 0.8 - a * 0.25;
    BU.outer.scale.set(1 + (1 - a) * 0.6, 1 + (1 - a) * 0.5 + Math.sin(t * 13) * 0.05 * (1 - a + 0.3), 1 + (1 - a) * 0.6);
    BU.outer.position.y = 0.35 * (1 + (1 - a) * 0.5);
    BU.inner.visible = a > 0.3;
    soot.forEach((s) => { const f = (t * 0.5 + s.userData.k) % 1; s.position.set(Math.sin(s.userData.k * 20) * 0.1, 1.5 + f * 0.9, Math.cos(s.userData.k * 20) * 0.1); s.material.opacity = B.on ? (1 - a) * 0.8 * (1 - f) : 0; });
    if (B.on) { coMeter.el.style.visibility = ''; coMeter.set(`въздух ${bar(a * 100, '#42a5f5')} · сажди и CO ${bar((1 - a) * 100, '#e53935')}`); }
    // огнище
    if (F.mode && F.fire > 0) F.fire = Math.max(0, F.fire - dt * 0.7);
    if (!F.mode && F.fire < 1) F.fire = Math.min(1, F.fire + dt * 0.8);
    CU.fire.children.forEach((f) => { f.scale.set(F.fire, F.fire * (1 + Math.sin(t * 9 + f.userData.ph) * 0.15), F.fire); f.visible = F.fire > 0.02; });
    CU.cover.visible = F.mode === 'sand';
    CU.logs.visible = F.mode !== 'fuel';
    F.t += dt;
    CU.steam.forEach((s) => { const f = (t * 0.6 + s.userData.k) % 1; s.position.set(Math.sin(s.userData.k * 9) * 0.2, 0.4 + f * 1.0, 0); s.material.opacity = F.mode === 'water' && F.t < 3 ? 0.5 * (1 - f) : 0; });
    // „изгаряне“ на гориво
    if (burstT > 0) { burstT -= dt; burst.scale.setScalar(1 + (1 - burstT) * 1.5); burstM.opacity = Math.max(0, burstT * 0.8); }
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    B.on = false; B.air = 0; B.want = 0; coMeter.el.style.visibility = 'hidden';
    F.mode = null; F.fire = 1;
    burned.clear(); drawPanel();
    view(ctx, [-0.6, 1.1, 0], 6.4, { halfH: 2.2 });
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p><b>Горенето</b> е химична реакция на веществата с кислорода, при която се отделят топлина и светлина.</p>${TEACHER}<p><b>Разгледай всичко</b> от менюто или с клик.</p>`,
      items: [
        { id: 'burner', label: 'Газова горелка', icon: '🔥', note: 'В горелката гори природен газ. Отдолу има отвор, през който влиза въздух.', obj: () => burner, dist: 3, lift: 0.6, bubble: 1.6 },
        { id: 'camp', label: 'Огнище', icon: '🪵', note: 'Дървата горят, докато има гориво, кислород и достатъчно топлина.', obj: () => camp, dist: 3 },
        { id: 'triangle', label: 'Триъгълник на горенето', icon: '🔺', note: 'За горене са нужни и трите: <b>гориво</b>, <b>кислород</b> и <b>топлина</b>. Махнеш ли едното — огънят угасва.', obj: () => tri, dist: 4, lift: 0, bubble: 0.9 },
        { id: 'f-coal', label: 'Горива', icon: '⛽', note: 'Въглища, бензин (от нефт), природен газ и водород. Първите три са <b>изкопаеми горива</b>.', obj: () => fuelG[1], dist: 3.4 },
        { id: 'panel', label: 'Табло', icon: '📊', note: 'Тук ще сравним какво отделят горивата при горене.', obj: () => panel, dist: 5, lift: 0, bubble: 1.2 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Пълно и непълно горене ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    B.on = true; B.want = 0; B.air = 0;
    view(ctx, [-4.4, 1.3, 0.3], 1.2, { halfH: 1.3, elev: 0.15 });
    shell.task(`<p>Горелката гори със затворен отвор за въздух: пламъкът е жълт и пуши.</p>${TEACHER}`);
    choice(ctx, {
      q: 'Какво ще стане с пламъка, ако отворим отвора и пуснем повече въздух?',
      options: [
        { t: 'Ще стане син, по-горещ и без сажди.', ok: true, why: 'Да проверим! Плъзни лентата.' },
        { t: 'Ще угасне — въздухът го духа.', ok: false, why: 'Във въздуха има кислород. Нужен ли е той за горенето?' },
        { t: 'Ще пуши още повече.', ok: false, why: 'Саждите са от недоизгоряло гориво. Повече кислород помага ли да изгори докрай?' },
      ],
      hint: 'Повече кислород — по-пълно горене.',
      onRight: (m) => air(m),
    });
  }
  function air(m0) {
    let mistakes = m0;
    const c = shell.setControls('<label class="row">Отвор за въздух: затворен <input type="range" class="air" min="0" max="100" value="0" style="flex:1"> отворен</label>');
    let said = false;
    c.querySelector('.air').addEventListener('input', (e) => {
      B.want = +e.target.value / 100;
      if (B.want >= 1 && !said) {
        said = true;
        setTimeout(() => {
          ctx.say(burner, 'При много кислород горенето е <b>пълно</b>: син пламък, CO₂ и вода. При малко кислород — <b>непълно</b>: сажди и отровният <b>въглероден оксид</b> (угарен газ).', 'wide', 1.9);
          choice(ctx, {
            q: 'Кое описва горенето?',
            options: [
              { t: 'Химична реакция с кислород, при която се отделят топлина и светлина.', ok: true, why: 'Вярно!' },
              { t: 'Стопяване на горивото.', ok: false, why: 'При стопяване не се получават нови вещества. А при горене?' },
              { t: 'Реакция, която поглъща топлина.', ok: false, why: 'Горелката нагрява ли, или охлажда?' },
            ],
            hint: 'Какво получаваме от огъня?',
            mistakes,
            onRight: (mm) => { ctx.scores[0] = stepScore(mm, 3); nextBtn(ctx, 'Напред →', step3); },
          });
        }, 1200);
      }
    });
  }

  // ---------- 3. Как се гаси огън ----------
  const ACTIONS = [
    { id: 'sand', label: '🏖 Покрий с пясък', removes: 1 },
    { id: 'water', label: '💧 Залей с вода', removes: 2 },
    { id: 'fuel', label: '🪵 Махни дървата', removes: 0 },
  ];
  const SIDES = ['гориво', 'кислород', 'топлина'];
  function step3() {
    shell.step(2);
    ctx.clearTip();
    B.on = false; coMeter.el.style.visibility = 'hidden';
    F.mode = null; F.fire = 1;
    view(ctx, [-1.3, 1.25, -0.3], 1.6, { halfH: 2.4, elev: 0.3 });
    let mistakes = 0; let k = 0;
    const next = () => {
      ctx.clearTip();
      if (k >= ACTIONS.length) {
        ctx.scores[1] = stepScore(mistakes, 3);
        shell.task('<p>Махнеш ли една страна на триъгълника, огънят угасва.</p><p class="warn">⚠ Горящо олио или ел. уред <b>никога</b> не се гаси с вода! При пожар — 112.</p>');
        shell.setControls('');
        nextBtn(ctx, 'Напред →', step4);
        return;
      }
      F.mode = null;
      const A = ACTIONS[k];
      shell.task(`<p>Огънят гори отново. Направи: <b>${A.label}</b>.</p>`);
      const c = shell.setControls(`<div class="row"><button class="btn primary act">${A.label}</button></div>`);
      c.querySelector('.act').addEventListener('click', () => {
        F.mode = A.id; F.t = 0;
        setTimeout(() => {
          choice(ctx, {
            q: 'Огънят угасна. Какво махнахме?',
            options: SIDES.map((s, i) => ({ t: s[0].toUpperCase() + s.slice(1), ok: i === A.removes, why: i === A.removes ? ['Без гориво няма какво да гори.', 'Пясъкът не пуска кислорода до огъня.', 'Водата охлажда горящите дърва.'][i] : `Не е ${s}. Помисли какво направи действието.` })),
            hint: 'Пясъкът покрива, водата охлажда.',
            mistakes,
            onRight: (m) => { mistakes = m; k++; nextBtn(ctx, k < ACTIONS.length ? 'Запали отново →' : 'Готово →', next); },
          });
        }, 1800);
      });
    };
    next();
  }

  // ---------- 4. Горива, скорост и топлина ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    F.mode = 'sand';
    view(ctx, [2.7, 1.25, -0.4], 2.4, { halfH: 2.5, elev: 0.35 });
    shell.task('<p><b>Кликни всяко гориво</b>, за да го „изгориш“, и сравни таблото.</p>');
    shell.setControls('');
    ctx.click = (id) => {
      const i = FUELS.findIndex((x) => x.id === id);
      if (i < 0 || burned.has(id)) return;
      burned.add(id); drawPanel();
      burst.position.copy(fuelG[i].position).add(new V3(0, 0.6, 0)); burstT = 1;
      ctx.say(fuelG[i], FUELS[i].note, 'wide', 1.0);
      if (burned.size === FUELS.length) {
        ctx.click = null;
        setTimeout(() => {
          ctx.clearTip();
          shell.task('<p>Отделя ли това гориво въглероден диоксид при горене?</p>');
          sortTask(ctx, {
            bins: ['Отделя CO₂', 'Не отделя CO₂'],
            items: [
              { t: 'Въглища', bin: 0, why: 'Въглищата са главно въглерод.' },
              { t: 'Бензин', bin: 0, why: 'Бензинът съдържа въглерод и водород.' },
              { t: 'Природен газ (метан CH₄)', bin: 0, why: 'В метана има въглерод.' },
              { t: 'Водород', bin: 1, why: 'При горене на водород се получава само вода.' },
            ],
            hint: 'Има ли въглерод в горивото?',
            onDone: (m1) => {
              shell.task('<p>Бърз или бавен процес? Отделя или поглъща топлина?</p>');
              sortTask(ctx, {
                bins: ['Бързо, отделя топлина', 'Бавно, отделя топлина', 'Поглъща топлина'],
                items: [
                  { t: 'Горене на газ в горелката', bin: 0, why: 'Горенето е бързо и отделя топлина и светлина.' },
                  { t: 'Ръждясване на желязото', bin: 1, why: 'Корозията е бавна; топлината се отделя незабележимо.' },
                  { t: 'Дишане в клетките', bin: 1, why: 'Бавно окисление — затова тялото ни е топло.' },
                  { t: 'Фотосинтеза в листата', bin: 2, why: 'Растенията поглъщат енергията на светлината.' },
                  { t: 'Разлагане на вода с електричен ток', bin: 2, why: 'Нужна е енергия от тока.' },
                ],
                hint: 'Помисли: нужна ли е енергия отвън, или се отделя?',
                mistakes: m1,
                onDone: (m2) => { ctx.scores[2] = stepScore(m2, 3); shell.task('<p>Горивата ни дават енергия, но замърсяват въздуха. Затова ги пестим.</p>'); finishBtn(ctx, onComplete, restart); },
              });
            },
          });
        }, 1500);
      }
    };
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    step1();
  }
  step1();
  return { dispose() { coMeter.remove(); stage.dispose(); } };
}
