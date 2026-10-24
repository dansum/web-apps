// 3.1.2 „Свойства на материалите и тяхната употреба“ — уютна кухненска маса с предмети от различни материали.
// Стъпки: опознай материалите → три опита (светлина, вода, огъване) → избери материал за предмет → предскажи.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

// Предметите на масата. cell — какво се записва в таблицата; say — какво показва опитът.
const MATS = [
  { id: 'glass', label: 'Стъклена чаша', name: 'Стъкло', icon: '🥛', light: 'clear', water: 'fill', bend: 'no',
    cell: { light: 'Да', water: 'Не', bend: 'Не, чупливо' },
    note: 'Чашата е от <b>стъкло</b>. Стъклото е прозрачно — през него се вижда. Твърдо е, но е чупливо. От стъкло правим чаши, прозорци, буркани и очила.',
    say: {
      light: 'Светлината минава през стъклото и на екрана има светло петно. Стъклото е <b>прозрачно</b> — през него се вижда.',
      water: 'Водата остава в чашата и не изтича. Стъклото <b>не пропуска вода</b>.',
      bend: 'Стъклото е <b>твърдо</b> и не се огъва. Но е <b>чупливо</b> — ако падне, може да се счупи!' } },
  { id: 'metal', label: 'Метално канче', name: 'Метал', icon: '🥣', light: 'shadow', water: 'fill', bend: 'no',
    cell: { light: 'Не', water: 'Не', bend: 'Не, здраво' },
    note: 'Канчето е от <b>метал</b>. Металът е твърд и здрав, блести и не пропуска вода. От метал правим тенджери, лъжици, ключове и пирони.',
    say: {
      light: 'На екрана има сянка. Металът <b>не е прозрачен</b>.',
      water: 'Водата остава в канчето. Металът <b>не пропуска вода</b>.',
      bend: 'Металът е <b>твърд и здрав</b>. С ръце не можем да огънем канчето.' } },
  { id: 'wood', label: 'Дървено кубче', name: 'Дърво', icon: '🪵', light: 'shadow', water: 'off', bend: 'no',
    cell: { light: 'Не', water: 'Не', bend: 'Не, здраво' },
    note: 'Кубчето е от <b>дърво</b>. Дървото е твърдо и здраво, но е по-леко от метала. От дърво правим мебели, моливи и играчки.',
    say: {
      light: 'На екрана има сянка. Дървото <b>не е прозрачно</b>.',
      water: 'Водата се стича по кубчето. Дървото <b>не пропуска вода</b> (ако стои дълго във вода, малко я попива).',
      bend: 'Дървото е <b>твърдо и здраво</b> — кубчето не се огъва.' } },
  { id: 'plastic', label: 'Пластмасова бутилка', name: 'Пластмаса', icon: '🧴', light: 'shadow', water: 'off', bend: 'squeeze',
    cell: { light: 'Не', water: 'Не', bend: 'Да' },
    note: 'Бутилката е от <b>пластмаса</b>. Пластмасата е лека и не пропуска вода. Може да е твърда или мека, цветна или прозрачна. От нея правим бутилки, кофи и играчки.',
    say: {
      light: 'На екрана има сянка. Тази цветна пластмаса <b>не е прозрачна</b>. (Има и прозрачна пластмаса.)',
      water: 'Водата се стича по бутилката. Пластмасата <b>не пропуска вода</b>.',
      bend: 'Меката бутилка се <b>огъва</b>, когато я стиснем, и после си връща формата.' } },
  { id: 'rubber', label: 'Гумена топка', name: 'Гума', icon: '⚽', light: 'shadow', water: 'off', bend: 'squash',
    cell: { light: 'Не', water: 'Не', bend: 'Да, връща се' },
    note: 'Топката е от <b>гума</b>. Гумата се огъва, разтяга се и после си връща формата. Не пропуска вода. От гума правим топки, гуми за колела и ботуши.',
    say: {
      light: 'На екрана има сянка. Гумата <b>не е прозрачна</b>.',
      water: 'Водата се стича по топката. Гумата <b>не пропуска вода</b>.',
      bend: 'Гумата се <b>огъва</b> и после си <b>връща формата</b>. Казваме, че е еластична.' } },
  { id: 'fabric', label: 'Памучна кърпа', name: 'Плат', icon: '🧺', light: 'shadow', water: 'soak', bend: 'fold',
    cell: { light: 'Не', water: 'Да, попива', bend: 'Да' },
    note: 'Кърпата е от памучен <b>плат</b>. Платът е мек и гъвкав. Памукът попива вода — затова се бършем с памучна кърпа. От плат шием дрехи и завеси.',
    say: {
      light: 'На екрана има сянка. Дебелата кърпа <b>не е прозрачна</b>.',
      water: 'Кърпата <b>попива водата</b> и тя минава през нея. Платът <b>пропуска вода</b>.',
      bend: 'Платът е <b>мек и гъвкав</b> — сгъва се лесно.' } },
  { id: 'paper', label: 'Лист хартия', name: 'Хартия', icon: '📄', light: 'dim', water: 'soak', bend: 'fold',
    cell: { light: 'Малко', water: 'Да, попива', bend: 'Да, къса се' },
    note: 'Листът е от <b>хартия</b>. Хартията е лека и гъвкава, но лесно се къса и попива вода. На хартия пишем, рисуваме и печатаме книги.',
    say: {
      light: 'Петното е съвсем слабо. Тънката хартия пропуска <b>малко</b> светлина, но през нея не се вижда. Тя <b>не е прозрачна</b>.',
      water: 'Хартията <b>попива водата</b>, намокря се и омеква. Тя <b>пропуска вода</b>.',
      bend: 'Хартията се <b>огъва</b> лесно, но <b>не е здрава</b> — лесно се мачка и къса.' } },
];
const BY = Object.fromEntries(MATS.map((m) => [m.id, m]));

const TESTS = [
  { id: 'light', icon: '🔦', col: 'Прозрачно?', title: 'Прозрачно ли е?',
    task: 'Свети с <b>фенерчето</b> през всеки материал. Ако светлината минава и през него се вижда, материалът е <b>прозрачен</b>.',
    q: 'Кой материал пропусна светлината така, че през него се вижда?',
    a: ['Хартията', 'Стъклото', 'Металът', 'Платът'], right: 1,
    why: ['Хартията пропусна съвсем малко светлина — през нея не се вижда. Погледни таблицата.', '', 'Зад метала имаше сянка. Погледни таблицата.', 'Зад кърпата имаше сянка. Погледни таблицата.'] },
  { id: 'water', icon: '💧', col: 'Пропуска вода?', title: 'Пропуска ли вода?',
    task: 'Полей всеки материал с <b>вода</b>. Минава ли водата през него, или се стича и остава отгоре?',
    q: 'Кои материали пропуснаха вода?',
    a: ['Стъклото и металът', 'Платът и хартията', 'Гумата и пластмасата', 'Всички'], right: 1,
    why: ['Водата остана в чашата и в канчето — те не я пропуснаха.', '', 'Водата се стече по топката и по бутилката.', 'Не всички — погледни колоната с капката в таблицата.'] },
  { id: 'bend', icon: '✋', col: 'Огъва се?', title: 'Огъва ли се? Здраво ли е?',
    task: 'Опитай да <b>огънеш</b> всеки предмет с ръка. Твърд ли е? Гъвкав ли е? Връща ли си формата?',
    q: 'Кое е вярно?',
    a: ['Стъклото се огъва лесно.', 'Гумата се огъва и после си връща формата.', 'Металното канче е меко като плат.'], right: 1,
    why: ['Стъклото е твърдо — не се огъва, а при удар може да се счупи.', '', 'Металът е твърд и здрав — канчето не се огъна.'] },
];

