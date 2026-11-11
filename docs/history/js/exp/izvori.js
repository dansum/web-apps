// 3.1.1 „Как узнаваме за миналото: материални и писмени източници“ — разкопка на открито и малък музей.
// Стъпки: опознай разкопката и музея → разкопай квадратите с четка и кажи какво разказва всяка находка →
// подреди източниците на материални и писмени → предскажи какво научаваме само от надпис (Мадарският конник).
import { createStage, cornerMenu, labelSprite, mat, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createVitrina, FINDS } from './hist/vitrina.js';
import { M, column } from './hist/architecture.js';
import { cityPerson } from './hist/city.js';
import { leafTree, pine } from './hist/revival.js';
import { cloud } from './hist/bulgar.js';
import { book as bookModel } from './hist/medieval.js';

const DIG = { x: -3.4, z: 0.4 };   // център на изкопа (6 × 4, дълбок 0,5)
const MUS = { x: 4.8, z: -1.0 };   // център на музея
const DEPTH = 0.5;

// ---------- текстури, нарисувани в canvas ----------
function canvasTex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep);
  return t;
}
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function speckle(ctx, w, h, base, dots, n, seed) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const r = rnd(seed);
  for (let i = 0; i < n; i++) { ctx.fillStyle = dots[Math.floor(r() * dots.length)]; const s = 1 + r() * 3; ctx.fillRect(r() * w, r() * h, s, s); }
}
const grassTex = () => canvasTex(128, 128, (x, w, h) => speckle(x, w, h, '#7fae55', ['rgba(60,110,40,0.5)', 'rgba(160,200,110,0.5)', 'rgba(90,130,50,0.6)'], 900, 3), [14, 10]);
const soilTex = (base, seed) => canvasTex(128, 128, (x, w, h) => speckle(x, w, h, base, ['rgba(60,40,25,0.45)', 'rgba(230,210,170,0.35)', 'rgba(120,110,100,0.6)'], 500, seed), [2, 2]);
// Стената на изкопа: пластове пръст в разрез.
const wallTex = () => canvasTex(128, 64, (x, w, h) => {
  const bands = ['#5e4a35', '#7a5f40', '#94744d', '#a88a5e'];
  bands.forEach((b, i) => { x.fillStyle = b; x.fillRect(0, (i * h) / 4, w, h / 4 + 1); });
  const r = rnd(9); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(40,30,20,${r() * 0.4})`; x.fillRect(r() * w, r() * h, 2, 2); }
}, [6, 1]);
// Букви, издълбани в камък или написани с мастило. Буквите са само за картинка.
function letters(x, w, h, { color, rows, font, pad = 12, seed = 5, abc = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΩ' }) {
  x.fillStyle = color; x.font = font;
  const r = rnd(seed);
  for (let row = 0; row < rows; row++) {
    let s = ''; const n = 7 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) s += abc[Math.floor(r() * abc.length)];
    x.fillText(s, pad, pad + 18 + (row * (h - pad * 2 - 10)) / rows);
  }
}

// ---------- находки ----------
const BRONZE = 0xa8743a, GOLD = 0xd4af37;
function coinModel() {
  const face = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#b07a40'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#7a4f24'; x.beginPath(); x.arc(64, 60, 26, 0, Math.PI * 2); x.fill();   // глава в профил
    x.fillStyle = '#b07a40'; x.beginPath(); x.arc(74, 54, 18, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#7a4f24'; x.fillRect(40, 84, 48, 8);
    x.font = 'bold 15px serif'; x.fillStyle = '#5a3a18';
    'ΒΑΣΙΛΕΩΣ'.split('').forEach((ch, i) => { const a = Math.PI * (0.8 + (i / 8) * 1.4); x.save(); x.translate(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); x.rotate(a + Math.PI / 2); x.fillText(ch, -5, 5); x.restore(); });
  });
  const side = mat(BRONZE, { metalness: 0.6, roughness: 0.4 });
  const faceM = new THREE.MeshStandardMaterial({ map: face, metalness: 0.5, roughness: 0.45 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.035, 28), [side, faceM, faceM]);
  m.rotation.x = Math.PI / 2 - 0.45;
  const g = new THREE.Group(); g.add(m);
  return g;
}
function steleModel() {
  const face = canvasTex(128, 192, (x, w, h) => {
    x.fillStyle = '#d8ccb2'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(90,75,55,0.6)'; x.lineWidth = 4; x.strokeRect(8, 8, w - 16, h - 16);
    letters(x, w, h, { color: '#5b4c38', rows: 7, font: 'bold 17px serif', pad: 16, seed: 7 });
    const r = rnd(4); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(80,70,50,${r() * 0.25})`; x.fillRect(r() * w, r() * h, 3, 2); }
  });
  const stone = M(0xcfc3a8, { tex: 'limestone' });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.14), [stone, stone, stone, stone, new THREE.MeshStandardMaterial({ map: face, roughness: 0.85 }), stone]);
  body.position.y = 0.39; g.add(body);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 20, 1, false, -Math.PI / 2, Math.PI), stone);
  top.rotation.x = -Math.PI / 2; top.position.y = 0.78; g.add(top);
  // Отчупено ъгълче.
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.16), mat(0x8c7a5c, { flat: true }));
  chip.position.set(0.25, 0.05, 0); chip.rotation.z = 0.6; g.add(chip);
  return g;
}
function wallModel() {
  const g = new THREE.Group();
  const r = rnd(12);
  for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.32 + r() * 0.08, 0.16, 0.3), M(0xa59a86, { tex: 'stone', flat: true }));
    s.position.set(-0.72 + i * 0.36 + row * 0.16, 0.08 + row * 0.16, 0); s.rotation.y = (r() - 0.5) * 0.15; g.add(s);
  }
  return g;
}
function toolModel() { const m = FINDS.flint(); m.scale.setScalar(1.3); const g = new THREE.Group(); g.add(m); return g; }
function potModel() { const m = FINDS.pot(); m.scale.setScalar(1.4); m.position.y = 0.28; const g = new THREE.Group(); g.add(m); return g; }
function jewelModel() {
  const g = new THREE.Group();
  const b = FINDS.bracelets(); b.position.y = 0.16; g.add(b);
  // Висулка с кръгче и мъниста.
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + i * 0.1);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(i % 2 ? 0x2f6f8f : GOLD, { metalness: 0.5, roughness: 0.3 }));
    bead.position.set(Math.cos(a) * 0.2 + 0.05, 0.05, Math.sin(a) * 0.12 + 0.12); g.add(bead);
  }
  return g;
}
function bookBig() { const b = bookModel(0x7a2f22, true); b.scale.setScalar(2.6); const g = new THREE.Group(); b.rotation.x = 0.35; b.position.y = 0.08; g.add(b); return g; }
function closedBook() {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.44), mat(0x6b2a1e));
  cover.position.y = 0.045; g.add(cover);
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.42), mat(0xf1e6c8)); pages.position.set(0.012, 0.045, 0); g.add(pages);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.04), mat(GOLD, { metalness: 0.7, roughness: 0.3 })); cross.position.y = 0.095; g.add(cross);
  const cross2 = cross.clone(); cross2.scale.set(0.2, 1, 6); g.add(cross2);
  for (const z of [-0.12, 0.12]) { const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.03), mat(GOLD, { metalness: 0.7, roughness: 0.3 })); clasp.position.set(0.17, 0.045, z); g.add(clasp); }
  return g;
}
function inkTex(seed, abc) {
  return canvasTex(128, 160, (x, w, h) => {
    x.fillStyle = '#efe2c0'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(40,30,20,0.85)'; x.lineWidth = 1.6;
    const r = rnd(seed);
    for (let row = 0; row < 9; row++) {
      const y = 20 + row * 15; x.beginPath(); x.moveTo(12, y);
      for (let px = 12; px < w - 12; px += 4) x.lineTo(px, y + Math.sin(px * 0.6 + row) * 2.5 + (r() - 0.5) * 2);
      x.stroke();
    }
    if (abc) { x.fillStyle = '#8a1f1f'; x.font = 'bold 26px serif'; x.fillText(abc, 12, 22); }
  });
}
function letterModel() {
  const g = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ map: inkTex(3), roughness: 0.9, side: THREE.DoubleSide });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.46), paper); p.rotation.x = -Math.PI / 2 + 0.05; p.position.y = 0.02; g.add(p);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 14), mat(0xa0201e)); seal.position.set(0.1, 0.03, 0.17); g.add(seal);
  const fold = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.14), mat(0xe6d6b0, { side: THREE.DoubleSide })); fold.rotation.x = -Math.PI / 2 + 0.6; fold.position.set(0, 0.06, -0.27); g.add(fold);
  return g;
}
function scrollModel() {
  const g = new THREE.Group();
  const paper = mat(0xe8d6a8);
  for (const x of [-0.2, 0.2]) {
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 14), paper); roll.rotation.x = Math.PI / 2; roll.position.set(x, 0.055, 0); g.add(roll);
    for (const z of [-0.24, 0.24]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(0x6b4524)); k.position.set(x, 0.055, z); g.add(k); }
  }
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshStandardMaterial({ map: inkTex(8), roughness: 0.9, side: THREE.DoubleSide }));
  sheet.rotation.x = -Math.PI / 2; sheet.rotation.z = Math.PI / 2; sheet.position.y = 0.02; g.add(sheet);
  return g;
}

