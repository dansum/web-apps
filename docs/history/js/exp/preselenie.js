// 6.1.2 „Великото преселение на народите“ — жива карта на Европа с плъзгач на годината (IV–VII в.).
// Стъпки: опознай народите → изследвай с плъзгача (причини и последици) → подреди причини и последици →
// предскажи къде ще се заселят българите на Аспарух (681 г.).
// Картата: брегове и днешни граници от Natural Earth (data/geo/europe.json) — само за ориентир.
// Римската империя и България от 681 г. са опростена схема (data/geo/preselenie.json) със знак
// „Приблизителни граници“. Стрелките са схема: показват посоката, а не точния път.
import { createStage, cornerMenu, esc, mat, labelSprite, addHitBox, zoneRing, THREE } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { createTimeline } from './hist/timeline.js';
import { createRegions, mapDecor, COL } from './hist/regions.js';
import { amphitheatre, column, crenellatedWall, basilica, M } from './hist/architecture.js';
import { rider, folk, squareTower } from './hist/bulgar.js';
import { animal } from './hist/thrace.js';

const SCHEME = '<br><i class="small">Стрелката е схема: показва посоката, а не точния път.</i>';
const APPROX = '<br><i class="small">Приблизителни граници.</i>';

// Народите: път [дължина, ширина, година]. Годините са на известните събития; между тях движението е схема.
const PEOPLES = [
  { id: 'huns', label: 'Хуни', icon: '🐎', color: 0x8e3b2f, kind: 'riders', rest: 420, gone: 454,
    pts: [[49.5, 48.6, 370], [42, 47.6, 373], [36, 47.0, 375], [28.5, 46.6, 400], [21.0, 46.9, 420], [12.5, 48.4, 445], [4.4, 48.9, 451]],
    note: 'Хуните са номади от степите на Азия. През 375 г. те нахлуват в Европа и тласкат готите на запад. Най-силни са при Атила. През 451 г. са спрени в битката на Каталаунските полета, а след смъртта на Атила (453 г.) държавата им се разпада.' },
  { id: 'visigoths', label: 'Вестготи', icon: '🛡️', color: 0x2f6fb0, kind: 'wagon', rest: 418,
    pts: [[29.8, 47.2, 375], [28.3, 45.0, 376], [26.55, 41.7, 378], [21.5, 42.6, 395], [13.6, 45.8, 401], [12.5, 41.9, 410], [7.0, 44.0, 414], [1.44, 43.6, 418], [-3.7, 40.4, 507]],
    note: 'Вестготите бягат от хуните и през 376 г. минават Дунав в Римската империя. През 378 г. разбиват римляните при Адрианопол (днешен Одрин), а през 410 г. превземат Рим. Създават кралство в Южна Галия, а после в Испания.' },
  { id: 'ostrogoths', label: 'Остготи', icon: '🛡️', color: 0x6a4fa3, kind: 'wagon', rest: 483,
    pts: [[34.0, 47.6, 375], [27.0, 47.2, 420], [19.0, 46.4, 455], [25.4, 43.62, 483], [19.5, 44.6, 488], [12.2, 44.4, 493]],
    note: 'Остготите живеят на север от Черно море и попадат под властта на хуните. След това се заселват в Панония, а по-късно и в Мизия — около Нове, край днешен Свищов. През 493 г. крал Теодорих създава остготско кралство в Италия.' },
  { id: 'vandals', label: 'Вандали', icon: '⛵', color: 0xb5651d, kind: 'wagon', rest: 439,
    pts: [[16.5, 50.6, 400], [8.3, 49.95, 406], [2.0, 47.0, 407], [-1.5, 43.0, 409], [-4.5, 37.6, 420], [-5.5, 35.8, 429], [2.0, 36.6, 432], [10.3, 36.85, 439]],
    note: 'Вандалите минават Рейн (406 г.), преминават през Галия и Испания и през 429 г. стигат до Северна Африка. През 439 г. превземат Картаген, а през 455 г. ограбват Рим.' },
  { id: 'franks', label: 'Франки', icon: '⚔️', color: 0x2f8f5b, kind: 'wagon', rest: 486,
    pts: [[6.6, 52.1, 400], [4.6, 50.6, 450], [3.3, 49.4, 486], [2.35, 48.85, 508]],
    note: 'Франките живеят край долния Рейн. В края на V в. крал Хлодвиг завладява Северна Галия и създава силно кралство. Името на днешна Франция идва от франките.' },
  { id: 'saxons', label: 'Англи и сакси', icon: '⛵', color: 0x3d8fa6, kind: 'boat', rest: 500,
    pts: [[9.6, 54.6, 430], [6.0, 55.2, 450], [1.8, 53.4, 470], [-1.0, 52.4, 500]],
    note: 'Англите и саксите живеят на юг от Балтийско и Северно море. През V в. те преминават морето и се заселват в Британия. Името Англия идва от англите.' },
  { id: 'slavs', label: 'Славяни', icon: '🌾', color: 0xc0392b, kind: 'slavs', rest: 620,
    pts: [[26.0, 50.2, 500], [26.6, 46.6, 527], [25.5, 43.9, 550], [23.6, 42.4, 580], [22.4, 40.0, 620]],
    note: 'Славяните живеят на север от Карпатите. През VI–VII в. те преминават Дунав и се заселват на Балканския полуостров, чак до Пелопонес.' },
  { id: 'bulgars', label: 'Прабългари', icon: '🏹', color: 0x1f6b3a, kind: 'riders', rest: 670,
    pts: [[38.6, 46.8, 632], [33.5, 46.7, 660], [29.4, 45.5, 670], [28.6, 44.4, 680], [27.38, 43.38, 681]],
    note: 'Около 632 г. хан Кубрат обединява българите в Стара Велика България, северно от Черно море. След смъртта му хан Аспарух води част от българите на запад. През 70-те години на VII в. те стигат до устието на Дунав.' },
];
const BULGAR_STOP = 670; // до стъпка 4 българите стигат само до устието на Дунав

