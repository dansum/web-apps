// 6.2.4 „Средновековният град“ — Търновград, столицата на Второто българско царство.
// Стъпки: опознай (отгоре или с разходка по улиците) → защо градът расте (опит) → находка и място (извори) → предскажи: търговията.
import { createStage, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { buildTarnovgrad } from './hist/tarnovo.js';
import { createWalk, createMiniMap } from './hist/walk.js';

const SPOTS = [
  { id: 'gate', label: 'Главната порта', icon: '🚪',
    note: 'В крепостта Царевец се влиза от запад, по тесен скален провлак. Пътят минава по подвижен мост и през няколко порти. Така столицата е трудна за превземане.' },
  { id: 'palace', label: 'Царският дворец', icon: '👑',
    note: 'Дворецът на българските царе е малка крепост в крепостта: със собствени стени, тронна зала и църква. Оттук се управлява царството.' },
  { id: 'patriarchate', label: 'Патриаршията', icon: '⛪',
    note: 'На върха на хълма е Патриаршията с църквата „Възнесение Господне“. От 1235 г. начело на Българската църква отново стои патриарх.' },
  { id: 'baldwin', label: 'Балдуиновата кула', icon: '🗼',
    note: 'Според преданието в тази кула е затворен латинският император Балдуин. Цар Калоян го пленява в битката при Одрин през 1205 г.' },
  { id: 'market', label: 'Пазарът', icon: '⚖️',
    note: 'На пазара се срещат селяни, занаятчии и търговци. Тук идват и търговци от Дубровник, Венеция и Генуа.' },
  { id: 'smithy', label: 'Ковачницата', icon: '🔨',
    note: 'Ковачът нагрява желязото в огнището и го кове върху наковалнята. Прави сечива, подкови и оръжие.' },
  { id: 'pottery', label: 'Грънчарската работилница', icon: '🏺',
    note: 'Търновските грънчари са прочути със сграфито керамиката: съдове с врязана украса и цветна глазура.' },
  { id: 'church40', label: 'Църквата „Св. Четиридесет мъченици“', icon: '✝️',
    note: 'Цар Иван Асен II построява църквата след победата при Клокотница през 1230 г. Колоната с неговия надпис е вътре в църквата; тук е показана отвън, за да я видиш.' },
  { id: 'royals', label: 'Царят и царицата', icon: '🗣️',
    note: 'Цар Иван Асен II и царица Анна те приемат пред тронната зала. Попитай ги за града и за царството.' },
];
// Разговор с царя и царицата: 10 готови въпроса. Отговорите са съчинени от нас по исторически извори; годината е 1236.
const TALK = {
  tsar: { name: 'Цар Иван Асен II', icon: '👑', qs: [
    ['Кой си ти?', 'Аз съм Иван Асен, цар на българите. Син съм на стария цар Асен. Управлявам от 1218 година.'],
    ['Защо Търновград е столица?', 'Тук баща ми Асен и чичо ми Петър вдигат въстанието през 1185 година и България отново става свободна. Хълмът е заобиколен от река Янтра и от високи скали. Той е крепост, направена от самата природа.'],
    ['Колко голяма е държавата ти?', 'След победата при Клокотница моите земи стигат до три морета: Черно, Бяло и Адриатическо.'],
    ['Какво се случи при Клокотница?', 'През 1230 година епирският владетел Теодор Комнин наруши мирния договор и нападна България. Заповядах да носят договора на копие като знаме. Победихме и го плених, а обикновените му войници пуснах да си идат по домовете.'],
    ['Защо даде грамота на търговците от Дубровник?', 'Търговците носят стоки и купуват това, което правят нашите занаятчии. Затова им позволих да пътуват и да търгуват свободно в цялото царство. Така богатее и градът, и държавата.'],
    ['Как управляваш царството?', 'Съветвам се с болярите. Издавам грамоти и сека монети с моя образ. Грижа се за крепостите, за пътищата и за мира със съседите.'],
  ] },
  tsaritsa: { name: 'Царица Анна', icon: '👸', qs: [
    ['Коя си ти?', 'Аз съм Анна, царицата. Дъщеря съм на унгарския крал Андрей II. Нашият брак скрепи мира между България и Унгария.'],
    ['Как се живее в двореца?', 'Дворецът е крепост вътре в крепостта, със собствени стени. В тронната зала с мрамор и мозайки царят приема боляри и пратеници от други страни. Имаме и своя църква.'],
    ['Какво значи Патриаршията за града?', 'От 1235 година начело на Българската църква отново стои патриарх. Той живее тук, на върха на хълма. Така Търновград е столица и на царството, и на Църквата. В манастирите край града се преписват книги.'],
    ['Кои хора живеят в Търновград?', 'На хълма са царят, болярите и духовниците. В долния град живеят занаятчии и търговци, идват и чужденци. Селяните от околността носят храна на пазара.'],
  ] },
};
const TALK_N = TALK.tsar.qs.length + TALK.tsaritsa.qs.length;

const CAUSES = [
  { label: '🌾 Храна от селата', at: [-160, 19, 14], msg: 'Селата дават повече храна. Затова част от хората вече могат да живеят в града.' },
  { label: '🔨 Занаяти', at: [-140, 20, -28], msg: 'Занаятчиите отварят работилници. Те правят сечива, съдове и дрехи за продан.' },
  { label: '⚖️ Търговия', at: [-142, 21, 8], msg: 'Търговците купуват изделията и носят стоки отдалеч. Пазарът се оживява.' },
];
const WRONG2 = {
  walls: 'Стените пазят града, но без порта никой не може да влезе: нито храна, нито стоки.',
  ban: 'Без търговци занаятчиите няма на кого да продават, а в града идват по-малко стоки.',
};
const FINDS = [
  { t: 'железни подкови и ковашки клещи', target: 'smithy', ok: 'Точно така. Подковите и клещите показват, че тук е работил ковач.', hint: 'Подсказка: потърси огнище и наковалня на занаятчийската улица.' },
  { t: 'паница със сграфито украса', target: 'pottery', ok: 'Да. Съдовете с врязана украса са правени от грънчар.', hint: 'Подсказка: потърси грънчарско колело и пещ.' },
  { t: 'везни и теглилки', target: 'market', ok: 'Вярно. С везните търговците мерят стоката на пазара.', hint: 'Подсказка: къде се купува и продава?' },
  { t: 'каменна колона с надпис на цар Иван Асен II', target: 'church40', ok: 'Да. Надписът разказва за победата при Клокотница.', hint: 'Подсказка: колоната е в църква край реката.' },
  { t: 'мраморни плочи и мозайка от тронна зала', target: 'palace', ok: 'Вярно. Тронната зала е в царския дворец.', hint: 'Подсказка: къде живее и управлява царят?' },
];
const PREDICT = [
  { t: 'Ще дойдат повече търговци и стоки и градът ще забогатее.', ok: true },
  { t: 'Пазарът ще опустее.', ok: false, why: 'Грамотата улеснява търговците, а не им пречи.' },
  { t: 'Занаятчиите ще затворят работилниците.', ok: false, why: 'Повече търговци купуват повече изделия. Занаятчиите имат повече работа.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай', 'Защо градът расте?', 'Находка и място', 'Предскажи'] });
  container.querySelector('.scene-hint').textContent = 'Отгоре: върти и приближавай сцената. Разходка: върви със стрелките или бутоните, оглеждай се с влачене, докосни улицата, за да отидеш там.';
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const weak = (navigator.hardwareConcurrency || 4) <= 2;
  const HOME = [[-62, 16, 0], [-30, 150, 235]];
  const stage = createStage(shell.stageEl, {
    background: 0xdfe9ee, camPos: [HOME[0][0] - 120, HOME[0][1] + 260 * far, HOME[0][2] + 330 * far], target: HOME[0],
    minDistance: 0.5, maxDistance: 480, shadows: !weak, fog: { color: 0xdfe9ee, near: 320, far: 1500 },
  });
  const { scene, camera, controls, renderer } = stage;
  renderer.setPixelRatio(weak ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  camera.near = 0.3; camera.far = 3200; camera.updateProjectionMatrix();
  const TOP_LIMITS = { min: 45, max: 480, polar: Math.PI * 0.47 };
  const setTopLimits = () => { controls.minDistance = TOP_LIMITS.min; controls.maxDistance = TOP_LIMITS.max; controls.maxPolarAngle = TOP_LIMITS.polar; };
  stage.hemi.color.setHex(0xcfe2ff); stage.hemi.groundColor.setHex(0x9a8f70); stage.hemi.intensity = 1.25;
  stage.sun.color.setHex(0xfff0d8); stage.sun.intensity = 3.3;
  scene.add(stage.sun.target);
  const sunDir = new THREE.Vector3(0.45, 0.72, 0.52).normalize();
  // Сянката покрива целия град отгоре, а при разходка — само околността, за да е остра.
  function fitShadow(cx, cz, half) {
    stage.sun.target.position.set(cx, 15, cz);
    stage.sun.position.copy(stage.sun.target.position).addScaledVector(sunDir, 320);
    if (weak) return;
    const sc = stage.sun.shadow.camera;
    sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 20; sc.far = 700;
    sc.updateProjectionMatrix();
  }
  if (!weak) { stage.sun.shadow.mapSize.set(2048, 2048); stage.sun.shadow.bias = -0.0004; stage.sun.shadow.normalBias = 0.25; }
  fitShadow(-40, -5, 185);

  const world = buildTarnovgrad(stage, { weak });
  const places = world.places;
  const walk = createWalk(stage, { ground: world.walkY, canStand: world.canStand, obstacles: world.obstacles, terrain: [world.terrain], start: { x: -124, z: 8, yaw: Math.PI / 2 } });
  const map = createMiniMap(stage, { bounds: world.mapBounds, paint: world.paintMap });

  // Знак над местата, които чакат да бъдат разгледани.
  const mc = document.createElement('canvas'); mc.width = mc.height = 64;
  { const g = mc.getContext('2d'); g.translate(32, 32); g.rotate(Math.PI / 4); g.fillStyle = '#f6b827'; g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.rect(-15, -15, 30, 30); g.stroke(); g.fill(); }
  const markTex = new THREE.CanvasTexture(mc); markTex.colorSpace = THREE.SRGBColorSpace;
  for (const p of places.values()) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex, depthTest: false, transparent: true }));
    sp.position.set(p.x, p.y + p.top + 3, p.z); sp.scale.setScalar(6); sp.renderOrder = 9; sp.raycast = () => {};
    scene.add(sp); stage.steadyLabel(sp, 160);
    p.marker = sp; p.wanted = false; p.done = false;
  }

  // Превключвател „Отгоре / Разходка“.
  const toggle = document.createElement('div');
  toggle.className = 'mode-toggle';
  toggle.innerHTML = '<button data-m="top" class="on">🦅 Отгоре</button><button data-m="walk">🚶 Разходка</button>';
  shell.stageEl.appendChild(toggle);
  ['pointerdown', 'touchstart'].forEach((n) => toggle.addEventListener(n, (e) => e.stopPropagation(), { passive: true }));
  let mode = 'top', modeTimer = null, fovTo = 45;
  const look = (tgt, off, dur = 1.2) => stage.flyTo([tgt[0] + off[0] * far, tgt[1] + off[1] * far, tgt[2] + off[2] * far], tgt, dur);
  function setMode(m, { view = HOME } = {}) {
    if (m === mode) return;
    mode = m;
    clearTimeout(modeTimer);
    toggle.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
    map.show(m === 'walk');
    fovTo = m === 'walk' ? 66 : 45; // при разходка се гледа по-широко, както с очи
    // Менюто се свива при разходка, за да не закрива улицата.
    if (menu) { const open = !menu.el.querySelector('.cm-list').hidden; if (open === (m === 'walk')) menu.el.querySelector('.cm-head').click(); }
    if (m === 'walk') {
      // Камерата слиза до очите на детето и чак тогава започва разходката.
      controls.minDistance = 0.5; controls.maxPolarAngle = Math.PI;
      const s = walk.state, y = world.walkY(s.x, s.z) + 1.65;
      stage.flyTo([s.x, y, s.z], [s.x + Math.sin(s.yaw), y - 0.05, s.z - Math.cos(s.yaw)], 1.5);
      modeTimer = setTimeout(() => walk.enable(), 1550);
    } else {
      walk.disable();
      controls.minDistance = 0.5; controls.maxPolarAngle = TOP_LIMITS.polar;
      look(view[0], view[1], 1.5);
      modeTimer = setTimeout(setTopLimits, 1600);
      fitShadow(-40, -5, 185);
    }
  }
  toggle.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });

  let hovered = null, selected = null, clickHandler = null;
  stage.tick((dt, t) => {
    world.tick(dt, t);
    if (Math.abs(camera.fov - fovTo) > 0.05) { camera.fov += (fovTo - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
    if (walk.active) { const s = walk.state; fitShadow(Math.round(s.x / 4) * 4, Math.round(s.z / 4) * 4, 60); map.draw(s, [...places.values()].filter((p) => p.wanted || p.done).map((p) => ({ x: p.x, z: p.z, done: p.done }))); }
    for (const p of places.values()) {
      const want = p.id === hovered || p.id === selected ? 1 : p.wanted ? 0.3 + 0.3 * Math.sin(t * 2.4) : 0;
      p.glow += (want - p.glow) * Math.min(1, dt * 8);
      p.marker.visible = p.wanted && p.group.visible;
      p.marker.position.y = p.y + p.top + 3 + Math.sin(t * 2 + p.x) * 0.5;
    }
  });
  stage.onHover((r) => { hovered = r && clickHandler ? r.userData.pickId : null; if (!clickHandler) renderer.domElement.style.cursor = ''; });
  stage.onClick((hit, ev) => {
    if (hit && clickHandler) {
      const p = places.get(hit.root.userData.pickId);
      // При разходка щракването върху настилката на площад значи „отиди там“.
      if (walk.active && hit.point.y < p.y + 0.5 && world.canStand(hit.point.x, hit.point.z)) { walk.walkTo(hit.point.x, hit.point.z); return; }
      if (p.id === 'royals' && talkEl) return; // разговорът вече е отворен
      clickHandler(p.id);
    } else if (walk.active) walk.walkToEvent(ev);
  });

  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, opts); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  // Показва място: отгоре — полет на камерата; при разходка — детето отива дотам с бързо ходене по улиците.
  function showPlace(id) {
    const p = places.get(id), s = p.site;
    selected = id;
    if (mode === 'walk') {
      clearTimeout(modeTimer); walk.enable(); // ако камерата още слиза към улицата, разходката започва веднага
      walk.follow(world.route([walk.state.x, walk.state.z], s.stand), p.x, p.z, s.pitch ?? -0.14);
    }
    else look(s.top[0], s.top[1]);
    return p;
  }
  // ---- Разговор с царя и царицата ----
  const royals = places.get('royals');
  const asked = new Set();
  let talkEl = null, talkTip = null, talkWho = 'tsar';
  function closeTalk() {
    if (talkTip) { talkTip.remove(); talkTip = null; }
    if (talkEl) { talkEl.remove(); talkEl = null; }
    royals.group.userData.speak(null);
    shell.stageEl.classList.remove('talking');
  }
  function drawTalk() {
    const T = TALK[talkWho];
    talkEl.innerHTML = `<div class="talk-head"><div class="talk-tabs">${Object.keys(TALK).map((w) => `<button data-who="${w}" class="${w === talkWho ? 'on' : ''}">${TALK[w].icon} ${esc(TALK[w].name)}</button>`).join('')}</div><button class="talk-x" aria-label="Затвори разговора">✕</button></div>
      <div class="talk-qs">${T.qs.map(([q], i) => `<button class="talk-q ${asked.has(talkWho + i) ? 'done' : ''}" data-i="${i}">${esc(q)}${asked.has(talkWho + i) ? ' <span>✓</span>' : ''}</button>`).join('')}</div>
      <div class="talk-foot">Зададени въпроси: <b>${asked.size} от ${TALK_N}</b>. Отговорите са съчинени от нас по исторически извори. Годината е 1236.</div>`;
    talkEl.querySelector('.talk-x').addEventListener('click', closeTalk);
    talkEl.querySelectorAll('.talk-tabs button').forEach((b) => b.addEventListener('click', () => { talkWho = b.dataset.who; drawTalk(); }));
    talkEl.querySelectorAll('.talk-q').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      asked.add(talkWho + i);
      clearTip();
      if (talkTip) talkTip.remove();
      talkTip = stage.bubble(royals.group.userData[talkWho], `<b>${esc(T.name)}:</b> ${esc(T.qs[i][1])}`, { cls: 'wide', lift: 2.25 });
      royals.group.userData.speak(talkWho);
      drawTalk();
    }));
  }
  function openTalk() {
    if (talkEl) return;
    talkEl = document.createElement('div');
    talkEl.className = 'talk';
    ['pointerdown', 'wheel', 'touchstart'].forEach((n) => talkEl.addEventListener(n, (e) => e.stopPropagation(), { passive: true }));
    shell.stageEl.appendChild(talkEl);
    shell.stageEl.classList.add('talking');
    drawTalk();
  }
  // Ако детето се отдалечи, разговорът свършва.
  stage.tick(() => { if (talkEl && walk.active && !walk.state.auto && Math.hypot(walk.state.x - royals.x, walk.state.z - royals.z) > 16) closeTalk(); });

  const scores = [];
  let menu = null, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const allowWalk = (on) => { toggle.hidden = !on; if (!on) setMode('top'); };

  function step1() {
    shell.step(0);
    scores.length = 0;
    allowWalk(true);
    shell.task('Това е Търновград, столицата на Второто българско царство. Разгледай го отгоре или се разходи по улиците. Избери място от менюто или щракни върху него.');
    const seen = new Set();
    for (const p of places.values()) { p.wanted = true; p.done = false; }
    const open = (id) => {
      const s = SPOTS.find((x) => x.id === id);
      const p = showPlace(id);
      if (id === 'royals') { clearTip(); openTalk(); talkTip = talkTip || stage.bubble(p.group, esc(s.note), { cls: 'wide', lift: p.top + 0.4 }); }
      else { closeTalk(); say(p.group, `<b>${esc(s.label)}</b><br>${esc(s.note)}`, { cls: 'wide', lift: p.top + 1.5 }); }
      seen.add(id); p.wanted = false; p.done = true;
      menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${SPOTS.length}`);
      if (seen.size === SPOTS.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); closeTalk(); selected = null; step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: SPOTS.map((s) => ({ id: s.id, label: s.label, icon: s.icon })), onSelect: open });
    clickHandler = open;
    shell.setControls('');
  }

  function step2() {
    shell.step(1);
    shell.score('');
    clickHandler = null; hovered = null;
    for (const p of places.values()) { p.wanted = false; p.done = false; }
    allowWalk(false);
    look([-142, 14, -18], [34, 92, 118], 1.5);
    for (let i = 0; i < 3; i++) world.setGrowth(i, false);
    let mistakes = 0, phase = 'predict';
    shell.task('Отначало под крепостта има само път. Царят иска столицата да стане голяма и богата. <b>Кое ще помогне на града да порасне?</b>');
    const c = shell.setControls(`<div class="col"><button class="btn" data-a="walls">Високи стени без нито една порта</button><button class="btn" data-a="ok">Повече храна от селата, занаяти и търговия</button><button class="btn" data-a="ban">Забрана за чуждите търговци</button></div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (phase !== 'predict') return;
      if (b.dataset.a !== 'ok') { mistakes++; b.disabled = true; shell.msg(WRONG2[b.dataset.a], 'bad'); return; }
      phase = 'try';
      shell.msg('Да проверим! Включи причините една по една.', 'good');
      tryIt();
    }));
    function tryIt() {
      shell.task('Включвай и изключвай причините и гледай как се променя градът под крепостта.');
      const cc = shell.setControls(`<div class="col">${CAUSES.map((k, i) => `<button class="btn cause" data-i="${i}" aria-pressed="false">${esc(k.label)}</button>`).join('')}</div><div class="grow-bar" aria-hidden="true"><i></i></div><div class="small grow-lbl">Градът е малък</div>`);
      const on = [false, false, false];
      let done = false;
      cc.querySelectorAll('.cause').forEach((b) => b.addEventListener('click', () => {
        const i = +b.dataset.i;
        on[i] = !on[i];
        b.setAttribute('aria-pressed', on[i]); b.classList.toggle('primary', on[i]);
        world.setGrowth(i, on[i]);
        const n = on.filter(Boolean).length;
        cc.querySelector('.grow-bar i').style.width = `${(n / 3) * 100}%`;
        cc.querySelector('.grow-lbl').textContent = ['Градът е малък', 'Градът расте', 'Градът расте бързо', 'Градът е голям и богат'][n];
        if (on[i]) say(new THREE.Vector3(...CAUSES[i].at), esc(CAUSES[i].msg), { cls: 'wide', lift: 4 }); else clearTip();
        if (n === 3 && !done) {
          done = true;
          scores.push(stepScore(mistakes, 2));
          shell.msg('Храната, занаятите и търговията заедно правят града голям.', 'good');
          const nx = document.createElement('button'); nx.className = 'btn primary next'; nx.textContent = 'Напред →';
          cc.appendChild(nx);
          nx.addEventListener('click', () => { clearTip(); step3(); });
        }
      }));
    }
  }

  function step3() {
    shell.step(2);
    for (let i = 0; i < 3; i++) world.setGrowth(i, true);
    allowWalk(true);
    look(HOME[0], HOME[1], 1.4);
    let mistakes = 0, k = 0, miss = 0, busy = false;
    for (const p of places.values()) { p.wanted = p.id !== 'royals'; p.done = false; }
    const ask = () => {
      busy = false; miss = 0; selected = null; clearTip();
      shell.task(`Археолозите откриват <b data-find="${FINDS[k].target}">${esc(FINDS[k].t)}</b>. Щракни мястото в града, откъдето е находката. Можеш да го потърсиш и с разходка.`);
      shell.score(`Находки: ${k} от ${FINDS.length}`);
    };
    shell.setControls('');
    clickHandler = (id) => {
      if (id === 'royals') { showPlace(id); clearTip(); openTalk(); return; }
      if (busy) return;
      const f = FINDS[k], p = places.get(id);
      if (id !== f.target) {
        mistakes++; miss++;
        shell.msg(miss >= 2 ? f.hint : `Не е ${SPOTS.find((s) => s.id === id).label.toLowerCase()}. Помисли кой би използвал такъв предмет.`, 'bad');
        return;
      }
      busy = true; selected = id; p.done = true; p.wanted = false;
      shell.msg('Вярно!', 'good');
      say(p.group, esc(f.ok), { cls: 'good wide', lift: p.top + 1.5 });
      k++;
      shell.score(`Находки: ${k} от ${FINDS.length}`);
      if (k < FINDS.length) later(ask, 2200);
      else {
        scores.push(stepScore(mistakes, 4));
        const n = shell.setControls('<button class="btn primary">Напред →</button>');
        n.querySelector('button').addEventListener('click', () => { clearTip(); closeTalk(); selected = null; step4(); });
      }
    };
    ask();
  }

  function step4() {
    shell.step(3);
    shell.score('');
    clickHandler = null; hovered = null;
    for (const p of places.values()) { p.wanted = false; p.done = false; }
    allowWalk(false);
    look([-156, 18, 8], [-4, 26, 38], 1.5);
    let mistakes = 0, solved = false;
    shell.task('След 1230 г. цар Иван Асен II дава на търговците от Дубровник грамота: те могат да търгуват свободно в цялото царство. <b>Какво ще се случи в Търновград?</b>');
    const c = shell.setControls(`<div class="col">${PREDICT.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (solved) return;
      const p = PREDICT[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      solved = true;
      scores.push(stepScore(mistakes, 2));
      world.startCaravan();
      say(places.get('market').group, '<b>Така и става.</b> По пътищата идват кервани със стоки. Търговията носи богатство на града и на царството.', { cls: 'good wide', lift: 8 });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => { clearTip(); shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart); });
    }));
  }

  function restart() {
    timers.forEach(clearTimeout); timers = [];
    clearTip(); closeTalk(); asked.clear(); selected = null;
    world.resetCaravan();
    for (let i = 0; i < 3; i++) world.setGrowth(i, true, true);
    if (menu) menu.remove();
    setMode('top');
    look(HOME[0], HOME[1], 0.9);
    step1();
  }

  // Ако компютърът не смогва, сцената се облекчава сама: първо без сенки и релеф, после с по-малко точки.
  // (?q=high в адреса изключва това — за снимки и проверка.)
  let tier = new URLSearchParams(location.search).get('q') === 'high' ? -1 : 0, frames = 0, slow = 0, tLast = 0;
  stage.tick(() => {
    if (tier < 0 || tier > 1) return;
    const now = performance.now(), ms = now - tLast; tLast = now;
    if (++frames < 25) return; // първите кадри се бавят от зареждането
    if (ms > 45) slow++;
    if (frames < 60) return;
    if (slow > 21) {
      if (tier === 0) { stage.sun.castShadow = false; scene.traverse((o) => { if (o.material && o.material.bumpMap) { o.material.bumpMap = null; o.material.needsUpdate = true; } }); renderer.setPixelRatio(1); }
      else renderer.setPixelRatio(0.6);
      renderer.setSize(shell.stageEl.clientWidth, shell.stageEl.clientHeight);
      tier++;
    } else tier = 9;
    frames = 20; slow = 0;
  });

  step1();
  look(HOME[0], HOME[1], 2.6); // начален полет към града
  setTimeout(setTopLimits, 2700);
  container.__demo = { stage, places, walk, world, setMode, screenOf: (id) => stage.screenOf(id) };
  return { dispose() { closeTalk(); timers.forEach(clearTimeout); clearTimeout(modeTimer); if (menu) menu.remove(); toggle.remove(); map.remove(); walk.dispose(); stage.dispose(); } };
}
