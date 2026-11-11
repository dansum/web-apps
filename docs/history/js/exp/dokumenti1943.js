// 9.2.4 „България във войната и спасяването на евреите“ — възстановено място: София и Кюстендил, март 1943 г.
// Стъпки: опознай (Народното събрание, правителството, Светия синод, улицата, гарата в Кюстендил,
// партизаните, будката с новините, обявата със закона) → опит: проследи веригата от решения и реакции
// през март 1943 г. и виж как всяка реакция променя съдбата на хората → приложи: легална съпротива,
// нелегална съпротива или политика на режима → предскажи (реален изход): какво става с евреите от
// старите предели и с Димитър Пешев.
// ЧУВСТВИТЕЛНА ТЕМА: пише се спокойно, като в учебник. Честно се казва и двете: евреите от старите
// предели са спасени, а над 11 000 евреи от Беломорието, Вардарска Македония и Пирот (земи под
// българско управление) са депортирани и почти всички загиват.
// Сградите и хората са възстановка; София и Кюстендил са събрани в една сцена (разположението е условно).
// Изворите са преразказ, не дословен текст.
import { createStage, cornerMenu, labelSprite, addHitBox, zoneRing, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { M } from './hist/architecture.js';
import { mergeStatic, pine, forestHill } from './hist/revival.js';
import { CM, col, europeanHouse, streetLamp, bench } from './hist/city.js';
import { parliament, stateBuilding, nevsky, flag, vitosha } from './hist/sofia-places.js';
import { cloud, smoke } from './hist/bulgar.js';
import {
  person43, step43, bundle, bareTree, tram, tramRails, locomotive, wagon, railway,
  stationHouse, smallHouse, synodBuilding, kiosk, noticeBoard, forestCamp,
} from './hist/sofia1943.js';

const ms = (obj, keys = []) => mergeStatic(obj, keys.flatMap((k) => [].concat(obj.userData[k] ?? [])));
const tag = (s) => `<br><span class="small"><b>${s}</b></span>`;

// ---------- стъпка 1 ----------
const SPOTS = [
  { id: 'kiosk', label: 'Изборът във войната', icon: '📰',
    note: `<b>Как България влиза във войната.</b> На 1 март 1941 г. България се присъединява към Тристранния пакт — съюза на Германия, Италия и Япония. Германските войски вече са в съседна Румъния, а правителството се надява да реши националния въпрос без голяма война. От април 1941 г. България управлява Вардарска Македония и Беломорието. През декември 1941 г. обявява война на Великобритания и САЩ, но не изпраща войски срещу СССР.${tag('Будката и вестниците са възстановка.')}` },
  { id: 'zzn', label: 'Законът за защита на нацията', icon: '⚖️',
    note: `<b>Политиката на режима.</b> От началото на 1941 г. действа Законът за защита на нацията. Той отнема права на евреите: не могат да работят в държавна служба, ограничени са в професиите, в имотите и в това къде да живеят. През 1942 г. е създадено Комисарство за еврейските въпроси. Още при обсъждането на закона срещу него протестират писатели и други общественици, а също и Светият синод.${tag('Обявата е възстановка, текстът на закона не е показан.')}` },
  { id: 'ns', label: 'Народното събрание', icon: '🏛️',
    note: `<b>Народното събрание.</b> Подпредседател на събранието през 1943 г. е Димитър Пешев — депутат от Кюстендил и от управляващото мнозинство. През март 1943 г. той пише писмо до министър-председателя срещу депортирането на евреите. Писмото подписват 43 депутати.${tag('Сградата е запазена и днес. Моделът е опростен.')}` },
  { id: 'gov', label: 'Правителството', icon: '🏢',
    note: `<b>Правителството.</b> Министър-председател е Богдан Филов, министър на вътрешните работи — Петър Габровски. Заповедите за задържане на евреите минават през неговото министерство. Големите решения се вземат от правителството и цар Борис III. Каква точно е ролята на царя, и днес се обсъжда от историците.${tag('Сградата е условна, само знак за сцената.')}` },
  { id: 'synod', label: 'Светият синод', icon: '⛪',
    note: `<b>Светият синод</b> ръководи Българската православна църква. Още през 1940 г. той възразява срещу Закона за защита на нацията. През 1943 г. митрополит Стефан (в София) и митрополит Кирил (в Пловдив) открито защитават евреите. Отзад се вижда храм-паметникът „Св. Александър Невски“.${tag('Сградата на Синода е запазена; моделът е условен. Хората са възстановка.')}` },
  { id: 'street', label: 'Улица в София', icon: '🏘️',
    note: `<b>Съседи.</b> В София живеят много български евреи — търговци, занаятчии, лекари, работници. Те са съседи, съученици и колеги на другите софиянци. Законът ги отделя от останалите, но част от съседите им не приемат това.${tag('Улицата и хората са възстановка.')}` },
  { id: 'kyust', label: 'Гарата в Кюстендил', icon: '🚉',
    note: `<b>Кюстендил.</b> Град в Западна България. На 8 март 1943 г. тук се разбира, че местните евреи ще бъдат задържани и изпратени извън страната. Група граждани веднага тръгват за София при своя депутат Димитър Пешев.${tag('Гарата и хората са възстановка. В сцената Кюстендил е близо до София, а е на около 90 км.')}` },
  { id: 'forest', label: 'Партизаните в планината', icon: '🌲',
    note: `<b>Нелегалната съпротива.</b> Някои се борят срещу режима и съюза с Германия тайно и с оръжие. От 1941 г. в планините действат партизански отряди. Разпространяват се забранени позиви, правят се саботажи. През 1942 г. е създаден Отечественият фронт — нелегален съюз на опозиционни партии. Властите ги преследват.${tag('Лагерът е спокойна възстановка.')}` },
];

// ---------- стъпка 2: веригата от март 1943 г. ----------
// old/neu — какво пише в двете карти със съдбата на хората след събитието.
const CHAIN = [
  { id: 'deal', label: 'Споразумение за депортиране', when: 'февруари 1943 г.',
    text: 'Комисарството за еврейските въпроси се договаря с германски представител да бъдат изпратени 20 000 евреи към окупираните от Германия земи. Първо са определени евреите от Беломорието и Вардарска Македония, а за останалите — евреи от старите предели.',
    old: ['В опасност', '#c98a1a'], neu: ['В опасност', '#c98a1a'] },
  { id: 'arrest', label: 'Арести в новите земи', when: 'началото на март',
    text: 'В Беломорието, Вардарска Македония и Пирот — земи под българско управление — евреите са задържани от българските власти. Над 11 000 души са предадени на германските власти и откарани в лагера Треблинка. Почти никой от тях не оцелява. За тях протестите идват твърде късно.',
    neu: ['Депортирани: над 11 000 души', '#5a5f66'] },
  { id: 'kyust', label: 'Кюстендилци тръгват за София', when: '8 март',
    text: 'В Кюстендил научават, че и местните евреи ще бъдат задържани. Група граждани тръгват за София при депутата Димитър Пешев.',
    old: ['В опасност — хората реагират', '#c98a1a'] },
  { id: 'deputies', label: 'Пешев и депутати при министъра', when: '9 март',
    text: 'Пешев и група депутати отиват при министъра на вътрешните работи Петър Габровски и настояват задържането да бъде спряно.' },
  { id: 'cancel', label: 'Заповедта е отменена', when: '9 март вечерта',
    text: 'Министърът отменя заповедта за евреите от старите предели. В Пловдив вече задържаните са пуснати на 10 март. Там срещу задържането протестира митрополит Кирил.',
    old: ['Задържането е спряно', '#2e9d55'] },
  { id: 'letter', label: 'Писмото на 43-мата', when: 'средата на март',
    text: 'Пешев пише писмо до министър-председателя: депортирането е недопустимо и ще навреди на доброто име на България. Подписват го 43 депутати, повечето от управляващото мнозинство. Светият синод също настоява евреите да не бъдат изпращани. (Преразказ, не дословен текст.)',
    old: ['Депортирането е отложено', '#2e9d55'] },
];
const DISTRACT = [
  { id: 'germany', label: 'Германия сама се отказва', why: 'Не. Германските служби настояват за депортирането. Промяната идва от натиска на хора в България.' },
  { id: 'nobody', label: 'Никой не научава за заповедта', why: 'Не. Новината се разчува и хората реагират.' },
];
const LATE = 'Това се случва по-късно. Помисли: какво трябва да стане преди него?';
const HINT = {
  deal: 'Подсказка: първо има план и споразумение.',
  arrest: 'Подсказка: първо са засегнати земите под българско управление.',
  kyust: 'Подсказка: новината стига до един град в Западна България.',
  deputies: 'Подсказка: кюстендилци търсят своя депутат. Какво прави той?',
  cancel: 'Подсказка: какво решава министърът след натиска?',
  letter: 'Подсказка: депутатите искат депортирането да не се повтори.',
};

// ---------- стъпка 3 ----------
const ZONES = [
  { id: 'z-legal', label: 'Легална съпротива', color: 0x2e9d55, css: '#2e9d55', dx: -3.1, dz: 0 },
  { id: 'z-illegal', label: 'Нелегална съпротива', color: 0x8a5a2a, css: '#8a5a2a', dx: 0, dz: 0.5 },
  { id: 'z-regime', label: 'Политика на режима', color: 0x5a5f66, css: '#5a5f66', dx: 3.1, dz: 0 },
];
const CARDS = [
  { id: 'c-kyust', label: 'Делегацията от Кюстендил', zone: 'z-legal', ok: 'Да. Гражданите отиват открито при своя депутат — законен начин да защитиш съседите си.' },
  { id: 'c-party', label: 'Партизански отряд в планината', zone: 'z-illegal', ok: 'Да. Партизаните действат тайно и с оръжие — това е нелегална съпротива.' },
  { id: 'c-zzn', label: 'Законът за защита на нацията', zone: 'z-regime', ok: 'Да. Законът е приет от властта и отнема права на евреите.' },
  { id: 'c-letter', label: 'Писмото на 43-мата депутати', zone: 'z-legal', ok: 'Да. Депутатите използват законното си право. Рискуват поста си, но не нарушават закона.' },
  { id: 'c-leaflet', label: 'Забранени позиви срещу съюза с Германия', zone: 'z-illegal', ok: 'Да. Позивите се печатат и разнасят тайно.' },
  { id: 'c-pact', label: 'Присъединяване към Тристранния пакт', zone: 'z-regime', ok: 'Да. Това е решение на правителството от 1 март 1941 г.' },
  { id: 'c-kiril', label: 'Телеграма на митрополит Кирил до царя', zone: 'z-legal', ok: 'Да. Църквата протестира открито, с думи и писма.' },
  { id: 'c-of', label: 'Отечественият фронт (1942 г.)', zone: 'z-illegal', ok: 'Да. Той е забранен и действа тайно.' },
  { id: 'c-kom', label: 'Комисарство за еврейските въпроси', zone: 'z-regime', ok: 'Да. То е създадено от властта, за да изпълнява антиеврейската политика.' },
];
const CARD_WRONG = {
  'z-legal': 'Това се прави открито и по законен път.',
  'z-illegal': 'Това е забранено и се прави тайно.',
  'z-regime': 'Това не е съпротива. Това решава или прави самата власт.',
};
const CARD_HINT = {
  'z-legal': ' Подсказка: открито, с думи, писма и молби.',
  'z-illegal': ' Подсказка: тайно, забранено.',
  'z-regime': ' Подсказка: това е дело на властта.',
};

// ---------- стъпка 4 ----------
const Q1 = [
  { t: 'Ще бъдат депортирани по-късно през 1943 г.', ok: false, why: 'Не. Депортиране от старите предели не се провежда — нито през 1943 г., нито по-късно.' },
  { t: 'Ще останат в България, но евреите от София ще бъдат изселени в провинцията.', ok: true },
  { t: 'Законът за защита на нацията ще бъде отменен веднага и всички ще живеят спокойно.', ok: false, why: 'Не. Законът остава в сила, а ограниченията продължават.' },
];
const Q2 = [
  { t: 'Награден е от правителството.', ok: false, why: 'Не. Правителството е недоволно от писмото.' },
  { t: 'Става министър-председател.', ok: false, why: 'Не. Писмото му донася неприятности, а не повишение.' },
  { t: 'Свален е от поста подпредседател на Народното събрание.', ok: true },
];

// ---------- табло „Март 1943 г.“ ----------
function boardMat() {
  const c = document.createElement('canvas'); c.width = 1280; c.height = 760;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.MeshBasicMaterial({ map: t });
  m.userData.canvas = c;
  return m;
}
function wrap(ctx, text, maxW) {
  const words = text.split(' '); const lines = []; let line = '';
  for (const w of words) { const tt = line ? line + ' ' + w : w; if (ctx.measureText(tt).width > maxW && line) { lines.push(line); line = w; } else line = tt; }
  if (line) lines.push(line);
  return lines;
}
function drawBoard(m, placed, old, neu) {
  const c = m.userData.canvas, ctx = c.getContext('2d'), W = c.width, H = c.height;
  ctx.fillStyle = '#f4ecd8'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 8; ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.fillStyle = '#2a2218'; ctx.font = 'bold 48px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('Март 1943 г.: решения и реакции', W / 2, 70);
  // Веригата.
  const x0 = 40, cw = 640, rh = 100, y0 = 104;
  for (let i = 0; i < CHAIN.length; i++) {
    const y = y0 + i * rh;
    const e = placed[i] ? CHAIN.find((x) => x.id === placed[i]) : null;
    ctx.fillStyle = e ? '#ffffff' : 'rgba(255,255,255,0.35)';
    ctx.strokeStyle = e ? '#5a4a2a' : 'rgba(90,74,42,0.35)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(x0, y, cw, rh - 26, 14); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left';
    if (e) {
      ctx.fillStyle = '#8a5a1a'; ctx.font = 'bold 26px system-ui, Arial, sans-serif'; ctx.fillText(e.when, x0 + 20, y + 30);
      ctx.fillStyle = '#1b2a3a'; ctx.font = 'bold 32px system-ui, Arial, sans-serif'; ctx.fillText(e.label, x0 + 20, y + 64, cw - 40);
    } else {
      ctx.fillStyle = 'rgba(90,74,42,0.5)'; ctx.font = 'bold 40px system-ui, Arial, sans-serif'; ctx.fillText('?', x0 + 20, y + 52);
    }
    if (i < CHAIN.length - 1) {
      ctx.fillStyle = placed[i + 1] ? '#5a4a2a' : 'rgba(90,74,42,0.3)';
      ctx.beginPath(); ctx.moveTo(x0 + cw / 2 - 14, y + rh - 24); ctx.lineTo(x0 + cw / 2 + 14, y + rh - 24); ctx.lineTo(x0 + cw / 2, y + rh - 4); ctx.fill();
    }
  }
  // Двете карти със съдбата на хората.
  const card = (y, title, st) => {
    const x = 720, w = 520, h = 290;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = st[1]; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b2a3a'; ctx.textAlign = 'left'; ctx.font = 'bold 30px system-ui, Arial, sans-serif';
    wrap(ctx, title, w - 40).forEach((l, i) => ctx.fillText(l, x + 20, y + 46 + i * 36));
    ctx.fillStyle = st[1]; ctx.beginPath(); ctx.roundRect(x + 20, y + 150, w - 40, 110, 12); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px system-ui, Arial, sans-serif'; ctx.textAlign = 'center';
    const ls = wrap(ctx, st[0], w - 70);
    ls.forEach((l, i) => ctx.fillText(l, x + w / 2, y + 205 + (i - (ls.length - 1) / 2) * 40));
  };
  card(104, 'Евреите от старите предели (България до 1941 г.)', old);
  card(424, 'Евреите от Беломорието, Вардарска Македония и Пирот', neu);
  m.map.needsUpdate = true;
}

// Лист хартия с надпис (заповед, писмо, списъци).
const SHEETS = new Map();
function sheetMat(kind) {
  if (SHEETS.has(kind)) return SHEETS.get(kind);
  const c = document.createElement('canvas'); c.width = 256; c.height = 320;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f6eed8'; ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = '#2a2218'; ctx.textAlign = 'center'; ctx.font = 'bold 30px Georgia, serif';
  const title = { order: 'ЗАПОВЕД', letter: 'ПИСМО', lists: 'СПИСЪЦИ', law: 'ЗАКОН', news: 'ВЕСТНИК' }[kind];
  ctx.fillText(title, 128, 50);
  if (kind === 'letter') { ctx.font = '18px Georgia, serif'; ctx.fillText('до министър-председателя', 128, 78); }
  if (kind === 'law') { ctx.font = '18px Georgia, serif'; ctx.fillText('за защита на нацията', 128, 78); }
  ctx.fillStyle = 'rgba(40,30,20,0.45)';
  for (let y = 100, i = 0; y < 280; y += 16, i++) ctx.fillRect(26, y, 204 - ((i * 37) % 60), 6);
  if (kind === 'letter') { ctx.strokeStyle = 'rgba(30,40,90,0.7)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(30 + (i % 3) * 70, 268 + Math.floor(i / 3) * 22); ctx.bezierCurveTo(50 + (i % 3) * 70, 255 + Math.floor(i / 3) * 22, 60 + (i % 3) * 70, 285 + Math.floor(i / 3) * 22, 85 + (i % 3) * 70, 266 + Math.floor(i / 3) * 22); ctx.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide });
  SHEETS.set(kind, m);
  return m;
}
function sheet(kind) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.01), sheetMat(kind)); g.add(p);
  return g;
}
function crossMark() {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: 0xc0392b });
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.02), m); b.rotation.z = s * 0.7; g.add(b); }
  return g;
}

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['София и Кюстендил, 1943 г.', 'Веригата от март 1943 г.', 'Видове съпротива', 'Предскажи'] });
  const stage = createStage(shell.stageEl, { background: 0xcdd8e2, camPos: [-2.5, 11, 19], target: [-1.5, 1, -2.5], minDistance: 2, maxDistance: 42, maxPolarAngle: Math.PI * 0.47 });
  const { scene } = stage;
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const narrow = aspect < 1;
  const view = (pos, tgt, dur = 1, k = far) => { stage.stopFollow(); stage.flyTo(pos.map((v, i) => tgt[i] + (v - tgt[i]) * k), tgt, dur); };
  scene.fog = new THREE.Fog(0xcdd8e2, 38, 90);
  const named = {};
  const add = (obj, x, z, ry = 0, s = 1, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; obj.scale.setScalar(s); scene.add(obj); obj.updateMatrixWorld(true); return obj; };
  const mark = (id, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); named[id] = o; return o; };
  const flags = [];

  // ---------- земя ----------
  const grass = new THREE.Mesh(new THREE.BoxGeometry(110, 0.1, 110), col(0x8a9a6a, { rough: 1 })); grass.position.y = -0.05; scene.add(grass);
  const square = new THREE.Mesh(new THREE.BoxGeometry(17, 0.04, 11), CM('paving', { rep: [11, 7] })); square.position.set(0, 0.02, -3.5); scene.add(square);
  const road = new THREE.Mesh(new THREE.BoxGeometry(70, 0.03, 2.0), col(0x55575a, { rough: 0.95 })); road.position.set(0, 0.025, 6.8); scene.add(road);
  const rails = tramRails(70); rails.position.set(0, 0, 6.8); scene.add(rails);
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(70, 0.05, 0.7), col(0xb4ada0)); walkway.position.set(0, 0.025, 5.5); scene.add(walkway);
  const streetW = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 9), CM('paving', { rep: [1, 6] })); streetW.position.set(9.3, 0.02, -0.5); scene.add(streetW);
  // Топящ се сняг (март).
  const snowM = new THREE.MeshStandardMaterial({ color: 0xe8ecee, roughness: 1 });
  for (const [x, z, r] of [[-21, -7, 1.4], [21, 3, 1.2], [20, -12, 1.8], [-22, 4, 1.2]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), snowM); s.position.set(x, 0, z); s.scale.set(1, 0.08, 0.6); scene.add(s);
  }
  const mt = vitosha({ w: 90, d: 18, h: 8 }); mt.position.set(0, 0, -40); scene.add(mt);
  const clouds = [];
  for (const [x, y, z] of [[-16, 13, -24], [4, 15, -30], [17, 12, -20], [-4, 14, -18]]) { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(2.2); scene.add(c); clouds.push(c); }

  // ---------- сградите на София ----------
  const S = 1.5;
  const nsRaw = parliament({ w: 3.0, d: 1.3 }); flags.push(nsRaw.userData.flag);
  const NS = add(ms(nsRaw, ['flag']), -4.6, -5.0, 0.3, S); NS.userData.pickId = 'ns';
  const govRaw = stateBuilding({ w: 3.0, d: 1.2, h: 1.7, color: 0xe2d7bf }); flags.push(govRaw.userData.flag);
  const GOV = add(ms(govRaw, ['flag']), 1.0, -8.6, 0, 1.4); GOV.userData.pickId = 'gov';
  const SYN = add(synodBuilding(), 5.6, -5.0, -0.3, S); SYN.userData.pickId = 'synod';
  const NEV = add(mergeStatic(nevsky({ s: 1 })), 9.5, -11.5, -0.4, 1.4); NEV.userData.pickId = 'synod';
  // Улицата с жителите (вдясно).
  const houses = [];
  [[0xe8c98a, 2], [0xd9b9a0, 3], [0xc9d0b0, 2], [0xe6d6b8, 3]].forEach(([c, fl], i) => {
    const h = europeanHouse({ w: 1.8, d: 1.2, floors: fl, color: c, shop: i % 2 === 0 });
    const hh = add(mergeStatic(h), 11.2, -3.6 + i * 2.1, -Math.PI / 2, 1.1); hh.userData.pickId = 'street';
    houses.push(hh);
  });
  const smokeA = smoke(stage, houses.map((h) => new THREE.Vector3(h.position.x + 0.15, 2.6, h.position.z + 0.5)), { color: 0xc8c4bc });
  // Площадът: будка, обява, фенери, пейки, голи дървета.
  const KIOSK = add(kiosk(sheetMat('news')), -2.6, 0.8, 0.4, 1.3); KIOSK.userData.pickId = 'kiosk'; addHitBox(KIOSK, 1.2);
  const ZZN = add(noticeBoard(sheetMat('law')), 3.0, 0.6, -0.3, 1.3); ZZN.userData.pickId = 'zzn'; addHitBox(ZZN, 1.2);
  for (const x of [-6, -1.5, 3.5, 7.5]) add(mergeStatic(streetLamp()), x, 4.9, 0, 1.4);
  for (const x of [-4.2, 5.2]) add(mergeStatic(bench()), x, 4.6, Math.PI, 1.4);
  for (const [x, z, s] of [[-8, -1, 1.6], [-7.5, 3.5, 1.4], [7.5, 1.5, 1.5], [8, -7.8, 1.7], [-8.2, -9, 1.8], [-1.8, -11.5, 1.6], [4.5, -11.8, 1.5], [12.5, 4.6, 1.5]]) add(bareTree(s, Math.round(x * 3 + z)), x, z);

  // ---------- Кюстендил и железницата (вляво) ----------
  const RZ = 2.4;
  const rw = railway(15); rw.position.set(-12, 0, RZ); scene.add(rw);
  const KST = add(stationHouse('КЮСТЕНДИЛ'), -15.2, RZ - 1.6, 0, 1.1); KST.userData.pickId = 'kyust';
  const SST = add(stationHouse('СОФИЯ', { w: 2.0 }), -7.6, RZ - 1.6, 0, 1.0);
  const kHouses = [];
  for (const [x, z, c] of [[-17.5, -1.6, 0xf1e6cc], [-15.8, -3.2, 0xe8d8b8], [-13.6, -2.6, 0xf3ecdc], [-18.2, -4.2, 0xe6d2b0]]) kHouses.push(add(smallHouse({ color: c }), x, z, 0.1, 1.2));
  const smokeK = smoke(stage, kHouses.map((h) => h.userData.chimney.clone().multiplyScalar(1.2).add(h.position)), { color: 0xc8c4bc });
  for (const [x, z] of [[-19, 0.5], [-11, -2.5], [-19.5, -2.5], [-10.5, 5]]) add(mergeStatic(pine(1.3)), x, z);
  const kLbl = labelSprite('Кюстендил', { size: 0.42 }); kLbl.position.set(-15.2, 3.4, RZ - 1.2); scene.add(kLbl); stage.steadyLabel(kLbl, 16);
  const sLbl = labelSprite('Гара София', { size: 0.34 }); sLbl.position.set(-7.6, 2.8, RZ - 1.2); scene.add(sLbl); stage.steadyLabel(sLbl, 16);
  const TRAIN = new THREE.Group(); scene.add(TRAIN);
  const loco = locomotive(); loco.position.x = 1.5; TRAIN.add(loco);
  const wag1 = wagon({ color: 0x2f5a3a }); wag1.position.x = 0; TRAIN.add(wag1);
  const wag2 = wagon({ color: 0x2f5a3a }); wag2.position.x = -1.45; TRAIN.add(wag2);
  TRAIN.scale.setScalar(1.05);
  const TRAIN_K = -14.4, TRAIN_S = -7.4;
  const steam = smoke(stage, [new THREE.Vector3()], { color: 0xe8e8ea });
  // ---------- гората с партизаните (далеч вдясно) ----------
  const HILL = add(mergeStatic(forestHill({ rx: 4.5, rz: 3, h: 1.4, trees: 18, seed: 5 })), 15.5, -8.5, 0, 1);
  const CAMP = add(forestCamp(), 14.6, -7.0, -0.4, 1.3, 1.25); CAMP.userData.pickId = 'forest';
  HILL.userData.pickId = 'forest';
  const fireP = CAMP.userData.fire.clone().multiplyScalar(1.3).applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.4).add(CAMP.position);
  const smokeF = smoke(stage, [fireP.clone().add(new THREE.Vector3(0, 0.1, 0))], { color: 0xb8b4ac });
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 8), new THREE.MeshBasicMaterial({ color: 0xff9a30 })); fire.position.copy(fireP).add(new THREE.Vector3(0, 0.1, 0)); scene.add(fire);
  const partisans = [];
  for (const [dx, dz, ry] of [[-0.45, 0.2, 1.2], [0.4, 0.45, -1.8], [0.1, -0.5, 0.2]]) { const p = person43('partisan'); add(p, fireP.x + dx, fireP.z + dz, ry, 1.25, fireP.y - 0.08); partisans.push(p); }

  // ---------- маркери за балончетата ----------
  mark('kiosk', -2.6, 1.9, 0.8); mark('zzn', 3.0, 1.7, 0.6);
  mark('ns', NS.position.x, nsRaw.userData.top * S, NS.position.z);
  mark('gov', GOV.position.x, govRaw.userData.top * 1.4 + 0.2, GOV.position.z);
  mark('synod', SYN.position.x, 2.6, SYN.position.z);
  mark('street', 10.6, 3.0, -0.4);
  mark('kyust', -15.2, 2.6, RZ - 1.2);
  mark('forest', 15.0, 3.0, -7.4);
  const lowAnchor = new THREE.Object3D(); scene.add(lowAnchor);
  mark('outcome', -2.5, 2.4, 3.2);
  const LBL = { ns: 'Народно събрание', gov: 'Правителство', synod: 'Свети синод' };
  const worldLabels = [kLbl, sLbl];
  for (const [id, text] of Object.entries(LBL)) { const l = labelSprite(text, { size: 0.4 }); l.position.copy(named[id].position); l.position.y += 0.2; scene.add(l); stage.steadyLabel(l, 16); worldLabels.push(l); }

  // ---------- хора ----------
  const walkers = [];
  const kinds = ['man', 'woman', 'kid', 'man2', 'woman2', 'worker', 'woman', 'man'];
  kinds.forEach((k, i) => {
    const p = person43(k); add(p, 8.6 + (i % 2) * 0.5, -3.6 + i * 1.05, 0, 1.2);
    p.userData.base = p.position.clone(); p.userData.ph = i * 1.3; walkers.push(p);
  });
  const squarePeople = [];
  for (const [k, x, z] of [['man', -1, -1.5], ['woman', 1.2, -2.2], ['man2', -2.5, -3.2], ['woman2', 2.8, -1.4], ['worker', 0.3, 2.4], ['kid', -0.8, 2.8]]) {
    const p = person43(k); add(p, x, z, 0, 1.2); p.userData.base = p.position.clone(); p.userData.ph = x * 2; squarePeople.push(p);
  }
  const synPriest = person43('priest'); add(synPriest, SYN.position.x - 0.3, SYN.position.z + 1.6, -0.3, 1.25);
  const stLbl = labelSprite('Митрополит Стефан', { size: 0.26 }); stLbl.position.set(0, 1.0, 0); synPriest.add(stLbl); stage.steadyLabel(stLbl, 9); worldLabels.push(stLbl);
  // Пешев и депутатите.
  const PESHEV = person43('peshev'); const deputies = [PESHEV];
  for (let i = 0; i < 4; i++) deputies.push(person43('deputy'));
  const pLbl = labelSprite('Димитър Пешев', { size: 0.24 }); pLbl.position.set(0, 0.95, 0); PESHEV.add(pLbl); stage.steadyLabel(pLbl, 9); worldLabels.push(pLbl);
  const NS_FRONT = new THREE.Vector3(Math.sin(0.3) * 2.6, 0, Math.cos(0.3) * 2.6).add(NS.position);
  const GOV_FRONT = new THREE.Vector3(GOV.position.x, 0, GOV.position.z + 2.0);
  const SYN_FRONT = new THREE.Vector3(Math.sin(-0.3) * 2.3, 0, Math.cos(-0.3) * 2.3).add(SYN.position);
  const depHome = deputies.map((_, i) => new THREE.Vector3(NS_FRONT.x - 0.8 + i * 0.4, 0, NS_FRONT.z + (i % 2) * 0.3));
  deputies.forEach((p, i) => { add(p, depHome[i].x, depHome[i].z, 0, 1.2); });
  // Кюстендилци.
  const kyustPeople = ['man', 'man2', 'man', 'worker'].map((k, i) => { const p = person43(k); add(p, -16 + i * 0.4, RZ - 0.4, 0, 1.2); p.visible = false; return p; });
  // Семействата за стъпка 4.
  const families = [];
  for (const [k, sc] of [['man', false], ['woman', true], ['kid', false], ['man2', true], ['woman2', false], ['kid', false]]) {
    const p = person43(k); const b = bundle({ suitcase: sc }); b.position.set(0.12, 0.3, 0.05); p.add(b); p.visible = false; scene.add(p); p.scale.setScalar(1.2); families.push(p);
  }
  // Трамвай.
  const TRAM = add(tram(), 0, 6.8, 0, 1.25);

  // ---------- табло и подвижни предмети ----------
  const BMAT = boardMat();
  const BOARD = new THREE.Group(); scene.add(BOARD); BOARD.position.set(0, 0, 3.6); BOARD.visible = false;
  const bw = 6.4, bh = bw * 760 / 1280;
  const bp = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.06), [col(0x5a3d22), col(0x5a3d22), col(0x5a3d22), col(0x5a3d22), BMAT, col(0x5a3d22)]);
  bp.position.y = 0.5 + bh / 2; BOARD.add(bp);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), col(0x5a3d22)); leg.position.set(s * (bw / 2 - 0.3), 0.3, -0.02); BOARD.add(leg); }
  named.board = new THREE.Object3D(); named.board.position.set(0, 0.5 + bh + 0.05, 0); BOARD.add(named.board);
  named.boardNew = new THREE.Object3D(); named.boardNew.position.set(bw * 0.27, 0.5 + bh * 0.42, 0); BOARD.add(named.boardNew);
  named.boardOld = new THREE.Object3D(); named.boardOld.position.set(bw * 0.27, 0.5 + bh * 0.85, 0); BOARD.add(named.boardOld);
  const LISTS = sheet('lists'); LISTS.visible = false; scene.add(LISTS); LISTS.scale.setScalar(1.3);
  const ORDER = sheet('order'); ORDER.visible = false; scene.add(ORDER); ORDER.scale.setScalar(1.3);
  const XMARK = crossMark(); ORDER.add(XMARK); XMARK.position.z = 0.02; XMARK.visible = false;
  const LETTER = sheet('letter'); LETTER.visible = false; scene.add(LETTER); LETTER.scale.setScalar(1.3);
  const VP = labelSprite('Подпредседател', { size: 0.2, bg: 'rgba(255,244,214,0.95)' }); VP.position.set(0, 1.18, 0); PESHEV.add(VP); stage.steadyLabel(VP, 9); worldLabels.push(VP);
  const showBoard = (on) => { BOARD.visible = on; worldLabels.forEach((l) => { l.visible = !on; }); };

  // ---------- живот в сцената ----------
  let trainX = TRAIN_K, trainRoll = 0;
  const placeTrain = () => { TRAIN.position.set(trainX, 0.06, RZ); steam.group.position.copy(new THREE.Vector3(1.5 + 0.55, 1.05, 0).multiplyScalar(1.05).applyQuaternion(TRAIN.quaternion).add(TRAIN.position)); loco.userData.roll(trainRoll); };
  placeTrain();
  stage.tick((dt, t) => {
    flags.forEach((c, i) => { if (c) c.rotation.y = Math.sin(t * 2 + i) * 0.28; });
    clouds.forEach((c, i) => { c.position.x = ((c.userData.x0 ??= c.position.x) + t * (0.2 + i * 0.05) + 45) % 90 - 45; });
    const tx = ((t * 1.6) % 60) - 30;
    TRAM.position.x = tx;
    walkers.forEach((p) => {
      if (p.userData.frozen) return;
      const ph = t * 0.35 + p.userData.ph;
      const dz = Math.sin(ph) * 1.0;
      p.position.z = p.userData.base.z + dz; p.rotation.y = Math.cos(ph) > 0 ? 0 : Math.PI;
      step43(p, t * 7 + p.userData.ph);
    });
    squarePeople.forEach((p) => {
      const a = t * 0.25 + p.userData.ph;
      const nx = p.userData.base.x + Math.cos(a) * 0.7, nz = p.userData.base.z + Math.sin(a * 0.8) * 0.4;
      p.rotation.y = Math.atan2(nx - p.position.x, nz - p.position.z); p.position.x = nx; p.position.z = nz;
      step43(p, t * 7 + p.userData.ph);
    });
    partisans.forEach((p, i) => { p.rotation.y += Math.sin(t * 0.5 + i) * 0.002; });
    fire.scale.set(1 + Math.sin(t * 9) * 0.15, 1 + Math.sin(t * 7 + 1) * 0.25, 1 + Math.cos(t * 8) * 0.15);
    synPriest.rotation.y = -0.3 + Math.sin(t * 0.4) * 0.15;
    deputies.forEach((p, i) => { if (!p.userData.moving) p.rotation.y = 0.3 + Math.sin(t * 0.5 + i) * 0.25; });
  });

  // ---------- общи помощници ----------
  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 0.3, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let clickHandler = null, stopDrag = null, menu = null;
  const extra = [];
  const runs = new Set();
  function run(fn) { const off = stage.tick((dt, t) => { if (fn(dt, t)) { off(); runs.delete(off); } }); runs.add(off); return off; }
  const cancelRuns = () => { runs.forEach((o) => o()); runs.clear(); };
  const later = (sec, fn) => { let k = 0; run((dt) => { k += dt; if (k >= sec) { fn(); return true; } return false; }); };
  function fly(obj, to, dur, done, arc = 1) {
    const from = obj.position.clone(); let k = 0;
    run((dt) => {
      k = Math.min(1, k + dt / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      obj.position.lerpVectors(from, to, e); obj.position.y += Math.sin(Math.PI * e) * arc;
      if (k >= 1) { if (done) done(); return true; }
      return false;
    });
  }
  // Човек върви по точки със скорост sp.
  function walk(p, pts, sp = 1.2, done) {
    let i = 0; p.userData.moving = true;
    run((dt, t) => {
      const target = pts[i];
      const d = new THREE.Vector3(target.x - p.position.x, 0, target.z - p.position.z);
      const L = d.length();
      if (L < 0.05) { i++; if (i >= pts.length) { p.userData.moving = false; step43(p, 0, 0); if (done) done(); return true; } return false; }
      const s = Math.min(L, sp * dt);
      p.position.x += d.x / L * s; p.position.z += d.z / L * s;
      p.rotation.y = Math.atan2(d.x, d.z);
      step43(p, t * 9);
      return false;
    });
  }
  // Влакът отива до x; dir 1 — локомотивът напред по +x, −1 — по −x.
  function driveTrain(toX, dur, done) {
    const from = trainX; let k = 0;
    TRAIN.rotation.y = toX > from ? 0 : Math.PI;
    run((dt) => {
      k = Math.min(1, k + dt / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const nx = from + (toX - from) * e; trainRoll += Math.abs(nx - trainX); trainX = nx; placeTrain();
      if (k >= 1) { if (done) done(); return true; }
      return false;
    });
  }
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null));
  stage.onHover(() => {});
  const MAIN = [[-2.5, 11, 19], [-1.5, 1, -2.5]];
  const nextBtn = (label, fn) => { const c = shell.setControls(`<button class="btn primary">${label}</button>`); c.querySelector('button').addEventListener('click', fn); };
  const VIEWS = {
    kiosk: [[-1.6, 3.4, 6.6], [-2.6, 1.0, 0.8]],
    zzn: [[3.6, 3.2, 6.0], [3.0, 1.0, 0.6]],
    ns: [[-2.6, 4.6, 3.6], [-4.6, 1.2, -5.0]],
    gov: [[1.0, 4.4, -1.6], [1.0, 1.4, -8.6]],
    synod: [[4.2, 5.0, 2.8], [6.6, 1.6, -6.5]],
    street: [[5.0, 4.0, 2.2], [10.4, 1.2, -0.6]],
    kyust: [[-12.6, 4.4, 8.2], [-14.6, 1.0, 0.6]],
    forest: [[11.0, 5.5, -1.0], [14.8, 1.4, -7.4]],
  };
  const BOARD_VIEW = () => view([0, 0.5 + bh * 0.85 + 0.4, 3.6 + 8.6], [0, 0.5 + bh * 0.85, 3.6], 1, narrow ? 1.05 : 1);

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    view(...MAIN);
    shell.task('София и Кюстендил, март 1943 г. България е съюзник на Германия. Разгледай всичко от менюто или кликни в сцената.');
    shell.setControls('');
    shell.score(`Разгледани: 0 от ${SPOTS.length}`);
    const seen = new Set();
    const open = (id) => {
      const s = SPOTS.find((x) => x.id === id);
      if (!s) return;
      const [vp, vt] = VIEWS[id], up = narrow ? 1.0 : 0;
      view([vp[0], vp[1] + up, vp[2]], [vt[0], vt[1] + up, vt[2]], 1, Math.min(far, 1.6));
      const a = named[id];
      if (narrow) { lowAnchor.position.copy(a.position); lowAnchor.position.y = Math.min(a.position.y, 1.0); }
      say(narrow ? lowAnchor : a, s.note, { cls: 'wide', lift: 0.2 });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${SPOTS.length}`);
      if (seen.size === SPOTS.length) nextBtn('Напред →', () => { menu.show(false); clearTip(); step2(); });
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: SPOTS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })), onSelect: open });
    clickHandler = open;
  }

  // ---------- 2. Веригата ----------
  const placed = [];
  let OLD = ['Живеят в страната, но законът ги ограничава', '#4a7ab0'];
  let NEU = ['Живеят в земите под българско управление', '#4a7ab0'];
  const redraw = () => drawBoard(BMAT, placed, OLD, NEU);
  redraw();
  let mistakes2 = 0;
  function step2() {
    shell.step(1);
    shell.score('');
    clickHandler = null;
    mistakes2 = 0;
    placed.length = 0;
    showBoard(true);
    redraw();
    BOARD_VIEW();
    say(named.board, 'Тук ще проследиш веригата: <b>решение → реакция → последица</b>. Вдясно виж как се променя съдбата на хората.', { cls: 'wide', lift: 0.2 });
    ask();
  }
  function ask() {
    const k = placed.length;
    const right = CHAIN[k];
    const laterEv = CHAIN.slice(k + 1);
    const pool = [right];
    if (laterEv.length) pool.push(laterEv[(k * 2) % laterEv.length]);
    pool.push(DISTRACT[k % 2]);
    // Подредба, която не е винаги една и съща, но е предвидима.
    const order = [[0, 1, 2], [1, 0, 2], [2, 1, 0], [1, 2, 0], [0, 2, 1], [2, 0, 1]][k].filter((i) => i < pool.length);
    const opts = order.map((i) => pool[i]);
    shell.task(k === 0 ? 'Началото на 1943 г. <b>Какво решава властта?</b> Избери първото звено на веригата.' : `<b>Какво следва?</b> Избери следващото звено (${k + 1} от ${CHAIN.length}).`);
    shell.score(`Звена: ${k} от ${CHAIN.length}`);
    let wrongHere = 0;
    const c = shell.setControls(`<div style="display:flex;flex-direction:column;gap:8px">${opts.map((o) => `<button class="btn" data-id="${o.id}">${esc(o.label)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.id;
      if (id !== right.id) {
        mistakes2++; wrongHere++; b.disabled = true;
        const d = DISTRACT.find((x) => x.id === id);
        shell.msg((d ? d.why : LATE) + (wrongHere >= 2 || mistakes2 >= 2 ? ' ' + HINT[right.id] : ''), 'bad');
        return;
      }
      shell.msg('Вярно!', 'good');
      shell.setControls('');
      placed.push(id);
      play(right);
    }));
  }
  // Последицата от всяко звено в сцената.
  function play(e) {
    clearTip();
    shell.task(`Виж какво става: <b>${esc(e.label)}</b>.`);
    shell.score(`Звена: ${placed.length} от ${CHAIN.length}`);
    const done = (html, anchor, cls = 'wide') => {
      if (e.old) OLD = e.old;
      if (e.neu) NEU = e.neu;
      redraw();
      say(anchor, `<b>${esc(e.when)}: ${esc(e.label)}</b><br>${html}`, { cls, lift: 0.2 });
      nextBtn(placed.length < CHAIN.length ? 'Към веригата →' : 'Виж цялата верига →', () => {
        clearTip();
        showBoard(true); BOARD_VIEW();
        if (placed.length < CHAIN.length) ask(); else finish2();
      });
    };
    if (e.id === 'deal') {
      showBoard(false);
      view(...VIEWS.gov, 1, Math.min(far, 1.6));
      LISTS.visible = true; LISTS.position.set(GOV_FRONT.x, 3.2, GOV_FRONT.z - 0.4);
      fly(LISTS, new THREE.Vector3(GOV_FRONT.x + 0.8, 1.3, GOV_FRONT.z), 1.2, () => done(e.text, LISTS), 0.4);
    } else if (e.id === 'arrest') {
      showBoard(true); BOARD_VIEW();
      later(0.5, () => done(`${e.text}<br><span class="small">Сцената не показва депортирането. Таблото отбелязва какво се случва.</span>`, named.board));
    } else if (e.id === 'kyust') {
      showBoard(false);
      view([-11.5, 5.0, 10.5], [-11.5, 1.0, RZ], 1, Math.min(far, 1.7));
      kyustPeople.forEach((p, i) => { p.visible = true; p.position.set(-16 + i * 0.4, 0, RZ - 0.6); });
      later(0.6, () => kyustPeople.forEach((p, i) => walk(p, [new THREE.Vector3(TRAIN_K - 0.2 + i * 0.15, 0, RZ - 0.6)], 1.2, () => { p.visible = false; })));
      later(2.2, () => driveTrain(TRAIN_S, 3.2, () => {
        kyustPeople.forEach((p, i) => { p.visible = true; p.position.set(TRAIN_S - 0.4 + i * 0.4, 0, RZ - 0.6); });
        kyustPeople.forEach((p, i) => walk(p, [new THREE.Vector3(-6, 0, 1.0), new THREE.Vector3(NS_FRONT.x - 1.4 + i * 0.35, 0, NS_FRONT.z + 1.0)], 1.6));
        done(e.text, kyustPeople[0]);
      }));
    } else if (e.id === 'deputies') {
      showBoard(false);
      view([-1.0, 6.5, 4.5], [-1.6, 1.0, -6.0], 1, Math.min(far, 1.6));
      deputies.forEach((p, i) => walk(p, [new THREE.Vector3(-1.5 + i * 0.1, 0, -4.2 + i * 0.25), new THREE.Vector3(GOV_FRONT.x - 0.9 + i * 0.4, 0, GOV_FRONT.z + 0.2 + (i % 2) * 0.3)], 1.3));
      later(3.8, () => done(e.text, named.gov));
    } else if (e.id === 'cancel') {
      showBoard(false);
      view(...VIEWS.gov, 1, Math.min(far, 1.6));
      LISTS.visible = false;
      ORDER.visible = true; ORDER.position.set(GOV_FRONT.x + 0.8, 1.4, GOV_FRONT.z); ORDER.rotation.set(0, 0, 0);
      XMARK.visible = false;
      later(1.0, () => { XMARK.visible = true; done(`${e.text}<br><span class="small">Заповедта и кръстът са знак за сцената.</span>`, ORDER, 'good wide'); });
    } else if (e.id === 'letter') {
      showBoard(false);
      ORDER.visible = false;
      deputies.forEach((p, i) => { p.position.set(depHome[i].x, 0, depHome[i].z); });
      kyustPeople.forEach((p) => { p.visible = false; });
      view([0.5, 6.5, 6.0], [0.5, 1.0, -6.0], 1, Math.min(far, 1.6));
      LETTER.visible = true; LETTER.position.set(NS_FRONT.x, 1.3, NS_FRONT.z);
      fly(LETTER, new THREE.Vector3(GOV_FRONT.x - 0.6, 1.4, GOV_FRONT.z), 2.0, () => {
        walk(synPriest, [new THREE.Vector3(SYN_FRONT.x - 0.4, 0, SYN_FRONT.z + 0.6)], 0.8);
        done(e.text, LETTER, 'good wide');
      }, 1.4);
    }
  }
  function finish2() {
    scores.push(stepScore(mistakes2, 3));
    shell.score(`Звена: ${CHAIN.length} от ${CHAIN.length}`);
    shell.task('Това е веригата от март 1943 г.');
    say(named.board, '<b>Всяка реакция променя следващото решение.</b> Кюстендилци събуждат депутата, депутатите натискат министъра, заповедта е отменена, а писмото и Синодът пречат тя да бъде подновена. За евреите от новите земи помощ не идва навреме.', { cls: 'good wide', lift: 0.2 });
    nextBtn('Напред →', () => { clearTip(); step3(); });
  }

  // ---------- 3. Приложи ----------
  const zoneObjs = [];
  function step3() {
    shell.step(2);
    shell.score('');
    showBoard(false);
    LETTER.visible = false;
    synPriest.position.set(SYN.position.x - 0.3, 0, SYN.position.z + 1.6);
    const Z0 = new THREE.Vector3(0, 0, 3.6);
    view([0, 6.4, 11.2], [0, 0, 2.8], 1, narrow ? Math.min(far, 1.5) : far);
    if (!zoneObjs.length) ZONES.forEach((z) => {
      const r = zoneRing(z.color, 1.15); r.position.set(Z0.x + z.dx, 0.03, Z0.z + z.dz); r.userData.zoneId = z.id;
      const l = labelSprite(z.label, { size: 0.3, color: '#ffffff', bg: z.css, border: z.css }); l.position.set(0, 0.35, -1.25); r.add(l);
      scene.add(r); zoneObjs.push(r);
    });
    zoneObjs.forEach((r) => { r.visible = true; });
    let mistakes = 0, i = 0, wrongHere = 0;
    const done = [];
    const spawn = () => {
      const c = CARDS[i];
      const g = new THREE.Group();
      const w = Math.max(1.6, c.label.length * 0.075 + 0.3);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.5), col(0xfff4d6)); g.add(b);
      const e = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.04, 0.55), col(0x9a6a40)); e.position.y = -0.02; g.add(e);
      const l = labelSprite(c.label, { size: 0.24 }); l.position.y = 0.3; g.add(l);
      g.userData.dragId = c.id;
      addHitBox(g, 0.7);
      g.position.set(0, 0.12, 1.6); g.userData.home = g.position.clone();
      scene.add(g); extra.push(g);
      wrongHere = 0;
      shell.score(`Подредени: ${i} от ${CARDS.length}`);
      return g;
    };
    shell.task('Срещу прогерманската политика едни протестират открито, други — тайно. А някои неща са дело на самата власт. <b>Завлечи картата в правилния кръг.</b>');
    shell.setControls('');
    spawn();
    stopDrag = stage.enableDrag({
      planeY: 0.12,
      onDrop(obj) {
        const c = CARDS.find((x) => x.id === obj.userData.dragId);
        const zone = zoneObjs.find((r) => Math.hypot(obj.position.x - r.position.x, obj.position.z - r.position.z) < 1.2);
        if (!zone) { obj.position.copy(obj.userData.home); return; }
        if (zone.userData.zoneId !== c.zone) {
          mistakes++; wrongHere++;
          obj.position.copy(obj.userData.home);
          shell.msg(`Не е тук. ${CARD_WRONG[c.zone]}` + (wrongHere >= 2 ? CARD_HINT[c.zone] : ''), 'bad');
          return;
        }
        obj.userData.locked = true;
        const n = done.filter((d) => d === zone.userData.zoneId).length;
        done.push(zone.userData.zoneId);
        obj.position.set(zone.position.x + ((n % 2) - 0.5) * 0.25, 0.12 + n * 0.07, zone.position.z + 0.15 - n * 0.12);
        obj.scale.setScalar(0.7);
        shell.msg(c.ok, 'good');
        i++;
        if (i < CARDS.length) { spawn(); return; }
        stopDrag(); stopDrag = null;
        shell.score(`Подредени: ${i} от ${CARDS.length}`);
        scores.push(stepScore(mistakes, 3));
        say(zoneObjs[1], '<b>Гражданско поведение</b> е, когато обикновени хора, депутати и духовници открито защитават правата на своите съграждани — дори когато рискуват. Така са спасени евреите от старите предели.', { cls: 'good wide', lift: 1.5 });
        nextBtn('Напред →', () => { clearTip(); step4(); });
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    shell.score('');
    zoneObjs.forEach((r) => { r.visible = false; });
    for (const o of extra) if (o.userData.dragId) o.visible = false;
    let mistakes = 0;
    view(...VIEWS.street, 1, Math.min(far, 1.6));
    shell.task('Март 1943 г. отмина. Германските служби продължават да настояват. <b>Какво ще стане с евреите от старите предели?</b>');
    askQ(Q1, () => {
      view([-0.5, 7.5, 13.0], [0.5, 0.8, 2.0], 1, Math.min(far, 1.5));
      // Семействата тръгват от улицата към гарата и влака.
      trainX = TRAIN_S; TRAIN.rotation.y = 0; placeTrain();
      families.forEach((p, i) => {
        p.visible = true; p.position.set(8.4, 0, 0.2 + i * 0.6);
        later(i * 0.35, () => walk(p, [new THREE.Vector3(7.5, 0, 4.4), new THREE.Vector3(-5.5, 0, 4.0 + (i % 2) * 0.3), new THREE.Vector3(TRAIN_S - 0.6 + i * 0.25, 0, RZ - 0.6)], 2.4, () => { p.visible = false; }));
      });
      later(8.2, () => driveTrain(TRAIN_K - 3, 3.5));
      say(named.outcome, '<b>Така става.</b> През май 1943 г. правителството решава евреите от София да бъдат изселени в провинциални градове. Те напускат домовете си, а много мъже работят в трудови групи. Но не са депортирани извън страната. Около 48 000 евреи от старите предели оцеляват. Над 11 000 евреи от Беломорието, Вардарска Македония и Пирот не са спасени.<br><span class="small">Хората и влакът са възстановка.</span>', { cls: 'good wide', lift: 0.2 });
      later(1.0, () => nextBtn('Напред →', () => { clearTip(); predict2(); }));
    });
    function predict2() {
      view(...VIEWS.ns, 1, Math.min(far, 1.6));
      shell.task('Димитър Пешев е от управляващото мнозинство, а писмото му е против решението на правителството. <b>Какво става с него?</b>');
      askQ(Q2, () => {
        let k = 0;
        run((dt) => { k = Math.min(1, k + dt); VP.material.opacity = 1 - k; return k >= 1; });
        say(named.ns, '<b>Да.</b> Пешев е свален от поста подпредседател на Народното събрание. Той знае, че рискува, и все пак пише писмото и го подписва. Да постъпиш правилно, когато това ти струва нещо — това е гражданска смелост.', { cls: 'good wide', lift: 0.4 });
        const c = shell.setControls('<button class="btn primary">Виж резултата</button>');
        c.querySelector('button').addEventListener('click', () => {
          clearTip();
          scores.push(stepScore(mistakes, 2));
          shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart);
        });
      });
    }
    function askQ(list, onRight) {
      const c = shell.setControls(`<div style="display:flex;flex-direction:column;gap:8px">${list.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
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
    cancelRuns();
    clearTip();
    for (const o of extra) scene.remove(o);
    extra.length = 0;
    zoneObjs.forEach((r) => { r.visible = false; });
    showBoard(false);
    LISTS.visible = false; ORDER.visible = false; LETTER.visible = false; XMARK.visible = false;
    OLD = ['Живеят в страната, но законът ги ограничава', '#4a7ab0'];
    NEU = ['Живеят в земите под българско управление', '#4a7ab0'];
    placed.length = 0; redraw();
    VP.material.opacity = 1;
    deputies.forEach((p, i) => { p.position.set(depHome[i].x, 0, depHome[i].z); p.userData.moving = false; });
    kyustPeople.forEach((p) => { p.visible = false; });
    families.forEach((p) => { p.visible = false; });
    synPriest.position.set(SYN.position.x - 0.3, 0, SYN.position.z + 1.6);
    trainX = TRAIN_K; TRAIN.rotation.y = 0; placeTrain();
    clickHandler = null;
    if (menu) menu.remove();
    step1();
  }

  step1();
  // За тестовете.
  const at = (name) => {
    const o = name.startsWith('z-') ? zoneObjs.find((r) => r.userData.zoneId === name) : name === 'card' ? extra.filter((e) => e.userData.dragId && !e.userData.locked).pop() : named[name];
    const v = o.getWorldPosition(new THREE.Vector3()).project(stage.camera);
    const r = stage.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  };
  container.__demo = { stage, at, cards: CARDS, chain: CHAIN.map((e) => e.id), q1: Q1.findIndex((q) => q.ok), q2: Q2.findIndex((q) => q.ok) };
  return {
    dispose() {
      if (stopDrag) stopDrag(); cancelRuns(); if (menu) menu.remove();
      smokeA.dispose(); smokeK.dispose(); smokeF.dispose(); steam.dispose();
      stage.dispose();
    },
  };
}
