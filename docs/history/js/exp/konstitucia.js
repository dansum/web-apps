// 4.1.1 „Търновската конституция: основният закон“ — Учредителното събрание в Търново през 1879 г.
// Стъпки: опознай залата и хората → извор: страниците на Конституцията (преразказ) и кое пише в нея
// → опит: сглоби държавата върху основния закон и виж как минава един закон → предскажи.
import { createStage, cornerMenu, labelSprite, mat, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { M, archGeo, gableRoof, column, rockHill } from './hist/architecture.js';
import { RM, hipRoof, revivalHouse, pine, leafTree, forestHill, folkPerson, mergeStatic } from './hist/revival.js';
import { smoke, cloud } from './hist/bulgar.js';
import { animal, graze } from './hist/thrace.js';
import { ruinWall } from './hist/city.js';
import { wander } from './hist/antiquity.js';
import { cart } from './hist/medieval.js';

const ms = (obj, keep = []) => mergeStatic(obj, keep);
const fp = (kind, opts = {}, arms = false) => { const p = folkPerson(kind, opts); return mergeStatic(p, arms ? p.userData.arms : []); };

const REC = '<span class="small">Възстановка.</span>';
// Стъпка 1: какво има за разглеждане. Всяко балонче казва кое е запазено и кое е възстановка.
const SPOTS = [
  { id: 'konak', label: 'Сградата на събранието', icon: '🏛️', open: false,
    note: `През 1879 г. Учредителното събрание заседава в Търново, в сградата на конака. Конак се нарича сградата на управата на града. Днес там има музей. <span class="small">Моделът е опростена възстановка.</span>` },
  { id: 'hall', label: 'Учредителното събрание', icon: '🪑', open: true,
    note: `В залата има депутати от цялото Княжество. Те започват работа през февруари 1879 г. Задачата им е да напишат и приемат основния закон на свободна България. ${REC}` },
  { id: 'antim', label: 'Председателят', icon: '✝️', open: true,
    note: `Председател на събранието е екзарх Антим I — главата на Българската църква. Той ръководи заседанията. ${REC}` },
  { id: 'debate', label: 'Спорът', icon: '🗣️', open: true,
    note: `Депутатите спорят. Едните искат по-силна власт за княза. Другите искат повече права и свобода за народа. Повечето решения са в полза на свободата. ${REC}` },
  { id: 'book', label: 'Конституцията', icon: '📜', open: true,
    note: `На 16 април 1879 г. събранието приема Конституцията. Тя е основният закон на държавата. Всички други закони трябва да са в съгласие с нея. За времето си тя е една от най-демократичните в Европа. ${REC}` },
  { id: 'tarnovo', label: 'Търново', icon: '🏰', open: false,
    note: 'Събранието е в Търново — старата столица на Второто българско царство. На хълма Царевец са руините на старата крепост. Затова Конституцията се нарича Търновска. <span class="small">Руините и къщите са опростена възстановка.</span>' },
  { id: 'people', label: 'Хората отвън', icon: '👥', open: false,
    note: `Пред сградата хората чакат новините. Едни носят народни дрехи, други — европейски, а много мъже — фес. Скоро ще имат права, записани в закона. ${REC}` },
];
// Стъпка 2: страниците на извора — преразказ на прост език, не дословен текст.
const PAGES = [
  { title: 'Държавата', text: 'България е княжество. Начело е князът, но и той трябва да спазва Конституцията. Народът избира свои представители — депутати в Народното събрание.' },
  { title: 'Законите', text: 'Новите закони се обсъждат и гласуват от Народното събрание. Князът ги потвърждава, а министрите и съдилищата ги прилагат.' },
  { title: 'Равенството', text: 'Всички български поданици са равни пред закона. Никой в България не може да продава или да купува хора.' },
  { title: 'Училище и свободи', text: 'Началното образование е безплатно и задължително. Печатът е свободен — хората могат да издават вестници и книги.' },
];
const CARDS = [
  { id: 'c-equal', label: 'Всички са равни пред закона', ok: true },
  { id: 'c-prince', label: 'Князът прави законите сам', ok: false, why: 'Прочети пак страница 2. Кой обсъжда и гласува законите?' },
  { id: 'c-vote', label: 'Законите се гласуват в Народното събрание', ok: true },
  { id: 'c-rich', label: 'Права имат само богатите', ok: false, why: 'Не. Пред закона всички са равни — и бедни, и богати.' },
  { id: 'c-school', label: 'Началното училище е задължително', ok: true },
  { id: 'c-slave', label: 'Никой не може да продава хора', ok: true },
  { id: 'c-noschool', label: 'Децата не ходят на училище', ok: false, why: 'Точно обратното. Виж страница 4.' },
];
// Стъпка 3: части на държавата и местата им върху основата.
const PARTS = [
  { id: 'b-assembly', label: 'Народно събрание', slot: 's-laws' },
  { id: 'b-prince', label: 'Княз и министри', slot: 's-rule' },
  { id: 'b-court', label: 'Съд', slot: 's-judge' },
];
const SLOTS = [
  { id: 's-laws', label: 'Гласува законите', dx: -1.3 },
  { id: 's-rule', label: 'Управлява по законите', dx: 0 },
  { id: 's-judge', label: 'Съди по законите', dx: 1.3 },
];
const WRONG = {
  'b-prince|s-laws': 'Князът не може сам да прави закони. Те се обсъждат и гласуват от депутатите.',
  'b-court|s-laws': 'Съдът не пише законите. Той съди по тях.',
  'b-assembly|s-rule': 'Събранието гласува законите, но страната се управлява всеки ден от княза и министрите.',
  'b-court|s-rule': 'Съдът не управлява страната. Той решава спорове по законите.',
  'b-assembly|s-judge': 'Депутатите не съдят хората. За това има съдилища.',
  'b-prince|s-judge': 'Съдът решава спорове по законите. Князът и министрите управляват.',
};
const Q1 = [
  { t: 'Ще бъде избран княз на България.', ok: true },
  { t: 'Конституцията ще бъде отменена.', ok: false, why: 'Защо биха я отменили? Конституцията тъкмо е приета и казва, че начело на държавата има княз.' },
  { t: 'Държавата ще остане без управник.', ok: false, why: 'Държавата има нужда от управление. Конституцията казва кой стои начело.' },
];
const Q2 = [
  { t: 'Да. И днес основният закон на България е Конституцията.', ok: true },
  { t: 'Не. Днес държавата живее без основен закон.', ok: false, why: 'Всяка демократична държава има основен закон. Помисли пак.' },
  { t: 'Да, и това е същата Търновска конституция, без промени.', ok: false, why: 'Търновската конституция действа до 1947 г. Днешната е друга, но идеята е същата.' },
];

// ---------- текстури с надпис ----------
const texMats = new Map();
function canvasMat(key, w, h, draw, extra = {}) {
  if (texMats.has(key)) return texMats.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, ...extra });
  texMats.set(key, m);
  return m;
}
// Страница от книга: редове „текст“ (не се четат — текстът е в балончето), инициал и номер.
function pageMat(n, side) {
  return canvasMat(`page${n}${side}`, 256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#f3e9cf'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(side === 'L' ? w : 0, 0, side === 'L' ? w - 40 : 40, 0);
    g.addColorStop(0, 'rgba(120,90,40,0.35)'); g.addColorStop(1, 'rgba(120,90,40,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8a2a20'; ctx.lineWidth = 3; ctx.strokeRect(18, 18, w - 36, h - 36);
    if (n === 0) {
      ctx.fillStyle = '#5a1a14'; ctx.font = 'bold 26px serif'; ctx.textAlign = 'center';
      ctx.fillText('КОНСТИТУЦИЯ', w / 2, 110); ctx.font = '20px serif'; ctx.fillText('1879', w / 2, 150);
      ctx.strokeStyle = '#8a2a20'; ctx.beginPath(); ctx.moveTo(60, 175); ctx.lineTo(w - 60, 175); ctx.stroke();
      return;
    }
    ctx.fillStyle = '#8a2a20'; ctx.font = 'bold 44px serif'; ctx.fillText(String(n), 34, 76);
    ctx.fillStyle = 'rgba(40,30,20,0.55)';
    for (let y = 100, i = 0; y < h - 50; y += 16, i++) ctx.fillRect(34 + (i % 5 === 0 ? 18 : 0), y, w - 68 - ((i * 37) % 50) - (i % 5 === 0 ? 18 : 0), 5);
    ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#5a4630'; ctx.fillText(`— ${n} —`, w / 2, h - 28);
  }, { side: THREE.DoubleSide });
}
function plaqueMat(text, { bg = '#e9dcbc', fg = '#4a2a14', w = 512, h = 128, size = 64 } = {}) {
  return canvasMat(`pl|${text}|${bg}`, w, h, (ctx) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,50,20,0.6)'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = fg; ctx.font = `bold ${size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}
const flagMat = () => canvasMat('flag', 96, 64, (ctx) => {
  [['#ffffff', 0], ['#00966e', 1], ['#d62612', 2]].forEach(([c, i]) => { ctx.fillStyle = c; ctx.fillRect(0, i * 64 / 3, 96, 64 / 3 + 1); });
}, { side: THREE.DoubleSide });

const B = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const PLASTER = () => M(0xf1e4c8, { rough: 0.95 });
const INNER = () => M(0xe9dbbb, { rough: 0.95 });
const WOODM = () => M(0x6b4a2c);
const WHITE = () => M(0xf6f2e8);

// Прозорец с рамка и кръст; гледа по +z.
function win(w, h) {
  const g = new THREE.Group();
  g.add(B(w + 0.06, h + 0.06, 0.03, WHITE()));
  const gl = B(w, h, 0.035, M(0x2f4252, { rough: 0.25 })); g.add(gl);
  const v = B(0.018, h, 0.045, WHITE()); g.add(v);
  const hz = B(w, 0.018, 0.045, WHITE()); hz.position.y = h * 0.18; g.add(hz);
  const sill = B(w + 0.12, 0.035, 0.08, M(0xffffff, { tex: 'limestone' })); sill.position.set(0, -h / 2 - 0.04, 0.03); g.add(sill);
  return g;
}

// ---------- конакът: двуетажна сграда; приземният етаж е залата на събранието ----------
// Лицето гледа по +z. Предната стена на залата е отделна група — скрива се, за да се види вътре.
function konak({ W = 6.4, D = 3.0, H1 = 1.2, H2 = 1.0 } = {}) {
  const shell = new THREE.Group();
  const front = new THREE.Group();
  const inside = new THREE.Group();
  const F = 0.12; // под на залата
  const lime = (rx, ry) => M(0xffffff, { tex: 'limestone', rep: [rx, ry] });
  const plinth = B(W + 0.1, F + 0.04, D + 0.1, M(0xffffff, { tex: 'stone', rep: [8, 1] })); plinth.position.y = (F + 0.04) / 2 - 0.02; shell.add(plinth);
  const floor = B(W - 0.2, 0.02, D - 0.2, RM('plank', { rep: [6, 3] })); floor.position.y = F + 0.01; inside.add(floor);
  // Задна и странични стени (отвътре — по-светли).
  const back = B(W, H1, 0.14, PLASTER()); back.position.set(0, F + H1 / 2, -D / 2 + 0.07); shell.add(back);
  const backIn = B(W - 0.28, H1, 0.01, INNER()); backIn.position.set(0, F + H1 / 2, -D / 2 + 0.145); inside.add(backIn);
  for (const s of [-1, 1]) {
    const sd = B(0.14, H1, D, PLASTER()); sd.position.set(s * (W / 2 - 0.07), F + H1 / 2, 0); shell.add(sd);
    const sdIn = B(0.01, H1, D - 0.28, INNER()); sdIn.position.set(s * (W / 2 - 0.145), F + H1 / 2, 0); inside.add(sdIn);
    for (const z of [-0.7, 0.7]) { const w = win(0.34, 0.55); w.rotation.y = s * Math.PI / 2; w.position.set(s * (W / 2 + 0.01), F + H1 * 0.55, z); shell.add(w); }
  }
  for (let i = 0; i < 5; i++) { const w = win(0.36, 0.56); w.position.set(-W / 2 + 0.9 + i * (W - 1.8) / 4, F + H1 * 0.55, -D / 2 - 0.01); w.rotation.y = Math.PI; shell.add(w); }
  // Ъгли от дялан камък.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 7; k++) {
    const q = B(0.2 + (k % 2) * 0.1, 0.28, 0.2 + ((k + 1) % 2) * 0.1, lime(1, 0.5)); q.position.set(sx * (W / 2 - 0.06), F + 0.14 + k * 0.31, sz * (D / 2 - 0.06)); shell.add(q);
  }
  // Предната стена на залата: аркади с прозорци и врата в средата.
  const bays = 7, bw = W / bays;
  for (let i = 0; i < bays; i++) {
    const x = -W / 2 + bw * (i + 0.5);
    const door = i === 3;
    const a = new THREE.Mesh(archGeo(bw, H1, 0.14, door ? 0.62 : 0.52), PLASTER()); a.position.set(x, F, D / 2 - 0.07); front.add(a);
    const fill = door ? B(bw * 0.62, H1, 0.05, RM('plank', { color: 0x9a6a40, rep: [2, 2] })) : B(bw * 0.52, H1 * 0.9, 0.03, M(0x2f4252, { rough: 0.25 }));
    fill.position.set(x, F + (door ? H1 / 2 : H1 * 0.45), D / 2 - 0.1); front.add(fill);
    if (!door) {
      const v = B(0.02, H1 * 0.75, 0.05, WHITE()); v.position.set(x, F + H1 * 0.42, D / 2 - 0.08); front.add(v);
      const hz = B(bw * 0.52, 0.02, 0.05, WHITE()); hz.position.set(x, F + H1 * 0.4, D / 2 - 0.08); front.add(hz);
      const sill = B(bw * 0.6, 0.04, 0.1, lime(1, 0.3)); sill.position.set(x, F + 0.18, D / 2 + 0.02); front.add(sill);
    } else {
      const step = B(bw * 0.9, 0.06, 0.4, lime(2, 0.5)); step.position.set(x, 0.03, D / 2 + 0.2); front.add(step);
    }
    // Ключов камък над арката.
    const key = B(0.1, 0.12, 0.05, lime(0.5, 0.5)); key.position.set(x, F + H1 - 0.2, D / 2 + 0.01); front.add(key);
  }
  const band = B(W + 0.1, 0.1, D + 0.1, lime(10, 0.3)); band.position.y = F + H1 + 0.05; shell.add(band);
  // Таван на залата с греди.
  const ceil = B(W - 0.28, 0.03, D - 0.28, RM('plank', { color: 0xc9a77a, rep: [6, 3] })); ceil.position.y = F + H1 - 0.02; inside.add(ceil);
  for (let i = 0; i < 7; i++) { const bm = B(0.06, 0.06, D - 0.3, WOODM()); bm.position.set(-W / 2 + 0.5 + i * (W - 1) / 6, F + H1 - 0.06, 0); inside.add(bm); }
  // Горен етаж.
  const y2 = F + H1 + 0.1;
  const up = B(W, H2, D, PLASTER()); up.position.y = y2 + H2 / 2; shell.add(up);
  for (let i = 0; i < 7; i++) {
    const x = -W / 2 + bw * (i + 0.5);
    if (i === 3) continue;
    const w = win(0.32, 0.52); w.position.set(x, y2 + H2 * 0.5, D / 2 + 0.01); shell.add(w);
    const lin = B(0.44, 0.06, 0.05, lime(1, 0.3)); lin.position.set(x, y2 + H2 * 0.5 + 0.34, D / 2 + 0.02); shell.add(lin);
    const wb = win(0.32, 0.52); wb.rotation.y = Math.PI; wb.position.set(x, y2 + H2 * 0.5, -D / 2 - 0.01); shell.add(wb);
  }
  // Средната издадена част с фронтон и балкон.
  const ris = B(1.3, H2 + 0.1, 0.22, PLASTER()); ris.position.set(0, y2 + (H2 + 0.1) / 2, D / 2 + 0.11); shell.add(ris);
  const bdoor = B(0.36, 0.66, 0.03, RM('plank', { color: 0x9a6a40 })); bdoor.position.set(0, y2 + 0.36, D / 2 + 0.23); shell.add(bdoor);
  const bal = B(1.0, 0.05, 0.36, lime(2, 0.5)); bal.position.set(0, y2 + 0.02, D / 2 + 0.38); shell.add(bal);
  for (let i = 0; i <= 10; i++) { const r = B(0.02, 0.24, 0.02, M(0x2a2a2a, { metal: 0.4 })); r.position.set(-0.48 + i * 0.096, y2 + 0.16, D / 2 + 0.54); shell.add(r); }
  const rail = B(1.0, 0.025, 0.025, M(0x2a2a2a, { metal: 0.4 })); rail.position.set(0, y2 + 0.28, D / 2 + 0.54); shell.add(rail);
  for (const s of [-1, 1]) { const br = B(0.06, 0.06, 0.32, lime(0.5, 0.5)); br.position.set(s * 0.42, y2 - 0.06, D / 2 + 0.36); shell.add(br); }
  const top = y2 + H2;
  const cor = B(W + 0.24, 0.08, D + 0.24, lime(10, 0.3)); cor.position.y = top + 0.04; shell.add(cor);
  const tri = new THREE.Shape([new THREE.Vector2(-0.75, 0), new THREE.Vector2(0.75, 0), new THREE.Vector2(0, 0.42)]);
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.1, bevelEnabled: false }), PLASTER()); ped.position.set(0, top + 0.08, D / 2 + 0.12); shell.add(ped);
  const ocul = new THREE.Mesh(new THREE.CircleGeometry(0.1, 18), M(0x2f4252, { rough: 0.3 })); ocul.position.set(0, top + 0.24, D / 2 + 0.225); shell.add(ocul);
  const roof = hipRoof(W + 0.5, D + 0.5, 0.95); roof.position.y = top + 0.08; shell.add(roof);
  const chims = [];
  for (const x of [-W * 0.3, W * 0.3]) { const c = B(0.16, 0.5, 0.16, M(0xffffff, { tex: 'stone' })); c.position.set(x, top + 0.6, -0.3); shell.add(c); chims.push(new THREE.Vector3(x, top + 0.9, -0.3)); }
  // Знаме над входа.
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), M(0x6b4a2c)); pole.position.set(0, top + 0.95, D / 2 + 0.17);
  pole.rotation.x = 0; shell.add(pole);
  const flagGeo = new THREE.PlaneGeometry(0.6, 0.4, 12, 4); flagGeo.translate(0.3, 0, 0);
  const flag = new THREE.Mesh(flagGeo, flagMat()); flag.position.set(0.015, top + 1.2, D / 2 + 0.17);

  // ---------- залата отвътре ----------
  const people = { deputies: [], secretaries: [] };
  const plat = B(0.9, 0.12, 2.0, RM('plank', { color: 0xb08a5a, rep: [2, 2] })); plat.position.set(-2.55, F + 0.06, 0); inside.add(plat);
  const table = new THREE.Group();
  const tt = B(0.4, 0.3, 1.6, M(0x2f5a3a, { rough: 1 })); tt.position.y = 0.15; table.add(tt);
  const tc = B(0.44, 0.02, 1.64, M(0x7a2a22)); tc.position.y = 0.31; table.add(tc);
  table.position.set(-2.3, F + 0.12, 0); inside.add(table);
  // Портрет и знаме зад председателя.
  const icon = B(0.02, 0.44, 0.34, plaqueMat('', { bg: '#c99a2e', w: 64, h: 64 })); icon.position.set(-W / 2 + 0.16, F + 0.8, 0); inside.add(icon);
  for (const z of [-0.85, 0.85]) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffb040, emissiveIntensity: 0.6 })); lamp.position.set(-W / 2 + 0.2, F + 0.95, z); inside.add(lamp); }
  // Книгата с Конституцията и листове върху масата.
  const book = new THREE.Group();
  const cover = B(0.2, 0.05, 0.28, M(0x7a1f1a)); cover.position.y = 0.025; book.add(cover);
  const pages = B(0.19, 0.035, 0.26, M(0xf2e8cc)); pages.position.set(0.004, 0.03, 0); book.add(pages);
  const gold = B(0.12, 0.052, 0.03, M(0xd4af37, { metal: 0.6, rough: 0.3 })); gold.position.set(0, 0.026, 0.06); book.add(gold);
  book.position.set(-2.25, F + 0.44, 0.15); book.rotation.y = 0.3; inside.add(book);
  for (const [z, r] of [[-0.45, 0.2], [-0.2, -0.1], [0.55, 0.15]]) { const p = B(0.16, 0.004, 0.22, M(0xf6f0e0)); p.position.set(-2.25, F + 0.425, z); p.rotation.y = r; inside.add(p); }
  const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.05, 8), M(0x1a1a1a)); ink.position.set(-2.2, F + 0.445, 0.4); inside.add(ink);
  // Трибуна на оратора.
  const trib = new THREE.Group();
  const tb = B(0.3, 0.42, 0.3, RM('plank', { color: 0xa07040 })); tb.position.y = 0.21; trib.add(tb);
  const tt2 = B(0.36, 0.03, 0.34, WOODM()); tt2.position.set(0, 0.43, 0); tt2.rotation.z = 0.15; trib.add(tt2);
  trib.position.set(-1.55, F, 0.85); inside.add(trib);
  // Пейки и банки на депутатите (лицето им — към председателя, по −x).
  const rows = [-0.75, -0.05, 0.65, 1.35, 2.05, 2.7];
  for (const rx of rows) for (const [z0, z1] of [[-1.25, -0.2], [0.2, 1.25]]) {
    const len = z1 - z0, zc = (z0 + z1) / 2;
    const desk = B(0.16, 0.26, len, RM('plank', { color: 0x9a6a40, rep: [1, 2] })); desk.position.set(rx - 0.18, F + 0.13, zc); inside.add(desk);
    const dtop = B(0.2, 0.02, len + 0.02, WOODM()); dtop.position.set(rx - 0.18, F + 0.27, zc); inside.add(dtop);
    const bench = B(0.14, 0.12, len, WOODM()); bench.position.set(rx + 0.12, F + 0.06, zc); inside.add(bench);
  }
  // Червена пътека по средата.
  const rug = B(4.0, 0.006, 0.34, RM('rug', { rep: [6, 1] })); rug.position.set(0.9, F + 0.024, 0); inside.add(rug);

  const g = new THREE.Group();
  ms(shell); ms(front); ms(inside, [book]);
  g.add(shell, front, inside, flag);
  g.userData = { shell, front, inside, book, trib, table, flag, chims, F, H1, W, D, rows, people, top };
  return g;
}

