// 4.1.1 „Свойства на веществата около нас“ — лабораторна маса с пет станции за опити.
// Стъпки: опознай станциите → направи опитите (таблицата се попълва) → подреди веществата → приложи наученото.
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;

// Станции и пробите за всяка. yes — веществото има свойството; cell — какво се записва в таблицата.
const STATIONS = [
  { id: 'magnet', label: 'Магнит', icon: '🧲', prop: 'Магнит', words: ['Да', 'Не'],
    note: '<b>Магнит.</b> Магнитът привлича желязото и предметите от желязо. Ще проверим кои вещества се привличат от магнит.',
    samples: [
      { id: 'm-nail', kind: 'nail', name: 'Пирон', yes: true, say: 'Пиронът полепна по магнита! Желязото <b>се привлича</b> от магнит.' },
      { id: 'm-wood', kind: 'wood', name: 'Дърво', yes: false, say: 'Дървото <b>не се привлича</b> от магнит.' },
      { id: 'm-cap', kind: 'cap', name: 'Пластмаса', yes: false, say: 'Пластмасата <b>не се привлича</b> от магнит.' },
      { id: 'm-foil', kind: 'foil', name: 'Алуминий', yes: false, say: 'Алуминиевото фолио <b>не се привлича</b>! Алуминият е метал, но не всички метали се привличат от магнит.' },
    ],
    q: 'Кое се привлече от магнита?', a: ['Железният пирон', 'Алуминиевото фолио', 'Всички метали'], right: 0,
    why: ['', 'Алуминият е метал, но не се привлече. Погледни таблицата.', 'Не всички — алуминиевото фолио не се привлече.'] },
  { id: 'water', label: 'Чаши с вода', icon: '🥛', prop: 'Разтваря се', words: ['Да', 'Не'],
    note: '<b>Чаши с вода.</b> Ще сипем във водата захар, сол, пясък и олио и ще разбъркаме. Разтваря ли се веществото — „изчезва“ ли във водата?',
    samples: [
      { id: 'w-sugar', kind: 'sugar', name: 'Захар', yes: true, say: 'Захарта <b>се разтвори</b> — вече не се вижда, но водата е сладка.' },
      { id: 'w-salt', kind: 'salt', name: 'Сол', yes: true, say: 'Солта <b>се разтвори</b> — не се вижда, но водата е солена.' },
      { id: 'w-sand', kind: 'sand', name: 'Пясък', yes: false, say: 'Пясъкът <b>не се разтваря</b> — песъчинките паднаха на дъното.' },
      { id: 'w-oil', kind: 'oil', name: 'Олио', yes: false, say: 'Олиото <b>не се разтваря</b> във вода. То изплува отгоре като жълт слой, защото е по-леко от водата.' },
    ],
    q: 'Кои вещества се разтвориха във водата?', a: ['Захарта и солта', 'Пясъкът и олиото', 'Всички'], right: 0,
    why: ['', 'Пясъкът падна на дъното, а олиото изплува отгоре. Те не се разтварят.', 'Не всички — погледни чашите с пясъка и олиото.'] },
  { id: 'tank', label: 'Аквариум', icon: '🐟', prop: 'Във вода', words: ['Плава', 'Потъва'],
    note: '<b>Аквариум с вода.</b> Ще проверим кои предмети плават и кои потъват. Предметите от вещества, по-леки от водата, плават. Тези от по-тежки от водата вещества потъват.',
    samples: [
      { id: 't-wood', kind: 'wood', name: 'Дърво', yes: true, say: 'Дървото <b>плава</b> — то е по-леко от водата.' },
      { id: 't-cap', kind: 'cap', name: 'Пластмаса', yes: true, say: 'Пластмасовата капачка <b>плава</b> — тази пластмаса е по-лека от водата.' },
      { id: 't-stone', kind: 'stone', name: 'Камък', yes: false, say: 'Камъкът <b>потъва</b> — той е по-тежък от водата.' },
      { id: 't-nail', kind: 'nail', name: 'Желязо', yes: false, say: 'Железният пирон <b>потъва</b> — желязото е по-тежко от водата.' },
    ],
    q: 'Кои предмети потънаха?', a: ['Дървото и капачката', 'Камъкът и пиронът', 'Всички'], right: 1,
    why: ['Дървото и капачката останаха на повърхността — те плават.', '', 'Не всички — дървото и капачката плават.'] },
  { id: 'heat', label: 'Чаша горещ чай', icon: '☕', prop: 'Топлина', words: ['Добре', 'Слабо'],
    note: '<b>Чаша горещ чай.</b> В нея ще сложим метална, дървена и пластмасова лъжица. Коя ще се затопли чак до дръжката? Така проверяваме кое вещество <b>провежда топлина</b>.',
    samples: [
      { id: 'h-metal', kind: 'spoonM', name: 'Метал', yes: true, say: 'Металната лъжица се затопли чак до дръжката! Металът <b>провежда добре топлина</b>.' },
      { id: 'h-wood', kind: 'spoonW', name: 'Дърво', yes: false, say: 'Дръжката на дървената лъжица остана хладна. Дървото <b>провежда слабо топлина</b>.' },
      { id: 'h-plastic', kind: 'spoonP', name: 'Пластмаса', yes: false, say: 'Дръжката на пластмасовата лъжица остана хладна. Пластмасата <b>провежда слабо топлина</b>.' },
    ],
    q: 'Коя лъжица провежда добре топлина?', a: ['Металната', 'Дървената', 'Пластмасовата'], right: 0,
    why: ['', 'Дръжката на дървената лъжица остана хладна.', 'Дръжката на пластмасовата лъжица остана хладна.'] },
  { id: 'fire', label: 'Свещ', icon: '🕯️', prop: 'Гори ли?', words: ['Гори', 'Не гори'],
    note: '<b>Свещ.</b> ⚠️ Опити с огън се правят <b>само от възрастен</b>! Тук ще видим безопасно на екрана кои вещества горят. Предметите се държат с метална щипка.',
    samples: [
      { id: 'f-paper', kind: 'paper', name: 'Хартия', yes: true, say: 'Хартията <b>гори</b> — от нея остава само пепел.' },
      { id: 'f-stick', kind: 'stick', name: 'Дърво', yes: true, say: 'Дървената клечка <b>гори</b>.' },
      { id: 'f-nail', kind: 'nail', name: 'Желязо', yes: false, say: 'Желязото <b>не гори</b> в пламъка на свещта — само се нагрява и опушва.' },
      { id: 'f-stone', kind: 'stone', name: 'Камък', yes: false, say: 'Камъкът <b>не гори</b>.' },
    ],
    q: 'Кои вещества горят?', a: ['Хартията и дървото', 'Желязото и камъкът', 'Всички'], right: 0,
    why: ['', 'Пиронът и камъкът не се запалиха.', 'Не всички — пиронът и камъкът не се запалиха.'] },
];
const ST = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
const SAMPLE = {};
for (const s of STATIONS) for (const p of s.samples) SAMPLE[p.id] = { ...p, st: s.id };

// Стъпка 3: подреждане по свойство (с нови вещества).
const ROUNDS = [
  { title: 'Привлича ли се от магнит?', icon: '🧲', zones: ['Привлича се', 'Не се привлича'],
    hint: 'От магнит се привличат само желязото и предметите от желязо.',
    items: [
      ['clip', 'Кламер', 0, 'Кламерът е от желязо — магнитът го привлича.'],
      ['bolt', 'Железен болт', 0, 'Болтът е от желязо — магнитът го привлича.'],
      ['filings', 'Железни стърготини', 0, 'Стърготините са от желязо — магнитът ги привлича.'],
      ['marble', 'Стъклено топче', 1, 'Стъклото не се привлича от магнит.'],
      ['eraser', 'Гумичка', 1, 'Гумата не се привлича от магнит.'],
      ['can', 'Алуминиева кутийка', 1, 'Кутийката е от алуминий. Той е метал, но не се привлича от магнит.'],
    ] },
  { title: 'Разтваря ли се във вода?', icon: '💧', zones: ['Разтваря се', 'Не се разтваря'],
    hint: 'Разтвореното вещество „изчезва“ във водата — не се вижда, не пада на дъното и не плава отгоре.',
    items: [
      ['sugar', 'Захар', 0, 'Захарта се разтваря — водата става сладка.'],
      ['salt', 'Сол', 0, 'Солта се разтваря — водата става солена.'],
      ['coffee', 'Разтворимо кафе', 0, 'Разтворимото кафе се разтваря и оцветява водата.'],
      ['sand', 'Пясък', 1, 'Пясъкът не се разтваря — пада на дъното.'],
      ['oil', 'Олио', 1, 'Олиото не се разтваря — плава отгоре.'],
      ['flour', 'Брашно', 1, 'Брашното не се разтваря — водата става мътна и брашното се утаява.'],
    ] },
  { title: 'Плава или потъва?', icon: '🌊', zones: ['Плава', 'Потъва'],
    hint: 'Плават предметите, които са по-леки от водата. Потъват тези, които са по-тежки от нея.',
    items: [
      ['cork', 'Корк', 0, 'Коркът е много лек — плава.'],
      ['apple', 'Ябълка', 0, 'Ябълката плава — в нея има въздух.'],
      ['ice', 'Лед', 0, 'Ледът е по-лек от водата — плава. Затова айсбергите се носят по морето.'],
      ['stone', 'Камък', 1, 'Камъкът е по-тежък от водата — потъва.'],
      ['coin', 'Метална монета', 1, 'Металът е по-тежък от водата — монетата потъва.'],
      ['marble', 'Стъклено топче', 1, 'Стъклото е по-тежко от водата — топчето потъва.'],
    ] },
];

