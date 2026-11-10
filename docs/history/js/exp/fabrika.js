// 8.2.5 „Първата индустриална революция“ — английски фабричен град около 1830 г.
// Стъпки: разходка по спирките → опит с парната машина (и водно колело срещу пара) →
// линия на времето с изобретенията → предскажи какво става с градовете и хората.
import { createStage, labelSprite, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createWalk } from './hist/walk.js';
import { createTimeline } from './hist/timeline.js';
import { mergeStatic, river as makeRiver, tree, stoneBridge } from './hist/medieval.js';
import { animal } from './hist/thrace.js';
import { wander } from './hist/antiquity.js';
import {
  IM, cm, mill, engineHouse, chimney, beamEngine, lineShaft, beltBetween, beltTexture, boiler, powerLoom, animateLoom,
  spinningMule, setMule, worker, terraceRow, pump, washingLine, church, school, station, track, rocket, coach, barge,
  headframe, coalWagon, waterMill, plume,
} from './hist/industrial.js';

const REC = 'Възстановка';
// Спирки на разходката. Всяка казва кое е исторически факт и кое е възстановка (принцип 10).
const STOPS = [
  { id: 'mill', label: 'Текстилната фабрика', icon: '🏭', at: [-10.2, 8.2], eyeY: 5.0, look: [-1.8, 2.6, -3], anchor: 'millA',
    note: `Първите фабрики в Англия са текстилни — в тях се преде и тъче памук. Сградата е тухлена, на няколко етажа, с много прозорци за светлина и висок комин. Такива фабрики са запазени и днес в Северна Англия. <i>${REC}: тази фабрика не е определена сграда; стената на долния етаж е махната, за да се вижда вътре.</i>` },
  { id: 'engine', label: 'Парната машина', icon: '⚙️', at: [-3.9, 3.4], eyeY: 2.1, look: [-4.1, 1.5, -2.8], anchor: 'engineA',
    note: `Огънят под котела превръща водата в пара. Парата бута буталото, голямата греда се люлее и върти маховика, а от него валът движи всички машини. Джеймс Уат получава патент за подобрената си парна машина през 1769 г. <i>Машини на Уат са запазени в музеи. Тази е опростена ${REC.toLowerCase()}.</i>` },
  { id: 'machines', label: 'Предачна машина и стан', icon: '🧵', at: [3.4, 1.9], eyeY: 1.8, look: [2.7, 0.6, -2.8], anchor: 'loomA',
    note: `Предачната машина изпреда много конци наведнъж. Първата такава машина е „Джени“ на Джеймс Харгрийвс от 1760-те години. Механичният стан тъче плат със силата на парата — изобретява го Едмънд Картрайт през 1785 г. Платът става много по-евтин. <i>Машините тук са ${REC.toLowerCase()}.</i>` },
  { id: 'workers', label: 'Работниците', icon: '👷', at: [0.7, 1.6], eyeY: 1.6, look: [0.3, 0.5, -2.4], anchor: 'childA',
    note: `Във фабриката работят мъже, жени и деца. Работният ден често е 12 часа и повече, в шум и прах. Децата връзват скъсаните конци и чистят под машините. Това знаем от спомените на работници и от докладите на комисии на парламента. <i>Хората тук са ${REC.toLowerCase()}.</i>` },
  { id: 'mine', label: 'Въгленовата мина', icon: '⛏️', at: [-7.4, 2.4], eyeY: 2.8, look: [-12.8, 1.6, -4.4], anchor: 'mineA',
    note: `Парните машини горят въглища. Англия има много въглища и желязо — една от причините революцията да започне там. Първите парни машини са направени за мините — да изпомпват водата. Над шахтата машина вади клетката с въглищата и хората. В мините също работят деца. <i>Мината е ${REC.toLowerCase()}.</i>` },
  { id: 'canal', label: 'Реката и каналът', icon: '🚣', at: [-21.0, 4.6], eyeY: 2.6, look: [-15.4, 0.6, 0.6], anchor: 'canalA',
    note: `Преди парата фабриките се строят до бързи реки — водното колело върти машините. Каналите са изкопани водни пътища за тежки товари: кон тегли баржа с въглища или памук много по-евтино, отколкото с каруци. <i>Мелницата, каналът и баржата са ${REC.toLowerCase()}.</i>` },
  { id: 'railway', label: 'Железницата', icon: '🚂', at: [-2.6, 4.5], eyeY: 2.4, look: [2.2, 0.8, 7.0], anchor: 'stationA',
    note: `Локомотивът „Ракета“ на Джордж Стивънсън печели състезание на локомотиви през 1829 г. От 1830 г. влаковете возят хора и стоки между Ливърпул и Манчестър. Пътуването става много по-бързо. <i>Истинската „Ракета“ се пази в музей. Влакът тук е ${REC.toLowerCase()}.</i>` },
  { id: 'houses', label: 'Работническите къщи', icon: '🏘️', at: [2.5, 7.9], eyeY: 1.4, look: [2.5, 0.7, 12.5], anchor: 'pumpA',
    note: `Около фабриките набързо се строят еднакви тухлени къщи в дълги редици. Семействата живеят на тясно, водата се носи от обща помпа, а въздухът е пълен с дим. Градовете растат много бързо. <i>Улицата е ${REC.toLowerCase()} по запазени къщи и рисунки от онова време.</i>` },
];

