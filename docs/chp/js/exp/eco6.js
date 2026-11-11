// 6.2.7 „Замърсители и екологични проблеми“ — долина с ТЕЦ на въглища, път, гора, езеро и паметник,
// и модел на Земята с атмосфера и озонов слой.
// Стъпки: опознай → киселинен дъжд (опит с филтър) → парников ефект и озонов слой → какво можем да направим.
import { labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, bar, stepScore } from './labkit.js';
import { sortTask } from './labtasks.js';
import { meadow, clouds, treeModel } from './nature3.js';
import { tagOver } from './chem6.js';

const V3 = THREE.Vector3;
const lerp = (a, b, k) => a + (b - a) * k;

function plantModel() {
  const g = new THREE.Group();
  const hall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.0), mat(0x90a4ae));
  hall.position.y = 0.5;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 1.1), mat(0x546e7a));
  roof.position.y = 1.05;
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.6, 14), mat(0xb0bec5));
  chimney.position.set(0.6, 1.3, 0);
  for (const y of [2.2, 2.45]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 14), mat(0xe53935)); s.position.set(0.6, y, 0); g.add(s); }
  const coal = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 10), mat(0x212121, { flat: true }));
  coal.position.set(-1.3, 0.2, 0.3);
  const filter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), mat(0x43a047));
  filter.position.set(1.1, 0.3, 0.5);
  filter.visible = false;
  g.add(hall, roof, chimney, coal, filter);
  g.userData = { top: new V3(0.6, 2.65, 0), filter };
  return g;
}

function statueModel() {
  const g = new THREE.Group();
  const m = mat(0xf5f5f0, { roughness: 0.6 });
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), m); ped.position.y = 0.25;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.4, 6, 10), m); body.position.y = 0.8;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), m); head.position.y = 1.18;
  g.add(ped, body, head);
  g.userData.m = m;
  return g;
}

function carModel(color) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.26), mat(color)); b.position.y = 0.13;
  const c = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.22), mat(0x90caf9)); c.position.set(-0.03, 0.26, 0);
  g.add(b, c);
  for (const [x, z] of [[0.16, 0.13], [0.16, -0.13], [-0.16, 0.13], [-0.16, -0.13]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), mat(0x212121)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.06, z); g.add(w); }
  return g;
}

function earthModel() {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#1e64b4'; x.fillRect(0, 0, 256, 128);
  x.fillStyle = '#4caf50';
  for (const [cx, cy, rx, ry] of [[60, 45, 28, 22], [75, 85, 14, 24], [135, 40, 30, 16], [140, 75, 16, 22], [205, 85, 18, 10], [190, 40, 34, 14]]) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 8); x.fillRect(0, 118, 256, 10);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 20), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
  const atm = new THREE.Mesh(new THREE.SphereGeometry(0.98, 32, 20), new THREE.MeshStandardMaterial({ color: 0x90caf9, transparent: true, opacity: 0.18, depthWrite: false }));
  const ozM = new THREE.MeshStandardMaterial({ color: 0xb39ddb, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const ozone = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.82), ozM);
  const capM = new THREE.MeshStandardMaterial({ color: 0xb39ddb, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 8, 0, Math.PI * 2, Math.PI * 0.82, Math.PI * 0.18), capM);
  g.add(earth, atm, ozone, cap);
  g.userData = { earth, capM };
  return g;
}