function injectStyle() {
  if (document.getElementById('properties-style')) return;
  const s = document.createElement('style');
  s.id = 'properties-style';
  s.textContent = `
  .properties-q { margin:10px 0 4px; font-weight:700; }
  .properties-list { margin:6px 0 0; padding-left:20px; } .properties-list li { margin:2px 0; }
  .properties-list li.done { color:#0d7a3a; } .properties-list li.done::marker { content:"✓ "; font-weight:900; }
  .properties-tbl { width:100%; border-collapse:collapse; font-size:.76rem; margin-top:6px; }
  .properties-tbl td { border-bottom:1px solid #e3e8ef; padding:2px 3px; vertical-align:top; }
  .properties-tbl b.y { color:#0d7a3a; } .properties-tbl b.n { color:#b3261e; }
  .properties-safe { background:#fff4e5; border:1px solid #ffb74d; border-radius:8px; padding:6px 8px; font-size:.88rem; margin-top:6px; }
  `;
  document.head.appendChild(s);
}

// ---------- помощни модели (от „Смеси и разделяне“) ----------
function glassMat(opacity = 0.26) {
  return new THREE.MeshStandardMaterial({ color: 0xe6f4ff, transparent: true, opacity, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
}
function liquidMat(color, opacity = 0.82) {
  return new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.2, depthWrite: false });
}
function lathe(pts, m, seg = 28) {
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), m);
}
function gridTexture({ size = 128, cells = 16, line = 'rgba(70,75,85,1)', bg = 'rgba(0,0,0,0)', lw = 2 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, size, size);
  x.strokeStyle = line; x.lineWidth = lw;
  for (let i = 0; i <= cells; i++) {
    const p = (i / cells) * size;
    x.beginPath(); x.moveTo(p, 0); x.lineTo(p, size); x.stroke();
    x.beginPath(); x.moveTo(0, p); x.lineTo(size, p); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let puffTex = null;
function puffSprite(color, opacity, size) {
  if (!puffTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    puffTex = new THREE.CanvasTexture(c);
    puffTex.colorSpace = THREE.SRGBColorSpace;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color, transparent: true, opacity, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}
const metalM = () => mat(0xc9d1d8, { metalness: 0.8, roughness: 0.3 });
const ironM = () => mat(0x7d858d, { metalness: 0.7, roughness: 0.45 });

// Модели на веществата. Всеки стои с дъното си на y = 0; userData.h — височина.
const HEAP = { sugar: 0xffffff, salt: 0xeef2f5, sand: 0xd9b77a, coffee: 0x5d3a1a, flour: 0xfaf6ee, filings: 0x4b5157 };
function itemModel(kind) {
  const g = new THREE.Group();
  let h = 0.2;
  const add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m; };
  if (kind === 'nail' || kind === 'bolt') {
    const shaft = add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 8), ironM()), 0, 0.04, 0);
    shaft.rotation.z = Math.PI / 2;
    const head = add(new THREE.Mesh(new THREE.CylinderGeometry(kind === 'bolt' ? 0.07 : 0.055, kind === 'bolt' ? 0.07 : 0.055, 0.03, kind === 'bolt' ? 6 : 12), ironM()), -0.21, 0.04, 0);
    head.rotation.z = Math.PI / 2;
    if (kind === 'nail') { const tip = add(new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 8), ironM()), 0.24, 0.04, 0); tip.rotation.z = -Math.PI / 2; }
    h = 0.1;
  } else if (kind === 'wood') {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.24), mat(0xc8955a)), 0, 0.1, 0);
    for (let i = 0; i < 3; i++) add(new THREE.Mesh(new THREE.BoxGeometry(0.362, 0.01, 0.01), mat(0xa06a35)), 0, 0.04 + i * 0.06, 0.121);
    h = 0.2;
  } else if (kind === 'cap') {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 20), mat(0x1e88e5, { roughness: 0.4 })), 0, 0.05, 0);
    h = 0.1;
  } else if (kind === 'foil') {
    add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), mat(0xdfe5ea, { metalness: 0.8, roughness: 0.25, flat: true })), 0, 0.13, 0);
    h = 0.26;
  } else if (HEAP[kind] !== undefined) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.05, 20), mat(kind === 'filings' ? 0xe0e0e0 : 0x90caf9, { roughness: 0.4 })), 0, 0.025, 0);
    const heap = add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(HEAP[kind], { flat: true, roughness: 0.95 })), 0, 0.05, 0);
    heap.scale.y = 0.6;
    g.userData.heap = heap;
    h = 0.15;
  } else if (kind === 'oil') {
    add(lathe([[0, 0], [0.11, 0], [0.11, 0.26], [0.05, 0.34], [0.04, 0.4], [0, 0.4]], liquidMat(0xf2c12e, 0.85)), 0, 0, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 10), mat(0xc62828)), 0, 0.42, 0);
    h = 0.45;
  } else if (kind === 'stone') {
    const s = add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), mat(0x8f8a84, { flat: true })), 0, 0.1, 0);
    s.scale.set(1.2, 0.7, 1);
    h = 0.2;
  } else if (kind === 'spoonM' || kind === 'spoonW' || kind === 'spoonP') {
    // Лъжица по оста y: гребло долу, дръжка от 6 части (за да се вижда как топлината пълзи нагоре).
    const col = { spoonM: 0xc9d1d8, spoonW: 0xc8955a, spoonP: 0x42a5f5 }[kind];
    const m = (c) => (kind === 'spoonM' ? mat(c, { metalness: 0.75, roughness: 0.3 }) : mat(c, { roughness: 0.6 }));
    const spoon = new THREE.Group();
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), m(col));
    bowl.scale.set(0.8, 1.25, 0.4);
    spoon.add(bowl);
    const segs = [];
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(kind === 'spoonW' ? 0.05 : 0.04, 0.12, 0.025), m(col));
      s.position.y = 0.13 + i * 0.12;
      s.userData.base = s.material.color.clone();
      spoon.add(s);
      segs.push(s);
    }
    spoon.rotation.z = -Math.PI / 2;
    spoon.position.set(-0.38, 0.04, 0);
    g.add(spoon);
    g.userData.spoon = spoon;
    g.userData.segs = segs;
    h = 0.08;
  } else if (kind === 'paper') {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.01, 0.24), mat(0xfafafa)), 0, 0.005, 0);
    h = 0.02;
  } else if (kind === 'stick') {
    const st = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), mat(0xd7b07a)), 0, 0.02, 0);
    st.rotation.z = Math.PI / 2;
    h = 0.04;
  } else if (kind === 'clip') {
    const t = add(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 20), ironM()), 0, 0.012, 0);
    t.rotation.x = Math.PI / 2;
    t.scale.set(1.6, 1, 1);
    h = 0.03;
  } else if (kind === 'marble') {
    add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.7, roughness: 0.05 })), 0, 0.1, 0);
    h = 0.2;
  } else if (kind === 'eraser') {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.14), mat(0xf48fb1)), 0, 0.04, 0);
    h = 0.08;
  } else if (kind === 'can') {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.36, 18), mat(0xe53935, { metalness: 0.5, roughness: 0.3 })), 0, 0.18, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.02, 18), metalM()), 0, 0.37, 0);
    h = 0.38;
  } else if (kind === 'cork') {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.24, 16), mat(0xc79a62, { roughness: 1 })), 0, 0.12, 0);
    h = 0.24;
  } else if (kind === 'apple') {
    add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(0xd32f2f, { roughness: 0.5 })), 0, 0.16, 0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 5), mat(0x5d4037)), 0, 0.34, 0);
    const leaf = add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat(0x43a047)), 0.04, 0.35, 0);
    leaf.scale.set(1.6, 0.4, 0.8);
    h = 0.36;
  } else if (kind === 'ice') {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.8, roughness: 0.05 })), 0, 0.11, 0);
    h = 0.22;
  } else if (kind === 'coin') {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.025, 22), mat(0xd4af37, { metalness: 0.8, roughness: 0.3 })), 0, 0.013, 0);
    h = 0.03;
  }
  g.traverse((o) => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
  g.userData.h = h;
  return g;
}