// ---------- малки модели за „сглоби държавата“ ----------
function partModel(id) {
  const g = new THREE.Group();
  const base = B(0.8, 0.05, 0.62, M(0xffffff, { tex: 'limestone', rep: [1, 1] })); base.position.y = 0.025; g.add(base);
  if (id === 'b-assembly') {
    const hall = B(0.66, 0.3, 0.46, PLASTER()); hall.position.y = 0.2; g.add(hall);
    for (let i = 0; i < 4; i++) { const a = B(0.08, 0.16, 0.01, M(0x2f4252)); a.position.set(-0.24 + i * 0.16, 0.2, 0.235); g.add(a); }
    const rf = hipRoof(0.78, 0.58, 0.22); rf.position.y = 0.35; g.add(rf);
    for (let i = 0; i < 3; i++) { const p = fp(i === 1 ? 'man' : 'gent', { scale: 0.32 }); p.position.set(-0.2 + i * 0.2, 0.05, 0.38); g.add(p); }
  } else if (id === 'b-prince') {
    const pal = B(0.66, 0.34, 0.44, M(0xe6c27a, { rough: 0.95 })); pal.position.y = 0.22; g.add(pal);
    for (let i = 0; i < 4; i++) { const w = B(0.07, 0.12, 0.01, M(0x2f4252)); w.position.set(-0.24 + i * 0.16, 0.24, 0.225); g.add(w); }
    const rf = hipRoof(0.78, 0.56, 0.18); rf.position.y = 0.39; g.add(rf);
    const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14, 1, true), gold); ring.position.y = 0.62; g.add(ring);
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), gold); const a = i / 5 * Math.PI * 2; c.position.set(Math.cos(a) * 0.08, 0.68, Math.sin(a) * 0.08); g.add(c); }
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), M(0xb0222a)); gem.position.set(0, 0.62, 0.09); g.add(gem);
  } else {
    const st = B(0.7, 0.05, 0.5, M(0xffffff, { tex: 'marble' })); st.position.y = 0.075; g.add(st);
    const cella = B(0.54, 0.3, 0.3, M(0xf2ede1)); cella.position.set(0, 0.25, -0.06); g.add(cella);
    for (let i = 0; i < 4; i++) { const c = column('doric', { h: 0.3, r: 0.025 }); c.position.set(-0.24 + i * 0.16, 0.1, 0.17); g.add(c); }
    const rf = gableRoof(0.7, 0.5, 0.14); rf.rotation.y = 0; rf.position.y = 0.4; g.add(rf);
    // Везни — знакът на правосъдието.
    const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), gold); post.position.y = 0.62; g.add(post);
    const beam = B(0.26, 0.012, 0.012, gold); beam.position.y = 0.7; g.add(beam);
    for (const s of [-1, 1]) { const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.015, 12), gold); pan.position.set(s * 0.12, 0.62, 0); g.add(pan); }
  }
  const l = labelSprite(PARTS.find((p) => p.id === id).label, { size: 0.2 });
  l.position.y = 0.95; g.add(l);
  g.userData.label = l;
  return g;
}
function card(id, label, size = 0.15) {
  const g = new THREE.Group();
  const b = B(size > 0.16 ? 2.3 : 1.9, 0.06, 0.48, M(0xfff4d6));
  const edge = B(size > 0.16 ? 2.35 : 1.95, 0.04, 0.53, M(0x9a6a40)); edge.position.y = -0.02;
  const l = labelSprite(label, { size });
  l.position.y = 0.3;
  g.add(edge, b, l);
  g.userData = { dragId: id };
  addHitBox(g, 0.6);
  return g;
}

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Учредителното събрание', 'Извор: Конституцията', 'Сглоби държавата', 'Предскажи'] });
  const stage = createStage(shell.stageEl, { background: 0xcfe6f7, camPos: [0, 7, 14], target: [0, 0.8, -1.5], minDistance: 1.5, maxDistance: 40, maxPolarAngle: Math.PI * 0.48 });
  const { scene } = stage;
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const narrow = aspect < 1;
  const view = (pos, tgt, dur = 1, k = far) => { stage.stopFollow(); stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur); };
  const named = {};
  const marker = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  const add = (obj, x, z, ry = 0, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; scene.add(obj); obj.updateMatrixWorld(true); return obj; };

  // ---------- земя, площад, река ----------
  const ground = B(70, 0.1, 70, RM('grass', { rep: [28, 28] })); ground.position.y = -0.05; scene.add(ground);
  const square = B(13, 0.03, 7.5, RM('cobble', { rep: [13, 7] })); square.position.set(0, 0.012, 1.2); scene.add(square);
  const street = B(1.6, 0.03, 10, RM('cobble', { rep: [2, 10] })); street.position.set(-7.3, 0.012, 9); scene.add(street);
  const water = B(70, 0.02, 2.2, RM('water', { rep: [35, 1], rough: 0.25 })); water.position.set(0, 0, -9.5); scene.add(water);
  const waterTex = water.material.map;
  for (const s of [-1, 1]) { const bank = B(70, 0.16, 0.25, M(0xffffff, { tex: 'stone', rep: [50, 1] })); bank.position.set(0, 0.05, -9.5 + s * 1.2); scene.add(bank); }

  // ---------- конакът ----------
  const KZ = -2.6;
  const kon = add(konak(), 0, KZ);
  const K = kon.userData;
  const kw = (x, y, z) => new THREE.Vector3(x, y, z + KZ); // от мерките на сградата към сцената
  K.shell.userData.pickId = 'konak';
  marker('konak', 0, 3.2, KZ + 1.5);
  marker('hall', 0.9, 0.7, KZ + 0.3);
  marker('debate', -1.55, 0.95, KZ + 0.85);
  marker('book', -2.25, 0.62, KZ + 0.15);
  marker('antim', -2.75, 0.95, KZ - 0.2);
  K.book.userData.pickId = 'book'; addHitBox(K.book, 0.35);

  // Председателят, секретарите, ораторът и депутатите.
  const antim = fp('priest', { scale: 1.05 }, true); antim.position.copy(kw(-2.75, K.F + 0.12, -0.2)); antim.rotation.y = Math.PI / 2; scene.add(antim);
  antim.userData.pickId = 'antim'; addHitBox(antim, 0.45);
  const secs = [-0.75, 0.6].map((z) => { const p = fp('gent', {}, true); p.position.copy(kw(-2.75, K.F + 0.12, z)); p.rotation.y = Math.PI / 2; scene.add(p); return p; });
  const speaker = fp('gent', { scale: 1.02 }, true); speaker.position.copy(kw(-1.75, K.F, 0.85)); speaker.rotation.y = Math.PI / 2; scene.add(speaker);
  K.trib.userData.pickId = 'debate'; speaker.userData.pickId = 'debate';
  const deputies = [];
  const KINDS = ['gent', 'man', 'gent', 'gent', 'priest', 'man', 'gent', 'man'];
  K.rows.forEach((rx, r) => [-1.05, -0.45, 0.45, 1.05].forEach((z, j) => {
    const k = KINDS[(r * 4 + j * 3) % KINDS.length];
    const p = fp(k, {}, true);
    p.position.copy(kw(rx + 0.12, K.F + 0.02, z)); p.rotation.y = -Math.PI / 2; p.scale.y *= 0.86;
    scene.add(p); deputies.push(p);
  }));

  // ---------- Търново наоколо ----------
  const chimneys = [...K.chims.map((v) => kw(v.x, v.y, v.z))];
  const BLUE = 0x3f6fae, OCHRE = 0xd9a441, RED = 0xb5533c, WHITEH = 0xf1ece0, GREEN = 0x6f9a7a;
  const house = (x, z, ry, color, opts = {}) => {
    const h = add(ms(revivalHouse({ color, ...opts })), x, z, ry);
    chimneys.push(h.localToWorld(h.userData.chimney.clone()));
    return h;
  };
  house(-7.4, 0.2, Math.PI / 2, BLUE); house(-7.4, 3.0, Math.PI / 2, OCHRE, { erker: false });
  house(7.4, 0.0, -Math.PI / 2, RED); house(7.4, 2.8, -Math.PI / 2, WHITEH, { erker: false });
  house(-5.2, -6.2, 0, GREEN, { w: 1.5 }); house(-2.6, -6.6, 0, OCHRE); house(2.8, -6.4, 0, WHITEH, { erker: false }); house(5.4, -6.1, 0, BLUE, { w: 1.5 });
  house(-9.6, 6.0, Math.PI / 2, RED, { w: 1.5 }); house(9.4, 6.2, -Math.PI / 2, OCHRE);
  house(-4.6, 7.4, Math.PI, WHITEH); house(4.6, 7.6, Math.PI, GREEN, { erker: false });
  // Царевец: скален хълм отвъд Янтра с руини на крепостни стени.
  const tsar = new THREE.Group();
  tsar.add(rockHill({ rx: 5.0, rz: 3.2, h: 2.2, wall: false }));
  for (const [x, z, len, ry, seed] of [[-2.6, 1.2, 3.2, 0.5, 1], [0.6, 2.1, 3.0, 0.1, 2], [3.2, 0.8, 2.6, -0.7, 3], [-0.5, -1.6, 4.0, 0.2, 4]]) {
    const w = ruinWall(len, { h: 0.6, t: 0.3, seed }); w.position.set(x, 2.2, z); w.rotation.y = ry; tsar.add(w);
  }
  const tw = ruinWall(0.9, { h: 1.1, t: 0.9, seed: 7, low: 0.6 }); tw.position.set(-1.2, 2.2, 0.4); tsar.add(tw);
  ms(tsar); add(tsar, -10, -15);
  tsar.userData.pickId = 'tarnovo';
  marker('tarnovo', -10, 3.6, -14);
  [[0, -22, 14, 5, 3.2, 30], [13, -16, 6, 6, 2.6, 18], [-22, -6, 6, 9, 2.4, 20], [22, -4, 6, 9, 2.6, 20], [-18, 16, 7, 5, 1.8, 12], [18, 16, 7, 5, 1.8, 12]].forEach(([x, z, rx, rz, h, n], i) => {
    const hl = ms(forestHill({ rx, rz, h, trees: n, seed: i + 5 })); hl.position.set(x, -0.05, z); scene.add(hl);
  });
  for (const [x, z, k] of [[-6, -8.0, 'l'], [-1, -8.1, 'l'], [3.5, -8.0, 'p'], [8, -7.9, 'l'], [-9.5, 3.5, 'p'], [9.6, 3.6, 'l'], [-6.2, 5.2, 'l'], [6.4, 5.4, 'p'], [-11, -2, 'l'], [11, -2, 'p']]) {
    const t = k === 'p' ? pine(1.3) : leafTree(1.4); t.position.set(x, 0, z); scene.add(t);
  }
  const clouds = [[-8, 9, -16], [6, 10, -18], [0, 11, -24], [14, 9, -12]].map(([x, y, z]) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(1.4); scene.add(c); return c; });
  smoke(stage, chimneys.slice(0, 10));
  // Каруца и кон на площада.
  const ct = add(ms(cart(), []), 6.8, 6.2, -0.4);
  void ct;
  const horse = animal('horse'); horse.scale.setScalar(0.8); horse.position.set(-6.2, 0, 6.4); scene.add(horse);
  graze(stage, [horse], { r: 0.25, speed: 0.15 });
  // Хората на площада.
  const crowd = [];
  [[-5.6, -0.4, 'man'], [-6.2, 0.3, 'woman'], [-5.1, 0.6, 'gent'], [-6.3, 1.3, 'boy'], [-5.5, 1.5, 'woman'], [5.6, -0.3, 'lady'], [6.3, 0.4, 'man'], [5.3, 0.6, 'gent'], [6.0, 1.3, 'girl'], [6.6, -0.6, 'man']].forEach(([x, z, k]) => {
    const p = fp(k); p.position.set(x, 0.03, z); p.userData.pickId = 'people'; scene.add(p); crowd.push(p);
  });
  marker('people', -5.8, 0.9, 0.5);
  wander(stage, crowd, { r: 0.35, speed: 0.22 });

  // ---------- извор: голямата книга (стъпка 2) ----------
  const EX = new THREE.Vector3(-3.3, 0, 1.4);
  const exhibit = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.8, 10), WOODM()); post.position.y = 0.4; exhibit.add(post);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.08, 16), M(0xffffff, { tex: 'limestone' })); foot.position.y = 0.04; exhibit.add(foot);
  const board = new THREE.Group(); board.position.y = 0.85; board.rotation.x = 0.5; exhibit.add(board);
  const coverB = B(1.62, 0.05, 1.08, M(0x7a1f1a)); board.add(coverB);
  const pageGeo = new THREE.PlaneGeometry(0.76, 1.0); pageGeo.rotateX(-Math.PI / 2);
  const leftPage = new THREE.Mesh(pageGeo, pageMat(0, 'L')); leftPage.position.set(-0.39, 0.035, 0); board.add(leftPage);
  const rightPage = new THREE.Mesh(pageGeo, pageMat(1, 'R')); rightPage.position.set(0.39, 0.035, 0); board.add(rightPage);
  const flipPivot = new THREE.Group(); flipPivot.position.y = 0.04; board.add(flipPivot);
  const flipGeo = pageGeo.clone(); flipGeo.translate(0.39, 0, 0);
  const flipPage = new THREE.Mesh(flipGeo, pageMat(1, 'R')); flipPivot.add(flipPage); flipPage.visible = false;
  const plq = B(0.9, 0.18, 0.03, plaqueMat('Извор: Конституцията', { size: 44 })); plq.position.set(0, 0.5, 0.13); exhibit.add(plq);
  exhibit.position.copy(EX); exhibit.userData.pickId = 'exhibit'; addHitBox(exhibit, 1.0);
  exhibit.visible = false; scene.add(exhibit);
  const bookRing = zoneRing(0xc49a3a, 1.15); bookRing.position.set(EX.x, 0.04, EX.z); bookRing.visible = false; scene.add(bookRing);
  named.exhibit = marker('exhibitA', EX.x, 1.2, EX.z);
  // Сегашната Конституция до старата (стъпка 4).
  const modern = new THREE.Group();
  const mstand = B(0.7, 0.6, 0.5, M(0xffffff, { tex: 'limestone' })); mstand.position.y = 0.3; modern.add(mstand);
  const mbook = B(0.42, 0.07, 0.56, M(0x1f3f6f)); mbook.position.y = 0.64; modern.add(mbook);
  const mband = B(0.44, 0.072, 0.1, M(0xd4af37, { metal: 0.6, rough: 0.3 })); mband.position.set(0, 0.64, 0.12); modern.add(mband);
  const ml = labelSprite('Конституция, 1991 г.', { size: 0.18 }); ml.position.y = 1.0; modern.add(ml);
  modern.position.set(EX.x + 1.5, 0, EX.z + 0.2); modern.visible = false; scene.add(modern);
  const cal = new THREE.Group();
  const calB = B(0.7, 0.5, 0.04, plaqueMat('16 април', { bg: '#fbf6ea', fg: '#b0222a', w: 256, h: 192, size: 56 })); calB.position.y = 1.2; cal.add(calB);
  const calTop = B(0.72, 0.1, 0.06, M(0xb0222a)); calTop.position.y = 1.48; cal.add(calTop);
  const calPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), WOODM()); calPost.position.y = 0.5; cal.add(calPost);
  cal.position.set(EX.x - 1.5, 0, EX.z + 0.2); cal.visible = false; scene.add(cal);

  // ---------- държавата върху основния закон (стъпка 3) ----------
  const SX = 3.3, SZ = 1.2;
  const statue = new THREE.Group();
  const slab = B(4.0, 0.3, 1.3, M(0xffffff, { tex: 'limestone', rep: [3, 1] })); slab.position.y = 0.15; statue.add(slab);
  const slabTxt = B(2.2, 0.2, 0.02, plaqueMat('КОНСТИТУЦИЯ', { bg: '#d9cdb2', fg: '#5a1a14' })); slabTxt.position.set(0, 0.15, 0.66); statue.add(slabTxt);
  const stepS = B(4.2, 0.08, 1.5, M(0xffffff, { tex: 'stone', rep: [4, 1] })); stepS.position.y = 0.04; statue.add(stepS);
  statue.position.set(SX, 0, SZ); statue.visible = false; scene.add(statue);
  const slotObjs = SLOTS.map((s) => {
    const r = zoneRing(0x2d5fa8, 0.42); r.position.set(SX + s.dx, 0.32, SZ); r.userData.slotId = s.id;
    const l = labelSprite(s.label, { size: 0.19, color: '#0a2a66' }); l.position.set(0, s.dx ? 0.22 : 0.62, s.dx ? 0.5 : 0.1); r.add(l);
    r.visible = false; scene.add(r); return r;
  });
  const roofG = new THREE.Group();
  const rTri = new THREE.Shape([new THREE.Vector2(-2.0, 0), new THREE.Vector2(2.0, 0), new THREE.Vector2(0, 0.6)]);
  const rPed = new THREE.Mesh(new THREE.ExtrudeGeometry(rTri, { depth: 1.0, bevelEnabled: false }), M(0xf2ede1)); rPed.position.z = -0.5; roofG.add(rPed);
  const rBeam = B(4.1, 0.12, 1.1, M(0xffffff, { tex: 'limestone', rep: [3, 1] })); rBeam.position.y = -0.06; roofG.add(rBeam);
  const rTxt = B(1.9, 0.26, 0.02, plaqueMat('Българското княжество', { bg: '#f2ede1', fg: '#2a3a6a', size: 40 })); rTxt.position.set(0, 0.2, 0.51); roofG.add(rTxt);
  roofG.position.set(SX, 3.5, SZ); roofG.visible = false; scene.add(roofG);
  const ROOF_Y = 1.0;
  const lawScroll = new THREE.Group();
  const scr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 10), M(0xf3e9cf)); scr.rotation.z = Math.PI / 2; lawScroll.add(scr);
  const seal = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M(0xb0222a)); seal.position.z = 0.06; lawScroll.add(seal);
  lawScroll.visible = false; scene.add(lawScroll);
  const citizens = [];
  ['man', 'woman', 'gent', 'girl', 'lady', 'shepherd', 'boy'].forEach((k, i) => {
    const p = fp(k); p.position.set(SX - 1.8 + i * 0.6, 0.03, SZ + 1.6); p.visible = false; scene.add(p); citizens.push(p);
  });

  // ---------- живот ----------
  const flagPos = K.flag.geometry.attributes.position;
  const flagX = Float32Array.from({ length: flagPos.count }, (_, i) => flagPos.getX(i));
  let deputiesVote = false;
  stage.tick((dt, t) => {
    waterTex.offset.x -= dt * 0.06;
    for (let i = 0; i < flagPos.count; i++) flagPos.setZ(i, Math.sin(flagX[i] * 9 - t * 4) * 0.05 * flagX[i] / 0.6);
    flagPos.needsUpdate = true;
    clouds.forEach((c, i) => { c.position.x = ((c.userData.x0 ??= c.position.x) + t * (0.12 + i * 0.03) + 30) % 60 - 30; });
    speaker.userData.arms[1].rotation.x = -1.1 + Math.sin(t * 2.2) * 0.45;
    speaker.userData.arms[0].rotation.x = -0.3 + Math.sin(t * 1.3) * 0.2;
    antim.userData.arms[1].rotation.x = -0.3 + Math.sin(t * 0.7) * 0.15;
    secs.forEach((s, i) => { s.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 6 + i) * 0.08; });
    deputies.forEach((d, i) => {
      const a = d.userData.arms[1];
      const want = deputiesVote ? -2.9 : (i % 5 === 0 ? -0.5 + Math.sin(t * 1.5 + i) * 0.3 : -0.15);
      a.rotation.x += (want - a.rotation.x) * Math.min(1, dt * 4);
      d.rotation.y = -Math.PI / 2 + Math.sin(t * 0.4 + i * 1.7) * 0.12;
    });
  });

  // ---------- общи помощници ----------
  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.3, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let clickHandler = null, stopDrag = null, menu = null, anim = null;
  const extra = [];
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  const openHall = (on) => { K.front.visible = !on; };
  const HALL_VIEW = [[0.2, 2.1, KZ + 6.0], [-0.4, 0.5, KZ]];
  const VIEWS = {
    konak: [[0, 4.2, 9.5], [0, 1.6, KZ]],
    hall: HALL_VIEW,
    antim: [[-0.6, 1.5, KZ + 3.0], [-2.4, 0.5, KZ]],
    debate: [[-0.2, 1.4, KZ + 3.2], [-1.7, 0.5, KZ + 0.4]],
    book: [[-1.2, 1.4, KZ + 2.2], [-2.25, 0.45, KZ + 0.1]],
    tarnovo: [[-3.5, 5.0, 2.0], [-10, 2.0, -14]],
    people: [[-2.6, 2.2, 5.0], [-5.8, 0.4, 0.4]],
  };
  const MAIN = [[0, 7, 14], [0, 0.8, -1.5]];
  const nextBtn = (label, fn) => { const c = shell.setControls(`<button class="btn primary">${label}</button>`); c.querySelector('button').addEventListener('click', fn); };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    openHall(false);
    view(...MAIN);
    shell.task('Търново, 1879 г. Тук се събират депутатите, за да приемат основния закон на свободна България. Разгледай всичко от менюто или кликни в сцената.');
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${SPOTS.length}`);
    const seen = new Set();
    const open = (id) => {
      const s = SPOTS.find((x) => x.id === id);
      if (!s) return;
      openHall(s.open);
      view(...VIEWS[id], 1, id === 'tarnovo' ? 1 : Math.min(far, 1.6));
      say(named[id], `<b>${esc(s.label)}</b><br>${s.note}`, { cls: 'wide', lift: 0.2 });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${SPOTS.length}`);
      if (seen.size === SPOTS.length) nextBtn('Напред →', () => { menu.show(false); clearTip(); step2(); });
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: SPOTS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })), onSelect: open });
    clickHandler = open;
  }

  // ---------- 2. Извор: Конституцията ----------
  let page = 0;
  function flipTo(n, done) {
    // Страницата се обръща отдясно наляво.
    flipPage.material = pageMat(n - 1, 'R'); flipPage.visible = true; flipPivot.rotation.z = 0;
    rightPage.material = pageMat(n, 'R');
    let k = 0;
    if (anim) anim();
    anim = stage.tick((dt) => {
      k = Math.min(1, k + dt * 2.2);
      flipPivot.rotation.z = Math.PI * k;
      if (k >= 1) { flipPage.visible = false; leftPage.material = pageMat(n - 1, 'L'); anim(); anim = null; done && done(); }
    });
  }
  function step2() {
    shell.step(1);
    shell.score('');
    clickHandler = null;
    openHall(false);
    exhibit.visible = true;
    page = 0;
    leftPage.material = pageMat(0, 'L'); rightPage.material = pageMat(1, 'R');
    view([EX.x + 0.2, 2.7, EX.z + 3.4], [EX.x, 0.75, EX.z + 0.3]);
    shell.task('Това е изворът — Конституцията. Прочети я страница по страница. <span class="small">Текстът е преразказ на прост език, не е дословен.</span>');
    const read = () => {
      if (page >= PAGES.length || anim) return;
      const p = PAGES[page];
      const n = page + 1;
      const show = () => {
        say(named.exhibit, `<b>Страница ${n}: ${esc(p.title)}</b><br>${esc(p.text)}<br><span class="small">Преразказ, не дословен текст.</span>`, { cls: 'wide', lift: 0.3 });
        shell.score(`Прочетени страници: ${n} от ${PAGES.length}`);
        if (n === PAGES.length) nextBtn('Кое пише в Конституцията? →', () => { clearTip(); sortCards(); });
        else { const c = shell.setControls('<button class="btn primary flip">Обърни страницата →</button>'); c.querySelector('.flip').addEventListener('click', read); }
      };
      page++;
      if (n === 1) show(); else flipTo(n, show);
    };
    clickHandler = (id) => { if (id === 'exhibit' && !anim && shell.controls.querySelector('.flip')) read(); };
    shell.setControls('<button class="btn primary flip">Отвори книгата</button>');
    shell.controls.querySelector('.flip').addEventListener('click', read);
  }
  function sortCards() {
    clickHandler = null;
    bookRing.visible = true;
    view([EX.x, 4.6, EX.z + 6.6], [EX.x, 0.3, EX.z + 2.0], 1, narrow ? Math.min(far, 1.35) : far);
    const cols = narrow ? 2 : 3;
    const cards = CARDS.map((c, i) => {
      const g = card(c.id, c.label, narrow ? 0.19 : 0.15);
      const col = i % cols, row = Math.floor(i / cols);
      const x = EX.x + (col - (cols - 1) / 2) * (narrow ? 2.4 : 2.05), z = EX.z + 1.75 + row * 0.66;
      g.position.set(x, 0.1, z); g.userData.home = g.position.clone();
      scene.add(g); extra.push(g); return g;
    });
    let mistakes = 0, placed = 0;
    const need = CARDS.filter((c) => c.ok).length;
    shell.task('Кое от тези неща пише в Конституцията? <b>Завлечи вярното в златния кръг при книгата.</b> Невярното остави.');
    shell.setControls('');
    shell.score(`В книгата: 0 от ${need}`);
    stopDrag = stage.enableDrag({
      planeY: 0.1,
      onDrop(obj) {
        const c = CARDS.find((x) => x.id === obj.userData.dragId);
        if (Math.hypot(obj.position.x - EX.x, obj.position.z - EX.z) > 1.3) { obj.position.copy(obj.userData.home); return; }
        if (!c.ok) {
          mistakes++;
          obj.position.copy(obj.userData.home);
          shell.msg(c.why + (mistakes >= 2 ? ' Подсказка: вярно е всичко, което дава права на всички хора.' : ''), 'bad');
          return;
        }
        obj.userData.locked = true;
        const a = placed * 1.25;
        obj.position.set(EX.x + Math.cos(a) * 0.95, 0.1 + placed * 0.02, EX.z + Math.sin(a) * 0.55 + 0.1);
        placed++;
        shell.score(`В книгата: ${placed} от ${need}`);
        shell.msg('Да, това пише в Конституцията.', 'good');
        if (placed === need) {
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 3));
          for (const o of cards) if (!o.userData.locked) o.visible = false;
          say(named.exhibit, 'Точно така. Конституцията дава права на <b>всички</b> граждани и казва кой какво прави в държавата.', { cls: 'good wide', lift: 0.3 });
          nextBtn('Напред →', () => { clearTip(); step3(); });
        }
      },
    });
  }

  // ---------- 3. Сглоби държавата ----------
  const parts = {};
  function step3() {
    shell.step(2);
    shell.score('');
    bookRing.visible = false;
    for (const o of extra) o.visible = false;
    statue.visible = true;
    slotObjs.forEach((r) => { r.visible = true; });
    view([SX, 3.3, SZ + 5.6], [SX, 0.5, SZ + 1.3], 1, Math.min(far, 1.25));
    const order = ['b-prince', 'b-court', 'b-assembly'];
    order.forEach((id, i) => {
      const g = parts[id] || (parts[id] = partModel(id));
      g.userData.dragId = id;
      if (!g.userData.hit) { g.userData.hit = addHitBox(g, 0.8); }
      const x = SX + (i - 1) * 1.3, z = SZ + 2.1;
      g.position.set(x, 0.03, z); g.userData.home = g.position.clone(); g.userData.locked = false; g.visible = true;
      scene.add(g);
    });
    let mistakes = 0, placed = 0;
    shell.task('Конституцията е основата на държавата. <b>Сложи всяка част на нейното място върху основата.</b> Кой гласува законите? Кой управлява? Кой съди?');
    shell.setControls('');
    stopDrag = stage.enableDrag({
      planeY: 0.05,
      onDrop(obj) {
        const p = PARTS.find((x) => x.id === obj.userData.dragId);
        const slot = slotObjs.find((r) => Math.hypot(obj.position.x - r.position.x, obj.position.z - r.position.z) < 0.6);
        if (!slot) { obj.position.copy(obj.userData.home); return; }
        if (slot.userData.slotId !== p.slot) {
          mistakes++;
          obj.position.copy(obj.userData.home);
          shell.msg(WRONG[`${p.id}|${slot.userData.slotId}`] + (mistakes >= 2 ? ' Подсказка: законите се гласуват от депутатите.' : ''), 'bad');
          return;
        }
        obj.userData.locked = true;
        obj.position.set(slot.position.x, 0.3, slot.position.z);
        slot.visible = false;
        placed++;
        shell.msg('Вярно!', 'good');
        if (placed === PARTS.length) {
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 2));
          showState();
        }
      },
    });
  }
  // Покривът слиза, гражданите идват и един закон минава през държавата.
  function showState() {
    roofG.visible = true; roofG.position.y = 3.5;
    citizens.forEach((c) => { c.visible = true; });
    const P = (id) => parts[id].position;
    const path = [
      [0.0, P('b-assembly'), 'Народното събрание обсъжда и гласува новия закон.'],
      [1.6, P('b-prince'), 'Князът потвърждава закона, а министрите управляват по него.'],
      [3.2, P('b-court'), 'Съдът съди по този закон.'],
      [4.8, new THREE.Vector3(SX, 0, SZ + 1.6), 'Законът важи еднакво за всички граждани.'],
    ];
    let t = 0, k = -1;
    lawScroll.visible = true;
    shell.task('Ето как изглежда държавата. Гледай как минава един нов закон.');
    shell.setControls('');
    if (anim) anim();
    anim = stage.tick((dt) => {
      t += dt;
      roofG.position.y = Math.max(ROOF_Y, 3.5 - t * 2.5);
      if (roofG.position.y < 2) for (const g of Object.values(parts)) g.userData.label.visible = false;
      const lt = t - 1.0;
      if (lt < 0) return;
      const i = Math.min(path.length - 1, Math.floor(lt / 1.6));
      const a = path[i][1], b = path[Math.min(path.length - 1, i + 1)][1];
      const f = Math.min(1, (lt - i * 1.6) / 1.2);
      lawScroll.position.set(a.x + (b.x - a.x) * f, 0.85 + Math.sin(f * Math.PI) * 0.3 - (i === path.length - 1 ? 0.3 : 0), a.z + (b.z - a.z) * f);
      if (i !== k) { k = i; say(lawScroll, `<b>${i + 1}.</b> ${esc(path[i][2])}`, { cls: 'wide', lift: 0.3 }); }
      citizens.forEach((c, j) => { c.position.y = 0.03 + (i === path.length - 1 ? Math.abs(Math.sin(lt * 5 + j)) * 0.04 : 0); });
      if (lt > path.length * 1.6) {
        anim(); anim = null;
        lawScroll.visible = false;
        say(roofG, 'Така е устроена държавата според Търновската конституция: всичко стои върху основния закон. И князът, и депутатите, и съдиите трябва да го спазват.', { cls: 'good wide', lift: 0.5 });
        nextBtn('Напред →', () => { clearTip(); step4(); });
      }
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    shell.score('');
    let mistakes = 0;
    openHall(true);
    view(...HALL_VIEW, 1, Math.min(far, 1.6));
    shell.task('16 април 1879 г. Конституцията е приета. Тя казва, че България е княжество. <b>Какво ще се случи на следващия ден?</b>');
    ask(Q1, () => {
      deputiesVote = true;
      say(named.hall, '<b>Точно така.</b> На 17 април 1879 г. Великото народно събрание избира за княз Александър I Батенберг. Той пристига в България по-късно същата година. <span class="small">Сцената е възстановка.</span>', { cls: 'good wide', lift: 0.3 });
      nextBtn('Напред →', () => {
        clearTip();
        deputiesVote = false;
        openHall(false);
        modern.visible = true; cal.visible = true;
        view([EX.x, 2.8, EX.z + 5.2], [EX.x, 0.8, EX.z]);
        shell.task('Търновската конституция действа много години. <b>Има ли България конституция и днес?</b>');
        ask(Q2, () => {
          say(named.exhibit, '<b>Да.</b> Търновската конституция действа до 1947 г. Днешната Конституция е приета през 1991 г. И тя казва, че всички са равни пред закона. На 16 април отбелязваме Деня на Конституцията.', { cls: 'good wide', lift: 0.6 });
          const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
          n.querySelector('button').addEventListener('click', () => {
            clearTip();
            scores.push(stepScore(mistakes, 2));
            shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart);
          });
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
    if (anim) { anim(); anim = null; }
    clearTip();
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    for (const g of Object.values(parts)) { g.visible = false; g.userData.locked = false; g.userData.label.visible = true; }
    deputiesVote = false;
    exhibit.visible = false; bookRing.visible = false; modern.visible = false; cal.visible = false;
    statue.visible = false; roofG.visible = false; lawScroll.visible = false;
    slotObjs.forEach((r) => { r.visible = false; });
    citizens.forEach((c) => { c.visible = false; });
    flipPage.visible = false; flipPivot.rotation.z = 0;
    if (menu) menu.remove();
    step1();
  }

  step1();
  // За тестовете: екранни координати на именувана точка.
  const at = (name) => {
    const o = name.startsWith('s-') ? slotObjs.find((r) => r.userData.slotId === name) : name === 'book' ? bookRing : named[name];
    const v = o.getWorldPosition(new THREE.Vector3()).project(stage.camera);
    const r = stage.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  };
  container.__demo = { stage, at, parts };
  return { dispose() { if (stopDrag) stopDrag(); if (anim) anim(); if (menu) menu.remove(); stage.dispose(); } };
}