// Стъпка 3: за какво ще използваме материала.
const USES = [
  { id: 'window', label: 'Прозорец', icon: '🪟', q: 'От какъв материал да е <b>прозорецът</b>, през който гледаме навън?', right: ['glass'],
    hint: 'Трябва материал, през който се вижда и който не пропуска дъжда.',
    no: { metal: 'През метала не се вижда навън — той не е прозрачен.', wood: 'През дървото не се вижда — то не е прозрачно.', plastic: 'Тази пластмаса не е прозрачна — няма да виждаме навън.',
      rubber: 'Гумата не е прозрачна — в стаята ще е тъмно.', fabric: 'Платът пропуска вода и през него не се вижда. Дъждът ще влезе вкъщи!', paper: 'Хартията ще се намокри от дъжда и ще се скъса.' },
    reasons: ['Стъклото е прозрачно и не пропуска вода.', 'Стъклото е меко и се огъва.', 'Стъклото попива дъжда.'], rr: 0 },
  { id: 'umbrella', label: 'Чадър', icon: '☂️', q: 'От какво да е <b>покривалото на чадъра</b>?', right: ['plastic'],
    hint: 'Трябва материал, който не пропуска вода, лек е и се сгъва.',
    no: { glass: 'Стъклото е тежко и чупливо, не се сгъва.', metal: 'Металът е тежък и не се сгъва — чадърът ще е много тежък.', wood: 'Дървото е твърдо и тежко — чадърът няма да се сгъва.',
      rubber: 'Гумата не пропуска вода, но е тежка. Има по-лек материал.', fabric: 'Памучният плат пропуска вода — спомни си опита! Ще се намокрим.', paper: 'Хартията пропуска вода и ще се скъса от дъжда.' },
    reasons: ['Пропуска вода, за да е прохладно.', 'Пластмасата (найлонът) не пропуска вода, лека е и се сгъва.', 'Пластмасата е прозрачна като стъкло.'], rr: 1,
    done: 'Покривалото на чадъра е от <b>найлон</b> — тънка пластмаса.' },
  { id: 'pot', label: 'Тенджера', icon: '🍲', q: 'От какво да направим <b>тенджерата</b>, в която готвим на котлона?', right: ['metal'],
    hint: 'Трябва материал, който е здрав и издържа на огъня.',
    no: { glass: 'Обикновеното стъкло може да се спука от силната топлина на котлона.', wood: 'Дървото гори! Не е за котлона.', plastic: 'Пластмасата се топи от силна топлина.',
      rubber: 'Гумата се топи и гори.', fabric: 'Платът пропуска вода и гори!', paper: 'Хартията пропуска вода и гори!' },
    reasons: ['Металът е прозрачен.', 'Металът попива супата.', 'Металът е здрав и издържа на силна топлина.'], rr: 2 },
  { id: 'boots', label: 'Ботуши', icon: '👢', q: 'От какво да са <b>ботушите</b> за дъжд и локви?', right: ['rubber', 'plastic'],
    hint: 'Трябва материал, който не пропуска вода и се огъва, когато вървим.',
    no: { glass: 'Стъклото е твърдо и чупливо — с такива ботуши не можем да вървим.', metal: 'Металът е твърд и тежък — ботушите няма да се огъват при ходене.',
      wood: 'Дървото не се огъва — ще е много неудобно да вървим.', fabric: 'Платът пропуска вода — краката ще се намокрят.', paper: 'Хартията ще се намокри и скъса в първата локва.' },
    reasons: ['Не пропуска вода и се огъва, когато вървим.', 'Пропуска вода, за да се охлаждат краката.', 'Твърд е и не се огъва.'], rr: 0,
    done: 'Ботушите за дъжд се правят от <b>гума</b> или от мека <b>пластмаса</b>.' },
  { id: 'book', label: 'Книга', icon: '📖', q: 'От какво да са <b>страниците на книгата</b>?', right: ['paper'],
    hint: 'Трябва лек и гъвкав материал, по който се пише и печата лесно.',
    no: { glass: 'Стъклото е тежко и чупливо, а страниците трябва да се разгръщат.', metal: 'Металът е тежък и твърд — страниците няма да се разгръщат.',
      wood: 'Дървото е твърдо и тежко — страниците няма да се обръщат.', plastic: 'По тази пластмаса трудно се пише с молив или химикалка.',
      rubber: 'Гумата е тежка и по нея трудно се пише.', fabric: 'По плата трудно се пише и рисува. (Има книжки от плат — за бебета.)' },
    reasons: ['Хартията не пропуска вода.', 'Хартията е лека и гъвкава, по нея се пише и печата лесно.', 'Хартията е най-здравият материал.'], rr: 1 },
];

function injectStyle() {
  if (document.getElementById('materials-style')) return;
  const s = document.createElement('style');
  s.id = 'materials-style';
  s.textContent = `
  .materials-q { margin:10px 0 4px; font-weight:700; }
  .materials-list { margin:6px 0 0; padding-left:20px; } .materials-list li { margin:2px 0; }
  .materials-list li.done { color:#0d7a3a; } .materials-list li.done::marker { content:"✓ "; font-weight:900; } .materials-list li.cur { font-weight:700; }
  .materials-tbl { width:100%; border-collapse:collapse; font-size:.78rem; margin-top:6px; }
  .materials-tbl td, .materials-tbl th { border-bottom:1px solid #e3e8ef; padding:2px 3px; text-align:left; }
  .materials-tbl td.y { color:#0d7a3a; font-weight:700; } .materials-tbl td.n { color:#b3261e; font-weight:700; }
  `;
  document.head.appendChild(s);
}

// ---------- текстури и материали ----------
function checkTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff8ee';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(110,160,226,0.4)';
  ctx.fillRect(0, 0, 64, 128);
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = 'rgba(70,120,200,0.3)';
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(9, 5);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glassMat = () => new THREE.MeshStandardMaterial({
  color: 0xe3f2ff, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide,
});
const liquidMat = (color, opacity = 0.78) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.15 });
const metalMat = () => mat(0xc9d1d8, { metalness: 0.8, roughness: 0.28 });

// ---------- съдове (от „Твърди тела, течности и газове“) ----------
const SHAPES = {
  glass: { floor: 0.06, depth: 1.45, t: 0.03, rin: () => 0.385 },
  mug: { floor: 0.05, depth: 0.62, t: 0.035, rin: () => 0.3 },
  jug: { floor: 0.06, depth: 1.35, t: 0.03, rin: (y) => 0.44 + 0.04 * (y / 1.35) },
};
function volumeOf(sh, h) {
  const n = 40;
  let v = 0;
  for (let i = 0; i < n; i++) v += Math.PI * sh.rin(((i + 0.5) / n) * h) ** 2 * (h / n);
  return v;
}
function heightFor(sh, V) {
  if (V <= 1e-5) return 0;
  let lo = 0;
  let hi = sh.depth;
  if (volumeOf(sh, hi) <= V) return hi;
  for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (volumeOf(sh, mid) < V) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
function wallGeo(sh) {
  const pts = [];
  const n = 12;
  const { floor, depth, t } = sh;
  pts.push(new THREE.Vector2(0, floor - t), new THREE.Vector2(sh.rin(0) + t, floor - t));
  for (let i = 0; i <= n; i++) { const y = (i / n) * depth; pts.push(new THREE.Vector2(sh.rin(y) + t, floor + y)); }
  pts.push(new THREE.Vector2(sh.rin(depth) + t * 0.5, floor + depth + 0.012));
  for (let i = n; i >= 0; i--) { const y = (i / n) * depth; pts.push(new THREE.Vector2(sh.rin(y), floor + y)); }
  pts.push(new THREE.Vector2(0, floor));
  return new THREE.LatheGeometry(pts, 32);
}
function liquidGeo(sh, h) {
  const pts = [new THREE.Vector2(0, 0)];
  for (let i = 0; i <= 8; i++) { const y = (i / 8) * h; pts.push(new THREE.Vector2(Math.max(0.001, sh.rin(y) - 0.006), y)); }
  pts.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(pts, 28);
}
function makeVessel(shapeName, { liquid = 0x64b5f6, wallMat = null } = {}) {
  const sh = SHAPES[shapeName];
  const g = new THREE.Group();
  const wall = new THREE.Mesh(wallGeo(sh), wallMat || glassMat());
  wall.renderOrder = 3;
  g.add(wall);
  const liq = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat(liquid));
  liq.position.y = sh.floor;
  liq.renderOrder = 1;
  liq.visible = false;
  g.add(liq);
  const lip = new THREE.Object3D();
  lip.position.set(sh.rin(sh.depth) + sh.t, sh.floor + sh.depth, 0);
  g.add(lip);
  g.userData.vessel = { sh, liq, vol: 0, h: 0, lip };
  return g;
}
function setVol(g, V) {
  const v = g.userData.vessel;
  v.vol = Math.max(0, V);
  const h = heightFor(v.sh, v.vol);
  if (Math.abs(h - v.h) < 1e-4 && v.liq.geometry.attributes.position) return;
  v.h = h;
  v.liq.geometry.dispose();
  v.liq.geometry = h > 0.004 ? liquidGeo(v.sh, h) : new THREE.BufferGeometry();
  v.liq.visible = h > 0.004;
}
function jugModel() {
  const g = makeVessel('jug');
  const sh = SHAPES.jug;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 20, Math.PI), glassMat());
  handle.rotation.z = Math.PI / 2;
  handle.position.set(-sh.rin(sh.depth) - 0.03, sh.floor + sh.depth * 0.55, 0);
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 12, 1, true), glassMat());
  spout.rotation.z = -Math.PI / 2 - 0.5;
  spout.position.set(sh.rin(sh.depth) + 0.05, sh.floor + sh.depth - 0.02, 0);
  g.add(handle, spout);
  setVol(g, volumeOf(sh, 1.0));
  return g;
}

