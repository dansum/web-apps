// 5.1.7 „Слънчевата система и звездите“ — Слънчевата система (не в мащаб), притеглянето и орбитите,
// сравнение на планетите, космонавтиката, нощното небе с Голямата и Малката мечка и Полярната звезда.
// Стъпки: опознай → притеглянето държи планетите → земна група и газови гиганти, космонавтика → звездите.
import { labelSprite, addHitBox, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, makeArrow, stepScore } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { earthTex, cloudsTex, rockyTex, bandsTex, ringTex, canvasTex, glowTex } from './solar.js';

// Не в мащаб: размерите и разстоянията са сбити, за да се вижда всичко.
const PLANETS = [
  { id: 'mercury', name: 'Меркурий', r: 0.2, d: 3.0, w: 1.6, tex: () => rockyTex('#9b958d', '#5f5a55', 31, 90), giant: 0 },
  { id: 'venus', name: 'Венера', r: 0.3, d: 4.0, w: 1.2, tex: () => bandsTex(['#e8cf8f', '#d9b874', '#f0dca8', '#cfae6a'], 32), giant: 0 },
  { id: 'earth', name: 'Земята', r: 0.32, d: 5.3, w: 1.0, tex: earthTex, giant: 0 },
  { id: 'mars', name: 'Марс', r: 0.25, d: 6.6, w: 0.8, tex: () => rockyTex('#c1562c', '#7a2f17', 34, 60), giant: 0 },
  { id: 'jupiter', name: 'Юпитер', r: 0.9, d: 9.0, w: 0.45, tex: () => bandsTex(['#d8b48a', '#c4936a', '#efdcc0', '#a97852', '#e6c9a2'], 35), giant: 1 },
  { id: 'saturn', name: 'Сатурн', r: 0.75, d: 11.6, w: 0.33, tex: () => bandsTex(['#e7d3a1', '#d6bd84', '#f0e2bc', '#c9ad72'], 36), giant: 1 },
  { id: 'uranus', name: 'Уран', r: 0.5, d: 13.6, w: 0.24, tex: () => bandsTex(['#9fe0e6', '#a9e6ea', '#93d6de'], 37), giant: 1 },
  { id: 'neptune', name: 'Нептун', r: 0.48, d: 15.4, w: 0.19, tex: () => bandsTex(['#3f63d6', '#3557c4', '#4b74e6', '#2c49a8'], 38), giant: 1 },
];
// Звезди около Северния полюс на небето: ректасцензия (часове), деклинация (°), звездна величина.
const SKY = [
  ['dubhe', 'Дубхе', 11.062, 61.75, 1.8], ['merak', 'Мерак', 11.031, 56.38, 2.4], ['phecda', '', 11.897, 53.69, 2.4], ['megrez', '', 12.257, 57.03, 3.3],
  ['alioth', '', 12.900, 55.96, 1.8], ['mizar', '', 13.399, 54.93, 2.2], ['alkaid', '', 13.792, 49.31, 1.9],
  ['polaris', 'Полярната звезда', 2.530, 89.26, 2.0], ['yildun', '', 17.537, 86.59, 4.4], ['epsumi', '', 16.766, 82.04, 4.2], ['zetumi', '', 15.734, 77.79, 4.3],
  ['etaumi', '', 16.292, 75.76, 4.9], ['kochab', '', 14.845, 74.16, 2.1], ['pherkad', '', 15.346, 71.83, 3.0],
  ['caph', '', 0.153, 59.15, 2.3], ['schedar', '', 0.675, 56.54, 2.2], ['gcas', '', 0.945, 60.72, 2.2], ['ruchbah', '', 1.430, 60.24, 2.7], ['segin', '', 1.907, 63.67, 3.4],
];
const UMA = [['alkaid', 'mizar'], ['mizar', 'alioth'], ['alioth', 'megrez'], ['megrez', 'phecda'], ['phecda', 'merak'], ['merak', 'dubhe'], ['dubhe', 'megrez']];
const UMI = [['polaris', 'yildun'], ['yildun', 'epsumi'], ['epsumi', 'zetumi'], ['zetumi', 'kochab'], ['kochab', 'pherkad'], ['pherkad', 'etaumi'], ['etaumi', 'zetumi']];
const SK = 0.105;       // единици в сцената за 1° от небето
const ROT0 = 0;      // начално завъртане на небето

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Притеглянето', 'Планетите и полетите', 'Звездите'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0x050816, camPos: [0, 12, 18], target: [0, 0, 0], minDistance: 1.5, maxDistance: 45, maxPolarAngle: Math.PI * 0.8 } });
  const { shell, stage, scene } = ctx;
  stage.sun.intensity = 0; stage.hemi.intensity = 0.4; stage.hemi.color.set(0x8899cc); stage.hemi.groundColor.set(0x223355);
  const note = document.createElement('div');
  note.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:4;pointer-events:none;max-width:calc(100% - 16px);background:rgba(15,26,51,.88);color:#ffd54a;font-size:.78rem;border-radius:8px;padding:4px 8px';
  shell.stageEl.appendChild(note);
  const setNote = (t) => { note.textContent = t; note.hidden = !t; };
  const lbl = (t, size = 0.3) => labelSprite(t, { size, color: '#ffffff', bg: 'rgba(16,28,60,0.85)', border: '#6b7fb0' });

  // звезден фон
  const bgStars = (() => {
    const pos = [];
    for (let i = 0; i < 1400; i++) {
      const u = Math.random() * 2 - 1; const a = Math.random() * Math.PI * 2; const rr = 80 + Math.random() * 20; const s = Math.sqrt(1 - u * u);
      pos.push(Math.cos(a) * s * rr, u * rr, Math.sin(a) * s * rr);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 0.35, depthWrite: false }));
    p.raycast = () => {};
    scene.add(p);
    return p;
  })();

  // ---------- Слънчевата система ----------
  const sys = new THREE.Group(); scene.add(sys);
  const sunLight = new THREE.PointLight(0xfff3dd, 3.0, 0, 0); sys.add(sunLight);
  const sunG = new THREE.Group();
  {
    const tex = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#ffb21e'; c.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { c.fillStyle = i % 2 ? 'rgba(255,235,140,0.3)' : 'rgba(235,120,20,0.22)'; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, 7); c.fill(); } });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,240,180,0.9)'], [0.35, 'rgba(255,190,60,0.45)'], [1, 'rgba(255,120,0,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(7, 7, 1); glow.raycast = () => {};
    sunG.add(glow, new THREE.Mesh(new THREE.SphereGeometry(1.6, 36, 22), new THREE.MeshBasicMaterial({ map: tex })));
    const l = lbl('Слънцето'); l.position.y = -2.2; sunG.add(l); stage.steadyLabel(l, 18);
  }
  sunG.userData.pickId = 'sun';
  sys.add(sunG); addHitBox(sunG, 2);
  const planets = PLANETS.map((P, i) => {
    const ol = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 160 }, (_, k) => new THREE.Vector3(Math.cos(k / 160 * Math.PI * 2) * P.d, 0, -Math.sin(k / 160 * Math.PI * 2) * P.d))), new THREE.LineBasicMaterial({ color: 0x5b6f9c, transparent: true, opacity: 0.45 }));
    ol.raycast = () => {};
    sys.add(ol);
    const g = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(P.r, 32, 20), new THREE.MeshStandardMaterial({ map: P.tex(), roughness: 0.9 }));
    g.add(ball);
    if (P.id === 'earth') g.add(new THREE.Mesh(new THREE.SphereGeometry(P.r * 1.03, 24, 16), new THREE.MeshStandardMaterial({ map: cloudsTex(), transparent: true, depthWrite: false })));
    if (P.id === 'saturn') {
      const ring = new THREE.Mesh(new THREE.RingGeometry(P.r * 1.3, P.r * 2.2, 48), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      // текстурата на пръстена е по радиуса
      const uv = ring.geometry.attributes.uv; const pp = ring.geometry.attributes.position;
      for (let k = 0; k < uv.count; k++) { const rr = Math.hypot(pp.getX(k), pp.getY(k)); uv.setXY(k, (rr - P.r * 1.3) / (P.r * 0.9), 0.5); }
      ring.rotation.x = -Math.PI / 2 + 0.45;
      g.add(ring);
    }
    const l = lbl(P.name, 0.26); l.position.y = -P.r - 0.35; g.add(l); stage.steadyLabel(l, 14);
    g.userData.pickId = P.id;
    sys.add(g);
    addHitBox(g, 0.7);
    return { ...P, g, ang: i * 1.9 + 0.4 };
  });
  const earth = planets.find((p) => p.id === 'earth');
  // Луната и космическата станция около Земята
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshStandardMaterial({ map: rockyTex('#b8b6b0', '#6f6c66', 41, 60) }));
  earth.g.add(moon);
  const station = new THREE.Group();
  {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.015, 0.015), new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.6 }));
    const mod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xeceff1 }));
    mod.rotation.x = Math.PI / 2;
    station.add(truss, mod);
    for (const sx of [-0.12, -0.07, 0.07, 0.12]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.004, 0.14), new THREE.MeshStandardMaterial({ color: 0xc28a2c, emissive: 0x3a2800 }));
      p.position.x = sx; station.add(p);
    }
  }
  station.userData.pickId = 'station';
  earth.g.add(station);
  addHitBox(station, 0.25);
  // стрелки: притегляне (към Слънцето) и скорост (по допирателната)
  const pull = makeArrow(0xff7043, 0.05); const vel = makeArrow(0x4fc3f7, 0.05);
  pull.g.visible = vel.g.visible = false;
  sys.add(pull.g, vel.g);
  const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineDashedMaterial({ color: 0x4fc3f7, dashSize: 0.3, gapSize: 0.2 }));
  trail.visible = false; trail.raycast = () => {};
  sys.add(trail);
  const G = { on: true, free: null, speed: 1, arrows: false };

  // ---------- Нощното небе ----------
  const sky = new THREE.Group(); sky.visible = false; scene.add(sky);
  const SKYZ = -12; const POLE = new THREE.Vector3(0, 5.4, SKYZ);
  const skyRot = new THREE.Group(); skyRot.position.copy(POLE); sky.add(skyRot);
  {
    // хоризонт: хълмове и дървета
    const shape = new THREE.Shape(); shape.moveTo(-30, -6);
    for (let x = -30; x <= 30; x += 1.5) shape.lineTo(x, 0.4 + Math.sin(x * 0.35) * 0.5 + Math.sin(x * 0.11) * 0.8);
    shape.lineTo(30, -6); shape.closePath();
    const hills = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0x0b1020 }));
    hills.position.z = SKYZ + 2;
    sky.add(hills);
    for (const x of [-7, -5.8, 4.5, 6.2, 7.4]) {
      const tr = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 6), new THREE.MeshBasicMaterial({ color: 0x070b16 }));
      tr.position.set(x, 1.3 + Math.sin(x * 0.35) * 0.5, SKYZ + 2.1); sky.add(tr);
    }
    const n = lbl('Север', 0.32); n.position.set(0, 0.2, SKYZ + 2.2); sky.add(n);
  }
  const starTex = glowTex([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(230,240,255,0.85)'], [1, 'rgba(180,200,255,0)']]);
  const skyStars = {};
  for (const [id, name, ra, dec, mag] of SKY) {
    const r = (90 - dec) * SK; const a = ra * 15 * Math.PI / 180;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false }));
    const size = 0.75 * Math.pow(10, -(mag - 1.8) * 0.16);
    s.scale.set(size, size, 1);
    const g = new THREE.Group(); g.add(s);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); g.add(hit);
    g.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    g.userData.pickId = id === 'polaris' ? 'polaris' : 'star-' + id;
    g.userData.name = name;
    skyRot.add(g);
    skyStars[id] = g;
  }
  for (let i = 0; i < 160; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, opacity: 0.6 }));
    const z = 0.08 + Math.random() * 0.12; s.scale.set(z, z, 1);
    const r = Math.random() * 11; const a = Math.random() * Math.PI * 2;
    s.position.set(Math.cos(a) * r, Math.sin(a) * r, -0.1);
    s.raycast = () => {};
    skyRot.add(s);
  }
  const lineMat = new THREE.LineBasicMaterial({ color: 0x80cbc4, transparent: true, opacity: 0.8 });
  const figure = (pairs) => {
    const pts = []; pairs.forEach(([a, b]) => pts.push(skyStars[a].position.clone(), skyStars[b].position.clone()));
    const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
    l.raycast = () => {}; l.visible = false; skyRot.add(l); return l;
  };
  const umaLines = figure(UMA); const umiLines = figure(UMI);
  const pointer = new THREE.Line(new THREE.BufferGeometry().setFromPoints([skyStars.merak.position.clone(), skyStars.dubhe.position.clone().lerp(skyStars.polaris.position, 1.0)]), new THREE.LineDashedMaterial({ color: 0xffd54a, dashSize: 0.25, gapSize: 0.18 }));
  pointer.computeLineDistances(); pointer.visible = false; pointer.raycast = () => {};
  skyRot.add(pointer);
  const umaLbl = lbl('Голямата мечка', 0.3); const umiLbl = lbl('Малката мечка', 0.3);
  umaLbl.position.copy(skyStars.megrez.position).add(new THREE.Vector3(0, -0.9, 0.1)); umiLbl.position.copy(skyStars.zetumi.position).add(new THREE.Vector3(0, -0.6, 0.1));
  umaLbl.visible = umiLbl.visible = false;
  skyRot.add(umaLbl, umiLbl);
  const S = { skyRot: ROT0, spin: true };

  function showSystem() { sys.visible = true; sky.visible = false; bgStars.visible = true; sunLight.intensity = 3; setNote((shell.stageEl.clientWidth || 600) < 520 ? '⚠ Не е в мащаб' : '⚠ Не е в мащаб: планетите са много по-малки и много по-далеч една от друга.'); }
  function showSky() { sys.visible = false; sky.visible = true; bgStars.visible = false; sunLight.intensity = 0; setNote(''); }

  const tmp = new THREE.Vector3();
  stage.tick((dt, t) => {
    sunG.children[0].material.rotation = t * 0.05;
    for (const p of planets) {
      if (p === earth && G.free) continue;
      if (p === earth && !G.on) continue;
      p.ang += dt * 0.12 * p.w * G.speed;
      p.g.position.set(Math.cos(p.ang) * p.d, 0, -Math.sin(p.ang) * p.d);
      p.g.children[0].rotation.y += dt * 0.6;
    }
    if (G.free) {
      G.free.t += dt;
      earth.g.position.copy(G.free.p0).addScaledVector(G.free.v, G.free.t);
      trail.geometry.setFromPoints([G.free.p0, earth.g.position.clone()]);
      trail.computeLineDistances();
    }
    moon.position.set(Math.cos(t * 0.9) * 0.6, 0, -Math.sin(t * 0.9) * 0.6);
    station.position.set(Math.cos(t * 2.2) * 0.45, Math.sin(t * 2.2) * 0.15, -Math.sin(t * 2.2) * 0.45);
    station.rotation.y = t * 2.2;
    if (G.arrows) {
      const e = earth.g.position;
      pull.g.visible = !G.free; vel.g.visible = true;
      tmp.copy(e).negate().normalize();
      pull.g.position.copy(e); pull.g.rotation.set(0, Math.atan2(-tmp.z, tmp.x), 0); pull.set(1.3);
      const vdir = G.free ? G.free.v.clone().normalize() : new THREE.Vector3(-Math.sin(earth.ang), 0, -Math.cos(earth.ang));
      vel.g.position.copy(e); vel.g.rotation.set(0, Math.atan2(-vdir.z, vdir.x), 0); vel.set(1.3);
    } else { pull.g.visible = vel.g.visible = false; }
    if (S.spin) S.skyRot += dt * 0.03;
    skyRot.rotation.z = S.skyRot;
  });

  function resetGravity() {
    G.on = true; G.free = null; G.arrows = false; G.speed = 1; trail.visible = false;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    showSystem(); resetGravity();
    view(ctx, [0, 0, 0], 11, { halfH: 7, elev: 0.75 });
    const P = (id) => planets.find((p) => p.id === id).g;
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Слънчевата система: Слънцето, планетите и техните спътници. А какво има отвъд?</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        { id: 'sun', label: 'Слънцето', icon: '☀', note: 'Слънцето е <b>звезда</b> — огромно горещо кълбо от газове. То е в центъра на Слънчевата система и задържа планетите със своето притегляне.', obj: () => sunG, dist: 7, bubble: 2 },
        { id: 'earth', label: 'Земята и Луната', icon: '🌍', note: 'Земята е третата планета. Около нея обикаля нейният естествен спътник — <b>Луната</b>.', obj: () => P('earth'), dist: 2.4, bubble: 0.6 },
        { id: 'mars', label: 'Марс', icon: '🔴', note: 'Марс е планета от <b>земната група</b>: малка, с твърда каменна повърхност. Има два малки спътника.', obj: () => P('mars'), dist: 2.2, bubble: 0.5 },
        { id: 'jupiter', label: 'Юпитер', icon: '🟠', note: 'Юпитер е най-голямата планета — <b>газов гигант</b>. Няма твърда повърхност и има много спътници.', obj: () => P('jupiter'), dist: 4, bubble: 1.2 },
        { id: 'saturn', label: 'Сатурн', icon: '🪐', note: 'Сатурн е газов гигант с най-красивите пръстени. Те са от лед и камъчета.', obj: () => P('saturn'), dist: 4, bubble: 1.4 },
        { id: 'station', label: 'Космическа станция', icon: '🛰', note: '<b>Международната космическа станция</b> обикаля около Земята. В нея живеят и работят космонавти. Тя е изкуствен спътник — направена е от хората.', obj: () => P('earth'), dist: 1.8, bubble: 0.6 },
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Притеглянето ----------
  function step2() {
    shell.step(1);
    showSystem(); resetGravity();
    G.arrows = true;
    view(ctx, [0, 0, 0], 7, { halfH: 5, elev: 1.1 });
    ctx.say(earth.g, '<b>Оранжевата</b> стрелка: Слънцето притегля Земята. <b>Синята</b>: накъде се движи Земята в този миг.', 'wide', 0.6);
    shell.task('<p>Земята се движи бързо, а Слънцето непрекъснато я притегля към себе си. Затова Земята обикаля в кръг.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Какво ще стане със Земята, ако Слънцето изведнъж спре да я притегля?',
      options: [
        { t: 'Ще продължи по права линия и ще отлети далеч от Слънцето.', ok: true, why: 'Да проверим! Изключи притеглянето.' },
        { t: 'Ще падне върху Слънцето.', ok: false, why: 'Падането към Слънцето се дължи точно на притеглянето. Ако го няма?' },
        { t: 'Ще продължи да обикаля по същата орбита.', ok: false, why: 'Какво я кара да завива, ако нищо не я дърпа към Слънцето?' },
      ],
      hint: 'Гледай синята стрелка: натам се движи Земята.',
      onRight: (m) => { mistakes = m; off(); },
    });
    function off() {
      const c = shell.controls;
      c.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary off">✋ Изключи притеглянето</button></div>');
      c.querySelector('.off').addEventListener('click', () => {
        c.querySelector('.off').disabled = true;
        ctx.clearTip();
        const p0 = earth.g.position.clone();
        const v = new THREE.Vector3(-Math.sin(earth.ang), 0, -Math.cos(earth.ang)).multiplyScalar(0.12 * earth.w * earth.d * 1.5);
        G.free = { p0, v, t: 0 };
        trail.visible = true;
        setTimeout(() => {
          ctx.say(earth.g, 'Без притегляне Земята продължава <b>по права линия</b> и се отдалечава от Слънцето.', 'wide', 0.6);
          const cc = shell.setControls('<div class="row"><button class="btn back">↺ Върни притеглянето</button></div>');
          cc.querySelector('.back').addEventListener('click', () => {
            ctx.clearTip();
            G.free = null; trail.visible = false;
            earth.g.position.set(Math.cos(earth.ang) * earth.d, 0, -Math.sin(earth.ang) * earth.d);
            moonQ();
          }, { once: true });
        }, 3500);
      }, { once: true });
    }
    function moonQ() {
      G.arrows = false;
      view(ctx, [earth.g.position.x, 0, earth.g.position.z], 1.6, { halfH: 1.2, elev: 0.6 });
      ctx.say(earth.g, 'Около Земята обикалят Луната и изкуствените спътници.', 'wide', 0.6);
      choice(ctx, {
        q: 'Коя сила задържа Луната и космическата станция по орбитите им около Земята?',
        options: [
          { t: 'Притеглянето на Земята (гравитацията)', ok: true, why: 'Вярно! Земята притегля Луната и спътниците, както Слънцето притегля планетите.' },
          { t: 'Силата на вятъра', ok: false, why: 'В космоса няма въздух, значи няма и вятър.' },
          { t: 'Магнитът на Луната', ok: false, why: 'Луната не е магнит. Каква сила задържа Земята около Слънцето?' },
        ],
        hint: 'Същата сила, която те кара да падаш, когато скочиш.',
        mistakes,
        onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
      });
    }
  }

  // ---------- 3. Планетите и полетите ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    showSystem(); resetGravity();
    view(ctx, [0, 0, 0], 11, { halfH: 7, elev: 0.75 });
    shell.task('<p>Планетите са два вида: <b>земна група</b> — малки, с твърда каменна повърхност, и <b>газови гиганти</b> — огромни, без твърда повърхност, с много спътници и с пръстени.</p><p class="small">Уран и Нептун са по-малки от Юпитер и Сатурн. Учените често ги наричат <b>ледени гиганти</b>.</p>');
    const focus = (p) => () => { stage.focusOn(p.g, { dist: Math.max(2.2, p.r * 5), height: 0.8, lift: 0.1, keepFollow: true }); ctx.say(p.g, p.name, 'tag', p.r + 0.3); };
    sortTask(ctx, {
      bins: ['Земна група', 'Газов гигант'],
      items: planets.map((p) => ({ t: p.name, bin: p.giant ? 1 : 0, show: focus(p), why: p.giant ? `${p.name} е газов гигант.` : `${p.name} е от земната група.` })),
      hint: 'Сравни размера: газовите гиганти са много по-големи от Земята.',
      onDone: (m) => {
        ctx.clearTip(); stage.stopFollow();
        view(ctx, [0, 0, 0], 11, { halfH: 7, elev: 0.75 });
        shell.task('<p>Хората изследват космоса с <b>изкуствени спътници</b>, <b>космически сонди</b> (апарати без хора, които летят до други планети) и <b>космически станции</b>.</p><p class="small">Сондата „Вояджър 1“ е изстреляна през 1977 г. Тя е снимала отблизо Юпитер и Сатурн. Днес е най-далечният апарат, направен от хората.</p>');
        orderTask(ctx, {
          q: 'Подреди събитията по реда, в който са се случили.',
          items: ['Първият изкуствен спътник на Земята', 'Юрий Гагарин — първият човек в космоса', 'Първите хора стъпват на Луната', 'Георги Иванов — първият българин в космоса', 'Започва строежът на Международната космическа станция'],
          hint: 'Първо е полетял апарат без хора, после човек.',
          mistakes: m,
          onDone: (m2) => {
            ctx.say(sunG, '1957 — първият спътник · 1961 — Гагарин · 1969 — хора на Луната · 1979 — Георги Иванов · 1998 — първият модул на МКС', 'wide', 2.2);
            ctx.scores[1] = stepScore(m2, 3);
            nextBtn(ctx, 'Към звездите →', step4);
          },
        });
      },
    });
  }

  // ---------- 4. Звездите ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    showSky();
    S.spin = true; S.skyRot = ROT0;
    umaLines.visible = true; umaLbl.visible = true; umiLines.visible = false; umiLbl.visible = false; pointer.visible = false;
    view(ctx, [0, 4.3, SKYZ], 5.6, { halfH: 4.5, elev: 0.02 });
    shell.task('<p>Ясна нощ, гледаме на <b>север</b>. Свързани с линии са седемте ярки звезди от съзвездието <b>Голямата мечка</b>. Те образуват <b>Голямата кола</b>.</p><p><b>Намери Полярната звезда:</b> продължи линията през двете крайни звезди на „кофата“ около 5 пъти и кликни звездата.</p>');
    shell.setControls('<div class="row"><button class="btn tip">💡 Покажи линията</button></div>').querySelector('.tip').addEventListener('click', () => { pointer.visible = true; }, { once: true });
    let mistakes = 0;
    ctx.click = (id) => {
      if (!id) return;
      if (id !== 'polaris') {
        mistakes++;
        shell.msg(`Не е тази звезда.${mistakes >= 2 ? ' Подсказка: натисни „Покажи линията“ и следвай жълтата линия.' : ' Продължи линията от кофата нагоре.'}`, 'bad');
        if (mistakes >= 2) pointer.visible = true;
        return;
      }
      ctx.click = null;
      pointer.visible = true; umiLines.visible = true; umiLbl.visible = true;
      ctx.say(skyStars.polaris, '✔ <b>Полярната звезда</b> е в края на опашката на <b>Малката мечка</b>. Тя е почти точно над Северния полюс и показва посоката <b>север</b>. Цялото небе бавно се върти около нея.', 'good wide', 0.3);
      shell.setControls('');
      setTimeout(() => facts(), 1500);
    };
    function facts() {
      choice(ctx, {
        q: 'Кое твърдение е вярно?',
        options: [
          { t: 'Слънцето е една от милиардите звезди в галактиката Млечен път, а във Вселената има много галактики.', ok: true, why: 'Вярно! Светлата ивица, която виждаме нощем далеч от градовете, е част от нашата галактика.' },
          { t: 'Слънцето е най-голямата звезда във Вселената.', ok: false, why: 'Много звезди са по-големи от Слънцето. Слънцето ни изглежда голямо, защото е близо.' },
          { t: 'Вселената се състои само от Слънчевата система.', ok: false, why: 'Всяка звезда на небето е далечно слънце. Само нашата галактика има милиарди звезди.' },
        ],
        hint: 'Слънцето е обикновена звезда, която е близо до нас.',
        mistakes,
        onRight: (m) => { mistakes = m; nextBtn(ctx, 'Последен въпрос →', far); },
      });
    }
    function far() {
      ctx.clearTip();
      choice(ctx, {
        q: 'Защо звездите ни изглеждат като малки точки, макар че много от тях са по-големи от Слънцето?',
        options: [
          { t: 'Защото са много по-далеч от нас, отколкото Слънцето.', ok: true, why: 'Вярно! Светлината от Слънцето стига до нас за около 8 минути, а от най-близката друга звезда — за повече от 4 години.' },
          { t: 'Защото са малки колкото лампички.', ok: false, why: 'Звездите са огромни кълба от горещ газ, като Слънцето. Какво ги прави да изглеждат малки?' },
          { t: 'Защото светят само нощем.', ok: false, why: 'Звездите светят и денем, но Слънцето ги заслепява. Въпросът е защо са толкова малки.' },
        ],
        hint: 'Колкото по-далеч е един предмет, толкова по-малък изглежда.',
        mistakes,
        onRight: (m) => { ctx.scores[2] = stepScore(m, 3); finishBtn(ctx, onComplete, restart); },
      });
    }
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    step1();
  }
  step1();
  return { dispose() { note.remove(); stage.dispose(); } };
}
