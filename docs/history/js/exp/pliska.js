// 10.1.4 „Създаване и укрепване на държавата“ — разходка в Плиска, първата столица на Дунавска България.
// Стъпки: разходка по спирките → опит: ров и вал срещу конница → устройство на държавата и
// славяни/древни българи → предскажи: какво правят Крум след 811 г. и Омуртаг след него.
import { createStage, labelSprite, mat, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { wander } from './hist/antiquity.js';
import { animal, graze } from './hist/thrace.js';
import { createWalk } from './hist/walk.js';
import { M } from './hist/architecture.js';
import {
  earthwork, earthProfile, surfaceAt, blockWall, roundTower, squareTower, fortGate, stonePalace, bathhouse,
  paganTemple, dugout, yurt, fence, folk, rider, inscribedColumn, pipeTrench, smoke, cloud,
} from './hist/bulgar.js';

const DUG = '<span class="small">✓ Разкопано</span>';
const REC = '<span class="small">⚒ Възстановка</span>';
// Спирки. Всяко балонче казва кое е разкопано и кое е възстановка (принцип 10).
const STOPS = [
  { id: 'val', label: 'Валът и ровът', icon: '⛰️', at: [0, 21.5], look: [-2.5, 0.2, 14.6], eyeY: 1.7, anchor: 'valT',
    note: `Плиска е първата столица на Дунавска България. Отвън е заобиколена от дълъг землен вал и ров пред него. Те заграждат огромно място — около 23 кв. км. ${DUG}: валът и ровът личат и днес. ${REC}: колко високи и дълбоки са били.` },
  { id: 'homes', label: 'Жилищата', icon: '🛖', at: [-0.6, 11.6], look: [-6.4, 0.3, 10.2], anchor: 'dugout',
    note: `Във Външния град живеят много хора. Разкопани са вкопани в земята жилища — полуземлянки — с огнище или пещ. Открити са и кръгли жилища, подобни на юрти. ${REC}: стените и покривите над земята.` },
  { id: 'herds', label: 'Юрти, конници, стада', icon: '🐎', at: [0.8, 11.2], look: [7.0, 0.3, 9.6], anchor: 'yurt',
    note: `Древните българи идват като конници и скотовъдци и дълго пазят част от този бит. Славяните са главно земеделци. Сред находките са кости на коне, говеда и овце. ${REC}: юртите и стадата.` },
  { id: 'wall', label: 'Каменната стена и портата', icon: '🏰', at: [0, 12.4], look: [0, 1.0, 7], eyeY: 1.3, anchor: 'gate',
    note: `Вътрешният град е ограден с дебела крепостна стена от големи, грижливо издялани варовикови блокове. Има четири порти и кули. ${DUG}: основите. Днес част от стената и Източната порта са възстановени. ${REC}: височината на стената и зъбците.` },
  { id: 'temple', label: 'Езическото светилище', icon: '🔥', at: [-0.5, 4.8], look: [-3.8, 0.6, 2.4], anchor: 'temple',
    note: `Преди покръстването българите почитат бог Тангра, а славяните — Перун и други богове. Разкопани са основите на светилища с план „квадрат в квадрат“: една зала вътре в друга. ${REC}: стените и покривът.` },
  { id: 'small', label: 'Малкият дворец и банята', icon: '🛁', at: [-0.3, 2.9], look: [3.9, 0.8, 1.7], eyeY: 1.4, anchor: 'small',
    note: `Малкият дворец е жилище. До него има баня. Открити са глинени тръби на водопровод. ${DUG}: основите и тръбите. ${REC}: горните части.` },
  { id: 'palace', label: 'Големият дворец', icon: '👑', at: [0, 2.2], look: [0, 1.1, -3.6], eyeY: 1.5, anchor: 'palace',
    note: `Големият дворец е най-голямата сграда във Вътрешния град. Стените са от огромни варовикови блокове. Учените смятат, че горе е тронната зала на хана. ${DUG}: основите. ${REC}: горният етаж и покривът. Кога точно е строен и при кой хан, учените още спорят.` },
  { id: 'people', label: 'Ханът и хората', icon: '👥', at: [1.6, 1.4], look: [-0.6, 0.45, -1.3], eyeY: 1.15, anchor: 'khan',
    note: 'Начело на държавата е ханът (или канът). Около него са знатните — боилите и багаините. Дрехите не са запазени — облеклото е възстановка. Недалеч от Плиска е Мадарският конник — скален релеф от началото на VIII век.' },
];
const RANKS = [
  { id: 'khan', card: 'Хан (кан)', desc: 'Върховен владетел, военачалник и жрец', hint: 'Най-горе е най-голямата власт.' },
  { id: 'kavhan', card: 'Кавхан', desc: 'Първи помощник и заместник на владетеля', hint: 'Кавханът е веднага след хана.' },
  { id: 'ichirgu', card: 'Ичиргу-боил', desc: 'Води войската в столицата', hint: 'В името му е „боил“, но той е над останалите боили.' },
  { id: 'boils', card: 'Боили и багаини', desc: 'Знатни: управляват земи, водят войски', hint: 'Знатните са много, но са под тримата най-високи.' },
  { id: 'people', card: 'Българи и славяни', desc: 'Свободни хора: орат, гледат стада, воюват', hint: 'Най-много хора има в основата.' },
];
const TRAITS = [
  { id: 't-perun', label: 'Почитат бог Перун', side: 's' },
  { id: 't-tangra', label: 'Почитат бог Тангра', side: 'b' },
  { id: 't-elders', label: 'Общини със старейшини', side: 's' },
  { id: 't-khan', label: 'Ханът има голяма власт', side: 'b' },
  { id: 't-farm', label: 'Главно земеделци', side: 's' },
  { id: 't-horse', label: 'Конници и скотовъдци', side: 'b' },
];
const Q2 = [
  { q: 'Откъде идва пръстта за вала?', a: [
    { t: 'От рова — изкопаната пръст се насипва отвътре.', ok: true },
    { t: 'Носят я с коли от далечни места.', why: 'Погледни пак опита: когато ровът става по-дълбок, какво става с вала?' },
    { t: 'Валът е естествен хълм.', why: 'Не. Валът е насипан от хора. Погледни как расте, докато копаеш рова.' },
  ] },
  { q: 'Защо Вътрешният град има и каменна стена, а не само вал?', a: [
    { t: 'Валът пази голямото поле с жилища и стада, а здравата стена — дворците на хана.', ok: true },
    { t: 'Стената пази от наводнения.', why: 'Не. Стената пази от врагове. Помисли какво има зад нея.' },
    { t: 'Стената е само за красота.', why: 'Не. Дебелата стена с кули и порти е за отбрана.' },
  ] },
];
const P4 = [
  { lead: '<b>811 г.</b> Византийският император Никифор I превзема Плиска и опожарява двореца на хан Крум. На връщане войската му е разбита във Върбишкия проход, а императорът загива.',
    q: 'Какво прави Крум след тази победа?', a: [
      { t: 'Настъпва на юг: превзема византийски крепости и стига до Константинопол.', ok: true },
      { t: 'Отказва се от властта и дава земите си на Византия.', why: 'Не. След победата Крум е по-силен от всякога.' },
      { t: 'Премества столицата в Преслав.', why: 'Не. Столицата се мести в Преслав много по-късно — през 893 г.' },
    ],
    done: '<b>Така става.</b> През 812 г. Крум превзема Девелт и Месемврия (днес Несебър), а през 813 г. побеждава при Версиникия и стига до стените на Константинопол. Крум дава и закони, които важат за всички в държавата.' },
  { lead: '<b>814 г.</b> Хан Крум умира. Скоро владетел става синът му Омуртаг.',
    q: 'Какво избира Омуртаг?', a: [
      { t: 'Сключва мир с Византия за 30 години и строи.', ok: true },
      { t: 'Продължава войната, докато превземе Константинопол.', why: 'Не. Омуртаг избира мира — след дългите войни държавата има нужда от покой.' },
      { t: 'Приема християнството.', why: 'Не. България приема християнството по-късно — при княз Борис I, през 864 г.' },
    ],
    done: '<b>Така е.</b> Омуртаг сключва 30-годишен мир с Византия. Части от договора са записани на гръцки върху каменна колона (колоната тук е възстановка). В негово време се строят дворци и укрепления. <i>Крум укрепва държавата с войни и закони, Омуртаг — с мир и строеж.</i>' },
];
const LEVEL_NAMES = ['почти няма', 'плитък', 'среден', 'дълбок', 'много дълбок'];
const STOP_LEVEL = 3;

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Разходка из Плиска', 'Ров и вал срещу конница', 'Кой управлява?', 'Предскажи'] });
  const stage = createStage(shell.stageEl, { background: 0xcfe3f2, camPos: [0, 2, 24], target: [0, 0.3, 14], minDistance: 0.3, maxDistance: 45, maxPolarAngle: Math.PI * 0.49, fog: { color: 0xcfe3f2, near: 30, far: 70 } });
  const { scene } = stage;
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const narrow = far > 1;
  const K = narrow ? 1.35 : 1; // на тесен екран надписите в стъпка 3 са по-едри
  const view = (pos, tgt, dur = 1) => { stage.stopFollow(); stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * far), tgt, dur); };
  const named = {};
  const anchor = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };

  // ---------- Земя ----------
  const grass = mat(0x9cb36b);
  const groundBox = (x0, x1, z0, z1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.1, z1 - z0), grass); m.position.set((x0 + x1) / 2, -0.05, (z0 + z1) / 2); scene.add(m); };
  groundBox(-13, 13, -40, 13);   // вътре във вала
  groundBox(-60, 60, 17, 60);    // пред рова
  groundBox(-60, -17, -40, 17);  // отляво
  groundBox(17, 60, -40, 17);    // отдясно
  const inner = new THREE.Mesh(new THREE.BoxGeometry(12, 0.02, 14), M(0xe8d8b0, { tex: 'sand', rep: [8, 9] }));
  inner.position.set(0, 0.005, 0); scene.add(inner);
  const road = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 10), M(0xd9c79c, { tex: 'sand', rep: [1, 6] }));
  road.position.set(0, 0.008, 12); scene.add(road);

  // ---------- Външният вал и ров ----------
  const sides = [];
  for (const s of [-1, 1]) { const e = earthwork(57, 3); e.rotation.y = s * Math.PI / 2; e.position.set(s * 13, 0, -15.5); scene.add(e); sides.push(e); }
  let front = [];
  let level = 3;
  function buildFront(L) {
    for (const m of front) { scene.remove(m); m.geometry.dispose(); }
    front = [];
    for (const [x, len, opts] of [[-15, 28, undefined], [15, 28, undefined], [0, 2.02, { rampart: false }]]) {
      const e = earthwork(len, L, opts); e.position.set(x, 0, 13); scene.add(e); front.push(e);
    }
    level = L;
  }
  buildFront(3);
  // Мост над рова в прохода (възстановка) и колове от двете страни.
  const bridge = new THREE.Group();
  for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.2), mat(i % 2 ? 0x7a5a3a : 0x6b4f36)); p.position.set(0, 0.04, 14.95 + i * 0.22); bridge.add(p); }
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 1.8), mat(0x5a3d22)); r.position.set(s * 0.72, 0.2, 15.7); bridge.add(r); }
  scene.add(bridge);
  anchor('valT', -3, 1.0, 14.4);

  // ---------- Каменната стена на Вътрешния град ----------
  const X = 6, Z = 7;
  const wallSeg = (x1, z1, x2, z2) => { const len = Math.hypot(x2 - x1, z2 - z1); const w = blockWall(len); w.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2); w.rotation.y = -Math.atan2(z2 - z1, x2 - x1); scene.add(w); };
  const G = 0.82; // половината от прохода на портата
  wallSeg(-X, Z, -G, Z); wallSeg(G, Z, X, Z);
  wallSeg(-X, -Z, -G, -Z); wallSeg(G, -Z, X, -Z);
  wallSeg(-X, -Z, -X, -G); wallSeg(-X, G, -X, Z);
  wallSeg(X, -Z, X, -G); wallSeg(X, G, X, Z);
  for (const [x, z] of [[-X, Z], [X, Z], [-X, -Z], [X, -Z]]) { const t = roundTower(); t.position.set(x, 0, z); scene.add(t); }
  for (const [x, z, r] of [[-3.4, Z, 0], [3.4, Z, 0], [-3.4, -Z, 0], [3.4, -Z, 0], [-X, 3.9, Math.PI / 2], [-X, -3.9, Math.PI / 2], [X, 3.9, Math.PI / 2], [X, -3.9, Math.PI / 2]]) { const t = squareTower(); t.position.set(x, 0, z); t.rotation.y = r; scene.add(t); }
  const gate = fortGate({ span: G * 2 - 0.1 }); gate.position.set(0, 0, Z); scene.add(gate); named.gate = gate;
  for (const [x, z, r] of [[0, -Z, Math.PI], [-X, 0, -Math.PI / 2], [X, 0, Math.PI / 2]]) { const g2 = fortGate({ span: G * 2 - 0.1 }); g2.position.set(x, 0, z); g2.rotation.y = r; scene.add(g2); }

  // ---------- Сгради вътре ----------
  const palace = stonePalace({ w: 4.8, d: 2.3 }); palace.position.set(0, 0, -3.6); scene.add(palace); named.palace = palace;
  const small = stonePalace({ w: 2.2, d: 1.5, h1: 0.7, h2: 0.6 }); small.position.set(3.9, 0, 1.6); small.rotation.y = -Math.PI / 2; scene.add(small); named.small = small;
  const bath = bathhouse(); bath.position.set(3.9, 0, 4.0); bath.rotation.y = -Math.PI / 2; scene.add(bath);
  const pipes = pipeTrench(1.6); pipes.position.set(2.4, 0, 4.6); pipes.rotation.y = 0.2; scene.add(pipes);
  const temple = paganTemple(); temple.position.set(-3.8, 0, 2.4); temple.rotation.y = Math.PI / 2; scene.add(temple); named.temple = temple;
  const column = inscribedColumn(); column.position.set(-2.0, 0, -1.3); column.visible = false; scene.add(column); named.column = column;

  // ---------- Външният град: жилища, стада, хора ----------
  const homes = [];
  const chimneys = [];
  for (const [x, z, r] of [[-6.4, 10.2, 0.3], [-8.2, 11.4, -0.2], [-9.0, 9.4, 0.5], [-7.0, 8.4, 0.1], [-4.6, 11.8, 0.2], [-10.6, 11.0, 0]]) {
    const d = dugout(); d.position.set(x, 0, z); d.rotation.y = r; scene.add(d); homes.push(d);
    d.updateMatrixWorld(true); chimneys.push(d.localToWorld(d.userData.chimney.clone()));
  }
  named.dugout = homes[0];
  for (const [x, z] of [[7.0, 9.6], [8.8, 11.2], [5.2, 11.6], [9.8, 8.8], [7.4, 12.2]]) {
    const y = yurt(); y.position.set(x, 0, z); y.rotation.y = Math.random() * 6; scene.add(y); homes.push(y);
    y.updateMatrixWorld(true); chimneys.push(y.localToWorld(y.userData.chimney.clone()));
  }
  named.yurt = homes[6];
  const smk = smoke(stage, chimneys);
  // Кошара и стада.
  const pen = new THREE.Group(); pen.position.set(10.2, 0, 4.0); scene.add(pen);
  for (const [x, z, len, r] of [[0, -1.4, 3, 0], [0, 1.4, 3, 0], [-1.5, 0, 2.8, Math.PI / 2], [1.5, 0, 2.8, Math.PI / 2]]) { const f = fence(len); f.position.set(x, 0, z); f.rotation.y = r; pen.add(f); }
  const herd = [];
  ['sheep', 'sheep', 'sheep', 'sheep', 'goat'].forEach((k, i) => { const a = animal(k); a.position.set(10.2 + Math.cos(i * 1.3) * 0.7, 0, 4.0 + Math.sin(i * 1.3) * 0.5); scene.add(a); herd.push(a); });
  const horses = [];
  ['horse', 'horse', 'horse', 'cow', 'cow'].forEach((k, i) => { const a = animal(k); a.position.set(8.0 + (i % 3) * 1.1, 0, 6.6 + Math.floor(i / 3) * 1.1); scene.add(a); horses.push(a); });
  ['sheep', 'sheep', 'cow'].forEach((k, i) => { const a = animal(k); a.position.set(-9.5 + i * 0.9, 0, 4.5 + (i % 2) * 0.8); scene.add(a); horses.push(a); });
  graze(stage, herd, { r: 0.4, speed: 0.2 });
  graze(stage, horses, { r: 0.7, speed: 0.15 });
  // Хора.
  const outerFolk = [];
  [[-5.2, 9.4, 'slav'], [-7.6, 10.0, 'slavWoman'], [-9.6, 10.2, 'slav'], [6.0, 10.6, 'bulgar'], [8.2, 9.6, 'bulgar'], [0.6, 12.4, 'slavWoman'], [1.8, 9.2, 'slav'], [3.4, 12.0, 'bulgar']].forEach(([x, z, k]) => {
    const p = folk(k); p.position.set(x, 0, z); scene.add(p); outerFolk.push(p);
  });
  wander(stage, outerFolk, { r: 0.5, speed: 0.25 });
  const innerFolk = [];
  [[-2.6, 5.2, 'boil'], [2.2, 5.6, 'bulgar'], [-1.4, 4.0, 'slav'], [1.8, 3.2, 'boil']].forEach(([x, z, k]) => { const p = folk(k); p.position.set(x, 0, z); scene.add(p); innerFolk.push(p); });
  wander(stage, innerFolk, { r: 0.4, speed: 0.22 });
  const court = [];
  [[-0.6, -1.3, 'khan'], [-1.25, -1.0, 'boil'], [0.15, -0.95, 'boil'], [-0.6, -0.4, 'bulgar']].forEach(([x, z, k]) => { const p = folk(k); p.position.set(x, 0, z); p.rotation.y = k === 'khan' ? 0 : Math.atan2(-0.6 - x, -1.3 - z); scene.add(p); court.push(p); });
  named.khan = court[0];
  // Знаме с конска опашка пред двореца (възстановка).
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 2.0, 8), mat(0x5a3d22)); pole.position.set(1.4, 1.0, -1.8); scene.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.35, 8, 1), mat(0xb0322b, { side: THREE.DoubleSide })); flag.position.set(1.72, 1.78, -1.8); scene.add(flag);
  const flagPos = flag.geometry.attributes.position; const flag0 = Float32Array.from(flagPos.array);

  // Конници за опита и за предсказанието.
  const riders = ['bulgar', 'boil', 'bulgar'].map((k) => { const r = rider(k); r.visible = false; scene.add(r); return r; });

  // Облаци.
  const clouds = [cloud(), cloud(), cloud()];
  clouds.forEach((c, i) => { c.position.set(-18 + i * 14, 9 + i, -10 + i * 8); scene.add(c); });

  // ---------- Живот ----------
  let ride = null;
  stage.tick((dt, t) => {
    clouds.forEach((c, i) => { c.position.x += dt * (0.25 + i * 0.08); if (c.position.x > 30) c.position.x = -30; });
    court.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 1.4 + i)) * 0.012; });
    for (let i = 0; i < flagPos.count; i++) { const x = flag0[i * 3] + 0.3; flagPos.setZ(i, Math.sin(t * 3 + x * 6) * 0.06 * x); }
    flagPos.needsUpdate = true;
    if (ride) ride(dt, t);
    for (const r of riders) if (r.visible && r.userData.moving) r.userData.legs.forEach((l, j) => { l.rotation.z = Math.sin(t * 12 + j * Math.PI / 2) * 0.5; });
  });

  let tip = null;
  const say = (a, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(a, html, { lift: 1.1, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let stopDrag = null;
  const extra = [];

  // ---------- 1. Разходка ----------
  const seen = new Set();
  let phase = 0;
  let walk = null;
  const makeWalk = () => createWalk(stage, {
    stops: STOPS,
    eye: 0.95,
    menuTitle: 'Спирки',
    onArrive(s) {
      if (phase !== 1) return;
      say(named[s.anchor], `<b>${esc(s.label)}</b><br>${s.note}`, { cls: 'wide', lift: s.id === 'palace' ? 2.4 : s.id === 'wall' ? 2.2 : 1.2 });
      seen.add(s.id); walk.mark(s.id);
      shell.score(`Спирки: ${seen.size} от ${STOPS.length}`);
      if (seen.size === STOPS.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { clearTip(); step2(); });
      }
    },
  });
  walk = makeWalk();
  function step1() {
    phase = 1;
    shell.step(0);
    scores.length = 0;
    seen.clear();
    walk.showNav(true);
    shell.task('Разходи се из Плиска — от вала до двореца на хана. Върви със стрелките долу или избирай спирка от менюто.');
    shell.setControls('');
    shell.score(`Спирки: 0 от ${STOPS.length}`);
    walk.go('val');
  }

  // ---------- 2. Опит: ров и вал срещу конница ----------
  const RX = [-1.7, -2.4, -3.1];
  function placeRiders(xs, z, dir) {
    riders.forEach((r, i) => { r.visible = true; r.position.set(xs[i], 0, z + i * 0.9 * -dir); r.rotation.set(0, dir < 0 ? Math.PI / 2 : -Math.PI / 2, 0); r.userData.moving = false; });
  }
  // Ездачите вървят по оста z; височината следва профила на вала и рова.
  function heightAt(x, z) {
    const u = z - 13;
    if (u < 0 || u > 4) return 0;
    if (Math.abs(x) < 1.0) return u > 1.95 && u < 3.6 ? 0.06 : 0;
    return surfaceAt(earthProfile(level).pts, u);
  }
  function step2() {
    phase = 2;
    shell.step(1);
    shell.score('');
    walk.showNav(false);
    buildFront(1);
    view([3.6, 2.9, 20.2], [-2.3, 0.1, 14.9]);
    placeRiders(RX, 19.6, -1);
    let mistakes = 0, running = false, solved = false;
    shell.task('Конница идва към столицата. <b>Изкопай рова с плъзгача</b> — пръстта отива във вала. После пусни конниците. Колко дълбок трябва да е ровът, за да ги спре?');
    const c = shell.setControls(`<label class="small">Ровът: <b class="lvl">${LEVEL_NAMES[1]}</b></label>
      <input class="dig" type="range" min="0" max="4" step="1" value="1" style="width:100%">
      <button class="btn primary go">Пусни конниците</button>`);
    const range = c.querySelector('.dig'), lbl = c.querySelector('.lvl'), go = c.querySelector('.go');
    range.addEventListener('input', () => { if (running) return; buildFront(+range.value); lbl.textContent = LEVEL_NAMES[level]; clearTip(); placeRiders(RX, 19.6, -1); });
    go.addEventListener('click', () => {
      if (running) return;
      running = true; range.disabled = true; go.disabled = true; clearTip();
      placeRiders(RX, 19.6, -1);
      const pass = level < STOP_LEVEL;
      riders.forEach((r) => { r.userData.moving = true; r.userData.back = false; r.userData.rear = 0; });
      ride = (dt) => {
        let all = true;
        riders.forEach((r, i) => {
          if (!r.userData.moving) return;
          all = false;
          const dir = r.userData.back ? 1 : -1;
          const stopZ = pass ? 11.6 - i * 0.7 : 17.35 + i * 0.9;
          if (!r.userData.back && !pass && r.position.z <= stopZ) {
            r.userData.rear += dt;
            r.rotation.z = Math.sin(Math.min(1, r.userData.rear / 0.8) * Math.PI) * 0.45;
            if (r.userData.rear > 0.9) { r.userData.back = true; r.rotation.set(0, -Math.PI / 2, 0); }
            return;
          }
          if (r.userData.back && r.position.z >= 19.6 + i * 0.9) { r.userData.moving = false; r.rotation.set(0, Math.PI / 2, 0); return; }
          if (!r.userData.back && pass && r.position.z <= stopZ) { r.userData.moving = false; r.rotation.z = 0; return; }
          const z0 = r.position.z;
          r.position.z += dir * dt * 2.4;
          const y = heightAt(r.position.x, r.position.z);
          r.position.y = y;
          if (!r.userData.back) r.rotation.z = Math.atan2(y - heightAt(r.position.x, z0), 0.0001 + Math.abs(r.position.z - z0)) * 0.9;
        });
        if (all) { ride = null; finishRun(pass); }
      };
    });
    function finishRun(pass) {
      running = false; range.disabled = false; go.disabled = false;
      if (pass) {
        say(riders[0], `<b>Конниците минаха!</b> Ровът е ${LEVEL_NAMES[level]}, а валът — нисък. Конят слиза в рова и изкачва вала. Копай по-дълбоко.`, { cls: 'wide', lift: 1.0 });
        shell.msg('Опитай с по-дълбок ров.', '');
        return;
      }
      say(named.valT, '<b>Конниците спряха.</b> Дълбокият ров и високият вал заедно са по-високи от кон. Конницата не може да ги прескочи. ' + REC + ': дълбочината на рова и височината на вала.', { cls: 'good wide', lift: 0.6 });
      if (solved) return;
      solved = true;
      shell.msg('Спря ги!', 'good');
      setTimeout(() => ask(0), 400);
    }
    function ask(k) {
      const Q = Q2[k];
      shell.task(Q.q);
      const cc = shell.setControls(`<div class="col">${Q.a.map((a, i) => `<button class="btn" data-i="${i}">${esc(a.t)}</button>`).join('')}</div>`);
      cc.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const a = Q.a[+b.dataset.i];
        if (!a.ok) { mistakes++; b.disabled = true; shell.msg(a.why, 'bad'); return; }
        shell.msg('Вярно!', 'good');
        if (k === 0) {
          view([-1.5, 9, 23], [0, 0, 8], 1.4);
          say(named.gate, 'Вътре във вала има място за жилища, стада и ниви. В средата е Вътрешният град с каменната стена.', { cls: 'wide', lift: 2.6 });
          return ask(1);
        }
        scores.push(stepScore(mistakes, 3));
        const n = shell.setControls('<button class="btn primary">Напред →</button>');
        n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
      }));
    }
  }

  // ---------- 3. Кой управлява? ----------
  const PY = 0.45;            // височина, на която се влачат картите
  const STEP_H = 0.18, STEP_D = 0.7;
  const pyramid = new THREE.Group(); pyramid.visible = false; scene.add(pyramid);
  const slots = {};
  RANKS.forEach((r, i) => {
    const k = RANKS.length - i; // 5 за най-горното стъпало … 1 за основата
    const w = 2.6 + (RANKS.length - k) * 0.6;
    const z = 0.3 + i * STEP_D;
    const h = STEP_H * (RANKS.length - i);
    const st = new THREE.Mesh(new THREE.BoxGeometry(w, h, STEP_D), M(0xfff8ea, { tex: 'limestone', rep: [Math.round(w), 1] }));
    st.position.set(0, h / 2, z); pyramid.add(st);
    const lab = labelSprite(r.desc, { size: 0.19 * K, bg: 'rgba(255,248,225,0.95)' });
    lab.position.set(0, h + 0.1, z); pyramid.add(lab);
    const mk = new THREE.Object3D(); mk.position.set(0, PY, z); mk.userData.slotId = r.id; pyramid.add(mk);
    slots[r.id] = { z, top: h, mesh: st, label: lab };
  });
  const zones = {};
  const ZX = narrow ? 3.3 : 5.9;
  for (const [side, x, name, color] of [['s', -ZX, 'Славяни', 0x2f8f5b], ['b', ZX, 'Древни българи', 0xb0662b]]) {
    const z = zoneRing(color, narrow ? 1.35 : 2.0); z.position.set(x, 0.02, 10.4); z.visible = false; scene.add(z);
    const l = labelSprite(name, { size: 0.32 }); l.position.set(narrow ? -Math.sign(x) * 0.9 : 0, 1.2, -1.6); z.add(l);
    const mk = new THREE.Object3D(); mk.position.set(0, PY, 0); mk.userData.zoneId = side; z.add(mk);
    zones[side] = { ring: z, x, z: 10.4, n: 0 };
  }
  function card(id, text, x, z) {
    const g = new THREE.Group();
    const l = labelSprite(text, { size: 0.2 * K, bg: 'rgba(255,255,255,0.97)', border: '#1a6fd1' });
    const b = new THREE.Mesh(new THREE.BoxGeometry(l.scale.x + 0.08, 0.05, 0.36), mat(0x1a6fd1));
    l.position.y = 0.2;
    g.add(b, l);
    g.position.set(x, PY, z);
    g.userData = { dragId: id, home: g.position.clone() };
    addHitBox(g, 0.5);
    scene.add(g); extra.push(g);
    return g;
  }
  function step3() {
    phase = 3;
    shell.step(2);
    riders.forEach((r) => { r.visible = false; });
    buildFront(3);
    for (const p of [...court, ...innerFolk]) p.visible = false;
    pyramid.visible = true;
    for (const r of RANKS) slots[r.id].label.visible = true;
    for (const r of RANKS) slots[r.id].mesh.material = M(0xfff8ea, { tex: 'limestone', rep: [Math.round(slots[r.id].mesh.geometry.parameters.width), 1] });
    if (narrow) stage.flyTo([0, 7.2, 8.8], [0, 0.3, 2.9], 1); else view([0.2, 5.0, 8.4], [0, 0.3, 2.4]);
    let mistakes = 0, placed = 0;
    const tries = {};
    const xs = narrow ? [-1.3, 1.3, -1.3, 1.3, 0] : [-2.4, -0.8, 0.8, 2.4, 0];
    const zs = narrow ? [4.3, 4.3, 5.1, 5.1, 5.9] : [4.3, 4.3, 4.3, 4.3, 5.1];
    const order = ['ichirgu', 'people', 'khan', 'boils', 'kavhan'];
    order.forEach((id, i) => { const r = RANKS.find((x) => x.id === id); card(id, r.card, xs[i], zs[i]); });
    shell.task('Това е „стълбата на властта“ в държавата. Завлечи всяка карта на стъпалото, което описва какво прави този човек или тази група.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${RANKS.length}`);
    stopDrag = stage.enableDrag({
      planeY: PY, lift: 0.25,
      onDrop(obj) {
        const id = obj.userData.dragId;
        if (phase === 3) {
          let best = null, bd = 0.5;
          if (Math.abs(obj.position.x) < 3.2) for (const r of RANKS) { const d = Math.abs(obj.position.z - slots[r.id].z); if (d < bd) { bd = d; best = r.id; } }
          if (!best) { obj.position.copy(obj.userData.home); return; }
          if (best === id) {
            obj.userData.locked = true;
            obj.position.set(0.0, slots[id].top + 0.04, slots[id].z);
            placed++;
            shell.score(`Подредени: ${placed} от ${RANKS.length}`);
            shell.msg('Вярно!', 'good');
            slots[id].mesh.material = M(0xc9efd6, { tex: 'limestone', rep: [2, 1] });
            slots[id].label.visible = false; // картата застава на мястото на описанието
            if (placed === RANKS.length) {
              say(slots.khan.mesh, 'Ханът е начело. Кавханът и ичиргу-боилът са след него. Под тях са знатните, а в основата — свободните българи и славяни.', { cls: 'good wide', lift: 0.9 });
              const n = shell.setControls('<button class="btn primary">Напред →</button>');
              n.querySelector('button').addEventListener('click', () => { clearTip(); phaseB(); });
              stepMistakes = mistakes;
            }
          } else {
            mistakes++;
            tries[id] = (tries[id] || 0) + 1;
            obj.position.copy(obj.userData.home);
            const r = RANKS.find((x) => x.id === id);
            shell.msg(tries[id] >= 2 ? `Не е това стъпало. ${r.hint}` : 'Не е това стъпало. Прочети пак какво пише до него.', 'bad');
          }
          return;
        }
        // phase 3.5: славяни или древни българи
        const t = TRAITS.find((x) => x.id === id);
        let best = null;
        for (const s of ['s', 'b']) { const zz = zones[s]; if (Math.hypot(obj.position.x - zz.x, obj.position.z - zz.z) < (narrow ? 1.9 : 2.5)) best = s; }
        if (!best) { obj.position.copy(obj.userData.home); return; }
        if (best === t.side) {
          obj.userData.locked = true;
          const zz = zones[best];
          obj.position.set(narrow ? zz.x * 0.6 : zz.x, 1.3 + zz.n * 0.42, zz.z + (narrow ? 0.6 : 1.2));
          zz.n++; placedB++;
          shell.score(`Подредени: ${placedB} от ${TRAITS.length}`);
          shell.msg('Вярно!', 'good');
          if (placedB === TRAITS.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(stepMistakes + mistakesB, 5));
            say(named.gate, 'Двата народа са различни по вяра, бит и управление. Но живеят в една държава и постепенно се сливат в един народ.', { cls: 'good wide', lift: 2.6 });
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakesB++;
          obj.position.copy(obj.userData.home);
          triesB[id] = (triesB[id] || 0) + 1;
          shell.msg(triesB[id] >= 2 ? 'Спомни си спирките „Жилищата“ и „Езическото светилище“.' : 'Не е при тях. Помисли за вярата, бита и управлението на всеки народ.', 'bad');
        }
      },
    });
  }
  let stepMistakes = 0, mistakesB = 0, placedB = 0;
  const triesB = {};
  function phaseB() {
    phase = 3.5;
    mistakesB = 0; placedB = 0;
    for (const k of Object.keys(triesB)) delete triesB[k];
    zones.s.n = 0; zones.b.n = 0;
    zones.s.ring.visible = true; zones.b.ring.visible = true;
    if (narrow) stage.flyTo([0, 9.6, 16.4], [0, 0.3, 10.5], 1); else view([0, 7.6, 20.5], [0, 0.3, 10.0]);
    shell.msg('');
    TRAITS.forEach((t, i) => (narrow ? card(t.id, t.label, 0, 8.6 + i * 0.75) : card(t.id, t.label, i % 2 ? 1.35 : -1.35, 9.0 + Math.floor(i / 2) * 1.15)));
    shell.task('Сравни двата народа до покръстването. Завлечи всяка карта при славяните или при древните българи.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${TRAITS.length}`);
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    phase = 4;
    shell.step(3);
    shell.score('');
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    zones.s.ring.visible = false; zones.b.ring.visible = false;
    pyramid.visible = false;
    for (const p of [...court, ...innerFolk]) p.visible = true;
    let mistakes = 0;
    const ask = (k) => {
      const P = P4[k];
      if (k === 0) view([2.4, 2.6, 6.4], [0, 1.0, -2.6]); else view([1.6, 2.2, 3.0], [-1.8, 0.8, -1.6]);
      say(k === 0 ? named.palace : named.khan, P.lead, { cls: 'wide', lift: k === 0 ? 2.4 : 1.2 });
      shell.task(`<b>${esc(P.q)}</b>`);
      const c = shell.setControls(`<div class="col">${P.a.map((a, i) => `<button class="btn" data-i="${i}">${esc(a.t)}</button>`).join('')}</div>`);
      c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const a = P.a[+b.dataset.i];
        if (!a.ok) { mistakes++; b.disabled = true; shell.msg(a.why, 'bad'); return; }
        shell.msg('Вярно предсказание!', 'good');
        c.querySelectorAll('button').forEach((x) => { x.disabled = true; });
        if (k === 0) {
          // Войската тръгва на юг през портата.
          view([5.0, 3.4, 19.5], [0, 0.6, 11.5], 1.2);
          riders.forEach((r, i) => { r.visible = true; r.position.set((i - 1) * 0.45, 0, 4.4 - i * 0.9); r.rotation.set(0, -Math.PI / 2, 0); r.userData.moving = true; });
          ride = (dt) => { riders.forEach((r) => { if (r.position.z < 24) { r.position.z += dt * 2.0; r.position.y = heightAt(r.position.x, r.position.z); } else r.userData.moving = false; }); };
          say(named.valT, P.done, { cls: 'good wide', lift: 1.2 });
        } else {
          column.visible = true; column.scale.set(1, 0.05, 1);
          say(column, P.done, { cls: 'good wide', lift: 1.3 });
        }
        const n = shell.setControls(`<button class="btn primary">${k === 0 ? 'Напред →' : 'Виж резултата'}</button>`);
        n.querySelector('button').addEventListener('click', () => {
          clearTip(); shell.msg('');
          if (k === 0) { ride = null; riders.forEach((r) => { r.visible = false; }); return ask(1); }
          scores.push(stepScore(mistakes, 3));
          shell.finish(scores.reduce((s, x) => s + x, 0) / scores.length, onComplete, restart);
        });
      }));
    };
    ask(0);
  }
  stage.tick((dt) => { if (column.visible && column.scale.y < 1) column.scale.y = Math.min(1, column.scale.y + dt * 0.9); });

  function restart() {
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip();
    ride = null;
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    riders.forEach((r) => { r.visible = false; r.userData.moving = false; });
    column.visible = false;
    pyramid.visible = false;
    zones.s.ring.visible = false; zones.b.ring.visible = false;
    for (const p of [...court, ...innerFolk]) p.visible = true;
    buildFront(3);
    // Разходката започва отначало: нов списък със спирки без ✓.
    walk.dispose();
    walk = makeWalk();
    stage.flyTo([0, 2, 24], [0, 0.3, 14], 0.3);
    setTimeout(step1, 350);
  }

  step1();
  container.__demo = {
    stage, riders,
    get walk() { return walk; },
    get level() { return level; },
    get phase() { return phase; },
  };
  return { dispose() { if (stopDrag) stopDrag(); smk.dispose(); walk.dispose(); stage.dispose(); } };
}