const CITIES = [
  { id: 'rome', label: 'Рим', lon: 12.5, lat: 41.9,
    note: 'Рим — старата столица на империята. През 410 г. го превземат вестготите, а през 455 г. — вандалите. Колизеумът е запазен до днес; моделът е възстановка.' },
  { id: 'const', label: 'Константинопол', lon: 28.98, lat: 41.01,
    note: 'Константинопол (Цариград) — столицата на Източната Римска империя (Византия). В началото на V в. е защитен с дебели стени — Теодосиевите. Части от тях са запазени до днес; моделът е възстановка.' },
];

// Събития по години (за знака над картата при плъзгача).
const EVENTS = [
  { y: 375, t: '375 г. — хуните нахлуват в Европа', at: [36, 47.0] },
  { y: 376, t: '376 г. — вестготите минават Дунав', at: [28.3, 45.0] },
  { y: 378, t: '378 г. — битката при Адрианопол', at: [26.55, 41.7] },
  { y: 395, t: '395 г. — империята се разделя на Западна и Източна', at: [19.3, 43.5] },
  { y: 406, t: '406 г. — вандалите минават Рейн', at: [8.3, 49.95] },
  { y: 410, t: '410 г. — вестготите превземат Рим', at: [12.5, 41.9] },
  { y: 439, t: '439 г. — вандалите превземат Картаген', at: [10.3, 36.85] },
  { y: 451, t: '451 г. — Атила е спрян на Каталаунските полета', at: [4.4, 48.9] },
  { y: 453, t: '453 г. — Атила умира, държавата на хуните се разпада', at: [21.0, 46.9] },
  { y: 476, t: '476 г. — краят на Западната Римска империя', at: [10.0, 44.6] },
  { y: 493, t: '493 г. — остготско кралство в Италия', at: [12.2, 44.4] },
  { y: 550, t: 'VI век — славяните минават Дунав', at: [25.5, 43.9] },
  { y: 632, t: 'около 632 г. — Стара Велика България', at: [38.6, 46.8] },
  { y: 670, t: '70-те години на VII в. — Аспарух при устието на Дунав', at: [29.4, 45.5] },
];

// Стъпка 2: задачи с плъзгача.
const TASKS = [
  { id: 'huns', year: 375, ask: 'Премести плъзгача до <b>375 г.</b> Кой народ идва от степите на Азия и тласка другите на запад? Кликни го.',
    early: 'Премести плъзгача поне до 375 г. и виж кой се появява от изток.',
    good: 'Хуните нахлуват през 375 г. Готите бягат от тях към Римската империя. Това е <b>причината</b>, която раздвижва народите.' },
  { id: 'west', year: 476, ask: 'Продължи до <b>476 г.</b> Коя част на Римската империя пада тогава? Кликни я на картата.',
    early: 'Премести плъзгача до 476 г. и виж коя част на империята посивява.',
    good: '476 г.: германският вожд Одоакър сваля последния западноримски император. Западната Римска империя престава да съществува — това е <b>последица</b> от преселението.' },
  { id: 'east', year: 476, ask: 'Коя част на империята <b>оцелява</b>? Кликни я.',
    early: 'Премести плъзгача до 476 г.',
    good: 'Източната Римска империя — Византия — оцелява. Тя съществува още почти хиляда години, до 1453 г.' },
  { id: 'slavs', year: 550, ask: 'Премести плъзгача в <b>VI век</b> (след 550 г.). Кой народ преминава Дунав и се заселва на Балканите? Кликни го.',
    early: 'Премести плъзгача след 550 г. и виж кой преминава Дунав.',
    good: 'Славяните се заселват на Балканския полуостров през VI–VII в. И това е <b>последица</b> от преселението.' },
];
const WRONG = {
  huns: 'Хуните идват от изток — те раздвижват другите.',
  visigoths: 'Вестготите бягат от хуните и навлизат в империята.',
  ostrogoths: 'Остготите са германски народ, дошъл от север на Черно море.',
  vandals: 'Вандалите стигат чак до Северна Африка.',
  franks: 'Франките завладяват Галия.',
  saxons: 'Англите и саксите отиват в Британия.',
  slavs: 'Славяните идват по-късно — през VI–VII в.',
  bulgars: 'Прабългарите идват най-късно — през VII в.',
  west: 'Това е Западната Римска империя.',
  east: 'Това е Източната Римска империя — Византия.',
  rome: 'Това е градът Рим.',
  const: 'Това е Константинопол — столицата на Изтока.',
};

// Стъпка 3: причини и последици.
const CARDS = [
  { id: 'c-huns', bin: 'cause', label: 'Хуните нахлуват от изток', why: 'Помисли: нахлуването на хуните е в началото — то раздвижва другите народи.' },
  { id: 'c-weak', bin: 'cause', label: 'Римската империя отслабва', why: 'Слабата империя не може да спре племената — затова те навлизат в нея. Това е преди падането.' },
  { id: 'c-land', bin: 'cause', label: 'Племената търсят нови земи', why: 'Племената тръгват, защото търсят по-добри земи. Това е началото, а не резултатът.' },
  { id: 'e-fall', bin: 'effect', label: 'Пада Западната Римска империя', why: 'Империята пада, след като племената навлизат в нея. Това е резултат.' },
  { id: 'e-kings', bin: 'effect', label: 'Възникват варварски кралства', why: 'Кралствата възникват на мястото на падналата империя. Това е резултат.' },
  { id: 'e-slavs', bin: 'effect', label: 'Славяните се заселват на Балканите', why: 'Заселването е краят на движението, а не неговата причина.' },
];

