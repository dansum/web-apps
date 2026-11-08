// 5.1.4 „Праисторията в българските земи“ — музейна зала: карта, витрини, разкопка на селищна могила.
// Стъпки: опознай → разкопай могилата (първо предскажи) → подреди по възраст → предскажи последицата от металите.
import { createStage, cornerMenu, mat, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';
import { createMap } from './hist/map.js';
import { createTimeline } from './hist/timeline.js';
import { createVitrina, FINDS } from './hist/vitrina.js';

// Факти по програмата за V клас (Тема 2. Праистория, 2.1.3) и общоприети в учебниците.
const SITES = [
  { id: 'kozarnika', label: 'Пещерата Козарника', short: 'Козарника', lon: 22.67, lat: 43.66, find: 'flint', findName: 'кремъчно сечиво',
    note: 'Пещера край Белоградчик. Тук са открити едни от най-старите следи от хора в Европа — каменни сечива.' },
  { id: 'bachokiro', label: 'Пещерата Бачо Киро', short: 'Бачо Киро', lon: 25.43, lat: 42.95, find: 'tooth', findName: 'висулка от мечи зъб',
    note: 'Пещера край Дряново. Тук живеят едни от първите съвременни хора в Европа — преди около 45 000 години. Носели са висулки от мечи зъби.' },
  { id: 'karanovo', label: 'Карановската селищна могила', short: 'Караново', lon: 25.91, lat: 42.51, find: 'pot', findName: 'глинен съд',
    note: 'Край Нова Загора. Първите земеделци се заселват тук преди около 8 000 години. Правят съдове от глина.' },
  { id: 'varna', label: 'Варненският некропол', short: 'Варна', lon: 27.92, lat: 43.21, find: 'bracelets', findName: 'златни накити',
    note: 'Некропол е старо гробище. Тук е намерено най-старото обработено злато в света — на около 6 500 години.' },
];
const LAYERS = [
  { color: 0xc7a77a, text: 'Горният слой: най-новите къщи. Построени са върху останките на по-старите.' },
  { color: 0xb08d5e, text: 'По-долу: срутени къщи от по-ранно време. Хората строят отново на същото място.' },
  { color: 0x9a7650, text: 'Още по-долу: глинени съдове и сечива на по-ранни жители.' },
  { color: 0x7f5f42, text: 'Най-долният слой е най-старият: тук са живели първите земеделци.' },
];
const PREDICT = [
  { t: 'Появяват се богати и знатни хора, които управляват другите.', ok: true },
  { t: 'Хората спират да отглеждат растения и животни.', ok: false, why: 'Не. Земеделието и скотовъдството остават главният поминък.' },
  { t: 'Всички хора стават еднакво богати.', ok: false, why: 'Точно обратното: в гробовете личи, че едни хора имат много повече от други.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай', 'Разкопай могилата', 'Подреди по възраст', 'Предскажи'] });
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const VIEW = [[0, 6.2 * far, 8.8 * far], [0, 0.8, far > 1 ? 1.4 : 0.8]];
  const stage = createStage(shell.stageEl, { background: 0xf3ead9, camPos: VIEW[0], target: VIEW[1], maxDistance: 30 });
  const { scene } = stage;

  // Зала: под, маса за картата.
  const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 11), mat(0xd9cdb5));
  floor.position.set(0, -0.05, 0.5);
  scene.add(floor);
  const table = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.5, 3.6), mat(0x6b4f36));
  table.position.set(0, 0.25, -1.4);
  scene.add(table);

  const vit = new Map();
  SITES.forEach((s, i) => {
    const v = createVitrina(stage, { id: `v-${s.id}`, x: -3.3 + i * 2.2, z: 1.9, label: s.short, item: FINDS[s.find](), plaque: s.findName });
    vit.set(s.id, v);
  });
  const grave = createVitrina(stage, { id: 'grave43', x: 0, z: -1.4, label: 'Гроб № 43, Варна' });
  grave.group.visible = false;

  // Селищна могила в разрез.
  const mound = new THREE.Group();
  mound.position.set(0, 0.5, -1.4);
  const layerMeshes = LAYERS.map((L, i) => {
    const h = 0.5;
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.0 + i * 0.35, h, 1.6), mat(L.color, { flat: true }));
    m.position.y = (LAYERS.length - 1 - i) * h + h / 2;
    m.userData = { pickId: `layer${i}`, homeY: m.position.y, index: i };
    // „Къщичка“ в слоя: малки стени.
    const hut = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.02), mat(0x5a4632));
    hut.position.set(-0.6 + i * 0.4, 0, 0.81);
    m.add(hut);
    mound.add(m);
    return m;
  });
  mound.visible = false;
  scene.add(mound);

  let map = null;
  let tl = null;
  let tip = null;
  const say = (anchor, html, opts = {}) => { if (tip) tip.remove(); tip = stage.bubble(anchor, html, { lift: 1.2, ...opts }); };
  const clearTip = () => { if (tip) { tip.remove(); tip = null; } };
  const scores = [];
  let menu = null;
  let clickHandler = null;
  let stopDrag = null;
  stage.onClick((hit) => clickHandler && clickHandler(hit ? hit.root.userData.pickId : null, hit));

  // Живот: прах във въздуха над масата (бавни частици).
  const dustPos = new Float32Array(360);
  for (let i = 0; i < dustPos.length; i += 3) { dustPos[i] = (Math.random() - 0.5) * 9; dustPos[i + 1] = Math.random() * 3 + 0.5; dustPos[i + 2] = (Math.random() - 0.5) * 6; }
  const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dustPos, 3)),
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.6 }));
  scene.add(dust);
  stage.tick((dt, t) => {
    const arr = dust.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) { arr[i + 1] += dt * 0.05; if (arr[i + 1] > 3.6) arr[i + 1] = 0.5; arr[i] += Math.sin(t + i) * dt * 0.02; }
    dust.geometry.attributes.position.needsUpdate = true;
  });

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    scores.length = 0;
    map.group.visible = true;
    shell.task('Разгледай четирите места на картата и находките във витрините. Избери всяко от менюто или кликни върху карфица или витрина.');
    const seen = new Set();
    const open = (id) => {
      const s = SITES.find((x) => x.id === id);
      if (!s) return;
      const v = vit.get(id).group;
      stage.focusOn(v, { dist: 4.2, height: 1.8, lift: 1, keepFollow: false });
      map.colorPlace(id, 0xf2b01e);
      say(v, `<b>${esc(s.label)}</b><br>${esc(s.note)}`, { cls: 'wide', lift: 2.2 });
      seen.add(id); menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${SITES.length}`);
      if (seen.size === SITES.length) {
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', () => { menu.show(false); clearTip(); step2(); });
      }
    };
    menu = cornerMenu(stage, { title: 'Разгледай', items: SITES.map((s) => ({ id: s.id, label: s.short, icon: '📍' })), onSelect: open });
    clickHandler = (id) => { if (!id) return; open(id.startsWith('v-') ? id.slice(2) : id); };
    shell.setControls('');
  }

  // ---------- 2. Разкопай могилата (първо предскажи) ----------
  function step2() {
    shell.step(1);
    shell.score('');
    for (const s of SITES) map.colorPlace(s.id);
    map.group.visible = false;
    mound.visible = true;
    stage.flyTo([0.6, 5.2 * far, 3.2 * far], [0.6, 1.2, -1.4], 1);
    say(mound, '<b>Карановската селищна могила</b> в разрез', { cls: 'tag', lift: 2.2 });
    let mistakes = 0;
    shell.task('Хората живеят на това място хиляди години и строят нови къщи върху старите. Така се издига могила. <b>Къде според теб са най-старите останки?</b>');
    const c = shell.setControls('<div class="row"><button class="btn" data-a="top">Най-горе</button><button class="btn" data-a="bottom">Най-долу</button></div>');
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.a === 'top') { mistakes++; b.disabled = true; shell.msg('Помисли: всяка нова къща се строи върху по-старата. Коя е била там първа?', 'bad'); return; }
      shell.msg('Да проверим! Разкопай могилата слой по слой.', 'good');
      dig(mistakes);
    }));
    function dig(m) {
      let next = 0;
      shell.task('Кликни върху горния слой, за да го разкопаеш. Продължи до най-долния.');
      shell.setControls('');
      clickHandler = (id) => {
        if (id !== `layer${next}`) { if (id && id.startsWith('layer')) shell.msg('Разкопава се отгоре надолу: кликни най-горния слой.', 'bad'); return; }
        const L = layerMeshes[next];
        const text = LAYERS[next].text;
        // Слоят се вдига и отива встрани, на реда с изкопаните.
        L.position.set(2.5, 0.15, -0.9 + next * 0.6);
        L.scale.set(0.3, 0.5, 0.3);
        say(L, esc(text), { cls: 'wide', lift: 0.5 });
        next++;
        if (next === LAYERS.length) {
          scores.push(stepScore(m, 1));
          shell.msg('Така е: колкото по-дълбоко копаем, толкова по-стари са останките.', 'good');
          const n = shell.setControls('<button class="btn primary">Напред →</button>');
          n.querySelector('button').addEventListener('click', () => { clearTip(); step3(); });
        }
      };
    }
  }

  // ---------- 3. Подреди по възраст ----------
  const ORDER = ['kozarnika', 'bachokiro', 'karanovo', 'varna'];
  function step3() {
    shell.step(2);
    mound.visible = false;
    map.group.visible = true;
    clickHandler = null;
    stage.flyTo([0, 5.6 * far, 10 * far], [0, 0.3, 3.4], 1);
    if (!tl) {
      tl = createTimeline(stage, { from: 0.5, to: 4.5, z: 4.1, length: 8, tick: 1000, centuryBands: false, color: 0x6b4f36 });
      ['1. Най-старо', '2.', '3.', '4. Най-ново'].forEach((l, i) => tl.addSlot(`s${i}`, { year: i + 1, label: l }));
      // Картите се показват в разбъркан ред.
      ['karanovo', 'kozarnika', 'varna', 'bachokiro'].forEach((id, i) => tl.addCard(id, { label: SITES.find((s) => s.id === id).short, x: -3.3 + i * 2.2, z: 5.5 }));
    }
    let mistakes = 0, placed = 0;
    shell.task('Подреди находките по възраст: <b>от най-старата към най-новата</b>. Завлечи всяко място на линията.');
    shell.setControls('');
    shell.score(`Подредени: 0 от ${ORDER.length}`);
    stopDrag = stage.enableDrag({
      planeY: 0.25,
      onDrop(obj) {
        const id = obj.userData.dragId;
        const slot = tl.slotAt(obj.position);
        if (!slot) { tl.sendHome(id); return; }
        if (`s${ORDER.indexOf(id)}` === slot) {
          tl.placeCard(id, slot); tl.markSlot(slot, 0x2fb36b); placed++;
          shell.score(`Подредени: ${placed} от ${ORDER.length}`);
          shell.msg('Вярно!', 'good');
          if (placed === ORDER.length) {
            stopDrag(); stopDrag = null;
            scores.push(stepScore(mistakes, 4));
            say(tl.slots.get('s0'), 'От пещерите до първите села и златото: хиляди години история в българските земи.', { cls: 'good wide' });
            const n = shell.setControls('<button class="btn primary">Напред →</button>');
            n.querySelector('button').addEventListener('click', () => { clearTip(); step4(); });
          }
        } else {
          mistakes++;
          tl.sendHome(id);
          const s = SITES.find((x) => x.id === id);
          shell.msg(`Не е тук. Спомни си: ${s.short} — ${s.findName}. Кое е било по-рано: пещерите, първите земеделци или златото?`, 'bad');
        }
      },
    });
  }

  // ---------- 4. Предскажи ----------
  function step4() {
    shell.step(3);
    shell.score('');
    map.group.visible = false;
    stage.flyTo([0, 3.8 * far, 4.8 * far], [0, 1.2, -1.4], 1);
    let mistakes = 0;
    shell.task('Хората се научават да добиват мед и да обработват злато. <b>Какво ще се промени в обществото според теб?</b>');
    const c = shell.setControls(`<div class="col">${PREDICT.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const p = PREDICT[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      scores.push(stepScore(mistakes, 2));
      grave.group.visible = true;
      const it = new THREE.Group();
      const sc = FINDS.scepter(); sc.position.x = -0.12;
      const br = FINDS.bracelets(); br.scale.setScalar(0.7); br.position.x = 0.15;
      it.add(sc, br);
      grave.setItem(it);
      grave.glow(0xffe08a);
      say(grave.group, '<b>Така и става.</b> В гроб № 43 във Варненския некропол е погребан мъж със златен скиптър и много златни накити. Вероятно е бил вожд. В други гробове почти няма предмети: едни хора вече са по-богати и по-знатни от други.', { cls: 'good wide', lift: 2.3 });
      shell.msg('Вярно предсказание!', 'good');
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
    if (tl) tl.reset();
    grave.group.visible = false; grave.glow(); grave.setItem(null);
    layerMeshes.forEach((m) => { m.position.set(0, m.userData.homeY, 0); m.scale.set(1, 1, 1); });
    mound.visible = false;
    if (menu) menu.remove();
    stage.flyTo(VIEW[0], VIEW[1], 0.8);
    step1();
  }

  shell.task('Зареждане на картата…');
  createMap(stage, { center: [25.3, 42.75], unitsPerDeg: 1.05, only: ['100'], sea: false, height: 0.06 }).then((m) => {
    map = m;
    map.group.position.set(0, 0.5, -1.4);
    for (const s of SITES) map.addPlace(s.id, { lon: s.lon, lat: s.lat, label: s.short });
    step1();
  }).catch((e) => shell.msg(`Картата не се зареди: ${e.message}`, 'bad'));

  container.__demo = { stage, get tl() { return tl; } };
  return { dispose() { if (stopDrag) stopDrag(); if (menu) menu.remove(); for (const v of vit.values()) v.dispose(); grave.dispose(); stage.dispose(); } };
}
