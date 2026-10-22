// 6.3.5 „Кръвоносна система на човека; първа помощ при кръвоизлив“ — 3D сърце в разрез, бели дробове и органи.
// Стъпки: опознай → проследи пътя на кръвта → пулс и здраве → първа помощ при кръвоизлив.
import { createStage, labelSprite, mat, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const CSS = `
.heart-acts { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
.heart-acts .chip { cursor: pointer; }
.heart-acts .chip.on { background: #1865f2; color: #fff; border-color: #1865f2; }
.heart-acts .chip.lock { opacity: 0.45; pointer-events: none; }
.heart-beat { font-size: 1.05rem; transition: opacity 0.12s, transform 0.12s; }
.heart-beat.off { opacity: 0.15; }
.heart-bins { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px; }
.heart-bins .bin { min-height: 70px; padding: 6px; }
.heart-bins .bin-title { font-size: 0.85rem; }
.heart-bins .bin-items .chip { font-size: 0.78rem; padding: 3px 7px; cursor: default; }
.heart-pool { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.heart-pool .chip { font-size: 0.85rem; padding: 5px 9px; cursor: pointer; }
.heart-legend { display: flex; gap: 10px; flex-wrap: wrap; font-size: 0.8rem; color: #556; margin-top: 4px; }
.heart-legend i { display: inline-block; width: 0.8em; height: 0.8em; border-radius: 50%; margin-right: 4px; vertical-align: -1px; }
.heart-multi .choice { padding: 7px 10px; }
.heart-multi .choice:disabled { color: #1b2a3a; }
.heart-multi .choice .box { width: 1.1em; height: 1.1em; border: 2px solid #9aa7b8; border-radius: 4px; flex: none; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8em; }
.heart-multi .choice.on .box { background: #1865f2; border-color: #1865f2; color: #fff; }
.heart-multi .choice.on .box::after { content: "✓"; }
.heart-steps { margin: 6px 0 0; padding-left: 1.3em; font-size: 0.9rem; }
.heart-steps li { margin: 2px 0; }
`;
function injectStyle() {
  if (document.getElementById('heart-style')) return;
  const s = document.createElement('style');
  s.id = 'heart-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

const RED = new THREE.Color(0xd8202c);
const BLUE = new THREE.Color(0x3c52d9);
const WHITE = new THREE.Color(0xf4f4f4);

// Сърцето е в група с център H; кухините са в местни координати.
const H = new THREE.Vector3(0.1, 0.85, 0.45);
const CH = {
  ra: { pos: [-0.4, 0.36, 0], r: [0.3, 0.27, 0.3], color: 0x4a5cd6, label: 'Дясно предсърдие', lp: [-1.02, 1.55, 0.9] },
  rv: { pos: [-0.27, -0.3, 0], r: [0.34, 0.42, 0.32], color: 0x4a5cd6, label: 'Дясна камера', lp: [-0.95, 0.15, 0.9] },
  la: { pos: [0.4, 0.4, -0.05], r: [0.28, 0.26, 0.28], color: 0xd23a3a, label: 'Ляво предсърдие', lp: [1.25, 1.6, 0.9] },
  lv: { pos: [0.3, -0.32, 0], r: [0.3, 0.4, 0.3], color: 0xd23a3a, label: 'Лява камера', lp: [1.15, 0.15, 0.9] },
};
const cw = (id) => new THREE.Vector3(...CH[id].pos).add(H);

// Пътища на кръвта. kind: o — с кислород, d — с CO₂, do/od — капиляри (кръвта сменя цвета си).
function buildPaths() {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const RA = cw('ra'); const RV = cw('rv'); const LA = cw('la'); const LV = cw('lv');
  const PT = V(0.02, 2.0, 0.5);
  const ARCH = V(0.4, 2.45, 0.2);
  return {
    ra_rv: { pts: [RA, V(-0.33, 0.85, 0.45), RV], kind: 'd', next: ['pa'], r: 0, cat: 'heart' },
    pa: { pts: [RV, V(-0.12, 0.9, 0.82), V(-0.02, 1.55, 0.78), PT], kind: 'd', next: ['paR', 'paL'], r: 0.085, cat: 'artery', name: 'белодробна артерия' },
    paR: { pts: [PT, V(-0.55, 2.15, 0.25), V(-1.1, 2.05, 0.0)], kind: 'd', next: ['lungR'], r: 0.065, cat: 'artery' },
    paL: { pts: [PT, V(0.6, 2.2, 0.3), V(1.12, 2.05, 0.0)], kind: 'd', next: ['lungL'], r: 0.065, cat: 'artery' },
    lungR: { pts: [V(-1.1, 2.05, 0.0), V(-1.55, 2.55, -0.05), V(-2.0, 2.0, 0.0), V(-1.85, 1.3, -0.05), V(-1.5, 0.75, 0.0), V(-1.08, 1.15, 0.0)], kind: 'do', next: ['pvR'], r: 0.032, cat: 'cap', slow: 0.55 },
    lungL: { pts: [V(1.12, 2.05, 0.0), V(1.55, 2.55, -0.05), V(2.0, 2.0, 0.0), V(1.85, 1.3, -0.05), V(1.5, 0.75, 0.0), V(1.08, 1.15, 0.0)], kind: 'do', next: ['pvL'], r: 0.032, cat: 'cap', slow: 0.55 },
    pvR: { pts: [V(-1.08, 1.15, 0.0), V(-0.5, 1.12, 0.05), V(0.2, 1.2, 0.15), LA], kind: 'o', next: ['la_lv'], r: 0.065, cat: 'vein', name: 'белодробни вени' },
    pvL: { pts: [V(1.08, 1.15, 0.0), V(0.8, 1.22, 0.2), LA], kind: 'o', next: ['la_lv'], r: 0.065, cat: 'vein' },
    la_lv: { pts: [LA, V(0.42, 0.86, 0.48), LV], kind: 'o', next: ['ao'], r: 0, cat: 'heart' },
    ao: { pts: [LV, V(0.25, 0.95, 0.85), V(0.18, 1.8, 0.65), V(0.25, 2.35, 0.4), ARCH], kind: 'o', next: ['carotid', 'aoDesc', 'aoDesc'], r: 0.1, cat: 'artery', name: 'аорта' },
    carotid: { pts: [ARCH, V(0.3, 2.9, 0.05), V(0.28, 3.45, -0.15)], kind: 'o', next: ['headCap'], r: 0.06, cat: 'artery' },
    headCap: { pts: [V(0.28, 3.45, -0.15), V(0.55, 3.85, -0.25), V(0.3, 4.35, -0.3), V(-0.3, 4.35, -0.3), V(-0.55, 3.85, -0.25), V(-0.28, 3.45, -0.15)], kind: 'od', next: ['jugular'], r: 0.03, cat: 'cap', slow: 0.55 },
    jugular: { pts: [V(-0.28, 3.45, -0.15), V(-0.35, 2.9, 0.05), V(-0.5, 2.1, 0.3), V(-0.55, 1.5, 0.45), RA], kind: 'd', next: ['ra_rv'], r: 0.075, cat: 'vein', name: 'горна куха вена' },
    aoDesc: { pts: [ARCH, V(0.75, 2.2, -0.15), V(0.85, 1.0, -0.3), V(0.8, -0.5, -0.15), V(0.95, -1.5, 0.05)], kind: 'o', next: ['bodyCap'], r: 0.09, cat: 'artery', name: 'аорта' },
    bodyCap: { pts: [V(0.95, -1.5, 0.05), V(1.35, -2.0, 0.2), V(1.0, -2.75, 0.3), V(0.3, -2.3, 0.35), V(-0.3, -2.8, 0.3), V(-1.0, -2.75, 0.3), V(-1.35, -2.0, 0.2), V(-0.95, -1.5, 0.05)], kind: 'od', next: ['ivc'], r: 0.032, cat: 'cap', slow: 0.55 },
    ivc: { pts: [V(-0.95, -1.5, 0.05), V(-0.8, -0.5, -0.1), V(-0.7, 0.3, 0.15), V(-0.55, 0.8, 0.4), RA], kind: 'd', next: ['ra_rv'], r: 0.1, cat: 'vein', name: 'долна куха вена' },
  };
}

// Маршрути на капката в стъпка 2 (от станция до станция).
const ROUTES = {
  'rv>lungs': { segs: ['pa', 'paR', 'lungR'], text: 'По <b>белодробната артерия</b> кръвта отива в белите дробове. В капилярите там тя отдава CO₂ и поема кислород — става червена.' },
  'lungs>la': { segs: ['pvR'], text: 'По <b>белодробните вени</b> кръвта, богата на кислород, се връща в лявото предсърдие. Това е <b>малкият кръг</b> на кръвообращението.' },
  'la>lv': { segs: ['la_lv'], text: 'През клапата кръвта минава в <b>лявата камера</b> — тя има най-дебелата и силна стена.' },
  'lv>body': { segs: ['ao', 'aoDesc', 'bodyCap'], text: 'Лявата камера изтласква кръвта в <b>аортата</b>. По артериите тя стига до капилярите в органите: дава им кислород и храна и взема CO₂ и отпадъци.' },
  'body>ra': { segs: ['ivc'], text: 'По <b>вените</b> кръвта, бедна на кислород, се връща в дясното предсърдие. Това е <b>големият кръг</b> на кръвообращението.' },
  'ra>rv': { segs: ['ra_rv'], text: 'От дясното предсърдие кръвта минава в дясната камера — и пътят започва отново. Кръвта тече в кръг!' },
};
const ORDER = ['rv', 'lungs', 'la', 'lv', 'body', 'ra', 'rv'];
const STATION_NAME = { rv: 'дясна камера', lungs: 'бели дробове', la: 'ляво предсърдие', lv: 'лява камера', body: 'органи на тялото', ra: 'дясно предсърдие' };
const WRONG_WHY = {
  lungs: 'Към белите дробове кръвта отива от <b>дясната камера</b>.',
  la: 'В лявото предсърдие се връща кръв от <b>белите дробове</b>.',
  lv: 'В лявата камера кръвта идва от <b>лявото предсърдие</b>.',
  body: 'Към органите кръвта тръгва от <b>лявата камера</b>, по аортата.',
  ra: 'В дясното предсърдие се връща кръвта от <b>органите на тялото</b>.',
  rv: 'В дясната камера кръвта идва от <b>дясното предсърдие</b>.',
};

const NOTES = {
  heart: { icon: '❤️', label: 'Сърце', text: 'Кух мускул, голям колкото юмрука ти. Работи като <b>помпа</b>: свива се и изтласква кръвта в съдовете — около 70 пъти в минута в покой. Има 4 кухини.' },
  atria: { icon: '⬆️', label: 'Предсърдия', text: 'Горните кухини на сърцето — <b>дясно</b> и <b>ляво предсърдие</b>. В тях влиза кръвта, която се връща по вените.' },
  ventricles: { icon: '⬇️', label: 'Камери', text: 'Долните кухини — <b>дясна</b> и <b>лява камера</b>. Те се свиват силно и изтласкват кръвта в артериите.' },
  valves: { icon: '🚪', label: 'Клапи', text: 'Клапите са като вратички: пропускат кръвта само <b>в една посока</b> — от предсърдието към камерата. Виж как се отварят и затварят!' },
  arteries: { icon: '🔴', label: 'Артерии', text: 'Артериите носят кръв <b>от сърцето</b> към органите. Стените им са дебели и еластични. Най-голямата е <b>аортата</b>.' },
  veins: { icon: '🔵', label: 'Вени', text: 'Вените връщат кръвта <b>към сърцето</b>. Стените им са по-тънки, а вътре имат клапи, които не пускат кръвта назад.' },
  caps: { icon: '🕸️', label: 'Капиляри', text: 'Най-тънките съдове — по-тънки от косъм. През стените им кръвта дава на клетките <b>кислород и хранителни вещества</b> и взема <b>CO₂ и отпадъци</b>.' },
  lungs: { icon: '🫁', label: 'Бели дробове', text: 'Тук кръвта се освобождава от <b>въглеродния диоксид (CO₂)</b> и се обогатява с <b>кислород (O₂)</b>. Виж как синята кръв става червена!' },
  body: { icon: '🧍', label: 'Органи на тялото', text: 'Мозък, мускули, стомах, бъбреци… Всички получават от кръвта кислород и храна, а ѝ дават CO₂ и отпадъци.' },
  blood: { icon: '🩸', label: 'Кръв', text: 'Кръвта <b>пренася</b> кислород, хранителни вещества, вода, CO₂ и отпадъци. <b>Червените</b> кръвни клетки носят кислорода, <b>белите</b> ни пазят от микроби, а <b>кръвните плочици</b> спират кървенето.' },
};
const MENU = ['heart', 'atria', 'ventricles', 'valves', 'arteries', 'veins', 'caps', 'lungs', 'blood', 'body'];
const CAT2NOTE = { artery: 'arteries', vein: 'veins', cap: 'caps' };

const FACTORS = [
  { t: 'Спорт и движение', good: true },
  { t: 'Плодове и зеленчуци', good: true },
  { t: 'Достатъчно сън', good: true },
  { t: 'Пиене на вода', good: true },
  { t: 'Тютюнопушене', good: false },
  { t: 'Много солена и мазна храна', good: false },
  { t: 'Седене с часове пред екрана', good: false },
  { t: 'Алкохол', good: false },
];
const ACTS = { sleep: { icon: '😴', name: 'Сън', bpm: 60 }, walk: { icon: '🚶', name: 'Ходене', bpm: 90 }, run: { icon: '🏃', name: 'Бягане', bpm: 120 } };

const AID = [
  { id: 'gloves', icon: '🧤', label: 'Ръкавици', done: 'Сложи ръкавици — така пазиш и себе си, и ранения от зараза.' },
  { id: 'gauze', icon: '✋', label: 'Марля', done: 'Притисни раната с чиста марля и задръж няколко минути.' },
  { id: 'arm', icon: '💪', label: 'Ръката', done: 'Повдигни ранената ръка над нивото на сърцето — кървенето намалява.' },
  { id: 'bandage', icon: '🩹', label: 'Бинт', done: 'Превържи раната плътно, но не прекалено стегнато.' },
  { id: 'phone', icon: '📞', label: 'Телефон', done: 'Кажи на учител или родител. Ако кървенето е силно или не спира — обади се на <b>112</b>.' },
];
const AID_WHY = {
  gloves: '',
  gauze: 'Първо се погрижи за своята безопасност — чужда кръв не се пипа с голи ръце.',
  arm: 'Първо спри кървенето — притисни раната.',
  bandage: 'Преди превръзката притисни раната и повдигни ръката.',
  phone: 'Кървенето е леко — първо окажи помощ. После кажи на възрастен.',
};

function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function mount(container, opts) {
  injectStyle();
  let cur = null;
  const restart = () => { if (cur) cur.dispose(); cur = build(container, opts, restart); };
  cur = build(container, opts, restart);
  return { dispose() { if (cur) cur.dispose(); cur = null; } };
}

function build(container, { onComplete }, restart) {
  const STEPS = ['Опознай кръвоносната система', 'Пътят на кръвта', 'Пулс и здраве', 'Първа помощ при кръвоизлив'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xfbf1ee, camPos: [0, 1.1, 11.5], target: [0, 0.8, 0], maxDistance: 20, minDistance: 2,
    maxPolarAngle: Math.PI * 0.75,
  });
  const { scene, camera, renderer } = stage;
  renderer.localClippingEnabled = true;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const noRay = (o) => { o.raycast = () => {}; return o; };

  const world = new THREE.Group();
  scene.add(world);

  // ---------- силует на тялото ----------
  const sil = new THREE.Shape();
  sil.moveTo(-0.45, 3.05);
  sil.lineTo(-2.3, 2.75); sil.quadraticCurveTo(-2.75, 2.6, -2.7, 2.0);
  sil.lineTo(-2.45, -3.4); sil.lineTo(2.45, -3.4);
  sil.lineTo(2.7, 2.0); sil.quadraticCurveTo(2.75, 2.6, 2.3, 2.75);
  sil.lineTo(0.45, 3.05); sil.lineTo(0.45, 3.3); sil.lineTo(-0.45, 3.3); sil.closePath();
  const silM = new THREE.MeshBasicMaterial({ color: 0xf6dccd });
  const silBody = noRay(new THREE.Mesh(new THREE.ShapeGeometry(sil), silM));
  silBody.position.z = -1.3;
  const silHead = noRay(new THREE.Mesh(new THREE.CircleGeometry(0.95, 40), silM));
  silHead.position.set(0, 4.0, -1.3);
  world.add(silBody, silHead);

  // ---------- сърце в разрез ----------
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), H.z);
  const heart = new THREE.Group();
  heart.position.copy(H);
  world.add(heart);
  const shellM = new THREE.MeshStandardMaterial({ color: 0xb8323a, roughness: 0.55, side: THREE.DoubleSide, clippingPlanes: [clip] });
  const outer = noRay(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), shellM));
  outer.scale.set(0.82, 0.92, 0.48);
  outer.position.y = 0.02;
  heart.add(outer);
  const fat = noRay(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 8, 40, Math.PI * 1.2), new THREE.MeshStandardMaterial({ color: 0xf2d08a, clippingPlanes: [clip] })));
  fat.position.set(0, 0.0, 0);
  fat.rotation.set(Math.PI / 2, 0, -0.3);
  heart.add(fat);
  const chambers = {};
  for (const [id, c] of Object.entries(CH)) {
    const g = new THREE.Group();
    g.position.set(...c.pos);
    const cav = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.4, side: THREE.BackSide, clippingPlanes: [clip], emissive: c.color, emissiveIntensity: 0.15 }));
    cav.scale.set(...c.r);
    noRay(cav);
    const rimM = new THREE.MeshStandardMaterial({ color: 0x8e1f28, roughness: 0.6 });
    const rim = noRay(new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 36), rimM));
    rim.scale.set(c.r[0], c.r[1], 1);
    rim.position.z = H.z - H.z + 0.0;
    const hit = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.scale.set(c.r[0] * 0.95, c.r[1] * 0.95, 0.3);
    hit.position.z = 0.25;
    g.add(cav, rim, hit);
    g.userData = { pickId: id, base: new THREE.Vector3(...c.r), cav, rim };
    heart.add(g);
    chambers[id] = g;
    const lbl = labelSprite(c.label, { size: 0.25 });
    lbl.position.copy(new THREE.Vector3(...c.lp));
    lbl.raycast = () => {};
    world.add(lbl);
    stage.steadyLabel(lbl, 11);
    c.labelSprite = lbl;
  }
  // Преграда между лявата и дясната половина.
  const sept = noRay(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 0.5), new THREE.MeshStandardMaterial({ color: 0xa82a33, clippingPlanes: [clip] })));
  sept.position.set(0.02, 0.0, -0.1);
  heart.add(sept);
  // Клапи между предсърдията и камерите.
  const valves = [];
  const valveM = mat(0xfff1dc, { roughness: 0.5 });
  for (const [x, y] of [[-0.33, 0.07], [0.35, 0.09]]) {
    for (const s of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(x + s * 0.17, y, 0.02);
      const flap = noRay(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.14), valveM));
      flap.position.x = -s * 0.08;
      hinge.add(flap);
      hinge.userData.s = s;
      heart.add(hinge);
      valves.push(hinge);
    }
  }
  const valveAnchor = new THREE.Object3D();
  valveAnchor.position.set(-0.33, 0.07, 0.1);
  heart.add(valveAnchor);
  const heartHit = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  heartHit.scale.set(0.85, 0.95, 0.3);
  heartHit.position.z = 0.05;
  heartHit.userData.pickId = 'heart';
  heart.add(heartHit);
  const heartLbl = labelSprite('Сърце', { size: 0.32, color: '#fff', bg: '#b8323a', border: '#b8323a' });
  heartLbl.position.set(0.1, -0.35, 1.0);
  heartLbl.raycast = () => {};
  world.add(heartLbl);
  stage.steadyLabel(heartLbl, 11);

  // ---------- бели дробове ----------
  const lungs = new THREE.Group();
  lungs.userData.pickId = 'lungs';
  world.add(lungs);
  const lungM = new THREE.MeshStandardMaterial({ color: 0xf5a3ae, roughness: 0.8, transparent: true, opacity: 0.42, depthWrite: false });
  const lungMeshes = [];
  for (const s of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), lungM);
    l.scale.set(0.78, 1.18, 0.5);
    l.position.set(s * 1.52, 1.65, -0.25);
    lungs.add(l);
    lungMeshes.push(l);
  }
  const airM = mat(0xece3da, { roughness: 0.6 });
  const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 12), airM);
  trachea.position.set(0, 3.0, -0.5);
  lungs.add(trachea);
  for (const s of [-1, 1]) {
    const br = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.52, -0.5), new THREE.Vector3(s * 0.6, 2.35, -0.45), new THREE.Vector3(s * 1.3, 1.9, -0.35)]);
    lungs.add(new THREE.Mesh(new THREE.TubeGeometry(br, 16, 0.06, 8), airM));
  }
  const lungLbl = labelSprite('Бели дробове', { size: 0.3 });
  lungLbl.position.set(-1.7, 3.05, 0);
  lungLbl.raycast = () => {};
  world.add(lungLbl);
  stage.steadyLabel(lungLbl, 11);

  // ---------- органи на тялото ----------
  const body = new THREE.Group();
  body.userData.pickId = 'body';
  world.add(body);
  const organM = new THREE.MeshStandardMaterial({ color: 0xf0b48c, roughness: 0.8, transparent: true, opacity: 0.45, depthWrite: false });
  const block = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 2.0, 8, 20), organM);
  block.rotation.z = Math.PI / 2;
  block.position.set(0, -2.25, 0.05);
  block.scale.set(1, 1, 0.7);
  body.add(block);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 18), organM);
  head.position.set(0, 3.95, -0.3);
  body.add(head);
  const brain = noRay(new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 14), new THREE.MeshStandardMaterial({ color: 0xf3a6b4, transparent: true, opacity: 0.5, depthWrite: false })));
  brain.position.set(0, 4.05, -0.35);
  brain.scale.set(1, 0.8, 0.9);
  body.add(brain);
  // мускулни снопчета и стомах вътре в блока
  const stom = noRay(new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe88a8a, transparent: true, opacity: 0.55, depthWrite: false })));
  stom.scale.set(1.3, 0.8, 0.6);
  stom.position.set(0.6, -2.0, 0.0);
  body.add(stom);
  for (let i = 0; i < 4; i++) {
    const m = noRay(new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.6, 4, 8), new THREE.MeshStandardMaterial({ color: 0xc9605a, transparent: true, opacity: 0.5, depthWrite: false })));
    m.rotation.z = Math.PI / 2;
    m.position.set(-1.0 + (i % 2) * 0.25, -2.0 - i * 0.18, 0.0);
    body.add(m);
  }
  const bodyLbl = labelSprite('Органи на тялото', { size: 0.3 });
  bodyLbl.position.set(0, -3.3, 0.6);
  bodyLbl.raycast = () => {};
  world.add(bodyLbl);
  stage.steadyLabel(bodyLbl, 11);
  const brainLbl = labelSprite('Мозък', { size: 0.26 });
  brainLbl.position.set(0, 4.85, -0.2);
  brainLbl.raycast = () => {};
  world.add(brainLbl);
  stage.steadyLabel(brainLbl, 11);

  // ---------- съдове ----------
  const PATHS = buildPaths();
  const segs = {};
  for (const [id, p] of Object.entries(PATHS)) {
    const curve = new THREE.CatmullRomCurve3(p.pts, false, 'centripetal');
    const s = { id, ...p, curve, len: curve.getLength() };
    s.anchor = new THREE.Object3D();
    s.anchor.position.copy(curve.getPointAt(0.5));
    world.add(s.anchor);
    if (p.r) {
      const geo = new THREE.TubeGeometry(curve, 64, p.r, 10);
      const colors = [];
      const n = geo.attributes.position.count;
      const c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        const u = Math.floor(i / 11) / 64;
        if (p.kind === 'o') c.copy(RED); else if (p.kind === 'd') c.copy(BLUE);
        else if (p.kind === 'do') c.copy(BLUE).lerp(RED, u); else c.copy(RED).lerp(BLUE, u);
        colors.push(c.r, c.g, c.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      const m = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.42, roughness: 0.35, depthWrite: false, emissive: 0xffd54f, emissiveIntensity: 0 });
      const tube = noRay(new THREE.Mesh(geo, m));
      const grp = new THREE.Group();
      grp.add(tube);
      const hitR = p.cat === 'cap' ? 0.14 : 0.16;
      const hit = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, hitR, 6), new THREE.MeshBasicMaterial({ visible: false }));
      grp.add(hit);
      grp.userData.pickId = 'V:' + id;
      world.add(grp);
      s.tube = tube;
      s.grp = grp;
    }
    segs[id] = s;
  }
  // Ситна мрежа от капиляри (украса) в белите дробове, мозъка и органите.
  const capM = new THREE.MeshStandardMaterial({ color: 0x9a4fb0, transparent: true, opacity: 0.35, depthWrite: false });
  const capNet = (cx, cy, cz, rx, ry, n) => {
    for (let i = 0; i < n; i++) {
      const pts = [];
      let x = cx + (Math.random() - 0.5) * rx; let y = cy + (Math.random() - 0.5) * ry;
      for (let k = 0; k < 5; k++) {
        pts.push(new THREE.Vector3(x, y, cz + (Math.random() - 0.5) * 0.2));
        x += (Math.random() - 0.5) * 0.35; y += (Math.random() - 0.5) * 0.35;
      }
      world.add(noRay(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 4), capM)));
    }
  };
  capNet(-1.55, 1.7, -0.1, 0.9, 1.6, 9);
  capNet(1.55, 1.7, -0.1, 0.9, 1.6, 9);
  capNet(0, 4.0, -0.2, 0.8, 0.6, 5);
  capNet(0, -2.3, 0.25, 2.6, 0.8, 10);

  // ---------- кръвни клетки ----------
  const SEG_IDS = Object.keys(segs);
  const totalLen = SEG_IDS.reduce((a, k) => a + segs[k].len, 0);
  const N = 190;
  const cellGeo = new THREE.SphereGeometry(0.055, 10, 6);
  cellGeo.scale(1, 0.5, 1);
  const cellMat = new THREE.MeshStandardMaterial({ roughness: 0.45 });
  const cellsMesh = noRay(new THREE.InstancedMesh(cellGeo, cellMat, N));
  cellsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  world.add(cellsMesh);
  const cells = [];
  {
    let acc = 0;
    for (let i = 0; i < N; i++) {
      const at = (i / N) * totalLen;
      let k = 0;
      acc = 0;
      while (acc + segs[SEG_IDS[k]].len < at) { acc += segs[SEG_IDS[k]].len; k++; }
      cells.push({
        seg: SEG_IDS[k], s: at - acc, white: i % 23 === 0,
        off: new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)),
        rot: new THREE.Euler(Math.random() * 3, Math.random() * 3, 0), spin: (Math.random() - 0.5) * 3,
      });
    }
  }
  const followCell = new THREE.Object3D();
  world.add(followCell);

  // ---------- първа помощ (отделен кът) ----------
  const aid = new THREE.Group();
  aid.position.set(16, 0, 0);
  aid.visible = false;
  scene.add(aid);
  const table = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.2, 3.4), mat(0xdfe8ee, { roughness: 0.7 }));
  table.position.y = -0.1;
  aid.add(table);
  const aidWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), mat(0xe9f3f1));
  aidWall.position.set(0, 2, -2.2);
  aidWall.scale.set(2, 1.6, 1);
  aid.add(aidWall);
  // кутия за първа помощ
  const kit = new THREE.Group();
  const kitBox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), mat(0x2e9e5b));
  kitBox.position.y = 0.25;
  const crossM = mat(0xffffff);
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.01), crossM); c1.position.set(0, 0.27, 0.306);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.01), crossM); c2.position.set(0, 0.27, 0.306);
  const lid = new THREE.Group();
  lid.position.set(0, 0.5, -0.3);
  const lidM = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.62), mat(0x268a4f));
  lidM.position.z = 0.31;
  lid.add(lidM);
  kit.add(kitBox, c1, c2, lid);
  kit.position.set(-2.1, 0, -1.1);
  aid.add(kit);
  // ръка (от лакътя до пръстите)
  const skin = mat(0xf1c58f, { roughness: 0.7 });
  const arm = new THREE.Group();
  arm.position.set(-1.0, 0.24, -0.3);
  arm.userData.pickId = 'arm';
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.5, 6, 16), skin);
  fore.rotation.z = Math.PI / 2;
  fore.position.x = 0.85;
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.5, 18), mat(0x5c7cfa));
  sleeve.rotation.z = Math.PI / 2;
  sleeve.position.x = 0.05;
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.4), skin);
  palm.position.set(1.95, -0.02, 0);
  arm.add(fore, sleeve, palm);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 4, 8), skin);
    f.rotation.z = Math.PI / 2;
    f.position.set(2.3, -0.03, -0.15 + i * 0.1);
    arm.add(f);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.18, 4, 8), skin);
  thumb.rotation.set(0, 0.8, Math.PI / 2);
  thumb.position.set(1.95, 0, 0.27);
  arm.add(thumb);
  const cut = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.035), new THREE.MeshStandardMaterial({ color: 0xc62828, emissive: 0x7f0000, emissiveIntensity: 0.4 }));
  cut.position.set(1.0, 0.222, 0.02);
  cut.rotation.y = 0.25;
  arm.add(cut);
  const drops = [];
  for (let i = 0; i < 3; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(0xc62828));
    d.position.set(0.92 + i * 0.08, 0.23, 0.05 + (i % 2) * 0.03);
    d.userData.ph = i * 2.1;
    arm.add(d);
    drops.push(d);
  }
  const armHit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
  armHit.position.x = 1.15;
  arm.add(armHit);
  aid.add(arm);
  const armLbl = labelSprite('Ръката на съученика', { size: 0.2 });
  armLbl.position.set(0.9, 0.75, 0);
  armLbl.raycast = () => {};
  arm.add(armLbl);
  stage.steadyLabel(armLbl, 8);
  // предмети
  const items = {};
  const mkItem = (id, g, x, z, label) => {
    g.position.set(x, 0, z);
    g.userData.pickId = 'aid:' + id;
    g.userData.home = g.position.clone();
    const lb = labelSprite(label, { size: 0.2 });
    lb.position.y = 0.55;
    lb.raycast = () => {};
    g.add(lb);
    g.userData.label = lb;
    stage.steadyLabel(lb, 8);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.2;
    g.add(hit);
    aid.add(g);
    items[id] = g;
  };
  {
    const g = new THREE.Group();
    const gm = mat(0x64b5f6, { roughness: 0.5 });
    for (const dx of [-0.17, 0.17]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.3), gm);
      p.position.set(dx, 0.03, 0.05);
      g.add(p);
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.14, 4, 6), gm);
        f.rotation.x = Math.PI / 2;
        f.position.set(dx - 0.09 + i * 0.06, 0.03, -0.18);
        g.add(f);
      }
    }
    mkItem('gloves', g, -1.9, 1.05, 'Ръкавици');
  }
  {
    const g = new THREE.Group();
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), mat(0xffffff, { roughness: 1 }));
    pad.position.y = 0.02;
    g.add(pad);
    for (let i = 0; i < 3; i++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.005, 0.01), mat(0xe0e0e0));
      l.position.set(0, 0.043, -0.12 + i * 0.12);
      g.add(l);
    }
    mkItem('gauze', g, -0.75, 1.1, 'Марля');
    g.userData.pad = pad;
  }
  {
    const g = new THREE.Group();
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.26, 20), mat(0xfafafa, { roughness: 1 }));
    roll.rotation.x = Math.PI / 2;
    roll.position.y = 0.16;
    g.add(roll);
    g.userData.roll = roll;
    mkItem('bandage', g, 0.45, 1.1, 'Бинт');
  }
  {
    const g = new THREE.Group();
    const ph = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.55), mat(0x263238, { roughness: 0.4 }));
    ph.position.y = 0.02;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.46), new THREE.MeshBasicMaterial({ color: 0x37474f }));
    scr.rotation.x = -Math.PI / 2;
    scr.position.y = 0.042;
    g.add(ph, scr);
    g.userData.scr = scr;
    mkItem('phone', g, 1.65, 1.05, 'Телефон');
  }
  // превръзка (появява се при „бинт“)
  const wraps = [];
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.09, 20), mat(0xffffff, { roughness: 1 }));
    w.rotation.z = Math.PI / 2;
    w.position.set(0.86 + i * 0.09, 0, 0);
    w.visible = false;
    arm.add(w);
    wraps.push(w);
  }
  const aidFloor = noRay(new THREE.Mesh(new THREE.PlaneGeometry(30, 20), mat(0xc9d6de)));
  aidFloor.rotation.x = -Math.PI / 2;
  aidFloor.position.y = -1.9;
  aid.add(aidFloor);
  for (const [x, z] of [[-2.6, -1.5], [2.6, -1.5], [-2.6, 1.5], [2.6, 1.5]]) {
    const leg = noRay(new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.7, 0.15), mat(0x90a4ae)));
    leg.position.set(x, -1.05, z);
    aid.add(leg);
  }

  // ---------- анимация ----------
  let bpm = 70;
  let beatPh = 0;
  let beats = 0;
  let onBeat = null;
  let breath = 0;
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpS = new THREE.Vector3(1, 1, 1);
  const tmpP = new THREE.Vector3();
  const tmpC = new THREE.Color();
  const tween = new Map();
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  function animate(obj, to, dur = 0.6, extra = {}) {
    tween.set(obj, { from: obj.position.clone(), to: to.clone(), k: 0, dur, rotFrom: obj.rotation.z, rotTo: extra.rotZ ?? obj.rotation.z, arc: extra.arc ?? 0.3, done: extra.done });
  }
  stage.tick((dt, t) => {
    // удари на сърцето
    beatPh += dt * bpm / 60;
    if (beatPh >= 1) { beatPh -= 1; beats++; if (onBeat) onBeat(beats); }
    const p = beatPh;
    const atr = p < 0.16 ? Math.sin((p / 0.16) * Math.PI) : 0;
    const ven = p > 0.16 && p < 0.5 ? Math.sin(((p - 0.16) / 0.34) * Math.PI) : 0;
    for (const id of ['ra', 'la']) chambers[id].scale.setScalar(1 - atr * 0.16);
    for (const id of ['rv', 'lv']) chambers[id].scale.setScalar(1 - ven * 0.14);
    outer.scale.set(0.82 * (1 - ven * 0.05), 0.92 * (1 - ven * 0.04), 0.48);
    const open = p < 0.16 || p > 0.55 ? 1 : 0;
    for (const v of valves) {
      const want = open ? -v.userData.s * 0.9 : 0;
      v.rotation.z += (want - v.rotation.z) * Math.min(1, dt * 18);
    }
    heartLbl.material.opacity = 1;
    // дишане
    breath += dt * 0.28 * Math.PI * 2;
    const b = 1 + Math.sin(breath) * 0.045;
    for (const l of lungMeshes) l.scale.set(0.78 * b, 1.18 * b, 0.5 * b);
    // кръвта тече по-бързо при свиване на камерите
    const surge = 0.55 + ven * 1.3;
    const base = 0.42 * (bpm / 70);
    for (let i = 0; i < N; i++) {
      const c = cells[i];
      let s = segs[c.seg];
      const sp = base * (s.slow || (s.cat === 'artery' ? surge : 0.75 + ven * 0.3));
      c.s += dt * sp;
      while (c.s > s.len) {
        c.s -= s.len;
        const nx = s.next[Math.floor(Math.random() * s.next.length)];
        c.seg = nx;
        s = segs[nx];
      }
      const u = c.s / s.len;
      s.curve.getPointAt(Math.min(1, u), tmpP);
      const rr = s.r ? s.r * 0.55 : 0.12;
      tmpP.addScaledVector(c.off, rr);
      c.rot.x += c.spin * dt;
      tmpQ.setFromEuler(c.rot);
      tmpS.setScalar(c.white ? 1.5 : 1);
      tmpM.compose(tmpP, tmpQ, tmpS);
      cellsMesh.setMatrixAt(i, tmpM);
      if (c.white) tmpC.copy(WHITE);
      else if (s.kind === 'o') tmpC.copy(RED);
      else if (s.kind === 'd') tmpC.copy(BLUE);
      else if (s.kind === 'do') tmpC.copy(BLUE).lerp(RED, u);
      else tmpC.copy(RED).lerp(BLUE, u);
      cellsMesh.setColorAt(i, tmpC);
      if (i === 7) followCell.position.copy(tmpP);
    }
    cellsMesh.instanceMatrix.needsUpdate = true;
    if (cellsMesh.instanceColor) cellsMesh.instanceColor.needsUpdate = true;
    // капката в стъпка 2
    if (drop.active) {
      const s = segs[drop.route[drop.i]];
      drop.s += dt * 2.3 * (s.slow ? 0.75 : 1);
      if (drop.s >= s.len) {
        segs[drop.route[drop.i]].tube && (segs[drop.route[drop.i]].tube.material.emissiveIntensity = 0.45);
        drop.i++;
        drop.s = 0;
        if (drop.i >= drop.route.length) { drop.active = false; drop.mesh.visible = drop.keep; if (drop.done) drop.done(); }
      }
      if (drop.active) {
        const s2 = segs[drop.route[drop.i]];
        const u = Math.min(1, drop.s / s2.len);
        s2.curve.getPointAt(u, drop.mesh.position);
        if (s2.kind === 'o') tmpC.copy(RED); else if (s2.kind === 'd') tmpC.copy(BLUE);
        else if (s2.kind === 'do') tmpC.copy(BLUE).lerp(RED, u); else tmpC.copy(RED).lerp(BLUE, u);
        drop.mesh.material.color.copy(tmpC);
        drop.mesh.material.emissive.copy(tmpC);
        drop.glow.material.color.copy(tmpC);
      }
    }
    drop.glow.scale.setScalar(0.55 + Math.sin(t * 6) * 0.08);
    // първа помощ
    for (const [obj, tw] of tween) {
      tw.k = Math.min(1, tw.k + dt / tw.dur);
      const e = ease(tw.k);
      obj.position.lerpVectors(tw.from, tw.to, e);
      obj.position.y += Math.sin(e * Math.PI) * tw.arc;
      obj.rotation.z = tw.rotFrom + (tw.rotTo - tw.rotFrom) * e;
      if (tw.k >= 1) { tween.delete(obj); if (tw.done) tw.done(); }
    }
    for (const d of drops) {
      if (!d.visible) continue;
      d.scale.setScalar(0.8 + Math.sin(t * 2 + d.userData.ph) * 0.2);
    }
    kit.children[3].rotation.x = -0.9 - Math.sin(t * 0.8) * 0.05;
    for (const it of Object.values(items)) {
      if (it.userData.used || tween.has(it)) continue;
      it.position.y = it.userData.home.y + (it.userData.hl ? 0.06 + Math.sin(t * 5) * 0.03 : 0);
    }
  });

  // Капка, която показва пътя в стъпка 2.
  const drop = { active: false, mesh: null, glow: null, route: [], i: 0, s: 0, done: null, keep: true };
  drop.mesh = noRay(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshStandardMaterial({ color: 0x3c52d9, emissive: 0x3c52d9, emissiveIntensity: 0.6 })));
  drop.glow = noRay(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), transparent: true, depthWrite: false, opacity: 0.9 })));
  drop.mesh.add(drop.glow);
  drop.mesh.visible = false;
  world.add(drop.mesh);
  function runDrop(route, done) {
    drop.route = route;
    drop.i = 0; drop.s = 0;
    drop.active = true;
    drop.mesh.visible = true;
    drop.done = done;
  }

  // ---------- камера и балончета ----------
  function view(pos, tgt, dur = 1.0) {
    const asp = camera.aspect || 1.5;
    const k = Math.min(1.5, Math.max(1, 0.75 / asp));
    const v = new THREE.Vector3(...pos).sub(new THREE.Vector3(...tgt)).multiplyScalar(k).add(new THREE.Vector3(...tgt));
    stage.stopFollow();
    stage.flyTo(v.toArray(), tgt, dur);
  }
  const overview = () => { const x = (camera.aspect || 1.5) > 1.2 ? -0.45 : 0; view([x, 0.9, 10.8], [x, 0.65, 0]); };
  let tip = null;
  function say(anchor, html, cls = '', lift = 0.4) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }

  let clickHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null); });
  const scores = [];
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Кръвоносна система',
    items: MENU.map((id) => ({ id, label: NOTES[id].label, icon: NOTES[id].icon })),
    onSelect: (id) => {
      if (menuHandler) menuHandler(id);
      // На тесен екран менюто се свива, за да не закрива балончето.
      const host = stage.renderer.domElement.parentElement;
      if (host.clientWidth < 480) {
        const head = menu.el.querySelector('.cm-head');
        if (head && head.getAttribute('aria-expanded') === 'true') head.click();
      }
    },
  });

  // Къде е всяко нещо в сцената.
  function anchorOf(id) {
    switch (id) {
      case 'heart': return { obj: heart, lift: 0.95, dist: 4.2 };
      case 'atria': return { obj: chambers.ra, lift: 0.35, dist: 3.2 };
      case 'ventricles': return { obj: chambers.lv, lift: 0.45, dist: 3.2 };
      case 'valves': return { obj: valveAnchor, lift: 0.25, dist: 2.4 };
      case 'arteries': return { obj: segs.aoDesc.anchor, lift: 0.3, dist: 4 };
      case 'veins': return { obj: segs.ivc.anchor, lift: 0.3, dist: 4 };
      case 'caps': return { obj: segs.bodyCap.anchor, lift: 0.4, dist: 4 };
      case 'lungs': return { obj: lungMeshes[0], lift: 1.25, dist: 5.2 };
      case 'blood': return { obj: followCell, lift: 0.2, dist: 2.2 };
      case 'body': return { obj: block, lift: 0.75, dist: 5.5 };
      default: return null;
    }
  }
  function pickToNote(id) {
    if (!id) return null;
    if (id === 'ra' || id === 'la') return 'atria';
    if (id === 'rv' || id === 'lv') return 'ventricles';
    if (id.startsWith('V:')) return CAT2NOTE[segs[id.slice(2)].cat];
    if (NOTES[id]) return id;
    return null;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    menu.show(true);
    aid.visible = false;
    world.visible = true;
    bpm = 70;
    const seen = new Set();
    shell.task(`<p>Това е схема на кръвоносната система. Сърцето е <b>в разрез</b> — виждаш кухините му.</p>
      <p><b>Разгледай поне 6 части</b> — кликни върху тях или ги избери от менюто.</p>
      <div class="heart-legend"><span><i style="background:#d8202c"></i>кръв с кислород</span><span><i style="background:#3c52d9"></i>кръв с CO₂</span></div>
      <p class="small">Гледаме човека отпред: дясната половина на сърцето е от твоята лява страна. В действителност кръвта с CO₂ е тъмночервена, а не синя.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялото тяло</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${MENU.length}`);
    upd();
    const visit = (id) => {
      const a = anchorOf(id);
      const n = NOTES[id];
      stage.focusOn(a.obj, { dist: a.dist, height: 0.4, lift: 0, keepFollow: id === 'blood' });
      say(a.obj, `<b>${esc(n.icon)} ${esc(n.label)}</b><br>${n.text}`, 'wide', a.lift);
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size >= 6) { next.disabled = false; shell.msg('Браво! Можеш да продължиш или да разгледаш още.', 'good'); }
    };
    clickHandler = (id) => { const n = pickToNote(id); if (!n) { clearTip(); return; } visit(n); };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Пътят на кръвта ----------
  function step2() {
    shell.step(1);
    clearTip();
    menu.show(false);
    menuHandler = null;
    overview();
    let mistakes = 0;
    let k = 1;
    let busy = false;
    // Съдовете не пречат на кликането: кликват се местата, до които стига кръвта.
    for (const sg of Object.values(segs)) if (sg.grp) delete sg.grp.userData.pickId;
    const path = ['rv'];
    drop.mesh.position.copy(cw('rv'));
    drop.mesh.visible = true;
    drop.keep = true;
    const draw = () => {
      shell.task(`<p>Една капка кръв е в <b>дясната камера</b> (светещото топче). Къде ще отиде после?</p>
        <p><b>Кликни поред местата</b>, през които минава кръвта, докато се върне в дясната камера.</p>
        <p class="small">Кликвай кухините на сърцето, белите дробове или органите на тялото.</p>
        <p>Пътят: <b>${path.map((x) => esc(STATION_NAME[x])).join(' → ')}</b></p>`);
      shell.score(`Стъпка ${Math.min(k, ORDER.length - 1)} от ${ORDER.length - 1} · грешки: ${mistakes}`);
    };
    draw();
    shell.setControls('');
    say(drop.mesh, 'Капката е тук — в <b>дясната камера</b>. Кръвта в нея е с много CO₂.', '', 0.3);
    const station = (id) => {
      if (!id) return null;
      if (CH[id] || id === 'lungs' || id === 'body') return id;
      return null;
    };
    clickHandler = (raw) => {
      if (busy || !raw) return;
      if (raw === 'V:lungR' || raw === 'V:lungL') raw = 'lungs';
      else if (raw === 'V:bodyCap' || raw === 'V:headCap') raw = 'body';
      if (raw.startsWith('V:')) {
        say(segs[raw.slice(2)].anchor, 'Това е кръвоносен съд. Кликни <b>мястото</b>, до което стига кръвта — кухина на сърцето, белите дробове или органите.', '', 0.3);
        return;
      }
      const id = station(raw === 'heart' ? null : raw);
      if (!id) return;
      const want = ORDER[k];
      if (id !== want) {
        mistakes++;
        const a = id === 'lungs' ? lungMeshes[0] : id === 'body' ? block : chambers[id];
        say(a, `✘ Не още. ${WRONG_WHY[id]}`, 'bad wide', id === 'lungs' ? 1.25 : id === 'body' ? 0.75 : 0.35);
        shell.msg(mistakes >= 3 ? `Подсказка: проследи съда, който излиза от „${STATION_NAME[ORDER[k - 1]]}“.` : 'Кръвта не отива там сега.', 'bad');
        draw();
        return;
      }
      const prev = ORDER[k - 1];
      const r = ROUTES[`${prev}>${id}`];
      busy = true;
      shell.msg('');
      clearTip();
      runDrop(r.segs, () => {
        busy = false;
        path.push(id);
        say(drop.mesh, r.text, 'good wide', 0.3);
        k++;
        draw();
        if (k >= ORDER.length) finishTrace();
      });
    };
    function finishTrace() {
      clickHandler = null;
      later(() => {
        const qs = [
          { q: 'Какво пренася кръвта от органите към белите дробове?', a: ['Въглероден диоксид (CO₂)', 'Кислород (O₂)', 'Храна от стомаха'], ok: 0, why: 'Помисли: какво взема кръвта от органите и какво отдава в белите дробове?' },
          { q: 'Кой кръг на кръвообращението започва от лявата камера?', a: ['Малкият кръг', 'Големият кръг'], ok: 1, why: 'От лявата камера кръвта тръгва към всички органи на тялото — това е по-дългият път.' },
        ];
        let qi = 0;
        const ask = () => {
          const Q = qs[qi];
          shell.task(`<p>Пътят: <b>${path.map((x) => esc(STATION_NAME[x])).join(' → ')}</b> ✔</p>
            <p><b>${esc(Q.q)}</b></p><div class="choices">${Q.a.map((t, i) => `<button class="choice" data-i="${i}">${esc(t)}</button>`).join('')}</div>`);
          container.querySelectorAll('.xp-task .choice').forEach((b) => b.addEventListener('click', () => {
            if (+b.dataset.i === Q.ok) {
              b.classList.add('right');
              container.querySelectorAll('.xp-task .choice').forEach((x) => { x.disabled = true; });
              shell.msg('Вярно!', 'good');
              qi++;
              if (qi < qs.length) later(ask, 700);
              else {
                scores.push(stepScore(mistakes, 4));
                shell.msg(mistakes ? `Готово! Грешки: ${mistakes}.` : 'Без нито една грешка! 🎉', 'good');
                const c = shell.setControls('<button class="btn primary">Напред →</button>');
                c.querySelector('button').addEventListener('click', step3);
              }
            } else {
              mistakes++;
              b.classList.add('wrong');
              b.disabled = true;
              shell.msg(Q.why, 'bad');
              shell.score(`Грешки: ${mistakes}`);
            }
          }));
        };
        ask();
      }, 1400);
    }
  }

  // ---------- 3. Пулс ----------
  function step3() {
    shell.step(2);
    clearTip();
    drop.mesh.visible = false;
    for (const s of Object.values(segs)) if (s.tube) s.tube.material.emissiveIntensity = 0;
    view([0, 1.0, 5.2], [0.1, 0.9, 0.4]);
    let mistakes = 0;
    let act = 'sleep';
    bpm = ACTS[act].bpm;
    const beatTag = stage.bubble(heart, '<span class="heart-beat off">❤️ туп</span>', { lift: 1.1, cls: 'tag' });
    let flashT = null;
    onBeat = () => {
      const el = beatTag.el.querySelector('.heart-beat');
      if (!el) return;
      el.classList.remove('off');
      if (flashT) clearTimeout(flashT);
      flashT = later(() => el.classList.add('off'), 160);
    };
    const TASKS = [{ act: 'sleep', text: 'Детето <b>спи</b>.' }, { act: 'run', text: 'Сега детето <b>тича</b>. Избери „Бягане“.' }];
    let ti = 0;
    let timer = null;
    const upd = () => shell.score(`Задача ${Math.min(ti + 1, 2)} от 2 · грешки: ${mistakes}`);
    const draw = () => {
      const T = TASKS[ti];
      if (ti > 0) shell.msg('');
      shell.task(`<p>${T.text} Колко пъти в минута бие сърцето му?</p>
        <div class="heart-acts">${Object.entries(ACTS).map(([k, a]) => `<span class="chip ${k === act ? 'on' : ''}" data-a="${k}">${a.icon} ${a.name}</span>`).join('')}</div>
        <p class="small">Натисни „Пусни 10 секунди“ и <b>брой ударите</b> („туп“ над сърцето). После умножи по 6 — в минутата има 6 пъти по 10 секунди.</p>
        <label class="num">Удари за 1 минута: <input class="ans" type="text" inputmode="numeric" size="4"></label>`);
      container.querySelectorAll('.heart-acts .chip').forEach((ch) => ch.addEventListener('click', () => {
        if (timer) return;
        act = ch.dataset.a;
        bpm = ACTS[act].bpm;
        container.querySelectorAll('.heart-acts .chip').forEach((x) => x.classList.toggle('on', x === ch));
      }));
      const c = shell.setControls('<div class="row"><button class="btn go">⏱ Пусни 10 секунди</button><button class="btn primary chk">Провери</button></div>');
      c.querySelector('.go').addEventListener('click', start10);
      c.querySelector('.chk').addEventListener('click', check);
      upd();
    };
    function start10() {
      if (timer) return;
      const go = container.querySelector('.xp-controls .go');
      let left = 10;
      const startBeats = beats;
      beatPh = 0.98;
      const tick = () => {
        if (left <= 0) {
          timer = null;
          if (go) { go.disabled = false; go.textContent = '⏱ Пусни пак'; }
          say(heart, 'Времето свърши! Колко удара преброи? Умножи ги по 6.', 'wide', 1.6);
          void startBeats;
          return;
        }
        say(heart, `⏱ Брой! Остават <b>${left}</b> s`, '', 1.6);
        left--;
        timer = later(tick, 1000);
      };
      if (go) go.disabled = true;
      tick();
    }
    function check() {
      const inp = container.querySelector('.xp-task .ans');
      const v = parseInt((inp.value || '').replace(/\s/g, ''), 10);
      const T = TASKS[ti];
      if (act !== T.act) {
        mistakes++;
        upd();
        shell.msg(`Първо избери „${ACTS[T.act].name}“ и преброй отново.`, 'bad');
        return;
      }
      if (!Number.isFinite(v)) { shell.msg('Напиши число.', 'bad'); return; }
      const want = ACTS[T.act].bpm;
      if (Math.abs(v - want) <= 6) {
        inp.classList.add('right');
        inp.disabled = true;
        shell.msg(`Вярно! ${want / 6} удара за 10 s × 6 = ${want} удара в минута.`, 'good');
        say(heart, ti === 0 ? `😴 В покой сърцето бие бавно — около <b>${want}</b> пъти в минута.` : `🏃 При бягане — около <b>${want}</b> пъти в минута!`, 'good wide', 1.6);
        ti++;
        if (ti < TASKS.length) later(draw, 1200);
        else later(why, 1200);
      } else {
        mistakes++;
        inp.classList.add('wrong');
        upd();
        shell.msg(mistakes >= 2 ? `Подсказка: ако преброиш ${want / 6} удара за 10 секунди, за минута са ${want / 6} × 6.` : 'Не съвпада. Пусни 10-те секунди пак и брой внимателно.', 'bad');
      }
    }
    function why() {
      shell.task(`<p><b>Защо при бягане сърцето бие по-бързо?</b></p><div class="choices">
        <button class="choice" data-i="1">Защото сърцето се уморява и спира</button>
        <button class="choice" data-i="0">Мускулите работят и им трябват повече кислород и хранителни вещества</button>
        <button class="choice" data-i="2">Защото кръвта става по-малко</button></div>`);
      shell.setControls('');
      container.querySelectorAll('.xp-task .choice').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.i === '0') {
          b.classList.add('right');
          container.querySelectorAll('.xp-task .choice').forEach((x) => { x.disabled = true; });
          shell.msg('Вярно! Кръвта им носи повече кислород и храна.', 'good');
          later(sortFactors, 900);
        } else {
          mistakes++;
          upd();
          b.classList.add('wrong');
          b.disabled = true;
          shell.msg('Не. Помисли какво носи кръвта на мускулите.', 'bad');
        }
      }));
    }
    function sortFactors() {
      bpm = 70;
      act = 'sleep';
      let held = null;
      const placed = new Set();
      const order = [4, 0, 5, 1, 6, 2, 7, 3];
      shell.task(`<p><b>Кое помага на сърцето и кръвоносните съдове и кое им вреди?</b> Кликни карта, после кликни кутия.</p>
        <div class="heart-pool">${order.map((i) => `<span class="chip" data-i="${i}">${esc(FACTORS[i].t)}</span>`).join('')}</div>
        <div class="heart-bins"><div class="bin" data-g="1"><div class="bin-title">💚 Помага</div><div class="bin-items"></div></div>
        <div class="bin" data-g="0"><div class="bin-title">💔 Вреди</div><div class="bin-items"></div></div></div>`);
      shell.setControls('');
      say(heart, 'Сърцето работи цял живот, без почивка. Можем да му помогнем!', 'wide', 1.6);
      container.querySelectorAll('.heart-pool .chip').forEach((ch) => ch.addEventListener('click', () => {
        container.querySelectorAll('.heart-pool .chip').forEach((x) => x.classList.remove('held'));
        ch.classList.add('held');
        held = ch;
      }));
      container.querySelectorAll('.heart-bins .bin').forEach((bin) => bin.addEventListener('click', () => {
        if (!held) { shell.msg('Първо кликни карта.', ''); return; }
        const f = FACTORS[+held.dataset.i];
        if (String(+f.good) === bin.dataset.g) {
          const c = document.createElement('span');
          c.className = 'chip right';
          c.textContent = f.t;
          bin.querySelector('.bin-items').appendChild(c);
          held.remove();
          placed.add(held.dataset.i);
          held = null;
          shell.msg('Вярно!', 'good');
          if (placed.size === FACTORS.length) {
            scores.push(stepScore(mistakes, 4));
            shell.msg(mistakes ? `Готово! Грешки в стъпката: ${mistakes}.` : 'Без нито една грешка! 🎉', 'good');
            say(heart, '💚 Движение, здравословна храна, вода и сън пазят сърцето. Тютюнът, алкохолът и заседяването му вредят.', 'good wide', 1.6);
            const c2 = shell.setControls('<button class="btn primary">Напред →</button>');
            c2.querySelector('button').addEventListener('click', () => { beatTag.remove(); onBeat = null; step4(); });
          }
        } else {
          mistakes++;
          held.classList.add('wrong');
          later(() => held && held.classList.remove('wrong'), 600);
          shell.msg(f.good ? `„${f.t}“ всъщност помага на сърцето.` : `„${f.t}“ вреди на сърцето и съдовете.`, 'bad');
        }
        shell.score(`Грешки: ${mistakes}`);
      }));
    }
    draw();
  }

  // ---------- 4. Първа помощ ----------
  function step4() {
    shell.step(3);
    clearTip();
    world.visible = false;
    aid.visible = true;
    bpm = 80;
    stage.stopFollow();
    const asp = camera.aspect || 1.5;
    const k = Math.min(1.7, Math.max(1, 1.35 / asp));
    stage.flyTo([16 + 0.2, 0.25 + 3.6 * k, 4.6 * k], [16.2, 0.2, 0.2], 1.2);
    let mistakes = 0;
    let n = 0;
    const done = [];
    const draw = () => {
      shell.task(`<p>Съученик се поряза с ножица. Раната <b>кърви леко</b>. Помогни му!</p>
        <p><b>Кликни предметите и ръката в правилния ред.</b></p>
        ${done.length ? `<ol class="heart-steps">${done.map((d) => `<li>${d}</li>`).join('')}</ol>` : ''}`);
      shell.score(`Стъпка ${Math.min(n + 1, AID.length)} от ${AID.length} · грешки: ${mistakes}`);
    };
    draw();
    shell.setControls('');
    for (const it of Object.values(items)) it.userData.hl = true;
    const act = {
      gloves: () => {
        const g = items.gloves;
        animate(g, new THREE.Vector3(-0.4, 0.9, 0.9), 0.7, { done: () => { g.visible = false; } });
      },
      gauze: () => {
        const g = items.gauze;
        animate(g, new THREE.Vector3(0.0, 0.47, -0.3), 0.7, { done: () => {
          aid.remove(g); arm.add(g); g.position.set(1.0, 0.2, 0); g.rotation.set(0, 0, 0);
          for (const d of drops) d.visible = false;
          cut.visible = false;
        } });
      },
      arm: () => { animate(arm, arm.position.clone().add(new THREE.Vector3(0, 0.15, 0)), 0.9, { rotZ: 0.45, arc: 0 }); },
      bandage: () => {
        const g = items.bandage;
        animate(g, new THREE.Vector3(0.2, 1.3, -0.3), 0.6, { done: () => { g.visible = false; wraps.forEach((w, i) => later(() => { w.visible = true; }, i * 160)); } });
      },
      phone: () => { items.phone.userData.scr.material.color.set(0x4caf50); },
    };
    clickHandler = (raw) => {
      if (!raw) return;
      const id = raw.startsWith('aid:') ? raw.slice(4) : raw === 'arm' ? 'arm' : null;
      if (!id || n >= AID.length) return;
      const want = AID[n].id;
      const anchor = id === 'arm' ? palm : items[id];
      if (id !== want) {
        if (done.some((d, i) => AID[i].id === id)) return;
        mistakes++;
        say(anchor, `✘ ${AID_WHY[id]}`, 'bad wide', 0.75);
        shell.msg(mistakes >= 3 ? 'Подсказка: безопасност → натиск → повдигане → превръзка → възрастен.' : 'Не още.', 'bad');
        draw();
        return;
      }
      if (id !== 'arm') { items[id].userData.used = true; delete items[id].userData.pickId; if (id !== 'phone') items[id].userData.label.visible = false; }
      items[id] && (items[id].userData.hl = false);
      act[id]();
      say(id === 'arm' ? palm : id === 'gloves' || id === 'bandage' ? arm.children[0] : anchor, `✔ ${AID[n].done}`, 'good wide', id === 'arm' ? 0.6 : 0.7);
      done.push(`${AID[n].icon} ${AID[n].done.replace(/<[^>]+>/g, '')}`);
      n++;
      shell.msg('Вярно!', 'good');
      draw();
      if (n === AID.length) { clickHandler = null; later(risk, 1400); }
    };
    function risk() {
      const ITEMS = [
        { t: 'Помагам на ранен без ръкавици', bad: true },
        { t: 'Прегръщам приятел', bad: false },
        { t: 'Ползвам чужда самобръсначка или четка за зъби', bad: true },
        { t: 'Седя на един чин със съученик', bad: false },
        { t: 'Вдигам с ръка използвана спринцовка от земята', bad: true },
        { t: 'Пия вода от собствената си бутилка', bad: false },
        { t: 'Пробиват ми ушите с нестерилна игла', bad: true },
      ];
      say(palm, 'Някои болести (хепатит B и C, СПИН) се предават <b>чрез кръвта</b>. Затова пазим себе си и другите.', 'wide', 0.7);
      shell.task(`<p><b>При кои ситуации има риск от заразяване по кръвен път?</b> Отбележи всички.</p>
        <div class="choices heart-multi">${ITEMS.map((it, i) => `<button class="choice" data-i="${i}"><span class="box"></span>${esc(it.t)}</button>`).join('')}</div>`);
      const c = shell.setControls('<button class="btn primary">Провери</button>');
      const btns = [...container.querySelectorAll('.heart-multi .choice')];
      btns.forEach((b) => b.addEventListener('click', () => { if (!b.disabled) { b.classList.toggle('on'); b.classList.remove('wrong'); } }));
      c.querySelector('button').addEventListener('click', () => {
        let wrong = 0; let missed = 0;
        btns.forEach((b, i) => {
          const on = b.classList.contains('on');
          if (on && !ITEMS[i].bad) { wrong++; b.classList.add('wrong'); }
          if (!on && ITEMS[i].bad) missed++;
        });
        if (wrong || missed) {
          mistakes++;
          shell.score(`Грешки: ${mistakes}`);
          shell.msg(wrong ? 'Някое от отбелязаните е безопасно — при него няма допир с чужда кръв.' : 'Има още рискови ситуации. Къде може да има чужда кръв?', 'bad');
          return;
        }
        btns.forEach((b, i) => { b.disabled = true; if (ITEMS[i].bad) b.classList.add('right'); });
        scores.push(stepScore(mistakes, 4));
        shell.msg(mistakes ? `Вярно! Грешки в стъпката: ${mistakes}.` : 'Вярно! Без нито една грешка! 🎉', 'good');
        say(palm, '✔ Всеки отговаря за своето здраве и за здравето на другите: не пипаме чужда кръв, не ползваме чужди лични вещи.', 'good wide', 0.7);
        const c2 = shell.setControls('<button class="btn primary">Виж резултата</button>');
        c2.querySelector('button').addEventListener('click', () => {
          clearTip();
          const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
          shell.finish(ratio, onComplete, restart);
        });
      });
    }
  }

  step1();
  return {
    dispose() {
      for (const id of timers) clearTimeout(id);
      timers.clear();
      onBeat = null;
      menu.remove();
      stage.dispose();
    },
  };
}
