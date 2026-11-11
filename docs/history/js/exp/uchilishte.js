// 3.3.3 „Новобългарското училище и будителите“ — ден на едно дете в килийното и в новото училище (средата на XIX век).
// Стъпки: опознай двете училища (меню в ъгъла) → опит: един месец учене по стария и по новия начин, колко букви научава детето
// → приложи: свържи будителя с делото му (портрети в днешна класна стая) → предскажи: защо хората дават пари за училище.
// Сградите и хората са от hist/revival.js (както в 7.1.2 Копривщица), но преживяването е по-просто, за 3. клас.
import { createStage, cornerMenu, labelSprite, mat, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { M } from './hist/architecture.js';
import { animal, graze } from './hist/thrace.js';
import { smoke, cloud } from './hist/bulgar.js';
import { wander } from './hist/antiquity.js';
import {
  RM, revivalHouse, yardWall, humpBridge, revivalChurch, bellTower,
  cellSchool, newSchool, pine, leafTree, forestHill, folkPerson, mergeStatic,
} from './hist/revival.js';

// Слива неподвижните части; ключовете от userData (движещи се или кликаеми части) остават отделни.
const ms = (obj, keys = []) => mergeStatic(obj, keys.flatMap((k) => [].concat(obj.userData[k] ?? [])));
const fp = (kind, opts = {}, arms = false) => { const p = folkPerson(kind, opts); return mergeStatic(p, arms ? p.userData.arms : []); };

const REC = '<span class="small">Възстановка.</span>';
// Стъпка 1: какво има в двете училища. Кратки изречения за 9-годишни.
const ITEMS = [
  { id: 'cell', label: 'Килийното училище', icon: '⛪',
    note: `Това е старото училище. То е малка стая при църквата. Учител е свещеник или монах. Децата седят на пода. ${REC}` },
  { id: 'teacher', label: 'Даскалът', icon: '🧔',
    note: 'Учителят се казва даскал. Той вика децата едно по едно. Другите деца чакат.' },
  { id: 'sand', label: 'Пясъчникът', icon: '✍️',
    note: 'Хартията е скъпа. Децата пишат букви с пръчица в пясък. После ги заличават и пишат пак.' },
  { id: 'psalter', label: 'Псалтирът', icon: '📖',
    note: 'Децата четат църковни книги — псалтир и часослов. Езикът им е стар и труден. Много неща учат наизуст.' },
  { id: 'school', label: 'Новото училище', icon: '🏫',
    note: `Това е новото, светско училище. Децата учат на говоримия български език. Първото такова училище е открито в Габрово през 1835 г. ${REC}` },
  { id: 'tables', label: 'Таблата с букви', icon: '🔤',
    note: 'Децата стоят на групи пред табла с букви. По-голям ученик помага на по-малките. Учителят наглежда всички.' },
  { id: 'primer', label: '„Рибният буквар“', icon: '🐬',
    note: 'Този буквар е от Петър Берон, 1824 г. В него има букви, басни, смятане и знания за природата. В края е нарисуван делфин. Затова му казват „Рибен буквар“.' },
  { id: 'board', label: 'Смятане и карта', icon: '🧮',
    note: 'В новото училище децата учат и смятане, история и география. Те научават много за света.' },
];
// Колко букви научава детето за един месец — само илюстрация, не точни данни.
const ABC = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ';
const LEARN = { old: 5, new: 15 };
const WAY = { old: 'Килийното училище', new: 'Новото училище' };
const WHY = [
  { t: 'Учи по буквар на говоримия език. По-голям ученик помага и детето не чака.', ok: true },
  { t: 'В новото училище учат само молитви наизуст.', ok: false, why: 'Не. Молитви наизуст се учат главно в килийното училище.' },
  { t: 'Пясъкът е по-хубав от хартията.', ok: false, why: 'Не е заради пясъка. Виж кой помага на детето и по каква книга учи.' },
];
// Стъпка 3: будителите и делата им. Портретите са опростени рисунки.
const PEOPLE = [
  { id: 'paisiy', name: 'Паисий Хилендарски', kind: 'monk', bg: '#b89a6a', beard: '#8a8a8a',
    note: 'Паисий е монах в Хилендарския манастир. През 1762 г. завършва „История славянобългарска“. В нея разказва за миналото на българите. Той иска българите да се гордеят, че са българи.' },
  { id: 'sofroniy', name: 'Софроний Врачански', kind: 'bishop', bg: '#8f7458', beard: '#d8d8d0',
    note: 'Софроний преписва историята на Паисий през 1765 г. Така тя стига до повече хора. През 1806 г. издава „Неделник“. Това е първата печатна книга на новобългарски език.' },
  { id: 'beron', name: 'Петър Берон', kind: 'gent', bg: '#6f8070', hair: '#3a2a1e',
    note: 'Петър Берон издава буквар през 1824 г. В края на книгата е нарисуван делфин. Затова го наричат „Рибен буквар“. По него децата учат букви, смятане и знания за природата.' },
  { id: 'aprilov', name: 'Васил Априлов', kind: 'gent', bg: '#7a8796', hair: '#5a4632',
    note: 'Васил Априлов е богат търговец от Габрово. Той дава пари и помага да се открие училището в Габрово през 1835 г. Това е първото светско българско училище.' },
  { id: 'neofit', name: 'Неофит Рилски', kind: 'monk', bg: '#a58c68', beard: '#3a3028',
    note: 'Неофит Рилски е монах от Рилския манастир и учен човек. Той е първият учител в училището в Габрово. Там учи децата на групи — по-големите помагат на по-малките.' },
];
const DEEDS = [
  { id: 'd-history', who: 'paisiy', label: '„История славянобългарска“', hint: 'Тази книга разказва за миналото на българите. Написал я е монах от Хилендарския манастир.' },
  { id: 'd-nedelnik', who: 'sofroniy', label: '„Неделник“', hint: '„Неделник“ е печатна книга от 1806 г. Издал я е епископът на Враца.' },
  { id: 'd-primer', who: 'beron', label: '„Рибният буквар“', hint: 'Букварът е от 1824 г. Автор е учен човек в европейски дрехи.' },
  { id: 'd-money', who: 'aprilov', label: 'Пари за училище в Габрово', hint: 'Парите дава богат търговец, роден в Габрово.' },
  { id: 'd-teacher', who: 'neofit', label: 'Първи учител в Габрово', hint: 'Първият учител е монах от Рилския манастир.' },
];
const PREDICT1 = [
  { t: 'Искат децата им да четат, пишат и смятат на български. Това трябва в занаята, в търговията и в живота.', ok: true },
  { t: 'Султанът им заповядва да дават пари.', ok: false, why: 'Не. Българите сами решават да строят училища и сами плащат за тях.' },
  { t: 'Искат всички деца да станат монаси.', ok: false, why: 'Не. В новото училище децата учат смятане, история и география — знания за живота.' },
];
const PREDICT2 = [
  { t: 'В много градове и села ще отворят нови училища.', ok: true },
  { t: 'Училището в Габрово ще остане единствено.', ok: false, why: 'Не. Хората виждат ползата и искат такова училище и при тях.' },
  { t: 'Хората ще спрат да учат.', ok: false, why: 'Точно обратното — все повече деца учат.' },
];

// ---------- рисунки върху платно ----------
function canvasMat(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
}
// Опростен портрет (не е истински образ): монах, епископ или човек в европейски дрехи.
function drawPortrait(ctx, W, H, p) {
  ctx.fillStyle = '#b8902e'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2c26a'; ctx.fillRect(8, 8, W - 16, H - 16);
  const g = ctx.createRadialGradient(W / 2, H * 0.35, 10, W / 2, H * 0.4, W * 0.7);
  g.addColorStop(0, p.bg); g.addColorStop(1, '#3a2c1e');
  ctx.fillStyle = g; ctx.fillRect(18, 18, W - 36, H * 0.82 - 18);
  const cx = W / 2, hy = H * 0.36;
  const robe = p.kind === 'gent' ? '#1f2128' : '#16161a';
  // Рамене и дреха.
  ctx.fillStyle = robe;
  ctx.beginPath(); ctx.moveTo(W * 0.14, H * 0.82); ctx.quadraticCurveTo(W * 0.2, H * 0.52, cx, H * 0.5); ctx.quadraticCurveTo(W * 0.8, H * 0.52, W * 0.86, H * 0.82); ctx.fill();
  if (p.kind === 'gent') {
    ctx.fillStyle = '#f4f0e6'; ctx.beginPath(); ctx.moveTo(cx - 26, H * 0.5); ctx.lineTo(cx + 26, H * 0.5); ctx.lineTo(cx, H * 0.68); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(cx - 14, H * 0.52); ctx.lineTo(cx + 14, H * 0.52); ctx.lineTo(cx, H * 0.6); ctx.fill();
  }
  // Глава.
  ctx.fillStyle = '#e3b892'; ctx.beginPath(); ctx.ellipse(cx, hy, W * 0.13, H * 0.105, 0, 0, 7); ctx.fill();
  if (p.kind === 'gent') {
    ctx.fillStyle = p.hair; ctx.beginPath(); ctx.ellipse(cx, hy - H * 0.06, W * 0.14, H * 0.06, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - W * 0.14, hy - H * 0.06, 10, H * 0.08); ctx.fillRect(cx + W * 0.14 - 10, hy - H * 0.06, 10, H * 0.08);
  } else {
    // Брада и калимавка с було.
    ctx.fillStyle = p.beard; ctx.beginPath(); ctx.moveTo(cx - W * 0.12, hy + 4); ctx.quadraticCurveTo(cx, hy + H * 0.26, cx + W * 0.12, hy + 4); ctx.quadraticCurveTo(cx, hy + H * 0.09, cx - W * 0.12, hy + 4); ctx.fill();
    ctx.fillStyle = '#0e0e10'; ctx.fillRect(cx - W * 0.15, hy - H * 0.2, W * 0.3, H * 0.11);
    ctx.fillRect(cx - W * 0.17, hy - H * 0.1, W * 0.05, H * 0.24); ctx.fillRect(cx + W * 0.12, hy - H * 0.1, W * 0.05, H * 0.24);
    if (p.kind === 'bishop') { ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(cx, H * 0.7, 12, 0, 7); ctx.fill(); ctx.fillStyle = '#2f5a8a'; ctx.beginPath(); ctx.arc(cx, H * 0.7, 6, 0, 7); ctx.fill(); }
  }
  ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(cx - 11, hy - 3, 3, 0, 7); ctx.arc(cx + 11, hy - 3, 3, 0, 7); ctx.fill();
  ctx.strokeStyle = '#a0704a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, hy); ctx.lineTo(cx - 3, hy + 10); ctx.stroke();
  // Табелка с името.
  ctx.fillStyle = '#f6efdc'; ctx.fillRect(14, H * 0.84, W - 28, H * 0.13);
  ctx.fillStyle = '#3a2614'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const [a, b] = p.name.split(' ');
  ctx.font = 'bold 26px serif'; ctx.fillText(a, cx, H * 0.875);
  ctx.font = 'bold 22px serif'; ctx.fillText(b, cx, H * 0.935);
}
// Корица на книга.
function drawCover(ctx, W, H, { bg, title, dolphin = false }) {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#e0c070'; ctx.lineWidth = 6; ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.fillStyle = '#f6e8c0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${title.length > 8 ? 22 : 30}px serif`;
  title.split('|').forEach((t, i, all) => ctx.fillText(t, W / 2, H * (dolphin ? 0.25 : 0.5) + (i - (all.length - 1) / 2) * 28));
  if (dolphin) {
    ctx.fillStyle = '#9ac4e0';
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.65, W * 0.28, H * 0.09, -0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W * 0.74, H * 0.58); ctx.lineTo(W * 0.88, H * 0.5); ctx.lineTo(W * 0.86, H * 0.66); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W * 0.48, H * 0.57); ctx.lineTo(W * 0.54, H * 0.47); ctx.lineTo(W * 0.58, H * 0.58); ctx.fill();
    ctx.fillStyle = '#1e2a3a'; ctx.beginPath(); ctx.arc(W * 0.3, H * 0.66, 4, 0, 7); ctx.fill();
  }
}
function book({ bg, title, dolphin = false, w = 0.3, d = 0.22 }) {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), M(new THREE.Color(bg).getHex()));
  cover.position.y = 0.025; g.add(cover);
  const pages = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.036, d - 0.012), M(0xf2e8cf)); pages.position.set(0.006, 0.025, 0); g.add(pages);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, d), canvasMat(256, 192, (c, W, H) => drawCover(c, W, H, { bg, title, dolphin })));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.0505; g.add(top);
  return g;
}
function purse() {
  const g = new THREE.Group();
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), M(0x7a5232, { rough: 0.95 })); bag.scale.set(1, 0.85, 1); bag.position.y = 0.085; g.add(bag);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.05, 10), M(0x7a5232)); neck.position.y = 0.18; g.add(neck);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 14), M(0xb0302a)); tie.rotation.x = Math.PI / 2; tie.position.y = 0.17; g.add(tie);
  const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
  for (const [x, z, r] of [[0.15, 0.04, 0.2], [0.17, -0.06, 0.5], [0.11, -0.12, 0.1]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 14), gold); c.position.set(x, 0.006, z); c.rotation.z = r * 0.2; g.add(c); }
  return g;
}
function letterBoard() {
  const g = new THREE.Group();
  const wood = M(0x6b4a2c);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.02), wood); l.position.set(s * 0.1, 0.15, 0); l.rotation.x = -0.15; g.add(l); }
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.015), RM('letters')); b.position.set(0, 0.2, 0.02); b.rotation.x = -0.15; g.add(b);
  const ptr = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.3, 5), wood); ptr.rotation.z = 1.2; ptr.position.set(0.05, 0.02, 0.1); g.add(ptr);
  return g;
}

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай двете училища', 'Учи по стария и по новия начин', 'Будителите', 'Предскажи'] });
  const SKY = 0xcfe6f7;
  const stage = createStage(shell.stageEl, { background: SKY, camPos: [0.5, 8, 13], target: [0, 0, -1.5], minDistance: 0.3, maxDistance: 40, maxPolarAngle: Math.PI * 0.49 });
  const { scene } = stage;
  // Тесен екран: изгледите се отдръпват, за да се вижда всичко.
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const view = (pos, tgt, dur = 1, k = far) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur);
  const named = {};
  const marker = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  const add = (obj, x, z, ry = 0) => { obj.position.set(x, 0, z); obj.rotation.y = ry; scene.add(obj); obj.updateMatrixWorld(true); return obj; };

  // ---------- земя, река, площад ----------
  const ground = new THREE.Mesh(new THREE.BoxGeometry(60, 0.1, 60), RM('grass', { rep: [24, 24] }));
  ground.position.y = -0.06; scene.add(ground);
  const RZ = 6.2;
  const water = new THREE.Mesh(new THREE.BoxGeometry(60, 0.02, 1.2), RM('water', { rep: [30, 1], rough: 0.25 }));
  water.position.set(0, -0.005, RZ); scene.add(water);
  const waterTex = water.material.map;
  for (const s of [-1, 1]) { const bank = new THREE.Mesh(new THREE.BoxGeometry(60, 0.14, 0.2), M(0xffffff, { tex: 'stone', rep: [40, 1] })); bank.position.set(0, 0.05, RZ + s * 0.7); scene.add(bank); }
  const cobble = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), RM('cobble', { rep: [Math.max(1, Math.round(w)), Math.max(1, Math.round(d))] })); m.position.set(x, 0.006, z); scene.add(m); };
  cobble(0, -0.3, 12, 2.4);
  cobble(1.5, 3.4, 1.2, 4.6);
  cobble(-7.3, -2.3, 1.2, 1.6);
  add(ms(humpBridge()), 1.5, RZ);
  add(ms(humpBridge({ span: 1.5 })), -8, RZ);

  // ---------- църква и килийно училище ----------
  add(ms(revivalChurch()), -7.3, -4.0);
  const tower = add(ms(bellTower(), ['bell']), -9.6, -2.6);
  add(ms(yardWall(4.0, { h: 0.35 })), -7.4, -5.6);
  const CX = -3.8, CZ = -2.7;
  const cell = add(ms(cellSchool({ w: 2.1, d: 1.5, h: 1.0 }), ['sandbox', 'psalter', 'lamp']), CX, CZ);
  named.cellA = marker('cellA', CX, 1.15, CZ);
  const cellW = (x, y, z) => cell.localToWorld(new THREE.Vector3(x, y, z));
  named.cellIn = marker('cellIn', ...cellW(0.35, 0.72, -0.45).toArray());

  // ---------- новото училище ----------
  const SX = 3.4, SZ = -2.8;
  const school = add(ms(newSchool(), ['board', 'map', 'cat', 'bell']), SX, SZ);
  named.schoolA = marker('schoolA', SX, 1.35, SZ + 0.4);
  const S = school.userData;
  const sw = (v) => new THREE.Vector3(v.x + SX, v.y, v.z + SZ);
  named.grp0 = marker('grp0', SX - 1.3, 0.78, SZ - 0.8);
  // „Рибният буквар“ на първия чин.
  const primer = book({ bg: '#2f5a8a', title: 'БУКВАРЪ', dolphin: true, w: 0.2, d: 0.15 });
  primer.position.copy(sw(new THREE.Vector3(0.55, 0.33, 0.04))); primer.rotation.x = 0.15; primer.rotation.y = 0.25; scene.add(primer);

  // ---------- къщи ----------
  const chimneys = [];
  const house = (x, z, ry, color, opts = {}) => {
    const h = add(ms(revivalHouse({ color, ...opts })), x, z, ry);
    chimneys.push(h.localToWorld(h.userData.chimney.clone()));
  };
  const BLUE = 0x3f6fae, OCHRE = 0xd9a441, RED = 0xb5533c, WHITE = 0xf1ece0, GREEN = 0x6f9a7a;
  house(-1.0, -7.6, 0, OCHRE);
  house(1.6, -7.8, 0, WHITE, { erker: false, w: 1.5 });
  house(7.4, -7.2, 0, RED);
  house(-10.4, 0.6, Math.PI / 2, BLUE, { w: 1.5 });
  house(9.2, 0.4, -Math.PI / 2, GREEN);
  house(-4.6, 3.0, Math.PI, RED, { w: 1.5 });
  house(-1.4, 3.2, Math.PI, BLUE, { erker: false, w: 1.4 });
  house(4.6, 3.1, Math.PI, OCHRE);
  house(7.6, 3.0, Math.PI, WHITE, { erker: false, w: 1.4 });
  add(ms(yardWall(1.8, { gate: true })), 6.0, -5.4);

  // ---------- природа ----------
  [[0, -16, 9, 4, 2.6, 30], [-16, -5, 4.5, 8, 2.0, 22], [16, -5, 4.5, 8, 2.2, 22], [-15, 14, 6, 4, 1.6, 14], [15, 15, 6, 4, 1.6, 14]].forEach(([x, z, rx, rz, h, n], i) => {
    const hl = ms(forestHill({ rx, rz, h, trees: n, seed: i + 5 })); hl.position.set(x, -0.05, z); scene.add(hl);
  });
  for (const [x, z, k] of [[-9.5, 7.6, 'l'], [-5, 7.5, 'p'], [5.5, 7.6, 'l'], [9.5, 7.8, 'p'], [-11, -6, 'p'], [11, -4, 'l'], [-4.6, -6.6, 'l'], [5.0, -6.2, 'p'], [-12, 3.5, 'l'], [12, 3.0, 'p']]) {
    const t = k === 'p' ? pine(1.3) : leafTree(1.4); t.position.set(x, 0, z); scene.add(t);
  }
  const clouds = [[-6, 9, -12], [7, 10, -14], [0, 11, -20]].map(([x, y, z]) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(1.3); scene.add(c); return c; });
  const flock = [];
  for (let i = 0; i < 6; i++) { const a = animal('sheep'); a.scale.setScalar(0.8); a.position.set(-10 + (i % 3) * 0.55, 0, 8.6 + Math.floor(i / 3) * 0.5); scene.add(a); flock.push(a); }
  graze(stage, flock, { r: 0.35, speed: 0.18 });
  const shepherd = fp('shepherd'); shepherd.position.set(-8.4, 0, 9.0); scene.add(shepherd);

  // ---------- хора на площада ----------
  const folk = [];
  [[-1.2, -0.4, 'man'], [-0.4, 0.2, 'woman'], [0.8, -0.2, 'gent'], [-5.6, 0.4, 'woman'], [6.2, -0.2, 'man'], [1.5, 2.6, 'man'], [-2.2, 1.0, 'girl']].forEach(([x, z, k]) => {
    const p = fp(k); p.position.set(x, 0, z); scene.add(p); folk.push(p);
  });
  wander(stage, folk, { r: 0.4, speed: 0.25 });
  const priest = fp('priest'); priest.position.set(-6.6, 0, -2.6); scene.add(priest);

  // ---------- килийното училище: даскал и деца ----------
  const cellTeacher = fp('priest', {}, true);
  cellTeacher.position.copy(cellW(0.02, 0.06, -0.4)); scene.add(cellTeacher);
  cellTeacher.userData.pickId = 'teacher'; addHitBox(cellTeacher, 0.4);
  const cellKids = [];
  [[0.05, 0.4], [0.3, 0.55], [-0.68, 0.3], [0.68, 0.45]].forEach(([lx, lz], i) => {
    const k = fp(i % 2 ? 'girl' : 'boy', { scale: 0.75 }); k.position.copy(cellW(lx, 0.02, lz)); k.rotation.y = Math.PI; k.scale.y *= 0.8; scene.add(k); cellKids.push(k);
  });
  // Героят: момче в червена риза със златен кръг под краката.
  const hero = fp('boy', { scale: 0.75, color: 0xc0392b }, true);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffc83a }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; hero.add(ring);
  scene.add(hero);
  const HB = hero.scale.x;
  const heroCell = () => { hero.position.copy(cellW(-0.29, 0.02, 0.42)); hero.rotation.y = Math.PI; hero.scale.set(HB, HB * 0.8, HB); };

  // ---------- новото училище: групи, помощници, чинове ----------
  const groupSlot = (gi, j) => {
    const gr = S.groups[gi];
    const tan = new THREE.Vector3(gr.n.z, 0, -gr.n.x);
    const a = (j - 2) * 0.55, r = 0.36;
    return sw(gr.c.clone().addScaledVector(gr.n, r * Math.cos(a) + 0.04).addScaledVector(tan, r * Math.sin(a)));
  };
  const lookAtXZ = (o, p) => { o.rotation.y = Math.atan2(p.x - o.position.x, p.z - o.position.z); };
  const schoolKids = [];
  const KC = [0xf2ede0, 0x9fb4c8, 0xd9c7a0, 0xb5c49a, 0xc89a8a];
  for (const gi of [0, 2]) for (let j = 0; j < 5; j++) {
    if (gi === 0 && j === 2) continue; // мястото на героя
    const k = fp(j % 2 ? 'girl' : 'boy', { scale: 0.8, color: j % 2 ? [0x8a2f4a, 0x2f4f7a][j % 2] : KC[j] });
    k.position.copy(groupSlot(gi, j)); lookAtXZ(k, sw(S.groups[gi].c)); scene.add(k); schoolKids.push(k);
  }
  for (let i = 0; i < 6; i++) {
    const dk = S.desks[3 + (i % 3)];
    const k = fp(i % 2 ? 'girl' : 'boy', { scale: 0.8, color: i % 2 ? 0x6a3a2a : KC[i % 5] });
    k.position.copy(sw(new THREE.Vector3(dk.position.x - 0.15 + Math.floor(i / 3) * 0.3, 0.06, dk.position.z + 0.2))); k.rotation.y = Math.PI; scene.add(k); schoolKids.push(k);
  }
  const helpers = [0, 2].map((gi, n) => {
    const gr = S.groups[gi];
    const h = fp('helper', { color: [0x2f5a8a, 0x3f6a3f][n] }, true);
    const tan = new THREE.Vector3(gr.n.z, 0, -gr.n.x);
    h.position.copy(sw(gr.c.clone().addScaledVector(tan, 0.22).addScaledVector(gr.n, 0.05)));
    h.lookAt(sw(gr.c.clone().addScaledVector(gr.n, 1)));
    scene.add(h); return h;
  });
  const teacher = fp('gent'); teacher.position.copy(sw(new THREE.Vector3(1.15, 0.06, 0.95))); teacher.rotation.y = -Math.PI / 2; scene.add(teacher);
  const heroSchool = () => { hero.position.copy(groupSlot(0, 2)); hero.scale.setScalar(HB); lookAtXZ(hero, sw(S.groups[0].c)); };

  // ---------- днешна класна стая с портретите (стъпка 3) ----------
  const ROOM_Z = 14;
  const room = new THREE.Group(); room.position.set(0, 0, ROOM_Z); room.visible = false; scene.add(room);
  const RW = 7.2, RD = 3.6, RH = 3.4;
  {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.06, RD), RM('plank', { rep: [7, 4] })); floor.position.y = 0.03; room.add(floor);
    const wallM = M(0xe9eedb, { rough: 0.95 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(RW, RH, 0.12), wallM); back.position.set(0, RH / 2, -RD / 2); room.add(back);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.5, 0.13), M(0x6f8f72)); panel.position.set(0, 0.25, -RD / 2 + 0.005); room.add(panel);
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, RH, RD), wallM); side.position.set(s * RW / 2, RH / 2, 0); room.add(side);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.8, 1.2), M(0xbcd8ec, { rough: 0.2 })); win.position.set(s * (RW / 2 - 0.07), 1.1, 0.2); room.add(win);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.06), M(0xffffff)); fr.position.set(s * (RW / 2 - 0.08), 1.1, 0.2); room.add(fr);
    }
    const cor = new THREE.Mesh(new THREE.BoxGeometry(RW + 0.1, 0.08, 0.2), M(0xd8cfb8)); cor.position.set(0, RH, -RD / 2); room.add(cor);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.34), canvasMat(1024, 102, (c, W, H) => {
      c.fillStyle = '#fff7e0'; c.fillRect(0, 0, W, H); c.strokeStyle = '#b0302a'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8);
      c.fillStyle = '#2a3a5a'; c.font = 'bold 46px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1 ноември — Ден на народните будители', W / 2, H / 2 + 2);
    }));
    banner.position.set(0, 2.05, -RD / 2 + 0.07); room.add(banner);
  }
  const PX = [-2.76, -1.38, 0, 1.38, 2.76];
  const portraitObj = {}, standTop = {};
  PEOPLE.forEach((p, i) => {
    const pic = new THREE.Mesh(new THREE.BoxGeometry(1.04, 1.3, 0.04), [M(0xb8902e), M(0xb8902e), M(0xb8902e), M(0xb8902e), canvasMat(300, 380, (c, W, H) => drawPortrait(c, W, H, p)), M(0xb8902e)]);
    pic.position.set(PX[i], 1.18, -RD / 2 + 0.09); room.add(pic);
    pic.userData.pickId = 'p-' + p.id; portraitObj[p.id] = pic;
    // Масичка пред портрета: тук се оставя делото.
    const st = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.42), RM('plank', { color: 0xc89a6a })); top.position.y = 0.42; st.add(top);
    for (const [x, z] of [[-0.26, -0.17], [0.26, -0.17], [-0.26, 0.17], [0.26, 0.17]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), M(0x6b4a2c)); l.position.set(x, 0.2, z); st.add(l); }
    st.position.set(PX[i], 0.06, -RD / 2 + 0.55); room.add(st);
    const drop = new THREE.Object3D(); drop.position.set(PX[i], 0.5, -RD / 2 + 0.55); drop.userData.dropId = p.id; room.add(drop);
    standTop[p.id] = new THREE.Vector3(PX[i], 0.5, ROOM_Z - RD / 2 + 0.55);
  });
  // Дълга маса отпред с делата.
  {
    const t = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.05, 0.7), RM('plank', { rep: [5, 1] })); t.position.set(0, 0.47, RD / 2 - 0.75); room.add(t);
    for (const x of [-2.8, 2.8]) for (const z of [-0.3, 0.3]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.44, 0.05), M(0x6b4a2c)); l.position.set(x, 0.25, RD / 2 - 0.75 + z); room.add(l); }
  }
  const deedObj = {};
  const DX = [-2.3, -1.15, 0, 1.15, 2.3], DZ = [0.12, -0.16, 0.12, -0.16, 0.12];
  const deedOrder = ['d-money', 'd-primer', 'd-teacher', 'd-history', 'd-nedelnik'];
  const makeDeed = (id) => ({
    'd-history': () => book({ bg: '#6a3a22', title: 'ИСТОРИЯ|СЛАВЯНО-|БОЛГАРСКАЯ' }),
    'd-nedelnik': () => book({ bg: '#7a1f2a', title: 'НЕДЕЛНИК' }),
    'd-primer': () => book({ bg: '#2f5a8a', title: 'БУКВАРЪ', dolphin: true }),
    'd-money': () => purse(),
    'd-teacher': () => letterBoard(),
  }[id]());
  DEEDS.forEach((d) => {
    const g = new THREE.Group();
    const m = makeDeed(d.id); g.add(m);
    const i = deedOrder.indexOf(d.id);
    const l = labelSprite(d.label, { size: 0.17 }); l.position.y = i % 2 ? 0.62 : 0.36; g.add(l); g.userData.label = l;
    g.position.set(DX[i], 0.5, ROOM_Z + RD / 2 - 0.75 + DZ[i]);
    g.userData = { dragId: d.id, home: g.position.clone(), label: l };
    addHitBox(g, 0.45);
    scene.add(g); g.visible = false; deedObj[d.id] = g;
  });

  // ---------- живот ----------
  smoke(stage, chimneys.slice(0, 7));
  stage.tick((dt, t) => {
    waterTex.offset.x -= dt * 0.05;
    tower.userData.bell.rotation.z = Math.sin(t * 0.8) * 0.12;
    S.bell.rotation.z = Math.sin(t * 1.3) * 0.08;
    cell.userData.lamp.material.emissiveIntensity = 0.8 + Math.sin(t * 9) * 0.25;
    cellKids.forEach((k, i) => { k.position.y = 0.02 + Math.abs(Math.sin(t * 2 + i)) * 0.01; });
    cellTeacher.userData.arms[1].rotation.x = -0.4 + Math.sin(t * 1.1) * 0.2;
    helpers.forEach((h, i) => { h.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 2.5 + i) * 0.25; });
    schoolKids.forEach((k, i) => { k.position.y = 0.06 + (i < 9 ? Math.abs(Math.sin(t * 1.6 + i)) * 0.008 : 0); });
    shepherd.rotation.y = Math.sin(t * 0.3) * 0.6;
    ring.material.color.setHSL(0.12, 1, 0.55 + Math.sin(t * 4) * 0.12);
    clouds.forEach((c, i) => { c.position.x = ((c.userData.x0 ??= c.position.x) + t * (0.12 + i * 0.03) + 30) % 60 - 30; });
  });

  // ---------- общи помощници ----------
  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.3, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let clickHandler = null, stopDrag = null, running = null;
  const extra = [];
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  // Кликаеми неща от стъпка 1.
  const itemObj = { cell: named.cellA, school: named.schoolA, teacher: cellTeacher, sand: cell.userData.sandbox, psalter: cell.userData.psalter, primer, board: S.board };
  const tablesHit = new THREE.Group(); tablesHit.position.set(SX - 1.0, 0.56, SZ - S.d / 2 + 0.15); scene.add(tablesHit);
  { const hb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.1), new THREE.MeshBasicMaterial({ visible: false })); tablesHit.add(hb); }
  itemObj.tables = tablesHit;
  for (const [id, o, s] of [['sand', cell.userData.sandbox, 0.35], ['psalter', cell.userData.psalter, 0.3], ['primer', primer, 0.3], ['tables', tablesHit, 0.3], ['board', S.board, 0.4]]) { o.userData.pickId = id; addHitBox(o, s); }
  S.map.userData.pickId = 'board'; addHitBox(S.map, 0.4);
  cell.userData.pickId = 'cell';
  school.userData.pickId = 'school';
  const CELL_VIEW = [[CX + 0.6, 1.3, CZ + 3.4], [CX, 0.35, CZ]];
  const CELL_CLOSE = [[CX + 0.3, 1.25, CZ + 2.0], [CX, 0.25, CZ + 0.1]];
  const SCHOOL_VIEW = [[SX, 1.85, SZ + 5.2], [SX, 0.4, SZ - 0.2]];
  const NEW_VIEW = [[SX - 0.7, 0.95, SZ + 1.1], [SX - 1.35, 0.3, SZ - 0.8]];
  const SCHOOL_CLOSE = [[SX + 0.5, 0.85, SZ + 1.05], [SX + 0.55, 0.3, SZ + 0.0]];
  const OVER = [[-1.0, 9.5, 12.5], [-1.0, 0, -2.6]];
  const ROOM_VIEW = [[0, 3.0, ROOM_Z + 5.6], [0, 0.85, ROOM_Z - 0.3]];
  const ITEM_VIEW = { cell: CELL_VIEW, teacher: CELL_CLOSE, sand: CELL_CLOSE, psalter: CELL_CLOSE, school: SCHOOL_VIEW, tables: SCHOOL_VIEW, primer: SCHOOL_CLOSE, board: [[SX - 0.5, 0.82, SZ + 1.0], [SX + 1.8, 0.5, SZ - 0.5]] };

  // ---------- 1. Опознай ----------
  const seen = new Set();
  const menu = cornerMenu(stage, { title: 'Разгледай', items: ITEMS.map((x) => ({ id: x.id, label: x.label, icon: x.icon })), onSelect: (id) => clickHandler && clickHandler(id) });
  function showItem(id) {
    const it = ITEMS.find((x) => x.id === id);
    if (!it) return;
    menu.setActive(id);
    const [p0, t0] = ITEM_VIEW[id];
    // Широк екран: менюто е вляво, затова мястото се показва малко вдясно от средата.
    const dx = far === 1 ? -0.22 * Math.hypot(p0[0] - t0[0], p0[1] - t0[1], p0[2] - t0[2]) : 0;
    view([p0[0] + dx, p0[1], p0[2]], [t0[0] + dx, t0[1], t0[2]], 1, id === 'primer' || id === 'board' ? Math.min(far, 1.2) : id === 'cell' || id === 'teacher' || id === 'sand' || id === 'psalter' ? Math.min(far, 1.3) : far);
    say(itemObj[id], `<b>${esc(it.label)}</b><br>${it.note}`, { cls: 'wide', lift: id === 'cell' || id === 'school' ? 0.5 : 0.3 });
    if (seen.has(id)) return;
    seen.add(id); menu.mark(id);
    shell.score(`Разгледани: ${seen.size} от ${ITEMS.length}`);
    if (seen.size === ITEMS.length) {
      const c = shell.setControls('<button class="btn primary">Напред →</button>');
      c.querySelector('button').addEventListener('click', () => { clearTip(); step2(); });
    }
  }
  function step1() {
    shell.step(0);
    scores.length = 0;
    seen.clear();
    menu.show(true);
    menu.setItems(ITEMS.map((x) => ({ id: x.id, label: x.label, icon: x.icon })));
    shell.task('Преди 200 години в едно българско градче има две училища: старо и ново. Детето в червено учи там. <b>Разгледай нещата от менюто.</b> Можеш да кликаш и в сцената.');
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${ITEMS.length}`);
    clickHandler = showItem;
    view(...OVER, 1.2);
  }

  // ---------- 2. Опит: един месец учене ----------
  const meterHtml = (n, title) => `<b>${esc(title)}</b><div style="display:flex;flex-wrap:wrap;gap:2px;max-width:236px;margin-top:3px">${[...ABC].map((ch, i) => `<span style="display:inline-block;width:14px;text-align:center;border-radius:3px;font-size:11px;${i < n ? 'background:#ffd54a;color:#2a1a00' : 'background:#eee;color:#bbb'}">${ch}</span>`).join('')}</div>`;
  function step2() {
    shell.step(1);
    menu.show(false);
    clickHandler = null;
    clearTip();
    heroCell();
    view(...OVER);
    const done = { old: false, new: false };
    let guess = null, mistakes = 0;
    shell.score('');
    shell.task('Детето ще учи един месец в старото училище и един месец в новото. <b>Къде ще научи повече букви?</b> Първо предположи.');
    const c = shell.setControls(`<div class="col">
      <button class="btn" data-p="old">В килийното училище</button>
      <button class="btn" data-p="new">В новото училище</button>
      <button class="btn" data-p="same">Еднакво</button></div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { guess = b.dataset.p; lab(); }));

    function lab() {
      shell.task('Сега провери. Пусни един месец във всяко училище и гледай колко букви научава детето.');
      const cc = shell.setControls(`<div class="col"><button class="btn r-old">📜 Месец в килийното училище</button>
        <button class="btn r-new">🏫 Месец в новото училище</button></div>`);
      cc.querySelector('.r-old').addEventListener('click', () => run('old'));
      cc.querySelector('.r-new').addEventListener('click', () => run('new'));
    }
    function run(way) {
      if (running) return;
      clearTip();
      shell.msg('');
      if (way === 'old') { heroCell(); view(...CELL_CLOSE, 1, Math.min(far, 1.3)); } else { heroSchool(); view(...NEW_VIEW, 1, Math.min(far, 1.2)); }
      const n = LEARN[way], DUR = 4;
      const anchor = way === 'old' ? named.cellIn : named.grp0;
      const meter = stage.bubble(anchor, meterHtml(0, `${WAY[way]} · Седмица 1 от 4`), { cls: 'tag', lift: 0.1 });
      let t0 = null;
      const arm = hero.userData.arms[1];
      running = stage.tick((dt, t) => {
        if (t0 === null) t0 = t;
        const k = Math.min(1, (t - t0) / DUR);
        const learned = Math.floor(k * n + 1e-6);
        meter.set(meterHtml(learned, `${WAY[way]} · Седмица ${Math.min(4, 1 + Math.floor(k * 4))} от 4`));
        if (way === 'old') {
          // Детето пише в пясъка и чака реда си; даскалът вика другите деца.
          arm.rotation.x = -0.9 + Math.sin(t * 6) * 0.25;
          const called = Math.floor(k * 8) % cellKids.length;
          cellKids.forEach((kd, i) => { kd.position.y = 0.02 + (i === called ? 0.06 : 0); });
        } else {
          // По-големият ученик сочи таблото; детето повтаря буквите с групата.
          arm.rotation.x = -0.4 + Math.sin(t * 3) * 0.3;
          hero.position.y = 0.06 + Math.abs(Math.sin(t * 4)) * 0.02;
        }
        if (k >= 1) {
          running(); running = null; meter.remove();
          arm.rotation.x = 0;
          done[way] = true;
          const why = way === 'old' ? 'Детето чака дълго реда си. Книгите са на стар, труден език.' : 'Детето учи по буквар на своя език. По-големият ученик му помага всеки ден.';
          say(anchor, `${meterHtml(n, `${WAY[way]}: ${n} букви за месец`)}<div style="margin-top:4px">${why}</div><span class="small">Числата са илюстрация, не точни данни.</span>`, { cls: 'wide', lift: 0.1 });
          shell.score(`Килийно: ${done.old ? LEARN.old + ' букви' : '?'} · Ново: ${done.new ? LEARN.new + ' букви' : '?'}`);
          if (done.old && done.new) ask();
        }
      });
    }
    function ask() {
      const right = guess === 'new';
      shell.task(`${right ? 'Предположението ти се потвърди.' : 'Опитът показа друго.'} <b>Защо в новото училище детето научава повече букви?</b>`);
      const cc = shell.setControls(`<div class="col">${WHY.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
      cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = WHY[+b.dataset.i];
        if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
        scores.push(stepScore(mistakes, 2));
        shell.msg('Вярно!', 'good');
        say(named.grp0, 'Така е. В новото училище един учител може да учи много деца. По-големите помагат на по-малките. Затова повече деца стават грамотни.', { cls: 'good wide', lift: 0.1 });
        const nx = shell.setControls('<button class="btn primary">Напред →</button>');
        nx.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
      }));
    }
  }

  // ---------- 3. Будителите ----------
  const placeAt = (p) => {
    if (Math.abs(p.z - (ROOM_Z - RD / 2 + 0.55)) > 0.9) return null;
    let best = null, bd = 0.6;
    PEOPLE.forEach((pp, i) => { const d = Math.abs(p.x - PX[i]); if (d < bd) { bd = d; best = pp.id; } });
    return best;
  };
  function step3() {
    shell.step(2);
    clickHandler = null;
    room.visible = true;
    for (const d of DEEDS) { const g = deedObj[d.id]; g.visible = true; g.userData.locked = false; g.position.copy(g.userData.home); g.scale.setScalar(1); g.userData.label.visible = true; }
    view(...ROOM_VIEW);
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Днес в много училища висят портретите на будителите. <b>Завлечи всяко дело при човека, който го е направил.</b>');
    shell.setControls('');
    shell.score(`Дела: 0 от ${DEEDS.length}`);
    say(named.roomA, 'Будителите „събуждат“ народа със знание. Портретите тук са опростени рисунки.', { cls: 'wide tag', lift: 0.2 });
    stopDrag = stage.enableDrag({
      planeY: 0.5,
      onDrop(obj) {
        const d = DEEDS.find((x) => x.id === obj.userData.dragId);
        const to = placeAt(obj.position);
        if (!to) { obj.position.copy(obj.userData.home); return; }
        const pp = PEOPLE.find((x) => x.id === to);
        if (to === d.who) {
          obj.userData.locked = true;
          obj.position.copy(standTop[to]); obj.scale.setScalar(0.85); obj.userData.label.visible = false;
          placed++;
          shell.score(`Дела: ${placed} от ${DEEDS.length}`);
          shell.msg('Вярно!', 'good');
          say(portraitObj[to], `<b>${esc(pp.name)}</b><br>${esc(pp.note)}`, { cls: 'good wide', lift: 0.65 });
          if (placed === DEEDS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 3));
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[d.id] = (tries[d.id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(tries[d.id] >= 2 ? d.hint : `Не е ${pp.name}. Опитай с друг портрет.`, 'bad');
        }
      },
    });
  }
  marker('roomA', 0, 2.1, ROOM_Z - RD / 2 + 0.2);

  // ---------- 4. Предскажи ----------
  const chest = new THREE.Group();
  {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.24), RM('plank', { color: 0xa07040 })); b.position.y = 0.11; chest.add(b);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.26), M(0x6b4a2c)); lid.position.y = 0.24; chest.add(lid);
    for (const x of [-0.12, 0.12]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.23, 0.25), M(0x3a3a3a, { metal: 0.5 })); s.position.set(x, 0.115, 0); chest.add(s); }
  }
  chest.position.set(SX - 1.2, 0, SZ + 1.75); scene.add(chest); chest.visible = false;
  named.chestA = chest;
  const visitors = [], newSchools = [];
  function step4() {
    shell.step(3);
    shell.score('');
    room.visible = false;
    for (const d of DEEDS) deedObj[d.id].visible = false;
    view([SX - 1.0, 2.6, SZ + 6.2], [SX - 1.0, 0.4, SZ + 0.6]);
    let mistakes = 0;
    shell.task('Да построиш училище и да платиш на учител струва много пари. <b>Защо хората дават пари за училище?</b>');
    ask(PREDICT1, () => {
      // Сцената показва какво наистина става: хората носят дарения за училището.
      chest.visible = true;
      const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
      [['gent', -2.0, 2.2], ['man', -0.6, 2.8], ['woman', 0.6, 2.5], ['man', -1.4, 3.4]].forEach(([k, x, z], i) => {
        const p = fp(k); p.position.set(x, 0, z); scene.add(p); visitors.push(p);
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 14), gold); coin.visible = false; scene.add(coin); visitors.push(coin);
        p.userData.coin = coin; p.userData.delay = i * 0.6;
      });
      let t0 = null;
      const goal = chest.position.clone().add(new THREE.Vector3(0, 0, 0.45));
      running = stage.tick((dt, t) => {
        if (t0 === null) t0 = t;
        let all = true;
        for (const p of visitors) {
          if (!p.userData.coin) continue;
          const tt = t - t0 - p.userData.delay;
          if (tt < 0) { all = false; continue; }
          const tg = goal.clone().add(new THREE.Vector3((visitors.indexOf(p) / 2 - 1.5) * 0.25, 0, 0.1));
          const d = tg.clone().sub(p.position); d.y = 0;
          const len = d.length();
          if (len > 0.05) { all = false; p.position.addScaledVector(d.normalize(), Math.min(len, dt * 1.2)); lookAtXZ(p, tg); p.position.y = Math.abs(Math.sin(t * 7)) * 0.02; }
          else if (!p.userData.paid) { p.userData.paid = t; p.userData.coin.visible = true; p.position.y = 0; }
          if (p.userData.paid) {
            const k = Math.min(1, (t - p.userData.paid) / 0.6);
            p.userData.coin.position.copy(chest.position).add(new THREE.Vector3(0, 0.55 - k * 0.3, 0));
            if (k >= 1) p.userData.coin.visible = false; else all = false;
          }
        }
        if (all && t - t0 > 1) { running(); running = null; }
      });
      say(named.chestA, '<b>Така е.</b> Хората искат децата им да са грамотни. Пари дават богати търговци като Васил Априлов, майсторите от еснафите и обикновени хора. Училищата се строят с парите на самите българи.', { cls: 'good wide', lift: 0.7 });
      shell.task('<b>Какво ще стане след училището в Габрово?</b>');
      ask(PREDICT2, () => {
        if (running) { running(); running = null; }
        clearTip();
        view(...OVER, 1.2);
        [[-12.5, -9.5, 0.5], [11.5, -10.5, -0.4], [-14, 9.5, 0.9], [13.5, 10, -0.9], [-3.5, -12.5, 0.1], [6, -13, -0.1]].forEach(([x, z, r], i) => {
          const s = ms(newSchool({ w: 3.0, d: 1.9 })); s.position.set(x, 0, z); s.rotation.y = r; s.scale.setScalar(0.001); s.userData.grow = i * 0.35; scene.add(s); newSchools.push(s);
        });
        let t0 = null;
        running = stage.tick((dt, t) => {
          if (t0 === null) t0 = t;
          let all = true;
          for (const s of newSchools) { const k = Math.max(0.001, Math.min(1, (t - t0 - s.userData.grow) / 0.8)); s.scale.setScalar(0.55 * k); if (k < 1) all = false; }
          if (all) { running(); running = null; }
        });
        say(named.schoolA, '<b>Вярно.</b> След Габрово нови училища се отварят в много градове и села. Все повече деца стават грамотни. Те четат книги и научават историята на своя народ.', { cls: 'good wide', lift: 0.6 });
        const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
        n.querySelector('button').addEventListener('click', () => {
          clearTip();
          scores.push(stepScore(mistakes, 2));
          shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart);
        });
      });
    });
    function ask(list, onRight) {
      const c = shell.setControls(`<div class="col">${list.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = list[+b.dataset.i];
        if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
        shell.msg('Вярно предсказание!', 'good');
        onRight();
      }));
    }
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    if (running) { running(); running = null; }
    clearTip();
    for (const o of [...extra, ...visitors, ...newSchools]) scene.remove(o);
    extra.length = 0; visitors.length = 0; newSchools.length = 0;
    chest.visible = false;
    room.visible = false;
    for (const d of DEEDS) { const g = deedObj[d.id]; g.visible = false; g.userData.locked = false; g.position.copy(g.userData.home); g.scale.setScalar(1); g.userData.label.visible = true; }
    heroCell();
    step1();
  }

  heroCell();
  step1();
  container.__demo = { stage, scene, menu, hero };
  return { dispose() { if (stopDrag) stopDrag(); if (running) running(); menu.remove(); stage.dispose(); } };
}