// Стъпка 4: къде ще се заселят българите на Аспарух.
const OPTIONS = [
  { id: 'opt-moesia', label: 'Между Дунав и Стара планина', lon: 26.2, lat: 43.3, ok: true },
  { id: 'opt-thrace', label: 'Тракия до Константинопол', lon: 27.2, lat: 41.75,
    why: 'Не. Тракия е до Константинопол — сърцето на Византия. Там империята е най-силна и пази земите си.' },
  { id: 'opt-asia', label: 'Мала Азия', lon: 31.5, lat: 39.4,
    why: 'Не. Мала Азия е отвъд морето и е в ръцете на Византия. Българите идват от север, по суша.' },
];

const C_ROME = 0xc9a3d9, C_WEST = 0xe2a9b8, C_EAST = 0xa98bd6, C_LOST = 0xbfbfc8;
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const romanC = (y) => ['IV', 'V', 'VI', 'VII'][Math.min(3, Math.floor((y - 301) / 100))] || 'IV';

// ---------- модели на народите (гледат към +x) ----------
function walker(color) {
  const p = folk('bulgar', { scale: 0.9 });
  p.children[0].material = mat(color);
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.025, 16), mat(0xd9c28a, { metalness: 0.2 }));
  shield.rotation.x = Math.PI / 2; shield.position.set(0, 0.32, 0.15);
  const spear = box(0.015, 0.8, 0.015, mat(0x6b4f36)); spear.position.set(0.12, 0.42, -0.08);
  p.add(shield, spear);
  p.rotation.y = Math.PI / 2;
  return p;
}
function wagon(color) {
  const g = new THREE.Group();
  const wood = mat(0x8a6440);
  const bed = box(0.5, 0.08, 0.26, wood); bed.position.y = 0.16; g.add(bed);
  for (const s of [-1, 1]) { const side = box(0.5, 0.08, 0.02, wood); side.position.set(0, 0.23, s * 0.12); g.add(side); }
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.46, 14, 1, true, 0, Math.PI), mat(0xeee3c8, { side: THREE.DoubleSide }));
  cover.rotation.z = Math.PI / 2; // осата по дължината на колата, горната половина
  cover.position.y = 0.24; g.add(cover);
  const band = box(0.04, 0.02, 0.3, mat(color)); band.position.set(0, 0.39, 0); g.add(band);
  const wheels = [];
  for (const x of [-0.17, 0.17]) for (const z of [-0.15, 0.15]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 12), mat(0x5a4330));
    w.rotation.x = Math.PI / 2; w.position.set(x, 0.08, z); g.add(w); wheels.push(w);
  }
  const ox = animal('cow'); ox.scale.setScalar(0.7); ox.position.set(0.55, 0, 0); g.add(ox);
  const pole = box(0.25, 0.02, 0.02, wood); pole.position.set(0.32, 0.14, 0); g.add(pole);
  const man = walker(color); man.scale.setScalar(0.75); man.position.set(0.15, 0, 0.3); g.add(man);
  g.userData = { wheels, legs: ox.userData.legs, bob: [man] };
  return g;
}
function riders(kind, color) {
  const g = new THREE.Group();
  const legs = [];
  [[0.15, 0.12], [-0.25, -0.16]].forEach(([x, z]) => {
    const r = rider(kind);
    r.position.set(x, 0, z);
    r.traverse((o) => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0x6b4a2b) o.material = mat(color); });
    g.add(r); legs.push(...r.userData.legs);
  });
  g.userData = { legs, bob: [] };
  return g;
}
function boat(color) {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-0.38, 0); s.lineTo(0.3, 0); s.quadraticCurveTo(0.42, 0.02, 0.48, 0.14); s.lineTo(-0.44, 0.14); s.lineTo(-0.38, 0);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false }), mat(0x7a5634));
  hull.position.set(0, 0.02, -0.1); g.add(hull);
  const mast = box(0.025, 0.6, 0.025, mat(0x5a4330)); mast.position.set(0, 0.45, 0); g.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.32, 4, 1), mat(0xf3ead2, { side: THREE.DoubleSide }));
  sail.position.set(0, 0.52, 0); sail.rotation.y = Math.PI / 2; g.add(sail);
  for (let i = 0; i < 3; i++) { const st = box(0.005, 0.32, 0.05, mat(color)); st.position.set(0.004, 0.52, -0.11 + i * 0.11); g.add(st); }
  for (const x of [-0.22, 0.2]) { const p = folk('bulgar', { scale: 0.45 }); p.children[0].material = mat(color); p.position.set(x, 0.12, 0); g.add(p); }
  g.userData = { legs: [], bob: [], sail };
  return g;
}
function slavGroup() {
  const g = new THREE.Group();
  const a = folk('slav', { scale: 0.9 }); a.position.set(0.1, 0, 0.1);
  const b = folk('slavWoman', { scale: 0.85 }); b.position.set(-0.15, 0, -0.12);
  const sheep = animal('sheep'); sheep.scale.setScalar(0.8); sheep.position.set(0.3, 0, -0.2);
  g.add(a, b, sheep);
  g.userData = { legs: sheep.userData.legs, bob: [a, b] };
  return g;
}