// ---------- преживяване ----------
export function mount(container, opts) {
  injectStyle();
  let inst = null;
  const restart = () => { inst.dispose(); inst = build(container, opts, restart); };
  inst = build(container, opts, restart);
  return { dispose() { inst.dispose(); } };
}

function build(container, { onComplete }, restart) {
  const STEPS = ['Опознай лабораторията', 'Направи опитите', 'Подреди веществата', 'Приложи наученото'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xe9eef3, camPos: [0, 5.2, 9], target: [0, 0.6, 0.2], shadows: true, maxDistance: 20, minDistance: 2,
    maxPolarAngle: Math.PI * 0.44,
  });
  const { scene, camera } = stage;
  stage.controls.minAzimuthAngle = -1.0;
  stage.controls.maxAzimuthAngle = 1.0;
  const narrow = camera.aspect < 1.15;
  const narrowUI = () => stage.renderer.domElement.clientWidth < 480;

  // Реално време: анимациите траят еднакво и на бавен компютър.
  let rdt = 0.016;
  let lastNow = performance.now();
  stage.tick(() => { const n = performance.now(); rdt = Math.min(0.25, Math.max(0.001, (n - lastNow) / 1000)); lastNow = n; });
  const phase = (dur, fn) => new Promise((res) => {
    let k = 0;
    const stop = stage.tick((dt, t) => {
      k = Math.min(1, k + rdt / dur);
      if (fn) fn(k, rdt, t);
      if (k >= 1) { stop(); res(); }
    });
  });
  const wait = (sec) => phase(sec);
  async function hop(g, to, dur = 0.6, height = 0.6) {
    const from = g.position.clone();
    await phase(dur, (k) => {
      g.position.lerpVectors(from, to, ease(k));
      g.position.y += Math.sin(k * Math.PI) * height;
    });
  }

  const BENCH_W = narrow ? 6.8 : 13.6;
  const SPOS = narrow
    ? { magnet: [-2.3, -1.45], water: [-0.25, -1.45], tank: [2.05, -1.45], heat: [-1.3, 0.75], fire: [1.3, 0.75] }
    : { magnet: [-4.8, -0.9], water: [-2.45, -0.9], tank: [0.1, -0.9], heat: [2.6, -0.9], fire: [4.7, -0.9] };

  // ---------- стая (от „Смеси и разделяне“) ----------
  const bench = new THREE.Mesh(new THREE.BoxGeometry(BENCH_W, 0.3, 5.4), mat(0x37474f, { roughness: 0.6 }));
  bench.position.set(0, -0.15, 0.3);
  bench.receiveShadow = true;
  scene.add(bench);
  const benchEdge = new THREE.Mesh(new THREE.BoxGeometry(BENCH_W + 0.1, 0.08, 0.1), mat(0x263238));
  benchEdge.position.set(0, -0.04, 3.0);
  scene.add(benchEdge);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(BENCH_W - 0.4, 2.6, 5), mat(0xdfe6ec));
  cab.position.set(0, -1.6, 0.3);
  scene.add(cab);
  const nDoors = narrow ? 3 : 6;
  for (let i = 0; i < nDoors; i++) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(BENCH_W / nDoors - 0.25, 2.2, 0.04), mat(0xcfd8e0));
    door.position.set(-BENCH_W / 2 + 0.2 + (i + 0.5) * ((BENCH_W - 0.4) / nDoors), -1.6, 2.82);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0x90a4ae, { metalness: 0.6 }));
    knob.position.set(0, 0.7, 0.04);
    door.add(knob);
    scene.add(door);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat(0xb9c4cc));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.9;
  scene.add(floor);
  const tileTex = gridTexture({ size: 256, cells: 4, line: 'rgba(180,192,204,1)', bg: '#f4f7f9', lw: 4 });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(12, 4);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.9 }));
  wall.position.set(0, 3, -2.6);
  scene.add(wall);
  const win = new THREE.Group();
  win.add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), new THREE.MeshBasicMaterial({ color: 0xcfeaff })));
  for (const [w, h, x, y] of [[2.4, 0.1, 0, 0.95], [2.4, 0.1, 0, -0.95], [0.1, 2, -1.15, 0], [0.1, 2, 1.15, 0], [0.06, 1.8, 0, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), mat(0xffffff));
    f.position.set(x, y, 0.03);
    win.add(f);
  }
  win.position.set(narrow ? -4.2 : -5.4, 3.0, -2.58);
  scene.add(win);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.5), mat(0x8d6e63));
  shelf.position.set(narrow ? 4.0 : 5.0, 2.7, -2.3);
  scene.add(shelf);
  const bottleCols = [0x8bc34a, 0x42a5f5, 0xffb74d];
  for (let i = 0; i < 3; i++) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.45, 14), new THREE.MeshStandardMaterial({ color: bottleCols[i], transparent: true, opacity: 0.75, roughness: 0.2 }));
    body.position.set(shelf.position.x - 0.9 + i * 0.6, 2.97, -2.3);
    scene.add(body);
  }
  const flask = new THREE.Group();
  const fl = lathe([[0, 0], [0.18, 0.02], [0.28, 0.16], [0.27, 0.32], [0.08, 0.5], [0.07, 0.75]], glassMat(0.3));
  fl.renderOrder = 3;
  flask.add(fl, lathe([[0, 0.01], [0.17, 0.03], [0.26, 0.16], [0.25, 0.28], [0, 0.28]], liquidMat(0x7ad9a6, 0.75)));
  flask.position.set(shelf.position.x + 0.95, 2.74, -2.25);
  scene.add(flask);
  const fbub = [];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    b.userData.ph = i / 6;
    flask.add(b);
    fbub.push(b);
  }
  const clock = new THREE.Group();
  clock.add(new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), mat(0xffffff)));
  const rimC = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.04, 8, 32), mat(0x37474f));
  clock.add(rimC);
  const hand = (len, w, c) => {
    const p = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.01), mat(c));
    m.position.y = len / 2 - 0.04;
    p.add(m);
    p.position.z = 0.02;
    clock.add(p);
    return p;
  };
  const hM = hand(0.3, 0.03, 0x263238); const hS = hand(0.33, 0.012, 0xd32f2f);
  clock.position.set(narrow ? 3.4 : 3.6, 4.0, -2.57);
  scene.add(clock);

  // ---------- дъска с таблицата ----------
  const bc = document.createElement('canvas');
  bc.width = 1100; bc.height = 560;
  const bx = bc.getContext('2d');
  const btex = new THREE.CanvasTexture(bc);
  btex.colorSpace = THREE.SRGBColorSpace;
  btex.anisotropy = 4;
  const BW = narrow ? 4.4 : 4.8;
  const BH = BW * (560 / 1100);
  const board = new THREE.Group();
  const bface = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: btex }));
  bface.position.z = 0.03;
  const bframe = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.14, BH + 0.14, 0.05), mat(0x8d6e63));
  board.add(bframe, bface);
  board.position.set(0, narrow ? 2.85 : 2.75, -2.55);
  scene.add(board);
  const results = {};
  function drawBoard() {
    const c = bx;
    c.fillStyle = '#25443a'; c.fillRect(0, 0, 1100, 560);
    c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2;
    c.textBaseline = 'middle';
    STATIONS.forEach((s, r) => {
      const y0 = 8 + r * 110;
      c.font = 'bold 34px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
      c.fillStyle = '#fff8e1';
      c.fillText(`${s.icon} ${s.prop}`, 14, y0 + 52);
      s.samples.forEach((p, i) => {
        const x = 300 + i * 200;
        const v = results[p.id];
        c.font = '28px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.fillText(p.name, x, y0 + 32);
        c.font = (v === undefined ? '' : 'bold ') + '30px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
        c.fillStyle = v === undefined ? 'rgba(255,255,255,0.35)' : v ? '#a5f3b5' : '#ffb4a8';
        c.fillText(v === undefined ? '?' : s.words[v ? 0 : 1], x, y0 + 72);
      });
      if (r < STATIONS.length - 1) { c.beginPath(); c.moveTo(8, y0 + 106); c.lineTo(1092, y0 + 106); c.stroke(); }
    });
    btex.needsUpdate = true;
  }
  drawBoard();
  function tableHTML() {
    if (!narrowUI()) return '';
    return `<table class="properties-tbl">${STATIONS.map((s) => `<tr><td>${s.icon}</td>${s.samples.map((p) => {
      const v = results[p.id];
      return `<td>${esc(p.name)}<br>${v === undefined ? '?' : `<b class="${v ? 'y' : 'n'}">${esc(s.words[v ? 0 : 1])}</b>`}</td>`;
    }).join('')}</tr>`).join('')}</table>`;
  }

  // ---------- станциите ----------
  const stations = {};
  const anchorTop = {};
  function placeStation(id, g, top) {
    const [x, z] = SPOS[id];
    g.position.set(x, 0, z);
    g.userData.pickId = id;
    g.traverse((o) => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
    addHitBox(g, 1.0);
    const lbl = labelSprite(ST[id].label, { size: 0.2, color: '#ffffff', bg: 'rgba(38,50,56,0.85)', border: 'rgba(38,50,56,0.85)' });
    lbl.position.set(0, top + 0.25, 0);
    g.add(lbl);
    stage.steadyLabel(lbl, 9);
    anchorTop[id] = top + 0.55;
    scene.add(g);
    stations[id] = g;
  }

  // --- магнит на стойка ---
  const MAG = { REST: 1.35, plateY: 0.06 };
  const magG = new THREE.Group();
  const magnet = new THREE.Group();
  {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 28), mat(0xeef3f7, { roughness: 0.3 }));
    plate.position.y = 0.025;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.3), mat(0x455a64));
    base.position.set(-0.6, 0.03, -0.2);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 8), metalM());
    rod.position.set(-0.6, 0.95, -0.2);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8), metalM());
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-0.3, 1.85, -0.2);
    magG.add(plate, base, rod, arm);
    const red = mat(0xd8312a, { roughness: 0.4 });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.065, 10, 24, Math.PI), red);
    magnet.add(arc);
    for (const x of [-0.17, 0.17]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.26, 0.13), red);
      l.position.set(x, -0.13, 0);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.13), mat(0xd7dde2, { metalness: 0.7, roughness: 0.3 }));
      tip.position.set(x, -0.3, 0);
      magnet.add(l, tip);
    }
    const nL = labelSprite('N', { size: 0.1, color: '#fff', bg: '#d8312a', border: '#d8312a' });
    nL.position.set(-0.17, -0.12, 0.08);
    const sL = labelSprite('S', { size: 0.1, color: '#fff', bg: '#1865f2', border: '#1865f2' });
    sL.position.set(0.17, -0.12, 0.08);
    magnet.add(nL, sL);
    const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 4), mat(0x333333));
    thread.raycast = () => {};
    magG.add(thread);
    magG.userData.thread = thread;
    magnet.position.y = MAG.REST;
    magG.add(magnet);
  }
  placeStation('magnet', magG, 1.95);

  // --- четири чаши с вода ---
  const waterG = new THREE.Group();
  const WG = { r: 0.2, h: 0.62, water: 0.48, dx: narrow ? 0.46 : 0.5 };
  const cups = [];
  for (let i = 0; i < 4; i++) {
    const cup = new THREE.Group();
    const wallC = lathe([[0, 0], [WG.r, 0], [WG.r, WG.h], [WG.r - 0.015, WG.h], [WG.r - 0.015, 0.02], [0, 0.02]], glassMat(0.3), 24);
    wallC.renderOrder = 3;
    const w = new THREE.Mesh(new THREE.CylinderGeometry(WG.r - 0.02, WG.r - 0.02, WG.water - 0.02, 24), liquidMat(0x9fd3f5, 0.4));
    w.position.y = 0.02 + (WG.water - 0.02) / 2;
    w.renderOrder = 1;
    cup.add(wallC, w);
    cup.position.x = (i - 1.5) * WG.dx;
    cup.userData = { water: w, grains: [], oil: null };
    waterG.add(cup);
    cups.push(cup);
  }
  const stirrer = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), glassMat(0.6));
  stirrer.visible = false;
  waterG.add(stirrer);
  placeStation('water', waterG, WG.h);

  // --- аквариум (от „Плътност“) ---
  const TK = { w: narrow ? 1.7 : 2.1, d: 1.0, h: 1.2, floor: 0.12, water: 1.0 };
  const tankG = new THREE.Group();
  const fishes = [];
  const tbub = [];
  const plants = [];
  const tankSurf = new THREE.Mesh(new THREE.PlaneGeometry(TK.w - 0.06, TK.d - 0.06, 16, 6), liquidMat(0x5fb4e6, 0.45));
  {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(TK.w, TK.h, TK.d), glassMat(0.16));
    glass.position.y = TK.h / 2;
    glass.renderOrder = 3;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: 0x7f97a8 }));
    edges.position.copy(glass.position);
    edges.raycast = () => {};
    const body = new THREE.Mesh(new THREE.BoxGeometry(TK.w - 0.06, TK.water - 0.04, TK.d - 0.06), liquidMat(0x5fb4e6, 0.26));
    body.position.y = (TK.water + 0.04) / 2;
    body.renderOrder = 1;
    const gravel = new THREE.Mesh(new THREE.BoxGeometry(TK.w - 0.06, TK.floor, TK.d - 0.06), mat(0xc2a878, { flat: true }));
    gravel.position.y = TK.floor / 2;
    tankSurf.rotation.x = -Math.PI / 2;
    tankSurf.position.y = TK.water;
    tankSurf.renderOrder = 2;
    tankG.add(glass, edges, body, gravel, tankSurf);
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Group();
      const hgt = 0.4 + (i % 2) * 0.25;
      for (let k = 0; k < 3; k++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.035, hgt, 5), mat(0x2e9d4f, { flat: true }));
        leaf.position.set((k - 1) * 0.04, hgt / 2, 0);
        leaf.rotation.z = (k - 1) * 0.2;
        p.add(leaf);
      }
      p.position.set(-TK.w / 2 + 0.2 + i * ((TK.w - 0.4) / 3), TK.floor, -TK.d / 2 + 0.15);
      p.userData.ph = i;
      tankG.add(p);
      plants.push(p);
    }
    for (let i = 0; i < 2; i++) {
      const f = new THREE.Group();
      const col = [0xff8a3d, 0xffd54f][i];
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), mat(col));
      b.scale.set(1.5, 0.9, 0.55);
      const tail = new THREE.Group();
      const tl = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.11, 4), mat(col));
      tl.rotation.z = Math.PI / 2;
      tl.position.x = -0.05;
      tail.add(tl);
      tail.position.x = -0.11;
      f.add(b, tail);
      f.userData = { tail, ph: i * 2.5, r: i * 0.18 };
      tankG.add(f);
      fishes.push(f);
    }
    for (let i = 0; i < 7; i++) {
      const bb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
      bb.userData.ph = i / 7;
      tankG.add(bb);
      tbub.push(bb);
    }
  }
  placeStation('tank', tankG, TK.h);

  // --- чаша горещ чай ---
  const heatG = new THREE.Group();
  const steam = [];
  {
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.04, 28), mat(0xffffff, { roughness: 0.35 }));
    saucer.position.y = 0.02;
    const cupW = lathe([[0, 0.04], [0.26, 0.04], [0.36, 0.2], [0.38, 0.5], [0.36, 0.5], [0.34, 0.22], [0.25, 0.07], [0, 0.07]], mat(0xfff8f0, { roughness: 0.35, side: THREE.DoubleSide }));
    const tea = new THREE.Mesh(new THREE.CircleGeometry(0.355, 28), mat(0x8d4e1d, { roughness: 0.2 }));
    tea.rotation.x = -Math.PI / 2;
    tea.position.y = 0.42;
    const handleC = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16, Math.PI * 1.3), mat(0xfff8f0));
    handleC.position.set(-0.44, 0.3, 0);
    handleC.rotation.z = Math.PI * 0.35;
    heatG.add(saucer, cupW, tea, handleC);
    for (let i = 0; i < 10; i++) {
      const p = puffSprite(0xffffff, 0, 0.2);
      p.userData.k = i / 10;
      p.userData.sx = Math.sin(i * 2.4) * 0.15;
      heatG.add(p);
      steam.push(p);
    }
  }
  placeStation('heat', heatG, 0.9);

  // --- свещ ---
  const fireG = new THREE.Group();
  const flame = new THREE.Group();
  {
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.05, 28), metalM());
    dish.position.y = 0.025;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 18), mat(0xfff3d6, { roughness: 0.7 }));
    candle.position.y = 0.3;
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 5), mat(0x222222));
    wick.position.y = 0.58;
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 12), new THREE.MeshBasicMaterial({ color: 0xffa726, transparent: true, opacity: 0.9 }));
    outer.position.y = 0.12;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 10), new THREE.MeshBasicMaterial({ color: 0xfff59d }));
    inner.position.y = 0.07;
    flame.add(outer, inner);
    flame.position.y = 0.6;
    const glow = puffSprite(0xffcc80, 0.45, 0.6);
    glow.position.y = 0.72;
    fireG.add(dish, candle, wick, flame, glow);
    const warn = labelSprite('⚠ Само с възрастен!', { size: 0.17, color: '#7a3d00', bg: 'rgba(255,236,179,0.95)', border: '#ffb74d' });
    warn.position.set(0, -0.12, 0.55);
    fireG.add(warn);
    stage.steadyLabel(warn, 9);
  }
  const tongs = new THREE.Group();
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.025, 0.025), metalM());
    arm.position.set(0.45, 0.02 * s + 0.12, 0.0);
    arm.rotation.z = 0.25 + s * 0.04;
    tongs.add(arm);
  }
  tongs.visible = false;
  fireG.add(tongs);
  const fireOn = new THREE.Group();
  {
    const o = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 12), new THREE.MeshBasicMaterial({ color: 0xff7043, transparent: true, opacity: 0.85 }));
    o.position.y = 0.17;
    const i2 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 10), new THREE.MeshBasicMaterial({ color: 0xffeb3b }));
    i2.position.y = 0.1;
    fireOn.add(o, i2);
  }
  fireOn.visible = false;
  fireG.add(fireOn);
  const ashes = new THREE.Group();
  fireG.add(ashes);
  placeStation('fire', fireG, 0.95);

  // ---------- пробите ----------
  const sampleRoots = new Map();
  for (const s of STATIONS) {
    const [sx, sz] = SPOS[s.id];
    const n = s.samples.length;
    s.samples.forEach((p, i) => {
      const g = itemModel(p.kind);
      g.position.set(sx + (i - (n - 1) / 2) * (narrow ? 0.5 : 0.55), 0, sz + (narrow ? 1.05 : 1.45));
      if (p.kind.startsWith('spoon')) g.rotation.y = -Math.PI / 2 + 0.3;
      g.userData.home = g.position.clone();
      g.userData.homeRot = g.rotation.clone();
      g.userData.pickId = p.id;
      const lbl = labelSprite(p.name, { size: 0.15 });
      lbl.position.y = g.userData.h + 0.17;
      g.add(lbl);
      stage.steadyLabel(lbl, 8);
      g.userData.label = lbl;
      addHitBox(g, 0.45);
      g.visible = false;
      scene.add(g);
      sampleRoots.set(p.id, g);
    });
  }

  // ---------- оживяване ----------
  const floating = [];
  const stuck = [];
  let magBob = true;
  stage.tick((dt, t) => {
    for (const b of fbub) {
      const k = (t * 0.45 + b.userData.ph) % 1;
      b.position.set(Math.sin(b.userData.ph * 20 + t) * 0.08 * (1 - k), 0.05 + k * 0.24, Math.cos(b.userData.ph * 13) * 0.08);
      b.scale.setScalar(0.6 + k);
    }
    const now = new Date();
    hS.rotation.z = -((now.getSeconds() + now.getMilliseconds() / 1000) / 60) * Math.PI * 2;
    hM.rotation.z = -((now.getMinutes() + now.getSeconds() / 60) / 60) * Math.PI * 2;
    // аквариум
    const pos = tankSurf.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 3 + t * 1.6) * 0.01 + Math.cos(pos.getY(i) * 4 + t * 1.2) * 0.008);
    pos.needsUpdate = true;
    for (const f of fishes) {
      const u = f.userData;
      const a = t * 0.4 + u.ph;
      f.position.set(Math.cos(a) * (TK.w / 2 - 0.35), 0.4 + u.r + Math.sin(t * 0.8 + u.ph) * 0.06, Math.sin(a * 2) * 0.15);
      f.rotation.y = Math.atan2(-Math.cos(a * 2) * 0.3, -Math.sin(a) * (TK.w / 2 - 0.35));
      u.tail.rotation.y = Math.sin(t * 9 + u.ph) * 0.5;
    }
    for (const b of tbub) {
      const c = (t * 0.4 + b.userData.ph) % 1;
      b.position.set(TK.w / 2 - 0.2 + Math.sin(c * 12 + b.userData.ph * 9) * 0.03, TK.floor + 0.05 + c * (TK.water - TK.floor - 0.07), -TK.d / 2 + 0.2);
    }
    for (const p of plants) p.rotation.z = Math.sin(t * 0.9 + p.userData.ph) * 0.08;
    for (const g of floating) { g.position.y = g.userData.floatY + Math.sin(t * 1.5 + g.position.x * 4) * 0.015; g.rotation.z = Math.sin(t * 1.2 + g.position.x * 5) * 0.05; }
    // пара от чая
    for (const p of steam) {
      const u = p.userData;
      u.k = (u.k + dt * 0.25) % 1;
      p.position.set(u.sx + Math.sin(t + u.sx * 20) * 0.05, 0.45 + u.k * 0.9, Math.cos(u.sx * 30) * 0.08);
      p.scale.setScalar(0.12 + u.k * 0.4);
      p.material.opacity = 0.55 * Math.min(1, u.k * 5) * (1 - u.k);
    }
    // пламък
    const fl1 = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.05;
    flame.scale.set(1, fl1, 1);
    flame.rotation.z = Math.sin(t * 3.1) * 0.06;
    if (fireOn.visible) { fireOn.scale.set(1, 1 + Math.sin(t * 15) * 0.15, 1); fireOn.rotation.z = Math.sin(t * 4) * 0.1; }
    // магнитът леко се полюшва
    if (magBob) magnet.position.y = MAG.REST + Math.sin(t * 1.4) * 0.025;
    for (const g of stuck) g.position.y = magnet.position.y + g.userData.stuck;
    magnet.rotation.z = magBob ? Math.sin(t * 0.9) * 0.04 : 0;
    const th = magG.userData.thread;
    const top = 1.85;
    const mtop = magnet.position.y + 0.24;
    th.position.set(0, (top + mtop) / 2, 0);
    th.scale.y = Math.max(0.01, top - mtop);
  });

  // ---------- изглед и балончета ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.5, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.06;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, dur);
  }
  const overview = (dur) => (narrow ? fitView([0, 0.9, 0.0], 3.4, 2.6, 0.55, dur) : fitView([0, 1.0, 0.2], 6.0, 2.4, 0.42, dur));
  const stationView = (id) => {
    const [x, z] = SPOS[id];
    if (narrow) fitView([x, 0.7, z + 0.6], 1.9, 1.5, 0.55);
    else fitView([x, 0.75, z + 0.7], 2.0, 1.3, 0.5);
  };
  let tip = null;
  function say(anchor, html, cls = '', lift = 0.5) {
    if (tip) tip.remove();
    if (narrowUI()) cls = cls.replace('wide', '');
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const sayAt = (id, html, cls = '') => say(stations[id], html, cls, anchorTop[id]);

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  stage.onHover(() => {});

  function choiceBox(c, q, items, rightIdx, why, onRight, onWrong) {
    c.innerHTML = `<p class="properties-q">${esc(q)}</p><div class="choices">${items.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
    c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i !== rightIdx) {
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(why[i] || 'Не е това. Помисли пак.', 'bad');
        if (onWrong) onWrong();
        return;
      }
      b.classList.add('right');
      c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      onRight();
    }));
  }

  // ---------- 1. Опознай ----------
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Станции',
    items: STATIONS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });
  function step1() {
    shell.step(0);
    const seen = new Set();
    shell.task(`<p>На масата има пет <b>станции за опити</b>. С тях ще проверим свойствата на веществата: привличат ли се от магнит, разтварят ли се във вода, плават ли, провеждат ли топлина, горят ли.</p>
      <p><b>Разгледай всички станции:</b> кликни върху тях или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата маса</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${STATIONS.length}`);
    upd();
    const visit = (id) => {
      const s = ST[id];
      stationView(id);
      sayAt(id, `<b>${esc(s.icon)} ${esc(s.label)}</b><br>${s.note}`, 'wide');
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size === STATIONS.length) { next.disabled = false; shell.msg('Разгледа всички станции! Продължи напред.', 'good'); }
    };
    clickHandler = (id) => { if (!id || !ST[id]) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Опити ----------
  let busy = false;
  async function runSample(pid) {
    const p = SAMPLE[pid];
    const g = sampleRoots.get(pid);
    const st = stations[p.st];
    st.updateMatrixWorld(true);
    const local = (x, y, z) => st.localToWorld(new V3(x, y, z));
    g.userData.label.visible = false;
    if (p.st === 'magnet') {
      await hop(g, local(0, MAG.plateY, 0), 0.6, 0.5);
      magBob = false;
      const y0 = magnet.position.y;
      const low = MAG.plateY + g.userData.h + 0.36;
      await phase(0.7, (k) => { magnet.position.y = lerp(y0, low, ease(k)); });
      if (p.yes) {
        const from = g.position.clone();
        await phase(0.25, (k) => { g.position.y = from.y + (low - 0.34 - g.userData.h - from.y) * k * k; });
        const off = g.position.y - magnet.position.y;
        await phase(0.8, (k) => { magnet.position.y = lerp(low, MAG.REST, ease(k)); g.position.y = magnet.position.y + off + st.position.y; });
        g.userData.stuck = off;
        stuck.push(g);
      } else {
        await wait(0.3);
        await phase(0.8, (k) => { magnet.position.y = lerp(low, MAG.REST, ease(k)); });
      }
      magBob = true;
      if (!p.yes) await hop(g, g.userData.home, 0.5, 0.4);
    } else if (p.st === 'water') {
      const idx = ST.water.samples.findIndex((s) => s.id === pid);
      const cup = cups[idx];
      const cw = cup.getWorldPosition(new V3());
      await hop(g, new V3(cw.x - 0.18, WG.h + 0.18, cw.z), 0.6, 0.4);
      await phase(0.35, (k) => { g.rotation.z = -1.2 * k; });
      if (p.kind === 'oil') {
        const layer = new THREE.Mesh(new THREE.CylinderGeometry(WG.r - 0.025, WG.r - 0.025, 1, 22), liquidMat(0xf2c12e, 0.85));
        layer.position.y = WG.water + 0.005;
        layer.scale.y = 0.001;
        cup.add(layer);
        cup.userData.oil = layer;
        const drops = [];
        for (let i = 0; i < 6; i++) {
          const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), liquidMat(0xf2c12e, 0.9));
          d.position.set((Math.random() - 0.5) * 0.15, WG.water + 0.25, (Math.random() - 0.5) * 0.15);
          cup.add(d);
          drops.push(d);
        }
        await phase(0.9, (k) => { drops.forEach((d, i) => { const kk = Math.min(1, Math.max(0, k * 1.6 - i * 0.1)); d.position.y = WG.water + 0.25 - kk * 0.4 + Math.max(0, kk - 0.6) * 0.5; }); });
        await phase(0.9, (k) => { layer.scale.y = 0.05 * k; drops.forEach((d) => { d.position.y = lerp(d.position.y, WG.water + 0.01, k); d.scale.setScalar(1 - k); }); });
        drops.forEach((d) => { cup.remove(d); d.geometry.dispose(); d.material.dispose(); });
      } else {
        if (g.userData.heap) g.userData.heap.visible = false;
        const col = HEAP[p.kind];
        const grains = [];
        for (let i = 0; i < 16; i++) {
          const gr = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.022), mat(col, { roughness: 0.8 }));
          gr.position.set((Math.random() - 0.5) * 0.1, WG.h + 0.1 + Math.random() * 0.1, (Math.random() - 0.5) * 0.1);
          gr.userData = { vy: 0, fx: (Math.random() - 0.5) * 0.26, fz: (Math.random() - 0.5) * 0.26, delay: i * 0.03 };
          cup.add(gr);
          grains.push(gr);
        }
        cup.userData.grains = grains;
        await phase(1.0, (k) => {
          for (const gr of grains) {
            const kk = Math.min(1, Math.max(0, (k - gr.userData.delay) / 0.6));
            gr.position.y = lerp(WG.h + 0.15, 0.04 + Math.random() * 0.005, kk * kk);
            gr.position.x = lerp(gr.position.x, gr.userData.fx, kk * 0.1);
            gr.position.z = lerp(gr.position.z, gr.userData.fz, kk * 0.1);
          }
        });
      }
      await phase(0.3, (k) => { g.rotation.z = -1.2 * (1 - k); });
      hop(g, g.userData.home, 0.5, 0.4);
      // разбъркване
      stirrer.visible = true;
      const cl = cup.position;
      await phase(1.8, (k, d, t) => {
        stirrer.position.set(cl.x + Math.cos(t * 9) * 0.08, 0.42, cl.z + Math.sin(t * 9) * 0.08);
        stirrer.rotation.set(Math.sin(t * 9) * 0.15, 0, Math.cos(t * 9) * 0.15);
        for (const gr of cup.userData.grains) {
          if (p.yes) gr.scale.setScalar(Math.max(0.001, 1 - k * 1.1));
          else gr.position.y = 0.035 + Math.abs(Math.sin(t * 9 + gr.position.x * 40)) * 0.03 * (1 - k);
        }
      });
      stirrer.visible = false;
      if (p.yes) for (const gr of cup.userData.grains) gr.visible = false;
      return { anchor: cup, lift: WG.h + 0.3 };
    } else if (p.st === 'tank') {
      const idx = ST.tank.samples.findIndex((s) => s.id === pid);
      const xl = (idx - 1.5) * (TK.w / 4.6);
      const above = local(xl, TK.h + 0.45, 0.05);
      await hop(g, above, 0.6, 0.4);
      const yTarget = p.yes ? TK.water - g.userData.h * 0.45 : TK.floor + 0.01;
      const from = g.position.y;
      const to = st.position.y + yTarget;
      await phase(p.yes ? 0.9 : 1.4, (k) => {
        if (p.yes) g.position.y = lerp(from, to, ease(k)) - Math.sin(k * Math.PI) * 0.12;
        else g.position.y = lerp(from, to, k < 0.3 ? k * k * 3.3 * 0.3 / 0.3 : 0.3 + (k - 0.3) / 0.7 * 0.7);
      });
      g.position.y = to;
      if (p.yes) { g.userData.floatY = to; floating.push(g); }
      return { anchor: stations.tank, lift: TK.h + 0.3 };
    } else if (p.st === 'heat') {
      const idx = ST.heat.samples.findIndex((s) => s.id === pid);
      const spoon = g.userData.spoon;
      const ang = [-0.9, 0, 0.9][idx];
      await hop(g, local(Math.cos(ang) * 0.12, 0.85, Math.sin(ang) * 0.12), 0.6, 0.4);
      // лъжицата застава в чашата с греблото надолу
      await phase(0.4, () => {});
      spoon.rotation.set(0, 0, 0);
      spoon.position.set(0, -0.6, 0);
      g.rotation.set(0, -ang, 0.35);
      await phase(0.5, (k) => { g.position.y = st.position.y + lerp(0.85, 0.75, k); });
      const segs = g.userData.segs;
      const hot = new THREE.Color(0xff5a2a);
      await phase(3.2, (k) => {
        segs.forEach((s, i) => {
          const reach = p.yes ? k * 7 - i : (i === 0 ? k * 0.5 : 0);
          s.material.color.copy(s.userData.base).lerp(hot, Math.max(0, Math.min(1, reach)) * (p.yes ? 0.85 : 0.35));
        });
      });
      return { anchor: g, lift: 0.4 };
    } else if (p.st === 'fire') {
      const flameTop = local(0, 0.9, 0);
      tongs.visible = true;
      tongs.position.set(0.15, 0.9, 0);
      const wpos = g.getWorldPosition(new V3());
      fireG.attach(g);
      g.position.copy(fireG.worldToLocal(wpos));
      await hop(g, new V3(0, 0.9, 0), 0.7, 0.4);
      tongs.position.set(0.15, 0.9 + g.userData.h / 2, 0);
      void flameTop;
      await wait(0.8);
      const meshes = [];
      g.traverse((o) => { if (o.isMesh && !o.userData.isHitBox) meshes.push(o); });
      if (p.yes) {
        fireOn.visible = true;
        fireOn.position.set(0, 0.92, 0);
        const black = new THREE.Color(0x222222);
        await phase(2.4, (k) => {
          meshes.forEach((m) => m.material.color && m.material.color.lerp(black, 0.04));
          g.scale.setScalar(Math.max(0.05, 1 - k * 0.9));
          fireOn.scale.multiplyScalar(1);
        });
        fireOn.visible = false;
        g.visible = false;
        const ash = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x6d6d6d, { flat: true }));
        ash.scale.y = 0.5;
        ash.position.set(0.28 - ashes.children.length * 0.12, 0.05, 0.22);
        ashes.add(ash);
      } else {
        const soot = new THREE.Color(0x3a3a3a);
        await phase(2.2, (k) => { if (p.kind === 'nail') meshes.forEach((m) => m.material.color && m.material.color.lerp(soot, 0.01)); });
        scene.attach(g);
        await hop(g, g.userData.home, 0.6, 0.4);
      }
      tongs.visible = false;
      return { anchor: stations.fire, lift: 1.25 };
    }
    return { anchor: p.st === 'magnet' ? stations.magnet : g, lift: p.st === 'magnet' ? 2.1 : 0.5 };
  }

  function step2() {
    shell.step(1);
    clearTip();
    menu.setItems(STATIONS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })));
    menu.setTitle('Опити');
    let mistakes = 0;
    const doneSt = new Set();
    let cur = null;
    const total = Object.keys(SAMPLE).length;
    const upd = () => shell.score(`Попълнени клетки: ${Object.keys(results).length} от ${total} · грешки: ${mistakes}`);
    const intro = () => {
      shell.task(`<p>Направи опитите на всяка станция. Резултатите се записват в <b>таблицата на стената</b>.</p>
        <p><b>Избери станция</b> от менюто или кликни върху нея.</p>
        <ol class="properties-list">${STATIONS.map((s) => `<li class="${doneSt.has(s.id) ? 'done' : ''}">${s.icon} ${esc(s.label)}</li>`).join('')}</ol>${tableHTML()}`);
      shell.setControls('');
      upd();
    };
    const stationTask = (id) => {
      const s = ST[id];
      shell.task(`<p><b>${esc(s.icon)} ${esc(s.label)}</b></p><p>Пред станцията има ${s.samples.length} проби. <b>Кликни върху всяка</b>, за да направиш опита.</p>
        ${id === 'fire' ? '<p class="properties-safe">⚠️ Опити с огън се правят <b>само от възрастен</b>, далеч от лесно запалими неща. Предметът се държи с метална щипка, не с ръка.</p>' : ''}${tableHTML()}`);
    };
    const openStation = (id) => {
      if (busy) return;
      if (doneSt.has(id)) { sayAt(id, `<b>${esc(ST[id].label)}</b> — опитите тук са готови ✓`, 'good'); return; }
      cur = id;
      menu.setActive(id);
      for (const [pid, g] of sampleRoots) {
        const sp = SAMPLE[pid];
        // Пробите на тази станция се виждат; от другите остават само следите от опита (в аквариума, в чая, на магнита).
        if (sp.st === id) g.visible = !(sp.st === 'fire' && sp.yes && g.userData.used);
        else g.visible = !!g.userData.used && (sp.st === 'tank' || sp.st === 'heat' || (sp.st === 'magnet' && sp.yes));
      }
      stationView(id);
      clearTip();
      shell.msg('');
      stationTask(id);
      upd();
    };
    const finishStation = (id) => {
      const s = ST[id];
      clickHandler = null;
      const box = shell.setControls('<div class="properties-ask"></div>').querySelector('.properties-ask');
      choiceBox(box, s.q, s.a, s.right, s.why, () => {
        doneSt.add(id);
        menu.mark(id);
        shell.msg('Вярно!', 'good');
        clickHandler = onClick;
        cur = null;
        if (doneSt.size === STATIONS.length) {
          scores.push(stepScore(mistakes, 3));
          clickHandler = null;
          menu.show(false);
          overview();
          clearTip();
          shell.task(`<p>Таблицата е попълнена! ${mistakes ? `Грешки: ${mistakes}.` : 'Без нито една грешка! 🎉'}</p>${tableHTML()}`);
          const c = shell.setControls('<button class="btn primary">Напред →</button>');
          c.querySelector('button').addEventListener('click', step3);
        } else {
          const c = shell.setControls('<button class="btn primary">Към друга станция</button>');
          c.querySelector('button').addEventListener('click', () => { clearTip(); shell.msg(''); intro(); overview(); });
        }
      }, () => { mistakes++; upd(); });
    };
    const onClick = async (id) => {
      if (!id || busy) return;
      if (ST[id]) { openStation(id); return; }
      const p = SAMPLE[id];
      if (!p || p.st !== cur) return;
      const g = sampleRoots.get(id);
      if (g.userData.used) return;
      busy = true;
      clearTip();
      const res = await runSample(id);
      g.userData.used = true;
      results[id] = p.yes;
      drawBoard();
      say(res.anchor, `<b>${esc(p.name)}</b>: ${p.say}`, 'wide ' + (p.yes ? 'good' : ''), res.lift);
      upd();
      if (narrowUI()) stationTask(cur);
      busy = false;
      if (ST[cur].samples.every((x) => results[x.id] !== undefined)) finishStation(cur);
    };
    clickHandler = onClick;
    menuHandler = (id) => onClick(id);
    menu.show(true);
    intro();
    overview();
  }

  // ---------- 3. Подреди ----------
  const sortGroup = new THREE.Group();
  sortGroup.visible = false;
  scene.add(sortGroup);
  const ZX = narrow ? 1.45 : 2.3;
  const ZZ = narrow ? 1.35 : 1.3;
  const zones = [0x1fab54, 0xe07a10].map((col, i) => {
    const z = zoneRing(col, narrow ? 1.05 : 1.25);
    z.position.set(i ? ZX : -ZX, 0, ZZ);
    const lbl = labelSprite('—', { size: 0.26 });
    lbl.position.set(0, 0.3, narrow ? 1.1 : 1.3);
    z.add(lbl);
    z.userData.lbl = lbl;
    sortGroup.add(z);
    return z;
  });
  const moving = new Map();
  stage.tick(() => {
    for (const [g, mv] of moving) {
      mv.k = Math.min(1, mv.k + rdt / mv.dur);
      const e = 1 - Math.pow(1 - mv.k, 3);
      g.position.lerpVectors(mv.from, mv.to, e);
      g.position.y = mv.to.y + Math.sin(e * Math.PI) * 0.4;
      if (mv.k >= 1) { moving.delete(g); g.position.copy(mv.to); }
    }
  });
  const moveTo = (g, to, dur = 0.45) => moving.set(g, { from: g.position.clone(), to: to.clone(), k: 0, dur });
  let stopDrag = null;

  function step3() {
    shell.step(2);
    clearTip();
    for (const id of Object.keys(stations)) stations[id].visible = false;
    for (const g of sampleRoots.values()) g.visible = false;
    sortGroup.visible = true;
    if (narrow) fitView([0, 0.3, 0.4], 2.8, 2.0, 0.85); else fitView([0, 0.3, 0.4], 4.5, 2.1, 0.8);
    let mistakes = 0;
    let ri = 0;
    let items = [];
    const run = () => {
      const R = ROUNDS[ri];
      items.forEach((g) => sortGroup.remove(g));
      items = [];
      zones.forEach((z, i) => {
        z.remove(z.userData.lbl);
        const lbl = labelSprite(R.zones[i], { size: 0.26, color: '#fff', bg: i ? '#e07a10' : '#1fab54', border: i ? '#e07a10' : '#1fab54' });
        lbl.position.copy(z.userData.lbl.position);
        z.add(lbl);
        stage.steadyLabel(lbl, 9);
        z.userData.lbl = lbl;
        z.userData.n = 0;
      });
      const slots = narrow
        ? [[-1.7, -1.35], [0, -1.35], [1.7, -1.35], [-1.7, -0.3], [0, -0.3], [1.7, -0.3]]
        : [[-3.9, -0.9], [-2.35, -0.9], [-0.8, -0.9], [0.8, -0.9], [2.35, -0.9], [3.9, -0.9]];
      const order = [3, 0, 5, 1, 4, 2];
      R.items.forEach(([kind, name, zi, why], i) => {
        const g = itemModel(kind);
        const [x, z] = slots[order[i]];
        g.position.set(x, 0, z);
        g.scale.setScalar(1.4);
        g.userData.pickId = `r${ri}-${kind}`;
        g.userData.dragId = g.userData.pickId;
        g.userData.info = { name, zi, why };
        const lbl = labelSprite(name, { size: 0.15 });
        lbl.position.y = g.userData.h + 0.16;
        g.add(lbl);
        stage.steadyLabel(lbl, 8);
        addHitBox(g, 0.5);
        sortGroup.add(g);
        items.push(g);
      });
      let placed = 0;
      let wrongHere = 0;
      shell.task(`<p><b>${R.icon} ${esc(R.title)}</b> (${ri + 1} от ${ROUNDS.length})</p>
        <p><b>Провлачи</b> всяко вещество в правилния кръг. Някои вещества са нови — помисли какво знаеш за тях.</p>${tableHTML()}`);
      shell.setControls('');
      const upd = () => shell.score(`Подредени: ${placed} от ${R.items.length} · грешки: ${mistakes}`);
      upd();
      clickHandler = (id) => {
        const g = items.find((x) => x.userData.pickId === id);
        if (!g || g.userData.locked) return;
        say(g, `<b>${esc(g.userData.info.name)}</b><br>Провлачи ме в кръга.`, '', 0.7);
      };
      if (stopDrag) stopDrag();
      stopDrag = stage.enableDrag({
        planeY: 0, lift: 0.3,
        onStart: () => clearTip(),
        onDrop: (g, p, start) => {
          const info = g.userData.info;
          let target = -1;
          zones.forEach((z, i) => { if (Math.hypot(p.x - z.position.x, p.z - z.position.z) < (narrow ? 1.2 : 1.4)) target = i; });
          if (target < 0) { moveTo(g, start); return; }
          if (target === info.zi) {
            const z = zones[target];
            const SL = [[-0.45, -0.35], [0.45, -0.35], [0, 0.35], [-0.5, 0.4], [0.5, 0.4]];
            const [ox, oz] = SL[z.userData.n++ % SL.length];
            moveTo(g, new V3(z.position.x + ox * (narrow ? 0.85 : 1), 0, z.position.z + oz * (narrow ? 0.85 : 1)), 0.35);
            g.userData.locked = true;
            placed++;
            say(g, `✔ ${esc(info.why)}`, 'good', 0.7);
            shell.msg('Вярно!', 'good');
          } else {
            mistakes++;
            wrongHere++;
            moveTo(g, start);
            say(g, `✘ ${esc(info.why)}`, 'bad', 0.7);
            shell.msg(wrongHere >= 2 ? `Подсказка: ${R.hint}` : `Не е в „${R.zones[target]}“. Помисли пак.`, 'bad');
          }
          upd();
          if (placed === R.items.length) {
            clickHandler = null;
            ri++;
            const last = ri >= ROUNDS.length;
            if (last) { scores.push(stepScore(mistakes, 4)); stopDrag(); stopDrag = null; }
            const c = shell.setControls(`<button class="btn primary">${last ? 'Напред →' : 'Следващо свойство →'}</button>`);
            c.querySelector('button').addEventListener('click', () => { clearTip(); shell.msg(''); if (last) step4(); else run(); });
          }
        },
      });
    };
    run();
  }

  // ---------- 4. Приложи ----------
  function step4() {
    shell.step(3);
    clearTip();
    sortGroup.visible = false;
    for (const id of Object.keys(stations)) stations[id].visible = true;
    for (const [pid, g] of sampleRoots) {
      // На масата остават само следите от опитите: плаващите и потъналите предмети, пиронът на магнита, лъжиците в чая.
      const st = SAMPLE[pid].st;
      g.visible = g.userData.used && (st === 'tank' || st === 'heat' || (st === 'magnet' && SAMPLE[pid].yes));
    }
    overview();
    let good = 0;
    const QS = [
      { q: 'Защо дръжките на тенджерите често се правят от пластмаса или дърво?', st: 'heat',
        a: ['Защото пластмасата и дървото провеждат слабо топлина и не ни изгарят ръцете.', 'Защото се привличат от магнит.', 'Защото плават във вода.'], right: 0,
        explain: 'Металът провежда добре топлина, а дървото и пластмасата — слабо. Спомни си лъжиците в чая.' },
      { q: 'Железни пирони паднаха в пясъка. Как най-бързо да ги извадиш?', st: 'magnet',
        a: ['Ще залея всичко с вода — пироните ще изплуват.', 'С магнит — той привлича желязото, а пясъка — не.', 'Ще запаля пясъка.'], right: 1,
        explain: 'Магнитът привлича желязото, а пясъкът остава. Виж!', sim: true },
      { q: 'В чаша с вода капва олио. Какво ще стане?', st: 'water',
        a: ['Олиото ще се разтвори.', 'Олиото ще потъне на дъното.', 'Олиото ще остане отгоре — то не се разтваря и е по-леко от водата.'], right: 2,
        explain: 'Олиото не се разтваря във вода и е по-леко от нея. Погледни чашата с олиото.' },
    ];
    let qi = 0;
    const ask = () => {
      const Q = QS[qi];
      clearTip();
      shell.msg('');
      shell.task(`<p>Приложи наученото (${qi + 1} от ${QS.length}).</p><div class="properties-p"></div>`);
      shell.setControls('');
      shell.score('');
      const bx2 = container.querySelector('.properties-p');
      bx2.innerHTML = `<p class="properties-q">${esc(Q.q)}</p><div class="choices">${Q.a.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
      bx2.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', async () => {
        const i = +b.dataset.i;
        bx2.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        const ok = i === Q.right;
        if (ok) good++;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) bx2.querySelector(`.choice[data-i="${Q.right}"]`).classList.add('right');
        shell.msg((ok ? 'Вярно! ' : 'Не е така. ') + Q.explain, ok ? 'good' : 'bad');
        stationView(Q.st);
        try { shell.stageEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* няма значение */ }
        if (Q.sim) await sandSim();
        else if (Q.st === 'heat') say(stations.heat, '🔥 Металната лъжица се затопли до дръжката, а дървената и пластмасовата — не.', 'wide', anchorTop.heat);
        else say(cups[3], '🫗 Олиото е отгоре — не се разтваря.', 'wide', WG.h + 0.3);
        qi++;
        const last = qi >= QS.length;
        const c = shell.setControls(`<button class="btn primary">${last ? 'Виж резултата' : 'Следващ въпрос →'}</button>`);
        c.querySelector('button').addEventListener('click', () => {
          if (!last) { ask(); return; }
          clearTip();
          scores.push(good / QS.length);
          const ratio = scores.reduce((x, y) => x + y, 0) / scores.length;
          shell.finish(ratio, onComplete, restart);
        });
      }));
    };
    ask();
  }
  // Пирони в пясък: магнитът ги изважда.
  async function sandSim() {
    const st = stations.magnet;
    for (const [pid, g] of sampleRoots) if (SAMPLE[pid].st === 'magnet') g.visible = false;
    const dish = itemModel('sand');
    dish.scale.setScalar(1.6);
    dish.position.set(0, 0.05, 0);
    st.add(dish);
    const nails = [];
    for (let i = 0; i < 3; i++) {
      const n = itemModel('nail');
      n.scale.setScalar(0.7);
      n.position.set(-0.12 + i * 0.12, 0.17, (i - 1) * 0.08);
      n.rotation.y = i * 1.1;
      st.add(n);
      nails.push(n);
    }
    say(st, 'Пирони в пясъка… Свалям магнита!', '', anchorTop.magnet);
    magBob = false;
    const y0 = magnet.position.y;
    const low = 0.62;
    await phase(0.8, (k) => { magnet.position.y = lerp(y0, low, ease(k)); });
    const from = nails.map((n) => n.position.clone());
    await phase(0.4, (k) => { nails.forEach((n, i) => { n.position.y = lerp(from[i].y, low - 0.33, k * k); n.position.x = lerp(from[i].x, (i - 1) * 0.15, k); }); });
    const off = nails.map((n) => n.position.y - magnet.position.y);
    await phase(0.9, (k) => { magnet.position.y = lerp(low, MAG.REST, ease(k)); nails.forEach((n, i) => { n.position.y = magnet.position.y + off[i]; }); });
    magBob = true;
    stage.tick(() => { nails.forEach((n, i) => { n.position.y = magnet.position.y + off[i]; }); });
    say(st, '🧲 Пироните полепнаха по магнита, а пясъкът остана в паничката.', 'wide good', anchorTop.magnet);
  }

  step1();
  return {
    dispose() {
      if (stopDrag) stopDrag();
      menu.remove();
      stage.dispose();
    },
  };
}