// ---------- предметите ----------
// Всеки предмет стои с дъното си на y = 0. bendFn(k) показва огъването (0 — без огъване).
function materialModel(id) {
  const g = new THREE.Group();
  let bendFn = () => {};
  const wetMeshes = [];
  if (id === 'glass') {
    const v = makeVessel('glass');
    v.scale.setScalar(0.5);
    g.add(v);
    g.userData.vesselG = v;
  } else if (id === 'metal') {
    const m = metalMat();
    const v = makeVessel('mug', { wallMat: m });
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 18, Math.PI), m);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-0.33, 0.36, 0);
    v.add(handle);
    v.rotation.y = 2.4;
    g.add(v);
    g.userData.vesselG = v;
  } else if (id === 'wood') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat(0xd09a5e));
    b.position.y = 0.25;
    g.add(b);
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.BoxGeometry(0.505, 0.014, 0.505), mat(0xa8713a));
      ring.position.y = 0.08 + i * 0.12;
      g.add(ring);
    }
    g.rotation.y = 0.4;
  } else if (id === 'plastic') {
    const body = new THREE.Group();
    const pts = [[0, 0], [0.22, 0], [0.24, 0.04], [0.24, 0.5], [0.16, 0.66], [0.08, 0.72], [0.08, 0.78], [0, 0.78]].map(([x, y]) => new THREE.Vector2(x, y));
    const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), mat(0x26a69a, { roughness: 0.35 }));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 14), mat(0xf57c00));
    cap.position.y = 0.82;
    const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.2, 20, 1, true), mat(0xffffff));
    tag.position.y = 0.28;
    body.add(b, cap, tag);
    g.add(body);
    bendFn = (k) => { body.scale.set(1 - 0.28 * k, 1, 1 + 0.08 * k); };
  } else if (id === 'rubber') {
    const ball = new THREE.Group();
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.3, 22, 16), mat(0xe53935, { roughness: 0.55 }));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 30), mat(0xffd54f, { roughness: 0.55 }));
    band.rotation.x = Math.PI / 2 - 0.3;
    ball.add(s, band);
    ball.position.y = 0.3;
    g.add(ball);
    g.userData.ball = ball;
    bendFn = (k) => { ball.scale.set(1 + 0.18 * k, 1 - 0.38 * k, 1 + 0.18 * k); ball.position.y = 0.3 * (1 - 0.38 * k); };
  } else if (id === 'fabric' || id === 'paper') {
    const paper = id === 'paper';
    const W = paper ? 0.6 : 0.76;
    const H = paper ? 0.012 : 0.16;
    const D = paper ? 0.8 : 0.52;
    const halves = [-1, 1].map((s) => {
      const piv = new THREE.Group();
      const m = new THREE.Mesh(new THREE.BoxGeometry(W / 2, H, D), mat(paper ? 0xfafafa : 0xf5c84c, { roughness: 0.95 }));
      m.position.set((s * W) / 4, H / 2, 0);
      piv.add(m);
      wetMeshes.push(m);
      if (!paper) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(W / 2, H + 0.004, 0.06), mat(0x1e88e5, { roughness: 0.95 }));
        stripe.position.set((s * W) / 4, H / 2, D / 2 - 0.1);
        piv.add(stripe);
      } else {
        for (let i = 0; i < 4; i++) {
          const line = new THREE.Mesh(new THREE.BoxGeometry(W / 2 - 0.06, 0.002, 0.012), new THREE.MeshBasicMaterial({ color: 0x90caf9 }));
          line.position.set((s * W) / 4, H + 0.001, -0.25 + i * 0.15);
          piv.add(line);
        }
      }
      g.add(piv);
      return piv;
    });
    g.rotation.y = paper ? -0.35 : 0.25;
    bendFn = (k) => { halves[0].rotation.z = -0.95 * k; halves[1].rotation.z = 0.95 * k; };
  }
  g.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; });
  for (const m of wetMeshes) m.userData.dry = m.material.color.clone();
  g.userData.bendFn = bendFn;
  g.userData.wetMeshes = wetMeshes;
  return g;
}
function setWet(g, k) {
  for (const m of g.userData.wetMeshes) m.material.color.copy(m.userData.dry).multiplyScalar(1 - 0.38 * Math.min(1, k));
  if (g.userData.puddle) g.userData.puddle.scale.setScalar(Math.max(0.001, Math.min(1, k)));
}

// Фенерче, ръка, мече — помощни модели.
function flashlightModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 16), mat(0x37474f));
  body.rotation.z = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.18, 18), mat(0xfbc02d));
  head.rotation.z = -Math.PI / 2;
  head.position.x = 0.36;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), new THREE.MeshBasicMaterial({ color: 0xfff8d0 }));
  lens.rotation.y = Math.PI / 2;
  lens.position.x = 0.452;
  const btn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.06), mat(0xe53935));
  btn.position.set(0.05, 0.1, 0);
  g.add(body, head, lens, btn);
  g.userData.lens = lens;
  return g;
}
function handModel() {
  const g = new THREE.Group();
  const skin = mat(0xf2c09b, { roughness: 0.8 });
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.4), skin);
  g.add(palm);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.2, 4, 8), skin);
    f.rotation.x = Math.PI / 2;
    f.position.set(-0.13 + i * 0.087, -0.01, -0.3);
    g.add(f);
  }
  const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.14, 4, 8), skin);
  th.rotation.set(Math.PI / 2, 0, -0.9);
  th.position.set(0.24, -0.01, -0.05);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.3, 14), mat(0x5c6bc0));
  sleeve.rotation.x = Math.PI / 2;
  sleeve.position.z = 0.33;
  g.add(th, sleeve);
  return g;
}
function bearModel() {
  const g = new THREE.Group();
  const fur = mat(0xb07845, { roughness: 0.95 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), fur);
  body.scale.y = 1.1;
  body.position.y = 0.26;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), fur);
  head.position.y = 0.6;
  const muz = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0xe8c9a0));
  muz.position.set(0, 0.57, 0.15);
  g.add(body, head, muz);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), fur);
    ear.position.set(s * 0.12, 0.74, 0);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), mat(0x111111));
    eye.position.set(s * 0.06, 0.64, 0.15);
    g.add(ear, eye);
  }
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), liquidMat(0x42a5f5, 0.6));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.y = 0.012;
  puddle.scale.setScalar(0.001);
  g.add(puddle);
  g.userData.puddle = puddle;
  const wet = [body, head];
  for (const m of wet) m.userData.dry = m.material.color.clone();
  g.userData.wetMeshes = wet;
  return g;
}