const FIRE_NAMES = ['няма', 'малко', 'средно', 'много'];
const PREDICT_ENGINE = [
  { t: 'Ще работят по-бързо: повече огън дава повече пара.', ok: true },
  { t: 'Ще работят по-бавно.', ok: false, why: 'Повече огън не може да забави машината. Помисли какво прави огънят с водата в котела.' },
  { t: 'Нищо няма да се промени.', ok: false, why: 'Огънят и машината са свързани чрез парата. Какво става с водата, когато огънят е по-силен?' },
];
const SAFETY_Q = [
  { t: 'Изпусна излишната пара, за да не се пръсне котелът.', ok: true },
  { t: 'Угаси огъня.', ok: false, why: 'Огънят още гори — виж огнището. Погледни откъде излиза парата.' },
  { t: 'Ускори машината.', ok: false, why: 'Клапанът към машината е затворен и тя спира. Погледни стрелката, когато излиза парата.' },
];
const WATER_Q = [
  { t: 'Парната машина работи навсякъде, където могат да се докарат въглища и вода.', ok: true },
  { t: 'Всички реки пресъхват.', ok: false, why: 'Реките не пресъхват завинаги. Помисли какво трябва на парната машина, за да работи.' },
  { t: 'Водата разваля платовете.', ok: false, why: 'Не е това. Сравни какво движи водното колело и какво — парната машина.' },
];
// Линия на времето: само сигурни години.
const INVENTIONS = [
  { id: 'c-loom', slot: 'loom', short: 'стан на Картрайт', label: 'Механичен стан — Картрайт', hint: 'Станът идва след предачните машини и след парната машина на Уат.' },
  { id: 'c-rocket', slot: 'rocket', short: '„Ракета“', label: '„Ракета“ — Стивънсън', hint: '„Ракета“ печели състезанието малко преди да тръгнат влаковете Ливърпул – Манчестър.' },
  { id: 'c-watt', slot: 'watt', short: 'машина на Уат', label: 'Парна машина — Уат (патент)', hint: 'Уат получава патента си в края на 60-те години на XVIII век.' },
  { id: 'c-jenny', slot: 'jenny', short: '„Джени“', label: '„Джени“ — Харгрийвс', hint: '„Джени“ е най-ранното от четирите изобретения.' },
];
const SLOTS = [
  { id: 'jenny', year: 1765, label: '1760-те' },
  { id: 'watt', year: 1769, label: '1769 г.' },
  { id: 'loom', year: 1785, label: '1785 г.' },
  { id: 'rocket', year: 1829, label: '1829 г.' },
];
// Предскажи: три реални въпроса, след всеки сцената показва какво наистина става.
const PREDICT = [
  { id: 'city', q: 'Фабриките в града имат нужда от все повече работници. <b>Какво ще стане?</b>',
    opts: [
      { t: 'Хората се местят от селата в градовете и градовете растат бързо.', ok: true },
      { t: 'Хората остават на село и всеки ден ходят пеша до далечните фабрики.', ok: false, why: 'Пътят е много дълъг за работен ден от 12 часа. Помисли къде ще живеят работниците.' },
      { t: 'Фабриките се затварят, защото няма кой да работи.', ok: false, why: 'Фабриките печелят и се строят все нови. Помисли откъде идват работниците.' },
    ],
    real: 'Хората идват от селата да работят във фабриките. Преброяванията на населението (първото във Великобритания е през 1801 г.) показват, че Манчестър расте няколко пъти за 50 години. Това се нарича <b>урбанизация</b>.' },
  { id: 'law', q: 'Около 1830 г. деца работят във фабриките по 12 часа на ден. Много хора протестират срещу това. <b>Какво ще направи парламентът?</b>',
    opts: [
      { t: 'Приема закон, който забранява работата на най-малките деца и намалява часовете на по-големите.', ok: true },
      { t: 'Нищо — детският труд остава същият още сто години.', ok: false, why: 'Държавата се намесва още през 30-те години на XIX век. Помисли за закон.' },
      { t: 'Затваря всички фабрики.', ok: false, why: 'Фабриките остават — те са основата на новото стопанство. Помисли как може да се защитят децата.' },
    ],
    real: 'Законът за фабриките от 1833 г. забранява в текстилните фабрики работата на деца под 9 години, ограничава работния ден на децата от 9 до 13 години и ги задължава да учат по 2 часа на ден. Появяват се инспектори. Детският труд изчезва бавно — с много следващи закони.' },
  { id: 'union', q: 'Работниците искат по-кратък работен ден и по-високи заплати. <b>Какво правят?</b>',
    opts: [
      { t: 'Сдружават се в синдикати и заедно преговарят със собствениците или стачкуват.', ok: true },
      { t: 'Всички напускат фабриките и се връщат по селата.', ok: false, why: 'Повечето остават — в града има работа. Те търсят друг начин да подобрят живота си.' },
      { t: 'Всеки сам се разбира със собственика и така постига всичко.', ok: false, why: 'Сам работник трудно постига нещо. Помисли какво могат да направят много работници заедно.' },
    ],
    real: 'Работниците създават синдикати (профсъюзи). Във Великобритания сдружаването им е разрешено със закон през 1824 г. Борбата за по-кратък работен ден продължава през целия XIX век.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Разходка из фабричния град', 'Парната машина', 'Изобретенията във времето', 'Предскажи'] });
  const stage = createStage(shell.stageEl, { background: 0xc9d1d8, camPos: [0, 15, 26], target: [0, 0, 2], minDistance: 0.3, maxDistance: 48, maxPolarAngle: Math.PI * 0.49, fog: { color: 0xc9d1d8, near: 32, far: 80 } });
  const { scene } = stage;
  // Тесен екран: изгледите се отдръпват назад.
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const view = (pos, tgt, dur = 1) => stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * far), tgt, dur);
  const named = {};
  const anchor = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  // Неподвижното отива в city и накрая се слива (по-малко рисувания на кадър); движещото се — направо в сцената.
  const city = new THREE.Group(); scene.add(city);
  const add = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; city.add(o); return o; };
  const addS = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; scene.add(o); return o; };

  // ---------- земя, улици, вода ----------
  const ground = new THREE.Mesh(new THREE.BoxGeometry(56, 0.1, 44), cm(0x8f9c6c));
  ground.position.set(0, -0.06, 2); city.add(ground);
  const pave = (x, z, w, d, name = 'cobble', color = 0xffffff) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), IM(name, { color, rep: [Math.max(1, Math.round(w / 1.5)), Math.max(1, Math.round(d / 1.5))] })); m.position.set(x, 0.005, z); city.add(m); return m; };
  pave(-0.5, -0.9, 16, 6.8);              // фабричният двор
  pave(8.5, 2, 1.6, 28);                   // главната улица
  pave(-4.5, 11.3, 2.0, 6.2, 'cobble', 0xd0c8b8); pave(2.5, 11.3, 2.0, 6.2, 'cobble', 0xd0c8b8); pave(11.5, 11.3, 2.0, 6.2, 'cobble', 0xd0c8b8);
  pave(2, -5.8, 10, 1.6, 'cobble', 0xd0c8b8); pave(0, 4.35, 32, 0.6, 'cobble', 0xb8ad98); // улица зад фабриката, пътека край канала
  pave(1, 7.7, 34, 1.2, 'cobble', 0xc8c0b0);
  add(stoneBridge(2.8, { w: 0.9, h: 0.35, n: 1 }), -16.95, -0.3, 6.4);
  // Канал с каменни брегове.
  const canalTex = IM('water', { rep: [24, 1] }).map;
  const canal = new THREE.Mesh(new THREE.BoxGeometry(33, 0.03, 1.3), new THREE.MeshStandardMaterial({ map: canalTex, roughness: 0.3 }));
  canal.position.set(0.5, 0.0, 3.2); city.add(canal);
  for (const z of [2.5, 3.9]) { const e = new THREE.Mesh(new THREE.BoxGeometry(33, 0.08, 0.14), IM('cobble', { color: 0xd8d0c0, rep: [20, 1] })); e.position.set(0.5, 0.04, z); city.add(e); }
  // Река със старата водна мелница.
  const riv = makeRiver([[-17.6, -16], [-17, -8], [-16.6, -1], [-16.9, 3.2], [-17.4, 10], [-17.1, 20]], { width: 1.9, y: 0.02 });
  scene.add(riv.group);
  const wmill = add(waterMill(), -14.9, 0, -1.2);
  named.wmill = wmill;
  mergeStatic(wmill, [wmill.userData.wheel]);
  const bridge = add(stoneBridge(2.2, { w: 1.4, h: 0.4, n: 1 }), 8.5, 0, 3.2, Math.PI / 2); mergeStatic(bridge);

  // ---------- фабриката, машинната зала, котелното, комина ----------
  const millG = add(mill({ w: 8, d: 3.2, floors: 4, fh: 1.25, bays: 10 }), 2, 0, -3);
  mergeStatic(millG);
  millG.userData.pickId = 'mill'; named.mill = millG;
  anchor('millA', 1.5, 4.0, -1.4);
  const eh = add(engineHouse({ w: 3.0, d: 3.2, h: 3.4 }), -3.5, 0, -3); mergeStatic(eh);
  const bh = add(engineHouse({ w: 2.0, d: 2.6, h: 1.9, arched: false, roofRise: 0.5 }), -6.0, 0, -2.9); mergeStatic(bh);
  const chim = add(chimney(9), -7.9, 0, -4.3); mergeStatic(chim);
  const eng = add(beamEngine(), -3.6, 0, -2.75);
  mergeStatic(eng, eng.userData.moving);
  named.engine = eng; anchor('engineA', -1.2, 3.4, -1.4);
  const blr = add(boiler(), -6.0, 0, -3.0);
  mergeStatic(blr, [blr.userData.glow, blr.userData.lever, blr.userData.needle]);
  named.boiler = blr;
  // Трансмисионен вал през целия долен етаж и машините.
  const shaftStart = eng.userData.shaftStart.clone().add(eng.position);
  const MULE_X = 0.2, LOOM_X = [2.7, 3.85, 5.0];
  const pulX = [MULE_X + 1.62, ...LOOM_X.map((x) => x + 0.44)];
  const shaft = add(lineShaft(5.8 - shaftStart.x, pulX.map((x) => x - shaftStart.x)), shaftStart.x, shaftStart.y, shaftStart.z);
  const mule = add(spinningMule(2.6), MULE_X, 0, -2.75);
  const looms = LOOM_X.map((x, i) => add(powerLoom({ cloth: [0x6f8fb8, 0xb8706f, 0xd8c890][i] }), x, 0, -2.5));
  for (const l of looms) mergeStatic(l, [l.userData.batten, l.userData.pulley, l.userData.roll]);
  mergeStatic(mule, [mule.userData.carriage, mule.userData.yarn, mule.userData.wheel]);
  named.loom = looms[1]; anchor('loomA', 3.6, 1.0, -2.4);
  const belts = new THREE.Group(); city.add(belts);
  belts.add(beltBetween([pulX[0], 0.4, -2.85], [pulX[0], shaftStart.y, shaftStart.z]));
  LOOM_X.forEach((x, i) => belts.add(beltBetween([pulX[i + 1], 0.45, -2.6], [pulX[i + 1], shaftStart.y, shaftStart.z])));
  const beltTex = beltTexture();
  // Работниците в цеха.
  const weavers = LOOM_X.map((x) => addS(worker('woman'), x, 0, -1.95, Math.PI));
  const spinner = addS(worker('man'), 1.95, 0, -1.85, Math.PI);
  const girl = addS(worker('girl'), 0.0, 0, -1.72, Math.PI);
  const boy = addS(worker('boy'), -0.7, 0, -1.8, Math.PI);
  const engineer = addS(worker('master'), -2.7, 0, -1.95, -Math.PI / 2);
  const stoker = addS(worker('man'), -5.5, 0, -1.95, Math.PI * 0.85);
  named.childA = anchor('childA', 0.0, 0.75, -1.72);
  const millKids = [girl, boy];
  for (const k of millKids) k.userData.home0 = k.position.clone();

  // ---------- двор, склад, училище ----------
  const bales = new THREE.Group();
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.3), cm(0xeee6d2)); b.position.set(-7.6 + (i % 3) * 0.45, 0.15 + Math.floor(i / 3) * 0.3, 0.4); bales.add(b); }
  city.add(bales);
  const coalHeap = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.6, 10), IM('coal', { rough: 0.6 })); coalHeap.position.set(-5.6, 0.3, 1.4); city.add(coalHeap);
  const sch = add(school(), 7.05, 0, 0.5, -Math.PI / 2); mergeStatic(sch); named.school = sch;
  const schLbl = labelSprite('Училище', { size: 0.2 }); schLbl.position.set(7.05, 2.2, 0.5); schLbl.visible = false; scene.add(schLbl);

  // ---------- мината ----------
  const hf = add(headframe(), -12.2, 0, -4.4); mergeStatic(hf, hf.userData.moving);
  named.mine = hf; anchor('mineA', -12.2, 3.7, -4.4);
  const wh = add(engineHouse({ w: 2.0, d: 1.8, h: 2.2, open: false, roofRise: 0.5 }), -15.0, 0, -4.4, Math.PI / 2); mergeStatic(wh);
  const mchim = add(chimney(5.5, { r0: 0.4, r1: 0.25 }), -15.9, 0, -5.8); mergeStatic(mchim);
  const mheap = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.0, 11), IM('coal', { rough: 0.6 })); mheap.position.set(-10.0, 0.5, -6.0); city.add(mheap);
  const wway = add(track(6.2), -12.2, 0, -0.6, Math.PI / 2); mergeStatic(wway);
  const wagon = addS(coalWagon(), -12.2, 0.08, -1, Math.PI / 2);
  const wagon2 = add(coalWagon(), -12.2, 0.08, 2.0, Math.PI / 2);
  const miners = [addS(worker('miner'), -11.2, 0, -3.4), addS(worker('miner'), -13.0, 0, -2.6), addS(worker('boy'), -11.6, 0, -1.6)];

  // ---------- канал, баржа, кон ----------
  const barg = addS(barge(), -6, 0.02, 3.2);
  const horse = addS(animal('horse'), -3.4, 0, 4.35);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 4), cm(0x6b5a40)); scene.add(rope);
  anchor('canalA', -15.6, 1.4, 2.4);

  // ---------- железница ----------
  const rail = add(track(46), 0, 0, 6.4); mergeStatic(rail);
  for (const s of [-1, 1]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), cm(0x7f9160));
    hill.scale.set(4, 2.6, 3.4); hill.position.set(s * 23.5, 0, 6.4); city.add(hill);
    const portal = new THREE.Group();
    const stoneM = IM('cobble', { color: 0xd8d0c0, rep: [2, 1] });
    for (const z of [-0.65, 0.65]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.35), stoneM); p.position.set(0, 0.8, z); portal.add(p); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 1.7), stoneM); top.position.y = 1.8; portal.add(top);
    const dark = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.95), cm(0x0c0c0c)); dark.position.set(s * 0.15, 0.8, 0); portal.add(dark);
    portal.position.set(s * 19.9, 0, 6.4); city.add(portal);
  }
  const stn = add(station(3.4), 2.4, 0, 7.25); mergeStatic(stn); named.station = stn;
  anchor('stationA', 2.4, 1.5, 7.0);
  const train = new THREE.Group(); scene.add(train);
  const loco = rocket(); train.add(loco);
  const cars = [coach({ color: 0x6a2a2a }), coach({ color: 0xc8a030 }), coach({ open: true })];
  cars.forEach((c, i) => { c.position.x = -2.15 - i * 1.15; train.add(c); });
  train.position.set(-8, 0.06, 6.4);
  const passengers = [addS(worker('lady'), 1.5, 0.16, 7.35), addS(worker('master'), 3.0, 0.16, 7.4)];

  // ---------- работнически къщи, град ----------
  const rows = [];
  const smokes = [];
  const rowAt = (n, x, z, ry, color, list = rows) => { const r = add(terraceRow(n, { color }), x, 0, z, ry); list.push(r); return r; };
  // Улици с къщи една срещу друга (на юг от железницата).
  for (const [sx, n] of [[-4.5, 6], [2.5, 6], [11.5, 6]]) {
    rowAt(n, sx - 1.5, 11.3, Math.PI / 2, 0xffffff);
    rowAt(n, sx + 1.5, 11.3, -Math.PI / 2, 0xe8dcd0);
  }
  // Зад фабриката и покрай главната улица.
  rowAt(9, 2.0, -7.1, 0, 0xffffff); rowAt(9, 2.0, -10.2, 0, 0xe8dcd0);
  rowAt(6, 10.2, -3.3, -Math.PI / 2, 0xffffff); rowAt(5, 10.2, -9.6, -Math.PI / 2, 0xe8dcd0);
  rowAt(6, -7.6, -8.2, 0, 0xe8dcd0);
  const ch = add(church(), 14.0, 0, -8.5, -Math.PI / 2); mergeStatic(ch);
  for (const r of rows) {
    for (const c of r.userData.chimneys.slice(0, 1)) smokes.push(plume(stage, r, c, { n: 3, size: 0.07, rise: 1.0, drift: 0.3, color: 0x77777a, opacity: 0.45, speed: 0.22 }));
  }
  const pmp = add(pump(), 2.5, 0, 9.6); named.pump = pmp; anchor('pumpA', 2.5, 0.8, 9.6);
  const pmp2 = add(pump(), -4.5, 0, 12.4);
  const lines = [washingLine([1.55, 1.15, 10.4], [3.45, 1.15, 10.4]), washingLine([1.55, 1.15, 12.6], [3.45, 1.15, 12.6], [0xd8c8a8, 0xf2f0ea, 0x8a6a8a]), washingLine([-5.45, 1.15, 10.0], [-3.55, 1.15, 10.0])];
  lines.forEach((l) => city.add(l));
  // Растеж на града (стъпка 4): нови улици и нова фабрика, скрити в началото.
  const growth = new THREE.Group(); scene.add(growth);
  const growthRows = [];
  for (const [sx, z] of [[-11, 11.3], [16.3, 11.3]]) {
    for (const s of [-1, 1]) { const r = terraceRow(6, { color: s > 0 ? 0xffffff : 0xe8dcd0 }); r.position.set(sx + s * 1.5, 0, z); r.rotation.y = -s * Math.PI / 2; growth.add(r); growthRows.push(r); }
  }
  { const r = terraceRow(7); r.position.set(-9.0, 0, -11.2); growth.add(r); growthRows.push(r); }
  const mill2 = mill({ w: 6, d: 2.8, floors: 3, fh: 1.1, bays: 8, cutaway: false }); mill2.position.set(17.5, 0, -2.6); mill2.rotation.y = -Math.PI / 2; growth.add(mill2);
  const chim2 = chimney(7.5); chim2.position.set(16.0, 0, 1.6); growth.add(chim2);
  const growthSmoke = [];
  for (const r of growthRows) { for (const c of r.userData.chimneys.slice(0, 1)) growthSmoke.push(plume(stage, r, c, { n: 3, size: 0.07, rise: 1.0, drift: 0.3, color: 0x77777a, opacity: 0.45, speed: 0.22 })); }
  mergeStatic(growth);
  growthSmoke.push(plume(stage, chim2, chim2.userData.top, { n: 7, size: 0.2, rise: 2.6, drift: 1.0, color: 0x4a4a4e, opacity: 0.55, speed: 0.12 }));
  growthSmoke.forEach((p) => p.set({ rate: 0 }));
  let growK = 0, growing = false;
  const setGrowth = (k) => { growK = k; growth.visible = k > 0.001; growth.scale.y = Math.max(0.001, k); };
  setGrowth(0);
  anchor('growthA', -11, 2.0, 11.3);
  anchor('lawA', 2.0, far > 1 ? 1.4 : 2.6, -1.4);
  // Новодошли от селата (стъпка 4).
  const newcomers = [0, 1, 2, 3].map((i) => { const p = addS(worker(i % 2 ? 'woman' : 'man'), -26, 0, 5.2 + (i % 2) * 0.3); const bundle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), cm(0x9a7a5a)); bundle.position.set(0, 0.45, -0.12); p.add(bundle); p.visible = false; return p; });
  // Събрание на работниците (стъпка 4).
  const meeting = new THREE.Group(); scene.add(meeting);
  {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.4), IM('planks')); crate.position.set(-2.6, 0.125, 0.9); meeting.add(crate);
    const speaker = worker('man'); speaker.position.set(-2.6, 0.25, 0.9); speaker.rotation.y = Math.PI / 2; meeting.add(speaker);
    for (const z of [0.5, 1.3]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6), IM('planks')); pole.position.set(-3.0, 0.7, z); meeting.add(pole); }
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.35), cm(0xa8322a, { side: THREE.DoubleSide })); banner.position.set(-3.0, 1.2, 0.9); banner.rotation.y = Math.PI / 2; meeting.add(banner);
    const kinds = ['woman', 'man', 'man', 'woman', 'man', 'woman', 'man', 'man'];
    kinds.forEach((k, i) => { const p = worker(k); const a = -0.9 + (i / (kinds.length - 1)) * 1.8; p.position.set(-2.6 + Math.cos(a) * 1.1, 0, 0.9 + Math.sin(a) * 1.1); p.rotation.y = -Math.PI / 2 + 0; p.lookAt(-2.6, 0, 0.9); meeting.add(p); });
  }
  meeting.visible = false;

  // ---------- хора по улиците, дървета ----------
  const folk = [];
  [[-1.5, 0.4, 'man'], [1.6, 0.8, 'woman'], [4.2, 0.6, 'boy'], [-4.4, 9.3, 'woman'], [-4.4, 13.0, 'girl'], [2.2, 11.2, 'man'], [11.5, 9.8, 'woman'], [11.3, 12.6, 'man'], [8.5, -2.5, 'master'], [8.4, 6.9, 'man'], [-0.5, -5.8, 'woman']].forEach(([x, z, k]) => {
    folk.push(addS(worker(k), x, 0, z));
  });
  wander(stage, folk, { r: 0.45, speed: 0.28 });
  const yardFolk = folk.slice(0, 3);
  const pumper = addS(worker('woman'), 2.5, 0, 9.25);
  for (const [x, z, s] of [[-20, -10, 1.3], [-21, -3, 1.1], [-20.5, 13, 1.2], [-13, 15, 1.0], [20, -10, 1.3], [21, 15, 1.1], [-19.5, 4.5, 0.9], [7, 16, 1.0]]) add(tree(s), x, 0, z);

  // ---------- дим ----------
  const millSmoke = plume(stage, chim, chim.userData.top, { n: 9, size: 0.22, rise: 3.2, drift: 1.4, color: 0x3e3e42, opacity: 0.6, speed: 0.11 });
  plume(stage, mchim, mchim.userData.top, { n: 7, size: 0.16, rise: 2.4, drift: 1.0, color: 0x4a4a4e, opacity: 0.55, speed: 0.12 });
  const locoSmoke = plume(stage, loco, loco.userData.chimneyTop, { n: 9, size: 0.12, rise: 1.4, drift: -0.6, color: 0xe8e8e8, opacity: 0.6, speed: 0.45 });
  const vent = plume(stage, blr, blr.userData.valveTop, { n: 10, size: 0.17, rise: 1.6, drift: 0.3, color: 0xffffff, opacity: 0.95, speed: 0.9 });
  vent.set({ rate: 0 });

  // ---------- етикети на машините (кратки) ----------
  const tagAt = (text, x, y, z) => { const l = labelSprite(text, { size: 0.16 }); l.position.set(x, y, z); scene.add(l); stage.steadyLabel(l, 7); return l; };
  const labels = [tagAt('Котел', -6.0, 1.75, -2.2), tagAt('Парна машина', -3.6, 3.05, -2.4), tagAt('Предачна машина', MULE_X, 1.05, -2.2), tagAt('Механичен стан', 3.85, 1.0, -2.2)];

  // ---------- кликаеми обекти (за look.mjs и проверки) ----------
  for (const [id, o] of [['engine', eng], ['boiler', blr], ['loom', looms[1]], ['mule', mule], ['mine', hf], ['wmill', wmill], ['station', stn], ['pump', pmp], ['school', sch], ['train', loco]]) {
    o.userData.pickId = id; addHitBox(o, 0.6);
  }
  mergeStatic(city, [wmill.userData.wheel, ...eng.userData.moving, blr.userData.glow, blr.userData.lever, blr.userData.needle, ...hf.userData.moving,
    ...looms.flatMap((l) => [l.userData.batten, l.userData.pulley, l.userData.roll]), mule.userData.carriage, mule.userData.yarn, mule.userData.wheel,
    shaft, pmp.userData.handle, pmp2.userData.handle, ...lines.flatMap((l) => l.userData.items)]);

  let kidsBusy = false;
  // ---------- парната машина: опростен модел ----------
  const E = { fire: 2, valve: 0.6, p: 0.7, s: 0.7, theta: 0, vent: 0, blows: 0, hold: 0, onBlow: null, onGoal: null };
  const setEngine = (fire, valve, p) => { E.fire = fire; E.valve = valve; E.p = p; E.s = Math.min(1, p * Math.sqrt(valve) * 1.3); E.vent = 0; vent.set({ rate: 0 }); };
  let mulePh = 0, trainS = 0, trainDwell = 0, bargeX = -6, bargeDir = 1;
  const STATION_X = 3.6;
  const ropeA = new THREE.Vector3(), ropeB = new THREE.Vector3();
  // Котел: огънят прави пара, машината я използва, малко изтича. На слаб компютър — на малки стъпки.
  function boilerStep(dt) {
    E.p += (0.115 * E.fire - 0.5 * E.valve * E.p - 0.03 * E.p) * dt;
    if (E.vent > 0) {
      E.vent -= dt; E.p -= 0.5 * dt;
      if (E.vent <= 0) vent.set({ rate: 0 });
    } else if (E.p >= 1) {
      E.vent = 1.8; E.blows++; vent.set({ rate: 1 });
      if (E.onBlow) E.onBlow();
    }
    E.p = Math.max(0, Math.min(1.02, E.p));
    const target = Math.min(1, E.p * Math.sqrt(E.valve) * 1.3);
    E.s += (target - E.s) * Math.min(1, dt * 1.5);
    if (E.onGoal) {
      if (E.s >= 0.45 && E.s <= 0.95 && E.vent <= 0) E.hold += dt; else E.hold = 0;
      if (E.hold > 2) { const f = E.onGoal; E.onGoal = null; f(); }
    }
  }
  stage.tick((dtRaw, t) => {
    let rest = Math.min(dtRaw, 0.3);
    while (rest > 1e-4) { const h = Math.min(rest, 0.05); boilerStep(h); rest -= h; }
    const dt = Math.min(dtRaw, 0.1);
    E.theta += E.s * 2.2 * dt;
    eng.userData.set(E.theta, E.s);
    shaft.rotation.x = -E.theta * 3;
    looms.forEach((l) => animateLoom(l, t, E.s));
    mulePh += dt * 0.12 * E.s; setMule(mule, mulePh);
    mule.userData.wheel.rotation.x -= E.s * dt * 6;
    beltTex.offset.y -= dt * E.s * 3;
    blr.userData.needle.rotation.z = Math.PI * 1.25 - Math.min(1, E.p) * Math.PI * 1.4 - Math.PI / 2;
    blr.userData.glow.material.color.setHSL(0.07, 1, 0.12 + E.fire * 0.12 + Math.sin(t * 9) * 0.03 * Math.min(1, E.fire));
    blr.userData.lever.rotation.x = E.vent > 0 ? -0.3 + Math.sin(t * 30) * 0.05 : 0;
    millSmoke.set({ rate: 0.2 + E.fire * 0.27 });
    // Работниците в цеха: тъкачките се навеждат, децата вървят покрай машината.
    weavers.forEach((w, i) => { w.rotation.x = Math.sin(t * 2 + i) * 0.06; });
    if (!kidsBusy) { girl.position.x = girl.userData.home0.x + Math.sin(t * 0.5) * 0.9; boy.position.x = boy.userData.home0.x + Math.sin(t * 0.4 + 1) * 0.3; }
    stoker.rotation.x = E.fire > 0 ? Math.max(0, Math.sin(t * 2.5)) * 0.25 : 0;
    // Мина, мелница, река, канал.
    hf.userData.set(t * 0.35);
    wmill.userData.wheel.rotation.x -= dt * 0.8;
    riv.tick(dt);
    canalTex.offset.x += dt * 0.01;
    wagon.position.z = 0.4 + Math.sin(t * 0.25) * 1.4;
    miners[2].position.z = wagon.position.z - 0.45;
    // Кон тегли баржата по пътеката край канала.
    bargeX += bargeDir * dt * 0.45;
    if (bargeX > 13) bargeDir = -1; if (bargeX < -13) bargeDir = 1;
    barg.position.x = bargeX; barg.rotation.y = bargeDir > 0 ? 0 : Math.PI;
    horse.position.set(bargeX + bargeDir * 2.6, 0, 4.35); horse.rotation.y = bargeDir > 0 ? 0 : Math.PI;
    horse.userData.legs.forEach((l, j) => { l.rotation.z = Math.sin(t * 5 + j * Math.PI / 2) * 0.35; });
    ropeA.set(horse.position.x - bargeDir * 0.2, 0.45, 4.3); ropeB.set(bargeX + bargeDir * 0.7, 0.52, 3.2);
    const d = ropeB.clone().sub(ropeA); rope.position.copy(ropeA).addScaledVector(d, 0.5); rope.scale.y = d.length(); rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    // Влакът: идва от тунела, спира на гарата, тръгва към другия тунел.
    let v = 1.8;
    const toStation = STATION_X - trainS;
    if (trainDwell > 0) { trainDwell -= dt; v = 0; }
    else if (toStation > 0 && toStation < 4) v = Math.max(0.25, toStation * 0.45);
    trainS += v * dt;
    if (toStation > 0 && STATION_X - trainS <= 0) { trainS = STATION_X; trainDwell = 6; }
    if (trainS > 31) trainS = -27;
    train.position.x = trainS;
    loco.userData.roll(trainS); cars.forEach((c) => c.userData.roll(trainS));
    locoSmoke.set({ rate: v > 0.1 ? 1 : 0.3 });
    // Помпа, пране.
    pmp.userData.handle.rotation.x = 0.4 + Math.sin(t * 2.2) * 0.35;
    pumper.position.y = Math.abs(Math.sin(t * 2.2)) * 0.02;
    lines.forEach((l) => l.userData.items.forEach((c, i) => { c.rotation.x = Math.sin(t * 1.6 + i) * 0.15; }));
    // Растеж на града.
    if (growing && growK < 1) { setGrowth(Math.min(1, growK + dt * 0.4)); if (growK >= 1) growthSmoke.forEach((p) => p.set({ rate: 1 })); }
    newcomers.forEach((p, i) => { if (!p.visible) return; if (p.position.x < -9 - i * 0.6) { p.position.x += dt * 0.9; p.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.03; } });
    if (kidsBusy) moveKids(dt);
  });

  // Децата отиват на училище (стъпка 4).
  const extraKids = [addS(worker('girl'), 0.6, 0, -1.75), addS(worker('boy'), 1.0, 0, -1.8)];
  extraKids.forEach((k) => { k.visible = false; k.userData.home0 = k.position.clone(); });
  const schoolKids = [girl, boy, ...extraKids];
  function moveKids(dt) {
    schoolKids.forEach((k, i) => {
      const tx = 6.25, tz = 0.1 + i * 0.27;
      const dx = tx - k.position.x, dz = tz - k.position.z, l = Math.hypot(dx, dz);
      if (l > 0.05) { const s = Math.min(l, dt * 1.0); k.position.x += (dx / l) * s; k.position.z += (dz / l) * s; k.rotation.y = Math.atan2(dx, dz); k.position.y = Math.abs(Math.sin(performance.now() / 160 + i)) * 0.03; }
    });
  }
  function resetKids() {
    kidsBusy = false;
    schoolKids.forEach((k) => { k.position.copy(k.userData.home0); k.rotation.y = Math.PI; });
    extraKids.forEach((k) => { k.visible = false; });
  }

  // ---------- общи помощници ----------
  let tip = null;
  const say = (a, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(a, html, { lift: 0.4, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  let tags = [];
  const clearTags = () => { tags.forEach((x) => x.remove()); tags = []; };
  const scores = [];
  let stopDrag = null;
  const choice = (opts) => `<div class="col">${opts.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`;
  function ask(html, opts, onRight, onWrong) {
    shell.task(html);
    const c = shell.setControls(choice(opts));
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = opts[+b.dataset.i];
      if (!p.ok) { b.disabled = true; shell.msg(p.why, 'bad'); onWrong(); return; }
      onRight();
    }));
  }
  const next = (label, fn) => { const n = shell.setControls(`<button class="btn primary">${label}</button>`); n.querySelector('button').addEventListener('click', fn); };

  // ---------- 1. Разходка ----------
  const stops = STOPS.map((s) => {
    if (far === 1) return s;
    const ey = s.eyeY ?? 1.0;
    return { ...s, at: [s.look[0] + (s.at[0] - s.look[0]) * far, s.look[2] + (s.at[1] - s.look[2]) * far], eyeY: s.look[1] + (ey - s.look[1]) * far };
  });
  const seen = new Set();
  let phase = 1;
  const walk = createWalk(stage, {
    stops, eye: 1.2, menuTitle: 'Спирки',
    onArrive(s) {
      if (phase !== 1) return;
      say(named[s.anchor], `<b>${esc(s.label)}</b><br>${s.note}`, { cls: 'wide', lift: 0.3 });
      seen.add(s.id); walk.mark(s.id);
      shell.score(`Спирки: ${seen.size} от ${STOPS.length}`);
      if (seen.size === STOPS.length) next('Напред →', () => { clearTip(); step2(); });
    },
  });
  function step1() {
    phase = 1;
    shell.step(0);
    scores.length = 0;
    seen.clear();
    walk.showNav(true);
    labels.forEach((l) => { l.visible = true; });
    shell.task('Разходи се из английски фабричен град около 1830 г. Върви със стрелките долу или избирай спирка от менюто. На всяка спирка прочети какво е истинско и какво е възстановка.');
    shell.setControls('');
    walk.go('mill');
  }

  // ---------- 2. Парната машина ----------
  function step2() {
    phase = 2;
    shell.step(1);
    shell.score('');
    walk.showNav(false);
    setEngine(0, 0, 0);
    view([-1.6, 2.9, 4.6], [-3.4, 1.2, -2.8]);
    let mistakes = 0;
    say(blr.userData.gauge, 'Огнището е празно. Машината стои.', { cls: 'tag', lift: 0.25 });
    ask('Парната машина е спряла. Огнярят ще сложи въглища в огнището. <b>Какво ще стане с машината и становете?</b>', PREDICT_ENGINE, run, () => { mistakes++; });

    function run() {
      clearTip();
      shell.msg('Провери го!', 'good');
      shell.task('Сложи въглища с плъзгача и отвори клапана към машината. <b>Накарай становете да работят добре</b> (стрелката — в зеленото).');
      const c = shell.setControls(`<label class="small">Въглища в огнището: <b class="fv">няма</b></label>
        <input class="fire" type="range" min="0" max="3" step="1" value="0" style="width:100%">
        <label class="small">Клапан към машината: <b class="vv">затворен</b></label>
        <input class="valve" type="range" min="0" max="100" step="5" value="0" style="width:100%">`);
      const fire = c.querySelector('.fire'), valve = c.querySelector('.valve');
      const upd = () => {
        E.fire = +fire.value; E.valve = +valve.value / 100;
        c.querySelector('.fv').textContent = FIRE_NAMES[E.fire];
        c.querySelector('.vv').textContent = E.valve === 0 ? 'затворен' : E.valve >= 1 ? 'отворен докрай' : `отворен ${valve.value}%`;
      };
      fire.addEventListener('input', upd); valve.addEventListener('input', upd);
      const gTag = stage.bubble(blr.userData.gauge, '', { cls: 'tag', lift: 0.25 });
      const lTag = stage.bubble(mule.userData.carriage, '', { cls: 'tag', lift: 0.7 });
      tags.push(gTag, lTag);
      const off = stage.tick(() => {
        const p = E.p;
        gTag.set(`Налягане: ${E.vent > 0 ? 'изпуска пара!' : p < 0.15 ? 'няма' : p < 0.49 ? 'ниско' : p < 0.85 ? 'добро' : 'опасно високо'}`);
        lTag.set(`Машините: ${E.s < 0.05 ? 'спрени' : E.s < 0.45 ? 'бавно' : E.s <= 0.95 ? 'работят добре' : 'много бързо'}`);
      });
      tags.push({ remove: off });
      E.onGoal = () => {
        shell.msg('Становете работят! Огънят прави пара, парата бута буталото, гредата върти маховика, а валът — машините.', 'good');
        shell.task('Сега <b>затвори клапана към машината</b> (плъзни го до 0), а огъня остави силен. Гледай стрелката на котела.');
        let warned = false;
        const hint = stage.tick(() => { if (!warned && E.fire === 0 && E.valve === 0) { warned = true; shell.msg('Без огън няма пара. Сложи въглища.', ''); } });
        tags.push({ remove: hint });
        E.onBlow = () => {
          E.onBlow = null;
          setTimeout(() => {
            if (phase !== 2) return;
            ask('Пара изсвистя над котела! <b>Какво направи предпазният клапан?</b>', SAFETY_Q, waterQ, () => { mistakes++; });
          }, 900);
        };
      };
    }
    function waterQ() {
      clearTags();
      setEngine(2, 0.6, 0.7);
      labels.forEach((l) => { l.visible = false; });
      shell.msg('Вярно! Предпазният клапан изпуска излишната пара, за да не се пръсне котелът. Стрелката на котела е добавена за теб.', 'good');
      view([-20.6, 2.6, 2.6], [-15.4, 0.7, -0.8]);
      say(named.canalA, 'По-старата фабрика: водното колело върти машините. Затова тя е до реката.', { cls: 'wide', lift: 0.6 });
      ask('Сравни водната мелница с парната машина. <b>Защо с парната машина фабриките вече не трябва да са до бърза река?</b>', WATER_Q, () => {
        scores.push(stepScore(mistakes, 3));
        say(named.canalA, '<b>Така е.</b> Водното колело спира, когато реката намалее през лятото или замръзне през зимата. С парата фабриките се местят в градовете — близо до въглищата, каналите и работниците.', { cls: 'good wide', lift: 0.6 });
        shell.msg('Вярно!', 'good');
        next('Напред →', () => { clearTip(); step3(); });
      }, () => { mistakes++; });
    }
  }

  // ---------- 3. Изобретенията във времето ----------
  // На тесен екран линията е по-къса, а картите са на два реда — така надписите се четат.
  const narrow = far > 1;
  const tl = createTimeline(stage, { from: 1750, to: 1850, x: 0, y: 0.25, z: narrow ? 0.2 : 0.5, length: narrow ? 6.2 : 9, tick: 25, tickLabel: (y) => `${y}` });
  for (const s of SLOTS) tl.addSlot(s.id, s);
  const CARD_AT = narrow ? [[-0.95, 1.45], [0.95, 1.45], [-0.95, 2.25], [0.95, 2.25]] : [[-3.3, 1.95], [-1.1, 1.95], [1.1, 1.95], [3.3, 1.95]];
  INVENTIONS.forEach((c, i) => tl.addCard(c.id, { label: c.label, x: CARD_AT[i][0], z: CARD_AT[i][1] }));
  const slotLbl = new Map();
  for (const [id, g] of tl.slots) { const l = g.children[1]; slotLbl.set(id, { l, material: l.material, scale: l.scale.clone() }); }
  function setSlotLabel(id, text) { const o = slotLbl.get(id); const f = labelSprite(text, { size: 0.22 }); o.l.material = f.material; o.l.scale.copy(f.scale); }
  const resetSlotLabels = () => { for (const o of slotLbl.values()) { if (o.l.material !== o.material) o.l.material.map?.dispose(); o.l.material = o.material; o.l.scale.copy(o.scale); } };
  const showTimeline = (on) => { tl.group.visible = on; for (const c of tl.cards.values()) c.visible = on; };
  showTimeline(false);
  function step3() {
    phase = 3;
    shell.step(2);
    clearTags();
    setEngine(2, 0.6, 0.7);
    labels.forEach((l) => { l.visible = false; });
    yardFolk.forEach((p) => { p.visible = false; });
    tl.reset(); resetSlotLabels();
    showTimeline(true);
    if (narrow) stage.flyTo([0, 7.4, 8.4], [0, 0.3, 1.0], 1); else view([0, 5.4, 8.6], [0, 0.4, 0.9]);
    let mistakes = 0, placed = 0;
    const tries = {};
    shell.task('Завлечи всяко изобретение до годината му на линията на времето. <span class="small">(Годините са в бележките от разходката.)</span>');
    shell.setControls('');
    shell.score(`Изобретения: 0 от ${INVENTIONS.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.25,
      onDrop(obj) {
        const inv = INVENTIONS.find((x) => x.id === obj.userData.dragId);
        const local = tl.group.worldToLocal(obj.position.clone());
        if (Math.abs(local.z) > 1.1) { tl.sendHome(inv.id); return; }
        // Близки години: ако вярното място е наблизо и свободно, приемаме го.
        const near = [...tl.slots.entries()].filter(([, s]) => !s.userData.filled && Math.abs(s.position.x - local.x) < 0.9).sort((a, b) => Math.abs(a[1].position.x - local.x) - Math.abs(b[1].position.x - local.x));
        if (!near.length) { tl.sendHome(inv.id); return; }
        const hit = near.find(([id]) => id === inv.slot);
        if (hit) {
          tl.placeCard(inv.id, inv.slot); tl.markSlot(inv.slot, 0x2fb36b);
          // Картата „влиза“ в надписа на годината, за да не се застъпват близките години.
          obj.visible = false;
          if (!narrow) setSlotLabel(inv.slot, `${SLOTS.find((x) => x.id === inv.slot).label} · ${inv.short}`);
          placed++;
          shell.score(`Изобретения: ${placed} от ${INVENTIONS.length}`);
          shell.msg('Вярно!', 'good');
          if (placed === INVENTIONS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            say(tl.slots.get('loom'), 'Всичко това става за около 70 години. Машините, парата и железницата променят как хората работят, живеят и пътуват.', { cls: 'good wide', lift: 2.0 });
            next('Напред →', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tries[inv.id] = (tries[inv.id] || 0) + 1;
          tl.sendHome(inv.id);
          shell.msg(tries[inv.id] >= 2 ? inv.hint : 'Не е тази година. Спомни си бележките от разходката.', 'bad');
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    phase = 4;
    shell.step(3);
    shell.score('');
    showTimeline(false);
    yardFolk.forEach((p) => { p.visible = true; });
    let mistakes = 0, k = 0;
    const reveal = {
      city() {
        view([0, 15, 25], [0, 0, 3], 1.4);
        growing = true;
        newcomers.forEach((p, i) => { p.visible = true; p.position.set(-15.2 - i * 0.9, 0, 5.15 + (i % 2) * 0.3); p.rotation.y = Math.PI / 2; });
        return named.growthA;
      },
      law() {
        view([2.6, 3.4, 5.6], [4.4, 0.6, -0.4]);
        kidsBusy = true;
        extraKids.forEach((x) => { x.visible = true; });
        schLbl.visible = true;
        return named.lawA;
      },
      union() {
        view([1.4, 2.8, 5.2], [-2.4, 0.5, 0.5]);
        meeting.visible = true;
        return meeting.children[1];
      },
    };
    const where = { city: [0, 15, 25, 0, 0, 3], law: [2.6, 3.4, 5.6, 4.4, 0.6, -0.4], union: [1.4, 3.0, 5.6, -1.8, 0.6, 0.4] };
    function ask4() {
      const P = PREDICT[k];
      const w = where[P.id];
      if (P.id !== 'city') view(w.slice(0, 3), w.slice(3));
      else view([0, 13, 22], [0, 0, 2]);
      clearTip();
      ask(`<span class="small">Въпрос ${k + 1} от ${PREDICT.length}</span><br>${P.q}`, P.opts, () => {
        const a = reveal[P.id]();
        shell.msg('Вярно предсказание! Виж какво наистина се случва.', 'good');
        setTimeout(() => {
          if (phase !== 4) return;
          say(a, `<b>Така става.</b> ${P.real}`, { cls: 'good wide', lift: P.id === 'city' ? 1.6 : P.id === 'law' ? 0.3 : 0.9 });
        }, 900);
        k++;
        if (k < PREDICT.length) next('Следващ въпрос →', ask4);
        else next('Виж резултата', () => {
          clearTip();
          scores.push(stepScore(mistakes, 3));
          shell.finish(scores.reduce((a2, s) => a2 + s, 0) / scores.length, onComplete, restart);
        });
      }, () => { mistakes++; });
    }
    ask4();
  }

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip(); clearTags();
    E.onGoal = null; E.onBlow = null;
    setEngine(2, 0.6, 0.7);
    tl.reset(); resetSlotLabels(); showTimeline(false);
    growing = false; setGrowth(0); growthSmoke.forEach((p) => p.set({ rate: 0 }));
    newcomers.forEach((p) => { p.visible = false; });
    meeting.visible = false; schLbl.visible = false;
    resetKids();
    yardFolk.forEach((p) => { p.visible = true; });
    walk.menu.setItems(STOPS.map((x) => ({ id: x.id, label: x.label, icon: x.icon })));
    step1();
  }

  step1();
  container.__demo = { stage, walk, engine: E, timeline: tl, get phase() { return phase; } };
  return { dispose() { if (stopDrag) stopDrag(); walk.dispose(); stage.dispose(); } };
}
