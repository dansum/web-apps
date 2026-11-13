// 5.2.3 „Въздухът: състав и свойства“ — свещи под стъкленици, проба за кислород и въглероден диоксид.
// Стъпки: опознай → свещ под стъкленица (опит, „Припомни от 3. клас“) → кой газ е в съда (приложи)
// → газирана вода на студено и на топло (разтворимост на газовете) → предскажи и пренеси.
import { labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, labRoom, glass, view, bar, stepScore } from './labkit.js';

const SAFE = '<p class="warn">⚠ Опитите с огън се правят <b>само с възрастен</b>.</p>';

function candleModel() {
  const g = new THREE.Group();
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.05, 20), mat(0xb0bec5));
  dish.position.y = 0.025;
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 18), mat(0xfff8e1));
  wax.position.y = 0.3;
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6), mat(0x222222));
  wick.position.y = 0.59;
  const flame = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.9 }));
  outer.scale.set(1, 2.1, 1);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
  inner.scale.set(1, 1.8, 1);
  inner.position.y = -0.03;
  flame.add(outer, inner);
  flame.position.y = 0.72;
  const smoke = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.05 + i * 0.015, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9e9e9e, transparent: true, opacity: 0 }));
    s.userData.k = i / 3;
    smoke.add(s);
  }
  smoke.position.y = 0.65;
  g.add(dish, wax, wick, flame, smoke);
  return { g, flame, smoke };
}

