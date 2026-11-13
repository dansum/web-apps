// 5.1.6 „Сезони, фази на Луната, затъмнения“ — Слънцето, Земята с наклонена ос и Луната (не в мащаб).
// Стъпки: опознай → сезоните: премести Земята по орбитата → фазите на Луната → затъмненията.
import { labelSprite, addHitBox, THREE } from '../kit.js';
import { predict, compare, scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import { orderTask } from './labtasks.js';
import { earthTex, cloudsTex, rockyTex, canvasTex, glowTex, latLon } from './solar.js';

const TILT = THREE.MathUtils.degToRad(23.44);
const BG = { lat: 42.7, lon: 25.3 };
const ORB = 7; const ER = 0.6;            // орбитата и Земята в сцената А
const MR = 3.4; const ER2 = 1; const MOR = 0.32; // сцената Б: Земята, Луната
const MONTHS = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function dateOf(d) {
  let m = 0; let k = d;
  while (m < 11 && k > MDAYS[m]) { k -= MDAYS[m]; m++; }
  return `${k} ${MONTHS[m]}`;
}
// Склонение на Слънцето (приблизително) и данни за България по обед.
const decl = (d) => 23.44 * Math.sin(2 * Math.PI * (d - 80) / 365);
function sky(d) {
  const de = decl(d);
  const alt = 90 - BG.lat + de;
  const c = -Math.tan(BG.lat * Math.PI / 180) * Math.tan(de * Math.PI / 180);
  const hours = 2 * Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI / 15;
  return { alt, hours };
}
const angD = (a, b) => { const x = Math.abs(((a - b) % 360 + 360) % 360); return Math.min(x, 360 - x); };

// Как изглежда Луната от Северното полукълбо при ъгъл φ (0 = новолуние, 90 = първа четвърт).
function drawPhase(cv, phi) {
  const g = cv.getContext('2d'); const w = cv.width; const h = cv.height; const r = h * 0.4;
  g.fillStyle = '#0b1530'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 25; i++) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect((i * 97) % w, (i * 53) % h, 1.5, 1.5); }
  const cx = w / 2; const cy = h / 2;
  g.fillStyle = '#2a3142';
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  const p = ((phi % 360) + 360) % 360;
  const waxing = p < 180;
  const c = Math.cos(p * Math.PI / 180); // 1 новолуние, −1 пълнолуние
  g.fillStyle = '#f3ecd2';
  // осветената половина
  g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, !waxing); g.closePath(); g.fill();
  // границата между светло и тъмно е полуелипса
  g.fillStyle = c > 0 ? '#2a3142' : '#f3ecd2';
  g.beginPath(); g.ellipse(cx, cy, Math.abs(c) * r + 0.5, r + 0.5, 0, 0, Math.PI * 2); g.fill();
  if (c > 0) { g.fillStyle = '#2a3142'; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, waxing); g.closePath(); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
}

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Сезоните', 'Фазите на Луната', 'Затъмнения'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0x050816, camPos: [0, 9, 14], target: [0, 0, 0], minDistance: 2, maxDistance: 40, maxPolarAngle: Math.PI * 0.8 } });
  const { shell, stage, scene } = ctx;
  stage.sun.intensity = 0; stage.hemi.intensity = 0.12; stage.hemi.color.set(0x8899cc); stage.hemi.groundColor.set(0x223355);
  const note = document.createElement('div');
  note.textContent = (shell.stageEl.clientWidth || 600) < 520 ? '⚠ Не е в мащаб' : '⚠ Не е в мащаб: Слънцето е много по-голямо и много по-далеч.';
  note.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:4;pointer-events:none;max-width:calc(100% - 16px);background:rgba(15,26,51,.88);color:#ffd54a;font-size:.78rem;border-radius:8px;padding:4px 8px';
  shell.stageEl.appendChild(note);

  // звезди
  {
    const pos = [];
    for (let i = 0; i < 1500; i++) {
      const u = Math.random() * 2 - 1; const a = Math.random() * Math.PI * 2; const rr = 70 + Math.random() * 20; const s = Math.sqrt(1 - u * u);
      pos.push(Math.cos(a) * s * rr, u * rr, Math.sin(a) * s * rr);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const st = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 0.35, depthWrite: false }));
    st.raycast = () => {};
    scene.add(st);
  }
  const lbl = (t, size = 0.32) => labelSprite(t, { size, color: '#ffffff', bg: 'rgba(16,28,60,0.85)', border: '#6b7fb0' });
  const earthMat = new THREE.MeshStandardMaterial({ map: earthTex(), roughness: 0.85 });
  const cloudMat = new THREE.MeshStandardMaterial({ map: cloudsTex(), transparent: true, depthWrite: false, roughness: 1 });
  const moonTex = rockyTex('#b8b6b0', '#6f6c66', 41, 80);
  function makeEarth(r, withAxis) {
    const g = new THREE.Group();
    const tilt = new THREE.Group(); tilt.rotation.z = TILT; // северният полюс е наклонен към −x
    const spin = new THREE.Group();
    spin.add(new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), earthMat), new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 32, 20), cloudMat));
    const n = latLon(BG.lat, BG.lon);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(r * 0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff2d2d }));
    pin.position.copy(n).multiplyScalar(r * 1.03);
    spin.add(pin);
    tilt.add(spin);
    let axis = null;
    if (withAxis) {
      axis = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.03, r * 0.03, r * 3.2, 8), new THREE.MeshBasicMaterial({ color: 0xffd54a }));
      const np = lbl('С', 0.2); np.position.y = r * 1.75; tilt.add(np); stage.steadyLabel(np, 12);
      tilt.add(axis);
    }
    g.add(tilt);
    return { g, tilt, spin, axis, pin };
  }

  // ---------- Сцена А: Слънцето, Земята по орбитата ----------
  const rigA = new THREE.Group(); scene.add(rigA);
  const sunG = new THREE.Group();
  {
    const tex = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#ffb21e'; c.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { c.fillStyle = i % 2 ? 'rgba(255,235,140,0.3)' : 'rgba(235,120,20,0.22)'; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, 7); c.fill(); } });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.3, 36, 22), new THREE.MeshBasicMaterial({ map: tex }));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,240,180,0.9)'], [0.35, 'rgba(255,190,60,0.45)'], [1, 'rgba(255,120,0,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(6.5, 6.5, 1); glow.raycast = () => {};
    sunG.add(glow, ball);
    const l = lbl('Слънцето'); l.position.y = -1.9; sunG.add(l); stage.steadyLabel(l, 14);
  }
  sunG.userData.pickId = 'sun';
  rigA.add(sunG);
  addHitBox(sunG, 2);
  const sunLight = new THREE.PointLight(0xfff3dd, 3.2, 0, 0);
  rigA.add(sunLight);
  const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 180 }, (_, i) => new THREE.Vector3(Math.cos(i / 180 * Math.PI * 2) * ORB, 0, -Math.sin(i / 180 * Math.PI * 2) * ORB))), new THREE.LineBasicMaterial({ color: 0x5b6f9c, transparent: true, opacity: 0.6 }));
  orbit.raycast = () => {};
  rigA.add(orbit);
  const orbitAt = new THREE.Object3D(); orbitAt.position.set(0, 0, ORB); rigA.add(orbitAt);
  orbitAt.userData.pickId = 'orbit';
  {
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    orbitAt.add(hit);
  }
  for (const [d, t] of [[172, '21 юни'], [266, '23 септември'], [355, '21 декември'], [79, '20 март']]) {
    const th = 2 * Math.PI * (d - 172) / 365;
    const l = lbl(t, 0.26); l.position.set(Math.cos(th) * (ORB + 1.3), -0.3, -Math.sin(th) * (ORB + 1.3)); rigA.add(l); stage.steadyLabel(l, 14);
  }
  const EA = makeEarth(ER, true);
  EA.g.userData.pickId = 'earth';
  rigA.add(EA.g);
  addHitBox(EA.g, 1.2);
  EA.axis.userData.pickId = 'axis';
  const moonA = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1 }));
  moonA.userData.pickId = 'moon';
  EA.g.add(moonA);
  const SA = { day: 110 };
  const placeA = () => {
    const th = 2 * Math.PI * (SA.day - 172) / 365;
    EA.g.position.set(Math.cos(th) * ORB, 0, -Math.sin(th) * ORB);
  };
  placeA();

  // ---------- Сцена Б: Земята и Луната отблизо, светлината идва отдясно ----------
  const rigB = new THREE.Group(); rigB.visible = false; scene.add(rigB);
  const dirLight = new THREE.DirectionalLight(0xfff3dd, 0); dirLight.position.set(20, 0, 0);
  scene.add(dirLight);
  const EB = makeEarth(ER2, false);
  EB.tilt.rotation.z = 0.15;
  rigB.add(EB.g);
  const moonB = new THREE.Mesh(new THREE.SphereGeometry(MOR, 28, 18), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1, emissive: 0x000000 }));
  moonB.userData.pickId = 'moonB';
  const moonOrbit = new THREE.Group();
  const mo = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 120 }, (_, i) => new THREE.Vector3(Math.cos(i / 120 * Math.PI * 2) * MR, 0, -Math.sin(i / 120 * Math.PI * 2) * MR))), new THREE.LineBasicMaterial({ color: 0x8fa3d1, transparent: true, opacity: 0.6 }));
  mo.raycast = () => {};
  moonOrbit.add(mo, moonB);
  rigB.add(moonOrbit);
  // стрелки „светлина от Слънцето“
  const rays = new THREE.Group();
  for (const z of [-2.4, 0, 2.4]) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), new THREE.MeshBasicMaterial({ color: 0xffd54a }));
    shaft.rotation.z = Math.PI / 2; shaft.position.set(6.6, 0, z);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 12), new THREE.MeshBasicMaterial({ color: 0xffd54a }));
    head.rotation.z = Math.PI / 2; head.position.set(5.35, 0, z);
    rays.add(shaft, head);
  }
  const rl = lbl('светлина от Слънцето', 0.28); rl.position.set(5.4, 0.6, -2.4); rays.add(rl); stage.steadyLabel(rl, 12);
  rays.position.x = -0.5;
  rigB.add(rays);
  const SB = { phi: 130, red: 0 };
  // сенки при затъмненията
  const umbra = new THREE.Mesh(new THREE.ConeGeometry(MOR, MR - ER2, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }));
  umbra.rotation.z = Math.PI / 2; umbra.position.set((MR + ER2) / 2, 0, 0); umbra.visible = false;
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85 }));
  spot.rotation.y = Math.PI / 2; spot.position.set(ER2 + 0.03, 0, 0); spot.visible = false;
  const earthShadow = new THREE.Mesh(new THREE.CylinderGeometry(ER2 * 0.92, ER2 * 0.98, 4.6, 28, 1, true), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
  earthShadow.rotation.z = Math.PI / 2; earthShadow.position.set(-ER2 - 2.3, 0, 0); earthShadow.visible = false;
  rigB.add(umbra, spot, earthShadow);
  const placeB = () => {
    const a = SB.phi * Math.PI / 180;
    moonB.position.set(Math.cos(a) * MR, 0, -Math.sin(a) * MR);
    moonB.rotation.y = a + Math.PI;
  };
  placeB();

  function sceneA() { rigA.visible = true; rigB.visible = false; sunLight.intensity = 3.2; dirLight.intensity = 0; }
  function sceneB() { rigA.visible = false; rigB.visible = true; sunLight.intensity = 0; dirLight.intensity = 2.6; }

  stage.tick((dt, t) => {
    EA.spin.rotation.y += dt * 0.9;
    EB.spin.rotation.y += dt * 0.25;
    const ma = t * 0.5;
    moonA.position.set(Math.cos(ma) * 1.2, 0, -Math.sin(ma) * 1.2);
    sunG.children[0].material.rotation = t * 0.05;
    // лунно затъмнение: Луната почервенява
    const red = SB.red;
    moonB.material.color.setRGB(1 - red * 0.45, 1 - red * 0.72, 1 - red * 0.8);
    moonB.material.emissive.setRGB(red * 0.22, red * 0.06, red * 0.02);
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    sceneA(); SA.day = 110; placeA();
    umbra.visible = spot.visible = earthShadow.visible = false; SB.red = 0; moonOrbit.rotation.x = 0;
    view(ctx, [0, 0, 0], 9.5, { halfH: 5, elev: 0.75 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Защо се сменят сезоните? Защо Луната сменя формата си? Какво е затъмнение?</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'sun', label: 'Слънцето', icon: '☀', note: 'Слънцето е звезда. То свети само и осветява Земята и Луната. Винаги е осветена само половината от Земята: там е ден.', obj: () => sunG, dist: 6, bubble: 1.6 },
        { id: 'earth', label: 'Земята', icon: '🌍', note: 'Земята обикаля около Слънцето за <b>една година</b> и се върти около оста си за <b>едно денонощие</b>. Червената точка е България.', obj: () => EA.g, dist: 3.2, bubble: 0.9 },
        { id: 'axis', label: 'Земната ос', icon: '📍', note: 'Земната ос е <b>наклонена</b> (с около 23°) и сочи все в една посока, докато Земята обикаля около Слънцето.', obj: () => EA.g, dist: 2.6, bubble: 1.2 },
        { id: 'orbit', label: 'Орбитата на Земята', icon: '⭕', note: 'Пътят на Земята около Слънцето е почти кръг. Земята го изминава за около 365 денонощия.', obj: () => orbitAt, dist: 5, bubble: 0.6 },
        { id: 'moon', label: 'Луната', icon: '🌙', note: 'Луната обикаля около Земята за около един месец. Тя не свети сама, а <b>отразява</b> светлината на Слънцето.', obj: () => EA.g, dist: 2.8, bubble: 0.9 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Сезоните ----------
  function step2() {
    shell.step(1);
    sceneA();
    view(ctx, [0, 0, 0], 9, { halfH: 4.5, elev: 0.55 });
    shell.task('<p>Земята обикаля около Слънцето, а оста ѝ е наклонена. През лятото в България е топло, а през зимата — студено.</p><p class="small"><b>Полукълбо</b> е половината от Земята. <b>Екваторът</b> е въображаема линия около средата на Земята. Той я дели на Северно и Южно полукълбо. България е в Северното.</p>');
    let mistakes = 0;
    let readout = null;
    // Решение 21: отворена прогноза — детето мести Земята с каквото е избрало, после сравнение.
    predict(ctx, {
      q: 'Как мислиш, защо на Земята се сменят сезоните?',
      options: [
        { t: 'Земната ос е наклонена и през годината Слънцето огрява полукълбата различно.', ok: true },
        { t: 'Земята ту се приближава, ту се отдалечава от Слънцето.', ok: false },
        { t: 'Слънцето свети по-силно през лятото.', ok: false },
      ],
      onPick: () => { mistakes = ctx.predMiss || 0; nextBtn(ctx, 'Провери с опита →', () => move('june')); },
    });
    function move(which) {
      const T = which === 'june' ? { d: 172, lo: 162, hi: 182, name: '21 юни', season: 'лято' } : { d: 355, lo: 345, hi: 365, name: '21 декември', season: 'зима' };
      ctx.answer = T.d;
      shell.task(`<p><b>Премести Земята на ${T.name}</b> с плъзгача и натисни „Провери“.</p>
        <label class="small">Дата: <b class="dv">${dateOf(SA.day)}</b>
        <input class="slider dd" type="range" min="1" max="365" step="1" value="${SA.day}"></label>
        <p class="small">Градусите (°) тук не са температура. Те показват колко високо над хоризонта е Слънцето.</p>`);
      const sl = container.querySelector('.dd'); const dv = container.querySelector('.dv');
      if (!readout) readout = stage.bubble(EA.g, '', { cls: 'tag', lift: 1.3 });
      const upd = () => {
        SA.day = +sl.value; placeA(); dv.textContent = dateOf(SA.day);
        const s = sky(SA.day);
        readout.set(`📅 ${dateOf(SA.day)} · в България по обед Слънцето е на ${Math.round(s.alt)}° над хоризонта · денят е ≈ ${Math.round(s.hours)} ч`);
      };
      sl.addEventListener('input', upd); upd();
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      c.querySelector('.chk').addEventListener('click', () => {
        if (SA.day >= T.lo && SA.day <= T.hi) {
          c.querySelector('.chk').disabled = true; sl.disabled = true;
          const s = sky(SA.day);
          if (which === 'june') {
            ctx.say(sunG, `21 юни: Северното полукълбо е <b>наклонено към Слънцето</b>. Лъчите падат по-отвесно (Слънцето е на ${Math.round(s.alt)}° над хоризонта), а денят е дълъг (≈ ${Math.round(s.hours)} ч). В България е <b>лято</b>.`, 'wide', 1.7);
            nextBtn(ctx, 'Сега зима →', () => { ctx.clearTip(); move('dec'); });
          } else {
            ctx.say(sunG, `21 декември: Северното полукълбо е <b>наклонено обратно</b>. Лъчите падат полегато (Слънцето е само на ${Math.round(s.alt)}° над хоризонта) и денят е кратък (≈ ${Math.round(s.hours)} ч). В България е <b>зима</b>, а в Австралия — лято.`, 'wide', 1.7);
            ctx.answer = null;
            ctx.scores[0] = stepScore(mistakes, 3);
            compare(ctx, {
              result: 'На 21 юни Северното полукълбо е наклонено към Слънцето, а на 21 декември — обратно. Лъчите падат различно и денят е с различна дължина.',
              why: 'Земната ос е наклонена. Разстоянието до Слънцето се мени съвсем малко. Когато в България е зима, в Австралия е лято — по едно и също време.',
            });
            nextBtn(ctx, 'Напред →', () => { readout.remove(); readout = null; step3(); });
          }
          return;
        }
        mistakes++;
        shell.msg(`Сега е ${dateOf(SA.day)}, а търсим ${T.name}.${mistakes >= 2 ? ' Подсказка: датите са написани до орбитата.' : ''}`, 'bad');
      });
    }
  }

  // ---------- 3. Фазите на Луната ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    sceneB(); SB.phi = 130; placeB();
    view(ctx, [0.6, 0, 0], 5.6, { halfH: 4, elev: 0.95 });
    ctx.say(moonB, 'Слънцето винаги осветява <b>половината</b> от Луната. От Земята виждаме различна част от осветената половина.', 'wide', 0.6);
    let mistakes = 0;
    const tasks = [
      { phi: 180, name: 'пълнолуние', why: 'Луната е от другата страна на Земята и виждаме цялата ѝ осветена половина.' },
      { phi: 0, name: 'новолуние', why: 'Луната е между Земята и Слънцето. Към нас е обърната тъмната ѝ страна.' },
      { phi: 90, name: 'първа четвърт', why: 'Виждаме половин Луна: светлата част е отдясно и расте.' },
    ];
    let k = 0;
    function task() {
      const T = tasks[k];
      ctx.answer = T.phi;
      shell.task(`<p><b>Премести Луната така, че от България да се вижда ${T.name}.</b></p>
        <canvas class="phase" width="200" height="120" style="width:100%;max-width:240px;display:block;border-radius:8px"></canvas>
        <p class="small">Горе: Луната, както се вижда от България.</p>
        <label class="small">Луната по орбитата <input class="slider mp" type="range" min="0" max="359" step="1" value="${SB.phi}"></label>`);
      const cv = container.querySelector('.phase'); const sl = container.querySelector('.mp');
      const upd = () => { SB.phi = +sl.value; placeB(); drawPhase(cv, SB.phi); };
      sl.addEventListener('input', upd); upd();
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      c.querySelector('.chk').addEventListener('click', () => {
        if (angD(SB.phi, T.phi) <= 14) {
          c.querySelector('.chk').disabled = true; sl.disabled = true;
          ctx.say(moonB, `✔ ${T.name[0].toUpperCase() + T.name.slice(1)}. ${T.why}`, 'good wide', 0.6);
          k++;
          if (k < tasks.length) nextBtn(ctx, 'Следваща фаза →', task);
          else nextBtn(ctx, 'Подреди фазите →', order);
          return;
        }
        mistakes++;
        shell.msg(`Това не е ${T.name}. Гледай картинката горе.${mistakes >= 2 ? ' Подсказка: светлината идва отдясно. Къде трябва да е Луната спрямо Земята и Слънцето?' : ''}`, 'bad');
      });
    }
    function order() {
      ctx.answer = null;
      ctx.clearTip();
      shell.task('<p>Луната сменя фазите си за около <b>29 денонощия и половина</b>.</p>');
      orderTask(ctx, {
        q: 'Подреди фазите, както следват една след друга, като започнеш от новолуние.',
        items: ['новолуние', 'първа четвърт', 'пълнолуние', 'последна четвърт'],
        hint: 'След новолуние светлата част расте до пълнолуние, после намалява.',
        mistakes,
        onDone: (m) => { ctx.scores[1] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step4); },
      });
    }
    task();
  }

  // ---------- 4. Затъмнения ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    sceneB(); SB.phi = 40; placeB(); SB.red = 0;
    view(ctx, [0.6, 0, 0], 5.6, { halfH: 3.5, elev: 0.7 });
    shell.task('<p>Понякога Слънцето, Луната и Земята застават <b>на една права линия</b>.</p>');
    let mistakes = 0;
    // Решение 25: детето само мести Луната по орбитата (Слънцето и Земята стоят). „Провери“ показва
    // в сцената какво се вижда: сянката на Луната пада или не пада върху Земята; Луната е в сянката на Земята или е осветена.
    moonOrbit.rotation.x = 0;
    const shadowOfMoon = () => {
      // сянката на Луната сочи от Слънцето (то е вдясно) наляво; до Земята стига само когато Луната е на линията
      umbra.position.set(moonB.position.x - (MR - ER2) / 2, 0, moonB.position.z);
      umbra.visible = true;
      spot.visible = angD(SB.phi, 0) <= 10;
    };
    const hideAll = () => { umbra.visible = spot.visible = earthShadow.visible = false; SB.red = 0; };
    function place(T) {
      ctx.answer = T.phi;
      hideAll(); ctx.clearTip();
      shell.task(`<p><b>${T.task}</b></p><p class="small">Светлината идва от Слънцето — отдясно. Мести само Луната.</p>
        <label class="small">Луната по орбитата <input class="slider ep" type="range" min="0" max="359" step="1" value="${SB.phi}"></label>`);
      const sl = container.querySelector('.ep');
      sl.addEventListener('input', () => { SB.phi = +sl.value; placeB(); hideAll(); ctx.clearTip(); shell.msg(''); });
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      c.querySelector('.chk').addEventListener('click', () => {
        const atSun = angD(SB.phi, 0) <= 10, atBack = angD(SB.phi, 180) <= 10;
        if (T.kind === 'solar') shadowOfMoon(); else earthShadow.visible = true;
        if (atBack) SB.red = 1;
        const ok = T.kind === 'solar' ? atSun : atBack;
        if (ok) {
          c.querySelector('.chk').disabled = true; sl.disabled = true;
          ctx.say(T.kind === 'solar' ? spot : moonB, T.good, 'good wide', 0.5);
          shell.msg('Вярно!', 'good');
          T.next();
          return;
        }
        mistakes++;
        let what;
        if (T.kind === 'solar') what = atBack ? 'Луната е в сянката на Земята и почервеня. Това е <b>лунно</b> затъмнение, а търсим слънчево.' : 'Сянката на Луната <b>не пада върху Земята</b>. От Земята Слънцето се вижда цяло.';
        else what = atSun ? 'Сянката на Луната пада върху Земята. Това е <b>слънчево</b> затъмнение, а търсим лунно.' : 'Луната е <b>извън сянката на Земята</b>. Слънцето я осветява и тя свети както винаги.';
        ctx.say(atSun && T.kind !== 'solar' ? spot : moonB, what, 'bad wide', 0.5);
        if (atSun && T.kind !== 'solar') shadowOfMoon();
        shell.msg(`Не е тук. Виж сцената.${mistakes >= 2 ? ' ' + T.hint : ''}`, 'bad');
      });
    }
    place({
      kind: 'solar', phi: 0,
      task: 'Нареди Луната така, че да има слънчево затъмнение. Натисни „Провери“.',
      hint: 'Подсказка: Луната трябва да е точно между Слънцето и Земята.',
      good: '<b>Слънчево затъмнение.</b> Луната закрива Слънцето. Сянката ѝ пада върху малка част от Земята. Там денем за няколко минути става тъмно. <b>Никога не гледай Слънцето с очи без специални очила!</b>',
      next: () => nextBtn(ctx, 'Още едно затъмнение →', () => place({
        kind: 'lunar', phi: 180,
        task: 'Сега нареди Луната така, че да има лунно затъмнение. Натисни „Провери“.',
        hint: 'Подсказка: Земята трябва да е точно между Слънцето и Луната.',
        good: '<b>Лунно затъмнение.</b> Луната е в сянката на Земята. Малко светлина се пречупва през въздуха около Земята и Луната става тъмночервена.',
        next: () => { ctx.answer = null; nextBtn(ctx, 'Последен въпрос →', why); },
      })),
    });
    function why() {
      ctx.clearTip();
      hideAll();
      moonOrbit.rotation.x = 0.2;
      SB.phi = 20; placeB();
      shell.task('<p>Новолуние и пълнолуние има всеки месец, а затъмненията са рядкост.</p><p class="small">Наклонът на лунната орбита в сцената е преувеличен. Истинският е около 5°.</p>');
      choice(ctx, {
        q: 'Защо не всеки месец има затъмнение?',
        options: [
          { t: 'Орбитата на Луната е малко наклонена и Луната обикновено минава над или под линията Слънце – Земя.', ok: true, why: 'Вярно! Затъмнение има само когато трите тела са точно на една линия.' },
          { t: 'Защото Луната свети сама и прогонва сянката.', ok: false, why: 'Луната не свети сама — само отразява светлината на Слънцето.' },
          { t: 'Защото Земята спира да се върти.', ok: false, why: 'Земята не спира. Погледни орбитата на Луната в сцената.' },
        ],
        hint: 'Виж как е наклонена орбитата на Луната.',
        mistakes,
        onRight: (m) => { ctx.scores[2] = stepScore(m, 3); finishBtn(ctx, onComplete, restart); },
      });
    }
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