export function mount(container, { onComplete } = {}) {
  const shell = createShell(container, { steps: ['Опознай', 'Изследвай с плъзгача', 'Причина или последица', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.4 / Math.max(aspect, 0.5) : 1;
  const narrow = far > 1;
  const VIEW = narrow ? [[0, 12.8 * far, 5.4 * far], [0, 0, 1.6]] : [[0, 11.4, 10.2], [0, 0, 1.7]];
  const VIEW3 = narrow ? [[0, 10.5, 13.0], [0, 0, 7.7]] : [[0, 8.6, 13.6], [0, 0, 7.1]];
  const stage = createStage(shell.stageEl, { background: 0xdcecf7, camPos: VIEW[0], target: VIEW[1], maxDistance: 40 });
  const { scene } = stage;

  let map = null, reg = null, decor = null, tl = null, menu = null, tip = null, evTip = null, clickHandler = null, stopDrag = null;
  const scores = [];
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.9, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const clearEv = () => { if (evTip) { evTip.remove(); evTip = null; } };
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));

  // ---------- народите: стрелка, която расте, и група, която върви ----------
  const people = new Map();
  let bulgarCap = BULGAR_STOP;
  function buildPeople() {
    for (const p of PEOPLES) {
      const pts = p.pts.map(([lon, lat]) => map.pos(lon, lat, 0.2));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
      const SEG = 220;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 0.045, 6, false), mat(p.color, { transparent: true, opacity: 0.9 }));
      tube.raycast = () => {};
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 12), mat(p.color));
      head.raycast = () => {};
      scene.add(tube, head);
      const lengths = curve.getLengths(400);
      const total = lengths[lengths.length - 1];
      const model = p.kind === 'riders' ? riders('bulgar', p.color)
        : p.kind === 'boat' ? boat(p.color) : p.kind === 'slavs' ? slavGroup() : wagon(p.color);
      model.scale.setScalar(0.62);
      const tok = new THREE.Group();
      tok.add(model);
      const lbl = labelSprite(p.label, { size: 0.24, color: '#1b2a3a', bg: 'rgba(255,255,255,0.88)', border: `#${p.color.toString(16).padStart(6, '0')}` });
      lbl.position.y = 0.78;
      tok.add(lbl);
      tok.userData = { pickId: p.id };
      addHitBox(tok, 0.55);
      scene.add(tok);
      people.set(p.id, { p, curve, tube, head, tok, model, lbl, lengths, total, SEG, t: 0, tTo: 0, show: 0 });
    }
  }
  // Параметър по кривата (0…1) за година: равномерно по отсечките между известните точки.
  function paramAt(p, y) {
    const ys = p.pts.map((q) => q[2]);
    if (y <= ys[0]) return 0;
    for (let i = 1; i < ys.length; i++) if (y < ys[i]) return (i - 1 + (y - ys[i - 1]) / (ys[i] - ys[i - 1])) / (ys.length - 1);
    return 1;
  }
  // Състояние на един народ: докъде е стрелката (year) и дали се вижда.
  // gone: след тази година народът вече не се движи като едно цяло (хуните след 453 г.); only: кои групи се виждат.
  function setPeople(y, { tokenYear = null, only = null } = {}) {
    for (const o of people.values()) {
      o.tokHidden = !tokenYear && o.p.gone && y > o.p.gone;
      const cap = o.p.id === 'bulgars' ? bulgarCap : Infinity;
      const yy = Math.min(y, cap);
      o.tTo = paramAt(o.p, yy);
      o.tokT = tokenYear ? paramAt(o.p, Math.min(tokenYear(o.p), cap)) : null;
      o.visible = yy >= o.p.pts[0][2] && (!only || only.includes(o.p.id));
    }
  }
  stage.tick((dt, t) => {
    for (const o of people.values()) {
      o.t += (o.tTo - o.t) * Math.min(1, dt * 4);
      if (Math.abs(o.tTo - o.t) < 1e-4) o.t = o.tTo;
      const vis = o.visible !== false && o.t > 0.002;
      o.tube.visible = vis; o.head.visible = vis; o.tok.visible = o.visible !== false && !o.tokHidden;
      const u = o.lengths[Math.round(o.t * 400)] / o.total;
      o.tube.geometry.setDrawRange(0, Math.floor(u * o.SEG) * 36);
      const tip_ = o.curve.getPoint(o.t);
      const tan = o.curve.getTangent(Math.min(0.999, Math.max(0.001, o.t)));
      o.head.position.copy(tip_);
      o.head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
      const tt = o.tokT != null ? o.tokT : o.t;
      const at = o.curve.getPoint(tt);
      o.tok.position.set(at.x, 0.13, at.z);
      const tg = o.curve.getTangent(Math.min(0.999, Math.max(0.001, tt)));
      o.model.rotation.y = Math.atan2(-tg.z, tg.x);
      const moving = Math.abs(o.tTo - o.t) > 1e-3;
      const sp = moving ? 12 : 3;
      for (const [i, l] of (o.model.userData.legs || []).entries()) l.rotation.z = Math.sin(t * sp + i * Math.PI / 2) * (moving ? 0.5 : 0.12);
      for (const b of o.model.userData.bob || []) b.position.y = Math.abs(Math.sin(t * 4 + o.p.color)) * 0.03;
      for (const w of o.model.userData.wheels || []) w.rotation.y += dt * (moving ? 6 : 0.6);
      if (o.model.userData.sail) { o.model.position.y = Math.sin(t * 1.6) * 0.02; o.model.userData.sail.rotation.y = Math.PI / 2 + Math.sin(t * 1.3) * 0.12; }
    }
  });

  // ---------- градовете (подробни модели) ----------
  const cities = new Map();
  function buildCities() {
    // Рим: Колизеумът и колони на форума.
    const rome = new THREE.Group();
    const amph = amphitheatre({ a: 1.15, b: 0.82, h: 0.62 }); amph.scale.setScalar(0.32); rome.add(amph);
    for (let i = 0; i < 4; i++) { const c = column('corinthian', { h: 0.3, r: 0.02 }); c.position.set(0.48 + i * 0.07, 0, 0.12); rome.add(c); }
    // Константинопол: стени с кули и голяма базилика.
    const con = new THREE.Group();
    const wall = crenellatedWall(1.0, { h: 0.22, t: 0.07, mud: false }); wall.position.set(-0.3, 0, 0); wall.rotation.y = Math.PI / 2; con.add(wall);
    for (const z of [-0.45, 0, 0.45]) { const tw = squareTower({ s: 0.32, h: 0.9 }); tw.scale.setScalar(0.38); tw.position.set(-0.3, 0, z); con.add(tw); }
    const bas = basilica({ L: 0.6, W: 0.34 }); bas.position.set(0.1, 0, 0); con.add(bas);
    for (const [c, g] of [[CITIES[0], rome], [CITIES[1], con]]) {
      const root = new THREE.Group();
      g.scale.setScalar(c.id === 'const' ? 0.55 : 0.8);
      root.add(g);
      const l = labelSprite(c.label, { size: 0.22 });
      l.position.y = 0.5;
      root.add(l);
      root.position.copy(map.pos(c.lon, c.lat, 0.13));
      root.userData = { pickId: c.id, lbl: l };
      addHitBox(root, 0.5);
      scene.add(root);
      cities.set(c.id, root);
    }
  }

  // Надписи „Римска империя“ (до 395 г.) и „Варварски кралства“ (след 476 г.).
  let romeLbl = null, barbLbl = null;
  const evAnchor = new THREE.Object3D();
  scene.add(evAnchor);
  function paintYear(y) {
    if (y < 395) reg.paint({ west: C_ROME, east: C_ROME }, { labels: false });
    else if (y < 476) reg.paint({ west: C_WEST, east: C_EAST }, { labels: true });
    else reg.paint({ west: C_LOST, east: C_EAST }, { labels: ['east'] });
    romeLbl.visible = y < 395;
    barbLbl.visible = y >= 476;
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    bulgarCap = BULGAR_STOP;
    setPeople(9999, { tokenYear: (p) => p.rest });
    paintYear(420);
    tl.group.visible = false;
    shell.task('Стрелките показват накъде се движат народите през IV–VII век. Разгледай всеки народ и двата големи града: избери ги от менюто или кликни върху тях.');
    const items = [...PEOPLES.map((p) => ({ id: p.id, label: p.label, icon: p.icon })), ...CITIES.map((c) => ({ id: c.id, label: c.label, icon: '🏛️' }))];
    const seen = new Set();
    const open = (id) => {
      const p = PEOPLES.find((x) => x.id === id), c = CITIES.find((x) => x.id === id);
      if (!p && !c) return;
      const obj = p ? people.get(id).tok : cities.get(id);
      stage.focusOn(obj, { dist: 3.6 * far, height: 3.4 * far, keepFollow: false });
      say(obj, `<b>${esc((p || c).label)}</b><br>${esc((p || c).note)}${p ? SCHEME : ''}`, { cls: 'wide' });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${items.length}`);
      if (seen.size === items.length) {
        const ctl = shell.setControls('<button class="btn primary">Напред →</button>');
        ctl.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items, onSelect: open });
    clickHandler = (id) => { if (id && items.some((i) => i.id === id)) open(id); };
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${items.length}`);
  }

  // ---------- 2. Изследвай: плъзгач на годината ----------
  function step2() {
    shell.step(1);
    stage.flyTo(VIEW[0], VIEW[1], 1);
    tl.group.visible = true;
    let mistakes = 0, k = 0, tries = 0;
    const c = shell.setControls(`<label class="small">Година: <b class="yr">370 г. (IV век)</b></label>
      <input class="yr-range" type="range" min="370" max="679" step="1" value="370" style="width:100%" aria-label="Година">
      <p class="small">Премествай плъзгача и гледай стрелките и цветовете на империята.</p>`);
    const range = c.querySelector('.yr-range');
    let lastEv = null;
    const update = () => {
      const y = +range.value;
      c.querySelector('.yr').textContent = `${y} г. (${romanC(y)} век)`;
      setPeople(y);
      paintYear(y);
      tl.setCursor(y);
      for (const [id, s] of tl.slots) tl.markSlot(id, y >= s.userData.year ? 0x14bf96 : 0xffffff);
      const ev = [...EVENTS].reverse().find((e) => e.y <= y && y - e.y <= 40);
      if (ev !== lastEv) {
        lastEv = ev;
        if (!ev) clearEv();
        else {
          evAnchor.position.copy(map.pos(ev.at[0], ev.at[1], 0.3));
          if (!evTip) evTip = stage.bubble(evAnchor, '', { lift: 0.5, cls: 'tag' });
          evTip.set(esc(ev.t));
        }
      }
    };
    range.addEventListener('input', update);
    update();
    const ask = () => { shell.task(TASKS[k].ask); shell.score(`Задачи: ${k} от ${TASKS.length}`); };
    ask();
    clickHandler = (id) => {
      if (!id || k >= TASKS.length || !WRONG[id]) return;
      const t = TASKS[k];
      if (id === t.id && +range.value < t.year) { mistakes++; tries++; shell.msg(t.early, 'bad'); return; }
      if (id !== t.id) {
        mistakes++; tries++;
        shell.msg(`${WRONG[id]} Опитай пак.`, 'bad');
        if (tries >= 2) {
          if (people.has(t.id)) say(people.get(t.id).tok, 'Подсказка: тук', { cls: 'tag' });
          else { reg.blink(t.id); say(reg.anchor(t.id), 'Подсказка: тук', { cls: 'tag' }); }
        }
        return;
      }
      tries = 0;
      reg.blink(null);
      const anchor = people.has(id) ? people.get(id).tok : reg.anchor(id);
      say(anchor, `${t.good}${people.has(id) ? '' : APPROX}`, { cls: 'good wide' });
      shell.msg('Вярно!', 'good');
      k++;
      if (k < TASKS.length) { ask(); return; }
      scores.push(stepScore(mistakes, 3));
      shell.score(`Задачи: ${TASKS.length} от ${TASKS.length}`);
      shell.task('Ти проследи <b>причините</b> (хуните, слабата империя) и <b>последиците</b> (краят на Западната Римска империя, нови народи на Балканите). Можеш още да местиш плъзгача.');
      clickHandler = null;
      const n = document.createElement('button');
      n.className = 'btn primary'; n.textContent = 'Напред →';
      n.addEventListener('click', () => { clearTip(); clearEv(); step3(); });
      shell.controls.appendChild(n);
    };
  }

  // ---------- 3. Причина или последица ----------
  let cards = [], zones = {};
  const sortMid = new THREE.Object3D();
  scene.add(sortMid);
  function buildSorting() {
    const zx = narrow ? 1.5 : 3.1, zz = narrow ? 9.75 : 8.95, zr = narrow ? 1.4 : 1.6;
    sortMid.position.set(0, 0.3, narrow ? 5.6 : 6.0);
    zones = {
      cause: { ring: zoneRing(0x2b6cb0, zr), label: 'Причини', pos: new THREE.Vector3(-zx, 0.05, zz) },
      effect: { ring: zoneRing(0xc0392b, zr), label: 'Последици', pos: new THREE.Vector3(zx, 0.05, zz) },
    };
    for (const z of Object.values(zones)) {
      z.ring.position.copy(z.pos);
      z.ring.userData.zoneId = z.label;
      const l = labelSprite(z.label, { size: 0.32, bg: 'rgba(255,255,255,0.95)' });
      l.position.set(z.pos.x, 0.5, z.pos.z - zr - 0.1);
      z.lbl = l;
      z.group = new THREE.Group(); z.group.add(z.ring, l);
      z.group.visible = false;
      z.n = 0;
      scene.add(z.group);
    }
    const order = [0, 3, 1, 4, 2, 5];
    cards = order.map((k, i) => {
      const d = CARDS[k];
      const cols = narrow ? 2 : 3;
      const col = i % cols, row = Math.floor(i / cols);
      const x = narrow ? (col - 0.5) * 2.75 : (col - 1) * 3.9;
      const z = narrow ? 5.0 + row * 1.05 : 5.4 + row * 0.85;
      const g = new THREE.Group();
      // На тесен екран текстът е на два реда и по-едър.
      const words = d.label.split(' ');
      const cut = Math.max(1, Math.round(words.length / 2));
      const lines = narrow ? [words.slice(0, cut).join(' '), words.slice(cut).join(' ')] : [d.label];
      const lbls = lines.map((t) => labelSprite(t, { size: narrow ? 0.28 : 0.22, border: 'rgba(0,0,0,0)', bg: 'rgba(255,255,255,0)' }));
      const w = Math.max(...lbls.map((l) => l.scale.x)) + 0.2, dep = narrow ? 0.8 : 0.5;
      const board = box(w, 0.06, dep, mat(0xfff4d6)); g.add(board);
      const edge = box(w + 0.06, 0.04, dep + 0.06, mat(0xa98b5a)); edge.position.y = -0.02; g.add(edge);
      lbls.forEach((l, j) => { l.position.set(0, 0.3, narrow ? -0.17 + j * 0.34 : 0); g.add(l); });
      g.position.set(x, 0.25, z);
      g.userData = { dragId: d.id, pickId: d.id, home: g.position.clone(), card: d, board };
      addHitBox(g, 0.6);
      g.visible = false;
      scene.add(g);
      return g;
    });
  }
  function step3() {
    shell.step(2);
    shell.score('');
    tl.group.visible = false;
    tl.hideCursor();
    stage.flyTo(VIEW3[0], VIEW3[1], 1);
    for (const z of Object.values(zones)) { z.group.visible = true; z.n = 0; }
    for (const g of cards) { g.visible = true; g.position.copy(g.userData.home); g.userData.locked = false; g.userData.board.material.color.setHex(0xfff4d6); }
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Кое е <b>причина</b> за Великото преселение и кое е негова <b>последица</b>? Завлечи всяка карта в правилния кръг.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${CARDS.length}`);
    clickHandler = null;
    const zoneAt = (p) => Object.entries(zones).find(([, z]) => Math.hypot(p.x - z.pos.x, p.z - z.pos.z) < z.ring.userData.radius + 0.2)?.[0];
    stopDrag = stage.enableDrag({
      planeY: 0.25,
      onDrop(obj) {
        const d = obj.userData.card;
        const zid = zoneAt(obj.position);
        if (!zid) { obj.position.copy(obj.userData.home); return; }
        if (zid === d.bin) {
          const z = zones[zid];
          obj.position.set(z.pos.x, 0.25 + z.n * 0.02, narrow ? z.pos.z - 0.85 + z.n * 0.85 : z.pos.z - 0.75 + z.n * 0.62);
          z.n++;
          obj.userData.locked = true;
          obj.userData.board.material.color.setHex(zid === 'cause' ? 0xdbe8f8 : 0xf8dfdb);
          placed++;
          shell.score(`Подредени: ${placed} от ${CARDS.length}`);
          shell.msg('Вярно!', 'good');
          if (placed === CARDS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 3));
            say(sortMid, '<b>Причини → последици.</b> Натискът на хуните и слабостта на Рим раздвижват народите. Резултатът е нова карта на Европа: пада Западната Римска империя, възникват варварски кралства, а славяните се заселват на Балканите.', { cls: 'good wide', lift: 0.2 });
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[d.id] = (tries[d.id] || 0) + 1;
          obj.position.copy(obj.userData.home);
          shell.msg(d.why, 'bad');
          if (tries[d.id] >= 2) say(zones[d.bin].ring, 'Подсказка: тук', { cls: 'tag', lift: 0.5 });
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  let settlers = [], pliska = null, stopSettlers = null;
  const northAnchor = new THREE.Object3D();
  scene.add(northAnchor);
  function buildStep4() {
    for (const o of OPTIONS) map.addPlace(o.id, { lon: o.lon, lat: o.lat, label: o.label, color: 0xf2b01e, labelDx: o.id === 'opt-asia' ? 0.3 : 0 });
    for (const o of OPTIONS) map.showPlace(o.id, false);
    pliska = map.addPlace('pliska', { lon: 27.38, lat: 43.38, label: 'Плиска', color: 0x1f6b3a, labelDx: 0.4 });
    map.showPlace('pliska', false);
    const spots = [[25.2, 43.4, 'slav'], [25.9, 43.2, 'slavWoman'], [26.6, 43.7, 'slav'], [27.6, 43.9, 'rider'], [26.9, 43.1, 'rider']];
    settlers = spots.map(([lon, lat, kind]) => {
      const f = kind === 'rider' ? rider('bulgar') : folk(kind);
      f.scale.setScalar(kind === 'rider' ? 0.36 : 0.45);
      f.position.copy(map.pos(lon, lat, 0.13));
      f.userData.home = f.position.clone();
      f.visible = false;
      scene.add(f);
      return f;
    });
    stopSettlers = stage.tick((dt, t) => {
      settlers.forEach((f, i) => {
        if (!f.visible) return;
        const a = t * 0.35 + i * 1.7;
        f.position.x = f.userData.home.x + Math.cos(a) * 0.18;
        f.position.z = f.userData.home.z + Math.sin(a * 0.8) * 0.12;
        f.rotation.y = -a + (f.userData.legs ? 0 : Math.PI / 2);
        for (const [k, l] of (f.userData.legs || []).entries()) l.rotation.z = Math.sin(t * 8 + k * Math.PI / 2) * 0.4;
      });
    });
  }
  function step4() {
    shell.step(3);
    shell.score('');
    for (const z of Object.values(zones)) z.group.visible = false;
    for (const g of cards) g.visible = false;
    bulgarCap = BULGAR_STOP;
    setPeople(679, { only: ['slavs', 'bulgars'] });
    paintYear(679);
    for (const o of OPTIONS) { map.showPlace(o.id, true); map.colorPlace(o.id); }
    const focus = map.pos(27.0, 43.9, 0);
    stage.flyTo([focus.x, 5.0 * far, focus.z + 1.7 * far], [focus.x, 0, focus.z], 1.1);
    northAnchor.position.copy(map.pos(27.4, 46.2, 0.2));
    const bul = people.get('bulgars').tok;
    say(bul, '<b>Около 680 г.</b> Българите на Аспарух са при устието на Дунав. На юг от реката вече живеят славяни.', { cls: 'wide' });
    let mistakes = 0;
    shell.task('Българите на хан Аспарух търсят земя за заселване. <b>Къде ще се заселят според теб?</b> Избери тук или кликни жълта карфица.');
    const c = shell.setControls(`<div class="col">${OPTIONS.map((o) => `<button class="btn" data-id="${o.id}">${esc(o.label)}</button>`).join('')}</div>`);
    let done = false;
    const choose = (id) => {
      const o = OPTIONS.find((x) => x.id === id);
      if (!o || done) return;
      const b = c.querySelector(`[data-id="${id}"]`);
      if (!o.ok) {
        if (b && b.disabled) return;
        mistakes++; if (b) b.disabled = true;
        map.colorPlace(id, 0x9a9a9a);
        shell.msg(o.why, 'bad');
        return;
      }
      done = true;
      scores.push(stepScore(mistakes, 2));
      c.querySelectorAll('button').forEach((x) => { x.disabled = true; });
      // Какво наистина става: Аспарух минава Дунав, Византия признава новата държава.
      bulgarCap = 681;
      setPeople(681, { only: ['slavs', 'bulgars'], tokenYear: (p) => (p.id === 'bulgars' ? 680 : p.rest) });
      reg.setColor('bg681', COL.bg);
      // Отблизо: махат се надписите, които закриват новата държава.
      reg.paint({ west: C_LOST, east: C_EAST, bg681: COL.bg }, { labels: ['bg681'] });
      barbLbl.visible = false;
      for (const x of people.values()) x.lbl.visible = false;
      cities.get('const').userData.lbl.visible = false;
      const fz = map.pos(26.9, 44.2, 0);
      stage.flyTo([fz.x, 3.8 * far, fz.z + 1.7 * far], [fz.x, 0, fz.z], 1.2);
      for (const x of OPTIONS) map.showPlace(x.id, false);
      map.showPlace('pliska', true);
      settlers.forEach((f) => { f.visible = true; });
      say(northAnchor, '<b>Така и става.</b> През 680 г. Аспарух разбива византийската войска и минава Дунав. През 681 г. Византия сключва мир и признава новата държава на българите и славяните — България. Първата ѝ столица е Плиска.' + APPROX, { cls: 'good wide', lift: 0.1 });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => {
        clearTip();
        const ratio = scores.reduce((a, s) => a + s, 0) / scores.length;
        shell.finish(ratio, onComplete, restart);
      });
    };
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => choose(b.dataset.id)));
    clickHandler = (id) => choose(id);
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    for (const x of people.values()) x.lbl.visible = true;
    cities.get('const').userData.lbl.visible = true;
    clearTip(); clearEv();
    if (menu) menu.remove();
    tl.reset();
    reg.hide('bg681');
    reg.blink(null);
    for (const o of OPTIONS) map.showPlace(o.id, false);
    map.showPlace('pliska', false);
    settlers.forEach((f) => { f.visible = false; });
    for (const z of Object.values(zones)) z.group.visible = false;
    for (const g of cards) { g.visible = false; g.position.copy(g.userData.home); g.userData.locked = false; }
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  shell.task('Зареждане на картата…');
  createMap(stage, { url: 'data/geo/europe.json', center: [19.5, 45.0], unitsPerDeg: 0.3, focus: 'none', showNames: false, height: 0.08 })
    .then(async (m) => {
      map = m;
      reg = await createRegions(stage, map, { url: 'data/geo/preselenie.json', y: 0.085, height: 0.03,
        names: { west: 'Западна Римска империя', east: 'Източна Римска империя (Византия)' } });
      reg.hide('bg681');
      // Новата държава се рисува над Източната империя (иначе двете области се застъпват).
      reg.regions.get('bg681').traverse((o) => { if (o.isMesh || o.isLine) o.position.y += 0.035; });
      decor = mapDecor(stage, map, [
        { text: 'Черно море', lon: 34.5, lat: 43.2, sea: true, size: 0.2 }, { text: 'Средиземно море', lon: 18.0, lat: 34.6, sea: true, size: 0.2 },
        { text: 'Атлантически океан', lon: -7.5, lat: 47.5, sea: true, size: 0.18 }, { text: 'Северно море', lon: 3.2, lat: 56.6, sea: true, size: 0.18 },
        { text: 'Балтийско море', lon: 19.5, lat: 56.8, sea: true, size: 0.18 },
        { text: 'Галия', lon: 3.6, lat: 46.3, size: 0.18 }, { text: 'Испания', lon: -4.5, lat: 39.6, size: 0.18 }, { text: 'Италия', lon: 14.6, lat: 41.3, size: 0.18 },
        { text: 'Британия', lon: -2.0, lat: 54.0, size: 0.17 }, { text: 'Мала Азия', lon: 35.0, lat: 38.5, size: 0.18 }, { text: 'Северна Африка', lon: 4.0, lat: 33.0, size: 0.18 },
        { text: 'Азиатски степи', lon: 46.0, lat: 51.5, size: 0.18 },
      ]);
      romeLbl = labelSprite('Римска империя', { size: 0.26, bg: 'rgba(255,255,255,0.85)', border: 'rgba(0,0,0,0)' });
      romeLbl.position.copy(map.pos(15.5, 44.0, 0.6)); scene.add(romeLbl);
      barbLbl = labelSprite('Варварски кралства', { size: 0.24, bg: 'rgba(255,255,255,0.85)', border: 'rgba(0,0,0,0)' });
      barbLbl.position.copy(map.pos(0.0, 45.2, 0.6)); scene.add(barbLbl);
      // Днешните граници са само за ориентир.
      const note = document.createElement('div');
      note.className = 'map-approx';
      note.textContent = narrow ? 'Тънките линии: днешни граници (за ориентир)' : 'Тънките линии са днешните граници — само за ориентир.';
      Object.assign(note.style, { position: 'absolute', ...(narrow ? { left: '8px', bottom: '34px' } : { right: '8px', bottom: '8px' }), zIndex: 3, padding: '3px 8px', borderRadius: '6px',
        background: 'rgba(255,255,255,0.9)', border: '1px solid #c7d3e0', font: '600 12px/1.3 system-ui, sans-serif', color: '#44505c', pointerEvents: 'none' });
      shell.stageEl.appendChild(note);
      tl = createTimeline(stage, { from: 370, to: 680, x: narrow ? 0 : 0.6, z: 5.5, length: narrow ? 8.2 : 9.8, tick: 100, tickLabel: (y) => `${y} г.` });
      tl.addSlot('y375', { year: 375, label: '375 г.' });
      tl.addSlot('y395', { year: 395, label: '395 г.' });
      tl.addSlot('y476', { year: 476, label: '476 г.' });
      tl.group.visible = false;
      buildPeople();
      buildCities();
      buildSorting();
      buildStep4();
      step1();
    })
    .catch((e) => shell.msg(`Картата не се зареди: ${e.message}`, 'bad'));

  container.__demo = {
    stage, get map() { return map; }, get reg() { return reg; },
    at: (id) => (reg && reg.regions.has(id) ? reg.screenOf(id) : stage.screenOf(id)),
  };
  return { dispose() { if (stopDrag) stopDrag(); if (stopSettlers) stopSettlers(); if (menu) menu.remove(); if (decor) decor.dispose(); if (reg) reg.dispose(); if (tl) tl.dispose(); stage.dispose(); } };
}