// Модели за стъпка 3. fill — частите, които се оцветяват в избрания материал.
function useModel(id) {
  const g = new THREE.Group();
  const blank = () => new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.9 });
  const fill = [];
  const F = (geo) => { const m = new THREE.Mesh(geo, blank()); fill.push(m); return m; };
  if (id === 'window') {
    const pane = F(new THREE.BoxGeometry(1.3, 1.3, 0.03));
    pane.position.y = 0.95;
    g.add(pane);
    const fm = mat(0xffffff);
    for (const [w, h, x, y] of [[1.5, 0.1, 0, 1.65], [1.5, 0.1, 0, 0.25], [0.1, 1.5, -0.7, 0.95], [0.1, 1.5, 0.7, 0.95], [0.06, 1.3, 0, 0.95]]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), fm);
      f.position.set(x, y, 0);
      g.add(f);
    }
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.3), fm);
    sill.position.set(0, 0.16, 0.08);
    g.add(sill);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.5), mat(0xa47148));
    leg.position.y = 0.06;
    g.add(leg);
  } else if (id === 'umbrella') {
    const can = F(new THREE.ConeGeometry(0.95, 0.45, 8, 1, true));
    can.material.side = THREE.DoubleSide;
    can.position.y = 1.5;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8), mat(0x37474f));
    stick.position.y = 0.95;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 14, Math.PI), mat(0x6d4c41));
    hook.rotation.z = Math.PI;
    hook.position.set(0.1, 0.2, 0);
    g.add(can, stick, hook);
  } else if (id === 'pot') {
    const body = F(new THREE.CylinderGeometry(0.55, 0.5, 0.6, 24, 1, true));
    body.material.side = THREE.DoubleSide;
    body.position.y = 0.42;
    const bottom = F(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 24));
    bottom.position.y = 0.13;
    const lid = F(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 24));
    lid.position.y = 0.74;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(0x263238));
    knob.position.y = 0.8;
    g.add(body, bottom, lid, knob);
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.12), mat(0x263238));
      h.position.set(s * 0.65, 0.6, 0);
      g.add(h);
    }
    const stove = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 24), mat(0x424242));
    stove.position.y = 0.05;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 6, 30), new THREE.MeshBasicMaterial({ color: 0xff7043 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    g.add(stove, ring);
  } else if (id === 'boots') {
    for (const s of [-1, 1]) {
      const leg = F(new THREE.CylinderGeometry(0.17, 0.18, 0.75, 14));
      leg.position.set(s * 0.25, 0.48, 0);
      const foot = F(new THREE.CapsuleGeometry(0.15, 0.25, 4, 10));
      foot.rotation.x = Math.PI / 2;
      foot.position.set(s * 0.25, 0.14, 0.13);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.6), mat(0x37474f));
      sole.position.set(s * 0.25, 0.02, 0.1);
      g.add(leg, foot, sole);
    }
  } else if (id === 'book') {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.9), mat(0xc62828));
    cover.position.y = 0.03;
    const pages = F(new THREE.BoxGeometry(1.18, 0.18, 0.86));
    pages.position.set(0, 0.15, 0);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.05, 0.9), mat(0xc62828));
    top.position.y = 0.26;
    top.rotation.z = -0.5;
    top.position.x = 0.0;
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.9), mat(0x8e1b1b));
    spine.position.set(-0.62, 0.13, 0);
    g.add(cover, pages, spine);
    g.rotation.x = 0;
    g.position.y = 0;
  }
  g.userData.fill = fill;
  return g;
}
// Как изглежда готовият предмет в избрания материал.
function paintUse(g, matId) {
  const look = {
    glass: () => glassMat(),
    metal: () => metalMat(),
    plastic: () => new THREE.MeshStandardMaterial({ color: 0x1e88e5, roughness: 0.4, side: THREE.DoubleSide }),
    rubber: () => mat(0x2e7d32, { roughness: 0.6 }),
    paper: () => mat(0xfafafa, { roughness: 0.95 }),
  }[matId];
  for (const m of g.userData.fill) {
    const old = m.material;
    m.material = look ? look() : mat(0xffffff);
    if (old.side === THREE.DoubleSide) m.material.side = THREE.DoubleSide;
    old.dispose();
  }
}

