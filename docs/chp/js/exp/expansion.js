// 5.1.3 „Температура, топлина, разширение“ — релси с процеп, термометър, топче и халка, жици.
// Стъпки: опознай → релсите при жега и студ (опит) → топче, халка и термометър (приложи) → предскажи.
import { labelSprite, mat, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, view, fmt, stepScore } from './labkit.js';

const T0 = 10;          // температура, при която процепът е „нормален“
const GAP0 = 0.12;      // процеп при T0 (в сцената)
const GROW = 0.0035;    // колко се смалява процепът за 1 °C — силно увеличено, за да се вижда
const SEG = 1.25;       // дължина на една релса в сцената
const RX = -5.0;        // начало на релсовия път
const TH_X = -0.6;      // термометър
const BX = 2.3;         // топче и халка
const SAFE = '<p class="warn">⚠ Нагряване с огън — <b>само с възрастен</b>.</p>';
const tStr = (T) => `${T > 0 ? '+' : T < 0 ? '−' : ''}${Math.abs(T)} °C`;

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Релсите в жега и студ', 'Топче, халка и термометър', 'Предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 4, 10], target: [0, 0.8, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 13.5, d: 4.6 });

  const S = { T: 10, shown: 10, gaps: true, buckle: 0 };

  // ---------- Релсов път ----------
  const track = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.9), mat(0x6d4c41));
    sl.position.set(RX + 0.2 + i * 0.47, 0.03, 0);
    track.add(sl);
  }
  const railMat = mat(0x8d8f93, { metalness: 0.7, roughness: 0.35 });
  const railSegs = [];
  for (const z of [-0.25, 0.25]) for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.07), railMat);
    m.userData.i = i; m.userData.z = z;
    track.add(m);
    railSegs.push(m);
  }
  // „заварена“ релса без процепи — от много малки парчета, за да може да се изкриви
  const welded = new THREE.Group();
  const wParts = [];
  for (const z of [-0.25, 0.25]) for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.07), railMat);
    m.userData.i = i; m.userData.z = z;
    welded.add(m);
    wParts.push(m);
  }
  welded.visible = false;
  track.add(welded);
  track.position.z = 0.4;
  track.userData.pickId = 'rails';
  scene.add(track);
  const gapMarks = [1, 2].map((k) => {
    const s = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 20), new THREE.MeshBasicMaterial({ color: 0xe53935, side: THREE.DoubleSide }));
    s.rotation.x = -Math.PI / 2;
    s.userData.k = k;
    scene.add(s);
    return s;
  });
  function layoutRails() {
    const gap = Math.max(0.004, GAP0 - (S.T - T0) * GROW);
    const len = SEG + (S.T - T0) * GROW; // всяка релса се удължава колкото процепът се смалява
    for (const m of railSegs) {
      m.scale.x = len;
      m.position.set(RX + len / 2 + m.userData.i * (len + gap), 0.11, m.userData.z);
    }
    const x1 = RX + len + gap / 2;
    gapMarks.forEach((g, k) => { g.position.set(x1 + k * (len + gap), 0.17, 0.4 + 0.25); g.visible = S.gaps && track.visible; });
    // без процепи: общата дължина няма къде да отиде — релсата се изкривява встрани
    const total = 3 * SEG + 2 * GAP0;
    const piece = total / 24;
    const extra = Math.max(0, (S.T - T0) * GROW * 3);
    S.buckle += ((S.T > 25 ? Math.sqrt(extra) * 0.9 : 0) - S.buckle) * 0.1;
    for (const m of wParts) {
      m.scale.x = piece * 1.02;
      const f = (m.userData.i + 0.5) / 24;
      const bend = Math.sin(f * Math.PI) * S.buckle;
      m.position.set(RX + f * total, 0.11, m.userData.z + bend);
      m.rotation.y = -Math.cos(f * Math.PI) * S.buckle * Math.PI / total;
    }
    return gap;
  }

  // ---------- Термометър ----------
  const thermo = new THREE.Group();
  const TMIN = -20; const TMAX = 40; const TH_H = 2.2;
  const yOf = (T) => 0.45 + ((T - TMIN) / (TMAX - TMIN)) * TH_H;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 12), mat(0xe53935));
  {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.75, TH_H + 0.75, 0.06), mat(0xffffff));
    board.position.set(0, 0.25 + (TH_H + 0.75) / 2, -0.06);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, TH_H + 0.25, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xe3f2fd, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
    tube.position.y = 0.45 + TH_H / 2 + 0.05;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), mat(0xe53935));
    bulb.position.y = 0.38;
    thermo.add(board, tube, bulb, column);
    for (let T = TMIN; T <= TMAX; T += 5) {
      const big = T % 10 === 0;
      const tk = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.16 : 0.09, 0.012, 0.01), mat(T === 0 ? 0x1565c0 : 0x212121));
      tk.position.set(0.14 + (big ? 0.03 : 0), yOf(T), 0.0);
      thermo.add(tk);
      if (big) {
        const l = labelSprite(tStr(T).replace(' °C', ''), { size: 0.12, bg: 'rgba(255,255,255,0)', border: 'rgba(255,255,255,0)' });
        l.position.set(0.33, yOf(T), 0.02);
        thermo.add(l);
      }
    }
    const c = labelSprite('°C', { size: 0.13 });
    c.position.set(-0.2, yOf(TMAX) + 0.2, 0.02);
    thermo.add(c);
    thermo.position.set(TH_X, 0, -0.8);
    thermo.userData.pickId = 'thermo';
    addHitBox(thermo, 0.8);
    scene.add(thermo);
  }

  // ---------- Топче и халка ----------
  const R_COLD = 0.22; const R_RING = 0.25; const R_HOT = 0.29; // разликата е увеличена, за да се вижда
  const ballRig = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat(0xc9a14a, { metalness: 0.7, roughness: 0.3 }));
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), mat(0x757575));
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), mat(0x5d4037));
  const lampFlame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.9 }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R_RING + 0.03, 0.03, 10, 32), mat(0xc9a14a, { metalness: 0.7, roughness: 0.3 }));
  {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.7), mat(0x546e7a));
    base.position.y = 0.04;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 8), mat(0x78909c));
    post.position.set(-0.45, 0.85, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), mat(0x78909c));
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-0.24, 1.3, 0);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 1.3, 0);
    ring.userData.pickId = 'ring';
    const lamp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshStandardMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.5 }));
    body.scale.y = 0.7;
    body.position.y = 0.15;
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), mat(0x9e9e9e));
    wick.position.y = 0.34;
    lampFlame.scale.set(1, 2.2, 1);
    lampFlame.position.y = 0.55;
    lampFlame.visible = false;
    lamp.add(body, wick, lampFlame);
    lamp.position.set(0.95, 0, 0.1);
    lamp.userData.pickId = 'lamp';
    ballRig.add(base, post, arm, ring, lamp);
    ballRig.position.set(BX, 0, 0.2);
    scene.add(ballRig);
    scene.add(ball, chain, handle);
    ball.userData.pickId = 'ball';
  }
  const B = { r: R_COLD, rT: R_COLD, x: 0, y: 2.0, tx: 0, ty: 2.0, hot: 0 };
  function ballCold() { B.r = B.rT = R_COLD; B.hot = 0; B.x = B.tx = 0; B.y = B.ty = 2.0; lampFlame.visible = false; }

  // ---------- Стълбове и жици ----------
  const poles = new THREE.Group();
  const P1 = new THREE.Vector3(3.9, 2.3, -1.5); const P2 = new THREE.Vector3(6.2, 2.3, -1.5);
  for (const p of [P1, P2]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 10), mat(0x8d6e63));
    pole.position.set(p.x, 1.2, p.z);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.6), mat(0x8d6e63));
    bar.position.set(p.x, 2.3, p.z);
    poles.add(pole, bar);
  }
  const wires = [];
  for (const dz of [-0.22, 0.22]) {
    const w = new THREE.Mesh(new THREE.BufferGeometry(), mat(0x263238));
    w.userData.dz = dz;
    poles.add(w);
    wires.push(w);
  }
  poles.userData.pickId = 'wires';
  scene.add(poles);
  let lastSag = -1;
  function layoutWires(T) {
    const sag = 0.18 + (T - TMIN) * 0.006;
    if (Math.abs(sag - lastSag) < 0.004) return;
    lastSag = sag;
    for (const w of wires) {
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const f = i / 20;
        pts.push(new THREE.Vector3(P1.x + (P2.x - P1.x) * f, P1.y - 4 * sag * f * (1 - f), P1.z + w.userData.dz));
      }
      w.geometry.dispose();
      w.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 5, false);
    }
  }
  // Точки за камерата и балончетата (групите са в световни координати).
  const wiresAt = new THREE.Object3D();
  wiresAt.position.set((P1.x + P2.x) / 2, 1.9, P1.z);
  const railsAt = new THREE.Object3D();
  railsAt.position.set(RX + 1.9, 0.2, 0.4);
  scene.add(wiresAt, railsAt);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffca28 }));
  sun.position.set(5.05, 3.4, -1.8);
  const snow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: 0x90caf9, wireframe: true }));
  snow.position.copy(sun.position);
  scene.add(sun, snow);

  stage.tick((dt, t) => {
    layoutRails();
    S.shown += (S.T - S.shown) * Math.min(1, dt * 5);
    const h = yOf(S.shown) - 0.38;
    column.scale.y = h;
    column.position.y = 0.38 + h / 2;
    layoutWires(S.T);
    sun.visible = S.T >= 25; snow.visible = S.T <= -5;
    snow.rotation.y = t * 0.6;
    // топче
    B.r += (B.rT - B.r) * Math.min(1, dt * 1.5);
    B.x += (B.tx - B.x) * Math.min(1, dt * 3);
    B.y += (B.ty - B.y) * Math.min(1, dt * 3);
    const bx = BX + B.x; const by = B.y; const bz = 0.2;
    ball.scale.setScalar(B.r);
    ball.position.set(bx, by, bz);
    chain.scale.y = 0.6; chain.position.set(bx, by + B.r + 0.3, bz);
    handle.position.set(bx, by + B.r + 0.85, bz);
    const heat = Math.max(0, Math.min(1, (B.r - R_COLD) / (R_HOT - R_COLD)));
    ball.material.color.setRGB(0.79 + heat * 0.2, 0.63 - heat * 0.25, 0.29 - heat * 0.15);
    lampFlame.scale.set(1, 2.2 + Math.sin(t * 18) * 0.15, 1);
  });

  let tempBubble = null;
  function setT(T) {
    S.T = T;
    if (tempBubble) tempBubble.set(`<b>${tStr(T)}</b>`);
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    S.gaps = true; track.visible = true; railSegs.forEach((m) => { m.visible = true; }); welded.visible = false;
    setT(10); ballCold();
    view(ctx, [0.5, 1.1, 0], 6.2, { halfH: 1.8 });
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p>Защо между релсите има процепи, а жиците провисват повече през лятото?</p><p class="small"><b>Топлина</b> (топлинна енергия) е енергията, която минава от по-топлото към по-студеното тяло. Това минаване се нарича <b>топлообмен</b>.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>${SAFE}`,
      items: [
        { id: 'thermo', label: 'Термометър', icon: '🌡', note: 'Термометърът мери температурата в <b>градуси по Целзий (°C)</b>. Под нулата температурите са отрицателни и се пишат със знак „−“.', obj: () => thermo, dist: 3.4, lift: 1.2, bubble: 2.2 },
        { id: 'rails', label: 'Релси с процеп', icon: '🛤', note: 'Между релсите има малки процепи (отбелязани с червено). Те оставят място на релсите да се удължат в жегата.', obj: () => railsAt, dist: 4.2 },
        { id: 'ball', label: 'Топче и халка', icon: '⚪', note: 'Студеното метално топче минава точно през халката. Какво ли ще стане, ако го нагреем?', obj: () => ballRig, dist: 3.2, lift: 1.0, bubble: 2.2 },
        { id: 'wires', label: 'Жици', icon: '〰', note: 'Жиците между стълбовете са метални. Металите се разширяват при затопляне и се свиват при охлаждане.', obj: () => wiresAt, dist: 4, lift: 0.3, bubble: 0.6 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Релсите в жега и студ ----------
  function step2() {
    shell.step(1);
    setT(10);
    view(ctx, [-3.0, 0.5, 0.4], 2.3, { halfH: 1.0 });
    tempBubble = stage.bubble(railsAt, `<b>${tStr(S.T)}</b>`, { cls: 'tag', lift: 0.9 });
    let mistakes = 0;
    const slider = (lead) => {
      shell.task(`${lead}<label class="small">Температура: <b class="tv">${tStr(S.T)}</b>
        <input class="slider ts" type="range" min="${TMIN}" max="${TMAX}" step="1" value="${S.T}"></label>
        <p class="small">Удължаването тук е увеличено много пъти, за да се вижда. Истинска релса от 25 m се удължава с около 1,5 cm при затопляне с 50 °C.</p>`);
      const sl = container.querySelector('.ts');
      sl.addEventListener('input', () => { setT(+sl.value); container.querySelector('.tv').textContent = tStr(S.T); });
      return sl;
    };
    shell.task('<p>Днес е <b>+10 °C</b>. Виж червените кръгчета: там са процепите между релсите.</p>');
    choice(ctx, {
      q: 'Какво ще стане с процепите в горещ летен ден?',
      options: [
        { t: 'Ще се смалят', ok: true, why: 'Да проверим! Нагрей с плъзгача.' },
        { t: 'Ще се увеличат', ok: false, why: 'При затопляне металът се разширява или се свива?' },
        { t: 'Няма да се променят', ok: false, why: 'Металните релси реагират на топлината. Как?' },
      ],
      hint: 'Телата се разширяват при нагряване.',
      onRight: (m) => { mistakes = m; heat(); },
    });
    function heat() {
      const sl = slider('<p><b>Нагрей до +35 °C или повече</b> и гледай процепите.</p>');
      shell.setControls('');
      const on = () => {
        if (S.T >= 35) {
          sl.removeEventListener('input', on);
          shell.msg('Релсите се удължиха и процепите почти изчезнаха.', 'good');
          nextBtn(ctx, 'Сега студ →', cold);
        }
      };
      sl.addEventListener('input', on);
    }
    function cold() {
      const sl = slider('<p>Зима е. <b>Охлади до −15 °C или по-ниско.</b></p>');
      shell.setControls('');
      const on = () => {
        if (S.T <= -15) {
          sl.removeEventListener('input', on);
          shell.msg('Релсите се свиха и процепите станаха по-големи.', 'good');
          nextBtn(ctx, 'Релси без процепи →', noGaps);
        }
      };
      sl.addEventListener('input', on);
    }
    function noGaps() {
      shell.msg('');
      setT(10);
      S.gaps = false;
      railSegs.forEach((m) => { m.visible = false; });
      welded.visible = true;
      const sl = slider('<p>Тези релси са <b>без процепи</b>. <b>Нагрей до +35 °C или повече.</b></p>');
      shell.setControls('');
      const on = () => {
        if (S.T >= 35) {
          sl.removeEventListener('input', on);
          setTimeout(() => choice(ctx, {
            q: 'Защо релсите без процепи се изкривиха?',
            options: [
              { t: 'Удължиха се, но нямаше място, където да се удължат.', ok: true, why: 'Вярно! Затова оставят процепи или правят специално закрепване на релсите.' },
              { t: 'Стопиха се от жегата.', ok: false, why: '+35 °C е много далеч от температурата, при която се топи стомана.' },
              { t: 'Свиха се от жегата.', ok: false, why: 'При затопляне телата не се свиват. Какво правят?' },
            ],
            hint: 'Сравни с релсите с процепи при същата температура.',
            mistakes,
            onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
          }), 1200);
        }
      };
      sl.addEventListener('input', on);
    }
  }

  // ---------- 3. Топче, халка и термометър ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    if (tempBubble) { tempBubble.remove(); tempBubble = null; }
    S.gaps = true; railSegs.forEach((m) => { m.visible = true; }); welded.visible = false;
    setT(10);
    ballCold();
    view(ctx, [BX + 0.3, 1.2, 0.2], 1.7, { halfH: 1.5 });
    let mistakes = 0;
    shell.task(`<p>Студеното топче минава през халката. А нагрятото?</p><p><b>Нагрей топчето</b>, после го <b>пусни</b> към халката.</p>${SAFE}`);
    const c = shell.setControls('<div class="row"><button class="btn hot">🔥 Нагрей</button><button class="btn drop" disabled>⬇ Пусни</button></div>');
    c.querySelector('.hot').addEventListener('click', () => {
      c.querySelector('.hot').disabled = true;
      lampFlame.visible = true;
      B.tx = 0.95; B.ty = 1.0;
      setTimeout(() => { B.rT = R_HOT; }, 600);
      setTimeout(() => {
        lampFlame.visible = false;
        B.tx = 0; B.ty = 2.0;
        c.querySelector('.drop').disabled = false;
        ctx.say(ball, 'Нагрятото топче се разшири.', 'tag', 0.5);
      }, 2600);
    }, { once: true });
    c.querySelector('.drop').addEventListener('click', () => {
      c.querySelector('.drop').disabled = true;
      ctx.clearTip();
      B.ty = 1.3 + Math.sqrt(Math.max(0, B.r * B.r - R_RING * R_RING)) + 0.02; // засяда върху халката
      setTimeout(() => {
        ctx.say(ring, 'Нагрятото топче не минава!', 'bad', 0.6);
        choice(ctx, {
          q: 'Какво да направим, за да мине топчето през халката?',
          options: [
            { t: 'Да охладим топчето.', ok: true, why: 'Вярно! Охладено, топчето се свива и минава.' },
            { t: 'Да го нагреем още.', ok: false, why: 'Още топлина ще го разшири още повече.' },
            { t: 'Да го бутнем по-силно.', ok: false, why: 'Топчето е по-голямо от отвора. Как да стане по-малко?' },
          ],
          hint: 'Телата се свиват при охлаждане.',
          onRight: (m) => {
            mistakes = m;
            B.rT = R_COLD;
            setTimeout(() => { B.ty = 0.6; ctx.say(ring, '✔ Охладеното топче се сви и мина.', 'good', 0.6); }, 1700);
            nextBtn(ctx, 'Термометърът →', thermoTask);
          },
        });
      }, 1200);
    }, { once: true });

    function thermoTask() {
      ctx.clearTip();
      ballCold();
      view(ctx, [TH_X, 1.6, -0.8], 1.0, { halfH: 1.7, elev: 0.15 });
      setT(10);
      if (tempBubble) tempBubble.remove();
      tempBubble = stage.bubble(thermo, `<b>${tStr(S.T)}</b>`, { cls: 'tag', lift: yOf(TMAX) + 0.3 });
      tempBubble.el.style.visibility = 'hidden';
      shell.task(`<p>Зимна сутрин. <b>Нагласи термометъра на −8 °C.</b></p>
        <label class="small">Температура <input class="slider ts" type="range" min="${TMIN}" max="${TMAX}" step="1" value="10"></label>
        <p class="small">Гледай скалата: всяко малко деление е 5 °C.</p>`);
      const sl = container.querySelector('.ts');
      sl.addEventListener('input', () => setT(+sl.value));
      const cc = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      cc.querySelector('.chk').addEventListener('click', () => {
        if (S.T === -8) {
          cc.querySelector('.chk').disabled = true;
          tempBubble.el.style.visibility = '';
          shell.msg('Вярно: −8 °C е 8 градуса под нулата.', 'good');
          nextBtn(ctx, 'Още една задача →', diff);
          return;
        }
        mistakes++;
        tempBubble.el.style.visibility = '';
        shell.msg(`Термометърът показва ${tStr(S.T)}.${S.T === 8 ? ' Това е над нулата — търсим под нулата.' : ''}${mistakes >= 2 ? ' Подсказка: −8 °C е между −5 и −10.' : ''}`, 'bad');
        setTimeout(() => { tempBubble.el.style.visibility = 'hidden'; }, 1500);
      });
    }
    function diff() {
      tempBubble.el.style.visibility = '';
      shell.task(`<p>Сутринта термометърът показва <b>−4 °C</b>, а на обед <b>+6 °C</b>.</p><p><b>С колко градуса се е затоплило?</b></p>
        <label class="num"><input class="ans" type="text" inputmode="decimal"> °C</label>`);
      setT(-4);
      const cc = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      const inp = container.querySelector('.ans');
      cc.querySelector('.chk').addEventListener('click', () => {
        const v = parseFloat(inp.value.replace(',', '.').replace('−', '-'));
        if (!Number.isFinite(v)) return;
        if (v === 10) {
          inp.classList.add('right');
          cc.querySelector('.chk').disabled = true;
          setT(6);
          shell.msg('Вярно! От −4 °C до 0 °C са 4 градуса и още 6 до +6 °C: общо 10.', 'good');
          ctx.scores[1] = stepScore(mistakes, 3);
          nextBtn(ctx, 'Напред →', step4);
          return;
        }
        mistakes++;
        inp.classList.add('wrong');
        shell.msg(`Не е ${fmt(v, 0)}.${v === 2 ? ' Не изваждай 4 от 6: първо стигни от −4 до нулата.' : ''}${mistakes >= 2 ? ' Подсказка: брой деленията от −4 до +6.' : ''}`, 'bad');
      });
    }
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    shell.score('');
    if (tempBubble) { tempBubble.remove(); tempBubble = null; }
    setT(-10);
    view(ctx, [5.05, 2.2, -1.5], 1.6, { halfH: 1.4, elev: 0.15 });
    shell.task('<p>Между стълбовете има метални жици. Сега е зима (−10 °C).</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Кога жиците провисват повече?',
      options: [
        { t: 'През лятото', ok: true, why: 'Да проверим! Ще стане лято.' },
        { t: 'През зимата', ok: false, why: 'През зимата металът се свива и се опъва. Кога се удължава?' },
        { t: 'Еднакво през цялата година', ok: false, why: 'Металните жици реагират на температурата.' },
      ],
      hint: 'Когато е топло, жицата се удължава.',
      onRight: (m) => {
        mistakes = m;
        let T = -10;
        const stop = stage.tick((dt) => {
          T = Math.min(35, T + dt * 22);
          setT(Math.round(T));
          if (T >= 35) {
            stop();
            ctx.say(wiresAt, 'При +35 °C жиците са по-дълги и провисват повече.', 'good', 1.2);
            nextBtn(ctx, 'Още една задача →', jar);
          }
        });
      },
    });
    function jar() {
      ctx.clearTip();
      shell.task('<p>Пренеси към живота.</p>');
      choice(ctx, {
        q: 'Металната капачка на буркана не се отваря. Защо помага да я подържим под топла вода?',
        options: [
          { t: 'Металната капачка се разширява повече от стъклото и се разхлабва.', ok: true, why: 'Вярно! При затопляне металът се разширява повече от стъклото.' },
          { t: 'Водата прави капачката хлъзгава.', ok: false, why: 'Важна е температурата. Какво става с метала, когато се затопли?' },
          { t: 'Топлата вода свива капачката.', ok: false, why: 'Обратно: при затопляне телата се разширяват.' },
        ],
        hint: 'Спомни си топчето и халката.',
        mistakes,
        onRight: (m) => { ctx.scores[2] = stepScore(m, 3); finishBtn(ctx, onComplete, restart); },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    if (tempBubble) { tempBubble.remove(); tempBubble = null; }
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