// Находките в изкопа. q — какво разказва; ok е верният отговор.
const DIGS = [
  { id: 'pot', name: 'Глинен съд', make: potModel, q: 'Какво ни разказва глиненият съд?',
    a: [{ t: 'Как хората са готвили и пазили храна.', ok: true }, { t: 'Как се е казвал грънчарят.', why: 'По съда няма написани думи. Той не може да ни каже име.' }],
    info: '<b>Глинен съд</b>. Предмет — <b>материален източник</b>. Показва как хората са готвили и пазили храна.' },
  { id: 'coin', name: 'Монета', make: coinModel, q: 'Какво ни разказва монетата?',
    a: [{ t: 'Какво са яли хората за обяд.', why: 'Монетата е пари. Тя не показва храна.' }, { t: 'Че хората са купували и продавали.', ok: true }],
    info: '<b>Монета</b>. Тя е предмет, но по нея има образ и надпис. Затова е и <b>материален</b>, и <b>писмен</b> източник.' },
  { id: 'tool', name: 'Каменно сечиво', make: toolModel, q: 'Какво ни разказва каменното сечиво?',
    a: [{ t: 'С какво хората са рязали и стъргали.', ok: true }, { t: 'Какви песни са пеели хората.', why: 'Камъкът не пази песни. Помисли за какво служи остър камък.' }],
    info: '<b>Каменно сечиво</b>. Предмет — <b>материален източник</b>. Показва с какво са работили хората.' },
  { id: 'jewel', name: 'Накит', make: jewelModel, q: 'Какво ни разказва накитът?',
    a: [{ t: 'Как са се казвали децата в селото.', why: 'По накита няма имена. Погледни колко красиво е изработен.' }, { t: 'Че е имало умели майстори и хората са се украсявали.', ok: true }],
    info: '<b>Накит</b>. Предмет — <b>материален източник</b>. Показва, че е имало умели майстори.' },
  { id: 'stone', name: 'Камък с надпис', make: steleModel, q: 'Какво ни разказва камъкът с надпис?',
    a: [{ t: 'Нищо. Това е обикновен камък.', why: 'Погледни отблизо: по камъка има издълбани букви.' }, { t: 'Думите на хората: имена и случки.', ok: true }],
    info: '<b>Камък с надпис</b>. Надписът е <b>писмен източник</b>, издълбан в камък. Самият камък е предмет. <i>Буквите тук са само за картинка.</i>' },
  { id: 'wall', name: 'Основи на стена', make: wallModel, q: 'Какво ни разказват основите на стената?',
    a: [{ t: 'Как хората са строили къщите си.', ok: true }, { t: 'Как са се казвали хората в къщата.', why: 'Камъните не казват имена. Те показват как е строена къщата.' }],
    info: '<b>Основи на стена</b>. Останки от сграда — <b>материален източник</b>. Показват как са строили хората.' },
];
// За подреждането: само еднозначни източници. Монетата и надписът са „и двете“ и не се оценяват.
const SORT = [
  { id: 'pot', label: 'Глинен съд', bin: 'm', make: potModel },
  { id: 'book', label: 'Стара книга', bin: 'w', make: closedBook },
  { id: 'tool', label: 'Каменно сечиво', bin: 'm', make: toolModel },
  { id: 'letter', label: 'Писмо', bin: 'w', make: letterModel },
  { id: 'jewel', label: 'Накит', bin: 'm', make: jewelModel },
  { id: 'scroll', label: 'Свитък', bin: 'w', make: scrollModel },
];
const PREDICT = [
  { t: 'От какво е направен предметът.', why: 'Това ни показва самият предмет. Не ни трябват думи.' },
  { t: 'Имена на хора и какво са направили.', ok: true },
  { t: 'Какъв цвят е камъкът.', why: 'Цвета виждаме с очите си. Помисли какво могат да ни кажат само думите.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай', 'Разкопай', 'Подреди', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.3 / Math.max(aspect, 0.55) : 1;
  const VIEW = [[0.8, 8 * far, 10.5 * far], [0.8, 0, -0.6]];
  const stage = createStage(shell.stageEl, { background: 0xbcd9f0, camPos: VIEW[0], target: VIEW[1], maxDistance: 40, minDistance: 2 });
  const { scene } = stage;
  const disposers = [];

  // ---------- земя с дупка за изкопа ----------
  const grassM = new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 1 });
  const W = 44, Dz = 34, hx = 3, hz = 2;
  const pieces = [
    [-W / 2, DIG.x - hx, -Dz / 2, Dz / 2],
    [DIG.x + hx, W / 2, -Dz / 2, Dz / 2],
    [DIG.x - hx, DIG.x + hx, -Dz / 2, DIG.z - hz],
    [DIG.x - hx, DIG.x + hx, DIG.z + hz, Dz / 2],
  ];
  for (const [x0, x1, z0, z1] of pieces) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), grassM);
    p.rotation.x = -Math.PI / 2; p.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); scene.add(p);
  }
  // Пътека от изкопа до музея.
  const path = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.1), M(0xd9c79a, { tex: 'sand', rep: [6, 1] }));
  path.rotation.x = -Math.PI / 2; path.position.set(1.2, 0.01, 3.2); scene.add(path);

  // ---------- изкопът ----------
  const pit = new THREE.Group(); pit.position.set(DIG.x, 0, DIG.z); scene.add(pit);
  const floorM = new THREE.MeshStandardMaterial({ map: soilTex('#b39468', 2), roughness: 1 });
  const pf = new THREE.Mesh(new THREE.PlaneGeometry(2 * hx, 2 * hz), floorM); pf.rotation.x = -Math.PI / 2; pf.position.y = -DEPTH; pit.add(pf);
  const wM = new THREE.MeshStandardMaterial({ map: wallTex(), roughness: 1, side: THREE.DoubleSide });
  for (const [x, z, ry, len] of [[0, -hz, 0, 2 * hx], [0, hz, Math.PI, 2 * hx], [-hx, 0, Math.PI / 2, 2 * hz], [hx, 0, -Math.PI / 2, 2 * hz]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(len, DEPTH), wM); w.position.set(x, -DEPTH / 2, z); w.rotation.y = ry; pit.add(w);
  }
  // Колчета и въжета: мрежа 3 × 2 квадрата.
  const ropeM = mat(0xf4f1e8), stakeM = mat(0x8a6a44);
  const xs = [-3, -1, 1, 3], zs = [-2, 0, 2];
  const stakes = new THREE.Group(); pit.add(stakes);
  for (const x of xs) for (const z of zs) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.55, 6), stakeM); s.position.set(x, 0.22, z); stakes.add(s);
  }
  for (const z of zs) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 6, 5), ropeM); r.rotation.z = Math.PI / 2; r.position.set(0, 0.3, z); stakes.add(r); }
  for (const x of xs) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 4, 5), ropeM); r.rotation.x = Math.PI / 2; r.position.set(x, 0.3, 0); stakes.add(r); }
  // Квадратите: два пласта пръст върху всяка находка.
  const LAYER_M = [new THREE.MeshStandardMaterial({ map: soilTex('#6e5638', 5), roughness: 1 }), new THREE.MeshStandardMaterial({ map: soilTex('#957650', 7), roughness: 1 })];
  const squares = DIGS.map((d, i) => {
    const cx = -2 + (i % 3) * 2, cz = i < 3 ? -1 : 1;
    const g = new THREE.Group(); g.position.set(cx, 0, cz); g.userData.pickId = `sq${i}`; pit.add(g);
    const layers = [0, 1].map((k) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.24, 1.92), LAYER_M[k]);
      l.position.y = -0.13 - k * 0.24; g.add(l); return l;
    });
    // Бучки по горния пласт.
    const r = rnd(20 + i);
    for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06 + r() * 0.05), mat(0x5a4630, { flat: true })); c.position.set((r() - 0.5) * 1.5, 0.0, (r() - 0.5) * 1.5); layers[0].add(c); }
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.7, 1.95), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = -0.15; g.add(hit);
    const find = d.make();
    find.position.set(0, -DEPTH, 0);
    find.visible = false;
    g.add(find);
    const num = labelSprite(String(i + 1), { size: 0.26 }); num.position.set(-0.75, 0.25, -0.75); g.add(num);
    return { group: g, layers, find, num, d, dug: 0, done: false };
  });
  pit.userData.pickId = 'grid';

  // Купчина пръст, сито, кашон с инструменти, количка, сенник.
  const heap = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: soilTex('#8a6c48', 11), roughness: 1 }));
  heap.scale.set(1.3, 0.7, 1.0); heap.position.set(DIG.x - 4.6, 0, DIG.z - 1.6); scene.add(heap);

  const sieve = new THREE.Group(); sieve.position.set(DIG.x - 4.4, 0, DIG.z + 1.4); sieve.userData.pickId = 'sieve'; scene.add(sieve);
  const wood = M(0x8a6440);
  for (const [x, z] of [[-0.5, -0.4], [-0.5, 0.4], [0.5, -0.4], [0.5, 0.4]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), wood); l.position.set(x, 0.45, z); sieve.add(l); }
  const tray = new THREE.Group(); tray.position.y = 0.92; sieve.add(tray);
  for (const [w, d, x, z] of [[1.2, 0.06, 0, -0.5], [1.2, 0.06, 0, 0.5], [0.06, 1.0, -0.6, 0], [0.06, 1.0, 0.6, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), wood); b.position.set(x, 0, z); tray.add(b); }
  const meshTex = canvasTex(64, 64, (x, w, h) => { x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, w, h); x.strokeStyle = '#6b6f73'; x.lineWidth = 2; for (let i = 0; i <= w; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }, [3, 3]);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.98), new THREE.MeshStandardMaterial({ map: meshTex, transparent: true, side: THREE.DoubleSide }));
  net.rotation.x = -Math.PI / 2; tray.add(net);
  const dirtOnNet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: soilTex('#7d6040', 13), roughness: 1 }));
  dirtOnNet.scale.y = 0.35; tray.add(dirtOnNet);
  const pileUnder = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), heap.material);
  pileUnder.scale.y = 0.4; sieve.add(pileUnder);
  // Падащи трохи пръст под ситото.
  const crumbs = [];
  const crumbG = new THREE.BoxGeometry(0.035, 0.035, 0.035), crumbM = mat(0x6e5638);
  for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(crumbG, crumbM); c.userData.ph = i / 14; c.userData.x = (Math.random() - 0.5) * 0.8; c.userData.z = (Math.random() - 0.5) * 0.6; sieve.add(c); crumbs.push(c); }

  // Кашон с инструменти: четки, мистрия, кофичка.
  const kit = new THREE.Group(); kit.position.set(DIG.x + 3.9, 0, DIG.z + 2.6); kit.userData.pickId = 'tools'; scene.add(kit);
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.6), M(0x9c7a4c)); crate.position.y = 0.2; kit.add(crate);
  for (const y of [0.1, 0.3]) { const sl = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.03, 0.62), M(0x7a5a34)); sl.position.y = y; kit.add(sl); }
  function brushModel() {
    const b = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.32, 8), mat(0xc0392b)); handle.position.y = 0.16; b.add(handle);
    const ferrule = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.035), mat(0xb8bcc2, { metalness: 0.6, roughness: 0.3 })); ferrule.position.y = 0.0; b.add(ferrule);
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), mat(0x3a2a1c)); hair.position.y = -0.06; b.add(hair);
    return b;
  }
  const br1 = brushModel(); br1.position.set(-0.2, 0.47, 0); br1.rotation.z = 1.4; kit.add(br1);
  const br2 = brushModel(); br2.position.set(0.05, 0.47, 0.12); br2.rotation.set(0.2, 0.6, 1.5); br2.scale.setScalar(0.8); kit.add(br2);
  const trowel = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 3), mat(0x9aa0a6, { metalness: 0.7, roughness: 0.3 })); blade.scale.z = 0.12; blade.rotation.z = Math.PI / 2; trowel.add(blade);
  const th = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 8), mat(0x6b4524)); th.rotation.z = Math.PI / 2; th.position.x = -0.2; trowel.add(th);
  trowel.position.set(0.25, 0.43, -0.12); trowel.rotation.x = -Math.PI / 2 + 0.2; kit.add(trowel);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 14, 1, true), mat(0x2f6f8f, { side: THREE.DoubleSide })); bucket.position.set(0.7, 0.15, 0.2); kit.add(bucket);
  // Подвижната четка за разкопаването.
  const digBrush = brushModel(); digBrush.scale.setScalar(2); digBrush.visible = false; scene.add(digBrush);

  // Количка.
  const barrow = new THREE.Group();
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.22, 0.3, 4, 1, true), mat(0x3f7f4a, { side: THREE.DoubleSide })); bin.rotation.y = Math.PI / 4; bin.scale.set(1.4, 1, 1); bin.position.y = 0.42; barrow.add(bin);
  const soil = new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), heap.material); soil.scale.set(1.3, 0.4, 0.9); soil.position.y = 0.52; barrow.add(soil);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 16), mat(0x2a2a2a)); wheel.position.set(0.5, 0.15, 0); barrow.add(wheel);
  for (const z of [-0.18, 0.18]) { const h = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.04), mat(0x6b4524)); h.position.set(0, 0.3, z); h.rotation.z = -0.2; barrow.add(h); }
  scene.add(barrow);

  // Сенник с маса: тук археолозите записват находките.
  const tent = new THREE.Group(); tent.position.set(DIG.x + 0.6, 0, DIG.z - 3.6); scene.add(tent);
  for (const [x, z] of [[-1.2, -0.7], [-1.2, 0.7], [1.2, -0.7], [1.2, 0.7]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), mat(0xdcdcdc)); p.position.set(x, 1.05, z); tent.add(p); }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.06, 1.7), mat(0xf2efe6)); canopy.position.y = 2.1; tent.add(canopy);
  const valance = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.18, 1.72), mat(0x2f6f8f)); valance.position.y = 2.0; tent.add(valance);
  const tbl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.7), M(0x9c7a4c)); tbl.position.y = 0.75; tent.add(tbl);
  for (const [x, z] of [[-0.7, -0.28], [-0.7, 0.28], [0.7, -0.28], [0.7, 0.28]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), M(0x7a5a34)); l.position.set(x, 0.375, z); tent.add(l); }
  const notebook = bookModel(0x2f4f86, true); notebook.scale.setScalar(2); notebook.position.set(-0.3, 0.79, 0); tent.add(notebook);
  for (let i = 0; i < 3; i++) { const bag = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); bag.position.set(0.25 + i * 0.22, 0.79, 0.05); tent.add(bag); }
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), mat(0xdcdcdc)); flagPole.position.set(1.2, 2.5, -0.7); tent.add(flagPole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), mat(0xe8b23a, { side: THREE.DoubleSide })); flag.position.set(1.4, 2.75, -0.7); tent.add(flag);

  // Археолози.
  const P = (kind, s = 2.1) => { const p = cityPerson(kind); p.scale.multiplyScalar(s); scene.add(p); return p; };
  const archGroup = new THREE.Group(); scene.add(archGroup);
  const kneeler = cityPerson('archaeologist'); kneeler.scale.set(2.1, 1.5, 2.1); kneeler.position.set(DIG.x + 3.45, 0, DIG.z + 0.9); kneeler.rotation.y = -Math.PI / 2; archGroup.add(kneeler);
  const sifter = cityPerson('archaeologist'); sifter.scale.setScalar(2.1); sifter.position.set(DIG.x - 4.4, 0, DIG.z + 2.3); sifter.rotation.y = Math.PI; archGroup.add(sifter);
  const writer = cityPerson('woman'); writer.scale.setScalar(2.1); writer.position.set(DIG.x + 0.3, 0, DIG.z - 3.0); writer.rotation.y = Math.PI; archGroup.add(writer);
  const walker = P('archaeologist');
  for (const a of [kneeler, sifter, writer, walker]) { a.userData.pickId = 'arch'; addHitBox(a, 0.3); }
  // Посетители пред музея.
  const visitors = [P('kid', 2.1), P('man', 2.1), P('tourist', 2.1)];
  visitors.forEach((v, i) => { v.userData.home = new THREE.Vector3(MUS.x - 2.8 + i * 1.5, 0, MUS.z + 3.1 + (i % 2) * 0.5); v.userData.ph = i * 2.3; });

  // ---------- музеят: разрез без покрив, отгоре — стъклен таван ----------
  const museum = new THREE.Group(); museum.position.set(MUS.x, 0, MUS.z); scene.add(museum);
  const MW = 7.4, MD = 4.6, MH = 2.6, FL = 0.25;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(MW + 0.4, FL, MD + 0.4), M(0xd9cdb2, { tex: 'limestone', rep: [4, 1] })); plinth.position.y = FL / 2; museum.add(plinth);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(MW - 0.3, 0.02, MD - 0.3), M(0xf2ede1, { tex: 'marble', rep: [5, 3] })); inner.position.y = FL + 0.01; museum.add(inner);
  const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.4), M(0xd9cdb2, { tex: 'limestone' })); step.position.set(0, 0.06, MD / 2 + 0.4); museum.add(step);
  const wallM = M(0xe9dcc0, { tex: 'limestone', rep: [5, 2] }), wallS = M(0xe9dcc0, { tex: 'limestone', rep: [3, 2] });
  const back = new THREE.Mesh(new THREE.BoxGeometry(MW, MH, 0.25), wallM); back.position.set(0, FL + MH / 2, -MD / 2 + 0.12); museum.add(back);
  for (const s of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.25, MH, MD), wallS); sw.position.set(s * (MW / 2 - 0.12), FL + MH / 2, 0); museum.add(sw);
    // Прозорец в страничната стена.
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.9, 1.1), mat(0x9cc4dc, { metalness: 0.2, roughness: 0.2 })); win.position.set(s * (MW / 2 - 0.12), FL + 1.5, -0.3); museum.add(win);
    const col = column('doric', { h: MH, r: 0.17, color: 0xf2ede1 }); col.position.set(s * (MW / 2 - 0.12), FL, MD / 2 + 0.05); museum.add(col);
  }
  const band = new THREE.Mesh(new THREE.BoxGeometry(MW - 0.5, 0.18, 0.02), mat(0x8a3b2f)); band.position.set(0, FL + 2.05, -MD / 2 + 0.26); museum.add(band);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(MW + 0.3, 0.32, 0.4), M(0xf2ede1, { tex: 'marble', rep: [6, 1] })); beam.position.set(0, FL + MH + 0.16, MD / 2 + 0.05); museum.add(beam);
  for (const z of [-1, 0.2, 1.4]) { const rb = new THREE.Mesh(new THREE.BoxGeometry(MW, 0.08, 0.08), mat(0x5a6470)); rb.position.set(0, FL + MH + 0.04, z); museum.add(rb); }
  const glassRoof = new THREE.Mesh(new THREE.BoxGeometry(MW, 0.02, MD), new THREE.MeshStandardMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.08, depthWrite: false }));
  glassRoof.position.y = FL + MH + 0.06; glassRoof.raycast = () => {}; museum.add(glassRoof);
  const sign = labelSprite('МУЗЕЙ', { size: 0.36, bg: 'rgba(138,59,47,0.95)', color: '#fff7e6', border: '#5a1f18' }); sign.position.set(0, FL + MH + 0.65, MD / 2 + 0.1); museum.add(sign);
  // Пейка и саксии пред музея.
  for (const s of [-1, 1]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.4, 12), mat(0xb5683a)); pot.position.set(s * 1.6, 0.2, MD / 2 + 0.55); museum.add(pot);
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), mat(0x4f8a3a, { flat: true })); bush.position.set(s * 1.6, 0.6, MD / 2 + 0.55); museum.add(bush);
  }
  // Картини и голяма амфора в залата.
  for (const [x, c] of [[-1.8, 0x6f8fb0], [1.0, 0xb08a5a]]) {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.04), mat(0x5a3a22)); fr.position.set(x, FL + 1.6, -MD / 2 + 0.27); museum.add(fr);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.56), mat(c)); pic.position.set(x, FL + 1.6, -MD / 2 + 0.295); museum.add(pic);
    const hill = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16, 0, Math.PI), mat(0x5e8f3a)); hill.position.set(x - 0.1, FL + 1.33, -MD / 2 + 0.3); museum.add(hill);
  }
  const amph = new THREE.Group(); { const a = FINDS.pot(); a.scale.set(2.2, 3.2, 2.2); a.position.y = 0.64; amph.add(a); }
  amph.position.set(-MW / 2 + 0.7, FL, MD / 2 - 0.9); museum.add(amph);
  for (const x of [-0.9, 0.9]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.7, 8), mat(0xc9a43a, { metalness: 0.6, roughness: 0.3 })); post.position.set(2.4 + x, FL + 0.35, -0.2); museum.add(post); }
  { const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 6), mat(0x8a1f2b)); rope.rotation.z = Math.PI / 2; rope.position.set(2.4, FL + 0.6, -0.2); museum.add(rope); }
  museum.userData.pickId = 'museum';

  // Витрини в музея (координатите са в света).
  const vBook = createVitrina(stage, { id: 'book', x: MUS.x - 2.3, z: MUS.z - 1.0, label: 'Стара книга', item: bookBig() });
  vBook.group.position.y = FL;
  const vPot = createVitrina(stage, { id: 'vpot', x: MUS.x - 0.8, z: MUS.z - 1.0, label: 'Глинен съд', item: (() => { const g = new THREE.Group(); const a = FINDS.pot(); a.scale.setScalar(1.2); g.add(a); return g; })() });
  vPot.group.position.y = FL;
  const vBoth = createVitrina(stage, { id: 'both', x: MUS.x + 0.7, z: MUS.z - 1.0, label: 'И двете' });
  vBoth.group.position.y = FL; vBoth.group.visible = false;

  // Мадарският конник — умалено копие на скалния релеф с надписите до него.
  const madara = new THREE.Group(); madara.position.set(MUS.x + 2.4, FL, MUS.z - 1.3); madara.userData.pickId = 'madara'; scene.add(madara);
  {
    const rock = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 0.35), M(0xc9b48c, { tex: 'rock' })); rock.position.y = 0.95; madara.add(rock);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.5), M(0x3b4a5c)); ped.position.y = 0.05; madara.add(ped);
    const rel = mat(0xe2d3b0), z = 0.19;
    const add = (geo, x, y, rz = 0, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, rel); m.position.set(x, y, z); m.rotation.z = rz; m.scale.set(sx, sy, sz); madara.add(m); return m; };
    const ball = new THREE.SphereGeometry(1, 16, 10);
    add(ball, 0.0, 1.02, 0, 0.33, 0.14, 0.05);                              // тяло на коня
    add(ball, 0.3, 1.2, -0.9, 0.16, 0.07, 0.045);                           // шия
    add(ball, 0.43, 1.3, -0.5, 0.11, 0.05, 0.04);                           // глава
    add(new THREE.ConeGeometry(0.02, 0.06, 5), 0.42, 1.38, -0.3);           // ухо
    add(ball, -0.36, 0.96, 0.9, 0.12, 0.025, 0.03);                         // опашка
    const leg = new THREE.CylinderGeometry(0.022, 0.016, 0.34, 6);
    for (const [x, rr] of [[-0.24, 0.12], [-0.14, -0.15], [0.18, 0.1], [0.3, -0.75]]) add(leg, x, 0.78, rr);
    add(ball, -0.02, 1.27, 0, 0.06, 0.13, 0.045);                           // ездач
    add(ball, -0.02, 1.45, 0, 0.045, 0.05, 0.04);
    add(ball, -0.1, 1.24, 0.3, 0.07, 0.11, 0.03);                           // наметало
    add(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 5), 0.2, 1.08, -0.85);  // копие
    add(ball, 0.42, 0.62, 0, 0.17, 0.06, 0.04);                             // лъв
    add(ball, 0.6, 0.66, 0, 0.06, 0.06, 0.04);
    add(ball, -0.52, 0.8, 0, 0.13, 0.045, 0.035);                           // куче
    add(ball, -0.66, 0.86, 0, 0.045, 0.04, 0.035);
    for (const [x, y, sc] of [[-0.85, 0.4, 0.3], [0.86, 1.3, 0.25], [0.7, 1.75, 0.22], [-0.7, 1.8, 0.2]]) {
      const ch = new THREE.Mesh(new THREE.DodecahedronGeometry(sc), M(0xc9b48c, { tex: 'rock', flat: true })); ch.position.set(x, y, -0.05); ch.scale.z = 0.7; madara.add(ch);
    }
    const insc = canvasTex(128, 64, (x, w, h) => { x.fillStyle = '#d6c6a2'; x.fillRect(0, 0, w, h); letters(x, w, h, { color: '#6b5a40', rows: 3, font: 'bold 12px serif', pad: 6, seed: 3 }); });
    for (const [x, y] of [[-0.55, 1.5], [0.55, 0.45], [-0.5, 0.42]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.2), new THREE.MeshStandardMaterial({ map: insc, roughness: 0.9 })); p.position.set(x, y, 0.18); madara.add(p); }
    const tag = labelSprite('Мадарският конник (копие)', { size: 0.17 }); tag.position.set(0, 2.05, 0); madara.add(tag);
  }
  madara.visible = false;

  // Подреждане: две зони пред музея и предметите на платнище.
  const ZONES = { m: new THREE.Vector3(MUS.x - 2.0, 0, MUS.z + 4.5), w: new THREE.Vector3(MUS.x + 2.0, 0, MUS.z + 4.5) };
  const zoneM = zoneRing(0xa0622d, 1.25); zoneM.position.copy(ZONES.m); zoneM.userData.pickId = 'zone-m'; scene.add(zoneM);
  const zoneW = zoneRing(0x2f6fb0, 1.25); zoneW.position.copy(ZONES.w); zoneW.userData.pickId = 'zone-w'; scene.add(zoneW);
  const lm = labelSprite('Материални източници', { size: 0.22, bg: 'rgba(250,236,220,0.96)', border: '#a0622d' }); lm.position.set(0, 0.45, -1.45); zoneM.add(lm);
  const lw = labelSprite('Писмени източници', { size: 0.22, bg: 'rgba(225,238,252,0.96)', border: '#2f6fb0' }); lw.position.set(0, 0.45, -1.45); zoneW.add(lw);
  const blanket = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.2), mat(0xc9b27a)); blanket.rotation.x = -Math.PI / 2; blanket.position.set(MUS.x, 0.015, MUS.z + 6.9); scene.add(blanket);
  const items = SORT.map((s, i) => {
    const g = new THREE.Group();
    const m = s.make(); g.add(m);
    const lbl = labelSprite(s.label, { size: 0.17 }); lbl.position.y = 0.75; g.add(lbl);
    g.userData = { dragId: s.id, home: new THREE.Vector3(MUS.x - 3.1 + i * 1.24, 0.03, MUS.z + 6.9), spec: s };
    g.position.copy(g.userData.home);
    addHitBox(g, 0.8);
    scene.add(g);
    return g;
  });
  const sortGroup = [zoneM, zoneW, blanket, ...items];
  const showSort = (on) => sortGroup.forEach((o) => { o.visible = on; });
  showSort(false);

  // Дървета и облаци.
  const r = rnd(42);
  for (let i = 0; i < 16; i++) {
    const t = i % 3 ? leafTree(2.6 + r() * 1.2) : pine(2.8 + r());
    const ang = r() * Math.PI;
    t.position.set(-14 + i * 1.9 + (r() - 0.5), 0, -7 - r() * 3 - Math.sin(ang) * 1.5);
    scene.add(t);
  }
  for (const [x, z] of [[-11, 3], [-12, -1], [11, 3], [12, -2], [10.5, 6.5]]) { const t = leafTree(2.6 + r()); t.position.set(x, 0, z); scene.add(t); }
  const clouds = [];
  for (let i = 0; i < 4; i++) { const c = cloud(); c.position.set(-12 + i * 7, 8 + r() * 2, -12 - r() * 4); c.scale.setScalar(1.3); scene.add(c); clouds.push(c); }

  // Прах при четкане.
  const dust = [];
  const dustG = new THREE.SphereGeometry(0.06, 6, 5);
  for (let i = 0; i < 16; i++) { const d = new THREE.Mesh(dustG, new THREE.MeshStandardMaterial({ color: 0xb59a72, transparent: true, opacity: 0, depthWrite: false })); d.visible = false; scene.add(d); dust.push({ m: d, life: 0, v: new THREE.Vector3() }); }
  function puff(p) {
    for (const d of dust) {
      d.m.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.05, (Math.random() - 0.5) * 1.2));
      d.v.set((Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.5, (Math.random() - 0.5) * 0.6);
      d.life = 1; d.m.visible = true;
    }
  }
  let brushT = 0, brushAt = null;
  const rising = new Set();

  // ---------- живот на сцената ----------
  disposers.push(stage.tick((dt, t) => {
    tray.position.x = Math.sin(t * 7) * 0.05;
    tray.rotation.z = Math.sin(t * 7) * 0.02;
    for (const c of crumbs) {
      const k = (t * 0.9 + c.userData.ph) % 1;
      c.position.set(c.userData.x, 0.85 - k * 0.7, c.userData.z);
    }
    kneeler.rotation.x = Math.sin(t * 2.2) * 0.12;
    kneeler.position.y = Math.abs(Math.sin(t * 2.2)) * 0.02;
    writer.rotation.y = Math.PI + Math.sin(t * 0.6) * 0.3;
    // Количката отива до купчината и се връща.
    const k = (Math.sin(t * 0.35) + 1) / 2;
    const ax = DIG.x - 3.8, bx = DIG.x - 0.8, wz = DIG.z - 2.7;
    const x = ax + (bx - ax) * k;
    const dir = Math.cos(t * 0.35) > 0 ? 1 : -1;
    barrow.position.set(x + dir * 0.9, 0, wz); barrow.rotation.y = dir > 0 ? Math.PI : 0;
    walker.position.set(x, Math.abs(Math.sin(t * 6)) * 0.03, wz); walker.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    wheel.rotation.z = -t * 3 * dir;
    flag.rotation.y = Math.sin(t * 3) * 0.3;
    for (const v of visitors) {
      const h = v.userData.home, a = t * 0.25 + v.userData.ph;
      const nx = h.x + Math.cos(a) * 0.7, nz = h.z + Math.sin(a * 0.8) * 0.3;
      v.rotation.y = Math.atan2(nx - v.position.x, nz - v.position.z);
      v.position.set(nx, Math.abs(Math.sin(t * 4 + v.userData.ph)) * 0.02, nz);
    }
    clouds.forEach((c, i) => { c.position.x += dt * (0.15 + i * 0.03); if (c.position.x > 18) c.position.x = -18; });
    for (const d of dust) {
      if (d.life <= 0) continue;
      d.life -= dt * 0.8;
      d.m.position.addScaledVector(d.v, dt);
      d.m.material.opacity = Math.max(0, d.life * 0.7);
      d.m.scale.setScalar(1 + (1 - d.life) * 2);
      if (d.life <= 0) d.m.visible = false;
    }
    if (brushAt && brushT > 0) {
      brushT -= dt;
      digBrush.position.set(brushAt.x + Math.sin(t * 14) * 0.5, brushAt.y + 0.25, brushAt.z + Math.cos(t * 9) * 0.2);
      digBrush.rotation.z = 0.6 + Math.sin(t * 14) * 0.4;
      if (brushT <= 0) digBrush.visible = false;
    }
    for (const f of rising) {
      const goal = f.userData.goalY;
      f.position.y += (goal - f.position.y) * Math.min(1, dt * 3);
      if (f.userData.spin) f.rotation.y += dt * 0.7;
    }
  }));

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 1.2, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let menu = null;
  let clickHandler = null;
  let stopDrag = null;
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null, hit));

  // ---------- 1. Опознай ----------
  const LOOK = [
    { id: 'arch', label: 'Археолозите', icon: '🧑‍🔬', obj: kneeler, dist: 6, lift: 1.4,
      text: '<b>Археолози</b>. Те търсят следи от миналото в земята. Копаят бавно, пласт по пласт. Записват всяка находка.' },
    { id: 'grid', label: 'Мрежата от въжета', icon: '🧵', obj: pit, dist: 8, lift: 1.0,
      text: '<b>Мрежа от въжета</b>. Въжетата делят мястото на квадрати. Така се знае точно къде е намерен всеки предмет.' },
    { id: 'tools', label: 'Четки и мистрия', icon: '🖌️', obj: kit, dist: 3.5, lift: 1.0,
      text: '<b>Четки и мистрия</b>. С мистрията свалят пръстта на тънки пластове. С четката почистват находката, за да не я счупят.' },
    { id: 'sieve', label: 'Ситото', icon: '🪣', obj: sieve, dist: 4.5, lift: 1.6,
      text: '<b>Сито</b>. Пръстта минава през ситото. Така не се губят малките находки: мъниста, монети.' },
    { id: 'museum', label: 'Музеят', icon: '🏛️', obj: museum, dist: 9, lift: 3.0,
      text: '<b>Музей</b>. Тук пазят източниците за миналото. <b>Материални</b> са предметите и сградите. <b>Писмени</b> са тези с написани думи.' },
    { id: 'book', label: 'Старата книга', icon: '📖', obj: vBook.group, dist: 3.6, lift: 2.0,
      text: '<b>Стара книга</b>, писана на ръка. Тя е <b>писмен източник</b>: в нея четем думите на хората от миналото. Повечето стари книги не са от земята. Пазени са в манастири и библиотеки.' },
  ];
  function step1() {
    shell.step(0);
    scores.length = 0;
    shell.task('Това е разкопка, подобна на истинските, и малък музей до нея. <b>Разгледай всичко от менюто</b> или кликни в сцената.');
    shell.setControls('');
    const seen = new Set();
    const open = (id) => {
      const L = LOOK.find((x) => x.id === id);
      if (!L) return;
      stage.focusOn(L.obj, { dist: L.dist * far, height: L.dist * 0.45, lift: 0.4, keepFollow: false });
      say(L.obj, L.text, { cls: 'wide', lift: L.lift });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${LOOK.length}`);
      if (seen.size === LOOK.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: LOOK.map((l) => ({ id: l.id, label: l.label, icon: l.icon })), onSelect: open });
    clickHandler = (id) => { if (id) open(id.startsWith('sq') ? 'grid' : id); };
  }

  // ---------- 2. Разкопай ----------
  function step2() {
    shell.step(1);
    shell.score(`Открити: 0 от ${DIGS.length}`);
    stage.flyTo([DIG.x, 6.2 * far, DIG.z + 6.4 * far], [DIG.x, -0.3, DIG.z + 0.2], 1);
    let mistakes = 0, found = 0, busy = false;
    const base = 'Кликни върху квадрат, за да го почистиш с четката. Под <b>два пласта</b> пръст има находка.';
    shell.task(base);
    shell.setControls('');
    say(pit, 'Разкопката е измислена за урока. Такива находки наистина се откриват в българските земи.', { cls: 'tag', lift: 1.2 });
    clickHandler = (id) => {
      if (busy || !id || !id.startsWith('sq')) return;
      const S = squares[+id.slice(2)];
      if (S.done) { shell.msg('Тук вече копа. Избери друг квадрат.', ''); return; }
      clearTip();
      S.layers[S.dug].visible = false;
      S.num.visible = false;
      S.dug++;
      const wp = S.group.getWorldPosition(new THREE.Vector3()); wp.y = -0.25 * S.dug;
      puff(wp);
      brushAt = wp; brushT = 0.9; digBrush.visible = true;
      if (S.dug < 2) { shell.msg('Още един пласт…', ''); return; }
      S.done = true; busy = true;
      S.find.visible = true;
      S.find.userData.goalY = S.d.id === 'wall' ? -DEPTH : S.d.id === 'stone' ? -0.2 : 0.15;
      S.find.userData.spin = !['wall', 'stone'].includes(S.d.id);
      rising.add(S.find);
      shell.msg(`Откри: ${S.d.name}!`, 'good');
      say(S.find, `<b>${esc(S.d.name)}</b>`, { cls: 'tag', lift: 1.1 });
      shell.task(esc(S.d.q));
      const c = shell.setControls(`<div class="col">${S.d.a.map((a, i) => `<button class="btn" data-i="${i}"${a.ok ? ' data-ok="1"' : ''}>${esc(a.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const a = S.d.a[+b.dataset.i];
        if (!a.ok) { mistakes++; b.disabled = true; shell.msg(a.why, 'bad'); return; }
        found++; busy = false;
        shell.score(`Открити: ${found} от ${DIGS.length}`);
        shell.msg('Вярно!', 'good');
        say(S.find, S.d.info, { cls: 'good wide', lift: 1.0 });
        if (found === DIGS.length) {
          scores.push(stepScore(mistakes, 3));
          shell.task('Всички находки са открити! Сега ги занасяме в музея.');
          const n = shell.setControls('<button class="btn primary">Напред →</button>');
          n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
        } else {
          shell.task(base);
          shell.setControls('');
        }
      }));
    };
  }

  // ---------- 3. Подреди ----------
  function step3() {
    shell.step(2);
    clickHandler = null;
    showSort(true);
    const f3 = Math.min(far, 1.9);
    stage.flyTo([MUS.x, 7.4 * f3, MUS.z + 4.6 + 8.9 * f3], [MUS.x, 0, MUS.z + 4.6], 1);
    let mistakes = 0, placed = 0;
    const fill = { m: 0, w: 0 };
    shell.task('Подреди източниците за музея. Завлечи всеки в зоната: <b>материални</b> или <b>писмени</b>.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${SORT.length}`);
    const SPOTS = [[-0.6, 0.15], [0.6, 0.15], [0, -0.55], [0, 0.75]];
    stopDrag = stage.enableDrag({
      planeY: 0.03,
      onDrop(obj) {
        const s = obj.userData.spec;
        const p = obj.position;
        const bin = ['m', 'w'].find((k) => Math.hypot(p.x - ZONES[k].x, p.z - ZONES[k].z) < 1.5);
        if (!bin) { obj.position.copy(obj.userData.home); return; }
        if (bin === s.bin) {
          const [dx, dz] = SPOTS[fill[bin]++];
          obj.position.set(ZONES[bin].x + dx, 0.03, ZONES[bin].z + dz);
          obj.userData.locked = true;
          placed++;
          shell.score(`Подредени: ${placed} от ${SORT.length}`);
          shell.msg(bin === 'm' ? `Да! ${s.label}: предмет без думи.` : `Да! ${s.label}: в него има написани думи.`, 'good');
          if (placed === SORT.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 3));
            const both = new THREE.Group();
            const cn = coinModel(); cn.scale.setScalar(0.8); cn.position.set(-0.17, 0.05, 0); both.add(cn);
            const st = steleModel(); st.scale.setScalar(0.42); st.position.set(0.15, -0.15, 0); both.add(st);
            vBoth.setItem(both); vBoth.group.visible = true; vBoth.glow(0xffe08a);
            stage.flyTo([MUS.x + 0.4, 6.4 * far, MUS.z + 11 * far], [MUS.x + 0.4, 0.8, MUS.z + 1.6], 1.2);
            say(vBoth.group, '<b>А монетата и камъкът с надпис?</b> Те са предмети, но по тях има написани думи. Затова са <b>и двете</b>: материални и писмени източници.', { cls: 'good wide', lift: 2.2 });
            shell.task('Всичко е подредено!');
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          obj.position.copy(obj.userData.home);
          shell.msg(s.bin === 'w'
            ? `Погледни пак: има ли в „${s.label}“ написани думи?`
            : `Има ли по „${s.label}“ написани думи? Ако няма, това е предмет.`, 'bad');
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    shell.score('');
    showSort(false);
    vBoth.glow();
    madara.visible = true;
    stage.flyTo([MUS.x + 2.4, 2.0, MUS.z + 2.0 + 2.4 * far], [MUS.x + 2.3, 1.2, MUS.z - 1.3], 1.2);
    say(madara, 'Мадарският конник: картина, изсечена в скала. До нея има надписи.', { cls: 'tag', lift: 2.4 });
    let mistakes = 0;
    shell.task('Предметът показва как са живели хората. <b>Какво ще научим от един надпис, което предметът не може да ни каже?</b>');
    const c = shell.setControls(`<div class="col">${PREDICT.map((p, i) => `<button class="btn" data-i="${i}"${p.ok ? ' data-ok="1"' : ''}>${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = PREDICT[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      shell.msg('Вярно предсказание!', 'good');
      say(madara, '<b>Така е.</b> Самата картина не казва кой е конникът. Надписите до нея разказват за хан Тервел и неговите дела. <i>Тук е умалено копие. Истинският конник е в скалите край село Мадара.</i>', { cls: 'good wide', lift: 2.2 });
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => {
        clearTip();
        shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart);
      });
    }));
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    for (const S of squares) {
      S.layers.forEach((l) => { l.visible = true; });
      S.num.visible = true; S.dug = 0; S.done = false;
      S.find.visible = false; S.find.position.y = -DEPTH; S.find.rotation.y = 0;
      rising.delete(S.find);
    }
    for (const it of items) { it.position.copy(it.userData.home); it.userData.locked = false; }
    showSort(false);
    vBoth.group.visible = false; vBoth.glow(); vBoth.setItem(null);
    madara.visible = false;
    if (menu) menu.remove();
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  step1();
  container.__demo = { stage };
  return {
    dispose() {
      if (stopDrag) stopDrag();
      if (menu) menu.remove();
      disposers.forEach((d) => d());
      vBook.dispose(); vPot.dispose(); vBoth.dispose();
      stage.dispose();
    },
  };
}