// Стрелка-лъч от A към B.
function ray(color) {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), m);
  const h = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 8), m);
  g.add(s, h);
  g.userData = {
    set(a, b) {
      const d = new V3().subVectors(b, a); const L = d.length();
      s.scale.y = Math.max(0.01, L - 0.16); s.position.copy(a).addScaledVector(d, (L - 0.16) / 2 / L);
      s.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.clone().normalize());
      h.position.copy(a).addScaledVector(d, (L - 0.08) / L); h.quaternion.copy(s.quaternion);
    },
  };
  return g;
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Киселинен дъжд', 'Парников ефект и озонов слой', 'Какво можем да направим'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xbfe3ff, camPos: [0, 6, 13], target: [0, 1, 0], maxDistance: 26 } });
  const { shell, stage, scene } = ctx;
  scene.fog = new THREE.Fog(0xbfe3ff, 26, 60);
  meadow(scene);
  clouds(stage, 4, { y: 9 });

  // ---------- Долина ----------
  const plant = plantModel();
  plant.position.set(-5, 0, -1.5);
  plant.userData.pickId = 'plant';
  addHitBox(plant, 1);
  tagOver(stage, plant, 'ТЕЦ на въглища', 3.1);
  scene.add(plant);
  const PU = plant.userData;
  const smoke = [];
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9e9e9e, transparent: true, opacity: 0.5, depthWrite: false })); s.userData.k = i / 14; scene.add(s); smoke.push(s); }
  const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.9), mat(0x455a64));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 2.6);
  scene.add(road);
  const cars = [0xe53935, 0x1e88e5, 0xfdd835].map((c, i) => { const g = carModel(c); g.position.set(-6 + i * 4, 0, 2.45 + (i % 2) * 0.3); g.userData.pickId = 'cars'; scene.add(g); return g; });
  addHitBox(cars[1], 0.6);
  tagOver(stage, cars[1], 'Коли', 0.6);
  const forest = new THREE.Group();
  const leafMs = [];
  for (let i = 0; i < 7; i++) { const t = treeModel(0.8 + (i % 3) * 0.15); t.position.set((i % 4) * 1.1 - 1.6, 0, -2 - Math.floor(i / 4) * 1.1); t.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0x3f8f3a) { o.material = o.material.clone(); leafMs.push(o.material); } }); forest.add(t); }
  forest.position.set(0.5, 0, 0);
  forest.userData.pickId = 'forest';
  scene.add(forest);
  const forestTag = labelSprite('Гора', { size: 0.26 }); forestTag.position.set(0.5, 3.4, -2.5); stage.steadyLabel(forestTag, 10); scene.add(forestTag);
  const lakeM = new THREE.MeshStandardMaterial({ color: 0x3d8fd1, transparent: true, opacity: 0.85, roughness: 0.15 });
  const lake = new THREE.Mesh(new THREE.CircleGeometry(1.5, 36), lakeM);
  lake.rotation.x = -Math.PI / 2; lake.scale.set(1.3, 0.8, 1); lake.position.set(4.6, 0.02, -0.6);
  lake.userData.pickId = 'lake';
  scene.add(lake);
  const fishes = [0xff8a65, 0xffb74d, 0xe57373].map((c) => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6), mat(c)); f.scale.set(1.6, 0.6, 0.6); scene.add(f); return f; });
  const lakeTag = labelSprite('Езеро', { size: 0.24 }); lakeTag.position.set(4.6, 0.6, -0.6); stage.steadyLabel(lakeTag, 10); scene.add(lakeTag);
  const statue = statueModel();
  statue.position.set(2.6, 0, 1.2);
  statue.userData.pickId = 'statue';
  addHitBox(statue, 0.6);
  tagOver(stage, statue, 'Мраморен паметник', 1.5, 0.18);
  scene.add(statue);
  const rainCloud = new THREE.Group();
  for (const [x, r] of [[-1, 0.7], [0, 0.9], [1.1, 0.75], [2.1, 0.6]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat(0x78909c, { roughness: 1 })); p.position.x = x; rainCloud.add(p); }
  rainCloud.position.set(1.5, 5.2, -1);
  rainCloud.visible = false;
  scene.add(rainCloud);
  const drops = [];
  for (let i = 0; i < 70; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), new THREE.MeshBasicMaterial({ color: 0x9fa8da })); d.position.set(-1 + Math.random() * 6, Math.random() * 5, -2 + Math.random() * 3); d.visible = false; scene.add(d); drops.push(d); }
  const phTag = stage.bubble(new V3(1.5, 6.3, -1), '', { cls: 'tag', lift: 0 });
  phTag.el.style.visibility = 'hidden';
  const A = { so2: 0, want: 0, filter: false, rain: false, dmg: 0 };

  // ---------- Модел на Земята ----------
  const earthG = earthModel();
  earthG.position.set(-1.0, 6.0, 4.6);
  earthG.userData.pickId = 'earth';
  addHitBox(earthG, 1);
  tagOver(stage, earthG, 'Земя (модел)', 1.45, 0.22);
  scene.add(earthG);
  earthG.visible = false;
  const EU = earthG.userData;
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd54f }));
  sunBall.position.set(-4.2, 6.4, 4.6);
  sunBall.visible = false;
  scene.add(sunBall);
  const rays = { sun: ray(0xffd54f), out: ray(0xef5350), back: ray(0xef5350), uv: ray(0xab47bc) };
  Object.values(rays).forEach((r) => { r.visible = false; scene.add(r); });
  const thermo = stage.bubble(new V3(-1.0, 4.55, 4.6), '', { cls: 'tag', lift: 0 });
  thermo.el.style.visibility = 'hidden';
  const G = { co2: 0, cfc: 0, mode: null };

  stage.tick((dt, t) => {
    A.so2 += (A.want * (A.filter ? 0.1 : 1) - A.so2) * Math.min(1, dt * 1.5);
    smoke.forEach((s) => { const f = (t * 0.25 + s.userData.k) % 1; s.position.copy(plant.position).add(PU.top).add(new V3(f * 3, f * 2.2, Math.sin(s.userData.k * 9) * 0.3)); s.scale.setScalar(0.6 + f * 1.6); s.material.opacity = (0.15 + A.so2 * 0.5) * (1 - f); s.material.color.setHex(0x9e9e9e).lerp(new THREE.Color(0x5d4037), A.so2 * 0.6); });
    cars.forEach((c, i) => { c.position.x += dt * (0.8 + i * 0.2); if (c.position.x > 7) c.position.x = -7; });
    fishes.forEach((f, i) => { const a = t * 0.6 + i * 2.1; f.position.set(4.6 + Math.cos(a) * 1.1, 0.06, -0.6 + Math.sin(a) * 0.6); f.rotation.y = -a - Math.PI / 2; f.visible = A.dmg < 0.7 || i === 0; });
    // киселинен дъжд
    rainCloud.visible = A.rain;
    drops.forEach((d) => { d.visible = A.rain; if (A.rain) { d.position.y -= dt * 6; if (d.position.y < 0) d.position.y = 5; } });
    if (A.rain) A.dmg += ((A.so2 > 0.3 ? A.so2 : 0) - A.dmg) * Math.min(1, dt * 0.6);
    leafMs.forEach((m) => m.color.setHex(0x3f8f3a).lerp(new THREE.Color(0xa1887f), A.dmg * 0.6));
    lakeM.color.setHex(0x3d8fd1).lerp(new THREE.Color(0x6d8f8f), A.dmg * 0.7);
    statue.userData.m.color.setHex(0xf5f5f0).lerp(new THREE.Color(0x8d8576), A.dmg * 0.7);
    if (A.rain) { phTag.el.style.visibility = ''; const ph = lerp(5.6, 4.0, A.so2); phTag.set(`pH на дъжда: ${ph.toFixed(1).replace('.', ',')} ${ph < 5 ? '— киселинен!' : '— нормален'}`); }
    // Земя
    EU.earth.rotation.y += dt * 0.2;
    EU.capM.opacity = 0.35 * (1 - G.cfc * 0.9);
    const E = earthG.position;
    if (G.mode) {
      rays.sun.visible = true; rays.sun.userData.set(sunBall.position.clone().add(new V3(0.4, -0.2, 0)), E.clone().add(new V3(-0.8, 0, 0.1)));
      const back = G.mode === 'gh' ? 0.25 + G.co2 * 0.7 : 0.3;
      rays.out.visible = G.mode === 'gh'; rays.out.userData.set(E.clone().add(new V3(0.5, 0.6, 0)), E.clone().add(new V3(1.3 - back * 0.6, 1.6 - back * 0.8, 0)));
      rays.back.visible = G.mode === 'gh'; rays.back.userData.set(E.clone().add(new V3(0.95, 1.05, 0)), E.clone().add(new V3(0.5, 0.6, 0).multiplyScalar(1 - back * 0.3)));
      rays.back.scale.setScalar(1);
      rays.back.children.forEach((c) => { c.material.opacity = back; });
      rays.uv.visible = G.mode === 'oz';
      rays.uv.userData.set(E.clone().add(new V3(1.6, -1.6, 0)), E.clone().add(new V3(0.35, G.cfc > 0.5 ? -0.75 : -1.1, 0)));
      thermo.el.style.visibility = '';
      if (G.mode === 'gh') thermo.set(`CO₂ ${bar(G.co2 * 100, '#8d6e63')} · средна температура: ${(14 + G.co2 * 2).toFixed(1).replace('.', ',')} °C`);
      else thermo.set(`фреони ${bar(G.cfc * 100, '#ab47bc')} · озонов слой: ${G.cfc > 0.5 ? 'изтънял' : 'здрав'}`);
    } else { Object.values(rays).forEach((r) => { r.visible = false; }); thermo.el.style.visibility = 'hidden'; }
  });

  function resetAll() {
    A.so2 = 0; A.want = 0; A.filter = false; A.rain = false; A.dmg = 0; PU.filter.visible = false;
    phTag.el.style.visibility = 'hidden';
    G.co2 = 0; G.cfc = 0; G.mode = null;
  }
  function showEarth(on) { earthG.visible = on; sunBall.visible = on; }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    resetAll(); showEarth(true);
    view(ctx, [0, 1.6, 0.8], 7.2, { halfH: 3.0 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>При горене на въглища, нефт и газ се отделят вещества, които <b>замърсяват въздуха</b>. Те водят до големи екологични проблеми.</p><p><b>Разгледай всичко</b> от менюто или с клик.</p>',
      items: [
        { id: 'plant', label: 'ТЕЦ на въглища', icon: '🏭', note: 'Във въглищата има сяра. При горенето им се отделят <b>серен диоксид SO₂</b> и <b>въглероден диоксид CO₂</b>.', obj: () => plant, dist: 5, lift: 1.2, bubble: 3.3 },
        { id: 'cars', label: 'Коли', icon: '🚗', note: 'Двигателите отделят <b>CO₂</b>, а при непълно горене — отровния <b>въглероден оксид CO</b>.', obj: () => cars[1], dist: 3 },
        { id: 'forest', label: 'Гора', icon: '🌲', note: 'Дърветата поемат CO₂ и отделят кислород.', obj: () => forest, dist: 5, lift: 1.2, bubble: 3.2 },
        { id: 'lake', label: 'Езеро', icon: '🐟', note: 'В езерото живеят риби. Те са чувствителни към киселинността на водата.', obj: () => lake, dist: 4 },
        { id: 'statue', label: 'Паметник', icon: '🗿', note: 'Мраморът и варовикът се разяждат от киселини.', obj: () => statue, dist: 3 },
        { id: 'earth', label: 'Земя (модел)', icon: '🌍', note: 'Около Земята има <b>атмосфера</b>. Високо в нея е <b>озоновият слой</b> (лилав), който спира голяма част от вредните ултравиолетови лъчи. <i>Не е в мащаб.</i>', obj: () => earthG, dist: 4, lift: 0, bubble: 1.6 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Киселинен дъжд ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    resetAll(); showEarth(false);
    A.rain = true;
    view(ctx, [0, 2.4, -0.8], 5.8, { halfH: 3.2, elev: 0.3 });
    shell.task('<p>Над долината вали дъжд. Чистият дъжд е съвсем слабо кисел (pH около 5,6).</p>');
    choice(ctx, {
      q: 'Какво ще стане, ако ТЕЦ гори много въглища със сяра?',
      options: [
        { t: 'Дъждът ще стане киселинен и ще навреди на гората, езерото и паметника.', ok: true, why: 'Да проверим! Плъзни лентата.' },
        { t: 'Дъждът ще стане по-чист.', ok: false, why: 'Димът от комина отива в облаците. Какво носи той?' },
        { t: 'Нищо — димът отлита в космоса.', ok: false, why: 'Димът остава в атмосферата и се смесва с водата в облаците.' },
      ],
      hint: 'Серният диоксид + вода в облаците → киселина.',
      onRight: (m) => acid(m),
    });
  }
  function acid(m0) {
    let mistakes = m0;
    const c = shell.setControls('<label class="row">SO₂ от комина <input type="range" class="so2" min="0" max="100" value="0" style="flex:1"></label>');
    let said = false;
    c.querySelector('.so2').addEventListener('input', (e) => {
      A.want = +e.target.value / 100;
      if (A.want >= 1 && !said) {
        said = true;
        setTimeout(() => {
          ctx.say(forest, 'Киселинният дъжд <b>уврежда листата</b>, подкиселява езерото и <b>разяжда мрамора</b>.', 'wide', 3.0);
          const b = nextBtn(ctx, '🟩 Сложи филтър на комина', () => {
            b.disabled = true;
            A.filter = true; PU.filter.visible = true;
            setTimeout(() => {
              ctx.say(plant, 'Сероочистващият филтър задържа серния диоксид. Дъждът отново е почти нормален.', 'good wide', 3.2);
              choice(ctx, {
                q: 'Кой замърсител причинява главно киселинния дъжд в опита?',
                options: [
                  { t: 'Серният диоксид SO₂', ok: true, why: 'Вярно! С водата в облаците той образува киселина. (Киселинен дъжд причиняват и азотните оксиди от колите.)' },
                  { t: 'Кислородът', ok: false, why: 'Кислородът е във всеки въздух. Какво добави комина?' },
                  { t: 'Водните пари', ok: false, why: 'Водните пари има и в чистия дъжд. Какво се промени?' },
                ],
                hint: 'Филтърът задържа точно него.',
                mistakes,
                onRight: (mm) => { ctx.scores[0] = stepScore(mm, 3); nextBtn(ctx, 'Напред →', step3); },
              });
            }, 2500);
          });
        }, 2600);
      }
    });
  }

  // ---------- 3. Парников ефект и озонов слой ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    A.rain = false; phTag.el.style.visibility = 'hidden';
    showEarth(true);
    G.mode = 'gh'; G.co2 = 0;
    view(ctx, [-1.8, 6.0, 4.6], 2.5, { halfH: 2.0, elev: 0.05 });
    let mistakes = 0;
    shell.task('<p>Слънчевите лъчи (жълти) затоплят Земята. Тя излъчва топлина (червени лъчи). Част от топлината се връща от газовете в атмосферата — това е <b>парниковият ефект</b>.</p><p>Без него средната температура на Земята би била около −18 °C.</p>');
    const c = shell.setControls('<label class="row">CO₂ в атмосферата <input type="range" class="co2" min="0" max="100" value="0" style="flex:1"></label>');
    let said = false;
    c.querySelector('.co2').addEventListener('input', (e) => {
      G.co2 = +e.target.value / 100;
      if (G.co2 >= 1 && !said) {
        said = true;
        ctx.say(earthG, 'Повече CO₂ задържа повече топлина → <b>засилен парников ефект</b> и затопляне на климата. <i>Числата са условни.</i>', 'wide', 1.3);
        nextBtn(ctx, 'Напред: озоновият слой →', ozone);
      }
    });
    function ozone() {
      ctx.clearTip();
      G.mode = 'oz';
      shell.task('<p>Озоновият слой спира голяма част от <b>ултравиолетовите лъчи</b> (лилави). Фреоните от стари хладилници и спрейове го разрушават.</p>');
      const cc = shell.setControls('<label class="row">Фреони <input type="range" class="cfc" min="0" max="100" value="0" style="flex:1"></label>');
      let s2 = false;
      cc.querySelector('.cfc').addEventListener('input', (e) => {
        G.cfc = +e.target.value / 100;
        if (G.cfc >= 1 && !s2) {
          s2 = true;
          ctx.say(earthG, 'Над Антарктида озоновият слой изтъня — <b>озонова „дупка“</b>. Повече UV лъчи стигат до Земята. След забраната на фреоните слоят бавно се възстановява.', 'wide', 1.3);
          setTimeout(() => {
            ctx.clearTip();
            shell.task('<p>Свържи замърсителя с проблема, който причинява.</p>');
            sortTask(ctx, {
              bins: ['Киселинен дъжд', 'Засилен парников ефект', 'Озонова „дупка“', 'Отравяне на хората'],
              items: [
                { t: 'Серен диоксид SO₂', bin: 0, why: 'SO₂ + вода в облаците → киселинен дъжд.' },
                { t: 'Въглероден диоксид CO₂', bin: 1, why: 'CO₂ задържа топлината в атмосферата.' },
                { t: 'Фреони', bin: 2, why: 'Фреоните разрушават озона.' },
                { t: 'Въглероден оксид CO (угарен газ)', bin: 3, why: 'CO е отровен — пречи на кръвта да пренася кислород.' },
              ],
              hint: 'Спомни си: комин → дъжд; CO₂ → топлина; хладилници → озон.',
              mistakes,
              onDone: (m) => { G.mode = null; ctx.scores[1] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step4); },
            });
          }, 3000);
        }
      });
    }
  }

  // ---------- 4. Какво можем да направим ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    G.mode = null; showEarth(false);
    view(ctx, [0, 1.6, 0.8], 6.4, { halfH: 2.6, elev: 0.35 });
    shell.task('<p>Хората замърсяват въздуха, но могат и да го пазят.</p>');
    sortTask(ctx, {
      bins: ['Намалява замърсяването', 'Увеличава замърсяването'],
      items: [
        { t: '🚌 Пътуваме с градски транспорт, колело или пеша', bin: 0, why: 'По-малко коли — по-малко CO₂ и CO.' },
        { t: '💡 Гасим лампите, когато излизаме от стаята', bin: 0, why: 'Пестим ток — ТЕЦ гори по-малко въглища.' },
        { t: '☀ Ток от слънце и вятър', bin: 0, why: 'Не се гори гориво.' },
        { t: '🌳 Засаждаме дървета', bin: 0, why: 'Дърветата поемат CO₂.' },
        { t: '🔥 Палим стари гуми и пластмаса', bin: 1, why: 'Отделят се отровни вещества и сажди.' },
        { t: '🚗 Оставяме колата да работи на място', bin: 1, why: 'Излишно гориво и газове.' },
      ],
      hint: 'Гори ли се повече гориво?',
      onDone: (m1) => {
        choice(ctx, {
          q: 'В стая се отоплявате с печка на дърва. Как да се пазите от угарен газ (CO)?',
          options: [
            { t: 'Проверяваме комина, проветряваме и слагаме детектор за CO.', ok: true, why: 'Вярно! CO няма цвят и мирис — само детекторът го „усеща“.' },
            { t: 'Затваряме комина, за да не излиза топлината.', ok: false, why: 'Тогава газовете остават в стаята. Опасно!' },
            { t: 'Нищо — щом не мирише, няма опасност.', ok: false, why: 'Въглеродният оксид няма мирис. Затова е толкова опасен.' },
          ],
          hint: 'CO не се вижда и не мирише.',
          mistakes: m1,
          onRight: (m) => { ctx.scores[2] = stepScore(m, 3); shell.task('<p>Всеки от нас може да помогне за чист въздух.</p>'); finishBtn(ctx, onComplete, restart); },
        });
      },
    });
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    step1();
  }
  step1();
  return { dispose() { phTag.remove(); thermo.remove(); stage.dispose(); } };
}