// ---------- кухня (от „Твърди тела, течности и газове“) ----------
function buildKitchen(scene) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat(0xb98a5e));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.6;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), mat(0xfbeed7));
  wall.position.set(0, 3.5, -4.6);
  scene.add(wall);
  const tileC = document.createElement('canvas');
  tileC.width = tileC.height = 64;
  const tctx = tileC.getContext('2d');
  tctx.fillStyle = '#e9f3f1'; tctx.fillRect(0, 0, 64, 64);
  tctx.strokeStyle = '#c4dad6'; tctx.lineWidth = 3; tctx.strokeRect(1.5, 1.5, 61, 61);
  const tileTex = new THREE.CanvasTexture(tileC);
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(24, 3);
  tileTex.colorSpace = THREE.SRGBColorSpace;
  const tiles = new THREE.Mesh(new THREE.PlaneGeometry(24, 3), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.5 }));
  tiles.position.set(0, -0.2, -4.58);
  scene.add(tiles);
  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), mat(0xf6e3c6));
  sideWall.rotation.y = Math.PI / 2;
  sideWall.position.set(-9, 3.5, 6);
  scene.add(sideWall);

  const win = new THREE.Group();
  win.add(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ color: 0x9fd4ff })));
  const hill = new THREE.Mesh(new THREE.CircleGeometry(2.2, 30, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8bc34a }));
  hill.position.set(0.4, -1.1, 0.005);
  hill.scale.y = 0.35;
  win.add(hill);
  const clouds = [];
  for (let i = 0; i < 2; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.22 + k * 0.04, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      p.position.set(k * 0.25 - 0.25, (k % 2) * 0.08, 0.01);
      c.add(p);
    }
    c.position.set(-1 + i * 1.6, 0.55 - i * 0.35, 0);
    win.add(c);
    clouds.push(c);
  }
  const frameM = mat(0xffffff);
  for (const [w, h, x, y] of [[3.4, 0.12, 0, 1.12], [3.4, 0.12, 0, -1.12], [0.12, 2.36, 1.64, 0], [0.12, 2.36, -1.64, 0], [0.08, 2.2, 0, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameM);
    f.position.set(x, y, 0.04);
    win.add(f);
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.4), frameM);
  sill.position.set(0, -1.22, 0.15);
  win.add(sill);
  const curtains = [];
  for (const s of [-1, 1]) {
    const cu = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.6, 1, 8), new THREE.MeshStandardMaterial({ color: 0x81c784, side: THREE.DoubleSide, roughness: 0.9 }));
    cu.position.set(s * 2.05, -0.05, 0.12);
    win.add(cu);
    curtains.push(cu);
  }
  win.position.set(-2.4, 3.0, -4.55);
  scene.add(win);

  const clock = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), mat(0xffffff));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 32), mat(0x6d4c41));
  const hand = (len, w, c) => {
    const h = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.02), new THREE.MeshBasicMaterial({ color: c }));
    m.position.y = len / 2;
    h.add(m);
    h.position.z = 0.02;
    return h;
  };
  const hh = hand(0.25, 0.04, 0x333333);
  const mh = hand(0.38, 0.03, 0x333333);
  const sh = hand(0.42, 0.012, 0xe53935);
  clock.add(face, rim, hh, mh, sh);
  const pend = new THREE.Group();
  const rodP = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.8, 0.02), mat(0xc9a227));
  rodP.position.y = -0.4;
  const bob = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), mat(0xc9a227));
  bob.position.set(0, -0.85, 0.01);
  pend.add(rodP, bob);
  pend.position.set(0, -0.5, 0.01);
  clock.add(pend);
  clock.position.set(1.4, 3.6, -4.55);
  scene.add(clock);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.5), mat(0xa47148));
  shelf.position.set(5.6, 2.4, -4.3);
  scene.add(shelf);
  const jarCols = [0xffcc80, 0xef9a9a, 0xa5d6a7, 0x90caf9];
  for (let i = 0; i < 4; i++) {
    const j = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42 + (i % 2) * 0.12, 14), mat(jarCols[i], { roughness: 0.3 }));
    j.position.set(4.6 + i * 0.66, 2.45 + (0.21 + (i % 2) * 0.06), -4.3);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.06, 14), mat(0xd84b3a));
    lid.position.y = (0.42 + (i % 2) * 0.12) / 2 + 0.03;
    j.add(lid);
    scene.add(j);
  }

  const wood = mat(0xa8774d, { roughness: 0.7 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.22, 6.8), wood);
  top.position.y = -0.13;
  top.receiveShadow = true;
  scene.add(top);
  for (const [x, z] of [[-4.9, -3.0], [4.9, -3.0], [-4.9, 3.0], [4.9, 3.0]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 2.4, 10), wood);
    leg.position.set(x, -1.4, z);
    scene.add(leg);
  }
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 5.8), new THREE.MeshStandardMaterial({ map: checkTexture(), roughness: 0.95 }));
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = 0.004;
  cloth.receiveShadow = true;
  scene.add(cloth);

  const lamp = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.4, 5), mat(0x333333));
  cord.position.y = -1.2;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.45, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xffb74d, side: THREE.DoubleSide, roughness: 0.6 }));
  shade.position.y = -2.5;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff3c4 }));
  bulb.position.y = -2.68;
  lamp.add(cord, shade, bulb);
  lamp.position.set(0, 7.6, -0.6);
  scene.add(lamp);

  return (dt, t) => {
    for (const [i, c] of clouds.entries()) { c.position.x += dt * (0.06 + i * 0.03); if (c.position.x > 1.9) c.position.x = -1.9; }
    curtains.forEach((cu, i) => { cu.rotation.y = Math.sin(t * 0.6 + i) * 0.08; });
    const now = new Date();
    sh.rotation.z = -(now.getSeconds() + now.getMilliseconds() / 1000) / 60 * Math.PI * 2;
    mh.rotation.z = -(now.getMinutes() + now.getSeconds() / 60) / 60 * Math.PI * 2;
    hh.rotation.z = -((now.getHours() % 12) + now.getMinutes() / 60) / 12 * Math.PI * 2;
    pend.rotation.z = Math.sin(t * Math.PI) * 0.22;
    lamp.rotation.z = Math.sin(t * 0.5) * 0.015;
  };
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
  const STEPS = ['Опознай материалите', 'Опити с материалите', 'Кой материал е най-подходящ?', 'Предскажи и провери'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xf6e3c6, camPos: [0, 5.2, 8.6], target: [0, 0.6, 0], shadows: true, minDistance: 2.2, maxDistance: 16,
    maxPolarAngle: Math.PI * 0.42,
  });
  const { scene, camera } = stage;
  stage.controls.minAzimuthAngle = -1.05;
  stage.controls.maxAzimuthAngle = 1.05;
  stage.hemi.color.set(0xfff4e2);
  stage.sun.position.set(3, 10, 6);
  const kitchenTick = buildKitchen(scene);
  const narrow = camera.aspect < 1.15;
  const narrowUI = () => stage.renderer.domElement.clientWidth < 480;

  // ---- анимации ----
  const anims = new Set();
  function animate(dur, fn, done) { const a = { k: 0, dur, fn, done }; anims.add(a); return a; }
  const later = (sec, fn) => animate(sec, () => {}, fn);
  stage.tick((dt, t) => {
    kitchenTick(dt, t);
    for (const a of [...anims]) {
      a.k = Math.min(1, a.k + dt / a.dur);
      a.fn(a.k, dt);
      if (a.k >= 1) { anims.delete(a); if (a.done) a.done(); }
    }
  });
  function hop(obj, to, dur, done, height = 0.8) {
    const from = obj.position.clone();
    animate(dur, (k) => {
      obj.position.lerpVectors(from, to, ease(k));
      obj.position.y = from.y + (to.y - from.y) * ease(k) + Math.sin(k * Math.PI) * height;
    }, done);
  }

  // ---- изглед ----
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.5, dur = 1.0) {
    const d = Math.max(hw / (tanV * camera.aspect), hh / tanV) * 1.06;
    stage.stopFollow();
    stage.flyTo([c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d], c, dur);
  }
  const overview = (dur) => (narrow ? fitView([0, 0.7, 0.5], 3.3, 2.4, 0.62, dur) : fitView([0, 0.8, 0.2], 5.0, 2.3, 0.55, dur));

  // ---- разположение ----
  const ROW = narrow
    ? [[-2.4, 1.0], [-0.8, 1.0], [0.8, 1.0], [2.4, 1.0], [-1.6, 2.3], [0, 2.3], [1.6, 2.3]]
    : MATS.map((_, i) => [-3.9 + i * 1.3, 1.6]);
  const SP = narrow ? new V3(-1.3, 0.06, -1.0) : new V3(-1.3, 0.06, -1.0); // мястото за опитите
  const BOARD = narrow ? [1.75, -1.9] : [2.75, -1.9];

  // ---- предметите ----
  const objs = new Map();
  MATS.forEach((m, i) => {
    const g = materialModel(m.id);
    g.position.set(ROW[i][0], 0, ROW[i][1]);
    g.userData.home = g.position.clone();
    g.userData.homeRot = g.rotation.clone();
    g.userData.pickId = m.id;
    const lbl = labelSprite(m.name, { size: 0.22 });
    const box = new THREE.Box3().setFromObject(g);
    lbl.position.y = box.max.y + 0.25;
    g.add(lbl);
    stage.steadyLabel(lbl, 9);
    g.userData.top = lbl.position.y + 0.25;
    addHitBox(g, 0.8);
    scene.add(g);
    objs.set(m.id, g);
  });

  // ---- място за опити: поднос, фенерче, екран, кана, ръка ----
  const station = new THREE.Group();
  scene.add(station);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.1), mat(0x90a4ae, { roughness: 0.4, metalness: 0.3 }));
  tray.position.set(SP.x, 0.03, SP.z);
  tray.receiveShadow = true;
  station.add(tray);
  const spotAnchor = new THREE.Object3D();
  spotAnchor.position.set(SP.x, 0.1, SP.z);
  station.add(spotAnchor);
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.6, 28), liquidMat(0x64b5f6, 0.55));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(SP.x, 0.065, SP.z);
  puddle.scale.setScalar(0.001);
  station.add(puddle);
  const flash = flashlightModel();
  flash.position.set(SP.x - 1.55, 0.35, SP.z);
  station.add(flash);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.24), mat(0x8d6e63));
  stand.position.set(SP.x - 1.6, 0.13, SP.z);
  station.add(stand);
  const screen = new THREE.Group();
  const scr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 1.1), mat(0xffffff, { roughness: 0.9 }));
  scr.position.y = 0.7;
  const scrFoot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.8), mat(0x8d6e63));
  scrFoot.position.y = 0.03;
  screen.add(scr, scrFoot);
  screen.position.set(SP.x + 1.25, 0, SP.z);
  station.add(screen);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.3, 28), new THREE.MeshBasicMaterial({ color: 0xfff176, transparent: true, opacity: 0 }));
  spot.rotation.y = -Math.PI / 2;
  spot.position.set(SP.x + 1.215, 0.5, SP.z);
  station.add(spot);
  const shade = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color: 0x546e7a, transparent: true, opacity: 0 }));
  shade.rotation.y = -Math.PI / 2;
  shade.position.set(SP.x + 1.212, 0.5, SP.z);
  station.add(shade);
  const beamMat = () => new THREE.MeshBasicMaterial({ color: 0xfff59d, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const beam1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.25, 1, 18, 1, true), beamMat());
  beam1.rotation.z = Math.PI / 2;
  const beam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 1, 18, 1, true), beamMat());
  beam2.rotation.z = Math.PI / 2;
  station.add(beam1, beam2);
  const jug = jugModel();
  jug.scale.setScalar(0.42);
  jug.visible = false;
  station.add(jug);
  const handG = handModel();
  handG.visible = false;
  station.add(handG);
  for (const [o, text, y] of [[flash, 'Фенерче', 0.45], [screen, 'Екран', 1.55]]) {
    const l = labelSprite(text, { size: 0.2 });
    l.position.y = y;
    o.add(l);
    stage.steadyLabel(l, 9);
  }
  station.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; });

  // ---- таблица с резултатите (дъска на статив) ----
  const board = new THREE.Group();
  const bc = document.createElement('canvas');
  bc.width = 900; bc.height = 520;
  const bctx = bc.getContext('2d');
  const btex = new THREE.CanvasTexture(bc);
  btex.colorSpace = THREE.SRGBColorSpace;
  btex.anisotropy = 4;
  const bw = narrow ? 2.9 : 3.6; const bh = bw * (520 / 900);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: btex }));
  face.position.set(0, 0.45 + bh / 2, 0.03);
  const back = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.12, bh + 0.12, 0.05), mat(0x8d6e63));
  back.position.set(0, 0.45 + bh / 2, 0);
  board.add(face, back);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.6 + bh, 0.07), mat(0x6d4c41));
    leg.position.set(s * (bw / 2 - 0.2), (0.6 + bh) / 2, -0.05);
    board.add(leg);
  }
  const rear = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.6 + bh, 0.07), mat(0x6d4c41));
  rear.position.set(0, (0.6 + bh) / 2 - 0.05, -0.5);
  rear.rotation.x = 0.35;
  board.add(rear);
  board.position.set(BOARD[0], 0, BOARD[1]);
  board.rotation.y = narrow ? -0.22 : -0.16;
  scene.add(board);
  const results = { light: {}, water: {}, bend: {} };
  function drawBoard() {
    const c = bctx;
    c.fillStyle = '#25443a'; c.fillRect(0, 0, 900, 520);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
    const cols = [16, 210, 430, 690];
    c.font = 'bold 24px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
    c.fillStyle = '#ffffff';
    c.textBaseline = 'middle';
    c.fillText('Материал', cols[0], 36);
    TESTS.forEach((t, i) => { c.fillText(`${t.icon} ${t.col}`, cols[i + 1] - 4, 36); });
    c.beginPath(); c.moveTo(10, 66); c.lineTo(890, 66); c.stroke();
    MATS.forEach((m, r) => {
      const y = 98 + r * 60;
      c.font = 'bold 32px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
      c.fillStyle = '#fff8e1';
      c.fillText(m.name, cols[0], y);
      TESTS.forEach((t, i) => {
        const v = results[t.id][m.id];
        c.font = (v ? 'bold ' : '') + '30px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
        c.fillStyle = !v ? 'rgba(255,255,255,0.35)' : v.startsWith('Да') ? '#a5f3b5' : v.startsWith('Не') ? '#ffb4a8' : '#ffe082';
        c.fillText(v || '?', cols[i + 1] + 4, y);
      });
      if (r < MATS.length - 1) { c.beginPath(); c.moveTo(10, y + 30); c.lineTo(890, y + 30); c.stroke(); }
    });
    btex.needsUpdate = true;
  }
  drawBoard();
  const boardLbl = labelSprite('Таблица с опитите', { size: 0.22 });
  boardLbl.position.y = 0.6 + bh + 0.2;
  board.add(boardLbl);
  stage.steadyLabel(boardLbl, 9);
  function tableHTML() {
    if (!narrowUI()) return '';
    return `<table class="materials-tbl"><tr><th></th>${TESTS.map((t) => `<th>${t.icon}</th>`).join('')}</tr>${MATS.map((m) => `<tr><td>${esc(m.name)}</td>${TESTS.map((t) => {
      const v = results[t.id][m.id];
      return `<td class="${!v ? '' : v.startsWith('Да') ? 'y' : v.startsWith('Не') ? 'n' : ''}">${esc(v || '?')}</td>`;
    }).join('')}</tr>`).join('')}</table>`;
  }

  // ---- капки вода ----
  const drops = [];
  const dropGeo = new THREE.SphereGeometry(0.035, 8, 6);
  for (let i = 0; i < 40; i++) {
    const d = new THREE.Mesh(dropGeo, liquidMat(0x42a5f5, 0.9));
    d.visible = false;
    d.userData = { v: new V3(), phase: 'fall' };
    scene.add(d);
    drops.push(d);
  }
  let dropCtl = null; // { obj, mode, top, bottom, rim }
  function spawnDrop(pos, phase = 'fall', vx = 0) {
    const d = drops.find((x) => !x.visible);
    if (!d) return;
    d.position.copy(pos);
    d.userData.v.set(vx, 0, 0);
    d.userData.phase = phase;
    d.scale.set(1, 1.3, 1);
    d.visible = true;
  }
  stage.tick((dt) => {
    for (const d of drops) {
      if (!d.visible) continue;
      const u = d.userData;
      u.v.y -= 9 * dt;
      d.position.addScaledVector(u.v, dt);
      const c = dropCtl;
      if (c && u.phase === 'fall' && d.position.y <= c.top) {
        if (c.mode === 'fill') {
          if (d.position.y <= c.rim) { d.visible = false; c.onFill(); }
          continue;
        }
        if (c.mode === 'soak') { d.visible = false; c.onSoak(d.position); continue; }
        u.phase = 'off';
        d.position.y = c.top;
        u.v.set((Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.5), 0.4, (Math.random() - 0.5) * 0.6);
      }
      if (d.position.y <= 0.07) {
        d.visible = false;
        if (Math.hypot(d.position.x - SP.x, d.position.z - SP.z) < 0.9) puddle.scale.setScalar(Math.min(1, puddle.scale.x + 0.035));
      }
    }
  });

  // ---- балончета ----
  let tip = null;
  function say(anchor, html, cls = '', lift = null) {
    if (tip) tip.remove();
    if (narrowUI()) cls = cls.replace('wide', '');
    tip = stage.bubble(anchor, html, { lift: lift != null ? lift : anchor.userData.top || 1.2, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }

  const scores = [];
  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  stage.onHover(() => {});

  function choiceBox(c, q, items, rightIdx, why, onRight, onWrong) {
    c.innerHTML = `<p class="materials-q">${q}</p><div class="choices">${items.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
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
    title: 'На масата',
    items: MATS.map((m) => ({ id: m.id, label: m.label, icon: m.icon })),
    onSelect: (id) => menuHandler && menuHandler(id),
  });

  function step1() {
    shell.step(0);
    const seen = new Set();
    const NEED = 5;
    station.visible = false;
    board.visible = false;
    shell.task(`<p>На масата има предмети от различни <b>материали</b>: стъкло, метал, дърво, пластмаса, гума, плат и хартия.</p>
      <p><b>Разгледай поне ${NEED} предмета:</b> кликни върху тях или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата маса</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); menu.setActive(null); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${MATS.length}`);
    upd();
    const visit = (id) => {
      const m = BY[id];
      const g = objs.get(id);
      stage.focusOn(g, { dist: narrow ? 4.4 : 3.6, height: 1.7, lift: 0.3 });
      say(g, `<b>${esc(m.icon)} ${esc(m.label)}</b><br>${m.note}`, 'wide');
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size >= NEED) {
        next.disabled = false;
        shell.msg(seen.size === MATS.length ? 'Разгледа всичко! Продължи напред.' : 'Браво! Можеш да продължиш или да разгледаш още.', 'good');
      }
    };
    clickHandler = (id) => { if (!id || !BY[id]) { clearTip(); return; } visit(id); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Опити ----------
  let busy = false;
  function runTest(test, id, done) {
    busy = true;
    const g = objs.get(id);
    const m = BY[id];
    clearTip();
    const to = SP.clone();
    if (test === 'light' && id === 'paper') to.y += 0.3; // листът се изправя пред фенерчето
    hop(g, to, 0.6, () => {
      if (test === 'light' && id === 'paper') g.rotation.set(0, 0, Math.PI / 2);
      g.updateMatrixWorld(true);
      const box = new THREE.Box3();
      g.traverse((o) => { if (o.isMesh && !o.userData.isHitBox) box.expandByObject(o); });
      const finish = () => {
        results[test][id] = m.cell[test];
        drawBoard();
        say(spotAnchor, `<b>${esc(m.name)}</b>: ${m.say[test]}`, 'wide ' + (m.cell[test].startsWith('Да') ? 'good' : ''), 1.9);
        later(test === 'light' ? 1.2 : 0.6, () => {
          g.rotation.copy(g.userData.homeRot);
          hop(g, g.userData.home, 0.6, () => { busy = false; done(); });
        });
      };
      if (test === 'light') doLight(m, box, finish);
      else if (test === 'water') doWater(g, m, box, finish);
      else doBend(g, m, box, finish);
    });
  }
  function doLight(m, box, done) {
    const cy = (box.min.y + box.max.y) / 2;
    flash.position.y = Math.max(0.3, cy);
    const hx = flash.position.x + 0.45;
    const ox = box.min.x;
    const sx = SP.x + 1.21;
    beam1.position.set((hx + ox) / 2, flash.position.y, SP.z);
    beam1.scale.set(1, ox - hx, 1);
    beam2.position.set((box.max.x + sx) / 2, flash.position.y, SP.z);
    beam2.scale.set(1, sx - box.max.x, 1);
    spot.position.y = shade.position.y = flash.position.y;
    const through = m.light === 'clear' ? 1 : m.light === 'dim' ? 0.22 : 0;
    flash.userData.lens.material.color.set(0xffffff);
    animate(0.5, (k) => {
      beam1.material.opacity = 0.35 * k;
      beam2.material.opacity = 0.3 * k * through;
      spot.material.opacity = 0.25 + 0.7 * k * (through || 0.6);
      shade.material.opacity = through ? 0 : 0.85 * k;
    }, () => later(1.3, () => {
      done();
      later(1.0, () => animate(0.4, (k) => {
        beam1.material.opacity = 0.35 * (1 - k);
        beam2.material.opacity = 0.3 * (1 - k) * through;
        spot.material.opacity *= (1 - k);
        shade.material.opacity *= (1 - k);
      }, () => { flash.userData.lens.material.color.set(0xfff8d0); spot.material.opacity = 0; shade.material.opacity = 0; }));
    }));
  }
  function doWater(g, m, box, done) {
    const top = box.max.y;
    const v = g.userData.vesselG;
    let wet = 0;
    dropCtl = {
      mode: m.water, top, rim: top - 0.12,
      onFill() { if (v) setVol(v, v.userData.vessel.vol + volumeOf(v.userData.vessel.sh, v.userData.vessel.sh.depth) * 0.016); },
      onSoak(p) {
        wet += 1 / 14;
        setWet(g, wet);
        if (wet > 0.35) spawnDrop(new V3(p.x, box.min.y - 0.03, p.z));
      },
    };
    const target = new V3(SP.x + 0.03, top + 0.75, SP.z);
    const lipW = new V3();
    jug.visible = true;
    const place = (tilt) => {
      jug.rotation.z = -tilt;
      jug.position.set(0, 0, 0);
      jug.updateMatrixWorld(true);
      jug.userData.vessel.lip.getWorldPosition(lipW);
      jug.position.copy(target).sub(lipW);
    };
    place(0);
    let acc = 0;
    animate(0.5, (k) => place(1.2 * ease(k)), () => {
      animate(2.0, (k, dt) => {
        acc += dt * 16;
        while (acc > 1) { acc -= 1; spawnDrop(new V3(target.x + (Math.random() - 0.5) * 0.1, target.y - 0.05, target.z + (Math.random() - 0.5) * 0.1)); }
      }, () => {
        animate(0.4, (k) => place(1.2 * (1 - k)), () => { jug.visible = false; });
        later(0.8, () => { dropCtl = null; done(); });
      });
    });
  }
  function doBend(g, m, box, done) {
    const top = box.max.y;
    handG.visible = true;
    handG.position.set(SP.x, top + 0.9, SP.z + 0.1);
    const flex = m.bend !== 'no';
    const rest = m.id === 'paper' ? 0.18 : m.id === 'fabric' ? 0.1 : 0;
    animate(0.5, (k) => { handG.position.y = top + 0.9 - 0.8 * ease(k); }, () => {
      animate(0.7, (k) => {
        if (flex) { g.userData.bendFn(ease(k)); handG.position.y = top + 0.1 - (m.bend === 'fold' ? 0 : 0.12) * ease(k); } else { g.rotation.z = Math.sin(k * Math.PI * 6) * 0.03; }
      }, () => later(0.4, () => {
        animate(0.5, (k) => { if (flex) g.userData.bendFn(1 - (1 - rest) * ease(k)); g.rotation.z = 0; handG.position.y = top + 0.1 + 0.8 * ease(k); }, () => {
          handG.visible = false;
          done();
        });
      }));
    });
  }

  function step2() {
    shell.step(1);
    clearTip();
    menu.show(false);
    menuHandler = null;
    station.visible = true;
    board.visible = true;
    if (narrow) overview(); else fitView([0.1, 0.8, 0.3], 4.9, 2.0, 0.45);
    let mistakes = 0;
    let ti = 0;
    const drawTask = (extra = '') => {
      shell.task(`<ol class="materials-list">${TESTS.map((t, i) => `<li class="${i < ti ? 'done' : i === ti ? 'cur' : ''}">${t.icon} ${esc(t.title)}</li>`).join('')}</ol>
        ${ti < TESTS.length ? `<p>${TESTS[ti].task}</p>` : ''}${extra}${tableHTML()}`);
    };
    const startTest = () => {
      const t = TESTS[ti];
      const done = new Set();
      shell.setControls('');
      drawTask('<p><b>Кликни върху предмет</b> на масата — той ще отиде на подноса.</p>');
      const upd = () => shell.score(`Опит ${ti + 1} от 3 · проверени: ${done.size} от ${MATS.length} · грешки: ${mistakes}`);
      upd();
      clickHandler = (id) => {
        if (!id || !BY[id] || busy) return;
        if (done.has(id)) { say(objs.get(id), `<b>${esc(BY[id].name)}</b>: ${BY[id].say[t.id]}`, 'wide'); return; }
        runTest(t.id, id, () => {
          done.add(id);
          upd();
          if (narrowUI()) drawTask('<p><b>Кликни върху следващ предмет.</b></p>');
          if (done.size === MATS.length) ask();
        });
      };
      const ask = () => {
        clickHandler = null;
        shell.msg('Всички са проверени! Погледни таблицата.', 'good');
        drawTask('<div class="materials-ask"></div>');
        choiceBox(container.querySelector('.materials-ask'), esc(t.q), t.a, t.right, t.why, () => {
          shell.msg('Вярно!', 'good');
          ti++;
          if (ti < TESTS.length) {
            const c = shell.setControls('<button class="btn primary">Следващ опит →</button>');
            c.querySelector('button').addEventListener('click', () => { shell.msg(''); clearTip(); startTest(); });
          } else {
            scores.push(stepScore(mistakes, 2));
            drawTask(`<p>Таблицата е пълна! ${mistakes ? `Грешки: ${mistakes}.` : 'Без нито една грешка! 🎉'}</p>`);
            const c = shell.setControls('<button class="btn primary">Напред →</button>');
            c.querySelector('button').addEventListener('click', step3);
          }
        }, () => { mistakes++; upd(); });
      };
    };
    startTest();
  }

  // ---------- 3. Избери материал ----------
  const useGroup = new THREE.Group();
  scene.add(useGroup);
  const useSpot = narrow ? new V3(-1.4, 0, -1.2) : new V3(-2.0, 0, -1.3);
  function step3() {
    shell.step(2);
    clearTip();
    station.visible = false;
    overview();
    let mistakes = 0;
    let ui = 0;
    const next = () => {
      while (useGroup.children.length) useGroup.remove(useGroup.children[0]);
      if (ui >= USES.length) {
        scores.push(stepScore(mistakes, 4));
        clickHandler = null;
        shell.task(`<p>Всички предмети са готови! ${mistakes ? `Грешки: ${mistakes}.` : 'Без нито една грешка! 🎉'}</p>
          <p class="small">Материалът се избира според свойствата му: прозрачен ли е, пропуска ли вода, твърд ли е, гъвкав ли е, здрав ли е.</p>`);
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', step4);
        return;
      }
      const u = USES[ui];
      const model = useModel(u.id);
      model.position.copy(useSpot);
      model.scale.setScalar(0.001);
      useGroup.add(model);
      animate(0.5, (k) => model.scale.setScalar(Math.max(0.001, ease(k))));
      let wrongHere = 0;
      shell.task(`<p><b>${esc(u.icon)} ${esc(u.label)}</b> (${ui + 1} от ${USES.length})</p><p>${u.q}</p>
        <p><b>Кликни върху материала</b> на масата.</p>${tableHTML()}`);
      shell.setControls('');
      shell.score(`Грешки: ${mistakes}`);
      say(model, `${esc(u.icon)} От какво да е?`, '', 2.0);
      clickHandler = (id) => {
        if (!id || !BY[id]) return;
        if (!u.right.includes(id)) {
          mistakes++;
          wrongHere++;
          shell.score(`Грешки: ${mistakes}`);
          say(objs.get(id), `✘ ${esc(u.no[id])}`, 'wide bad');
          shell.msg(wrongHere >= 2 ? `Подсказка: ${u.hint}` : 'Не е най-подходящият. Опитай с друг материал.', 'bad');
          return;
        }
        clickHandler = null;
        paintUse(model, id);
        const g = objs.get(id);
        hop(g, g.userData.home.clone(), 0.5, null, 0.5);
        say(model, `✔ ${u.done || `${esc(u.label)} от ${esc(BY[id].name.toLowerCase())}!`}`, 'wide good', 2.0);
        shell.msg('Добър избор! А защо?', 'good');
        const box = shell.setControls('<div class="materials-why"></div>').querySelector('.materials-why');
        choiceBox(box, 'Защо този материал е подходящ?', u.reasons, u.rr, ['Помисли пак: какво свойство ни трябва тук?', 'Помисли пак: какво свойство ни трябва тук?', 'Помисли пак: какво свойство ни трябва тук?'], () => {
          shell.msg('Точно така!', 'good');
          const c = shell.setControls(`<button class="btn primary">${ui + 1 < USES.length ? 'Следващ предмет →' : 'Готово →'}</button>`);
          c.querySelector('button').addEventListener('click', () => { ui++; shell.msg(''); clearTip(); next(); });
        }, () => { mistakes++; shell.score(`Грешки: ${mistakes}`); });
      };
    };
    next();
  }

  // ---------- 4. Предскажи ----------
  const s4 = new THREE.Group();
  s4.visible = false;
  scene.add(s4);
  const COVERS = [
    { id: 'fabric', label: 'Памучна кърпа', color: 0xf5c84c, pass: 1 },
    { id: 'paper', label: 'Хартия', color: 0xfafafa, pass: 1 },
    { id: 'plastic', label: 'Найлон', color: 0x64b5f6, pass: 0 },
  ];
  const CX = narrow ? [-1.6, 0, 1.6] : [-2.4, -0.4, 1.6];
  const CZ = -1.0;
  const bears = [];
  const covers = [];
  COVERS.forEach((cv, i) => {
    const bear = bearModel();
    bear.position.set(CX[i], 0, CZ);
    bear.userData.wet = 0;
    s4.add(bear);
    bears.push(bear);
    const cover = new THREE.Group();
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 1.0),
      cv.id === 'plastic' ? new THREE.MeshStandardMaterial({ color: cv.color, transparent: true, opacity: 0.6, roughness: 0.2 }) : mat(cv.color, { roughness: 0.95 }));
    sheet.position.y = 1.15;
    cover.add(sheet);
    for (const [x, z] of [[-0.55, -0.45], [0.55, -0.45], [-0.55, 0.45], [0.55, 0.45]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.15, 6), mat(0x6d4c41));
      leg.position.set(x, 0.575, z);
      cover.add(leg);
    }
    const lbl = labelSprite(cv.label, { size: 0.22 });
    lbl.position.set(0, 1.45, 0);
    cover.add(lbl);
    stage.steadyLabel(lbl, 9);
    cover.position.set(CX[i], 0, CZ);
    cover.userData.sheet = sheet;
    s4.add(cover);
    covers.push(cover);
  });
  const cloud = new THREE.Group();
  const cloudM = mat(0xf1f4f6, { roughness: 1 });
  for (let i = 0; i < 11; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (i % 3) * 0.06, 12, 10), cloudM);
    p.position.set((i - 5) * (narrow ? 0.3 : 0.42), Math.sin(i * 1.7) * 0.15, Math.cos(i * 2.1) * 0.2);
    p.userData.ph = i;
    cloud.add(p);
  }
  cloud.position.set((CX[0] + CX[2]) / 2, 3.1, CZ);
  s4.add(cloud);
  const rain = [];
  for (let i = 0; i < 60; i++) {
    const d = new THREE.Mesh(dropGeo, liquidMat(0x42a5f5, 0.85));
    d.scale.set(0.6, 1.6, 0.6);
    d.visible = false;
    d.userData = { vy: 0, under: -1 };
    s4.add(d);
    rain.push(d);
  }
  let raining = false;
  stage.tick((dt, t) => {
    if (!s4.visible) return;
    for (const p of cloud.children) p.position.y = Math.sin(t * 0.8 + p.userData.ph) * 0.12;
    cloud.position.x = (CX[0] + CX[2]) / 2 + Math.sin(t * 0.3) * 0.15;
    for (const d of rain) {
      if (!d.visible) {
        if (raining && Math.random() < dt * 10) {
          const i = Math.floor(Math.random() * 3);
          d.position.set(CX[i] + (Math.random() - 0.5) * 1.1, 2.8, CZ + (Math.random() - 0.5) * 0.9);
          d.userData = { vy: -2, under: i, phase: 0 };
          d.visible = true;
        }
        continue;
      }
      const u = d.userData;
      u.vy -= 9 * dt;
      d.position.y += u.vy * dt;
      if (u.phase === 0 && d.position.y < 1.17) {
        if (COVERS[u.under].pass) {
          // намокреното покривало пропуска водата малко по-късно
          u.phase = 1;
          u.vy = -0.5;
          const cs = covers[u.under].userData.sheet;
          cs.material.color.multiplyScalar(0.99);
          if (COVERS[u.under].id === 'paper') cs.scale.y = Math.min(3, cs.scale.y + 0.02);
        } else {
          d.visible = false;
          continue;
        }
      }
      if (u.phase === 1 && d.position.y < 0.8 && Math.abs(d.position.x - CX[u.under]) < 0.45) {
        const b = bears[u.under];
        b.userData.wet = Math.min(1, b.userData.wet + 0.07);
        setWet(b, b.userData.wet);
        d.visible = false;
        continue;
      }
      if (d.position.y < 0.02) d.visible = false;
    }
  });

  function step4() {
    shell.step(3);
    clearTip();
    for (const g of objs.values()) g.visible = false;
    board.visible = false;
    s4.visible = true;
    if (narrow) fitView([0, 1.5, CZ], 2.6, 2.0, 0.32); else fitView([(CX[0] + CX[2]) / 2, 1.6, CZ], 3.3, 1.9, 0.3);
    let good = 0;
    const total = 3;
    shell.score('');
    // 1) Предсказване с дъжд.
    shell.task(`<p>Три мечета ще стоят под дъжда. Над всяко има покривало от различен материал.</p><div class="materials-p"></div>`);
    shell.setControls('');
    const box = container.querySelector('.materials-p');
    box.innerHTML = `<p class="materials-q">Предскажи: под кое покривало мечето ще остане сухо?</p><div class="choices">${COVERS.map((c, i) => `<button class="choice" data-i="${i}">${esc(c.label)}</button>`).join('')}</div>`;
    box.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      box.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      const ok = COVERS[i].id === 'plastic';
      if (ok) good++;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) box.querySelector('.choice[data-i="2"]').classList.add('right');
      shell.msg('Да проверим! Гледай дъжда…', '');
      raining = true;
      try { shell.stageEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* няма значение */ }
      later(5.5, () => {
        raining = false;
        const w0 = [bears[0].userData.wet, bears[1].userData.wet];
        animate(0.6, (k) => { [0, 1].forEach((i) => { bears[i].userData.wet = w0[i] + (1 - w0[i]) * k; setWet(bears[i], bears[i].userData.wet); }); });
        say(bears[2], '☂️ <b>Сухо!</b>', 'good', 1.0);
        later(0.01, () => {
          stage.bubble(bears[0], '💧 <b>Мокро!</b>', { lift: 1.0, cls: 'bad' });
          stage.bubble(bears[1], '💧 <b>Мокро!</b>', { lift: 1.0, cls: 'bad' });
        });
        shell.msg((ok ? 'Позна! ' : 'Не позна. ') + 'Под найлона мечето остана сухо — найлонът (пластмаса) не пропуска вода. Платът и хартията пропуснаха водата.', ok ? 'good' : 'bad');
        const c = shell.setControls('<button class="btn primary">Следващ въпрос →</button>');
        c.querySelector('button').addEventListener('click', () => { stage.clearBubbles(); tip = null; q2(); });
      });
    }));
    const quiz = (q, a, right, explain, then) => {
      shell.msg('');
      shell.task('<div class="materials-p"></div>');
      shell.setControls('');
      const bx = container.querySelector('.materials-p');
      bx.innerHTML = `<p class="materials-q">${esc(q)}</p><div class="choices">${a.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
      bx.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        const i = +b.dataset.i;
        bx.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
        const ok = i === right;
        if (ok) good++;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) bx.querySelector(`.choice[data-i="${right}"]`).classList.add('right');
        shell.msg((ok ? 'Вярно! ' : 'Не е така. ') + explain, ok ? 'good' : 'bad');
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', then);
      }));
    };
    const q2 = () => quiz('Мама иска купа, през която да се вижда колко салата има в нея. От какво да е купата?',
      ['От метал', 'От стъкло', 'От дърво'], 1, 'Стъклото е прозрачно — през него се вижда.', q3);
    const q3 = () => quiz('Една гумена и една стъклена топка падат на плочките. Какво ще стане?',
      ['И двете ще се счупят.', 'Стъклената ще отскочи, а гумената ще се счупи.', 'Гумената ще отскочи, а стъклената може да се счупи.'], 2,
      'Гумата е еластична и здрава, а стъклото е твърдо, но чупливо.', () => {
        scores.push(good / total);
        clearTip();
        stage.clearBubbles();
        tip = null;
        const ratio = scores.reduce((x, y) => x + y, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
  }

  step1();
  return {
    dispose() {
      menu.remove();
      stage.dispose();
    },
  };
}