function jarModel(r, h) {
  const g = new THREE.Group();
  const side = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32, 1, true), glass());
  side.position.y = h / 2;
  const top = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass());
  top.scale.y = 0.35;
  top.position.y = h;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), glass(0.5));
  knob.position.y = h + r * 0.35 + 0.04;
  g.add(side, top, knob);
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Свещ под стъкленица', 'Кой газ е в съда?', 'Газирана вода', 'Предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { camPos: [0, 3.6, 9.5], target: [0, 0.7, 0], maxDistance: 20 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 13, d: 4.6 });

  // ---------- Свещи и стъкленици (стъпки 2 и 4) ----------
  const JARS = [
    { id: 'jar-s', name: 'малката', r: 0.36, h: 0.85, x: -4.3 },
    { id: 'jar-m', name: 'средната', r: 0.5, h: 1.15, x: -2.85 },
    { id: 'jar-l', name: 'голямата', r: 0.68, h: 1.55, x: -1.0 },
  ];
  const rigs = [];
  function makeRig(j, nCandles = 1) {
    const g = new THREE.Group();
    g.position.x = j.x;
    const candles = [];
    for (let i = 0; i < nCandles; i++) {
      const c = candleModel();
      c.g.position.x = nCandles > 1 ? (i - 0.5) * 0.24 : 0;
      if (nCandles > 1) c.g.scale.setScalar(0.85);
      g.add(c.g);
      candles.push(c);
    }
    const jar = jarModel(j.r, j.h);
    jar.userData.pickId = j.id;
    g.add(jar);
    addHitBox(jar, 0.8);
    const tag = labelSprite(j.label || `${j.name[0].toUpperCase()}${j.name.slice(1)}`, { size: 0.2 });
    tag.position.set(0, -0.02, j.r + 0.35);
    g.add(tag);
    stage.steadyLabel(tag, 6);
    scene.add(g);
    const V = Math.PI * j.r * j.r * j.h;
    const rig = { j, g, jar, candles, V, n: nCandles, o: 1, up: 0.95, y: 0.95, covered: false, out: false, outAt: 0, smokeT: 0, meter: null, order: 0 };
    rigs.push(rig);
    return rig;
  }
  const main = JARS.map((j) => makeRig(j));
  const pair = [
    makeRig({ id: 'jar-1', name: 'една свещ', label: 'Една свещ', r: 0.5, h: 1.15, x: -3.6 }, 1),
    makeRig({ id: 'jar-2', name: 'две свещи', label: 'Две свещи', r: 0.5, h: 1.15, x: -1.6 }, 2),
  ];
  const RATE = 0.26; // условна скорост: колко „обем въздух“ изразходва една свещ за секунда (ускорено)
  let outCount = 0;
  let onAllOut = null;
  function resetRig(r) {
    r.o = 1; r.covered = false; r.out = false; r.y = r.up; r.smokeT = 0; r.order = 0;
    r.jar.position.y = r.up;
    if (r.meter) { r.meter.remove(); r.meter = null; }
  }
  function cover(r) {
    if (r.covered) return;
    r.covered = true;
    r.meter = stage.bubble(new THREE.Vector3(r.j.x, r.j.h + 0.5, 0), '', { cls: 'tag', lift: 0 });
  }
  stage.tick((dt, t) => {
    for (const r of rigs) {
      if (!r.g.visible) continue;
      const targetY = r.covered ? 0 : r.up;
      r.y += (targetY - r.y) * Math.min(1, dt * 5);
      r.jar.position.y = r.y;
      if (r.covered && !r.out && r.y < 0.03) {
        r.o -= (dt * RATE * r.n) / r.V;
        if (r.o <= 0) {
          r.o = 0; r.out = true; r.smokeT = 0.001;
          outCount++;
          r.order = outCount;
          if (onAllOut) onAllOut(r);
        }
      }
      const k = r.out ? 0 : 0.35 + 0.65 * Math.sqrt(Math.max(0, r.o));
      for (const c of r.candles) {
        c.flame.visible = !r.out;
        const fl = 1 + Math.sin(t * 17 + r.j.x * 3) * 0.06 + Math.sin(t * 7.3) * 0.04;
        c.flame.scale.set(k, k * fl, k);
        if (r.smokeT > 0) {
          for (const s of c.smoke.children) {
            const f = (r.smokeT * 0.6 + s.userData.k) % 1;
            s.position.y = f * 0.5;
            s.material.opacity = r.smokeT < 4 ? 0.45 * (1 - f) * (1 - r.smokeT / 4) : 0;
          }
        } else for (const s of c.smoke.children) s.material.opacity = 0;
      }
      if (r.smokeT > 0) r.smokeT += dt;
      if (r.meter) {
        // Показателят показва колко от кислорода е останал до момента, в който пламъкът вече не може да гори.
        r.meter.set(r.out ? `${r.order}. угасна` : `кислород ${bar(100 * (0.25 + 0.75 * r.o))}`);
        r.meter.el.classList.toggle('bad', r.out);
      }
    }
  });

  // ---------- Газове за проба (стъпка 3) ----------
  const GASES = [
    { id: 'gas-a', letter: 'А', gas: 'co2', x: 1.4 },
    { id: 'gas-b', letter: 'Б', gas: 'o2', x: 2.75 },
    { id: 'gas-c', letter: 'В', gas: 'air', x: 4.1 },
  ];
  const GAS_NAME = { co2: 'въглероден диоксид', o2: 'кислород', air: 'въздух' };
  const gasJars = GASES.map((G) => {
    const g = new THREE.Group();
    g.position.set(G.x, 0, 0);
    const side = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 28, 1, true), glass());
    side.position.y = 0.55;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 28), mat(0x90a4ae));
    lid.position.y = 1.13;
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28), glass(0.4));
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = 0.01;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.22, 28), new THREE.MeshStandardMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.0, depthWrite: false }));
    water.position.y = 0.12;
    const splint = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), mat(0xc49a54));
    stick.position.y = 0.45;
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5722 }));
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.9 }));
    fl.scale.set(1, 2, 1);
    fl.position.y = 0.06;
    splint.add(stick, ember, fl);
    splint.position.y = 0.45;
    splint.visible = false;
    const lbl = labelSprite(`Съд ${G.letter}`, { size: 0.24 });
    lbl.position.set(0, 1.45, 0);
    stage.steadyLabel(lbl, 6);
    g.add(side, lid, bottom, water, splint, lbl);
    g.userData.pickId = G.id;
    addHitBox(g, 0.9);
    scene.add(g);
    return { G, g, water, splint, ember, fl, state: null, t: 0 };
  });
  stage.tick((dt, t) => {
    for (const J of gasJars) {
      J.t += dt;
      if (J.state === 'splint') {
        J.splint.visible = J.t < 4;
        J.ember.material.color.setHex(J.G.gas === 'co2' && J.t > 0.6 ? 0x444444 : 0xff5722);
        J.fl.visible = J.G.gas === 'o2' && J.t > 0.4;
        J.fl.scale.set(1, 2 + Math.sin(t * 15) * 0.2, 1);
        J.ember.scale.setScalar(J.G.gas === 'air' ? 1 + Math.sin(t * 6) * 0.15 : 1);
      } else J.splint.visible = false;
      if (J.state === 'lime') {
        const milky = J.G.gas === 'co2' ? Math.min(1, J.t / 1.5) : 0;
        J.water.material.opacity = 0.45 + milky * 0.5;
        J.water.material.color.setHex(milky > 0.2 ? 0xf5f5f5 : 0xd6ecff);
      }
    }
  });
  const limeCup = new THREE.Group();
  {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 20, 1, true), glass(0.35));
    cup.position.y = 0.2;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.28, 20), new THREE.MeshStandardMaterial({ color: 0xd6ecff, transparent: true, opacity: 0.6 }));
    liq.position.y = 0.15;
    limeCup.add(cup, liq);
    limeCup.position.set(5.3, 0, 1.2);
    limeCup.userData.pickId = 'lime';
    addHitBox(limeCup, 0.6);
    scene.add(limeCup);
  }
  const splintTool = new THREE.Group();
  {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6), mat(0xc49a54));
    stick.rotation.z = Math.PI / 2 - 0.15;
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5722 }));
    ember.position.set(0.5, 0.075, 0);
    splintTool.add(stick, ember);
    splintTool.position.set(5.2, 0.12, -0.6);
    splintTool.userData.pickId = 'splint';
    addHitBox(splintTool, 0.6);
    scene.add(splintTool);
  }
  // Проба въздух: 100 топчета — 78 азот, 21 кислород, 1 друг газ.
  const airBox = new THREE.Group();
  {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), glass(0.18));
    airBox.add(box);
    const geo = new THREE.SphereGeometry(0.045, 8, 6);
    const cols = [[78, 0x5b8fd9], [21, 0xe05555], [1, 0x777777]];
    const balls = [];
    for (const [n, c] of cols) for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mat(c));
      m.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.95);
      m.userData.v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.6);
      airBox.add(m);
      balls.push(m);
    }
    airBox.position.set(0.25, 0.9, -1.4);
    airBox.userData.pickId = 'air';
    scene.add(airBox);
    stage.tick((dt) => {
      for (const b of balls) {
        b.position.addScaledVector(b.userData.v, dt);
        for (const ax of ['x', 'y', 'z']) if (Math.abs(b.position[ax]) > 0.5) { b.userData.v[ax] *= -1; b.position[ax] = Math.sign(b.position[ax]) * 0.5; }
      }
    });
  }
  const plant = new THREE.Group();
  {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.45, 16), mat(0xb5651d));
    pot.position.y = 0.22;
    plant.add(pot);
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6), mat(0x3aa655));
      leaf.scale.set(0.5, 1.4, 0.25);
      const a = (i / 7) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.17, 0.75 + (i % 3) * 0.12, Math.sin(a) * 0.17);
      leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      plant.add(leaf);
    }
    plant.position.set(-5.6, 0, -1.4);
    plant.userData.pickId = 'plant';
    addHitBox(plant, 0.8);
    scene.add(plant);
    stage.tick((dt, t) => { plant.rotation.y = Math.sin(t * 0.6) * 0.08; });
  }

  // ---------- Газирана вода на студено и на топло (стъпка 4) ----------
  const soda = new THREE.Group();
  soda.visible = false;
  scene.add(soda);
  const BOTTLES = [
    { id: 'soda-cold', warm: false, x: 1.9, label: 'Студена вода', water: 0x7ec8ff },
    { id: 'soda-warm', warm: true, x: 3.6, label: 'Топла вода', water: 0xff9a6b },
  ];
  const bottles = BOTTLES.map((B) => {
    const g = new THREE.Group();
    g.position.x = B.x;
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.45, 28, 1, true), glass(0.3));
    basin.position.y = 0.225;
    const bath = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.54, 0.36, 28), new THREE.MeshStandardMaterial({ color: B.water, transparent: true, opacity: 0.5, depthWrite: false }));
    bath.position.y = 0.19;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 24, 1, true), glass(0.35));
    body.position.y = 0.47;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 0.28, 24, 1, true), glass(0.35));
    neck.position.y = 1.06;
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.78, 24), new THREE.MeshStandardMaterial({ color: 0xe3f6ea, transparent: true, opacity: 0.55, depthWrite: false }));
    liquid.position.y = 0.43;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 16), mat(0x2e7d32));
    cap.position.y = 1.24;
    const bubbles = [];
    const bgeo = new THREE.SphereGeometry(0.025, 8, 6);
    const bmat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 40; i++) {
      const b = new THREE.Mesh(bgeo, bmat);
      b.visible = false;
      g.add(b);
      bubbles.push(b);
    }
    const tag = labelSprite(B.label, { size: 0.2 });
    tag.position.set(0, -0.02, 0.9);
    stage.steadyLabel(tag, 6);
    g.add(basin, bath, body, neck, liquid, cap, tag);
    g.userData.pickId = B.id;
    addHitBox(g, 0.8);
    soda.add(g);
    return { B, g, cap, bubbles, open: false, acc: 0, count: 0, meter: null };
  });
  function resetSoda() {
    for (const S of bottles) {
      S.open = false; S.acc = 0; S.count = 0; S.cap.visible = true;
      for (const b of S.bubbles) b.visible = false;
      if (S.meter) { S.meter.remove(); S.meter = null; }
    }
  }
  function openBottle(S) {
    if (S.open) return;
    S.open = true;
    S.cap.visible = false;
    S.meter = stage.bubble(new THREE.Vector3(S.B.x, 1.75, 0), '', { cls: 'tag', lift: 0 });
  }
  stage.tick((dt) => {
    if (!soda.visible) return;
    for (const S of bottles) {
      if (!S.open) continue;
      // В топла вода газът се разтваря по-малко, затова излиза по-бързо (скоростите са условни).
      S.acc += dt * (S.B.warm ? 16 : 3);
      while (S.acc >= 1) {
        S.acc -= 1;
        const b = S.bubbles.find((x) => !x.visible);
        if (!b) break;
        b.visible = true;
        b.position.set((Math.random() - 0.5) * 0.28, 0.08, (Math.random() - 0.5) * 0.28);
        b.userData.v = 0.45 + Math.random() * 0.35;
      }
      for (const b of S.bubbles) {
        if (!b.visible) continue;
        b.position.y += b.userData.v * dt;
        if (b.position.y > 0.82) { b.visible = false; S.count++; }
      }
      if (S.meter) S.meter.set(`мехурчета: ${S.count}`);
    }
  });
  function showGasTable(on) {
    for (const J of gasJars) J.g.visible = on;
    limeCup.visible = on;
    splintTool.visible = on;
  }

  function showSet(which) {
    airBox.visible = which === 'main' && shell.stageEl && ctx.stepNo === 0;
    for (const r of main) { r.g.visible = which === 'main'; resetRig(r); }
    for (const r of pair) { r.g.visible = which === 'pair'; resetRig(r); }
    outCount = 0;
    onAllOut = null;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    ctx.stepNo = 0;
    shell.step(0);
    ctx.clearTip();
    showGasTable(true);
    soda.visible = false;
    resetSoda();
    showSet('main');
    for (const J of gasJars) { J.state = null; J.water.material.opacity = 0; }
    view(ctx, [0, 0.6, 0], 6.4);
    explore(ctx, {
      title: 'Разгледай',
      intro: `<p>Въздухът е около нас, но не го виждаме. От какво е съставен и защо без него свещта угасва?</p>
        <p><b>Разгледай всичко</b> от менюто в ъгъла или с клик върху предмета.</p>${SAFE}`,
      items: [
        { id: 'air', label: 'Въздух отблизо', icon: '🫧', note: 'Въздухът е <b>смес от газове</b>. От всеки 100 частици около 78 са азот (сини), около 21 са кислород (червени) и около 1 е друг газ (сиви). Във въздуха има и водни пари. Кислородът е нужен за <b>горенето</b> и за <b>дишането</b>. <i>Частиците са увеличени, не са в мащаб.</i>', obj: () => airBox, dist: 3.4 },
        { id: 'jar-m', label: 'Свещ', icon: '🕯', note: 'Свещта гори, докато около пламъка има достатъчно <b>кислород</b>. При горенето се получават въглероден диоксид и водни пари.', obj: () => main[1].g, dist: 3.6 },
        { id: 'jar-l', label: 'Стъкленица', icon: '🫙', note: 'Похлупената стъкленица не пуска нов въздух вътре. Свещта може да използва само въздуха, който е под нея.', obj: () => main[2].g, dist: 4, bubble: 1.9 },
        { id: 'splint', label: 'Тлееща трескичка', icon: '🪵', note: 'Трескичката е тънко парче дърво. Тлееща значи, че жари без пламък. Тя <b>пламва в кислород</b>, а във въглероден диоксид угасва.', obj: () => splintTool, dist: 3 },
        { id: 'lime', label: 'Варна вода', icon: '🥛', note: 'Варната вода е бистър разтвор на гасена вар във вода. Тя <b>помътнява</b> от въглероден диоксид. Така го откриваме.', obj: () => limeCup, dist: 3 },
        { id: 'plant', label: 'Растение', icon: '🌿', note: 'Растенията поемат <b>въглероден диоксид</b> и с него, с вода и светлина си образуват храна. Въглеродният диоксид във въздуха задържа и част от топлината на Земята.', obj: () => plant, dist: 3.4 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Свещ под стъкленица ----------
  function step2() {
    ctx.stepNo = 1;
    shell.step(1);
    showSet('main');
    view(ctx, [-2.65, 1.1, 0], 2.7, { halfH: 1.7 });
    shell.task(`<p class="small"><b>🔁 Припомни от 3. клас</b></p><p>Свещ, покрита с буркан, скоро угасва. Сега ще сравним <b>три стъкленици</b> с различен обем.</p>${SAFE}`);
    shell.score('');
    choice(ctx, {
      q: 'Ако ги похлупим, коя свещ ще гори най-дълго?',
      options: [
        { t: 'Свещта под голямата стъкленица', ok: true, why: 'Да проверим! Кликни всяка стъкленица, за да я похлупиш.' },
        { t: 'Свещта под малката стъкленица', ok: false, why: 'Помисли: под коя стъкленица има най-много въздух, а значи и кислород?' },
        { t: 'И трите ще горят еднакво дълго', ok: false, why: 'Свещите са еднакви, но въздухът под стъклениците не е еднакъв.' },
        { t: 'Ще горят, докато се стопят докрай', ok: false, why: 'Похлупената свещ не получава нов въздух. Какво ѝ трябва, за да гори?' },
      ],
      hint: 'Свещта гори, докато има кислород, а той е част от въздуха.',
      onRight: (m) => runMain(m),
    });
  }
  function runMain(m0) {
    let mistakes = m0;
    shell.task(`<p><b>Похлупи и трите свещи:</b> кликни всяка стъкленица или натисни бутона. Наблюдавай пламъците.</p>${SAFE}`);
    const c = shell.setControls('<div class="row"><button class="btn cover-all">Похлупи всички</button></div>');
    c.querySelector('.cover-all').addEventListener('click', () => main.forEach(cover));
    ctx.click = (id) => { const r = main.find((x) => x.j.id === id); if (r) cover(r); };
    onAllOut = () => {
      if (!main.every((r) => r.out)) return;
      ctx.click = null;
      onAllOut = null;
      shell.msg('Първа угасна свещта под малката стъкленица, последна — под голямата.', 'good');
      setTimeout(() => {
        choice(ctx, {
          q: 'Защо свещта под голямата стъкленица гори най-дълго?',
          options: [
            { t: 'Под нея има най-много въздух, а значи и най-много кислород.', ok: true, why: 'Вярно! Горенето изразходва кислорода. Когато той намалее твърде много, пламъкът угасва. Хората и животните също изразходват кислород, когато дишат.' },
            { t: 'Голямата стъкленица има по-дебело стъкло.', ok: false, why: 'Дебелината на стъклото не дава нищо на пламъка. Какво има вътре в стъкленицата?' },
            { t: 'Под нея има повече азот, а азотът поддържа горенето.', ok: false, why: 'Азотът не поддържа горенето. Кой газ от въздуха е нужен на пламъка?' },
            { t: 'В голямата стъкленица е по-студено.', ok: false, why: 'Температурата тук не е причината. Сравни колко въздух има под всяка стъкленица.' },
          ],
          hint: 'Свещта угасва, когато свърши нещо, което взема от въздуха.',
          mistakes,
          onRight: (m) => {
            mistakes = m;
            ctx.scores[0] = stepScore(mistakes, 3);
            ctx.say(main[2].g, 'Свещта угасва, преди кислородът да свърши напълно: при твърде малко кислород пламъкът вече не може да гори.', 'wide', 2.2);
            nextBtn(ctx, 'Напред →', step3);
          },
        });
      }, 900);
    };
  }

  // ---------- 3. Кой газ е в съда? ----------
  function step3() {
    ctx.stepNo = 2;
    shell.step(2);
    ctx.clearTip();
    showGasTable(true);
    soda.visible = false;
    resetSoda();
    showSet('none');
    for (const J of gasJars) { J.state = null; J.water.material.opacity = 0; }
    view(ctx, [3.3, 0.8, 0], 3.1, { halfH: 1.4, elev: 0.32 });
    let tool = null;
    const tested = new Set();
    shell.task(`<p>В трите затворени съда има <b>кислород</b>, <b>въглероден диоксид</b> и <b>въздух</b>. Всички са безцветни и без мирис!</p>
      <p>Избери проба и кликни съд. Изпробвай поне 3 пъти.</p>
      <div class="xp-chips"><span class="chip" data-t="splint">🪵 Тлееща трескичка</span><span class="chip" data-t="lime">🥛 Варна вода</span></div>`);
    shell.score('Проби: 0');
    container.querySelectorAll('.xp-task .chip').forEach((ch) => ch.addEventListener('click', () => {
      container.querySelectorAll('.xp-task .chip').forEach((x) => x.classList.remove('held'));
      ch.classList.add('held');
      tool = ch.dataset.t;
    }));
    const c = shell.setControls('<div class="row"><button class="btn primary know" disabled>Знам кой е кой →</button></div>');
    const know = c.querySelector('.know');
    const RES = {
      splint: { o2: 'Трескичката <b>пламна</b>!', co2: 'Трескичката <b>угасна</b>.', air: 'Трескичката <b>продължава да тлее</b>, без да пламне.' },
      lime: { o2: 'Варната вода <b>остана бистра</b>.', co2: 'Варната вода <b>помътня</b>!', air: 'Варната вода <b>остана бистра</b>.' },
    };
    const seenRes = {};
    ctx.click = (id) => {
      const J = gasJars.find((x) => x.G.id === id);
      if (!J) return;
      if (!tool) { shell.msg('Първо избери проба: трескичка или варна вода.', 'bad'); return; }
      J.state = tool; J.t = 0;
      if (tool === 'splint') J.water.material.opacity = 0;
      const txt = RES[tool][J.G.gas];
      (seenRes[J.G.id] = seenRes[J.G.id] || []).push(txt);
      ctx.say(J.g, `Съд ${J.G.letter}: ${txt}`, '', 1.5);
      tested.add(tool + J.G.id);
      shell.score(`Проби: ${tested.size}`);
      if (tested.size >= 3) know.disabled = false;
    };
    know.addEventListener('click', () => ask('o2', 0));
    function ask(gas, m0) {
      let mistakes = m0;
      ctx.clearTip();
      shell.task(`<p><b>Кликни съда с ${GAS_NAME[gas]}.</b></p><p class="small">Можеш пак да правиш проби: избери проба отдолу.</p>
        <div class="xp-chips"><span class="chip" data-t="splint">🪵 Тлееща трескичка</span><span class="chip" data-t="lime">🥛 Варна вода</span><span class="chip held" data-t="">👆 Посочи съд</span></div>`);
      tool = null;
      container.querySelectorAll('.xp-task .chip').forEach((ch) => ch.addEventListener('click', () => {
        container.querySelectorAll('.xp-task .chip').forEach((x) => x.classList.remove('held'));
        ch.classList.add('held');
        tool = ch.dataset.t || null;
      }));
      shell.setControls('');
      const probe = ctx.click;
      ctx.click = (id) => {
        const J = gasJars.find((x) => x.G.id === id);
        if (!J) return;
        if (tool) return probe(id);
        if (J.G.gas === gas) {
          ctx.say(J.g, `✔ Съд ${J.G.letter}: ${GAS_NAME[gas]}`, 'good', 1.5);
          shell.msg(gas === 'o2' ? 'Вярно! В кислород тлеещата трескичка пламва: кислородът поддържа горенето.' : 'Вярно! Въглеродният диоксид гаси пламъка и помътнява варната вода.', 'good');
          if (gas === 'o2') { setTimeout(() => ask('co2', mistakes), 1200); return; }
          ctx.click = null;
          ctx.scores[1] = stepScore(mistakes, 3);
          shell.task('<p>Различихме безцветните газове само с опит. 👏</p>');
          nextBtn(ctx, 'Напред →', stepSoda);
          return;
        }
        mistakes++;
        const what = seenRes[J.G.id] ? `При пробата: ${seenRes[J.G.id].join(' ')}` : 'Още не си правил проба с този съд.';
        ctx.say(J.g, `✘ Съд ${J.G.letter}. ${what}`, 'bad', 1.5);
        shell.msg(`Не е този.${mistakes >= 2 ? (gas === 'o2' ? ' Подсказка: търси съда, в който трескичката пламва.' : ' Подсказка: търси съда, в който варната вода помътнява.') : ''}`, 'bad');
        shell.score(`Грешки: ${mistakes}`);
      };
    }
  }

  // ---------- 4. Газирана вода ----------
  function stepSoda() {
    ctx.stepNo = 3;
    shell.step(3);
    shell.score('');
    ctx.clearTip();
    ctx.click = null;
    showSet('none');
    showGasTable(false);
    resetSoda();
    soda.visible = true;
    view(ctx, [2.75, 0.75, 0], 2.2, { halfH: 1.3, elev: 0.3 });
    shell.task(`<p>В газираната вода е разтворен газ — <b>въглероден диоксид</b>.</p>
      <p>Две еднакви затворени бутилки газирана вода стоят в купи. Едната купа е със <b>студена</b> вода, другата — с <b>топла</b>.</p>`);
    let mistakes = 0;
    choice(ctx, {
      q: 'Ако отворим бутилките, от коя ще излизат повече мехурчета?',
      options: [
        { t: 'От бутилката в топлата вода', ok: true, why: 'Да проверим! Кликни всяка бутилка, за да я отвориш.' },
        { t: 'От бутилката в студената вода', ok: false, why: 'Помисли: кога газираната напитка „изветрява“ по-бързо — студена или топла?' },
        { t: 'От двете еднакво', ok: false, why: 'Бутилките са еднакви, но водата около тях е с различна температура.' },
        { t: 'От никоя', ok: false, why: 'Когато отворим газирана вода, от нея винаги излизат мехурчета. Въпросът е откъде повече.' },
      ],
      hint: 'Студената газирана напитка запазва газа си по-дълго.',
      onRight: (m) => { mistakes = m; openStep(); },
    });
    function openStep() {
      shell.task('<p><b>Отвори двете бутилки:</b> кликни всяка от тях или натисни бутона. Наблюдавай мехурчетата.</p>');
      const c = shell.setControls('<div class="row"><button class="btn open-all">Отвори двете</button></div>');
      let done = false;
      const check = () => {
        if (done || !bottles.every((S) => S.open)) return;
        done = true;
        ctx.click = null;
        shell.setControls('');
        setTimeout(() => {
          shell.msg('От бутилката в топлата вода излизат много повече мехурчета.', 'good');
          why();
        }, 4000);
      };
      c.querySelector('.open-all').addEventListener('click', () => { bottles.forEach(openBottle); check(); });
      ctx.click = (id) => { const S = bottles.find((x) => x.B.id === id); if (S) { openBottle(S); check(); } };
    }
    function why() {
      choice(ctx, {
        q: 'Защо от топлата бутилка излиза повече газ?',
        options: [
          { t: 'В топла вода газовете се разтварят по-малко и излизат от нея.', ok: true, why: 'Вярно! Колкото по-топла е водата, толкова по-малко газ остава разтворен в нея.' },
          { t: 'В топлата бутилка от началото има повече газ.', ok: false, why: 'Бутилките са еднакви. Различна е само температурата на водата около тях.' },
          { t: 'Мехурчетата са водни пари, защото водата кипи.', ok: false, why: 'Водата в купата е топла, но не кипи. Мехурчетата са от въглеродния диоксид в бутилката.' },
          { t: 'Мехурчетата идват от водата в купата.', ok: false, why: 'Купата е отвън. Мехурчетата се появяват вътре в бутилката.' },
        ],
        hint: 'Сравни: студената газирана напитка задържа газа си по-дълго.',
        mistakes,
        onRight: (m) => { mistakes = m; fish(); },
      });
    }
    function fish() {
      shell.task('<p>Пренеси към природата. Рибите дишат с <b>кислорода, разтворен във водата</b>.</p>');
      choice(ctx, {
        q: 'През горещото лято водата в едно езеро се затопля. Какво става с кислорода в нея?',
        options: [
          { t: 'Разтваря се по-малко и за рибите остава по-малко кислород.', ok: true, why: 'Вярно! Като въглеродния диоксид в газираната вода, и кислородът се разтваря по-малко в топла вода.' },
          { t: 'Разтваря се повече, защото водата е топла.', ok: false, why: 'Видя обратното с газираната вода. Кога газът излизаше по-бързо?' },
          { t: 'Не се променя, защото кислородът не се разтваря във вода.', ok: false, why: 'Във водата има разтворен кислород. Иначе рибите не биха могли да дишат.' },
        ],
        hint: 'Газовете се разтварят по-малко в топла вода.',
        mistakes,
        onRight: (m) => {
          ctx.scores[2] = stepScore(m, 3);
          nextBtn(ctx, 'Напред →', step4);
        },
      });
    }
  }

  // ---------- 5. Предскажи ----------
  function step4() {
    ctx.stepNo = 4;
    shell.step(4);
    shell.score('');
    ctx.clearTip();
    ctx.click = null;
    showGasTable(true);
    soda.visible = false;
    resetSoda();
    for (const J of gasJars) { J.state = null; J.water.material.opacity = 0; }
    showSet('pair');
    view(ctx, [-2.6, 1.1, 0], 2.0, { halfH: 1.6 });
    shell.task(`<p>Две еднакви стъкленици. Под едната гори <b>една</b> свещ, под другата — <b>две</b>.</p>${SAFE}`);
    let mistakes = 0;
    choice(ctx, {
      q: 'Ако похлупим и двете едновременно, къде пламъците ще угаснат по-рано?',
      options: [
        { t: 'Под стъкленицата с двете свещи', ok: true, why: 'Да видим дали си прав!' },
        { t: 'Под стъкленицата с една свещ', ok: false, why: 'Помисли: две свещи изразходват кислорода по-бързо или по-бавно от една?' },
        { t: 'Едновременно', ok: false, why: 'Въздухът е еднакъв, но свещите не са еднакъв брой.' },
      ],
      hint: 'Всеки пламък изразходва кислород.',
      onRight: (m) => {
        mistakes = m;
        pair.forEach(cover);
        shell.setControls('');
        onAllOut = () => {
          if (!pair.every((r) => r.out)) return;
          onAllOut = null;
          ctx.say(pair[1].g, 'Двете свещи изразходват кислорода по-бързо и угасват по-рано.', 'good', 1.45);
          setTimeout(transfer, 700);
        };
      },
    });
    function transfer() {
      shell.task('<p>Пренеси към живота.</p><p class="warn">⚠ Никога не гаси горящо олио с вода! Извикай възрастен. При пожар звъни на 112.</p>');
      choice(ctx, {
        q: 'Олиото в тигана се запали. Възрастният го покрива плътно с капак. Защо пламъкът угасва?',
        options: [
          { t: 'Капакът спира достъпа на въздух и пламъкът остава без кислород.', ok: true, why: 'Вярно! Без кислород горенето спира, точно като свещта под стъкленицата.' },
          { t: 'Капакът изстудява олиото веднага.', ok: false, why: 'Капакът не изстудява веднага. Спомни си свещта под стъкленицата.' },
          { t: 'Под капака се събира азот, който гори.', ok: false, why: 'Азотът не гори и не поддържа горенето. Какво не достига под капака?' },
        ],
        hint: 'Какво спира свещта под стъкленицата?',
        mistakes,
        onRight: (m) => {
          ctx.scores[3] = stepScore(m, 3);
          finishBtn(ctx, onComplete, restart);
        },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    step1();
  }
  step1();
  return { dispose() { stage.dispose(); } };
}
